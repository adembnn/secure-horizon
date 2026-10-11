// pipeline/measure.mjs - replay of EXISTING case files through the shipped product and through pipeline/evaluate_plus.mjs.
// Usage : node pipeline/measure.mjs <cases.jsonl> [...] [--modes=product,detectors,live] [--json] [--fails=<mode>] [--skip=D1,D2] [--only=D1]
//   product   : server/server.mjs evaluate(body, local), untouched (what POST /check answers today).
//   detectors : evaluatePlus(body, local, { live: null })            -> product + detectors_adem, no chain fact.
//   live      : evaluatePlus(body, local, { live: <facts of the case> }) -> product + detectors + the facts context_live/provider.mjs would read.
//   suffixes  : +premise (options.intentPremise = 'warn') ; +known (what-if : the case's known_protocols list is shipped as local.knownSpenders) ;
//               +intent (the answer to the extension's question is replayed : pay / receive / asked / other + free text, never token / amount / counterparty)
//               +nolist (pipeline/known_protocols.json is not loaded)
//               +details (the case's whole Intent object is given : kind, token, amount, counterparty, free text)
//   full      : evaluatePlus fed with EVERYTHING the bench gives check_plus.mjs (used by parity.mjs).
// What the product receives is the convention of redteam/check_product.mjs : method, params, origin, chainId, from, address book and history.
// NOT given outside `full` : known_protocols, the declared intent, clipboard, simulation, quote, nft, sell_pool.
// Live-like facts (mode live), only for the addresses provider.extractTargets() would look up (8 addresses, 4 tokens) :
//   isContract, ageBlocks <- counterparty_facts / token_info ; symbol, decimals <- token_registry / token_info ; firstSeenByUser <- local book + outgoing history ;
//   balance <- share_of_balance_pct of the case (the provider reads the native balance and the balance of the tokens it identifies ; the share is
//   given here whenever the case states it : a slight over-approximation, stated in RESULTATS_INTEGRATION.md).
// The case's own clock (intent.declaredAt) replaces Date.now() during a case. Any path matching V2_TEST is refused. Nothing is written.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeEvaluatePlus, loadNodeDeps, benchLevel } from './evaluate_plus.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '..');
const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const { normalizeCase } = await import(pathToFileURL(join(ROOT, 'redteam', 'normalize_v2.mjs')).href);
const P = await import(pathToFileURL(join(ROOT, 'context_live', 'provider.mjs')).href);
export const D = await loadNodeDeps();

export function readCases(file) {
  if (/V2_TEST/i.test(file)) { console.error('Refus : V2_TEST est gelé.'); process.exit(2); }
  const src = file.split(/[\\/]/).pop();
  return readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).map((line, i) => {
    if (!line.trim()) return null;
    try { const c = normalizeCase(JSON.parse(line)); return { c, id: c.id ?? `${src}:${i + 1}`, src }; } catch { return { c: null, id: `${src}:${i + 1}`, src }; }
  }).filter(Boolean);
}
export const familyKey = (src, c) => (src.startsWith('jury') ? src.replace(/\.jsonl$/, '') + ':' : '') + (c.family || '?') + '/' + (c.subfamily || '?');

export function productInput(c, { known = false } = {}) {
  const k = c.context || {};
  let origin = typeof k.origin === 'string' ? k.origin : undefined;
  if (origin && !/^[a-z][a-z0-9+.-]*:/i.test(origin)) origin = 'https://' + origin;
  const body = { method: c.request.method, params: c.request.params, origin, chainId: k.chainId, from: k.victim };
  const local = {
    contacts: (Array.isArray(k.address_book) ? k.address_book : []).filter((b) => b && HEX20.test(String(b.address))).map((b) => ({ address: lc(b.address), label: String(b.label || '') })),
    history: (Array.isArray(k.history) ? k.history : []).filter((h) => h && HEX20.test(String(h.address))),
    protected: [], knownSpenders: known ? (Array.isArray(k.known_protocols) ? k.known_protocols : []).filter((p) => p && HEX20.test(String(p.address))).map((p) => lc(p.address)) : [],
  };
  return { body, local };
}
// facts the live provider would return (shape of provider.toEngineContext)
export function liveLike(c, body, local) {
  const k = c.context || {};
  const T = P.extractTargets({ method: body.method, params: body.params }, body.from);
  const cps = T.counterparties.slice(0, P.DEFAULTS.maxCounterparties), tokens = T.tokens.slice(0, P.DEFAULTS.maxTokens);
  const facts = {}; for (const [a, v] of Object.entries(k.counterparty_facts || {})) if (v && typeof v === 'object') facts[lc(a)] = v;
  const tinfo = {}; for (const [a, v] of Object.entries(k.token_info || {})) if (v && typeof v === 'object') tinfo[lc(a)] = v;
  const reg = {}, bySymbol = {}; for (const t of k.token_registry || []) { reg[lc(t.address)] = t; bySymbol[t.symbol] = t.decimals; }
  const hasCode = new Set([...(k.known_protocols || []).map((p) => lc(p.address)), ...Object.keys(reg), ...Object.keys(tinfo)]);
  const hasLocal = local.contacts.length || local.history.length;
  const seen = hasLocal ? new Set([...local.contacts.map((b) => b.address), ...local.history.filter((h) => h.direction === 'sortie').map((h) => lc(h.address))]) : null;
  const L = { isContract: {}, ageBlocks: {}, balances: {}, tokenMeta: {}, facts: {}, tokenInfo: {}, allowances: {}, missing: [], source: 'provider' };
  for (const a of cps) {
    const v = {};
    const code = facts[a] && facts[a].isContract !== undefined ? !!facts[a].isContract : hasCode.has(a) ? true : undefined;
    if (code !== undefined) { L.isContract[a] = code; v.isContract = code; } else L.missing.push('isContract:' + a);
    if (code !== false) {
      const age = facts[a] && Number.isFinite(facts[a].ageBlocks) ? facts[a].ageBlocks : tinfo[a] && Number.isFinite(tinfo[a].ageBlocks) ? tinfo[a].ageBlocks : undefined;
      if (age !== undefined) { L.ageBlocks[a] = age; v.ageBlocks = age; } else L.missing.push('age:' + a);
    }
    if (seen) v.firstSeenByUser = !seen.has(a); else L.missing.push('firstSeenByUser:' + a);
    L.facts[a] = v;
  }
  for (const t of tokens) {
    const m = reg[t] ? { symbol: reg[t].symbol, decimals: reg[t].decimals } : tinfo[t] && tinfo[t].symbol !== undefined ? { symbol: tinfo[t].symbol, decimals: bySymbol[tinfo[t].symbol] ?? 18 } : null;
    if (!m) { L.missing.push('token.symbol:' + t); continue; }
    L.tokenMeta[t] = m; L.tokenInfo[t] = { ...m, ...(L.ageBlocks[t] !== undefined ? { ageBlocks: L.ageBlocks[t] } : {}) };
  }
  if (Number(k.share_of_balance_pct) > 0) L.sharePct = Number(k.share_of_balance_pct); else L.missing.push('signer.balance');
  return L;
}
// everything the bench hands to check_plus.mjs buildCtx, as facts (parity)
export function fullFacts(c) {
  const k = c.context || {};
  const tokenMeta = {}, bySymbol = {};
  for (const t of k.token_registry || []) { tokenMeta[lc(t.address)] = { symbol: t.symbol, decimals: t.decimals, stable: ['USDC', 'USDT', 'DAI'].includes(t.symbol) }; bySymbol[t.symbol] = t.decimals; }
  const tokenInfo = {};
  for (const [a, v] of Object.entries(k.token_info || {})) { tokenInfo[lc(a)] = v; if (!tokenMeta[lc(a)]) tokenMeta[lc(a)] = { symbol: v.symbol, decimals: bySymbol[v.symbol] ?? 18 }; }
  return { facts: k.counterparty_facts || {}, tokenMeta, tokenInfo, sharePct: k.share_of_balance_pct, extra: k, missing: [], source: 'bench' };
}
export async function atCaseTime(c, fn) {
  const t = c.intent && Number.isFinite(c.intent.declaredAt) ? c.intent.declaredAt : 1760000000000;
  const real = Date.now; Date.now = () => t;
  try { return await fn(); } finally { Date.now = real; }
}

const cache = new Map();
const runner = (detectors) => { const k = detectors.map((d) => d.id).join(','); if (!cache.has(k)) cache.set(k, makeEvaluatePlus({ ...D, DETECTORS: detectors })); return cache.get(k); };
// -> { level (bench scale), v (product-shaped answer), ms }
export async function runCase(c, mode, { detectors = D.DETECTORS } = {}) {
  if (!c.request || typeof c.request !== 'object') return { level: 'unknown', v: null, ms: 0 };
  const t0 = performance.now();
  let v;
  const [base, ...fl] = mode.split('+'); const known = fl.includes('known');
  const withIntent = (body) => { if (fl.includes('intent') && c.intent && typeof c.intent === 'object') { body.intent = { pay_someone: 'pay', connect_or_accept_offer: 'receive', asked_by_someone: 'asked' }[c.intent.kind] || 'other'; if (typeof c.intent.freeText === 'string') body.intent_text = c.intent.freeText; } return body; };
  const o = { intentPremise: fl.includes('premise') ? 'warn' : 'strict', knownProtocols: !fl.includes('nolist') };
  if (base === 'product') { const { body, local } = productInput(c, { known }); withIntent(body); v = await atCaseTime(c, () => D.evaluate(body, local)); }
  else if (base === 'full') { const { body, local } = productInput(c, { known: true }); v = await atCaseTime(c, () => runner(detectors)(body, local, { live: fullFacts(c), intent: c.intent || {} })); }
  else { const { body, local } = productInput(c, { known }); withIntent(body); v = await atCaseTime(c, () => runner(detectors)(body, local, { ...o, live: base === 'live' ? liveLike(c, body, local) : null, ...(fl.includes('details') ? { intent: c.intent || {} } : {}) })); }
  return { level: benchLevel(v), v, ms: performance.now() - t0 };
}
export const pct = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] * 100) / 100; };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3).split(',').filter(Boolean);
  const files = args.filter((a) => !a.startsWith('--'));
  const modes = opt('modes').length ? opt('modes') : ['product', 'detectors', 'live'];
  const failsMode = opt('fails')[0];
  let detectors = D.DETECTORS; if (opt('only').length) detectors = detectors.filter((d) => opt('only').includes(d.id)); if (opt('skip').length) detectors = detectors.filter((d) => !opt('skip').includes(d.id));
  if (!files.length) { console.error('Usage : node pipeline/measure.mjs <fichier.jsonl> [...] [--modes=product,detectors,live,full] [--json] [--fails=<mode>]'); process.exit(2); }
  // warm-up (first engine call is slow) : not counted
  await runCase({ request: { method: 'eth_sendTransaction', params: [{ from: '0x' + '1'.repeat(40), to: '0x' + '2'.repeat(40), value: '0x1', data: '0x' }] }, context: { chainId: 1 }, intent: {} }, 'detectors');
  const out = {}; const tot = {};
  for (const file of files) {
    const cases = readCases(file); const name = file.split(/[\\/]/).pop();
    out[name] = {};
    for (const mode of modes) {
      const s = { n: 0, malveillant: 0, benin: 0, ratees: 0, fausses_alertes: 0, warn_benins: 0, unknown: 0, drift: 0, errors: 0 }; const lat = [];
      for (const { c, id, src } of cases) {
        s.n++; if (!c) { s.unknown++; continue; }
        let r; try { r = await runCase(c, mode, { detectors }); } catch (e) { r = { level: 'unknown', v: null, ms: 0 }; s.errors++; }
        lat.push(r.ms); if (r.level === 'unknown') s.unknown++;
        if (r.v && r.v.plus) { if (r.v.plus.errors.length) s.errors++; if (mode.startsWith('detectors+nolist') && r.v.plus.base !== r.v.plus.product) s.drift++; }
        const bad = (c.label === 'malveillant' && r.level !== 'critical') ? 'arnaque_ratee' : (c.label === 'benin' && r.level === 'critical') ? 'fausse_alerte' : null;
        if (c.label === 'malveillant') { s.malveillant++; if (bad) s.ratees++; }
        else if (c.label === 'benin') { s.benin++; if (bad) s.fausses_alertes++; else if (r.level === 'warn') s.warn_benins++; }
        if (bad && failsMode === mode) console.log(JSON.stringify({ type: bad, id, family: familyKey(src, c), level: r.level, fiche: r.v && r.v.fiche, codes: r.v && r.v.codes, raisedBy: r.v && r.v.plus && r.v.plus.raisedBy, signals: r.v && r.v.plus && r.v.plus.signals }));
      }
      s.p50_ms = pct(lat, 50); s.p95_ms = pct(lat, 95);
      out[name][mode] = s;
      const t = (tot[mode] ??= { n: 0, malveillant: 0, benin: 0, ratees: 0, fausses_alertes: 0, warn_benins: 0, unknown: 0, drift: 0, errors: 0, lat: [] });
      for (const k of Object.keys(s)) if (k in t && k !== 'lat') t[k] += s[k];
      t.lat.push(...lat);
    }
  }
  for (const m of Object.keys(tot)) { tot[m].p50_ms = pct(tot[m].lat, 50); tot[m].p95_ms = pct(tot[m].lat, 95); delete tot[m].lat; }
  out.TOTAL = tot;
  if (args.includes('--json')) console.log(JSON.stringify(out, null, 1));
  else if (!failsMode) {
    console.log('fichier | mode | n | arnaques | ratées | bénins | fausses alertes | warn bénins | inconnus | p50 ms | p95 ms | dérive | erreurs');
    for (const [f, ms] of Object.entries(out)) for (const [m, s] of Object.entries(ms)) console.log(`${f} | ${m} | ${s.n} | ${s.malveillant} | ${s.ratees} | ${s.benin} | ${s.fausses_alertes} | ${s.warn_benins} | ${s.unknown} | ${s.p50_ms} | ${s.p95_ms} | ${s.drift} | ${s.errors}`);
  }
}

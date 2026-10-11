// check_product.mjs - the HONEST measurement: every case goes through the pipeline that really ships, with only what
// the product knows at signing time. Bench recall (check.mjs / check_plus.mjs) is NOT product recall: the bench hands the
// rules a rich per-case context that the product does not have.
//
// Usage : node redteam/check_product.mjs <cases.jsonl> [more.jsonl ...] [--quiet] [--report] [--fails]
//                                         [--live-like] [--live-fields=code,age,balances,tokens,seen] [--with-detectors]
//                                         [--with-intent] [--with-known-protocols] [--only=D1,D2] [--skip=D1]
//   (no flag)        : product today. `evaluate(body, local)` imported from server/server.mjs, untouched.
//   --live-like      : product + live context. The pipeline is server/server.mjs + context_live/server_integration.diff
//                      (built on the fly, nothing is written in the repo) and receives the facts context_live/provider.mjs
//                      WOULD return, taken from the case for exactly those fields. See "Live-like facts" below.
//   --live-fields=   : subset of live facts to feed (ablation). Default: all five.
//   --with-detectors : also apply detectors_adem/index.mjs on top, on the product's own decoded effects and context.
//   --with-intent    : also replay the answer to the extension's intent question (see "Intent"). Off by default.
//   --with-known-protocols : what-if, off by default: the case's known_protocols list is given as local.knownSpenders,
//                      i.e. the product ships a per-chain list of known protocols (context.local.json already has the field).
//   --quiet / --report / --fails : same meaning and same output format as redteam/check_plus.mjs.
//   Files in the v2 schema are normalized on the fly (normalize_v2.mjs). Any path matching V2_TEST is refused (frozen set).
//
// Which pipeline : server/server.mjs `evaluate`. It is the function behind POST /check of the shipped local server and it
//   is importable as is. extension_standalone/src/sentinelle_core.js `evaluate` is the same chain (engine -> comparator ->
//   policy -> texts, same offline buildCtx) bundled for a service worker; its imports only resolve inside the built
//   extension, so it is not the one measured here.
//
// What the product receives (nothing else is read from the case `context`):
//   body.method / body.params : the JSON-RPC request
//   body.origin               : context.origin (a bare host name becomes https://host, as location.origin would give)
//   body.chainId              : context.chainId        body.from : context.victim
//   local.contacts            : context.address_book   local.history : context.history  (what a user may have typed in options)
//   clock                     : the case's own time (intent.declaredAt), so deadlines and history ages mean what the case meant
//   NOT given : known_protocols, token_registry, counterparty_facts, token_info, share_of_balance_pct, quote, claimed_site,
//               clipboard, simulation, nft, sell_pool, page text, and the intent (unless --with-intent).
//
// Product level -> bench scale (ok / warn / critical / unknown). The score rule is the bench's: a scam is caught only
// when the user sees a red screen.
//   danger        -> critical
//   manipulation  -> critical   (red screen with the pressure quote; needs page text, which no bench case carries)
//   attention     -> warn when the product's own `niveau` is warn, ok when it is info (the product has no "ok": info is its lowest)
//   unknown       -> warn when the effects were decoded but unreadable (fiche F25, "not verified", orange);
//                    unknown when the analysis itself failed (method not handled, unreadable request)
//
// Live-like facts (--live-like). Only for the addresses provider.extractTargets() would look up (same caps: 8 addresses,
// 4 tokens), and only these fields:
//   code     : isContract  <- counterparty_facts[a].isContract, else true for an address the case lists as a protocol or a token
//   age      : ageBlocks   <- counterparty_facts[a].ageBlocks, else token_info[a].ageBlocks (contracts only)
//   tokens   : symbol / decimals <- token_registry, else token_info ; ageBlocks as above
//   balances : signer balance of the largest outgoing asset, derived from share_of_balance_pct exactly as the bench does
//              (native always; an ERC-20 only when the provider identifies it as a token of the request)
//   seen     : firstSeenByUser <- local address book + outgoing history (never the case's own flag)
//   A fact the case does not state stays unknown. known_protocols is NOT a chain fact and is not given.
//
// Intent (--with-intent). The extension asks one question (pay / receive / login / asked / other) plus free text; the
//   server keeps only the kind and the text. Mapping from the case: pay_someone -> pay, connect_or_accept_offer -> receive,
//   asked_by_someone -> asked, anything else -> other (= no intent). token / amount / counterparty are never passed.
//
// Read-only: no network, no file written in the repo (the patched pipeline lives in the OS temp dir and is removed on exit).
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const imp = (p) => import(pathToFileURL(p).href);
const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const RANK = { ok: 0, warn: 1, critical: 2 };
const LIVE_FIELDS = ['code', 'age', 'balances', 'tokens', 'seen'];

const args = process.argv.slice(2);
const opt = (name) => (args.find((a) => a.startsWith(`--${name}=`)) || '').slice(name.length + 3).split(',').filter(Boolean);
const OPT = {
  report: args.includes('--report'), quiet: args.includes('--quiet'), fails: args.includes('--fails'),
  live: args.includes('--live-like') || args.some((a) => a.startsWith('--live-fields=')), detectors: args.includes('--with-detectors'), intent: args.includes('--with-intent'), known: args.includes('--with-known-protocols'),
  fields: new Set(opt('live-fields').length ? opt('live-fields') : LIVE_FIELDS), only: opt('only'), skip: opt('skip'),
};
const files = args.filter((a) => !a.startsWith('--'));
if (!files.length) { console.error('Usage : node check_product.mjs <fichier.jsonl> [...] [--quiet] [--report] [--fails] [--live-like] [--live-fields=..] [--with-detectors] [--with-intent] [--with-known-protocols]'); process.exit(2); }
for (const f of files) if (/V2_TEST/i.test(f)) { console.error('Refus : V2_TEST est gelé.'); process.exit(2); }
for (const f of OPT.fields) if (!LIVE_FIELDS.includes(f)) { console.error(`--live-fields : champ inconnu "${f}" (attendu : ${LIVE_FIELDS.join(', ')})`); process.exit(2); }

// ------------------------------------------------------------------ pipelines
const SERVER = join(ROOT, 'server', 'server.mjs');
const { evaluate: evaluateToday } = await imp(SERVER);
const { normalizeCase } = await imp(join(HERE, 'normalize_v2.mjs'));

// server/server.mjs + server_integration.diff, plus one probe line exposing the decoded effects to the detectors.
// Built from the files on disk at every run, so it follows whatever their owners change; it fails loudly if the diff no longer applies.
async function loadPatched() {
  const dir = mkdtempSync(join(tmpdir(), 'holdup-check-product-'));
  process.on('exit', () => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ } });
  mkdirSync(join(dir, 'server'));
  writeFileSync(join(dir, 'server', 'server.mjs'), readFileSync(SERVER));
  const diff = join(ROOT, 'context_live', 'server_integration.diff');
  const r = spawnSync('git', ['apply', '-p1', diff], { cwd: dir, encoding: 'utf8' });
  if (r.error || r.status !== 0) { console.error('context_live/server_integration.diff ne s\'applique plus à server/server.mjs : ' + String((r.error && r.error.message) || r.stderr).trim()); process.exit(2); }
  let src = readFileSync(join(dir, 'server', 'server.mjs'), 'utf8');
  const once = (from, to, what) => { if (src.split(from).length !== 2) { console.error('check_product : ancre introuvable dans server.mjs (' + what + ')'); process.exit(2); } src = src.replace(from, () => to); };
  once('const HERE = dirname(fileURLToPath(import.meta.url));', 'const HERE = ' + JSON.stringify(join(ROOT, 'server')) + ';', 'HERE');
  once('const ctx = buildCtx(body, local, from, chainId, live);', 'const ctx = buildCtx(body, local, from, chainId, live); evaluate.probe = { ctx };', 'buildCtx');
  once('pol = applyPolicy({ eff, adem, ctx, intent, request: { method, params } });', 'evaluate.probe.eff = eff; pol = applyPolicy({ eff, adem, ctx, intent, request: { method, params } }); Object.assign(evaluate.probe, { adem, pol, intent });', 'applyPolicy');
  const out = join(dir, 'server_live.mjs');
  writeFileSync(out, src);
  return (await imp(out)).evaluate;
}
const needPatched = OPT.live || OPT.detectors;
const evaluatePatched = needPatched ? await loadPatched() : null;
const P = OPT.live ? await imp(join(ROOT, 'context_live', 'provider.mjs')) : null;
const DETECTORS = OPT.detectors ? (await imp(join(ROOT, 'detectors_adem', 'index.mjs'))).DETECTORS : [];

// ------------------------------------------------------------------ case -> what the product receives
function productInput(c) {
  const k = c.context || {};
  const { method, params } = c.request;
  let origin = typeof k.origin === 'string' ? k.origin : undefined;
  if (origin && !/^[a-z][a-z0-9+.-]*:/i.test(origin)) origin = 'https://' + origin;
  const body = { method, params, origin, chainId: k.chainId, from: k.victim };
  if (OPT.intent && c.intent && typeof c.intent === 'object') {
    const choice = { pay_someone: 'pay', connect_or_accept_offer: 'receive', asked_by_someone: 'asked' }[c.intent.kind] || 'other';
    body.intent = choice; if (typeof c.intent.freeText === 'string') body.intent_text = c.intent.freeText;
  }
  // same filter as server.mjs loadLocalContext
  const local = {
    contacts: (Array.isArray(k.address_book) ? k.address_book : []).filter((b) => b && HEX20.test(String(b.address))).map((b) => ({ address: lc(b.address), label: String(b.label || '') })),
    history: (Array.isArray(k.history) ? k.history : []).filter((h) => h && HEX20.test(String(h.address))),
    protected: [], knownSpenders: OPT.known ? (Array.isArray(k.known_protocols) ? k.known_protocols : []).filter((p) => p && HEX20.test(String(p.address))).map((p) => lc(p.address)) : [],
  };
  return { body, local };
}

// The case's own clock replaces Date.now() while the product runs (the product has no clock parameter).
function atCaseTime(c, fn) {
  const t = c.intent && Number.isFinite(c.intent.declaredAt) ? c.intent.declaredAt : 1760000000000;
  const real = Date.now; Date.now = () => t;
  try { return fn(); } finally { Date.now = real; }
}

// Facts the live provider would return, in the shape of provider.toEngineContext(). `eff` (decoded by the product itself
// on a first pass) is only used to turn share_of_balance_pct into the balance the provider would have read.
function liveLike(c, body, local, eff) {
  const k = c.context || {}, F = OPT.fields;
  const T = P.extractTargets({ method: body.method, params: body.params }, body.from);
  const cps = T.counterparties.slice(0, P.DEFAULTS.maxCounterparties), tokens = T.tokens.slice(0, P.DEFAULTS.maxTokens);
  const facts = {}; for (const [a, v] of Object.entries(k.counterparty_facts || {})) if (v && typeof v === 'object') facts[lc(a)] = v;
  const tinfo = {}; for (const [a, v] of Object.entries(k.token_info || {})) if (v && typeof v === 'object') tinfo[lc(a)] = v;
  const reg = {}, bySymbol = {}; for (const t of k.token_registry || []) { reg[lc(t.address)] = t; bySymbol[t.symbol] = t.decimals; }
  const hasCode = new Set([...(k.known_protocols || []).map((p) => lc(p.address)), ...Object.keys(reg), ...Object.keys(tinfo)]);
  const hasLocal = local.contacts.length || local.history.length;
  const seen = hasLocal ? new Set([...local.contacts.map((b) => b.address), ...local.history.filter((h) => h.direction === 'sortie').map((h) => lc(h.address))]) : null;
  const L = { isContract: {}, ageBlocks: {}, balances: {}, tokenMeta: {}, facts: {}, tokenInfo: {}, allowances: {}, nonce: undefined, missing: [] };
  for (const a of cps) {
    const v = {};
    const code = facts[a] && facts[a].isContract !== undefined ? !!facts[a].isContract : hasCode.has(a) ? true : undefined;
    if (F.has('code')) { if (code !== undefined) { L.isContract[a] = code; v.isContract = code; } else L.missing.push('isContract:' + a); }
    if (F.has('age') && code !== false) {
      const age = facts[a] && Number.isFinite(facts[a].ageBlocks) ? facts[a].ageBlocks : tinfo[a] && Number.isFinite(tinfo[a].ageBlocks) ? tinfo[a].ageBlocks : undefined;
      if (age !== undefined) { L.ageBlocks[a] = age; v.ageBlocks = age; } else L.missing.push('age:' + a);
    }
    if (F.has('seen')) { if (seen) v.firstSeenByUser = !seen.has(a); else L.missing.push('firstSeenByUser:' + a); }
    L.facts[a] = v;
  }
  if (F.has('tokens')) for (const t of tokens) {
    const m = reg[t] ? { symbol: reg[t].symbol, decimals: reg[t].decimals } : tinfo[t] && tinfo[t].symbol !== undefined ? { symbol: tinfo[t].symbol, decimals: bySymbol[tinfo[t].symbol] ?? 18 } : null;
    if (!m) { L.missing.push('token.symbol:' + t); continue; }
    L.tokenMeta[t] = m; L.tokenInfo[t] = { ...m, ...(L.ageBlocks[t] !== undefined ? { ageBlocks: L.ageBlocks[t] } : {}) };
  }
  if (F.has('balances') && eff && Number(k.share_of_balance_pct) > 0 && (eff.outgoing || []).length) {
    try {
      const o = eff.outgoing.reduce((m, x) => (BigInt(x.amountRaw) > BigInt(m.amountRaw) ? x : m));
      const pct100 = BigInt(Math.round(Number(k.share_of_balance_pct) * 100));
      const tok = lc(o.token);
      if (pct100 > 0n && (tok === 'native' || tokens.includes(tok))) L.balances[tok] = ((BigInt(o.amountRaw) * 10000n) / pct100).toString();
    } catch { /* amount not numeric : balance stays unknown */ }
  }
  return L;
}

// product answer -> bench scale (see header)
function benchLevel(v) {
  if (!v || typeof v !== 'object') return 'unknown';
  if (v.level === 'danger' || v.level === 'manipulation') return 'critical';
  if (v.level === 'unknown') return (v.raisons || []).some((r) => r.code === 'unverifiable') ? 'unknown' : 'warn';
  return v.niveau === 'warn' ? 'warn' : v.niveau === 'critical' ? 'critical' : 'ok';
}
const reasonsOf = (v) => (v && Array.isArray(v.raisons) ? v.raisons.map((r) => `[${r.severity || 'intention'}] ${r.code}${r.detail ? ' : ' + r.detail : r.does ? ' : ' + r.does : ''}`) : []);

let parityMismatch = 0;
async function check(c, fallbackId) {
  const t0 = performance.now();
  const out = { id: c.id ?? fallbackId };
  try {
    if (!c.request || typeof c.request !== 'object') throw new Error('champ `request` absent');
    const { body, local } = productInput(c);
    const today = atCaseTime(c, () => evaluateToday(body, local));
    let v = today, probe = null;
    out.level_base = benchLevel(today);
    if (evaluatePatched) {
      const run = (live) => { evaluatePatched.probe = null; const r = atCaseTime(c, () => evaluatePatched(body, local, live)); return { r, probe: evaluatePatched.probe || {} }; };
      let x = run(null);
      if (x.r.level !== today.level || x.r.niveau !== today.niveau) parityMismatch++; // the patch must change nothing when no live fact is given
      if (OPT.live) {
        x = run(liveLike(c, body, local, null));
        const L2 = liveLike(c, body, local, x.probe.eff);
        if (Object.keys(L2.balances).length) x = run(L2);
        out.context_missing = L2.missing.length;
      }
      v = x.r; probe = x.probe;
    }
    out.level_final = benchLevel(v);
    out.product = { level: v.level, niveau: v.niveau, fiche: v.fiche };
    out.reasons = reasonsOf(v);
    if (v.why) out.why = v.why;
    if (OPT.detectors) {
      // The detectors see the product's context and a case stripped to what the product has: no bench-only field.
      const k = c.context || {};
      const cP = { id: c.id, request: c.request, intent: probe.intent || {}, context: { chainId: k.chainId, victim: k.victim, origin: body.origin, address_book: k.address_book || [], history: k.history || [] } };
      const lowers = []; let ademCritical = false;
      for (const d of DETECTORS) {
        if (OPT.only.length && !OPT.only.includes(d.id)) continue;
        if (OPT.skip.includes(d.id)) continue;
        let r; try { r = await d.run({ c: cP, ctx: probe.ctx, eff: probe.eff || null, request: c.request, intent: cP.intent, level: out.level_final, reasons: out.reasons, adem: probe.adem, policy: probe.pol }); } catch (e) { out.reasons.push(`[adem-error] ${d.id} : ${e.message}`); continue; }
        if (!r) continue;
        for (const f of r.flags || []) {
          out.reasons.push(`[adem:${f.severity}] ${d.id}/${f.code} : ${f.detail}`);
          const cur = out.level_final === 'unknown' ? -1 : RANK[out.level_final];
          if (RANK[f.severity] > cur) out.level_final = f.severity;
        }
        if (r.lower) lowers.push({ id: d.id, ...r.lower });
        if ((r.flags || []).some((f) => f.severity === 'critical')) ademCritical = true;
      }
      for (const l of lowers) if (!ademCritical && RANK[l.to] < RANK[out.level_final]) { out.reasons.push(`[adem-fix] ${l.id} : ${out.level_final} -> ${l.to} : ${l.why}`); out.level_final = l.to; }
    }
  } catch (e) {
    out.level_final = 'unknown'; out.level_base ??= 'unknown'; out.reasons = [];
    out.error = String(e.stack || e).split('\n').slice(0, 2).join(' | ');
  }
  out.ms = Math.round((performance.now() - t0) * 100) / 100;
  return out;
}

// ------------------------------------------------------------------ main (same accounting and same output as check_plus.mjs)
const mode = 'produit' + (OPT.live ? ' + contexte live (' + [...OPT.fields].join(',') + ')' : ' aujourd\'hui') + (OPT.detectors ? ' + detecteurs' : '') + (OPT.intent ? ' + intention' : '') + (OPT.known ? ' + protocoles connus' : '');
const failures = [];
const sum = { n: 0, n_labeled: 0, n_malveillant: 0, n_benin: 0, arnaques_ratees: 0, fausses_alertes: 0, warn_benins: 0, unknown: 0 };
const fam = {};
let anyLabel = false;
for (const file of files) {
  let text; try { text = readFileSync(file, 'utf8'); } catch (e) { console.error(`Lecture impossible : ${e.message}`); process.exit(2); }
  const src = file.split(/[\\/]/).pop();
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const fallbackId = `${src}:${i + 1}`;
    let c;
    try { c = normalizeCase(JSON.parse(line)); } catch (e) { sum.n++; sum.unknown++; if (!OPT.report && !OPT.quiet) console.log(JSON.stringify({ id: fallbackId, level_final: 'unknown', error: `JSON invalide : ${e.message}` })); continue; }
    const r = await check(c, fallbackId);
    if (!OPT.report && !OPT.quiet && !OPT.fails) console.log(JSON.stringify(r));
    sum.n++; if (r.level_final === 'unknown') sum.unknown++;
    if (c.label === undefined) continue;
    anyLabel = true; sum.n_labeled++;
    const key = (src.startsWith('jury') ? src.replace(/\.jsonl$/, '') + ':' : '') + (c.family || '?') + '/' + (c.subfamily || '?');
    const F = (fam[key] ??= { label: c.label, n: 0, ratees: 0, fa: 0, warn: 0, ok: 0, crit: 0, gained: 0, lost: 0 });
    F.n++; if (r.level_final === 'critical') F.crit++; else if (r.level_final === 'warn') F.warn++; else F.ok++;
    if (c.label === 'malveillant') {
      sum.n_malveillant++;
      if (r.level_final !== 'critical') { sum.arnaques_ratees++; F.ratees++; failures.push({ type: 'arnaque_ratee', id: r.id, family: key, level_final: r.level_final, reasons: r.reasons }); }
      else if (r.level_base !== 'critical') F.gained++;
    } else if (c.label === 'benin') {
      sum.n_benin++;
      if (r.level_final === 'critical') { sum.fausses_alertes++; F.fa++; failures.push({ type: 'fausse_alerte', id: r.id, family: key, level_final: r.level_final, reasons: r.reasons }); if (r.level_base !== 'critical') F.lost++; }
      else if (r.level_final === 'warn') sum.warn_benins++;
    }
  }
}
const extra = { mode, ...(needPatched ? { parity_mismatch: parityMismatch } : {}) };
if (OPT.fails) for (const f of failures) console.log(JSON.stringify(f));
if (OPT.report) {
  const rows = Object.entries(fam).sort((a, b) => a[0].localeCompare(b[0]));
  // +gagnes / -perdus are relative to the product today (scams newly caught / benign newly red)
  console.log('label           | n    | ratees | f_alertes | warn | ok   | crit | +gagnes | -perdus | famille/sous-famille');
  for (const [k, F] of rows) console.log(`${F.label.padEnd(15)} | ${String(F.n).padEnd(4)} | ${String(F.ratees).padEnd(6)} | ${String(F.fa).padEnd(9)} | ${String(F.warn).padEnd(4)} | ${String(F.ok).padEnd(4)} | ${String(F.crit).padEnd(4)} | ${String(F.gained).padEnd(7)} | ${String(F.lost).padEnd(7)} | ${k}`);
  console.log(JSON.stringify({ summary: { ...sum, ...extra } }));
} else if (anyLabel) {
  console.log(JSON.stringify({ summary: { ...sum, ...extra, regle: 'arnaque ratee = malveillant sans critical ; fausse alerte = benin en critical ; warn_benins = fatigue', ...(OPT.quiet || OPT.fails ? {} : { echecs: failures }) } }));
}

// check.mjs - black-box CLI around the real Hold up engine, for red team agents.
// Usage : node redteam/check.mjs <cases.jsonl>   (one case per line: request, context, intent, optional id/label/expected_severity)
// Output: one JSON line per case {id, level_final, level_sans_intention, reasons, unsupported?, error?, ms},
//         then, if any case carries a `label`, one final JSON line {summary: {...}}.
//
// run/run_loop.mjs is a script (no exports), so the chain is reproduced here. Faithful copies of run/run_loop.mjs:
//   - imports (engine.mjs, compare.ts, rules_extra.mjs, policy.mjs) ........ lines 50-55
//   - lc / lvlOf ............................................................ lines 58, 60
//   - buildCtx ............................................................ lines 64-96
//   - big, analyzeTx, mergeEffects ........................................ lines 98-128
//   - decodeRequest (switch on request.method) ............................ lines 130-145
//   - evalCase core: applyExtraRules, shareOfBalancePct, floor policy,
//     compare(intent) then applyPolicy (arm `intention_mensongere`) ........ lines 166-181, 188-190
// level_final = run_loop arm `intention_mensongere` (policy applied to the intent supplied in the case);
// level_sans_intention = run_loop arm `sans_intention` (engine floor after policy).
// Only deviation: missing `context` / `intent` default to {} instead of throwing (the error is still reported if decoding fails).
// Read-only: no file is written, no network.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const ENG = join(ROOT, 'engine');
const imp = (p) => import(pathToFileURL(p).href);
const E = await imp(join(ENG, 'src', 'engine.mjs'));
const { compare } = await imp(join(ENG, 'vendor', 'compare.ts'));
const { applyExtraRules, analyzeChainRequest } = await imp(join(ENG, 'src', 'rules_extra.mjs'));
const { applyPolicy } = await imp(join(ROOT, 'run', 'policy.mjs'));

const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const lvlOf = (flags) => (flags.some((f) => f.severity === 'critical') ? 'critical' : flags.some((f) => f.severity === 'warn') ? 'warn' : 'ok');

// ---- copy of run_loop.mjs lines 64-96
function buildCtx(c) {
  const k = c.context;
  const now = Math.floor((c.intent.declaredAt ?? 1760000000000) / 1000);
  const known = (k.known_protocols || []).map((p) => lc(p.address));
  const tokenMeta = {};
  const bySymbol = {};
  for (const t of k.token_registry || []) {
    tokenMeta[lc(t.address)] = { symbol: t.symbol, decimals: t.decimals, stable: ['USDC', 'USDT', 'DAI'].includes(t.symbol) };
    bySymbol[t.symbol] = t.decimals;
  }
  const facts = {};
  for (const [a, v] of Object.entries(k.counterparty_facts || {})) facts[lc(a)] = v;
  const ageBlocks = {};
  for (const [a, v] of Object.entries(facts)) if (v.ageBlocks !== undefined) ageBlocks[a] = v.ageBlocks;
  for (const [a, v] of Object.entries(k.token_info || {})) {
    if (!tokenMeta[lc(a)]) tokenMeta[lc(a)] = { symbol: v.symbol, decimals: bySymbol[v.symbol] ?? 18 };
    if (v.ageBlocks !== undefined && ageBlocks[lc(a)] === undefined) ageBlocks[lc(a)] = v.ageBlocks;
  }
  const codeSet = new Set([...known, ...(k.token_registry || []).map((t) => lc(t.address)), ...Object.keys(k.token_info || {}).map(lc)]);
  const history = (k.history || []).map((h) => ({
    address: lc(h.address), ts: now - Math.round((h.minutes_ago || 0) * 60), direction: h.direction === 'sortie' ? 'out' : 'in',
    dust: h.direction !== 'sortie' && Number.parseFloat(h.amount) <= 0.01,
  }));
  return {
    chainId: k.chainId, from: lc(k.victim), now, origin: k.origin,
    knownSpenders: known, knownVerifiers: new Set(known),
    history, contacts: (k.address_book || []).map((b) => ({ address: lc(b.address), label: b.label })),
    tokenMeta, ageBlocks,
    codeOf: (a) => { a = lc(a); if (facts[a] && facts[a].isContract !== undefined) return !!facts[a].isContract; if (codeSet.has(a)) return true; return undefined; },
    expectedOut: k.quote?.expected_out_units ? () => BigInt(k.quote.expected_out_units) : undefined,
    _sharePct: k.share_of_balance_pct, _k: k, _facts: facts, _tokenInfo: k.token_info || {}, _book: k.address_book || [],
  };
}

// ---- copy of run_loop.mjs lines 100-128
function analyzeTx(tx, ctx) {
  const opts = { ...ctx }; delete opts._sharePct;
  let eff = E.analyzeTransaction(tx, opts);
  if (ctx._sharePct && eff.outgoing.length) {
    const o = eff.outgoing.reduce((m, x) => (BigInt(x.amountRaw) > BigInt(m.amountRaw) ? x : m));
    const pct100 = BigInt(Math.round(ctx._sharePct * 100));
    if (pct100 > 0n) eff = E.analyzeTransaction(tx, { ...opts, balances: { [lc(o.token)]: ((BigInt(o.amountRaw) * 10000n) / pct100).toString() } });
  }
  return eff;
}
function mergeEffects(list) {
  if (list.length === 1) return list[0];
  const m = JSON.parse(JSON.stringify(list[0]));
  const cps = new Map(m.counterparties.map((c) => [c.address, c]));
  const seen = new Set(m.risk_flags.map((f) => f.code + '|' + f.detail));
  for (const e of list.slice(1)) {
    for (const f of ['outgoing', 'incoming', 'approvals', 'controlChange', 'nested']) m[f].push(...e[f]);
    for (const c of e.counterparties) { if (cps.has(c.address)) cps.get(c.address).roles = [...new Set([...cps.get(c.address).roles, ...c.roles])]; else { cps.set(c.address, c); m.counterparties.push(c); } }
    for (const f of e.risk_flags) { const k = f.code + '|' + f.detail; if (!seen.has(k)) { seen.add(k); m.risk_flags.push(f); } }
    m.opaque = m.opaque || e.opaque; m.opaqueReasons = [...new Set([...m.opaqueReasons, ...e.opaqueReasons])];
    if (!m.delegation && e.delegation) m.delegation = e.delegation;
    if (e.thirdParty) m.thirdParty = [...(m.thirdParty || []), ...e.thirdParty];
    if (e.shareOfBalancePct !== undefined) m.shareOfBalancePct = Math.max(m.shareOfBalancePct ?? 0, e.shareOfBalancePct);
  }
  m.risk_flags.sort((a, b) => ({ info: 0, warn: 1, critical: 2 }[b.severity] - { info: 0, warn: 1, critical: 2 }[a.severity]));
  m.level = lvlOf(m.risk_flags); m.levelEvidence = lvlOf(m.risk_flags.filter((f) => !E.OPACITY_CODES.has(f.code)));
  m.raw = { ...m.raw, batch: list.length };
  return m;
}
// ---- copy of run_loop.mjs lines 130-145
function decodeRequest(c, ctx) {
  const { method, params } = c.request;
  switch (method) {
    case 'eth_sendTransaction': return { eff: analyzeTx(params[0], ctx) };
    case 'wallet_sendCalls': {
      const p = params[0];
      return { eff: mergeEffects(p.calls.map((call) => analyzeTx({ from: p.from, chainId: p.chainId, type: '0x2', ...call }, ctx))) };
    }
    case 'eth_signTypedData_v4': return { eff: E.analyzeTypedData(params[1], ctx) };
    case 'personal_sign': return { eff: E.analyzePersonalSign(params[0], ctx) };
    case 'eth_sign': return { eff: E.analyzeEthSign(params[1], ctx) };
    case 'wallet_switchEthereumChain':
    case 'wallet_addEthereumChain': { const e = analyzeChainRequest(c.request, ctx); return e ? { eff: e } : { unsupported: `méthode ${method} non gérée par le moteur d'effets` }; }
    default: return { unsupported: `méthode ${method} non gérée par le moteur d'effets` };
  }
}

// ---- human-readable reasons: engine flags (warn/critical) + comparator reasons kept by the policy
function phrases(eff, pol) {
  const out = [];
  for (const f of eff.risk_flags) if (f.severity !== 'info') out.push(`[${f.severity}] ${f.code}${f.detail ? ' : ' + f.detail : ''}`);
  for (const r of pol.reasons) {
    const txt = [r.said, r.does].filter(Boolean).join(' -> ');
    out.push(`[intention] ${r.code}${txt ? ' : ' + txt : ''}`);
  }
  for (const n of pol.notes) out.push(`[politique] ${n}`);
  return out;
}

// ---- one case (mirrors evalCase, run_loop.mjs lines 166-181 and 188-190)
function check(c, fallbackId) {
  const t0 = performance.now();
  const out = { id: c.id ?? fallbackId };
  const done = () => { out.ms = Math.round((performance.now() - t0) * 100) / 100; return out; };
  try {
    if (!c.request || typeof c.request !== 'object') throw new Error('champ `request` absent');
    c = { ...c, context: c.context || {}, intent: c.intent || {} };
    const ctx = buildCtx(c);
    const dec = decodeRequest(c, ctx);
    if (dec.unsupported) { out.level_final = 'unknown'; out.level_sans_intention = 'unknown'; out.reasons = []; out.unsupported = dec.unsupported; return done(); }
    const eff = dec.eff;
    applyExtraRules(eff, c.request, ctx);
    if (eff.shareOfBalancePct === undefined && ctx._sharePct !== undefined && !eff.outgoing.length) eff.shareOfBalancePct = ctx._sharePct;
    const floor = applyPolicy({ eff, adem: null, ctx, intent: null, request: c.request });
    compare(c.intent, eff); // run_loop calls compare once before the policy arm (vM0); kept for identical call order
    const vM = applyPolicy({ eff, adem: compare(c.intent, eff), ctx, intent: c.intent, request: c.request });
    out.level_final = vM.level;
    out.level_sans_intention = floor.level;
    out.reasons = phrases(eff, vM);
  } catch (e) {
    out.level_final = 'unknown'; out.level_sans_intention = 'unknown'; out.reasons = [];
    out.error = String(e.stack || e).split('\n').slice(0, 2).join(' | ');
  }
  return done();
}

// ---- main
const file = process.argv[2];
if (!file) { console.error('Usage : node check.mjs <fichier.jsonl>'); process.exit(2); }
let text;
try { text = readFileSync(file, 'utf8'); } catch (e) { console.error(`Lecture impossible : ${e.message}`); process.exit(2); }
const lines = text.replace(/^﻿/, '').split(/\r?\n/);
const failures = [];
const sum = { n: 0, n_labeled: 0, n_malveillant: 0, n_benin: 0, arnaques_ratees: 0, fausses_alertes: 0, unknown: 0 };
let anyLabel = false;
lines.forEach((line, i) => {
  if (!line.trim()) return;
  const fallbackId = `ligne-${i + 1}`;
  let c;
  try { c = JSON.parse(line); } catch (e) {
    console.log(JSON.stringify({ id: fallbackId, level_final: 'unknown', level_sans_intention: 'unknown', reasons: [], error: `JSON invalide : ${e.message}`, ms: 0 }));
    sum.n++; sum.unknown++; return;
  }
  if (!c || typeof c !== 'object' || Array.isArray(c)) c = {};
  const r = check(c, fallbackId);
  console.log(JSON.stringify(r));
  sum.n++;
  if (r.level_final === 'unknown') sum.unknown++;
  if (c.label === undefined) return;
  anyLabel = true; sum.n_labeled++;
  if (c.label === 'malveillant') {
    sum.n_malveillant++;
    if (r.level_final !== 'critical') { sum.arnaques_ratees++; failures.push({ type: 'arnaque_ratee', id: r.id, label: c.label, expected: c.expected_severity, level_final: r.level_final, level_sans_intention: r.level_sans_intention, reasons: r.reasons, ...(r.unsupported ? { unsupported: r.unsupported } : {}), ...(r.error ? { error: r.error } : {}) }); }
  } else if (c.label === 'benin') {
    sum.n_benin++;
    if (r.level_final === 'critical') { sum.fausses_alertes++; failures.push({ type: 'fausse_alerte', id: r.id, label: c.label, expected: c.expected_severity, level_final: r.level_final, level_sans_intention: r.level_sans_intention, reasons: r.reasons }); }
  }
});
if (anyLabel) {
  console.log(JSON.stringify({ summary: { ...sum, regle: 'arnaque ratee = malveillant sans critical ; fausse alerte = benin en critical', echecs: failures } }));
}

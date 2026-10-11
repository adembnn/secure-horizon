// check_plus.mjs - check.mjs chain (copied verbatim, lines "imports" to "phrases") + Adem's detectors (detectors_adem/).
// Usage : node redteam/check_plus.mjs <cases.jsonl> [more.jsonl ...] [--report] [--base] [--only=D1,D2] [--quiet]
//   --report : per family/subfamily table (missed scams, false alarms, warns on benign) instead of the summary line
//   --base   : detectors off (= check.mjs verdicts) ; --only : run only the listed detectors (A/B)
//   files may use the v2 schema : they are normalized on the fly by normalize_v2.mjs (idempotent on bench-format cases)
// Detectors can only RAISE level_final (ok -> warn -> critical). A detector may lower only through an explicit,
// documented `lower` correction (false positive fix), reported in reasons as [adem-fix].
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


// ---- Adem's detectors
const { DETECTORS } = await imp(join(ROOT, 'detectors_adem', 'index.mjs'));
const { normalizeCase } = await imp(join(HERE, 'normalize_v2.mjs'));
const args = process.argv.slice(2);
const OPT = { report: args.includes('--report'), base: args.includes('--base'), quiet: args.includes('--quiet'), fails: args.includes('--fails'), only: (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean), skip: (args.find((a) => a.startsWith('--skip=')) || '').slice(7).split(',').filter(Boolean) };
const files = args.filter((a) => !a.startsWith('--'));
const RANK = { ok: 0, warn: 1, critical: 2 };

async function check(c, fallbackId) {
  const t0 = performance.now();
  const out = { id: c.id ?? fallbackId };
  const done = () => { out.ms = Math.round((performance.now() - t0) * 100) / 100; return out; };
  try {
    if (!c.request || typeof c.request !== 'object') throw new Error('champ `request` absent');
    c = { ...c, context: c.context || {}, intent: c.intent || {} };
    const ctx = buildCtx(c);
    const dec = decodeRequest(c, ctx);
    let eff = null;
    if (dec.unsupported) { out.level_final = 'unknown'; out.level_sans_intention = 'unknown'; out.reasons = []; out.unsupported = dec.unsupported; }
    else {
      eff = dec.eff;
      applyExtraRules(eff, c.request, ctx);
      if (eff.shareOfBalancePct === undefined && ctx._sharePct !== undefined && !eff.outgoing.length) eff.shareOfBalancePct = ctx._sharePct;
      const floor = applyPolicy({ eff, adem: null, ctx, intent: null, request: c.request });
      compare(c.intent, eff);
      const adem = compare(c.intent, eff);
      const vM = applyPolicy({ eff, adem, ctx, intent: c.intent, request: c.request });
      out.level_final = vM.level; out.level_sans_intention = floor.level; out.reasons = phrases(eff, vM);
      out._adem = adem; out._vM = vM;
    }
    out.level_base = out.level_final;
    if (!OPT.base) {
      const lowers = []; let ademCritical = false;
      for (const d of DETECTORS) {
        if (OPT.only.length && !OPT.only.includes(d.id)) continue;
        if (OPT.skip.includes(d.id)) continue;
        let r; try { r = await d.run({ c, ctx, eff, request: c.request, intent: c.intent, level: out.level_final, reasons: out.reasons, adem: out._adem, policy: out._vM }); } catch (e) { out.reasons.push(`[adem-error] ${d.id} : ${e.message}`); continue; }
        if (!r) continue;
        for (const f of r.flags || []) {
          out.reasons.push(`[adem:${f.severity}] ${d.id}/${f.code} : ${f.detail}`);
          const cur = out.level_final === 'unknown' ? -1 : RANK[out.level_final];
          if (RANK[f.severity] > cur) out.level_final = f.severity;
        }
        if (r.lower) lowers.push({ id: d.id, ...r.lower });
        if ((r.flags || []).some((f) => f.severity === 'critical')) ademCritical = true;
      }
      // documented false-positive corrections apply last, and never against a critical raised by another Adem detector
      for (const l of lowers) if (!ademCritical && RANK[l.to] < RANK[out.level_final]) { out.reasons.push(`[adem-fix] ${l.id} : ${out.level_final} -> ${l.to} : ${l.why}`); out.level_final = l.to; }
    }
    delete out._adem; delete out._vM;
  } catch (e) {
    out.level_final = 'unknown'; out.level_sans_intention = 'unknown'; out.reasons = [];
    out.error = String(e.stack || e).split('\n').slice(0, 2).join(' | ');
  }
  return done();
}

// ---- main
if (!files.length) { console.error('Usage : node check_plus.mjs <fichier.jsonl> [...] [--report] [--fails] [--base] [--only=..] [--skip=..]'); process.exit(2); }
const failures = [];
const sum = { n: 0, n_labeled: 0, n_malveillant: 0, n_benin: 0, arnaques_ratees: 0, fausses_alertes: 0, warn_benins: 0, unknown: 0 };
const fam = {};
let anyLabel = false;
for (const file of files) {
  if (/V2_TEST/i.test(file)) { console.error('Refus : V2_TEST est gelé.'); process.exit(2); }
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
if (OPT.fails) for (const f of failures) console.log(JSON.stringify(f));
if (OPT.report) {
  const rows = Object.entries(fam).sort((a, b) => a[0].localeCompare(b[0]));
  console.log('label           | n    | ratees | f_alertes | warn | ok   | crit | +gagnes | -perdus | famille/sous-famille');
  for (const [k, F] of rows) console.log(`${F.label.padEnd(15)} | ${String(F.n).padEnd(4)} | ${String(F.ratees).padEnd(6)} | ${String(F.fa).padEnd(9)} | ${String(F.warn).padEnd(4)} | ${String(F.ok).padEnd(4)} | ${String(F.crit).padEnd(4)} | ${String(F.gained).padEnd(7)} | ${String(F.lost).padEnd(7)} | ${k}`);
  console.log(JSON.stringify({ summary: sum }));
} else if (anyLabel) {
  console.log(JSON.stringify({ summary: { ...sum, regle: 'arnaque ratee = malveillant sans critical ; fausse alerte = benin en critical ; warn_benins = fatigue', ...(OPT.quiet || OPT.fails ? {} : { echecs: failures }) } }));
}

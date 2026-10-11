// Chaîne de mesure par « bras d'intention » : même décodage, même contexte, seule l'information d'intention change.
// Copie fidèle de redteam/check_plus.mjs (buildCtx, analyzeTx, mergeEffects, decodeRequest) pour pouvoir varier l'intention sans toucher redteam/.
//   bras 'none'  : aucune intention (plancher du moteur + politique)
//   bras 'type'  : le TYPE d'intention seul (ce que l'extension envoie : { kind, declaredAt })
//   bras 'full'  : l'intention détaillée du cas (type, jeton, montant, destinataire, texte)
// Options : detectors (bool) applique detectors_adem/ comme check_plus ; guard (bool) applique la garde de monotonie de policy.mjs.
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '..');
const imp = (p) => import(pathToFileURL(p).href);
const E = await imp(join(ROOT, 'engine', 'src', 'engine.mjs'));
const { compare } = await imp(join(ROOT, 'engine', 'vendor', 'compare.ts'));
const { applyExtraRules, analyzeChainRequest } = await imp(join(ROOT, 'engine', 'src', 'rules_extra.mjs'));
const P = await imp(join(HERE, 'policy.mjs'));
const { applyPolicy } = P;
const { DETECTORS } = await imp(join(ROOT, 'detectors_adem', 'index.mjs'));
export const { normalizeCase } = await imp(join(ROOT, 'redteam', 'normalize_v2.mjs'));
export const RANK = { ok: 0, warn: 1, critical: 2 };
const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const lvlOf = (flags) => (flags.some((f) => f.severity === 'critical') ? 'critical' : flags.some((f) => f.severity === 'warn') ? 'warn' : 'ok');

function buildCtx(c) {
  const k = c.context;
  const now = Math.floor((c.intent.declaredAt ?? 1760000000000) / 1000);
  const known = (k.known_protocols || []).map((p) => lc(p.address));
  const tokenMeta = {}, bySymbol = {};
  for (const t of k.token_registry || []) { tokenMeta[lc(t.address)] = { symbol: t.symbol, decimals: t.decimals, stable: ['USDC', 'USDT', 'DAI'].includes(t.symbol) }; bySymbol[t.symbol] = t.decimals; }
  const facts = {};
  for (const [a, v] of Object.entries(k.counterparty_facts || {})) facts[lc(a)] = v;
  const ageBlocks = {};
  for (const [a, v] of Object.entries(facts)) if (v.ageBlocks !== undefined) ageBlocks[a] = v.ageBlocks;
  for (const [a, v] of Object.entries(k.token_info || {})) {
    if (!tokenMeta[lc(a)]) tokenMeta[lc(a)] = { symbol: v.symbol, decimals: bySymbol[v.symbol] ?? 18 };
    if (v.ageBlocks !== undefined && ageBlocks[lc(a)] === undefined) ageBlocks[lc(a)] = v.ageBlocks;
  }
  const codeSet = new Set([...known, ...(k.token_registry || []).map((t) => lc(t.address)), ...Object.keys(k.token_info || {}).map(lc)]);
  const history = (k.history || []).map((h) => ({ address: lc(h.address), ts: now - Math.round((h.minutes_ago || 0) * 60), direction: h.direction === 'sortie' ? 'out' : 'in', dust: h.direction !== 'sortie' && Number.parseFloat(h.amount) <= 0.01 }));
  return {
    chainId: k.chainId, from: lc(k.victim), now, origin: k.origin, knownSpenders: known, knownVerifiers: new Set(known),
    history, contacts: (k.address_book || []).map((b) => ({ address: lc(b.address), label: b.label })), tokenMeta, ageBlocks,
    codeOf: (a) => { a = lc(a); if (facts[a] && facts[a].isContract !== undefined) return !!facts[a].isContract; if (codeSet.has(a)) return true; return undefined; },
    expectedOut: k.quote?.expected_out_units ? () => BigInt(k.quote.expected_out_units) : undefined,
    _sharePct: k.share_of_balance_pct, _k: k, _facts: facts, _tokenInfo: k.token_info || {}, _book: k.address_book || [],
  };
}
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
function decodeRequest(c, ctx) {
  const { method, params } = c.request;
  switch (method) {
    case 'eth_sendTransaction': return { eff: analyzeTx(params[0], ctx) };
    case 'wallet_sendCalls': { const p = params[0]; return { eff: mergeEffects(p.calls.map((call) => analyzeTx({ from: p.from, chainId: p.chainId, type: '0x2', ...call }, ctx))) }; }
    case 'eth_signTypedData_v4': return { eff: E.analyzeTypedData(params[1], ctx) };
    case 'personal_sign': return { eff: E.analyzePersonalSign(params[0], ctx) };
    case 'eth_sign': return { eff: E.analyzeEthSign(params[1], ctx) };
    case 'wallet_switchEthereumChain':
    case 'wallet_addEthereumChain': { const e = analyzeChainRequest(c.request, ctx); return e ? { eff: e } : { unsupported: method }; }
    default: return { unsupported: method };
  }
}

// Intention donnée à chaque bras. `full` = l'intention du cas telle quelle.
export function armIntent(c, arm) {
  const full = c.intent || {};
  if (arm === 'none') return null;
  if (arm === 'type') return full.kind ? { kind: full.kind, declaredAt: full.declaredAt ?? 1760000000000 } : null;
  return full;
}

// Décodage une seule fois par cas : les bras réutilisent les mêmes effets (déterministe ; seuls le comparateur et la politique varient).
export function prepare(c0) {
  const c = { ...c0, context: c0.context || {}, intent: c0.intent || {} };
  const ctx = buildCtx(c);
  const dec = decodeRequest(c, ctx);
  if (dec.unsupported) return { c, ctx, unsupported: dec.unsupported };
  const eff = dec.eff;
  applyExtraRules(eff, c.request, ctx);
  if (eff.shareOfBalancePct === undefined && ctx._sharePct !== undefined && !eff.outgoing.length) eff.shareOfBalancePct = ctx._sharePct;
  return { c, ctx, eff };
}

// Niveau d'un bras. Retourne { level, floor, reasons }.
export const INTENT_PREMISE = new Set(['kind_missing_unvouched_recipient', 'signed_right_not_intended']); // drapeaux dont la prémisse est l'intention DÉCLARÉE (cf. pipeline/evaluate_plus.mjs)
export async function runArm(prep, arm, { detectors = false, guard = false, premiseCap = false } = {}) {
  if (prep.unsupported) return { level: 'unknown', unsupported: true };
  const { c, ctx, eff } = prep;
  const it = armIntent(c, arm);
  const adem = it ? compare(it, eff) : null;
  const pol = applyPolicy({ eff, adem, ctx, intent: it, request: c.request });
  let level = pol.level;
  const reasons = [];
  if (detectors) {
    const dIntent = it || {};
    const cc = { ...c, intent: dIntent };
    const lowers = []; let adCrit = false;
    for (const d of DETECTORS) {
      let r; try { r = await d.run({ c: cc, ctx, eff, request: c.request, intent: dIntent, level, reasons, adem, policy: pol }); } catch { continue; }
      if (!r) continue;
      for (const f0 of r.flags || []) { const f = premiseCap && !it && INTENT_PREMISE.has(f0.code) ? { ...f0, severity: 'warn' } : f0; reasons.push(`${d.id}/${f.code}`); if (RANK[f.severity] > RANK[level]) level = f.severity; }
      if (r.lower) lowers.push(r.lower);
      if ((r.flags || []).some((f) => f.severity === 'critical' && !(premiseCap && !it && INTENT_PREMISE.has(f.code)))) adCrit = true;
    }
    for (const l of lowers) if (!adCrit && RANK[l.to] < RANK[level]) level = l.to;
  }
  // garde de monotonie : le type seul n'est jamais sous « sans intention », l'intention détaillée jamais sous le type seul (donc jamais sous « sans intention »)
  if (guard && arm !== 'none') {
    const base = await runArm(prep, arm === 'full' ? 'type' : 'none', { detectors, guard: true, premiseCap });
    level = P.monotoneGuard(level, base.level);
  }
  return { level, floor: pol.floorLevel, reasons: [...pol.reasons.map((r) => r.code), ...reasons] };
}

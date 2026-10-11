// Hold up Lab - the product side. Nothing is re-implemented here: the verdict comes from the product's own code, imported.
//   path "extension" : server/server.mjs evaluate(body, local)            (what the browser extension shows)
//   path "rpc"       : rpc_garde/proxy.mjs createGuard() on the lab node   (what the protective RPC does with a signed raw transaction)
//   path "paste"     : the same evaluate(), on the transfer the person is about to make + the message they pasted
//   second column    : the bench chain of redteam/check_plus.mjs (engine + comparator + policy) followed by detectors_adem (bench only today)
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lc, isAddr } from './chain.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const BANC = resolve(HERE, '..', '..', '..', 'titouan', 'T_banc_e2e');
const GARDE = resolve(HERE, '..', '..', 'rpc_garde');
const imp = (p) => import(pathToFileURL(p).href);

const S = await imp(join(BANC, 'server', 'server.mjs'));
const E = await imp(join(BANC, 'engine', 'src', 'engine.mjs'));
const { compare } = await imp(join(BANC, 'engine', 'vendor', 'compare.ts'));
const { applyExtraRules, analyzeChainRequest } = await imp(join(BANC, 'engine', 'src', 'rules_extra.mjs'));
const { applyPolicy } = await imp(join(BANC, 'run', 'policy.mjs'));
const { DETECTORS } = await imp(join(BANC, 'detectors_adem', 'index.mjs'));
export const RAW = await imp(join(GARDE, 'rawtx.mjs'));
let PROXY = null;
if (existsSync(join(GARDE, 'proxy.mjs'))) { try { PROXY = await imp(join(GARDE, 'proxy.mjs')); } catch { PROXY = null; } }

// The message detector of the second column is off unless a classifier is named. The lab uses the offline keyword provider
// (no network, reproducible) unless LAB_CLASSIFIER says otherwise.
process.env.HOLDUP_CLASSIFIER = process.env.LAB_CLASSIFIER || 'keyword';

export const DETECTOR_IDS = DETECTORS.map((d) => d.id);
export const hasGuard = () => !!PROXY;

// What the victim's Hold up knows locally (address book, own history, own accounts, protocols already used). Same shape as context.local.json.
export function localContext(ctx) {
  const a = ctx.accounts;
  return {
    contacts: [{ address: lc(a.contact), label: 'Paul' }, { address: lc(a.own2), label: 'Mon second compte' }],
    history: [
      { address: lc(a.contact), direction: 'sortie', amount: '50', minutes_ago: 5000 },
      { address: lc(a.own2), direction: 'sortie', amount: '200', minutes_ago: 20000 },
    ],
    protected: [lc(a.own2)],
    knownSpenders: [lc(ctx.c.router)],
  };
}

const INTENT_CHOICE = { pay_someone: 'pay', connect_or_accept_offer: 'login', asked_by_someone: 'asked' }; // other kinds: the extension has no button, engine floor only
export const NIVEAUX = ['info', 'warn', 'critical'];

function shape(v, ms) {
  const t = v.texts || {};
  return {
    level: v.level, niveau: v.niveau, affichage: v.level === 'manipulation' ? 'manipulation' : v.niveau === 'critical' ? 'danger' : v.level === 'unknown' ? 'non vérifié' : v.niveau === 'warn' ? 'attention' : 'aucun signal', croit: t.croit || null, reel: t.reel || null, conseil: t.action || null, danger: t.danger || null,
    reasons: Array.isArray(v.reasons) ? v.reasons : [], codes: v.codes || (v.raisons || []).map((r) => r.code), fiche: v.fiche || null,
    ...(v.why ? { why: v.why } : {}), ...(v.quote ? { quote: v.quote } : {}), ms,
  };
}

// path "extension" / "paste": body = { method, params, origin, chainId, from, pageText?, intent?, intent_text? }
export function evaluateBody(ctx, request, { origin, pageText, intent, from } = {}) {
  const body = { method: request.method, params: request.params, origin, chainId: ctx.chainId, from: from || ctx.accounts.victim };
  if (pageText) body.pageText = pageText;
  if (intent && INTENT_CHOICE[intent.kind]) { body.intent = INTENT_CHOICE[intent.kind]; if (intent.freeText) body.intent_text = intent.freeText; }
  const t0 = performance.now();
  const v = S.evaluate(body, localContext(ctx));
  return shape(v, Math.round((performance.now() - t0) * 100) / 100);
}

// path "rpc": the signed raw transaction goes through the real guard. A transaction the guard lets through IS relayed to the lab node
// (that is what the guard does); the caller reverts the chain afterwards.
let guard = null, lastVerdict = null, guardLocal = null;
export async function startGuard(ctx, port) {
  if (!PROXY) return null;
  guardLocal = localContext(ctx);
  const tokens = Object.fromEntries(Object.values(ctx.tokens).map((t) => [lc(t.address), { symbol: t.symbol, decimals: t.decimals }]));
  guard = await PROXY.createGuard({
    port, upstream: ctx.url, local: guardLocal, addressesFile: null, tokens, journalEnabled: false,
    wait: { attention: 0, unknown: 0, danger: 0, manipulation: 0 },
    evaluate: (body, local, live) => { const v = S.evaluate(body, guardLocal, live); lastVerdict = v; return v; },
  });
  return guard;
}
export const refreshGuardContext = (ctx) => { guardLocal = localContext(ctx); };
export const stopGuard = async () => { if (guard) await guard.close(); guard = null; };

export async function judgeRaw(ctx, raw) {
  const t0 = performance.now();
  const ms = () => Math.round((performance.now() - t0) * 100) / 100;
  if (!guard) { // no guard available: same pipeline on the decoded transaction, said so in the result
    const tx = RAW.parseSignedTx(raw);
    if (tx.chainId !== ctx.chainId) return { refused: 'chain_mismatch', verdict: null, relayed: false, simulated: true, ms: ms() };
    const req = RAW.toSendTransaction(tx);
    const v = S.evaluate({ ...req, chainId: tx.chainId, from: tx.from }, localContext(ctx));
    return { verdict: shape(v, ms()), relayed: false, simulated: true };
  }
  lastVerdict = null;
  const r = await fetch(guard.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_sendRawTransaction', params: [raw] }) });
  const j = await r.json();
  if (j.result) return { verdict: lastVerdict ? shape(lastVerdict, ms()) : null, relayed: true, simulated: false };
  const h = j.error && j.error.data && j.error.data.holdup;
  if (h && h.hold) {
    const hold = guard.holds.get(h.hold);
    const v = hold ? hold.verdict : lastVerdict;
    guard.holds.delete(h.hold); // the lab never leaves a pending hold behind
    return { verdict: v ? shape(v, ms()) : null, relayed: false, held: true, simulated: false };
  }
  return { verdict: null, relayed: false, refused: (h && h.refused) || 'internal', message: j.error && j.error.message, simulated: false, ms: ms() };
}

// ------------------------------------------------------------------ second column: bench chain + detectors_adem
// buildCtx / mergeEffects / decodeRequest follow redteam/check_plus.mjs (a script with a CLI main, so it cannot be imported).
function buildBenchCtx(c) {
  const k = c.context;
  const now = Math.floor((c.intent.declaredAt ?? Date.now()) / 1000);
  const known = (k.known_protocols || []).map((p) => lc(p.address));
  const tokenMeta = {}, bySymbol = {};
  for (const t of k.token_registry || []) { tokenMeta[lc(t.address)] = { symbol: t.symbol, decimals: t.decimals, stable: ['USDC', 'USDT', 'DAI'].includes(t.symbol) }; bySymbol[t.symbol] = t.decimals; }
  const facts = {};
  for (const [a, v] of Object.entries(k.counterparty_facts || {})) facts[lc(a)] = v;
  const ageBlocks = {};
  for (const [a, v] of Object.entries(facts)) if (v.ageBlocks !== undefined) ageBlocks[a] = v.ageBlocks;
  const codeSet = new Set([...known, ...(k.token_registry || []).map((t) => lc(t.address))]);
  const history = (k.history || []).map((h) => ({ address: lc(h.address), ts: now - Math.round((h.minutes_ago || 0) * 60), direction: h.direction === 'sortie' ? 'out' : 'in', dust: h.direction !== 'sortie' && Number.parseFloat(h.amount) <= 0.01 }));
  return {
    chainId: k.chainId, from: lc(k.victim), now, origin: k.origin, knownSpenders: known, knownVerifiers: new Set(known), history,
    contacts: (k.address_book || []).map((b) => ({ address: lc(b.address), label: b.label })), tokenMeta, ageBlocks,
    codeOf: (a) => { a = lc(a); if (facts[a] && facts[a].isContract !== undefined) return !!facts[a].isContract; if (codeSet.has(a)) return true; return undefined; },
    _sharePct: k.share_of_balance_pct, _k: k, _facts: facts, _tokenInfo: k.token_info || {}, _book: k.address_book || [],
  };
}
const lvlOf = (flags) => (flags.some((f) => f.severity === 'critical') ? 'critical' : flags.some((f) => f.severity === 'warn') ? 'warn' : 'ok');
function mergeEffects(list) {
  if (list.length === 1) return list[0];
  const m = JSON.parse(JSON.stringify(list[0]));
  const cps = new Map(m.counterparties.map((c) => [c.address, c]));
  const seen = new Set(m.risk_flags.map((f) => f.code + '|' + f.detail));
  for (const e of list.slice(1)) {
    for (const f of ['outgoing', 'incoming', 'approvals', 'controlChange', 'nested']) (m[f] = m[f] || []).push(...(e[f] || []));
    for (const c of e.counterparties) { if (cps.has(c.address)) cps.get(c.address).roles = [...new Set([...cps.get(c.address).roles, ...c.roles])]; else { cps.set(c.address, c); m.counterparties.push(c); } }
    for (const f of e.risk_flags) { const key = f.code + '|' + f.detail; if (!seen.has(key)) { seen.add(key); m.risk_flags.push(f); } }
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
function decodeRequest(request, ctx) {
  const { method, params } = request;
  const opts = { ...ctx }; delete opts._sharePct;
  switch (method) {
    case 'eth_sendTransaction': return { eff: E.analyzeTransaction(params[0], opts) };
    case 'wallet_sendCalls': { const p = params[0]; return { eff: mergeEffects(p.calls.map((call) => E.analyzeTransaction({ from: p.from, chainId: p.chainId, type: '0x2', ...call }, opts))) }; }
    case 'eth_signTypedData_v4': return { eff: E.analyzeTypedData(params[1], ctx) };
    case 'personal_sign': return { eff: E.analyzePersonalSign(params[0], ctx) };
    case 'eth_sign': return { eff: E.analyzeEthSign(params[1], ctx) };
    case 'wallet_switchEthereumChain': case 'wallet_addEthereumChain': { const e = analyzeChainRequest(request, ctx); return e ? { eff: e } : { unsupported: method }; }
    default: return { unsupported: method };
  }
}
const RANK = { ok: 0, warn: 1, critical: 2 };
const TO_PRODUCT = { ok: { level: 'ok', niveau: 'info' }, warn: { level: 'attention', niveau: 'warn' }, critical: { level: 'danger', niveau: 'critical' }, unknown: { level: 'unknown', niveau: 'warn' } };

// Addresses a request names (fields and calldata words): the ones a wallet would look up before showing a verdict.
function namedAddresses(request) {
  const s = JSON.stringify(request);
  const out = new Set();
  for (const m of s.matchAll(/0x[0-9a-fA-F]{40}(?![0-9a-fA-F])/g)) out.add(lc(m[0]));
  for (const m of s.matchAll(/0{24}([0-9a-fA-F]{40})/g)) if (!/^0{30}/.test(m[1])) out.add('0x' + lc(m[1]));
  return [...out].slice(0, 24);
}
// Facts read on the lab chain (code or no code, age in blocks for contracts the lab saw being deployed). LAB_LIVE=0 turns it off.
export async function liveFacts(ctx, request) {
  if (process.env.LAB_LIVE === '0') return {};
  const addrs = namedAddresses(request);
  const [head, ...codes] = await ctx.rpc.batch([['eth_blockNumber', []], ...addrs.map((a) => ['eth_getCode', [a, 'latest']])]);
  const facts = {};
  addrs.forEach((a, i) => {
    if (typeof codes[i] !== 'string') return;
    facts[a] = { isContract: codes[i] !== '0x' };
    if (ctx.deployBlocks[a] !== undefined && head) facts[a].ageBlocks = Number(BigInt(head)) - ctx.deployBlocks[a];
  });
  return facts;
}

// request = site-shaped JSON-RPC request (a raw transaction is decoded first, as the guard does).
export async function evaluatePlus(ctx, request, { origin, intent, pastedMessage } = {}) {
  const t0 = performance.now();
  let reqd = request;
  try {
    if (request.method === 'eth_sendRawTransaction') reqd = RAW.toSendTransaction(RAW.parseSignedTx(request.params[0]));
    const local = localContext(ctx);
    const context = {
      chainId: ctx.chainId, victim: ctx.accounts.victim, origin,
      known_protocols: [{ name: 'DemoRouter', address: ctx.c.router }, ...(ctx.c.permit2 ? [{ name: 'Permit2', address: ctx.c.permit2 }] : []), ...(ctx.c.multicall3 ? [{ name: 'Multicall3', address: ctx.c.multicall3 }] : [])],
      token_registry: Object.values(ctx.tokens).map((t) => ({ address: t.address, symbol: t.symbol, decimals: t.decimals })),
      address_book: local.contacts.map((c) => ({ address: c.address, label: c.label })), history: local.history,
      counterparty_facts: await liveFacts(ctx, reqd),
    };
    const it = { declaredAt: Date.now(), ...(intent && intent.kind && intent.kind !== 'other' ? { kind: intent.kind } : {}), ...(intent && intent.freeText ? { freeText: intent.freeText } : {}), ...(pastedMessage ? { pastedMessage } : {}) };
    if (it.kind === 'asked_by_someone') it.askedBy = 'other';
    const c = { request: reqd, context, intent: it };
    const bctx = buildBenchCtx(c);
    const dec = decodeRequest(reqd, bctx);
    let eff = null, level = 'unknown', adem = null, pol = null;
    const reasons = [];
    if (!dec.unsupported) {
      eff = dec.eff;
      applyExtraRules(eff, reqd, bctx);
      adem = compare(it, eff);
      pol = applyPolicy({ eff, adem, ctx: bctx, intent: it, request: reqd });
      level = pol.level;
      for (const f of eff.risk_flags) if (f.severity !== 'info') reasons.push(`[${f.severity}] ${f.code}${f.detail ? ' : ' + f.detail : ''}`);
      for (const r of pol.reasons) reasons.push(`[intention] ${r.code}`);
    }
    const baseLevel = level;
    const addedBy = [], lowers = [];
    let ademCritical = false;
    for (const d of DETECTORS) {
      let r;
      try { r = await d.run({ c, ctx: bctx, eff, request: reqd, intent: it, level, reasons, adem, policy: pol }); } catch (e) { reasons.push(`[adem-error] ${d.id} : ${e.message}`); continue; }
      if (!r) continue;
      for (const f of r.flags || []) {
        reasons.push(`[adem:${f.severity}] ${d.id}/${f.code} : ${f.detail}`);
        if (f.severity !== 'info' && !addedBy.includes(d.id)) addedBy.push(d.id);
        const cur = level === 'unknown' ? -1 : RANK[level];
        if (RANK[f.severity] > cur) level = f.severity;
      }
      if (r.lower) lowers.push({ id: d.id, ...r.lower });
      if ((r.flags || []).some((f) => f.severity === 'critical')) ademCritical = true;
    }
    for (const l of lowers) if (!ademCritical && RANK[l.to] < RANK[level]) { reasons.push(`[adem-fix] ${l.id} : ${level} -> ${l.to} : ${l.why}`); level = l.to; }
    return { ...TO_PRODUCT[level], baseLevel: TO_PRODUCT[baseLevel].level, addedBy, reasons, liveFacts: process.env.LAB_LIVE !== '0', ms: Math.round((performance.now() - t0) * 100) / 100 };
  } catch (e) {
    return { level: 'unknown', niveau: 'warn', baseLevel: 'unknown', addedBy: [], reasons: ['analyse impossible : ' + String(e.message || e).slice(0, 160)], liveFacts: false, ms: Math.round((performance.now() - t0) * 100) / 100 };
  }
}

export { isAddr };

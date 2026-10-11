// pipeline/evaluate_plus.mjs - the product verdict PLUS the detectors of detectors_adem/ and the live chain facts.
//
//   import { evaluatePlus } from '<...>/T_banc_e2e/pipeline/evaluate_plus.mjs';
//   const v = await evaluatePlus(body, local, { live, detectors, classifier, intent, budgetMs, rpcUrl });
//
// body / local : exactly what server/server.mjs `evaluate(body, local)` receives (POST /check body, loadLocalContext()).
// options (all optional) :
//   live       : chain facts. One of
//                  - a facts object in the shape of context_live/provider.mjs toEngineContext()
//                    { isContract, ageBlocks, balances, tokenMeta, facts, tokenInfo, allowances, missing } (+ optional `extra`, `sharePct`, see normFacts) ;
//                  - the provider module itself (anything with liveEngineContext()) : it is called here, time-boxed ;
//                  - an async function (input) => facts object ;
//                  - true : load context_live/provider.mjs (Node only) ; null / false / absent : no live context.
//   detectors  : true (default) = detectors_adem/index.mjs ; false = none ; an array = that list.
//   classifier : false = never run the pasted-message detector. Otherwise it follows HOLDUP_CLASSIFIER (off unless set), as on the bench.
//   intent     : a full Intent object (kind, token, amount, counterpartyLabel, freeText...). Default : derived from body.intent / body.intent_text
//                the way the server does (pay / receive / login / asked). body.intent may also be that object.
//   knownProtocols : false = do not load pipeline/known_protocols.json (public per-chain list, each address with its primary source).
//   budgetMs   : total budget for the live lookup (default 1500, the provider's own budget). A slow RPC never blocks longer : on timeout the
//                verdict is given on what is known and `plus.missingFacts` says what was not verified.
//   rpcUrl     : node to read (default : SENTINELLE_RPC_URL / HOLDUP_RPC_URL, else the provider's public RPC for the chain).
//
// Result : the same object as `evaluate` (level, niveau, fiche, title, texts, reasons, raisons, codes, effects, said, real...) plus
//   plus : { path, level, base, product, raisedBy: [{ code, severity, detail }], loweredBy: [...], relaxedByFacts, facts, missingFacts,
//            notVerified, errors, ms: { product, live, chain, detectors, total } }
//
// Rules, in this order :
//   1. the product chain (engine -> extra rules -> comparator -> policy) is run on the richest context available : the request, the local
//      context and the live facts. A fact that is not known stays unknown : it is simply absent from the context, there is no default.
//   2. the detectors run in the order of detectors_adem/index.mjs, exactly as redteam/check_plus.mjs does : a flag can only RAISE the level ;
//      a detector lowers only through its documented `lower` correction, applied last and never against a critical raised by another detector.
//   3. with NO extra fact (no live fact, no richer intent) the result is never below the product's own verdict. With real facts the chain may
//      conclude lower than the product did blind (that is what the facts are for) ; it is reported in plus.relaxedByFacts.
//   4. any internal error falls back to the product verdict ; if the product itself fails, the answer is "not verified" (orange), never green.
//
// The core (makeEvaluatePlus) has no Node import : give it the functions of your bundle (engine, policy, server presentation, detectors) to
// use it in a service worker. `evaluatePlus` is the Node binding : it loads server/server.mjs, the engine and detectors_adem/ on first use.

const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const RANK = { ok: 0, warn: 1, critical: 2 };
const nowMs = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
const r2 = (x) => Math.round(x * 100) / 100;

// Same public constants as server/server.mjs buildCtx (not exported there). plus.drift is measured by pipeline/measure.mjs : it must stay 0.
export const CANONICAL = ['0x000000000022D473030F116dDEE9F6B43aC78BA3', '0xcA11bde05977b3631167028862bE2a173976CA11', '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
  '0x0000000000000068F116a894984e2DB1123eB395', '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'].map(lc);
export const TOKENS = [['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'USDC', 6], ['0xdAC17F958D2ee523a2206206994597C13D831ec7', 'USDT', 6],
  ['0x6B175474E89094C44Da98b954EedeAC495271d0F', 'DAI', 18], ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'WETH', 18]];

// ------------------------------------------------------------------ user-facing mapping of a detector flag
// detector flag code -> fiche of U_textes_utilisateur.json ('Fnn') or '~key' of the server's SECOURS texts. The detector id is never shown.
export const DETECTOR_FICHE = {
  pull_via_existing_allowance: 'F12', batch_right_unvouched: 'F12', embedded_pull_unvouched: 'F12', embedded_right_unvouched: 'F12',
  forwarded_value_lookalike: 'F13', forwarded_value_dust_only: 'F14', forwarded_value_single_stranger: 'F12', forwarded_value_hidden_recipient: 'F12',
  lookalike_of_known: 'F13', clipboard_substituted: 'F19', dust_only_recipient: 'F14',
  right_to_unvouched_spender: 'F01', sim_approval_by_victim: 'F01', swap_no_min_unknown_router: 'F18',
  counterfeit_reference_token: 'F15', token_cannot_be_sold: 'F16', token_sell_tax_confiscatory: 'F16', token_sell_tax_high: 'F16',
  sim_outflow_without_return: '~rien_en_retour', order_gives_assets_for_nothing: 'F04',
  signed_transfer_unlimited: 'F02', signed_right_unlimited_unknown: 'F02', signed_right_not_intended: 'F02', signed_calldata: 'F05', signed_text_grants_assets: 'F05',
  calldata_malformed: 'F25', control_change_by_shape: 'F07', chain_public_id_foreign_rpc: 'F32', permission_wildcard: '~generique',
  kind_malformed: '~generique', token_mismatch: '~generique', amount_exceeded_robust: '~montant_superieur', recipient_not_label: '~inattendu_envoi',
  new_recipient_large_share: 'F24', kind_missing_unvouched_recipient: 'F31', manipulation_message: 'F21', manipulation_message_no_value: 'F21',
};
// Flags that mean "this is not covered by what you declared". options.intentPremise = 'warn' caps them to a warning when the user declared NO intent
// (default 'strict' = bench rule ; measured both ways in RESULTATS_INTEGRATION.md).
export const INTENT_PREMISE = new Set(['kind_missing_unvouched_recipient', 'signed_right_not_intended']);
// The detectors write "vous", the product says "tu". Addresses are shortened, bench tags removed.
const TU = [[/\bvous avez dit\b/g, 'tu as dit'], [/\bvous payez\b/g, 'tu paies'], [/\bvous cédez\b/g, 'tu cèdes'], [/\bque vous connaissez\b/g, 'que tu connais'],
  [/\b(par|à|de|pour) vous\b/g, '$1 toi'], [/\bvous mettez\b/g, 'tu mets'], [/\bvos\b/g, 'tes'], [/\bvotre\b/g, 'ton'], [/\bvous\b/g, 'tu']];
export function humanize(detail) {
  let s = String(detail || '').replace(/\[mode=[^\]]*\]\s*/g, '').replace(/\s*\[(?:repli|modèle)[^\]]*\]/g, '').replace(/\s*\((?:heuristique)\)/g, '');
  s = s.replace(/0x[0-9a-fA-F]{40}\b/g, (a) => a.slice(0, 6) + '…' + a.slice(-4)).replace(/0x[0-9a-fA-F]{41,}\b/g, (h) => h.slice(0, 10) + '…');
  for (const [re, to] of TU) s = s.replace(re, to);
  s = s.replace(/\s{2,}/g, ' ').trim();
  if (s.length > 220) s = s.slice(0, 217).replace(/\s+\S*$/, '') + '…';
  if (s && !/[.!?…]$/.test(s)) s += '.';
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// product answer -> bench scale (same table as redteam/check_product.mjs)
export function benchLevel(v) {
  if (!v || typeof v !== 'object') return 'unknown';
  if (v.level === 'danger' || v.level === 'manipulation') return 'critical';
  if (v.level === 'unknown') return (v.raisons || []).some((r) => r.code === 'unverifiable') || !v.raisons ? 'unknown' : 'warn';
  return v.niveau === 'warn' ? 'warn' : v.niveau === 'critical' ? 'critical' : 'ok';
}
// 'unknown' (nothing could be read) sits between ok and warn : it is shown orange, so it is never replaced by a green answer
const rk = (l) => (l === 'unknown' ? 0.5 : RANK[l] ?? 0.5);

// ------------------------------------------------------------------ facts
// Accepts the provider shape and returns a complete object. `extra` (optional) carries what a richer client knows and the chain does not :
//   { clipboard: { copied, pasted }, simulation: { logs }, quote, nft: { collection }, sell_pool, claimed_site, token_registry, token_info, origin }
// `sharePct` (optional) : share of the balance the request moves, when the client knows it without the raw balance.
export function normFacts(L) {
  if (!L || typeof L !== 'object') return null;
  const low = (o) => { const r = {}; for (const [a, v] of Object.entries(o && typeof o === 'object' ? o : {})) r[lc(a)] = v; return r; };
  return { isContract: low(L.isContract), ageBlocks: low(L.ageBlocks), balances: low(L.balances), tokenMeta: low(L.tokenMeta), facts: low(L.facts), tokenInfo: low(L.tokenInfo),
    allowances: low(L.allowances), missing: Array.isArray(L.missing) ? L.missing.map(String) : [], extra: L.extra && typeof L.extra === 'object' ? L.extra : {},
    sharePct: Number.isFinite(L.sharePct) ? L.sharePct : undefined, source: L.source };
}
const hasAnyFact = (F) => !!F && (['isContract', 'ageBlocks', 'balances', 'tokenMeta', 'tokenInfo', 'allowances'].some((k) => Object.keys(F[k]).length) || Object.values(F.facts).some((v) => v && Object.keys(v).length) || Object.keys(F.extra).length > 0 || F.sharePct !== undefined);

function parseChain(v) {
  if (v === null || v === undefined || v === '') return undefined;
  try { const n = typeof v === 'number' ? v : (/^0x/i.test(String(v)) ? Number(BigInt(v)) : Number(v)); return Number.isFinite(n) && n >= 0 ? n : undefined; } catch { return undefined; }
}
function hostOf(origin) { try { return new URL(origin).hostname; } catch { return ''; } }

export function makeEvaluatePlus(D) {
  // D : { evaluate, E, compare, applyExtraRules, analyzeChainRequest, applyPolicy, mergeEffects, present, scenarioFiche, findPressure, buildTexts, buildSecours,
  //       fiches: { id -> fiche }, SECOURS_TITRE, TITRE_NON_VERIFIE, DETECTORS, DEFAULT_TOKENS?, domainToUnicode?, provider?: async () => module, env?: () => object }
  const env = () => (D.env ? D.env() : {});

  // ---- context : server.mjs buildCtx + the live facts (names of run/run_loop.mjs buildCtx : codeOf, ageBlocks, tokenMeta, balances, _facts, _tokenInfo, _k)
  function buildCtx(body, local, from, chainId, F) {
    const now = Math.floor(Date.now() / 1000);
    const tokenMeta = {};
    for (const [a, s, d] of TOKENS) tokenMeta[lc(a)] = { symbol: s, decimals: d, stable: ['USDC', 'USDT', 'DAI'].includes(s) };
    const fromChain = F && F.source === 'provider'; // symbols read on chain are attacker-controlled : never 'stable', never over the engine's own table
    if (F) for (const [a, m] of Object.entries(F.tokenMeta)) {
      if (!m || tokenMeta[a] || (fromChain && D.DEFAULT_TOKENS && D.DEFAULT_TOKENS[a])) continue;
      tokenMeta[a] = fromChain ? { symbol: m.symbol, decimals: m.decimals } : { ...m };
    }
    const known = [...CANONICAL, ...(local.knownSpenders || [])];
    const tokenInfo = {};
    if (F) for (const [a, v] of Object.entries(F.tokenInfo)) if (v && !(fromChain && D.DEFAULT_TOKENS && D.DEFAULT_TOKENS[a])) tokenInfo[a] = v;
    const X = F ? F.extra : {};
    for (const [a, v] of Object.entries(X.token_info || {})) if (v && !tokenInfo[lc(a)]) tokenInfo[lc(a)] = v;
    const facts = F ? F.facts : {};
    const ageBlocks = F ? { ...F.ageBlocks } : {};
    for (const [a, v] of Object.entries(facts)) if (v && Number.isFinite(v.ageBlocks) && ageBlocks[a] === undefined) ageBlocks[a] = v.ageBlocks;
    for (const [a, v] of Object.entries(tokenInfo)) if (Number.isFinite(v.ageBlocks) && ageBlocks[a] === undefined) ageBlocks[a] = v.ageBlocks;
    for (const [a, v] of Object.entries(tokenInfo)) if (!tokenMeta[a] && v.symbol !== undefined && !fromChain) tokenMeta[a] = { symbol: v.symbol, decimals: Number.isFinite(v.decimals) ? v.decimals : 18 };
    // reference table of the engine, exposed when the live context is on (as context_live/server_integration.diff does)
    const registry = Array.isArray(X.token_registry) ? X.token_registry
      : (fromChain && D.DEFAULT_TOKENS && [1, 43114].includes(chainId) ? Object.entries(D.DEFAULT_TOKENS).filter(([a]) => HEX20.test(a)).map(([address, t]) => ({ address, symbol: t.symbol, decimals: t.decimals })) : []);
    const codeSet = new Set([...known, ...Object.keys(tokenMeta), ...Object.keys(tokenInfo), ...registry.map((t) => lc(t.address))]);
    const h = hostOf(body.origin);
    const unicodeHost = (() => { try { return (D.domainToUnicode && D.domainToUnicode(h)) || h; } catch { return h; } })();
    const quote = X.quote && X.quote.expected_out_units;
    return {
      chainId, from, now, origin: typeof body.origin === 'string' ? body.origin : undefined,
      protected: local.protected || [],
      knownSpenders: known, knownVerifiers: new Set(known),
      history: (local.history || []).map((x) => ({ address: lc(x.address), ts: now - Math.round((x.minutes_ago || 0) * 60), direction: x.direction === 'sortie' ? 'out' : 'in', dust: x.direction !== 'sortie' && Number.parseFloat(x.amount) <= 0.01 })),
      contacts: local.contacts || [], tokenMeta, ageBlocks,
      ...(F && Object.keys(F.balances).length ? { balances: F.balances } : {}),
      codeOf: (a) => { a = lc(a); if (F && F.isContract[a] !== undefined) return !!F.isContract[a]; if (facts[a] && facts[a].isContract !== undefined) return !!facts[a].isContract; return codeSet.has(a) ? true : undefined; },
      ...(quote ? { expectedOut: () => BigInt(quote) } : {}),
      _sharePct: F ? F.sharePct : undefined,
      _k: { ...X, origin: X.origin !== undefined ? X.origin : unicodeHost, token_info: tokenInfo, token_registry: registry },
      _facts: facts, _tokenInfo: tokenInfo, _book: local.contacts || [],
    };
  }

  // ---- decoding : server.mjs decode (same methods, same refusals) ; the share-of-balance trick is the one of run_loop / check_plus
  class Unverifiable extends Error {}
  function analyzeTx(tx, ctx) {
    const opts = { ...ctx }; delete opts._sharePct;
    let eff = D.E.analyzeTransaction(tx, opts);
    if (ctx._sharePct && (eff.outgoing || []).length) {
      const o = eff.outgoing.reduce((m, x) => (BigInt(x.amountRaw) > BigInt(m.amountRaw) ? x : m));
      const pct100 = BigInt(Math.round(ctx._sharePct * 100));
      if (pct100 > 0n) eff = D.E.analyzeTransaction(tx, { ...opts, balances: { [lc(o.token)]: ((BigInt(o.amountRaw) * 10000n) / pct100).toString() } });
    }
    return eff;
  }
  function decode(method, params, ctx) {
    const a0 = params[0];
    switch (method) {
      case 'eth_sendTransaction': case 'eth_signTransaction':
        if (!a0 || typeof a0 !== 'object') throw new Unverifiable('transaction illisible');
        return analyzeTx(a0, ctx);
      case 'eth_sendRawTransaction':
        if (typeof a0 !== 'string') throw new Unverifiable('transaction brute illisible');
        return D.E.analyzeRawTransaction(a0, ctx);
      case 'wallet_sendCalls': {
        if (!a0 || !Array.isArray(a0.calls) || !a0.calls.length || a0.calls.length > 64) throw new Unverifiable('lot de calls illisible');
        return D.mergeEffects(a0.calls.map((call) => analyzeTx({ from: a0.from || ctx.from, chainId: a0.chainId, type: '0x2', ...call }, ctx)));
      }
      case 'eth_signTypedData_v4': case 'eth_signTypedData_v3': case 'eth_signTypedData': {
        const td = (typeof params[1] === 'string' && !HEX20.test(params[1])) || (params[1] && typeof params[1] === 'object') ? params[1] : params[0];
        if (Array.isArray(td)) throw new Unverifiable('eth_signTypedData (v1) non gere');
        return D.E.analyzeTypedData(td, ctx);
      }
      case 'personal_sign': {
        let m = params[0]; if (HEX20.test(String(params[0])) && params[1] !== undefined && !HEX20.test(String(params[1]))) m = params[1];
        return D.E.analyzePersonalSign(m, ctx);
      }
      case 'eth_sign': return D.E.analyzeEthSign(HEX20.test(String(params[0])) ? params[1] : params[0], ctx);
      case 'wallet_switchEthereumChain': case 'wallet_addEthereumChain': {
        const e = D.analyzeChainRequest({ method, params }, ctx); if (!e) throw new Unverifiable('requete de reseau non geree'); return e;
      }
      default: throw new Unverifiable(`methode ${method} non geree par le moteur d'effets`);
    }
  }
  function toIntent(body, given) {
    const obj = given && typeof given === 'object' ? given : (body.intent && typeof body.intent === 'object' ? body.intent : null);
    const text = typeof body.intent_text === 'string' ? body.intent_text.slice(0, 500) : undefined;
    const pasted = typeof body.pasted_message === 'string' ? body.pasted_message.slice(0, 6000) : undefined;
    if (obj) return { rich: true, intent: { ...(pasted ? { pastedMessage: pasted } : {}), ...obj } };
    const base = { declaredAt: Date.now(), ...(text ? { freeText: text } : {}), ...(pasted ? { pastedMessage: pasted } : {}) };
    const c = body.intent;
    if (c === 'pay') return { intent: { ...base, kind: 'pay_someone' } };
    if (c === 'receive' || c === 'login') return { intent: { ...base, kind: 'connect_or_accept_offer' } };
    if (c === 'asked') return { intent: { ...base, kind: 'asked_by_someone', askedBy: 'other' } };
    return { intent: null, aside: text || pasted ? base : null }; // no kind : the comparator is not run ; the texts still reach the detectors
  }

  // ---- live facts, time-boxed. Never throws. -> { F, missing, ms }
  async function liveFacts(live, body, local, from, chainId, o) {
    const t0 = nowMs();
    const done = (F, missing) => ({ F, missing, ms: r2(nowMs() - t0) });
    if (live === null || live === undefined || live === false) return done(null, ['live_context_absent']);
    try {
      let src = live;
      if (src === true) { if (!D.provider) return done(null, ['live_context_absent']); src = await D.provider(); }
      const params = Array.isArray(body.params) ? body.params : [];
      const hasLocal = (local.contacts || []).length || (local.history || []).length;
      const input = { chainId, from, request: { method: String(body.method || ''), params }, rpcUrl: o.rpcUrl || env().SENTINELLE_RPC_URL || env().HOLDUP_RPC_URL || undefined,
        seen: hasLocal ? [...(local.contacts || []).map((c) => c.address), ...(local.history || []).filter((x) => x.direction === 'sortie').map((x) => lc(x.address))] : undefined,
        options: { budgetMs: o.budgetMs } };
      let call = null;
      if (typeof src === 'function') call = () => src(input);
      else if (src && typeof src.liveEngineContext === 'function') call = async () => ({ ...(await src.liveEngineContext(input)).engine, source: 'provider' });
      if (!call) { const F = normFacts(src); return done(F, F ? F.missing : ['live_context_absent']); }
      let timer; const late = new Promise((res) => { timer = setTimeout(() => res('__timeout__'), o.budgetMs + 150); });
      const p = Promise.resolve().then(call); p.catch(() => {});
      const got = await Promise.race([p, late]); clearTimeout(timer);
      if (got === '__timeout__') return done(null, ['live_context_timeout']);
      const F = normFacts(got);
      return done(F, F ? F.missing : ['live_context_absent']);
    } catch (e) { return done(null, ['live_context_failed']); }
  }

  // ---- presentation of a verdict that differs from the product's own answer (tail of server.mjs evaluate, on the context used here)
  function render(A, niveau, top, body, local, lowered) {
    const { eff, pol, adem, method, host, chainId } = A;
    const e = eff || {};
    let flags = (e.risk_flags || []).filter((f) => f.severity !== 'info');
    let polReasons = pol ? pol.reasons : [];
    if (A.seaportCrit) flags = [...flags, A.seaportCrit];
    if (lowered) { flags = flags.filter((f) => f.severity !== 'critical'); polReasons = polReasons.filter((r) => r.sev === 'warn'); } // the corrected reasons are no longer shown as the danger
    const codes = [...new Set([...flags.map((f) => f.code), ...polReasons.map((r) => r.code), ...(pol ? pol.notes : [])])];
    const grants = !!((e.approvals || []).length || e.delegation || (e.controlChange || []).length || (e.signature && ['permit', 'permit2', 'blind', 'eth_sign'].includes(e.signature.kind)));
    const funds = (e.outgoing || []).length > 0;
    const opaque = !!(e.opaque || (e.opaqueReasons || []).length);
    const contact = (() => { const o = (e.outgoing || [])[0]; return (o && (local.contacts || []).find((c) => c.address === lc(o.to))) || null; })();
    const ex = { chainId: chainId ?? e.chainId, contact };
    const pres = D.present({ eff: e, S: new Set(codes), niveau, method, host, chainId: ex.chainId, contact, intentText: body.intent_text, funds, opaque });
    let { fid, texts, source } = pres; let secours = pres.secours;
    const pt = typeof body.pageText === 'string' ? body.pageText.slice(0, 4000) : '';
    const press = (funds || grants) && pt ? D.findPressure(pt) : null;
    const scen = (funds || grants) && pt ? D.scenarioFiche({ fid, pressure: press, pageText: pt, funds, grants, niveau }) : null;
    if (scen) { fid = scen; secours = null; texts = D.buildTexts(scen, e, host, ex); source = 'fiche'; }
    if (top) { // a detector decided the level : its fiche gives the frame, its own sentence says what really happens
      const t = DETECTOR_FICHE[top.code] || '~generique';
      if (t[0] === '~') { fid = null; secours = t.slice(1); texts = D.buildSecours(secours, e, host, ex); source = 'secours'; }
      else { fid = e.kind !== 'signature' && t === 'F02' ? 'F01' : t; secours = null; texts = D.buildTexts(fid, e, host, ex); source = 'fiche'; }
      texts = { ...texts, reel: humanize(top.detail) || texts.reel }; source += '+detecteur';
    }
    let level = niveau === 'critical' ? 'danger' : 'attention', why;
    if (niveau === 'warn' && fid === 'F25' && !top) { level = 'unknown'; why = 'effets non lisibles : ' + ((e.opaqueReasons || [])[0] || 'appel inconnu'); }
    const out = { level, niveau, engine: 'sentinelle-local', fiche: fid || null, texts, texts_source: source, reasons: [texts.danger, texts.action],
      raisons: [...flags.map((f) => ({ code: f.code, severity: f.severity, detail: f.detail })), ...polReasons.map((r) => ({ code: r.code, severity: r.sev || undefined, said: r.said, does: r.does })), ...A.raised.map((f) => ({ code: f.code, severity: f.severity, detail: f.detail, source: 'plus' }))],
      codes: [...new Set([...codes, ...A.raised.map((f) => f.code)])], effects: { grants_right: grants, funds_out: funds }, risk_signals: [], latency_engine_ms: 0 };
    const reasonCodes = [...flags.map((f) => f.code), ...polReasons.map((r) => r.code)];
    out.opacity_only = !top && (typeof e.opacityOnly === 'boolean' ? e.opacityOnly : (niveau !== 'info' && reasonCodes.length > 0 && D.E.OPACITY_CODES && reasonCodes.every((c) => D.E.OPACITY_CODES.has(c))));
    out.title = out.opacity_only ? D.TITRE_NON_VERIFIE : fid ? (D.fiches[fid] || {}).menace : ((D.SECOURS_TITRE || {})[secours] || (D.SECOURS_TITRE || {}).generique);
    if (why) { out.indeterminate = true; out.why = why; }
    out.said = { text: '', amount: texts.croit, detail: '' }; out.real = { text: '', amount: texts.reel, detail: '' };
    if (niveau === 'critical') out.lead = 'Ce que tu penses faire et ce qui se passe vraiment ne correspondent pas.';
    const lookalike = (e.counterparties || []).find((c) => c.lookalikeOf);
    if (lookalike && !lowered) {
      const bk = (local.contacts || []).find((c) => c.address === lc(lookalike.lookalikeOf));
      out.address_diff = { expected: lookalike.lookalikeOf, actual: lookalike.address, expectedLabel: bk ? `${bk.label} (adresse déjà utilisée par toi)` : 'Adresse déjà utilisée par toi' };
      out.risk_signals.push('lookalike');
    }
    if (((local.contacts || []).length || (local.history || []).length) && (e.counterparties || []).some((c) => c.firstSeenByUser && !c.lookalikeOf && (e.outgoing || []).some((o) => lc(o.to) === c.address))) out.risk_signals.push('new_recipient');
    if (body.intent && adem && adem.reasons.some((r) => /^unexpected_|^wrong_recipient|^amount_exceeded|^asked_by/.test(r.code))) out.intent_contradiction = true;
    if (press && niveau !== 'info') { out.level = 'manipulation'; out.quote = press.quote; out.reasons.unshift('Un vrai support ne te demandera jamais ça.'); out.niveau = 'critical'; out.niveau_note = 'pression repérée sur la page'; }
    return out;
  }
  const unverified = (why) => {
    const f = D.fiches.F25 || {}; const clean = (s) => String(s || '').replace(/\{\w+\}/g, '').replace(/\s{2,}/g, ' ').replace(/\s+([.,:;])/g, '$1').trim();
    const t = { croit: clean(f.croit), reel: clean(f.reel), danger: clean(f.danger), action: clean(f.action) };
    return { level: 'unknown', niveau: 'warn', indeterminate: true, why, engine: 'sentinelle-local', fiche: 'F25', title: D.TITRE_NON_VERIFIE, opacity_only: true, texts: t, reasons: [t.danger, t.action],
      raisons: [{ code: 'unverifiable', severity: 'warn', detail: why }], effects: { grants_right: false, funds_out: false }, risk_signals: [], latency_engine_ms: 0 };
  };

  return async function evaluatePlus(body, local, opts = {}) {
    const T0 = nowMs();
    const o = { detectors: true, classifier: undefined, budgetMs: 1500, detectorTimeoutMs: 1500, ...opts };
    local = { contacts: [], history: [], protected: [], knownSpenders: [], ...(local || {}) };
    // public per-chain list of known protocols (pipeline/known_protocols.json) : given to the product AND to the detectors, like an entry of context.local.json
    if (o.knownProtocols !== false && D.knownProtocols && body && typeof body === 'object') {
      const p0 = Array.isArray(body.params) && body.params[0] && typeof body.params[0] === 'object' ? body.params[0] : {};
      const list = D.knownProtocols[String(parseChain(body.chainId) ?? parseChain(p0.chainId))];
      if (list && list.length) local = { ...local, knownSpenders: [...new Set([...(local.knownSpenders || []), ...list])] };
    }
    const ms = { product: 0, live: 0, chain: 0, detectors: 0, total: 0 };
    const errors = [];
    // ---- the product's own answer (always computed : it is the fallback and the floor)
    let P = null;
    { const t = nowMs(); try { P = D.evaluate(body, local); } catch (e) { errors.push('produit : ' + String((e && e.message) || e).slice(0, 120)); } ms.product = r2(nowMs() - t); }
    const pLevel = P ? benchLevel(P) : 'unknown';
    const finish = (v, plus) => {
      ms.total = r2(nowMs() - T0);
      v.plus = { ...plus, product: pLevel, errors, ms };
      v.context_live = !!plus.liveUsed; v.context_missing = plus.missingFacts;
      v.latency_engine_ms = ms.total;
      return v;
    };
    try {
      if (!body || typeof body !== 'object') throw new Error('requete illisible');
      const method = typeof body.method === 'string' ? body.method.slice(0, 80) : '';
      const params = Array.isArray(body.params) ? body.params : [];
      const host = hostOf(body.origin);
      const p0 = params[0] && typeof params[0] === 'object' ? params[0] : {};
      const chainId = parseChain(body.chainId) ?? parseChain(p0.chainId);
      const from = HEX20.test(String(body.from || '')) ? lc(body.from) : (HEX20.test(String(p0.from || '')) ? lc(p0.from) : undefined);
      const request = { method, params };

      const LV = await liveFacts(o.live, body, local, from, chainId, o); ms.live = LV.ms;
      const F = LV.F;
      const I = toIntent(body, o.intent);
      const richer = hasAnyFact(F) || !!I.rich;

      // ---- 1. the product chain on the richest context
      const tC = nowMs();
      const ctx = buildCtx(body, local, from, chainId, F);
      let eff = null, adem = null, pol = null, base = 'unknown', unreadable = null, seaportCrit = null;
      try {
        if (!method) throw new Unverifiable('methode absente');
        eff = decode(method, params, ctx);
        D.applyExtraRules(eff, request, ctx);
        if (eff.shareOfBalancePct === undefined && ctx._sharePct !== undefined && !(eff.outgoing || []).length) eff.shareOfBalancePct = ctx._sharePct;
        adem = I.intent ? D.compare(I.intent, eff) : null;
        pol = D.applyPolicy({ eff, adem, ctx, intent: I.intent, request });
        base = pol.level === 'critical' ? 'critical' : pol.level === 'warn' ? 'warn' : 'ok';
      } catch (e) {
        unreadable = e instanceof Unverifiable ? e.message : 'analyse impossible (' + String((e && e.message) || e).slice(0, 120) + ')';
        if (!(e instanceof Unverifiable)) errors.push('moteur : ' + unreadable);
        eff = null; adem = null; pol = null;
      }
      // server rule (raise only) : Seaport order giving an NFT for (almost) nothing in native currency
      if (eff && eff.seaport) {
        const give = eff.seaport.give || [], get = eff.seaport.get || [];
        let total = 0n; try { total = get.reduce((t, g) => t + BigInt(g.min || 0), 0n); } catch { /* ignore */ }
        if (give.some((g) => g.type >= 2) && get.every((g) => g.type === 0) && total < 10n ** 15n) {
          seaportCrit = { code: 'seaport_zero_price', severity: 'critical', detail: 'ordre de vente NFT a un prix quasi nul (' + total + ' wei)' }; eff.seaportPriceWei = total.toString(); base = 'critical';
        }
      }
      ms.chain = r2(nowMs() - tC);

      // ---- 2. detectors : same loop as redteam/check_plus.mjs
      const tD = nowMs();
      let level = base; const raised = [], lowers = [], loweredBy = []; let ademCritical = false, top = null;
      const list = o.detectors === false ? [] : Array.isArray(o.detectors) ? o.detectors : (D.DETECTORS || []);
      const X = F ? F.extra : {};
      const dIntent = I.intent || I.aside || {};
      const capIntent = !I.rich && !I.intent && o.intentPremise === 'warn';
      const c = { request, intent: dIntent, context: { ...X, chainId, victim: from, origin: X.origin !== undefined ? X.origin : body.origin, address_book: local.contacts || [], history: local.history || [], token_info: ctx._tokenInfo } };
      const reasons = eff ? eff.risk_flags.filter((f) => f.severity !== 'info').map((f) => `[${f.severity}] ${f.code}`) : [];
      for (const d of list) {
        if (o.classifier === false && d.id === 'pasted_message') continue;
        let r;
        try {
          let timer; const late = new Promise((res) => { timer = setTimeout(() => res('__timeout__'), o.detectorTimeoutMs); });
          const p = Promise.resolve().then(() => d.run({ c, ctx, eff, request, intent: dIntent, level, reasons, adem, policy: pol })); p.catch(() => {});
          r = await Promise.race([p, late]); clearTimeout(timer);
          if (r === '__timeout__') { errors.push(`detecteur ${d.id} : delai depasse`); continue; }
        } catch (e) { errors.push(`detecteur ${d.id} : ${String((e && e.message) || e).slice(0, 120)}`); continue; }
        if (!r) continue;
        for (const f0 of r.flags || []) {
          if (!(f0.severity in RANK)) continue;
          // a flag whose premise is the DECLARED intent is not a red screen when the user declared none (product only ; a full Intent object keeps the bench rule)
          const f = capIntent && INTENT_PREMISE.has(f0.code) && f0.severity === 'critical' ? { ...f0, severity: 'warn' } : f0;
          raised.push({ code: f.code, severity: f.severity, detail: humanize(f.detail), by: d.id });
          const cur = level === 'unknown' ? -1 : RANK[level];
          if (RANK[f.severity] > cur) { level = f.severity; top = raised[raised.length - 1]; }
        }
        if (r.lower) lowers.push({ id: d.id, ...r.lower });
        if ((r.flags || []).some((f) => f.severity === 'critical' && !(capIntent && INTENT_PREMISE.has(f.code)))) ademCritical = true;
      }
      for (const l of lowers) if (!ademCritical && RANK[l.to] < RANK[level]) { loweredBy.push({ from: level, to: l.to, why: l.why, by: l.id }); level = l.to; top = null; }
      ms.detectors = r2(nowMs() - tD);
      if (top && RANK[top.severity] !== RANK[level]) top = null;

      // ---- 3. against the product's own answer
      const pressure = !!P && P.level === 'manipulation';
      let final = level, path = 'plus', relaxed = false;
      const pOwnCritical = pressure || (!!P && (P.codes || []).includes('seaport_zero_price') && !seaportCrit);
      if (rk(pLevel) > rk(final)) {
        if (pOwnCritical || (!richer && !loweredBy.length)) { final = pLevel; path = 'product'; } // nothing more was known : the product's answer stands
        else relaxed = !loweredBy.length; // a known fact or a documented correction explains the lower level
      }
      const plus = { path, level: final, base, raisedBy: raised.filter((f) => RANK[f.severity] > (base === 'unknown' ? -1 : RANK[base]) || f === top).map(({ code, severity, detail }) => ({ code, severity, detail })),
        signals: raised.map(({ code, severity, by }) => ({ code, severity, by })), loweredBy, relaxedByFacts: relaxed, liveUsed: !!F,
        facts: F ? { isContract: F.isContract, ageBlocks: F.ageBlocks, balances: Object.keys(F.balances), tokens: F.tokenMeta, allowances: F.allowances } : {},
        missingFacts: LV.missing, notVerified: LV.missing.length ? 'Certains points n’ont pas pu être vérifiés sur le réseau : ' + (F ? LV.missing.length + ' fait(s) manquant(s).' : 'aucune lecture du réseau.') : null };
      if (path === 'product' || (P && final === pLevel && !top && !loweredBy.length && !relaxed)) return finish({ ...P }, { ...plus, path: path === 'product' ? 'product' : 'plus' });
      if (final === 'unknown') return finish(P ? { ...P } : unverified(unreadable || 'analyse impossible'), plus);
      const A = { eff, pol, adem, method, host, chainId, raised, seaportCrit };
      const v = render(A, final === 'critical' ? 'critical' : final === 'warn' ? 'warn' : 'info', top, body, local, loweredBy.length > 0);
      if (pressure && P && final !== 'critical') { v.level = 'manipulation'; v.niveau = 'critical'; v.quote = P.quote; }
      return finish(v, plus);
    } catch (e) {
      // ---- 4. internal error : the product's answer, or "not verified". Never green.
      errors.push('plus : ' + String((e && e.message) || e).slice(0, 160));
      const v = P ? { ...P } : unverified('erreur interne');
      return finish(v, { path: 'fallback', level: P ? pLevel : 'unknown', base: 'unknown', raisedBy: [], signals: [], loweredBy: [], relaxedByFacts: false, liveUsed: false, facts: {}, missingFacts: ['live_context_absent'], notVerified: null });
    }
  };
}

// ------------------------------------------------------------------ Node binding (lazy : nothing is loaded before the first call)
let bound = null;
export async function loadNodeDeps(over = {}) {
  const u = (p) => new URL(p, import.meta.url).href;
  const [S, E, C, R, Pol, U, Det, url, fs] = await Promise.all([import(u('../server/server.mjs')), import(u('../engine/src/engine.mjs')), import(u('../engine/vendor/compare.ts')),
    import(u('../engine/src/rules_extra.mjs')), import(u('../run/policy.mjs')), import(u('../engine/src/util.mjs')), import(u('../detectors_adem/index.mjs')), import('node:url'), import('node:fs')]);
  const texts = JSON.parse(fs.readFileSync(new URL('../../U_textes_utilisateur.json', import.meta.url), 'utf8'));
  let knownProtocols = {};
  try { const kp = JSON.parse(fs.readFileSync(new URL('./known_protocols.json', import.meta.url), 'utf8')); for (const [c, l] of Object.entries(kp)) if (Array.isArray(l)) knownProtocols[c] = l.filter((e) => e && HEX20.test(String(e.address))).map((e) => lc(e.address)); } catch { knownProtocols = {}; }
  return { evaluate: S.evaluate, E, compare: C.compare, applyExtraRules: R.applyExtraRules, analyzeChainRequest: R.analyzeChainRequest, applyPolicy: Pol.applyPolicy, mergeEffects: S.mergeEffects,
    present: S.present, scenarioFiche: S.scenarioFiche, findPressure: S.findPressure, buildTexts: S.buildTexts, buildSecours: S.buildSecours, SECOURS_TITRE: S.SECOURS_TITRE, TITRE_NON_VERIFIE: S.TITRE_NON_VERIFIE,
    fiches: Object.fromEntries(texts.fiches.map((f) => [f.id, f])), DETECTORS: Det.DETECTORS, DEFAULT_TOKENS: U.DEFAULT_TOKENS, domainToUnicode: url.domainToUnicode,
    knownProtocols, provider: () => import(u('../context_live/provider.mjs')), env: () => process.env, loadLocalContext: S.loadLocalContext, ...over };
}
// Environment switches (read at call time) : HOLDUP_PLUS=0 -> product verdict only ; HOLDUP_DETECTORS=0 -> no detector ;
// SENTINELLE_RPC_URL / HOLDUP_RPC_URL set (or SENTINELLE_LIVE=1) -> live context ON unless options.live says otherwise ; SENTINELLE_LIVE=0 -> OFF ;
// SENTINELLE_LIVE_BUDGET_MS (default 1500) ; HOLDUP_CLASSIFIER (clef | clef-flash | keyword) -> pasted-message detector, off unless set.
export async function evaluatePlus(body, local, opts = {}) {
  bound ??= await loadNodeDeps().then((D) => ({ D, run: makeEvaluatePlus(D) }));
  const env = process.env;
  if (local === undefined) local = bound.D.loadLocalContext();
  if (env.HOLDUP_PLUS === '0') { const v = bound.D.evaluate(body, local); v.plus = { path: 'off', level: benchLevel(v), product: benchLevel(v), raisedBy: [], loweredBy: [], facts: {}, missingFacts: ['live_context_absent'], errors: [], ms: {} }; return v; }
  const o = { ...opts };
  if (o.detectors === undefined) o.detectors = env.HOLDUP_DETECTORS !== '0';
  if (o.live === undefined) o.live = env.SENTINELLE_LIVE !== '0' && (!!(env.SENTINELLE_RPC_URL || env.HOLDUP_RPC_URL) || env.SENTINELLE_LIVE === '1');
  if (o.budgetMs === undefined && Number(env.SENTINELLE_LIVE_BUDGET_MS) > 0) o.budgetMs = Number(env.SENTINELLE_LIVE_BUDGET_MS);
  return bound.run(body, local, o);
}

// Sentinelle - moteur EMBARQUE (version autonome). Aucun reseau, aucun module Node : tourne dans un service worker MV3.
// Meme chaine que server/server.mjs et run/run_loop.mjs : moteur d'effets (engine/src) -> comparateur d'Adem (vendor/compare, converti en JS)
// -> politique (policy) -> textes clairs (fiches U_textes_utilisateur). Le niveau le plus bas est 'info' : 'ok' n'existe pas.
import * as E from './src/engine.js';
import { compare } from './vendor/compare.js';
import { applyExtraRules, analyzeChainRequest } from './src/rules_extra.js';
import { applyPolicy } from './policy.js';
import TEXTS from './textes.js';

export const MAX_BODY = 256 * 1024;
export const ENGINE_NAME = 'sentinelle-embarque';
const FICHES = Object.fromEntries(TEXTS.fiches.map((f) => [f.id, f]));
const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const now_ms = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

// ------------------------------------------------------------------ punycode -> unicode (equivalent de url.domainToUnicode, absent d'un service worker)
function punyDecode(input) {
  const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
  const out = [];
  let basic = input.lastIndexOf('-'); if (basic < 0) basic = 0;
  for (let j = 0; j < basic; j++) { if (input.charCodeAt(j) >= 0x80) throw new Error('puny'); out.push(input.charCodeAt(j)); }
  const adapt = (delta, num, first) => { let k = 0; delta = first ? Math.floor(delta / damp) : delta >> 1; delta += Math.floor(delta / num); for (; delta > ((base - tMin) * tMax) >> 1; k += base) delta = Math.floor(delta / (base - tMin)); return Math.floor(k + ((base - tMin + 1) * delta) / (delta + skew)); };
  let n = 128, bias = 72, i = 0;
  for (let idx = basic > 0 ? basic + 1 : 0; idx < input.length;) {
    const oldi = i;
    for (let w = 1, k = base; ; k += base) {
      if (idx >= input.length) throw new Error('puny');
      const c = input.charCodeAt(idx++);
      const digit = c - 48 < 10 ? c - 22 : c - 65 < 26 ? c - 65 : c - 97 < 26 ? c - 97 : base;
      if (digit >= base) throw new Error('puny');
      i += digit * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (digit < t) break;
      w *= base - t;
    }
    const len = out.length + 1;
    bias = adapt(i - oldi, len, oldi === 0);
    n += Math.floor(i / len); i %= len;
    out.splice(i++, 0, n);
  }
  return String.fromCodePoint(...out);
}
export function domainToUnicode(host) {
  try { return String(host).split('.').map((l) => (/^xn--/i.test(l) ? punyDecode(l.slice(4)) : l)).join('.'); } catch { return String(host); }
}
function hostOf(origin) { try { return new URL(origin).hostname; } catch { return ''; } }

// ------------------------------------------------------------------ contexte hors ligne
// Adresses canoniques publiques (Permit2, Multicall3, CoW, Seaport 1.6, Safe MultiSendCallOnly) + 4 jetons majeurs.
const CANONICAL = ['0x000000000022D473030F116dDEE9F6B43aC78BA3', '0xcA11bde05977b3631167028862bE2a173976CA11', '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
  '0x0000000000000068F116a894984e2DB1123eB395', '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'].map(lc);
const TOKENS = [['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'USDC', 6], ['0xdAC17F958D2ee523a2206206994597C13D831ec7', 'USDT', 6],
  ['0x6B175474E89094C44Da98b954EedeAC495271d0F', 'DAI', 18], ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'WETH', 18]];

export const emptyLocal = () => ({ contacts: [], history: [], protected: [], knownSpenders: [] });
// Contexte local OPTIONNEL (stockage de l'extension). Absent ou illisible = tout est "inconnu".
export function sanitizeLocalContext(j) {
  if (!j || typeof j !== 'object') return emptyLocal();
  const okAddr = (a) => typeof a === 'string' && HEX20.test(a);
  const arr = (x) => (Array.isArray(x) ? x.slice(0, 5000) : []);
  return {
    contacts: arr(j.contacts).filter((c) => c && okAddr(c.address)).map((c) => ({ address: lc(c.address), label: String(c.label || '').slice(0, 80) })),
    history: arr(j.history).filter((h) => h && okAddr(h.address)),
    protected: arr(j.protected).filter(okAddr).map(lc),
    knownSpenders: arr(j.knownSpenders).filter(okAddr).map(lc),
  };
}
function parseChain(v) {
  if (v === null || v === undefined || v === '') return undefined;
  try { const n = typeof v === 'number' ? v : (/^0x/i.test(String(v)) ? Number(BigInt(v)) : Number(v)); return Number.isFinite(n) && n >= 0 ? n : undefined; } catch { return undefined; }
}
export function buildCtx(body, local, from, chainId) {
  const now = Math.floor(Date.now() / 1000);
  const tokenMeta = {};
  for (const [a, s, d] of TOKENS) tokenMeta[lc(a)] = { symbol: s, decimals: d, stable: ['USDC', 'USDT', 'DAI'].includes(s) };
  const known = [...CANONICAL, ...local.knownSpenders];
  const codeSet = new Set([...known, ...Object.keys(tokenMeta)]);
  const unicodeHost = domainToUnicode(hostOf(body.origin)) || hostOf(body.origin);
  return {
    chainId, from, now, origin: typeof body.origin === 'string' ? body.origin : undefined,
    protected: local.protected,
    knownSpenders: known, knownVerifiers: new Set(known),
    history: local.history.map((h) => ({ address: lc(h.address), ts: now - Math.round((h.minutes_ago || 0) * 60), direction: h.direction === 'sortie' ? 'out' : 'in', dust: h.direction !== 'sortie' && Number.parseFloat(h.amount) <= 0.01 })),
    contacts: local.contacts, tokenMeta, ageBlocks: {},
    codeOf: (a) => { a = lc(a); return codeSet.has(a) ? true : undefined; },
    _sharePct: undefined, _k: { origin: unicodeHost }, _facts: {}, _tokenInfo: {}, _book: local.contacts,
  };
}

// ------------------------------------------------------------------ decodage de la requete
export class Unverifiable extends Error {}
function analyzeTx(tx, ctx) { // meme logique que run_loop.analyzeTx (deux passes si une part de solde est fournie ; sans effet hors ligne)
  const opts = { ...ctx }; delete opts._sharePct;
  let eff = E.analyzeTransaction(tx, opts);
  if (ctx._sharePct && eff.outgoing.length) {
    const o = eff.outgoing.reduce((m, x) => (BigInt(x.amountRaw) > BigInt(m.amountRaw) ? x : m));
    const pct100 = BigInt(Math.round(ctx._sharePct * 100));
    if (pct100 > 0n) eff = E.analyzeTransaction(tx, { ...opts, balances: { [lc(o.token)]: ((BigInt(o.amountRaw) * 10000n) / pct100).toString() } });
  }
  return eff;
}
const lvlOf = (flags) => (flags.some((f) => f.severity === 'critical') ? 'critical' : flags.some((f) => f.severity === 'warn') ? 'warn' : 'ok');
function mergeEffects(list) { // copie de run_loop.mergeEffects
  if (list.length === 1) return list[0];
  const m = JSON.parse(JSON.stringify(list[0]));
  const cps = new Map(m.counterparties.map((c) => [c.address, c]));
  const seen = new Set(m.risk_flags.map((f) => f.code + '|' + f.detail));
  for (const e of list.slice(1)) {
    for (const f of ['outgoing', 'incoming', 'approvals', 'controlChange', 'nested']) (m[f] = m[f] || []).push(...(e[f] || []));
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
export function decode(method, params, ctx) {
  const request = { method, params };
  const a0 = params[0];
  switch (method) {
    case 'eth_sendTransaction': case 'eth_signTransaction':
      if (!a0 || typeof a0 !== 'object') throw new Unverifiable('transaction illisible');
      return analyzeTx(a0, ctx);
    case 'eth_sendRawTransaction':
      if (typeof a0 !== 'string') throw new Unverifiable('transaction brute illisible');
      return E.analyzeRawTransaction(a0, ctx);
    case 'wallet_sendCalls': {
      if (!a0 || !Array.isArray(a0.calls) || !a0.calls.length || a0.calls.length > 64) throw new Unverifiable('lot de calls illisible');
      return mergeEffects(a0.calls.map((call) => analyzeTx({ from: a0.from || ctx.from, chainId: a0.chainId, type: '0x2', ...call }, ctx)));
    }
    case 'eth_signTypedData_v4': case 'eth_signTypedData_v3': case 'eth_signTypedData': {
      const td = (typeof params[1] === 'string' && !HEX20.test(params[1])) || (params[1] && typeof params[1] === 'object') ? params[1] : params[0];
      if (Array.isArray(td)) throw new Unverifiable('eth_signTypedData (v1) non gere');
      return E.analyzeTypedData(td, ctx);
    }
    case 'personal_sign': {
      let m = params[0]; if (HEX20.test(String(params[0])) && params[1] !== undefined && !HEX20.test(String(params[1]))) m = params[1];
      return E.analyzePersonalSign(m, ctx);
    }
    case 'eth_sign': return E.analyzeEthSign(HEX20.test(String(params[0])) ? params[1] : params[0], ctx);
    case 'wallet_switchEthereumChain': case 'wallet_addEthereumChain': {
      const e = analyzeChainRequest(request, ctx); if (!e) throw new Unverifiable('requete de reseau non geree'); return e;
    }
    default: throw new Unverifiable(`methode ${method} non geree par le moteur d'effets`);
  }
}
// Niveau bas de la chaine, avec un contexte EXPLICITE (sert au serveur de mesure et aux tests d'equivalence avec run_loop).
export function analyze(request, ctx, intent) {
  const eff = decode(request.method, request.params, ctx);
  applyExtraRules(eff, request, ctx);
  if (eff.shareOfBalancePct === undefined && ctx._sharePct !== undefined && !eff.outgoing.length) eff.shareOfBalancePct = ctx._sharePct;
  const adem = intent ? compare(intent, eff) : null;
  const pol = applyPolicy({ eff, adem, ctx, intent: intent || null, request });
  return { eff, adem, pol };
}

// ------------------------------------------------------------------ intention (choix de l'extension -> Intent d'Adem)
function toIntent(body) {
  const c = body.intent;
  const text = typeof body.intent_text === 'string' ? body.intent_text.slice(0, 500) : undefined;
  const base = { declaredAt: Date.now(), ...(text ? { freeText: text } : {}) };
  if (c === 'pay') return { ...base, kind: 'pay_someone' };
  if (c === 'receive' || c === 'login') return { ...base, kind: 'connect_or_accept_offer' };
  if (c === 'asked') return { ...base, kind: 'asked_by_someone', askedBy: 'other' };
  return null; // 'other', vague ou absent : plancher objectif du moteur seul
}

// ------------------------------------------------------------------ textes clairs
const short = (a) => (a ? [a.slice(0, 6), a.slice(-4)] : ['', '']);
function fill(line, v) {
  let s = line.replace('{adresse_debut}…{adresse_fin}', v.adresse ? `${short(v.adresse)[0]}…${short(v.adresse)[1]}` : 'une autre adresse');
  s = s.replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : ''));
  return s.replace(/\s{2,}/g, ' ').replace(/\s+([.,:;])/g, '$1').trim();
}
const FALLBACK = {
  croit: "Je fais l'opération que je viens de demander.",
  reel: "Cette demande a des effets que tu n'as pas demandés.",
  danger: "Nous ne savons pas l'expliquer plus simplement pour l'instant.",
  action: "Annule, sauf si tu comprends exactement cette demande.",
};
function pickFiche(S, eff, method) {
  const has = (...c) => c.some((x) => S.has(x));
  const cc = (eff.controlChange || [])[0];
  if (has('asked_by_someone_outgoing')) return 'F21';
  if (has('delegation_7702', 'delegation_7702_all_chains', 'unexpected_delegation', 'unexpected_delegation_connect', 'authorization_tuple_x')) return 'F11';
  if (has('control_change') && cc) {
    if (/^safe\./.test(cc.type) || cc.type === 'erc7579.installModule') return 'F08';
    if (cc.type === 'upgrade' || cc.type === 'ens.setResolver') return 'F10';
    return 'F07';
  }
  if (has('delegatecall')) return 'F09';
  if (has('lookalike_address', 'address_poisoning')) return 'F13';
  if (has('ens_name_lookalike', 'origin_non_ascii', 'site_origin_mismatch')) return 'F20';
  if (has('approval_for_all', 'nft_all')) return 'F03';
  if (eff.seaport && has('order_min_out_absurd', 'unlimited_allowance', 'seaport_zero')) return 'F04';
  if (has('token_symbol_impersonation')) return 'F15';
  if (has('token_unsellable', 'token_sell_tax_extreme', 'token_tax_high')) return 'F16';
  if (has('batch_foreign_unlimited_approval', 'nested_approval')) return 'F12';
  if (method === 'eth_sign' || has('eth_sign') || (eff.signature && eff.signature.kind === 'blind')) return 'F05';
  const approvals = eff.approvals || [];
  if (approvals.length || has('unlimited_allowance', 'unexpected_approval', 'unexpected_approval_connect', 'permit_new_contract', 'approval_to_eoa', 'external_spender', 'far_expiry', 'no_expiry', 'unlimited_approval_swap')) {
    return eff.kind === 'signature' ? 'F02' : 'F01';
  }
  if (has('swap_recipient', 'swap_recipient_not_self', 'router_payout_to_other', 'order_output_recipient_not_self', 'service_beneficiary_not_self', 'signed_transfer_to_other')) return 'F17';
  if (has('slippage_high', 'slippage_unbounded', 'order_min_out_absurd')) return 'F18';
  if (has('wrong_recipient')) return 'F19';
  if (eff.siwe && has('site_origin_mismatch')) return 'F06';
  return null;
}
function buildTexts(fid, eff, host, extras) {
  const f = FICHES[fid];
  const out0 = (eff.outgoing || [])[0];
  const ap = (eff.approvals || [])[0];
  const cp = (eff.counterparties || []).find((c) => c.lookalikeOf) || null;
  const cc = (eff.controlChange || [])[0];
  const sym = (out0 && out0.symbol) || (ap && ap.symbol) || undefined;
  const amt = out0 ? out0.amount : (ap && ap.amount && ap.amount !== 'unlimited' ? ap.amount : undefined);
  const v = {
    site: (eff.siwe && eff.siwe.domain) || host || 'ce site', site_reel: host || 'ce site',
    jeton: sym || 'jetons', montant: amt || '', jours: 'plusieurs', nombre: 'plusieurs',
    prix_vente: 'presque rien', valeur_nft: 'bien plus', montant_recu: 'rien',
    contact: extras.contactLabel || 'ton contact', reseau_demande: 'le réseau demandé', reseau_reel: 'un autre réseau',
    adresse: (cp && cp.address) || (cc && cc.subject) || (out0 && out0.to) || '',
  };
  if (ap && ap.expiry) { // correctif par rapport au serveur : une echeance "infinie" (uint max) donnait "1.3e+72 jours"
    const days = Math.round((Number(ap.expiry) - Math.floor(Date.now() / 1000)) / 86400);
    v.jours = Number.isFinite(days) && days <= 3650 ? String(Math.max(1, days)) : 'un nombre illimité de';
  }
  return { croit: fill(f.croit, v), reel: fill(f.reel, v), danger: fill(f.danger, v), action: fill(f.action, v) };
}
const PRESSURE = /(support|conseiller|urgent|vite|ne (le )?dis (rien|à personne|a personne)|anydesk|teamviewer|d[ée]place(r)? (tes|vos) fonds|remboursement|rembours|dernier avertissement|compte (sera )?(bloqu|suspendu)|act(?:ion)? imm[ée]diate|do not tell|don'?t tell anyone|urgent|refund|customer support)/i;

// Verdict d'attente : jamais ok, jamais rouge non plus. Sert aussi de repli si le moteur plante.
export function indeterminate(why, ms = 0) {
  const t = Object.fromEntries(['croit', 'reel', 'danger', 'action'].map((k) => [k, fill(FICHES.F25[k], { jeton: 'jetons', montant: '' })]));
  return { level: 'unknown', niveau: 'warn', indeterminate: true, why, engine: ENGINE_NAME, fiche: 'F25', texts: t, reasons: [t.danger, t.action], raisons: [{ code: 'unverifiable', severity: 'warn', detail: why }],
    effects: { grants_right: false, funds_out: false }, risk_signals: [], latency_engine_ms: ms };
}

// ------------------------------------------------------------------ evaluation complete d'une requete recue du pont (contrat de POST /check)
export function evaluate(body, local = emptyLocal()) {
  const t0 = now_ms();
  const ms = () => Math.round((now_ms() - t0) * 100) / 100;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return indeterminate('requete illisible', ms());
  const method = typeof body.method === 'string' ? body.method.slice(0, 80) : '';
  const params = Array.isArray(body.params) ? body.params : [];
  const host = hostOf(body.origin);
  const chainId = parseChain(body.chainId) ?? parseChain((params[0] && typeof params[0] === 'object') ? params[0].chainId : undefined);
  const from = HEX20.test(String(body.from || '')) ? lc(body.from) : (params[0] && typeof params[0] === 'object' && HEX20.test(String(params[0].from || '')) ? lc(params[0].from) : undefined);
  let eff = null, adem = null, pol = null, failure = null, intent = null;
  try {
    const ctx = buildCtx(body, local, from, chainId);
    if (!method) throw new Unverifiable('methode absente');
    intent = toIntent(body);
    ({ eff, adem, pol } = analyze({ method, params }, ctx, intent));
  } catch (e) {
    failure = e instanceof Unverifiable ? e.message : 'analyse impossible (' + String(e && e.message || e).slice(0, 120) + ')';
  }
  if (failure) return indeterminate(failure, ms());

  const flags = eff.risk_flags.filter((f) => f.severity !== 'info');
  const codes = [...new Set([...flags.map((f) => f.code), ...pol.reasons.map((r) => r.code), ...pol.notes])];
  const S = new Set(codes);
  const niveau = pol.level === 'critical' ? 'critical' : pol.level === 'warn' ? 'warn' : 'info'; // 'ok' n'existe pas : le plus bas est 'info'
  const grants = !!((eff.approvals || []).length || eff.delegation || (eff.controlChange || []).length || (eff.signature && ['permit', 'permit2', 'blind', 'eth_sign'].includes(eff.signature.kind)));
  const funds = (eff.outgoing || []).length > 0;
  const opaque = !!(eff.opaque || (eff.opaqueReasons || []).length);
  let fid = pickFiche(S, eff, method);
  const contactLabel = (() => { const o = (eff.outgoing || [])[0]; const b = o && local.contacts.find((c) => c.address === lc(o.to)); return b && b.label; })();
  let texts, source = 'fiche';
  const lookalike = (eff.counterparties || []).find((c) => c.lookalikeOf);
  if (!fid) {
    if (niveau === 'info') {
      fid = 'F26';
      texts = buildTexts('F26', eff, host, { contactLabel });
      if (!funds) { texts.reel = 'Nous n’avons trouvé aucun signal dangereux dans cette demande.'; source = 'fiche+partiel'; }
    } else if (opaque || niveau === 'warn') { fid = 'F25'; texts = buildTexts('F25', eff, host, { contactLabel }); }
    else { fid = null; texts = { ...FALLBACK }; source = 'secours'; }
  }
  if (fid && !texts) texts = buildTexts(fid, eff, host, { contactLabel });

  let level = niveau === 'critical' ? 'danger' : 'attention'; // niveau d'affichage de l'interface : jamais de vert
  let why;
  if (niveau === 'warn' && fid === 'F25') { level = 'unknown'; why = 'effets non lisibles : ' + ((eff.opaqueReasons || [])[0] || 'appel inconnu'); }
  const out = {
    level, niveau, engine: ENGINE_NAME, fiche: fid, texts, texts_source: source,
    reasons: [texts.danger, texts.action],
    raisons: [...flags.map((f) => ({ code: f.code, severity: f.severity, detail: f.detail })), ...pol.reasons.map((r) => ({ code: r.code, severity: r.sev || undefined, said: r.said, does: r.does }))],
    codes, effects: { grants_right: grants, funds_out: funds }, risk_signals: [], latency_engine_ms: 0,
  };
  if (why) { out.indeterminate = true; out.why = why; }
  out.said = { text: '', amount: texts.croit, detail: '' }; out.real = { text: '', amount: texts.reel, detail: '' };
  if (niveau === 'critical') out.lead = 'Ce que tu penses faire et ce qui se passe vraiment ne correspondent pas.';
  if (lookalike) {
    const exp = lookalike.lookalikeOf; const bk = local.contacts.find((c) => c.address === lc(exp));
    out.address_diff = { expected: exp, actual: lookalike.address, expectedLabel: bk ? `${bk.label} (adresse déjà utilisée par toi)` : 'Adresse déjà utilisée par toi' };
    out.risk_signals.push('lookalike');
  }
  if ((local.contacts.length || local.history.length) && (eff.counterparties || []).some((c) => c.firstSeenByUser && !c.lookalikeOf && (eff.outgoing || []).some((o) => lc(o.to) === c.address))) out.risk_signals.push('new_recipient');
  if (body.intent && adem && adem.reasons.some((r) => /^unexpected_|^wrong_recipient|^amount_exceeded|^asked_by/.test(r.code))) out.intent_contradiction = true;
  // indice de manipulation : texte de la page + droit ou sortie d'argent (jamais seul)
  const pt = typeof body.pageText === 'string' ? body.pageText.slice(0, 4000) : '';
  const m = (funds || grants) && pt ? pt.match(new RegExp('.{0,60}' + PRESSURE.source + '.{0,60}', 'i')) : null;
  if (m && niveau !== 'info') { out.level = 'manipulation'; out.quote = m[0].trim(); out.reasons.unshift('Un vrai support ne te demandera jamais ça.'); out.niveau = 'critical'; out.niveau_note = 'pression repérée sur la page'; }
  out.latency_engine_ms = ms();
  return out;
}

// Point d'entree du service worker : borne la taille, ne leve jamais, ne renvoie jamais 'ok'.
export function check(body, local) {
  const t0 = now_ms();
  const v = checkInner(body, local);
  v.latency_ms = Math.round((now_ms() - t0) * 100) / 100;
  return v;
}
function checkInner(body, local) {
  let v;
  try {
    let size = 0;
    try { size = JSON.stringify(body === undefined ? null : body).length; } catch { return indeterminate('requete illisible (non serialisable)'); }
    if (size > MAX_BODY) return indeterminate('requete trop volumineuse (' + size + ' octets, max ' + MAX_BODY + ')');
    v = evaluate(body, local || emptyLocal());
  } catch (e) {
    v = indeterminate('erreur interne du moteur : ' + String(e && e.message || e).slice(0, 120));
  }
  if (!v || !['critical', 'warn', 'info'].includes(v.niveau) || !['attention', 'danger', 'manipulation', 'unknown'].includes(v.level)) v = indeterminate('verdict invalide');
  return v;
}

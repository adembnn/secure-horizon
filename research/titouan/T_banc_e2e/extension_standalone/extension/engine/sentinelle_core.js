// Hold up - moteur EMBARQUE (version autonome). Aucun reseau, aucun module Node : tourne dans un service worker MV3.
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

const STABLES = ['USDC', 'USDT', 'DAI'];
export const emptyLocal = () => ({ contacts: [], history: [], protected: [], knownSpenders: [], tokens: [] });
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
    // tokens of the chain in use (local Hardhat node, Fuji, ...) : { address, symbol, decimals, chainId? }. Without chainId the entry holds on every chain.
    tokens: arr(j.tokens).filter((t) => t && okAddr(t.address) && typeof t.symbol === 'string' && /^[A-Za-z0-9.$_-]{1,12}$/.test(t.symbol) && Number.isInteger(t.decimals) && t.decimals >= 0 && t.decimals <= 36)
      .map((t) => ({ address: lc(t.address), symbol: t.symbol, decimals: t.decimals, chainId: parseChain(t.chainId) })),
  };
}
function parseChain(v) {
  if (v === null || v === undefined || v === '') return undefined;
  try { const n = typeof v === 'number' ? v : (/^0x/i.test(String(v)) ? Number(BigInt(v)) : Number(v)); return Number.isFinite(n) && n >= 0 ? n : undefined; } catch { return undefined; }
}
export function buildCtx(body, local, from, chainId) {
  const now = Math.floor(Date.now() / 1000);
  const tokenMeta = {};
  // Same table as server/server.mjs (Ethereum mainnet addresses, applied whatever the chain : reported to the owner of the server).
  // local.tokens adds the tokens of the chain in use (local Hardhat 31337, Fuji 43113, ...) ; an entry with a chainId holds on that chain only.
  for (const [a, s, d] of TOKENS) tokenMeta[lc(a)] = { symbol: s, decimals: d, stable: STABLES.includes(s) };
  for (const t of local.tokens || []) if (t.chainId === undefined || t.chainId === chainId) tokenMeta[t.address] = { symbol: t.symbol, decimals: t.decimals, stable: STABLES.includes(t.symbol) };
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

// <<PRESENTATION (bloc IDENTIQUE, octet pour octet, a celui de server/server.mjs entre les memes marqueurs ; tests/run_tests.mjs verifie qu'il ne derive pas)
// Choix de la fiche de texte et affichage. Depend de : FICHES (id -> fiche de U_textes_utilisateur.json), lc().
const shortAddr = (a) => (a ? [a.slice(0, 6), a.slice(-4)] : ['', '']);
function fill(line, v) {
  let s = line.replace('{adresse_debut}…{adresse_fin}', v.adresse ? `${shortAddr(v.adresse)[0]}…${shortAddr(v.adresse)[1]}` : 'une autre adresse');
  s = s.replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : ''));
  return s.replace(/\s{2,}/g, ' ').replace(/\s+([.,:;])/g, '$1').trim();
}
export const FALLBACK = {
  croit: "Je fais l'opération que je viens de demander.",
  reel: "Cette demande a des effets que tu n'as pas demandés.",
  danger: "Nous ne savons pas l'expliquer plus simplement pour l'instant.",
  action: "Annule, sauf si tu comprends exactement cette demande.",
};

// ---- monnaie native par reseau (le moteur dit 'NATIVE' : l'utilisateur doit lire AVAX, ETH, POL...)
export const NATIVE_SYMBOL = {
  1: 'ETH', 10: 'ETH', 56: 'BNB', 97: 'BNB', 100: 'xDAI', 137: 'POL', 80002: 'POL', 250: 'FTM', 324: 'ETH', 1101: 'ETH', 5000: 'MNT', 8453: 'ETH', 34443: 'ETH',
  42161: 'ETH', 42170: 'ETH', 42220: 'CELO', 43114: 'AVAX', 43113: 'AVAX', 59144: 'ETH', 81457: 'ETH', 534352: 'ETH', 7777777: 'ETH',
  11155111: 'ETH', 17000: 'ETH', 84532: 'ETH', 421614: 'ETH', 11155420: 'ETH', 5: 'ETH',
};
export const NATIVE_UNKNOWN = 'unités du réseau';
export const nativeSymbol = (chainId) => NATIVE_SYMBOL[Number(chainId)] || NATIVE_UNKNOWN;

// ---- motifs de pression : mots entiers (frontieres Unicode, accents compris) : 'invite' ou 'visite' ne contiennent pas 'vite'
const W0 = '(?<![\\p{L}\\p{N}_])', W1 = '(?![\\p{L}\\p{N}_])';
const PRESSURE_KINDS = [ // [fiche du scenario, termes]
  ['F22', ['rembours(?:ements?|ers?|[ée]e?s?)?', 'refunds?', 'refunded']],
  ['F21', ['supports?', 'conseill(?:er|[èe]re)s?', 'anydesk', 'teamviewer', 'customer\\s+support']],
  [null, ['urgent(?:e|es|s)?', 'urgence', 'vite', 'ne\\s+(?:le\\s+)?di(?:s|tes)\\s+(?:rien|[àa]\\s+personne)', 'd[ée]place(?:r)?\\s+(?:tes|vos)\\s+fonds', 'dernier\\s+avertissement',
    'compte\\s+(?:sera\\s+)?(?:bloqu\\p{L}*|suspendu\\p{L}*)', 'act(?:ion)?\\s+imm[ée]diate', 'do\\s+not\\s+tell', 'don[\'’]?t\\s+tell\\s+anyone']],
];
const PRESSURE_SRC = W0 + '(?:' + PRESSURE_KINDS.flatMap(([, t]) => t).join('|') + ')' + W1;
export const PRESSURE = new RegExp(PRESSURE_SRC, 'iu');
const PRESSURE_QUOTE = new RegExp('.{0,60}' + PRESSURE_SRC + '.{0,60}', 'iu');
const KIND_RE = PRESSURE_KINDS.filter(([k]) => k).map(([k, t]) => [k, new RegExp(W0 + '(?:' + t.join('|') + ')' + W1, 'iu')]);
// -> { quote, fiche } ou null. fiche = scenario le plus parlant (F22 remboursement, F21 faux support) ou null.
export function findPressure(text) {
  const pt = typeof text === 'string' ? text.normalize('NFC') : '';
  if (!pt) return null;
  const m = pt.match(PRESSURE_QUOTE);
  if (!m) return null;
  const kind = KIND_RE.find(([, re]) => re.test(pt));
  return { quote: m[0].trim(), fiche: kind ? kind[0] : null };
}
const SCENARIO_CADEAU = new RegExp(W0 + '(?:cadeaux?|airdrops?|giveaway|gift|r[ée]clam(?:er|ez|e)|gagn(?:[ée]e?s?|ant))' + W1, 'iu');
const SCENARIO_RECRUTEUR = new RegExp(W0 + '(?:recruteu(?:r|se)|recrutement|embauche|offre\\s+d[\'’]emploi|job\\s+offer|recruiter)' + W1, 'iu');
const SCENARIO_PLACEMENT = new RegExp(W0 + '(?:placements?|investissements?|rendements?\\s+garantis?|trading)' + W1, 'iu');
const PROCHE = new RegExp(W0 + '(?:proche|ami|amie|fr[èe]re|s[œo]eur|fils|fille|maman|papa|m[èe]re|p[èe]re|famille|cousin|cousine|copain|copine)' + W1, 'iu');

// ---- table COMPLETE : code de raison du moteur / du comparateur -> fiche. 'Fnn' = fiche ; '~cle' = texte de secours (SECOURS) ; null = info, rien a dire.
export const REASON_FICHE = {
  // comparateur d'Adem (compare.ts)
  asked_by_someone_outgoing: 'F21', new_contract: 'F24', high_balance_share: '~gros_solde', lookalike_address: 'F13', low_confidence: 'F25',
  unexpected_approval: 'F01', unexpected_approval_connect: 'F01', unexpected_delegation: 'F11', unexpected_delegation_connect: 'F11', wrong_recipient: 'F19',
  amount_exceeded: '~montant_superieur', first_seen_recipient: 'F24', unlimited_approval_swap: 'F01', no_incoming: '~rien_en_retour', permit_new_contract: 'F01',
  unexpected_outgoing: '~inattendu_envoi',
  // droits de depense
  approval_for_all: 'F03', nft_all: 'F03', nft_one: null, unlimited_allowance: 'F01', approval_to_eoa: 'F01', external_spender: 'F01', far_expiry: 'F01', no_expiry: 'F01',
  dai_permit_no_amount: 'F01', recurring_spend_permission: 'F30', allowance_decrease: null, revocation: null, permit2_lockdown: null,
  // controle, delegation, appels delegues
  control_change: 'F07', control_subject: 'F07', safe_module_exec: 'F08', safe_address_mismatch: 'F08', safe_bad_operation: 'F08', safe_refund: 'F08',
  delegatecall: 'F09', delegatecall_unknown_target: 'F09', multisend_inner_delegatecall: 'F09', delegatecall_official_multisend: null,
  delegation_7702: 'F11', delegation_7702_all_chains: 'F11', delegation_7702_revoke: null, authorization_tuple: 'F11', authorization_tuple_x: 'F11',
  type4_empty_authorization_list: '~compte_creation', aa_account_creation: null,
  // adresses et sites
  address_poisoning: 'F14', poisoning: 'F14', ens_name_lookalike: 'F20', origin_non_ascii: 'F20', site_origin_mismatch: 'F20',
  verifier_not_expected_for_origin: '~signature_site', domain_verifier_unexpected: '~signature_site',
  // jetons
  token_symbol_impersonation: 'F15', token_unsellable: 'F16', token_sell_tax_extreme: 'F16', token_tax_high: 'F16',
  // echanges et ordres
  swap_recipient: 'F17', swap_recipient_not_self: 'F17', router_payout_to_other: 'F17', order_output_recipient_not_self: 'F17', cow_receiver_not_signer: 'F17',
  service_beneficiary_not_self: 'F17', signed_transfer_to_other: 'F17', permit2_transfer_destination_chosen_by_spender: 'F17', seaport_proceeds_to_other: 'F17',
  seaport_assets_to_third_party: 'F17', slippage_high: 'F18', slippage_unbounded: 'F18', order_min_out_absurd: 'F18',
  seaport_zero_price: 'F04', seaport_zero_consideration: 'F04', order_proceeds_negligible: '~ordre_vide', cow_zero_buy_amount: '~ordre_vide',
  signer_not_offerer: '~ordre', seaport_criteria_offer: null,
  // appels caches, signatures
  batch_foreign_unlimited_approval: 'F12', nested_approval: 'F12', embedded_calls: 'F12', allow_failure_sensitive: null,
  eth_sign: 'F05', blind_signature: 'F05', free_text_message: null, service_call_decoded: null, events_attached: null, ur_pay_portion: null,
  // connexion (SIWE)
  siwe_domain_mismatch: 'F06', siwe_uri_mismatch: 'F06', siwe_address_mismatch: '~connexion', siwe_chain_mismatch: 'F29', siwe_statement_suspicious: '~connexion',
  siwe_bad_version: '~connexion', siwe_weak_nonce: '~connexion', siwe_expired: null, siwe_origin_unknown: null, siwe_resources: null,
  domain_chain_mismatch: 'F29', domain_without_chainid: '~signature_rejouable',
  // reseaux
  chain_add_insecure_rpc: 'F32', chain_add_known_id_custom_rpc: 'F32', chain_add_native_symbol_mismatch: 'F32', chain_add_native_symbol_spoof: 'F32', chain_add_no_rpc: 'F32',
  chain_add_unknown: 'F32', chain_request_malformed: 'F33', chain_switch_unknown: 'F33', chain_switch_known: null, chain_add_known_official_rpc: null,
  // verification impossible (opacite)
  unknown_selector: 'F25', opaque: 'F25', decode_error: 'F25', short_calldata: 'F25', contract_creation: 'F25', no_handler: 'F25', depth_limit: 'F25', too_many_children: 'F25',
  ur_command_opaque: 'F25', ur_command_unknown: 'F25', ur_length_mismatch: 'F25', multisend_truncated: 'F25', multisend_bad_op: 'F25', typed_decode_error: 'F25',
  eip712_hash_error: 'F25', unknown_typed_data: 'F25', unknown_typed_data_addresses: 'F25', permit2_witness_opaque: 'F25',
};
// ordre = priorite (le plus precis / le plus grave d'abord). F07 = groupe "controle" (F07/F08/F10 selon le type), F01 = groupe "droits" (F01/F02 selon l'objet)
const PRIORITY = ['F21', 'F11', 'F07', 'F08', 'F09', 'F14', 'F13', 'F20', 'F03', 'F04', 'F15', 'F16', 'F17', 'F18', 'F06', 'F12', 'F05', 'F30', 'F01', 'F19', 'F24', 'F29', 'F32', 'F33', 'F25'];
function ficheOfCode(code, eff, funds) {
  if (code === 'site_origin_mismatch' && eff.siwe) return 'F06';
  if (code === 'order_proceeds_negligible' && eff.seaport) return 'F04';
  if ((code === 'domain_chain_mismatch' || code === 'siwe_chain_mismatch') && !funds) return '~reseau_signature';
  return REASON_FICHE[code];
}
// -> { fid, secours } ; fid = fiche precise ou null ; secours = cle de SECOURS ou null
export function pickFiche(S, eff, method, o = {}) {
  const cands = new Set(), sec = [];
  for (const code of S) {
    const t = ficheOfCode(code, eff, o.funds);
    if (typeof t !== 'string') continue;
    if (t[0] === '~') sec.push(t.slice(1)); else cands.add(t);
  }
  if ((eff.approvals || []).length) cands.add('F01');
  if (method === 'eth_sign' || (eff.signature && eff.signature.kind === 'blind')) cands.add('F05');
  const first = PRIORITY.find((f) => cands.has(f));
  if (!first) return { fid: null, secours: sec[0] || null };
  let fid = first;
  if (first === 'F07') {
    const cc = (eff.controlChange || [])[0];
    if (cc && (/^safe\./.test(cc.type) || cc.type === 'erc7579.installModule')) fid = 'F08';
    else if (cc && (cc.type === 'upgrade' || cc.type === 'ens.setResolver')) fid = 'F10';
  } else if (first === 'F01') fid = eff.kind === 'signature' ? 'F02' : 'F01';
  else if (first === 'F21') fid = o.intentText && PROCHE.test(String(o.intentText).normalize('NFC')) ? 'F28' : 'F21';
  return { fid, secours: null };
}

// ---- textes de secours : raison connue mais sans fiche. 4 lignes, 12 mots au plus par ligne. {somme} = "2 480 USDC" ou "tes USDC".
export const SECOURS = {
  generique: FALLBACK,
  inattendu_envoi: { croit: "Je me connecte ou je valide, sans envoyer d'argent.", reel: 'Cette demande fait partir {somme} de ton compte.',
    danger: 'Ce que tu as demandé et ce qui part ne correspondent pas.', action: 'Annule, sauf si tu veux vraiment envoyer cet argent.' },
  rien_en_retour: { croit: "J'échange mes jetons contre ce que le site annonce.", reel: "Tu donnes {somme} et rien d'autre n'arrive sur ton compte.",
    danger: "L'échange est vide: tu perds ce que tu envoies.", action: "Annule et relance l'échange depuis le site officiel." },
  montant_superieur: { croit: "Je paie le montant que j'ai prévu.", reel: 'Cette demande envoie plus que le montant annoncé.',
    danger: "L'écart peut venir d'une erreur ou d'une ruse du site.", action: 'Annule et vérifie le montant exact avant de recommencer.' },
  gros_solde: { croit: 'Je fais une opération comme les autres.', reel: 'Cette opération sort une grande part de ton solde.',
    danger: 'Un seul geste peut vider presque tout ton compte.', action: 'Annule, sauf si tu veux vraiment déplacer tout cela.' },
  connexion: { croit: 'Je me connecte avec mon portefeuille.', reel: 'Ce message de connexion contient des éléments qui ne collent pas.',
    danger: 'Une connexion piégée peut servir à usurper ton accès.', action: 'Ne signe pas, et ouvre le site depuis tes favoris.' },
  signature_site: { croit: 'Je signe un message pour utiliser ce site.', reel: 'Cette signature vise un service qui ne correspond pas au site.',
    danger: "Le site et le service demandé n'ont pas l'air liés.", action: 'Annule, sauf si tu connais ce service et ce site.' },
  signature_rejouable: { croit: 'Je signe un message pour utiliser ce site.', reel: "Cette signature peut aussi servir sur d'autres réseaux.",
    danger: 'Quelqu’un pourrait la réutiliser ailleurs, sans te demander.', action: 'Annule, sauf si tu connais bien ce site et ce service.' },
  ordre: { croit: "Je signe un ordre d'achat ou de vente.", reel: 'Cet ordre contient des conditions inhabituelles qui peuvent te coûter cher.',
    danger: 'Un ordre signé reste valable même si tu fermes la page.', action: "Annule, sauf si tu comprends chaque condition de l'ordre." },
  ordre_vide: { croit: "J'échange mes jetons contre une valeur équivalente.", reel: 'Tu donnes {somme} et tu ne reçois presque rien.',
    danger: "L'ordre est écrit pour ne rien te rendre.", action: 'Annule: ne signe pas un échange où tu ne reçois rien.' },
  compte_creation: { croit: 'Je valide une simple opération sur mon compte.', reel: 'Cette opération crée ou change un compte sans que tu le saches.',
    danger: 'Un compte créé ainsi peut échapper à ton contrôle.', action: "Annule et vérifie auprès d'une personne de confiance." },
  reseau_signature: { croit: 'Je signe un message sur mon réseau habituel.', reel: 'Cette signature vise un autre réseau que celui que tu utilises.',
    danger: 'Un message signé sur un autre réseau peut quand même te coûter.', action: 'Annule, sauf si tu connais ce réseau.' },
};
export const SECOURS_TITRE = { generique: 'Cette demande a des effets inattendus', inattendu_envoi: 'Cette demande fait partir de l’argent', rien_en_retour: 'Tu donnes sans rien recevoir',
  montant_superieur: 'Le montant envoyé est plus grand que prévu', gros_solde: 'Une grande part de ton solde sort', connexion: 'Ce message de connexion est suspect', signature_site: 'Cette signature ne correspond pas au site',
  signature_rejouable: 'Cette signature peut servir sur d’autres réseaux', ordre: 'Cet ordre contient des conditions inhabituelles', ordre_vide: 'Tu ne recevrais presque rien en échange',
  compte_creation: 'Cette opération crée ou change un compte', reseau_signature: 'Cette signature vise un autre réseau' };
export const TITRE_NON_VERIFIE = 'Je n’ai pas pu vérifier cette opération';
const ACTION_SANS_MONTANT = "Refuse, ou autorise seulement ce qu'il faut pour cet échange."; // F01 quand le droit est sans limite : pas de montant précis à citer
const REEL_AUCUN_SIGNAL = 'Nous n’avons trouvé aucun signal dangereux dans cette demande.';

function varsOf(eff, host, extras) {
  const out0 = (eff.outgoing || [])[0];
  const ap = (eff.approvals || [])[0];
  const cp = (eff.counterparties || []).find((c) => c.lookalikeOf) || null;
  const cc = (eff.controlChange || [])[0];
  const nat = nativeSymbol(extras.chainId ?? eff.chainId);
  const symOf = (s) => (s === 'NATIVE' || s === 'native' ? nat : s);
  const sym = symOf((out0 && out0.symbol) || (ap && ap.symbol)) || undefined;
  const amt = out0 ? out0.amount : (ap && ap.amount && ap.amount !== 'unlimited' ? ap.amount : undefined);
  const v = {
    site: (eff.siwe && eff.siwe.domain) || host || 'ce site', site_reel: host || 'ce site',
    jeton: sym || 'jetons', montant: amt || '', jours: 'plusieurs', nombre: 'plusieurs',
    prix_vente: eff.seaportPriceWei !== undefined && nat !== NATIVE_UNKNOWN ? (BigInt(eff.seaportPriceWei) < 10n ** 14n ? 'presque rien' : `moins de 0,001 ${nat}`) : 'presque rien',
    valeur_nft: 'bien plus', montant_recu: 'rien',
    contact: (extras.contact && extras.contact.label) || 'ton contact', reseau_demande: 'le réseau demandé', reseau_reel: 'un autre réseau',
    adresse: (cp && cp.address) || (cc && cc.subject) || (out0 && out0.to) || '',
  };
  v.somme = v.montant ? `${v.montant} ${v.jeton}` : `tes ${v.jeton}`;
  if (ap && ap.expiry) { // une echeance "infinie" (uint max) donnait "1.3e+72 jours"
    const days = Math.round((Number(ap.expiry) - Math.floor(Date.now() / 1000)) / 86400);
    v.jours = Number.isFinite(days) && days <= 3650 ? String(Math.max(1, days)) : 'un nombre illimité de';
  }
  return v;
}
export function buildTexts(fid, eff, host, extras = {}) {
  const f = FICHES[fid];
  const v = varsOf(eff, host, extras);
  const t = { croit: fill(f.croit, v), reel: fill(f.reel, v), danger: fill(f.danger, v), action: fill(f.action, v) };
  if (fid === 'F01' && !v.montant) t.action = ACTION_SANS_MONTANT; // "autorise seulement {jetons}" n'avait pas de sens sans montant précis
  return t;
}
export function buildSecours(key, eff, host, extras = {}) {
  const s = SECOURS[key] || SECOURS.generique, v = varsOf(eff, host, extras);
  return Object.fromEntries(['croit', 'reel', 'danger', 'action'].map((k) => [k, fill(s[k], v)]));
}

// Choix final. I = { eff, S, niveau, method, host, chainId, contact, intentText, funds, opaque }
// -> { fid, texts, source ('fiche' | 'fiche+partiel' | 'secours'), secours }
export function present(I) {
  const { eff, S, niveau, method, host, chainId, contact, intentText, funds, opaque } = I;
  const ex = { chainId, contact };
  let { fid, secours } = pickFiche(S, eff, method, { intentText, funds });
  let texts, source = 'fiche';
  if (!fid) {
    if (niveau === 'info') {
      if (!funds) { fid = 'F26'; texts = buildTexts(fid, eff, host, ex); texts.reel = REEL_AUCUN_SIGNAL; source = 'fiche+partiel'; }
      else fid = contact ? 'F26' : 'F31'; // F26 dit "à ton contact" : réservé à un destinataire du carnet
    } else if (opaque) fid = 'F25';
    else if (secours) { texts = buildSecours(secours, eff, host, ex); source = 'secours'; }
    else if (niveau === 'warn') fid = 'F25';
    else { texts = buildSecours('generique', eff, host, ex); source = 'secours'; secours = 'generique'; }
  }
  if (fid && !texts) texts = buildTexts(fid, eff, host, ex);
  return { fid: fid || null, texts, source, secours: fid ? null : secours };
}
// Quand une pression est reperee sur la page : le scenario d'arnaque (faux remboursement, faux support) remplace une fiche generique.
const GENERIQUES = new Set(['F01', 'F02', 'F05', 'F25', 'F26', 'F31', null]);
export function scenarioFiche({ fid, pressure, pageText, funds, grants, niveau }) {
  if (niveau === 'info' || !GENERIQUES.has(fid)) return null;
  const pt = typeof pageText === 'string' ? pageText.normalize('NFC') : '';
  if (funds) return pressure ? pressure.fiche || (SCENARIO_PLACEMENT.test(pt) ? 'F24' : null) : null; // un envoi : le scénario n'est retenu que si une pression est repérée
  if (grants) return SCENARIO_CADEAU.test(pt) ? 'F27' : SCENARIO_RECRUTEUR.test(pt) ? 'F23' : null;
  return null;
}
// PRESENTATION>>
// Hors bloc (cote extension seulement) : noeud Hardhat local des repetitions, replique de la C-Chain d'Avalanche. Le serveur dit "unités du réseau" pour ces deux chaines.
NATIVE_SYMBOL[31337] = 'AVAX'; NATIVE_SYMBOL[1337] = 'AVAX';

// Verdict d'attente : jamais ok, jamais rouge non plus. Sert aussi de repli si le moteur plante.
export function indeterminate(why, ms = 0) {
  const t = Object.fromEntries(['croit', 'reel', 'danger', 'action'].map((k) => [k, fill(FICHES.F25[k], { jeton: 'jetons', montant: '' })]));
  return { level: 'unknown', niveau: 'warn', indeterminate: true, why, engine: ENGINE_NAME, fiche: 'F25', title: TITRE_NON_VERIFIE, opacity_only: true, texts: t, reasons: [t.danger, t.action], raisons: [{ code: 'unverifiable', severity: 'warn', detail: why }],
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
  // regle de presentation (monotone : ne fait que monter), identique au serveur : ordre Seaport qui donne un NFT contre (presque) rien en monnaie native
  let seaportCrit = false;
  if (eff.seaport) {
    const give = eff.seaport.give || [], get = eff.seaport.get || [];
    let total = 0n; try { total = get.reduce((s, g) => s + BigInt(g.min || 0), 0n); } catch { /* ignore */ }
    if (give.some((g) => g.type >= 2) && get.every((g) => g.type === 0) && total < 10n ** 15n) {
      seaportCrit = true; flags.push({ code: 'seaport_zero_price', severity: 'critical', detail: 'ordre de vente NFT a un prix quasi nul (' + total + ' wei)' });
      eff.seaportPriceWei = total.toString();
    }
  }
  const codes = [...new Set([...flags.map((f) => f.code), ...pol.reasons.map((r) => r.code), ...pol.notes])];
  const S = new Set(codes);
  const niveau = seaportCrit ? 'critical' : pol.level === 'critical' ? 'critical' : pol.level === 'warn' ? 'warn' : 'info'; // 'ok' n'existe pas : le plus bas est 'info'
  const grants = !!((eff.approvals || []).length || eff.delegation || (eff.controlChange || []).length || (eff.signature && ['permit', 'permit2', 'blind', 'eth_sign'].includes(eff.signature.kind)));
  const funds = (eff.outgoing || []).length > 0;
  const opaque = !!(eff.opaque || (eff.opaqueReasons || []).length);
  const contact = (() => { const o = (eff.outgoing || [])[0]; return (o && local.contacts.find((c) => c.address === lc(o.to))) || null; })(); // destinataire présent dans le carnet
  const lookalike = (eff.counterparties || []).find((c) => c.lookalikeOf);
  const pt = typeof body.pageText === 'string' ? body.pageText.slice(0, 4000) : '';
  const press = (funds || grants) && pt ? findPressure(pt) : null;
  const pres = present({ eff, S, niveau, method, host, chainId: chainId ?? eff.chainId, contact, intentText: body.intent_text, funds, opaque });
  let { fid, texts, source } = pres;
  // scénario d'arnaque repéré sur la page (faux remboursement, faux support, cadeau, recruteur) : remplace une fiche générique
  const scen = (funds || grants) && pt ? scenarioFiche({ fid, pressure: press, pageText: pt, funds, grants, niveau }) : null;
  if (scen) { fid = scen; texts = buildTexts(scen, eff, host, { chainId: chainId ?? eff.chainId, contact }); source = 'fiche'; }

  let level = niveau === 'critical' ? 'danger' : 'attention'; // niveau d'affichage de l'interface : jamais de vert
  let why;
  if (niveau === 'warn' && fid === 'F25') { level = 'unknown'; why = 'effets non lisibles : ' + ((eff.opaqueReasons || [])[0] || 'appel inconnu'); }
  const out = {
    level, niveau, engine: ENGINE_NAME, fiche: fid, texts, texts_source: source,
    reasons: [texts.danger, texts.action],
    raisons: [...flags.map((f) => ({ code: f.code, severity: f.severity, detail: f.detail })), ...pol.reasons.map((r) => ({ code: r.code, severity: r.sev || undefined, said: r.said, does: r.does }))],
    codes, effects: { grants_right: grants, funds_out: funds }, risk_signals: [], latency_engine_ms: 0,
  };
  // titre = nom de la menace (UI_CONTRAT.md : "title") ; opacity_only : le seul motif est l'opacité (propagé du moteur s'il existe, sinon calculé). Memes lignes que server/server.mjs.
  const reasonCodes = [...flags.map((f) => f.code), ...pol.reasons.map((r) => r.code)];
  out.opacity_only = typeof eff.opacityOnly === 'boolean' ? eff.opacityOnly : (niveau !== 'info' && reasonCodes.length > 0 && reasonCodes.every((c) => E.OPACITY_CODES.has(c)));
  out.title = out.opacity_only ? TITRE_NON_VERIFIE : fid ? FICHES[fid].menace : (SECOURS_TITRE[pres.secours] || SECOURS_TITRE.generique);
  if (scen) out.title = FICHES[scen].menace;
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
  if (press && niveau !== 'info') { out.level = 'manipulation'; out.quote = press.quote; out.reasons.unshift('Un vrai support ne te demandera jamais ça.'); out.niveau = 'critical'; out.niveau_note = 'pression repérée sur la page'; }
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

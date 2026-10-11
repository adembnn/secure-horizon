// Hold up - serveur local /check. Node >= 22 (type stripping .ts), zero dependance, 127.0.0.1 UNIQUEMENT.
// Appelle le VRAI moteur d'effets (engine/src), le comparateur d'Adem (engine/vendor/compare.ts, non modifie) et la politique (run/policy.mjs),
// les memes fonctions que run/run_loop.mjs, mais sans lire aucun jeu de cas et sans reseau (contexte hors ligne).
// Usage : node server/server.mjs            (journal actif)       node server/server.mjs --no-journal
//         node server/server.mjs --verify-journal                 (verifie la chaine de hachage et quitte)
// Variables : SENTINELLE_PORT (defaut 8787), SENTINELLE_JOURNAL=0 (desactive), SENTINELLE_JOURNAL_FILE, SENTINELLE_CONTEXT (fichier de contexte),
//             SENTINELLE_EXT_ID (si defini : seule cette extension est acceptee).
import http from 'node:http';
import { readFileSync, appendFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL, domainToUnicode } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const imp = (p) => import(pathToFileURL(p).href);
const E = await imp(join(ROOT, 'engine', 'src', 'engine.mjs'));
const { compare } = await imp(join(ROOT, 'engine', 'vendor', 'compare.ts'));
const { applyExtraRules, analyzeChainRequest } = await imp(join(ROOT, 'engine', 'src', 'rules_extra.mjs'));
const { applyPolicy } = await imp(join(ROOT, 'run', 'policy.mjs'));
const TEXTS = JSON.parse(readFileSync(join(ROOT, '..', 'U_textes_utilisateur.json'), 'utf8'));
const FICHES = Object.fromEntries(TEXTS.fiches.map((f) => [f.id, f]));

export const HOST = '127.0.0.1';
export const MAX_BODY = 256 * 1024;
const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const HEX20 = /^0x[0-9a-fA-F]{40}$/;

// ------------------------------------------------------------------ contexte hors ligne
// Adresses canoniques publiques (liste "R[V]" du catalogue : Permit2, Multicall3, CoW, Seaport 1.6, Safe MultiSendCallOnly).
const CANONICAL = ['0x000000000022D473030F116dDEE9F6B43aC78BA3', '0xcA11bde05977b3631167028862bE2a173976CA11', '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
  '0x0000000000000068F116a894984e2DB1123eB395', '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'].map(lc);
const TOKENS = [['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'USDC', 6], ['0xdAC17F958D2ee523a2206206994597C13D831ec7', 'USDT', 6],
  ['0x6B175474E89094C44Da98b954EedeAC495271d0F', 'DAI', 18], ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'WETH', 18]];

// Contexte local OPTIONNEL de l'utilisateur (carnet d'adresses, historique, adresses a lui). Absent = tout est "inconnu".
export function loadLocalContext(file) {
  const f = file || process.env.SENTINELLE_CONTEXT || join(HERE, 'context.local.json');
  if (!existsSync(f)) return { contacts: [], history: [], protected: [], knownSpenders: [] };
  try {
    const j = JSON.parse(readFileSync(f, 'utf8'));
    const okAddr = (a) => typeof a === 'string' && HEX20.test(a);
    return {
      contacts: (j.contacts || []).filter((c) => okAddr(c.address)).map((c) => ({ address: lc(c.address), label: String(c.label || '') })),
      history: (j.history || []).filter((h) => okAddr(h.address)),
      protected: (j.protected || []).filter(okAddr).map(lc),
      knownSpenders: (j.knownSpenders || []).filter(okAddr).map(lc),
    };
  } catch (e) { console.error('context.local.json illisible, ignore : ' + e.message); return { contacts: [], history: [], protected: [], knownSpenders: [] }; }
}

function parseChain(v) {
  if (v === null || v === undefined || v === '') return undefined;
  try { const n = typeof v === 'number' ? v : (/^0x/i.test(String(v)) ? Number(BigInt(v)) : Number(v)); return Number.isFinite(n) && n >= 0 ? n : undefined; } catch { return undefined; }
}
function hostOf(origin) { try { return new URL(origin).hostname; } catch { return ''; } }

function buildCtx(body, local, from, chainId) {
  const now = Math.floor(Date.now() / 1000);
  const tokenMeta = {};
  for (const [a, s, d] of TOKENS) tokenMeta[lc(a)] = { symbol: s, decimals: d, stable: ['USDC', 'USDT', 'DAI'].includes(s) };
  const known = [...CANONICAL, ...local.knownSpenders];
  const codeSet = new Set([...known, ...Object.keys(tokenMeta)]);
  const unicodeHost = (() => { try { return domainToUnicode(hostOf(body.origin)) || hostOf(body.origin); } catch { return hostOf(body.origin); } })();
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

const big = (v) => { try { return v === undefined || v === null || v === '' ? 0n : BigInt(v); } catch { return 0n; } };
class Unverifiable extends Error {}

function decode(method, params, ctx, body) {
  const request = { method, params };
  const a0 = params[0];
  switch (method) {
    case 'eth_sendTransaction': case 'eth_signTransaction':
      if (!a0 || typeof a0 !== 'object') throw new Unverifiable('transaction illisible');
      return E.analyzeTransaction(a0, ctx);
    case 'eth_sendRawTransaction':
      if (typeof a0 !== 'string') throw new Unverifiable('transaction brute illisible');
      return E.analyzeRawTransaction(a0, ctx);
    case 'wallet_sendCalls': {
      if (!a0 || !Array.isArray(a0.calls) || !a0.calls.length || a0.calls.length > 64) throw new Unverifiable('lot de calls illisible');
      const list = a0.calls.map((call) => E.analyzeTransaction({ from: a0.from || ctx.from, chainId: a0.chainId, type: '0x2', ...call }, ctx));
      return mergeEffects(list);
    }
    case 'eth_signTypedData_v4': case 'eth_signTypedData_v3': case 'eth_signTypedData': {
      // v3/v4 : [adresse, json]. Certains sites inversent l'ordre.
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
// copie de run_loop.mergeEffects (fusion des effets d'un lot)
function mergeEffects(list) {
  if (list.length === 1) return list[0];
  const lvlOf = (flags) => (flags.some((f) => f.severity === 'critical') ? 'critical' : flags.some((f) => f.severity === 'warn') ? 'warn' : 'ok');
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

// <<PRESENTATION (bloc IDENTIQUE dans server/server.mjs et extension_standalone/src/sentinelle_core.js ; server/test/presentation.test.mjs verifie qu'il ne derive pas)
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
  chain_add_unknown: 'F32', chain_request_malformed: 'F33', chain_switch_unknown: 'F33', chain_switch_known: null,
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

// ------------------------------------------------------------------ evaluation
export function evaluate(body, local = loadLocalContext()) {
  const t0 = performance.now();
  const method = typeof body.method === 'string' ? body.method.slice(0, 80) : '';
  const params = Array.isArray(body.params) ? body.params : [];
  const host = hostOf(body.origin);
  const chainId = parseChain(body.chainId) ?? parseChain((params[0] && typeof params[0] === 'object') ? params[0].chainId : undefined);
  const from = HEX20.test(String(body.from || '')) ? lc(body.from) : (params[0] && typeof params[0] === 'object' && HEX20.test(String(params[0].from || '')) ? lc(params[0].from) : undefined);
  let eff = null, adem = null, pol = null, failure = null, intent = null;
  const ctx = buildCtx(body, local, from, chainId);
  try {
    if (!method) throw new Unverifiable('methode absente');
    eff = decode(method, params, ctx, body);
    applyExtraRules(eff, { method, params }, ctx);
    intent = toIntent(body);
    adem = intent ? compare(intent, eff) : null;
    pol = applyPolicy({ eff, adem, ctx, intent, request: { method, params } });
  } catch (e) {
    failure = e instanceof Unverifiable ? e.message : 'analyse impossible (' + String(e && e.message || e).slice(0, 120) + ')';
  }
  const ms = () => Math.round((performance.now() - t0) * 100) / 100;

  // --- echec d'analyse : jamais ok, jamais rouge non plus : "non verifie" (fiche F25)
  if (failure) {
    const t = Object.fromEntries(['croit', 'reel', 'danger', 'action'].map((k) => [k, fill(FICHES.F25[k], { jeton: 'jetons', montant: '' })]));
    return { level: 'unknown', niveau: 'warn', indeterminate: true, why: failure, engine: 'sentinelle-local', fiche: 'F25', texts: t, reasons: [t.danger, t.action], raisons: [{ code: 'unverifiable', severity: 'warn', detail: failure }],
      effects: { grants_right: false, funds_out: false }, risk_signals: [], latency_engine_ms: ms() };
  }

  const flags = eff.risk_flags.filter((f) => f.severity !== 'info');
  // regle du serveur (monotone : ne fait que monter) : ordre Seaport qui donne un NFT contre (presque) rien en monnaie native
  let seaportCrit = false;
  if (eff.seaport) {
    const give = eff.seaport.give || [], get = eff.seaport.get || [];
    let total = 0n; try { total = get.reduce((t, g) => t + BigInt(g.min || 0), 0n); } catch { /* ignore */ }
    if (give.some((g) => g.type >= 2) && get.every((g) => g.type === 0) && total < 10n ** 15n) {
      seaportCrit = true; flags.push({ code: 'seaport_zero_price', severity: 'critical', detail: 'ordre de vente NFT a un prix quasi nul (' + total + ' wei)' });
      eff.seaportPriceWei = total.toString();
    }
  }
  const codes = [...new Set([...flags.map((f) => f.code), ...pol.reasons.map((r) => r.code), ...pol.notes])];
  const S = new Set(codes);
  let niveau = seaportCrit ? 'critical' : pol.level === 'critical' ? 'critical' : pol.level === 'warn' ? 'warn' : 'info'; // 'ok' n'existe pas : le plus bas est 'info'
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

  // niveau d'affichage de l'extension : critical->danger, warn->attention (ou unknown si on n'a rien pu verifier), info->attention
  let level = niveau === 'critical' ? 'danger' : 'attention';
  let why;
  if (niveau === 'warn' && fid === 'F25') { level = 'unknown'; why = 'effets non lisibles : ' + ((eff.opaqueReasons || [])[0] || 'appel inconnu'); }
  const reasons = [texts.danger, texts.action];
  const out = {
    level, niveau, engine: 'sentinelle-local', fiche: fid, texts, texts_source: source,
    reasons, raisons: [...flags.map((f) => ({ code: f.code, severity: f.severity, detail: f.detail })), ...pol.reasons.map((r) => ({ code: r.code, severity: r.sev || undefined, said: r.said, does: r.does }))],
    codes, effects: { grants_right: grants, funds_out: funds },
    risk_signals: [], latency_engine_ms: 0,
  };
  if (why) { out.indeterminate = true; out.why = why; }
  if (niveau !== 'info') { out.said = { text: '', amount: texts.croit, detail: '' }; out.real = { text: '', amount: texts.reel, detail: '' }; out.lead = niveau === 'critical' ? 'Ce que tu penses faire et ce qui se passe vraiment ne correspondent pas.' : undefined; }
  else { out.said = { text: '', amount: texts.croit, detail: '' }; out.real = { text: '', amount: texts.reel, detail: '' }; }
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

// ------------------------------------------------------------------ journal chaine par hachage (desactivable)
const sha = (s) => createHash('sha256').update(s).digest('hex');
export function makeJournal(file, enabled = true) {
  if (!enabled) return { enabled: false, append() {}, file: null };
  mkdirSync(dirname(file), { recursive: true });
  let seq = 0, prev = '0'.repeat(64);
  if (existsSync(file) && statSync(file).size) {
    const lines = readFileSync(file, 'utf8').trim().split('\n');
    try { const last = JSON.parse(lines[lines.length - 1]); seq = last.seq; prev = last.hash; } catch { /* chaine cassee : on repart d'une nouvelle branche */ prev = sha('reset:' + lines.length); }
  }
  return {
    enabled: true, file,
    append(entry) {
      seq += 1;
      const rec = { seq, ts: new Date().toISOString(), prev, entry };
      rec.hash = sha(rec.prev + '|' + rec.seq + '|' + rec.ts + '|' + JSON.stringify(rec.entry));
      appendFileSync(file, JSON.stringify(rec) + '\n');
      prev = rec.hash;
    },
  };
}
export function verifyJournal(file) {
  if (!existsSync(file)) return { ok: true, n: 0 };
  let prev = '0'.repeat(64), n = 0;
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    if (!line) continue;
    const r = JSON.parse(line);
    if (r.prev !== prev || r.hash !== sha(r.prev + '|' + r.seq + '|' + r.ts + '|' + JSON.stringify(r.entry))) return { ok: false, n, brokenAt: r.seq };
    prev = r.hash; n++;
  }
  return { ok: true, n };
}

// ------------------------------------------------------------------ serveur HTTP
const EXT_ORIGIN = /^chrome-extension:\/\/[a-p]{32}$/;
export function createHoldUpServer({ port = 8787, journalFile, journalEnabled = true, local = loadLocalContext(), extId = process.env.SENTINELLE_EXT_ID } = {}) {
  const journal = makeJournal(journalFile || join(HERE, '..', 'journal', 'verdicts.jsonl'), journalEnabled);
  const stats = { n: 0 };
  const srv = http.createServer((req, res) => {
    const reply = (code, obj, extra = {}) => { const b = JSON.stringify(obj); res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...extra }); res.end(b); };
    // 1) uniquement la boucle locale, et uniquement le nom d'hote 127.0.0.1 (protege aussi contre le "DNS rebinding")
    const ra = req.socket.remoteAddress;
    if (ra !== '127.0.0.1' && ra !== '::ffff:127.0.0.1') return reply(403, { error: 'adresse refusee' });
    if (!/^127\.0\.0\.1(:\d+)?$/.test(req.headers.host || '')) return reply(403, { error: 'hote refuse' });
    // 2) CORS ferme : seule une extension Chrome (origine chrome-extension://) ; une page web (http/https/file/null) est refusee
    const origin = req.headers.origin;
    let cors = {};
    if (origin !== undefined) {
      if (!EXT_ORIGIN.test(origin) || (extId && origin !== 'chrome-extension://' + extId)) return reply(403, { error: 'origine refusee' });
      cors = { 'access-control-allow-origin': origin, vary: 'Origin', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST,GET,OPTIONS', 'access-control-allow-private-network': 'true' };
    }
    const url = (req.url || '').split('?')[0];
    if (req.method === 'OPTIONS') { res.writeHead(origin !== undefined ? 204 : 403, cors); return res.end(); }
    if (req.method === 'GET' && url === '/health') return reply(200, { status: 'up', service: 'sentinelle', version: 1, journal: journal.enabled }, cors);
    if (req.method === 'GET' && (url === '/test_page/' || url === '/test_page/index.html' || url === '/test_page')) {
      try { const html = readFileSync(join(ROOT, 'test_page', 'index.html')); res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); return res.end(html); }
      catch { return reply(404, { error: 'page d essai absente' }, cors); }
    }
    if (req.method !== 'POST' || (url !== '/check' && url !== '/log')) return reply(404, { error: 'introuvable' }, cors);
    // 3) corps borne
    const chunks = []; let size = 0, tooBig = false;
    req.on('data', (c) => {
      if (tooBig) return;
      size += c.length;
      if (size > MAX_BODY) { tooBig = true; chunks.length = 0; reply(413, { error: 'requete trop volumineuse', max: MAX_BODY }, { ...cors, connection: 'close' }); req.resume(); return; }
      chunks.push(c);
    });
    req.on('error', () => {});
    req.on('end', () => {
      if (tooBig) return;
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'); } catch { return reply(400, { error: 'JSON illisible' }, cors); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(400, { error: 'objet JSON attendu' }, cors);
      if (url === '/log') {
        // le journal de l'extension : on garde seulement des champs courts (jamais les parametres)
        const e = body; journal.append({ type: 'ext_log', kind: String(e.type || '').slice(0, 20), origin: String(e.origin || '').slice(0, 200), method: String(e.method || '').slice(0, 60), level: String(e.level || '').slice(0, 20), decision: String(e.decision || '').slice(0, 20) });
        return reply(200, { ok: true }, cors);
      }
      let v;
      try { v = evaluate(body, local); }
      catch (e) { v = { level: 'unknown', niveau: 'warn', indeterminate: true, why: 'erreur interne', reasons: [], effects: { grants_right: false, funds_out: false }, risk_signals: [], latency_engine_ms: 0 }; }
      v.latency_ms = v.latency_engine_ms;
      stats.n++;
      try {
        journal.append({ type: 'verdict', origin: String(body.origin || '').slice(0, 200), method: String(body.method || '').slice(0, 60), level: v.level, niveau: v.niveau, fiche: v.fiche || null, codes: v.codes || [], latency_ms: v.latency_ms,
          params_sha256: sha(JSON.stringify(body.params === undefined ? null : body.params)) });
      } catch { /* le journal ne doit jamais empecher le verdict */ }
      return reply(200, v, cors);
    });
  });
  srv.headersTimeout = 10000; srv.requestTimeout = 10000; srv.keepAliveTimeout = 5000;
  return new Promise((resolveP, reject) => {
    srv.once('error', reject);
    srv.listen(port, HOST, () => resolveP({ srv, port: srv.address().port, journal, stats, close: () => new Promise((r) => { srv.closeAllConnections?.(); srv.close(r); }) }));
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const jf = process.env.SENTINELLE_JOURNAL_FILE || join(ROOT, 'journal', 'verdicts.jsonl');
  if (process.argv.includes('--verify-journal')) { const r = verifyJournal(jf); console.log(r.ok ? `journal OK (${r.n} lignes)` : `journal CASSE a la ligne ${r.brokenAt}`); process.exit(r.ok ? 0 : 1); }
  const jOn = !(process.argv.includes('--no-journal') || process.env.SENTINELLE_JOURNAL === '0');
  const port = Number(process.env.SENTINELLE_PORT || 8787);
  try {
    // chauffe (premier appel du moteur plus lent)
    evaluate({ method: 'eth_sendTransaction', params: [{ from: '0x' + '1'.repeat(40), to: '0x' + '2'.repeat(40), value: '0x1', data: '0x' }], origin: 'https://warmup.local', chainId: '0x1' });
    const s = await createHoldUpServer({ port, journalFile: jf, journalEnabled: jOn });
    console.log(`Hold up : serveur pret sur http://127.0.0.1:${s.port}  (journal ${jOn ? jf : 'desactive'}). Ctrl+C pour arreter.`);
  } catch (e) {
    console.error(e.code === 'EADDRINUSE' ? `Le port ${port} est deja utilise (un autre serveur Hold up tourne peut-etre). Ferme-le puis relance.` : 'Echec du demarrage : ' + e.message);
    process.exit(1);
  }
}

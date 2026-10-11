// Règles additionnelles du moteur (indépendantes de l'intention). Ne lisent que : l'effet décodé, la requête brute (structure) et le contexte fourni.
import { isOn } from './fixes.mjs';
import { parseSig, decodeParams } from './abi.mjs';
import { lc } from './util.mjs';
import { decodeLibraryCall } from './protocols_extra.mjs';
import { matchLens } from './rules.mjs';
import { OPACITY_CODES } from './engine.mjs';

const lvl = (fl) => (fl.some((f) => f.severity === 'critical') ? 'critical' : fl.some((f) => f.severity === 'warn') ? 'warn' : 'ok');
const sevRank = { info: 0, warn: 1, critical: 2 };

export function addFlags(eff, flags, opacityCodes) {
  if (!flags.length) return eff;
  eff.risk_flags.push(...flags);
  eff.risk_flags.sort((a, b) => sevRank[b.severity] - sevRank[a.severity]);
  eff.level = lvl(eff.risk_flags);
  eff.levelEvidence = lvl(eff.risk_flags.filter((f) => !(opacityCodes || new Set()).has(f.code)));
  return eff;
}

// ---- F5 : fonctions « valeur contre service » courantes (mint, staking, dépôt de pont, enregistrement de nom) vers un protocole de la liste connue.
// Sélecteurs CALCULÉS (keccak) à partir de signatures ABI usuelles ; aucune adresse. Le service crédite un état (jeton de reçu / NFT / nom) que le calldata ne montre pas :
// l'appel est décodé (non opaque), n'accorde aucun droit, et le bénéficiaire éventuel est vérifié.
const SERVICE = ['mint(uint256 quantity)', 'mint(address to,uint256 quantity)', 'submit(address referral)', 'depositETHTo(address to,uint32 gas,bytes data)', 'depositETH(uint32 gas,bytes data)', 'bridgeETHTo(address to,uint32 gas,bytes data)', 'register(string name,address owner,uint256 duration)', 'stake()'].map((sig) => parseSig(sig));
const BENEFICIARY = { to: 'to', owner: 'owner' };
const OPACITY_ONLY = new Set(['unknown_selector', 'opaque']);
function serviceCall(eff, request, ctx) {
  if (!request || request.method !== 'eth_sendTransaction') return;
  const tx = request.params && request.params[0]; if (!tx || !tx.to) return;
  if (!(ctx.knownSpenders || []).includes(lc(tx.to))) return;           // seulement un protocole de la liste connue
  if (!eff.opaque || eff.approvals.length || (eff.controlChange || []).length || eff.delegation) return;
  if (eff.risk_flags.some((f) => f.severity !== 'info' && !OPACITY_ONLY.has(f.code))) return; // une autre preuve de risque : on ne touche pas
  const data = String(tx.data ?? tx.input ?? '0x').toLowerCase();
  const sig = SERVICE.find((e) => data.startsWith(e.selector));
  if (!sig) return;
  let args; try { args = decodeParams(sig.params, '0x' + data.slice(10)); } catch { return; }       // calldata mal formé : reste opaque
  const bKey = sig.params.map((p) => p.name).find((n) => BENEFICIARY[n]);
  const beneficiary = bKey && typeof args[bKey] === 'string' ? lc(args[bKey]) : undefined;
  eff.risk_flags = eff.risk_flags.filter((f) => !OPACITY_ONLY.has(f.code));
  eff.opaque = false; eff.opaqueReasons = [];
  eff.service = { name: sig.name, ...(beneficiary ? { beneficiary } : {}) };
  eff.risk_flags.push({ code: 'service_call_decoded', severity: 'info', detail: `${sig.canon} vers un protocole connu : aucun droit accordé` });
  if (beneficiary && beneficiary !== lc(ctx.from) && !(ctx.actors && ctx.actors.has(beneficiary)) && !(ctx.contacts || []).some((c) => lc(c.address) === beneficiary)) {
    eff.risk_flags.push({ code: 'service_beneficiary_not_self', severity: 'warn', detail: `le service profite à ${beneficiary}, ni vous ni un contact` });
  }
}

// ---- F7 : ordres signés hors chaîne (CoW, UniswapX et tout ordre de même forme). Lit la STRUCTURE du message typé : sorties (champ recipient) et montants vendu/reçu.
//  - une sortie d'ordre destinée à un tiers (ni soi, ni protocole connu) : le produit de la vente est détourné ;
//  - un montant minimal reçu quasi nul face au montant vendu (une plus petite unité, ou rapport < 1e-12 en unités humaines) : prix aberrant, tout est pris par le solveur / un MEV.
const decOf = (ctx, token) => { const m = ctx.tokenMeta && ctx.tokenMeta[lc(token)]; return m && Number.isInteger(m.decimals) ? m.decimals : 18; };
const isActor = (ctx, a) => lc(a) === lc(ctx.from) || (ctx.actors && ctx.actors.has(lc(a)));
const ZERO = '0x' + '0'.repeat(40);
function absurdRatio(ctx, sellTok, sellAmt, buyTok, buyAmt) {
  try {
    const S = BigInt(sellAmt), B = BigInt(buyAmt); if (S <= 0n) return false;
    if (B <= 1n && S > 1000n) return true; // une seule plus petite unité (ou rien) en échange d'un montant non négligeable : aucune protection de prix
    return B * 10n ** BigInt(decOf(ctx, sellTok)) * 10n ** 12n < S * 10n ** BigInt(decOf(ctx, buyTok));
  } catch { return false; }
}
function signedOrder(request, ctx, flags) {
  if (request.method !== 'eth_signTypedData_v4') return;
  let td; try { td = typeof request.params[1] === 'string' ? JSON.parse(request.params[1]) : request.params[1]; } catch { return; }
  const m = td && td.message; if (!m || typeof m !== 'object') return;
  const known = (a) => (ctx.knownSpenders || []).includes(lc(a));
  const outs = Array.isArray(m.outputs) ? m.outputs : m.witness && Array.isArray(m.witness.outputs) ? m.witness.outputs : null;
  if (outs) {
    for (const o of outs) if (o && typeof o.recipient === 'string' && lc(o.recipient) !== ZERO && !isActor(ctx, o.recipient) && !known(o.recipient)) { flags.push({ code: 'order_output_recipient_not_self', severity: 'critical', detail: `sortie d'un ordre signé versée à ${lc(o.recipient)} (ni vous ni un protocole connu)` }); break; }
    const w = m.witness || m;
    if (w.inputToken && outs[0] && outs[0].token && absurdRatio(ctx, w.inputToken, w.inputStartAmount ?? w.inputEndAmount, outs[0].token, outs[0].endAmount ?? outs[0].startAmount)) flags.push({ code: 'order_min_out_absurd', severity: 'critical', detail: 'montant minimal reçu aberrant face au montant vendu' });
  }
  if (m.sellToken && m.buyToken && m.sellAmount != null && m.buyAmount != null && absurdRatio(ctx, m.sellToken, m.sellAmount, m.buyToken, m.buyAmount)) flags.push({ code: 'order_min_out_absurd', severity: 'critical', detail: 'montant minimal reçu aberrant face au montant vendu' });
}

// ---- F8 : jetons touchés par la requête, décrits par le contexte fourni (token_info, token_registry). Un jeton est « touché » si son adresse apparaît dans la requête (calldata, message typé).
//  - sosie de symbole : même symbole qu'un jeton de la liste de référence mais autre adresse de contrat => critical (on paierait/achèterait un faux jeton) ;
//  - vente impossible (simulation de vente en échec) ou taxe de vente >= 50 % => critical (honeypot) ; taxe >= 10 % => warn.
function tokenChecks(request, ctx, flags) {
  const k = ctx._k || {}; const info = k.token_info || {}; const reg = k.token_registry || [];
  const keys = Object.keys(info); if (!keys.length) return;
  const hay = JSON.stringify(request.params || []).toLowerCase();
  for (const addr of keys) {
    const a = lc(addr).replace(/^0x/, ''); if (!hay.includes(a)) continue;
    const ti = info[addr];
    const ref = reg.find((r) => r.symbol && ti.symbol && String(r.symbol).toUpperCase() === String(ti.symbol).toUpperCase());
    if (ref && lc(ref.address) !== lc(addr)) flags.push({ code: 'token_symbol_impersonation', severity: 'critical', detail: `le jeton ${lc(addr)} porte le symbole ${ti.symbol} mais n'est pas le contrat de référence ${lc(ref.address)}` });
    const sim = String(ti.sell_simulation ?? '').toLowerCase();
    if (sim && !['ok', 'success', 'pass', 'passed'].includes(sim)) flags.push({ code: 'token_unsellable', severity: 'critical', detail: `simulation de vente de ${ti.symbol || lc(addr)} : ${sim}` });
    const st = Number(ti.sell_tax_pct), bt = Number(ti.buy_tax_pct);
    if (Number.isFinite(st) && st >= 50) flags.push({ code: 'token_sell_tax_extreme', severity: 'critical', detail: `taxe de vente ${st} % sur ${ti.symbol || lc(addr)}` });
    else if ((Number.isFinite(st) && st >= 10) || (Number.isFinite(bt) && bt >= 10)) flags.push({ code: 'token_tax_high', severity: 'warn', detail: `taxe élevée (achat ${bt} %, vente ${st} %) sur ${ti.symbol || lc(addr)}` });
  }
}

// ---- F9 : identité du site et du nom. Le contexte fournit ce que l'utilisateur croit (claimed_site, ens.intended_name) et ce qui est réellement présenté (origin, ens.typed_name).
//  - site : l'origine réelle diffère du site que l'utilisateur pense visiter => critical ; un nom d'hôte contenant des caractères non ASCII (homoglyphes) => critical ;
//  - nom ENS : le nom tapé/résolu diffère du nom voulu, ou contient un caractère non ASCII, invisible ou une espace => critical.
const norm = (h) => String(h ?? '').trim().toLowerCase().split('://').pop().split('/')[0];
const SUSPECT_CHARS = /[^!-~]/; // tout sauf ASCII imprimable sans espace (inclut espaces, invisibles, homoglyphes)
function identityChecks(ctx, flags) {
  const k = ctx._k || {};
  const origin = norm(k.origin);
  if (origin && SUSPECT_CHARS.test(origin)) flags.push({ code: 'origin_non_ascii', severity: 'critical', detail: `l'origine du site contient des caractères non ASCII (homoglyphes possibles)` });
  if (k.claimed_site && origin && norm(k.claimed_site) !== origin) flags.push({ code: 'site_origin_mismatch', severity: 'critical', detail: `le site visité (${origin}) n'est pas celui que l'utilisateur croit (${norm(k.claimed_site)})` });
  const e = k.ens;
  if (e && typeof e === 'object') {
    const typed = e.typed_name ?? e.name, want = e.intended_name;
    if (typeof typed === 'string' && (SUSPECT_CHARS.test(typed) || (typeof want === 'string' && typed !== want))) flags.push({ code: 'ens_name_lookalike', severity: 'critical', detail: 'le nom saisi diffère du nom voulu ou contient des caractères non ASCII / invisibles' });
  }
}

// ---- F10 : droit illimité accordé par un sous-appel d'un lot à un bénéficiaire inconnu, alors que le propriétaire décodé n'est pas l'utilisateur (le relais, p.ex. Multicall3, exécute en son nom).
// Rien n'est perdu si le relais appelle bien en son nom propre ; mais le portefeuille ne peut pas exclure un relais qui agit avec l'autorité de l'utilisateur (delegatecall, compte intelligent)
// et la présence de ce droit dans une demande qui ne le mentionne pas est anormale : warn (jamais critical).
function foreignApproval(eff, ctx, flags) {
  for (const t of eff.thirdParty || []) {
    if (t.kind === 'approval' && t.amount === 'unlimited' && !(ctx.knownSpenders || []).includes(lc(t.spender))) {
      flags.push({ code: 'batch_foreign_unlimited_approval', severity: 'warn', detail: `un sous-appel accorde un droit illimité à ${lc(t.spender)} (propriétaire décodé ${t.owner}, pas vous)` });
      return;
    }
  }
}

// ---- F11 : ordre de marché signé (Seaport, y compris BulkOrder en arbre) dont le produit pour le signataire est négligeable (< 1e-4 unité) face à ce qu'il donne.
// Raison générale : une vente à prix quasi nul n'est pas une vente mais un don ; le moteur de base ne traite que le cas exactement nul.
// Seuil en unités humaines (décimales du jeton lues dans le contexte, 18 par défaut), indépendant de toute adresse.
const NEGLIGIBLE_HUMAN = 1e-4;
const human = (ctx, token, rawAmt) => { try { const d = token && lc(token) !== ZERO ? decOf(ctx, token) : 18; return Number(BigInt(rawAmt)) / 10 ** d; } catch { return NaN; } };
function collectOrders(node, out, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 6) return;
  if (Array.isArray(node)) { for (const x of node) collectOrders(x, out, depth + 1); return; }
  if (Array.isArray(node.offer) && Array.isArray(node.consideration) && node.offerer) { out.push(node); return; }
  for (const v of Object.values(node)) collectOrders(v, out, depth + 1);
}
function marketOrderProceeds(request, ctx, flags) {
  if (request.method !== 'eth_signTypedData_v4') return;
  let td; try { td = typeof request.params[1] === 'string' ? JSON.parse(request.params[1]) : request.params[1]; } catch { return; }
  const orders = []; collectOrders(td && td.message, orders);
  for (const o of orders) {
    if (!o.offer.length) continue;
    const mine = o.consideration.filter((c) => lc(c.recipient) === lc(o.offerer));
    if (mine.some((c) => Number(c.itemType) >= 2)) continue;              // il reçoit un NFT en échange : échange, pas un don
    const fung = mine.filter((c) => Number(c.itemType) <= 1);
    if (fung.length === 0) continue;                                       // cas « rien du tout » : déjà couvert par le moteur de base
    const total = fung.map((c) => human(ctx, c.token, c.endAmount ?? c.startAmount)).filter((x) => Number.isFinite(x));
    if (total.length && total.every((x) => x < NEGLIGIBLE_HUMAN)) { flags.push({ code: 'order_proceeds_negligible', severity: 'critical', detail: `l'ordre signé donne ${o.offer.length} élément(s) pour un produit négligeable (< ${NEGLIGIBLE_HUMAN})` }); return; }
  }
}

// ---- F14 : bibliothèque d'ABI publiques (protocols_extra.mjs). Pour chaque appel dont la cible est de confiance (protocole de la liste connue ou jeton du registre de référence)
// et dont la fonction est décodable : l'opacité est levée et on VÉRIFIE que le produit (to / onBehalfOf / dstReceiver / mintRecipient...) revient à l'utilisateur, à un contact ou à un protocole connu.
// Produit redirigé vers un tiers : critical pour les opérations dont le produit est une sortie de valeur (échange, retrait, emprunt, pont, retrait de liquidité), warn pour les autres.
const callsOf = (request) => {
  const p = request.params && request.params[0];
  if (request.method === 'eth_sendTransaction' && p) return [p];
  if (request.method === 'wallet_sendCalls' && p && Array.isArray(p.calls)) return p.calls;
  return [];
};
const registryAddrs = (ctx) => ((ctx._k && ctx._k.token_registry) || []).map((t) => lc(t.address));
const isTrustedTarget = (ctx, to) => !!to && ((ctx.knownSpenders || []).includes(lc(to)) || registryAddrs(ctx).includes(lc(to)));
function recompute(eff) {
  eff.risk_flags.sort((a, b) => sevRank[b.severity] - sevRank[a.severity]);
  eff.level = lvl(eff.risk_flags); eff.levelEvidence = lvl(eff.risk_flags.filter((f) => !OPACITY_CODES.has(f.code)));
}
function libraryCalls(eff, request, ctx, flags) {
  if (!eff.opaque) return;
  const calls = callsOf(request); const covered = new Set(); const decoded = [];
  for (const c of calls) {
    if (!c.to || !isTrustedTarget(ctx, c.to)) continue;
    const r = decodeLibraryCall(c, ctx); if (!r) continue;
    covered.add(String(c.data ?? c.input).slice(0, 10).toLowerCase()); decoded.push(r);
  }
  if (!decoded.length) return;
  eff.risk_flags = eff.risk_flags.filter((f) => !(f.code === 'unknown_selector' && covered.has((/0x[0-9a-f]{8}/.exec(f.detail) || [''])[0])));
  if (!eff.risk_flags.some((f) => f.code !== 'opaque' && OPACITY_CODES.has(f.code))) {
    eff.risk_flags = eff.risk_flags.filter((f) => f.code !== 'opaque'); eff.opaque = false; eff.opaqueReasons = [];
  }
  eff.service = eff.service || { name: decoded[0].name, trusted: true };
  const self = lc(ctx.from); const okAddr = (a) => a === self || (ctx.contacts || []).some((c) => lc(c.address) === a) || (ctx.knownSpenders || []).includes(a);
  for (const r of decoded) {
    flags.push({ code: 'service_call_decoded', severity: 'info', detail: `${r.name} (${r.kind}) vers un protocole de confiance` });
    for (const b of r.beneficiaries) if (!okAddr(b)) flags.push({ code: r.severe ? 'service_recipient_not_self' : 'service_beneficiary_not_self', severity: r.severe ? 'critical' : 'warn', detail: `le produit de ${r.name} va à ${b}, ni vous ni un contact ni un protocole connu` });
    if (r.minOutZero) flags.push({ code: 'slippage_unbounded', severity: 'warn', detail: `${r.name} : minimum reçu = 0 : aucun garde-fou de prix` });
  }
  recompute(eff);
}

// ---- F18 : envoi natif nu (sans calldata) vers un jeton du registre de référence : dépôt dans un jeton enveloppé (receive/fallback), le jeton de reçu est crédité à l'expéditeur.
// Le comparateur déduirait « rien reçu en échange » alors que le contrat crédite un solde que la transaction ne montre pas.
function wrapDeposit(eff, request, ctx, flags) {
  if (request.method !== 'eth_sendTransaction') return;
  const tx = request.params && request.params[0]; if (!tx || !tx.to) return;
  const data = String(tx.data ?? tx.input ?? '0x'); if (data !== '0x' && data !== '') return;
  if (eff.opaque || eff.approvals.length || (eff.controlChange || []).length || eff.delegation || eff.service) return;
  if (!registryAddrs(ctx).includes(lc(tx.to))) return;
  eff.service = { name: 'wrap_deposit', trusted: true };
  flags.push({ code: 'service_call_decoded', severity: 'info', detail: 'envoi natif à un jeton du registre : dépôt, reçu crédité à l expéditeur' });
}

// ---- Adresse sosie (USENIX Sec. 2025 : préfixe >= 3 ET suffixe >= 4 caractères hexa communs avec une adresse connue de l'utilisateur, sans être identique).
// Le comparateur du dépôt n'appelle jamais sa fonction 4+4 ; le moteur de base a déjà la règle 3+4, ce bloc la complète :
//  F21 : le fournisseur de contexte (surveillance du presse-papiers, indexeur) PEUT signaler qu'une contrepartie ressemble à une adresse connue (counterparty_facts[a].lookalikeOf) : critical.
//  F22 : le sosie est celui qui n'est PAS la vraie. Si la destination a déjà été payée par l'utilisateur (sortie dans l'historique) et que l'adresse « dont elle serait le sosie » n'a jamais
//        reçu de paiement (poussière entrante seulement), c'est la destination qui est la vraie ; l'alerte est retirée (elle vise le sosie qui traîne dans l'historique, pas la destination).
//  F23 : score continu : préfixe >= 2 ET suffixe >= 3 (sans atteindre 3+4) avec une adresse déjà payée ou un contact, pour une destination jamais payée : warn (critical reste réservé à 3+4).
const isAddrS = (a) => typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a);
const outHist = (ctx) => new Set((ctx.history || []).filter((h) => h.direction === 'out').map((h) => lc(h.address)));
function lookalikeRules(eff, ctx, flags) {
  const paid = outHist(ctx);
  const self = lc(ctx.from);
  const contacts = new Set((ctx.contacts || []).map((c) => lc(c.address)));
  for (const cp of eff.counterparties || []) {
    const D = cp.address;
    if (isOn('F21')) {
      const la = ctx._facts && ctx._facts[D] && ctx._facts[D].lookalikeOf;
      if (isAddrS(la) && lc(la) !== D) { if (!cp.lookalikeOf) cp.lookalikeOf = lc(la); flags.push({ code: 'lookalike_reported', severity: 'critical', detail: `${D} est signalée comme sosie de ${lc(la)} par le fournisseur de contexte`, address: D, lookalikeOf: lc(la) }); }
    }
    if (isOn('F22') && cp.lookalikeOf && paid.has(D) && !paid.has(lc(cp.lookalikeOf)) && lc(cp.lookalikeOf) !== self) {
      eff.risk_flags = eff.risk_flags.filter((f) => !((f.code === 'address_poisoning' || f.code === 'lookalike_address') && f.address === D));
      delete cp.lookalikeOf; cp.realAddress = true;
    }
    if (isOn('F23') && !cp.lookalikeOf && !paid.has(D) && !contacts.has(D) && D !== self && !(ctx.knownSpenders || []).includes(D)) {
      for (const A of new Set([...paid, ...contacts, self])) {
        if (!A || A === D) continue;
        const m = matchLens(D, A);
        if (m.prefix >= 2 && m.suffix >= 3) { flags.push({ code: 'lookalike_weak', severity: 'warn', detail: `${D} partage ${m.prefix} caractères de début et ${m.suffix} de fin avec ${A}`, address: D }); break; }
      }
    }
  }
}

// ---- Signatures lues par FORME et non par nom (un attaquant renomme le primaryType ; le moteur de base ne reconnaît que les noms canoniques).
// F24 : un message typé que le moteur n'a pas su classer (kind inconnu) mais qui contient un dépensier (spender / operator / usr) et un montant (value / amount / wad / allowed / details[] / permitted[]) accorde un
//       droit de dépense : si le dépensier n'est pas un protocole connu et que le montant est « plus que quiconque ne possède » (>= 2^128 ou >= 1e9 unités entières) => critical ; un retrait (permitted[]) illimité => critical
//       quel que soit le dépensier. Le propriétaire déclaré n'est pas pris en compte (une page qui demande un droit au nom d'un autre reste une demande de droit).
// F25 : personal_sign d'une charge binaire (non lisible) qui a la FORME d'un appel de contrat (jusqu'à 8 octets de préfixe, un sélecteur de 4 octets, puis un premier argument adresse aligné sur 32 octets)
//       n'est pas un message mais une transaction déguisée => critical. Aucune liste de sélecteurs : la forme seule.
// F26 : personal_sign d'un texte lisible (hors connexion SIWE) qui dit accorder / autoriser / transférer / migrer des actifs => critical (repli par mots-clés, sans modèle de langue ; limites assumées).
const TWO128 = 1n << 128n;
const bigS = (v) => { try { return BigInt(v); } catch { return undefined; } };
function effUnlimited(ctx, token, amount) {
  const a = bigS(amount); if (a === undefined) return false;
  return a >= TWO128 || a >= 10n ** BigInt(9 + decOf(ctx, token));
}
function shapeGrants(td) {
  const m = td && td.message; if (!m || typeof m !== 'object') return [];
  const spender = [m.spender, m.operator, m.usr].find((x) => isAddrS(x)); if (!spender) return [];
  const dom = td.domain && td.domain.verifyingContract;
  const list = (x) => (Array.isArray(x) ? x : x && typeof x === 'object' ? [x] : []);
  const out = [];
  for (const d of list(m.details)) out.push({ mode: 'allowance', token: d.token, amount: d.amount, spender });
  for (const d of list(m.permitted)) out.push({ mode: 'transfer', token: d.token, amount: d.amount, spender });
  if (!out.length) {
    if (m.allowed === true || m.allowed === 'true') out.push({ mode: 'allowance', token: dom, amount: (1n << 256n) - 1n, spender });
    else for (const k of ['value', 'amount', 'wad']) if (m[k] !== undefined && typeof m[k] !== 'object') { out.push({ mode: 'allowance', token: dom, amount: m[k], spender }); break; }
  }
  return out;
}
function signatureShapes(eff, request, ctx, flags) {
  if (request.method === 'eth_signTypedData_v4' && isOn('F24')) {
    if (!(eff.signature && eff.signature.kind === 'unknown')) return;
    let td; try { td = typeof request.params[1] === 'string' ? JSON.parse(request.params[1]) : request.params[1]; } catch { return; }
    for (const g of shapeGrants(td)) {
      const unl = effUnlimited(ctx, g.token, g.amount); const known = (ctx.knownSpenders || []).includes(lc(g.spender));
      if (g.mode === 'transfer' && unl) { flags.push({ code: 'signed_transfer_unlimited', severity: 'critical', detail: `signature de retrait illimité de ${lc(g.token)} par ${lc(g.spender)} (type renommé : lu par sa forme)` }); return; }
      if (!known && isOn('F27')) eff.shapeGrant = { spender: lc(g.spender), token: g.token ? lc(g.token) : undefined, unlimited: unl };
      if (!known && unl) { flags.push({ code: 'signed_right_unlimited_unknown', severity: 'critical', detail: `droit de dépense illimité sur ${lc(g.token)} pour ${lc(g.spender)} hors protocoles connus (type renommé : lu par sa forme)` }); return; }
    }
  } else if (request.method === 'personal_sign') {
    const hex = request.params && request.params[0];
    if (typeof hex !== 'string' || !/^0x([0-9a-fA-F]{2})*$/.test(hex)) return;
    const b = Buffer.from(hex.slice(2), 'hex'); if (!b.length) return;
    const txt = b.toString('utf8');
    const readable = !txt.includes('\uFFFD') && !/[\x00-\x08\x0e-\x1f]/.test(txt);
    if (!readable && isOn('F25')) {
      for (let o = 0; o <= 8; o++) {
        if (b.length < o + 4 + 32 + 20) break;
        if (!b.subarray(o + 4, o + 16).every((x) => x === 0)) continue;
        if (b.subarray(o + 16, o + 36).filter((x) => x !== 0).length >= 12) { flags.push({ code: 'signed_calldata', severity: 'critical', detail: 'le « message » à signer a la forme d un appel de contrat (sélecteur + adresse alignée), pas d un texte' }); return; }
      }
    } else if (readable && isOn('F26')) {
      const GRANT = /\b(authori[sz]\w*|grant\w*|approv\w*|permission\w*|allow\w*|migrat\w*|transfer\w*|autoris\w*|approuv\w*|accord\w*|transf[eè]r\w*)\b/i;
      const ASSET = /\b(tokens?|nfts?|assets?|balances?|funds?|spending|jetons?|soldes?|fonds|avoirs?|d[ée]pense)\b/i;
      if (!/sign in with your ethereum account/i.test(txt) && GRANT.test(txt) && ASSET.test(txt)) flags.push({ code: 'signed_text_grants_assets', severity: 'critical', detail: 'le texte à signer dit accorder ou déplacer des actifs (repli par mots-clés)' });
    }
  }
}

// ---- F30 : message typé de pure signalisation hors chaîne (vote de gouvernance, abonnement, profil). Lu par sa FORME : domaine sans verifyingContract NI chainId (aucun contrat ne peut le
// vérifier on-chain, aucun réseau n'est visé), le seul champ adresse est le signataire lui-même, et aucun champ ne désigne un dépensier, un destinataire ou un montant.
// Dans ce cas, le moteur ne sait pas le nommer mais le message ne peut déplacer aucun actif : l'opacité est levée (info). Tout champ de type valeur/destinataire garde l'alerte.
const MONEY_KEYS = /^(spender|operator|usr|to|recipient|receiver|beneficiary|amount|value|wad|allowed|sellAmount|buyAmount|token|tokens|permitted|details|offer|consideration|nonce|deadline|expiry|destination|target|data|calldata|call|calls|operations)$/i;
function offchainSignaling(eff, request, ctx) {
  if (request.method !== 'eth_signTypedData_v4' || !eff.opaque) return;
  if (!(eff.signature && eff.signature.kind === 'unknown')) return;
  let td; try { td = typeof request.params[1] === 'string' ? JSON.parse(request.params[1]) : request.params[1]; } catch { return; }
  const d = td && td.domain; const m = td && td.message; if (!d || !m || typeof m !== 'object') return;
  if (d.verifyingContract !== undefined || d.chainId !== undefined) return;
  const self = lc(ctx.from); let ok = true;
  const walk = (o, depth) => { if (!ok || depth > 4) { if (depth > 4) ok = false; return; } for (const [k, v] of Object.entries(o)) { if (MONEY_KEYS.test(k)) { ok = false; return; } if (typeof v === 'string' && isAddrS(v) && lc(v) !== self) { ok = false; return; } if (v && typeof v === 'object') walk(v, depth + 1); } };
  walk(m, 0);
  if (!ok) return;
  const GONE = new Set(['unknown_typed_data', 'unknown_typed_data_addresses', 'opaque', 'domain_without_chainid']);
  eff.risk_flags = eff.risk_flags.filter((f) => !GONE.has(f.code));
  if (!eff.risk_flags.some((f) => f.code !== 'opaque' && OPACITY_CODES.has(f.code))) { eff.opaque = false; eff.opaqueReasons = []; }
  eff.risk_flags.push({ code: 'offchain_signaling', severity: 'info', detail: 'message de signalisation hors chaîne (domaine sans contrat ni réseau, aucun champ de valeur ou de destinataire)' });
  recompute(eff);
}

export function applyExtraRules(eff, request, ctx) {
  const flags = [];
  if (isOn('F11')) marketOrderProceeds(request, ctx, flags);
  if (isOn('F10')) foreignApproval(eff, ctx, flags);
  if (isOn('F9')) identityChecks(ctx, flags);
  if (isOn('F8')) tokenChecks(request, ctx, flags);
  if (isOn('F7')) signedOrder(request, ctx, flags);
  if (isOn('F5')) serviceCall(eff, request, ctx);
  if (isOn('F14')) libraryCalls(eff, request, ctx, flags);
  if (isOn('F18')) wrapDeposit(eff, request, ctx, flags);
  signatureShapes(eff, request, ctx, flags);
  if (isOn('F30')) offchainSignaling(eff, request, ctx);
  if (isOn('F21') || isOn('F22') || isOn('F23')) lookalikeRules(eff, ctx, flags);
  addFlags(eff, flags);
  if (isOn('F22')) recompute(eff);
  return eff;
}

// ---- F6 : changement / ajout de chaîne (wallet_switchEthereumChain / wallet_addEthereumChain). Aucun transfert, mais le RPC d'une chaîne ajoutée voit et peut falsifier
// soldes et simulations. Registre PUBLIC de chaînes bien connues (identifiants de chaînes EVM publiques, pas des données du catalogue).
const WELL_KNOWN_CHAINS = new Set([1, 10, 56, 100, 137, 250, 324, 1101, 5000, 8453, 34443, 42161, 42170, 42220, 43114, 59144, 81457, 534352, 7777777, 11155111]);
// F17 : testnets publics majeurs (identifiants de chaînes EVM publiques) et hôtes RPC publics officiels des chaînes principales. Un site qui propose une chaîne publique connue avec son RPC officiel
// ne fait rien de plus que ce que le portefeuille ferait seul ; un RPC d'un autre hôte reste signalé (il peut mentir sur soldes et simulations).
const PUBLIC_TESTNETS = [43113, 17000, 84532, 421614, 11155420, 97, 80002, 59141, 534351, 168587773];
const OFFICIAL_RPC_HOSTS = { 43114: ['api.avax.network'], 43113: ['api.avax-test.network'], 1: ['eth.llamarpc.com', 'cloudflare-eth.com', 'ethereum-rpc.publicnode.com', 'rpc.ankr.com', 'eth.merkle.io'], 8453: ['mainnet.base.org'], 10: ['mainnet.optimism.io'], 42161: ['arb1.arbitrum.io'], 137: ['polygon-rpc.com'], 56: ['bsc-dataseed.binance.org'] };
const rpcHost = (u) => { try { return new URL(String(u)).hostname.toLowerCase(); } catch { return ''; } };
const MAJOR_SYMBOLS = new Set(['ETH', 'WETH', 'BTC', 'WBTC', 'USDC', 'USDT', 'DAI', 'BNB', 'MATIC', 'POL', 'AVAX', 'SOL']);
const ETH_FAMILY = new Set([1, 10, 324, 1101, 8453, 34443, 42161, 42170, 59144, 81457, 534352, 7777777, 11155111]);
const toNum = (v) => { try { return typeof v === 'number' ? v : Number(BigInt(v)); } catch { return NaN; } };
export function analyzeChainRequest(request, ctx) {
  if (!isOn('F6')) return null;
  const p = (request.params && request.params[0]) || {};
  const id = toNum(p.chainId);
  const flags = [];
  const f = (code, severity, detail) => flags.push({ code, severity, detail });
  if (!Number.isFinite(id)) f('chain_request_malformed', 'warn', 'chainId illisible');
  else if (request.method === 'wallet_switchEthereumChain') {
    if (WELL_KNOWN_CHAINS.has(id) || (isOn('F17') && PUBLIC_TESTNETS.includes(id))) f('chain_switch_known', 'info', `bascule vers la chaîne ${id} (registre public)`);
    else f('chain_switch_unknown', 'warn', `bascule vers une chaîne ${id} hors registre public`);
  } else {
    const urls = Array.isArray(p.rpcUrls) ? p.rpcUrls : [];
    const sym = String(p.nativeCurrency && p.nativeCurrency.symbol || '').toUpperCase();
    const known = WELL_KNOWN_CHAINS.has(id) || (isOn('F17') && PUBLIC_TESTNETS.includes(id));
    const officialRpc = isOn('F17') && known && urls.length > 0 && urls.every((u) => (OFFICIAL_RPC_HOSTS[id] || []).includes(rpcHost(u)));
    if (!urls.length) f('chain_add_no_rpc', 'warn', 'ajout de chaîne sans RPC');
    if (urls.some((u) => !String(u).toLowerCase().startsWith('https://'))) f('chain_add_insecure_rpc', 'critical', 'RPC non chiffré (hors https)');
    if (known && officialRpc) f('chain_add_known_official_rpc', 'info', `ajout de la chaîne publique ${id} avec un RPC public officiel`);
    else if (known) f('chain_add_known_id_custom_rpc', 'warn', `ajout de la chaîne publique ${id} avec un RPC fourni par le site (non vérifié par le portefeuille)`);
    else {
      if (MAJOR_SYMBOLS.has(sym)) f('chain_add_native_symbol_spoof', 'critical', `chaîne ${id} hors registre qui se présente avec le symbole natif ${sym} : un RPC contrôlé par le site peut mentir sur soldes et simulations`);
      else f('chain_add_unknown', 'warn', `ajout d'une chaîne ${id} hors registre public avec un RPC fourni par le site`);
    }
    if (known && MAJOR_SYMBOLS.has(sym) && sym === 'ETH' && !ETH_FAMILY.has(id)) f('chain_add_native_symbol_mismatch', 'warn', `symbole ETH sur une chaîne ${id} dont la monnaie native n'est pas l'ETH`);
  }
  const eff = { chainId: Number(ctx.chainId ?? 0), from: ctx.from, kind: 'chain', outgoing: [], incoming: [], approvals: [], counterparties: [], raw: { method: request.method, chainId: Number.isFinite(id) ? id : undefined }, opaque: false, opaqueReasons: [], controlChange: [], nested: [], risk_flags: [], level: 'ok', levelEvidence: 'ok' };
  return addFlags(eff, flags);
}

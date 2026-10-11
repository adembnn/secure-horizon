// Couche de POLITIQUE : post-traitement du verdict du comparateur d'Adem (vendor, NON modifié) et du plancher du moteur,
// selon les RAISONS du comparateur et l'OPACITÉ / la complétude des effets décodés. Aucune lecture de label, d'id de cas ou d'adresse littérale.
// Chaque correctif est un interrupteur (engine/src/fixes.mjs) pour la mesure A/B.
import { isOn } from './src/fixes.js';
import { OPACITY_CODES } from '../engine/src/engine.js';
import { tokenInfo, DEFAULT_TOKENS, defaultTokensOn } from '../engine/src/util.js';

const RANK = { info: -1, ok: 0, warn: 1, critical: 2 };
const worst = (a, b) => (RANK[a] >= RANK[b] ? a : b);
const lvlOf = (flags) => flags.reduce((m, f) => worst(m, f.severity === 'info' ? 'ok' : f.severity), 'ok');
// sévérité de chaque raison du comparateur (compare.ts : escalate('warn') pour ces 4 codes, 'critical' pour tous les autres)
const WARN_CODES = new Set(['new_contract', 'high_balance_share', 'unlimited_approval_swap', 'low_confidence']);
const sevOfReason = (code) => (WARN_CODES.has(code) ? 'warn' : 'critical');
const ademLevel = (reasons) => reasons.reduce((m, r) => worst(m, r.sev || sevOfReason(r.code)), 'ok');

// ---- lecture des détails d'intention (jeton, montant, jeton reçu) : ils servent seulement à AJOUTER des raisons, jamais à baisser un niveau (monotonie).
const NATIVE_BY_CHAIN = { 1: 'ETH', 10: 'ETH', 8453: 'ETH', 42161: 'ETH', 59144: 'ETH', 534352: 'ETH', 324: 'ETH', 81457: 'ETH', 56: 'BNB', 137: 'POL', 43114: 'AVAX', 43113: 'AVAX', 11155111: 'ETH', 17000: 'ETH', 84532: 'ETH', 421614: 'ETH', 11155420: 'ETH', 97: 'BNB', 80002: 'POL', 100: 'xDAI', 250: 'FTM', 42220: 'CELO', 5000: 'MNT' };
// famille d'un jeton : la casse, le préfixe $ et les suffixes .e/.b ne changent pas l'actif dit. Une monnaie native et SA version enveloppée sont le même actif
// (WETH = ETH, WAVAX = AVAX...) : liste fermée, car un W initial ne veut pas toujours dire « enveloppé » (wstETH n'est pas stETH). MATIC et POL sont le même actif.
const WRAPPED_NATIVE = { WETH: 'ETH', WAVAX: 'AVAX', WBNB: 'BNB', WMATIC: 'POL', WPOL: 'POL', MATIC: 'POL', WFTM: 'FTM', WXDAI: 'XDAI', WCELO: 'CELO', WMNT: 'MNT', WBTC: 'BTC' };
const tokenFamily = (s) => { const x = String(s || '').trim().toUpperCase().replace(/^\$/, '').replace(/\.[EB]$/, ''); return WRAPPED_NATIVE[x] || x; };
const isAddrStr = (a) => typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a);
const BUY_TEXT = /\b(achet\w*|achat|acqu[ée]rir|buy\w*|purchas\w*|copping)\b/i;
const SWAP_TEXT = /\b(echang\w*|swap\w*|convert\w*|trade\w*|troqu\w*|vend\w*|sell\w*)\b/i;
const SELL_TEXT = /\b(vend\w*|vente|sell\w*|sale|list\w*|lister|liste)\b/i;
// texte sans accents ni casse (pour les mots de l'intention écrite)
const foldTxt = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// réseaux nommés explicitement dans le texte : « sur X », « on X », « réseau X », « X mainnet », « C-Chain ». Un nom seul (« ethereum » pour le jeton) ne compte pas.
// chaque nom désigne le réseau principal ET son réseau de test public (un réseau de test ne porte pas de valeur) ; « fuji », « sepolia » désignent le test seul
const CHAIN_WORDS = [[/ethereum/, [1, 11155111, 17000]], [/avalanche|c-chain/, [43114, 43113]], [/base/, [8453, 84532]], [/arbitrum/, [42161, 421614]], [/optimism|op mainnet/, [10, 11155420]], [/polygon/, [137, 80002]], [/bnb chain|bsc|binance smart chain/, [56, 97]], [/fuji/, [43113]], [/sepolia/, [11155111]]];
function chainsNamed(t) {
  const found = new Set();
  for (const [re, id] of CHAIN_WORDS) {
    const w = re.source;
    const pre = new RegExp('\\b(?:sur|on|via|reseau|network|chain|chaine|blockchain)\\s+(?:le\\s+reseau\\s+|la\\s+|l\')?(?:' + w + ')\\b');
    const post = new RegExp('\\b(?:' + w + ')\\s+(?:mainnet|network|reseau|chain|c-chain|one|pos)\\b');
    if (pre.test(t) || post.test(t) || (id[0] === 43114 && /\bc-chain\b/.test(t))) found.add(id);
  }
  return [...found];
}
const hostOfUrl = (u) => { if (!u) return ''; try { return new URL(String(u).includes('://') ? String(u) : 'https://' + String(u)).hostname.toLowerCase(); } catch { return ''; } };
const sameSite = (a, b) => a === b || a.endsWith('.' + b) || b.endsWith('.' + a);
// sites nommés dans le texte : nom d'hôte avec un domaine de premier niveau en lettres (pas « 0,5 », pas « USDC.e »)
// (les noms de portefeuille ou d'espace, comme « aave.eth », ne sont pas des sites : exclus)
const NOT_WEB_TLD = /\.(eth|sol|crypto|nft|lens|avax|arb|base|bnb|x|wallet|dao|blockchain|bitcoin|zil)$/;
const hostsNamed = (s) => [...new Set((String(s || '').toLowerCase().match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,24}\b/g) || []).filter((h) => /[a-z]/.test(h.split('.')[0]) && !/^\d/.test(h) && !NOT_WEB_TLD.test(h)))];
// montants lisibles : « 1,5 », « 1.5 », « 1 000 », « 1,000 » (milliers ou décimale : on garde la lecture la plus large, jamais la plus stricte)
function amountReadings(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? [v] : [];
  if (typeof v !== 'string') return [];
  const t = v.replace(/[\s  ]/g, '');
  if (!t) return [];
  const out = [];
  if (/^\d+$/.test(t)) out.push(Number(t));
  else if (/^\d+[.,]\d+$/.test(t)) { out.push(Number(t.replace(',', '.'))); if (/^\d{1,3}[.,]\d{3}$/.test(t)) out.push(Number(t.replace(/[.,]/, ''))); }
  else if (/^\d{1,3}([.,]\d{3})+$/.test(t)) out.push(Number(t.replace(/[.,]/g, '')));
  else if (/^\d{1,3}(,\d{3})+\.\d+$/.test(t)) out.push(Number(t.replace(/,/g, '')));
  else if (/^\d{1,3}(\.\d{3})+,\d+$/.test(t)) out.push(Number(t.replace(/\./g, '').replace(',', '.')));
  return out.filter(Number.isFinite);
}
const DETAIL_KINDS = new Set(['buy_or_swap', 'pay_someone', 'send_to_my_account']);

const ZERO_ADDR ='0x' + '0'.repeat(40);
const isKnownProtocol = (ctx, a) => !!a && (ctx.knownSpenders || []).includes(String(a).toLowerCase());

// Une monnaie courante (« 25 $ », « 50 dollars » : jeton dit = USD) n'est pas un jeton : elle ne nomme ni le jeton donné ni un montant comparable à n'importe quel jeton.
const MONEY_WORDS = new Set(['USD', 'DOLLAR', 'DOLLARS']);
export function applyPolicy({ eff, adem, ctx, intent, request }) {
  // Les règles de détail (F31, F32, F33) ne lisent pas une monnaie courante ; la comparaison à un jeton stable connu par son adresse est faite côté phrase (extension/written_check.js).
  if (intent && typeof intent.token === 'string' && MONEY_WORDS.has(intent.token.trim().toUpperCase())) intent = { ...intent, token: undefined, amount: undefined };
  const notes = [];
  let flags = eff.risk_flags.map((f) => ({ ...f }));
  let reasons = adem ? adem.reasons.map((r) => ({ ...r })) : [];
  const incomplete = !!eff.opaque || (eff.opaqueReasons || []).length > 0; // les effets reçus ne sont pas tous connus
  const drop = (code, why) => { const n = reasons.length; reasons = reasons.filter((r) => r.code !== code); if (reasons.length !== n) notes.push(why); };

  // ---- F1 : un appel dont on ne connaît pas les effets reçus ne prouve pas l'absence d'entrée : pas de no_incoming critical déduit.
  // Réserve : seulement si la cible est un protocole de la liste connue ; un contrat inconnu ET opaque ET payé garde la sévérité critical du comparateur.
  // (le plancher garde le warn d'opacité : le cas n'est jamais 'ok')
  if (isOn('F1') && (incomplete || ((isOn('F5') || isOn('F14')) && eff.service)) && (isKnownProtocol(ctx, eff.raw && eff.raw.to) || (isOn('F14') && eff.service && eff.service.trusted))) drop('no_incoming', 'F1:no_incoming_ignore_effets_incomplets');

  // ---- F28 : variante élargie de F1 : pour un appel OPAQUE vers une cible inconnue, l'absence d'entrée visible n'est pas une preuve de perte (on ne voit pas ce que le contrat crédite) :
  // no_incoming passe de critical à warn (l'opacité reste warn au plancher, jamais ok). Les contrats très récents et les cibles signalées autrement gardent leur sévérité.
  if (isOn('F28') && incomplete && reasons.some((r) => r.code === 'no_incoming') && !(eff.counterparties || []).some((cp) => cp.lookalikeOf || (cp.ageBlocks !== undefined && cp.ageBlocks < 50))) {
    reasons = reasons.map((r) => (r.code === 'no_incoming' ? { ...r, sev: 'warn' } : r)); notes.push('F28:no_incoming_opaque_inconnu');
  }

  // ---- F29 : le comparateur lit le montant déclaré avec parseFloat : « 10,5 » (virgule décimale, usage français) devient 10 et fait croire à un dépassement. Montant déclaré normalisé
  // (virgule -> point, espaces fines retirées) ; si tous les montants sortants décodés sont <= au montant déclaré (+1 %), le motif amount_exceeded est un artefact de format et disparaît.
  if (isOn('F29') && intent && typeof intent.amount === 'string' && /[,\s]/.test(intent.amount) && reasons.some((r) => r.code === 'amount_exceeded')) {
    const declared = parseFloat(intent.amount.replace(/[\s\u202f\u00a0]/g, '').replace(',', '.'));
    if (Number.isFinite(declared) && (eff.outgoing || []).every((o) => { const a = parseFloat(o.amount); return Number.isFinite(a) && a <= declared * 1.01; })) drop('amount_exceeded', 'F29:montant_virgule_decimale');
  }

  // ---- F2 : « première fois vu » n'a pas de sens pour un protocole/contrat de la liste connue (pont, routeur, collection) : c'est le point de passage, pas le bénéficiaire final.
  if (isOn('F2') && reasons.some((r) => r.code === 'first_seen_recipient')) {
    const unknownFirstSeen = (eff.counterparties || []).filter((cp) => cp.firstSeenByUser && !isKnownProtocol(ctx, cp.address));
    drop('first_seen_recipient', 'F2:first_seen_protocole_connu');
    for (const cp of unknownFirstSeen) reasons.push({ code: 'first_seen_recipient', said: '', does: cp.address });
  }

  // ---- F12 : un ordre signé hors chaîne (marché, solveur) est un ÉCHANGE conditionnel : ce que le signataire donne est lié à un minimum reçu.
  // Si ce minimum n'est pas négligeable (>= 1e-4 unité, ou un NFT), « tu enverrais X » n'est pas un effet inattendu d'une signature de vente ; un produit négligeable reste attrapé par le plancher (F11).
  if (isOn('F12') && eff.kind === 'signature' && reasons.some((r) => r.code === 'unexpected_outgoing')) {
    const exchange = (eff.incoming || []).some((i) => i.bound === 'min' && (i.std === 'erc721' || i.std === 'erc1155' || Number(i.amount) >= 1e-4));
    if (exchange) drop('unexpected_outgoing', 'F12:echange_conditionnel_signe');
  }

  // ---- F15 : « une grande part du solde sort » n'est un signal que si la destination n'est pas routinière. Un envoi à soi-même, à une adresse déjà payée par l'utilisateur (historique
  // sortant) ou à un protocole de la liste connue est l'usage normal (dépôt, remboursement, virement) ; seul un envoi massif vers une adresse inconnue ou sosie reste signalé.
  // Ni un historique ENTRANT (poussière d'empoisonnement) ni une simple entrée de carnet ne rendent une adresse routinière : un carnet peut être réécrit (extension malveillante), seule une sortie déjà effectuée prouve l'habitude.
  if (isOn('F15') && (eff.outgoing || []).length && !(eff.counterparties || []).some((cp) => cp.lookalikeOf)) {
    const routine = (a) => { const x = String(a).toLowerCase(); return x === String(ctx.from).toLowerCase() || isKnownProtocol(ctx, x) || (ctx.history || []).some((h) => h.direction === 'out' && String(h.address).toLowerCase() === x); };
    if (eff.outgoing.every((o) => routine(o.to))) {
      const n = flags.length; flags = flags.filter((f) => f.code !== 'high_balance_share');
      drop('high_balance_share', 'F15:destination_routiniere');
      if (flags.length !== n) notes.push('F15:destination_routiniere');
    }
  }

  // ---- F13 : l'opérateur NFT (setApprovalForAll) accordé à un protocole de la liste connue est le mécanisme normal d'une mise en vente ou d'un échange de NFT :
  // l'écart d'intention « tu voulais juste te connecter » est à confirmer (warn), pas une arnaque (critical). Le plancher garde son warn (opérateur sur toute la collection).
  if (isOn('F13') && (eff.approvals || []).length && eff.approvals.every((a) => a.via === 'setApprovalForAll' && isKnownProtocol(ctx, a.spender))) {
    let hit = false;
    reasons = reasons.map((r) => (r.code === 'unexpected_approval_connect' || r.code === 'unexpected_approval' ? ((hit = true), { ...r, sev: 'warn' }) : r));
    if (hit) notes.push('F13:operateur_nft_protocole_connu');
  }

  // ---- F16 : un droit ERC-20 illimité ou à longue échéance accordé à un protocole de la liste connue (routeur, Permit2, pool) est le fonctionnement normal des échanges et du prêt :
  // ce n'est plus un signal de risque en soi (le plancher le rétrograde en info) ; l'écart « échange » vs « autorisation illimitée » du comparateur disparaît aussi. Toute autre cause
  // (sosie, bénéficiaire inconnu, destination différente) garde sa sévérité. Les droits sur toute une collection NFT (F13) et les droits à un bénéficiaire inconnu ne sont PAS concernés.
  if (isOn('F16') && (eff.approvals || []).length && eff.approvals.every((a) => a.via !== 'setApprovalForAll' && isKnownProtocol(ctx, a.spender)) && !(eff.counterparties || []).some((cp) => cp.lookalikeOf)) {
    const n = flags.length;
    flags = flags.map((f) => (f.code === 'unlimited_allowance' || f.code === 'far_expiry' ? { ...f, severity: 'info' } : f));
    drop('unlimited_approval_swap', 'F16:droit_illimite_protocole_connu');
    if (n) notes.push('F16:droit_illimite_protocole_connu');
  }

  // ---- F19 : « tu voulais seulement envoyer/échanger » mais le lot contient un droit : si TOUS les droits vont à des protocoles de la liste connue (pont, routeur, pool), le droit est le
  // préalable normal de l'opération (approve puis dépôt) ; l'écart d'intention reste à confirmer (warn) au lieu de critical. Un droit à un bénéficiaire inconnu ou sosie reste critical.
  if (isOn('F19') && (eff.approvals || []).length && eff.approvals.every((a) => isKnownProtocol(ctx, a.spender)) && !(eff.counterparties || []).some((cp) => cp.lookalikeOf)) {
    let hit = false;
    reasons = reasons.map((r) => (r.code === 'unexpected_approval' ? ((hit = true), { ...r, sev: 'warn' }) : r));
    if (hit) notes.push('F19:droit_prealable_protocole_connu');
  }

  // ---- F20 : « on me l'a demandé » + paiement à un destinataire que l'utilisateur a DÉJÀ payé (historique sortant) : la sollicitation vient d'un proche connu, pas d'un inconnu qui se présente.
  // warn (à confirmer) au lieu de critical ; un destinataire jamais payé reste critical.
  if (isOn('F20') && reasons.some((r) => r.code === 'asked_by_someone_outgoing') && !(eff.approvals || []).length && !eff.delegation && (eff.outgoing || []).length && !(eff.counterparties || []).some((cp) => cp.lookalikeOf)) {
    const paid = (a) => (ctx.history || []).some((h) => h.direction === 'out' && String(h.address).toLowerCase() === String(a).toLowerCase());
    if (eff.outgoing.every((o) => paid(o.to))) { reasons = reasons.map((r) => (r.code === 'asked_by_someone_outgoing' ? { ...r, sev: 'warn' } : r)); notes.push('F20:destinataire_deja_paye'); }
  }

  // ---- F27 : un message typé non classé par le moteur qui, lu par sa forme, accorde un droit de dépense à un dépensier hors protocoles connus (eff.shapeGrant) : si l'intention déclarée n'est pas
  // un échange, la personne ne croit pas accorder un droit de dépense => critical (l'écart d'intention que le comparateur ne voit pas faute d'approbation décodée).
  if (isOn('F27') && eff.shapeGrant && intent && intent.kind !== 'buy_or_swap') { reasons.push({ code: 'signed_right_not_intended', sev: 'critical', said: '', does: eff.shapeGrant.spender }); notes.push('F27:droit_signe_hors_intention'); }

  // ---- F4 : une délégation EIP-7702 vers une implémentation de la liste connue (auditée) sur une chaîne précise n'est pas un abandon de compte à un inconnu :
  // warn (à confirmer) au lieu de critical. chain_id = 0 (toutes chaînes) et cible inconnue restent critical.
  if (isOn('F4') && eff.delegation && isKnownProtocol(ctx, eff.delegation.to) && !(eff.delegations || []).some((d) => d.chainId === 0 && String(d.to) !== ZERO_ADDR)) {
    const allKnown = (eff.delegations || []).filter((d) => String(d.to) !== ZERO_ADDR).every((d) => isKnownProtocol(ctx, d.to));
    if (allKnown) {
      flags = flags.map((f) => (f.code === 'delegation_7702' && f.severity === 'critical' ? { ...f, severity: 'warn' } : f));
      reasons = reasons.map((r) => (r.code === 'unexpected_delegation' || r.code === 'unexpected_delegation_connect' ? { ...r, sev: 'warn' } : r));
      notes.push('F4:delegation_implementation_connue');
    }
  }

  // ---- F3 : un changement de contrôle durable est critical SAUF si le nouveau titulaire est une personne/contrat de confiance déjà connu de l'utilisateur
  // (carnet, historique de paiements sortants, protocole de la liste connue) et non un sosie : alors warn (opération d'administration légitime mais à confirmer).
  if (isOn('F3')) {
    const ACCOUNT_TYPES = new Set(['transferOwnership', 'setOwner', 'changeAdmin', 'grantRole', 'safe.addOwner', 'safe.swapOwner', 'ens.setOwner', 'ens.reclaim', 'ens.setAddr']);
    const CODE_TYPES = new Set(['upgrade', 'safe.enableModule', 'safe.setGuard', 'safe.setModuleGuard', 'safe.setFallbackHandler', 'erc7579.installModule', 'ens.setResolver']);
    flags = flags.map((f) => {
      if (f.code !== 'control_change' || f.severity !== 'critical') return f;
      const cc = (eff.controlChange || []).find((c) => `${c.type} sur ${c.target} → ${c.subject}` === f.detail);
      if (!cc) return f;
      const cp = (eff.counterparties || []).find((x) => x.address === String(cc.subject).toLowerCase());
      const known = isKnownProtocol(ctx, cc.subject);
      const personKnown = !!cp && cp.firstSeenByUser === false && !cp.lookalikeOf;
      const adminRole = cc.type === 'grantRole' && cc.detail && cc.detail.adminRole;
      const ok = !adminRole && ((ACCOUNT_TYPES.has(cc.type) && (known || personKnown)) || (CODE_TYPES.has(cc.type) && known));
      if (!ok) return f;
      notes.push('F3:control_titulaire_connu');
      return { ...f, severity: 'warn' };
    });
  }

  // ---- F31 / F32 / F33 : l'intention DÉTAILLÉE (jeton, montant, jeton reçu) comparée aux effets. Ces règles ne lisent que des détails : sans détail (type seul ou aucune intention)
  // elles ne font rien, donc ajouter de l'information ne peut que monter le niveau. Elles couvrent ce que le comparateur d'Adem ne regarde pas pour un échange
  // (jeton, montant, droit plus large que le montant dit). Aucune adresse, aucun identifiant de cas : seulement la forme des effets.
  if (intent && (DETAIL_KINDS.has(intent.kind) || !intent.kind) && (isOn('F31') || isOn('F32') || isOn('F33'))) {
    const nat = NATIVE_BY_CHAIN[Number(eff.chainId)];
    const symOf = (tok, given) => { if (given && given !== 'NATIVE' && given !== 'native') return given; const t = String(tok || '').toLowerCase(); return t === 'native' ? nat : tokenInfo(ctx, t).symbol; };
    const said = intent.token ? tokenFamily(intent.token) : null;
    const declared = amountReadings(intent.amount); const declaredMax = declared.length ? Math.max(...declared) : NaN;
    // les frais en monnaie native versés à un protocole connu (pont, routeur) accompagnent l'opération : ils ne sont pas « un autre jeton » quand le jeton dit n'est pas la monnaie native
    const feeToProtocol = (o) => (o.std === 'native' || String(o.token).toLowerCase() === 'native') && isKnownProtocol(ctx, o.to) && !!said && said !== tokenFamily(nat);
    const moneyOut = [...(eff.outgoing || []), ...((eff.service && eff.service.spent) || [])].filter((o) => (o.std === 'native' || o.std === 'erc20' || o.std === undefined) && !feeToProtocol(o));
    const moneyApprovals = (eff.approvals || []).filter((a) => a.via !== 'setApprovalForAll' && a.std !== 'nft_all' && a.std !== 'nft_one');
    const has = (code) => reasons.some((r) => r.code === code);
    const sameAsset = (sym) => !said || !sym || tokenFamily(sym) === said;

    // F32 : un autre jeton que celui dit est engagé (vendu, ou droit accordé dessus), ou le jeton reçu n'est pas celui annoncé.
    // Identité d'un jeton : son adresse, puis son symbole. Le jeton dit peut être une adresse (alors seule la même adresse correspond, sauf natif / enveloppé du même
    // réseau) ou un symbole. Un jeton engagé sans symbole connu ne conclut que si le symbole dit a une adresse connue SUR CE RÉSEAU (registre du contexte, jetons
    // de référence du moteur, monnaie native) : alors une autre adresse n'est pas ce jeton. Même règle pour un jeton qui porte le symbole dit mais pas son adresse connue.
    if (isOn('F32') && !has('token_differs_from_intent')) {
      const nf = tokenFamily(nat);
      const regList = [...(((ctx._k && ctx._k.token_registry) || []).map((t) => ({ address: String(t.address || '').toLowerCase(), symbol: t.symbol }))), ...defaultTokensOn(eff.chainId)];
      const knownSet = (fam) => { const out = new Set(regList.filter((t) => t.symbol && tokenFamily(t.symbol) === fam).map((t) => t.address)); if (fam === nf && nat) out.add('native'); return out; };
      const idOf = (tok, given) => ({ addr: String(tok || '').toLowerCase() === 'native' ? 'native' : String(tok || '').toLowerCase(), sym: symOf(tok, given) });
      const saidAddr = isAddrStr(intent.token) ? intent.token.toLowerCase() : null;
      const saidFam = saidAddr ? (tokenInfo(ctx, saidAddr).symbol ? tokenFamily(tokenInfo(ctx, saidAddr).symbol) : null) : said;
      // -> true (c'est le jeton dit), false (ce n'en est pas un), null (on ne sait pas)
      const matches = (e) => {
        if (saidAddr) {
          if (e.addr === saidAddr) return true;
          if (saidFam && saidFam === nf) { const ks = knownSet(nf); return ks.has(e.addr) && ks.has(saidAddr); }
          return false;
        }
        if (!said) return true;
        const ks = knownSet(said);
        if (e.sym) { if (tokenFamily(e.sym) !== said) return false; return !(e.addr !== 'native' && ks.size && !ks.has(e.addr)); } // même symbole mais pas l'adresse connue de ce symbole sur ce réseau : sosie
        if (e.addr === 'native') return null; // monnaie native d'un réseau inconnu : on ne sait pas
        return ks.size ? false : null;
      };
      const other = [];
      // « jeton dit » = le jeton donné pour un paiement, si le jeton reçu est annoncé à part, ou si un montant est dit sans verbe d'achat (« échanger 50 USDC » : on
      // donne les USDC). Avec un verbe d'achat et un seul jeton dit (« acheter 821 X avec Y »), il peut être le donné OU le reçu : on ne conclut que si aucun jeton
      // engagé ou reçu n'est le jeton dit et que chacun est identifié.
      const strict = intent.kind !== 'buy_or_swap' || !!intent.receiveToken;
      // échange dit avec un montant et un verbe d'échange ou de vente, sans verbe d'achat (« échanger 50 USDC contre... ») : le jeton dit est celui qu'on DONNE.
      // On conclut alors seulement si AUCUN jeton engagé (sorti ou sur lequel un droit est donné) n'est le jeton dit (un lot peut contenir d'autres droits).
      const givenSaid = !strict && declared.length > 0 && SWAP_TEXT.test(foldTxt(intent.freeText)) && !BUY_TEXT.test(foldTxt(intent.freeText));
      if (said || saidAddr) {
        const engaged = [...moneyOut.map((o) => idOf(o.token, o.symbol)), ...moneyApprovals.map((a) => idOf(a.token))];
        if (strict) { for (const e of engaged) if (matches(e) === false) other.push(e.sym || 'un jeton non identifié'); }
        else if (givenSaid && engaged.length && engaged.map(matches).every((x) => x === false)) other.push(engaged[0].sym || 'un jeton non identifié');
        else {
          const all = [...engaged, ...(eff.incoming || []).filter((i) => i.std !== 'erc721' && i.std !== 'erc1155').map((i) => idOf(i.token, i.symbol))];
          const m = all.map(matches);
          if ((eff.incoming || []).length && engaged.length && m.every((x) => x === false)) other.push(engaged[0].sym || 'un jeton non identifié');
        }
      }
      const wantIn = intent.kind === 'buy_or_swap' && intent.receiveToken ? tokenFamily(intent.receiveToken) : null;
      let wrongIn = null;
      if (wantIn) {
        // jeton reçu : s'il est identifié et différent, c'est un écart ; s'il n'est pas identifié alors que le jeton annoncé est un jeton connu (registre, monnaie native), ce n'est pas le bon non plus
        const insAll = (eff.incoming || []).map((i) => symOf(i.token, i.symbol));
        const ins = insAll.filter(Boolean);
        const knownFam = new Set([...Object.values(ctx.tokenMeta || {}), ...Object.values(DEFAULT_TOKENS)].map((t) => t && t.symbol).filter((x) => x && x !== 'NATIVE').map(tokenFamily).concat(Object.values(NATIVE_BY_CHAIN).map(tokenFamily)));
        if (insAll.length && !ins.some((sy) => tokenFamily(sy) === wantIn)) { if (ins.length) wrongIn = ins[0]; else if (knownFam.has(wantIn)) wrongIn = 'un jeton non identifié'; }
      }
      if (other.length || wrongIn) {
        reasons.push({ code: 'token_differs_from_intent', sev: 'critical', said: `Tu veux ${intent.kind === 'buy_or_swap' ? 'échanger' : 'envoyer'} ${intent.token || 'un autre jeton'}`, does: `En réalité, la demande engage ${other[0] || wrongIn}.` });
        notes.push('F32:jeton_different_de_lintention');
      }
    }
    // F33 : plus que le montant dit part du compte (le comparateur ne le vérifie que pour un paiement). Tolérance d'arrondi de 1 %.
    if (isOn('F33') && Number.isFinite(declaredMax) && declaredMax > 0 && !has('amount_exceeded')) {
      const over = moneyOut.find((o) => sameAsset(symOf(o.token, o.symbol)) && Number.isFinite(Number(o.amount)) && Number(o.amount) > declaredMax * 1.01);
      if (over) { reasons.push({ code: 'amount_exceeded', sev: 'critical', said: `Tu veux utiliser ${intent.amount} ${intent.token || ''}`.trim(), does: `En réalité, ${over.amount} ${symOf(over.token, over.symbol) || 'tokens'} partiraient.` }); notes.push('F33:montant_superieur_a_lintention'); }
    }
    // F31 : un droit de dépense (approve, permit, Permit2) plus large que le montant dit. Bénéficiaire connu = orange, sinon rouge.
    if (isOn('F31') && Number.isFinite(declaredMax) && declaredMax > 0 && !has('approval_exceeds_intent')) {
      const wide = moneyApprovals.find((a) => sameAsset(symOf(a.token)) && (a.amount === 'unlimited' || (Number.isFinite(Number(a.amount)) && tokenInfo(ctx, a.token).decimals != null && Number(a.amount) > declaredMax * 1.01)));
      if (wide) {
        const sev = isKnownProtocol(ctx, wide.spender) ? 'warn' : 'critical';
        reasons.push({ code: 'approval_exceeds_intent', sev, said: `Tu veux utiliser ${intent.amount} ${intent.token || ''}`.trim(), does: wide.amount === 'unlimited' ? 'En réalité, ce site obtiendrait le droit de prendre tout ton solde de ce jeton, sans te redemander.' : `En réalité, ce site obtiendrait le droit de prendre ${wide.amount}, plus que prévu.` });
        notes.push(sev === 'warn' ? 'F31:droit_plus_large_protocole_connu' : 'F31:droit_plus_large_inconnu');
      }
    }
  }

  // ---- F42 : l'intention dit ACHETER (verbe d'achat, aucun verbe de vente) mais l'ordre signé (Seaport : offer / consideration) fait sortir des NFT de l'utilisateur.
  // Un achat honnête signé est une offre où l'utilisateur donne un jeton fongible (WETH, WAVAX...) et reçoit le NFT ; donner ses NFT est une vente, pas un achat.
  // Lu par la forme de l'ordre seulement (type d'élément, offreur) ; ajoute une raison, ne baisse rien. Sans texte d'intention, la règle ne fait rien.
  if (isOn('F42') && intent && eff.seaport && (!intent.kind || intent.kind === 'buy_or_swap')) {
    const txt = foldTxt(intent.freeText);
    const gives = (eff.seaport.give || []).filter((g) => Number(g.type) >= 2);
    if (BUY_TEXT.test(txt) && !SELL_TEXT.test(txt) && gives.length && String(eff.seaport.offerer).toLowerCase() === String(ctx.from).toLowerCase()) {
      reasons.push({ code: 'nft_given_on_buy_intent', sev: 'critical', said: 'Tu veux acheter un NFT', does: `En réalité, tu signes un ordre qui cède ${gives.length > 1 ? gives.length + ' de tes NFT' : 'ton NFT'} : c'est une vente, pas un achat.` });
      notes.push('F42:achat_dit_vente_signee');
    }
  }

  // ---- F43 : la signature (ou la demande) vise un autre réseau ou un autre site que celui de la demande ou de l'intention.
  //  - réseau : chainId du domaine EIP-712, ou « Chain ID » d'un message SIWE, différent du réseau de la demande ; ou réseau NOMMÉ dans le texte d'intention
  //    (« sur Avalanche », « on Base ») différent de celui que la demande vise ;
  //  - site : domaine ou URI d'un message SIWE différent de l'origine de la demande ; ou site NOMMÉ dans le texte d'intention différent de l'origine ou du domaine SIWE.
  // Le moteur voit déjà certains de ces écarts sans intention ; avec une intention, la demande ne fait pas ce qui est dit : raison propre (« ne correspond pas »).
  // Rouge si la demande engage de la valeur (sortie, droit) ou s'il s'agit d'un site ; orange sinon. Sans intention la règle ne fait rien (monotone).
  if (isOn('F43') && intent) {
    const reqChain = Number(ctx.chainId ?? eff.chainId);
    const sig = eff.signature || {};
    const siweChain = eff.siwe && eff.siwe.fields && eff.siwe.fields['Chain ID'] !== undefined ? Number(eff.siwe.fields['Chain ID']) : undefined;
    const signedChain = Number.isFinite(Number(sig.domainChainId)) && sig.domainChainId !== null && sig.domainChainId !== undefined ? Number(sig.domainChainId) : siweChain;
    const value = (eff.outgoing || []).length > 0 || (eff.approvals || []).length > 0 || !!eff.delegation;
    const txt = foldTxt(intent.freeText);
    // le réseau ou le site NOMMÉ dans le texte n'est comparé que pour une signature (le réseau ou le site pour lequel elle vaut) ou une connexion :
    // « passer mes USDC sur Arbitrum » (pont) ou « virer vers Crypto.com » (dépôt) nomment une destination, pas le réseau ou le site de la demande.
    const textScope = (eff.kind === 'signature' || intent.kind === 'connect_or_accept_offer') && intent.kind !== 'send_to_my_account';
    const named = chainsNamed(txt);
    // réseau visé : celui de la signature, sinon le réseau DEMANDÉ par une bascule ou un ajout de chaîne, sinon celui de la demande
    const switchTo = eff.kind === 'chain' && eff.raw && Number.isFinite(Number(eff.raw.chainId)) ? Number(eff.raw.chainId) : undefined;
    const target = signedChain !== undefined && Number.isFinite(signedChain) ? signedChain : switchTo !== undefined ? switchTo : reqChain;
    let chainWhy = null;
    if (signedChain !== undefined && Number.isFinite(signedChain) && Number.isFinite(reqChain) && reqChain > 0 && signedChain !== reqChain) chainWhy = `la signature vaut pour le réseau ${signedChain}, la demande est sur le réseau ${reqChain}`;
    else if (textScope && named.length === 1 && Number.isFinite(target) && target > 0 && !named[0].includes(target)) chainWhy = `tu as dit le réseau ${named[0][0]}, la demande vise le réseau ${target}`;
    if (chainWhy) { reasons.push({ code: 'chain_differs_from_intent', sev: value ? 'critical' : 'warn', said: 'Tu veux agir sur ce réseau', does: `En réalité, ${chainWhy}.` }); notes.push('F43:reseau_different'); }
    const origin = hostOfUrl(ctx.origin);
    const siweHosts = eff.siwe ? [String(eff.siwe.domain || '').toLowerCase(), hostOfUrl(eff.siwe.fields && eff.siwe.fields.URI)].filter(Boolean) : [];
    const sitesSaid = hostsNamed(intent.freeText);
    let siteWhy = null;
    if (origin && siweHosts.some((h) => !sameSite(h, origin))) siteWhy = `le message de connexion est pour ${siweHosts.find((h) => !sameSite(h, origin))}, la page est ${origin}`;
    else if (textScope && sitesSaid.length === 1 && [origin, ...siweHosts].filter(Boolean).some((h) => !sameSite(h, sitesSaid[0]))) siteWhy = `tu as dit ${sitesSaid[0]}, la demande vient de ${[origin, ...siweHosts].filter(Boolean).find((h) => !sameSite(h, sitesSaid[0]))}`;
    if (siteWhy) { reasons.push({ code: 'site_differs_from_intent', sev: 'critical', said: 'Tu veux agir sur ce site', does: `En réalité, ${siteWhy}.` }); notes.push('F43:site_different'); }
  }

  // ---- F41 : l'intention dit un mouvement de valeur (payer, échanger, envoyer) mais la demande est une signature qui ne déplace rien, n'accorde aucun droit et ne change aucun contrôle
  // (connexion, texte libre) : elle ne fait pas ce qui est dit. À confirmer (warn), jamais critical (rien ne part). Sans type d'intention la règle ne fait rien (monotone).
  if (isOn('F41') && intent && DETAIL_KINDS.has(intent.kind) && eff.kind === 'signature' && !eff.opaque && !eff.delegation
    && ![eff.outgoing, eff.incoming, eff.approvals, eff.controlChange, eff.nested].some((x) => (x || []).length)) {
    reasons.push({ code: 'request_moves_nothing', sev: 'warn', said: 'Tu veux déplacer des fonds', does: 'Cette demande ne déplace rien : elle ne fait pas ce que tu as dit.' });
    notes.push('F41:signature_sans_mouvement_vs_intention_de_valeur');
  }

  const floor = lvlOf(flags);
  let level = floor;
  const notIdentity = reasons.length !== (adem ? adem.reasons.length : 0) || reasons.some((r) => r.sev);
  if (adem) level = worst(floor, notIdentity ? ademLevel(reasons) : adem.level);
  // invariant (règle 6) : un cas opaque ou en panne n'est jamais 'ok'
  if ((eff.opaque || eff.unsupported) && level === 'ok') { level = 'warn'; notes.push('invariant_opaque'); }
  // opacity_only : le SEUL motif d'alerte est l'opacité (on n'a pas su décoder), sans aucune preuve d'effet ni écart d'intention. L'interface peut l'afficher discrètement ; le niveau reste warn (jamais ok).
  const evidence = flags.filter((f) => f.severity !== 'info' && !OPACITY_CODES.has(f.code));
  const reasonAlerts = reasons.filter((r) => (r.sev || sevOfReason(r.code)) !== 'info');
  const opacity_only = level === 'warn' && flags.some((f) => f.severity === 'warn' && OPACITY_CODES.has(f.code)) && evidence.length === 0 && reasonAlerts.length === 0;
  return { level, floorLevel: floor, reasons, notes, opacity_only };
}

// ---- Garde de monotonie (D-009) : ajouter de l'information d'intention ne baisse JAMAIS un verdict.
// `levelWithIntent` = niveau de la chaîne avec l'intention (type seul ou détaillée), `levelWithout` = niveau de la MÊME chaîne sans intention.
// Le résultat n'est jamais sous le second. Le comparateur et la politique ne font que monter par construction ; les couches posées après
// (détecteurs) lisent le type d'intention et peuvent, elles, rendre un cas moins sévère avec un type qu'avec rien : cette garde ferme ce trou.
// 'unknown' reste 'unknown' (non vérifié, jamais ok). Aucun 'ok' n'est produit ici.
export function monotoneGuard(levelWithIntent, levelWithout) {
  const R = { ok: 0, unknown: 0.5, warn: 1, critical: 2 }; // 'unknown' = non vérifié (orange) : au-dessus de ok, sous warn
  return (R[levelWithout] ?? 0) > (R[levelWithIntent] ?? 0) ? levelWithout : levelWithIntent;
}

// Couche de POLITIQUE : post-traitement du verdict du comparateur d'Adem (vendor, NON modifié) et du plancher du moteur,
// selon les RAISONS du comparateur et l'OPACITÉ / la complétude des effets décodés. Aucune lecture de label, d'id de cas ou d'adresse littérale.
// Chaque correctif est un interrupteur (engine/src/fixes.mjs) pour la mesure A/B.
import { isOn } from './src/fixes.js';

const RANK = { info: -1, ok: 0, warn: 1, critical: 2 };
const worst = (a, b) => (RANK[a] >= RANK[b] ? a : b);
const lvlOf = (flags) => flags.reduce((m, f) => worst(m, f.severity === 'info' ? 'ok' : f.severity), 'ok');
// sévérité de chaque raison du comparateur (compare.ts : escalate('warn') pour ces 4 codes, 'critical' pour tous les autres)
const WARN_CODES = new Set(['new_contract', 'high_balance_share', 'unlimited_approval_swap', 'low_confidence']);
const sevOfReason = (code) => (WARN_CODES.has(code) ? 'warn' : 'critical');
const ademLevel = (reasons) => reasons.reduce((m, r) => worst(m, r.sev || sevOfReason(r.code)), 'ok');

const ZERO_ADDR = '0x' + '0'.repeat(40);
const isKnownProtocol = (ctx, a) => !!a && (ctx.knownSpenders || []).includes(String(a).toLowerCase());

export function applyPolicy({ eff, adem, ctx, intent, request }) {
  const notes = [];
  let flags = eff.risk_flags.map((f) => ({ ...f }));
  let reasons = adem ? adem.reasons.map((r) => ({ ...r })) : [];
  const incomplete = !!eff.opaque || (eff.opaqueReasons || []).length > 0; // les effets reçus ne sont pas tous connus
  const drop = (code, why) => { const n = reasons.length; reasons = reasons.filter((r) => r.code !== code); if (reasons.length !== n) notes.push(why); };

  // ---- F1 : un appel dont on ne connaît pas les effets reçus ne prouve pas l'absence d'entrée : pas de no_incoming critical déduit.
  // Réserve : seulement si la cible est un protocole de la liste connue ; un contrat inconnu ET opaque ET payé garde la sévérité critical du comparateur.
  // (le plancher garde le warn d'opacité : le cas n'est jamais 'ok')
  if (isOn('F1') && (incomplete || ((isOn('F5') || isOn('F14')) && eff.service)) && (isKnownProtocol(ctx, eff.raw && eff.raw.to) || (isOn('F14') && eff.service && eff.service.trusted))) drop('no_incoming', 'F1:no_incoming_ignore_effets_incomplets');

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

  const floor = lvlOf(flags);
  let level = floor;
  const notIdentity = reasons.length !== (adem ? adem.reasons.length : 0) || reasons.some((r) => r.sev);
  if (adem) level = worst(floor, notIdentity ? ademLevel(reasons) : adem.level);
  // invariant (règle 6) : un cas opaque ou en panne n'est jamais 'ok'
  if ((eff.opaque || eff.unsupported) && level === 'ok') { level = 'warn'; notes.push('invariant_opaque'); }
  return { level, floorLevel: floor, reasons, notes };
}

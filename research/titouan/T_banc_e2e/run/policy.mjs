// Couche de POLITIQUE : post-traitement du verdict du comparateur d'Adem (vendor, NON modifié) et du plancher du moteur,
// selon les RAISONS du comparateur et l'OPACITÉ / la complétude des effets décodés. Aucune lecture de label, d'id de cas ou d'adresse littérale.
// Chaque correctif est un interrupteur (engine/src/fixes.mjs) pour la mesure A/B.
import { isOn } from '../engine/src/fixes.mjs';

const RANK = { info: -1, ok: 0, warn: 1, critical: 2 };
const worst = (a, b) => (RANK[a] >= RANK[b] ? a : b);
const lvlOf = (flags) => flags.reduce((m, f) => worst(m, f.severity === 'info' ? 'ok' : f.severity), 'ok');
// sévérité de chaque raison du comparateur (compare.ts : escalate('warn') pour ces 4 codes, 'critical' pour tous les autres)
const WARN_CODES = new Set(['new_contract', 'high_balance_share', 'unlimited_approval_swap', 'low_confidence']);
const sevOfReason = (code) => (WARN_CODES.has(code) ? 'warn' : 'critical');
const ademLevel = (reasons) => reasons.reduce((m, r) => worst(m, r.sev || sevOfReason(r.code)), 'ok');

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
  if (isOn('F1') && (incomplete || (isOn('F5') && eff.service)) && isKnownProtocol(ctx, eff.raw && eff.raw.to)) drop('no_incoming', 'F1:no_incoming_ignore_effets_incomplets');

  // ---- F2 : « première fois vu » n'a pas de sens pour un protocole/contrat de la liste connue (pont, routeur, collection) : c'est le point de passage, pas le bénéficiaire final.
  if (isOn('F2') && reasons.some((r) => r.code === 'first_seen_recipient')) {
    const unknownFirstSeen = (eff.counterparties || []).filter((cp) => cp.firstSeenByUser && !isKnownProtocol(ctx, cp.address));
    drop('first_seen_recipient', 'F2:first_seen_protocole_connu');
    for (const cp of unknownFirstSeen) reasons.push({ code: 'first_seen_recipient', said: '', does: cp.address });
  }

  // ---- F4 : une délégation EIP-7702 vers une implémentation de la liste connue (auditée) sur une chaîne précise n'est pas un abandon de compte à un inconnu :
  // warn (à confirmer) au lieu de critical. chain_id = 0 (toutes chaînes) et cible inconnue restent critical.
  if (isOn('F4') && eff.delegation && isKnownProtocol(ctx, eff.delegation.to) && !(eff.delegations || []).some((d) => d.chainId === 0 && String(d.to) !== '0x0000000000000000000000000000000000000000')) {
    const allKnown = (eff.delegations || []).filter((d) => String(d.to) !== '0x0000000000000000000000000000000000000000').every((d) => isKnownProtocol(ctx, d.to));
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

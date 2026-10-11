// Modele du verdict (sans DOM : charge aussi par les tests Node). Rien ici ne produit jamais de message "OK" ou "protege".
import { check, analyze, buildCtx, sanitizeLocalContext, emptyLocal, Unverifiable } from '../engine/sentinelle_core.js';
export { check, sanitizeLocalContext, emptyLocal };

// Niveau affiche. Le plus bas n'est PAS vert : "aucun signal trouve" + rappel que ce n'est pas une garantie.
export function displayLevel(v) {
  if (v.indeterminate || v.level === 'unknown') return { key: 'unknown', label: 'Vérification impossible', sentence: 'Hold up ne sait pas lire cette demande. Ce n’est pas un feu vert.' };
  if (v.level === 'manipulation') return { key: 'manipulation', label: 'Manipulation', sentence: 'Quelqu’un te met peut-être la pression. Prends ton temps.' };
  if (v.niveau === 'critical') return { key: 'danger', label: 'Danger', sentence: 'Ce n’est pas ce que tu as demandé.' };
  if (v.niveau === 'warn') return { key: 'attention', label: 'Attention', sentence: 'Quelque chose mérite d’être vérifié avant de continuer.' };
  return { key: 'info', label: 'Aucun signal trouvé', sentence: 'Ce n’est pas une garantie : Hold up avertit et ralentit, il ne protège pas.' };
}
// Friction : delai (secondes) avant de pouvoir "continuer quand meme". Annuler n'a jamais de delai. cfg = delai choisi par la personne.
export function frictionSeconds(key, cfg) {
  const c = Math.max(0, Math.min(120, Number(cfg) || 0));
  if (key === 'info') return 0;
  if (key === 'danger') return Math.max(c, 10);
  if (key === 'manipulation') return Math.max(c, 30); // le produit retient 10 min ; la demo raccourcit a 30 s
  return c;
}
export const withIntent = (body, intentKey) => (intentKey && intentKey !== 'none' ? { ...body, intent: intentKey } : { ...body });

const parseChain = (v) => { if (v === null || v === undefined || v === '') return undefined; try { const n = typeof v === 'number' ? v : (/^0x/i.test(String(v)) ? Number(BigInt(v)) : Number(v)); return Number.isFinite(n) && n >= 0 ? n : undefined; } catch (_) { return undefined; } };
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const sh = (a) => (typeof a === 'string' && a.length > 12 ? a.slice(0, 6) + '…' + a.slice(-4) : String(a));
// Ce que le moteur d'effets a decode (pour le panneau technique). Meme chaine que le verdict, sans l'intention. Ne leve jamais.
export function explain(body, localRaw) {
  try {
    const local = sanitizeLocalContext(localRaw);
    const params = Array.isArray(body.params) ? body.params : [];
    const a0 = params[0] && typeof params[0] === 'object' ? params[0] : {};
    const from = HEX20.test(String(body.from || '')) ? String(body.from).toLowerCase() : (HEX20.test(String(a0.from || '')) ? String(a0.from).toLowerCase() : undefined);
    const ctx = buildCtx(body, local, from, parseChain(body.chainId) ?? parseChain(a0.chainId));
    const { eff, pol } = analyze({ method: body.method, params }, ctx, null);
    const lines = [];
    for (const o of eff.outgoing || []) lines.push({ k: 'Sortie d’argent', v: `${o.amount} ${o.symbol} → ${sh(o.to)}` });
    for (const i of eff.incoming || []) lines.push({ k: 'Reçu', v: `${i.amount} ${i.symbol}` });
    for (const a of eff.approvals || []) lines.push({ k: 'Droit donné', v: `${a.amount === 'unlimited' ? 'illimité' : a.amount} sur ${sh(a.token)} à ${sh(a.spender)} (${a.via})` });
    for (const c of eff.controlChange || []) lines.push({ k: 'Contrôle du compte', v: `${c.type} sur ${sh(c.target)} → ${sh(c.subject)}` });
    if (eff.delegation) lines.push({ k: 'Délégation du compte', v: sh(eff.delegation.to) });
    for (const c of eff.counterparties || []) lines.push({ k: 'Adresse', v: `${sh(c.address)} · ${(c.roles || []).join(', ')}${c.firstSeenByUser ? ' · jamais utilisée par toi' : ''}${c.lookalikeOf ? ' · ressemble à ' + sh(c.lookalikeOf) : ''}` });
    if (eff.signature) lines.push({ k: 'Signature', v: eff.signature.kind + (eff.signature.primaryType ? ' (' + eff.signature.primaryType + ')' : '') });
    if (eff.opaque || (eff.opaqueReasons || []).length) lines.push({ k: 'Lisibilité', v: 'effets non tous connus : ' + ((eff.opaqueReasons || []).join(' ; ') || 'inconnu') });
    return { ok: true, lines, signals: (eff.risk_flags || []).map((f) => ({ code: f.code, severity: f.severity, detail: f.detail })), policyNotes: pol.notes || [], floor: pol.floorLevel };
  } catch (e) {
    return { ok: false, lines: [], signals: [], why: e instanceof Unverifiable ? e.message : String(e && e.message || e).slice(0, 160) };
  }
}

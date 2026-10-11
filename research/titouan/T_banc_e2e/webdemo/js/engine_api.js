// Fine couche entre la page et le moteur genere (engine/sentinelle_core.js). Meme garde-fous que le point d'entree de l'extension autonome :
// taille bornee, ne leve jamais, ne renvoie jamais 'ok' (le plus bas est 'info'), repli "verification impossible" si le moteur plante.
import { evaluate, MAX_BODY, FICHES, fill, buildCtx, decode, Unverifiable, applyExtraRules, parseChain, emptyLocal } from '../engine/sentinelle_core.js';
import { applyPolicy } from '../engine/policy.js';
export { emptyLocal, MAX_BODY };

const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const now_ms = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
export const ENGINE_NAME = 'sentinelle-local (moteur dans la page)';

// Contexte local OPTIONNEL (contacts, historique). Absent ou illisible = tout est "inconnu".
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

// Verdict d'attente : jamais ok, jamais rouge non plus.
export function indeterminate(why, ms = 0) {
  const t = Object.fromEntries(['croit', 'reel', 'danger', 'action'].map((k) => [k, fill(FICHES.F25[k], { jeton: 'jetons', montant: '' })]));
  return { level: 'unknown', niveau: 'warn', indeterminate: true, why, engine: ENGINE_NAME, fiche: 'F25', texts: t, reasons: [t.danger, t.action], raisons: [{ code: 'unverifiable', severity: 'warn', detail: why }],
    effects: { grants_right: false, funds_out: false }, risk_signals: [], latency_engine_ms: ms };
}

export function check(body, local) {
  const t0 = now_ms();
  let v;
  try {
    let size = 0;
    try { size = JSON.stringify(body === undefined ? null : body).length; } catch (_) { return indeterminate('requete illisible (non serialisable)'); }
    if (size > MAX_BODY) return indeterminate('requete trop volumineuse (' + size + ' octets, max ' + MAX_BODY + ')');
    if (!body || typeof body !== 'object' || Array.isArray(body)) return indeterminate('requete illisible');
    v = evaluate(body, local || emptyLocal());
  } catch (e) {
    v = indeterminate('erreur interne du moteur : ' + String(e && e.message || e).slice(0, 120));
  }
  if (!v || !['critical', 'warn', 'info'].includes(v.niveau) || !['attention', 'danger', 'manipulation', 'unknown'].includes(v.level)) v = indeterminate('verdict invalide');
  v.latency_ms = Math.round((now_ms() - t0) * 100) / 100;
  return v;
}

// Effets decodes (panneau technique) : meme chaine que evaluate(), sans intention. Peut lever (l'appelant attrape).
export function analyzeEffects(body, local) {
  const method = typeof body.method === 'string' ? body.method.slice(0, 80) : '';
  const params = Array.isArray(body.params) ? body.params : [];
  const a0 = params[0] && typeof params[0] === 'object' ? params[0] : {};
  const chainId = parseChain(body.chainId) ?? parseChain(a0.chainId);
  const from = HEX20.test(String(body.from || '')) ? lc(body.from) : (HEX20.test(String(a0.from || '')) ? lc(a0.from) : undefined);
  const ctx = buildCtx(body, local, from, chainId);
  if (!method) throw new Unverifiable('methode absente');
  const eff = decode(method, params, ctx, body);
  applyExtraRules(eff, { method, params }, ctx);
  const pol = applyPolicy({ eff, adem: null, ctx, intent: null, request: { method, params } });
  return { eff, pol };
}
export { Unverifiable };

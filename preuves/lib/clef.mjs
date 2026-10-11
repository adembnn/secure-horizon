// Bras « clef » : la phrase passe par la fonction classify() du VRAI relais du produit (research/demo_reelle/classifieur/relay.mjs),
// qui interroge Clef-flash avec les questions de extension/intent_text.js. Le banc n'ajoute qu'un cache, une cadence et un plafond.
//
// Cache : preuves/out/cache_clef.json. Clé = sha256 du corps JSON envoyé au modèle (modèle, phrase nettoyée, questions).
// Valeur = { answers, ms, tokens }. Le cache ne contient NI la phrase, NI la clé d'API, NI l'identifiant de compte.
// Grâce à lui, le banc se rejoue à l'identique sans clé et sans réseau, et une exécution interrompue reprend où le cache s'arrête.
// Plafond : 15 000 appels réels au total (chaque essai compte), comptés dans le cache, toutes exécutions confondues.
// Cadence : au plus DEBIT appels par seconde, tous fils confondus. Sur une limite de débit (HTTP 429) : le débit est divisé par
// deux (plancher 0,5 par seconde), l'appel attend 5 s, puis 10, 20, 40, 60 s (plafond), et réessaie sans limite de nombre, jusqu'à
// la durée maximale de l'exécution. Le débit remonte de 10 % toutes les 50 réponses réussies.
// Aucun arrêt silencieux : tout arrêt (plafond, durée, refus d'accès) est nommé dans etat().arret, écrit dans le journal et dans
// RESULTATS.json, avec le nombre de phrases restées sans réponse.
// La clé est lue dans l'environnement (node --env-file=.env), jamais affichée, jamais écrite.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { ACTIF } from './decideur.mjs';

export const PLAFOND = 15000;
export const MODELE = 'clef-flash';
export const BUDGET_PRODUIT_MS = 1500; // budget du relais dans le produit : au-delà, le produit se replie sur les mots-clés
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

export async function creerClef({ cachePath, env = process.env, concurrence = 6, debit = 4, journal = () => {}, dureeMaxMs = 45 * 60000 }) {
  const depart = performance.now();
  const relay = await import(pathToFileURL(ACTIF.relais).href);
  const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : { modele: MODELE, appels_reels: 0, erreurs: 0, limites_de_debit: 0, reponses: {} };
  const cleDispo = Boolean(env.CF_ACCOUNT_ID && env.CF_API_TOKEN);
  const envAppel = cleDispo ? Object.assign({}, env, { HOLDUP_CLEF_MODEL: MODELE, HOLDUP_INTENT_PROVIDER: 'clef' }) : { CF_ACCOUNT_ID: 'cache-seul', CF_API_TOKEN: 'cache-seul', HOLDUP_CLEF_MODEL: MODELE, HOLDUP_INTENT_PROVIDER: 'clef' };
  const fetchReel = globalThis.fetch;
  let arret = null, session = 0, sale = false, parSeconde = debit, prochain = 0, reussis = 0;
  const sauver = () => { if (sale) { writeFileSync(cachePath, JSON.stringify(cache)); sale = false; } };
  // cadence commune à tous les fils : chaque appel réserve le prochain créneau
  const creneau = async () => { const now = performance.now(), t = Math.max(now, prochain); prochain = t + 1000 / parSeconde; if (t > now) await pause(t - now); };
  // fetch donné au client Clef du produit : cache d'abord ; sinon appel réel si une clé existe et si le plafond le permet.
  const fetchImpl = (reseau) => async (url, init) => {
    const k = createHash('sha256').update(init.body).digest('hex');
    const hit = cache.reponses[k];
    if (hit) return { ok: true, status: 200, json: async () => ({ answers: hit.answers, usage: hit.tokens != null ? { input_tokens: hit.tokens } : null }), _ms: hit.ms };
    if (!reseau || !cleDispo || arret) throw new Error('hors cache');
    let res, data, ms;
    for (let essai = 0; ; essai++) {
      if (arret) throw new Error('arrêt');
      if (performance.now() - depart > dureeMaxMs) { arret = 'durée maximale de l\'exécution atteinte : relancer la même commande, elle reprend où le cache s\'arrête'; throw new Error('durée'); }
      if (cache.appels_reels >= PLAFOND) { arret = 'plafond de ' + PLAFOND + ' appels atteint'; throw new Error('plafond'); }
      await creneau();
      cache.appels_reels++; session++; sale = true;
      const t0 = performance.now();
      try { res = await fetchReel(url, init); } catch (e) { res = { ok: false, status: 0 }; }
      data = null; try { data = await res.json(); } catch { /* corps non JSON */ }
      ms = Math.round(performance.now() - t0);
      if (res.status === 429 || res.status === 0 || res.status >= 500) { // limite de débit ou panne passagère : ralentir, attendre, réessayer
        cache.limites_de_debit = (cache.limites_de_debit || 0) + 1;
        parSeconde = Math.max(0.5, parSeconde / 2);
        const attente = Math.min(60000, 5000 * 2 ** Math.min(essai, 4));
        if (essai === 0 || essai % 3 === 0) journal(`  clef : HTTP ${res.status}, débit ramené à ${parSeconde.toFixed(2)}/s, attente ${attente / 1000} s (essai ${essai + 1})`);
        await pause(attente);
        continue;
      }
      break;
    }
    const body = data && data.result && data.result.answers ? data.result : data;
    if (!res.ok || !body || !body.answers) { cache.erreurs++; if (res.status === 401 || res.status === 403) arret = 'accès refusé par l\'API (HTTP ' + res.status + ')'; return { ok: false, status: res.status, json: async () => ({}) }; }
    const u = body.usage || {};
    cache.reponses[k] = { answers: body.answers, ms, tokens: u.input_tokens ?? u.prompt_tokens ?? null };
    if (++reussis % 50 === 0) parSeconde = Math.min(debit, parSeconde * 1.1);
    return { ok: true, status: 200, json: async () => ({ answers: body.answers, usage: body.usage || null }), _ms: ms };
  };
  // -> { raw, ms } quand le modèle a répondu (cache ou réseau), { absent: true } sinon. Une absence n'est jamais une décision.
  async function classer(texte, reseau) {
    let ms = null;
    const f = fetchImpl(reseau);
    const raw = await relay.classify(texte, { env: envAppel, budgetMs: 10 * 60000, fetchImpl: async (u, i) => { const r = await f(u, i); ms = r._ms ?? null; return r; } });
    if (!raw || raw.model !== true) return { absent: true };
    return { raw, ms };
  }
  // Remplit le cache pour une liste de phrases (dédoublonnées), dans l'ordre donné. Reprend où le cache s'arrête.
  async function prechauffer(textes) {
    const uniques = [...new Set(textes.filter((t) => typeof t === 'string' && t.trim()))];
    let i = 0, faits = 0, absents = 0;
    const worker = async () => { while (i < uniques.length && !arret) { const t = uniques[i++]; const r = await classer(t, true); if (r.absent) absents++; else faits++; if (session && session % 200 === 0) { sauver(); journal(`  clef : ${faits}/${uniques.length} phrases, ${cache.appels_reels} appels au total, débit ${parSeconde.toFixed(2)}/s`); } } };
    await Promise.all(Array.from({ length: concurrence }, worker));
    sauver();
    const restantes = uniques.length - faits;
    if (arret) journal(`  clef : ARRÊT (${arret}) ; ${restantes} phrases restent sans réponse`);
    return { phrases: uniques.length, repondues: faits, absentes: restantes, arret };
  }
  return { classer: (t) => classer(t, false), prechauffer, cleDispo, etat: () => ({ modele: MODELE, cle_presente: cleDispo, appels_reels_total: cache.appels_reels, appels_reels_execution: session, erreurs: cache.erreurs, attentes_pour_limite_de_debit: cache.limites_de_debit || 0, reponses_en_cache: Object.keys(cache.reponses).length, plafond: PLAFOND, cadence: `au plus ${debit} appels par seconde, ${concurrence} fils`, arret }),
    latences: () => Object.values(cache.reponses).map((r) => r.ms).filter((x) => Number.isFinite(x)), tokens: () => Object.values(cache.reponses).map((r) => r.tokens).filter((x) => Number.isFinite(x)) };
}

// Le décideur RÉEL du produit, piloté sans navigateur.
//
// Ce qui tourne ici est le service worker de l'extension livrée, sans une ligne réécrite :
//   research/titouan/T_banc_e2e/extension_standalone/extension/background.js
//     -> engine/sentinelle_core.js  check()            plancher : décodage, règles, comparateur du moteur embarqué
//     -> gatekeeper.js              onGate(), decide(), understand(), judgeWithIntent()
//     -> intent_text.js             keywordClassify(), interpret(), extractFields()     lecture de la phrase
//     -> written_check.js           writtenCheck(), operationCheck(), limitPlan()       phrase contre demande
//     -> outcome.js                 outcomeOf()        les trois réponses : match / mismatch / unverifiable
//     -> classifier_client.js       classifyViaRelay() appel au relais local 127.0.0.1:8789
// Le banc remplace seulement : chrome.* (stockage, fenêtres, messages : objets en mémoire), l'horloge (instant fixe), et le saut
// HTTP vers le relais. Avec le bras « clef », ce saut appelle en mémoire la fonction classify() du vrai relais
// (research/demo_reelle/classifieur/relay.mjs) ; avec le bras « mots », le relais est absent et le produit se replie de lui-même
// sur ses mots-clés, comme dans le build sans réseau.
//
// Ce que le banc NE fait PAS tourner : inject.js et bridge.js (interception dans la page), la fenêtre (ui/), la simulation d'effet
// sur le nœud du portefeuille (effect_sim.js : aucun nœud ici, la lecture échoue et le produit continue sans mesure).
import { pathToFileURL } from 'node:url';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, statSync, readFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
export const RACINE = resolve(HERE, '..', '..');
export const DIR_PRODUIT = join(RACINE, 'research', 'titouan', 'T_banc_e2e', 'extension_standalone', 'extension');
export const RELAIS = join(RACINE, 'research', 'demo_reelle', 'classifieur', 'relay.mjs');
export const CLEF_CLIENT = join(RACINE, 'research', 'titouan', 'T_banc_e2e', 'detectors_adem', 'clef_client.mjs');
export const INSTANT = 1791700000000; // horloge figée du banc (11 oct. 2026), avancée d'une seconde à chaque étape
// Méthodes que la page intercepte (extension/inject.js, constante GATED, lignes 189 à 195). Toute autre méthode n'arrive jamais au
// décideur : elle passe au portefeuille sans fenêtre. Le banc la compte « non interceptée ».
export const GATED = new Set(['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4',
  'wallet_sendCalls', 'eth_sendRawTransaction', 'wallet_addEthereumChain', 'wallet_grantPermissions', 'wallet_requestSnaps', 'eth_decrypt', 'eth_getEncryptionPublicKey', 'eth_sendUserOperation', 'eth_signUserOperation']);

// Le code réellement chargé par le banc. Par défaut les fichiers vivants ; après figer(), une copie figée sous preuves/out/instantane/.
export const ACTIF = { dir: DIR_PRODUIT, relais: RELAIS, instantane: null };
// D'autres agents modifient le produit pendant les mesures. Pour qu'une mesure porte sur UN état du code, le banc copie d'abord le
// build et le relais (avec les deux fichiers de extension/ que le relais importe) dans preuves/out/instantane/<empreinte>/, en
// gardant l'arborescence du dépôt, puis ne charge que cette copie. « --instantane=<empreinte> » rejoue un état déjà copié.
export function figer(empreinteVoulue = null) {
  const base = join(RACINE, 'preuves', 'out', 'instantane');
  let fp = empreinteVoulue;
  if (!fp) {
    const e = empreinteDecideur(); fp = e.sha256.slice(0, 16);
    const dst = join(base, fp);
    if (!existsSync(join(dst, 'COMPLET'))) {
      const files = [];
      const walk = (d) => { for (const n of readdirSync(d).sort()) { const q = join(d, n); if (statSync(q).isDirectory()) walk(q); else files.push(q); } };
      walk(DIR_PRODUIT);
      files.push(RELAIS, CLEF_CLIENT, join(RACINE, 'research', 'demo_reelle', 'classifieur', 'jev_client.mjs'), join(RACINE, 'research', 'titouan', 'T_banc_e2e', 'extension', 'intent_text.js'), join(RACINE, 'research', 'titouan', 'T_banc_e2e', 'extension', 'keyword_intent.js'));
      for (const f of files) { const to = join(dst, f.slice(RACINE.length + 1)); mkdirSync(dirname(to), { recursive: true }); copyFileSync(f, to); }
      // la copie doit avoir l'empreinte calculée avant la copie : sinon un fichier a changé pendant la copie
      const apres = empreinteDecideur(join(dst));
      if (apres.sha256 !== e.sha256) throw new Error('le code a changé pendant la copie : relancer');
      mkdirSync(dst, { recursive: true }); copyFileSync(join(RACINE, 'preuves', 'lib', 'decideur.mjs'), join(dst, 'COMPLET'));
    }
  }
  const dst = join(base, fp);
  if (!existsSync(join(dst, 'COMPLET'))) throw new Error('instantané introuvable : ' + fp);
  ACTIF.dir = join(dst, 'research', 'titouan', 'T_banc_e2e', 'extension_standalone', 'extension');
  ACTIF.relais = join(dst, 'research', 'demo_reelle', 'classifieur', 'relay.mjs');
  ACTIF.instantane = 'preuves/out/instantane/' + fp;
  return Object.assign(empreinteDecideur(dst), { instantane: ACTIF.instantane });
}
// Empreinte de tout le code du décideur (fichiers .js et .json du build, plus le relais, le client Clef et les deux fichiers de
// extension/ que le relais importe). racine : le dépôt, ou un instantané.
export function empreinteDecideur(racine = RACINE) {
  const DIR_PRODUIT = join(racine, 'research', 'titouan', 'T_banc_e2e', 'extension_standalone', 'extension');
  const RELAIS = join(racine, 'research', 'demo_reelle', 'classifieur', 'relay.mjs'), CLEF_CLIENT = join(racine, 'research', 'titouan', 'T_banc_e2e', 'detectors_adem', 'clef_client.mjs');
  const RACINE = racine;
  const files = [];
  const walk = (d) => { for (const n of readdirSync(d).sort()) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (/\.(js|json|mjs)$/.test(n) && n !== 'BUILD_INFO.json') files.push(p); } };
  walk(DIR_PRODUIT); files.push(RELAIS, CLEF_CLIENT, join(racine, 'research', 'titouan', 'T_banc_e2e', 'extension', 'intent_text.js'), join(racine, 'research', 'titouan', 'T_banc_e2e', 'extension', 'keyword_intent.js'));
  const h = createHash('sha256'), detail = {};
  for (const f of files) { const s = createHash('sha256').update(readFileSync(f)).digest('hex'); const rel = f.slice(RACINE.length + 1).replace(/\\/g, '/'); detail[rel] = s; h.update(rel + '\0' + s + '\n'); }
  return { sha256: h.digest('hex'), fichiers: files.length, detail };
}

const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
function area(data) {
  return {
    get: async (k) => { if (k == null) return clone(data); const out = {}; for (const key of (Array.isArray(k) ? k : [k])) if (key in data) out[key] = clone(data[key]); return out; },
    set: async (o) => { for (const key of Object.keys(o)) data[key] = clone(o[key]); },
    remove: async (k) => { for (const key of (Array.isArray(k) ? k : [k])) delete data[key]; },
  };
}

// classify : null (bras « mots » : relais absent) ou async (texte) -> { raw } | { absent: true } (bras « clef »)
export async function creerDecideur({ classify = null } = {}) {
  const S = { local: {}, session: {}, windows: new Map(), next: 100 };
  const L = { message: [] };
  const ev = (name) => ({ addListener: (fn) => { (L[name] = L[name] || []).push(fn); } });
  const EXT = 'chrome-extension://bancpreuvesholdupfauxidentifiant/';
  let T = INSTANT;
  const realNow = Date.now;
  Date.now = () => T;
  globalThis.chrome = {
    runtime: { id: 'bancpreuves', getURL: (p) => EXT + p, onMessage: ev('message'), onStartup: ev('startup'), sendMessage: async () => {}, getManifest: () => ({ version: 'banc' }) },
    storage: { local: area(S.local), session: area(S.session) },
    windows: { create: async (o) => { const id = S.next++; S.windows.set(id, o); return { id }; }, get: async (id) => { if (!S.windows.has(id)) throw new Error('aucune fenêtre'); return { id, left: 0, top: 0, width: 1200, height: 800 }; }, remove: async (id) => { S.windows.delete(id); }, onRemoved: ev('windowRemoved') },
    tabs: { sendMessage: async () => undefined, onRemoved: ev('tabRemoved') }, // aucun nœud : toute lecture relayée échoue tout de suite
    alarms: { create: () => {}, clear: async () => true, onAlarm: ev('alarm') },
  };
  // Seul réseau permis : le saut vers le relais local, servi en mémoire. Tout autre appel est refusé.
  let dernier = null;
  const fetchReel = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url) !== 'http://127.0.0.1:8789/classify') throw new Error('réseau interdit par le banc : ' + String(url).slice(0, 60));
    if (!classify) throw new Error('relais absent (bras mots)');
    const { text } = JSON.parse(init.body);
    const r = await classify(text);
    dernier = r;
    if (!r || r.absent) throw new Error('réponse Clef absente du cache');
    return { ok: true, json: async () => r.raw };
  };
  const mod = await import(pathToFileURL(join(ACTIF.dir, 'background.js')).href + '?banc=' + (classify ? 'clef' : 'mots'));
  if (!mod.gatekeeper) throw new Error('background.js n\'exporte pas gatekeeper');
  const send = (msg, sender) => new Promise((res) => { let asyncAns = false; for (const fn of L.message) if (fn(clone(msg), sender, res) === true) asyncAns = true; if (!asyncAns) res(undefined); });

  let n = 0;
  // Une paire -> ce que la personne verrait. contexte : null (installation par défaut) ou l'objet « contexte » du stockage local.
  async function juger({ request, chainId, from, origin, phrase }, contexte = null) {
    n++; T += 1000; dernier = null;
    for (const k of Object.keys(S.session)) delete S.session[k];
    for (const k of Object.keys(S.local)) delete S.local[k];
    S.windows.clear();
    if (contexte) S.local.contexte = clone(contexte);
    const method = request.method;
    if (!GATED.has(method)) return { issue: 'non_intercepte', method, ms: 0 };
    const rid = 'banc-' + String(n).padStart(10, '0'), tabId = 1000 + n;
    const page = { id: 'bancpreuves', origin, url: origin + '/', frameId: 0, tab: { id: tabId, windowId: 1 } };
    const t0 = performance.now();
    const g = await send({ type: 'gate', rid, payload: { kind: 'gate', method, params: request.params, chainId, from } }, page);
    const tGate = performance.now() - t0;
    if (!g || g.done) return { issue: g && g.allow ? 'sans_question' : 'refuse', raison: g && g.reason, method, ms: tGate, ms_plancher: tGate };
    let winId = null; for (const [id, o] of S.windows) if (o.url.endsWith('#' + rid)) winId = id;
    const win = { id: 'bancpreuves', origin: EXT.slice(0, -1), url: EXT + 'window.html#' + rid, frameId: 0, tab: { id: 9000, windowId: winId } };
    let view = (await send({ type: 'hu.view', rid }, win) || {}).view;
    if (!view) return { issue: 'erreur_banc', raison: 'aucune vue', method, ms: tGate };
    let question = false, relance = false, tDecide = 0;
    if (view.stage === 'intent') {
      question = true;
      if (typeof phrase !== 'string' || !phrase.trim()) return { issue: 'sans_phrase', method, ms: tGate };
      for (let tour = 0; tour < 2 && view.stage === 'intent'; tour++) {
        T += 1000;
        const t1 = performance.now();
        const r = await send({ type: 'hu.decision', rid, seq: view.seq, decision: 'answer', text: phrase }, win);
        tDecide += performance.now() - t1;
        if (!r || r.status !== 'next') return { issue: 'erreur_banc', raison: 'réponse ' + (r && r.status), method, ms: tGate + tDecide };
        view = r.view; if (view.stage === 'intent') relance = true;
      }
    }
    const rec = S.session['hu:req:' + rid] || {};
    const v = rec.verdict || {}, it = rec.intent || null, sc = view.screen || {};
    return {
      issue: sc.outcome || 'erreur_banc', question, relance,
      // Le produit a réécrit la demande elle-même (droit ramené au montant écrit) : ce qui part au portefeuille n'est plus la demande du site.
      corrige: !!(rec.rewrite && Array.isArray(rec.rewrite.params) && v.written && v.written.limited), method, ligne: sc.line || null, correction: sc.fix || null,
      niveau: v.level, codes: Array.isArray(v.codes) ? v.codes : [], fiche: v.fiche || null, indetermine: !!v.indeterminate, pourquoi: v.why || null,
      contradiction_moteur: !!v.intent_contradiction, ecrit: v.written ? { issue: v.written.outcome, ligne: v.written.line || null } : null, allege: !!v.relief,
      raisons_moteur: (v.raisons || []).filter((r) => r.said || r.does).map((r) => r.code),
      lu: it ? { clair: !!it.clear, vague: !!it.vague, genre: it.kind || null, source: it.source, modele: !!it.model, montant: it.amount || null, symbole: it.symbol || null, adresse: it.address ? true : false, nomme: !!it.named, faits: it.facts || null } : null,
      attente_ms: rec.friction ? rec.friction.waitMs : null,
      clef: dernier ? { absent: !!dernier.absent, ms: dernier.ms ?? null, repli: dernier.raw ? dernier.raw.model !== true : null } : null,
      ms: Math.round((tGate + tDecide) * 100) / 100, ms_plancher: Math.round(tGate * 100) / 100, ms_decision: Math.round(tDecide * 100) / 100,
    };
  }
  return { juger, fermer: () => { Date.now = realNow; globalThis.fetch = fetchReel; delete globalThis.chrome; } };
}

// Quelle branche du produit a produit la réponse (même ordre que outcome.js, outcomeOf).
export function signalDe(r) {
  if (r.issue === 'non_intercepte') return 'non intercepté : méthode hors de la liste GATED de inject.js, la demande va au portefeuille sans fenêtre';
  if (r.issue === 'sans_question') return 'gatekeeper.js signIn() : message de connexion reconnu, aucune fenêtre';
  if (r.issue === 'refuse') return 'gatekeeper.js : demande refusée (' + r.raison + ')';
  if (r.issue === 'sans_phrase' || r.issue === 'erreur_banc') return r.issue + (r.raison ? ' : ' + r.raison : '');
  const lu = r.lu;
  if (r.issue === 'unverifiable') {
    if (r.niveau === 'unknown' && r.indetermine) return 'moteur : effets non lisibles (' + (r.pourquoi || 'inconnu') + ')' + (r.ecrit ? ' ; written_check : ' + r.ecrit.issue : '');
    if (!r.question) return 'aucune question posée : niveau « unknown » dès le plancher';
    if (lu && !lu.clair) return `intent_text.js : phrase non comprise (source ${lu.source}, genre absent)`;
    if (lu && lu.vague) return 'gatekeeper.js : phrase trop vague après la relance (relance(intent) non nulle)';
    if (r.ecrit && r.ecrit.issue === 'unverifiable') return 'written_check.js : « ' + (r.ecrit.ligne || '') + ' »';
    return 'niveau « unknown » (' + (r.pourquoi || 'sans motif') + ')';
  }
  if (r.issue === 'mismatch') {
    if (r.ecrit && r.ecrit.issue === 'mismatch') return 'written_check.js : « ' + (r.ecrit.ligne || '') + ' »';
    if (r.niveau === 'manipulation') return 'moteur : niveau manipulation, codes ' + r.codes.join(',');
    if (r.niveau === 'danger') return 'plancher du moteur : niveau danger, codes ' + (r.codes.join(',') || 'aucun') + (r.contradiction_moteur ? ' ; comparateur : ' + r.raisons_moteur.join(',') : '');
    if (r.contradiction_moteur) return 'comparateur du moteur (intent_contradiction) : ' + r.raisons_moteur.join(',');
    return 'mismatch sans branche identifiée';
  }
  if (r.issue === 'match' && r.corrige) return 'written_check.js limitPlan() : écart vu et corrigé dans la demande (« ' + (r.ligne || r.correction || '') + ' »)';
  if (r.issue === 'match') return `aucun signal : niveau ${r.niveau}, phrase lue « ${lu ? lu.genre : '?'} » (source ${lu ? lu.source : '?'})${r.ecrit ? ', written_check : ' + r.ecrit.issue : ', written_check sans avis'}${r.codes.length ? ', codes ' + r.codes.join(',') : ''}`;
  return String(r.issue);
}

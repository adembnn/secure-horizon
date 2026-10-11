// Harnais des essais : appelle le VRAI décideur de l'extension autonome (gatekeeper.js + written_check.js + outcome.js + effect_sim.js
// + moteur embarqué engine/sentinelle_core.js), sans navigateur. chrome.* est simulé par le faux chrome des tests unitaires du produit
// (importé en lecture seule). La phrase est classée par le chemin mots-clés embarqué (pas de relais Clef / Jev : aucun réseau).
// Rien n'est écrit hors de preuves/exhaustivite/.
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const BENCH = resolve(HERE, '..', '..', '..', 'research', 'titouan', 'T_banc_e2e');
export const EXT = join(BENCH, 'extension_standalone', 'extension'); // le build livré (fichiers partagés identiques à extension/)
const imp = (p) => import(pathToFileURL(p).href);
const { makeChrome, fakeClock } = await imp(join(BENCH, 'extension', 'tests', 'unit', 'fake_chrome.mjs'));
const { createGatekeeper } = await imp(join(EXT, 'gatekeeper.js'));
const core = await imp(join(EXT, 'engine', 'sentinelle_core.js'));
export const W = await imp(join(EXT, 'written_check.js'));
export const O = await imp(join(EXT, 'outcome.js'));
export const I = await imp(join(EXT, 'intent_text.js'));
export const ABI = await imp(join(BENCH, 'engine', 'src', 'abi_encode.mjs'));
export const call = ABI.call;
// Deux moteurs réels derrière le même décideur (gatekeeper.js est partagé) :
//   'embarque' : engine/sentinelle_core.js du build autonome livré (aucun serveur) ;
//   'serveur'  : pipeline/evaluate_plus.mjs, appelé comme le fait server/server.mjs (détecteurs actifs, AUCUNE lecture du réseau : live = false).
const { evaluatePlus } = await imp(join(BENCH, 'pipeline', 'evaluate_plus.mjs'));
const local4 = (c) => { const l = core.sanitizeLocalContext(c); return l; };
export const MOTEURS = {
  embarque: async (body, contexte) => core.check(body, local4(contexte)),
  serveur: async (body, contexte) => evaluatePlus(body, local4(contexte), { live: false })
};

export const CHAIN = '0xa86a'; // Avalanche C-Chain (43114)
export const ME = '0x' + 'a1'.repeat(20);
export const OTHER = '0x' + 'e9'.repeat(20);   // une adresse tierce
export const FRIEND = '0x' + 'b2'.repeat(20);  // le destinataire écrit dans la phrase
export const ROUTER = '0x' + '70'.repeat(20);  // un routeur (adresse synthétique)
export const USDC = '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'; // USDC Avalanche (liste intégrée)
export const USDT = '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7';
export const WAVAX = '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7';
export const FAKE = '0x' + 'fa'.repeat(20);    // un jeton inconnu
export const NFT = '0x' + '9f'.repeat(20);     // une collection (adresse synthétique)
export const PERMIT2 = '0x000000000022d473030f116ddee9f6b43ac78ba3';
export const u = (n, d = 6) => BigInt(Math.round(n * 1e6)) * 10n ** BigInt(d) / 1000000n;
export const MAX = 2n ** 256n - 1n;
export const hex = (v) => '0x' + BigInt(v).toString(16);
export const tx = (to, data, value, extra) => ({ method: 'eth_sendTransaction', params: [Object.assign({ from: ME, to, data: data || '0x' }, value ? { value: hex(value) } : {}, extra || {})] });
export const typed = (td) => ({ method: 'eth_signTypedData_v4', params: [ME, JSON.stringify(td)] });

let n = 0;
// Une demande + une phrase -> ce que la fenêtre affiche. contexte : contexte local facultatif (routeur connu, jetons).
// sim : faux noeud (method, params) -> résultat, pour les essais qui passent par la simulation (effect_sim.js).
export async function essai({ req, text, contexte = null, origin = 'https://app.exemple.org', sim = null, chainId = CHAIN, moteur = process.env.MOTEUR || 'serveur' }) {
  const clock = fakeClock(); const F = makeChrome(); globalThis.chrome = F.chrome;
  try {
    if (contexte) await F.chrome.storage.local.set({ contexte });
    if (sim) F.chrome.tabs.sendMessage = async (tabId, msg) => { if (!msg || msg.type !== 'hu.rpc') return undefined; try { return { ok: true, result: await sim(msg.method, msg.params) }; } catch (_) { return { ok: false }; } };
    const seen = [];
    const check = async (body) => { const v = await MOTEURS[moteur](body, (await F.chrome.storage.local.get('contexte')).contexte); seen.push(v); return v; };
    createGatekeeper({ check });
    const rid = 'rid-exh-' + String(++n).padStart(5, '0'), page = F.page(100 + n, origin);
    const g = await F.send({ type: 'gate', rid, payload: Object.assign({ kind: 'gate', chainId, from: ME }, req) }, page);
    if (g && g.done) return { gate: g.allow ? 'LAISSÉ PASSER SANS FENÊTRE' : 'REFUSÉ (' + g.reason + ')' };
    const winId = [...F.state.windows].find(([, o]) => o.url.endsWith('#' + rid));
    const win = F.win(winId ? winId[0] : 100, rid);
    let view = (await F.send({ type: 'hu.view', rid }, win)).view;
    const out = { stage0: view.stage, floor: seen[0] ? seen[0].level : null, floorCodes: seen[0] ? (seen[0].codes || []) : [] };
    if (view.stage === 'intent') {
      clock.advance(1000);
      let r = await F.send({ type: 'hu.decision', rid, seq: view.seq, decision: 'answer', text }, win);
      if (r.status === 'next' && r.view.stage === 'intent') { out.relance = r.view.screen.title; clock.advance(1000); r = await F.send({ type: 'hu.decision', rid, seq: r.view.seq, decision: 'answer', text }, win); }
      if (r.status !== 'next') return Object.assign(out, { erreur: 'statut ' + r.status });
      view = r.view;
    } else out.sansQuestion = true;
    const s = view.screen, v = view.verdict || {};
    return Object.assign(out, { outcome: s.outcome, headline: s.headline, line: s.line, fix: s.fix || undefined, level: v.level, codes: v.codes || [], waitMs: view.friction ? view.friction.waitMs : undefined, auto: s.autoMs ? true : undefined, written: v.written ? v.written.outcome : undefined });
  } finally { clock.restore(); delete globalThis.chrome; }
}
export const FR = { match: 'CORRESPOND', mismatch: 'NE CORRESPOND PAS', unverifiable: 'PAS PU VÉRIFIER' };
export const court = (r) => (r.gate ? r.gate : (FR[r.outcome] || r.outcome || r.erreur) + (r.sansQuestion ? ' (sans question)' : '') + ' | « ' + (r.line || '') + ' » | niveau=' + r.level + ' codes=' + (r.codes || []).join(',') + (r.relance ? ' | relance: ' + r.relance : '') + (r.fix ? ' | correction: ' + r.fix : '') + (r.auto ? ' | passe seul après 1 s' : r.waitMs ? ' | attente ' + r.waitMs / 1000 + ' s' : ''));
// Contexte local d'une personne qui a déclaré son routeur (réglages) : sert à montrer le meilleur cas.
export const CTX = { contacts: [], history: [], protected: [], knownSpenders: [ROUTER], tokens: [] };

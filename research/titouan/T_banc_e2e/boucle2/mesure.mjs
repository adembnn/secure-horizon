// boucle2 : mesure d'un jeu de paires par le décideur RÉEL de l'extension (sources vivantes : extension/gatekeeper.js, written_check.js,
// intent_text.js, outcome.js ; moteur serveur pipeline/evaluate_plus.mjs sans réseau). Deux bras : « mots » (mots-clés) et « clef » (Clef-flash
// classe la phrase, le code compare ; cache par empreinte de la phrase ; lancer avec node --env-file=.env depuis la racine du dépôt).
//   node mesure.mjs --jeu=reglage --bras=mots --tag=t0
//   node mesure.mjs --jeu=controle --final          (UNE seule fois par bras : pose CONTROLE_OUVERT_<bras>.lock)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { essai } from './harnais.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const jeu = arg('jeu', 'reglage'), bras = arg('bras', 'mots'), tag = arg('tag', 'essai'), final = process.argv.includes('--final');
const file = jeu === 'controle' ? 'CONTROLE.jsonl' : jeu === 'reglage' ? 'REGLAGE.jsonl' : null;
if (!file) throw new Error('jeu inconnu');
if (jeu === 'controle') {
  if (!final) throw new Error('le contrôle scellé ne se mesure qu’avec --final, une seule fois');
  const lock = join(HERE, 'CONTROLE_OUVERT_' + bras + '.lock');
  if (existsSync(lock)) throw new Error('contrôle déjà mesuré pour ce bras : ' + lock);
  const sha = createHash('sha256').update(readFileSync(join(HERE, file))).digest('hex');
  if (!readFileSync(join(HERE, 'CONTROLE_SHA256.txt'), 'utf8').startsWith(sha)) throw new Error('empreinte du contrôle différente du scellé');
  writeFileSync(lock, new Date().toISOString() + ' ' + sha + '\n', { flag: 'wx' });
}
const rows = readFileSync(join(HERE, file), 'utf8').trim().split('\n').map(JSON.parse);
// ---- bras Clef : classify() du relais, appelée en mémoire, cache par empreinte de la phrase
let classify = null; const st = { appels: 0, cache: 0, absents: 0 };
if (bras === 'clef') {
  const cacheFile = join(HERE, 'out', 'cache_clef.json'); mkdirSync(join(HERE, 'out'), { recursive: true });
  const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};
  const R = await import(pathToFileURL(join(HERE, '..', '..', '..', 'demo_reelle', 'classifieur', 'relay.mjs')).href);
  const key = (t) => createHash('sha256').update('clef-flash|' + t).digest('hex');
  const phrases = [...new Set(rows.map((r) => r.phrase))].filter((t) => !cache[key(t)]);
  let i = 0;
  await Promise.all(Array.from({ length: 3 }, async () => { while (i < phrases.length) { const t = phrases[i++]; for (let k = 0; k < 2; k++) { const r = await R.classify(t, { budgetMs: 8000 }); st.appels++; if (r && r.model === true) { cache[key(t)] = { source: r.source, model: true, kind: r.kind, confidence: r.confidence, facts: r.facts }; break; } } } }));
  writeFileSync(cacheFile, JSON.stringify(cache));
  classify = async (t) => { const c = cache[key(t)]; if (c) { st.cache++; return c; } st.absents++; return null; };
}
const res = [];
for (const r of rows) {
  let o; try { o = await essai({ req: r.request, text: r.phrase, contexte: r.contexte, origin: r.origin, chainId: r.chainId, classify }); } catch (e) { o = { erreur: 'exception : ' + String(e && e.message || e).slice(0, 160) }; }
  const issue = o.gate ? (o.gate.startsWith('LAISS') ? 'sans_fenetre' : 'refuse') : o.erreur ? 'erreur' : o.outcome;
  res.push({ id: r.id, scenario: r.scenario, dimension: r.dimension, verite: r.verite, etiquette: r.etiquette, phrase: r.phrase, routeur: r.routeur, issue, line: o.line || null, level: o.level || null, codes: o.codes || [], written: o.written || null, relance: o.relance || null, sansQuestion: !!o.sansQuestion, erreur: o.erreur || null, fix: o.fix || (o.corrected ? 'corrigé' : null) });
}
const wilson = (k, n, z = 1.96) => { if (!n) return [0, 0]; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)]; };
const f = (k, n) => { if (!n) return '0/0'; const [a, b] = wilson(k, n); return `${k}/${n} = ${(100 * k / n).toFixed(1)} % [${(100 * a).toFixed(1)} ; ${(100 * b).toFixed(1)}]`; };
// conforme attendu : « correspond » (ou message de connexion passé sans fenêtre) ; non conforme attendu : « ne correspond pas » (ou refus)
const flagged = (x) => x.issue === 'mismatch' || x.issue === 'refuse' || (x.verite !== 'conforme' && !!x.fix), passed = (x) => !flagged(x) && (x.issue === 'match' || x.issue === 'sans_fenetre');
function tally(list) {
  const K = list.filter((x) => x.verite === 'non_conforme'), C = list.filter((x) => x.verite === 'conforme'), I = list.filter((x) => x.verite === 'indecidable');
  return { n_ko: K.length, signale: K.filter(flagged).length, rate: K.filter(passed).length, ko_inverifiable: K.filter((x) => !flagged(x) && !passed(x)).length,
    n_ok: C.length, fausse_alerte: C.filter(flagged).length, ok_inverifiable: C.filter((x) => !flagged(x) && !passed(x)).length, ok_correspond: C.filter(passed).length,
    n_ind: I.length, surconfiance: I.filter(passed).length, erreurs: list.filter((x) => x.issue === 'erreur').length };
}
const T = tally(res), per = {};
for (const s of [...new Set(res.map((x) => x.scenario))]) per[s] = tally(res.filter((x) => x.scenario === s));
const md = ['# Mesure ' + jeu + ' / bras ' + bras + ' / ' + tag, '', `Écarts signalés (« ne correspond pas ») : ${f(T.signale, T.n_ko)}`, `Écarts ratés (« correspond ») : ${f(T.rate, T.n_ko)}`, `Écarts laissés « pas pu vérifier » : ${f(T.ko_inverifiable, T.n_ko)}`,
  `Fausses alertes (conforme dit « ne correspond pas ») : ${f(T.fausse_alerte, T.n_ok)}`, `Conformes laissés « pas pu vérifier » : ${f(T.ok_inverifiable, T.n_ok)}`, `Conformes reconnus : ${f(T.ok_correspond, T.n_ok)}`, `Surconfiance (indécidable dit « correspond ») : ${T.surconfiance}/${T.n_ind}`, `Erreurs du banc : ${T.erreurs}`, bras === 'clef' ? `Clef : ${st.appels} appels, ${st.cache} lectures du cache, ${st.absents} absents` : '', '',
  '| Scénario | Signalés | Ratés | Écarts invérifiables | Fausses alertes | Conformes invérifiables | Conformes reconnus |', '|---|---|---|---|---|---|---|'];
for (const [s, t] of Object.entries(per)) md.push(`| ${s} | ${t.signale}/${t.n_ko} | ${t.rate}/${t.n_ko} | ${t.ko_inverifiable}/${t.n_ko} | ${t.fausse_alerte}/${t.n_ok} | ${t.ok_inverifiable}/${t.n_ok} | ${t.ok_correspond}/${t.n_ok} |`);
mkdirSync(join(HERE, 'out'), { recursive: true });
writeFileSync(join(HERE, 'out', `mesure_${jeu}_${bras}_${tag}.json`), JSON.stringify({ jeu, bras, tag, total: T, par_scenario: per, clef: st, lignes: res }, null, 1));
writeFileSync(join(HERE, 'out', `mesure_${jeu}_${bras}_${tag}.md`), md.join('\n') + '\n');
console.log(md.join('\n'));

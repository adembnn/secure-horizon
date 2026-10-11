// boucle2 : liste les erreurs d'une mesure, groupées par scénario et étiquette.  node errs.mjs out/mesure_reglage_mots_t0.json [scenario]
import { readFileSync } from 'node:fs';
const j = JSON.parse(readFileSync(process.argv[2], 'utf8')), only = process.argv[3];
const bad = (x) => (x.verite === 'non_conforme' ? x.issue !== 'mismatch' && x.issue !== 'refuse' && !x.fix : x.verite === 'conforme' ? x.issue !== 'match' && x.issue !== 'sans_fenetre' : x.issue === 'match');
const g = {};
for (const x of j.lignes) if (bad(x) && (!only || x.scenario === only)) { const k = x.scenario + ' | ' + x.verite + ' | ' + x.etiquette + ' => ' + x.issue + ' | ' + String(x.line).replace(/\d[\d  ,.]*/g, 'N ').slice(0, 90) + ' | ' + x.codes.join(','); (g[k] = g[k] || []).push(x); }
for (const [k, v] of Object.entries(g)) console.log(String(v.length).padStart(3), k, '\n       ex: «' + v[0].phrase.slice(0, 70) + '»' + (v[0].relance ? ' relance=' + v[0].relance : '') + (v[0].sansQuestion ? ' (sans question)' : ''));

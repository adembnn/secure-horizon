// measure_final.mjs - ouvre le jeu TEST scelle UNE SEULE FOIS (verrou test_ouvert.lock), verifie son sha256, mesure le repli
// actuel et la version amelioree (figee), ecrit test_resultats.json. Usage : node intention_texte/measure_final.mjs
// Un second lancement est refuse. Aucun reglage ne doit suivre cette mesure.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { score, failures, pct } from './score_lib.mjs';
import * as BASE from './clf_baseline.mjs';
import * as IMPR from './clf_improved.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const LOCK = join(HERE, 'test_ouvert.lock');
if (existsSync(LOCK)) { console.error('Refus : le jeu TEST a deja ete ouvert (' + readFileSync(LOCK, 'utf8').trim() + ').'); process.exit(2); }
const raw = readFileSync(join(HERE, 'phrases_test_scelle.jsonl'), 'utf8');
const sha = createHash('sha256').update(raw).digest('hex');
const published = readFileSync(join(HERE, 'TEST_SHA256.txt'), 'utf8').match(/[0-9a-f]{64}/)[0];
if (sha !== published) { console.error('Refus : le sha256 du jeu TEST ne correspond pas au sha256 publie.'); process.exit(2); }
const sha256Of = (f) => createHash('sha256').update(readFileSync(join(HERE, f))).digest('hex');
writeFileSync(LOCK, 'ouvert le ' + new Date().toISOString() + ' | sha256 TEST ' + sha + ' | clf_improved.mjs ' + sha256Of('clf_improved.mjs') + ' | gen_lib.mjs ' + sha256Of('gen_lib.mjs') + '\n');
const items = raw.split('\n').filter(Boolean).map(JSON.parse);
const out = { ouvert: new Date().toISOString(), sha256_test: sha, n: items.length, bras: {} };
for (const [name, clf] of [['repli_actuel', BASE], ['amelioree', IMPR]]) {
  const preds = {};
  for (const it of items) preds[it.id] = await clf.classify(it.text);
  out.bras[name] = { metriques: score(items, preds), echecs: failures(items, preds) };
}
writeFileSync(join(HERE, 'test_resultats.json'), JSON.stringify(out, null, 1));
for (const [name, v] of Object.entries(out.bras)) {
  const R = v.metriques;
  console.log('== ' + name + ' | TEST n=' + items.length);
  for (const k of ['type_correct', 'type_faux', 'type_faux_grave', 'type_manquant', 'vague_detecte', 'injection_type_correct', 'injection_faux_grave', 'injection_pas_force_vers_permissif']) console.log(k.padEnd(38), pct(R[k]));
  for (const f of ['amount', 'token', 'recipient']) console.log(f.padEnd(10), 'rappel', pct(R[f].rappel), '| precision', pct(R[f].precision));
  console.log('FR', pct(R.par_langue.fr.type_correct), '| EN', pct(R.par_langue.en.type_correct));
}

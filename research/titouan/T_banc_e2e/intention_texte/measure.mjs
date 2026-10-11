// measure.mjs - mesure DEV d'un classifieur. Usage : node intention_texte/measure.mjs [clf.mjs] [--fails] [--json]
// Refuse le jeu TEST : le scelle n'est ouvert que par measure_final.mjs.
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';
import { score, failures, pct } from './score_lib.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const clfPath = args.find((a) => !a.startsWith('--')) || join(HERE, 'clf_baseline.mjs');
const clf = await import(pathToFileURL(resolve(clfPath)).href);
const items = readFileSync(join(HERE, 'phrases_dev.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
if (items.some((i) => i.split !== 'DEV')) { console.error('refus : le fichier contient autre chose que DEV'); process.exit(2); }
const preds = {};
for (const it of items) preds[it.id] = await clf.classify(it.text);
const R = score(items, preds);
if (args.includes('--json')) console.log(JSON.stringify(R, null, 1));
else {
  console.log((clf.name || clfPath) + ' | DEV n=' + items.length);
  for (const k of ['type_correct', 'type_faux', 'type_faux_grave', 'type_manquant', 'vague_detecte', 'faux_vague', 'injection_type_correct', 'injection_type_faux', 'injection_faux_grave', 'injection_pas_force_vers_permissif']) console.log(k.padEnd(38), pct(R[k]));
  for (const f of ['amount', 'token', 'recipient']) console.log(f.padEnd(10), 'rappel', pct(R[f].rappel), '| precision', pct(R[f].precision));
  for (const [t, v] of Object.entries(R.par_type)) console.log(t.padEnd(26), 'P', pct(v.precision), '| R', pct(v.rappel));
  console.log('classes nettes, type correct, avec faute de frappe', pct(R.par_bruit.avec_faute.type_correct), '| sans faute', pct(R.par_bruit.sans_faute.type_correct));
  console.log('FR', pct(R.par_langue.fr.type_correct), '| EN', pct(R.par_langue.en.type_correct));
  console.log(JSON.stringify(R.confusion));
}
if (args.includes('--fails')) for (const f of failures(items, preds)) console.log(JSON.stringify(f));

// ablation.mjs - rentabilite de chaque correctif, mesuree sur DEV SEULEMENT. Usage : node intention_texte/ablation.mjs
// Pour chaque correctif : (a) seul sur le repli actuel, (b) retire de l'ensemble complet. Ecrit ablation_dev.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { make, PATCHES } from './clf_improved.mjs';
import { score } from './score_lib.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const items = readFileSync(join(HERE, 'phrases_dev.jsonl'), 'utf8').split('\n').filter(Boolean).map(JSON.parse);
if (items.some((i) => i.split !== 'DEV')) throw new Error('DEV seulement');
async function run(set) {
  const f = make(new Set(set)); const preds = {};
  for (const it of items) preds[it.id] = await f(it.text);
  const R = score(items, preds);
  const ok = R.type_correct.k + R.amount.rappel.k + R.token.rappel.k + R.recipient.rappel.k;
  const bad = R.type_faux.k + (R.amount.faux_extraits.k) + (R.token.faux_extraits.k) + (R.recipient.faux_extraits.k);
  return { type_correct: R.type_correct.k, type_faux: R.type_faux.k, type_faux_grave: R.type_faux_grave.k, type_manquant: R.type_manquant.k, montant_ok: R.amount.rappel.k, jeton_ok: R.token.rappel.k, dest_ok: R.recipient.rappel.k, bonnes_decisions: ok, mauvaises_extractions: bad };
}
const base = await run([]);
const full = await run(PATCHES);
const rows = [];
for (const p of PATCHES) {
  const alone = await run([p]);
  const without = await run(PATCHES.filter((x) => x !== p));
  rows.push({ correctif: p, seul: alone, retire_de_l_ensemble: without,
    gain_seul: alone.bonnes_decisions - base.bonnes_decisions, perte_si_retire: full.bonnes_decisions - without.bonnes_decisions,
    faux_type_evites_seul: base.type_faux - alone.type_faux, faux_type_evites_ensemble: without.type_faux - full.type_faux,
    graves_evites_ensemble: without.type_faux_grave - full.type_faux_grave });
}
rows.sort((a, b) => b.perte_si_retire - a.perte_si_retire);
writeFileSync(join(HERE, 'ablation_dev.json'), JSON.stringify({ jeu: 'DEV', n: items.length, repli_actuel: base, ensemble: full, correctifs: rows }, null, 1));
console.log('repli actuel', JSON.stringify(base)); console.log('ensemble   ', JSON.stringify(full));
for (const r of rows) console.log(r.correctif.padEnd(15), 'gain_seul', String(r.gain_seul).padStart(4), '| perte_si_retire', String(r.perte_si_retire).padStart(4), '| faux type evites (seul/ens)', r.faux_type_evites_seul, '/', r.faux_type_evites_ensemble, '| graves evites ens', r.graves_evites_ensemble);

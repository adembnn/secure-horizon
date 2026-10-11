// gen_phrases.mjs - fabrique 400 phrases d'intention (FR / EN) : DEV 250 (banque de gabarits DEV) et TEST 150 (banque de
// gabarits DIFFERENTE, scellee). Usage : node intention_texte/gen_phrases.mjs
// Ecrit phrases_dev.jsonl, phrases_test_scelle.jsonl, TEST_SHA256.txt. Deterministe (graine fixe).
// Les etiquettes viennent des regles de generation (gen_lib.mjs, bank_test.mjs), jamais d'un classifieur.
// Ne lit aucun fichier du depot. Aucun reseau. N'affiche aucune phrase TEST.
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mulberry32, buildSentence, buildVague, buildAmbiguous, buildInjection } from './gen_lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLAN = { // categorie : [DEV, TEST]
  pay_someone: [50, 30], send_to_my_account: [31, 19], buy_or_swap: [44, 26], connect_or_accept_offer: [38, 22], asked_by_someone: [25, 15],
  vague: [25, 15], ambiguous: [15, 10], injection: [22, 13],
};
const seen = new Set();
function make(split, seed) {
  const rng = mulberry32(seed);
  const bank = split === 'TEST' ? 'test' : 'dev';
  const col = split === 'TEST' ? 1 : 0;
  const out = [];
  for (const [cat, counts] of Object.entries(PLAN)) {
    const n = counts[col];
    let made = 0, guard = 0;
    while (made < n && guard++ < 20000) {
      const lang = made % 2 === 0 ? 'fr' : 'en';
      let r;
      if (cat === 'vague') r = buildVague(rng, lang, bank);
      else if (cat === 'ambiguous') r = buildAmbiguous(rng, lang, bank);
      else if (cat === 'injection') r = buildInjection(rng, lang, bank);
      else r = buildSentence(rng, { type: cat, lang, noise: 'noisy', bank });
      const key = r.text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ category: cat, lang, text: r.text, ...(r.clean_text !== undefined ? { clean_text: r.clean_text } : {}), truth: r.truth });
      made++;
    }
    if (made < n) throw new Error('pas assez de phrases uniques pour ' + split + '/' + cat);
  }
  out.sort(() => rng() - 0.5);
  out.forEach((it, i) => { it.split = split; it.id = (split === 'DEV' ? 'D' : 'T') + String(i + 1).padStart(3, '0'); });
  return out;
}
const dev = make('DEV', 20261011), test = make('TEST', 20261012);
const line = (it) => JSON.stringify({ id: it.id, split: it.split, lang: it.lang, category: it.category, text: it.text, ...(it.clean_text !== undefined ? { clean_text: it.clean_text } : {}), truth: it.truth });
const devTxt = dev.map(line).join('\n') + '\n', testTxt = test.map(line).join('\n') + '\n';
writeFileSync(join(HERE, 'phrases_dev.jsonl'), devTxt);
writeFileSync(join(HERE, 'phrases_test_scelle.jsonl'), testTxt);
const sha = createHash('sha256').update(testTxt).digest('hex');
writeFileSync(join(HERE, 'TEST_SHA256.txt'), 'SHA-256 de phrases_test_scelle.jsonl (150 phrases, scellé, ouvert une seule fois à la fin par measure_final.mjs) :\n' + sha + '\n');
console.log(JSON.stringify({ total: dev.length + test.length, dev: dev.length, test: test.length, test_sha256: sha }));

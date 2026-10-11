// boucle2 : invariants du produit, vérifiés sur chaque paire du jeu de réglage (décideur réel, sources vivantes).
//   1. une phrase vague (« ok ») ou hors sujet ne donne jamais « correspond » ;
//   2. une phrase ne fait jamais MIEUX que la phrase vague sur la même demande quand la phrase vague donne une alerte du moteur
//      (une intention ne fait jamais baisser un verdict) : si « ok » donne « ne correspond pas », la vraie phrase ne donne pas « correspond »,
//      sauf correction écrite dans la demande elle-même (droit limité au montant écrit) ou droit explicitement voulu (covers) ;
//   3. aucun texte affiché ne dit « sûr », « sans risque » ni « safe ».
//   node invariants.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { essai } from './harnais.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const rows = readFileSync(join(HERE, 'REGLAGE.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
let vagueMatch = 0, lowered = 0, sur = 0, n = 0; const ex = [];
for (const r of rows) {
  const base = { req: r.request, contexte: r.contexte, origin: r.origin, chainId: r.chainId };
  const v = await essai({ ...base, text: 'ok' }), h = await essai({ ...base, text: 'il fait beau aujourd’hui' }), p = await essai({ ...base, text: r.phrase });
  n++;
  for (const o of [v, h]) if (o.outcome === 'match') { vagueMatch++; ex.push('vague -> correspond : ' + r.id); }
  if (v.outcome === 'mismatch' && p.outcome === 'match' && !p.corrected && !/autoris|approve|droit|allow|permission/i.test(r.phrase)) { lowered++; ex.push('baisse : ' + r.id + ' « ' + r.phrase + ' » ' + (v.line || '')); }
  for (const o of [v, h, p]) if (/(^|[^\p{L}])(sûre?s?|sans risque|safe|sécurisée?s?)(?![\p{L}])/iu.test(String(o.headline || '') + ' ' + String(o.line || ''))) { sur++; ex.push('dit sûr : ' + r.id + ' ' + o.line); }
}
console.log(JSON.stringify({ paires: n, vague_correspond: vagueMatch, verdict_baisse_par_la_phrase: lowered, texte_dit_sur: sur }));
if (ex.length) console.log(ex.slice(0, 12).join('\n'));
process.exit(vagueMatch || lowered || sur ? 1 : 0);

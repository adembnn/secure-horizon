// Résumé compact de sorties/dimensions.json : une ligne par dimension et par moteur. Usage : node resume.mjs [serveur|embarque]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const rows = JSON.parse(readFileSync(join(here, 'out', 'dim58', 'dimensions.json'), 'utf8'));
const S = { match: 'CORRESPOND', mismatch: 'NE CORRESPOND PAS', unverifiable: 'PAS PU VÉRIFIER' };
const one = (r) => (r.gate ? r.gate : r.erreur ? 'ERREUR ' + r.erreur : S[r.outcome] + (r.sansQuestion ? ' (sans question)' : '') + (r.auto ? ', passe seul' : '') + (r.fix ? ', corrigé' : ''));
// Verdict de l'essai : la dimension est contrôlée si la demande conforme "correspond" ET la demande qui trahit ne "correspond" pas.
const verdict = (ok, bad) => {
  const o = ok.outcome, b = bad.gate ? (bad.gate.startsWith('REFUS') ? 'refuse' : 'passe') : bad.outcome;
  if (b === 'match' || b === 'passe') return 'NON CONTRÔLÉ';
  if (b === 'mismatch' || b === 'refuse') return o === 'match' ? 'CONTRÔLÉ' : 'ALERTE DES DEUX CÔTÉS (le conforme ne passe pas non plus)';
  return o === 'match' ? 'EN PARTIE (la trahison donne « pas pu vérifier »)' : 'AVEUGLE (« pas pu vérifier » des deux côtés)';
};
const out = [];
for (const moteur of (process.argv[2] ? [process.argv[2]] : ['serveur'])) {
  out.push('', '=== moteur : ' + moteur + ' ===');
  for (const r of rows) {
    const ok = r[moteur + '_conforme'], bad = r[moteur + '_trahit'];
    out.push(r.id.padEnd(5) + verdict(ok, bad).padEnd(60) + ' | ' + r.dimension);
    out.push('       conforme : ' + one(ok) + '  « ' + (ok.line || '') + ' »');
    out.push('       trahit   : ' + one(bad) + '  « ' + (bad.line || '') + ' »' + (bad.codes && bad.codes.length ? '  [' + bad.codes.join(',') + ']' : ''));
  }
}
writeFileSync(join(here, 'out', 'dim58', 'resume.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));

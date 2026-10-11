// utilitaire : annule l'enregistrement d'une itération NON APPLIQUÉE (erreur d'outillage, pas un échec du correctif)
import { readFileSync, writeFileSync } from 'node:fs';
const e = JSON.parse(readFileSync('out/etat.json', 'utf8'));
e.iter = Number(process.argv[2]); e.echecsConsecutifs = 0; e.essais = {}; e.rejete = []; e.gains = e.gains.slice(0, e.iter);
writeFileSync('out/etat.json', JSON.stringify(e, null, 1));
writeFileSync('JOURNAL.md', readFileSync('JOURNAL.md', 'utf8').split('\n').filter((l) => !l.includes('NON APPLIQUÉ') && !(process.argv[3] && l.includes('| ' + process.argv[3] + ' :'))).join('\n'));

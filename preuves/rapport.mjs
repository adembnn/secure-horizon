// Réécrit preuves/CHIFFRES_TRACES.md à partir de preuves/out/RESULTATS.json et preuves/REGISTRE.json, sans rien mesurer.
//   node preuves/rapport.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from './lib/decideur.mjs';
import { ecrireRapport } from './lib/rapport.mjs';

const RES = JSON.parse(readFileSync(join(RACINE, 'preuves', 'out', 'RESULTATS.json'), 'utf8'));
const REG = JSON.parse(readFileSync(join(RACINE, 'preuves', 'REGISTRE.json'), 'utf8')).jeux;
ecrireRapport(RES, REG);
console.log('preuves/CHIFFRES_TRACES.md réécrit (état ' + RES.meta.decideur.sha256.slice(0, 12) + ', commit ' + RES.meta.commit.slice(0, 7) + ')');

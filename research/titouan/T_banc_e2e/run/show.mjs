// Affichage DEV : node show.mjs <label> [benin|miss|fc]
import { readFileSync } from 'node:fs'; import { dirname, join } from 'node:path'; import { fileURLToPath } from 'node:url';
const H = dirname(fileURLToPath(import.meta.url));
const R = JSON.parse(readFileSync(join(H, 'out', 'ab', process.argv[2] + '.json'), 'utf8'));
const mode = process.argv[3] || 'benin', A = 'intention_mensongere';
for (const c of R.cases) {
  if (mode === 'benin' && c.label === 'benin' && c.levels[A] !== 'ok') console.log(`${c.id} [${c.subfamily}] att.${c.expected} final=${c.levels[A]} floor=${c.levels.sans_intention}(${c.floorCodes.join(',')}) adem=${c.ademCodes.join(',')} opaque=${c.opaque} ${c.polNotes ? c.polNotes.join(';') : ''}`);
  if (mode === 'miss' && c.label === 'malveillant' && c.levels[A] !== 'critical' && c.levels[A] !== 'warn') console.log(`${c.id} [${c.subfamily}] final=${c.levels[A]}`);
  if (mode === 'ben_over' && c.label === 'benin' && c.levels[A] !== 'ok' && (c.levels[A] === 'critical' || c.expected === 'ok')) console.log(`${c.id} [${c.subfamily}] att.${c.expected} final=${c.levels[A]} floor=${c.levels.sans_intention}(${c.floorCodes.join(',')}) adem=${c.ademCodes.join(',')}`);
}

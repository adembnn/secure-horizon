// boucle2 : remplace writtenCheck() et writtenCore() de extension/written_check.js par le texte de patches/p2_written_core.txt.
//   node patches/p2_apply.mjs ../extension/written_check.js
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const f = process.argv[2]; let s = readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); if (crlf) s = s.replace(/\r\n/g, '\n');
const a = s.indexOf('export function writtenCheck('), b = s.indexOf('// ---------------------------------------------------------------- the measured effect of an unreadable call');
if (a < 0 || b < 0 || b < a) throw new Error('bornes introuvables');
const core = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'p2_written_core.txt'), 'utf8').replace(/\r\n/g, '\n');
s = s.slice(0, a) + core + s.slice(b);
writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s);
console.log('ok');

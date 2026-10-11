// Préchargement d'essai (node --import ...) : toute ouverture ou lecture du contenu de blind_decalage/CASES.jsonl fait échouer le processus.
// Sert à prouver que --dry-run ne lit pas le fichier. stat/existsSync restent permis (pas de contenu).
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CIBLE = resolve(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'CASES.jsonl')).toLowerCase();
const vise = (p) => { try { return typeof p === 'string' || p instanceof URL || Buffer.isBuffer(p) ? resolve(String(p instanceof URL ? fileURLToPath(p) : p)).toLowerCase() === CIBLE : false; } catch { return false; } };
const boom = (op) => { console.error('GARDE : tentative de lecture de CASES.jsonl via ' + op); process.exit(99); };
for (const n of ['readFileSync', 'openSync', 'createReadStream', 'readFile', 'open', 'opendirSync']) {
  const orig = fs[n];
  if (typeof orig !== 'function') continue;
  fs[n] = function (p, ...r) { if (vise(p)) boom(n); return orig.call(this, p, ...r); };
}
const po = fs.promises.readFile, pop = fs.promises.open;
fs.promises.readFile = async function (p, ...r) { if (vise(p)) boom('promises.readFile'); return po.call(this, p, ...r); };
fs.promises.open = async function (p, ...r) { if (vise(p)) boom('promises.open'); return pop.call(this, p, ...r); };
syncBuiltinESMExports();
console.log('[garde] lecture de CASES.jsonl interdite pour ce processus');

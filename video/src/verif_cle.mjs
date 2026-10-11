// verif_cle.mjs : verifie qu'aucun fichier de video/ ne contient la valeur de GRADIUM_API_KEY. N'affiche jamais la valeur.
//   node --env-file=.env video/src/verif_cle.mjs      (depuis la racine du depot)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const K = process.env.GRADIUM_API_KEY; if (!K) { console.error('variable absente'); process.exit(2); }
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'); const needle = Buffer.from(K); let n = 0, hits = 0;
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f), st = statSync(p); if (st.isDirectory()) walk(p); else { n++; if (readFileSync(p).includes(needle)) { hits++; console.log('TROUVE dans', p); } } } })(root);
console.log(`${n} fichiers lus, ${hits} contiennent la cle`); process.exit(hits ? 1 : 0);

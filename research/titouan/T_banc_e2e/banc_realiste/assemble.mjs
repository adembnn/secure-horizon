// Assemble BANC_REALISTE.md : remplace {{inc:fichier}} par le contenu du fichier (chemins relatifs à banc_realiste/).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const tpl = readFileSync(join(HERE, 'BANC_REALISTE.tpl.md'), 'utf8');
writeFileSync(join(HERE, 'BANC_REALISTE.md'), tpl.replace(/\{\{inc:([^}]+)\}\}/g, (_, f) => readFileSync(join(HERE, f.trim()), 'utf8').replace(/^\n+/, '')));
console.log('BANC_REALISTE.md écrit');

// Génère preview_data.js depuis U_textes_utilisateur.json (les navigateurs refusent fetch() sur file://).
// Usage : node build_preview.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const src = join(dir, '..', '..', 'U_textes_utilisateur.json');
const doc = JSON.parse(readFileSync(src, 'utf8'));
const data = { version: doc.version, date: doc.date, variables: doc.variables, fiches: doc.fiches.map(({ questions, ...f }) => f) };
writeFileSync(join(dir, 'preview_data.js'), '/* généré par build_preview.mjs depuis U_textes_utilisateur.json : ne pas éditer */\nwindow.HOLDUP_DATA = ' + JSON.stringify(data) + ';\n');
console.log(`preview_data.js : ${data.fiches.length} fiches`);

// Regroupe les erreurs d'un fichier de résultats : node pipeline/grille/errs.mjs res.json
import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync(process.argv[2], 'utf8')).rows;
const g = {};
for (const x of r.filter((x) => x.truth !== x.decision)) { const k = `${x.truth}>${x.decision} | ${x.family} | ${x.why}`; (g[k] ??= []).push(x); }
for (const [k, v] of Object.entries(g).sort((a, b) => b[1].length - a[1].length).slice(0, +process.argv[3] || 30)) console.log(v.length, k, '|', v.slice(0, 2).map((x) => x.text + ' <' + x.kind + '>').join(' ## '));

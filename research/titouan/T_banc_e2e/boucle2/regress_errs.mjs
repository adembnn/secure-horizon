// boucle2 : erreurs d'une non-régression, groupées par signal.  node regress_errs.mjs out/regress_panel_apres.json fausse_alerte|rate|ok_inv|surconf [n]
import { readFileSync } from 'node:fs';
const j = JSON.parse(readFileSync(process.argv[2], 'utf8')), what = process.argv[3] || 'fausse_alerte', top = Number(process.argv[4] || 25);
const flagged = (x) => x.issue === 'mismatch' || x.issue === 'refuse' || (x.verite !== 'conforme' && x.corrige), passed = (x) => !flagged(x) && (x.issue === 'match' || x.issue === 'sans_fenetre');
const sel = { fausse_alerte: (x) => x.verite === 'conforme' && flagged(x), rate: (x) => x.verite === 'non_conforme' && passed(x), ok_inv: (x) => x.verite === 'conforme' && !flagged(x) && !passed(x), ko_inv: (x) => x.verite === 'non_conforme' && !flagged(x) && !passed(x), surconf: (x) => x.verite === 'indecidable' && passed(x) }[what];
const g = {};
for (const x of j.lignes) if (sel(x)) { const k = String(x.line).replace(/0x[0-9a-f…⁠]+/gi, 'ADR').replace(/\d[\d  ,.]*/g, 'N ').slice(0, 100) + ' | w=' + x.written + ' | ' + x.nature + ' × ' + x.ecart; (g[k] = g[k] || []).push(x); }
for (const [k, v] of Object.entries(g).sort((a, b) => b[1].length - a[1].length).slice(0, top)) console.log(String(v.length).padStart(4), k, '\n        ex ' + v[0].id + ' «' + String(v[0].phrase).slice(0, 80) + '» ' + (v[0].codes || []).slice(0, 4).join(','));

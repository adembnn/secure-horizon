// boucle2 : ce qui change entre deux non-régressions, paire par paire.  node regress_diff.mjs out/regress_panel_avant.json out/regress_panel_apres.json [verite] [n]
import { readFileSync } from 'node:fs';
const A = JSON.parse(readFileSync(process.argv[2], 'utf8')).lignes, B = JSON.parse(readFileSync(process.argv[3], 'utf8')).lignes, only = process.argv[4] || null, top = Number(process.argv[5] || 30);
const cls = (x) => (x.issue === 'mismatch' || x.issue === 'refuse' || (x.verite !== 'conforme' && x.corrige) ? 'ALERTE' : x.issue === 'match' || x.issue === 'sans_fenetre' ? 'CORRESPOND' : 'INVERIFIABLE');
const byId = new Map(A.map((x) => [x.id, x])), g = {}, tot = {};
for (const b of B) { const a = byId.get(b.id); if (!a || (only && b.verite !== only)) continue; const ca = cls(a), cb = cls(b); const t = b.verite + ' : ' + ca + ' -> ' + cb; tot[t] = (tot[t] || 0) + 1; if (ca === cb) continue;
  const k = t + ' | ' + String(b.line).replace(/0x[0-9a-f…⁠]+/gi, 'ADR').replace(/\d[\d  ,.]*/g, 'N ').slice(0, 90) + ' | w=' + b.written + ' | ' + b.nature + ' × ' + b.ecart; (g[k] = g[k] || []).push(b); }
console.log(Object.entries(tot).sort().map(([k, v]) => String(v).padStart(5) + ' ' + k).join('\n'));
for (const [k, v] of Object.entries(g).sort((a, b) => b[1].length - a[1].length).slice(0, top)) console.log(String(v.length).padStart(4), k, '\n        ex ' + v[0].id + ' «' + String(v[0].phrase).slice(0, 80) + '» ' + (v[0].codes || []).slice(0, 4).join(','));

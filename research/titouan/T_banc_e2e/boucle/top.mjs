// boucle/top.mjs : classement des pertes (réglage) par jeu|famille, avec la répartition par classe et par niveau obtenu
import { readFileSync } from 'node:fs';
const s = JSON.parse(readFileSync(process.argv[2] || 'out/cur.json'));
const R = s.rows.filter((r) => r.part !== 2);
const P = s.mesure.reglage.pertesA || s.mesure.reglage.pertes; const F = {};
for (const [k, v] of Object.entries(P)) { const [j, f] = k.split('|'); F[j + '|' + f] = (F[j + '|' + f] || 0) + v; }
const n = Number(process.argv[3] || 25);
for (const [k, v] of Object.entries(F).sort((a, b) => b[1] - a[1]).slice(0, n)) {
  const [j, f] = k.split('|'); const rs = R.filter((r) => r.jeu === j && r.fam === f); const c = {};
  for (const r of rs) for (const [arm, lv] of Object.entries(r.res)) { if (j !== 'GRILLE' && arm !== 'full') continue; const bad = r.cls === 'S' ? lv === 'ok' || lv === 'unknown' || lv === 'warn' : r.cls === 'B' ? lv !== 'ok' && !(lv === 'warn' && r.tol !== 'ok') : lv === 'ok'; if (bad) { const kk = `${r.cls}:${lv}`; c[kk] = (c[kk] || 0) + 1; } }
  console.log(v.toFixed(2).padStart(5), k.padEnd(42), JSON.stringify(c));
}

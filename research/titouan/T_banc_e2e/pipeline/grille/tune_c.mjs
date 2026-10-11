// Réglage des seuils du bras c sur la moitié RÉGLAGE uniquement (aucun appel : les réponses sont dans cache_clef/ via res_clef_reglage.json).
import { readFileSync } from 'node:fs';
const j = JSON.parse(readFileSync(new URL('./res_clef_reglage.json', import.meta.url), 'utf8'));
const rows = j.rows.c.filter((r) => r.p);
const dec = (p, tu, td, tm) => (p.unclear >= tu ? 'inverifiable' : p.differs >= td ? 'ne_correspond_pas' : p.matches >= tm && p.differs < td ? 'correspond' : 'inverifiable');
const cost = (r, d) => (r.truth === d ? 0 : r.truth === 'ne_correspond_pas' && d === 'correspond' ? 6 : r.truth === 'inverifiable' && d === 'correspond' ? 4 : r.truth === 'correspond' && d === 'ne_correspond_pas' ? 3 : r.truth === 'inverifiable' ? 2 : 1);
let best = null;
for (const tu of [0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6]) for (const td of [0.3, 0.4, 0.5, 0.6, 0.7]) for (const tm of [0.5, 0.6, 0.7, 0.8]) {
  let c = 0, ok = 0; for (const r of rows) { const d = dec(r.p, tu, td, tm); c += cost(r, d); if (d === r.truth) ok++; }
  if (!best || c < best.c) best = { tu, td, tm, c, ok, n: rows.length };
}
console.log(JSON.stringify(best));

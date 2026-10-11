import { readFileSync } from 'node:fs';
const S = await import('./stats.mjs');
const j = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (const [k, rows] of Object.entries(j.rows)) { if (!rows.length) continue; const m = S.measure(rows);
  console.log(k, 'attrapé', S.fmt(m.attrape, m.n_mismatch), '| raté-correspond', m.rate_correspond, '| FP', S.fmt(m.faux_positif, m.n_match), '| inv ok', S.fmt(m.inv_ok, m.n_inv), '| inv->corr', m.inv_surconfiance, '| inv->mism', m.inv_alerte, '| corr->inv', m.correspond_inv, '| mism->inv', m.rate_inv, '| erreurs', rows.filter(r=>/erreur/.test(r.why)).length); }

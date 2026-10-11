// Compare, transaction par transaction, le niveau AVANT (sans F34) et APRÈS (avec F34) sur le trafic réel. Écrit out/avant_apres_<chaîne>.json.
// Usage : node compare_avant_apres.mjs <cchain|eth>   (après avoir lancé run_real.mjs avec et sans OUT_TAG=avant, voir RAPPORT_REDUCTION_AVERTISSEMENTS.md)
// Violations comptées : (1) un rouge qui descend ; (2) un orange avec preuve d'effet (autre chose que l'opacité) qui descend ;
// (3) un niveau 'ok' (vert) qui apparaît là où il n'y en avait pas ; (4) un niveau qui monte (signalé, pas une violation de sécurité).
import fs from 'node:fs'; import path from 'node:path';
const HERE = path.resolve(import.meta.dirname); const CH = process.argv[2];
const rd = (f) => JSON.parse(fs.readFileSync(path.join(HERE, 'cache_', f), 'utf8'));
const avant = rd(`rows_${CH}_avant.json`), apres = rd(`rows_${CH}.json`);
const RANK = { ok: 0, info: 0.5, warn: 1, critical: 2, inconnu: 1 };
const OPA = new Set(['w:unknown_selector', 'w:opaque']);
const res = {};
for (const mode of ['A', 'B']) {
  const a = avant[mode], b = apres[mode]; const o = { n: a.length, violations: { rouge_descend: 0, orange_preuve_descend: 0, vert_cree: 0 }, monte: 0, descend_opacite_seule: 0, inchange: 0, exemples_violation: [] };
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i]; if (x.hash !== y.hash) throw new Error('lignes non alignées ' + i);
    const evidence = x.codes.some((c) => !OPA.has(c));
    let v = null;
    if (x.level === 'critical' && y.level !== 'critical') v = 'rouge_descend';
    else if (x.level === 'warn' && evidence && RANK[y.level] < RANK.warn) v = 'orange_preuve_descend';
    else if (y.level === 'ok' && x.level !== 'ok') v = 'vert_cree';
    if (v) { o.violations[v]++; if (o.exemples_violation.length < 5) o.exemples_violation.push({ hash: x.hash, avant: x.level, apres: y.level, v }); }
    if (RANK[y.level] > RANK[x.level]) o.monte++;
    else if (RANK[y.level] < RANK[x.level]) { if (!v) o.descend_opacite_seule++; } else o.inchange++;
  }
  o.violations_total = Object.values(o.violations).reduce((s, n) => s + n, 0);
  const pct = (rows, L) => +(100 * rows.filter((r) => L.includes(r.level)).length / rows.length).toFixed(3);
  o.avertissements_pct = { avant: pct(a, ['warn']), apres: pct(b, ['warn']) };
  o.rouges_pct = { avant: pct(a, ['critical']), apres: pct(b, ['critical']) };
  o.info_pct = { avant: pct(a, ['info']), apres: pct(b, ['info']) };
  o.vert_pct = { avant: pct(a, ['ok']), apres: pct(b, ['ok']) };
  o.rouges_n = { avant: a.filter((r) => r.level === 'critical').length, apres: b.filter((r) => r.level === 'critical').length };
  res[mode] = o;
}
fs.writeFileSync(path.join(HERE, 'out', `avant_apres_${CH}.json`), JSON.stringify(res, null, 1));
console.log(CH, JSON.stringify(res, null, 1));

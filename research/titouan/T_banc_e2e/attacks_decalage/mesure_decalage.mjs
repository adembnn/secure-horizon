// Mesure des cas de décalage par famille, 4 bras, intervalles de Wilson à 95 %.
//   node attacks_decalage/mesure_decalage.mjs [--json=out.json] [--md=out.md] [--fails] [--file=autre.jsonl]
// Bras :
//   plancher   : moteur + politique, aucune intention, sans détecteurs (le plancher objectif)
//   sans       : aucune intention, avec les détecteurs de detectors_adem/ (lecture produit : un drapeau fondé sur l'intention déclarée plafonne à orange)
//   catalogue  : le TYPE d'intention seul (pay / receive / swap...), tel que l'extension le propose, avec détecteurs et garde de monotonie
//   honnete    : l'intention honnête détaillée (type, jeton, montant, destinataire, jeton reçu), avec détecteurs et garde de monotonie
//   honnete_noyau : idem sans détecteurs (mesure du seul comparateur + politique)
// Rappel = part des cas de décalage signalés (niveau >= warn, c'est le « ne correspond pas »). Rappel rouge = part des cas de gravité idéale critique qui sont en critical.
// Fausse alerte = jumeau bénin en critical. Alerte orange = jumeau bénin en warn (fatigue, comptée à part).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepare, runArm, normalizeCase, RANK } from '../run/arms.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const FILE = opt('file') || join(HERE, 'DECALAGE.jsonl');
const ARMS = [
  ['plancher', 'none', { detectors: false }],
  ['sans', 'none', { detectors: true, premiseCap: true }],
  ['catalogue', 'type', { detectors: true, premiseCap: true, guard: true }],
  ['honnete', 'full', { detectors: true, premiseCap: true, guard: true }],
  ['honnete_noyau', 'full', { detectors: false }],
];
export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}
const pct = (x) => (100 * x).toFixed(1) + ' %';
const fmt = (k, n) => { if (!n) return 'n/a'; const [lo, hi] = wilson(k, n); return `${k}/${n} = ${pct(k / n)} [${pct(lo)} ; ${pct(hi)}]`; };

export async function mesureDecalage(file = FILE) {
  const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const rows = [];
  for (const l of lines) {
    const c0 = JSON.parse(l);
    const c = normalizeCase(c0);
    const prep = prepare(c);
    const L = {};
    for (const [name, arm, o] of ARMS) L[name] = (await runArm(prep, arm, o)).level;
    rows.push({ id: c0.id, family: c0.family, sub: c0.subfamily, label: c0.label, ideal: c0.ideal_severity, L });
  }
  return rows;
}
export function tableau(rows) {
  const fams = [...new Set(rows.map((r) => r.family))];
  const out = { par_famille: {}, global: {} };
  const agg = (rs) => {
    const R = {};
    for (const [name] of ARMS) {
      const M = rs.filter((r) => r.label === 'malveillant'), B = rs.filter((r) => r.label === 'benin');
      const Mc = M.filter((r) => r.ideal === 'critical');
      R[name] = {
        n_decalage: M.length, signales: M.filter((r) => RANK[r.L[name]] >= 1).length,
        n_idealcrit: Mc.length, rouges: Mc.filter((r) => r.L[name] === 'critical').length,
        n_benins: B.length, fausses_alertes: B.filter((r) => r.L[name] === 'critical').length, oranges_benins: B.filter((r) => r.L[name] === 'warn').length,
      };
    }
    return R;
  };
  for (const f of fams) out.par_famille[f] = agg(rows.filter((r) => r.family === f));
  out.global = agg(rows.filter((r) => r.family !== 'limites_connues'));
  return out;
}
function markdown(T) {
  const names = ARMS.map((a) => a[0]);
  let md = '';
  const section = (title, key, f) => {
    md += `\n### ${title}\n\n| Bras | Signalés (>= orange) | Rouges sur gravité critique | Fausses alertes (rouge sur bénin) | Oranges sur bénin |\n|---|---|---|---|---|\n`;
    for (const n of names) { const x = f[n]; md += `| ${n} | ${fmt(x.signales, x.n_decalage)} | ${fmt(x.rouges, x.n_idealcrit)} | ${fmt(x.fausses_alertes, x.n_benins)} | ${fmt(x.oranges_benins, x.n_benins)} |\n`; }
  };
  section('Toutes familles', 'global', T.global);
  for (const [f, v] of Object.entries(T.par_famille)) section(f, f, v);
  return md;
}
if (process.argv[1] && process.argv[1].endsWith('mesure_decalage.mjs')) {
  const rows = await mesureDecalage();
  const T = tableau(rows);
  const md = markdown(T);
  console.log(md);
  if (args.includes('--fails')) for (const r of rows) {
    const bad = r.label === 'malveillant' ? RANK[r.L.honnete] < RANK[r.ideal === 'critical' ? 'critical' : 'warn'] : RANK[r.L.honnete] >= 2;
    if (bad) console.log('ECHEC', r.id, r.sub, r.label, JSON.stringify(r.L));
  }
  if (opt('json')) writeFileSync(opt('json'), JSON.stringify({ rows, tableau: T }, null, 1));
  if (opt('md')) writeFileSync(opt('md'), md);
}

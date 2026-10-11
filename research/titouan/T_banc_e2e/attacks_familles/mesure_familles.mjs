// Mesure des jeux neufs par famille, mêmes bras que attacks_decalage/mesure_decalage.mjs, intervalles de Wilson à 95 %.
//   node attacks_familles/mesure_familles.mjs --file=attacks_familles/REGLAGE.jsonl [--root=<copie du moteur>] [--json=..] [--md=..] [--fails]
// --root : racine T_banc_e2e d'une autre version du moteur (par exemple l'extraction du commit gelé 74203da pour la mesure « avant »).
// Bras :
//   plancher      : moteur + politique, aucune intention, sans détecteurs
//   sans          : aucune intention, avec détecteurs (drapeau fondé sur l'intention plafonné à orange)
//   catalogue     : le TYPE d'intention seul, détecteurs et garde de monotonie
//   honnete       : l'intention honnête détaillée (type, jeton, montant, texte), détecteurs et garde
//   honnete_noyau : idem sans détecteurs
// Indicateurs :
//   signalé        = niveau >= orange (honnête) sur un cas d'écart ;
//   écart d'intention = honnête >= orange ET l'intention apporte quelque chose : niveau plus haut que « sans », ou un motif absent de « sans ».
//                    C'est ce qu'une chaîne à trois valeurs lit comme « ne correspond pas » plutôt que « invérifiable » quand le plancher est déjà haut.
//                    Un effet illisible (opaque) n'est jamais compté comme écart : une telle chaîne le lit « invérifiable ».
//   fausse alerte  = jumeau bénin en rouge (honnête) ; orange bénin compté à part.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const ROOT = opt('root') ? resolve(opt('root')) : join(HERE, '..');
const FILE = opt('file') || join(HERE, 'REGLAGE.jsonl');
const A = await import(pathToFileURL(join(ROOT, 'run', 'arms.mjs')).href);
const ARMS = [
  ['plancher', 'none', { detectors: false }],
  ['sans', 'none', { detectors: true, premiseCap: true }],
  ['catalogue', 'type', { detectors: true, premiseCap: true, guard: true }],
  ['honnete', 'full', { detectors: true, premiseCap: true, guard: true }],
  ['honnete_noyau', 'full', { detectors: false }],
];
const RANK = { ok: 0, unknown: 0.5, warn: 1, critical: 2 };
export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}
const pct = (x) => (100 * x).toFixed(0) + ' %';
export const fmt = (k, n) => { if (!n) return 'n/a'; const [lo, hi] = wilson(k, n); return `${k}/${n} (${pct(k / n)} [${pct(lo)} ; ${pct(hi)}])`; };

export async function mesure(file = FILE) {
  const rows = [];
  for (const l of readFileSync(file, 'utf8').split('\n').filter(Boolean)) {
    const c0 = JSON.parse(l);
    const prep = A.prepare(A.normalizeCase(c0));
    const L = {}, R = {};
    for (const [name, arm, o] of ARMS) { const r = await A.runArm(prep, arm, o); L[name] = r.level; R[name] = r.reasons || []; }
    const newReason = R.honnete.some((x) => !R.sans.includes(x));
    const opaque = !!(prep.unsupported || (prep.eff && prep.eff.opaque));
    const ecart = !opaque && RANK[L.honnete] >= 1 && (RANK[L.honnete] > RANK[L.sans] || newReason);
    rows.push({ id: c0.id, family: c0.family, sub: c0.subfamily, label: c0.label, ideal: c0.ideal_severity, L, ecart, opaque, reasons: R.honnete });
  }
  return rows;
}
export function tableau(rows) {
  const agg = (rs) => {
    const M = rs.filter((r) => r.label === 'malveillant'), B = rs.filter((r) => r.label === 'benin'), Mc = M.filter((r) => r.ideal === 'critical');
    const out = {};
    for (const [name] of ARMS) out[name] = { n: M.length, signales: M.filter((r) => RANK[r.L[name]] >= 1).length, ncrit: Mc.length, rouges: Mc.filter((r) => r.L[name] === 'critical').length, nb: B.length, fa: B.filter((r) => r.L[name] === 'critical').length, ob: B.filter((r) => r.L[name] === 'warn' || r.L[name] === 'unknown').length };
    out.ecart = { n: M.length, k: M.filter((r) => r.ecart).length, nb: B.length, kb: B.filter((r) => r.ecart).length };
    out.ok_niveau = rs.filter((r) => r.L.honnete === 'ok').length;
    out.illisibles = { k: M.filter((r) => r.opaque).length, n: M.length };
    return out;
  };
  const fams = [...new Set(rows.map((r) => r.family))];
  return { global: agg(rows), par_famille: Object.fromEntries(fams.map((f) => [f, agg(rows.filter((r) => r.family === f))])) };
}
export function markdown(T) {
  let md = '';
  const sec = (title, x) => {
    md += `\n### ${title}\n\n| Bras | Signalés (>= orange) | Rouges sur gravité critique | Fausses alertes (rouge sur bénin) | Oranges sur bénin |\n|---|---|---|---|---|\n`;
    for (const [n] of ARMS) { const a = x[n]; md += `| ${n} | ${fmt(a.signales, a.n)} | ${fmt(a.rouges, a.ncrit)} | ${fmt(a.fa, a.nb)} | ${fmt(a.ob, a.nb)} |\n`; }
    md += `| écart d'intention (honnête) | ${fmt(x.ecart.k, x.ecart.n)} | | bénins avec écart : ${fmt(x.ecart.kb, x.ecart.nb)} | niveau vert (honnête) : ${x.ok_niveau} |\n`;
  };
  sec('Toutes familles', T.global);
  for (const [f, x] of Object.entries(T.par_famille)) sec(f, x);
  return md;
}
if (process.argv[1] && process.argv[1].endsWith('mesure_familles.mjs')) {
  const rows = await mesure();
  const T = tableau(rows), md = markdown(T);
  console.log(`racine : ${ROOT}\nfichier : ${FILE}\n` + md);
  if (args.includes('--fails')) for (const r of rows) {
    const bad = r.label === 'malveillant' ? (RANK[r.L.honnete] < (r.ideal === 'critical' ? 2 : 1) || !r.ecart) : RANK[r.L.honnete] >= 2;
    if (bad) console.log('ECHEC', r.id, r.sub, r.label, JSON.stringify(r.L), r.ecart ? 'ecart' : r.opaque ? 'illisible' : 'sans-ecart', r.reasons.join(','));
  }
  if (opt('json')) writeFileSync(opt('json'), JSON.stringify({ root: ROOT, file: FILE, rows, tableau: T }, null, 1));
  if (opt('md')) writeFileSync(opt('md'), md);
}

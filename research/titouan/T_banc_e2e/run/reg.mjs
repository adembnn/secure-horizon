// Régression complète d'un état des correctifs : V2_DEV + DEV + REGRESSION_PUBLIQUE (jamais TEST, jamais V2_TEST).
// Usage : node run/reg.mjs <label> [--fixes F1,F2,..|none|all] [--ref <label>]
//  - écrit run/out/reg/<label>_{v2,dev,public}.json ; avec --ref, liste les changements de verdict par cas et leur effet net.
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, readdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const a = process.argv.slice(2);
const label = a[0];
const val = (f) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : undefined; };
const fixes = val('--fixes'), ref = val('--ref');
const OUT = join(HERE, 'out', 'reg'); mkdirSync(OUT, { recursive: true });
const env = { ...process.env, ...(fixes ? { POLICY_FIXES: fixes } : {}) };
const run = (args) => { const r = spawnSync(process.execPath, args, { env, encoding: 'utf8' }); if (r.status) { console.error(r.stdout, r.stderr); process.exit(r.status); } return r.stdout; };

// V2
run([join(HERE, 'run_v2.mjs'), 'reg_' + label, '--quiet']);
copyFileSync(join(HERE, 'out', 'v2', `reg_${label}.json`), join(OUT, `${label}_v2.json`));
// DEV (dry)
run([join(HERE, 'run_loop.mjs'), '--dry', join(OUT, `${label}_dev.json`)]);
// PUBLIC
const pubDir = join(HERE, 'out', 'public');
const before = new Set(existsSync(pubDir) ? readdirSync(pubDir) : []);
run([join(HERE, 'reg_public.mjs'), '--quiet']);
const fresh = readdirSync(pubDir).filter((f) => !before.has(f) && f.endsWith('.json'));
copyFileSync(join(pubDir, fresh[0]), join(OUT, `${label}_public.json`));
for (const f of readdirSync(pubDir)) if (!before.has(f)) rmSync(join(pubDir, f));

const RANK = { unknown: -1, ok: 0, warn: 1, critical: 2 };
const wil = (k, n) => { if (!n) return 'n/a'; const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return `${(p * 100).toFixed(1)}% [${(Math.max(0, c - h) * 100).toFixed(1)}-${(Math.min(1, c + h) * 100).toFixed(1)}] (${k}/${n})`; };
const load = (l, s) => JSON.parse(readFileSync(join(OUT, `${l}_${s}.json`), 'utf8'));
function summarize(l) {
  const v2 = load(l, 'v2'), dev = load(l, 'dev'), pub = load(l, 'public');
  const out = {};
  const S = (rows, arm, getLabel) => {
    let nm = 0, att = 0, attc = 0, nb = 0, fac = 0, faw = 0, fawx = 0, nf = 0, fca = 0;
    for (const r of rows) { const lv = r.levels[arm]; const lb = getLabel(r);
      if (lb === 'malveillant') { nm++; if (lv === 'critical') { att++; attc++; } else if (lv === 'warn') att++; }
      else if (lb === 'benin') { nb++; if (lv === 'critical') { fac++; faw++; fawx++; } else if (lv === 'warn') { faw++; if (RANK[lv] > RANK[r.expected]) fawx++; } }
      else if (lb === 'fraude_conforme') { nf++; if (lv === 'warn' || lv === 'critical') fca++; } }
    return { nm, att, attc, nb, fac, faw, fawx, nf, fca };
  };
  out.v2 = S(v2.cases, 'intention_mensongere', (r) => r.label);
  out.v2av = S(v2.cases.filter((r) => r.avax), 'intention_mensongere', (r) => r.label);
  out.v2h = S(v2.cases, 'intention_honnete', (r) => r.label);
  out.v2p = S(v2.cases, 'sans_intention', (r) => r.label);
  out.dev = S(dev.cases, 'intention_mensongere', (r) => r.label);
  out.public = S(pub.cases.filter((r) => r.levels && r.levels.intention_mensongere), 'intention_mensongere', (r) => r.label);
  return out;
}
const line = (nm, s) => `${nm.padEnd(10)} rappel ${wil(s.att, s.nm)} | crit ${(s.attc / s.nm * 100).toFixed(1)}% | FA crit ${wil(s.fac, s.nb)} | warn+crit ${wil(s.faw, s.nb)} | excès ${s.fawx}/${s.nb} | fc alertée ${s.fca}/${s.nf}`;
const s = summarize(label);
console.log(`[${label}] fixes=${fixes || '(défaut)'}`);
for (const [k, v] of Object.entries({ 'V2 cat.': s.v2, 'V2 Avax': s.v2av, 'V2 hon.': s.v2h, 'V2 plan.': s.v2p, 'DEV cat.': s.dev, 'PUBLIC cat.': s.public })) console.log('  ' + line(k, v));
if (ref) {
  for (const set of ['v2', 'dev', 'public']) {
    const A = load(ref, set), B = load(label, set); const mp = new Map(A.cases.map((c) => [c.id, c]));
    const diffs = [];
    for (const c of B.cases) { const o = mp.get(c.id); if (!o) continue; for (const arm of ['sans_intention', 'intention_honnete', 'intention_mensongere']) if (o.levels[arm] !== c.levels[arm]) diffs.push({ id: c.id, label: c.label, exp: c.expected, fam: `${c.family}/${c.subfamily}`, arm, from: o.levels[arm], to: c.levels[arm] }); }
    const g = {}; for (const d of diffs) { const k = `${d.label} ${d.fam} ${d.arm.replace('intention_', '').replace('mensongere', 'cat').replace('honnete', 'hon').replace('sans_cat', 'plan')} ${d.from}->${d.to}`; g[k] = (g[k] || 0) + 1; }
    console.log(`  diff ${set} vs ${ref} : ${diffs.length} changements de verdict (${new Set(diffs.map((d) => d.id)).size} cas)`);
    for (const [k, n] of Object.entries(g).sort((x, y) => y[1] - x[1]).slice(0, 25)) console.log(`     ${n} × ${k}`);
    // bilan net : malveillants perdus (baisse de niveau) et bénins gagnés, sur le bras catalogue
    const lostMal = diffs.filter((d) => d.label === 'malveillant' && d.arm === 'intention_mensongere' && RANK[d.to] < RANK[d.from]);
    const lostOk = lostMal.filter((d) => d.to === 'ok').length;
    console.log(`     malveillants (cat.) dont le niveau baisse : ${lostMal.length} (dont vers ok : ${lostOk}) ; hausse : ${diffs.filter((d) => d.label === 'malveillant' && d.arm === 'intention_mensongere' && RANK[d.to] > RANK[d.from]).length}`);
  }
}

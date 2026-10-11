// Mesure des jeux d'Adem (redteam/jury_*.jsonl) via redteam/check.mjs (lecture seule, non modifié) pour un état des correctifs.
// Usage : node run/reg_jury.mjs <label> [--fixes F1,..|none|all]  -> run/out/reg/<label>_jury.json + tableau (ratées = malveillant sans critical ; FA = bénin en critical ; warn+crit = bénin non ok).
import { spawnSync } from 'node:child_process';
import { readdirSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '..');
const a = process.argv.slice(2); const label = a[0] || 'jury';
const fi = a.indexOf('--fixes'); const env = { ...process.env, ...(fi >= 0 ? { POLICY_FIXES: a[fi + 1] } : {}) };
mkdirSync(join(HERE, 'out', 'reg'), { recursive: true });
const out = {}; let T = { n: 0, mal: 0, ben: 0, ratees: 0, fa: 0, ben_nonok: 0 };
for (const f of readdirSync(join(ROOT, 'redteam')).filter((x) => /^jury_.*\.jsonl$/.test(x)).sort()) {
  const r = spawnSync(process.execPath, [join(ROOT, 'redteam', 'check.mjs'), join(ROOT, 'redteam', f)], { env, encoding: 'utf8', maxBuffer: 1 << 28 });
  const lines = r.stdout.trim().split('\n').map((l) => JSON.parse(l));
  const cases = lines.filter((l) => l.id !== undefined);
  const meta = new Map(readFileSync(join(ROOT, 'redteam', f), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).map((c) => [c.id, c.label]));
  let mal = 0, ben = 0, rat = 0, fa = 0, bnok = 0;
  const per = {};
  for (const c of cases) { const lb = meta.get(c.id); per[c.id] = c.level_final;
    if (lb === 'malveillant') { mal++; if (c.level_final !== 'critical') rat++; } else if (lb === 'benin') { ben++; if (c.level_final === 'critical') fa++; if (c.level_final !== 'ok') bnok++; } }
  out[f] = { n: cases.length, mal, ben, ratees: rat, fa, ben_nonok: bnok, levels: per };
  T.n += cases.length; T.mal += mal; T.ben += ben; T.ratees += rat; T.fa += fa; T.ben_nonok += bnok;
}
writeFileSync(join(HERE, 'out', 'reg', `${label}_jury.json`), JSON.stringify(out));
console.log(`[${label}] jury d'Adem : ` + Object.entries(out).map(([f, v]) => `${f.replace(/^jury_|\.jsonl$/g, '')} ratées ${v.ratees}/${v.mal} FA ${v.fa}/${v.ben} (non-ok ${v.ben_nonok})`).join(' | ') + ` | TOTAL ratées ${T.ratees}/${T.mal} FA ${T.fa}/${T.ben} non-ok ${T.ben_nonok}`);

// Mesure A/B sur DEV (jamais TEST). Usage : node ab.mjs <label> [fixes csv|none|all]  -> out/ab/<label>.json ; compare avec out/ab/<ref>.json si 3e arg --ref=<label>
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const [label, fixes = 'none'] = process.argv.slice(2);
const refArg = process.argv.find((a) => a.startsWith('--ref='));
mkdirSync(join(HERE, 'out', 'ab'), { recursive: true });
const f = join(HERE, 'out', 'ab', label + '.json');
const r = spawnSync(process.execPath, [join(HERE, 'run_loop.mjs'), '--dry', f], { env: { ...process.env, POLICY_FIXES: fixes }, stdio: 'inherit' });
if (r.status) process.exit(r.status);
const R = JSON.parse(readFileSync(f, 'utf8'));
const ARM = 'intention_mensongere';
const pct = (w) => `${(w.rate * 100).toFixed(1)}% (${w.k}/${w.n})`;
const sumr = (g) => `rappel ${pct(g.metrics.rappel_alerte)} | FA critical ${pct(g.metrics.fausse_alerte_critical)} | warn+critical ${pct(g.metrics.fausse_alerte_warn_ou_critical)} | critical-rappel ${pct(g.metrics.rappel_critical)} | inconnu ${g.counts.inconnu}`;
console.log(`[${label}] fixes=${fixes}`);
console.log('  plancher     : ' + sumr(R.groups.sans_intention));
console.log('  final(mens.) : ' + sumr(R.groups[ARM]));
console.log('  final(honn.) : ' + sumr(R.groups.intention_honnete));
if (refArg) {
  const ref = JSON.parse(readFileSync(join(HERE, 'out', 'ab', refArg.slice(6) + '.json'), 'utf8'));
  const m = new Map(ref.cases.map((c) => [c.id, c]));
  const diffs = [];
  for (const c of R.cases) for (const a of ['sans_intention', ARM, 'intention_honnete']) { const o = m.get(c.id).levels[a]; if (o !== c.levels[a]) diffs.push(`${c.id} [${c.label}, att.${c.expected}] ${a}: ${o}->${c.levels[a]}`); }
  console.log(`  diff vs ${refArg.slice(6)} : ${diffs.length} changement(s) de verdict`);
  for (const d of diffs) console.log('    ' + d);
}

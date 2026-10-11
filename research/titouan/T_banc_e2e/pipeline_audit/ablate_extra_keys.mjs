// pipeline_audit/ablate_extra_keys.mjs - lecture seule. Pour les cas `full` en baisse, retire une clé de `extra` à la fois (extra = contexte du banc) et compte les remontées.
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const M = await import(new URL('../pipeline/measure.mjs', import.meta.url).href);
const { readCases, productInput, fullFacts, atCaseTime, D } = M;
const { makeEvaluatePlus, benchLevel } = await import(new URL('../pipeline/evaluate_plus.mjs', import.meta.url).href);
const run = makeEvaluatePlus(D);
const RK = { ok: 0, unknown: 0.5, warn: 1, critical: 2 }; const rk = (l) => RK[l] ?? 0.5;
const rows = readFileSync(join(HERE, 'out', 'cases.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => !r.err && r.full && rk(r.full.level) < rk(r.full.pproduct || r.product));
const files = readFileSync(join(HERE, 'FILES.txt'), 'utf8').trim().split(/\s+/);
const byKey = new Map(); for (const f of files) for (const x of readCases(resolve(HERE, '..', f))) if (x.c) byKey.set(x.c.id ?? x.id, x.c);
const syn = {}; const famCount = {};
for (const r of rows) {
  const c = byKey.get(r.id); if (!c) continue;
  famCount[r.family] = (famCount[r.family] || 0) + 1;
  const base = fullFacts(c);
  for (const k of Object.keys(base.extra)) {
    const e = { ...base.extra }; delete e[k];
    const { body, local } = productInput(c, { known: true });
    const v = await atCaseTime(c, () => run(body, local, { live: { ...base, extra: e }, intent: c.intent || {} }));
    if (rk(benchLevel(v)) >= rk(r.full.pproduct)) syn[k] = (syn[k] || 0) + 1;
  }
}
console.log('familles', JSON.stringify(famCount)); console.log('clé retirée -> cas remontés au niveau produit', JSON.stringify(syn));

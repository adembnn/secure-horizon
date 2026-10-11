// pipeline_audit/audit_lowered.mjs - lecture seule. Rejoue des jeux DEV via measure.mjs (runCase) dans plusieurs modes et écrit un JSONL détaillé
// (un enregistrement par cas : niveau, chemin, signaux des détecteurs, baisses) dans pipeline_audit/out/.
// Usage : node pipeline_audit/audit_lowered.mjs [--modes=detectors,live,full,...] [--out=out] fichier.jsonl ...
// Les modes sont ceux de measure.mjs (suffixes +known +intent +premise acceptés). 'product' est toujours calculé.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const M = await import(new URL('../pipeline/measure.mjs', import.meta.url).href);
const { readCases, runCase, familyKey } = M;
const args = process.argv.slice(2);
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const outDir = resolve(HERE, opt('out', 'out'));
const modes = opt('modes', 'detectors,live').split(',').filter(Boolean);
const files = args.filter((a) => !a.startsWith('--'));
mkdirSync(outDir, { recursive: true });
const mini = (r) => r.v && r.v.plus ? { level: r.level, path: r.v.plus.path, base: r.v.plus.base, relaxed: !!r.v.plus.relaxedByFacts, pproduct: r.v.plus.product, lowered: (r.v.plus.loweredBy || []).map((l) => ({ by: l.by, from: l.from, to: l.to, why: l.why })), signals: (r.v.plus.signals || []).map((s) => `${s.by}:${s.code}:${s.severity}`), errors: r.v.plus.errors } : { level: r.level };
const lines = [];
for (const file of files) {
  if (/V2_TEST|attacks[\\/]TEST/i.test(file)) { console.error('Refus', file); process.exit(2); }
  const name = file.split(/[\\/]/).pop();
  for (const { c, id, src } of readCases(file)) {
    if (!c) continue;
    const label = c.label === 'malveillant' ? 'arnaque' : c.label === 'benin' ? 'benin' : 'autre:' + String(c.label);
    const rec = { file: name, id, family: familyKey(src, c), label };
    try { const p = await runCase(c, 'product'); rec.product = p.level; rec.fiche_p = p.v && p.v.fiche; rec.codes_p = p.v && p.v.codes; for (const m of modes) rec[m] = mini(await runCase(c, m)); } catch (e) { rec.err = String(e.message || e); }
    lines.push(rec);
  }
}
const f = join(outDir, `cases_${modes.join('_').replace(/[^\w+]/g, '')}.jsonl`);
writeFileSync(f, lines.map((x) => JSON.stringify(x)).join('\n') + '\n');
console.log('ecrit', lines.length, 'enregistrements dans', f);

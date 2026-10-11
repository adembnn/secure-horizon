import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const WORK = join(dirname(fileURLToPath(import.meta.url)), 'work');
const A = await import(pathToFileURL(join(WORK, 'run', 'arms.mjs')).href);
const P = await import(pathToFileURL(join(WORK, 'run', 'policy.mjs')).href);
const { compare } = await import(pathToFileURL(join(WORK, 'engine', 'vendor', 'compare.ts')).href);
const id = process.argv[2];
for (const l of readFileSync(join(WORK, 'pipeline/grille/REGLAGE.jsonl'), 'utf8').split('\n')) { if (!l.includes(`"${id}"`)) continue; const c0 = JSON.parse(l);
  const c = A.normalizeCase({ ...c0, label: 'g', intent: { declaredAt: 1760000000000 } }); const p = A.prepare(c);
  const it = JSON.parse(process.argv[3]);
  let adem; try { adem = compare(it, p.eff); } catch (e) { console.log('compare throw', e.message); }
  console.log('adem', JSON.stringify(adem && adem.reasons), adem && adem.level);
  const r = P.applyPolicy({ eff: p.eff, adem, ctx: p.ctx, intent: it, request: c.request });
  console.log(JSON.stringify({ level: r.level, notes: r.notes, reasons: r.reasons.map(x => x.code + '/' + x.sev) }));
}

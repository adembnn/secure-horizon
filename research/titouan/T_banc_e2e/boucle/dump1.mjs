// boucle/dump1.mjs <id> : effets décodés + raisons pour un cas de la grille (diagnostic)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const WORK = join(dirname(fileURLToPath(import.meta.url)), 'work');
const A = await import(pathToFileURL(join(WORK, 'run', 'arms.mjs')).href);
const ic = await import(pathToFileURL(join(WORK, 'pipeline', 'intent_clef.mjs')).href);
const id = process.argv[2];
for (const f of ['pipeline/grille/REGLAGE.jsonl']) for (const l of readFileSync(join(WORK, f), 'utf8').split('\n')) { if (!l.includes(`"${id}"`)) continue; const c0 = JSON.parse(l);
  const c = A.normalizeCase({ ...c0, label: 'g', intent: { declaredAt: 1760000000000 } }); const p = A.prepare(c);
  const cls = await ic.classifyIntent(c0.text, { provider: 'keyword', contacts: c.context.address_book, declaredAt: 1760000000000 });
  console.log(JSON.stringify({ text: c0.text, claim: c0.claim, effect: c0.effect, truth: c0.truth, rel: c0.relation, cls: { classified: cls.classified, kind: cls.kind, reason: cls.reason, extracted: cls.extracted, details: cls.details } }));
  console.log('eff', JSON.stringify({ out: p.eff.outgoing, app: p.eff.approvals, inc: p.eff.incoming, flags: p.eff.risk_flags.map((x) => x.code + '/' + x.severity), svc: p.eff.service, opaque: p.eff.opaque }, (k, v) => typeof v === 'bigint' ? String(v) : v).slice(0, 1500));
  const it = cls.classified ? cls.intent : cls.details;
  for (const arm of ['none']) console.log('none', JSON.stringify(await A.runArm(p, 'none', { detectors: true, premiseCap: true, guard: true })));
  console.log('full', JSON.stringify(await A.runArm({ ...p, c: { ...p.c, intent: it } }, 'full', { detectors: true, premiseCap: true, guard: true })));
}

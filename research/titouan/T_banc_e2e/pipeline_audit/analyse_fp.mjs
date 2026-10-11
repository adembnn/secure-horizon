// pipeline_audit/analyse_fp.mjs : faux positifs (bénins relevés par les détecteurs), par détecteur, code et famille. Lit out/cases.jsonl.
// Usage : node pipeline_audit/analyse_fp.mjs [fichier-filtre ex. V2_DEV_norm.jsonl]
import { readFileSync } from 'node:fs';
const RK = { ok: 0, unknown: 0.5, warn: 1, critical: 2 }; const rk = (l) => RK[l] ?? 0.5;
const filt = process.argv[2];
const rows = readFileSync(new URL('./out/cases.jsonl', import.meta.url), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => !r.err && r.label === 'benin' && (!filt || r.file === filt));
const top = (m, n = 10) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}=${v}`).join(' ; ');
console.log('filtre', filt || '(tous)', 'bénins', rows.length);
for (const mode of ['detectors', 'live', 'detectors+known+intent+premise', 'live+known+intent+premise']) {
  const det = {}, code = {}, fam = {}, cw = {}; let c0 = 0, c1 = 0, w1 = 0, up = 0, upc = 0, upw = 0, nosig = 0;
  for (const r of rows) {
    const x = r[mode]; const ref = x.pproduct || r.product;
    if (ref === 'critical') c0++; if (x.level === 'critical') c1++; if (x.level === 'warn') w1++;
    if (rk(x.level) > rk(ref)) {
      up++; x.level === 'critical' ? upc++ : upw++;
      const sig = (x.signals || []).filter((s) => s.endsWith(':' + x.level));
      const ds = [...new Set(sig.map((s) => s.split(':')[0]))];
      if (!ds.length) { nosig++; }
      for (const d of ds) det[(x.level === 'critical' ? 'C ' : 'W ') + d] = (det[(x.level === 'critical' ? 'C ' : 'W ') + d] || 0) + 1;
      for (const cd of [...new Set(sig.map((s) => s.split(':').slice(0, 2).join(':')))]) code[(x.level === 'critical' ? 'C ' : 'W ') + cd] = (code[(x.level === 'critical' ? 'C ' : 'W ') + cd] || 0) + 1;
      fam[(x.level === 'critical' ? 'C ' : 'W ') + r.family] = (fam[(x.level === 'critical' ? 'C ' : 'W ') + r.family] || 0) + 1;
    }
  }
  console.log(`\n[${mode}] critical produit=${c0} critical plus=${c1} warn plus=${w1} | relevés=${up} (->critical ${upc}, ->warn ${upw}, sans signal détecteur ${nosig})`);
  console.log(' par détecteur :', top(det)); console.log(' par code      :', top(code)); console.log(' par famille   :', top(fam));
}

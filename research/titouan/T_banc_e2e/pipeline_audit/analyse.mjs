// pipeline_audit/analyse.mjs : lit out/cases.jsonl (produit par audit_lowered.mjs) et sort les tableaux de AUDIT.md.
// Usage : node pipeline_audit/analyse.mjs [--list=<mode>]
import { readFileSync } from 'node:fs';
const RK = { ok: 0, unknown: 0.5, warn: 1, critical: 2 };
const rk = (l) => RK[l] ?? 0.5;
const rows = readFileSync(new URL('./out/cases.jsonl', import.meta.url), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => !r.err);
for (const r of rows) for (const m of ['detectors','live','full','detectors+known+intent+premise','live+known+intent+premise']) r['ref_' + m] = (r[m] && r[m].pproduct) || r.product; // référence = verdict produit seul avec EXACTEMENT les mêmes entrées (known, intent chaîne)
const MODES = ['detectors', 'live', 'full', 'detectors+known+intent+premise', 'live+known+intent+premise'];
const cnt = (m, k, n = 1) => (m[k] = (m[k] || 0) + n);
const labs = ['arnaque', 'benin', 'autre'];
const labOf = (r) => (r.label.startsWith('autre') ? 'autre' : r.label);
const listMode = (process.argv.find((a) => a.startsWith('--list=')) || '').slice(7);
console.log('cas', rows.length, 'autres labels', JSON.stringify(rows.reduce((m, r) => (r.label.startsWith('autre') && cnt(m, r.label), m), {})));
for (const mode of MODES) {
  console.log('\n=== mode', mode);
  for (const lab of labs) {
    const R = rows.filter((r) => labOf(r) === lab);
    const low = R.filter((r) => rk(r[mode].level) < rk(r['ref_' + mode])), up = R.filter((r) => rk(r[mode].level) > rk(r['ref_' + mode]));
    const pc = R.filter((r) => r.product === 'critical').length, mc = R.filter((r) => r[mode].level === 'critical').length;
    console.log(`${lab}: n=${R.length} critical produit=${pc} critical plus=${mc} baisses=${low.length} hausses=${up.length}`);
    const by = {};
    for (const r of low) { const x = r[mode]; const key = `${r['ref_' + mode]}->${x.level} path=${x.path} relaxed=${x.relaxed} lowered=${x.lowered.map((l) => l.by + ':' + l.from + '>' + l.to).join('+') || '-'}`; (by[key] ??= []).push(r.file.replace(/\.jsonl|_norm/g, '') + '#' + r.id); }
    for (const [k, v] of Object.entries(by)) console.log('   ', k, v.length, v.slice(0, 12).join(' '));
    if (listMode === mode && lab === 'arnaque') for (const r of low) console.log('LISTE', r.file, r.id, r.family, r['ref_' + mode], '->', r[mode].level, JSON.stringify(r[mode].lowered), r[mode].signals.join(','));
  }
  // lowered flagged anywhere (even when final >= product)
  const lw = rows.filter((r) => r[mode].lowered.length);
  console.log('cas avec loweredBy non vide:', lw.length, 'dont arnaque', lw.filter((r) => r.label === 'arnaque').length);
}
for (const mode of ['detectors', 'live', 'full', 'detectors+known+intent+premise', 'live+known+intent+premise']) {
  const crit = {}, warn = {}; const R = rows.filter((r) => r.label === 'benin');
  let up = 0, upCrit = 0, upWarn = 0;
  for (const r of R) {
    if (rk(r[mode].level) > rk(r['ref_' + mode])) {
      up++; const lvl = r[mode].level; lvl === 'critical' ? upCrit++ : upWarn++;
      const sig = (r[mode].signals || []).filter((s) => s.endsWith(':' + lvl));
      const tgt = lvl === 'critical' ? crit : warn;
      const codes = [...new Set(sig.map((s) => s.split(':').slice(0, 2).join(':')))];
      if (!codes.length) cnt(tgt, '(sans signal ' + r[mode].path + ')');
      for (const cd of codes) cnt(tgt, cd);
    }
  }
  const top = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}=${v}`).join(' ; ');
  console.log(`\n=== bénins relevés, mode ${mode}: bénins=${R.length} critical produit=${R.filter((r) => r.product === 'critical').length} critical plus=${R.filter((r) => r[mode].level === 'critical').length} warn plus=${R.filter((r) => r[mode].level === 'warn').length} relevés=${up} (->critical ${upCrit}, ->warn ${upWarn})`);
  console.log(' top critical:', top(crit)); console.log(' top warn:', top(warn));
}

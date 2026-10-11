// pipeline_audit/analyse_vs_serveur.mjs : compare le niveau de evaluatePlus au verdict de server.evaluate SEUL (mode `product` de measure.mjs, sans known_protocols.json).
// evaluatePlus injecte pipeline/known_protocols.json dans local.knownSpenders AVANT de calculer son "produit" interne (plus.product). Cet écart est invisible si on compare à plus.product.
// Usage : node pipeline_audit/analyse_vs_serveur.mjs      (lit out/cases.jsonl)
import { readFileSync } from 'node:fs';
const RK = { ok: 0, unknown: 0.5, warn: 1, critical: 2 }; const rk = (l) => RK[l] ?? 0.5;
const rows = readFileSync(new URL('./out/cases.jsonl', import.meta.url), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => !r.err);
const lab = (r) => (r.label.startsWith('autre') ? 'autre' : r.label);
for (const mode of ['detectors', 'live']) {
  console.log(`\n=== ${mode} : niveau_plus < verdict server.evaluate seul`);
  for (const L of ['arnaque', 'benin', 'autre']) {
    const R = rows.filter((r) => lab(r) === L);
    const low = R.filter((r) => rk(r[mode].level) < rk(r.product));
    const by = {};
    for (const r of low) { const k = `${r.product}->${r[mode].level} (produit interne ${r[mode].pproduct}) ${r.family}`; (by[k] ??= []).push(r.file.replace(/\.jsonl|_norm/g, '') + '#' + r.id); }
    console.log(`${L}: n=${R.length} baisses=${low.length}`);
    for (const [k, v] of Object.entries(by).sort((a, b) => b[1].length - a[1].length).slice(0, 12)) console.log('   ', k, v.length, v.slice(0, 5).join(' '));
  }
}

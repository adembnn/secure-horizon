// pipeline_audit/ablate_full.mjs - lecture seule. Pour les cas où le mode `full` (tous les faits du banc + intention riche) donne un niveau PLUS BAS que le produit seul,
// retire un par un les morceaux du contexte pour trouver lequel provoque la baisse.
// Usage : node pipeline_audit/ablate_full.mjs                (cas de out/cases.jsonl ; écrit out/ablate_full.json)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const M = await import(new URL('../pipeline/measure.mjs', import.meta.url).href);
const { readCases, productInput, fullFacts, atCaseTime, D } = M;
const { makeEvaluatePlus, benchLevel } = await import(new URL('../pipeline/evaluate_plus.mjs', import.meta.url).href);
const run = makeEvaluatePlus(D);
const RK = { ok: 0, unknown: 0.5, warn: 1, critical: 2 };
const rk = (l) => RK[l] ?? 0.5;
const rows = readFileSync(join(HERE, 'out', 'cases.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => !r.err && r.full && rk(r.full.level) < rk(r.full.pproduct || r.product));
const files = readFileSync(join(HERE, 'FILES.txt'), 'utf8').trim().split(/\s+/);
const byKey = new Map();
for (const f of files) for (const x of readCases(resolve(HERE, '..', f))) if (x.c) byKey.set(x.c.id ?? x.id, x.c);
const DROPS = {
  complet: (F, I) => [F, I],
  sans_origin_extra: (F, I) => { const e = { ...F.extra }; delete e.origin; return [{ ...F, extra: e }, I]; },
  sans_extra: (F, I) => [{ ...F, extra: {} }, I],
  sans_facts_contreparties: (F, I) => [{ ...F, facts: {} }, I],
  sans_tokenInfo: (F, I) => [{ ...F, tokenInfo: {}, extra: { ...F.extra, token_info: {} } }, I],
  sans_tokenMeta: (F, I) => [{ ...F, tokenMeta: {} }, I],
  sans_sharePct: (F, I) => [{ ...F, sharePct: undefined }, I],
  sans_intention_riche: (F, I) => [F, {}],
};
const out = {};
for (const r of rows) {
  const c = byKey.get(r.id); if (!c) continue;
  const res = {};
  for (const [n, f] of Object.entries(DROPS)) {
    const { body, local } = productInput(c, { known: true });
    const [F, I] = f(fullFacts(c), c.intent || {});
    const v = await atCaseTime(c, () => run(body, local, { live: F, intent: I }));
    res[n] = benchLevel(v);
  }
  out[r.id] = { label: r.label, produit: r.full.pproduct, ...res };
}
writeFileSync(join(HERE, 'out', 'ablate_full.json'), JSON.stringify(out, null, 1));
// synthèse : combien de cas remontent au niveau produit quand on retire X
const syn = {};
for (const [id, o] of Object.entries(out)) for (const [n, l] of Object.entries(o)) { if (n === 'label' || n === 'produit' || n === 'complet') continue; const s = (syn[n] ??= { arnaque: 0, benin: 0, autre: 0 }); if (rk(l) >= rk(o.produit)) s[o.label.startsWith('autre') ? 'autre' : o.label]++; }
console.log('cas en baisse (full):', Object.keys(out).length);
console.log('cas ramenés au niveau produit en retirant le morceau :', JSON.stringify(syn));
console.log('arnaques :', JSON.stringify(Object.entries(out).filter(([, o]) => o.label === 'arnaque')));

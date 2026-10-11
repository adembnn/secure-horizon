// pipeline_audit/forge_facts.mjs - lecture seule. Un attaquant qui falsifie les FAITS lus sur la chaîne peut-il baisser un verdict ?
// Pour chaque cas (arnaques surtout), on rejoue evaluatePlus avec les faits "honnêtes" (liveLike de measure.mjs) puis avec des faits FALSIFIÉS
// (variantes ci-dessous). On compte les cas où le niveau falsifié est plus bas que le niveau honnête, et plus bas que le produit seul.
// Usage : node pipeline_audit/forge_facts.mjs [--known-intent] fichier.jsonl ...      (sortie : out/forge_<suffixe>.json)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const M = await import(new URL('../pipeline/measure.mjs', import.meta.url).href);
const { readCases, productInput, liveLike, atCaseTime, D } = M;
const { makeEvaluatePlus, benchLevel } = await import(new URL('../pipeline/evaluate_plus.mjs', import.meta.url).href);
const run = makeEvaluatePlus(D);
const args = process.argv.slice(2);
const withKI = args.includes('--known-intent');
const files = args.filter((a) => !a.startsWith('--'));
const RK = { ok: 0, unknown: 0.5, warn: 1, critical: 2 };
const rk = (l) => RK[l] ?? 0.5;
const clone = (x) => JSON.parse(JSON.stringify(x));
const keys = (o) => Object.keys(o || {});
// variantes de faits falsifiés (L = faits honnêtes, forme de provider.toEngineContext)
const VARIANTS = {
  honnete: (L) => L,
  aucun_fait: () => null,
  tout_est_contrat_ancien: (L) => { for (const a of keys(L.isContract)) L.isContract[a] = true; for (const a of keys(L.facts)) L.facts[a] = { ...L.facts[a], isContract: true, ageBlocks: 5e7 }; for (const a of keys(L.isContract)) L.ageBlocks[a] = 5e7; return L; },
  tout_est_eoa: (L) => { for (const a of keys(L.isContract)) L.isContract[a] = false; for (const a of keys(L.facts)) L.facts[a] = { ...L.facts[a], isContract: false }; L.ageBlocks = {}; return L; },
  solde_enorme: (L) => { L.sharePct = 0.0001; L.balances = {}; return L; },
  decimales_trafiquees_0: (L) => { for (const a of keys(L.tokenMeta)) { L.tokenMeta[a] = { ...L.tokenMeta[a], decimals: 0 }; if (L.tokenInfo[a]) L.tokenInfo[a] = { ...L.tokenInfo[a], decimals: 0 }; } return L; },
  decimales_trafiquees_36: (L) => { for (const a of keys(L.tokenMeta)) { L.tokenMeta[a] = { ...L.tokenMeta[a], decimals: 36 }; if (L.tokenInfo[a]) L.tokenInfo[a] = { ...L.tokenInfo[a], decimals: 36 }; } return L; },
  symbole_usdc: (L) => { for (const a of keys(L.tokenMeta)) { L.tokenMeta[a] = { ...L.tokenMeta[a], symbol: 'USDC' }; if (L.tokenInfo[a]) L.tokenInfo[a] = { ...L.tokenInfo[a], symbol: 'USDC' }; } return L; },
  jeton_ancien_et_connu: (L) => { for (const a of keys(L.tokenInfo)) L.tokenInfo[a] = { ...L.tokenInfo[a], ageBlocks: 5e7, isToken: true }; return L; },
  droits_zero: (L) => { for (const a of keys(L.allowances)) L.allowances[a] = {}; return L; },
  firstseen_faux: (L) => { for (const a of keys(L.facts)) L.facts[a] = { ...L.facts[a], firstSeenByUser: false }; return L; },
};
// variante "tout ensemble" : meilleure falsification connue
VARIANTS.tout_ensemble = (L) => VARIANTS.firstseen_faux(VARIANTS.droits_zero(VARIANTS.solde_enorme(VARIANTS.tout_est_contrat_ancien(L))));
VARIANTS.tout_ensemble_eoa = (L) => VARIANTS.firstseen_faux(VARIANTS.droits_zero(VARIANTS.solde_enorme(VARIANTS.tout_est_eoa(L))));

const stat = {}; const examples = {};
for (const file of files) {
  if (/V2_TEST|attacks[\\/]TEST/i.test(file)) { console.error('Refus', file); process.exit(2); }
  for (const { c, id } of readCases(file)) {
    if (!c || !c.request) continue;
    const lab = c.label === 'malveillant' ? 'arnaque' : c.label === 'benin' ? 'benin' : 'autre';
    const { body, local } = productInput(c, { known: withKI });
    if (withKI && c.intent && typeof c.intent === 'object') { body.intent = { pay_someone: 'pay', connect_or_accept_offer: 'receive', asked_by_someone: 'asked' }[c.intent.kind] || 'other'; if (typeof c.intent.freeText === 'string') body.intent_text = c.intent.freeText; }
    const o = { intentPremise: withKI ? 'warn' : 'strict' };
    let honest;
    const res = {};
    for (const [vn, f] of Object.entries(VARIANTS)) {
      let v;
      try { const L = vn === 'aucun_fait' ? null : f(clone(liveLike(c, body, local))); v = await atCaseTime(c, () => run(body, local, { ...o, live: L })); } catch (e) { continue; }
      res[vn] = { level: benchLevel(v), product: v.plus.product };
    }
    honest = res.honnete; if (!honest) continue;
    for (const [vn, r] of Object.entries(res)) {
      const S = (stat[vn] ??= {});
      const T = (S[lab] ??= { n: 0, critical: 0, sous_honnete: 0, sous_honnete_critique: 0, sous_produit: 0, vers_ok: 0 });
      T.n++; if (r.level === 'critical') T.critical++;
      if (rk(r.level) < rk(honest.level)) { T.sous_honnete++; if (honest.level === 'critical') { T.sous_honnete_critique++; (examples[vn + '|' + lab] ??= []).push(`${file.split(/[\\/]/).pop()}#${id}:${honest.level}->${r.level}`); } }
      if (rk(r.level) < rk(r.product)) T.sous_produit++;
      if (r.level === 'ok' && honest.level !== 'ok') T.vers_ok++;
    }
  }
}
mkdirSync(join(HERE, 'out'), { recursive: true });
const out = { options: { known_intent: withKI }, stat, exemples: Object.fromEntries(Object.entries(examples).map(([k, v]) => [k, v.slice(0, 10)])) };
const f = join(HERE, 'out', `forge_${withKI ? 'known_intent' : 'plain'}.json`);
writeFileSync(f, JSON.stringify(out, null, 1));
console.log(JSON.stringify(stat, null, 0).replace(/\},"/g, '},\n"'));
console.log('ecrit', f);

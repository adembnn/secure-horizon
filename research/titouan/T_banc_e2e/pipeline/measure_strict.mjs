// pipeline/measure_strict.mjs - avant/après la règle stricte : la couche du produit ne peut qu'AGGRAVER un verdict.
// Usage : node pipeline/measure_strict.mjs <cases.jsonl> [...] [--modes=product,detectors,live,...] [--out=fichier.json] [--tsv=fichier.tsv]
// Les chemins sont lus depuis la racine du banc (ROOT) ou le dossier courant. Refuse V2_TEST et attacks/TEST.jsonl. N'écrit que --out / --tsv.
// Pour chaque mode M et chaque cas : niveau(M) comparé à
//   - ref  : server.evaluate seul, mêmes entrées que M (mêmes contacts, mêmes protocoles passés à la main, mode `product`/`product+known`), SANS known_protocols.json ;
//   - strict : server.evaluate seul sans aucune liste (mode `product`).
// Compteurs : arnaques ratées, fausses alertes, baisses sous ref (par étiquette), baisses sous strict, `ok` produit par la couche alors que ref n'est pas `ok`.
import { writeFileSync } from 'node:fs';
import { resolve, isAbsolute, join } from 'node:path';
import { ROOT, readCases, runCase, D } from './measure.mjs';

const args = process.argv.slice(2);
const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const files = args.filter((a) => !a.startsWith('--')).map((f) => (isAbsolute(f) ? f : resolve(f)));
const modes = (opt('modes') || 'detectors,live').split(',').filter(Boolean);
if (!files.length) { console.error('Usage : node pipeline/measure_strict.mjs <fichier.jsonl> [...] [--modes=...] [--out=f.json] [--tsv=f.tsv]'); process.exit(2); }
for (const f of files) if (/V2_TEST|attacks[\\/]TEST/i.test(f)) { console.error('Refus : jeu gelé ' + f); process.exit(2); }
const RK = { ok: 0, unknown: 0.5, warn: 1, critical: 2 };
const refModeOf = (m) => (m.includes('+known') || m === 'full' ? 'product+known' : 'product');

const stats = {}; const tsv = [];
const S = (m) => (stats[m] ??= { n: 0, malveillant: 0, benin: 0, autre: 0, ratees: 0, fausses_alertes: 0, ok_total: 0,
  sous_ref: { malveillant: 0, benin: 0, autre: 0 }, sous_strict: { malveillant: 0, benin: 0, autre: 0 }, ok_par_couche: 0, hausses: 0, erreurs: 0 });
const t0 = Date.now();
for (const file of files) {
  const cases = readCases(file);
  for (const { c, id } of cases) {
    if (!c || !c.request || typeof c.request !== 'object') continue;
    const lab = c.label === 'malveillant' ? 'malveillant' : c.label === 'benin' ? 'benin' : 'autre';
    const refs = {};
    const refLevel = async (rm) => (refs[rm] ??= (await runCase(c, rm).catch(() => ({ level: 'unknown' }))).level);
    const strict = await refLevel('product');
    for (const m of modes) {
      const s = S(m); s.n++; s[lab]++;
      let r; try { r = await runCase(c, m); } catch { s.erreurs++; r = { level: 'unknown', v: null }; }
      if (r.v && r.v.plus && r.v.plus.errors && r.v.plus.errors.length) s.erreurs++;
      const ref = m === 'product' ? strict : await refLevel(refModeOf(m));
      if (lab === 'malveillant' && r.level !== 'critical') s.ratees++;
      if (lab === 'benin' && r.level === 'critical') s.fausses_alertes++;
      if (r.level === 'ok') s.ok_total++;
      if (RK[r.level] < RK[ref]) { s.sous_ref[lab]++; tsv.push([file.split(/[\\/]/).pop(), id, m, lab, 'sous_ref', ref + '>' + r.level, (r.v && r.v.plus && (r.v.plus.loweredBy || []).map((l) => l.by).join('+')) || ''].join('\t')); }
      if (RK[r.level] < RK[strict]) { s.sous_strict[lab]++; tsv.push([file.split(/[\\/]/).pop(), id, m, lab, 'sous_strict', strict + '>' + r.level, ''].join('\t')); }
      if (r.level === 'ok' && ref !== 'ok') s.ok_par_couche++;
      if (RK[r.level] > RK[ref]) s.hausses++;
    }
  }
  console.error(`${file.split(/[\\/]/).pop()} fait (${Math.round((Date.now() - t0) / 1000)} s)`);
}
const out = { modes, files: files.map((f) => f.split(/[\\/]/).pop()), stats };
if (opt('out')) writeFileSync(opt('out'), JSON.stringify(out, null, 1));
if (opt('tsv')) writeFileSync(opt('tsv'), tsv.join('\n') + '\n');
console.log('mode | n | arnaques | ratées | bénins | fausses alertes | sous ref (arn/bén/autre) | sous strict (arn/bén/autre) | ok par la couche | hausses | erreurs');
for (const [m, s] of Object.entries(stats)) console.log(`${m} | ${s.n} | ${s.malveillant} | ${s.ratees} | ${s.benin} | ${s.fausses_alertes} | ${s.sous_ref.malveillant}/${s.sous_ref.benin}/${s.sous_ref.autre} | ${s.sous_strict.malveillant}/${s.sous_strict.benin}/${s.sous_strict.autre} | ${s.ok_par_couche} | ${s.hausses} | ${s.erreurs}`);

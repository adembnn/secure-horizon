// Mesure de monotonie : « ajouter de l'information d'intention ne baisse JAMAIS un verdict ».
// Pour chaque cas des jeux DEV (attacks/DEV.jsonl), attacks_public/PUBLIC.jsonl, redteam/V2_DEV_norm.jsonl (jamais V2_TEST, jamais attacks/TEST.jsonl) :
// niveau sans intention (none), avec le type seul (type), avec l'intention détaillée (full). Violation = un niveau plus bas qu'un bras qui a MOINS d'information.
//   node run/mesure_monotonie.mjs [--detectors] [--guard] [--list] [--json=out.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepare, runArm, normalizeCase, RANK } from './arms.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const JEUX = ['attacks/DEV.jsonl', 'attacks_public/PUBLIC.jsonl', 'redteam/V2_DEV_norm.jsonl'];
const args = process.argv.slice(2);
const OPT = { detectors: args.includes('--detectors'), guard: args.includes('--guard'), premiseCap: args.includes('--premise-cap'), list: args.includes('--list'), json: (args.find((a) => a.startsWith('--json=')) || '').slice(7) };

export async function mesure(files = JEUX, opts = {}) {
  const res = { opts, jeux: {}, violations: [] };
  for (const f of files) {
    if (/TEST|V2_TEST/.test(f)) throw new Error('jeu scellé refusé : ' + f);
    const lines = readFileSync(join(ROOT, f), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
    const S = { n: 0, none_to_type: 0, type_to_full: 0, none_to_full: 0, scam_lost_type: 0, scam_lost_full: 0, scam_gain_type: 0, scam_gain_full: 0, scams: 0, benins: 0, miss_none: 0, miss_type: 0, miss_full: 0, fa_none: 0, fa_type: 0, fa_full: 0 };
    for (const line of lines) {
      let c; try { c = normalizeCase(JSON.parse(line)); } catch { continue; }
      if (!c.request) continue;
      let prep; try { prep = prepare(c); } catch { continue; }
      const L = {};
      for (const arm of ['none', 'type', 'full']) L[arm] = (await runArm(prep, arm, opts)).level;
      if (L.none === 'unknown') continue;
      S.n++;
      const lo = (a, b) => RANK[L[b]] < RANK[L[a]];
      const scam = c.label === 'malveillant';
      if (scam) { S.scams++; for (const a of ['none', 'type', 'full']) if (L[a] !== 'critical') S['miss_' + a]++; } else if (c.label === 'benin') { S.benins++; for (const a of ['none', 'type', 'full']) if (L[a] === 'critical') S['fa_' + a]++; }
      if (lo('none', 'type')) { S.none_to_type++; if (scam && L.none === 'critical') S.scam_lost_type++; res.violations.push({ jeu: f, id: c.id, arms: 'none>type', ...L, label: c.label, famille: c.family }); }
      if (lo('type', 'full')) { S.type_to_full++; res.violations.push({ jeu: f, id: c.id, arms: 'type>full', ...L, label: c.label, famille: c.family }); }
      if (lo('none', 'full')) { S.none_to_full++; if (scam && L.none === 'critical') S.scam_lost_full++; }
      if (scam && L.none !== 'critical' && L.type === 'critical') S.scam_gain_type++;
      if (scam && L.none !== 'critical' && L.full === 'critical') S.scam_gain_full++;
    }
    res.jeux[f] = S;
  }
  return res;
}
if (import.meta.url === new URL(process.argv[1], 'file:///').href || process.argv[1]?.endsWith('mesure_monotonie.mjs')) {
  const r = await mesure(JEUX, { detectors: OPT.detectors, guard: OPT.guard, premiseCap: OPT.premiseCap });
  const tot = { n: 0, none_to_type: 0, type_to_full: 0, none_to_full: 0, scam_lost_type: 0, scam_lost_full: 0, scam_gain_type: 0, scam_gain_full: 0, scams: 0, benins: 0, miss_none: 0, miss_type: 0, miss_full: 0, fa_none: 0, fa_type: 0, fa_full: 0 };
  for (const [f, S] of Object.entries(r.jeux)) { console.log(f, JSON.stringify(S)); for (const k in tot) tot[k] += S[k]; }
  console.log('TOTAL', JSON.stringify(tot), JSON.stringify({ detectors: OPT.detectors, guard: OPT.guard, premiseCap: OPT.premiseCap }));
  if (OPT.list) for (const v of r.violations.slice(0, 40)) console.log(JSON.stringify(v));
  if (OPT.json) writeFileSync(OPT.json, JSON.stringify(r, null, 1));
}

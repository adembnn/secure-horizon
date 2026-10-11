// Non-régression sur DEV, attacks_public et redteam/V2_DEV_norm.jsonl (jamais V2_TEST, jamais attacks/TEST.jsonl).
// Pour une version du moteur (--root), niveau de chaque cas sur deux chaînes et trois bras d'intention :
//   noyau    : moteur + politique (sans détecteurs) ; bras none / type / full
//   produit  : avec détecteurs, plafond de prémisse et garde de monotonie ; bras none / type / full
//   node attacks_familles/regression.mjs --root=<racine> --out=niveaux.json
//   node attacks_familles/regression.mjs --diff=avant.json,apres.json      (arnaques ratées et fausses alertes avant / après, cas qui changent)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), LIVE = join(HERE, '..');
const args = process.argv.slice(2);
const opt = (n) => (args.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const JEUX = ['attacks/DEV.jsonl', 'attacks_public/PUBLIC.jsonl', 'redteam/V2_DEV_norm.jsonl'];
const CHAINES = { noyau: { detectors: false }, produit: { detectors: true, premiseCap: true, guard: true } };

async function niveaux(root) {
  const A = await import(pathToFileURL(join(root, 'run', 'arms.mjs')).href);
  const out = {};
  for (const f of JEUX) {
    if (/TEST/.test(f)) throw new Error('jeu scellé refusé');
    for (const line of readFileSync(join(LIVE, f), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())) {
      let c; try { c = A.normalizeCase(JSON.parse(line)); } catch { continue; }
      if (!c.request) continue;
      let prep; try { prep = A.prepare(c); } catch { continue; }
      const L = {};
      for (const [ch, o] of Object.entries(CHAINES)) for (const arm of ['none', 'type', 'full']) L[ch + '_' + arm] = (await A.runArm(prep, arm, o)).level;
      out[f + '#' + c.id] = { label: c.label, family: c.family, L };
    }
  }
  return out;
}
function diff(a, b) {
  const keys = Object.keys(b).filter((k) => a[k]);
  const cols = Object.keys(a[keys[0]].L);
  const res = {};
  for (const col of cols) {
    const S = { scams: 0, benins: 0, miss_avant: 0, miss_apres: 0, fa_avant: 0, fa_apres: 0, perdues: [], gagnees: [], fa_nouvelles: [], fa_retirees: [] };
    for (const k of keys) {
      const x = a[k], y = b[k];
      if (x.label === 'malveillant') {
        S.scams++; const ma = x.L[col] !== 'critical', mb = y.L[col] !== 'critical';
        if (ma) S.miss_avant++; if (mb) S.miss_apres++;
        if (!ma && mb) S.perdues.push(k); if (ma && !mb) S.gagnees.push(k);
      } else if (x.label === 'benin') {
        S.benins++; const fa = x.L[col] === 'critical', fb = y.L[col] === 'critical';
        if (fa) S.fa_avant++; if (fb) S.fa_apres++;
        if (!fa && fb) S.fa_nouvelles.push(k); if (fa && !fb) S.fa_retirees.push(k);
      }
    }
    res[col] = S;
  }
  return res;
}
if (opt('diff')) {
  const [fa, fb] = opt('diff').split(',');
  const a = JSON.parse(readFileSync(fa, 'utf8')), b = JSON.parse(readFileSync(fb, 'utf8'));
  const D = diff(a, b);
  console.log('| chaîne_bras | arnaques | ratées avant | ratées après | bénins | fausses alertes avant | après | arnaques perdues | gagnées | FA nouvelles | FA retirées |\n|---|---|---|---|---|---|---|---|---|---|---|');
  for (const [col, S] of Object.entries(D)) console.log(`| ${col} | ${S.scams} | ${S.miss_avant} | ${S.miss_apres} | ${S.benins} | ${S.fa_avant} | ${S.fa_apres} | ${S.perdues.length} | ${S.gagnees.length} | ${S.fa_nouvelles.length} | ${S.fa_retirees.length} |`);
  const ch = {};
  for (const S of Object.values(D)) for (const k of ['perdues', 'fa_nouvelles']) for (const id of S[k]) ch[id] = (ch[id] || []).concat(k);
  if (Object.keys(ch).length) { console.log('\nCas qui se dégradent :'); for (const [id, w] of Object.entries(ch)) console.log(' ', id, [...new Set(w)].join(','), JSON.stringify(a[id].L), '->', JSON.stringify(b[id].L)); }
  if (opt('json')) writeFileSync(opt('json'), JSON.stringify(D, null, 1));
} else {
  const root = opt('root') ? resolve(opt('root')) : LIVE;
  const N = await niveaux(root);
  writeFileSync(opt('out') || join(HERE, 'niveaux.json'), JSON.stringify(N));
  console.log(root, Object.keys(N).length, 'cas');
}

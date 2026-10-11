// e2e_build.mjs - echantillon de 300 scenarios (attacks_public x144 + 156 de redteam/V2_DEV_norm.jsonl ; JAMAIS V2_TEST)
// et fabrication des "bras" : le meme scenario avec une intention differente.
//   etiquetee    : l'intention structuree du scenario (kind, token, amount, destinataire+adresse)
//   extraite_*   : kind / montant / jeton lus dans une PHRASE par un extracteur (le repli actuel ou la version amelioree)
//   sans         : pas d'intention (plancher objectif du moteur)
// Deux sources de phrase : "gen" (phrase fabriquee depuis l'etiquette du scenario, gabarits DEV) et "orig" (le freeText du banc,
// ecrit par d'autres : source independante des gabarits).
// Usage : node intention_texte/e2e_build.mjs   (ecrit intention_texte/e2e/*.jsonl et e2e/echantillon.json)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mulberry32, hashSeed, buildSentence } from './gen_lib.mjs';
import * as BASE from './clf_baseline.mjs';
import * as IMPR from './clf_improved.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = join(HERE, 'e2e'); mkdirSync(OUT, { recursive: true });
const readJsonl = (p) => readFileSync(p, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
if (/V2_TEST/i.test('redteam/V2_DEV_norm.jsonl attacks_public/PUBLIC.jsonl')) throw new Error('V2_TEST interdit');

const pub = readJsonl(join(ROOT, 'attacks_public', 'PUBLIC.jsonl'));
const dev = readJsonl(join(ROOT, 'redteam', 'V2_DEV_norm.jsonl')).filter((c) => c.intent && c.intent.kind);
const rng = mulberry32(300300);
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const byLabel = (l) => shuffle(dev.filter((c) => c.label === l));
const take = [...byLabel('malveillant').slice(0, 78), ...byLabel('benin').slice(0, 50), ...byLabel('fraude_conforme').slice(0, 14), ...byLabel('ambigu').slice(0, 14)];
const sample = [...pub, ...take];
if (sample.length !== 300) throw new Error('echantillon != 300 : ' + sample.length);

const lc = (s) => (typeof s === 'string' ? s.toLowerCase() : s);
// phrase fabriquee depuis l'intention etiquetee du scenario (verite = le scenario, pas un classifieur)
function sentenceFor(c) {
  const it = c.intent, k = it.kind;
  const r = mulberry32(hashSeed(c.id));
  const lang = r() < 0.5 ? 'fr' : 'en';
  const spec = { type: k, lang, noise: 'noisy', bank: 'dev', hasA: it.amount != null, hasT: it.token != null, ...(it.token ? { token: String(it.token).split('.')[0].toUpperCase() } : {}), ...(it.amount != null ? { amount: it.amount } : {}) };
  if (k === 'pay_someone' && it.counterpartyLabel) spec.recipient = String(it.counterpartyLabel).replace(/\s*\(.*\)\s*$/, '');
  if (spec.token && !/^[A-Z]{2,5}$/.test(spec.token)) delete spec.token;
  return buildSentence(r, spec).text;
}
const KIND_OK = new Set(['pay_someone', 'send_to_my_account', 'buy_or_swap', 'connect_or_accept_offer', 'asked_by_someone']);
function intentFrom(c, text, p, resolveBook) {
  const out = { declaredAt: c.intent.declaredAt, freeText: text };
  if (KIND_OK.has(p.type)) out.kind = p.type;
  if (p.amount != null) out.amount = String(p.amount);
  if (p.token != null) out.token = p.token;
  if (p.type === 'asked_by_someone') out.askedBy = 'other';
  if (resolveBook && p.recipient) {
    const book = (c.context && c.context.address_book) || [];
    const hit = book.find((b) => lc(b.label) && (lc(b.label) === p.recipient || lc(b.label).startsWith(p.recipient + ' ') || lc(b.label).includes(p.recipient)));
    if (hit) { out.counterpartyLabel = hit.label; out.counterpartyAddress = hit.address; }
  }
  return out;
}
const arms = { etiquetee: [], extraite_actuel_gen: [], extraite_actuel_orig: [], extraite_amelioree_gen: [], extraite_amelioree_orig: [] };
const meta = [];
for (const c of sample) {
  const text = sentenceFor(c), orig = c.intent.freeText || '';
  const pBg = await BASE.classify(text), pBo = await BASE.classify(orig), pIg = await IMPR.classify(text), pIo = await IMPR.classify(orig);
  const mk = (intent) => ({ ...c, intent });
  arms.etiquetee.push(mk(c.intent));
  arms.extraite_actuel_gen.push(mk(intentFrom(c, text, pBg, false)));
  arms.extraite_actuel_orig.push(mk(intentFrom(c, orig, pBo, false)));
  arms.extraite_amelioree_gen.push(mk(intentFrom(c, text, pIg, true)));
  arms.extraite_amelioree_orig.push(mk(intentFrom(c, orig, pIo, true)));
  meta.push({ id: c.id, label: c.label, famille: c.family || c.groupe || null, kind_etiquete: c.intent.kind, montant_etiquete: c.intent.amount ?? null, jeton_etiquete: c.intent.token ?? null,
    texte_genere: text, texte_orig: orig, actuel_gen: { type: pBg.type, montant: pBg.amount, jeton: pBg.token }, actuel_orig: { type: pBo.type, montant: pBo.amount, jeton: pBo.token },
    amelioree_gen: { type: pIg.type, montant: pIg.amount, jeton: pIg.token, dest: pIg.recipient }, amelioree_orig: { type: pIo.type, montant: pIo.amount, jeton: pIo.token, dest: pIo.recipient } });
}
for (const [name, rows] of Object.entries(arms)) writeFileSync(join(OUT, name + '.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
writeFileSync(join(OUT, 'echantillon.json'), JSON.stringify({ n: sample.length, public: pub.length, v2_dev: take.length, graine: 300300, scenarios: meta }, null, 1));
console.log(JSON.stringify({ n: sample.length, bras: Object.keys(arms) }));

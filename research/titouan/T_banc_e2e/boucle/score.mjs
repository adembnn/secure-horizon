// boucle/score.mjs : UN score unique, calculé sur des jeux de RÉGLAGE seulement.
//
//   node boucle/score.mjs [--work=<dossier>] [--out=<fichier.json>] [--clef] [--quiet]
//
// Jeux lus (copies dans boucle/work/) : attacks/DEV.jsonl, attacks_public/PUBLIC.jsonl, redteam/V2_DEV_norm.jsonl,
// attacks_decalage/DECALAGE.jsonl, pipeline/grille/REGLAGE.jsonl (la moitié CONTROLE de la grille n'est jamais copiée ni lue).
// JAMAIS lus : V2_TEST.jsonl, attacks/TEST.jsonl, blind_decalage/CASES.jsonl, CONTROLE.jsonl (refus explicite ci-dessous).
//
// SÉPARATION (fixe, par graine) : chaque cas reçoit une part 0, 1 ou 2 = sha256(GRAINE|jeu|id) mod 3.
//   parts 0 et 1 = RÉGLAGE (2/3, vue par le correcteur), part 2 = VALIDATION INTERNE (1/3, sert seulement à accepter ou refuser).
//   Ce n'est PAS un jeu indépendant : mêmes auteurs, mêmes gabarits que le réglage (voir RAPPORT_BOUCLE.md).
//
// SCORE (0 à 100, un jeu à la fois, puis moyenne des jeux, tous les jeux pèsent pareil) :
//   pour chaque bras b (poids W_BRAS) et chaque jeu d :
//     R = rappel pondéré des arnaques : crédit 1 si critical, CREDIT_WARN si warn, 0 sinon ; la fraude conforme compte POIDS_FC.
//     F = fausses alertes sur bénins : critical = 1, warn au-delà de la gravité tolérée = PEN_WARN_EXCES, 'non vérifié' (unknown, affiché orange) = PEN_UNKNOWN, warn toléré = 0.
//         (PEN_UNKNOWN ajouté AVANT la 1re itération : sans lui, tout marquer 'non vérifié' aurait rapporté de la couverture gratuite)
//     C = couverture "invérifiable honnête" (cas ambigus, vérité 'inverifiable') : jamais vert ; unknown ou warn = 1, critical = COUV_CRIT, ok = 0.
//     score(d,b) = 100 * (1 - POIDS_COUV) * (R - LAMBDA*F) + 100 * POIDS_COUV * C       (si le jeu a des cas invérifiables)
//                = 100 * (R - LAMBDA*F)                                                    (sinon)
//   Une alerte ne vaut rien sans son coût : LAMBDA = 1,0 (une fausse alerte critical coûte autant qu'une arnaque manquée).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CONFIG = {
  GRAINE: 'holdup-boucle-2026-10-11',
  LAMBDA: 1.0, CREDIT_WARN: 0.6, POIDS_FC: 0.5, PEN_WARN_EXCES: 0.5, PEN_UNKNOWN: 0.3, POIDS_COUV: 0.15, COUV_CRIT: 0.5,
  W_BRAS: { none: 0.25, type: 0.25, full: 0.5 },
  // décalage : sans intention un décalage n'est pas détectable par construction, donc seulement type et full
  W_BRAS_DECALAGE: { type: 0.4, full: 0.6 },
  OPTS: { detectors: true, premiseCap: true, guard: true },
};
const HERE = dirname(fileURLToPath(import.meta.url));
export const JEUX = [
  { nom: 'DEV', f: 'attacks/DEV.jsonl' },
  { nom: 'PUBLIC', f: 'attacks_public/PUBLIC.jsonl' },
  { nom: 'V2_DEV', f: 'redteam/V2_DEV_norm.jsonl' },
  { nom: 'DECALAGE', f: 'attacks_decalage/DECALAGE.jsonl', decalage: true },
  { nom: 'GRILLE', f: 'pipeline/grille/REGLAGE.jsonl', grille: true },
];
export const part = (jeu, id) => parseInt(createHash('sha256').update(`${CONFIG.GRAINE}|${jeu}|${id}`).digest('hex').slice(0, 8), 16) % 3; // 0,1 réglage ; 2 validation
export const estValidation = (jeu, id) => part(jeu, id) === 2;

const RK = { ok: 0, unknown: 0, warn: 1, critical: 2 };
const sha = (t) => createHash('sha256').update(t, 'utf8').digest('hex');

// ------------------------------------------------------------------ chargement des cas
export async function charger(work, { clef = false, quiet = true } = {}) {
  const { prepare, runArm, normalizeCase } = await import(pathToFileURL(join(work, 'run', 'arms.mjs')).href);
  const out = []; // { jeu, id, fam, sub, cls: 'S'|'B'|'U', w, tol, res: {arm: level} }
  for (const J of JEUX) {
    if (/TEST|CONTROLE|CASES/i.test(J.f)) throw new Error('jeu scellé refusé : ' + J.f);
    const fp = join(work, J.f);
    if (!existsSync(fp)) { if (!quiet) console.error('jeu absent :', J.f); continue; }
    const lines = readFileSync(fp, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
    let kw = null, cache = null;
    if (J.grille) {
      const ic = await import(pathToFileURL(join(work, 'pipeline', 'intent_clef.mjs')).href);
      kw = ic; cache = clef ? chargerCacheClef() : null;
    }
    for (const line of lines) {
      let c0; try { c0 = JSON.parse(line); } catch { continue; }
      if (J.grille && c0.split && c0.split !== 'reglage') throw new Error('grille : cas non réglage refusé');
      let c, cls, w = 1, tol = 'ok';
      const arms = J.grille ? ['texte'] : J.decalage ? Object.keys(CONFIG.W_BRAS_DECALAGE) : Object.keys(CONFIG.W_BRAS);
      const res = {};
      try {
        if (J.grille) {
          const k = c0.context || {};
          const base = { ...c0, label: 'grille', intent: { declaredAt: 1760000000000 }, context: k };
          c = normalizeCase(base);
          cls = c0.truth === 'ne_correspond_pas' ? 'S' : c0.truth === 'correspond' ? 'B' : 'U';
          const prep = prepare(c);
          res.texte = (await niveauGrille(work, kw, cache, c, prep, runArm, c0.text)).level;
        } else {
          c = normalizeCase(c0);
          cls = c.label === 'malveillant' ? 'S' : c.label === 'benin' ? 'B' : c.label === 'fraude_conforme' ? 'S' : 'U';
          if (c.label === 'fraude_conforme') w = CONFIG.POIDS_FC;
          tol = c.expected_severity || 'ok';
          const prep = prepare(c);
          for (const a of arms) res[a] = (await runArm(prep, a, CONFIG.OPTS)).level;
        }
      } catch (e) { for (const a of arms) res[a] = 'unknown'; }
      out.push({ jeu: J.nom, id: String(c0.id), fam: c0.family || '?', sub: c0.subfamily || '?', cls, w, tol, res, part: part(J.nom, String(c0.id)) });
    }
    if (cache) sauverCacheClef(cache);
  }
  return out;
}

// ------------------------------------------------------------------ grille : le texte de l'utilisateur lu par code (mots-clés), ou par Clef si --clef
const CACHE_CLEF = join(HERE, 'cache', 'clef_intent.json');
function chargerCacheClef() { try { return JSON.parse(readFileSync(CACHE_CLEF, 'utf8')); } catch { return { entries: {}, calls: 0, quota: false }; } }
function sauverCacheClef(c) { mkdirSync(dirname(CACHE_CLEF), { recursive: true }); writeFileSync(CACHE_CLEF, JSON.stringify(c)); }
export async function lireTexte(ic, cache, text, contacts, declaredAt) {
  const opts = { contacts, declaredAt, provider: 'keyword' };
  if (!cache || cache.quota) return ic.classifyIntent(text, opts);
  const key = sha(ic.cleanText(text));
  let e = cache.entries[key];
  if (!e) {
    const r = await ic.askIntent(ic.cleanText(text), { provider: 'clef-flash' }); // appels séquentiels
    cache.calls++;
    if (!r.ok) { if (/429|quota|limit/i.test(String(r.error))) { cache.quota = true; } return ic.classifyIntent(text, opts); }
    e = cache.entries[key] = { answers: r.answers };
  }
  return { ...ic.decide({ source: 'clef-flash', answers: e.answers }, text, { contacts, declaredAt }), provider: 'clef-flash' };
}
export async function niveauGrille(work, ic, cache, c, prep, runArm, text) {
  const contacts = (c.context.address_book || []).map((b) => ({ address: b.address, label: b.label }));
  const cls = await lireTexte(ic, cache, text, contacts, 1760000000000);
  // adaptateur : la fonction `run` que evaluateWithIntent attend (evaluatePlus) devient la chaîne de bras de work/run/arms.mjs
  const pseudo = (r) => ({ level: r.level === 'critical' ? 'danger' : r.level === 'unknown' ? 'unknown' : 'attention', niveau: r.level === 'critical' ? 'critical' : r.level === 'warn' ? 'warn' : 'info', _r: r });
  const run = async (_body, _local, o = {}) => pseudo(o.intent ? await runArm({ ...prep, c: { ...prep.c, intent: o.intent } }, 'full', CONFIG.OPTS) : await runArm(prep, 'none', CONFIG.OPTS));
  const floor = await run();
  const w = await ic.evaluateWithIntent(run, {}, {}, {}, cls, floor);
  return { level: w.level, reasons: [w.path] };
}

// ------------------------------------------------------------------ calcul du score
function credit(cl, lv) { return lv === 'critical' ? 1 : lv === 'warn' ? CONFIG.CREDIT_WARN : 0; }
function penalite(r, lv) { return lv === 'unknown' ? CONFIG.PEN_UNKNOWN : lv === 'critical' ? 1 : lv === 'warn' ? (RK.warn > RK[r.tol] ? CONFIG.PEN_WARN_EXCES : 0) : 0; }
function couv(lv) { return lv === 'ok' ? 0 : lv === 'critical' ? CONFIG.COUV_CRIT : 1; }

// rows : cas déjà évalués (filtrés par part). Renvoie { score, jeux: {nom: {score, R, F, C, n}}, pertes: {cle: points} }
export function calculer(rows) {
  const jeux = {}, pertes = {}, nJeux = new Set(rows.map((r) => r.jeu)).size;
  for (const nom of new Set(rows.map((r) => r.jeu))) {
    const rs = rows.filter((r) => r.jeu === nom);
    const J = JEUX.find((j) => j.nom === nom);
    const poids = J.grille ? { texte: 1 } : J.decalage ? CONFIG.W_BRAS_DECALAGE : CONFIG.W_BRAS;
    const S = rs.filter((r) => r.cls === 'S'), B = rs.filter((r) => r.cls === 'B'), U = rs.filter((r) => r.cls === 'U');
    const sumW = S.reduce((s, r) => s + r.w, 0);
    const hasU = U.length > 0;
    const kBase = hasU ? 100 * (1 - CONFIG.POIDS_COUV) : 100;
    let tot = 0; const det = { R: 0, F: 0, C: 0 };
    for (const [arm, wa] of Object.entries(poids)) {
      let R = 0, F = 0, C = 0;
      for (const r of S) { const cr = credit(r, r.res[arm]); R += (r.w * cr) / (sumW || 1); const l = kBase * wa * (r.w * (1 - cr)) / (sumW || 1) / nJeux; add(pertes, r, l); }
      for (const r of B) { const p = penalite(r, r.res[arm]); F += p / (B.length || 1); const l = kBase * wa * CONFIG.LAMBDA * p / (B.length || 1) / nJeux; add(pertes, r, l); }
      for (const r of U) { const cv = couv(r.res[arm]); C += cv / U.length; const l = 100 * CONFIG.POIDS_COUV * wa * (1 - cv) / U.length / nJeux; add(pertes, r, l); }
      const sc = kBase * (R - CONFIG.LAMBDA * F) + (hasU ? 100 * CONFIG.POIDS_COUV * C : 0);
      tot += wa * sc; det.R += wa * R; det.F += wa * F; det.C += wa * C;
    }
    jeux[nom] = { score: tot, R: det.R, F: det.F, C: hasU ? det.C : null, n: rs.length, nS: S.length, nB: B.length, nU: U.length };
  }
  const noms = Object.keys(jeux);
  return { score: noms.reduce((s, n) => s + jeux[n].score, 0) / (noms.length || 1), jeux, pertes };
}
function add(P, r, l) { if (l <= 0) return; const k = `${r.jeu}|${r.fam}|${r.sub}`; P[k] = (P[k] || 0) + l; }

export function mesurer(rows) {
  const reg = rows.filter((r) => r.part !== 2), val = rows.filter((r) => r.part === 2);
  return { reglage: calculer(reg), validation: calculer(val), n: { reglage: reg.length, validation: val.length } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const opt = (n, d) => { const x = a.find((s) => s.startsWith(`--${n}=`)); return x ? x.slice(n.length + 3) : d; };
  const work = resolve(opt('work', join(HERE, 'work')));
  const t0 = Date.now();
  const rows = await charger(work, { clef: a.includes('--clef') });
  const m = mesurer(rows);
  const f = (x) => x.toFixed(2);
  if (!a.includes('--quiet')) {
    for (const p of ['reglage', 'validation']) {
      console.log(`${p.toUpperCase()} score ${f(m[p].score)} (n=${m.n[p]})`);
      for (const [n, j] of Object.entries(m[p].jeux)) console.log(`  ${n.padEnd(9)} ${f(j.score).padStart(6)}  R=${f(100 * j.R)}%  F=${f(100 * j.F)}%  ${j.C === null ? '' : 'C=' + f(100 * j.C) + '%'}  (S ${j.nS}, B ${j.nB}, U ${j.nU})`);
    }
    console.log(`${Date.now() - t0} ms`);
  }
  const o = opt('out'); if (o) writeFileSync(o, JSON.stringify({ config: CONFIG, mesure: m, rows }));
}

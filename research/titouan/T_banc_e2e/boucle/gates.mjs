// boucle/gates.mjs : portes DURES. Tout échec = itération rejetée.
//   node boucle/gates.mjs <porte> [--work=<dossier>]       portes : zero_ok | monotonie | nohardcode | scelles | tests | tout
// Chaque porte tourne dans un processus séparé du score (les modules sont rechargés à neuf après chaque correctif).
// Sortie : une ligne JSON { porte, ok, detail }.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..'); // T_banc_e2e
const a = process.argv.slice(2);
const opt = (n, d) => { const x = a.find((s) => s.startsWith(`--${n}=`)); return x ? x.slice(n.length + 3) : d; };
const WORK = resolve(opt('work', join(HERE, 'work')));
const BASE = resolve(opt('base', join(HERE, 'base')));
const porte = a.find((s) => !s.startsWith('--')) || 'tout';
const out = (r) => { console.log(JSON.stringify(r)); return r; };
const imp = (p) => import(pathToFileURL(p).href);

// ------------------------------------------------------------------ 1. jamais de verdict « ok » à l'écran (produit : server.evaluate)
async function zeroOk() {
  const S = await imp(join(WORK, 'server', 'server.mjs'));
  const { normalizeCase } = await imp(join(WORK, 'redteam', 'normalize_v2.mjs'));
  const lc = (x) => (typeof x === 'string' ? x.toLowerCase() : x);
  const HEX20 = /^0x[0-9a-fA-F]{40}$/;
  let n = 0, bad = []; const niveaux = {};
  const fichiers = ['attacks/DEV.jsonl', 'attacks_public/PUBLIC.jsonl', 'attacks_decalage/DECALAGE.jsonl', 'pipeline/grille/REGLAGE.jsonl', 'redteam/V2_DEV_norm.jsonl'];
  for (const f of fichiers) {
    const lines = readFileSync(join(WORK, f), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
    const pas = f.includes('V2_DEV') ? 5 : f.includes('grille') ? 2 : 1; // échantillon régulier pour V2 et grille
    for (let i = 0; i < lines.length; i += pas) {
      let c; try { c = normalizeCase(JSON.parse(lines[i])); } catch { continue; }
      if (!c.request) continue;
      const k = c.context || {};
      let origin = typeof k.origin === 'string' ? k.origin : undefined; if (origin && !/^[a-z][a-z0-9+.-]*:/i.test(origin)) origin = 'https://' + origin;
      const body = { method: c.request.method, params: c.request.params, origin, chainId: k.chainId, from: k.victim };
      const local = { contacts: (k.address_book || []).filter((b) => b && HEX20.test(String(b.address))).map((b) => ({ address: lc(b.address), label: String(b.label || '') })), history: (k.history || []).filter((h) => h && HEX20.test(String(h.address))), protected: [], knownSpenders: (k.known_protocols || []).filter((p) => p && HEX20.test(String(p.address))).map((p) => lc(p.address)) };
      let v; try { v = S.evaluate(body, local); } catch (e) { v = { level: 'unknown', niveau: 'warn' }; }
      n++; const key = `${v.level}/${v.niveau}`; niveaux[key] = (niveaux[key] || 0) + 1;
      if (v.level === 'ok' || v.level === 'vert' || v.level === 'green' || v.niveau === 'ok' || !v.level) bad.push(String(c.id));
    }
  }
  return out({ porte: 'zero_ok', ok: bad.length === 0, detail: `${n} verdicts produit, ${bad.length} « ok » ${bad.slice(0, 5).join(',')} ; niveaux ${JSON.stringify(niveaux)}` });
}

// ------------------------------------------------------------------ 2. monotonie : plus d'information d'intention ne baisse jamais un verdict
async function monotonie() {
  const M = await imp(join(WORK, 'run', 'mesure_monotonie.mjs'));
  const jeux = ['attacks/DEV.jsonl', 'attacks_public/PUBLIC.jsonl', 'redteam/V2_DEV_norm.jsonl', 'attacks_decalage/DECALAGE.jsonl'];
  // mesure_monotonie lit ROOT = work/ (son dossier parent)
  const r = await M.mesure(jeux, { detectors: true, guard: true, premiseCap: true });
  let v = 0, n = 0, perdues = 0;
  for (const S of Object.values(r.jeux)) { v += S.none_to_type + S.type_to_full + S.none_to_full; n += S.n; perdues += S.scam_lost_type + S.scam_lost_full; }
  // la chaîne SANS la garde doit aussi rester monotone au niveau du noyau (politique + comparateur)
  const r2 = await M.mesure(jeux, { detectors: false, guard: false, premiseCap: false });
  let v2 = 0; for (const S of Object.values(r2.jeux)) v2 += S.none_to_type + S.type_to_full + S.none_to_full;
  return out({ porte: 'monotonie', ok: v === 0 && v2 === 0 && perdues === 0, detail: `${n} cas, violations chaîne produit ${v}, noyau seul ${v2}, arnaques perdues ${perdues}` });
}

// ------------------------------------------------------------------ 3. anti-hardcoding : lignes AJOUTÉES par rapport à la base + contrôle du dépôt
const EXT = /\.(mjs|js|ts|json)$/;
function lister(d, acc = [], pre = '') {
  for (const e of readdirSync(join(d, pre), { withFileTypes: true })) {
    const p = pre ? pre + '/' + e.name : e.name;
    if (e.isDirectory()) { if (['node_modules', 'out', 'cache'].includes(e.name)) continue; lister(d, acc, p); } else if (EXT.test(e.name) || /\.jsonl$/.test(e.name)) acc.push(p);
  }
  return acc;
}
export function lignesAjoutees() {
  const res = [];
  for (const f of lister(WORK)) {
    if (/\.jsonl$/.test(f)) continue;
    const w = readFileSync(join(WORK, f), 'utf8');
    const bp = join(BASE, f);
    const b = existsSync(bp) ? readFileSync(bp, 'utf8') : null;
    if (b === w) continue;
    const bs = new Set((b || '').split('\n'));
    w.split('\n').forEach((l, i) => { if (!bs.has(l)) res.push({ f, n: i + 1, l }); });
  }
  return res;
}
function nohardcode() {
  const echecs = [];
  const r = spawnSync(process.execPath, [join(WORK, 'run', 'check_nohardcode.mjs')], { cwd: WORK, encoding: 'utf8' });
  if (r.status !== 0) echecs.push('check_nohardcode.mjs : ' + (r.stdout || r.stderr).trim().slice(0, 200));
  // identifiants et sous-familles des jeux de réglage
  const ids = new Set(), subs = new Set(), fams = new Set();
  for (const f of ['attacks/DEV.jsonl', 'attacks_public/PUBLIC.jsonl', 'attacks_decalage/DECALAGE.jsonl', 'pipeline/grille/REGLAGE.jsonl']) {
    for (const l of readFileSync(join(WORK, f), 'utf8').split('\n')) { if (!l.trim()) continue; try { const c = JSON.parse(l); if (c.subfamily && String(c.subfamily).length >= 12) subs.add(c.subfamily); if (c.family) fams.add(c.family); } catch { /* */ } }
  }
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const idRe = /(^|[^a-zA-Z0-9_])(DEC-[a-z_]+-\d{3}|G-[a-zA-Z0-9_]+-\d{4}|P-[A-Z]\d{2}-[A-Z0-9]+)/;
  const famRe = new RegExp('(^|[^a-z0-9_])(' + [...fams].map(esc).join('|') + ')-\\d{3}');
  const interdit = /V2_TEST|attacks\/TEST|TEST\.jsonl|blind_decalage|CASES\.jsonl|CONTROLE|expected_severity|ideal_severity|required_signals|blind_to_v3_contract|\.truth\b|\.label\b|\bsubfamily\b|\.fam(ily)?\b/;
  for (const { f, n, l } of lignesAjoutees()) {
    const t = l.trim(); if (!t || t.startsWith('//')) continue;
    if (/\b0x[0-9a-fA-F]{40}\b/.test(l)) echecs.push(`${f}:${n} adresse littérale`);
    if (/\b0x[0-9a-fA-F]{64}\b/.test(l)) echecs.push(`${f}:${n} hash littéral`);
    if (/\b[0-9a-f]{64}\b/i.test(l)) echecs.push(`${f}:${n} empreinte 64 hex`);
    if (idRe.test(l) || famRe.test(l)) echecs.push(`${f}:${n} identifiant de cas`);
    if (interdit.test(l)) echecs.push(`${f}:${n} champ ou jeu interdit : ${t.slice(0, 80)}`);
    for (const s of subs) if (l.includes(s)) echecs.push(`${f}:${n} sous-famille de cas citée : ${s}`);
  }
  return out({ porte: 'nohardcode', ok: echecs.length === 0, detail: echecs.length ? echecs.slice(0, 6).join(' | ') : `aucune violation (${lignesAjoutees().length} lignes ajoutées inspectées)` });
}

// ------------------------------------------------------------------ 4. jeux scellés : jamais ouverts, jamais copiés dans work/, taille et date inchangées
const SCELLES = ['redteam/V2_TEST.jsonl', 'blind_adem/v2/V2_TEST.jsonl', 'attacks/TEST.jsonl', 'blind_decalage/CASES.jsonl', 'pipeline/grille/CONTROLE.jsonl'];
function scelles() {
  const st = {};
  for (const s of SCELLES) { const p = join(ROOT, s); if (existsSync(p)) { const x = statSync(p); st[s] = { size: x.size, mtimeMs: Math.round(x.mtimeMs) }; } }
  const ref = join(HERE, 'out', 'scelles_stat.json');
  let ok = true; const d = [];
  if (!existsSync(ref)) writeFileSync(ref, JSON.stringify(st, null, 1)); else {
    const r0 = JSON.parse(readFileSync(ref, 'utf8'));
    for (const [k, v] of Object.entries(r0)) if (!st[k] || st[k].size !== v.size || st[k].mtimeMs !== v.mtimeMs) { d.push('modifié ' + k); }
  }
  const copies = lister(WORK).concat(readdirSync(WORK).filter((f) => /TEST|CONTROLE/.test(f))).filter((f) => /V2_TEST|\/TEST\.jsonl|CASES\.jsonl|CONTROLE/.test(f));
  if (copies.length) d.push('copie scellée dans work : ' + copies.join(','));
  // le code de la boucle ne cite aucun jeu scellé en lecture
  for (const f of ['score.mjs', 'loop.mjs']) {
    const t = readFileSync(join(HERE, f), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    if (/readFileSync\([^)]*(V2_TEST|TEST\.jsonl|CASES|CONTROLE)/.test(t)) d.push('lecture scellée dans ' + f);
  }
  ok = d.length === 0;
  return out({ porte: 'scelles', ok, detail: ok ? `${Object.keys(st).length} jeux scellés présents, taille et date inchangées, aucune copie dans work` : d.join(' ; ') });
}

// ------------------------------------------------------------------ 5. tests : moteur, serveur 33/33, présentation 31/31, pipeline, détecteurs, politique
function echouesNode(args, cwd, timeout = 300000) {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...args], { cwd, encoding: 'utf8', timeout });
  const txt = (r.stdout || '') + (r.stderr || '');
  const fails = [...new Set([...txt.matchAll(/^\s*✖\s+(.+?)(?:\s+\([\d.]+ms\))?$/gm)].map((m) => m[1].trim()))].filter((s) => !/^failing tests/.test(s));
  const pass = Number((txt.match(/ℹ pass (\d+)/) || [])[1] || 0), fail = Number((txt.match(/ℹ fail (\d+)/) || [])[1] || 0);
  return { pass, fail, fails };
}
function scriptPF(script, cwd, timeout = 120000) {
  const r = spawnSync(process.execPath, [script], { cwd, encoding: 'utf8', timeout });
  const txt = (r.stdout || '') + (r.stderr || '');
  const m = txt.match(/RESUME\s+(\{.*\})/); const m2 = txt.match(/RESUME\s+(\d+)\/(\d+)/);
  let passed = 0, total = 0, fails = [];
  if (m) { try { const j = JSON.parse(m[1]); passed = j.passed; total = j.total; } catch { /* */ } } else if (m2) { passed = Number(m2[1]); total = Number(m2[2]); }
  fails = [...txt.matchAll(/^FAIL\s+(.+)$/gm)].map((x) => x[1].slice(0, 80));
  return { passed, total, fails };
}
function tests() {
  const base = existsSync(join(HERE, 'out', 'tests_base.json')) ? JSON.parse(readFileSync(join(HERE, 'out', 'tests_base.json'), 'utf8')) : null;
  const res = { moteur: { pass: 0, fails: [] }, pipeline: null, detecteurs: null };
  const tdir = join(WORK, 'engine', 'test');
  const fichiers = readdirSync(tdir).filter((f) => f.endsWith('.test.mjs'));
  let mp = 0; const mf = [];
  for (const f of fichiers) { const r = echouesNode([join('test', f)], join(WORK, 'engine')); mp += r.pass; for (const x of r.fails) mf.push(f + ':' + x); }
  res.moteur = { pass: mp, fails: mf };
  const pl = echouesNode([join('pipeline', 'test', 'evaluate_plus.test.mjs'), join('pipeline', 'test', 'intent_clef.test.mjs')], WORK);
  res.pipeline = { pass: pl.pass, fails: pl.fails };
  const tp = spawnSync(process.execPath, [join(WORK, 'run', 'test_policy.mjs')], { cwd: WORK, encoding: 'utf8', timeout: 120000 });
  const tpOut = (tp.stdout || '') + (tp.stderr || '');
  res.politique = { ok: tp.status === 0 && /tous OK/.test(tpOut), nOK: (tpOut.match(/^OK /gm) || []).length, nKO: (tpOut.match(/^(KO|ECHEC|FAIL)/gm) || []).length };
  let srv = scriptPF(join(WORK, 'server', 'test', 'server.test.mjs'), WORK);
  if (srv.passed < 33 && srv.fails.length && srv.fails.every((x) => /latence/.test(x))) srv = scriptPF(join(WORK, 'server', 'test', 'server.test.mjs'), WORK); // la latence dépend de la machine : un seul rejeu
  const pres = scriptPF(join(WORK, 'server', 'test', 'presentation.test.mjs'), WORK);
  res.serveur = srv; res.presentation = pres;
  const nouveaux = [];
  const connus = new Set((base && base.moteur ? base.moteur.fails : []).concat(base && base.pipeline ? base.pipeline.fails : []));
  for (const x of res.moteur.fails.concat(res.pipeline.fails)) if (!connus.has(x)) nouveaux.push(x);
  const ok = nouveaux.length === 0 && srv.passed === 33 && srv.total === 33 && pres.passed === 31 && pres.total === 31 && res.politique.ok && (!base || res.moteur.pass >= base.moteur.pass);
  const detail = `moteur ${res.moteur.pass} ok (échecs connus hors réseau : ${res.moteur.fails.length}), pipeline ${res.pipeline.pass} ok, politique ${res.politique.ok ? 'OK' : 'KO'}, serveur ${srv.passed}/${srv.total}, présentation ${pres.passed}/${pres.total}${nouveaux.length ? ', NOUVEAUX ÉCHECS ' + nouveaux.slice(0, 4).join(' | ') : ''}`;
  if (a.includes('--base')) writeFileSync(join(HERE, 'out', 'tests_base.json'), JSON.stringify(res, null, 1));
  return out({ porte: 'tests', ok, detail });
}

const portes = { zero_ok: zeroOk, monotonie, nohardcode, scelles, tests };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (porte === 'tout') { for (const [k, f] of Object.entries(portes)) await f(); } else await portes[porte]();
}

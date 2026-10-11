// Parite voie SERVEUR (server/server.mjs evaluate) / voie EXTENSION AUTONOME (extension_standalone/extension/engine/sentinelle_core.js check), meme processus Node.
// Lecture seule sur tout sauf parite/. Ne lit jamais attacks/TEST.jsonl ni V2_TEST. Aucun reseau. Usage : node parite/run_parite.mjs
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const EXT = join(ROOT, 'extension_standalone', 'extension');
const imp = (p) => import(pathToFileURL(p).href);
const sha = (b) => createHash('sha256').update(b).digest('hex');
const R = { date: new Date().toISOString(), node: process.version };
// horloge figee (les deux voies lisent Date.now pour "now" et les echeances) : sinon une seconde d'ecart fabrique de faux ecarts
const T0 = 1760000000000; Date.now = () => T0;
let net = 0;
globalThis.fetch = () => { net++; throw new Error('reseau'); };
globalThis.XMLHttpRequest = function () { net++; throw new Error('reseau'); };
globalThis.WebSocket = function () { net++; throw new Error('reseau'); };

const SRV = await imp(join(ROOT, 'server', 'server.mjs'));
const CORE = await imp(join(EXT, 'engine', 'sentinelle_core.js'));
const MAX_BODY = SRV.MAX_BODY;
const LOCAL_SRV = { contacts: [], history: [], protected: [], knownSpenders: [] };

// ---------- jeux de requetes (corps tels que bridge.js les envoie)
const readJsonl = (p) => readFileSync(p, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const INTENT = { pay_someone: 'pay', connect_or_accept_offer: 'receive', asked_by_someone: 'asked' };
function bodyOf(request, ctx, intent) {
  const o = /^https?:/.test(ctx.origin || '') ? ctx.origin : 'https://' + (ctx.origin || 'inconnu.local');
  const b = { origin: o, url: o, method: request.method, params: request.params, chainId: ctx.chainId ? '0x' + Number(ctx.chainId).toString(16) : undefined, from: ctx.victim };
  if (intent) { const k = INTENT[intent.type]; if (k) b.intent = k; if (intent.texte_declare) b.intent_text = intent.texte_declare; if (intent.message_recu) b.pageText = intent.message_recu; }
  return b;
}
const dev = readJsonl(join(ROOT, 'attacks', 'DEV.jsonl'));
if (dev.some((c) => c.split !== 'DEV')) throw new Error('DEV.jsonl contient un cas non DEV');
const pub = readJsonl(join(ROOT, 'attacks_public', 'PUBLIC.jsonl'));
const scAll = JSON.parse(readFileSync(join(ROOT, 'scenarios_export', 'scenarios.json'), 'utf8'));
const sc = scAll.filter((s) => s.source === 'v2' && s.payload && s.payload.method); // V2_DEV seulement (l'export ne contient jamais V2_TEST)
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(20261011); const idx = sc.map((_, i) => i);
for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
const sample = idx.slice(0, 1500).map((i) => sc[i]);
const fromCase = (c) => ({ type: c.intent && c.intent.kind, texte_declare: c.intent && c.intent.freeText });

const sets = {
  DEV: { items: dev.map((c) => ({ id: c.id, body: bodyOf(c.request, c.context, fromCase(c)) })) },
  PUBLIC: { items: pub.map((c) => ({ id: c.id, body: bodyOf(c.request, c.context || {}, fromCase(c)) })) },
  SCENARIOS_1500: { items: sample.map((s) => ({ id: s.id, body: bodyOf(s.payload, s.contexte || {}, s.intention) })) },
};

// ---------- 40 requetes malformees / limites
const A1 = '0x' + 'a1'.repeat(20), B2 = '0x' + 'b2'.repeat(20);
const base = { origin: 'https://app.exemple.org', method: 'eth_sendTransaction', params: [{ from: A1, to: B2, value: '0x1', data: '0x' }], chainId: '0x1', from: A1 };
const withP = (p, extra = {}) => ({ ...base, params: [{ ...base.params[0], ...p }], ...extra });
const HUGE = 'f'.repeat(300 * 1024);
const MAL = [
  ['corps vide {}', {}], ['corps null', null], ['corps tableau []', []], ['corps chaine', 'eth_sendTransaction'], ['corps nombre', 42],
  ['methode absente', { ...base, method: undefined }], ['methode nombre', { ...base, method: 7 }], ['methode inconnue', { ...base, method: 'eth_foo' }], ['methode tres longue', { ...base, method: 'x'.repeat(5000) }],
  ['params non tableau', { ...base, params: 'x' }], ['params vide', { ...base, params: [] }], ['params [null]', { ...base, params: [null] }], ['params [42]', { ...base, params: [42] }],
  ['to invalide', withP({ to: '0x123' })], ['to non hex', withP({ to: '0xZZ' + 'a'.repeat(38) })], ['from invalide', withP({ from: 'pas une adresse' }, { from: 'nope' })], ['to absent', withP({ to: undefined })],
  ['value BigInt gigantesque hex', withP({ value: '0x' + 'f'.repeat(2000) })], ['value decimale gigantesque', withP({ value: '9'.repeat(1500) })], ['value negative', withP({ value: '-1' })], ['value flottante', withP({ value: '1.5' })], ['value non hex', withP({ value: '0xzz' })],
  ['data hex impair', withP({ data: '0xabc' })], ['data non hex', withP({ data: 'bonjour' })], ['data enorme (>256 Ko)', withP({ data: '0x' + HUGE })], ['data selecteur approve tronque', withP({ to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', data: '0x095ea7b3' + 'ab'.repeat(10) })],
  ['origine unicode RTL', { ...base, origin: 'https://‮exemple‬.org' }], ['origine arabe RTL', { ...base, origin: 'https://مثال.موقع' }], ['origine punycode', { ...base, origin: 'https://xn--exmple-cua.org' }], ['origine invalide', { ...base, origin: 'pas une url' }], ['origine objet', { ...base, origin: { a: 1 } }],
  ['chainId invalide', { ...base, chainId: 'abc' }], ['chainId enorme', { ...base, chainId: '0x' + 'f'.repeat(100) }], ['chainId negatif', { ...base, chainId: -5 }],
  ['personal_sign RTL', { ...base, method: 'personal_sign', params: ['0x' + Buffer.from('‮ connexion ‬ مرحبا').toString('hex'), A1] }], ['personal_sign texte non hex', { ...base, method: 'personal_sign', params: ['bonjour', A1] }],
  ['typedData JSON invalide', { ...base, method: 'eth_signTypedData_v4', params: [A1, '{pas du json'] }], ['typedData tableau (v1)', { ...base, method: 'eth_signTypedData', params: [[{ type: 'string', name: 'a', value: 'b' }], A1] }],
  ['wallet_sendCalls 65 appels', { ...base, method: 'wallet_sendCalls', params: [{ from: A1, calls: Array.from({ length: 65 }, () => ({ to: B2, value: '0x1' })) }] }],
  ['pageText unicode + pression', { ...withP({ value: '0xde0b6b3a7640000' }), pageText: 'URGENT ‮ remboursement immédiat — ne le dites à personne' }],
];
if (MAL.length !== 40) throw new Error('40 requetes malformees attendues, ' + MAL.length);
sets.MALFORMEES = { items: MAL.map(([id, body]) => ({ id, body })) };
sets.V2_DEV_COMPLET_SUPPLEMENT = { supp: true, items: sc.map((s) => ({ id: s.id, body: bodyOf(s.payload, s.contexte || {}, s.intention) })) };

// ---------- comparaison
const strip = (v) => { const o = JSON.parse(JSON.stringify(v)); delete o.engine; delete o.latency_ms; delete o.latency_engine_ms; return o; };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const FIELDS = ['niveau', 'level', 'title', 'texts', 'fiche', 'reasons', 'opacity_only'];
function causeOf(s, c, fields) {
  const seaS = (s.codes || []).includes('seaport_zero_price'), seaC = (c.codes || []).includes('seaport_zero_price');
  if (seaS !== seaC) return 'regle_seaport';
  if (!eq(s.codes, c.codes) || !eq(s.effects, c.effects) || s.indeterminate !== c.indeterminate || s.why !== c.why || s.niveau !== c.niveau || s.level !== c.level) return 'contexte';
  if (fields.includes('fiche')) return 'fiche';
  if (fields.includes('title')) return 'titre';
  if (fields.includes('opacity_only')) return 'opacite';
  if (fields.includes('texts')) return 'texte';
  if (fields.includes('reasons')) return 'reasons';
  return 'autre_champ';
}
const CAUSES = ['regle_seaport', 'texte', 'fiche', 'titre', 'opacite', 'contexte', 'reasons', 'autre_champ'];
const lvlStats = { niveau: {}, level: {} };
let okLeak = 0; const okEx = [];
function tally(tag, id, v) { for (const k of ['niveau', 'level']) lvlStats[k][v[k]] = (lvlStats[k][v[k]] || 0) + 1; if (v.niveau === 'ok' || v.level === 'ok') { okLeak++; okEx.push(tag + ':' + id); } }
function httpFilter(body) { // ce que server.mjs fait AVANT evaluate()
  let raw; try { raw = JSON.stringify(body === undefined ? null : body); } catch { return { code: 'non_serialisable' }; }
  if (Buffer.byteLength(raw) > MAX_BODY) return { code: 413 };
  const parsed = JSON.parse(raw || 'null');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { code: 400 };
  return null;
}
const pick = (o, fields) => Object.fromEntries(fields.map((f) => [f, o[f]]));
R.sets = {}; const allDiffs = [];
for (const [name, set] of Object.entries(sets)) {
  const st = { requetes: set.items.length, comparees: 0, identiques: 0, ecarts: 0, filtrees_http_serveur: 0, filtrees_noyau_indetermine: 0, filtrees_noyau_pas_indetermine: [], champs: Object.fromEntries(FIELDS.map((f) => [f, 0])), complet_identique: 0, niveaux_serveur: {}, niveaux_noyau: {} };
  for (const it of set.items) {
    const flt = httpFilter(it.body);
    let c, cThrow = null;
    try { c = CORE.check(flt && flt.code === 'non_serialisable' ? it.body : JSON.parse(JSON.stringify(it.body === undefined ? null : it.body))); } catch (e) { cThrow = String(e && e.message || e); }
    if (cThrow) { allDiffs.push({ set: name, id: it.id, cause: 'contexte', fields: ['EXCEPTION noyau'], detail: cThrow }); st.ecarts++; st.comparees++; continue; }
    tally('noyau/' + name, it.id, c); st.niveaux_noyau[c.niveau] = (st.niveaux_noyau[c.niveau] || 0) + 1;
    if (flt) { st.filtrees_http_serveur++; if (c.level === 'unknown' && c.niveau === 'warn') st.filtrees_noyau_indetermine++; else st.filtrees_noyau_pas_indetermine.push({ id: it.id, niveau: c.niveau, level: c.level, why: c.why }); continue; }
    let s, sThrow = null;
    try { s = SRV.evaluate(JSON.parse(JSON.stringify(it.body)), LOCAL_SRV); } catch (e) { sThrow = String(e && e.message || e); }
    if (sThrow) { allDiffs.push({ set: name, id: it.id, cause: 'contexte', fields: ['EXCEPTION serveur'], detail: sThrow }); st.ecarts++; st.comparees++; continue; }
    tally('serveur/' + name, it.id, s); st.niveaux_serveur[s.niveau] = (st.niveaux_serveur[s.niveau] || 0) + 1;
    const S = strip(s), C = strip(c); st.comparees++;
    const fields = FIELDS.filter((f) => !eq(S[f], C[f]));
    const full = eq(S, C);
    if (full) st.complet_identique++;
    if (!fields.length) st.identiques++;
    else { st.ecarts++; for (const f of fields) st.champs[f]++; allDiffs.push({ set: name, id: it.id, cause: causeOf(S, C, fields), fields, method: it.body && it.body.method, chainId: it.body && it.body.chainId, serveur: pick(S, fields), noyau: pick(C, fields) }); }
    if (!full && !fields.length) allDiffs.push({ set: name, id: it.id, cause: 'hors_champs_demandes', fields: [...new Set([...Object.keys(S), ...Object.keys(C)])].filter((k) => !eq(S[k], C[k])) });
  }
  R.sets[name] = st;
}
R.ok_leak = { count: okLeak, exemples: okEx.slice(0, 10) };
R.niveaux = lvlStats;

// ---------- agregat
const tot = { comparees: 0, identiques: 0, ecarts: 0, identiques_tous_champs: 0 };
for (const [nm, st] of Object.entries(R.sets)) { if (sets[nm].supp) continue; tot.comparees += st.comparees; tot.identiques += st.identiques; tot.ecarts += st.ecarts; tot.identiques_tous_champs += st.complet_identique; }
R.total = { ...tot, taux_identite_pct: tot.comparees ? Math.round(tot.identiques / tot.comparees * 10000) / 100 : null, taux_identite_tous_champs_pct: Math.round(tot.identiques_tous_champs / tot.comparees * 10000) / 100 };
const dMain = allDiffs.filter((d) => !sets[d.set].supp);
R.causes = Object.fromEntries(CAUSES.concat('hors_champs_demandes').map((k) => [k, { n: dMain.filter((d) => d.cause === k).length, exemples: dMain.filter((d) => d.cause === k).slice(0, 10) }]));
R.causes_v2_complet = Object.fromEntries(CAUSES.concat('hors_champs_demandes').map((k) => [k, { n: allDiffs.filter((d) => d.set === 'V2_DEV_COMPLET_SUPPLEMENT' && d.cause === k).length, exemples: allDiffs.filter((d) => d.set === 'V2_DEV_COMPLET_SUPPLEMENT' && d.cause === k).slice(0, 10) }]));

// ---------- (3) verifications statiques sur le noyau et l'extension livres
function walk(d) { const out = []; for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? out.push(...walk(p)) : out.push(p); } return out; }
const files = walk(EXT).sort();
const PATS = { testMode: /testMode|test_mode|TEST_HOOK|test-hook|autoApprove|autoDecide|HOLDUP_TEST/i, fetch: /\bfetch\s*\(/, XMLHttpRequest: /XMLHttpRequest/, WebSocket: /\bWebSocket\b/, sendBeacon: /sendBeacon/, EventSource: /EventSource/, eval: /\beval\s*\(/, newFunction: /new\s+Function\s*\(/, importScripts: /importScripts/, http_url: /https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/i };
const stat = {};
for (const p of files) {
  if (!/\.(js|html|json|css)$/.test(p)) continue;
  const rel = relative(EXT, p).replace(/\\/g, '/');
  readFileSync(p, 'utf8').split('\n').forEach((ln, i) => { for (const [k, re] of Object.entries(PATS)) if (re.test(ln)) (stat[k] = stat[k] || []).push(rel + ':' + (i + 1) + ': ' + ln.trim().slice(0, 140)); });
}
R.statique = Object.fromEntries(Object.keys(PATS).map((k) => [k, stat[k] || []]));
R.statique_noyau_seul = Object.fromEntries(Object.keys(PATS).map((k) => [k, (stat[k] || []).filter((l) => l.startsWith('engine/')).length]));
R.manifest = JSON.parse(readFileSync(join(EXT, 'manifest.json'), 'utf8'));
R.core_ok_literal = readFileSync(join(EXT, 'engine', 'sentinelle_core.js'), 'utf8').split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /['"]ok['"]/.test(l)).map(([i, l]) => i + ': ' + l.trim().slice(0, 140));

// ---------- fraicheur du build : les sources hachees dans BUILD_INFO sont-elles celles d'aujourd'hui ?
const BI = JSON.parse(readFileSync(join(EXT, 'BUILD_INFO.json'), 'utf8'));
R.build_obsolete = BI.sources.map((s) => { const p = resolve(ROOT, s.file); if (!existsSync(p)) return { file: s.file, etat: 'source introuvable' }; return sha(readFileSync(p)) === s.sha256 ? null : { file: s.file, etat: 'source modifiee depuis le build' }; }).filter(Boolean);
R.build_sources_n = BI.sources.length;
// ---------- (4) zip vs dossier

const ZIP = join(ROOT, 'dist', 'hold-up-standalone.zip');
R.zip = { existe: existsSync(ZIP) };
if (R.zip.existe) {
  R.zip.mtime = statSync(ZIP).mtime.toISOString(); R.zip.octets = statSync(ZIP).size;
  const tmp = join(HERE, '_zip_extrait'); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const x = spawnSync('C:/Windows/System32/tar.exe', ['-xf', 'hold-up-standalone.zip', '-C', '../parite/_zip_extrait'], { encoding: 'utf8', cwd: join(ROOT, 'dist') }); R.zip.extraction = x.status === 0 ? 'ok' : (x.stderr || 'echec');
  if (x.status === 0) {
    const zf = walk(tmp).map((p) => relative(tmp, p).replace(/\\/g, '/'));
    const top = zf[0].split('/')[0]; const prefix = !zf.includes('manifest.json') && zf.every((f) => f.startsWith(top + '/')) ? top + '/' : '';
    const zmap = new Map(zf.map((f) => [f.slice(prefix.length), sha(readFileSync(join(tmp, f)))]));
    const dmap = new Map(files.map((p) => [relative(EXT, p).replace(/\\/g, '/'), sha(readFileSync(p))]));
    const diff = [];
    for (const [f, h] of dmap) { if (!zmap.has(f)) diff.push({ f, etat: 'absent du zip' }); else if (zmap.get(f) !== h) diff.push({ f, etat: 'contenu different' }); }
    for (const f of zmap.keys()) if (!dmap.has(f)) diff.push({ f, etat: 'dans le zip seulement' });
    R.zip.fichiers_dossier = dmap.size; R.zip.fichiers_zip = zmap.size; R.zip.identiques = [...dmap].filter(([f, h]) => zmap.get(f) === h).length; R.zip.ecarts = diff; R.zip.prefixe = prefix;
    R.zip.dossier_mtime_max = new Date(Math.max(...files.map((p) => statSync(p).mtimeMs))).toISOString();
  }
  rmSync(tmp, { recursive: true, force: true });
}

// ---------- (5) latence de la voie autonome sur 1500 requetes
const bodies = sets.SCENARIOS_1500.items.map((i) => i.body);
for (let i = 0; i < 60; i++) CORE.check(bodies[i % bodies.length]); // chauffe
const wall = [], inner = [];
for (const b of bodies) { const t = performance.now(); const v = CORE.check(b); wall.push(performance.now() - t); inner.push(v.latency_ms); }
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]; };
const r3 = (x) => Math.round(x * 1000) / 1000;
R.latence = { n: bodies.length, mediane_ms: r3(q(wall, 0.5)), p95_ms: r3(q(wall, 0.95)), max_ms: r3(Math.max(...wall)), mediane_interne_ms: r3(q(inner, 0.5)), p95_interne_ms: r3(q(inner, 0.95)), chauffe: 60 };
R.net_calls = net;
writeFileSync(join(HERE, 'results.json'), JSON.stringify(R, null, 1));
console.log(JSON.stringify({ total: R.total, sets: Object.fromEntries(Object.entries(R.sets).map(([k, v]) => [k, { n: v.requetes, comparees: v.comparees, ident: v.identiques, ecarts: v.ecarts, filtrees: v.filtrees_http_serveur, complet: v.complet_identique, champs: v.champs, nonind: v.filtrees_noyau_pas_indetermine.length }])), causes: Object.fromEntries(Object.entries(R.causes).map(([k, v]) => [k, v.n])), ok_leak: R.ok_leak.count, niveaux: R.niveaux, latence: R.latence, zip: { ...R.zip, ecarts: R.zip.ecarts }, statique_noyau: R.statique_noyau_seul, net }, null, 1));

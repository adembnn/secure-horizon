// Tests EXECUTES de la version autonome, Node seulement (aucun navigateur, aucun reseau, un seul processus a la fois).
// A) reproductibilite du build  B) service worker charge avec un faux chrome : ~35 requetes, jamais 'ok', toujours la fenetre Hold up separee, jamais transmis sans geste
// C) repli quand le moteur plante  D) EQUIVALENCE avec la voie de reference (DEV via run_loop --dry, PUBLIC via les modules d'origine)
// E) version "sans contexte reseau" : ce que l'extension voit vraiment (corps du pont, sans le contexte synthetique du catalogue)  F) taille et latence
// G) tests unitaires (retenue, service worker, cote page) rejoues sur le dossier CONSTRUIT ; build --test-hook separe du dossier livre
// Usage : node tests/run_tests.mjs            Ecrit out/RESULTATS.json et out/RESULTATS.md. Ne lit JAMAIS attacks/TEST.jsonl.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REQUESTS, LOCALS } from './requests.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SA = resolve(HERE, '..');                       // extension_standalone
const ROOT = resolve(SA, '..');                       // T_banc_e2e
const EXT = join(SA, 'extension');
const OUT = join(SA, 'out'); mkdirSync(OUT, { recursive: true });
const imp = (p) => import(pathToFileURL(p).href);
const R = { checks: [], notes: [] };
let failed = 0;
function ok(cond, name, detail = '') { R.checks.push({ name, pass: !!cond, detail }); if (!cond) { failed++; console.log('ECHEC  ' + name + (detail ? ' : ' + detail : '')); } else console.log('ok     ' + name); }
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const r2 = (x) => Math.round(x * 100) / 100;
const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);

// ------------------------------------------------------------------ A) build reproductible
const treeOf = () => JSON.parse(readFileSync(join(EXT, 'BUILD_INFO.json'), 'utf8')).tree_sha256;
const sp = (args) => spawnSync(process.execPath, ['--no-warnings', ...args], { encoding: 'utf8' });
{
  const b1 = sp([join(SA, 'build_standalone.mjs')]); const t1 = treeOf();
  const b2 = sp([join(SA, 'build_standalone.mjs')]); const t2 = treeOf();
  ok(b1.status === 0 && b2.status === 0, 'build_standalone.mjs s execute sans erreur', b1.stderr + b2.stderr);
  ok(t1 === t2, 'build reproductible (2 constructions => meme hachage d arbre)', t1.slice(0, 16));
  R.tree_sha256 = t2;
}

// ------------------------------------------------------------------ B) service worker dans Node avec un faux chrome
process.env.HOLDUP_DIR = EXT;
const { makeChrome, EXT_URL } = await imp(join(ROOT, 'extension', 'tests', 'unit', 'fake_chrome.mjs'));
const F = makeChrome();
const store = F.state.local;        // chrome.storage.local du faux navigateur (cfg, journal, contexte)
globalThis.chrome = F.chrome;
// horloge pilotee : les delais de friction sont de vraies echeances absolues, on avance le temps au lieu d'attendre
const realNow = Date.now; let skew = 0; Date.now = () => realNow() + skew;
// aucun reseau : on piege fetch/XHR/WebSocket pour PROUVER qu'ils ne sont jamais appeles
let netCalls = 0;
globalThis.fetch = () => { netCalls++; throw new Error('RESEAU INTERDIT'); };
globalThis.XMLHttpRequest = function () { netCalls++; throw new Error('RESEAU INTERDIT'); };
globalThis.WebSocket = function () { netCalls++; throw new Error('RESEAU INTERDIT'); };

const SW = await imp(join(EXT, 'background.js'));
const CORE = await imp(join(EXT, 'engine', 'sentinelle_core.js'));
ok((await F.send({ type: 'hu.poll', rid: 'rid-inconnue-0000' }, F.page(1, 'https://x.test'))).state === 'unknown', 'le service worker enregistre son ecouteur onMessage (demande inconnue => unknown, lu comme un refus)');

// Une demande telle que bridge.js l'envoie : identifiant de demande, onglet et origine donnes par le navigateur (sender), jamais par le message.
let tabSeq = 100, ridSeq = 0;
async function gate(body) {
  const rid = 'rid-essai-' + String(++ridSeq).padStart(5, '0'); const tabId = ++tabSeq;
  const page = F.page(tabId, typeof body.origin === 'string' ? body.origin : 'https://inconnu.test', 0, body.url || undefined);
  const before = F.state.windows.size;
  const r = await F.send({ type: 'gate', rid, pageText: body.pageText, topOrigin: body.origin, payload: { kind: 'gate', method: body.method, params: body.params, chainId: body.chainId, from: body.from } }, page);
  let winId = null; for (const [id, o] of F.state.windows) if (o.url === EXT_URL + 'window.html#' + rid) winId = id;
  const g = { rid, page, r, winId, opened: F.state.windows.size === before + 1,
    poll: () => F.send({ type: 'hu.poll', rid }, page),
    view: async () => (await F.send({ type: 'hu.view', rid }, F.win(winId, rid))).view,
    decide: (m) => F.send(Object.assign({ type: 'hu.decision', rid }, m), F.win(winId, rid)) };
  return g;
}
// Va jusqu'a l'ecran de verdict en repondant aux questions (intention puis questions de plus), sans jamais dire "continuer".
async function toVerdict(g) {
  let v = await g.view();
  for (let i = 0; v && v.stage !== 'verdict' && i < 8; i++) { skew += 1000; const a = await g.decide({ seq: v.seq, decision: 'answer', value: v.stage === 'intent' ? 'pay' : v.grill.options[0].id }); v = a.view || await g.view(); }
  return v;
}

const rows = [];
let okSeen = 0;
for (const q of REQUESTS) {
  const isObj = q.body && typeof q.body === 'object' && !Array.isArray(q.body);
  const _local = isObj ? q.body._local : undefined;
  const raw = isObj ? (({ _local: _l, ...r }) => r)(q.body) : q.body;
  store.contexte = _local ? LOCALS[_local] : undefined;
  // 1) la fonction que le service worker appelle (meme code que le serveur)
  const v = await SW.localCheck(raw);
  const ms = v.latency_ms;
  const lvl = v.niveau; const bad = lvl === 'ok' || v.level === 'ok' || !['critical', 'warn', 'info'].includes(lvl);
  if (bad) okSeen++;
  const t = v.texts ? [v.texts.croit, v.texts.reel, v.texts.danger, v.texts.action] : [];
  const expect = q.expect;
  const meets = expect === 'any' ? true : expect === 'unknown' ? v.level === 'unknown' && v.niveau === 'warn' : expect === 'critical' ? lvl === 'critical' : expect === 'warn_or_critical' ? (lvl === 'warn' || lvl === 'critical') : true;
  rows.push({ name: q.name, niveau: lvl, level: v.level, fiche: v.fiche, why: v.why, ms, quatre_lignes: t.length === 4 && t.every((x) => typeof x === 'string' && x.length > 0), attendu: expect, conforme: meets });
  // 2) de bout en bout par l'ecouteur du service worker : la fenetre Hold up doit TOUJOURS s'ouvrir AVANT toute transmission, et rien ne passe sans geste de la personne
  if (typeof raw === 'object' && raw && !Array.isArray(raw)) {
    const g = await gate(raw); const row = rows[rows.length - 1];
    const p1 = await g.poll();
    if (g.r && g.r.done === true && g.r.allow === false) { row.fenetre = true; row.transmis_sans_geste = false; row.friction_conforme = true; row.refus_direct = g.r.reason; continue; } // demande sans methode lisible : refusee d'emblee, rien a montrer
    row.fenetre = g.opened && g.winId != null && F.state.windows.get(g.winId).type === 'popup' && F.state.windows.get(g.winId).focused === true;
    row.transmis_sans_geste = !(g.r && g.r.pending === true) || p1.state !== 'pending';
    const scr = await toVerdict(g);
    row.ecran = scr ? scr.verdict.level : null; row.friction = scr ? scr.message.friction.type : null;
    row.friction_conforme = !!scr && (scr.verdict.level === 'attention' ? scr.message.friction.type === 'none' : scr.verdict.level === 'manipulation' ? scr.message.friction.type === 'wait' : scr.message.friction.type === 'phrase');
    skew += 3600000;                                     // une heure plus tard, toujours sans geste : toujours pas transmis (expire => refus)
    const p2 = await g.poll(); if (p2.state === 'allow') row.transmis_sans_geste = true;
    await g.decide({ seq: 1, decision: 'cancel' }); await F.send({ type: 'hu.ack', rid: g.rid }, g.page);
  }
}
ok(okSeen === 0, `aucun verdict 'ok' sur ${rows.length} requetes (niveau toujours critical/warn/info)`, okSeen + ' fois');
ok(rows.every((r) => r.quatre_lignes), 'chaque verdict porte 4 lignes de texte clair non vides', rows.filter((r) => !r.quatre_lignes).map((r) => r.name).join(' | '));
ok(rows.filter((r) => 'fenetre' in r).every((r) => r.friction_conforme), 'friction par niveau : attention = lire, danger et non verifie = phrase a retaper + delai, manipulation = retenue', rows.filter((r) => 'fenetre' in r && !r.friction_conforme).map((r) => r.name + ' ' + r.ecran + '/' + r.friction).join(' | '));
ok(rows.filter((r) => 'fenetre' in r).every((r) => r.fenetre && !r.transmis_sans_geste), 'chaque requete surveillee ouvre la fenetre Hold up separee (popup au premier plan) et n est jamais transmise sans geste', rows.filter((r) => 'fenetre' in r && (!r.fenetre || r.transmis_sans_geste)).map((r) => r.name).join(' | '));
{
  // confirmer apres la friction = transmis ; annuler = refus ; fenetre impossible = repli dans la page, toujours ferme
  store.cfg = { askIntent: 'never', grill: { enabled: false } }; // ecran Danger direct (les reponses aux questions peuvent faire monter jusqu'a la retenue de 10 min)
  const a = await gate(REQUESTS[0].body); const va = await toVerdict(a);
  skew += 1000; const early = await a.decide({ seq: va.seq, decision: 'continue', phraseOk: true });
  ok(early.status === 'again' && (await a.poll()).state === 'pending', 'danger : phrase retapee mais delai non ecoule => pas encore transmis');
  skew += 30000; const fin = await a.decide({ seq: early.view.seq, decision: 'continue' });
  ok(fin.status === 'allow' && (await a.poll()).state === 'allow', 'confirmation explicite apres la friction => transmis', JSON.stringify([va && va.verdict.level, early.why, early.view && early.view.message.friction, fin.status, fin.why]));
  store.cfg = {};
  const b = await gate(REQUESTS[0].body); await b.decide({ seq: 1, decision: 'cancel' });
  ok((await b.poll()).state === 'deny', 'annulation => refuse');
  const c0 = await gate(REQUESTS[0].body); await F.userClosesWindow(c0.winId);
  ok((await c0.poll()).state === 'deny', 'fenetre fermee => refuse');
  F.state.failWindow = true;
  const c = await gate(REQUESTS[0].body); const pc = await c.poll(); F.state.failWindow = false;
  ok(c.r.pending === true && pc.state === 'pending' && pc.ui === 'overlay' && store.log.some((e) => e.type === 'ui_fallback'), 'fenetre impossible => repli dans la page, journalise, toujours retenu (mode ferme)');
}
const nonConf = rows.filter((r) => !r.conforme);
R.notes.push('Attentes de detection non satisfaites parmi les ' + rows.length + ' requetes types : ' + (nonConf.map((r) => `${r.name} (obtenu ${r.niveau}/${r.level}, attendu ${r.attendu})`).join(' ; ') || 'aucune'));
ok(nonConf.filter((r) => r.attendu === 'unknown').length === 0, 'les requetes malformees / trop volumineuses / non gerees donnent "indetermine" (warn)', nonConf.filter((r) => r.attendu === 'unknown').map((r) => r.name).join(' | '));
ok(netCalls === 0, 'aucun appel reseau (fetch/XHR/WebSocket piegés) pendant toutes les requetes', String(netCalls));
R.requests = rows;
store.contexte = undefined;

// ------------------------------------------------------------------ C) repli : le moteur plante
{
  const boom = { origin: 'https://x.org', get method() { throw new Error('boum'); }, params: [] };
  const v1 = await SW.localCheck(boom);
  ok(v1.level === 'unknown' && v1.niveau === 'warn' && v1.indeterminate === true && v1.texts.reel.length > 0, 'moteur qui plante (getter piege) => verdict indetermine, traite comme avertissement', JSON.stringify([v1.level, v1.niveau, v1.why]));
  const cyc = { origin: 'https://x.org', method: 'eth_sendTransaction', params: [] }; cyc.params.push(cyc);
  const v2 = await SW.localCheck(cyc); ok(v2.level === 'unknown' && v2.niveau === 'warn', 'corps cyclique (non serialisable) => indetermine', v2.why);
  const savedGet = store.contexte; const realGet = globalThis.chrome.storage.local.get; globalThis.chrome.storage.local.get = async () => { throw new Error('stockage HS'); };
  const v3 = await SW.localCheck(REQUESTS[0].body); ok(v3.niveau === 'critical', 'stockage local indisponible => le moteur tourne quand meme (contexte vide)', v3.niveau);
  globalThis.chrome.storage.local.get = realGet;
  store.contexte = { contacts: 'nimporte quoi', history: [{ address: 5 }], protected: null };
  const v4 = await SW.localCheck(REQUESTS[0].body); ok(v4.niveau === 'critical', 'contexte local corrompu => ignore, moteur intact', v4.niveau); store.contexte = savedGet;
}

// ------------------------------------------------------------------ C bis) aucune hypothese de chaine publique : noeud Hardhat local (31337), Avalanche (43114 / 43113)
{
  const A1 = '0x' + 'a1'.repeat(20), B2 = '0x' + 'b2'.repeat(20), TOK = '0x' + 'c3'.repeat(20);
  const approve = '0x095ea7b3' + B2.slice(2).padStart(64, '0') + 'f'.repeat(64);
  for (const cid of ['0x7a69', '0xa86a', '0xa869']) {
    const pay = CORE.check({ origin: 'http://localhost:8791', method: 'eth_sendTransaction', params: [{ from: A1, to: B2, value: '0xde0b6b3a7640000' }], chainId: cid, from: A1 });
    const txt = Object.values(pay.texts).join(' ');
    ok(['critical', 'warn', 'info'].includes(pay.niveau) && /AVAX/.test(txt) && !/\bETH\b|NATIVE|unités du réseau/.test(txt), 'chaine ' + Number(cid) + ' : envoi natif juge et libelle en AVAX', txt.slice(0, 160));
    const ap = CORE.check({ origin: 'http://localhost:8791', method: 'eth_sendTransaction', params: [{ from: A1, to: TOK, data: approve, value: '0x0' }], chainId: cid, from: A1 });
    ok(ap.niveau === 'critical' && ap.effects.grants_right === true, 'chaine ' + Number(cid) + ' : approve illimite vers un inconnu => critical', ap.niveau);
  }
  // le contexte local nomme les jetons de la chaine de repetition (les 4 jetons integres restent ceux du serveur, appliques quelle que soit la chaine)
  const USDC1 = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const local = CORE.sanitizeLocalContext({ tokens: [{ address: TOK, symbol: 'DemoUSDC', decimals: 6, chainId: 31337 }, { address: 'pas une adresse', symbol: 'X', decimals: 6 }] });
  const meta = (cid) => CORE.buildCtx({ origin: 'http://localhost:8791' }, local, A1, cid).tokenMeta;
  ok(local.tokens.length === 1 && meta(31337)[TOK] && meta(31337)[TOK].symbol === 'DemoUSDC' && meta(31337)[TOK].decimals === 6 && !meta(43114)[TOK] && meta(1)[USDC1.toLowerCase()].symbol === 'USDC',
    'jetons : ceux du contexte local sont nommes sur leur chaine seulement (31337), entrees invalides ecartees');
}

// ------------------------------------------------------------------ D) EQUIVALENCE
const readJsonl = (p) => readFileSync(p, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const dev = readJsonl(join(ROOT, 'attacks', 'DEV.jsonl'));
// PUBLIC.jsonl est ignore par git (*.jsonl) : absent d'un clone neuf. Dans ce cas l'equivalence PUBLIC est SAUTEE et le dit (jamais comptee comme reussie).
const pubFile = join(ROOT, 'attacks_public', 'PUBLIC.jsonl');
const pubPresent = existsSync(pubFile);
const pub = pubPresent ? readJsonl(pubFile) : [];
if (!pubPresent) { R.notes.push('attacks_public/PUBLIC.jsonl absent : equivalence PUBLIC non executee'); console.log('SAUTE  EQUIVALENCE PUBLIC : attacks_public/PUBLIC.jsonl absent (fichier ignore par git, a regenerer avec attacks_public/gen_public.mjs)'); }
if (dev.some((c) => c.split !== 'DEV')) throw new Error('DEV.jsonl contient un cas non DEV');

// adaptateur de donnees (test seulement) : champ `context` du cas -> contexte du moteur. COPIE de run_loop.buildCtx ; le moteur embarque est la seule chose evaluee.
function buildCtxCase(c) {
  const k = c.context; const now = Math.floor((c.intent.declaredAt ?? 1760000000000) / 1000);
  const known = (k.known_protocols || []).map((p) => lc(p.address));
  const tokenMeta = {}; const bySymbol = {};
  for (const t of k.token_registry || []) { tokenMeta[lc(t.address)] = { symbol: t.symbol, decimals: t.decimals, stable: ['USDC', 'USDT', 'DAI'].includes(t.symbol) }; bySymbol[t.symbol] = t.decimals; }
  const facts = {}; for (const [a, v] of Object.entries(k.counterparty_facts || {})) facts[lc(a)] = v;
  const ageBlocks = {}; for (const [a, v] of Object.entries(facts)) if (v.ageBlocks !== undefined) ageBlocks[a] = v.ageBlocks;
  for (const [a, v] of Object.entries(k.token_info || {})) { if (!tokenMeta[lc(a)]) tokenMeta[lc(a)] = { symbol: v.symbol, decimals: bySymbol[v.symbol] ?? 18 }; if (v.ageBlocks !== undefined && ageBlocks[lc(a)] === undefined) ageBlocks[lc(a)] = v.ageBlocks; }
  const codeSet = new Set([...known, ...(k.token_registry || []).map((t) => lc(t.address)), ...Object.keys(k.token_info || {}).map(lc)]);
  const history = (k.history || []).map((h) => ({ address: lc(h.address), ts: now - Math.round((h.minutes_ago || 0) * 60), direction: h.direction === 'sortie' ? 'out' : 'in', dust: h.direction !== 'sortie' && Number.parseFloat(h.amount) <= 0.01 }));
  return { chainId: k.chainId, from: lc(k.victim), now, origin: k.origin, knownSpenders: known, knownVerifiers: new Set(known), history, contacts: (k.address_book || []).map((b) => ({ address: lc(b.address), label: b.label })), tokenMeta, ageBlocks,
    codeOf: (a) => { a = lc(a); if (facts[a] && facts[a].isContract !== undefined) return !!facts[a].isContract; if (codeSet.has(a)) return true; return undefined; },
    expectedOut: k.quote?.expected_out_units ? () => BigInt(k.quote.expected_out_units) : undefined,
    _sharePct: k.share_of_balance_pct, _k: k, _facts: facts, _tokenInfo: k.token_info || {}, _book: k.address_book || [] };
}
function honestIntent(eff, ctx, declaredAt) { // copie de run_loop.honestIntent
  const base = { declaredAt }; const book = (a) => ctx._book.find((b) => lc(b.address) === lc(a));
  if (eff.approvals.length || eff.incoming.length) return { ...base, kind: 'buy_or_swap', freeText: 'Je réalise un échange / j\'autorise une application (dérivé des effets)', ...(eff.outgoing[0] ? { token: eff.outgoing[0].symbol, amount: eff.outgoing[0].amount } : {}) };
  if (eff.outgoing.length) { const o = eff.outgoing[0], b = book(o.to); return { ...base, kind: 'pay_someone', freeText: 'Je paie ce destinataire (dérivé des effets)', token: o.symbol, amount: o.amount, counterpartyAddress: o.to, ...(b ? { counterpartyLabel: b.label } : {}) }; }
  return { ...base, kind: 'connect_or_accept_offer', freeText: 'Je signe / me connecte (dérivé des effets)' };
}
const toNiveau = (lv) => (lv === 'unknown' ? 'unknown' : lv === 'ok' ? 'info' : lv); // la voie de reference dit 'ok' la ou l'extension dit 'info'
// verdicts de la version EMBARQUEE (3 bras, comme run_loop) : on appelle l'analyse du moteur embarque avec le contexte du cas
function embeddedArms(c) {
  const ctx = buildCtxCase(c); const req = c.request; const out = {};
  let floor;
  try { floor = CORE.analyze(req, ctx, null); } catch { return { sans_intention: 'unknown', intention_honnete: 'unknown', intention_mensongere: 'unknown' }; }
  out.sans_intention = floor.pol.level;
  const hi = honestIntent(floor.eff, ctx, c.intent.declaredAt);
  // chaque bras repart de zero (nouvelle analyse) pour ne rien partager entre bras
  out.intention_honnete = CORE.analyze(req, buildCtxCase(c), hi).pol.level;
  out.intention_mensongere = CORE.analyze(req, buildCtxCase(c), c.intent).pol.level;
  return out;
}
const ARMS = ['sans_intention', 'intention_honnete', 'intention_mensongere'];
function compareSets(name, cases, refLevels) {
  const diffs = []; let identical = 0, total = 0;
  const lat = [];
  for (const c of cases) {
    const t0 = performance.now(); const emb = embeddedArms(c); lat.push((performance.now() - t0) / 3);
    for (const arm of ARMS) {
      total++; const a = toNiveau(emb[arm] === 'ok' ? 'ok' : emb[arm]); const b = toNiveau(refLevels(c)[arm]);
      if (a === b) identical++; else diffs.push({ id: c.id, arm, embarque: a, reference: b, method: c.request.method });
    }
  }
  const res = { jeu: name, cas: cases.length, comparaisons: total, identiques: identical, ecarts: diffs.length, pct_identite: r2(100 * identical / total), diffs: diffs.slice(0, 50), latence_moyenne_ms_par_verdict: r2(avg(lat)) };
  ok(diffs.length === 0, `EQUIVALENCE ${name} : ${identical}/${total} verdicts identiques (${res.pct_identite} %) sur ${cases.length} cas x 3 bras`, diffs.slice(0, 5).map((d) => `${d.id}/${d.arm}: ${d.embarque} vs ${d.reference}`).join(' ; '));
  return res;
}

// D1) DEV : la voie de reference est run/run_loop.mjs --dry (processus Node, ecrit seulement dans out/)
const refDevFile = join(OUT, 'ref_dev_run_loop.json');
{
  const p = sp([join(ROOT, 'run', 'run_loop.mjs'), '--dry', refDevFile]);
  ok(p.status === 0 && existsSync(refDevFile), 'voie de reference run_loop.mjs --dry executee', (p.stderr || '').slice(0, 300));
}
const refDev = Object.fromEntries(JSON.parse(readFileSync(refDevFile, 'utf8')).cases.map((x) => [x.id, x.levels]));
R.equiv_dev = compareSets('DEV', dev, (c) => refDev[c.id]);

// D2) PUBLIC : la voie de reference est l'API du moteur d'origine (modules .mjs/.ts non convertis + run/policy.mjs), meme pipeline que attacks_public/run_public.mjs
{
  const E0 = await imp(join(ROOT, 'engine', 'src', 'engine.mjs'));
  const { compare: compare0 } = await imp(join(ROOT, 'engine', 'vendor', 'compare.ts'));
  const { applyExtraRules: extra0, analyzeChainRequest: chain0 } = await imp(join(ROOT, 'engine', 'src', 'rules_extra.mjs'));
  const { applyPolicy: policy0 } = await imp(join(ROOT, 'run', 'policy.mjs'));
  const lvlOf = (flags) => (flags.some((f) => f.severity === 'critical') ? 'critical' : flags.some((f) => f.severity === 'warn') ? 'warn' : 'ok');
  const analyzeTx0 = (tx, ctx) => { const o = { ...ctx }; delete o._sharePct; let eff = E0.analyzeTransaction(tx, o); if (ctx._sharePct && eff.outgoing.length) { const m = eff.outgoing.reduce((m2, x) => (BigInt(x.amountRaw) > BigInt(m2.amountRaw) ? x : m2)); const p100 = BigInt(Math.round(ctx._sharePct * 100)); if (p100 > 0n) eff = E0.analyzeTransaction(tx, { ...o, balances: { [lc(m.token)]: ((BigInt(m.amountRaw) * 10000n) / p100).toString() } }); } return eff; };
  const merge0 = (list) => { if (list.length === 1) return list[0]; const m = JSON.parse(JSON.stringify(list[0])); const cps = new Map(m.counterparties.map((c) => [c.address, c])); const seen = new Set(m.risk_flags.map((f) => f.code + '|' + f.detail)); for (const e of list.slice(1)) { for (const f of ['outgoing', 'incoming', 'approvals', 'controlChange', 'nested']) m[f].push(...e[f]); for (const c of e.counterparties) { if (cps.has(c.address)) cps.get(c.address).roles = [...new Set([...cps.get(c.address).roles, ...c.roles])]; else { cps.set(c.address, c); m.counterparties.push(c); } } for (const f of e.risk_flags) { const k = f.code + '|' + f.detail; if (!seen.has(k)) { seen.add(k); m.risk_flags.push(f); } } m.opaque = m.opaque || e.opaque; m.opaqueReasons = [...new Set([...m.opaqueReasons, ...e.opaqueReasons])]; if (!m.delegation && e.delegation) m.delegation = e.delegation; if (e.thirdParty) m.thirdParty = [...(m.thirdParty || []), ...e.thirdParty]; if (e.shareOfBalancePct !== undefined) m.shareOfBalancePct = Math.max(m.shareOfBalancePct ?? 0, e.shareOfBalancePct); } m.risk_flags.sort((a, b) => ({ info: 0, warn: 1, critical: 2 }[b.severity] - { info: 0, warn: 1, critical: 2 }[a.severity])); m.level = lvlOf(m.risk_flags); m.levelEvidence = lvlOf(m.risk_flags.filter((f) => !E0.OPACITY_CODES.has(f.code))); m.raw = { ...m.raw, batch: list.length }; return m; };
  const decode0 = (c, ctx) => { const { method, params } = c.request; switch (method) {
    case 'eth_sendTransaction': return { eff: analyzeTx0(params[0], ctx) };
    case 'wallet_sendCalls': { const p = params[0]; return { eff: merge0(p.calls.map((call) => analyzeTx0({ from: p.from, chainId: p.chainId, type: '0x2', ...call }, ctx))) }; }
    case 'eth_signTypedData_v4': return { eff: E0.analyzeTypedData(params[1], ctx) };
    case 'personal_sign': return { eff: E0.analyzePersonalSign(params[0], ctx) };
    case 'eth_sign': return { eff: E0.analyzeEthSign(params[1], ctx) };
    case 'wallet_switchEthereumChain': case 'wallet_addEthereumChain': { const e = chain0(c.request, ctx); return e ? { eff: e } : { unsupported: 1 }; }
    default: return { unsupported: 1 }; } };
  const refPub = (c) => {
    const lv = {}; const ctx = buildCtxCase(c); let dec;
    try { dec = decode0(c, ctx); } catch { return { sans_intention: 'unknown', intention_honnete: 'unknown', intention_mensongere: 'unknown' }; }
    if (dec.unsupported) return { sans_intention: 'unknown', intention_honnete: 'unknown', intention_mensongere: 'unknown' };
    const eff = dec.eff; extra0(eff, c.request, ctx);
    if (eff.shareOfBalancePct === undefined && ctx._sharePct !== undefined && !eff.outgoing.length) eff.shareOfBalancePct = ctx._sharePct;
    const pol = (intent) => policy0({ eff, adem: compare0(intent, eff), ctx, intent, request: c.request });
    lv.sans_intention = policy0({ eff, adem: null, ctx, intent: null, request: c.request }).level;
    lv.intention_honnete = pol(honestIntent(eff, ctx, c.intent.declaredAt)).level; lv.intention_mensongere = pol(c.intent).level; return lv;
  };
  const pubExec = pub.filter((c) => c.executable);
  if (pubPresent) R.equiv_public = compareSets('PUBLIC (executables)', pubExec, refPub); else R.equiv_public = { saute: 'PUBLIC.jsonl absent' };
  R.n_public_non_exec = pub.length - pubExec.length;
}

function bridgeBody(c) { const k = c.context; const o = /^https?:/.test(k.origin || '') ? k.origin : 'https://' + (k.origin || 'inconnu.local'); const p = c.request.params; return { origin: o, url: o, method: c.request.method, params: p, chainId: k.chainId ? '0x' + Number(k.chainId).toString(16) : undefined, from: k.victim }; }
// ------------------------------------------------------------------ D3) EQUIVALENCE SERVEUR / AUTONOME : meme corps de requete => meme verdict complet
// Base : server/test/presentation.test.mjs. Le bloc PRESENTATION doit etre identique octet pour octet ; puis evaluate() du serveur et du moteur embarque
// sont compares champ par champ (tout sauf le nom du moteur et les latences) sur les requetes types, DEV, PUBLIC (si present), avec et sans intention.
{
  const blockOf = (t) => { const i = t.indexOf('// <<PRESENTATION'), j = t.indexOf('// PRESENTATION>>', i); return i < 0 || j < 0 ? null : t.slice(t.indexOf('\n', i) + 1, j); };
  const bs = blockOf(readFileSync(join(ROOT, 'server', 'server.mjs'), 'utf8')), bc = blockOf(readFileSync(join(SA, 'src', 'sentinelle_core.js'), 'utf8'));
  ok(!!bs && bs === bc, 'bloc PRESENTATION identique octet pour octet dans server.mjs et src/sentinelle_core.js', bs ? bs.length + ' / ' + (bc || '').length + ' caracteres' : 'marqueurs absents');
  let SRV = null, loadErr = '';
  try { SRV = await imp(join(ROOT, 'server', 'server.mjs')); } catch (e) { loadErr = String(e && e.message || e).slice(0, 200); }
  ok(!!SRV, 'server/server.mjs se charge (moteur de reference)', loadErr);
  if (SRV) {
    const strip = (v) => { const o = JSON.parse(JSON.stringify(v)); delete o.engine; delete o.latency_ms; delete o.latency_engine_ms; return o; };
    const L0 = () => ({ contacts: [], history: [], protected: [], knownSpenders: [] });
    const sets = [];
    sets.push(['requetes types', REQUESTS.filter((q) => q.body && typeof q.body === 'object' && !Array.isArray(q.body)).map((q) => { const { _local, ...b } = q.body; return { id: q.name, body: b, local: _local ? LOCALS[_local] : null }; })]);
    sets.push(['DEV', dev.map((c) => ({ id: c.id, body: bridgeBody(c), local: null }))]);
    if (pubPresent) sets.push(['PUBLIC', pub.map((c) => ({ id: c.id, body: bridgeBody(c), local: null }))]);
    const PT = 'Le support te demande d’agir vite : remboursement en attente.';
    const variants = [['sans intention', (b) => b], ['intention pay', (b) => ({ ...b, intent: 'pay' })], ['intention receive', (b) => ({ ...b, intent: 'receive' })], ['intention asked + texte de page', (b) => ({ ...b, intent: 'asked', pageText: PT })]];
    R.equiv_serveur = [];
    for (const [name, items] of sets) {
      let total = 0, same = 0, skipped = 0; const diffs = [];
      for (const it of items) for (const [vn, mk] of variants) {
        const body = mk(it.body); let a, b;
        // le noeud Hardhat local n'est nomme AVAX que cote extension (ajout hors bloc) : difference voulue, non comparee
        const cid = Number(body.chainId); if (cid === 31337 || cid === 1337) { skipped++; continue; }
        try { a = strip(SRV.evaluate(JSON.parse(JSON.stringify(body)), it.local ? JSON.parse(JSON.stringify(it.local)) : L0())); } catch (e) { a = { throws: String(e && e.message || e).slice(0, 80) }; }
        try { b = strip(CORE.evaluate(JSON.parse(JSON.stringify(body)), it.local ? CORE.sanitizeLocalContext(it.local) : CORE.emptyLocal())); } catch (e) { b = { throws: String(e && e.message || e).slice(0, 80) }; }
        total++;
        if (JSON.stringify(a) === JSON.stringify(b)) same++;
        else { const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])); diffs.push({ id: it.id, variante: vn, champs: keys, serveur: keys.slice(0, 2).map((k) => JSON.stringify(a[k])).join(' ; ').slice(0, 200), autonome: keys.slice(0, 2).map((k) => JSON.stringify(b[k])).join(' ; ').slice(0, 200) }); }
      }
      R.equiv_serveur.push({ jeu: name, requetes: items.length, comparaisons: total, identiques: same, ecarts: diffs.length, non_comparees_chaine_locale: skipped, diffs: diffs.slice(0, 40) });
      ok(diffs.length === 0, 'EQUIVALENCE SERVEUR/AUTONOME ' + name + ' : ' + same + '/' + total + ' verdicts complets identiques (' + items.length + ' requetes x ' + variants.length + ' variantes)', diffs.slice(0, 4).map((d) => d.id + '/' + d.variante + ' [' + d.champs.join(',') + '] ' + d.serveur + ' <> ' + d.autonome).join(' || '));
    }
  }
}

// ------------------------------------------------------------------ E) ce que l'extension voit vraiment : corps du pont, SANS contexte synthetique
{
  const all = [...dev, ...pub.filter((c) => c.executable)];
  const tallies = {}; let n = 0, okCount = 0; const lat = [];
  const dist = { critical: 0, warn: 0, info: 0, unknown: 0 };
  for (const c of all) {
    const v = CORE.check(bridgeBody(c)); n++; lat.push(v.latency_ms);
    if (v.niveau === 'ok' || v.level === 'ok') okCount++;
    dist[v.level === 'unknown' ? 'unknown' : v.niveau]++;
    const key = c.label; (tallies[key] = tallies[key] || { n: 0, critical: 0, warn: 0, info: 0, unknown: 0 }); tallies[key].n++; tallies[key][v.level === 'unknown' ? 'unknown' : v.niveau]++;
  }
  ok(okCount === 0, `E) sans contexte reseau : aucun 'ok' sur ${n} cas reels du banc (DEV + PUBLIC)`, String(okCount));
  R.offline = { n, distribution: dist, par_label: tallies, latence_moyenne_ms: r2(avg(lat)), latence_p95_ms: r2(lat.slice().sort((a, b) => a - b)[Math.floor(lat.length * 0.95)]), latence_max_ms: r2(Math.max(...lat)) };
  // non executables du jeu public : verifier qu ils ne sortent jamais 'ok' non plus
  let nokNE = 0; for (const c of pub.filter((x) => !x.executable)) { const v = CORE.check({ origin: 'https://x.test', method: c.request.method, params: c.request.params }); if (v.niveau === 'ok') nokNE++; }
  ok(nokNE === 0, 'cas non executables du jeu public (autres chaines, extensions) : jamais ok non plus', String(nokNE));
  // chaque verdict porte 4 lignes non vides (echantillon complet)
  let bad4 = 0; for (const c of all) { const v = CORE.check(bridgeBody(c)); const t = v.texts; if (!t || ![t.croit, t.reel, t.danger, t.action].every((x) => typeof x === 'string' && x.length)) bad4++; }
  ok(bad4 === 0, `E) 4 lignes de texte clair non vides sur ${all.length} verdicts`, String(bad4));
}

// ------------------------------------------------------------------ F) taille et latence
function dirSize(d) { let s = 0, n = 0; for (const f of readdirSync(d)) { const p = join(d, f); const st = statSync(p); if (st.isDirectory()) { const r = dirSize(p); s += r.s; n += r.n; } else { s += st.size; n++; } } return { s, n }; }
const sz = dirSize(EXT);
R.taille = { fichiers: sz.n, octets: sz.s, ko: r2(sz.s / 1024) };
R.latence_requetes_types_ms = { moyenne: r2(avg(rows.map((r) => r.ms))), max: r2(Math.max(...rows.map((r) => r.ms))) };
console.log(`\nTaille extension : ${R.taille.fichiers} fichiers, ${R.taille.ko} Ko ; latence moyenne (requetes types) ${R.latence_requetes_types_ms.moyenne} ms ; (cas du banc, sans contexte) ${R.offline.latence_moyenne_ms} ms`);

// ------------------------------------------------------------------ G) tests unitaires sur le dossier construit ; crochet de test hors du dossier livre
{
  const u = spawnSync(process.execPath, ['--no-warnings', '--test', '--test-timeout=20000', ...readdirSync(join(ROOT, 'extension', 'tests', 'unit')).filter((f) => f.endsWith('.test.mjs')).map((f) => join(ROOT, 'extension', 'tests', 'unit', f))], { encoding: 'utf8', env: { ...process.env, HOLDUP_DIR: EXT } });
  const pass = Number((u.stdout.match(/^ℹ pass (\d+)/m) || [])[1] || 0), fail = Number((u.stdout.match(/^ℹ fail (\d+)/m) || [])[1] || 0);
  ok(u.status === 0 && pass > 0 && fail === 0, 'tests unitaires rejoues sur le dossier construit : ' + pass + ' reussis, ' + fail + ' en echec', (u.stdout || '').split('\n').filter((l) => l.startsWith('✖')).slice(0, 5).join(' | '));
  R.unit_sur_build = { pass, fail };
  for (const f of ['bridge.js', 'inject.js', 'gatekeeper.js', 'hold_core.js', 'intent_text.js', 'keyword_intent.js', 'outcome.js', 'written_check.js', 'classifier_client.js', 'window.html', 'window.css', 'window.js', 'options.js', 'ui/screen.css', 'ui/screen.js']) if (!readFileSync(join(EXT, f)).equals(readFileSync(join(ROOT, 'extension', f)))) ok(false, 'fichier partage identique dans les deux extensions : ' + f);
  ok(!existsSync(join(EXT, 'ui', 'verdict.js')) && !/iframe/i.test(readFileSync(join(EXT, 'window.html'), 'utf8')), 'surface de la fenetre : ui/screen.* (plus de cadre ui_holdup ni d iframe)');
  const t = sp([join(SA, 'build_standalone.mjs'), '--test-hook']); const TDIR = join(SA, 'extension_test');
  const hooked = existsSync(join(TDIR, 'background.js')) ? readFileSync(join(TDIR, 'background.js'), 'utf8') : '';
  ok(t.status === 0 && /testHook:/.test(hooked) && !/testHook/.test(readFileSync(join(EXT, 'background.js'), 'utf8')) && treeOf() === R.tree_sha256, 'le crochet de test n existe que dans le build --test-hook (dossier extension_test), le dossier livre est inchange');
  rmSync(TDIR, { recursive: true, force: true });
}

R.echecs = failed; R.total_checks = R.checks.length;
writeFileSync(join(OUT, 'RESULTATS.json'), JSON.stringify(R, null, 1));
console.log(`\n${R.checks.length - failed}/${R.checks.length} controles reussis`);
process.exit(failed ? 1 : 0);

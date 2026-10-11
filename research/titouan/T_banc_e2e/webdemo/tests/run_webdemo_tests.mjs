// Tests EXECUTES de la demo web, Node seulement (aucun navigateur lance, aucun reseau, un seul processus a la fois sauf la reconstruction du build).
// A) build reproductible  B) graphe d'imports de la page  C) 30+ scenarios : 'ok' ne sort jamais, textes presents, verdicts IDENTIQUES a la voie de reference (server/server.mjs = modules d'origine)
// D) equivalence sur les jeux PUBLIC et DEV (jamais TEST)  E) journal chaine  F) mode "colle"  G) analyse statique (secrets, eval, URL externes, CSP)  H) taille.
// Usage : node --no-warnings tests/run_webdemo_tests.mjs        Ecrit out/RESULTATS.json
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, relative, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const WD = resolve(HERE, '..');            // webdemo
const ROOT = resolve(WD, '..');            // T_banc_e2e
const imp = (p) => import(pathToFileURL(p).href);
const R = { checks: [], notes: [] }; let failed = 0;
function ok(cond, name, detail = '') { R.checks.push({ name, pass: !!cond, detail }); if (!cond) { failed++; console.log('ECHEC  ' + name + (detail ? ' : ' + detail : '')); } else console.log('ok     ' + name + (detail ? '  [' + detail + ']' : '')); }
const sha = (b) => createHash('sha256').update(b).digest('hex');

// ------------------------------------------------------------------ A) build reproductible
const treeOf = () => JSON.parse(readFileSync(join(WD, 'BUILD_INFO.json'), 'utf8')).tree_sha256;
{
  const run = () => spawnSync(process.execPath, ['--no-warnings', join(WD, 'build_webdemo.mjs')], { encoding: 'utf8' });
  const b1 = run(); const t1 = treeOf(); const b2 = run(); const t2 = treeOf();
  ok(b1.status === 0 && b2.status === 0, 'build_webdemo.mjs s execute sans erreur', (b1.stderr + b2.stderr).slice(0, 200));
  ok(t1 === t2, 'build reproductible (2 constructions => meme hachage d arbre)', t2.slice(0, 16));
  R.tree_sha256 = t2;
}
// le moteur copie est bien celui d'origine : memes octets, aux suffixes d'import pres (et Buffer->TextEncoder dans typed)
{
  let diffs = 0, n = 0;
  for (const f of readdirSync(join(ROOT, 'engine', 'src')).filter((x) => x.endsWith('.mjs') && !['rpc.mjs', 'audit_selectors.mjs'].includes(x))) {
    const a = readFileSync(join(ROOT, 'engine', 'src', f), 'utf8').replace(/\.mjs(['"])/g, '.js$1').replace('Buffer.byteLength(text)', 'new TextEncoder().encode(text).length');
    const b = readFileSync(join(WD, 'engine', 'src', f.replace(/\.mjs$/, '.js')), 'utf8'); n++;
    if (a !== b) { diffs++; console.log('  difference inattendue : ' + f); }
  }
  ok(diffs === 0 && n >= 14, `engine/src copie fidele (${n} fichiers, seuls .mjs->.js et Buffer->TextEncoder changent)`);
  // run/policy.mjs importe trois modules du moteur (fixes, engine, util) ; la copie les lit dans engine/src/ : ce sont les SEULS changements (3 chemins), le reste est identique octet pour octet.
  const pol = readFileSync(join(ROOT, 'run', 'policy.mjs'), 'utf8').replace("'../engine/src/fixes.mjs'", "'./src/fixes.js'").replace("'../engine/src/engine.mjs'", "'./src/engine.js'").replace("'../engine/src/util.mjs'", "'./src/util.js'");
  ok(pol === readFileSync(join(WD, 'engine', 'policy.js'), 'utf8'), 'policy.js = run/policy.mjs (seuls 3 chemins d import changent : fixes, engine, util)');
  { const gen = readFileSync(join(WD, 'engine', 'sentinelle_core.js'), 'utf8'); const srv = readFileSync(join(ROOT, 'server', 'server.mjs'), 'utf8').replace(/\r\n/g, '\n');
    const i0 = srv.indexOf('function buildCtx'), i1 = srv.indexOf('function decode'); const bc = srv.slice(i0, i1).trim();
    const patches = JSON.parse(readFileSync(join(WD, 'BUILD_INFO.json'), 'utf8')).patches_sentinelle_core;
    ok(gen.includes(bc) && gen.includes('function pickFiche') && gen.includes('seaport_zero_price') && patches.length >= 3, `sentinelle_core.js genere depuis server/server.mjs (buildCtx identique, regles Seaport presentes), ${patches.length} patchs documentes`); }
}

// ------------------------------------------------------------------ B) graphe d'imports de la page
function walk(dir, out = []) { for (const f of readdirSync(dir)) { if (['node_modules', '.git', 'out'].includes(f)) continue; const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); } return out; }
const ALL = walk(WD).filter((p) => !relative(WD, p).startsWith('tests'));
{
  const seen = new Set(); const missing = []; const bare = [];
  const visit = (p) => {
    if (seen.has(p)) return; seen.add(p);
    const t = readFileSync(p, 'utf8');
    for (const m of t.matchAll(/(?:^|\n)\s*(?:import|export)\s[^;'"]*?from\s*(['"])([^'"]+)\1|(?:^|\n)\s*import\s*(['"])([^'"]+)\3/g)) {
      const spec = m[2] || m[4];
      if (!/^\.{1,2}\//.test(spec)) { bare.push(p + ' -> ' + spec); continue; }
      const q = resolve(dirname(p), spec);
      if (!existsSync(q)) missing.push(relative(WD, p) + ' -> ' + spec); else visit(q);
    }
  };
  visit(join(WD, 'js', 'app.js'));
  for (const h of ['index.html', 'limites.html']) {
    const t = readFileSync(join(WD, h), 'utf8');
    for (const m of t.matchAll(/(?:src|href)="([^"#]+)(?:#[^"]*)?"/g)) { if (m[1].startsWith('data:')) continue; if (!existsSync(join(WD, m[1]))) missing.push(h + ' -> ' + m[1]); }
  }
  ok(!missing.length && !bare.length, `graphe d imports de js/app.js : ${seen.size} modules, tous presents, tous relatifs`, missing.concat(bare).join(' ; '));
  R.modules_charges = seen.size;
}

// ------------------------------------------------------------------ interdiction du reseau pendant TOUS les tests de moteur
let netCalls = 0;
for (const k of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource']) globalThis[k] = function () { netCalls++; throw new Error('RESEAU INTERDIT'); };

const M = await imp(join(WD, 'js', 'verdict_model.js'));
const S = await imp(join(WD, 'js', 'scenarios.js'));
const REF = await imp(join(ROOT, 'server', 'server.mjs'));         // voie de reference : modules d'origine (.mjs + compare.ts + policy.mjs)
const { REQUESTS } = await imp(join(ROOT, 'extension_standalone', 'tests', 'requests.mjs'));   // requetes types (lecture seule)

// ------------------------------------------------------------------ C) scenarios
const tmpCtx = join(tmpdir(), 'holdup_webdemo_ctx.json'); writeFileSync(tmpCtx, JSON.stringify(S.LOCAL));
const refLocal = REF.loadLocalContext(tmpCtx);
const webLocal = M.sanitizeLocalContext(S.LOCAL);
// contexte propre a chaque scene (ex. le routeur connu de la scene 1) : meme contenu cote page et cote voie de reference (fichier lu par loadLocalContext)
const webLocalOf = (s) => M.sanitizeLocalContext(S.localOf(s));
const refLocalOf = (s) => { const f = join(tmpdir(), 'holdup_webdemo_ctx_' + s.id + '.json'); writeFileSync(f, JSON.stringify(S.localOf(s))); return REF.loadLocalContext(f); };
const emptyLocal = M.emptyLocal();
const KEYS = ['level', 'niveau', 'fiche', 'texts', 'codes', 'effects', 'raisons', 'indeterminate', 'quote', 'address_diff', 'risk_signals', 'intent_contradiction', 'texts_source', 'lead'];
const pick = (v) => JSON.stringify(KEYS.map((k) => v[k]));
let absorbed = 0;
let filtered = 0;
function refVerdict(body, local) { let big = false; try { big = JSON.stringify(body).length > 256 * 1024; } catch (_) { big = true; }
  if (big || !body || typeof body !== 'object' || Array.isArray(body)) { filtered++; return M.check(body, local); } /* le serveur HTTP filtre ces corps avant evaluate() */ try { const r = REF.evaluate(body, local); return fixRef(r); } catch (e) { return { level: 'unknown', niveau: 'warn', indeterminate: true, throw: String(e.message).slice(0, 80) }; } }
// Seule difference VOULUE : le serveur ecrit « 1.3e+72 jours » pour une echeance illimitee, la page ecrit « un nombre illimité de jours » (correctif de l extension autonome).
function fixRef(r) { if (r && r.texts) for (const k of Object.keys(r.texts)) { const n = r.texts[k].replace(/(\d+(?:\.\d+)?(?:e\+\d+)?) jours/g, (m, d) => (Number(d) > 3650 ? 'un nombre illimité de jours' : m)); if (n !== r.texts[k]) { absorbed++; r.texts[k] = n; } } return r; }
const BAD_WORDS = /\b(ok|protégé|protege|bloqué|bloque|sûr|sur et sécurisé|safe)\b/i;

const cases = [];
for (const s of S.SCENARIOS) for (const i of [s.intentHonnete, 'pay', 'receive', 'asked', 'other', 'none']) cases.push({ name: `scenario ${s.id} / intention ${i}`, body: M.withIntent(s.body, i === 'other' ? 'none' : i, i === s.intentHonnete ? s.intentDetails : undefined), local: 'scen', scen: s });
for (const q of REQUESTS) { const b = q.body; const isObj = b && typeof b === 'object' && !Array.isArray(b); const raw = isObj ? (({ _local, ...r }) => r)(b) : b; cases.push({ name: 'type: ' + q.name, body: raw, local: isObj && b._local === 'contact' ? 'scen' : 'empty' }); }
ok(cases.length >= 30, `${cases.length} cas de test (>= 30) : 13 scenes x 6 intentions + requetes types + malformees`);

let okSeen = 0, identical = 0, bad = []; const diffs = []; const levels = {};
const t0 = performance.now();
for (const c of cases) {
  const wl = c.scen ? webLocalOf(c.scen) : c.local === 'scen' ? webLocal : emptyLocal, rl = c.scen ? refLocalOf(c.scen) : c.local === 'scen' ? refLocal : { contacts: [], history: [], protected: [], knownSpenders: [] };
  const v = M.check(structuredCloneSafe(c.body), wl);
  const r = refVerdict(structuredCloneSafe(c.body), rl);
  const lv = M.displayLevel(v); levels[lv.key] = (levels[lv.key] || 0) + 1;
  const flat = JSON.stringify(v);
  if (v.level === 'ok' || v.niveau === 'ok' || /"(level|niveau)":"ok"/.test(flat)) okSeen++;
  if (!['critical', 'warn', 'info'].includes(v.niveau) || !['attention', 'danger', 'manipulation', 'unknown'].includes(v.level)) bad.push(c.name + ' (niveau invalide)');
  if (BAD_WORDS.test(lv.label + ' ' + lv.sentence)) bad.push(c.name + ' (mot interdit dans le libelle)');
  if (lv.key === 'info' && !/Aucun signal trouvé/.test(lv.label) ) bad.push(c.name + ' (info sans "Aucun signal")');
  if (!(v.texts && ['croit', 'reel', 'danger', 'action'].every((k) => typeof v.texts[k] === 'string' && v.texts[k].length > 3))) bad.push(c.name + ' (4 lignes de texte manquantes)');
  { const f0 = M.frictionSeconds(lv.key, 0), f30 = M.frictionSeconds(lv.key, 30); if ((lv.key === 'info' && (f0 || f30)) || (lv.key === 'danger' && f0 < 10) || (lv.key === 'manipulation' && f0 < 30) || (lv.key !== 'info' && f30 < 30)) bad.push(c.name + ' (friction incoherente)'); }
  // niveau de reference : la voie d'origine dit 'ok' la ou la page dit 'info' ; les deux sont le plancher
  if (pick(v) === pick(r)) identical++; else diffs.push({ cas: c.name, web: [v.level, v.niveau, v.fiche], ref: [r.level, r.niveau, r.fiche], throw: r.throw });
}
const ms = performance.now() - t0;
ok(okSeen === 0, `'ok' ne sort jamais : 0 sur ${cases.length} verdicts (niveau et level)`);
ok(!bad.length, 'chaque verdict : niveau valide, 4 lignes de texte, libelle sans "OK/protege/bloque", friction coherente', bad.slice(0, 4).join(' ; '));
ok(diffs.length === 0, `verdicts IDENTIQUES a la voie de reference (server/server.mjs) : ${identical}/${cases.length}`, diffs.slice(0, 3).map((d) => `${d.cas}: ${d.web} vs ${d.ref}`).join(' ; '));
R.scenarios = { filtres_par_la_couche_http_du_serveur: filtered, correctif_jours_absorbe: absorbed, cas: cases.length, identiques: identical, ecarts: diffs.slice(0, 20), niveaux_affiches: levels, ms_total: Math.round(ms), ms_par_verdict: Math.round(ms / cases.length * 100) / 100 };

// les 8 scenarios : avec l'intention honnete, ce qu'on attend (le plancher objectif ne depend pas de l'intention)
{
  const expect = { echange_honnete: 'info', echange_routeur_connu: 'attention', echange_droit_illimite: 'danger', coffre_delegatecall: 'danger', coffre_conforme: 'info', permit_piege: 'danger',
    envoi_simple: 'info', echange_legitime: 'info', droit_illimite: 'danger', tous_les_nft: 'danger', adresse_sosie: 'danger', changement_proprietaire: 'danger', faux_support: 'manipulation' };
  const got = {}; let all = true;
  for (const s of S.SCENARIOS) { const k = M.displayLevel(M.check(M.withIntent(s.body, s.intentHonnete, s.intentDetails), webLocalOf(s))).key; got[s.id] = k; if (k !== expect[s.id]) all = false; }
  ok(all && Object.keys(expect).length === S.SCENARIOS.length, 'les 13 scenarios, reponse honnete : niveaux attendus (4 sans signal, 1 attention, 7 danger, 1 manipulation)', JSON.stringify(got));
  R.niveaux_scenarios = got;
  // une reponse fausse sur le faux support ne doit PAS faire baisser a tort : on constate honnetement ce qui se passe
  const fs = S.SCENARIOS.find((s) => s.id === 'faux_support');
  const lied = M.displayLevel(M.check(M.withIntent(fs.body, 'pay'), webLocal)).key;
  R.notes.push(`LIMITE CONSTATEE : faux_support avec la reponse "Payer quelqu'un" donne le niveau '${lied}' (la pression de la page n'est lue que si le moteur voit deja un signal).`);
  console.log('note   ' + R.notes[R.notes.length - 1]);
}
// aucun reseau pendant les verdicts
ok(netCalls === 0, 'aucun appel reseau (fetch/XHR/WebSocket pieges) pendant les verdicts');

// ------------------------------------------------------------------ D) equivalence sur PUBLIC et DEV
const readJsonl = (p) => readFileSync(p, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
for (const [name, file] of [['PUBLIC', join(ROOT, 'attacks_public', 'PUBLIC.jsonl')], ['DEV', join(ROOT, 'attacks', 'DEV.jsonl')]]) {
  if (file.endsWith('TEST.jsonl')) throw new Error('TEST interdit');
  const rows = readJsonl(file);
  if (name === 'DEV' && rows.some((c) => c.split !== 'DEV')) throw new Error('DEV.jsonl contient un cas non DEV');
  let id = 0, okN = 0; const d = []; const lvls = {};
  for (const c of rows) {
    const k = c.context || {}; const lc = (a) => String(a).toLowerCase();
    const body = { origin: 'https://' + (k.origin || 'site.example'), method: c.request.method, params: c.request.params, from: k.victim, chainId: k.chainId };
    const local = { contacts: (k.address_book || []).map((b) => ({ address: lc(b.address), label: b.label })), history: [], protected: [], knownSpenders: [] };
    const v = M.check(structuredCloneSafe(body), M.sanitizeLocalContext(local));
    const r = refVerdict(structuredCloneSafe(body), local);
    if (v.level === 'ok' || v.niveau === 'ok') okN++;
    lvls[M.displayLevel(v).key] = (lvls[M.displayLevel(v).key] || 0) + 1;
    if (pick(v) === pick(r)) id++; else d.push({ id: c.id, web: [v.level, v.niveau, v.fiche], ref: [r.level, r.niveau, r.fiche] });
  }
  ok(okN === 0 && d.length === 0, `${name} : ${rows.length} cas, verdicts web identiques a la voie de reference : ${id}/${rows.length}, 'ok' jamais`, d.slice(0, 3).map((x) => `${x.id}: ${x.web} vs ${x.ref}`).join(' ; '));
  R['equivalence_' + name] = { cas: rows.length, identiques: id, ecarts: d.slice(0, 20), niveaux_affiches: lvls };
}
ok(netCalls === 0, 'aucun appel reseau pendant l equivalence PUBLIC/DEV');

// ------------------------------------------------------------------ E) journal chaine
{
  const J = await imp(join(WD, 'js', 'journal.js')); const { sha256hex } = await imp(join(WD, 'js', 'sha256.js'));
  const st = J.memoryStorage();
  for (let i = 0; i < 6; i++) J.append(st, { source: 'demo', scenario: 's' + i, decision: i % 2 ? 'cancel' : 'sign' }, 1760000000000 + i * 1000);
  const rows = J.readAll(st);
  ok(rows.length === 6 && J.verify(rows).ok, 'journal : 6 lignes chainees, chaine intacte');
  ok(rows[0].hash === createHash('sha256').update(rows[0].prev + '|1|' + rows[0].ts + '|' + JSON.stringify(rows[0].entry)).digest('hex'), 'journal : empreinte = SHA-256 de node:crypto (meme format que le journal du serveur)');
  ok(['', 'abc', 'é€'.repeat(50)].every((s) => sha256hex(s) === createHash('sha256').update(s).digest('hex')), 'SHA-256 en JS pur = node:crypto');
  const seq = J.tamper(st); const v = J.verify(J.readAll(st));
  ok(seq && !v.ok && v.brokenAt === seq, `journal : une ligne retouchee (n°${seq}) est detectee`, v.why);
  const st2 = J.memoryStorage(); for (let i = 0; i < 5; i++) J.append(st2, { i }, 1);
  const rr = J.readAll(st2); rr.splice(2, 1); st2.setItem(J.KEY, JSON.stringify(rr));
  ok(!J.verify(J.readAll(st2)).ok, 'journal : une ligne supprimee est detectee');
  ok(JSON.stringify(J.readAll(J.memoryStorage())) === '[]' && J.browserStorage().persistent === false, 'journal : sans localStorage (Node), repli en memoire sans erreur');
}

// ------------------------------------------------------------------ F) mode "colle"
{
  const P = await imp(join(WD, 'js', 'paste.js'));
  const tx = P.parsePasted(JSON.stringify(P.EXEMPLE_TX), { origin: 'https://x.example' });
  const ty = P.parsePasted(JSON.stringify(P.EXEMPLE_TYPED), {});
  const bare = P.parsePasted(JSON.stringify(P.EXEMPLE_TX.params[0]), {});
  const typedBare = P.parsePasted(JSON.stringify(JSON.parse(P.EXEMPLE_TYPED.params[1])), {});
  const vt = M.check(tx.body, M.emptyLocal()), vy = M.check(ty.body, M.emptyLocal());
  ok(!tx.error && !ty.error && bare.body.method === 'eth_sendTransaction' && typedBare.body.method === 'eth_signTypedData_v4', 'colle : 4 formes acceptees (JSON-RPC tx, JSON-RPC typed, tx seule, typed seul)');
  ok(M.displayLevel(vt).key === 'danger' && M.displayLevel(vy).key === 'danger', 'colle : exemple droit illimite et exemple permit => Danger', M.displayLevel(vt).key + ' / ' + M.displayLevel(vy).key);
  ok(['', 'pas du json', '42', '[]', '{"hello":1}', 'x'.repeat(300000)].every((t) => P.parsePasted(t, {}).error), 'colle : entrees invalides refusees avec un message (vide, non-JSON, nombre, tableau vide, forme inconnue, trop long)');
  const ex = (await imp(join(WD, 'js', 'exemples_public.js'))).default;
  const exl = ex.map((e) => M.check({ origin: e.origin, method: e.request.method, params: e.request.params }, M.emptyLocal()));
  ok(ex.length >= 10 && exl.every((v) => v.niveau !== 'ok'), `colle : ${ex.length} exemples du jeu public chargeables, aucun 'ok'`, JSON.stringify(exl.reduce((a, v) => { const k = M.displayLevel(v).key; a[k] = (a[k] || 0) + 1; return a; }, {})));
  const tr = M.explain(S.SCENARIOS.find((x) => x.id === 'echange_droit_illimite').body, S.LOCAL);
  ok(tr.ok && tr.lines.length >= 2 && tr.signals.length >= 1, 'panneau technique : effets decodes et signaux disponibles', tr.lines.map((l) => l.k).join(', '));
}

// ------------------------------------------------------------------ I) la fenetre "Hold up !" EXECUTEE dans un mini DOM (aucun navigateur)
{
  const D = await imp(join(HERE, 'fake_dom.mjs')); const dom = D.installFakeDom();
  const HU = await imp(join(WD, 'js', 'holdup.js'));
  const sc = (id) => S.SCENARIOS.find((s) => s.id === id);
  const btn = (txt) => [...dom.body.querySelectorAll('button')].find((b) => b.textContent.includes(txt));
  const txt = () => dom.body.textContent;
  // la question d'intention = pilules (boutons radio) + bouton « Vérifier » : on coche comme une personne, puis on valide
  const isModal = () => { const w = dom.body.querySelector('section'); return !!w && w.getAttribute('role') === 'alertdialog' && w.getAttribute('aria-modal') === 'true'; }; // la fenetre n'affiche plus le texte « Hold up ! » : on verifie qu'elle est bien une fenetre modale qui retient la demande
  const choose = (label) => { const l = [...dom.body.querySelectorAll('label')].find((x) => x.textContent.includes(label)); if (!l) throw new Error('choix introuvable : ' + label); l.querySelector('input').click(); btn('Vérifier').click(); };
  const ALLTXT = [];
  // 1) droit illimite : question -> verdict Danger -> delai -> continuer
  let p = HU.holdRequest({ body: sc('droit_illimite').body, local: S.LOCAL, delaySec: 5, askIntent: true, siteLabel: 'faux site' });
  const q1 = txt(); ALLTXT.push(q1);
  ok(isModal() && q1.includes('Rien n’a été envoyé') && q1.includes('Qu’essaies-tu de faire ?') && !!btn('Annuler') && !!btn('Vérifier') && dom.body.querySelectorAll('input').length === 6, 'fenetre : "Hold up !", question d intention en une phrase, 6 choix, Vérifier, Annuler visible');
  choose('Recevoir');
  const v1 = txt(); ALLTXT.push(v1); const cont = btn('Continuer quand même');
  ok(v1.includes('Danger') && v1.includes('Tu crois') && v1.includes('En vrai') && v1.includes('Voir les preuves techniques') && !!btn('Annuler'), 'fenetre : niveau Danger, "Tu crois / En vrai", panneau technique, Annuler visible');
  ok(cont && cont.disabled && txt().includes('Tu pourras continuer dans'), 'friction : "Continuer quand même" bloque pendant le delai, avec compte a rebours');
  for (let i = 0; i < 9; i++) dom.tick();
  ok(cont.disabled, 'friction : toujours bloque a 9 s (Danger = 10 s minimum meme si le delai choisi est 5 s)');
  for (let i = 0; i < 3; i++) dom.tick();
  ok(!cont.disabled, 'friction : debloque apres 10 s');
  cont.click(); const r1 = await p;
  ok(r1.decision === 'sign' && r1.level === 'danger' && r1.verdict.niveau === 'critical' && dom.body.children.length === 0 && dom.timersActive() === 0, 'fenetre : decision enregistree, fenetre retiree, minuteur arrete');
  // 2) faux support : Manipulation, Annuler pendant le delai
  p = HU.holdRequest({ body: sc('faux_support').body, local: S.LOCAL, delaySec: 0, askIntent: true });
  choose('demandé de le faire'); const v2 = txt(); ALLTXT.push(v2);
  ok(v2.includes('Manipulation') && v2.includes('Message vu sur la page') && btn('Continuer quand même').disabled, 'fenetre : faux support => Manipulation, citation de la page, continuer bloque (30 s minimum)');
  btn('Annuler').click(); const r2 = await p;
  ok(r2.decision === 'cancel' && r2.level === 'manipulation' && dom.body.children.length === 0, 'Annuler marche a tout moment, meme pendant le delai');
  // 3) Echap = annuler
  p = HU.holdRequest({ body: sc('adresse_sosie').body, local: S.LOCAL, delaySec: 5, askIntent: false });
  const v3 = txt(); ALLTXT.push(v3); dom.press('Escape'); const r3 = await p;
  ok(v3.includes('Danger') && r3.decision === 'cancel', 'Echap annule ; sans question d intention, le verdict s affiche directement');
  // 4) aucun signal : jamais "OK", rappel que ce n est pas une garantie, pas de delai
  p = HU.holdRequest({ body: sc('envoi_simple').body, local: S.LOCAL, delaySec: 5, askIntent: false });
  const v4 = txt(); ALLTXT.push(v4);
  ok(v4.includes('Aucun signal trouvé') && v4.includes('pas une garantie') && !!btn('Continuer') && !btn('Continuer').disabled && !btn('Continuer quand même'), 'aucun signal : libelle "Aucun signal trouvé" + "pas une garantie", pas de delai inutile');
  btn('Continuer').click(); await p;
  const all = ALLTXT.join(' ');
  ok(!/\b(OK|Ok|protégé|bloqué|Bloqué|Protégé|sûr|safe)\b/.test(all), 'aucun ecran n affiche OK / protégé / bloqué / sûr (' + ALLTXT.length + ' ecrans lus)');
  // 4b) scene « echanger 50 USDC » : intention ecrite contre effet reel
  p = HU.holdRequest({ body: sc('echange_droit_illimite').body, local: S.LOCAL, delaySec: 0, askIntent: true, siteLabel: 'faux echange', intentDetails: sc('echange_droit_illimite').intentDetails, ecrit: sc('echange_droit_illimite').ecrit, honnete: 'swap' });
  const q5 = txt(); ALLTXT.push(q5);
  choose('Échanger'); const v5 = txt(); ALLTXT.push(v5);
  ok(q5.includes('Tu as écrit : « Échanger 50 USDC contre de l’ETH »') && v5.includes('Ce que tu voulais') && v5.includes('Ce que la demande fait') && v5.includes('Ça ne correspond pas.') && v5.includes('Danger') && btn('Continuer quand même').disabled, 'scene echange 50 USDC : intention ecrite, « Ça ne correspond pas. », niveau Danger, continuer bloque');
  btn('Annuler').click(); const r5 = await p;
  ok(r5.decision === 'cancel' && r5.verdict.raisons.some((r) => r.code === 'approval_exceeds_intent') && r5.verdict.raisons.some((r) => r.code === 'unlimited_allowance'), 'scene echange 50 USDC : le comparateur retient « droit au-dela de l intention » (approval_exceeds_intent) et le droit illimite', r5.verdict.raisons.map((r) => r.code).join(','));
  // reponse differente de l'honnete : pas de comparaison ecrite (elle ne vaut que pour l'intention ecrite), le plancher reste Danger
  p = HU.holdRequest({ body: sc('echange_droit_illimite').body, local: S.LOCAL, delaySec: 0, askIntent: true, intentDetails: sc('echange_droit_illimite').intentDetails, ecrit: sc('echange_droit_illimite').ecrit, honnete: 'swap' });
  choose('Payer'); const v5b = txt(); ALLTXT.push(v5b);
  ok(!v5b.includes('Ça correspond') && v5b.includes('Danger') && !v5b.includes('Ce que tu voulais'), 'scene echange 50 USDC : autre reponse => pas de comparaison ecrite, toujours Danger');
  btn('Annuler').click(); await p;
  // « Ça correspond » : jamais de vert ni de OK, rappel que ce n est pas une garantie
  { const UI = await imp(join(WD, 'js', 'ui.js')); const vi = M.check(M.withIntent(sc('envoi_simple').body, 'pay'), M.sanitizeLocalContext(S.LOCAL));
    const parts = UI.verdictParts(vi, { body: sc('envoi_simple').body, local: S.LOCAL, intentKey: 'pay', compare: { voulu: 'Envoyer 0,1 ETH à Paul' } });
    const box = document.createElement('div'); box.append(...parts.top); const tt = box.textContent; ALLTXT.push(tt);
    const css = readFileSync(join(WD, 'css', 'holdup.css'), 'utf8'); const rule = (css.match(/\.match-yes\s*\{[^}]*\}/) || [''])[0];
    ok(M.displayLevel(vi).key === 'info' && tt.includes('Ça correspond, d’après ce que Hold up sait lire. Ce n’est pas une garantie.') && rule.length > 0 && !/green|#0[0-9a-f]{5}|#[0-9a-f]{2}[c-f][0-9a-f]{3}/i.test(rule), '« Ça correspond » ne s affiche qu avec « pas une garantie » et sans style vert'); }
  // 4c) scenes du pitch : on joue la fenetre comme une personne (question, reponse honnete, lecture, bouton)
  const play = async (id, { choice, ask = true, act = null, delaySec = 5 }) => {
    const s = sc(id); const shots = [];
    const p = HU.holdRequest({ body: s.body, local: S.localOf(s), delaySec, askIntent: ask, siteLabel: s.site, intentDetails: s.intentDetails || null, ecrit: s.ecrit || '', honnete: s.intentHonnete, corrige: s.corrige || null });
    if (ask) { shots.push(txt()); choose(choice || S.INTENTS.find((x) => x[0] === s.intentHonnete)[1]); }
    shots.push(txt()); ALLTXT.push(txt());
    if (act) { const r = act(shots); if (r) shots.push(...r); }
    if (!dom.body.children.length) return { shots, r: await p };
    btn('Annuler').click(); return { shots, r: await p };
  };
  { // temps 1 : routeur connu
    let s1 = null;
    const a = await play('echange_routeur_connu', { act: (shots) => { s1 = { cont: btn('Continuer quand même'), fix: btn('Limiter à 50 USDC') }; const t1 = txt();
      ok(t1.includes('Ça ne correspond pas.') && t1.includes('Attention') && t1.includes('Tu peux limiter le droit') && !t1.includes('Danger'), 'scene 1 temps 1 : routeur connu => « Ça ne correspond pas. », niveau Attention (pas Danger), « Tu peux limiter » 50 USDC');
      ok(!!s1.fix && !!s1.cont && !s1.cont.disabled && !!btn('Annuler'), 'scene 1 temps 1 : pas d attente (Q16), bouton « Limiter à 50 USDC », Annuler visible'); } });
    ok(a.r.decision === 'cancel' && a.r.level === 'attention', 'scene 1 temps 1 : Annuler marche, niveau enregistre = attention');
    // limiter : la meme demande avec 50 USDC
    const p2 = HU.holdRequest({ body: sc('echange_routeur_connu').body, local: S.localOf(sc('echange_routeur_connu')), delaySec: 5, askIntent: true, intentDetails: sc('echange_routeur_connu').intentDetails, ecrit: sc('echange_routeur_connu').ecrit, honnete: 'swap', corrige: sc('echange_routeur_connu').corrige });
    choose('Échanger'); btn('Limiter à 50 USDC').click(); const t2 = txt(); ALLTXT.push(t2);
    ok(t2.includes('Droit limité à 50 USDC.') && t2.includes('Ça correspond, d’après ce que Hold up sait lire. Ce n’est pas une garantie.') && t2.includes('Aucun signal trouvé') && !btn('Limiter à 50 USDC') && !!btn('Continuer') && !btn('Continuer').disabled, 'scene 1 : apres « Limiter », la demande relue dit « Ça correspond… pas une garantie », jamais OK ni vert');
    btn('Continuer').click(); const r2 = await p2;
    ok(r2.decision === 'sign' && r2.limited === true, 'scene 1 : Continuer apres limitation => decision enregistree comme limitee');
    // sans la phrase ecrite (autre reponse) : pas de bouton de limitation, pas de baisse
    const b = await play('echange_routeur_connu', { choice: 'Payer' });
    ok(!b.shots[1].includes('Limiter à') && !b.shots[1].includes('Ce que tu voulais'), 'scene 1 : autre reponse que l intention ecrite => ni comparaison ni bouton de limitation');
  }
  { // temps 2 : adresse neuve, danger, pas de limitation
    let waits = null;
    const a = await play('echange_droit_illimite', { delaySec: 0, act: () => { const c = btn('Continuer quand même'); waits = !!c && c.disabled; } });
    ok(a.shots[1].includes('Ça ne correspond pas.') && a.shots[1].includes('Danger') && !a.shots[1].includes('Limiter à') && waits === true, 'scene 1 temps 2 : adresse neuve => « Ça ne correspond pas. », Danger, pas de limitation, Continuer bloque (10 s au moins)');
    // le niveau du temps 2 est au moins celui du temps 1
    const rank = { info: 0, attention: 1, danger: 2 };
    ok(rank[a.r.level] >= rank.attention, 'scene 1 : temps 2 (adresse neuve) au moins aussi haut que temps 1');
  }
  { // site honnete
    const a = await play('echange_honnete', { act: () => { ok(txt().includes('Ça correspond, d’après ce que Hold up sait lire. Ce n’est pas une garantie.') && !!btn('Continuer') && !btn('Continuer quand même'), 'scene 1 : site honnete (droit de 50 USDC) => « Ça correspond… pas une garantie », Continuer sans attente'); btn('Continuer').click(); } });
    ok(a.r.decision === 'sign', 'scene 1 : site honnete, Continuer fonctionne');
  }
  { // coffre : delegatecall, avec et sans phrase
    const a = await play('coffre_delegatecall', {});
    const t = a.shots[1];
    ok(t.includes('Ça ne correspond pas.') && t.includes('Danger') && t.includes('Envoyer 20 USDC à Paul') && /programme étranger|appel délégué|pleins pouvoirs/i.test(t + (a.r.verdict.texts.reel || '')) && a.r.verdict.fiche === 'F09' && a.r.verdict.codes.includes('delegatecall_unknown_target'), 'scene 2 : virement affiche 20 USDC, charge = appel delegue vers contrat inconnu => Danger (F09, delegatecall_unknown_target)');
    const n = await play('coffre_delegatecall', { ask: false, delaySec: 0 });
    ok(n.r.level === 'danger' && n.shots[0].includes('Danger') && n.shots[0].includes('Tu n’as pas écrit ce que tu voulais faire') && !n.shots[0].includes('Ça correspond'), 'scene 2 : sans phrase, Danger quand meme (plancher), et la page le dit');
    const o = await play('coffre_delegatecall', { choice: 'Autre' });
    ok(o.r.level === 'danger', 'scene 2 : reponse « Autre » => Danger inchange');
  }
  { // coffre conforme : info limitee, jamais vert
    const a = await play('coffre_conforme', { act: () => { btn('Continuer') && 0; } });
    const t = a.shots[1];
    ok(a.r.level === 'info' && t.includes('Aucun signal trouvé') && /vérification est limitée/.test(t) && t.includes('Ça correspond, d’après ce que Hold up sait lire. Ce n’est pas une garantie.') && !/\bOK\b|sûr|protégé/.test(t), 'scene 2 conforme : Aucun signal trouvé, « vérification limitée », « pas une garantie », jamais OK ni sûr');
  }
  { // me connecter : Permit
    const a = await play('permit_piege', {});
    const t = a.shots[1];
    ok(t.includes('Ça ne correspond pas.') && t.includes('Me connecter à ce site') && t.includes('Danger') && !t.includes('Limiter à') && a.r.verdict.fiche === 'F02', 'scene 3 : « me connecter » + Permit => « Ça ne correspond pas. », Danger, aucune limitation proposee pour une signature (F02)');
  }
  { // la troisieme reponse : « Je n'ai pas pu vérifier »
    const UI = await imp(join(WD, 'js', 'ui.js')); const vu = M.check({}, M.emptyLocal());
    const a = document.createElement('div'); a.append(...UI.verdictParts(vu, { compare: { voulu: 'Envoyer 1 ETH' } }).top);
    const b = document.createElement('div'); b.append(...UI.verdictParts(vu, {}).top);
    ok(M.displayLevel(vu).key === 'unknown' && a.textContent.includes('Je n’ai pas pu vérifier cette demande.') && b.textContent.includes('Je n’ai pas pu vérifier cette demande.') && !/Ça correspond/.test(a.textContent + b.textContent), 'garde des trois phrases : « Je n ai pas pu verifier cette demande. » (illisible), jamais « Ça correspond »');
  }
  // 5) page : tous les identifiants utilises par app.js existent dans index.html
  const html = readFileSync(join(WD, 'index.html'), 'utf8'); const app = readFileSync(join(WD, 'js', 'app.js'), 'utf8');
  const ids = [...app.matchAll(/\$\('#([\w-]+)'\)/g)].map((m) => m[1]); const missingIds = [...new Set(ids)].filter((i) => !new RegExp('id="' + i + '"').test(html) && !new RegExp("id: '" + i + "'").test(app));
  const chk = spawnSync(process.execPath, ['--check', join(WD, 'js', 'app.js')], { encoding: 'utf8' });
  ok(!missingIds.length && chk.status === 0, 'app.js : syntaxe valide, ' + new Set(ids).size + ' identifiants HTML tous presents', missingIds.join(',') + chk.stderr.slice(0, 120));
}

// ------------------------------------------------------------------ J) js/app.js EXECUTE de bout en bout dans le mini DOM : scenario -> Signer -> fenetre -> journal ; colle ; journal
{
  const D = await imp(join(HERE, 'fake_dom.mjs')); const dom = D.installFakeDom();
  const byId = {}; const E = (id) => document.querySelector('#' + id);
  const realQS = document.querySelector;
  document.querySelector = (sel) => { if (sel[0] === '#') { const id = sel.slice(1); if (!byId[id]) { const e = document.createElement('div'); e.setAttribute('id', id); e.value = ''; e.checked = true; byId[id] = e; dom.body.append(e); } return byId[id]; } return realQS(sel); };
  globalThis.location = { hash: '' }; globalThis.addEventListener = () => {};
  const errors = []; const onErr = (e) => errors.push(String(e && e.message || e)); process.on('unhandledRejection', onErr);
  await imp(join(WD, 'js', 'app.js'));
  const btns = () => [...dom.body.querySelectorAll('button')];
  const scen = dom.body.querySelectorAll('.scen');
  ok(scen.length === 13, 'app.js : 13 scenarios affiches');
  ok(dom.body.querySelectorAll('.scen-syn').length === 2 && dom.body.querySelectorAll('.scen-syn').every((e) => e.textContent === 'Scène synthétique, adresses factices'), 'app.js : les 2 scenes du coffre portent l etiquette « Scène synthétique, adresses factices »');
  scen.find((b) => b.getAttribute('data-id') === 'coffre_delegatecall').click();
  ok(E('wallet-req').textContent.includes('Scène synthétique, adresses factices') && E('wallet-req').textContent.includes('Virement') && E('wallet-req').textContent.includes('20 USDC') && E('wallet-req').textContent.includes('execTransaction') && !/null|undefined/.test(E('wallet-req').textContent), 'app.js : la scene du coffre montre l ecran du coffre (virement 20 USDC) et ce que recoit le portefeuille');
  // un scenario piege, de bout en bout
  scen.find((b) => b.getAttribute('data-id') === 'tous_les_nft').click();
  ok(E('wallet-req').textContent.includes('Signer') && E('wallet-req').textContent.includes('mint-gratuit-demo.example') && E('wallet-req').textContent.includes('Rejeter'), 'app.js : le faux portefeuille affiche la requete avec Signer / Rejeter');
  E('wallet-req').querySelector('.btn-wallet-yes').click();
  const isModalApp = () => { const w = dom.body.querySelector('section'); return !!w && w.getAttribute('role') === 'alertdialog'; };
  const find = (txt) => btns().find((b) => b.textContent.includes(txt));
  ok(!!find('Annuler') && isModalApp(), 'app.js : cliquer Signer ouvre la fenetre Hold up avant toute signature');
  find('Vérifier') && document.querySelectorAll('input').find((i) => i.getAttribute('value') === 'receive').click(); find('Vérifier').click();
  ok(dom.body.textContent.includes('Danger'), 'app.js : verdict Danger pour "autorisation de tous les NFT"');
  find('Annuler').click(); await new Promise((r) => setTimeout(r, 5));
  ok(E('wallet-out').textContent.includes('Rien n’a été signé'), 'app.js : annulation => "Rien n a ete signe"');
  // colle
  E('colle-text').value = JSON.stringify({ to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', value: '0x0', data: '0x095ea7b3' + '0'.repeat(24) + 'b2'.repeat(20) + 'f'.repeat(64) });
  E('colle-origin').value = 'https://site.example'; E('colle-intent').value = 'pay';
  E('colle-go').click();
  ok(E('colle-out').textContent.includes('Danger') && E('colle-out').textContent.includes('Tu crois'), 'app.js : mode colle => verdict Danger affiche', E('colle-out').textContent.slice(0, 300));
  E('colle-text').value = 'pas du json'; E('colle-go').click();
  ok(E('colle-out').textContent.includes('pas du JSON valide'), 'app.js : mode colle => erreur claire sur un texte invalide');
  // journal
  const hashChange = null; E('j-verify').click();
  ok(E('journal-status').textContent.includes('Chaîne intacte : 2 ligne(s)'), 'app.js : journal = 2 lignes (1 demo, 1 colle), chaine intacte', E('journal-status').textContent);
  E('j-tamper').click();
  ok(/cass/i.test(E('journal-status').textContent), 'app.js : apres retouche, la page annonce la chaine cassee', E('journal-status').textContent);
  E('j-clear').click();
  ok(E('journal-status').textContent.includes('Journal vide'), 'app.js : effacer vide le journal');
  // ---- Après l'alerte, de bout en bout dans app.js (raccourci de démonstration) : retrait refusé puis signé, fiche, ligne de journal rejouable
  {
    const gid = (id) => btns().find((b) => b.getAttribute('id') === id);
    const txtOf = (id) => E(id).textContent;
    scen.find((b) => b.getAttribute('data-id') === 'echange_droit_illimite').click();
    ok(E('apres').hidden === true && !txtOf('apres-box').includes('Révoquer'), 'apres : masqué tant qu aucun droit n a été accordé');
    scen.find((b) => b.getAttribute('data-id') === 'envoi_simple').click();
    ok(!gid('shortcut-btn'), 'apres : pas de raccourci pour un envoi simple (aucun droit accordé)');
    scen.find((b) => b.getAttribute('data-id') === 'echange_droit_illimite').click();
    ok(!!gid('shortcut-btn'), 'apres : raccourci proposé pour la scène « adresse neuve » (droit illimité)');
    gid('shortcut-btn').click();
    const t0 = txtOf('apres-box');
    ok(E('apres').hidden === false && t0.includes('Tu as continué.') && t0.includes('sans limite') && !!gid('revoke-btn') && gid('revoke-btn').textContent === 'Révoquer ce droit' && t0.includes('Hold up ne signe jamais'), 'apres : le droit existe, bouton « Révoquer ce droit » visible, « Hold up ne signe jamais »', t0.slice(0, 200));
    ok(!gid('revoke-sign'), 'apres : rien n est montré au portefeuille avant le clic');
    gid('revoke-btn').click();
    const w = txtOf('apres-box');
    ok(w.includes('Le faux portefeuille reçoit la demande de retrait') && w.includes('approve') && w.includes('0 : le droit est retiré') && w.includes('0xd4d4d4d4') && w.includes('0x095ea7b3') && w.includes('non signée') && w.includes('aucun signal trouvé') && !!gid('revoke-sign') && !!gid('revoke-reject'), 'apres : le faux portefeuille montre approve(spender, 0), non signée, relue par le moteur : aucun signal', w.slice(0, 260));
    gid('revoke-reject').click();
    ok(txtOf('apres-box').includes('Rien n’a changé : le droit est toujours actif') && !gid('revoke-sign').disabled, 'apres : rejeter laisse le droit actif, et la personne peut encore signer');
    gid('revoke-sign').click();
    const sg = txtOf('apres-box');
    ok(sg.includes('Retrait signé dans le faux portefeuille') && sg.includes('Simulation : aucune transaction n’a été envoyée') && sg.includes('plafond actuel 0 (valeur simulée)') && sg.includes('Ligne de journal n° 3') && gid('revoke-sign').disabled, 'apres : signé dans le faux portefeuille, résultat marqué simulé, ligne de journal n° 3');
    gid('fiche-btn').click();
    const ft = txtOf('apres-box');
    for (const need of ['Fiche d’incident', 'Ce qui s’est passé', 'Ce que tu as fait', 'Ce qui reste à faire', 'Prévenir la plateforme', 'Vérifier les autres droits', 'Quoi', 'Quand', 'Site', 'Droit', 'Adresse qui reçoit le droit', 'Niveau d’alerte', 'Danger', 'echange-rapide-demo.example', 'Ce qui ne peut pas être défait', 'Démonstration : le portefeuille et le réseau sont simulés', 'Ce que cette fiche établit', 'Chaîne du journal : intacte, 3 lignes'])
      ok(ft.includes(need), 'fiche : contient « ' + need + ' »');
    ok(!/\b(OK|bloqu\w*|sûr|protégé|garanti\w*|rembours\w*)\b/.test(ft.replace(/Ce n’est pas une garantie/g, '')) && !/[—–]/.test(ft), 'fiche : aucun mot interdit (OK, bloque, sûr, protégé, garanti, remboursement), aucun tiret long');
    const codes = document.querySelectorAll('code').map((c) => c.textContent).filter((t) => t.startsWith('{"seq":'));
    ok(codes.length === 2, 'fiche : deux lignes de journal citées, telles quelles', String(codes.length));
    const lines = codes.map((t) => JSON.parse(t));
    ok(lines.every((r) => createHash('sha256').update(r.prev + '|' + r.seq + '|' + r.ts + '|' + JSON.stringify(r.entry)).digest('hex') === r.hash), 'fiche : chaque ligne citée se rejoue avec node:crypto (SHA-256 de précédente|numéro|heure|contenu)');
    ok(lines[0].seq === 1 && lines[0].entry.raccourci === true && lines[1].seq === 3, 'fiche : lignes citées = la décision (raccourci, n° 1) et le dernier retrait (n° 3)');
    ok(lines[1].entry.type === 'revocation' && lines[1].entry.wallet === 'signed' && lines[1].entry.simulated === true && !/0x[0-9a-fA-F]{40}/.test(JSON.stringify(lines)), 'journal : la ligne de retrait est marquée simulée et ne contient aucune adresse');
    const replays = btns().filter((b) => b.textContent.startsWith('Rejouer le calcul'));
    replays.forEach((b) => b.click());
    ok(replays.length >= 3 && txtOf('apres-box').includes('l’empreinte est identique'), 'fiche : « Rejouer le calcul » recalcule dans la page et dit « identique »');
    btns().find((b) => b.textContent === 'Rejouer toute la chaîne').click();
    ok(txtOf('apres-box').includes('Elle est intacte.'), 'fiche : « Rejouer toute la chaîne » dit intacte');
    E('j-verify').click();
    ok(E('journal-status').textContent.includes('Chaîne intacte : 3 ligne(s)'), 'journal : 3 lignes (raccourci, retrait rejeté, retrait signé), chaîne intacte', E('journal-status').textContent);
    scen.find((b) => b.getAttribute('data-id') === 'coffre_conforme').click();
    ok(E('apres').hidden === true, 'apres : changer de scène masque la section');
    E('j-clear').click();
  }
  ok(errors.length === 0, 'app.js : aucune erreur non geree', errors.join(' ; '));
}

// ------------------------------------------------------------------ L) Après l'alerte : retrait du droit (revoke.js), fiche d'incident (incident.js adapté d'Adem), journal rejouable
{
  const A = await imp(join(WD, 'js', 'apres.js')); const RV = await imp(join(WD, 'js', 'revoke.js')); const INC = await imp(join(WD, 'js', 'incident.js')); const JJ = await imp(join(WD, 'js', 'journal.js'));
  const { call } = await imp(join(ROOT, 'engine', 'src', 'abi_encode.mjs'));
  ok(readFileSync(join(WD, 'js', 'revoke.js'), 'utf8') === readFileSync(join(ROOT, 'extension', 'revoke.js'), 'utf8'), 'js/revoke.js = extension/revoke.js (copie octet pour octet, faite par build_webdemo.mjs)');
  const byId = Object.fromEntries(S.SCENARIOS.map((s) => [s.id, s]));
  const status = Object.fromEntries(S.SCENARIOS.map((s) => [s.id, A.grantOf(s)]));
  const grantsIds = S.SCENARIOS.filter((s) => A.grants(s)).map((s) => s.id).sort();
  ok(JSON.stringify(grantsIds) === JSON.stringify(['droit_illimite', 'echange_droit_illimite', 'echange_honnete', 'echange_routeur_connu', 'permit_piege', 'tous_les_nft']), '6 scènes sur 13 accordent un droit (le reste : aucun bouton de retrait)', grantsIds.join(','));
  // demande de retrait : octets recalculés avec l'encodeur ABI du moteur, jamais ceux de revoke.js
  const ABI = ['droit_illimite', 'echange_droit_illimite', 'echange_honnete', 'echange_routeur_connu'];
  let allOk = true; const notes = [];
  for (const id of ABI) {
    const r = status[id], g = r.grant; const want = call('approve(address,uint256)', [g.spender, 0n]);
    const p = r.requests[0].params[0];
    if (!(r.status === 'revocable' && r.oneClick && p.data === want && p.to === g.token && p.from === S.USER && p.value === '0x0' && r.signedByHoldUp === false && r.submitTo === 'wallet')) { allOk = false; notes.push(id); }
  }
  ok(allOk, 'retrait des 4 scènes « approve » : approve(spender, 0) sur le même jeton, depuis le compte, valeur 0, soumis au portefeuille', notes.join(','));
  const nft = status.tous_les_nft; ok(nft.requests[0].params[0].data === call('setApprovalForAll(address,bool)', [nft.grant.spender, false]) && nft.oneClick, 'retrait de « tous les NFT » : setApprovalForAll(operator, false)');
  { const pm = status.permit_piege; const text = [pm.says, ...pm.steps, ...pm.limits].join(' ');
    ok(pm.status === 'two_steps' && pm.oneClick === false && RV.buttonLabel(pm) === 'Voir comment annuler ce droit' && text.includes('Un clic ne suffit pas') && text.includes('attendre l’échéance') && text.includes('course') && !/\bRévoquer ce droit\b/.test(text), 'Permit hors chaîne : jamais présenté comme révocable en un clic ; échéance, course et deux étapes dites'); }
  // le moteur de Hold up relit la demande de retrait comme n'importe quelle demande, et la voie de reference dit pareil
  { let same = true; const lv = new Set();
    for (const id of ['droit_illimite', 'echange_droit_illimite', 'echange_honnete', 'echange_routeur_connu', 'tous_les_nft']) { const q = status[id].requests[0]; const body = { origin: 'hold-up', method: q.method, params: q.params, chainId: '0x1', from: q.params[0].from };
      const v = M.check(structuredCloneSafe(body), webLocalOf(byId[id])), r = refVerdict(structuredCloneSafe(body), refLocalOf(byId[id])); lv.add(M.displayLevel(v).key); if (pick(v) !== pick(r)) same = false; }
    ok(same && [...lv].join() === 'info', 'équivalence moteur : la demande de retrait est lue pareil par la page et par server/server.mjs (5 demandes), aucun signal');
    ok(netCalls === 0, 'aucun appel reseau pendant la préparation des retraits'); }
  // journal -> fiche : même formule que l'incident.mjs d'Adem (lecture seule), mêmes blocs
  const IM = await imp(join(ROOT, '..', '..', 'demo_reelle', 'reponse', 'incident.mjs'));
  const st = JJ.memoryStorage(); const sc = byId.echange_droit_illimite, result = status.echange_droit_illimite;
  const d = JJ.append(st, { source: 'demo', scenario: sc.id, intent: 'swap', level: 'danger', niveau: 'critical', fiche: 'F01', decision: 'sign', delay_s: 10, ms: 13400 }, 1_800_000_000_000);
  const rv = JJ.append(st, { source: 'demo', type: 'revocation', scenario: sc.id, kind: result.kind, request_sha256: 'ab'.repeat(32), wallet: 'signed', simulated: true, allowance_after: '0' }, 1_800_000_042_000);
  const rows = JJ.readAll(st);
  ok(rows.every((r) => IM.recordHash(r) === r.hash && INC.recordHash(r) === r.hash && INC.replayRecord(r).ok), 'journal : empreinte identique à recordHash d\'incident.mjs (Adem) et rejouable par incident.js');
  { const f = join(tmpdir(), 'holdup_webdemo_journal.jsonl'); writeFileSync(f, rows.map((r) => JSON.stringify(r)).join('\n') + '\n'); const j = IM.readJournal(f);
    ok(j.chain.ok && j.chain.n === 2 && j.chain.head === rows[1].hash, 'journal de la page relu par readJournal d\'incident.mjs : chaîne intacte, même tête'); }
  const inc = INC.buildFiche(rows, { decisionSeq: d.seq, revocationSeq: rv.seq, scenario: sc, result, generatedAt: 1_800_000_100_000 });
  const inc2 = INC.buildFiche(rows, { decisionSeq: d.seq, revocationSeq: rv.seq, scenario: sc, result, generatedAt: 1_800_000_100_000 });
  ok(JSON.stringify(inc) === JSON.stringify(inc2) && inc.id === createHash('sha256').update(d.hash + '|' + rv.hash).digest('hex').slice(0, 16), 'fiche : déterministe, identifiant = SHA-256(décision|retrait), même formule qu\'incident.mjs');
  ok(inc.schema === 'holdup.incident/1' && inc.demo === true && inc.revocation.simulated === true && inc.revocation.right_removed === true && inc.right.unlimited === true && inc.verdict.fiche.id === 'F01' && inc.verdict.fiche.threat.length > 5 && inc.evidence.chain.ok && inc.evidence.journal_records.length === 2 && inc.does_not_prove.some((x) => x.includes('simulés')), 'fiche : mêmes blocs que le schéma d\'Adem, retrait marqué simulé, « n\'établit pas » dit que rien n\'est réel');
  ok(inc.metrics.time_to_revoke_ms === 42000 && inc.timeline.length === 3 && inc.timeline[0].what === 'alert_shown' && inc.next_steps.some((x) => x.includes('Prévenir la plateforme')) && inc.next_steps.some((x) => x.includes('autres droits')), 'fiche : chronologie (alerte, décision, retrait), délai de retrait, prochaines étapes');
  // retrait non fait / rejeté : la fiche ne dit jamais « retiré »
  { const st2 = JJ.memoryStorage(); const d2 = JJ.append(st2, { source: 'demo', scenario: sc.id, level: 'danger', niveau: 'critical', fiche: 'F01', decision: 'sign', delay_s: 10, ms: 1000 }); const r2 = JJ.append(st2, { source: 'demo', type: 'revocation', wallet: 'rejected', simulated: true, request_sha256: 'cd'.repeat(32) });
    const i2 = INC.buildFiche(JJ.readAll(st2), { decisionSeq: d2.seq, revocationSeq: r2.seq, scenario: sc, result }), i3 = INC.buildFiche(JJ.readAll(st2), { decisionSeq: d2.seq, revocationSeq: null, scenario: sc, result });
    ok(i2.revocation.right_removed === false && i2.revocation.right_after === null && i3.revocation.wallet_answer === null && i3.revocation.right_removed === false && i3.next_steps[0].startsWith('Retirer le droit'), 'fiche : retrait rejeté ou jamais demandé => le droit n\'est jamais dit retiré, la première étape reste « Retirer le droit »');
    const bad = JJ.readAll(st2); bad[0].entry.decision = 'cancel'; const i4 = INC.buildFiche(bad, { decisionSeq: d2.seq, revocationSeq: r2.seq, scenario: sc, result });
    ok(i4.evidence.chain.ok === false && i4.evidence.chain.broken_at === 1, 'fiche : une ligne retouchée => chaîne dite cassée dans la fiche'); }
  ok(!/0x[0-9a-fA-F]{40}/.test(JSON.stringify(rows)), 'journal : aucune adresse écrite');
  // style : encre seule, pas de dégradé, d'ombre, d'emoji ni de vert dans ce qui a été ajouté
  { const css = readFileSync(join(WD, 'css', 'holdup.css'), 'utf8'); const add = css.slice(css.indexOf('Apres l\'alerte'));
    ok(add.length > 500 && !/gradient|box-shadow|text-shadow|var\(--signal\)|green|#[0-9a-f]{3,8}\b/i.test(add), 'css « Après l\'alerte » : ni dégradé, ni ombre, ni signal rouge, ni couleur en dur (jetons seulement)');
    const srcs = ['js/apres.js', 'js/incident.js', 'index.html'].map((f) => readFileSync(join(WD, f), 'utf8')).join('\n');
    ok(!/\p{Extended_Pictographic}/u.test(srcs), 'aucun emoji dans apres.js, incident.js, index.html');
    ok(!/\b(bloqu\w*|rembours\w*|garanti(?!e)\w*)\b/i.test(srcs.replace(/Ce n’est pas une garantie|Il ne garantit rien/g, '')), 'aucun « bloque », « remboursement » ni promesse dans les textes ajoutés'); }
  ok(netCalls === 0, 'aucun appel reseau pendant les retraits, la fiche et le journal');
}

// ------------------------------------------------------------------ K) service reel des fichiers par HTTP (meme processus, 127.0.0.1) : types MIME des modules, tous les fichiers references repondent 200
{
  const http = await import('node:http');
  const { createStaticServer } = await imp(join(WD, 'serve_local.mjs'));
  const srv = createStaticServer(WD); await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const get = (path) => new Promise((res, rej) => http.get({ host: '127.0.0.1', port, path }, (rs) => { const ch = []; rs.on('data', (c) => ch.push(c)); rs.on('end', () => res({ status: rs.statusCode, type: rs.headers['content-type'], body: Buffer.concat(ch) })); }).on('error', rej));
  const mods = ALL.filter((p) => /\.js$/.test(p)).map((p) => '/' + relative(WD, p).split(String.fromCharCode(92)).join('/'));
  let badMime = [], bad = [];
  for (const m of mods) { const r = await get(m); if (r.status !== 200) bad.push(m + ' ' + r.status); else if (!/javascript/.test(r.type)) badMime.push(m); }
  const idx = await get('/index.html'), lim = await get('/limites.html'), css = await get('/css/holdup.css'), nf = await get('/nexiste/pas'), trav = await get('/..%2f..%2fserver%2fserver.mjs');
  srv.close();
  ok(!bad.length && !badMime.length && idx.status === 200 && lim.status === 200 && css.status === 200 && /css/.test(css.type), 'HTTP : ' + mods.length + ' modules JS + index + limites + CSS servis (200, bons types MIME)', bad.concat(badMime).join(','));
  ok(nf.status === 404 && trav.status !== 200, 'HTTP : fichier absent => 404 ; sortie de dossier refusee');
}

// ------------------------------------------------------------------ G) analyse statique
{
  const exts = new Set(['.html', '.js', '.css', '.json', '.mjs']);
  const files = ALL.filter((p) => exts.has(extname(p)) || ['vercel.json'].includes(p));
  const findings = { eval: [], secret: [], net: [], url: [], inline: [], dom: [] };
  const hosts = new Map(); const dataHosts = new Set();
  const SECRET = [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\bsk-[A-Za-z0-9]{20,}/, /\bAKIA[0-9A-Z]{16}\b/, /\bgh[pousr]_[A-Za-z0-9]{30,}/, /\bxox[baprs]-[A-Za-z0-9-]{10,}/, /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\./, /(?:private[_ -]?key|secret|mnemonic|seed[_ -]?phrase|api[_ -]?key|password|passwd)["']?\s*[:=]\s*["']?(?:0x)?[0-9a-fA-F]{32,}/i, /(?:private[_ -]?key|mnemonic|seed[_ -]?phrase)["']?\s*[:=]\s*["'][a-z]+(?: [a-z]+){11,}/i];
  for (const p of files) {
    const rel = relative(WD, p).replace(/\\/g, '/'); const t = readFileSync(p, 'utf8');
    if (/\beval\s*\(/.test(t) || /\bnew\s+Function\s*\(/.test(t) || /\bsetTimeout\s*\(\s*['"`]/.test(t) || /\bsetInterval\s*\(\s*['"`]/.test(t)) findings.eval.push(rel);
    if (/\bimportScripts\s*\(|\bimport\s*\(/.test(t)) findings.eval.push(rel + ' (import dynamique / importScripts)');
    for (const re of SECRET) if (re.test(t)) findings.secret.push(rel + ' ~ ' + re.source.slice(0, 30));
      if (/\bfetch\s*\(|new\s+XMLHttpRequest|new\s+WebSocket|new\s+EventSource|sendBeacon\s*\(/.test(t.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''))) findings.net.push(rel);
    if (rel !== 'serve_local.mjs') /* outil de dev local (127.0.0.1), non charge par la page */ for (const m of t.matchAll(/(?:https?|wss?|ftp):\/\/([A-Za-z0-9][A-Za-z0-9.-]*)/g)) { hosts.set(m[1].toLowerCase(), (hosts.get(m[1].toLowerCase()) || 0) + 1); if (rel === 'js/exemples_public.js') dataHosts.add(m[1].toLowerCase()); }
    if (rel.endsWith('.html')) {
      if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(t)) findings.inline.push(rel + ' (script inline)');
      if (/\sstyle\s*=/i.test(t)) findings.inline.push(rel + ' (style inline)');
      if (/\son[a-z]+\s*=/i.test(t)) findings.inline.push(rel + ' (gestionnaire on*=)');
      if (!/Content-Security-Policy[^>]*connect-src 'none'|Content-Security-Policy[^>]*default-src 'none'/.test(t)) findings.inline.push(rel + ' (CSP absente)');
      for (const m of t.matchAll(/(?:src|href)\s*=\s*"([^"]+)"/g)) if (/^(?:https?:)?\/\//i.test(m[1])) findings.url.push(rel + ' -> ' + m[1]);
    }
    if (rel.endsWith('.css') && (/url\(\s*['"]?(?:https?:)?\/\//i.test(t) || /@import/.test(t))) findings.url.push(rel + ' (CSS externe)');
    if (rel.startsWith('js/') && /\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML|document\.write/.test(t)) findings.dom.push(rel);
  }
  const fictional = (h) => /(^|\.)(example|test|invalid|local|localhost)$/.test(h) || /example/.test(h);
  const external = [...hosts.keys()].filter((h) => !fictional(h) && !dataHosts.has(h));
  ok(!findings.eval.length, `aucun eval / new Function / import dynamique dans ${files.length} fichiers`, findings.eval.join(' ; '));
  ok(!findings.secret.length, `aucun secret (cle privee, jeton, mot de passe, phrase de recuperation) dans ${files.length} fichiers`, findings.secret.join(' ; '));
  ok(!findings.net.length, 'aucun fetch / XMLHttpRequest / WebSocket / sendBeacon dans le code publie', findings.net.join(' ; '));
  ok(!findings.url.length && !external.length, `aucune URL externe : ${hosts.size} noms d hote trouves, fictifs (.example/.test) ou etiquettes de test dans js/exemples_public.js (donnees, jamais chargees) ; aucun src/href/CSS externe (pas de CDN)`, findings.url.concat(external).join(' ; '));
  ok(!findings.inline.length, 'HTML : CSP presente (default-src none, connect-src none), aucun script/style inline ni gestionnaire on*=', findings.inline.join(' ; '));
  ok(!findings.dom.length, 'js/ : aucun innerHTML / document.write (tout passe par textContent)', findings.dom.join(' ; '));
  R.statique = { fichiers_analyses: files.length, hotes_fictifs: [...hosts.keys()].sort() };
  ok(!existsSync(join(WD, '.env')) && !ALL.some((p) => /\.(pem|key|p12|env)$/i.test(p)), 'aucun fichier .env / .pem / .key');
}

// ------------------------------------------------------------------ H) taille
{
  const pub = ALL.filter((p) => !/BUILD_INFO\.json$|build_webdemo\.mjs$|README_WEBDEMO_FR\.md$|serve_local\.mjs$/.test(p));
  const sizes = pub.map((p) => ({ f: relative(WD, p).replace(/\\/g, '/'), b: statSync(p).size })).sort((a, b) => b.b - a.b);
  const total = sizes.reduce((n, x) => n + x.b, 0);
  const gz = pub.filter((p) => /\.(js|html|css)$/.test(p)).reduce((n, p) => n + gzipSync(readFileSync(p)).length, 0);
  R.taille = { fichiers_publies: pub.length, octets_total: total, octets_gzip_estimes: gz, plus_gros: sizes.slice(0, 5) };
  ok(total < 1_000_000, `taille du site : ${pub.length} fichiers, ${(total / 1024).toFixed(0)} Ko (environ ${(gz / 1024).toFixed(0)} Ko compresses)`);
}

function structuredCloneSafe(x) { try { return structuredClone(x); } catch (_) { return x; } }
mkdirSync(join(WD, 'out'), { recursive: true });
R.echecs = failed; R.verifications = R.checks.length;
writeFileSync(join(WD, 'out', 'RESULTATS.json'), JSON.stringify(R, null, 1));
console.log(failed ? `\n${failed} ECHEC(S) sur ${R.checks.length} verifications` : `\nTOUT PASSE : ${R.checks.length} verifications`);
process.exit(failed ? 1 : 0);

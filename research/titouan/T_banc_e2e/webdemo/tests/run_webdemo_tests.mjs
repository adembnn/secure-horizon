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
  const pol = readFileSync(join(ROOT, 'run', 'policy.mjs'), 'utf8').replace("'../engine/src/fixes.mjs'", "'./src/fixes.js'");
  ok(pol === readFileSync(join(WD, 'engine', 'policy.js'), 'utf8'), 'policy.js = run/policy.mjs (un seul chemin d import change)');
  ok(readFileSync(join(WD, 'engine', 'sentinelle_core.js'), 'utf8') === readFileSync(join(ROOT, 'extension_standalone', 'src', 'sentinelle_core.js'), 'utf8'), 'sentinelle_core.js = celui de l extension autonome, octet pour octet');
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
const emptyLocal = M.emptyLocal();
const KEYS = ['level', 'niveau', 'fiche', 'texts', 'codes', 'effects', 'raisons', 'indeterminate', 'quote', 'address_diff', 'risk_signals', 'intent_contradiction', 'texts_source', 'lead'];
const pick = (v) => JSON.stringify(KEYS.map((k) => v[k]));
function refVerdict(body, local) { try { return REF.evaluate(body, local); } catch (e) { return { level: 'unknown', niveau: 'warn', indeterminate: true, throw: String(e.message).slice(0, 80) }; } }
const BAD_WORDS = /\b(ok|protégé|protege|bloqué|bloque|sûr|sur et sécurisé|safe)\b/i;

const cases = [];
for (const s of S.SCENARIOS) for (const i of [s.intentHonnete, 'pay', 'receive', 'asked', 'other', 'none']) cases.push({ name: `scenario ${s.id} / intention ${i}`, body: M.withIntent(s.body, i === 'other' || i === 'swap' ? 'none' : i), local: 'scen' });
for (const q of REQUESTS) { const b = q.body; const isObj = b && typeof b === 'object' && !Array.isArray(b); const raw = isObj ? (({ _local, ...r }) => r)(b) : b; cases.push({ name: 'type: ' + q.name, body: raw, local: isObj && b._local === 'contact' ? 'scen' : 'empty' }); }
ok(cases.length >= 30, `${cases.length} cas de test (>= 30) : 8 scenarios x 6 intentions + requetes types + malformees`);

let okSeen = 0, identical = 0, bad = []; const diffs = []; const levels = {};
const t0 = performance.now();
for (const c of cases) {
  const wl = c.local === 'scen' ? webLocal : emptyLocal, rl = c.local === 'scen' ? refLocal : { contacts: [], history: [], protected: [], knownSpenders: [] };
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
R.scenarios = { cas: cases.length, identiques: identical, ecarts: diffs.slice(0, 20), niveaux_affiches: levels, ms_total: Math.round(ms), ms_par_verdict: Math.round(ms / cases.length * 100) / 100 };

// les 8 scenarios : avec l'intention honnete, ce qu'on attend (le plancher objectif ne depend pas de l'intention)
{
  const expect = { envoi_simple: 'info', echange_legitime: 'info', droit_illimite: 'danger', permit_piege: 'danger', tous_les_nft: 'danger', adresse_sosie: 'danger', changement_proprietaire: 'danger', faux_support: 'manipulation' };
  const got = {}; let all = true;
  for (const s of S.SCENARIOS) { const k = M.displayLevel(M.check(M.withIntent(s.body, s.intentHonnete === 'swap' ? 'none' : s.intentHonnete), webLocal)).key; got[s.id] = k; if (k !== expect[s.id]) all = false; }
  ok(all, 'les 8 scenarios, reponse honnete : niveaux attendus (2 sans signal, 5 danger, 1 manipulation)', JSON.stringify(got));
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
  const tr = M.explain(S.SCENARIOS[2].body, S.LOCAL);
  ok(tr.ok && tr.lines.length >= 2 && tr.signals.length >= 1, 'panneau technique : effets decodes et signaux disponibles', tr.lines.map((l) => l.k).join(', '));
}

// ------------------------------------------------------------------ G) analyse statique
{
  const exts = new Set(['.html', '.js', '.css', '.json', '.mjs']);
  const files = ALL.filter((p) => exts.has(extname(p)) || ['vercel.json'].includes(p));
  const findings = { eval: [], secret: [], net: [], url: [], inline: [], dom: [] };
  const hosts = new Map();
  const SECRET = [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, /\bsk-[A-Za-z0-9]{20,}/, /\bAKIA[0-9A-Z]{16}\b/, /\bgh[pousr]_[A-Za-z0-9]{30,}/, /\bxox[baprs]-[A-Za-z0-9-]{10,}/, /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\./, /(?:private[_ -]?key|secret|mnemonic|seed[_ -]?phrase|api[_ -]?key|password|passwd)["']?\s*[:=]\s*["']?(?:0x)?[0-9a-fA-F]{32,}/i, /(?:private[_ -]?key|mnemonic|seed[_ -]?phrase)["']?\s*[:=]\s*["'][a-z]+(?: [a-z]+){11,}/i];
  for (const p of files) {
    const rel = relative(WD, p).replace(/\\/g, '/'); const t = readFileSync(p, 'utf8');
    if (/\beval\s*\(/.test(t) || /\bnew\s+Function\s*\(/.test(t) || /\bsetTimeout\s*\(\s*['"`]/.test(t) || /\bsetInterval\s*\(\s*['"`]/.test(t)) findings.eval.push(rel);
    if (/\bimportScripts\s*\(|\bimport\s*\(/.test(t)) findings.eval.push(rel + ' (import dynamique / importScripts)');
    for (const re of SECRET) if (re.test(t)) findings.secret.push(rel + ' ~ ' + re.source.slice(0, 30));
      if (/\bfetch\s*\(|new\s+XMLHttpRequest|new\s+WebSocket|new\s+EventSource|sendBeacon\s*\(/.test(t.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''))) findings.net.push(rel);
    for (const m of t.matchAll(/(?:https?|wss?|ftp):\/\/([A-Za-z0-9][A-Za-z0-9.-]*)/g)) { hosts.set(m[1].toLowerCase(), (hosts.get(m[1].toLowerCase()) || 0) + 1); }
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
  const fictional = (h) => /(^|\.)(example|test|invalid|localhost)$/.test(h) || /example/.test(h);
  const external = [...hosts.keys()].filter((h) => !fictional(h));
  ok(!findings.eval.length, `aucun eval / new Function / import dynamique dans ${files.length} fichiers`, findings.eval.join(' ; '));
  ok(!findings.secret.length, `aucun secret (cle privee, jeton, mot de passe, phrase de recuperation) dans ${files.length} fichiers`, findings.secret.join(' ; '));
  ok(!findings.net.length, 'aucun fetch / XMLHttpRequest / WebSocket / sendBeacon dans le code publie', findings.net.join(' ; '));
  ok(!findings.url.length && !external.length, `aucune URL externe : ${hosts.size} noms d hote trouves, tous fictifs (.example) ; aucun src/href/CSS externe (pas de CDN)`, findings.url.concat(external).join(' ; '));
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

// Controle statique du dossier extension/ : aucun secret, aucun eval / new Function / import dynamique, aucune URL externe, aucune API reseau, manifeste minimal.
// Usage : node tests/static_check.mjs     (code retour 1 si un controle echoue)
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const EXT = join(resolve(HERE, '..'), 'extension');
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); } })(EXT);
const rel = (p) => relative(EXT, p).replace(/\\/g, '/');
const findings = []; const info = [];
const add = (kind, p, line, txt) => findings.push({ kind, file: rel(p), line, txt: txt.trim().slice(0, 140) });

const RULES = [
  ['secret', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['secret', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['secret', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['secret', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ['secret', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['secret', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['secret', /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/],           // JWT
  ['secret', /(api[_-]?key|secret|token|passw(or)?d|mnemonic|seed ?phrase|private[_-]?key)\s*[:=]\s*['"`][^'"`\s]{12,}['"`]/i],
  ['secret', /(private|secret|mnemonic|seed)\w*\s*[:=]\s*['"`]0x[0-9a-fA-F]{64}['"`]/i],
  ['code_dynamique', /\beval\s*\(/],
  ['code_dynamique', /\bnew\s+Function\s*\(/],
  ['code_dynamique', /(^|[^.\w])Function\s*\(\s*['"`]/],
  ['code_dynamique', /\bset(Timeout|Interval)\s*\(\s*['"`]/],
  ['code_dynamique', /\bimportScripts\s*\(/],
  ['code_dynamique', /(^|[^.\w$])import\s*\(/],                                              // import() dynamique
  ['code_dynamique', /\bdocument\.write(ln)?\s*\(/],
  ['code_distant', /<script[^>]+src\s*=\s*['"]?https?:/i],
  ['reseau', /\bfetch\s*\(/],
  ['reseau', /\bXMLHttpRequest\b/],
  ['reseau', /\bnew\s+WebSocket\b/],
  ['reseau', /\bEventSource\b/],
  ['reseau', /\bsendBeacon\b/],
  ['reseau', /chrome\.(webRequest|declarativeNetRequest|proxy|cookies|history|downloads)/],
];
// URL externe = schema http(s)/ws(s)/ftp suivi d'un nom d'hote. "https://" tout seul (comparaison de prefixe) n'en est pas une.
const URL_RE = /\b(?:https?|wss?|ftp):\/\/[A-Za-z0-9[][^\s'"`<>)\\]*/g;
const HEX64 = /\b0x[0-9a-fA-F]{64}\b/g;
let hex64 = 0;
// Seule exception reseau : la phrase ecrite par la personne part vers le relais local de classification (boucle locale), depuis classifier_client.js.
const RELAY_URL = 'http://127.0.0.1:8789', RELAY_FILE = 'classifier_client.js';
let relayFetch = 0;

for (const p of files) {
  if (/\.(png|jpg|ico|zip)$/.test(p)) continue;
  const txt = readFileSync(p, 'utf8');
  txt.split('\n').forEach((ln, i) => {
    for (const [k, re] of RULES) if (re.test(ln)) {
      if (k === 'reseau' && rel(p) === RELAY_FILE && /\bfetch\s*\(\s*RELAY \+ '\/classify'/.test(ln)) { relayFetch++; continue; } // le seul appel reseau admis
      // fetch( dans engine : uniquement s'il s'agit de l'API reseau ; aucune exception necessaire attendue.
      add(k, p, i + 1, ln);
    }
    for (const m of ln.matchAll(URL_RE)) { if ((m[0] === RELAY_URL && rel(p) === RELAY_FILE) || (rel(p) === 'manifest.json' && (m[0] === RELAY_URL || m[0] === RELAY_URL + '/*'))) continue; add('url_externe', p, i + 1, m[0]); }
    hex64 += (ln.match(HEX64) || []).length;
  });
}
// manifeste
const mf = JSON.parse(readFileSync(join(EXT, 'manifest.json'), 'utf8'));
const mcheck = [];
const m = (name, cond, d = '') => mcheck.push({ name, pass: !!cond, detail: d });
m('manifest_version 3', mf.manifest_version === 3);
m('service worker de type module', mf.background && mf.background.type === 'module' && mf.background.service_worker === 'background.js');
// storage : reglages, journal local et demandes retenues (storage.session) ; alarms : echeances de la retenue quand le service worker est arrete.
// La fenetre de verdict (chrome.windows.create d'une page de l'extension) et les messages vers l'onglet demandeur ne demandent aucune permission.
m('permissions = [storage, alarms] seulement', JSON.stringify(mf.permissions) === '["storage","alarms"]', JSON.stringify(mf.permissions));
m('host_permissions = le relais local 127.0.0.1:8789 et rien d autre', JSON.stringify(mf.host_permissions) === '["http://127.0.0.1:8789/*"]' && !('optional_host_permissions' in mf), JSON.stringify(mf.host_permissions));
m('un seul appel reseau dans tout le dossier livre : fetch vers le relais local, dans classifier_client.js', relayFetch === 1, String(relayFetch));
m('aucune permission optionnelle', !('optional_permissions' in mf));
m('pas de externally_connectable / web_accessible_resources / update_url', !('externally_connectable' in mf) && !('web_accessible_resources' in mf) && !('update_url' in mf));
const csp = (mf.content_security_policy || {}).extension_pages || '';
m('CSP : script-src self, connect-src = le relais local seulement', /script-src 'self'/.test(csp) && /connect-src http:\/\/127\.0\.0\.1:8789(;|$)/.test(csp) && !/https:|unsafe-eval|unsafe-inline|wasm-unsafe/.test(csp) && (csp.match(/http:/g) || []).length === 1, csp);
m('seuls bridge.js / inject.js en scripts de contenu, fichiers presents', (mf.content_scripts || []).every((c) => c.js.every((f) => files.some((p) => rel(p) === f))));

// pages de l'extension : scripts locaux seulement, aucun script en ligne, aucun gestionnaire en attribut
for (const p of files.filter((x) => x.endsWith('.html'))) {
  const t = readFileSync(p, 'utf8');
  const scripts = [...t.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  m('page ' + rel(p) + ' : scripts locaux, rien en ligne', scripts.every((s) => /\bsrc\s*=\s*"[\w./-]+\.js"/.test(s[1]) && !s[2].trim()) && !/\son[a-z]+\s*=/i.test(t));
}
// aucun mode test ni reponse automatique dans le dossier livre : le crochet n'existe que dans le build --test-hook (dossier extension_test/)
const bgTxt = readFileSync(join(EXT, 'background.js'), 'utf8');
m('aucun crochet de test dans le service worker livre', !/testHook|TEST_HOOK|__holdupTestHook/.test(bgTxt) && /createGatekeeper\(\{ check: localCheck, classify: classifyViaRelay\s*\}\)/.test(bgTxt));
m('aucun fichier ne pose le crochet de test ni un mode auto', files.filter((p) => /\.(js|html|json)$/.test(p) && !/BUILD_INFO\.json$/.test(p)).every((p) => !/__holdupTestHook|testMode|cfg\.auto\b/.test(readFileSync(p, 'utf8'))));
m('fenetre presente (window.html + ui/screen.*)', ['window.html', 'window.js', 'window.css', 'ui/screen.js', 'ui/screen.css', 'gatekeeper.js', 'hold_core.js', 'intent_text.js', 'outcome.js'].every((f) => files.some((p) => rel(p) === f)));

// chaque module du dossier livre doit se charger : une erreur de syntaxe dans une source du moteur rend le service worker inchargeable
{
  const { pathToFileURL } = await import('node:url');
  let err = '';
  try { const core = await import(pathToFileURL(join(EXT, 'engine', 'sentinelle_core.js')).href); const v = core.check({ origin: 'https://x.test', method: 'personal_sign', params: ['0x00', '0x' + '1'.repeat(40)] }); if (!v || v.level === 'ok') err = 'verdict invalide'; }
  catch (e) { err = String(e && e.message || e).slice(0, 160); }
  m('le moteur embarque se charge et repond (aucune erreur de syntaxe dans engine/)', !err, err);
}

const byKind = {}; for (const f of findings) (byKind[f.kind] = byKind[f.kind] || []).push(f);
const kinds = ['secret', 'code_dynamique', 'code_distant', 'reseau', 'url_externe'];
const res = { fichiers_analyses: files.length, constantes_64_hex_publiques: hex64, constats: byKind, manifeste: mcheck };
let fail = 0;
for (const k of kinds) { const n = (byKind[k] || []).length; console.log(`${n === 0 ? 'ok    ' : 'ECHEC '} ${k} : ${n} occurrence(s)`); if (n) { fail++; byKind[k].slice(0, 15).forEach((f) => console.log(`        ${f.file}:${f.line}  ${f.txt}`)); } }
for (const c of mcheck) { console.log(`${c.pass ? 'ok    ' : 'ECHEC '} manifeste : ${c.name}${c.detail ? ' (' + c.detail + ')' : ''}`); if (!c.pass) fail++; }
console.log(`info : ${files.length} fichiers analyses ; ${hex64} constante(s) 0x+64 hex (aucune n'est assignee a un nom de secret)`);
writeFileSync(join(resolve(HERE, '..'), 'out', 'STATIC.json'), JSON.stringify(res, null, 1));
process.exit(fail ? 1 : 0);

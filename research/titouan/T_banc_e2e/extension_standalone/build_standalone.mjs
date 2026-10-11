// build_standalone.mjs - assemble extension_standalone/extension/ de facon reproductible (aucune date, aucun hasard : memes entrees => memes octets).
// Entrees (LECTURE SEULE) : ../extension (bridge.js, inject.js, gatekeeper.js, hold_core.js, intent_text.js, keyword_intent.js, outcome.js, written_check.js, effect_sim.js, classifier_client.js, window.*, options.js, ui/screen.*), ../engine/src/*.mjs, ../engine/vendor/compare.ts, ../run/policy.mjs, ../../U_textes_utilisateur.json
// Entrees propres : src/ (background.js, sentinelle_core.js, manifest.json). La page de reglages n'a qu'UNE source : ../extension/options.html + options.js.
// Sortie : extension/ (le dossier a charger dans chrome://extensions) + extension/BUILD_INFO.json (hachages)
// Usage : node build_standalone.mjs        Node >= 23.2 (module.stripTypeScriptTypes). Aucun paquet, aucun reseau.
//         Build LIVRE PAR DEFAUT : la phrase ecrite part au relais local (classifier_client.js -> http://127.0.0.1:8789, qui detient seul les cles
//         du modele Clef). Manifeste : une seule permission d'hote et connect-src http://127.0.0.1:8789, rien d'autre. Le moteur reste embarque.
//         node build_standalone.mjs --no-network  ecrit extension_sans_reseau/ (repli) : seules differences = le client du relais est un module vide,
//         le manifeste n'a ni permission d'hote ni cle d'identifiant, et connect-src vaut 'none'. La phrase est alors lue par mots-cles.
//         node build_standalone.mjs --test-hook   ecrit extension_test/ (JAMAIS le dossier livre) : le build sans reseau + un crochet de reponse automatique
//         pour le banc de test, lu dans le service worker seulement (globalThis.__holdupTestHook), qu'aucune page ni aucun reglage ne peut poser.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');                 // T_banc_e2e
const TEST_HOOK = process.argv.includes('--test-hook');
const NO_NETWORK = TEST_HOOK || process.argv.includes('--no-network');
const OUT_NAME = TEST_HOOK ? 'extension_test' : NO_NETWORK ? 'extension_sans_reseau' : 'extension';
// --out <dir> : writes there instead of the folder of the tree (a trial build never replaces the shipped one)
const OUT_ARG = process.argv.indexOf('--out');
const OUT = OUT_ARG > 0 && process.argv[OUT_ARG + 1] ? resolve(process.argv[OUT_ARG + 1]) : join(HERE, OUT_NAME);
const sha = (b) => createHash('sha256').update(b).digest('hex');
const rd = (p) => readFileSync(p);
const written = [];
function put(rel, data) {
  const p = join(OUT, rel); mkdirSync(dirname(p), { recursive: true });
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  writeFileSync(p, buf); written.push({ file: rel.replace(/\\/g, '/'), bytes: buf.length, sha256: sha(buf) });
}
const sources = [];
const src = (p) => { const b = rd(p); sources.push({ file: relative(ROOT, p).replace(/\\/g, '/'), sha256: sha(b) }); return b; };

// Reecrit les specificateurs relatifs .mjs / .ts -> .js (Chrome sert les .js sans ambiguite de type MIME).
function rewriteImports(text, extra = []) {
  let s = text;
  for (const [from, to] of extra) { if (!s.includes(from)) throw new Error('motif attendu introuvable : ' + from); s = s.split(from).join(to); }
  return s.replace(/((?:from|import)\s*\(?\s*)(['"])(\.{1,2}\/[^'"]+?)\.(?:mjs|ts)\2/g, '$1$2$3.js$2');
}

// Le dossier est vide avant d'ecrire. Sous Windows, un dossier ouvert ailleurs (navigateur qui a charge l'extension, explorateur) ne se
// supprime pas : on vide alors son contenu, ce qui revient au meme pour le build.
try { rmSync(OUT, { recursive: true, force: true }); } catch (_) { for (const f of readdirSync(OUT)) rmSync(join(OUT, f), { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); }
mkdirSync(OUT, { recursive: true });

// 1) fichiers de l'extension d'origine, copies tels quels (jamais modifies)
for (const f of ['bridge.js', 'inject.js', 'gatekeeper.js', 'hold_core.js', 'intent_text.js', 'keyword_intent.js', 'outcome.js', 'written_check.js', 'effect_sim.js', 'chain_facts.js', 'journal_chain.js', 'revoke.js', 'window.html', 'window.css', 'window.js', 'options.html', 'options.js', 'popup.html', 'popup.js', 'welcome.html', 'welcome.js']) put(f, src(join(ROOT, 'extension', f)));
// Default build : the relay client is shipped as is (its only call : the written sentence, to the loopback relay).
// --no-network : it is replaced by a stub that never calls anything (the keyword parser answers), and the manifest grants no host
// and sets connect-src 'none'. The source file ../extension/classifier_client.js is then hashed but not shipped.
const client = src(join(ROOT, 'extension', 'classifier_client.js'));
if (!NO_NETWORK) put('classifier_client.js', client);
else put('classifier_client.js', ['/* Hold up (standalone) - no network. The written intent is classified by the embedded keyword parser. */', 'export const RELAY = null;', 'export const RELAY_TIMEOUT_MS = 0;', 'export async function classifyViaRelay() { return null; }', ''].join(String.fromCharCode(10)));
// 1 bis) surface de la fenetre (extension/ui) : la question ecrite puis la reponse. Systeme : docs/design/v5/DESIGN.md
for (const f of ['tokens.css', 'components.css', 'motion.css', 'screen.js', 'fields.js', 'sidepanel.html', 'sidepanel.js']) put('ui/' + f, src(join(ROOT, 'extension', 'ui', f)));
for (const f of ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png']) put('icons/' + f, src(join(ROOT, 'extension', 'icons', f)));
// 2) fichiers propres a la version autonome
let extensionId = null;
{
  // src/manifest.json est le manifeste du build par defaut. --no-network en retire exactement trois choses (chaque motif doit exister une fois).
  let mf = src(join(HERE, 'src', 'manifest.json')).toString('utf8');
  const RELAY = 'http://127.0.0.1:8789';
  // chain_facts.js : the service worker reads Avalanche C-Chain and Fuji directly, on their public RPC (read-only calls).
  const CHAIN_ORIGINS = ['https://api.avax.network', 'https://api.avax-test.network'];
  const HOSTS = [RELAY + '/*', ...CHAIN_ORIGINS.map((o) => o + '/ext/bc/C/rpc')];
  const CONNECT = [RELAY, ...CHAIN_ORIGINS].join(' ');
  if (NO_NETWORK) {
    const NL = mf.includes(String.fromCharCode(13, 10)) ? String.fromCharCode(13, 10) : String.fromCharCode(10);
    const cut = (from, to) => { if (mf.split(from).length !== 2) throw new Error('manifeste : motif attendu une seule fois : ' + from); mf = mf.split(from).join(to); };
    cut(NL + '  "key": "' + JSON.parse(mf).key + '",', '');
    cut(NL + '  "host_permissions": [' + NL + HOSTS.map((h) => '    "' + h + '"').join(',' + NL) + NL + '  ],', '');
    cut('connect-src ' + CONNECT + '"', 'connect-src ' + "'none'" + '"');
    // le nom et la description sont les memes dans les deux variantes : « Hold up »
  }
  const j = JSON.parse(mf);
  const csp = j.content_security_policy.extension_pages;
  if (NO_NETWORK ? (mf.includes('http') || 'host_permissions' in j || 'key' in j || !/connect-src 'none'$/.test(csp))
    : (JSON.stringify(j.host_permissions) !== JSON.stringify(HOSTS) || !csp.endsWith('; connect-src ' + CONNECT) || (csp.match(/https?:/g) || []).length !== 1 + CHAIN_ORIGINS.length)) throw new Error('manifeste inattendu pour ce build');
  // Identifiant de l'extension : derive de la cle PUBLIQUE du manifeste (32 premiers demi-octets du SHA-256, ecrits de a a p). Aucune cle privee
  // n'existe dans le depot : elle n'a servi qu'a tirer cette cle publique et n'a jamais ete ecrite. Le relais peut epingler cet identifiant.
  if (j.key) extensionId = [...createHash('sha256').update(Buffer.from(j.key, 'base64')).digest('hex').slice(0, 32)].map((h) => String.fromCharCode(97 + parseInt(h, 16))).join('');
  put('manifest.json', mf);
}
{
  // Le crochet de test n'existe que dans le build --test-hook. Dans le build livre le marqueur est retire : createGatekeeper ne recoit que le moteur.
  const MARK = '/*@TEST_HOOK@*/';
  const bg = src(join(HERE, 'src', 'background.js')).toString('utf8');
  if (bg.split(MARK).length !== 2) throw new Error('marqueur de crochet de test attendu une seule fois dans src/background.js');
  // Lecture directe de la chaine (chain_facts.js) : presente dans le build livre seulement. Dans le build sans reseau la ligne marquee devient
  // « const readChain = null; » : aucun fetch dans le dossier, et le garde-barriere ne dit alors rien de la chaine.
  const CHAIN = /^\/\*@CHAIN_READ@\*\/ (const readChain = .*)$/m;
  if (!CHAIN.test(bg)) throw new Error('ligne marquee @CHAIN_READ@ attendue dans src/background.js');
  const bg2 = bg.replace(CHAIN, NO_NETWORK ? 'const readChain = null;' : '$1');
  put('background.js', bg2.replace(MARK, TEST_HOOK ? ', testHook: (h) => { if (typeof globalThis.__holdupTestHook === "function") globalThis.__holdupTestHook(h); }' : ''));
}
put('engine/sentinelle_core.js', src(join(HERE, 'src', 'sentinelle_core.js')));

// 3) moteur d'effets (JavaScript pur). rpc.mjs (reseau) et audit_selectors.mjs (outil Node) sont EXCLUS.
const SKIP = new Set(['rpc.mjs', 'audit_selectors.mjs']);
for (const f of readdirSync(join(ROOT, 'engine', 'src')).filter((x) => x.endsWith('.mjs') && !SKIP.has(x)).sort()) {
  let t = src(join(ROOT, 'engine', 'src', f)).toString('utf8');
  const extra = [];
  // Seule adaptation de code : Buffer (Node) n'existe pas dans un service worker ; TextEncoder donne le meme nombre d'octets UTF-8.
  if (f === 'typed.mjs') extra.push(['Buffer.byteLength(text)', 'new TextEncoder().encode(text).length']);
  put('engine/src/' + f.replace(/\.mjs$/, '.js'), rewriteImports(t, extra));
}
// 4) comparateur d'Adem : TypeScript -> JavaScript (types effaces, logique identique, numeros de ligne conserves)
{
  const ts = src(join(ROOT, 'engine', 'vendor', 'compare.ts')).toString('utf8');
  const js = stripTypeScriptTypes(ts, { mode: 'strip' });
  put('engine/vendor/compare.js', rewriteImports(js));
  src(join(ROOT, 'engine', 'vendor', 'types.ts')); // type seul, efface a la conversion (hache pour la trace)
}
// 5) politique
put('engine/policy.js', rewriteImports(src(join(ROOT, 'run', 'policy.mjs')).toString('utf8'), [["'../engine/src/fixes.mjs'", "'./src/fixes.mjs'"]]));
// 6) textes clairs : JSON d'origine + module equivalent (import JSON dans un service worker exige Chrome >= 123 ; le module marche partout)
{
  const raw = src(join(ROOT, '..', 'U_textes_utilisateur.json'));
  const j = JSON.parse(raw.toString('utf8'));
  put('engine/textes.json', JSON.stringify(j));
  put('engine/textes.js', '// Genere par build_standalone.mjs depuis U_textes_utilisateur.json (memes donnees).\nexport default ' + JSON.stringify(j) + ';\n');
}

// 7) trace du build (sans date : reproductible)
written.sort((a, b) => a.file.localeCompare(b.file));
const total = written.reduce((n, f) => n + f.bytes, 0);
const info = { build: TEST_HOOK ? 'holdup-standalone-TEST-HOOK (ne pas livrer)' : NO_NETWORK ? 'holdup-sans-reseau' : 'holdup-standalone', network: NO_NETWORK ? 'none' : 'relais local 127.0.0.1:8789 (phrase ecrite seulement) ; lecture seule du RPC public Avalanche et Fuji (api.avax.network, api.avax-test.network : la demande du site)', extension_id: extensionId, sources: sources.sort((a, b) => a.file.localeCompare(b.file)), outputs: written, total_bytes: total, tree_sha256: sha(written.map((f) => f.file + ':' + f.sha256).join('\n')) };
writeFileSync(join(OUT, 'BUILD_INFO.json'), JSON.stringify(info, null, 1));
console.log(`extension_standalone/${OUT_NAME} : ${written.length} fichiers, ${total} octets, arbre ${info.tree_sha256.slice(0, 16)}${extensionId ? ', identifiant ' + extensionId : ''}`);

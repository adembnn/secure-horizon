// build_standalone.mjs - assemble extension_standalone/extension/ de facon reproductible (aucune date, aucun hasard : memes entrees => memes octets).
// Entrees (LECTURE SEULE) : ../extension (bridge.js, inject.js), ../engine/src/*.mjs, ../engine/vendor/compare.ts, ../run/policy.mjs, ../../U_textes_utilisateur.json
// Entrees propres : src/ (background.js, sentinelle_core.js, manifest.json, options.*)
// Sortie : extension/ (le dossier a charger dans chrome://extensions) + extension/BUILD_INFO.json (hachages)
// Usage : node build_standalone.mjs        Node >= 23.2 (module.stripTypeScriptTypes). Aucun paquet, aucun reseau.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');                 // T_banc_e2e
const OUT = join(HERE, 'extension');
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

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 1) fichiers de l'extension d'origine, copies tels quels (jamais modifies)
for (const f of ['bridge.js', 'inject.js']) put(f, src(join(ROOT, 'extension', f)));
// 2) fichiers propres a la version autonome
put('manifest.json', src(join(HERE, 'src', 'manifest.json')));
put('background.js', src(join(HERE, 'src', 'background.js')));
put('options.html', src(join(HERE, 'src', 'options.html')));
put('options.js', src(join(HERE, 'src', 'options.js')));
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
const info = { build: 'sentinelle-standalone', sources: sources.sort((a, b) => a.file.localeCompare(b.file)), outputs: written, total_bytes: total, tree_sha256: sha(written.map((f) => f.file + ':' + f.sha256).join('\n')) };
writeFileSync(join(OUT, 'BUILD_INFO.json'), JSON.stringify(info, null, 1));
console.log(`extension_standalone/extension : ${written.length} fichiers, ${total} octets, arbre ${info.tree_sha256.slice(0, 16)}`);

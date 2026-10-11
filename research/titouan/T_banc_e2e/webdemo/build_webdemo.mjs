// build_webdemo.mjs - assemble webdemo/engine/ de facon reproductible (aucune date, aucun hasard : memes entrees => memes octets).
// Methode identique a extension_standalone/build_standalone.mjs : moteur d'effets copie tel quel (seuls les suffixes d'import changent),
// comparateur d'Adem TypeScript -> JavaScript par module.stripTypeScriptTypes, politique et textes clairs copies.
// Entrees (LECTURE SEULE) : ../engine/src/*.mjs, ../engine/vendor/compare.ts, ../run/policy.mjs, ../../U_textes_utilisateur.json,
//                           ../server/server.mjs (colle moteur->verdict a jour : on en extrait la partie sans reseau ni fichier), ../extension_standalone/src/sentinelle_core.js (seulement le decodeur punycode), ../attacks_public/PUBLIC.jsonl (exemples)
// Sortie : engine/ + js/exemples_public.js + BUILD_INFO.json (hachages).      Usage : node build_webdemo.mjs      Node >= 23.2. Aucun paquet, aucun reseau.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');                 // T_banc_e2e
const OUT = join(HERE, 'engine');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const written = [];
function put(rel, data) {
  const p = join(HERE, rel); mkdirSync(dirname(p), { recursive: true });
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  writeFileSync(p, buf); written.push({ file: rel.replace(/\\/g, '/'), bytes: buf.length, sha256: sha(buf) });
}
const sources = []; const R_PATCHES = [];
const src = (p) => { const b = readFileSync(p); sources.push({ file: relative(ROOT, p).replace(/\\/g, '/'), sha256: sha(b) }); return b; };

// Reecrit les specificateurs relatifs .mjs / .ts -> .js.
function rewriteImports(text, extra = []) {
  let s = text;
  for (const [from, to] of extra) { if (!s.includes(from)) throw new Error('motif attendu introuvable : ' + from); s = s.split(from).join(to); }
  return s.replace(/((?:from|import)\s*\(?\s*)(['"])(\.{1,2}\/[^'"]+?)\.(?:mjs|ts)\2/g, '$1$2$3.js$2');
}

rmSync(OUT, { recursive: true, force: true });

// 1) moteur d'effets (JavaScript pur). rpc.mjs (reseau) et audit_selectors.mjs (outil Node) sont EXCLUS.
const SKIP = new Set(['rpc.mjs', 'audit_selectors.mjs']);
for (const f of readdirSync(join(ROOT, 'engine', 'src')).filter((x) => x.endsWith('.mjs') && !SKIP.has(x)).sort()) {
  const t = src(join(ROOT, 'engine', 'src', f)).toString('utf8');
  const extra = [];
  // Seule adaptation de code : Buffer (Node) n'existe pas dans un navigateur ; TextEncoder donne le meme nombre d'octets UTF-8.
  if (f === 'typed.mjs') extra.push(['Buffer.byteLength(text)', 'new TextEncoder().encode(text).length']);
  put('engine/src/' + f.replace(/\.mjs$/, '.js'), rewriteImports(t, extra));
}
// 2) comparateur d'Adem : TypeScript -> JavaScript (types effaces, logique identique)
{
  const ts = src(join(ROOT, 'engine', 'vendor', 'compare.ts')).toString('utf8');
  put('engine/vendor/compare.js', rewriteImports(stripTypeScriptTypes(ts, { mode: 'strip' })));
  src(join(ROOT, 'engine', 'vendor', 'types.ts')); // type seul, efface a la conversion (hache pour la trace)
}
// 3) politique
put('engine/policy.js', rewriteImports(src(join(ROOT, 'run', 'policy.mjs')).toString('utf8'), [["'../engine/src/fixes.mjs'", "'./src/fixes.js'"]]));
// 4) textes clairs
{
  const j = JSON.parse(src(join(ROOT, '..', 'U_textes_utilisateur.json')).toString('utf8'));
  put('engine/textes.js', '// Genere par build_webdemo.mjs depuis U_textes_utilisateur.json (memes donnees).\nexport default ' + JSON.stringify(j) + ';\n');
}
// 5) colle moteur -> verdict. Source = server/server.mjs (la version la plus a jour de la chaine moteur -> comparateur -> politique -> textes).
//    On en extrait la partie "contexte hors ligne ... evaluate" par marqueurs, SANS la lecture de fichier ni le serveur HTTP, avec des remplacements textuels exacts et listes (patches[]).
{
  const srv = src(join(ROOT, 'server', 'server.mjs')).toString('utf8').replace(/\r\n/g, '\n');
  const i0 = srv.indexOf('const lc = (a) =>'), i1 = srv.indexOf('// ------------------------------------------------------------------ journal chaine par hachage');
  if (i0 < 0 || i1 < i0) throw new Error('marqueurs de server.mjs introuvables');
  let body = srv.slice(i0, i1);
  const patches = [];
  // a) loadLocalContext lit un fichier (Node) : retiree ; evaluate() prend un contexte vide par defaut
  const L0 = body.indexOf('// Contexte local OPTIONNEL'), L1 = body.indexOf('function parseChain');
  if (L0 < 0 || L1 < L0) throw new Error('loadLocalContext introuvable');
  body = body.slice(0, L0) + body.slice(L1); patches.push('loadLocalContext (lecture de fichier Node) retiree');
  if (!body.includes('local = loadLocalContext()')) throw new Error('motif evaluate() introuvable');
  body = body.replace('local = loadLocalContext()', 'local = emptyLocal()'); patches.push('evaluate(): contexte local vide par defaut');
  // b) url.domainToUnicode (Node) -> decodeur punycode du navigateur, copie de extension_standalone/src/sentinelle_core.js
  const core = src(join(ROOT, 'extension_standalone', 'src', 'sentinelle_core.js')).toString('utf8').replace(/\r\n/g, '\n');
  const P0 = core.indexOf('function punyDecode'), P1 = core.indexOf('function hostOf');
  if (P0 < 0 || P1 < P0) throw new Error('punycode introuvable');
  const puny = core.slice(P0, P1); patches.push('domainToUnicode: decodeur punycode JS pur (Node n\'est pas disponible dans une page)');
  // c) echeance "infinie" (uint max) : le serveur ecrivait "1.3e+72 jours"; la version autonome l'a corrige, on garde la correction (patch optionnel)
  const OLD = "if (ap && ap.expiry) v.jours = String(Math.max(1, Math.round((ap.expiry - Math.floor(Date.now() / 1000)) / 86400)));";
  if (body.includes(OLD)) {
    body = body.replace(OLD, "if (ap && ap.expiry) { const days = Math.round((Number(ap.expiry) - Math.floor(Date.now() / 1000)) / 86400); v.jours = Number.isFinite(days) && days <= 3650 ? String(Math.max(1, days)) : 'un nombre illimité de'; }");
    patches.push('texte "jours": echeance illimitee => "un nombre illimité de jours" au lieu de "1.3e+72 jours"');
  }
  const header = [
    '// GENERE par build_webdemo.mjs a partir de server/server.mjs (partie sans reseau ni fichier). Ne pas editer a la main.',
    '// Patches appliques : ' + patches.join(' ; ') + '.',
    "import * as E from './src/engine.js';",
    "import { compare } from './vendor/compare.js';",
    "import { applyExtraRules, analyzeChainRequest } from './src/rules_extra.js';",
    "import { applyPolicy } from './policy.js';",
    "import TEXTS from './textes.js';",
    'export const MAX_BODY = 256 * 1024;',
    'export const FICHES = Object.fromEntries(TEXTS.fiches.map((f) => [f.id, f]));',
    '',
  ].join('\n');
  const footer = '\nexport const emptyLocal = () => ({ contacts: [], history: [], protected: [], knownSpenders: [] });\nexport { buildCtx, decode, Unverifiable, applyExtraRules, fill, parseChain };\n';
  put('engine/sentinelle_core.js', header + puny + body + footer);
  R_PATCHES.push(...patches);
}

// 6) exemples du jeu PUBLIC (synthetiques) pour le mode "colle une transaction" : le premier cas de chaque famille (max 16). Jamais TEST.
{
  const rows = src(join(ROOT, 'attacks_public', 'PUBLIC.jsonl')).toString('utf8').trim().split('\n').map((l) => JSON.parse(l));
  const seen = new Set(); const ex = [];
  for (const c of rows) {
    if (seen.has(c.family)) continue; seen.add(c.family);
    const m = c.request && c.request.method;
    if (!['eth_sendTransaction', 'eth_signTypedData_v4', 'personal_sign'].includes(m)) continue;
    ex.push({ id: c.id, family: c.family, origin: 'https://' + String(c.context.origin || 'site.example'), request: c.request });
    if (ex.length >= 16) break;
  }
  put('js/exemples_public.js', '// Genere par build_webdemo.mjs depuis attacks_public/PUBLIC.jsonl (cas SYNTHETIQUES de regression publique, aucune donnee reelle).\nexport default ' + JSON.stringify(ex, null, 1) + ';\n');
}

// 7) trace du build (sans date : reproductible)
written.sort((a, b) => a.file.localeCompare(b.file));
const total = written.reduce((n, f) => n + f.bytes, 0);
const info = { build: 'holdup-webdemo', patches_sentinelle_core: R_PATCHES, sources: sources.sort((a, b) => a.file.localeCompare(b.file)), outputs: written, total_bytes: total, tree_sha256: sha(written.map((f) => f.file + ':' + f.sha256).join('\n')) };
writeFileSync(join(HERE, 'BUILD_INFO.json'), JSON.stringify(info, null, 1));
console.log(`webdemo : ${written.length} fichiers generes, ${total} octets, arbre ${info.tree_sha256.slice(0, 16)}`);

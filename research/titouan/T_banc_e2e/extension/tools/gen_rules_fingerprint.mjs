// Empreinte courte des règles embarquées, écrite dans le journal chaîné (champ `rules` = version du build + '+' + 12 hex).
// À lancer AVANT chaque build final : node extension/tools/gen_rules_fingerprint.mjs
// Réécrit la ligne marquée @RULES_FINGERPRINT@ de extension/journal_chain.js (constante statique : aucun fetch, la CSP du build
// autonome peut rester connect-src 'none' ; journal_chain.js est déjà copié par les builds).
// journal_chain.js n'est PAS dans la liste des règles : réécrire sa ligne ne change donc pas l'empreinte (point fixe).
// Empreinte = SHA-256 de la liste triée « chemin:sha256 » des fichiers de règles qui entrent dans le build autonome
// (même liste que extension_standalone/build_standalone.mjs : moteur, comparateur, politique, cœur autonome, modules d'évaluation de l'extension).
// Fins de ligne ramenées à LF avant hachage : même empreinte sous Windows et sous Linux.
// Option : --root <dossier> (une copie de T_banc_e2e, pour les tests). Aucun réseau, aucun paquet.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const sha = (b) => createHash('sha256').update(b).digest('hex');
const ENGINE_SKIP = new Set(['rpc.mjs', 'audit_selectors.mjs']); // exclus du build (réseau, outil Node)
const EXTENSION_RULES = ['written_check.js', 'intent_text.js', 'keyword_intent.js', 'outcome.js', 'effect_sim.js', 'hold_core.js', 'revoke.js'];

export function rulesFiles(root) {
  const list = [];
  const engine = join(root, 'engine', 'src');
  if (existsSync(engine)) for (const f of readdirSync(engine).filter((x) => x.endsWith('.mjs') && !ENGINE_SKIP.has(x))) list.push('engine/src/' + f);
  for (const f of ['engine/vendor/compare.ts', 'run/policy.mjs', 'extension_standalone/src/sentinelle_core.js']) list.push(f);
  for (const f of EXTENSION_RULES) list.push('extension/' + f);
  return list.filter((f) => existsSync(join(root, f))).sort();
}
export function computeFingerprint(root) {
  const files = rulesFiles(root);
  const lines = files.map((f) => f + ':' + sha(readFileSync(join(root, f), 'utf8').replace(/\r\n/g, '\n')));
  return { fingerprint: sha(lines.join('\n')).slice(0, 12), files: files.length };
}
// Rewrites the one marked line of extension/journal_chain.js (that file is already copied by both builds : no build change needed).
const MARK = /^export const RULES_FINGERPRINT = '[0-9a-f]{12}'; export const RULES_FILES = \d+; \/\/ @RULES_FINGERPRINT@$/m;
export function writeFingerprint(root) {
  const r = computeFingerprint(root);
  const file = join(root, 'extension', 'journal_chain.js');
  const text = readFileSync(file, 'utf8');
  if ((text.match(new RegExp(MARK.source, 'gm')) || []).length !== 1) throw new Error('ligne marquée @RULES_FINGERPRINT@ attendue une seule fois dans extension/journal_chain.js');
  const next = text.replace(MARK, "export const RULES_FINGERPRINT = '" + r.fingerprint + "'; export const RULES_FILES = " + r.files + '; // @RULES_FINGERPRINT@');
  if (next !== text) writeFileSync(file, next);
  return r;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--root');
  const root = i > 0 && process.argv[i + 1] ? resolve(process.argv[i + 1]) : resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const r = writeFingerprint(root);
  console.log('RULES_FINGERPRINT (extension/journal_chain.js) : ' + r.fingerprint + ' (' + r.files + ' fichiers de règles)');
}

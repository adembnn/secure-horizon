// boucle/rebase_diff.mjs : rejoue les propositions ACCEPTÉES sur l'état ACTUEL du dépôt (copie temporaire, rien n'est écrit dans le dépôt) et écrit un diff unifié.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const H = dirname(fileURLToPath(import.meta.url)), R = join(H, '..'), T = join(H, 'out', 'rebase');
const ids = JSON.parse(readFileSync(join(H, 'out', 'etat.json'), 'utf8')).accepte;
const files = {}; const rapport = [];
for (const id of ids) {
  const p = (await import(pathToFileURL(join(H, 'propositions', id + '.mjs')).href)).default; let ok = true; const touched = new Set();
  for (const e of p.edits) {
    const cur = files[e.file] ?? readFileSync(join(R, e.file), 'utf8'); const crlf = cur.includes('\r\n');
    let e2 = e;
    if (e.file === 'engine/src/fixes.mjs' && cur.includes("'F33', 'F34']")) { e2 = { ...e, find: "'F33', 'F34']", replace: "'F33', 'F34', 'F41']" }; rapport.push(id + ' : F34 déjà pris dans le dépôt : la règle est renommée F41'); }
    if (e.file === 'run/policy.mjs' && /F34/.test(e.replace) && readFileSync(join(R, 'engine/src/fixes.mjs'), 'utf8').includes("'F34']")) e2 = { ...e, replace: e.replace.replace(/F34/g, 'F41') };
    const n = cur.split(e2.find).length - 1;
    if (n !== 1) { ok = false; rapport.push(`${id} ${e.file} : motif trouvé ${n}x sur l'état actuel`); continue; }
    files[e.file] = cur.split(e2.find).join(crlf ? e2.replace.replace(/\r?\n/g, '\r\n') : e2.replace); touched.add(e.file);
  }
  rapport.push(`${id} : ${ok ? 'applicable' : 'CONFLIT'} (${[...touched].join(', ')})`);
}
let diff = '';
for (const [f, t] of Object.entries(files)) {
  const a = join(T, 'a', f), b = join(T, 'b', f); mkdirSync(dirname(a), { recursive: true }); mkdirSync(dirname(b), { recursive: true });
  writeFileSync(a, readFileSync(join(R, f))); writeFileSync(b, t);
  diff += spawnSync('git', ['diff', '--no-index', '--no-color', `--src-prefix=a/`, `--dst-prefix=b/`, `a/${f}`, `b/${f}`], { cwd: T, encoding: 'utf8' }).stdout.replace(/\ba\/a\//g, 'a/').replace(/\bb\/b\//g, 'b/');
}
writeFileSync(join(H, 'PATCHES_FINAUX.diff'), diff);
console.log(rapport.join('\n'));

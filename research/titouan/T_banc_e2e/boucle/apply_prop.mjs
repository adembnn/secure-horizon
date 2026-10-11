// boucle/apply_prop.mjs <id> [--revert] : applique (ou annule) une proposition dans work/ pour l'essayer à la main
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const H = dirname(fileURLToPath(import.meta.url)), W = join(H, 'work');
const id = process.argv[2], bk = join(H, 'out', `backup_${id}.json`);
if (process.argv.includes('--revert')) { const s = JSON.parse(readFileSync(bk, 'utf8')); for (const [f, t] of Object.entries(s)) writeFileSync(join(W, f), t); console.log('annulé', id); process.exit(0); }
const p = (await import(pathToFileURL(join(H, 'propositions', id + '.mjs')).href)).default; const s = {};
for (const e of p.edits) { const fp = join(W, e.file); if (!(e.file in s)) s[e.file] = readFileSync(fp, 'utf8'); let t = readFileSync(fp, 'utf8'); const n = t.split(e.find).length - 1; if (n !== (e.count ?? 1)) throw new Error(`${e.file} motif ${n}x`); writeFileSync(fp, t.split(e.find).join(e.replace)); }
writeFileSync(bk, JSON.stringify(s)); console.log('appliqué', id);

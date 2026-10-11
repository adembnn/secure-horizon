// Verrou de la mesure UNIQUE du jeu de contrôle. Vérifie l'empreinte publiée, pose le verrou, puis les deux mesures se suivent (un processus node à la fois) :
//   node attacks_familles/controle_une_fois.mjs &&
//   node attacks_familles/mesure_familles.mjs --file=attacks_familles/CONTROLE.jsonl --root=<74203da> --json=attacks_familles/controle_avant.json --md=attacks_familles/controle_avant.md &&
//   node attacks_familles/mesure_familles.mjs --file=attacks_familles/CONTROLE.jsonl --json=attacks_familles/controle_apres.json --md=attacks_familles/controle_apres.md
// Refuse si l'empreinte du contrôle ne correspond pas à celle publiée dans CONTROLE.sha256, ou si le verrou CONTROLE.lock existe (déjà mesuré).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const HERE = dirname(fileURLToPath(import.meta.url));
const LOCK = join(HERE, 'CONTROLE.lock'), FILE = join(HERE, 'CONTROLE.jsonl');
if (existsSync(LOCK)) { console.error('déjà mesuré : ' + readFileSync(LOCK, 'utf8')); process.exit(2); }
const sha = createHash('sha256').update(readFileSync(FILE)).digest('hex');
const published = readFileSync(join(HERE, 'CONTROLE.sha256'), 'utf8').split('\n').find((l) => l.includes('CONTROLE.jsonl')).split(/\s+/)[0];
if (sha !== published) { console.error(`empreinte ${sha} différente de celle publiée ${published}`); process.exit(3); }
writeFileSync(LOCK, `mesuré une fois le ${new Date().toISOString()} ; sha256 ${sha}\n`);
console.log('verrou posé : contrôle autorisé une seule fois ; sha256', sha);

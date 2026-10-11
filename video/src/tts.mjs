// tts.mjs : voix de travail (Kokoro ff_siwis, locale) pour l'essai d'ouverture.
// node video/src/tts.mjs   -> video/essai/voix/vNN.wav (saute les fichiers deja faits)
// Se sert de la chaine du fondateur en lecture seule (hyperframes + venv Python) ; rien n'y est ecrit.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ATELIER = process.env.ATELIER || 'C:/Users/Adem/Video AI/atelier';
const OUT = resolve(HERE, '../essai/voix'); mkdirSync(OUT, { recursive: true });
process.env.HYPERFRAMES_PYTHON ??= resolve(ATELIER, '.venv/Scripts/python.exe');
process.env.DO_NOT_TRACK = '1';
const LINES = JSON.parse(readFileSync(resolve(HERE, 'voix_ouverture.json'), 'utf8')).lignes;
for (const l of LINES) {
  const f = `${OUT}/${l.id}.wav`;
  if (existsSync(f)) { console.log(l.id, 'deja fait'); continue; }
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [resolve(ATELIER, 'node_modules/hyperframes/bin/hyperframes.mjs'), 'tts', l.voix, '-v', 'ff_siwis', '-s', String(l.vitesse ?? 1.05), '-o', f], { encoding: 'utf8' });
  console.log(l.id, r.status === 0 && existsSync(f) ? 'ok' : 'ECHEC ' + (r.stderr || r.stdout || '').slice(-400), `${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

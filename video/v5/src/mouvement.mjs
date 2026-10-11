// mouvement.mjs : energie de mouvement par seconde d'un extrait, mesuree et non declaree.
//   node mouvement.mjs <fichier.mp4> [--t0=a] [--plage=a:b] [--json=sortie.json] [--ref=reference.json] [--seuil=0.8]
// Mesure : ffmpeg ramene l'extrait a 30 i/s, garde la zone d'image au-dessus des sous-titres (les 82,4 % du haut, y < 890 sur 1080),
// la reduit a 320 x 148 en niveaux de gris ; l'energie d'une image est la moyenne, sur tous les pixels, de la difference absolue avec
// l'image precedente (echelle 0 a 255) ; l'energie d'une seconde est la moyenne de ses 30 images. « med » est la mediane de ces 30 valeurs :
// une seconde figee avec un seul eclair a une energie haute et une mediane nulle.
// Le temps du film est lu dans l'etiquette posee par render.mjs (comment=range=a:b), ou donne par --t0. Aucun fichier temporaire.
// Sortie : un tableau lisible, et un JSON (par defaut <fichier>.mouvement.json, a cote de l'extrait).
// Avec une reference (par defaut ../out/reference_mouvement.json) : mediane comparee a 80 % de la mediane de reference, secondes sous son 1er quartile.
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const pos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
if (!pos[0]) { console.error('usage : node mouvement.mjs <fichier.mp4> [--t0=a] [--plage=a:b] [--json=sortie.json] [--ref=reference.json]'); process.exit(1); }
const file = resolve(pos[0]); if (!existsSync(file)) { console.error('introuvable : ' + file); process.exit(1); }
const FPS = 30, WW = 320, HH = 148, ZONE = 0.824;
let t0 = 0;
try { const c = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags=comment', '-of', 'default=nw=1:nk=1', file]).toString().trim(); const m = /range=([\d.]+):([\d.]+)/.exec(c); if (m) t0 = +m[1]; } catch { }
if (args.t0 !== undefined) t0 = +args.t0;

const ff = spawn('ffmpeg', ['-loglevel', 'error', '-i', file, '-an', '-vf', `fps=${FPS},crop=iw:ih*${ZONE}:0:0,scale=${WW}:${HH}:flags=area,format=gray`, '-f', 'rawvideo', '-'], { stdio: ['ignore', 'pipe', 'inherit'] });
const N = WW * HH, mad = []; let prev = null, buf = Buffer.alloc(0);
ff.stdout.on('data', d => { buf = buf.length ? Buffer.concat([buf, d]) : d;
  while (buf.length >= N) { const cur = buf.subarray(0, N); if (prev) { let s = 0; for (let i = 0; i < N; i++) { const x = cur[i] - prev[i]; s += x < 0 ? -x : x; } mad.push(s / N); } prev = Buffer.from(cur); buf = buf.subarray(N); } });
await new Promise(r => ff.on('close', r));
if (mad.length < FPS) { console.error(`extrait trop court : ${mad.length + 1} images a 30 i/s`); process.exit(1); }

const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b), x = (s.length - 1) * p, i = Math.floor(x); return s[i] + (s[Math.min(i + 1, s.length - 1)] - s[i]) * (x - i); };
const r3 = x => +x.toFixed(3);
// mad[i] = difference entre l'image i+1 et l'image i ; elle appartient a la seconde ou tombe l'image i+1
let secs = [];
for (let k = 0; k * FPS < mad.length; k++) { const part = mad.slice(k * FPS, (k + 1) * FPS); if (part.length < FPS / 2) break;
  secs.push({ t: r3(t0 + k), energie: r3(part.reduce((a, b) => a + b, 0) / part.length), med: r3(q(part, .5)), figees: part.filter(x => x < .02).length, images: part.length }); }
if (args.plage) { const [a, b] = String(args.plage).split(':').map(Number); secs = secs.filter(s => s.t >= a - 1e-6 && s.t + 1 <= b + 1e-6); }
const en = secs.map(s => s.energie);
const out = { fichier: file, t0, fps_mesure: FPS, zone: "haut de l'image, 82,4 % (y < 890 sur 1080, au-dessus des sous-titres)", unite: 'difference absolue moyenne par pixel entre images consecutives a 30 i/s, echelle 0 a 255',
  secondes_mesurees: secs.length, mediane: r3(q(en, .5)), q1: r3(q(en, .25)), minimum: r3(Math.min(...en)), moyenne: r3(en.reduce((a, b) => a + b, 0) / en.length), maximum: r3(Math.max(...en)), par_seconde: secs };

const refPath = args.ref ? resolve(String(args.ref)) : resolve(HERE, '../out/reference_mouvement.json');
const jsonPath = args.json ? resolve(String(args.json)) : file.replace(/\.[^.\\/]+$/, '') + '.mouvement.json';
let ref = null; if (existsSync(refPath) && refPath !== jsonPath && args.ref !== 'non') { try { ref = JSON.parse(readFileSync(refPath, 'utf8')); } catch { } }
const top = Math.max(...en, ref ? ref.mediane * 2 : 0), bar = x => '#'.repeat(Math.max(0, Math.round(40 * Math.min(1, x / top))));
console.log(`${file}\n${secs.length} secondes mesurees a partir de t = ${t0} s du film`);
console.log(' t (s)   energie   med    figees  ');
for (const s of secs) { const bas = ref && s.energie < ref.q1; console.log(`${String(s.t.toFixed(1)).padStart(6)}  ${s.energie.toFixed(3).padStart(7)} ${s.med.toFixed(3).padStart(7)}  ${String(s.figees).padStart(2)}/${s.images}  ${bar(s.energie)}${bas ? '   << sous le 1er quartile de reference' : ''}`); }
console.log(`mediane ${out.mediane}   1er quartile ${out.q1}   minimum ${out.minimum}   moyenne ${out.moyenne}   maximum ${out.maximum}`);
if (ref) { const seuil = +(args.seuil || .8), cible = r3(ref.mediane * seuil), sous = secs.filter(s => s.energie < ref.q1);
  out.reference = { fichier: refPath, mediane: ref.mediane, q1: ref.q1, minimum: ref.minimum };
  out.verdict = { mediane_cible: cible, mediane_ok: out.mediane >= cible, secondes_sous_q1: sous.map(s => s.t), ok: out.mediane >= cible && sous.length === 0 };
  console.log(`reference (ouverture) : mediane ${ref.mediane}, 1er quartile ${ref.q1}, minimum ${ref.minimum}`);
  console.log(`mediane ${out.mediane} contre cible ${cible} (${seuil * 100} % de la reference) : ${out.verdict.mediane_ok ? 'ATTEINTE' : 'NON ATTEINTE'}`);
  console.log(sous.length ? `${sous.length} seconde(s) sous le 1er quartile de reference (${ref.q1}) : ${sous.map(s => s.t.toFixed(1)).join(', ')}` : `aucune seconde sous le 1er quartile de reference (${ref.q1})`);
  // pour information : la meme comparaison contre l'ouverture seule (0 a 29 s, film.js), plus exigeante que 0 a 45 s
  const p2 = resolve(HERE, '../out/reference_mouvement_0_29.json'); if (!args.ref && existsSync(p2)) { try { const r2 = JSON.parse(readFileSync(p2, 'utf8')), c2 = r3(r2.mediane * seuil), s2 = secs.filter(s => s.energie < r2.q1);
    out.verdict_ouverture_seule_0_29 = { mediane_ref: r2.mediane, q1_ref: r2.q1, mediane_cible: c2, mediane_ok: out.mediane >= c2, secondes_sous_q1: s2.map(s => s.t) };
    console.log(`pour information, contre l'ouverture seule (0 a 29 s : mediane ${r2.mediane}, 1er quartile ${r2.q1}) : cible ${c2} ${out.mediane >= c2 ? 'ATTEINTE' : 'NON ATTEINTE'}, ${s2.length} seconde(s) sous ${r2.q1}`); } catch { } } }
writeFileSync(jsonPath, JSON.stringify(out, null, 1)); console.log('ecrit ' + jsonPath);

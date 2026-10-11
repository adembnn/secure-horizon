// render.mjs : rend video/v5/src/index.html image par image dans le Chromium de la chaine locale du fondateur.
// Chaque appel lance son propre navigateur et n'ecrit QUE le fichier donne par --out : plusieurs appels peuvent tourner en meme temps.
//   node render.mjs --stills=50.5,65.3 --out=../out/cles/s3b          PNG 1920x1080 (ou --stills=cles : les temps de window.CLES)
//   node render.mjs --strip=45:54 --dt=0.25 --cols=8 --w=480 --out=../out/planches/s3a.jpg     planche : une image toutes les 0,25 s
//   node render.mjs --strip=65:65.6 --step=1 --cols=6 --out=../out/planches/gant.jpg          toutes les images d'un passage (60 i/s)
//   node render.mjs --clip --range=54.2:76.34 --fps=30 --w=1280 --grain=0 --out=../out/scenes/s3b.mp4     extrait muet (voir apercu.sh)
//   node render.mjs --clip --out=../out/image.mp4                     film entier muet, 60 i/s (H.264, crf 14, grain 3)
//   node render.mjs --cues --out=../out/cues.json                     reperes sonores, images cles, bornes des scenes
// Options de --clip : --range=a:b --fps=60 --w=<largeur> --grain=3 (0 = sans) --crf=14 --preset=medium.
// Aucune dependance a installer : puppeteer-core et Chromium sont lus dans C:\Users\Adem\Video AI\atelier (variable ATELIER).
// Code de sortie 2 si la page a leve une erreur (erreur de script, image introuvable).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ATELIER = process.env.ATELIER || 'C:/Users/Adem/Video AI/atelier';
const require = createRequire(resolve(ATELIER, 'package.json'));
const puppeteer = require('puppeteer-core');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const CHROME = process.env.CHROME_PATH || resolve(ATELIER, 'pw-browsers/chromium-1248/chrome-win64/chrome.exe');
if (!existsSync(CHROME)) { console.error('Chromium introuvable : ' + CHROME); process.exit(1); }
const fps = +(args.fps || 60);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 0,
  args: ['--allow-file-access-from-files', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--force_high_performance_gpu', '--enable-gpu-rasterization', '--window-size=1920,1080', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
const page = await browser.newPage(); await page.setViewport({ width: 1920, height: 1080 });
let errs = 0;
page.on('console', m => { if (['error', 'warn'].includes(m.type())) { console.log('[page]', m.text()); if (m.type() === 'error') errs++; } });
page.on('pageerror', e => { errs++; console.log('[page error]', e.message); });
await page.goto(pathToFileURL(resolve(HERE, 'index.html')).href, { waitUntil: 'load' });
await page.waitForFunction('window.ready === true', { timeout: 60000 });
const frame = async (t, type = 'image/jpeg', q = .95) => { const u = await page.evaluate((t, type, q) => window.renderAt(t, type, q), t, type, q); return Buffer.from(u.slice(u.indexOf(',') + 1), 'base64'); };
const DUR = await page.evaluate(() => window.DUR);
const nom = x => String(x).replace('.', '_');
if (args.cues) {
  const out = resolve(args.out || '../out/cues.json'); mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(await page.evaluate(() => ({ ...window.CUES, cles: window.CLES, comptes: window.COUNTS, sous_titres: window.SUBS, scenes: window.SCENES })), null, 1)); console.log('ecrit', out);
} else if (args.stills) {
  const out = resolve(args.out || '../out/cles'); mkdirSync(out, { recursive: true });
  const cles = await page.evaluate(() => window.CLES);
  const list = args.stills === 'cles' ? Object.entries(cles) : String(args.stills).split(',').map(s => [null, +s]);
  let i = 1; for (const [name, t] of list) { const f = `${out}/${name ? String(i++).padStart(2, '0') + '_' + name : 't' + t.toFixed(2).replace('.', '_')}.png`; writeFileSync(f, await frame(t, 'image/png')); console.log(f, t); }
} else if (args.strip) {
  const [a, b] = String(args.strip).split(':').map(Number), step = args.dt ? +args.dt * fps : +(args.step || 1), cols = +(args.cols || 6), w = +(args.w || 480), out = resolve(args.out || `../out/planches/planche_${nom(a)}_${nom(b)}.jpg`);
  mkdirSync(dirname(out), { recursive: true });
  const n = Math.floor((b - a) * fps / step + 1e-6) + 1;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf', `scale=${w}:-1,tile=${cols}x${Math.ceil(n / cols)}`, '-frames:v', '1', '-q:v', '3', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) ff.stdin.write(await frame(a + i * step / fps));
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('ecrit', out, ':', n, 'images, une toutes les', +(step / fps).toFixed(4), 's, de', a, 'a', +(a + (n - 1) * step / fps).toFixed(3), 's ;', cols, 'par ligne');
} else if (args.clip) {
  const [a, b] = args.range ? String(args.range).split(':').map(Number) : [0, DUR], out = resolve(args.out || `../out/image_${nom(a)}_${nom(+b.toFixed(2))}.mp4`); mkdirSync(dirname(out), { recursive: true });
  const n = Math.round((b - a) * fps), t0 = Date.now(), grain = +(args.grain ?? 3);
  const vf = [args.w ? `scale=${+args.w}:-2:flags=lanczos` : null, grain > 0 ? `noise=alls=${grain}:allf=t` : null].filter(Boolean).join(',') || 'null';
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-vf', vf, '-c:v', 'libx264', '-preset', String(args.preset || 'medium'), '-crf', String(args.crf || 14), '-pix_fmt', 'yuv420p', '-metadata', `comment=range=${a}:${b}`, '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) { if (!ff.stdin.write(await frame(a + i / fps))) await new Promise(r => ff.stdin.once('drain', r)); if (i % 90 === 0) console.log(`image ${i}/${n}`); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log(`ecrit ${out} : ${n} images de ${a} a ${b} s, ${fps} i/s, ${((Date.now() - t0) / n).toFixed(0)} ms/image`);
}
await browser.close();
console.log(errs ? `${errs} ERREUR(S) DE PAGE` : '0 erreur de page');
if (errs) process.exitCode = 2;

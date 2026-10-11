// bornes.mjs : affiche les bornes des scenes et les debuts de lignes lus dans la page (font foi apres un changement de pauses).
import { createRequire } from 'node:module'; import { resolve, dirname } from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)), ATELIER = process.env.ATELIER || 'C:/Users/Adem/Video AI/atelier';
const puppeteer = createRequire(resolve(ATELIER, 'package.json'))('puppeteer-core');
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || resolve(ATELIER, 'pw-browsers/chromium-1248/chrome-win64/chrome.exe'), headless: true, args: ['--allow-file-access-from-files'] });
const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(pathToFileURL(resolve(HERE, 'index.html')).href, { waitUntil: 'load' }); await p.waitForFunction('window.ready === true', { timeout: 60000 });
const r = await p.evaluate(() => ({ dur: window.DUR, scenes: window.SCENES, voix: window.TL.voix.map(v => ({ id: v.id, debut: v.debut, fin: v.fin, st: v.st })) }));
console.log(JSON.stringify({ ...r, erreurs: errs })); await b.close();

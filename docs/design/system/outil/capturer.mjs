/* Hold up : captures des écrans avec le Chromium de Playwright, sans fenêtre.
 *   node docs/design/system/outil/capturer.mjs            toutes les vues, à 100 %, clair (et sombre pour les surfaces de page)
 *   node docs/design/system/outil/capturer.mjs 1.25 1.5   en plus, les mêmes vues au zoom 125 % et 150 %
 *   node docs/design/system/outil/capturer.mjs planche    les deux planches publiables, entières, clair et sombre, et à 400 px de large
 * Sortie : docs/design/system/captures/. Chaque vue est aussi contrôlée : rien ne doit défiler (hors la liste du journal). */
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PW = process.env.HU_PLAYWRIGHT || 'C:/Users/Adem/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright-core';
const EXE = process.env.HU_CHROMIUM || 'C:/Users/Adem/AppData/Local/Packages/Claude_pzs8sxrjxfjjc/LocalCache/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const { chromium } = require(PW);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'captures');
mkdirSync(out, { recursive: true });
const SCREENS = ['ecran_question', 'ecran_relance', 'ecran_correspond', 'ecran_ne_correspond_pas', 'ecran_non_verifie', 'repli_dans_la_page', 'popup', 'panneau_lateral', 'options', 'bienvenue'];
const args = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: EXE, headless: true });
let bad = 0;

async function views(theme, zoom) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: zoom, colorScheme: theme });
  const page = await ctx.newPage();
  for (const s of SCREENS) {
    await page.goto(pathToFileURL(join(root, s + '.html')).href);
    if (zoom !== 1) await page.evaluate((z) => document.documentElement.style.setProperty('--z', String(z)), zoom);
    const ids = await page.$$eval('.pl-view', (els) => els.map((e) => e.id));
    for (const id of ids) {
      const frame = page.locator('#' + id + ' .pl-frame');
      const report = await frame.evaluate((f) => {
        const over = [];
        const box = f.getBoundingClientRect();
        for (const el of [f, ...f.querySelectorAll('*')]) {
          if (el.closest('.hu-scroll') && !el.classList.contains('hu-scroll')) continue;
          const cs = getComputedStyle(el);
          const scrolls = /auto|scroll/.test(cs.overflowY) || /auto|scroll/.test(cs.overflowX) || el === f;
          if (scrolls && !el.classList.contains('hu-scroll') && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) over.push(`${el.className || el.tagName} défile (${el.scrollWidth}×${el.scrollHeight} dans ${el.clientWidth}×${el.clientHeight})`);
          if (el !== f && el.getClientRects().length && !el.closest('.hu-sr')) {
            const r = el.getBoundingClientRect();
            if (r.width && r.height && (r.right > box.right + 1 || r.left < box.left - 1)) over.push(`${el.className || el.tagName} sort du cadre en largeur`);
          }
        }
        return over;
      });
      if (report.length) { bad++; console.log(`[${theme} ${zoom}] ${id}: ${[...new Set(report)].join(' ; ')}`); }
      const name = id.replace(/^v-/, '') + (zoom !== 1 ? '_' + Math.round(zoom * 100) : '') + (theme === 'dark' ? '_sombre' : '');
      await frame.screenshot({ path: join(out, name + '.png') });
    }
  }
  await ctx.close();
}

async function sheet(file, theme, width, name) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
  const page = await ctx.newPage();
  await page.setContent('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>' + readFileSync(join(root, file), 'utf8') + '</body></html>');
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
  if (m.sw > m.cw) { bad++; console.log(`${file} à ${width} px : défilement horizontal de la page (${m.sw} > ${m.cw})`); }
  await page.screenshot({ path: join(out, name + '.png'), fullPage: true });
  console.log(file, theme, width, 'hauteur', m.h);
  await ctx.close();
}

if (args[0] === 'planche') {
  await sheet('planche.html', 'light', 1500, 'planche_clair');
  await sheet('planche.html', 'dark', 1500, 'planche_sombre');
  await sheet('planche.html', 'light', 400, 'planche_400');
  await sheet('motion_planche.html', 'light', 1500, 'motion_planche_clair');
  await sheet('motion_planche.html', 'light', 400, 'motion_planche_400');
} else {
  await views('light', 1);
  await views('dark', 1);
  for (const z of args.map(Number).filter((n) => n > 1)) await views('light', z);
}
await browser.close();
console.log(bad ? `${bad} défaut(s)` : 'aucun défaut mécanique');

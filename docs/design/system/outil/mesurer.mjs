/* Hold up : mesure la fluidité de chaque animation de motion.html avec le Chromium de Playwright.
 *   node docs/design/system/outil/mesurer.mjs [répétitions=3] [ralentissement CPU=1]
 * Pour chaque animation : nombre d'images, images perdues (intervalle > 1,5 × la médiane), plus longue image.
 * Sortie : tableau sur la console et docs/design/system/captures/mesures_fluidite.json. */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const PW = process.env.HU_PLAYWRIGHT || 'C:/Users/Adem/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright-core';
const EXE = process.env.HU_CHROMIUM || 'C:/Users/Adem/AppData/Local/Packages/Claude_pzs8sxrjxfjjc/LocalCache/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const { chromium } = require(PW);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reps = Number(process.argv[2]) || 3, throttle = Number(process.argv[3]) || 1;

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(pathToFileURL(join(root, 'motion.html')).href);
if (throttle > 1) { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle }); }
const names = ["(repos, 3 s)"].concat(await page.evaluate(() => window.huMotion.names));
const rows = [];
for (const name of names) {
  let frames = 0, dropped = 0, longest = 0, median = 0, shift = 0, over = 0;
  for (let r = 0; r < reps; r++) {
    if (!name.startsWith("(")) await page.locator(`[data-demo="${name}"]`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const m = await page.evaluate(async (n) => {
      const t = []; let on = true, cls = 0;
      const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; });
      try { po.observe({ type: 'layout-shift' }); } catch (_) {}
      const tick = (now) => { t.push(now); if (on) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      if (n === "(repos, 3 s)") await new Promise((r) => setTimeout(r, 3000)); else await window.huMotion.play(n);
      on = false; po.disconnect();
      const d = []; for (let i = 1; i < t.length; i++) d.push(t[i] - t[i - 1]);
      const s = d.slice().sort((a, b) => a - b), med = s[Math.floor(s.length / 2)] || 0;
      return { frames: d.length, median: med, dropped: d.filter((x) => x > med * 1.5).length, longest: s[s.length - 1] || 0, over: d.filter((x) => x > 16.7).length, cls };
    }, name);
    frames += m.frames; dropped += m.dropped; over += m.over; longest = Math.max(longest, m.longest); median = m.median; shift = Math.max(shift, m.cls);
  }
  rows.push({ animation: name, images: frames, 'perdues (> 1,5 × médiane)': dropped, 'pour 1000 images': +(dropped * 1000 / frames).toFixed(1), 'au-delà de 16,7 ms': over, 'plus longue (ms)': +longest.toFixed(1), 'médiane (ms)': +median.toFixed(1), 'saut de mise en page': +shift.toFixed(4) });
}
console.table(rows);
if (errors.length) console.log('erreurs de console :', errors);
writeFileSync(join(root, 'captures', 'mesures_fluidite.json'), JSON.stringify({ date: new Date().toISOString(), repetitions: reps, ralentissement_cpu: throttle, erreurs: errors, mesures: rows }, null, 1));
await browser.close();

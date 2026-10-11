// Edge cases on the real flow. node bugs.mjs <case>
import { launch, openScene, waitPopup, sleep, txt, rec, frames, S } from './lib.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const which = process.argv[2];
const log = { cas: which, steps: [] };
const site = async (h) => (await h.page.locator('#state').innerText().catch(() => '')).replace(/\s+/g, ' ') + ' | bouton: ' + (await h.page.locator('#btn-swap').innerText().catch(() => '?')) + ' | inactif: ' + (await h.page.locator('#btn-swap').isDisabled().catch(() => '?'));
const openCount = (h) => h.popups.filter((p) => !p.isClosed()).length;
let h;
try {
  if (which === 'fermeture') { // close the window with its X
    h = await launch({ ext: join(S, 'ext_frais'), name: 'bug_' + which }); const p = await openScene(h, 'piege'); await sleep(900);
    await p.close(); await sleep(1500); log.steps.push('fenêtre fermée par la croix -> site: ' + await site(h));
    await h.page.locator('#btn-swap').click().catch(() => {}); const p2 = await waitPopup(h, 2, 6000); await sleep(800);
    log.steps.push('nouvel essai -> ' + (p2 ? 'fenêtre 2: ' + await txt(p2) : 'AUCUNE fenêtre') + ' | site: ' + await site(h));
    if (p2) { await p2.screenshot({ path: join(h.out, 'apres_fermeture_nouvel_essai.png') }); }
  }
  if (which === 'rechargement') { // reload the site while the question is open
    h = await launch({ ext: join(S, 'ext_frais'), name: 'bug_' + which }); const p = await openScene(h, 'piege'); await sleep(900);
    await p.locator('textarea').type('échanger 50 USDC', { delay: 10 });
    await h.page.reload(); await sleep(2500);
    log.steps.push('site rechargé pendant la question -> fenêtre ' + (p.isClosed() ? 'fermée' : 'ENCORE OUVERTE: ' + await txt(p)) + ' | fenêtres ouvertes: ' + openCount(h));
    if (!p.isClosed()) { await p.screenshot({ path: join(h.out, 'fenetre_orpheline.png') }); await p.locator('textarea').press('Enter').catch(() => {}); await sleep(1500); log.steps.push('Entrée dans la fenêtre orpheline -> ' + (p.isClosed() ? 'fermée' : await txt(p))); if (!p.isClosed()) await p.screenshot({ path: join(h.out, 'fenetre_orpheline_apres_entree.png') }); }
    await h.page.locator('#btn-swap').click().catch(() => {}); await sleep(2200); if (/connex|connect/i.test(await h.page.locator('#btn-swap').innerText().catch(() => ''))) { await h.page.locator('#btn-swap').click(); await sleep(1800); }
    await sleep(1500); log.steps.push('après rechargement et nouveau clic -> fenêtres ouvertes: ' + openCount(h) + ' (créées au total: ' + h.popups.length + ') | site: ' + await site(h));
  }
  if (which === 'double_clic') {
    h = await launch({ ext: join(S, 'ext_frais'), name: 'bug_' + which });
    await sleep(1200); await h.page.goto('http://127.0.0.1:8793/?mode=piege'); await sleep(2000);
    await h.page.locator('#btn-swap').click(); await sleep(2200);
    if (!h.popups.length) { await h.page.locator('#btn-swap').dblclick({ force: true }).catch(() => {}); await h.page.locator('#btn-swap').click({ force: true }).catch(() => {}); }
    await sleep(3000); log.steps.push('clics répétés sur le bouton du site -> fenêtres ouvertes: ' + openCount(h) + ' | site: ' + await site(h));
    const geos = []; for (const p of h.popups) if (!p.isClosed()) geos.push(await p.evaluate(() => [screenX, screenY, outerWidth, outerHeight]).catch(() => null)); log.steps.push('positions: ' + JSON.stringify(geos));
    // two tabs asking at once
    const page2 = await h.ctx.newPage(); await page2.goto('http://127.0.0.1:8793/?mode=piege'); await sleep(1500); await page2.locator('#btn-swap').click(); await sleep(2000); if (/connex|connect/i.test(await page2.locator('#btn-swap').innerText().catch(() => ''))) { await page2.locator('#btn-swap').click(); } await sleep(3000);
    const ext = h.popups.filter((p) => !p.isClosed() && p.url().startsWith('chrome-extension'));
    log.steps.push('deux onglets demandent en même temps -> fenêtres Hold up ouvertes: ' + ext.length); const g2 = []; for (const p of ext) g2.push(await p.evaluate(() => [screenX, screenY, document.title]).catch(() => null)); log.steps.push('positions et titres: ' + JSON.stringify(g2));
  }
  if (which === 'fin_delai') { // 5 s delay : the moment "Continuer" opens, then Continue
    h = await launch({ ext: join(S, 'ext_frais'), name: 'bug_' + which, cfg: { askIntent: 'always', dangerWaitMs: 5000, manipulationHoldMs: 30000, verdictWindow: true, limitUnlimited: true } });
    const p = await openScene(h, 'permit'); await sleep(900);
    await p.locator('textarea').type('échanger 50 USDC contre AVAX', { delay: 10 }); await p.locator('textarea').press('Enter'); await sleep(600);
    log.steps.push('réponse: ' + await txt(p)); let r = null; const t0 = Date.now();
    while (Date.now() - t0 < 7000) { r = (await rec(p)) || r; await sleep(100); }
    await p.screenshot({ path: join(h.out, 'delai_termine.png') });
    const open = r.mut.find((m) => !/sera possible/.test(m.txt) && /Annuler Continuer/.test(m.txt) && /correspond/.test(m.txt));
    log.steps.push('mutations: ' + JSON.stringify(r.mut.slice(-8)));
    if (open) log.fin_delai = { t: open.t, images_autour: frames(r.raf, open.t - 300, open.t + 300), ls: r.ls.filter((x) => x.t > open.t - 300), longtasks: r.lt.filter((x) => x.t > open.t - 300) };
    log.steps.push('après le délai: ' + JSON.stringify(await p.evaluate(() => ({ focus: document.activeElement.innerText, wait: document.querySelector('.hu-wait').innerText, boutons: [...document.querySelectorAll('button')].map((b) => b.innerText + (b.getAttribute('aria-disabled') ? ' (inactif)' : '') + ' ' + b.className) }))));
    await p.locator('button', { hasText: 'Continuer' }).click(); const tC = Date.now(); const seen = []; while (!p.isClosed() && Date.now() - tC < 3000) { const t = await txt(p); if (t !== '(fermée)' && seen[seen.length - 1] !== t) seen.push(t); await sleep(20); }
    log.steps.push('Continuer -> textes vus: ' + JSON.stringify(seen) + ' ; fenêtre fermée après ' + (Date.now() - tC) + ' ms'); await sleep(2000); log.steps.push('site: ' + await site(h));
  }
  if (which === 'annuler_puis_reessayer') {
    h = await launch({ ext: join(S, 'ext_frais'), name: 'bug_' + which }); const p = await openScene(h, 'honnete'); await sleep(900);
    await p.locator('button', { hasText: 'Annuler' }).click(); await sleep(1500); log.steps.push('Annuler à la question -> site: ' + await site(h));
    await h.page.screenshot({ path: join(h.out, 'site_apres_annuler.png') });
    await h.page.locator('#btn-swap').click().catch(() => {}); const p2 = await waitPopup(h, 2, 6000); await sleep(900);
    log.steps.push('nouvel essai -> ' + (p2 && !p2.isClosed() ? await txt(p2) + ' | champ: « ' + await p2.locator('textarea').inputValue().catch(() => '?') + ' » | focus: ' + await p2.evaluate(() => document.activeElement.tagName) : 'aucune fenêtre'));
    // lose focus : click on the site, does the window stay reachable ?
    if (p2 && !p2.isClosed()) { await h.page.bringToFront(); await sleep(800); log.steps.push('clic sur le site pendant la question -> fenêtre ' + (p2.isClosed() ? 'fermée' : 'ouverte, visible=' + await p2.evaluate(() => document.visibilityState + ' focus=' + document.hasFocus())));
      await h.page.locator('#btn-swap').click({ force: true, timeout: 1500 }).catch(() => {}); await sleep(1200); log.steps.push('nouveau clic sur le site -> fenêtres ouvertes: ' + openCount(h) + ' | site: ' + await site(h)); }
  }
} catch (e) { log.steps.push('ERREUR ' + String(e.message).split('\n')[0]); }
log.console = h ? h.consoleLog : [];
if (h) { await h.close(); writeFileSync(join(h.out, 'log.json'), JSON.stringify(log, null, 1)); }
console.log(JSON.stringify(log, null, 1));

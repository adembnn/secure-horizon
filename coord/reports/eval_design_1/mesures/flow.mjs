// node flow.mjs <name> <mode> <scheme> <ext> <sentence> [second sentence]
import { launch, openScene, waitPopup, sleep, txt, rec, frames, S } from './lib.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const [,, name, mode, scheme, extName, s1, s2] = process.argv;
const h = await launch({ ext: join(S, extName), name, scheme });
const log = { name, mode, scheme, extId: h.extId, steps: [], measures: {} };
const shot = async (p, n) => { await p.screenshot({ path: join(h.out, n + '.png') }).catch((e) => log.steps.push('capture ratée ' + n)); };
try {
  let n = 0;
  const pop = await openScene(h, mode);
  if (!pop) throw new Error('aucune fenêtre');
  for (let round = 1; round <= 3; round++) {
    const p = await waitPopup(h, round, round === 1 ? 9000 : 6000); if (!p) { log.steps.push(`fenêtre ${round}: aucune`); break; }
    await p.waitForLoadState().catch(() => {}); await sleep(900);
    const geo = await p.evaluate(() => ({ iw: innerWidth, ih: innerHeight, ow: outerWidth, oh: outerHeight, dpr: devicePixelRatio, sx: screenX, sy: screenY, scrollH: document.documentElement.scrollHeight, mainScroll: (() => { const m = document.querySelector('.hu-main'); return m ? [m.scrollHeight, m.clientHeight] : null; })(), active: document.activeElement && document.activeElement.tagName })).catch(() => null);
    log.steps.push(`fenêtre ${round} géométrie: ` + JSON.stringify(geo));
    log.steps.push(`fenêtre ${round} question: ` + await txt(p));
    await shot(p, `${round}_1_question`);
    let r0 = await rec(p);
    if (r0) log.measures[`ouverture_${round}`] = { paint: r0.paint, premieres_mutations: r0.mut.slice(0, 4), ls: r0.ls, longtasks: r0.lt, frames_0_1000: frames(r0.raf, 0, 1000) };
    const field = p.locator('textarea').first();
    if (!(await field.count())) { log.steps.push('pas de champ'); await shot(p, `${round}_x_sans_champ`); }
    else {
      await field.type(s1, { delay: 15 }); await sleep(300); await shot(p, `${round}_2_saisie`);
      await field.press('Enter');
      let last = null, seen = [], closedAt = null; const t0 = Date.now(); let shotDone = false, shotLock = false;
      while (Date.now() - t0 < 5000) {
        if (p.isClosed()) { closedAt = Date.now() - t0; break; }
        const r = await rec(p); if (r) last = r;
        const t = await txt(p); if (t && seen[seen.length - 1] !== t) { seen.push(t); }
        if (!shotLock && /Vérification|compare/.test(t)) { shotLock = true; await shot(p, `${round}_3_verification`); }
        if (!shotDone && /correspond|pas pu vérifier/.test(t)) { shotDone = true; await shot(p, `${round}_4_reponse`); }
        await sleep(40);
      }
      log.steps.push(`fenêtre ${round} textes vus: ` + JSON.stringify(seen));
      log.steps.push(`fenêtre ${round} fermée après (ms): ` + closedAt);
      if (last) {
        const key = last.ev.filter((e) => e.k === 'key:Enter').pop();
        const after = last.mut.filter((m) => key && m.t >= key.t);
        log.measures[`verdict_${round}`] = { entree_t: key && key.t, mutations: after, ls: last.ls.filter((x) => key && x.t >= key.t - 5), longtasks: last.lt.filter((x) => key && x.t >= key.t - 5),
          frames_entree_a_fin: key ? frames(last.raf, key.t, last.raf[last.raf.length - 1]) : null };
      }
      // follow-up question (relance) : type the second sentence
      if (!p.isClosed() && s2 && await p.locator('textarea:not([readonly])').count()) {
        log.steps.push(`fenêtre ${round} relance: ` + await txt(p)); await shot(p, `${round}_5_relance`);
        const f2 = p.locator('textarea').first(); await f2.fill(''); await f2.type(s2, { delay: 15 }); await f2.press('Enter'); await sleep(1500);
        log.steps.push(`fenêtre ${round} après relance: ` + await txt(p)); await shot(p, `${round}_6_apres_relance`);
      }
      if (!p.isClosed()) {
        // answer that stays : countdown measures for 3.2 s, keyboard, then Escape
        const a = await p.evaluate(() => ({ boutons: [...document.querySelectorAll('button')].map((b) => ({ t: b.innerText, dis: b.getAttribute('aria-disabled'), disabled: b.disabled, cls: b.className })), actif: document.activeElement && (document.activeElement.innerText || document.activeElement.tagName), wait: (document.querySelector('.hu-wait') || {}).innerText })).catch(() => null);
        log.steps.push(`fenêtre ${round} réponse qui reste: ` + JSON.stringify(a));
        const rA = await rec(p); const tA = rA ? rA.raf[rA.raf.length - 1] : 0; await sleep(3200); const rB = await rec(p);
        if (rB) log.measures[`compte_a_rebours_${round}`] = { frames_3200ms: frames(rB.raf, tA, tA + 3200), mutations: rB.mut.filter((m) => m.t >= tA), ls: rB.ls.filter((x) => x.t >= tA), longtasks: rB.lt.filter((x) => x.t >= tA) };
        await shot(p, `${round}_7_compte_a_rebours`);
        // keyboard : tab order
        const order = [];
        for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); order.push(await p.evaluate(() => { const e = document.activeElement; return e ? (e.tagName + ':' + (e.innerText || '').slice(0, 20) + (e.getAttribute('aria-disabled') ? '[inactif]' : '')) : 'rien'; })); }
        log.steps.push(`fenêtre ${round} ordre de tabulation: ` + order.join(' > '));
        await shot(p, `${round}_8_focus`);
        // Continuer before the end of the delay : click + Enter
        const go = p.locator('button', { hasText: 'Continuer' });
        if (await go.count()) { await go.click({ force: true }).catch(() => {}); await sleep(400); log.steps.push(`fenêtre ${round} clic sur Continuer inactif -> ` + (p.isClosed() ? 'fermée' : await txt(p))); }
        if (!p.isClosed()) { await p.keyboard.press('Escape'); const tE = Date.now(); let endTxt = ''; while (!p.isClosed() && Date.now() - tE < 3000) { const t = await txt(p); if (t && t !== '(fermée)') endTxt = t; await sleep(40); }
          log.steps.push(`fenêtre ${round} Échap -> « ${endTxt} », fermée après ${Date.now() - tE} ms`); }
        break;
      }
    }
    await sleep(1500);
  }
  await sleep(2000);
  await h.page.screenshot({ path: join(h.out, '9_site_fin.png') });
  log.steps.push('site à la fin: ' + (await h.page.locator('#state').innerText().catch(() => '')).replace(/\s+/g, ' '));
  log.steps.push('nombre de fenêtres ouvertes au total: ' + h.popups.length);
} catch (e) { log.steps.push('ERREUR ' + String(e.message).split('\n')[0]); }
log.wallet = h.walletCalls; log.console = h.consoleLog;
await h.close();
writeFileSync(join(h.out, 'log.json'), JSON.stringify(log, null, 1));
console.log(JSON.stringify(log, null, 1));

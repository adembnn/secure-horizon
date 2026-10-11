// Every state of every surface, drawn by the real extension pages (chrome-extension://<id>/...), light + dark, 100 % + 150 %.
import { chromium, EXE, S, sleep } from './lib.mjs';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const extName = process.argv[2] || 'ext_frais', extPath = process.argv[3] || join(S, extName);
const out = join(S, 'static_' + extName); rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const profile = join(S, 'profiles', 'static_' + extName); rmSync(profile, { recursive: true, force: true });
const ctx = await chromium.launchPersistentContext(profile, { executablePath: EXE, headless: false, args: [`--disable-extensions-except=${extPath}`, `--load-extension=${extPath}`, '--headless=new'], viewport: null, locale: 'fr-FR' });
let sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker', { timeout: 8000 });
const id = new URL(sw.url()).host; const base = `chrome-extension://${id}/`;
const report = { ext: extName, id, console: [], states: {}, contrast: {}, keyboard: {}, pages: {} };
sw.on('console', (m) => { if (['error', 'warning'].includes(m.type())) report.console.push('[worker] ' + m.text().slice(0, 200)); });
const hook = (p, tag) => { p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) report.console.push(`[${tag}] ${m.type()}: ${m.text().slice(0, 240)}`); }); p.on('pageerror', (e) => report.console.push(`[${tag}] pageerror: ${String(e.message).slice(0, 240)}`)); };

const A = '0x52908400098527886E0F7030069857D2E4169EE7', B = '0x52908400098527886E0F7030069857D2E4169eE1';
const cells = (x, y) => Array.from({ length: 10 }, (_, g) => Array.from({ length: 4 }, (_, i) => ({ c: x[g * 4 + i], diff: x[g * 4 + i].toLowerCase() !== y[g * 4 + i].toLowerCase() })));
const B2 = '0x5290a400098527886E0F7030069857D2E41c9EE7';
const addresses = { expected: cells(A.slice(2), B2.slice(2)), actual: cells(B2.slice(2), A.slice(2)), expectedFull: A, actualFull: B2 };
const STATES = {
  question: { kind: 'question', title: 'Que veux-tu faire sur app.neve.exchange ?', placeholder: 'Par exemple : échanger 50 USDC contre AVAX' },
  question_saisie: { kind: 'question', title: 'Que veux-tu faire sur app.neve.exchange ?', placeholder: 'Par exemple : échanger 50 USDC contre AVAX', _type: 'échanger 50 USDC contre AVAX' },
  question_vide_entree: { kind: 'question', title: 'Que veux-tu faire sur app.neve.exchange ?', placeholder: 'Par exemple : échanger 50 USDC contre AVAX', _enter: true },
  question_verification: { kind: 'question', title: 'Que veux-tu faire sur app.neve.exchange ?', placeholder: 'Par exemple : échanger 50 USDC contre AVAX', checking: true, _type0: 'échanger 50 USDC contre AVAX' },
  question_site_long: { kind: 'question', title: 'Que veux-tu faire sur secure-login.app.neve.exchange.verification-portefeuille-officiel.example.com ?', placeholder: 'Par exemple : échanger 50 USDC contre AVAX', _type: 'échanger 50 USDC contre AVAX puis envoyer le reste à mon frère Paul qui me le demande depuis hier, et garder de quoi payer les frais du réseau pendant quelques jours encore, soit environ deux AVAX' },
  relance: { kind: 'question', title: 'Que veux-tu faire, et pour combien ?', placeholder: 'Par exemple : échanger 50 USDC contre AVAX' },
  correspond_auto: { kind: 'answer', outcome: 'match', headline: 'Ça correspond à ce que tu as écrit.', line: 'La demande donne accès à 50 USDC, pas plus.', noModel: true, autoMs: 3600000 },
  correspond_droit_limite: { kind: 'answer', outcome: 'match', headline: 'Ça correspond à ce que tu as écrit.', line: 'La demande échange 50 USDC contre AVAX.', fix: 'Droit limité à 50 USDC', noModel: true, leftMs: 0 },
  ne_correspond_pas_delai: { kind: 'answer', outcome: 'mismatch', headline: 'Ça ne correspond pas à ce que tu as écrit.', line: 'Tu as écrit 50 USDC. Cette signature donne accès à tout ton USDC et ne peut pas être limitée.', noModel: true, leftMs: 24000 },
  ne_correspond_pas_droit_limite: { kind: 'answer', outcome: 'mismatch', headline: 'Ça ne correspond pas à ce que tu as écrit.', line: 'Tu as écrit 50 USDC. La demande donne accès à tout ton USDC.', fix: 'Droit limité à 50 USDC', noModel: true, leftMs: 0 },
  ne_correspond_pas_adresses: { kind: 'answer', outcome: 'mismatch', headline: 'Ça ne correspond pas à ce que tu as écrit.', line: 'L’adresse de cette demande ressemble à une adresse que tu connais, mais ce n’est pas la même.', addresses, labels: { expected: 'Adresse que tu connais', actual: 'Adresse de cette demande' }, model: 'clef', leftMs: 600000 },
  pas_pu_verifier: { kind: 'answer', outcome: 'unverifiable', headline: 'Je n’ai pas pu vérifier cette demande.', line: 'Je ne connais pas ce jeton : je ne peux pas vérifier qu’il s’agit bien de USDC.', noModel: true, leftMs: 30000 },
  texte_tres_long: { kind: 'answer', outcome: 'mismatch', headline: 'Ça ne correspond pas à ce que tu as écrit.', line: 'Tu as écrit 50 USDC. La demande donne à 0x1234…abcd le droit de dépenser tout ton USDC, tout ton WAVAX et tous tes objets de la collection Glacier, sans limite de durée, et ce site pourra les déplacer sans te redemander ton accord, même plus tard.', fix: 'Droit limité à 50 USDC', addresses, labels: { expected: 'Adresse que tu as écrite', actual: 'Adresse de cette demande' }, noModel: true, leftMs: 95000 },
  fin_annulee: { _end: 'Demande annulée. Rien n’a été envoyé.' },
  fin_part: { _end: 'La demande part vers ton portefeuille.' }
};
const VP = { '100': { width: 422, height: 493, dsf: 1 }, '150': { width: 281, height: 329, dsf: 1.5 } };

async function drawState(p, s) {
  await p.evaluate((s) => {
    document.querySelectorAll('.hu').forEach((n) => n.remove());
    const root = document.createElement('div'); root.id = 'hu'; root.className = 'hu'; document.body.prepend(root);
    const ui = window.HoldupScreen.mount(root, { onSubmit() {}, onCancel() {}, onContinue() {} });
    if (s._end) ui.end(s._end); else ui.show(s, 'k');
    const f = root.querySelector('textarea');
    if (f && s._type0) f.value = s._type0;
  }, s);
  if (s._type) { await p.locator('textarea').fill(s._type); }
  if (s._enter) { await p.locator('textarea').press('Enter'); }
  await sleep(180);
}
const audit = (p) => p.evaluate(() => {
  const main = document.querySelector('.hu-main'), de = document.documentElement, out = { inner: [innerWidth, innerHeight], docScroll: [de.scrollWidth, de.scrollHeight], main: main ? [main.scrollHeight, main.clientHeight] : null, clipped: [], boxes: {} };
  if (main) out.mainOverflow = main.scrollHeight > main.clientHeight;
  for (const e of document.querySelectorAll('.hu *')) { const r = e.getBoundingClientRect(); if (!r.width) continue; if (r.right > innerWidth + 0.5 || r.left < -0.5) out.clipped.push(e.className + ':' + Math.round(r.left) + '-' + Math.round(r.right)); if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible') out.clipped.push('scrollX ' + e.className); }
  for (const sel of ['.hu-title', '.hu-field', '.hu-line', '.hu-fix', '.hu-note', '.hu-wait', '.hu-actions', '.hu-btn', '.hu-addr-grid', '.hu-end']) { const e = document.querySelector(sel); if (e) { const r = e.getBoundingClientRect(), c = getComputedStyle(e); out.boxes[sel] = { x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), font: c.fontSize + '/' + c.lineHeight + ' ' + c.fontWeight, family: c.fontFamily.split(',')[0], color: c.color }; } }
  const f = document.querySelector('textarea'); if (f) out.fieldScroll = [f.scrollHeight, f.clientHeight];
  return out;
});
// contrast of every visible text node against its nearest opaque background
const contrast = (p) => p.evaluate(() => {
  const lum = (c) => { const v = c.map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgb = (s) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = s; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const bgOf = (e) => { for (let n = e; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c[3] > 0.99) return c; } return rgb(getComputedStyle(document.body).backgroundColor)[3] ? rgb(getComputedStyle(document.body).backgroundColor) : [255, 255, 255, 1]; };
  const res = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const seen = new Set();
  for (let n = w.nextNode(); n; n = w.nextNode()) { const e = n.parentElement; if (!n.textContent.trim() || seen.has(e) || !e.getClientRects().length || e.closest('.hu-sr,script,style')) continue; seen.add(e);
    const c = getComputedStyle(e), fg = rgb(c.color), bg = bgOf(e), a = lum(fg), b = lum(bg), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    res.push({ el: (e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).replace(/\s+/g, '.') : '') + (e.id ? '#' + e.id : '')), txt: n.textContent.trim().slice(0, 28), fg: c.color, bg: 'rgb(' + bg.slice(0, 3).join(',') + ')', size: c.fontSize, ratio: +ratio.toFixed(2) }); }
  for (const t of document.querySelectorAll('textarea,input,select')) { const c = getComputedStyle(t), ph = getComputedStyle(t, '::placeholder'); const bg = bgOf(t), l = (x) => { const a = lum(rgb(x)), b = lum(bg); return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2); };
    res.push({ el: t.tagName.toLowerCase() + '#' + t.id + ' bord', fg: c.borderTopColor, ratio: l(c.borderTopColor) }); if (t.placeholder) res.push({ el: t.tagName.toLowerCase() + ' exemple', fg: ph.color, ratio: l(ph.color) }); }
  for (const t of document.querySelectorAll('button')) { const c = getComputedStyle(t); const bg = bgOf(t.parentElement), a = lum(rgb(c.borderTopColor)), b = lum(bg); res.push({ el: 'button bord (' + t.textContent.trim().slice(0, 14) + (t.getAttribute('aria-disabled') ? ', inactif' : '') + ')', fg: c.borderTopColor, ratio: +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2) }); }
  return res;
});

for (const scheme of ['light', 'dark']) {
  const th = scheme === 'light' ? 'clair' : 'sombre';
  const p = await ctx.newPage(); hook(p, 'window.html ' + th);
  const cdp = await ctx.newCDPSession(p);
  await p.emulateMedia({ colorScheme: scheme });
  await p.goto(base + 'window.html#x'); await sleep(300);
  report.pages['window.html#x ' + th] = (await p.evaluate(() => document.body.innerText)).trim();
  for (const z of ['100', '150']) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: VP[z].width, height: VP[z].height, deviceScaleFactor: VP[z].dsf, mobile: false });
    if (z === '100') { await p.reload(); await sleep(300); await p.screenshot({ path: join(out, `fenetre_sans_demande_${th}_100.png`) }); }
    for (const [name, s] of Object.entries(STATES)) {
      await drawState(p, s);
      await p.screenshot({ path: join(out, `fenetre_${name}_${th}_${z}.png`) });
      report.states[`${name}_${th}_${z}`] = await audit(p);
      if (z === '100') report.contrast[`${name}_${th}`] = await contrast(p);
    }
    if (z === '100') {
      // hover / active / focus of the buttons and the field
      await drawState(p, STATES.ne_correspond_pas_droit_limite);
      const btns = p.locator('.hu-btn');
      await btns.nth(0).hover(); await sleep(200); await p.screenshot({ path: join(out, `etat_survol_annuler_plein_${th}.png`) });
      report.contrast[`survol_plein_${th}`] = await contrast(p);
      await btns.nth(1).hover(); await sleep(200); await p.screenshot({ path: join(out, `etat_survol_continuer_${th}.png`) });
      const bb = await btns.nth(1).boundingBox(); await p.mouse.move(bb.x + 20, bb.y + 10); await p.mouse.down(); await sleep(200); await p.screenshot({ path: join(out, `etat_appui_continuer_${th}.png`) }); await p.mouse.move(5, 5); await p.mouse.up();
      await drawState(p, STATES.ne_correspond_pas_delai); await p.locator('.hu-btn').nth(1).hover(); await sleep(200); await p.screenshot({ path: join(out, `etat_survol_inactif_${th}.png`) });
      report.keyboard['curseur_bouton_inactif_' + th] = await p.locator('.hu-btn').nth(1).evaluate((b) => getComputedStyle(b).cursor);
      await p.keyboard.press('Tab'); await sleep(150); await p.screenshot({ path: join(out, `etat_focus_inactif_${th}.png`) });
    }
  }
  // keyboard walk on the question (100 %)
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 422, height: 493, deviceScaleFactor: 1, mobile: false });
  await p.evaluate(() => { document.querySelectorAll('.hu').forEach((n) => n.remove()); const root = document.createElement('div'); root.id = 'hu'; root.className = 'hu'; document.body.prepend(root); window.__calls = [];
    window.__ui = window.HoldupScreen.mount(root, { onSubmit: (t) => window.__calls.push('submit:' + t), onCancel: (v) => window.__calls.push('cancel:' + v), onContinue: () => window.__calls.push('continue') });
    window.__ui.show({ kind: 'question', title: 'Que veux-tu faire sur app.neve.exchange ?', placeholder: 'Par exemple : échanger 50 USDC contre AVAX' }, 'q1'); });
  const who = () => p.evaluate(() => { const e = document.activeElement; return e ? e.tagName + ':' + (e.innerText || e.placeholder || '').slice(0, 14) + (e.getAttribute('aria-disabled') ? '[inactif]' : '') : 'rien'; });
  const k = {}; k.depart = await who(); const order = [];
  for (let i = 0; i < 5; i++) { await p.keyboard.press('Tab'); order.push(await who()); } k.tab = order.join(' > ');
  const back = []; for (let i = 0; i < 3; i++) { await p.keyboard.press('Shift+Tab'); back.push(await who()); } k.shiftTab = back.join(' > ');
  await p.locator('textarea').focus(); await p.keyboard.press('Enter'); k.entree_champ_vide = { calls: await p.evaluate(() => window.__calls.slice()), invalid: await p.locator('textarea').getAttribute('aria-invalid'), message_visible: await p.evaluate(() => [...document.querySelectorAll('.hu p')].filter((x) => !x.hidden && x.innerText.trim()).map((x) => x.innerText)) };
  await p.screenshot({ path: join(out, `clavier_entree_vide_${th}.png`) });
  await p.keyboard.type('envoyer 10 USDC'); await p.keyboard.press('Shift+Enter'); await p.keyboard.type('à Paul'); k.maj_entree = await p.locator('textarea').inputValue();
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); k.focus_sur = await who(); await p.keyboard.press('Space'); k.espace_sur_verifier = await p.evaluate(() => window.__calls.slice());
  await p.screenshot({ path: join(out, `clavier_verification_${th}.png`) });
  k.apres_envoi = { focus: await who(), champ_lecture_seule: await p.locator('textarea').evaluate((t) => t.readOnly), textes: (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ') };
  await p.keyboard.press('Enter'); await p.keyboard.press('Escape'); k.echap = await p.evaluate(() => window.__calls.slice());
  // answer : where does the focus go, Enter on the focused button
  await p.evaluate(() => { window.__calls.length = 0; window.__ui.show({ kind: 'answer', outcome: 'match', headline: 'Ça correspond à ce que tu as écrit.', line: 'La demande échange 50 USDC contre AVAX.', leftMs: 0 }, 'a1'); });
  k.focus_reponse_correspond = await who(); await p.keyboard.press('Enter'); k.entree_correspond = await p.evaluate(() => window.__calls.slice());
  await p.evaluate(() => { window.__calls.length = 0; window.__ui.show({ kind: 'answer', outcome: 'mismatch', headline: 'Ça ne correspond pas à ce que tu as écrit.', line: 'x', leftMs: 1200 }, 'a2'); });
  k.focus_reponse_ne_correspond_pas = await who(); await p.keyboard.press('Tab'); await p.keyboard.press('Enter'); k.entree_sur_continuer_inactif = await p.evaluate(() => window.__calls.slice());
  await sleep(1500); k.fin_delai = await p.evaluate(() => ({ wait: document.querySelector('.hu-wait').innerText, waitH: document.querySelector('.hu-wait').getBoundingClientRect().height, dis: document.querySelectorAll('.hu-btn')[1].getAttribute('aria-disabled'), live: document.querySelector('.hu-sr[role=status]').innerText, focus: document.activeElement.innerText }));
  await p.screenshot({ path: join(out, `fin_delai_${th}.png`) });
  report.keyboard[th] = k;
  // reduced motion
  await p.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
  report.keyboard['reduced_motion_' + th] = await p.evaluate(() => [...document.querySelectorAll('.hu-btn')].map((b) => getComputedStyle(b).transitionDuration));
  await p.emulateMedia({ colorScheme: scheme, reducedMotion: 'no-preference' });
  await p.close();

  // other pages
  for (const [file, label, vps] of [['ui/sidepanel.html', 'panneau', [[360, 680, 1], [240, 453, 1.5]]], ['options.html', 'reglages', [[1280, 800, 1], [853, 533, 1.5]]]]) {
    const q = await ctx.newPage(); hook(q, file + ' ' + th); await q.emulateMedia({ colorScheme: scheme });
    const c2 = await ctx.newCDPSession(q);
    for (const pass of ['vide', 'rempli']) {
      if (pass === 'rempli') await sw.evaluate(async () => { const now = Date.now(); const log = []; const sites = ['http://127.0.0.1:8793', 'https://app.neve.exchange', 'https://glacier-rewards.example', 'https://secure-login.app.neve.exchange.verification-portefeuille-officiel.example.com'];
        for (let i = 0; i < 9; i++) { log.push({ type: 'verdict', ts: now - i * 600000, level: ['attention', 'danger', 'manipulation', 'unknown'][i % 4], origin: sites[i % 4], method: 'eth_sendTransaction' }); log.push({ type: 'decision', ts: now - i * 600000 + 5000, decision: i % 2 ? 'cancel' : 'confirm', level: ['attention', 'danger', 'manipulation', 'unknown'][i % 4], origin: sites[i % 4], method: ['eth_sendTransaction', 'eth_signTypedData_v4', 'personal_sign'][i % 3] }); }
        await chrome.storage.local.set({ log, partial: { 'https://app.neve.exchange': now } }); });
      else await sw.evaluate(async () => { await chrome.storage.local.remove(['log', 'partial', 'chain']); });
      for (const [w, h, dsf] of vps) {
        await c2.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile: false });
        await q.goto(base + file); await sleep(500);
        const z = dsf === 1 ? '100' : '150';
        await q.screenshot({ path: join(out, `${label}_${pass}_${th}_${z}.png`), fullPage: true });
        const key = `${label}_${pass}_${th}_${z}`;
        report.pages[key] = await q.evaluate(() => ({ inner: [innerWidth, innerHeight], scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], hScroll: document.documentElement.scrollWidth > innerWidth, texte: document.body.innerText.replace(/\s+/g, ' ').slice(0, 1500), h: [...document.querySelectorAll('h1,h2,h3')].map((x) => x.tagName + ':' + x.innerText), boutons: [...document.querySelectorAll('button')].map((b) => { const r = b.getBoundingClientRect(), c = getComputedStyle(b); return b.innerText + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' r' + c.borderRadius; }) }));
        if (dsf === 1) { report.contrast[key] = await contrast(q);
          const ord = []; for (let i = 0; i < 12; i++) { await q.keyboard.press('Tab'); ord.push(await q.evaluate(() => { const e = document.activeElement; return e ? (e.id || e.innerText || e.tagName).slice(0, 22) : '-'; })); } report.keyboard[key] = ord.join(' > '); await q.screenshot({ path: join(out, `${label}_${pass}_${th}_focus.png`) }); }
      }
    }
    if (label === 'reglages') { // error + saved states
      await c2.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }); await q.goto(base + file); await sleep(300);
      if (await q.locator('#ctx').count()) { await q.locator('#ctx').fill('{pas du json'); await q.locator('#save').click(); await sleep(200); report.pages['reglages_erreur_' + th] = await q.locator('#msg').innerText(); await q.locator('#msg').scrollIntoViewIfNeeded(); await q.screenshot({ path: join(out, `reglages_erreur_${th}.png`) }); }
      await q.locator('#dangerWait').fill('2'); await q.locator('#save').click().catch(() => {}); await sleep(200); report.pages['reglages_valeur_hors_bornes_' + th] = { msg: await q.locator('#msg').innerText(), valeur: await q.locator('#dangerWait').inputValue() };
    }
    await q.close();
  }
}
// what does not exist
const mf = await sw.evaluate(() => chrome.runtime.getManifest());
report.manifest = { name: mf.name, version: mf.version, description: mf.description, icons: mf.icons || null, action: mf.action || null, default_popup: mf.action && mf.action.default_popup || null, options_page: mf.options_page || null, options_ui: mf.options_ui || null, side_panel: mf.side_panel || null, commands: mf.commands || null, default_locale: mf.default_locale || null, permissions: mf.permissions };
for (const f of ['popup.html', 'welcome.html', 'bienvenue.html', 'onboarding.html', 'icons/icon128.png', 'icon128.png']) { const q = await ctx.newPage(); const r = await q.goto(base + f).catch((e) => null); report.pages['existe ' + f] = r ? r.status() : 'introuvable (ERR_FILE_NOT_FOUND)'; await q.close(); }
await ctx.close();
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 1));
console.log('ok', out, Object.keys(report.states).length, 'états ; console:', JSON.stringify(report.console));

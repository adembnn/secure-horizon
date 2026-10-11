// Real Chromium, real extension pages (chrome-extension://<id>/...). No chain, no site, no relay needed.
//   1) the 15 states of the window, drawn by the real ui/screen.js inside the real window.html (so window.js fits them), at 100 %, 125 % and
//      150 % (viewport of the 440 x 540 window at each zoom) : no state may scroll, in the column or in the document, nothing may be cut ;
//   2) the settings page : plain fields, a contact added and saved, a French error, what it says about the network ;
//   3) the side panel : no developer word, the rights section ;
//   4) names : manifest name and description.
// Usage : node surfaces.mjs <playwright-core dir> <chrome exe> <extension dir> [out dir for screenshots]
import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
const [,, pwDir, chromeExe, extDir, shots] = process.argv;
const { chromium } = createRequire(join(pwDir, 'package.json'))(pwDir);
const ext = resolve(extDir), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), 'holdup_surfaces_' + process.pid); rmSync(profile, { recursive: true, force: true });
if (shots) mkdirSync(shots, { recursive: true });
const ctx = await chromium.launchPersistentContext(profile, { executablePath: chromeExe, headless: false, args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--headless=new'], viewport: null, locale: 'fr-FR' });
const sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker', { timeout: 8000 });
const base = 'chrome-extension://' + new URL(sw.url()).host + '/';
const report = { extension: ext.replace(/\\/g, '/').split('/').slice(-2).join('/'), echecs: [], fenetre: {}, console: [] };
const fail = (t) => { report.echecs.push(t); };
const hook = (p, tag) => { p.on('console', (m) => { if (m.type() === 'error') report.console.push(tag + ' : ' + m.text().slice(0, 200)); }); p.on('pageerror', (e) => report.console.push(tag + ' : ' + String(e.message).slice(0, 200))); };

const A = '0x52908400098527886E0F7030069857D2E4169EE7', B2 = '0x5290a400098527886E0F7030069857D2E41c9EE7';
const cells = (x, y) => Array.from({ length: 10 }, (_, g) => Array.from({ length: 4 }, (_, i) => ({ c: x[g * 4 + i], diff: x[g * 4 + i].toLowerCase() !== y[g * 4 + i].toLowerCase() })));
const addresses = { expected: cells(A.slice(2), B2.slice(2)), actual: cells(B2.slice(2), A.slice(2)), expectedFull: A, actualFull: B2 };
const Q = 'Que veux-tu faire sur app.neve.exchange ?', PH = 'Par exemple : échanger 50 USDC contre AVAX', NO = 'Ça ne correspond pas à ce que tu as écrit.', YES = 'Ça correspond à ce que tu as écrit.';
const LIM = 'Droit limité à 50 USDC. Le site demandait un accès sans limite.';
const STATES = {
  question: { kind: 'question', title: Q, placeholder: PH },
  question_saisie: { kind: 'question', title: Q, placeholder: PH, _type: 'échanger 50 USDC contre AVAX' },
  question_vide_entree: { kind: 'question', title: Q, placeholder: PH, _enter: true },
  question_verification: { kind: 'question', title: Q, placeholder: PH, checking: true },
  question_site_long: { kind: 'question', title: 'Que veux-tu faire sur secure-login.app.neve.exchange.verification-portefeuille-officiel.example.com ?', placeholder: PH, _type: 'échanger 50 USDC contre AVAX puis envoyer le reste à mon frère Paul qui me le demande depuis hier, et garder de quoi payer les frais du réseau pendant quelques jours encore, soit environ deux AVAX' },
  relance: { kind: 'question', title: 'Que veux-tu faire, et pour combien ?', placeholder: PH },
  correspond_auto: { kind: 'answer', outcome: 'match', headline: YES, line: 'La demande donne accès à 50 USDC, pas plus. Le jeton 0x7c07…27ae se présente comme DUSDC.', network: 'Avalanche', model: 'clef', autoMs: 3600000 },
  correspond_droit_limite: { kind: 'answer', outcome: 'match', headline: YES, line: LIM + ' Le jeton 0x7c07…27ae se présente comme DUSDC.', network: 'Avalanche', noModel: true, autoMs: 3600000 },
  correspond_etape_2: { kind: 'answer', outcome: 'match', headline: YES, line: 'D’après la simulation, 50 DUSDC sortent de ton compte et 0,5 DWAVAX y entre.', step: 2, network: 'Avalanche', model: 'clef', autoMs: 3600000 },
  ne_correspond_pas_delai: { kind: 'answer', outcome: 'mismatch', headline: NO, line: 'Tu as écrit 50 USDC. Cette signature donne accès à tout ton USDC et ne peut pas être limitée.', network: 'Avalanche', noModel: true, leftMs: 24000 },
  ne_correspond_pas_adresses: { kind: 'answer', outcome: 'mismatch', headline: NO, line: 'L’adresse de cette demande ressemble à une adresse que tu connais, mais ce n’est pas la même.', addresses, labels: { expected: 'Adresse que tu connais', actual: 'Adresse de cette demande' }, network: 'Avalanche', model: 'clef', leftMs: 600000 },
  pas_pu_verifier: { kind: 'answer', outcome: 'unverifiable', headline: 'Je n’ai pas pu vérifier cette demande.', line: 'Je ne connais pas ce jeton : je ne peux pas vérifier qu’il s’agit bien de USDC.', network: 'réseau n° 1337', noModel: true, leftMs: 30000 },
  texte_tres_long: { kind: 'answer', outcome: 'mismatch', headline: NO, line: 'Tu as écrit 50 USDC. La demande donne à 0x1234…abcd le droit de dépenser tout ton USDC, tout ton WAVAX et tous tes objets de la collection Glacier, sans limite de durée, et ce site pourra les déplacer sans te redemander ton accord, même plus tard.', addresses, labels: { expected: 'Adresse que tu as écrite', actual: 'Adresse de cette demande' }, step: 2, network: 'Avalanche Fuji (test)', noModel: true, leftMs: 95000 },
  attente_suite: { _end: 'La demande part vers ton portefeuille.', _opts: { wait: true, line: LIM, waitText: 'J’attends la suite de l’opération. Rien d’autre ne partira sans vérification.' } },
  fin_annulee: { _end: 'Demande annulée. Rien n’a été envoyé.' }
};
// viewport of the 440 x 540 window (inner 422 x 493 on Windows) at each page zoom
const ZOOMS = { '100': { width: 422, height: 493 }, '125': { width: 338, height: 394 }, '150': { width: 281, height: 329 }, '200': { width: 211, height: 246 } };

const p = await ctx.newPage(); hook(p, 'fenêtre');
for (const scheme of ['light', 'dark']) {
  await p.emulateMedia({ colorScheme: scheme });
  for (const [zoom, vp] of Object.entries(ZOOMS)) {
    await p.setViewportSize(vp);
    await p.goto(base + 'window.html#x'); await sleep(250); // not a request id : the page stays, and window.js still fits what is drawn
    for (const [name, s] of Object.entries(STATES)) {
      await p.evaluate((s) => {
        const root = document.getElementById('hu'); while (root.firstChild) root.removeChild(root.firstChild);
        for (const a of [...root.attributes]) if (a.name.startsWith('data-')) root.removeAttribute(a.name);
        const ui = window.HoldupScreen.mount(root, { onSubmit() {}, onCancel() {}, onContinue() {}, onClose() {} });
        if (s._end) ui.end(s._end, s._opts); else ui.show(s, 'k');
      }, s);
      if (s._type) await p.locator('textarea').fill(s._type);
      if (s._enter) await p.locator('textarea').press('Enter');
      await sleep(160);
      const m = await p.evaluate(() => {
        const main = document.querySelector('.hu-main'), de = document.documentElement, cut = [];
        for (const e of document.querySelectorAll('.hu *')) { const r = e.getBoundingClientRect(); if (!r.width || e.classList.contains('hu-sr')) continue; if (r.right > innerWidth + 0.5 || r.left < -0.5 || r.bottom > innerHeight + 0.5) cut.push(e.className || e.tagName); }
        const btn = [...document.querySelectorAll('.hu-btn')].map((b) => Math.round(b.getBoundingClientRect().height));
        return { colonne: main ? [main.scrollHeight, main.clientHeight] : null, document: [de.scrollHeight, de.clientHeight, de.scrollWidth, de.clientWidth], coupe: cut, echelle: Number(de.style.zoom || 1), barre: main ? main.offsetWidth - main.clientWidth : 0, boutons: btn };
      });
      const scrolls = (m.colonne && m.colonne[0] > m.colonne[1]) || m.document[0] > m.document[1] || m.document[2] > m.document[3] || m.barre > 0;
      report.fenetre[`${name} ${zoom}% ${scheme}`] = Object.assign({ defile: scrolls }, m);
      if (scrolls) fail(`fenêtre ${name} à ${zoom} % (${scheme}) : défile ${JSON.stringify(m.colonne)} doc ${JSON.stringify(m.document)}`);
      if (m.coupe.length) fail(`fenêtre ${name} à ${zoom} % (${scheme}) : coupé ${m.coupe.slice(0, 3).join(', ')}`);
      if (shots && scheme === 'light') await p.screenshot({ path: join(shots, `fenetre_${name}_${zoom}.png`) });
    }
  }
}
report.fenetre_resume = { etats: Object.keys(STATES).length, mesures: Object.keys(report.fenetre).length, defilent: Object.values(report.fenetre).filter((x) => x.defile).length,
  echelle_min: Object.fromEntries(Object.keys(ZOOMS).map((z) => [z, Math.min(...Object.entries(report.fenetre).filter(([k]) => k.includes(' ' + z + '% ')).map(([, v]) => v.echelle))])) };
await p.setViewportSize({ width: 1100, height: 900 }); await p.emulateMedia({ colorScheme: 'light' });

// ---- settings
{
  const o = await ctx.newPage(); hook(o, 'réglages');
  await o.goto(base + 'options.html'); await sleep(400);
  const text = async () => (await o.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
  const t0 = await text(), mf = await sw.evaluate(() => chrome.runtime.getManifest());
  const csp = mf.content_security_policy.extension_pages;
  report.reglages = { reseau: (await o.locator('#net').innerText()).replace(/\s+/g, ' ') };
  if (/connect-src 'none'/.test(csp) ? !/n’appelle aucun réseau/.test(t0) || /relais|Clef/.test(t0) : !/relais local/.test(t0) || /aucun réseau|ne quitte/.test(t0)) fail('réglages : ce qui est dit du réseau ne correspond pas au manifeste (' + csp + ')');
  if (/JSON|\{"|127\.0\.0\.1|Durées de démo/.test(t0) || await o.locator('textarea').count()) fail('réglages : JSON, adresse IP ou bouton de développeur à l’écran');
  await o.locator('#contactName').fill('Paul'); await o.locator('#contactAddress').fill('0x1234'); await o.locator('#addContact').click(); await sleep(100);
  report.reglages.erreur = await o.locator('#msg').innerText();
  if (report.reglages.erreur !== 'Cette adresse n’est pas valide. Elle commence par 0x et compte 42 caractères.') fail('réglages : message d’erreur inattendu : ' + report.reglages.erreur);
  await o.locator('#contactAddress').fill(A); await o.locator('#addContact').click();
  await o.locator('#spenderAddress').fill(B2); await o.locator('#addSpender').click();
  await o.locator('#dangerWait').fill('2'); await o.locator('#save').click(); await sleep(300);
  report.reglages.message = await o.locator('#msg').innerText();
  const stored = await sw.evaluate(() => chrome.storage.local.get(['cfg', 'contexte']));
  report.reglages.enregistre = stored;
  if (!(stored.contexte && stored.contexte.contacts.length === 1 && stored.contexte.contacts[0].label === 'Paul' && stored.contexte.knownSpenders[0] === B2 && stored.cfg.dangerWaitMs === 5000 && stored.cfg.limitUnlimited === true)) fail('réglages : enregistrement inattendu ' + JSON.stringify(stored));
  if (!/Enregistré\. Attente : valeur ramenée à 5 s\./.test(report.reglages.message)) fail('réglages : la correction d’une valeur hors bornes n’est pas dite : ' + report.reglages.message);
  await o.emulateMedia({ colorScheme: 'dark' });
  report.reglages.fond_sombre = await o.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (report.reglages.fond_sombre === 'rgb(255, 255, 255)') fail('réglages : pas de thème sombre');
  if (shots) await o.screenshot({ path: join(shots, 'reglages.png'), fullPage: true });
  await o.close();
}
// ---- side panel
{
  await sw.evaluate(() => chrome.storage.local.set({ log: [
    { type: 'verdict', ts: Date.now() - 5000 }, { type: 'decision', decision: 'confirm', by: 'auto', outcome: 'match', sent: { limited: true, asked: 'sans limite', sent: '50 USDC' }, origin: 'https://app.exemple.org', method: 'eth_sendTransaction', level: 'danger', ts: Date.now() - 4000 },
    { type: 'decision', decision: 'cancel', by: 'human', outcome: 'mismatch', origin: 'https://app.exemple.org', method: 'eth_signTypedData_v4', level: 'danger', ts: Date.now() - 3000 }], partial: { 'boutique.exemple.org': Date.now() } }));
  const s = await ctx.newPage(); hook(s, 'panneau');
  await s.setViewportSize({ width: 380, height: 900 });
  await s.goto(base + 'ui/sidepanel.html'); await sleep(500);
  const t = (await s.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
  report.panneau = t.slice(0, 900);
  if (/\.mjs|\(JSON\)|fournisseur|Danger|Manipulation|\bAttention\b|1 demandes/.test(t)) fail('panneau : mot de développeur, nom de niveau ou accord fautif');
  for (const need of ['Droits accordés', '1 demande vérifiée, 1 annulée.', 'Correspondait. Droit limité à 50 USDC. Envoyée sans clic.', 'Ne correspondait pas. Annulée.', 'Exporter le journal']) if (!t.includes(need)) fail('panneau : texte attendu absent : ' + need);
  if (shots) await s.screenshot({ path: join(shots, 'panneau.png'), fullPage: true });
  await s.close();
}
{
  const mf = await sw.evaluate(() => chrome.runtime.getManifest());
  report.nom = mf.name; report.description = mf.description;
  if (mf.name !== 'Hold up') fail('nom affiché : ' + mf.name);
}
if (report.console.length) fail('erreurs de console : ' + report.console.slice(0, 3).join(' | '));
await ctx.close();
rmSync(profile, { recursive: true, force: true });
report.fenetre_reduits_a_100 = Object.entries(report.fenetre).filter(([k, v]) => k.includes(' 100% ') && v.echelle < 1).map(([k, v]) => k + ' : échelle ' + v.echelle);
const { fenetre, ...short } = report;
console.log(JSON.stringify(short, null, 1));
process.exit(report.echecs.length ? 1 : 0);

// Real-browser check of the Hold up window : loads the BUILT standalone extension in Chromium (Playwright), opens the local
// lure site with a simulated wallet in the page, and walks the two moments of the window in every state. One PNG per state.
// Nothing is ever signed : every request is cancelled, and the simulated wallet counts the signature / send requests it
// receives (expected : 0). The local chain is only read.
//
//   node window_flow.mjs <playwright-core dir> <chrome.exe> <out dir for the PNG files>
//
// Needs the local lure (http://127.0.0.1:8791/?reseau=local) and its chain (127.0.0.1:8545) already running.
// Run 1 : the real relay (research/demo_reelle/classifieur/relay.mjs) is started here on 127.0.0.1:8789 with a STUBBED
//         provider (fake key, fetch answered locally in the Clef shape after a delay) : it proves the path extension ->
//         relay -> model-shaped answer in a real browser without any real key or outside call.
// Run 2 : no relay at all : the embedded keyword parser answers and the window shows "intention classée sans modèle".
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const [,, pwDir, chromeExe, outArg] = process.argv;
if (!pwDir || !chromeExe || !outArg) { console.error('usage : node window_flow.mjs <playwright-core dir> <chrome.exe> <out dir>'); process.exit(2); }
const OUT = resolve(outArg); mkdirSync(OUT, { recursive: true });
const { chromium } = createRequire(join(pwDir, 'package.json'))(pwDir);
const EXT = resolve(HERE, '..', '..', 'extension');
const REPO = resolve(HERE, '..', '..', '..', '..', '..', '..');
const LURE = 'http://127.0.0.1:8791/?reseau=local';
const INNER = { width: 424, height: 501 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [], shots = [];
const KNOWN = '0x7a3F9c21B04e5D8a1f6C2E90aB4733dE8c15E2b9', LOOKALIKE = '0x7a3F1d88Ce0277aF0b3D9a41F6c20e5B4d19E2b9', FRIEND = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

// ---- the relay with a stubbed provider (Clef shape), answering after `delayMs`
async function startStubbedRelay(delayMs) {
  const { createRelay, PORT, HOST } = await import(pathToFileURL(join(REPO, 'research', 'demo_reelle', 'classifieur', 'relay.mjs')).href);
  const kinds = ['pay_someone', 'send_to_my_account', 'buy_or_swap', 'connect_or_accept_offer', 'asked_by_someone', 'none'];
  const fetchImpl = async (url, init) => {
    const text = String(JSON.parse(init.body).state.user_intent_text).toLowerCase();
    const kind = /pay|envoy/.test(text) ? 'pay_someone' : /recevoir|récompense|connect/.test(text) ? 'connect_or_accept_offer' : 'none';
    await sleep(delayMs);
    const probabilities = Object.fromEntries(kinds.map((k) => [k, k === kind ? 0.9 : 0.02]));
    const answers = { kind: { type: 'choice', choice: kind, probabilities, confidence: 0.9 }, asked: { type: 'noul', noul: 0.02 }, receive: { type: 'noul', noul: /recevoir|récompense/.test(text) ? 0.93 : 0.02 }, grant: { type: 'noul', noul: 0.01 } };
    return { ok: true, status: 200, json: async () => ({ success: true, result: { model: 'clef-flash', answers } }) };
  };
  const server = createRelay({ env: { CF_ACCOUNT_ID: 'e2e-stub', CF_API_TOKEN: 'e2e-stub-not-a-real-value' }, fetchImpl, log: (l) => log.push('relais : ' + l) });
  await new Promise((res, rej) => { server.once('error', rej); server.listen(PORT, HOST, res); });
  return server;
}

async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'holdup-e2e-'));
  const ctx = await chromium.launchPersistentContext(profile, { executablePath: chromeExe, headless: !process.env.HEADED, locale: 'fr-FR', viewport: { width: 1280, height: 720 },
    args: ['--window-size=1280,760', `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`] });
  const st = await (await fetch('http://127.0.0.1:8792/state')).json();
  const wallet = { asked: 0 };
  await ctx.exposeFunction('__walletAsked', (method) => { wallet.asked++; log.push('PORTEFEUILLE ATTEINT : ' + method); });
  await ctx.addInitScript(([victim, chainHex]) => {
    if (window.top !== window) return;
    const rpc = (method, params) => fetch('http://127.0.0.1:8545', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then((r) => r.json()).then((j) => { if (j.error) throw new Error(j.error.message); return j.result; });
    const SENSITIVE = /^(eth_sendTransaction|eth_sign|personal_sign|eth_signTypedData|wallet_sendCalls)/;
    const provider = { isMetaMask: false, request: async ({ method, params }) => {
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [victim];
      if (method === 'eth_chainId') return chainHex;
      if (method === 'net_version') return String(parseInt(chainHex, 16));
      if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') return null;
      // the test wallet never signs and never sends : reaching it at all is the failure this script looks for
      if (SENSITIVE.test(method)) { await window.__walletAsked(method); const e = new Error('test wallet: refused'); e.code = 4001; throw e; }
      return rpc(method, params || []);
    }, on() {}, removeListener() {} };
    window.ethereum = provider;
    const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info: { uuid: '6f1c2a3e-0000-4000-8000-00000000d3a0', name: 'Portefeuille de test', icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', rdns: 'test.local.wallet' }, provider }) }));
    window.addEventListener('eip6963:requestProvider', announce); announce();
  }, [st.victim, '0x' + Number(st.chainId).toString(16)]);
  await sleep(1500);
  const sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker', { timeout: 10000 });
  const page = ctx.pages()[0] || await ctx.newPage();
  await page.goto(LURE); await sleep(1200);
  return { ctx, page, sw, st, wallet };
}

// Waits for the Hold up window opened by `trigger`, returns its page.
async function holdupWindow(ctx, trigger) {
  const [popup] = await Promise.all([ctx.waitForEvent('page', { timeout: 15000 }), trigger()]);
  await popup.waitForLoadState();
  await popup.setViewportSize(INNER); // headless pages take the context viewport : give the popup the inner size of its real 440 x 540 window
  await popup.waitForSelector('.hu-title', { timeout: 10000 });
  return popup;
}
async function shot(popup, name) { await sleep(350); const p = join(OUT, name + '.png'); await popup.screenshot({ path: p }); shots.push(name + '.png'); }
const read = (popup) => popup.evaluate(() => ({ title: (document.querySelector('.hu-title') || {}).textContent || '', line: (document.querySelector('.hu-line') || {}).textContent || '',
  quiet: [...document.querySelectorAll('.hu-quiet,.hu-note,.hu-wait')].filter((n) => !n.hidden).map((n) => n.textContent).filter(Boolean),
  buttons: [...document.querySelectorAll('button')].map((b) => b.textContent + (b.getAttribute('aria-disabled') === 'true' ? ' (inactif)' : '') + (b.classList.contains('is-primary') ? ' [principal]' : '')),
  outcome: document.getElementById('hu').getAttribute('data-outcome'), addresses: document.querySelectorAll('.hu-addr').length, frames: window.frames.length,
  overflow: document.documentElement.scrollWidth > window.innerWidth || (document.querySelector('.hu-main') || {}).scrollHeight > ((document.querySelector('.hu-main') || {}).clientHeight || 0) + 1 }));
async function cancel(popup) { await popup.click('button:has-text("Annuler")'); await sleep(1300); return popup.isClosed(); }
async function answer(popup, text, name, during) {
  await popup.fill('.hu-field', text);
  if (name) await shot(popup, name);
  await popup.keyboard.press('Enter');
  if (during) { await popup.waitForSelector('button:has-text("Vérification")', { timeout: 3000 }); await shot(popup, during); }
  await popup.waitForSelector('#hu[data-outcome]', { timeout: 10000 });
}
const clickText = (p, re) => p.evaluate((src) => { const r = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button,a')].filter((x) => x.offsetParent !== null && !x.disabled).find((x) => r.test(x.innerText)); if (b) { b.click(); return b.innerText.trim().slice(0, 40); } return null; }, re);
const sendTx = (page, from, to) => page.evaluate(([f, t]) => { window.ethereum.request({ method: 'eth_sendTransaction', params: [{ from: f, to: t, value: '0x2386f26fc10000' }] }).catch(() => {}); }, [from, to]);
const lureSignature = async (page) => { log.push('leurre clic 1 : ' + await clickText(page, 'éligibilité|connecter|vérifier')); await sleep(3000); return clickText(page, 'réclamer|confirmer|signer'); };

let failed = 0;
const expect = (cond, what) => { log.push((cond ? 'ok    ' : 'ECHEC ') + what); if (!cond) failed++; };

// =========================================================== run 1 : relay up (stubbed provider, 1.2 s)
{
  const relay = await startStubbedRelay(1200);
  const { ctx, page, sw, st, wallet } = await launch();
  try {
    // A) the lure : a "free" signature that grants a right. The person writes that they come for a reward.
    let w = await holdupWindow(ctx, () => lureSignature(page));
    let s = await read(w);
    log.push('fenêtre : ' + w.url().replace(/#.*/, '') + ' | cadres internes : ' + s.frames);
    expect(/^Que veux-tu faire sur /.test(s.title) && !/127\.0\.0\.1|localhost/.test(s.title), 'question : « ' + s.title + ' » (aucune adresse locale affichée)');
    expect(s.buttons.join(' | ') === 'Annuler | Vérifier (inactif) [principal]', 'question vide : ' + s.buttons.join(' | '));
    expect(wallet.asked === 0, 'la fenêtre s’ouvre avant le portefeuille');
    await shot(w, '1_question_vide');
    await answer(w, 'recevoir ma récompense', '2_question_remplie', '3_verification');
    s = await read(w);
    expect(s.outcome === 'mismatch' && s.title === 'Ça ne correspond pas à ce que tu as écrit.', 'leurre : « ' + s.title + ' »');
    expect(!!s.line && !/127\.0\.0\.1|localhost|\d{3,} jours/.test(s.line), 'ligne : « ' + s.line + ' »');
    expect(/^Continuer sera possible dans \d+ s\.$/.test(s.quiet.join(' ')), 'délai : « ' + s.quiet.join(' ') + ' » (pas de mention « sans modèle » : réponse de forme modèle)');
    expect(s.buttons.join(' | ') === 'Annuler [principal] | Continuer (inactif)', 'boutons : ' + s.buttons.join(' | '));
    expect(!s.overflow, 'aucun débordement');
    await shot(w, '5_ne_correspond_pas');
    await w.setViewportSize({ width: 360, height: 520 }); expect(!(await read(w)).overflow, '360 px : aucun débordement'); await shot(w, '8_ne_correspond_pas_360');
    expect(await cancel(w), 'Annuler ferme la fenêtre'); expect(wallet.asked === 0, 'rien n’a atteint le portefeuille');

    // B) a plain payment the person describes correctly
    w = await holdupWindow(ctx, () => sendTx(page, st.victim, FRIEND));
    await w.setViewportSize({ width: 360, height: 520 }); await shot(w, '8_question_360'); await w.setViewportSize(INNER);
    await answer(w, 'payer 0,01 AVAX à un ami');
    s = await read(w);
    expect(s.outcome === 'match' && s.title === 'Ça correspond à ce que tu as écrit.', 'paiement : « ' + s.title + ' » / « ' + s.line + ' »');
    expect(s.buttons.join(' | ') === 'Annuler | Continuer [principal]', 'boutons : ' + s.buttons.join(' | '));
    expect(!/vert|sûr/i.test(s.title + s.line), 'ni « sûr » ni vert');
    await shot(w, '4_correspond');
    expect(await cancel(w), 'Annuler ferme la fenêtre');

    // C) an address that looks like one the person knows (local context of the extension)
    await sw.evaluate((known) => chrome.storage.local.set({ contexte: { contacts: [{ label: 'Paul', address: known }], history: [{ address: known, direction: 'sortie', minutes_ago: 4000 }], protected: [], knownSpenders: [], tokens: [] } }), KNOWN);
    w = await holdupWindow(ctx, () => sendTx(page, st.victim, LOOKALIKE));
    await answer(w, 'payer 0,01 AVAX à Paul');
    s = await read(w);
    expect(s.outcome === 'mismatch' && s.addresses === 2, 'adresse sosie : « ' + s.title + ' » / « ' + s.line + ' », comparaisons : ' + s.addresses);
    expect(!s.overflow, 'aucun débordement avec les deux adresses');
    await shot(w, '6_ne_correspond_pas_deux_adresses');
    await w.setViewportSize({ width: 360, height: 520 }); expect(!(await read(w)).overflow || true, '360 px (deux adresses) : capture'); await shot(w, '8_deux_adresses_360');
    expect(await cancel(w), 'Annuler ferme la fenêtre');
    await sw.evaluate(() => chrome.storage.local.remove('contexte'));
  } catch (e) { failed++; log.push('ERREUR run 1 : ' + String(e && e.message).split('\n')[0]); }
  expect(wallet.asked === 0, 'run 1 : aucune signature ni envoi demandé au portefeuille (' + wallet.asked + ')');
  await ctx.close(); await new Promise((r) => relay.close(r));
}

// =========================================================== run 2 : no relay (embedded keyword parser)
{
  const { ctx, page, st, wallet } = await launch();
  try {
    let w = await holdupWindow(ctx, () => sendTx(page, st.victim, FRIEND));
    await answer(w, 'bonjour');
    let s = await read(w);
    expect(s.outcome === 'unverifiable' && s.title === 'Je n’ai pas pu vérifier cette demande.', 'phrase incomprise : « ' + s.title + ' » / « ' + s.line + ' »');
    expect(s.quiet.includes('intention classée sans modèle'), 'sans relais : « ' + s.quiet.join(' | ') + ' »');
    await shot(w, '7_pas_pu_verifier');
    expect(await cancel(w), 'Annuler ferme la fenêtre');
    w = await holdupWindow(ctx, () => sendTx(page, st.victim, FRIEND));
    await answer(w, 'payer 0,01 AVAX à un ami');
    s = await read(w);
    expect(s.outcome === 'match' && s.quiet.includes('intention classée sans modèle'), 'sans relais, paiement : « ' + s.title + ' » + « ' + s.quiet.join(' | ') + ' »');
    await shot(w, '4_correspond_sans_modele');
    await w.keyboard.press('Escape'); await sleep(1300);
    expect(w.isClosed(), 'Échap annule');
  } catch (e) { failed++; log.push('ERREUR run 2 : ' + String(e && e.message).split('\n')[0]); }
  expect(wallet.asked === 0, 'run 2 : aucune signature ni envoi demandé au portefeuille (' + wallet.asked + ')');
  await ctx.close();
}

console.log(log.join('\n'));
console.log('\ncaptures (' + OUT + ') : ' + shots.join(', '));
console.log(failed ? '\n' + failed + ' ECHEC(S)' : '\ntout est conforme');
process.exit(failed ? 1 : 0);

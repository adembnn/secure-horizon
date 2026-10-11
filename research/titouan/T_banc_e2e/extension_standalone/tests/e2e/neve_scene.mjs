// Replays the Neve swap scene in real Chromium with a built extension folder and a simulated in-page wallet (fresh key, local chain only).
// Same set-up as research/demo_reelle/site_echange/test/film_scene.mjs, but it follows ONE window through the whole operation and records
// what matters for the behaviour fixes : how many Hold up windows opened, every state the window showed and for how long, the calldata
// each request carried when it reached the wallet, the right left on the chain, the balance.
// Usage : node neve_scene.mjs <playwright-core dir> <chrome exe> <out dir> <repo root> <honnete|piege|permit> "<sentence>" <extension dir> [--declare-router] [--continue]
//   --declare-router : the site's exchange contract is added to the settings first (contexte.knownSpenders), as a person would in the settings page
//   --continue       : when the answer is not "Ça correspond", wait for the delay and click "Continuer" (to see what the wallet then gets)
// Needs : local chain on 8545, the site on 8793 ; the relay on 8789 for the default build (without it the keyword parser answers).
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const [,, pwDir, chromeExe, outDir, repoRoot, mode, intentText, extDir, ...flags] = process.argv;
const DECLARE = flags.includes('--declare-router'), CONTINUE = flags.includes('--continue');
const require = createRequire(join(pwDir, 'package.json'));
const { chromium } = require(pwDir);
const { ethers } = createRequire(join(repoRoot, 'blockchain', 'package.json'))('ethers');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ext = resolve(extDir);
const tag = mode + (DECLARE ? '_declare' : '_neuf');
const profile = join(outDir, 'profil_' + tag); rmSync(profile, { recursive: true, force: true }); mkdirSync(outDir, { recursive: true });
const addr = JSON.parse(readFileSync(join(repoRoot, 'research/demo_reelle/chain/addresses.local.json'), 'utf8'));
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const snap = await provider.send('evm_snapshot', []);
const wallet = ethers.Wallet.createRandom().connect(provider);
await provider.send('hardhat_setBalance', [wallet.address, '0x56BC75E2D63100000']);
const usdc = new ethers.Contract(addr.usdc, ['function mint(address,uint256)', 'function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)'], wallet);
await (await usdc.mint(wallet.address, 100_000000n)).wait();
const out = { mode, profil: DECLARE ? 'neuf + contrat du site déclaré dans les réglages' : 'neuf, aucun réglage', extension: ext.replace(/\\/g, '/').split('/').slice(-2).join('/'), phrase: intentText, solde_initial: Number(await usdc.balanceOf(wallet.address)) / 1e6 };
const walletCalls = [];
const amountOf = (data) => { if (typeof data !== 'string' || !data.startsWith('0x095ea7b3') || data.length < 138) return null; const v = BigInt('0x' + data.slice(74, 138)); return v >= 2n ** 128n ? 'ILLIMITÉ' : (Number(v) / 1e6) + ' (brut ' + v + ')'; };
const ctx = await chromium.launchPersistentContext(profile, { executablePath: chromeExe, headless: false, args: ['--window-size=1280,760', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--headless=new'], viewport: { width: 1280, height: 720 }, locale: 'fr-FR' });
await ctx.exposeFunction('__signTyped', async (json) => { walletCalls.push({ type: 'signature' }); const td = JSON.parse(json); const types = { ...td.types }; delete types.EIP712Domain; return wallet.signTypedData(td.domain, types, td.message); });
await ctx.exposeFunction('__sendTx', async (json) => { const t = JSON.parse(json); const a = amountOf(t.data); walletCalls.push({ type: 'transaction', vers: t.to, selecteur: String(t.data).slice(0, 10), ...(a ? { droit_demande: a, beneficiaire: '0x' + t.data.slice(34, 74) } : {}) }); const tx = await wallet.sendTransaction({ to: t.to, data: t.data, value: t.value ? BigInt(t.value) : 0n }); await tx.wait(); return tx.hash; });
await ctx.addInitScript(([victim, chainHex]) => {
  if (window.top !== window || location.protocol === 'chrome-extension:') return;
  const rpc = (method, params) => fetch('http://127.0.0.1:8545', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then((r) => r.json()).then((j) => { if (j.error) throw new Error(j.error.message); return j.result; });
  const provider = { isMetaMask: false, request: async ({ method, params }) => {
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [victim];
    if (method === 'eth_chainId') return chainHex;
    if (method === 'net_version') return String(parseInt(chainHex, 16));
    if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') return null;
    if (method === 'eth_signTypedData_v4') return window.__signTyped(typeof params[1] === 'string' ? params[1] : JSON.stringify(params[1]));
    if (method === 'eth_sendTransaction') return window.__sendTx(JSON.stringify(params[0]));
    return rpc(method, params || []);
  }, on() {}, removeListener() {} };
  window.ethereum = provider;
  const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info: { uuid: '6f1c2a3e-0000-4000-8000-00000000d3a1', name: 'Portefeuille de test', icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', rdns: 'test.local.wallet' }, provider }) }));
  window.addEventListener('eip6963:requestProvider', announce); announce();
}, [wallet.address.toLowerCase(), '0x' + Number(addr.chainId).toString(16)]);
// Every state a Hold up window shows, with the time it stayed : recorded inside the page (survives until the window closes).
await ctx.addInitScript(() => {
  if (location.protocol !== 'chrome-extension:' || !/window\.html/.test(location.pathname)) return;
  const T = window.__states = []; let last = '';
  const read = () => { const hu = document.getElementById('hu'); if (!hu) return; const txt = (hu.innerText || '').replace(/\s+/g, ' ').trim(); const key = (hu.getAttribute('data-state') || '') + '|' + txt.replace(/dans \d+ s\./, 'dans N s.');
    if (key !== last) { last = key; T.push({ t: Math.round(performance.now()), state: hu.getAttribute('data-state') || '', texte: txt.slice(0, 260), defile: (() => { const m = document.querySelector('.hu-main'); return m ? m.scrollHeight > m.clientHeight : false; })() }); } };
  const start = () => { new MutationObserver(read).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true }); read(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
});
const popups = []; ctx.on('page', (p) => { if (/window\.html/.test(p.url())) popups.push(p); });
const errors = [];
const sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker', { timeout: 8000 });
sw.on('console', (m) => { if (m.type() === 'error') errors.push('[worker] ' + m.text().slice(0, 160)); });
if (DECLARE) await sw.evaluate((router) => chrome.storage.local.set({ contexte: { knownSpenders: [router] } }), addr.router);
out.reglages_au_depart = await sw.evaluate(() => chrome.storage.local.get(null));
const page = ctx.pages()[0] || await ctx.newPage();
page.on('pageerror', (e) => errors.push('[site] ' + String(e.message).slice(0, 160)));
const states = new Map(); // popup -> last states read
const pull = async () => { for (const p of popups) { if (p.isClosed()) continue; const s = await p.evaluate(() => window.__states).catch(() => null); if (s) states.set(p, s); } };
try {
  await sleep(1200);
  await page.goto('http://127.0.0.1:8793/?mode=' + (mode === 'permit' ? 'piege&via=permit' : mode)); await sleep(2000);
  await page.locator('#btn-swap').click(); await sleep(2000);
  if (/connex|connect/i.test(await page.locator('#btn-swap').innerText().catch(() => ''))) { await page.locator('#btn-swap').click(); await sleep(1500); }
  if (!popups.length) await page.locator('#btn-swap').click().catch(() => {});
  const t0 = Date.now(); while (!popups.length && Date.now() - t0 < 9000) await sleep(100);
  const pop = popups[0];
  if (!pop) throw new Error('aucune fenêtre Hold up');
  pop.on('console', (m) => { if (m.type() === 'error') errors.push('[fenêtre] ' + m.text().slice(0, 160)); });
  pop.on('pageerror', (e) => errors.push('[fenêtre] ' + String(e.message).slice(0, 160)));
  await pop.waitForSelector('textarea', { timeout: 8000 });
  await sleep(800);
  await pop.locator('textarea').fill(intentText); await sleep(300); await pop.locator('textarea').press('Enter');
  // follow the operation : the window closes by itself when it is over ; otherwise it shows an answer that waits for a gesture
  const t1 = Date.now(); let clicked = false;
  while (Date.now() - t1 < 60000) {
    await pull();
    if (popups.every((p) => p.isClosed())) break;
    const open = popups.find((p) => !p.isClosed());
    const s = await open.evaluate(() => { const hu = document.getElementById('hu'); const b = [...document.querySelectorAll('button')].find((x) => x.textContent === 'Continuer'); return { state: hu.getAttribute('data-state'), outcome: hu.getAttribute('data-outcome'), go: b ? b.getAttribute('aria-disabled') !== 'true' : null }; }).catch(() => null);
    if (s && s.state === 'answer' && s.go !== null && !clicked) {
      if (!CONTINUE) { await sleep(1200); await pull(); break; }
      if (s.go) { await sleep(700); await open.locator('button', { hasText: 'Continuer' }).click().catch(() => {}); clicked = true; }
    }
    await sleep(120);
  }
  await pull(); await sleep(2500);
  out.fenetres_hold_up = popups.length;
  out.fenetre_fermee_seule = popups.every((p) => p.isClosed());
  out.etats = [...states.values()].map((list) => list.map((s, i) => ({ etat: s.state, ms_a_l_ecran: i + 1 < list.length ? list[i + 1].t - s.t : null, defile: s.defile, texte: s.texte })));
  if (!out.fenetre_fermee_seule) { const open = popups.find((p) => !p.isClosed()); await open.screenshot({ path: join(outDir, 'neve_' + tag + '_fenetre.png') }).catch(() => {}); await open.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Annuler|Fermer/.test(x.textContent)); if (b) b.click(); }).catch(() => {}); await sleep(1500); out.fin = 'fenêtre laissée ouverte par Hold up : fermée par le script (Annuler)'; }
  out.site_a_la_fin = (await page.locator('#state').innerText().catch(() => '')).replace(/\s+/g, ' ');
  out.journal = (await sw.evaluate(() => chrome.storage.local.get('log')).catch(() => ({ log: [] }))).log.filter((e) => e.type === 'decision').map((e) => ({ decision: e.decision, by: e.by, outcome: e.outcome, classifier: e.classifier, sent: e.sent, codes: e.codes }));
} catch (e) { out.erreur = String(e.message).split('\n')[0]; }
out.demandes_arrivees_au_portefeuille = walletCalls;
out.droit_final_routeur = String(await usdc.allowance(wallet.address, addr.router));
out.droit_final_piege = String(await usdc.allowance(wallet.address, addr.drainer));
out.solde_final = Number(await usdc.balanceOf(wallet.address)) / 1e6;
out.erreurs_console = errors;
await ctx.close();
await provider.send('evm_revert', [snap]);
console.log(JSON.stringify(out, null, 1));

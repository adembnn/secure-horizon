// Plays the swap scene in real Chromium with the built extension and a simulated in-page wallet (fresh local key, local chain only).
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, rmSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
const [,, pwDir, chromeExe, outDir, repoRoot, mode, intentText, extDir] = process.argv; // mode: honnete | piege | permit ; extDir (optional): extension folder to load
const require = createRequire(join(pwDir, 'package.json'));
const { chromium } = require(pwDir);
const req2 = createRequire(join(repoRoot, 'blockchain', 'package.json'));
const { ethers } = req2('ethers');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ext = extDir ? resolve(extDir) : join(repoRoot, 'research/titouan/T_banc_e2e/extension_standalone/extension');
const dir = join(outDir, 'neve_' + mode); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const profile = join(outDir, 'profile_neve_' + mode); rmSync(profile, { recursive: true, force: true });
const addr = JSON.parse(readFileSync(join(repoRoot, 'research/demo_reelle/chain/addresses.local.json'), 'utf8'));
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const snap = await provider.send('evm_snapshot', []);
const wallet = ethers.Wallet.createRandom().connect(provider);
await provider.send('hardhat_setBalance', [wallet.address, '0x56BC75E2D63100000']);
const flat = JSON.stringify(addr);
const usdcAddr = addr.usdc || addr.DemoUSDC || (addr.contracts && (addr.contracts.usdc || addr.contracts.DemoUSDC)) || (flat.match(/"(?:usdc|DemoUSDC)"\s*:\s*"(0x[0-9a-fA-F]{40})"/i) || [])[1];
const usdc = new ethers.Contract(usdcAddr, ['function mint(address,uint256)', 'function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)'], wallet);
await (await usdc.mint(wallet.address, 100_000000n)).wait();
const log = ['compte de test: ' + wallet.address, 'solde initial: ' + Number(await usdc.balanceOf(wallet.address)) / 1e6];
const walletCalls = [];
const ctx = await chromium.launchPersistentContext(profile, { executablePath: chromeExe, headless: false, args: ['--window-size=1280,760', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--headless=new'], viewport: { width: 1280, height: 720 }, recordVideo: { dir, size: { width: 1280, height: 720 } }, locale: 'fr-FR' });
await ctx.exposeFunction('__signTyped', async (json) => { walletCalls.push('signature'); const td = JSON.parse(json); const types = { ...td.types }; delete types.EIP712Domain; return wallet.signTypedData(td.domain, types, td.message); });
await ctx.exposeFunction('__sendTx', async (json) => { const t = JSON.parse(json); walletCalls.push('transaction vers ' + t.to); const tx = await wallet.sendTransaction({ to: t.to, data: t.data, value: t.value ? BigInt(t.value) : 0n }); await tx.wait(); return tx.hash; });
await ctx.addInitScript(([victim, chainHex]) => {
  if (window.top !== window) return;
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
}, [wallet.address.toLowerCase(), '0x' + (43114).toString(16)]);
const popups = []; ctx.on('page', (p) => popups.push(p));
const page = ctx.pages()[0] || await ctx.newPage();
const txt = async (p) => (await p.evaluate(() => document.body.innerText).catch(() => '')).replace(/\s+/g, ' ').trim();
let shot = 0;
try {
  await sleep(1500);
  await page.goto('http://127.0.0.1:8793/?mode=' + (mode === 'permit' ? 'piege&via=permit' : mode)); await sleep(2500);
  await page.screenshot({ path: join(outDir, `neve_${mode}_0_site.png`) });
  log.push('bouton du site: ' + await page.locator('#btn-swap').innerText());
  await page.locator('#btn-swap').click(); await sleep(2500);
  if (/connex|connect/i.test(await page.locator('#btn-swap').innerText().catch(() => ''))) { await page.locator('#btn-swap').click(); await sleep(2000); }
  log.push('bouton après connexion: ' + await page.locator('#btn-swap').innerText().catch(() => '?'));
  if (!popups.length) { await page.locator('#btn-swap').click().catch(() => {}); }
  for (let round = 0; round < 3; round++) {
    const t0 = Date.now(); while (popups.length <= round && Date.now() - t0 < 9000) await sleep(300);
    const pop = popups[round]; if (!pop) { log.push(`fenêtre ${round + 1}: aucune`); break; }
    await pop.waitForLoadState().catch(() => {}); await sleep(1500);
    log.push(`fenêtre ${round + 1} avant saisie: ` + (await txt(pop)).slice(0, 300));
    await pop.screenshot({ path: join(outDir, `neve_${mode}_${++shot}_question.png`) }).catch(() => {});
    const field = pop.locator('textarea, input[type="text"], input:not([type])').first();
    if (await field.count()) { await field.fill(intentText); await sleep(700); await field.press('Enter'); } else log.push('pas de champ de saisie');
    await sleep(900);
    for (const t1 = Date.now(); !pop.isClosed() && Date.now() - t1 < 3000 && !(await pop.locator('[data-outcome]').count().catch(() => 1));) await sleep(100); // the answer screen (the relay has up to 2 s)
    log.push(`fenêtre ${round + 1} classification: ` + (pop.isClosed() ? '(fermée)' : (await pop.locator('.hu-note').allInnerTexts().catch(() => [])).join(' | ') || '(aucune ligne)'));
    log.push(`fenêtre ${round + 1} après saisie: ` + (pop.isClosed() ? '(fermée)' : (await txt(pop)).slice(0, 400)));
    if (!pop.isClosed()) await pop.screenshot({ path: join(outDir, `neve_${mode}_${++shot}_verdict.png`) }).catch(() => {});
    await sleep(3500);
    log.push(`fenêtre ${round + 1} 4 s plus tard: ` + (pop.isClosed() ? 'fermée toute seule' : 'encore ouverte | boutons: ' + (await pop.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.innerText.trim() + (b.disabled ? ' (inactif)' : '')).join(' / ')).catch(() => ''))));
    if (!pop.isClosed()) { await pop.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /annuler/i.test(x.innerText)); if (b) b.click(); }).catch(() => {}); await sleep(1500); log.push('annulé par l’utilisateur'); break; }
    await sleep(3000);
  }
  await sleep(2500);
  await page.screenshot({ path: join(outDir, `neve_${mode}_9_fin.png`) });
  log.push('site à la fin: ' + (await page.locator('#state').innerText().catch(() => '')).replace(/\s+/g, ' '));
} catch (e) { log.push('ERREUR ' + String(e.message).split('\n')[0]); }
log.push('demandes arrivées au portefeuille: ' + (walletCalls.length ? walletCalls.join(' ; ') : 'aucune'));
log.push('solde final: ' + Number(await usdc.balanceOf(wallet.address)) / 1e6);
await ctx.close();
await provider.send('evm_revert', [snap]);
console.log(JSON.stringify(log, null, 1)); console.log('videos:', readdirSync(dir).join(','));

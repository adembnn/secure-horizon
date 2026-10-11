// Shared harness : real Chromium + extension + simulated in-page wallet on the local chain (same idea as film_scene.mjs).
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
export const PW = 'C:/Users/Adem/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright-core';
export const EXE = 'C:/Users/Adem/AppData/Local/Packages/Claude_pzs8sxrjxfjjc/LocalCache/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
export const REPO = 'C:/Users/Adem/Secure Horizon';
export const S = 'C:/Users/Adem/AppData/Local/Temp/claude/C--Users-Adem-Secure-Horizon/2525e230-f0e3-402b-84e7-363258291c65/scratchpad';
const require = createRequire(join(PW, 'package.json'));
export const { chromium } = require(PW);
const req2 = createRequire(join(REPO, 'blockchain', 'package.json'));
export const { ethers } = req2('ethers');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const RECORDER = () => {
  if (location.protocol !== 'chrome-extension:') return;
  const R = window.__rec = { raf: [], mut: [], ls: [], lt: [], paint: [], ev: [], err: [] };
  const loop = (t) => { R.raf.push(Math.round(t * 10) / 10); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  const obs = (type, f) => { try { new PerformanceObserver((l) => { for (const e of l.getEntries()) f(e); }).observe({ type, buffered: true }); } catch (_) {} };
  obs('layout-shift', (e) => R.ls.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), input: e.hadRecentInput }));
  obs('longtask', (e) => R.lt.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }));
  obs('paint', (e) => R.paint.push({ n: e.name, t: Math.round(e.startTime) }));
  addEventListener('error', (e) => R.err.push(String(e.message)));
  const start = () => { const hu = document.getElementById('hu') || document.body; let last = '';
    new MutationObserver(() => { const txt = (hu.innerText || '').replace(/\s+/g, ' '); if (txt !== last) { last = txt; R.mut.push({ t: Math.round(performance.now()), txt: txt.slice(0, 60) + ' [...] ' + txt.slice(-70) }); } })
      .observe(hu, { childList: true, subtree: true, characterData: true, attributes: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  addEventListener('keydown', (e) => R.ev.push({ t: Math.round(performance.now()), k: 'key:' + e.key }), true);
  addEventListener('click', (e) => R.ev.push({ t: Math.round(performance.now()), k: 'click:' + (e.target.textContent || '').slice(0, 20) }), true);
};

// frames between t0 and t1 (ms, page clock) : count, dropped (interval > 25 ms counts floor(dt/16.7)-1), longest
export function frames(raf, t0, t1) {
  const f = raf.filter((t) => t >= t0 && t <= t1); const d = []; for (let i = 1; i < f.length; i++) d.push(f[i] - f[i - 1]);
  const sorted = d.slice().sort((a, b) => a - b); const med = sorted[Math.floor(sorted.length / 2)] || 0; let dropped = 0, longest = 0;
  for (const x of d) { if (x > longest) longest = x; if (med && x > 1.5 * med) dropped += Math.round(x / med) - 1; }
  return { images: f.length, intervalle_median_ms: Math.round(med * 10) / 10, images_perdues: dropped, plus_longue_image_ms: Math.round(longest * 10) / 10, duree_ms: Math.round(t1 - t0) };
}

export async function launch({ ext, name, scheme = 'light', video = true, tokens = true, cfg = null }) {
  const out = join(S, 'runs', name); rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  const profile = join(S, 'profiles', name); rmSync(profile, { recursive: true, force: true });
  const addr = JSON.parse(readFileSync(join(REPO, 'research/demo_reelle/chain/addresses.local.json'), 'utf8'));
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const snap = await provider.send('evm_snapshot', []);
  const wallet = ethers.Wallet.createRandom().connect(provider);
  await provider.send('hardhat_setBalance', [wallet.address, '0x56BC75E2D63100000']);
  const flat = JSON.stringify(addr);
  const usdcAddr = addr.usdc || addr.DemoUSDC || (addr.contracts && (addr.contracts.usdc || addr.contracts.DemoUSDC)) || (flat.match(/"(?:usdc|DemoUSDC)"\s*:\s*"(0x[0-9a-fA-F]{40})"/i) || [])[1];
  const usdc = new ethers.Contract(usdcAddr, ['function mint(address,uint256)', 'function balanceOf(address) view returns (uint256)'], wallet);
  await (await usdc.mint(wallet.address, 100_000000n)).wait();
  const walletCalls = [], consoleLog = [];
  const ctx = await chromium.launchPersistentContext(profile, { executablePath: EXE, headless: false, colorScheme: scheme,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--headless=new'], viewport: null,
    ...(video ? { recordVideo: { dir: out, size: { width: 1280, height: 720 } } } : {}), locale: 'fr-FR' });
  await ctx.exposeFunction('__signTyped', async (json) => { walletCalls.push('signature'); const td = JSON.parse(json); const types = { ...td.types }; delete types.EIP712Domain; return wallet.signTypedData(td.domain, types, td.message); });
  await ctx.exposeFunction('__sendTx', async (json) => { const t = JSON.parse(json); walletCalls.push('transaction vers ' + t.to); const tx = await wallet.sendTransaction({ to: t.to, data: t.data, value: t.value ? BigInt(t.value) : 0n }); await tx.wait(); return tx.hash; });
  await ctx.addInitScript(RECORDER);
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
  }, [wallet.address.toLowerCase(), '0x' + (43114).toString(16)]);
  const popups = [];
  const hook = (p, tag) => {
    p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleLog.push(`[${tag}] ${m.type()}: ${m.text().slice(0, 300)}`); });
    p.on('pageerror', (e) => consoleLog.push(`[${tag}] pageerror: ${String(e.message).slice(0, 300)}`));
  };
  ctx.on('page', (p) => { popups.push(p); hook(p, 'fenetre' + popups.length); });
  const page = ctx.pages()[0] || await ctx.newPage(); hook(page, 'site');
  let sw = ctx.serviceWorkers()[0]; if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 8000 }).catch(() => null);
  if (sw) sw.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleLog.push(`[worker] ${m.type()}: ${m.text().slice(0, 300)}`); });
  const extId = sw ? new URL(sw.url()).host : null;
  if (sw && tokens) await sw.evaluate(async (c) => { await chrome.storage.local.set({ contexte: c }); }, { contacts: [], history: [], protected: [], knownSpenders: [addr.router], tokens: [{ address: addr.usdc, symbol: 'USDC', decimals: 6, chainId: 43114 }, { address: addr.wavax, symbol: 'WAVAX', decimals: 18, chainId: 43114 }] });
  if (sw && cfg) await sw.evaluate(async (c) => { await chrome.storage.local.set({ cfg: c }); }, cfg);
  const close = async () => { await ctx.close().catch(() => {}); await provider.send('evm_revert', [snap]).catch(() => {}); };
  return { ctx, page, popups, out, walletCalls, consoleLog, extId, sw, close, usdc, wallet };
}
export const txt = async (p) => (await p.evaluate(() => document.body.innerText).catch(() => '(fermée)')).replace(/\s+/g, ' ').trim();
export async function openScene(h, mode) {
  const { page, popups } = h;
  await sleep(1200);
  await page.goto('http://127.0.0.1:8793/?mode=' + (mode === 'permit' ? 'piege&via=permit' : mode)); await sleep(2000);
  await page.locator('#btn-swap').click(); await sleep(2200);
  if (/connex|connect/i.test(await page.locator('#btn-swap').innerText().catch(() => ''))) { await page.locator('#btn-swap').click(); await sleep(1800); }
  if (!popups.length) await page.locator('#btn-swap').click().catch(() => {});
  const t0 = Date.now(); while (!popups.length && Date.now() - t0 < 9000) await sleep(100);
  return popups[0] || null;
}
export async function waitPopup(h, n, ms = 9000) { const t0 = Date.now(); while (h.popups.length < n && Date.now() - t0 < ms) await sleep(100); return h.popups[n - 1] || null; }
export const rec = (p) => p.evaluate(() => window.__rec).catch(() => null);

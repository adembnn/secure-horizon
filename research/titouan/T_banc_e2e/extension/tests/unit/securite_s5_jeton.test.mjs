// S5 (revue de securite n2) : le canal prive entre inject.js (page) et bridge.js (monde isole) est authentifie par un jeton aleatoire
// donne dans "ready" et repete dans chaque message. Un message sans le bon jeton est ignore ; un "ready" sans jeton n'ouvre pas le canal.
// Run : node --test extension/tests/unit/securite_s5_jeton.test.mjs
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIR } from './fake_chrome.mjs';
import { page, sleep, cleanAll, cleanups, RUNNER, TXP, SRC, TOKEN } from './securite_page.mjs';

after(cleanAll);
const WALLET_S = `
  class WalletS {
    constructor() { this.reached = 0; this.chainId = '0x7a69'; this.selectedAddress = '0x' + 'a1'.repeat(20); this.request = this.request.bind(this); }
    async request(a) { if (a && a.method !== 'eth_chainId') this.reached++; return 'ok'; }
  }`;
const SETUP = RUNNER + WALLET_S + `; window.ethereum = new WalletS();`;
const REQ = `ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`;

test('S5 : a "ready" without token never opens the channel : the request fails closed (4900), the wallet is not reached', async () => {
  const P = page({ decide: () => true, token: null });
  P.run(SETUP);
  P.run(`__go('a', () => ${REQ})`);
  await sleep(2800);
  assert.equal(P.run('__out.a.ok'), false);
  assert.equal(P.run('__out.a.error.code'), 4900);
  assert.equal(P.run('ethereum.reached'), 0);
  assert.equal(P.gates.length, 0, 'nothing was ever sent on a channel that was not authenticated');
});

test('S5 : a "ready" with a token too short is not accepted either', async () => {
  const P = page({ decide: () => true, token: 'abc' });
  P.run(SETUP);
  P.run(`__go('a', () => ${REQ})`);
  await sleep(2800);
  assert.equal(P.run('__out.a.error.code'), 4900); assert.equal(P.run('ethereum.reached'), 0);
});

test('S5 : results and acks without the token (or with another one) are ignored ; only the bridge answer counts', async () => {
  let release; const held = new Promise((r) => { release = r; });
  const P = page({ decide: () => held });
  P.run(SETUP);
  P.run(`__go('a', () => ${REQ})`);
  await sleep(120);
  assert.equal(P.gates.length, 1);
  const port = P.ctx._port;
  // ids are small integers : a forger who reached the port would try them. None of these may release the request.
  for (const k of [undefined, 'wrong-token-wrong-token-wrong-', TOKEN.toUpperCase(), 12345, null]) {
    port.postMessage({ t: 'result', id: 1, allow: true, reason: '', k });
    port.postMessage({ t: 'result', id: 1, allow: true, reason: '' });
  }
  port.postMessage({ t: 'ready', k: 'ffffffffffffffffffffffffffffffff' }); // a second "ready" with another token : ignored
  port.postMessage({ t: 'result', id: 1, allow: true, reason: '', k: 'ffffffffffffffffffffffffffffffff' });
  await sleep(120);
  assert.equal(P.run('__out.a.pending'), true, 'still waiting for the real decision');
  assert.equal(P.run('ethereum.reached'), 0);
  release(false);
  await sleep(120);
  assert.equal(P.run('__out.a.ok'), false); assert.equal(P.run('__out.a.error.code'), 4001);
  assert.equal(P.run('ethereum.reached'), 0);
});

test('S5 : a forged "allow" carrying the right token but built from the page world cannot exist : inject.js sends the token only through the private port', async () => {
  const P = page({ decide: () => false });
  P.run(SETUP + `; window.seen = []; window.addEventListener('message', (e) => { seen[seen.length] = e.data; }, true);`);
  P.run(`__go('a', () => ${REQ})`);
  await sleep(200);
  assert.equal(P.run('JSON.stringify(seen).includes(' + JSON.stringify(TOKEN) + ')'), false, 'the token is never posted on window');
  assert.equal(P.run('ethereum.reached'), 0);
});

// ---- inject.js + the real bridge.js in one fake window, as the browser loads them (bridge first) ------------------------------
function browser(decisions) {
  const listeners = [], pageSaw = [], timers = new Set(), ports = [];
  const sb = {
    console, crypto: globalThis.crypto, Uint8Array, Array, location: { origin: 'https://site.test', href: 'https://site.test/x', },
    document: { body: { innerText: 'hello' }, referrer: '' },
    setTimeout: (f, ms, ...a) => { const t = setTimeout(f, ms, ...a); timers.add(t); return t; }, clearTimeout: (t) => clearTimeout(t),
    setInterval: (f, ms) => { const t = setInterval(f, ms); timers.add(t); return t; }, clearInterval: (t) => clearInterval(t),
    MessageChannel: class { constructor() { const c = new MessageChannel(); ports.push(c.port1, c.port2); this.port1 = c.port1; this.port2 = c.port2; } }, queueMicrotask,
    addEventListener: (type, fn, cap) => { if (!listeners.some((l) => l.type === type && l.fn === fn && !!l.cap === !!cap)) listeners.push({ type, fn, cap: !!cap }); },
    dispatchEvent: () => true,
    chrome: { runtime: { onMessage: { addListener() {} }, sendMessage: async (m) => { if (m && m.type === 'gate' && m.payload && m.payload.kind === 'gate') { decisions.push(m.payload.method); return { done: true, allow: decisions.allow === true, reason: 'denied' }; } return undefined; } } }
  };
  sb.postMessage = (data, origin, transfer) => {
    setTimeout(() => {
      const ev = { type: 'message', data, source: sb._g, ports: transfer || [], stopped: false, stopImmediatePropagation() { this.stopped = true; } };
      const order = [...listeners.filter((l) => l.type === 'message' && l.cap), ...listeners.filter((l) => l.type === 'message' && !l.cap)];
      for (const l of order) { if (ev.stopped) break; l.fn(ev); }
    }, 0);
  };
  sb.window = sb; sb.top = sb; sb.self = sb; sb.globalThis = sb;
  const ctx = vm.createContext(sb);
  sb._g = vm.runInContext('globalThis', ctx); // inside the context, "window" is the global proxy, not the raw sandbox object
  vm.runInContext('class CustomEvent { constructor(t, i) { this.type = t; this.detail = i && i.detail; } }; globalThis.CustomEvent = CustomEvent;', ctx);
  vm.runInContext(readFileSync(join(DIR, 'bridge.js'), 'utf8'), ctx, { filename: 'bridge.js' });
  vm.runInContext(SRC, ctx, { filename: 'inject.js' });
  cleanups.push(() => { for (const t of timers) { clearTimeout(t); clearInterval(t); } for (const p of ports) { try { p.close(); } catch (_) {} } });
  sb.pageSaw = pageSaw;
  return { sb, run: (c) => vm.runInContext(c, ctx), pageSaw, decisions };
}

test('S5 : inject.js + the real bridge.js : the token is exchanged, a refusal and an allow both go through, and the page never receives a port', async () => {
  const decisions = []; decisions.allow = false;
  const B = browser(decisions);
  B.run(SETUP + `; window.portsSeen = 0; window.addEventListener('message', (e) => { portsSeen += (e.ports && e.ports.length) || 0; });`);
  B.run(`__go('a', () => ${REQ})`);
  await sleep(300);
  assert.deepEqual([...decisions], ['eth_sendTransaction'], 'the bridge received the gate through the authenticated channel');
  assert.equal(B.run('__out.a.error.code'), 4001);
  assert.equal(B.run('ethereum.reached'), 0);
  decisions.allow = true;
  B.run(`__go('b', () => ${REQ})`);
  await sleep(300);
  assert.equal(B.run('__out.b.value'), 'ok'); assert.equal(B.run('ethereum.reached'), 1);
  assert.equal(B.run('portsSeen'), 0, 'the page listener never saw a port (bridge stops the "hello" in the capture phase)');
});

test('S5 : bridge.js ignores a port message that does not carry its token', async () => {
  const src = readFileSync(join(DIR, 'bridge.js'), 'utf8');
  assert.match(src, /m\.k !== token/, 'onPortMsg checks the token');
  assert.match(src, /newToken\(\)/);
  assert.match(src, /crypto\.getRandomValues/);
});

// One-shot pass of inject.js (grant / takePass) against a hostile page : hardening of 1aba043 after an adversarial review (11 Oct.).
// The page steals a forwarded object, plants a chainId on Object.prototype, or hands the forwarded params to another wallet :
// every execution that was not approved must be asked again. Run : node --test extension/tests/unit/
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIR } from './fake_chrome.mjs';
const SRC = readFileSync(process.env.INJECT || join(DIR, 'inject.js'), 'utf8');
const TOKEN = '0123456789abcdef0123456789abcdef';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cleanups = []; after(() => { for (const f of cleanups) f(); });
function page() {
  const gates = [], listeners = {}, timers = new Set(), ports = [];
  const sb = { console,
    setTimeout: (f, ms, ...a) => { const t = setTimeout(f, ms, ...a); timers.add(t); return t; }, clearTimeout,
    setInterval: (f, ms) => { const t = setInterval(f, ms); timers.add(t); return t; }, clearInterval,
    MessageChannel: class { constructor() { const c = new MessageChannel(); ports.push(c.port1, c.port2); this.port1 = c.port1; this.port2 = c.port2; } },
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || new Set()).add(fn); },
    dispatchEvent: (ev) => { for (const fn of [...(listeners[ev.type] || [])]) { if (ev._stopped) break; fn(ev); } return true; },
    postMessage: (data, origin, transfer) => {
      if (!data || data.__sentinelle !== 'hello' || !transfer || !transfer[0] || sb._port) return;
      const port = sb._port = transfer[0];
      port.onmessage = (ev) => { const m = ev.data; if (m.t !== 'gate') return; port.postMessage({ t: 'ack', id: m.id, k: TOKEN });
        gates.push(m.payload); port.postMessage({ t: 'result', id: m.id, k: TOKEN, allow: true, reason: '' }); };
      port.postMessage({ t: 'ready', k: TOKEN });
    } };
  sb.window = sb; sb.top = sb; sb.self = sb; sb.globalThis = sb;
  const ctx = vm.createContext(sb);
  const run = (c) => vm.runInContext(c, ctx);
  run('class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } stopImmediatePropagation() { this._stopped = true; } }; globalThis.CustomEvent = CustomEvent;');
  run(SRC);
  cleanups.push(() => { for (const t of timers) { clearTimeout(t); clearInterval(t); } for (const p of ports) { try { p.close(); } catch (_) {} } });
  return { gates, run };
}
// Shape read in the page script of MetaMask 13.50 : request and _rpcRequest own + bound, request() checks its argument with Array.isArray
// and hands _rpcRequest a NEW payload that keeps the params array ; the engine exposes no chainId. BACK = what reached a wallet.
const MM = `
  window.BACK = [];
  class Engine { constructor(n) { this.n = n; } handle(e, cb) { BACK.push(this.n + ':' + e.method); cb(null, { id: e.id, jsonrpc: '2.0', result: 'h' }); } }
  class MM { constructor(n, chain) { this.chainId = chain; this.selectedAddress = '0x' + 'a1'.repeat(20); this._rpcEngine = new Engine(n);
      this.request = this.request.bind(this); this._rpcRequest = this._rpcRequest.bind(this); }
    request(a) { if (!a || typeof a !== 'object' || Array.isArray(a)) return Promise.reject(new Error('bad')); const { method, params } = a;
      return new Promise((res, rej) => this._rpcRequest({ method, params }, (e, r) => (e ? rej(e) : res(r.result)))); }
    _rpcRequest(e, cb) { Array.isArray(e) || (e.jsonrpc || (e.jsonrpc = '2.0')); return this._rpcEngine.handle(e, cb); } }
  window.A = new MM('A', '0xa86a'); window.ethereum = new Proxy(A, { deleteProperty: () => true, get: (t, k) => t[k] });`;
const TX = `{ method: 'eth_sendTransaction', params: [{ from: '0x' + 'a1'.repeat(20), to: '0x' + 'b2'.repeat(20), value: '0x1' }] }`;
const ANNOUNCE = (name) => `window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info: { uuid: '${name}', name: '${name}', rdns: '${name}' }, provider: ${name} }) }));`;
const STEAL = (replay) => `{ const real = Array.isArray; let done = false; Array.isArray = function (x) { if (!done && x && typeof x === 'object' && x.method === 'eth_sendTransaction') { done = true; try { ${replay}; } catch (_) {} } return real(x); }; }`;
const sent = (P, n) => P.run(`BACK.filter((x) => x === '${n}:eth_sendTransaction').length`);

test('(pass 0) control : one honest call on a MetaMask-like wallet is asked once and reaches the wallet once', async () => {
  const P = page(); P.run(MM); await sleep(250);
  P.run(`ethereum.request(${TX})`); await sleep(300);
  assert.equal(P.gates.length, 1); assert.equal(sent(P, 'A'), 1);
});
for (const [name, replay] of [['_rpcRequest', 'ethereum._rpcRequest(x, () => {})'], ['_rpcEngine.handle', 'ethereum._rpcEngine.handle(x, () => {})']]) {
  test(`(pass 1) forwarded object stolen in a repainted Array.isArray, replayed through ${name} : never more executions than questions`, async () => {
    const P = page(); P.run(MM); await sleep(250);
    P.run(STEAL(replay) + `; ethereum.request(${TX});`); await sleep(400);
    assert.equal(sent(P, 'A'), 2, 'two arrivals when every question is answered yes');
    assert.ok(P.gates.length >= 2, P.gates.length + ' question(s) for 2 executions');
  });
  test(`(pass 1 bis) same theft through ${name}, with Object.prototype.chainId planted by the page`, async () => {
    const P = page(); P.run(MM); await sleep(250);
    P.run(`Object.defineProperty(Object.prototype, 'chainId', { value: '0xa86a', configurable: true }); ` + STEAL(replay) + `; ethereum.request(${TX});`); await sleep(400);
    assert.ok(P.gates.length >= sent(P, 'A'), P.gates.length + ' question(s) for ' + sent(P, 'A') + ' executions');
  });
}
test('(pass 2) approved on wallet A (0xa86a) : the forwarded params handed to the engine of ANOTHER wallet (0x1) are asked again', async () => {
  const P = page(); P.run(MM + `; window.B = new MM('B', '0x1'); window.walletB = new Proxy(B, { deleteProperty: () => true, get: (t, k) => t[k] }); ` + ANNOUNCE('walletB')); await sleep(250);
  P.run(`ethereum._rpcRequest = (p, cb) => walletB._rpcEngine.handle({ id: 1, jsonrpc: '2.0', method: p.method, params: p.params }, cb); ethereum.request(${TX});`); await sleep(400);
  assert.equal(sent(P, 'B'), 1); assert.equal(P.gates.length, 2, 'the other wallet has its own question');
});
test('(pass 3) approved on wallet A : the forwarded params handed to another provider WITHOUT chainId are asked again', async () => {
  const P = page(); P.run(MM + `; window.other = { request(a) { return Promise.resolve(a.method === 'eth_chainId' ? '0x1' : 'h'); } }; ` + ANNOUNCE('other')); await sleep(250);
  P.run(`ethereum._rpcRequest = (p, cb) => { other.request({ method: p.method, params: p.params }).then((r) => cb(null, { result: r }), cb); }; ethereum.request(${TX});`); await sleep(1200);
  assert.equal(P.gates.length, 2, 'asked again for the other provider');
});
test('(pass 4) a front of the page naming another chain, even claiming the engine of the real wallet, cannot spend its pass on that engine', async () => {
  const P = page(); P.run(MM); await sleep(250);
  P.run(`window.rabby = { chainId: '0x1', _rpcEngine: A._rpcEngine, request(a) { return new Promise((res) => A._rpcEngine.handle({ id: 2, jsonrpc: '2.0', method: a.method, params: a.params }, (e, r) => res(r && r.result))); } }; ` + ANNOUNCE('rabby')); await sleep(250);
  P.run(`rabby.request(${TX});`); await sleep(400);
  assert.equal(P.gates.length, 2, 'question on 0x1 for the front, then a question for the real engine');
});
test('(pass 5) this = {} on the bound _rpcRequest of the wallet, with the forwarded params of a front of the page : asked again', async () => {
  const P = page(); P.run(MM); await sleep(250);
  P.run(`window.front = { chainId: '0x1', request(a) { return new Promise((res) => ethereum._rpcRequest.call({}, { id: 3, jsonrpc: '2.0', method: a.method, params: a.params }, (e, r) => res(r && r.result))); } }; ` + ANNOUNCE('front')); await sleep(250);
  P.run(`front.request(${TX});`); await sleep(400);
  assert.equal(P.gates.length, 2);
});

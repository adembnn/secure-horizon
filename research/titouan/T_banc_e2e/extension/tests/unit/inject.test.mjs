// Page side (inject.js, MAIN world) in a node:vm context with fake providers. The fake bridge below plays bridge.js :
// it records every gated request and answers allow / deny. Run : node --test extension/tests/unit/
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIR } from './fake_chrome.mjs';
const TOKEN = '0123456789abcdef0123456789abcdef'; // token the real bridge.js gives in "ready" (S1/S5)

const SRC = readFileSync(join(DIR, 'inject.js'), 'utf8');
const cleanups = [];
after(() => { for (const fn of cleanups) fn(); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One fake page. decide(payload) -> true (allow) | false (deny) | a promise of it. bridge:false = no bridge at all.
function page({ decide = () => true, bridge = true, before = '' } = {}) {
  const gates = [], notes = [], listeners = {}, timers = new Set(), ports = [];
  const sb = {
    console,
    setTimeout: (f, ms, ...a) => { const t = setTimeout(f, ms, ...a); timers.add(t); return t; },
    clearTimeout: (t) => clearTimeout(t),
    setInterval: (f, ms) => { const t = setInterval(f, ms); timers.add(t); return t; },
    clearInterval: (t) => clearInterval(t),
    MessageChannel: class { constructor() { const c = new MessageChannel(); ports.push(c.port1, c.port2); this.port1 = c.port1; this.port2 = c.port2; } },
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || new Set()).add(fn); },
    dispatchEvent: (ev) => { for (const fn of [...(listeners[ev.type] || [])]) { if (ev._stopped) break; fn(ev); } return true; },
    postMessage: (data, origin, transfer) => {
      if (!bridge || !data || data.__sentinelle !== 'hello' || !transfer || !transfer[0]) return;
      const port = transfer[0];
      if (sb._port) return;                       // retries after the connection are swallowed, as bridge.js does
      sb._port = port;
      port.onmessage = async (ev) => {
        const m = ev.data;
        if (m.t === 'notify') { notes.push(m.payload); return; }
        if (m.t !== 'gate') return;
        port.postMessage({ t: 'ack', id: m.id, k: TOKEN });
        gates.push(m.payload);
        let allow = false; try { allow = !!(await decide(m.payload)); } catch (_) {}
        port.postMessage({ t: 'result', id: m.id, k: TOKEN, allow, reason: allow ? '' : 'denied' });
      };
      port.postMessage({ t: 'ready', k: TOKEN });
    }
  };
  sb.window = sb; sb.top = sb; sb.self = sb; sb.globalThis = sb;
  const ctx = vm.createContext(sb);
  vm.runInContext('class CustomEvent { constructor(type, init) { this.type = type; this.detail = init && init.detail; } stopImmediatePropagation() { this._stopped = true; } }; globalThis.CustomEvent = CustomEvent;', ctx);
  if (before) vm.runInContext(before, ctx);       // a wallet that injected before us
  vm.runInContext(SRC, ctx, { filename: 'inject.js' });
  cleanups.push(() => { for (const t of timers) { clearTimeout(t); clearInterval(t); } for (const p of ports) { try { p.close(); } catch (_) {} } });
  return { gates, notes, run: (code) => vm.runInContext(code, ctx), ctx: sb };
}
// Wallet whose request is an own property bound in the constructor (the MetaMask pattern) ; `calls` = what really reached it.
const WALLET = `
  class Wallet {
    constructor() { this.calls = []; this.chainId = '0x7a69'; this.selectedAddress = '0x' + 'a1'.repeat(20); this.request = this.request.bind(this); }
    async request(a) { this.calls.push(a); if (this.hang) return new Promise(() => {}); return a.method === 'eth_chainId' ? this.chainId : 'result:' + a.method; }
    send(m, p) { return typeof m === 'string' ? this.request({ method: m, params: p }) : this.sendAsync(m, p); }
    sendAsync(payload, cb) { this.request(payload).then((r) => cb(null, { id: payload.id, jsonrpc: '2.0', result: r }), (e) => cb(e)); }
    enable() { return this.request({ method: 'eth_requestAccounts' }); }
  }`;
const TXP = `[{ from: '0x' + 'a1'.repeat(20), to: '0x' + 'b2'.repeat(20), value: '0x1' }]`;
const settle = (p) => Promise.resolve(p).then((value) => ({ ok: true, value }), (error) => ({ ok: false, error }));

test('a gated request waits for the decision ; a refusal never reaches the wallet (4001)', async () => {
  const P = page({ decide: () => false });
  P.run(WALLET + `; window.ethereum = new Wallet();`);
  const r = await settle(P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`));
  assert.equal(r.ok, false); assert.equal(r.error.code, 4001);
  assert.equal(P.gates.length, 1); assert.equal(P.gates[0].method, 'eth_sendTransaction'); assert.equal(P.gates[0].chainId, '0x7a69', 'chain of the provider, whatever it is');
  assert.equal(P.run(`ethereum.calls.filter((c) => c.method !== 'eth_chainId').length`), 0, 'nothing forwarded');
  const ok = await settle(P.run(`ethereum.request({ method: 'eth_blockNumber' })`));
  assert.equal(ok.value, 'result:eth_blockNumber'); assert.equal(P.gates.length, 1, 'read methods are not gated');
});

test('no bridge (extension context gone) : fail closed, the wallet is not reached', async () => {
  const P = page({ bridge: false });
  P.run(WALLET + `; window.ethereum = new Wallet();`);
  const r = await settle(P.run(`ethereum.request({ method: 'personal_sign', params: ['0x00', '0x' + 'a1'.repeat(20)] })`));
  assert.equal(r.ok, false); assert.equal(r.error.code, 4900);
  assert.equal(P.run(`ethereum.calls.length`), 0);
});

test('(a) getter on method : every field is read once, the frozen copy is judged and the copy is forwarded', async () => {
  const P = page();
  P.run(WALLET + `; window.ethereum = new Wallet();
    window.reads = 0;
    window.liar = { get method() { reads++; return reads <= 2 ? 'eth_chainId' : 'eth_sendTransaction'; }, params: ${TXP} };
    window.liar2 = { get method() { reads++; return reads <= 1 ? 'eth_sendTransaction' : 'eth_chainId'; }, params: ${TXP} };`);
  await settle(P.run(`ethereum.request(liar)`));
  assert.equal(P.run(`reads`), 1, 'method read exactly once');
  assert.equal(P.gates.length, 0, 'the first read said eth_chainId');
  let got = P.run(`ethereum.calls[0]`);
  assert.equal(got.method, 'eth_chainId', 'the wallet received what was read, not a second read');
  assert.equal(P.run(`ethereum.calls[0] === liar`), false, 'the page object itself is never handed to the wallet');
  assert.equal(P.run(`Object.getOwnPropertyDescriptor(ethereum.calls[0], 'method').get`), undefined, 'plain data property');
  // the other way round : gated on the first read, the wallet must receive that same method
  P.run(`reads = 0`);
  const r = await settle(P.run(`ethereum.request(liar2)`));
  assert.equal(r.value, 'result:eth_sendTransaction');
  assert.equal(P.gates.length, 1); assert.equal(P.gates[0].method, 'eth_sendTransaction');
  // a Proxy that lies on later reads, and a toJSON trick
  P.run(`window.n = 0; window.px = new Proxy({ method: 'eth_chainId', params: [] }, { get(t, k) { if (k === 'method') return ++n > 1 ? 'eth_sign' : 'eth_chainId'; return t[k]; } });`);
  await settle(P.run(`ethereum.request(px)`));
  assert.equal(P.run(`ethereum.calls[ethereum.calls.length - 1].method`), 'eth_chainId');
  assert.equal(P.gates.length, 1);
  await settle(P.run(`ethereum.request({ method: 'eth_chainId', toJSON() { return { method: 'eth_sign', params: ['0x' + 'a1'.repeat(20), '0x00'] }; } })`));
  assert.equal(P.gates.length, 2, 'what toJSON yields is what is judged');
  assert.equal(P.gates[1].method, 'eth_sign'); assert.equal(P.run(`ethereum.calls[ethereum.calls.length - 1].method`), 'eth_sign', 'and what is forwarded');
});

test('(a) params changed after the call (TOCTOU) : the wallet receives what was judged', async () => {
  let release; const held = new Promise((r) => { release = r; });
  const P = page({ decide: () => held });
  P.run(WALLET + `; window.ethereum = new Wallet(); window.tx = { from: '0x' + 'a1'.repeat(20), to: '0x' + 'b2'.repeat(20), value: '0x1' };
    window.pending = ethereum.request({ method: 'eth_sendTransaction', params: [tx] });`);
  await sleep(60);
  P.run(`tx.to = '0x' + 'ee'.repeat(20); tx.value = '0xffffffffffff';`);
  release(true);
  await settle(P.run(`pending`));
  assert.equal(P.gates[0].params[0].to, '0x' + 'b2'.repeat(20));
  assert.equal(P.run(`ethereum.calls[0].params[0].to`), '0x' + 'b2'.repeat(20));
  assert.equal(P.run(`ethereum.calls[0].params[0].value`), '0x1');
  const bad = await settle(P.run(`(() => { const c = { method: 'eth_sendTransaction', params: [] }; c.params.push(c); return ethereum.request(c); })()`));
  assert.equal(bad.ok, false, 'unreadable request : refused, not forwarded'); assert.equal(P.run(`ethereum.calls.length`), 1);
});

test('(b) prototype bypass : request / send / sendAsync / enable are wrapped on the instance and along the prototype chain, once', async () => {
  const P = page({ decide: () => false });
  P.run(WALLET + `; class Sub extends Wallet {}; window.ethereum = new Sub(); window.proto = Object.getPrototypeOf(Object.getPrototypeOf(ethereum));`);
  const attempts = [
    `proto.request.call(ethereum, { method: 'eth_sendTransaction', params: ${TXP} })`,
    `Object.getPrototypeOf(ethereum).request.call(ethereum, { method: 'eth_sendTransaction', params: ${TXP} })`,
    `ethereum.__proto__.__proto__.send.call(ethereum, 'eth_sendTransaction', ${TXP})`,
    `new Promise((res, rej) => proto.sendAsync.call(ethereum, { id: 1, method: 'eth_sendTransaction', params: ${TXP} }, (e, r) => (e || (r && r.error)) ? rej(e || r.error) : res(r)))`,
    `Reflect.apply(proto.request, ethereum, [{ method: 'personal_sign', params: ['0x00', '0x' + 'a1'.repeat(20)] }])`
  ];
  for (const code of attempts) { const r = await settle(P.run(code)); assert.equal(r.ok, false, code); }
  assert.equal(P.gates.length, attempts.length, 'each attempt was gated');
  assert.equal(P.run(`ethereum.calls.filter((c) => c.method !== 'eth_chainId').length`), 0, 'nothing reached the wallet');
  // idempotent : the periodic scan does not wrap again
  const f1 = P.run(`window.f1 = ethereum.request; window.g1 = proto.request; 1`);
  await sleep(400);
  assert.equal(P.run(`ethereum.request === f1 && proto.request === g1`), true, 'same wrappers after several scans');
  const before = P.gates.length;
  await settle(P.run(`ethereum.request({ method: 'eth_sign', params: ['0x' + 'a1'.repeat(20), '0x00'] })`));
  assert.equal(P.gates.length, before + 1, 'one window per request, not one per wrapper');
  assert.equal(P.run(`Function.prototype.toString.call(ethereum.request).includes('Proxy')`), false);
});

test('(b) a wallet present before the script, a frozen provider and a getter-defined request are wrapped too', async () => {
  const P = page({ decide: () => false, before: WALLET + `; window.ethereum = new Wallet();` });
  assert.equal((await settle(P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`))).ok, false);
  assert.equal(P.gates.length, 1);
  const Q = page({ decide: () => false });
  Q.run(WALLET + `; window.raw = Object.freeze(new Wallet()); window.ethereum = raw;`);
  assert.equal((await settle(Q.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`))).ok, false);
  assert.equal((await settle(Q.run(`Object.getPrototypeOf(ethereum).request.call(raw, { method: 'eth_sendTransaction', params: ${TXP} })`))).ok, false);
  assert.equal(Q.gates.length, 2); assert.equal(Q.run(`raw.calls.filter((c) => c.method !== 'eth_chainId').length`), 0);
  const G = page({ decide: () => false });
  G.run(`window.calls = []; const impl = async (a) => { calls.push(a.method); return 1; };
    window.ethereum = Object.create({ get request() { return impl; } });`);
  assert.equal((await settle(G.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`))).ok, false);
  assert.equal(G.gates.length, 1); assert.equal(G.run(`calls.filter((m) => m !== 'eth_chainId').length`), 0);
});

test('(c) window.avalanche (Core) and every EIP-6963 provider are gated, even when they arrive late', async () => {
  const P = page({ decide: () => false });
  P.run(WALLET + `; window.core1 = new Wallet(); window.avalanche = core1;`);
  assert.equal((await settle(P.run(`avalanche.request({ method: 'eth_sendTransaction', params: ${TXP} })`))).ok, false);
  assert.equal((await settle(P.run(`core1.request({ method: 'eth_signTypedData_v4', params: ['0x' + 'a1'.repeat(20), '{}'] })`))).ok, false, 'the raw object is patched in place');
  assert.equal(P.gates.length, 2);
  // Core defined with defineProperty, non configurable
  const D = page({ decide: () => false });
  D.run(WALLET + `; Object.defineProperty(window, 'avalanche', { value: new Wallet(), writable: false, configurable: false });`);
  assert.equal((await settle(D.run(`avalanche.request({ method: 'eth_sendTransaction', params: ${TXP} })`))).ok, false);
  assert.equal(D.gates.length, 1);
  // already there before the script
  const B = page({ decide: () => false, before: WALLET + `; window.avalanche = new Wallet();` });
  assert.equal((await settle(B.run(`avalanche.request({ method: 'eth_sendTransaction', params: ${TXP} })`))).ok, false);
  assert.equal(B.gates.length, 1);
  // EIP-6963 : two wallets announced, neither on window.ethereum
  const E = page({ decide: () => false });
  E.run(WALLET + `; window.w1 = new Wallet(); window.w2 = new Wallet(); window.found = [];
    window.addEventListener('eip6963:announceProvider', (ev) => found.push(ev.detail.provider));
    for (const [w, name] of [[w1, 'MetaMask'], [w2, 'Core']]) window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info: { uuid: name, name, rdns: 'test.' + name }, provider: w }) }));`);
  assert.equal(E.run(`found.length`), 2);
  for (const i of [0, 1]) assert.equal((await settle(E.run(`found[${i}].request({ method: 'eth_sendTransaction', params: ${TXP} })`))).ok, false);
  assert.equal(E.gates.length, 2);
  assert.equal(E.run(`w1.calls.concat(w2.calls).filter((c) => c.method !== 'eth_chainId').length`), 0);
  // a frozen provider announced through EIP-6963 is replaced by a gated proxy before the page listeners see it
  const Z = page({ decide: () => false });
  Z.run(WALLET + `; window.frozen = Object.freeze(new Wallet()); window.found = [];
    window.addEventListener('eip6963:announceProvider', (ev) => found.push(ev.detail.provider));
    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail: Object.freeze({ info: { name: 'x' }, provider: frozen }) }));`);
  await sleep(30);
  assert.equal(Z.run(`found.length`), 1);
  assert.equal((await settle(Z.run(`found[0].request({ method: 'eth_sendTransaction', params: ${TXP} })`))).ok, false);
  assert.equal(Z.gates.length, 1);
});

test('(d) wallet_grantPermissions, wallet_sendCalls and the other durable-right methods are gated', async () => {
  const P = page({ decide: () => false });
  P.run(WALLET + `; window.ethereum = new Wallet();`);
  const gated = ['wallet_grantPermissions', 'wallet_sendCalls', 'eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData', 'eth_signTypedData_v1',
    'eth_signTypedData_v3', 'eth_signTypedData_v4', 'eth_sendRawTransaction', 'wallet_requestSnaps',
    'eth_decrypt', 'eth_getEncryptionPublicKey', 'eth_sendUserOperation', 'eth_signUserOperation'];
  for (const m of gated) {
    assert.equal((await settle(P.run(`ethereum.request({ method: '${m}', params: [{ chainId: '0xa86a', calls: [] }] })`))).ok, false, m);
    assert.equal((await settle(P.run(`ethereum.send('${m}', [{}])`))).ok, false, m + ' via send');
  }
  assert.deepEqual(P.gates.map((g) => g.method), gated.flatMap((m) => [m, m]));
  assert.equal(P.run(`ethereum.calls.filter((c) => c.method !== 'eth_chainId').length`), 0);
  // batches : request([...]) and synchronous send([...]) that carry a gated method are refused, never forwarded blind
  assert.equal((await settle(P.run(`ethereum.request([{ method: 'eth_chainId' }, { method: 'eth_sendTransaction', params: ${TXP} }])`))).ok, false);
  assert.throws(() => P.run(`ethereum.send([{ method: 'eth_sendTransaction', params: ${TXP} }])`));
  assert.equal(P.run(`ethereum.calls.filter((c) => c.method !== 'eth_chainId').length`), 0);
  assert.equal((await settle(P.run(`ethereum.enable()`))).ok, true); await sleep(30); assert.ok(P.notes.some((x) => x.method === 'eth_requestAccounts'), 'connection is journalled, not held');
});

test('(f) an identical request cannot replay while the wallet popup is open ; an internal call of the wallet is not asked twice', async () => {
  let allow = true;
  const P = page({ decide: () => allow });
  P.run(WALLET + `; window.ethereum = new Wallet(); ethereum.hang = true; window.other = new Wallet(); window.avalanche = other; other.hang = true;
    window.req = () => ({ method: 'eth_sendTransaction', params: ${TXP} });
    window.first = ethereum.request(req()); first.catch(() => {});`);
  await sleep(40);
  assert.equal(P.gates.length, 1); assert.equal(P.run(`ethereum.calls.filter((c) => c.method === 'eth_sendTransaction').length`), 1, 'approved once, wallet popup open');
  allow = false;
  for (const code of [`ethereum.request(req())`, `ethereum.send('eth_sendTransaction', req().params)`, `Object.getPrototypeOf(ethereum).request.call(ethereum, req())`,
    `other.request(req())`, `ethereum.request(ethereum.calls[ethereum.calls.length - 1])`,
    `(() => { const c = ethereum.calls[ethereum.calls.length - 1]; c.params[0].to = '0x' + 'ee'.repeat(20); return ethereum.request({ method: c.method, params: c.params }); })()`]) {
    const r = await settle(P.run(code));
    assert.equal(r.ok, false, 'replay refused : ' + code);
  }
  assert.equal(P.gates.length, 7, 'every replay was gated again');
  assert.equal(P.run(`ethereum.calls.filter((c) => c.method === 'eth_sendTransaction').length`), 1, 'the wallet saw the request once');
  assert.equal(P.run(`other.calls.filter((c) => c.method === 'eth_sendTransaction').length`), 0, 'another provider gets nothing');
  // legacy entry points that call request() inside the wallet : one gate, one forward
  allow = true;
  const Q = page({ decide: () => true });
  Q.run(WALLET + `; window.ethereum = new Wallet();`);
  assert.equal((await settle(Q.run(`ethereum.send('personal_sign', ['0x00', '0x' + 'a1'.repeat(20)])`))).value, 'result:personal_sign');
  const viaAsync = await settle(Q.run(`new Promise((res, rej) => ethereum.sendAsync({ id: 7, method: 'eth_sendTransaction', params: ${TXP} }, (e, r) => e ? rej(e) : res(r.result)))`));
  assert.equal(viaAsync.value, 'result:eth_sendTransaction');
  assert.deepEqual(Q.gates.map((g) => g.method), ['personal_sign', 'eth_sendTransaction'], 'one gate per request');
  assert.equal(Q.run(`ethereum.calls.filter((c) => c.method !== 'eth_chainId').length`), 2);
  // once the wallet has answered, the same request is a new request
  assert.equal((await settle(Q.run(`ethereum.send('personal_sign', ['0x00', '0x' + 'a1'.repeat(20)])`))).ok, true);
  assert.equal(Q.gates.length, 3);
});

test('(g) dry run : while a request is held, only read methods are relayed to the provider it came through, and nothing after the decision', async () => {
  let P; const got = [];
  const read = (id, n, method, params) => new Promise((res) => {
    const port = P.ctx._port;
    const h = (ev) => { if (ev.data && ev.data.t === 'rpcResult' && ev.data.n === n) { port.removeEventListener('message', h); res(ev.data); } };
    port.addEventListener('message', h); port.postMessage({ t: 'rpc', id, n, k: TOKEN, method, params });
  });
  P = page({ decide: async () => {
    got.push(await read(1, 1, 'eth_call', [{ to: '0x' + 'b2'.repeat(20), data: '0x313ce567' }, 'latest']));
    got.push(await read(1, 2, 'debug_traceCall', [{ to: '0x' + 'b2'.repeat(20) }, 'latest', {}]));
    got.push(await read(1, 3, 'eth_sendTransaction', [{ to: '0x' + 'b2'.repeat(20), value: '0x1' }]));
    got.push(await read(1, 4, 'personal_sign', ['0x00', '0x' + 'a1'.repeat(20)]));
    got.push(await Promise.race([read(99, 5, 'eth_call', []), sleep(60).then(() => 'silence')]));
    return false;
  } });
  P.run(WALLET + `; window.ethereum = new Wallet();`);
  const r = await settle(P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`));
  assert.equal(r.ok, false);
  assert.deepEqual(got.slice(0, 2).map((x) => [x.ok, x.result]), [[true, 'result:eth_call'], [true, 'result:debug_traceCall']]);
  assert.deepEqual(got.slice(2, 4).map((x) => x.ok), [false, false], 'anything that signs or sends is refused');
  assert.equal(got[4], 'silence', 'an id that is not a held request gets no answer');
  assert.deepEqual(JSON.parse(P.run(`JSON.stringify(ethereum.calls.map((c) => c.method).filter((m) => m !== 'eth_chainId'))`)), ['eth_call', 'debug_traceCall'], 'the wallet saw the two reads and nothing else');
  assert.equal(await Promise.race([read(1, 6, 'eth_call', []), sleep(60).then(() => 'silence')]), 'silence', 'once decided, the request no longer opens the relay');
});

// A real wallet is reached through more than one object (a Proxy or a front object before the instance). The request Hold up has just
// forwarded to the first then enters the wrapped method of the second, with another `this` : it must not be asked a second time.
test('(f bis) a wallet reached through two objects : the request forwarded to the first is not asked again by the second', async () => {
  const P = page({ decide: () => true });
  P.run(WALLET + `; window.avalanche = new Wallet();
    window.ethereum = { chainId: avalanche.chainId, seen: 0, request(a) { this.seen++; return avalanche.request(a); } };`);
  await sleep(250); // both globals are wrapped
  const r = await settle(P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`));
  assert.equal(r.ok, true); assert.equal(r.value, 'result:eth_sendTransaction');
  assert.equal(P.gates.length, 1, 'asked once');
  assert.equal(P.run(`avalanche.calls.filter((c) => c.method === 'eth_sendTransaction').length`), 1, 'the instance received it once');
  // the same content sent later by the page to the instance itself is a new request : asked again
  await settle(P.run(`avalanche.request({ method: 'eth_sendTransaction', params: ${TXP} })`));
  assert.equal(P.gates.length, 2, 'a replay by the page is gated');
});

// The shape of a connected MetaMask (13.50) : a Proxy in front of the instance, request and _rpcRequest bound to the instance,
// request() builds a new payload and calls _rpcRequest(payload, cb), which calls _rpcEngine.handle(payload, cb). The provider knows
// its chain, the inner engine has no chainId at all. All three entry points are wrapped : ONE page call must be asked ONCE.
// Before this test existed, the engine's key had no chain part, the pass was refused and the same transaction was asked a second
// time within the same operation ("Tu as déjà donné une autorisation pour ça", seen on app.pangolin.exchange, 11 Oct.).
const METAMASK = (engineChain) => `
  class Engine { constructor() { this.handled = []; ${engineChain ? `this.chainId = '${engineChain}';` : ''} }
    handle(payload, cb) { this.handled.push(payload); cb(null, { id: payload.id, jsonrpc: '2.0', result: 'result:' + payload.method }); } }
  class MetaMask {
    constructor() { this.chainId = '0xa86a'; this.selectedAddress = '0x' + 'a1'.repeat(20); this._rpcEngine = new Engine();
      this.request = this.request.bind(this); this._rpcRequest = this._rpcRequest.bind(this); }
    request(a) { return new Promise((res, rej) => this._rpcRequest({ id: 1, jsonrpc: '2.0', method: a.method, params: a.params }, (e, r) => (e ? rej(e) : res(r.result)))); }
    _rpcRequest(payload, cb) { return this._rpcEngine.handle(payload, cb); }
  }
  window.mm = new MetaMask(); window.ethereum = new Proxy(mm, {});`;
test('(f quater) a connected MetaMask (Proxy, bound request, _rpcRequest, engine without chainId) : one page call is asked once', async () => {
  const P = page({ decide: () => true });
  P.run(METAMASK(''));
  await sleep(250); // the provider, its prototype chain and its engine are wrapped
  const r = await settle(P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`));
  assert.equal(r.ok, true); assert.equal(r.value, 'result:eth_sendTransaction');
  assert.equal(P.gates.length, 1, 'asked once');
  assert.equal(P.run(`mm._rpcEngine.handled.filter((c) => c.method === 'eth_sendTransaction').length`), 1, 'the engine received it once');
  // once the wallet has answered, the same request sent again by the page is a new request : asked again
  await settle(P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`));
  assert.equal(P.gates.length, 2, 'a replay by the page is gated');
  // the page calling the engine itself, with its own object, is gated too
  await settle(P.run(`new Promise((res) => mm._rpcEngine.handle({ id: 9, jsonrpc: '2.0', method: 'eth_sendTransaction', params: ${TXP} }, () => res()))`));
  assert.equal(P.gates.length, 3, 'a direct call to the engine is gated');
});

test('(f quinquies) an inner object that names ANOTHER chain than the provider is asked again (fail closed)', async () => {
  const P = page({ decide: () => true });
  P.run(METAMASK('0x1'));
  await sleep(250);
  const r = await settle(P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`));
  assert.equal(r.ok, true);
  assert.equal(P.gates.length, 2, 'the pass does not cross to another chain');
});

test('(f ter) the pass follows the forwarded object only : a copy handed to the second object is asked again (fail closed)', async () => {
  const P = page({ decide: () => true });
  P.run(WALLET + `; window.avalanche = new Wallet();
    window.ethereum = { chainId: avalanche.chainId, request(a) { return avalanche.request({ method: a.method, params: JSON.parse(JSON.stringify(a.params)) }); } };`);
  await sleep(250);
  const r = await settle(P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`));
  assert.equal(r.ok, true);
  assert.equal(P.gates.length, 2, 'the copy is another request');
});

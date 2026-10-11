// S6 (internal entry points of a wallet) and S10 (provider globals caught at once, window.ethereum not configurable).
// Run : node --test extension/tests/unit/securite_inject_entrees.test.mjs
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { page, sleep, cleanAll, RUNNER, TXP } from './securite_page.mjs';

after(cleanAll);
const TX = `{ method: 'eth_sendTransaction', params: ${TXP} }`;
const BASE = `
  class W {
    constructor() { this.reached = 0; this.chainId = '0x7a69'; this.selectedAddress = '0x' + 'a1'.repeat(20); }
    request(a) { if (a && a.method !== 'eth_chainId') this.reached++; return Promise.resolve('ok'); }
  }`;
// MetaMask-like : request -> _rpcRequest(payload, cb) -> _rpcEngine.handle ; Coinbase-like keeps its own legacy sendAsync
const META = `
  class Meta {
    constructor() { this.reached = 0; this.chainId = '0x7a69'; this.selectedAddress = '0x' + 'a1'.repeat(20); this._rpcEngine = { handle: (req, cb) => { this.reached++; cb(null, { result: 'ok' }); } }; }
    request(a) { return new Promise((res) => this._rpcRequest(a, (e, r) => res(r))); }
    _rpcRequest(payload, cb) { if (payload.method !== 'eth_chainId') this.reached++; cb(null, 'ok'); }
  }`;

test('S6 : _rpcRequest and _rpcEngine.handle are gated like request (refused by the bridge : the wallet is not reached)', async () => {
  const P = page({ decide: () => false });
  P.run(RUNNER + META + `; window.ethereum = new Meta(); window.cbs = 0;`);
  P.run(`ethereum._rpcRequest(${TX}, () => { cbs++; }); ethereum._rpcEngine.handle(${TX}, () => { cbs++; });`);
  await sleep(500);
  assert.equal(P.gates.length, 2, 'both went to the bridge');
  assert.equal(P.run('ethereum.reached'), 0);
  assert.equal(P.run('cbs'), 2, 'the callbacks were answered with a refusal');
});
test('S6 : allowed, the internal entry point works and the public request() is asked once, not twice', async () => {
  const P = page({ decide: () => true });
  P.run(RUNNER + META + `; window.ethereum = new Meta();`);
  P.run(`__go('a', () => ethereum.request(${TX}))`);
  await sleep(500);
  assert.equal(P.run('__out.a.value'), 'ok');
  assert.equal(P.gates.length, 1, 'request() delegating to _rpcRequest is one window');
  assert.equal(P.run('ethereum.reached'), 1);
  P.run(`window.r2 = null; ethereum._rpcRequest(${TX}, (e, r) => { r2 = r; })`);
  await sleep(200);
  assert.equal(P.gates.length, 2); assert.equal(P.run('r2'), 'ok');
  P.run(`window.r3 = null; ethereum._rpcRequest({ method: 'eth_blockNumber' }, (e, r) => { r3 = r; })`);
  await sleep(100);
  assert.equal(P.gates.length, 2, 'a read is not held'); assert.equal(P.run('r3'), 'ok');
});

test('S10 : a provider global assigned late (okxwallet, rabby, ...) is gated at once, with no wait for the sweep', async () => {
  for (const name of ['okxwallet', 'trustwallet', 'coinbaseWalletExtension', 'rabby', 'BinanceChain', 'tokenpocket', 'bitkeep', 'avalanche']) {
    const P = page({ decide: () => false });
    P.run(RUNNER + BASE + `; window.raw = new W(); window.${name} = raw;`);
    P.run(`__go('a', () => ${name}.request(${TX})); __go('b', () => raw.request(${TX}));`); // same tick : before any sweep
    await sleep(120);
    assert.equal(P.run('raw.reached'), 0, name);
    assert.equal(P.gates.length, 2, name);
  }
});
test('S10 : defined with Object.defineProperty or Reflect.defineProperty (a value, not configurable) : still gated', async () => {
  for (const how of [
    `Object.defineProperty(window, 'okxwallet', { value: raw, configurable: false, writable: false })`,
    `Reflect.defineProperty(window, 'rabby', { value: raw, configurable: false })`,
    `Object.defineProperties(window, { BinanceChain: { value: raw } })`
  ]) {
    const P = page({ decide: () => false });
    P.run(RUNNER + BASE + `; window.raw = new W(); ${how};`);
    P.run(`__go('a', () => raw.request(${TX}))`);
    await sleep(100);
    assert.equal(P.run('raw.reached'), 0, how); assert.equal(P.gates.length, 1, how);
  }
});
test('S10 : window.ethereum defined AFTER inject.js as a non configurable value : redirected to the gated slot', async () => {
  for (const frozen of [false, true]) {
    const P = page({ decide: () => false });
    P.run(RUNNER + BASE + `; window.raw = new W(); ${frozen ? 'Object.freeze(raw);' : ''}
      Object.defineProperty(window, 'ethereum', { value: raw, configurable: false, writable: false });`);
    P.run(`__go('a', () => ethereum.request(${TX}))`);
    await sleep(100);
    assert.equal(P.run('raw.reached'), 0, 'frozen=' + frozen); assert.equal(P.gates.length, 1, 'frozen=' + frozen);
    if (!frozen) { P.run(`__go('b', () => raw.request(${TX}))`); await sleep(100); assert.equal(P.gates.length, 2, 'the raw object itself is patched too'); }
  }
});
test('S10 : window.ethereum already non configurable BEFORE inject.js (a wallet that ran first) with a patchable request : gated in place', async () => {
  const P = page({ decide: () => false, before: BASE + `; window.raw = new W(); Object.defineProperty(window, 'ethereum', { value: raw, configurable: false });` });
  P.run(RUNNER);
  P.run(`__go('a', () => ethereum.request(${TX}))`);
  await sleep(100);
  assert.equal(P.run('raw.reached'), 0); assert.equal(P.gates.length, 1);
});

// ---- S6 bis : wallet-specific direct entry points, no second window
const DIRECT = `
  class Direct {
    constructor() { this.reached = 0; this.chainId = '0x7a69'; this.selectedAddress = '0x' + 'a1'.repeat(20); }
    request(a) { if (a.method !== 'eth_chainId') this.reached++; return Promise.resolve('hash'); }
    sendTransaction(tx) { return this.request({ method: 'eth_sendTransaction', params: [tx] }); }   // delegates to request() with the same object
  }
  class Own {
    constructor() { this.reached = 0; this.chainId = '0x7a69'; }
    request(a) { return Promise.resolve('x'); }
    sendTransaction(tx) { this.reached++; return Promise.resolve('hash'); }                          // never goes through request()
  }`;
const TXO = `{ from: '0x' + 'a1'.repeat(20), to: '0x' + 'b2'.repeat(20), value: '0x1' }`;
test('S6 : provider.sendTransaction(tx) is gated, by a wallet that has its own engine and by one that delegates to request()', async () => {
  for (const cls of ['Direct', 'Own']) {
    const P = page({ decide: () => false });
    P.run(RUNNER + DIRECT + `; window.ethereum = new ${cls}();`);
    P.run(`__go('a', () => ethereum.sendTransaction(${TXO}))`);
    await sleep(150);
    assert.equal(P.gates.length, 1, cls); assert.equal(P.gates[0].method, 'eth_sendTransaction'); assert.equal(P.run('ethereum.reached'), 0, cls); assert.equal(P.run('__out.a.error.code'), 4001);
  }
});
test('S6 : allowed, sendTransaction delegating to request() opens ONE window and reaches the wallet once', async () => {
  for (const cls of ['Direct', 'Own']) {
    const P = page({ decide: () => true });
    P.run(RUNNER + DIRECT + `; window.ethereum = new ${cls}();`);
    P.run(`__go('a', () => ethereum.sendTransaction(${TXO}))`);
    await sleep(200);
    assert.equal(P.gates.length, 1, cls + ' : one gate'); assert.equal(P.run('ethereum.reached'), 1, cls); assert.equal(P.run('__out.a.value'), 'hash');
  }
});

// ---- S10 bis : a provider that cannot be patched behind a non configurable window.ethereum is SAID, not hidden
test('S10 : non configurable window.ethereum with a frozen provider before inject.js : "interception partielle" is reported ; a patchable one is not', async () => {
  const frozen = page({ decide: () => false, before: `; class Own2 { constructor() { this.request = (a) => Promise.resolve(1); Object.freeze(this); } }; window.raw = new Own2(); Object.defineProperty(window, 'ethereum', { value: raw, configurable: false });` });
  await sleep(150);
  assert.ok(frozen.notes.some((x) => x.method === 'interception_partielle'), JSON.stringify(frozen.notes));
  assert.equal(frozen.notes.filter((x) => x.method === 'interception_partielle').length, 1, 'once');
  const fine = page({ decide: () => false, before: BASE + `; window.raw = new W(); Object.defineProperty(window, 'ethereum', { value: raw, configurable: false });` });
  await sleep(150);
  assert.ok(!fine.notes.some((x) => x.method === 'interception_partielle'));
});

// ---- S11 : network switched while the request is held ; S12 : adding a network is held
test('S11 : the page switches network while the request is held : refused (4900), the wallet is not reached', async () => {
  let release; const held = new Promise((r) => { release = r; });
  const P = page({ decide: () => held });
  P.run(RUNNER + BASE + `; window.ethereum = new W();`);
  P.run(`__go('a', () => ethereum.request(${TX}))`);
  await sleep(200); assert.equal(P.gates.length, 1);
  P.run(`ethereum.chainId = '0xa86a'`);
  release(true); await sleep(300);
  assert.equal(P.run('__out.a.ok'), false); assert.equal(P.run('__out.a.error.code'), 4900); assert.equal(P.run('ethereum.reached'), 0);
  const Q = page({ decide: () => true });
  Q.run(RUNNER + BASE + `; window.ethereum = new W();`);
  Q.run(`__go('a', () => ethereum.request(${TX}))`); await sleep(300);
  assert.equal(Q.run('ethereum.reached'), 1, 'same network : goes through');
});
test('S12 : wallet_addEthereumChain is held ; wallet_switchEthereumChain still is not', async () => {
  const P = page({ decide: () => false });
  P.run(RUNNER + BASE + `; window.ethereum = new W();`);
  P.run(`__go('a', () => ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: '0x1234', rpcUrls: ['https://evil.example'] }] })); __go('b', () => ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x1' }] }));`);
  await sleep(300);
  assert.deepEqual(P.gates.map((g) => g.method), ['wallet_addEthereumChain']); assert.equal(P.run('ethereum.reached'), 1, 'only the switch reached the wallet');
});

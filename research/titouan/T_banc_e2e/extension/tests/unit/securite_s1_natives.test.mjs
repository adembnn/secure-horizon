// S1 (revue de securite n2) : inject.js tourne dans le monde MAIN, il partage les prototypes natifs avec la page.
// Une page qui remplace une methode native APRES le chargement ne doit JAMAIS faire sauter la retenue ni fabriquer une decision.
// Chaque methode piegee compte ses appels (__hit) : inject.js ne doit en appeler aucune dans ses chemins de securite.
// Run : node --test extension/tests/unit/securite_s1_natives.test.mjs
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIR } from './fake_chrome.mjs';
import { page, sleep, cleanAll, RUNNER, TXP } from './securite_page.mjs';

after(cleanAll);

// Wallet that touches no trapped method itself (counters, async function, no Promise.* / .then / array methods).
const WALLET_S = `
  class WalletS {
    constructor() { this.reached = 0; this.seen = ''; this.chainId = '0x7a69'; this.selectedAddress = '0x' + 'a1'.repeat(20); this.request = this.request.bind(this); }
    async request(a) { if (a && a.method !== 'eth_chainId') { this.reached++; this.seen = a.params && a.params[0] && a.params[0].to; } return 'ok'; }
    send(m, p) { return typeof m === 'string' ? this.request({ method: m, params: p }) : this.sendAsync(m, p); }
    sendAsync(payload, cb) { if (payload && payload.length === undefined) { if (payload.method !== 'eth_chainId') this.reached++; } else { for (let i = 0; i < payload.length; i++) if (payload[i].method !== 'eth_chainId') this.reached++; } cb(null, { id: payload.id, jsonrpc: '2.0', result: 'ok' }); }
    enable() { return this.request({ method: 'eth_requestAccounts' }); }
  }`;
const SETUP = RUNNER + WALLET_S + `; window.ethereum = new WalletS(); window.__hit = 0; window.__names = '';`;

// [object expression, method names]
const TARGETS = [
  ['Set.prototype', ['has', 'add', 'delete', 'forEach']],
  ['Map.prototype', ['get', 'set', 'has', 'delete', 'forEach']],
  ['WeakMap.prototype', ['get', 'set', 'has', 'delete']],
  ['WeakSet.prototype', ['has', 'add', 'delete']],
  ['Array.prototype', ['map', 'forEach', 'find', 'findIndex', 'filter', 'some', 'every', 'reduce', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'concat', 'join', 'indexOf', 'includes', 'keys', 'values', 'entries', 'sort', 'reverse', 'fill']],
  ['Promise.prototype', ['then', 'catch', 'finally']],
  ['Promise', ['resolve', 'reject', 'all', 'race', 'allSettled', 'any']],
  ['Function.prototype', ['call', 'apply', 'bind']],
  ['Object', ['keys', 'values', 'entries', 'assign', 'freeze', 'create', 'getPrototypeOf', 'getOwnPropertyDescriptor', 'getOwnPropertyDescriptors', 'getOwnPropertyNames', 'isFrozen', 'fromEntries', 'setPrototypeOf', 'is']],
  ['Object.prototype', ['hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'valueOf', 'toLocaleString']],
  ['Reflect', ['apply', 'get', 'set', 'ownKeys', 'deleteProperty', 'getPrototypeOf', 'getOwnPropertyDescriptor', 'has', 'construct']],
  ['JSON', ['stringify', 'parse']],
  ['String.prototype', ['charCodeAt', 'slice', 'indexOf', 'split', 'replace', 'concat', 'startsWith', 'toLowerCase', 'trim', 'at']],
  ['RegExp.prototype', ['test', 'exec']]
];
const trapCode = TARGETS.map(([obj, names]) => names.map((n) => `try { const o = ${obj}; if (typeof o[${JSON.stringify(n)}] === 'function') Object.defineProperty(o, ${JSON.stringify(n)}, { value: function () { __hit++; __names += ' ${obj}.${n}'; return false; }, writable: true, configurable: true }); } catch (e) {}`).join('\n')).join('\n')
  + `\nglobalThis.Error = function () { __hit++; };`
  + `\nArray.prototype[Symbol.iterator] = function () { __hit++; return { next() { return { done: true }; } }; };`
  // properties that code reading an object with a missing property would inherit from Object.prototype
  + `\nconst __slots = ['then','has','construct','apply','defineProperty','deleteProperty','ownKeys','getPrototypeOf','isExtensible','preventExtensions','setPrototypeOf','getOwnPropertyDescriptor','allow','reason','k','t','ports','cb','acked','ctx','rawRequest'];`
  + `\nfor (let i = 0; i < __slots.length; i++) { const n = __slots[i]; Object.defineProperty(Object.prototype, n, { __proto__: null, get() { __hit++; __names += ' get:' + n; }, set() { __hit++; __names += ' set:' + n; }, configurable: true }); }`;

const FORMS = {
  request: `ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} })`,
  send: `ethereum.send('eth_sendTransaction', ${TXP})`,
  sendAsync: `new Promise((res) => ethereum.sendAsync({ id: 1, jsonrpc: '2.0', method: 'eth_sendTransaction', params: ${TXP} }, function (e, r) { res(e ? 'error' : 'ok'); }))`,
  sendAsyncBatch: `new Promise((res) => ethereum.sendAsync([{ id: 1, jsonrpc: '2.0', method: 'eth_sendTransaction', params: ${TXP} }, { id: 2, jsonrpc: '2.0', method: 'eth_chainId' }], function (e, r) { res(e ? 'error' : 'ok'); }))`,
  sign: `ethereum.request({ method: 'personal_sign', params: ['0x00', '0x' + 'a1'.repeat(20)] })`,
  batch: `ethereum.request([{ method: 'eth_sendTransaction', params: ${TXP} }])`
};
const NAMES = Object.keys(FORMS);

async function scenario(decide, pollute) {
  const P = page({ decide });
  P.run(SETUP);
  if (pollute) P.run(trapCode);
  for (const n of NAMES) P.run(`__go(${JSON.stringify(n)}, () => ${FORMS[n]})`);
  await sleep(300);
  return P;
}
const out = (P, n) => P.run(`__out[${JSON.stringify(n)}]`);

test('S1 : the harness itself is sound (no pollution, bridge refuses : nothing reaches the wallet, every gated form was held)', async () => {
  const P = await scenario(() => false, false);
  assert.equal(P.run('ethereum.reached'), 0);
  assert.equal(P.gates.length, 5, 'request, send, sendAsync, batch sendAsync, personal_sign (the request batch is refused before the bridge)');
  assert.equal(out(P, 'batch').ok, false);
  assert.equal(out(P, 'request').ok, false);
});

test('S1 : every native method and every Object.prototype slot trapped by the page : the bridge still gets the request, the wallet is never reached, no trapped method is ever called by inject.js', async () => {
  const P = await scenario(() => false, true);
  assert.equal(P.run('ethereum.reached'), 0, 'nothing reached the wallet');
  assert.equal(P.gates.length, 5, 'every form still went to the bridge');
  assert.equal(P.run('__hit'), 0, 'inject.js called a method the page can replace :' + P.run('__names'));
});

test('S1 : same pollution, the bridge allows : each form reaches the wallet exactly once and answers', async () => {
  const P = await scenario(() => true, true);
  assert.equal(P.run('ethereum.reached'), 5, 'request, send, personal_sign, sendAsync, and the gated item of the batch sendAsync');
  assert.equal(P.gates.length, 5);
  assert.equal(P.run('__hit'), 0, P.run('__names'));
  for (const n of ['request', 'send', 'sign', 'sendAsync']) assert.equal(out(P, n).value, 'ok', n);
  assert.equal(out(P, 'batch').ok, false, 'a batch with a gated method is refused');
});

test('S1 : a decision forged through a replaced native is worthless (r01 scenarios with the real token protocol)', async () => {
  for (const pollute of [
    'Set.prototype.has = function () { return false; }',
    'Array.prototype.map = function () { return [Promise.resolve({ allow: true })]; }',
    'const o = Promise.prototype.then; Promise.prototype.then = function (f, r) { try { if (typeof f === "function") return o.call(Promise.resolve({ allow: true }), f, r); } catch (e) {} return o.call(this, f, r); }',
    'Map.prototype.get = function () { return { allow: true, resolve() {}, cb() {} }; }; Map.prototype.has = function () { return true; }',
    'WeakMap.prototype.get = function () { return "x"; }; WeakMap.prototype.has = function () { return true; }; WeakSet.prototype.has = function () { return true; }',
    'Function.prototype.call = function () { return { allow: true }; }; Function.prototype.apply = Function.prototype.call; Function.prototype.bind = Function.prototype.call'
  ]) {
    const P = page({ decide: () => false });
    P.run(SETUP);
    P.run(pollute);
    P.run(`__go('a', () => ${FORMS.request}); __go('b', () => ${FORMS.send}); __go('c', () => ${FORMS.sendAsync});`);
    await sleep(250);
    assert.equal(P.run('ethereum.reached'), 0, pollute);
    assert.equal(P.gates.length, 3, pollute);
  }
});

test('S1 : MessagePort.prototype replaced by the page (postMessage, addEventListener, start) : inject.js never calls the page version', async () => {
  const P = page({ decide: () => false });
  P.run(SETUP);
  // the ports of this harness are host objects : the traps count only the calls made ON inject.js own ports (even indexes of P.ports)
  const proto = Object.getPrototypeOf(P.ports[0]);
  const saved = {}; let leaked = 0;
  for (const n of ['postMessage', 'addEventListener', 'start']) {
    saved[n] = proto[n];
    proto[n] = function (...a) { if (P.ports.indexOf(this) % 2 === 0) leaked++; return saved[n].apply(this, a); };
  }
  try {
    P.run(`__go('a', () => ${FORMS.request}); __go('b', () => ${FORMS.sendAsync});`);
    await sleep(250);
  } finally { for (const n of Object.keys(saved)) proto[n] = saved[n]; }
  assert.equal(leaked, 0, 'inject.js used a replaceable MessagePort method');
  assert.equal(P.gates.length, 2); assert.equal(P.run('ethereum.reached'), 0);
});

test('S1 : toJSON planted on Object.prototype cannot make the wallet receive something else than what was judged', async () => {
  const P = page({ decide: () => true });
  P.run(RUNNER + WALLET_S + `; window.ethereum = new WalletS();
    window.EVIL = '0x' + 'ee'.repeat(20); window.n = 0;
    Object.defineProperty(Object.prototype, 'toJSON', { configurable: true, value: function () { n++; const c = {}; for (const k of Object.keys(this)) c[k] = this[k]; if (n > 3 && c.to) c.to = EVIL; return c; } });`);
  P.run(`__go('a', () => ethereum.request({ method: 'eth_sendTransaction', params: ${TXP} }))`);
  await sleep(250);
  assert.equal(P.run('ethereum.reached'), 1);
  const judged = P.gates[0].params[0].to;
  const got = P.run('ethereum.seen');
  assert.equal(got, judged, 'the wallet received the judged recipient');
  assert.notEqual(got, '0x' + 'ee'.repeat(20));
});

test('S1 : an object with no own "method" cannot borrow one from Object.prototype (stateful getter) : refused, wallet not reached', async () => {
  const P = page({ decide: () => true });
  P.run(RUNNER + WALLET_S + `; window.ethereum = new WalletS(); window.k = 0;
    Object.defineProperty(Object.prototype, 'method', { configurable: true, get() { return ++k === 1 ? 'eth_chainId' : 'eth_sendTransaction'; } });`);
  P.run(`__go('a', () => ethereum.request({ params: [] }))`);
  await sleep(150);
  assert.equal(P.run('__out.a.ok'), false);
  assert.equal(P.run('ethereum.reached'), 0);
});

// (Node's vm global cannot survive a polluted Object.prototype.get / value / writable for long : the pollution below is transient, inside one synchronous block.)
test('S1 : handler traps planted on Object.prototype cannot reach the original function through the wrapper proxy', async () => {
  const P = page({ decide: () => false });
  P.run(RUNNER + WALLET_S + `; window.ethereum = new WalletS(); window.leak = 0;`);
  P.run(`(() => { const names = ['get', 'set', 'has', 'apply', 'construct', 'defineProperty', 'getOwnPropertyDescriptor', 'ownKeys', 'getPrototypeOf', 'deleteProperty'];
    const f = ethereum.request;
    for (let i = 0; i < names.length; i++) Object.defineProperty(Object.prototype, names[i], { __proto__: null, configurable: true, value: function (t) { leak++; globalThis.captured = t; return t; } });
    try { void f.name; void f.length; void Object.keys(f); void ('x' in f); void Object.getOwnPropertyDescriptor(f, 'name'); void Object.getPrototypeOf(f); }
    finally { for (let i = 0; i < names.length; i++) delete Object.prototype[names[i]]; } })()`);
  assert.equal(P.run('leak'), 0, 'no handler trap is looked up on Object.prototype');
  assert.equal(P.run('typeof captured'), 'undefined');
});

test('S1 : descriptor fields planted on Object.prototype while a wallet is installed : the wallet is still wrapped', async () => {
  const P = page({ decide: () => false });
  P.run(RUNNER + WALLET_S);
  P.run(`(() => { const names = ['value', 'get', 'set', 'writable', 'enumerable', 'configurable'];
    for (let i = 0; i < names.length; i++) { const n = names[i]; Object.defineProperty(Object.prototype, n, { __proto__: null, configurable: true, get() { return n === 'get' || n === 'set' ? function () {} : n === 'value' ? 1 : false; }, set() {} }); }
    try { window.ethereum = new WalletS(); window.ethereum.request; }
    finally { for (let i = 0; i < names.length; i++) delete Object.prototype[names[i]]; } })()`);
  P.run(`__go('a', () => ${FORMS.request})`);
  await sleep(150);
  assert.equal(P.run('ethereum.reached'), 0); assert.equal(P.gates.length, 1);
});

// ---- static : inject.js outside the NATIVES zone calls no method of a page-modifiable object -----------------------------------
test('S1 static : outside the NATIVES zone, no dotted call of a replaceable native, no for...of, no destructuring, no spread, no Promise.*, no await', () => {
  const src = readFileSync(join(DIR, 'inject.js'), 'utf8');
  const b = src.indexOf('/* NATIVES-BEGIN */'), e = src.indexOf('/* NATIVES-END */');
  assert.ok(b > 0 && e > b, 'the NATIVES zone exists');
  const code = (src.slice(0, b) + '\n' + src.slice(e)).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
  const bad = [];
  const forbidden = /\.(has|get|set|add|delete|then|catch|finally|map|forEach|filter|find|findIndex|some|every|reduce|push|pop|shift|unshift|slice|splice|concat|join|indexOf|includes|test|exec|call|apply|bind|keys|values|entries|assign|freeze|create|resolve|reject|all|race|allSettled|postMessage|addEventListener|removeEventListener|stopImmediatePropagation|charCodeAt|hasOwnProperty|toString|stringify|parse|startsWith|replace|split|toLowerCase|trim)\s*\(/g;
  for (const m of code.matchAll(forbidden)) bad.push(m[0]);
  for (const [re, name] of [[/for\s*\(\s*(const|let|var)\s+[^;)]*\bof\b/g, 'for...of'], [/\b(const|let|var)\s*[\[{]/g, 'destructuring'], [/\.\.\./g, 'spread'], [/\b(Promise|NativePromise|Reflect|JSON|Object|Array|Math)\.\w+\s*\(/g, 'static call'], [/\bawait\b|\basync\b/g, 'async']]) {
    for (const m of code.matchAll(re)) bad.push(name + ' : ' + m[0]);
  }
  // the only direct uses allowed : O.prototype (non writable) and the three hooks installed on purpose
  for (const m of code.matchAll(/\b(O|R|P)\.\w+/g)) if (!/^(O\.prototype|O\.defineProperty|R\.defineProperty|O\.defineProperties)$/.test(m[0])) bad.push('direct use of ' + m[0]);
  assert.deepEqual(bad, [], 'forbidden pattern(s) in inject.js : ' + bad.join(' | '));
});

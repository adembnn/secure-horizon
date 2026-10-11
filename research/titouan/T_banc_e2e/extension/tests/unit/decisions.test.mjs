// The eight product decisions of 11 Oct., one test each, then the two demo cases. Fake chrome, no browser, no network, no model :
// the sentence is classified by the embedded keyword parser (classify absent).
// The engine is a stub that always answers "attention" : every rule checked here lives in the extension (written_check.js,
// gatekeeper.js, outcome.js, ui/screen.js), so both builds give the same answer. HOLDUP_ENGINE=<built extension dir> swaps the
// stub for the embedded engine of the standalone build (used by extension_standalone/tests/run_tests.mjs).
// Run : node --test extension/tests/unit/*.test.mjs
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeChrome, fakeClock, load, DIR } from './fake_chrome.mjs';

const { createGatekeeper } = await load('gatekeeper.js');
const W = await load('written_check.js');
// HOLDUP_SERVER=<server.mjs> does the same with the engine of the server mode (the one the source extension asks over HTTP).
const CORE = process.env.HOLDUP_ENGINE ? await import(pathToFileURL(join(process.env.HOLDUP_ENGINE, 'engine', 'sentinelle_core.js')).href) : null;
const SERVER = process.env.HOLDUP_SERVER ? await import(pathToFileURL(process.env.HOLDUP_SERVER).href) : null;
const REAL = CORE || SERVER;

const SITE = 'https://echange.exemple.org';
const ME = '0x' + 'a1'.repeat(20), USDC = '0x' + 'c3'.repeat(20), ROUTER = '0x' + 'd4'.repeat(20), FRIEND = '0x' + 'e5'.repeat(20), OTHER = '0x' + 'e5e4'.repeat(10);
const pad = (x) => (typeof x === 'bigint' ? x.toString(16) : String(x).replace(/^0x/, '')).padStart(64, '0');
const send = (to, data, value) => ({ method: 'eth_sendTransaction', params: [Object.assign({ from: ME, to }, data ? { data } : {}, value ? { value } : {})], chainId: '0xa869', from: ME });
const MAX = 2n ** 256n - 1n, U = 10n ** 6n;
const approve = (amount) => send(USDC, '0x095ea7b3' + pad(ROUTER) + pad(amount));
const transfer = (to, amount) => send(USDC, '0xa9059cbb' + pad(to) + pad(amount));
const SWAP = send(ROUTER, '0x38ed1739' + pad(50n * U) + pad(1n) + pad(0xa0n) + pad(ME) + pad(0xffffffffn) + pad(2n) + pad(USDC) + pad(ROUTER));
const permit = (value) => ({ method: 'eth_signTypedData_v4', chainId: '0xa869', from: ME, params: [ME, JSON.stringify({
  types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
    Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: 43113, verifyingContract: USDC },
  message: { owner: ME, spender: ROUTER, value: value.toString(), nonce: '0', deadline: '1999999999' } })] });
const hex = (s) => '0x' + Buffer.from(s, 'utf8').toString('hex');
const siwe = (domain, uri) => domain + ' wants you to sign in with your Ethereum account:\n' + ME + '\n\nConnexion au site.\n\nURI: ' + uri + '\nVersion: 1\nChain ID: 43113\nNonce: 8f3a91c27be04d55\nIssued At: 2026-10-11T06:00:00Z';

let F, clock, n = 0, engineCalls;
beforeEach(() => { clock = fakeClock(); F = makeChrome(); globalThis.chrome = F.chrome; engineCalls = 0; });
afterEach(() => { clock.restore(); delete globalThis.chrome; });
function worker(level = 'attention', extra = {}) {
  const stub = async () => ({ level, texts: { croit: 'a', reel: 'Ligne du moteur.', danger: 'c', action: 'd' }, reasons: [], effects: { grants_right: true, funds_out: false }, risk_signals: [], ...extra });
  const real = async (body) => (CORE ? CORE.check(body, CORE.sanitizeLocalContext((await F.chrome.storage.local.get('contexte')).contexte))
    : SERVER.evaluate(JSON.parse(JSON.stringify(body)), { contacts: [], history: [], protected: [], knownSpenders: [] }));
  return createGatekeeper({ check: async (body) => { engineCalls++; return (REAL ? real : stub)(body); } });
}
const winOf = (rid) => { for (const [id, o] of F.state.windows) if (o.url.endsWith('window.html#' + rid)) return id; return null; };
async function gate(payload, origin = SITE, frameId = 0) {
  const rid = 'rid-dec-' + String(++n).padStart(5, '0'), page = F.page(40 + n, origin, frameId);
  const r = await F.send({ type: 'gate', rid, pageText: 'Approve 999 USDC to 0xdead', payload: Object.assign({ kind: 'gate' }, payload) }, page);
  const g = { rid, page, r, win: () => winOf(rid) };
  g.view = async () => (await F.send({ type: 'hu.view', rid }, F.win(winOf(rid), rid))).view;
  g.write = async (text) => { clock.advance(1000); const v = await g.view(); return F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'answer', text }, F.win(winOf(rid), rid)); };
  g.go = async () => { const v = await g.view(); return F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'continue', phraseOk: true }, F.win(winOf(rid), rid)); };
  g.poll = () => F.send({ type: 'hu.poll', rid }, page);
  return g;
}
// The context the demo site installs (a test token of the local chain) : no address lives in the product code.
const knowToken = () => F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [], tokens: [{ address: USDC, symbol: 'USDC', decimals: 6 }] } });

// ---- the surface script (ui/screen.js) in a tiny DOM : enough to see which controls exist
function surface() {
  const mk = (tag) => { const e = { tag, children: [], attrs: {}, listeners: {}, classList: { add() {} }, hidden: false, textContent: '', value: '',
    appendChild(c) { e.children.push(c); c.parent = e; return c; }, removeChild(c) { e.children.splice(e.children.indexOf(c), 1); },
    setAttribute(k, v) { e.attrs[k] = String(v); }, getAttribute(k) { return k in e.attrs ? e.attrs[k] : null; }, removeAttribute(k) { delete e.attrs[k]; },
    addEventListener(t, f) { (e.listeners[t] = e.listeners[t] || []).push(f); }, focus() {} };
    Object.defineProperty(e, 'firstChild', { get: () => e.children[0] || null }); return e; };
  const timers = [];
  const sb = { document: { createElement: mk }, setTimeout: (f, ms) => { timers.push({ f, ms }); return timers.length; }, clearTimeout: (i) => { if (timers[i - 1]) timers[i - 1].f = null; },
    setInterval: () => 0, clearInterval: (i) => { if (timers[i - 1]) timers[i - 1].f = null; }, Date };
  sb.window = sb; vm.createContext(sb); vm.runInContext(readFileSync(join(DIR, 'ui', 'screen.js'), 'utf8'), sb);
  const root = mk('div'), calls = [];
  const ui = sb.HoldupScreen.mount(root, { onSubmit: (t) => calls.push(['submit', t]), onCancel: () => calls.push(['cancel']), onContinue: () => calls.push(['continue']) });
  const all = (e, out = []) => { out.push(e); for (const c of e.children) all(c, out); return out; };
  return { ui, calls, timers, find: (tag) => all(root).filter((e) => e.tag === tag), texts: () => all(root).map((e) => e.textContent).filter(Boolean) };
}

test('decision 1 : a window only for what moves value or grants a right ; connection, reads and network changes pass straight through', async () => {
  // page side : the methods that never ask anything
  const timers = new Set(), ports = [];
  const sb = { console, clearTimeout, clearInterval, addEventListener() {}, dispatchEvent() { return true; }, gates: [],
    setTimeout: (f, ms, ...a) => { const t = setTimeout(f, ms, ...a); timers.add(t); return t; }, setInterval: (f, ms) => { const t = setInterval(f, ms); timers.add(t); return t; },
    MessageChannel: class { constructor() { const c = new MessageChannel(); ports.push(c.port1, c.port2); this.port1 = c.port1; this.port2 = c.port2; } } };
  sb.postMessage = (data, origin, transfer) => { if (!data || data.__sentinelle !== 'hello' || sb.port) return; sb.port = transfer[0];
    sb.port.onmessage = (ev) => { const m = ev.data; if (m.t !== 'gate') return; sb.port.postMessage({ t: 'ack', id: m.id }); sb.gates.push(m.payload.method); sb.port.postMessage({ t: 'result', id: m.id, allow: false, reason: 'denied' }); };
    sb.port.postMessage({ t: 'ready' }); };
  sb.window = sb; sb.top = sb; sb.self = sb; sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext('class CustomEvent { constructor(t, i) { this.type = t; this.detail = i && i.detail; } }; globalThis.CustomEvent = CustomEvent;'
    + 'window.ethereum = { calls: [], async request(a) { this.calls.push(a.method); return "ok:" + a.method; } };', sb);
  vm.runInContext(readFileSync(join(DIR, 'inject.js'), 'utf8'), sb);
  const free = ['eth_requestAccounts', 'eth_accounts', 'eth_chainId', 'eth_call', 'eth_getBalance', 'eth_blockNumber', 'wallet_switchEthereumChain', 'wallet_addEthereumChain', 'wallet_requestPermissions'];
  for (const m of free) assert.equal(await vm.runInContext(`ethereum.request({ method: '${m}', params: [{ chainId: '0xa869' }] })`, sb), 'ok:' + m, m + ' reaches the wallet directly');
  assert.deepEqual(sb.gates, [], 'none of them is held');
  for (const m of ['eth_sendTransaction', 'eth_signTypedData_v4', 'eth_signTypedData', 'personal_sign']) await vm.runInContext(`ethereum.request({ method: '${m}', params: [{}] })`, sb).catch(() => {});
  assert.deepEqual(sb.gates, ['eth_sendTransaction', 'eth_signTypedData_v4', 'eth_signTypedData', 'personal_sign'], 'these are held');
  for (const t of timers) { clearTimeout(t); clearInterval(t); } for (const x of ports) { try { x.close(); } catch (_) {} }

  // worker side : a recognised Sign-In with Ethereum for this very site opens no window ; anything else does
  worker();
  const login = await gate({ method: 'personal_sign', params: [hex(siwe('echange.exemple.org', SITE + '/login')), ME] });
  assert.deepEqual(login.r, { done: true, allow: true }); assert.equal(login.win(), null, 'no window for a connection'); assert.equal(engineCalls, 0);
  const plain = await gate({ method: 'personal_sign', params: [siwe('echange.exemple.org', SITE), ME] });
  assert.deepEqual(plain.r, { done: true, allow: true }, 'same message given as plain text');
  for (const [what, params, origin, frame] of [
    ['a sign-in message naming another site', [hex(siwe('banque.exemple.com', 'https://banque.exemple.com')), ME], SITE, 0],
    ['a sign-in whose URI is elsewhere', [hex(siwe('echange.exemple.org', 'https://ailleurs.exemple.net')), ME], SITE, 0],
    ['a sign-in for another account than the signer', [hex(siwe('echange.exemple.org', SITE)), FRIEND], SITE, 0],
    ['a sign-in asked by an inner frame', [hex(siwe('echange.exemple.org', SITE)), ME], SITE, 3],
    ['a free message', [hex('I authorize the transfer of all my assets'), ME], SITE, 0]]) {
    const g = await gate({ method: 'personal_sign', params }, origin, frame);
    assert.deepEqual(g.r, { pending: true }, what); assert.ok(g.win(), what + ' : window');
  }
  for (const p of [approve(50n * U), transfer(FRIEND, U), SWAP, permit(MAX)]) { const g = await gate(p, 'https://autre' + n + '.exemple.org'); assert.deepEqual(g.r, { pending: true }); assert.ok(g.win()); }
  assert.equal(W.signIn('eth_sendTransaction', [hex(siwe('echange.exemple.org', SITE)), ME], SITE), false);
});

test('decision 2 : the first screen shows the site name given by the browser and nothing of the request', async () => {
  worker();
  const g = await gate(Object.assign({ origin: 'https://banque-officielle.example', url: 'https://banque-officielle.example' }, approve(MAX)));
  const v = await g.view();
  assert.equal(v.stage, 'intent');
  assert.deepEqual(Object.keys(v.screen).sort(), ['kind', 'placeholder', 'title']);
  assert.equal(v.screen.title, 'Que veux-tu faire sur echange.exemple.org ?', 'the origin comes from the sender, never from the page');
  const shown = v.screen.title + ' ' + v.screen.placeholder;
  for (const secret of [USDC, ROUTER, ME, 'approve', 'Approve', '999', '0xdead', 'banque-officielle', 'illimité', 'eth_sendTransaction']) assert.ok(!shown.includes(secret), 'not shown : ' + secret);
  const S = surface(); S.ui.show(v.screen, 'intent:1');
  assert.deepEqual(S.texts(), ['Que veux-tu faire sur echange.exemple.org ?', 'Annuler', 'Vérifier'], 'the title, the two buttons, nothing else');
});

test('decision 3 : one free-text field, empty, with the greyed example ; no shortcut, no prefill, no last intent', async () => {
  worker();
  const a = await gate(approve(50n * U));
  await a.write('échanger 50 USDC contre AVAX');
  const b = await gate(SWAP); // a second request of the same site, right after
  const v = await b.view();
  assert.equal(v.screen.placeholder, 'Par exemple : échanger 50 USDC contre AVAX');
  assert.ok(!('value' in v.screen) && !('choices' in v.screen) && !('last' in v.screen));
  const S = surface(); S.ui.show(Object.assign({ value: 'échanger 50 USDC contre AVAX' }, v.screen), 'intent:1');
  assert.equal(S.find('textarea').length, 1); assert.equal(S.find('input').length + S.find('select').length, 0);
  assert.equal(S.find('textarea')[0].value, '', 'nothing is ever written for the person');
  assert.equal(S.find('textarea')[0].placeholder, 'Par exemple : échanger 50 USDC contre AVAX');
  assert.deepEqual(S.find('button').map((x) => x.textContent), ['Annuler', 'Vérifier']);
});

test('decision 4 : a vague sentence gets ONE follow-up, never two ; still vague = not verified with the delay, never better than nothing written', async () => {
  for (const [first, ask] of [['ok', 'Que veux-tu faire, et pour combien ?'], ['valider', 'Que veux-tu faire, et pour combien ?'], ['échanger', 'Combien, et de quel jeton ?'],
    ['envoyer', 'Combien, et à qui ?'], ['envoyer 20 USDC', 'À qui ? Colle l’adresse dans ta phrase.']]) {
    worker();
    const g = await gate(transfer(FRIEND, 20n * U));
    const q = await g.write(first);
    assert.equal(q.status, 'next'); assert.equal(q.view.stage, 'intent', first);
    assert.deepEqual(q.view.screen, { kind: 'question', title: ask, placeholder: 'Par exemple : échanger 50 USDC contre AVAX' }, first);
    const r = await g.write(first === 'ok' ? 'oui' : first);
    assert.equal(r.view.stage, 'verdict', first + ' : no second follow-up');
    assert.notEqual(r.view.screen.outcome, 'match');
    if (!REAL) { assert.equal(r.view.screen.outcome, 'unverifiable'); assert.equal(r.view.screen.headline, 'Je n’ai pas pu vérifier cette demande.'); } // a real engine may be stricter
    assert.ok(r.view.screen.leftMs >= 30000, 'the existing delay'); assert.ok(!r.view.screen.autoMs);
    assert.equal((await g.go()).status, 'again', 'nothing leaves before the delay');
    F.killWorker();
  }
  // the follow-up completes the first sentence : "échanger" then "50 USDC" is a full intent
  worker();
  const g = await gate(approve(50n * U));
  await g.write('échanger');
  assert.equal((await g.write('50 USDC contre AVAX')).view.screen.outcome, 'match');
  // a kind with no amount never matches, even when the person also says they authorise it
  F.killWorker(); worker('danger');
  const h = await gate(approve(MAX));
  await h.write('échanger, j’autorise'); assert.notEqual((await h.write('oui')).view.screen.outcome, 'match');
});

test('decision 5 : no "someone is guiding me" question or box, in the window or in the in-page fallback', async () => {
  worker();
  const g = await gate(approve(50n * U));
  const v = await g.view();
  assert.ok(!v.grill && !/guide|demandé|proche|téléphone/i.test(JSON.stringify(v.screen)));
  const r = await g.write('échanger 50 USDC contre AVAX');
  assert.equal(r.view.stage, 'verdict', 'the answer follows the sentence directly : no question in between'); assert.ok(!r.view.grill);
  const S = surface(); S.ui.show(r.view.screen, 'verdict:answer');
  assert.equal(S.find('input').length + S.find('select').length + S.find('textarea').length, 0, 'no box to tick on the answer');
  // window impossible : the fallback asks nothing (no choice buttons), it shows "not verified" with its delay
  F.killWorker(); F.state.failWindow = true; worker();
  const o = await gate(approve(50n * U));
  const p = await o.poll();
  assert.equal(p.ui, 'overlay'); assert.equal(p.view.stage, 'verdict'); assert.equal(p.view.message.mode, 'verdict'); assert.ok(!p.view.message.choices);
  assert.equal(p.view.verdict.level, 'unknown'); assert.equal(p.view.message.friction.type, 'phrase');
});

test('decision 6 : no address book. The address is pasted in the sentence ; recipient and amount of the request must be the written ones', async () => {
  await knowToken(); worker('attention', { effects: { grants_right: false, funds_out: true } });
  const say = async (payload, text) => { const g = await gate(payload); const r = await g.write(text); return r.view.screen; };
  let s = await say(transfer(FRIEND, 20n * U), 'envoyer 20 USDC à ' + FRIEND);
  assert.equal(s.outcome, 'match'); assert.equal(s.autoMs, 1000);
  s = await say(transfer(OTHER, 20n * U), 'envoyer 20 USDC à ' + FRIEND);
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.line, 'Le destinataire de la demande n’est pas l’adresse que tu as écrite.');
  assert.equal(s.addresses.expectedFull, FRIEND); assert.equal(s.addresses.actualFull, OTHER); assert.equal(s.labels.expected, 'Adresse que tu as écrite');
  assert.equal(s.leftMs, 30000);
  s = await say(transfer(FRIEND, 200n * U), 'envoyer 20 USDC à ' + FRIEND);
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.line, 'Tu as écrit 20 USDC. La demande envoie 200 USDC.');
  s = await say(send(FRIEND, null, '0x1bc16d674ec80000'), 'envoyer 20 USDC à ' + FRIEND);
  assert.equal(s.outcome, 'mismatch', 'the network currency is not the token written');
  s = await say(send(FRIEND, null, '0x1bc16d674ec80000'), 'envoyer 2 AVAX à ' + FRIEND);
  assert.equal(s.outcome, 'match');
  // a name without an address : the recipient cannot be checked, said in one line, never "it matches"
  s = await say(transfer(FRIEND, 20n * U), 'envoyer 20 USDC à Paul');
  assert.equal(s.outcome, 'unverifiable'); assert.equal(s.line, 'Tu n’as pas écrit d’adresse : je ne peux pas vérifier le destinataire.');
  assert.equal(s.leftMs, 30000); assert.ok(!s.autoMs);
  // a known contact of an old local context does not make a name checkable
  await F.chrome.storage.local.set({ contexte: { contacts: [{ label: 'Paul', address: FRIEND }], history: [], protected: [], knownSpenders: [], tokens: [{ address: USDC, symbol: 'USDC', decimals: 6 }] } });
  s = await say(transfer(FRIEND, 20n * U), 'envoyer 20 USDC à Paul');
  assert.equal(s.outcome, 'unverifiable');
});

test('decision 7 : when it matches, the sentence stays about a second, then the request goes to the wallet by itself ; no Continuer', async () => {
  await knowToken(); worker();
  const g = await gate(approve(50n * U));
  const r = await g.write('échanger 50 USDC contre AVAX');
  const s = r.view.screen;
  assert.equal(s.outcome, 'match'); assert.equal(s.headline, 'Ça correspond à ce que tu as écrit.'); assert.equal(s.autoMs, 1000);
  const S = surface(); S.ui.show(s, 'verdict:answer');
  assert.deepEqual(S.find('button').map((x) => x.textContent), ['Annuler'], 'no Continuer button');
  assert.equal(S.find('h1')[0].textContent, 'Ça correspond à ce que tu as écrit.');
  const auto = S.timers.filter((t) => t.f);
  assert.equal(auto.length, 1); assert.equal(auto[0].ms, 1000); assert.deepEqual(S.calls, [], 'nothing sent before the second has passed');
  auto[0].f(); assert.deepEqual(S.calls, [['continue']], 'then the window asks the worker by itself, once');
  assert.equal((await g.poll()).state, 'pending');
  clock.advance(1000);
  assert.equal((await g.go()).status, 'allow'); assert.equal((await g.poll()).state, 'allow', 'the request leaves for the wallet');
  assert.equal(F.state.windows.has(g.win()), false, 'the window is closed');
  // Annuler during that second still wins ; a mismatch or an unverified request never leaves by itself
  const c = await gate(approve(50n * U)); await c.write('échanger 50 USDC contre AVAX');
  await F.send({ type: 'hu.decision', rid: c.rid, seq: 2, decision: 'cancel' }, F.win(c.win(), c.rid));
  assert.equal((await c.poll()).state, 'deny');
  const m = await gate(approve(MAX)); const rm = await m.write('échanger 50 USDC contre AVAX');
  assert.ok(!rm.view.screen.autoMs);
  const S2 = surface(); S2.ui.show(rm.view.screen, 'verdict:answer');
  assert.deepEqual(S2.find('button').map((x) => x.textContent), ['Annuler', 'Continuer']); assert.equal(S2.timers.filter((t) => t.f && t.ms === 1000).length, 0);
});

test('decision 8 : a written amount against a larger spending right is a mismatch, even for a known site or contract', async () => {
  await F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [ROUTER], tokens: [{ address: USDC, symbol: 'USDC', decimals: 6 }] } });
  worker('attention'); // the engine itself finds nothing to say (known contract)
  const say = async (payload, text) => { const g = await gate(payload); const r = await g.write(text); return Object.assign({ g }, r.view.screen); };
  let s = await say(approve(MAX), 'échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.headline, 'Ça ne correspond pas à ce que tu as écrit.');
  assert.equal(s.line, 'Tu as écrit 50 USDC. La demande donne accès à tout ton USDC. Réduis le plafond à 50 USDC dans ton portefeuille.');
  assert.equal(s.leftMs, 30000); assert.equal((await s.g.go()).status, 'again');
  s = await say(approve(500n * U), 'échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.line, 'Tu as écrit 50 USDC. La demande donne accès à 500 USDC. Réduis le plafond à 50 USDC dans ton portefeuille.');
  s = await say(permit(MAX), 'échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.line, 'Tu as écrit 50 USDC. Cette signature donne accès à tout ton USDC et ne peut pas être limitée.');
  s = await say(permit(51n * U), 'j’autorise ce site, échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch', 'saying "I authorise" does not cover more than the amount written');
  s = await say({ method: 'wallet_sendCalls', chainId: '0xa869', from: ME, params: [{ from: ME, calls: [{ to: ROUTER, data: '0x12345678' }, { to: USDC, data: '0x095ea7b3' + pad(ROUTER) + pad(MAX) }] }] }, 'échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch', 'an unlimited right hidden in a batch');
  s = await say(approve(50n * U), 'échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'match'); assert.equal(s.line, 'La demande donne accès à 50 USDC, pas plus.');
  s = await say(approve(50n * U), 'échanger 0,5 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch'); assert.match(s.line, /^Tu as écrit 0,5 USDC\. La demande donne accès à 50 USDC\./);
});

test('demo scene : "échanger 50 USDC contre AVAX" on an exchange site', async () => {
  await knowToken(); worker();
  for (const trap of [approve(MAX), permit(MAX)]) {
    const g = await gate(trap);
    const s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
    assert.equal(s.headline, 'Ça ne correspond pas à ce que tu as écrit.');
    assert.ok(/^Tu as écrit 50 USDC\. (La demande|Cette signature) donne accès à tout ton USDC/.test(s.line));
    assert.equal(s.noModel, true, 'classified without a model'); assert.ok(!s.autoMs);
    clock.advance(5000); assert.equal((await g.go()).status, 'again'); assert.equal((await g.poll()).state, 'pending', 'held');
  }
  // the honest variant : approve of exactly 50, then the swap. Both match and leave by themselves.
  for (const step of [approve(50n * U), SWAP]) {
    const g = await gate(step);
    const s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
    assert.equal(s.headline, 'Ça correspond à ce que tu as écrit.'); assert.equal(s.autoMs, 1000);
    clock.advance(1000); assert.equal((await g.go()).status, 'allow'); assert.equal((await g.poll()).state, 'allow');
  }
});

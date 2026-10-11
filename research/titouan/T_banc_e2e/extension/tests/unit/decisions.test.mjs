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
const TOKEN = '0123456789abcdef0123456789abcdef'; // token the real bridge.js gives in "ready" (S1/S5)

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
const SWAP = send(ROUTER, '0x38ed1739' + pad(50n * U) + pad(1n) + pad(0xa0n) + pad(ME) + pad(1760000600n) + pad(2n) + pad(USDC) + pad(ROUTER));
const permit = (value) => ({ method: 'eth_signTypedData_v4', chainId: '0xa869', from: ME, params: [ME, JSON.stringify({
  types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
    Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: 43113, verifyingContract: USDC },
  message: { owner: ME, spender: ROUTER, value: value.toString(), nonce: '0', deadline: '1999999999' } })] });
const hex = (s) => '0x' + Buffer.from(s, 'utf8').toString('hex');
const siwe = (domain, uri) => domain + ' wants you to sign in with your Ethereum account:\n' + ME + '\n\nConnexion au site.\n\nURI: ' + uri + '\nVersion: 1\nChain ID: 43113\nNonce: 8f3a91c27be04d55\nIssued At: 2026-10-11T06:00:00Z';

let F, clock, n = 0, engineCalls;
beforeEach(async () => { clock = fakeClock(); F = makeChrome(); globalThis.chrome = F.chrome; engineCalls = 0; await F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [ROUTER], tokens: [{ address: USDC, symbol: 'USDC', decimals: 6 }] } }); });
afterEach(() => { clock.restore(); delete globalThis.chrome; });
function worker(level = 'attention', extra = {}) {
  const stub = async () => ({ level, texts: { croit: 'a', reel: 'Ligne du moteur.', danger: 'c', action: 'd' }, reasons: [], effects: { grants_right: true, funds_out: false }, risk_signals: [], ...extra });
  const real = async (body) => (CORE ? CORE.check(body, CORE.sanitizeLocalContext((await F.chrome.storage.local.get('contexte')).contexte))
    : SERVER.evaluate(JSON.parse(JSON.stringify(body)), { contacts: [], history: [], protected: [], knownSpenders: [] }));
  return createGatekeeper({ closeMs: 0, check: async (body) => { engineCalls++; return (REAL ? real : stub)(body); } });
}
const winOf = (rid) => { const r = F.state.session['hu:req:' + rid]; if (r && r.windowId != null && F.state.windows.has(r.windowId)) return r.windowId; for (const [id, o] of F.state.windows) if (o.url.endsWith('window.html#' + rid)) return id; return r && r.windowId != null ? r.windowId : null; };
async function gate(payload, origin = SITE, frameId = 0) {
  const rid = 'rid-dec-' + String(++n).padStart(5, '0'), page = F.page(40 + n, origin, frameId);
  const r = await F.send({ type: 'gate', rid, pageText: 'Approve 999 USDC to 0xdead', payload: Object.assign({ kind: 'gate' }, payload) }, page);
  const g = { rid, page, r, win: () => winOf(rid) };
  g.view = async () => (await F.send({ type: 'hu.view', rid }, F.win(winOf(rid), rid))).view;
  g.write = async (text) => { clock.advance(1000); const v = await g.view(); return F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'answer', text }, F.win(winOf(rid), rid)); };
  g.go = async () => { const v = await g.view(); return F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'continue', phraseOk: true }, F.win(winOf(rid), rid)); };
  g.limit = async () => { clock.advance(700); const v = await g.view(); return F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'limit' }, F.win(winOf(rid), rid)); };
  g.poll = () => F.send({ type: 'hu.poll', rid }, page);
  return g;
}
// The context the demo site installs (a test token of the local chain) : no address lives in the product code.
const knowToken = () => F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [ROUTER], tokens: [{ address: USDC, symbol: 'USDC', decimals: 6 }] } });

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
    sb.port.onmessage = (ev) => { const m = ev.data; if (m.t !== 'gate') return; sb.port.postMessage({ t: 'ack', id: m.id, k: TOKEN }); sb.gates.push(m.payload.method); sb.port.postMessage({ t: 'result', id: m.id, k: TOKEN, allow: false, reason: 'denied' }); };
    sb.port.postMessage({ t: 'ready', k: TOKEN }); };
  sb.window = sb; sb.top = sb; sb.self = sb; sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext('class CustomEvent { constructor(t, i) { this.type = t; this.detail = i && i.detail; } }; globalThis.CustomEvent = CustomEvent;'
    + 'window.ethereum = { calls: [], async request(a) { this.calls.push(a.method); return "ok:" + a.method; } };', sb);
  vm.runInContext(readFileSync(join(DIR, 'inject.js'), 'utf8'), sb);
  const free = ['eth_requestAccounts', 'eth_accounts', 'eth_chainId', 'eth_call', 'eth_getBalance', 'eth_blockNumber', 'wallet_switchEthereumChain', 'wallet_requestPermissions'];
  for (const m of free) assert.equal(await vm.runInContext(`ethereum.request({ method: '${m}', params: [{ chainId: '0xa869' }] })`, sb), 'ok:' + m, m + ' reaches the wallet directly');
  assert.deepEqual(sb.gates, [], 'none of them is held');
  for (const m of ['eth_sendTransaction', 'eth_signTypedData_v4', 'eth_signTypedData', 'personal_sign', 'wallet_addEthereumChain']) await vm.runInContext(`ethereum.request({ method: '${m}', params: [{}] })`, sb).catch(() => {});
  assert.deepEqual(sb.gates, ['eth_sendTransaction', 'eth_signTypedData_v4', 'eth_signTypedData', 'personal_sign', 'wallet_addEthereumChain'], 'these are held');
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
  assert.deepEqual(Object.keys(v.screen).sort(), ['kind', 'max', 'placeholder', 'site', 'title']);
  assert.equal(v.screen.title, 'Que veux-tu faire ?');
  assert.equal(v.screen.site, 'echange.exemple.org', 'the origin comes from the sender, never from the page');
  const shown = v.screen.title + ' ' + v.screen.site + ' ' + v.screen.placeholder;
  for (const secret of [USDC, ROUTER, ME, 'approve', 'Approve', '999', '0xdead', 'banque-officielle', 'illimité', 'eth_sendTransaction']) assert.ok(!shown.includes(secret), 'not shown : ' + secret);
  const S = surface(); S.ui.show(v.screen, 'intent:1');
  assert.deepEqual(S.texts().map((t) => t.replace(/[  ]/g, ' ')), ['echange.exemple.org', ' veut utiliser ton portefeuille.', 'Que veux-tu faire ?', 'Ce que j’ai compris', 'quoi', 'combien', 'à qui', 'Le reste, je le suppose : rien de plus, rien de durable, tout revient sur ton compte.', 'Je compare ta phrase à la demande.', 'Annuler', 'Vérifier'], 'the title, the three empty places, what is assumed, the two buttons : nothing of the request');
});

test('decision 3 : one free-text field, empty, without any example in it ; no shortcut, no prefill, no last intent', async () => {
  worker();
  const a = await gate(approve(50n * U));
  await a.write('échanger 50 USDC contre AVAX');
  const b = await gate(SWAP); // a second request of the same site, right after
  const v = await b.view();
  assert.equal(v.screen.placeholder, '', 'no example : a greyed sentence reads as already written');
  assert.ok(!('value' in v.screen) && !('choices' in v.screen) && !('last' in v.screen));
  const S = surface(); S.ui.show(Object.assign({ value: 'échanger 50 USDC contre AVAX' }, v.screen), 'intent:1');
  assert.equal(S.find('textarea').length, 1); assert.equal(S.find('input').length + S.find('select').length, 0);
  assert.equal(S.find('textarea')[0].value, '', 'nothing is ever written for the person');
  assert.equal(S.find('textarea')[0].placeholder, '', 'the field opens empty : the person writes it');
  assert.deepEqual(S.find('button').map((x) => x.textContent), ['Annuler', 'Vérifier']);
});

test('decision 4 : a vague sentence gets ONE follow-up, never two ; still vague = not verified with the delay, never better than nothing written', async () => {
  for (const [first, ask] of [['ok', 'Que veux-tu faire, et pour combien ?'], ['valider', 'Que veux-tu faire, et pour combien ?'], ['échanger', 'Combien ?'],
    ['envoyer', 'Combien ?'], ['envoyer 20 USDC', 'À quelle adresse ?']]) {
    worker();
    const g = await gate(transfer(FRIEND, 20n * U));
    const q = await g.write(first);
    assert.equal(q.status, 'next'); assert.equal(q.view.stage, 'intent', first);
    const qs = q.view.screen; // the follow-up recalls the first sentence
    assert.deepEqual({ kind: qs.kind, site: qs.site, title: qs.title, max: qs.max, first: qs.first }, { kind: 'question', site: 'echange.exemple.org', title: ask, max: 500 - first.length - 1, first }, first);
    assert.equal(qs.placeholder, '', 'the follow-up field is empty too : no example');
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
  await F.chrome.storage.local.set({ contexte: { contacts: [{ label: 'Paul', address: FRIEND }], history: [], protected: [], knownSpenders: [ROUTER], tokens: [{ address: USDC, symbol: 'USDC', decimals: 6 }] } });
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
  assert.equal(F.state.windows.has(g.win()), true, 'a right was given for an exchange and nothing has left yet : the window stays for the next request');
  // Annuler during that second still wins ; a mismatch or an unverified request never leaves by itself
  const c = await gate(approve(50n * U)); await c.write('échanger 50 USDC contre AVAX');
  await F.send({ type: 'hu.decision', rid: c.rid, seq: 2, decision: 'cancel' }, F.win(c.win(), c.rid));
  assert.equal((await c.poll()).state, 'deny');
  const m = await gate(permit(MAX)); const rm = await m.write('échanger 50 USDC contre AVAX');
  assert.equal(rm.view.screen.outcome, 'mismatch'); assert.ok(!rm.view.screen.autoMs);
  const S2 = surface(); S2.ui.show(rm.view.screen, 'verdict:answer');
  assert.deepEqual(S2.find('button').map((x) => x.textContent), ['Continuer', 'Annuler']); assert.equal(S2.timers.filter((t) => t.f && t.ms === 1000).length, 0);
});

test('decision 8 : a written amount against a larger spending right is a mismatch, even for a known site or contract', async () => {
  await F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [ROUTER], tokens: [{ address: USDC, symbol: 'USDC', decimals: 6 }] } });
  worker('attention'); // the engine itself finds nothing to say (known contract)
  const say = async (payload, text) => { const g = await gate(payload); const r = await g.write(text); return Object.assign({ g }, r.view.screen); };
  let s = await say(approve(MAX), 'échanger 50 USDC contre AVAX');
  // Founder's decision (11 Oct.) : a right wider than the written amount is a mismatch ; the limit is offered, never applied by itself.
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.headline, 'Ça ne correspond pas à ce que tu as écrit.');
  assert.equal(s.said, 'Tu as écrit 50 USDC.'); assert.equal(s.does, 'La demande donne accès à tout ton USDC.'); assert.equal(s.fix, null);
  assert.equal(s.limit.label, 'Limiter à 50 USDC et envoyer');
  clock.advance(1000); assert.equal((await s.g.go()).status, 'ignored'); assert.equal((await s.g.poll()).state, 'pending');
  assert.equal((await limitedBy(s.g, '50 USDC')).params[0].data, approve(50n * U).params[0].data, 'what goes to the wallet is the limited request');
  s = await say(approve(500n * U), 'échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.does, 'La demande donne accès à 500 USDC.'); assert.equal(s.limit.label, 'Limiter à 50 USDC et envoyer');
  assert.equal((await limitedBy(s.g, '50 USDC')).params[0].data, approve(50n * U).params[0].data);
  s = await say(permit(MAX), 'échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch'); assert.ok(!s.limit, 'a signature cannot be limited'); assert.equal(s.line, 'Tu as écrit 50 USDC. Cette signature donne accès à tout ton USDC et ne peut pas être limitée.');
  s = await say(permit(51n * U), 'j’autorise ce site, échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch', 'saying "I authorise" does not cover more than the amount written');
  s = await say({ method: 'wallet_sendCalls', chainId: '0xa869', from: ME, params: [{ from: ME, calls: [{ to: ROUTER, data: '0x12345678' }, { to: USDC, data: '0x095ea7b3' + pad(ROUTER) + pad(MAX) }] }] }, 'échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch', 'an unlimited right hidden in a batch');
  s = await say(approve(50n * U), 'échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'match'); assert.equal(s.line, 'La demande donne accès à 50 USDC, pas plus.');
  s = await say(approve(50n * U), 'échanger 0,5 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.limit.label, 'Limiter à 0,5 USDC et envoyer');
  assert.equal((await limitedBy(s.g, '0,5 USDC')).params[0].data, approve(500000n).params[0].data);
  s = await say(permit(51n * U), 'échanger 50 USDC contre AVAX');
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.leftMs, 30000, 'a signature cannot be limited : it does not match, with the delay');
});

test('demo scene : a reward site (unlimited permit) opens an empty field, no example of an exchange before or after the sentence', async () => {
  worker();
  const g = await gate(permit(MAX));
  const v = await g.view();
  assert.equal(v.stage, 'intent');
  const words = (screen) => { const S = surface(); S.ui.show(screen, 'intent:' + (screen.first ? 2 : 1)); const f = S.find('textarea')[0]; return { value: f.value, placeholder: f.placeholder, shown: S.texts().join(' ') }; };
  const open = words(v.screen);
  assert.equal(open.value, '', 'nothing is written for the person'); assert.equal(open.placeholder, '', 'no greyed example in the field');
  for (const w of ['USDC', 'AVAX', 'échanger']) assert.ok(!open.shown.includes(w) && !String(v.screen.placeholder).includes(w), 'not shown before the person writes : ' + w);
  const r = await g.write('récupérer ma récompense');
  if (r.view.stage === 'intent') { // the one follow-up : its field is empty too, and only the person's own words are recalled
    const again = words(r.view.screen);
    assert.equal(again.value, ''); assert.equal(again.placeholder, ''); assert.equal(r.view.screen.first, 'récupérer ma récompense');
    for (const w of ['USDC', 'AVAX', 'échanger']) assert.ok(!again.shown.includes(w), 'not shown at the follow-up : ' + w);
  } else assert.equal(r.view.stage, 'verdict');
});

test('demo scene : "échanger 50 USDC contre AVAX" on an exchange site', async () => {
  await knowToken(); worker();
  for (const trap of [approve(MAX), permit(MAX)]) {
    const g = await gate(trap);
    const s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
    const signed = trap.method === 'eth_signTypedData_v4';
    assert.equal(s.noModel, true, 'classified without a model');
    if (signed) {
      assert.equal(s.headline, 'Ça ne correspond pas à ce que tu as écrit.'); assert.ok(!s.autoMs);
      assert.equal(s.line, 'Tu as écrit 50 USDC. Cette signature donne accès à tout ton USDC et ne peut pas être limitée.');
      assert.equal(s.leftMs, 30000, 'a signature cannot be corrected : the alert keeps its delay');
    } else { assert.equal(s.headline, 'Ça ne correspond pas à ce que tu as écrit.'); assert.equal(s.outcome, 'mismatch'); assert.equal(s.limit.label, 'Limiter à 50 USDC et envoyer'); assert.ok(!s.autoMs); }
    clock.advance(5000);
    if (signed) { assert.equal((await g.go()).status, 'again'); assert.equal((await g.poll()).state, 'pending', 'held'); }
    else { const p = await limitedBy(g, '50 USDC'); assert.equal(p.state, 'allow'); assert.equal(p.params[0].data, approve(50n * U).params[0].data, 'the wallet gets 50, not everything'); }
  }
  // the honest variant : approve of exactly 50, then the swap. Both match and leave by themselves.
  for (const step of [approve(50n * U), SWAP]) {
    const g = await gate(step);
    const s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
    // The approval is compared in full. The exchange itself is read by written_check.js (path, minimum received, recipient, deadline) :
    // what it cannot establish from the request alone is "not verified" with its delay, never a mismatch for an honest exchange.
    if (step === SWAP && s.outcome === 'unverifiable') { assert.equal(s.leftMs, 30000); assert.ok(!s.autoMs); continue; }
    assert.equal(s.headline, 'Ça correspond à ce que tu as écrit.'); assert.equal(s.autoMs, 1000);
    clock.advance(1000); assert.equal((await g.go()).status, 'allow'); assert.equal((await g.poll()).state, 'allow');
  }
});

// ------------------------------------------------------------------------------------------------ Q16 / Q17
const SENT = (p) => p.params[0].data;
// Founder's decision (11 Oct.) : a wider right is never limited by itself. The screen is a mismatch that offers the limit ; only the human
// gesture 'limit' (window) limits and allows at once ; 'continue' on that screen is ignored.
const LINE_WIDE = 'Tu as écrit 50 USDC. La demande donne accès à tout ton USDC.';
async function limitedBy(g, amountText) {
  assert.equal((await g.go()).status, 'ignored', 'Continuer cannot send the wide right from the limit screen');
  assert.equal((await g.poll()).state, 'pending');
  const r = await g.limit(); assert.equal(r.status, 'allow'); assert.equal(r.limited, 'Autorisation limitée à ' + amountText + '.');
  const p = await g.poll(); assert.equal(p.state, 'allow'); return p;
}
test('Q17 : the unlimited right is offered a limit to the written amount ; only the human gesture applies it, with spender and token unchanged', async () => {
  await knowToken(); worker();
  const g = await gate(approve(MAX));
  const s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.headline, 'Ça ne correspond pas à ce que tu as écrit.');
  assert.equal(s.said, 'Tu as écrit 50 USDC.'); assert.equal(s.does, 'La demande donne accès à tout ton USDC.');
  assert.deepEqual(s.limit, { label: 'Limiter à 50 USDC et envoyer', amount: '50', symbol: 'USDC' }); assert.ok(!s.autoMs, 'nothing leaves by itself');
  const st = surface(); st.ui.show(s, 'a:1');
  assert.ok(st.texts().includes('Limiter à 50 USDC et envoyer') || st.find('button').length >= 1);
  clock.advance(1000);
  const p = await limitedBy(g, '50 USDC');
  assert.equal(p.params.length, 1);
  assert.equal(SENT({ params: p.params }), approve(50n * U).params[0].data);
  assert.equal(p.params[0].to, USDC); assert.equal(p.params[0].from, ME);
  // decimal comma, 6 decimals
  const h = await gate(approve(MAX)); const sh = (await h.write('échanger 12,5 USDC contre AVAX')).view.screen;
  assert.equal(sh.outcome, 'mismatch'); assert.equal(sh.limit.symbol, 'USDC'); assert.equal(sh.limit.label, 'Limiter à 12,5 USDC et envoyer');
  const ph = await limitedBy(h, '12,5 USDC'); assert.equal(SENT({ params: ph.params }), approve(12500000n).params[0].data);
  // the gesture is refused in the first 600 ms of the screen
  const e = await gate(approve(MAX)); await e.write('échanger 50 USDC contre AVAX');
  const v = await e.view(); assert.equal((await F.send({ type: 'hu.decision', rid: e.rid, seq: v.seq, decision: 'limit' }, F.win(e.win(), e.rid))).status, 'again');
});

test('Q17 : a right already within the written amount is not touched, nor a right of another token', async () => {
  await knowToken(); worker();
  let g = await gate(approve(50n * U)); let s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
  assert.equal(s.outcome, 'match'); assert.equal(s.fix, null); clock.advance(1000); await g.go(); assert.equal((await g.poll()).params, undefined);
  const OTHER_T = '0x' + '9f'.repeat(20);
  g = await gate(send(OTHER_T, '0x095ea7b3' + pad(ROUTER) + pad(MAX))); s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.fix, null, 'a token nobody can name is not rewritten');
});

test('Q17 : never guessed. Two amounts, an ambiguous amount, a payment : alert only, delay kept', async () => {
  await knowToken(); worker();
  for (const text of ['échanger 50 USDC contre 1 AVAX', 'échanger 1,000 USDC contre AVAX', 'envoyer 50 USDC à ' + FRIEND, 'on m’a demandé d’échanger 50 USDC']) {
    const g = await gate(approve(MAX)); const s = (await g.write(text)).view.screen;
    assert.equal(s.fix, null, text); assert.equal(s.outcome === 'mismatch' || s.outcome === 'unverifiable', true, text); assert.ok(s.leftMs >= 30000, 'delay kept : ' + text);
  }
  // the token is not in the local context and the wallet's node cannot be read : no rewrite, the advice stays, and so does the delay
  await F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [ROUTER], tokens: [] } });
  const g = await gate(approve(MAX)); const s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
  assert.equal(s.fix, null); assert.equal(s.line, 'Tu as écrit 50 USDC. La demande donne accès à tout ton USDC. Réduis le plafond à 50 USDC dans ton portefeuille.');
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.leftMs, 30000, 'no correction, so no relief : the person waits');
  clock.advance(1000); assert.equal((await g.go()).status, 'again'); assert.equal((await g.poll()).state, 'pending', 'a right nobody could limit never leaves at once');
  clock.advance(30000); assert.equal((await g.go()).status, 'allow'); assert.equal((await g.poll()).params, undefined, 'after the delay and a gesture, the request goes as written by the site');
});

test('Q17 : the option can be switched off ; and what an engine says in `relief` or `written` is dropped', async () => {
  await knowToken(); worker('attention', { relief: true, written: { outcome: 'match', line: 'x' } });
  await F.chrome.storage.local.set({ cfg: { limitUnlimited: false } });
  const g = await gate(approve(MAX)); const s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
  assert.equal(s.outcome, 'mismatch'); assert.match(s.line, /Réduis le plafond à 50 USDC/); assert.equal(s.leftMs, 30000, 'setting off : it does not match, with the delay');
  clock.advance(31000); await g.go(); assert.equal((await g.poll()).params, undefined);
  // the gaps that are not this one keep their delay
  const t = await gate(transfer(FRIEND, 200n * U)); const st = (await t.write('envoyer 20 USDC à ' + FRIEND)).view.screen;
  assert.equal(st.outcome, 'mismatch'); assert.equal(st.leftMs, 30000);
});

test('Q16 : the delay stays when the engine itself found something else (look-alike address)', async () => {
  await knowToken(); worker('danger', { risk_signals: ['lookalike'] });
  const g = await gate(approve(MAX)); const s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.leftMs, 30000); assert.equal((await g.go()).status, 'again');
});

test('point 1 : a token nobody knows by its address is read on its own contract (symbol, decimals) ; the name is a declaration, the address is shown', async () => {
  await F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [ROUTER], tokens: [] } });
  worker();
  const abi = (s) => '0x' + pad(32n) + pad(BigInt(s.length)) + Buffer.from(s).toString('hex').padEnd(64, '0');
  let asked = 0;
  F.chrome.tabs.sendMessage = async (tabId, msg) => {
    if (msg.type !== 'hu.rpc' || msg.method !== 'eth_call') return { ok: false };
    if (String(msg.params[0].data).startsWith('0x95d89b41')) asked++;
    const d = msg.params[0].data; return { ok: true, result: d.startsWith('0x95d89b41') ? abi('USDC') : '0x' + pad(6n) };
  };
  const TOLD = ' Le jeton 0xc3c3…c3c3 se présente comme ';
  // honest : a right of exactly 50 on a token that calls itself USDC, 6 decimals
  let g = await gate(approve(50n * U)); let s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
  assert.equal(s.outcome, 'match'); assert.equal(s.line, 'La demande donne accès à 50 USDC, pas plus.' + TOLD + 'USDC.'); assert.ok(asked > 0, 'symbol() was read through the wallet');
  // trap : the unlimited right is limited, and the line still says where the name comes from
  g = await gate(approve(MAX)); s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.limit.label, 'Limiter à 50 USDC et envoyer'); assert.equal(s.does, 'La demande donne accès à tout ton USDC.');
  clock.advance(1000); assert.equal((await limitedBy(g, '50 USDC')).params[0].data, approve(50n * U).params[0].data, 'the wallet gets 50');
  // a contract that takes the name with other decimals than USDC's is not believed : never a match, never a rewrite, the delay
  F.chrome.tabs.sendMessage = async (tabId, msg) => { const d = msg.params[0].data; return { ok: true, result: d.startsWith('0x95d89b41') ? abi('USDC') : '0x' + pad(18n) }; };
  for (const amount of [50n * U, MAX]) {
    g = await gate(approve(amount)); s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
    assert.notEqual(s.outcome, 'match'); assert.equal(s.leftMs, 30000); clock.advance(31000); await g.go(); assert.equal((await g.poll()).params, undefined);
  }
  // another name : it is another token
  F.chrome.tabs.sendMessage = async (tabId, msg) => { const d = msg.params[0].data; return { ok: true, result: d.startsWith('0x95d89b41') ? abi('WBTC') : '0x' + pad(8n) }; };
  g = await gate(approve(50n * U)); s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.line, 'Tu as écrit 50 USDC. La demande donne accès à 0,5 WBTC.');
  // the read fails : "not verified" stays the answer
  F.chrome.tabs.sendMessage = async () => ({ ok: false });
  g = await gate(approve(50n * U)); s = (await g.write('échanger 50 USDC contre AVAX')).view.screen;
  assert.equal(s.outcome, 'unverifiable'); assert.match(s.line, /Je ne connais pas ce jeton/); assert.equal(s.leftMs, 30000);
});

test('Q17 : the page side forwards the limited params to the wallet ; a signature never gets other params', async () => {
  const ports = [], timers = new Set();
  const sb = { console, clearTimeout, clearInterval, addEventListener() {}, dispatchEvent() { return true; }, got: [],
    setTimeout: (f, ms, ...a) => { const t = setTimeout(f, ms, ...a); timers.add(t); return t; }, setInterval: (f, ms) => { const t = setInterval(f, ms); timers.add(t); return t; },
    MessageChannel: class { constructor() { const c = new MessageChannel(); ports.push(c.port1, c.port2); this.port1 = c.port1; this.port2 = c.port2; } } };
  const LIM = [{ from: ME, to: USDC, data: approve(50n * U).params[0].data }];
  sb.postMessage = (data, origin, transfer) => { if (!data || data.__sentinelle !== 'hello' || sb.port) return; sb.port = transfer[0];
    sb.port.onmessage = (ev) => { const m = ev.data; if (m.t !== 'gate') return; sb.port.postMessage({ t: 'ack', id: m.id, k: TOKEN }); sb.port.postMessage({ t: 'result', id: m.id, k: TOKEN, allow: true, reason: '', params: LIM }); };
    sb.port.postMessage({ t: 'ready', k: TOKEN }); };
  sb.window = sb; sb.top = sb; sb.self = sb; sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext('class CustomEvent { constructor(t, i) { this.type = t; this.detail = i && i.detail; } }; globalThis.CustomEvent = CustomEvent;'
    + 'window.ethereum = { async request(a) { window.got.push(JSON.stringify(a)); return "ok"; } };', sb);
  vm.runInContext(readFileSync(join(DIR, 'inject.js'), 'utf8'), sb);
  const asked = approve(MAX).params;
  await vm.runInContext(`ethereum.request({ method: 'eth_sendTransaction', params: ${JSON.stringify(asked)} })`, sb);
  const sent = sb.got.map((x) => JSON.parse(x)).filter((x) => x.method === 'eth_sendTransaction' || x.method === 'eth_signTypedData_v4');
  assert.deepEqual(sent[0].params, LIM, 'the wallet receives the limited request');
  await vm.runInContext(`ethereum.request({ method: 'eth_signTypedData_v4', params: ['x', 'y'] })`, sb);
  assert.deepEqual(sb.got.map((x) => JSON.parse(x)).filter((x) => x.method === 'eth_signTypedData_v4')[0].params, ['x', 'y']);
  for (const t of timers) { clearTimeout(t); clearInterval(t); } for (const x of ports) { try { x.close(); } catch (_) {} }
});

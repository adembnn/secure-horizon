// Three fixes of 11 Oct., one block each. Fake chrome, no browser, no network, no model (keyword parser).
//   1) one written intent covers the requests of ONE operation (same tab, frame, origin, short time) and is a budget, not a pass ;
//   2) a call nobody can read is MEASURED by a dry run relayed to the wallet's node (effect_sim.js), then compared to the sentence ;
//   3) the advice depends on the nature of the request : a signature's ceiling cannot be edited in the wallet.
// The node is a stub answering `hu.rpc` (what bridge.js + inject.js relay in a browser) with a hand-built trace.
// Run : node --test extension/tests/unit/*.test.mjs
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeChrome, fakeClock, load } from './fake_chrome.mjs';

const { createGatekeeper } = await load('gatekeeper.js');
const W = await load('written_check.js');
const S = await load('effect_sim.js');

const SITE = 'https://echange.exemple.org', TAB = 77;
const ME = '0x' + 'a1'.repeat(20), USDC = '0x' + 'c3'.repeat(20), WAVAX = '0x' + 'b2'.repeat(20), OTHER_TOKEN = '0x' + '9f'.repeat(20);
const ROUTER = '0x' + 'd4'.repeat(20), THIEF = '0x' + 'e5'.repeat(20);
const pad = (x) => (typeof x === 'bigint' ? x.toString(16) : String(x).replace(/^0x/, '')).padStart(64, '0');
const U = 10n ** 6n, E18 = 10n ** 18n, MAX = 2n ** 256n - 1n;
const send = (to, data) => ({ method: 'eth_sendTransaction', params: [{ from: ME, to, data }], chainId: '0xa869', from: ME });
const approve = (amount, spender = ROUTER, token = USDC) => send(token, '0x095ea7b3' + pad(spender) + pad(amount));
const opaque = (amount) => send(ROUTER, '0x5c11d795' + pad(amount) + pad(0n)); // a function no registry knows
const permit = (value, deadline = '1999999999') => ({ method: 'eth_signTypedData_v4', chainId: '0xa869', from: ME, params: [ME, JSON.stringify({
  types: { EIP712Domain: [], Permit: [] }, primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: 43113, verifyingContract: USDC },
  message: { owner: ME, spender: ROUTER, value: value.toString(), nonce: '0', deadline } })] });
const permit2 = (amount) => ({ method: 'eth_signTypedData_v4', chainId: '0xa869', from: ME, params: [ME, JSON.stringify({
  types: { EIP712Domain: [], PermitSingle: [] }, primaryType: 'PermitSingle', domain: { name: 'Permit2', chainId: 43113, verifyingContract: '0x' + '22'.repeat(20) },
  message: { details: { token: USDC, amount: amount.toString(), expiration: '1999999999', nonce: '0' }, spender: ROUTER, sigDeadline: '1999999999' } })] });

// ---- a hand-built trace, in the shape nodes return (stack : top last ; memory : 32-byte words)
const T_TRANSFER = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', T_APPROVAL = '8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
const step = (op, depth, stack = [], memory = []) => ({ pc: 0, op, gas: 1, gasCost: 1, depth, stack, memory });
const call = (depth, to, value = 0n) => step('CALL', depth, [pad(0n), pad(0n), pad(0n), pad(0n), pad(value), pad(to), pad(90000n)]);
const log3 = (depth, topic, a, b, value) => step('LOG3', depth, [pad(b), pad(a), topic, pad(32n), pad(0n)], [pad(value)]);
const sub = (to, inner, end = 'RETURN') => [call(1, to), ...inner, step(end, 2), step('POP', 1)];
const moves = (...subs) => ({ failed: false, gas: 1, returnValue: '', structLogs: [step('PUSH1', 1), ...subs.flat(), step('STOP', 1)] });
const swapTrace = (paid, got = E18 / 2n) => moves(sub(USDC, [log3(2, T_TRANSFER, ME, ROUTER, paid)]), sub(WAVAX, [log3(2, T_TRANSFER, ROUTER, ME, got)]));
const SYMBOLS = { [USDC]: ['USDC', 6], [WAVAX]: ['WAVAX', 18], [OTHER_TOKEN]: ['WETH', 18] };
const abiString = (s) => '0x' + pad(32n) + pad(BigInt(s.length)) + Buffer.from(s).toString('hex').padEnd(64, '0');
// The stub node : `trace` is what debug_traceCall answers (null = the method does not exist on this node).
function node(trace, allowance = 0n) {
  const calls = [];
  const rpc = async (method, params) => {
    calls.push(method);
    if (method === 'debug_traceCall') { if (!trace) throw new Error('Method debug_traceCall is not supported'); return typeof trace === 'function' ? trace(params[0]) : trace; }
    const { to, data } = params[0], known = SYMBOLS[to];
    if (data.startsWith('0x95d89b41')) return abiString(known[0]);
    if (data.startsWith('0x313ce567')) return '0x' + pad(BigInt(known[1]));
    if (data.startsWith('0xdd62ed3e')) return '0x' + pad(allowance);
    throw new Error('lecture inattendue');
  };
  rpc.calls = calls;
  return rpc;
}

let F, clock, n = 0;
beforeEach(async () => { clock = fakeClock(); F = makeChrome(); globalThis.chrome = F.chrome; await F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [ROUTER], tokens: [{ address: USDC, symbol: 'USDC', decimals: 6 }] } }); });
afterEach(() => { clock.restore(); delete globalThis.chrome; });
// The engine stub reads approvals and typed data, and cannot read the opaque call (same marks as the embedded engine).
function worker(rpc = null) {
  const relayed = [];
  if (rpc) F.chrome.tabs.sendMessage = async (tabId, msg, opts) => {
    if (msg.type !== 'hu.rpc') return undefined;
    relayed.push({ tabId, frameId: opts && opts.frameId, rid: msg.rid, method: msg.method });
    try { return { ok: true, result: await rpc(msg.method, msg.params) }; } catch (_) { return { ok: false }; }
  };
  const base = { texts: { reel: 'Ligne du moteur.' }, reasons: [], risk_signals: [] };
  createGatekeeper({ closeMs: 0, check: async (body) => (String(body.params[0] && body.params[0].data || '').startsWith('0x5c11d795')
    ? { ...base, level: 'unknown', indeterminate: true, opacity_only: true, codes: ['unknown_selector', 'opaque'], effects: { grants_right: false, funds_out: false } }
    : { ...base, level: 'attention', effects: { grants_right: true, funds_out: false } }) });
  return relayed;
}
const winOf = (rid) => { const r = F.state.session['hu:req:' + rid]; if (r && r.windowId != null && F.state.windows.has(r.windowId)) return r.windowId; for (const [id, o] of F.state.windows) if (o.url.endsWith('window.html#' + rid)) return id; return r && r.windowId != null ? r.windowId : null; };
async function gate(payload, { tab = TAB, origin = SITE, frame = 0 } = {}) {
  const rid = 'rid-op-' + String(++n).padStart(6, '0'), page = F.page(tab, origin, frame);
  const r = await F.send({ type: 'gate', rid, payload: Object.assign({ kind: 'gate' }, payload) }, page);
  const g = { rid, page, r };
  g.view = async () => (await F.send({ type: 'hu.view', rid }, F.win(winOf(rid), rid))).view;
  g.screen = async () => (await g.view()).screen;
  g.write = async (text) => { clock.advance(1000); const v = await g.view(); return (await F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'answer', text }, F.win(winOf(rid), rid))).view.screen; };
  g.cancel = async () => { const v = await g.view(); await F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'cancel' }, F.win(winOf(rid), rid)); };
  g.shown = async () => { const s = await g.screen(); await g.cancel(); return s; }; // reads the screen, then the person cancels
  g.go = async () => { clock.advance(1000); const v = await g.view(); return F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'continue', phraseOk: true }, F.win(winOf(rid), rid)); };
  return g;
}
const SAID = 'échanger 50 USDC contre AVAX';
// First request of the honest scene : the approval of exactly 50, written, matched, sent to the wallet.
async function approved() {
  clock.advance(130000); // any earlier operation of this tab is over
  const g = await gate(approve(50n * U));
  assert.equal((await g.screen()).kind, 'question');
  assert.equal((await g.write(SAID)).outcome, 'match');
  assert.equal((await g.go()).status, 'allow');
}

// ------------------------------------------------------------------------------------------------ 1) one intent, one operation
test('fix 1 : the next request of the same tab and origin is not asked again ; it is compared to the same sentence', async () => {
  const relayed = worker(node(swapTrace(50n * U)));
  await approved();
  clock.advance(8000);
  const g = await gate(opaque(50n * U));
  const s = await g.screen();
  assert.equal(s.kind, 'answer', 'no second question'); assert.equal(s.outcome, 'match'); assert.equal(s.autoMs, 1000);
  assert.equal(s.line, 'D’après la simulation, 50 USDC sortent de ton compte et 0,5 WAVAX y entre.');
  assert.equal((await g.go()).status, 'allow');
  assert.ok(relayed.length && relayed.every((m) => m.tabId === TAB && m.frameId === 0 && m.rid === g.rid), 'reads go to the frame that made the request, under its request id');
});

test('fix 1 : the sentence is a budget. A second right, another token, a larger total : it does not match', async () => {
  worker(node(swapTrace(50n * U)));
  await approved();
  let s = await (await gate(approve(50n * U, THIEF))).shown();
  assert.equal(s.kind, 'answer'); assert.equal(s.outcome, 'mismatch'); assert.match(s.line, /^Tu as écrit 50 USDC\. Tu as déjà donné une autorisation/); assert.equal(s.leftMs, 30000);
  s = await (await gate(approve(MAX))).shown();
  assert.equal(s.outcome, 'mismatch', 'an unlimited right is refused on its own account, whatever came before');
  s = await (await gate(approve(50n * U, ROUTER, OTHER_TOKEN))).shown();
  assert.equal(s.outcome, 'mismatch');
  // the exchange of 50 fits ; the same exchange a second time does not (50 + 50 > 50), and none of the refused ones was counted
  const first = await gate(opaque(50n * U));
  assert.equal((await first.screen()).outcome, 'match'); assert.equal((await first.go()).status, 'allow');
  s = await (await gate(opaque(50n * U))).shown();
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.line, 'Tu as écrit 50 USDC. Avec cette demande, 100 USDC seraient sortis de ton compte.');
  assert.ok(!s.autoMs);
});

test('fix 1 : two requests on screen at once cannot each take the whole amount', async () => {
  worker(node(swapTrace(30n * U)));
  await approved();
  const a = await gate(opaque(30n * U)), b = await gate(opaque(30n * U));
  assert.equal((await a.screen()).outcome, 'match');
  assert.equal((await b.screen()).outcome, 'mismatch', '30 + 30 > 50 although neither has left yet');
});

test('fix 1 : a larger amount, or a token that is not the one written, is a mismatch even as the first follow-up', async () => {
  worker(node((tx) => (tx.data.includes(pad(51n * U)) ? swapTrace(51n * U) : moves(sub(OTHER_TOKEN, [log3(2, T_TRANSFER, ME, ROUTER, 50n * E18)]), sub(WAVAX, [log3(2, T_TRANSFER, ROUTER, ME, E18)])))));
  await approved();
  let s = await (await gate(opaque(51n * U))).shown();
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.line, 'Tu as écrit 50 USDC. La demande fait sortir 51 USDC de ton compte.');
  s = await (await gate(opaque(50n * U))).shown();
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.line, 'Tu as écrit 50 USDC. La demande fait sortir 50 WETH de ton compte.');
});

test('fix 1 : the intent does not follow the person to another origin, another tab, another frame, nor past its time', async () => {
  worker(node(swapTrace(50n * U)));
  const asked = async (where) => (await (await gate(opaque(50n * U), where)).shown()).kind;
  await approved();
  assert.equal(await asked({ origin: 'https://autre.exemple.org' }), 'question', 'same tab, another origin');
  assert.equal(await asked({ tab: TAB + 1 }), 'question', 'another tab');
  assert.equal(await asked({ frame: 3 }), 'question', 'another frame of the same page');
  // a request from another origin on the tab ended the operation : back on the first origin, the question is asked again
  assert.equal(await asked({}), 'question');

  await approved();
  await F.send({ type: 'hu.page' }, F.page(TAB, 'https://autre.exemple.org'));   // the tab loads another site, then comes back
  assert.equal(await asked({}), 'question', 'a page of another origin loaded in between');

  await approved();
  await F.send({ type: 'hu.page' }, F.page(TAB, SITE));                          // same-origin reload : still the same operation
  assert.equal(await asked({}), 'answer');

  n += 100; await approved();
  clock.advance(91000);
  assert.equal(await asked({}), 'question', '90 s after the last request it let through');
});

test('fix 1 : a sentence without an amount opens no operation, and the hard limit is 120 s after the writing', async () => {
  worker(node(swapTrace(10n * U)));
  const g = await gate(permit(50n * U));
  await g.write('me connecter'); await g.cancel();
  assert.equal((await (await gate(opaque(50n * U))).shown()).kind, 'question', 'nothing to hold the next request to');

  // each request leaves within 90 s of the previous one, so only the hard limit can end this operation
  const where = { tab: 90 }, first = await gate(approve(10n * U), where);
  await first.write(SAID); assert.equal((await first.go()).status, 'allow');
  for (const wait of [55000, 55000]) {
    clock.advance(wait);
    const x = await gate(opaque(10n * U), where);
    assert.equal((await x.screen()).outcome, 'match'); assert.equal((await x.go()).status, 'allow');
  }
  clock.advance(10000);
  assert.equal((await (await gate(opaque(10n * U), where)).shown()).kind, 'question', 'more than 120 s after the sentence, although 30 of the 50 USDC are left');
});

// ------------------------------------------------------------------------------------------------ 2) measured effect
test('fix 2 : a call the engine cannot read is asked about, measured, and matches when 50 USDC leave and another token comes back', async () => {
  const rpc = node(swapTrace(50n * U)); worker(rpc);
  const g = await gate(opaque(50n * U));
  assert.equal((await g.screen()).kind, 'question', 'the question is asked before anything is measured');
  assert.equal(rpc.calls.length, 0);
  const s = await g.write(SAID);
  assert.equal(s.outcome, 'match'); assert.equal(s.headline, 'Ça correspond à ce que tu as écrit.'); assert.equal(s.autoMs, 1000);
  assert.equal(s.line, 'D’après la simulation, 50 USDC sortent de ton compte et 0,5 WAVAX y entre.');
  assert.deepEqual([...new Set(rpc.calls)].sort(), ['debug_traceCall', 'eth_call'], 'read-only methods only');
});

test('fix 2 : without a simulation the answer stays "not verified", with its delay', async () => {
  for (const rpc of [null, node(null), node({ failed: true, structLogs: [step('REVERT', 1)] }), node({ failed: false, structLogs: [step('PUSH1', 1), call(1, USDC), step('CREATE', 2), step('LOG1', 3, [pad(1n), pad(0n), pad(0n)]), step('STOP', 3), step('RETURN', 2), step('STOP', 1)] })]) {
    n += 10; F = makeChrome(); globalThis.chrome = F.chrome; worker(rpc);
    const g = await gate(opaque(50n * U));
    const s = await g.write(SAID);
    assert.equal(s.outcome, 'unverifiable'); assert.equal(s.headline, 'Je n’ai pas pu vérifier cette demande.'); assert.equal(s.leftMs, 30000); assert.ok(!s.autoMs);
    assert.equal((await g.go()).status, 'again');
  }
});

test('fix 2 : what the measure finds beyond the sentence is a mismatch', async () => {
  const cases = [
    [swapTrace(500n * U), 'Tu as écrit 50 USDC. La demande fait sortir 500 USDC de ton compte.'],
    [moves(sub(USDC, [log3(2, T_TRANSFER, ME, THIEF, 50n * U)])), 'Tu as écrit 50 USDC. La demande fait sortir 50 USDC de ton compte et rien n’y entre en échange.'],
    [moves(sub(USDC, [log3(2, T_TRANSFER, ME, ROUTER, 50n * U), log3(2, T_APPROVAL, ME, THIEF, MAX)]), sub(WAVAX, [log3(2, T_TRANSFER, ROUTER, ME, E18)])), 'Tu as écrit 50 USDC. La demande donne aussi accès à tout ton USDC.'],
    [moves(sub(USDC, [log3(2, T_TRANSFER, ME, ROUTER, 50n * U)]), sub(OTHER_TOKEN, [log3(2, T_TRANSFER, ME, THIEF, E18)]), sub(WAVAX, [log3(2, T_TRANSFER, ROUTER, ME, E18)])), 'Tu as écrit 50 USDC. La demande fait sortir 50 USDC et 1 WETH de ton compte.']
  ];
  for (const [trace, line] of cases) {
    n += 10; F = makeChrome(); globalThis.chrome = F.chrome; worker(node(trace));
    const s = await (await gate(opaque(50n * U))).write(SAID);
    assert.equal(s.outcome, 'mismatch'); assert.equal(s.line, line); assert.equal(s.leftMs, 30000);
  }
});

test('fix 2 : the trace reader drops what a reverted sub-call emitted, keeps the emitter of each event, and refuses what it cannot follow', async () => {
  const body = opaque(50n * U);
  // the transfer to the thief happens in a sub-call that reverts : it did not happen
  let e = await S.measure(body, node(moves(sub(USDC, [log3(2, T_TRANSFER, ME, THIEF, 999n * U)], 'REVERT'), sub(USDC, [log3(2, T_TRANSFER, ME, ROUTER, 50n * U)]), sub(WAVAX, [log3(2, T_TRANSFER, ROUTER, ME, E18)]))));
  assert.equal(e.ok, true); assert.deepEqual(e.out.map((o) => [o.token, o.raw, o.symbol]), [[USDC, String(50n * U), 'USDC']]); assert.deepEqual(e.in.map((o) => o.token), [WAVAX]);
  // an Approval that only records the allowance being spent is not a new right ; one that grows is
  const spent = moves(sub(USDC, [log3(2, T_APPROVAL, ME, ROUTER, 0n), log3(2, T_APPROVAL, ME, THIEF, 20n * U), log3(2, T_TRANSFER, ME, ROUTER, 50n * U)]));
  assert.deepEqual((await S.measure(body, node(spent, 50n * U))).grants, []);
  assert.deepEqual((await S.measure(body, node(spent, 0n))).grants.map((g) => [g.spender, g.raw]), [[THIEF, String(20n * U)]]);
  // a delegatecall emits in the name of the caller, not of the library
  const viaLib = { failed: false, structLogs: [call(1, USDC), step('DELEGATECALL', 2, [pad(0n), pad(0n), pad(0n), pad(0n), pad(THIEF), pad(9n)]), log3(3, T_TRANSFER, ME, ROUTER, 7n * U), step('RETURN', 3), step('RETURN', 2), step('STOP', 1)] };
  assert.deepEqual((await S.measure(body, node(viaLib))).out.map((o) => o.token), [USDC]);
  // network currency sent with the call, and sent back by the contract
  e = await S.measure({ ...body, params: [{ ...body.params[0], value: '0xde0b6b3a7640000' }] }, node(moves([call(1, ME, E18 / 4n), step('POP', 1)])));
  assert.deepEqual(e.out.map((o) => [o.token, o.raw]), [[null, String(E18 - E18 / 4n)]]);
  for (const bad of [null, { failed: true, structLogs: [] }, { failed: false, structLogs: [step('PUSH1', 1), step('PUSH1', 3)] }, { failed: false, structLogs: [call(1, USDC), step('LOG3', 2, [pad(1n)]), step('RETURN', 2), step('STOP', 1)] },
    { failed: false, structLogs: [call(1, USDC), log3(2, T_TRANSFER, ME, THIEF, U), step('ADD', 2), step('STOP', 1)] }]) assert.equal((await S.measure(body, node(bad))).ok, false);
  assert.equal((await S.measure(approve(MAX), null)).ok, false); assert.equal((await S.measure(permit(MAX), node(swapTrace(U)))).ok, false, 'only a transaction is simulated');
  assert.deepEqual(S.READ_METHODS, ['debug_traceCall', 'eth_call']);
});

test('fix 2 : a payment through an unreadable call is held to the written address and the exact amount', async () => {
  const FRIEND = '0x' + '7b'.repeat(20), pay = { clear: true, kind: 'pay_someone', amount: '20', symbol: 'USDC', address: FRIEND };
  const eff = (to, raw) => ({ ok: true, out: [{ token: USDC, raw: String(raw), symbol: 'USDC', decimals: 6, to: [to] }], in: [], grants: [], nftOut: 0, nftIn: 0, nftRight: false });
  assert.equal(W.effectCheck(eff(FRIEND, 20n * U), pay).outcome, 'match');
  assert.equal(W.effectCheck(eff(THIEF, 20n * U), pay).outcome, 'mismatch'); assert.deepEqual(W.effectCheck(eff(THIEF, 20n * U), pay).address_diff, { expected: FRIEND, actual: THIEF });
  assert.equal(W.effectCheck(eff(FRIEND, 19n * U), pay).outcome, 'mismatch');
  assert.equal(W.effectCheck(eff(FRIEND, 20n * U), { ...pay, address: undefined }).outcome, 'unverifiable');
  assert.equal(W.effectCheck({ ok: false }, pay), null);
});

// ------------------------------------------------------------------------------------------------ 3) the advice follows the nature of the request
test('fix 3 : a transaction can be capped in the wallet, a signature cannot : no advice nobody can follow', async () => {
  await F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [ROUTER], tokens: [] } });
  worker();
  const line = async (payload) => { n += 5; return (await (await gate(payload, { tab: 200 + n })).write(SAID)).line; };
  assert.equal(await line(approve(MAX)), 'Tu as écrit 50 USDC. La demande donne accès à tout ton USDC. Réduis le plafond à 50 USDC dans ton portefeuille.');
  assert.equal(await line(approve(500n * U)), 'Tu as écrit 50 USDC. La demande donne accès à 500 USDC. Réduis le plafond à 50 USDC dans ton portefeuille.');
  for (const signed of [permit(MAX), permit2(MAX)]) {
    const l = await line(signed);
    assert.equal(l, 'Tu as écrit 50 USDC. Cette signature donne accès à tout ton USDC et ne peut pas être limitée.');
    assert.ok(!/plafond|portefeuille|Réduis/.test(l));
  }
  assert.equal(await line(permit(500n * U)), 'Tu as écrit 50 USDC. Cette signature donne accès à 500 USDC et ne peut pas être limitée.');
  await F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [ROUTER], tokens: [{ address: USDC, symbol: 'USDC', decimals: 6 }] } });
  assert.equal(await line(permit(50n * U, '1760000600')), 'La demande donne accès à 50 USDC, pas plus.'); // a signature usable for ten minutes ; one usable for years is a mismatch of its own (written_check.js)
});

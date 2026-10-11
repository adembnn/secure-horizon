// Behaviour fixes of 11 Oct. (design evaluation 1, end-to-end audit, exhaustiveness report). Fake chrome, no browser, no network, no model.
//   1) a token nobody knows by its address is read on its own contract ; a fresh profile needs no setting ;
//   2) ONE window per operation : the next request of the same sentence is shown in the same window, each one checked on its own ;
//   3) a right brought back to the written amount matches, and the wallet gets the limited calldata ; no correction = the delay ;
//   4) timing of the surface : no flash, the last message is shown before the window closes ; hooks for the motion ;
//   6) words : no level name, no developer word ; 7) one settings page ; 8) sober fallback ; 10) revocation.
// Run : node --test extension/tests/unit/*.mjs
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { makeChrome, fakeClock, load, DIR } from './fake_chrome.mjs';

const { createGatekeeper } = await load('gatekeeper.js');
const OUT = await load('outcome.js');

const SITE = 'https://echange.exemple.org', TAB = 61;
const ME = '0x' + 'a1'.repeat(20), TOKEN = '0x' + 'c3'.repeat(20), WAVAX = '0x' + 'b2'.repeat(20), OTHER = '0x' + '9f'.repeat(20);
const ROUTER = '0x' + 'd4'.repeat(20), THIEF = '0x' + 'e5'.repeat(20), FRIEND = '0x' + '7b'.repeat(20);
const pad = (x) => (typeof x === 'bigint' ? x.toString(16) : String(x).replace(/^0x/, '')).padStart(64, '0');
const U = 10n ** 6n, E18 = 10n ** 18n, MAX = 2n ** 256n - 1n;
const send = (to, data, extra = {}) => ({ method: 'eth_sendTransaction', params: [Object.assign({ from: ME, to, data }, extra)], chainId: '0xa86a', from: ME });
const approve = (amount, spender = ROUTER, token = TOKEN) => send(token, '0x095ea7b3' + pad(spender) + pad(amount));
const transfer = (to, amount, token = TOKEN) => send(token, '0xa9059cbb' + pad(to) + pad(amount));
const opaque = (amount) => send(ROUTER, '0x5c11d795' + pad(amount) + pad(0n));         // a function nobody reads : its effect is measured
const readable = (amount) => send(ROUTER, '0x38ed1739' + pad(amount) + pad(0n));       // a swap the engine reads (stub : attention, not measured)
const permit = (value) => ({ method: 'eth_signTypedData_v4', chainId: '0xa86a', from: ME, params: [ME, JSON.stringify({
  types: { EIP712Domain: [], Permit: [] }, primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: 43114, verifyingContract: TOKEN },
  message: { owner: ME, spender: THIEF, value: value.toString(), nonce: '0', deadline: '1999999999' } })] });
const SAID = 'échanger 50 USDC contre AVAX';
const LIMITED = 'Droit limité à 50 USDC. Le site demandait un accès sans limite.';

// ---- the wallet's node, as bridge.js + inject.js relay it (hu.rpc). `chain` : what each token contract says of itself.
const T_TRANSFER = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const step = (op, depth, stack = [], memory = []) => ({ pc: 0, op, gas: 1, gasCost: 1, depth, stack, memory });
const call = (depth, to) => step('CALL', depth, [pad(0n), pad(0n), pad(0n), pad(0n), pad(0n), pad(to), pad(90000n)]);
const log3 = (depth, topic, a, b, value) => step('LOG3', depth, [pad(b), pad(a), topic, pad(32n), pad(0n)], [pad(value)]);
const sub = (to, inner) => [call(1, to), ...inner, step('RETURN', 2), step('POP', 1)];
const swapTrace = (paid) => ({ failed: false, gas: 1, returnValue: '', structLogs: [step('PUSH1', 1), ...sub(TOKEN, [log3(2, T_TRANSFER, ME, ROUTER, paid)]), ...sub(WAVAX, [log3(2, T_TRANSFER, ROUTER, ME, E18 / 2n)]), step('STOP', 1)] });
const abiString = (s) => '0x' + pad(32n) + pad(BigInt(s.length)) + Buffer.from(s).toString('hex').padEnd(64, '0');
const CHAIN = { [TOKEN]: ['DUSDC', 6], [WAVAX]: ['WAVAX', 18], [OTHER]: ['WETH', 18] };

let F, clock, n = 0, wallet, revokeAnswer, allowance;
beforeEach(() => { clock = fakeClock(); F = makeChrome(); globalThis.chrome = F.chrome; wallet = []; revokeAnswer = { state: 'submitted' }; allowance = 0n; });
afterEach(() => { clock.restore(); delete globalThis.chrome; });
// No token is ever declared here. `spenders` : the contracts a right may be given to (written_check.js : the public list of the network, plus
// what the person declared in the settings) ; [] = a FRESH profile on a network whose contracts nobody knows. `node` : false = the wallet's
// node does not answer.
function worker({ node = true, trace = swapTrace(50n * U), chain = CHAIN, classify = null, spenders = [ROUTER] } = {}) {
  const reads = [];
  if (spenders.length) F.state.local.contexte = { knownSpenders: spenders };
  F.chrome.tabs.sendMessage = async (tabId, msg, opts) => {
    if (msg.type === 'hu.revoke.run') { wallet.push({ tabId, frameId: opts && opts.frameId, method: msg.method, params: msg.params }); return revokeAnswer; }
    if (msg.type !== 'hu.rpc') return undefined;
    reads.push(msg.method + (msg.revoke ? ':revoke' : ''));
    if (!node) return { ok: false };
    if (msg.method === 'debug_traceCall') return trace ? { ok: true, result: trace } : { ok: false };
    const { to, data } = msg.params[0], known = chain[to];
    if (data.startsWith('0xdd62ed3e')) return { ok: true, result: '0x' + pad(allowance) };
    if (!known) return { ok: false };
    if (data.startsWith('0x95d89b41')) return { ok: true, result: abiString(known[0]) };
    if (data.startsWith('0x313ce567')) return { ok: true, result: '0x' + pad(BigInt(known[1])) };
    return { ok: false };
  };
  const base = { texts: { reel: 'Ligne du moteur.' }, reasons: [], risk_signals: [] };
  createGatekeeper({ closeMs: 0, classify, check: async (body) => {
    const d = String(body.params && body.params[0] && body.params[0].data || '');
    if (d.startsWith('0x5c11d795')) return { ...base, level: 'unknown', indeterminate: true, opacity_only: true, codes: ['unknown_selector', 'opaque'], effects: { grants_right: false, funds_out: false } };
    if (d.startsWith('0x095ea7b3') && d.endsWith('f'.repeat(64))) return { ...base, level: 'danger', codes: ['unlimited_allowance'], effects: { grants_right: true, funds_out: false } };
    if (/^wallet_(watchAsset|requestExecutionPermissions|grantPermissions)$/.test(body.method)) return { ...base, level: 'unknown', indeterminate: true, effects: { grants_right: false, funds_out: false } };
    return { ...base, level: 'attention', effects: { grants_right: d.startsWith('0x095ea7b3') || body.method === 'eth_signTypedData_v4', funds_out: d.startsWith('0xa9059cbb') } };
  } });
  return reads;
}
const recOf = (rid) => F.state.session['hu:req:' + rid];
async function gate(payload, { tab = TAB, origin = SITE, frame = 0 } = {}) {
  const rid = 'rid-cmp-' + String(++n).padStart(6, '0'), page = F.page(tab, origin, frame), before = F.state.windows.size;
  const r = await F.send({ type: 'gate', rid, payload: Object.assign({ kind: 'gate' }, payload) }, page);
  const win = () => F.win(recOf(rid) ? recOf(rid).windowId : -1, rid);
  const g = { rid, page, r, opened: F.state.windows.size - before, windowId: () => recOf(rid) && recOf(rid).windowId };
  g.screen = async () => (await F.send({ type: 'hu.view', rid }, win())).view.screen;
  g.write = async (text) => { clock.advance(1000); const v = (await F.send({ type: 'hu.view', rid }, win())).view; return (await F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'answer', text }, win())).view.screen; };
  g.go = async (auto = false) => { clock.advance(1000); const v = (await F.send({ type: 'hu.view', rid }, win())).view; return F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'continue', phraseOk: true, auto }, win()); };
  g.cancel = async () => { const v = (await F.send({ type: 'hu.view', rid }, win())).view; return F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'cancel' }, win()); };
  g.poll = () => F.send({ type: 'hu.poll', rid }, page);
  g.wait = () => F.send({ type: 'hu.wait', rid }, win());
  return g;
}
const journal = () => F.state.local.log || [];
const told = (type) => F.state.runtimeMessages.filter((m) => m && m.type === type);

// ------------------------------------------------------------------------------------------------ fresh profile, the three modes
test('honest site, no token declared : one window, "Ça correspond" twice, both requests reach the wallet as the site sent them', async () => {
  const reads = worker();
  assert.equal(F.state.local.contexte.tokens, undefined, 'no token was declared');
  const a = await gate(approve(50n * U));
  assert.equal(a.opened, 1); assert.equal((await a.screen()).kind, 'question');
  const s1 = await a.write(SAID);
  assert.equal(s1.outcome, 'match'); assert.equal(s1.headline, 'Ça correspond à ce que tu as écrit.'); assert.equal(s1.autoMs, 1000);
  assert.equal(s1.line, 'La demande donne accès à 50 USDC, pas plus. Le jeton 0xc3c3…c3c3 se présente comme DUSDC.', 'the name is what the contract declares, the address is shown');
  assert.equal(s1.network, 'Avalanche');
  assert.ok(reads.includes('eth_call'), 'symbol and decimals were read through the wallet, without any setting');
  const r1 = await a.go(true);
  assert.equal(r1.status, 'allow'); assert.equal(r1.more, true, 'the exchange has not happened yet : the window stays');
  assert.equal((await a.poll()).params, undefined, 'the approval goes as the site wrote it');
  assert.equal(F.state.windows.size, 1); assert.equal((await a.wait()).status, 'wait');

  clock.advance(4000);
  const b = await gate(opaque(50n * U));
  assert.equal(b.opened, 0, 'no second window'); assert.equal(b.windowId(), a.windowId());
  assert.deepEqual(told('hu.next').map((m) => [m.prev, m.rid]), [[a.rid, b.rid]]);
  assert.deepEqual(await a.wait(), { status: 'next', rid: b.rid }, 'the window finds the next request by itself too');
  const s2 = await b.screen();
  assert.equal(s2.kind, 'answer', 'not asked again'); assert.equal(s2.outcome, 'match'); assert.equal(s2.step, 2); assert.equal(s2.autoMs, 1000);
  assert.equal(s2.line, 'D’après la simulation, 50 DUSDC sortent de ton compte et 0,5 WAVAX y entre.');
  const r2 = await b.go(true);
  assert.equal(r2.status, 'allow'); assert.ok(!r2.more); assert.equal((await b.poll()).state, 'allow');
  assert.equal(F.state.windows.size, 0, 'the operation is over : the window is gone');
  assert.deepEqual(told('hu.closing').map((m) => [m.rid, m.why]), [[b.rid, 'allow']], 'the window was told, so its last message is shown before it closes');
});

test('unlimited right asked for an exchange : it is limited to 50, it matches, and the WALLET gets approve(spender, 50)', async () => {
  worker();
  const g = await gate(approve(MAX));
  const s = await g.write(SAID);
  assert.equal(s.outcome, 'match'); assert.equal(s.headline, 'Ça correspond à ce que tu as écrit.');
  assert.equal(s.line, LIMITED + ' Le jeton 0xc3c3…c3c3 se présente comme DUSDC.'); assert.equal(s.leftMs, 0);
  const r = await g.go(true);
  assert.equal(r.status, 'allow'); assert.equal(r.line, s.line, 'the window keeps the line while it waits for the exchange');
  const p = await g.poll();
  assert.equal(p.state, 'allow'); assert.equal(p.params.length, 1);
  assert.equal(p.params[0].data, '0x095ea7b3' + pad(ROUTER) + pad(50n * U), 'the calldata handed to the wallet carries 50 USDC, same spender');
  assert.equal(p.params[0].to, TOKEN); assert.equal(p.params[0].from, ME);
});

test('trap by signature : a Permit cannot be limited, it does not match and the delay applies', async () => {
  worker();
  const g = await gate(permit(MAX));
  const s = await g.write(SAID);
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.headline, 'Ça ne correspond pas à ce que tu as écrit.'); assert.equal(s.leftMs, 30000); assert.ok(!s.autoMs);
  assert.match(s.line, /Cette signature donne accès à tout ton .* et ne peut pas être limitée\./);
  assert.equal((await g.go()).status, 'again'); assert.equal((await g.poll()).state, 'pending');
});

test('FRESH profile, nothing declared, the three modes : a right given to an address nobody knows never leaves without the delay', async () => {
  // honest : approve of exactly 50 to the site's own contract. Nobody can say who that contract is : "not verified", 30 s, a gesture.
  worker({ spenders: [] });
  assert.deepEqual(F.state.local, {}, 'nothing was set up');
  let g = await gate(approve(50n * U)); let s = await g.write(SAID);
  assert.equal(s.outcome, 'unverifiable'); assert.equal(s.line, 'Tu donnes ce droit à 0xd4d4…d4d4, une adresse que je ne connais pas.'); assert.equal(s.leftMs, 30000); assert.ok(!s.autoMs);
  assert.equal((await g.go(true)).status, 'again'); assert.equal((await g.poll()).state, 'pending');
  // trap : unlimited right to an unknown address. "Continuer" is never active at once, and nothing goes by itself.
  g = await gate(approve(MAX, THIEF), { tab: TAB + 1 }); s = await g.write(SAID);
  assert.notEqual(s.outcome, 'match'); assert.equal(s.leftMs, 30000); assert.ok(!s.autoMs);
  assert.equal((await g.go(true)).status, 'again'); assert.equal((await g.poll()).state, 'pending');
  // trap by signature
  g = await gate(permit(MAX), { tab: TAB + 2 }); s = await g.write(SAID);
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.leftMs, 30000); assert.equal((await g.go(true)).status, 'again');
});

test('the token cannot be read : a request that gives a right never leaves without a delay, honest or trap', async () => {
  for (const amount of [50n * U, MAX]) {
    F = makeChrome(); globalThis.chrome = F.chrome; worker({ node: false });
    const g = await gate(approve(amount, THIEF));
    const s = await g.write(SAID);
    assert.notEqual(s.outcome, 'match'); assert.equal(s.leftMs, 30000, 'held 30 s'); assert.ok(!s.autoMs);
    assert.equal((await g.go()).status, 'again'); assert.equal((await g.poll()).state, 'pending', 'Continuer is refused before the delay');
  }
  // the limitation switched off in the settings : same thing, it does not match and it waits
  F = makeChrome(); globalThis.chrome = F.chrome; worker(); await F.chrome.storage.local.set({ cfg: { limitUnlimited: false } });
  const g = await gate(approve(MAX, THIEF)); const s = await g.write(SAID);
  assert.equal(s.outcome, 'mismatch'); assert.equal(s.leftMs, 30000); assert.equal((await g.go()).status, 'again');
});

// ------------------------------------------------------------------------------------------------ one window, every request checked
test('one window per operation : a request that goes beyond the sentence is shown in the SAME window as a mismatch, never sent by itself', async () => {
  const cases = [
    ['a second right', approve(50n * U, THIEF), /Tu as déjà donné une autorisation/],
    ['another token', approve(50n * U, ROUTER, OTHER), /./],
    ['a larger total', opaque(51n * U), /La demande fait sortir 51 DUSDC/]
  ];
  for (const [name, payload, line] of cases) {
    F = makeChrome(); globalThis.chrome = F.chrome; worker({ trace: swapTrace(51n * U) });
    const a = await gate(approve(50n * U)); await a.write(SAID); assert.equal((await a.go(true)).more, true);
    const b = await gate(payload);
    assert.equal(b.opened, 0, name + ' : same window'); assert.equal(b.windowId(), a.windowId());
    const s = await b.screen();
    assert.equal(s.kind, 'answer'); assert.equal(s.outcome, 'mismatch', name); assert.match(s.line, line); assert.equal(s.leftMs, 30000); assert.ok(!s.autoMs);
    assert.equal((await b.go(true)).status, 'again', name + ' : it does not leave by itself'); assert.equal((await b.poll()).state, 'pending');
    await b.cancel(); assert.equal((await b.poll()).state, 'deny'); assert.equal(F.state.windows.size, 0);
  }
});

test('one window per operation : a payment to another recipient than the one written does not match', async () => {
  worker({ chain: { [TOKEN]: ['USDC', 6] } });
  const a = await gate(transfer(FRIEND, 20n * U)); const s1 = await a.write('envoyer 40 USDC à ' + FRIEND);
  assert.equal(s1.outcome, 'mismatch', '20 is not 40');
  await a.cancel();
  const b = await gate(transfer(FRIEND, 20n * U), { tab: TAB + 1 }); assert.equal((await b.write('envoyer 20 USDC à ' + FRIEND)).outcome, 'match');
  assert.equal((await b.go(true)).status, 'allow');
  const c = await gate(transfer(THIEF, 20n * U), { tab: TAB + 1 });
  const s = await c.screen();
  assert.equal(s.kind, 'answer'); assert.equal(s.outcome, 'mismatch'); assert.ok(s.addresses, 'the two addresses are shown'); assert.ok(!s.autoMs);
});

test('O2, O3 : within the 90 s, a request that could not be COMPARED to the sentence never leaves by itself', async () => {
  // O2 : after the approval that matched, a plain transfer of 50 to a third party (the sentence was an exchange)
  worker({ trace: null });
  let a = await gate(approve(50n * U)); await a.write(SAID); await a.go(true);
  let b = await gate(transfer(THIEF, 50n * U));
  let s = await b.screen();
  assert.equal(s.kind, 'answer'); assert.notEqual(s.outcome, 'match'); assert.ok(!s.autoMs); assert.equal(s.leftMs, 30000);
  assert.equal((await b.go(true)).status, 'again'); assert.equal((await b.poll()).state, 'pending');
  // O3 : an exchange of 5 000 the engine reads but nobody measured (no simulation on this node)
  F = makeChrome(); globalThis.chrome = F.chrome; worker({ trace: null });
  a = await gate(approve(50n * U)); await a.write(SAID); await a.go(true);
  b = await gate(readable(5000n * U));
  s = await b.screen();
  assert.equal(s.outcome, 'unverifiable'); assert.equal(s.line, 'Je n’ai pas pu comparer cette demande à ce que tu as écrit.'); assert.equal(s.leftMs, 30000); assert.ok(!s.autoMs);
  assert.equal((await b.go(true)).status, 'again');
});

test('one window per operation : the wait ends by itself, closing the waiting window ends the operation, and another site never inherits it', async () => {
  worker();
  const a = await gate(approve(50n * U)); await a.write(SAID); await a.go(true);
  const wid = a.windowId();
  assert.ok(F.state.alarms.has('hu:keep:' + TAB + ':0'), 'an alarm ends the wait even if the worker sleeps');
  clock.advance(61000); await F.fireAlarm('hu:keep:' + TAB + ':0');
  assert.equal(F.state.windows.has(wid), false, 'nothing came in 60 s : the window closes');
  assert.deepEqual(told('hu.closing').map((m) => m.why), ['idle']);
  assert.equal((await a.wait()).status, 'gone');
  // closed by the person while it waits : the next request is asked about again
  F = makeChrome(); globalThis.chrome = F.chrome; worker();
  const c = await gate(approve(50n * U)); await c.write(SAID); await c.go(true);
  await F.userClosesWindow(c.windowId());
  const d = await gate(opaque(50n * U));
  assert.equal(d.opened, 1); assert.equal((await d.screen()).kind, 'question');
  // the tab goes to another site : the kept window closes
  F = makeChrome(); globalThis.chrome = F.chrome; worker();
  const e = await gate(approve(50n * U)); await e.write(SAID); await e.go(true);
  await F.send({ type: 'hu.page' }, F.page(TAB, 'https://autre.exemple.org'));
  assert.equal(F.state.windows.size, 0);
  // only the window itself may ask what comes next
  assert.equal((await F.send({ type: 'hu.wait', rid: e.rid }, F.page(TAB, SITE))).status, 'gone');
});

// ------------------------------------------------------------------------------------------------ journal
test('journal : who decided (the person, or the window by itself) and what was really sent (asked, limited) ; never an address', async () => {
  worker();
  const g = await gate(approve(MAX)); await g.write(SAID); await g.go(true);
  const h = await gate(permit(MAX), { tab: TAB + 5 }); await h.write(SAID); clock.advance(31000); await h.go(false);
  const confirms = journal().filter((e) => e.type === 'decision' && e.decision === 'confirm');
  assert.equal(confirms.length, 2);
  assert.equal(confirms[0].by, 'auto'); assert.equal(confirms[0].gesture, false); assert.equal(confirms[0].outcome, 'match');
  assert.deepEqual(confirms[0].sent, { limited: true, asked: 'sans limite', sent: '50 USDC' });
  assert.ok(confirms[0].codes.includes('droit_limite') && confirms[0].codes.includes('envoi_automatique'));
  assert.equal(confirms[1].by, 'human'); assert.equal(confirms[1].gesture, true); assert.equal(confirms[1].outcome, 'mismatch'); assert.deepEqual(confirms[1].sent, { limited: false });
  const all = JSON.stringify([F.state.local.log, F.state.local.chain, F.state.local.confirms]).toLowerCase();
  for (const a of [ME, THIEF, ROUTER, TOKEN]) assert.ok(!all.includes(a.slice(2)), 'no address in the journal, its chained copy or the confirmations');
  assert.ok(!all.includes('échanger 50'), 'nor the sentence');
  assert.ok(F.state.local.chain.entries.some((e) => e.d === 'confirm' && e.c.includes('droit_limite')), 'the chained copy says the right was limited');
});

// ------------------------------------------------------------------------------------------------ requests nobody reads
test('held and said : a lasting permission, a token added under a name the site chose, hidden settings of a batch ; the network is shown', async () => {
  worker();
  const lines = async (payload, tab) => { const g = await gate(payload, { tab }); const s = await g.screen(); return s; };
  let s = await lines({ method: 'wallet_watchAsset', params: { type: 'ERC20', options: { address: TOKEN, symbol: 'USDC', decimals: 6 } }, chainId: '0x1', from: ME }, 70);
  assert.equal(s.kind, 'answer'); assert.equal(s.outcome, 'unverifiable'); assert.equal(s.leftMs, 30000);
  assert.equal(s.line, 'Ce site veut ajouter un jeton à ton portefeuille sous le nom USDC (0xc3c3…c3c3). Ce nom est choisi par le site.');
  assert.equal(s.network, 'Ethereum');
  s = await lines({ method: 'wallet_requestExecutionPermissions', params: [{ permission: { type: 'erc20-token-periodic' } }], chainId: '0x539', from: ME }, 71);
  assert.equal(s.outcome, 'unverifiable'); assert.equal(s.line, 'Ce site demande un droit durable sur ton compte. Je ne sais pas en lire les limites.');
  assert.equal(s.network, 'réseau n° 1337', 'an unknown network is shown by its number');
  s = await lines({ method: 'wallet_sendCalls', chainId: '0x1', from: ME, params: [{ from: ME, calls: [{ to: TOKEN, data: '0x095ea7b3' + pad(ROUTER) + pad(50n * U) }], capabilities: { paymasterService: { url: 'https://x.example' } } }] }, 72);
  assert.equal(s.kind, 'answer', 'no question : it is not verified whatever is written'); assert.equal(s.outcome, 'unverifiable'); assert.equal(s.line, 'Cette demande contient des réglages que je ne sais pas lire.');
  const inject = readFileSync(join(DIR, 'inject.js'), 'utf8'), gated = inject.slice(inject.indexOf('const GATED'), inject.indexOf('const JOURNAL'));
  for (const m of ['wallet_requestExecutionPermissions', 'wallet_watchAsset', 'wallet_grantPermissions', 'wallet_sendCalls']) assert.ok(gated.includes("'" + m + "'"), m + ' is held by inject.js');
  assert.ok(!gated.includes("'wallet_switchEthereumChain'"), 'a network change passes ; the window names the network');
  assert.equal(OUT.networkName('0xa869'), 'Avalanche Fuji (test)'); assert.equal(OUT.networkName(null), '');
});

test('readable units : the raw amount of the engine line ("50000000 jetons") is never shown ; the name of the token, or its shortened address', async () => {
  const engine = async () => ({ level: 'attention', texts: { reel: 'Tu donnes à ce site le droit de prendre 50000000 jetons, pas plus.' }, reasons: [], risk_signals: [], effects: { grants_right: true, funds_out: false } });
  const lineFor = async (node) => {
    F = makeChrome(); globalThis.chrome = F.chrome;
    F.chrome.tabs.sendMessage = async (tabId, msg) => { if (msg.type !== 'hu.rpc' || !node) return { ok: false }; const d = msg.params[0].data; return { ok: true, result: d.startsWith('0x95d89b41') ? abiString('DUSDC') : '0x' + pad(6n) }; };
    createGatekeeper({ closeMs: 0, check: engine });
    const g = await gate(approve(50n * U)); await g.write('échanger des dollars');           // no amount with a token name : one follow-up
    return (await g.write('je veux juste échanger')).line;                                     // still vague : the engine's line is shown
  };
  assert.equal(await lineFor(true), 'Tu donnes à ce site le droit de prendre 50 DUSDC, pas plus.');
  assert.match(await lineFor(false), /^Tu donnes à ce site le droit de prendre 50000000 unités du jeton 0xc3c3.?….?c3c3, pas plus.$/u);
});

// ------------------------------------------------------------------------------------------------ the fallback in the page
test('fallback in the page : the window\'s own sentences, no invented phrase, no assumed intent, no icon, no colour band', async () => {
  worker(); F.state.failWindow = true;
  const g = await gate(approve(MAX, THIEF));
  const p = await g.poll();
  assert.equal(p.ui, 'overlay');
  const s = p.view.screen;
  assert.equal(s.kind, 'answer'); assert.equal(s.outcome, 'unverifiable'); assert.equal(s.headline, 'Je n’ai pas pu vérifier cette demande.');
  assert.equal(s.line, 'La fenêtre Hold up n’a pas pu s’ouvrir. Je n’ai pas pu te demander ce que tu veux faire.'); assert.equal(s.leftMs, 30000);
  assert.equal(recOf(g.rid).intent, null, 'no intent is assumed');
  assert.ok(journal().some((e) => e.type === 'ui_fallback'));
  const src = readFileSync(join(DIR, 'bridge.js'), 'utf8');
  for (const bad of ['<svg', 'DANGER', 'Danger', 'Stop. Ne signe pas', 'Tu as dit', 'En réalité', 'Je signe', 'linear-gradient', 'box-shadow:0 8px 30px', '#AF111E', '#1747A6', 'showChoices', 'Je reçois de l']) assert.ok(!src.includes(bad), 'bridge.js no longer holds : ' + bad);
  const css = src.slice(src.indexOf('const CSS = `'), src.indexOf('const FALLBACK'));
  const colours = [...new Set(css.match(/#[0-9a-fA-F]{3,8}\b/g))];
  assert.ok(colours.every((c) => { const h = c.slice(1); const v = h.length === 3 ? [h[0], h[1], h[2]] : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)]; return v[0] === v[1] && v[1] === v[2]; }), 'greys only : ' + colours.join(' '));
  assert.ok(src.includes("view.stage === 'verdict' && view.screen && view.screen.kind === 'answer'"), 'it draws the answer the worker wrote, nothing else');
});

// ------------------------------------------------------------------------------------------------ the surface : timing and hooks
function surface() {
  let now = 1000; const timers = [];
  const mk = (tag) => { const set = new Set(); const e = { tag, children: [], attrs: {}, listeners: {}, hidden: false, textContent: '', value: '',
    classList: { add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c) },
    appendChild(c) { e.children.push(c); return c; }, removeChild(c) { e.children.splice(e.children.indexOf(c), 1); },
    setAttribute(k, v) { e.attrs[k] = String(v); }, getAttribute(k) { return k in e.attrs ? e.attrs[k] : null; }, removeAttribute(k) { delete e.attrs[k]; },
    addEventListener(t, f) { (e.listeners[t] = e.listeners[t] || []).push(f); }, focus() {} };
    Object.defineProperty(e, 'firstChild', { get: () => e.children[0] || null }); return e; };
  const sb = { document: { createElement: mk }, Date: { now: () => now },
    setTimeout: (f, ms) => { timers.push({ f, at: now + ms }); return timers.length; }, clearTimeout: (i) => { if (timers[i - 1]) timers[i - 1].f = null; },
    setInterval: (f, ms) => { timers.push({ f, at: now + ms, every: ms }); return timers.length; }, clearInterval: (i) => { if (timers[i - 1]) timers[i - 1].f = null; } };
  sb.window = sb; vm.createContext(sb); vm.runInContext(readFileSync(join(DIR, 'ui', 'screen.js'), 'utf8'), sb);
  const root = mk('div'), calls = [];
  const ui = sb.HoldupScreen.mount(root, { onSubmit: (t) => calls.push(['submit', t]), onCancel: () => calls.push(['cancel']), onContinue: (auto) => calls.push(['continue', auto]), onClose: () => calls.push(['close']) });
  const all = (e, out = []) => { out.push(e); for (const c of e.children) all(c, out); return out; };
  // moves the clock, running what is due in order
  const advance = (ms) => { const end = now + ms; for (;;) { const due = timers.filter((t) => t.f && t.at <= end).sort((a, b) => a.at - b.at)[0]; if (!due) break; now = due.at; const f = due.f; if (due.every) due.at += due.every; else due.f = null; f(); } now = end; };
  return { ui, calls, root, advance, T: sb.HoldupScreen.TIMING, find: (tag) => all(root).filter((e) => e.tag === tag), texts: () => all(root).map((e) => e.textContent).filter(Boolean), state: () => root.attrs['data-state'] };
}
const Q = { kind: 'question', title: 'Que veux-tu faire sur ce site ?', placeholder: 'Par exemple' };
const A = (o = {}) => Object.assign({ kind: 'answer', outcome: 'match', headline: 'Ça correspond à ce que tu as écrit.', line: 'La demande donne accès à 50 USDC, pas plus.', leftMs: 0 }, o);
const type = (S, text) => { const f = S.find('textarea')[0]; f.value = text; f.listeners.input[0](); f.listeners.keydown[0]({ key: 'Enter', preventDefault() {} }); };

test('timing : the loading state appears only after 150 ms of waiting ; a fast answer never flashes "Vérification…"', () => {
  let S = surface(); S.ui.show(Q, 'r:intent:1'); S.advance(2000); type(S, SAID);
  assert.deepEqual(S.calls, [['submit', SAID]]);
  assert.equal(S.state(), 'question'); assert.ok(!S.texts().includes('Vérification…'), 'nothing changes on screen at once');
  S.advance(20); S.ui.show(A(), 'r:verdict:answer');
  assert.equal(S.state(), 'answer', 'answer after 20 ms : drawn directly'); assert.ok(S.texts().includes('Ça correspond à ce que tu as écrit.'));
  S.advance(1000); assert.ok(!S.texts().includes('Vérification…'), 'and the loading state never came afterwards');
  // slow answer : the loading state is drawn at 150 ms, and then stays 400 ms at least
  S = surface(); S.ui.show(Q, 'r:intent:1'); S.advance(2000); type(S, SAID);
  S.advance(149); assert.equal(S.state(), 'question');
  S.advance(2); assert.equal(S.state(), 'checking'); assert.ok(S.texts().includes('Vérification…') && S.texts().includes('Je compare ta phrase à la demande.'));
  S.advance(100); S.ui.show(A(), 'r:verdict:answer');
  assert.equal(S.state(), 'checking', 'shown 100 ms ago : it is not replaced yet');
  S.advance(217); assert.equal(S.state(), 'checking'); assert.ok(!S.root.classList.contains('is-leaving'));
  S.advance(2); assert.ok(S.root.classList.contains('is-leaving'), 'the leaving hook is set just before the swap');
  S.advance(81); assert.equal(S.state(), 'answer'); assert.ok(S.root.classList.contains('is-entering') && !S.root.classList.contains('is-leaving'));
});

test('timing : "Ça correspond" stays one second, then the window continues by itself and says so to the worker (auto) ; the end message waits its turn', () => {
  const S = surface(); S.ui.show(A({ autoMs: 1000 }), 'r:verdict:answer');
  assert.deepEqual(S.find('button').map((b) => b.textContent), ['Annuler']);
  S.advance(999); assert.deepEqual(S.calls, []);
  S.advance(1); assert.deepEqual(S.calls, [['continue', true]]);
  assert.equal(S.ui.end('La demande part vers ton portefeuille.'), 0, 'the answer had its time : the message is drawn now');
  assert.equal(S.state(), 'end'); assert.deepEqual(S.texts(), ['La demande part vers ton portefeuille.']);
  // a message that comes right after a redraw waits until the state on screen has had 400 ms
  const S2 = surface(); S2.ui.show(A({ leftMs: 0 }), 'r:verdict:answer'); S2.advance(100);
  assert.equal(S2.ui.end('Demande annulée. Rien n’a été envoyé.'), 300, 'the caller adds its own display time to this');
  assert.equal(S2.state(), 'answer'); S2.advance(300); assert.equal(S2.state(), 'end');
  const win = readFileSync(join(DIR, 'window.js'), 'utf8');
  assert.match(win, /const END_MS = (\d+)/); assert.ok(Number(win.match(/const END_MS = (\d+)/)[1]) >= 400, 'the last message stays at least 400 ms before window.close()');
  assert.ok(win.includes('setTimeout(() => { try { window.close(); } catch (_) {} }, lead + END_MS)'));
  const gk = readFileSync(join(DIR, 'gatekeeper.js'), 'utf8');
  assert.ok(Number(gk.match(/const CLOSE_MS = (\d+)/)[1]) > Number(win.match(/const END_MS = (\d+)/)[1]) + 400, 'the worker removes the window only after the page had time to show its message');
  assert.equal(Number(gk.match(/const AUTO_MS = (\d+)/)[1]), 1000);
});

test('surface : the waiting state of an operation, the step and the network in small print, the verdict-change hook, the written end of a delay', () => {
  const S = surface();
  S.ui.show(A({ autoMs: 1000, network: 'Avalanche', noModel: true }), 'r1:verdict:answer');
  assert.ok(S.texts().includes('Réseau : Avalanche.') && S.texts().includes('intention classée sans modèle'));
  S.advance(1000);
  S.ui.end('La demande part vers ton portefeuille.', { wait: true, line: LIMITED, waitText: 'J’attends la suite de l’opération.' });
  assert.equal(S.state(), 'waiting'); assert.equal(S.ui.state(), 'waiting');
  assert.deepEqual(S.texts(), ['La demande part vers ton portefeuille.', LIMITED, 'J’attends la suite de l’opération.', 'Fermer']);
  S.find('button')[0].listeners.click[0](); assert.deepEqual(S.calls.pop(), ['close'], 'Fermer closes ; it never cancels a request already sent');
  S.root.listeners.keydown[0]({ key: 'Escape', preventDefault() {} }); assert.deepEqual(S.calls.pop(), ['close']);
  S.advance(500);
  S.ui.show(A({ outcome: 'mismatch', headline: 'Ça ne correspond pas à ce que tu as écrit.', line: 'x', leftMs: 2000, step: 2 }), 'r2:verdict:answer');
  assert.equal(S.state(), 'answer'); assert.equal(S.root.attrs['data-outcome'], 'mismatch'); assert.equal(S.root.attrs['data-from-outcome'], 'match');
  assert.ok(S.root.classList.contains('is-verdict-change'));
  assert.ok(S.texts().includes('Demande n° 2 de la même opération.'));
  assert.ok(S.texts().includes('Continuer sera possible dans 2 s.'));
  S.advance(2100); assert.ok(S.texts().includes('Tu peux continuer.'), 'the end of the delay is written on screen');
  // an empty field is said in words
  const S3 = surface(); S3.ui.show(Q, 'k'); S3.find('textarea')[0].listeners.keydown[0]({ key: 'Enter', preventDefault() {} });
  assert.ok(S3.texts().includes('Écris d’abord ce que tu veux faire.')); assert.deepEqual(S3.calls, []);
});

// ------------------------------------------------------------------------------------------------ tester report 3 (keyboard only, 150 to 200 %)
test('a held request has a lifetime : nobody acts for 3 minutes, it is cancelled with a message, never sent', async () => {
  worker();
  const g = await gate(permit(MAX)); const s = await g.write(SAID);
  assert.equal(s.outcome, 'mismatch');
  clock.advance(30000 + 179000); assert.equal((await g.poll()).state, 'pending', 'the delay, then just under three minutes');
  clock.advance(2000); await F.fireAlarm('hu:exp:' + g.rid);
  assert.equal((await g.poll()).state, 'deny', 'cancelled, and "Continuer" 312 s after the opening can no longer send it');
  assert.equal((await F.send({ type: 'hu.decision', rid: g.rid, seq: 2, decision: 'continue', phraseOk: true }, F.win(g.windowId(), g.rid))).status, 'ignored');
  assert.ok(told('hu.closing').some((m) => m.rid === g.rid && m.why === 'expired'), 'the window is told why');
  assert.ok(readFileSync(join(DIR, 'window.js'), 'utf8').includes("expired: 'Cette demande a attendu trop longtemps. Elle est annulée, rien n’a été envoyé.'"));
  assert.ok(journal().some((e) => e.type === 'decision' && e.decision === 'cancel' && e.by === 'expired'));
  // a question nobody answers ends the same way
  const q = await gate(approve(50n * U), { tab: TAB + 3 });
  clock.advance(181000); await F.fireAlarm('hu:exp:' + q.rid);
  assert.equal((await q.poll()).state, 'deny');
});

test('"Continuer" is visibly inactive while a press would be refused (first 700 ms of an answer) : never a press swallowed in silence', () => {
  const S = surface(); S.ui.show(A({ leftMs: 0 }), 'r:verdict:answer');
  const go = () => S.find('button').find((b) => b.textContent === 'Continuer');
  assert.equal(go().attrs['aria-disabled'], 'true', 'inactive, and it shows');
  S.advance(100); go().listeners.click[0](); assert.deepEqual(S.calls, [], 'nothing is sent, and the button said so');
  assert.ok(!S.texts().some((t) => /Continuer sera possible/.test(t)), 'no countdown for this short guard');
  S.advance(700); assert.equal(go().attrs['aria-disabled'], undefined);
  go().listeners.click[0](); assert.deepEqual(S.calls, [['continue', false]]);
  assert.ok(S.T.guard >= 600, 'at least the worker\u2019s own minimum (hold_core.js minShowMs)');
});

test('a sentence longer than the limit is never checked cut : said before the limit, refused beyond it, by the window and by the worker', async () => {
  const S = surface(); S.ui.show(Object.assign({ max: 500 }, Q), 'k');
  const f = S.find('textarea')[0];
  assert.equal(f.maxLength, undefined, 'no silent cut of a pasted text');
  f.value = 'a'.repeat(460); f.listeners.input[0](); assert.ok(S.texts().includes('Il reste 40 signes.'));
  f.value = 'échanger 50 USDC contre AVAX ' + 'et puis '.repeat(70); f.listeners.input[0]();
  const n = f.value.replace(/\s+/g, ' ').trim().length;
  assert.ok(S.texts().includes('Ta phrase fait ' + n + ' signes. Le maximum est 500 : raccourcis-la, je ne vérifie pas une phrase coupée.'));
  f.listeners.keydown[0]({ key: 'Enter', preventDefault() {} }); assert.deepEqual(S.calls, [], 'not sent');
  // the follow-up question recalls the first sentence and counts it in the limit
  const S2 = surface(); S2.ui.show({ kind: 'question', title: 'Combien, et de quel jeton ?', placeholder: '', first: 'échanger des dollars', max: 479 }, 'k2');
  assert.ok(S2.texts().includes('Tu as écrit : « échanger des dollars »'));
  // whatever a window sends, the worker never judges a cut sentence
  worker();
  const g = await gate(approve(50n * U));
  const s = await g.write(SAID + ' ' + 'et puis '.repeat(70));
  assert.equal(s.kind, 'answer'); assert.equal(s.outcome, 'unverifiable'); assert.equal(s.line, 'Ta phrase est trop longue pour que je la lise en entier. Je ne vérifie pas une phrase coupée.');
  assert.equal(s.leftMs, 30000); assert.ok(!s.autoMs);
});

test('advice only where it applies : no "Réduis le plafond" when the written amount is the network\u2019s own currency, and "Continuer" is not active at once', async () => {
  worker();
  const g = await gate(approve(MAX)); const s = await g.write('échanger 50 AVAX contre de l’USDC');
  assert.notEqual(s.outcome, 'match'); assert.ok(!/Réduis le plafond/.test(s.line), s.line);
  assert.equal(s.leftMs, 30000); assert.equal((await g.go(false)).status, 'again');
});

// ------------------------------------------------------------------------------------------------ words, settings, build
test('words : one name, a description with its accents, no developer word on any surface', () => {
  const mf = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8'));
  assert.equal(mf.name, 'Hold up'); assert.equal(mf.action.default_title, 'Hold up');
  assert.equal(mf.description, 'Écris ce que tu veux faire. Hold up te dit si la demande de signature correspond.');
  const panel = readFileSync(join(DIR, 'ui', 'sidepanel.js'), 'utf8');
  const strings = (src) => [...src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map((m) => m[1]).filter((s) => /[a-zà-ÿ]{3,} [a-zà-ÿ]{2,}/i.test(s));
  for (const s of strings(panel)) assert.ok(!/\.mjs|\(JSON\)|fournisseur|Danger|Manipulation|\bAttention\b/.test(s), 'side panel : ' + s);
  const screen = readFileSync(join(DIR, 'ui', 'screen.js'), 'utf8');
  assert.ok(screen.includes("'intention classée sans modèle'") && screen.includes("'intention classée par Clef'"), 'kept, in the small print');
  const css = readFileSync(join(DIR, 'ui', 'screen.css'), 'utf8');
  assert.match(css, /\.hu-note \{[^}]*font-size: 12px/);
  // every sentence shown by the window, the fallback, the panel and the settings is French
  const shown = strings(screen).concat(strings(readFileSync(join(DIR, 'window.js'), 'utf8')), strings(readFileSync(join(DIR, 'options.js'), 'utf8')), strings(panel));
  for (const s of shown) assert.ok(!/\b(the|request|please|invalid|error|expected|unknown|cancel|failed)\b/i.test(s), 'English on a surface : ' + s);
});

test('settings : one page for every build, plain fields, French errors, and nothing false about the network', async () => {
  const html = readFileSync(join(DIR, 'options.html'), 'utf8');
  assert.ok(!/<textarea|JSON|Durées de démo|127\.0\.0\.1/.test(html), 'no JSON to write, no developer button, no claim about the network in the markup');
  for (const id of ['askIntent', 'limitUnlimited', 'dangerWait', 'manipHold', 'contactName', 'contactAddress', 'addContact', 'mineAddress', 'addMine', 'spenderAddress', 'addSpender', 'save', 'net']) assert.ok(html.includes('id="' + id + '"'), id);
  assert.ok(html.includes('prefers-color-scheme:dark'), 'it has a dark theme');
  const src = join(DIR, '..', 'extension_standalone', 'src', 'options.html'), built = join(DIR, '..', 'src', 'options.html');
  assert.ok(!existsSync(src) && !existsSync(built), 'the old copy is gone');
  const sb = { console }; sb.window = sb; vm.createContext(sb); vm.runInContext(readFileSync(join(DIR, 'options.js'), 'utf8'), sb);
  const O = sb.HoldupOptions;
  const csp = (c) => ({ content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'; connect-src " + c } });
  const none = O.networkLines(csp("'none'")).join(' '), relay = O.networkLines(csp('http://127.0.0.1:8789')).join(' '), server = O.networkLines(csp('http://127.0.0.1:8787 http://127.0.0.1:8789')).join(' ');
  assert.match(none, /n’appelle aucun réseau/); assert.ok(!/relais|Clef/.test(none));
  assert.match(relay, /la phrase que tu écris\. Elle va au relais local.*modèle Clef/); assert.ok(!/aucun réseau|rien ne sort|ne quitte/i.test(relay), 'the default build does call the relay : it says so');
  assert.match(server, /serveur local/); assert.match(server, /relais local/);
  // the page reads the manifest of the build that runs : what it says is what the manifest allows
  const mf = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8'));
  assert.equal(/relais local/.test(O.networkLines(mf).join(' ')), /8789/.test(mf.content_security_policy.extension_pages));
  let r = O.checkEntry('Paul', '0x1234', [], true); assert.equal(r.ok, false); assert.equal(r.error, 'Cette adresse n’est pas valide. Elle commence par 0x et compte 42 caractères.');
  r = O.checkEntry('', FRIEND, [], true); assert.equal(r.error, 'Donne un nom à cette adresse.');
  r = O.checkEntry('Paul', FRIEND, [{ label: 'x', address: FRIEND.toUpperCase().replace('0X', '0x') }], true); assert.equal(r.error, 'Cette adresse est déjà dans la liste.');
  r = O.checkEntry(' Paul ', FRIEND, [], true); assert.equal(r.ok, true); assert.equal(r.entry.label, 'Paul'); assert.equal(r.entry.address, FRIEND);
  assert.equal(O.seconds('2', 'dangerWaitMs').ms, 5000); assert.equal(O.seconds('2', 'dangerWaitMs').clamped, true); assert.equal(O.seconds('45', 'dangerWaitMs').ms, 45000); assert.equal(O.seconds('45', 'dangerWaitMs').clamped, false);
  const ctx = O.buildContext({ history: [{ address: THIEF }], tokens: [{ address: TOKEN, symbol: 'USDC', decimals: 6 }], knownSpenders: [ROUTER], contacts: [{ label: 'vieux', address: ME }] }, [{ label: 'Paul', address: FRIEND }], [ME]);
  assert.equal(JSON.stringify(ctx.contacts), JSON.stringify([{ label: 'Paul', address: FRIEND }])); assert.equal(JSON.stringify(ctx.protected), JSON.stringify([ME]));
  assert.equal(ctx.tokens.length, 1); assert.equal(ctx.history.length, 1); assert.equal(ctx.knownSpenders[0], ROUTER, 'what the page does not edit is kept');
  assert.equal(JSON.stringify(O.buildContext({ knownSpenders: [ROUTER] }, [], [], [THIEF, 'x']).knownSpenders), JSON.stringify([THIEF]), 'the contracts the person declares, as plain fields');
});

// ------------------------------------------------------------------------------------------------ revocation (wired by the teammate : revoke_branchement.test.mjs)
// Here : only that it works WITH the changes above (a right limited by Hold up, a token read on its own contract, the side panel).
const PANEL = () => ({ id: F.chrome.runtime.id, url: 'chrome-extension://' + F.chrome.runtime.id + '/ui/sidepanel.html' });
test('revocation with these changes : the right kept is the LIMITED one, a token read on its contract gets "Révoquer", the wallet gets approve(spender, 0)', async () => {
  worker();
  const sent = [];
  const rpc = F.chrome.tabs.sendMessage;
  F.chrome.tabs.sendMessage = async (tabId, msg, opts) => { if (msg.type !== 'hu.revoke.run') return rpc(tabId, msg, opts); sent.push({ tabId, frameId: opts && opts.frameId, msg }); return msg.op === 'read' ? { state: 'read', result: '0x' + pad(allowance) } : { state: 'submitted' }; };
  const g = await gate(approve(MAX)); await g.write(SAID); await g.go(true);
  const kept = F.state.session['hu:grant:' + TAB];
  assert.equal(kept.length, 1); assert.equal(kept[0].result.status, 'revocable'); assert.equal(kept[0].result.oneClick, true);
  assert.equal(kept[0].result.grant.amount, String(50n * U), 'the right as it really went to the wallet : limited to 50');
  assert.match(kept[0].result.says, /le droit de dépenser tes USDC/, 'named from what the token contract declares (no token was set up)');
  assert.ok(!JSON.stringify([F.state.local.log, F.state.local.chain]).toLowerCase().includes(ROUTER.slice(2)), 'addresses stay in session storage');
  const got = await F.send({ type: 'hu.revoke.get', tabId: TAB }, PANEL());
  assert.equal(got.grants.length, 1);
  // a message that carries a request is refused ; a page cannot ask at all
  assert.equal((await F.send({ type: 'hu.revoke.send', tabId: TAB, id: got.grants[0].id, to: TOKEN }, PANEL())).refused, true);
  assert.equal((await F.send({ type: 'hu.revoke.send', tabId: TAB, id: got.grants[0].id }, F.page(TAB, SITE))).refused, true);
  assert.equal(sent.length, 0);
  assert.equal((await F.send({ type: 'hu.revoke.send', tabId: TAB, id: got.grants[0].id, index: 0 }, PANEL())).state, 'submitted');
  assert.equal(sent.length, 1); assert.equal(sent[0].tabId, TAB); assert.equal(sent[0].msg.method, 'eth_sendTransaction');
  assert.equal(sent[0].msg.params[0].data, '0x095ea7b3' + pad(ROUTER) + pad(0n), 'approve(spender, 0)'); assert.equal(sent[0].msg.params[0].to, TOKEN);
  assert.ok(journal().some((e) => e.type === 'revocation' && e.wallet === 'submitted'));
  allowance = 50n * U; assert.equal((await F.send({ type: 'hu.revoke.check', tabId: TAB, id: got.grants[0].id }, PANEL())).state, 'still_active');
  allowance = 0n; assert.equal((await F.send({ type: 'hu.revoke.check', tabId: TAB, id: got.grants[0].id }, PANEL())).state, 'zero');
});

test('revocation in the side panel : "Droits accordés" lists the right of the tab, "Révoquer" asks the worker with a tab and an id only, and says what the wallet answered', async () => {
  const SRC = readFileSync(join(DIR, 'ui', 'sidepanel.js'), 'utf8');
  const mk = (tag) => { const e = { tag, children: [], attrs: {}, listeners: {}, className: '', textContent: '',
    appendChild(c) { e.children.push(c); return c; }, removeChild(c) { e.children.splice(e.children.indexOf(c), 1); },
    setAttribute(k, v) { e.attrs[k] = String(v); }, addEventListener(t, f) { (e.listeners[t] = e.listeners[t] || []).push(f); } };
    Object.defineProperty(e, 'firstChild', { get: () => e.children[0] || null }); return e; };
  const all = (e, out = []) => { out.push(e); for (const c of e.children) all(c, out); return out; };
  const asked = []; let answer = { state: 'rejected' };
  const result = { status: 'revocable', oneClick: true, kind: 'erc20_approve', says: 'Cette demande donne à 0xd4d4…d4d4 le droit de dépenser tes USDC. Pour le retirer, une transaction suffit.', steps: [], requests: [{ method: 'eth_sendTransaction' }] };
  const signed = { status: 'two_steps', oneClick: false, kind: 'eip2612_permit', says: 'Cette signature reste valable tant que personne ne l’a envoyée.', steps: ['Tu signes un permit sans effet.', 'Tu l’envoies.'], requests: [] };
  const chrome = { storage: { local: { get: async () => ({}), remove: async () => {} } }, tabs: { query: async () => [{ id: 7 }] },
    runtime: { getManifest: () => ({ version: '0.3.0' }), sendMessage: async (m) => { asked.push(m);
      if (m.type === 'hu.revoke.get') return { grants: [{ id: 'aa11', result, origin: 'https://app.exemple.org', at: 1, wallet: null }, { id: 'bb22', result: signed, origin: 'https://app.exemple.org', at: 2, wallet: null }] };
      if (m.type === 'hu.revoke.send') return answer;
      if (m.type === 'hu.revoke.check') return { state: 'zero' };
      return { state: 'unknown' }; } } };
  const sb = { Date, URL, console }; sb.window = sb; vm.createContext(sb); vm.runInContext(SRC, sb);
  const root = mk('main'), later = [];
  const panel = sb.HoldupPanel.mount({ createElement: mk }, root, { chrome, now: () => 1000, setTimeout: (f) => { later.push(f); } });
  await panel.render();
  const texts = () => all(root).map((e) => e.textContent).filter(Boolean);
  assert.ok(texts().includes('Droits accordés'));
  assert.ok(texts().includes('Cette demande donne à 0xd4d4…d4d4 le droit de dépenser tes USDC.'));
  const buttons = () => all(root).filter((e) => e.tag === 'button' && e.textContent === 'Révoquer');
  assert.equal(buttons().length, 1, 'one button : the off-chain signature is explained, never offered as one click');
  assert.ok(texts().includes('Tu signes un permit sans effet.'));
  assert.ok(texts().some((t) => /Ton portefeuille va afficher le nom du site/.test(t)), 'said BEFORE the click');
  await buttons()[0].listeners.click[0]();
  const sent = asked.filter((m) => m.type === 'hu.revoke.send');
  assert.equal(JSON.stringify(sent), JSON.stringify([{ type: 'hu.revoke.send', tabId: 7, id: 'aa11', index: 0 }]), 'a tab and an id, never a request');
  assert.ok(texts().includes('Tu as rejeté la demande. Le droit est toujours actif.')); assert.equal(buttons().length, 1, 'the button stays');
  answer = { state: 'submitted' }; await buttons()[0].listeners.click[0]();
  assert.ok(texts().includes('Retrait envoyé à ton portefeuille.'));
  assert.equal(later.length, 1); await later[0]();
  assert.ok(texts().includes('Retrait envoyé à ton portefeuille. Le droit est à zéro.'));
  answer = { state: 'error', code: 'no_provider' }; await buttons()[0].listeners.click[0]();
  assert.ok(texts().includes('Ouvre à nouveau le site ou ton portefeuille, puis reviens ici.'));
  const words = SRC.slice(SRC.indexOf('const REVOKE = {'), SRC.indexOf('// The site, never cut'));
  assert.ok(!/\bOK\b|bloqu|sûr\b|protég|garanti|rembours/i.test(words), 'no promise'); assert.match(words, /Hold up ne signe jamais/);
});

test('build : the settings page, the revocation module and the engine are the ones of the sources', () => {
  const build = join(DIR, '..', 'extension_standalone', 'build_standalone.mjs');
  if (!existsSync(build)) return; // run on a built copy : the sources are not next to it
  const b = readFileSync(build, 'utf8');
  assert.ok(b.includes("'revoke.js'") && b.includes("'options.html', 'options.js'") && !b.includes("'src', 'options.html'"));
  assert.ok(!b.includes('(autonome)') && !b.includes('(sans reseau)'), 'one name for every variant');
  const mf = JSON.parse(readFileSync(join(DIR, '..', 'extension_standalone', 'src', 'manifest.json'), 'utf8'));
  assert.equal(mf.name, 'Hold up'); assert.ok(!/embarque|acces|Reseau/.test(mf.description));
  const core = readFileSync(join(DIR, '..', 'extension_standalone', 'src', 'sentinelle_core.js'), 'utf8');
  assert.ok(!/^\s*const niveau = /m.test(core), 'niveau is reassigned in evaluate() : it must not be const');
});

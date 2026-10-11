// Branchement de revoke.js : gatekeeper.js (droit gardé en session, messages hu.revoke.*, marque de retrait) et inject.js
// (la demande de retrait part par la méthode d'origine du portefeuille, sans nouvelle retenue, et la marque ne s'usurpe pas).
// Run : node --test extension/tests/unit/revoke_branchement.test.mjs
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeChrome, fakeClock, load, DIR, EXT_URL, EXT_ID } from './fake_chrome.mjs';
import { page, sleep, cleanAll, WALLET, TOKEN as BRIDGE_TOKEN } from './securite_page.mjs';

after(cleanAll);
const { selectorOf } = await import(pathToFileURL(join(DIR, '..', 'engine', 'src', 'keccak.mjs')).href);
const R = await load('revoke.js');

const ME = '0x' + 'a1'.repeat(20), SPENDER = '0x' + 'd4'.repeat(20), USDC = '0x' + 'c3'.repeat(20), TOKEN2 = '0x' + 'e5'.repeat(20);
const MAXU = (1n << 256n) - 1n;
const approveData = (spender, amount) => R.encodeApprove(spender, amount);
const panelSender = { id: EXT_ID, origin: EXT_URL.slice(0, -1), url: EXT_URL + 'ui/sidepanel.html' };
const SITE = 'https://dex.example';
const held = (x) => !!x && !(x.done === true && x.allow === true); // held and asked (or refused), never passed

// One gatekeeper, one confirmed request (askIntent "never" : straight to the verdict, attention = read and continue).
async function confirmed({ method = 'eth_sendTransaction', params, tabId = 7, frameId = 0, rid = 'rid-revoke-0001', level = 'attention', context = true } = {}) {
  const clock = fakeClock(); const F = makeChrome(); globalThis.chrome = F.chrome;
  F.badges = []; F.chrome.action = { setBadgeText: async (o) => { F.badges.push(o); } };
  await F.chrome.storage.local.set({ cfg: { askIntent: 'never' }, ...(context ? { contexte: { contacts: [], history: [], protected: [], knownSpenders: [], tokens: [{ address: USDC, symbol: 'USDC', decimals: 6 }] } } : {}) });
  F.answers = []; // what the "bridge" answers to hu.revoke.run, in order
  F.chrome.tabs.sendMessage = async (tab, msg, opts) => { F.state.tabMessages.push({ tabId: tab, msg, frameId: opts && opts.frameId }); if (msg.type === 'hu.revoke.run') { const a = F.answers.shift(); return typeof a === 'function' ? a(msg) : a; } };
  const { createGatekeeper } = await load('gatekeeper.js');
  createGatekeeper({ check: async () => ({ level, reasons: [], effects: { grants_right: true, funds_out: false }, risk_signals: [] }) });
  const pg = F.page(tabId, SITE, frameId);
  const p = params || [{ from: ME, to: USDC, data: approveData(SPENDER, MAXU), value: '0x0' }];
  const r = await F.send({ type: 'gate', rid, payload: { kind: 'gate', method, params: p, chainId: '0x1', from: ME } }, pg);
  assert.equal(r.pending, true);
  let wid = null; for (const [id, o] of F.state.windows) if (o.url.endsWith('#' + rid)) wid = id;
  const rec = F.state.session['hu:req:' + rid];
  clock.advance(1000);
  const d = await F.send({ type: 'hu.decision', rid, seq: rec.seq, decision: 'continue' }, F.win(wid, rid));
  assert.equal(d.status, 'allow');
  await F.tick();
  return { F, clock, pg, tabId, done: () => { clock.restore(); delete globalThis.chrome; } };
}

test('selectors of the reads after the wallet answered match keccak-256', async () => {
  const G = await load('gatekeeper.js');
  assert.equal(G.READ_SEL.allowance, selectorOf('allowance(address,address)'));
  assert.equal(G.READ_SEL.isApprovedForAll, selectorOf('isApprovedForAll(address,address)'));
  assert.equal(G.READ_SEL.getApproved, selectorOf('getApproved(uint256)'));
  assert.equal(G.READ_SEL.permit2Allowance, selectorOf('allowance(address,address,address)'));
  assert.equal(G.readState('0x' + '0'.repeat(64)), 'zero');
  assert.equal(G.readState('0x' + '0'.repeat(63) + '1'), 'still_active');
  assert.equal(G.readState('0x'), 'unknown'); assert.equal(G.readState(null), 'unknown');
});

test('after "continue" on an unlimited approve : the right is kept in storage.session (never local), badge set, no address in the journal', async () => {
  const t = await confirmed();
  const list = t.F.state.session['hu:grant:7'];
  assert.ok(Array.isArray(list) && list.length === 1);
  assert.equal(list[0].result.status, 'revocable'); assert.equal(list[0].result.oneClick, true); assert.equal(list[0].origin, SITE);
  assert.equal(R.buttonLabel(list[0].result), 'Révoquer ce droit');
  assert.ok(list[0].result.says.includes('tes USDC'), 'the token known by its address gives its name');
  const local = JSON.stringify(t.F.state.local);
  assert.ok(!local.includes('hu:grant'));
  assert.ok(!local.toLowerCase().includes(SPENDER.slice(2)) && !local.toLowerCase().includes(ME.slice(2)), 'no address in local storage');
  assert.deepEqual(t.F.badges, [{ text: '1', tabId: 7 }]);
  await t.F.closeTab(7); await t.F.tick();
  assert.equal(t.F.state.session['hu:grant:7'], undefined, 'erased when the tab closes');
  t.done();
});

test('hu.revoke.get : side panel only ; a message that carries a request is refused', async () => {
  const t = await confirmed();
  const g = await t.F.send({ type: 'hu.revoke.get', tabId: 7 }, panelSender);
  assert.equal(g.result.kind, 'erc20_approve'); assert.equal(g.origin, SITE); assert.equal(g.grants.length, 1);
  assert.deepEqual(await t.F.send({ type: 'hu.revoke.get', tabId: 99 }, panelSender), { none: true });
  assert.equal((await t.F.send({ type: 'hu.revoke.get', tabId: 7 }, t.pg)).refused, true, 'a page cannot read the right');
  assert.equal((await t.F.send({ type: 'hu.revoke.get', tabId: 7 }, t.F.win(100, 'x'))).refused, true, 'the hold window is not the panel');
  for (const extra of [{ params: [] }, { to: USDC }, { data: '0x' }, { from: ME }, { request: {} }, { method: 'eth_sendTransaction' }]) {
    const r = await t.F.send({ type: 'hu.revoke.send', tabId: 7, index: 0, ...extra }, panelSender);
    assert.equal(r.refused, true, JSON.stringify(extra));
  }
  assert.equal(t.F.state.tabMessages.filter((m) => m.msg.type === 'hu.revoke.run').length, 0, 'nothing sent to the page');
  t.done();
});

test('hu.revoke.send : the request read from storage.session goes to the page, Hold up never signs ; journal line without address ; check reads zero', async () => {
  const t = await confirmed();
  t.F.answers.push({ state: 'submitted' });
  const s = await t.F.send({ type: 'hu.revoke.send', tabId: 7, index: 0 }, panelSender);
  assert.deepEqual(s, { state: 'submitted' });
  const run = t.F.state.tabMessages.find((m) => m.msg.type === 'hu.revoke.run').msg;
  assert.equal(run.op, 'send'); assert.equal(run.method, 'eth_sendTransaction'); assert.equal(run.origin, SITE);
  assert.match(run.tok, /^[0-9a-f]{32}$/);
  assert.equal(run.params[0].data, approveData(SPENDER, 0n)); assert.equal(run.params[0].to, USDC); assert.equal(run.params[0].from, ME);
  assert.ok(!('signature' in run) && !JSON.stringify(run).includes('eth_sign'), 'nothing signed by Hold up');
  assert.equal(Object.keys(t.F.state.session).filter((k) => k.startsWith('hu:revtok:')).length, 0, 'the token is gone after the answer');
  const line = t.F.state.local.log.find((e) => e.type === 'revocation');
  assert.equal(line.wallet, 'submitted'); assert.match(line.request_sha256, /^[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(line).toLowerCase().includes(SPENDER.slice(2)));
  assert.ok(t.F.state.local.chain.entries.some((e) => e.type === 'revocation' && e.d === 'submitted' && e.m === 'erc20_approve'));
  t.F.answers.push((m) => { assert.equal(m.op, 'read'); assert.equal(m.method, 'eth_call'); assert.equal(m.params[0].data.slice(0, 10), '0xdd62ed3e'); return { state: 'read', result: '0x' + '0'.repeat(64) }; });
  assert.deepEqual(await t.F.send({ type: 'hu.revoke.check', tabId: 7 }, panelSender), { state: 'zero' });
  t.F.answers.push({ state: 'error', code: 'no_provider' });
  assert.deepEqual(await t.F.send({ type: 'hu.revoke.check', tabId: 7 }, panelSender), { state: 'unknown' }, 'no answer from the network : unknown, never zero');
  t.done();
});

test('rejected in the wallet (4001) : state "rejected", the right stays available and can be sent again', async () => {
  const t = await confirmed();
  t.F.answers.push({ state: 'rejected', code: 4001 });
  assert.deepEqual(await t.F.send({ type: 'hu.revoke.send', tabId: 7 }, panelSender), { state: 'rejected', code: 4001 });
  const g = await t.F.send({ type: 'hu.revoke.get', tabId: 7 }, panelSender);
  assert.equal(g.wallet, 'rejected'); assert.equal(R.buttonLabel(g.result), 'Révoquer ce droit');
  t.F.answers.push({ state: 'submitted' });
  assert.equal((await t.F.send({ type: 'hu.revoke.send', tabId: 7 }, panelSender)).state, 'submitted');
  t.F.answers.push(undefined); // nobody answers (page closed)
  assert.deepEqual(await t.F.send({ type: 'hu.revoke.send', tabId: 7 }, panelSender), { state: 'error', code: 'no_answer' });
  t.done();
});

test('off-chain Permit : kept with its explanation, never sent from the panel, never a "Révoquer ce droit" button', async () => {
  const td = { types: { Permit: [] }, primaryType: 'Permit', domain: { name: 'USD Coin', version: '1', chainId: 1, verifyingContract: USDC }, message: { owner: ME, spender: SPENDER, value: MAXU.toString(), nonce: '7', deadline: MAXU.toString() } };
  const t = await confirmed({ method: 'eth_signTypedData_v4', params: [ME, JSON.stringify(td)] });
  const g = await t.F.send({ type: 'hu.revoke.get', tabId: 7 }, panelSender);
  assert.equal(g.result.status, 'two_steps'); assert.notEqual(R.buttonLabel(g.result), 'Révoquer ce droit');
  assert.deepEqual(await t.F.send({ type: 'hu.revoke.send', tabId: 7 }, panelSender), { state: 'error', code: 'not_one_click' });
  assert.equal(t.F.state.tabMessages.filter((m) => m.msg.type === 'hu.revoke.run').length, 0);
  t.done();
});

test('a request that grants nothing keeps nothing (a payment)', async () => {
  const t = await confirmed({ params: [{ from: ME, to: '0x' + 'b2'.repeat(20), value: '0x1' }] });
  assert.equal(t.F.state.session['hu:grant:7'], undefined);
  assert.deepEqual(t.F.badges, []);
  t.done();
});

test('the mark : the valid token for the same content passes once without a question ; forged, reused, other tab, other frame, other content or late : held and asked', async () => {
  const t = await confirmed();
  let revokeMsg = null;
  // while the wallet holds the revocation, the wallet re-enters a wrapped method : the gate message comes with the token
  const gateWith = (tok, over = {}) => t.F.send({ type: 'gate', rid: over.rid, payload: { kind: 'gate', method: 'eth_sendTransaction', params: over.params || revokeMsg.params, chainId: '0x1', from: ME, revokeToken: tok } }, over.sender || t.pg);
  const results = {};
  t.F.answers.push(async (m) => {
    revokeMsg = m;
    results.forged = await gateWith('f'.repeat(32), { rid: 'rid-forged-0001' });
    results.otherContent = await gateWith(m.tok, { rid: 'rid-other-00001', params: [{ ...m.params[0], data: approveData(SPENDER, MAXU) }] });
    return { state: 'submitted' };
  });
  await t.F.send({ type: 'hu.revoke.send', tabId: 7 }, panelSender);
  assert.ok(held(results.forged), 'a forged token : held like any other request');
  assert.ok(held(results.otherContent), 'the token does not cover another content');
  // a fresh send, then the correct re-entry, then a reuse
  t.F.answers.push(async (m) => {
    revokeMsg = m;
    results.good = await gateWith(m.tok, { rid: 'rid-good-000001' });
    results.reused = await gateWith(m.tok, { rid: 'rid-reuse-00001' });
    return { state: 'submitted' };
  });
  await t.F.send({ type: 'hu.revoke.send', tabId: 7 }, panelSender);
  assert.deepEqual(results.good, { done: true, allow: true });
  assert.ok(held(results.reused), 'single use');
  t.F.answers.push(async (m) => { revokeMsg = m; results.otherTab = await gateWith(m.tok, { rid: 'rid-tab-0000001', sender: t.F.page(8, SITE) }); return { state: 'submitted' }; });
  await t.F.send({ type: 'hu.revoke.send', tabId: 7 }, panelSender);
  assert.ok(held(results.otherTab), 'bound to the tab');
  t.F.answers.push(async (m) => { revokeMsg = m; results.otherFrame = await gateWith(m.tok, { rid: 'rid-frame-00001', sender: t.F.page(7, SITE, 3) }); return { state: 'submitted' }; });
  await t.F.send({ type: 'hu.revoke.send', tabId: 7 }, panelSender);
  assert.ok(held(results.otherFrame), 'bound to the frame');
  t.F.answers.push(async (m) => { revokeMsg = m; t.clock.advance(9000); results.late = await gateWith(m.tok, { rid: 'rid-late-000001' }); return { state: 'submitted' }; });
  await t.F.send({ type: 'hu.revoke.send', tabId: 7 }, panelSender);
  assert.ok(held(results.late), 'a few seconds only');
  // after the answer the token no longer exists
  assert.ok(held((await gateWith(revokeMsg.tok, { rid: 'rid-after-00001' }))));
  assert.ok(t.F.state.local.log.some((e) => e.note && e.note.startsWith('marque de retrait refusee')));
  t.done();
});

// ---------------------------------------------------------------- inject.js
// The fake bridge of securite_page.mjs, plus the "revoke" messages a real bridge.js relays from the service worker.
function bridgeRevoke(P, msg, k = BRIDGE_TOKEN) {
  return new Promise((resolve) => {
    const port = P.ctx._port, prev = port.onmessage;
    const timer = setTimeout(() => { port.onmessage = prev; resolve(null); }, 400);
    port.onmessage = (ev) => { if (ev.data && ev.data.t === 'revokeResult') { clearTimeout(timer); port.onmessage = prev; resolve(ev.data); } else prev(ev); };
    port.postMessage({ t: 'revoke', k, n: 1, ...msg });
  });
}
const TXP_GRANT = `[{ from: '${ME}', to: '${USDC}', data: '${approveData(SPENDER, MAXU)}', value: '0x0' }]`;
const REVOKE_PARAMS = [{ from: ME, to: USDC, value: '0x0', data: approveData(SPENDER, 0n), chainId: '0x1' }];
const TOK = '0123456789abcdef0123456789abcdef';
const revokeCalls = (P) => P.run(`ethereum.calls.filter((c) => c.method === 'eth_sendTransaction' && c.params[0].data.slice(-64) === '${'0'.repeat(64)}').length`);

test('inject : without an allowed request on this frame, no provider is used', async () => {
  const P = page({ decide: () => true });
  P.run(WALLET + '; window.ethereum = new Wallet();');
  await sleep(50);
  const r = await bridgeRevoke(P, { op: 'send', tok: TOK, method: 'eth_sendTransaction', params: REVOKE_PARAMS });
  assert.deepEqual([r.state, r.code], ['error', 'no_provider']);
});

test('inject : the revocation reaches the wallet once through the original request method, no new hold (no loop)', async () => {
  const P = page({ decide: () => true });
  P.run(WALLET + '; window.ethereum = new Wallet();');
  P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP_GRANT} }).catch(() => {})`);
  await sleep(120);
  assert.equal(P.gates.length, 1);
  const r = await bridgeRevoke(P, { op: 'send', tok: TOK, method: 'eth_sendTransaction', params: REVOKE_PARAMS });
  assert.equal(r.state, 'submitted');
  assert.equal(P.gates.length, 1, 'not held again');
  assert.equal(revokeCalls(P), 1);
  // only eth_sendTransaction for "send", only eth_call for "read"
  for (const bad of [{ op: 'send', method: 'personal_sign' }, { op: 'send', method: 'eth_signTypedData_v4' }, { op: 'read', method: 'eth_sendTransaction' }, { op: 'other', method: 'eth_call' }]) {
    const x = await bridgeRevoke(P, { ...bad, tok: TOK, params: REVOKE_PARAMS });
    assert.deepEqual([x.state, x.code], ['error', 'refused'], JSON.stringify(bad));
  }
  const rd = await bridgeRevoke(P, { op: 'read', method: 'eth_call', params: [{ to: USDC, data: '0xdd62ed3e' }, 'latest'] });
  assert.equal(rd.state, 'read');
});

test('inject : a revoke message without the bridge token, or posted by the page, reaches nothing', async () => {
  const P = page({ decide: () => true });
  P.run(WALLET + '; window.ethereum = new Wallet();');
  P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP_GRANT} }).catch(() => {})`);
  await sleep(120);
  assert.equal(await bridgeRevoke(P, { op: 'send', tok: TOK, method: 'eth_sendTransaction', params: REVOKE_PARAMS }, 'f'.repeat(32)), null);
  P.run(`window.postMessage({ t: 'revoke', n: 1, op: 'send', method: 'eth_sendTransaction', params: [] }, '*')`);
  await sleep(50);
  assert.equal(revokeCalls(P), 0);
});

test('inject : rejected in the wallet (4001) gives "rejected"', async () => {
  const P = page({ decide: () => true });
  P.run(WALLET + `; class W2 extends Wallet { async request(a) { if (a.method === 'eth_sendTransaction' && a.params[0].data.slice(-64) === '${'0'.repeat(64)}') { const e = new Error('User rejected'); e.code = 4001; throw e; } return super.request(a); } }; window.ethereum = new W2();`);
  P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP_GRANT} }).catch(() => {})`);
  await sleep(120);
  const r = await bridgeRevoke(P, { op: 'send', tok: TOK, method: 'eth_sendTransaction', params: REVOKE_PARAMS });
  assert.deepEqual([r.state, r.code], ['rejected', 4001]);
});

test('inject : a wallet that re-enters later with a copy is gated once with the token ; the page can neither add nor reuse the mark', async () => {
  const P = page({ decide: () => true });
  // the wallet re-enters its own (wrapped) request method a moment later, with a copy of the same request
  P.run(WALLET + `; class W3 extends Wallet { async request(a) { if (a.method === 'eth_sendTransaction' && a.params[0].data.slice(-64) === '${'0'.repeat(64)}' && !a.inner) { const c = JSON.parse(JSON.stringify({ method: a.method, params: a.params })); setTimeout(() => { this.request(c).catch(() => {}); }, 10); return 'queued'; } return super.request(a); } }; window.ethereum = new W3();`);
  P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP_GRANT} }).catch(() => {})`);
  await sleep(120);
  const r = await bridgeRevoke(P, { op: 'send', tok: TOK, method: 'eth_sendTransaction', params: REVOKE_PARAMS });
  assert.equal(r.state, 'submitted');
  await sleep(120);
  assert.equal(P.gates.length, 2, 'the late re-entry is gated (fail closed)');
  assert.equal(P.gates[1].revokeToken, TOK, 'it carries the token of the service worker');
  // the page sends the very same revocation again : the mark was used once, it is not given again
  P.run(`ethereum.request(${JSON.stringify({ method: 'eth_sendTransaction', params: REVOKE_PARAMS })}).catch(() => {})`);
  await sleep(120);
  assert.equal(P.gates.length, 3); assert.equal(P.gates[2].revokeToken, undefined);
  // the page writes a mark of its own : never forwarded to the bridge
  P.run(`ethereum.request({ method: 'eth_sendTransaction', params: ${TXP_GRANT}, revokeToken: '${TOK}' }).catch(() => {})`);
  P.run(`ethereum.request({ method: 'eth_sendTransaction', params: [Object.assign(${TXP_GRANT}[0], { revokeToken: '${TOK}' })] }).catch(() => {})`);
  await sleep(120);
  assert.equal(P.gates.length, 5);
  assert.equal(P.gates[3].revokeToken, undefined); assert.equal(P.gates[4].revokeToken, undefined);
});

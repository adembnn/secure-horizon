// Service worker side (gatekeeper.js) with a fake chrome : verdict window before any forwarding, hardened senders,
// hold that survives the worker, fail closed. Run : node --test extension/tests/unit/
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeChrome, fakeClock, load, EXT_URL } from './fake_chrome.mjs';

const { createGatekeeper } = await load('gatekeeper.js');
const EVIL = 'https://evil.example';
const TX = { method: 'eth_sendTransaction', params: [{ from: '0x' + 'a1'.repeat(20), to: '0x' + 'b2'.repeat(20), value: '0x1' }], chainId: '0x7a69', from: '0x' + 'a1'.repeat(20) };
const verdict = (level, extra = {}) => Object.assign({ level, niveau: level === 'danger' ? 'critical' : 'warn', texts: { croit: 'a', reel: 'b', danger: 'c', action: 'd' }, reasons: ['c', 'd'],
  effects: { grants_right: false, funds_out: false }, risk_signals: [] }, extra);

let F, clock, seen, n = 0;
beforeEach(() => { clock = fakeClock(); F = makeChrome(); globalThis.chrome = F.chrome; seen = []; });
afterEach(() => { clock.restore(); delete globalThis.chrome; });

// A worker life. `engine` : level, verdict object or function(body).
function worker(engine = 'attention', opts = {}) {
  const check = async (body) => { seen.push(body); const v = typeof engine === 'function' ? engine(body) : engine; return typeof v === 'string' ? verdict(v) : v; };
  return createGatekeeper(Object.assign({ check }, opts));
}
const newRid = () => 'rid-test-' + String(++n).padStart(4, '0');
async function gate(tabId = 7, origin = EVIL, extra = {}, payload = TX) {
  const rid = newRid();
  const r = await F.send(Object.assign({ type: 'gate', rid, payload: Object.assign({ kind: 'gate' }, payload) }, extra), F.page(tabId, origin));
  return { rid, r, page: F.page(tabId, origin) };
}
const poll = (g) => F.send({ type: 'hu.poll', rid: g.rid }, g.page);
const winOf = (rid) => { for (const [id, o] of F.state.windows) if (o.url === EXT_URL + 'window.html#' + rid) return id; return null; };
const view = async (g) => (await F.send({ type: 'hu.view', rid: g.rid }, F.win(winOf(g.rid), g.rid))).view;
const decide = (g, msg, sender) => F.send(Object.assign({ type: 'hu.decision', rid: g.rid }, msg), sender || F.win(winOf(g.rid), g.rid));

test('the verdict window is created before anything is forwarded, as a focused popup of the extension', async () => {
  worker('attention');
  const g = await gate();
  assert.deepEqual(g.r, { pending: true }, 'the gate answer never carries an allow');
  const id = winOf(g.rid);
  assert.ok(id, 'window created');
  const w = F.state.windows.get(id);
  assert.equal(w.type, 'popup'); assert.equal(w.focused, true); assert.ok(w.url.startsWith(EXT_URL + 'window.html#'));
  assert.equal((await poll(g)).state, 'pending');
  assert.ok(F.state.tabMessages.some((m) => m.tabId === 7 && m.msg.type === 'hu.banner'), 'the page is only told to show the neutral banner');
  assert.ok(!F.state.tabMessages.some((m) => m.msg.verdict || m.msg.view || m.msg.spec), 'no verdict content is sent to the page');
  const v = await view(g);
  assert.equal(v.message.type, 'holdup.verdict'); assert.equal(v.message.mode, 'verdict'); assert.deepEqual(v.message.friction, { type: 'none' });
});

test('(e) the origin is the one the browser reports, never the one in the message', async () => {
  worker('attention');
  const g = await gate(7, EVIL, { origin: 'https://app.uniswap.org', url: 'https://app.uniswap.org/swap', topOrigin: 'https://app.uniswap.org' });
  assert.equal(seen[0].origin, EVIL, 'engine judged the real origin');
  assert.equal(seen[0].url, EVIL + '/');
  const v = await view(g);
  assert.equal(v.site, 'evil.example'); assert.equal(v.message.site, 'evil.example');
  const { log } = await F.chrome.storage.local.get('log');
  assert.ok(log.every((e) => !e.origin || e.origin === EVIL), 'journal keeps the real origin');
  // opaque origin (sandboxed frame) : the frame URL, still from the browser
  const rid = newRid();
  await F.send({ type: 'gate', rid, origin: 'https://bank.example', payload: Object.assign({ kind: 'gate' }, TX) }, { id: F.chrome.runtime.id, origin: 'null', url: 'https://evil.example/frame.html?x=1#h', frameId: 2, tab: { id: 8, windowId: 1 } });
  assert.equal(seen[1].origin, 'https://evil.example/frame.html');
});

test('(g) an engine that answers "ok" never opens the door : attention screen, human decision required', async () => {
  await F.chrome.storage.local.set({ cfg: { testMode: true, auto: true, arm: 'A' } }); // former settings : ignored
  worker(() => ({ level: 'ok' }));
  const g = await gate();
  assert.deepEqual(g.r, { pending: true });
  assert.ok(winOf(g.rid));
  assert.equal((await view(g)).verdict.level, 'attention');
  clock.advance(60000);
  assert.equal((await poll(g)).state, 'pending', 'time alone never allows');
  assert.equal((await decide(g, { seq: 1, decision: 'continue' })).status, 'allow');
  assert.equal((await poll(g)).state, 'allow');
});

test('(g) an engine that throws, hangs up or answers nonsense gives the "Non vérifié" screen with the Danger friction', async () => {
  for (const bad of [() => { throw new Error('boom'); }, () => null, () => ({ level: 'green' }), () => 'yes']) {
    worker(bad);
    const g = await gate(20 + n);
    const v = await view(g);
    assert.equal(v.verdict.level, 'unknown');
    assert.equal(v.message.friction.type, 'phrase', 'grey screen carries friction');
    assert.equal(v.message.friction.phrase, 'Je continue sans vérification');
    clock.advance(1000);
    assert.equal((await decide(g, { seq: 1, decision: 'continue', phraseOk: false })).status, 'again');
    assert.equal((await poll(g)).state, 'pending');
    F.killWorker();
  }
});

test('(h) only the Hold up window of the request may decide ; a page, another window or the test path cannot', async () => {
  const gk = worker('attention');
  const a = await gate(7), b = await gate(8);
  clock.advance(1000);
  assert.equal((await decide(a, { seq: 1, decision: 'continue' }, a.page)).status, 'ignored', 'content script of the page');
  assert.equal((await decide(a, { seq: 1, decision: 'continue' }, F.win(winOf(b.rid), a.rid))).status, 'ignored', 'window of another request');
  assert.equal((await decide(a, { seq: 1, decision: 'continue' }, { id: 'another-extension', url: EXT_URL + 'window.html#' + a.rid, tab: { id: 1, windowId: winOf(a.rid) } })), undefined, 'another extension');
  assert.equal((await decide(a, { seq: 1, decision: 'continue' }, { id: F.chrome.runtime.id, url: EXT_URL + 'options.html', tab: { id: 1, windowId: winOf(a.rid) } })).status, 'ignored', 'another page of the extension');
  assert.equal((await F.send({ type: 'hu.view', rid: a.rid }, a.page)).status, 'gone', 'the page cannot read the verdict of a window request');
  assert.equal((await gk.decide(a.rid, { seq: 1, decision: 'continue' }, 'auto-test')).status, 'ignored', 'no test hook : the automatic answer is refused');
  assert.equal((await poll(a)).state, 'pending');
  assert.equal((await poll(b)).state, 'pending');
  // a gate message that does not come from a tab frame is refused
  const r = await F.send({ type: 'gate', rid: newRid(), payload: Object.assign({ kind: 'gate' }, TX) }, { id: F.chrome.runtime.id, url: EXT_URL + 'options.html' });
  assert.equal(r.allow, false);
});

test('one decision per request : the second one is ignored, and cancel wins until the page has consumed the answer', async () => {
  worker('attention');
  const g = await gate(); clock.advance(1000);
  const [x, y] = await Promise.all([decide(g, { seq: 1, decision: 'continue' }), decide(g, { seq: 1, decision: 'continue' })]);
  assert.deepEqual([x.status, y.status].sort(), ['allow', 'ignored']);
  assert.equal((await decide(g, { seq: 1, decision: 'cancel' }, F.win(winOf(g.rid) || 0, g.rid))).status, 'ignored', 'its window is gone with the decision');
  assert.equal((await poll(g)).state, 'allow');
  assert.equal((await F.send({ type: 'hu.ack', rid: g.rid }, g.page)).ok, true);
  assert.equal((await poll(g)).state, 'unknown', 'consumed : cannot be replayed');
});

test('closing the window, closing the tab or leaving the page cancels', async () => {
  worker('danger');
  const a = await gate(7), b = await gate(8), c = await gate(9);
  await F.userClosesWindow(winOf(a.rid));
  assert.equal((await poll(a)).state, 'deny');
  await F.closeTab(8);
  assert.equal((await poll(b)).state, 'deny');
  await F.send({ type: 'hu.abandon', rid: c.rid }, c.page);
  assert.equal((await poll(c)).state, 'deny');
  assert.equal(F.state.windows.size, 0, 'no window left behind');
  const { log } = await F.chrome.storage.local.get('log');
  assert.deepEqual(log.filter((e) => e.type === 'decision').map((e) => e.by).sort(), ['page-left', 'tab-closed', 'window-closed']);
});

test('the window closed while the worker was stopped is a cancel at the next poll', async () => {
  worker('danger');
  const g = await gate();
  F.killWorker(); F.state.windows.clear();           // nobody heard onRemoved
  worker('danger');
  assert.equal((await poll(g)).state, 'deny');
});

test('fallback : if the window cannot be created the in-page overlay is used and the journal says so', async () => {
  F.state.failWindow = true;
  worker('danger');
  const g = await gate();
  assert.deepEqual(g.r, { pending: true });
  const p = await poll(g);
  assert.equal(p.state, 'pending'); assert.equal(p.ui, 'overlay'); assert.equal(p.view.verdict.level, 'danger');
  const { log } = await F.chrome.storage.local.get('log');
  assert.ok(log.some((e) => e.type === 'ui_fallback'), 'journalled');
  clock.advance(1000);
  assert.equal((await decide(g, { seq: 1, decision: 'continue', phraseOk: true }, F.page(8, EVIL))).status, 'ignored', 'another tab cannot answer');
  assert.equal((await decide(g, { seq: 1, decision: 'continue', phraseOk: true }, g.page)).status, 'again', 'friction applies to the overlay too');
  assert.equal((await decide(g, { seq: 1, decision: 'cancel' }, g.page)).status, 'deny');
  assert.equal((await poll(g)).state, 'deny');
});

test('friction : Danger = phrase then 30 s ; Manipulation = 10 min ; Annuler never delayed', async () => {
  worker((b) => verdict(b.origin === EVIL ? 'danger' : 'manipulation'));
  const d = await gate(7, EVIL), m = await gate(8, 'https://support.example');
  let v = await view(d);
  assert.deepEqual(v.message.friction, { type: 'phrase', phrase: 'Je veux continuer malgré le danger' });
  clock.advance(2000);
  let r = await decide(d, { seq: 1, decision: 'continue', phraseOk: true });
  assert.equal(r.status, 'again'); assert.deepEqual(r.view.message.friction, { type: 'wait', seconds: 28 });
  clock.advance(27000);
  assert.equal((await decide(d, { seq: 2, decision: 'continue' })).status, 'again');
  clock.advance(1000);
  assert.equal((await decide(d, { seq: 3, decision: 'continue' })).status, 'allow');

  v = await view(m);
  assert.equal(v.message.friction.type, 'wait'); assert.equal(v.message.friction.seconds, 570, '10 min minus the 30 s already spent');
  assert.equal((await decide(m, { seq: 1, decision: 'continue' })).status, 'again');
  assert.equal((await decide(m, { seq: 2, decision: 'cancel' })).status, 'deny', 'cancel in the middle of the hold');
  assert.equal((await poll(m)).state, 'deny');
});

test('the 10-minute hold completes across service worker restarts (storage + alarms, nothing in memory)', async () => {
  worker('manipulation');
  const g = await gate();
  const rec0 = F.state.session['hu:req:' + g.rid];
  assert.equal(F.state.alarms.get('hu:hold:' + g.rid).when, rec0.friction.deadline, 'absolute deadline given to chrome.alarms');
  for (let i = 0; i < 4; i++) {                       // the worker dies every 2.5 min
    clock.advance(150000 - 1);
    F.killWorker(); worker('manipulation');
    assert.equal((await poll(g)).state, 'pending', 'page re-attaches by request id');
    const v = await view(g);
    assert.equal(v.message.friction.type, 'wait', 'window re-attaches too');
    assert.equal((await decide(g, { seq: v.seq, decision: 'continue' })).status, 'again');
  }
  clock.advance(4);
  await F.fireAlarm('hu:hold:' + g.rid);
  assert.ok(F.state.runtimeMessages.some((m) => m.type === 'hu.refresh' && m.rid === g.rid), 'the alarm tells the window to refresh');
  assert.equal((await poll(g)).state, 'pending', 'the deadline alone never allows');
  const v = await view(g);
  assert.deepEqual(v.message.friction, { type: 'none' });
  F.killWorker(); worker('manipulation');
  assert.equal((await decide(g, { seq: v.seq, decision: 'continue' })).status, 'allow');
  F.killWorker(); worker('manipulation');
  assert.equal((await poll(g)).state, 'allow', 'the allow is read back from the storage by a fresh worker');
});

test('demo durations come from the settings ; the window says so ; floors hold', async () => {
  await F.chrome.storage.local.set({ cfg: { dangerWaitMs: 10000, manipulationHoldMs: 1 } });
  worker((b) => verdict(b.origin === EVIL ? 'danger' : 'manipulation'));
  const d = await gate(7, EVIL), m = await gate(8, 'https://support.example');
  assert.equal(F.state.session['hu:req:' + d.rid].friction.waitMs, 10000);
  assert.equal(F.state.session['hu:req:' + m.rid].friction.waitMs, 30000);
  assert.match((await view(d)).note, /Réglage de démo : 10 s au lieu de 30 s/);
});

test('a worker that died between the record and its window : the next poll opens the screen', async () => {
  worker('attention');
  const rid = newRid(), page = F.page(7, EVIL);
  F.state.failWindow = true;                          // simulate : record written, worker killed before windows.create
  await F.send({ type: 'gate', rid, payload: Object.assign({ kind: 'gate' }, TX) }, page);
  const k = 'hu:req:' + rid; F.state.session[k].ui = null; F.state.session[k].windowId = null;
  F.killWorker(); F.state.failWindow = false; worker('attention');
  assert.deepEqual(await F.send({ type: 'gate', rid, payload: Object.assign({ kind: 'gate' }, TX) }, page), { pending: true }, 'same id sent again : idempotent');
  assert.equal(seen.length, 1, 'not judged twice');
  clock.advance(3000);
  assert.equal((await F.send({ type: 'hu.poll', rid }, page)).state, 'pending');
  assert.ok(winOf(rid), 'window opened by the poll');
});

test('intent question : asked only when the operation grants a right or moves funds (default), in the same window', async () => {
  worker((b) => verdict(b.intent === 'receive' ? 'danger' : 'attention', { effects: { grants_right: b.origin === EVIL, funds_out: false } }));
  const a = await gate(7, EVIL), b = await gate(8, 'https://calm.example');
  let va = await view(a);
  assert.equal(va.message.mode, 'intention'); assert.equal(va.stage, 'intent');
  assert.deepEqual(va.message.choices.map((c) => c.value), ['receive', 'pay', 'swap', 'login', 'demande']);
  assert.equal((await view(b)).message.mode, 'verdict', 'no question when nothing is granted or spent');
  clock.advance(1000);
  assert.equal((await decide(a, { seq: 1, decision: 'continue' })).status, 'ignored', 'no continue on the question screen');
  const r = await decide(a, { seq: 1, decision: 'answer', value: 'receive' });
  assert.equal(r.status, 'next'); assert.equal(seen[2].intent, 'receive', 'engine called again with the declared intent');
  assert.equal(r.view.verdict.level, 'danger', 'the answer made the verdict stricter');
  assert.equal(winOf(a.rid) !== null && F.state.windows.size, 2, 'same window, no extra one');
  // settings
  F.killWorker(); await F.chrome.storage.local.set({ cfg: { askIntent: 'never' } }); worker(() => verdict('attention', { effects: { grants_right: true, funds_out: true } }));
  assert.equal((await view(await gate(9, EVIL))).message.mode, 'verdict');
});

test('a declared intent can only make the verdict stricter', async () => {
  worker((b) => verdict(b.intent ? 'attention' : 'danger', { effects: { grants_right: true, funds_out: false } }));
  const g = await gate(); clock.advance(1000);
  const r = await decide(g, { seq: 1, decision: 'answer', value: 'pay' });
  assert.equal(r.view.verdict.level, 'danger');
});

test('two requests at once : two windows, each decides only its own request ; a fourth one on the same tab is refused', async () => {
  worker('attention');
  const a = await gate(7), b = await gate(7), c = await gate(7);
  assert.equal(new Set([winOf(a.rid), winOf(b.rid), winOf(c.rid)]).size, 3);
  const d = await gate(7);
  assert.equal(d.r.allow, false); assert.equal(winOf(d.rid), null);
  clock.advance(1000);
  assert.equal((await decide(a, { seq: 1, decision: 'cancel' })).status, 'deny');
  assert.equal((await poll(a)).state, 'deny'); assert.equal((await poll(b)).state, 'pending');
  assert.equal((await decide(b, { seq: 1, decision: 'continue' })).status, 'allow');
  assert.equal((await poll(c)).state, 'pending');
  assert.equal(winOf(a.rid), null); assert.equal(winOf(b.rid), null); assert.ok(winOf(c.rid));
});

test('expired or unknown requests are refused ; a notification is never a gate', async () => {
  worker('attention');
  const g = await gate();
  clock.advance(31 * 60000);
  assert.equal((await poll(g)).state, 'deny');
  assert.equal((await F.send({ type: 'hu.poll', rid: 'rid-never-seen-0001' }, g.page)).state, 'unknown');
  assert.equal((await F.send({ type: 'gate', rid: 'bad id', payload: Object.assign({ kind: 'gate' }, TX) }, g.page)).allow, false);
  for (let i = 0; i < 50; i++) await F.send({ type: 'gate', payload: { kind: 'journal', method: 'eth_requestAccounts' } }, g.page);
  const { log } = await F.chrome.storage.local.get('log');
  assert.equal(log.filter((e) => e.type === 'journal').length, 1, 'a flood of notifications cannot flush the journal');
});

test('without chrome.storage.session or chrome.alarms the gate still fails closed', async () => {
  clock.restore(); clock = fakeClock();
  F = makeChrome({ session: false, alarms: false }); globalThis.chrome = F.chrome;
  worker('attention');
  const g = await gate();
  assert.equal((await poll(g)).state, 'pending');
  F.killWorker(); worker('attention');               // memory lost with the worker
  assert.equal((await poll(g)).state, 'unknown', 'the page side reads unknown as a refusal');
});

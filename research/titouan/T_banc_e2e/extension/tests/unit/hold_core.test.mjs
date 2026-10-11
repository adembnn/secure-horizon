// Hold state machine (hold_core.js) : pure module, fake clock, fake storage. Run : node --test extension/tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './fake_chrome.mjs';

const { HoldStore, LIMITS, KEY, enterVerdict, frictionFor, validRid } = await load('hold_core.js');

const clone = (x) => JSON.parse(JSON.stringify(x));
function fakeStorage() {
  const data = {};
  return { data,
    get: async (k) => (k == null ? clone(data) : k in data ? { [k]: clone(data[k]) } : {}),
    set: async (o) => { for (const k of Object.keys(o)) data[k] = clone(o[k]); },
    remove: async (k) => { delete data[k]; } };
}
function setup({ allowAuto = false } = {}) {
  const storage = fakeStorage(); const clock = { t: 1000000 }; const alarms = new Map();
  const mk = () => new HoldStore({ storage, now: () => clock.t, allowAuto, alarms: { create: (n, w) => alarms.set(n, w), clear: (n) => alarms.delete(n) } });
  return { storage, clock, alarms, mk, store: mk() };
}
const RID = 'req-0000-0001';
const WHO = { tabId: 7, frameId: 0 };
const CFG = { dangerWaitMs: 30000, manipulationHoldMs: 600000 };
const initFor = (level, clock, cfg = CFG) => enterVerdict({}, { level }, cfg, clock.t);
async function open(s, level, rid = RID, cfg = CFG) {
  const r = await s.store.open({ rid, ...WHO, origin: 'https://site.example', site: 'site.example', method: 'eth_sendTransaction', init: initFor(level, s.clock, cfg) });
  assert.ok(r.rec, 'record created');
  return r.rec;
}

test('friction per level : attention none, danger and unknown phrase + 30 s, manipulation 10 min', () => {
  assert.deepEqual(frictionFor('attention', CFG), { phrase: false, waitMs: 0 });
  assert.deepEqual(frictionFor('danger', CFG), { phrase: true, waitMs: 30000 });
  assert.deepEqual(frictionFor('unknown', CFG), { phrase: true, waitMs: 30000 });
  assert.deepEqual(frictionFor('manipulation', CFG), { phrase: false, waitMs: 600000 });
  assert.deepEqual(frictionFor('manipulation', {}), { phrase: false, waitMs: 600000 }, 'defaults without settings');
});

test('demo durations change the numbers, not the mechanism, and have a floor', () => {
  assert.equal(frictionFor('danger', { dangerWaitMs: 10000 }).waitMs, 10000);
  assert.equal(frictionFor('manipulation', { manipulationHoldMs: 60000 }).waitMs, 60000);
  assert.equal(frictionFor('danger', { dangerWaitMs: 0 }).waitMs, 5000, 'never below 5 s');
  assert.equal(frictionFor('manipulation', { manipulationHoldMs: 1 }).waitMs, 30000, 'never below 30 s');
  assert.equal(frictionFor('danger', { dangerWaitMs: 'abc' }).waitMs, 30000);
  assert.equal(frictionFor('danger', { dangerWaitMs: 10000 }).phrase, true);
});

test('a pending request is not an allow ; the page gets "pending" until a human decides', async () => {
  const s = setup(); await open(s, 'attention');
  assert.equal((await s.store.poll(RID, WHO)).state, 'pending');
  s.clock.t += 2 * 60000;
  assert.equal((await s.store.poll(RID, WHO)).state, 'pending');
  // nobody acts : three minutes after its screen appeared the request is cancelled, never sent
  s.clock.t += 61000;
  assert.equal((await s.store.poll(RID, WHO)).state, 'deny');
});

test('attention : continue is accepted after the minimum display time, never before', async () => {
  const s = setup(); await open(s, 'attention');
  s.clock.t += 100;
  const early = await s.store.submit(RID, { seq: 1, decision: 'continue', by: 'human' });
  assert.equal(early.status, 'again'); assert.equal(early.why, 'trop-tot');
  assert.equal((await s.store.poll(RID, WHO)).state, 'pending');
  s.clock.t += LIMITS.minShowMs;
  assert.equal((await s.store.submit(RID, { seq: 1, decision: 'continue', by: 'human' })).status, 'allow');
  assert.equal((await s.store.poll(RID, WHO)).state, 'allow');
});

test('danger : phrase AND deadline, in any order ; the deadline is absolute', async () => {
  const s = setup(); await open(s, 'danger');
  s.clock.t += 1000;
  assert.equal((await s.store.submit(RID, { seq: 1, decision: 'continue', by: 'human' })).why, 'phrase');
  const typed = await s.store.submit(RID, { seq: 1, decision: 'continue', phraseOk: true, by: 'human' });
  assert.equal(typed.status, 'again'); assert.equal(typed.why, 'attente'); assert.equal(typed.leftMs, 29000);
  assert.equal(typed.rec.seq, 2, 'new screen (countdown)');
  s.clock.t += 28999;
  assert.equal((await s.store.submit(RID, { seq: 2, decision: 'continue', by: 'human' })).status, 'again');
  assert.equal((await s.store.poll(RID, WHO)).state, 'pending');
  s.clock.t += 1;
  assert.equal((await s.store.submit(RID, { seq: 3, decision: 'continue', by: 'human' })).status, 'allow');
});

test('the 10-minute hold survives a service worker restart and then completes', async () => {
  const s = setup(); const rec = await open(s, 'manipulation');
  assert.equal(s.alarms.get('hu:hold:' + RID), rec.friction.deadline, 'deadline handed to chrome.alarms');
  s.clock.t += 5 * 60000;
  assert.equal((await s.store.submit(RID, { seq: 1, decision: 'continue', by: 'human' })).why, 'attente');
  const born = s.mk();                                    // new worker life : nothing in memory, same storage
  assert.equal((await born.poll(RID, WHO)).state, 'pending', 'the page re-attaches by request id');
  const mid = await born.submit(RID, { seq: 2, decision: 'continue', by: 'human' });
  assert.equal(mid.status, 'again'); assert.equal(mid.leftMs, 5 * 60000, 'same absolute deadline after the restart');
  s.clock.t += 5 * 60000;
  const again = s.mk();                                   // and another one
  assert.equal((await again.submit(RID, { seq: 3, decision: 'continue', by: 'human' })).status, 'allow');
  assert.equal((await s.mk().poll(RID, WHO)).state, 'allow', 'the allow is read from the storage');
});

test('cancel always wins : at any time, before the deadline, and over an allow not consumed yet', async () => {
  const s = setup(); await open(s, 'manipulation');
  assert.equal((await s.store.submit(RID, { decision: 'cancel', by: 'human' })).status, 'deny', 'no delay, no seq needed');
  assert.equal((await s.store.poll(RID, WHO)).state, 'deny');
  assert.equal((await s.store.submit(RID, { seq: 1, decision: 'continue', by: 'human' })).status, 'ignored', 'nothing after a cancel');

  const s2 = setup(); await open(s2, 'attention'); s2.clock.t += 1000;
  assert.equal((await s2.store.submit(RID, { seq: 1, decision: 'continue', by: 'human' })).status, 'allow');
  assert.equal((await s2.store.submit(RID, { decision: 'cancel', by: 'human' })).status, 'deny');
  assert.equal((await s2.store.poll(RID, WHO)).state, 'deny');
});

test('no allow without a recorded human decision', async () => {
  const s = setup(); await open(s, 'attention'); s.clock.t += 1000;
  for (const by of ['auto-test', 'system', 'expired', 'page']) {
    assert.equal((await s.store.submit(RID, { seq: 1, decision: 'continue', by })).status, 'ignored', 'by=' + by);
  }
  assert.equal((await s.store.poll(RID, WHO)).state, 'pending');
  // a record forged or corrupted in the storage : "allow" without the human mark is a refusal
  const k = KEY + RID;
  for (const forged of [{ status: 'decided', outcome: 'allow' }, { status: 'decided', outcome: 'allow', decidedBy: 'human', human: null },
    { status: 'decided', outcome: 'allow', decidedBy: 'auto-test', human: { at: 1, seq: 1 } }, { status: 'decided', outcome: 'ok' }, { status: 'weird' }]) {
    s.storage.data[k] = Object.assign(clone(s.storage.data[k]), forged);
    assert.equal((await s.store.poll(RID, WHO)).state, 'deny', JSON.stringify(forged));
  }
  // open() never trusts a decision carried by its caller
  const s3 = setup();
  await s3.store.open({ rid: RID, ...WHO, origin: 'o', site: 'o', method: 'm', init: Object.assign(initFor('attention', s3.clock), { status: 'decided', outcome: 'allow', human: { at: 1, seq: 1 }, decidedBy: 'human' }) });
  assert.equal((await s3.store.poll(RID, WHO)).state, 'pending');
  // advance() cannot decide either
  await s3.store.advance(RID, null, (x) => { x.status = 'decided'; x.outcome = 'allow'; x.human = { at: 1, seq: 1 }; x.decidedBy = 'human'; });
  assert.equal((await s3.store.poll(RID, WHO)).state, 'pending');
});

test('the test-runner decision is accepted only by a store created with allowAuto', async () => {
  const s = setup({ allowAuto: true }); await open(s, 'attention'); s.clock.t += 1000;
  assert.equal((await s.store.submit(RID, { seq: 1, decision: 'continue', by: 'auto-test' })).status, 'allow');
  assert.equal((await s.store.poll(RID, WHO)).state, 'allow');
  const strict = new HoldStore({ storage: s.storage, now: () => s.clock.t });
  assert.equal((await strict.poll(RID, WHO)).state, 'deny', 'the shipped store refuses an allow recorded by the test runner');
});

test('double decision and stale screen are ignored', async () => {
  const s = setup(); await open(s, 'attention'); s.clock.t += 1000;
  assert.equal((await s.store.submit(RID, { seq: 9, decision: 'continue', by: 'human' })).status, 'ignored', 'wrong seq');
  const [a, b] = await Promise.all([s.store.submit(RID, { seq: 1, decision: 'continue', by: 'human' }), s.store.submit(RID, { seq: 1, decision: 'continue', by: 'human' })]);
  assert.deepEqual([a.status, b.status], ['allow', 'ignored']);
  assert.equal((await s.store.submit(RID, { decision: 'cancel', by: 'human' })).status, 'deny');
  assert.equal((await s.store.submit(RID, { decision: 'cancel', by: 'human' })).status, 'ignored', 'second cancel');
  assert.equal((await s.store.submit(RID, { seq: 1, decision: 'anything', by: 'human' })).status, 'ignored');
});

test('the answer belongs to the frame that asked, is consumed once, and the id cannot be replayed', async () => {
  const s = setup(); await open(s, 'attention'); s.clock.t += 1000;
  await s.store.submit(RID, { seq: 1, decision: 'continue', by: 'human' });
  assert.equal((await s.store.poll(RID, { tabId: 8, frameId: 0 })).state, 'unknown', 'another tab');
  assert.equal((await s.store.poll(RID, { tabId: 7, frameId: 3 })).state, 'unknown', 'another frame');
  assert.equal(await s.store.ack(RID, { tabId: 8, frameId: 0 }), false);
  assert.equal(await s.store.ack(RID, WHO), true);
  assert.equal((await s.store.poll(RID, WHO)).state, 'unknown', 'consumed : the page side treats unknown as a refusal');
  assert.equal(await s.store.ack(RID, WHO), false);
});

test('expiry, orphan and housekeeping only ever refuse', async () => {
  const s = setup(); const rec = await open(s, 'danger');
  s.clock.t = rec.expireAt;
  assert.equal((await s.store.poll(RID, WHO)).state, 'deny');
  const s2 = setup(); await open(s2, 'manipulation');
  s2.clock.t += LIMITS.orphanMs;
  const closed = await s2.store.sweep();
  assert.equal(closed.length, 1); assert.equal(closed[0].decidedBy, 'orphan');
  assert.equal((await s2.store.poll(RID, WHO)).state, 'deny');
  s2.clock.t += LIMITS.keepDecidedMs;
  await s2.store.sweep();
  assert.equal(Object.keys(s2.storage.data).length, 0, 'decided record dropped');
  // a page that keeps polling keeps its hold alive for the whole 10 minutes
  const s3 = setup(); await open(s3, 'manipulation');
  for (let i = 0; i < 60; i++) { s3.clock.t += 10000; await s3.store.poll(RID, WHO); assert.equal((await s3.store.sweep()).length, 0); }
  assert.equal((await s3.store.submit(RID, { seq: 1, decision: 'continue', by: 'human' })).status, 'allow');
});

test('open is idempotent on the request id, bounded per tab, and rejects bad ids', async () => {
  const s = setup(); await open(s, 'attention');
  const again = await s.store.open({ rid: RID, ...WHO, origin: 'x', site: 'x', method: 'm', init: initFor('attention', s.clock) });
  assert.equal(again.existed, true);
  assert.equal((await s.store.open({ rid: RID, tabId: 99, frameId: 0, init: {} })).error, 'invalide', 'same id from another tab');
  for (const bad of ['', 'short', 'a b c d e f g h', '../../etc/passwd', 'x'.repeat(65), null, 42]) assert.equal(validRid(bad), false);
  await open(s, 'attention', 'req-0000-0002'); await open(s, 'attention', 'req-0000-0003');
  assert.equal((await s.store.open({ rid: 'req-0000-0004', ...WHO, init: initFor('attention', s.clock) })).error, 'trop-de-demandes');
  assert.equal((await s.store.open({ rid: 'req-0000-0005', tabId: 8, frameId: 0, init: initFor('attention', s.clock) })).rec.rid, 'req-0000-0005', 'another tab is not affected');
});

test('two requests at once are independent', async () => {
  const s = setup(); await open(s, 'attention', 'req-0000-000a'); await open(s, 'attention', 'req-0000-000b'); s.clock.t += 1000;
  assert.equal((await s.store.submit('req-0000-000a', { decision: 'cancel', by: 'human' })).status, 'deny');
  assert.equal((await s.store.poll('req-0000-000b', WHO)).state, 'pending');
  assert.equal((await s.store.submit('req-0000-000b', { seq: 1, decision: 'continue', by: 'human' })).status, 'allow');
  assert.equal((await s.store.poll('req-0000-000a', WHO)).state, 'deny');
});

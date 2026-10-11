// Journal chaîné (journal_chain.js) : modification, suppression, réordonnancement, export et vérification hors ligne, borne, absence de phrase.
// Run : node --test extension/tests/unit/journal_chain.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeChrome, fakeClock, load, DIR } from './fake_chrome.mjs';

const C = await load('journal_chain.js');
const line = (i, over = {}) => Object.assign({ type: 'decision', decision: i % 2 ? 'confirm' : 'cancel', origin: 'https://app' + i + '.example.org', method: 'eth_sendTransaction', level: 'attention', ts: 1000 + i, codes: ['unlimited_allowance'] }, over);
async function build(n, storage) {
  const F = makeChrome(); const st = storage || F.chrome.storage.local;
  for (let i = 1; i <= n; i++) await C.chainAppend(st, line(i), '0.3.0');
  return (await st.get('chain')).chain;
}
const clone = (x) => JSON.parse(JSON.stringify(x));

test('an untouched chain verifies ; numbers and links are in order', async () => {
  const chain = await build(6);
  assert.deepEqual(chain.entries.map((e) => e.n), [1, 2, 3, 4, 5, 6]);
  assert.equal(chain.entries[0].prev, C.GENESIS); assert.equal(chain.entries[3].prev, chain.entries[2].hash);
  const r = await C.verifyChain(chain);
  assert.equal(r.ok, true); assert.equal(r.checked, 6); assert.match(r.note, /ancrage externe/);
});
test('a modified line is found (also when its own hash is recomputed : the next link breaks)', async () => {
  const chain = await build(6);
  const a = clone(chain); a.entries[2].l = 'danger';
  const ra = await C.verifyChain(a); assert.equal(ra.ok, false); assert.match(ra.problems.join(' '), /n° 3.*modifiée/);
  const b = clone(chain); b.entries[2].l = 'danger'; b.entries[2].hash = (await C.seal(b.entries[2].prev, 3, { t: b.entries[2].t, o: b.entries[2].o, type: b.entries[2].type, m: b.entries[2].m, l: 'danger', c: b.entries[2].c, d: b.entries[2].d, v: b.entries[2].v })).hash;
  const rb = await C.verifyChain(b); assert.equal(rb.ok, false); assert.match(rb.problems.join(' '), /n° 4.*rompu/);
});
test('a line removed in the middle is found ; so is a reordering', async () => {
  const chain = await build(6);
  const gone = clone(chain); gone.entries.splice(2, 1);
  const rg = await C.verifyChain(gone); assert.equal(rg.ok, false); assert.match(rg.problems.join(' '), /n° 4/);
  const swapped = clone(chain); [swapped.entries[1], swapped.entries[2]] = [swapped.entries[2], swapped.entries[1]];
  const rs = await C.verifyChain(swapped); assert.equal(rs.ok, false); assert.ok(rs.problems.length >= 2);
});
test('honest limit : the last lines removed, or a full rewrite, are NOT detected and the answer says so', async () => {
  const chain = await build(6);
  const cut = clone(chain); cut.entries.splice(4, 2);
  const rc = await C.verifyChain(cut); assert.equal(rc.ok, true, 'cannot be seen without an external anchor');
  assert.match(rc.note, /suppression des dernières lignes/); assert.match(rc.note, /réécriture complète/);
  const fresh = await build(3); // someone rebuilds a whole new chain from scratch
  assert.equal((await C.verifyChain(fresh)).ok, true);
});
test('bounded at 500 entries ; the dropped one becomes the anchor and the rest still verifies', async () => {
  const F = makeChrome(); const st = F.chrome.storage.local;
  await st.set({ chain: { anchor: null, entries: [] } });
  for (let i = 1; i <= 503; i++) await C.chainAppend(st, line(i), '0.3.0');
  const chain = (await st.get('chain')).chain;
  assert.equal(chain.entries.length, 500); assert.equal(chain.entries[0].n, 4); assert.equal(chain.anchor.n, 3);
  assert.equal((await C.verifyChain(chain)).ok, true);
  const bad = clone(chain); bad.anchor.hash = 'f'.repeat(64);
  assert.equal((await C.verifyChain(bad)).ok, false, 'a wrong anchor breaks the first link');
});
test('only the allowed fields are kept : no sentence, no full address, no extra field', async () => {
  const F = makeChrome(); const st = F.chrome.storage.local; const ME = '0x' + 'a1'.repeat(20);
  await C.chainAppend(st, { type: 'decision', decision: 'answer', origin: 'https://shop.example/path?token=' + ME, method: 'eth_sendTransaction', level: 'danger', ts: 5, intent: 'pay_someone', text: 'payer 20 USDC à ' + ME, facts: { x: 1 }, codes: ['a_b', 'not ok', ME] }, '0.3.0');
  const s = JSON.stringify((await st.get('chain')).chain);
  assert.ok(!s.includes('payer') && !s.toLowerCase().includes(ME.slice(2)) && !s.includes('pay_someone') && !s.includes('/path'));
  const e = (await st.get('chain')).chain.entries[0];
  assert.deepEqual(Object.keys(e).sort(), ['c', 'd', 'hash', 'l', 'm', 'n', 'o', 'prev', 't', 'type', 'v']);
  assert.equal(e.o, 'shop.example'); assert.deepEqual(e.c, ['a_b']);
  const long = 'https://app.uniswap.org.' + 'x'.repeat(80) + '.evil.example';
  await C.chainAppend(st, { type: 'decision', origin: long, ts: 6 }, '0.3.0');
  const o = (await st.get('chain')).chain.entries[1].o; assert.ok(o.endsWith('evil.example') && o.length <= 41);
});
test('through the gatekeeper : a real passage writes chained lines without the sentence ; the export is verified offline by tools/verify_journal.mjs', async () => {
  const clock = fakeClock(); const F = makeChrome(); globalThis.chrome = F.chrome; F.chrome.runtime.getManifest = () => ({ version: '9.9.9' });
  const { createGatekeeper } = await load('gatekeeper.js');
  const ME = '0x' + 'a1'.repeat(20), TOKEN = '0x' + 'c3'.repeat(20), BOB = '0x' + 'b2'.repeat(20);
  createGatekeeper({ check: async () => ({ level: 'attention', codes: ['external_spender'], texts: { croit: 'a', reel: 'x', danger: 'c', action: 'd' }, reasons: [], effects: { grants_right: false, funds_out: true }, risk_signals: [] }),
    classify: async () => ({ source: 'clef', model: true, kind: 'pay_someone', confidence: 0.95, facts: { asked: 0.02, receive: 0.02, grant: 0.02 } }) });
  const rid = 'rid-chain-0001', page = F.page(9, 'https://shop.example');
  const data = '0xa9059cbb' + BOB.slice(2).padStart(64, '0') + (20000000).toString(16).padStart(64, '0');
  await F.send({ type: 'gate', rid, payload: { kind: 'gate', method: 'eth_sendTransaction', params: [{ from: ME, to: TOKEN, data }], chainId: '0x1', from: ME } }, page);
  let wid = null; for (const [id, o] of F.state.windows) if (o.url.endsWith('window.html#' + rid)) wid = id;
  const win = F.win(wid, rid);
  clock.advance(1000); await F.send({ type: 'hu.decision', rid, seq: 1, decision: 'answer', text: 'payer 20 USDC à ' + BOB }, win);
  clock.advance(2000); await F.send({ type: 'hu.decision', rid, seq: 2, decision: 'cancel' }, win);
  const chain = F.state.local.chain;
  assert.ok(chain && chain.entries.length >= 2);
  assert.ok(chain.entries.every((e) => e.v === '9.9.9' && e.o === 'shop.example'));
  assert.ok(chain.entries.some((e) => e.type === 'verdict' && e.c.includes('external_spender')));
  assert.ok(chain.entries.some((e) => e.type === 'decision' && e.d === 'cancel'));
  assert.ok(!JSON.stringify(chain).includes('payer 20') && !JSON.stringify(chain).toLowerCase().includes(BOB.slice(2)));
  assert.equal((await C.verifyChain(chain)).ok, true);
  // export -> file -> the node tool
  const dir = mkdtempSync(join(tmpdir(), 'holdup-j-'));
  const good = join(dir, 'ok.json'); writeFileSync(good, C.exportChain(chain));
  const bad = join(dir, 'bad.json'); const tampered = clone(chain); tampered.entries[0].l = 'danger'; writeFileSync(bad, C.exportChain(tampered));
  const tool = fileURLToPath(new URL('../../tools/verify_journal.mjs', import.meta.url));
  const run = (f) => spawnSync(process.execPath, ['--no-warnings', tool, f], { encoding: 'utf8' });
  const g = run(good), b = run(bad);
  assert.equal(g.status, 0, g.stdout + g.stderr); assert.match(g.stdout, /cohérente/); assert.match(g.stdout, /ancrage externe/);
  assert.equal(b.status, 1); assert.match(b.stdout, /ROMPUE/); assert.match(b.stdout, /modifiée/);
  writeFileSync(join(dir, 'x.json'), 'pas du json'); assert.equal(run(join(dir, 'x.json')).status, 2);
  clock.restore(); delete globalThis.chrome;
});

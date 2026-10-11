// S4 (relief Q16 only for the gap itself) and S7 (padding over 200 000 bytes) through the real gatekeeper with a fake chrome.
// Run : node --test extension/tests/unit/securite_gatekeeper.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeChrome, fakeClock, load } from './fake_chrome.mjs';

const { createGatekeeper } = await load('gatekeeper.js');
const ME = '0x' + 'a1'.repeat(20), TOKEN = '0x' + 'c3'.repeat(20), SPENDER = '0x' + 'e5'.repeat(20), BOB = '0x' + 'b2'.repeat(20);
const w32 = (h) => h.replace(/^0x/, '').padStart(64, '0');
const APPROVE_MAX = '0x095ea7b3' + w32(SPENDER) + 'f'.repeat(64);
const TRANSFER_20 = '0xa9059cbb' + w32(BOB) + (20000000).toString(16).padStart(64, '0');
const model = (kind, confidence, facts = {}) => async () => ({ source: 'clef', model: true, kind, confidence, facts: Object.assign({ asked: 0.02, receive: 0.02, grant: 0.02 }, facts) });
let n = 0;

async function run({ engine, params, classify, text, pad = 0, known = true }) {
  const clock = fakeClock(); const F = makeChrome(); globalThis.chrome = F.chrome;
  if (known) await F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [], tokens: [{ address: TOKEN, symbol: 'USDC', decimals: 6 }] } });
  createGatekeeper({ check: async () => engine, classify });
  const rid = 'rid-sec-' + String(++n).padStart(4, '0'), page = F.page(7 + n, 'https://evil.example');
  const body = { method: 'eth_sendTransaction', params: pad ? [Object.assign({}, params[0], { junk: 'A'.repeat(pad) })] : params, chainId: '0x1', from: ME };
  await F.send({ type: 'gate', rid, payload: Object.assign({ kind: 'gate' }, body) }, page);
  let wid = null; for (const [id, o] of F.state.windows) if (o.url.endsWith('window.html#' + rid)) wid = id;
  const win = F.win(wid, rid);
  let v = (await F.send({ type: 'hu.view', rid }, win)).view;
  const first = v.stage;
  if (v.stage === 'intent') { clock.advance(1000); v = (await F.send({ type: 'hu.decision', rid, seq: 1, decision: 'answer', text }, win)).view; }
  const res = { first, outcome: v.screen && v.screen.outcome, waitMs: v.friction && v.friction.waitMs, phrase: v.friction && v.friction.phrase, auto: v.screen && v.screen.autoMs, line: v.screen && v.screen.line, level: v.verdict && v.verdict.level, fix: v.screen && v.screen.fix };
  clock.restore(); delete globalThis.chrome;
  return res;
}
const verdict = (level, extra = {}) => Object.assign({ level, texts: { croit: 'a', reel: 'Cette demande donne un droit.', danger: 'c', action: 'd' }, reasons: [], effects: { grants_right: true, funds_out: false }, risk_signals: [] }, extra);
const SWAP = 'approuver 50 USDC pour échanger';

test('S4 : danger for another reason (flagged spender, any signal, unexplained danger) keeps its delay and its phrase', async () => {
  for (const extra of [{ risk_signals: ['known_drainer'] }, { codes: ['unlimited_allowance', 'flagged_spender'] }, {}]) {
    const r = await run({ engine: verdict('danger', extra), params: [{ from: ME, to: TOKEN, data: APPROVE_MAX }], classify: model('buy_or_swap', 0.95, { grant: 0.9 }), text: SWAP });
    assert.ok(r.waitMs > 0 && r.phrase === true, JSON.stringify(extra) + ' ' + JSON.stringify(r));
  }
});
test('S4 : the plain gap (attention, or danger explained only by the unlimited right) keeps its relief : no delay, the correction', async () => {
  for (const eng of [verdict('attention'), verdict('danger', { codes: ['unlimited_allowance', 'external_spender'] })]) {
    const r = await run({ engine: eng, params: [{ from: ME, to: TOKEN, data: APPROVE_MAX }], classify: model('buy_or_swap', 0.95, { grant: 0.9 }), text: SWAP });
    assert.equal(r.waitMs, 0); assert.equal(r.phrase, false); assert.equal(r.fix, 'Droit limité à 50 USDC');
  }
});
test('S3 through the gatekeeper : transfer + 1 ETH is not "match", no automatic send', async () => {
  const r = await run({ engine: verdict('attention', { effects: { grants_right: false, funds_out: true } }), params: [{ from: ME, to: TOKEN, data: TRANSFER_20, value: '0xde0b6b3a7640000' }], classify: model('pay_someone', 0.95), text: 'payer 20 USDC à ' + BOB });
  assert.notEqual(r.outcome, 'match'); assert.ok(!r.auto);
});
test('S2 through the gatekeeper : a token the context does not know never gives an automatic "Ça correspond"', async () => {
  const r = await run({ known: false, engine: verdict('attention', { effects: { grants_right: false, funds_out: true } }), params: [{ from: ME, to: TOKEN, data: TRANSFER_20 }], classify: model('pay_someone', 0.95), text: 'payer 20 USDC à ' + BOB });
  assert.equal(r.outcome, 'unverifiable'); assert.ok(!r.auto); assert.ok(r.waitMs > 0);
});
test('S7 : a request padded over 200 000 bytes still gets the question (padding dropped), and the check is made', async () => {
  const r = await run({ engine: verdict('attention', { effects: { grants_right: false, funds_out: true } }), params: [{ from: ME, to: TOKEN, data: TRANSFER_20 }], classify: model('pay_someone', 0.95), text: 'payer 20 USDC à ' + BOB, pad: 210000 });
  assert.equal(r.first, 'intent');
  assert.equal(r.outcome, 'match', 'the slimmed body is read as the honest request it is');
  const bad = await run({ engine: verdict('attention', { effects: { grants_right: false, funds_out: true } }), params: [{ from: ME, to: TOKEN, data: TRANSFER_20 }], classify: model('pay_someone', 0.95), text: 'payer 21 USDC à ' + BOB, pad: 210000 });
  assert.equal(bad.outcome, 'mismatch', 'a gap is still found');
});
test('S7 : a request that stays too big once slimmed (huge data) fails closed : "not verified", held, no question', async () => {
  const r = await run({ engine: verdict('attention', { effects: { grants_right: false, funds_out: true } }), params: [{ from: ME, to: TOKEN, data: '0x12345678' + 'ab'.repeat(110000) }], classify: model('pay_someone', 0.95), text: 'payer 20 USDC à ' + BOB });
  assert.equal(r.first, 'verdict'); assert.equal(r.outcome, 'unverifiable'); assert.ok(r.waitMs > 0); assert.ok(!r.auto);
  assert.match(r.line, /trop grande/);
});

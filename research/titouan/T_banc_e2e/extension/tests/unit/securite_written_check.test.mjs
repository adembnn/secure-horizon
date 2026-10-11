// S2, S3, S8, S9 (revue de securite n2) : ce que la personne a ecrit contre ce que la demande porte.
// Run : node --test extension/tests/unit/securite_written_check.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './fake_chrome.mjs';

const W = await load('written_check.js');
const O = await load('outcome.js');
const ME = '0x' + 'a1'.repeat(20), BOB = '0x' + 'b2'.repeat(20), FAKE = '0x' + 'c3'.repeat(20), SPENDER = '0x' + 'd4'.repeat(20);
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const pad = (a) => String(a).replace(/^0x/, '').padStart(64, '0');
const hex = (n) => BigInt(n).toString(16).padStart(64, '0');
const transfer = (to, amount) => '0xa9059cbb' + pad(to) + hex(amount);
const approve = (sp, amount) => '0x095ea7b3' + pad(sp) + hex(amount);
const MAX = (1n << 256n) - 1n;
const tx = (o) => ({ method: 'eth_sendTransaction', params: [Object.assign({ from: ME }, o)] });
const pay = (symbol, amount, address = BOB) => ({ clear: true, kind: 'pay_someone', amount, symbol, address });
const tokens = W.tokensOf({ tokens: [{ address: FAKE, symbol: 'USDC', decimals: 6 }] }, '0x1');

// ---- S2 : a token nobody knows by its address never gives "match"
test('S2 : the sentence says DAI, the request sends 100 WETH to the same recipient : never "match"', () => {
  const r = W.writtenCheck(tx({ to: WETH, data: transfer(BOB, 100n * 10n ** 18n) }), pay('DAI', '100'), W.tokensOf(undefined, '0x1'));
  assert.equal(r.outcome, 'mismatch');
  assert.match(r.line, /WETH/);
  const unknown = W.writtenCheck(tx({ to: FAKE, data: transfer(BOB, 100n * 10n ** 18n) }), pay('DAI', '100'), {});
  assert.notEqual(unknown.outcome, 'match');
});
test('S2 : an unknown token address with the right amount and recipient is "not verified", never "match"', () => {
  const r = W.writtenCheck(tx({ to: FAKE, data: transfer(BOB, 20_000_000n) }), pay('USDC', '20'), W.tokensOf(undefined, '0x1'));
  assert.equal(r.outcome, 'unverifiable'); assert.match(r.line, /ne connais pas ce jeton/);
  const g = W.writtenCheck(tx({ to: FAKE, data: approve(SPENDER, 50_000_000n) }), { clear: true, kind: 'buy_or_swap', amount: '50', symbol: 'USDC' }, W.tokensOf(undefined, '0x1'));
  assert.equal(g.outcome, 'unverifiable', 'a right on an unknown token is not "within the amount" either');
});
test('S2 : a token known by the built-in list or by the local context still matches, and a gap on an unknown token is still a gap', () => {
  assert.equal(W.writtenCheck(tx({ to: USDC, data: transfer(BOB, 20_000_000n) }), pay('USDC', '20'), W.tokensOf(undefined, '0x1')).outcome, 'match');
  assert.equal(W.writtenCheck(tx({ to: FAKE, data: transfer(BOB, 20_000_000n) }), pay('USDC', '20'), tokens).outcome, 'match');
  assert.equal(W.writtenCheck(tx({ to: FAKE, data: approve(SPENDER, MAX) }), { clear: true, kind: 'buy_or_swap', amount: '50', symbol: 'USDC' }, {}).outcome, 'mismatch');
  assert.equal(W.writtenCheck(tx({ to: FAKE, data: transfer('0x' + 'ee'.repeat(20), 20_000_000n) }), pay('USDC', '20'), {}).outcome, 'mismatch', 'wrong recipient is reported');
});

// ---- S3 : the native value that rides with data
test('S3 : transfer(...) with 1 ETH attached is never "match" (payment, and the same inside wallet_sendCalls)', () => {
  const call = { to: USDC, data: transfer(BOB, 10_000_000n), value: '0xde0b6b3a7640000' };
  const t = W.tokensOf(undefined, '0x1');
  assert.equal(W.writtenCheck(tx(call), pay('USDC', '10'), t).outcome, 'mismatch');
  assert.equal(W.writtenCheck({ method: 'wallet_sendCalls', params: [{ calls: [call] }] }, pay('USDC', '10'), t).outcome, 'mismatch');
  assert.equal(W.writtenCheck(tx({ to: USDC, data: transfer(BOB, 10_000_000n), value: '0x0' }), pay('USDC', '10'), t).outcome, 'match', 'control : no value');
  // an approve with value attached : the value is a send, so the request is not a clean right
  const f = W.requestFacts(tx({ to: USDC, data: approve(SPENDER, 10_000_000n), value: '0x5' }));
  assert.equal(f.grants.length, 1); assert.equal(f.sends.length, 1); assert.equal(f.sends[0].token, null);
});
test('S3 : a call with data nobody here can read keeps its value out of the facts (its effect is measured)', () => {
  const f = W.requestFacts(tx({ to: BOB, data: '0x12345678' + '00'.repeat(32), value: '0x5' }));
  assert.equal(f.sends.length, 0);
  assert.equal(W.requestFacts(tx({ to: BOB, value: '0x5' })).sends.length, 1, 'plain value transfer unchanged');
});

// ---- S8 : every call, data against input
test('S8 : wallet_sendCalls : the 65th call (unlimited approve) is read ; beyond the high limit the request is "not verified"', () => {
  const benign = { to: USDC, data: transfer(BOB, 10_000_000n), value: '0x0' };
  const evil = { to: USDC, data: approve(SPENDER, MAX), value: '0x0' };
  const f = W.requestFacts({ method: 'wallet_sendCalls', params: [{ calls: Array.from({ length: 64 }, () => benign).concat([evil]) }] });
  assert.equal(f.grants.length, 1); assert.equal(f.tooBig, false);
  const swap = { clear: true, kind: 'buy_or_swap', amount: '50', symbol: 'USDC' };
  const r = W.writtenCheck({ method: 'wallet_sendCalls', params: [{ calls: Array.from({ length: 64 }, () => ({ to: USDC, data: '0x12345678' })).concat([evil]) }] }, swap, W.tokensOf(undefined, '0x1'));
  assert.equal(r.outcome, 'mismatch', 'the 65th call is seen');
  const many = { method: 'wallet_sendCalls', params: [{ calls: Array.from({ length: W.MAX_CALLS + 1 }, () => ({ to: USDC, data: approve(SPENDER, 1_000_000n) })) }] };
  const big = W.writtenCheck(many, swap, W.tokensOf(undefined, '0x1'));
  assert.notEqual(big.outcome, 'match'); assert.equal(big.outcome === 'unverifiable' || big.outcome === 'mismatch', true);
  assert.equal(W.requestFacts(many).tooBig, true);
  assert.equal(W.limitPlan(many, { clear: true, kind: 'buy_or_swap', amount: '0.5', symbol: 'USDC', text: 'échanger 0,5 USDC contre AVAX', facts: { grant: true } }, W.tokensOf(undefined, '0x1')), null, 'never rewritten');
});
test('S8 : "data" and "input" that differ : both are read, and the request can never match', () => {
  const t = W.tokensOf(undefined, '0x1');
  const f = W.requestFacts(tx({ to: USDC, data: transfer(BOB, 10_000_000n), input: approve(SPENDER, MAX) }));
  assert.equal(f.ambiguous, true); assert.equal(f.grants.length, 1);
  const r = W.writtenCheck(tx({ to: USDC, data: transfer(BOB, 10_000_000n), input: transfer(BOB, 10_000_000n).replace('0xa9059cbb', '0xa9059cbb') + '' }), pay('USDC', '10'), t);
  assert.equal(r.outcome, 'match', 'identical data and input is not ambiguous');
  const amb = W.writtenCheck(tx({ to: USDC, data: transfer(BOB, 10_000_000n), input: '0x' }), pay('USDC', '10'), t);
  assert.notEqual(amb.outcome, 'match');
});

// ---- S9 : the site name never hides the real domain
test('S9 : a long host is cut in the middle, the registrable domain stays whole', () => {
  const long = 'app.uniswap.org.' + 'x'.repeat(60) + '.' + 'y'.repeat(60) + '.evil.example';
  const shown = O.siteName(long);
  assert.ok(shown.endsWith('evil.example'), shown);
  assert.ok(shown.includes('…'));
  assert.ok(O.siteName('a'.repeat(70) + '.evil.example').includes('evil.example'));
  assert.equal(O.siteName('app.uniswap.org'), 'app.uniswap.org', 'short hosts are untouched');
  const idn = 'xn--' + 'a'.repeat(59) + '.' + 'b'.repeat(30) + '.xn--evil-site.xn--p1ai';
  assert.ok(O.siteName(idn).endsWith('xn--evil-site.xn--p1ai'));
  assert.equal(O.siteName('127.0.0.1:8791'), '', 'loopback is "ce site"');
  assert.equal(O.siteName('203.0.113.77:8443'), '203.0.113.77:8443');
});

// The model path, end to end, with a SIMULATED relay (no network : globalThis.fetch is replaced, the test fails on any other URL).
// classifier_client.js -> gatekeeper (understand, strict-only) -> outcome.js -> what the window receives (view.screen.model / noModel).
// Hard rules checked here : only the written sentence leaves the extension ; amounts, tokens and addresses come from code, never
// from the model ; the model never turns a refused request into an accepted one ; below the threshold, on silence, on a slow or
// incoherent answer the keyword parser answers and the window says so.
// Run : node --test extension/tests/unit/relay_model.test.mjs      (HOLDUP_DIR=<built folder> replays it on a build)
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeChrome, fakeClock, load, DIR } from './fake_chrome.mjs';

const { createGatekeeper } = await load('gatekeeper.js');
const C = await load('classifier_client.js');
const I = await load('intent_text.js');
const LIVE = C.RELAY !== null; // the no-network build ships a stub : the client tests are skipped there, the gatekeeper ones still run
const ME = '0x' + 'a1'.repeat(20), TOKEN = '0x' + 'c3'.repeat(20), TO = '0x' + 'b2'.repeat(20), SPENDER = '0x' + 'e5'.repeat(20);
const w32 = (h) => h.replace(/^0x/, '').padStart(64, '0');
const TRANSFER_20 = { from: ME, to: TOKEN, data: '0xa9059cbb' + w32(TO) + (20000000).toString(16).padStart(64, '0') };
const APPROVE_MAX = { from: ME, to: TOKEN, data: '0x095ea7b3' + w32(SPENDER) + 'f'.repeat(64) };
const PAY = 'payer 20 USDC à ' + TO;
const answer = (kind, confidence, facts = {}, more = {}) => Object.assign({ source: 'clef', model: true, kind, confidence, facts: Object.assign({ asked: 0.02, receive: 0.02, grant: 0.02 }, facts), ms: 400 }, more);
const verdict = (level, extra = {}) => Object.assign({ level, texts: { croit: 'a', reel: 'Cette demande envoie 20 USDC.', danger: 'c', action: 'd' }, reasons: [], effects: { grants_right: false, funds_out: true }, risk_signals: [] }, extra);

let F, clock, calls, realFetch, n = 0;
// The simulated relay : `reply` is a function (init) -> Response | Promise<Response> | throws.
function relay(reply) {
  calls = [];
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(url, 'http://127.0.0.1:8789/classify', 'the extension calls the local relay and nothing else');
    calls.push({ url, init, body: JSON.parse(init.body) });
    return reply(init);
  };
}
const json = (body, status = 200) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
beforeEach(async () => {
  realFetch = globalThis.fetch; clock = fakeClock(); F = makeChrome(); globalThis.chrome = F.chrome; calls = [];
  globalThis.fetch = async (url) => { throw new Error('unexpected network call in a unit test : ' + url); };
  await F.chrome.storage.local.set({ contexte: { contacts: [], history: [], protected: [], knownSpenders: [], tokens: [{ address: TOKEN, symbol: 'USDC', decimals: 6 }] } });
});
afterEach(() => { globalThis.fetch = realFetch; clock.restore(); delete globalThis.chrome; });

// One request through the real gatekeeper, the sentence written once. -> the view of the answer screen.
async function play({ engine = verdict('attention'), tx = TRANSFER_20, text = PAY, classify = C.classifyViaRelay } = {}) {
  createGatekeeper({ check: async () => engine, classify });
  const rid = 'rid-relay-' + String(++n).padStart(4, '0'), page = F.page(7 + n, 'https://s' + n + '.evil.example'); // one site per request : the gatekeeper limits the requests of a same site
  await F.send({ type: 'gate', rid, payload: { kind: 'gate', method: 'eth_sendTransaction', params: [tx], chainId: '0x7a69', from: ME } }, page);
  let wid = null; for (const [id, o] of F.state.windows) if (o.url.endsWith('window.html#' + rid)) wid = id;
  const first = (await F.send({ type: 'hu.view', rid }, F.win(wid, rid))).view;
  if (first.stage !== 'intent') { F.killWorker(); return first; } // a request that cannot be verified gets no question
  clock.advance(1000);
  let r = await F.send({ type: 'hu.decision', rid, seq: 1, decision: 'answer', text }, F.win(wid, rid));
  if (r.view && r.view.screen && r.view.screen.kind === 'question') { clock.advance(1000); r = await F.send({ type: 'hu.decision', rid, seq: r.view.seq, decision: 'answer', text }, F.win(wid, rid)); }
  await F.send({ type: 'hu.decision', rid, decision: 'cancel' }, F.win(wid, rid)); // nothing stays pending between two requests of a test
  F.killWorker();
  return r.view;
}

test('the sentence goes to the relay, the answer is used, and the window says "classée par Clef"', { skip: !LIVE }, async () => {
  relay(() => json(answer('pay_someone', 0.96)));
  const v = await play();
  assert.equal(calls.length, 1);
  assert.equal(v.screen.outcome, 'match'); assert.equal(v.screen.model, 'clef'); assert.equal(v.screen.noModel, false);
});

test('only the written sentence leaves the extension : no account, no request, no site, no cookie, no key', { skip: !LIVE }, async () => {
  relay(() => json(answer('pay_someone', 0.96)));
  await play();
  const c = calls[0];
  assert.deepEqual(c.body, { text: PAY }, 'the body is { text } and nothing else');
  assert.equal(c.init.method, 'POST'); assert.equal(c.init.credentials, 'omit'); assert.equal(c.init.redirect, 'error'); assert.equal(c.init.cache, 'no-store');
  assert.deepEqual(Object.keys(c.init.headers), ['content-type'], 'no authorization header : the keys live in the relay');
  // a sentence without any address : nothing of the request or of the account is in the call
  relay(() => json(answer('buy_or_swap', 0.9)));
  await play({ text: 'échanger 50 USDC contre AVAX' });
  assert.deepEqual(calls[0].body, { text: 'échanger 50 USDC contre AVAX' });
  const sent = calls[0].init.body + JSON.stringify(calls[0].init.headers) + calls[0].url;
  for (const secret of [ME, ME.slice(2), TOKEN.slice(2), TO.slice(2), 'a9059cbb', 'evil.example', '0x7a69', 'eth_sendTransaction']) assert.ok(!sent.includes(secret), 'leaked : ' + secret);
});

test('no key and no secret in the client file', () => {
  const src = readFileSync(join(DIR, 'classifier_client.js'), 'utf8');
  assert.ok(!/authorization|bearer|api[_-]?key|token\s*[:=]|CF_|JEV_/i.test(src));
});

test('relay stopped, HTTP error, unreadable or slow answer : keyword parser, and the window says "sans modèle"', { skip: !LIVE }, async () => {
  const cases = {
    refused: () => { throw new TypeError('Failed to fetch'); }, http500: () => json({ error: 'x' }, 500), http403: () => json({ error: 'bad-origin' }, 403),
    notJson: () => json('<html>'), array: () => json([1, 2]), string: () => json('"ok"'),
    slow: (init) => new Promise((_, rej) => { init.signal.addEventListener('abort', () => { const e = new Error('aborted'); e.name = 'AbortError'; rej(e); }); clock.advance(C.RELAY_TIMEOUT_MS + 1); })
  };
  for (const name of Object.keys(cases)) {
    relay(cases[name]);
    const v = await play();
    assert.equal(calls.length, 1, name);
    assert.equal(v.screen.noModel, true, name + ' : the window says the sentence was classified without the model');
    assert.equal(v.screen.model, null, name); assert.equal(v.screen.outcome, 'match', name + ' : the keyword parser still reads this sentence');
  }
});

// From here the relay's ANSWER is injected directly (classify) : the rules hold in both builds, whatever carries the answer.
const says = (raw) => async () => raw;

test('the relay says it answered by keywords (no key, timeout, error on its side) : the window says "sans modèle"', async () => {
  const v = await play({ classify: says({ source: 'keywords', model: false, kind: 'pay_someone', confidence: 0.6, facts: { asked: 0, receive: 0, grant: 0 }, why: 'timeout' }) });
  assert.equal(v.screen.noModel, true); assert.equal(v.screen.model, null);
});

test('below the confidence threshold, or an incoherent answer : keyword parser, announced', async () => {
  assert.equal(I.MODEL_MIN, 0.6);
  const bad = [answer('pay_someone', 0.59), answer('pay_someone', null), answer('pay_someone', 'high'), answer('pay_someone', NaN), answer('approve_everything', 0.99),
    answer(undefined, 0.9), answer('none', 0.3), { source: 'clef', model: true }, { source: 'gpt', model: true, kind: 'pay_someone', confidence: 0.99 }, { source: 'clef', model: 'yes', kind: 'pay_someone', confidence: 0.99 }];
  for (const raw of bad) {
    const v = await play({ classify: says(raw) });
    assert.equal(v.screen.noModel, true, JSON.stringify(raw)); assert.equal(v.screen.model, null, JSON.stringify(raw));
    assert.equal(v.screen.outcome, 'match', 'the keyword parser reads the sentence : ' + JSON.stringify(raw));
  }
  // at the threshold the model answer counts
  assert.equal((await play({ classify: says(answer('pay_someone', 0.6)) })).screen.model, 'clef');
  // a confident "none" is a model answer : not understood, and it is the model that said so
  const none = await play({ classify: says(answer('none', 0.9)) });
  assert.equal(none.screen.model, 'clef'); assert.equal(none.screen.outcome, 'unverifiable');
});

test('amounts, tokens and addresses are read by code : whatever the model adds is ignored', async () => {
  const lying = answer('pay_someone', 0.99, {}, { amount: '21', symbol: 'DAI', address: '0x' + 'dd'.repeat(20), named: false, text: 'payer 21 USDC', clear: true, vague: false });
  const it = I.interpret(lying, PAY);
  assert.equal(it.amount, '20'); assert.equal(it.symbol, 'USDC'); assert.equal(it.address, TO);
  assert.equal((await play({ classify: says(lying) })).screen.outcome, 'match', 'the request (20 USDC to TO) is compared with the sentence, not with the model');
  // the model cannot hide a gap either : 21 written, 20 asked
  const v = await play({ classify: says(answer('pay_someone', 0.99, {}, { amount: '20', symbol: 'USDC' })), text: 'payer 21 USDC à ' + TO });
  assert.equal(v.screen.outcome, 'mismatch');
  // nor the recipient
  const w = await play({ classify: says(answer('pay_someone', 0.99, {}, { address: TO })), text: 'payer 20 USDC à 0x' + 'dd'.repeat(20) });
  assert.equal(w.screen.outcome, 'mismatch');
});

test('strict-only : the model never lowers a verdict, never makes a refused request pass', async () => {
  for (const level of ['danger', 'manipulation', 'unknown']) {
    const calm = await play({ engine: verdict(level), classify: says(answer('pay_someone', 0.99)) });
    assert.notEqual(calm.screen.outcome, 'match', level); assert.ok(!calm.screen.autoMs, level + ' : never sent on by itself');
    assert.ok(calm.friction.waitMs > 0, level + ' keeps its delay');
  }
  // an unlimited right, the model alone claims "the person wants to give a permission" : the words do not say it
  const grantOnly = says(answer('connect_or_accept_offer', 0.99, { grant: 0.99 }));
  const eng = verdict('danger', { effects: { grants_right: true, funds_out: false }, codes: ['unlimited_allowance', 'flagged_spender'], risk_signals: ['known_drainer'] });
  const v = await play({ engine: eng, tx: APPROVE_MAX, text: 'voir mon solde', classify: grantOnly });
  assert.equal(v.screen.outcome, 'mismatch'); assert.ok(v.friction.waitMs > 0); assert.ok(!v.screen.autoMs);
  // plain danger, same model answer : the model's "grant" alone does not turn the answer into "Ça correspond"
  const plain = await play({ engine: verdict('danger', { effects: { grants_right: true, funds_out: false } }), tx: APPROVE_MAX, text: 'voir mon solde', classify: grantOnly });
  assert.equal(plain.screen.outcome, 'mismatch'); assert.ok(plain.friction.waitMs > 0);
});

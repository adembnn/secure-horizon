// chain_facts.js : what is read directly on the chain, and what it adds to the written check. No network here : `fetchImpl` is a fake node.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAIN_RPC, chainFacts, chainOf, units, withChainFacts } from '../../chain_facts.js';
import { knownService } from '../../written_check.js';

const ME = '0x' + 'a1'.repeat(20), ROUTER = '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106', PLAIN = '0x' + 'b2'.repeat(20);
const AVAX = (n) => '0x' + (BigInt(n) * 10n ** 18n).toString(16);
const tx = (to, over = {}) => ({ method: 'eth_sendTransaction', chainId: '0xa86a', params: [Object.assign({ from: ME, to, value: AVAX(50), data: '0xa2a1623d' + '00'.repeat(64) }, over)] });
// A fake node : `code` per address, one balance, and what eth_call answers. Every call is recorded.
function node({ code = {}, balance = '0x0', call = '0x', status = 200, fail = null } = {}) {
  const seen = [];
  const fetchImpl = async (url, init) => {
    const q = JSON.parse(init.body); seen.push({ url, method: q.method, params: q.params, init });
    if (fail) throw new Error(fail);
    if (status !== 200) return { status, json: async () => { throw new Error('not json'); } };
    const answer = q.method === 'eth_getCode' ? { result: code[String(q.params[0]).toLowerCase()] || '0x' }
      : q.method === 'eth_getBalance' ? { result: balance }
        : q.method === 'eth_call' ? (call && typeof call === 'object' ? { error: call } : { result: call }) : { error: { message: 'the method ' + q.method + ' does not exist' } };
    return { status: 200, json: async () => Object.assign({ jsonrpc: '2.0', id: 1 }, answer) };
  };
  return { fetchImpl, seen };
}
const swapIntent = { clear: true, kind: 'buy_or_swap', facts: {}, text: 'échanger 50 AVAX contre USDC', amount: '50', symbol: 'AVAX' };
const matched = { outcome: 'match', line: 'La demande échange 50 AVAX contre au moins 400 USDC, sur ton compte.' };

test('only Avalanche and Fuji are read, and only a transaction', async () => {
  const n = node();
  assert.deepEqual(Object.keys(CHAIN_RPC), ['43113', '43114']);
  assert.equal(await chainFacts(Object.assign(tx(ROUTER), { chainId: '0x1' }), n), null);
  assert.equal(await chainFacts({ method: 'eth_signTypedData_v4', chainId: '0xa86a', params: [ME, '{}'] }, n), null);
  assert.equal(await chainFacts(tx('0x1234'), n), null);
  assert.equal(await chainFacts(tx(ROUTER, { value: 'not a number' }), n), null);
  assert.equal(await chainFacts(tx(ROUTER), {}), null); // no fetch given : nothing is read
  assert.equal(n.seen.length, 0);
  assert.equal(chainOf({ params: [{ chainId: '0xa869' }] }), 43113);
});

test('a contract, an account that holds the amount, a call that ends', async () => {
  const n = node({ code: { [ROUTER.toLowerCase()]: '0x6080' }, balance: AVAX(60), call: '0x' + '00'.repeat(32) });
  const f = await chainFacts(tx(ROUTER), n);
  assert.deepEqual({ chain: f.chain, contract: f.contract, enough: f.enough, runs: f.runs, hasData: f.hasData }, { chain: 43114, contract: true, enough: true, runs: true, hasData: true });
  assert.equal(f.target, ROUTER.toLowerCase()); assert.equal(f.account, ME);
  // read-only methods, on the public RPC of the network, without cookie ; the call is replayed with the amount in hand
  assert.deepEqual(n.seen.map((s) => s.method).sort(), ['eth_call', 'eth_getBalance', 'eth_getCode']);
  assert.ok(n.seen.every((s) => s.url === CHAIN_RPC[43114] && s.init.credentials === 'omit' && s.init.method === 'POST'));
  const call = n.seen.find((s) => s.method === 'eth_call');
  assert.ok(BigInt(call.params[2][ME].balance) > 50n * 10n ** 18n);
  const w = withChainFacts(matched, f, swapIntent, { service: knownService(f.target, f.chain) });
  assert.equal(w.outcome, 'match');
  assert.equal(w.line, matched.line + ' Le contrat appelé est Pangolin.');
  assert.equal(matched.line.includes('Pangolin'), false); // the answer given is never modified in place
});

test('the account does not hold the amount : said, the outcome does not change', async () => {
  const n = node({ code: { [ROUTER.toLowerCase()]: '0x6080' }, balance: '0x0', call: '0x' });
  const w = withChainFacts(matched, await chainFacts(tx(ROUTER), n), swapIntent, {});
  assert.equal(w.outcome, 'match');
  assert.match(w.line, /Ton compte détient 0 AVAX : il n’a pas les 50 AVAX de cette demande\.$/);
});

test('an exchange was written and the request calls an address without code : it does not match, whatever its data claims', async () => {
  const n = node({ balance: AVAX(60), call: '0x' });
  const f = await chainFacts(tx(PLAIN), n);
  assert.equal(f.contract, false);
  const w = withChainFacts(matched, f, swapIntent, {});
  assert.equal(w.outcome, 'mismatch');
  assert.equal(w.line, 'Tu as écrit un échange. La demande appelle une adresse qui n’est pas un contrat : tes 50 AVAX partent et rien ne peut revenir.');
  // a plain payment to a plain address is not judged by this rule
  const pay = withChainFacts({ outcome: 'match', line: 'La demande envoie 50 AVAX.' }, f, { clear: true, kind: 'pay_someone', facts: {}, text: 'x' }, {});
  assert.equal(pay.outcome, 'match');
  // and nothing was compared : the facts alone never make an answer
  assert.equal(withChainFacts(null, Object.assign({}, f, { contract: true }), swapIntent, {}), null);
});

test('a call that reverts on the node is said', async () => {
  const n = node({ code: { [ROUTER.toLowerCase()]: '0x6080' }, balance: AVAX(60), call: { message: 'execution reverted: INSUFFICIENT_OUTPUT_AMOUNT' } });
  const f = await chainFacts(tx(ROUTER), n);
  assert.equal(f.runs, false); assert.match(f.why, /INSUFFICIENT_OUTPUT_AMOUNT/);
  assert.match(withChainFacts(matched, f, swapIntent, {}).line, /Rejouée sur le réseau, cette demande échoue\.$/);
});

test('the node does not answer (too many requests, network down, slow) : nothing is said, the answer is unchanged', async () => {
  for (const n of [node({ status: 429 }), node({ fail: 'network down' })]) {
    const f = await chainFacts(tx(ROUTER), n);
    assert.equal(f, null);
    assert.equal(withChainFacts(matched, f, swapIntent, {}), matched);
  }
  const slow = { fetchImpl: (url, init) => new Promise((res, rej) => { init.signal.addEventListener('abort', () => rej(new Error('aborted'))); }) };
  assert.equal(await chainFacts(tx(ROUTER), Object.assign({ timeoutMs: 30 }, slow)), null);
});

test('a plain send has no data : the call is not replayed', async () => {
  const n = node({ balance: AVAX(1) });
  const f = await chainFacts(tx(PLAIN, { data: '0x' }), n);
  assert.equal(f.runs, null); assert.equal(f.hasData, false); assert.equal(f.enough, false);
  assert.deepEqual(n.seen.map((s) => s.method).sort(), ['eth_getBalance', 'eth_getCode']);
});

test('amounts are written as a person reads them', () => {
  assert.equal(units('50000000000000000000'), '50');
  assert.equal(units('1234560000000000000'), '1,2345');
  assert.equal(units('5000000000000000000000'), '5 000');
  assert.equal(units('0'), '0');
  assert.equal(units('x'), '');
});

test('the public name of a contract comes from the list, on its own network only', () => {
  assert.equal(knownService(ROUTER, 43114), 'Pangolin');
  assert.equal(knownService(ROUTER, 1), null);
  assert.equal(knownService(PLAIN, 43114), null);
});

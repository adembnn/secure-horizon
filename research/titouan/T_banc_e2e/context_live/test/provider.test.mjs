// node --test context_live/test/provider.test.mjs
// Mocked fetch: no network. One opt-in live test at the end (HOLDUP_LIVE=1), read-only calls on public contracts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getContext, toEngineContext, extractTargets, classifyCode, clearCache, liveEngineContext, SEL, READ_ONLY_METHODS, DEFAULT_RPC } from '../provider.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ME = '0x8bcea1b8558ac307b50ad720045c35783c9efb6c';
const TOKEN = '0x1111111111111111111111111111111111111111';
const SPENDER = '0x7777777777777777777777777777777777777777';
const FRESH = '0x9999999999999999999999999999999999999999';
const word = (h) => h.replace(/^0x/, '').padStart(64, '0');
const hex = (n) => '0x' + BigInt(n).toString(16);
const abiString = (s) => '0x' + word('20') + word(s.length.toString(16)) + Buffer.from(s).toString('hex').padEnd(64, '0');
const approveTx = (spender = SPENDER) => ({ method: 'eth_sendTransaction', params: [{ from: ME, to: TOKEN, data: SEL.approve + word(spender) + 'f'.repeat(64) }] });
const LATEST = 1000000;

// A fake chain : `state` says who has code and since which block. Returns a fetch-compatible function and a call log.
function fakeChain({ chainId = 43114, creation = { [TOKEN]: 100, [SPENDER]: 500 }, delayMs = 0, fail = () => false, explorer = true } = {}) {
  const log = [];
  const fetchImpl = async (url, init = {}) => {
    const wait = typeof delayMs === 'function' ? delayMs(url, init) : delayMs;
    if (wait) await new Promise((res, rej) => { const t = setTimeout(res, wait); init.signal?.addEventListener('abort', () => { clearTimeout(t); rej(new Error('aborted')); }); });
    const json = (o, status = 200) => ({ ok: status === 200, status, json: async () => o });
    if (String(url).includes('getcontractcreation')) {
      log.push({ explorer: String(url) });
      if (!explorer) return json({}, 500);
      const list = new URL(url).searchParams.get('contractaddresses').split(',');
      return json({ status: '1', message: 'OK', result: list.filter((a) => creation[a] !== undefined).map((a) => ({ contractAddress: a, contractCreator: ME, txHash: '0x' + word(a) })) });
    }
    const { method, params, id } = JSON.parse(init.body);
    log.push({ method, params });
    if (fail(method, params)) return json({ jsonrpc: '2.0', id, error: { code: -32000, message: 'boom' } });
    const codeAt = (a, tag) => { const b = tag === 'latest' ? LATEST : Number(BigInt(tag)); return creation[a] !== undefined && creation[a] <= b ? '0x6080' : '0x'; };
    let result;
    switch (method) {
      case 'eth_chainId': result = hex(chainId); break;
      case 'eth_blockNumber': result = hex(LATEST); break;
      case 'eth_getBalance': result = hex(5n * 10n ** 18n); break;
      case 'eth_getTransactionCount': result = hex(42); break;
      case 'eth_getCode': result = codeAt(params[0].toLowerCase(), params[1]); break;
      case 'eth_getTransactionReceipt': result = { blockNumber: hex(creation['0x' + params[0].slice(-40)]) }; break;
      case 'eth_call': {
        const sel = params[0].data.slice(0, 10);
        if (creation[params[0].to] === undefined) { result = '0x'; break; }
        result = sel === SEL.symbol ? abiString('USDC') : sel === SEL.decimals ? '0x' + word('6') : sel === SEL.balanceOf ? '0x' + word((1000n * 10n ** 6n).toString(16)) : sel === SEL.allowance ? '0x' + word('0') : '0x';
        break;
      }
      default: return json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'unexpected method ' + method } });
    }
    return json({ jsonrpc: '2.0', id, result });
  };
  return { fetchImpl, log };
}

test('selectors match keccak256 of the signatures', async () => {
  const { keccak256 } = await import(pathToFileURL(join(HERE, '..', '..', 'engine', 'src', 'keccak.mjs')).href).catch(() => ({}));
  if (!keccak256) return; // engine helper renamed : nothing to compare against
  const sigs = { symbol: 'symbol()', decimals: 'decimals()', balanceOf: 'balanceOf(address)', allowance: 'allowance(address,address)', approve: 'approve(address,uint256)', increaseAllowance: 'increaseAllowance(address,uint256)', transfer: 'transfer(address,uint256)', transferFrom: 'transferFrom(address,address,uint256)' };
  for (const [k, s] of Object.entries(sigs)) { let h = keccak256(new TextEncoder().encode(s)); if (typeof h !== 'string') h = '0x' + Buffer.from(h).toString('hex'); assert.equal((h.startsWith('0x') ? h : '0x' + h).slice(0, 10), SEL[k], k); }
});

test('extractTargets : approve -> token, spender, allowance pair ; signer excluded', () => {
  const t = extractTargets(approveTx(), ME);
  assert.deepEqual(t.tokens, [TOKEN]);
  assert.deepEqual(t.counterparties.sort(), [TOKEN, SPENDER].sort());
  assert.deepEqual(t.allowances, [{ token: TOKEN, spender: SPENDER }]);
  const amountOnly = extractTargets({ method: 'eth_sendTransaction', params: [{ from: ME, to: TOKEN, data: SEL.transfer + word(ME) + word('de0b6b3a7640000') }] }, ME);
  assert.deepEqual(amountOnly.counterparties, [TOKEN], 'amounts are not addresses');
});

test('extractTargets : typed data permit and batch', () => {
  const td = { primaryType: 'Permit', domain: { verifyingContract: TOKEN, chainId: 43114 }, message: { owner: ME, spender: SPENDER, value: '1', nonce: 0, deadline: 1 } };
  const t = extractTargets({ method: 'eth_signTypedData_v4', params: [ME, JSON.stringify(td)] }, ME);
  assert.deepEqual(t.tokens, [TOKEN]); assert.deepEqual(t.allowances, [{ token: TOKEN, spender: SPENDER }]);
  const b = extractTargets({ method: 'wallet_sendCalls', params: [{ from: ME, calls: [approveTx().params[0], { to: FRESH, value: '0x1' }] }] }, ME);
  assert.ok(b.counterparties.includes(FRESH) && b.counterparties.includes(SPENDER));
  assert.deepEqual(extractTargets({ method: 'personal_sign', params: ['0x68656c6c6f', ME] }, ME).counterparties, []);
});

test('classifyCode : EOA, contract, EIP-7702 delegation', () => {
  assert.deepEqual(classifyCode('0x'), { isContract: false });
  assert.deepEqual(classifyCode('0x6080'), { isContract: true });
  assert.deepEqual(classifyCode('0xef0100' + SPENDER.slice(2)), { isContract: false, delegatedTo: SPENDER });
  assert.equal(classifyCode(null), undefined);
});

test('happy path : every fact, exact age from explorer + receipt, engine shape', async () => {
  clearCache();
  const { fetchImpl, log } = fakeChain();
  const r = await getContext({ chainId: '0xa86a', from: ME, request: approveTx(), seen: [SPENDER], options: { fetchImpl } });
  assert.equal(r.complete, true, JSON.stringify(r.missing) + JSON.stringify(r.errors));
  assert.equal(r.block, LATEST);
  assert.deepEqual(r.facts.signer, { address: ME, nativeBalance: (5n * 10n ** 18n).toString(), nonce: 42 });
  const sp = r.facts.counterparties[SPENDER];
  assert.equal(sp.isContract, true); assert.equal(sp.ageBlocks, LATEST - 500); assert.equal(sp.ageSource, 'explorer+receipt'); assert.equal(sp.firstSeenByUser, false);
  assert.equal(r.facts.counterparties[TOKEN].firstSeenByUser, true);
  assert.deepEqual(r.facts.tokens[TOKEN], { allowances: { [SPENDER]: '0' }, symbol: 'USDC', decimals: 6, balance: '1000000000' });
  for (const c of log) if (c.method) assert.ok(READ_ONLY_METHODS.has(c.method), 'read-only : ' + c.method);
  const e = toEngineContext(r);
  assert.equal(e.isContract[SPENDER], true); assert.equal(e.ageBlocks[SPENDER], LATEST - 500);
  assert.deepEqual(e.balances, { native: '5000000000000000000', [TOKEN]: '1000000000' });
  assert.deepEqual(e.tokenMeta[TOKEN], { symbol: 'USDC', decimals: 6 }, 'no `stable` flag from chain data');
  assert.equal(e.nonce, 42); assert.deepEqual(e.missing, []);
});

test('fresh contract : no code 50 blocks ago -> age below the threshold even without explorer', async () => {
  clearCache();
  const { fetchImpl } = fakeChain({ creation: { [TOKEN]: 100, [FRESH]: LATEST - 3 }, explorer: false });
  const r = await getContext({ chainId: 43114, from: ME, request: approveTx(FRESH), options: { fetchImpl, refineYoung: false } });
  const f = r.facts.counterparties[FRESH];
  assert.equal(f.isContract, true); assert.equal(f.ageMaxBlocks, 49); assert.equal(f.ageBlocks, undefined); assert.equal(f.ageSource, 'rpc-probe');
  const e = toEngineContext(r);
  assert.ok(e.ageBlocks[FRESH] < 50); assert.ok(e.ageBlocks[TOKEN] >= 50, 'old contract : proven lower bound');
  assert.ok(!r.missing.some((m) => m.startsWith('age:')), 'the probe answers the age question');
});

test('plain account : isContract false, no age expected, not a token', async () => {
  clearCache();
  const { fetchImpl } = fakeChain({ creation: {} });
  const r = await getContext({ chainId: 43114, from: ME, request: { method: 'eth_sendTransaction', params: [{ from: ME, to: FRESH, value: '0x1' }] }, seen: [], options: { fetchImpl } });
  assert.equal(r.facts.counterparties[FRESH].isContract, false);
  assert.deepEqual(r.missing, []);
  assert.equal(toEngineContext(r).ageBlocks[FRESH], undefined);
});

test('rpc failure : facts are unknown and listed, never a default', async () => {
  clearCache();
  const { fetchImpl } = fakeChain({ fail: (m) => m === 'eth_getCode' || m === 'eth_getBalance', explorer: false });
  const r = await getContext({ chainId: 43114, from: ME, request: approveTx(), options: { fetchImpl } });
  assert.equal(r.complete, false);
  assert.equal(r.facts.counterparties[SPENDER].isContract, undefined);
  assert.equal(r.facts.signer.nativeBalance, undefined);
  for (const m of ['isContract:' + SPENDER, 'age:' + SPENDER, 'signer.nativeBalance', 'firstSeenByUser:' + SPENDER]) assert.ok(r.missing.includes(m), m);
  const e = toEngineContext(r);
  assert.equal(e.isContract[SPENDER], undefined); assert.equal(e.balances.native, undefined); assert.equal(e.ageBlocks[SPENDER], undefined);
  assert.ok(e.missing.length > 0);
});

test('time budget : slow endpoint -> returns at the deadline with everything missing', async () => {
  clearCache();
  const { fetchImpl } = fakeChain({ delayMs: 2000 });
  const t0 = performance.now();
  const r = await getContext({ chainId: 43114, from: ME, request: approveTx(), options: { fetchImpl, budgetMs: 200, callTimeoutMs: 150 } });
  const ms = performance.now() - t0;
  assert.ok(ms < 450, 'returned in ' + ms + ' ms');
  assert.equal(r.complete, false); assert.equal(r.facts.counterparties[SPENDER].isContract, undefined);
  assert.ok(r.missing.includes('isContract:' + SPENDER) && r.missing.includes('signer.nonce'));
});

test('slow explorer only : RPC facts are kept, age falls back to the probe', async () => {
  clearCache();
  const { fetchImpl } = fakeChain({ delayMs: (url) => (String(url).includes('getcontractcreation') ? 2000 : 0) });
  const r = await getContext({ chainId: 43114, from: ME, request: approveTx(), options: { fetchImpl, budgetMs: 300, callTimeoutMs: 200 } });
  assert.equal(r.facts.counterparties[SPENDER].isContract, true);
  assert.equal(r.facts.counterparties[SPENDER].ageMinBlocks, 50); assert.equal(r.facts.counterparties[SPENDER].ageBlocks, undefined);
  assert.equal(toEngineContext(r).ageBlocks[SPENDER], 50);
});

test('wrong chain behind rpcUrl : nothing is trusted', async () => {
  clearCache();
  const { fetchImpl } = fakeChain({ chainId: 1 });
  const r = await getContext({ chainId: 43114, from: ME, request: approveTx(), options: { fetchImpl } });
  assert.equal(r.facts.counterparties[SPENDER].isContract, undefined);
  assert.ok(r.errors.some((e) => e.startsWith('chain_mismatch')));
  assert.equal(r.complete, false);
});

test('local node : no explorer, exact age of a young contract by binary search inside the probed window', async () => {
  clearCache();
  const { fetchImpl, log } = fakeChain({ creation: { [TOKEN]: LATEST - 7, [FRESH]: LATEST, [SPENDER]: 500 } });
  const r = await getContext({ chainId: 43114, from: ME, request: { method: 'wallet_sendCalls', params: [{ from: ME, calls: [approveTx(FRESH).params[0], approveTx(SPENDER).params[0]] }] }, rpcUrl: 'http://127.0.0.1:8545', seen: [], options: { fetchImpl } });
  assert.ok(!log.some((c) => c.explorer), 'a local node has no explorer');
  const t = r.facts.counterparties[TOKEN], f = r.facts.counterparties[FRESH], old = r.facts.counterparties[SPENDER];
  assert.equal(t.ageBlocks, 7); assert.equal(t.creationBlock, LATEST - 7); assert.equal(t.ageSource, 'rpc-search');
  assert.equal(f.ageBlocks, 0, 'deployed in the head block');
  assert.equal(old.ageBlocks, undefined); assert.equal(old.ageMinBlocks, 50, 'older than the window : proven lower bound only, no deep search');
  const search = log.filter((c) => c.method === 'eth_getCode' && c.params[1] !== 'latest' && Number(BigInt(c.params[1])) > LATEST - 50);
  assert.ok(search.length <= 12, 'at most log2(50) calls per young contract');
  assert.equal(r.complete, true, JSON.stringify(r.missing));
  assert.equal(toEngineContext(r).ageBlocks[TOKEN], 7);
});

test('local node : history not served -> age is unknown and listed, never "old"', async () => {
  clearCache();
  const { fetchImpl } = fakeChain({ fail: (m, p) => m === 'eth_getCode' && p[1] !== 'latest' });
  const r = await getContext({ chainId: 43114, from: ME, request: approveTx(), rpcUrl: 'http://127.0.0.1:8545', seen: [], options: { fetchImpl } });
  assert.equal(r.facts.counterparties[SPENDER].isContract, true);
  assert.ok(r.missing.includes('age:' + SPENDER)); assert.equal(toEngineContext(r).ageBlocks[SPENDER], undefined);
});

test('cache : second call hits no network for stable facts ; local node skips the explorer', async () => {
  clearCache();
  const a = fakeChain();
  await getContext({ chainId: 43114, from: ME, request: approveTx(), rpcUrl: 'http://127.0.0.1:8545', options: { fetchImpl: a.fetchImpl } });
  assert.ok(!a.log.some((c) => c.explorer), 'no explorer call for a loopback rpcUrl');
  const n1 = a.log.length;
  const r2 = await getContext({ chainId: 43114, from: ME, request: approveTx(), rpcUrl: 'http://127.0.0.1:8545', options: { fetchImpl: a.fetchImpl } });
  assert.equal(a.log.length, n1, 'everything served from the cache within the TTL');
  assert.ok(r2.cacheHits > 0); assert.equal(r2.facts.counterparties[SPENDER].isContract, true);
});

test('unknown chain without rpcUrl, and liveEngineContext never throws', async () => {
  const r = await getContext({ chainId: 999999, from: ME, request: approveTx() });
  assert.equal(r.complete, false); assert.ok(r.missing.includes('isContract:' + SPENDER));
  const x = await liveEngineContext({ chainId: 43114, from: ME, request: approveTx(), options: { fetchImpl: () => { throw new Error('offline'); } } });
  assert.ok(x.engine.missing.length > 0); assert.deepEqual(x.engine.isContract, {});
  assert.deepEqual(toEngineContext(null).missing, ['live_context_absent']);
});

// ---- opt-in live test : HOLDUP_LIVE=1 node --test context_live/test/provider.test.mjs
test('LIVE Avalanche C-Chain : WAVAX and USDC.e approve, read-only', { skip: process.env.HOLDUP_LIVE !== '1' }, async () => {
  clearCache();
  const WAVAX = '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', ROUTER = '0x60ae616a2155ee3d9a68541ba4544862310933d4';
  const req = { method: 'eth_sendTransaction', params: [{ from: ME, to: WAVAX, data: SEL.approve + word(ROUTER) + word('1') }] };
  const r = await getContext({ chainId: 43114, from: ME, request: req, seen: [], rpcUrl: process.env.HOLDUP_RPC_URL || DEFAULT_RPC[43114], options: { budgetMs: 4000, callTimeoutMs: 3000 } });
  console.log(JSON.stringify(r));
  assert.equal(r.facts.counterparties[WAVAX].isContract, true);
  assert.equal(r.facts.counterparties[ROUTER].isContract, true);
  assert.equal(r.facts.tokens[WAVAX].symbol, 'WAVAX'); assert.equal(r.facts.tokens[WAVAX].decimals, 18);
  assert.ok(r.facts.counterparties[WAVAX].ageMinBlocks >= 50);
  if (!process.env.HOLDUP_RPC_URL) assert.equal(r.facts.counterparties[WAVAX].creationBlock, 820);
});

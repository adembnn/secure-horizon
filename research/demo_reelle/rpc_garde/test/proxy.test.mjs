// Hold up - RPC guard : end-to-end tests against a THROWAWAY local Hardhat node (plain chain, chainId 31337) started and stopped here.
// Run : node --test research/demo_reelle/rpc_garde/test/        (port of the throwaway node : HOLDUP_TEST_CHAIN_PORT, default 8547)
// Nothing here ever talks to a public chain. Transactions are signed with Hardhat's public test accounts.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import http from 'node:http';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createGuard } from '../proxy.mjs';
import { BANC } from '../rawtx.mjs';
import { BLOCKCHAIN, ethers, testWallet, lookalike, rpc, call, signTx, balanceOf, allowance, ERC20, assertLocalNode } from '../demo_lib.mjs';

const S = await import(pathToFileURL(join(BANC, 'server', 'server.mjs')).href);
const CHAIN_PORT = Number(process.env.HOLDUP_TEST_CHAIN_PORT || 8547);
const NODE = `http://127.0.0.1:${CHAIN_PORT}`;
const req = createRequire(join(BLOCKCHAIN, 'package.json'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const deployer = testWallet(0), victim = testWallet(5), paul = testWallet(2).address, stranger = testWallet(9).address;
const fake = lookalike(paul);
const local = { contacts: [{ address: paul.toLowerCase(), label: 'Paul' }], history: [{ address: paul.toLowerCase(), direction: 'sortie', amount: '50', minutes_ago: 20160 }], protected: [], knownSpenders: [] };
const WAIT_DANGER_S = 1.5;
let node, guard, usdc, tmp, chainId;

const send = (url, raw, id = 1) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id, method: 'eth_sendRawTransaction', params: [raw] }) }).then((r) => r.json());
const transfer = (to, units) => ({ to: usdc, data: ERC20.encodeFunctionData('transfer', [to, units]) });
const sign = (tx) => signTx(NODE, victim, tx, chainId);
const nonceOf = async (a) => Number(BigInt(await call(NODE, 'eth_getTransactionCount', [a, 'latest'])));
const post = (url, body, headers = { 'content-type': 'application/json' }) => fetch(url, { method: 'POST', headers, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json() }));
const holdOf = (j) => j.error.data.holdup;
const tokenOf = (j) => new URL(holdOf(j).url).searchParams.get('t');

before(async () => {
  assert.equal(await rpc(NODE, 'eth_chainId').catch(() => null), null, `port ${CHAIN_PORT} is already in use : the tests need their own throwaway node`);
  node = spawn(process.execPath, [req.resolve('hardhat/internal/cli/bootstrap'), 'node', '--hostname', '127.0.0.1', '--port', String(CHAIN_PORT)],
    { cwd: BLOCKCHAIN, env: { ...process.env, HOLDUP_CHAIN_MODE: 'plain', HOLDUP_CHAIN_ID: '' }, stdio: 'ignore' });
  for (let i = 0; i < 120; i++) { if (await rpc(NODE, 'eth_chainId').catch(() => null)) break; await sleep(250); }
  chainId = await assertLocalNode(NODE);
  assert.equal(chainId, 31337);
  // DemoUSDC from the compiled artifact (the shared addresses file is NOT touched), 2 480 units minted to the victim
  const art = JSON.parse(readFileSync(join(BLOCKCHAIN, 'artifacts', 'contracts', 'demo', 'DemoUSDC.sol', 'DemoUSDC.json'), 'utf8'));
  const provider = new ethers.JsonRpcProvider(NODE, chainId, { staticNetwork: true });
  const n = Number(BigInt(await call(NODE, 'eth_getTransactionCount', [deployer.address, 'latest']))); // explicit nonces : ethers caches the count
  const c = await new ethers.ContractFactory(art.abi, art.bytecode, deployer.connect(provider)).deploy({ nonce: n });
  await c.waitForDeployment();
  usdc = (await c.getAddress()).toLowerCase();
  await (await c.mint(victim.address, 2480n * 10n ** 6n, { nonce: n + 1 })).wait();
  provider.destroy();
  tmp = mkdtempSync(join(tmpdir(), 'holdup-rpc-'));
  guard = await createGuard({ port: 0, upstream: NODE, local, addressesFile: null, journalFile: join(tmp, 'decisions.jsonl'), wait: { danger: WAIT_DANGER_S, attention: 0, unknown: 0 } });
});
after(async () => {
  if (guard) await guard.close();
  if (node) node.kill();
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

test('reads are forwarded unchanged : result, id, upstream error', async () => {
  for (const body of [{ jsonrpc: '2.0', id: 'abc', method: 'eth_chainId', params: [] }, { jsonrpc: '2.0', id: 42, method: 'eth_methodThatDoesNotExist', params: [] },
    { jsonrpc: '2.0', id: 7, method: 'eth_getBalance', params: [victim.address, 'latest'] }]) {
    const opt = { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
    const [a, b] = await Promise.all([fetch(guard.url, opt).then((r) => r.text()), fetch(NODE, opt).then((r) => r.text())]);
    assert.equal(a, b);
  }
  assert.equal((await rpc(guard.url, 'eth_chainId')).result, '0x7a69');
  const bad = await fetch(guard.url, { method: 'POST', body: '{not json' }).then((r) => r.json());
  assert.equal(bad.error.code, -32700);
});

test('a batch of reads is forwarded as one batch, answers unchanged', async () => {
  const batch = [{ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }, { jsonrpc: '2.0', id: 'two', method: 'net_version', params: [] }, { jsonrpc: '2.0', id: 3, method: 'eth_nope', params: [] }];
  const opt = { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(batch) };
  const [a, b] = await Promise.all([fetch(guard.url, opt).then((r) => r.json()), fetch(NODE, opt).then((r) => r.json())]);
  assert.deepEqual(a, b);
  assert.equal(a.length, 3);
  assert.equal(a.find((x) => x.id === 'two').result, '31337');
});

test('a plain transfer to a known contact passes and is mined', async () => {
  const before = await balanceOf(NODE, usdc, paul), held = guard.stats.held;
  const raw = await sign(transfer(paul, 25_000_000n));
  const j = await send(guard.url, raw, 'w1');
  assert.equal(j.id, 'w1');
  assert.equal(j.result, ethers.keccak256(raw));
  assert.equal(await balanceOf(NODE, usdc, paul), before + 25_000_000n);
  assert.equal(guard.stats.held, held);
});

test('a transfer to a lookalike of the contact is held, the chain is untouched', async () => {
  assert.equal(fake.slice(0, 6), paul.toLowerCase().slice(0, 6)); assert.equal(fake.slice(-4), paul.toLowerCase().slice(-4)); assert.notEqual(fake, paul.toLowerCase());
  const n0 = await nonceOf(victim.address), b0 = await balanceOf(NODE, usdc, victim.address);
  const j = await send(guard.url, await sign(transfer(fake, 25_000_000n)), 9);
  assert.equal(j.id, 9); assert.equal(j.result, undefined);
  assert.equal(j.error.code, -32000);
  assert.match(j.error.message, /^Hold up a retenu cette opération\./);
  assert.match(j.error.message, /Rien n'est parti\. Pour décider, ouvre http:\/\/127\.0\.0\.1:\d+\/hold\/[0-9a-f]{16}\?t=[0-9a-f]{32}$/);
  assert.match(j.error.message, /25 DUSDC/); // amount and symbol come from the live facts read on the node
  assert.equal(holdOf(j).level, 'danger');
  assert.equal(await nonceOf(victim.address), n0); assert.equal(await balanceOf(NODE, usdc, victim.address), b0); assert.equal(await balanceOf(NODE, usdc, fake), 0n);
  const v = await fetch(`${guard.url}/holds/${holdOf(j).hold}?t=${tokenOf(j)}`).then((r) => r.json());
  assert.equal(v.status, 'pending'); assert.equal(v.verdict.fiche, 'F13');
  assert.equal(v.verdict.address_diff.actual, fake); assert.equal(v.verdict.address_diff.expected, paul.toLowerCase());
  assert.equal(v.deadline - v.created_at, WAIT_DANGER_S * 1000);
  assert.equal(JSON.stringify(v).includes('"raw"'), false);
  await post(`${guard.url}/holds/${v.id}/cancel`, { t: tokenOf(j) });
});

test('an unlimited approve to an unknown spender is held', async () => {
  const j = await send(guard.url, await sign({ to: usdc, data: ERC20.encodeFunctionData('approve', [stranger, ethers.MaxUint256]) }));
  assert.equal(j.error.code, -32000);
  assert.equal(holdOf(j).level, 'danger');
  assert.equal(await allowance(NODE, usdc, victim.address, stranger), 0n);
  const v = await fetch(`${guard.url}/holds/${holdOf(j).hold}?t=${tokenOf(j)}`).then((r) => r.json());
  assert.equal(v.verdict.fiche, 'F01');
  assert.match(v.verdict.texts.reel, /sans limite/);
  await post(`${guard.url}/holds/${v.id}/cancel`, { t: tokenOf(j) });
});

test('the same raw transaction sent again maps to the same hold, even when both copies arrive together', async () => {
  const raw = await sign(transfer(fake, 11_000_000n));
  const held = guard.stats.held;
  const [a, b] = await Promise.all([send(guard.url, raw), send(guard.url, raw)]);
  const c = await send(guard.url, raw);
  assert.equal(holdOf(a).hold, holdOf(b).hold); assert.equal(holdOf(a).hold, holdOf(c).hold);
  assert.equal(holdOf(a).url, holdOf(c).url);
  assert.equal(guard.stats.held, held + 1);
  await sleep(WAIT_DANGER_S * 1000 + 100); // after the deadline a re-send is still not relayed : only the decision page releases
  const d = await send(guard.url, raw);
  assert.equal(holdOf(d).hold, holdOf(a).hold);
  assert.equal(await balanceOf(NODE, usdc, fake), 0n);
  await post(`${guard.url}/holds/${holdOf(a).hold}/cancel`, { t: tokenOf(a) });
});

test('cancel leaves the chain untouched ; the same bytes afterwards open a new hold, never slip through', async () => {
  const n0 = await nonceOf(victim.address);
  const raw = await sign(transfer(fake, 12_000_000n));
  const j = await send(guard.url, raw);
  const id = holdOf(j).hold, t = tokenOf(j);
  const c = await post(`${guard.url}/holds/${id}/cancel`, { t });
  assert.equal(c.status, 200); assert.equal(c.body.status, 'cancelled');
  await sleep(WAIT_DANGER_S * 1000 + 100);
  const k = await post(`${guard.url}/holds/${id}/continue`, { t });
  assert.equal(k.status, 410);
  assert.equal(await nonceOf(victim.address), n0); assert.equal(await balanceOf(NODE, usdc, fake), 0n);
  const again = await send(guard.url, raw);
  assert.equal(again.error.code, -32000); assert.notEqual(holdOf(again).hold, id);
  assert.equal(await balanceOf(NODE, usdc, fake), 0n);
  await post(`${guard.url}/holds/${holdOf(again).hold}/cancel`, { t: tokenOf(again) });
});

test('continue is refused before the deadline, then broadcasts the stored transaction and balances change', async () => {
  const b0 = await balanceOf(NODE, usdc, victim.address);
  const raw = await sign(transfer(fake, 13_000_000n));
  const j = await send(guard.url, raw);
  const id = holdOf(j).hold, t = tokenOf(j);
  const early = await post(`${guard.url}/holds/${id}/continue`, { t });
  assert.equal(early.status, 409); assert.ok(early.body.remaining_ms > 0);
  assert.equal(await balanceOf(NODE, usdc, fake), 0n);
  await sleep(WAIT_DANGER_S * 1000 + 100);
  const ok = await post(`${guard.url}/holds/${id}/continue`, { t });
  assert.equal(ok.status, 200); assert.equal(ok.body.status, 'sent'); assert.equal(ok.body.sent_hash, ethers.keccak256(raw));
  assert.equal(await balanceOf(NODE, usdc, fake), 13_000_000n);
  assert.equal(await balanceOf(NODE, usdc, victim.address), b0 - 13_000_000n);
  const resent = await send(guard.url, raw, 'again'); // the wallet retries : it gets the hash, nothing is sent twice
  assert.equal(resent.result, ethers.keccak256(raw)); assert.equal(resent.id, 'again');
  assert.equal((await post(`${guard.url}/holds/${id}/continue`, { t })).status, 200);
  assert.equal(await balanceOf(NODE, usdc, fake), 13_000_000n);
});

test('a hold cannot be released without its token, from another origin, or through another host name', async () => {
  const j = await send(guard.url, await sign(transfer(fake, 14_000_000n)));
  const id = holdOf(j).hold, t = tokenOf(j);
  await sleep(WAIT_DANGER_S * 1000 + 100);
  const u = `${guard.url}/holds/${id}/continue`;
  assert.equal((await post(u, {})).status, 403);
  assert.equal((await post(u, { t: '0'.repeat(32) })).status, 403);
  assert.equal((await post(u, { t: t.slice(0, 31) })).status, 403);
  assert.equal((await post(u, { t }, { 'content-type': 'application/json', origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(u, { t }, { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' })).status, 403);
  assert.equal((await post(u, { t }, { 'content-type': 'text/plain' })).status, 415); // what a page can send without a preflight
  assert.equal((await fetch(u + '?t=' + t, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 403); // token only in the body
  assert.equal((await fetch(u, { method: 'OPTIONS', headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' } })).status, 403);
  // DNS rebinding : right port, wrong host name
  const viaHost = await new Promise((res, rej) => { const r = http.request({ host: '127.0.0.1', port: guard.port, path: `/holds/${id}/continue`, method: 'POST', headers: { host: 'evil.example:' + guard.port, 'content-type': 'application/json' } }, (x) => { x.resume(); res(x.statusCode); }); r.on('error', rej); r.end(JSON.stringify({ t })); });
  assert.equal(viaHost, 403);
  // the list and a hold are not readable by a foreign page, and no answer carries a CORS header
  assert.equal((await fetch(`${guard.url}/holds`, { headers: { origin: 'https://evil.example' } })).status, 403);
  assert.equal((await fetch(`${guard.url}/holds/${id}`)).status, 403);
  const rpcAns = await fetch(guard.url, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'text/plain' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }) });
  assert.equal(rpcAns.headers.get('access-control-allow-origin'), null);
  assert.equal(await balanceOf(NODE, usdc, fake), 13_000_000n); // nothing moved since the previous test
  const list = await fetch(`${guard.url}/holds`).then((r) => r.json());
  assert.equal(list.holds.find((h) => h.id === id).status, 'pending');
  assert.equal((await post(`${guard.url}/holds/${id}/cancel`, { t })).body.status, 'cancelled');
});

test('a malformed or unreadable raw transaction fails closed', async () => {
  const n0 = await nonceOf(victim.address), fwd = guard.stats.passed;
  const good = await sign(transfer(paul, 1_000_000n));
  const cases = ['0x', '0x1234', 'not hex', good.slice(0, -2), good + '00', '0x03' + good.slice(4), '0x7f' + good.slice(4), 12, null, { raw: good }];
  for (const p of cases) {
    const j = await fetch(guard.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'eth_sendRawTransaction', params: [p] }) }).then((r) => r.json());
    assert.equal(j.error.code, -32000, JSON.stringify(p)); assert.equal(j.result, undefined); assert.ok(j.error.data.holdup.refused); assert.equal(j.id, 5);
  }
  for (const body of [{ jsonrpc: '2.0', id: 5, method: 'eth_sendRawTransaction' }, { jsonrpc: '2.0', id: 5, method: 'eth_sendRawTransactionSync', params: [good] }]) {
    const j = await fetch(guard.url, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json());
    assert.equal(j.error.code, -32000);
  }
  // a pipeline that throws, or answers nonsense : refusal, never a relay
  for (const evaluate of [() => { throw new Error('boom'); }, () => null, () => ({ level: 'attention' })]) {
    const g = await createGuard({ port: 0, upstream: NODE, local, addressesFile: null, journalEnabled: false, evaluate });
    const j = await send(g.url, good);
    assert.equal(j.error.data.holdup.refused, 'internal'); assert.match(j.error.message, /Rien n'est parti/);
    await g.close();
  }
  // a transaction signed for another chain than the node's
  const other = await signTx(NODE, victim, transfer(paul, 1_000_000n), 43114);
  assert.equal((await send(guard.url, other)).error.data.holdup.refused, 'chain_mismatch');
  assert.equal(await nonceOf(victim.address), n0); assert.equal(guard.stats.passed, fwd);
});

test('a batch that carries a transaction : reads answered, the transaction judged, order kept', async () => {
  const raw = await sign(transfer(fake, 15_000_000n));
  const batch = [{ jsonrpc: '2.0', id: 'a', method: 'eth_chainId', params: [] }, { jsonrpc: '2.0', id: 'b', method: 'eth_sendRawTransaction', params: [raw] }, { jsonrpc: '2.0', id: 'c', method: 'eth_blockNumber', params: [] }];
  const out = await fetch(guard.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(batch) }).then((r) => r.json());
  assert.deepEqual(out.map((x) => x.id), ['a', 'b', 'c']);
  assert.equal(out[0].result, '0x7a69'); assert.equal(out[1].error.code, -32000); assert.match(out[2].result, /^0x/);
  assert.equal(await balanceOf(NODE, usdc, fake), 13_000_000n);
  // a method name hidden behind an escape or a duplicate key is still judged, or reaches the node exactly as we read it
  const esc = `{"jsonrpc":"2.0","id":1,"method":"eth_sendRawTr\\u0061nsaction","params":["${raw}"]}`;
  assert.equal((await fetch(guard.url, { method: 'POST', body: esc }).then((r) => r.json())).error.code, -32000);
  const dup = `{"jsonrpc":"2.0","id":1,"method":"eth_sendRawTransaction","params":[],"method":"eth_chainId"}`; // our parser keeps the last key : the node receives that reading only
  assert.equal((await fetch(guard.url, { method: 'POST', body: dup }).then((r) => r.json())).result, '0x7a69');
  const dup2 = `{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":["${raw}"],"method":"eth_sendRawTransaction"}`;
  assert.equal((await fetch(guard.url, { method: 'POST', body: dup2 }).then((r) => r.json())).error.code, -32000);
  assert.equal(await balanceOf(NODE, usdc, fake), 13_000_000n);
  await post(`${guard.url}/holds/${out[1].error.data.holdup.hold}/cancel`, { t: tokenOf(out[1]) });
});

test('the intent answer can raise the verdict and its wait, never lower them', async () => {
  const g = await createGuard({ port: 0, upstream: NODE, local, addressesFile: null, journalEnabled: false, askNewRecipient: true, wait: { danger: 30, attention: 0 } });
  // a transfer to an address never used : "information", no wait
  const j = await send(g.url, await sign(transfer(stranger, 5_000_000n)));
  const id = holdOf(j).hold, t = tokenOf(j);
  const v0 = await fetch(`${g.url}/holds/${id}?t=${t}`).then((r) => r.json());
  assert.equal(v0.verdict.niveau, 'info'); assert.equal(v0.deadline, v0.created_at);
  // "someone asked me to" : the product's comparison turns it into a danger, with the danger wait
  const up = await post(`${g.url}/holds/${id}/intent`, { t, intent: 'demande', intent_message: 'Le conseiller me demande de déplacer mes fonds.' });
  assert.equal(up.status, 200); assert.equal(up.body.verdict.level, 'danger'); assert.equal(up.body.intent, 'demande');
  assert.ok(up.body.deadline >= Date.now() + 28_000);
  assert.equal((await post(`${g.url}/holds/${id}/continue`, { t })).status, 409);
  // a second, reassuring answer does not bring the verdict or the deadline back down
  const down = await post(`${g.url}/holds/${id}/intent`, { t, intent: 'payer' });
  assert.equal(down.body.verdict.level, 'danger'); assert.equal(down.body.deadline, up.body.deadline);
  assert.equal((await post(`${g.url}/holds/${id}/intent`, { t, intent: 'nimporte' })).status, 400);
  assert.equal((await post(`${g.url}/holds/${id}/intent`, { t: 'x', intent: 'payer' })).status, 403);
  // a danger hold stays a danger whatever the answer
  const k = await send(g.url, await sign(transfer(fake, 16_000_000n)));
  const kept = await post(`${g.url}/holds/${holdOf(k).hold}/intent`, { t: tokenOf(k), intent: 'payer' });
  assert.equal(kept.body.verdict.level, 'danger'); assert.ok(kept.body.verdict.address_diff);
  await g.close();
});

test('holds expire : the transaction is dropped and can no longer be released', async () => {
  const g = await createGuard({ port: 0, upstream: NODE, local, addressesFile: null, journalEnabled: false, holdTtlMs: 300, wait: { danger: 0 } });
  const j = await send(g.url, await sign(transfer(fake, 17_000_000n)));
  await sleep(400);
  const r = await post(`${g.url}/holds/${holdOf(j).hold}/continue`, { t: tokenOf(j) });
  assert.equal(r.status, 410); assert.equal(r.body.hold.status, 'expired');
  assert.equal(await balanceOf(NODE, usdc, fake), 13_000_000n);
  await g.close();
});

test('upstream down : reads get an error, a transaction is refused, nothing crashes', async () => {
  const g = await createGuard({ port: 0, upstream: 'http://127.0.0.1:9', local, addressesFile: null, journalEnabled: false, forwardTimeoutMs: 1500, liveTimeoutMs: 300 });
  const r = await fetch(g.url, { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'eth_chainId', params: [] }) });
  assert.equal(r.status, 502); assert.equal((await r.json()).id, 3);
  const j = await send(g.url, await sign(transfer(paul, 1_000_000n)));
  assert.equal(j.error.code, -32000); assert.equal(j.result, undefined);
  await g.close();
});

test('pages are served with a closed policy, and the journal is one hash-chained line per decision', async () => {
  const page = await fetch(`${guard.url}/hold/${'0'.repeat(16)}`);
  assert.equal(page.status, 200); assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/); assert.equal(page.headers.get('x-frame-options'), 'DENY');
  assert.match(await page.text(), /\/ui\/verdict\.js/);
  assert.match(await fetch(guard.url + '/').then((r) => r.text()), /Hold up : demandes retenues/);
  for (const p of ['/ui/verdict.js', '/ui/verdict.css', '/decision.js', '/decision.css', '/holds.js']) assert.equal((await fetch(guard.url + p)).status, 200, p);
  assert.equal((await fetch(guard.url + '/../proxy.mjs')).status, 404);
  const check = S.verifyJournal(guard.journal.file);
  assert.equal(check.ok, true);
  const lines = readFileSync(guard.journal.file, 'utf8').trim().split('\n').map((l) => JSON.parse(l).entry);
  const count = (f) => lines.filter(f).length;
  assert.equal(count((e) => e.outcome === 'hold'), guard.stats.held);
  assert.equal(count((e) => e.decision === 'cancel'), guard.stats.cancelled);
  assert.equal(count((e) => e.decision === 'continue'), 1);
  assert.equal(count((e) => e.outcome === 'pass'), guard.stats.passed);
  assert.equal(JSON.stringify(lines).includes('"raw"'), false);
  assert.equal(lines.some((e) => JSON.stringify(e).match(/[0-9a-f]{32}"/) && e.token), false);
});

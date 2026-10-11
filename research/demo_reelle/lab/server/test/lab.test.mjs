// Hold up Lab - tests. Run: node --test research/demo_reelle/lab/server/test/
// Starts a throwaway lab (its own chain on 8570, guard on 8571, API on 8572) so that a lab already running on 8800 is not disturbed.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const juryFile = path.join(os.tmpdir(), `holdup-lab-jury-test-${process.pid}.jsonl`);
process.env.LAB_JURY_FILE = juryFile;
const { createLab } = await import('../lab.mjs');
const { CATALOGUE, available } = await import('../scenarios/index.mjs');
const { ABI, ethCall } = await import('../chain.mjs');

let lab, all;
const call = async (method, p, body, headers = {}) => {
  const r = await fetch(lab.url + p, { method, headers: { 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, headers: r.headers, json: await r.json().catch(() => null) };
};
const post = (p, body) => call('POST', p, body);

async function chainState() {
  const { ctx } = lab, { rpc, c, accounts: a } = ctx;
  const who = [a.victim, a.collector, a.attackerEoa, a.contact, a.own2, a.exchange, c.vault, c.drainer, c.router, c.shady];
  const out = { block: await rpc('eth_blockNumber'), nonce: await rpc('eth_getTransactionCount', [a.victim, 'latest']), owner: await ethCall(rpc, c.vault, ABI.vault, 'owner') };
  for (const w of who) {
    out['avax:' + w] = await rpc('eth_getBalance', [w, 'latest']);
    for (const t of Object.values(ctx.tokens)) out[t.symbol + ':' + w] = String(await ethCall(rpc, t.address, ABI.erc20, 'balanceOf', [w]));
    out['nft:' + w] = String(await ethCall(rpc, c.nft, ABI.nft, 'balanceOf', [w]));
    for (const t of Object.values(ctx.tokens)) out['allow:' + t.symbol + ':' + w] = String(await ethCall(rpc, t.address, ABI.erc20, 'allowance', [a.victim, w]));
    out['nfa:' + w] = String(await ethCall(rpc, c.nft, ABI.nft, 'isApprovedForAll', [a.victim, w]));
  }
  return out;
}

before(async () => {
  lab = await createLab({ port: 8572, chainPort: 8570, guardPort: 8571 });
}, { timeout: 240000 });
after(async () => {
  if (lab) await lab.close();
  fs.rmSync(juryFile, { force: true });
});

test('the catalogue loads, is balanced, and covers the four doors', () => {
  assert.ok(CATALOGUE.length >= 30, `only ${CATALOGUE.length} scenarios`);
  assert.equal(new Set(CATALOGUE.map((s) => s.id)).size, CATALOGUE.length, 'duplicate ids');
  const mal = CATALOGUE.filter((s) => s.label === 'malveillant').length, ben = CATALOGUE.filter((s) => s.label === 'benin').length;
  assert.equal(mal + ben, CATALOGUE.length);
  assert.ok(ben >= 12 && mal >= 12, `unbalanced: ${mal} attacks, ${ben} honest`);
  for (const door of ['site', 'wallet', 'walletconnect', 'exchange']) {
    const of = CATALOGUE.filter((s) => s.door === door);
    assert.ok(of.some((s) => s.label === 'malveillant') && of.some((s) => s.label === 'benin'), `door ${door} needs both labels`);
  }
  for (const s of CATALOGUE) {
    for (const f of ['id', 'door', 'family', 'label', 'title', 'story', 'staging', 'intent', 'editable', 'nist_csf', 'threat_refs', 'recipe']) assert.ok(s[f] !== undefined, `${s.id}: missing ${f}`);
    assert.equal(typeof s.build, 'function'); assert.equal(typeof s.truth, 'function'); assert.equal(typeof s.covered, 'boolean');
    if (!s.covered) assert.ok(s.coverageNote, `${s.id}: an uncovered scenario must say why`);
    if (s.staging.messageId) assert.ok(s.staging.messageText, `${s.id}: message text must come from the repo catalogues`);
  }
  assert.ok(CATALOGUE.some((s) => s.door === 'walletconnect' && s.family === 'permit' && s.covered === false), 'the WalletConnect permit blind spot must be in the catalogue');
});

test('every scenario builds a valid request', async () => {
  for (const s of CATALOGUE) {
    if (!available(lab.ctx, s).available) continue;
    const req = await s.build(lab.ctx);
    if (s.door === 'exchange') { assert.equal(req.kind, 'exchange_withdraw'); assert.match(req.address, /^0x[0-9a-fA-F]{40}$/); continue; }
    assert.equal(typeof req.method, 'string', s.id); assert.ok(Array.isArray(req.params) && req.params.length, s.id);
    if (s.door === 'wallet') assert.equal(req.method, 'eth_sendRawTransaction', s.id);
  }
}, { timeout: 180000 });

test('run-all: ground truth per family, honest cases lose nothing, and the chain is left as found', async () => {
  const st0 = await chainState();
  const r = await post('/api/run-all', { jury: false });
  assert.equal(r.status, 200);
  all = r.json;
  assert.deepEqual(await chainState(), st0, 'run-all changed the chain');
  assert.equal(all.summary.erreurs, 0, JSON.stringify(all.results.filter((x) => x.error)));
  assert.equal(all.summary.n, all.results.length);
  for (const x of all.results) assert.equal(x.request, undefined, 'run-all must not return requests');

  const mal = all.results.filter((x) => x.label === 'malveillant');
  for (const family of new Set(mal.map((x) => x.family))) {
    const works = mal.filter((x) => x.family === family && x.truth.attackWorks);
    if (family === 'blind_sign') { // a signature over calldata-shaped bytes moves nothing by itself: the lab must say so, not pretend
      assert.equal(works.length, 0); assert.ok(mal.filter((x) => x.family === family).every((x) => x.outcome === 'attaque inopérante'));
      continue;
    }
    assert.ok(works.length >= 1, `family ${family}: no attack shown to work on-chain`);
    const w = works[0];
    assert.ok(w.truth.lossUsd > 0 || w.truth.harm.assetsTaken || w.truth.harm.rightGranted || w.truth.harm.controlLost, `family ${family}: nothing taken`);
    assert.ok(w.truth.deltas.length || w.truth.approvals.length || w.truth.control.length);
  }
  for (const x of all.results.filter((y) => y.label === 'benin')) {
    assert.equal(x.truth.reverted, false, `${x.id}: the honest operation reverted (${x.truth.error})`);
    assert.equal(x.truth.attackWorks, false, `${x.id}: unexpected loss or right`);
    assert.equal(x.truth.lossUsd, 0, `${x.id}: unexpected loss`);
    assert.ok(['laissé passer à raison', 'fausse alerte', 'non couvert'].includes(x.outcome), `${x.id}: ${x.outcome}`);
  }
  const s = all.summary;
  assert.equal(s.arretes + s.rates + s.fausses_alertes + s.laisses_passer + s.non_couverts + s.inoperantes, s.n);
}, { timeout: 300000 });

test('same input, same output', async () => {
  const strip = (x) => JSON.parse(JSON.stringify(x, (k, v) => (k === 'ms' ? undefined : v)));
  for (const id of ['site-permit-unlimited', 'wallet-send-lookalike']) {
    const a = await post('/api/run', { id }), b = await post('/api/run', { id });
    assert.equal(a.status, 200);
    assert.deepEqual(strip(a.json), strip(b.json), id);
    assert.ok(a.json.request && a.json.truth.txs.length);
  }
}, { timeout: 120000 });

test('editable parameters change the request and the truth', async () => {
  const r = await post('/api/run', { id: 'site-pay-contact', params: { amount: '75' } });
  assert.equal(r.status, 200);
  assert.ok(r.json.truth.deltas.some((d) => d.holder === 'victime' && d.change === '-75'));
  const bad = await post('/api/run', { id: 'site-pay-contact', params: { amount: 'beaucoup' } });
  assert.equal(bad.status, 400); assert.equal(bad.json.error, true); assert.match(bad.json.message, /amount/);
  const unknown = await post('/api/run', { id: 'nope' });
  assert.equal(unknown.status, 404);
}, { timeout: 60000 });

test('custom: another chain id is rejected, a victim transaction is really executed, foreign input is validated', async () => {
  const { ctx } = lab;
  const data = ABI.erc20.encodeFunctionData('approve', [ctx.accounts.attackerEoa, 2n ** 256n - 1n]);
  const other = await post('/api/custom', { door: 'site', request: { method: 'eth_sendTransaction', params: [{ from: ctx.accounts.victim, to: ctx.c.usdc, data, value: '0x0', chainId: '0x1' }] } });
  assert.equal(other.status, 400); assert.equal(other.json.error, true); assert.match(other.json.message, /réseau/);
  const typedOther = await post('/api/custom', { door: 'site', request: { method: 'eth_signTypedData_v4', params: [ctx.accounts.victim, JSON.stringify({ types: { EIP712Domain: [] }, primaryType: 'X', domain: { chainId: 1 }, message: {} })] } });
  assert.equal(typedOther.status, 400);

  const ok = await post('/api/custom', { door: 'site', request: { method: 'eth_sendTransaction', params: [{ from: ctx.accounts.victim, to: ctx.c.usdc, data, value: '0x0' }] }, intent: { kind: 'connect_or_accept_offer' } });
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
  assert.equal(ok.json.truth.executed, true);
  assert.ok(ok.json.truth.approvals.some((a) => a.unlimited), 'the unlimited approval must show in the ground truth');
  assert.ok(ok.json.truth.lossUsd > 0, 'worst case: the right is used');
  assert.equal(ok.json.verdict.niveau, 'critical');

  const foreign = await post('/api/custom', { door: 'site', request: { method: 'eth_sendTransaction', params: [{ from: ctx.accounts.contact, to: ctx.c.usdc, data, value: '0x0' }] } });
  assert.equal(foreign.status, 200); assert.equal(foreign.json.truth, null); assert.ok(foreign.json.truthReason);
  for (const bad of [{ door: 'site', request: { method: 'eth_accounts', params: [] } }, { door: 'moon', request: {} }, { door: 'site', request: { method: 'eth_sendTransaction', params: [{ data: '0x00' }] } }, { door: 'site' }]) {
    const r = await post('/api/custom', bad);
    assert.equal(r.status, 400, JSON.stringify(bad)); assert.equal(typeof r.json.message, 'string');
  }
  const huge = await post('/api/custom', { door: 'site', request: { method: 'personal_sign', params: ['0x' + 'ab'.repeat(100000), ctx.accounts.victim] } });
  assert.equal(huge.status, 413);
}, { timeout: 120000 });

test('attack builder: builds, refuses targets outside the lab, runs through the same path, logs', async () => {
  const opt = await call('GET', '/api/attack/options');
  assert.equal(opt.status, 200); assert.ok(opt.json.goals.length >= 4 && opt.json.techniques.length >= 7 && opt.json.disguises.length >= 10 && opt.json.lure.messages.length >= 5);
  const built = await post('/api/attack/build', { goal: 'take_erc20', technique: 'approve', disguises: ['amount_balance', 'spender_eoa'], door: 'site', lure: { messageId: 'faux_airdrop-001' } });
  assert.equal(built.status, 200, JSON.stringify(built.json));
  assert.match(built.json.id, /^jury-/); assert.equal(built.json.label, 'malveillant'); assert.ok(built.json.staging.messageText);
  for (const bad of [
    { technique: 'approve', params: { spender: '0x000000000000000000000000000000000000dEaD' } },
    { technique: 'transfer', params: { recipient: '0x000000000000000000000000000000000000dEaD' } },
    { technique: 'approve', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', params: { chainId: 43114 } },
    { technique: 'approve', lure: { messageId: 'un message libre' } },
    { technique: 'permit', door: 'wallet' },
    { technique: 'approve', disguises: ['rename_primary_type'] },
    { goal: 'take_nfts', technique: 'approve' },
  ]) {
    const r = await post('/api/attack/build', bad);
    assert.equal(r.status, 400, JSON.stringify(bad)); assert.equal(typeof r.json.message, 'string');
  }
  const run = await post('/api/run', { scenario: built.json });
  assert.equal(run.status, 200, JSON.stringify(run.json));
  assert.equal(run.json.truth.attackWorks, true); assert.ok(run.json.truth.lossUsd > 0);
  // an approve wrapped in a multicall is made by the multicall contract, not by the victim: the chain shows it does nothing
  if (lab.ctx.c.multicall3) {
    const dud = await post('/api/attack/build', { technique: 'approve', disguises: ['batch_2'] });
    const r = await post('/api/run', { scenario: dud.json });
    assert.equal(r.json.truth.attackWorks, false); assert.equal(r.json.outcome, 'attaque inopérante');
  }
  const saved = await post('/api/attack/save', { scenario: built.json, author: 'test' });
  assert.equal(saved.status, 200, JSON.stringify(saved.json));
  const log = await call('GET', '/api/attack/log');
  const mine = log.json.find((a) => a.id === built.json.id);
  assert.ok(mine && mine.author === 'test' && mine.last && mine.last.outcome);
  const again = await post('/api/run-all', { door: null, family: 'no-such-family' });
  assert.equal(again.json.results.length, 0);
}, { timeout: 180000 });

test('HTTP: health, CORS limited to the lab UI, JSON errors in French', async () => {
  const h = await call('GET', '/api/health');
  assert.equal(h.status, 200);
  assert.equal(h.json.chain.chainId, lab.ctx.chainId); assert.match(h.json.chain.rpcUrl, /^http:\/\/127\.0\.0\.1:/);
  assert.ok(h.json.product.detectors >= 13 && h.json.outcomeRule.regles.length >= 6 && h.json.victim.address);
  const ui = await call('GET', '/api/scenarios', undefined, { origin: 'http://localhost:8801' });
  assert.equal(ui.headers.get('access-control-allow-origin'), 'http://localhost:8801');
  assert.ok(ui.json.length >= 30 && ui.json.every((s) => s.build === undefined && s.defaults));
  const evil = await call('GET', '/api/scenarios', undefined, { origin: 'https://evil.example' });
  assert.equal(evil.status, 403); assert.equal(evil.json.error, true);
  const nf = await call('GET', '/api/nope');
  assert.equal(nf.status, 404); assert.equal(typeof nf.json.message, 'string');
  const st0 = await chainState();
  const reset = await post('/api/reset', {});
  assert.equal(reset.status, 200); assert.match(reset.json.drainer, /^0x/);
  const st1 = await chainState();
  for (const k of Object.keys(st0)) if (k !== 'block') assert.equal(st1[k], st0[k], `reset changed ${k}`);
}, { timeout: 120000 });

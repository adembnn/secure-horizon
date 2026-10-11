// node --test research/demo_reelle/reponse/test/revoke.test.mjs      (needs the throwaway node, see chain.mjs)
// Counterfactual on a local chain : the victim grants, the helper detects, the victim revokes, the drain fails.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { RPC, rpc, send, nodeUp, deployDemo } from './chain.mjs';
import { ethers, scanGrants, buildRevocations, permitInvalidation, recoveryPlan, makeProvider } from '../revoke.mjs';

const up = await nodeUp();
const opt = { skip: up ? false : `no throwaway node on ${RPC}` };
const MAX = ethers.MaxUint256;
const T = new ethers.Interface([
  'function approve(address,uint256)', 'function setApprovalForAll(address,bool)', 'function mint(address) returns (uint256)',
  'function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)', 'function ownerOf(uint256) view returns (address)',
  'function sweepERC20(address,address)', 'function sweepNFT(address,address,uint256)', 'function drainWithPermit(address,address,uint256,uint256,uint8,bytes32,bytes32)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
]);
const enc = (fn, a) => T.encodeFunctionData(fn, a);
let provider, A, victim, attacker, other, tokenId, fromBlock;
const bal = async (who) => T.decodeFunctionResult('balanceOf', await provider.call({ to: A.usdc, data: enc('balanceOf', [who]) }))[0];
const snapshot = () => rpc('evm_snapshot'); const revert = (id) => rpc('evm_revert', [id]);

before(async () => {
  if (!up) return;
  provider = makeProvider(RPC);
  fromBlock = await provider.getBlockNumber();
  A = deployDemo().addresses;
  victim = A.victim; attacker = A.collector; other = (await rpc('eth_accounts'))[7];
  const rc = await send({ from: victim, to: A.nft, data: enc('mint', [victim]) });
  tokenId = BigInt(rc.logs[0].topics[3]);
});
after(() => { if (provider) provider.destroy(); });

test('nothing granted : nothing to revoke', opt, async () => {
  assert.deepEqual(await scanGrants(provider, victim, { fromBlock }), []);
});

test('grant, detect, revoke, verify (ERC-20 unlimited, whole NFT collection, one NFT)', opt, async (t) => {
  // grant : what the victim signed
  await send({ from: victim, to: A.usdc, data: enc('approve', [A.drainer, MAX]) });
  await send({ from: victim, to: A.nft, data: enc('setApprovalForAll', [A.drainer, true]) });
  await send({ from: victim, to: A.nft, data: enc('approve', [other, tokenId]) });
  await send({ from: victim, to: A.usdc, data: enc('approve', [other, 5n]) });
  await send({ from: victim, to: A.usdc, data: enc('approve', [other, 0n]) }); // already revoked by the victim : must not be listed

  // detect
  const grants = await scanGrants(provider, victim, { fromBlock });
  assert.deepEqual(grants.map((g) => g.kind).sort(), ['erc20', 'erc721_all', 'erc721_one']);
  const g20 = grants.find((g) => g.kind === 'erc20');
  assert.equal(g20.spender, A.drainer); assert.equal(g20.unlimited, true); assert.equal(g20.symbol, 'DUSDC');
  assert.equal((await scanGrants(provider, victim, { fromBlock, spender: A.drainer })).length, 2, 'scoped to the spender of the incident');
  assert.equal((await scanGrants(provider, victim, { fromBlock, chunk: 3 })).length, 3, 'chunked log reads give the same result');

  // counterfactual, then rolled back : without revocation the drain works
  const before = await bal(victim); assert.ok(before > 0n);
  const snap = await snapshot();
  await send({ from: attacker, to: A.drainer, data: enc('sweepERC20', [A.usdc, victim]) });
  assert.equal(await bal(victim), 0n, 'drained');
  await send({ from: attacker, to: A.drainer, data: enc('sweepNFT', [A.nft, victim, tokenId]) });
  await revert(snap);
  assert.equal(await bal(victim), before);

  // revoke : exactly the transactions built by the helper, signed by the victim's account
  const txs = buildRevocations(victim, grants);
  assert.equal(txs.length, 3);
  for (const x of txs) { assert.equal(x.from, victim); assert.equal(x.value, '0x0'); await send({ from: x.from, to: x.to, data: x.data, value: x.value }); }

  // verify
  assert.deepEqual(await scanGrants(provider, victim, { fromBlock }), []);
  await assert.rejects(send({ from: attacker, to: A.drainer, data: enc('sweepERC20', [A.usdc, victim]) }), 'sweep fails after revocation');
  await assert.rejects(send({ from: attacker, to: A.drainer, data: enc('sweepNFT', [A.nft, victim, tokenId]) }));
  assert.equal(await bal(victim), before, 'funds still there');
  t.diagnostic(`3 grants detected, 3 revocations sent, 0 grants left, balance ${before} kept`);
});

test('EIP-2612 : a signed permit is invisible on chain, spending the nonce kills it', opt, async (t) => {
  // the victim signs a permit for the drainer (off chain : no transaction, no event)
  const inv0 = await permitInvalidation(provider, A.usdc, victim);
  assert.equal(inv0.supported, true);
  const deadline = (await provider.getBlock('latest')).timestamp + 86400;
  const evil = structuredClone(inv0.typedData); Object.assign(evil.message, { spender: A.drainer, value: MAX.toString(), deadline: String(deadline) });
  const evilSig = ethers.Signature.from(await rpc('eth_signTypedData_v4', [victim, evil]));
  const drain = { from: attacker, to: A.drainer, data: enc('drainWithPermit', [A.usdc, victim, MAX, deadline, evilSig.v, evilSig.r, evilSig.s]) };
  assert.deepEqual(await scanGrants(provider, victim, { fromBlock, spender: A.drainer }), [], 'the scan cannot see an unsubmitted permit');

  // counterfactual, rolled back : the signature works
  const before = await bal(victim);
  const snap = await snapshot();
  await send(drain); assert.equal(await bal(victim), 0n);
  await revert(snap);

  // recovery : the victim signs the harmless permit built by the helper, the nonce is spent
  const inv = await permitInvalidation(provider, A.usdc, victim);
  assert.equal(inv.typedData.message.spender, victim); assert.equal(inv.typedData.message.value, '0');
  assert.equal(await inv.stillOpen(), true);
  const sig = await rpc('eth_signTypedData_v4', [victim, inv.typedData]);
  const tx = inv.buildTx(sig);
  await send({ from: tx.from, to: tx.to, data: tx.data });
  assert.equal(await inv.stillOpen(), false);
  await assert.rejects(send(drain), 'the attacker signature is now useless');
  assert.equal(await bal(victim), before);
  t.diagnostic(`nonce ${inv.nonce} spent, drainWithPermit reverts, balance ${before} kept`);
});

test('a token without permit, and the full plan as JSON', opt, async () => {
  assert.equal((await permitInvalidation(provider, A.nft, victim)).supported, false);
  const plan = await recoveryPlan(provider, victim, { fromBlock, permitToken: A.usdc });
  assert.equal(plan.transactions.length, 0); assert.equal(plan.permit.supported, true); assert.equal(plan.cannot_undo.length, 4);
  JSON.stringify(plan); // serialisable (no bigint, no function)
});

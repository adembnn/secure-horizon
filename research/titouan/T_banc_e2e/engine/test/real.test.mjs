// Cas RÉELS rejoués en lecture seule (eth_getLogs, eth_getTransactionByHash, eth_getTransactionReceipt, eth_getCode, eth_call).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { rpc, getCode, RPC, stats } from '../src/rpc.mjs';
import { analyzeTransaction, TOPICS } from '../src/engine.mjs';
import { domainSeparator, hashStruct } from '../src/eip712.mjs';
import { keccak256, selectorOf } from '../src/keccak.mjs';
import { ADDR, MULTISEND_OFFICIAL } from '../src/registry.mjs';
import { KNOWN_VERIFIERS } from '../src/typed.mjs';
import { allTypehashes } from '../src/typehashes.mjs';
import { call } from '../src/abi_encode.mjs';

const DATA = new URL('../../../bench/data/', import.meta.url);
const OUT = new URL('../out/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const T = { timeout: 180000 };
const out = { stats: {} };
const save = () => writeFileSync(new URL('real_results.json', OUT), JSON.stringify(out, null, 1));
const ethCall = (to, data, url = RPC.eth) => rpc(url, 'eth_call', [{ to, data }, 'latest']);
const isContract = async (url, a) => (await getCode(url, a)).length > 2;

// ---------- 1. constantes vérifiées contre les contrats déployés
test('Permit2 DOMAIN_SEPARATOR() on-chain Ethereum = calcul local', T, async () => {
  const onchain = await ethCall(ADDR.PERMIT2, selectorOf('DOMAIN_SEPARATOR()'));
  const local = domainSeparator({ name: 'Permit2', chainId: 1, verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3' });
  assert.equal(onchain, local); out.permit2_domain_eth = { onchain, local };
});
test('Permit2 présent et DOMAIN_SEPARATOR() = calcul local sur Avalanche C-Chain (43114)', T, async () => {
  const onchain = await ethCall(ADDR.PERMIT2, selectorOf('DOMAIN_SEPARATOR()'), RPC.avax);
  const local = domainSeparator({ name: 'Permit2', chainId: 43114, verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3' });
  assert.equal(onchain, local); out.permit2_domain_avax = { onchain, local };
});
test('USDC (Ethereum) DOMAIN_SEPARATOR() = {name:"USD Coin", version:"2"} calculé', T, async () => {
  const onchain = await ethCall(USDC, selectorOf('DOMAIN_SEPARATOR()'));
  assert.equal(onchain, domainSeparator({ name: 'USD Coin', version: '2', chainId: 1, verifyingContract: USDC }));
});
test('USDC PERMIT_TYPEHASH() on-chain = typehash EIP-2612 calculé', T, async () => {
  assert.equal(await ethCall(USDC, selectorOf('PERMIT_TYPEHASH()')), allTypehashes()['EIP-2612 Permit'].typeHash);
});
test('DAI DOMAIN_SEPARATOR() et PERMIT_TYPEHASH() on-chain = calcul local (DAI permit)', T, async () => {
  const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
  assert.equal(await ethCall(DAI, selectorOf('DOMAIN_SEPARATOR()')), domainSeparator({ name: 'Dai Stablecoin', version: '1', chainId: 1, verifyingContract: DAI }));
  assert.equal(await ethCall(DAI, selectorOf('PERMIT_TYPEHASH()')), allTypehashes()['DAI Permit'].typeHash);
});
test('CoW GPv2Settlement : domainSeparator() on-chain = calcul local', T, async () => {
  const vc = KNOWN_VERIFIERS.cow[0];
  assert.equal(await ethCall(vc, selectorOf('domainSeparator()')), domainSeparator({ name: 'Gnosis Protocol', version: 'v2', chainId: 1, verifyingContract: vc }));
});
test('Seaport 1.6 : getOrderHash(OrderComponents) on-chain = hashStruct local (tableaux imbriqués)', T, async () => {
  const f = (name, type) => ({ name, type });
  const OFFER = [f('itemType', 'uint8'), f('token', 'address'), f('identifierOrCriteria', 'uint256'), f('startAmount', 'uint256'), f('endAmount', 'uint256')];
  const types = { OrderComponents: [f('offerer', 'address'), f('zone', 'address'), f('offer', 'OfferItem[]'), f('consideration', 'ConsiderationItem[]'), f('orderType', 'uint8'), f('startTime', 'uint256'), f('endTime', 'uint256'), f('zoneHash', 'bytes32'), f('salt', 'uint256'), f('conduitKey', 'bytes32'), f('counter', 'uint256')], OfferItem: OFFER, ConsiderationItem: [...OFFER, f('recipient', 'address')] };
  const z = '0x' + '00'.repeat(32), a1 = '0x' + '11'.repeat(20), a2 = '0x' + '22'.repeat(20);
  const msg = { offerer: a1, zone: ADDR.ZERO, offer: [{ itemType: 2, token: a2, identifierOrCriteria: 7, startAmount: 1, endAmount: 1 }], consideration: [{ itemType: 0, token: ADDR.ZERO, identifierOrCriteria: 0, startAmount: 1000, endAmount: 900, recipient: a1 }, { itemType: 0, token: ADDR.ZERO, identifierOrCriteria: 0, startAmount: 25, endAmount: 25, recipient: a2 }], orderType: 0, startTime: 100, endTime: 200, zoneHash: z, salt: 99, conduitKey: z, counter: 5 };
  const sig = 'getOrderHash((address offerer,address zone,(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount)[] offer,(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount,address recipient)[] consideration,uint8 orderType,uint256 startTime,uint256 endTime,bytes32 zoneHash,uint256 salt,bytes32 conduitKey,uint256 counter) order)';
  const arg = [[msg.offerer, msg.zone, msg.offer.map((o) => [o.itemType, o.token, o.identifierOrCriteria, o.startAmount, o.endAmount]), msg.consideration.map((c) => [c.itemType, c.token, c.identifierOrCriteria, c.startAmount, c.endAmount, c.recipient]), msg.orderType, msg.startTime, msg.endTime, msg.zoneHash, msg.salt, msg.conduitKey, msg.counter]];
  const results = {};
  for (const addr of KNOWN_VERIFIERS.seaport) {
    try { results[addr] = await ethCall(addr, call(sig, arg)); } catch (e) { results[addr] = 'ERR ' + e.message.slice(0, 60); }
  }
  const local = hashStruct('OrderComponents', msg, types);
  out.seaport_getOrderHash = { local, results };
  assert.ok(Object.values(results).some((r) => r === local), 'aucun Seaport ne confirme le hash local: ' + JSON.stringify(results));
});
test('adresses de vérificateurs/MultiSend citées de mémoire : code présent sur Ethereum (sinon retirées du registre)', T, async () => {
  const addrs = [...Object.keys(MULTISEND_OFFICIAL), ...KNOWN_VERIFIERS.seaport, ...KNOWN_VERIFIERS.cow, ADDR.MULTICALL3, ADDR.PERMIT2];
  const res = {};
  for (const a of addrs) res[a] = await isContract(RPC.eth, a);
  out.known_addresses_have_code_on_ethereum = res;
  const missing = Object.entries(res).filter(([, v]) => !v).map(([k]) => k);
  out.known_addresses_missing = missing;
  assert.deepEqual(missing, []);
});
test('Multicall3 présent à l\'adresse canonique sur Avalanche C-Chain et Fuji', T, async () => {
  assert.ok(await isContract(RPC.avax, ADDR.MULTICALL3)); assert.ok(await isContract(RPC.fuji, ADDR.MULTICALL3));
});
test('topic0 de l\'événement Permit2 Approval recalculé = topic0 observé dans permit2_logs.json (4 logs réels)', T, () => {
  const logs = JSON.parse(readFileSync(new URL('permit2_logs.json', DATA)));
  assert.equal(logs.length >= 4, true);
  for (const l of logs) assert.equal(l.topic0, TOPICS.Permit2Approval);
});

// ---------- 2. l'approbation illimitée USDC du bloc 19 768 078
let C908;
test('bloc 19768078 : eth_getLogs trouve l\'Approval USDC illimité, tx et reçu', T, async () => {
  const blk = '0x' + (19768078).toString(16);
  const logs = await rpc(RPC.eth, 'eth_getLogs', [{ fromBlock: blk, toBlock: blk, address: USDC, topics: [TOPICS.Approval] }]);
  const max = logs.filter((l) => BigInt(l.data) >= 1n << 255n);
  assert.equal(max.length, 1);
  const tx = await rpc(RPC.eth, 'eth_getTransactionByHash', [max[0].transactionHash]);
  const receipt = await rpc(RPC.eth, 'eth_getTransactionReceipt', [max[0].transactionHash]);
  const block = await rpc(RPC.eth, 'eth_getBlockByNumber', [blk, false]);
  C908 = { tx, receipt, owner: '0x' + max[0].topics[1].slice(26), spender: '0x' + max[0].topics[2].slice(26), date: new Date(parseInt(block.timestamp, 16) * 1000).toISOString(), logsInBlock: logs.length };
  const transfers = receipt.logs.filter((l) => l.topics[0] === TOPICS.Transfer && l.address.toLowerCase() === USDC).map((l) => ({ from: '0x' + l.topics[1].slice(26), to: '0x' + l.topics[2].slice(26), usdc: Number(BigInt(l.data)) / 1e6 }));
  out.case_unlimited_usdc_block_19768078 = { hash: tx.hash, date: C908.date, txFrom: tx.from, txTo: tx.to, selector: tx.input.slice(0, 10), owner: C908.owner, spender: C908.spender, transfersInSameTx: transfers, ownerIsEOA: !(await isContract(RPC.eth, C908.owner)), spenderIsContract: await isContract(RPC.eth, C908.spender) };
  assert.equal(C908.date.slice(0, 10), '2024-04-30');
});
test('908k : vue de la victime sans reçu = appel opaque (sélecteur inconnu) mais indices embarqués détectés', T, async () => {
  const e = analyzeTransaction(C908.tx, { chainId: 1, from: C908.owner });
  out.case_unlimited_usdc_block_19768078.without_receipt = { opaque: e.opaque, level: e.level, approvals: e.approvals.length, embedded: e.embedded.map((x) => x.name + ':' + JSON.stringify(x.args)), flags: e.risk_flags.map((f) => f.code) };
  assert.equal(e.approvals.length, 0); assert.equal(e.opaque, true);
  assert.ok(e.embedded.some((x) => x.id === 'permit2612'), 'permit EIP-2612 embarqué non détecté');
  assert.equal(e.level, 'critical');
});
test('908k : avec le reçu (événements) : approbation illimitée USDC vers le spender réel, critical', T, async () => {
  const e = analyzeTransaction(C908.tx, { chainId: 1, from: C908.owner, codeOf: (a) => (a === C908.spender ? true : undefined) }, { receipt: C908.receipt });
  out.case_unlimited_usdc_block_19768078.with_receipt = { level: e.level, approvals: e.approvals, outgoing: e.outgoing.map((o) => ({ token: o.symbol, amount: o.amount, to: o.to })), flags: e.risk_flags.map((f) => f.code) };
  assert.equal(e.approvals.length, 1); assert.equal(e.approvals[0].amount, 'unlimited'); assert.equal(e.approvals[0].spender, C908.spender); assert.equal(e.approvals[0].token, USDC);
  assert.equal(e.level, 'critical'); assert.ok(e.risk_flags.some((f) => f.code === 'unlimited_allowance'));
  save();
});
test('908k : si l\'on se place du point de vue de l\'expéditeur de la tx (≠ victime), le droit n\'est pas le sien', T, async () => {
  const e = analyzeTransaction(C908.tx, { chainId: 1, from: C908.tx.from }, { receipt: C908.receipt });
  assert.equal(e.approvals.length, 0);
});

// ---------- 3. approbations d'attaque réelles (liste ScamSniffer, bench/data/attack_approval_logs.json)
import { isUnlimited } from '../src/util.mjs';
const attacks = JSON.parse(readFileSync(new URL('attack_approval_logs.json', DATA)));
const grants = attacks.filter((x) => BigInt(x.data) > 0n); // 151 vrais droits ; les 1 203 autres sont des Approval(.., 0)
const zeros = attacks.filter((x) => BigInt(x.data) === 0n);
const cls = (tx, x) => (tx.from === x.owner ? 'owner' : 'other') + '|' + (tx.to === x.token ? 'toToken' : 'toOther') + '|' + tx.input.slice(0, 10);
const classed = [];
for (const x of grants) { const tx = await rpc(RPC.eth, 'eth_getTransactionByHash', [x.tx]); classed.push({ x, tx, k: cls(tx, x) }); }
const classCounts = {}; for (const c of classed) classCounts[c.k] = (classCounts[c.k] || 0) + 1;
const A = classed.filter((c) => c.k === 'owner|toToken|0x095ea7b3');            // approve() direct signé par la victime
const B = classed.filter((c) => c.k.startsWith('owner|toOther'));                // la victime passe par un autre contrat
const Cc = classed.filter((c) => c.k === 'other|toToken|0x23b872dd');            // événement Approval = effet de bord d'un transferFrom du spender
const D = classed.filter((c) => c.k.startsWith('other|toOther'));                // lancé par un tiers via contrat (aggregate3Value, etc.)
const pick = (arr, n) => Array.from({ length: Math.min(n, arr.length) }, (_, i) => arr[Math.floor((i * arr.length) / Math.min(n, arr.length))]);
const selected = [...A.map((c) => ({ ...c, cl: 'A' })), ...B.map((c) => ({ ...c, cl: 'B' })), ...pick(Cc, 8).map((c) => ({ ...c, cl: 'C' })), ...pick(D, 6).map((c) => ({ ...c, cl: 'D' }))];
const rows = [];
for (const [i, { x: a, tx, k, cl }] of selected.entries()) {
  test(`approbation d'attaque réelle ${String(i + 1).padStart(2, '0')}/${selected.length} [classe ${cl}: ${k}] tx ${a.tx.slice(0, 10)}… -> droit vers ${a.spender.slice(0, 8)}…`, T, async () => {
    const receipt = await rpc(RPC.eth, 'eth_getTransactionReceipt', [a.tx]);
    const spenderCode = await isContract(RPC.eth, a.spender);
    const ctx = { chainId: 1, from: a.owner, codeOf: (y) => (y === a.spender ? spenderCode : undefined) };
    const direct = analyzeTransaction({ ...tx, from: a.owner }, ctx);
    const full = analyzeTransaction({ ...tx, from: a.owner }, ctx, { receipt });
    const ap = full.approvals.find((y) => y.spender === a.spender && y.token === a.token);
    const unlimited = isUnlimited(BigInt(a.data));
    const directHit = direct.approvals.some((y) => y.spender === a.spender && y.token === a.token);
    rows.push({ i: i + 1, cl, k, tx: a.tx, block: a.block, directHit, eventHit: !!ap, unlimited, level: full.level, levelDirect: direct.level, spenderIsContract: spenderCode, nestedCount: direct.nested.length, opaqueDirect: direct.opaque, flags: full.risk_flags.map((f) => f.code), embedded: direct.embedded.length });
    assert.ok(ap, 'approbation non retrouvée même avec le reçu');
    assert.equal(ap.amount === 'unlimited', unlimited);
    assert.notEqual(full.level, 'ok');
    if (cl === 'A') { assert.ok(directHit, 'approve() direct non décodé depuis le calldata seul'); assert.notEqual(direct.level, 'ok'); }
  });
}
for (const [i, a] of [zeros[0], zeros[Math.floor(zeros.length / 2)], zeros[zeros.length - 1]].entries()) {
  test(`Approval(.., 0) réel ${i + 1}/3 : tx ${a.tx.slice(0, 12)}… -> aucune approbation créée (révocation / montant nul)`, T, async () => {
    const tx = await rpc(RPC.eth, 'eth_getTransactionByHash', [a.tx]);
    const receipt = await rpc(RPC.eth, 'eth_getTransactionReceipt', [a.tx]);
    const e = analyzeTransaction({ ...tx, from: a.owner }, { chainId: 1, from: a.owner }, { receipt });
    assert.equal(e.approvals.length, 0); assert.ok(e.risk_flags.some((f) => f.code === 'revocation'));
  });
}
test('statistiques des approbations d\'attaque rejouées (consignées dans out/real_results.json)', T, () => {
  const n = rows.length;
  out.attack_dataset = { classCounts, total: attacks.length, grants: grants.length, unlimited_grants: grants.filter((x) => BigInt(x.data) >= 1n << 128n).length, zero_value: zeros.length };
  out.attack_approvals = { n, calldata_direct_hits: rows.filter((r) => r.directHit).length, events_hits: rows.filter((r) => r.eventHit).length, direct_level_not_ok: rows.filter((r) => r.levelDirect !== 'ok').length, by_class: Object.fromEntries(['A', 'B', 'C', 'D'].map((c) => [c, { n: rows.filter((r) => r.cl === c).length, directHit: rows.filter((r) => r.cl === c && r.directHit).length, directNotOk: rows.filter((r) => r.cl === c && r.levelDirect !== 'ok').length, eventHit: rows.filter((r) => r.cl === c && r.eventHit).length }])), full_level_critical: rows.filter((r) => r.level === 'critical').length, full_level_warn: rows.filter((r) => r.level === 'warn').length, spender_is_contract: rows.filter((r) => r.spenderIsContract).length, embedded_hits: rows.filter((r) => r.embedded > 0).length, rows };
  out.stats.rpc = { ...stats };
  save();
  assert.ok(n >= 20, 'moins de 20 cas rejoués: ' + n);
  assert.equal(out.attack_approvals.events_hits, n);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { an, call, encodeParams, codes, has, tx, CTX, USER, OTHER, ATTACKER, USDC, WETH, DAI, USDT, NFT, SAFE, ROUTER, MAXU, NOW, P2D } from './helpers.mjs';
import { analyzeTransaction, analyzeRawTransaction, TOPICS } from '../src/engine.mjs';
import { ADDR, MULTISEND_OFFICIAL } from '../src/registry.mjs';
import { rlpEncode } from '../src/rlp.mjs';
import { toHex, fromHex } from '../src/keccak.mjs';

const MS = Object.keys(MULTISEND_OFFICIAL)[0];
const approve = (sp, v) => call('approve(address spender,uint256 amount)', [sp, v]);
const transfer = (to, v) => call('transfer(address to,uint256 amount)', [to, v]);
const T = (a) => BigInt(a);

// ---------- droits ERC-20 / NFT
test('approve illimité vers adresse inconnue : approval unlimited + flags critical', () => {
  const e = an(USDC, approve(OTHER, MAXU));
  assert.equal(e.approvals.length, 1); assert.equal(e.approvals[0].amount, 'unlimited'); assert.equal(e.approvals[0].via, 'approve');
  assert.ok(has(e, 'unlimited_allowance')); assert.equal(e.level, 'critical'); assert.equal(e.opaque, false);
});
test('approve illimité vers routeur connu : warn seulement', () => {
  const e = an(USDC, approve(ROUTER, MAXU), 0n, { codeOf: () => true });
  assert.equal(e.level, 'warn'); assert.ok(!has(e, 'approval_to_eoa'));
});
test('approve vers compte externe (codeOf=false) : approval_to_eoa critical', () => {
  const e = an(USDC, approve(OTHER, 100n), 0n, { codeOf: () => false });
  assert.ok(has(e, 'approval_to_eoa')); assert.equal(e.level, 'critical');
});
test('approve(0) = révocation : aucune approbation', () => {
  const e = an(USDC, approve(OTHER, 0n));
  assert.equal(e.approvals.length, 0); assert.ok(has(e, 'revocation'));
});
test('approve montant limité en unités lisibles (USDC 6 décimales)', () => {
  const e = an(USDC, approve(ROUTER, 100_500_000n));
  assert.equal(e.approvals[0].amount, '100.5');
});
test('seuils illimité : 2^128 oui, 2^127 non, uint160 max oui', () => {
  assert.equal(an(USDC, approve(ROUTER, 1n << 128n)).approvals[0].amount, 'unlimited');
  assert.notEqual(an(USDC, approve(ROUTER, 1n << 127n)).approvals[0].amount, 'unlimited');
  assert.equal(an(USDC, approve(ROUTER, (1n << 160n) - 1n)).approvals[0].amount, 'unlimited');
});
test('increaseAllowance : via increaseAllowance', () => {
  const e = an(USDC, call('increaseAllowance(address spender,uint256 addedValue)', [OTHER, MAXU]));
  assert.equal(e.approvals[0].via, 'increaseAllowance'); assert.equal(e.approvals[0].amount, 'unlimited');
});
test('decreaseAllowance : pas un droit', () => {
  const e = an(USDC, call('decreaseAllowance(address spender,uint256 subtractedValue)', [OTHER, 5n]));
  assert.equal(e.approvals.length, 0); assert.equal(e.level, 'ok');
});
test('setApprovalForAll(true) opérateur inconnu : critical', () => {
  const e = an(NFT, call('setApprovalForAll(address operator,bool approved)', [OTHER, true]));
  assert.equal(e.approvals[0].via, 'setApprovalForAll'); assert.equal(e.approvals[0].amount, 'unlimited'); assert.ok(has(e, 'approval_for_all')); assert.equal(e.level, 'critical');
});
test('setApprovalForAll(true) opérateur connu : warn', () => {
  const e = an(NFT, call('setApprovalForAll(address operator,bool approved)', [ROUTER, true]), 0n, { codeOf: () => true });
  assert.equal(e.level, 'warn');
});
test('setApprovalForAll(false) : révocation', () => {
  const e = an(NFT, call('setApprovalForAll(address operator,bool approved)', [OTHER, false]));
  assert.equal(e.approvals.length, 0); assert.ok(has(e, 'revocation'));
});

// ---------- transferts
test('transfer ERC-20 : une sortie', () => {
  const e = an(USDC, transfer(OTHER, 5_000_000n));
  assert.equal(e.outgoing.length, 1); assert.equal(e.outgoing[0].to, OTHER); assert.equal(e.outgoing[0].amount, '5'); assert.equal(e.outgoing[0].symbol, 'USDC'); assert.equal(e.level, 'ok');
});
test('transferFrom(user -> autre) = sortie ; (autre -> user) = entrée ; tiers = ni l\'un ni l\'autre', () => {
  const tf = (f, t) => call('transferFrom(address from,address to,uint256 amount)', [f, t, 7n]);
  assert.equal(an(USDC, tf(USER, OTHER)).outgoing.length, 1);
  const inc = an(USDC, tf(OTHER, USER)); assert.equal(inc.incoming.length, 1); assert.equal(inc.outgoing.length, 0);
  const third = an(USDC, tf(OTHER, ATTACKER)); assert.equal(third.outgoing.length + third.incoming.length, 0); assert.equal(third.thirdParty.length, 1);
});
test('NFT safeTransferFrom (avec et sans bytes)', () => {
  const a = an(NFT, call('safeTransferFrom(address from,address to,uint256 tokenId)', [USER, OTHER, 42n]));
  const b = an(NFT, call('safeTransferFrom(address from,address to,uint256 tokenId,bytes data)', [USER, OTHER, 42n, '0x1234']));
  for (const e of [a, b]) { assert.equal(e.outgoing[0].std, 'erc721'); assert.equal(e.outgoing[0].tokenId, '42'); }
});
test('ERC-1155 safeTransferFrom et batch', () => {
  const s = an(NFT, call('safeTransferFrom(address from,address to,uint256 id,uint256 amount,bytes data)', [USER, OTHER, 7n, 3n, '0x']));
  assert.equal(s.outgoing[0].std, 'erc1155');
  const b = an(NFT, call('safeBatchTransferFrom(address from,address to,uint256[] ids,uint256[] amounts,bytes data)', [USER, OTHER, [1n, 2n, 3n], [1n, 1n, 5n], '0x']));
  assert.equal(b.outgoing.length, 3);
});
test('sendTransaction natif : sortie native', () => {
  const e = an(OTHER, '0x', 10n ** 18n);
  assert.equal(e.outgoing.length, 1); assert.equal(e.outgoing[0].token, 'native'); assert.equal(e.outgoing[0].amount, '1'); assert.equal(e.opaque, false);
});
test('WETH deposit : sortie native + entrée WETH ; withdraw inverse', () => {
  const d = an(WETH, call('deposit()', []), 5n * 10n ** 17n);
  assert.equal(d.outgoing[0].token, 'native'); assert.equal(d.incoming[0].token, WETH);
  const w = an(WETH, call('withdraw(uint256 wad)', [10n ** 18n]));
  assert.equal(w.outgoing[0].token, WETH); assert.equal(w.incoming[0].token, 'native');
});

// ---------- permits en calldata
test('permit EIP-2612 soumis par l\'utilisateur pour lui-même : approval via permit + échéance', () => {
  const e = an(USDC, call('permit(address owner,address spender,uint256 value,uint256 deadline,uint8 v,bytes32 r,bytes32 s)', [USER, OTHER, MAXU, BigInt(NOW + 100), 27, '0x' + '11'.repeat(32), '0x' + '22'.repeat(32)]));
  assert.equal(e.approvals[0].via, 'permit'); assert.equal(e.approvals[0].expiry, NOW + 100); assert.equal(e.approvals[0].amount, 'unlimited');
});
test('permit soumis pour un autre owner : n\'affecte pas l\'utilisateur', () => {
  const e = an(USDC, call('permit(address owner,address spender,uint256 value,uint256 deadline,uint8 v,bytes32 r,bytes32 s)', [OTHER, ATTACKER, MAXU, BigInt(NOW + 100), 27, '0x' + '11'.repeat(32), '0x' + '22'.repeat(32)]));
  assert.equal(e.approvals.length, 0); assert.equal(e.thirdParty[0].kind, 'approval');
});
test('DAI permit allowed=true : illimité sans montant ; allowed=false : révocation', () => {
  const dp = (allowed) => call('permit(address holder,address spender,uint256 nonce,uint256 expiry,bool allowed,uint8 v,bytes32 r,bytes32 s)', [USER, OTHER, 0n, 0n, allowed, 27, '0x' + '11'.repeat(32), '0x' + '22'.repeat(32)]);
  const a = an(DAI, dp(true)); assert.equal(a.approvals[0].amount, 'unlimited'); assert.equal(a.approvals[0].dai, true); assert.equal(a.approvals[0].expiry, undefined); assert.ok(has(a, 'no_expiry'));
  const r = an(DAI, dp(false)); assert.equal(r.approvals.length, 0);
});
test('Permit2.approve', () => {
  const e = an(ADDR.PERMIT2, call('approve(address token,address spender,uint160 amount,uint48 expiration)', [USDC, OTHER, (1n << 160n) - 1n, BigInt(NOW + 1000)]));
  assert.equal(e.approvals[0].via, 'permit2'); assert.equal(e.approvals[0].token, USDC); assert.equal(e.approvals[0].amount, 'unlimited');
});
const TPD = '(address token,uint160 amount,uint48 expiration,uint48 nonce)';
test('Permit2.permit single (owner = utilisateur)', () => {
  const d = call(`permit(address owner,(${TPD} details,address spender,uint256 sigDeadline) permitSingle,bytes signature)`, [USER, [[USDC, 1000000n, BigInt(NOW + 5), 0n], OTHER, BigInt(NOW + 9)], '0x' + 'ab'.repeat(65)]);
  const e = an(ADDR.PERMIT2, d);
  assert.equal(e.approvals.length, 1); assert.equal(e.approvals[0].spender, OTHER); assert.equal(e.approvals[0].amount, '1'); assert.equal(e.approvals[0].expiry, NOW + 5);
});
test('Permit2.permit batch : deux approbations', () => {
  const d = call(`permit(address owner,(${TPD}[] details,address spender,uint256 sigDeadline) permitBatch,bytes signature)`, [USER, [[[USDC, 5n, BigInt(NOW + 5), 0n], [DAI, 6n, BigInt(NOW + 5), 1n]], OTHER, BigInt(NOW + 9)], '0x' + 'ab'.repeat(65)]);
  const e = an(ADDR.PERMIT2, d);
  assert.equal(e.approvals.length, 2); assert.deepEqual(e.approvals.map((a) => a.token), [USDC, DAI]);
});
test('Permit2.permitTransferFrom single, batch et witness', () => {
  const ptf = call('permitTransferFrom(((address token,uint256 amount) permitted,uint256 nonce,uint256 deadline) permit,(address to,uint256 requestedAmount) transferDetails,address owner,bytes signature)', [[[USDC, 100n], 1n, BigInt(NOW)], [ATTACKER, 100n], USER, '0x11']);
  const e = an(ADDR.PERMIT2, ptf);
  assert.equal(e.outgoing[0].to, ATTACKER); assert.ok(has(e, 'signed_transfer_to_other'));
  const batch = call('permitTransferFrom(((address token,uint256 amount)[] permitted,uint256 nonce,uint256 deadline) permit,(address to,uint256 requestedAmount)[] transferDetails,address owner,bytes signature)', [[[[USDC, 100n], [DAI, 200n]], 1n, BigInt(NOW)], [[ATTACKER, 100n], [ATTACKER, 200n]], USER, '0x11']);
  assert.equal(an(ADDR.PERMIT2, batch).outgoing.length, 2);
  const wit = call('permitWitnessTransferFrom(((address token,uint256 amount) permitted,uint256 nonce,uint256 deadline) permit,(address to,uint256 requestedAmount) transferDetails,address owner,bytes32 witness,string witnessTypeString,bytes signature)', [[[USDC, 100n], 1n, BigInt(NOW)], [ATTACKER, 100n], USER, '0x' + '33'.repeat(32), 'ExclusiveDutchOrder witness)', '0x11']);
  const w = an(ADDR.PERMIT2, wit); assert.equal(w.outgoing.length, 1);
  const wb = call('permitWitnessTransferFrom(((address token,uint256 amount)[] permitted,uint256 nonce,uint256 deadline) permit,(address to,uint256 requestedAmount)[] transferDetails,address owner,bytes32 witness,string witnessTypeString,bytes signature)', [[[[USDC, 100n]], 1n, BigInt(NOW)], [[ATTACKER, 100n]], USER, '0x' + '33'.repeat(32), 'x', '0x11']);
  assert.equal(an(ADDR.PERMIT2, wb).outgoing.length, 1);
});
test('Permit2.transferFrom (allowance) : sortie', () => {
  const e = an(ADDR.PERMIT2, call('transferFrom(address from,address to,uint160 amount,address token)', [USER, OTHER, 9n, USDC]));
  assert.equal(e.outgoing[0].token, USDC);
  const b = an(ADDR.PERMIT2, call('transferFrom((address from,address to,uint160 amount,address token)[] transferDetails)', [[[USER, OTHER, 1n, USDC], [USER, OTHER, 2n, DAI]]]));
  assert.equal(b.outgoing.length, 2);
});

// ---------- appels groupés
test('Multicall3.aggregate3 : sous-appels décodés, msg.sender = Multicall3 (transfer n\'est pas à l\'utilisateur)', () => {
  const d = call('aggregate3((address target,bool allowFailure,bytes callData)[] calls)', [[[USDC, false, transfer(OTHER, 5n)], [USDC, true, approve(ATTACKER, MAXU)]]]);
  const e = an(ADDR.MULTICALL3, d);
  assert.equal(e.nested.length, 2); assert.equal(e.outgoing.length, 0); assert.equal(e.approvals.length, 0);
  assert.equal(e.nested[1].allowFailure, true);
});
test('Multicall3.aggregate3 avec transferFrom(user) : le droit existant est consommé -> sortie', () => {
  const d = call('aggregate3((address target,bool allowFailure,bytes callData)[] calls)', [[[USDC, false, call('transferFrom(address from,address to,uint256 amount)', [USER, ATTACKER, 99n])]]]);
  const e = an(ADDR.MULTICALL3, d); assert.equal(e.outgoing[0].to, ATTACKER);
});
test('aggregate3Value / aggregate / tryAggregate', () => {
  const a = an(ADDR.MULTICALL3, call('aggregate3Value((address target,bool allowFailure,uint256 value,bytes callData)[] calls)', [[[OTHER, false, 5n, '0x']]]), 5n);
  assert.equal(a.nested.length, 1);
  assert.equal(an(ADDR.MULTICALL3, call('aggregate((address target,bytes callData)[] calls)', [[[USDC, transfer(OTHER, 1n)]]])).nested.length, 1);
  assert.equal(an(ADDR.MULTICALL3, call('tryAggregate(bool requireSuccess,(address target,bytes callData)[] calls)', [true, [[USDC, transfer(OTHER, 1n)]]])).nested.length, 1);
});
test('multicall(bytes[]) de routeur : msg.sender conservé, approve imbriqué = droit de l\'utilisateur + nested_approval', () => {
  const e = an(ROUTER, call('multicall(bytes[] data)', [[approve(ATTACKER, MAXU), transfer(OTHER, 1n)]]));
  assert.equal(e.approvals.length, 1); assert.equal(e.outgoing.length, 1); assert.ok(has(e, 'nested_approval'));
  const d = an(ROUTER, call('multicall(uint256 deadline,bytes[] data)', [BigInt(NOW), [approve(ATTACKER, 5n)]])); assert.equal(d.approvals.length, 1);
  const b = an(ROUTER, call('multicall(bytes32 previousBlockhash,bytes[] data)', ['0x' + '00'.repeat(32), [approve(ATTACKER, 5n)]])); assert.equal(b.approvals.length, 1);
});
test('imbrication profonde : limite de profondeur, pas de plantage', () => {
  let data = approve(ATTACKER, MAXU);
  for (let i = 0; i < 12; i++) data = call('multicall(bytes[] data)', [[data]]);
  const e = an(ROUTER, data);
  assert.equal(e.opaque, true); assert.ok(has(e, 'depth_limit'));
});

// ---------- Universal Router
const UR = (cmds, inputs, v = 0n) => an(ROUTER, call('execute(bytes commands,bytes[] inputs,uint256 deadline)', [cmds, inputs, BigInt(NOW + 100)]), v);
const v3path = (a, b) => '0x' + a.slice(2) + '0001f4' + b.slice(2);
const v3in = (rec, amt, min, path, payer) => encodeParams('address recipient,uint256 amt,uint256 limit,bytes path,bool payerIsUser', [rec, amt, min, path, payer]);
test('UR V3_SWAP_EXACT_IN ETH->USDC vers soi : sortie native, entrée USDC, level ok', () => {
  const e = UR('0x0b00', [encodeParams('address recipient,uint256 amount', [ADDR.UR_ADDRESS_THIS, 10n ** 18n]), v3in(ADDR.UR_MSG_SENDER, 10n ** 18n, 3_000_000_000n, v3path(WETH, USDC), false)], 10n ** 18n);
  assert.equal(e.outgoing[0].token, 'native'); assert.equal(e.incoming.length, 1); assert.equal(e.incoming[0].token, USDC); assert.equal(e.incoming[0].amount, '3000'); assert.equal(e.level, 'ok');
});
test('UR swap vers un tiers : swap_recipient_not_self critical, aucune entrée', () => {
  const e = UR('0x00', [v3in(ATTACKER, 1_000_000n, 1n, v3path(USDC, WETH), true)]);
  assert.ok(has(e, 'swap_recipient_not_self')); assert.equal(e.incoming.length, 0); assert.equal(e.level, 'critical');
});
test('UR V2_SWAP_EXACT_IN / EXACT_OUT décodés', () => {
  const a = encodeParams('address recipient,uint256 amt,uint256 limit,address[] path,bool payerIsUser', [ADDR.UR_MSG_SENDER, 1000000n, 1n, [USDC, WETH], true]);
  assert.equal(UR('0x08', [a]).outgoing.length, 1);
  assert.equal(UR('0x09', [a]).incoming.length, 1);
});
test('UR PERMIT2_PERMIT : droit Permit2 via routeur, spender résolu', () => {
  const inp = encodeParams(`(${TPD} details,address spender,uint256 sigDeadline) permitSingle,bytes sig`, [[[USDC, 10n, BigInt(NOW + 9), 0n], ADDR.UR_ADDRESS_THIS, BigInt(NOW)], '0x11']);
  const e = UR('0x0a', [inp]);
  assert.equal(e.approvals[0].via, 'permit2'); assert.equal(e.approvals[0].spender, ROUTER); assert.ok(!has(e, 'external_spender'));
});
test('UR PERMIT2_PERMIT_BATCH et TRANSFER_FROM(_BATCH)', () => {
  const pb = encodeParams(`(${TPD}[] details,address spender,uint256 sigDeadline) permitBatch,bytes sig`, [[[[USDC, 10n, 5n, 0n]], ATTACKER, 9n], '0x11']);
  assert.equal(UR('0x03', [pb]).approvals.length, 1);
  const tf = encodeParams('address token,address recipient,uint160 amount', [USDC, ATTACKER, 77n]);
  assert.equal(UR('0x02', [tf]).outgoing[0].to, ATTACKER);
  const tfb = encodeParams('(address from,address to,uint160 amount,address token)[] d', [[[USER, ATTACKER, 1n, USDC]]]);
  assert.equal(UR('0x0d', [tfb]).outgoing.length, 1);
});
test('UR SWEEP / TRANSFER vers tiers : router_payout_to_other ; vers soi : entrée', () => {
  const sw = (r) => encodeParams('address token,address recipient,uint256 amt', [USDC, r, 1n]);
  assert.ok(has(UR('0x04', [sw(ATTACKER)]), 'router_payout_to_other'));
  assert.ok(has(UR('0x05', [sw(ATTACKER)]), 'router_payout_to_other'));
  const own = UR('0x04', [sw(ADDR.UR_MSG_SENDER)]); assert.equal(own.incoming.length, 1); assert.ok(!has(own, 'router_payout_to_other'));
});
test('UR UNWRAP_WETH vers soi : entrée native ; PAY_PORTION : info', () => {
  const e = UR('0x0c06', [encodeParams('address recipient,uint256 amountMin', [ADDR.UR_MSG_SENDER, 5n]), encodeParams('address token,address recipient,uint256 bips', [USDC, ATTACKER, 25n])]);
  assert.equal(e.incoming[0].token, 'native'); assert.ok(has(e, 'ur_pay_portion'));
});
test('UR commande V4_SWAP : marquée opaque (non décodée), commande inconnue aussi', () => {
  const e = UR('0x10', ['0x1234']); assert.equal(e.opaque, true); assert.ok(has(e, 'ur_command_opaque'));
  assert.ok(has(UR('0x3f', ['0x']), 'ur_command_unknown'));
});
test('UR EXECUTE_SUB_PLAN : récursion', () => {
  const sub = encodeParams('bytes commands,bytes[] inputs', ['0x05', [encodeParams('address token,address recipient,uint256 value', [USDC, ATTACKER, 1n])]]);
  const e = UR('0x21', [sub]);
  assert.ok(has(e, 'router_payout_to_other'));
});
test('UR flag allow-revert (0x80) masqué correctement', () => {
  const e = UR('0x84', [encodeParams('address token,address recipient,uint256 amt', [USDC, ATTACKER, 1n])]);
  assert.ok(has(e, 'router_payout_to_other'));
});
test('UR commandes/inputs de longueurs différentes : opaque sans plantage', () => {
  const e = UR('0x0000', [v3in(ADDR.UR_MSG_SENDER, 1n, 1n, v3path(USDC, WETH), true)]);
  assert.ok(has(e, 'ur_length_mismatch'));
});
test('swaps V2/V3 directs', () => {
  const sw = an(ROUTER, call('swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [1_000_000n, 990_000n, [USDC, USDT], ATTACKER, BigInt(NOW)]));
  assert.ok(has(sw, 'swap_recipient_not_self')); assert.equal(sw.incoming.length, 0);
  const v3 = an(ROUTER, call('exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)', [[USDC, WETH, 500, USER, 1000n, 0n, 0n]]));
  assert.ok(has(v3, 'slippage_unbounded')); assert.equal(v3.incoming.length, 1);
  const v3b = an(ROUTER, call('exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)', [[USDC, WETH, 500, USER, BigInt(NOW), 1000n, 5n, 0n]]));
  assert.ok(!has(v3b, 'slippage_unbounded'));
  const eth = an(ROUTER, call('swapExactETHForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)', [1n, [WETH, USDC], USER, BigInt(NOW)]), 10n ** 18n);
  assert.equal(eth.outgoing[0].token, 'native');
  const mp = an(ROUTER, call('exactInput((bytes path,address recipient,uint256 amountIn,uint256 amountOutMinimum) params)', [[v3path(USDC, WETH), USER, 5n, 1n]]));
  assert.equal(mp.outgoing[0].token, USDC); assert.equal(mp.incoming[0].token, WETH);
});
test('slippage > 5 % détecté par heuristique stable/stable (USDC->USDT, min 900 pour 1000)', () => {
  const e = an(ROUTER, call('swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [1000_000_000n, 900_000_000n, [USDC, USDT], USER, BigInt(NOW)]));
  const f = e.risk_flags.find((x) => x.code === 'slippage_high'); assert.ok(f); assert.equal(f.slippagePct, 10);
  const ok = an(ROUTER, call('swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [1000_000_000n, 960_000_000n, [USDC, USDT], USER, BigInt(NOW)]));
  assert.ok(!has(ok, 'slippage_high'));
});

// ---------- Safe
const safeExec = (to, value, data, op) => call('execTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures)', [to, value, data, op, 0n, 0n, 0n, ADDR.ZERO, ADDR.ZERO, '0x' + '11'.repeat(65)]);
const packTx = (op, to, value, data) => { const d = fromHex(data); const h = (n, w) => n.toString(16).padStart(w * 2, '0'); return h(op, 1) + to.slice(2) + h(value, 32) + h(d.length, 32) + data.slice(2); };
test('Safe execTransaction : transfert du Safe décodé (le Safe est le compte protégé)', () => {
  const e = an(SAFE, safeExec(USDC, 0n, transfer(OTHER, 1_000_000n), 0n));
  assert.equal(e.outgoing[0].amount, '1'); assert.equal(e.nested.length, 1);
});
test('Safe execTransaction operation=1 vers cible inconnue : delegatecall critical (cas Bybit)', () => {
  const e = an(SAFE, safeExec(ATTACKER, 0n, '0xa9059cbb' + '00'.repeat(64), 1n));
  assert.ok(has(e, 'delegatecall')); assert.equal(e.level, 'critical'); assert.equal(e.opaque, true);
});
test('Safe execTransaction operation=2 : opaque', () => {
  assert.equal(an(SAFE, safeExec(OTHER, 0n, '0x', 2n)).opaque, true);
});
test('Safe -> MultiSend officiel (delegatecall) : addOwner + swapOwner + transfert imbriqués', () => {
  const inner = '0x' + packTx(0, SAFE, 0n, call('addOwnerWithThreshold(address owner,uint256 _threshold)', [ATTACKER, 1n])) + packTx(0, SAFE, 0n, call('swapOwner(address prevOwner,address oldOwner,address newOwner)', [OTHER, USER, ATTACKER])) + packTx(0, USDC, 0n, transfer(ATTACKER, 5n));
  const e = an(SAFE, safeExec(MS, 0n, call('multiSend(bytes transactions)', [inner]), 1n));
  assert.equal(e.controlChange.length, 2); assert.equal(e.outgoing.length, 1); assert.ok(!has(e, 'delegatecall')); assert.equal(e.level, 'critical');
  assert.equal(e.controlChange[0].detail.threshold, '1');
});
test('MultiSend : sous-appel operation=1 caché = critical', () => {
  const inner = '0x' + packTx(1, ATTACKER, 0n, '0x12345678');
  const e = an(SAFE, safeExec(MS, 0n, call('multiSend(bytes transactions)', [inner]), 1n));
  assert.ok(has(e, 'multisend_inner_delegatecall')); assert.ok(has(e, 'delegatecall'));
});
test('MultiSend tronqué / dataLength mensonger : opaque, pas de plantage', () => {
  const bad = '0x' + packTx(0, USDC, 0n, transfer(OTHER, 1n)).slice(0, 100);
  assert.equal(an(SAFE, safeExec(MS, 0n, call('multiSend(bytes transactions)', [bad]), 1n)).opaque, true);
  const lie = '0x' + '00' + USDC.slice(2) + '00'.repeat(32) + (1000).toString(16).padStart(64, '0') + 'aabb';
  assert.ok(has(an(SAFE, safeExec(MS, 0n, call('multiSend(bytes transactions)', [lie]), 1n)), 'multisend_truncated'));
});
test('Safe execTransactionFromModule : signalé', () => {
  const e = an(SAFE, call('execTransactionFromModule(address to,uint256 value,bytes data,uint8 operation)', [USDC, 0n, transfer(OTHER, 3n), 0n]));
  assert.ok(has(e, 'safe_module_exec')); assert.equal(e.outgoing.length, 1);
});

// ---------- contrôle et rôles (table)
const CONTROL = [
  ['transferOwnership(address newOwner)', [ATTACKER], 'transferOwnership'],
  ['renounceOwnership()', [], 'renounceOwnership'],
  ['grantRole(bytes32 role,address account)', ['0x' + '00'.repeat(32), ATTACKER], 'grantRole'],
  ['revokeRole(bytes32 role,address account)', ['0x' + '11'.repeat(32), OTHER], 'revokeRole'],
  ['renounceRole(bytes32 role,address callerConfirmation)', ['0x' + '11'.repeat(32), USER], 'renounceRole'],
  ['upgradeTo(address newImplementation)', [ATTACKER], 'upgrade'],
  ['upgradeToAndCall(address newImplementation,bytes data)', [ATTACKER, '0x1234'], 'upgrade'],
  ['upgrade(address proxy,address implementation)', [OTHER, ATTACKER], 'upgrade'],
  ['upgradeAndCall(address proxy,address implementation,bytes data)', [OTHER, ATTACKER, '0x'], 'upgrade'],
  ['changeAdmin(address newAdmin)', [ATTACKER], 'changeAdmin'],
  ['setOwner(address owner)', [ATTACKER], 'setOwner'],
  ['setAuthority(address authority)', [ATTACKER], 'setAuthority'],
  ['addOwnerWithThreshold(address owner,uint256 _threshold)', [ATTACKER, 1n], 'safe.addOwner'],
  ['removeOwner(address prevOwner,address owner,uint256 _threshold)', [OTHER, USER, 1n], 'safe.removeOwner'],
  ['swapOwner(address prevOwner,address oldOwner,address newOwner)', [OTHER, USER, ATTACKER], 'safe.swapOwner'],
  ['changeThreshold(uint256 _threshold)', [1n], 'safe.changeThreshold'],
  ['enableModule(address module)', [ATTACKER], 'safe.enableModule'],
  ['disableModule(address prevModule,address module)', [OTHER, ATTACKER], 'safe.disableModule'],
  ['setGuard(address guard)', [ATTACKER], 'safe.setGuard'],
  ['setModuleGuard(address moduleGuard)', [ATTACKER], 'safe.setModuleGuard'],
  ['setFallbackHandler(address handler)', [ATTACKER], 'safe.setFallbackHandler'],
  ['setOwner(bytes32 node,address owner)', ['0x' + '01'.repeat(32), ATTACKER], 'ens.setOwner'],
  ['setSubnodeOwner(bytes32 node,bytes32 label,address owner)', ['0x' + '01'.repeat(32), '0x' + '02'.repeat(32), ATTACKER], 'ens.setSubnodeOwner'],
  ['setResolver(bytes32 node,address resolver)', ['0x' + '01'.repeat(32), ATTACKER], 'ens.setResolver'],
  ['setRecord(bytes32 node,address owner,address resolver,uint64 ttl)', ['0x' + '01'.repeat(32), ATTACKER, OTHER, 0n], 'ens.setRecord'],
  ['reclaim(uint256 id,address owner)', [5n, ATTACKER], 'ens.reclaim'],
  ['setAddr(bytes32 node,address a)', ['0x' + '01'.repeat(32), ATTACKER], 'ens.setAddr'],
  ['installModule(uint256 moduleTypeId,address module,bytes initData)', [1n, ATTACKER, '0x'], 'erc7579.installModule'],
  ['uninstallModule(uint256 moduleTypeId,address module,bytes deInitData)', [1n, ATTACKER, '0x'], 'erc7579.uninstallModule'],
];
for (const [sig, args, type] of CONTROL) {
  test(`contrôle : ${sig.split('(')[0]} -> controlChange ${type} (critical)`, () => {
    const e = an(OTHER, call(sig, args));
    assert.equal(e.controlChange.length, 1); assert.equal(e.controlChange[0].type, type); assert.equal(e.level, 'critical'); assert.ok(has(e, 'control_change'));
  });
}
test('grantRole DEFAULT_ADMIN_ROLE : detail.adminRole = true', () => {
  assert.equal(an(OTHER, call('grantRole(bytes32 role,address account)', ['0x' + '00'.repeat(32), ATTACKER])).controlChange[0].detail.adminRole, true);
});
test('acceptOwnership : info seulement (pas critical)', () => {
  const e = an(OTHER, call('acceptOwnership()', [])); assert.equal(e.controlChange[0].severity, 'info'); assert.notEqual(e.level, 'critical');
});

// ---------- ERC-4337
const OP6 = (sender, callData) => [sender, 0n, '0x', callData, 1n, 1n, 1n, 1n, 1n, '0x', '0x'];
const H6 = 'handleOps((address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData,bytes signature)[] ops,address beneficiary)';
test('ERC-4337 handleOps v0.6 : détecté + callData imbriqué (execute -> transfer) pour compte protégé', () => {
  const acct = '0x3333333333333333333333333333333333333333';
  const cd = call('execute(address dest,uint256 value,bytes func)', [USDC, 0n, transfer(ATTACKER, 8n)]);
  const e = an('0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', call(H6, [[OP6(acct, cd)], OTHER]), 0n, { protected: [acct] });
  assert.ok(has(e, 'erc4337_handleOps')); assert.equal(e.outgoing.length, 1);
});
test('ERC-4337 handleOps v0.7 + executeBatch : détecté', () => {
  const op = ['0x3333333333333333333333333333333333333333', 0n, '0x', call('executeBatch(address[] dest,bytes[] func)', [[USDC], [approve(ATTACKER, MAXU)]]), '0x' + '00'.repeat(32), 1n, '0x' + '00'.repeat(32), '0x', '0x'];
  const e = an('0x0000000071727de22e5e9d8baf0edac6f37da032', call('handleOps((address sender,uint256 nonce,bytes initCode,bytes callData,bytes32 accountGasLimits,uint256 preVerificationGas,bytes32 gasFees,bytes paymasterAndData,bytes signature)[] ops,address beneficiary)', [[op], OTHER]), 0n, { protected: [op[0]] });
  assert.ok(has(e, 'erc4337_handleOps')); assert.equal(e.approvals.length, 1);
});
test('ERC-4337 : callData ERC-7579 delegatecall -> critical', () => {
  const mode = '0xff' + '00'.repeat(31);
  const e = an(OTHER, call('execute(bytes32 mode,bytes executionCalldata)', [mode, ATTACKER + '00'.repeat(4)]));
  assert.ok(has(e, 'delegatecall'));
});

// ---------- EIP-7702
test('tx type 0x4 : authorizationList -> delegation 7702 critical', () => {
  const e = analyzeTransaction({ from: USER, to: USER, input: '0x', value: '0x0', type: '0x4', authorizationList: [{ chainId: '0x1', address: ATTACKER, nonce: '0x0' }] }, CTX);
  assert.equal(e.delegation.to, ATTACKER); assert.equal(e.delegation.via, 'eip7702'); assert.ok(has(e, 'delegation_7702')); assert.equal(e.level, 'critical');
});
test('7702 chain_id = 0 : toutes chaînes critical', () => {
  const e = analyzeTransaction({ from: USER, to: USER, input: '0x', type: '0x4', authorizationList: [{ chainId: '0x0', address: ATTACKER, nonce: '0x1' }] }, CTX);
  assert.ok(has(e, 'delegation_7702_all_chains'));
});
test('7702 délégation vers l\'adresse zéro = révocation (pas critical)', () => {
  const e = analyzeTransaction({ from: USER, to: USER, input: '0x', type: '0x4', authorizationList: [{ chainId: '0x1', address: ADDR.ZERO, nonce: '0x1' }] }, CTX);
  assert.equal(e.delegation, undefined); assert.ok(has(e, 'delegation_7702_revoke')); assert.notEqual(e.level, 'critical');
});
test('tx 0x4 sans liste : signalée', () => {
  assert.ok(has(analyzeTransaction({ from: USER, to: OTHER, input: '0x', type: '0x4', authorizationList: [] }, CTX), 'type4_empty_authorization_list'));
});
test('tx brute type 0x4 (RLP) décodée', () => {
  const auth = [1n, ATTACKER, 0n, 0n, 1n, 1n];
  const body = [1n, 0n, 1n, 1n, 21000n, OTHER, 0n, '0x', [], [auth], 0n, 1n, 1n];
  const raw = toHex(new Uint8Array([4, ...rlpEncode(body)]));
  const e = analyzeRawTransaction(raw, CTX);
  assert.equal(e.delegation.to, ATTACKER); assert.equal(e.raw.txType, 4);
});
test('tx brute type 0x2 et legacy (RLP) décodées', () => {
  const t2 = toHex(new Uint8Array([2, ...rlpEncode([1n, 0n, 1n, 1n, 100000n, USDC, 0n, transfer(OTHER, 5n), [], 0n, 1n, 1n])]));
  assert.equal(analyzeRawTransaction(t2, CTX).outgoing.length, 1);
  const t0 = toHex(rlpEncode([0n, 1n, 21000n, OTHER, 10n ** 18n, '0x', 27n, 1n, 1n]));
  assert.equal(analyzeRawTransaction(t0, CTX).outgoing[0].token, 'native');
});

// ---------- robustesse
test('création de contrat (to = null) : opaque', () => {
  const e = analyzeTransaction({ from: USER, to: null, input: '0x6080604052', value: '0x0' }, CTX);
  assert.equal(e.opaque, true); assert.ok(has(e, 'contract_creation'));
});
test('sélecteur inconnu : opaque + warn', () => {
  const e = an(OTHER, '0xdeadbeef' + '00'.repeat(32)); assert.equal(e.opaque, true); assert.equal(e.level, 'warn');
});
test('calldata court (< 4 octets) et calldata tronquée : pas de plantage', () => {
  assert.equal(an(OTHER, '0x1234').opaque, true);
  assert.ok(an(USDC, '0xa9059cbb' + '00'.repeat(20)).opaque);
});
test('fuzz : 600 calldata aléatoires dont sélecteurs connus -> jamais d\'exception', () => {
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const sels = ['0x095ea7b3', '0xa9059cbb', '0x3593564c', '0x82ad56cb', '0x6a761202', '0x8d80ff0a', '0xac9650d8', '0x2b67b570', '0x1fad948c', '0x765e827f', '0xdeadbeef'];
  for (let i = 0; i < 600; i++) {
    const n = Math.floor(rnd() * 400); let body = '';
    for (let j = 0; j < n; j++) body += Math.floor(rnd() * 256).toString(16).padStart(2, '0');
    const e = an(OTHER, sels[i % sels.length] + body);
    assert.ok(Array.isArray(e.risk_flags) && typeof e.opaque === 'boolean');
  }
});
test('adresses en majuscules / casse mixte : normalisées en minuscules', () => {
  const e = analyzeTransaction({ from: USER.toUpperCase().replace('0X', '0x'), to: USDC.toUpperCase().replace('0X', '0x'), input: approve('0x' + 'AB'.repeat(20), 5n), value: '0x0' }, { chainId: 1, now: NOW });
  assert.equal(e.approvals[0].spender, '0x' + 'ab'.repeat(20)); assert.equal(e.from, USER);
});
test('value envoyée avec appel de contrat : sortie native vers le contrat + sélecteur inconnu', () => {
  const e = an(OTHER, '0xdeadbeef', 5n * 10n ** 18n);
  assert.equal(e.outgoing[0].amount, '5'); assert.equal(e.opaque, true);
});
test('shareOfBalancePct calculé quand les soldes sont fournis', () => {
  const e = an(USDC, transfer(OTHER, 60_000_000n), 0n, { balances: { [USDC]: '100000000' } });
  assert.equal(e.shareOfBalancePct, 60); assert.ok(has(e, 'high_balance_share'));
});
test('firstSeenByUser selon l\'historique fourni', () => {
  const e = an(USDC, transfer(OTHER, 1n), 0n, { history: [{ address: OTHER, ts: NOW - 99999 }] });
  assert.equal(e.counterparties[0].firstSeenByUser, false);
  const f = an(USDC, transfer(ATTACKER, 1n), 0n, { history: [{ address: OTHER, ts: NOW - 99999 }] });
  assert.equal(f.counterparties[0].firstSeenByUser, true);
});

// ---------- événements du reçu
const topicA = (a) => '0x' + a.slice(2).padStart(64, '0');
test('reçu : Approval illimité vu dans les logs malgré un appel opaque', () => {
  const log = { address: USDC, topics: [TOPICS.Approval, topicA(USER), topicA(ATTACKER)], data: '0x' + 'ff'.repeat(32) };
  const e = an(OTHER, '0xdeadbeef', 0n, {}, { receipt: { logs: [log] } });
  assert.equal(e.opaque, true); assert.equal(e.approvals[0].amount, 'unlimited'); assert.equal(e.approvals[0].spender, ATTACKER); assert.equal(e.level, 'critical');
});
test('reçu : Transfer ERC-20 dédupliqué avec le calldata', () => {
  const log = { address: USDC, topics: [TOPICS.Transfer, topicA(USER), topicA(OTHER)], data: '0x' + (5n).toString(16).padStart(64, '0') };
  const e = an(USDC, transfer(OTHER, 5n), 0n, {}, { receipt: { logs: [log] } });
  assert.equal(e.outgoing.length, 1);
});
test('reçu : ApprovalForAll et Permit2 Approval', () => {
  const l1 = { address: NFT, topics: [TOPICS.ApprovalForAll, topicA(USER), topicA(ATTACKER)], data: '0x' + '01'.padStart(64, '0') };
  const l2 = { address: ADDR.PERMIT2, topics: [TOPICS.Permit2Approval, topicA(USER), topicA(USDC), topicA(ATTACKER)], data: '0x' + (1000n).toString(16).padStart(64, '0') + (NOW + 5).toString(16).padStart(64, '0') };
  const e = an(OTHER, '0xdeadbeef', 0n, {}, { receipt: { logs: [l1, l2] } });
  assert.deepEqual(e.approvals.map((a) => a.via).sort(), ['permit2', 'setApprovalForAll']);
});

// revoke.js : pure module. Selectors and calldata are recomputed with the ENGINE's own keccak and ABI encoder (independent of revoke.js).
// Run : node --test extension/tests/unit/revoke.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { load, DIR } from './fake_chrome.mjs';

const R = await load('revoke.js');
const ENGINE = (f) => import(pathToFileURL(join(DIR, '..', 'engine', 'src', f)).href);
const { selectorOf } = await ENGINE('keccak.mjs');
const { call } = await ENGINE('abi_encode.mjs');

const OWNER = '0x' + 'a1'.repeat(20), SPENDER = '0x' + 'd4'.repeat(20), TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', TOKEN2 = '0x' + 'c3'.repeat(20);
const ZERO = '0x' + '0'.repeat(40), MAXU = (1n << 256n) - 1n, MAX160 = (1n << 160n) - 1n;
const lc = (s) => s.toLowerCase();
const tx = (to, data, extra = {}) => ({ method: 'eth_sendTransaction', chainId: '0x1', params: [{ from: OWNER, to, data, value: '0x0', chainId: '0x1', ...extra }] });
const typed = (td, signer = OWNER) => ({ method: 'eth_signTypedData_v4', chainId: '0x1', params: [signer, JSON.stringify(td)] });
const D = (name, verifyingContract) => ({ name, version: '1', chainId: 1, verifyingContract });
const NOW = 1_800_000_000;

// the one rule of the module : the wallet is the only one that signs
const wallet = (r) => { assert.equal(r.signedByHoldUp, false); assert.equal(r.submitTo, 'wallet'); for (const q of [...r.requests, ...r.ifAlreadyUsed]) { assert.equal(q.submitTo, 'wallet'); assert.ok(['eth_sendTransaction', 'eth_signTypedData_v4'].includes(q.method)); } };

test('selectors match keccak-256 of the canonical signatures', () => {
  const sigs = { approve: 'approve(address,uint256)', increaseAllowance: 'increaseAllowance(address,uint256)', setApprovalForAll: 'setApprovalForAll(address,bool)', permit: 'permit(address,address,uint256,uint256,uint8,bytes32,bytes32)',
    permit2Approve: 'approve(address,address,uint160,uint48)', permit2Permit: 'permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)', permit2Lockdown: 'lockdown((address,address)[])',
    permit2InvalidateNonces: 'invalidateNonces(address,address,uint48)', permit2InvalidateUnordered: 'invalidateUnorderedNonces(uint256,uint256)' };
  assert.deepEqual(Object.keys(R.SEL).sort(), Object.keys(sigs).sort());
  for (const [k, sig] of Object.entries(sigs)) assert.equal(R.SEL[k], selectorOf(sig), k);
  assert.equal(R.PERMIT2, '0x000000000022d473030f116ddee9f6b43ac78ba3');
});

test('encoders equal the engine ABI encoder', () => {
  assert.equal(R.encodeApprove(SPENDER, 0n), call('approve(address,uint256)', [SPENDER, 0n]));
  assert.equal(R.encodeApprove(ZERO, 77n), call('approve(address,uint256)', [ZERO, 77n]));
  assert.equal(R.encodeSetApprovalForAll(SPENDER, false), call('setApprovalForAll(address,bool)', [SPENDER, false]));
  assert.equal(R.encodePermit2Approve(TOKEN, SPENDER, 0n, 0n), call('approve(address,address,uint160,uint48)', [TOKEN, SPENDER, 0n, 0n]));
  assert.equal(R.encodeLockdown([[TOKEN, SPENDER], [TOKEN2, SPENDER]]), call('lockdown((address,address)[])', [[[TOKEN, SPENDER], [TOKEN2, SPENDER]]]));
  assert.equal(R.encodeInvalidateNonces(TOKEN, SPENDER, 5n), call('invalidateNonces(address,address,uint48)', [TOKEN, SPENDER, 5n]));
  assert.equal(R.encodeInvalidateUnordered(3n, 1n << 200n), call('invalidateUnorderedNonces(uint256,uint256)', [3n, 1n << 200n]));
  const r = '0x' + '11'.repeat(32), s = '0x' + '22'.repeat(32);
  assert.equal(R.encodePermit(OWNER, OWNER, 0n, 99n, 28, r, s), call('permit(address,address,uint256,uint256,uint8,bytes32,bytes32)', [OWNER, OWNER, 0n, 99n, 28, r, s]));
});

test('approve (unlimited ERC-20) -> approve(spender, 0) to the same token, from the owner, one click', () => {
  const r = R.revocationFor(tx(TOKEN, call('approve(address,uint256)', [SPENDER, MAXU])));
  assert.equal(r.status, 'revocable'); assert.equal(r.kind, 'erc20_approve'); assert.equal(r.oneClick, true); wallet(r);
  assert.equal(r.requests.length, 1);
  const p = r.requests[0].params[0];
  assert.deepEqual(p, { from: lc(OWNER), to: lc(TOKEN), value: '0x0', data: call('approve(address,uint256)', [SPENDER, 0n]), chainId: '0x1' });
  assert.equal(r.grant.unlimited, true); assert.equal(r.grant.spender, lc(SPENDER));
  assert.ok(r.says.includes('Hold up ne signe jamais'));
});

test('approve of a limited amount : same bytes as an NFT approve, so Hold up asks instead of guessing', () => {
  const data = call('approve(address,uint256)', [SPENDER, 50_000000n]);
  const amb = R.revocationFor(tx(TOKEN, data));
  assert.equal(amb.status, 'needs_info'); assert.equal(amb.requests.length, 0); assert.equal(amb.candidates.length, 2); wallet(amb);
  const e20 = R.revocationFor(tx(TOKEN, data), { tokenKind: 'erc20' }), e721 = R.revocationFor(tx(TOKEN, data), { tokenKind: 'erc721' });
  assert.equal(e20.requests[0].params[0].data, call('approve(address,uint256)', [SPENDER, 0n]));
  assert.equal(e721.requests[0].params[0].data, call('approve(address,uint256)', [ZERO, 50_000000n]), 'NFT : approve(0x0, tokenId)');
  assert.equal(e721.kind, 'erc721_approve');
});

test('approve to zero, to the zero address, or without a sender : nothing to revoke or nothing prepared', () => {
  assert.equal(R.revocationFor(tx(TOKEN, call('approve(address,uint256)', [SPENDER, 0n]))).status, 'not_a_grant');
  assert.equal(R.revocationFor(tx(TOKEN, call('approve(address,uint256)', [ZERO, MAXU]))).status, 'not_a_grant');
  const nofrom = { method: 'eth_sendTransaction', params: [{ to: TOKEN, data: call('approve(address,uint256)', [SPENDER, MAXU]) }] };
  const r = R.revocationFor(nofrom); assert.equal(r.status, 'needs_info'); assert.equal(r.requests.length, 0);
  assert.equal(R.revocationFor({ ...nofrom, from: OWNER }).status, 'revocable', 'the request-level sender is enough');
});

test('increaseAllowance -> approve(spender, 0), and says it also removes an older right', () => {
  const r = R.revocationFor(tx(TOKEN, call('increaseAllowance(address,uint256)', [SPENDER, 10n ** 18n])));
  assert.equal(r.status, 'revocable'); assert.equal(r.kind, 'erc20_increaseAllowance'); wallet(r);
  assert.equal(r.requests[0].params[0].data, call('approve(address,uint256)', [SPENDER, 0n]));
  assert.ok(r.says.includes('plus ancien'));
  assert.equal(R.revocationFor(tx(TOKEN, call('increaseAllowance(address,uint256)', [SPENDER, 0n]))).status, 'not_a_grant');
});

test('setApprovalForAll(operator, true) -> setApprovalForAll(operator, false) ; false is not a grant', () => {
  const r = R.revocationFor(tx(TOKEN2, call('setApprovalForAll(address,bool)', [SPENDER, true])));
  assert.equal(r.status, 'revocable'); assert.equal(r.oneClick, true); wallet(r);
  assert.equal(r.requests[0].params[0].data, call('setApprovalForAll(address,bool)', [SPENDER, false]));
  assert.equal(r.requests[0].params[0].to, lc(TOKEN2));
  assert.equal(R.revocationFor(tx(TOKEN2, call('setApprovalForAll(address,bool)', [SPENDER, false]))).status, 'not_a_grant');
  // a boolean word that is neither 0 nor 1 is malformed, never "true"
  assert.equal(R.revocationFor(tx(TOKEN2, R.SEL.setApprovalForAll + SPENDER.slice(2).padStart(64, '0') + '2'.padStart(64, '0'))).status, 'not_a_grant');
});

test('permit() call sent as a transaction -> approve(spender, 0) from the owner', () => {
  const data = call('permit(address,address,uint256,uint256,uint8,bytes32,bytes32)', [OWNER, SPENDER, MAXU, MAXU, 27, '0x' + '11'.repeat(32), '0x' + '22'.repeat(32)]);
  const r = R.revocationFor(tx(TOKEN, data, { from: TOKEN2 })); // anyone can relay a permit
  assert.equal(r.status, 'revocable'); assert.equal(r.kind, 'erc20_permit_call'); assert.equal(r.requests[0].params[0].from, lc(OWNER), 'only the owner can revoke');
  assert.equal(r.requests[0].params[0].data, call('approve(address,uint256)', [SPENDER, 0n]));
});

test('Permit2.approve(token, spender, amount, expiration) -> approve(token, spender, 0, 0) on Permit2', () => {
  const r = R.revocationFor(tx(R.PERMIT2, call('approve(address,address,uint160,uint48)', [TOKEN, SPENDER, MAX160, 2n ** 47n])));
  assert.equal(r.status, 'revocable'); assert.equal(r.oneClick, true); wallet(r);
  assert.equal(r.requests[0].params[0].to, R.PERMIT2);
  assert.equal(r.requests[0].params[0].data, call('approve(address,address,uint160,uint48)', [TOKEN, SPENDER, 0n, 0n]));
  assert.equal(R.revocationFor(tx(R.PERMIT2, call('approve(address,address,uint160,uint48)', [TOKEN, SPENDER, 0n, 0n]))).status, 'not_a_grant');
});

test('Permit2.permit(...) sent as a transaction -> lockdown([(token, spender)]) from the owner', () => {
  const data = call('permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)', [OWNER, [[TOKEN, MAX160, 2n ** 47n, 4n], SPENDER, 2n ** 47n], '0x' + 'ab'.repeat(65)]);
  const r = R.revocationFor(tx(R.PERMIT2, data, { from: TOKEN2 }));
  assert.equal(r.status, 'revocable'); assert.equal(r.kind, 'permit2_permit_call');
  assert.equal(r.requests[0].params[0].from, lc(OWNER));
  assert.equal(r.requests[0].params[0].data, call('lockdown((address,address)[])', [[[TOKEN, SPENDER]]]));
  assert.equal(r.grant.nonce, '4');
});

// ---------------------------------------------------------------- off-chain signatures
const PERMIT_TD = (over = {}) => ({
  types: { Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  primaryType: 'Permit', domain: D('USD Coin', TOKEN),
  message: { owner: OWNER, spender: SPENDER, value: MAXU.toString(), nonce: '7', deadline: MAXU.toString(), ...over }
});

test('EIP-2612 permit : NOT one click, honest steps, a harmless replacement permit to sign, never a claim of revocation', () => {
  const r = R.revocationFor(typed(PERMIT_TD()), { nowSec: NOW });
  assert.equal(r.status, 'two_steps'); assert.equal(r.oneClick, false); wallet(r);
  assert.equal(R.buttonLabel(r), 'Voir comment annuler ce droit', 'no "Révoquer" button for what cannot be revoked in one click');
  assert.equal(r.requests.length, 1);
  const q = r.requests[0]; assert.equal(q.method, 'eth_signTypedData_v4'); assert.equal(q.params[0], lc(OWNER));
  const td = JSON.parse(q.params[1]);
  assert.deepEqual(td.message, { owner: lc(OWNER), spender: lc(OWNER), value: '0', nonce: '7', deadline: String(NOW + 3600) }, 'same nonce, self as spender, zero value, short deadline');
  assert.deepEqual(td.domain, PERMIT_TD().domain, 'same domain as the signature it neutralises');
  assert.equal(r.expiry.never, true);
  // the already-sent case is covered by approve(spender, 0)
  assert.equal(r.ifAlreadyUsed.length, 1); assert.equal(r.ifAlreadyUsed[0].params[0].data, call('approve(address,uint256)', [SPENDER, 0n]));
  const text = [r.says, ...r.steps, ...r.limits].join(' ');
  assert.ok(text.includes('Un clic ne suffit pas') && text.includes('course') && text.includes('attendre l’échéance'));
  assert.ok(!/révoqu[ée]e? en un clic/i.test(text));
});

test('EIP-2612 : the transaction that spends the nonce is built from the wallet signature, and is still only submitted to the wallet', () => {
  const r = R.revocationFor(typed(PERMIT_TD()), { nowSec: NOW });
  const rr = '11'.repeat(32), ss = '22'.repeat(32);
  const t = R.permitNonceSpendTx(r, '0x' + rr + ss + '1b', '0x1');
  assert.equal(t.method, 'eth_sendTransaction'); assert.equal(t.submitTo, 'wallet'); assert.equal(t.params[0].to, lc(TOKEN)); assert.equal(t.params[0].from, lc(OWNER));
  assert.equal(t.params[0].data, call('permit(address,address,uint256,uint256,uint8,bytes32,bytes32)', [OWNER, OWNER, 0n, BigInt(NOW + 3600), 27, '0x' + rr, '0x' + ss]));
  assert.equal(R.permitNonceSpendTx(r, '0x' + rr + ss + '00', '0x1').params[0].data.slice(10).match(/.{64}/g)[4], '1b'.padStart(64, '0'), 'v 0/1 is lifted to 27/28');
  assert.equal(R.permitNonceSpendTx(r, '0x1234'), null);
  assert.equal(R.permitNonceSpendTx({ kind: 'dai_permit' }, '0x' + rr + ss + '1b'), null);
});

test('EIP-2612 with a near deadline is reported as such, with a zero-value permit as a non-grant', () => {
  const r = R.revocationFor(typed(PERMIT_TD({ deadline: String(NOW + 600), value: '1000000' })), { nowSec: NOW });
  assert.equal(r.expiry.never, false); assert.equal(r.expiry.at, NOW + 600);
  assert.equal(R.revocationFor(typed(PERMIT_TD({ value: '0' })), { nowSec: NOW }).status, 'not_a_grant');
  assert.equal(R.revocationFor(typed(PERMIT_TD({ spender: ZERO })), { nowSec: NOW }).status, 'not_a_grant');
});

test('DAI-style permit : two steps, replacement refuses the right', () => {
  const td = { types: { Permit: [] }, primaryType: 'Permit', domain: D('Dai Stablecoin', TOKEN2), message: { holder: OWNER, spender: SPENDER, nonce: '3', expiry: '0', allowed: true } };
  const r = R.revocationFor(typed(td), { nowSec: NOW });
  assert.equal(r.status, 'two_steps'); assert.equal(r.kind, 'dai_permit'); wallet(r);
  const m = JSON.parse(r.requests[0].params[1]).message;
  assert.deepEqual(m, { holder: lc(OWNER), spender: lc(OWNER), nonce: '3', expiry: String(NOW + 3600), allowed: false });
  td.message.allowed = false; assert.equal(R.revocationFor(typed(td), { nowSec: NOW }).status, 'not_a_grant');
});

const PD = (token, amount, nonce) => ({ token, amount: String(amount), expiration: String(NOW + 86400), nonce: String(nonce) });
const SINGLE = (nonce = 4) => ({ types: {}, primaryType: 'PermitSingle', domain: { name: 'Permit2', chainId: 1, verifyingContract: R.PERMIT2 }, message: { details: PD(TOKEN, MAX160, nonce), spender: SPENDER, sigDeadline: String(NOW + 1800) } });

test('Permit2 PermitSingle : invalidate the nonce (signature unused) AND lockdown (already used) : two wallet transactions, not one click', () => {
  const r = R.revocationFor(typed(SINGLE(4)));
  assert.equal(r.status, 'revocable'); assert.equal(r.oneClick, false, 'two transactions are not one click'); wallet(r);
  assert.equal(R.buttonLabel(r), 'Voir comment annuler ce droit');
  assert.equal(r.requests.length, 1); assert.equal(r.ifAlreadyUsed.length, 1);
  assert.equal(r.requests[0].params[0].to, R.PERMIT2);
  assert.equal(r.requests[0].params[0].data, call('invalidateNonces(address,address,uint48)', [TOKEN, SPENDER, 5n]), 'newNonce = signed nonce + 1');
  assert.equal(r.ifAlreadyUsed[0].params[0].data, call('lockdown((address,address)[])', [[[TOKEN, SPENDER]]]));
  assert.equal(r.requests[0].params[0].from, lc(OWNER));
  assert.ok(r.limits.join(' ').includes('course'));
});

test('Permit2 PermitSingle with the chain state given : an already spent nonce gives the lockdown only', () => {
  const r = R.revocationFor(typed(SINGLE(4)), { state: { permit2Nonces: [5] } });
  assert.equal(r.requests.length, 1); assert.equal(r.ifAlreadyUsed.length, 0);
  assert.equal(r.requests[0].params[0].data, call('lockdown((address,address)[])', [[[TOKEN, SPENDER]]]));
});

test('Permit2 PermitBatch : one invalidation per token, one lockdown for all pairs', () => {
  const td = { types: {}, primaryType: 'PermitBatch', domain: { name: 'Permit2', chainId: 1, verifyingContract: R.PERMIT2 }, message: { details: [PD(TOKEN, 5, 1), PD(TOKEN2, 6, 9)], spender: SPENDER, sigDeadline: String(NOW + 1800) } };
  const r = R.revocationFor(typed(td));
  assert.equal(r.kind, 'permit2_batch_signature'); assert.equal(r.requests.length, 2);
  assert.equal(r.requests[1].params[0].data, call('invalidateNonces(address,address,uint48)', [TOKEN2, SPENDER, 10n]));
  assert.equal(r.ifAlreadyUsed[0].params[0].data, call('lockdown((address,address)[])', [[[TOKEN, SPENDER], [TOKEN2, SPENDER]]]));
  const big17 = { ...td, message: { ...td.message, details: Array.from({ length: 17 }, (_, i) => PD(TOKEN, 1, i)) } };
  assert.equal(R.revocationFor(typed(big17)).status, 'not_revocable_by_click', 'an oversized batch is not built');
});

test('Permit2 signature transfer : one transaction on the unordered-nonce bitmap (word and bit)', () => {
  const td = (nonce) => ({ types: {}, primaryType: 'PermitTransferFrom', domain: { name: 'Permit2', chainId: 1, verifyingContract: R.PERMIT2 }, message: { permitted: { token: TOKEN, amount: '100' }, spender: SPENDER, nonce: String(nonce), deadline: String(NOW + 600) } });
  const r = R.revocationFor(typed(td(0x1ff)));
  assert.equal(r.status, 'revocable'); assert.equal(r.oneClick, true); wallet(r);
  assert.equal(r.requests[0].params[0].data, call('invalidateUnorderedNonces(uint256,uint256)', [1n, 1n << 255n]));
  const big = R.revocationFor(typed(td(MAXU)));
  assert.equal(big.requests[0].params[0].data, call('invalidateUnorderedNonces(uint256,uint256)', [MAXU >> 8n, 1n << 255n]));
  assert.equal(R.revocationFor({ method: 'eth_signTypedData_v4', params: [undefined, JSON.stringify(td(1))] }).status, 'needs_info');
});

test('a Permit2-looking message on another contract is not built as a Permit2 revocation', () => {
  const td = SINGLE(); td.domain = { name: 'Not Permit2', chainId: 1, verifyingContract: TOKEN2 };
  const r = R.revocationFor(typed(td)); assert.equal(r.status, 'not_revocable_by_click'); assert.equal(r.requests.length, 0);
});

test('an unknown off-chain signature (order, login...) : no request, no promise', () => {
  const order = { types: {}, primaryType: 'Order', domain: D('Gnosis Protocol', TOKEN2), message: { sellToken: TOKEN, sellAmount: '1' } };
  const r = R.revocationFor(typed(order));
  assert.equal(r.status, 'not_revocable_by_click'); assert.equal(r.requests.length, 0); assert.equal(R.buttonLabel(r), null); wallet(r);
  assert.ok(r.says.includes('ne propose pas de retrait en un clic'));
});

test('malformed and hostile input never throws and never builds a request', () => {
  const bad = [null, undefined, 42, 'x', {}, { method: 'eth_sendTransaction' }, { method: 'eth_sendTransaction', params: [] }, { method: 'eth_sendTransaction', params: [null] },
    tx('not-an-address', '0x095ea7b3'), tx(TOKEN, '0x'), tx(TOKEN, '0xzz'), tx(TOKEN, '0x095ea7b3'), tx(TOKEN, '0x095ea7b3' + '00'),
    tx(TOKEN, R.SEL.approve + 'f'.repeat(24) + 'd4'.repeat(20) + '0'.repeat(64)), // address word with dirty high bytes
    tx(TOKEN, call('approve(address,uint256)', [SPENDER, 1n]) + '00'), // trailing byte
    { method: 'eth_signTypedData_v4', params: [OWNER, '{not json'] }, { method: 'eth_signTypedData_v4', params: [OWNER, 'x'.repeat(300000)] }, { method: 'eth_signTypedData_v4', params: [OWNER, '{}'] },
    { method: 'eth_signTypedData_v4', params: [OWNER, { primaryType: 'PermitSingle', domain: { name: 'Permit2', verifyingContract: R.PERMIT2 }, message: { details: [], spender: SPENDER } }] },
    { method: 'eth_signTypedData_v4', params: [OWNER, { primaryType: 'Permit', domain: D('x', TOKEN), message: { owner: 'zz', spender: SPENDER } }] },
    { method: 'personal_sign', params: ['0x00', OWNER] }, { method: 'eth_sendTransaction', params: [{ to: TOKEN, data: {} }] }];
  for (const b of bad) { let r; assert.doesNotThrow(() => { r = R.revocationFor(b); }, JSON.stringify(b)?.slice(0, 80)); assert.ok(['not_a_grant', 'needs_info', 'not_revocable_by_click'].includes(r.status), JSON.stringify(b)?.slice(0, 80) + ' -> ' + r.status); assert.equal(r.requests.length, 0); wallet(r); }
});

test('the result is plain data : JSON round trip, deterministic with an injected clock', () => {
  const a = R.revocationFor(typed(PERMIT_TD()), { nowSec: NOW }), b = R.revocationFor(typed(PERMIT_TD()), { nowSec: NOW });
  assert.deepEqual(a, b); assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
  const t = R.revocationFor(tx(TOKEN, call('approve(address,uint256)', [SPENDER, MAXU]))); assert.deepEqual(JSON.parse(JSON.stringify(t)), t);
});

test('revocationForRight (a right read by the engine) -> same ERC-20 / collection revocations', () => {
  const a = R.revocationForRight({ token: TOKEN, spender: SPENDER }, OWNER, '0x1');
  assert.equal(a.requests[0].params[0].data, call('approve(address,uint256)', [SPENDER, 0n]));
  const b = R.revocationForRight({ token: TOKEN2, spender: SPENDER, kind: 'erc721_all' }, OWNER);
  assert.equal(b.requests[0].params[0].data, call('setApprovalForAll(address,bool)', [SPENDER, false]));
  assert.equal(R.revocationForRight({ token: 'x', spender: SPENDER }, OWNER).status, 'not_a_grant');
});

test('the module is pure : no network, no chrome, no key, no signing method, no imports', () => {
  const src = readFileSync(join(DIR, 'revoke.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//, '');
  for (const re of [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /\bchrome\./, /\bimport\s*\(/, /^\s*import\s/m, /eth_sign(?!TypedData)\b/, /personal_sign/, /privateKey|mnemonic|secret/i, /eval\s*\(/, /Math\.random/]) assert.ok(!re.test(src), String(re));
  assert.ok(!/eth_sendRawTransaction/.test(src), 'it never sends');
});

test('texts : French, tu, no forbidden word, no promise of refund or of safety', () => {
  const all = [];
  const push = (r) => all.push(r.says, ...r.steps, ...r.limits, ...r.requests.map((q) => q.does), ...r.ifAlreadyUsed.map((q) => q.does));
  push(R.revocationFor(tx(TOKEN, call('approve(address,uint256)', [SPENDER, MAXU]))));
  push(R.revocationFor(tx(TOKEN2, call('setApprovalForAll(address,bool)', [SPENDER, true]))));
  push(R.revocationFor(typed(PERMIT_TD()), { nowSec: NOW })); push(R.revocationFor(typed(SINGLE()))); push(R.revocationFor(typed({ primaryType: 'Order', domain: D('x', TOKEN), message: {} })));
  const t = all.join('\n');
  assert.ok(!/\b(OK|ok|bloqu\w*|sûr|protégé|garanti\w*|rembours\w*)\b/.test(t), t);
  assert.ok(!/[—–]/.test(t), 'no long dash');
  assert.ok(/ne ramène pas ce qui est déjà parti/.test(t));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { keccak256, selectorOf, sha3_256Bytes, toHex, fromHex } from '../src/keccak.mjs';
import * as E from '../src/eip712.mjs';
import { parseSig } from '../src/abi.mjs';

test('keccak256("") vecteur officiel', () => assert.equal(keccak256(''), '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'));
test('keccak256("abc")', () => assert.equal(keccak256('abc'), '0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45'));
test('keccak256 renard', () => assert.equal(keccak256('The quick brown fox jumps over the lazy dog'), '0x4d741b6f1eb29cb2a9b9911c82f56fa8d73b04959d3d9d222895df6c0b28aa15'));
test('permutation multi-blocs : mode SHA3 identique à node:crypto (0..1000 octets)', () => {
  for (const n of [0, 1, 55, 135, 136, 137, 271, 272, 273, 500, 1000, 2049]) {
    const d = new Uint8Array(n).map((_, i) => (i * 7 + 3) & 255);
    assert.equal(Buffer.from(sha3_256Bytes(d)).toString('hex'), createHash('sha3-256').update(d).digest('hex'), 'n=' + n);
  }
});
const SEL = {
  'transfer(address,uint256)': '0xa9059cbb', 'approve(address,uint256)': '0x095ea7b3', 'transferFrom(address,address,uint256)': '0x23b872dd',
  'balanceOf(address)': '0x70a08231', 'allowance(address,address)': '0xdd62ed3e', 'setApprovalForAll(address,bool)': '0xa22cb465',
  'permit(address,address,uint256,uint256,uint8,bytes32,bytes32)': '0xd505accf', 'safeTransferFrom(address,address,uint256)': '0x42842e0e',
  'transferOwnership(address)': '0xf2fde38b', 'execute(bytes,bytes[],uint256)': '0x3593564c', 'aggregate3((address,bool,bytes)[])': '0x82ad56cb',
  'multicall(bytes[])': '0xac9650d8',
};
for (const [sig, sel] of Object.entries(SEL)) test(`sélecteur ${sig} = ${sel}`, () => assert.equal(selectorOf(sig), sel));
test('topics d\'événements connus', () => {
  assert.equal(keccak256('Transfer(address,address,uint256)'), '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef');
  assert.equal(keccak256('Approval(address,address,uint256)'), '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925');
  assert.equal(keccak256('ApprovalForAll(address,address,bool)'), '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31');
});
test('parseSig : signature nommée avec tuples -> forme canonique', () => {
  const s = parseSig('permit(address owner,((address token,uint160 amount,uint48 expiration,uint48 nonce) details,address spender,uint256 sigDeadline) permitSingle,bytes signature)');
  assert.equal(s.canon, 'permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)');
});
const MAIL = { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], Person: [{ name: 'name', type: 'string' }, { name: 'wallet', type: 'address' }], Mail: [{ name: 'from', type: 'Person' }, { name: 'to', type: 'Person' }, { name: 'contents', type: 'string' }] };
const mail = { types: MAIL, primaryType: 'Mail', domain: { name: 'Ether Mail', version: '1', chainId: 1, verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' }, message: { from: { name: 'Cow', wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826' }, to: { name: 'Bob', wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' }, contents: 'Hello, Bob!' } };
test('EIP-712 spec : encodeType(Mail)', () => assert.equal(E.encodeType('Mail', MAIL), 'Mail(Person from,Person to,string contents)Person(string name,address wallet)'));
test('EIP-712 spec : typeHash(Mail)', () => assert.equal(E.typeHash('Mail', MAIL), '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2'));
test('EIP-712 spec : domainSeparator', () => assert.equal(E.domainSeparator(mail.domain, MAIL), '0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f'));
test('EIP-712 spec : hashStruct(Mail)', () => assert.equal(E.hashStruct('Mail', mail.message, MAIL), '0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e'));
test('EIP-712 spec : digest final', () => assert.equal(E.digest(mail), '0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2'));
const PERMIT = [['owner', 'address'], ['spender', 'address'], ['value', 'uint256'], ['nonce', 'uint256'], ['deadline', 'uint256']].map(([name, type]) => ({ name, type }));
test('EIP-2612 PERMIT_TYPEHASH', () => assert.equal(E.typeHash('Permit', { Permit: PERMIT }), '0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9'));
test('EIP712Domain typehash (name,version,chainId,verifyingContract)', () => assert.equal(E.typeHash('EIP712Domain', { EIP712Domain: MAIL.EIP712Domain }), '0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f'));
test('DAI PERMIT_TYPEHASH', () => {
  const T = { Permit: [['holder', 'address'], ['spender', 'address'], ['nonce', 'uint256'], ['expiry', 'uint256'], ['allowed', 'bool']].map(([name, type]) => ({ name, type })) };
  assert.equal(E.typeHash('Permit', T), '0xea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb');
});
test('typehash Permit2 PermitSingle : encodeType attendu (sous-types triés)', () => {
  const T = { PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] };
  assert.equal(E.encodeType('PermitSingle', T), 'PermitSingle(PermitDetails details,address spender,uint256 sigDeadline)PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)');
});
test('fromHex/toHex aller-retour', () => assert.equal(toHex(fromHex('0x00ff10')), '0x00ff10'));

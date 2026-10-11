import { test } from 'node:test';
import assert from 'node:assert/strict';
import { results, constants, summary } from '../src/audit_selectors.mjs';
import { REGISTRY, BY_SELECTOR } from '../src/registry.mjs';
import { selectorOf } from '../src/keccak.mjs';

test('audit R1-R4 : les sélecteurs sont tous extraits (>= 40 mentions) et aucun n\'est faux', () => {
  assert.ok(summary.total_mentions >= 40, 'mentions: ' + summary.total_mentions);
  const wrong = results.filter((r) => /WRONG|UNRESOLVED/.test(r.status));
  assert.deepEqual(wrong, []);
});
test('audit : constantes 32 octets citées (slots EIP-1967 impl/admin/beacon, magic ERC-1271) toutes exactes', () => {
  for (const c of constants) assert.equal(c.status, 'OK', c.what);
});
test('registre : le sélecteur de chaque entrée est celui calculé sur la signature canonique', () => {
  for (const e of REGISTRY) assert.equal(e.selector, selectorOf(e.canon), e.id);
});
test('registre : aucune collision de sélecteur entre signatures canoniques différentes', () => {
  for (const [sel, list] of BY_SELECTOR) assert.equal(new Set(list.map((e) => e.canon)).size, 1, sel);
});
test('registre : au moins 85 signatures', () => assert.ok(REGISTRY.length >= 85, String(REGISTRY.length)));
const EXPECT = { 'ur.execute3': '0x3593564c', 'aa.handleOpsV06': '0x1fad948c', 'aa.handleOpsV07': '0x765e827f', 'p2.permitSingle': '0x2b67b570', 'p2.permitBatch': '0x2a2d80d1', 'p2.permitTransferFrom': '0x30f28b7a', 'p2.transferFrom': '0x36c78516', 'safe.execTransaction': '0x6a761202', 'safe.multiSend': '0x8d80ff0a', 'mc3.aggregate3': '0x82ad56cb', 'multicall': '0xac9650d8', 'permitDAI': '0x8fcbaf0c', 'p2.approve': '0x87517c45', 'v3.exactInputSingle02': '0x04e45aaf', 'v3.exactInputSingle': '0x414bf389', 'v2.swapExactTokensForTokens': '0x38ed1739', 'aa.execute': '0xb61d27f6', 'wethDeposit': '0xd0e30db0' };
for (const [id, sel] of Object.entries(EXPECT)) test(`sélecteur calculé de ${id} = ${sel} (valeur publique connue)`, () => assert.equal(REGISTRY.find((e) => e.id === id).selector, sel));

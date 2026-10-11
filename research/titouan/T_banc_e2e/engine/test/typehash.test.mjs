import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allTypehashes } from '../src/typehashes.mjs';
import { domainSeparator } from '../src/eip712.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const T = allTypehashes();
// Valeurs connues de mémoire (contrats officiels) ; la preuve indépendante vient des eth_call dans real.test.mjs.
const KNOWN = {
  'EIP712Domain(name,version,chainId,verifyingContract)': '0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f',
  'EIP712Domain(chainId,verifyingContract) [Safe]': '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218',
  'EIP-2612 Permit': '0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9',
  'DAI Permit': '0xea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb',
  'Permit2 PermitDetails': '0x65626cad6cb96493bf6f5ebea28756c966f023ab9e8a83a7101849d5573b3678',
  'Permit2 PermitSingle': '0xf3841cd1ff0085026a6327b620b67997ce40f282c88a8e905a7a5626e310f3d0',
  'Permit2 TokenPermissions': '0x618358ac3db8dc274f0cd8829da7e234bd48cd73c4a740aede1adec9846d06a1',
  'Seaport OrderComponents': '0xfa445660b7e21515a59617fcd68910b487aa5808b8abda3d78bc85df364b2c2f',
  'CoW GPv2Order': '0xd5a25ba2e97094ad7d83dc28a6572da797d6b3e7fc6663bd93efb789fc17e489',
  'Safe SafeTx (>=1.0)': '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8',
};
for (const [k, v] of Object.entries(KNOWN)) test(`typehash ${k}`, () => assert.equal(T[k].typeHash, v));
test('Permit2 DOMAIN_SEPARATOR Ethereum (calcul local)', () => assert.equal(domainSeparator({ name: 'Permit2', chainId: 1, verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3' }), '0x866a5aba21966af95d6c7ab78eb2b2fc913915c28be3b9aa07cc04ff903e3f28'));
test('tous les typehash exportés dans out/typehashes.json', () => {
  mkdirSync(new URL('../out/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../out/typehashes.json', import.meta.url), JSON.stringify(T, null, 1));
  assert.equal(Object.keys(T).length >= 16, true);
});

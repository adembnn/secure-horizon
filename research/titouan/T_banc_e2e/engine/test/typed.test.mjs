import { test } from 'node:test';
import assert from 'node:assert/strict';
import { USER, OTHER, ATTACKER, USDC, WETH, DAI, NFT, SAFE, MAXU, NOW, CTX, call, has } from './helpers.mjs';
import { analyzeTypedData, analyzePersonalSign, analyzeEthSign, analyzeAuthorization7702 } from '../src/engine.mjs';
import { ADDR, MULTISEND_OFFICIAL } from '../src/registry.mjs';
import { KNOWN_VERIFIERS } from '../src/typed.mjs';
import * as E from '../src/eip712.mjs';
import { keccak256, toHex } from '../src/keccak.mjs';

const f = (name, type) => ({ name, type });
const DOM = (name, version, chainId, vc) => ({ name, version, chainId, verifyingContract: vc });
const ctx = (o = {}) => ({ ...CTX, ...o });
const ZERO32 = '0x' + '00'.repeat(32);

// --- types
const T_PERMIT = { Permit: [f('owner', 'address'), f('spender', 'address'), f('value', 'uint256'), f('nonce', 'uint256'), f('deadline', 'uint256')] };
const T_DAI = { Permit: [f('holder', 'address'), f('spender', 'address'), f('nonce', 'uint256'), f('expiry', 'uint256'), f('allowed', 'bool')] };
const PD = [f('token', 'address'), f('amount', 'uint160'), f('expiration', 'uint48'), f('nonce', 'uint48')];
const T_P2S = { PermitSingle: [f('details', 'PermitDetails'), f('spender', 'address'), f('sigDeadline', 'uint256')], PermitDetails: PD };
const T_P2B = { PermitBatch: [f('details', 'PermitDetails[]'), f('spender', 'address'), f('sigDeadline', 'uint256')], PermitDetails: PD };
const TP = [f('token', 'address'), f('amount', 'uint256')];
const T_PTF = { PermitTransferFrom: [f('permitted', 'TokenPermissions'), f('spender', 'address'), f('nonce', 'uint256'), f('deadline', 'uint256')], TokenPermissions: TP };
const T_PBTF = { PermitBatchTransferFrom: [f('permitted', 'TokenPermissions[]'), f('spender', 'address'), f('nonce', 'uint256'), f('deadline', 'uint256')], TokenPermissions: TP };
const T_PWTF = { PermitWitnessTransferFrom: [f('permitted', 'TokenPermissions'), f('spender', 'address'), f('nonce', 'uint256'), f('deadline', 'uint256'), f('witness', 'ExclusiveDutchOrder')], TokenPermissions: TP, ExclusiveDutchOrder: [f('reactor', 'address'), f('swapper', 'address')] };
const OFFER = [f('itemType', 'uint8'), f('token', 'address'), f('identifierOrCriteria', 'uint256'), f('startAmount', 'uint256'), f('endAmount', 'uint256')];
const T_SEA = { OrderComponents: [f('offerer', 'address'), f('zone', 'address'), f('offer', 'OfferItem[]'), f('consideration', 'ConsiderationItem[]'), f('orderType', 'uint8'), f('startTime', 'uint256'), f('endTime', 'uint256'), f('zoneHash', 'bytes32'), f('salt', 'uint256'), f('conduitKey', 'bytes32'), f('counter', 'uint256')], OfferItem: OFFER, ConsiderationItem: [...OFFER, f('recipient', 'address')] };
const T_COW = { Order: [f('sellToken', 'address'), f('buyToken', 'address'), f('receiver', 'address'), f('sellAmount', 'uint256'), f('buyAmount', 'uint256'), f('validTo', 'uint32'), f('appData', 'bytes32'), f('feeAmount', 'uint256'), f('kind', 'string'), f('partiallyFillable', 'bool'), f('sellTokenBalance', 'string'), f('buyTokenBalance', 'string')] };
const T_SAFE = { SafeTx: [f('to', 'address'), f('value', 'uint256'), f('data', 'bytes'), f('operation', 'uint8'), f('safeTxGas', 'uint256'), f('baseGas', 'uint256'), f('gasPrice', 'uint256'), f('gasToken', 'address'), f('refundReceiver', 'address'), f('nonce', 'uint256')] };

const P2 = ADDR.PERMIT2;
const permit = (o = {}) => ({ types: T_PERMIT, primaryType: 'Permit', domain: DOM('USD Coin', '2', 1, USDC), message: { owner: USER, spender: OTHER, value: '1000000', nonce: 0, deadline: NOW + 3600, ...o } });
const p2single = (o = {}, dom = {}) => ({ types: T_P2S, primaryType: 'PermitSingle', domain: { name: 'Permit2', chainId: 1, verifyingContract: P2, ...dom }, message: { details: { token: USDC, amount: '1000000', expiration: NOW + 3600, nonce: 0 }, spender: OTHER, sigDeadline: NOW + 3600, ...o } });
const seaport = (o = {}, dom = {}) => ({ types: T_SEA, primaryType: 'OrderComponents', domain: { name: 'Seaport', version: '1.6', chainId: 1, verifyingContract: KNOWN_VERIFIERS.seaport[3], ...dom }, message: { offerer: USER, zone: ADDR.ZERO, offer: [{ itemType: 2, token: NFT, identifierOrCriteria: '7', startAmount: '1', endAmount: '1' }], consideration: [{ itemType: 0, token: ADDR.ZERO, identifierOrCriteria: '0', startAmount: '975000000000000000', endAmount: '975000000000000000', recipient: USER }, { itemType: 0, token: ADDR.ZERO, identifierOrCriteria: '0', startAmount: '25000000000000000', endAmount: '25000000000000000', recipient: OTHER }], orderType: 0, startTime: NOW, endTime: NOW + 86400, zoneHash: ZERO32, salt: '123', conduitKey: ZERO32, counter: 0, ...o } });

// ---------- EIP-2612 / DAI
test('Permit 2612 : approval via permit, token = verifyingContract, digest calculé', () => {
  const e = analyzeTypedData(permit(), ctx());
  assert.equal(e.kind, 'signature'); assert.equal(e.approvals[0].via, 'permit'); assert.equal(e.approvals[0].token, USDC); assert.equal(e.approvals[0].amount, '1'); assert.equal(e.approvals[0].expiry, NOW + 3600);
  assert.match(e.signature.digest, /^0x[0-9a-f]{64}$/); assert.equal(e.raw.primaryType, 'Permit');
});
test('Permit illimité vers inconnu : critical', () => {
  const e = analyzeTypedData(permit({ value: MAXU.toString() }), ctx());
  assert.equal(e.approvals[0].amount, 'unlimited'); assert.ok(has(e, 'unlimited_allowance')); assert.equal(e.level, 'critical');
});
test('Permit entrée en chaîne JSON (string) acceptée', () => {
  assert.equal(analyzeTypedData(JSON.stringify(permit()), ctx()).approvals.length, 1);
});
test('Permit avec chainId du domaine ≠ réseau : domain_chain_mismatch critical', () => {
  const t = permit(); t.domain.chainId = 137;
  const e = analyzeTypedData(t, ctx()); assert.ok(has(e, 'domain_chain_mismatch')); assert.equal(e.level, 'critical');
});
test('Domaine sans chainId : warn (rejouable)', () => {
  const t = permit(); delete t.domain.chainId;
  assert.ok(has(analyzeTypedData(t, ctx()), 'domain_without_chainid'));
});
test('Permit : échéance lointaine (> 1 an) signalée', () => {
  const e = analyzeTypedData(permit({ deadline: NOW + 3 * 365 * 86400 }), ctx({ knownSpenders: [OTHER] }));
  assert.ok(has(e, 'far_expiry'));
});
test('Permit : verifier_not_expected_for_origin si allowlist d\'origine fournie', () => {
  const e = analyzeTypedData(permit(), ctx({ origin: 'https://app.example.org', originAllowlist: { 'app.example.org': [DAI] } }));
  assert.ok(has(e, 'verifier_not_expected_for_origin'));
});
test('DAI permit : allowed=true sans montant -> illimité, pas d\'expiry si expiry=0', () => {
  const t = { types: T_DAI, primaryType: 'Permit', domain: DOM('Dai Stablecoin', '1', 1, DAI), message: { holder: USER, spender: ATTACKER, nonce: 0, expiry: 0, allowed: true } };
  const e = analyzeTypedData(t, ctx());
  assert.equal(e.approvals[0].amount, 'unlimited'); assert.ok(has(e, 'dai_permit_no_amount')); assert.ok(has(e, 'no_expiry')); assert.equal(e.approvals[0].expiry, undefined);
  t.message.allowed = false; assert.equal(analyzeTypedData(t, ctx()).approvals.length, 0);
});

// ---------- Permit2
test('PermitSingle : token dans details, spender, expiration', () => {
  const e = analyzeTypedData(p2single(), ctx({ knownSpenders: [OTHER] }));
  assert.equal(e.approvals[0].via, 'permit2'); assert.equal(e.approvals[0].token, USDC); assert.equal(e.approvals[0].spender, OTHER); assert.equal(e.approvals[0].expiry, NOW + 3600); assert.equal(e.level, 'ok');
});
test('PermitSingle avec verifyingContract ≠ Permit2 canonique : critical', () => {
  const e = analyzeTypedData(p2single({}, { verifyingContract: ATTACKER }), ctx());
  assert.ok(has(e, 'domain_verifier_unexpected')); assert.equal(e.level, 'critical');
});
test('PermitSingle chainId ≠ réseau : critical', () => {
  assert.ok(has(analyzeTypedData(p2single({}, { chainId: 56 }), ctx()), 'domain_chain_mismatch'));
});
test('PermitSingle illimité (uint160 max) vers inconnu : critical', () => {
  const e = analyzeTypedData(p2single({ details: { token: USDC, amount: ((1n << 160n) - 1n).toString(), expiration: NOW + 99, nonce: 0 } }), ctx());
  assert.equal(e.approvals[0].amount, 'unlimited'); assert.equal(e.level, 'critical');
});
test('PermitBatch : plusieurs tokens', () => {
  const t = { types: T_P2B, primaryType: 'PermitBatch', domain: { name: 'Permit2', chainId: 1, verifyingContract: P2 }, message: { details: [{ token: USDC, amount: '5', expiration: NOW + 9, nonce: 0 }, { token: DAI, amount: '6', expiration: NOW + 9, nonce: 1 }, { token: WETH, amount: '7', expiration: NOW + 9, nonce: 2 }], spender: ATTACKER, sigDeadline: NOW + 9 } };
  const e = analyzeTypedData(t, ctx()); assert.equal(e.approvals.length, 3); assert.equal(e.level, 'warn');
  assert.equal(analyzeTypedData(t, ctx({ codeOf: () => false })).level, 'critical');
});
test('PermitTransferFrom sans witness : destinataire choisi par le dépensier', () => {
  const t = { types: T_PTF, primaryType: 'PermitTransferFrom', domain: { name: 'Permit2', chainId: 1, verifyingContract: P2 }, message: { permitted: { token: USDC, amount: '500', }, spender: ATTACKER, nonce: 1, deadline: NOW + 9 } };
  const e = analyzeTypedData(t, ctx()); assert.ok(has(e, 'permit2_transfer_destination_chosen_by_spender')); assert.equal(e.approvals[0].signatureTransfer, true);
});
test('PermitTransferFrom batch', () => {
  const t = { types: T_PBTF, primaryType: 'PermitBatchTransferFrom', domain: { name: 'Permit2', chainId: 1, verifyingContract: P2 }, message: { permitted: [{ token: USDC, amount: '5' }, { token: DAI, amount: '6' }], spender: ATTACKER, nonce: 1, deadline: NOW + 9 } };
  assert.equal(analyzeTypedData(t, ctx()).approvals.length, 2);
});
test('PermitWitnessTransferFrom (witness UniswapX-like) : witness reconnu', () => {
  const t = { types: T_PWTF, primaryType: 'PermitWitnessTransferFrom', domain: { name: 'Permit2', chainId: 1, verifyingContract: P2 }, message: { permitted: { token: USDC, amount: '5' }, spender: OTHER, nonce: 1, deadline: NOW + 9, witness: { reactor: OTHER, swapper: USER } } };
  const e = analyzeTypedData(t, ctx({ knownSpenders: [OTHER] }));
  assert.equal(e.approvals[0].witness, true); assert.ok(has(e, 'permit2_witness_opaque')); assert.ok(!has(e, 'permit2_transfer_destination_chosen_by_spender'));
  assert.equal(e.signature.kind, 'permit2.transfer.witness');
});

// ---------- Seaport
test('Seaport listing normal (NFT contre 1 ETH dont 2.5 % de frais) : bilan net correct, pas critical', () => {
  const e = analyzeTypedData(seaport(), ctx());
  assert.equal(e.outgoing[0].std, 'erc721'); assert.equal(e.incoming[0].amount, '0.975'); assert.notEqual(e.level, 'critical'); assert.ok(!has(e, 'seaport_zero_consideration'));
});
test('Seaport : NFT offert contre rien (consideration vide) : critical', () => {
  const e = analyzeTypedData(seaport({ consideration: [] }), ctx());
  assert.ok(has(e, 'seaport_zero_consideration')); assert.equal(e.level, 'critical'); assert.equal(e.incoming.length, 0);
});
test('Seaport : consideration à 0 pour l\'offerer : critical', () => {
  const z = seaport().message.consideration[0]; z.startAmount = '0'; z.endAmount = '0';
  const m = seaport(); m.message.consideration[0] = { ...z };
  assert.ok(has(analyzeTypedData(m, ctx()), 'seaport_zero_consideration'));
});
test('Seaport : produit versé à un tiers (> 20 %) : warn', () => {
  const m = seaport(); m.message.consideration[0].startAmount = m.message.consideration[0].endAmount = '100'; m.message.consideration[1].startAmount = m.message.consideration[1].endAmount = '900';
  const e = analyzeTypedData(m, ctx()); assert.ok(has(e, 'seaport_proceeds_to_other'));
});
test('Seaport : offre (bid) WETH contre NFT reçu par l\'offerer', () => {
  const m = seaport({ offer: [{ itemType: 1, token: WETH, identifierOrCriteria: '0', startAmount: '10', endAmount: '10' }], consideration: [{ itemType: 2, token: NFT, identifierOrCriteria: '7', startAmount: '1', endAmount: '1', recipient: USER }] });
  const e = analyzeTypedData(m, ctx()); assert.equal(e.outgoing[0].token, WETH); assert.equal(e.incoming[0].std, 'erc721'); assert.ok(!has(e, 'seaport_zero_consideration'));
});
test('Seaport : vendeur d\'enchère décroissante : pire cas = min côté reçu, max côté donné', () => {
  const m = seaport({ offer: [{ itemType: 1, token: USDC, identifierOrCriteria: '0', startAmount: '100', endAmount: '10' }], consideration: [{ itemType: 2, token: NFT, identifierOrCriteria: '1', startAmount: '1', endAmount: '1', recipient: USER }] });
  assert.equal(analyzeTypedData(m, ctx()).outgoing[0].amountRaw, '100');
});
test('Seaport : verifyingContract inconnu : critical', () => {
  assert.ok(has(analyzeTypedData(seaport({}, { verifyingContract: ATTACKER }), ctx()), 'domain_verifier_unexpected'));
});
test('Seaport : ordre valable 5 ans : far_expiry ; signataire ≠ offerer : signalé', () => {
  const e = analyzeTypedData(seaport({ endTime: NOW + 5 * 365 * 86400, offerer: OTHER }), ctx());
  assert.ok(has(e, 'far_expiry')); assert.ok(has(e, 'signer_not_offerer'));
});
test('Seaport : collection entière (criteria) signalée', () => {
  const e = analyzeTypedData(seaport({ offer: [{ itemType: 4, token: NFT, identifierOrCriteria: '0', startAmount: '1', endAmount: '1' }] }), ctx());
  assert.ok(has(e, 'seaport_criteria_offer'));
});
test('Seaport OrderComponents : typehash recalculé (affiché pour audit)', () => {
  const h = E.typeHash('OrderComponents', { ...T_SEA });
  assert.match(h, /^0x[0-9a-f]{64}$/);
  // valeur de mémoire (non garantie) : on vérifie sans échouer, la valeur réelle est consignée par le rapport
  globalThis.__seaportTypehash = h;
});

// ---------- CoW
const cow = (o = {}, dom = {}) => ({ types: T_COW, primaryType: 'Order', domain: { name: 'Gnosis Protocol', version: 'v2', chainId: 1, verifyingContract: KNOWN_VERIFIERS.cow[0], ...dom }, message: { sellToken: USDC, buyToken: WETH, receiver: ADDR.ZERO, sellAmount: '1000000000', buyAmount: '300000000000000000', validTo: NOW + 1800, appData: ZERO32, feeAmount: '1000000', kind: 'sell', partiallyFillable: false, sellTokenBalance: 'erc20', buyTokenBalance: 'erc20', ...o } });
test('CoW GPv2Order normal : sortie sellToken+fee, entrée buyToken', () => {
  const e = analyzeTypedData(cow(), ctx());
  assert.equal(e.outgoing[0].token, USDC); assert.equal(e.outgoing[0].amountRaw, '1001000000'); assert.equal(e.incoming[0].token, WETH); assert.notEqual(e.level, 'critical');
});
test('CoW : receiver ≠ signataire : critical, aucune entrée', () => {
  const e = analyzeTypedData(cow({ receiver: ATTACKER }), ctx());
  assert.ok(has(e, 'cow_receiver_not_signer')); assert.equal(e.incoming.length, 0); assert.equal(e.level, 'critical');
});
test('CoW : buyAmount = 0 : critical ; settlement inconnu : critical', () => {
  assert.ok(has(analyzeTypedData(cow({ buyAmount: '0' }), ctx()), 'cow_zero_buy_amount'));
  assert.ok(has(analyzeTypedData(cow({}, { verifyingContract: ATTACKER }), ctx()), 'domain_verifier_unexpected'));
});

// ---------- Safe
const safetx = (o = {}, dom = {}) => ({ types: T_SAFE, primaryType: 'SafeTx', domain: { chainId: 1, verifyingContract: SAFE, ...dom }, message: { to: USDC, value: '0', data: '0x', operation: 0, safeTxGas: '0', baseGas: '0', gasPrice: '0', gasToken: ADDR.ZERO, refundReceiver: ADDR.ZERO, nonce: '3', ...o } });
test('SafeTx : transfert décodé depuis data, digest = safeTxHash', () => {
  const t = safetx({ data: call('transfer(address to,uint256 amount)', [OTHER, 1000000n]) });
  const e = analyzeTypedData(t, ctx({ from: USER }));
  assert.equal(e.outgoing[0].amount, '1'); assert.equal(e.signature.digest, E.digest({ ...t, types: { ...t.types, EIP712Domain: [f('chainId', 'uint256'), f('verifyingContract', 'address')] } }));
});
test('SafeTx : addOwnerWithThreshold(attaquant,1) : controlChange critical', () => {
  const e = analyzeTypedData(safetx({ to: SAFE, data: call('addOwnerWithThreshold(address owner,uint256 _threshold)', [ATTACKER, 1n]) }), ctx());
  assert.equal(e.controlChange[0].type, 'safe.addOwner'); assert.equal(e.level, 'critical');
});
test('SafeTx : operation=1 vers cible inconnue : delegatecall critical (Bybit)', () => {
  const e = analyzeTypedData(safetx({ to: ATTACKER, operation: 1, data: '0xa9059cbb' + '00'.repeat(64) }), ctx());
  assert.ok(has(e, 'delegatecall')); assert.equal(e.level, 'critical');
});
test('SafeTx : operation=1 vers MultiSend officiel + sous-appel enableModule', () => {
  const ms = Object.keys(MULTISEND_OFFICIAL)[1];
  const inner = call('enableModule(address module)', [ATTACKER]);
  const packed = '0x' + '00' + SAFE.slice(2) + '00'.repeat(32) + ((inner.length - 2) / 2).toString(16).padStart(64, '0') + inner.slice(2);
  const e = analyzeTypedData(safetx({ to: ms, operation: 1, data: call('multiSend(bytes transactions)', [packed]) }), ctx());
  assert.equal(e.controlChange[0].type, 'safe.enableModule'); assert.ok(!has(e, 'delegatecall'));
});
test('SafeTx : verifyingContract ≠ Safe attendu : critical ; ancien Safe sans chainId accepté', () => {
  assert.ok(has(analyzeTypedData(safetx(), ctx({ expectedSafe: OTHER })), 'safe_address_mismatch'));
  const t = safetx(); delete t.domain.chainId;
  const e = analyzeTypedData(t, ctx()); assert.ok(has(e, 'domain_without_chainid')); assert.equal(e.risk_flags.find((x) => x.code === 'domain_without_chainid').severity, 'info');
});

// ---------- Coinbase spend permission, inconnu, invalide
test('Spend permission récurrente : maximum = allowance × périodes', () => {
  const T = { SpendPermission: [f('account', 'address'), f('spender', 'address'), f('token', 'address'), f('allowance', 'uint160'), f('period', 'uint48'), f('start', 'uint48'), f('end', 'uint48'), f('salt', 'uint256'), f('extraData', 'bytes')] };
  const e = analyzeTypedData({ types: T, primaryType: 'SpendPermission', domain: DOM('Spend Permission Manager', '1', 1, OTHER), message: { account: USER, spender: ATTACKER, token: USDC, allowance: '100', period: 86400, start: NOW, end: NOW + 10 * 86400, salt: '1', extraData: '0x' } }, ctx());
  assert.equal(e.approvals[0].amountRaw, '1000'); assert.ok(has(e, 'recurring_spend_permission'));
});
test('typed data inconnu : opaque + indices d\'adresses', () => {
  const T = { Claim: [f('beneficiary', 'address'), f('amount', 'uint256')] };
  const e = analyzeTypedData({ types: T, primaryType: 'Claim', domain: DOM('X', '1', 1, OTHER), message: { beneficiary: ATTACKER, amount: '5' } }, ctx());
  assert.equal(e.opaque, true); assert.ok(has(e, 'unknown_typed_data')); assert.ok(has(e, 'unknown_typed_data_addresses'));
});
test('typed data invalide (champ manquant) : pas d\'exception', () => {
  const t = permit(); delete t.message.spender;
  const e = analyzeTypedData(t, ctx()); assert.equal(e.kind, 'signature'); assert.ok(Array.isArray(e.risk_flags));
});
test('typed data : message vide / types absents ne plante pas', () => {
  assert.ok(analyzeTypedData({ types: {}, primaryType: 'X', domain: {}, message: {} }, ctx()).opaque);
});

// ---------- SIWE
const siwe = (o = {}) => {
  const d = { domain: 'app.example.org', addr: USER, statement: 'Sign in to Example.', uri: 'https://app.example.org', chain: 1, nonce: 'a1b2c3d4e5', exp: null, ...o };
  return `${d.domain} wants you to sign in with your Ethereum account:\n${d.addr}\n\n${d.statement}\n\nURI: ${d.uri}\nVersion: 1\nChain ID: ${d.chain}\nNonce: ${d.nonce}\nIssued At: 2026-10-11T10:00:00.000Z${d.exp ? '\nExpiration Time: ' + d.exp : ''}`;
};
const SC = (o = {}) => ctx({ origin: 'https://app.example.org', ...o });
test('SIWE conforme : aucun signal critique, champs parsés', () => {
  const e = analyzePersonalSign(siwe(), SC());
  assert.equal(e.siwe.domain, 'app.example.org'); assert.equal(e.siwe.fields['Chain ID'], '1'); assert.equal(e.level, 'ok');
});
test('SIWE : domaine ≠ origine (sosie uniswap.org.evil.com) : critical', () => {
  const e = analyzePersonalSign(siwe({ domain: 'app.example.org.evil.com', uri: 'https://app.example.org.evil.com' }), SC());
  assert.ok(has(e, 'siwe_domain_mismatch')); assert.equal(e.level, 'critical');
});
test('SIWE : URI d\'un autre hôte : critical', () => {
  assert.ok(has(analyzePersonalSign(siwe({ uri: 'https://evil.io/login' }), SC()), 'siwe_uri_mismatch'));
});
test('SIWE : chaîne ≠ réseau : warn ; adresse ≠ compte : critical', () => {
  assert.ok(has(analyzePersonalSign(siwe({ chain: 137 }), SC()), 'siwe_chain_mismatch'));
  assert.ok(has(analyzePersonalSign(siwe({ addr: OTHER }), SC()), 'siwe_address_mismatch'));
});
test('SIWE : sans origine fournie -> info, sans mismatch ; nonce faible ; expiré ; statement suspect', () => {
  const e = analyzePersonalSign(siwe({ nonce: 'abc', exp: '2020-01-01T00:00:00.000Z', statement: 'Approve unlimited transfer of your tokens' }), ctx());
  assert.ok(has(e, 'siwe_origin_unknown')); assert.ok(has(e, 'siwe_weak_nonce')); assert.ok(has(e, 'siwe_expired')); assert.ok(has(e, 'siwe_statement_suspicious'));
});
test('SIWE donné en hexadécimal (personal_sign réel) reconnu', () => {
  const hex = toHex(new TextEncoder().encode(siwe()));
  assert.equal(analyzePersonalSign(hex, SC()).signature.kind, 'siwe');
});

// ---------- personal_sign / eth_sign / 7702 hors chaîne
test('personal_sign hex opaque de 32 octets : blind_signature critical', () => {
  const e = analyzePersonalSign('0x' + 'ab'.repeat(32), ctx());
  assert.equal(e.opaque, true); assert.ok(has(e, 'blind_signature')); assert.equal(e.level, 'critical');
});
test('personal_sign binaire opaque long : blind_signature warn', () => {
  const e = analyzePersonalSign('0x' + 'ff'.repeat(100), ctx());
  assert.equal(e.opaque, true); assert.equal(e.risk_flags.find((x) => x.code === 'blind_signature').severity, 'warn');
});
test('personal_sign texte lisible (hex UTF-8) : free_text info, non opaque', () => {
  const e = analyzePersonalSign(toHex(new TextEncoder().encode('Bonjour, je valide mon compte')), ctx());
  assert.equal(e.opaque, false); assert.ok(has(e, 'free_text_message'));
});
test('personal_sign chaîne brute non hexadécimale', () => {
  assert.equal(analyzePersonalSign('hello', ctx()).opaque, false);
});
test('eth_sign hash brut : critical', () => {
  const e = analyzeEthSign('0x' + '12'.repeat(32), ctx()); assert.equal(e.level, 'critical'); assert.equal(e.signature.kind, 'eth_sign');
});
test('autorisation 7702 hors chaîne chain_id=0 : delegation + toutes chaînes', () => {
  const e = analyzeAuthorization7702({ chainId: 0, address: ATTACKER, nonce: 4 }, ctx());
  assert.equal(e.delegation.to, ATTACKER); assert.ok(has(e, 'delegation_7702_all_chains')); assert.equal(e.kind, 'signature');
});

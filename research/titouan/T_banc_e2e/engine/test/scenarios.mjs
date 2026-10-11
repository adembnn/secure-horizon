// Scénarios Intent x transaction/signature, exécutés par le comparateur d'Adem (vendor) et par nos règles objectives.
import { an, call, encodeParams, USER, OTHER, ATTACKER, USDC, WETH, DAI, NFT, SAFE, ROUTER, MAXU, NOW, CTX } from './helpers.mjs';
import { analyzeTransaction, analyzeTypedData, analyzePersonalSign } from '../src/engine.mjs';
import { ADDR, MULTISEND_OFFICIAL } from '../src/registry.mjs';
import { KNOWN_VERIFIERS } from '../src/typed.mjs';
import { compare } from '../vendor/compare.ts';

const PAUL = '0x9a8b7c6d5e4f30211203f4e5d6c7b8a9908a7b6c';
// adresse sosie : mêmes 3 premiers et 4 derniers hex que PAUL (pas 4+4)
const POISON34 = '0x9a8' + 'ffffffffffffffffffffffffffffffffff'.slice(0, 33) + PAUL.slice(-4);
const POISON44 = '0x9a8b' + 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'.slice(0, 32) + PAUL.slice(-4);
const intent = (kind, o = {}) => ({ kind, declaredAt: NOW * 1000, ...o });
const approve = (sp, v) => call('approve(address spender,uint256 amount)', [sp, v]);
const transfer = (to, v) => call('transfer(address to,uint256 amount)', [to, v]);
const hist = [{ address: PAUL, ts: NOW - 86400 * 30, direction: 'out' }];
const poisonedHist = [{ address: PAUL, ts: NOW - 600, direction: 'out' }, { address: POISON34, ts: NOW - 60, direction: 'in', dust: true }];
const f = (name, type) => ({ name, type });
const v3in = (rec, amt, min, path, payer) => encodeParams('address recipient,uint256 amt,uint256 limit,bytes path,bool payerIsUser', [rec, amt, min, path, payer]);
const path = (a, b) => '0x' + a.slice(2) + '0001f4' + b.slice(2);
const UR = (cmds, inputs, ctx = {}) => an(ROUTER, call('execute(bytes commands,bytes[] inputs,uint256 deadline)', [cmds, inputs, BigInt(NOW + 100)]), 0n, ctx);
const hasFlag = (e, c) => e.risk_flags.some((x) => x.code === c);

export function scenarios() {
  const S = [];
  const add = (id, desc, it, eff, expected, note = '') => S.push({ id, desc, intent: it, effects: eff, expected, note });
  const pay = intent('pay_someone', { token: 'USDC', amount: '100', counterpartyLabel: 'Paul', counterpartyAddress: PAUL });

  add('S01', 'pay_someone : 100 USDC à Paul (légitime)', pay, an(USDC, transfer(PAUL, 100_000_000n), 0n, { history: hist }), ['ok']);
  add('S02', 'pay_someone : approve illimité vers un inconnu', pay, an(USDC, approve(ATTACKER, MAXU)), ['critical']);
  add('S03', 'pay_someone : destinataire différent de Paul', pay, an(USDC, transfer(ATTACKER, 100_000_000n)), ['critical']);
  add('S04', 'pay_someone : 1000 USDC au lieu de 100', pay, an(USDC, transfer(PAUL, 1_000_000_000n), 0n, { history: hist }), ['critical']);
  add('S05', 'pay_someone (sans adresse choisie) : sosie 3+4 de Paul vu par notre moteur', intent('pay_someone', { token: 'USDC', amount: '100', counterpartyLabel: 'Paul' }), an(USDC, transfer(POISON34, 100_000_000n), 0n, { history: poisonedHist, now: NOW }), ['critical'], 'notre moteur renseigne lookalikeOf (3+4)');
  const e6 = an(USDC, transfer(POISON34, 100_000_000n), 0n, { history: poisonedHist, now: NOW });
  e6.counterparties.forEach((c) => delete c.lookalikeOf);
  add('S06', 'même sosie 3+4, mais moteur calé sur la règle 4+4 d\'Adem (pas de lookalikeOf)', intent('pay_someone', { token: 'USDC', amount: '100', counterpartyLabel: 'Paul' }), e6, ['critical'], 'isLookalike() de compare.ts n\'est jamais appelée : tout dépend du moteur');
  add('S07', 'send_to_my_account : adresse déjà utilisée', intent('send_to_my_account'), an(USDC, transfer(PAUL, 5_000_000n), 0n, { history: hist }), ['ok']);
  add('S08', 'send_to_my_account : adresse jamais vue', intent('send_to_my_account'), an(USDC, transfer(ATTACKER, 5_000_000n), 0n, { history: hist }), ['critical']);
  add('S09', 'buy_or_swap : swap UR, sortie vers soi', intent('buy_or_swap'), UR('0x00', [v3in(ADDR.UR_MSG_SENDER, 1_000_000n, 2n * 10n ** 14n, path(USDC, WETH), true)], { history: hist }), ['ok']);
  add('S10', 'buy_or_swap : sortie du swap vers un tiers', intent('buy_or_swap'), UR('0x00', [v3in(ATTACKER, 1_000_000n, 2n * 10n ** 14n, path(USDC, WETH), true)]), ['critical']);
  add('S11', 'buy_or_swap : approve illimité vers routeur connu', intent('buy_or_swap'), an(USDC, approve(ROUTER, MAXU), 0n, { codeOf: () => true }), ['ok', 'warn'], 'routeur connu : au plus warn');
  add('S12', 'buy_or_swap : approve illimité vers un compte externe (EOA)', intent('buy_or_swap'), an(USDC, approve(ATTACKER, MAXU), 0n, { codeOf: () => false }), ['critical'], 'Adem n\'a pas de liste de routeurs ni de notion EOA');
  add('S13', 'buy_or_swap : permit2 vers contrat de 10 blocs', intent('buy_or_swap'), (() => { const e = an(ADDR.PERMIT2, call('approve(address token,address spender,uint160 amount,uint48 expiration)', [USDC, ATTACKER, 5n, BigInt(NOW + 99)]), 0n, { ageBlocks: { [ATTACKER]: 10 } }); return e; })(), ['critical'], 'via=permit2 requis par la règle d\'Adem : approve Permit2 ici');
  add('S14', 'connect : setApprovalForAll', intent('connect_or_accept_offer'), an(NFT, call('setApprovalForAll(address operator,bool approved)', [ATTACKER, true])), ['critical']);
  const permitTd = { types: { Permit: [f('owner', 'address'), f('spender', 'address'), f('value', 'uint256'), f('nonce', 'uint256'), f('deadline', 'uint256')] }, primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: 1, verifyingContract: USDC }, message: { owner: USER, spender: ATTACKER, value: MAXU.toString(), nonce: 0, deadline: NOW + 99 } };
  add('S15', 'connect : signature Permit illimité', intent('connect_or_accept_offer'), analyzeTypedData(permitTd, CTX), ['critical']);
  add('S16', 'connect : tx 7702 vers un inconnu', intent('connect_or_accept_offer'), analyzeTransaction({ from: USER, to: USER, input: '0x', type: '0x4', authorizationList: [{ chainId: 0, address: ATTACKER, nonce: 0 }] }, CTX), ['critical']);
  const OFFER = [f('itemType', 'uint8'), f('token', 'address'), f('identifierOrCriteria', 'uint256'), f('startAmount', 'uint256'), f('endAmount', 'uint256')];
  const seaTd = { types: { OrderComponents: [f('offerer', 'address'), f('zone', 'address'), f('offer', 'OfferItem[]'), f('consideration', 'ConsiderationItem[]'), f('orderType', 'uint8'), f('startTime', 'uint256'), f('endTime', 'uint256'), f('zoneHash', 'bytes32'), f('salt', 'uint256'), f('conduitKey', 'bytes32'), f('counter', 'uint256')], OfferItem: OFFER, ConsiderationItem: [...OFFER, f('recipient', 'address')] }, primaryType: 'OrderComponents', domain: { name: 'Seaport', version: '1.6', chainId: 1, verifyingContract: KNOWN_VERIFIERS.seaport[3] }, message: { offerer: USER, zone: ADDR.ZERO, offer: [{ itemType: 2, token: NFT, identifierOrCriteria: '7', startAmount: '1', endAmount: '1' }], consideration: [], orderType: 0, startTime: NOW, endTime: NOW + 999, zoneHash: '0x' + '00'.repeat(32), salt: '1', conduitKey: '0x' + '00'.repeat(32), counter: 0 } };
  add('S17', 'connect : ordre Seaport sans contrepartie', intent('connect_or_accept_offer'), analyzeTypedData(seaTd, CTX), ['critical']);
  add('S18', 'asked_by_someone : transfert', intent('asked_by_someone', { askedBy: 'support' }), an(USDC, transfer(ATTACKER, 5n)), ['critical']);
  add('S19', 'pay_someone : en réalité transferOwnership (changement de contrôle)', pay, an(OTHER, call('transferOwnership(address newOwner)', [ATTACKER])), ['critical'], 'Adem ne regarde ni controlChange ni risk_flags');
  add('S20', 'pay_someone : appel de contrat opaque (sélecteur inconnu)', pay, an(OTHER, '0xdeadbeef' + '00'.repeat(32)), ['warn', 'critical'], 'aucun champ opaque dans le schéma Effects');
  add('S21', 'connect : personal_sign opaque de 32 octets', intent('connect_or_accept_offer'), analyzePersonalSign('0x' + 'cd'.repeat(32), CTX), ['warn', 'critical'], 'blind signing invisible pour Adem');
  add('S22', 'pay_someone : transfert légitime vers un contrat de 20 blocs', pay, an(USDC, transfer(PAUL, 100_000_000n), 0n, { history: hist, ageBlocks: { [PAUL]: 20 } }), ['ok'], 'nos mesures : l\'âge du contrat ne sépare pas (R bench) -> warn = fatigue');
  const e23 = UR('0x00', [v3in(ADDR.UR_MSG_SENDER, 1_000_000n, 0n, path(USDC, WETH), true)]);
  add('S23', 'buy_or_swap : swap sans minimum de réception (slippage 100 %)', intent('buy_or_swap'), e23, ['warn', 'critical'], 'règle slippage absente chez Adem');
  const siweMsg = `app.example.org.evil.com wants you to sign in with your Ethereum account:\n${USER}\n\nSign in.\n\nURI: https://app.example.org.evil.com\nVersion: 1\nChain ID: 1\nNonce: a1b2c3d4e5f6\nIssued At: 2026-10-11T10:00:00.000Z`;
  add('S24', 'connect : SIWE pour un domaine sosie', intent('connect_or_accept_offer'), analyzePersonalSign(siweMsg, { ...CTX, origin: 'https://app.example.org' }), ['critical'], 'comparaison domaine/origine absente chez Adem');
  const sf = call('execTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures)', [ATTACKER, 0n, '0x12345678', 1n, 0n, 0n, 0n, ADDR.ZERO, ADDR.ZERO, '0x11']);
  add('S25', 'pay_someone : Safe execTransaction en delegatecall vers un inconnu', pay, an(SAFE, sf), ['critical'], 'appel délégué invisible pour Adem');
  add('S26', 'send_to_my_account : approbation', intent('send_to_my_account'), an(USDC, approve(ATTACKER, 5n)), ['critical']);
  add('S27', 'pay_someone : approbation cachée dans multicall(bytes[])', pay, an(ROUTER, call('multicall(bytes[] data)', [[transfer(PAUL, 100_000_000n), approve(ATTACKER, MAXU)]]), 0n, { history: hist }), ['critical'], 'détecté seulement grâce au décodage récursif');
  const daiTd = { types: { Permit: [f('holder', 'address'), f('spender', 'address'), f('nonce', 'uint256'), f('expiry', 'uint256'), f('allowed', 'bool')] }, primaryType: 'Permit', domain: { name: 'Dai Stablecoin', version: '1', chainId: 1, verifyingContract: DAI }, message: { holder: USER, spender: ATTACKER, nonce: 0, expiry: 0, allowed: true } };
  add('S28', 'pay_someone : DAI permit (illimité sans montant)', pay, analyzeTypedData(daiTd, CTX), ['critical']);
  add('S29', 'pay_someone : 80 % du solde', pay, an(USDC, transfer(PAUL, 100_000_000n), 0n, { history: hist, balances: { [USDC]: '125000000' } }), ['warn'], 'signal transverse de la doc');
  add('S30', 'pay_someone : PermitSingle Permit2 hors chaîne vers inconnu', pay, analyzeTypedData({ types: { PermitSingle: [f('details', 'PermitDetails'), f('spender', 'address'), f('sigDeadline', 'uint256')], PermitDetails: [f('token', 'address'), f('amount', 'uint160'), f('expiration', 'uint48'), f('nonce', 'uint48')] }, primaryType: 'PermitSingle', domain: { name: 'Permit2', chainId: 1, verifyingContract: ADDR.PERMIT2 }, message: { details: { token: USDC, amount: '5', expiration: NOW + 9, nonce: 0 }, spender: ATTACKER, sigDeadline: NOW + 9 } }, CTX), ['critical']);
  return S;
}

const rank = { ok: 0, warn: 1, critical: 2 };
export function runScenarios() {
  return scenarios().map((s) => {
    const v = compare(s.intent, s.effects);
    const ours = s.effects.level;
    const combined = rank[v.level] >= rank[ours] ? v.level : ours;
    const pass = (lvl) => s.expected.includes(lvl);
    return { id: s.id, desc: s.desc, kind: s.intent.kind, expected: s.expected.join('|'), adem: v.level, ademCodes: v.reasons.map((r) => r.code).join(','), ours, oursCodes: s.effects.risk_flags.filter((x) => x.severity !== 'info').map((x) => x.code).join(','), combined, ademPass: pass(v.level), oursPass: pass(ours), combinedPass: pass(combined), note: s.note };
  });
}

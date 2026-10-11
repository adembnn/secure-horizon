// Jury red team: honest Avalanche operations (SYNTHETIC users, real public protocol addresses).
import { writeFileSync } from 'node:fs';
const OUT = process.argv[2];
const ME = '0x4f3a9c2e8b1d7f6a5c0e9b8d2a1f7c6e5b4a3d21';
const MY_LEDGER = '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d';
const PAUL = '0x2b7c41e0f9a83d6c5b1e2f4a7d9c8b3e6f0a1d55';
const LEA = '0x6d1e9a3c7b2f5e8d4a0c6b9f1e3d7a2c5b8e4f90';
const LANDLORD = '0x8c3f2a1b9e7d6c5a4f3e2d1c0b9a8f7e6d5c4b32';
const NEWCOLL = '0x3e5a7c9b1d2f4e6a8c0b2d4f6a8c0e2b4d6f8a13';
const BINANCE_DEP = '0x5a9e1c3b7d2f4a6e8c0b1d3f5a7c9e2b4d6f8a01';
const COINBASE_DEP = '0x1c7e3a5b9d2f4c6e8a0b3d5f7a9c1e3b5d7f9a27';
const NFT = '0x7b4e2c9a1d3f5e8c6a0b2d4f6e8a1c3b5d7f9e44';

const T = {
  WAVAX: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', 'USDC.e': '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
  'WETH.e': '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', 'BTC.b': '0x152b9d0FdC40C096757F570A51E494bd4b943E50',
  JOE: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd', sAVAX: '0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE',
};
const DEC = { WAVAX: 18, USDC: 6, USDT: 6, 'USDC.e': 6, 'WETH.e': 18, 'BTC.b': 8, JOE: 18, sAVAX: 18 };
const P = {
  joeV1: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4', lb21: '0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30',
  lb22: '0x18556DA13313f3532c54711497A8FedAC273220E', pangolin: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106',
  ur: '0x4Dae2f939ACf50408e13d58534Ff8c2776d45265', aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  aaveGateway: '0xa938d8536aEed1Bd48f548380394Ab30Aa11B00E', qiAVAX: '0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c',
  qiUSDCn: '0xB715808a78F6041E46d61Cb123C9B4A27056AE9C', cctp: '0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982',
  odos: '0x88de50B233052e4Fb783d4F6db78Cc34fEa3e9FC', permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  inch6: '0x111111125421cA6dc452d289314280a0f8842A65', paraswap: '0x6A000F20005980200259B80c5102003040001068',
};
const SEAPORT = '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC';
const OS_CONDUIT = '0x1E0049783F008A0085193E00003D00cd54003c71';
const OS_FEE = '0x0000a26b00c1F0DF003000390027140000fAa719';

// Registry shipped with the product (same as the public bench); sAVAX/Core/Seaport intentionally only where noted
const KNOWN = Object.entries(P).map(([name, address]) => ({ name, address }));
const REG = Object.entries(T).map(([symbol, address]) => ({ address, symbol, decimals: DEC[symbol] }));
const BOOK = [
  { label: 'Paul', address: PAUL, kind: 'contact' }, { label: 'Léa', address: LEA, kind: 'contact' },
  { label: 'Propriétaire', address: LANDLORD, kind: 'contact' },
  { label: 'Mon Ledger', address: MY_LEDGER, kind: 'self' }, { label: 'Mon Binance', address: BINANCE_DEP, kind: 'exchange' },
];
const HIST = [
  { address: PAUL, direction: 'sortie', amount: '20', minutes_ago: 60 * 24 * 12 },
  { address: LEA, direction: 'sortie', amount: '35', minutes_ago: 60 * 24 * 40 },
  { address: MY_LEDGER, direction: 'sortie', amount: '100', minutes_ago: 60 * 24 * 90 },
  { address: BINANCE_DEP, direction: 'sortie', amount: '250', minutes_ago: 60 * 24 * 7 },
  { address: LANDLORD, direction: 'sortie', amount: '900', minutes_ago: 60 * 24 * 30 },
];
const FACTS = {
  [PAUL]: { isContract: false, firstSeenByUser: false }, [LEA]: { isContract: false, firstSeenByUser: false },
  [LANDLORD]: { isContract: false, firstSeenByUser: false }, [MY_LEDGER]: { isContract: false, firstSeenByUser: false },
  [BINANCE_DEP]: { isContract: false, firstSeenByUser: false },
};

const MAX = (1n << 256n) - 1n;
const hx = (n) => '0x' + BigInt(n).toString(16);
const w = (n) => BigInt(n).toString(16).padStart(64, '0');
const a = (x) => x.toLowerCase().replace(/^0x/, '').padStart(64, '0');
const units = (v, d) => { const [i, f = ''] = String(v).split('.'); return BigInt(i + f.padEnd(d, '0').slice(0, d)); };
const AV = (v) => units(v, 18);
const DL = 1792000000n; // deadline
const declaredAt = 1791720000000;

function tx(to, data, value = 0n) { return { method: 'eth_sendTransaction', params: [{ from: ME, to, data, value: hx(value), chainId: '0xa86a' }] }; }
const approve = (tok, sp, amt) => tx(tok, '0x095ea7b3' + a(sp) + w(amt));
const transfer = (tok, to, amt) => tx(tok, '0xa9059cbb' + a(to) + w(amt));
// path-based router calls (uniV2 style)
function pathEnc(path) { return w(path.length) + path.map(a).join(''); }
const swapExactAVAXForTokens = (router, minOut, path, to = ME) =>
  '0xa2a1623d' + w(minOut) + w(0x80) + a(to) + w(DL) + pathEnc(path);
const swapExactTokensForAVAX = (router, amtIn, minOut, path, to = ME) =>
  '0x676528d1' + w(amtIn) + w(minOut) + w(0xa0) + a(to) + w(DL) + pathEnc(path);
const swapExactTokensForTokens = (amtIn, minOut, path, to = ME) =>
  '0x38ed1739' + w(amtIn) + w(minOut) + w(0xa0) + a(to) + w(DL) + pathEnc(path);

function typed(domain, types, primaryType, message) {
  const eip = { types: { EIP712Domain: Object.entries({ name: 'string', version: 'string', chainId: 'uint256', verifyingContract: 'address' }).filter(([k]) => domain[k] !== undefined).map(([name, type]) => ({ name, type })), ...types }, domain, primaryType, message };
  return { method: 'eth_signTypedData_v4', params: [ME, JSON.stringify(eip)] };
}
const permit2Single = (token, amount, spender, expiration) => typed(
  { name: 'Permit2', chainId: 43114, verifyingContract: P.permit2 },
  { PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }],
    PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }] },
  'PermitSingle', { details: { token, amount: amount.toString(), expiration: String(expiration), nonce: '0' }, spender, sigDeadline: '1791721800' });
const permit2612 = (token, name, version, spender, value) => typed(
  { name, version, chainId: 43114, verifyingContract: token },
  { Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  'Permit', { owner: ME, spender, value: value.toString(), nonce: '3', deadline: '1791721800' });
const snapshotVote = (space, choice) => typed({ name: 'snapshot', version: '0.1.4' },
  { Vote: [{ name: 'from', type: 'address' }, { name: 'space', type: 'string' }, { name: 'timestamp', type: 'uint64' }, { name: 'proposal', type: 'bytes32' }, { name: 'choice', type: 'uint32' }, { name: 'reason', type: 'string' }, { name: 'app', type: 'string' }, { name: 'metadata', type: 'string' }] },
  'Vote', { from: ME, space, timestamp: '1791720000', proposal: '0x' + 'ab'.repeat(32), choice: String(choice), reason: '', app: 'snapshot-v2', metadata: '{}' });
function seaportListing(tokenId, priceAvax) {
  const price = AV(priceAvax); const fee = price / 40n;
  const OfferItem = [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }];
  const ConsiderationItem = [...OfferItem, { name: 'recipient', type: 'address' }];
  return typed({ name: 'Seaport', version: '1.5', chainId: 43114, verifyingContract: SEAPORT },
    { OrderComponents: [{ name: 'offerer', type: 'address' }, { name: 'zone', type: 'address' }, { name: 'offer', type: 'OfferItem[]' }, { name: 'consideration', type: 'ConsiderationItem[]' }, { name: 'orderType', type: 'uint8' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }, { name: 'zoneHash', type: 'bytes32' }, { name: 'salt', type: 'uint256' }, { name: 'conduitKey', type: 'bytes32' }, { name: 'counter', type: 'uint256' }],
      OfferItem, ConsiderationItem }, 'OrderComponents', {
      offerer: ME, zone: '0x0000000000000000000000000000000000000000',
      offer: [{ itemType: '2', token: NFT, identifierOrCriteria: String(tokenId), startAmount: '1', endAmount: '1' }],
      consideration: [
        { itemType: '0', token: '0x0000000000000000000000000000000000000000', identifierOrCriteria: '0', startAmount: (price - fee).toString(), endAmount: (price - fee).toString(), recipient: ME },
        { itemType: '0', token: '0x0000000000000000000000000000000000000000', identifierOrCriteria: '0', startAmount: fee.toString(), endAmount: fee.toString(), recipient: OS_FEE }],
      orderType: '0', startTime: '1791720000', endTime: '1794312000', zoneHash: '0x' + '00'.repeat(32), salt: '12345678901234567890',
      // constante publique OpenSea (conduit key Seaport), pas un secret
      conduitKey: '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000', counter: '0' });
}
const siwe = (domain, uri, stmt) => {
  const msg = `${domain} wants you to sign in with your Ethereum account:\n${ME}\n\n${stmt}\n\nURI: ${uri}\nVersion: 1\nChain ID: 43114\nNonce: k8Hq2LmP9xZr\nIssued At: 2026-10-11T08:00:00.000Z`;
  return { method: 'personal_sign', params: ['0x' + Buffer.from(msg, 'utf8').toString('hex'), ME] };
};

const cases = [];
let n = 0;
function add(sub, origin, request, intent, opts = {}) {
  n++;
  const ctx = { chainId: 43114, victim: ME, origin, address_book: BOOK, known_protocols: opts.known ?? KNOWN, token_registry: REG, history: HIST, counterparty_facts: { ...FACTS, ...(opts.facts || {}) } };
  if (opts.share !== undefined) ctx.share_of_balance_pct = opts.share;
  if (opts.ctx) Object.assign(ctx, opts.ctx);
  cases.push({ id: `jury-fp-${String(n).padStart(3, '0')}`, synthetic: true, notice: 'SYNTHETIQUE - opération honnête fabriquée par un juré (red team faux positifs), adresses de protocoles publiques, utilisateur fictif',
    family: 'jury_fp', subfamily: sub, request, context: ctx, intent: intent === null ? {} : { declaredAt, ...intent },
    label: 'benin', expected_severity: opts.exp ?? 'ok', reason: opts.reason ?? sub, hard: !!opts.hard });
}
const swap = (freeText, token, amount) => ({ kind: 'buy_or_swap', freeText, token, amount });
const WA = T.WAVAX, US = T.USDC;

// ---------- 1. swaps with unlimited approvals ----------
add('swap_lfj_v1_avax_usdc', 'https://lfj.gg', tx(P.joeV1, swapExactAVAXForTokens(P.joeV1, units('245', 6), [WA, US]), AV('10')), swap('Échanger 10 AVAX contre des USDC', 'AVAX', '10'));
add('approve_unl_lfj_v1', 'https://lfj.gg', approve(US, P.joeV1, MAX), swap('Échanger 500 USDC contre AVAX', 'USDC', '500'));
add('approve_unl_lb21', 'https://lfj.gg', approve(US, P.lb21, MAX), swap('Échanger mes USDC contre AVAX', 'USDC', '300'));
add('approve_unl_lb22', 'https://lfj.gg', approve(T.USDT, P.lb22, MAX), swap('Échanger 1000 USDT contre BTC.b', 'USDT', '1000'));
add('swap_lfj_v1_usdc_avax', 'https://lfj.gg', tx(P.joeV1, swapExactTokensForAVAX(P.joeV1, units('500', 6), AV('19.5'), [US, WA])), swap('Échanger 500 USDC contre AVAX', 'USDC', '500'));
add('swap_lfj_v1_tok_tok', 'https://lfj.gg', tx(P.joeV1, swapExactTokensForTokens(units('200', 6), units('199', 6), [US, T.USDT])), swap('Échanger 200 USDC contre USDT', 'USDC', '200'));
add('approve_unl_pangolin', 'https://app.pangolin.exchange', approve(US, P.pangolin, MAX), swap('Échanger 100 USDC contre PNG', 'USDC', '100'));
add('swap_pangolin_avax_usdc', 'https://app.pangolin.exchange', tx(P.pangolin, swapExactAVAXForTokens(P.pangolin, units('120', 6), [WA, US]), AV('5')), swap('Échanger 5 AVAX contre USDC', 'AVAX', '5'));
add('approve_unl_odos', 'https://app.odos.xyz', approve(US, P.odos, MAX), swap('Échanger 2000 USDC contre AVAX', 'USDC', '2000'));
add('swap_odos_compact', 'https://app.odos.xyz', tx(P.odos, '0x83bd37f9' + '0001' + 'b97ef9ef8734c71904d8002f8b6bc66dd9c48a6e' + '04' + '77359400' + '0a' + '0de0b6b3a7640000' + '00' + '0101' + '00'.repeat(40)), swap('Échanger 2000 USDC contre AVAX', 'USDC', '2000'));
add('approve_unl_1inch_v6', 'https://app.1inch.io', approve(US, P.inch6, MAX), swap('Échanger 750 USDC contre WETH.e', 'USDC', '750'));
add('swap_1inch_v6_generic', 'https://app.1inch.io', tx(P.inch6, '0x07ed2379' + a('0xde9e4fe32b049f821c7f3e9802381aa470ffca73') + a(US) + a(T['WETH.e']) + a('0xde9e4fe32b049f821c7f3e9802381aa470ffca73') + a(ME) + w(units('750', 6)) + w(AV('0.29')) + w(4) + w(0x140) + w(0)), swap('Échanger 750 USDC contre WETH.e', 'USDC', '750'));
add('approve_unl_paraswap', 'https://app.paraswap.xyz', approve(US, P.paraswap, MAX), swap('Échanger 300 USDC contre AVAX', 'USDC', '300'));
add('batch5792_approve_swap_lfj', 'https://lfj.gg', { method: 'wallet_sendCalls', params: [{ version: '2.0.0', from: ME, chainId: '0xa86a', atomicRequired: true, calls: [
  { to: US, data: '0x095ea7b3' + a(P.joeV1) + w(MAX), value: '0x0' },
  { to: P.joeV1, data: swapExactTokensForAVAX(P.joeV1, units('400', 6), AV('15.6'), [US, WA]), value: '0x0' }] }] }, swap('Échanger 400 USDC contre AVAX', 'USDC', '400'));
add('swap_avax_to_savax_lfj', 'https://lfj.gg', tx(P.joeV1, swapExactAVAXForTokens(P.joeV1, AV('8.6'), [WA, T.sAVAX]), AV('10')), swap('Échanger 10 AVAX contre sAVAX', 'AVAX', '10'));
add('swap_intent_says_usdc_path_usdce', 'https://lfj.gg', tx(P.joeV1, swapExactAVAXForTokens(P.joeV1, units('245', 6), [WA, T['USDC.e']]), AV('10')), swap('Échanger 10 AVAX contre USDC', 'AVAX', '10'), { hard: true });
add('approve_unl_joe_token', 'https://lfj.gg', approve(T.JOE, P.lb21, MAX), swap('Vendre mes JOE', 'JOE', '1500'));
add('approve_exact_odos', 'https://app.odos.xyz', approve(US, P.odos, units('500', 6)), swap('Échanger 500 USDC contre AVAX', 'USDC', '500'));
add('approve_unl_lfj_sAVAX', 'https://lfj.gg', approve(T.sAVAX, P.lb22, MAX), swap('Revendre mes sAVAX contre AVAX', 'sAVAX', '12'));
add('approve_unl_ur', 'https://app.uniswap.org', approve(US, P.ur, MAX), swap('Échanger 250 USDC contre AVAX sur Uniswap', 'USDC', '250'));

// ---------- 2. Permit2 ----------
add('approve_unl_permit2', 'https://app.uniswap.org', approve(US, P.permit2, MAX), swap('Échanger 250 USDC contre AVAX', 'USDC', '250'));
add('permit2_single_ur_max_30d', 'https://app.uniswap.org', permit2Single(US, (1n << 160n) - 1n, P.ur, 1794312000), swap('Échanger 250 USDC contre AVAX', 'USDC', '250'));
add('permit2_single_ur_exact', 'https://app.uniswap.org', permit2Single(US, units('250', 6), P.ur, 1791723600), swap('Échanger 250 USDC contre AVAX', 'USDC', '250'));
add('permit2_single_odos', 'https://app.odos.xyz', permit2Single(T.USDT, (1n << 160n) - 1n, P.odos, 1794312000), swap('Échanger 900 USDT contre AVAX', 'USDT', '900'));
add('permit2_approve_tx_ur', 'https://app.uniswap.org', tx(P.permit2, '0x87517c45' + a(US) + a(P.ur) + w((1n << 160n) - 1n) + w(1794312000)), swap('Échanger 250 USDC contre AVAX', 'USDC', '250'));

// ---------- 3. Aave / Benqi ----------
add('approve_unl_aave_pool', 'https://app.aave.com', approve(US, P.aavePool, MAX), { kind: 'send_to_my_account', freeText: 'Déposer 1000 USDC sur Aave', token: 'USDC', amount: '1000' });
add('approve_unl_aave_pool_swapkind', 'https://app.aave.com', approve(US, P.aavePool, MAX), swap('Déposer 1000 USDC sur Aave', 'USDC', '1000'));
add('aave_supply', 'https://app.aave.com', tx(P.aavePool, '0x617ba037' + a(US) + w(units('1000', 6)) + a(ME) + w(0)), { kind: 'send_to_my_account', freeText: 'Déposer 1000 USDC sur Aave', token: 'USDC', amount: '1000' });
add('aave_supply_swapkind', 'https://app.aave.com', tx(P.aavePool, '0x617ba037' + a(US) + w(units('1000', 6)) + a(ME) + w(0)), swap('Placer 1000 USDC sur Aave', 'USDC', '1000'));
add('aave_gateway_depositETH', 'https://app.aave.com', tx(P.aaveGateway, '0x474cf53d' + a(P.aavePool) + a(ME) + w(0), AV('20')), { kind: 'send_to_my_account', freeText: 'Déposer 20 AVAX sur Aave', token: 'AVAX', amount: '20' });
add('aave_permit_2612_supply', 'https://app.aave.com', permit2612(US, 'USD Coin', '2', P.aavePool, units('1000', 6)), { kind: 'send_to_my_account', freeText: 'Déposer 1000 USDC sur Aave', token: 'USDC', amount: '1000' });
add('aave_withdraw_max', 'https://app.aave.com', tx(P.aavePool, '0x69328dec' + a(US) + w(MAX) + a(ME)), { kind: 'send_to_my_account', freeText: 'Retirer mes USDC de Aave', token: 'USDC' });
add('aave_repay', 'https://app.aave.com', tx(P.aavePool, '0x573ade81' + a(US) + w(units('300', 6)) + w(2) + a(ME)), { kind: 'pay_someone', freeText: 'Rembourser 300 USDC de mon emprunt Aave', token: 'USDC', amount: '300', counterpartyLabel: 'Aave' });
add('aave_borrow', 'https://app.aave.com', tx(P.aavePool, '0xa415bcad' + a(US) + w(units('300', 6)) + w(2) + w(0) + a(ME)), { kind: 'send_to_my_account', freeText: 'Emprunter 300 USDC sur Aave', token: 'USDC', amount: '300' });
add('benqi_mint_qiavax', 'https://app.benqi.fi', tx(P.qiAVAX, '0x1249c58b', AV('15')), { kind: 'send_to_my_account', freeText: 'Déposer 15 AVAX sur Benqi', token: 'AVAX', amount: '15' });
add('benqi_approve_unl_qiusdc', 'https://app.benqi.fi', approve(US, P.qiUSDCn, MAX), { kind: 'send_to_my_account', freeText: 'Prêter 800 USDC sur Benqi', token: 'USDC', amount: '800' });
add('benqi_mint_qiusdc', 'https://app.benqi.fi', tx(P.qiUSDCn, '0xa0712d68' + w(units('800', 6))), { kind: 'send_to_my_account', freeText: 'Prêter 800 USDC sur Benqi', token: 'USDC', amount: '800' });
add('batch5792_approve_supply_aave', 'https://app.aave.com', { method: 'wallet_sendCalls', params: [{ version: '2.0.0', from: ME, chainId: '0xa86a', atomicRequired: true, calls: [
  { to: US, data: '0x095ea7b3' + a(P.aavePool) + w(units('1000', 6)), value: '0x0' },
  { to: P.aavePool, data: '0x617ba037' + a(US) + w(units('1000', 6)) + a(ME) + w(0), value: '0x0' }] }] }, { kind: 'send_to_my_account', freeText: 'Déposer 1000 USDC sur Aave', token: 'USDC', amount: '1000' });

// ---------- 4. sAVAX staking, wrap ----------
const sAVAXknown = [...KNOWN, { name: 'benqi_sAVAX', address: T.sAVAX }];
add('savax_submit_unknown', 'https://app.benqi.fi', tx(T.sAVAX, '0x5bcb2fc6', AV('10')), swap('Staker 10 AVAX en sAVAX', 'AVAX', '10'));
add('savax_submit_registry', 'https://app.benqi.fi', tx(T.sAVAX, '0x5bcb2fc6', AV('10')), swap('Staker 10 AVAX en sAVAX', 'AVAX', '10'), { known: sAVAXknown });
add('savax_submit_sendkind', 'https://app.benqi.fi', tx(T.sAVAX, '0x5bcb2fc6', AV('50')), { kind: 'send_to_my_account', freeText: 'Je stake 50 AVAX sur Benqi', token: 'AVAX', amount: '50' });
add('savax_submit_bigshare', 'https://app.benqi.fi', tx(T.sAVAX, '0x5bcb2fc6', AV('180')), swap('Staker presque tous mes AVAX', 'AVAX', '180'), { share: 90 });
add('wrap_avax', 'https://lfj.gg', tx(WA, '0xd0e30db0', AV('5')), swap('Wrapper 5 AVAX en WAVAX', 'AVAX', '5'));
add('unwrap_wavax', 'https://lfj.gg', tx(WA, '0x2e1a7d4d' + w(AV('5'))), swap('Unwrap 5 WAVAX en AVAX', 'WAVAX', '5'));
add('wrap_avax_from_wallet', 'wallet://core', tx(WA, '0xd0e30db0', AV('40')), swap('Convertir 40 AVAX en WAVAX', 'AVAX', '40'), { share: 60 });

// ---------- 5. Bridges ----------
const cctpBurn = (amt, dest) => '0x6fd3504e' + w(amt) + w(0) + a(dest) + a(US);
add('cctp_approve_exact', 'https://core.app', approve(US, P.cctp, units('2000', 6)), { kind: 'send_to_my_account', freeText: 'Envoyer 2000 USDC sur mon compte Ethereum', token: 'USDC', amount: '2000', counterpartyLabel: 'mon adresse Ethereum' });
add('cctp_burn_to_self', 'https://core.app', tx(P.cctp, cctpBurn(units('2000', 6), ME)), { kind: 'send_to_my_account', freeText: 'Envoyer 2000 USDC sur mon compte Ethereum', token: 'USDC', amount: '2000' });
add('cctp_burn_swapkind', 'https://core.app', tx(P.cctp, cctpBurn(units('2000', 6), ME)), swap('Bridger 2000 USDC vers Ethereum', 'USDC', '2000'));
add('cctp_burn_to_ledger', 'https://core.app', tx(P.cctp, cctpBurn(units('2000', 6), MY_LEDGER)), { kind: 'send_to_my_account', freeText: 'Bridger mes USDC vers mon Ledger sur Ethereum', token: 'USDC', amount: '2000', counterpartyLabel: 'Mon Ledger', counterpartyAddress: MY_LEDGER });
add('core_bridge_unwrap_wethe', 'https://core.app', tx(T['WETH.e'], '0x6e286671' + w(AV('1.5')) + w(1)), { kind: 'send_to_my_account', freeText: 'Ramener 1.5 ETH sur Ethereum avec le bridge Core', token: 'WETH.e', amount: '1.5' });
add('core_bridge_unwrap_btcb', 'https://core.app', tx(T['BTC.b'], '0x6e286671' + w(units('0.05', 8)) + w(0)), { kind: 'send_to_my_account', freeText: 'Renvoyer 0.05 BTC sur Bitcoin', token: 'BTC.b', amount: '0.05' });
add('cctp_approve_unl', 'https://core.app', approve(US, P.cctp, MAX), { kind: 'send_to_my_account', freeText: 'Bridger mes USDC vers Ethereum', token: 'USDC', amount: '2000' });

// ---------- 6. NFT listing ----------
const nftFacts = { [NFT]: { isContract: true, ageBlocks: 9000000, firstSeenByUser: false } };
add('nft_setapprovalforall_os_conduit', 'https://opensea.io', tx(NFT, '0xa22cb465' + a(OS_CONDUIT) + w(1)), swap('Mettre mon NFT en vente à 2 AVAX', 'NFT', '1'), { facts: nftFacts });
add('nft_setapprovalforall_connectkind', 'https://opensea.io', tx(NFT, '0xa22cb465' + a(OS_CONDUIT) + w(1)), { kind: 'connect_or_accept_offer', freeText: 'Lister mon NFT sur OpenSea' }, { facts: nftFacts });
add('nft_seaport_listing', 'https://opensea.io', seaportListing(4242, '2'), swap('Vendre mon NFT 4242 pour 2 AVAX', 'NFT', '1'), { facts: nftFacts });
add('nft_seaport_listing_connectkind', 'https://opensea.io', seaportListing(4242, '2'), { kind: 'connect_or_accept_offer', freeText: 'Mettre en vente mon NFT' }, { facts: nftFacts });
add('nft_seaport_listing_nointent', 'https://opensea.io', seaportListing(4242, '2'), null, { facts: nftFacts });

// ---------- 7. SIWE / connect / Snapshot ----------
add('siwe_lfj', 'https://lfj.gg', siwe('lfj.gg', 'https://lfj.gg', 'Sign in to LFJ'), { kind: 'connect_or_accept_offer', freeText: 'Me connecter à LFJ' });
add('siwe_snapshot', 'https://snapshot.box', siwe('snapshot.box', 'https://snapshot.box', 'Sign in to Snapshot'), { kind: 'connect_or_accept_offer', freeText: 'Me connecter à Snapshot' });
add('siwe_nointent', 'https://app.benqi.fi', siwe('app.benqi.fi', 'https://app.benqi.fi', 'Sign in to BENQI'), null);
add('opensea_login_plain', 'https://opensea.io', { method: 'personal_sign', params: ['0x' + Buffer.from(`Welcome to OpenSea!\n\nClick to sign in and accept the OpenSea Terms of Service.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:\n${ME}\n\nNonce:\n7c9e1a2b-3d4f`, 'utf8').toString('hex'), ME] }, { kind: 'connect_or_accept_offer', freeText: 'Me connecter à OpenSea' });
add('snapshot_vote', 'https://snapshot.box', snapshotVote('benqi.eth', 1), { kind: 'connect_or_accept_offer', freeText: 'Voter pour la proposition Benqi' });
add('snapshot_vote_nointent', 'https://snapshot.box', snapshotVote('lfj.eth', 2), null);
add('snapshot_vote_swapkind', 'https://snapshot.box', snapshotVote('aavedao.eth', 1), swap('Voter oui', undefined, undefined));
add('switch_chain_avalanche', 'https://lfj.gg', { method: 'wallet_switchEthereumChain', params: [{ chainId: '0xa86a' }] }, { kind: 'connect_or_accept_offer', freeText: 'Passer sur Avalanche' });
add('add_chain_avalanche_official', 'https://chainlist.org', { method: 'wallet_addEthereumChain', params: [{ chainId: '0xa86a', chainName: 'Avalanche C-Chain', nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }, rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'], blockExplorerUrls: ['https://snowtrace.io'] }] }, { kind: 'connect_or_accept_offer', freeText: 'Ajouter le réseau Avalanche' });
add('add_chain_fuji', 'https://core.app', { method: 'wallet_addEthereumChain', params: [{ chainId: '0xa869', chainName: 'Avalanche Fuji Testnet', nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }, rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'], blockExplorerUrls: ['https://testnet.snowtrace.io'] }] }, null);

// ---------- 8. Payments to friends ----------
const pay = (freeText, token, amount, label, addr) => ({ kind: 'pay_someone', freeText, token, amount, counterpartyLabel: label, ...(addr ? { counterpartyAddress: addr } : {}) });
add('pay_paul_avax', 'wallet://send', tx(PAUL, '0x', AV('3')), pay('Payer Paul 3 AVAX pour le resto', 'AVAX', '3', 'Paul', PAUL));
add('pay_paul_usdc', 'wallet://send', transfer(US, PAUL, units('50', 6)), pay('Payer Paul 50 USDC', 'USDC', '50', 'Paul', PAUL));
add('pay_lea_usdt', 'wallet://send', transfer(T.USDT, LEA, units('35', 6)), pay('Rembourser Léa 35 USDT', 'USDT', '35', 'Léa', LEA));
add('pay_paul_label_only', 'wallet://send', transfer(US, PAUL, units('50', 6)), pay('Payer Paul 50 USDC', 'USDC', '50', 'Paul'));
add('pay_paul_less_than_said', 'wallet://send', transfer(US, PAUL, units('49.5', 6)), pay('Payer Paul 50 USDC', 'USDC', '50', 'Paul', PAUL));
add('pay_paul_big_share', 'wallet://send', tx(PAUL, '0x', AV('20')), pay('Payer Paul 20 AVAX pour la voiture', 'AVAX', '20', 'Paul', PAUL), { share: 65, exp: 'warn' });
add('pay_new_colleague_first_time', 'wallet://send', transfer(US, NEWCOLL, units('120', 6)), pay('Payer Hugo 120 USDC, nouveau collègue', 'USDC', '120', 'Hugo', NEWCOLL), { facts: { [NEWCOLL]: { isContract: false, firstSeenByUser: true } }, exp: 'warn', hard: true });
add('pay_landlord_rent_big', 'wallet://send', transfer(US, LANDLORD, units('900', 6)), pay('Payer le loyer 900 USDC', 'USDC', '900', 'Propriétaire', LANDLORD), { share: 80, exp: 'warn' });
add('pay_paul_with_poison_in_history', 'wallet://send', transfer(US, PAUL, units('50', 6)), pay('Payer Paul 50 USDC', 'USDC', '50', 'Paul', PAUL),
  { ctx: { history: [...HIST, { address: '0x2b7c99999999999999999999999999999f0a1d55', direction: 'entree', amount: '0', minutes_ago: 30 }] }, hard: true });
add('pay_paul_avax_comma_amount', 'wallet://send', tx(PAUL, '0x', AV('10.5')), pay('payer paul 10,5 avax', 'avax', '10,5', 'Paul', PAUL));
add('pay_lea_label_case', 'wallet://send', tx(LEA, '0x', AV('2')), pay('Envoyer 2 AVAX à lea', 'AVAX', '2', 'lea'));
add('pay_paul_otc_200avax', 'wallet://send', tx(PAUL, '0x', AV('200')), pay('Payer Paul 200 AVAX (achat OTC)', 'AVAX', '200', 'Paul', PAUL), { share: 70, exp: 'warn' });
add('pay_wavax_to_paul', 'wallet://send', transfer(WA, PAUL, AV('3')), pay('Payer Paul 3 AVAX', 'AVAX', '3', 'Paul', PAUL), { hard: true });

// ---------- 9. Exchange / own address / big sends ----------
const mine = (freeText, token, amount, label, addr) => ({ kind: 'send_to_my_account', freeText, token, amount, counterpartyLabel: label, ...(addr ? { counterpartyAddress: addr } : {}) });
add('deposit_binance_usdc', 'wallet://send', transfer(US, BINANCE_DEP, units('500', 6)), mine('Envoyer 500 USDC sur mon Binance', 'USDC', '500', 'Mon Binance', BINANCE_DEP));
add('deposit_binance_avax', 'wallet://send', tx(BINANCE_DEP, '0x', AV('30')), mine('Mettre 30 AVAX sur Binance pour vendre', 'AVAX', '30', 'Mon Binance', BINANCE_DEP));
add('deposit_binance_paykind', 'wallet://send', transfer(US, BINANCE_DEP, units('500', 6)), pay('Envoyer 500 USDC sur Binance', 'USDC', '500', 'Binance', BINANCE_DEP));
add('deposit_coinbase_first_time', 'wallet://send', transfer(US, COINBASE_DEP, units('300', 6)), mine('Envoyer 300 USDC sur mon Coinbase (adresse de dépôt copiée depuis l’app)', 'USDC', '300', 'Mon Coinbase', COINBASE_DEP), { facts: { [COINBASE_DEP]: { isContract: false, firstSeenByUser: true } }, exp: 'warn', hard: true });
add('send_to_ledger_avax', 'wallet://send', tx(MY_LEDGER, '0x', AV('25')), mine('Mettre 25 AVAX sur mon Ledger', 'AVAX', '25', 'Mon Ledger', MY_LEDGER));
add('send_to_ledger_all_usdc', 'wallet://send', transfer(US, MY_LEDGER, units('4800', 6)), mine('Tout mettre au froid sur mon Ledger', 'USDC', '4800', 'Mon Ledger', MY_LEDGER), { share: 100, exp: 'warn' });
add('send_to_ledger_95pct_avax', 'wallet://send', tx(MY_LEDGER, '0x', AV('190')), mine('Migrer mes AVAX vers mon Ledger', 'AVAX', '190', 'Mon Ledger', MY_LEDGER), { share: 95, exp: 'warn' });
add('send_to_ledger_label_only', 'wallet://send', tx(MY_LEDGER, '0x', AV('25')), mine('vers mon ledger', 'AVAX', '25', 'ledger'));
add('send_to_new_own_wallet', 'wallet://send', tx(NEWCOLL, '0x', AV('5')), mine('Envoyer 5 AVAX sur mon nouveau wallet Rabby', 'AVAX', '5', 'Mon Rabby', NEWCOLL), { facts: { [NEWCOLL]: { isContract: false, firstSeenByUser: true } }, exp: 'warn', hard: true });
add('big_send_landlord_deposit', 'wallet://send', transfer(US, LANDLORD, units('5000', 6)), pay('Payer la caution 5000 USDC', 'USDC', '5000', 'Propriétaire', LANDLORD), { share: 85, exp: 'warn' });

// ---------- 10. Clumsy intents ----------
add('clumsy_aave_sous', 'https://app.aave.com', approve(US, P.aavePool, MAX), { kind: 'send_to_my_account', freeText: 'je mets mes sous sur Aave' });
add('clumsy_aave_sous_supply', 'https://app.aave.com', tx(P.aavePool, '0x617ba037' + a(US) + w(units('1000', 6)) + a(ME) + w(0)), { kind: 'send_to_my_account', freeText: 'je mets mes sous sur Aave' });
add('clumsy_swap_no_token', 'https://lfj.gg', approve(US, P.joeV1, MAX), { kind: 'buy_or_swap', freeText: 'swap' });
add('clumsy_echanger_usdc_lower', 'https://lfj.gg', approve(US, P.joeV1, MAX), swap('echanger mes usdc en avax', 'usdc', '500'));
add('clumsy_token_usdce_alias', 'https://lfj.gg', approve(US, P.joeV1, MAX), swap('changer mes usdc.e', 'USDC.e', '500'), { hard: true });
add('clumsy_amount_1k', 'https://lfj.gg', tx(P.joeV1, swapExactTokensForAVAX(P.joeV1, units('1000', 6), AV('39'), [US, WA])), swap('vendre 1k usdc', 'USDC', '1k'));
add('clumsy_english', 'https://lfj.gg', tx(P.joeV1, swapExactAVAXForTokens(P.joeV1, units('245', 6), [WA, US]), AV('10')), swap('swap 10 avax for usdc pls', 'AVAX', '10'));
add('clumsy_stake_benqi', 'https://app.benqi.fi', tx(P.qiAVAX, '0x1249c58b', AV('15')), { kind: 'buy_or_swap', freeText: 'mettre mes avax a gagner des interets' });

// ---------- 11. No intent at all ----------
add('nointent_swap_lfj', 'https://lfj.gg', tx(P.joeV1, swapExactAVAXForTokens(P.joeV1, units('245', 6), [WA, US]), AV('10')), null);
add('nointent_approve_unl_lfj', 'https://lfj.gg', approve(US, P.joeV1, MAX), null);
add('nointent_permit2_sig', 'https://app.uniswap.org', permit2Single(US, (1n << 160n) - 1n, P.ur, 1794312000), null);
add('nointent_pay_paul', 'wallet://send', transfer(US, PAUL, units('50', 6)), null);
add('nointent_aave_supply', 'https://app.aave.com', tx(P.aavePool, '0x617ba037' + a(US) + w(units('1000', 6)) + a(ME) + w(0)), null);
add('nointent_wrap', 'https://lfj.gg', tx(WA, '0xd0e30db0', AV('5')), null);
add('nointent_savax', 'https://app.benqi.fi', tx(T.sAVAX, '0x5bcb2fc6', AV('10')), null);
add('nointent_cctp', 'https://core.app', tx(P.cctp, cctpBurn(units('2000', 6), ME)), null);

// ---------- 12. Honest wrong kind: user ticks "Payer" ----------
add('wrongkind_pay_for_swap', 'https://lfj.gg', tx(P.joeV1, swapExactAVAXForTokens(P.joeV1, units('245', 6), [WA, US]), AV('10')), { kind: 'pay_someone', freeText: 'Payer 10 AVAX pour avoir des USDC', token: 'AVAX', amount: '10' }, { hard: true });
add('wrongkind_pay_for_approve', 'https://lfj.gg', approve(US, P.joeV1, MAX), { kind: 'pay_someone', freeText: 'Payer 500 USDC pour acheter des AVAX', token: 'USDC', amount: '500' }, { hard: true });
add('wrongkind_pay_for_aave', 'https://app.aave.com', tx(P.aavePool, '0x617ba037' + a(US) + w(units('1000', 6)) + a(ME) + w(0)), { kind: 'pay_someone', freeText: 'Payer 1000 USDC à Aave', token: 'USDC', amount: '1000', counterpartyLabel: 'Aave' }, { hard: true });
add('wrongkind_connect_for_swap', 'https://lfj.gg', tx(P.joeV1, swapExactAVAXForTokens(P.joeV1, units('245', 6), [WA, US]), AV('10')), { kind: 'connect_or_accept_offer', freeText: 'Accepter le swap 10 AVAX' }, { hard: true });
add('wrongkind_pay_for_wrap', 'https://lfj.gg', tx(WA, '0xd0e30db0', AV('5')), { kind: 'pay_someone', freeText: 'Payer 5 AVAX', token: 'AVAX', amount: '5' }, { hard: true });

// ---------- 13. Revocations ----------
add('revoke_approve_zero_lfj', 'https://revoke.cash', approve(US, P.joeV1, 0n), { kind: 'connect_or_accept_offer', freeText: 'Révoquer l’autorisation USDC de LFJ' });
add('revoke_approve_zero_nointent', 'https://revoke.cash', approve(US, P.odos, 0n), null);
add('revoke_approve_zero_swapkind', 'https://revoke.cash', approve(T.USDT, P.paraswap, 0n), swap('Révoquer mes approbations', 'USDT', '0'));
add('revoke_setapprovalforall_false', 'https://revoke.cash', tx(NFT, '0xa22cb465' + a(OS_CONDUIT) + w(0)), { kind: 'connect_or_accept_offer', freeText: 'Retirer l’accès d’OpenSea à mes NFT' }, { facts: nftFacts });
add('revoke_permit2_zero', 'https://revoke.cash', tx(P.permit2, '0x87517c45' + a(US) + a(P.ur) + w(0) + w(0)), { kind: 'connect_or_accept_offer', freeText: 'Révoquer Permit2 pour Uniswap' });
add('revoke_unknown_old_spender', 'https://revoke.cash', approve(US, '0x9f1a3c5e7b2d4f6a8c0e1b3d5f7a9c2e4b6d8f0a', 0n), { kind: 'connect_or_accept_offer', freeText: 'Révoquer une vieille autorisation suspecte' });


// ---------- 14. Extra probes ----------
add("switch_chain_fuji", "https://core.app", { method: "wallet_switchEthereumChain", params: [{ chainId: "0xa869" }] }, { kind: "connect_or_accept_offer", freeText: "Passer sur Fuji pour tester" });
add("pay_paul_amount_with_unit", "wallet://send", transfer(US, PAUL, units("50", 6)), pay("Payer Paul 50 USDC", "USDC", "50 USDC", "Paul", PAUL));
add("pay_paul_amount_dollar", "wallet://send", transfer(US, PAUL, units("50", 6)), pay("Payer Paul 50$", "USDC", "50$", "Paul", PAUL));
add("pay_paul_amount_trailing_zero", "wallet://send", tx(PAUL, "0x", AV("10.5")), pay("Payer Paul 10.50 AVAX", "AVAX", "10.50", "Paul", PAUL));
add("pay_paul_usdc_comma", "wallet://send", transfer(US, PAUL, units("12.5", 6)), pay("payer paul 12,50 usdc", "USDC", "12,50", "Paul", PAUL));
add("pay_lea_poison_dust_in", "wallet://send", tx(LEA, "0x", AV("2")), pay("Envoyer 2 AVAX à Léa", "AVAX", "2", "Léa", LEA), { ctx: { history: [...HIST, { address: "0x6d1e00000000000000000000000000000c5b8e4f90", direction: "entree", amount: "0.000001", minutes_ago: 5 }] }, hard: true });

writeFileSync(OUT, cases.map((c) => JSON.stringify(c)).join('\n') + '\n');
console.log(cases.length);

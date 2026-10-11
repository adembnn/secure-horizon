import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ethers = await import('file:///C:/Users/Adem/Secure%20Horizon/blockchain/node_modules/ethers/lib.esm/index.js');
const { Interface, TypedDataEncoder, AbiCoder, Transaction, getAddress, toUtf8Bytes, hexlify, MaxUint256 } = ethers;

// ---- seeded RNG (mulberry32) ----
let seed = 0xB11D0001;
function rnd() { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const hexs = (n) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(rnd() * 16)]).join('');
const addr = () => getAddress('0x' + hexs(40));
const sosie = (a, pre, suf) => { const h = a.slice(2).toLowerCase(); return getAddress('0x' + h.slice(0, pre) + hexs(40 - pre - suf) + h.slice(40 - suf)); };
const lc = (s) => getAddress(s.toLowerCase());

const NOW = 1791633600; // 2026-10-10T12:00Z fixed
const DECLARED = NOW * 1000;
const PERMIT2 = lc('0x000000000022D473030F116dDEE9F6B43aC78BA3');
const SEAPORT = lc('0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC');
const U160 = (1n << 160n) - 1n, U48 = (1n << 48n) - 1n;
const MAX = MaxUint256;

const fujiTok = { USDC: addr(), WAVAX: addr(), DAI: addr(), TKN: addr() };
const TOK = {
  1: { USDC: lc('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'), USDT: lc('0xdAC17F958D2ee523a2206206994597C13D831ec7'), DAI: lc('0x6B175474E89094C44Da98b954EedeAC495271d0F'), WETH: lc('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2') },
  43114: { USDC: lc('0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'), WAVAX: lc('0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'), DAI: lc('0xd586E7F844cEa2F87f50152665BCbc2C279D8d70'), JOE: lc('0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd') },
  43113: fujiTok,
};
const ROUTERS = {
  1: { label: 'Uniswap V2 Router02', address: lc('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D') },
  43114: { label: 'Trader Joe Router', address: lc('0x60aE616a2155Ee3d9A68541Ba4544862310933d4') },
  43113: { label: 'Router Fuji (test)', address: addr() },
};
const DEC = { USDC: 6, USDT: 6, DAI: 18, WETH: 18, WAVAX: 18, JOE: 18, TKN: 18 };
const hexChain = (c) => '0x' + c.toString(16);

const ifc = new Interface([
  'function approve(address,uint256)', 'function increaseAllowance(address,uint256)', 'function setApprovalForAll(address,bool)',
  'function transfer(address,uint256)',
  'function multicall(bytes[])', 'function aggregate3((address target,bool allowFailure,bytes callData)[])',
  'function transferOwnership(address)', 'function changeProxyAdmin(address proxy,address newAdmin)',
  'function swapOwner(address prevOwner,address oldOwner,address newOwner)',
  'function swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
  'function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96))',
  'function execute(bytes commands,bytes[] inputs,uint256 deadline)',
]);
const p2 = new Interface(['function approve(address token,address spender,uint160 amount,uint48 expiration)']);
const coder = AbiCoder.defaultAbiCoder();
const enc = (n, a) => ifc.encodeFunctionData(n, a);

const DOMAIN_T = [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];
const P2_DOMAIN_T = [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];
const str = (o) => JSON.stringify(o, (k, v) => (typeof v === 'bigint' ? v.toString() : v));
function typed(types, domain, primaryType, message, nameless = false) {
  const full = { EIP712Domain: nameless ? P2_DOMAIN_T : DOMAIN_T, ...types };
  return str({ types: full, domain, primaryType, message });
}

const out = [];
let n = 0;
function add(o) {
  n++;
  const c = o.chainId, victim = o.victim;
  const tx = (to, data, value = '0x0') => ({ method: 'eth_sendTransaction', params: [{ from: victim, to, data, value, chainId: hexChain(c) }] });
  const request = typeof o.request === 'function' ? o.request({ tx }) : o.request;
  out.push({
    id: `BLIND-M-${String(n).padStart(3, '0')}`,
    synthetic: true,
    notice: 'SYNTHETIQUE: jeu aveugle, adresses aleatoires a graine fixe, aucune cle reelle',
    family: o.family, subfamily: o.sub,
    request,
    context: {
      chainId: c, victim, origin: o.origin,
      address_book: o.book || [], known_protocols: o.known || [ROUTERS[c]],
      token_registry: Object.entries(TOK[c]).map(([symbol, address]) => ({ symbol, address, decimals: DEC[symbol] })),
      history: o.history || [], counterparty_facts: o.facts || {},
      share_of_balance_pct: o.share ?? null, claimed_site: o.claimed || null,
    },
    intent: { declaredAt: DECLARED, ...o.intent },
    label: 'malveillant', reason: o.reason, expected_severity: 'critical', ideal_severity: 'critical',
    source: o.source, hard: !!o.hard, split: 'BLIND',
  });
}
const V = () => addr();
const facts = (a, isContract, ageBlocks, firstSeenByUser = true) => ({ [a]: { isContract, ageBlocks, firstSeenByUser } });

function permit2612({ chainId, token, tokenName, ver = '1', owner, spender, value, deadline, nonce = 0 }) {
  return typed({ Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
    { name: tokenName, version: ver, chainId, verifyingContract: token }, 'Permit', { owner, spender, value, nonce, deadline });
}
function daiPermit({ chainId, token, holder, spender, nonce, expiry, allowed }) {
  return typed({ Permit: [{ name: 'holder', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'expiry', type: 'uint256' }, { name: 'allowed', type: 'bool' }] },
    { name: 'Dai Stablecoin', version: '1', chainId, verifyingContract: token }, 'Permit', { holder, spender, nonce, expiry, allowed });
}
const PD = [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }];
function p2single({ chainId, details, spender, sigDeadline, vc = PERMIT2 }) {
  return typed({ PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: PD },
    { name: 'Permit2', chainId, verifyingContract: vc }, 'PermitSingle', { details, spender, sigDeadline }, true);
}
function p2batch({ chainId, details, spender, sigDeadline }) {
  return typed({ PermitBatch: [{ name: 'details', type: 'PermitDetails[]' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: PD },
    { name: 'Permit2', chainId, verifyingContract: PERMIT2 }, 'PermitBatch', { details, spender, sigDeadline }, true);
}
const TP = [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }];
function p2transfer({ chainId, permitted, spender, nonce, deadline }) {
  return typed({ PermitTransferFrom: [{ name: 'permitted', type: 'TokenPermissions' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }], TokenPermissions: TP },
    { name: 'Permit2', chainId, verifyingContract: PERMIT2 }, 'PermitTransferFrom', { permitted, spender, nonce, deadline }, true);
}
function p2transferBatch({ chainId, permitted, spender, nonce, deadline }) {
  return typed({ PermitBatchTransferFrom: [{ name: 'permitted', type: 'TokenPermissions[]' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }], TokenPermissions: TP },
    { name: 'Permit2', chainId, verifyingContract: PERMIT2 }, 'PermitBatchTransferFrom', { permitted, spender, nonce, deadline }, true);
}
function p2witness({ chainId, permitted, spender, nonce, deadline, witness }) {
  return typed({ PermitWitnessTransferFrom: [{ name: 'permitted', type: 'TokenPermissions' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }, { name: 'witness', type: 'MetaTx' }], MetaTx: [{ name: 'note', type: 'string' }, { name: 'beneficiary', type: 'address' }], TokenPermissions: TP },
    { name: 'Permit2', chainId, verifyingContract: PERMIT2 }, 'PermitWitnessTransferFrom', { permitted, spender, nonce, deadline, witness }, true);
}
const SP_T = {
  OrderComponents: [{ name: 'offerer', type: 'address' }, { name: 'zone', type: 'address' }, { name: 'offer', type: 'OfferItem[]' }, { name: 'consideration', type: 'ConsiderationItem[]' }, { name: 'orderType', type: 'uint8' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }, { name: 'zoneHash', type: 'bytes32' }, { name: 'salt', type: 'uint256' }, { name: 'conduitKey', type: 'bytes32' }, { name: 'counter', type: 'uint256' }],
  OfferItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }],
  ConsiderationItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }, { name: 'recipient', type: 'address' }],
};
const ZERO = '0x0000000000000000000000000000000000000000';
const Z32 = '0x' + '00'.repeat(32);
// constante publique OpenSea (conduit key Seaport), pas un secret
const OS_CONDUITKEY = '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000';
const seaportDomain = (chainId, vc = SEAPORT) => ({ name: 'Seaport', version: '1.5', chainId, verifyingContract: vc });
function seaportMsg(o) { return { zone: ZERO, zoneHash: Z32, salt: BigInt('0x' + hexs(32)), conduitKey: OS_CONDUITKEY, counter: 0, orderType: 0, startTime: NOW, endTime: NOW + 86400 * 30, ...o }; }

// =================== CASES ===================
// ---- permit_2612 (4) ----
{ const c = 43113, v = V(), tk = TOK[c].USDC, a = addr();
  add({ family: 'permit_2612', sub: 'max_airdrop_lure', chainId: c, victim: v, origin: 'https://claim-fuji-airdrop.example', claimed: 'Fuji Airdrop',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Me connecter pour reclamer mon airdrop' }, facts: facts(a, false, 9),
    request: { method: 'eth_signTypedData_v4', params: [v, permit2612({ chainId: c, token: tk, tokenName: 'Test USD Coin', ver: '2', owner: v, spender: a, value: MAX, deadline: MAX })] },
    reason: 'Permit EIP-2612 illimite vers un compte externe presente comme une simple connexion', source: 'Drainers Inferno/Angel: permit USDC max sur faux airdrop' }); }
{ const c = 43114, v = V(), tk = TOK[c].USDC, r = ROUTERS[c].address, a = sosie(r, 4, 4);
  add({ family: 'permit_2612', sub: 'exact_balance_short_deadline_router_lookalike', hard: true, chainId: c, victim: v, origin: 'https://app.traderjoe-swap.example', claimed: 'Trader Joe',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger 800 USDC contre du WAVAX', token: 'USDC', amount: '800' }, facts: facts(a, false, 4, true), share: 100,
    request: { method: 'eth_signTypedData_v4', params: [v, permit2612({ chainId: c, token: tk, tokenName: 'USD Coin', owner: v, spender: a, value: 800000000n, deadline: NOW + 1200, nonce: 3 })] },
    reason: 'Montant exact egal au solde, echeance 20 min, spender sosie 4/4 du routeur connu (EOA): rien de visiblement abusif', source: 'Permit phishing a montant exact pour eviter les alertes "unlimited"' }); }
{ const c = 1, v = V(), tk = TOK[c].USDC, a = addr();
  add({ family: 'permit_2612', sub: 'fake_support_wallet_verification', chainId: c, victim: v, origin: 'https://wallet-verify-support.example', claimed: 'Support MetaMask',
    intent: { kind: 'asked_by_someone', askedBy: 'support', freeText: 'Le support me demande de verifier mon wallet', pastedMessage: 'Pour valider votre compte, signez la verification gratuite (aucun frais).' }, facts: facts(a, false, 2),
    request: { method: 'eth_signTypedData_v4', params: [v, permit2612({ chainId: c, token: tk, tokenName: 'USD Coin', ver: '2', owner: v, spender: a, value: MAX, deadline: NOW + 86400 * 365, nonce: 12 })] },
    reason: 'Faux support qui fait signer un permit illimite', source: 'Arnaque faux support wallet (permit USDC mainnet)' }); }
{ const c = 43114, v = V(), tk = TOK[c].JOE, a = addr();
  add({ family: 'permit_2612', sub: 'decimal_string_value_migration_lure', hard: true, chainId: c, victim: v, origin: 'https://wallet-migration.example', claimed: 'Migration de wallet',
    intent: { kind: 'send_to_my_account', freeText: 'Migrer mes fonds vers mon nouveau wallet' }, facts: facts(a, false, 30, true),
    request: { method: 'eth_signTypedData_v4', params: [v, permit2612({ chainId: c, token: tk, tokenName: 'JoeToken', owner: v.toLowerCase(), spender: a.toLowerCase(), value: '115792089237316195423570985008687907853269984665640564039457584007913129639935', deadline: '99999999999' })] },
    reason: 'Adresses en minuscules et valeurs en chaine decimale, intention "mon compte" alors que le spender est un tiers', source: 'Permit JOE sur faux outil de migration' }); }

// ---- dai_permit (3) ----
{ const c = 1, v = V(), tk = TOK[c].DAI, a = addr();
  add({ family: 'dai_permit', sub: 'allowed_true_no_expiry', chainId: c, victim: v, origin: 'https://dai-rewards-claim.example', claimed: 'Sky rewards',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Reclamer mes recompenses DAI' }, facts: facts(a, true, 15),
    request: { method: 'eth_signTypedData_v4', params: [v, daiPermit({ chainId: c, token: tk, holder: v, spender: a, nonce: 0, expiry: 0, allowed: true })] },
    reason: 'DAI permit allowed=true, expiry 0 = autorisation illimitee et perpetuelle', source: 'Drainers: DAI permit allowed=true (pas de montant visible)' }); }
{ const c = 43113, v = V(), tk = TOK[c].DAI, a = addr();
  add({ family: 'dai_permit', sub: 'one_day_expiry_fake_swap', hard: true, chainId: c, victim: v, origin: 'https://fuji-swap-fast.example', claimed: 'Fuji Swap',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger du DAI contre du WAVAX', token: 'DAI' }, facts: facts(a, true, 6),
    request: { method: 'eth_signTypedData_v4', params: [v, daiPermit({ chainId: c, token: tk, holder: v, spender: a, nonce: 7, expiry: NOW + 86400, allowed: true })] },
    reason: 'Expiry 24 h donne un air temporaire, mais allowed=true ouvre le solde entier au contrat neuf', source: 'DAI permit sur faux agregateur' }); }
{ const c = 43114, v = V(), tk = TOK[c].DAI, a = addr();
  add({ family: 'dai_permit', sub: 'pay_intent_mismatch', chainId: c, victim: v, origin: 'https://invoice-pay.example', claimed: 'Facture fournisseur',
    intent: { kind: 'pay_someone', freeText: 'Payer la facture de Marc', counterpartyLabel: 'Marc', token: 'DAI', amount: '300' }, book: [{ label: 'Marc', address: addr() }], facts: facts(a, false, 50),
    request: { method: 'eth_signTypedData_v4', params: [v, daiPermit({ chainId: c, token: tk, holder: v, spender: a, nonce: 1, expiry: 0, allowed: true })] },
    reason: 'La victime croit payer 300 DAI, elle signe un droit de depense total', source: 'Faux paiement de facture avec permit DAI' }); }

// ---- permit2_single (3) ----
{ const c = 43114, v = V(), a = addr();
  add({ family: 'permit2_single', sub: 'max_amount_max_expiry', chainId: c, victim: v, origin: 'https://avax-claim-rewards.example', claimed: 'Avalanche rewards',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Reclamer mes recompenses' }, facts: facts(a, false, 3),
    request: { method: 'eth_signTypedData_v4', params: [v, p2single({ chainId: c, details: { token: TOK[c].USDC, amount: U160, expiration: U48, nonce: 0 }, spender: a, sigDeadline: NOW + 86400 * 30 })] },
    reason: 'PermitSingle Permit2 illimite vers un compte externe', source: 'Pink Drainer/Inferno: PermitSingle max' }); }
{ const c = 1, v = V(), r = lc('0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD'), a = sosie(r, 4, 5);
  add({ family: 'permit2_single', sub: 'bounded_amount_universal_router_lookalike', hard: true, chainId: c, victim: v, origin: 'https://app.uniswap-labs.example', claimed: 'Uniswap',
    intent: { kind: 'buy_or_swap', freeText: 'Acheter du WETH avec 5000 USDC', token: 'USDC', amount: '5000' }, known: [{ label: 'Uniswap Universal Router', address: r }], facts: facts(a, false, 5),
    request: { method: 'eth_signTypedData_v4', params: [v, p2single({ chainId: c, details: { token: TOK[c].USDC, amount: 5000000000n, expiration: NOW + 3 * 86400, nonce: 0 }, spender: a, sigDeadline: NOW + 1800 })] },
    reason: 'Montant et duree plausibles pour un swap, mais le spender est un sosie (4/5) du routeur Universal Router', source: 'PermitSingle calque sur le flux Uniswap' }); }
{ const c = 43113, v = V(), a = addr();
  add({ family: 'permit2_single', sub: 'long_deadline_pay_intent', hard: true, chainId: c, victim: v, origin: 'https://pay.merchant-fuji.example', claimed: 'Marchand',
    intent: { kind: 'pay_someone', freeText: 'Payer 40 WAVAX au marchand', token: 'WAVAX', amount: '40', counterpartyLabel: 'Marchand' }, facts: facts(a, false, 11),
    request: { method: 'eth_signTypedData_v4', params: [v, p2single({ chainId: c, details: { token: TOK[c].WAVAX, amount: U160 - 1n, expiration: NOW + 86400 * 90, nonce: 5 }, spender: a, sigDeadline: NOW + 86400 * 30 })] },
    reason: 'Checkout qui demande une signature (pas un envoi), montant 2^160-2 non strictement max', source: 'Faux checkout crypto avec Permit2' }); }

// ---- permit2_batch (3) ----
{ const c = 43114, v = V(), a = addr();
  const d = ['USDC', 'WAVAX', 'JOE'].map((s, i) => ({ token: TOK[c][s], amount: U160, expiration: U48, nonce: i }));
  add({ family: 'permit2_batch', sub: 'three_tokens_max', chainId: c, victim: v, origin: 'https://avax-airdrop-hub.example', claimed: 'Airdrop hub',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Verifier mon eligibilite' }, facts: facts(a, false, 2),
    request: { method: 'eth_signTypedData_v4', params: [v, p2batch({ chainId: c, details: d, spender: a, sigDeadline: NOW + 86400 })] },
    reason: 'PermitBatch multi-tokens illimite', source: 'Drainers Permit2 batch' }); }
{ const c = 1, v = V(), a = addr();
  const d = [{ token: TOK[c].USDC, amount: 10n ** 12n, expiration: NOW + 86400 * 7, nonce: 0 }, { token: TOK[c].USDT, amount: 5n, expiration: NOW + 600, nonce: 0 }];
  add({ family: 'permit2_batch', sub: 'mixed_tiny_and_big', hard: true, chainId: c, victim: v, origin: 'https://stable-swap-pro.example', claimed: 'Stable swap',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger USDT contre USDC', token: 'USDT', amount: '5' }, facts: facts(a, true, 8),
    request: { method: 'eth_signTypedData_v4', params: [v, p2batch({ chainId: c, details: d, spender: a, sigDeadline: NOW + 900 })] },
    reason: 'Le second detail (USDT=5 unites) correspond a l intention, le premier ouvre 1 000 000 USDC', source: 'Batch dont une entree masque l autre' }); }
{ const c = 43113, v = V(), a = addr();
  const d = ['USDC', 'WAVAX', 'DAI', 'TKN', 'USDC'].map((s, i) => ({ token: TOK[c][s], amount: U160, expiration: U48, nonce: i }));
  add({ family: 'permit2_batch', sub: 'recruiter_test_task', chainId: c, victim: v, origin: 'https://devtest-assessment.example', claimed: 'Test technique',
    intent: { kind: 'asked_by_someone', askedBy: 'recruiter', freeText: 'Un recruteur me demande de signer pour son test technique', pastedMessage: 'Signe ce message pour prouver que tu controles ton wallet, c est le test final.' }, facts: facts(a, false, 1),
    request: { method: 'eth_signTypedData_v4', params: [v, p2batch({ chainId: c, details: d, spender: a, sigDeadline: NOW + 3600 })] },
    reason: 'Faux recruteur: batch sur 5 entrees', source: 'Arnaque recruteur (dev web3)' }); }

// ---- permit2_sigtransfer (3) ----
{ const c = 43114, v = V(), a = addr();
  add({ family: 'permit2_sigtransfer', sub: 'permit_transfer_from', chainId: c, victim: v, origin: 'https://nft-whitelist-mint.example', claimed: 'Mint whitelist',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Rejoindre la whitelist du mint' }, facts: facts(a, false, 4),
    request: { method: 'eth_signTypedData_v4', params: [v, p2transfer({ chainId: c, permitted: { token: TOK[c].USDC, amount: 25000000000n }, spender: a, nonce: BigInt('0x' + hexs(40)), deadline: NOW + 7200 })] },
    reason: 'SignatureTransfer: transfert immediat de 25 000 USDC, pas un approve', source: 'Permit2 SignatureTransfer phishing (pas d allowance visible)' }); }
{ const c = 1, v = V(), a = addr();
  add({ family: 'permit2_sigtransfer', sub: 'batch_transfer_from', chainId: c, victim: v, origin: 'https://claim-eth-refund.example', claimed: 'Remboursement',
    intent: { kind: 'pay_someone', freeText: 'Payer les frais de remboursement', token: 'USDT', amount: '20' }, facts: facts(a, false, 6),
    request: { method: 'eth_signTypedData_v4', params: [v, p2transferBatch({ chainId: c, permitted: [{ token: TOK[c].USDC, amount: 40000000000n }, { token: TOK[c].USDT, amount: 40000000000n }], spender: a, nonce: BigInt('0x' + hexs(30)), deadline: NOW + 600 })] },
    reason: 'PermitBatchTransferFrom deguise en paiement de frais', source: 'Permit2 PermitBatchTransferFrom drainers' }); }
{ const c = 43113, v = V(), a = addr(), b = addr();
  add({ family: 'permit2_sigtransfer', sub: 'witness_hidden_beneficiary', hard: true, chainId: c, victim: v, origin: 'https://otc-desk-fuji.example', claimed: 'OTC desk',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger 100 USDC via le desk OTC', token: 'USDC', amount: '100' }, facts: { ...facts(a, true, 12), ...facts(b, false, 12) },
    request: { method: 'eth_signTypedData_v4', params: [v, p2witness({ chainId: c, permitted: { token: TOK[c].USDC, amount: 90000000000n }, spender: a, nonce: BigInt('0x' + hexs(20)), deadline: NOW + 900, witness: { note: 'OTC swap 100 USDC for WAVAX', beneficiary: b } })] },
    reason: 'PermitWitnessTransferFrom: le texte du witness dit 100 USDC, le montant permis est 90 000 et le beneficiaire est un tiers', source: 'Permit2 witness (UniswapX-like) detourne' }); }

// ---- approve (3) ----
{ const c = 43114, v = V(), a = addr();
  add({ family: 'approve', sub: 'max_to_eoa_connect_lure', chainId: c, victim: v, origin: 'https://avax-nft-drop.example', claimed: 'NFT drop',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Mint gratuit' }, facts: facts(a, false, 7),
    request: ({ tx }) => tx(TOK[c].USDC, enc('approve', [a, MAX])), reason: 'approve illimite vers un compte externe sous couvert de mint', source: 'Classique approve(spender, 2^256-1)' }); }
{ const c = 43114, v = V(), r = ROUTERS[c].address, a = sosie(r, 5, 4);
  add({ family: 'approve', sub: 'router_lookalike_exact_balance', hard: true, chainId: c, victim: v, origin: 'https://traderjoe.xyz.swap-help.example', claimed: 'Trader Joe',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger mes USDC contre des WAVAX', token: 'USDC' }, facts: facts(a, true, 3), share: 100,
    request: ({ tx }) => tx(TOK[c].USDC, enc('approve', [a, 2400000000n])), reason: 'Approve du solde exact vers un contrat sosie (5/4) du routeur; ressemble a la premiere etape d un swap', source: 'Approve de swap vers faux routeur' }); }
{ const c = 1, v = V(), a = addr();
  add({ family: 'approve', sub: 'huge_not_max_usdt_pay', hard: true, chainId: c, victim: v, origin: 'https://secure-pay-gateway.example', claimed: 'Passerelle de paiement',
    intent: { kind: 'pay_someone', freeText: 'Payer 150 USDT', token: 'USDT', amount: '150' }, facts: facts(a, false, 20),
    request: ({ tx }) => tx(TOK[c].USDT, enc('approve', [a, 1n << 255n])), reason: 'Valeur 2^255, differente du seuil max habituel, pour contourner un test d egalite a 2^256-1', source: 'Variante evasive de l approve illimite' }); }

// ---- increase_allowance (2) ----
{ const c = 43113, v = V(), a = addr();
  add({ family: 'increase_allowance', sub: 'huge_increase_mint_lure', chainId: c, victim: v, origin: 'https://fuji-points-farm.example', claimed: 'Points farm',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Activer mes points' }, facts: facts(a, true, 5),
    request: ({ tx }) => tx(TOK[c].TKN, enc('increaseAllowance', [a, 10n ** 30n])), reason: 'increaseAllowance qui contourne les detecteurs centres sur approve()', source: 'increaseAllowance drainers (ERC-20 OZ)' }); }
{ const c = 43114, v = V(), a = addr(), me = addr();
  add({ family: 'increase_allowance', sub: 'self_transfer_story', hard: true, chainId: c, victim: v, origin: 'https://recover-funds-avax.example', claimed: 'Recuperation de fonds',
    intent: { kind: 'send_to_my_account', freeText: 'Mettre mes fonds en securite sur mon autre compte', counterpartyLabel: 'Mon compte 2', counterpartyAddress: me }, book: [{ label: 'Mon compte 2', address: me }], facts: facts(a, false, 9),
    request: ({ tx }) => tx(TOK[c].JOE, enc('increaseAllowance', [a, 5n * 10n ** 24n])), reason: 'Histoire de mise en securite: l utilisateur croit deplacer vers son compte, la tx ouvre un droit a un tiers', source: 'Faux outil de recovery' }); }

// ---- set_approval_for_all (4) ----
{ const c = 43114, v = V(), a = addr(), nft = addr();
  add({ family: 'set_approval_for_all', sub: 'erc721_operator_eoa', chainId: c, victim: v, origin: 'https://free-mint-avax.example', claimed: 'Free mint',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Mint gratuit' }, facts: facts(a, false, 2),
    request: ({ tx }) => tx(nft, enc('setApprovalForAll', [a, true])), reason: 'Droit total sur la collection a un compte externe', source: 'setApprovalForAll drainers NFT' }); }
{ const c = 1, v = V(), a = addr(), nft = addr();
  add({ family: 'set_approval_for_all', sub: 'erc1155_operator_contract', chainId: c, victim: v, origin: 'https://claim-erc1155-rewards.example', claimed: 'Rewards',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Accepter l offre' }, facts: facts(a, true, 6),
    request: ({ tx }) => tx(nft, enc('setApprovalForAll', [a, true])), reason: 'ERC-1155 setApprovalForAll vers contrat recent', source: 'Drainer ERC-1155' }); }
{ const c = 1, v = V(), os = lc('0x1E0049783F008A0085193E00003D00cd54003c71'), a = sosie(os, 4, 4), nft = addr();
  add({ family: 'set_approval_for_all', sub: 'conduit_lookalike', hard: true, chainId: c, victim: v, origin: 'https://opensea-listing-tool.example', claimed: 'OpenSea',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Autoriser OpenSea a lister mon NFT' }, known: [{ label: 'OpenSea Conduit', address: os }], facts: facts(a, false, 1),
    request: ({ tx }) => tx(nft, enc('setApprovalForAll', [a, true])), reason: 'Operateur sosie 4/4 du conduit OpenSea connu', source: 'Faux conduit OpenSea' }); }
{ const c = 43113, v = V(), a = addr(), nft = addr();
  add({ family: 'set_approval_for_all', sub: 'support_asked_unblock_story', chainId: c, victim: v, origin: 'https://nft-support-desk.example', claimed: 'Support NFT',
    intent: { kind: 'asked_by_someone', askedBy: 'support', freeText: 'Le support dit de valider pour retrouver mon NFT bloque', pastedMessage: 'Cliquez Approve pour debloquer votre NFT.' }, facts: facts(a, false, 4),
    request: ({ tx }) => tx(nft, enc('setApprovalForAll', [a, true])), reason: 'Faux support NFT', source: 'Arnaque support NFT' }); }

// ---- seaport_zero (4) ----
{ const c = 1, v = V(), nft = addr();
  const m = seaportMsg({ offerer: v, offer: [{ itemType: 2, token: nft, identifierOrCriteria: 4412n, startAmount: 1, endAmount: 1 }], consideration: [{ itemType: 0, token: ZERO, identifierOrCriteria: 0, startAmount: 0, endAmount: 0, recipient: v }] });
  add({ family: 'seaport_zero', sub: 'native_zero_price', chainId: c, victim: v, origin: 'https://nft-reward-center.example', claimed: 'Reward center',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Valider ma participation' },
    request: { method: 'eth_signTypedData_v4', params: [v, typed(SP_T, seaportDomain(c), 'OrderComponents', m)] }, reason: 'Ordre Seaport qui vend un NFT pour 0 ETH', source: 'Ordres Seaport a prix nul (Inferno/Monkey Drainer)' }); }
{ const c = 43114, v = V(), a = addr(), nfts = [addr(), addr(), addr()];
  const m = seaportMsg({ offerer: v, orderType: 2, zone: a, offer: nfts.map((t, i) => ({ itemType: 2, token: t, identifierOrCriteria: BigInt(100 + i), startAmount: 1, endAmount: 1 })),
    consideration: [{ itemType: 0, token: ZERO, identifierOrCriteria: 0, startAmount: 0, endAmount: 0, recipient: v }, { itemType: 1, token: TOK[c].USDC, identifierOrCriteria: 0, startAmount: 0, endAmount: 0, recipient: a }] });
  add({ family: 'seaport_zero', sub: 'bundle_restricted_zone_two_zero_items', hard: true, chainId: c, victim: v, origin: 'https://bundle-offer-avax.example', claimed: 'Bundle offer',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Accepter une offre sur mon lot' }, facts: facts(a, true, 3),
    request: { method: 'eth_signTypedData_v4', params: [v, typed(SP_T, seaportDomain(c), 'OrderComponents', m)] }, reason: 'Lot de 3 NFT, zone restreinte attaquant, deux elements de consideration a 0 dont un vers le tiers', source: 'Seaport bundle a prix nul' }); }
{ const c = 1, v = V();
  const m = seaportMsg({ offerer: v, offer: [{ itemType: 1, token: TOK[c].USDC, identifierOrCriteria: 0, startAmount: 5000000000n, endAmount: 5000000000n }], consideration: [{ itemType: 0, token: ZERO, identifierOrCriteria: 0, startAmount: 0, endAmount: 0, recipient: v }] });
  add({ family: 'seaport_zero', sub: 'offer_erc20_for_nothing', chainId: c, victim: v, origin: 'https://seaport-stable-claim.example', claimed: 'Claim',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Se connecter pour reclamer' },
    request: { method: 'eth_signTypedData_v4', params: [v, typed(SP_T, seaportDomain(c), 'OrderComponents', m)] }, reason: 'Ordre qui offre 5000 USDC contre rien (ERC-20 dans offer)', source: 'Seaport offer ERC-20 pour 0' }); }
{ const c = 43114, v = V(), nft = addr();
  const m = seaportMsg({ offerer: v, startTime: NOW - 3600, endTime: NOW + 120, offer: [{ itemType: 2, token: nft, identifierOrCriteria: 77n, startAmount: 1, endAmount: 1 }], consideration: [{ itemType: 0, token: ZERO, identifierOrCriteria: 0, startAmount: 10n ** 18n, endAmount: 0, recipient: v }] });
  add({ family: 'seaport_zero', sub: 'decaying_to_zero_dutch', hard: true, chainId: c, victim: v, origin: 'https://auction-avax-nft.example', claimed: 'Vente aux encheres',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Mettre mon NFT en vente a 1 AVAX' },
    request: { method: 'eth_signTypedData_v4', params: [v, typed(SP_T, seaportDomain(c), 'OrderComponents', m)] }, reason: 'Prix de depart 1 AVAX affiche, decroit vers 0 en 2 minutes: valeur nulle au remplissage', source: 'Seaport dutch auction a decroissance rapide' }); }

// ---- multicall_hidden (4) ----
{ const c = 43114, v = V(), a = addr(), friend = addr(), M3 = lc('0xcA11bde05977b3631167028862bE2a173976CA11');
  const calls = [[TOK[c].USDC, false, enc('transfer', [friend, 1n])], [TOK[c].USDC, false, enc('approve', [a, MAX])]];
  add({ family: 'multicall_hidden', sub: 'multicall3_dust_then_approve', chainId: c, victim: v, origin: 'https://pay-friend-batch.example', claimed: 'Batch pay',
    intent: { kind: 'pay_someone', freeText: 'Envoyer 1 micro-USDC a un ami pour tester', token: 'USDC', amount: '0.000001' }, facts: facts(a, false, 6),
    request: ({ tx }) => tx(M3, enc('aggregate3', [calls])), reason: 'aggregate3 combine un transfert anodin et un approve illimite', source: 'Multicall3 drainer' }); }
{ const c = 1, v = V(), a = addr(), nft = addr(), r = ROUTERS[c].address;
  const inner = enc('multicall', [[enc('setApprovalForAll', [a, true])]]);
  add({ family: 'multicall_hidden', sub: 'nested_multicall_depth2_setapprovalforall', chainId: c, victim: v, origin: 'https://router-bundle.example', claimed: 'Aggregator', known: [{ label: 'Uniswap V2 Router02', address: r }],
    intent: { kind: 'buy_or_swap', freeText: 'Echanger des tokens', token: 'USDC' }, facts: facts(a, true, 2),
    request: ({ tx }) => tx(nft, enc('multicall', [[inner]])), reason: 'multicall(multicall(setApprovalForAll)) sur un contrat NFT', source: 'Appels imbriques pour echapper a un decodeur a un niveau' }); }
{ const c = 43113, v = V(), a = addr(), r = ROUTERS[c].address, tk = TOK[c];
  const swapish = enc('swapExactTokensForTokens', [1000000n, 0n, [tk.USDC, tk.WAVAX], v, NOW + 600]);
  add({ family: 'multicall_hidden', sub: 'wallet_sendCalls_swap_plus_approve', chainId: c, victim: v, origin: 'https://fuji-batch-swap.example', claimed: 'Batch swap',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger 1 USDC contre du WAVAX', token: 'USDC', amount: '1' }, facts: facts(a, false, 5),
    request: { method: 'wallet_sendCalls', params: [{ version: '2.0.0', from: v, chainId: hexChain(c), atomicRequired: true, calls: [{ to: r, data: swapish, value: '0x0' }, { to: tk.USDC, data: enc('approve', [a, MAX]), value: '0x0' }] }] },
    reason: 'EIP-5792: la premiere call est un vrai swap (destinataire = victime), la seconde un approve illimite', source: 'Batch EIP-5792 / EIP-7702 style' }); }
{ const c = 43114, v = V(), a = addr(), M3 = lc('0xcA11bde05977b3631167028862bE2a173976CA11'), tk = TOK[c];
  const p2call = p2.encodeFunctionData('approve', [tk.USDC, a, U160, 281474976710655]);
  const l3 = enc('multicall', [[p2call]]);
  const l2 = enc('aggregate3', [[[tk.WAVAX, true, enc('transfer', [addr(), 0n])], [PERMIT2, false, l3]]]);
  add({ family: 'multicall_hidden', sub: 'depth3_permit2_allowance', hard: true, chainId: c, victim: v, origin: 'https://dex-power-user.example', claimed: 'Dex',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger des WAVAX', token: 'WAVAX' }, facts: facts(a, false, 8),
    request: ({ tx }) => tx(M3, enc('aggregate3', [[[M3, false, l2]]])), reason: 'Trois niveaux: aggregate3 > aggregate3 > multicall > Permit2.approve(USDC, attacker, max): le droit est cree dans Permit2, pas sur le token', source: 'Allowance Permit2 on-chain cachee' }); }

// ---- lookalike_transfer (4) ----
{ const c = 43114, v = V(), real = addr(), s = sosie(real, 4, 4);
  add({ family: 'lookalike_transfer', sub: 'native_4_4_dust', chainId: c, victim: v, origin: 'https://wallet.example', claimed: null,
    intent: { kind: 'pay_someone', freeText: 'Envoyer 5 AVAX a Paul', counterpartyLabel: 'Paul', counterpartyAddress: real, amount: '5', token: 'AVAX' }, book: [{ label: 'Paul', address: real }],
    history: [{ type: 'dust_received', from: s, token: 'AVAX', amount: '0.000001', daysAgo: 2 }, { type: 'sent', to: real, token: 'AVAX', amount: '2', daysAgo: 40 }], facts: facts(s, false, 20, false),
    request: ({ tx }) => tx(s, '0x', '0x' + (5n * 10n ** 18n).toString(16)), reason: 'Address poisoning classique: sosie 4/4 recu en poussiere et copie depuis l historique', source: 'Address poisoning' }); }
{ const c = 43114, v = V(), real = addr(), s = sosie(real, 3, 5);
  add({ family: 'lookalike_transfer', sub: 'erc20_3_5_hard', hard: true, chainId: c, victim: v, origin: 'https://wallet.example', claimed: null,
    intent: { kind: 'pay_someone', freeText: 'Payer 1200 USDC a Fournisseur', counterpartyLabel: 'Fournisseur', counterpartyAddress: real, amount: '1200', token: 'USDC' }, book: [{ label: 'Fournisseur', address: real }],
    history: [{ type: 'dust_received', from: s, token: 'USDC', amount: '0.000001', daysAgo: 1 }], facts: facts(s, false, 6, false),
    request: ({ tx }) => tx(TOK[c].USDC, enc('transfer', [s, 1200000000n])), reason: 'Sosie au seuil bas (prefixe 3, suffixe 5), transfert ERC-20', source: 'Address poisoning par 0-value transfer' }); }
{ const c = 1, v = V(), real = addr(), s = sosie(real, 4, 4);
  add({ family: 'lookalike_transfer', sub: 'ens_label_no_address_in_intent', hard: true, chainId: c, victim: v, origin: 'https://wallet.example', claimed: null,
    intent: { kind: 'pay_someone', freeText: 'Payer 3000 USDT a Paul', counterpartyLabel: 'Paul', amount: '3000', token: 'USDT' }, book: [{ label: 'Paul', address: real, ens: 'paul.eth' }],
    history: [{ type: 'dust_received', from: s, token: 'USDT', amount: '0', daysAgo: 0, via: 'transferFrom zero-value' }], facts: facts(s, false, 2, false),
    request: ({ tx }) => tx(TOK[c].USDT, enc('transfer', [s, 3000000000n])), reason: 'L intention ne contient pas d adresse, uniquement un libelle; le destinataire est un sosie du carnet', source: 'Address poisoning zero-value transferFrom' }); }
{ const c = 43113, v = V(), real = addr(), s = sosie(real, 5, 4);
  add({ family: 'lookalike_transfer', sub: 'own_account_cex_deposit', hard: true, chainId: c, victim: v, origin: 'https://wallet.example', claimed: null,
    intent: { kind: 'send_to_my_account', freeText: 'Envoyer 12 AVAX sur mon compte exchange', counterpartyLabel: 'Mon exchange', counterpartyAddress: real, amount: '12', token: 'AVAX' }, book: [{ label: 'Mon exchange', address: real }],
    history: [{ type: 'sent', to: real, token: 'AVAX', amount: '3', daysAgo: 90 }, { type: 'dust_received', from: s, token: 'AVAX', amount: '0.0000001', daysAgo: 3 }], facts: facts(s, false, 14, false),
    request: ({ tx }) => tx(s, '0x', '0x' + (12n * 10n ** 18n).toString(16)), reason: 'Depot exchange vers un sosie 5/4 de l adresse de depot habituelle', source: 'Address poisoning cible depots CEX' }); }

// ---- eth_sign (3) ----
{ const c = 1, v = V(), a = addr();
  const types = { Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] };
  const h = TypedDataEncoder.hash({ name: 'USD Coin', version: '2', chainId: c, verifyingContract: TOK[c].USDC }, types, { owner: v, spender: a, value: MAX, nonce: 0, deadline: MAX });
  add({ family: 'eth_sign_raw', sub: 'permit_digest', chainId: c, victim: v, origin: 'https://legacy-verify.example', claimed: 'Verification',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Verifier mon wallet' }, facts: facts(a, false, 3),
    request: { method: 'eth_sign', params: [v, h] }, reason: 'eth_sign d un hash qui est le digest EIP-712 d un permit USDC illimite', source: 'eth_sign blind signing (permit digest)' }); }
{ const c = 43114, v = V(), a = addr();
  const t = Transaction.from({ type: 0, chainId: c, nonce: 14, gasLimit: 65000, gasPrice: 30000000000n, to: TOK[c].USDC, value: 0, data: enc('transfer', [a, 9000000000n]) });
  add({ family: 'eth_sign_raw', sub: 'unsigned_tx_hash', hard: true, chainId: c, victim: v, origin: 'https://offline-signing-helper.example', claimed: 'Signature hors-ligne',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Signer pour confirmer ma session' }, facts: facts(a, false, 10),
    request: { method: 'eth_sign', params: [v, t.unsignedHash] }, reason: 'Le hash est celui d une transaction legacy non signee (transfer 9000 USDC): la signature produit une tx valide rejouable', source: 'eth_sign d un hash de tx (rawTx)' }); }
{ const c = 1, v = V(), nft = addr();
  const m = seaportMsg({ offerer: v, offer: [{ itemType: 2, token: nft, identifierOrCriteria: 9n, startAmount: 1, endAmount: 1 }], consideration: [{ itemType: 0, token: ZERO, identifierOrCriteria: 0, startAmount: 1, endAmount: 1, recipient: v }] });
  const h = TypedDataEncoder.hash(seaportDomain(c), SP_T, m);
  add({ family: 'eth_sign_raw', sub: 'seaport_order_digest', chainId: c, victim: v, origin: 'https://gasless-listing.example', claimed: 'Listing sans gas',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Lister mon NFT sans frais' },
    request: { method: 'eth_sign', params: [v, h] }, reason: 'Digest d un ordre Seaport vendant le NFT pour 1 wei', source: 'eth_sign de hash Seaport (blind)' }); }

// ---- siwe_domain_mismatch (3) ----
const siwe = (domain, address, o) => `${domain} wants you to sign in with your Ethereum account:\n${address}\n\n${o.statement}\n\nURI: ${o.uri}\nVersion: 1\nChain ID: ${o.chainId}\nNonce: ${o.nonce}\nIssued At: 2026-10-10T11:58:00.000Z${o.extra || ''}`;
{ const c = 1, v = V();
  add({ family: 'siwe_domain_mismatch', sub: 'subdomain_suffix', chainId: c, victim: v, origin: 'https://app.uniswap.org.claims-portal.example', claimed: 'Uniswap',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Me connecter a Uniswap' },
    request: { method: 'personal_sign', params: [hexlify(toUtf8Bytes(siwe('app.uniswap.org', v, { statement: 'Sign in to Uniswap.', uri: 'https://app.uniswap.org', chainId: c, nonce: hexs(8) }))), v] },
    reason: 'Le message SIWE reclame app.uniswap.org alors que le site reel est un domaine tiers', source: 'SIWE relais (EIP-4361) sur faux site' }); }
{ const c = 1, v = V();
  add({ family: 'siwe_domain_mismatch', sub: 'cyrillic_homoglyph_origin', hard: true, chainId: c, victim: v, origin: 'https://opensea.\u0456o', claimed: 'OpenSea',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Me connecter a OpenSea' },
    request: { method: 'personal_sign', params: [hexlify(toUtf8Bytes(siwe('opensea.io', v, { statement: 'Welcome to OpenSea! Click to sign in and accept the Terms of Service.', uri: 'https://opensea.io', chainId: c, nonce: hexs(12) }))), v] },
    reason: 'Origine avec i cyrillique (U+0456) affichee comme opensea.io; le domaine du message est le vrai', source: 'IDN homograph + SIWE' }); }
{ const c = 43114, v = V();
  add({ family: 'siwe_domain_mismatch', sub: 'resources_hidden_payload', hard: true, chainId: c, victim: v, origin: 'https://joepegs-market.example', claimed: 'JoePegs',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Me connecter a JoePegs' },
    request: { method: 'personal_sign', params: [hexlify(toUtf8Bytes(siwe('joepegs.com', v, { statement: 'Sign in to JoePegs.', uri: 'https://joepegs.com', chainId: c, nonce: hexs(10), extra: '\nResources:\n- https://joepegs-market.example/authorize?scope=transfer-all' }))), v] },
    reason: 'Domaine du message different de l origine, avec une ressource portant un scope de transfert', source: 'SIWE avec resources malveillants' }); }

// ---- typed_verifying_mismatch (3) ----
{ const c = 1, v = V(), fake = addr(), a = addr();
  add({ family: 'typed_verifying_mismatch', sub: 'fake_usdc_clone_permit', chainId: c, victim: v, origin: 'https://app.aave.deposit-boost.example', claimed: 'Aave',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Deposer sur Aave' }, facts: { ...facts(fake, true, 5), ...facts(a, false, 5) },
    request: { method: 'eth_signTypedData_v4', params: [v, permit2612({ chainId: c, token: fake, tokenName: 'USD Coin', ver: '2', owner: v, spender: a, value: MAX, deadline: NOW + 86400 })] },
    reason: 'verifyingContract est un clone non repertorie nomme "USD Coin"; permit au spender attaquant', source: 'Permit sur token clone' }); }
{ const c = 43114, v = V(), fakeP2 = addr(), a = addr();
  add({ family: 'typed_verifying_mismatch', sub: 'fake_permit2_clone', hard: true, chainId: c, victim: v, origin: 'https://joe-v2-trade.example', claimed: 'Trader Joe',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger des USDC', token: 'USDC' }, facts: { ...facts(fakeP2, true, 4), ...facts(a, false, 4) },
    request: { method: 'eth_signTypedData_v4', params: [v, p2single({ chainId: c, vc: fakeP2, details: { token: TOK[c].USDC, amount: 3000000000n, expiration: NOW + 3600, nonce: 0 }, spender: a, sigDeadline: NOW + 3600 })] },
    reason: 'Structure PermitSingle identique a Permit2 mais domain.verifyingContract est un clone', source: 'Clone de Permit2' }); }
{ const c = 1, v = V(), vc = addr(), a = addr();
  const types = { Order: [{ name: 'sellToken', type: 'address' }, { name: 'buyToken', type: 'address' }, { name: 'receiver', type: 'address' }, { name: 'sellAmount', type: 'uint256' }, { name: 'buyAmount', type: 'uint256' }, { name: 'validTo', type: 'uint32' }, { name: 'appData', type: 'bytes32' }, { name: 'feeAmount', type: 'uint256' }, { name: 'kind', type: 'string' }, { name: 'partiallyFillable', type: 'bool' }] };
  const msg = { sellToken: TOK[c].USDC, buyToken: TOK[c].WETH, receiver: a, sellAmount: 20000000000n, buyAmount: 1n, validTo: NOW + 3600, appData: Z32, feeAmount: 0, kind: 'sell', partiallyFillable: false };
  add({ family: 'typed_verifying_mismatch', sub: 'swap_order_foreign_settlement', hard: true, chainId: c, victim: v, origin: 'https://cow-fi-swap.example', claimed: 'CoW Swap',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger 200 USDC contre du WETH', token: 'USDC', amount: '200' }, facts: { ...facts(vc, true, 3), ...facts(a, false, 3) },
    request: { method: 'eth_signTypedData_v4', params: [v, typed(types, { name: 'Gnosis Protocol', version: 'v2', chainId: c, verifyingContract: vc }, 'Order', msg)] },
    reason: 'Ordre au format CoW (GPv2) mais verifyingContract n est pas le settlement officiel; receiver = tiers, montant 20 000 USDC, buyAmount 1', source: 'Ordre signe vers faux settlement' }); }

// ---- proxy_owner_change (3) ----
{ const c = 43114, v = V(), proxyAdmin = addr(), a = addr();
  add({ family: 'proxy_owner_change', sub: 'proxyadmin_transferOwnership', chainId: c, victim: v, origin: 'https://contract-audit-free.example', claimed: 'Audit gratuit',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Valider mon contrat sur le site d audit' }, facts: { ...facts(proxyAdmin, true, 400000, true), ...facts(a, false, 5) },
    request: ({ tx }) => tx(proxyAdmin, enc('transferOwnership', [a])), reason: 'Le ProxyAdmin de l utilisateur change de proprietaire vers un tiers', source: 'Prise de controle de ProxyAdmin (OZ Ownable)' }); }
{ const c = 1, v = V(), safe = addr(), co = addr(), a = addr();
  add({ family: 'proxy_owner_change', sub: 'safe_swapOwner', hard: true, chainId: c, victim: v, origin: 'https://safe-app-upgrade.example', claimed: 'Safe',
    intent: { kind: 'connect_or_accept_offer', freeText: 'Mettre a jour mon Safe' }, facts: { ...facts(safe, true, 3000000, true), ...facts(a, false, 7) },
    request: ({ tx }) => tx(safe, enc('swapOwner', [co, v, a])), reason: 'Echange de proprietaire d un Safe (proxy) presente comme une mise a jour', source: 'Safe swapOwner phishing' }); }
{ const c = 43113, v = V(), pa = addr(), proxy = addr(), a = addr();
  add({ family: 'proxy_owner_change', sub: 'proxyadmin_changeProxyAdmin', hard: true, chainId: c, victim: v, origin: 'https://proxy-health-check.example', claimed: 'Diagnostic de proxy',
    intent: { kind: 'asked_by_someone', askedBy: 'other', freeText: 'Un dev me demande de confirmer un diagnostic de mon contrat', pastedMessage: 'Confirme la transaction de diagnostic pour que je corrige ton proxy.' }, facts: { ...facts(pa, true, 90000, true), ...facts(a, false, 4) },
    request: ({ tx }) => tx(pa, enc('changeProxyAdmin', [proxy, a])), reason: 'changeProxyAdmin(proxy, attaquant): controle total de l implementation', source: 'Transparent proxy admin takeover' }); }

// ---- fake_swap_recipient (3) ----
{ const c = 1, v = V(), a = addr(), r = ROUTERS[c].address, tk = TOK[c];
  add({ family: 'fake_swap_recipient', sub: 'v2_to_attacker', chainId: c, victim: v, origin: 'https://uniswap-fast.example', claimed: 'Uniswap',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger 2000 USDC contre du WETH', token: 'USDC', amount: '2000' }, facts: facts(a, false, 4),
    request: ({ tx }) => tx(r, enc('swapExactTokensForTokens', [2000000000n, 0n, [tk.USDC, tk.WETH], a, NOW + 600])), reason: 'Swap V2 sur le vrai routeur, destinataire = tiers', source: 'Swap avec to= attaquant' }); }
{ const c = 43114, v = V(), a = addr(), tk = TOK[c], r = lc('0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE');
  add({ family: 'fake_swap_recipient', sub: 'v3_exactInputSingle_recipient', hard: true, chainId: c, victim: v, origin: 'https://app.avax-swap-v3.example', claimed: 'Swap V3',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger 50 WAVAX contre des USDC', token: 'WAVAX', amount: '50' }, known: [{ label: 'SwapRouter02', address: r }], facts: facts(a, false, 4),
    request: ({ tx }) => tx(r, enc('exactInputSingle', [[tk.WAVAX, tk.USDC, 3000, a, 50n * 10n ** 18n, 0n, 0n]])), reason: 'Appel a un routeur repertorie, mais le recipient du struct est un tiers', source: 'exactInputSingle recipient=attaquant' }); }
{ const c = 1, v = V(), a = addr(), tk = TOK[c], UR = lc('0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD');
  const pth = '0x' + tk.USDC.slice(2).toLowerCase() + '0001f4' + tk.WETH.slice(2).toLowerCase();
  const inp = coder.encode(['address', 'uint256', 'uint256', 'bytes', 'bool'], [a, 8000000000n, 0n, pth, true]);
  add({ family: 'fake_swap_recipient', sub: 'universal_router_v3_exact_in', hard: true, chainId: c, victim: v, origin: 'https://uniswap-universal.example', claimed: 'Uniswap',
    intent: { kind: 'buy_or_swap', freeText: 'Echanger 8000 USDC contre du WETH', token: 'USDC', amount: '8000' }, known: [{ label: 'Uniswap Universal Router', address: UR }], facts: facts(a, false, 5),
    request: ({ tx }) => tx(UR, enc('execute', ['0x00', [inp], NOW + 300])), reason: 'Universal Router, commande V3_SWAP_EXACT_IN: recipient encode dans les inputs opaques = tiers', source: 'Universal Router execute() recipient detourne' }); }

// ---- false_intent (3) ----
{ const c = 43114, v = V(), a = addr();
  add({ family: 'false_intent', sub: 'refund_fee_permit2', chainId: c, victim: v, origin: 'https://refund-center-avax.example', claimed: 'Centre de remboursement',
    intent: { kind: 'pay_someone', freeText: 'Payer 5 USDC de frais de dossier', token: 'USDC', amount: '5', pastedMessage: 'Pour recevoir votre remboursement de 400 USDC, reglez les frais de 5 USDC en cochant Payer.' }, facts: facts(a, false, 2),
    request: { method: 'eth_signTypedData_v4', params: [v, p2single({ chainId: c, details: { token: TOK[c].USDC, amount: U160, expiration: U48, nonce: 0 }, spender: a, sigDeadline: NOW + 3600 })] },
    reason: 'L escroc souffle Payer; la signature est un PermitSingle illimite', source: 'Arnaque remboursement / frais avances' }); }
{ const c = 43113, v = V(), a = addr(), tk = TOK[c];
  add({ family: 'false_intent', sub: 'swap_coached_full_balance_transfer', hard: true, chainId: c, victim: v, origin: 'https://wallet.example', claimed: null,
    intent: { kind: 'buy_or_swap', freeText: 'Echanger tout mon WAVAX contre du USDC (conseil d un ami sur Telegram)', token: 'WAVAX', pastedMessage: 'Fais un swap vers ce contrat de pont, adresse: ' + a }, facts: facts(a, false, 1), share: 100,
    request: ({ tx }) => tx(tk.WAVAX, enc('transfer', [a, 900n * 10n ** 18n])), reason: 'Echanger coche, mais la tx est un simple transfer ERC-20 sans entree; destinataire sorti d un message Telegram', source: 'Coaching Telegram "swap vers ce pont"' }); }
{ const c = 1, v = V(), a = addr();
  add({ family: 'false_intent', sub: 'fake_invoice_amount_inflated', hard: true, chainId: c, victim: v, origin: 'https://wallet.example', claimed: null,
    intent: { kind: 'pay_someone', freeText: 'Payer la facture de 250 USDC', token: 'USDC', amount: '250', counterpartyLabel: 'Fournisseur (facture recue)', counterpartyAddress: a, pastedMessage: 'Facture #2291, 250 USDC, adresse de paiement: ' + a }, facts: facts(a, false, 3), share: 85,
    request: ({ tx }) => tx(TOK[c].USDC, enc('transfer', [a, 25000000000n])), reason: 'Adresse issue de la fausse facture (donc concordante avec l intention) mais montant 100x superieur au dit et contrepartie inconnue', source: 'Fraude a la facture crypto (BEC)' }); }

// ---------- write ----------
const here = path.dirname(fileURLToPath(import.meta.url));
fs.writeFileSync(path.join(here, 'malveillants.jsonl'), out.map((o) => JSON.stringify(o)).join('\n') + '\n');
console.log('written', out.length);

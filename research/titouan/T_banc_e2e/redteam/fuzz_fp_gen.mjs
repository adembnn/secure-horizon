// fuzz_fp_gen.mjs - red team `fuzz_fp` : generator of HONEST (benign) wallet requests to hunt false alerts.
// SYNTHETIC ONLY: victims and contacts are random addresses from a seeded PRNG; protocol/token addresses are public contracts.
// Usage: node redteam/fuzz_fp_gen.mjs <out.jsonl> [seed] [opsPerFamily]
import { writeFileSync } from 'node:fs';
const { ethers } = await import('file:///C:/Users/Adem/Secure%20Horizon/blockchain/node_modules/ethers/lib.esm/index.js');
const { Interface, getAddress, parseUnits, formatUnits, zeroPadValue, AbiCoder, solidityPacked, hexlify, MaxUint256 } = ethers;
const coder = AbiCoder.defaultAbiCoder();

const OUT = process.argv[2] || 'fuzz_fp.jsonl';
let seed = Number(process.argv[3] || 7);
const PER = Number(process.argv[4] || 40);
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const chance = (p) => rnd() < p;
const raddr = () => getAddress('0x' + Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(rnd() * 16)]).join(''));
const NOW_MS = 1791709200000; const NOW = NOW_MS / 1000; const DL = NOW + 1200;
const MAX160 = (1n << 160n) - 1n; const MAX48 = (1n << 48n) - 1n;

// ---------- chains ----------
const AVAX = {
  id: 43114, hex: '0xa86a', native: 'AVAX',
  tok: { WAVAX: ['0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', 18], USDC: ['0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 6], USDt: ['0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', 6], 'USDC.e': ['0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664', 6], 'WETH.e': ['0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB', 18], 'BTC.b': ['0x152b9d0FdC40C096757F570A51E494bd4b943E50', 8], JOE: ['0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd', 18], sAVAX: ['0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE', 18], QI: ['0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5', 18], GMX: ['0x62edc0692BD897D2295872a9FFCac5425011c661', 18] },
  wrapped: 'WAVAX', stables: ['USDC', 'USDt', 'USDC.e'],
  p: { joeV1: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4', lb21: '0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30', lb22: '0x18556DA13313f3532c54711497A8FedAC273220E', pangolin: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106', ur: '0x4Dae2f939ACf50408e13d58534Ff8c2776d45265', sr02: '0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE', aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', aaveGateway: '0xa938d8536aEed1Bd48f548380394Ab30Aa11B00E', qiAVAX: '0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c', qiUSDCn: '0xB715808a78F6041E46d61Cb123C9B4A27056AE9C', comptroller: '0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4', cctp: '0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982', stargate: '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd', odos: '0x88de50B233052e4Fb783d4F6db78Cc34fEa3e9FC', permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3', oneinch5: '0x1111111254EEB25477B68fb85Ed929f73A960582', oneinch6: '0x111111125421cA6dc452d289314280a0f8842A65', para5: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57', para62: '0x6A000F20005980200259B80c5102003040001068', seaport: '0x0000000000000068F116a894984e2DB1123eB395', osConduit: '0x1E0049783F008A0085193E00003D00cd54003c71', joepegs: '0xC44Fac66eB9541c46FF02F90220A3724C03212BE', disperse: '0xD152f549545093347A162Dce210e7293f1452150', sjoe: '0x1a731B2299E22FbAC282E7094EdA41046343Cb51' },
  origins: { joeV1: 'https://lfj.gg', lb21: 'https://lfj.gg', lb22: 'https://lfj.gg', pangolin: 'https://app.pangolin.exchange', ur: 'https://app.uniswap.org', sr02: 'https://app.uniswap.org', oneinch5: 'https://app.1inch.io', oneinch6: 'https://app.1inch.io', para5: 'https://app.paraswap.xyz', para62: 'https://app.velora.xyz', odos: 'https://app.odos.xyz' },
};
const FUJI = {
  id: 43113, hex: '0xa869', native: 'AVAX',
  tok: { WAVAX: ['0xd00ae08403B9bbb9124bB305C09058E32C39A48c', 18], USDC: ['0x5425890298aed601595a70AB815c96711a31Bc65', 6], WETH: ['0x70CFD88633850EcaDeDF1765B950E43b4ff7cbb2', 18] },
  wrapped: 'WAVAX', stables: ['USDC'],
  p: { joeV1: '0xB819b2621C75987078B06c36B2eb8983c13dcC92', lb21: '0xc41eb6ea7f6f576902BAd417aa296862C70339C5', pangolin: '0xDc1B6E5D5CfbA7166719f30eF4a9F1B855b016E1', aavePool: '0x2b2b0151eeFCb4242c9647642B82663190f463da', cctp: '0xeb08f243E5d3FCFF26A9E38Ae5520A669f4019d0', permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3', oneinch6: '0x111111125421cA6dc452d289314280a0f8842A65', disperse: '0xD152f549545093347A162Dce210e7293f1452150', joepegs: '0xC44Fac66eB9541c46FF02F90220A3724C03212BE' },
  origins: { joeV1: 'https://lfj.gg', lb21: 'https://lfj.gg', pangolin: 'https://app.pangolin.exchange', oneinch6: 'https://app.1inch.io' },
};
const ETH = {
  id: 1, hex: '0x1', native: 'ETH',
  tok: { WETH: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18], USDC: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6], USDT: ['0xdAC17F958D2ee523a2206206994597C13D831ec7', 6], DAI: ['0x6B175474E89094C44Da98b954EedeAC495271d0F', 18], UNI: ['0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18], AAVE: ['0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', 18], stETH: ['0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', 18], wstETH: ['0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', 18], LINK: ['0x514910771AF9Ca656af840dff83E8264EcF986CA', 18], PEPE: ['0x6982508145454Ce325dDbE47a25d4ec3d2311933', 18] },
  wrapped: 'WETH', stables: ['USDC', 'USDT', 'DAI'],
  p: { univ2: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', sr02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', ur: '0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af', urOld: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3', oneinch5: '0x1111111254EEB25477B68fb85Ed929f73A960582', oneinch6: '0x111111125421cA6dc452d289314280a0f8842A65', para5: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57', para62: '0x6A000F20005980200259B80c5102003040001068', zeroex: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF', cowSettle: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41', cowRelayer: '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110', curve3pool: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7', balancer: '0xBA12222222228d8Ba445958a75a0704d566BF2C8', aavePool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', aaveGateway: '0xD322A49006FC828F9B5B37Ab215F99B4E5caB19C', comet: '0xc3d688B66703497DAA19211EEdff47f25384cdc3', lidoWQ: '0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1', rocketDeposit: '0xDD3f50F8A6CafbE9b31a427582963f465E745AF8', cctp: '0xBd3fa81B58Ba92a82136038B25aDec7066af3155', stargate: '0x8731d54E9D02c286767d56ac03e8037C07e01e98', avaxBridge: '0x8EB8a3b98659Cce290402893d0123abb75E3ab28', across: '0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5', opBridge: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1', arbInbox: '0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f', seaport: '0x0000000000000068F116a894984e2DB1123eB395', osConduit: '0x1E0049783F008A0085193E00003D00cd54003c71', blur: '0x00000000000111AbE46ff893f3B2fdF1F759a8A8', npm: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', ensCtrl: '0x253553366Da8546fC250F225fe3d25d0C782303b', govBravo: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3', disperse: '0xD152f549545093347A162Dce210e7293f1452150' },
  origins: { univ2: 'https://app.uniswap.org', sr02: 'https://app.uniswap.org', ur: 'https://app.uniswap.org', urOld: 'https://app.uniswap.org', oneinch5: 'https://app.1inch.io', oneinch6: 'https://app.1inch.io', para5: 'https://app.paraswap.xyz', para62: 'https://app.velora.xyz', zeroex: 'https://matcha.xyz', cowSettle: 'https://swap.cow.fi', curve3pool: 'https://curve.fi', balancer: 'https://app.balancer.fi' },
};
for (const C of [AVAX, FUJI, ETH]) {
  for (const k in C.p) C.p[k] = getAddress(C.p[k].toLowerCase()); for (const k in C.tok) C.tok[k][0] = getAddress(C.tok[k][0].toLowerCase());
  C.LABEL = { joeV1: 'Trader Joe JoeRouter02', lb21: 'LFJ LBRouter v2.1', lb22: 'LFJ LBRouter v2.2', pangolin: 'Pangolin Router', ur: 'Uniswap Universal Router', urOld: 'Uniswap Universal Router (old)', sr02: 'Uniswap SwapRouter02', univ2: 'Uniswap V2 Router02', aavePool: 'Aave v3 Pool', aaveGateway: 'Aave WrappedTokenGateway', qiAVAX: 'Benqi qiAVAX', qiUSDCn: 'Benqi qiUSDC', comptroller: 'Benqi Comptroller', cctp: 'Circle CCTP TokenMessenger', stargate: 'Stargate pool', odos: 'Odos Router V2', permit2: 'Uniswap Permit2', oneinch5: '1inch AggregationRouterV5', oneinch6: '1inch AggregationRouterV6', para5: 'ParaSwap Augustus V5', para62: 'Velora Augustus v6.2', seaport: 'Seaport 1.6', osConduit: 'OpenSea conduit', joepegs: 'Joepegs transfer manager', disperse: 'Disperse.app', sjoe: 'LFJ sJOE staking', zeroex: '0x Exchange Proxy', cowSettle: 'CoW GPv2Settlement', cowRelayer: 'CoW GPv2VaultRelayer', curve3pool: 'Curve 3pool', balancer: 'Balancer V2 Vault', comet: 'Compound v3 cUSDCv3', lidoWQ: 'Lido WithdrawalQueue', rocketDeposit: 'Rocket Pool deposit pool', avaxBridge: 'Avalanche Bridge (EOA)', across: 'Across SpokePool', opBridge: 'Optimism L1StandardBridge', arbInbox: 'Arbitrum Delayed Inbox', blur: 'Blur operator', npm: 'Uniswap V3 Positions NFT', ensCtrl: 'ENS ETHRegistrarController', govBravo: 'Uniswap GovernorBravo' };
}

// ---------- ABIs ----------
const I = new Interface([
  'function approve(address,uint256)', 'function transfer(address,uint256)', 'function increaseAllowance(address,uint256)', 'function decreaseAllowance(address,uint256)',
  'function deposit()', 'function deposit(uint256)', 'function supply(address,uint256)', 'function withdraw(uint256)', 'function setApprovalForAll(address,bool)', 'function safeTransferFrom(address,address,uint256)',
  'function swapExactAVAXForTokens(uint256,address[],address,uint256)', 'function swapExactTokensForAVAX(uint256,uint256,address[],address,uint256)', 'function swapAVAXForExactTokens(uint256,address[],address,uint256)',
  'function swapExactETHForTokens(uint256,address[],address,uint256)', 'function swapExactTokensForETH(uint256,uint256,address[],address,uint256)', 'function swapETHForExactTokens(uint256,address[],address,uint256)',
  'function swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', 'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256,uint256,address[],address,uint256)', 'function swapTokensForExactTokens(uint256,uint256,address[],address,uint256)',
  'function addLiquidityAVAX(address,uint256,uint256,uint256,address,uint256)', 'function removeLiquidityAVAX(address,uint256,uint256,uint256,address,uint256)', 'function addLiquidityETH(address,uint256,uint256,uint256,address,uint256)', 'function removeLiquidityETH(address,uint256,uint256,uint256,address,uint256)', 'function addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)',
  'function swapExactNATIVEForTokens(uint256,(uint256[],uint8[],address[]),address,uint256)', 'function swapExactTokensForNATIVE(uint256,uint256,(uint256[],uint8[],address[]),address,uint256)',
  'function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))', 'function multicall(uint256,bytes[])', 'function multicall(bytes[])', 'function unwrapWETH9(uint256,address)', 'function refundETH()',
  'function execute(bytes,bytes[],uint256)',
  'function swap(address,(address,address,address,address,uint256,uint256,uint256),bytes)', 'function unoswap(uint256,uint256,uint256,uint256)', 'function ethUnoswap(uint256,uint256)',
  'function uniswapV3Swap(uint256,uint256,uint256[])',
  'function swapExactAmountIn(address,(address,address,uint256,uint256,uint256,bytes32,address),uint256,bytes,bytes)',
  'function simpleSwap((address,address,uint256,uint256,uint256,address[],bytes,uint256[],uint256[],address,address,uint256,bytes,uint256,bytes16))',
  'function swapCompact()',
  'function transformERC20(address,address,uint256,uint256,(uint32,bytes)[])',
  'function exchange(int128,int128,uint256,uint256)',
  'function supply(address,uint256,address,uint16)', 'function withdraw(address,uint256,address)', 'function borrow(address,uint256,uint256,uint16,address)', 'function repay(address,uint256,uint256,address)', 'function setUserUseReserveAsCollateral(address,bool)',
  'function depositETH(address,address,uint16)', 'function withdrawETH(address,uint256,address)',
  'function mint()', 'function mint(uint256)', 'function redeem(uint256)', 'function redeemUnderlying(uint256)', 'function enterMarkets(address[])',
  'function submit()', 'function submit(address)', 'function requestUnlock(uint256)', 'function redeem()', 'function requestWithdrawals(uint256[],address)', 'function wrap(uint256)', 'function unwrap(uint256)',
  'function depositForBurn(uint256,uint32,bytes32,address)', 'function send((uint32,bytes32,uint256,uint256,bytes,bytes,bytes),(uint256,uint256),address)',
  'function unwrap(uint256,uint256)', 'function depositV3(address,address,address,address,uint256,uint256,uint256,address,uint32,uint32,uint32,bytes)', 'function depositETH(uint32,bytes)', 'function depositEth()',
  'function lockdown((address,address)[])', 'function approve(address,address,uint160,uint48)',
  'function disperseToken(address,address[],uint256[])', 'function disperseEther(address[],uint256[])',
  'function castVote(uint256,uint8)', 'function castVoteWithReason(uint256,uint8,string)', 'function delegate(address)',
  'function commit(bytes32)', 'function renew(string,uint256)',
  'function mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))', 'function collect((uint256,address,uint128,uint128))',
  'function publicMint(uint256)', 'function claim(address,uint256)',
  'function fulfillBasicOrder((address,uint256,uint256,address,address,address,uint256,uint256,uint8,uint256,uint256,bytes32,uint256,bytes32,bytes32,uint256,(uint256,address)[],bytes))',
  'function swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)',
]);
const enc = (sig, args) => I.encodeFunctionData(sig, args);
const ZERO = '0x0000000000000000000000000000000000000000';
const amt = (C, sym, lo, hi) => { const d = C.tok[sym] ? C.tok[sym][1] : 18; const x = (lo + rnd() * (hi - lo)); const s = x.toFixed(Math.min(d, x < 1 ? 4 : 2)); return { h: s, raw: parseUnits(s, d) }; };
const T = (C, s) => getAddress(C.tok[s][0]);
const hexv = (b) => '0x' + BigInt(b).toString(16);

// ---------- context ----------
function baseCtx(C, victim, o = {}) {
  const known = Object.entries(C.p).filter(([k]) => !(o.dropKnown || []).includes(k)).map(([k, a]) => ({ name: C.LABEL[k] || k, address: getAddress(a) }));
  const facts = {};
  for (const k of o.facts || []) facts[getAddress(C.p[k])] = { label: C.LABEL[k] || k, isContract: k !== 'avaxBridge', ageBlocks: ri(2_000_000, 40_000_000), firstSeenByUser: !!o.firstSeen };
  Object.assign(facts, o.extraFacts || {});
  return {
    chainId: C.id, victim, origin: o.origin || 'https://app.example.test', origin_kind: 'official',
    address_book: o.book || [], known_protocols: known,
    token_registry: Object.entries(C.tok).map(([s, [a, d]]) => ({ address: getAddress(a), symbol: s, decimals: d })),
    history: o.history || [], counterparty_facts: facts, share_of_balance_pct: o.share ?? ri(2, 45),
    ...(o.extra || {}),
  };
}

// ---------- intent variants ----------
const SYN = { AVAX: ['avax', 'WAVAX', 'Avalanche'], WAVAX: ['AVAX', 'avax'], ETH: ['eth', 'WETH', 'ether'], WETH: ['ETH'], USDC: ['usdc', 'USDC.e', 'dollars', 'USD'], 'USDC.e': ['USDC'], USDt: ['USDT', 'tether'], USDT: ['usdt', 'tether'], DAI: ['dai'], stETH: ['ETH', 'steth'], sAVAX: ['AVAX'], 'BTC.b': ['BTC', 'bitcoin'], 'WETH.e': ['ETH', 'WETH'] };
function variants(op) {
  const h = op.intent; const out = [];
  out.push(['honest', { ...h }]);
  out.push(['honest_text', { kind: h.kind, freeText: h.freeText }]);
  if (h.token && SYN[h.token]) out.push(['clumsy_token', { ...h, token: pick(SYN[h.token]) }]);
  if (op.otherToken) out.push(['clumsy_token_bought', { ...h, token: op.otherToken, amount: op.otherAmount || h.amount }]);
  if (h.amount) {
    const n = Number(h.amount);
    out.push(['clumsy_amount_round', { ...h, amount: String(n >= 10 ? Math.floor(n) : Math.floor(n * 10) / 10 || 0.1) }]);
    out.push(['clumsy_amount_fiat', { ...h, amount: `${Math.round(n * 30)} €`, freeText: (h.freeText || '') + ' (environ ' + Math.round(n * 30) + ' euros)' }]);
  }
  if (h.counterpartyAddress) out.push(['clumsy_label_only', { ...h, counterpartyAddress: undefined }]);
  out.push(['vague', { kind: h.kind, freeText: pick(op.vague || ['je fais ce que le site me demande', 'ok go', 'confirmer', 'je continue sur le site', 'truc habituel']) }]);
  out.push(['absent', {}]);
  for (const k of op.wrong || []) out.push(['wrong_button:' + k, { kind: k, freeText: h.freeText }]);
  if (op.askedFriend) out.push(['asked_by_friend_honest', { kind: 'asked_by_someone', askedBy: 'friend', freeText: h.freeText, token: h.token, amount: h.amount, pastedMessage: pick(['tu peux me rembourser le resto ? merci !', 'hello, pour la coloc ce mois-ci', 'je t avance les places de concert, tu me renvoies ta part']) }]);
  return out.map(([v, it]) => [v, { ...it, declaredAt: NOW_MS }]);
}

// ---------- operation factories ----------
const OPS = [];
const op = (fam, sub, fn) => OPS.push({ fam, sub, fn });
const chains = { avax: AVAX, fuji: FUJI, eth: ETH };
const pc = (...ks) => chains[pick(ks)];
const tx = (C, from, to, data, value = 0n) => ({ method: 'eth_sendTransaction', params: [{ from, to: getAddress(to), data, value: hexv(value), chainId: C.hex }] });
const swapWrong = ['connect_or_accept_offer', 'pay_someone', 'send_to_my_account'];
const tokenPick = (C, excl = []) => pick(Object.keys(C.tok).filter((s) => !excl.includes(s) && s !== C.wrapped));
const minOut = (C, inSym, inH, outSym) => { const pi = priceOf(inSym), po = priceOf(outSym); const d = C.tok[outSym] ? C.tok[outSym][1] : 18; const x = Number(inH) * pi / po * 0.99; return parseUnits(x.toFixed(Math.min(d, 6)), d); };
const priceOf = (s) => ({ JOE: 0.4, QI: 0.01, GMX: 25, UNI: 8, AAVE: 150, LINK: 15, PEPE: 0.00001, USDC: 1, 'USDC.e': 1, USDt: 1, USDT: 1, DAI: 1, WAVAX: 25, AVAX: 25, ETH: 3000, WETH: 3000, 'WETH.e': 3000, 'BTC.b': 60000, stETH: 3000, wstETH: 3500, sAVAX: 30 }[s] || 1);

// --- swaps: V2-style routers
op('swap', 'v2_native_to_token', () => {
  const C = pc('avax', 'avax', 'fuji', 'eth'); const v = raddr(); const rk = C === ETH ? 'univ2' : pick(['joeV1', 'pangolin']);
  const out = tokenPick(C); const a = amt(C, C.wrapped, 0.05, 40); const mo = minOut(C, C.wrapped, a.h, out);
  const sig = C === ETH ? 'swapExactETHForTokens' : 'swapExactAVAXForTokens';
  return { C, v, rk, req: tx(C, v, C.p[rk], enc(sig, [mo, [T(C, C.wrapped), T(C, out)], v, DL]), a.raw), intent: { kind: 'buy_or_swap', freeText: `Échanger ${a.h} ${C.native} contre du ${out}`, token: C.native, amount: a.h }, otherToken: out, wrong: swapWrong };
});
op('swap', 'v2_exact_out_refund', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const rk = C === ETH ? 'univ2' : 'joeV1';
  const out = pick(C.stables); const want = ri(50, 2000); const val = parseUnits((want / priceOf(C.native) * 1.01).toFixed(6), 18);
  const sig = C === ETH ? 'swapETHForExactTokens' : 'swapAVAXForExactTokens';
  return { C, v, rk, req: tx(C, v, C.p[rk], enc(sig, [parseUnits(String(want), C.tok[out][1]), [T(C, C.wrapped), T(C, out)], v, DL]), val), intent: { kind: 'buy_or_swap', freeText: `Acheter exactement ${want} ${out}`, token: out, amount: String(want) }, otherToken: C.native, otherAmount: formatUnits(val, 18), wrong: swapWrong };
});
op('swap', 'v2_token_to_native', () => {
  const C = pc('avax', 'fuji', 'eth'); const v = raddr(); const rk = C === ETH ? 'univ2' : pick(['joeV1', 'pangolin']);
  const inn = tokenPick(C); const a = amt(C, inn, 5, 3000);
  const sig = C === ETH ? 'swapExactTokensForETH' : 'swapExactTokensForAVAX';
  return { C, v, rk, req: tx(C, v, C.p[rk], enc(sig, [a.raw, minOut(C, inn, a.h, C.wrapped), [T(C, inn), T(C, C.wrapped)], v, DL])), intent: { kind: 'buy_or_swap', freeText: `Vendre ${a.h} ${inn} pour du ${C.native}`, token: inn, amount: a.h }, otherToken: C.native, wrong: swapWrong };
});
op('swap', 'v2_token_to_token', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const rk = C === ETH ? 'univ2' : pick(['joeV1', 'pangolin']);
  const inn = tokenPick(C); const out = tokenPick(C, [inn]); const a = amt(C, inn, 5, 3000);
  const sig = chance(0.3) ? 'swapExactTokensForTokensSupportingFeeOnTransferTokens' : 'swapExactTokensForTokens';
  return { C, v, rk, req: tx(C, v, C.p[rk], enc(sig, [a.raw, minOut(C, inn, a.h, out), [T(C, inn), T(C, C.wrapped), T(C, out)], v, DL])), intent: { kind: 'buy_or_swap', freeText: `Swap ${a.h} ${inn} -> ${out}`, token: inn, amount: a.h }, otherToken: out, wrong: swapWrong };
});
// --- LFJ Liquidity Book
op('swap', 'lb_native_to_token', () => {
  const C = pc('avax', 'fuji'); const v = raddr(); const rk = C === AVAX ? pick(['lb21', 'lb22']) : 'lb21';
  const out = tokenPick(C); const a = amt(C, 'WAVAX', 0.1, 60);
  return { C, v, rk, req: tx(C, v, C.p[rk], enc('swapExactNATIVEForTokens', [minOut(C, 'WAVAX', a.h, out), [[pick([10n, 20n, 25n])], [pick([2, 3])], [T(C, 'WAVAX'), T(C, out)]], v, DL]), a.raw), intent: { kind: 'buy_or_swap', freeText: `Acheter du ${out} avec ${a.h} AVAX sur LFJ`, token: 'AVAX', amount: a.h }, otherToken: out, wrong: swapWrong };
});
op('swap', 'lb_token_to_native', () => {
  const C = pc('avax', 'fuji'); const v = raddr(); const rk = C === AVAX ? pick(['lb21', 'lb22']) : 'lb21';
  const inn = tokenPick(C); const a = amt(C, inn, 3, 2500);
  return { C, v, rk, req: tx(C, v, C.p[rk], enc('swapExactTokensForNATIVE', [a.raw, minOut(C, inn, a.h, 'WAVAX'), [[20n], [2], [T(C, inn), T(C, 'WAVAX')]], v, DL])), intent: { kind: 'buy_or_swap', freeText: `Revendre ${a.h} ${inn} en AVAX`, token: inn, amount: a.h }, otherToken: 'AVAX', wrong: swapWrong };
});
// --- Uniswap SwapRouter02
op('swap', 'sr02_multicall_unwrap', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const inn = pick(C.stables); const a = amt(C, inn, 20, 5000);
  const s = enc('exactInputSingle', [[T(C, inn), T(C, C.wrapped), 500, '0x0000000000000000000000000000000000000002', a.raw, minOut(C, inn, a.h, C.wrapped), 0n]]);
  const u = enc('unwrapWETH9', [1n, v]);
  return { C, v, rk: 'sr02', req: tx(C, v, C.p.sr02, enc('multicall(uint256,bytes[])', [DL, [s, u]])), intent: { kind: 'buy_or_swap', freeText: `Swap ${a.h} ${inn} en ${C.native} sur Uniswap`, token: inn, amount: a.h }, otherToken: C.native, wrong: swapWrong };
});
op('swap', 'sr02_exact_input_single', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const inn = tokenPick(C); const out = tokenPick(C, [inn]); const a = amt(C, inn, 5, 3000);
  const rec = pick([v, v, '0x0000000000000000000000000000000000000001']);
  const s = enc('exactInputSingle', [[T(C, inn), T(C, out), pick([100, 500, 3000]), rec, a.raw, minOut(C, inn, a.h, out), 0n]]);
  const data = chance(0.5) ? s : enc('multicall(uint256,bytes[])', [DL, [s]]);
  return { C, v, rk: 'sr02', tag: rec === v ? 'rcpt_self' : 'rcpt_MSG_SENDER', req: tx(C, v, C.p.sr02, data), intent: { kind: 'buy_or_swap', freeText: `Échanger ${a.h} ${inn} contre ${out}`, token: inn, amount: a.h }, otherToken: out, wrong: swapWrong };
});
op('swap', 'sr02_native_refund', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const out = pick(C.stables); const a = amt(C, C.wrapped, 0.05, 20);
  const s = enc('exactInputSingle', [[T(C, C.wrapped), T(C, out), 500, v, a.raw, minOut(C, C.wrapped, a.h, out), 0n]]);
  return { C, v, rk: 'sr02', req: tx(C, v, C.p.sr02, enc('multicall(uint256,bytes[])', [DL, [s, enc('refundETH', [])]]), a.raw), intent: { kind: 'buy_or_swap', freeText: `${a.h} ${C.native} -> ${out}`, token: C.native, amount: a.h }, otherToken: out, wrong: swapWrong };
});
// --- Universal Router
const v3path = (a, fee, b) => solidityPacked(['address', 'uint24', 'address'], [a, fee, b]);
op('swap', 'ur_eth_to_token', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const rk = C === ETH ? pick(['ur', 'urOld']) : 'ur'; const out = tokenPick(C); const a = amt(C, C.wrapped, 0.02, 15);
  const wrap = coder.encode(['address', 'uint256'], ['0x0000000000000000000000000000000000000002', a.raw]);
  const sw = coder.encode(['address', 'uint256', 'uint256', 'bytes', 'bool'], ['0x0000000000000000000000000000000000000001', a.raw, minOut(C, C.wrapped, a.h, out), v3path(T(C, C.wrapped), 3000, T(C, out)), false]);
  return { C, v, rk, req: tx(C, v, C.p[rk], enc('execute', ['0x0b00', [wrap, sw], DL]), a.raw), intent: { kind: 'buy_or_swap', freeText: `Acheter du ${out} pour ${a.h} ${C.native}`, token: C.native, amount: a.h }, otherToken: out, wrong: swapWrong };
});
op('swap', 'ur_token_to_eth_fee', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const rk = 'ur'; const inn = pick(C.stables); const a = amt(C, inn, 20, 8000);
  const withFee = chance(0.5);
  const sw = coder.encode(['address', 'uint256', 'uint256', 'bytes', 'bool'], ['0x0000000000000000000000000000000000000002', a.raw, minOut(C, inn, a.h, C.wrapped), v3path(T(C, inn), 500, T(C, C.wrapped)), true]);
  const cmds = withFee ? '0x00060c' : '0x000c';
  const inputs = withFee ? [sw, coder.encode(['address', 'address', 'uint256'], [ZERO, getAddress('0x000000fee13a103a10d593b9ae06b3e05f2e7e1c'), 25n]), coder.encode(['address', 'uint256'], ['0x0000000000000000000000000000000000000001', 1n])] : [sw, coder.encode(['address', 'uint256'], ['0x0000000000000000000000000000000000000001', 1n])];
  return { C, v, rk, tag: withFee ? 'interface_fee' : 'nofee', req: tx(C, v, C.p[rk], enc('execute', [cmds, inputs, DL])), intent: { kind: 'buy_or_swap', freeText: `Vendre ${a.h} ${inn} contre ${C.native}`, token: inn, amount: a.h }, otherToken: C.native, wrong: swapWrong };
});
op('swap', 'ur_permit2_permit_and_swap', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const inn = tokenPick(C); const out = tokenPick(C, [inn]); const a = amt(C, inn, 5, 3000);
  const permit = coder.encode(['((address,uint160,uint48,uint48),address,uint256)', 'bytes'], [[[T(C, inn), MAX160, NOW + 30 * 86400, 0], C.p.ur, NOW + 1800], '0x' + '11'.repeat(65)]);
  const sw = coder.encode(['address', 'uint256', 'uint256', 'bytes', 'bool'], ['0x0000000000000000000000000000000000000001', a.raw, minOut(C, inn, a.h, out), v3path(T(C, inn), 3000, T(C, out)), true]);
  return { C, v, rk: 'ur', req: tx(C, v, C.p.ur, enc('execute', ['0x0a00', [permit, sw], DL])), intent: { kind: 'buy_or_swap', freeText: `Swap ${a.h} ${inn} vers ${out}`, token: inn, amount: a.h }, otherToken: out, wrong: swapWrong };
});
// --- 1inch
op('swap', '1inch_v6_swap', () => {
  const C = pc('avax', 'eth', 'fuji'); const v = raddr(); const inn = tokenPick(C); const out = tokenPick(C, [inn]); const a = amt(C, inn, 5, 5000); const ex = raddr();
  const rcv = pick([v, v, ZERO]);
  return { C, v, rk: 'oneinch6', tag: rcv === ZERO ? 'dstReceiver_zero' : 'dstReceiver_self', req: tx(C, v, C.p.oneinch6, enc('swap(address,(address,address,address,address,uint256,uint256,uint256),bytes)', [ex, [T(C, inn), T(C, out), ex, rcv, a.raw, minOut(C, inn, a.h, out), 4n], '0x' + 'ab'.repeat(ri(40, 400))])), intent: { kind: 'buy_or_swap', freeText: `Swap ${a.h} ${inn} vers ${out} sur 1inch`, token: inn, amount: a.h }, otherToken: out, wrong: swapWrong };
});
op('swap', '1inch_v6_unoswap', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const inn = tokenPick(C); const a = amt(C, inn, 5, 5000);
  return { C, v, rk: 'oneinch6', req: tx(C, v, C.p.oneinch6, enc('unoswap', [BigInt(T(C, inn)), a.raw, minOut(C, inn, a.h, C.wrapped), BigInt(raddr()) | (1n << 253n)])), intent: { kind: 'buy_or_swap', freeText: `Vendre ${a.h} ${inn} via 1inch`, token: inn, amount: a.h }, wrong: swapWrong };
});
op('swap', '1inch_v6_ethunoswap', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const a = amt(C, C.wrapped, 0.05, 10);
  return { C, v, rk: 'oneinch6', req: tx(C, v, C.p.oneinch6, enc('ethUnoswap', [1n, BigInt(raddr())]), a.raw), intent: { kind: 'buy_or_swap', freeText: `Échanger ${a.h} ${C.native} sur 1inch`, token: C.native, amount: a.h }, wrong: swapWrong };
});
op('swap', '1inch_v5_uniswapV3Swap', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const inn = tokenPick(C); const a = amt(C, inn, 5, 5000);
  return { C, v, rk: 'oneinch5', req: tx(C, v, C.p.oneinch5, enc('uniswapV3Swap', [a.raw, minOut(C, inn, a.h, C.wrapped), [BigInt(raddr())]])), intent: { kind: 'buy_or_swap', freeText: `Swap ${a.h} ${inn} (1inch)`, token: inn, amount: a.h }, wrong: swapWrong };
});
// --- ParaSwap / Velora
op('swap', 'paraswap_v62_swapExactAmountIn', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const inn = tokenPick(C); const out = tokenPick(C, [inn]); const a = amt(C, inn, 5, 4000); const ben = pick([v, ZERO]);
  return { C, v, rk: 'para62', tag: ben === ZERO ? 'beneficiary_zero' : 'beneficiary_self', req: tx(C, v, C.p.para62, enc('swapExactAmountIn', [raddr(), [T(C, inn), T(C, out), a.raw, minOut(C, inn, a.h, out), minOut(C, inn, a.h, out) * 101n / 100n, '0x' + '00'.repeat(32), ben], 0n, '0x', '0x' + 'cd'.repeat(ri(64, 300))])), intent: { kind: 'buy_or_swap', freeText: `Swap ${a.h} ${inn} -> ${out} sur Velora`, token: inn, amount: a.h }, otherToken: out, wrong: swapWrong };
});
op('swap', 'paraswap_v5_simpleSwap', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const inn = tokenPick(C); const out = tokenPick(C, [inn]); const a = amt(C, inn, 5, 4000); const ben = pick([v, ZERO]);
  return { C, v, rk: 'para5', tag: ben === ZERO ? 'beneficiary_zero' : 'beneficiary_self', req: tx(C, v, C.p.para5, enc('simpleSwap', [[T(C, inn), T(C, out), a.raw, minOut(C, inn, a.h, out), minOut(C, inn, a.h, out) * 101n / 100n, [raddr()], '0x1234', [0n, 4n], [0n], ben, ZERO, 0n, '0x', DL, '0x' + '00'.repeat(16)]])), intent: { kind: 'buy_or_swap', freeText: `ParaSwap ${a.h} ${inn} -> ${out}`, token: inn, amount: a.h }, otherToken: out, wrong: swapWrong };
});
// --- Odos
op('swap', 'odos_swapCompact', () => {
  const C = AVAX; const v = raddr(); const inn = tokenPick(C); const a = amt(C, inn, 5, 4000);
  const data = enc('swapCompact', []) + 'aa'.repeat(ri(40, 160));
  return { C, v, rk: 'odos', req: tx(C, v, C.p.odos, data), intent: { kind: 'buy_or_swap', freeText: `Swap ${a.h} ${inn} sur Odos`, token: inn, amount: a.h }, wrong: swapWrong };
});
// --- 0x, Curve, Balancer (Ethereum)
op('swap', 'zeroex_transformERC20', () => {
  const C = ETH; const v = raddr(); const inn = tokenPick(C); const out = tokenPick(C, [inn]); const a = amt(C, inn, 5, 4000);
  return { C, v, rk: 'zeroex', req: tx(C, v, C.p.zeroex, enc('transformERC20', [T(C, inn), T(C, out), a.raw, minOut(C, inn, a.h, out), [[ri(1, 20), '0x1234']]])), intent: { kind: 'buy_or_swap', freeText: `Swap ${a.h} ${inn} sur Matcha`, token: inn, amount: a.h }, otherToken: out, wrong: swapWrong };
});
op('swap', 'curve_3pool_exchange', () => {
  const C = ETH; const v = raddr(); const idx = ['DAI', 'USDC', 'USDT']; const i = ri(0, 2); let j = ri(0, 2); if (j === i) j = (i + 1) % 3; const a = amt(C, idx[i], 100, 20000);
  return { C, v, rk: 'curve3pool', req: tx(C, v, C.p.curve3pool, enc('exchange', [i, j, a.raw, minOut(C, idx[i], a.h, idx[j])])), intent: { kind: 'buy_or_swap', freeText: `Convertir ${a.h} ${idx[i]} en ${idx[j]} sur Curve`, token: idx[i], amount: a.h }, otherToken: idx[j], wrong: swapWrong };
});
op('swap', 'balancer_single_swap', () => {
  const C = ETH; const v = raddr(); const inn = tokenPick(C); const out = tokenPick(C, [inn]); const a = amt(C, inn, 5, 4000);
  return { C, v, rk: 'balancer', req: tx(C, v, C.p.balancer, enc('swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)', [['0x' + '5c'.repeat(32), 0, T(C, inn), T(C, out), a.raw, '0x'], [v, false, v, false], minOut(C, inn, a.h, out), DL])), intent: { kind: 'buy_or_swap', freeText: `Swap Balancer ${a.h} ${inn} -> ${out}`, token: inn, amount: a.h }, otherToken: out, wrong: swapWrong };
});
// --- CoW / 1inch limit order (signatures)
op('swap', 'cow_order_sign', () => {
  const C = ETH; const v = raddr(); const inn = tokenPick(C); const out = tokenPick(C, [inn]); const a = amt(C, inn, 5, 4000); const rcv = pick([ZERO, v]);
  const td = { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], Order: [['sellToken', 'address'], ['buyToken', 'address'], ['receiver', 'address'], ['sellAmount', 'uint256'], ['buyAmount', 'uint256'], ['validTo', 'uint32'], ['appData', 'bytes32'], ['feeAmount', 'uint256'], ['kind', 'string'], ['partiallyFillable', 'bool'], ['sellTokenBalance', 'string'], ['buyTokenBalance', 'string']].map(([name, type]) => ({ name, type })) }, primaryType: 'Order', domain: { name: 'Gnosis Protocol', version: 'v2', chainId: 1, verifyingContract: C.p.cowSettle }, message: { sellToken: T(C, inn), buyToken: T(C, out), receiver: rcv, sellAmount: a.raw.toString(), buyAmount: minOut(C, inn, a.h, out).toString(), validTo: NOW + 1800, appData: '0x' + '00'.repeat(32), feeAmount: '0', kind: 'sell', partiallyFillable: false, sellTokenBalance: 'erc20', buyTokenBalance: 'erc20' } };
  return { C, v, rk: 'cowSettle', tag: rcv === ZERO ? 'receiver_zero' : 'receiver_self', req: { method: 'eth_signTypedData_v4', params: [v, JSON.stringify(td)] }, intent: { kind: 'buy_or_swap', freeText: `Ordre CoW : vendre ${a.h} ${inn} contre ${out}`, token: inn, amount: a.h }, otherToken: out, wrong: swapWrong };
});
op('swap', '1inch_limit_order_sign', () => {
  const C = pc('eth', 'avax'); const v = raddr(); const inn = tokenPick(C); const out = tokenPick(C, [inn]); const a = amt(C, inn, 5, 4000);
  const td = { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], Order: ['salt:uint256', 'maker:address', 'receiver:address', 'makerAsset:address', 'takerAsset:address', 'makingAmount:uint256', 'takingAmount:uint256', 'makerTraits:uint256'].map((s) => ({ name: s.split(':')[0], type: s.split(':')[1] })) }, primaryType: 'Order', domain: { name: '1inch Aggregation Router', version: '6', chainId: C.id, verifyingContract: C.p.oneinch6 }, message: { salt: String(ri(1, 1e9)), maker: v, receiver: ZERO, makerAsset: T(C, inn), takerAsset: T(C, out), makingAmount: a.raw.toString(), takingAmount: minOut(C, inn, a.h, out).toString(), makerTraits: '0' } };
  return { C, v, rk: 'oneinch6', req: { method: 'eth_signTypedData_v4', params: [v, JSON.stringify(td)] }, intent: { kind: 'buy_or_swap', freeText: `Ordre limite 1inch ${a.h} ${inn} -> ${out}`, token: inn, amount: a.h }, otherToken: out, wrong: swapWrong };
});
// --- wrap/unwrap
op('swap', 'wrap_deposit', () => { const C = pc('avax', 'fuji', 'eth'); const v = raddr(); const a = amt(C, C.wrapped, 0.1, 50); const plain = chance(0.3); return { C, v, rk: null, req: tx(C, v, T(C, C.wrapped), plain ? '0x' : enc('deposit()', []), a.raw), tag: plain ? 'plain_value' : 'deposit()', intent: { kind: 'buy_or_swap', freeText: `Wrapper ${a.h} ${C.native} en ${C.wrapped}`, token: C.native, amount: a.h }, otherToken: C.wrapped, wrong: ['send_to_my_account', 'connect_or_accept_offer'] }; });
op('swap', 'unwrap_withdraw', () => { const C = pc('avax', 'fuji', 'eth'); const v = raddr(); const a = amt(C, C.wrapped, 0.1, 50); return { C, v, rk: null, req: tx(C, v, T(C, C.wrapped), enc('withdraw(uint256)', [a.raw])), intent: { kind: 'buy_or_swap', freeText: `Unwrap ${a.h} ${C.wrapped}`, token: C.wrapped, amount: a.h }, otherToken: C.native, wrong: ['send_to_my_account'] }; });
// --- batched approve+swap (EIP-5792)
op('swap', 'sendcalls_approve_swap', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const rk = C === ETH ? 'univ2' : pick(['joeV1', 'pangolin']); const inn = tokenPick(C); const a = amt(C, inn, 5, 3000); const exact = chance(0.5);
  const sig = C === ETH ? 'swapExactTokensForETH' : 'swapExactTokensForAVAX';
  return { C, v, rk, tag: exact ? 'approve_exact' : 'approve_unlimited', req: { method: 'wallet_sendCalls', params: [{ version: '2.0.0', chainId: C.hex, from: v, atomicRequired: true, calls: [{ to: T(C, inn), data: enc('approve(address,uint256)', [C.p[rk], exact ? a.raw : MaxUint256]), value: '0x0' }, { to: getAddress(C.p[rk]), data: enc(sig, [a.raw, minOut(C, inn, a.h, C.wrapped), [T(C, inn), T(C, C.wrapped)], v, DL]), value: '0x0' }] }] }, intent: { kind: 'buy_or_swap', freeText: `Swap ${a.h} ${inn} en ${C.native}`, token: inn, amount: a.h }, otherToken: C.native, wrong: swapWrong };
});

// --- approvals
const apprTargets = { avax: ['joeV1', 'lb21', 'lb22', 'pangolin', 'oneinch5', 'oneinch6', 'para5', 'para62', 'odos', 'permit2', 'aavePool', 'cctp', 'stargate', 'sjoe'], eth: ['univ2', 'sr02', 'oneinch6', 'para62', 'zeroex', 'permit2', 'cowRelayer', 'curve3pool', 'balancer', 'aavePool', 'comet', 'lidoWQ', 'cctp', 'across', 'stargate'], fuji: ['joeV1', 'lb21', 'permit2', 'aavePool', 'cctp'] };
op('approve', 'approve_unlimited_known', () => {
  const ck = pick(['avax', 'avax', 'eth', 'fuji']); const C = chains[ck]; const v = raddr(); const rk = pick(apprTargets[ck]); const s = tokenPick(C);
  return { C, v, rk, tag: rk, req: tx(C, v, T(C, s), enc('approve(address,uint256)', [C.p[rk], MaxUint256])), intent: { kind: 'buy_or_swap', freeText: `Autoriser ${C.LABEL[rk]} à utiliser mon ${s} pour swapper`, token: s }, wrong: ['connect_or_accept_offer', 'pay_someone'], vague: ['le site demande une autorisation, ok', 'approve'] };
});
op('approve', 'approve_exact_known', () => {
  const ck = pick(['avax', 'eth', 'fuji']); const C = chains[ck]; const v = raddr(); const rk = pick(apprTargets[ck]); const s = tokenPick(C); const a = amt(C, s, 5, 5000);
  return { C, v, rk, tag: rk, req: tx(C, v, T(C, s), enc('approve(address,uint256)', [C.p[rk], a.raw])), intent: { kind: 'buy_or_swap', freeText: `Approuver ${a.h} ${s} pour le swap`, token: s, amount: a.h }, wrong: ['connect_or_accept_offer', 'pay_someone'] };
});
op('approve', 'increase_allowance_known', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const rk = pick(['permit2', 'aavePool', 'oneinch6']); const s = pick(['USDC', C.wrapped]); const a = amt(C, s, 5, 5000);
  return { C, v, rk, req: tx(C, v, T(C, s), enc('increaseAllowance', [C.p[rk], a.raw])), intent: { kind: 'buy_or_swap', freeText: `Augmenter l'autorisation ${s} pour ${C.LABEL[rk]}`, token: s, amount: a.h }, wrong: ['connect_or_accept_offer'] };
});
const permit2Single = (C, v, s, spender, amount, exp) => ({ types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] }, primaryType: 'PermitSingle', domain: { name: 'Permit2', chainId: C.id, verifyingContract: C.p.permit2 }, message: { details: { token: T(C, s), amount: amount.toString(), expiration: String(exp), nonce: String(ri(0, 5)) }, spender: getAddress(spender), sigDeadline: String(NOW + 1800) } });
op('approve', 'permit2_single_to_ur', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const s = tokenPick(C); const a = amt(C, s, 5, 4000); const unl = chance(0.6);
  return { C, v, rk: 'ur', tag: unl ? 'max160' : 'exact', req: { method: 'eth_signTypedData_v4', params: [v, JSON.stringify(permit2Single(C, v, s, C.p.ur, unl ? MAX160 : a.raw, NOW + 30 * 86400))] }, intent: { kind: 'buy_or_swap', freeText: `Swap ${a.h} ${s} sur Uniswap (signature Permit2)`, token: s, amount: a.h }, wrong: ['connect_or_accept_offer', 'pay_someone'] };
});
op('approve', 'permit2_batch_npm', () => {
  const C = ETH; const v = raddr(); const s1 = 'USDC'; const s2 = 'WETH';
  const td = { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], PermitBatch: [{ name: 'details', type: 'PermitDetails[]' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] }, primaryType: 'PermitBatch', domain: { name: 'Permit2', chainId: 1, verifyingContract: C.p.permit2 }, message: { details: [s1, s2].map((s) => ({ token: T(C, s), amount: MAX160.toString(), expiration: String(NOW + 30 * 86400), nonce: '0' })), spender: C.p.ur, sigDeadline: String(NOW + 1800) } };
  return { C, v, rk: 'ur', req: { method: 'eth_signTypedData_v4', params: [v, JSON.stringify(td)] }, intent: { kind: 'buy_or_swap', freeText: 'Ajouter de la liquidité USDC/ETH sur Uniswap', token: 'USDC' }, wrong: ['connect_or_accept_offer'] };
});
op('approve', 'eip2612_permit_router', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const rk = pick(['oneinch6', 'para62', 'aavePool']); const a = amt(C, 'USDC', 10, 5000); const unl = chance(0.5);
  const td = { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] }, primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: C.id, verifyingContract: T(C, 'USDC') }, message: { owner: v, spender: getAddress(C.p[rk]), value: (unl ? MaxUint256 : a.raw).toString(), nonce: '0', deadline: String(NOW + 1800) } };
  return { C, v, rk, tag: unl ? 'unlimited' : 'exact', req: { method: 'eth_signTypedData_v4', params: [v, JSON.stringify(td)] }, intent: { kind: 'buy_or_swap', freeText: `Swap ${a.h} USDC sans frais d'approbation (permit)`, token: 'USDC', amount: a.h }, wrong: ['connect_or_accept_offer', 'pay_someone'] };
});
op('approve', 'dai_legacy_permit', () => {
  const C = ETH; const v = raddr(); const rk = pick(['oneinch6', 'univ2', 'aavePool']);
  const td = { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], Permit: [{ name: 'holder', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'expiry', type: 'uint256' }, { name: 'allowed', type: 'bool' }] }, primaryType: 'Permit', domain: { name: 'Dai Stablecoin', version: '1', chainId: 1, verifyingContract: T(C, 'DAI') }, message: { holder: v, spender: getAddress(C.p[rk]), nonce: '0', expiry: String(NOW + 1800), allowed: true } };
  return { C, v, rk, req: { method: 'eth_signTypedData_v4', params: [v, JSON.stringify(td)] }, intent: { kind: 'buy_or_swap', freeText: 'Swap de DAI (le site demande une signature)', token: 'DAI' }, wrong: ['connect_or_accept_offer'] };
});
op('approve', 'permit2_onchain_approve', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const s = tokenPick(C); const a = amt(C, s, 5, 4000);
  return { C, v, rk: 'permit2', req: tx(C, v, C.p.permit2, enc('approve(address,address,uint160,uint48)', [T(C, s), C.p.ur, a.raw, NOW + 30 * 86400])), intent: { kind: 'buy_or_swap', freeText: `Autoriser Uniswap pour ${a.h} ${s}`, token: s, amount: a.h }, wrong: ['connect_or_accept_offer'] };
});
op('approve', 'subscription_capped_approve', () => {
  const C = pc('avax', 'eth'); const v = raddr(); const merch = raddr(); const s = 'USDC'; const a = ri(5, 60);
  return { C, v, rk: null, req: tx(C, v, T(C, s), enc('approve(address,uint256)', [merch, parseUnits(String(a * 12), 6)])), ctx: { extraFacts: { [merch]: { label: 'Abonnement VPN (contrat de facturation)', isContract: true, ageBlocks: ri(200000, 5000000), firstSeenByUser: true } }, origin: 'https://billing.example-vpn.test' }, intent: { kind: 'pay_someone', freeText: `Abonnement annuel ${a} USDC/mois`, token: s, amount: String(a), counterpartyLabel: 'VPN' }, wrong: ['buy_or_swap', 'connect_or_accept_offer'] };
});

// --- lending
op('lending', 'aave_supply', () => { const C = pc('avax', 'eth', 'fuji'); const v = raddr(); const s = pick(C.stables); const a = amt(C, s, 10, 20000); return { C, v, rk: 'aavePool', req: tx(C, v, C.p.aavePool, enc('supply(address,uint256,address,uint16)', [T(C, s), a.raw, v, 0])), intent: { kind: 'buy_or_swap', freeText: `Déposer ${a.h} ${s} sur Aave pour gagner des intérêts`, token: s, amount: a.h }, wrong: ['send_to_my_account', 'pay_someone'], vague: ['placer mes dollars', 'mettre en epargne'] }; });
op('lending', 'aave_withdraw_max', () => { const C = pc('avax', 'eth'); const v = raddr(); const s = pick(C.stables); return { C, v, rk: 'aavePool', req: tx(C, v, C.p.aavePool, enc('withdraw(address,uint256,address)', [T(C, s), MaxUint256, v])), intent: { kind: 'send_to_my_account', freeText: `Retirer tous mes ${s} d'Aave`, token: s }, wrong: ['buy_or_swap'] }; });
op('lending', 'aave_borrow', () => { const C = pc('avax', 'eth'); const v = raddr(); const s = pick(C.stables); const a = amt(C, s, 50, 5000); return { C, v, rk: 'aavePool', req: tx(C, v, C.p.aavePool, enc('borrow', [T(C, s), a.raw, 2n, 0, v])), intent: { kind: 'buy_or_swap', freeText: `Emprunter ${a.h} ${s} sur Aave`, token: s, amount: a.h }, wrong: ['send_to_my_account', 'connect_or_accept_offer'] }; });
op('lending', 'aave_repay_max', () => { const C = pc('avax', 'eth'); const v = raddr(); const s = pick(C.stables); return { C, v, rk: 'aavePool', req: tx(C, v, C.p.aavePool, enc('repay', [T(C, s), MaxUint256, 2n, v])), intent: { kind: 'pay_someone', freeText: `Rembourser mon prêt ${s} sur Aave`, token: s, counterpartyLabel: 'Aave' }, wrong: ['buy_or_swap'] }; });
op('lending', 'aave_collateral_toggle', () => { const C = pc('avax', 'eth'); const v = raddr(); const s = pick([C.wrapped, ...C.stables]); return { C, v, rk: 'aavePool', req: tx(C, v, C.p.aavePool, enc('setUserUseReserveAsCollateral', [T(C, s), chance(0.5)])), intent: { kind: 'connect_or_accept_offer', freeText: `Activer ${s} comme collatéral sur Aave` }, wrong: ['buy_or_swap'] }; });
op('lending', 'aave_gateway_deposit_native', () => { const C = pc('avax', 'eth'); const v = raddr(); const a = amt(C, C.wrapped, 0.1, 30); return { C, v, rk: 'aaveGateway', req: tx(C, v, C.p.aaveGateway, enc('depositETH(address,address,uint16)', [C.p.aavePool, v, 0]), a.raw), intent: { kind: 'buy_or_swap', freeText: `Déposer ${a.h} ${C.native} sur Aave`, token: C.native, amount: a.h }, wrong: ['send_to_my_account'] }; });
op('lending', 'benqi_mint_avax', () => { const C = AVAX; const v = raddr(); const a = amt(C, 'WAVAX', 0.5, 200); return { C, v, rk: 'qiAVAX', req: tx(C, v, C.p.qiAVAX, enc('mint()', []), a.raw), intent: { kind: 'buy_or_swap', freeText: `Prêter ${a.h} AVAX sur Benqi`, token: 'AVAX', amount: a.h }, wrong: ['send_to_my_account'] }; });
op('lending', 'benqi_redeem', () => { const C = AVAX; const v = raddr(); const a = amt(C, 'USDC', 10, 4000); return { C, v, rk: 'qiUSDCn', req: tx(C, v, C.p.qiUSDCn, enc('redeemUnderlying', [a.raw])), intent: { kind: 'send_to_my_account', freeText: `Récupérer ${a.h} USDC de Benqi`, token: 'USDC', amount: a.h }, wrong: ['buy_or_swap'] }; });
op('lending', 'benqi_enter_markets', () => { const C = AVAX; const v = raddr(); return { C, v, rk: 'comptroller', req: tx(C, v, C.p.comptroller, enc('enterMarkets', [[C.p.qiAVAX, C.p.qiUSDCn]])), intent: { kind: 'connect_or_accept_offer', freeText: 'Activer mes dépôts comme garantie sur Benqi' }, wrong: ['buy_or_swap'] }; });
op('lending', 'compound_v3_supply', () => { const C = ETH; const v = raddr(); const a = amt(C, 'USDC', 50, 20000); return { C, v, rk: 'comet', req: tx(C, v, C.p.comet, enc('supply(address,uint256)', [T(C, 'USDC'), a.raw])), intent: { kind: 'buy_or_swap', freeText: `Déposer ${a.h} USDC sur Compound`, token: 'USDC', amount: a.h }, wrong: ['send_to_my_account'] }; });

// --- staking
op('staking', 'savax_submit', () => { const C = AVAX; const v = raddr(); const a = amt(C, 'WAVAX', 1, 500); return { C, v, rk: null, req: tx(C, v, T(C, 'sAVAX'), enc('submit()', []), a.raw), ctx: { origin: 'https://staking.benqi.fi', extraFacts: { [T(C, 'sAVAX')]: { label: 'Benqi sAVAX', isContract: true, ageBlocks: 30_000_000, firstSeenByUser: chance(0.5) } } }, intent: { kind: 'buy_or_swap', freeText: `Staker ${a.h} AVAX en sAVAX`, token: 'AVAX', amount: a.h }, otherToken: 'sAVAX', wrong: ['send_to_my_account', 'connect_or_accept_offer'], vague: ['staking', 'faire fructifier mes avax'] }; });
op('staking', 'savax_request_unlock', () => { const C = AVAX; const v = raddr(); const a = amt(C, 'sAVAX', 1, 400); return { C, v, rk: null, req: tx(C, v, T(C, 'sAVAX'), enc('requestUnlock', [a.raw])), ctx: { origin: 'https://staking.benqi.fi' }, intent: { kind: 'send_to_my_account', freeText: `Déstaker ${a.h} sAVAX`, token: 'sAVAX', amount: a.h }, wrong: ['buy_or_swap'] }; });
op('staking', 'sjoe_deposit', () => { const C = AVAX; const v = raddr(); const a = amt(C, 'JOE', 10, 20000); return { C, v, rk: 'sjoe', req: tx(C, v, C.p.sjoe, enc('deposit(uint256)', [a.raw])), intent: { kind: 'buy_or_swap', freeText: `Staker ${a.h} JOE dans sJOE`, token: 'JOE', amount: a.h }, wrong: ['send_to_my_account'] }; });
op('staking', 'lido_submit', () => { const C = ETH; const v = raddr(); const a = amt(C, 'WETH', 0.05, 32); return { C, v, rk: null, req: tx(C, v, T(C, 'stETH'), enc('submit(address)', [ZERO]), a.raw), ctx: { origin: 'https://stake.lido.fi' }, intent: { kind: 'buy_or_swap', freeText: `Staker ${a.h} ETH chez Lido`, token: 'ETH', amount: a.h }, otherToken: 'stETH', wrong: ['send_to_my_account', 'connect_or_accept_offer'] }; });
op('staking', 'lido_request_withdrawal', () => { const C = ETH; const v = raddr(); const a = amt(C, 'stETH', 0.1, 30); return { C, v, rk: 'lidoWQ', req: tx(C, v, C.p.lidoWQ, enc('requestWithdrawals', [[a.raw], v])), ctx: { origin: 'https://stake.lido.fi' }, intent: { kind: 'send_to_my_account', freeText: `Retirer ${a.h} stETH de Lido`, token: 'stETH', amount: a.h }, wrong: ['buy_or_swap'] }; });
op('staking', 'wsteth_wrap', () => { const C = ETH; const v = raddr(); const a = amt(C, 'stETH', 0.1, 30); return { C, v, rk: null, req: tx(C, v, T(C, 'wstETH'), enc('wrap', [a.raw])), ctx: { origin: 'https://stake.lido.fi' }, intent: { kind: 'buy_or_swap', freeText: `Wrapper ${a.h} stETH en wstETH`, token: 'stETH', amount: a.h }, otherToken: 'wstETH', wrong: ['send_to_my_account'] }; });
op('staking', 'rocketpool_deposit', () => { const C = ETH; const v = raddr(); const a = amt(C, 'WETH', 0.05, 10); return { C, v, rk: 'rocketDeposit', req: tx(C, v, C.p.rocketDeposit, enc('deposit()', []), a.raw), ctx: { origin: 'https://stake.rocketpool.net' }, intent: { kind: 'buy_or_swap', freeText: `Staker ${a.h} ETH en rETH`, token: 'ETH', amount: a.h }, otherToken: 'rETH', wrong: ['send_to_my_account'] }; });

// --- liquidity
op('lp', 'v2_add_liquidity_native', () => { const C = pc('avax', 'eth'); const v = raddr(); const rk = C === ETH ? 'univ2' : pick(['joeV1', 'pangolin']); const s = pick(C.stables); const a = amt(C, C.wrapped, 0.2, 20); const b = parseUnits(String(Math.round(Number(a.h) * priceOf(C.native))), C.tok[s][1]); const sig = C === ETH ? 'addLiquidityETH' : 'addLiquidityAVAX'; return { C, v, rk, req: tx(C, v, C.p[rk], enc(sig, [T(C, s), b, 1n, 1n, v, DL]), a.raw), intent: { kind: 'buy_or_swap', freeText: `Ajouter de la liquidité ${C.native}/${s}`, token: C.native, amount: a.h }, wrong: ['send_to_my_account', 'connect_or_accept_offer'], vague: ['farmer', 'mettre en pool'] }; });
op('lp', 'v2_remove_liquidity_native', () => { const C = pc('avax', 'eth'); const v = raddr(); const rk = C === ETH ? 'univ2' : pick(['joeV1', 'pangolin']); const s = pick(C.stables); const sig = C === ETH ? 'removeLiquidityETH' : 'removeLiquidityAVAX'; return { C, v, rk, req: tx(C, v, C.p[rk], enc(sig, [T(C, s), parseUnits('3.2', 18), 1n, 1n, v, DL])), intent: { kind: 'send_to_my_account', freeText: `Retirer ma liquidité ${C.native}/${s}` }, wrong: ['buy_or_swap'] }; });
op('lp', 'approve_lp_token_router', () => { const C = pc('avax', 'eth'); const v = raddr(); const rk = C === ETH ? 'univ2' : 'joeV1'; const lp = raddr(); return { C, v, rk, req: tx(C, v, lp, enc('approve(address,uint256)', [C.p[rk], MaxUint256])), ctx: { extraFacts: { [lp]: { label: 'LP token', isContract: true, ageBlocks: 9_000_000, firstSeenByUser: false } }, extra: { token_info: { [lp]: { symbol: 'JLP', ageBlocks: 9_000_000 } } } }, intent: { kind: 'send_to_my_account', freeText: 'Autoriser le retrait de ma liquidité' }, wrong: ['buy_or_swap', 'connect_or_accept_offer'] }; });
op('lp', 'univ3_npm_mint', () => { const C = ETH; const v = raddr(); const a = amt(C, 'WETH', 0.1, 10); const m = enc('mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))', [[T(C, 'USDC'), T(C, 'WETH'), 500, -200000, -190000, parseUnits('3000', 6), a.raw, 0n, 0n, v, DL]]); return { C, v, rk: 'npm', req: tx(C, v, C.p.npm, enc('multicall(bytes[])', [[m, enc('refundETH', [])]]), a.raw), ctx: { origin: 'https://app.uniswap.org' }, intent: { kind: 'buy_or_swap', freeText: 'Créer une position de liquidité USDC/ETH sur Uniswap v3', token: 'ETH', amount: a.h }, wrong: ['send_to_my_account'] }; });
op('lp', 'univ3_collect_fees', () => { const C = ETH; const v = raddr(); const m = enc('collect', [[BigInt(ri(1000, 900000)), v, (1n << 128n) - 1n, (1n << 128n) - 1n]]); return { C, v, rk: 'npm', req: tx(C, v, C.p.npm, m), ctx: { origin: 'https://app.uniswap.org' }, intent: { kind: 'send_to_my_account', freeText: 'Récupérer mes frais de position Uniswap' }, wrong: ['buy_or_swap', 'connect_or_accept_offer'] }; });

// --- bridges
const b32 = (a) => zeroPadValue(a, 32);
op('bridge', 'cctp_depositForBurn', () => { const C = pc('avax', 'eth', 'fuji'); const v = raddr(); const self = chance(0.7); const r = self ? v : raddr(); const a = amt(C, 'USDC', 20, 20000); return { C, v, rk: 'cctp', tag: self ? 'self' : 'own_other_wallet', req: tx(C, v, C.p.cctp, enc('depositForBurn', [a.raw, C === ETH ? 1 : 0, b32(r), T(C, 'USDC')])), ctx: { book: self ? [] : [{ label: 'mon wallet Ethereum', address: r, seenTimes: 4 }], origin: 'https://core.app/bridge' }, intent: { kind: 'send_to_my_account', freeText: `Bridger ${a.h} USDC vers ${C === ETH ? 'Avalanche' : 'Ethereum'}`, token: 'USDC', amount: a.h, counterpartyLabel: 'moi', counterpartyAddress: r }, wrong: ['buy_or_swap', 'pay_someone'] }; });
op('bridge', 'stargate_send', () => { const C = pc('avax', 'eth'); const v = raddr(); const a = amt(C, 'USDC', 20, 10000); const fee = parseUnits('0.003', 18); return { C, v, rk: 'stargate', req: tx(C, v, C.p.stargate, enc('send', [[30101 + ri(0, 80), b32(v), a.raw, a.raw * 995n / 1000n, '0x', '0x', '0x'], [fee, 0n], v]), fee), ctx: { origin: 'https://stargate.finance' }, intent: { kind: 'send_to_my_account', freeText: `Envoyer ${a.h} USDC sur Arbitrum (Stargate)`, token: 'USDC', amount: a.h, counterpartyAddress: v }, wrong: ['buy_or_swap', 'pay_someone'] }; });
op('bridge', 'avax_bridge_eth_side_transfer', () => { const C = ETH; const v = raddr(); const s = pick(['USDC', 'WETH', 'USDT']); const a = amt(C, s, 0.1, 5000); return { C, v, rk: 'avaxBridge', req: tx(C, v, T(C, s), enc('transfer', [C.p.avaxBridge, a.raw])), ctx: { origin: 'https://core.app/bridge', facts: ['avaxBridge'] }, intent: { kind: 'send_to_my_account', freeText: `Bridger ${a.h} ${s} vers Avalanche avec Core`, token: s, amount: a.h }, wrong: ['pay_someone', 'buy_or_swap'] }; });
op('bridge', 'avax_bridge_unwrap_wethe', () => { const C = AVAX; const v = raddr(); const a = amt(C, 'WETH.e', 0.05, 10); return { C, v, rk: null, req: tx(C, v, T(C, 'WETH.e'), enc('unwrap(uint256,uint256)', [a.raw, 1n])), ctx: { origin: 'https://core.app/bridge' }, intent: { kind: 'send_to_my_account', freeText: `Renvoyer ${a.h} WETH.e vers Ethereum`, token: 'WETH.e', amount: a.h }, wrong: ['buy_or_swap'] }; });
op('bridge', 'across_depositV3', () => { const C = ETH; const v = raddr(); const a = amt(C, 'USDC', 20, 10000); return { C, v, rk: 'across', req: tx(C, v, C.p.across, enc('depositV3', [v, v, T(C, 'USDC'), getAddress('0xaf88d065e77c8cc2239327c5edb3a432268e5831'), a.raw, a.raw * 998n / 1000n, 42161n, ZERO, NOW, NOW + 21600, 0, '0x'])), ctx: { origin: 'https://app.across.to' }, intent: { kind: 'send_to_my_account', freeText: `Bridger ${a.h} USDC vers Arbitrum (Across)`, token: 'USDC', amount: a.h }, wrong: ['buy_or_swap'] }; });
op('bridge', 'op_native_depositETH', () => { const C = ETH; const v = raddr(); const a = amt(C, 'WETH', 0.01, 5); const arb = chance(0.5); return { C, v, rk: arb ? 'arbInbox' : 'opBridge', req: tx(C, v, arb ? C.p.arbInbox : C.p.opBridge, arb ? enc('depositEth', []) : enc('depositETH(uint32,bytes)', [200000, '0x']), a.raw), ctx: { origin: arb ? 'https://bridge.arbitrum.io' : 'https://app.optimism.io' }, intent: { kind: 'send_to_my_account', freeText: `Bridger ${a.h} ETH vers ${arb ? 'Arbitrum' : 'Optimism'}`, token: 'ETH', amount: a.h }, wrong: ['buy_or_swap', 'pay_someone'] }; });

// --- NFT
op('nft', 'setApprovalForAll_marketplace', () => { const C = pc('avax', 'eth'); const v = raddr(); const coll = raddr(); const rk = C === ETH ? pick(['osConduit', 'blur']) : pick(['osConduit', 'joepegs']); return { C, v, rk, req: tx(C, v, coll, enc('setApprovalForAll', [C.p[rk], true])), ctx: { origin: rk === 'blur' ? 'https://blur.io' : rk === 'joepegs' ? 'https://joepegs.com' : 'https://opensea.io', extraFacts: { [coll]: { label: 'collection NFT', isContract: true, ageBlocks: ri(500000, 9000000), firstSeenByUser: false } }, extra: { nft_holdings: [{ collection: coll, tokenId: String(ri(1, 9999)) }] } }, intent: { kind: 'buy_or_swap', freeText: `Mettre en vente mon NFT sur ${rk === 'blur' ? 'Blur' : rk === 'joepegs' ? 'Joepegs' : 'OpenSea'}` }, wrong: ['connect_or_accept_offer', 'pay_someone'], vague: ['lister', 'vendre mon nft'] }; });
op('nft', 'seaport_listing_sign', () => {
  const C = pc('eth', 'avax'); const v = raddr(); const coll = raddr(); const price = parseUnits((0.01 + rnd() * 3).toFixed(4), 18); const fee = price * 25n / 1000n; const roy = chance(0.5) ? price * 5n / 100n : 0n; const creator = raddr();
  const item = [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }];
  const td = { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], OrderComponents: [['offerer', 'address'], ['zone', 'address'], ['offer', 'OfferItem[]'], ['consideration', 'ConsiderationItem[]'], ['orderType', 'uint8'], ['startTime', 'uint256'], ['endTime', 'uint256'], ['zoneHash', 'bytes32'], ['salt', 'uint256'], ['conduitKey', 'bytes32'], ['counter', 'uint256']].map(([name, type]) => ({ name, type })), OfferItem: item, ConsiderationItem: [...item, { name: 'recipient', type: 'address' }] }, primaryType: 'OrderComponents', domain: { name: 'Seaport', version: '1.6', chainId: C.id, verifyingContract: C.p.seaport },
    message: { offerer: v, zone: ZERO, offer: [{ itemType: 2, token: coll, identifierOrCriteria: String(ri(1, 9999)), startAmount: '1', endAmount: '1' }], consideration: [{ itemType: 0, token: ZERO, identifierOrCriteria: '0', startAmount: (price - fee - roy).toString(), endAmount: (price - fee - roy).toString(), recipient: v }, { itemType: 0, token: ZERO, identifierOrCriteria: '0', startAmount: fee.toString(), endAmount: fee.toString(), recipient: getAddress('0x0000a26b00c1f0df003000390027140000faa719') }, ...(roy ? [{ itemType: 0, token: ZERO, identifierOrCriteria: '0', startAmount: roy.toString(), endAmount: roy.toString(), recipient: creator }] : [])], orderType: 0, startTime: String(NOW), endTime: String(NOW + 30 * 86400), zoneHash: '0x' + '00'.repeat(32), salt: String(ri(1, 1e9)), conduitKey: '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000', counter: '0' } };
  return { C, v, rk: 'seaport', tag: roy ? 'royalty' : 'noroyalty', req: { method: 'eth_signTypedData_v4', params: [v, JSON.stringify(td)] }, ctx: { origin: 'https://opensea.io' }, intent: { kind: 'buy_or_swap', freeText: `Lister mon NFT à ${formatUnits(price, 18)} ${C.native}`, token: C.native, amount: formatUnits(price, 18) }, wrong: ['connect_or_accept_offer'], vague: ['vendre mon nft'] };
});
op('nft', 'seaport_buy_basic', () => {
  const C = pc('eth', 'avax'); const v = raddr(); const coll = raddr(); const seller = raddr(); const price = parseUnits((0.01 + rnd() * 2).toFixed(4), 18); const fee = price * 25n / 1000n;
  const data = enc('fulfillBasicOrder', [[ZERO, 0n, price - fee, seller, ZERO, coll, BigInt(ri(1, 9999)), 1n, 0, NOW - 1000, NOW + 86400, '0x' + '00'.repeat(32), BigInt(ri(1, 1e9)), '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000', '0x' + '00'.repeat(32), 1n, [[fee, getAddress('0x0000a26b00c1f0df003000390027140000faa719')]], '0x' + '22'.repeat(65)]]);
  return { C, v, rk: 'seaport', req: tx(C, v, C.p.seaport, data, price), ctx: { origin: 'https://opensea.io', extraFacts: { [coll]: { label: 'collection NFT', isContract: true, ageBlocks: ri(500000, 9000000), firstSeenByUser: true } } }, intent: { kind: 'buy_or_swap', freeText: `Acheter un NFT pour ${formatUnits(price, 18)} ${C.native}`, token: C.native, amount: formatUnits(price, 18) }, wrong: ['pay_someone', 'connect_or_accept_offer'] };
});
op('nft', 'public_mint_new_contract', () => {
  const C = pc('avax', 'eth', 'fuji'); const v = raddr(); const coll = raddr(); const q = ri(1, 3); const price = chance(0.3) ? 0n : parseUnits((0.005 * q + rnd() * 0.5).toFixed(4), 18); const sig = pick(['mint(uint256)', 'publicMint', 'claim']);
  const data = sig === 'claim' ? enc('claim', [v, BigInt(q)]) : enc(sig, [BigInt(q)]);
  return { C, v, rk: null, tag: price === 0n ? 'free_mint' : 'paid_mint', req: tx(C, v, coll, data, price), ctx: { origin: 'https://mint.example-collection.test', extraFacts: { [coll]: { label: 'nouvelle collection', isContract: true, ageBlocks: ri(200, 40000), firstSeenByUser: true } } }, intent: { kind: 'buy_or_swap', freeText: `Minter ${q} NFT${price ? ' pour ' + formatUnits(price, 18) + ' ' + C.native : ' gratuit'}`, token: C.native, amount: formatUnits(price, 18) }, wrong: ['pay_someone', 'connect_or_accept_offer'], vague: ['mint', 'participer au drop'] };
});
op('nft', 'nft_transfer_own_wallet', () => { const C = pc('avax', 'eth'); const v = raddr(); const own = raddr(); const coll = raddr(); return { C, v, rk: null, req: tx(C, v, coll, enc('safeTransferFrom(address,address,uint256)', [v, own, BigInt(ri(1, 9999))])), ctx: { book: [{ label: 'mon Ledger', address: own, seenTimes: ri(1, 30) }], extraFacts: { [coll]: { label: 'collection NFT', isContract: true, ageBlocks: 5_000_000, firstSeenByUser: false } } }, intent: { kind: 'send_to_my_account', freeText: 'Mettre mon NFT à l\'abri sur mon Ledger', counterpartyLabel: 'mon Ledger', counterpartyAddress: own }, wrong: ['pay_someone', 'buy_or_swap'] }; });
op('nft', 'nft_gift_friend', () => { const C = pc('avax', 'eth'); const v = raddr(); const fr = raddr(); const coll = raddr(); return { C, v, rk: null, req: tx(C, v, coll, enc('safeTransferFrom(address,address,uint256)', [v, fr, BigInt(ri(1, 9999))])), ctx: { book: [{ label: 'Léa', address: fr, seenTimes: ri(1, 10) }], extraFacts: { [coll]: { label: 'collection NFT', isContract: true, ageBlocks: 5_000_000, firstSeenByUser: false } } }, intent: { kind: 'pay_someone', freeText: 'Offrir mon NFT à Léa', counterpartyLabel: 'Léa', counterpartyAddress: fr }, wrong: ['send_to_my_account'] }; });

// --- off-chain signatures / connection
const siwe = (dom, v, chainId, extra = '') => `${dom} wants you to sign in with your Ethereum account:\n${v}\n\nSign in to ${dom}.\n\nURI: https://${dom}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${Math.floor(rnd() * 1e12).toString(36)}\nIssued At: 2026-10-11T08:00:00.000Z${extra}`;
const SITES = ['app.uniswap.org', 'opensea.io', 'lfj.gg', 'app.aave.com', 'snapshot.box', 'app.safe.global', 'galxe.com', 'guild.xyz', 'warpcast.com', 'joepegs.com', 'app.ens.domains', 'dexalot.com', 'app.zerion.io', 'debank.com'];
const utf8hex = (s) => hexlify(new TextEncoder().encode(s));
op('sign', 'siwe_match', () => { const C = pc('avax', 'eth'); const v = raddr(); const d = pick(SITES); const hex = chance(0.5); const extra = chance(0.3) ? `\nExpiration Time: 2026-10-18T08:00:00.000Z\nResources:\n- https://${d}/tos` : ''; const m = siwe(d, v, C.id, extra); return { C, v, rk: null, req: { method: 'personal_sign', params: [hex ? utf8hex(m) : m, v] }, ctx: { origin: 'https://' + d }, intent: { kind: 'connect_or_accept_offer', freeText: `Me connecter à ${d}` }, wrong: ['buy_or_swap', 'pay_someone'], vague: ['se connecter', 'login'] }; });
op('sign', 'siwe_subdomain_drift', () => { const C = pc('avax', 'eth'); const v = raddr(); const [o, d] = pick([['https://www.opensea.io', 'opensea.io'], ['https://opensea.io', 'www.opensea.io'], ['https://app.lfj.gg', 'lfj.gg'], ['https://lfj.gg', 'app.lfj.gg'], ['https://snapshot.org', 'snapshot.box'], ['https://traderjoexyz.com', 'lfj.gg'], ['https://app.paraswap.xyz', 'app.velora.xyz'], ['http://localhost:3000', 'localhost:3000']]); const m = siwe(d, v, chance(0.5) ? C.id : 1); return { C, v, rk: null, tag: `${o}=>${d}`, req: { method: 'personal_sign', params: [m, v] }, ctx: { origin: o }, intent: { kind: 'connect_or_accept_offer', freeText: `Connexion à ${d}` }, wrong: ['buy_or_swap'] }; });
op('sign', 'plain_login_message', () => { const C = pc('avax', 'eth'); const v = raddr(); const [o, m] = pick([['https://opensea.io', `Welcome to OpenSea!\n\nClick to sign in and accept the OpenSea Terms of Service.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:\n${v.toLowerCase()}\n\nNonce:\n${raddr().slice(2, 38)}`], ['https://galxe.com', `galxe.com wants you to sign in with your Ethereum account:\n${v}\n\nSign in with Ethereum to the app.\n\nURI: https://galxe.com\nVersion: 1\nChain ID: 1\nNonce: abc123\nIssued At: 2026-10-11T08:00:00Z`], ['https://debank.com', `Welcome to DeBank\n\nPlease sign this message to verify ownership of ${v}\n\nNonce: ${ri(1, 1e6)}`], ['https://app.zerion.io', `Zerion: verify wallet ownership. This signature costs nothing.\nTimestamp: ${NOW}`], ['https://dexalot.com', `Dexalot Exchange Authentication\nAddress: ${v}\nThis signature does not trigger any transaction.`]]); return { C, v, rk: null, req: { method: 'personal_sign', params: [chance(0.5) ? utf8hex(m) : m, v] }, ctx: { origin: o }, intent: { kind: 'connect_or_accept_offer', freeText: `Me connecter sur ${new URL(o).host}` }, wrong: ['buy_or_swap'] }; });
op('sign', 'snapshot_vote', () => { const C = pc('eth', 'avax'); const v = raddr(); const td = { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }], Vote: [{ name: 'from', type: 'address' }, { name: 'space', type: 'string' }, { name: 'timestamp', type: 'uint64' }, { name: 'proposal', type: 'bytes32' }, { name: 'choice', type: 'uint32' }, { name: 'reason', type: 'string' }, { name: 'app', type: 'string' }, { name: 'metadata', type: 'string' }] }, primaryType: 'Vote', domain: { name: 'snapshot', version: '0.1.4' }, message: { from: v, space: pick(['aave.eth', 'uniswapgovernance.eth', 'lfj.eth', 'arbitrumfoundation.eth']), timestamp: NOW, proposal: '0x' + 'ab'.repeat(32), choice: ri(1, 3), reason: '', app: 'snapshot', metadata: '{}' } }; return { C, v, rk: null, req: { method: 'eth_signTypedData_v4', params: [v, JSON.stringify(td)] }, ctx: { origin: 'https://snapshot.box' }, intent: { kind: 'connect_or_accept_offer', freeText: 'Voter sur la proposition de gouvernance' }, wrong: ['buy_or_swap'] }; });
op('sign', 'onchain_gov_vote', () => { const C = ETH; const v = raddr(); const reason = chance(0.5); return { C, v, rk: 'govBravo', req: tx(C, v, C.p.govBravo, reason ? enc('castVoteWithReason', [BigInt(ri(50, 90)), ri(0, 2), 'je soutiens']) : enc('castVote', [BigInt(ri(50, 90)), ri(0, 2)])), ctx: { origin: 'https://www.tally.xyz' }, intent: { kind: 'connect_or_accept_offer', freeText: 'Voter pour la proposition Uniswap' }, wrong: ['buy_or_swap'] }; });
op('sign', 'gov_delegate_self', () => { const C = ETH; const v = raddr(); const s = pick(['UNI', 'AAVE']); const other = chance(0.3) ? raddr() : v; return { C, v, rk: null, tag: other === v ? 'self' : 'delegate_to_known_delegate', req: tx(C, v, T(C, s), enc('delegate', [other])), ctx: { origin: 'https://www.tally.xyz', book: other === v ? [] : [{ label: 'délégué connu', address: other, seenTimes: 1 }] }, intent: { kind: 'connect_or_accept_offer', freeText: `Déléguer mes votes ${s}` }, wrong: ['send_to_my_account', 'buy_or_swap'] }; });
op('sign', 'safe_tx_sign', () => { const C = pc('eth', 'avax'); const v = raddr(); const safe = raddr(); const to = raddr(); const a = amt(C, 'USDC', 100, 50000); const td = { types: { EIP712Domain: [{ name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], SafeTx: ['to:address', 'value:uint256', 'data:bytes', 'operation:uint8', 'safeTxGas:uint256', 'baseGas:uint256', 'gasPrice:uint256', 'gasToken:address', 'refundReceiver:address', 'nonce:uint256'].map((s) => ({ name: s.split(':')[0], type: s.split(':')[1] })) }, primaryType: 'SafeTx', domain: { chainId: C.id, verifyingContract: safe }, message: { to: T(C, 'USDC'), value: '0', data: enc('transfer', [to, a.raw]), operation: 0, safeTxGas: '0', baseGas: '0', gasPrice: '0', gasToken: ZERO, refundReceiver: ZERO, nonce: String(ri(1, 200)) } }; return { C, v, rk: null, req: { method: 'eth_signTypedData_v4', params: [v, JSON.stringify(td)] }, ctx: { origin: 'https://app.safe.global', book: [{ label: 'Prestataire audit', address: to, seenTimes: 3 }, { label: 'Safe trésorerie', address: safe, seenTimes: 40 }], extraFacts: { [safe]: { label: 'Safe multisig', isContract: true, ageBlocks: 3_000_000, firstSeenByUser: false } } }, intent: { kind: 'pay_someone', freeText: `Co-signer le paiement de ${a.h} USDC au prestataire depuis le Safe`, token: 'USDC', amount: a.h, counterpartyLabel: 'Prestataire audit', counterpartyAddress: to }, wrong: ['connect_or_accept_offer'] }; });
op('sign', 'ens_commit_register', () => { const C = ETH; const v = raddr(); const ren = chance(0.5); const val = parseUnits((0.002 + rnd() * 0.02).toFixed(5), 18); return { C, v, rk: 'ensCtrl', tag: ren ? 'renew' : 'commit', req: tx(C, v, C.p.ensCtrl, ren ? enc('renew', ['monnom' + ri(1, 999), 31536000n]) : enc('commit', ['0x' + 'cc'.repeat(32)]), ren ? val : 0n), ctx: { origin: 'https://app.ens.domains' }, intent: { kind: 'buy_or_swap', freeText: ren ? 'Renouveler mon nom ENS pour un an' : 'Réserver un nom ENS', token: 'ETH', amount: ren ? formatUnits(val, 18) : undefined }, wrong: ['pay_someone', 'connect_or_accept_offer'] }; });

// --- payments
const contactCtx = (v, who, addr, seen) => ({ book: [{ label: who, address: addr, seenTimes: seen }], history: seen ? [{ address: addr, minutes_ago: ri(1000, 200000), direction: 'sortie', kind: 'transfer' }] : [] });
const NAMES = ['Paul', 'Maman', 'Karim', 'Sofia', 'le plombier', 'Julie', 'Tonton Marc', 'mon coloc', 'Inès', 'le menuisier'];
op('pay', 'p2p_native_contact', () => { const C = pc('avax', 'eth', 'fuji'); const v = raddr(); const to = raddr(); const who = pick(NAMES); const a = amt(C, C.wrapped, 0.05, 30); const seen = chance(0.7) ? ri(1, 20) : 0; return { C, v, rk: null, tag: seen ? 'known_contact' : 'first_payment', req: tx(C, v, to, '0x', a.raw), ctx: { ...contactCtx(v, who, to, seen), extraFacts: { [to]: { isContract: false, firstSeenByUser: !seen } } }, intent: { kind: 'pay_someone', freeText: `Envoyer ${a.h} ${C.native} à ${who}`, token: C.native, amount: a.h, counterpartyLabel: who, counterpartyAddress: to }, wrong: ['send_to_my_account', 'buy_or_swap'], askedFriend: true }; });
op('pay', 'p2p_erc20_contact', () => { const C = pc('avax', 'eth', 'fuji'); const v = raddr(); const to = raddr(); const who = pick(NAMES); const s = pick(C.stables); const a = amt(C, s, 5, 3000); const seen = chance(0.6) ? ri(1, 20) : 0; return { C, v, rk: null, tag: seen ? 'known_contact' : 'first_payment', req: tx(C, v, T(C, s), enc('transfer', [to, a.raw])), ctx: { ...contactCtx(v, who, to, seen), extraFacts: { [to]: { isContract: false, firstSeenByUser: !seen } } }, intent: { kind: 'pay_someone', freeText: `Payer ${who} ${a.h} ${s}`, token: s, amount: a.h, counterpartyLabel: who, counterpartyAddress: to }, wrong: ['send_to_my_account', 'buy_or_swap'], askedFriend: true }; });
op('pay', 'p2p_qr_unknown_no_book', () => { const C = pc('avax', 'eth'); const v = raddr(); const to = raddr(); const s = pick([...C.stables, C.native]); const isN = s === C.native; const a = amt(C, isN ? C.wrapped : s, isN ? 0.05 : 5, isN ? 5 : 800); return { C, v, rk: null, req: isN ? tx(C, v, to, '0x', a.raw) : tx(C, v, T(C, s), enc('transfer', [to, a.raw])), ctx: { origin: 'wallet://scan-qr', extraFacts: { [to]: { isContract: false, firstSeenByUser: true } } }, intent: { kind: 'pay_someone', freeText: `Payer le food-truck ${a.h} ${s}`, token: s, amount: a.h, counterpartyLabel: 'food-truck' }, wrong: ['buy_or_swap'] }; });
op('pay', 'p2p_poison_in_history_real_recipient', () => { const C = pc('avax', 'eth'); const v = raddr(); const to = raddr(); const twin = getAddress((to.slice(0, 6) + raddr().slice(6, 38) + to.slice(38)).toLowerCase()); const s = 'USDC'; const a = amt(C, s, 20, 3000); return { C, v, rk: null, req: tx(C, v, T(C, s), enc('transfer', [to, a.raw])), ctx: { book: [{ label: 'Paul', address: to, seenTimes: 8 }], history: [{ address: to, minutes_ago: 50000, direction: 'sortie', kind: 'transfer' }, { address: twin, minutes_ago: 30, direction: 'entree', kind: 'incoming', amount: '0', token: 'USDC' }] }, intent: { kind: 'pay_someone', freeText: `Rembourser Paul ${a.h} USDC`, token: s, amount: a.h, counterpartyLabel: 'Paul', counterpartyAddress: to }, wrong: ['send_to_my_account'] }; });
op('pay', 'payroll_disperse', () => { const C = pc('avax', 'eth'); const v = raddr(); const n = ri(2, 12); const rs = Array.from({ length: n }, raddr); const s = 'USDC'; const vals = rs.map(() => parseUnits(String(ri(800, 4500)), 6)); const tot = vals.reduce((a, b) => a + b, 0n); const nat = chance(0.3); return { C, v, rk: 'disperse', tag: nat ? 'ether' : 'token', req: nat ? tx(C, v, C.p.disperse, enc('disperseEther', [rs, vals.map((x) => x * 10n ** 12n / 3000n)]), vals.reduce((a, x) => a + x * 10n ** 12n / 3000n, 0n)) : tx(C, v, C.p.disperse, enc('disperseToken', [T(C, s), rs, vals])), ctx: { origin: 'https://disperse.app', book: rs.map((r, i) => ({ label: 'salarié ' + (i + 1), address: r, seenTimes: ri(1, 12) })) }, intent: { kind: 'pay_someone', freeText: `Payer les salaires de l'équipe (${n} personnes, ${formatUnits(tot, 6)} USDC)`, token: nat ? C.native : s, amount: formatUnits(tot, 6), counterpartyLabel: 'équipe' }, wrong: ['send_to_my_account', 'buy_or_swap'] }; });
op('pay', 'payroll_sendcalls', () => { const C = pc('avax', 'eth'); const v = raddr(); const n = ri(2, 8); const rs = Array.from({ length: n }, raddr); const vals = rs.map(() => parseUnits(String(ri(500, 4000)), 6)); const tot = vals.reduce((a, b) => a + b, 0n); return { C, v, rk: null, req: { method: 'wallet_sendCalls', params: [{ version: '2.0.0', chainId: C.hex, from: v, atomicRequired: true, calls: rs.map((r, i) => ({ to: T(C, 'USDC'), data: enc('transfer', [r, vals[i]]), value: '0x0' })) }] }, ctx: { book: rs.map((r, i) => ({ label: 'freelance ' + (i + 1), address: r, seenTimes: ri(1, 6) })) }, intent: { kind: 'pay_someone', freeText: `Payer ${n} freelances, total ${formatUnits(tot, 6)} USDC`, token: 'USDC', amount: formatUnits(tot, 6), counterpartyLabel: 'freelances' }, wrong: ['send_to_my_account'] }; });
op('pay', 'donation', () => { const C = pc('avax', 'eth'); const v = raddr(); const to = raddr(); const s = pick([C.native, 'USDC']); const isN = s === C.native; const a = amt(C, isN ? C.wrapped : 'USDC', isN ? 0.01 : 5, isN ? 2 : 500); const org = pick(['Croix-Rouge', 'Wikipedia', 'Gitcoin round climat', 'association du quartier', 'Restos du coeur']); return { C, v, rk: null, req: isN ? tx(C, v, to, '0x', a.raw) : tx(C, v, T(C, 'USDC'), enc('transfer', [to, a.raw])), ctx: { origin: pick(['https://explorer.gitcoin.co', 'https://donate.example-charity.test', 'wallet://send']), extraFacts: { [to]: { label: org, isContract: chance(0.3), ageBlocks: ri(100000, 9000000), firstSeenByUser: true } } }, intent: { kind: 'pay_someone', freeText: `Faire un don de ${a.h} ${s} à ${org}`, token: s, amount: a.h, counterpartyLabel: org }, wrong: ['buy_or_swap', 'connect_or_accept_offer'] }; });
op('pay', 'exchange_deposit', () => { const C = pc('avax', 'eth'); const v = raddr(); const to = raddr(); const ex = pick(['Coinbase', 'Binance', 'Kraken', 'Bitstamp']); const seen = chance(0.6) ? ri(1, 30) : 0; const s = pick([C.native, ...C.stables]); const isN = s === C.native; const a = amt(C, isN ? C.wrapped : s, isN ? 0.1 : 50, isN ? 100 : 20000); const fwd = ex === 'Coinbase' && chance(0.5); return { C, v, rk: null, tag: (seen ? 'seen' : 'first') + (fwd ? '_contract_forwarder' : ''), req: isN ? tx(C, v, to, '0x', a.raw) : tx(C, v, T(C, s), enc('transfer', [to, a.raw])), ctx: { book: [{ label: `mon ${ex}`, address: to, seenTimes: seen }], history: seen ? [{ address: to, minutes_ago: ri(2000, 300000), direction: 'sortie', kind: 'transfer' }] : [], share: ri(30, 100), extraFacts: { [to]: { label: `${ex} deposit`, isContract: fwd, ageBlocks: fwd ? ri(10, 5000) : undefined, firstSeenByUser: !seen } } }, intent: { kind: 'send_to_my_account', freeText: `Déposer ${a.h} ${s} sur mon compte ${ex}`, token: s, amount: a.h, counterpartyLabel: `mon ${ex}`, counterpartyAddress: to }, wrong: ['pay_someone', 'buy_or_swap'] }; });
op('pay', 'self_transfer_max', () => { const C = pc('avax', 'eth', 'fuji'); const v = raddr(); const to = raddr(); const s = pick([C.native, ...C.stables]); const isN = s === C.native; const a = amt(C, isN ? C.wrapped : s, isN ? 1 : 100, isN ? 500 : 50000); const seen = chance(0.5) ? ri(1, 10) : 0; return { C, v, rk: null, tag: seen ? 'seen' : 'new_hardware_wallet', req: isN ? tx(C, v, to, '0x', a.raw) : tx(C, v, T(C, s), enc('transfer', [to, a.raw])), ctx: { book: [{ label: 'mon Ledger', address: to, seenTimes: seen }], share: ri(90, 100), history: seen ? [{ address: to, minutes_ago: 99999, direction: 'sortie', kind: 'transfer' }] : [], extraFacts: { [to]: { isContract: false, firstSeenByUser: !seen } } }, intent: { kind: 'send_to_my_account', freeText: `Tout transférer sur mon Ledger (${a.h} ${s})`, token: s, amount: a.h, counterpartyLabel: 'mon Ledger', counterpartyAddress: to }, wrong: ['pay_someone'] }; });
op('pay', 'cancel_tx_self_zero', () => { const C = pc('avax', 'eth'); const v = raddr(); return { C, v, rk: null, req: tx(C, v, v, '0x', 0n), ctx: { origin: 'wallet://send' }, intent: { kind: 'send_to_my_account', freeText: 'Annuler ma transaction bloquée', counterpartyLabel: 'moi', counterpartyAddress: v }, wrong: ['pay_someone', 'connect_or_accept_offer'] }; });
op('pay', 'merchant_checkout_contract', () => { const C = pc('avax', 'eth'); const v = raddr(); const m = raddr(); const a = amt(C, 'USDC', 5, 300); return { C, v, rk: null, req: { method: 'wallet_sendCalls', params: [{ version: '2.0.0', chainId: C.hex, from: v, atomicRequired: true, calls: [{ to: T(C, 'USDC'), data: enc('approve(address,uint256)', [m, a.raw]), value: '0x0' }, { to: m, data: '0x' + 'f0f0f0f0' + coder.encode(['uint256', 'bytes32'], [a.raw, '0x' + '42'.repeat(32)]).slice(2), value: '0x0' }] }] }, ctx: { origin: 'https://checkout.example-shop.test', extraFacts: { [m]: { label: 'Coinbase Commerce (synthetique)', isContract: true, ageBlocks: 8_000_000, firstSeenByUser: true } } }, intent: { kind: 'pay_someone', freeText: `Payer ma commande ${a.h} USDC`, token: 'USDC', amount: a.h, counterpartyLabel: 'boutique' }, wrong: ['buy_or_swap'] }; });

// --- revocations
op('revoke', 'approve_zero', () => { const ck = pick(['avax', 'eth', 'fuji']); const C = chains[ck]; const v = raddr(); const known = chance(0.6); const sp = known ? C.p[pick(apprTargets[ck])] : raddr(); const s = tokenPick(C); return { C, v, rk: null, tag: known ? 'known_spender' : 'unknown_spender', req: tx(C, v, T(C, s), enc('approve(address,uint256)', [sp, 0n])), ctx: { origin: 'https://revoke.cash' }, intent: { kind: 'connect_or_accept_offer', freeText: `Révoquer l'autorisation ${s}` }, wrong: ['buy_or_swap', 'pay_someone'], vague: ['nettoyer mes autorisations', 'securiser mon wallet'] }; });
op('revoke', 'nft_revoke_all', () => { const C = pc('avax', 'eth'); const v = raddr(); const coll = raddr(); const op_ = chance(0.5) ? C.p.osConduit : raddr(); return { C, v, rk: null, req: tx(C, v, coll, enc('setApprovalForAll', [op_, false])), ctx: { origin: 'https://revoke.cash' }, intent: { kind: 'connect_or_accept_offer', freeText: 'Retirer l\'accès de la marketplace à mes NFT' }, wrong: ['buy_or_swap'] }; });
op('revoke', 'permit2_lockdown', () => { const C = pc('avax', 'eth'); const v = raddr(); const pairs = Array.from({ length: ri(1, 4) }, () => [T(C, tokenPick(C)), pick([C.p.ur, raddr()])]); return { C, v, rk: 'permit2', req: tx(C, v, C.p.permit2, enc('lockdown', [pairs])), ctx: { origin: 'https://revoke.cash' }, intent: { kind: 'connect_or_accept_offer', freeText: 'Révoquer mes autorisations Permit2' }, wrong: ['buy_or_swap'] }; });
op('revoke', 'permit2_approve_zero', () => { const C = pc('avax', 'eth'); const v = raddr(); return { C, v, rk: 'permit2', req: tx(C, v, C.p.permit2, enc('approve(address,address,uint160,uint48)', [T(C, tokenPick(C)), C.p.ur, 0n, 0n])), ctx: { origin: 'https://revoke.cash' }, intent: { kind: 'connect_or_accept_offer', freeText: 'Révoquer Uniswap dans Permit2' }, wrong: ['buy_or_swap'] }; });
op('revoke', 'decrease_allowance', () => { const C = pc('avax', 'eth'); const v = raddr(); const s = 'USDC'; return { C, v, rk: null, req: tx(C, v, T(C, s), enc('decreaseAllowance', [C.p.permit2, parseUnits('1000', 6)])), ctx: { origin: 'https://revoke.cash' }, intent: { kind: 'connect_or_accept_offer', freeText: 'Réduire mon autorisation USDC' }, wrong: ['buy_or_swap'] }; });
op('revoke', 'revoke_batch_sendcalls', () => { const C = pc('avax', 'eth'); const v = raddr(); const n = ri(2, 6); return { C, v, rk: null, req: { method: 'wallet_sendCalls', params: [{ version: '2.0.0', chainId: C.hex, from: v, atomicRequired: false, calls: Array.from({ length: n }, () => ({ to: T(C, tokenPick(C)), data: enc('approve(address,uint256)', [raddr(), 0n]), value: '0x0' })) }] }, ctx: { origin: 'https://revoke.cash' }, intent: { kind: 'connect_or_accept_offer', freeText: `Révoquer ${n} vieilles autorisations` }, wrong: ['buy_or_swap'] }; });

// --- chain switching
op('chain', 'switch_chain', () => { const C = pc('avax', 'eth', 'fuji'); const v = raddr(); return { C, v, rk: null, req: { method: 'wallet_switchEthereumChain', params: [{ chainId: pick(['0xa86a', '0xa869', '0x1']) }] }, ctx: { origin: pick(['https://lfj.gg', 'https://core.app', 'https://app.aave.com', 'https://build.avax.network']) }, intent: { kind: 'connect_or_accept_offer', freeText: 'Passer sur Avalanche' }, wrong: ['buy_or_swap'] }; });
op('chain', 'add_chain_avalanche', () => { const C = pc('avax', 'eth'); const v = raddr(); const ch = pick([{ chainId: '0xa86a', chainName: 'Avalanche C-Chain', rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'], nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }, blockExplorerUrls: ['https://snowtrace.io'] }, { chainId: '0xa869', chainName: 'Avalanche Fuji Testnet', rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'], nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }, blockExplorerUrls: ['https://testnet.snowtrace.io'] }, { chainId: '0x10f2c', chainName: 'Dexalot Subnet', rpcUrls: ['https://subnets.avax.network/dexalot/mainnet/rpc'], nativeCurrency: { name: 'Dexalot', symbol: 'ALOT', decimals: 18 }, blockExplorerUrls: ['https://subnets.avax.network/dexalot'] }, { chainId: '0x10f1', chainName: 'Beam', rpcUrls: ['https://build.onbeam.com/rpc'], nativeCurrency: { name: 'Beam', symbol: 'BEAM', decimals: 18 }, blockExplorerUrls: ['https://subnets.avax.network/beam'] }, { chainId: '0xd2af', chainName: 'DFK Chain', rpcUrls: ['https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc'], nativeCurrency: { name: 'Jewel', symbol: 'JEWEL', decimals: 18 }, blockExplorerUrls: ['https://subnets.avax.network/defi-kingdoms'] }]); return { C, v, rk: null, tag: ch.chainName, req: { method: 'wallet_addEthereumChain', params: [ch] }, ctx: { origin: pick(['https://chainlist.org', 'https://dexalot.com', 'https://onbeam.com', 'https://core.app', 'https://game.defikingdoms.com']) }, intent: { kind: 'connect_or_accept_offer', freeText: `Ajouter le réseau ${ch.chainName}` }, wrong: ['buy_or_swap'] }; });

// --- EIP-7702 honest upgrade
op('account', 'eip7702_metamask_smart_account', () => { const C = pc('avax', 'eth'); const v = raddr(); const revoke = chance(0.3); const del = revoke ? ZERO : getAddress('0x63c0c19a282a1b52b07dd5a65b58948a07dae32b'); return { C, v, rk: null, tag: revoke ? 'revoke_delegation' : 'upgrade', req: { method: 'eth_sendTransaction', params: [{ from: v, to: v, data: '0x', value: '0x0', type: '0x4', chainId: C.hex, authorizationList: [{ chainId: C.hex, address: del, nonce: '0x' + ri(0, 50).toString(16) }] }] }, ctx: { origin: 'wallet://builtin', extraFacts: { [del]: { label: 'MetaMask EIP7702StatelessDeleGator', isContract: !revoke, ageBlocks: 2_000_000, firstSeenByUser: true } } }, intent: { kind: 'connect_or_accept_offer', freeText: revoke ? 'Revenir à un compte classique' : 'Activer le compte intelligent proposé par MetaMask' }, wrong: ['buy_or_swap', 'send_to_my_account'], vague: ['mettre a jour mon compte', 'ok metamask'] }; });

// ---------- build ----------
const out = []; let n = 0;
for (const o of OPS) {
  for (let i = 0; i < PER; i++) {
    let r; try { r = o.fn(); } catch (e) { console.error('gen error', o.sub, e.message); break; }
    // context dimension
    const dims = [];
    const firstSeen = chance(0.3); if (firstSeen) dims.push('protocol_firstSeen');
    let dropKnown = []; if (r.rk && chance(0.12)) { dropKnown = [r.rk]; dims.push('router_not_in_registry'); }
    const share = r.ctx?.share ?? (chance(0.12) ? ri(70, 100) : ri(1, 45)); if (share >= 50) dims.push('share>=50');
    const ctx = baseCtx(r.C, r.v, { ...(r.ctx || {}), origin: r.ctx?.origin || (r.rk && r.C.origins?.[r.rk]) || pick(['https://swap.defillama.com', 'https://jumper.exchange', 'wallet://builtin-swap', 'https://core.app']), facts: r.rk ? [r.rk] : [], firstSeen, dropKnown, share });
    for (const [vname, intent] of variants(r)) {
      n++;
      out.push({ id: `FZFP-${String(n).padStart(6, '0')}`, synthetic: true, notice: 'SYNTHETIQUE - fuzz_fp, operations honnetes, aucune cle ni donnee reelle', family: r.fam || o.fam, subfamily: o.sub, chain: r.C.id, tag: r.tag || null, ctx_dims: dims, intent_variant: vname, label: 'benin', expected_severity: 'ok', request: r.req, context: ctx, intent });
    }
  }
}
writeFileSync(OUT, out.map((x) => JSON.stringify(x)).join('\n') + '\n');
console.error(`ops=${OPS.length} cases=${out.length} -> ${OUT}`);

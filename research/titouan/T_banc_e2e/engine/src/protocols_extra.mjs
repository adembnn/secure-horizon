// Bibliothèque d'ABI PUBLIQUES de fonctions « valeur contre service » courantes (échange, prêt, pont, staking, liquidité, gouvernance, marché NFT).
// Aucune adresse, aucun identifiant de cas : les sélecteurs sont CALCULÉS (keccak) depuis les signatures ABI publiques (parseSig) ; le rôle de chaque paramètre
// (qui REÇOIT le produit : to / onBehalfOf / dstReceiver / outputReceiver / beneficiary / mintRecipient / bytes _to) est la seule information sémantique.
// Raison générale : un appel dont on sait décoder la fonction ET dont on vérifie que le produit revient à l'utilisateur (ou à un contact / protocole connu)
// n'est pas « opaque » ; seule une redirection du produit (swap vers un tiers, retrait vers un tiers, pont vers un tiers) est un signal de risque.
// Ne s'applique QUE si la cible est de confiance (liste de protocoles connus ou jeton du registre de référence du contexte) : une fonction « connue » sur un contrat
// inconnu ne prouve rien (le contrat peut faire autre chose que ce que son nom annonce).
import { parseSig, decodeParams } from './abi.mjs';
import { lc } from './util.mjs';

// kind : swap | withdraw | borrow | bridge | liquidity_remove  => sévérité critical si le produit va à un tiers ; deposit | stake | liquidity_add | repay | governance | purchase | misc => warn.
const SEVERE = new Set(['swap', 'withdraw', 'borrow', 'bridge', 'liquidity_remove']);
const T = (sig, kind, extra = {}) => ({ kind, ...extra, ...parseSig(sig) });
const LB_PATH = '(uint256[] pairBinSteps,uint8[] versions,address[] tokenPath) path';
const SWAP_DESC = '(address srcToken,address dstToken,address srcReceiver,address dstReceiver,uint256 amount,uint256 minReturnAmount,uint256 flags) desc';
const TABLE = [
  // --- routeurs de style Uniswap V2 (Pangolin, Trader Joe v1, Uniswap V2 et forks)
  ...['AVAX', 'ETH'].flatMap((N) => [
    T(`swapExact${N}ForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)`, 'swap', { ben: ['to'], minOut: 'amountOutMin' }),
    T(`swapExactTokensFor${N}(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)`, 'swap', { ben: ['to'], minOut: 'amountOutMin' }),
    T(`swap${N}ForExactTokens(uint256 amountOut,address[] path,address to,uint256 deadline)`, 'swap', { ben: ['to'] }),
    T(`swapTokensForExact${N}(uint256 amountOut,uint256 amountInMax,address[] path,address to,uint256 deadline)`, 'swap', { ben: ['to'] }),
    T(`swapExact${N}ForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)`, 'swap', { ben: ['to'], minOut: 'amountOutMin' }),
    T(`swapExactTokensFor${N}SupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)`, 'swap', { ben: ['to'], minOut: 'amountOutMin' }),
    T(`addLiquidity${N}(address token,uint256 amountTokenDesired,uint256 amountTokenMin,uint256 amount${N}Min,address to,uint256 deadline)`, 'liquidity_add', { ben: ['to'] }),
    T(`removeLiquidity${N}(address token,uint256 liquidity,uint256 amountTokenMin,uint256 amount${N}Min,address to,uint256 deadline)`, 'liquidity_remove', { ben: ['to'] }),
  ]),
  T('swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', 'swap', { ben: ['to'], minOut: 'amountOutMin' }),
  T('swapTokensForExactTokens(uint256 amountOut,uint256 amountInMax,address[] path,address to,uint256 deadline)', 'swap', { ben: ['to'] }),
  T('swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', 'swap', { ben: ['to'], minOut: 'amountOutMin' }),
  T('addLiquidity(address tokenA,address tokenB,uint256 amountADesired,uint256 amountBDesired,uint256 amountAMin,uint256 amountBMin,address to,uint256 deadline)', 'liquidity_add', { ben: ['to'] }),
  T('removeLiquidity(address tokenA,address tokenB,uint256 liquidity,uint256 amountAMin,uint256 amountBMin,address to,uint256 deadline)', 'liquidity_remove', { ben: ['to'] }),
  // --- Liquidity Book (Trader Joe v2.x)
  T(`swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,${LB_PATH},address to,uint256 deadline)`, 'swap', { ben: ['to'], minOut: 'amountOutMin' }),
  T(`swapExactNATIVEForTokens(uint256 amountOutMin,${LB_PATH},address to,uint256 deadline)`, 'swap', { ben: ['to'], minOut: 'amountOutMin' }),
  T(`swapExactTokensForNATIVE(uint256 amountIn,uint256 amountOutMinNATIVE,${LB_PATH},address to,uint256 deadline)`, 'swap', { ben: ['to'], minOut: 'amountOutMinNATIVE' }),
  T(`swapTokensForExactTokens(uint256 amountOut,uint256 amountInMax,${LB_PATH},address to,uint256 deadline)`, 'swap', { ben: ['to'] }),
  // --- agrégateurs
  T(`swap(address executor,${SWAP_DESC},bytes permit,bytes data)`, 'swap', { ben: ['desc.dstReceiver'], minOut: 'desc.minReturnAmount' }),
  T('swapExactAmountIn(address executor,(address srcToken,address destToken,uint256 fromAmount,uint256 toAmount,uint256 quotedAmount,bytes32 metadata,address beneficiary) swapData,uint256 partnerAndFee,bytes permit,bytes executorData)', 'swap', { ben: ['swapData.beneficiary'], minOut: 'swapData.toAmount' }),
  T('swap((address inputToken,uint256 inputAmount,address inputReceiver,address outputToken,uint256 outputQuote,uint256 outputMin,address outputReceiver) tokenInfo,bytes pathDefinition,address executor,uint32 referralCode)', 'swap', { ben: ['tokenInfo.outputReceiver'], minOut: 'tokenInfo.outputMin' }),
  // --- Uniswap V3 SwapRouter02 (appels internes d'un multicall)
  T('exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)', 'swap', { ben: ['params.recipient'], minOut: 'params.amountOutMinimum' }),
  T('exactInput((bytes path,address recipient,uint256 amountIn,uint256 amountOutMinimum) params)', 'swap', { ben: ['params.recipient'], minOut: 'params.amountOutMinimum' }),
  T('unwrapWETH9(uint256 amountMinimum,address recipient)', 'swap', { ben: ['recipient'] }),
  T('sweepToken(address token,uint256 amountMinimum,address recipient)', 'swap', { ben: ['recipient'] }),
  T('refundETH()', 'misc'),
  // --- prêt (Aave V3 et gateway, Compound/Benqi)
  T('supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)', 'deposit', { ben: ['onBehalfOf'], spend: ['asset', 'amount'] }),
  T('withdraw(address asset,uint256 amount,address to)', 'withdraw', { ben: ['to'] }),
  T('borrow(address asset,uint256 amount,uint256 interestRateMode,uint16 referralCode,address onBehalfOf)', 'borrow', { ben: ['onBehalfOf'] }),
  T('repay(address asset,uint256 amount,uint256 interestRateMode,address onBehalfOf)', 'repay', { ben: ['onBehalfOf'], spend: ['asset', 'amount'] }),
  T('setUserUseReserveAsCollateral(address asset,bool useAsCollateral)', 'misc'),
  T('depositETH(address pool,address onBehalfOf,uint16 referralCode)', 'deposit', { ben: ['onBehalfOf'] }),
  T('withdrawETH(address pool,uint256 amount,address to)', 'withdraw', { ben: ['to'] }),
  T('repayETH(address pool,uint256 amount,address onBehalfOf)', 'repay', { ben: ['onBehalfOf'] }),
  T('mint()', 'deposit'), T('mint(uint256 mintAmount)', 'deposit'), T('redeem(uint256 redeemTokens)', 'misc'), T('redeem()', 'misc'), T('redeemUnderlying(uint256 redeemAmount)', 'misc'),
  T('repayBorrow(uint256 repayAmount)', 'repay'), T('repayBorrow()', 'repay'), T('enterMarkets(address[] cTokens)', 'misc'),
  // --- staking liquide, jeton enveloppé de pont, gouvernance
  T('submit()', 'stake'), T('requestUnlock(uint256 shareAmount)', 'misc'), T('unwrap(uint256 amount,uint256 chainId)', 'bridge'),
  T('delegate(address delegatee)', 'governance', { ben: ['delegatee'] }),
  // --- ponts
  T('depositForBurn(uint256 amount,uint32 destinationDomain,bytes32 mintRecipient,address burnToken)', 'bridge', { ben32: ['mintRecipient'] }),
  T('swap(uint16 dstChainId,uint256 srcPoolId,uint256 dstPoolId,address refundAddress,uint256 amountLD,uint256 minAmountLD,(uint256 dstGasForCall,uint256 dstNativeAmount,bytes dstNativeAddr) lzTxParams,bytes to,bytes payload)', 'bridge', { benBytes: ['to'] }),
  // --- ERC-4626
  T('deposit(uint256 assets,address receiver)', 'deposit', { ben: ['receiver'] }),
  // --- marché NFT (Seaport) : l'acheteur reçoit toujours l'objet ; aucun paramètre de destination
  ...['fulfillBasicOrder', 'fulfillBasicOrder_efficient_6GL6yc'].map((n) => T(`${n}((address considerationToken,uint256 considerationIdentifier,uint256 considerationAmount,address offerer,address zone,address offerToken,uint256 offerIdentifier,uint256 offerAmount,uint8 basicOrderType,uint256 startTime,uint256 endTime,bytes32 zoneHash,uint256 salt,bytes32 offererConduitKey,bytes32 fulfillerConduitKey,uint256 totalOriginalAdditionalRecipients,(uint256 amount,address recipient)[] additionalRecipients,bytes signature) parameters)`, 'purchase')),
];
const BY_SEL = new Map(); for (const e of TABLE) { if (!BY_SEL.has(e.selector)) BY_SEL.set(e.selector, e); }
const MULTICALL = [T('multicall(uint256 deadline,bytes[] data)', 'multicall'), T('multicall(bytes[] data)', 'multicall')];
const MC_BY_SEL = new Map(MULTICALL.map((e) => [e.selector, e]));

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const hexAddr = (b32) => '0x' + String(b32).replace(/^0x/, '').slice(-40).toLowerCase();

// Décode un appel (to, data) ; retourne null si inconnu / mal formé / non de confiance, sinon { name, kind, severe, beneficiaries:[addr], minOutZero }.
export function decodeLibraryCall(call, ctx, depth = 0) {
  const data = String(call.data ?? call.input ?? '0x').toLowerCase();
  if (data.length < 10 || depth > 3) return null;
  const sel = data.slice(0, 10);
  const mc = MC_BY_SEL.get(sel);
  if (mc) {
    let args; try { args = decodeParams(mc.params, '0x' + data.slice(10)); } catch { return null; }
    const inner = args.data; if (!Array.isArray(inner) || !inner.length || inner.length > 32) return null;
    const out = { name: 'multicall', kind: 'multicall', severe: false, beneficiaries: [], minOutZero: false, inner: [] };
    for (const d of inner) {
      const r = decodeLibraryCall({ ...call, data: d }, ctx, depth + 1);
      if (!r) return null;                                              // un sous-appel inconnu : le tout reste opaque
      out.beneficiaries.push(...r.beneficiaries); out.minOutZero = out.minOutZero || r.minOutZero; out.severe = out.severe || r.severe; out.inner.push(r.name); (out.spent ||= []).push(...(r.spent || []));
    }
    return out;
  }
  const e = BY_SEL.get(sel); if (!e) return null;
  let args; try { args = decodeParams(e.params, '0x' + data.slice(10)); } catch { return null; }
  const beneficiaries = [];
  for (const p of e.ben || []) { const v = get(args, p); if (typeof v !== 'string') return null; beneficiaries.push(lc(v)); }
  for (const p of e.ben32 || []) { const v = get(args, p); if (typeof v !== 'string') return null; beneficiaries.push(hexAddr(v)); }
  for (const p of e.benBytes || []) { const v = get(args, p); if (typeof v !== 'string' || v.length !== 42) return null; beneficiaries.push(lc(v)); } // adresse de destination en bytes (20 octets) ; autre longueur : non décodé
  let minOutZero = false;
  if (e.minOut) { const v = get(args, e.minOut); if (typeof v === 'bigint') minOutZero = v === 0n; }
  // constantes de routeur : 0x…01 = l'appelant (msg.sender), 0x…02 = le routeur lui-même (étape intermédiaire d'un lot)
  const ONE = '0x' + '0'.repeat(39) + '1', TWO = '0x' + '0'.repeat(39) + '2';
  const resolved = beneficiaries.map((b) => (b === ONE ? lc(ctx.from) : b === TWO ? lc(call.to) : b));
  const spent = [];
  if (e.spend) { const t = get(args, e.spend[0]), a = get(args, e.spend[1]); if (typeof t === 'string' && typeof a === 'bigint') spent.push({ token: lc(t), amountRaw: a }); }
  return { name: e.name, kind: e.kind, severe: SEVERE.has(e.kind), beneficiaries: resolved, minOutZero, spent };
}
export const LIBRARY_SELECTORS = new Set([...BY_SEL.keys(), ...MC_BY_SEL.keys()]);

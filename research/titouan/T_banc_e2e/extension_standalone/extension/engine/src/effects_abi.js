// F34 : extraction d'EFFET par ABI publique, GÉNÉRIQUE (aucune adresse de contrat, aucun identifiant de cas).
// Les sélecteurs sont CALCULÉS (keccak) depuis des signatures ABI publiques (source par entrée : champ `src`).
// Principe : une fonction n'est « lue » que si TOUS les paramètres de type adresse qui désignent un bénéficiaire (rôle `ben`) sont
// l'utilisateur lui-même (ou une constante de routeur qui le désigne). Si un bénéficiaire est un tiers, la fonction n'est PAS lue :
// l'appel reste opaque (« je n'ai pas pu vérifier »). Un appel qui joint de la valeur native n'est jamais lu (voir extractAbiEffect). Un appel lu n'est jamais vert : niveau info « effet lu, contrat non vérifié ».
// Cette extraction ne dit rien de ce que fait réellement un contrat inconnu : elle dit ce que l'APPEL déclare.
import { parseSig, decodeParams } from './abi.js';
import { lc } from './util.js';
import { decodeLibraryCall } from './protocols_extra.js';

const OC = 'openchain.xyz signature-database/v1/lookup (2026-10-11)';
// kind (seuls les types qui n'ENGAGENT PAS de nouveaux fonds de l'utilisateur vers le contrat, ou qui rendent le produit à l'utilisateur dans le même appel, sont lus) : swap | claim | retrieve | mint
// NON lus, volontairement (ils engagent des fonds dans un contrat non vérifié ; le jumeau malveillant a le même calldata, mesuré sur V2_DEV et attacks_public) : dépôt, staking, pont, achat de NFT, mint payant.
// ben : chemins des paramètres adresse qui reçoivent le produit ; benZero : l'adresse nulle désigne l'appelant (Seaport)
// minOut : chemin du montant minimal reçu (swap) ; un minimum nul garde l'opacité (aucun garde-fou de prix)
const E = (sig, kind, extra = {}) => ({ kind, ben: [], ...extra, ...parseSig(sig) });
const TABLE = [
  // --- Uniswap V3 SwapRouter (ISwapRouter, v3-periphery) et variantes de même forme (troisième champ = frais, pas d'écart ou adresse de fabrique)
  E('exactInputSingle((address tokenIn,address tokenOut,int24 tickSpacing,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)', 'swap', { ben: ['params.recipient'], minOut: 'params.amountOutMinimum', src: OC + ' 0xa026383e' }),
  E('exactInputSingle((address tokenIn,address tokenOut,address deployer,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 limitSqrtPrice) params)', 'swap', { ben: ['params.recipient'], minOut: 'params.amountOutMinimum', src: OC + ' 0x1679c792' }),
  E('exactOutputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountOut,uint256 amountInMaximum,uint160 sqrtPriceLimitX96) params)', 'swap', { ben: ['params.recipient'], src: 'Uniswap v3-periphery ISwapRouter ; ' + OC }),
  E('exactOutputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountOut,uint256 amountInMaximum,uint160 sqrtPriceLimitX96) params)', 'swap', { ben: ['params.recipient'], src: 'Uniswap SwapRouter02 IV3SwapRouter ; ' + OC + ' 0x5023b4df' }),
  E('exactOutputSingle((address tokenIn,address tokenOut,int24 tickSpacing,address recipient,uint256 deadline,uint256 amountOut,uint256 amountInMaximum,uint160 sqrtPriceLimitX96) params)', 'swap', { ben: ['params.recipient'], src: OC + ' 0xc714e838' }),
  E('exactOutputSingle((address tokenIn,address tokenOut,address deployer,address recipient,uint256 deadline,uint256 amountOut,uint256 amountInMaximum,uint160 limitSqrtPrice) params)', 'swap', { ben: ['params.recipient'], src: OC + ' 0x1764babc' }),
  E('exactInput((bytes path,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum) params)', 'swap', { ben: ['params.recipient'], minOut: 'params.amountOutMinimum', src: 'Uniswap v3-periphery ISwapRouter' }),
  E('exactOutput((bytes path,address recipient,uint256 deadline,uint256 amountOut,uint256 amountInMaximum) params)', 'swap', { ben: ['params.recipient'], src: 'Uniswap v3-periphery ISwapRouter' }),
  // --- routeurs de style V2 avec un paramètre final de parrainage (même rôle de `to`)
  E('swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline,address referrer)', 'swap', { ben: ['to'], minOut: 'amountOutMin', src: OC + ' 0x3d0e3ec5' }),
  // --- agrégateur 1inch (AggregationRouter) sans champ de permis
  E('swap(address executor,(address srcToken,address dstToken,address srcReceiver,address dstReceiver,uint256 amount,uint256 minReturnAmount,uint256 flags) desc,bytes data)', 'swap', { ben: ['desc.dstReceiver'], minOut: 'desc.minReturnAmount', src: OC + ' 0x07ed2379 ; 1inch AggregationRouter docs' }),
  // --- 0x ExchangeProxy : le produit va au preneur (appelant) par construction
  E('transformERC20(address inputToken,address outputToken,uint256 inputTokenAmount,uint256 minOutputTokenAmount,(uint32 deploymentNonce,bytes data)[] transformations)', 'swap', { minOut: 'minOutputTokenAmount', src: OC + ' 0x415565b0 ; 0x protocol docs (ExchangeProxy)' }),
  // --- ERC-4626 (EIP-4626), retraits seulement : receiver et owner doivent être l'utilisateur
  E('withdraw(uint256 assets,address receiver,address owner)', 'retrieve', { ben: ['receiver', 'owner'], src: 'EIP-4626' }),
  E('redeem(uint256 shares,address receiver,address owner)', 'retrieve', { ben: ['receiver', 'owner'], src: 'EIP-4626' }),
  // --- Synthetix StakingRewards (ABI publique, copiée par de très nombreux contrats de staking), retrait et récompenses : aucun paramètre adresse
  E('withdraw(uint256 amount)', 'retrieve', { src: 'Synthetix StakingRewards' }),
  E('getReward()', 'claim', { src: 'Synthetix StakingRewards' }),
  E('exit()', 'claim', { src: 'Synthetix StakingRewards' }),
  E('claim()', 'claim', { src: 'convention de nommage répandue ; ' + OC }),
  E('harvest()', 'claim', { src: 'convention de nommage répandue (MasterChef-like)' }),
  // --- jeton : frappe vers une adresse
  E('mint(address to,uint256 amount)', 'mint', { ben: ['to'], src: OC + ' 0x40c10f19' }),
];
const BY_SEL = new Map(); for (const e of TABLE) if (!BY_SEL.has(e.selector)) BY_SEL.set(e.selector, e);
const MC = [parseSig('multicall(bytes[] data)'), parseSig('multicall(uint256 deadline,bytes[] data)'), parseSig('multicall(bytes32 previousBlockhash,bytes[] data)')];
const MC_BY = new Map(MC.map((e) => [e.selector, e]));
const get = (o, p) => p.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);
const ONE = '0x' + '0'.repeat(39) + '1';
const LIB_KINDS = new Set(['swap', 'withdraw', 'liquidity_remove']); // types de protocols_extra.mjs lus pour une cible quelconque (les autres exigent une cible de confiance, voir F14)

// Retourne null (non lu) ou { name, kind, ok }. `ok` = tous les bénéficiaires sont l'utilisateur et aucun minimum nul.
function readCall(call, ctx, depth) {
  const data = String(call.data ?? call.input ?? '0x').toLowerCase();
  if (data.length < 10 || depth > 3) return null;
  const sel = data.slice(0, 10), self = lc(ctx.from);
  const mc = MC_BY.get(sel);
  if (mc) {
    let args; try { args = decodeParams(mc.params, '0x' + data.slice(10)); } catch { return null; }
    const inner = args.data; if (!Array.isArray(inner) || !inner.length || inner.length > 32) return null;
    const names = [];
    for (const d of inner) {
      const r = readCall({ ...call, data: d }, ctx, depth + 1);
      if (!r || !r.ok) return null;            // un sous-appel non lu : le lot entier reste opaque
      names.push(r.name);
    }
    return { name: 'multicall[' + names.join(',') + ']', kind: 'multicall', ok: true };
  }
  const e = BY_SEL.get(sel);
  if (e) {
    let args; try { args = decodeParams(e.params, '0x' + data.slice(10)); } catch { return null; }
    for (const p of e.ben) {
      const v = get(args, p); if (typeof v !== 'string') return null;
      const a = lc(v);
      if (!(a === self || a === ONE)) return { name: e.name, kind: e.kind, ok: false };
    }
    if (e.minOut) { const m = get(args, e.minOut); if (typeof m !== 'bigint' || m === 0n) return { name: e.name, kind: e.kind, ok: false }; }
    return { name: e.name, kind: e.kind, ok: true };
  }
  const r = decodeLibraryCall(call, ctx);
  if (r && LIB_KINDS.has(r.kind)) return { name: r.name, kind: r.kind, ok: r.beneficiaries.every((b) => b === self) && !r.minOutZero };
  return null;
}

// Lecture d'un appel racine. Retourne null (reste opaque) ou { name, kind, value }.
export function extractAbiEffect(tx, ctx) {
  if (!tx || !tx.to) return null;
  const value = (() => { try { return BigInt(tx.value ?? 0); } catch { return 0n; } })();
  // Règle de sûreté mesurée : payer un contrat NON vérifié ne se lit pas dans l'appel (attacks_public P-A09-M1 : mint payant sur un contrat jeune et modifiable,
  // identique par le calldata à un mint légitime). Toute valeur native jointe empêche la lecture ; seul un protocole de la liste connue (F5/F14/F18) lève l'opacité d'un appel payant.
  if (value > 0n) return null;
  const r = readCall({ to: tx.to, data: tx.data ?? tx.input }, ctx, 0);
  if (!r || !r.ok) return null;
  return { name: r.name, kind: r.kind, value: value.toString() };
}
export const isMulticallSelector = (sel) => MC_BY.has(String(sel || '').toLowerCase());
export const ABI_EFFECT_SELECTORS = new Set([...BY_SEL.keys(), ...MC_BY.keys()]);
export const ABI_EFFECT_TABLE = TABLE.map(({ name, kind, canon, selector, src }) => ({ name, kind, canon, selector, src }));

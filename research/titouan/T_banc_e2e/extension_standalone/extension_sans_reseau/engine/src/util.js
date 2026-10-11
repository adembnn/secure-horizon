import { ADDR } from './registry.js';

export const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
export const isAddr = (a) => typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a);
export const UNLIMITED_MIN = 1n << 128n; // seuil "illimité" pratique : >= 2^128 (aucun supply réel n'approche)
const SPECIAL_MAX = new Set([(1n << 160n) - 1n, (1n << 96n) - 1n, (1n << 64n) - 1n]);
export const isUnlimited = (v) => typeof v === 'bigint' && (v >= UNLIMITED_MIN || SPECIAL_MAX.has(v));

// Tokens connus (décimales) : Ethereum + Avalanche C-Chain. Surchargeable via ctx.tokenMeta.
export const DEFAULT_TOKENS = {
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6, stable: true },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6, stable: true },
  '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: 'DAI', decimals: 18, stable: true },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: 'WETH', decimals: 18 },
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { symbol: 'WBTC', decimals: 8 },
  '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': { symbol: 'USDC', decimals: 6, stable: true },
  '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7': { symbol: 'USDt', decimals: 6, stable: true },
  '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7': { symbol: 'WAVAX', decimals: 18 },
  native: { symbol: 'NATIVE', decimals: 18 },
};
export function fmtUnits(v, decimals) {
  if (decimals == null) return v.toString();
  const s = v.toString().padStart(decimals + 1, '0');
  const ip = s.slice(0, s.length - decimals), fp = s.slice(s.length - decimals).replace(/0+$/, '');
  return fp ? `${ip}.${fp}` : ip;
}
export function tokenInfo(ctx, token) {
  const k = lc(token);
  return (ctx.tokenMeta && ctx.tokenMeta[k]) || DEFAULT_TOKENS[k] || {};
}
export function resolveRecipient(ctx, a, routerAddr) {
  const x = lc(a);
  if (x === ADDR.UR_MSG_SENDER) return lc(ctx.from);
  if (x === ADDR.UR_ADDRESS_THIS) return lc(routerAddr);
  return x;
}
export const strip0x = (h) => (h.startsWith('0x') ? h.slice(2) : h);
export const bytesLen = (hex) => (strip0x(hex).length >> 1);

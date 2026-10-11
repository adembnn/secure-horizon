import { call, encodeParams } from '../src/abi_encode.mjs';
import { analyzeTransaction } from '../src/engine.mjs';
import { ADDR } from '../src/registry.mjs';

export const USER = '0x1111111111111111111111111111111111111111';
export const OTHER = '0x2222222222222222222222222222222222222222';
export const ATTACKER = '0xdead00000000000000000000000000000000beef';
export const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
export const DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
export const USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7';
export const NFT = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d';
export const SAFE = '0x5afe5afe5afe5afe5afe5afe5afe5afe5afe5afe';
export const ROUTER = '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad';
export const MAXU = (1n << 256n) - 1n;
export const NOW = 1_800_000_000;
export const CTX = { chainId: 1, from: USER, now: NOW, knownSpenders: [ADDR.PERMIT2, ROUTER] };

export const tx = (to, data, value = 0n, extra = {}) => ({ from: USER, to, input: data, value: '0x' + BigInt(value).toString(16), type: '0x2', ...extra });
export const an = (to, data, value = 0n, ctx = {}, opts = {}, extra = {}) => analyzeTransaction(tx(to, data, value, extra), { ...CTX, ...ctx }, opts);
export const codes = (eff) => eff.risk_flags.map((f) => f.code);
export const has = (eff, code) => eff.risk_flags.some((f) => f.code === code);
export { call, encodeParams };
export const P2D = (token, amount, exp = NOW + 86400, nonce = 0) => [token, amount, exp, nonce];

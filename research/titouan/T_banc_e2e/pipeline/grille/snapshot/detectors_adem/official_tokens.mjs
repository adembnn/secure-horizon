// Public per-chain registry of reference token contracts (issuer / chain documentation, NOT the measurement set):
//  - Ethereum (1)        : Circle USDC, Tether USDT, MakerDAO DAI, canonical WETH9, WBTC.
//  - Avalanche C (43114) : Circle native USDC, Tether native USDt, Avalanche Bridge USDC.e / USDT.e / WETH.e / DAI.e / BTC.b, WAVAX.
//  - Fuji (43113)        : Circle testnet USDC, WAVAX.
// A token whose on-chain symbol belongs to one of these families but whose address is not one of the family's
// contracts on that chain is a counterfeit (fake USDT/USDC airdrops, poisoning with fake-token transfers).
export const OFFICIAL = {
  1: {
    USDC: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
    USDT: ['0xdac17f958d2ee523a2206206994597c13d831ec7'],
    DAI: ['0x6b175474e89094c44da98b954eedeac495271d0f'],
    WETH: ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'],
    WBTC: ['0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'],
  },
  43114: {
    USDC: ['0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'],
    USDT: ['0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', '0xc7198437980c041c805a1edcba50c1ce5db95118'],
    WAVAX: ['0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'],
    WETH: ['0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab'],
    DAI: ['0xd586e7f844cea2f87f50152665bcbc2c279d8d70'],
    BTC: ['0x152b9d0fdc40c096757f570a51e494bd4b943e50'],
  },
  43113: {
    USDC: ['0x5425890298aed601595a70ab815c96711a31bc65'],
    WAVAX: ['0xd00ae08403b9bbb9124bb305c09058e32c39a48c'],
  },
};
// symbol variants -> family (bridged suffixes and casing used by issuers)
export function familyOf(symbol) {
  const s = String(symbol || '').trim().toUpperCase().replace(/\s+/g, '');
  if (/^USDC(\.E|E)?$/.test(s)) return 'USDC';
  if (/^USDT(\.E|E)?$/.test(s) || s === 'USD₮') return 'USDT';
  if (/^DAI(\.E)?$/.test(s)) return 'DAI';
  if (/^WAVAX$/.test(s)) return 'WAVAX';
  if (/^WETH(\.E)?$/.test(s)) return 'WETH';
  if (/^(WBTC|BTC\.B)$/.test(s)) return s === 'WBTC' ? 'WBTC' : 'BTC';
  return null;
}

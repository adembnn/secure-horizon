import * as K from '../engine/src/keccak.mjs';
const k = K.keccak256 || K.keccak || K.default;
const sel = (s) => { const h = k(typeof s === 'string' ? new TextEncoder().encode(s) : s); const hex = typeof h === 'string' ? h.replace(/^0x/, '') : Buffer.from(h).toString('hex'); return '0x' + hex.slice(0, 8); };
const sigs = [];
for (const N of ['ETH', 'AVAX']) for (const fee of ['', 'SupportingFeeOnTransferTokens']) {
  sigs.push(`swapExactTokensFor${N}${fee}(uint256,uint256,address[],address,uint256)`, `swapExact${N}ForTokens${fee}(uint256,address[],address,uint256)`);
}
for (const fee of ['', 'SupportingFeeOnTransferTokens']) sigs.push(`swapExactTokensForTokens${fee}(uint256,uint256,address[],address,uint256)`);
sigs.push('swapTokensForExactTokens(uint256,uint256,address[],address,uint256)');
for (const N of ['ETH', 'AVAX']) sigs.push(`swapTokensForExact${N}(uint256,uint256,address[],address,uint256)`, `swap${N}ForExactTokens(uint256,address[],address,uint256)`);
sigs.push('exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))', 'exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))',
  'exactOutputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))', 'exactOutputSingle((address,address,uint24,address,uint256,uint256,uint160))',
  'exactInput((bytes,address,uint256,uint256,uint256))', 'exactInput((bytes,address,uint256,uint256))', 'multicall(bytes[])', 'multicall(uint256,bytes[])', 'multicall(bytes32,bytes[])',
  'unwrapWETH9(uint256,address)', 'unwrapWETH9(uint256)', 'sweepToken(address,uint256,address)', 'sweepToken(address,uint256)', 'refundETH()', 'approve(address,uint256)', 'transfer(address,uint256)', 'setApprovalForAll(address,bool)', 'increaseAllowance(address,uint256)');
for (const s of sigs) console.log(sel(s), s);

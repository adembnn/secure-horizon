// Sonde : vérifie que le harnais atteint bien le décideur réel (quelques cas connus).
import { essai, court, tx, call, USDC, ROUTER, ME, FRIEND, u, MAX, CTX, WAVAX, OTHER } from './harnais.mjs';
const A = (s, m) => tx(USDC, call('approve(address spender,uint256 amount)', [s, m]));
console.log('1', court(await essai({ req: A(ROUTER, u(50)), text: 'échanger 50 USDC contre AVAX' })));
console.log('2', court(await essai({ req: A(ROUTER, MAX), text: 'échanger 50 USDC contre AVAX' })));
console.log('3', court(await essai({ req: tx(USDC, call('transfer(address to,uint256 amount)', [FRIEND, u(20)])), text: 'payer 20 USDC à ' + FRIEND })));
const swap = (to, min) => tx(ROUTER, call('swapExactTokensForAVAX(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [u(50), min, [USDC, WAVAX], to, 1791000000n]));
console.log('4', court(await essai({ req: swap(ME, 10n ** 18n), text: 'échanger 50 USDC contre AVAX' })));
console.log('5', court(await essai({ req: swap(ME, 10n ** 18n), text: 'échanger 50 USDC contre AVAX', contexte: CTX })));
console.log('6', court(await essai({ req: swap(OTHER, 10n ** 18n), text: 'échanger 50 USDC contre AVAX', contexte: CTX })));
console.log('7', court(await essai({ req: swap(ME, 0n), text: 'échanger 50 USDC contre AVAX', contexte: CTX })));

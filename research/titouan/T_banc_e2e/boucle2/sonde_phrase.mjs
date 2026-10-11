// boucle2 : montre ce que le produit lit dans une phrase (mots-clés + extraction par code).  node sonde_phrase.mjs ["phrase" ...]
import { extractFields as x, amountIsSure as s, keywordClassify as k } from '../extension/intent_text.js';
const A = '0x' + 'b2'.repeat(20);
const D = ['échanger 50 USDC contre AVAX', 'swap 1,500 USDC for AVAX', 'échanger 1 500 USDT contre ETH', 'échanger 12,5 USDC contre AVAX', 'échanger 50 dollars contre AVAX', 'swap 50 $ for ETH', 'trade 50 usd for AVAX',
  'échanger cinquante USDC contre AVAX', 'échanger deux cents USDT contre ETH', 'échanger 50 USDC contre au moins 1,8 AVAX', 'acheter 0,5 WETH avec des USDC', 'Acheter pour 40 USD de WAVAX', 'vendre mon NFT numéro 12 pour 2 AVAX',
  'acheter le NFT 77 pour 0,5 WAVAX', 'faire une offre de 0,5 WETH sur le NFT 12', 'payer 20 USDC à ' + A, 'autoriser Uniswap à dépenser 75 USDC', 'approve 20 USDC for the router', 'vendre 20 USDC pour avoir du AVAX', 'sell my NFT #5 for 1 ETH',
  'mettre en vente mon NFT 33 à 2 AVAX', 'payer $50 à Paul', 'donner un coup de main à un ami', 'me connecter', 'quatre-vingt-dix USDC contre ETH', 'two hundred and fifty USDC to ETH'];
for (const t of (process.argv.length > 2 ? process.argv.slice(2) : D)) { const r = await k(t); console.log(JSON.stringify(t).slice(0, 50).padEnd(50), String(r.kind).padEnd(24), JSON.stringify(x(t)), s(t) ? 'sûr' : ''); }

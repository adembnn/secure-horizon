// Essais par dimension d'intention. Pour chaque dimension : une demande CONFORME à la phrase, et une demande qui respecte la phrase
// mais trahit SEULEMENT cette dimension. Toutes les demandes sont construites par code (aucun jeu de cas lu).
// Chaque paire passe par le décideur réel (harnais.mjs), avec les deux moteurs réels : 'embarque' (build autonome livré) et 'serveur'.
// Sortie : sorties/dimensions.json et sorties/dimensions.txt.   Usage : node dimensions.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { essai, court, tx, typed, call, hex, u, MAX, CTX, ME, OTHER, FRIEND, ROUTER, USDC, USDT, WAVAX, FAKE, NFT, PERMIT2, CHAIN } from './harnais.mjs';

const NOW = 1760000000;            // l'horloge du harnais (secondes)
const SOON = BigInt(NOW + 1200);   // dans 20 minutes
const FAR = BigInt(NOW + 10 * 365 * 86400); // dans 10 ans
const MAX48 = 2n ** 48n - 1n, MAX160 = 2n ** 160n - 1n;
const AVAX = (n) => u(n, 18);
const SEAPORT = '0x0000000000000068f116a894984e2db1123eb395';
const b32 = (a) => '0x' + a.slice(2).padStart(64, '0');

// ---- fabriques de demandes
const approve = (token, spender, amount, value) => tx(token, call('approve(address spender,uint256 amount)', [spender, amount]), value);
const increase = (token, spender, amount) => tx(token, call('increaseAllowance(address spender,uint256 addedValue)', [spender, amount]));
const transfer = (token, to, amount, value, extra) => tx(token, call('transfer(address to,uint256 amount)', [to, amount]), value, extra);
const swapV2 = ({ amountIn = u(50), min = AVAX(1.8), path = [USDC, WAVAX], to = ME, deadline = SOON, router = ROUTER } = {}) =>
  tx(router, call('swapExactTokensForAVAX(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [amountIn, min, path, to, deadline]));
const swapV2tok = ({ amountIn = u(50), min = AVAX(1.8), path = [USDC, WAVAX], to = ME, deadline = SOON } = {}) =>
  tx(ROUTER, call('swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [amountIn, min, path, to, deadline]));
const swapNativeIn = ({ value = AVAX(50), min = u(1000), to = ME } = {}) =>
  tx(ROUTER, call('swapExactAVAXForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)', [min, [WAVAX, USDC], to, SOON]), value);
const v3single = ({ recipient = ME, min = AVAX(1.8), amountIn = u(50) } = {}) => call('exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)', [[USDC, WAVAX, 500, recipient, amountIn, min, 0]]);
const multicall = (inner) => tx(ROUTER, call('multicall(uint256 deadline,bytes[] data)', [SOON, inner]));
const unwrap = (recipient, min = AVAX(1.8)) => call('unwrapWETH9(uint256 amountMinimum,address recipient)', [min, recipient]);
const sweep = (token, recipient) => call('sweepToken(address token,uint256 amountMinimum,address recipient)', [token, 0n, recipient]);
const batch = (calls, extra) => ({ method: 'wallet_sendCalls', params: [Object.assign({ version: '2.0.0', from: ME, chainId: CHAIN, atomicRequired: true, calls: calls.map((r) => { const t = r.params[0]; return Object.assign({ to: t.to, data: t.data }, t.value ? { value: t.value } : {}); }) }, extra || {})] });
const D712 = [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];
const permit = ({ spender = ROUTER, value = u(50), deadline = SOON, chainId = 43114, token = USDC } = {}) => typed({
  types: { EIP712Domain: D712, Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId, verifyingContract: token },
  message: { owner: ME, spender, value: value.toString(), nonce: '0', deadline: deadline.toString() } });
const D712P2 = [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];
const permit2 = ({ spender = ROUTER, amount = u(50), expiration = SOON, sigDeadline = SOON, token = USDC, chainId = 43114 } = {}) => typed({
  types: { EIP712Domain: D712P2, PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }],
    PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] },
  primaryType: 'PermitSingle', domain: { name: 'Permit2', chainId, verifyingContract: PERMIT2 },
  message: { details: { token, amount: amount.toString(), expiration: expiration.toString(), nonce: '0' }, spender, sigDeadline: sigDeadline.toString() } });
const permit2transfer = ({ spender = ROUTER, amount = u(50), deadline = SOON, token = USDC } = {}) => typed({
  types: { EIP712Domain: D712P2, PermitTransferFrom: [{ name: 'permitted', type: 'TokenPermissions' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }],
    TokenPermissions: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }] },
  primaryType: 'PermitTransferFrom', domain: { name: 'Permit2', chainId: 43114, verifyingContract: PERMIT2 },
  message: { permitted: { token, amount: amount.toString() }, spender, nonce: '1', deadline: deadline.toString() } });
// Ordre de vente Seaport : j'offre le NFT n° 12, je reçois `price` en monnaie du réseau sur `recipient`, valable jusqu'à `endTime`.
const seaport = ({ price = AVAX(2), recipient = ME, endTime = BigInt(NOW + 7 * 86400), extraOffer = null, itemType = 2, id = 12n } = {}) => typed({
  types: { EIP712Domain: D712,
    OrderComponents: [{ name: 'offerer', type: 'address' }, { name: 'zone', type: 'address' }, { name: 'offer', type: 'OfferItem[]' }, { name: 'consideration', type: 'ConsiderationItem[]' }, { name: 'orderType', type: 'uint8' },
      { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }, { name: 'zoneHash', type: 'bytes32' }, { name: 'salt', type: 'uint256' }, { name: 'conduitKey', type: 'bytes32' }, { name: 'counter', type: 'uint256' }],
    OfferItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }],
    ConsiderationItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }, { name: 'recipient', type: 'address' }] },
  primaryType: 'OrderComponents', domain: { name: 'Seaport', version: '1.6', chainId: 43114, verifyingContract: SEAPORT },
  message: { offerer: ME, zone: '0x' + '00'.repeat(20),
    offer: [{ itemType, token: NFT, identifierOrCriteria: id.toString(), startAmount: '1', endAmount: '1' }].concat(extraOffer ? [extraOffer] : []),
    consideration: [{ itemType: 0, token: '0x' + '00'.repeat(20), identifierOrCriteria: '0', startAmount: price.toString(), endAmount: price.toString(), recipient }],
    orderType: 0, startTime: String(NOW), endTime: endTime.toString(), zoneHash: '0x' + '00'.repeat(32), salt: '1', conduitKey: '0x' + '00'.repeat(32), counter: '0' } });
const cctp = ({ amount = u(50), domain = 0, recipient = ME } = {}) => tx(ROUTER, call('depositForBurn(uint256 amount,uint32 destinationDomain,bytes32 mintRecipient,address burnToken)', [amount, domain, b32(recipient), USDC]));
const aaveSupply = (onBehalfOf) => tx(ROUTER, call('supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)', [USDC, u(50), onBehalfOf, 0]));
const aaveWithdraw = (to) => tx(ROUTER, call('withdraw(address asset,uint256 amount,address to)', [USDC, u(50), to]));
const aaveBorrow = (onBehalfOf) => tx(ROUTER, call('borrow(address asset,uint256 amount,uint256 interestRateMode,uint16 referralCode,address onBehalfOf)', [USDC, u(50), 2, 0, onBehalfOf]));

const SWAP = 'échanger 50 USDC contre AVAX';
const SWAPMIN = 'échanger 50 USDC contre au moins 1,8 AVAX';
const PAY = 'payer 20 USDC à ' + FRIEND;
const SELL = 'vendre mon NFT numéro 12 pour 2 AVAX';

// ---- les paires. ctx: true = la personne a déclaré le routeur dans ses réglages (meilleur cas pour "correspond").
const P = [];
const paire = (id, dimension, text, ok, bad, opt = {}) => P.push(Object.assign({ id, dimension, text, ok, bad }, opt));

// A. Ce que la personne écrit
paire('E1a', 'montant du droit accordé (approve)', SWAP, ['approve 50 USDC', approve(USDC, ROUTER, u(50))], ['approve 5 000 USDC', approve(USDC, ROUTER, u(5000))], { ctx: true });
paire('E1b', 'montant échangé (amountIn du routeur)', SWAP, ['swap de 50 USDC', swapV2()], ['swap de 5 000 USDC', swapV2({ amountIn: u(5000), min: AVAX(180) })], { ctx: true });
paire('E1c', 'montant payé (transfer)', PAY, ['transfer 20 USDC', transfer(USDC, FRIEND, u(20))], ['transfer 21 USDC', transfer(USDC, FRIEND, u(21))]);
paire('E2a', 'jeton payé', PAY, ['transfer USDC', transfer(USDC, FRIEND, u(20))], ['transfer 20 USDT', transfer(USDT, FRIEND, u(20))]);
paire('E2b', 'jeton du droit accordé', SWAP, ['approve USDC', approve(USDC, ROUTER, u(50))], ['approve 50 USDT', approve(USDT, ROUTER, u(50))], { ctx: true });
paire('E3', 'destinataire d’un paiement', PAY, ['vers l’adresse écrite', transfer(USDC, FRIEND, u(20))], ['vers une autre adresse', transfer(USDC, OTHER, u(20))]);
paire('E4', 'contrepartie de l’échange (« contre AVAX »)', SWAP, ['chemin USDC → AVAX', swapV2tok()], ['chemin USDC → jeton inconnu', swapV2tok({ path: [USDC, FAKE] })], { ctx: true });
paire('E5a', 'montant minimal reçu, non écrit', SWAP, ['minimum 1,8 AVAX', swapV2()], ['minimum 0', swapV2({ min: 0n })], { ctx: true });
paire('E5b', 'montant minimal reçu, ÉCRIT (« au moins 1,8 AVAX »)', SWAPMIN, ['minimum 1,8 AVAX', swapV2()], ['minimum 0,000001 AVAX', swapV2({ min: AVAX(0.000001) })], { ctx: true });
paire('E6a', 'nature de l’opération : écrit échanger, la demande est un simple envoi', SWAP, ['swap', swapV2()], ['transfer 50 USDC vers un tiers', transfer(USDC, OTHER, u(50))], { ctx: true });
paire('E6b', 'sens de l’échange : écrit vendre 50 USDC, la demande vend 50 AVAX', SWAP, ['USDC → AVAX', swapV2()], ['50 AVAX → USDC', swapNativeIn()], { ctx: true });

// B. Les douze défauts de l'hypothèse
paire('D1a', '(1) pas un droit durable : Permit2, expiration', SWAP, ['Permit2 50 USDC, expire dans 20 min', permit2()], ['Permit2 50 USDC, n’expire jamais', permit2({ expiration: MAX48 })], { ctx: true });
paire('D1b', '(1) pas un droit durable : permit EIP-2612, échéance de la signature', SWAP, ['permit 50 USDC, signature valable 20 min', permit()], ['permit 50 USDC, signature valable 10 ans', permit({ deadline: FAR })], { ctx: true });
paire('D1c', '(1) pas un droit durable : Permit2, échéance de la signature (sigDeadline)', SWAP, ['sigDeadline 20 min', permit2()], ['sigDeadline 10 ans', permit2({ sigDeadline: FAR })], { ctx: true });
paire('D2a', '(2) seulement ce montant : approve illimité', SWAP, ['approve 50', approve(USDC, ROUTER, u(50))], ['approve illimité', approve(USDC, ROUTER, MAX)], { ctx: true });
paire('D2b', '(2) seulement ce montant : permit signé illimité', SWAP, ['permit 50', permit()], ['permit illimité', permit({ value: MAX })], { ctx: true });
paire('D2c', '(2) seulement ce montant : Permit2 illimité (uint160 max)', SWAP, ['Permit2 50', permit2()], ['Permit2 max', permit2({ amount: MAX160 })], { ctx: true });
paire('D2d', '(2) seulement ce montant : increaseAllowance s’ajoute à un droit déjà donné', SWAP, ['approve 50 (remplace)', approve(USDC, ROUTER, u(50))], ['increaseAllowance +50 (s’ajoute à l’existant)', increase(USDC, ROUTER, u(50))], { ctx: true });
paire('D3a', '(3) jeton identifié par son adresse : faux jeton, droit', SWAP, ['vrai USDC', approve(USDC, ROUTER, u(50))], ['jeton inconnu, 50 unités', approve(FAKE, ROUTER, u(50))], { ctx: true });
paire('D3b', '(3) jeton identifié par son adresse : faux jeton, paiement', PAY, ['vrai USDC', transfer(USDC, FRIEND, u(20))], ['jeton inconnu', transfer(FAKE, FRIEND, u(20))]);
paire('D4a', '(4) cet objet, pas toute la collection (transaction)', SELL, ['approve du NFT n° 12', approve(NFT, SEAPORT, 12n)], ['setApprovalForAll', tx(NFT, call('setApprovalForAll(address operator,bool approved)', [SEAPORT, true]))]);
paire('D4b', '(4) cet objet, pas un autre ni un deuxième (ordre Seaport)', SELL, ['offre : NFT n° 12', seaport()], ['offre : NFT n° 12 + NFT n° 77', seaport({ extraOffer: { itemType: 2, token: NFT, identifierOrCriteria: '77', startAmount: '1', endAmount: '1' } })]);
paire('D5a', '(5) ce que j’obtiens arrive sur mon compte : routeur V2, `to`', SWAP, ['to = moi', swapV2()], ['to = un tiers', swapV2({ to: OTHER })], { ctx: true });
paire('D5b', '(5) idem, routeur NON déclaré dans les réglages', SWAP, ['to = moi', swapV2()], ['to = un tiers', swapV2({ to: OTHER })]);
paire('D5c', '(5) idem, multicall V3 : recipient de unwrapWETH9', SWAP, ['unwrap vers moi', multicall([v3single({ recipient: '0x' + '00'.repeat(19) + '02' }), unwrap(ME)])], ['unwrap vers un tiers', multicall([v3single({ recipient: '0x' + '00'.repeat(19) + '02' }), unwrap(OTHER)])], { ctx: true });
paire('D5d', '(5) ordre Seaport : le prix est versé à un tiers', SELL, ['2 AVAX pour moi', seaport()], ['2 AVAX pour un tiers', seaport({ recipient: OTHER })]);
paire('D5e', '(5) retrait Aave : `to`', 'retirer 50 USDC de Aave', ['to = moi', aaveWithdraw(ME)], ['to = un tiers', aaveWithdraw(OTHER)], { ctx: true });
paire('D5f', '(5) dépôt Aave : `onBehalfOf` (le dépôt est crédité à un tiers)', 'déposer 50 USDC sur Aave', ['onBehalfOf = moi', aaveSupply(ME)], ['onBehalfOf = un tiers', aaveSupply(OTHER)], { ctx: true });
paire('D6a', '(6) sur ce réseau : permit signé pour une autre chaîne', SWAP, ['domaine chainId 43114', permit()], ['domaine chainId 1 (Ethereum)', permit({ chainId: 1 })], { ctx: true });
paire('D6b', '(6) sur ce réseau : transaction avec un autre chainId', PAY, ['chainId 43114', transfer(USDC, FRIEND, u(20), 0n, { chainId: '0xa86a' })], ['chainId 1', transfer(USDC, FRIEND, u(20), 0n, { chainId: '0x1' })]);
paire('D7', '(7) depuis ce compte : `from` est un autre compte', PAY, ['from = compte actif', transfer(USDC, FRIEND, u(20))], ['from = un autre compte', (() => { const r = transfer(USDC, FRIEND, u(20)); r.params[0].from = OTHER; return r; })()]);
paire('D8a', '(8) rien d’autre dans le lot : un second droit glissé', SWAP, ['lot : approve 50 + swap', batch([approve(USDC, ROUTER, u(50)), swapV2()])], ['lot : approve 50 + swap + approve USDT illimité', batch([approve(USDC, ROUTER, u(50)), swapV2(), approve(USDT, OTHER, MAX)])], { ctx: true });
paire('D8b', '(8) rien d’autre dans le lot : un envoi glissé (autre jeton)', SWAP, ['lot : approve 50 + swap', batch([approve(USDC, ROUTER, u(50)), swapV2()])], ['lot : + transfer 300 USDT vers un tiers', batch([approve(USDC, ROUTER, u(50)), swapV2(), transfer(USDT, OTHER, u(300))])], { ctx: true });
paire('D8c', '(8) rien d’autre dans le lot : un sweep glissé dans un multicall', SWAP, ['multicall : swap + unwrap', multicall([v3single({ recipient: '0x' + '00'.repeat(19) + '02' }), unwrap(ME)])], ['multicall : + sweepToken(USDT) vers un tiers', multicall([v3single({ recipient: '0x' + '00'.repeat(19) + '02' }), unwrap(ME), sweep(USDT, OTHER)])], { ctx: true });
paire('D9a', '(9) aucune valeur native en plus : approve + 1 AVAX', SWAP, ['approve seul', approve(USDC, ROUTER, u(50))], ['approve + 1 AVAX joint', approve(USDC, ROUTER, u(50), AVAX(1))], { ctx: true });
paire('D9b', '(9) aucune valeur native en plus : swap de jetons + 3 AVAX', SWAP, ['swap seul', swapV2()], ['swap + 3 AVAX joints', (() => { const r = swapV2(); r.params[0].value = hex(AVAX(3)); return r; })()], { ctx: true });
paire('D9c', '(9) aucune valeur native en plus : paiement + 1 AVAX', PAY, ['transfer seul', transfer(USDC, FRIEND, u(20))], ['transfer + 1 AVAX joint', transfer(USDC, FRIEND, u(20), AVAX(1))]);
paire('D10a', '(10) personne ne prend la main : délégation EIP-7702 dans la transaction', SWAP, ['approve 50', approve(USDC, ROUTER, u(50))], ['approve 50 + authorizationList', (() => { const r = approve(USDC, ROUTER, u(50)); Object.assign(r.params[0], { type: '0x4', authorizationList: [{ chainId: '0x0', address: OTHER, nonce: '0x0' }] }); return r; })()], { ctx: true });
paire('D10b', '(10) personne ne prend la main : changement de propriétaire', SWAP, ['swap', swapV2()], ['transferOwnership(tiers) sur un contrat', tx(ROUTER, call('transferOwnership(address newOwner)', [OTHER]))], { ctx: true });
paire('D10c', '(10) personne ne prend la main : ajout d’un signataire (Safe)', SWAP, ['swap', swapV2()], ['addOwnerWithThreshold(tiers, 1)', tx(ME, call('addOwnerWithThreshold(address owner,uint256 _threshold)', [OTHER, 1]))], { ctx: true });
paire('D10d', '(10) personne ne prend la main : opération de compte abstrait (user operation)', SWAP, ['swap', swapV2()], ['eth_sendUserOperation', { method: 'eth_sendUserOperation', params: [{ sender: ME, nonce: '0x0', callData: '0x', signature: '0x' }, '0x0000000071727De22E5E9d8BAf0edAc6f37da032'] }], { ctx: true });
paire('D11a', '(11) rien de récurrent : permission ERC-7715', SWAP, ['swap', swapV2()], ['wallet_grantPermissions (50 USDC par jour)', { method: 'wallet_grantPermissions', params: [{ chainId: CHAIN, address: ME, expiry: Number(FAR), signer: { type: 'account', data: { address: OTHER } }, permissions: [{ type: 'erc20-token-periodic', data: { tokenAddress: USDC, periodAmount: hex(u(50)), periodDuration: 86400 } }] }] }], { ctx: true });
paire('D12a', '(12) aucun réglage du portefeuille : réseau ajouté avec un RPC étranger', SWAP, ['swap', swapV2()], ['wallet_addEthereumChain (Avalanche, RPC inconnu)', { method: 'wallet_addEthereumChain', params: [{ chainId: '0xa86a', chainName: 'Avalanche C-Chain', nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 }, rpcUrls: ['https://rpc.exemple-inconnu.org'] }] }], { ctx: true });

// C. Ce que l'hypothèse ne nomme pas
paire('M1a', 'à qui le droit est donné : spender = routeur déclaré / adresse quelconque', SWAP, ['spender = routeur déclaré', approve(USDC, ROUTER, u(50))], ['spender = adresse quelconque', approve(USDC, OTHER, u(50))], { ctx: true });
paire('M1b', 'à qui le droit est donné, AUCUN réglage (installation par défaut)', SWAP, ['spender = routeur', approve(USDC, ROUTER, u(50))], ['spender = adresse quelconque', approve(USDC, OTHER, u(50))]);
paire('M1c', 'à qui le droit signé est donné (permit)', SWAP, ['spender = routeur déclaré', permit()], ['spender = adresse quelconque', permit({ spender: OTHER })], { ctx: true });
paire('M2a', 'prix d’une vente : écrit 2 AVAX, l’ordre dit 0,000002 AVAX', SELL, ['2 AVAX', seaport()], ['0,000002 AVAX', seaport({ price: AVAX(0.000002) })]);
paire('M2b', 'prix d’une vente : écrit 2 AVAX, l’ordre dit 1,9 AVAX', SELL, ['2 AVAX', seaport()], ['1,9 AVAX', seaport({ price: AVAX(1.9) })]);
paire('M3', 'durée de validité d’un ordre de vente', SELL, ['valable 7 jours', seaport()], ['valable 10 ans', seaport({ endTime: FAR })]);
paire('M4', 'frais : frais de réseau gonflés (gas × prix)', PAY, ['frais normaux', transfer(USDC, FRIEND, u(20), 0n, { gas: '0x186a0', maxFeePerGas: '0x5d21dba00' })], ['frais ≈ 20 AVAX', transfer(USDC, FRIEND, u(20), 0n, { gas: '0x1312d00', maxFeePerGas: '0xe8d4a51000' })]);
paire('M5', 'pont : adresse d’arrivée', 'envoyer 50 USDC vers Ethereum par le pont', ['arrivée = moi', cctp()], ['arrivée = un tiers', cctp({ recipient: OTHER })], { ctx: true });
paire('M6', 'pont : chaîne d’arrivée (écrit « vers Ethereum »)', 'envoyer 50 USDC vers Ethereum par le pont', ['domaine 0 (Ethereum)', cctp()], ['domaine 6 (Base)', cctp({ domain: 6 })], { ctx: true });
paire('M7', 'signature d’un message illisible', 'me connecter', ['personal_sign d’un texte', { method: 'personal_sign', params: ['0x' + Buffer.from('Bienvenue. Signe pour ouvrir ta session.').toString('hex'), ME] }], ['eth_sign d’une empreinte', { method: 'eth_sign', params: [ME, '0x' + '5c'.repeat(32)] }]);
paire('M8', 'délégation de vote', SWAP, ['swap', swapV2()], ['delegate(tiers)', tx(USDC, call('delegate(address delegatee)', [OTHER]))], { ctx: true });
paire('M9', 'emprunt au nom de quelqu’un / pour quelqu’un', 'emprunter 50 USDC sur Aave', ['onBehalfOf = moi', aaveBorrow(ME)], ['onBehalfOf = un tiers', aaveBorrow(OTHER)], { ctx: true });
paire('M10', 'transfert signé Permit2 (SignatureTransfer) : montant', SWAP, ['50 USDC', permit2transfer()], ['5 000 USDC', permit2transfer({ amount: u(5000) })], { ctx: true });
paire('M11', 'chemin : jeton intermédiaire inconnu', SWAP, ['USDC → AVAX', swapV2tok()], ['USDC → jeton inconnu → AVAX', swapV2tok({ path: [USDC, FAKE, WAVAX] })], { ctx: true });
paire('M12', 'échéance de la transaction d’échange', SWAP, ['échéance 20 min', swapV2()], ['échéance 10 ans', swapV2({ deadline: FAR })], { ctx: true });

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, 'out', 'dim58'), { recursive: true });
const rows = [], lines = [];
for (const p of P) {
  const row = { id: p.id, dimension: p.dimension, phrase: p.text, routeur_declare: !!p.ctx };
  lines.push('', '## ' + p.id + '  ' + p.dimension, 'phrase : « ' + p.text + ' »' + (p.ctx ? '   (routeur déclaré dans les réglages)' : '   (aucun réglage)'));
  for (const moteur of ['serveur']) {
    for (const [k, [label, req]] of [['conforme', p.ok], ['trahit', p.bad]]) {
      let r; try { r = await essai({ req, text: p.text, contexte: p.ctx ? CTX : null, moteur }); } catch (e) { r = { erreur: 'exception : ' + String(e && e.message || e).slice(0, 200) }; }
      row[moteur + '_' + k] = Object.assign({ demande: label }, r);
      lines.push('  [' + moteur + '] ' + k.padEnd(8) + ' ' + label + '  ->  ' + court(r));
    }
  }
  rows.push(row);
}
writeFileSync(join(here, 'out', 'dim58', 'dimensions.json'), JSON.stringify(rows, null, 1));
writeFileSync(join(here, 'out', 'dim58', 'dimensions.txt'), lines.join('\n') + '\n');


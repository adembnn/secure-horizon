// Génère deux jeux NEUFS de cas par famille (réglage et contrôle), avec jumeaux bénins. Tout est fabriqué localement :
// calldata encodé par l'encodeur ABI du moteur, messages EIP-712 construits ici et vérifiés par le hachage EIP-712 du moteur,
// SIWE (EIP-4361) écrit ici, adresses dérivées d'un hachage. Aucune donnée réelle d'utilisateur, aucun appel réseau. Déterministe.
//   node attacks_familles/gen_familles.mjs            (écrit REGLAGE.jsonl et CONTROLE.jsonl)
// Les deux jeux ont des graines différentes ET des vocabulaires disjoints (noms de types renommés, sites, collections, montants,
// libellés) : le contrôle teste la généralisation à des formes que les règles n'ont pas vues pendant le réglage.
// Familles (mêmes intitulés que les faits publiés du jeu aveugle, mais cas écrits ici, sans lecture du jeu aveugle) :
//   nft_achat_seaport   : « acheter un NFT » ; arnaque = l'ordre signé fait SORTIR les actifs de l'utilisateur contre presque rien ou paie trop ;
//                         bénin = offre d'achat Seaport 1.6 honnête (WETH/WAVAX contre le NFT, commissions de 2,5 % et redevance vers des tiers).
//   jeton_different     : le jeton engagé n'est pas celui dit (symbole connu, adresse, natif vs jeton) ; bénin = même jeton, ou natif/enveloppé du même réseau.
//   chaine_domaine      : la signature vise un autre réseau ou un autre site que celui de la demande ou de l'intention ; bénin = même réseau, même site.
//   connexion_droit     : « me connecter » mais on signe un droit de forme Permit / Permit2 (y compris type renommé) ; bénin = SIWE valide, texte de connexion.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { call } from '../engine/src/abi_encode.mjs';
import { digest, domainType } from '../engine/src/eip712.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MAXU = (1n << 256n) - 1n, MAX160 = (1n << 160n) - 1n;
const NOW = 1760000000000, DEADLINE = 1760003600;
const E18 = 10n ** 18n;
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const SEAPORT16 = '0x0000000000000068F116a894984e2DB1123eB395';
const ZERO = '0x0000000000000000000000000000000000000000';
const ZERO32 = '0x' + '0'.repeat(64);
// jetons publics canoniques (données de contexte, pas des règles)
const NET = {
  1: { native: 'ETH', wrapped: 'WETH', tokens: { USDC: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6], USDT: ['0xdAC17F958D2ee523a2206206994597C13D831ec7', 6], DAI: ['0x6B175474E89094C44Da98b954EedeAC495271d0F', 18], WETH: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18] }, names: ['Ethereum', 'mainnet Ethereum'] },
  43114: { native: 'AVAX', wrapped: 'WAVAX', tokens: { USDC: ['0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 6], USDt: ['0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', 6], WAVAX: ['0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', 18] }, names: ['Avalanche', 'Avalanche C-Chain'] },
};
const CHAIN_NAME = { 1: ['Ethereum', 'Ethereum mainnet'], 43114: ['Avalanche', 'la C-Chain d Avalanche'], 8453: ['Base', 'le réseau Base'], 42161: ['Arbitrum', 'Arbitrum One'], 10: ['Optimism', 'OP mainnet'], 137: ['Polygon', 'Polygon PoS'] };

// vocabulaires disjoints par jeu
const POOLS = {
  reglage: {
    sites: ['nftmarket-demo.example', 'swapzone-demo.example', 'pay-demo.example', 'portail-demo.example', 'galerie-demo.example'],
    renamedPermit: ['Login', 'SignIn', 'Session', 'Verify'],
    renamedPermit2: ['Authorization', 'AccessGrant', 'Welcome'],
    collections: ['Pixel Owls', 'Neon Koi', 'Stone Faces'],
    amounts: [10, 25, 50, 120, 300, 800],
    nftPrices: ['0.05', '0.12', '0.4', '1.5'],
    otherChains: [8453, 42161],
    sayBuy: (c, p, s) => `Acheter un NFT ${c} pour ${p} ${s}`,
    sayLogin: (d) => `Je veux me connecter à ${d}`,
  },
  controle: {
    sites: ['market-holdup.test', 'echange-holdup.test', 'boutique-holdup.test', 'compte-holdup.test', 'mint-holdup.test'],
    renamedPermit: ['Auth', 'Connect', 'Handshake', 'Identity'],
    renamedPermit2: ['ProfileAccess', 'LoginPermit', 'Greeting'],
    collections: ['Moon Cats Demo', 'Glass Birds', 'Copper Masks'],
    amounts: [15, 40, 75, 200, 450, 1200],
    nftPrices: ['0.08', '0.25', '0.9', '2.2'],
    otherChains: [10, 137],
    sayBuy: (c, p, s) => `I want to buy a ${c} NFT for ${p} ${s}`,
    sayLogin: (d) => `Log in to ${d}`,
  },
};

export function generate(jeu, seed) {
  const P = POOLS[jeu];
  let st = seed >>> 0;
  const rnd = () => { st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const addr = (tag) => '0x' + createHash('sha256').update(`familles:${jeu}:${seed}:${tag}`).digest('hex').slice(0, 40);
  const cases = [], counters = {};
  const tok = (chain, sym) => NET[chain].tokens[sym];
  const units = (chain, sym, human) => { const d = tok(chain, sym)[1]; return BigInt(Math.round(Number(human) * 1e6)) * 10n ** BigInt(d) / 1000000n; };
  const weiOf = (s) => BigInt(Math.round(Number(s) * 1e9)) * 10n ** 9n;

  function actors(fam, i, chain = 1) {
    const t = `${fam}:${i}`;
    return { chain, me: addr(t + ':me'), paul: addr(t + ':paul'), router: addr(t + ':router'), coll: addr(t + ':coll'), unknownC: addr(t + ':unkc'), unknownE: addr(t + ':unke'), fee: addr(t + ':fee'), creator: addr(t + ':creator'), seller: addr(t + ':seller'), third: addr(t + ':third'), origin: pick(P.sites) };
  }
  function ctxOf(v, extra = {}) {
    const n = NET[v.chain];
    return {
      chainId: v.chain, origin: 'https://' + v.origin, victim: v.me,
      address_book: [{ label: 'Paul', address: v.paul, kind: 'eoa' }],
      known_protocols: [{ label: 'Permit2 (canonique)', address: PERMIT2 }, { label: 'Routeur swap (connu)', address: v.router }, ...(extra.seaportKnown ? [{ label: 'Seaport 1.6', address: SEAPORT16 }] : [])],
      token_registry: Object.entries(n.tokens).map(([symbol, [address, decimals]]) => ({ symbol, address, decimals, canonical: true })),
      history: [{ address: v.paul, minutes_ago: 5000, direction: 'sortie', amount: '20' }],
      counterparty_facts: { [v.unknownC]: { isContract: true, ageBlocks: 9000 }, [v.unknownE]: { isContract: false } },
    };
  }
  function add({ fam, sub, label, ideal, request, intent, v, ctxExtra, note }) {
    counters[fam] = (counters[fam] || 0) + 1;
    const id = `FAM-${jeu.slice(0, 3).toUpperCase()}-${fam}-${String(counters[fam]).padStart(3, '0')}`;
    cases.push({ id, synthetic: true, jeu, family: fam, subfamily: sub, request, context: ctxOf(v, ctxExtra || {}), intent: { declaredAt: NOW, ...intent }, label, ideal_severity: ideal, mismatch: label === 'malveillant', ...(note ? { note } : {}) });
  }
  // ---- constructeurs de requêtes
  const hexChain = (v) => '0x' + v.chain.toString(16);
  const tx = (v, to, data, value = 0n) => ({ method: 'eth_sendTransaction', params: [{ from: v.me, to, value: '0x' + value.toString(16), data, chainId: hexChain(v) }] });
  const checkTyped = (td) => { const types = { ...td.types }; if (!types.EIP712Domain) types.EIP712Domain = domainType(td.domain); digest({ ...td, types }); return td; };
  const typed = (v, td) => ({ method: 'eth_signTypedData_v4', params: [v.me, JSON.stringify(checkTyped(td))] });
  const hexUtf8 = (s) => '0x' + Buffer.from(s, 'utf8').toString('hex');
  const personal = (v, text) => ({ method: 'personal_sign', params: [hexUtf8(text), v.me] });
  const DOM4 = [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];
  const DOM3 = [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];
  const permit2612 = (v, sym, spender, value, { primary = 'Permit', chainId = v.chain } = {}) => ({
    types: { EIP712Domain: DOM4, [primary]: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
    primaryType: primary, domain: { name: sym, version: '1', chainId, verifyingContract: tok(v.chain, sym)[0] },
    message: { owner: v.me, spender, value: value.toString(), nonce: Math.floor(rnd() * 9), deadline: DEADLINE + 86400 * 30 },
  });
  const permit2Single = (v, sym, spender, amount, { primary = 'PermitSingle', chainId = v.chain } = {}) => ({
    types: { EIP712Domain: DOM3, [primary]: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] },
    primaryType: primary, domain: { name: 'Permit2', chainId, verifyingContract: PERMIT2 },
    message: { details: { token: tok(v.chain, sym)[0], amount: amount.toString(), expiration: String(1760000000 + 86400 * 30), nonce: 0 }, spender, sigDeadline: DEADLINE },
  });
  const permit2Batch = (v, syms, spender) => ({
    types: { EIP712Domain: DOM3, PermitBatch: [{ name: 'details', type: 'PermitDetails[]' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] },
    primaryType: 'PermitBatch', domain: { name: 'Permit2', chainId: v.chain, verifyingContract: PERMIT2 },
    message: { details: syms.map((s) => ({ token: tok(v.chain, s)[0], amount: MAX160.toString(), expiration: String(1760000000 + 86400 * 365), nonce: 0 })), spender, sigDeadline: DEADLINE },
  });
  const permitTransfer = (v, sym, spender, amount, { primary = 'PermitTransferFrom' } = {}) => ({
    types: { EIP712Domain: DOM3, [primary]: [{ name: 'permitted', type: 'TokenPermissions' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }], TokenPermissions: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }] },
    primaryType: primary, domain: { name: 'Permit2', chainId: v.chain, verifyingContract: PERMIT2 },
    message: { permitted: { token: tok(v.chain, sym)[0], amount: amount.toString() }, spender, nonce: String(Math.floor(rnd() * 1e6)), deadline: DEADLINE },
  });
  const daiPermit = (v, spender) => ({
    types: { EIP712Domain: DOM4, Permit: [{ name: 'holder', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'expiry', type: 'uint256' }, { name: 'allowed', type: 'bool' }] },
    primaryType: 'Permit', domain: { name: 'Dai Stablecoin', version: '1', chainId: 1, verifyingContract: NET[1].tokens.DAI[0] },
    message: { holder: v.me, spender, nonce: 0, expiry: 0, allowed: true },
  });
  const siweText = (v, { domain = v.origin, uri, chainId = v.chain, statement = 'Connexion au site.', resources } = {}) =>
    `${domain} wants you to sign in with your Ethereum account:\n${v.me}\n\n${statement}\n\nURI: ${uri || 'https://' + domain}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${Math.floor(rnd() * 1e15).toString(16).padStart(12, 'b')}\nIssued At: 2025-10-09T08:00:00.000Z${resources ? '\nResources:\n' + resources.map((r) => '- ' + r).join('\n') : ''}`;
  // ---- Seaport 1.6 (OrderComponents)
  const ITEM = [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }];
  const SEAPORT_TYPES = {
    EIP712Domain: DOM4,
    OrderComponents: [{ name: 'offerer', type: 'address' }, { name: 'zone', type: 'address' }, { name: 'offer', type: 'OfferItem[]' }, { name: 'consideration', type: 'ConsiderationItem[]' }, { name: 'orderType', type: 'uint8' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }, { name: 'zoneHash', type: 'bytes32' }, { name: 'salt', type: 'uint256' }, { name: 'conduitKey', type: 'bytes32' }, { name: 'counter', type: 'uint256' }],
    OfferItem: ITEM, ConsiderationItem: [...ITEM, { name: 'recipient', type: 'address' }],
  };
  const it = (type, token, id, amount) => ({ itemType: type, token, identifierOrCriteria: String(id), startAmount: String(amount), endAmount: String(amount) });
  const cit = (type, token, id, amount, recipient) => ({ ...it(type, token, id, amount), recipient });
  const seaportOrder = (v, offer, consideration, { chainId = v.chain } = {}) => ({
    types: SEAPORT_TYPES, primaryType: 'OrderComponents', domain: { name: 'Seaport', version: '1.6', chainId, verifyingContract: SEAPORT16 },
    message: { offerer: v.me, zone: ZERO, offer, consideration, orderType: 0, startTime: '1760000000', endTime: String(1760000000 + 86400 * 7), zoneHash: ZERO32, salt: String(Math.floor(rnd() * 1e15)), conduitKey: ZERO32, counter: '0' },
  });

  // ================================================================ (a) nft_achat_seaport
  for (let i = 0; i < 60; i++) {
    const chain = i % 4 === 3 ? 43114 : 1;
    const v = actors('nft', i, chain), n = NET[chain], W = tok(chain, n.wrapped)[0];
    const coll = pick(P.collections), price = pick(P.nftPrices), say = pick([n.native, n.wrapped]);
    const tokenId = 1 + Math.floor(rnd() * 9000);
    const intent = { kind: 'buy_or_swap', freeText: P.sayBuy(coll, price.replace('.', jeu === 'reglage' ? ',' : '.'), say), token: say, amount: price };
    const pw = weiOf(price), fee = pw * 25n / 1000n, roy = pw * 50n / 1000n;
    const ctxExtra = { seaportKnown: i % 2 === 0 };
    const M = { fam: 'nft_achat_seaport', label: 'malveillant', ideal: 'critical', v, intent, ctxExtra };
    const B = { fam: 'nft_achat_seaport', label: 'benin', ideal: 'ok', v, intent, ctxExtra };
    if (i < 32) {
      const k = i % 8;
      const tiny = pick([0n, 1n, 1000n, 10n ** 12n]);
      if (k === 0) add({ ...M, sub: 'vente_deguisee_nft_contre_natif_quasi_nul', request: typed(v, seaportOrder(v, [it(2, v.coll, tokenId, 1)], [cit(0, ZERO, 0, tiny, v.me)])) });
      else if (k === 1) add({ ...M, sub: 'vente_deguisee_nft_contre_jeton_quasi_nul', request: typed(v, seaportOrder(v, [it(2, v.coll, tokenId, 1)], [cit(1, W, 0, tiny, v.me), cit(1, W, 0, fee, v.fee)])) });
      else if (k === 2) add({ ...M, sub: 'vente_deguisee_1155_quasi_nul', request: typed(v, seaportOrder(v, [it(3, v.coll, tokenId, 5)], [cit(0, ZERO, 0, tiny, v.me)])) });
      else if (k === 3) add({ ...M, sub: 'vente_deguisee_produit_a_un_tiers', request: typed(v, seaportOrder(v, [it(2, v.coll, tokenId, 1)], [cit(1, W, 0, pw, v.third)])) });
      else if (k === 4) add({ ...M, sub: 'vente_deguisee_collection_entiere', request: typed(v, seaportOrder(v, [it(4, v.coll, 0, 1)], [cit(0, ZERO, 0, tiny, v.me)])) });
      else if (k === 5) add({ ...M, sub: 'achat_nft_livre_a_un_tiers', request: typed(v, seaportOrder(v, [it(1, W, 0, pw)], [cit(2, v.coll, tokenId, 1, v.third), cit(1, W, 0, fee, v.fee)])) });
      else if (k === 6) add({ ...M, sub: 'achat_prix_dix_fois_le_prix_dit', request: typed(v, seaportOrder(v, [it(1, W, 0, pw * 10n)], [cit(2, v.coll, tokenId, 1, v.me), cit(1, W, 0, fee * 10n, v.fee)])) });
      else add({ ...M, sub: 'vente_deguisee_deux_nft_rien_a_soi', request: typed(v, seaportOrder(v, [it(2, v.coll, tokenId, 1), it(2, v.coll, tokenId + 1, 1)], [cit(1, W, 0, pw, v.third)])) });
    } else {
      const k = i % 5;
      if (k === 0) add({ ...B, sub: 'offre_achat_avec_commission_2_5', request: typed(v, seaportOrder(v, [it(1, W, 0, pw)], [cit(2, v.coll, tokenId, 1, v.me), cit(1, W, 0, fee, v.fee)])) });
      else if (k === 1) add({ ...B, sub: 'offre_achat_commission_et_redevance', request: typed(v, seaportOrder(v, [it(1, W, 0, pw)], [cit(2, v.coll, tokenId, 1, v.me), cit(1, W, 0, fee, v.fee), cit(1, W, 0, roy, v.creator)])) });
      else if (k === 2) add({ ...B, sub: 'offre_achat_1155', request: typed(v, seaportOrder(v, [it(1, W, 0, pw)], [cit(3, v.coll, tokenId, 2, v.me), cit(1, W, 0, fee, v.fee)])) });
      else if (k === 3) add({ ...B, sub: 'offre_collection_criteres', request: typed(v, seaportOrder(v, [it(1, W, 0, pw)], [cit(4, v.coll, 0, 1, v.me), cit(1, W, 0, fee, v.fee)])) });
      else add({ ...B, sub: 'offre_achat_arrondi', request: typed(v, seaportOrder(v, [it(1, W, 0, pw * 1005n / 1000n)], [cit(2, v.coll, tokenId, 1, v.me), cit(1, W, 0, fee, v.fee)])) });
    }
  }

  // ================================================================ (b) jeton_different
  const TRANSFER = 'transfer(address to,uint256 amount)', APPROVE = 'approve(address spender,uint256 amount)';
  const V2 = 'swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)';
  const V2ETH = 'swapExactETHForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)';
  for (let i = 0; i < 60; i++) {
    const chain = i % 3 === 2 ? 43114 : 1;
    const v = actors('jeton', i, chain), n = NET[chain], amt = pick(P.amounts);
    const stable = 'USDC', other = chain === 1 ? pick(['DAI', 'USDT']) : 'USDt';
    const byAddr = i % 4 === 1;
    const said = byAddr ? tok(chain, stable)[0] : (i % 5 === 0 ? stable.toLowerCase() : stable);
    const pay = { kind: 'pay_someone', freeText: `Payer Paul ${amt} ${byAddr ? 'USDC' : said}`, token: said, amount: String(amt), counterpartyLabel: 'Paul', counterpartyAddress: v.paul };
    const swap = { kind: 'buy_or_swap', freeText: `Échanger ${amt} ${byAddr ? 'USDC' : said} contre du ${n.wrapped}`, token: said, amount: String(amt) };
    const M = { fam: 'jeton_different', label: 'malveillant', ideal: 'critical', v };
    const B = { fam: 'jeton_different', label: 'benin', ideal: 'ok', v };
    const W = tok(chain, n.wrapped)[0], S = tok(chain, stable)[0];
    const fake = addr('jeton:faux:' + i);
    if (i < 32) {
      const k = i % 8;
      if (k === 0) add({ ...M, sub: 'paie_un_autre_jeton_du_registre', intent: pay, request: tx(v, tok(chain, other)[0], call(TRANSFER, [v.paul, units(chain, other, amt)])) });
      else if (k === 1) add({ ...M, sub: 'paie_un_jeton_hors_registre', intent: pay, request: tx(v, fake, call(TRANSFER, [v.paul, BigInt(amt) * 10n ** 6n])) });
      else if (k === 2) add({ ...M, sub: 'paie_en_natif_au_lieu_du_jeton', intent: pay, request: tx(v, v.paul, '0x', E18 / 10n) });
      else if (k === 3) add({ ...M, sub: 'echange_vend_le_jeton_enveloppe', intent: swap, request: tx(v, v.router, call(V2, [E18 / 20n, 1n, [W, S], v.me, DEADLINE])) });
      else if (k === 4) add({ ...M, sub: 'droit_sur_un_autre_jeton', intent: swap, request: tx(v, tok(chain, other)[0], call(APPROVE, [v.router, units(chain, other, amt)])) });
      else if (k === 5) add({ ...M, sub: 'permit_sur_un_autre_jeton', intent: swap, request: typed(v, permit2612(v, chain === 1 ? 'DAI' : 'WAVAX', v.router, chain === 1 ? units(1, 'DAI', amt) : E18)) });
      else if (k === 6) add({ ...M, sub: 'permit2_sur_jeton_hors_registre', intent: swap, request: typed(v, { ...permit2Single(v, stable, v.router, BigInt(amt) * 10n ** 6n), message: { details: { token: fake, amount: String(BigInt(amt) * 10n ** 6n), expiration: String(1760000000 + 86400 * 30), nonce: 0 }, spender: v.router, sigDeadline: DEADLINE } }) });
      else add({ ...M, sub: 'natif_dit_jeton_vendu', intent: { kind: 'pay_someone', freeText: `Payer Paul 0,1 ${n.native}`, token: n.native, amount: '0.1', counterpartyLabel: 'Paul', counterpartyAddress: v.paul }, request: tx(v, S, call(TRANSFER, [v.paul, units(chain, stable, 0.1)])) });
    } else {
      const k = i % 7;
      if (k === 0) add({ ...B, sub: 'paie_le_meme_jeton', intent: pay, request: tx(v, S, call(TRANSFER, [v.paul, units(chain, stable, amt)])) });
      else if (k === 1) add({ ...B, sub: 'echange_le_meme_jeton', intent: swap, request: tx(v, v.router, call(V2, [units(chain, stable, amt), 1000n, [S, W], v.me, DEADLINE])) });
      else if (k === 2) add({ ...B, sub: 'natif_dit_natif_paye', intent: { kind: 'pay_someone', freeText: `Payer Paul 0,1 ${n.native}`, token: n.native, amount: '0.1', counterpartyLabel: 'Paul', counterpartyAddress: v.paul }, request: tx(v, v.paul, '0x', E18 / 10n) });
      else if (k === 3) add({ ...B, sub: 'natif_dit_enveloppe_vendu_meme_reseau', intent: { kind: 'buy_or_swap', freeText: `Échanger 0,05 ${n.native} contre des USDC`, token: n.native, amount: '0.05', receiveToken: 'USDC' }, request: tx(v, v.router, call(V2, [E18 / 20n, 1000n, [W, S], v.me, DEADLINE])) });
      else if (k === 4) add({ ...B, sub: 'enveloppe_dit_natif_envoye_meme_reseau', intent: { kind: 'buy_or_swap', freeText: `Échanger 0,05 ${n.wrapped} contre des USDC`, token: n.wrapped, amount: '0.05', receiveToken: 'USDC' }, request: tx(v, v.router, call(V2ETH, [1000n, [W, S], v.me, DEADLINE]), E18 / 20n) });
      else if (k === 5) add({ ...B, sub: 'permit_meme_jeton', intent: swap, request: typed(v, permit2612(v, stable, v.router, units(chain, stable, amt))) });
      else add({ ...B, sub: 'permit2_meme_jeton', intent: swap, request: typed(v, permit2Single(v, stable, v.router, units(chain, stable, amt))) });
    }
  }

  // ================================================================ (c) chaine_domaine
  for (let i = 0; i < 60; i++) {
    const chain = i % 2 ? 43114 : 1;
    const v = actors('chaine', i, chain), amt = pick(P.amounts);
    const otherChain = chain === 1 ? pick([43114, ...P.otherChains]) : pick([1, ...P.otherChains]);
    const name = (c) => pick(CHAIN_NAME[c]);
    const onChain = (c) => (jeu === 'reglage' ? `Échanger ${amt} USDC sur ${name(c)}` : `Swap ${amt} USDC on ${name(c)}`);
    const swapIt = (txt) => ({ kind: 'buy_or_swap', freeText: txt || (jeu === 'reglage' ? `Échanger ${amt} USDC` : `Swap ${amt} USDC`), token: 'USDC', amount: String(amt) });
    const login = (d) => ({ kind: 'connect_or_accept_offer', freeText: P.sayLogin(d) });
    const M = { fam: 'chaine_domaine', label: 'malveillant', ideal: 'critical', v };
    const B = { fam: 'chaine_domaine', label: 'benin', ideal: 'ok', v };
    const otherSite = pick(P.sites.filter((s) => s !== v.origin));
    if (i < 32) {
      const k = i % 8;
      if (k === 0) add({ ...M, sub: 'permit_signe_pour_un_autre_reseau', intent: swapIt(), request: typed(v, permit2612(v, 'USDC', v.router, units(chain, 'USDC', amt), { chainId: otherChain })) });
      else if (k === 1) add({ ...M, sub: 'permit2_signe_pour_un_autre_reseau', intent: swapIt(), request: typed(v, permit2Single(v, 'USDC', v.router, units(chain, 'USDC', amt), { chainId: otherChain })) });
      else if (k === 2) add({ ...M, sub: 'siwe_pour_un_autre_site', intent: login(v.origin), request: personal(v, siweText(v, { domain: otherSite })) });
      else if (k === 3) add({ ...M, sub: 'siwe_uri_autre_site', intent: login(v.origin), request: personal(v, siweText(v, { uri: 'https://' + otherSite + '/login' })) });
      else if (k === 4) add({ ...M, sub: 'siwe_autre_reseau', ideal: 'warn', intent: login(v.origin), request: personal(v, siweText(v, { chainId: otherChain })) });
      else if (k === 5) add({ ...M, sub: 'intention_nomme_un_autre_reseau_signature', intent: swapIt(onChain(otherChain)), request: typed(v, permit2612(v, 'USDC', v.router, units(chain, 'USDC', amt))) });
      else if (k === 6) add({ ...M, sub: 'intention_nomme_un_autre_site_siwe', intent: login(otherSite), request: personal(v, siweText(v)) });
      else add({ ...M, sub: 'seaport_signe_pour_un_autre_reseau', intent: { kind: 'buy_or_swap', freeText: `Acheter un NFT pour 0.1 ${NET[chain].wrapped}`, token: NET[chain].wrapped, amount: '0.1' }, request: typed(v, seaportOrder(v, [it(1, tok(chain, NET[chain].wrapped)[0], 0, E18 / 10n)], [cit(2, v.coll, 7, 1, v.me)], { chainId: otherChain })) });
    } else {
      const k = i % 6;
      if (k === 0) add({ ...B, sub: 'permit_meme_reseau', intent: swapIt(), request: typed(v, permit2612(v, 'USDC', v.router, units(chain, 'USDC', amt))) });
      else if (k === 1) add({ ...B, sub: 'permit2_meme_reseau', intent: swapIt(), request: typed(v, permit2Single(v, 'USDC', v.router, units(chain, 'USDC', amt))) });
      else if (k === 2) add({ ...B, sub: 'siwe_meme_site', intent: login(v.origin), request: personal(v, siweText(v)) });
      else if (k === 3) add({ ...B, sub: 'intention_nomme_le_bon_reseau', intent: swapIt(onChain(chain)), request: typed(v, permit2612(v, 'USDC', v.router, units(chain, 'USDC', amt))) });
      else if (k === 4) add({ ...B, sub: 'intention_nomme_le_bon_site_siwe_ressources', intent: login(v.origin), request: personal(v, siweText(v, { resources: ['https://' + v.origin + '/terms'] })) });
      else add({ ...B, sub: 'seaport_meme_reseau', intent: { kind: 'buy_or_swap', freeText: `Acheter un NFT pour 0.1 ${NET[chain].wrapped}`, token: NET[chain].wrapped, amount: '0.1' }, request: typed(v, seaportOrder(v, [it(1, tok(chain, NET[chain].wrapped)[0], 0, E18 / 10n)], [cit(2, v.coll, 7, 1, v.me), cit(1, tok(chain, NET[chain].wrapped)[0], 0, E18 / 400n, v.fee)])) });
    }
  }

  // ================================================================ (d) connexion_droit
  for (let i = 0; i < 60; i++) {
    const chain = i % 3 === 2 ? 43114 : 1;
    const v = actors('connexion', i, chain), amt = pick(P.amounts);
    const intent = { kind: 'connect_or_accept_offer', freeText: P.sayLogin(v.origin) };
    const M = { fam: 'connexion_droit', label: 'malveillant', ideal: 'critical', v, intent };
    const B = { fam: 'connexion_droit', label: 'benin', ideal: 'ok', v, intent };
    if (i < 32) {
      const k = i % 8;
      if (k === 0) add({ ...M, sub: 'permit_canonique_illimite', request: typed(v, permit2612(v, 'USDC', v.unknownC, MAXU)) });
      else if (k === 1) add({ ...M, sub: 'permit_type_renomme', request: typed(v, permit2612(v, 'USDC', v.unknownC, pick([MAXU, units(chain, 'USDC', amt)]), { primary: pick(P.renamedPermit) })) });
      else if (k === 2) add({ ...M, sub: 'permit2_single', request: typed(v, permit2Single(v, 'USDC', v.unknownC, MAX160)) });
      else if (k === 3) add({ ...M, sub: 'permit2_type_renomme', request: typed(v, permit2Single(v, 'USDC', v.unknownC, pick([MAX160, units(chain, 'USDC', amt)]), { primary: pick(P.renamedPermit2) })) });
      else if (k === 4) add({ ...M, sub: 'permit2_transfert_signe', request: typed(v, permitTransfer(v, 'USDC', v.unknownC, units(chain, 'USDC', amt), { primary: i % 16 < 8 ? 'PermitTransferFrom' : pick(P.renamedPermit) })) });
      else if (k === 5) add({ ...M, sub: chain === 1 ? 'permit_dai' : 'permit2_batch', request: typed(v, chain === 1 ? daiPermit(v, v.unknownE) : permit2Batch(v, ['USDC', 'WAVAX'], v.unknownC)) });
      else if (k === 6) add({ ...M, sub: 'permit_borne_vers_routeur_connu', ideal: 'warn', request: typed(v, permit2612(v, 'USDC', v.router, units(chain, 'USDC', amt))), note: 'droit borné vers un protocole connu : pas une connexion' });
      else add({ ...M, sub: 'permit2_batch', request: typed(v, permit2Batch(v, chain === 1 ? ['USDC', 'DAI'] : ['USDC', 'WAVAX'], v.unknownC)) });
    } else {
      const k = i % 4;
      if (k === 0) add({ ...B, sub: 'siwe_valide', request: personal(v, siweText(v)) });
      else if (k === 1) add({ ...B, sub: 'siwe_valide_avec_ressources', request: personal(v, siweText(v, { statement: 'Bienvenue, signez pour vous connecter.', resources: ['ipfs://bafy' + addr('res' + i).slice(2, 20)] })) });
      else if (k === 2) add({ ...B, sub: 'texte_de_connexion', request: personal(v, `Connexion à ${v.origin}. Aucune transaction, aucun droit. Code ${Math.floor(rnd() * 1e6)}`) });
      else add({ ...B, sub: 'siwe_valide_sans_statement', request: personal(v, siweText(v, { statement: '' }).replace('\n\n\n', '\n\n')) });
    }
  }
  return cases;
}

if (process.argv[1] && process.argv[1].endsWith('gen_familles.mjs')) {
  for (const [jeu, seed, file] of [['reglage', 20261011, 'REGLAGE.jsonl'], ['controle', 77031999, 'CONTROLE.jsonl']]) {
    const cases = generate(jeu, seed);
    writeFileSync(join(HERE, file), cases.map((c) => JSON.stringify(c)).join('\n') + '\n');
    const tab = {};
    for (const c of cases) { tab[c.family] = tab[c.family] || { M: 0, B: 0 }; tab[c.family][c.label === 'malveillant' ? 'M' : 'B']++; }
    console.log(file, cases.length, 'cas', JSON.stringify(tab));
  }
}

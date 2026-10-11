// boucle2 : jeux NEUFS de paires (phrase écrite, demande) pour la boucle 2. Tout est SYNTHÉTIQUE et fabriqué ici par code.
//   node gen_jeux.mjs   ->  REGLAGE.jsonl, CONTROLE.jsonl, CONTROLE_SHA256.txt, JEUX_STATS.json
// Deux jeux de MÊME LOI (mêmes scénarios, mêmes proportions) tirés à part : autre graine, autres formulations, autres montants,
// autres adresses. Le RÉGLAGE sert à comprendre et corriger. Le CONTRÔLE est scellé par son SHA-256 et n'est mesuré qu'une fois, à la fin.
// Chaque scénario donne une demande CONFORME à la phrase et une demande qui trahit UNE dimension (ou une paire « indécidable »).
// Aucun message d'arnaque : les phrases sont des phrases ordinaires d'utilisateur. Aucun cas des jeux scellés n'est lu.
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const { call } = await import(pathToFileURL(join(HERE, '..', 'engine', 'src', 'abi_encode.mjs')).href);

const ME = '0x' + 'a1'.repeat(20); // le compte de la personne (même valeur que harnais.mjs)
const NOW = 1760000000;
const PERMIT2 = '0x000000000022d473030f116ddee9f6b43ac78ba3';
const SEAPORT = '0x0000000000000068f116a894984e2db1123eb395';
const ZERO = '0x' + '00'.repeat(20);
const MAX = 2n ** 256n - 1n, MAX160 = 2n ** 160n - 1n, MAX48 = 2n ** 48n - 1n;
// Jetons publics connus du produit par leur adresse (liste intégrée de written_check.js) et routeurs publics (pipeline/known_protocols.json).
const CHAINS = {
  43114: { hex: '0xa86a', native: 'AVAX', wrapped: 'WAVAX', tokens: { USDC: ['0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', 6], USDT: ['0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', 6], WAVAX: ['0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', 18] }, routers: [['Pangolin', '0xe54ca86531e17ef3616d22ca28b0d458b6c89106'], ['Uniswap', '0xbb00ff08d01d300023c629e8ffffcb65a5a578ce']], suffix: 'AVAX' },
  1: { hex: '0x1', native: 'ETH', wrapped: 'WETH', tokens: { USDC: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 6], USDT: ['0xdac17f958d2ee523a2206206994597c13d831ec7', 6], DAI: ['0x6b175474e89094c44da98b954eedeac495271d0f', 18], WETH: ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', 18] }, routers: [['Uniswap', '0x7a250d5630b4cf539739df2c5dacb4c659f2488d'], ['Uniswap', '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45']], suffix: 'ETH' },
};
const USD = { USDC: 1, USDT: 1, DAI: 1, WETH: 3000, ETH: 3000, WAVAX: 30, AVAX: 30 };

// ------------------------------------------------------------------ formulations (écrites à la main, deux lots disjoints)
const F = {
  reglage: {
    swap: [['fr', 'échanger {A} {S} contre {R}'], ['fr', 'je veux swap {A} {S} en {R}'], ['fr', 'convertir {A} {S} en {R}'], ['en', 'swap {A} {S} for {R}'], ['en', 'trade {A} {S} to {R} please'], ['fr', 'vendre {A} {S} pour avoir du {R}']],
    swapmin: [['fr', 'échanger {A} {S} contre au moins {M} {R}'], ['en', 'swap {A} {S} for at least {M} {R}']],
    pay: [['fr', 'payer {A} {S} à {X}'], ['fr', 'envoyer {A} {S} à {X}'], ['en', 'send {A} {S} to {X}'], ['fr', 'je règle {A} {S} à {X}']],
    grant: [['fr', 'autoriser {P} à dépenser {A} {S}'], ['en', 'approve {A} {S} for {P}'], ['fr', 'donner à {P} le droit d\'utiliser {A} {S}']],
    sell: [['fr', 'vendre mon NFT numéro {I} pour {A} {R}'], ['fr', 'mettre en vente mon NFT {I} à {A} {R}'], ['en', 'sell my NFT #{I} for {A} {R}']],
    buy: [['fr', 'acheter le NFT {I} pour {A} {R}'], ['fr', 'faire une offre de {A} {R} sur le NFT {I}'], ['en', 'buy NFT #{I} for {A} {R}']],
    login: [['fr', 'me connecter'], ['fr', 'je me connecte au site'], ['en', 'log in']],
    money: [['fr', '{N} dollars'], ['fr', '{N} $'], ['en', '{N} usd']],
    words: [['cinquante', 50], ['vingt', 20], ['cent', 100], ['deux cents', 200]],
    amounts: [20, 50, 75, 120, 250, 400], big: [[1500, '1 500', '1,500'], [2000, '2 000', '2,000']], dec: [[12.5, '12,5'], [0.5, '0,5']],
  },
  controle: {
    swap: [['fr', 'je change {A} {S} contre du {R}'], ['fr', 'passer {A} {S} en {R}'], ['fr', 'j\'échange {A} {S} pour des {R}'], ['en', 'exchange {A} {S} for some {R}'], ['en', 'I want to convert {A} {S} into {R}'], ['en', 'swapping {A} {S} to {R}']],
    swapmin: [['fr', 'convertir {A} {S} en {R}, au moins {M} {R}'], ['en', 'trade {A} {S} for {R}, minimum {M} {R}']],
    pay: [['fr', 'virer {A} {S} à {X}'], ['fr', 'je verse {A} {S} sur {X}'], ['en', 'transfer {A} {S} to {X}'], ['en', 'pay {A} {S} to {X}']],
    grant: [['fr', 'j\'approuve {A} {S} pour {P}'], ['en', 'allow {P} to spend {A} {S}'], ['fr', 'je donne la permission à {P} pour {A} {S}']],
    sell: [['fr', 'je liste mon NFT {I} au prix de {A} {R}'], ['en', 'list my NFT {I} for {A} {R}'], ['fr', 'je vends le NFT n°{I} contre {A} {R}']],
    buy: [['fr', 'j\'offre {A} {R} pour le NFT {I}'], ['en', 'bid {A} {R} on NFT {I}'], ['fr', 'je prends le NFT {I} à {A} {R}']],
    login: [['fr', 'juste ouvrir ma session'], ['en', 'sign in to the site'], ['fr', 'connexion à mon compte']],
    money: [['en', '${N}'], ['fr', '{N} balles'], ['fr', '{N} dollars'], ['en', '{N} USD']],
    words: [['trente', 30], ['quarante', 40], ['two hundred', 200], ['mille', 1000]],
    amounts: [15, 30, 60, 90, 150, 300, 800], big: [[2500, '2 500', '2,500'], [10000, '10 000', '10,000']], dec: [[7.5, '7,5'], [0.25, '0,25']],
  },
};

function build(jeu, seed, reps) {
  let st = seed >>> 0;
  const rnd = () => { st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const addr = (tag) => '0x' + createHash('sha256').update(jeu + ':' + seed + ':' + tag).digest('hex').slice(0, 40);
  const T = F[jeu];
  const out = []; let n = 0;
  const hex = (v) => '0x' + BigInt(v).toString(16);
  const frn = (x) => String(x).replace('.', ',');

  for (let rep = 0; rep < reps; rep++) {
    // ---- un monde par répétition : réseau, routeur (public ou déclaré dans les réglages), jetons, montants
    const world = () => {
      const chain = pick([43114, 43114, 1]), C = CHAINS[chain];
      const declared = rnd() < 0.5; // routeur synthétique déclaré dans les réglages, sinon routeur public (aucun réglage)
      const pub = pick(C.routers);
      const router = declared ? addr('router:' + n + ':' + rep) : pub[1], pname = declared ? pick(['le routeur', 'the router', 'mon DEX']) : pub[0];
      const stables = Object.keys(C.tokens).filter((s) => USD[s] === 1);
      const S = pick(stables), amt = pick(T.amounts);
      const toNative = rnd() < 0.5, R = toNative ? C.native : pick(Object.keys(C.tokens).filter((s) => s !== S && s !== C.wrapped));
      const tok = (s) => C.tokens[s][0], dec = (s) => (s === C.native ? 18 : C.tokens[s][1]);
      const units = (s, h) => BigInt(Math.round(h * 1e6)) * 10n ** BigInt(dec(s)) / 1000000n;
      const outFor = (h, s = S, r = R) => units(r, Math.round((h * USD[s] / USD[r]) * 0.985 * 1e6) / 1e6);
      return { chain, C, declared, router, pname, S, R, amt, toNative, tok, dec, units, outFor, other: addr('tiers:' + n + ':' + rep), friend: addr('ami:' + n + ':' + rep), fake: addr('faux:' + n + ':' + rep), nft: addr('nft:' + n + ':' + rep), fee: addr('frais:' + n + ':' + rep),
        soon: BigInt(NOW + pick([900, 1200, 1800])), far: BigInt(NOW + pick([5, 10]) * 365 * 86400), contexte: declared ? { contacts: [], history: [], protected: [], knownSpenders: [router], tokens: [] } : null };
    };
    // ---- fabriques de demandes
    const tx = (w, to, data, value, extra) => ({ method: 'eth_sendTransaction', params: [Object.assign({ from: ME, to, data: data || '0x' }, value ? { value: hex(value) } : {}, extra || {})] });
    const typed = (td) => ({ method: 'eth_signTypedData_v4', params: [ME, JSON.stringify(td)] });
    const approve = (w, token, spender, amount, value) => tx(w, token, call('approve(address spender,uint256 amount)', [spender, amount]), value);
    const transfer = (w, token, to, amount, value, extra) => tx(w, token, call('transfer(address to,uint256 amount)', [to, amount]), value, extra);
    const swap = (w, o = {}) => {
      const S = o.S || w.S, R = o.R || w.R, amountIn = o.amountIn ?? w.units(S, o.amt ?? w.amt), to = o.to || ME, deadline = o.deadline ?? w.soon;
      const min = o.min ?? w.outFor(o.amt ?? w.amt, S, R);
      const rOut = o.outToken || (R === w.C.native ? w.tok(w.C.wrapped) : w.tok(R));
      if (S === w.C.native) return tx(w, w.router, call(`swapExact${w.C.suffix}ForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)`, [min, [w.tok(w.C.wrapped), rOut], to, deadline]), amountIn);
      const path = o.path || [w.tok(S), rOut];
      const fn = R === w.C.native && !o.outToken ? `swapExactTokensFor${w.C.suffix}` : 'swapExactTokensForTokens';
      const r = tx(w, w.router, call(`${fn}(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)`, [amountIn, min, path, to, deadline]));
      if (o.value) r.params[0].value = hex(o.value);
      return r;
    };
    const v3 = (w, o = {}) => tx(w, w.router, call('exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)',
      [[w.tok(w.S), w.R === w.C.native ? w.tok(w.C.wrapped) : w.tok(w.R), 500, o.to || ME, o.amountIn ?? w.units(w.S, w.amt), o.min ?? w.outFor(w.amt), 0]]));
    const batch = (w, reqs) => ({ method: 'wallet_sendCalls', params: [{ version: '2.0.0', from: ME, chainId: w.C.hex, atomicRequired: true, calls: reqs.map((r) => { const t = r.params[0]; return Object.assign({ to: t.to, data: t.data }, t.value ? { value: t.value } : {}); }) }] });
    const D712 = [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];
    const D712P2 = [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];
    const permit = (w, o = {}) => typed({ types: { EIP712Domain: D712, Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
      primaryType: 'Permit', domain: { name: 'USD Coin', version: '2', chainId: o.chainId ?? w.chain, verifyingContract: o.token || w.tok(w.S) },
      message: { owner: ME, spender: o.spender || w.router, value: (o.value ?? w.units(w.S, w.amt)).toString(), nonce: '0', deadline: (o.deadline ?? w.soon).toString() } });
    const permit2 = (w, o = {}) => typed({ types: { EIP712Domain: D712P2, PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }],
      PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] },
      primaryType: 'PermitSingle', domain: { name: 'Permit2', chainId: o.chainId ?? w.chain, verifyingContract: o.verifying || PERMIT2 },
      message: { details: { token: o.token || w.tok(w.S), amount: (o.amount ?? w.units(w.S, w.amt)).toString(), expiration: (o.expiration ?? w.soon).toString(), nonce: '0' }, spender: o.spender || w.router, sigDeadline: (o.sigDeadline ?? w.soon).toString() } });
    const ORDER = { EIP712Domain: D712,
      OrderComponents: [{ name: 'offerer', type: 'address' }, { name: 'zone', type: 'address' }, { name: 'offer', type: 'OfferItem[]' }, { name: 'consideration', type: 'ConsiderationItem[]' }, { name: 'orderType', type: 'uint8' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }, { name: 'zoneHash', type: 'bytes32' }, { name: 'salt', type: 'uint256' }, { name: 'conduitKey', type: 'bytes32' }, { name: 'counter', type: 'uint256' }],
      OfferItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }],
      ConsiderationItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }, { name: 'recipient', type: 'address' }] };
    const order = (w, offer, consideration, endTime) => typed({ types: ORDER, primaryType: 'OrderComponents', domain: { name: 'Seaport', version: '1.6', chainId: w.chain, verifyingContract: SEAPORT },
      message: { offerer: ME, zone: ZERO, offer, consideration, orderType: 0, startTime: String(NOW), endTime: String(endTime ?? BigInt(NOW + 7 * 86400)), zoneHash: '0x' + '00'.repeat(32), salt: String(1 + Math.floor(rnd() * 1e9)), conduitKey: '0x' + '00'.repeat(32), counter: '0' } });
    const item = (itemType, token, id, amount, recipient) => Object.assign({ itemType, token, identifierOrCriteria: String(id), startAmount: String(amount), endAmount: String(amount) }, recipient ? { recipient } : {});
    // vente : j'offre le NFT, je reçois le prix (moins une commission de 2,5 % versée à la place de marché quand fee = true)
    const sale = (w, id, price, o = {}) => { const fee = o.fee ? price * 25n / 1000n : 0n;
      return order(w, [item(o.criteria ? 4 : 2, w.nft, o.criteria ? 0 : id, 1)].concat(o.extra ? [item(2, w.nft, o.extra, 1)] : []), [item(0, ZERO, 0, price - fee, o.recipient || ME)].concat(fee ? [item(0, ZERO, 0, fee, w.fee)] : []), o.endTime); };
    // offre d'achat : j'offre le prix en jeton enveloppé, je reçois le NFT (commission de 2,5 % en plus quand fee = true)
    const bid = (w, id, price, o = {}) => order(w, [item(1, w.tok(w.C.wrapped), 0, price)], [item(2, w.nft, id, 1, o.nftTo || ME)].concat(o.fee ? [item(1, w.tok(w.C.wrapped), 0, price * 25n / 1000n, w.fee)] : []));

    // ---- phrase : gabarit + écriture du montant
    const amtText = (lang, a) => (lang === 'fr' ? frn(a) : String(a));
    const say = (kind, w, v = {}) => { const [lang, tpl] = pick(T[kind]);
      return { lang, phrase: tpl.replace('{A}', v.A ?? amtText(lang, v.amt ?? w.amt)).replace('{S}', v.S ?? w.S).replace(/\{R\}/g, v.R ?? w.R).replace('{M}', v.M ?? '').replace('{X}', v.X ?? w.friend).replace('{P}', v.P ?? w.pname).replace('{I}', v.I ?? '') }; };
    const add = (scenario, dimension, w, s, list) => { for (const [verite, etiquette, request, raison] of list) {
      n++; out.push({ id: (jeu === 'reglage' ? 'R2-' : 'C2-') + String(n).padStart(4, '0'), jeu, scenario, dimension, verite, phrase: s.phrase, langue: s.lang, etiquette, raison: raison || null, chainId: w.C.hex, from: ME, origin: 'https://app.exemple.org', contexte: w.contexte, routeur: w.declared ? 'declare' : 'public', request }); } };
    const OK = 'conforme', KO = 'non_conforme', IND = 'indecidable';

    // ======================= A. échange : ce qui est écrit
    { const w = world(), s = say('swap', w), u = w.units(w.S, w.amt), k = pick([3, 10, 100]);
      add('droit_montant', 'montant du droit', w, s, [[OK, 'approve du montant écrit', approve(w, w.tok(w.S), w.router, u)], [KO, 'approve ' + k + ' fois plus', approve(w, w.tok(w.S), w.router, u * BigInt(k))], [KO, 'approve illimité', approve(w, w.tok(w.S), w.router, MAX)]]); }
    { const w = world(), s = say('swap', w), u = w.units(w.S, w.amt);
      add('droit_signe_montant', 'montant du droit signé', w, s, [[OK, 'permit du montant écrit', permit(w)], [KO, 'permit illimité', permit(w, { value: MAX })], [OK, 'Permit2 du montant écrit', permit2(w)], [KO, 'Permit2 dix fois plus', permit2(w, { amount: u * 10n })]]); }
    { const w = world(), s = say('swap', w), k = pick([2, 10, 100]);
      add('echange_montant', 'montant échangé', w, s, [[OK, 'échange du montant écrit', swap(w)], [KO, 'échange de ' + k + ' fois plus', swap(w, { amountIn: w.units(w.S, w.amt * k), min: w.outFor(w.amt * k) })]]);
      add('echange_montant', 'montant échangé', w, s, [[OK, 'échange V3 du montant écrit', v3(w)], [KO, 'échange V3 de ' + k + ' fois plus', v3(w, { amountIn: w.units(w.S, w.amt * k), min: w.outFor(w.amt * k) })]]); }
    { const w = world(), s = say('swap', w), other = Object.keys(w.C.tokens).find((x) => x !== w.S && USD[x] === 1);
      add('jeton_donne', 'jeton donné', w, s, [[OK, 'échange du jeton écrit', swap(w)], [KO, 'échange d\'un autre jeton (' + other + ')', swap(w, { S: other })], [KO, 'approve d\'un autre jeton', approve(w, w.tok(other), w.router, w.units(other, w.amt))], [KO, 'permit sur un autre jeton', permit(w, { token: w.tok(other), value: w.units(other, w.amt) })]]);
      add('jeton_sosie', 'jeton inconnu au même nom', w, s, [[OK, 'approve du vrai jeton', approve(w, w.tok(w.S), w.router, w.units(w.S, w.amt))], [KO, 'approve d\'un jeton inconnu', approve(w, w.fake, w.router, w.units(w.S, w.amt))]]); }
    { const w = world(), s = say('swap', w), otherOut = Object.keys(w.C.tokens).find((x) => x !== w.S && x !== w.R && x !== w.C.wrapped) || w.C.wrapped;
      const diff = w.R === w.C.native ? Object.keys(w.C.tokens).find((x) => x !== w.S && x !== w.C.wrapped) : otherOut;
      add('contrepartie', 'jeton reçu', w, s, [[OK, 'reçoit le jeton écrit', swap(w)], [KO, 'reçoit un autre jeton connu (' + diff + ')', swap(w, { outToken: w.tok(diff), min: w.outFor(w.amt, w.S, diff) })], [KO, 'reçoit un jeton inconnu', swap(w, { outToken: w.fake })]]); }
    { const w = world(), s = say('swap', w);
      const back = w.toNative ? tx(w, w.router, call(`swapExact${w.C.suffix}ForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)`, [w.units(w.S, w.amt * USD[w.C.native] * 0.98), [w.tok(w.C.wrapped), w.tok(w.S)], ME, w.soon]), w.units(w.C.native, w.amt))
        : swap(w, { path: [w.tok(w.R), w.tok(w.S)], amountIn: w.units(w.R, w.amt), min: 1000n, outToken: w.tok(w.S) });
      add('sens', 'sens de l\'échange', w, s, [[OK, 'donne le jeton écrit', swap(w)], [KO, 'donne l\'autre jeton, même nombre', back]]); }
    { const w = world(), s = say('swap', w);
      add('nature', 'nature de l\'opération', w, s, [[OK, 'échange', swap(w)], [KO, 'simple envoi du jeton à un tiers', transfer(w, w.tok(w.S), w.other, w.units(w.S, w.amt))], [KO, 'simple envoi de monnaie du réseau à un tiers', tx(w, w.other, '0x', w.units(w.C.native, 1))]]); }
    { const w = world(), s = say('swap', w);
      add('destinataire_recu', 'ce que j\'obtiens arrive chez moi', w, s, [[OK, 'reçu par moi', swap(w)], [KO, 'reçu par un tiers', swap(w, { to: w.other })], [OK, 'V3 reçu par moi', v3(w)], [KO, 'V3 reçu par un tiers', v3(w, { to: w.other })]]); }
    { const w = world(), s = say('swap', w);
      add('minimum_nul', 'minimum reçu', w, s, [[OK, 'minimum plausible', swap(w)], [KO, 'minimum zéro', swap(w, { min: 0n })], [KO, 'minimum d\'une unité de base', v3(w, { min: 1n })]]); }
    { const w = world(), m = Math.round(w.amt * USD[w.S] / USD[w.R] * 0.98 * 1000) / 1000, s0 = pick(T.swapmin);
      const s = { lang: s0[0], phrase: s0[1].replace('{A}', amtText(s0[0], w.amt)).replace('{S}', w.S).replace(/\{R\}/g, w.R).replace('{M}', amtText(s0[0], m)) };
      add('minimum_ecrit', 'minimum écrit', w, s, [[OK, 'minimum égal au minimum écrit', swap(w, { min: w.units(w.R, m) })], [KO, 'minimum mille fois plus bas', swap(w, { min: w.units(w.R, m) / 1000n })]]); }
    { const w = world(), s = say('swap', w), one = w.units(w.C.native, pick([1, 2, 3]));
      add('valeur_native', 'monnaie du réseau en plus', w, s, [[OK, 'approve seul', approve(w, w.tok(w.S), w.router, w.units(w.S, w.amt))], [KO, 'approve + monnaie du réseau jointe', approve(w, w.tok(w.S), w.router, w.units(w.S, w.amt), one)]]);
      if (w.S !== w.C.native) add('valeur_native', 'monnaie du réseau en plus', w, s, [[OK, 'échange seul', swap(w)], [KO, 'échange + monnaie du réseau jointe', swap(w, { value: one })]]); }
    { const w = world(), s = say('swap', w), u = w.units(w.S, w.amt), other = Object.keys(w.C.tokens).find((x) => x !== w.S && USD[x] === 1);
      add('lot', 'rien d\'autre dans le lot', w, s, [[OK, 'lot : approve + échange', batch(w, [approve(w, w.tok(w.S), w.router, u), swap(w)])],
        [KO, 'lot : + envoi d\'un autre jeton à un tiers', batch(w, [approve(w, w.tok(w.S), w.router, u), swap(w), transfer(w, w.tok(other), w.other, w.units(other, 300))])],
        [KO, 'lot : + droit illimité sur un autre jeton', batch(w, [approve(w, w.tok(w.S), w.router, u), swap(w), approve(w, w.tok(other), w.other, MAX)])],
        [KO, 'lot : + envoi de monnaie du réseau à un tiers', batch(w, [approve(w, w.tok(w.S), w.router, u), swap(w), tx(w, w.other, '0x', w.units(w.C.native, 2))])]]); }
    { const w = world(), s = say('swap', w);
      add('duree', 'rien de durable', w, s, [[OK, 'permit valable peu de temps', permit(w)], [KO, 'permit valable des années', permit(w, { deadline: w.far })], [OK, 'Permit2 qui expire vite', permit2(w)], [KO, 'Permit2 sans expiration', permit2(w, { expiration: MAX48 })], [KO, 'Permit2 signature valable des années', permit2(w, { sigDeadline: w.far })],
        [OK, 'échange à échéance courte', swap(w)], [KO, 'échange à échéance de plusieurs années', swap(w, { deadline: w.far })]]); }
    { const w = world(), s = say('swap', w), u = w.units(w.S, w.amt);
      add('beneficiaire_droit', 'à qui le droit est donné', w, s, [[OK, 'droit donné au routeur', approve(w, w.tok(w.S), w.router, u)], [KO, 'droit donné à une adresse quelconque', approve(w, w.tok(w.S), w.other, u)], [KO, 'permit pour une adresse quelconque', permit(w, { spender: w.other })],
        [KO, 'lot : droit pour une adresse, échange sur une autre', batch(w, [approve(w, w.tok(w.S), w.other, u), swap(w)])]]); }
    { const w = world(), s = say('swap', w), otherChain = w.chain === 1 ? 43114 : 1;
      add('reseau', 'sur ce réseau', w, s, [[OK, 'permit pour ce réseau', permit(w)], [KO, 'permit signé pour un autre réseau', permit(w, { chainId: otherChain })], [OK, 'Permit2 canonique', permit2(w)], [KO, 'Permit2 au contrat non canonique', permit2(w, { verifying: w.fake })], [KO, 'Permit2 pour un autre réseau', permit2(w, { chainId: otherChain })]]); }
    { const w = world(), s = say('swap', w), u = w.units(w.S, w.amt);
      const deleg = approve(w, w.tok(w.S), w.router, u); Object.assign(deleg.params[0], { type: '0x4', authorizationList: [{ chainId: '0x0', address: w.other, nonce: '0x0' }] });
      add('controle', 'personne ne prend la main', w, s, [[OK, 'échange', swap(w)], [KO, 'approve + délégation du compte', deleg], [KO, 'droit sur toute une collection de NFT', tx(w, w.nft, call('setApprovalForAll(address operator,bool approved)', [w.other, true]))],
        [KO, 'réseau ajouté avec un nœud inconnu', { method: 'wallet_addEthereumChain', params: [{ chainId: w.C.hex, chainName: w.chain === 1 ? 'Ethereum Mainnet' : 'Avalanche C-Chain', nativeCurrency: { name: w.C.native, symbol: w.C.native, decimals: 18 }, rpcUrls: ['https://rpc.' + addr('rpc' + n).slice(2, 10) + '.exemple.org'] }] }]]); }
    // ======================= B. donner un droit (phrase d'autorisation)
    { const w = world(), s = say('grant', w), u = w.units(w.S, w.amt);
      add('autoriser', 'droit écrit', w, s, [[OK, 'approve du montant écrit', approve(w, w.tok(w.S), w.router, u)], [KO, 'approve illimité', approve(w, w.tok(w.S), w.router, MAX)], [OK, 'Permit2 du montant écrit', permit2(w)], [KO, 'increaseAllowance vingt fois plus', tx(w, w.tok(w.S), call('increaseAllowance(address spender,uint256 addedValue)', [w.router, u * 20n]))]]); }
    // ======================= C. payer
    { const w = world(), s = say('pay', w), u = w.units(w.S, w.amt), other = Object.keys(w.C.tokens).find((x) => x !== w.S && USD[x] === 1);
      add('paiement', 'montant, jeton, destinataire', w, s, [[OK, 'transfer conforme', transfer(w, w.tok(w.S), w.friend, u)], [KO, 'montant supérieur de 5 %', transfer(w, w.tok(w.S), w.friend, u * 105n / 100n)], [KO, 'autre jeton', transfer(w, w.tok(other), w.friend, w.units(other, w.amt))],
        [KO, 'autre destinataire', transfer(w, w.tok(w.S), w.other, u)], [KO, 'monnaie du réseau jointe', transfer(w, w.tok(w.S), w.friend, u, w.units(w.C.native, 1))], [KO, 'jeton inconnu', transfer(w, w.fake, w.friend, u)],
        [KO, 'droit illimité au lieu du paiement', approve(w, w.tok(w.S), w.friend, MAX)]]); }
    { const w = world(), a = pick([0.5, 1, 2]), s = say('pay', w, { A: amtText('fr', a), S: w.C.native });
      add('paiement_natif', 'paiement en monnaie du réseau', w, s, [[OK, 'envoi conforme', tx(w, w.friend, '0x', w.units(w.C.native, a))], [KO, 'dix fois plus', tx(w, w.friend, '0x', w.units(w.C.native, a * 10))], [KO, 'autre destinataire', tx(w, w.other, '0x', w.units(w.C.native, a))]]); }
    // ======================= D. écritures du montant
    { const w = world(), [lang, tpl] = pick(T.money), money = tpl.replace('{N}', amtText(lang, w.amt)), u = w.units(w.S, w.amt);
      const s = { lang, phrase: (lang === 'fr' ? pick(['échanger ', 'convertir ']) : pick(['swap ', 'trade '])) + money + (lang === 'fr' ? ' contre ' : ' for ') + w.R };
      add('montant_monnaie', 'montant écrit en monnaie courante', w, s, [[OK, 'approve du même nombre d\'un jeton stable', approve(w, w.tok(w.S), w.router, u)], [KO, 'approve illimité', approve(w, w.tok(w.S), w.router, MAX)], [KO, 'approve cent fois plus', approve(w, w.tok(w.S), w.router, u * 100n)],
        [IND, 'approve d\'un jeton inconnu', approve(w, w.fake, w.router, u), 'le jeton n\'est pas connu : rien ne prouve que ce sont des dollars'], [OK, 'échange du même nombre d\'un jeton stable', swap(w)], [KO, 'échange de vingt fois plus', swap(w, { amountIn: u * 20n, min: w.outFor(w.amt * 20) })]]);
      const sp = { lang, phrase: (lang === 'fr' ? 'payer ' + money + ' à ' : 'send ' + money + ' to ') + w.friend };
      add('montant_monnaie', 'montant écrit en monnaie courante', w, sp, [[OK, 'transfer du même nombre d\'un jeton stable', transfer(w, w.tok(w.S), w.friend, u)], [KO, 'transfer de dix fois plus', transfer(w, w.tok(w.S), w.friend, u * 10n)], [KO, 'envoi de monnaie du réseau à la place', tx(w, w.friend, '0x', w.units(w.C.native, w.amt))]]); }
    { const w = world(), [word, val] = pick(T.words), u = w.units(w.S, val), en = /^[a-z ]+$/.test(word) && /two|hundred|thirty|fifty/.test(word);
      const s = { lang: en ? 'en' : 'fr', phrase: (en ? 'swap ' : 'échanger ') + word + ' ' + w.S + (en ? ' for ' : ' contre ') + w.R };
      add('montant_lettres', 'montant écrit en lettres', w, s, [[OK, 'approve du montant écrit', approve(w, w.tok(w.S), w.router, u)], [KO, 'approve illimité', approve(w, w.tok(w.S), w.router, MAX)], [KO, 'échange de dix fois plus', swap(w, { amountIn: u * 10n, min: w.outFor(val * 10) })]]); }
    { const w = world(), [val, frs, ens] = pick(T.big), en = rnd() < 0.4, u = w.units(w.S, val);
      const s = { lang: en ? 'en' : 'fr', phrase: (en ? 'swap ' + ens : 'échanger ' + frs) + ' ' + w.S + (en ? ' for ' : ' contre ') + w.R };
      add('montant_milliers', 'séparateur de milliers', w, s, [[OK, 'approve du montant écrit', approve(w, w.tok(w.S), w.router, u)], [KO, 'approve dix fois plus', approve(w, w.tok(w.S), w.router, u * 10n)], [OK, 'échange du montant écrit', swap(w, { amountIn: u, min: w.outFor(val) })]]);
      const [dv, dfr] = pick(T.dec), s2 = { lang: 'fr', phrase: 'échanger ' + dfr + ' ' + w.S + ' contre ' + w.R };
      add('montant_decimal', 'virgule décimale', w, s2, [[OK, 'approve du montant écrit', approve(w, w.tok(w.S), w.router, w.units(w.S, dv))], [KO, 'approve mille fois plus', approve(w, w.tok(w.S), w.router, w.units(w.S, dv * 1000))]]); }
    // ======================= E. NFT : vendre, acheter
    { const w = world(), id = 1 + Math.floor(rnd() * 900), p = pick([0.5, 1, 2, 3]), price = w.units(w.C.native, p), s = say('sell', w, { A: amtText('fr', p), R: w.C.native, I: String(id) });
      add('nft_vente', 'vente d\'un NFT', w, s, [[OK, 'ordre au prix écrit, payé à moi', sale(w, id, price)], [OK, 'ordre au prix écrit, commission de 2,5 %', sale(w, id, price, { fee: true })], [KO, 'prix presque nul', sale(w, id, price / 1000000n)], [KO, 'prix versé à un tiers', sale(w, id, price, { recipient: w.other })],
        [KO, 'un deuxième NFT dans l\'ordre', sale(w, id, price, { extra: id + 7 })], [KO, 'toute la collection', sale(w, id, price, { criteria: true })], [KO, 'prix inférieur de 40 %', sale(w, id, price * 6n / 10n)]]); }
    { const w = world(), id = 1 + Math.floor(rnd() * 900), p = pick([0.2, 0.5, 1]), price = w.units(w.C.wrapped, p), s = say('buy', w, { A: amtText('fr', p), R: w.C.wrapped, I: String(id) });
      add('nft_achat', 'offre d\'achat d\'un NFT', w, s, [[OK, 'offre au prix écrit, NFT pour moi', bid(w, id, price)], [OK, 'offre au prix écrit, commission de 2,5 %', bid(w, id, price, { fee: true })], [KO, 'offre vingt fois plus chère', bid(w, id, price * 20n)], [KO, 'NFT livré à un tiers', bid(w, id, price, { nftTo: w.other })],
        [KO, 'droit sur toute la collection au lieu d\'un achat', tx(w, w.nft, call('setApprovalForAll(address operator,bool approved)', [w.other, true]))]]); }
    // ======================= F. se connecter
    { const w = world(), s = say('login', w);
      const siwe = '0x' + Buffer.from(`app.exemple.org wants you to sign in with your Ethereum account:\n${ME}\n\nConnexion.\n\nURI: https://app.exemple.org\nVersion: 1\nChain ID: ${w.chain}\nNonce: ${addr('nonce' + n).slice(2, 14)}\nIssued At: 2026-10-11T08:00:00.000Z`, 'utf8').toString('hex');
      add('connexion', 'se connecter ne donne aucun droit', w, s, [[OK, 'message de connexion du site', { method: 'personal_sign', params: [siwe, ME] }], [KO, 'permit illimité', permit(w, { value: MAX, spender: w.other })], [KO, 'Permit2 illimité', permit2(w, { amount: MAX160, spender: w.other })],
        [KO, 'droit sur une collection de NFT', tx(w, w.nft, call('setApprovalForAll(address operator,bool approved)', [w.other, true]))], [KO, 'envoi de monnaie du réseau', tx(w, w.other, '0x', w.units(w.C.native, 1))]]); }
  }
  return out;
}

const sets = { reglage: build('reglage', 20261011, 6), controle: build('controle', 77052026, 6) };
const stats = {};
for (const [jeu, rows] of Object.entries(sets)) {
  // contrôles de structure (sans rien afficher du contenu) : hex valide, JSON typé lisible
  for (const r of rows) {
    if (!['conforme', 'non_conforme', 'indecidable'].includes(r.verite) || !r.phrase || /\{[A-Z]\}/.test(r.phrase)) throw new Error('paire mal formée dans ' + jeu);
    const p = r.request.params[0];
    if (r.request.method === 'eth_sendTransaction' && !/^0x([0-9a-f]{2})*$/i.test(p.data)) throw new Error('data invalide dans ' + jeu);
    if (r.request.method === 'eth_signTypedData_v4') JSON.parse(r.request.params[1]);
  }
  const text = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
  writeFileSync(join(HERE, jeu === 'reglage' ? 'REGLAGE.jsonl' : 'CONTROLE.jsonl'), text);
  const c = (k) => rows.reduce((m, r) => { m[r[k]] = (m[r[k]] || 0) + 1; return m; }, {});
  stats[jeu] = { paires: rows.length, sha256: createHash('sha256').update(text).digest('hex'), verite: c('verite'), scenario: c('scenario'), langue: c('langue'), routeur: c('routeur'), phrases_distinctes: new Set(rows.map((r) => r.phrase)).size };
}
writeFileSync(join(HERE, 'CONTROLE_SHA256.txt'), stats.controle.sha256 + '  CONTROLE.jsonl\n');
writeFileSync(join(HERE, 'JEUX_STATS.json'), JSON.stringify(stats, null, 1));
console.log(JSON.stringify({ reglage: { paires: stats.reglage.paires, verite: stats.reglage.verite }, controle: { paires: stats.controle.paires, verite: stats.controle.verite, sha256: stats.controle.sha256 } }));

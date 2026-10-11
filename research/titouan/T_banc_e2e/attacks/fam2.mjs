// fam2 : signatures hors chaine. SYNTHETIQUE. Structures typed data DE MEMOIRE (voir champ approximation).
import { add, world, fact, EOA_NEW, CON_NEW, CON_OLD, intent, tx, typed, psign, psignHex, TOK, KP, units, AMTS, SYMS, pick, ri, newAddr, rnd32, rndBytes, calldata, MAXU, MAXU160, MAXU48, hex } from './core.mjs';
const C2 = '2_signatures_hors_chaine';
const FAR = 4102444800; // 2100-01-01
const NOW = 1760000000;
const FARMAX = MAXU;
const CONN = (extra) => intent('connect_or_accept_offer', extra || 'Je me connecte au site');

function permit2612(ctx, tokSym, spender, value, deadline, nonce = ri(20)) {
  const dom = { name: tokSym === 'USDC' ? 'USD Coin' : tokSym === 'DAI' ? 'Dai Stablecoin' : 'Token ' + tokSym, version: tokSym === 'USDC' ? '2' : '1', chainId: ctx.chainId, verifyingContract: TOK[tokSym].addr };
  return typed(ctx, dom, { Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] }, 'Permit',
    { owner: ctx.victim, spender, value, nonce, deadline });
}
const P2DOM = (ctx) => ({ name: 'Permit2', chainId: ctx.chainId, verifyingContract: KP.permit2.address });
const PD = [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }];
const TP = [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }];

export function run() {
  // ---- EIP-2612 permit
  for (let i = 0; i < 12; i++) {
    const ctx = world({ origin: pick(['claim-rewards.example', 'app.uniswap.org', 'airdrop-check.example', 'opensea.io']) });
    const sym = pick(['USDC', 'DAI', 'USDT', 'WETH']); const sp = fact(ctx, newAddr(), i % 2 ? EOA_NEW : CON_NEW(60));
    const maxv = i < 8; const far = i % 3 !== 2;
    add({ f: 'permit_2612', s: maxv ? (far ? 'valeur_max_deadline_lointaine' : 'valeur_max') : 'valeur_bornee_deadline_lointaine', cat: C2, src: ['R2 §2.2', 'R3 §12'], ctx,
      req: permit2612(ctx, sym, sp, maxv ? MAXU : units(pick(AMTS), sym), far ? (i % 2 ? FARMAX : FAR) : NOW + 3600),
      intent: pick([CONN('Je reclame mon airdrop'), CONN('Je signe pour me connecter'), intent('buy_or_swap', 'Je veux echanger mes jetons', { token: sym })]),
      l: 'm', sev: 'critical', sig: ['offchain_permit', 'spender_unknown', maxv ? 'value_max' : 'value_bounded', far ? 'deadline_far' : 'deadline_short'],
      why: 'Signature permit() EIP-2612 : droit de depense accorde hors chaine, sans transaction visible ; spender inconnu, deadline/valeur extremes.', approx: 'domaine du token (name/version) de memoire ; USDC=version 2' });
  }
  // permit borne court vers spender inconnu, intention swap : ambigu
  for (let i = 0; i < 3; i++) {
    const ctx = world({ origin: 'swap-new-dex.example' }); const sym = pick(SYMS); const a = pick(AMTS); const sp = fact(ctx, newAddr(), CON_NEW(1500));
    add({ f: 'permit_2612', s: 'borne_court_contrat_inconnu', cat: C2, src: ['R2 §2.2'], ctx,
      req: permit2612(ctx, sym, sp, units(a, sym), NOW + 1800),
      intent: intent('buy_or_swap', `Je veux echanger ${a} ${sym}`, { token: sym, amount: String(a) }),
      l: 'a', sev: 'warn', sig: ['offchain_permit', 'spender_not_allowlisted', 'bounded_exact'],
      why: 'permit borne et court : forme normale d\'un swap sur un DEX recent, mais spender non reconnu.', approx: true });
  }
  // ---- DAI permit
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: pick(['airdrop-check.example', 'app.1inch.io']) }); const sp = fact(ctx, newAddr(), i % 2 ? EOA_NEW : CON_NEW(40));
    const dom = { name: 'Dai Stablecoin', version: '1', chainId: ctx.chainId, verifyingContract: TOK.DAI.addr };
    add({ f: 'dai_permit', s: i < 6 ? 'allowed_true_expiry_0' : 'allowed_true_expiry_lointain', cat: C2, src: ['R2 §2.3', 'SYNTHESE §3.5'], ctx,
      req: typed(ctx, dom, { Permit: [{ name: 'holder', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'expiry', type: 'uint256' }, { name: 'allowed', type: 'bool' }] }, 'Permit',
        { holder: ctx.victim, spender: sp, nonce: ri(10), expiry: i < 6 ? 0 : FAR, allowed: true }),
      intent: pick([CONN('Je reclame mon airdrop'), CONN('Je verifie mon eligibilite')]),
      l: 'm', sev: 'critical', sig: ['offchain_permit', 'dai_permit_no_amount_unlimited', 'spender_unknown'],
      why: "DAI permit n'a pas de montant : allowed=true signifie illimite ; expiry 0 = sans fin. Piege de decodage cite en synthese.", approx: 'champs holder/spender/nonce/expiry/allowed de memoire' });
  }
  // ---- Permit2 AllowanceTransfer single / batch
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: pick(['claim-rewards.example', 'app.uniswap.org', 'mint-now.example']) }); const sym = pick(SYMS); const sp = fact(ctx, newAddr(), i % 2 ? EOA_NEW : CON_NEW(90));
    add({ f: 'permit2_allowance', s: 'single_spender_inconnu', cat: C2, src: ['R2 §2.4', 'SYNTHESE §3.5'], ctx,
      req: typed(ctx, P2DOM(ctx), { PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: PD }, 'PermitSingle',
        { details: { token: TOK[sym].addr, amount: i < 5 ? MAXU160 : units(pick(AMTS) * 10, sym), expiration: i < 5 ? MAXU48 : FAR, nonce: 0 }, spender: sp, sigDeadline: i % 2 ? FARMAX : FAR }),
      intent: pick([CONN('Je reclame mon airdrop'), intent('buy_or_swap', 'Je veux echanger mes jetons', { token: sym })]),
      l: 'm', sev: 'critical', sig: ['permit2', 'spender_unknown', 'amount_max_or_large', 'token_in_details'],
      why: 'PermitSingle Permit2 : le token est dans details (piege de decodage) ; spender inconnu, montant uint160 max, expiration extreme.', approx: 'PermitDetails/PermitSingle recopies de memoire' });
  }
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: pick(['claim-rewards.example', 'airdrop-check.example']) }); const sp = fact(ctx, newAddr(), CON_NEW(30));
    const n = 2 + (i % 3); const syms = ['USDC', 'USDT', 'DAI', 'WETH'].slice(0, n);
    add({ f: 'permit2_allowance', s: 'batch_multi_tokens', cat: C2, src: ['R2 §2.4'], ctx,
      req: typed(ctx, P2DOM(ctx), { PermitBatch: [{ name: 'details', type: 'PermitDetails[]' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: PD }, 'PermitBatch',
        { details: syms.map((s, k) => ({ token: TOK[s].addr, amount: MAXU160, expiration: MAXU48, nonce: k })), spender: sp, sigDeadline: FAR }),
      intent: CONN(pick(['Je valide mon wallet', 'Je reclame mon cadeau'])),
      l: 'm', sev: 'critical', sig: ['permit2', 'batch', 'spender_unknown', 'amount_max'],
      why: `PermitBatch : une seule signature accorde ${n} tokens en illimite au meme spender inconnu.`, approx: true });
  }
  // ---- Permit2 SignatureTransfer (sans / avec witness)
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: pick(['claim-rewards.example', 'app.uniswap.org']) }); const sym = pick(SYMS); const sp = fact(ctx, newAddr(), CON_NEW(70));
    const withWitness = i >= 4; const types = { PermitTransferFrom: [{ name: 'permitted', type: 'TokenPermissions' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }], TokenPermissions: TP };
    let msg = { permitted: { token: TOK[sym].addr, amount: units(pick(AMTS) * 4, sym) }, spender: sp, nonce: ri(1e6), deadline: FAR }; let pt = 'PermitTransferFrom';
    if (withWitness) {
      pt = 'PermitWitnessTransferFrom';
      types.PermitWitnessTransferFrom = [...types.PermitTransferFrom, { name: 'witness', type: 'Witness' }];
      delete types.PermitTransferFrom; types.Witness = [{ name: 'recipient', type: 'address' }, { name: 'note', type: 'string' }];
      msg.witness = { recipient: fact(ctx, newAddr(), EOA_NEW), note: 'swap' };
    }
    add({ f: 'permit2_signature_transfer', s: withWitness ? 'avec_witness_destinataire_libre' : 'sans_witness', cat: C2, src: ['R2 §2.5', 'SYNTHESE §3.5'], ctx,
      req: typed(ctx, P2DOM(ctx), types, pt, msg),
      intent: pick([CONN('Je reclame mon airdrop'), intent('buy_or_swap', 'Je veux echanger', { token: sym })]),
      l: 'm', sev: 'critical', sig: ['permit2_signature_transfer', 'spender_chooses_recipient', withWitness ? 'witness_opaque' : 'no_witness'],
      why: "SignatureTransfer : un transfert unique, mais le depensier choisit le destinataire au moment d'appeler ; le witness peut cacher le vrai destinataire.", approx: 'noms de types et champs du witness inventes pour le banc (structure Witness arbitraire) ; reste a verifier' });
  }
  // benin : Permit2 sur Uniswap (spender = routeur connu, borne, expiration courte)
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: 'app.uniswap.org' }); const sym = pick(SYMS); const a = pick(AMTS);
    add({ f: 'permit2_allowance', s: 'benin_uniswap_borne_courte', cat: 'benin', src: ['R2 §2.4', 'docs/intent-barrier.md'], ctx, hard: i >= 4,
      req: typed(ctx, P2DOM(ctx), { PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: PD }, 'PermitSingle',
        { details: { token: TOK[sym].addr, amount: i >= 4 ? MAXU160 : units(a, sym), expiration: NOW + 2592000 * (i >= 4 ? 1 : 0) + 1800, nonce: 0 }, spender: KP.universal.address, sigDeadline: NOW + 1800 }),
      intent: intent('buy_or_swap', `Je veux echanger ${a} ${sym} contre de l'ETH`, { token: sym, amount: String(a) }),
      l: 'b', sev: i >= 4 ? 'warn' : 'ok', sig: i >= 4 ? ['amount_max', 'spender_allowlisted'] : [],
      why: i >= 4 ? 'Permit2 a montant max vers Universal Router connu : usage courant ; warn tolerable.' : 'PermitSingle vers routeur connu, montant exact, expiration 30 min : forme canonique de Uniswap.', approx: true });
  }
  // ---- Seaport
  const SEA_T = {
    OrderComponents: [{ name: 'offerer', type: 'address' }, { name: 'zone', type: 'address' }, { name: 'offer', type: 'OfferItem[]' }, { name: 'consideration', type: 'ConsiderationItem[]' }, { name: 'orderType', type: 'uint8' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }, { name: 'zoneHash', type: 'bytes32' }, { name: 'salt', type: 'uint256' }, { name: 'conduitKey', type: 'bytes32' }, { name: 'counter', type: 'uint256' }],
    OfferItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }],
    ConsiderationItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }, { name: 'recipient', type: 'address' }],
  };
  const seaMsg = (ctx, offer, cons) => ({ offerer: ctx.victim, zone: '0x0000000000000000000000000000000000000000', offer, consideration: cons, orderType: 0, startTime: NOW, endTime: i2(), zoneHash: '0x' + '00'.repeat(32), salt: String(ri(1e9)), conduitKey: '0x' + '00'.repeat(32), counter: 0 });
  const i2 = () => FAR;
  const SEAD = (ctx) => ({ name: 'Seaport', version: '1.6', chainId: ctx.chainId, verifyingContract: KP.seaport.address });
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: pick(['opensea.io', 'free-mint.example', 'nft-claim.example']) }); const col = fact(ctx, newAddr(), CON_OLD); const att = fact(ctx, newAddr(), EOA_NEW);
    const mult = i % 4 === 3;
    const offer = [{ itemType: 2, token: col, identifierOrCriteria: String(ri(9000)), startAmount: '1', endAmount: '1' }];
    if (mult) offer.push({ itemType: 2, token: col, identifierOrCriteria: String(ri(9000)), startAmount: '1', endAmount: '1' });
    add({ f: 'seaport', s: mult ? 'offre_multi_nft_consideration_0' : 'offre_nft_pour_0', cat: C2, src: ['R2 §2.7', 'SYNTHESE §3.5'], ctx,
      req: typed(ctx, SEAD(ctx), SEA_T, 'OrderComponents', seaMsg(ctx, offer, [{ itemType: 0, token: '0x0000000000000000000000000000000000000000', identifierOrCriteria: '0', startAmount: i % 2 ? '0' : '1', endAmount: i % 2 ? '0' : '1', recipient: ctx.victim }])),
      intent: pick([intent('connect_or_accept_offer', 'Je mets mon NFT en vente a bon prix'), CONN('Je me connecte a la place de marche')]),
      l: 'm', sev: 'critical', sig: ['seaport_net_balance', 'consideration_zero_or_dust'],
      why: 'Ordre Seaport : on offre le NFT et on ne recoit (quasi) rien ; seul le bilan net offer/consideration revele le vol (piege de decodage).', approx: 'OrderComponents/OfferItem/ConsiderationItem de memoire, domaine Seaport 1.6 [V]' });
  }
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: 'opensea.io' }); const col = fact(ctx, newAddr(), CON_OLD); const att = fact(ctx, newAddr(), EOA_NEW); const sym = 'WETH';
    // offre a la fois NFT + WETH, contrepartie vers l'attaquant (bilan net negatif)
    add({ f: 'seaport', s: 'bilan_net_negatif_tokens_et_nft', cat: C2, src: ['R2 §2.7'], ctx,
      req: typed(ctx, SEAD(ctx), SEA_T, 'OrderComponents', seaMsg(ctx,
        [{ itemType: 2, token: col, identifierOrCriteria: String(ri(9000)), startAmount: '1', endAmount: '1' }, { itemType: 1, token: TOK.WETH.addr, identifierOrCriteria: '0', startAmount: String(units(5, 'WETH')), endAmount: String(units(5, 'WETH')) }],
        [{ itemType: 0, token: '0x0000000000000000000000000000000000000000', identifierOrCriteria: '0', startAmount: '1000000000000000', endAmount: '1000000000000000', recipient: att }])),
      intent: CONN("J'accepte une offre sur mon NFT"),
      l: 'm', sev: 'critical', sig: ['seaport_net_balance', 'offer_includes_fungible', 'recipient_not_self'],
      why: 'Le bilan net est tres negatif (NFT + 5 WETH contre 0,001 ETH) et la contrepartie va a un tiers.', approx: true });
  }
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'opensea.io' }); const col = fact(ctx, newAddr(), CON_OLD);
    const price = pick(['500000000000000000', '1200000000000000000', '80000000000000000']);
    add({ f: 'seaport', s: 'benin_liste_prix_juste', cat: 'benin', src: ['R2 §2.7'], ctx, hard: i === 3,
      req: typed(ctx, SEAD(ctx), SEA_T, 'OrderComponents', seaMsg(ctx, [{ itemType: 2, token: col, identifierOrCriteria: String(ri(9000)), startAmount: '1', endAmount: '1' }],
        [{ itemType: 0, token: '0x0000000000000000000000000000000000000000', identifierOrCriteria: '0', startAmount: price, endAmount: price, recipient: ctx.victim }, { itemType: 0, token: '0x0000000000000000000000000000000000000000', identifierOrCriteria: '0', startAmount: '12500000000000000', endAmount: '12500000000000000', recipient: fact(ctx, newAddr(), CON_OLD) }])),
      intent: intent('connect_or_accept_offer', 'Je mets mon NFT en vente sur OpenSea'),
      l: 'b', sev: i === 3 ? 'warn' : 'ok', sig: i === 3 ? ['seaport_new_listing_fee_recipient'] : [],
      why: 'Listing a un prix coherent, paiement vers soi + frais de place de marche : bilan net positif.', approx: true });
  }
  // ---- Blur (structure tres approximative)
  const BLUR_T = { Order: [{ name: 'trader', type: 'address' }, { name: 'side', type: 'uint8' }, { name: 'matchingPolicy', type: 'address' }, { name: 'collection', type: 'address' }, { name: 'tokenId', type: 'uint256' }, { name: 'amount', type: 'uint256' }, { name: 'paymentToken', type: 'address' }, { name: 'price', type: 'uint256' }, { name: 'listingTime', type: 'uint256' }, { name: 'expirationTime', type: 'uint256' }, { name: 'fees', type: 'Fee[]' }, { name: 'salt', type: 'uint256' }, { name: 'extraParams', type: 'bytes' }], Fee: [{ name: 'rate', type: 'uint16' }, { name: 'recipient', type: 'address' }] };
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: pick(['blur.io', 'blur-airdrop.example']) }); const col = fact(ctx, newAddr(), CON_OLD);
    const bad = i < 4;
    add({ f: 'blur', s: bad ? 'listing_prix_0_ou_symbolique' : 'listing_benin_prix_juste', cat: bad ? C2 : 'benin', src: ['R2 §2.7'], ctx, hard: !bad,
      req: typed(ctx, { name: 'Blur Exchange', version: '1.0', chainId: ctx.chainId, verifyingContract: KP.blurPool.address }, BLUR_T, 'Order',
        { trader: ctx.victim, side: 1, matchingPolicy: newAddr(), collection: col, tokenId: ri(9000), amount: 1, paymentToken: '0x0000000000000000000000000000000000000000', price: bad ? (i % 2 ? '0' : '1000000') : '900000000000000000', listingTime: NOW, expirationTime: FAR, fees: [{ rate: 50, recipient: newAddr() }], salt: String(ri(1e9)), extraParams: '0x01' }),
      intent: bad ? CONN('Je me connecte a Blur pour reclamer mes points') : intent('connect_or_accept_offer', 'Je mets mon NFT en vente'),
      l: bad ? 'm' : 'b', sev: bad ? 'critical' : 'ok', sig: bad ? ['marketplace_order_price_zero', 'intent_gap'] : [],
      why: bad ? 'Ordre de vente a prix nul/symbolique (meme mecanisme que Seaport) sur une place de marche.' : 'Listing Blur a prix coherent.', approx: 'STRUCTURE BLUR TRES APPROXIMATIVE : adresse, champs et nom du domaine inventes pour le banc ; a verifier avant usage' });
  }
  // ---- CoW / UniswapX
  const COW_T = { Order: [{ name: 'sellToken', type: 'address' }, { name: 'buyToken', type: 'address' }, { name: 'receiver', type: 'address' }, { name: 'sellAmount', type: 'uint256' }, { name: 'buyAmount', type: 'uint256' }, { name: 'validTo', type: 'uint32' }, { name: 'appData', type: 'bytes32' }, { name: 'feeAmount', type: 'uint256' }, { name: 'kind', type: 'string' }, { name: 'partiallyFillable', type: 'bool' }, { name: 'sellTokenBalance', type: 'string' }, { name: 'buyTokenBalance', type: 'string' }] };
  const cow = (ctx, recv, sellA, buyA) => typed(ctx, { name: 'Gnosis Protocol', version: 'v2', chainId: ctx.chainId, verifyingContract: KP.cow.address }, COW_T, 'Order',
    { sellToken: TOK.WETH.addr, buyToken: TOK.USDC.addr, receiver: recv, sellAmount: sellA, buyAmount: buyA, validTo: NOW + 1800, appData: '0x' + '00'.repeat(32), feeAmount: '0', kind: 'sell', partiallyFillable: false, sellTokenBalance: 'erc20', buyTokenBalance: 'erc20' });
  for (let i = 0; i < 5; i++) {
    const ctx = world({ origin: 'cowswap.exchange' }); const att = fact(ctx, newAddr(), EOA_NEW);
    add({ f: 'cow_uniswapx', s: 'cow_receiver_different', cat: C2, src: ['R2 §2.8', 'R4 §12'], ctx,
      req: cow(ctx, att, String(units(2, 'WETH')), String(units(6000, 'USDC'))),
      intent: intent('buy_or_swap', 'Je veux echanger 2 WETH contre des USDC', { token: 'WETH', amount: '2' }),
      l: 'm', sev: 'critical', sig: ['order_receiver_not_self', 'intent_based_order'],
      why: "Ordre CoW dont le receiver est un tiers : l'ordre signe est valide, la reception part chez l'attaquant.", approx: 'champs CoW de memoire (kind en chaine dans la signature v4)' });
  }
  for (let i = 0; i < 3; i++) {
    const ctx = world({ origin: 'cowswap.exchange' });
    add({ f: 'cow_uniswapx', s: 'cow_buyAmount_derisoire', cat: C2, src: ['R2 §2.8', 'R4 §14'], ctx,
      req: cow(ctx, ctx.victim, String(units(2, 'WETH')), '1'),
      intent: intent('buy_or_swap', 'Je veux echanger 2 WETH contre des USDC', { token: 'WETH', amount: '2' }),
      l: 'm', sev: 'critical', sig: ['min_out_absurd', 'price_deviation'],
      why: 'buyAmount = 1 unite pour 2 WETH : le solveur ou un MEV prend tout ; prix aberrant (R4 §14).', approx: true });
  }
  const UX_T = { PermitWitnessTransferFrom: [{ name: 'permitted', type: 'TokenPermissions' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }, { name: 'witness', type: 'ExclusiveDutchOrder' }], TokenPermissions: TP,
    ExclusiveDutchOrder: [{ name: 'info', type: 'OrderInfo' }, { name: 'decayStartTime', type: 'uint256' }, { name: 'decayEndTime', type: 'uint256' }, { name: 'exclusiveFiller', type: 'address' }, { name: 'exclusivityOverrideBps', type: 'uint256' }, { name: 'inputToken', type: 'address' }, { name: 'inputStartAmount', type: 'uint256' }, { name: 'inputEndAmount', type: 'uint256' }, { name: 'outputs', type: 'DutchOutput[]' }],
    OrderInfo: [{ name: 'reactor', type: 'address' }, { name: 'swapper', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }, { name: 'additionalValidationContract', type: 'address' }, { name: 'additionalValidationData', type: 'bytes' }],
    DutchOutput: [{ name: 'token', type: 'address' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }, { name: 'recipient', type: 'address' }] };
  const ux = (ctx, recip, outAmt) => typed(ctx, P2DOM(ctx), UX_T, 'PermitWitnessTransferFrom',
    { permitted: { token: TOK.WETH.addr, amount: String(units(2, 'WETH')) }, spender: KP.universal.address, nonce: ri(1e6), deadline: NOW + 1800,
      witness: { info: { reactor: KP.universal.address, swapper: ctx.victim, nonce: ri(1e6), deadline: NOW + 1800, additionalValidationContract: '0x0000000000000000000000000000000000000000', additionalValidationData: '0x' }, decayStartTime: NOW, decayEndTime: NOW + 600, exclusiveFiller: '0x0000000000000000000000000000000000000000', exclusivityOverrideBps: 0, inputToken: TOK.WETH.addr, inputStartAmount: String(units(2, 'WETH')), inputEndAmount: String(units(2, 'WETH')), outputs: [{ token: TOK.USDC.addr, startAmount: String(outAmt), endAmount: String(outAmt), recipient: recip }] } });
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'app.uniswap.org' }); const att = fact(ctx, newAddr(), EOA_NEW);
    add({ f: 'cow_uniswapx', s: 'uniswapx_output_recipient_tiers', cat: C2, src: ['R2 §2.8'], ctx,
      req: ux(ctx, att, units(6000, 'USDC')),
      intent: intent('buy_or_swap', 'Je veux echanger 2 WETH contre des USDC', { token: 'WETH', amount: '2' }),
      l: 'm', sev: 'critical', sig: ['order_receiver_not_self', 'witness_decoding'],
      why: "UniswapX : le recipient de la sortie est un tiers, cache dans le witness ; sans decodage du witness on ne voit qu'un Permit2 de 2 WETH.", approx: 'STRUCTURE UniswapX de memoire, noms de champs a verifier (DutchOutput, OrderInfo)' });
  }
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'cowswap.exchange' });
    add({ f: 'cow_uniswapx', s: 'cow_benin', cat: 'benin', src: ['R2 §2.8'], ctx,
      req: cow(ctx, ctx.victim, String(units(2, 'WETH')), String(units(5950, 'USDC'))),
      intent: intent('buy_or_swap', 'Je veux echanger 2 WETH contre des USDC', { token: 'WETH', amount: '2' }),
      l: 'b', sev: 'ok', sig: [], why: 'Ordre CoW avec receiver = soi et prix coherent.', approx: true });
  }
  for (let i = 0; i < 3; i++) {
    const ctx = world({ origin: 'app.uniswap.org' });
    add({ f: 'cow_uniswapx', s: 'uniswapx_benin', cat: 'benin', src: ['R2 §2.8'], ctx, hard: i === 2,
      req: ux(ctx, ctx.victim, units(5950, 'USDC')),
      intent: intent('buy_or_swap', 'Je veux echanger 2 WETH contre des USDC', { token: 'WETH', amount: '2' }),
      l: 'b', sev: i === 2 ? 'warn' : 'ok', sig: i === 2 ? ['witness_opaque_but_self'] : [], why: 'UniswapX avec recipient = soi.', approx: true });
  }

  // ---- SIWE
  const siwe = (ctx, domain, uriHost, statement, extra = '') => `${domain} wants you to sign in with your Ethereum account:\n${ctx.victim}\n\n${statement}\n\nURI: https://${uriHost}\nVersion: 1\nChain ID: ${ctx.chainId}\nNonce: ${rnd32().slice(2, 12)}\nIssued At: 2026-10-11T08:00:00.000Z${extra}`;
  const FRSITE = ['app.uniswap.org', 'opensea.io', 'app.aave.com', 'app.ens.domains'];
  for (let i = 0; i < 8; i++) {
    const real = pick(FRSITE); const evil = pick(['uniswap-claim.example', 'opensea-support.example', 'aave-rewards.example', 'ens-verify.example']);
    const ctx = world({ origin: evil });
    const vari = i % 4;
    const dom = vari === 0 ? real : evil; // 0 : message au nom du vrai domaine mais depuis un site different
    add({ f: 'siwe', s: vari === 0 ? 'domaine_message_ne_correspond_pas_origine' : vari === 1 ? 'uri_different_du_domaine' : vari === 2 ? 'ressources_demandant_droits' : 'domaine_sosie_chainid_autre', cat: C2, src: ['R2 §2.10', 'R5 §A5'], ctx,
      req: { method: 'personal_sign', params: [Buffer.from(vari === 1 ? siwe(ctx, evil, real, 'Sign in to continue') : vari === 2 ? siwe(ctx, evil, evil, 'I accept the Terms and authorize token transfers for rewards.', '\nResources:\n- https://' + evil + '/permit-all') : vari === 3 ? siwe({ ...ctx, chainId: 137 }, evil, evil, 'Verify your wallet') : siwe(ctx, dom, evil, 'Sign in to continue'), 'utf8').toString('hex').replace(/^/, '0x'), ctx.victim] },
      intent: CONN(`Je me connecte a ${real}`),
      l: 'm', sev: 'critical', sig: ['siwe_domain_mismatch', 'origin_lookalike'],
      why: "Message SIWE EIP-4361 dont le domaine/URI ne correspond pas a l'origine de la page : phishing d'authentification (le domaine signe est ce que verifie le serveur).", approx: false });
  }
  for (let i = 0; i < 8; i++) {
    const site = pick(FRSITE); const ctx = world({ origin: site });
    const edge = i >= 6;
    add({ f: 'siwe', s: edge ? 'benin_dur_sous_domaine_port' : 'benin_domaine_concordant', cat: 'benin', src: ['R2 §2.10', 'R2 §5'], ctx, hard: edge,
      req: { method: 'personal_sign', params: [Buffer.from(siwe(ctx, edge ? site : site, site, 'Sign in to ' + site), 'utf8').toString('hex').replace(/^/, '0x'), ctx.victim] },
      intent: CONN(`Je me connecte a ${site}`),
      l: 'b', sev: 'ok', ideal: 'ok', sig: [], why: edge ? 'SIWE valide, domaine identique ; les cas durs testent la normalisation (casse, sous-domaines, port).' : 'SIWE sur le bon domaine, aucune sortie ni droit.', approx: false });
  }
  // ---- verifyingContract different du site
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: 'app.uniswap.org' }); const att = fact(ctx, newAddr(), CON_NEW(25));
    add({ f: 'verifying_contract', s: 'typed_data_inconnu_verifyingContract_tiers', cat: C2, src: ['R2 §2.11', 'R2 §4'], ctx,
      req: typed(ctx, { name: 'Rewards', version: '1', chainId: ctx.chainId, verifyingContract: att }, { Claim: [{ name: 'account', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'data', type: 'bytes' }] }, 'Claim', { account: ctx.victim, amount: '1000', data: rndBytes(64) }),
      intent: intent('buy_or_swap', 'Je veux echanger sur Uniswap'),
      l: 'm', sev: 'critical', sig: ['typed_data_unknown_type', 'verifyingContract_not_site_contract', 'blind_signature'],
      why: 'EIP-712 de type inconnu dont le verifyingContract est un contrat jeune sans rapport avec le site visite ; le contenu est opaque (data bytes).', approx: 'type Claim invente pour le banc' });
  }
  for (let i = 0; i < 3; i++) {
    const ctx = world({ origin: 'app.uniswap.org' });
    add({ f: 'verifying_contract', s: 'benin_verifyingContract_protocole_connu', cat: 'benin', src: ['R2 §2.11'], ctx, hard: i === 2,
      req: permit2612(ctx, 'USDC', KP.routerV3.address, units(100, 'USDC'), NOW + 1800),
      intent: intent('buy_or_swap', 'Je veux echanger 100 USDC', { token: 'USDC', amount: '100' }),
      l: 'b', sev: i === 2 ? 'warn' : 'ok', sig: [], why: 'verifyingContract = token canonique, spender = routeur connu.', approx: true });
  }
  // ---- eth_sign aveugle
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: pick(['claim-rewards.example', 'old-dapp.example', 'app.uniswap.org']) });
    add({ f: 'eth_sign_aveugle', s: i < 6 ? 'hash_32_octets' : 'hash_domaine_connu_mais_aveugle', cat: C2, src: ['R2 §2.9', 'R2 §5'], ctx,
      req: { method: 'eth_sign', params: [ctx.victim, rnd32()] },
      intent: pick([CONN('Je me connecte'), intent('buy_or_swap', 'Je veux echanger')]),
      l: 'm', sev: 'critical', sig: ['eth_sign_raw', 'cannot_decode'],
      why: 'eth_sign sur un hash de 32 octets : signe potentiellement une transaction ou un ordre ; critique par defaut (R2 §5).', approx: false });
  }
  // ---- personal_sign hex opaque
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: pick(['claim-rewards.example', 'app.uniswap.org', 'unknown-dapp.example']) });
    const n = pick([32, 64, 96]);
    add({ f: 'personal_sign_opaque', s: i < 5 ? 'hex_opaque_octets_aleatoires' : 'hex_opaque_ressemble_hash', cat: C2, src: ['R2 §2.9'], ctx,
      req: psignHex(ctx, rndBytes(n)),
      intent: CONN('Je signe pour me connecter'),
      l: i < 5 ? 'm' : 'a', sev: i < 5 ? 'critical' : 'warn', sig: ['personal_sign_opaque_hex'],
      why: i < 5 ? 'personal_sign sur des octets non lisibles : peut etre un hash de transaction ; opacite maximale.' : 'Hex opaque de 32 octets : peut etre un challenge d\'authentification legitime (nonce) ou un hash de tx ; ambigu.', approx: false });
  }
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'app.ens.domains' });
    add({ f: 'personal_sign_opaque', s: 'benin_texte_lisible', cat: 'benin', src: ['R2 §5'], ctx,
      req: psign(ctx, 'Welcome! Sign this message to prove you own this wallet. Nonce: ' + rnd32().slice(2, 14)), intent: CONN('Je me connecte'), l: 'b', sev: 'ok', sig: [], why: 'Message texte lisible, sans montant ni verbe de transfert.' });
  }
  for (let i = 0; i < 3; i++) {
    const ctx = world({ origin: 'app.safe.global' });
    add({ f: 'personal_sign_opaque', s: 'benin_dur_texte_encode_en_hex', cat: 'benin', src: ['R2 §2.9'], ctx, hard: true,
      req: psignHex(ctx, '0x' + Buffer.from('Sign in to Safe\nNonce: ' + rnd32().slice(2, 12), 'utf8').toString('hex')), intent: CONN('Je me connecte a Safe'), l: 'b', sev: 'ok', sig: [], why: 'Texte lisible envoye en hex (comportement standard de personal_sign) : doit etre decode avant jugement opaque.' });
  }
  // ---- changement de reseau
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: pick(['claim-rewards.example', 'cheap-gas.example']) });
    add({ f: 'changement_reseau', s: 'switch_vers_chaine_inattendue', cat: C2, src: ['R5 §A7', 'R4 §15'], ctx,
      req: { method: 'wallet_switchEthereumChain', params: [{ chainId: pick(['0x38', '0x89', '0xa86a', '0x1388']) }] },
      intent: intent('buy_or_swap', 'Je veux echanger des ETH sur Ethereum'),
      l: 'a', sev: 'warn', sig: ['chain_switch_unrequested'], why: "Changement de chaine non lie a l'intention declaree (swap sur Ethereum) : souvent un prelude (adresses, tokens, permits differents) mais parfois legitime.", approx: false });
  }
  for (let i = 0; i < 5; i++) {
    const ctx = world({ origin: pick(['cheap-gas.example', 'claim-rewards.example']) });
    add({ f: 'changement_reseau', s: 'ajout_chaine_rpc_malveillant', cat: C2, src: ['R5 §A7'], ctx,
      req: { method: 'wallet_addEthereumChain', params: [{ chainId: '0x' + (100000 + ri(900000)).toString(16), chainName: 'Fast Mainnet', rpcUrls: ['https://rpc.' + pick(['fastnet', 'speedchain', 'quickrpc']) + '.example'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, blockExplorerUrls: ['https://scan.example'] }] },
      intent: CONN('Je me connecte au site'),
      l: 'm', sev: 'critical', sig: ['add_chain_unknown_rpc', 'native_symbol_spoof'],
      why: "Ajout d'une chaine avec RPC inconnu et symbole ETH : un RPC malveillant peut mentir sur soldes et simulations (R5 §A7).", approx: false });
  }
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'app.uniswap.org' });
    add({ f: 'changement_reseau', s: 'benin_switch_chaine_connue', cat: 'benin', src: ['R5 §A7'], ctx,
      req: { method: 'wallet_switchEthereumChain', params: [{ chainId: pick(['0x1', '0xa', '0xa4b1', '0x2105']) }] },
      intent: intent('buy_or_swap', 'Je veux echanger sur Arbitrum'), l: 'b', sev: 'ok', sig: [], why: 'Changement vers une chaine principale connue, coherent avec la demande.' });
  }
}

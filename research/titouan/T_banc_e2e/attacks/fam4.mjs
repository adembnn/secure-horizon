// fam4 : contrepartie, tokens, swaps, faux sites, kits. SYNTHETIQUE.
import { add, world, fact, EOA_NEW, CON_NEW, CON_OLD, intent, tx, typed, TOK, KP, units, AMTS, SYMS, pick, ri, newAddr, rnd32, rndBytes, calldata, MAXU, hex } from './core.mjs';
import { lookalike, sharedAffix } from './lib.mjs';
const C6 = '6_contrepartie', C7 = '7_tokens', C8 = '8_swaps_et_ponts', C9 = '9_faux_frontend_et_sites';
const NOW = 1760000000;
const CONN = (t) => intent('connect_or_accept_offer', t || 'Je me connecte au site');
const ETH = (x) => BigInt(Math.round(x * 1e6)) * 10n ** 12n;
const APPROVE = (sp, v = MAXU) => calldata('approve(address,uint256)', [sp, v]);

function sendTo(ctx, to, tokenSym, a) { // tokenSym 'ETH' ou symbole ERC-20
  return tokenSym === 'ETH' ? tx(ctx, to, '0x', ETH(a)) : tx(ctx, TOK[tokenSym].addr, calldata('transfer(address,uint256)', [to, units(a, tokenSym)]));
}

export function run() {
  // =============== adresse empoisonnee (variantes USENIX : prefixe>=3 et suffixe>=4) ===============
  const variants = [[3, 4], [4, 4], [3, 6], [5, 5], [6, 6], [4, 6], [3, 4], [5, 4]];
  for (let i = 0; i < 16; i++) {
    const [pre, suf] = variants[i % variants.length]; const ctx = world({ origin: 'wallet-interface.local' });
    const real = ctx._paul; const poison = fact(ctx, lookalike(real, pre, suf), EOA_NEW);
    const tok = i % 2 ? 'ETH' : pick(SYMS); const a = tok === 'ETH' ? pick([0.5, 1.2, 3]) : pick(AMTS) * 2;
    ctx.history = [
      { address: real, token: 'USDC', amount: '120', direction: 'sortie', minutes_ago: 60 * 24 * 40, kind: 'reel' },
      { address: poison, token: tok === 'ETH' ? 'ETH' : tok, amount: '0.000001', direction: 'entree', minutes_ago: 8 + ri(12), kind: 'dust_empoisonnement' },
    ];
    add({ f: 'adresse_empoisonnee', s: `prefixe${pre}_suffixe${suf}_${tok === 'ETH' ? 'eth' : 'erc20'}`, cat: C6, src: ['R4 §1', 'SYNTHESE §2 (famille 6)', 'docs/intent-barrier.md (sosie 4+4)'], ctx,
      req: sendTo(ctx, poison, tok, a),
      intent: intent('pay_someone', `Je paie Paul ${a} ${tok}`, { token: tok, amount: String(a), counterpartyLabel: 'Paul', counterpartyAddress: real }),
      l: 'm', sev: 'critical', sig: ['address_lookalike', `shared_prefix_${pre}_suffix_${suf}`, 'recent_dust_in_history', 'recipient_not_contact'],
      why: `Adresse sosie (${pre} premiers, ${suf} derniers caracteres communs) injectee dans l'historique par une micro-transaction il y a quelques minutes ; l'utilisateur la prend pour celle de Paul.`,
      blind: false, approx: false });
    // verification locale du sosie
    const sa = sharedAffix(real, poison); if (sa.pre < pre || sa.suf < suf) throw new Error('lookalike affix');
  }
  for (let i = 0; i < 4; i++) {
    const [pre, suf] = [[3, 4], [4, 4]][i % 2]; const ctx = world({ origin: 'wallet-interface.local' });
    const real = ctx._paul; const poison = fact(ctx, lookalike(real, pre, suf), EOA_NEW); const sym = 'USDT';
    ctx.history = [{ address: real, token: sym, amount: '300', direction: 'sortie', minutes_ago: 60 * 24 * 12, kind: 'reel' },
      { address: poison, token: sym, amount: '0', direction: 'entree', minutes_ago: 5 + ri(10), kind: 'transferFrom_valeur_nulle_usurpe' }];
    add({ f: 'adresse_empoisonnee', s: 'transfert_valeur_nulle_usurpe', cat: C6, src: ['R4 §1'], ctx,
      req: sendTo(ctx, poison, sym, 300), intent: intent('pay_someone', 'Je paie Paul 300 USDT', { token: sym, amount: '300', counterpartyLabel: 'Paul', counterpartyAddress: real }),
      l: 'm', sev: 'critical', sig: ['address_lookalike', 'zero_value_transferFrom_in_history'],
      why: "transferFrom de valeur nulle appele par l'attaquant : fait apparaitre l'adresse sosie dans l'historique comme si Paul avait envoye (aucun cout, aucune signature de la victime).", approx: false });
  }
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'wallet-interface.local' }); const real = ctx._paul; const poison = fact(ctx, lookalike(real, 4, 4), EOA_NEW);
    const fake = fact(ctx, newAddr(), { isContract: true, ageBlocks: 40, firstSeenByUser: true });
    ctx.token_info = { [fake.toLowerCase()]: { symbol: 'USDT', name: 'Tether USD', canonical: false, ageBlocks: 40 } };
    ctx.history = [{ address: real, token: 'USDT', amount: '250', direction: 'sortie', minutes_ago: 60 * 24 * 20, kind: 'reel' },
      { address: poison, token: 'USDT(faux:' + fake + ')', amount: '1', direction: 'entree', minutes_ago: 6 + ri(10), kind: 'faux_token_meme_symbole' }];
    add({ f: 'adresse_empoisonnee', s: 'faux_token_meme_symbole_dust', cat: C6, src: ['R4 §1', 'R4 §7'], ctx,
      req: sendTo(ctx, poison, 'USDT', 250), intent: intent('pay_someone', 'Je paie Paul 250 USDT', { token: 'USDT', amount: '250', counterpartyLabel: 'Paul', counterpartyAddress: real }),
      l: 'm', sev: 'critical', sig: ['address_lookalike', 'fake_token_dust_in_history'],
      why: "Le sosie apparait dans l'historique via un faux token au symbole USDT : l'entree semble legitime dans l'interface du wallet.", approx: false });
  }
  for (let i = 0; i < 3; i++) {
    const ctx = world({ origin: 'wallet-interface.local' }); const real = ctx._paul; const near = fact(ctx, lookalike(real, 3, 3), EOA_NEW);
    ctx.history = [{ address: real, token: 'USDC', amount: '90', direction: 'sortie', minutes_ago: 60 * 24 * 30, kind: 'reel' }];
    add({ f: 'adresse_empoisonnee', s: 'sosie_sous_seuil_3_3_intention_coherente', cat: C6, src: ['R4 §1', 'R4 §2'], ctx,
      req: sendTo(ctx, near, 'USDC', 90), intent: intent('pay_someone', 'Je paie une nouvelle personne 90 USDC', { token: 'USDC', amount: '90', counterpartyAddress: near }),
      l: 'a', sev: 'warn', sig: ['address_weak_lookalike_3_3', 'first_seen_recipient'],
      why: 'Memes 3+3 caracteres qu\'une adresse connue : sous le seuil USENIX (3+4) ; peut etre une coincidence ou un sosie plus faible. Intention coherente avec la destination saisie.', approx: false });
  }
  // benins proches de l'empoisonnement : bon contact malgre dust
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'wallet-interface.local' }); const real = ctx._paul; const poison = lookalike(real, 4, 4);
    ctx.history = [{ address: real, token: 'USDC', amount: '120', direction: 'sortie', minutes_ago: 60 * 24 * 40, kind: 'reel' }, { address: poison, token: 'ETH', amount: '0.000001', direction: 'entree', minutes_ago: 9, kind: 'dust_empoisonnement' }];
    add({ f: 'adresse_empoisonnee', s: 'benin_dur_bon_contact_malgre_dust', cat: 'benin', src: ['R4 §1', 'R4 §3'], ctx, hard: true,
      req: sendTo(ctx, real, 'USDC', 120), intent: intent('pay_someone', 'Je paie Paul 120 USDC', { token: 'USDC', amount: '120', counterpartyLabel: 'Paul', counterpartyAddress: real }),
      l: 'b', sev: 'ok', sig: [], why: "L'utilisateur envoie bien vers l'adresse du carnet ; la presence d'un sosie dans l'historique ne doit pas declencher d'alerte (faux positif sinon).", approx: false });
  }
  for (let i = 0; i < 3; i++) {
    const ctx = world({ origin: 'wallet-interface.local' }); const known = ctx._paul; const other = fact(ctx, lookalike(known, 1, 1), EOA_NEW);
    add({ f: 'adresse_empoisonnee', s: 'benin_dur_nouveau_destinataire_coincidence_1_1', cat: 'benin', src: ['R4 §1'], ctx, hard: true,
      req: sendTo(ctx, other, 'USDC', 40), intent: intent('pay_someone', 'Je paie Sophie 40 USDC', { token: 'USDC', amount: '40', counterpartyLabel: 'Sophie', counterpartyAddress: other }),
      l: 'b', sev: 'ok', sig: ['first_seen_recipient'], why: 'Nouveau destinataire choisi volontairement ; seuls 1+1 caracteres en commun : pas un sosie.', approx: false });
  }
  // =============== presse-papiers remplace ===============
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: 'wallet-interface.local' }); const target = i % 2 ? ctx._exch : ctx._paul; const clip = fact(ctx, i >= 6 ? lookalike(target, 4, 4) : newAddr(), EOA_NEW);
    const tok = pick(['ETH', 'USDC', 'USDT']); const a = tok === 'ETH' ? 1.5 : 800;
    add({ f: 'presse_papiers', s: i % 2 ? 'depot_exchange_adresse_remplacee' : 'contact_adresse_remplacee', cat: C6, src: ['R5 §A4', 'R4 §3'], ctx,
      req: sendTo(ctx, clip, tok, a),
      intent: intent(i % 2 ? 'send_to_my_account' : 'pay_someone', i % 2 ? `J'envoie ${a} ${tok} vers mon Coinbase` : `Je paie Paul ${a} ${tok}`, { token: tok, amount: String(a), counterpartyLabel: i % 2 ? 'Mon Coinbase' : 'Paul', counterpartyAddress: target }),
      l: 'm', sev: 'critical', sig: ['recipient_not_contact', 'clipboard_swap_pattern'],
      why: "Un malware presse-papiers a remplace l'adresse collee par celle de l'attaquant : l'intention porte l'adresse choisie dans le carnet, la tx une autre.", approx: false });
  }
  // =============== ENS / homoglyphe ===============
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'wallet-interface.local' }); const evil = fact(ctx, newAddr(), EOA_NEW);
    ctx.ens = { typed_name: ['аlice-dao.eth', 'alice-dao.eth ', 'a1ice-dao.eth', 'alice‐dao.eth'][i], intended_name: 'alice-dao.eth', resolves_to: evil, note: 'homoglyphe/ponctuation sosie' };
    add({ f: 'ens_sosie', s: 'homoglyphe_ou_caractere_invisible', cat: C6, src: ['R4 §4'], ctx,
      req: sendTo(ctx, evil, 'USDC', 500), intent: intent('pay_someone', 'Je paie alice-dao.eth 500 USDC', { token: 'USDC', amount: '500', counterpartyLabel: 'alice-dao.eth' }),
      l: 'm', sev: 'critical', sig: ['ens_homoglyph', 'name_not_normalized'], why: 'Le nom saisi differe visuellement de peu (caractere cyrillique, tiret Unicode, espace) et resout vers un autre compte.', approx: false });
  }
  // =============== destinataire de swap != soi ===============
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: pick(['app.uniswap.org', 'swap-aggregator.example']) }); const att = fact(ctx, newAddr(), EOA_NEW); const a = pick(AMTS); const sym = pick(SYMS);
    const eth = i % 2 === 0;
    add({ f: 'swap_destinataire', s: eth ? 'v2_swapExactETHForTokens_to_tiers' : 'v2_swapExactTokensForTokens_to_tiers', cat: C8, src: ['R4 §12', 'docs/intent-barrier.md'], ctx,
      req: eth ? tx(ctx, KP.routerV2.address, calldata('swapExactETHForTokens(uint256,address[],address,uint256)', [1, [TOK.WETH.addr, TOK[sym].addr], att, NOW + 900]), ETH(0.5))
        : tx(ctx, KP.routerV2.address, calldata('swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', [units(a, sym), 1, [TOK[sym].addr, TOK.WETH.addr], att, NOW + 900])),
      intent: intent('buy_or_swap', eth ? 'Je veux echanger 0,5 ETH contre des ' + sym : `Je veux echanger ${a} ${sym} contre de l'ETH`, { token: eth ? 'ETH' : sym, amount: eth ? '0.5' : String(a) }),
      l: 'm', sev: 'critical', sig: ['swap_recipient_not_self', 'incoming_absent'],
      why: "Le routeur est legitime et connu, mais le parametre 'to' est un tiers : la victime envoie et ne recoit rien.", approx: false });
  }
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'swap-aggregator.example' }); const att = fact(ctx, newAddr(), EOA_NEW); const sym = pick(SYMS); const a = pick(AMTS);
    add({ f: 'swap_destinataire', s: 'v3_exactInputSingle_recipient_tiers', cat: C8, src: ['R4 §12'], ctx,
      req: tx(ctx, KP.routerV3.address, calldata('exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))', [[TOK[sym].addr, TOK.WETH.addr, 3000, att, units(a, sym), 1, 0]])),
      intent: intent('buy_or_swap', `Je veux echanger ${a} ${sym} contre de l'ETH`, { token: sym, amount: String(a) }),
      l: 'm', sev: 'critical', sig: ['swap_recipient_not_self'], why: 'exactInputSingle avec recipient tiers (routeur connu).', approx: 'ExactInputSingleParams de SwapRouter02 de memoire (7 champs sans deadline)' });
  }
  // =============== slippage excessif ===============
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: pick(['app.uniswap.org', 'swap-aggregator.example']) }); const sym = pick(SYMS); const a = pick(AMTS) * 4; const out = i % 4 === 0 ? 0 : i % 4 === 1 ? 1 : Number(units(a * 0.4, sym));
    ctx.quote = { expected_out_units: String(units(a * 0.9995, sym)), oracle_deviation_pct: out === 0 ? 100 : out === 1 ? 100 : 60 };
    add({ f: 'slippage', s: out <= 1 ? 'minOut_0_ou_1' : 'minOut_60_pct_sous_cotation', cat: C8, src: ['R4 §13', 'R4 §14'], ctx,
      req: tx(ctx, KP.routerV2.address, calldata('swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', [units(a, sym), out, [TOK[sym].addr, TOK.USDC.addr === TOK[sym].addr ? TOK.DAI.addr : TOK.USDC.addr], ctx.victim, NOW + 900])),
      intent: intent('buy_or_swap', `Je veux echanger ${a} ${sym} contre des USDC`, { token: sym, amount: String(a) }),
      l: 'a', sev: 'warn', sig: ['slippage_excessive', 'sandwich_exposure'], why: 'Aucun minimum de sortie : sandwichable a perte quasi totale. Pas une usurpation mais un risque de vol MEV ; le contrat v3 ne contient pas de regle slippage (trou).', approx: false });
  }
  // =============== faux token ===============
  for (let i = 0; i < 5; i++) {
    const ctx = world({ origin: 'swap-aggregator.example' }); const fake = fact(ctx, newAddr(), { isContract: true, ageBlocks: 100, firstSeenByUser: true });
    ctx.token_info = { [fake.toLowerCase()]: { symbol: 'USDC', name: 'USD Coin', canonical: false, ageBlocks: 100, liquidityUsd: 0 } };
    add({ f: 'faux_token', s: 'swap_sortie_vers_faux_token_meme_symbole', cat: C7, src: ['R4 §7', 'R4 §11'], ctx,
      req: tx(ctx, KP.routerV2.address, calldata('swapExactETHForTokens(uint256,address[],address,uint256)', [1, [TOK.WETH.addr, fake], ctx.victim, NOW + 900]), ETH(1)),
      intent: intent('buy_or_swap', 'Je veux echanger 1 ETH contre des USDC', { token: 'ETH', amount: '1' }),
      l: 'm', sev: 'critical', sig: ['token_symbol_collision', 'token_address_not_canonical'], why: "Le jeton recu s'affiche 'USDC' mais son adresse n'est pas celle du USDC canonique : on ne juge jamais un jeton par son symbole.", approx: false });
  }
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'wallet-interface.local' }); const fake = fact(ctx, newAddr(), { isContract: true, ageBlocks: 60, firstSeenByUser: true });
    ctx.token_info = { [fake.toLowerCase()]: { symbol: 'USDT', name: 'Tether USD', canonical: false, ageBlocks: 60 } };
    add({ f: 'faux_token', s: 'paiement_en_faux_token_meme_symbole', cat: C7, src: ['R4 §7'], ctx,
      req: tx(ctx, fake, calldata('transfer(address,uint256)', [ctx._paul, units(200, 'USDT')])),
      intent: intent('pay_someone', 'Je paie Paul 200 USDT', { token: 'USDT', amount: '200', counterpartyLabel: 'Paul', counterpartyAddress: ctx._paul }),
      l: 'm', sev: 'critical', sig: ['token_symbol_collision', 'token_address_not_canonical'], why: "Le jeton a envoyer n'est pas le USDT canonique : Paul recevrait un faux jeton (ou l'utilisateur envoie un jeton de valeur differente).", approx: false });
  }
  // =============== honeypot ===============
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: pick(['trending-gems.example', 'swap-aggregator.example']) }); const hp = fact(ctx, newAddr(), { isContract: true, ageBlocks: 300, firstSeenByUser: true });
    ctx.token_info = { [hp.toLowerCase()]: { symbol: pick(['MOONX', 'PEPEAI', 'GEMZ']), canonical: false, ageBlocks: 300, sell_simulation: 'revert', buy_tax_pct: 0, sell_tax_pct: 100 } };
    add({ f: 'honeypot', s: 'vente_impossible_simulation_revert', cat: C7, src: ['R3 §14', 'R4 §8'], ctx,
      req: tx(ctx, KP.routerV2.address, calldata('swapExactETHForTokens(uint256,address[],address,uint256)', [1, [TOK.WETH.addr, hp], ctx.victim, NOW + 900]), ETH(0.3)),
      intent: intent('buy_or_swap', 'Je veux acheter ce jeton qui monte (0,3 ETH)', { token: 'ETH', amount: '0.3' }),
      l: 'm', sev: 'critical', sig: ['sell_simulation_fails', 'token_unsellable'], blind: true,
      why: "Le swap d'achat reussit et correspond a l'intention ; seule la simulation de la vente revele le piege. Invisible pour le comparateur intention/effets seul.", approx: false });
  }
  for (let i = 0; i < 2; i++) {
    const ctx = world({ origin: 'trending-gems.example' }); const hp = fact(ctx, newAddr(), { isContract: true, ageBlocks: 900, firstSeenByUser: true });
    ctx.token_info = { [hp.toLowerCase()]: { symbol: 'TAXY', canonical: false, ageBlocks: 900, sell_simulation: 'ok', buy_tax_pct: 5, sell_tax_pct: 95 } };
    add({ f: 'honeypot', s: 'taxe_de_vente_95_pct', cat: C7, src: ['R4 §9'], ctx,
      req: tx(ctx, KP.routerV2.address, calldata('swapExactETHForTokens(uint256,address[],address,uint256)', [1, [TOK.WETH.addr, hp], ctx.victim, NOW + 900]), ETH(0.3)),
      intent: intent('buy_or_swap', 'Je veux acheter ce jeton (0,3 ETH)', { token: 'ETH', amount: '0.3' }),
      l: 'a', sev: 'warn', sig: ['sell_tax_high'], blind: true, why: 'Vendable mais avec 95 % de taxe : quasi-honeypot, pas strictement impossible.', approx: false });
  }
  // =============== domaine sosie ===============
  const sosies = [
    ['typo', 'app.un1swap.example'], ['sous_domaine_trompeur', 'app.uniswap.org.claim-rewards.example'], ['tld_different', 'app.uniswap.xyz.example'], ['homoglyphe', 'app.uniѕwap.example'],
    ['tiret_ajoute', 'app-uniswap.example'], ['mot_ajoute', 'uniswap-airdrop.example'], ['typo', 'opensea-io.example'], ['homoglyphe', 'opеnsea.example'],
  ];
  const payloads = [
    (ctx) => tx(ctx, TOK.USDC.addr, APPROVE(fact(ctx, newAddr(), EOA_NEW))),
    (ctx) => tx(ctx, fact(ctx, newAddr(), CON_OLD), calldata('setApprovalForAll(address,bool)', [fact(ctx, newAddr(), EOA_NEW), true])),
    (ctx) => typed(ctx, { name: 'USD Coin', version: '2', chainId: ctx.chainId, verifyingContract: TOK.USDC.addr }, { Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] }, 'Permit', { owner: ctx.victim, spender: fact(ctx, newAddr(), EOA_NEW), value: MAXU, nonce: 0, deadline: 4102444800 }),
    (ctx) => tx(ctx, fact(ctx, newAddr(), CON_NEW(50)), calldata('Claim()', []), ETH(0.4)),
  ];
  for (let i = 0; i < 12; i++) {
    const [kind, dom] = sosies[i % sosies.length]; const ctx = world({ origin: dom }); ctx.claimed_site = i % 8 < 6 ? 'app.uniswap.org' : 'opensea.io';
    add({ f: 'domaine_sosie', s: kind, cat: C9, src: ['R5 §A1', 'R5 §A5', 'SYNTHESE §3.3 (usage modele : domaine sosie)'], ctx,
      req: payloads[i % payloads.length](ctx), intent: intent(i % 2 ? 'buy_or_swap' : 'connect_or_accept_offer', `Je vais sur ${ctx.claimed_site}`),
      l: 'm', sev: 'critical', sig: ['origin_lookalike_of_known_site', 'payload_grants_rights_or_sends'], why: `Origine sosie (${kind}) d'un site connu ; la charge reclame des droits ou envoie des fonds sans rapport avec le site vise.`, approx: false });
  }
  for (let i = 0; i < 3; i++) {
    const ctx = world({ origin: ['interface.uniswap.org', 'app.1inch.io', 'trade.cow.example-official.org'][i] });
    add({ f: 'domaine_sosie', s: 'benin_dur_site_legitime_premiere_visite', cat: 'benin', src: ['R5 §A5'], ctx, hard: true,
      req: tx(ctx, TOK.USDC.addr, APPROVE(KP.routerV3.address, units(100, 'USDC'))), intent: intent('buy_or_swap', 'Je veux echanger 100 USDC', { token: 'USDC', amount: '100' }),
      l: 'b', sev: 'ok', sig: ['origin_first_visit'], why: "Site legitime jamais visite : une alerte sur le seul fait que l'origine soit nouvelle serait un faux positif.", approx: false });
  }
  // =============== kit de drainer ===============
  const drs = [['claim()', []], ['SecurityUpdate()', []], ['Connect()', []], ['Verify(address)', null], ['claimRewards()', []], ['Airdrop()', []]];
  for (let i = 0; i < 12; i++) {
    const ctx = world({ origin: pick(['claim-rewards.example', 'security-update.example', 'mint-now.example']) }); const dr = fact(ctx, newAddr(), CON_NEW(pick([15, 60, 400])));
    const kind = i % 4;
    let req, subf;
    if (kind < 2) { const [sg, args] = drs[i % drs.length]; subf = 'payable_claim_valeur_elevee'; req = tx(ctx, dr, calldata(sg, args || [ctx.victim]), ETH(pick([0.8, 1.5, 4]))); }
    else if (kind === 2) { subf = 'calldata_opaque_contrat_jeune'; req = tx(ctx, dr, rndBytes(4) + rndBytes(96).slice(2)); }
    else { subf = 'envoi_eth_nu_pour_verifier'; req = tx(ctx, dr, '0x', ETH(pick([0.5, 2]))); }
    add({ f: 'kit_drainer', s: subf, cat: C9, src: ['K_drainers', 'R3 §3', 'R5 §B5'], ctx, req,
      intent: pick([CONN('Je reclame mon airdrop'), CONN('Je mets a jour la securite de mon wallet'), intent('asked_by_someone', 'Le site me demande de valider mon wallet', { askedBy: 'other' })]),
      l: 'm', sev: 'critical', sig: ['outflow_to_young_contract', 'unknown_selector_or_claim_name', 'intent_gap'],
      why: "Fonction de type 'claim/verify/security update' sur contrat jeune avec envoi de valeur : schema classique de kit de drainer ; aucune intention de paiement.", approx: 'selecteurs calcules depuis les noms (keccak local) ; noms typiques de memoire, sans lien avec un kit reel precis' });
  }
}

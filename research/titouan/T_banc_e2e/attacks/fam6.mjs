// fam6 : trafic benin realiste (swap routeur connu, envoi a un contact, depot exchange, mint NFT, nouveaux contrats legitimes). SYNTHETIQUE.
import { add, world, fact, EOA_NEW, CON_NEW, CON_OLD, intent, tx, TOK, KP, units, AMTS, SYMS, pick, ri, newAddr, calldata, MAXU, hex } from './core.mjs';
const NOW = 1760000000;
const ETH = (x) => BigInt(Math.round(x * 1e6)) * 10n ** 12n;

export function run() {
  // swap sur routeur connu
  for (let i = 0; i < 14; i++) {
    const ctx = world({ origin: pick(['app.uniswap.org', 'app.1inch.io']) }); const sym = pick(SYMS); const a = pick(AMTS); const form = i % 4;
    let req, it;
    if (form === 0) { req = tx(ctx, KP.routerV2.address, calldata('swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', [units(a, sym), units(a * 0.99 / 3000, 'WETH'), [TOK[sym].addr, TOK.WETH.addr], ctx.victim, NOW + 900])); it = intent('buy_or_swap', `Je veux echanger ${a} ${sym} contre de l'ETH`, { token: sym, amount: String(a) }); }
    else if (form === 1) { req = tx(ctx, KP.routerV2.address, calldata('swapExactETHForTokens(uint256,address[],address,uint256)', [units(0.5 * 2990, 'USDC'), [TOK.WETH.addr, TOK.USDC.addr], ctx.victim, NOW + 900]), ETH(0.5)); it = intent('buy_or_swap', 'Je veux echanger 0,5 ETH contre des USDC', { token: 'ETH', amount: '0.5' }); }
    else if (form === 2) { req = tx(ctx, KP.routerV3.address, calldata('exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))', [[TOK[sym].addr, TOK.WETH.addr, 500, ctx.victim, units(a, sym), units(a * 0.99 / 3000, 'WETH'), 0]])); it = intent('buy_or_swap', `Je veux echanger ${a} ${sym} contre de l'ETH`, { token: sym, amount: String(a) }); }
    else { req = tx(ctx, KP.routerV2.address, calldata('swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', [units(a, sym), units(a * 0.995, sym === 'USDC' ? 'USDT' : 'USDC'), [TOK[sym].addr, sym === 'USDC' ? TOK.USDT.addr : TOK.USDC.addr], ctx.victim, NOW + 900])); it = intent('buy_or_swap', `Je veux changer mes ${sym} en stablecoin`, { token: sym, amount: String(a) }); }
    add({ f: 'swap_connu', s: ['v2_tokens_vers_eth', 'v2_eth_vers_tokens', 'v3_exactInputSingle', 'v2_stable_stable'][form], cat: 'benin', src: ['R4 §12', 'docs/intent-barrier.md'], ctx, req, intent: it,
      l: 'b', sev: 'ok', sig: [], why: 'Swap sur routeur de la liste connue, destinataire = soi, minimum de sortie raisonnable.', approx: false });
  }
  // slippage normal
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'app.uniswap.org' }); const sym = pick(SYMS); const a = pick(AMTS) * 4;
    add({ f: 'slippage', s: 'benin_slippage_0_5_pct', cat: 'benin', src: ['R4 §13'], ctx,
      req: tx(ctx, KP.routerV2.address, calldata('swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', [units(a, sym), units(a * 0.995, sym === 'USDC' ? 'DAI' : 'USDC'), [TOK[sym].addr, sym === 'USDC' ? TOK.DAI.addr : TOK.USDC.addr], ctx.victim, NOW + 900])),
      intent: intent('buy_or_swap', `Je veux echanger ${a} ${sym}`, { token: sym, amount: String(a) }), l: 'b', sev: 'ok', sig: [], why: 'minOut = 99,5 % de la cotation.', approx: false });
  }
  // envoi a un contact
  for (let i = 0; i < 14; i++) {
    const ctx = world({ origin: 'wallet-interface.local' }); const to = i % 2 ? ctx._paul : ctx._mum; const lab = i % 2 ? 'Paul' : 'Maman'; const eth = i % 3 === 0; const sym = pick(SYMS); const a = eth ? pick([0.05, 0.2, 1]) : pick(AMTS);
    ctx.history = [{ address: to, token: eth ? 'ETH' : sym, amount: '50', direction: 'sortie', minutes_ago: 60 * 24 * 30, kind: 'reel' }];
    add({ f: 'envoi_contact', s: eth ? 'eth_vers_contact_connu' : 'erc20_vers_contact_connu', cat: 'benin', src: ['docs/intent-barrier.md', 'R4 §3'], ctx,
      req: eth ? tx(ctx, to, '0x', ETH(a)) : tx(ctx, TOK[sym].addr, calldata('transfer(address,uint256)', [to, units(a, sym)])),
      intent: intent('pay_someone', `J'envoie ${a} ${eth ? 'ETH' : sym} a ${lab}`, { token: eth ? 'ETH' : sym, amount: String(a), counterpartyLabel: lab, counterpartyAddress: to }),
      l: 'b', sev: 'ok', sig: [], why: 'Un seul transfert, token et montant dits, vers le contact choisi, deja utilise.', approx: false });
  }
  // depot exchange (certains cas durs : grosse part du solde)
  for (let i = 0; i < 8; i++) {
    const hard = i >= 6; const ctx = world({ origin: 'wallet-interface.local', extra: { share_of_balance_pct: hard ? 75 : 20 } }); const eth = i % 2 === 0; const sym = pick(SYMS); const a = eth ? (hard ? 5 : 1) : (hard ? 8000 : pick(AMTS));
    ctx.history = [{ address: ctx._exch, token: 'USDC', amount: '500', direction: 'sortie', minutes_ago: 60 * 24 * 60, kind: 'reel' }];
    add({ f: 'depot_exchange', s: hard ? 'benin_dur_gros_depot_70_pct_du_solde' : 'depot_vers_mon_exchange', cat: 'benin', src: ['R4 §6', 'docs/intent-barrier.md (send_to_my_account)'], ctx, hard,
      req: eth ? tx(ctx, ctx._exch, '0x', ETH(a)) : tx(ctx, TOK[sym].addr, calldata('transfer(address,uint256)', [ctx._exch, units(a, sym)])),
      intent: intent('send_to_my_account', `J'envoie ${a} ${eth ? 'ETH' : sym} vers mon Coinbase`, { token: eth ? 'ETH' : sym, amount: String(a), counterpartyLabel: 'Mon Coinbase', counterpartyAddress: ctx._exch }),
      l: 'b', sev: hard ? 'warn' : 'ok', sig: hard ? ['share_of_balance_gt_50'] : [], why: hard ? "Depot legitime d'une grande part du solde vers un exchange deja utilise : warn tolerable (part > 50 %), critical = faux positif." : 'Depot vers une adresse exchange deja utilisee par l\'utilisateur.', approx: false });
  }
  // mint NFT
  for (let i = 0; i < 10; i++) {
    const ctx = world({ origin: pick(['opensea.io', 'mint.collection-officielle.example-official.org']) }); const q = 1 + (i % 3);
    add({ f: 'mint_nft', s: 'mint_payable_collection_connue', cat: 'benin', src: ['R3 §3'], ctx,
      req: tx(ctx, KP.nftKnown.address, calldata('mint(uint256)', [q]), ETH(0.05 * q)),
      intent: intent('buy_or_swap', `Je mint ${q} NFT a 0,05 ETH piece`, { token: 'ETH', amount: String(0.05 * q) }),
      l: 'b', sev: 'ok', sig: [], why: 'Mint payable sur une collection de la liste connue, montant coherent avec l\'intention.', approx: 'selecteur mint(uint256) generique ; les collections reelles varient' });
  }
  // nouveaux contrats legitimes + autres cas durs
  for (let i = 0; i < 10; i++) {
    const ctx = world({ origin: pick(['app.aave.com', 'app.lido.example-official.org', 'app.ens.domains', 'bridge.example-official.org']) }); const form = i % 5;
    const sym = pick(SYMS); const a = pick(AMTS) * 2;
    const nc = fact(ctx, newAddr(), { isContract: true, ageBlocks: 2500000, firstSeenByUser: true, verified_source: true });
    let req, it, why, sev = 'warn';
    if (form === 0) { req = tx(ctx, nc, calldata('deposit(uint256,address)', [units(a, sym), ctx.victim])); it = intent('buy_or_swap', `Je depose ${a} ${sym} dans un nouveau coffre de rendement verifie`, { token: sym, amount: String(a) }); why = "Depot dans un coffre ancien (2,5 M blocs), source verifiee, jamais utilise par cet utilisateur : legitime, 'inconnu' tolere en warn."; }
    else if (form === 1) { req = tx(ctx, TOK.WETH.addr, calldata('deposit()', []), ETH(1)); it = intent('buy_or_swap', 'Je transforme 1 ETH en WETH', { token: 'ETH', amount: '1' }); why = 'Wrap ETH -> WETH, contrat canonique.'; sev = 'ok'; }
    else if (form === 2) { req = tx(ctx, KP.staking.address, calldata('submit(address)', ['0x0000000000000000000000000000000000000000']), ETH(2)); it = intent('buy_or_swap', 'Je place 2 ETH en staking liquide', { token: 'ETH', amount: '2' }); why = 'Staking sur protocole connu, montant dit.'; sev = 'ok'; }
    else if (form === 3) { req = tx(ctx, KP.bridge.address, calldata('depositETHTo(address,uint32,bytes)', [ctx.victim, 200000, '0x']), ETH(0.5)); it = intent('send_to_my_account', 'Je fais passer 0,5 ETH vers ma propre adresse sur L2 via le pont officiel', { token: 'ETH', amount: '0.5', counterpartyAddress: ctx.victim }); why = 'Pont officiel connu, destinataire = soi sur la chaine de destination.'; sev = 'ok'; }
    else { req = tx(ctx, KP.ens.address, calldata('register(string,address,uint256)', ['mon-nom-test', ctx.victim, 31536000]), ETH(0.01)); it = intent('buy_or_swap', "J'enregistre un nom de domaine pour un an", { token: 'ETH', amount: '0.01' }); why = 'Enregistrement ENS vers soi-meme, montant faible.'; sev = 'ok'; }
    add({ f: 'nouveau_contrat_legit', s: ['coffre_nouveau_jamais_utilise', 'wrap_eth', 'staking_liquide', 'pont_officiel_vers_soi', 'enregistrement_ens'][form], cat: 'benin', src: ['SYNTHESE §3.4', 'C L4 (nouveau fournisseur legitime)'], ctx, hard: true,
      req, intent: it, l: 'b', sev, sig: sev === 'warn' ? ['spender_or_target_first_seen'] : [], why, approx: 'selecteurs de ces fonctions de memoire (deposit/submit/depositETHTo/register) ; calculables mais arguments simplifies' });
  }
}

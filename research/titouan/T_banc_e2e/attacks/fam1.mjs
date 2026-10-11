// fam1 : droits de depense directs (approve, increaseAllowance, setApprovalForAll) + benins associes. SYNTHETIQUE.
import { add, world, fact, EOA_NEW, CON_NEW, CON_OLD, intent, tx, TOK, KP, units, AMTS, SYMS, pick, newAddr, calldata, MAXU } from './core.mjs';
const C1 = '1_droits_depense_directs';
const PAYINT = (ctx, sym, a) => intent('pay_someone', `Je paie Paul ${a} ${sym}`, { token: sym, amount: String(a), counterpartyLabel: 'Paul', counterpartyAddress: ctx._paul });

export function run() {
  // approve illimite vers compte externe (EOA)
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: pick(['app.uniswap.org', 'opensea.io', 'app.1inch.io']) }); const sym = pick(SYMS); const a = pick(AMTS);
    const sp = fact(ctx, newAddr(), EOA_NEW);
    const kind = i % 3;
    add({ f: 'approve_erc20', s: 'illimite_vers_eoa', cat: C1, src: ['R2 §2.1', 'R3 §12', 'docs/intent-barrier.md'], ctx,
      req: tx(ctx, TOK[sym].addr, calldata('approve(address,uint256)', [sp, MAXU])),
      intent: kind === 0 ? PAYINT(ctx, sym, a) : kind === 1 ? intent('connect_or_accept_offer', 'Je me connecte au site pour voir mon solde') : intent('buy_or_swap', `Je veux echanger ${a} ${sym} contre de l'ETH`, { token: sym, amount: String(a) }),
      l: 'm', sev: 'critical', sig: ['approval_unlimited', 'spender_is_eoa', 'intent_gap'],
      why: "approve(max uint256) vers un compte externe jamais vu : aucun protocole legitime ne demande cela ; ecart avec l'intention declaree." });
  }
  // approve borne vers EOA
  for (let i = 0; i < 6; i++) {
    const ctx = world(); const sym = pick(SYMS); const a = pick(AMTS); const sp = fact(ctx, newAddr(), EOA_NEW);
    add({ f: 'approve_erc20', s: 'borne_vers_eoa', cat: C1, src: ['R2 §2.1', 'docs/intent-barrier.md'], ctx,
      req: tx(ctx, TOK[sym].addr, calldata('approve(address,uint256)', [sp, units(a, sym)])),
      intent: i % 2 ? PAYINT(ctx, sym, a) : intent('connect_or_accept_offer', 'Je valide mon wallet sur le site'),
      l: 'm', sev: 'critical', sig: ['approval_to_eoa', 'intent_gap'],
      why: "Meme borne, un compte externe peut tirer le montant a tout moment (transferFrom) ; l'intention ne parle d'aucune approbation." });
  }
  // approve illimite vers contrat neuf
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: pick(['claim-rewards.example', 'app.uniswap.org', 'mint-now.example']) }); const sym = pick([...SYMS, 'WETH']); const a = pick(AMTS);
    const sp = fact(ctx, newAddr(), CON_NEW(pick([20, 300, 5000])));
    add({ f: 'approve_erc20', s: 'illimite_vers_contrat_neuf', cat: C1, src: ['R2 §2.1', 'R4 §16', 'docs/intent-barrier.md'], ctx,
      req: tx(ctx, TOK[sym].addr, calldata('approve(address,uint256)', [sp, MAXU])),
      intent: i % 2 ? intent('buy_or_swap', `Je veux echanger ${a} ${sym} contre une autre monnaie`, { token: sym, amount: String(a) }) : intent('connect_or_accept_offer', 'Je reclame mon airdrop'),
      l: 'm', sev: 'critical', sig: ['approval_unlimited', 'spender_young_contract', 'spender_not_allowlisted'],
      why: "approve illimite vers un contrat recent, absent de la liste de routeurs connus." });
  }
  // approve borne exact vers contrat inconnu, intention swap : ambigu
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: 'swap-new-dex.example' }); const sym = pick(SYMS); const a = pick(AMTS);
    const sp = fact(ctx, newAddr(), CON_NEW(pick([900, 2000, 15000])));
    add({ f: 'approve_erc20', s: 'borne_vers_contrat_inconnu', cat: C1, src: ['R2 §2.1', 'R1 §3'], ctx,
      req: tx(ctx, TOK[sym].addr, calldata('approve(address,uint256)', [sp, units(a, sym)])),
      intent: intent('buy_or_swap', `Je veux echanger ${a} ${sym}`, { token: sym, amount: String(a) }),
      l: 'a', sev: 'warn', sig: ['spender_not_allowlisted', 'bounded_exact'],
      why: 'approbation bornee au montant dit vers un contrat inconnu : peut etre un nouveau DEX legitime ou un drainer patient ; non tranchable sans reputation.' });
  }
  // increaseAllowance
  for (let i = 0; i < 8; i++) {
    const ctx = world(); const sym = pick(SYMS); const a = pick(AMTS);
    const eoa = i % 2 === 0; const sp = fact(ctx, newAddr(), eoa ? EOA_NEW : CON_NEW(200));
    const amt = i < 4 ? MAXU - 1n : units(a * 10, sym);
    add({ f: 'increase_allowance', s: eoa ? 'vers_eoa' : 'vers_contrat_neuf', cat: C1, src: ['R2 §2.1'], ctx,
      req: tx(ctx, TOK[sym].addr, calldata('increaseAllowance(address,uint256)', [sp, amt])),
      intent: i % 3 === 0 ? PAYINT(ctx, sym, a) : intent('connect_or_accept_offer', 'Je me connecte pour recevoir un cadeau'),
      l: 'm', sev: 'critical', sig: ['approval', 'selector_increaseAllowance', 'intent_gap'],
      why: "increaseAllowance contourne les filtres qui ne regardent que approve() ; droit accorde sans lien avec l'intention." });
  }
  // setApprovalForAll
  for (let i = 0; i < 10; i++) {
    const ctx = world({ origin: pick(['opensea.io', 'free-mint.example', 'blur.io', 'nft-claim.example']) });
    const col = fact(ctx, newAddr(), CON_OLD); const op = fact(ctx, newAddr(), i % 2 ? EOA_NEW : CON_NEW(80));
    add({ f: 'set_approval_for_all', s: i % 2 ? 'operateur_eoa' : 'operateur_contrat_neuf', cat: C1, src: ['R2 §2.6', 'R1 §3', 'R3 §3'], ctx,
      req: tx(ctx, col, calldata('setApprovalForAll(address,bool)', [op, true])),
      intent: pick([intent('connect_or_accept_offer', 'Je reclame mon NFT gratuit'), intent('connect_or_accept_offer', "J'accepte une offre sur mon NFT"), intent('buy_or_swap', 'Je veux acheter un NFT', { token: 'ETH' })]),
      l: 'm', sev: 'critical', sig: ['approval_for_all', 'operator_unknown', 'intent_gap'],
      why: "setApprovalForAll(true) donne l'acces a toute la collection a un operateur inconnu ; critique en tout etat de cause (R1)." });
  }
  // benin : revocations
  for (let i = 0; i < 3; i++) {
    const ctx = world({ origin: 'revoke.example-official.org' }); const sym = pick(SYMS); const sp = fact(ctx, newAddr(), CON_OLD);
    const isNft = i === 2;
    add({ f: 'approve_erc20', s: 'revocation', cat: 'benin', src: ['R2 §5'], ctx,
      req: isNft ? tx(ctx, fact(ctx, newAddr(), CON_OLD), calldata('setApprovalForAll(address,bool)', [sp, false])) : tx(ctx, TOK[sym].addr, calldata('approve(address,uint256)', [sp, 0n])),
      intent: intent('connect_or_accept_offer', 'Je revoque une ancienne autorisation pour me proteger'),
      l: 'b', sev: 'ok', sig: [], why: 'revocation (montant 0 / false) : reduit le risque, ne doit jamais etre bloquee.' });
  }
  // benin : approve borne vers routeur connu
  for (let i = 0; i < 10; i++) {
    const ctx = world(); const sym = pick(SYMS); const a = pick(AMTS); const r = pick([KP.routerV2, KP.routerV3, KP.universal]);
    add({ f: 'approve_erc20', s: 'borne_vers_routeur_connu', cat: 'benin', src: ['docs/intent-barrier.md', 'R4 §12'], ctx,
      req: tx(ctx, TOK[sym].addr, calldata('approve(address,uint256)', [r.address, units(a, sym)])),
      intent: intent('buy_or_swap', `Je veux echanger ${a} ${sym} contre de l'ETH`, { token: sym, amount: String(a) }),
      l: 'b', sev: 'ok', sig: [], why: 'approbation bornee au montant du swap vers un routeur de la liste connue.' });
  }
  // benin dur : approve illimite vers protocole connu
  const hardTargets = [KP.permit2, KP.aavePool, KP.vault, KP.routerV3, KP.universal, KP.permit2];
  for (let i = 0; i < 12; i++) {
    const ctx = world({ origin: pick(['app.uniswap.org', 'app.aave.com', 'app.1inch.io']) }); const sym = pick([...SYMS, 'WETH']); const t = hardTargets[i % hardTargets.length];
    add({ f: 'approve_erc20', s: 'illimite_legitime_protocole_connu', cat: 'benin', src: ['R2 §2.4', 'docs/intent-barrier.md'], ctx, hard: true,
      req: tx(ctx, TOK[sym].addr, calldata('approve(address,uint256)', [t.address, MAXU])),
      intent: t === KP.permit2 || t === KP.routerV3 || t === KP.universal ? intent('buy_or_swap', `Je veux echanger mes ${sym}`, { token: sym }) : intent('buy_or_swap', `Je depose mes ${sym} pour gagner du rendement`, { token: sym }),
      l: 'b', sev: 'warn', sig: ['approval_unlimited', 'spender_allowlisted'],
      why: 'approve illimite vers Permit2/protocole de pret connu : pratique tres courante et legitime ; un warn leger est acceptable, critical serait un faux positif.' });
  }
}

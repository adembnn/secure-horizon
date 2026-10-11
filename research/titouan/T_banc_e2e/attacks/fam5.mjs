// fam5 : parcours d'arnaque (faux support, faux remboursement, faux recruteur, pig butchering, urgence bancaire, faux proche, faux airdrop, faux concours). SYNTHETIQUE.
import { add, world, fact, EOA_NEW, CON_NEW, CON_OLD, intent, tx, typed, psignHex, TOK, KP, units, pick, ri, newAddr, rnd32, rndBytes, calldata, MAXU, hex } from './core.mjs';
import { MSG } from './scenarios.mjs';
const C11 = '11_parcours_conformes';
const ETH = (x) => BigInt(Math.round(x * 1e6)) * 10n ** 12n;
const T = {
  faux_support: { scen: 'S1', askedBy: 'support', sym: 'USDC', amts: [900, 2500, 6000], B: true,
    fr: { goal: (a, s) => `Je deplace mes ${a} ${s} vers le portefeuille securise`, asked: 'Le support Ledger me demande de deplacer mes fonds vers un portefeuille securise', contact: 'Support securise' },
    en: { goal: (a, s) => `Moving my ${a} ${s} to the safe wallet`, asked: 'Coinbase support asked me to move funds to a safe wallet', contact: 'Secure wallet' } },
  faux_remboursement: { scen: 'S2', askedBy: 'other', sym: 'USDT', amts: [150, 600, 1500], B: false,
    fr: { goal: (a, s) => `Je paie ${a} ${s} de frais pour debloquer mon remboursement`, asked: "Un cabinet de recouvrement me demande des frais pour debloquer mon remboursement", contact: 'Cabinet recouvrement' },
    en: { goal: (a, s) => `Paying ${a} ${s} fee to release my refund`, asked: 'A recovery firm asked me to pay a fee to release my refund', contact: 'Recovery firm' } },
  faux_recruteur: { scen: 'S3', askedBy: 'recruiter', sym: 'USDC', amts: [200, 450, 1200], B: false,
    fr: { goal: (a, s) => `Je verse ${a} ${s} de depot de verification pour mon nouveau poste`, asked: 'Mon recruteur me demande un depot de verification de wallet', contact: 'Tresorerie RH' },
    en: { goal: (a, s) => `Paying ${a} ${s} wallet verification deposit for my new job`, asked: 'My recruiter asked for a wallet verification deposit', contact: 'HR treasury' } },
  urgence_bancaire: { scen: 'S5', askedBy: 'support', sym: 'USDT', amts: [4000, 9000, 20000], B: true,
    fr: { goal: (a, s) => `Je mets ${a} ${s} a l'abri sur le coffre securise de ma banque`, asked: "Mon conseiller bancaire me dit de transferer mon epargne vers un coffre securise", contact: 'Coffre banque' },
    en: { goal: (a, s) => `Moving ${a} ${s} to my bank's secure vault`, asked: 'My bank advisor told me to transfer my savings to a secure vault', contact: 'Bank vault' } },
  faux_proche: { scen: 'S6', askedBy: 'friend', sym: 'USDT', amts: [300, 800, 1800], B: false,
    fr: { goal: (a, s) => `J'envoie ${a} ${s} a l'ami de mon fils qui avance l'argent`, asked: 'Mon fils (nouveau numero) me demande d\'envoyer de l\'argent a son ami', contact: 'Ami de mon fils' },
    en: { goal: (a, s) => `Sending ${a} ${s} to my son's friend who is covering for him`, asked: 'My son (new number) asked me to send money to his friend', contact: "Son's friend" } },
  faux_airdrop: { scen: 'S7', askedBy: 'other', sym: 'USDC', amts: [0, 0, 0], B: false,
    fr: { goal: () => 'Je reclame mon airdrop', asked: "Le compte officiel du projet m'a dit de reclamer mon airdrop", contact: 'Airdrop' },
    en: { goal: () => 'Claiming my airdrop', asked: 'The project official account told me to claim my airdrop', contact: 'Airdrop' } },
  faux_concours: { scen: 'S8', askedBy: 'other', sym: 'ETH', amts: [0.1, 0.5, 1], B: false,
    fr: { goal: (a, s) => `Je participe au concours en envoyant ${a} ${s}`, asked: "Un concours m'a demande d'envoyer pour valider ma participation", contact: 'Concours officiel' },
    en: { goal: (a, s) => `Entering the giveaway by sending ${a} ${s}`, asked: 'A giveaway asked me to send funds to validate my entry', contact: 'Official giveaway' } },
};

function sendTok(ctx, to, sym, a) { return sym === 'ETH' ? tx(ctx, to, '0x', ETH(a)) : tx(ctx, TOK[sym].addr, calldata('transfer(address,uint256)', [to, units(a, sym)])); }
function techPayload(ctx, att, famKey, j) {
  const opts = [
    () => ({ req: tx(ctx, TOK.USDC.addr, calldata('approve(address,uint256)', [att, MAXU])), s: 'approve_illimite_verification' }),
    () => ({ req: typed(ctx, { name: 'Permit2', chainId: ctx.chainId, verifyingContract: KP.permit2.address }, { PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] }, 'PermitSingle',
      { details: { token: TOK.USDC.addr, amount: (1n << 160n) - 1n, expiration: (1n << 48n) - 1n, nonce: 0 }, spender: att, sigDeadline: 4102444800 }), s: 'permit2_signature_verification' }),
    () => ({ req: { method: 'personal_sign', params: [rnd32(), ctx.victim] }, s: 'personal_sign_opaque_verification' }),
    () => ({ req: tx(ctx, fact(ctx, newAddr(), CON_OLD), calldata('setApprovalForAll(address,bool)', [att, true])), s: 'setApprovalForAll_verification' }),
    () => ({ req: tx(ctx, fact(ctx, newAddr(), CON_NEW(40)), calldata('claim()', []), ETH(0.2)), s: 'claim_payable' }),
  ];
  const k = famKey === 'faux_airdrop' ? [1, 4, 0, 3][j % 4] : famKey === 'faux_concours' ? [2, 1][j % 2] : [0, 1, 2, 3][(j + famKey.length) % 4];
  return opts[k]();
}

export function run() {
  for (const [fk, c] of Object.entries(T)) {
    const msgs = MSG[fk];
    // A : divulgue (asked_by_someone), malveillant, transfert d'un fort montant
    for (let j = 0; j < 3; j++) {
      const m = msgs[j % msgs.length]; const L = c[m.lang] ? c[m.lang] : c.fr; const ctx = world({ origin: 'wallet-interface.local', extra: { share_of_balance_pct: [60, 85, 95][j] } });
      const att = fact(ctx, newAddr(), EOA_NEW); const a = c.amts[j] || 1; const sym = c.sym;
      const noTransfer = fk === 'faux_airdrop';
      const t = noTransfer ? techPayload(ctx, att, fk, j) : { req: sendTok(ctx, att, sym, a), s: 'divulgue_asked_by_transfert' };
      add({ f: fk, s: noTransfer ? 'divulgue_asked_by_' + t.s : t.s, cat: C11, src: ['R5 §B' + (['faux_support', 'faux_remboursement', 'faux_recruteur'].includes(fk) ? 2 : 1), 'docs/intent-barrier.md (asked_by_someone)'], ctx, scen: c.scen, lang: m.lang,
        req: t.req, intent: intent('asked_by_someone', L.asked, { askedBy: c.askedBy, pastedMessage: m.t, token: sym, amount: String(a), counterpartyLabel: L.contact }),
        l: 'm', sev: 'critical', sig: ['asked_by_someone', 'outflow_or_right'], why: "La victime declare honnetement qu'un tiers lui demande l'action ; regle du contrat : aucun vrai support/conseiller/recruteur ne demande de deplacer des fonds ou de signer un droit.", approx: false });
    }
    // B : la victime croit deplacer vers son propre compte securise
    if (c.B) for (let j = 0; j < 2; j++) {
      const m = msgs[j % msgs.length]; const L = c[m.lang] ? c[m.lang] : c.fr; const ctx = world({ origin: 'wallet-interface.local', extra: { share_of_balance_pct: 90 } });
      const att = fact(ctx, newAddr(), EOA_NEW); const a = c.amts[2 - j]; const sym = c.sym;
      add({ f: fk, s: 'victime_croit_vers_son_propre_compte', cat: C11, src: ['R5 §B2', 'docs/intent-barrier.md (send_to_my_account)'], ctx, scen: c.scen, lang: m.lang,
        req: sendTok(ctx, att, sym, a), intent: intent('send_to_my_account', L.goal(a, sym), { token: sym, amount: String(a), counterpartyLabel: 'mon nouveau portefeuille', counterpartyAddress: att, pastedMessage: m.t }),
        l: 'm', sev: 'critical', sig: ['send_to_my_account_never_seen_destination', 'share_of_balance_gt_50'],
        why: "La victime croit envoyer vers SON compte, mais l'adresse n'a jamais ete utilisee par elle : regle send_to_my_account du contrat (destinataire jamais vu = critical).", approx: false });
    }
    // C : fraude conforme (pay_someone, nouveau contact choisi par la victime, intention honnete)
    for (let j = 0; j < 3; j++) {
      if (fk === 'faux_airdrop') break;
      const m = msgs[j % msgs.length]; const L = c[m.lang] ? c[m.lang] : c.fr; const share = [8, 55, 85][j]; const ctx = world({ origin: 'wallet-interface.local', extra: { share_of_balance_pct: share } });
      const att = fact(ctx, newAddr(), EOA_NEW); ctx.address_book.push({ label: L.contact, address: att, kind: 'eoa', added_minutes_ago: 3 }); const a = c.amts[j]; const sym = c.sym;
      add({ f: fk, s: 'fraude_conforme_pay_someone_nouveau_contact', cat: C11, src: ['R5 §B', 'R5 §3 (matrice parcours)', 'SYNTHESE §3.1'], ctx, scen: c.scen, lang: m.lang,
        req: sendTok(ctx, att, sym, a), intent: intent('pay_someone', L.goal(a, sym), { token: sym, amount: String(a), counterpartyLabel: L.contact, counterpartyAddress: att, pastedMessage: j === 2 ? m.t : undefined }),
        l: 'f', sev: share >= 50 ? 'warn' : 'ok', ideal: 'critical', sig: ['recipient_first_seen', 'share_of_balance'], blind: true,
        why: `Transfert LEGITIME vers un contact que la victime vient d'ajouter, montant exact, intention honnete, aucun ecart ; seuls signaux : destinataire neuf, part du solde (${share} %). Mesure ce qu'on ne sait pas attraper.`, approx: false });
    }
    // D : charge technique
    for (let j = 0; j < 2; j++) {
      const m = msgs[(j + 1) % msgs.length]; const L = c[m.lang] ? c[m.lang] : c.fr; const ctx = world({ origin: pick(['claim-rewards.example', 'wallet-verify.example']) }); const att = fact(ctx, newAddr(), EOA_NEW); const t = techPayload(ctx, att, fk, j + 1);
      add({ f: fk, s: 'charge_technique_' + t.s, cat: C11, src: ['R5 §B', 'R2 §2'], ctx, scen: c.scen, lang: m.lang,
        req: t.req, intent: intent('connect_or_accept_offer', fk === 'faux_airdrop' ? L.goal() : (m.lang === 'fr' ? 'Je valide la verification de mon wallet demandee' : 'Validating the wallet verification I was asked for'), { pastedMessage: m.t }),
        l: 'm', sev: 'critical', sig: ['right_or_opaque_signature', 'intent_gap'], why: "L'escroc fait signer un droit ou un message opaque sous couvert de verification ; ecart avec l'intention de se connecter.", approx: false });
    }
  }
  // =============== pig butchering : fraude conforme ===============
  const seq = [[100, 8], [300, 12], [1000, 25], [3000, 45], [5000, 62], [2000, 70], [800, 15], [150, 5], [7500, 82], [12000, 90]];
  for (let j = 0; j < seq.length; j++) {
    const [a, share] = seq[j]; const m = MSG.pig_butchering[j % 2]; const ctx = world({ origin: 'wallet-interface.local', extra: { share_of_balance_pct: share } });
    const toExch = j % 3 === 0; const dest = fact(ctx, newAddr(), toExch ? { ...EOA_NEW, exchange_deposit_address: true } : { isContract: true, ageBlocks: 200000, firstSeenByUser: j === 0 });
    if (j > 0) ctx.history.push({ address: dest, token: 'USDT', amount: String(seq[j - 1][0]), direction: 'sortie', minutes_ago: 60 * 24 * 3, kind: 'depot_precedent_plateforme' });
    ctx.address_book.push({ label: 'Plateforme investissement', address: dest, kind: toExch ? 'exchange_deposit' : 'platform_contract' });
    add({ f: 'pig_butchering', s: j === 9 ? 'fraude_conforme_frais_retrait_fictifs' : 'fraude_conforme_depots_croissants', cat: C11, src: ['R5 §B1', 'R5 §4', 'SYNTHESE §1 (>= 14 Md$)'], ctx, scen: 'S4', lang: m.lang,
      req: sendTok(ctx, dest, 'USDT', a), intent: intent('pay_someone', m.lang === 'fr' ? `Je depose ${a} USDT sur ma plateforme d'investissement` : `Depositing ${a} USDT on my investment platform`, { token: 'USDT', amount: String(a), counterpartyLabel: 'Plateforme investissement', counterpartyAddress: dest, pastedMessage: j % 4 === 0 ? m.t : undefined }),
      l: 'f', sev: share >= 50 ? 'warn' : 'ok', ideal: 'critical', blind: true, sig: ['share_of_balance', j === 0 ? 'recipient_first_seen' : 'repeated_deposits_growth'],
      why: `Depot ${j + 1}/10 d'une serie de virements legitimes vers une plateforme factice ; intention honnete, aucune difference intention/effet. Signaux independants seulement : ratio du solde (${share} %), progression des montants.`, approx: false });
  }
  for (let j = 0; j < 2; j++) {
    const m = MSG.pig_butchering[j]; const ctx = world({ origin: 'wallet-interface.local', extra: { share_of_balance_pct: 70 } }); const dest = fact(ctx, newAddr(), EOA_NEW);
    add({ f: 'pig_butchering', s: 'divulgue_asked_by_advisor', cat: C11, src: ['R5 §B1', 'docs/intent-barrier.md'], ctx, scen: 'S4', lang: m.lang,
      req: sendTok(ctx, dest, 'USDT', 5000), intent: intent('asked_by_someone', m.lang === 'fr' ? "Ma conseillere en investissement me demande de deposer 5 000 USDT" : 'My investment advisor asks me to deposit 5,000 USDT', { askedBy: 'advisor', pastedMessage: m.t, token: 'USDT', amount: '5000' }),
      l: 'm', sev: 'critical', sig: ['asked_by_someone'], why: "Si la victime divulgue honnetement l'origine conseiller, la regle asked_by_someone attrape ; c'est l'unique levier sur ce parcours.", approx: false });
  }
}

// fam3 : controle, roles, execution indirecte, 7702, 4337. SYNTHETIQUE.
import { add, world, fact, EOA_NEW, CON_NEW, CON_OLD, intent, tx, typed, psignHex, TOK, KP, units, AMTS, SYMS, pick, ri, newAddr, rnd32, rndBytes, calldata, MAXU, hex } from './core.mjs';
const C3 = '3_controle_et_roles', C4 = '4_execution_indirecte', C2 = '2_signatures_hors_chaine';
const NOW = 1760000000;
const CONN = (t) => intent('connect_or_accept_offer', t || 'Je me connecte au site');
const ZERO = '0x0000000000000000000000000000000000000000';
const MULTISEND_FULL = newAddr(); // MultiSend (non CallOnly) synthetique, permet l'appel delegue interne

function packMulti(items) { // operation(1) | to(20) | value(32) | len(32) | data
  return '0x' + items.map((it) => { const d = it.data.slice(2); return (it.op).toString(16).padStart(2, '0') + it.to.slice(2).toLowerCase() + BigInt(it.value || 0).toString(16).padStart(64, '0') + (d.length / 2).toString(16).padStart(64, '0') + d; }).join('');
}
const SAFETX = [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'data', type: 'bytes' }, { name: 'operation', type: 'uint8' }, { name: 'safeTxGas', type: 'uint256' }, { name: 'baseGas', type: 'uint256' }, { name: 'gasPrice', type: 'uint256' }, { name: 'gasToken', type: 'address' }, { name: 'refundReceiver', type: 'address' }, { name: 'nonce', type: 'uint256' }];
function safeTx(ctx, safe, to, data, op, value = 0n) {
  return typed(ctx, { chainId: ctx.chainId, verifyingContract: safe }, { SafeTx: SAFETX }, 'SafeTx',
    { to, value, data, operation: op, safeTxGas: 0, baseGas: 0, gasPrice: 0, gasToken: ZERO, refundReceiver: ZERO, nonce: ri(60) });
}
const APPROVE = (sp, v = MAXU) => calldata('approve(address,uint256)', [sp, v]);

export function run() {
  // =============== EIP-7702 (famille entiere tenue hors DEV) ===============
  const send7702 = (ctx, auth, data = '0x', to = null) => ({ method: 'eth_sendTransaction', params: [{ from: ctx.victim, to: to || ctx.victim, value: '0x0', data, type: '0x4', chainId: hex(ctx.chainId), authorizationList: auth.map((a) => ({ chainId: hex(a.chainId), address: a.address, nonce: hex(a.nonce) })) }] });
  for (let i = 0; i < 8; i++) {
    const ctx = world({ origin: pick(['claim-rewards.example', 'free-mint.example', 'app.uniswap.org']) }); const imp = fact(ctx, newAddr(), CON_NEW(i % 2 ? 60 : 4000));
    add({ f: 'eip7702', s: 'authorization_chain_id_0', cat: C3, src: ['R1 §3', 'R2 §2.15', 'R3 §8'], ctx,
      req: send7702(ctx, [{ chainId: 0, address: imp, nonce: ri(3) }], i % 2 ? '0x' : calldata('claim()', [])),
      intent: pick([CONN('Je reclame mon airdrop'), intent('buy_or_swap', 'Je veux echanger mes jetons'), intent('asked_by_someone', 'Le site me demande de mettre a niveau mon compte', { askedBy: 'other' })]),
      l: 'm', sev: 'critical', sig: ['eip7702_delegation', 'chain_id_0_replayable', 'delegate_not_allowlisted'],
      why: "Delegation 7702 avec chain_id=0 : valide sur toutes les chaines, rejouable ; le compte devient du code de l'attaquant (R1 : critical).", approx: 'format authorizationList non signe (le portefeuille signe lui-meme le tuple)' });
  }
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: pick(['claim-rewards.example', 'smart-wallet-upgrade.example']) }); const imp = fact(ctx, newAddr(), { ...CON_OLD, isProxy: true, upgradeable: true });
    add({ f: 'eip7702', s: 'delegue_mutable_proxy_upgradable', cat: C3, src: ['R1 §3', 'R3 §8'], ctx,
      req: send7702(ctx, [{ chainId: ctx.chainId, address: imp, nonce: ri(3) }]),
      intent: pick([CONN('Je passe a un compte intelligent'), intent('asked_by_someone', 'Le support me dit de mettre a niveau mon compte', { askedBy: 'support' })]),
      l: 'm', sev: 'critical', sig: ['eip7702_delegation', 'delegate_mutable', 'delegate_not_allowlisted'],
      why: "Delegation vers un proxy dont l'implementation peut etre changee apres signature : le code audite aujourd'hui n'est pas celui qui s'executera demain.", approx: true });
  }
  for (let i = 0; i < 5; i++) {
    const ctx = world({ origin: 'free-mint.example' }); const imp = fact(ctx, newAddr(), CON_NEW(40)); const sweeper = fact(ctx, newAddr(), EOA_NEW);
    add({ f: 'eip7702', s: 'delegation_plus_sweep_dans_meme_tx', cat: C3, src: ['R3 §8', 'R1 §3'], ctx,
      req: send7702(ctx, [{ chainId: ctx.chainId, address: imp, nonce: ri(3) }], calldata('execute((address,uint256,bytes)[])', [[[sweeper, units(1, 'WETH'), '0x']]])),
      intent: CONN('Je mets mon wallet a niveau'),
      l: 'm', sev: 'critical', sig: ['eip7702_delegation', 'delegate_unknown_contract', 'same_tx_sweep'],
      why: 'Delegation a un contrat jeune et appel immediat de sa fonction execute qui envoie des fonds a un tiers.', approx: true });
  }
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'smart-account.example-official.org' });
    add({ f: 'eip7702', s: 'benin_dur_delegation_implementation_connue', cat: 'benin', src: ['R1 §3', 'R2 §2.15'], ctx, hard: true,
      req: send7702(ctx, [{ chainId: ctx.chainId, address: KP.smartAcct.address, nonce: ri(3) }]),
      intent: CONN("J'active le compte intelligent de mon portefeuille"),
      l: 'b', sev: 'warn', sig: ['eip7702_delegation', 'delegate_allowlisted'],
      why: "Delegation vers une implementation connue/auditee, chain_id de la chaine courante : legitime ; warn (changement de nature du compte) tolerable, critical = faux positif. IntentKind v3 ne couvre pas ce besoin.", approx: true });
  }
  for (let i = 0; i < 2; i++) {
    const ctx = world({ origin: 'smart-account.example-official.org' });
    add({ f: 'eip7702', s: 'benin_revocation_delegation', cat: 'benin', src: ['R1 §3'], ctx, hard: true,
      req: send7702(ctx, [{ chainId: ctx.chainId, address: ZERO, nonce: ri(3) }]),
      intent: CONN('Je supprime la delegation de mon compte'), l: 'b', sev: 'ok', sig: [], why: "Delegation vers l'adresse zero = retour a un compte simple : reduit le risque.", approx: true });
  }

  // =============== multicall cache ===============
  const SEL_AGG3 = 'aggregate3((address,bool,bytes)[])';
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: pick(['app.uniswap.org', 'claim-rewards.example', 'mint-now.example']) }); const sym = pick(SYMS); const sp = fact(ctx, newAddr(), i % 2 ? EOA_NEW : CON_NEW(50));
    const a = pick(AMTS);
    const decoy = calldata('transfer(address,uint256)', [ctx._paul, units(1, sym)]);
    add({ f: 'multicall_cache', s: 'multicall3_aggregate3_approve_cache', cat: C4, src: ['R3 §1', 'SYNTHESE §3'], ctx,
      req: tx(ctx, KP.multicall3.address, calldata(SEL_AGG3, [[[TOK[sym].addr, false, decoy], [TOK[sym].addr, false, APPROVE(sp)]]])),
      intent: pick([intent('pay_someone', `Je paie Paul 1 ${sym}`, { token: sym, amount: '1', counterpartyLabel: 'Paul', counterpartyAddress: ctx._paul }), intent('buy_or_swap', `Je veux echanger ${a} ${sym}`, { token: sym, amount: String(a) })]),
      l: 'm', sev: 'critical', sig: ['nested_call_grants_approval', 'recursive_decode_required', 'intent_gap'],
      why: "Le premier appel est un petit transfert plausible ; le second approve illimite vers un tiers. Un decodeur de premier niveau ne voit que 'aggregate3' vers un contrat connu.", approx: false });
  }
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'free-mint.example' }); const col = fact(ctx, newAddr(), CON_OLD); const op = fact(ctx, newAddr(), EOA_NEW);
    add({ f: 'multicall_cache', s: 'multicall_selecteur_ac9650d8_setApprovalForAll', cat: C4, src: ['R3 §1', 'R3 §3'], ctx,
      req: tx(ctx, KP.routerV3.address, calldata('multicall(bytes[])', [[calldata('refundETH()', []), calldata('setApprovalForAll(address,bool)', [op, true])]])),
      intent: CONN('Je mint un NFT'),
      l: 'm', sev: 'critical', sig: ['nested_call_grants_approval', 'recursive_decode_required'],
      why: 'multicall(bytes[]) dont un sous-appel accorde setApprovalForAll ; appel a un contrat de la liste connue, charge cachee.', approx: 'le routeur reel ne relaie pas setApprovalForAll ; scenario construit pour tester le decodage recursif' });
  }
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: pick(['app.uniswap.org', 'claim-rewards.example']) }); const sym = pick(SYMS); const sp = fact(ctx, newAddr(), CON_NEW(70));
    add({ f: 'multicall_cache', s: 'wallet_sendCalls_lot_approve_cache', cat: C4, src: ['R3 §1', 'R2 §2.14'], ctx,
      req: { method: 'wallet_sendCalls', params: [{ version: '2.0.0', from: ctx.victim, chainId: hex(ctx.chainId), atomicRequired: true, calls: [
        { to: KP.routerV2.address, value: '0x0', data: calldata('swapExactETHForTokens(uint256,address[],address,uint256)', [1, [TOK.WETH.addr, TOK[sym].addr], ctx.victim, NOW + 900]) },
        { to: TOK[sym].addr, value: '0x0', data: APPROVE(sp) }] }] },
      intent: intent('buy_or_swap', 'Je veux acheter des USDC avec de l\'ETH', { token: 'ETH' }),
      l: 'm', sev: 'critical', sig: ['batch_call', 'nested_call_grants_approval', 'intent_gap'],
      why: 'Lot EIP-5792 : un swap attendu suivi dun approve illimite vers un tiers dans la meme demande atomique.', approx: 'forme exacte de wallet_sendCalls (version, atomicRequired, calls) de memoire, EIP-5792 evolue' });
  }
  // benins durs : multicall legitimes
  for (let i = 0; i < 12; i++) {
    const ctx = world({ origin: pick(['app.uniswap.org', 'app.1inch.io', 'app.aave.com']) }); const sym = pick(SYMS); const a = pick(AMTS);
    const form = i % 3;
    let req;
    if (form === 0) { // Multicall3 : approve borne vers routeur connu + swap
      req = tx(ctx, KP.multicall3.address, calldata(SEL_AGG3, [[[TOK[sym].addr, false, APPROVE(KP.routerV3.address, units(a, sym))], [KP.routerV3.address, false, calldata('exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))', [[TOK[sym].addr, TOK.WETH.addr, 500, ctx.victim, units(a, sym), 1, 0]])]]]));
    } else if (form === 1) { // routeur V3 : multicall(exactInputSingle + unwrapWETH9 vers soi)
      req = tx(ctx, KP.routerV3.address, calldata('multicall(uint256,bytes[])', [NOW + 900, [calldata('exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))', [[TOK[sym].addr, TOK.WETH.addr, 500, KP.routerV3.address, units(a, sym), 1, 0]]), calldata('unwrapWETH9(uint256,address)', [1, ctx.victim])]]));
    } else { // wallet_sendCalls : approve borne routeur connu + swap
      req = { method: 'wallet_sendCalls', params: [{ version: '2.0.0', from: ctx.victim, chainId: hex(ctx.chainId), atomicRequired: true, calls: [{ to: TOK[sym].addr, value: '0x0', data: APPROVE(KP.routerV2.address, units(a, sym)) }, { to: KP.routerV2.address, value: '0x0', data: calldata('swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', [units(a, sym), 1, [TOK[sym].addr, TOK.WETH.addr], ctx.victim, NOW + 900]) }] }] };
    }
    add({ f: 'multicall_cache', s: 'benin_dur_multicall_legitime_' + ['multicall3', 'routeur_v3', 'sendCalls'][form], cat: 'benin', src: ['R3 §1', 'SYNTHESE §2 (34 % des tx legitimes invisibles au premier niveau)'], ctx, hard: true,
      req, intent: intent('buy_or_swap', `Je veux echanger ${a} ${sym} contre de l'ETH`, { token: sym, amount: String(a) }),
      l: 'b', sev: 'ok', ideal: 'ok', sig: ['nested_call', 'recursive_decode_required'],
      why: "Multicall legitime : approve borne vers routeur connu + swap dont le destinataire est soi ; une alerte critical serait un faux positif typique du decodage recursif.", approx: 'sous-appels de swap (exactInputSingle/unwrapWETH9) d\'apres SwapRouter02 de memoire' });
  }

  // =============== MultiSend / delegatecall et Safe execTransaction ===============
  const execSig = 'execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)';
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: 'app.safe.global', extra: { signer_role: 'owner de Safe' } }); const safe = fact(ctx, newAddr(), CON_OLD); const evilImpl = fact(ctx, newAddr(), CON_NEW(100));
    const data = calldata('transfer(address,uint256)', [newAddr(), units(1, 'USDC')]);
    add({ f: 'safe_execution', s: 'execTransaction_operation_1_vers_contrat_inconnu', cat: C3, src: ['R1 §1', 'R1 §3', 'R5 §A5'], ctx,
      req: i % 2 ? safeTx(ctx, safe, evilImpl, data, 1) : tx(ctx, safe, calldata(execSig, [evilImpl, 0, data, 1, 0, 0, 0, ZERO, ZERO, rndBytes(65)])),
      intent: intent('pay_someone', 'Je valide le virement de 1 USDC depuis notre Safe', { token: 'USDC', amount: '1' }),
      l: 'm', sev: 'critical', sig: ['safe_delegatecall', 'operation_1', 'target_not_allowlisted'],
      why: "operation=1 (delegatecall) vers un contrat inconnu : le code de l'attaquant s'execute avec le stockage du Safe (modele Bybit) ; l'interface peut afficher un simple transfert.", approx: 'domaine SafeTx v1.3 (chainId, verifyingContract) et champs de memoire' });
  }
  for (let i = 0; i < 6; i++) {
    const ctx = world({ origin: 'app.safe.global' }); const safe = fact(ctx, newAddr(), CON_OLD); const evil = fact(ctx, newAddr(), CON_NEW(100)); const sp = newAddr();
    const inner = [{ op: 0, to: TOK.USDC.addr, data: calldata('transfer(address,uint256)', [ctx._paul, units(10, 'USDC')]) }, { op: i % 2 ? 1 : 0, to: i % 2 ? evil : TOK.USDC.addr, data: i % 2 ? '0x' : APPROVE(sp) }];
    const ms = calldata('multiSend(bytes)', [packMulti(inner)]);
    add({ f: 'multisend_delegatecall', s: i % 2 ? 'multisend_appel_delegue_interne' : 'multisend_approve_cache', cat: C4, src: ['R3 §1', 'R3 §2', 'R1 §1'], ctx,
      req: safeTx(ctx, safe, i % 2 ? MULTISEND_FULL : KP.multisend.address, ms, i % 2 ? 1 : 0),
      intent: intent('pay_someone', 'Je valide le paiement de 10 USDC a Paul depuis le Safe', { token: 'USDC', amount: '10', counterpartyLabel: 'Paul', counterpartyAddress: ctx._paul }),
      l: 'm', sev: 'critical', sig: ['multisend_inner_decode', i % 2 ? 'inner_delegatecall' : 'inner_approval'],
      why: 'Lot MultiSend dont le 2e element est ' + (i % 2 ? 'un appel delegue vers un contrat inconnu' : 'un approve illimite vers un tiers') + ' ; le premier est un paiement legitime.', approx: 'encodage packed de multiSend (operation|to|value|len|data) de memoire, MultiSend non-CallOnly synthetique' });
  }
  for (let i = 0; i < 5; i++) {
    const ctx = world({ origin: 'app.safe.global' }); const safe = fact(ctx, newAddr(), CON_OLD);
    const bundle = i >= 3;
    const ms = calldata('multiSend(bytes)', [packMulti([{ op: 0, to: TOK.USDC.addr, data: calldata('transfer(address,uint256)', [ctx._paul, units(100, 'USDC')]) }, { op: 0, to: TOK.USDT.addr, data: calldata('transfer(address,uint256)', [ctx._paul, units(100, 'USDT')]) }])]);
    add({ f: 'safe_execution', s: bundle ? 'benin_dur_multisend_canonique_op1' : 'benin_transfert_op0', cat: 'benin', src: ['R1 §2', 'R3 §1'], ctx, hard: bundle,
      req: bundle ? safeTx(ctx, safe, KP.multisend.address, ms, 1) : safeTx(ctx, safe, TOK.USDC.addr, calldata('transfer(address,uint256)', [ctx._paul, units(100, 'USDC')]), 0),
      intent: intent('pay_someone', bundle ? 'Je paie Paul 100 USDC et 100 USDT depuis le Safe' : 'Je paie Paul 100 USDC depuis le Safe', { token: 'USDC', amount: '100', counterpartyLabel: 'Paul', counterpartyAddress: ctx._paul }),
      l: 'b', sev: bundle ? 'warn' : 'ok', sig: bundle ? ['safe_delegatecall', 'target_allowlisted_multisend'] : [],
      why: bundle ? "operation=1 vers le MultiSend canonique est le mode NORMAL d'un lot Safe ; seul le delegatecall hors allowlist est critique." : 'Transfert simple op=0 depuis le Safe.', approx: true });
  }

  // =============== controle_admin (ownable / roles / proxy) ===============
  const adminPick = [
    ['transferOwnership', (c, a) => ['transferOwnership(address)', [a]]],
    ['grantRole_admin', (c, a) => ['grantRole(bytes32,address)', ['0x' + '00'.repeat(32), a]]],
    ['upgradeTo', (c, a) => ['upgradeTo(address)', [a]]],
    ['upgradeToAndCall', (c, a) => ['upgradeToAndCall(address,bytes)', [a, calldata('initialize()', [])]]],
  ];
  for (let i = 0; i < 12; i++) {
    const ctx = world({ origin: pick(['dao-dashboard.example', 'claim-rewards.example', 'app.safe.global']) }); const tgt = fact(ctx, newAddr(), { ...CON_OLD, victimIsOwner: true }); const att = fact(ctx, newAddr(), i % 3 ? EOA_NEW : CON_NEW(30));
    const [nm, f] = adminPick[i % 4]; const [sig, args] = f(ctx, att);
    add({ f: 'controle_admin', s: nm, cat: C3, src: ['R1 §1', 'R1 §3'], ctx,
      req: tx(ctx, tgt, calldata(sig, args)),
      intent: pick([intent('asked_by_someone', 'Le support de la plateforme me demande de valider une mise a jour de securite', { askedBy: 'support' }), CONN('Je me connecte au tableau de bord'), intent('pay_someone', 'Je paie Paul 10 USDC', { token: 'USDC', amount: '10', counterpartyLabel: 'Paul', counterpartyAddress: ctx._paul })]),
      l: 'm', sev: 'critical', sig: ['durable_control_change', 'new_controller_unknown'],
      why: nm + " vers une adresse inconnue : changement durable de controle sans deplacement de fonds visible (R1 : critical).", approx: false });
  }
  for (let i = 0; i < 2; i++) {
    const ctx = world({ origin: 'claim-rewards.example' }); const tgt = fact(ctx, newAddr(), { ...CON_OLD, victimIsOwner: true });
    add({ f: 'controle_admin', s: 'renounceOwnership', cat: C3, src: ['R1 §3'], ctx,
      req: tx(ctx, tgt, calldata('renounceOwnership()', [])), intent: CONN('Je valide pour recevoir ma recompense'),
      l: 'm', sev: 'critical', sig: ['durable_control_change', 'irreversible'], why: 'renounceOwnership : perte definitive du controle (R1 : critical).', approx: false });
  }
  for (let i = 0; i < 3; i++) {
    const ctx = world({ origin: 'app.safe.global' }); const tgt = fact(ctx, newAddr(), { ...CON_OLD, victimIsOwner: true });
    add({ f: 'controle_admin', s: 'benin_dur_transferOwnership_vers_adresse_connue', cat: 'benin', src: ['R1 §3'], ctx, hard: true,
      req: tx(ctx, tgt, calldata('transferOwnership(address)', [ctx._mum])), intent: CONN("Je transfere la propriete de mon contrat a mon coffre personnel (adresse connue)"),
      l: 'b', sev: 'warn', sig: ['durable_control_change', 'new_controller_in_address_book'],
      why: "transferOwnership vers une adresse du carnet : legitime, warn selon R1 ; IntentKind v3 ne couvre pas les operations d'administration (trou du contrat).", approx: false });
  }

  // =============== safe_gouvernance (module/guard/threshold/owner) via SafeTx ===============
  const govs = [
    ['enableModule', (a) => calldata('enableModule(address)', [a])],
    ['setGuard', (a) => calldata('setGuard(address)', [a])],
    ['changeThreshold_a_1', () => calldata('changeThreshold(uint256)', [1])],
    ['addOwnerWithThreshold_seuil_1', (a) => calldata('addOwnerWithThreshold(address,uint256)', [a, 1])],
    ['swapOwner', (a) => calldata('swapOwner(address,address,address)', ['0x0000000000000000000000000000000000000001', newAddr(), a])],
    ['setFallbackHandler', (a) => calldata('setFallbackHandler(address)', [a])],
  ];
  for (let i = 0; i < 18; i++) {
    const ctx = world({ origin: pick(['app.safe.global', 'safe-ui-update.example']) }); const safe = fact(ctx, newAddr(), CON_OLD); const att = fact(ctx, newAddr(), i % 3 ? EOA_NEW : CON_NEW(20));
    const [nm, f] = govs[i % govs.length];
    add({ f: 'safe_gouvernance', s: nm, cat: C3, src: ['R1 §1', 'R1 §3', 'C E5'], ctx,
      req: safeTx(ctx, safe, safe, f(att), 0),
      intent: pick([intent('pay_someone', 'Je valide un petit paiement depuis le Safe', { token: 'USDC', amount: '5' }), intent('asked_by_someone', 'Un collegue me demande de signer une mise a jour du Safe', { askedBy: 'other' }), CONN('Je signe pour la maintenance')]),
      l: 'm', sev: 'critical', sig: ['durable_control_change', 'safe_self_call', 'precursor_governance'],
      why: nm + ' signe via SafeTx a destination du Safe lui-meme : precurseur de gouvernance (C E5), le drain suit plus tard.', approx: 'SafeTx de memoire ; swapOwner : prevOwner sentinelle 0x..01' });
  }
  for (let i = 0; i < 2; i++) {
    const ctx = world({ origin: 'app.safe.global' }); const safe = fact(ctx, newAddr(), CON_OLD);
    add({ f: 'safe_gouvernance', s: 'benin_dur_ajout_cosignataire_connu', cat: 'benin', src: ['R1 §2'], ctx, hard: true,
      req: safeTx(ctx, safe, safe, calldata('addOwnerWithThreshold(address,uint256)', [ctx._mum, 2]), 0), intent: CONN("J'ajoute ma mere comme cosignataire de mon Safe (seuil 2)"),
      l: 'b', sev: 'warn', sig: ['durable_control_change', 'new_controller_in_address_book'],
      why: "Ajout d'un cosignataire du carnet avec seuil 2 : operation de gouvernance normale ; warn, pas critical. IntentKind v3 ne couvre pas ce besoin.", approx: true });
  }

  // =============== ERC-4337 ===============
  const UOP_T = { PackedUserOperation: [{ name: 'sender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'initCode', type: 'bytes' }, { name: 'callData', type: 'bytes' }, { name: 'accountGasLimits', type: 'bytes32' }, { name: 'preVerificationGas', type: 'uint256' }, { name: 'gasFees', type: 'bytes32' }, { name: 'paymasterAndData', type: 'bytes' }] };
  const uop = (ctx, cd) => typed(ctx, { name: 'ERC4337', version: '1', chainId: ctx.chainId, verifyingContract: '0x0000000071727De22E5E9d8BAf0edAc6f37da032' }, UOP_T, 'PackedUserOperation',
    { sender: ctx.victim, nonce: ri(5), initCode: '0x', callData: cd, accountGasLimits: '0x' + '00'.repeat(32), preVerificationGas: 50000, gasFees: '0x' + '00'.repeat(32), paymasterAndData: '0x' });
  for (let i = 0; i < 5; i++) {
    const ctx = world({ origin: pick(['smart-wallet.example', 'claim-rewards.example', 'app.uniswap.org']) });
    const shady = i < 3;
    add({ f: 'erc4337_userop', s: 'userOpHash_personal_sign_opaque', cat: C3, src: ['R3 §7', 'R1 §1'], ctx,
      req: psignHex(ctx, rnd32()), intent: CONN('Je me connecte a mon compte intelligent'),
      l: shady ? 'm' : 'a', sev: shady ? 'critical' : 'warn', sig: ['userop_hash_opaque'],
      why: shady ? "Signature d'un hash opaque (userOpHash) demandee par un site sans rapport : impossible a decoder, equivalent d'un eth_sign." : "Hash opaque demande par un site connu de comptes intelligents : legitime en pratique mais non verifiable.", approx: false });
  }
  for (let i = 0; i < 5; i++) {
    const ctx = world({ origin: pick(['smart-wallet.example', 'claim-rewards.example']) }); const sp = fact(ctx, newAddr(), EOA_NEW);
    add({ f: 'erc4337_userop', s: 'callData_execute_approve_cache', cat: C3, src: ['R3 §7'], ctx,
      req: uop(ctx, calldata('execute(address,uint256,bytes)', [TOK.USDC.addr, 0, APPROVE(sp)])), intent: CONN('Je valide mon compte intelligent'),
      l: 'm', sev: 'critical', sig: ['userop_calldata_decode', 'approval', 'intent_gap'],
      why: "PackedUserOperation dont callData execute(token,0,approve(tiers,max)) : l'approbation est dans callData, invisible sans decodage de l'operation.", approx: 'PackedUserOperation v0.7 (typed data dependant du compte) de memoire ; EntryPoint 0x...da032 [V]' });
  }
  for (let i = 0; i < 3; i++) {
    const ctx = world({ origin: 'claim-rewards.example' }); const att = newAddr();
    add({ f: 'erc4337_userop', s: 'callData_executeBatch_drain', cat: C3, src: ['R3 §7'], ctx,
      req: uop(ctx, calldata('executeBatch(address[],uint256[],bytes[])', [[TOK.USDC.addr, TOK.USDT.addr], [0, 0], [calldata('transfer(address,uint256)', [att, units(5000, 'USDC')]), calldata('transfer(address,uint256)', [att, units(5000, 'USDT')])]])),
      intent: CONN('Je me connecte'), l: 'm', sev: 'critical', sig: ['userop_calldata_decode', 'outflow_to_unknown'],
      why: 'executeBatch envoie deux tokens a un tiers : sortie invisible si on ne decode pas callData.', approx: true });
  }
  for (let i = 0; i < 4; i++) {
    const ctx = world({ origin: 'smart-wallet.example-official.org' });
    add({ f: 'erc4337_userop', s: 'benin_dur_userop_transfert_contact', cat: 'benin', src: ['R3 §7'], ctx, hard: true,
      req: uop(ctx, calldata('execute(address,uint256,bytes)', [TOK.USDC.addr, 0, calldata('transfer(address,uint256)', [ctx._paul, units(50, 'USDC')])])),
      intent: intent('pay_someone', 'Je paie Paul 50 USDC', { token: 'USDC', amount: '50', counterpartyLabel: 'Paul', counterpartyAddress: ctx._paul }),
      l: 'b', sev: 'ok', sig: ['userop_calldata_decode'], why: "UserOp legitime : callData decodee = transfert de 50 USDC au contact choisi.", approx: true });
  }
}

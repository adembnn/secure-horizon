// Génère attacks_decalage/DECALAGE.jsonl : cas de « décalage » (la demande est banale pour un portefeuille mais ne correspond pas à l'intention écrite)
// et leurs jumeaux bénins (même forme, effet conforme à l'intention). Tout est fabriqué localement : calldata encodé par le moteur, messages typés
// construits ici, adresses dérivées d'un hachage (aucune donnée personnelle, aucune clef, aucun appel réseau). Déterministe (graine fixe).
//   node attacks_decalage/gen_decalage.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { call } from '../engine/src/abi_encode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED = 20261011;
const MAXU = (1n << 256n) - 1n;
const NOW = 1760000000000;
const DEADLINE = 1760003600;

// PRNG déterministe
let st = SEED >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const addr = (tag) => '0x' + createHash('sha256').update('decalage:' + SEED + ':' + tag).digest('hex').slice(0, 40);

// jetons publics (adresses canoniques Ethereum) : données de contexte, pas des règles
const TOK = {
  USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  DAI: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
};
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const RATE = { USDC: 1, USDT: 1, DAI: 1, WETH: 1 / 3000, WAVAX: 1 / 30 }; // unités du jeton pour 1 USD
const units = (sym, human) => BigInt(Math.round(human * 10 ** Math.min(TOK[sym].decimals, 9))) * 10n ** BigInt(Math.max(0, TOK[sym].decimals - 9));
const out = (sym, human, fromSym) => units(sym, (human * RATE[sym]) / RATE[fromSym] * 0.99);

const V2 = 'swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)';
const V2ETH = 'swapExactETHForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)';
const V3 = 'exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)';
const APPROVE = 'approve(address spender,uint256 amount)';
const TRANSFER = 'transfer(address to,uint256 amount)';
const SAFA = 'setApprovalForAll(address operator,bool approved)';

const cases = [];
const counters = {};

function baseCtx(id, v) {
  return {
    chainId: v.chain || 1, origin: v.origin, victim: v.me,
    address_book: [{ label: 'Paul', address: v.paul, kind: 'eoa' }, { label: 'Maman', address: v.maman, kind: 'eoa' }],
    known_protocols: [
      { label: 'Permit2 (canonique)', address: PERMIT2, provenance: 'R[V]' },
      { label: 'Routeur swap V2 (connu)', address: v.routerV2, provenance: 'S' },
      { label: 'Routeur swap V3 (connu)', address: v.routerV3, provenance: 'S' },
      { label: 'Collection NFT (connue)', address: v.nftKnown, provenance: 'S' },
    ],
    token_registry: Object.entries(TOK).map(([symbol, t]) => ({ symbol, address: t.address, decimals: t.decimals, canonical: true })),
    history: [{ address: v.paul, minutes_ago: 4000, direction: 'sortie', amount: '20' }],
    counterparty_facts: { [v.unknownC]: { isContract: true, firstSeenByUser: true, ageBlocks: 9000 }, [v.unknownE]: { isContract: false, firstSeenByUser: true } },
  };
}
function actors(fam, i) {
  const t = `${fam}:${i}`;
  return {
    me: addr(t + ':me'), paul: addr(t + ':paul'), maman: addr(t + ':maman'), routerV2: addr(t + ':v2'), routerV3: addr(t + ':v3'), nftKnown: addr(t + ':nft'),
    unknownC: addr(t + ':unkc'), unknownE: addr(t + ':unke'), third: addr(t + ':third'),
    origin: pick(['dex-demo.example', 'swap-demo.example', 'app-demo.example', 'exchange-demo.example']),
  };
}

function add({ fam, sub, label, ideal, request, intent, v, note }) {
  counters[fam] = (counters[fam] || 0) + 1;
  const id = `DEC-${fam}-${String(counters[fam]).padStart(3, '0')}`;
  const c = baseCtx(id, v);
  cases.push({
    id, synthetic: true, notice: 'SYNTHETIQUE : cas de décalage fabriqué localement, aucune donnée personnelle, jamais à utiliser contre un système ou un utilisateur réel',
    family: fam, subfamily: sub, request, context: c, intent: { declaredAt: NOW, ...intent },
    label, ideal_severity: ideal, mismatch: label === 'malveillant', note,
  });
}
const tx = (v, to, data, value = '0x0') => ({ method: 'eth_sendTransaction', params: [{ from: v.me, to, value, data, chainId: '0x' + (v.chain || 1).toString(16) }] });
const calls = (v, list) => ({ method: 'wallet_sendCalls', params: [{ from: v.me, chainId: '0x' + (v.chain || 1).toString(16), calls: list.map(([to, data, value]) => ({ to, data, value: value || '0x0' })) }] });
const typed = (v, td) => ({ method: 'eth_signTypedData_v4', params: [v.me, JSON.stringify(td)] });
const permit2612 = (v, tokSym, spender, value) => ({
  types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
    Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
  primaryType: 'Permit', domain: { name: tokSym, version: '1', chainId: 1, verifyingContract: TOK[tokSym].address },
  message: { owner: v.me, spender, value: value.toString(), nonce: 3, deadline: DEADLINE + 90000000 },
});
const permit2Single = (tokSym, spender, amount) => ({
  types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
    PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }],
    PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] },
  primaryType: 'PermitSingle', domain: { name: 'Permit2', chainId: 1, verifyingContract: PERMIT2 },
  message: { details: { token: TOK[tokSym].address, amount: amount.toString(), expiration: String(1760000000 + 86400 * 30), nonce: 0 }, spender, sigDeadline: DEADLINE },
});
const MAX160 = (1n << 160n) - 1n;
const hexUtf8 = (s) => '0x' + Buffer.from(s, 'utf8').toString('hex');
const siwe = (v, domain) => hexUtf8(`${domain} wants you to sign in with your Ethereum account:\n${v.me}\n\nSe connecter.\n\nURI: https://${domain}\nVersion: 1\nChain ID: 1\nNonce: ${Math.floor(rnd() * 1e15).toString(16).padStart(12, 'a')}\nIssued At: 2025-10-09T08:00:00.000Z`);
const personal = (v, hex) => ({ method: 'personal_sign', params: [hex, v.me] });

const AMTS = [25, 50, 100, 250, 500, 1000];
const intentSwap = (amt, from = 'USDC', to = 'WETH') => ({ kind: 'buy_or_swap', freeText: `Échanger ${amt} ${from} contre du ${to}`, token: from, amount: String(amt), receiveToken: to });
const swapTx = (v, amt, from, to, recipient, router = v.routerV2) => tx(v, router, call(V2, [units(from, amt), out(to, amt, from), [TOK[from].address, TOK[to].address], recipient, DEADLINE]));

// ---------------------------------------------------------------- F1 : échanger N -> droit illimité (ou bien plus large que N)
for (let i = 0; i < 40; i++) {
  const v = actors('droit', i), amt = pick(AMTS), it = intentSwap(amt);
  const kind = i % 8;
  const spenderU = kind === 1 ? v.unknownE : v.unknownC;
  const r = { fam: 'swap_droit_illimite', label: 'malveillant', v, intent: it };
  if (kind === 0 || kind === 1) add({ ...r, sub: kind === 0 ? 'approve_max_contrat_inconnu' : 'approve_max_compte_externe', ideal: 'critical', request: tx(v, TOK.USDC.address, call(APPROVE, [spenderU, MAXU])) });
  else if (kind === 2) add({ ...r, sub: 'approve_max_routeur_connu', ideal: 'warn', request: tx(v, TOK.USDC.address, call(APPROVE, [v.routerV2, MAXU])), note: 'banal pour un portefeuille, mais N est dit' });
  else if (kind === 3) add({ ...r, sub: 'permit2_max_spender_inconnu', ideal: 'critical', request: typed(v, permit2Single('USDC', v.unknownC, MAX160)) });
  else if (kind === 4) add({ ...r, sub: 'permit2612_max_spender_inconnu', ideal: 'critical', request: typed(v, permit2612(v, 'USDC', v.unknownC, MAXU)) });
  else if (kind === 5) add({ ...r, sub: 'lot_approve_max_routeur_connu_plus_swap', ideal: 'warn', request: calls(v, [[TOK.USDC.address, call(APPROVE, [v.routerV2, MAXU])], [v.routerV2, call(V2, [units('USDC', amt), out('WETH', amt, 'USDC'), [TOK.USDC.address, TOK.WETH.address], v.me, DEADLINE])]]) });
  else if (kind === 6) add({ ...r, sub: 'approve_dix_fois_routeur_connu', ideal: 'warn', request: tx(v, TOK.USDC.address, call(APPROVE, [v.routerV2, units('USDC', amt * 10)])) });
  else add({ ...r, sub: 'lot_approve_max_inconnu_plus_swap', ideal: 'critical', request: calls(v, [[TOK.USDC.address, call(APPROVE, [v.unknownC, MAXU])], [v.routerV2, call(V2, [units('USDC', amt), out('WETH', amt, 'USDC'), [TOK.USDC.address, TOK.WETH.address], v.me, DEADLINE])]]) });
}
for (let i = 0; i < 30; i++) {
  const v = actors('droit_b', i), amt = pick(AMTS), it = intentSwap(amt);
  const kind = i % 6;
  const r = { fam: 'swap_droit_illimite', label: 'benin', ideal: 'ok', v, intent: it };
  if (kind === 0) add({ ...r, sub: 'approve_exact_routeur_connu', request: tx(v, TOK.USDC.address, call(APPROVE, [v.routerV2, units('USDC', amt)])) });
  else if (kind === 1) add({ ...r, sub: 'lot_approve_exact_plus_swap', request: calls(v, [[TOK.USDC.address, call(APPROVE, [v.routerV2, units('USDC', amt)])], [v.routerV2, call(V2, [units('USDC', amt), out('WETH', amt, 'USDC'), [TOK.USDC.address, TOK.WETH.address], v.me, DEADLINE])]]) });
  else if (kind === 2) add({ ...r, sub: 'swap_direct_vers_soi', request: swapTx(v, amt, 'USDC', 'WETH', v.me) });
  else if (kind === 3) add({ ...r, sub: 'permit2_exact_routeur_connu', request: typed(v, permit2Single('USDC', v.routerV3, units('USDC', amt))) });
  else if (kind === 4) add({ ...r, sub: 'permit2612_exact_routeur_connu', request: typed(v, permit2612(v, 'USDC', v.routerV2, units('USDC', amt))) });
  else add({ ...r, sub: 'swap_v3_vers_soi', request: tx(v, v.routerV3, call(V3, [[TOK.USDC.address, TOK.WETH.address, 500, v.me, DEADLINE, units('USDC', amt), out('WETH', amt, 'USDC'), 0n]])) });
}

// ---------------------------------------------------------------- F2 : jeton différent de celui dit
for (let i = 0; i < 32; i++) {
  const v = actors('jeton', i), amt = pick(AMTS), it = intentSwap(amt, 'USDC', 'WETH');
  const kind = i % 4;
  const r = { fam: 'swap_jeton_different', label: 'malveillant', ideal: 'critical', v, intent: it };
  const other = pick(['DAI', 'USDT']);
  if (kind === 0) add({ ...r, sub: 'vend_un_autre_jeton', request: swapTx(v, amt, other, 'WETH', v.me) });
  else if (kind === 1) add({ ...r, sub: 'recoit_un_autre_jeton', request: swapTx(v, amt, 'USDC', pick(['DAI', 'USDT']), v.me) });
  else if (kind === 2) add({ ...r, sub: 'approve_autre_jeton', request: tx(v, TOK[other].address, call(APPROVE, [v.routerV2, units(other, amt)])) });
  else add({ ...r, sub: 'permit_autre_jeton', request: typed(v, permit2612(v, other, v.routerV2, units(other, amt))) });
}
for (let i = 0; i < 24; i++) {
  const v = actors('jeton_b', i), amt = pick(AMTS), to = pick(['WETH', 'DAI']), it = intentSwap(amt, 'USDC', to);
  const kind = i % 3;
  const r = { fam: 'swap_jeton_different', label: 'benin', ideal: 'ok', v, intent: it };
  if (kind === 0) add({ ...r, sub: 'jetons_conformes', request: swapTx(v, amt, 'USDC', to, v.me) });
  else if (kind === 1) add({ ...r, sub: 'approve_jeton_conforme', request: tx(v, TOK.USDC.address, call(APPROVE, [v.routerV2, units('USDC', amt)])) });
  else add({ ...r, sub: 'permit_jeton_conforme', request: typed(v, permit2612(v, 'USDC', v.routerV2, units('USDC', amt))) });
}

// ---------------------------------------------------------------- F3 : destinataire tiers d'un échange
for (let i = 0; i < 28; i++) {
  const v = actors('dest', i), amt = pick(AMTS), it = intentSwap(amt);
  const kind = i % 4, third = i % 2 ? v.unknownE : v.third;
  const r = { fam: 'swap_destinataire_tiers', label: 'malveillant', ideal: 'critical', v, intent: it };
  if (kind === 0) add({ ...r, sub: 'v2_vers_tiers', request: swapTx(v, amt, 'USDC', 'WETH', third) });
  else if (kind === 1) add({ ...r, sub: 'v3_vers_tiers', request: tx(v, v.routerV3, call(V3, [[TOK.USDC.address, TOK.WETH.address, 500, third, DEADLINE, units('USDC', amt), out('WETH', amt, 'USDC'), 0n]])) });
  else if (kind === 2) add({ ...r, sub: 'v2_eth_vers_tiers', request: tx(v, v.routerV2, call(V2ETH, [out('USDC', 0.05 * 3000, 'USDC'), [TOK.WETH.address, TOK.USDC.address], third, DEADLINE]), '0x' + (50000000000000000n).toString(16)), intent: { kind: 'buy_or_swap', freeText: 'Échanger 0,05 ETH contre des USDC', token: 'ETH', amount: '0.05', receiveToken: 'USDC' } });
  else add({ ...r, sub: 'lot_approve_exact_puis_swap_vers_tiers', request: calls(v, [[TOK.USDC.address, call(APPROVE, [v.routerV2, units('USDC', amt)])], [v.routerV2, call(V2, [units('USDC', amt), out('WETH', amt, 'USDC'), [TOK.USDC.address, TOK.WETH.address], third, DEADLINE])]]) });
}
for (let i = 0; i < 24; i++) {
  const v = actors('dest_b', i), amt = pick(AMTS), it = intentSwap(amt);
  const kind = i % 3;
  const r = { fam: 'swap_destinataire_tiers', label: 'benin', ideal: 'ok', v, intent: it };
  if (kind === 0) add({ ...r, sub: 'v2_vers_soi', request: swapTx(v, amt, 'USDC', 'WETH', v.me) });
  else if (kind === 1) add({ ...r, sub: 'v3_vers_soi', request: tx(v, v.routerV3, call(V3, [[TOK.USDC.address, TOK.WETH.address, 500, v.me, DEADLINE, units('USDC', amt), out('WETH', amt, 'USDC'), 0n]])) });
  else add({ ...r, sub: 'v2_eth_vers_soi', request: tx(v, v.routerV2, call(V2ETH, [out('USDC', 0.05 * 3000, 'USDC'), [TOK.WETH.address, TOK.USDC.address], v.me, DEADLINE]), '0x' + (50000000000000000n).toString(16)), intent: { kind: 'buy_or_swap', freeText: 'Échanger 0,05 ETH contre des USDC', token: 'ETH', amount: '0.05', receiveToken: 'USDC' } });
}

// ---------------------------------------------------------------- F4 : « recevoir » qui fait sortir des fonds ou donne un droit
const intentRecv = (what) => ({ kind: 'connect_or_accept_offer', freeText: what });
const RECV = ['Je veux recevoir mon airdrop', 'Je veux recevoir mon remboursement', 'Je veux recevoir le paiement de mon client', 'Je veux réclamer mon cadeau'];
for (let i = 0; i < 32; i++) {
  const v = actors('recevoir', i), it = intentRecv(pick(RECV)), amt = pick(AMTS);
  const kind = i % 8;
  const r = { fam: 'recevoir_sortie', label: 'malveillant', ideal: 'critical', v, intent: it };
  if (kind === 0) add({ ...r, sub: 'transfert_jeton_vers_inconnu', request: tx(v, TOK.USDC.address, call(TRANSFER, [v.unknownE, units('USDC', amt)])) });
  else if (kind === 1) add({ ...r, sub: 'envoi_natif_vers_inconnu', request: tx(v, v.unknownE, '0x', '0x' + (20000000000000000n).toString(16)) });
  else if (kind === 2) add({ ...r, sub: 'approve_max_inconnu', request: tx(v, TOK.USDT.address, call(APPROVE, [v.unknownC, MAXU])) });
  else if (kind === 3) add({ ...r, sub: 'setApprovalForAll_inconnu', request: tx(v, v.nftKnown, call(SAFA, [v.unknownC, true])) });
  else if (kind === 4) add({ ...r, sub: 'permit_inconnu', request: typed(v, permit2612(v, 'DAI', v.unknownC, MAXU)) });
  else if (kind === 5) add({ ...r, sub: 'permit2_inconnu', request: typed(v, permit2Single('USDC', v.unknownC, MAX160)) });
  else if (kind === 6) add({ ...r, sub: 'setApprovalForAll_protocole_connu', ideal: 'warn', request: tx(v, v.nftKnown, call(SAFA, [v.routerV3, true])), note: 'banal (mise en vente) mais pas « recevoir »' });
  else add({ ...r, sub: 'lot_transfert_sortant', request: calls(v, [[TOK.DAI.address, call(TRANSFER, [v.unknownE, units('DAI', amt)])]]) });
}
for (let i = 0; i < 24; i++) {
  const v = actors('recevoir_b', i), it = intentRecv(pick(RECV));
  const kind = i % 3;
  const r = { fam: 'recevoir_sortie', label: 'benin', ideal: 'ok', v, intent: it };
  if (kind === 0) add({ ...r, sub: 'signature_sans_effet', request: personal(v, hexUtf8(`Je confirme être le titulaire de ${v.me} pour recevoir mon paiement. Aucun effet sur mes fonds.`)) });
  else if (kind === 1) add({ ...r, sub: 'siwe_domaine_conforme', request: personal(v, siwe(v, v.origin)) });
  else add({ ...r, sub: 'reclamation_appel_inconnu', request: tx(v, v.unknownC, '0x4e71d92d'), note: 'claim() : illisible donc orange attendu, jamais vert' });
}

// ---------------------------------------------------------------- F5 : « me connecter » qui signe un droit
const intentLogin = (d) => ({ kind: 'connect_or_accept_offer', freeText: `Je veux me connecter à ${d}` });
for (let i = 0; i < 28; i++) {
  const v = actors('connexion', i), it = intentLogin(v.origin);
  const kind = i % 7;
  const r = { fam: 'connexion_droit_signe', label: 'malveillant', ideal: 'critical', v, intent: it };
  if (kind === 0) add({ ...r, sub: 'permit2612_max', request: typed(v, permit2612(v, pick(['USDC', 'DAI']), v.unknownC, MAXU)) });
  else if (kind === 1) add({ ...r, sub: 'permit2612_borne', request: typed(v, permit2612(v, 'USDC', v.unknownC, units('USDC', pick(AMTS)))) });
  else if (kind === 2) add({ ...r, sub: 'permit2_single', request: typed(v, permit2Single('USDT', v.unknownC, MAX160)) });
  else if (kind === 3) add({ ...r, sub: 'setApprovalForAll_tx', request: tx(v, v.nftKnown, call(SAFA, [v.unknownE, true])) });
  else if (kind === 4) add({ ...r, sub: 'approve_tx', request: tx(v, TOK.USDC.address, call(APPROVE, [v.unknownC, MAXU])) });
  else if (kind === 5) add({ ...r, sub: 'permit_routeur_connu', ideal: 'warn', request: typed(v, permit2612(v, 'USDC', v.routerV2, MAXU)), note: 'banal pour un portefeuille, mais pas une connexion' });
  else add({ ...r, sub: 'setApprovalForAll_protocole_connu', ideal: 'warn', request: tx(v, v.nftKnown, call(SAFA, [v.routerV3, true])) });
}
for (let i = 0; i < 24; i++) {
  const v = actors('connexion_b', i), it = intentLogin(v.origin);
  const kind = i % 3;
  const r = { fam: 'connexion_droit_signe', label: 'benin', ideal: 'ok', v, intent: it };
  if (kind === 0) add({ ...r, sub: 'siwe_domaine_conforme', request: personal(v, siwe(v, v.origin)) });
  else if (kind === 1) add({ ...r, sub: 'message_connexion_texte', request: personal(v, hexUtf8(`Connexion à ${v.origin}. Aucune transaction, aucun droit.`)) });
  else add({ ...r, sub: 'typed_login_sans_valeur', request: typed(v, { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }], Login: [{ name: 'contents', type: 'string' }, { name: 'nonce', type: 'uint256' }] }, primaryType: 'Login', domain: { name: v.origin, chainId: 1 }, message: { contents: 'Se connecter', nonce: 7 } }) });
}

// ---------------------------------------------------------------- F6 : montant plus grand que dit
const intentPay = (v, amt, sym = 'USDC') => ({ kind: 'pay_someone', freeText: `Je paie Paul ${amt} ${sym}`, token: sym, amount: String(amt), counterpartyLabel: 'Paul', counterpartyAddress: v.paul });
for (let i = 0; i < 32; i++) {
  const v = actors('montant', i), amt = pick(AMTS);
  const kind = i % 8, k = pick([2, 5, 10, 100]);
  const r = { fam: 'montant_plus_grand', label: 'malveillant', ideal: 'critical', v };
  if (kind === 0) add({ ...r, sub: 'transfert_k_fois', intent: intentPay(v, amt), request: tx(v, TOK.USDC.address, call(TRANSFER, [v.paul, units('USDC', amt * k)])) });
  else if (kind === 1) add({ ...r, sub: 'transfert_juste_au_dessus_tolerance', intent: intentPay(v, amt), request: tx(v, TOK.USDC.address, call(TRANSFER, [v.paul, units('USDC', amt * 1.05)])) });
  else if (kind === 2) add({ ...r, sub: 'natif_k_fois', intent: { ...intentPay(v, 0.1, 'ETH'), freeText: 'Je paie Paul 0,1 ETH' }, request: tx(v, v.paul, '0x', '0x' + (BigInt(k) * 100000000000000000n).toString(16)) });
  else if (kind === 3) add({ ...r, sub: 'swap_k_fois', intent: intentSwap(amt), request: swapTx(v, amt * k, 'USDC', 'WETH', v.me) });
  else if (kind === 4) add({ ...r, sub: 'swap_juste_au_dessus_tolerance', intent: intentSwap(amt), request: swapTx(v, amt * 1.1, 'USDC', 'WETH', v.me) });
  else if (kind === 5) add({ ...r, sub: 'lot_transfert_k_fois', intent: intentPay(v, amt), request: calls(v, [[TOK.USDC.address, call(TRANSFER, [v.paul, units('USDC', amt * k)])]]) });
  else if (kind === 6) add({ ...r, sub: 'transfert_dai_k_fois', intent: intentPay(v, amt, 'DAI'), request: tx(v, TOK.DAI.address, call(TRANSFER, [v.paul, units('DAI', amt * k)])) });
  else add({ ...r, sub: 'swap_eth_k_fois', intent: { kind: 'buy_or_swap', freeText: 'Échanger 0,05 ETH contre des USDC', token: 'ETH', amount: '0.05', receiveToken: 'USDC' }, request: tx(v, v.routerV2, call(V2ETH, [out('USDC', 0.05 * 3000, 'USDC'), [TOK.WETH.address, TOK.USDC.address], v.me, DEADLINE]), '0x' + (BigInt(k) * 50000000000000000n).toString(16)) });
}
for (let i = 0; i < 28; i++) {
  const v = actors('montant_b', i), amt = pick(AMTS);
  const kind = i % 7;
  const r = { fam: 'montant_plus_grand', label: 'benin', ideal: 'ok', v };
  if (kind === 0) add({ ...r, sub: 'transfert_exact', intent: intentPay(v, amt), request: tx(v, TOK.USDC.address, call(TRANSFER, [v.paul, units('USDC', amt)])) });
  else if (kind === 1) add({ ...r, sub: 'transfert_arrondi', intent: intentPay(v, amt), request: tx(v, TOK.USDC.address, call(TRANSFER, [v.paul, units('USDC', amt * 1.005)])) });
  else if (kind === 2) add({ ...r, sub: 'natif_exact', intent: { ...intentPay(v, 0.1, 'ETH'), freeText: 'Je paie Paul 0,1 ETH' }, request: tx(v, v.paul, '0x', '0x' + (100000000000000000n).toString(16)) });
  else if (kind === 3) add({ ...r, sub: 'swap_exact', intent: intentSwap(amt), request: swapTx(v, amt, 'USDC', 'WETH', v.me) });
  else if (kind === 4) add({ ...r, sub: 'transfert_moins', intent: intentPay(v, amt), request: tx(v, TOK.USDC.address, call(TRANSFER, [v.paul, units('USDC', amt / 2)])) });
  else if (kind === 5) add({ ...r, sub: 'lot_transfert_exact', intent: intentPay(v, amt), request: calls(v, [[TOK.USDC.address, call(TRANSFER, [v.paul, units('USDC', amt)])]]) });
  else add({ ...r, sub: 'transfert_dai_exact', intent: intentPay(v, amt, 'DAI'), request: tx(v, TOK.DAI.address, call(TRANSFER, [v.paul, units('DAI', amt)])) });
}


// ---------------------------------------------------------------- VARIANTES DIFFICILES (autres formes de lot, autre réseau, autres écritures du montant)
const INCA = 'increaseAllowance(address spender,uint256 addedValue)';
const V2EXACT = 'swapTokensForExactTokens(uint256 amountOut,uint256 amountInMax,address[] path,address to,uint256 deadline)';
const AV = { USDC: { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 }, WAVAX: { address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', decimals: 18 } };
const withAvalanche = (fn) => { const save = { USDC: TOK.USDC, WETH: TOK.WETH, USDT: TOK.USDT, DAI: TOK.DAI }; delete TOK.WETH; delete TOK.USDT; delete TOK.DAI; TOK.USDC = AV.USDC; TOK.WAVAX = AV.WAVAX; try { fn(); } finally { delete TOK.WAVAX; Object.assign(TOK, save); } };
for (let i = 0; i < 48; i++) {
  const v = actors('dur', i), amt = pick(AMTS), k = i % 16;
  const M = { label: 'malveillant', v };
  const B = { label: 'benin', ideal: 'ok', v };
  const swapCall = (to, a = amt) => call(V2, [units('USDC', a), out('WETH', a, 'USDC'), [TOK.USDC.address, TOK.WETH.address], to, DEADLINE]);
  if (k === 0) add({ ...M, fam: 'swap_droit_illimite', sub: 'dur_approve_max_permit2_canonique', ideal: 'warn', intent: intentSwap(amt), request: tx(v, TOK.USDC.address, call(APPROVE, [PERMIT2, MAXU])), note: 'le geste standard des portefeuilles, mais N est dit' });
  else if (k === 1) add({ ...M, fam: 'swap_droit_illimite', sub: 'dur_increaseAllowance_max_inconnu', ideal: 'critical', intent: intentSwap(amt), request: tx(v, TOK.USDC.address, call(INCA, [v.unknownC, MAXU])) });
  else if (k === 2) add({ ...M, fam: 'swap_droit_illimite', sub: 'dur_increaseAllowance_max_routeur_connu', ideal: 'warn', intent: intentSwap(amt), request: tx(v, TOK.USDC.address, call(INCA, [v.routerV2, MAXU])) });
  else if (k === 3) add({ ...M, fam: 'swap_droit_illimite', sub: 'dur_montant_ecrit_avec_espace', ideal: 'warn', intent: { ...intentSwap(1000), amount: '1 000' }, request: tx(v, TOK.USDC.address, call(APPROVE, [v.routerV2, units('USDC', 10000)])) });
  else if (k === 4) withAvalanche(() => add({ ...M, fam: 'swap_droit_illimite', sub: 'dur_avalanche_approve_max_inconnu', ideal: 'critical', v: { ...v, chain: 43114 }, intent: { kind: 'buy_or_swap', freeText: `Échanger ${amt} USDC contre des AVAX`, token: 'USDC', amount: String(amt), receiveToken: 'AVAX' }, request: tx({ ...v, chain: 43114 }, TOK.USDC.address, call(APPROVE, [v.unknownC, MAXU])) }));
  else if (k === 5) add({ ...M, fam: 'swap_jeton_different', sub: 'dur_natif_au_lieu_du_jeton', ideal: 'critical', intent: intentSwap(amt), request: tx(v, v.routerV2, call(V2ETH, [out('WETH', 1, 'USDC'), [TOK.WETH.address, TOK.USDC.address], v.me, DEADLINE]), '0x' + (80000000000000000n).toString(16)) });
  else if (k === 6) withAvalanche(() => add({ ...M, fam: 'swap_jeton_different', sub: 'dur_avalanche_vend_wavax_au_lieu_usdc', ideal: 'critical', v: { ...v, chain: 43114 }, intent: { kind: 'buy_or_swap', freeText: `Échanger ${amt} USDC contre du WAVAX`, token: 'USDC', amount: String(amt), receiveToken: 'WAVAX' }, request: tx({ ...v, chain: 43114 }, v.routerV2, call(V2, [units('WAVAX', amt / 30), 1n, [TOK.WAVAX.address, TOK.USDC.address], v.me, DEADLINE])) }));
  else if (k === 7) add({ ...M, fam: 'swap_destinataire_tiers', sub: 'dur_sortie_exacte_vers_tiers', ideal: 'critical', intent: intentSwap(amt), request: tx(v, v.routerV2, call(V2EXACT, [out('WETH', amt, 'USDC'), units('USDC', amt), [TOK.USDC.address, TOK.WETH.address], v.third, DEADLINE])) });
  else if (k === 8) add({ ...M, fam: 'montant_plus_grand', sub: 'dur_virgule_decimale_15_fois', ideal: 'critical', intent: { ...intentPay(v, 0.1, 'ETH'), amount: '1,5', freeText: 'Je paie Paul 1,5 ETH' }, request: tx(v, v.paul, '0x', '0x' + (15000000000000000000n).toString(16)) });
  else if (k === 9) add({ ...M, fam: 'montant_plus_grand', sub: 'dur_milliers_avec_espace', ideal: 'critical', intent: { ...intentPay(v, 1000), amount: '1 000', freeText: 'Je paie Paul 1 000 USDC' }, request: tx(v, TOK.USDC.address, call(TRANSFER, [v.paul, units('USDC', 10000)])) });
  else if (k === 10) add({ ...M, fam: 'recevoir_sortie', sub: 'dur_increaseAllowance_max_inconnu', ideal: 'critical', intent: intentRecv('Je veux recevoir mon remboursement'), request: tx(v, TOK.USDC.address, call(INCA, [v.unknownC, MAXU])) });
  else if (k === 11) add({ ...M, fam: 'connexion_droit_signe', sub: 'dur_permit2_borne', ideal: 'critical', intent: intentLogin(v.origin), request: typed(v, permit2Single('USDC', v.unknownC, units('USDC', amt))) });
  else if (k === 12) add({ ...B, fam: 'swap_droit_illimite', sub: 'dur_approve_exact_permit2_canonique', intent: intentSwap(amt), request: tx(v, TOK.USDC.address, call(APPROVE, [PERMIT2, units('USDC', amt)])) });
  else if (k === 13) add({ ...B, fam: 'swap_droit_illimite', sub: 'dur_lot_approve_exact_sortie_exacte_vers_soi', intent: intentSwap(amt), request: calls(v, [[TOK.USDC.address, call(APPROVE, [v.routerV2, units('USDC', amt)])], [v.routerV2, call(V2EXACT, [out('WETH', amt, 'USDC'), units('USDC', amt), [TOK.USDC.address, TOK.WETH.address], v.me, DEADLINE])]]) });
  else if (k === 14) withAvalanche(() => add({ ...B, fam: 'swap_jeton_different', sub: 'dur_avalanche_conforme', v: { ...v, chain: 43114 }, intent: { kind: 'buy_or_swap', freeText: `Échanger ${amt} USDC contre du WAVAX`, token: 'USDC', amount: String(amt), receiveToken: 'WAVAX' }, request: tx({ ...v, chain: 43114 }, v.routerV2, call(V2, [units('USDC', amt), units('WAVAX', amt / 30 * 0.99), [TOK.USDC.address, TOK.WAVAX.address], v.me, DEADLINE])) }));
  else add({ ...B, fam: 'montant_plus_grand', sub: 'dur_virgule_decimale_exact', intent: { ...intentPay(v, 0.1, 'ETH'), amount: '1,5', freeText: 'Je paie Paul 1,5 ETH' }, request: tx(v, v.paul, '0x', '0x' + (1500000000000000000n).toString(16)) });
}

// ---------------------------------------------------------------- LIMITES CONNUES (famille à part, hors total) : ce que la règle ne peut pas conclure faute d'information
for (let i = 0; i < 16; i++) {
  const v = actors('lim', i), amt = pick(AMTS), k = i % 4;
  const M = { fam: 'limites_connues', label: 'malveillant', v };
  if (k === 0) add({ ...M, sub: 'jeton_recu_inconnu_du_registre', ideal: 'critical', intent: intentSwap(amt), request: tx(v, v.routerV2, call(V2, [units('USDC', amt), 1000n, [TOK.USDC.address, addr('lim:scamtoken:' + i)], v.me, DEADLINE])), note: 'symbole du jeton reçu inconnu : la règle ne conclut pas' });
  else if (k === 1) add({ ...M, sub: 'droit_exact_vers_contrat_inconnu', ideal: 'warn', intent: intentSwap(amt), request: tx(v, TOK.USDC.address, call(APPROVE, [v.unknownC, units('USDC', amt)])), note: 'montant conforme, bénéficiaire inconnu : orange du plancher' });
  else if (k === 2) add({ ...M, sub: 'montant_ecrit_en_lettres', ideal: 'critical', intent: { ...intentPay(v, amt), amount: 'cinquante', freeText: 'Je paie Paul cinquante USDC' }, request: tx(v, TOK.USDC.address, call(TRANSFER, [v.paul, units('USDC', 20 * amt)])), note: 'montant illisible : aucune comparaison de montant possible' });
  else add({ ...M, sub: 'droit_borne_juste_sous_tolerance', ideal: 'warn', intent: intentSwap(amt), request: tx(v, TOK.USDC.address, call(APPROVE, [v.routerV2, units('USDC', amt * 1.009)])), note: 'sous la tolérance de 1 % : non signalé par construction' });
}

writeFileSync(join(HERE, 'DECALAGE.jsonl'), cases.map((c) => JSON.stringify(c)).join('\n') + '\n');
const tab = {};
for (const c of cases) { const k = c.family; tab[k] = tab[k] || { M: 0, B: 0 }; tab[k][c.label === 'malveillant' ? 'M' : 'B']++; }
console.log(cases.length + ' cas', JSON.stringify(tab));

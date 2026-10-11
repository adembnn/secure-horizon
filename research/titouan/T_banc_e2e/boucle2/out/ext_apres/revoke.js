/* Hold up - build the REVOCATION request that matches a request which grants a right. Pure ES module:
 * no chrome.*, no network, no DOM, no key, no clock (the caller may inject `nowSec`).
 *
 *   revocationFor(request, opts?) -> {
 *     status  : 'revocable'              the right can be removed by transactions the wallet signs
 *             | 'two_steps'              an off-chain signature : it can only be made useless by signing, then sending
 *             | 'not_revocable_by_click' an off-chain signature Hold up cannot undo (wait for the deadline, or ask the platform)
 *             | 'needs_info'             ERC-20 and ERC-721 share the selector of approve(address,uint256) : say which one
 *             | 'not_a_grant'            nothing here gives a right (or Hold up does not recognise it)
 *     kind, grant, oneClick, requests[], ifAlreadyUsed[], says, steps[], limits[], expiry, signedByHoldUp: false, submitTo: 'wallet' }
 *
 * HARD RULES
 *  1. Hold up NEVER signs and NEVER sends. Every request in `requests` is something the PAGE'S WALLET shows to the person,
 *     who signs or refuses ; `signedByHoldUp` is always false and `submitTo` is always 'wallet'.
 *  2. Nothing here claims to undo what cannot be undone. A signed Permit or Permit2 message is not on chain until someone
 *     sends it : it stays valid until its deadline or until its nonce is spent. `oneClick` is true only when ONE
 *     on-chain transaction really removes the right.
 *  3. Unknown or malformed input never produces a revocation : it gives 'not_a_grant' or 'not_revocable_by_click'.
 *
 * Selectors and ABI were computed with keccak-256 over the canonical signatures (see tests/unit/revoke.test.mjs, which
 * recomputes every selector and re-encodes every calldata with the engine's own ABI encoder).
 * What this does NOT prove : that the transaction succeeds (some tokens refuse approve from a non-zero value, a token
 * may be paused), that it comes in time (a drainer may have swept already), or that no other right exists. */

export const PERMIT2 = '0x000000000022d473030f116ddee9f6b43ac78ba3'; // canonical Permit2, same address on most chains
export const SEL = {
  approve: '0x095ea7b3',               // approve(address,uint256)                       ERC-20 and ERC-721
  increaseAllowance: '0x39509351',     // increaseAllowance(address,uint256)             OpenZeppelin ERC-20
  setApprovalForAll: '0xa22cb465',     // setApprovalForAll(address,bool)                ERC-721 and ERC-1155
  permit: '0xd505accf',                // permit(address,address,uint256,uint256,uint8,bytes32,bytes32)   EIP-2612
  permit2Approve: '0x87517c45',        // approve(address,address,uint160,uint48)        on Permit2
  permit2Permit: '0x2b67b570',         // permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)   on Permit2
  permit2Lockdown: '0xcc53287f',       // lockdown((address,address)[])                  on Permit2
  permit2InvalidateNonces: '0x65d9723c', // invalidateNonces(address,address,uint48)     on Permit2
  permit2InvalidateUnordered: '0x3ff9dcb1' // invalidateUnorderedNonces(uint256,uint256) on Permit2
};
const MAX_U256 = (1n << 256n) - 1n;
const MAX_U48 = (1n << 48n) - 1n;
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const HEX = /^0x(?:[0-9a-fA-F]{2})*$/;
const FOREVER = 1n << 64n; // a deadline past the year 584 billion is "never"
const ALLOWANCE_TYPES = new Set(['PermitSingle', 'PermitBatch']);
const TRANSFER_TYPES = new Set(['PermitTransferFrom', 'PermitBatchTransferFrom', 'PermitWitnessTransferFrom', 'PermitBatchWitnessTransferFrom']);
const MAX_BATCH = 16;

const lc = (a) => String(a).toLowerCase();
const addrWord = (a) => lc(a).slice(2).padStart(64, '0');
const numWord = (x) => BigInt(x).toString(16).padStart(64, '0');
const isAddr = (a) => typeof a === 'string' && HEX20.test(a);
const isZeroAddr = (a) => /^0x0{40}$/i.test(a);
const big = (x) => { try { if (typeof x === 'bigint') return x; if (typeof x === 'number') return Number.isInteger(x) && x >= 0 ? BigInt(x) : null; if (typeof x === 'string' && /^(0x[0-9a-fA-F]+|[0-9]+)$/.test(x)) return BigInt(x); } catch (_) { /* rien */ } return null; };

// ---- calldata helpers (static words only, strict)
const words = (data) => { const body = data.slice(10); return body.length % 64 === 0 ? body.match(/.{64}/g) || [] : null; };
const wAddr = (w) => (/^0{24}[0-9a-f]{40}$/i.test(w) ? '0x' + w.slice(24).toLowerCase() : null);
const wInt = (w) => BigInt('0x' + w);

// ---- encoders for the revocation calldata (the only ABI this module writes)
export const encodeApprove = (spender, amount) => SEL.approve + addrWord(spender) + numWord(amount);
export const encodeSetApprovalForAll = (operator, approved) => SEL.setApprovalForAll + addrWord(operator) + numWord(approved ? 1 : 0);
export const encodePermit2Approve = (token, spender, amount, expiration) => SEL.permit2Approve + addrWord(token) + addrWord(spender) + numWord(amount) + numWord(expiration);
export const encodeLockdown = (pairs) => SEL.permit2Lockdown + numWord(32) + numWord(pairs.length) + pairs.map(([t, s]) => addrWord(t) + addrWord(s)).join('');
export const encodeInvalidateNonces = (token, spender, newNonce) => SEL.permit2InvalidateNonces + addrWord(token) + addrWord(spender) + numWord(newNonce);
export const encodeInvalidateUnordered = (wordPos, mask) => SEL.permit2InvalidateUnordered + numWord(wordPos) + numWord(mask);
export const encodePermit = (owner, spender, value, deadline, v, r, s) => SEL.permit + addrWord(owner) + addrWord(spender) + numWord(value) + numWord(deadline) + numWord(v) + r.slice(2).padStart(64, '0') + s.slice(2).padStart(64, '0');

const LIMITS = [
  'Retirer un droit ne ramène pas ce qui est déjà parti.',
  'Le droit reste actif tant que la transaction n’est pas confirmée sur le réseau.',
  'La transaction coûte des frais réseau, à payer avec le même portefeuille.'
];
const PERSON = 'C’est toi qui signes dans ton portefeuille. Hold up ne signe jamais et n’envoie rien.';

const walletTx = (from, to, data, chainId, does) => ({ method: 'eth_sendTransaction', params: [{ from, to: lc(to), value: '0x0', data, ...(chainId ? { chainId } : {}) }], does, submitTo: 'wallet' });
const out = (status, o) => ({ status, kind: null, oneClick: false, grant: null, requests: [], ifAlreadyUsed: [], says: '', steps: [], limits: [], expiry: null, signedByHoldUp: false, submitTo: 'wallet', ...o });
const none = (says) => out('not_a_grant', { says });
const short = (a) => (isAddr(a) ? a.slice(0, 6) + '…' + a.slice(-4) : String(a));
const expiryOf = (deadline) => { const d = big(deadline); if (d === null) return null; return d >= FOREVER ? { never: true, at: null } : { never: false, at: Number(d) }; };

// ---- entry points
/** request : { method, params, chainId?, from?, origin? } as a page sends it to the wallet. opts : { tokenKind, tokenLabel, nowSec, state } */
export function revocationFor(request, opts = {}) {
  try {
    if (!request || typeof request !== 'object' || !Array.isArray(request.params)) return none('Hold up ne voit pas de droit accordé dans cette demande.');
    const m = String(request.method || '');
    if (m === 'eth_sendTransaction') return fromTransaction(request, opts);
    if (/^eth_signTypedData(_v3|_v4)?$/.test(m)) return fromTypedData(request, opts);
    return none('Hold up ne voit pas de droit accordé dans cette demande.');
  } catch (_) {
    return none('Hold up n’a pas pu lire cette demande. Aucune révocation n’est proposée.');
  }
}

/** From a right already read elsewhere (the engine's effects) : { token, spender, kind?, tokenId? }. Only ERC-20 / setApprovalForAll shapes. */
export function revocationForRight(right, owner, chainId) {
  if (!right || !isAddr(right.token) || !isAddr(right.spender) || !isAddr(owner)) return none('Hold up n’a pas assez d’éléments pour préparer une révocation.');
  const kind = right.kind === 'erc721_all' || right.all ? 'setApprovalForAll' : 'approve';
  const data = kind === 'approve' ? encodeApprove(right.spender, 0n) : encodeSetApprovalForAll(right.spender, false);
  return erc20Like(kind === 'approve' ? 'erc20_approve' : 'setApprovalForAll', { token: lc(right.token), spender: lc(right.spender), owner: lc(owner) }, data, chainId, {});
}

function erc20Like(kind, grant, data, chainId, opts, extraSays = '') {
  const label = opts.tokenLabel || 'tes jetons';
  const all = kind === 'setApprovalForAll';
  const req = walletTx(grant.owner, grant.token, data, chainId, all ? `setApprovalForAll(${short(grant.spender)}, false) : retire le droit sur toute la collection` : `approve(${short(grant.spender)}, 0) : remet à zéro le droit de dépense`);
  return out('revocable', {
    kind, grant, oneClick: true, requests: [req],
    says: (all ? `Cette demande donne à ${short(grant.spender)} le droit de déplacer tous tes objets de cette collection.` : `Cette demande donne à ${short(grant.spender)} le droit de dépenser ${label}.`) + ' Pour le retirer, une transaction suffit. ' + PERSON + extraSays,
    steps: ['Ton portefeuille affiche la demande de retrait.', 'Tu la lis, puis tu signes ou tu refuses.', 'Après confirmation, Hold up relit le droit pour vérifier qu’il est à zéro.'],
    limits: LIMITS.slice(), expiry: { never: true, at: null }
  });
}

function fromTransaction(request, opts) {
  const tx = request.params[0];
  if (!tx || typeof tx !== 'object' || !isAddr(tx.to) || typeof tx.data !== 'string' || !HEX.test(tx.data) || tx.data.length < 10) return none('Hold up ne voit pas de droit accordé dans cette demande.');
  const from = isAddr(tx.from) ? lc(tx.from) : isAddr(request.from) ? lc(request.from) : null;
  const chainId = tx.chainId || request.chainId || null;
  const to = lc(tx.to), sel = lc(tx.data.slice(0, 10)), W = words(tx.data);
  if (!W) return none('Hold up ne voit pas de droit accordé dans cette demande.');
  const needFrom = () => (from ? null : out('needs_info', { says: 'Il manque le compte qui signe. Hold up ne prépare pas de révocation sans lui.' }));

  if (sel === SEL.approve && W.length === 2) {
    const spender = wAddr(W[0]), amount = wInt(W[1]);
    if (!spender || isZeroAddr(spender)) return none('Cette demande ne donne de droit à personne.');
    const nf = needFrom(); if (nf) return nf;
    const grant = { token: to, spender, owner: from, amount: amount.toString(), unlimited: amount >= (1n << 255n) };
    if (amount === 0n) return none('Cette demande met un droit à zéro : elle en retire, elle n’en donne pas.');
    const kind = opts.tokenKind === 'erc721' ? 'erc721_approve' : opts.tokenKind === 'erc20' || grant.unlimited ? 'erc20_approve' : null;
    if (kind === 'erc721_approve') {
      const r = walletTx(from, to, encodeApprove('0x' + '0'.repeat(40), amount), chainId, `approve(0x0, ${amount}) : retire le droit sur le NFT ${amount}`);
      return out('revocable', { kind, grant: { ...grant, tokenId: amount.toString() }, oneClick: true, requests: [r], says: `Cette demande donne à ${short(spender)} le droit de déplacer le NFT numéro ${amount}. Une transaction suffit pour le retirer. ` + PERSON, steps: ['Ton portefeuille affiche la demande de retrait.', 'Tu la lis, puis tu signes ou tu refuses.'], limits: LIMITS.slice(), expiry: { never: true, at: null } });
    }
    if (kind === 'erc20_approve') return erc20Like(kind, grant, encodeApprove(spender, 0n), chainId, opts);
    // same four bytes, two meanings : the revocation is not the same, so Hold up does not guess
    const e20 = walletTx(from, to, encodeApprove(spender, 0n), chainId, `approve(${short(spender)}, 0) : si c’est un jeton (montant)`);
    const e721 = walletTx(from, to, encodeApprove('0x' + '0'.repeat(40), amount), chainId, `approve(0x0, ${amount}) : si c’est un NFT (numéro)`);
    return out('needs_info', { kind: 'approve_ambiguous', grant, candidates: [{ tokenKind: 'erc20', request: e20 }, { tokenKind: 'erc721', request: e721 }], says: 'Cette demande donne un droit, mais jeton et NFT utilisent les mêmes octets pour « approve ». Il faut lire le contrat pour savoir lequel est visé. Hold up ne devine pas.', limits: LIMITS.slice() });
  }
  if (sel === SEL.increaseAllowance && W.length === 2) {
    const spender = wAddr(W[0]), added = wInt(W[1]);
    if (!spender || isZeroAddr(spender) || added === 0n) return none('Cette demande n’augmente aucun droit.');
    const nf = needFrom(); if (nf) return nf;
    const grant = { token: to, spender, owner: from, amount: added.toString(), unlimited: added >= (1n << 255n), increase: true };
    const r = erc20Like('erc20_increaseAllowance', grant, encodeApprove(spender, 0n), chainId, opts, ' Remettre à zéro retire aussi un droit plus ancien donné à la même adresse, s’il y en avait un.');
    return r;
  }
  if (sel === SEL.setApprovalForAll && W.length === 2) {
    const operator = wAddr(W[0]), flag = wInt(W[1]);
    if (!operator || isZeroAddr(operator) || flag > 1n) return none('Hold up ne voit pas de droit accordé dans cette demande.');
    if (flag === 0n) return none('Cette demande retire un droit : elle n’en donne pas.');
    const nf = needFrom(); if (nf) return nf;
    return erc20Like('setApprovalForAll', { token: to, spender: operator, owner: from, all: true }, encodeSetApprovalForAll(operator, false), chainId, opts);
  }
  if (sel === SEL.permit && W.length === 7) { // a permit() call : the right exists as soon as it is mined
    const owner = wAddr(W[0]), spender = wAddr(W[1]), value = wInt(W[2]);
    if (!owner || !spender || isZeroAddr(spender) || value === 0n) return none('Cette demande ne donne de droit à personne.');
    const grant = { token: to, spender, owner, amount: value.toString(), unlimited: value >= (1n << 255n), viaPermit: true };
    const r = erc20Like('erc20_permit_call', grant, encodeApprove(spender, 0n), chainId, opts, ' Seul le propriétaire du droit peut le retirer : ce doit être le compte ' + short(owner) + '.');
    return r;
  }
  if (to === PERMIT2 || opts.permit2 === to) {
    if (sel === SEL.permit2Approve && W.length === 4) {
      const token = wAddr(W[0]), spender = wAddr(W[1]), amount = wInt(W[2]);
      if (!token || !spender || isZeroAddr(spender) || amount === 0n) return none('Cette demande ne donne de droit à personne.');
      const nf = needFrom(); if (nf) return nf;
      const grant = { token, spender, owner: from, amount: amount.toString(), unlimited: amount >= (1n << 160n) - 1n, via: 'permit2' };
      const req = walletTx(from, to, encodePermit2Approve(token, spender, 0n, 0n), chainId, `Permit2.approve(${short(token)}, ${short(spender)}, 0, 0) : remet à zéro le droit`);
      return out('revocable', { kind: 'permit2_approve', grant, oneClick: true, requests: [req], says: `Cette demande donne à ${short(spender)} un droit de dépense auprès de Permit2. Une transaction le remet à zéro. ` + PERSON, steps: ['Ton portefeuille affiche la demande de retrait.', 'Tu la lis, puis tu signes ou tu refuses.'], limits: LIMITS.slice(), expiry: { never: false, at: null } });
    }
    if (sel === SEL.permit2Permit && W.length >= 9) {
      const owner = wAddr(W[0]), token = wAddr(W[1]), amount = wInt(W[2]), nonce = wInt(W[4]), spender = wAddr(W[5]);
      if (!owner || !token || !spender || isZeroAddr(spender) || amount === 0n) return none('Cette demande ne donne de droit à personne.');
      const grant = { token, spender, owner, amount: amount.toString(), unlimited: amount >= (1n << 160n) - 1n, via: 'permit2_permit_call', nonce: nonce.toString() };
      const req = walletTx(owner, to, encodeLockdown([[token, spender]]), chainId, `Permit2.lockdown : remet à zéro le droit de ${short(spender)} sur ${short(token)}`);
      return out('revocable', { kind: 'permit2_permit_call', grant, oneClick: true, requests: [req], says: `Cette demande active auprès de Permit2 un droit pour ${short(spender)}. Le verrouillage le remet à zéro. Seul le compte ${short(owner)} peut le faire. ` + PERSON, steps: ['Ton portefeuille affiche la demande de verrouillage.', 'Tu la lis, puis tu signes ou tu refuses.'], limits: LIMITS.slice(), expiry: { never: false, at: null } });
    }
  }
  return none('Hold up ne voit pas de droit accordé dans cette demande.');
}

// ---- off-chain signatures
function parseTyped(request) {
  const p = request.params; let td = p[1];
  if (typeof td === 'string') { if (td.length > 262144) return null; td = JSON.parse(td); }
  return td && typeof td === 'object' && td.domain && td.message && typeof td.primaryType === 'string' ? td : null;
}
const unknownSig = (primary) => out('not_revocable_by_click', {
  kind: 'unknown_signature',
  says: `Cette signature hors chaîne (${String(primary).slice(0, 40)}) n’est pas un droit que Hold up sait défaire. Elle n’est pas encore sur le réseau, mais elle reste utilisable jusqu’à son échéance. Hold up ne propose pas de retrait en un clic. Si tu l’as signée, préviens la plateforme et vérifie tes autres droits.`,
  steps: ['Regarde l’échéance dans la demande, si elle y est.', 'Préviens la plateforme concernée.', 'Vérifie tes autres droits.'], limits: ['Une signature donnée ne se reprend pas : il faut attendre son échéance, ou rendre son numéro inutilisable sur le contrat qui la lit.'], expiry: null
});

function fromTypedData(request, opts) {
  const td = parseTyped(request);
  if (!td) return none('Hold up ne voit pas de droit accordé dans cette demande.');
  const t = td.primaryType, d = td.domain, msg = td.message;
  const chainId = d.chainId !== undefined && big(d.chainId) !== null ? '0x' + big(d.chainId).toString(16) : request.chainId || null;
  const now = opts.nowSec !== undefined ? BigInt(opts.nowSec) : BigInt(Math.floor(Date.now() / 1000));
  const permit2Target = d.name === 'Permit2' && isAddr(d.verifyingContract) ? lc(d.verifyingContract) : null;
  const signer = isAddr(request.params[0]) ? lc(request.params[0]) : isAddr(request.from) ? lc(request.from) : null;

  if (permit2Target && ALLOWANCE_TYPES.has(t)) return permit2Allowance(td, permit2Target, chainId, opts, signer);
  if (permit2Target && TRANSFER_TYPES.has(t)) return permit2Transfer(td, permit2Target, chainId, signer);
  if (t === 'Permit' && isAddr(d.verifyingContract)) {
    const token = lc(d.verifyingContract);
    if (isAddr(msg.owner) && isAddr(msg.spender) && big(msg.nonce) !== null && big(msg.deadline) !== null && big(msg.value) !== null) return eip2612(td, token, chainId, now);
    if (isAddr(msg.holder) && isAddr(msg.spender) && big(msg.nonce) !== null && big(msg.expiry) !== null && typeof msg.allowed === 'boolean') return daiPermit(td, token, chainId, now);
  }
  return unknownSig(t);
}

const replacementTyped = (td, message) => ({ ...td, message });
const signRequest = (owner, td, does) => ({ method: 'eth_signTypedData_v4', params: [lc(owner), JSON.stringify(td)], does, submitTo: 'wallet' });

function eip2612(td, token, chainId, now) {
  const m = td.message, owner = lc(m.owner), spender = lc(m.spender), value = big(m.value), nonce = big(m.nonce), deadline = big(m.deadline);
  if (value === 0n || isZeroAddr(spender)) return none('Cette signature ne donne aucun droit.');
  const grant = { token, spender, owner, amount: value.toString(), unlimited: value >= (1n << 255n), nonce: nonce.toString(), deadline: deadline.toString(), offChain: true };
  const newDeadline = now + 3600n;
  const replacement = replacementTyped(td, { owner, spender: owner, value: '0', nonce: nonce.toString(), deadline: newDeadline.toString() });
  const sign = signRequest(owner, replacement, `Signature d’un permit sans effet (toi vers toi, montant 0) avec le même numéro ${nonce} : une fois envoyé, l’ancien permit ne marche plus`);
  const fallback = walletTx(owner, token, encodeApprove(spender, 0n), chainId, `approve(${short(spender)}, 0) : si le permit a déjà été envoyé, remet le droit à zéro`);
  return out('two_steps', {
    kind: 'eip2612_permit', grant, oneClick: false, requests: [sign], ifAlreadyUsed: [fallback], replacementDeadline: Number(newDeadline), expiry: expiryOf(deadline),
    says: 'Cette signature n’est pas encore sur le réseau, mais quelqu’un qui la détient peut l’envoyer jusqu’à son échéance' + (deadline >= FOREVER ? ' (ici elle n’expire jamais).' : '.') + ' Un clic ne suffit pas à l’annuler. Il faut la rendre inutilisable en dépensant son numéro, ou attendre l’échéance. ' + PERSON,
    steps: [
      `1. Tu signes dans ton portefeuille un permit sans effet, avec le même numéro (${nonce}).`,
      '2. Quelqu’un doit l’envoyer sur le réseau (toi, avec des frais). Dès qu’il est inclus, l’ancienne signature ne marche plus.',
      '3. Si la signature a déjà été envoyée avant, le droit existe : la transaction « approve à zéro » le retire.',
      'Autre voie : ne rien faire et attendre l’échéance, si elle est proche.'
    ],
    limits: ['C’est une course : si l’autre envoie la signature avant ton permit de remplacement, le droit existe.', ...LIMITS]
  });
}

function daiPermit(td, token, chainId, now) {
  const m = td.message, holder = lc(m.holder), spender = lc(m.spender), nonce = big(m.nonce), expiry = big(m.expiry);
  if (!m.allowed || isZeroAddr(spender)) return none('Cette signature ne donne aucun droit.');
  const grant = { token, spender, owner: holder, amount: 'illimité', unlimited: true, nonce: nonce.toString(), deadline: expiry.toString(), offChain: true, dai: true };
  const newExpiry = now + 3600n;
  const replacement = replacementTyped(td, { holder, spender: holder, nonce: nonce.toString(), expiry: newExpiry.toString(), allowed: false });
  const sign = signRequest(holder, replacement, `Signature d’un permit sans effet (toi vers toi, droit refusé) avec le même numéro ${nonce}`);
  const fallback = walletTx(holder, token, encodeApprove(spender, 0n), chainId, `approve(${short(spender)}, 0) : si le permit a déjà été envoyé`);
  return out('two_steps', {
    kind: 'dai_permit', grant, oneClick: false, requests: [sign], ifAlreadyUsed: [fallback], replacementDeadline: Number(newExpiry), expiry: expiryOf(expiry),
    says: 'Cette signature donne un droit illimité dès que quelqu’un l’envoie, jusqu’à son échéance. Un clic ne suffit pas à l’annuler. Il faut dépenser son numéro avec un permit sans effet, ou attendre l’échéance. ' + PERSON,
    steps: [`1. Tu signes un permit sans effet avec le même numéro (${nonce}).`, '2. Quelqu’un doit l’envoyer sur le réseau, avec des frais.', '3. Si la signature a déjà été envoyée, « approve à zéro » retire le droit.'],
    limits: ['C’est une course : le premier envoyé gagne.', ...LIMITS]
  });
}

function permit2Allowance(td, target, chainId, opts, from) {
  const m = td.message, spender = isAddr(m.spender) ? lc(m.spender) : null;
  const details = t => (Array.isArray(t) ? t : [t]);
  const list = details(m.details).filter((x) => x && typeof x === 'object');
  if (!spender || isZeroAddr(spender) || !list.length || list.length > MAX_BATCH || !list.every((x) => isAddr(x.token) && big(x.nonce) !== null && big(x.amount) !== null && big(x.nonce) < MAX_U48)) return unknownSig(td.primaryType);
  if (!from) return out('needs_info', { kind: td.primaryType === 'PermitBatch' ? 'permit2_batch_signature' : 'permit2_signature', says: 'Il manque le compte qui signe. Hold up ne prépare pas de révocation sans lui.' });
  const pairs = list.map((x) => [lc(x.token), spender]);
  const live = opts.state && opts.state.permit2Nonces; // optional : current nonces read on chain, same order as details
  const requests = [], ifAlreadyUsed = [];
  list.forEach((x, i) => {
    const nonce = big(x.nonce), cur = live && big(live[i]) !== null ? big(live[i]) : null;
    if (cur !== null && cur > nonce) return; // already spent : only the allowance can still exist
    requests.push(walletTx(from, target, encodeInvalidateNonces(lc(x.token), spender, nonce + 1n), chainId, `Permit2.invalidateNonces(${short(lc(x.token))}, ${short(spender)}, ${nonce + 1n}) : la signature ne peut plus servir`));
  });
  const lock = walletTx(from, target, encodeLockdown(pairs), chainId, `Permit2.lockdown : remet à zéro le droit déjà actif de ${short(spender)}`);
  if (requests.length) ifAlreadyUsed.push(lock); else requests.push(lock);
  const grant = { token: pairs[0][0], spender, owner: from, amount: String(big(list[0].amount)), unlimited: big(list[0].amount) >= (1n << 160n) - 1n, nonce: String(big(list[0].nonce)), deadline: String(m.sigDeadline), offChain: true, tokens: pairs.map((p) => p[0]), via: 'permit2' };
  return out('revocable', {
    kind: td.primaryType === 'PermitBatch' ? 'permit2_batch_signature' : 'permit2_signature', grant, oneClick: false, requests, ifAlreadyUsed, expiry: expiryOf(m.sigDeadline),
    says: 'Cette signature n’est pas encore sur le réseau. Permit2 permet de la rendre inutilisable, mais par une ou deux transactions que tu signes, pas par un seul clic. ' + PERSON,
    steps: [
      requests.length > 1 || ifAlreadyUsed.length ? '1. La première transaction invalide le numéro de la signature : si elle n’a pas été envoyée, elle ne servira plus.' : '1. Le verrouillage remet à zéro le droit déjà actif.',
      ifAlreadyUsed.length ? '2. La seconde remet à zéro le droit si la signature a déjà été envoyée avant.' : '2. Vérifie ensuite qu’aucun droit ne reste.',
      'Si la signature a déjà été envoyée, la première transaction échoue : c’est normal, la seconde fait le travail.'
    ],
    limits: ['C’est une course : si l’autre envoie la signature avant ta transaction, le droit existe, puis le verrouillage le retire.', ...LIMITS]
  });
}

function permit2Transfer(td, target, chainId, owner) {
  const m = td.message, nonce = big(m.nonce), spender = isAddr(m.spender) ? lc(m.spender) : null;
  if (nonce === null || nonce > MAX_U256 || !spender) return unknownSig(td.primaryType);
  if (!owner) return out('needs_info', { kind: 'permit2_transfer_signature', says: 'Il manque le compte qui signe. Hold up ne prépare pas de révocation sans lui.' });
  const wordPos = nonce >> 8n, mask = 1n << (nonce & 255n);
  const req = walletTx(owner, target, encodeInvalidateUnordered(wordPos, mask), chainId, `Permit2.invalidateUnorderedNonces(${wordPos}, bit ${nonce & 255n}) : cette signature de transfert ne peut plus servir`);
  return out('revocable', { kind: 'permit2_transfer_signature', grant: { spender, owner, nonce: nonce.toString(), deadline: String(m.deadline), offChain: true, via: 'permit2' }, oneClick: true, requests: [req], expiry: expiryOf(m.deadline),
    says: 'Cette signature autorise un transfert unique, pas encore fait. Une transaction que tu signes la rend inutilisable, si personne ne l’a déjà envoyée. ' + PERSON,
    steps: ['Ton portefeuille affiche la transaction.', 'Tu la lis, puis tu signes ou tu refuses.'], limits: ['Si la signature a déjà servi, le transfert est fait : rien ne le ramène.', ...LIMITS] });
}

/** After the person signed the harmless permit (EIP-2612), the transaction that spends the nonce. Still submitted to the wallet. */
export function permitNonceSpendTx(result, signature, chainId) {
  if (!result || result.kind !== 'eip2612_permit' || typeof signature !== 'string' || !/^0x[0-9a-fA-F]{130}$/.test(signature)) return null;
  const r = '0x' + signature.slice(2, 66), s = '0x' + signature.slice(66, 130); let v = parseInt(signature.slice(130, 132), 16); if (v < 27) v += 27;
  const g = result.grant;
  return walletTx(g.owner, g.token, encodePermit(g.owner, g.owner, 0n, result.replacementDeadline, v, r, s), chainId || null, 'permit(toi, toi, 0) : dépense le numéro, l’ancienne signature ne marche plus');
}

/** One honest line per status, for a button label. */
export function buttonLabel(result) {
  if (!result) return null;
  if (result.status === 'revocable' && result.oneClick) return 'Révoquer ce droit';
  if (result.status === 'revocable' || result.status === 'two_steps') return 'Voir comment annuler ce droit';
  if (result.status === 'needs_info') return 'Voir ce qu’il manque pour annuler ce droit';
  return null;
}

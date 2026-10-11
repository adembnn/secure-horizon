// D-SIGNATURES : off-chain signatures that grant a spending right, read by SHAPE and not by primaryType name.
//  (1) typed data whose message carries a spender plus an amount / `allowed` flag (EIP-2612, DAI permit, Permit2 single,
//      batch, transfer, witness), whatever the primaryType is called (the engine only knows the canonical names and
//      answers `unknown_typed_data` for a renamed type) :
//        - spender outside known protocols and amount effectively unlimited            -> critical
//        - spender outside known protocols and the declared intent is not a swap/buy   -> critical
//        - Permit2 *transfer* (funds leave on signature) with an unlimited amount      -> critical, any spender
//      An unlimited allowance to a KNOWN protocol with a swap intent stays at the engine level (normal router usage).
//      A permit whose owner is not the signer cannot be executed against the signer : it is not a reason to lower,
//      the same rule applies to it (fail closed, the page is asking for a right in someone's name).
//  (2) personal_sign of a binary payload shaped like ABI calldata (4-byte selector + 32-byte words, first word a
//      left-padded address) : the "message" is a contract call in disguise -> critical. No selector list : shape only.
//  (3) personal_sign of a readable text that says it grants / authorizes / migrates assets, outside Sign-In with
//      Ethereum : keyword fallback (no model), reported as such -> critical.
// NIST CSF DE.AE-02, DE.CM-09, RS.MI-01 ; MITRE ATT&CK T1656, T1657 ; OWASP ASI09 ; D3FEND D3-MAN (message analysis).
import { lc, isAddr, isKnown, parseTyped, big } from './util.mjs';

const TWO128 = 1n << 128n;
const SWAP_KINDS = new Set(['buy_or_swap']);

function decimalsOf(ctx, token) {
  const m = (ctx.tokenMeta || {})[lc(token)];
  return m && Number.isFinite(m.decimals) ? m.decimals : 18;
}
// "unlimited" = more than anyone holds : >= 2^128, or >= one billion whole units of the token
export function effectivelyUnlimited(ctx, token, amount) {
  const a = big(amount);
  return a >= TWO128 || a >= 10n ** BigInt(9 + decimalsOf(ctx, token));
}

export function grantsOf(td) {
  if (!td || typeof td.message !== 'object' || !td.message) return [];
  const m = td.message;
  const domainToken = td.domain && td.domain.verifyingContract;
  const spender = [m.spender, m.operator, m.usr].find(isAddr);
  if (!spender) return [];
  const owner = [m.owner, m.holder].find(isAddr);
  const out = [];
  const push = (mode, token, amount, allowed) => out.push({ mode, token, amount, allowed, spender, owner });
  const list = (x) => (Array.isArray(x) ? x : x && typeof x === 'object' ? [x] : []);
  for (const d of list(m.details)) push('allowance', d.token, d.amount);
  for (const p of list(m.permitted)) push('transfer', p.token, p.amount);
  if (!out.length) {
    if (m.allowed === true || m.allowed === 'true') push('allowance', domainToken, undefined, true);
    else for (const k of ['value', 'amount', 'wad']) if (m[k] !== undefined && typeof m[k] !== 'object') { push('allowance', domainToken, m[k]); break; }
  }
  return out;
}

const hexBytes = (h) => (typeof h === 'string' && /^0x([0-9a-fA-F]{2})*$/.test(h) ? Buffer.from(h.slice(2), 'hex') : null);
const readable = (b) => { const s = b.toString('utf8'); return !s.includes('�') && !/[\x00-\x08\x0e-\x1f]/.test(s) ? s : null; };
// [0..8 junk bytes] + selector + first argument = address left-padded to 32 bytes, at least one more (possibly truncated) word.
// The junk prefix is the evasion (a 3-4 byte tag in front of the call hides the selector from a decoder that expects it at offset 0) ;
// objection : "random binary can contain 12 zero bytes then 12 non-zero ones" : at one of 9 offsets, ~2^-100, and a hash has no zero run.
export function looksLikeCalldata(b) {
  if (!b) return false;
  for (let s = 0; s <= 8; s++) {
    if (b.length < s + 4 + 32 + 20) break;
    if (!b.subarray(s + 4, s + 16).every((x) => x === 0)) continue;
    if (b.subarray(s + 16, s + 36).filter((x) => x !== 0).length >= 12) return s;
  }
  return false;
}

const GRANT = /\b(authori[sz]\w*|grant\w*|approv\w*|permission\w*|allow\w*|migrat\w*|transfer\w*|autoris\w*|approuv\w*|accord\w*|transf[eè]r\w*)\b/i;
const ASSET = /\b(tokens?|nfts?|assets?|balances?|funds?|spending|jetons?|soldes?|fonds|avoirs?|d[ée]pense)\b/i;
const SIWE = /wants you to sign in with your Ethereum account/i;

export const sigRights = {
  id: 'sig_rights',
  run({ ctx, request, intent }) {
    if (!request) return null;
    const flags = [];
    if (request.method === 'eth_signTypedData_v4') {
      const td = parseTyped(request);
      const kind = intent && intent.kind;
      for (const g of grantsOf(td)) {
        const unl = g.allowed === true || effectivelyUnlimited(ctx, g.token, g.amount);
        const known = isKnown(ctx, g.spender);
        const who = `${lc(g.spender)}${known ? '' : ', hors protocoles connus'}`;
        const what = unl ? 'illimité' : 'limité';
        if (g.mode === 'transfer' && unl) flags.push({ code: 'signed_transfer_unlimited', severity: 'critical', detail: `la signature autorise ${who} à retirer un montant illimité de ${lc(g.token)}` });
        else if (!known && unl) flags.push({ code: 'signed_right_unlimited_unknown', severity: 'critical', detail: `la signature accorde un droit de dépense illimité sur ${lc(g.token)} à ${who}` });
        else if (!known && !SWAP_KINDS.has(kind)) flags.push({ code: 'signed_right_not_intended', severity: 'critical', detail: `la signature accorde un droit de dépense (${what}) sur ${lc(g.token)} à ${who}, alors que l'intention déclarée n'est pas un échange` });
        if (flags.length) break;
      }
    } else if (request.method === 'personal_sign') {
      const b = hexBytes(request.params && request.params[0]);
      if (b) {
        const text = readable(b);
        const off = !text ? looksLikeCalldata(b) : false;
        if (off !== false) flags.push({ code: 'signed_calldata', severity: 'critical', detail: `le « message » à signer a la forme d'un appel de contrat (sélecteur 0x${b.subarray(off, off + 4).toString('hex')}${off ? `, après ${off} octets de préfixe` : ''}, adresse 0x${b.subarray(off + 16, off + 36).toString('hex')}) et non d'un texte` });
        else if (text && !SIWE.test(text) && GRANT.test(text) && ASSET.test(text)) flags.push({ code: 'signed_text_grants_assets', severity: 'critical', detail: 'le texte à signer dit accorder ou déplacer des actifs (repli par mots-clés, sans modèle)' });
      }
    }
    return flags.length ? { flags } : null;
  },
};

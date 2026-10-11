// D-LOT : recursive floor. A spending right granted by a SUB-CALL of a batch (Multicall3 aggregate*/tryAggregate, forwarder
// execute, router multicall, wallet_sendCalls, padded sub-calls, any decoded node) follows the SAME rule as the direct path :
//  - ERC-20 approve / increaseAllowance / permit, or ERC-721/1155 setApprovalForAll, whose beneficiary is neither a known
//    protocol nor the user                                                           -> critical (direct path : always critical)
//  - an amount >= 2^128 or >= one billion whole units counts as unlimited (effectivelyUnlimited) : a "finite but huge"
//    allowance is not a lesser right, so no known-protocol exemption applies to it unless the beneficiary is known AND
//    the declared intent is a swap (normal router usage, engine keeps its warn).
// The engine only emits `batch_foreign_unlimited_approval` (warn) for an UNLIMITED approve whose decoded owner is the relay,
// and nothing at all for a finite one : the recursive path was strictly weaker than the direct one.
// Objection (a practitioner will make it) : "Multicall3 runs the approve in its own name, on its own balance, so the user
// loses nothing". True for Multicall3 itself, but (1) the wallet cannot tell a relay that acts in its own name from a
// forwarder, a smart account or a delegatecall acting with the user's authority ; (2) nobody signs a batch whose only
// purpose is to hand an unknown address a right on the relay's balance : in a request the user did not ask for, it is
// either a disguised drain or a decoy, and the cost of the alert is one confirmation. Known beneficiaries are exempt.
//  - the same rule on the engine's weak heuristic (`eff.embedded` : a sensitive selector found 32-byte aligned inside an
//    opaque call that could not be decoded strictly) : an approve / increaseAllowance / permit naming an unknown spender is
//    critical. Objection : an aligned 4-byte match inside arbitrary bytes can be a coincidence ; we require a decoded
//    spender that looks like a real address (>= 12 non-zero bytes), so a coincidental match is ~2^-70 per word.
// NIST CSF DE.AE-02, DE.CM-09, RS.MI ; MITRE ATT&CK T1657 ; OWASP ASI02 (tool misuse) ; D3FEND D3-MAN (message analysis).
import { lc, isAddr, isKnown, isSelf } from './util.mjs';
import { effectivelyUnlimited } from './sig_rights.mjs';

const looksReal = (a) => a.slice(2).match(/../g).filter((b) => b !== '00').length >= 12;

export const batchRights = {
  id: 'batch_rights',
  run({ eff, ctx }) {
    if (!eff) return null;
    const nestedApprovals = (eff.approvals || []).filter((a) => a.path && a.path !== '0');
    const subCalls = [...(eff.thirdParty || []).filter((t) => t.kind === 'approval'), ...nestedApprovals];
    for (const a of subCalls) {
      const sp = lc(a.spender);
      if (!sp || isSelf(ctx, sp) || isKnown(ctx, sp)) continue;
      const nft = a.via === 'setApprovalForAll' || a.std === 'nft_all';
      const unl = nft || a.amount === 'unlimited' || effectivelyUnlimited(ctx, a.token, a.amountRaw);
      return { flags: [{ code: 'batch_right_unvouched', severity: 'critical', detail: `un sous-appel du lot accorde un droit de dépense (${a.via || 'approve'}, ${unl ? 'illimité' : 'limité'}) sur ${lc(a.token)} à ${sp}, hors protocoles connus : même règle que l'appel direct` }] };
    }
    for (const e of eff.embedded || []) {
      const a = e.args || {};
      if (e.family === 'transfer' && e.name === 'transferFrom') { // same rule as indirect_pull : the user's funds pulled to a stranger
        const to = lc(a.to);
        if (isAddr(to) && isSelf(ctx, a.from) && !isSelf(ctx, to) && !isKnown(ctx, to) && looksReal(to)) return { flags: [{ code: 'embedded_pull_unvouched', severity: 'critical', detail: `un appel opaque contient un transferFrom de vos fonds vers ${to} (heuristique), hors protocoles connus` }] };
        continue;
      }
      if (!['allowance', 'permit', 'permit2'].includes(e.family)) continue;
      const sp = lc((e.args || {}).spender || (e.args || {}).operator);
      if (!isAddr(sp) || isSelf(ctx, sp) || isKnown(ctx, sp)) continue;
      if (!looksReal(sp)) continue;
      return { flags: [{ code: 'embedded_right_unvouched', severity: 'critical', detail: `un appel opaque contient ${e.name} (heuristique) au profit de ${sp}, hors protocoles connus : même règle que l'appel direct` }] };
    }
    return null;
  },
};

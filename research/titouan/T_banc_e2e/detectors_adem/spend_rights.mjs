// D-DROITS : spending rights granted to a counterparty the user cannot vouch for.
//  (1) approval / increaseAllowance / permit (on-chain or signed off-chain) to a spender that is NOT a known protocol and
//      that is a fresh contract (< 1 day old) or first seen by the user while the site is not a known protocol host
//      -> critical. The engine keeps a warn (`external_spender`) for these ; a drainer contract is exactly that.
//  (2) swap with NO minimum output (amountOutMin = 0) executed by a router that is not a known protocol -> critical :
//      the attacker controls the pool / router and can return nothing.
// Block times are public chain constants (Ethereum ~12 s, Avalanche C-Chain / Fuji ~2 s).
// NIST CSF DE.AE-02, DE.CM-09, RS.MI ; MITRE ATT&CK T1657 ; OWASP ASI02 ; D3FEND D3-OTF (outbound traffic filtering, by analogy).
import { lc, isKnown, factOf } from './util.mjs';

const BLOCKS_PER_DAY = { 1: 7200, 11155111: 7200, 43114: 43200, 43113: 43200 };
export function isFresh(ctx, a) {
  const f = factOf(ctx, a);
  if (Number.isFinite(f.ageDays)) return f.ageDays < 1;
  if (Number.isFinite(f.age_days)) return f.age_days < 1;
  const b = Number.isFinite(f.ageBlocks) ? f.ageBlocks : ctx.ageBlocks && ctx.ageBlocks[lc(a)];
  if (!Number.isFinite(b)) return false;
  return b < (BLOCKS_PER_DAY[Number(ctx.chainId)] ?? 7200);
}

export const spendRights = {
  id: 'spend_rights',
  run({ eff, ctx }) {
    if (!eff) return null;
    const flags = [];
    for (const ap of eff.approvals || []) {
      const sp = lc(ap.spender);
      if (isKnown(ctx, sp)) continue;
      const f = factOf(ctx, sp);
      const fresh = isFresh(ctx, sp);
      if (fresh || (f.firstSeenByUser === true && f.isContract !== undefined)) {
        flags.push({ code: 'right_to_unvouched_spender', severity: 'critical', detail: `droit de dépense (${ap.via}) sur ${ap.token} accordé à ${sp}, hors protocoles connus${fresh ? ', contrat de moins d\'un jour' : ', jamais vu par vous'}` });
        break;
      }
    }
    if ((eff.risk_flags || []).some((x) => x.code === 'slippage_unbounded')) {
      const router = eff.raw && eff.raw.to;
      if (router && !isKnown(ctx, router)) flags.push({ code: 'swap_no_min_unknown_router', severity: 'critical', detail: `échange sans minimum reçu via ${lc(router)}, hors routeurs connus : la sortie peut être nulle` });
    }
    return flags.length ? { flags } : null;
  },
};

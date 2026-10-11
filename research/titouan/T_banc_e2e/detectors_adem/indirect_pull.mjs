// D-INDIRECT : attribution of who grants / who pays inside indirect execution (Multicall3 aggregate*/tryAggregate,
// Universal Router, router multicall(bytes[]), Safe/AA batches, wallet_sendCalls) -- the engine decodes the tree recursively;
// this detector reads WHO executes each sub-call.
//  - an approve executed BY a relay contract (msg.sender = the relay) only commits the relay's own balance : it does not
//    commit the victim -> no flag here (the engine keeps its warn `batch_foreign_unlimited_approval`).
//  - a transferFrom / Permit2 transferFrom whose `from` is the victim but which is executed by ANOTHER caller (the relay)
//    spends an allowance the victim granted earlier : it commits the victim. If the funds go to an address that is
//    neither the victim, nor a known protocol, nor a contract taking part in the decoded call tree -> critical.
// NIST CSF DE.CM-09 / DE.AE-02 ; MITRE ATT&CK T1657 (financial theft) ; OWASP ASI02 (tool misuse) ; D3FEND D3-PSA (process spawn analysis analogue : call-tree analysis).
import { lc, isKnown, isSelf, factOf } from './util.mjs';

export const indirectPull = {
  id: 'indirect_pull',
  run({ eff, ctx }) {
    if (!eff || !(eff.outgoing || []).length) return null;
    const byPath = new Map((eff.nested || []).map((n) => [n.path, n]));
    const treeTargets = new Set((eff.nested || []).map((n) => lc(n.to)));
    const flags = [];
    for (const o of eff.outgoing) {
      if (o.std === 'native' || !o.path) continue;
      const node = byPath.get(o.path);
      if (!node) continue; // root call : the victim pays directly, other rules apply
      if (isSelf(ctx, node.sender)) continue; // executed by the victim herself (router multicall keeps msg.sender)
      const to = lc(o.to);
      if (isSelf(ctx, to) || isKnown(ctx, to)) continue;
      if (treeTargets.has(to) && factOf(ctx, to).isContract !== false) continue; // funds routed to a contract of the tree (pool, router)
      flags.push({ code: 'pull_via_existing_allowance', severity: 'critical', detail: `un sous-appel (${o.path}) exécuté par ${node.sender} prélève vos ${o.symbol || o.token} grâce à une autorisation existante et les envoie à ${to}` });
    }
    return flags.length ? { flags: flags.slice(0, 2) } : null;
  },
};

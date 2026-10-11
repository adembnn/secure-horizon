// D-RELAIS : native value that only TRANSITS through a relay (Multicall3 aggregate3Value, a forwarder, a batch in a batch).
// The engine attributes the outgoing amount to the contract the user calls (the relay, often a known protocol) and records the
// forwarded sub-call in `eff.nested` (sender = the relay, value > 0, no calldata) : every recipient rule (lookalike, dust, first payment)
// then looks at the relay and sees nothing. Measured on the demo lab (real execution on a local fork) : a plain AVAX payment wrapped in
// Multicall3, even to the lookalike of a contact, raised no alert on any door, with or without the other detectors.
// Rule : the final recipients of the value are the leaves of the call tree that receive value with no calldata. For each one that is
// neither the user, nor a known protocol, nor an address the user saved or already paid :
//   - it resembles an address the user knows (USENIX Sec. 2025 : prefix >= 3 and suffix >= 4)      -> critical [forwarded_value_lookalike]
//   - its only trace in the history is incoming dust                                               -> critical [forwarded_value_dust_only]
//   - it is the ONLY final recipient of the batch                                                  -> critical [forwarded_value_single_stranger]
//   - several final recipients (payroll, disperse)                                                 -> warn     [forwarded_value_hidden_recipient]
// Objections (a practitioner will make them) :
//   - "disperse / payroll tools pay many people through one contract" : several recipients stay a warning that names them.
//   - "a relayer or a bridge forwards my value" : it forwards it to a contract with calldata (a call), not as a bare payment ; out of scope here.
//   - "why red for one hidden recipient ?" : wrapping ONE plain payment in a batch has no purpose except hiding who is paid from the
//     wallet's own screen ; the cost of the alert is one confirmation, and paying that person directly raises nothing.
// NIST CSF DE.AE-02, DE.CM-09 ; MITRE ATT&CK T1036 (masquerading), T1657 ; OWASP ASI02 (tool misuse) ; D3FEND D3-PSA (call-tree analysis, by analogy).
import { lc, isAddr, isKnown, isSelf, trustedAddresses, matchLens, big } from './util.mjs';

export function forwardedRecipients(eff, ctx) {
  const out = new Map();
  for (const n of (eff && eff.nested) || []) {
    if (!n || !isAddr(n.to) || isSelf(ctx, n.sender)) continue;
    if (big(n.value) <= 0n) continue;
    if (n.selector || (n.family && n.family !== 'native')) continue; // a call with calldata is a service, not a bare payment
    const a = lc(n.to);
    out.set(a, (out.get(a) || 0n) + big(n.value));
  }
  return out;
}

export const forwardedValue = {
  id: 'forwarded_value',
  run({ eff, ctx }) {
    if (!eff) return null;
    const rec = forwardedRecipients(eff, ctx);
    if (!rec.size) return null;
    const trusted = trustedAddresses(ctx);
    const dustIn = new Set((ctx.history || []).filter((h) => h.direction === 'in' && h.dust).map((h) => lc(h.address)));
    const strangers = [...rec.keys()].filter((a) => !isSelf(ctx, a) && !isKnown(ctx, a) && !trusted.has(a));
    if (!strangers.length) return null;
    for (const a of strangers) {
      for (const [t, info] of trusted) {
        const { prefix, suffix } = matchLens(a, t);
        if (prefix >= 3 && suffix >= 4) return { flags: [{ code: 'forwarded_value_lookalike', severity: 'critical', detail: `l'argent ne s'arrête pas au contrat appelé : il est reversé à ${a}, qui imite ${t} (${info.src}${info.label ? ' « ' + info.label + ' »' : ''})` }] };
      }
      if (dustIn.has(a)) return { flags: [{ code: 'forwarded_value_dust_only', severity: 'critical', detail: `l'argent est reversé à ${a}, qui n'apparaît dans votre historique que comme expéditeur de poussière` }] };
    }
    if (rec.size === 1) return { flags: [{ code: 'forwarded_value_single_stranger', severity: 'critical', detail: `l'argent ne s'arrête pas au contrat appelé : il est aussitôt reversé à ${strangers[0]}, une adresse que vous n'avez jamais payée, cachée dans un envoi groupé` }] };
    return { flags: [{ code: 'forwarded_value_hidden_recipient', severity: 'warn', detail: `cet envoi groupé reverse l'argent à ${strangers.length} adresse(s) que vous n'avez jamais payée(s), dont ${strangers[0]}` }] };
  },
};

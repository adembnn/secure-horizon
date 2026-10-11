// D-POUSSIERE : address poisoning in both directions, read from WHO THE USER HAS ACTUALLY DEALT WITH.
// An address the user knows = address book, or an address already paid (outgoing history), or a protocol listed by the wallet. An address
// that only ever SENT something to the user (incoming history, especially dust <= 0.01) is not known : sending dust costs the attacker
// nothing and is exactly how a lookalike gets into the history.
//  (1) RAISE ["dust_only_recipient"] : a direct recipient whose only trace in the history is incoming dust is critical, whatever the declared
//      intent. The engine treats "present in the history" as "known" (firstSeenByUser=false) and lets it through.
//      Objection : "a friend once sent me 0.01 as a test and I now pay him" ; then he is also in the book or was paid, and the rule does not
//      fire ; otherwise one confirmation on an address the user never chose.
//  (2) LOWER [documented false-positive fix] : the user pays a recipient who is in the book or was already paid, and the ONLY reason for
//      the critical is that this recipient resembles an address that merely sent dust (the engine's lookalike_address / address_poisoning).
//      The poison dust is what the attacker hopes the user will copy ; paying the real contact is the correct behaviour. We lower to warn if
//      another warn remains (share of balance, young contract), to ok otherwise. NEVER applied when the lookalike is itself in the book, was
//      paid, or is the destination (that is the attack, and it stays critical), nor when any other critical reason exists.
//      Objection : "a poisoner could also have been paid before" ; then the lookalike has an outgoing entry and the rule does not fire.
// NIST CSF DE.AE-02, DE.AE-04 ; MITRE ATT&CK T1036 (masquerading), T1657 ; OWASP ASI09 (human trust exploitation) ; D3FEND D3-ID (identifier analysis).
import { lc, isAddr, isKnown, isSelf, trustedAddresses, benchLower } from './util.mjs';

const WARN_CODES = new Set(['new_contract', 'high_balance_share', 'unlimited_approval_swap', 'low_confidence']);
const LOOKALIKE_REASONS = new Set(['lookalike_address', 'address_poisoning']);

export const dustGuard = {
  id: 'dust_guard',
  run({ ctx, eff, policy }) {
    if (!eff) return null;
    const trusted = trustedAddresses(ctx);
    const dustIn = new Set((ctx.history || []).filter((h) => h.direction === 'in' && h.dust).map((h) => lc(h.address)));
    const outs = (eff.outgoing || []).filter((o) => isAddr(o.to) && !isKnown(ctx, o.to) && !isSelf(ctx, o.to));

    // (1) address known only through dust
    for (const o of outs) {
      const a = lc(o.to);
      if (dustIn.has(a) && !trusted.has(a)) return { flags: [{ code: 'dust_only_recipient', severity: 'critical', detail: `${a} n'apparaît dans votre historique que comme expéditeur de poussière : ce n'est pas une adresse que vous connaissez` }] };
    }

    // (2) real contact flagged because a dust sender looks like it
    if (!policy) return null;
    const crit = (policy.reasons || []).filter((r) => (r.sev || (WARN_CODES.has(r.code) ? 'warn' : 'critical')) === 'critical');
    const flagCrit = (eff.risk_flags || []).filter((f) => f.severity === 'critical');
    if (!crit.length || !crit.every((r) => LOOKALIKE_REASONS.has(r.code)) || flagCrit.some((f) => !LOOKALIKE_REASONS.has(f.code))) return null;
    const lookalikes = (eff.counterparties || []).filter((c) => c.lookalikeOf);
    if (!lookalikes.length || !outs.length) return null;
    const bad = lookalikes.some((c) => {
      const real = lc(c.address), poison = lc(c.lookalikeOf);
      const poisonDeals = trusted.has(poison) || isKnown(ctx, poison);
      return !trusted.has(real) || poisonDeals || !dustIn.has(poison); // keep critical unless: real is vouched, poison is a pure dust sender
    });
    if (bad) return null;
    // COUPÉ dans le chemin produit (règle : jamais de baisse, jamais de vert). Rendu seulement au banc (HOLDUP_BENCH_LOWER=1), et jamais jusqu'à `ok` : plancher `warn`.
    if (!benchLower()) return null;
    return { lower: { to: 'warn', why: 'le destinataire est dans le carnet ou déjà payé ; seul le sosie ayant envoyé de la poussière le fait paraître suspect (le sosie n\'est ni au carnet ni payé)' } };
  },
};

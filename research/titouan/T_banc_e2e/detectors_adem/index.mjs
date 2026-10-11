// Registry of Adem's detectors, applied in order by redteam/check_plus.mjs after the engine + comparator + policy chain.
// Each detector: { id, run({c, ctx, eff, request, intent, level, reasons, adem, policy}) -> null | { flags: [{code, severity, detail}], lower?: {to, why} } }
// Rules read only the decoded request, the case context (what a wallet would know) and public facts.
// No case id, no address copied from the measurement set.
export const DETECTORS = [];

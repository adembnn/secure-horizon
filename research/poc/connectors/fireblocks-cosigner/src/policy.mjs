// Sentinelle policy: out-of-band guard on custodian outflows. Synthetic data only.
export const POLICY = {
  capUsd: 10_000, // ceiling per transfer
  knownAddresses: new Set(['0x1111111111111111111111111111111111111111'.toLowerCase()]), // synthetic allowlist
};
export function decide(req, policy = POLICY) {
  const usd = Number(req.amountUSD);
  const dest = String(req.destAddress || '').toLowerCase();
  if (!Number.isFinite(usd)) return { action: 'REJECT', reason: 'amountUSD missing or not numeric' };
  const known = policy.knownAddresses.has(dest);
  const over = usd > policy.capUsd;
  if (known && !over) return { action: 'APPROVE', reason: null };
  const why = [];
  if (!known) why.push('destination not in allowlist');
  if (over) why.push(`amountUSD ${usd} exceeds cap ${policy.capUsd}`);
  return { action: 'REJECT', reason: `Sentinelle: ${why.join('; ')}` };
}

// Shared helpers for Adem's detectors. Pure functions, no network, no constant taken from the measurement set.
export const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
export const isAddr = (s) => typeof s === 'string' && /^0x[0-9a-fA-F]{40}$/.test(s);
export const ZERO = '0x' + '0'.repeat(40);
export const NATIVE = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export const victimOf = (ctx) => lc(ctx.from);
export const knownSet = (ctx) => new Set([...(ctx.knownSpenders || [])].map(lc));
export const isKnown = (ctx, a) => knownSet(ctx).has(lc(a));
export const factOf = (ctx, a) => (ctx._facts || {})[lc(a)] || {};
export const isSelf = (ctx, a) => lc(a) === victimOf(ctx);

// addresses the user already "knows" by name : address book, outgoing history, known protocols, registry tokens
export function trustedAddresses(ctx) {
  const m = new Map();
  for (const b of ctx._book || []) if (isAddr(b.address)) m.set(lc(b.address), { src: 'carnet', label: b.label });
  for (const h of ctx.history || []) if (h.direction === 'out' && isAddr(h.address) && !m.has(lc(h.address))) m.set(lc(h.address), { src: 'historique' });
  for (const a of ctx.knownSpenders || []) if (!m.has(lc(a))) m.set(lc(a), { src: 'protocole connu' });
  for (const t of (ctx._k && ctx._k.token_registry) || []) if (isAddr(t.address) && !m.has(lc(t.address))) m.set(lc(t.address), { src: 'jeton de référence', label: t.symbol });
  return m;
}

export function matchLens(a, b) {
  const x = lc(a).slice(2), y = lc(b).slice(2);
  let p = 0; while (p < 40 && x[p] === y[p]) p++;
  let s = 0; while (s < 40 && x[39 - s] === y[39 - s]) s++;
  return { prefix: p, suffix: s };
}

// every address a request makes the user pay, authorize, or hand control to (decoded effects)
export function exposedAddresses(eff) {
  if (!eff) return [];
  const out = [];
  for (const o of eff.outgoing || []) out.push({ addr: lc(o.to), role: 'destinataire' });
  for (const a of eff.approvals || []) out.push({ addr: lc(a.spender), role: 'bénéficiaire du droit' });
  for (const c of eff.controlChange || []) out.push({ addr: lc(c.subject), role: 'nouveau titulaire' });
  for (const c of eff.counterparties || []) if ((c.roles || []).includes('swap_recipient')) out.push({ addr: lc(c.address), role: 'destinataire du swap' });
  if (eff.delegation) out.push({ addr: lc(eff.delegation.to), role: 'délégation' });
  if (eff.raw && isAddr(eff.raw.to)) out.push({ addr: lc(eff.raw.to), role: 'contrat appelé' });
  return out.filter((x) => isAddr(x.addr));
}

export const hasValueAtRisk = (eff) => !!eff && ((eff.outgoing || []).length > 0 || (eff.approvals || []).length > 0 || (eff.controlChange || []).length > 0 || !!eff.delegation);

export function parseTyped(request) {
  if (!request || request.method !== 'eth_signTypedData_v4') return null;
  try { return typeof request.params[1] === 'string' ? JSON.parse(request.params[1]) : request.params[1]; } catch { return null; }
}
export const big = (v) => { try { return BigInt(v); } catch { return 0n; } };

// RÈGLE PRODUIT : un détecteur ne peut qu'AGGRAVER un verdict. Les corrections `lower` (dust_guard, intent_guard, nft_orders) sont COUPÉES
// dans le chemin produit : elles ne sont rendues qu'au banc, sous le drapeau HOLDUP_BENCH_LOWER=1 (pour mesurer ce qu'elles auraient fait).
// Même avec le drapeau, pipeline/evaluate_plus.mjs ignore toute baisse (le niveau final n'est jamais sous le serveur seul).
export const benchLower = () => typeof process !== 'undefined' && !!process.env && process.env.HOLDUP_BENCH_LOWER === '1';

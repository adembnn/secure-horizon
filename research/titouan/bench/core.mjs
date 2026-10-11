// Noyau : décodage minimal d'une transaction + règles du filet indépendant de l'intention (v0).
// Aucune adresse ni hash en dur. Les règles ne lisent que l'effet décodé.
const MAX = (1n << 256n) - 1n, BIG = 1n << 255n;
export const SEL = {
  "095ea7b3": "approve", "39509351": "increaseAllowance", "a22cb465": "setApprovalForAll",
  "d505accf": "permit", "a9059cbb": "transfer", "23b872dd": "transferFrom",
  "87517c45": "permit2_approve", "2b67b570": "permit2_permit",
};
const w = (s, i) => s.slice(10 + i * 64, 10 + (i + 1) * 64);
const addr = x => "0x" + x.slice(24);
export function decode(t) {
  const input = t.input || "0x";
  const sel = input.slice(2, 10);
  const kind = SEL[sel] || (input === "0x" ? "native_transfer" : "other");
  const e = { hash: t.hash, from: t.from, to: t.to, type: t.type, kind, sel };
  try {
    if (kind === "approve" || kind === "increaseAllowance") { e.spender = addr(w(input, 0)); const a = BigInt("0x" + w(input, 1)); e.amount = a; e.unlimited = a >= BIG; }
    if (kind === "setApprovalForAll") { e.spender = addr(w(input, 0)); e.unlimited = BigInt("0x" + w(input, 1)) === 1n; e.amount = e.unlimited ? MAX : 0n; }
    if (kind === "permit") { e.spender = addr(w(input, 1)); const a = BigInt("0x" + w(input, 2)); e.amount = a; e.unlimited = a >= BIG; e.relayed = t.from && addr(w(input, 0)).toLowerCase() !== t.from.toLowerCase(); }
    if (kind === "permit2_approve") { e.spender = addr(w(input, 1)); e.amount = BigInt("0x" + w(input, 2)); e.unlimited = e.amount >= (1n << 159n); }
    if (kind === "transfer") { e.recipient = addr(w(input, 0)); e.amount = BigInt("0x" + w(input, 1)); }
  } catch { e.malformed = true; }
  if (t.type === "0x4") e.delegation = true;
  return e;
}
// Un droit réel : montant > 0 (les approve(0) sont des révocations, pas des droits). CORRECTION du 11/10 01h50.
export const isGrant = (e) => e.kind === "setApprovalForAll" ? e.unlimited === true : (e.amount !== undefined && e.amount > 0n);
// ctx.isContract(addr) -> bool (résolu au préalable)
export const RULES = {
  R1_droit_illimite: (e) => e.unlimited && isGrant(e) && e.kind !== "setApprovalForAll",
  R2_setApprovalForAll_true: (e) => e.kind === "setApprovalForAll" && e.unlimited,
  R3_droit_vers_compte_externe: (e, ctx) => !!e.spender && isGrant(e) && ctx.isContract[e.spender] === false,
  R4_permit_hors_chaine_ou_permit2: (e) => ["permit", "permit2_approve", "permit2_permit"].includes(e.kind),
  R5_delegation_7702: (e) => e.delegation === true,
};
export const flagged = (e, ctx) => Object.entries(RULES).filter(([, f]) => f(e, ctx)).map(([n]) => n);

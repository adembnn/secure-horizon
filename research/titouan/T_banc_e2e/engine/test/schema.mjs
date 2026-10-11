// Validation structurelle d'un objet Effects contre le schéma de docs/intent-barrier.md (+ champs étendus).
const ADDR = /^0x[0-9a-f]{40}$/;
const VIA = new Set(['approve', 'permit', 'permit2', 'setApprovalForAll', 'increaseAllowance']);
export function validateEffects(e) {
  const errs = [];
  const need = (c, m) => { if (!c) errs.push(m); };
  need(typeof e === 'object' && e, 'objet');
  if (!e) return errs;
  need(Number.isFinite(e.chainId), 'chainId');
  need(typeof e.from === 'string' && (ADDR.test(e.from) || e.from === ''), 'from');
  need(e.kind === 'transaction' || e.kind === 'signature', 'kind');
  for (const o of e.outgoing || []) { need(typeof o.token === 'string', 'outgoing.token'); need(typeof o.amount === 'string', 'outgoing.amount'); need(ADDR.test(o.to), 'outgoing.to ' + o.to); }
  need(Array.isArray(e.outgoing), 'outgoing[]');
  for (const o of e.incoming || []) { need(typeof o.token === 'string', 'incoming.token'); need(typeof o.amount === 'string', 'incoming.amount'); need(ADDR.test(o.from), 'incoming.from ' + o.from); }
  need(Array.isArray(e.incoming), 'incoming[]');
  need(Array.isArray(e.approvals), 'approvals[]');
  for (const a of e.approvals || []) { need(typeof a.token === 'string', 'approval.token'); need(ADDR.test(a.spender), 'approval.spender'); need(typeof a.amount === 'string', 'approval.amount'); need(VIA.has(a.via), 'approval.via ' + a.via); need(a.expiry === undefined || Number.isFinite(a.expiry), 'approval.expiry'); }
  if (e.delegation !== undefined) { need(ADDR.test(e.delegation.to), 'delegation.to'); need(e.delegation.via === 'eip7702', 'delegation.via'); }
  need(Array.isArray(e.counterparties), 'counterparties[]');
  for (const c of e.counterparties || []) { need(ADDR.test(c.address), 'cp.address'); need(typeof c.isContract === 'boolean', 'cp.isContract'); need(typeof c.firstSeenByUser === 'boolean', 'cp.firstSeen'); need(c.ageBlocks === undefined || Number.isFinite(c.ageBlocks), 'cp.age'); need(c.lookalikeOf === undefined || ADDR.test(c.lookalikeOf), 'cp.lookalikeOf'); }
  need(e.shareOfBalancePct === undefined || Number.isFinite(e.shareOfBalancePct), 'shareOfBalancePct');
  need(e.raw && typeof e.raw === 'object', 'raw');
  // extensions
  need(typeof e.opaque === 'boolean', 'opaque');
  need(Array.isArray(e.controlChange), 'controlChange[]');
  need(Array.isArray(e.nested), 'nested[]');
  need(Array.isArray(e.risk_flags), 'risk_flags[]');
  for (const f of e.risk_flags || []) { need(typeof f.code === 'string' && ['info', 'warn', 'critical'].includes(f.severity), 'risk_flag'); }
  need(['ok', 'warn', 'critical'].includes(e.level), 'level');
  return errs;
}

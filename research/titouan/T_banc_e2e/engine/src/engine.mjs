// Moteur d'effets : tx / signatures -> objet Effects (schéma docs/intent-barrier.md + champs étendus).
import { decodeCall, collect, walk, mkNode, flag } from './calldata.mjs';
import { decodeTypedData, decodePersonalSign, decodeEthSign, newSigRoot } from './typed.mjs';
import { applyRules, lookalikeMatch } from './rules.mjs';
import { decodeRawTx } from './rlp.mjs';
import { lc, isUnlimited, fmtUnits, tokenInfo, strip0x } from './util.mjs';
import { ADDR } from './registry.mjs';
import { keccak256 } from './keccak.mjs';

export const TOPICS = {
  Approval: keccak256('Approval(address,address,uint256)'),
  Transfer: keccak256('Transfer(address,address,uint256)'),
  ApprovalForAll: keccak256('ApprovalForAll(address,address,bool)'),
  Permit2Approval: keccak256('Approval(address,address,address,uint160,uint48)'),
  Permit2Permit: keccak256('Permit(address,address,address,uint160,uint48,uint48)'),
  TransferSingle1155: keccak256('TransferSingle(address,address,address,uint256,uint256)'),
};
const topicAddr = (t) => '0x' + t.slice(26).toLowerCase();

// Effets observés dans les logs d'un reçu (rejeu ex-post / simulation). Dédupliqués contre les acts issus du calldata.
export function attachReceiptEvents(root, ctx, logs) {
  const keyOf = (a) => (a.t === 'transfer' ? ['T', lc(a.token), lc(a.from), lc(a.to), String(a.amount)].join('|') : a.t === 'approval' ? ['A', lc(a.token), lc(a.owner), lc(a.spender)].join('|') : null);
  const seen = new Set(collect(root).acts.map(keyOf).filter(Boolean));
  const ev = mkNode({ to: null, data: '0x', sender: ctx.from }, 1, root.path + '.events');
  ev.name = 'receipt-events'; ev.family = 'events';
  for (const l of logs || []) {
    const t = l.topics || [], tok = lc(l.address);
    const push = (a) => { const k = keyOf(a); if (k && seen.has(k)) return; if (k) seen.add(k); ev.acts.push({ ...a, source: 'event' }); };
    try {
      if (t[0] === TOPICS.Approval && t.length === 3) { const v = BigInt(l.data); push({ t: 'approval', std: 'erc20', token: tok, owner: topicAddr(t[1]), spender: topicAddr(t[2]), amount: v, via: 'approve', revoke: v === 0n }); }
      else if (t[0] === TOPICS.Approval && t.length === 4) push({ t: 'approval', std: 'nft_one', token: tok, owner: topicAddr(t[1]), spender: topicAddr(t[2]), amount: 1n, via: 'approve', revoke: /^0x0{40}$/.test(topicAddr(t[2])), tokenId: BigInt(t[3]) });
      else if (t[0] === TOPICS.ApprovalForAll) push({ t: 'approval', std: 'nft_all', token: tok, owner: topicAddr(t[1]), spender: topicAddr(t[2]), amount: null, via: 'setApprovalForAll', revoke: BigInt(l.data) === 0n });
      else if (t[0] === TOPICS.Transfer && t.length === 3) push({ t: 'transfer', std: 'erc20', token: tok, from: topicAddr(t[1]), to: topicAddr(t[2]), amount: BigInt(l.data) });
      else if (t[0] === TOPICS.Transfer && t.length === 4) push({ t: 'transfer', std: 'erc721', token: tok, from: topicAddr(t[1]), to: topicAddr(t[2]), amount: 1n, id: BigInt(t[3]) });
      else if (t[0] === TOPICS.Permit2Approval && t.length === 4) {
        const d = l.data.slice(2); const amount = BigInt('0x' + d.slice(0, 64)), exp = Number(BigInt('0x' + d.slice(64, 128)));
        push({ t: 'approval', std: 'permit2', token: topicAddr(t[2]), owner: topicAddr(t[1]), spender: topicAddr(t[3]), amount, via: 'permit2', expiry: exp, revoke: amount === 0n });
      }
    } catch { /* log mal formé : ignoré */ }
  }
  if (ev.acts.length) { flag(ev, 'events_attached', 'info', `${ev.acts.length} effet(s) lus dans les logs du reçu`); root.children.push(ev); }
  return ev.acts.length;
}

export const OPACITY_CODES = new Set(['unknown_selector', 'opaque', 'decode_error', 'short_calldata', 'contract_creation', 'no_handler', 'depth_limit', 'too_many_children', 'ur_command_opaque', 'ur_command_unknown', 'ur_length_mismatch', 'multisend_truncated', 'multisend_bad_op', 'safe_bad_operation', 'typed_decode_error', 'unknown_typed_data', 'unknown_typed_data_addresses', 'eip712_hash_error', 'type4_empty_authorization_list']);
const sevRank = { info: 0, warn: 1, critical: 2 };
const big = (v) => (v === undefined || v === null || v === '' ? 0n : BigInt(v));

export function normalizeCtx(ctx = {}) {
  const c = { ...ctx };
  c.from = lc(c.from);
  c.actors = new Set([c.from, ...(c.protected || []).map(lc)].filter(Boolean));
  c.knownSpenders = new Set([...(ctx.knownSpenders || [])].map(lc));
  return c;
}
const fmt = (ctx, token, v) => {
  const info = tokenInfo(ctx, token);
  return { amount: fmtUnits(v, info.decimals), amountRaw: v.toString(), decimals: info.decimals ?? null, symbol: info.symbol };
};

function nestedList(root) {
  const list = [];
  walk(root, (n) => {
    if (n === root) return;
    list.push({ path: n.path, depth: n.depth, op: n.op, sender: n.sender, to: n.to, value: n.value.toString(), selector: n.selector, name: n.name || n.id || null, family: n.family, opaque: n.opaque, allowFailure: n.allowFailure, acts: n.acts.map((a) => a.t + (a.type ? ':' + a.type : '')) });
  });
  return list;
}

export function buildEffects(root, ctx, meta = {}) {
  const { acts, flags: nodeFlags, nodes, opaque } = collect(root);
  const actors = ctx.actors;
  const eff = {
    chainId: Number(ctx.chainId ?? 0), from: ctx.from, kind: meta.kind || 'transaction',
    outgoing: [], incoming: [], approvals: [], counterparties: [],
    raw: { ...(meta.raw || {}) },
    opaque: !!opaque, opaqueReasons: [], controlChange: [], nested: nestedList(root), risk_flags: [],
  };
  for (const n of nodes) if (n.opaque) eff.opaqueReasons.push(...n.flags.filter((f) => /unknown_selector|decode_error|short_calldata|contract_creation|ur_command|no_handler|blind|typed_decode|unknown_typed|delegatecall_unknown|multisend|depth_limit|too_many|ur_length|safe_bad/.test(f.code)).map((f) => f.code));
  eff.opaqueReasons = [...new Set(eff.opaqueReasons)];
  eff.embedded = nodes.flatMap((n) => (n.embedded || []).map((e) => ({ path: n.path, ...e })));
  const delegations = [];
  const third = [];
  for (const a of acts) {
    if (a.t === 'transfer') {
      if (a.amount == null) continue;
      const f = lc(a.from), t = lc(a.to);
      const base = fmt(ctx, a.token, a.amount);
      if (actors.has(f) && actors.has(t)) continue;
      if (actors.has(f)) eff.outgoing.push({ token: a.token, symbol: base.symbol, amount: base.amount, to: t, std: a.std, amountRaw: base.amountRaw, decimals: base.decimals, ...(a.id !== undefined ? { tokenId: a.id.toString() } : {}), ...(a.bound ? { bound: a.bound } : {}), path: a._path });
      else if (actors.has(t)) eff.incoming.push({ token: a.token, symbol: base.symbol, amount: base.amount, from: f, std: a.std, amountRaw: base.amountRaw, decimals: base.decimals, ...(a.id !== undefined ? { tokenId: a.id.toString() } : {}), ...(a.bound ? { bound: a.bound } : {}), path: a._path });
      else third.push({ kind: 'transfer', ...a, amount: a.amount.toString() });
    } else if (a.t === 'approval') {
      if (a.revoke) { eff.risk_flags.push({ code: 'revocation', severity: 'info', detail: `révocation ${a.via} ${a.token}→${a.spender}` }); continue; }
      const owner = lc(a.owner || ctx.from);
      const entry = { token: a.token, spender: lc(a.spender), amount: a.std === 'nft_all' || isUnlimited(a.amount) ? 'unlimited' : fmt(ctx, a.token, a.amount).amount, via: a.via, ...(a.expiry != null && !(a.dai && a.expiry === 0) ? { expiry: a.expiry } : {}), std: a.std, owner, ...(a.amount != null ? { amountRaw: a.amount.toString() } : {}), ...(a.signatureTransfer ? { signatureTransfer: true, witness: !!a.witness } : {}), ...(a.recurring ? { recurring: true } : {}), ...(a.dai ? { dai: true, expiry: a.expiry === 0 ? undefined : a.expiry } : {}) };
      if (a.dai && a.expiry === 0) delete entry.expiry;
      if (actors.has(owner)) eff.approvals.push(entry); else third.push({ kind: 'approval', ...entry });
    } else if (a.t === 'control') {
      eff.controlChange.push({ type: a.type, target: a.target, subject: a.subject, detail: Object.fromEntries(Object.entries(a.detail || {}).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : v])), severity: a.severity, path: a._path });
    } else if (a.t === 'delegation') {
      delegations.push({ to: lc(a.to), via: 'eip7702', chainId: Number(a.chainId), nonce: a.nonce != null ? Number(a.nonce) : undefined });
    }
  }
  const real = delegations.filter((d) => d.to !== ADDR.ZERO);
  if (real.length) eff.delegation = { to: real[0].to, via: 'eip7702' };
  if (delegations.length) eff.delegations = delegations;
  if (third.length) eff.thirdParty = third;

  // part du solde
  if (ctx.balances) {
    let best;
    for (const o of eff.outgoing) { const b = ctx.balances[lc(o.token)] ?? ctx.balances[o.token]; if (b && BigInt(b) > 0n) { const p = Number((BigInt(o.amountRaw) * 10000n) / BigInt(b)) / 100; if (best === undefined || p > best) best = p; } }
    if (best !== undefined) eff.shareOfBalancePct = best;
  }

  // règles + drapeaux de noeuds
  const ruleFlags = applyRules(eff, acts, nodes, ctx);
  const seen = new Set();
  for (const f of [...nodeFlags.map(({ path, ...f }) => ({ ...f, path })), ...ruleFlags, ...eff.risk_flags]) {
    const k = f.code + '|' + f.detail; if (seen.has(k)) continue; seen.add(k); eff._f = (eff._f || []); eff._f.push(f);
  }
  eff.risk_flags = eff._f || []; delete eff._f;
  eff.risk_flags.sort((a, b) => sevRank[b.severity] - sevRank[a.severity]);

  // contreparties
  const now = ctx.now ?? Math.floor(Date.now() / 1000);
  const addrs = new Map();
  const add = (a, role) => { if (!a || !/^0x[0-9a-f]{40}$/.test(lc(a)) || actors.has(lc(a))) return; const k = lc(a); if (!addrs.has(k)) addrs.set(k, new Set()); addrs.get(k).add(role); };
  eff.outgoing.forEach((o) => add(o.to, 'recipient'));
  eff.approvals.forEach((o) => add(o.spender, 'spender'));
  eff.controlChange.forEach((c) => add(c.subject, 'control_subject'));
  (eff.delegations || []).forEach((d) => add(d.to, 'delegate'));
  acts.filter((a) => a.t === 'swap').forEach((a) => add(a.recipient, 'swap_recipient'));
  const histSet = new Set([...(ctx.history || []).filter((h) => h.direction !== 'in'), ...(ctx.contacts || [])].map((h) => lc(h.address))); // une adresse qui n'a fait que NOUS envoyer (poussière) n'est pas 'déjà utilisée'
  const histKnown = !!(ctx.history || ctx.contacts);
  for (const [address, roles] of addrs) {
    const code = ctx.codeOf ? ctx.codeOf(address) : undefined;
    const cp = { address, isContract: code === true, isContractKnown: code !== undefined, firstSeenByUser: !histSet.has(address), historyKnown: histKnown, roles: [...roles] };
    if (ctx.ageBlocks && ctx.ageBlocks[address] !== undefined) cp.ageBlocks = ctx.ageBlocks[address];
    const m = lookalikeMatch(address, [...(ctx.history || []), ...(ctx.contacts || [])], now);
    if (m) cp.lookalikeOf = lc(m.entry.address);
    eff.counterparties.push(cp);
  }
  const lvl = (fl) => (fl.some((f) => f.severity === 'critical') ? 'critical' : fl.some((f) => f.severity === 'warn') ? 'warn' : 'ok');
  // levelEvidence : preuves d'effet seulement ; level : ajoute l'opacité (inconnu n'est jamais un feu vert, SYNTHESE §3.6)
  eff.levelEvidence = lvl(eff.risk_flags.filter((f) => !OPACITY_CODES.has(f.code)));
  eff.level = lvl(eff.risk_flags);
  return eff;
}

// ---- API publique
export function analyzeTransaction(tx, ctx0 = {}, opts = {}) {
  const ctx = normalizeCtx({ ...ctx0, from: ctx0.from ?? tx.from, chainId: ctx0.chainId ?? (tx.chainId !== undefined ? Number(tx.chainId) : undefined) });
  let root;
  try {
    const data = tx.input ?? tx.data ?? '0x';
    root = decodeCall(ctx, { to: tx.to, data, value: big(tx.value), sender: ctx.from }, 0, '0');
    const type = tx.type !== undefined ? Number(tx.type) : 0;
    if (opts.receipt?.logs) attachReceiptEvents(root, ctx, opts.receipt.logs);
    if (type === 4 || tx.authorizationList) {
      const list = tx.authorizationList || [];
      root.txType = 4;
      if (!list.length) flag(root, 'type4_empty_authorization_list', 'warn', 'tx 0x4 sans authorizationList');
      list.forEach((a, i) => {
        const to = a.address ?? a.delegate;
        root.acts.push({ t: 'delegation', to: lc(to), chainId: a.chainId !== undefined ? BigInt(a.chainId) : 0n, nonce: a.nonce !== undefined ? BigInt(a.nonce) : undefined });
        flag(root, 'authorization_tuple', 'info', `auth ${i}: chainId=${a.chainId} → ${to} (signataire non recouvré hors ligne)`);
      });
    }
  } catch (e) {
    root = mkNode({ to: tx.to, data: '0x', sender: ctx.from }, 0, '0'); root.opaque = true; flag(root, 'decode_error', 'warn', String(e.message || e));
  }
  return buildEffects(root, ctx, { kind: 'transaction', raw: { to: lc(tx.to) ?? undefined, selector: root.selector || undefined, value: big(tx.value).toString(), txType: tx.type !== undefined ? Number(tx.type) : 0 } });
}
export function analyzeRawTransaction(rawHex, ctx0 = {}, opts = {}) {
  const tx = decodeRawTx(rawHex);
  return analyzeTransaction(tx, ctx0, opts);
}
export function analyzeTypedData(td, ctx0 = {}) {
  const ctx = normalizeCtx(ctx0);
  let root;
  try { root = decodeTypedData(td, ctx); } catch (e) { root = newSigRoot(ctx, 'typed', 'invalid'); root.opaque = true; flag(root, 'typed_decode_error', 'warn', String(e.message || e)); }
  const obj = typeof td === 'string' ? JSON.parse(td) : td;
  const eff = buildEffects(root, ctx, { kind: 'signature', raw: { primaryType: obj.primaryType, to: lc(obj.domain?.verifyingContract) } });
  eff.signature = { kind: root.typedKind, ...root.typedMeta };
  if (root.siwe) eff.siwe = root.siwe;
  if (root.seaport) eff.seaport = JSON.parse(JSON.stringify(root.seaport, (k, v) => (typeof v === 'bigint' ? v.toString() : v)));
  return eff;
}
export function analyzePersonalSign(msg, ctx0 = {}) {
  const ctx = normalizeCtx(ctx0);
  const root = decodePersonalSign(msg, ctx);
  const eff = buildEffects(root, ctx, { kind: 'signature', raw: { primaryType: root.siwe ? 'SIWE' : 'personal_sign' } });
  eff.signature = { kind: root.typedKind || (root.blind ? 'blind' : 'personal_sign'), bytes: root.messageBytes };
  if (root.siwe) eff.siwe = root.siwe;
  return eff;
}
export function analyzeEthSign(hash, ctx0 = {}) {
  const ctx = normalizeCtx(ctx0);
  const root = decodeEthSign(hash, ctx);
  const eff = buildEffects(root, ctx, { kind: 'signature', raw: { primaryType: 'eth_sign' } });
  eff.signature = { kind: 'eth_sign' };
  return eff;
}
// Signature d'autorisation EIP-7702 hors chaîne : message = keccak(0x05 || rlp([chain_id, address, nonce]))
export function analyzeAuthorization7702(auth, ctx0 = {}) {
  const ctx = normalizeCtx(ctx0);
  const root = newSigRoot(ctx, '7702-authorization', 'EIP7702Authorization');
  root.acts.push({ t: 'delegation', to: lc(auth.address), chainId: BigInt(auth.chainId ?? 0), nonce: auth.nonce !== undefined ? BigInt(auth.nonce) : undefined });
  const eff = buildEffects(root, ctx, { kind: 'signature', raw: { primaryType: 'EIP7702Authorization' } });
  eff.signature = { kind: '7702-authorization' };
  return eff;
}
export { strip0x };

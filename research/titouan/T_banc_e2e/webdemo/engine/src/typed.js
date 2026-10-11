// Décodeur de signatures : EIP-712 typed data, personal_sign, eth_sign. Produit un noeud racine (même forme que calldata).
import { mkNode, flag, child, safeDelegate, decodeCall } from './calldata.js';
import { digest, domainSeparator, typeHash, encodeType, domainType } from './eip712.js';
import { keccak256 } from './keccak.js';
import { ADDR, MULTISEND_OFFICIAL } from './registry.js';
import { lc, isAddr } from './util.js';

export const KNOWN_VERIFIERS = {
  permit2: [ADDR.PERMIT2],
  seaport: ['0x00000000006c3852cbef3e08e8df289169ede581', '0x00000000000001ad428e4906ae43d8f9852d0dd6', '0x00000000000000adc04c56bf30ac9d3c0aaf14dc', '0x0000000000000068f116a894984e2db1123eb395'],
  cow: ['0x9008d19f58aabd9ed0d60971565aa8510560ab41'],
};
export const SEAPORT_ITEM = { 0: 'NATIVE', 1: 'ERC20', 2: 'ERC721', 3: 'ERC1155', 4: 'ERC721_CRITERIA', 5: 'ERC1155_CRITERIA' };
const NATIVE_PLACEHOLDER = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const YEAR = 365 * 86400;

const big = (v) => { try { return BigInt(v); } catch { return 0n; } };
const num = (v) => Number(big(v));
const fields = (td, name) => (td.types[name] || []).map((f) => f.name);
const has = (td, name, ...need) => { const f = fields(td, name); return need.every((n) => f.includes(n)); };

export function newSigRoot(ctx, kind, label) {
  const n = mkNode({ to: null, data: '0x', sender: ctx.from }, 0, 'sig');
  n.family = 'signature'; n.name = label; n.sigKind = kind;
  return n;
}

// ---- contrôles de domaine : chainId et verifyingContract contre réseau/origine
export function checkDomain(root, td, ctx, expectedVerifierGroup, opts = {}) {
  const d = td.domain || {};
  const meta = { domainChainId: null, verifyingContract: null };
  if (d.chainId !== undefined) {
    const c = num(d.chainId); meta.domainChainId = c;
    if (ctx.chainId !== undefined && c !== Number(ctx.chainId)) flag(root, 'domain_chain_mismatch', 'critical', `chainId signé ${c} ≠ réseau courant ${ctx.chainId}`);
  } else if (!opts.legacySafe) flag(root, 'domain_without_chainid', 'warn', 'domaine sans chainId : signature rejouable sur toute chaîne');
  if (d.verifyingContract) {
    const vc = lc(d.verifyingContract); meta.verifyingContract = vc;
    if (expectedVerifierGroup) {
      const ok = (KNOWN_VERIFIERS[expectedVerifierGroup] || []).includes(vc) || (ctx.knownVerifiers && ctx.knownVerifiers.has(vc));
      if (!ok) flag(root, 'domain_verifier_unexpected', 'critical', `verifyingContract ${vc} n'est pas un déploiement connu de ${expectedVerifierGroup}`);
    }
    if (ctx.originAllowlist && ctx.origin) {
      let host = ''; try { host = new URL(ctx.origin).hostname; } catch { host = ctx.origin; }
      const allowed = ctx.originAllowlist[host];
      if (allowed && !allowed.map(lc).includes(vc)) flag(root, 'verifier_not_expected_for_origin', 'warn', `${host} ne signe normalement pas pour ${vc}`);
    }
  }
  return meta;
}

export function decodeTypedData(input, ctx) {
  const td = typeof input === 'string' ? JSON.parse(input) : input;
  const root = newSigRoot(ctx, 'typed', td.primaryType);
  const meta = { primaryType: td.primaryType };
  if (td.domain && td.domain.chainId !== undefined) { try { meta.domainChainId = Number(BigInt(td.domain.chainId)); } catch { /* chainId illisible : non renseigné */ } } // réseau visé par la signature (lu par la politique, F43)
  try {
    const types = { ...td.types }; if (!types.EIP712Domain) types.EIP712Domain = domainType(td.domain || {});
    const full = { ...td, types };
    meta.typeHash = typeHash(td.primaryType, types);
    meta.encodeType = encodeType(td.primaryType, types);
    meta.digest = digest(full);
    meta.domainSeparator = domainSeparator(td.domain || {}, types);
  } catch (e) { flag(root, 'eip712_hash_error', 'warn', e.message); }
  const m = td.message || {}, P = td.primaryType, from = lc(ctx.from);
  const vc = lc(td.domain?.verifyingContract);
  let kind = 'unknown';
  try {
    if (has(td, P, 'owner', 'spender', 'value', 'nonce', 'deadline')) {
      // forme ERC-2612 lue par ses CHAMPS : un primaryType renommé (« Login », « Session »...) ne change pas ce que la signature accorde.
      // Le nom non standard est lui-même signalé : un jeton ERC-2612 ne vérifie que le type « Permit », un autre nom vise un contrat sur mesure.
      kind = P === 'Permit' ? 'permit2612' : 'permit2612.renamed'; checkDomain(root, td, ctx);
      if (P !== 'Permit') flag(root, 'permit_type_renamed', 'warn', `le message « ${P} » a la forme d'un permit ERC-2612 (owner, spender, value, nonce, deadline) : droit de dépense lu par ses champs`);
      root.acts.push({ t: 'approval', std: 'erc20', token: vc, owner: lc(m.owner), spender: lc(m.spender), amount: big(m.value), via: 'permit', expiry: num(m.deadline), revoke: big(m.value) === 0n });
    } else if (has(td, P, 'holder', 'spender', 'nonce', 'expiry', 'allowed')) {
      kind = 'permitDAI'; checkDomain(root, td, ctx);
      root.acts.push({ t: 'approval', std: 'erc20', token: vc, owner: lc(m.holder), spender: lc(m.spender), amount: m.allowed ? (1n << 256n) - 1n : 0n, via: 'permit', expiry: num(m.expiry), revoke: !m.allowed, dai: true });
      if (m.allowed) flag(root, 'dai_permit_no_amount', 'warn', 'DAI permit : pas de montant, droit toujours illimité');
    } else if (P === 'PermitSingle' || (has(td, P, 'details', 'spender', 'sigDeadline') && !Array.isArray(m.details))) {
      kind = 'permit2.single'; checkDomain(root, td, ctx, 'permit2');
      const d = m.details;
      root.acts.push({ t: 'approval', std: 'permit2', token: lc(d.token), owner: from, spender: lc(m.spender), amount: big(d.amount), via: 'permit2', expiry: num(d.expiration), sigDeadline: num(m.sigDeadline), revoke: big(d.amount) === 0n });
    } else if (P === 'PermitBatch' || (has(td, P, 'details', 'spender', 'sigDeadline') && Array.isArray(m.details))) {
      kind = 'permit2.batch'; checkDomain(root, td, ctx, 'permit2');
      for (const d of m.details) root.acts.push({ t: 'approval', std: 'permit2', token: lc(d.token), owner: from, spender: lc(m.spender), amount: big(d.amount), via: 'permit2', expiry: num(d.expiration), sigDeadline: num(m.sigDeadline), revoke: big(d.amount) === 0n });
    } else if (has(td, P, 'permitted', 'spender', 'nonce', 'deadline')) {
      const batch = Array.isArray(m.permitted);
      const base = batch ? ['permitted', 'spender', 'nonce', 'deadline'] : ['permitted', 'spender', 'nonce', 'deadline'];
      const witnessFields = fields(td, P).filter((f) => !base.includes(f));
      const witness = witnessFields.length ? witnessFields[0] : null;
      kind = (batch ? 'permit2.transferBatch' : 'permit2.transfer') + (witness ? '.witness' : '');
      checkDomain(root, td, ctx, 'permit2');
      for (const p of batch ? m.permitted : [m.permitted])
        root.acts.push({ t: 'approval', std: 'permit2', token: lc(p.token), owner: from, spender: lc(m.spender), amount: big(p.amount), via: 'permit2', expiry: num(m.deadline), signatureTransfer: true, witness: witness ? { field: witness, type: td.types[P].find((f) => f.name === witness).type, value: m[witness] } : null, revoke: big(p.amount) === 0n });
      if (!witness) flag(root, 'permit2_transfer_destination_chosen_by_spender', 'warn', 'SignatureTransfer sans witness : le dépensier choisit le destinataire à l\'appel');
      else { flag(root, 'permit2_witness_opaque', 'info', `witness ${witnessFields[0]} : structure ${td.types[P].find((f) => f.name === witness).type}`); root.witness = m[witness]; }
    } else if (P === 'OrderComponents' || has(td, P, 'offerer', 'offer', 'consideration', 'conduitKey')) {
      kind = 'seaport'; seaport(root, td, ctx, m);
    } else if (has(td, P, 'sellToken', 'buyToken', 'receiver', 'sellAmount', 'buyAmount', 'validTo')) {
      kind = 'cow.gpv2order'; cow(root, td, ctx, m);
    } else if (P === 'SafeTx' || has(td, P, 'to', 'value', 'data', 'operation', 'safeTxGas', 'baseGas', 'gasPrice', 'gasToken', 'refundReceiver', 'nonce')) {
      kind = 'safe.safetx'; safeTx(root, td, ctx, m);
    } else if (has(td, P, 'account', 'spender', 'token', 'allowance', 'period', 'start', 'end')) {
      kind = 'spend-permission'; checkDomain(root, td, ctx);
      const total = big(m.allowance) * BigInt(Math.max(1, Math.ceil((num(m.end) - num(m.start)) / Math.max(1, num(m.period)))));
      root.acts.push({ t: 'approval', std: 'erc20', token: lc(m.token), owner: lc(m.account), spender: lc(m.spender), amount: total, perPeriod: big(m.allowance), periodSec: num(m.period), via: 'permit', expiry: num(m.end), revoke: false, recurring: true });
      flag(root, 'recurring_spend_permission', 'warn', `plafond ${m.allowance} par période de ${num(m.period)} s jusqu'à ${num(m.end)} : maximum cumulé ${total}`);
    } else {
      kind = 'unknown'; checkDomain(root, td, ctx);
      root.opaque = true;
      flag(root, 'unknown_typed_data', 'warn', `primaryType ${P} inconnu`);
      const hints = [];
      const scan = (obj, path) => { if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) scan(v, path + '.' + k); else if (typeof obj === 'string' && isAddr(obj)) hints.push(path); };
      scan(m, 'message');
      root.unknownHints = hints;
      if (hints.length) flag(root, 'unknown_typed_data_addresses', 'warn', `adresses dans: ${hints.slice(0, 6).join(', ')}`);
    }
  } catch (e) {
    root.opaque = true; flag(root, 'typed_decode_error', 'warn', `${P}: ${e.message}`);
  }
  root.typedKind = kind; root.typedMeta = meta;
  return root;
}

function seaport(root, td, ctx, m) {
  checkDomain(root, td, ctx, 'seaport');
  const offerer = lc(m.offerer), V = lc(td.domain?.verifyingContract);
  const give = [], get = [], others = [];
  for (const it of m.offer) give.push({ type: num(it.itemType), token: lc(it.token), id: it.identifierOrCriteria, min: big(it.startAmount) < big(it.endAmount) ? big(it.startAmount) : big(it.endAmount), max: big(it.startAmount) > big(it.endAmount) ? big(it.startAmount) : big(it.endAmount) });
  for (const it of m.consideration) {
    const rec = { type: num(it.itemType), token: lc(it.token), id: it.identifierOrCriteria, min: big(it.startAmount) < big(it.endAmount) ? big(it.startAmount) : big(it.endAmount), max: big(it.startAmount) > big(it.endAmount) ? big(it.startAmount) : big(it.endAmount), recipient: lc(it.recipient) };
    (rec.recipient === offerer ? get : others).push(rec);
  }
  const stdOf = (t) => (t === 0 ? 'native' : t === 1 ? 'erc20' : t === 2 || t === 4 ? 'erc721' : 'erc1155');
  for (const g of give) root.acts.push({ t: 'transfer', std: stdOf(g.type), token: g.type === 0 ? ADDR.NATIVE : g.token, from: offerer, to: V, amount: g.max, id: g.id, via: 'seaport-offer', toKind: 'fulfiller' });
  for (const g of get) root.acts.push({ t: 'transfer', std: stdOf(g.type), token: g.type === 0 ? ADDR.NATIVE : g.token, from: V, to: offerer, amount: g.min, id: g.id, bound: 'min', via: 'seaport-consideration' });
  root.seaport = { offerer, give, get, others, orderType: num(m.orderType), startTime: num(m.startTime), endTime: num(m.endTime), zone: lc(m.zone) };
  const key = (x) => (x.type === 0 ? 'native' : x.type <= 1 ? x.token : x.token + '#' + x.id);
  const fungSelf = new Map(); for (const g of get) if (g.type <= 1) fungSelf.set(key(g), (fungSelf.get(key(g)) || 0n) + g.min);
  const fungOther = new Map(); for (const g of others) if (g.type <= 1) fungOther.set(key(g), (fungOther.get(key(g)) || 0n) + g.min);
  const selfTotal = [...fungSelf.values()].reduce((a, b) => a + b, 0n);
  if (get.length === 0 || (selfTotal === 0n && get.every((g) => g.type <= 1))) {
    flag(root, 'seaport_zero_consideration', 'critical', `l'offerer ne reçoit rien en échange de ${give.length} élément(s) (bilan net négatif)`);
  }
  // offre d'ACHAT (l'offreur ne donne que du fongible et reçoit au moins un NFT) : les commissions et redevances versées à des tiers sont prises sur ce qu'il donne,
  // ce n'est pas « son produit » qui part ailleurs. La règle « produit détourné » ne vaut que pour une vente (ou un échange dont l'offreur reçoit du fongible).
  const isBid = give.length > 0 && give.every((g) => g.type <= 1) && get.some((g) => g.type >= 2);
  for (const [k, o] of isBid ? [] : fungOther) {
    const s = fungSelf.get(k) || 0n;
    if (o + s > 0n && Number((o * 1000n) / (o + s)) > 200) flag(root, 'seaport_proceeds_to_other', 'warn', `${(Number((o * 1000n) / (o + s)) / 10).toFixed(1)} % du produit va à d'autres adresses`);
  }
  if (others.some((o) => o.type >= 2) && give.length) flag(root, 'seaport_assets_to_third_party', 'warn', 'un NFT de la consideration va à un tiers');
  if (num(m.endTime) - num(m.startTime) > 2 * YEAR || num(m.endTime) > 4e9) flag(root, 'far_expiry', 'warn', 'ordre valable plus de 2 ans');
  if (give.some((g) => g.type === 4 || g.type === 5)) flag(root, 'seaport_criteria_offer', 'info', 'offre avec critères (collection entière)');
  if (offerer !== lc(ctx.from)) flag(root, 'signer_not_offerer', 'warn', `offerer ${offerer} ≠ signataire ${lc(ctx.from)}`);
}

function cow(root, td, ctx, m) {
  checkDomain(root, td, ctx, 'cow');
  const owner = lc(ctx.from), V = lc(td.domain?.verifyingContract);
  const receiver = lc(m.receiver) === ADDR.ZERO ? owner : lc(m.receiver);
  root.acts.push({ t: 'transfer', std: 'erc20', token: lc(m.sellToken), from: owner, to: V, amount: big(m.sellAmount) + big(m.feeAmount), via: 'cow-order', toKind: 'settlement' });
  if (receiver === owner) root.acts.push({ t: 'transfer', std: 'erc20', token: lc(m.buyToken), from: V, to: owner, amount: big(m.buyAmount), bound: 'min', via: 'cow-order' });
  else flag(root, 'cow_receiver_not_signer', 'critical', `le produit de l'ordre va à ${receiver}, pas au signataire`);
  root.cow = { receiver, kind: m.kind, validTo: num(m.validTo), partiallyFillable: !!m.partiallyFillable };
  if (big(m.buyAmount) === 0n) flag(root, 'cow_zero_buy_amount', 'critical', 'buyAmount = 0 : ordre donnant le sellToken contre rien');
  if (num(m.validTo) - Math.floor((ctx.now || Date.now() / 1000)) > 2 * YEAR) flag(root, 'far_expiry', 'warn', 'ordre valable plus de 2 ans');
}

function safeTx(root, td, ctx, m) {
  const safe = lc(td.domain?.verifyingContract);
  if (td.domain?.chainId === undefined) flag(root, 'domain_without_chainid', 'info', 'Safe < 1.3 : domaine sans chainId');
  const meta = checkDomain(root, td, ctx, null, { legacySafe: true });
  if (ctx.expectedSafe && safe !== lc(ctx.expectedSafe)) flag(root, 'safe_address_mismatch', 'critical', `verifyingContract ${safe} ≠ Safe attendu ${ctx.expectedSafe}`);
  ctx.actors.add(safe);
  root.safeTx = { safe, to: lc(m.to), value: big(m.value), operation: num(m.operation), nonce: num(m.nonce) };
  if (big(m.gasPrice) > 0n && lc(m.refundReceiver) !== ADDR.ZERO) flag(root, 'safe_refund', 'info', `remboursement de gaz vers ${lc(m.refundReceiver)}`);
  const data = m.data && m.data !== '0x' ? m.data : '0x';
  if (num(m.operation) === 1) safeDelegate(ctx, root, lc(m.to), data, 0);
  else child(ctx, root, { to: m.to, data, value: big(m.value), sender: safe, op: 'call' }, 0);
}

// ---- SIWE (EIP-4361)
export function parseSiwe(text) {
  const re = /^(?:([a-zA-Z][a-zA-Z0-9+.-]*):\/\/)?([^\s]+) wants you to sign in with your Ethereum account:\n(0x[0-9a-fA-F]{40})\n\n?([\s\S]*)$/;
  const mm = re.exec(text); if (!mm) return null;
  const rest = mm[4]; const out = { scheme: mm[1], domain: mm[2], address: mm[3], statement: '', fields: {}, resources: [] };
  const lines = rest.split('\n');
  let i = 0; const stmt = [];
  while (i < lines.length && !/^(URI|Version|Chain ID|Nonce|Issued At|Expiration Time|Not Before|Request ID|Resources):/.test(lines[i])) { stmt.push(lines[i]); i++; }
  out.statement = stmt.join('\n').trim();
  for (; i < lines.length; i++) {
    const l = lines[i]; const kv = /^([A-Za-z ]+):\s?(.*)$/.exec(l);
    if (!kv) { if (l.startsWith('- ')) out.resources.push(l.slice(2)); continue; }
    if (kv[1] === 'Resources') continue;
    out.fields[kv[1]] = kv[2];
  }
  return out;
}
const hostOf = (u) => { try { return new URL(u).host; } catch { return null; } };

export function decodePersonalSign(message, ctx) {
  const root = newSigRoot(ctx, 'personal_sign', 'personal_sign');
  let text = null, bytesLen = null;
  if (typeof message === 'string' && /^0x([0-9a-fA-F]{2})*$/.test(message)) {
    const hex = message.slice(2); bytesLen = hex.length / 2;
    const u = new Uint8Array(bytesLen); for (let i = 0; i < bytesLen; i++) u[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
    try { const t = new TextDecoder('utf-8', { fatal: true }).decode(u); const printable = [...t].filter((c) => c === '\n' || c === '\t' || c >= ' ').length / Math.max(1, [...t].length); if (printable > 0.95 && bytesLen > 0) text = t; } catch { /* binaire */ }
  } else { text = String(message); bytesLen = new TextEncoder().encode(text).length; }
  root.messageBytes = bytesLen;
  if (text === null) {
    root.opaque = true; root.blind = true;
    flag(root, 'blind_signature', bytesLen === 32 ? 'critical' : 'warn', bytesLen === 32 ? 'message de 32 octets non lisible : peut être le hash d\'une transaction ou d\'une struct (équivalent eth_sign)' : `message binaire opaque de ${bytesLen} octets`);
    return root;
  }
  const siwe = parseSiwe(text);
  if (!siwe) { root.messageText = text; flag(root, 'free_text_message', 'info', 'texte libre signé (aucun effet on-chain direct)'); return root; }
  root.siwe = siwe; root.typedKind = 'siwe';
  const f = siwe.fields;
  if (ctx.origin) {
    const oh = hostOf(ctx.origin) || ctx.origin;
    if (siwe.domain !== oh) flag(root, 'siwe_domain_mismatch', 'critical', `SIWE pour ${siwe.domain} mais origine ${oh}`);
    const uh = f.URI ? hostOf(f.URI) : null;
    if (uh && uh !== oh) flag(root, 'siwe_uri_mismatch', 'critical', `URI ${f.URI} ≠ origine ${oh}`);
  } else flag(root, 'siwe_origin_unknown', 'info', 'origine non fournie : comparaison de domaine impossible');
  if (f['Chain ID'] !== undefined && ctx.chainId !== undefined && Number(f['Chain ID']) !== Number(ctx.chainId)) flag(root, 'siwe_chain_mismatch', 'warn', `Chain ID ${f['Chain ID']} ≠ réseau ${ctx.chainId}`);
  if (lc(siwe.address) !== lc(ctx.from)) flag(root, 'siwe_address_mismatch', 'critical', `adresse du message ${siwe.address} ≠ compte ${ctx.from}`);
  if (f.Version !== '1') flag(root, 'siwe_bad_version', 'warn', `Version ${f.Version}`);
  if (!f.Nonce || f.Nonce.length < 8) flag(root, 'siwe_weak_nonce', 'warn', 'nonce absent ou < 8 caractères');
  if (f['Expiration Time'] && Date.parse(f['Expiration Time']) < (ctx.now ? ctx.now * 1000 : Date.now())) flag(root, 'siwe_expired', 'info', 'message déjà expiré');
  if (siwe.resources.length) flag(root, 'siwe_resources', 'info', `${siwe.resources.length} ressource(s) demandée(s)`);
  if (/approve|transfer|send|allow|permit|unlimited/i.test(siwe.statement)) flag(root, 'siwe_statement_suspicious', 'warn', 'le statement évoque des fonds / droits');
  return root;
}

export function decodeEthSign(hash32, ctx) {
  const root = newSigRoot(ctx, 'eth_sign', 'eth_sign');
  root.opaque = true; root.blind = true;
  flag(root, 'blind_signature', 'critical', 'eth_sign : hash brut, impossible de savoir ce qui est signé (peut valoir une transaction)');
  return root;
}

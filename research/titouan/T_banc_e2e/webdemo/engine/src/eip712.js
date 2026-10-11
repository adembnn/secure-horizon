// EIP-712 : encodeType, typehash, hashStruct, domainSeparator, digest. Pur JS.
import { keccakBytes, keccak256, fromHex, toHex } from './keccak.js';

const enc = new TextEncoder();
const cat = (arr) => { const n = arr.reduce((a, x) => a + x.length, 0); const o = new Uint8Array(n); let p = 0; for (const x of arr) { o.set(x, p); p += x.length; } return o; };
const baseOf = (t) => t.replace(/\[\d*\]$/, '');

export function findDeps(primary, types, found = new Set()) {
  const base = baseOf(primary);
  if (found.has(base) || !types[base]) return found;
  found.add(base);
  for (const f of types[base]) findDeps(f.type, types, found);
  return found;
}
export function encodeType(primary, types) {
  const deps = findDeps(primary, types); deps.delete(primary);
  const order = [primary, ...[...deps].sort()];
  return order.map((n) => `${n}(${types[n].map((f) => `${f.type} ${f.name}`).join(',')})`).join('');
}
export const typeHash = (primary, types) => keccak256(encodeType(primary, types));

const toBigInt = (v) => (typeof v === 'bigint' ? v : typeof v === 'number' ? BigInt(v) : BigInt(v)); // "0x..", "123"
function word(n) { // uint/int en 32 octets (complément à deux)
  let v = toBigInt(n); if (v < 0n) v += 1n << 256n;
  if (v < 0n || v >= 1n << 256n) throw new Error('entier hors plage EIP-712');
  return fromHex(v.toString(16).padStart(64, '0'));
}
function encodeValue(type, value, types) {
  if (type.endsWith(']')) {
    const inner = type.replace(/\[\d*\]$/, '');
    return keccakBytes(cat(value.map((v) => encodeValue(inner, v, types))));
  }
  if (types[type]) return fromHex(hashStruct(type, value, types));
  if (type === 'string') return keccakBytes(enc.encode(value));
  if (type === 'bytes') return keccakBytes(fromHex(value));
  if (type === 'bool') return word(value ? 1 : 0);
  if (type === 'address') return fromHex('0x' + value.slice(2).toLowerCase().padStart(64, '0'));
  if (/^bytes\d+$/.test(type)) { const b = fromHex(value); const o = new Uint8Array(32); o.set(b); return o; }
  if (/^u?int\d*$/.test(type)) return word(value);
  throw new Error('type EIP-712 inconnu: ' + type);
}
export function hashStruct(primary, data, types) {
  const parts = [fromHex(typeHash(primary, types))];
  for (const f of types[primary]) {
    if (!(f.name in data)) throw new Error(`champ manquant ${primary}.${f.name}`);
    parts.push(encodeValue(f.type, data[f.name], types));
  }
  return toHex(keccakBytes(cat(parts)));
}
const DOMAIN_FIELDS = { name: 'string', version: 'string', chainId: 'uint256', verifyingContract: 'address', salt: 'bytes32' };
export function domainType(domain) {
  return ['name', 'version', 'chainId', 'verifyingContract', 'salt'].filter((k) => k in domain).map((k) => ({ name: k, type: DOMAIN_FIELDS[k] }));
}
export function domainSeparator(domain, types = {}) {
  const t = { ...types, EIP712Domain: types.EIP712Domain || domainType(domain) };
  return hashStruct('EIP712Domain', domain, t);
}
export function digest(td) {
  const types = { ...td.types, EIP712Domain: td.types.EIP712Domain || domainType(td.domain) };
  return keccak256(cat([new Uint8Array([0x19, 0x01]), fromHex(domainSeparator(td.domain, types)), fromHex(hashStruct(td.primaryType, td.message, types))]));
}

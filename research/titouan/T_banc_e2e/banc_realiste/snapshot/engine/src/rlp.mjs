// RLP + transactions brutes typées (0 legacy, 1, 2, 4 = EIP-7702). Pas de recouvrement de signature (from fourni par l'appelant).
import { fromHex, toHex } from './keccak.mjs';

export function rlpDecode(u8, pos = 0) { // -> [item, next]
  if (pos >= u8.length) throw new Error('RLP: fin inattendue');
  const b = u8[pos];
  if (b < 0x80) return [u8.subarray(pos, pos + 1), pos + 1];
  const lenOf = (n, p) => { let l = 0; if (p + n > u8.length) throw new Error('RLP: longueur hors limites'); for (let i = 0; i < n; i++) l = l * 256 + u8[p + i]; return l; };
  if (b <= 0xb7) { const l = b - 0x80; if (pos + 1 + l > u8.length) throw new Error('RLP: chaîne tronquée'); return [u8.subarray(pos + 1, pos + 1 + l), pos + 1 + l]; }
  if (b <= 0xbf) { const n = b - 0xb7, l = lenOf(n, pos + 1); const s = pos + 1 + n; if (s + l > u8.length) throw new Error('RLP: chaîne tronquée'); return [u8.subarray(s, s + l), s + l]; }
  let n = 0, s;
  if (b <= 0xf7) { n = b - 0xc0; s = pos + 1; } else { const nl = b - 0xf7; n = lenOf(nl, pos + 1); s = pos + 1 + nl; }
  if (s + n > u8.length) throw new Error('RLP: liste tronquée');
  const items = []; let p = s;
  while (p < s + n) { const [it, nx] = rlpDecode(u8, p); items.push(it); p = nx; }
  return [items, s + n];
}
const hex = (u) => toHex(u);
const qty = (u) => (u.length ? BigInt(toHex(u)) : 0n);
const addrOrNull = (u) => (u.length === 0 ? null : hex(u));
const authList = (l) => l.map((a) => ({ chainId: qty(a[0]), address: hex(a[1]), nonce: qty(a[2]), yParity: qty(a[3]) }));

export function decodeRawTx(rawHex) {
  const u = fromHex(rawHex);
  if (u.length === 0) throw new Error('tx vide');
  const t = u[0];
  if (t >= 0xc0) { // legacy
    const [it] = rlpDecode(u, 0);
    return { type: '0x0', nonce: qty(it[0]), gasPrice: qty(it[1]), gas: qty(it[2]), to: addrOrNull(it[3]), value: qty(it[4]), input: hex(it[5]) };
  }
  const [it] = rlpDecode(u, 1);
  if (t === 1) return { type: '0x1', chainId: qty(it[0]), nonce: qty(it[1]), gasPrice: qty(it[2]), gas: qty(it[3]), to: addrOrNull(it[4]), value: qty(it[5]), input: hex(it[6]) };
  if (t === 2) return { type: '0x2', chainId: qty(it[0]), nonce: qty(it[1]), gas: qty(it[4]), to: addrOrNull(it[5]), value: qty(it[6]), input: hex(it[7]) };
  if (t === 4) return { type: '0x4', chainId: qty(it[0]), nonce: qty(it[1]), gas: qty(it[4]), to: addrOrNull(it[5]), value: qty(it[6]), input: hex(it[7]), authorizationList: authList(it[9]) };
  throw new Error('type de tx non géré: 0x' + t.toString(16));
}
// Encodeur minimal pour fabriquer des tx brutes de test
export function rlpEncode(x) {
  if (Array.isArray(x)) { const body = x.map(rlpEncode); const b = concat(body); return concat([lenPrefix(b.length, 0xc0), b]); }
  const u = x instanceof Uint8Array ? x : typeof x === 'bigint' ? bigBytes(x) : fromHex(x);
  if (u.length === 1 && u[0] < 0x80) return u;
  return concat([lenPrefix(u.length, 0x80), u]);
}
const bigBytes = (v) => (v === 0n ? new Uint8Array(0) : fromHex(v.toString(16)));
function lenPrefix(l, base) { if (l < 56) return new Uint8Array([base + l]); const lb = bigBytes(BigInt(l)); return concat([new Uint8Array([base + 55 + lb.length]), lb]); }
function concat(arr) { const n = arr.reduce((a, x) => a + x.length, 0); const o = new Uint8Array(n); let p = 0; for (const x of arr) { o.set(x, p); p += x.length; } return o; }

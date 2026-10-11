// Encodeur ABI (pour fabriquer des calldata de test et valider l'aller-retour avec le décodeur).
import { parseSig, parseParams, isDyn, headSize } from './abi.mjs';
import { fromHex, toHex } from './keccak.mjs';

const cat = (arr) => { const n = arr.reduce((a, x) => a + x.length, 0); const o = new Uint8Array(n); let p = 0; for (const x of arr) { o.set(x, p); p += x.length; } return o; };
const wordOf = (v) => { let b = BigInt(v); if (b < 0n) b += 1n << 256n; return fromHex(b.toString(16).padStart(64, '0')); };
const padRight = (u) => { const n = Math.ceil(u.length / 32) * 32; const o = new Uint8Array(n); o.set(u); return o; };

function encValue(n, v) {
  switch (n.kind) {
    case 'address': return fromHex('0x' + v.slice(2).toLowerCase().padStart(64, '0'));
    case 'bool': return wordOf(v ? 1 : 0);
    case 'uint': case 'int': return wordOf(v);
    case 'bytesN': { const o = new Uint8Array(32); o.set(fromHex(v)); return o; }
    case 'bytes': { const b = fromHex(v); return cat([wordOf(b.length), padRight(b)]); }
    case 'string': { const b = new TextEncoder().encode(v); return cat([wordOf(b.length), padRight(b)]); }
    case 'array': {
      const elems = Array.from(v, () => n.elem);
      const body = encSeq(elems, v);
      return n.len === null ? cat([wordOf(v.length), body]) : body;
    }
    case 'tuple': return encSeq(n.comps, n.comps.map((c, i) => (Array.isArray(v) ? v[i] : v[c.name ?? i])));
  }
  throw new Error('encode: ' + n.kind);
}
export function encSeq(nodes, vals) {
  const heads = [], tails = [];
  const headLen = nodes.reduce((a, n) => a + (isDyn(n) ? 32 : headSize(n)), 0);
  let tailLen = 0;
  nodes.forEach((n, i) => {
    const e = encValue(n, vals[i]);
    if (isDyn(n)) { heads.push(wordOf(headLen + tailLen)); tails.push(e); tailLen += e.length; } else heads.push(e);
  });
  return cat([...heads, ...tails]);
}
// call('transfer(address to,uint256 amount)', [addr, 5n]) -> calldata hex
export function call(sig, args) {
  const s = parseSig(sig);
  return s.selector + toHex(encSeq(s.params, args)).slice(2);
}
export function encodeParams(paramStr, args) {
  const { params } = parseParams(paramStr + ')', 0);
  return toHex(encSeq(params, args));
}

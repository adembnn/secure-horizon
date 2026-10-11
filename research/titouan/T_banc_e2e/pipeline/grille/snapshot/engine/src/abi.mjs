// Décodeur ABI minimal mais complet (tuples, tableaux, bytes, string) + analyse de signatures nommées.
import { fromHex, toHex, selectorOf } from './keccak.mjs';

export class DecodeError extends Error {}

// ---- parseur de signature avec noms optionnels : "f(address a,(uint256 x,bytes y)[] z)"
export function parseParams(s, i = 0) { // retourne {params, next} ; s[i-1]=='('
  const params = [];
  const skip = () => { while (s[i] === ' ') i++; };
  skip();
  if (s[i] === ')') return { params, next: i + 1 };
  for (;;) {
    skip();
    let node;
    if (s[i] === '(') {
      const r = parseParams(s, i + 1); i = r.next;
      node = { kind: 'tuple', comps: r.params };
    } else {
      const m = /^[A-Za-z0-9_]+/.exec(s.slice(i));
      if (!m) throw new Error('signature invalide @' + i + ' ' + s);
      i += m[0].length; node = baseNode(m[0]);
    }
    while (s[i] === '[') {
      const j = s.indexOf(']', i); const n = s.slice(i + 1, j);
      node = { kind: 'array', elem: node, len: n === '' ? null : Number(n) }; i = j + 1;
    }
    skip();
    const nm = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
    if (nm) { node.name = nm[0]; i += nm[0].length; }
    skip();
    params.push(node);
    if (s[i] === ',') { i++; continue; }
    if (s[i] === ')') return { params, next: i + 1 };
    throw new Error('signature invalide @' + i + ' ' + s);
  }
}
function baseNode(t) {
  if (t === 'address') return { kind: 'address' };
  if (t === 'bool') return { kind: 'bool' };
  if (t === 'bytes') return { kind: 'bytes' };
  if (t === 'string') return { kind: 'string' };
  let m;
  if ((m = /^uint(\d*)$/.exec(t))) return { kind: 'uint', bits: Number(m[1] || 256) };
  if ((m = /^int(\d*)$/.exec(t))) return { kind: 'int', bits: Number(m[1] || 256) };
  if ((m = /^bytes(\d+)$/.exec(t))) return { kind: 'bytesN', n: Number(m[1]) };
  throw new Error('type inconnu ' + t);
}
export function canonical(n) {
  switch (n.kind) {
    case 'tuple': return '(' + n.comps.map(canonical).join(',') + ')';
    case 'array': return canonical(n.elem) + '[' + (n.len ?? '') + ']';
    case 'uint': return 'uint' + n.bits;
    case 'int': return 'int' + n.bits;
    case 'bytesN': return 'bytes' + n.n;
    default: return n.kind;
  }
}
export function parseSig(sig) {
  const p = sig.indexOf('(');
  const name = sig.slice(0, p);
  const { params } = parseParams(sig, p + 1);
  const canon = name + '(' + params.map(canonical).join(',') + ')';
  return { name, params, canon, selector: selectorOf(canon) };
}

export const isDyn = (n) => n.kind === 'bytes' || n.kind === 'string' || (n.kind === 'array' && (n.len === null || isDyn(n.elem))) || (n.kind === 'tuple' && n.comps.some(isDyn));
export const headSize = (n) => isDyn(n) ? 32 : n.kind === 'array' ? n.len * headSize(n.elem) : n.kind === 'tuple' ? n.comps.reduce((a, c) => a + headSize(c), 0) : 32;

const toBig = (u) => { let r = 0n; for (const b of u) r = (r << 8n) | BigInt(b); return r; };
function word(buf, pos) {
  if (pos < 0 || pos + 32 > buf.length) throw new DecodeError('lecture hors limites @' + pos);
  return buf.subarray(pos, pos + 32);
}
function numAt(buf, pos, max = buf.length) {
  const v = toBig(word(buf, pos));
  if (v > BigInt(max)) throw new DecodeError('offset/longueur hors limites ' + v);
  return Number(v);
}
const addr = (u) => '0x' + Array.from(u.subarray(12), (b) => b.toString(16).padStart(2, '0')).join('');

function decodeValue(n, buf, pos) {
  switch (n.kind) {
    case 'address': return addr(word(buf, pos));
    case 'bool': return toBig(word(buf, pos)) !== 0n;
    case 'uint': return toBig(word(buf, pos));
    case 'int': { const v = toBig(word(buf, pos)); return v >= (1n << 255n) ? v - (1n << 256n) : v; }
    case 'bytesN': return toHex(word(buf, pos).subarray(0, n.n));
    case 'bytes': case 'string': {
      const len = numAt(buf, pos);
      if (pos + 32 + len > buf.length) throw new DecodeError('bytes hors limites');
      const sl = buf.subarray(pos + 32, pos + 32 + len);
      return n.kind === 'bytes' ? toHex(sl) : new TextDecoder().decode(sl);
    }
    case 'array': {
      if (n.len === null) {
        const len = numAt(buf, pos);
        if (len * (isDyn(n.elem) ? 32 : Math.max(headSize(n.elem), 1)) > buf.length) throw new DecodeError('tableau trop grand');
        return decodeSeq(Array.from({ length: len }, () => n.elem), buf, pos + 32, false);
      }
      return decodeSeq(Array.from({ length: n.len }, () => n.elem), buf, pos, false);
    }
    case 'tuple': return decodeSeq(n.comps, buf, pos, true);
  }
  throw new DecodeError('type ' + n.kind);
}
function decodeSeq(nodes, buf, start, named) {
  let pos = start; const vals = [];
  for (const t of nodes) {
    if (isDyn(t)) { const off = numAt(buf, pos); vals.push(decodeValue(t, buf, start + off)); pos += 32; }
    else { vals.push(decodeValue(t, buf, pos)); pos += headSize(t); }
  }
  if (!named) return vals;
  const o = {}; nodes.forEach((t, i) => { o[t.name ?? i] = vals[i]; });
  return o;
}
// data : hex sans sélecteur
export function decodeParams(params, dataHex) {
  const buf = fromHex(dataHex);
  const vals = decodeSeq(params, buf, 0, false);
  const o = {}; params.forEach((t, i) => { o[t.name ?? i] = vals[i]; });
  return o;
}
export const decodeTypes = (sig, dataHex) => decodeParams(parseParams(sig + ')', 0).params, dataHex);
export const MAX_U256 = (1n << 256n) - 1n;

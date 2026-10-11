// lib.mjs - utilitaires SYNTHETIQUES : PRNG gradue, keccak256 (implementation locale), encodeur ABI minimal.
// Aucune dependance, aucun secret, aucune cle. Node >= 20.
import { createHash } from 'node:crypto';

export const SEED = 20261011;

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rng = mulberry32(SEED);
export const ri = (n) => Math.floor(rng() * n);
export const pick = (a) => a[ri(a.length)];
export const sha256hex = (s) => createHash('sha256').update(s).digest('hex');

// ---------- keccak256 (spec Keccak-f[1600], constantes derivees par LFSR, pas de memoire) ----------
const M64 = (1n << 64n) - 1n;
const rotl = (x, n) => n === 0n ? x : ((x << n) | (x >> (64n - n))) & M64;
function lfsr(t) { if (t % 255 === 0) return 1; let R = 1; for (let i = 1; i <= t % 255; i++) { R <<= 1; if (R & 0x100) R ^= 0x171; } return R & 1; }
const RC = []; for (let ir = 0; ir < 24; ir++) { let c = 0n; for (let j = 0; j < 7; j++) if (lfsr(j + 7 * ir)) c |= 1n << BigInt((1 << j) - 1); RC.push(c); }
const ROT = Array.from({ length: 5 }, () => Array(5).fill(0n));
{ let x = 1, y = 0; for (let t = 0; t < 24; t++) { ROT[x][y] = BigInt(((t + 1) * (t + 2) / 2) % 64); [x, y] = [y, (2 * x + 3 * y) % 5]; } }
function keccakF(A) {
  for (let r = 0; r < 24; r++) {
    const C = []; for (let x = 0; x < 5; x++) C[x] = A[x][0] ^ A[x][1] ^ A[x][2] ^ A[x][3] ^ A[x][4];
    for (let x = 0; x < 5; x++) { const D = C[(x + 4) % 5] ^ rotl(C[(x + 1) % 5], 1n); for (let y = 0; y < 5; y++) A[x][y] ^= D; }
    const B = Array.from({ length: 5 }, () => Array(5).fill(0n));
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) B[y][(2 * x + 3 * y) % 5] = rotl(A[x][y], ROT[x][y]);
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) A[x][y] = B[x][y] ^ ((~B[(x + 1) % 5][y] & M64) & B[(x + 2) % 5][y]);
    A[0][0] ^= RC[r];
  }
}
export function keccak256(input) {
  const msg = typeof input === 'string' ? Buffer.from(input, 'utf8') : Buffer.from(input);
  const rate = 136; const padLen = rate - (msg.length % rate);
  const p = Buffer.concat([msg, Buffer.alloc(padLen)]); p[msg.length] ^= 0x01; p[p.length - 1] ^= 0x80;
  const A = Array.from({ length: 5 }, () => Array(5).fill(0n));
  for (let off = 0; off < p.length; off += rate) {
    for (let i = 0; i < rate / 8; i++) A[i % 5][Math.floor(i / 5)] ^= p.readBigUInt64LE(off + i * 8);
    keccakF(A);
  }
  const out = Buffer.alloc(32);
  for (let i = 0; i < 4; i++) out.writeBigUInt64LE(A[i % 5][Math.floor(i / 5)], i * 8);
  return out.toString('hex');
}
export const selector = (sig) => '0x' + keccak256(sig).slice(0, 8);

// ---------- ABI minimal ----------
const pad32 = (h) => h.padStart(64, '0');
function splitTop(s) { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } if (cur) out.push(cur); return out; }
function isDyn(t) { if (t === 'bytes' || t === 'string') return true; if (t.endsWith('[]')) return true; if (t[0] === '(') return splitTop(t.slice(1, -1)).some(isDyn); return false; }
function staticSize(t) { if (t[0] === '(') return splitTop(t.slice(1, -1)).reduce((s, c) => s + staticSize(c), 0); return 32; }
function encOne(t, v) {
  if (t.endsWith('[]')) { const e = t.slice(0, -2); return pad32(v.length.toString(16)) + encTuple(v.map(() => e), v); }
  if (t === 'address') return pad32(String(v).slice(2).toLowerCase());
  if (t.startsWith('uint') || t.startsWith('int')) return pad32(BigInt(v).toString(16));
  if (t === 'bool') return pad32(v ? '1' : '0');
  if (/^bytes\d+$/.test(t)) return String(v).slice(2).padEnd(64, '0');
  if (t === 'bytes' || t === 'string') { const h = t === 'string' ? Buffer.from(v, 'utf8').toString('hex') : String(v).slice(2); const n = h.length / 2; return pad32(n.toString(16)) + h.padEnd(Math.ceil(n / 32) * 64, '0'); }
  if (t[0] === '(') return encTuple(splitTop(t.slice(1, -1)), v);
  throw new Error('type ' + t);
}
function encTuple(ts, vs) {
  let head = '', tail = ''; const hs = ts.reduce((s, t) => s + (isDyn(t) ? 32 : staticSize(t)), 0);
  ts.forEach((t, i) => { if (isDyn(t)) { head += pad32((hs + tail.length / 2).toString(16)); tail += encOne(t, vs[i]); } else head += encOne(t, vs[i]); });
  return head + tail;
}
export function calldata(sig, vals) {
  const inner = sig.slice(sig.indexOf('(') + 1, sig.lastIndexOf(')'));
  const ts = inner === '' ? [] : splitTop(inner);
  return selector(sig) + encTuple(ts, vals);
}
export const hex = (n) => '0x' + BigInt(n).toString(16);
export const MAXU = (1n << 256n) - 1n;
export const MAXU160 = (1n << 160n) - 1n;
export const MAXU48 = (1n << 48n) - 1n;
export const toHexBytes = (s) => '0x' + Buffer.from(s, 'utf8').toString('hex');

// ---------- adresses SYNTHETIQUES (derivees du PRNG, jamais de cle) ----------
let addrCounter = 0;
export function newAddr() { let h = ''; for (let i = 0; i < 20; i++) h += ri(256).toString(16).padStart(2, '0'); addrCounter++; return '0x' + h; }
export function rnd32() { let h = ''; for (let i = 0; i < 32; i++) h += ri(256).toString(16).padStart(2, '0'); return '0x' + h; }
export function rndBytes(n) { let h = ''; for (let i = 0; i < n; i++) h += ri(256).toString(16).padStart(2, '0'); return '0x' + h; }
const HEXC = '0123456789abcdef';
// adresse sosie : memes `pre` premiers et `suf` derniers caracteres hexa (apres 0x), milieu aleatoire
export function lookalike(addr, pre, suf) {
  const a = addr.slice(2); let mid = ''; for (let i = 0; i < 40 - pre - suf; i++) mid += HEXC[ri(16)];
  const r = '0x' + a.slice(0, pre) + mid + a.slice(40 - suf);
  return r === addr ? lookalike(addr, pre, suf) : r;
}
export function sharedAffix(a, b) {
  a = a.slice(2).toLowerCase(); b = b.slice(2).toLowerCase(); let p = 0, s = 0;
  while (p < 40 && a[p] === b[p]) p++;
  while (s < 40 - p && a[39 - s] === b[39 - s]) s++;
  return { pre: p, suf: s };
}

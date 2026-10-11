// Keccak-256 pur JS (BigInt). Aucune dépendance. pad=0x01 -> Keccak (Ethereum), pad=0x06 -> SHA3 (pour auto-test vs node:crypto).
const M64 = (1n << 64n) - 1n;
const rotl = (x, n) => { n = BigInt(n) % 64n; return n === 0n ? x : ((x << n) | (x >> (64n - n))) & M64; };

// Constantes générées (LFSR x^8+x^6+x^5+x^4+1) et offsets de rotation, comme dans la spec Keccak.
const RC = (() => {
  const out = []; let lfsr = 1;
  const step = () => { const r = lfsr & 1; lfsr = (lfsr & 0x80) ? ((lfsr << 1) ^ 0x71) & 0xff : (lfsr << 1) & 0xff; return r; };
  for (let i = 0; i < 24; i++) {
    let c = 0n;
    for (let j = 0; j < 7; j++) if (step()) c |= 1n << BigInt((1 << j) - 1);
    out.push(c);
  }
  return out;
})();
const ROT = (() => { // ROT[x][y]
  const r = Array.from({ length: 5 }, () => Array(5).fill(0));
  let x = 1, y = 0;
  for (let t = 0; t < 24; t++) { r[x][y] = ((t + 1) * (t + 2) / 2) % 64; [x, y] = [y, (2 * x + 3 * y) % 5]; }
  return r;
})();

function permute(A) { // A: 25 lanes, index x+5y
  for (let round = 0; round < 24; round++) {
    const C = []; for (let x = 0; x < 5; x++) C[x] = A[x] ^ A[x + 5] ^ A[x + 10] ^ A[x + 15] ^ A[x + 20];
    for (let x = 0; x < 5; x++) { const D = C[(x + 4) % 5] ^ rotl(C[(x + 1) % 5], 1); for (let y = 0; y < 5; y++) A[x + 5 * y] ^= D; }
    const B = new Array(25);
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) B[y + 5 * ((2 * x + 3 * y) % 5)] = rotl(A[x + 5 * y], ROT[x][y]);
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) A[x + 5 * y] = B[x + 5 * y] ^ ((~B[(x + 1) % 5 + 5 * y] & M64) & B[(x + 2) % 5 + 5 * y]);
    A[0] ^= RC[round];
  }
}

export function keccakBytes(data, pad = 0x01) {
  const rate = 136;
  const len = data.length;
  const padded = new Uint8Array(Math.ceil((len + 1) / rate) * rate);
  padded.set(data); padded[len] ^= pad; padded[padded.length - 1] ^= 0x80;
  const A = new Array(25).fill(0n);
  for (let off = 0; off < padded.length; off += rate) {
    for (let i = 0; i < rate / 8; i++) {
      let lane = 0n;
      for (let b = 7; b >= 0; b--) lane = (lane << 8n) | BigInt(padded[off + i * 8 + b]);
      A[i] ^= lane;
    }
    permute(A);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i++) { let l = A[i]; for (let b = 0; b < 8; b++) { out[i * 8 + b] = Number(l & 0xffn); l >>= 8n; } }
  return out;
}
export const toHex = (u8) => '0x' + Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');
export function fromHex(h) {
  let s = h.startsWith('0x') || h.startsWith('0X') ? h.slice(2) : h;
  if (s.length % 2) s = '0' + s;
  if (!/^[0-9a-fA-F]*$/.test(s)) throw new Error('hex invalide');
  const u = new Uint8Array(s.length / 2);
  for (let i = 0; i < u.length; i++) u[i] = parseInt(s.slice(2 * i, 2 * i + 2), 16);
  return u;
}
const enc = new TextEncoder();
export const keccak256 = (input) => toHex(keccakBytes(typeof input === 'string' ? enc.encode(input) : input));
export const keccak256Hex = (hex) => toHex(keccakBytes(fromHex(hex)));
export const sha3_256Bytes = (data) => keccakBytes(data, 0x06);
export const selectorOf = (canonicalSig) => keccak256(canonicalSig).slice(0, 10);

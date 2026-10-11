// Hold up - RPC guard : signed raw transaction -> fields + recovered sender. Zero dependency.
// The field decoding is the engine's own decoder (engine/src/rlp.mjs decodeRawTx : legacy, 0x1 EIP-2930, 0x2 EIP-1559, 0x4 EIP-7702).
// What the engine does not have and this file adds : the signing hash per type and the secp256k1 public key recovery (pure BigInt),
// plus strict shape checks so that what we evaluate is byte for byte what the node would execute.
// Unsupported, refused (fail closed) : 0x3 blob transactions (EIP-4844, not on the Avalanche C-Chain), any other type byte,
// pre-EIP-155 legacy transactions (no chain id : replayable on every chain).
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const BANC = resolve(HERE, '..', '..', 'titouan', 'T_banc_e2e');
const imp = (p) => import(pathToFileURL(p).href);
const { rlpDecode, rlpEncode, decodeRawTx } = await imp(join(BANC, 'engine', 'src', 'rlp.mjs'));
const { keccakBytes, toHex } = await imp(join(BANC, 'engine', 'src', 'keccak.mjs'));

export class RawTxError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
export const MAX_RAW_BYTES = 128 * 1024; // geth's own limit for one transaction

// ------------------------------------------------------------------ secp256k1 (recovery only)
const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const G = [0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n, 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n, 1n];
const mod = (a, m = P) => { const r = a % m; return r >= 0n ? r : r + m; };
function powMod(b, e, m) { let r = 1n; b = mod(b, m); while (e > 0n) { if (e & 1n) r = (r * b) % m; b = (b * b) % m; e >>= 1n; } return r; }
const inv = (a, m) => powMod(a, m - 2n, m); // m is prime
// Jacobian points [X, Y, Z] ; null = point at infinity
function dbl(p) {
  if (!p || p[1] === 0n) return null;
  const [X, Y, Z] = p;
  const A = (X * X) % P, B = (Y * Y) % P, C = (B * B) % P;
  const D = mod(2n * ((X + B) * (X + B) - A - C)), E = (3n * A) % P;
  const X3 = mod(E * E - 2n * D);
  return [X3, mod(E * (D - X3) - 8n * C), (2n * Y * Z) % P];
}
function add(p, q) {
  if (!p) return q; if (!q) return p;
  const [X1, Y1, Z1] = p, [X2, Y2, Z2] = q;
  const Z1Z1 = (Z1 * Z1) % P, Z2Z2 = (Z2 * Z2) % P;
  const U1 = (X1 * Z2Z2) % P, U2 = (X2 * Z1Z1) % P;
  const S1 = (Y1 * Z2 * Z2Z2) % P, S2 = (Y2 * Z1 * Z1Z1) % P;
  if (U1 === U2) return S1 === S2 ? dbl(p) : null;
  const H = mod(U2 - U1), R = mod(S2 - S1), H2 = (H * H) % P, H3 = (H * H2) % P, V = (U1 * H2) % P;
  const X3 = mod(R * R - H3 - 2n * V);
  return [X3, mod(R * (V - X3) - S1 * H3), (H * Z1 * Z2) % P];
}
function mul(k, p) { let r = null, a = p; while (k > 0n) { if (k & 1n) r = add(r, a); a = dbl(a); k >>= 1n; } return r; }
const bytes32 = (v) => { const u = new Uint8Array(32); for (let i = 31; i >= 0; i--) { u[i] = Number(v & 0xffn); v >>= 8n; } return u; };
const toBig = (u) => (u.length ? BigInt(toHex(u)) : 0n);

// -> lower-case 0x address of the signer, or throws
export function recoverAddress(hash32, r, s, yParity) {
  if (r <= 0n || r >= N || s <= 0n || s >= N) throw new RawTxError('bad_signature', 'signature out of range');
  if (s > N / 2n) throw new RawTxError('bad_signature', 'high-s signature (EIP-2), nodes refuse it');
  if (yParity !== 0n && yParity !== 1n) throw new RawTxError('bad_signature', 'bad recovery id');
  const y2 = mod(r * r * r + 7n);
  let y = powMod(y2, (P + 1n) / 4n, P);
  if ((y * y) % P !== y2) throw new RawTxError('bad_signature', 'r is not on the curve');
  if ((y & 1n) !== yParity) y = P - y;
  const z = toBig(hash32), ri = inv(r, N);
  const q = add(mul(mod(-z * ri, N), G), mul(mod(s * ri, N), [r, y, 1n]));
  if (!q) throw new RawTxError('bad_signature', 'recovered the point at infinity');
  const zi = inv(q[2], P), zi2 = (zi * zi) % P;
  const pub = new Uint8Array(64);
  pub.set(bytes32((q[0] * zi2) % P), 0); pub.set(bytes32((q[1] * zi2 * zi) % P), 32);
  return toHex(keccakBytes(pub).subarray(12));
}

// ------------------------------------------------------------------ raw transaction
const TYPED = { 1: { n: 11, name: 'EIP-2930' }, 2: { n: 12, name: 'EIP-1559' }, 4: { n: 13, name: 'EIP-7702' } };
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const isBytes = (x) => x instanceof Uint8Array;
const concat = (a, b) => { const o = new Uint8Array(a.length + b.length); o.set(a, 0); o.set(b, a.length); return o; };

// rawHex : what the wallet gave to eth_sendRawTransaction.
// -> { type (0|1|2|4), typeName, chainId (number), from, to (null = contract creation), nonce, value, input, gas, hash, authorizationList? }
export function parseSignedTx(rawHex) {
  if (typeof rawHex !== 'string' || !/^0x([0-9a-fA-F]{2})+$/.test(rawHex)) throw new RawTxError('malformed', 'not a hex string');
  if ((rawHex.length - 2) / 2 > MAX_RAW_BYTES) throw new RawTxError('malformed', 'transaction too large');
  const u = Uint8Array.from(Buffer.from(rawHex.slice(2), 'hex'));
  const t = u[0];
  let items, next, signed, yParity, chainId;
  try {
    if (t >= 0xc0) {
      [items, next] = rlpDecode(u, 0);
      if (!Array.isArray(items) || items.length !== 9 || !items.every(isBytes)) throw new RawTxError('malformed', 'legacy transaction : 9 fields expected');
      if (!same(rlpEncode(items), u)) throw new RawTxError('malformed', 'non canonical encoding');
      const v = toBig(items[6]);
      if (v < 35n) throw new RawTxError('unsupported', 'legacy transaction without chain id (pre EIP-155)');
      chainId = (v - 35n) / 2n; yParity = (v - 35n) % 2n;
      signed = keccakBytes(rlpEncode([...items.slice(0, 6), chainId, new Uint8Array(0), new Uint8Array(0)]));
    } else {
      if (t === 3) throw new RawTxError('unsupported', 'blob transaction (type 0x3, EIP-4844)');
      const spec = TYPED[t];
      if (!spec) throw new RawTxError('unsupported', 'transaction type 0x' + t.toString(16));
      [items, next] = rlpDecode(u, 1);
      if (!Array.isArray(items) || items.length !== spec.n) throw new RawTxError('malformed', `${spec.name} transaction : ${spec.n} fields expected`);
      const lists = t === 4 ? [8, 9] : t === 2 ? [8] : [7];
      if (!items.every((it, i) => (lists.includes(i) ? Array.isArray(it) : isBytes(it)))) throw new RawTxError('malformed', 'unexpected field shape');
      if (!same(concat(new Uint8Array([t]), rlpEncode(items)), u)) throw new RawTxError('malformed', 'non canonical encoding');
      chainId = toBig(items[0]); yParity = toBig(items[spec.n - 3]);
      signed = keccakBytes(concat(new Uint8Array([t]), rlpEncode(items.slice(0, spec.n - 3))));
    }
  } catch (e) {
    if (e instanceof RawTxError) throw e;
    throw new RawTxError('malformed', String((e && e.message) || e).slice(0, 120));
  }
  if (next !== u.length) throw new RawTxError('malformed', 'trailing bytes');
  const toField = items[t >= 0xc0 ? 3 : t === 1 ? 4 : 5];
  if (toField.length !== 0 && toField.length !== 20) throw new RawTxError('malformed', 'recipient is not 20 bytes');
  const n = items.length;
  const from = recoverAddress(signed, toBig(items[n - 2]), toBig(items[n - 1]), yParity);
  const tx = decodeRawTx(rawHex); // the engine's decoder : same fields the product evaluates everywhere else
  const out = {
    type: t >= 0xc0 ? 0 : t, typeName: t >= 0xc0 ? 'legacy' : TYPED[t].name, chainId: Number(chainId), from,
    to: tx.to ? tx.to.toLowerCase() : null, nonce: tx.nonce, value: tx.value, input: tx.input === '0x' ? '0x' : tx.input, gas: tx.gas,
    hash: toHex(keccakBytes(u)),
  };
  if (tx.authorizationList) out.authorizationList = tx.authorizationList.map((a) => ({ chainId: '0x' + a.chainId.toString(16), address: a.address, nonce: '0x' + a.nonce.toString(16) }));
  return out;
}

// The eth_sendTransaction-shaped request the product's evaluate() pipeline understands.
export function toSendTransaction(tx) {
  const q = (v) => '0x' + BigInt(v).toString(16);
  const p = { from: tx.from, to: tx.to, value: q(tx.value), data: tx.input, chainId: q(tx.chainId), type: q(tx.type), nonce: q(tx.nonce), gas: q(tx.gas) };
  if (tx.authorizationList) p.authorizationList = tx.authorizationList;
  return { method: 'eth_sendTransaction', params: [p] };
}

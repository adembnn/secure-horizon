// Mini client Ethereum en JS pur (Node >= 18) : secp256k1 (BigInt), signature EIP-155, JSON-RPC, ABI minimal.
// Aucune dependance. Reutilise engine/src/keccak.mjs et rlp.mjs SANS les modifier.
import crypto from 'node:crypto';
import { keccakBytes, keccak256, toHex, fromHex, selectorOf } from '../engine/src/keccak.mjs';
import { rlpEncode } from '../engine/src/rlp.mjs';
export { keccak256, toHex, fromHex, selectorOf };

export const FUJI_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';
export const FUJI_CHAIN_ID = 43113;
export const SNOWTRACE = 'https://testnet.snowtrace.io';

// ---- secp256k1 ----
const P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const G = [0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n, 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n];
const mod = (a, m = P) => ((a % m) + m) % m;
function inv(a, m = P) { let [lo, hi, x0, x1] = [mod(a, m), m, 1n, 0n]; while (hi) { const q = lo / hi; [lo, hi] = [hi, lo - q * hi]; [x0, x1] = [x1, x0 - q * x1]; } return mod(x0, m); }
function add(p, q) {
  if (!p) return q; if (!q) return p;
  if (p[0] === q[0]) { if (mod(p[1] + q[1]) === 0n) return null; const l = mod(3n * p[0] * p[0] * inv(2n * p[1])); const x = mod(l * l - 2n * p[0]); return [x, mod(l * (p[0] - x) - p[1])]; }
  const l = mod((q[1] - p[1]) * inv(q[0] - p[0])); const x = mod(l * l - p[0] - q[0]); return [x, mod(l * (p[0] - x) - p[1])];
}
function mul(k, p) { let r = null, a = p; while (k > 0n) { if (k & 1n) r = add(r, a); a = add(a, a); k >>= 1n; } return r; }
const b2n = (u) => BigInt(toHex(u) === '0x' ? '0x0' : toHex(u));
const n2b = (n, len = 32) => fromHex(n.toString(16).padStart(len * 2, '0'));
const hmac = (key, ...parts) => { const h = crypto.createHmac('sha256', key); for (const p of parts) h.update(p); return new Uint8Array(h.digest()); };
function rfc6979(d, h) { // k deterministe (HMAC-SHA256)
  const x = n2b(d), hh = n2b(mod(b2n(h), N));
  let V = new Uint8Array(32).fill(1), K = new Uint8Array(32);
  K = hmac(K, V, Uint8Array.of(0), x, hh); V = hmac(K, V);
  K = hmac(K, V, Uint8Array.of(1), x, hh); V = hmac(K, V);
  for (;;) { V = hmac(K, V); const k = b2n(V); if (k >= 1n && k < N) return k; K = hmac(K, V, Uint8Array.of(0)); V = hmac(K, V); }
}
export function sign(hash32, privHex) {
  const d = BigInt(privHex.startsWith('0x') ? privHex : '0x' + privHex);
  if (d <= 0n || d >= N) throw new Error('cle privee invalide');
  const z = b2n(hash32), k = rfc6979(d, hash32), R = mul(k, G);
  const r = mod(R[0], N);
  let s = mod(inv(k, N) * (z + r * d), N), rec = Number(R[1] & 1n) | (R[0] >= N ? 2 : 0);
  if (s > N / 2n) { s = N - s; rec ^= 1; }
  return { r, s, rec };
}
const addrOfPoint = (Q) => toHex(keccakBytes(new Uint8Array([...n2b(Q[0]), ...n2b(Q[1])])).slice(12));
export function addressOf(privHex) {
  const d = BigInt(privHex.startsWith('0x') ? privHex : '0x' + privHex);
  return addrOfPoint(mul(d, G));
}
export function recoverAddress(hash32, r, s, rec) { // recuperation de la cle publique -> adresse (pour les tests)
  const x = r; let y = 1n, e = (P + 1n) / 4n, b = mod(x ** 3n + 7n);
  while (e) { if (e & 1n) y = mod(y * b); b = mod(b * b); e >>= 1n; }
  if (Number(y & 1n) !== (rec & 1)) y = P - y;
  const ri = inv(r, N), z = b2n(hash32);
  return addrOfPoint(mul(ri, add(mul(s, [x, y]), mul(mod(-z, N), G))));
}

// Tx legacy EIP-155 signee. tx = {nonce, gasPrice, gas, to|null, value, data, chainId}
export function signLegacyTx(tx, privHex) {
  const to = tx.to ? tx.to : '0x', data = tx.data || '0x';
  const base = [BigInt(tx.nonce), BigInt(tx.gasPrice), BigInt(tx.gas), to, BigInt(tx.value || 0), data];
  const h = keccakBytes(rlpEncode([...base, BigInt(tx.chainId), 0n, 0n]));
  const { r, s, rec } = sign(h, privHex);
  const raw = rlpEncode([...base, BigInt(tx.chainId) * 2n + 35n + BigInt(rec & 1), r, s]);
  return { raw: toHex(raw), hash: toHex(keccakBytes(raw)), r, s, rec, sigHash: h };
}

// ---- JSON-RPC ----
export async function rpc(url, method, params = []) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const j = await res.json();
  if (j.error) throw new Error(`RPC ${method}: ${j.error.message || JSON.stringify(j.error)}`);
  return j.result;
}
export const q = (n) => '0x' + BigInt(n).toString(16);

// ---- ABI minimal EvidenceAnchor ----
export const ANCHOR_SIG = 'anchor(bytes32,uint64,uint64,uint32)';
export const ANCHORED_EVENT = 'Anchored(address,bytes32,uint64,uint64,uint32,uint256,uint64)';
export const ANCHORED_TOPIC0 = keccak256(ANCHORED_EVENT);
const w = (v) => BigInt(v).toString(16).padStart(64, '0');
export function encodeAnchorCall(root, fromIndex, toIndex, ruleVersion) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(root)) throw new Error('racine invalide');
  return selectorOf(ANCHOR_SIG) + root.slice(2) + w(fromIndex) + w(toIndex) + w(ruleVersion);
}
export function decodeAnchoredLog(log) {
  const d = log.data.slice(2); const word = (i) => BigInt('0x' + d.slice(i * 64, i * 64 + 64));
  if (log.topics[0].toLowerCase() !== ANCHORED_TOPIC0 || d.length < 5 * 64) throw new Error('log Anchored invalide');
  return { sender: '0x' + log.topics[1].slice(26), root: log.topics[2], fromIndex: Number(word(0)), toIndex: Number(word(1)), ruleVersion: Number(word(2)), seq: Number(word(3)), blockTime: Number(word(4)), blockNumber: parseInt(log.blockNumber, 16), txHash: log.transactionHash };
}

// Envoie une tx signee et attend le recu.
export async function sendAndWait(url, tx, privHex, { timeoutMs = 120000 } = {}) {
  const from = addressOf(privHex);
  const [nonce, gasPrice] = await Promise.all([rpc(url, 'eth_getTransactionCount', [from, 'pending']), rpc(url, 'eth_gasPrice')]);
  const est = BigInt(await rpc(url, 'eth_estimateGas', [{ from, to: tx.to || undefined, data: tx.data, value: q(tx.value || 0) }]));
  const signed = signLegacyTx({ ...tx, nonce: BigInt(nonce), gasPrice: BigInt(gasPrice) * 12n / 10n, gas: est * 13n / 10n, chainId: FUJI_CHAIN_ID }, privHex);
  const hash = await rpc(url, 'eth_sendRawTransaction', [signed.raw]);
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const rc = await rpc(url, 'eth_getTransactionReceipt', [hash]);
    if (rc) { if (rc.status !== '0x1') throw new Error(`transaction echouee (status ${rc.status}) ${hash}`); return { hash, receipt: rc, from }; }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`recu non obtenu apres ${timeoutMs} ms pour ${hash}`);
}

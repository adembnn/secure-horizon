// Worker thread of lookalike.mjs: searches a throwaway key whose address starts with `prefix` and
// ends with `suffix` (lowercase hex, no 0x). The key only ever travels through the worker message
// to the parent; it is never printed or written. Fast path: noble secp256k1 point additions with
// batch normalisation (transitive dependency of ethers); fallback: plain ethers (much slower).
import { parentPort, workerData } from "node:worker_threads";
import { createRequire } from "node:module";

const { pkgJson, prefix, suffix, startKey } = workerData;
const req = createRequire(pkgJson);

const nib = (s) => [...s].map((c) => parseInt(c, 16));
const pre = nib(prefix);
const suf = nib(suffix);
// nibble i (0 = first hex char of the address) of a 20-byte address `a`
const nibbleAt = (a, i) => ((i & 1) === 0 ? a[i >> 1] >> 4 : a[i >> 1] & 15);
function matches(a) {
  for (let i = 0; i < pre.length; i++) if (nibbleAt(a, i) !== pre[i]) return false;
  for (let j = 0; j < suf.length; j++) if (nibbleAt(a, 40 - suf.length + j) !== suf[j]) return false;
  return true;
}

let fast = null;
try {
  const { secp256k1 } = req("@noble/curves/secp256k1");
  const { keccak_256 } = req("@noble/hashes/sha3");
  const P = secp256k1.ProjectivePoint;
  if (P && typeof P.normalizeZ === "function" && keccak_256) fast = { P, keccak_256 };
} catch {
  fast = null;
}

let key = BigInt("0x" + startKey);

if (fast) {
  const { P, keccak_256 } = fast;
  const G = P.BASE;
  const B = 512;
  let cur = P.BASE.multiply(key);
  const buf = new Uint8Array(64);
  const put = (n, off) => buf.set(Buffer.from(n.toString(16).padStart(64, "0"), "hex"), off);
  for (;;) {
    const pts = new Array(B);
    for (let i = 0; i < B; i++) {
      cur = cur.add(G);
      pts[i] = cur;
    }
    const norm = P.normalizeZ(pts);
    for (let i = 0; i < B; i++) {
      put(norm[i].px, 0);
      put(norm[i].py, 32);
      const h = keccak_256(buf).subarray(12);
      if (matches(h)) {
        const found = key + BigInt(i + 1);
        parentPort.postMessage({ key: found.toString(16).padStart(64, "0") });
        process.exit(0);
      }
    }
    key += BigInt(B);
  }
} else {
  const { ethers } = req("ethers");
  for (;;) {
    key += 1n;
    const hex = key.toString(16).padStart(64, "0");
    const a = ethers.getBytes(ethers.computeAddress("0x" + hex));
    if (matches(a)) {
      parentPort.postMessage({ key: hex });
      process.exit(0);
    }
  }
}

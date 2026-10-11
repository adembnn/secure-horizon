// Arbre de Merkle keccak256 (reutilise engine/src/keccak.mjs). Feuilles et noeuds separes par prefixe de domaine
// (0x00 feuille, 0x01 noeud) : pas d'ambiguite feuille/noeud. Noeud impair : promu tel quel (pas de duplication).
import { keccakBytes, toHex, fromHex } from '../engine/src/keccak.mjs';

const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const H32 = /^0x[0-9a-f]{64}$/;
const leafHash = (entryHash) => toHex(keccakBytes(cat(Uint8Array.of(0), fromHex(entryHash))));
const nodeHash = (l, r) => toHex(keccakBytes(cat(Uint8Array.of(1), fromHex(l), fromHex(r))));

function levels(entryHashes) {
  if (!entryHashes.length) throw new Error('intervalle vide');
  for (const h of entryHashes) if (!H32.test(h)) throw new Error('hash d\'entree invalide');
  let lvl = entryHashes.map(leafHash); const all = [lvl];
  while (lvl.length > 1) {
    const nx = [];
    for (let i = 0; i < lvl.length; i += 2) nx.push(i + 1 < lvl.length ? nodeHash(lvl[i], lvl[i + 1]) : lvl[i]);
    all.push(nx); lvl = nx;
  }
  return all;
}
export const merkleRoot = (entryHashes) => { const l = levels(entryHashes); return l[l.length - 1][0]; };

// Preuve d'inclusion pour l'entree de position pos (0-based dans la liste fournie).
export function merkleProof(entryHashes, pos) {
  if (!Number.isInteger(pos) || pos < 0 || pos >= entryHashes.length) throw new Error('position hors intervalle');
  const all = levels(entryHashes), proof = []; let i = pos;
  for (let d = 0; d < all.length - 1; d++) {
    const sib = i ^ 1;
    if (sib < all[d].length) proof.push({ side: i & 1 ? 'L' : 'R', hash: all[d][sib] });
    i >>= 1;
  }
  return { leaf: entryHashes[pos], pos, count: entryHashes.length, proof, root: all[all.length - 1][0] };
}
// Verifie une preuve SANS avoir les autres entrees : entryHash + proof -> root attendue.
export function verifyProof(entryHash, proof, expectedRoot) {
  if (!H32.test(entryHash) || !H32.test(expectedRoot)) return false;
  let h = leafHash(entryHash);
  for (const s of proof) {
    if (!H32.test(s.hash)) return false;
    if (s.side === 'L') h = nodeHash(s.hash, h); else if (s.side === 'R') h = nodeHash(h, s.hash); else return false;
  }
  return h === expectedRoot.toLowerCase();
}

// Utilitaires communs du banc d'essai (aucune dépendance, aucun secret).
export const RPC = { cchain: "https://api.avax.network/ext/bc/C/rpc", fuji: "https://api.avax-test.network/ext/bc/C/rpc" };
export async function rpc(url, method, params, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
      if (r.status === 429) { await new Promise(s => setTimeout(s, 800 * (i + 1))); continue; }
      const j = await r.json();
      if (j.error) { if (i === tries - 1) throw new Error(JSON.stringify(j.error)); await new Promise(s => setTimeout(s, 500 * (i + 1))); continue; }
      return j.result;
    } catch (e) { if (i === tries - 1) throw e; await new Promise(s => setTimeout(s, 500 * (i + 1))); }
  }
}
// PRNG déterministe pour un échantillon rejouable
export function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// Intervalle de Wilson à 95 %
export function wilson(k, n, z = 1.96) {
  if (n === 0) return [0, 1];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}
export async function pool(items, conc, fn) {
  let i = 0; const out = new Array(items.length);
  await Promise.all(Array.from({ length: conc }, async () => { while (true) { const k = i++; if (k >= items.length) return; out[k] = await fn(items[k], k); } }));
  return out;
}

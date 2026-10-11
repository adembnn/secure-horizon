// Récupère 200 blocs Ethereum aléatoires (graine 20261011, de 20M à l'ancrage), lecture seule, séquentiel, espacé. Cache dans cache_/ (ignoré par git).
import fs from 'node:fs';
const ETH = 'https://gateway.tenderly.co/public/mainnet';
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function rpc(method, params, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(ETH, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
      if (r.status === 429) { await sleep(1500 * (i + 1)); continue; }
      const j = await r.json(); if (j.error) { await sleep(800 * (i + 1)); continue; } return j.result;
    } catch { await sleep(800 * (i + 1)); }
  }
  throw new Error('rpc ' + method);
}
const N = 200, cache = 'cache_/eth_sample.jsonl', meta = 'cache_/eth_sample.meta.json';
const head = parseInt(await rpc('eth_blockNumber', []), 16), pin = head - 1000, lo = 20_000_000;
const rnd = mulberry32(20261011); const blocks = Array.from({ length: N }, () => lo + Math.floor(rnd() * (pin - lo)));
const out = fs.openSync(cache, 'w'); let n = 0;
for (let i = 0; i < blocks.length; i++) {
  const b = blocks[i]; const blk = await rpc('eth_getBlockByNumber', ['0x' + b.toString(16), true]);
  for (const t of blk?.transactions || []) { fs.writeSync(out, JSON.stringify({ block: b, ts: parseInt(blk.timestamp, 16), hash: t.hash, from: t.from, to: t.to, type: t.type, value: t.value, input: t.input }) + '\n'); n++; }
  if ((i + 1) % 25 === 0) console.error('blocs', i + 1, 'tx', n);
  await sleep(250);
}
fs.closeSync(out); fs.writeFileSync(meta, JSON.stringify({ head, pin, seed: 20261011, n_blocks: N, lo, n_tx: n, blocks }, null, 1));
console.log('tx', n, 'pin', pin);

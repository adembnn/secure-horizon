// Échantillonne des transactions réelles de la C-Chain mainnet (lecture seule).
import fs from "node:fs";
import { RPC, rpc, mulberry32, pool } from "./lib.mjs";
const N_BLOCKS = Number(process.argv[2] || 300), SEED = Number(process.argv[3] || 20261011), SPAN = Number(process.argv[4] || 1_000_000);
const head = parseInt(await rpc(RPC.cchain, "eth_blockNumber", []), 16);
const pin = head - 1000; // bloc d'ancrage épinglé
const rnd = mulberry32(SEED);
const blocks = Array.from({ length: N_BLOCKS }, () => pin - Math.floor(rnd() * SPAN));
let done = 0;
const rows = await pool(blocks, 4, async (b) => {
  const blk = await rpc(RPC.cchain, "eth_getBlockByNumber", ["0x" + b.toString(16), true]);
  if (++done % 50 === 0) process.stderr.write(`blocs ${done}/${N_BLOCKS}\n`);
  return (blk?.transactions || []).map(t => ({ block: b, ts: parseInt(blk.timestamp, 16), hash: t.hash, from: t.from, to: t.to, type: t.type, value: t.value, input: t.input }));
});
const txs = rows.flat();
fs.writeFileSync("data/cchain_sample.jsonl", txs.map(x => JSON.stringify(x)).join("\n"));
fs.writeFileSync("data/cchain_sample.meta.json", JSON.stringify({ pin, head_at_run: head, seed: SEED, n_blocks: N_BLOCKS, span: SPAN, n_tx: txs.length, blocks }, null, 1));
console.log("tx:", txs.length, "blocs:", N_BLOCKS, "ancrage:", pin);

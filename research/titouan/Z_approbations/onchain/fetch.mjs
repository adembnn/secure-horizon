// Récupère les événements Approval ERC-20 sur des blocs tirés au hasard (lecture seule).
// Usage: node fetch.mjs <eth|avax> <nbBlocs> [graine]
import fs from "node:fs";
import { rpc, mulberry32, pool } from "../../bench/lib.mjs";
const CH = { eth: { url: "https://gateway.tenderly.co/public/mainnet", lo: 20_000_000, conc: 3 },
             avax: { url: "https://api.avax.network/ext/bc/C/rpc", lo: null, conc: 2, win: 500, span: 5_000_000 } };
const chain = process.argv[2], N = Number(process.argv[3]), SEED = Number(process.argv[4] || 20261011);
const c = CH[chain]; if (!c) throw new Error("chaîne");
const TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const head = parseInt(await rpc(c.url, "eth_blockNumber", []), 16);
const metaF = `cache/${chain}.meta.json`;
let meta = fs.existsSync(metaF) ? JSON.parse(fs.readFileSync(metaF)) : null;
const pin = meta ? meta.pin : head - 1000;
const lo = meta ? meta.lo : (c.lo ?? pin - c.span);
const W = c.win || 1;
const rnd = mulberry32(SEED);
const blocks = Array.from({ length: N }, () => lo + Math.floor(rnd() * (pin - lo - W)));
fs.writeFileSync(metaF, JSON.stringify({ chain, pin, lo, seed: SEED, fenetre_blocs: W, rpc: c.url, topic0: TOPIC }, null, 1));
const outF = `cache/${chain}.approvals.jsonl`;
const done = new Set(fs.existsSync(outF) ? fs.readFileSync(outF, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l).b) : []);
const todo = blocks.filter(b => !done.has(b));
let k = 0;
await pool(todo, c.conc, async (b) => {
  const logs = await rpc(c.url, "eth_getLogs", [{ fromBlock: "0x" + b.toString(16), toBlock: "0x" + (b + W - 1).toString(16), topics: [TOPIC] }]);
  const rows = logs.filter(l => l.topics.length === 3).map(l => ({ t: l.address, o: l.topics[1], s: "0x" + l.topics[2].slice(26), v: l.data }));
  fs.appendFileSync(outF, JSON.stringify({ b, n721: logs.length - rows.length, ev: rows }) + "\n");
  if (++k % 50 === 0) process.stderr.write(`${chain} ${k}/${todo.length}\n`);
});
console.log("fini", chain, "fenetres", blocks.length);

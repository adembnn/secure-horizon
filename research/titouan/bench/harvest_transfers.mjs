// Quels mécanismes les drainers listés utilisent-ils ? Transfer ERC-20 vers adresses listées + sélecteur de la tx (lecture seule).
import fs from "node:fs";
import { rpc, pool, mulberry32 } from "./lib.mjs";
const ETH = "https://gateway.tenderly.co/public/mainnet";
const T_TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const FROM = process.argv[2] || "0x16E3600", TO = process.argv[3] || "0x17D7840"; // 24 000 000 -> 25 000 000
const bl = JSON.parse(fs.readFileSync("data/address.json", "utf8")).map(a => a.toLowerCase());
const pad = a => "0x" + a.slice(2).padStart(64, "0");
const batches = []; for (let i = 0; i < bl.length; i += 25) batches.push(bl.slice(i, i + 25));
const logs = []; let failed = 0;
await pool(batches, 3, async b => { try { const r = await rpc(ETH, "eth_getLogs", [{ fromBlock: FROM, toBlock: TO, topics: [T_TRANSFER, null, b.map(pad)] }], 3); logs.push(...r.filter(l => l.topics.length === 3)); } catch (e) { failed++; } });
const txs = [...new Set(logs.map(l => l.transactionHash))];
console.log("Transfer vers adresses listées:", logs.length, "tx:", txs.length, "lots en échec:", failed);
const rnd = mulberry32(5); const sample = txs.sort(() => rnd() - 0.5).slice(0, 500);
const sel = {}; const recs = [];
await pool(sample, 6, async h => { const t = await rpc(ETH, "eth_getTransactionByHash", [h]); const s = (t.input || "0x").slice(2, 10) || "(vide)"; sel[s] = (sel[s] || 0) + 1; recs.push({ tx: h, sel: s, to: t.to, from: t.from, type: t.type }); });
const top = Object.entries(sel).sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log("sélecteurs de premier niveau (échantillon", sample.length, "):", top);
fs.writeFileSync("data/transfer_selectors.json", JSON.stringify({ window: [FROM, TO], n_logs: logs.length, n_tx: txs.length, top, recs }));

// Récolte d'approbations RÉELLES vers des adresses étiquetées par un tiers (ScamSniffer), Ethereum mainnet, lecture seule.
import fs from "node:fs";
import { rpc, pool } from "./lib.mjs";
const ETH = "https://gateway.tenderly.co/public/mainnet";
const T_APPROVAL = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const bl = JSON.parse(fs.readFileSync("data/address.json", "utf8")).map(a => a.toLowerCase());
const pad = a => "0x" + a.slice(2).padStart(64, "0");
const FROM = process.argv[2] || "0x1312D00"; // bloc 20 000 000
const batches = []; for (let i = 0; i < bl.length; i += 50) batches.push(bl.slice(i, i + 50));
let logs = [], failed = 0;
await pool(batches, 3, async (b, k) => {
  try {
    const r = await rpc(ETH, "eth_getLogs", [{ fromBlock: FROM, toBlock: "latest", topics: [T_APPROVAL, null, b.map(pad)] }]);
    logs.push(...r);
  } catch (e) { failed++; process.stderr.write(`lot ${k} échec: ${String(e.message).slice(0, 120)}\n`); }
});
// uniquement les logs Approval ERC-20 (3 topics indexés : owner, spender) – ERC-721 a 4 topics
logs = logs.filter(l => l.topics.length === 3);
const byTx = new Map(); for (const l of logs) if (!byTx.has(l.transactionHash)) byTx.set(l.transactionHash, l);
console.log("logs Approval vers adresses listées:", logs.length, "tx uniques:", byTx.size, "lots en échec:", failed);
fs.writeFileSync("data/attack_approval_logs.json", JSON.stringify([...byTx.values()].map(l => ({ tx: l.transactionHash, block: parseInt(l.blockNumber, 16), token: l.address, owner: "0x" + l.topics[1].slice(26), spender: "0x" + l.topics[2].slice(26), data: l.data })), null, 0));

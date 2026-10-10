// Récolte de permits réels : (a) EIP-2612 cachés dans les tx déjà récoltées, (b) événements Permit2 vers des spenders listés.
import fs from "node:fs";
import { rpc, pool } from "./lib.mjs";
const ETH = "https://gateway.tenderly.co/public/mainnet";
const PERMIT2 = "0x000000000022d473030f116ddee9f6b43ac78ba3";
const bl = JSON.parse(fs.readFileSync("data/address.json", "utf8")).map(a => a.toLowerCase());
const pad = a => "0x" + a.slice(2).padStart(64, "0");
// (b) topics candidats pour l'événement Permit2 Approval/Permit : on découvre les topic0 émis par Permit2 vers un spender listé
const found = {};
const batches = []; for (let i = 0; i < bl.length; i += 50) batches.push(bl.slice(i, i + 50));
const logs = [];
await pool(batches, 3, async b => {
  // Permit2 Approval(owner, token, spender, ...) : spender = topics[3]
  try { const r = await rpc(ETH, "eth_getLogs", [{ fromBlock: "0x1312D00", toBlock: "latest", address: PERMIT2, topics: [null, null, null, b.map(pad)] }]); logs.push(...r); } catch (e) { process.stderr.write("lot échec " + String(e.message).slice(0, 100) + "\n"); }
});
for (const l of logs) found[l.topics[0]] = (found[l.topics[0]] || 0) + 1;
console.log("logs Permit2 (spender listé en topic3):", logs.length, "topic0:", found);
fs.writeFileSync("data/permit2_logs.json", JSON.stringify(logs.map(l => ({ tx: l.transactionHash, block: parseInt(l.blockNumber, 16), topic0: l.topics[0], owner: "0x" + l.topics[1].slice(26), token: "0x" + l.topics[2].slice(26), spender: "0x" + l.topics[3].slice(26), data: l.data }))));
// (a) permit 2612 dans les tx déjà récoltées
const rows = JSON.parse(fs.readFileSync("data/attack_approval_logs.json", "utf8"));
let inner = [];
await pool(rows, 6, async r => { const t = await rpc(ETH, "eth_getTransactionByHash", [r.tx]); const inp = (t.input || "").toLowerCase(); const sel = inp.slice(2, 10);
  if (sel !== "095ea7b3" && sel !== "a9059cbb" && sel !== "23b872dd") { inner.push({ tx: r.tx, to: t.to, from: t.from, sel, has2612: inp.includes("d505accf"), hasP2: inp.includes("2b67b570") || inp.includes("2a2d80d1") || inp.includes("30f28b7a") || inp.includes("2b67b570") }); } });
console.log("tx 'autres' (ni approve/transfer/transferFrom en premier niveau):", inner.length, "avec permit 2612 caché:", inner.filter(x => x.has2612).length, "avec Permit2:", inner.filter(x => x.hasP2).length);
fs.writeFileSync("data/permit_inner.json", JSON.stringify(inner));

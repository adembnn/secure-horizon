// Approbations ERC-20 vers adresses listées (ScamSniffer) SUR LA C-CHAIN, lecture seule.
import fs from "node:fs";
import { RPC, rpc, pool } from "./lib.mjs";
const T_APPROVAL = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const bl = JSON.parse(fs.readFileSync("data/address.json", "utf8")).map(a => a.toLowerCase());
const pad = a => "0x" + a.slice(2).padStart(64, "0");
const head = parseInt(await rpc(RPC.cchain, "eth_blockNumber", []), 16);
const SPAN = Number(process.argv[2] || 20_000_000), CH = 2_000_000;
const jobs = []; for (let from = head - SPAN; from < head; from += CH) for (let i = 0; i < bl.length; i += 100) jobs.push({ from, to: Math.min(head, from + CH - 1), addrs: bl.slice(i, i + 100) });
console.log("tâches:", jobs.length, "tête:", head);
const logs = []; let fail = 0, k = 0;
await pool(jobs, 4, async j => { try { const r = await rpc(RPC.cchain, "eth_getLogs", [{ fromBlock: "0x" + j.from.toString(16), toBlock: "0x" + j.to.toString(16), topics: [T_APPROVAL, null, j.addrs.map(pad)] }], 3); logs.push(...r.filter(l => l.topics.length === 3)); } catch (e) { fail++; if (fail < 3) console.log("échec:", String(e.message).slice(0, 150)); } if (++k % 50 === 0) process.stderr.write(k + "/" + jobs.length + "\n"); });
const tx = new Map(); for (const l of logs) if (!tx.has(l.transactionHash)) tx.set(l.transactionHash, l);
console.log("approbations C-Chain vers adresses listées:", logs.length, "tx:", tx.size, "échecs:", fail, "span blocs:", SPAN);
fs.writeFileSync("data/cchain_attack_logs.json", JSON.stringify([...tx.values()].map(l => ({ tx: l.transactionHash, block: parseInt(l.blockNumber, 16), token: l.address, owner: "0x" + l.topics[1].slice(26), spender: "0x" + l.topics[2].slice(26) }))));

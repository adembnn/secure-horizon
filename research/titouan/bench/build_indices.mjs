// Jeu d'indices par spender, AU MOMENT de l'événement (bloc d'ancrage), pour tester un modèle (Clef) contre des références.
// Étiquette 1 = spender présent dans la liste ScamSniffer ; 0 = spender d'un droit observé dans le trafic aléatoire (présumé légitime).
import fs from "node:fs";
import { rpc, pool, mulberry32 } from "./lib.mjs";
import { decode } from "./core.mjs";
const URLS = ["https://eth.drpc.org", "https://gateway.tenderly.co/public/mainnet"];
const call = async (m, p) => { for (const u of URLS) { try { const r = await rpc(u, m, p, 4); if (r !== null && r !== undefined) return r; } catch {} } throw new Error("rpc " + m); };
const PIN = 26164183, LO = 20_000_000; // ancrage figé (reproductible)
const T_APPROVAL = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const hex = n => "0x" + n.toString(16);
// 1. spenders d'attaque : bloc d'ancrage = premier bloc observé
const atk = JSON.parse(fs.readFileSync("data/attack_approval_logs.json", "utf8"));
const anchor = {}, label = {}, src = {};
for (const r of atk) { anchor[r.spender] = Math.min(anchor[r.spender] ?? Infinity, r.block); label[r.spender] = 1; src[r.spender] = "scamsniffer"; }
// 2. spenders légitimes présumés : mêmes 200 blocs aléatoires (graine et ancrage figés)
const rnd = mulberry32(20261011); const blocks = Array.from({ length: 200 }, () => LO + Math.floor(rnd() * (PIN - LO)));
await pool(blocks, 3, async b => { let blk; try { blk = await call("eth_getBlockByNumber", [hex(b), true]); } catch { return; } for (const t of blk.transactions) { const e = decode(t); if (e.spender && e.kind !== "transferFrom" && label[e.spender] !== 1) { anchor[e.spender] = Math.min(anchor[e.spender] ?? Infinity, b); label[e.spender] = 0; src[e.spender] = "trafic_aleatoire"; } } });
const sp = Object.keys(anchor); console.log("spenders:", sp.length, "attaque:", sp.filter(s => label[s] === 1).length, "légitimes:", sp.filter(s => label[s] === 0).length);
let k = 0; const rows = [];
await pool(sp, 4, async s => {
  const b = anchor[s], bt = hex(b);
  try {
    const [code, nonce, bal] = await Promise.all([call("eth_getCode", [s, bt]), call("eth_getTransactionCount", [s, bt]), call("eth_getBalance", [s, bt])]);
    let approvers = null;
    try { const lg = await call("eth_getLogs", [{ fromBlock: hex(Math.max(0, b - 50000)), toBlock: bt, topics: [T_APPROVAL, null, "0x" + s.slice(2).padStart(64, "0")] }]); approvers = new Set(lg.map(l => l.topics[1])).size; } catch { approvers = null; }
    const csize = code && code !== "0x" ? (code.length - 2) / 2 : 0;
    rows.push({ address: s, label: label[s], source: src[s], anchor_block: b, is_contract: csize > 0, code_size: csize, nonce: parseInt(nonce, 16), balance_eth: Number(BigInt(bal) / 10n ** 14n) / 1e4, distinct_approvers_50k_blocks: approvers });
  } catch (e) { /* ignoré */ }
  if (++k % 100 === 0) process.stderr.write(k + "/" + sp.length + "\n");
});
// séparation dev/test par hash de l'adresse (stable, sans fuite)
const h = a => { let x = 0; for (const c of a) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; };
for (const r of rows) r.split = (h(r.address) % 2 === 0) ? "dev" : "test";
fs.writeFileSync("data/indices_spenders.jsonl", rows.map(r => JSON.stringify(r)).join("\n"));
const c = (f) => rows.filter(f).length;
console.log("lignes:", rows.length, "attaque:", c(r => r.label === 1), "légitime:", c(r => r.label === 0), "dev:", c(r => r.split === "dev"), "test:", c(r => r.split === "test"));

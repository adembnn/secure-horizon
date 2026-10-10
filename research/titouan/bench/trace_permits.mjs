// Trace (drpc, lecture seule) des tx de drain vers adresses listées : quels appels internes, dont permit/Permit2 ?
import fs from "node:fs";
import { rpc, pool } from "./lib.mjs";
const URL = "https://eth.drpc.org";
const d = JSON.parse(fs.readFileSync("data/transfer_selectors.json", "utf8"));
const todo = d.recs.filter(r => r.sel !== "60806040");
const NAMES = { d505accf: "permit_2612", "2b67b570": "permit2_permit", "2a2d80d1": "permit2_permitBatch", "30f28b7a": "permit2_permitTransferFrom", edd9444b: "permit2_permitTransferFromBatch", "36c78516": "permit2_transferFrom", "23b872dd": "transferFrom", "095ea7b3": "approve", a9059cbb: "transfer" };
const walk = (c, f) => { f(c); for (const x of c.calls || []) walk(x, f); };
const agg = {}, permits = [], per_tx = [];
let ok = 0, ko = 0;
await pool(todo, 2, async r => {
  try {
    const tr = await rpc(URL, "debug_traceTransaction", [r.tx, { tracer: "callTracer" }], 3);
    const seen = {};
    walk(tr, c => { const s = (c.input || "").slice(2, 10); if (NAMES[s]) { seen[NAMES[s]] = (seen[NAMES[s]] || 0) + 1; agg[NAMES[s]] = (agg[NAMES[s]] || 0) + 1;
      if (s === "d505accf" && c.input.length >= 10 + 7 * 64) { const w = i => c.input.slice(10 + i * 64, 10 + (i + 1) * 64); permits.push({ tx: r.tx, token: c.to, owner: "0x" + w(0).slice(24), spender: "0x" + w(1).slice(24), value: BigInt("0x" + w(2)).toString(), deadline: BigInt("0x" + w(3)).toString(), v: parseInt(w(4), 16), r: "0x" + w(5), s: "0x" + w(6) }); } } });
    per_tx.push({ tx: r.tx, seen }); ok++;
  } catch (e) { ko++; }
});
console.log("tx tracées:", ok, "échecs:", ko);
console.log("appels internes par type:", agg);
const withPermit = per_tx.filter(p => Object.keys(p.seen).some(k => k.startsWith("permit"))).length;
console.log("tx avec au moins un permit (2612 ou Permit2) en appel interne:", withPermit, "/", ok);
console.log("permits ERC-2612 reconstruisibles (avec v,r,s):", permits.length);
fs.writeFileSync("data/permits_reels.json", JSON.stringify({ n_tx_tracees: ok, agg, withPermit, permits }));

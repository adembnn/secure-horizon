// Trafic légitime (présumé) Ethereum mainnet, mêmes blocs que la période des attaques, mêmes règles.
import fs from "node:fs";
import { rpc, wilson, pool, mulberry32 } from "./lib.mjs";
import { decode, RULES, flagged } from "./core.mjs";
const ETH = "https://gateway.tenderly.co/public/mainnet";
const N = Number(process.argv[2] || 200);
const head = parseInt(await rpc(ETH, "eth_blockNumber", []), 16), pin = head - 1000, lo = 20_000_000;
const rnd = mulberry32(20261011); const blocks = Array.from({ length: N }, () => lo + Math.floor(rnd() * (pin - lo)));
let done = 0;
const rows = (await pool(blocks, 4, async b => { const blk = await rpc(ETH, "eth_getBlockByNumber", ["0x" + b.toString(16), true]); if (++done % 50 === 0) process.stderr.write(done + "\n"); return (blk?.transactions || []).map(t => ({ hash: t.hash, from: t.from, to: t.to, type: t.type, input: t.input, block: b })); })).flat();
const eff = rows.map(decode);
const spenders = [...new Set(eff.filter(e => e.spender).map(e => e.spender))];
const isContract = {}; await pool(spenders, 6, async s => { const c = await rpc(ETH, "eth_getCode", [s, "latest"]); isContract[s] = !!c && c !== "0x"; });
const ctx = { isContract }; const n = eff.length;
const bl = new Set(JSON.parse(fs.readFileSync("data/address.json", "utf8")).map(a => a.toLowerCase()));
const contamine = eff.filter(e => [e.spender, e.recipient, e.to, e.from].some(a => a && bl.has(a.toLowerCase()))).length;
const out = { n_blocs: N, pin, n_tx: n, droits: eff.filter(e => e.spender).length, contamine_par_liste: contamine, par_type: {}, regles: {} };
for (const e of eff) out.par_type[e.kind] = (out.par_type[e.kind] || 0) + 1;
for (const [name, f] of Object.entries(RULES)) { const k = eff.filter(e => f(e, ctx)).length; const [l, h] = wilson(k, n); out.regles[name] = { k, pct: +(100 * k / n).toFixed(3), wilson95: [+(100 * l).toFixed(3), +(100 * h).toFixed(3)] }; }
const fl = eff.filter(e => flagged(e, ctx).length); const [l, h] = wilson(fl.length, n);
out.au_moins_une = { k: fl.length, pct: +(100 * fl.length / n).toFixed(3), wilson95: [+(100 * l).toFixed(3), +(100 * h).toFixed(3)] };
const dr = eff.filter(e => e.spender); const fd = dr.filter(e => flagged(e, ctx).length);
out.sur_les_seules_transactions_donnant_un_droit = { n: dr.length, flaggees: fd.length, pct: +(100 * fd.length / dr.length).toFixed(1) };
fs.writeFileSync("data/result_legit_eth.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));

import fs from "node:fs";
import { rpc, wilson, pool } from "./lib.mjs";
import { decode, RULES, flagged, isGrant } from "./core.mjs";
const ETH = "https://gateway.tenderly.co/public/mainnet";
const rows = JSON.parse(fs.readFileSync("data/attack_approval_logs.json", "utf8"));
let done = 0;
const txs = await pool(rows, 6, async r => { const t = await rpc(ETH, "eth_getTransactionByHash", [r.tx]); if (++done % 300 === 0) process.stderr.write(done + "\n"); return t; });
const spenders = [...new Set(rows.map(r => r.spender))];
const isContract = {};
await pool(spenders, 6, async s => { const c = await rpc(ETH, "eth_getCode", [s, "latest"]); isContract[s] = !!c && c !== "0x"; });
const ctx = { isContract };
const res = []; 
for (let i = 0; i < rows.length; i++) { const t = txs[i]; if (!t) continue; const e = decode({ hash: t.hash, from: t.from, to: t.to, type: t.type, input: t.input }); e.logSpender = rows[i].spender; res.push(e); }
// pour la règle R3, le spender pertinent est celui du log si le décodage direct ne le voit pas
const n = res.length;
const direct = res.filter(e => ["approve", "increaseAllowance", "permit", "setApprovalForAll", "permit2_approve"].includes(e.kind));
const grants = direct.filter(isGrant); const grantsFlag = grants.filter(e => flagged(e, ctx).length > 0);
const [lg1, hg1] = wilson(grantsFlag.length, grants.length);
const out = { correction: "approve(0) = révocation, exclu des droits (11/10 01h50)", n_droits_directs_reels: grants.length, rappel_filet_sur_droits_directs_reels: { k: grantsFlag.length, n: grants.length, pct: +(100 * grantsFlag.length / grants.length).toFixed(1), wilson95: [+(100 * lg1).toFixed(1), +(100 * hg1).toFixed(1)] }, n_approve_zero: direct.length - grants.length, n_tx_attaque: n, vus_par_decodeur_direct: direct.length, par_type: {} };
for (const e of res) out.par_type[e.kind] = (out.par_type[e.kind] || 0) + 1;
const anyFlag = res.filter(e => flagged(e, ctx).length > 0);
const anyFlagDirect = direct.filter(e => flagged(e, ctx).length > 0);
const [l1, h1] = wilson(anyFlag.length, n), [l2, h2] = wilson(anyFlagDirect.length, direct.length);
out.rappel_filet_sur_tout = { k: anyFlag.length, n, pct: +(100 * anyFlag.length / n).toFixed(1), wilson95: [+(100 * l1).toFixed(1), +(100 * h1).toFixed(1)] };
out.rappel_filet_sur_approbations_directes = { k: anyFlagDirect.length, n: direct.length, pct: +(100 * anyFlagDirect.length / direct.length).toFixed(1), wilson95: [+(100 * l2).toFixed(1), +(100 * h2).toFixed(1)] };
out.par_regle = {};
for (const [name, f] of Object.entries(RULES)) { const k = res.filter(e => f(e, ctx)).length; out.par_regle[name] = { k, pct_sur_tout: +(100 * k / n).toFixed(1) }; }
out.spender_est_contrat = { contrat: spenders.filter(s => isContract[s]).length, externe: spenders.filter(s => !isContract[s]).length };
fs.writeFileSync("data/result_attaques_eth.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));

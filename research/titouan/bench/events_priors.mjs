// Correction d'un biais de ma mesure précédente : pour chaque ÉVÉNEMENT (pas seulement le premier d'un spender), nombre d'approbateurs distincts ANTÉRIEURS (fenêtre 50 000 blocs).
import fs from "node:fs";
import { rpc, pool, mulberry32, wilson } from "./lib.mjs";
import { decode } from "./core.mjs";
const URLS = ["https://eth.drpc.org", "https://gateway.tenderly.co/public/mainnet"];
const call = async (m, p) => { for (const u of URLS) { try { const r = await rpc(u, m, p, 4); if (r !== null && r !== undefined) return r; } catch {} } throw new Error("rpc " + m); };
const hex = n => "0x" + n.toString(16), PIN = 26164183, LO = 20_000_000, T = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const atk = JSON.parse(fs.readFileSync("data/attack_approval_logs.json", "utf8")).map(r => ({ label: 1, spender: r.spender, owner: r.owner, block: r.block, token: r.token }));
const rnd = mulberry32(20261011); const blocks = Array.from({ length: 200 }, () => LO + Math.floor(rnd() * (PIN - LO)));
const leg = [];
await pool(blocks, 3, async b => { let blk; try { blk = await call("eth_getBlockByNumber", [hex(b), true]); } catch { return; } for (const t of blk.transactions) { const e = decode(t); if (e.spender && ["approve", "increaseAllowance", "permit"].includes(e.kind)) leg.push({ label: 0, spender: e.spender, owner: e.kind === "permit" ? null : t.from, block: b, token: t.to }); } });
console.log("événements: attaque", atk.length, "légitime", leg.length);
const all = [...atk, ...leg]; let k = 0;
await pool(all, 5, async ev => {
  try { const lg = await call("eth_getLogs", [{ fromBlock: hex(Math.max(0, ev.block - 50000)), toBlock: hex(ev.block), topics: [T, null, "0x" + ev.spender.slice(2).padStart(64, "0")] }]);
    const me = ev.owner ? "0x" + ev.owner.slice(2).toLowerCase().padStart(64, "0") : null;
    ev.priors = new Set(lg.filter(l => parseInt(l.blockNumber, 16) < ev.block && l.topics[1].toLowerCase() !== me).map(l => l.topics[1])).size; } catch { ev.priors = null; }
  if (++k % 300 === 0) process.stderr.write(k + "/" + all.length + "\n"); });
const ok = all.filter(e => e.priors != null);
fs.writeFileSync("data/events_priors.json", JSON.stringify(ok));
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const out = { fenetre_blocs: 50000, mesure: "approbateurs distincts ANTÉRIEURS à l'événement, niveau transaction" };
for (const [nm, lab] of [["attaque", 1], ["legitime", 0]]) { const s = ok.filter(e => e.label === lab).map(e => e.priors); out[nm] = { n: s.length, priors_p10_p50_p90: [q(s, .1), q(s, .5), q(s, .9)] }; }
for (const th of [0, 1, 2, 5]) { const P = ok.filter(e => e.label === 1), N = ok.filter(e => e.label === 0); const tp = P.filter(e => e.priors <= th).length, fp = N.filter(e => e.priors <= th).length; out["priors<=" + th] = { rappel_pct: +(100 * tp / P.length).toFixed(1), rappel_wilson95: wilson(tp, P.length).map(x => +(100 * x).toFixed(1)), fp_pct_des_droits_legit: +(100 * fp / N.length).toFixed(1), fp_wilson95: wilson(fp, N.length).map(x => +(100 * x).toFixed(1)), tp, n_pos: P.length, fp, n_neg: N.length }; }
fs.writeFileSync("data/result_events_priors.json", JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1));

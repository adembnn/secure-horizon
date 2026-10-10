// Expérience dev/test : le nonce du spender (compte externe) sépare-t-il attaques et légitime ?
import fs from "node:fs";
import { rpc, wilson, pool, mulberry32 } from "./lib.mjs";
import { decode } from "./core.mjs";
const ETH = "https://gateway.tenderly.co/public/mainnet";
// attaques
const rows = JSON.parse(fs.readFileSync("data/attack_approval_logs.json", "utf8"));
const atkSp = {}; for (const r of rows) atkSp[r.spender] = (atkSp[r.spender] || 0) + 1;
// légitime : on re-tire les mêmes 200 blocs (même graine)
const head = parseInt(await rpc(ETH, "eth_blockNumber", []), 16), pin = head - 1000, lo = 20_000_000;
const rnd = mulberry32(20261011); const blocks = Array.from({ length: 200 }, () => lo + Math.floor(rnd() * (pin - lo)));
const legSp = {};
await pool(blocks, 4, async b => { const blk = await rpc(ETH, "eth_getBlockByNumber", ["0x" + b.toString(16), true]); for (const t of blk.transactions) { const e = decode(t); if (e.spender) legSp[e.spender] = (legSp[e.spender] || 0) + 1; } });
const all = [...new Set([...Object.keys(atkSp), ...Object.keys(legSp)])];
const info = {};
await pool(all, 6, async s => { const [c, n] = await Promise.all([rpc(ETH, "eth_getCode", [s, "latest"]), rpc(ETH, "eth_getTransactionCount", [s, "latest"])]); info[s] = { eoa: !c || c === "0x", nonce: parseInt(n, 16) }; });
const eoaA = Object.keys(atkSp).filter(s => info[s].eoa), eoaL = Object.keys(legSp).filter(s => info[s].eoa);
const q = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
const na = eoaA.map(s => info[s].nonce), nl = eoaL.map(s => info[s].nonce);
console.log("spenders EOA — attaques:", eoaA.length, "légitimes:", eoaL.length);
console.log("nonce attaques  p10/p50/p90:", q(na, .1), q(na, .5), q(na, .9));
console.log("nonce légitimes p10/p50/p90:", q(nl, .1), q(nl, .5), q(nl, .9));
// Dev/test par spender (partition aléatoire fixée) : seuil choisi sur DEV, évalué sur TEST
const r2 = mulberry32(7); const part = s => (r2() < 0.5 ? "dev" : "test");
const side = {}; for (const s of all) side[s] = part(s);
const best = { t: null, score: -1 };
for (const t of [1, 2, 5, 10, 20, 50, 100, 500, 1000, 5000]) {
  const dA = eoaA.filter(s => side[s] === "dev"), dL = eoaL.filter(s => side[s] === "dev");
  const tpr = dA.filter(s => info[s].nonce <= t).length / Math.max(1, dA.length), fpr = dL.filter(s => info[s].nonce <= t).length / Math.max(1, dL.length);
  const j = tpr - fpr; if (j > best.score) { best.score = j; best.t = t; }
}
const tA = eoaA.filter(s => side[s] === "test"), tL = eoaL.filter(s => side[s] === "test");
const kA = tA.filter(s => info[s].nonce <= best.t).length, kL = tL.filter(s => info[s].nonce <= best.t).length;
const res = { seuil_choisi_sur_DEV_nonce_max: best.t, TEST: { attaques_EOA: tA.length, detectees: kA, rappel_spender_pct: +(100 * kA / tA.length).toFixed(1), wilson95: wilson(kA, tA.length).map(x => +(100 * x).toFixed(1)), legit_EOA: tL.length, faux_positifs: kL, fpr_spender_pct: +(100 * kL / Math.max(1, tL.length)).toFixed(1) } };
console.log(JSON.stringify(res, null, 1));
fs.writeFileSync("data/result_nonce_devtest.json", JSON.stringify({ q_attaques: [q(na,.1),q(na,.5),q(na,.9)], q_legit: [q(nl,.1),q(nl,.5),q(nl,.9)], ...res }, null, 1));
// concentration des attaques
const tot = rows.length, top = Object.entries(atkSp).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[1]);
console.log("part des 5 premiers spenders dans les tx d'attaque:", (100 * top.reduce((a, b) => a + b, 0) / tot).toFixed(1) + "%", "spenders distincts:", Object.keys(atkSp).length);

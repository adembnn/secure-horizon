import fs from "node:fs";
import { wilson } from "./lib.mjs";
const rows = fs.readFileSync("data/indices_spenders.jsonl", "utf8").trim().split("\n").map(l => JSON.parse(l));
const test = rows.filter(r => r.split === "test"), dev = rows.filter(r => r.split === "dev");
const q = (a, p) => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
for (const [nm, set] of [["attaque", rows.filter(r => r.label === 1)], ["légitime", rows.filter(r => r.label === 0)]])
  console.log(nm, "n=", set.length, "approbateurs p10/p50/p90:", q(set.map(r => r.distinct_approvers_50k_blocks), .1), q(set.map(r => r.distinct_approvers_50k_blocks), .5), q(set.map(r => r.distinct_approvers_50k_blocks), .9), "| contrat:", (100 * set.filter(r => r.is_contract).length / set.length).toFixed(0) + "%", "| nonce p50:", q(set.map(r => r.nonce), .5), "| approbateurs inconnus:", set.filter(r => r.distinct_approvers_50k_blocks == null).length);
function op(name, f, S) { const P = S.filter(r => r.label === 1), N = S.filter(r => r.label === 0); const tp = P.filter(f).length, fp = N.filter(f).length; console.log(name.padEnd(46), "rappel", (100 * tp / P.length).toFixed(1) + "% [" + wilson(tp, P.length).map(x => (100 * x).toFixed(0)).join("-") + "]", "FP spender", (100 * fp / N.length).toFixed(1) + "% [" + wilson(fp, N.length).map(x => (100 * x).toFixed(0)).join("-") + "]", `(${tp}/${P.length}, ${fp}/${N.length})`); }
console.log("--- TEST (seuils fixés a priori, aucun réglage) ---");
op("R3 compte externe", r => !r.is_contract, test);
op("approbateurs distincts <= 1 (spender inconnu)", r => (r.distinct_approvers_50k_blocks ?? 0) <= 1, test);
op("approbateurs <= 2", r => (r.distinct_approvers_50k_blocks ?? 0) <= 2, test);
op("approbateurs <= 1 ET compte externe", r => (r.distinct_approvers_50k_blocks ?? 0) <= 1 && !r.is_contract, test);
op("approbateurs <= 1 ET contrat", r => (r.distinct_approvers_50k_blocks ?? 0) <= 1 && r.is_contract, test);
console.log("--- DEV (pour mémoire) ---");
op("approbateurs distincts <= 1", r => (r.distinct_approvers_50k_blocks ?? 0) <= 1, dev);
// parmi les spenders CONTRATS seulement : le signal tient-il sans R3 ?
const tc = rows.filter(r => r.is_contract);
console.log("--- Contrats seulement (tout le jeu) : attaque", tc.filter(r => r.label === 1).length, "légitime", tc.filter(r => r.label === 0).length);
op("contrat ET approbateurs <= 1", r => (r.distinct_approvers_50k_blocks ?? 0) <= 1, tc);

// Références à battre par Clef : règle R3 et régression logistique entraînée sur DEV, évaluées sur TEST (séparation par spender).
import fs from "node:fs";
import { report } from "./metrics.mjs";
const rows = fs.readFileSync("data/indices_spenders.jsonl", "utf8").trim().split("\n").map(l => JSON.parse(l));
const lg = x => Math.log10(1 + Math.max(0, x));
const feat = r => [1, r.is_contract ? 1 : 0, lg(r.nonce), lg(r.balance_eth * 1000), lg(r.code_size), lg(r.distinct_approvers_50k_blocks ?? 0), r.distinct_approvers_50k_blocks == null ? 1 : 0];
const sig = z => 1 / (1 + Math.exp(-z));
const dev = rows.filter(r => r.split === "dev"), test = rows.filter(r => r.split === "test");
// normalisation sur DEV
const d = feat(dev[0]).length, mu = Array(d).fill(0), sd = Array(d).fill(1);
for (let j = 1; j < d; j++) { mu[j] = dev.reduce((a, r) => a + feat(r)[j], 0) / dev.length; sd[j] = Math.sqrt(dev.reduce((a, r) => a + (feat(r)[j] - mu[j]) ** 2, 0) / dev.length) || 1; }
const nz = r => feat(r).map((v, j) => j === 0 ? 1 : (v - mu[j]) / sd[j]);
let w = Array(d).fill(0); const pw = dev.filter(r => r.label === 1).length, nw = dev.length - pw; // pondération des classes
for (let it = 0; it < 3000; it++) { const g = Array(d).fill(0); for (const r of dev) { const x = nz(r), p = sig(x.reduce((a, v, j) => a + v * w[j], 0)), sw = r.label === 1 ? dev.length / (2 * pw) : dev.length / (2 * nw); for (let j = 0; j < d; j++) g[j] += sw * (p - r.label) * x[j]; } for (let j = 0; j < d; j++) w[j] -= 0.05 * (g[j] / dev.length + 0.001 * w[j]); }
const names = ["biais", "est_contrat", "log_nonce", "log_solde", "log_taille_code", "log_approbateurs", "approbateurs_inconnus"];
const score = r => nz(r).reduce((a, v, j) => a + v * w[j], 0);
const out = {
  note: "Jeu déséquilibré artificiellement (170 attaques / 499 légitimes). Les FPR sont mesurés au niveau du SPENDER, pas de la transaction. Étiquettes ScamSniffer : biais contre les drainers neufs. Légitime présumé.",
  n: { dev: dev.length, test: test.length, test_attaque: test.filter(r => r.label === 1).length },
  poids_regression: Object.fromEntries(names.map((n, j) => [n, +w[j].toFixed(3)])),
  R3_compte_externe: report("R3", test.map(r => ({ label: r.label, score: r.is_contract ? 0 : 1 }))),
  regression_logistique: report("regression_logistique_dev_vers_test", test.map(r => ({ label: r.label, score: score(r) }))),
};
fs.writeFileSync("data/result_baselines_spenders.json", JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1));

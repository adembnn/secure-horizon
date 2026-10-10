// Signal demandé par Adem : âge du contrat spender À LA DATE de l'approbation (seuil fixé a priori : 7 jours = 50 400 blocs Ethereum).
import fs from "node:fs";
import { rpc, wilson, pool, mulberry32 } from "./lib.mjs";
import { decode } from "./core.mjs";
const URL = "https://eth.drpc.org";
const SEUIL = 50400;
const hasCode = async (a, b) => { const c = await rpc(URL, "eth_getCode", [a, "0x" + b.toString(16)], 4); return !!c && c !== "0x"; };
async function creationBlock(a, hi) { // plus petit bloc où getCode non vide, borné par hi (bloc d'usage)
  if (!(await hasCode(a, hi))) return null; // pas encore contrat à la date : cas anormal
  let lo = 0, h = hi; while (lo < h) { const m = Math.floor((lo + h) / 2); if (await hasCode(a, m)) h = m; else lo = m + 1; } return lo;
}
// attaques : (spender, bloc) distincts
const atk = JSON.parse(fs.readFileSync("data/attack_approval_logs.json", "utf8"));
// légitime : mêmes 200 blocs, mêmes règles
const head = parseInt(await rpc(URL, "eth_blockNumber", []), 16), pin = head - 1000, lo0 = 20_000_000;
const rnd = mulberry32(20261011); const blocks = Array.from({ length: 200 }, () => lo0 + Math.floor(rnd() * (pin - lo0)));
let legit = []; let n_tx_legit = 0;
await pool(blocks, 3, async b => { const blk = await rpc(URL, "eth_getBlockByNumber", ["0x" + b.toString(16), true]); n_tx_legit += blk.transactions.length; for (const t of blk.transactions) { const e = decode(t); if (e.spender && e.kind !== "transferFrom") legit.push({ spender: e.spender, block: b, kind: e.kind, hash: t.hash }); } });
const isC = {}; const allSp = [...new Set([...atk.map(r => r.spender), ...legit.map(r => r.spender)])];
await pool(allSp, 4, async s => { isC[s] = await hasCode(s, head); });
// création : un calcul par spender contrat, borné par son premier usage observé
const firstUse = {}; for (const r of [...atk, ...legit]) firstUse[r.spender] = Math.min(firstUse[r.spender] ?? Infinity, r.block);
const cb = {}; const conts = allSp.filter(s => isC[s]);
let k = 0; await pool(conts, 3, async s => { cb[s] = await creationBlock(s, firstUse[s]).catch(() => undefined); if (++k % 25 === 0) process.stderr.write(k + "/" + conts.length + "\n"); });
const age = r => (isC[r.spender] && cb[r.spender] != null && cb[r.spender] !== undefined) ? r.block - cb[r.spender] : null;
const atkC = atk.filter(r => isC[r.spender]), legC = legit.filter(r => isC[r.spender]);
const young = r => { const a = age(r); return a !== null && a < SEUIL; };
const q = (arr, p) => { const a = arr.filter(x => x !== null).sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : null; };
const atkAges = atkC.map(age), legAges = legC.map(age);
const kA = atkC.filter(young).length, kL = legC.filter(young).length;
const spA = [...new Set(atkC.map(r => r.spender))], spYoungA = spA.filter(s => atkC.some(r => r.spender === s && young(r))).length;
const out = {
  seuil_blocs: SEUIL, regle: "droit donné à un contrat créé depuis moins de 7 jours (à la date de l'approbation)",
  attaques: { tx_vers_contrat: atkC.length, spenders_contrat: spA.length, tx_jeunes: kA, pct_tx_jeunes_parmi_contrats: +(100 * kA / atkC.length).toFixed(1), wilson95: wilson(kA, atkC.length).map(x => +(100 * x).toFixed(1)), spenders_jeunes: spYoungA, age_blocs_p10_p50_p90: [q(atkAges, .1), q(atkAges, .5), q(atkAges, .9)] },
  legitime: { n_tx_total: n_tx_legit, droits_vers_contrat: legC.length, tx_jeunes: kL, fp_pct_du_trafic_total: +(100 * kL / n_tx_legit).toFixed(4), wilson95_pct: wilson(kL, n_tx_legit).map(x => +(100 * x).toFixed(4)), pct_des_droits_vers_contrat: +(100 * kL / Math.max(1, legC.length)).toFixed(2), age_blocs_p10_p50_p90: [q(legAges, .1), q(legAges, .5), q(legAges, .9)] },
  creation_non_resolue: conts.filter(s => cb[s] == null).length,
};
// rappel total (EOA OU contrat jeune) sur toutes les tx d'attaque approve
const atkAll = atk.length, kEOA = atk.filter(r => !isC[r.spender]).length;
out.combine_EOA_ou_contrat_jeune = { rappel_pct_tx: +(100 * (kEOA + kA) / atkAll).toFixed(1), fp_pct_du_trafic: +(100 * (legit.filter(r => !isC[r.spender]).length + kL) / n_tx_legit).toFixed(3) };
fs.writeFileSync("data/result_age_contrat.json", JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1));

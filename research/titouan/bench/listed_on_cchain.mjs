// Les adresses de la liste ScamSniffer (même adresse sur toutes les chaînes EVM) ont-elles une activité sur la C-Chain ? (nonce = nombre de tx envoyées, code = contrat)
import fs from "node:fs";
import { RPC, rpc, pool } from "./lib.mjs";
const bl = JSON.parse(fs.readFileSync("data/address.json", "utf8")).map(a => a.toLowerCase());
const eth = "https://eth.drpc.org";
let done = 0; const rows = [];
await pool(bl, 6, async a => {
  try { const [n, c, b] = await Promise.all([rpc(RPC.cchain, "eth_getTransactionCount", [a, "latest"], 3), rpc(RPC.cchain, "eth_getCode", [a, "latest"], 3), rpc(RPC.cchain, "eth_getBalance", [a, "latest"], 3)]);
    rows.push({ a, nonce: parseInt(n, 16), contract: c !== "0x", bal: Number(BigInt(b) / 10n ** 14n) / 1e4 }); } catch { rows.push({ a, err: 1 }); }
  if (++done % 500 === 0) process.stderr.write(done + "/" + bl.length + "\n"); });
const ok = rows.filter(r => !r.err);
const out = { n_adresses: bl.length, interrogees: ok.length, avec_activite_sortante_cchain: ok.filter(r => r.nonce > 0).length, contrats_cchain: ok.filter(r => r.contract).length, avec_solde_AVAX_non_nul: ok.filter(r => r.bal > 0).length, nonce_p50_parmi_actives: (() => { const s = ok.filter(r => r.nonce > 0).map(r => r.nonce).sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? null; })() };
fs.writeFileSync("data/result_listed_on_cchain.json", JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1));

// Agrège les approbations ERC-20 par spender (lecture seule). Usage: node analyse.mjs <eth|avax>
import fs from "node:fs";
import { rpc, wilson, pool } from "../../bench/lib.mjs";
const chain = process.argv[2];
const meta = JSON.parse(fs.readFileSync(`cache/${chain}.meta.json`));
const URL = meta.rpc;
const rows = fs.readFileSync(`cache/${chain}.approvals.jsonl`, "utf8").split("\n").filter(Boolean).map(JSON.parse);
const T255 = 1n << 255n;
let total = 0, zero = 0, n721 = 0, ev = [];
for (const r of rows) { n721 += r.n721; for (const e of r.ev) { total++; const v = BigInt(e.v === "0x" ? "0x0" : e.v); if (v === 0n) { zero++; continue; } ev.push({ ...e, v }); } }
const by = new Map(); for (const e of ev) { (by.get(e.s) || by.set(e.s, []).get(e.s)).push(e); }
const top = [...by.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 25);
// offre totale des jetons concernés (état actuel)
const tokens = [...new Set(top.flatMap(([, l]) => l.map(e => e.t)))];
const supF = `cache/${chain}.supply.json`;
const supply = {}; const sc = fs.existsSync(supF) ? JSON.parse(fs.readFileSync(supF)) : {};
await pool(tokens, 3, async t => { if (t in sc) { supply[t] = sc[t] === null ? null : BigInt(sc[t]); return; } try { const r = await rpc(URL, "eth_call", [{ to: t, data: "0x18160ddd" }, "latest"]); supply[t] = r && r.length >= 3 ? BigInt(r) : null; } catch { supply[t] = null; } });
fs.writeFileSync(supF, JSON.stringify(Object.fromEntries(Object.entries(supply).map(([k,v])=>[k,v===null?null:v.toString()]))));
const code = {};
await pool(top.map(x => x[0]), 3, async s => { const c = await rpc(URL, "eth_getCode", [s, "latest"]); code[s] = c && c !== "0x" ? (c.length - 2) / 2 : 0; });
const isUnl = e => e.v >= T255 || (supply[e.t] != null && supply[e.t] > 0n && e.v >= supply[e.t]);
const med = a => { a.sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null; };
const all_unl = ev.filter(isUnl).length;
const out = { chain, meta, evenements_erc20_total: total, valeurs_nulles: zero, erc721_ignores: n721, droits_non_nuls: ev.length,
  illimites_tous: all_unl, part_illimitee_tous: all_unl / ev.length, wilson_tous: wilson(all_unl, ev.length),
  spenders_distincts: by.size, jetons_distincts_top25: tokens.length, top: [] };
let top_n = 0;
for (const [s, l] of top) {
  const u = l.filter(isUnl).length, b = l.filter(e => !isUnl(e));
  const rel = b.filter(e => supply[e.t] > 0n && supply[e.t] != null).map(e => Number(e.v) / Number(supply[e.t]));
  top_n += l.length;
  out.top.push({ spender: s, n: l.length, illimites: u, pct: u / l.length, wilson: wilson(u, l.length), mediane_borne_rel_offre: med(rel), n_borne_avec_offre: rel.length,
    proprietaires_distincts: new Set(l.map(e => e.o)).size, jetons_distincts: new Set(l.map(e => e.t)).size, code_octets: code[s] });
}
out.n_top25 = top_n; out.part_top25 = top_n / ev.length;
fs.writeFileSync(`result_${chain}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ ...out, top: undefined, meta: undefined }));
for (const t of out.top) console.log(t.spender, t.n, (t.pct * 100).toFixed(1) + "%", t.wilson.map(x => (x * 100).toFixed(1)).join("-"), t.mediane_borne_rel_offre, t.proprietaires_distincts, t.jetons_distincts, t.code_octets);

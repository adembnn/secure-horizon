import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const f = join(dirname(fileURLToPath(import.meta.url)), "fraudes_ambigus.jsonl");
const rows = readFileSync(f, "utf8").trim().split("\n").map((l) => JSON.parse(l));
const err = [];
const ids = new Set();
let F = 0, A = 0, withData = 0;
const req = ["id","synthetic","notice","family","subfamily","request","context","intent","label","reason","expected_severity","ideal_severity","required_signals","blind_to_v3_contract","catalog_category","source","hard","approximation","scenario","lang","split","split_reason"];
const ADDR = /^0x[0-9a-fA-F]{40}$/;
for (const r of rows) {
  for (const k of req) if (!(k in r)) err.push(`${r.id}: missing ${k}`);
  if (ids.has(r.id)) err.push(`${r.id}: duplicate`);
  ids.add(r.id);
  if (r.synthetic !== true || r.split !== "BLIND") err.push(`${r.id}: synthetic/split`);
  if (!["warn", "ok", "critical"].includes(r.expected_severity)) err.push(`${r.id}: severity`);
  if (!["fr", "en"].includes(r.lang)) err.push(`${r.id}: lang`);
  if (!ADDR.test(r.context.victim)) err.push(`${r.id}: victim addr`);
  if (!r.intent.declaredAt || !r.intent.kind) err.push(`${r.id}: intent`);
  const p = r.request.params[0];
  if (r.request.method === "eth_sendTransaction") {
    if (!ADDR.test(p.to) || !/^0x([0-9a-f]{2})*$/i.test(p.data)) err.push(`${r.id}: tx shape`);
    if (p.data.length > 2) withData++;
    if (!["0xa86a", "0xa869"].includes(p.chainId)) err.push(`${r.id}: chainId`);
  }
  if (r.label === "fraude_conforme") {
    F++;
    if (!/^BLIND-F-\d{3}$/.test(r.id) || r.ideal_severity !== "critical" || r.blind_to_v3_contract !== true) err.push(`${r.id}: fraud fields`);
    if (r.request.method !== "eth_sendTransaction") err.push(`${r.id}: fraud must be tx`);
  } else if (r.label === "ambigu") {
    A++;
    if (!/^BLIND-A-\d{3}$/.test(r.id) || r.expected_severity !== "warn") err.push(`${r.id}: amb fields`);
  } else err.push(`${r.id}: label`);
}
if (F !== 25) err.push(`F=${F} != 25`);
if (A !== 15) err.push(`A=${A} != 15`);
console.log(err.length ? "FAIL\n" + err.join("\n") : `OK: ${rows.length} cases (F=${F}, A=${A}), ${withData} txs with encoded calldata`);
process.exit(err.length ? 1 : 0);

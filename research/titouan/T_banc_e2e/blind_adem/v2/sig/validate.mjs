// Validator for V2-SIG cases. Usage: node validate.mjs  (exit 1 on any error)
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const E = await import(pathToFileURL("C:\\Users\\Adem\\Secure Horizon\\blockchain\\node_modules\\ethers\\lib.esm\\index.js").href);
const { TypedDataEncoder, getAddress, isHexString, Transaction } = E;
const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "cases.jsonl");

const errors = [];
const err = (id, m) => { if (errors.length < 50) errors.push(`${id}: ${m}`); else errors.length++; };
const sha = (s) => createHash("sha256").update(s).digest("hex");

const before = sha(readFileSync(FILE));
const lines = readFileSync(FILE, "utf8").trim().split("\n");
const REQUIRED = ["id", "synthetic", "notice", "family", "subfamily", "request", "context", "intent", "label", "reason", "expected_severity", "ideal_severity", "required_signals", "blind_to_v3_contract", "catalog_category", "source", "hard", "approximation", "scenario", "lang", "split", "split_reason"];
const KINDS = new Set(["pay_someone", "send_to_my_account", "buy_or_swap", "connect_or_accept_offer", "asked_by_someone"]);
const ids = new Set(), reqs = new Set();
const stats = { total: 0, typed: 0, eth_sign: 0, personal_sign: 0, DEV: 0, TEST: 0, vicious: 0 };

for (const [i, line] of lines.entries()) {
  let c;
  try { c = JSON.parse(line); } catch (e) { err(`line ${i + 1}`, "invalid JSON"); continue; }
  stats.total++;
  const id = c.id || `line ${i + 1}`;
  for (const k of REQUIRED) if (!(k in c)) err(id, `missing field ${k}`);
  if (!/^V2-SIG-\d{5}$/.test(c.id)) err(id, "bad id format");
  if (ids.has(c.id)) err(id, "duplicate id"); ids.add(c.id);
  if (c.synthetic !== true) err(id, "synthetic != true");
  if (c.label !== "malveillant") err(id, "label != malveillant");
  if (c.expected_severity !== "critical" || c.ideal_severity !== "critical") err(id, "severity != critical");
  if (!c.reason || !c.source) err(id, "empty reason/source");
  if (!Array.isArray(c.required_signals) || !c.required_signals.length) err(id, "no required_signals");
  const split = BigInt("0x" + sha(c.id)) % 10n < 3n ? "TEST" : "DEV";
  if (c.split !== split) err(id, `split ${c.split} != ${split}`);
  stats[c.split]++;
  if (c.vicious_variants?.length) stats.vicious++;
  if (![1, 43113, 43114].includes(c.context?.chainId)) err(id, "context.chainId");
  try { getAddress(c.context.victim); } catch { err(id, "bad victim address"); }
  if (c.intent !== null) {
    if (!KINDS.has(c.intent.kind)) err(id, "bad intent.kind");
    if (typeof c.intent.declaredAt !== "number") err(id, "intent.declaredAt");
    if (c.intent.kind === "asked_by_someone" && !c.intent.askedBy) err(id, "askedBy missing");
  }
  const key = JSON.stringify(c.request);
  if (reqs.has(key)) err(id, "duplicate request"); reqs.add(key);
  const { method, params } = c.request || {};
  if (method === "eth_signTypedData_v4") {
    stats.typed++;
    try {
      getAddress(params[0]);
      const td = JSON.parse(params[1]);
      const types = { ...td.types }; delete types.EIP712Domain;
      // domain type list must match domain keys
      const dk = (td.types.EIP712Domain || []).map((x) => x.name).sort().join(",");
      if (dk !== Object.keys(td.domain).sort().join(",")) err(id, "EIP712Domain fields != domain keys");
      const enc = TypedDataEncoder.from(types);
      if (enc.primaryType !== td.primaryType) err(id, `primaryType ${td.primaryType} != inferred ${enc.primaryType}`);
      TypedDataEncoder.hash(td.domain, types, td.message);
      if (!c.subfamily.startsWith("domain_mismatch") && c.subfamily !== "blur_order" && Number(td.domain.chainId) !== c.context.chainId) err(id, "domain.chainId != context.chainId outside mismatch family");
    } catch (e) { err(id, "typed data not hashable: " + e.message.slice(0, 120)); }
  } else if (method === "eth_sign") {
    stats.eth_sign++;
    if (!isHexString(params[1], 32)) err(id, "eth_sign param not 32-byte hex");
  } else if (method === "personal_sign") {
    stats.personal_sign++;
    if (!isHexString(params[0]) || params[0].length < 66) err(id, "personal_sign payload not hex");
    if (params[0].startsWith("0x02") && c.hidden_payload?.kind === "unsigned_tx") { try { Transaction.from(params[0]); } catch { err(id, "unsigned tx not decodable"); } }
  } else err(id, "unexpected method " + method);
}

// reproducibility: regenerate and compare byte-for-byte
execFileSync(process.execPath, [join(HERE, "gen.mjs")], { stdio: "ignore" });
const after = sha(readFileSync(FILE));
if (before !== after) errors.push("gen.mjs not reproducible (cases.jsonl changed after regeneration)");

console.log(JSON.stringify(stats));
console.log("sha256(cases.jsonl) =", after);
if (errors.length) { console.log(`${errors.length} error(s):\n` + errors.slice(0, 50).join("\n")); process.exit(1); }
console.log("OK: all checks passed");

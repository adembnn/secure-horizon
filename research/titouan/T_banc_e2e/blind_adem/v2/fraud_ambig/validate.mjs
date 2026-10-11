// Validates cases.jsonl (family fraud_ambig). Usage: node validate.mjs  -> exit 1 on any error.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const ETHERS = "C:\\Users\\Adem\\Secure Horizon\\blockchain\\node_modules\\ethers\\lib.esm\\index.js";
const { TypedDataEncoder, isAddress, Interface } = await import(pathToFileURL(ETHERS).href);
const HERE = dirname(fileURLToPath(import.meta.url));

const REQUIRED = ["id", "synthetic", "notice", "family", "subfamily", "request", "context", "intent", "label", "reason", "expected_severity", "ideal_severity", "required_signals", "blind_to_v3_contract", "catalog_category", "source", "hard", "approximation", "scenario", "lang", "split", "split_reason"];
const KINDS = ["pay_someone", "send_to_my_account", "buy_or_swap", "connect_or_accept_offer", "asked_by_someone"];
const SEV = ["ok", "warn", "critical"];
const HEX = /^0x([0-9a-fA-F]{2})*$/;
const QTY = /^0x[0-9a-fA-F]+$/;
const ERC20 = new Interface(["function transfer(address to, uint256 amount)", "function approve(address spender, uint256 amount)"]);

const errors = [];
const err = (id, m) => errors.push(`${id}: ${m}`);
const lines = readFileSync(join(HERE, "cases.jsonl"), "utf8").split("\n").filter((l) => l.trim());
const ids = new Set(), reqs = new Set();
let typedCount = 0, calldataCount = 0;

function checkTx(id, tx) {
  if (!isAddress(tx.from) || !isAddress(tx.to)) err(id, "bad from/to address");
  if (!QTY.test(tx.value ?? "")) err(id, "value not hex quantity");
  if (!HEX.test(tx.data ?? "")) err(id, "data not hex");
  if (tx.data && tx.data !== "0x") {
    calldataCount++;
    const sel = tx.data.slice(0, 10);
    if ((sel === "0xa9059cbb" || sel === "0x095ea7b3")) { try { ERC20.parseTransaction({ data: tx.data }); } catch { err(id, "ERC20 calldata does not decode"); } }
  }
}

lines.forEach((line, i) => {
  let c;
  try { c = JSON.parse(line); } catch { errors.push(`line ${i + 1}: invalid JSON`); return; }
  const id = c.id ?? `line ${i + 1}`;
  for (const f of REQUIRED) if (!(f in c)) err(id, `missing field ${f}`);
  if (!/^V2-FRAUDAMBIG-\d{5}$/.test(c.id)) err(id, "bad id format");
  if (ids.has(c.id)) err(id, "duplicate id"); ids.add(c.id);
  if (c.synthetic !== true) err(id, "synthetic must be true");
  const h = BigInt("0x" + createHash("sha256").update(c.id).digest("hex"));
  if (c.split !== (h % 10n < 3n ? "TEST" : "DEV")) err(id, "split does not match sha256(id) mod 10 rule");
  if (!c.reason || !c.source) err(id, "empty reason/source");
  if (!SEV.includes(c.expected_severity) || !SEV.includes(c.ideal_severity)) err(id, "bad severity");
  if (c.label === "fraude_conforme") {
    if (c.ideal_severity !== "critical" || c.blind_to_v3_contract !== true) err(id, "fraude_conforme needs ideal critical + blind true");
  } else if (c.label === "ambigu") {
    if (c.expected_severity !== "warn") err(id, "ambigu needs expected warn");
  } else err(id, `unexpected label ${c.label}`);
  if (![1, 43113, 43114].includes(c.context?.chainId)) err(id, "bad chainId");
  if (!["fr", "en"].includes(c.lang)) err(id, "bad lang");
  // intent
  const it = c.intent || {};
  if (!KINDS.includes(it.kind)) err(id, "bad intent.kind");
  if (typeof it.declaredAt !== "number") err(id, "intent.declaredAt missing");
  if (it.kind === "asked_by_someone" && !it.askedBy) err(id, "askedBy missing");
  if (it.counterpartyAddress && !isAddress(it.counterpartyAddress)) err(id, "bad counterpartyAddress");
  // request
  const r = c.request || {};
  const key = JSON.stringify(r);
  if (reqs.has(key)) err(id, "exact duplicate request"); reqs.add(key);
  if (r.method === "eth_sendTransaction") checkTx(id, r.params?.[0] || {});
  else if (r.method === "wallet_sendCalls") {
    const p = r.params?.[0] || {};
    if (!isAddress(p.from) || !Array.isArray(p.calls) || !p.calls.length) err(id, "bad wallet_sendCalls");
    for (const call of p.calls || []) checkTx(id, { from: p.from, ...call });
  } else if (r.method === "eth_signTypedData_v4") {
    try {
      const td = JSON.parse(r.params[1]);
      const types = { ...td.types }; delete types.EIP712Domain;
      const hsh = TypedDataEncoder.hash(td.domain, types, td.message);
      if (!/^0x[0-9a-f]{64}$/.test(hsh)) throw new Error("hash");
      if (td.domain.chainId !== c.context.chainId) err(id, "typed data chainId mismatch");
      typedCount++;
    } catch (e) { err(id, `typed data not hashable: ${e.message}`); }
  } else err(id, `unexpected method ${r.method}`);
  // light secret / PII guard
  if (/(PRIVATE KEY|mnemonic|seed phrase:|[0-9a-f]{64}(?![0-9a-f]))/i.test(JSON.stringify(c.intent))) err(id, "possible secret-like string in intent");
});

const by = {};
for (const l of lines) { const c = JSON.parse(l); const k = `${c.label}/${c.subfamily}`; by[k] ??= { DEV: 0, TEST: 0 }; by[k][c.split]++; }
console.table(by);
console.log(`cases=${lines.length} calldata=${calldataCount} typed=${typedCount} errors=${errors.length}`);
if (errors.length) { console.log(errors.slice(0, 30).join("\n")); process.exit(1); }
console.log("OK");

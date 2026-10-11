// Validates cases.jsonl: JSON, required fields, unique ids, hex calldata, hashable typed data,
// decodable calldata, SIWE domain == origin, no exact duplicate request, split rule, benign constraints.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as E from "file:///C:/Users/Adem/Secure%20Horizon/blockchain/node_modules/ethers/lib.esm/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const lines = readFileSync(join(HERE, "cases.jsonl"), "utf8").split("\n").filter(Boolean);
const REQUIRED = ["id", "synthetic", "notice", "family", "subfamily", "request", "context", "intent", "label", "reason", "expected_severity", "ideal_severity", "required_signals", "blind_to_v3_contract", "catalog_category", "source", "hard", "approximation", "lang", "split", "split_reason"];
const KINDS = new Set(["pay_someone", "send_to_my_account", "buy_or_swap", "connect_or_accept_offer", "asked_by_someone"]);
const METHODS = new Set(["eth_sendTransaction", "eth_signTypedData_v4", "personal_sign", "wallet_switchEthereumChain", "wallet_addEthereumChain", "wallet_sendCalls"]);
const KNOWN_SELECTORS = new Set(["0xa9059cbb", "0x095ea7b3", "0xa22cb465", "0xc73a2d60", "0xfb0f3ee1", "0x00000000"]);
const HEX = /^0x[0-9a-fA-F]*$/;
const errors = []; const ids = new Set(); const reqs = new Set();
const err = (id, m) => errors.push(`${id}: ${m}`);
const reqKey = (r, ctx) => { const k = JSON.stringify(r); return /^wallet_(switch|add)EthereumChain$/.test(r.method) ? k + "|" + ctx.origin + "|" + ctx.victim.address : k; };
let hard = 0;

for (const [i, line] of lines.entries()) {
  let c; try { c = JSON.parse(line); } catch (e) { errors.push(`line ${i + 1}: invalid JSON`); continue; }
  const id = c.id ?? `line ${i + 1}`;
  for (const f of REQUIRED) if (!(f in c)) err(id, `missing ${f}`);
  if (!/^V2-BENIGN_EVERYDAY-\d{5}$/.test(c.id)) err(id, "bad id format");
  if (ids.has(c.id)) err(id, "duplicate id"); ids.add(c.id);
  if (c.synthetic !== true) err(id, "synthetic must be true");
  if (c.label !== "benin") err(id, "label must be benin");
  if (!["ok", "warn"].includes(c.expected_severity)) err(id, "benign severity must be ok|warn");
  if (c.expected_severity === "warn" && !c.hard) err(id, "warn on benign requires hard");
  if (!c.severity_justification) err(id, "missing severity_justification");
  if (!c.reason || !c.source) err(id, "empty reason/source");
  if (!KINDS.has(c.intent?.kind)) err(id, "bad intent.kind");
  if (typeof c.intent?.declaredAt !== "number") err(id, "intent.declaredAt");
  const h = createHash("sha256").update(c.id).digest("hex"); const want = Number(BigInt("0x" + h) % 10n) < 3 ? "TEST" : "DEV";
  if (c.split !== want) err(id, `split should be ${want}`);
  const r = c.request;
  if (!METHODS.has(r?.method) || !Array.isArray(r.params)) { err(id, "bad request"); continue; }
  const k = reqKey(r, c.context); if (reqs.has(k)) err(id, "duplicate request"); reqs.add(k);
  try {
    if (r.method === "eth_sendTransaction") {
      const tx = r.params[0];
      for (const f of ["from", "to", "value", "data"]) if (!HEX.test(tx[f] ?? "")) err(id, `tx.${f} not hex`);
      E.getAddress(tx.to); E.getAddress(tx.from);
      if (tx.data !== "0x" && (tx.data.length - 2) % 2 !== 0) err(id, "odd-length calldata");
      if (tx.data !== "0x" && !KNOWN_SELECTORS.has(tx.data.slice(0, 10))) err(id, `unknown selector ${tx.data.slice(0, 10)}`);
    } else if (r.method === "wallet_sendCalls") {
      for (const call of r.params[0].calls) { E.getAddress(call.to); if (!HEX.test(call.data)) err(id, "call data not hex"); if (!KNOWN_SELECTORS.has(call.data.slice(0, 10))) err(id, "unknown selector in batch"); }
    } else if (r.method === "eth_signTypedData_v4") {
      const td = JSON.parse(r.params[1]); const types = { ...td.types }; delete types.EIP712Domain;
      E.TypedDataEncoder.hash(td.domain, types, td.message);
      if (E.getAddress(r.params[0]) !== E.getAddress(c.context.victim.address)) err(id, "typed data signer != victim");
    } else if (r.method === "personal_sign") {
      const msg = E.toUtf8String(r.params[0]);
      if (c.subfamily === "siwe_login_domain_match") {
        const dom = msg.split(" wants you to sign in")[0];
        if (`https://${dom}` !== c.context.origin) err(id, "SIWE domain != origin");
        if (!msg.includes(c.context.victim.address)) err(id, "SIWE address mismatch");
      }
    } else if (r.method === "wallet_switchEthereumChain") {
      if (!HEX.test(r.params[0].chainId)) err(id, "chainId not hex");
    } else if (r.method === "wallet_addEthereumChain") {
      const p = r.params[0]; if (!HEX.test(p.chainId) || !p.rpcUrls?.[0]?.startsWith("https://")) err(id, "bad addEthereumChain params");
    }
  } catch (e) { err(id, `decode/hash failed: ${e.message.slice(0, 120)}`); }
  if (c.hard) hard++;
}
// selector sanity: the efficient Seaport entrypoint really is 0x00000000
const sel = new E.Interface(["function fulfillBasicOrder_efficient_6GL6yc((address,uint256,uint256,address,address,address,uint256,uint256,uint8,uint256,uint256,bytes32,uint256,bytes32,bytes32,uint256,(uint256,address)[],bytes))"]).getFunction("fulfillBasicOrder_efficient_6GL6yc").selector;
if (sel !== "0x00000000") errors.push(`efficient selector is ${sel}, expected 0x00000000`);
const n = lines.length;
if (n < 1000 || n > 1500) errors.push(`count ${n} outside 1000..1500`);
if (hard / n < 0.4) errors.push(`hard ratio ${(hard / n).toFixed(2)} < 0.40`);
console.log(`cases=${n} hard=${hard} (${((100 * hard) / n).toFixed(1)}%) errors=${errors.length}`);
if (errors.length) { console.log(errors.slice(0, 40).join("\n")); process.exit(1); }

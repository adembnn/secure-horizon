// Validates cases.jsonl of the POISON family. Usage: node validate.mjs  (exit 1 on error)
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as E from "file:///C:/Users/Adem/Secure%20Horizon/blockchain/node_modules/ethers/lib.esm/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const lines = readFileSync(join(HERE, "cases.jsonl"), "utf8").split("\n").filter(Boolean);
const REQUIRED = ["id", "synthetic", "notice", "family", "subfamily", "request", "context", "intent", "label", "reason", "expected_severity", "ideal_severity", "required_signals", "blind_to_v3_contract", "catalog_category", "source", "hard", "approximation", "lang", "split", "split_reason"];
const METHODS = new Set(["eth_sendTransaction", "eth_signTypedData_v4", "personal_sign", "eth_sign", "wallet_switchEthereumChain", "wallet_addEthereumChain", "wallet_sendCalls"]);
const KINDS = new Set(["pay_someone", "send_to_my_account", "buy_or_swap", "connect_or_accept_offer", "asked_by_someone"]);
const isHex = (x) => typeof x === "string" && /^0x([0-9a-fA-F]{2})*$/.test(x);
const isQty = (x) => typeof x === "string" && /^0x[0-9a-fA-F]+$/.test(x);
const errs = [];
const ids = new Set(), reqs = new Set();
const bySub = {}, bySplit = {}, byChain = {}, byKind = {};
lines.forEach((ln, i) => {
  const at = `line ${i + 1}`;
  let c; try { c = JSON.parse(ln); } catch (e) { errs.push(`${at}: invalid JSON`); return; }
  for (const f of REQUIRED) if (!(f in c)) errs.push(`${at} ${c.id}: missing ${f}`);
  if (!/^V2-POISON-\d{5}$/.test(c.id)) errs.push(`${at}: bad id ${c.id}`);
  if (ids.has(c.id)) errs.push(`${at}: duplicate id ${c.id}`); ids.add(c.id);
  if (c.synthetic !== true) errs.push(`${c.id}: synthetic != true`);
  if (c.label !== "malveillant" || c.expected_severity !== "critical" || c.ideal_severity !== "critical") errs.push(`${c.id}: label/severity`);
  if (!c.reason || !c.source) errs.push(`${c.id}: empty reason/source`);
  const want = BigInt("0x" + createHash("sha256").update(c.id).digest("hex")) % 10n < 3n ? "TEST" : "DEV";
  if (c.split !== want) errs.push(`${c.id}: split ${c.split} != ${want}`);
  if (!KINDS.has(c.intent?.kind) || typeof c.intent?.declaredAt !== "number") errs.push(`${c.id}: bad intent`);
  if (![43114, 43113, 1].includes(c.context?.chainId)) errs.push(`${c.id}: chainId`);
  const r = c.request;
  if (!METHODS.has(r?.method) || !Array.isArray(r.params)) errs.push(`${c.id}: bad request`);
  const key = JSON.stringify(r); if (reqs.has(key)) errs.push(`${c.id}: duplicate request`); reqs.add(key);
  try {
    if (r.method === "eth_sendTransaction") {
      const tx = r.params[0];
      E.getAddress(tx.from); E.getAddress(tx.to.toLowerCase());
      if (!isHex(tx.data)) errs.push(`${c.id}: calldata not hex`);
      if (tx.data !== "0x" && (tx.data.length - 2) % 64 !== 8) errs.push(`${c.id}: calldata length not selector+words`);
      if (!isQty(tx.value)) errs.push(`${c.id}: value`);
      if (tx.data === "0x" && BigInt(tx.value) === 0n) errs.push(`${c.id}: empty tx`);
    } else if (r.method === "eth_signTypedData_v4") {
      E.getAddress(r.params[0]);
      const td = JSON.parse(r.params[1]);
      const types = { ...td.types }; delete types.EIP712Domain;
      const h = E.TypedDataEncoder.hash(td.domain, types, td.message);
      if (!/^0x[0-9a-f]{64}$/.test(h)) errs.push(`${c.id}: typed hash`);
      if (td.domain.chainId !== c.context.chainId) errs.push(`${c.id}: typed chainId != context`);
    } else if (r.method === "personal_sign") {
      if (!isHex(r.params[0])) errs.push(`${c.id}: personal_sign not hex`);
      const txt = E.toUtf8String(r.params[0]);
      if (!/wants you to sign in with your Ethereum account/.test(txt)) errs.push(`${c.id}: not SIWE`);
      const dom = txt.split(" wants")[0];
      if (dom === c.context.origin.replace("https://", "")) errs.push(`${c.id}: SIWE domain equals origin`);
    } else if (r.method === "wallet_sendCalls") {
      for (const call of r.params[0].calls) { E.getAddress(call.to); if (!isHex(call.data)) errs.push(`${c.id}: sendCalls data`); }
    }
  } catch (e) { errs.push(`${c.id}: ${e.shortMessage || e.message}`); }
  // subfamily-specific checks
  if (c.subfamily.startsWith("addr_poison_")) {
    const f = c.context.counterparty_facts[0];
    const a = f.address.slice(2).toLowerCase(), b = f.lookalikeOf.slice(2).toLowerCase();
    let p = 0; while (a[p] === b[p]) p++;
    let s = 0; while (a[39 - s] === b[39 - s]) s++;
    if (a === b || p < 3 || s < 4 || p !== f.prefix_match || s !== f.suffix_match) errs.push(`${c.id}: USENIX rule broken p=${p} s=${s}`);
    const ent = c.context.history.find((h) => h.counterparty.toLowerCase() === f.address.toLowerCase());
    if (!ent) errs.push(`${c.id}: poison entry missing in history`);
    if (!(f.minutes_after_real_send < 20)) errs.push(`${c.id}: >20 min`);
    if (c.subfamily.endsWith("zero_transferFrom") && ent?.amount !== "0") errs.push(`${c.id}: zero transfer amount`);
  }
  if (c.subfamily === "clipboard_swap" && c.context.clipboard.copied === c.context.clipboard.pasted) errs.push(`${c.id}: clipboard identical`);
  if (c.subfamily === "fake_site_drainer_kit" && !c.context.drainer_kit?.name) errs.push(`${c.id}: kit missing`);
  if (c.subfamily === "forced_chain_switch_then_sign" && !/^wallet_(switch|add)EthereumChain$/.test(c.context.preceding_requests?.[0]?.method)) errs.push(`${c.id}: no preceding switch`);
  if (c.subfamily === "token_sell_tax_99" && c.context.token_info.sell_tax_pct !== 99) errs.push(`${c.id}: tax`);
  if (c.subfamily === "token_fake_usdc_same_symbol" && c.context.token_info.address === c.context.token_registry.USDC.address) errs.push(`${c.id}: fake = real USDC`);
  bySub[c.subfamily] = bySub[c.subfamily] || { DEV: 0, TEST: 0 }; bySub[c.subfamily][c.split]++;
  bySplit[c.split] = (bySplit[c.split] || 0) + 1; byChain[c.context.chainId] = (byChain[c.context.chainId] || 0) + 1; byKind[c.intent.kind] = (byKind[c.intent.kind] || 0) + 1;
});
console.log(JSON.stringify({ cases: lines.length, errors: errs.length, bySplit, byChain, byKind, bySub }, null, 1));
if (errs.length) { console.error(errs.slice(0, 40).join("\n")); process.exit(1); }

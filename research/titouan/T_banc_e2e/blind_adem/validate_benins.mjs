import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
const E = await import(pathToFileURL("C:/Users/Adem/Secure Horizon/blockchain/node_modules/ethers/lib.esm/index.js").href);
const lines = readFileSync("C:/Users/Adem/Secure Horizon/research/titouan/T_banc_e2e/blind_adem/benins.jsonl", "utf8").trim().split("\n");
const errs = []; const fam = {}; const ids = new Set(); let hard = 0;
const req = ["id","synthetic","notice","family","subfamily","request","context","intent","label","reason","expected_severity","ideal_severity","required_signals","catalog_category","source","hard","approximation","lang","split"];
const kinds = ["pay_someone","send_to_my_account","buy_or_swap","connect_or_accept_offer","asked_by_someone"];
const METHODS = ["eth_sendTransaction","eth_signTypedData_v4","personal_sign","eth_sign","wallet_switchEthereumChain","wallet_addEthereumChain","wallet_sendCalls"];
lines.forEach((l, i) => {
  let c; try { c = JSON.parse(l); } catch { errs.push(`ligne ${i+1}: JSON invalide`); return; }
  const e = (m) => errs.push(`${c.id}: ${m}`);
  for (const k of req) if (!(k in c)) e("champ manquant " + k);
  if (!/^BLIND-B-\d{3}$/.test(c.id)) e("id");
  if (ids.has(c.id)) e("id duplique"); ids.add(c.id);
  if (c.synthetic !== true || c.split !== "BLIND" || c.label !== "benin") e("synthetic/split/label");
  if (!["ok","warn"].includes(c.expected_severity)) e("expected_severity");
  if (!c.reason || c.reason.length < 20) e("reason");
  if (!kinds.includes(c.intent?.kind) || typeof c.intent.declaredAt !== "number") e("intent");
  if (![1,43113,43114].includes(c.context?.chainId)) e("chainId");
  if (!METHODS.includes(c.request?.method)) e("method");
  if (c.hard) hard++;
  fam[c.family] = (fam[c.family] || 0) + 1;
  const m = c.request.method, p = c.request.params;
  if (m === "eth_sendTransaction") {
    const t = p[0];
    if (!E.isAddress(t.to) || !E.isAddress(t.from)) e("adresse tx");
    if (!/^0x([0-9a-f]{2})*$/i.test(t.data)) e("calldata hex");
    if (t.data !== "0x" && t.data.length < 10) e("calldata court");
    if (Number(t.chainId) !== c.context.chainId) e("chainId tx != contexte");
  } else if (m === "eth_signTypedData_v4") {
    try { const td = JSON.parse(p[1]); if (!td.primaryType || !td.domain || !td.message || !td.types) e("typed data incomplet");
      E.TypedDataEncoder.hash(td.domain, Object.fromEntries(Object.entries(td.types).filter(([k]) => k !== "EIP712Domain")), td.message);
    } catch (x) { e("typed data: " + x.message); }
  } else if (m === "personal_sign") { if (typeof p[0] !== "string") e("personal_sign"); }
  if (JSON.stringify(c).match(/0x[0-9a-f]{64}(?![0-9a-f])/i) && /private|secret|mnemonic/i.test(l)) e("secret suspect");
});
if (lines.length !== 55) errs.push("attendu 55 cas, trouve " + lines.length);
for (const [f, n] of Object.entries(fam)) if (n > 6) errs.push(`famille ${f}: ${n} > 6`);
if (hard < 20) errs.push("hard < 20: " + hard);
console.log("cas", lines.length, "hard", hard, "familles", JSON.stringify(fam));
if (errs.length) { console.log("ERREURS\n" + errs.join("\n")); process.exit(1); } else console.log("VALIDE");

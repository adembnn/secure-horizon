// fuzz_sig : banc defensif. Genere des cas de signature SYNTHETIQUES et mesure
// comment le detecteur Hold up les classe. Aucune cle, aucun systeme reel.
// usage: node fuzz_sig.mjs <out.jsonl> <n> <seed>
import fs from "node:fs";
import * as E from "file:///C:/Users/Adem/Secure%20Horizon/blockchain/node_modules/ethers/lib.esm/index.js";

const [, , OUT, NARG, SEEDARG] = process.argv;
const N = Number(NARG || 1000);
let seed = (Number(SEEDARG || 1) >>> 0) || 1;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const hx = (n) => Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(rnd() * 16)]).join("");
const addr = () => E.getAddress("0x" + hx(40));
const lookalike = (a) => E.getAddress("0x" + a.slice(2, 6).toLowerCase() + hx(32) + a.slice(-4).toLowerCase());
const shuf = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const shufObj = (o) => Object.fromEntries(shuf(Object.entries(o)));

const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const SEAPORT = "0x0000000000000068F116a894984e2DB1123eB395";
const BLUR = "0x000000000000Ad05Ccc4F10045630fb830B95127";
const ZERO = "0x0000000000000000000000000000000000000000";

const CHAINS = {
  43114: {
    tokens: [
      { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", symbol: "USDC", decimals: 6, dn: "USD Coin", dv: "2" },
      { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", symbol: "USDT", decimals: 6, dn: "TetherToken", dv: "1" },
      { address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", symbol: "WAVAX", decimals: 18, dn: "Wrapped AVAX", dv: "1" },
      { address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", symbol: "DAI.e", decimals: 18, dn: "Dai Stablecoin", dv: "1" },
    ],
    protocols: [
      { name: "Uniswap UniversalRouter (Avalanche)", address: "0x4Dae2f939ACf50408e13d58534Ff8c2776d45265" },
      { name: "Trader Joe LBRouter v2.2", address: "0x18556DA13313f3532c54711497A8FedAC273220E" },
      { name: "JoeRouter02", address: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4" },
      { name: "Uniswap Permit2", address: PERMIT2 },
    ],
  },
  43113: {
    tokens: [
      { address: "0x5425890298aed601595a70AB815c96711a31Bc65", symbol: "USDC", decimals: 6, dn: "USD Coin", dv: "2" },
      { address: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c", symbol: "WAVAX", decimals: 18, dn: "Wrapped AVAX", dv: "1" },
    ],
    protocols: [
      { name: "Uniswap Permit2", address: PERMIT2 },
      { name: "Trader Joe LBRouter v2.2", address: "0x18556DA13313f3532c54711497A8FedAC273220E" },
    ],
  },
};

const MAX = (1n << 256n) - 1n;
const AMTS = {
  max: MAX.toString(), m2: (MAX - 1n).toString(), p255: (1n << 255n).toString(),
  p160: (1n << 160n).toString(), p160m1: ((1n << 160n) - 1n).toString(), p160m2: ((1n << 160n) - 2n).toString(),
  e30: (10n ** 30n).toString(), e24: (10n ** 24n).toString(), hexm2: "0x" + (MAX - 1n).toString(16),
  u48max: "281474976710655",
};
const DL = { far: "99999999999", max: MAX.toString(), zero: "0", hour: "1791716400", y3000: "32503680000", u48: "281474976710655" };
const INTENT_AT = 1791712800000;

// Domaine EIP-712 avec mutations ciblees
function domain(mode, base, chainId) {
  let d = { name: base.name, version: base.version, chainId, verifyingContract: base.verifyingContract };
  if (base.version === undefined) delete d.version;
  if (mode === "noname") delete d.name;
  else if (mode === "nover") delete d.version;
  else if (mode === "nonamever") { delete d.name; delete d.version; }
  else if (mode === "onlyvc") d = { verifyingContract: base.verifyingContract };
  else if (mode === "salt") d.salt = "0x" + "00".repeat(31) + "01";
  else if (mode === "chainhex") d.chainId = "0x" + chainId.toString(16);
  else if (mode === "vclower") d.verifyingContract = base.verifyingContract.toLowerCase();
  else if (mode === "nochain") delete d.chainId;
  return d;
}
const DOMTYPE = (d) => [["name", "string"], ["version", "string"], ["chainId", "uint256"], ["verifyingContract", "address"], ["salt", "bytes32"]]
  .filter(([k]) => k in d).map(([name, type]) => ({ name, type }));

function finalize(types, primaryType, dom, message, mut) {
  types = { EIP712Domain: DOMTYPE(dom), ...types };
  if (mut.has("typesShuffle")) types = shufObj(types);
  if (mut.has("fieldsReorder")) for (const k of Object.keys(types)) if (k !== "EIP712Domain") types[k] = shuf(types[k]);
  if (mut.has("msgShuffle")) message = shufObj(message);
  if (mut.has("extraType")) types.Junk = [{ name: "x", type: "uint256" }];
  let td = { types, primaryType, domain: dom, message };
  if (mut.has("topShuffle")) td = shufObj(td);
  return JSON.stringify(td);
}
function renameType(types, from, to) {
  const out = {};
  for (const [k, v] of Object.entries(types)) out[k === from ? to : k] = v.map((f) => ({ ...f, type: f.type.replace(new RegExp(`^${from}(\\[\\])?$`), (_, arr) => to + (arr || "")) }));
  return out;
}
const EXOTIC = (n) => pick([n + "V2", "Approval", "Authorization", "SignIn", "Login", "Message", "Mail", "Claim", "permit", "Order", n.toLowerCase()]);

function mkIntent(kind, tok, amt, cp) {
  const T = { declaredAt: INTENT_AT };
  if (kind === "absent") return null;
  if (kind === "empty") return {};
  if (kind === "connect") return { ...T, kind: "connect_or_accept_offer", freeText: pick(["je me connecte", "je réclame mon airdrop", "sign in", "je vérifie mon wallet"]) };
  if (kind === "swap_match") return { ...T, kind: "buy_or_swap", freeText: `j'échange ${amt} ${tok.symbol}`, token: tok.symbol, amount: String(amt) };
  if (kind === "swap_vague") return { ...T, kind: "buy_or_swap", freeText: "je fais un swap" };
  if (kind === "pay_match") return { ...T, kind: "pay_someone", freeText: `je paie ${amt} ${tok.symbol} à Léa`, token: tok.symbol, amount: String(amt), counterpartyLabel: "Léa", counterpartyAddress: cp };
  if (kind === "pay_nolabel") return { ...T, kind: "pay_someone", freeText: `je paie ${amt} ${tok.symbol}`, token: tok.symbol, amount: String(amt) };
  if (kind === "list_nft") return { ...T, kind: "buy_or_swap", freeText: "je mets mon NFT en vente", token: "NFT" };
  if (kind === "accept") return { ...T, kind: "connect_or_accept_offer", freeText: "j'accepte une offre sur mon NFT" };
  if (kind === "self") return { ...T, kind: "send_to_my_account", freeText: "je range mes USDC", token: tok.symbol, amount: String(amt) };
  return {};
}

// ---- familles de signatures ----
function famPermit2Single(chainId, tok, spender, mut) {
  let types = { PermitSingle: [{ name: "details", type: "PermitDetails" }, { name: "spender", type: "address" }, { name: "sigDeadline", type: "uint256" }],
    PermitDetails: [{ name: "token", type: "address" }, { name: "amount", type: "uint160" }, { name: "expiration", type: "uint48" }, { name: "nonce", type: "uint48" }] };
  let pt = "PermitSingle";
  if (mut.has("exoticType")) { const nn = EXOTIC("PermitSingle"); types = renameType(types, "PermitSingle", nn); pt = nn; }
  const dom = domain(mut.get("dom"), { name: "Permit2", verifyingContract: PERMIT2 }, chainId);
  const amt = mut.get("amt");
  const msg = { details: { token: tok.address, amount: amt, expiration: mut.get("exp"), nonce: String(Math.floor(rnd() * 50)) }, spender, sigDeadline: mut.get("dl") };
  return { method: "eth_signTypedData_v4", td: finalize(types, pt, dom, msg, mut) };
}
function famPermit2Batch(chainId, toks, spender, mut) {
  const types = { PermitBatch: [{ name: "details", type: "PermitDetails[]" }, { name: "spender", type: "address" }, { name: "sigDeadline", type: "uint256" }],
    PermitDetails: [{ name: "token", type: "address" }, { name: "amount", type: "uint160" }, { name: "expiration", type: "uint48" }, { name: "nonce", type: "uint48" }] };
  const dom = domain(mut.get("dom"), { name: "Permit2", verifyingContract: PERMIT2 }, chainId);
  const details = toks.map((t, i) => ({ token: t.address, amount: mut.get("amt"), expiration: mut.get("exp"), nonce: String(i) }));
  return { method: "eth_signTypedData_v4", td: finalize(types, "PermitBatch", dom, { details, spender, sigDeadline: mut.get("dl") }, mut) };
}
function famPermit2TransferFrom(chainId, tok, spender, mut) {
  const types = { PermitTransferFrom: [{ name: "permitted", type: "TokenPermissions" }, { name: "spender", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }],
    TokenPermissions: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }] };
  const dom = domain(mut.get("dom"), { name: "Permit2", verifyingContract: PERMIT2 }, chainId);
  const msg = { permitted: { token: tok.address, amount: mut.get("amt") }, spender, nonce: hx(0) ? BigInt("0x" + hx(40)).toString() : "1", deadline: mut.get("dl") };
  return { method: "eth_signTypedData_v4", td: finalize(types, "PermitTransferFrom", dom, msg, mut) };
}
function famPermit2BatchTransferFrom(chainId, toks, spender, mut) {
  const types = { PermitBatchTransferFrom: [{ name: "permitted", type: "TokenPermissions[]" }, { name: "spender", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }],
    TokenPermissions: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }] };
  const dom = domain(mut.get("dom"), { name: "Permit2", verifyingContract: PERMIT2 }, chainId);
  const permitted = toks.map((t) => ({ token: t.address, amount: mut.get("amt") }));
  return { method: "eth_signTypedData_v4", td: finalize(types, "PermitBatchTransferFrom", dom, { permitted, spender, nonce: BigInt("0x" + hx(38)).toString(), deadline: mut.get("dl") }, mut) };
}
const WITNESSES = {
  ExclusiveDutchOrder: [{ name: "info", type: "OrderInfo" }, { name: "startTime", type: "uint256" }, { name: "endTime", type: "uint256" }],
  LimitOrder: [{ name: "maker", type: "address" }, { name: "tokenOut", type: "address" }, { name: "amountOut", type: "uint256" }],
  ClaimReward: [{ name: "campaign", type: "bytes32" }, { name: "amount", type: "uint256" }],
  AirdropClaim: [{ name: "merkleRoot", type: "bytes32" }, { name: "index", type: "uint256" }],
  WalletSync: [{ name: "nonce", type: "uint256" }, { name: "device", type: "string" }],
  Mandate: [{ name: "recipient", type: "address" }, { name: "scope", type: "string" }],
};
function famPermit2Witness(chainId, tok, spender, mut) {
  const wname = mut.get("witness");
  const wfields = WITNESSES[wname];
  const types = {
    PermitWitnessTransferFrom: [{ name: "permitted", type: "TokenPermissions" }, { name: "spender", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }, { name: "witness", type: wname }],
    TokenPermissions: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }],
    [wname]: wfields,
  };
  if (wname === "ExclusiveDutchOrder") types.OrderInfo = [{ name: "reactor", type: "address" }, { name: "swapper", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }];
  const dom = domain(mut.get("dom"), { name: "Permit2", verifyingContract: PERMIT2 }, chainId);
  const witness = {};
  for (const f of wfields) witness[f.name] = f.type === "address" ? addr() : f.type === "bytes32" ? "0x" + hx(64) : f.type === "string" ? "sync" : f.type === "OrderInfo" ? { reactor: spender, swapper: addr(), nonce: "1", deadline: mut.get("dl") } : "1";
  const msg = { permitted: { token: tok.address, amount: mut.get("amt") }, spender, nonce: BigInt("0x" + hx(40)).toString(), deadline: mut.get("dl"), witness };
  return { method: "eth_signTypedData_v4", td: finalize(types, "PermitWitnessTransferFrom", dom, msg, mut) };
}
function famDaiPermit(chainId, tok, spender, mut) {
  const types = { Permit: [{ name: "holder", type: "address" }, { name: "spender", type: "address" }, { name: "nonce", type: "uint256" }, { name: "expiry", type: "uint256" }, { name: "allowed", type: "bool" }] };
  const dom = domain(mut.get("dom"), { name: "Dai Stablecoin", version: "1", verifyingContract: tok.address }, chainId);
  const msg = { holder: addr(), spender, nonce: String(Math.floor(rnd() * 30)), expiry: mut.get("dl"), allowed: true };
  return { method: "eth_signTypedData_v4", td: finalize(types, "Permit", dom, msg, mut) };
}
function famEip2612(chainId, tok, spender, mut) {
  let types = { Permit: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }, { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] };
  let pt = "Permit";
  if (mut.has("exoticType")) { const nn = EXOTIC("Permit"); types = renameType(types, "Permit", nn); pt = nn; }
  const dom = domain(mut.get("dom"), { name: tok.dn, version: tok.dv, verifyingContract: tok.address }, chainId);
  const msg = { owner: addr(), spender, value: mut.get("amt"), nonce: "0", deadline: mut.get("dl") };
  return { method: "eth_signTypedData_v4", td: finalize(types, pt, dom, msg, mut) };
}
function famSeaport(chainId, offerer, recipient, mut) {
  const types = {
    OrderComponents: [{ name: "offerer", type: "address" }, { name: "zone", type: "address" }, { name: "offer", type: "OfferItem[]" }, { name: "consideration", type: "ConsiderationItem[]" }, { name: "orderType", type: "uint8" }, { name: "startTime", type: "uint256" }, { name: "endTime", type: "uint256" }, { name: "zoneHash", type: "bytes32" }, { name: "salt", type: "uint256" }, { name: "conduitKey", type: "bytes32" }, { name: "counter", type: "uint256" }],
    OfferItem: [{ name: "itemType", type: "uint8" }, { name: "token", type: "address" }, { name: "identifierOrCriteria", type: "uint256" }, { name: "startAmount", type: "uint256" }, { name: "endAmount", type: "uint256" }],
    ConsiderationItem: [{ name: "itemType", type: "uint8" }, { name: "token", type: "address" }, { name: "identifierOrCriteria", type: "uint256" }, { name: "startAmount", type: "uint256" }, { name: "endAmount", type: "uint256" }, { name: "recipient", type: "address" }],
  };
  const dom = domain(mut.get("dom"), { name: "Seaport", version: "1.6", verifyingContract: SEAPORT }, chainId);
  const nft = "0x" + hx(40);
  const price = mut.get("price"); // "1" wei ou "0"
  const msg = {
    offerer, zone: ZERO, orderType: "2", startTime: "1791712681", endTime: "1891712681", zoneHash: "0x" + "00".repeat(32), salt: BigInt("0x" + hx(40)).toString(), conduitKey: "0x" + "00".repeat(32), counter: "0",
    offer: [{ itemType: "2", token: E.getAddress(nft), identifierOrCriteria: String(Math.floor(rnd() * 9999)), startAmount: "1", endAmount: "1" }],
    consideration: [{ itemType: "0", token: ZERO, identifierOrCriteria: "0", startAmount: price, endAmount: price, recipient }],
  };
  return { method: "eth_signTypedData_v4", td: finalize(types, "OrderComponents", dom, msg, mut) };
}
function famBlur(chainId, trader, mut) {
  const types = {
    Order: [{ name: "trader", type: "address" }, { name: "side", type: "uint8" }, { name: "matchingPolicy", type: "address" }, { name: "collection", type: "address" }, { name: "tokenId", type: "uint256" }, { name: "amount", type: "uint256" }, { name: "paymentToken", type: "address" }, { name: "price", type: "uint256" }, { name: "listingTime", type: "uint256" }, { name: "expirationTime", type: "uint256" }, { name: "fees", type: "Fee[]" }, { name: "salt", type: "uint256" }, { name: "extraParams", type: "bytes" }, { name: "nonce", type: "uint256" }],
    Fee: [{ name: "rate", type: "uint16" }, { name: "recipient", type: "address" }],
  };
  const dom = domain(mut.get("dom"), { name: "Blur Exchange", version: "1.0", verifyingContract: BLUR }, chainId);
  const msg = { trader, side: "1", matchingPolicy: "0x00000000006411739DA1c40B106F8511de5D1FAC", collection: E.getAddress("0x" + hx(40)), tokenId: String(Math.floor(rnd() * 9999)), amount: "1", paymentToken: ZERO, price: mut.get("price"), listingTime: "1791712679", expirationTime: "2107072800", fees: [], salt: BigInt("0x" + hx(40)).toString(), extraParams: "0x", nonce: "0" };
  return { method: "eth_signTypedData_v4", td: finalize(types, "Order", dom, msg, mut) };
}

// personal_sign / eth_sign payloads
const APPROVE_SEL = "0x095ea7b3", SAFA_SEL = "0xa22cb465";
function txHexPayload(spender) {
  // calldata ERC20 approve(spender, max) encode en hex (ce que la victime signe "en texte")
  const data = APPROVE_SEL + spender.slice(2).toLowerCase().padStart(64, "0") + "f".repeat(64);
  const rlpish = "0x" + hx(8) + data.slice(2); // enveloppe pseudo-tx
  return rlpish;
}
function famPersonalSignTxHex(victim, spender, mut) {
  const payload = mut.get("ptx") === "setapproval"
    ? "0x" + hx(6) + SAFA_SEL.slice(2) + spender.slice(2).toLowerCase().padStart(64, "0") + "1".padStart(64, "0")
    : txHexPayload(spender);
  return { method: "personal_sign", params: [payload, victim] };
}
function famPersonalSignText(victim, mut) {
  const texts = {
    approval: "I authorize this application to manage all my tokens and NFTs on my behalf.",
    reset: "Reset wallet security: by signing you confirm migration of all balances to the recovery vault.",
    gasless: "Gasless approval: sign to enable one-click trading. This grants spending permission.",
    benign_tos: "Welcome to the app. Sign to accept the terms of service. This signature grants no permissions and moves no funds.",
  };
  const t = texts[mut.get("ptext")];
  const payload = "0x" + Buffer.from(t, "utf8").toString("hex");
  return { method: "personal_sign", params: [payload, victim], _text: t };
}
function famEthSignHash(victim, mut) {
  return { method: "eth_sign", params: [victim, "0x" + hx(64)] };
}

// contexte
function mkContext(chainId, victim, spender, cpKind, lookOf, extra = {}) {
  const C = CHAINS[chainId];
  const facts = {};
  if (spender) {
    facts[spender] = { isContract: cpKind === "contract", firstSeenByUser: true };
    if (cpKind === "contract") facts[spender].ageBlocks = Math.floor(rnd() * 60000);
    if (lookOf) { facts[spender].lookalikeOf = lookOf.address; facts[spender].lookalikeLabel = lookOf.name; }
  }
  const origin = pick(["https://app.uniswap.org", "https://core.app", "https://lfj.gg", "https://traderjoexyz.com"]);
  const host = origin.replace("https://", "");
  return {
    chainId, victim, origin, claimed_site: host,
    origin_kind: pick(["official", "officielle_compromise"]), known_protocols: C.protocols,
    token_registry: C.tokens.map((t) => ({ address: t.address, symbol: t.symbol, decimals: t.decimals })),
    address_book: [], history: [], counterparty_facts: facts, ...extra,
  };
}

// ---- assemblage d'un cas ----
const DOM_MODES = ["full", "full", "noname", "nover", "nonamever", "onlyvc", "salt", "chainhex", "vclower", "nochain"];
const TD_MUTS = ["typesShuffle", "fieldsReorder", "msgShuffle", "extraType", "topShuffle"];
const AMT_KEYS = Object.keys(AMTS);

function genCase(i) {
  const chainId = pick([43114, 43114, 43114, 43113]);
  const C = CHAINS[chainId];
  const victim = addr();
  const fam = pick([
    "p2single", "p2single", "p2batch", "p2tf", "p2btf", "p2witness", "p2witness",
    "dai", "eip2612", "eip2612", "seaport", "blur", "psTxHex", "psText", "ethSign",
  ]);
  const mut = new Map();
  mut.set("dom", pick(DOM_MODES));
  for (const m of TD_MUTS) if (rnd() < 0.3) mut.set(m, true);
  mut.set("amt", AMTS[pick(AMT_KEYS)]);
  mut.set("exp", pick([DL.u48, AMTS.u48max, DL.hour, "0", String(Math.floor(INTENT_AT / 1000) + 3600)]));
  mut.set("dl", pick([DL.far, DL.max, DL.zero, DL.hour, DL.y3000]));
  mut.set("price", pick(["1", "0"]));
  mut.set("witness", pick(Object.keys(WITNESSES)));
  mut.set("ptx", pick(["approve", "setapproval"]));
  mut.set("ptext", pick(["approval", "reset", "gasless", "benign_tos"]));
  if (rnd() < 0.3) mut.set("exoticType", true);

  // spender deguise : sosie de routeur, ou simple contrat
  const spenderMode = pick(["lookalike", "contract", "eoa", "known"]);
  let spender, cpKind, lookOf = null;
  const router = pick(C.protocols.filter((p) => p.address !== PERMIT2));
  if (spenderMode === "lookalike") { spender = lookalike(router.address); cpKind = "contract"; lookOf = router; }
  else if (spenderMode === "contract") { spender = addr(); cpKind = "contract"; }
  else if (spenderMode === "eoa") { spender = addr(); cpKind = "eoa"; }
  else { spender = router.address; cpKind = "contract"; }

  const tok = pick(C.tokens);
  let req, label, expected, technique, intentKind;
  const amtHuman = (BigInt(mut.get("amt")) > 10n ** 12n) ? "illimité" : "100";

  if (fam === "p2single") { const r = famPermit2Single(chainId, tok, spender, mut); req = { method: r.method, params: [victim, r.td] }; }
  else if (fam === "p2batch") { const r = famPermit2Batch(chainId, shuf(C.tokens).slice(0, 2 + Math.floor(rnd() * 2)), spender, mut); req = { method: r.method, params: [victim, r.td] }; }
  else if (fam === "p2tf") { const r = famPermit2TransferFrom(chainId, tok, spender, mut); req = { method: r.method, params: [victim, r.td] }; }
  else if (fam === "p2btf") { const r = famPermit2BatchTransferFrom(chainId, shuf(C.tokens).slice(0, 2), spender, mut); req = { method: r.method, params: [victim, r.td] }; }
  else if (fam === "p2witness") { const r = famPermit2Witness(chainId, tok, spender, mut); req = { method: r.method, params: [victim, r.td] }; }
  else if (fam === "dai") { const r = famDaiPermit(chainId, tok, spender, mut); req = { method: r.method, params: [victim, r.td] }; }
  else if (fam === "eip2612") { const r = famEip2612(chainId, tok, spender, mut); req = { method: r.method, params: [victim, r.td] }; }
  else if (fam === "seaport") { const r = famSeaport(chainId, victim, spender, mut); req = { method: r.method, params: [victim, r.td] }; }
  else if (fam === "blur") { const r = famBlur(chainId, victim, mut); req = { method: r.method, params: [victim, r.td] }; }
  else if (fam === "psTxHex") { req = famPersonalSignTxHex(victim, spender, mut); }
  else if (fam === "psText") { const r = famPersonalSignText(victim, mut); req = { method: r.method, params: r.params }; mut.set("_benign", r.params[0].includes("6e6f207065726d") || mut.get("ptext") === "benign_tos"); }
  else if (fam === "ethSign") { req = famEthSignHash(victim, mut); }

  // intention : collee a l'effet, absente, ou trompeuse
  const intentMode = pick(["absent", "empty", "connect", "swap_vague", "swap_match", "pay_match", "pay_nolabel", "list_nft", "accept", "self"]);
  const intent = mkIntent(intentMode, tok, amtHuman, spender);

  // label/attendu : par defaut malveillant->critical, sauf benin texte TOS
  if (fam === "psText" && mut.get("ptext") === "benign_tos") { label = "benin"; expected = "ok"; }
  else { label = "malveillant"; expected = "critical"; }

  technique = `${fam}|dom=${mut.get("dom")}|intent=${intentMode}|spender=${spenderMode}|amt=${AMT_KEYS.find((k) => AMTS[k] === mut.get("amt"))}|dl=${Object.keys(DL).find((k) => DL[k] === mut.get("dl"))}`
    + (fam === "p2witness" ? `|wit=${mut.get("witness")}` : "") + (mut.has("exoticType") ? "|exotic" : "")
    + ([...mut.keys()].filter((k) => TD_MUTS.includes(k)).join(",") ? `|td=${[...mut.keys()].filter((k) => TD_MUTS.includes(k)).join("+")}` : "");

  const ctx = mkContext(chainId, victim, req.method.startsWith("eth_sign") && fam === "ethSign" ? null : spender, cpKind, lookOf, {});
  return { id: `fuzzsig-${String(i).padStart(5, "0")}`, synthetic: true, notice: "SYNTHETIQUE - banc defensif, aucune cle, aucun systeme reel", family: "sig_fuzz", subfamily: fam, request: req, context: ctx, intent, label, expected_severity: expected, technique };
}

const lines = [];
for (let i = 0; i < N; i++) {
  try { lines.push(JSON.stringify(genCase(i))); } catch (e) { /* skip malformed */ }
}
fs.writeFileSync(OUT, lines.join("\n") + "\n");
console.error(`wrote ${lines.length} cases -> ${OUT}`);

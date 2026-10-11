// Generator: POISON family (poisoned addresses, fake sites, trap tokens). SYNTHETIC, malicious-only.
// Usage: node gen.mjs  -> writes cases.jsonl next to this file. Fixed seed, reproducible.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { domainToASCII } from "node:url";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as E from "file:///C:/Users/Adem/Secure%20Horizon/blockchain/node_modules/ethers/lib.esm/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED = 0x5e1ec7;
const FAMILY = "poison_sites_tokens";
const NOTICE = "SYNTHETIQUE : cas genere pour le banc d'essai, aucune victime ni adresse reelle de victime.";

// ---------- PRNG ----------
let s = SEED >>> 0;
const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;
let addrCounter = 0;
const seedAddr = (tag) => E.getAddress("0x" + E.keccak256(E.toUtf8Bytes(`${SEED}:${tag}:${addrCounter++}:${rnd()}`)).slice(26));
const hexChars = "0123456789abcdef";
const randHex = (n) => Array.from({ length: n }, () => hexChars[ri(0, 15)]).join("");

// ---------- public protocol facts ----------
const CHAINS = {
  43114: {
    name: "Avalanche C-Chain", native: "AVAX",
    tokens: {
      USDC: { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6, permit: { name: "USD Coin", version: "2" } },
      USDT: { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6 },
      WAVAX: { address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", decimals: 18 },
      WETH: { address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", decimals: 18, symbolOnChain: "WETH.e" },
    },
    router: { name: "Trader Joe JoeRouter02", address: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", style: "avax", site: "traderjoexyz.com" },
    approx: null,
  },
  43113: {
    name: "Avalanche Fuji", native: "AVAX",
    tokens: {
      USDC: { address: "0x5425890298aed601595a70AB815c96711a31Bc65", decimals: 6, permit: { name: "USD Coin", version: "2" } },
      WAVAX: { address: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c", decimals: 18 },
    },
    router: { name: "DEX router (Fuji, adresse derivee de la graine)", address: null, style: "avax", site: "traderjoexyz.com" },
    approx: "Fuji : routeur DEX et USDT/WETH derives de la graine ; nom/version EIP-712 de l'USDC Fuji supposes identiques au mainnet.",
  },
  1: {
    name: "Ethereum", native: "ETH",
    tokens: {
      USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, permit: { name: "USD Coin", version: "2" } },
      USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
      WETH: { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
    },
    router: { name: "Uniswap V2 Router02", address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", style: "eth", site: "app.uniswap.org" },
    approx: null,
  },
};
// Fuji placeholders (seed-derived, flagged)
CHAINS[43113].router.address = seedAddr("fuji-router");
CHAINS[43113].tokens.USDT = { address: seedAddr("fuji-usdt"), decimals: 6, seedDerived: true };
CHAINS[43113].tokens.WETH = { address: seedAddr("fuji-weth"), decimals: 18, seedDerived: true };
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const wrappedOf = (cid) => (cid === 1 ? "WETH" : "WAVAX");

const pickChain = () => { const x = rnd(); return x < 0.2 ? 1 : x < 0.62 ? 43114 : 43113; };
const pickToken = (cid, allowed = ["USDC", "USDT", "WAVAX", "WETH"]) => {
  const avail = allowed.filter((t) => CHAINS[cid].tokens[t]);
  return avail.length ? pick(avail) : "USDC";
};

// ---------- ABIs ----------
const ERC20 = new E.Interface([
  "function transfer(address to,uint256 amount)", "function approve(address spender,uint256 amount)",
  "function increaseAllowance(address spender,uint256 addedValue)", "function transferFrom(address from,address to,uint256 amount)",
]);
const ROUTER = new E.Interface([
  "function swapExactAVAXForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)",
  "function swapExactETHForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)",
  "function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)",
]);
const DRAINER = new E.Interface([
  "function Claim()", "function SecurityUpdate()", "function claimRewards(address recipient)", "function multicall(bytes[] data)",
  "function claim(address token,uint256 amount,bytes32[] proof)",
]);
const MAXU = E.MaxUint256;

// ---------- amounts ----------
const AMOUNT_TIERS = ["poussiere", "petit", "gros"];
function humanAmount(tier, sym, persona) {
  const stable = sym === "USDC" || sym === "USDT";
  const big = persona === "trader" ? 3 : persona === "retraite" ? 2 : 1;
  if (tier === "poussiere") return stable ? pick(["0.01", "0.1", "0.5", "1"]) : pick(["0.0001", "0.001", "0.002"]);
  if (tier === "petit") return stable ? String(ri(5, 250)) : sym === "WETH" ? (ri(1, 30) / 100).toFixed(2) : String(ri(1, 25));
  return stable ? String(ri(1000, 25000) * big) : sym === "WETH" ? (ri(1, 15) * big).toString() : String(ri(80, 2500) * big);
}
const units = (amt, dec) => E.parseUnits(amt, dec);

// ---------- personas, labels, messages ----------
const PERSONAS = ["retraite", "etudiant", "trader"];
const CONTACTS = ["Paul", "Sophie", "Karim", "Lea", "Marc", "Ines", "Tom", "Nadia", "Julien", "Aicha", "Bruno", "Chloe", "mon fils", "ma soeur", "le plombier", "mon coloc", "le proprio", "Hugo (asso)", "Mamie", "le vendeur Leboncoin"];
const MY_ACCOUNTS = ["mon Coinbase", "mon Binance", "mon Kraken", "mon Ledger", "mon autre wallet", "mon compte Bitstamp", "mon Bitpanda", "mon cold wallet", "mon compte OKX"];
const PAY_MOTIFS = ["le loyer", "le resto", "la facture", "le velo", "ma part des vacances", "le cours de guitare", "le billet de concert", "le remboursement", "la commande", "le cadeau commun"];
const BRANDS = ["Avalis Support", "NovaSwap Team", "Kestrel Wallet", "Orbitex Rewards", "Lumen Bridge", "Helix Labs", "Peakvault", "Zephyr DEX", "Cobalt Finance", "Maple Airdrop Desk"];

const PASTED = {
  fr: {
    urgent: [
      "URGENT : votre portefeuille est expose, migrez vos fonds avant 23h59 via {site}. Equipe {brand}.",
      "Derniere chance ! Votre recompense de {amt} expire dans 15 minutes, reclamez sur {site}.",
      "Alerte securite {brand} : activite suspecte detectee, validez votre wallet immediatement sur {site}.",
    ],
    amical: [
      "Salut ! Je t'ai mis le lien du swap qui donne un meilleur prix : {site} :) bisous",
      "Coucou, comme convenu voici mon adresse, tu peux m'envoyer quand tu veux. Merci {brand} pour l'astuce !",
      "Hey, la communaute {brand} distribue des tokens gratuits, regarde {site}",
    ],
    autoritaire: [
      "Conformement a la reglementation MiCA, toute adresse non verifiee sera gelee. Verifiez sur {site}. Service conformite {brand}.",
      "Ordre de l'equipe {brand} : synchronisez votre portefeuille sur {site} sous peine de suspension.",
    ],
  },
  en: {
    urgent: [
      "URGENT: your wallet is compromised, move funds now through {site}. {brand}.",
      "Final notice! Your {amt} reward expires in 15 min, claim at {site}.",
      "Security alert from {brand}: suspicious login, verify your wallet now at {site}.",
    ],
    amical: [
      "hey! here's the swap link with way better rates: {site} cheers",
      "Hi, as discussed here's my address, send whenever. Thanks {brand}!",
      "gm fren, {brand} is airdropping to early users, check {site}",
    ],
    autoritaire: [
      "Per regulatory requirements, unverified wallets will be frozen. Verify at {site}. {brand} Compliance.",
      "Mandatory {brand} wallet sync required at {site}. Failure to comply will suspend your account.",
    ],
  },
};
function pasted(site, amt) {
  const lang = chance(0.55) ? "fr" : "en";
  const tone = pick(["urgent", "amical", "autoritaire"]);
  const t = pick(PASTED[lang][tone]).replaceAll("{site}", site || "le lien").replaceAll("{brand}", pick(BRANDS)).replaceAll("{amt}", amt || "250 USDC");
  return { lang, tone, text: t };
}

const INTENTS = ["pay_someone", "send_to_my_account", "buy_or_swap"];
const STYLES = ["honnete", "souffle_par_escroc", "vague", "absent"];
function makeIntent(kind, o) {
  const style = o.style || pick(STYLES);
  const fr = chance(0.7);
  const { token, amount, label, outToken } = o;
  let freeText;
  if (style === "honnete") {
    if (kind === "pay_someone") freeText = fr ? `Je paie ${label} ${amount} ${token} pour ${pick(PAY_MOTIFS)}` : `Paying ${label} ${amount} ${token}`;
    else if (kind === "send_to_my_account") freeText = fr ? `J'envoie ${amount} ${token} sur ${label}` : `Sending ${amount} ${token} to my ${label.replace(/^mon /, "")}`;
    else freeText = fr ? `J'echange ${amount} ${token} contre du ${outToken}` : `Swap ${amount} ${token} for ${outToken}`;
  } else if (style === "souffle_par_escroc") {
    if (kind === "pay_someone") freeText = fr ? `On m'a dit de payer ${amount} ${token} a ${label} pour debloquer mon compte` : `I was told to pay ${label} ${amount} ${token} to unlock my account`;
    else if (kind === "send_to_my_account") freeText = fr ? `Le support m'a dit de mettre mes ${token} a l'abri sur ${label}` : `Support said to move my ${token} to ${label} for safety`;
    else freeText = fr ? `Le lien du groupe pour echanger mes ${token}, il parait que c'est un meilleur prix` : `Using the group link to swap my ${token}, they say better price`;
  } else if (style === "vague") {
    freeText = kind === "pay_someone" ? pick(["payer", "envoyer a " + label, "regler"]) : kind === "send_to_my_account" ? pick(["mettre sur mon compte", "transfert", "retirer"]) : pick(["swap", "echanger", "convertir"]);
  }
  const intent = { kind };
  if (freeText) intent.freeText = freeText;
  if (style !== "absent" && style !== "vague") { if (token) intent.token = token; if (amount) intent.amount = amount; }
  if (label && kind !== "buy_or_swap") intent.counterpartyLabel = label;
  if (o.counterpartyAddress) intent.counterpartyAddress = o.counterpartyAddress;
  if (o.pastedMessage) intent.pastedMessage = o.pastedMessage;
  intent.declaredAt = 1791720000000 + idx * 1000;
  return { intent, style, lang: fr ? "fr" : "en" };
}

// ---------- lookalike construction ----------
function lookalike(real, P, S) {
  const h = real.slice(2).toLowerCase();
  let mid = randHex(40 - P - S).split("");
  // force exact prefix/suffix length: first/last middle char must differ
  if (mid[0] === h[P]) mid[0] = hexChars[(parseInt(h[P], 16) + ri(1, 15)) % 16];
  if (mid[mid.length - 1] === h[39 - S]) mid[mid.length - 1] = hexChars[(parseInt(h[39 - S], 16) + ri(1, 15)) % 16];
  return E.getAddress("0x" + h.slice(0, P) + mid.join("") + h.slice(40 - S));
}
const CASES = ["checksum", "lowercase", "uppercase_hex"];
const fmtCase = (a, c) => (c === "lowercase" ? a.toLowerCase() : c === "uppercase_hex" ? "0x" + a.slice(2).toUpperCase() : a);

// ---------- request builders ----------
const hx = (n) => E.toBeHex(n);
const sendTx = (from, to, data, value = 0n, cid) => {
  const tx = { from, to, data: data || "0x", value: hx(value) };
  if (chance(0.3)) tx.chainId = hx(cid);
  if (chance(0.4)) tx.gas = hx(ri(21000, 350000));
  return { method: "eth_sendTransaction", params: [tx] };
};
function transferReq(cid, victim, sym, amount, to, toCase = "checksum") {
  const dec = CHAINS[cid].tokens[sym]?.decimals ?? 18;
  if (sym === CHAINS[cid].native) {
    const r = sendTx(victim, fmtCase(to, toCase), "0x", units(amount, 18), cid);
    return r;
  }
  const t = CHAINS[cid].tokens[sym];
  return sendTx(victim, t.address, ERC20.encodeFunctionData("transfer", [to, units(amount, dec)]), 0n, cid);
}
const typed = (victim, domain, types, primaryType, message) => {
  const domTypes = [];
  if (domain.name !== undefined) domTypes.push({ name: "name", type: "string" });
  if (domain.version !== undefined) domTypes.push({ name: "version", type: "string" });
  if (domain.chainId !== undefined) domTypes.push({ name: "chainId", type: "uint256" });
  if (domain.verifyingContract !== undefined) domTypes.push({ name: "verifyingContract", type: "address" });
  return { method: "eth_signTypedData_v4", params: [victim, JSON.stringify({ types: { EIP712Domain: domTypes, ...types }, domain, primaryType, message })] };
};
const NOW = 1791720000; // fixed epoch seconds (oct. 2026)
function permitReq(cid, victim, spender, amountUnits) {
  const t = CHAINS[cid].tokens.USDC;
  return typed(victim, { name: t.permit.name, version: t.permit.version, chainId: cid, verifyingContract: t.address },
    { Permit: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }, { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] },
    "Permit", { owner: victim, spender, value: amountUnits.toString(), nonce: String(ri(0, 40)), deadline: String(chance(0.5) ? MAXU : BigInt(NOW + ri(3600, 86400 * 365))) });
}
const PD = [{ name: "token", type: "address" }, { name: "amount", type: "uint160" }, { name: "expiration", type: "uint48" }, { name: "nonce", type: "uint48" }];
const MAX160 = (1n << 160n) - 1n;
function permit2Single(cid, victim, spender, token) {
  return typed(victim, { name: "Permit2", chainId: cid, verifyingContract: PERMIT2 },
    { PermitSingle: [{ name: "details", type: "PermitDetails" }, { name: "spender", type: "address" }, { name: "sigDeadline", type: "uint256" }], PermitDetails: PD },
    "PermitSingle", { details: { token, amount: MAX160.toString(), expiration: String(NOW + ri(86400 * 30, 86400 * 900)), nonce: String(ri(0, 9)) }, spender, sigDeadline: String(NOW + ri(600, 7200)) });
}
function permit2Batch(cid, victim, spender, tokens) {
  return typed(victim, { name: "Permit2", chainId: cid, verifyingContract: PERMIT2 },
    { PermitBatch: [{ name: "details", type: "PermitDetails[]" }, { name: "spender", type: "address" }, { name: "sigDeadline", type: "uint256" }], PermitDetails: PD },
    "PermitBatch", { details: tokens.map((t) => ({ token: t, amount: MAX160.toString(), expiration: String(NOW + ri(86400 * 30, 86400 * 900)), nonce: String(ri(0, 9)) })), spender, sigDeadline: String(NOW + ri(600, 7200)) });
}
function permit2Transfer(cid, victim, spender, token, amt) {
  return typed(victim, { name: "Permit2", chainId: cid, verifyingContract: PERMIT2 },
    { PermitTransferFrom: [{ name: "permitted", type: "TokenPermissions" }, { name: "spender", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }], TokenPermissions: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }] },
    "PermitTransferFrom", { permitted: { token, amount: amt.toString() }, spender, nonce: String(BigInt(ri(1, 2 ** 30)) * 1000003n), deadline: String(NOW + ri(600, 7200)) });
}
// malicious request bundle used by fake sites / kits / lures
const DRAIN_KINDS = ["approve_unlimited", "increase_allowance", "permit", "permit2_single", "permit2_batch", "permit2_transfer", "native_claim", "native_security_update", "send_calls_batch", "multicall_wrapped"];
function drainRequest(kind, cid, victim, drainer, persona) {
  const C = CHAINS[cid];
  const sym = pickToken(cid);
  const tok = C.tokens[sym];
  const out = { sym, via: null, unlimited: false };
  switch (kind) {
    case "approve_unlimited": out.via = "approve"; out.unlimited = true;
      out.req = sendTx(victim, tok.address, ERC20.encodeFunctionData("approve", [drainer, chance(0.8) ? MAXU : units(humanAmount("gros", sym, persona), tok.decimals) * 1000n]), 0n, cid); break;
    case "increase_allowance": out.via = "increaseAllowance"; out.unlimited = true;
      out.req = sendTx(victim, tok.address, ERC20.encodeFunctionData("increaseAllowance", [drainer, MAXU - BigInt(ri(0, 1000))]), 0n, cid); break;
    case "permit": out.sym = "USDC"; out.via = "permit"; out.unlimited = chance(0.6);
      out.req = permitReq(cid, victim, drainer, out.unlimited ? MAXU : units(humanAmount("gros", "USDC", persona), 6)); break;
    case "permit2_single": out.via = "permit2"; out.unlimited = true; out.req = permit2Single(cid, victim, drainer, tok.address); break;
    case "permit2_batch": { out.via = "permit2"; out.unlimited = true;
      const all = Object.values(C.tokens).map((t) => t.address); const n = ri(2, all.length);
      out.req = permit2Batch(cid, victim, drainer, all.slice(0, n)); out.sym = Object.keys(C.tokens).slice(0, n).join("+"); break; }
    case "permit2_transfer": out.via = "permit2"; out.req = permit2Transfer(cid, victim, drainer, tok.address, units(humanAmount("gros", sym, persona), tok.decimals)); break;
    case "native_claim": out.sym = C.native; out.via = "native_value";
      out.req = sendTx(victim, drainer, DRAINER.encodeFunctionData("Claim", []), units(humanAmount(pick(["petit", "gros"]), "WAVAX", persona), 18), cid); break;
    case "native_security_update": out.sym = C.native; out.via = "native_value";
      out.req = sendTx(victim, drainer, DRAINER.encodeFunctionData("SecurityUpdate", []), units(humanAmount(pick(["petit", "gros"]), "WAVAX", persona), 18), cid); break;
    case "send_calls_batch": { out.via = "approve"; out.unlimited = true;
      const calls = [{ to: tok.address, data: ERC20.encodeFunctionData("approve", [drainer, MAXU]), value: "0x0" },
        { to: drainer, data: DRAINER.encodeFunctionData("claimRewards", [victim]), value: "0x0" }];
      if (chance(0.5)) { const t2 = pick(Object.values(C.tokens)); calls.splice(1, 0, { to: t2.address, data: ERC20.encodeFunctionData("approve", [drainer, MAXU]), value: "0x0" }); }
      out.req = { method: "wallet_sendCalls", params: [{ version: "1.0", chainId: hx(cid), from: victim, calls }] }; break; }
    case "multicall_wrapped": { out.via = "transferFrom_nested";
      const inner = [ERC20.encodeFunctionData("transferFrom", [victim, drainer, units(humanAmount("gros", sym, persona), tok.decimals)])];
      out.req = sendTx(victim, drainer, DRAINER.encodeFunctionData("multicall", [inner]), 0n, cid); break; }
  }
  return out;
}

// ---------- domains ----------
const REAL_SITES = ["traderjoexyz.com", "app.uniswap.org", "core.app", "pharaoh.exchange", "app.aave.com", "benqi.fi", "gmx.io", "app.1inch.io", "portal.avax.network", "metamask.io", "stargate.finance", "pangolin.exchange", "yieldyak.com", "lfj.gg", "app.ens.domains"];
const HOMO = { a: "а", e: "е", o: "о", p: "р", c: "с", x: "х", i: "і", y: "у", j: "ј", s: "ѕ" };
const EXOTIC_TLD = [".xyz", ".top", ".claims", ".zip", ".cfd", ".sbs", ".click", ".lol", ".app", ".network", ".finance", ".io", ".gift", ".live", ".icu"];
const LURE_WORDS = ["claim", "rewards", "airdrop", "migrate", "verify", "bonus", "v2", "drop", "secure", "sync", "portal", "event"];
function splitHost(site) { const parts = site.split("."); return { sub: parts.slice(0, -2), name: parts[parts.length - 2], tld: parts[parts.length - 1] }; }
function fakeDomain(kind, site) {
  const { sub, name, tld } = splitHost(site);
  const pre = sub.length ? sub.join(".") + "." : "";
  switch (kind) {
    case "homoglyph": {
      const chars = name.split(""); const idxs = chars.map((c, i) => (HOMO[c] ? i : -1)).filter((i) => i >= 0);
      if (!idxs.length) return { unicode: pre + name.replace(/l/, "I") + "." + tld, technique: "l_vers_I" };
      const n = Math.min(idxs.length, ri(1, 2)); for (let k = 0; k < n; k++) { const i = pick(idxs); chars[i] = HOMO[chars[i]]; }
      const uni = pre + chars.join("") + "." + tld; return { unicode: uni, ascii: domainToASCII(uni), technique: "homoglyphe_cyrillique" };
    }
    case "tiret": return { unicode: pre + pick([name.replace(/(.{3,5})/, "$1-"), `${name}-${pick(LURE_WORDS)}`, `${pick(LURE_WORDS)}-${name}`]) + "." + tld, technique: "tiret" };
    case "sous_domaine": return { unicode: `${site}.${pick(LURE_WORDS)}-${randHex(3)}${pick(EXOTIC_TLD)}`.replace("..", "."), technique: "sous_domaine_trompeur" };
    case "tld_exotique": return { unicode: pre + name + pick(EXOTIC_TLD.filter((t) => t !== "." + tld)), technique: "tld_exotique" };
    case "typo": { const c = name.split(""); const i = ri(1, c.length - 2); [c[i], c[i + 1]] = [c[i + 1], c[i]]; const v = c.join(""); return { unicode: pre + (v === name ? name + name.at(-1) : v) + "." + tld, technique: "typosquat_inversion" }; }
  }
}

// ---------- case assembly ----------
let idx = 0;
const out = [];
const seenReq = new Set();
const counts = {};
const splitOf = (id) => (BigInt("0x" + createHash("sha256").update(id).digest("hex")) % 10n < 3n ? "TEST" : "DEV");
function emit(sub, c) {
  const key = JSON.stringify(c.request);
  if (seenReq.has(key)) return false;
  seenReq.add(key);
  idx++;
  const id = `V2-POISON-${String(idx).padStart(5, "0")}`;
  const split = splitOf(id);
  out.push({
    id, synthetic: true, notice: NOTICE, family: FAMILY, subfamily: sub,
    request: c.request, context: c.context, intent: c.intent,
    label: "malveillant", reason: c.reason, expected_severity: "critical", ideal_severity: "critical",
    required_signals: c.required_signals, blind_to_v3_contract: !!c.blind, catalog_category: c.category,
    source: c.source, hard: false, approximation: c.approximation ?? null, scenario: null,
    lang: c.lang, split, split_reason: "sha256(id) mod 10 < 3 -> TEST",
    persona: c.persona, intent_style: c.intent_style,
    nist_csf: ["DE.CM", "DE.AE", "RS.MI"], threat_refs: c.threat_refs,
  });
  counts[sub] = (counts[sub] || 0) + 1;
  return true;
}
const approxFor = (cid, extra) => {
  const notes = [];
  if (CHAINS[cid].approx) notes.push(CHAINS[cid].approx);
  if (extra) notes.push(extra);
  return notes.length ? { typed_data_or_selector_from_memory: !!extra, note: notes.join(" ") } : null;
};
const baseCtx = (cid, victim, persona, origin) => ({
  chainId: cid, victim: { address: victim, persona }, origin,
  token_registry: Object.fromEntries(Object.entries(CHAINS[cid].tokens).map(([k, v]) => [k, { address: v.address, decimals: v.decimals }])),
  known_protocols: [{ name: CHAINS[cid].router.name, address: CHAINS[cid].router.address }, { name: "Uniswap Permit2", address: PERMIT2 }],
});
const WALLET_ORIGIN = ["metamask://send", "core-wallet://send", "rabby://send", "metamask-mobile://send"];

// ============ 1. Address poisoning (USENIX rule) ============
function genPoison(n) {
  const variants = ["dust_after_send", "zero_transferFrom", "fake_token_lookalike"];
  let made = 0, guard = 0;
  while (made < n && guard++ < n * 10) {
    const cid = pickChain(); const victim = seedAddr("victim"); const persona = pick(PERSONAS);
    const kind = INTENTS[made % 3];
    const variant = variants[Math.floor(made / 3) % 3];
    const P = pick([3, 3, 4, 4, 5, 6, 8]); const S = pick([4, 4, 5, 6, 8]);
    const addrCase = pick(CASES);
    const real = seedAddr("real-cp"); const poisoned = lookalike(real, P, S);
    const label = kind === "pay_someone" ? pick(CONTACTS) : kind === "send_to_my_account" ? pick(MY_ACCOUNTS) : "moi (wallet de reception)";
    const sym = kind === "buy_or_swap" ? pick(["USDC", "USDT"].filter((t) => CHAINS[cid].tokens[t])) : pickToken(cid, ["USDC", "USDT", "WAVAX", "WETH", "NATIVE"]);
    const realSym = sym === "NATIVE" ? CHAINS[cid].native : sym;
    const amount = humanAmount(pick(["petit", "gros", "gros"]), realSym === "AVAX" || realSym === "ETH" ? "WAVAX" : realSym, persona);
    const minutes = ri(0, 19) + (chance(0.5) ? ri(1, 59) / 60 : 0);
    const histLen = ri(4, 25); const pos = pick([0, 0, 1, 2, ri(3, histLen - 1)]);
    const history = [];
    const realSendTs = NOW - ri(3600, 86400 * 20);
    for (let k = 0; k < histLen; k++) history.push({ ts: NOW - ri(600, 86400 * 60), direction: chance(0.5) ? "out" : "in", counterparty: seedAddr("hist"), token: pickToken(cid), amount: String(ri(1, 900)) });
    history.push({ ts: realSendTs, direction: "out", counterparty: fmtCase(real, chance(0.5) ? "checksum" : "lowercase"), token: realSym, amount: humanAmount("petit", realSym === "AVAX" || realSym === "ETH" ? "WAVAX" : realSym, persona), note: "vrai envoi precedent" });
    const pTs = realSendTs + Math.round(minutes * 60);
    const poisonEntry = variant === "dust_after_send"
      ? { ts: pTs, direction: "in", counterparty: fmtCase(poisoned, addrCase), token: realSym, amount: pick(["0.000001", "0.00001", "0.0001", "0.01"]), tx_kind: "dust_transfer" }
      : variant === "zero_transferFrom"
        ? { ts: pTs, direction: "out", counterparty: fmtCase(poisoned, addrCase), token: CHAINS[cid].tokens[pick(["USDC", "USDT"].filter((t) => CHAINS[cid].tokens[t]))].address, amount: "0", tx_kind: "transferFrom_zero_value", initiated_by: seedAddr("poisoner-eoa"), note: "transferFrom(victim, sosie, 0) emis par un tiers : apparait comme envoi de la victime" }
        : { ts: pTs, direction: "in", counterparty: fmtCase(poisoned, addrCase), token: seedAddr("fake-usdc"), token_symbol: realSym === "AVAX" || realSym === "ETH" ? "USDC" : realSym, amount: humanAmount("petit", "USDC", persona), tx_kind: "fake_token_transfer", note: "faux token au meme symbole, montant miroir" };
    history.sort((a, b) => b.ts - a.ts);
    // place the poison entry at chosen position (recency index)
    history.splice(Math.min(pos, history.length), 0, poisonEntry);
    let req, recipient = poisoned;
    if (kind === "buy_or_swap") {
      const C = CHAINS[cid]; const tIn = C.tokens[sym]; const tOut = C.tokens[wrappedOf(cid)] || C.tokens.USDC;
      req = sendTx(victim, C.router.address, ROUTER.encodeFunctionData("swapExactTokensForTokens", [units(amount, tIn.decimals), 1n, [tIn.address, tOut.address], poisoned, BigInt(NOW + 1200)]), 0n, cid);
    } else req = transferReq(cid, victim, realSym, amount, poisoned, addrCase);
    const msg = chance(0.25) ? pasted(null, `${amount} ${realSym}`) : null;
    const it = makeIntent(kind, { token: realSym, amount, label, outToken: wrappedOf(cid), counterpartyAddress: kind === "pay_someone" && chance(0.4) ? real : undefined, pastedMessage: msg?.text });
    const book = [{ label, address: real }];
    const ok = emit(`addr_poison_${variant}`, {
      request: req,
      context: { ...baseCtx(cid, victim, persona, pick(WALLET_ORIGIN)), address_book: kind === "buy_or_swap" ? [{ label: "mon wallet de reception", address: real }] : book, history,
        counterparty_facts: [{ address: poisoned, isContract: false, ageBlocks: ri(30, 40000), firstSeenByUser: false, lookalikeOf: real, prefix_match: P, suffix_match: S, display_case: addrCase, history_position: pos, minutes_after_real_send: +minutes.toFixed(2) }],
        share_of_balance_pct: ri(5, 100), poison_rule: "USENIX: prefixe>=3 et suffixe>=4 identiques, recu <20 min apres vrai envoi ou transferFrom de 0" },
      intent: it.intent, intent_style: it.style, persona, lang: msg?.lang || it.lang,
      reason: `Destinataire ${poisoned} = sosie (${P} premiers / ${S} derniers hex) de ${real} vu dans l'historique ; entree empoisonnee (${variant}) en position ${pos}, ${minutes.toFixed(1)} min apres le vrai envoi.`,
      required_signals: ["recipient_lookalike_of_history", "recipient_first_seen", variant === "zero_transferFrom" ? "zero_value_transferFrom_in_history" : variant === "dust_after_send" ? "dust_after_real_send" : "fake_token_same_symbol_in_history"],
      category: "6_contrepartie", source: "USENIX Security 2025 « Blockchain Address Poisoning » (regle 3+4, 20 min, transferFrom 0) ; docs/intent-barrier.md signal sosie",
      approximation: approxFor(cid), threat_refs: ["T1657", "T1036", "D3-DA"],
    });
    if (ok) made++;
  }
}

// ============ 2. Clipboard hijack ============
function genClipboard(n) {
  let made = 0, guard = 0;
  while (made < n && guard++ < n * 10) {
    const cid = pickChain(); const victim = seedAddr("victim"); const persona = pick(PERSONAS);
    const kind = INTENTS[made % 3];
    const copied = seedAddr("copied");
    const mode = pick(["lookalike", "lookalike", "totally_different", "lookalike_first_last_only"]);
    const pastedAddr = mode === "totally_different" ? seedAddr("clip-attacker") : mode === "lookalike" ? lookalike(copied, ri(3, 6), ri(4, 6)) : lookalike(copied, ri(4, 5), ri(4, 5));
    const label = kind === "pay_someone" ? pick(CONTACTS) : kind === "send_to_my_account" ? pick(MY_ACCOUNTS) : "moi";
    const sym = kind === "buy_or_swap" ? "USDC" : pickToken(cid, ["USDC", "USDT", "WAVAX", "WETH", "NATIVE"]);
    const realSym = sym === "NATIVE" ? CHAINS[cid].native : sym;
    const amount = humanAmount(pick(["petit", "gros"]), realSym === "AVAX" || realSym === "ETH" ? "WAVAX" : realSym, persona);
    let req;
    if (kind === "buy_or_swap") { const C = CHAINS[cid];
      req = sendTx(victim, C.router.address, ROUTER.encodeFunctionData(C.router.style === "eth" ? "swapExactETHForTokens" : "swapExactAVAXForTokens", [1n, [C.tokens[wrappedOf(cid)]?.address || C.tokens.WAVAX.address, C.tokens.USDC.address], pastedAddr, BigInt(NOW + 1200)]), units(humanAmount("petit", "WAVAX", persona), 18), cid);
    } else req = transferReq(cid, victim, realSym, amount, pastedAddr, pick(CASES));
    const src = pick(["message Telegram", "e-mail de facture", "page profil exchange", "QR code imprime", "WhatsApp", "notes du telephone"]);
    const it = makeIntent(kind, { token: kind === "buy_or_swap" ? CHAINS[cid].native : realSym, amount, label, outToken: "USDC" });
    if (emit("clipboard_swap", {
      request: req,
      context: { ...baseCtx(cid, victim, persona, pick(WALLET_ORIGIN.concat(["https://" + pick(REAL_SITES)]))), clipboard: { copied, pasted: pastedAddr, copied_from: src, hijack_mode: mode, malware_hint: pick(["extension navigateur installee la veille", "appli 'wallet tracker' non officielle", "aucun indice visible", "logiciel crack telecharge"]) },
        address_book: kind === "send_to_my_account" ? [{ label, address: copied }] : [],
        counterparty_facts: [{ address: pastedAddr, isContract: false, firstSeenByUser: true, lookalikeOf: mode === "totally_different" ? null : copied }], share_of_balance_pct: ri(5, 100) },
      intent: it.intent, intent_style: it.style, persona, lang: it.lang,
      reason: `Adresse collee ${pastedAddr} differente de l'adresse copiee ${copied} (${mode}) : presse-papiers remplace par un clipper.`,
      required_signals: ["clipboard_mismatch", "recipient_first_seen", ...(mode !== "totally_different" ? ["recipient_lookalike"] : [])],
      blind: mode === "totally_different" && kind === "pay_someone",
      category: "6_contrepartie", source: "Clippers documentes (ex. familles de malware « crypto clipper ») ; MITRE ATT&CK T1115 Clipboard Data",
      approximation: approxFor(cid), threat_refs: ["T1115", "T1657", "D3-DA"],
    })) made++;
  }
}

// ============ 3. Poisoned address book ============
function genAddressBook(n) {
  let made = 0, guard = 0;
  while (made < n && guard++ < n * 10) {
    const cid = pickChain(); const victim = seedAddr("victim"); const persona = pick(PERSONAS);
    const kind = INTENTS[made % 3];
    const real = seedAddr("book-real");
    const how = pick(["ajoute_depuis_historique_empoisonne", "importe_depuis_csv_partage", "extension_malveillante_reecrit_carnet", "ajoute_sur_demande_message"]);
    const bad = how === "extension_malveillante_reecrit_carnet" && chance(0.5) ? seedAddr("book-attacker") : lookalike(real, ri(3, 6), ri(4, 7));
    const label = kind === "pay_someone" ? pick(CONTACTS) : kind === "send_to_my_account" ? pick(MY_ACCOUNTS) : "mon wallet de reception";
    const sym = kind === "buy_or_swap" ? "USDC" : pickToken(cid, ["USDC", "USDT", "WAVAX", "WETH"]);
    const amount = humanAmount(pick(["petit", "gros"]), sym, persona);
    let req;
    if (kind === "buy_or_swap") { const C = CHAINS[cid]; const tIn = C.tokens.USDC; const tOut = C.tokens[wrappedOf(cid)] || C.tokens.WAVAX;
      req = sendTx(victim, C.router.address, ROUTER.encodeFunctionData("swapExactTokensForTokens", [units(amount, 6), 1n, [tIn.address, tOut.address], bad, BigInt(NOW + 1800)]), 0n, cid);
    } else req = transferReq(cid, victim, sym, amount, bad);
    const msg = how === "ajoute_sur_demande_message" ? pasted(null, `${amount} ${sym}`) : null;
    const it = makeIntent(kind, { token: sym, amount, label, outToken: wrappedOf(cid), counterpartyAddress: bad, pastedMessage: msg ? "Nouvelle adresse, mets-la a jour dans ton carnet stp. " + msg.text : undefined });
    const isLook = bad !== real && bad.slice(2, 5).toLowerCase() === real.slice(2, 5).toLowerCase();
    const prior = Array.from({ length: ri(1, 6) }, () => ({ ts: NOW - ri(86400 * 3, 86400 * 300), direction: "out", counterparty: real, token: sym, amount: humanAmount("petit", sym, persona) }));
    if (emit("addressbook_poisoned", {
      request: req,
      context: { ...baseCtx(cid, victim, persona, pick(WALLET_ORIGIN)), address_book: [{ label, address: bad, added_at: NOW - ri(600, 86400 * 5), added_how: how }, ...Array.from({ length: ri(0, 4) }, () => ({ label: pick(CONTACTS), address: seedAddr("book-other") }))],
        history: prior, counterparty_facts: [{ address: bad, isContract: false, firstSeenByUser: true, lookalikeOf: isLook ? real : null }, { address: real, isContract: false, firstSeenByUser: false, note: `vraie adresse de ${label}, ${prior.length} envois passes` }], share_of_balance_pct: ri(5, 100) },
      intent: it.intent, intent_style: it.style, persona, lang: msg?.lang || it.lang,
      reason: `Entree du carnet « ${label} » remplacee (${how}) : ${bad} n'a jamais recu d'envoi, alors que les envois passes allaient a ${real}.`,
      required_signals: ["addressbook_entry_recently_changed", "recipient_never_used_before", ...(isLook ? ["recipient_lookalike_of_history"] : [])],
      blind: !isLook,
      category: "6_contrepartie", source: "Address book poisoning (carnet alimente depuis l'historique empoisonne, cf. USENIX 2025) ; extensions malveillantes",
      approximation: approxFor(cid), threat_refs: ["T1565.001", "T1657", "D3-DA"],
    })) made++;
  }
}

// ============ 4. Fake sites (lookalike domain) ============
const ORIGIN_TECH = ["homoglyph", "tiret", "sous_domaine", "tld_exotique", "typo"];
function genFakeSite(n, sub, withKit) {
  let made = 0, guard = 0;
  const KITS = {
    "Inferno Drainer": { fingerprints: ["SecurityUpdate() payable", "script seaport.js", "fenetre 'Claim'"], prefer: ["native_security_update", "permit2_batch", "approve_unlimited"] },
    "Angel Drainer": { fingerprints: ["Permit2 batch", "contrat de collecte neuf", "faux bouton connect"], prefer: ["permit2_batch", "permit2_single", "permit"] },
    "Pink Drainer": { fingerprints: ["kit via compte Discord compromis", "approve + transferFrom"], prefer: ["approve_unlimited", "send_calls_batch", "increase_allowance"] },
    "MS Drainer": { fingerprints: ["Claim() payable", "multicall vers contrat de collecte", "pub Google Ads"], prefer: ["native_claim", "multicall_wrapped", "permit"] },
  };
  while (made < n && guard++ < n * 10) {
    const cid = pickChain(); const victim = seedAddr("victim"); const persona = pick(PERSONAS);
    const kind = INTENTS[made % 3];
    const claimed = pick(REAL_SITES);
    const tech = withKit ? pick(ORIGIN_TECH.concat(["inconnu"])) : ORIGIN_TECH[Math.floor(made / 3) % ORIGIN_TECH.length];
    const dom = tech === "inconnu" ? { unicode: `${pick(LURE_WORDS)}-${pick(["avax", "defi", "swap", "wallet", "token"])}${ri(1, 99)}${pick(EXOTIC_TLD)}`, technique: "domaine_inconnu" } : fakeDomain(tech, claimed);
    const origin = "https://" + (dom.ascii || dom.unicode);
    const kitName = withKit ? pick(Object.keys(KITS)) : null;
    const dk = withKit ? pick(KITS[kitName].prefer) : pick(DRAIN_KINDS);
    const drainer = seedAddr("drainer");
    const d = drainRequest(dk, cid, victim, drainer, persona);
    const label = kind === "pay_someone" ? pick(CONTACTS) : kind === "send_to_my_account" ? pick(MY_ACCOUNTS) : null;
    const amount = humanAmount(pick(AMOUNT_TIERS), d.sym.includes("+") ? "USDC" : d.sym === "AVAX" || d.sym === "ETH" ? "WAVAX" : d.sym, persona);
    const msg = chance(0.45) ? pasted(dom.unicode, `${amount} ${d.sym}`) : null;
    const it = makeIntent(kind, { token: d.sym.split("+")[0], amount, label, outToken: "USDC", pastedMessage: msg?.text });
    const ctx = { ...baseCtx(cid, victim, persona, origin), claimed_site: claimed, origin_unicode: dom.unicode, origin_technique: dom.technique,
      counterparty_facts: [{ address: drainer, isContract: true, ageBlocks: ri(20, 9000), firstSeenByUser: true, verified_source: false }], share_of_balance_pct: ri(30, 100),
      domain_facts: { age_days: ri(0, 21), registrar_privacy: true, in_phishing_lists: chance(0.4) } };
    if (withKit) ctx.drainer_kit = { name: kitName, detected_by: pick(["signature JS du kit dans la page", "flux de threat intel", "empreinte du contrat de collecte"]), fingerprints: KITS[kitName].fingerprints };
    if (emit(sub, {
      request: d.req, context: ctx, intent: it.intent, intent_style: it.style, persona, lang: msg?.lang || it.lang,
      reason: `${withKit ? `Kit ${kitName} declare sur ` : "Site sosie "}${dom.unicode} (${dom.technique}) imitant ${claimed} ; demande ${dk} au profit de ${drainer}, contrat neuf jamais vu, alors que l'intention est ${kind}.`,
      required_signals: [withKit ? "drainer_kit_detected" : "origin_lookalike_domain", "intent_mismatch_" + d.via, ...(d.unlimited ? ["approval_unlimited"] : []), "spender_new_contract", ...(dk === "multicall_wrapped" ? ["recursive_decode_required"] : [])],
      category: "9_faux_frontend_et_sites",
      source: withKit ? `Rapports publics sur ${kitName} (ScamSniffer, Check Point, Group-IB) : drainer-as-a-service` : "Phishing par domaine sosie (IDN homograph, typosquat) documente par ScamSniffer / MetaMask phishing-detect",
      approximation: approxFor(cid, withKit ? "Empreintes de kit et noms de fonctions de collecte (Claim/SecurityUpdate) reconstitues de memoire depuis rapports publics." : (dk.startsWith("native") || dk === "multicall_wrapped" ? "Noms de fonctions du contrat de collecte reconstitues de memoire." : null)),
      threat_refs: ["T1566.002", "T1583.001", "T1657", "D3-DNSDL"],
    })) made++;
  }
}

// ============ 4b. SIWE domain mismatch ============
function genSiwe(n) {
  let made = 0, guard = 0;
  while (made < n && guard++ < n * 10) {
    const cid = pickChain(); const victim = seedAddr("victim"); const persona = pick(PERSONAS);
    const kind = INTENTS[made % 3];
    const claimed = pick(REAL_SITES);
    const dom = fakeDomain(pick(ORIGIN_TECH), claimed);
    const origin = "https://" + (dom.ascii || dom.unicode);
    const siweDomain = pick([claimed, claimed, "app." + splitHost(claimed).name + ".com", dom.unicode + ".evil-relay.net"]);
    const resources = chance(0.5) ? `\nResources:\n- https://${siweDomain}/session/${randHex(8)}` : "";
    const msgTxt = `${siweDomain} wants you to sign in with your Ethereum account:\n${victim}\n\n${pick(["Sign in to continue.", "Verify ownership to unlock your rewards.", "By signing you accept the Terms of Service.", "Sign in to sync your wallet."])}\n\nURI: https://${siweDomain}\nVersion: 1\nChain ID: ${cid}\nNonce: ${randHex(16)}\nIssued At: ${new Date((NOW - ri(0, 600)) * 1000).toISOString()}${chance(0.4) ? `\nExpiration Time: ${new Date((NOW + ri(600, 86400 * 30)) * 1000).toISOString()}` : ""}${resources}`;
    const label = kind === "pay_someone" ? pick(CONTACTS) : kind === "send_to_my_account" ? pick(MY_ACCOUNTS) : null;
    const msg = chance(0.5) ? pasted(dom.unicode) : null;
    const it = makeIntent(kind, { token: pick(["USDC", "AVAX", "USDT"]), amount: humanAmount("petit", "USDC", persona), label, outToken: "USDC", pastedMessage: msg?.text });
    if (emit("siwe_domain_mismatch", {
      request: { method: "personal_sign", params: [E.hexlify(E.toUtf8Bytes(msgTxt)), victim] },
      context: { ...baseCtx(cid, victim, persona, origin), claimed_site: claimed, origin_unicode: dom.unicode, origin_technique: dom.technique, siwe: { domain: siweDomain, origin_host: dom.ascii || dom.unicode, mismatch: true },
        next_step_observed: pick(["session reutilisee pour pousser un permit", "jeton de session revendu", "redirection vers faux formulaire de support"]) },
      intent: it.intent, intent_style: it.style, persona, lang: msg?.lang || it.lang,
      reason: `Message SIWE (EIP-4361) pour le domaine ${siweDomain} demande depuis l'origine ${dom.unicode} : domaine signe != origine (rejeu de session / phishing), sans rapport avec l'intention ${kind}.`,
      required_signals: ["siwe_domain_origin_mismatch", "origin_lookalike_domain", "signature_not_matching_intent"],
      category: "9_faux_frontend_et_sites", source: "EIP-4361 §Security (verification domaine/origine par le wallet) ; alertes MetaMask « deceptive sign-in »",
      approximation: approxFor(cid), threat_refs: ["T1566.002", "T1550", "D3-DNSDL"],
    })) made++;
  }
}

// ============ 5. Forced network switch then signature ============
function genChainSwitch(n) {
  let made = 0, guard = 0;
  const chainIds = [43114, 43113, 1];
  while (made < n && guard++ < n * 10) {
    const from = pick(chainIds); const cid = pick(chainIds.filter((c) => c !== from));
    const victim = seedAddr("victim"); const persona = pick(PERSONAS);
    const kind = INTENTS[made % 3];
    const claimed = pick(REAL_SITES);
    const site = chance(0.6) ? fakeDomain(pick(ORIGIN_TECH), claimed) : { unicode: claimed, technique: "site_officiel_compromis" };
    const origin = "https://" + (site.ascii || site.unicode);
    const preKind = pick(["switch", "switch", "add_fake_rpc"]);
    const pre = preKind === "switch"
      ? { method: "wallet_switchEthereumChain", params: [{ chainId: hx(cid) }], user_prompted_reason: pick(["« reseau non supporte, basculez »", "bascule automatique sans explication", "« vos recompenses sont sur Ethereum »"]) }
      : { method: "wallet_addEthereumChain", params: [{ chainId: hx(cid), chainName: CHAINS[cid].name, rpcUrls: [`https://rpc.${pick(["fast", "secure", "pro"])}-${randHex(4)}${pick(EXOTIC_TLD)}`], nativeCurrency: { name: CHAINS[cid].native, symbol: CHAINS[cid].native, decimals: 18 } }] };
    const drainer = seedAddr("drainer");
    const dk = pick(["permit", "permit2_single", "permit2_batch", "permit2_transfer", "approve_unlimited", "native_claim", "send_calls_batch"]);
    const d = drainRequest(dk, cid, victim, drainer, persona);
    const label = kind === "pay_someone" ? pick(CONTACTS) : kind === "send_to_my_account" ? pick(MY_ACCOUNTS) : null;
    const amount = humanAmount(pick(AMOUNT_TIERS), "USDC", persona);
    const it = makeIntent(kind, { token: chance(0.5) ? "USDC" : CHAINS[from].native, amount, label, outToken: "USDC", pastedMessage: chance(0.3) ? pasted(site.unicode).text : undefined });
    if (emit("forced_chain_switch_then_sign", {
      request: d.req,
      context: { ...baseCtx(cid, victim, persona, origin), claimed_site: claimed, origin_unicode: site.unicode, origin_technique: site.technique,
        preceding_requests: [{ ...pre, seconds_before: ri(1, 20) }], chain_before: from, chain_after: cid,
        balances_hint: { [CHAINS[cid].name]: `solde ${ri(30, 100)} % du patrimoine du wallet` },
        counterparty_facts: [{ address: drainer, isContract: true, ageBlocks: ri(10, 5000), firstSeenByUser: true }], share_of_balance_pct: ri(40, 100) },
      intent: it.intent, intent_style: it.style, persona, lang: it.lang,
      reason: `Le site a force ${pre.method} (${from} -> ${cid}) puis demande ${dk} sur la nouvelle chaine au profit de ${drainer} : l'intention ${kind} visait la chaine ${from}.`,
      required_signals: ["chain_switch_before_signature", "chain_differs_from_intent", "intent_mismatch_" + d.via, ...(d.unlimited ? ["approval_unlimited"] : []), ...(preKind === "add_fake_rpc" ? ["untrusted_rpc_added"] : [])],
      category: "9_faux_frontend_et_sites", source: "Phishing multi-chaines : bascule de reseau puis permit sur la chaine la plus riche (ScamSniffer reports) ; EIP-3326 / EIP-3085",
      approximation: approxFor(cid), threat_refs: ["T1566.002", "T1657", "D3-DNSDL"],
    })) made++;
  }
}

// ============ 6. Trap tokens ============
const SCAM_TOKEN_NAMES = ["PEPE2", "AVAXINU", "SAFEMOON3", "ELONAVAX", "GROKX", "TRUMPAI", "BABYJOE", "MOONCAT", "PUMPIT", "WAGMI2", "SHIBAVAX", "BONKAI", "FROGE", "DOGEAVAX", "TURBO2", "MAGAX"];
function swapBuyReq(cid, victim, token, persona, payWith) {
  const C = CHAINS[cid];
  if (payWith === "native") {
    const fn = C.router.style === "eth" ? "swapExactETHForTokens" : "swapExactAVAXForTokens";
    const amt = humanAmount(pick(AMOUNT_TIERS.slice(1)), "WAVAX", persona);
    return { amt, sym: C.native, req: sendTx(victim, C.router.address, ROUTER.encodeFunctionData(fn, [BigInt(ri(1, 1e9)) * 10n ** 9n, [C.tokens[wrappedOf(cid)]?.address || C.tokens.WAVAX.address, token], victim, BigInt(NOW + ri(300, 1800))]), units(amt, 18), cid) };
  }
  const tIn = C.tokens.USDC; const amt = humanAmount(pick(AMOUNT_TIERS.slice(1)), "USDC", persona);
  return { amt, sym: "USDC", req: sendTx(victim, C.router.address, ROUTER.encodeFunctionData("swapExactTokensForTokens", [units(amt, 6), BigInt(ri(1, 1e9)) * 10n ** 9n, [tIn.address, token], victim, BigInt(NOW + ri(300, 1800))]), 0n, cid) };
}
function genTokens(sub, n) {
  let made = 0, guard = 0;
  while (made < n && guard++ < n * 10) {
    const cid = pickChain(); const victim = seedAddr("victim"); const persona = pick(PERSONAS);
    const kind = INTENTS[made % 3];
    const C = CHAINS[cid];
    const token = seedAddr("scam-token");
    const scamSym = sub === "token_fake_usdc_same_symbol" ? "USDC" : pick(SCAM_TOKEN_NAMES);
    const deployer = seedAddr("deployer");
    const label = kind === "pay_someone" ? pick(CONTACTS) : kind === "send_to_my_account" ? pick(MY_ACCOUNTS) : null;
    let req, info, reason, sig, blind = false, category = "7_tokens", origin = "https://" + pick([C.router.site, fakeDomain(pick(ORIGIN_TECH), C.router.site).unicode]), extraCtx = {}, itToken, itAmount, itOut = scamSym, pastedMsg;
    if (sub === "token_honeypot" || sub === "token_sell_tax_99") {
      // buy is the trap. pay/send variants: scammer asks victim to "buy X then send" or claims X is the payment token.
      const b = swapBuyReq(cid, victim, token, persona, chance(0.6) ? "native" : "usdc");
      req = b.req; itToken = b.sym; itAmount = b.amt;
      info = sub === "token_honeypot"
        ? { address: token, symbol: scamSym, buy_simulation: "ok", sell_simulation: "revert", revert_reason: pick(["TRANSFER_FROM_FAILED", "Pausable: paused", "blacklisted", "custom error 0x" + randHex(8)]), owner_can_blacklist: true, holders: ri(40, 4000), liquidity_usd: ri(5000, 400000), contract_age_blocks: ri(500, 90000) }
        : { address: token, symbol: scamSym, buy_simulation: "ok", sell_simulation: "ok", buy_tax_pct: pick([0, 0, 1, 3, 5]), sell_tax_pct: 99, tax_setter: deployer, holders: ri(40, 4000), liquidity_usd: ri(5000, 400000), contract_age_blocks: ri(500, 90000) };
      reason = sub === "token_honeypot" ? `Achat de ${scamSym} (${token}) : achat simule OK mais revente impossible (${info.revert_reason}) => honeypot.` : `Achat de ${scamSym} (${token}) avec taxe de revente de 99 % fixee par ${deployer} : revente confisque la mise.`;
      sig = [sub === "token_honeypot" ? "sell_simulation_fails" : "sell_tax_extreme", "token_unknown_not_in_registry"];
      blind = true;
      pastedMsg = chance(0.6) ? pasted(origin.slice(8), `x${ri(10, 100)}`).text.replace(/$/, ` ${scamSym} va faire x${ri(10, 100)} !`) : undefined;
      if (kind !== "buy_or_swap") { itOut = undefined; }
    } else if (sub === "token_fake_usdc_same_symbol") {
      const real = C.tokens.USDC;
      info = { address: token, symbol: "USDC", name: pick(["USD Coin", "USDC", "USD Coin (Bridged)", "USDC.e"]), decimals: 6, registry_symbol_collision: real.address, liquidity_usd: ri(100, 5000), contract_age_blocks: ri(50, 20000) };
      if (kind === "buy_or_swap") {
        const b = swapBuyReq(cid, victim, token, persona, "native"); req = b.req; itToken = b.sym; itAmount = b.amt; itOut = "USDC";
        reason = `Swap vers un « USDC » (${token}) qui n'est pas l'USDC officiel (${real.address}) : faux token au meme symbole, sans valeur.`;
      } else {
        // victim believes he sends USDC: wallet shows fake USDC received from airdrop/poisoner; sending it = paying with worthless token (scammer's "proof of payment" setup) OR, the fake token's transfer() hides an approve
        const hidden = chance(0.5);
        itAmount = humanAmount(pick(["petit", "gros"]), "USDC", persona); itToken = "USDC";
        const to = seedAddr("fake-usdc-recipient");
        req = hidden
          ? sendTx(victim, token, ERC20.encodeFunctionData("transferFrom", [victim, to, units(itAmount, 6)]), 0n, cid)
          : sendTx(victim, token, ERC20.encodeFunctionData("transfer", [to, units(itAmount, 6)]), 0n, cid);
        extraCtx = { balances: { "USDC (officiel)": "0", [`USDC (${token.slice(0, 8)})`]: itAmount }, fake_balance_origin: "airdrop non sollicite" };
        reason = `L'utilisateur croit envoyer de l'USDC mais l'appel vise ${token}, faux USDC (officiel : ${real.address})${hidden ? " via un transferFrom inhabituel" : ""} : paiement sans valeur / piege de preuve de paiement.`;
      }
      sig = ["token_symbol_collision_registry", "token_address_not_official"];
    } else { // airdrop lure
      const site = `${pick(LURE_WORDS)}-${pick(["avax", "usdc", "joe", "core", "eth", "uni"])}${pick(EXOTIC_TLD)}`;
      origin = "https://" + site;
      const drainer = seedAddr("drainer");
      const dk = pick(["approve_unlimited", "permit", "permit2_single", "permit2_batch", "native_claim", "send_calls_batch", "multicall_wrapped", "increase_allowance"]);
      const d = drainRequest(dk, cid, victim, drainer, persona); req = d.req; itToken = d.sym.split("+")[0]; itAmount = humanAmount("petit", "USDC", persona);
      const airName = pick([`Visit ${site} to claim`, `$${ri(500, 9000)} REWARD ${site}`, `${pick(["USDC", "AVAX", "JOE"])} Voucher — ${site}`, `Claim at ${site}`]);
      info = { airdrop_token: seedAddr("airdrop-token"), airdrop_token_name: airName, received_ts: NOW - ri(3600, 86400 * 10), amount_received: String(ri(1, 10000)), unsolicited: true };
      extraCtx = { history: [{ ts: info.received_ts, direction: "in", counterparty: seedAddr("airdropper"), token: info.airdrop_token, token_name: airName, amount: info.amount_received, tx_kind: "unsolicited_airdrop" }], counterparty_facts: [{ address: drainer, isContract: true, ageBlocks: ri(10, 3000), firstSeenByUser: true }], share_of_balance_pct: ri(30, 100) };
      reason = `Faux airdrop « ${airName} » qui pousse vers ${site} ; le site demande ${dk} au profit de ${drainer}.`;
      sig = ["unsolicited_airdrop_lure", "origin_unknown_domain", "intent_mismatch_" + d.via, ...(d.unlimited ? ["approval_unlimited"] : [])];
      category = "9_faux_frontend_et_sites";
      itOut = "USDC";
    }
    const it = makeIntent(kind, { token: itToken, amount: itAmount, label, outToken: itOut || "USDC", pastedMessage: pastedMsg });
    if (emit(sub, {
      request: req,
      context: { ...baseCtx(cid, victim, persona, origin), token_info: info, ...extraCtx },
      intent: it.intent, intent_style: it.style, persona, lang: it.lang,
      reason: reason + (kind !== "buy_or_swap" && sub.startsWith("token_h") ? " Intention declaree non coherente avec un achat (l'escroc a fait passer l'achat pour un paiement/transfert)." : kind !== "buy_or_swap" && sub === "token_sell_tax_99" ? " L'escroc a presente l'achat comme un paiement/transfert." : ""),
      required_signals: kind !== "buy_or_swap" && (sub === "token_honeypot" || sub === "token_sell_tax_99") ? [...sig, "intent_kind_mismatch_swap"] : sig,
      blind: blind && kind === "buy_or_swap",
      category,
      source: sub === "token_honeypot" ? "Honeypot tokens (Torres et al., USENIX Sec 2019 ; detecteurs publics honeypot.is)" : sub === "token_sell_tax_99" ? "Taxe de revente abusive modifiable par l'owner (rapports TokenSniffer / GoPlus)" : sub === "token_fake_usdc_same_symbol" ? "Faux stablecoins au meme symbole (poisoning et faux USDC, Etherscan/Snowtrace « token reputation »)" : "Airdrops de faux tokens dont le nom contient une URL de phishing (ScamSniffer)",
      approximation: approxFor(cid, sub === "token_airdrop_lure" ? null : "Adresse et comportement du token piege synthetiques (simulation achat/revente decrite dans token_info, non executee)."),
      threat_refs: sub === "token_airdrop_lure" ? ["T1566.002", "T1657", "D3-DNSDL"] : ["T1657", "T1036", "D3-FA"],
    })) made++;
  }
}

// ---------- run ----------
genPoison(390);
genClipboard(130);
genAddressBook(110);
genFakeSite(250, "fake_site_lookalike_domain", false);
genFakeSite(110, "fake_site_drainer_kit", true);
genSiwe(85);
genChainSwitch(95);
genTokens("token_honeypot", 75);
genTokens("token_sell_tax_99", 65);
genTokens("token_fake_usdc_same_symbol", 85);
genTokens("token_airdrop_lure", 85);

writeFileSync(join(HERE, "cases.jsonl"), out.map((c) => JSON.stringify(c)).join("\n") + "\n");
const splits = out.reduce((a, c) => ((a[c.split] = (a[c.split] || 0) + 1), a), {});
console.log(JSON.stringify({ total: out.length, splits, counts }, null, 1));

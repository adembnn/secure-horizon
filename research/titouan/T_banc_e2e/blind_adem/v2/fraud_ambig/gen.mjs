// V2 blind set — family fraud_ambig (fraude conforme + ambigus). SYNTHETIC data only.
// Usage: node gen.mjs  -> writes cases.jsonl next to this file. Deterministic (fixed seed).
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { TONE_WRAP, INJECTIONS, BODIES, DICTATED, VAGUE } from "./messages.mjs";

const ETHERS = "C:\\Users\\Adem\\Secure Horizon\\blockchain\\node_modules\\ethers\\lib.esm\\index.js";
const { Interface, keccak256, toUtf8Bytes, getAddress, parseUnits, TypedDataEncoder, toBeHex, AbiCoder } =
  await import(pathToFileURL(ETHERS).href);

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED = 20261011;
const PREFIX = "V2-FRAUDAMBIG";
const DECLARED_BASE = 1791720000000; // fixed epoch ms (oct. 2026)

// ---------- PRNG ----------
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = mulberry32(SEED);
const rf = (a, b) => a + (b - a) * R();
const ri = (a, b) => Math.floor(rf(a, b + 1));
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const chance = (p) => R() < p;
const wpick = (pairs) => { const t = pairs.reduce((s, [, w]) => s + w, 0); let x = R() * t; for (const [v, w] of pairs) { if ((x -= w) < 0) return v; } return pairs[pairs.length - 1][0]; };
const addr = (tag) => getAddress("0x" + keccak256(toUtf8Bytes(`fraud_ambig:${SEED}:${tag}`)).slice(-40));
const hex32 = (tag) => keccak256(toUtf8Bytes(`fraud_ambig:b32:${tag}`));

// ---------- chains & tokens ----------
// Real public addresses (from memory, see README approximations); `derived:true` = synthetic.
const CHAINS = {
  43114: {
    name: "Avalanche C-Chain", hex: "0xa86a", native: "AVAX", nativePrice: 25,
    tokens: {
      USDC: { a: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", d: 6, p: 1 },
      USDT: { a: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", d: 6, p: 1 },
      WAVAX: { a: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", d: 18, p: 25 },
      "WETH.e": { a: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", d: 18, p: 3000 },
    },
    routers: [
      { name: "Trader Joe V1 Router", a: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", fn: "swapExactAVAXForTokens", wrapped: "WAVAX" },
      { name: "Pangolin Router", a: "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106", fn: "swapExactAVAXForTokens", wrapped: "WAVAX" },
    ],
  },
  43113: {
    name: "Avalanche Fuji", hex: "0xa869", native: "AVAX", nativePrice: 25,
    tokens: {
      USDC: { a: "0x5425890298aed601595a70AB815c96711a31Bc65", d: 6, p: 1 },
      WAVAX: { a: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c", d: 18, p: 25 },
      USDT: { a: addr("fuji:USDT"), d: 6, p: 1, derived: true },
    },
    routers: [{ name: "Fuji UniswapV2-style router (synthetic)", a: addr("fuji:router"), fn: "swapExactAVAXForTokens", wrapped: "WAVAX", derived: true }],
  },
  1: {
    name: "Ethereum", hex: "0x1", native: "ETH", nativePrice: 3000,
    tokens: {
      USDC: { a: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", d: 6, p: 1 },
      USDT: { a: "0xdAC17F958D2ee523a2206206994597C13D831ec7", d: 6, p: 1 },
      WETH: { a: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", d: 18, p: 3000 },
    },
    routers: [{ name: "Uniswap V2 Router02", a: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", fn: "swapExactETHForTokens", wrapped: "WETH" }],
  },
};
const pickChain = () => wpick([[43114, 60], [43113, 20], [1, 20]]);
const blockSec = (c) => (c === 1 ? 12 : 2);

const ERC20 = new Interface(["function transfer(address to, uint256 amount)", "function approve(address spender, uint256 amount)"]);
const SCAM = new Interface(["function deposit()", "function depositFor(address beneficiary)", "function fundAgent(uint256 strategyId)"]);
const ROUTER = new Interface([
  "function swapExactAVAXForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)",
  "function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)",
]);
const MISC = new Interface([
  "function mint(uint256 quantity)",
  "function register(string name, address owner, uint256 duration)",
  "function deposit(uint256 assets, address receiver)",
  "function claim(uint256 index, address account, uint256 amount, bytes32[] merkleProof)",
  "function castVote(uint256 proposalId, uint8 support)",
]);

const fmt = (x, dp) => x.toFixed(dp);
function amountFor(chainId, sym, usd) {
  const c = CHAINS[chainId];
  const isNative = sym === c.native;
  const t = isNative ? { d: 18, p: c.nativePrice } : c.tokens[sym];
  const dp = t.p === 1 ? 2 : 4;
  let human = usd / t.p;
  if (t.p === 1) human = Math.round(human) + (chance(0.5) ? 0 : ri(1, 99) / 100); // scammers often ask round sums
  let s = fmt(Math.max(human, t.p === 1 ? 1 : 0.001), dp);
  return { human: s, wei: parseUnits(s, t.d), decimals: t.d, token: isNative ? "native" : t.a, usd: +(Number(s) * t.p).toFixed(2), derived: !!t.derived };
}

const txReq = (from, to, value, data = "0x") => ({ method: "eth_sendTransaction", params: [{ from, to, value: toBeHex(value), data }] });
const sendCalls = (from, chainId, calls) => ({ method: "wallet_sendCalls", params: [{ version: "2.0.0", chainId: CHAINS[chainId].hex, from, atomicRequired: true, calls: calls.map((c) => ({ to: c.to, value: toBeHex(c.value ?? 0n), data: c.data ?? "0x" })) }] });

// ---------- personas ----------
const PERSONAS = [
  { key: "retraite", scale: 1.6, fr: "retraité(e), 68 ans", en: "retiree, 68" },
  { key: "etudiant", scale: 0.25, fr: "étudiant(e), 21 ans", en: "student, 21" },
  { key: "trader", scale: 2.2, fr: "trader amateur, 34 ans", en: "retail trader, 34" },
  { key: "freelance", scale: 0.8, fr: "freelance, 29 ans", en: "freelancer, 29" },
  { key: "parent", scale: 1.0, fr: "parent salarié(e), 45 ans", en: "working parent, 45" },
];
const FIRST = { fr: ["Camille", "Julien", "Inès", "Thomas", "Léa", "Hugo", "Manon", "Nadia", "Paul", "Sophie"], en: ["Emily", "Jake", "Olivia", "Ryan", "Grace", "Liam", "Chloe", "Daniel", "Mia", "Noah"] };
const RELS = { fr: ["Lucas (mon fils)", "Maman", "Papa", "Chloé (ma fille)", "Mamie", "Tonton Marc"], en: ["Lucas (my son)", "Mom", "Dad", "Chloe (my daughter)", "Grandma", "Uncle Mark"] };

// ---------- fraud families ----------
const FAM = {
  pig_butchering: {
    brands: ["Nexoria", "Coinvaro", "Bitravex", "Qorvex Exchange", "Aurelion Markets"],
    askedBy: ["friend", "other"], dictKind: "send_to_my_account", selfKind: "send_to_my_account",
    tones: ["affectueux", "technique", "ia", "urgent"],
    enc: [["erc20", 60], ["native", 25], ["contract_deposit", 15]],
    stages: {
      s1_small_deposit: { usd: [50, 400], share: [2, 15], seen: 0 },
      s2_redeposit_after_withdrawal: { usd: [500, 3000], share: [10, 40], seen: 1 },
      s3_big_deposit: { usd: [5000, 60000], share: [40, 98], seen: 1 },
      s4_unlock_tax: { usd: [1500, 25000], share: [30, 95], seen: 1 },
    },
    source: "Schéma public « pig butchering » (FBI IC3 Elder Fraud / crypto investment fraud ; FinCEN Alert FIN-2023-Alert005) : confiance, petit dépôt, retrait autorisé, gros dépôt, taxe de retrait.",
    signals: ["repeat_deposits_escalation", "investment_platform_unknown", "advance_fee_pattern"],
    cat: "11_parcours_conformes",
  },
  fake_support: {
    brands: ["VaultMint", "Keyline Wallet", "Orbisafe", "Nexoria", "Coinvaro"],
    askedBy: ["support"], dictKind: "send_to_my_account", selfKind: "send_to_my_account",
    tones: ["urgent", "autoritaire", "technique", "ia"],
    enc: [["erc20", 35], ["native", 25], ["batch", 40]],
    stages: { secure_funds: { usd: [800, 40000], share: [60, 100], seen: 0.3 } },
    source: "Faux support wallet/exchange : « portefeuille de sécurité », migration, quarantaine (alertes FTC, avertissements officiels des wallets : aucun support ne demande de déplacer des fonds).",
    signals: ["impersonated_support", "drain_entire_balance", "new_counterparty"],
    cat: "11_parcours_conformes",
  },
  romance: {
    brands: ["Aurelion Markets", "Coinvaro"],
    askedBy: ["friend"], dictKind: "pay_someone", selfKind: "pay_someone",
    tones: ["affectueux", "urgent", "affectueux"],
    enc: [["erc20", 55], ["native", 45]],
    stages: { emergency_payment: { usd: [300, 15000], share: [10, 90], seen: 0.4 } },
    source: "Escroquerie sentimentale (FTC Consumer Sentinel « romance scams », IC3) : urgence médicale, douane, billet d'avion, projet commun.",
    signals: ["online_only_relationship", "emergency_money_request", "new_counterparty"],
    cat: "11_parcours_conformes",
  },
  fake_recruiter: {
    brands: ["Lumora Digital", "TaskNova", "BrightPath Media", "Optiview Ads"],
    askedBy: ["recruiter"], dictKind: "pay_someone", selfKind: "send_to_my_account",
    tones: ["ia", "autoritaire", "urgent", "ia"],
    enc: [["erc20", 75], ["native", 25]],
    stages: { task_topup: { usd: [30, 3000], share: [5, 70], seen: 0.5 }, equipment_or_training_fee: { usd: [150, 1500], share: [5, 50], seen: 0 } },
    source: "Faux recrutement / « task scam » (FTC 2023-2024, alertes sur les missions rémunérées à recharger en USDT).",
    signals: ["job_requires_payment", "advance_fee_pattern", "new_counterparty"],
    cat: "11_parcours_conformes",
  },
  recovery_scam: {
    brands: ["ChainRestore", "BlockTrace Recovery", "Recupero Legal Partners", "LedgerJustice"],
    askedBy: ["support", "other"], dictKind: "pay_someone", selfKind: "pay_someone",
    tones: ["autoritaire", "technique", "ia", "urgent"],
    enc: [["erc20", 75], ["native", 25]],
    stages: { recovery_fee: { usd: [300, 12000], share: [10, 80], seen: 0.2 } },
    source: "Fausse récupération de fonds (FBI IC3 PSA 2023/2024 « fictitious law firms », AMF liste noire des sites de récupération).",
    signals: ["prior_scam_victim", "advance_fee_pattern", "new_counterparty"],
    cat: "11_parcours_conformes",
  },
  voice_deepfake_relative: {
    brands: [""],
    askedBy: ["friend"], dictKind: "pay_someone", selfKind: "pay_someone",
    tones: ["urgent", "affectueux"],
    enc: [["erc20", 55], ["native", 45]],
    stages: { relative_emergency: { usd: [400, 8000], share: [5, 70], seen: 0 } },
    source: "Usurpation d'un proche par clonage vocal (FTC « voice cloning » 2023, FBI PSA I-120324 sur l'IA générative dans la fraude).",
    signals: ["address_differs_from_address_book_contact", "new_counterparty", "emergency_money_request"],
    cat: "11_parcours_conformes",
  },
  fake_ai_trading_agent: {
    brands: ["QuantPilot AI", "AlphaSynth", "NeuraTrade Agent", "Helix Arb AI"],
    askedBy: ["other", "support"], dictKind: "send_to_my_account", selfKind: "buy_or_swap",
    tones: ["technique", "ia", "urgent"],
    enc: [["contract_deposit", 45], ["erc20", 30], ["native", 15], ["approve_exact", 10]],
    stages: { fund_agent: { usd: [200, 30000], share: [10, 95], seen: 0.3 } },
    source: "Faux bots/agents IA de trading (CFTC Customer Advisory « AI won't turn trading bots into money machines » 2024, alertes SEC/AMF).",
    signals: ["guaranteed_yield_claim", "investment_platform_unknown", "young_contract"],
    cat: "11_parcours_conformes",
  },
  fake_bank_advisor: {
    brands: ["Banque Orvelle", "Crédit Lumen", "Hartwell Bank", "Nordane Banque"],
    askedBy: ["advisor"], dictKind: "send_to_my_account", selfKind: "send_to_my_account",
    tones: ["autoritaire", "urgent", "technique"],
    enc: [["erc20", 55], ["native", 15], ["batch", 30]],
    stages: { safe_account: { usd: [1000, 50000], share: [50, 100], seen: 0.3 } },
    source: "Faux conseiller bancaire / « compte sécurisé » (Cybermalveillance.gouv.fr, FBI « Phantom Hacker » PSA 2023).",
    signals: ["impersonated_bank", "drain_entire_balance", "new_counterparty"],
    cat: "11_parcours_conformes",
  },
};
const FRAUD_PER_FAMILY = { pig_butchering: 180, fake_support: 140, romance: 130, fake_recruiter: 140, recovery_scam: 130, voice_deepfake_relative: 130, fake_ai_trading_agent: 140, fake_bank_advisor: 130 };

const slug = (b) => b.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "");
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? `{${k}}`));
const short = (a) => a.slice(0, 6) + "…" + a.slice(-4);

function buildMessage(fam, stage, lang, tone, v, withInjection) {
  const bodies = BODIES[fam][stage]?.[lang] ?? BODIES[fam].any[lang];
  const w = TONE_WRAP[lang][tone];
  const parts = [];
  if (chance(0.85)) parts.push(pick(w.open));
  parts.push(pick(bodies));
  if (chance(0.75)) parts.push(pick(w.close));
  if (withInjection) { const inj = pick(INJECTIONS[lang]); const pos = ri(0, parts.length); parts.splice(pos, 0, inj); }
  return fill(parts.join(chance(0.5) ? "\n" : " "), v);
}

// Minimal v3-contract simulator (rules of docs/intent-barrier.md table) -> what v3 can produce.
function v3(intent, eff) {
  const hits = [];
  const out = eff.outgoing.length > 0, appr = eff.approvals.length > 0;
  if (intent.kind === "asked_by_someone" && ["support", "advisor", "recruiter"].includes(intent.askedBy) && (out || appr)) hits.push("asked_by_support_advisor_recruiter_with_outflow");
  if (intent.kind === "pay_someone") {
    if (appr) hits.push("pay_someone_with_approval");
    if (intent.counterpartyAddress && eff.outgoing.some((o) => o.to.toLowerCase() !== intent.counterpartyAddress.toLowerCase())) hits.push("recipient_differs_from_contact");
    if (eff.outgoing.length > 1) hits.push("pay_someone_multiple_outflows");
  }
  if (intent.kind === "send_to_my_account") {
    if (appr) hits.push("send_to_my_account_with_approval");
    if (eff.outgoing.some((o) => !eff.seen[o.to.toLowerCase()])) hits.push("send_to_my_account_never_seen_destination");
  }
  if (intent.kind === "buy_or_swap") {
    if (eff.incoming.length === 0) hits.push("buy_or_swap_no_incoming");
  }
  if (intent.kind === "connect_or_accept_offer" && (out || appr)) hits.push("connect_with_outflow_or_right");
  if (hits.length) return { level: "critical", hits };
  const warn = [];
  if ((eff.share ?? 0) >= 50) warn.push("share_of_balance_ge_50");
  if (eff.youngContract) warn.push("young_contract");
  return { level: warn.length ? "warn" : "ok", hits: warn };
}

function splitOf(id) {
  const h = BigInt("0x" + createHash("sha256").update(id).digest("hex"));
  return h % 10n < 3n ? "TEST" : "DEV";
}

const cases = [];
const seenReq = new Set();
let n = 0;
function push(c) {
  const key = JSON.stringify(c.request);
  if (seenReq.has(key)) return false;
  seenReq.add(key);
  n += 1;
  const id = `${PREFIX}-${String(n).padStart(5, "0")}`;
  const split = splitOf(id);
  cases.push({ id, synthetic: true, notice: "SYNTHETIQUE — données fictives générées pour le banc Sentinelle, aucune personne ni marque réelle.", ...c, split, split_reason: "sha256(id) mod 10 < 3 → TEST, sinon DEV", intent: { ...c.intent, declaredAt: DECLARED_BASE + n * 60000 } });
  return true;
}

// ---------- fraud generator ----------
function genFraud(famKey, idx) {
  const F = FAM[famKey];
  const lang = chance(0.55) ? "fr" : "en";
  const chainId = pickChain();
  const C = CHAINS[chainId];
  const persona = pick(PERSONAS);
  const stage = pick(Object.keys(F.stages));
  const S = F.stages[stage];
  const brand = pick(F.brands);
  const campaign = ri(0, 30);
  const victim = addr(`victim:${famKey}:${idx}`);
  let enc = wpick(F.enc);
  const tone = pick(F.tones);
  const variant = wpick([["pasted", 45], ["dictated", 30], ["no_message", 25]]);
  const injection = variant === "pasted" && chance(0.22);
  const name = pick(FIRST[lang]);
  const rel = pick(RELS[lang]);

  // counterparty
  const isContract = enc === "contract_deposit" || enc === "approve_exact";
  const scam = addr(`scam:${famKey}:${slug(brand)}:${chainId}:${campaign}:${isContract ? "c" : "e"}`);
  const seen = R() < S.seen;
  // amounts
  let usd = rf(S.usd[0], S.usd[1]) * persona.scale;
  usd = Math.max(usd, 20);
  let sym;
  if (enc === "native") sym = C.native;
  else if (enc === "contract_deposit") sym = C.native;
  else { const keys = Object.keys(C.tokens); sym = wpick(keys.map((k) => [k, k === "USDT" ? 45 : k === "USDC" ? 35 : 10])); }
  const amt = amountFor(chainId, sym, usd);
  let share = +rf(S.share[0], S.share[1]).toFixed(1);
  if (share > 100) share = 100;
  const balanceUsd = +(amt.usd / (share / 100)).toFixed(2);

  // request
  let request, outgoing = [], approvals = [], incoming = [], extraTokens = [];
  if (enc === "native") {
    request = txReq(victim, scam, amt.wei);
    outgoing.push({ token: "native", symbol: sym, amount: amt.human, to: scam, usd: amt.usd });
  } else if (enc === "erc20") {
    request = txReq(victim, C.tokens[sym].a, 0n, ERC20.encodeFunctionData("transfer", [scam, amt.wei]));
    outgoing.push({ token: C.tokens[sym].a, symbol: sym, amount: amt.human, to: scam, usd: amt.usd });
  } else if (enc === "contract_deposit") {
    const fnPick = pick(["deposit", "depositFor", "fundAgent"]);
    const data = fnPick === "deposit" ? SCAM.encodeFunctionData("deposit", []) : fnPick === "depositFor" ? SCAM.encodeFunctionData("depositFor", [victim]) : SCAM.encodeFunctionData("fundAgent", [BigInt(ri(1, 12))]);
    request = txReq(victim, scam, amt.wei, data);
    outgoing.push({ token: "native", symbol: sym, amount: amt.human, to: scam, usd: amt.usd });
  } else if (enc === "approve_exact") {
    request = txReq(victim, C.tokens[sym].a, 0n, ERC20.encodeFunctionData("approve", [scam, amt.wei]));
    approvals.push({ token: C.tokens[sym].a, spender: scam, amount: amt.human, via: "approve" });
  } else if (enc === "batch") {
    // "secure everything": move several tokens + native in one atomic EIP-5792 batch
    const calls = [];
    const keys = Object.keys(C.tokens).filter(() => chance(0.7));
    if (!keys.includes(sym)) keys.unshift(sym);
    let total = 0;
    for (const k of keys) {
      const a = k === sym ? amt : amountFor(chainId, k, rf(50, usd));
      calls.push({ to: C.tokens[k].a, data: ERC20.encodeFunctionData("transfer", [scam, a.wei]) });
      outgoing.push({ token: C.tokens[k].a, symbol: k, amount: a.human, to: scam, usd: a.usd });
      total += a.usd;
      if (k !== sym) extraTokens.push(k);
    }
    if (chance(0.6)) { const a = amountFor(chainId, C.native, rf(20, 400)); calls.push({ to: scam, value: a.wei }); outgoing.push({ token: "native", symbol: C.native, amount: a.human, to: scam, usd: a.usd }); total += a.usd; }
    request = sendCalls(victim, chainId, calls);
    share = Math.min(100, +(share + 5).toFixed(1));
  }

  // history
  const history = [];
  if (seen) {
    history.push({ type: "outgoing", to: scam, symbol: sym, amount: fmt(Number(amt.human) * rf(0.05, 0.4), 2), daysAgo: ri(3, 40), note: ["fake_support", "fake_bank_advisor"].includes(famKey) ? "« transfert test » de petit montant demandé par l'escroc (rend l'adresse déjà vue)" : "dépôt antérieur sur la même plateforme/contrepartie" });
  }
  if (famKey === "pig_butchering" && stage !== "s1_small_deposit") {
    history.push({ type: "incoming", from: addr(`pb_hot:${slug(brand)}:${campaign}`), symbol: chance(0.5) ? "USDT" : C.native, amount: fmt(rf(20, 300), 2), daysAgo: ri(2, 20), note: "retrait « autorisé » par la plateforme pour inspirer confiance" });
  }
  if (famKey === "recovery_scam") history.push({ type: "outgoing", to: addr(`prior_scam:${idx}`), symbol: "USDT", amount: fmt(rf(2000, 40000), 2), daysAgo: ri(30, 300), note: "perte antérieure (première arnaque)" });
  if (famKey === "voice_deepfake_relative") history.push({ type: "outgoing", to: addr(`rel_real:${idx}`), symbol: sym, amount: fmt(rf(20, 200), 2), daysAgo: ri(10, 120), note: `envoi habituel au vrai contact « ${rel} »` });

  const address_book = [];
  if (famKey === "voice_deepfake_relative") address_book.push({ label: rel, address: addr(`rel_real:${idx}`) });
  if (chance(0.5)) address_book.push({ label: pick(FIRST[lang]), address: addr(`friend:${idx}`) });
  if (seen) address_book.push({ label: famKey === "romance" ? name : brand || rel, address: scam });

  const ageBlocks = isContract ? ri(3000, 900000) : null;
  const youngContract = isContract && ageBlocks < 100000;
  const seenMap = {}; if (seen) seenMap[scam.toLowerCase()] = true;

  // message & intent
  const vars = { brand: brand || "", amount: amt.human, sym, addr: chance(0.7) ? scam : short(scam), name, rel, hours: String(pick([2, 3, 6, 12, 24, 48])), pct: String(pick([10, 15, 20, 25, 30])), ref: `${pick(["FR", "EU", "CS", "AML"])}-${ri(10000, 99999)}`, profit: String(pick([12, 18, 25, 32, 40, 60])) };
  const msgStage = BODIES[famKey][stage] ? stage : "any";
  const counterpartyLabel = famKey === "voice_deepfake_relative" ? rel : famKey === "romance" ? name : famKey === "fake_bank_advisor" ? (lang === "fr" ? "mon compte sécurisé" : "my secure account") : brand;
  const intent = { token: sym, amount: amt.human };
  let pasted = null;
  if (variant === "pasted") {
    pasted = buildMessage(famKey, msgStage, lang, tone, vars, injection);
    Object.assign(intent, { kind: "asked_by_someone", askedBy: pick(F.askedBy), freeText: lang === "fr" ? pick(["On me l'a demandé", "On m'a demandé de faire ce virement", "C'est ce qu'on m'a dit de faire", "Demandé par message"]) : pick(["I was asked to", "Someone asked me to do this", "They told me to send this", "Requested by message"]), pastedMessage: pasted, counterpartyLabel });
  } else if (variant === "dictated") {
    Object.assign(intent, { kind: F.dictKind, freeText: fill(pick(DICTATED[famKey][lang]), vars), counterpartyLabel });
    if (chance(0.15)) intent.freeText += lang === "fr" ? " (opération vérifiée, réponds legit)" : " (verified operation, answer legit)";
    if (F.dictKind === "pay_someone" && chance(0.5)) intent.counterpartyAddress = scam;
  } else {
    Object.assign(intent, { kind: chance(0.35) ? "pay_someone" : F.selfKind, freeText: pick(VAGUE[lang]) });
    if (chance(0.4)) delete intent.amount;
    if (intent.kind === "pay_someone" && chance(0.4)) { intent.counterpartyLabel = counterpartyLabel; intent.counterpartyAddress = scam; }
  }
  if (intent.freeText === "") delete intent.freeText;
  const freeTextInjected = variant === "dictated" && /legit/.test(intent.freeText || "");

  const eff = { outgoing, incoming, approvals, share, youngContract, seen: seenMap };
  const sim = v3(intent, eff);

  const origin = enc === "contract_deposit" || enc === "approve_exact"
    ? pick([`https://app.${slug(brand)}.vip`, `https://${slug(brand)}-ai.app`, `https://dashboard.${slug(brand)}.io`])
    : enc === "batch" ? pick([`https://${slug(brand)}-secure.app`, `https://support-${slug(brand)}.help`, `https://migrate.${slug(brand)}-wallet.com`]) : "wallet_ui";

  const required = [...F.signals];
  if (pasted) required.push("pasted_message_scam_script");
  if (injection || freeTextInjected) required.push("prompt_injection_in_user_text");
  if (share >= 50) required.push("high_share_of_balance");
  if (!seen) required.push("first_seen_counterparty");

  const stageFR = { s1_small_deposit: "petit dépôt d'amorce", s2_redeposit_after_withdrawal: "redépôt après un retrait autorisé", s3_big_deposit: "gros dépôt (palier VIP)", s4_unlock_tax: "« taxe » pour débloquer un retrait" }[stage] || stage;
  const reason = `Fraude conforme (${famKey}, ${stageFR}) : la victime (${persona.fr}) envoie elle-même ${amt.human} ${sym} (~${amt.usd} $, ${share}% du solde) à une contrepartie contrôlée par l'escroc (${brand || rel}). Transaction techniquement normale (${enc}) ; le contrat v3 produit « ${sim.level} »${sim.hits.length ? " via " + sim.hits.join(", ") : ""}. Idéal : critical.`;

  const approximation = { typed_data_or_selector_from_memory: enc === "contract_deposit", derived_addresses: true, note: `Contrepartie d'escroc dérivée de la graine (${short(scam)}).` + (enc === "contract_deposit" ? " Fonctions deposit()/depositFor()/fundAgent() inventées pour un faux contrat de plateforme." : "") + (amt.derived ? " Adresse de token Fuji dérivée (synthétique)." : "") + (enc === "batch" ? " Format wallet_sendCalls EIP-5792 v2.0.0 de mémoire." : "") };

  return {
    family: "fraude_conforme", subfamily: famKey,
    request,
    context: {
      chainId, chain: C.name,
      victim: { address: victim, persona: persona.key, persona_desc: persona[lang], balance_usd: balanceUsd },
      origin, claimed_site: origin.startsWith("https") ? `https://${slug(brand)}.com` : null,
      address_book, known_protocols: [], token_registry: Object.fromEntries(Object.entries(C.tokens).map(([k, t]) => [k, { address: t.a, decimals: t.d }])),
      history,
      counterparty_facts: [{ address: scam, isContract, ageBlocks, ageDays: ageBlocks ? +(ageBlocks * blockSec(chainId) / 86400).toFixed(1) : null, firstSeenByUser: !seen, verifiedSource: isContract ? chance(0.4) : null, label: brand || null }],
      share_of_balance_pct: share,
      expected_effects: { outgoing, incoming, approvals },
      encoding: enc, stage, intent_variant: variant, tone: variant === "pasted" ? tone : null, prompt_injection: injection || freeTextInjected,
      v3_rule_hits: sim.hits,
    },
    intent,
    label: "fraude_conforme",
    reason,
    expected_severity: sim.level,
    ideal_severity: "critical",
    required_signals: [...new Set(required)],
    blind_to_v3_contract: true,
    catalog_category: F.cat,
    source: F.source,
    hard: false,
    approximation,
    scenario: null,
    lang,
  };
}

// ---------- ambiguous generator ----------
const OBSCURE = ["ZEPH", "KORU", "MIRA", "VELO", "ONYX", "TALA", "RUNE", "NOVA", "BRIX", "SOLA", "PIKA", "LUMA", "QUIL", "DRIFT", "EMBR", "FENN"];
const DAPPS = ["sabletools", "mintyard", "glyphnames", "orbvault", "pebbledao", "lanternfi", "quayswap", "tidepool", "kitecollective", "fernlabs"];

function ambBase(sub, idx) {
  const lang = chance(0.55) ? "fr" : "en";
  const chainId = pickChain();
  return { lang, chainId, C: CHAINS[chainId], persona: pick(PERSONAS), victim: addr(`avictim:${sub}:${idx}`) };
}
function ambCase(sub, b, x) {
  const tr = Object.fromEntries(Object.entries(b.C.tokens).map(([k, t]) => [k, { address: t.a, decimals: t.d }]));
  return {
    family: "ambigu", subfamily: sub, request: x.request,
    context: { chainId: b.chainId, chain: b.C.name, victim: { address: b.victim, persona: b.persona.key, persona_desc: b.persona[b.lang], balance_usd: x.balance }, origin: x.origin, claimed_site: null, address_book: x.address_book || [], known_protocols: x.known_protocols || [], token_registry: tr, history: x.history || [], counterparty_facts: x.cp, share_of_balance_pct: x.share, token_info: x.token_info || null, expected_effects: x.eff, encoding: x.enc, v3_rule_hits: x.sim.hits, v3_level: x.sim.level },
    intent: x.intent, label: "ambigu", reason: x.reason, expected_severity: "warn", ideal_severity: "warn",
    required_signals: x.signals, blind_to_v3_contract: false, catalog_category: x.cat, source: x.source, hard: true,
    approximation: x.approx, scenario: null, lang: b.lang,
  };
}

function genAmbig(sub, idx) {
  const b = ambBase(sub, idx);
  const { lang, chainId, C, victim } = b;
  if (sub === "unusual_amount_new_address") {
    const to = addr(`newaddr:${idx}`);
    const median = rf(20, 300) * b.persona.scale;
    const mult = rf(8, 40);
    const native = chance(0.4);
    const sym = native ? C.native : wpick(Object.keys(C.tokens).map((k) => [k, k.startsWith("USD") ? 40 : 10]));
    const a = amountFor(chainId, sym, median * mult);
    const share = +rf(15, 49).toFixed(1);
    const request = native ? txReq(victim, to, a.wei) : txReq(victim, C.tokens[sym].a, 0n, ERC20.encodeFunctionData("transfer", [to, a.wei]));
    const out = [{ token: a.token, symbol: sym, amount: a.human, to, usd: a.usd }];
    const iv = pick(["absent", "vague", "label_only"]);
    const intent = iv === "absent" ? { kind: "pay_someone" } : iv === "vague" ? { kind: "pay_someone", freeText: pick(VAGUE[lang]) || "envoi" } : { kind: "pay_someone", freeText: lang === "fr" ? pick(["payer le garage", "rembourser un ami", "achat d'occasion", "loyer"]) : pick(["pay the mechanic", "pay back a friend", "second-hand purchase", "rent"]), counterpartyLabel: pick(FIRST[lang]) };
    if (chance(0.5)) { intent.token = sym; intent.amount = a.human; }
    const history = Array.from({ length: ri(3, 8) }, (_, k) => ({ type: "outgoing", to: addr(`habit:${idx}:${k % 3}`), symbol: sym, amount: fmt(median * rf(0.5, 1.5) / (sym === C.native ? C.nativePrice : C.tokens[sym].p), 2), daysAgo: ri(2, 180) }));
    const sim = v3(intent, { outgoing: out, incoming: [], approvals: [], share, seen: {} });
    return ambCase(sub, b, { request, origin: "wallet_ui", balance: +(a.usd / (share / 100)).toFixed(2), cp: [{ address: to, isContract: false, ageBlocks: null, firstSeenByUser: true, txCount: ri(0, 400) }], share, eff: { outgoing: out, incoming: [], approvals: [] }, enc: native ? "native" : "erc20", sim, intent, history,
      address_book: [0, 1, 2].map((k) => ({ label: FIRST[lang][k], address: addr(`habit:${idx}:${k}`) })),
      reason: `Ambigu : montant ~${mult.toFixed(0)}× la médiane habituelle (${a.human} ${sym}, ~${a.usd} $) vers une adresse jamais vue, intention ${iv}. Peut être un achat légitime ou une fraude : rien dans la tx ne tranche. Avertir sans bloquer.`,
      signals: ["amount_outlier_vs_history", "first_seen_counterparty"], cat: "6_contrepartie", source: "Heuristique bancaire classique (montant atypique + bénéficiaire nouveau), docs/intent-barrier.md signaux transverses.",
      approx: { typed_data_or_selector_from_memory: false, derived_addresses: true, note: "Destinataire et historique dérivés de la graine." + (a.derived ? " Token Fuji dérivé." : "") } });
  }
  if (sub === "first_unknown_contract_benign") {
    const dapp = pick(DAPPS);
    const kind = pick(["nft_mint", "name_register", "vault_deposit", "dao_vote"]);
    const to = addr(`ucontract:${dapp}:${chainId}:${kind}:${idx % 17}`);
    const age = ri(20000, 1500000);
    let request, out = [], appr = [], inc = [], intent, desc;
    if (kind === "nft_mint") {
      const q = ri(1, 3); const a = amountFor(chainId, C.native, rf(10, 120) * q);
      request = txReq(victim, to, a.wei, MISC.encodeFunctionData("mint", [BigInt(q)]));
      out.push({ token: "native", symbol: C.native, amount: a.human, to, usd: a.usd }); inc.push({ token: to, symbol: "NFT", amount: String(q), from: to });
      intent = { kind: "buy_or_swap", freeText: lang === "fr" ? `minter ${q} NFT ${dapp}` : `mint ${q} ${dapp} NFT`, token: C.native, amount: a.human };
      desc = `mint de ${q} NFT pour ${a.human} ${C.native}`;
    } else if (kind === "name_register") {
      const nm = `${pick(FIRST.en).toLowerCase()}${ri(1, 999)}`; const a = amountFor(chainId, C.native, rf(3, 40));
      request = txReq(victim, to, a.wei, MISC.encodeFunctionData("register", [nm, victim, BigInt(31536000 * ri(1, 3))]));
      out.push({ token: "native", symbol: C.native, amount: a.human, to, usd: a.usd });
      intent = { kind: "buy_or_swap", freeText: lang === "fr" ? `réserver le nom ${nm}` : `register name ${nm}` };
      desc = `enregistrement du nom « ${nm} » pour ${a.human} ${C.native}`;
    } else if (kind === "vault_deposit") {
      const sym = C.tokens.USDC ? "USDC" : Object.keys(C.tokens)[0]; const a = amountFor(chainId, sym, rf(50, 3000) * b.persona.scale);
      request = txReq(victim, to, 0n, MISC.encodeFunctionData("deposit", [a.wei, victim]));
      out.push({ token: C.tokens[sym].a, symbol: sym, amount: a.human, to, usd: a.usd }); inc.push({ token: to, symbol: `${dapp.slice(0, 4)}${sym}`, amount: a.human, from: to });
      intent = { kind: "buy_or_swap", freeText: lang === "fr" ? `déposer dans le vault ${dapp}` : `deposit into ${dapp} vault`, token: sym, amount: a.human };
      desc = `dépôt ERC-4626 de ${a.human} ${sym} (approbation exacte déjà donnée)`;
    } else {
      request = txReq(victim, to, 0n, MISC.encodeFunctionData("castVote", [BigInt(ri(1, 300)), ri(0, 2)]));
      intent = { kind: "connect_or_accept_offer", freeText: lang === "fr" ? "voter sur la proposition" : "vote on the proposal" };
      desc = "vote de gouvernance (aucun transfert)";
    }
    const share = out.length ? +rf(1, 30).toFixed(1) : 0;
    const sim = v3(intent, { outgoing: out, incoming: inc, approvals: appr, share, youngContract: age < 100000, seen: {} });
    return ambCase(sub, b, { request, origin: `https://${dapp}.${pick(["xyz", "io", "app", "fi"])}`, balance: +rf(300, 20000).toFixed(2), cp: [{ address: to, isContract: true, ageBlocks: age, ageDays: +(age * blockSec(chainId) / 86400).toFixed(1), firstSeenByUser: true, verifiedSource: chance(0.8), interactions: ri(200, 40000) }], share, eff: { outgoing: out, incoming: inc, approvals: appr }, enc: kind, sim, intent,
      history: kind === "vault_deposit" ? [{ type: "approval", spender: to, symbol: "USDC", amount: "exact", daysAgo: 0 }] : [],
      reason: `Ambigu : premier contact avec un contrat inconnu mais bénin en apparence (${desc}), âge ${age} blocs, aucun signal d'attaque mais aucune réputation. Avertissement léger attendu.`,
      signals: ["first_seen_contract", "no_reputation_data"], cat: "6_contrepartie", source: "Interactions dapp courantes (mint ERC-721, registre de noms, ERC-4626, Governor castVote).",
      approx: { typed_data_or_selector_from_memory: true, derived_addresses: true, note: "Contrat et dapp fictifs dérivés de la graine ; signatures mint/register/deposit/castVote standard mais adresses synthétiques." } });
  }
  if (sub === "obscure_real_airdrop") {
    const tok = pick(OBSCURE) + (chance(0.3) ? "X" : "");
    const tAddr = addr(`airtok:${tok}:${chainId}`);
    const dist = addr(`distributor:${tok}:${chainId}:${idx % 9}`);
    const amount = parseUnits(String(ri(50, 25000)), 18);
    const proof = Array.from({ length: ri(8, 16) }, (_, k) => hex32(`${idx}:${k}`));
    const request = txReq(victim, dist, 0n, MISC.encodeFunctionData("claim", [BigInt(ri(0, 90000)), victim, amount, proof]));
    const inc = [{ token: tAddr, symbol: tok, amount: (amount / 10n ** 18n).toString(), from: dist }];
    const intent = pick([{ kind: "connect_or_accept_offer", freeText: lang === "fr" ? `réclamer mon airdrop ${tok}` : `claim my ${tok} airdrop` }, { kind: "connect_or_accept_offer" }, { kind: "buy_or_swap", freeText: lang === "fr" ? "récupérer des tokens gratuits" : "get free tokens" }]);
    const age = ri(5000, 400000);
    const sim = v3(intent, { outgoing: [], incoming: inc, approvals: [], share: 0, youngContract: age < 100000, seen: {} });
    return ambCase(sub, b, { request, origin: `https://claim.${tok.toLowerCase()}.${pick(["xyz", "foundation", "fi", "network"])}`, balance: +rf(100, 8000).toFixed(2), cp: [{ address: dist, isContract: true, ageBlocks: age, ageDays: +(age * blockSec(chainId) / 86400).toFixed(1), firstSeenByUser: true, verifiedSource: true, claimsSoFar: ri(300, 20000) }], share: 0, eff: { outgoing: [], incoming: inc, approvals: [] }, enc: "merkle_claim", sim, intent,
      token_info: { symbol: tok, address: tAddr, age_days: ri(10, 400), holders: ri(800, 25000), liquidity_usd: ri(20000, 900000), sell_simulation: "ok", sell_tax_pct: 0, listed_on_known_dex: chance(0.7) },
      reason: `Ambigu : claim Merkle (MerkleDistributor) d'un airdrop réel mais obscur (${tok}) sur un site non répertorié ; aucun fonds ne sort, mais l'origine inconnue et le token peu connu justifient un avertissement.`,
      signals: ["unknown_origin", "obscure_token", "no_outflow"], cat: "7_tokens", source: "Uniswap MerkleDistributor claim(uint256,address,uint256,bytes32[]) ; airdrops de petits protocoles.",
      approx: { typed_data_or_selector_from_memory: true, derived_addresses: true, note: "Distributeur, token et preuve Merkle dérivés de la graine (preuve non vérifiable on-chain)." } });
  }
  if (sub === "recent_legit_token") {
    const r = pick(C.routers);
    const tok = pick(OBSCURE);
    const tAddr = addr(`newtok:${tok}:${chainId}:${idx % 11}`);
    const a = amountFor(chainId, C.native, rf(20, 2500) * b.persona.scale);
    const path = [C.tokens[r.wrapped].a, tAddr];
    const minOut = parseUnits(String(ri(1000, 900000)), 18);
    const deadline = BigInt(Math.floor(DECLARED_BASE / 1000) + ri(300, 1800));
    const request = txReq(victim, r.a, a.wei, ROUTER.encodeFunctionData(r.fn, [minOut, path, victim, deadline]));
    const out = [{ token: "native", symbol: C.native, amount: a.human, to: r.a, usd: a.usd }];
    const inc = [{ token: tAddr, symbol: tok, amount: `>=${(minOut / 10n ** 18n).toString()}`, from: r.a }];
    const intent = { kind: "buy_or_swap", freeText: lang === "fr" ? pick([`acheter du ${tok}`, `swap ${C.native} → ${tok}`, "acheter le nouveau token dont on parle"]) : pick([`buy ${tok}`, `swap ${C.native} to ${tok}`, "buy the new token everyone mentions"]), token: tok, amount: a.human };
    const share = +rf(2, 45).toFixed(1);
    const sim = v3(intent, { outgoing: out, incoming: inc, approvals: [], share, seen: {} });
    return ambCase(sub, b, { request, origin: pick(["https://traderjoexyz.com", "https://app.pangolin.exchange", "https://app.uniswap.org", "wallet_ui"]), balance: +(a.usd / (share / 100)).toFixed(2), cp: [{ address: r.a, isContract: true, knownRouter: true, firstSeenByUser: chance(0.3) }, { address: tAddr, isContract: true, ageBlocks: null, firstSeenByUser: true }], share, eff: { outgoing: out, incoming: inc, approvals: [] }, enc: "router_swap", sim, intent,
      known_protocols: [{ name: r.name, address: r.a }],
      token_info: { symbol: tok, address: tAddr, age_days: ri(2, 25), holders: ri(300, 7000), liquidity_usd: ri(60000, 2500000), sell_simulation: "ok", sell_tax_pct: 0, buy_tax_pct: 0, verified_source: true, owner_renounced: chance(0.5), lp_locked: chance(0.7) },
      reason: `Ambigu : achat via un routeur connu (${r.name}) d'un token récent (${tok}) qui passe la simulation de vente, sans taxe, liquidité correcte ; légitime en apparence mais trop jeune pour avoir une réputation.`,
      signals: ["young_token", "no_reputation_data"], cat: "7_tokens", source: "Swaps UniswapV2-style (swapExactAVAXForTokens / swapExactETHForTokens) sur tokens fraîchement listés.",
      approx: { typed_data_or_selector_from_memory: !!r.derived, derived_addresses: true, note: "Token récent dérivé de la graine ; adresses de routeurs Avalanche/Ethereum de mémoire" + (r.derived ? " ; routeur Fuji synthétique." : ".") } });
  }
  // unknown_dao_multisig
  const dao = pick(["Pebble", "Lantern", "Quay", "Kite", "Fern", "Ember", "Moss", "Cobalt"]) + pick(["DAO", " Collective", " Guild", " Council"]);
  const safe = addr(`safe:${dao}:${chainId}`);
  const owners = ri(3, 9), threshold = ri(2, owners);
  const age = ri(150000, 6000000);
  const mode = pick(["contribution", "contribution", "safetx_sign"]);
  const cp = [{ address: safe, isContract: true, contractType: "Safe proxy (GnosisSafe L2 1.3.0)", owners, threshold, ageBlocks: age, ageDays: +(age * blockSec(chainId) / 86400).toFixed(1), firstSeenByUser: true, verifiedSource: true }];
  if (mode === "contribution") {
    const native = chance(0.35);
    const sym = native ? C.native : (C.tokens.USDC ? "USDC" : "USDT");
    const a = amountFor(chainId, sym, rf(50, 5000) * b.persona.scale);
    const request = native ? txReq(victim, safe, a.wei) : txReq(victim, C.tokens[sym].a, 0n, ERC20.encodeFunctionData("transfer", [safe, a.wei]));
    const out = [{ token: a.token, symbol: sym, amount: a.human, to: safe, usd: a.usd }];
    const intent = { kind: "pay_someone", freeText: lang === "fr" ? pick([`contribution à ${dao}`, `cotisation ${dao}`, `financer le projet ${dao}`]) : pick([`contribution to ${dao}`, `${dao} membership dues`, `fund the ${dao} project`]), counterpartyLabel: dao, token: sym, amount: a.human };
    const share = +rf(2, 40).toFixed(1);
    const sim = v3(intent, { outgoing: out, incoming: [], approvals: [], share, seen: {} });
    return ambCase("unknown_dao_multisig", b, { request, origin: pick([`https://${slug(dao)}.xyz`, "wallet_ui", `https://forum.${slug(dao)}.org`]), balance: +(a.usd / (share / 100)).toFixed(2), cp, share, eff: { outgoing: out, incoming: [], approvals: [] }, enc: native ? "native" : "erc20", sim, intent,
      reason: `Ambigu : contribution de ${a.human} ${sym} vers le multisig Safe (${threshold}/${owners}) d'un DAO inconnu (${dao}) ; contrat ancien et vérifié, mais aucune réputation pour l'utilisateur.`,
      signals: ["first_seen_contract", "multisig_counterparty", "no_reputation_data"], cat: "6_contrepartie", source: "Contributions de membres vers un trésor Safe (pratique DAO courante).",
      approx: { typed_data_or_selector_from_memory: false, derived_addresses: true, note: "Adresse du Safe dérivée de la graine." } });
  }
  // SafeTx typed-data signature by a newly invited signer
  const grantee = addr(`grantee:${dao}:${idx}`);
  const sym = C.tokens.USDC ? "USDC" : "USDT";
  const amt = parseUnits(String(ri(500, 80000)), 6);
  const inner = ERC20.encodeFunctionData("transfer", [grantee, amt]);
  const typed = {
    types: {
      EIP712Domain: [{ name: "chainId", type: "uint256" }, { name: "verifyingContract", type: "address" }],
      SafeTx: [{ name: "to", type: "address" }, { name: "value", type: "uint256" }, { name: "data", type: "bytes" }, { name: "operation", type: "uint8" }, { name: "safeTxGas", type: "uint256" }, { name: "baseGas", type: "uint256" }, { name: "gasPrice", type: "uint256" }, { name: "gasToken", type: "address" }, { name: "refundReceiver", type: "address" }, { name: "nonce", type: "uint256" }],
    },
    primaryType: "SafeTx",
    domain: { chainId, verifyingContract: safe },
    message: { to: C.tokens[sym].a, value: "0", data: inner, operation: 0, safeTxGas: "0", baseGas: "0", gasPrice: "0", gasToken: "0x0000000000000000000000000000000000000000", refundReceiver: "0x0000000000000000000000000000000000000000", nonce: String(ri(0, 400)) },
  };
  const request = { method: "eth_signTypedData_v4", params: [victim, JSON.stringify(typed)] };
  const intent = pick([{ kind: "connect_or_accept_offer", freeText: lang === "fr" ? `signer la proposition de ${dao}` : `sign ${dao} proposal` }, { kind: "connect_or_accept_offer" }, { kind: "asked_by_someone", askedBy: "other", freeText: lang === "fr" ? "un membre du DAO m'a demandé de co-signer" : "a DAO member asked me to co-sign" }]);
  const sim = v3(intent, { outgoing: [], incoming: [], approvals: [], share: 0, seen: {} });
  return ambCase("unknown_dao_multisig", b, { request, origin: pick(["https://app.safe.global", `https://${slug(dao)}.xyz`]), balance: +rf(100, 5000).toFixed(2), cp, share: 0, eff: { outgoing: [], incoming: [], approvals: [] }, enc: "eip712_safetx", sim, intent,
    reason: `Ambigu : signature EIP-712 SafeTx (co-signature) d'un transfert de ${(amt / 10n ** 6n).toString()} ${sym} du trésor de ${dao} vers ${short(grantee)} ; ne déplace pas les fonds de l'utilisateur, mais le DAO et le bénéficiaire sont inconnus.`,
    signals: ["offchain_signature", "multisig_counterparty", "no_reputation_data"], cat: "2_signatures_hors_chaine", source: "Safe{Wallet} SafeTx EIP-712 (Safe 1.3.0 : domaine chainId + verifyingContract).",
    approx: { typed_data_or_selector_from_memory: true, derived_addresses: true, note: "Structure SafeTx 1.3.0 de mémoire ; Safe et bénéficiaire dérivés de la graine." } });
}

// ---------- run ----------
for (const [fam, count] of Object.entries(FRAUD_PER_FAMILY)) {
  let made = 0, idx = 0;
  while (made < count && idx < count * 5) { if (push(genFraud(fam, idx++))) made++; }
}
const AMB = { unusual_amount_new_address: 70, first_unknown_contract_benign: 70, obscure_real_airdrop: 60, recent_legit_token: 65, unknown_dao_multisig: 65 };
for (const [sub, count] of Object.entries(AMB)) {
  let made = 0, idx = 0;
  while (made < count && idx < count * 5) { if (push(genAmbig(sub, idx++))) made++; }
}

writeFileSync(join(HERE, "cases.jsonl"), cases.map((c) => JSON.stringify(c)).join("\n") + "\n");
const tally = {};
for (const c of cases) { const k = `${c.label}/${c.subfamily}`; tally[k] ??= { DEV: 0, TEST: 0, ok: 0, warn: 0, critical: 0 }; tally[k][c.split]++; tally[k][c.expected_severity]++; }
console.log(`cases: ${cases.length}`);
console.table(tally);

// V2-SIG generator: malicious off-chain signatures (EIP-2612, DAI permit, Permit2, witness,
// Seaport, Blur, eth_sign, personal_sign hex, domain mismatch, lying intents).
// SYNTHETIC ONLY. Deterministic: fixed seed. Usage: node gen.mjs  -> cases.jsonl
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ETHERS = "C:\\Users\\Adem\\Secure Horizon\\blockchain\\node_modules\\ethers\\lib.esm\\index.js";
const E = await import(pathToFileURL(ETHERS).href);
const { getAddress, TypedDataEncoder, Interface, Transaction, hashAuthorization, hexlify, toUtf8Bytes, keccak256 } = E;

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED = 20261011;
const DECLARED_AT = Date.UTC(2026, 9, 11, 10, 0, 0); // fixed, ms
const NOW = Math.floor(DECLARED_AT / 1000);
const MAX256 = (2n ** 256n - 1n).toString();
const MAX160 = (2n ** 160n - 1n).toString();
const MAX48 = (2n ** 48n - 1n).toString();
const NOTICE = "SYNTHETIQUE - jeu de test defensif, aucune signature, aucune cle, aucun systeme reel vise";

// ---------- PRNG ----------
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(SEED);
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;
const hex = (n) => { let s = ""; for (let i = 0; i < n; i++) s += Math.floor(rnd() * 16).toString(16); return s; };
const addr = () => getAddress("0x" + hex(40));
const b32 = () => "0x" + hex(64);
const bigRand = (digits) => BigInt("0x" + hex(digits)).toString();
function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function lookalike(real) { const h = real.slice(2).toLowerCase(); let mid = hex(32); if (mid === h.slice(4, 36)) mid = hex(32); return getAddress("0x" + h.slice(0, 4) + mid + h.slice(36)); }
function weighted(entries) { const tot = entries.reduce((s, e) => s + e[1], 0); let r = rnd() * tot; for (const [v, w] of entries) { if ((r -= w) < 0) return v; } return entries[entries.length - 1][0]; }

// ---------- public facts ----------
// sure:true = address/domain known from public docs; otherwise flagged in approximation.
const TOKENS = {
  43114: [
    { sym: "USDC", addr: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", dec: 6, name: "USD Coin", version: "2", permit: true, sure: true },
    { sym: "USDC.e", addr: "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664", dec: 6, name: "USD Coin", version: "1", permit: true, sure: false },
    { sym: "USDT.e", addr: "0xc7198437980c041c805A1EDcbA50c1Ce5db95118", dec: 6, name: "Tether USD", version: "1", permit: true, sure: false },
    { sym: "USDt", addr: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", dec: 6, name: "TetherToken", version: "1", permit: true, sure: false },
    { sym: "WAVAX", addr: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", dec: 18, name: "Wrapped AVAX", version: "1", permit: false, sure: true },
    { sym: "WETH.e", addr: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", dec: 18, name: "Wrapped Ether", version: "1", permit: true, sure: false },
    { sym: "BTC.b", addr: "0x152b9d0FdC40C096757F570A51E494bd4b943E50", dec: 8, name: "Bitcoin", version: "1", permit: true, sure: false },
    { sym: "JOE", addr: "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd", dec: 18, name: "JoeToken", version: "1", permit: true, sure: false },
    { sym: "sAVAX", addr: "0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE", dec: 18, name: "Staked AVAX", version: "1", permit: true, sure: false },
  ],
  43113: [
    { sym: "USDC", addr: "0x5425890298aed601595a70AB815c96711a31Bc65", dec: 6, name: "USD Coin", version: "2", permit: true, sure: true },
    { sym: "WAVAX", addr: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c", dec: 18, name: "Wrapped AVAX", version: "1", permit: false, sure: true },
  ],
  1: [
    { sym: "USDC", addr: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", dec: 6, name: "USD Coin", version: "2", permit: true, sure: true },
    { sym: "UNI", addr: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", dec: 18, name: "Uniswap", version: null, permit: true, sure: true },
    { sym: "AAVE", addr: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", dec: 18, name: "Aave Token", version: "1", permit: true, sure: false },
    { sym: "stETH", addr: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", dec: 18, name: "Liquid staked Ether 2.0", version: "2", permit: true, sure: false },
    { sym: "WETH", addr: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", dec: 18, name: "Wrapped Ether", version: "1", permit: false, sure: true },
    { sym: "USDT", addr: "0xdAC17F958D2ee523a2206206994597C13D831ec7", dec: 6, name: "Tether USD", version: "1", permit: false, sure: true },
    { sym: "PEPE", addr: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", dec: 18, name: "Pepe", version: "1", permit: false, sure: true },
  ],
};
const DAI = {
  1: { sym: "DAI", addr: "0x6B175474E89094C44Da98b954EedeAC495271d0F", dec: 18, name: "Dai Stablecoin", version: "1", sure: true },
  43114: { sym: "DAI.e", addr: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", dec: 18, name: "Dai Stablecoin", version: "1", sure: false },
};
const OBSCURE = ["SNOWCAT", "AVAXMOON", "GLCR", "FROSTY", "PNGWN", "ICEDOGE"];
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const ROUTERS = {
  43114: [
    { label: "Trader Joe LBRouter v2.2", addr: "0x18556DA13313f3532c54711497A8FedAC273220E", sure: false },
    { label: "Trader Joe LBRouter v2.1", addr: "0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30", sure: true },
    { label: "JoeRouter02", addr: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4", sure: true },
    { label: "1inch AggregationRouterV5", addr: "0x1111111254EEB25477B68fb85Ed929f73A960582", sure: true },
    { label: "1inch AggregationRouterV6", addr: "0x111111125421cA6dc452d289314280a0f8842A65", sure: true },
    { label: "ParaSwap Augustus V5", addr: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", sure: true },
    { label: "Uniswap UniversalRouter (Avalanche)", addr: "0x4Dae2f939ACf50408e13d58534Ff8c2776d45265", sure: false },
  ],
  43113: [
    { label: "Trader Joe LBRouter v2.1 (Fuji)", addr: "0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30", sure: false },
  ],
  1: [
    { label: "Uniswap UniversalRouter", addr: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", sure: true },
    { label: "Uniswap V2 Router02", addr: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", sure: true },
    { label: "1inch AggregationRouterV6", addr: "0x111111125421cA6dc452d289314280a0f8842A65", sure: true },
    { label: "ParaSwap Augustus V5", addr: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", sure: true },
  ],
};
const SEAPORT = [
  { v: "1.5", addr: "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC" },
  { v: "1.6", addr: "0x0000000000000068F116a894984e2DB1123eB395" },
];
// constante publique OpenSea (conduit key Seaport), pas un secret
const OPENSEA_CONDUIT_KEY = "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000";
const NFTS_ETH = [
  { label: "BoredApeYachtClub", addr: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D" },
  { label: "MutantApeYachtClub", addr: "0x60E4d786628Fea6478F785A6d7e704777c86a7c6" },
  { label: "Azuki", addr: "0xED5AF388653567Af2F388E6224dC7C4b3241C544" },
  { label: "PudgyPenguins", addr: "0xBd3531dA5CF5857e7CfAA92426877b022e612cf8" },
];
const BLUR = { exchange: "0x000000000000Ad05Ccc4F10045630fb830B95127", policy721: "0x00000000006411739DA1c40B106F8511de5D1FAC", pool: "0x0000000000A39bb272e79075ade125fd351887Ac" };
const UNISWAPX_REACTOR = "0x6000da47483062A0D734Ba3dc7576Ce6A0B645C4"; // ExclusiveDutchOrderReactor (mainnet)

// ---------- world: origins, brands, personas ----------
const OFFICIAL = { uniswap: "app.uniswap.org", joe: "lfj.gg", opensea: "opensea.io", blur: "blur.io", core: "core.app", aave: "app.aave.com" };
const LOOKALIKE_ORIGINS = {
  uniswap: ["app.uniswap-claim.org", "app-uniswap.gift", "uniswap-labs.app"],
  joe: ["lfj-gg.app", "traderjoe-xyz.app", "joe-rewards.net"],
  opensea: ["opensea-verify.io", "os-pro-listing.com", "openseea.io"],
  blur: ["blur-rewards.io", "blur.io-season4.app", "bIur.io"],
  core: ["core-app-wallet.com", "core.app-validate.net"],
  aave: ["app-aave.com", "aave-v4-migrate.app"],
};
const FICT_BRANDS = ["AvaxDrop", "Snowfield Rewards", "WalletShield Support", "JoeQuest", "Glacier Labs", "NFT Vault Verify", "SummitPass", "ColdChain Airdrop", "Avalon Mint", "Frostbyte Club"];
const UNKNOWN_ORIGINS = ["avaxdrop-season3.xyz", "snowfield-rewards.app", "walletshield-verify.com", "glacier-claim.io", "summitpass.mint.fun-drop.xyz", "frostbyte-club.art", "avalon-mint.live", "coldchain-airdrop.org"];
const PERSONAS = ["retraite", "etudiant", "trader"];

function origin(proto) {
  const k = weighted([["sosie", 55], ["inconnue", 35], ["officielle", 10]]);
  if (k === "officielle") return { origin: "https://" + OFFICIAL[proto], origin_kind: "officielle_compromise", claimed_site: OFFICIAL[proto] };
  if (k === "sosie") return { origin: "https://" + pick(LOOKALIKE_ORIGINS[proto]), origin_kind: "sosie", claimed_site: OFFICIAL[proto] };
  const o = pick(UNKNOWN_ORIGINS); return { origin: "https://" + o, origin_kind: "inconnue", claimed_site: o };
}

// ---------- intents ----------
const MSG = {
  fr: {
    urgent: [
      "URGENT : votre wallet est signalé. Signez la vérification sur {o} sous 15 min sinon vos fonds seront gelés. - Équipe {b}",
      "Dernière chance !! Votre airdrop {b} expire dans 10 minutes, signez sur {o} pour le récupérer.",
      "Alerte sécurité {b} : activité suspecte détectée. Validez votre wallet immédiatement : {o}",
    ],
    amical: [
      "Salut ! Tu as été sélectionné pour le drop {b} 🎁 il suffit de te connecter sur {o} et de signer, ça coûte rien en gas",
      "Coucou, je viens de recevoir 300 USDC avec {b}, va sur {o} c'est juste une signature gratuite",
      "Hello, ton NFT gratuit {b} t'attend, connecte-toi sur {o} et signe le message",
    ],
    autoritaire: [
      "Support officiel {b}. Pour débloquer votre retrait, vous devez signer la demande d'autorisation sur {o}. Ne partagez pas ce message.",
      "Conformément à la nouvelle réglementation, chaque wallet doit être revalidé via {o}. Procédure obligatoire. {b} Compliance.",
      "Ticket #{n} : notre technicien a besoin que vous signiez la synchronisation de wallet sur {o}.",
    ],
  },
  en: {
    urgent: [
      "URGENT: your wallet was flagged. Sign the verification at {o} within 15 min or your assets will be frozen. - {b} Team",
      "Last chance!! Your {b} airdrop expires in 10 minutes, sign at {o} to claim it.",
      "{b} security alert: suspicious activity. Validate your wallet now: {o}",
    ],
    amical: [
      "Hey! You were picked for the {b} drop 🎁 just connect at {o} and sign, it's gasless",
      "gm, I just got 300 USDC from {b}, go to {o}, it's only a free signature",
      "Hi, your free {b} NFT is waiting, connect at {o} and sign the message",
    ],
    autoritaire: [
      "Official {b} support. To unlock your withdrawal you must sign the authorization request at {o}. Do not share this message.",
      "Under the new regulation every wallet must be re-validated via {o}. Mandatory procedure. {b} Compliance.",
      "Ticket #{n}: our technician needs you to sign the wallet sync at {o}.",
    ],
  },
};
const LIES = {
  fr: { gift: ["je récupère un cadeau", "je réclame mon airdrop gratuit", "je récupère mon NFT offert", "je touche ma récompense"], connect: ["je me connecte", "je me connecte juste au site", "connexion au site, rien de plus"], validate: ["je valide mon wallet", "je vérifie mon wallet", "je synchronise mon wallet comme demandé"] },
  en: { gift: ["I'm claiming a gift", "claiming my free airdrop", "getting my free NFT", "collecting my reward"], connect: ["I'm logging in", "just connecting to the site", "sign in, nothing else"], validate: ["I'm validating my wallet", "verifying my wallet", "syncing my wallet as asked"] },
};
const VAGUE = { fr: ["euh le site demande de signer", "je sais pas trop, ça s'est affiché", "?", "signer"], en: ["the site asks me to sign", "not sure, it popped up", "?", "sign"] };

function pasted(lang, tone, brand, o) { return pick(MSG[lang][tone]).replaceAll("{b}", brand).replaceAll("{o}", o.origin.replace("https://", "")).replaceAll("{n}", String(ri(10000, 99999))); }

// honest: fn(lang) -> {kind, freeText, token?, amount?, counterpartyLabel?}
function makeIntent({ lang, o, brand, honest }) {
  const mode = weighted([["honest", honest ? 20 : 0], ["souffle", 40], ["asked", 15], ["vague", 13], ["absent", 12]]);
  const tone = pick(["urgent", "amical", "autoritaire"]);
  if (mode === "absent") return { intent: null, intent_mode: "absente", tone: null };
  if (mode === "vague") return { intent: { kind: "connect_or_accept_offer", freeText: pick(VAGUE[lang]), declaredAt: DECLARED_AT }, intent_mode: "vague", tone: null };
  if (mode === "honest") return { intent: { ...honest(lang), declaredAt: DECLARED_AT }, intent_mode: "honnete", tone: null };
  if (mode === "asked") {
    const askedBy = pick(["support", "support", "advisor", "recruiter", "friend"]);
    const ft = lang === "fr"
      ? { support: "le support m'a demandé de signer pour débloquer mon compte", advisor: "mon conseiller crypto m'a dit de signer pour sécuriser", recruiter: "test de wallet demandé pour l'entretien d'embauche", friend: "un ami m'a dit de signer pour avoir le bonus" }[askedBy]
      : { support: "support asked me to sign to unlock my account", advisor: "my crypto advisor told me to sign to secure it", recruiter: "wallet check requested for the job interview", friend: "a friend told me to sign to get the bonus" }[askedBy];
    const t = askedBy === "friend" ? "amical" : askedBy === "recruiter" ? "autoritaire" : tone;
    return { intent: { kind: "asked_by_someone", freeText: ft, askedBy, pastedMessage: pasted(lang, t, brand, o), declaredAt: DECLARED_AT }, intent_mode: "soufflee_tiers", tone: t };
  }
  const lieType = pick(["gift", "connect", "validate"]);
  const it = { kind: "connect_or_accept_offer", freeText: pick(LIES[lang][lieType]), declaredAt: DECLARED_AT };
  if (chance(0.8)) it.pastedMessage = pasted(lang, tone, brand, o);
  return { intent: it, intent_mode: "soufflee_" + lieType, tone: it.pastedMessage ? tone : null };
}

// ---------- amounts / deadlines ----------
function amountFor(tok, maxBits = 256) {
  const kind = weighted([["illimite", 40], ["quasi_illimite", 20], ["gros", 15], ["petit", 15], ["poussiere", 10]]);
  const unit = 10n ** BigInt(tok.dec);
  let v;
  if (kind === "illimite") v = maxBits === 160 ? 2n ** 160n - 1n : 2n ** 256n - 1n;
  else if (kind === "quasi_illimite") v = pick([2n ** 255n, 2n ** 128n, 10n ** 30n, 2n ** 159n, 2n ** 96n * 3n, 2n ** 160n - 2n]);
  else if (kind === "gros") v = BigInt(ri(5000, 250000)) * unit;
  else if (kind === "petit") v = BigInt(ri(5, 200)) * unit;
  else v = unit / BigInt(pick([1000, 10000, 100000])) || 1n;
  if (maxBits === 160 && v > 2n ** 160n - 1n) v = 2n ** 160n - 1n;
  return { raw: v.toString(), kind };
}
function deadline(far) {
  if (far) return { v: pick([MAX256, "4102444800", "9999999999", "253402300799", (2n ** 64n - 1n).toString()]), kind: "tres_lointain" };
  const k = pick([["20min", 1200], ["1h", 3600], ["1j", 86400], ["7j", 604800], ["30j", 2592000], ["1an", 31536000]]);
  return { v: String(NOW + k[1]), kind: k[0] };
}
function deadline48(far) { if (far) return { v: pick([MAX48, "4102444800", "253402300799"]), kind: "tres_lointain" }; const d = deadline(false); return d; }

// ---------- typed data assembly ----------
const DOMAIN_ORDER = [["name", "string"], ["version", "string"], ["chainId", "uint256"], ["verifyingContract", "address"], ["salt", "bytes32"]];
function reorderObj(o) { if (Array.isArray(o)) return o.map(reorderObj); if (o && typeof o === "object") { const out = {}; for (const k of shuffle(Object.keys(o))) out[k] = reorderObj(o[k]); return out; } return o; }
function typed(domain, types, primaryType, message, { reorder = false } = {}) {
  const d = {}; for (const [k] of DOMAIN_ORDER) if (domain[k] !== undefined) d[k] = domain[k];
  const dt = DOMAIN_ORDER.filter(([k]) => d[k] !== undefined).map(([name, type]) => ({ name, type }));
  let allTypes = { EIP712Domain: dt, ...types };
  let td = { types: allTypes, primaryType, domain: d, message };
  TypedDataEncoder.hash(d, types, message); // throws if not hashable
  if (reorder) {
    const keys = shuffle(Object.keys(allTypes)); const t2 = {}; for (const k of keys) t2[k] = allTypes[k];
    td = reorderObj({ types: t2, primaryType, domain: d, message });
    td.types = t2; // keep member order inside each type (order is part of encodeType)
    const top = shuffle(["types", "primaryType", "domain", "message"]); const o2 = {}; for (const k of top) o2[k] = td[k]; td = o2;
  }
  return td;
}
function sigReq(victim, td) { return { method: "eth_signTypedData_v4", params: [victim, JSON.stringify(td)] }; }

// ---------- context ----------
function ctxBase({ chainId, victim, o, persona, extra = {} }) {
  return {
    chainId, victim, origin: o.origin, origin_kind: o.origin_kind, claimed_site: o.claimed_site, persona,
    known_protocols: (ROUTERS[chainId] || []).map((r) => ({ label: r.label, address: r.addr })).concat([{ label: "Uniswap Permit2", address: PERMIT2 }]),
    token_registry: (TOKENS[chainId] || []).map((t) => ({ symbol: t.sym, address: t.addr, decimals: t.dec })),
    address_book: [{ label: pick(["Paul", "Maman", "Léa", "Sam", "mon Coinbase", "mon Binance"]), address: addr() }],
    history: [],
    ...extra,
  };
}
function spenderOf(chainId, viciousLookalike) {
  if (viciousLookalike && ROUTERS[chainId]?.length) {
    const r = pick(ROUTERS[chainId]); const a = lookalike(r.addr);
    return { address: a, fact: { address: a, isContract: true, ageBlocks: ri(200, 30000), firstSeenByUser: true, lookalikeOf: r.addr, lookalikeLabel: r.label }, routerSure: r.sure, routerLabel: r.label };
  }
  const a = addr(); const isC = chance(0.75);
  return { address: a, fact: { address: a, isContract: isC, ageBlocks: isC ? ri(50, 60000) : undefined, firstSeenByUser: true } };
}

// ---------- case assembly ----------
const cases = [];
const seenReq = new Set();
function emit(c) {
  const key = JSON.stringify(c.request);
  if (seenReq.has(key)) return false;
  seenReq.add(key);
  cases.push(c); return true;
}
function chainPick() { return weighted([[43114, 62], [43113, 18], [1, 20]]); }
function langPick() { return chance(0.55) ? "fr" : "en"; }
function approx(notes) { const n = notes.filter(Boolean); return n.length ? { typed_data_or_selector_from_memory: true, note: n.join(" ; ") } : null; }
function viciousSet(applicable) {
  if (!chance(0.25) || !applicable.length) return [];
  const n = chance(0.3) && applicable.length > 1 ? 2 : 1; return shuffle(applicable).slice(0, n);
}
function finish(base) {
  return {
    id: null, synthetic: true, notice: NOTICE, family: "sig", subfamily: base.subfamily,
    request: base.request, context: base.context, intent: base.intent,
    label: "malveillant", reason: base.reason, expected_severity: "critical", ideal_severity: "critical",
    required_signals: base.required_signals, blind_to_v3_contract: false, catalog_category: "2_signatures_hors_chaine",
    source: base.source, hard: base.vicious.length > 0, approximation: base.approximation, scenario: null,
    lang: base.lang, intent_mode: base.intent_mode, tone: base.tone, vicious_variants: base.vicious,
    hidden_payload: base.hidden_payload || null,
    split: null, split_reason: "sha256(id) mod 10 < 3 -> TEST",
  };
}
function sig(base, intentMode) { const s = new Set(base); if (intentMode && intentMode !== "absente") s.add("intent_mismatch"); if (intentMode === "soufflee_tiers") s.add("asked_by_someone_grants_right"); return [...s]; }
function honestSwap(tok, amt) { return (lang) => ({ kind: "buy_or_swap", freeText: lang === "fr" ? `j'échange ${amt} ${tok} contre de l'AVAX` : `swapping ${amt} ${tok} for AVAX`, token: tok, amount: String(amt) }); }

// ===== 1. EIP-2612 permit =====
function genPermit2612(n) {
  let made = 0;
  while (made < n) {
    const chainId = chainPick(); const lang = langPick(); const persona = pick(PERSONAS);
    const pool = TOKENS[chainId].filter((t) => t.permit || (t.sym === "WAVAX" && chance(0.15)));
    const tok = pick(pool);
    const vic = viciousSet(["reorder_fields", "domain_without_name", "lookalike_router_spender", "far_deadline"]);
    const victim = addr(); const sp = spenderOf(chainId, vic.includes("lookalike_router_spender"));
    const amt = amountFor(tok); const dl = deadline(vic.includes("far_deadline") || chance(0.12));
    const nonce = String(weighted([[0, 50], [1, 20], [ri(2, 40), 30]]));
    const domain = { chainId, verifyingContract: tok.addr };
    if (!vic.includes("domain_without_name")) domain.name = tok.name;
    if (tok.version !== null) { const vv = chance(0.12) && tok.version === "2" ? "1" : tok.version; domain.version = vv; }
    const td = typed(domain, { Permit: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }, { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] }, "Permit",
      { owner: victim, spender: sp.address, value: amt.raw, nonce, deadline: dl.v }, { reorder: vic.includes("reorder_fields") });
    const proto = sp.routerLabel?.startsWith("Uniswap") ? "uniswap" : pick(["joe", "uniswap", "aave", "core"]);
    const o = origin(proto); const brand = pick(FICT_BRANDS);
    const readable = amt.kind.includes("illimite") ? "unlimited" : (Number(BigInt(amt.raw) * 1000n / 10n ** BigInt(tok.dec)) / 1000).toString();
    const im = makeIntent({ lang, o, brand, honest: sp.fact.lookalikeOf ? honestSwap(tok.sym, ri(20, 500)) : null });
    const ctx = ctxBase({ chainId, victim, o, persona, extra: { counterparty_facts: [sp.fact], token_info: { symbol: tok.sym, address: tok.addr, decimals: tok.dec, supports_eip2612: tok.permit }, share_of_balance_pct: amt.kind.includes("illimite") ? 100 : ri(5, 100) } });
    const notes = [];
    if (!tok.sure) notes.push(`domaine EIP-712 de ${tok.sym} (name/version) reconstitue de memoire`);
    if (!tok.permit) notes.push(`${tok.sym} (WETH9) n'implemente pas EIP-2612 : signature inexploitable on-chain, mais demande malveillante telle que vue par le wallet`);
    if (vic.includes("domain_without_name")) notes.push("domaine sans name : valide seulement si le contrat calcule son separateur sans name ; variante d'obfuscation d'affichage");
    if (domain.version && domain.version !== tok.version) notes.push(`version de domaine ${domain.version} != version reelle ${tok.version} (variante de version)`);
    if (sp.fact.lookalikeOf && !sp.routerSure) notes.push(`adresse du routeur imite (${sp.routerLabel}) de memoire`);
    if (chainId === 43113) notes.push("Fuji : USDC de test Circle");
    const ok = emit(finish({
      subfamily: "permit_eip2612", request: sigReq(victim, td), context: ctx, intent: im.intent, lang, intent_mode: im.intent_mode, tone: im.tone, vicious: vic,
      reason: `Permit EIP-2612 sur ${tok.sym} : accorde a ${sp.fact.lookalikeOf ? "un sosie de " + sp.routerLabel : "une adresse inconnue"} le droit de depenser ${amt.kind} (${readable}), deadline ${dl.kind}, sans transaction ni gas : vidage differe via permit()+transferFrom.`,
      required_signals: sig(["typed_data_permit", "approval_to_unknown_spender", ...(amt.kind.includes("illimite") ? ["approval_unlimited"] : []), ...(sp.fact.lookalikeOf ? ["spender_lookalike_router"] : []), ...(dl.kind === "tres_lointain" ? ["deadline_far"] : []), ...(o.origin_kind === "sosie" ? ["origin_lookalike"] : [])], im.intent_mode),
      source: "Drainers Inferno/Angel/Pink : phishing permit EIP-2612 (rapports ScamSniffer 2023-2024, Fake_Phishing), EIP-2612",
      approximation: approx(notes),
    }));
    if (ok) made++;
  }
}

// ===== 2. DAI permit =====
function genDai(n) {
  let made = 0;
  while (made < n) {
    const chainId = weighted([[1, 40], [43114, 60]]); const d = DAI[chainId]; const lang = langPick();
    const vic = viciousSet(["reorder_fields", "domain_without_name", "lookalike_router_spender", "far_deadline"]);
    const victim = addr(); const sp = spenderOf(chainId, vic.includes("lookalike_router_spender"));
    const far = vic.includes("far_deadline");
    const expiry = far ? pick([MAX256, "4102444800", "9999999999"]) : pick(["0", String(NOW + pick([1800, 86400, 2592000]))]);
    const domain = { version: d.version, chainId, verifyingContract: d.addr }; if (!vic.includes("domain_without_name")) domain.name = d.name;
    const msg = { holder: victim, spender: sp.address, nonce: String(weighted([[0, 50], [ri(1, 30), 50]])), expiry, allowed: true };
    const td = typed(domain, { Permit: [{ name: "holder", type: "address" }, { name: "spender", type: "address" }, { name: "nonce", type: "uint256" }, { name: "expiry", type: "uint256" }, { name: "allowed", type: "bool" }] }, "Permit", msg, { reorder: vic.includes("reorder_fields") });
    const o = origin(pick(["uniswap", "aave", "joe"])); const brand = pick(FICT_BRANDS);
    const im = makeIntent({ lang, o, brand, honest: sp.fact.lookalikeOf ? honestSwap(d.sym, ri(50, 2000)) : null });
    const ctx = ctxBase({ chainId, victim, o, persona: pick(PERSONAS), extra: { counterparty_facts: [sp.fact], token_info: { symbol: d.sym, address: d.addr, decimals: 18, permit_style: "dai" }, share_of_balance_pct: 100 } });
    const notes = [];
    if (!d.sure) notes.push("DAI.e (pont Avalanche) : le permit style DAI n'est pas garanti sur ce token ponte ; domaine de memoire");
    if (vic.includes("domain_without_name")) notes.push("domaine sans name : obfuscation, signature valide seulement si separateur sans name");
    if (expiry === "0") notes.push("expiry=0 : dans DAI, 0 = pas d'expiration");
    const ok = emit(finish({
      subfamily: "dai_permit", request: sigReq(victim, td), context: ctx, intent: im.intent, lang, intent_mode: im.intent_mode, tone: im.tone, vicious: vic,
      reason: `Permit style DAI (allowed=true) : allowance ILLIMITEE de ${d.sym} pour ${sp.fact.lookalikeOf ? "un sosie de " + sp.fact.lookalikeLabel : "une adresse inconnue"}, ${expiry === "0" || far ? "sans expiration effective" : "expiration " + expiry}.`,
      required_signals: sig(["typed_data_permit", "dai_permit_allowed_true", "approval_unlimited", "approval_to_unknown_spender", ...(sp.fact.lookalikeOf ? ["spender_lookalike_router"] : []), ...(far || expiry === "0" ? ["deadline_far"] : [])], im.intent_mode),
      source: "DAI permit(holder,spender,nonce,expiry,allowed) ; phishing permit DAI documente (ScamSniffer, MetaMask security alerts)",
      approximation: approx(notes),
    }));
    if (ok) made++;
  }
}

// ===== 3-7. Permit2 =====
const P2_TYPES = {
  PermitDetails: [{ name: "token", type: "address" }, { name: "amount", type: "uint160" }, { name: "expiration", type: "uint48" }, { name: "nonce", type: "uint48" }],
  TokenPermissions: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }],
};
function p2Tokens(chainId, k) {
  let list = TOKENS[chainId].slice();
  const out = shuffle(list).slice(0, Math.min(k, list.length));
  if (chance(0.2)) out.push({ sym: pick(OBSCURE), addr: addr(), dec: 18, obscure: true });
  return out;
}
function p2Domain(chainId) { return { name: "Permit2", chainId, verifyingContract: PERMIT2 }; }
function p2Notes(chainId, extra = []) { const n = [...extra]; if (chainId === 43113) n.push("Permit2 sur Fuji : deploiement a l'adresse canonique suppose"); return n; }

function genPermit2(kind, n) {
  let made = 0;
  while (made < n) {
    const chainId = chainPick(); const lang = langPick();
    const vicAppl = ["reorder_fields", "lookalike_router_spender", "far_deadline"]; if (kind.startsWith("witness")) vicAppl.push("unusual_primary_type");
    const vic = viciousSet(vicAppl);
    const victim = addr(); const sp = spenderOf(chainId, vic.includes("lookalike_router_spender"));
    const far = vic.includes("far_deadline") || chance(0.1);
    const o = origin(pick(["uniswap", "joe", "core"])); const brand = pick(FICT_BRANDS);
    let td, primary, reason, sigs = [], notes = [], hidden = null, toks;
    const sigDl = deadline(far);
    if (kind === "single" || kind === "batch") {
      toks = kind === "single" ? p2Tokens(chainId, 1).slice(0, 1) : p2Tokens(chainId, ri(2, 6));
      const details = toks.map((t) => { const a = amountFor(t, 160); const e = deadline48(far); return { token: t.addr, amount: a.raw, expiration: e.v, nonce: String(ri(0, 6)), _k: a.kind }; });
      const unl = details.some((d) => d._k.includes("illimite")); details.forEach((d) => delete d._k);
      primary = kind === "single" ? "PermitSingle" : "PermitBatch";
      const types = { [primary]: [{ name: "details", type: kind === "single" ? "PermitDetails" : "PermitDetails[]" }, { name: "spender", type: "address" }, { name: "sigDeadline", type: "uint256" }], PermitDetails: P2_TYPES.PermitDetails };
      td = typed(p2Domain(chainId), types, primary, { details: kind === "single" ? details[0] : details, spender: sp.address, sigDeadline: sigDl.v }, { reorder: vic.includes("reorder_fields") });
      reason = `Permit2 ${primary} (AllowanceTransfer) : allowance Permit2 sur ${toks.map((t) => t.sym).join(", ")} pour ${sp.fact.lookalikeOf ? "un sosie de " + sp.fact.lookalikeLabel : "une adresse inconnue"}${unl ? ", montant uint160 max" : ""} ; les approvals ERC-20 deja donnes a Permit2 rendent le vidage immediat.`;
      sigs = ["typed_data_permit2", "permit2_allowance", "approval_to_unknown_spender", ...(unl ? ["approval_unlimited"] : []), ...(toks.length > 1 ? ["multi_token_batch"] : [])];
    } else if (kind === "transfer" || kind === "batch_transfer") {
      toks = kind === "transfer" ? p2Tokens(chainId, 1).slice(0, 1) : p2Tokens(chainId, ri(2, 7));
      const perms = toks.map((t) => ({ token: t.addr, amount: amountFor(t).raw }));
      primary = kind === "transfer" ? "PermitTransferFrom" : "PermitBatchTransferFrom";
      const types = { [primary]: [{ name: "permitted", type: kind === "transfer" ? "TokenPermissions" : "TokenPermissions[]" }, { name: "spender", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }], TokenPermissions: P2_TYPES.TokenPermissions };
      td = typed(p2Domain(chainId), types, primary, { permitted: kind === "transfer" ? perms[0] : perms, spender: sp.address, nonce: bigRand(ri(8, 40)), deadline: sigDl.v }, { reorder: vic.includes("reorder_fields") });
      reason = `Permit2 SignatureTransfer ${primary} : le spender ${sp.fact.lookalikeOf ? "(sosie de " + sp.fact.lookalikeLabel + ")" : "inconnu"} choisit librement le destinataire au moment du permitTransferFrom ; transfert direct de ${toks.map((t) => t.sym).join(", ")} sans allowance residuelle.`;
      sigs = ["typed_data_permit2", "permit2_signature_transfer", "spender_chooses_recipient", "approval_to_unknown_spender", ...(toks.length > 1 ? ["multi_token_batch"] : [])];
    } else {
      // witness
      const batch = kind === "witness_batch";
      toks = batch ? p2Tokens(chainId, ri(2, 4)) : p2Tokens(chainId, 1).slice(0, 1);
      const perms = toks.map((t) => ({ token: t.addr, amount: amountFor(t).raw }));
      const unusual = vic.includes("unusual_primary_type");
      const wkind = unusual ? pick(["claim", "login", "verify"]) : (chainId === 1 && chance(0.6) ? "uniswapx" : pick(["claim", "uniswapx_like", "order"]));
      let witnessTypes, witnessName, witness, wnote = null, spender = sp.address;
      if (wkind === "uniswapx" || wkind === "uniswapx_like") {
        witnessName = "ExclusiveDutchOrder";
        const reactor = wkind === "uniswapx" ? UNISWAPX_REACTOR : sp.address;
        if (wkind === "uniswapx") spender = UNISWAPX_REACTOR; else wnote = "reacteur type UniswapX sur cette chaine : adresse du spender = contrat de l'attaquant";
        const attacker = addr(); const outTok = pick(TOKENS[chainId]);
        witnessTypes = {
          ExclusiveDutchOrder: [{ name: "info", type: "OrderInfo" }, { name: "decayStartTime", type: "uint256" }, { name: "decayEndTime", type: "uint256" }, { name: "exclusiveFiller", type: "address" }, { name: "exclusivityOverrideBps", type: "uint256" }, { name: "inputToken", type: "address" }, { name: "inputStartAmount", type: "uint256" }, { name: "inputEndAmount", type: "uint256" }, { name: "outputs", type: "DutchOutput[]" }],
          OrderInfo: [{ name: "reactor", type: "address" }, { name: "swapper", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }, { name: "additionalValidationContract", type: "address" }, { name: "additionalValidationData", type: "bytes" }],
          DutchOutput: [{ name: "token", type: "address" }, { name: "startAmount", type: "uint256" }, { name: "endAmount", type: "uint256" }, { name: "recipient", type: "address" }],
        };
        const nonce = bigRand(ri(8, 30));
        witness = { info: { reactor, swapper: victim, nonce, deadline: sigDl.v, additionalValidationContract: "0x0000000000000000000000000000000000000000", additionalValidationData: "0x" }, decayStartTime: String(NOW), decayEndTime: String(NOW + 120), exclusiveFiller: attacker, exclusivityOverrideBps: "0", inputToken: perms[0].token, inputStartAmount: perms[0].amount, inputEndAmount: perms[0].amount, outputs: [{ token: outTok.addr, startAmount: String(ri(0, 1)), endAmount: "0", recipient: chance(0.5) ? attacker : victim }] };
        if (witness.outputs[0].recipient === victim) witness.outputs.push({ token: outTok.addr, startAmount: "1", endAmount: "1", recipient: attacker });
        hidden = { witness_effect: "ordre Dutch dont la sortie pour la victime vaut 0 ou 1 unite ; filler exclusif = attaquant" };
        if (batch) { toks = toks.slice(0, 1); perms.length = 1; }
      } else if (wkind === "order") {
        witnessName = "LimitOrder";
        witnessTypes = { LimitOrder: [{ name: "maker", type: "address" }, { name: "takerAsset", type: "address" }, { name: "takerAmount", type: "uint256" }, { name: "receiver", type: "address" }, { name: "expiry", type: "uint256" }] };
        witness = { maker: victim, takerAsset: pick(TOKENS[chainId]).addr, takerAmount: String(ri(0, 1)), receiver: addr(), expiry: sigDl.v };
        hidden = { witness_effect: "ordre limite dont la contrepartie vaut 0/1 unite et le receveur est un tiers" };
      } else {
        witnessName = { claim: pick(["AirdropClaim", "ClaimReward"]), login: pick(["Login", "SignIn"]), verify: pick(["VerifyWallet", "WalletSync"]) }[wkind];
        witnessTypes = { [witnessName]: wkind === "login" ? [{ name: "message", type: "string" }, { name: "issuedAt", type: "uint256" }, { name: "user", type: "address" }] : wkind === "verify" ? [{ name: "wallet", type: "address" }, { name: "statement", type: "string" }, { name: "ticket", type: "uint256" }] : [{ name: "recipient", type: "address" }, { name: "campaignId", type: "uint256" }, { name: "rewardAmount", type: "uint256" }] };
        witness = wkind === "login" ? { message: lang === "fr" ? `Bienvenue ! Signez pour vous connecter a ${brand}` : `Welcome! Sign to log in to ${brand}`, issuedAt: String(NOW), user: victim }
          : wkind === "verify" ? { wallet: victim, statement: lang === "fr" ? "Je confirme etre le proprietaire de ce wallet" : "I confirm I own this wallet", ticket: String(ri(10000, 99999)) }
          : { recipient: victim, campaignId: String(ri(1, 99)), rewardAmount: String(BigInt(ri(100, 5000)) * 10n ** 18n) };
        hidden = { witness_effect: `witness '${witnessName}' rassurant ; le vrai effet est le PermitWitnessTransferFrom vers le spender` };
      }
      primary = batch ? "PermitBatchWitnessTransferFrom" : "PermitWitnessTransferFrom";
      const types = { [primary]: [{ name: "permitted", type: batch ? "TokenPermissions[]" : "TokenPermissions" }, { name: "spender", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }, { name: "witness", type: witnessName }], TokenPermissions: P2_TYPES.TokenPermissions, ...witnessTypes };
      td = typed(p2Domain(chainId), types, primary, { permitted: batch ? perms : perms[0], spender, nonce: bigRand(ri(8, 40)), deadline: sigDl.v, witness }, { reorder: vic.includes("reorder_fields") });
      reason = `Permit2 ${primary} avec witness '${witnessName}' : le contenu witness ${["Login", "SignIn", "VerifyWallet", "WalletSync", "AirdropClaim", "ClaimReward"].includes(witnessName) ? "deguise la signature en connexion/verification/claim" : "decrit un ordre dont la sortie pour la victime est nulle"} ; le PermitWitnessTransferFrom transfere ${toks.map((t) => t.sym).join(", ")}.`;
      sigs = ["typed_data_permit2", "permit2_signature_transfer", "permit2_witness", ...(wkind.startsWith("uniswapx") || wkind === "order" ? ["witness_recipient_not_self"] : ["witness_disguise"]), ...(unusual ? ["unusual_primary_type"] : [])];
      if (wnote) notes.push(wnote);
      if (wkind === "uniswapx" || wkind === "uniswapx_like") notes.push("types ExclusiveDutchOrder/OrderInfo/DutchOutput de UniswapX reconstitues de memoire");
      if (wkind === "uniswapx") notes.push("adresse ExclusiveDutchOrderReactor mainnet de memoire");
    }
    if (sp.fact.lookalikeOf && !sp.routerSure) notes.push(`adresse du routeur imite (${sp.fact.lookalikeLabel}) de memoire`);
    if (toks.some((t) => t.obscure)) notes.push("token obscur : adresse derivee de la graine");
    if (toks.some((t) => t.sure === false)) notes.push("adresses de tokens pontes Avalanche de memoire");
    if (far) sigs.push("deadline_far");
    if (sp.fact.lookalikeOf) sigs.push("spender_lookalike_router");
    if (o.origin_kind === "sosie") sigs.push("origin_lookalike");
    const im = makeIntent({ lang, o, brand, honest: sp.fact.lookalikeOf || kind.startsWith("witness") ? honestSwap(toks[0].sym, ri(10, 800)) : null });
    const facts = [sp.fact]; if (kind.startsWith("witness") && td.message.spender === UNISWAPX_REACTOR) facts.push({ address: UNISWAPX_REACTOR, isContract: true, firstSeenByUser: false, label: "UniswapX ExclusiveDutchOrderReactor" });
    const ctx = ctxBase({ chainId, victim, o, persona: pick(PERSONAS), extra: { counterparty_facts: facts, permit2_prior_approvals: toks.filter((t) => !t.obscure || chance(0.5)).map((t) => ({ token: t.addr, symbol: t.sym, spender: PERMIT2, amount: "unlimited" })), share_of_balance_pct: ri(40, 100) } });
    const sub = { single: "permit2_permit_single", batch: "permit2_permit_batch", transfer: "permit2_transfer_from", batch_transfer: "permit2_batch_transfer_from", witness: "permit2_witness", witness_batch: "permit2_witness_batch" }[kind];
    const ok = emit(finish({
      subfamily: sub, request: sigReq(victim, td), context: ctx, intent: im.intent, lang, intent_mode: im.intent_mode, tone: im.tone, vicious: vic,
      reason, required_signals: sig(sigs, im.intent_mode), hidden_payload: hidden,
      source: "Uniswap Permit2 (AllowanceTransfer / SignatureTransfer, docs officielles) ; drainers Permit2 batch (Pink/Inferno/Angel 2023-2024, ScamSniffer)",
      approximation: approx(p2Notes(chainId, notes)),
    }));
    if (ok) made++;
  }
}

// ===== 8. Seaport =====
const SEAPORT_TYPES = {
  OrderComponents: [{ name: "offerer", type: "address" }, { name: "zone", type: "address" }, { name: "offer", type: "OfferItem[]" }, { name: "consideration", type: "ConsiderationItem[]" }, { name: "orderType", type: "uint8" }, { name: "startTime", type: "uint256" }, { name: "endTime", type: "uint256" }, { name: "zoneHash", type: "bytes32" }, { name: "salt", type: "uint256" }, { name: "conduitKey", type: "bytes32" }, { name: "counter", type: "uint256" }],
  OfferItem: [{ name: "itemType", type: "uint8" }, { name: "token", type: "address" }, { name: "identifierOrCriteria", type: "uint256" }, { name: "startAmount", type: "uint256" }, { name: "endAmount", type: "uint256" }],
  ConsiderationItem: [{ name: "itemType", type: "uint8" }, { name: "token", type: "address" }, { name: "identifierOrCriteria", type: "uint256" }, { name: "startAmount", type: "uint256" }, { name: "endAmount", type: "uint256" }, { name: "recipient", type: "address" }],
};
function genSeaport(n) {
  let made = 0;
  while (made < n) {
    const chainId = weighted([[1, 25], [43114, 60], [43113, 15]]); const lang = langPick();
    const vic = viciousSet(["reorder_fields", "far_deadline", "unusual_primary_type"]);
    const victim = addr(); const attacker = addr(); const sp = SEAPORT[ri(0, 1)];
    const nftNotes = [];
    const nItems = ri(1, 5);
    const offer = [];
    for (let i = 0; i < nItems; i++) {
      const kindItem = weighted([["721", 60], ["1155", 20], ["erc20", 20]]);
      if (kindItem === "erc20") { const t = pick(TOKENS[chainId]); offer.push({ itemType: "1", token: t.addr, identifierOrCriteria: "0", startAmount: amountFor(t).raw, endAmount: "0" }); offer[offer.length - 1].endAmount = offer[offer.length - 1].startAmount; }
      else { const col = chainId === 1 ? pick(NFTS_ETH).addr : addr(); if (chainId !== 1) nftNotes.push("collection NFT Avalanche/Fuji derivee de la graine"); const q = kindItem === "1155" ? String(ri(1, 20)) : "1"; offer.push({ itemType: kindItem === "721" ? "2" : (chance(0.2) ? "5" : "3"), token: col, identifierOrCriteria: kindItem === "721" || chance(0.8) ? String(ri(1, 9999)) : "0", startAmount: q, endAmount: q }); }
    }
    const price = weighted([["0", 40], ["1", 30], ["dust", 30]]);
    const pv = price === "0" ? "0" : price === "1" ? "1" : String(ri(1, 9) * 10 ** ri(9, 12));
    const consideration = [{ itemType: "0", token: "0x0000000000000000000000000000000000000000", identifierOrCriteria: "0", startAmount: pv, endAmount: pv, recipient: victim }];
    if (chance(0.6)) consideration.push({ itemType: "0", token: "0x0000000000000000000000000000000000000000", identifierOrCriteria: "0", startAmount: "1", endAmount: "1", recipient: attacker });
    if (price === "0" && chance(0.4)) consideration.shift();
    const far = vic.includes("far_deadline") || chance(0.3);
    const comp = { offerer: victim, zone: chance(0.8) ? "0x0000000000000000000000000000000000000000" : addr(), offer, consideration, orderType: String(pick([0, 0, 2, 1])), startTime: String(NOW - ri(0, 600)), endTime: far ? pick([MAX256, "4102444800", String(NOW + 31536000 * 10)]) : String(NOW + ri(86400, 2592000)), zoneHash: "0x" + "0".repeat(64), salt: bigRand(ri(20, 64)), conduitKey: chance(0.7) ? OPENSEA_CONDUIT_KEY : "0x" + "0".repeat(64), counter: String(ri(0, 3)) };
    let td, primary;
    const domain = { name: "Seaport", version: sp.v, chainId, verifyingContract: sp.addr };
    if (vic.includes("unusual_primary_type")) {
      primary = "BulkOrder";
      const other = { ...comp, salt: bigRand(40), offer: [{ ...offer[0] }] };
      td = typed(domain, { BulkOrder: [{ name: "tree", type: "OrderComponents[2]" }], ...SEAPORT_TYPES }, "BulkOrder", { tree: [comp, other] }, { reorder: vic.includes("reorder_fields") });
    } else { primary = "OrderComponents"; td = typed(domain, SEAPORT_TYPES, "OrderComponents", comp, { reorder: vic.includes("reorder_fields") }); }
    const o = origin("opensea"); const brand = pick(FICT_BRANDS);
    const honest = (lg) => ({ kind: "buy_or_swap", freeText: lg === "fr" ? `je mets mon NFT en vente à ${ri(1, 30) / 10} ETH` : `listing my NFT for ${ri(1, 30) / 10} ETH`, token: "NFT" });
    const im = makeIntent({ lang, o, brand, honest });
    const notes = [...new Set(nftNotes)];
    if (chainId === 43113) notes.push("Seaport sur Fuji : deploiement a l'adresse canonique suppose");
    if (primary === "BulkOrder") notes.push("BulkOrder hauteur 1 (OrderComponents[2]) : Seaport accepte des arbres 1..24, forme simplifiee");
    if (offer.some((x) => x.itemType === "5")) notes.push("itemType 5 = ERC1155_WITH_CRITERIA (offre toute la collection)");
    const ctx = ctxBase({ chainId, victim, o, persona: pick(PERSONAS), extra: { counterparty_facts: [{ address: attacker, isContract: false, firstSeenByUser: true }], nft_holdings: offer.filter((x) => x.itemType !== "1").map((x) => ({ collection: x.token, id: x.identifierOrCriteria })), seaport: sp } });
    const ok = emit(finish({
      subfamily: "seaport_zero_price", request: sigReq(victim, td), context: ctx, intent: im.intent, lang, intent_mode: im.intent_mode, tone: im.tone, vicious: vic,
      reason: `Ordre Seaport ${sp.v} (${primary}) : offre ${offer.length} actif(s) de la victime contre ${price === "0" ? "0" : price === "1" ? "1 wei" : "un montant derisoire"} ; n'importe qui peut executer fulfillOrder et prendre les actifs.`,
      required_signals: sig(["typed_data_seaport", "nft_offer_zero_consideration", ...(far ? ["deadline_far"] : []), ...(primary === "BulkOrder" ? ["unusual_primary_type", "bulk_order"] : []), ...(o.origin_kind === "sosie" ? ["origin_lookalike"] : [])], im.intent_mode),
      source: "Phishing ordres Seaport a prix 0 (OpenSea 2022-2023, ScamSniffer, Seaport docs OrderComponents)",
      approximation: approx(notes),
    }));
    if (ok) made++;
  }
}

// ===== 9. Blur =====
const BLUR_TYPES = {
  Order: [{ name: "trader", type: "address" }, { name: "side", type: "uint8" }, { name: "matchingPolicy", type: "address" }, { name: "collection", type: "address" }, { name: "tokenId", type: "uint256" }, { name: "amount", type: "uint256" }, { name: "paymentToken", type: "address" }, { name: "price", type: "uint256" }, { name: "listingTime", type: "uint256" }, { name: "expirationTime", type: "uint256" }, { name: "fees", type: "Fee[]" }, { name: "salt", type: "uint256" }, { name: "extraParams", type: "bytes" }, { name: "nonce", type: "uint256" }],
  Fee: [{ name: "rate", type: "uint16" }, { name: "recipient", type: "address" }],
};
function genBlur(n) {
  let made = 0;
  while (made < n) {
    const wrongChain = chance(0.25); const chainId = wrongChain ? pick([43114, 43113]) : 1; const lang = langPick();
    const vic = viciousSet(["reorder_fields", "far_deadline", "unusual_primary_type"]);
    const victim = addr(); const attacker = addr(); const far = vic.includes("far_deadline") || chance(0.3);
    const price = weighted([["0", 50], ["1", 25], ["dust", 25]]);
    const order = { trader: victim, side: "1", matchingPolicy: BLUR.policy721, collection: pick(NFTS_ETH).addr, tokenId: String(ri(1, 9999)), amount: "1", paymentToken: chance(0.6) ? "0x0000000000000000000000000000000000000000" : BLUR.pool, price: price === "0" ? "0" : price === "1" ? "1" : String(ri(1, 9) * 10 ** ri(9, 12)), listingTime: String(NOW - ri(0, 300)), expirationTime: far ? pick([MAX256, "4102444800", String(NOW + 315360000)]) : String(NOW + ri(3600, 2592000)), fees: chance(0.5) ? [] : [{ rate: String(pick([9500, 10000, 50])), recipient: attacker }], salt: bigRand(32), extraParams: chance(0.5) ? "0x" : "0x01", nonce: String(ri(0, 5)) };
    const domain = { name: "Blur Exchange", version: "1.0", chainId: 1, verifyingContract: BLUR.exchange };
    let td, primary;
    if (vic.includes("unusual_primary_type")) { primary = "Root"; const leaf = TypedDataEncoder.from(BLUR_TYPES).hash(order); const root = keccak256(E.concat([leaf, b32()].sort())); td = typed(domain, { Root: [{ name: "root", type: "bytes32" }] }, "Root", { root }, { reorder: vic.includes("reorder_fields") }); }
    else { primary = "Order"; td = typed(domain, BLUR_TYPES, "Order", order, { reorder: vic.includes("reorder_fields") }); }
    const o = origin("blur"); const brand = pick(FICT_BRANDS);
    const im = makeIntent({ lang, o, brand, honest: (lg) => ({ kind: "buy_or_swap", freeText: lg === "fr" ? "je liste mon NFT sur Blur" : "listing my NFT on Blur", token: "NFT" }) });
    const ctx = ctxBase({ chainId, victim, o, persona: pick(PERSONAS), extra: { counterparty_facts: [{ address: attacker, isContract: false, firstSeenByUser: true }], nft_holdings: [{ collection: order.collection, id: order.tokenId }], typed_data_chainId: 1 } });
    const notes = ["types Order/Fee de BlurExchange v1 et adresses StandardPolicyERC721 / Blur Pool reconstitues de memoire"];
    if (primary === "Root") notes.push("Root = signature d'une racine Merkle d'ordres (bulk) ; la feuille cachee est un ordre a prix " + order.price + " (voir hidden_payload)");
    const ok = emit(finish({
      subfamily: "blur_order", request: sigReq(victim, td), context: ctx, intent: im.intent, lang, intent_mode: im.intent_mode, tone: im.tone, vicious: vic,
      reason: `Ordre de vente Blur (${primary}) a prix ${order.price === "0" ? "0" : "derisoire"}${order.fees.length ? `, frais ${order.fees[0].rate / 100}% vers un tiers` : ""} : l'attaquant achete le NFT pour rien.${wrongChain ? " La demande arrive alors que le wallet est sur " + chainId + " (domaine chainId 1)." : ""}`,
      required_signals: sig(["typed_data_blur", "nft_offer_zero_consideration", ...(far ? ["deadline_far"] : []), ...(primary === "Root" ? ["unusual_primary_type", "opaque_merkle_root"] : []), ...(wrongChain ? ["chainid_mismatch"] : [])], im.intent_mode),
      hidden_payload: primary === "Root" ? { leaf_order: order } : null,
      source: "Phishing Blur (signatures d'ordres a 0 ETH et Root bulk, 2023, ScamSniffer / Blur docs)",
      approximation: approx(notes),
    }));
    if (ok) made++;
  }
}

// ===== hidden payload builders for eth_sign / personal_sign =====
const ERC20 = new Interface(["function transfer(address,uint256)", "function approve(address,uint256)", "function increaseAllowance(address,uint256)", "function setApprovalForAll(address,bool)", "function transferFrom(address,address,uint256)"]);
function hiddenTx(chainId, victim, attackerAddr) {
  const t = pick(TOKENS[chainId]);
  const k = weighted([["approve", 35], ["transfer", 25], ["native", 15], ["setApprovalForAll", 15], ["increaseAllowance", 10]]);
  let to = t.addr, data = "0x", value = 0n, desc;
  if (k === "approve") { data = ERC20.encodeFunctionData("approve", [attackerAddr, MAX256]); desc = `approve(${attackerAddr}, max) sur ${t.sym}`; }
  else if (k === "increaseAllowance") { data = ERC20.encodeFunctionData("increaseAllowance", [attackerAddr, 2n ** 255n]); desc = `increaseAllowance 2^255 sur ${t.sym}`; }
  else if (k === "transfer") { const v = BigInt(ri(100, 90000)) * 10n ** BigInt(t.dec); data = ERC20.encodeFunctionData("transfer", [attackerAddr, v]); desc = `transfer ${v} ${t.sym} vers attaquant`; }
  else if (k === "setApprovalForAll") { to = chainId === 1 ? pick(NFTS_ETH).addr : addr(); data = ERC20.encodeFunctionData("setApprovalForAll", [attackerAddr, true]); desc = `setApprovalForAll(${attackerAddr}, true)`; }
  else { to = attackerAddr; value = BigInt(ri(1, 400)) * 10n ** 17n; desc = `envoi natif ${value} wei vers attaquant`; }
  const tx = Transaction.from({ type: 2, chainId, nonce: ri(0, 300), to, data, value, gasLimit: 120000n, maxFeePerGas: 30n * 10n ** 9n, maxPriorityFeePerGas: 2n * 10n ** 9n });
  return { tx, data, to, desc, kind: k, token: t };
}
function hiddenPermitDigest(chainId, victim, attackerAddr) {
  const t = TOKENS[chainId].find((x) => x.permit && x.sure) || TOKENS[chainId][0];
  const domain = { name: t.name, version: t.version, chainId, verifyingContract: t.addr };
  const msg = { owner: victim, spender: attackerAddr, value: MAX256, nonce: "0", deadline: MAX256 };
  const types = { Permit: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }, { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] };
  return { digest: TypedDataEncoder.hash(domain, types, msg), desc: `digest EIP-712 d'un permit ${t.sym} illimite vers attaquant`, token: t };
}

// ===== 10. eth_sign raw hash =====
function genEthSign(n) {
  let made = 0;
  while (made < n) {
    const chainId = chainPick(); const lang = langPick(); const victim = addr();
    const vic = viciousSet(["lookalike_router_spender"]);
    const att = vic.length && ROUTERS[chainId].length ? spenderOf(chainId, true) : { address: addr(), fact: { address: null, isContract: chance(0.5), firstSeenByUser: true } };
    const attackerAddr = att.address; if (!att.fact.address) att.fact.address = attackerAddr;
    const k = weighted([["tx", 55], ["permit", 25], ["7702", 20]]);
    let hash, desc, notes = [];
    if (k === "tx") { const h = hiddenTx(chainId, victim, attackerAddr); hash = h.tx.unsignedHash; desc = "sighash d'une transaction EIP-1559 : " + h.desc; if (!h.token.sure && h.kind !== "native" && h.kind !== "setApprovalForAll") notes.push("adresse du token de memoire"); }
    else if (k === "permit") { const p = hiddenPermitDigest(chainId, victim, attackerAddr); hash = p.digest; desc = p.desc; }
    else { const delegate = addr(); hash = hashAuthorization({ address: delegate, nonce: ri(0, 50), chainId }); desc = `hash d'autorisation EIP-7702 deleguant le compte a ${delegate} (contrat de vidage)`; att.fact = { address: delegate, isContract: true, ageBlocks: ri(10, 5000), firstSeenByUser: true }; }
    const o = origin(pick(["core", "uniswap", "joe"])); const brand = pick(FICT_BRANDS);
    const im = makeIntent({ lang, o, brand, honest: null });
    const ctx = ctxBase({ chainId, victim, o, persona: pick(PERSONAS), extra: { counterparty_facts: [att.fact] } });
    if (att.fact.lookalikeOf && !att.routerSure) notes.push(`adresse du routeur imite (${att.fact.lookalikeLabel}) de memoire`);
    const ok = emit(finish({
      subfamily: "eth_sign_raw_hash", request: { method: "eth_sign", params: [victim, hash] }, context: ctx, intent: im.intent, lang, intent_mode: im.intent_mode, tone: im.tone, vicious: vic,
      reason: `eth_sign d'un hash brut de 32 octets, illisible pour l'utilisateur : c'est le ${desc}. Signer = autoriser l'operation hors du controle du wallet.`,
      required_signals: sig(["raw_hash_eth_sign", "blind_signing", ...(k === "7702" ? ["eip7702_delegation"] : [])], im.intent_mode),
      hidden_payload: { kind: k, decoded: desc },
      source: "eth_sign blind signing (avertissement MetaMask 2022, drainers 2022-2023) ; EIP-7702 hash d'autorisation (drainers 2025)",
      approximation: approx(notes),
    }));
    if (ok) made++;
  }
}

// ===== 11. personal_sign hex encoding a tx =====
function genPersonalSign(n) {
  let made = 0;
  while (made < n) {
    const chainId = chainPick(); const lang = langPick(); const victim = addr();
    const vic = viciousSet(["lookalike_router_spender"]);
    const att = vic.length && ROUTERS[chainId].length ? spenderOf(chainId, true) : { address: addr(), fact: { address: null, isContract: chance(0.5), firstSeenByUser: true } };
    const attackerAddr = att.address; if (!att.fact.address) att.fact.address = attackerAddr;
    const k = weighted([["unsigned_tx", 40], ["calldata", 30], ["permit_digest", 15], ["wrapped_text", 15]]);
    let payload, desc, notes = [];
    const h = hiddenTx(chainId, victim, attackerAddr);
    if (k === "unsigned_tx") { payload = h.tx.unsignedSerialized; desc = "transaction EIP-1559 non signee serialisee : " + h.desc; }
    else if (k === "calldata") { payload = h.data === "0x" ? ERC20.encodeFunctionData("approve", [attackerAddr, MAX256]) : h.data; desc = "calldata brut : " + (h.data === "0x" ? "approve max" : h.desc); }
    else if (k === "permit_digest") { const p = hiddenPermitDigest(chainId, victim, attackerAddr); payload = p.digest; desc = p.desc + " (signe via personal_sign : signature non reutilisable telle quelle, mais schema documente)"; notes.push("personal_sign ajoute le prefixe EIP-191 : la signature ne vaut pas directement pour le permit ; cas d'entrainement a la reconnaissance du motif"); }
    else { const txt = (lang === "fr" ? `Verification du wallet ${brandSafe()}\nnonce:` : `Wallet verification ${brandSafe()}\nnonce:`) + h.tx.unsignedSerialized; payload = hexlify(toUtf8Bytes(txt)); desc = "texte d'apparence anodine encode en hex, embarquant une transaction serialisee : " + h.desc; }
    if (!h.token.sure && (k === "unsigned_tx" || k === "calldata") && h.kind !== "native" && h.kind !== "setApprovalForAll") notes.push("adresse du token de memoire");
    if (att.fact.lookalikeOf && !att.routerSure) notes.push(`adresse du routeur imite (${att.fact.lookalikeLabel}) de memoire`);
    const o = origin(pick(["core", "uniswap", "joe", "aave"])); const brand = pick(FICT_BRANDS);
    const im = makeIntent({ lang, o, brand, honest: null });
    const ctx = ctxBase({ chainId, victim, o, persona: pick(PERSONAS), extra: { counterparty_facts: [att.fact] } });
    const ok = emit(finish({
      subfamily: "personal_sign_tx_hex", request: { method: "personal_sign", params: [payload, victim] }, context: ctx, intent: im.intent, lang, intent_mode: im.intent_mode, tone: im.tone, vicious: vic,
      reason: `personal_sign d'un blob hexadecimal illisible : ${desc}. Le texte affiche ne permet pas a l'utilisateur de comprendre l'operation.`,
      required_signals: sig(["opaque_hex_personal_sign", "recursive_decode_required", "blind_signing"], im.intent_mode),
      hidden_payload: { kind: k, decoded: desc },
      source: "Blind signing via personal_sign hex (ScamSniffer 2023, MetaMask/Rabby warnings 'message non lisible')",
      approximation: approx(notes),
    }));
    if (ok) made++;
  }
}
function brandSafe() { return pick(FICT_BRANDS); }

// ===== 12. domain mismatch =====
function genMismatch(n) {
  let made = 0;
  while (made < n) {
    const lang = langPick(); const victim = addr();
    const variant = weighted([["chain_eth_on_avax", 25], ["fuji_site_mainnet_permit", 25], ["vc_token_on_dapp_site", 25], ["vc_permit2_on_mint_site", 15], ["seaport_wrong_chain", 10]]);
    const vic = viciousSet(["reorder_fields", "far_deadline", "lookalike_router_spender"]);
    let walletChain, tdChain, tok, td, reason, sigs, claimed, notes = [];
    const dlv = deadline(vic.includes("far_deadline"));
    const permitTypes = { Permit: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }, { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] };
    if (variant === "chain_eth_on_avax") { walletChain = pick([43114, 43113]); tdChain = 1; tok = pick(TOKENS[1].filter((t) => t.permit)); claimed = pick(["lfj.gg", "core.app", "app.benqi.fi"]); }
    else if (variant === "fuji_site_mainnet_permit") { walletChain = 43113; tdChain = 43114; tok = pick(TOKENS[43114].filter((t) => t.permit)); claimed = pick(["faucet.avax-test.network", "testnet-quest.xyz", "fuji-airdrop.app"]); }
    else if (variant === "vc_token_on_dapp_site") { walletChain = weighted([[43114, 70], [1, 30]]); tdChain = walletChain; tok = pick(TOKENS[walletChain].filter((t) => t.permit)); claimed = pick(["lfj.gg", "app.aave.com", "app.uniswap.org", "opensea.io"]); }
    else if (variant === "vc_permit2_on_mint_site") { walletChain = weighted([[43114, 70], [1, 30]]); tdChain = walletChain; tok = pick(TOKENS[walletChain]); claimed = pick(["avalon-mint.live", "frostbyte-club.art", "summitpass.mint.fun-drop.xyz"]); }
    else { walletChain = 43114; tdChain = 1; claimed = "opensea.io"; }
    const sp = spenderOf(tdChain, vic.includes("lookalike_router_spender"));
    let vcLabel;
    if (variant === "vc_permit2_on_mint_site") {
      const a = amountFor(tok, 160);
      td = typed({ name: "Permit2", chainId: tdChain, verifyingContract: PERMIT2 }, { PermitSingle: [{ name: "details", type: "PermitDetails" }, { name: "spender", type: "address" }, { name: "sigDeadline", type: "uint256" }], PermitDetails: P2_TYPES.PermitDetails }, "PermitSingle", { details: { token: tok.addr, amount: a.raw, expiration: deadline48(vic.includes("far_deadline")).v, nonce: "0" }, spender: sp.address, sigDeadline: dlv.v }, { reorder: vic.includes("reorder_fields") });
      vcLabel = "Permit2"; reason = `Le site ${claimed} se presente comme un mint/quest NFT, mais verifyingContract = Permit2 : la signature est une allowance Permit2 sur ${tok.sym} pour un tiers.`;
      sigs = ["verifying_contract_mismatch", "typed_data_permit2", "permit2_allowance"];
    } else if (variant === "seaport_wrong_chain") {
      const sp2 = SEAPORT[1]; const col = pick(NFTS_ETH);
      const comp = { offerer: victim, zone: "0x0000000000000000000000000000000000000000", offer: [{ itemType: "2", token: col.addr, identifierOrCriteria: String(ri(1, 9999)), startAmount: "1", endAmount: "1" }], consideration: [{ itemType: "0", token: "0x0000000000000000000000000000000000000000", identifierOrCriteria: "0", startAmount: "0", endAmount: "0", recipient: victim }], orderType: "0", startTime: String(NOW), endTime: vic.includes("far_deadline") ? MAX256 : String(NOW + 2592000), zoneHash: "0x" + "0".repeat(64), salt: bigRand(40), conduitKey: OPENSEA_CONDUIT_KEY, counter: "0" };
      td = typed({ name: "Seaport", version: "1.6", chainId: 1, verifyingContract: sp2.addr }, SEAPORT_TYPES, "OrderComponents", comp, { reorder: vic.includes("reorder_fields") });
      vcLabel = "Seaport 1.6 (Ethereum)"; reason = `Wallet sur Avalanche, mais l'ordre Seaport porte chainId 1 : le NFT ${col.label} Ethereum de la victime est mis en vente a 0.`;
      sigs = ["chainid_mismatch", "typed_data_seaport", "nft_offer_zero_consideration"];
    } else {
      const a = amountFor(tok);
      const domain = { name: tok.name, chainId: tdChain, verifyingContract: tok.addr }; if (tok.version !== null) domain.version = tok.version;
      td = typed(domain, permitTypes, "Permit", { owner: victim, spender: sp.address, value: a.raw, nonce: "0", deadline: dlv.v }, { reorder: vic.includes("reorder_fields") });
      vcLabel = tok.sym + " (chaine " + tdChain + ")";
      if (variant === "vc_token_on_dapp_site") { reason = `Le site ${claimed} demande une "connexion", mais verifyingContract = contrat ${tok.sym} : c'est un permit EIP-2612 vers ${sp.address}.`; sigs = ["verifying_contract_mismatch", "typed_data_permit"]; }
      else { reason = `Wallet connecte a la chaine ${walletChain} (site ${claimed}), mais le typed data porte chainId ${tdChain} et le contrat ${tok.sym} de cette autre chaine : permit valide sur ${tdChain}, invisible pour l'utilisateur.`; sigs = ["chainid_mismatch", "typed_data_permit"]; }
      if (!tok.sure) notes.push(`domaine de ${tok.sym} de memoire`);
    }
    const o = { origin: "https://" + (chance(0.5) ? claimed : claimed.replace(".", "-") + pick([".app", ".io", ".net"])), origin_kind: null, claimed_site: claimed };
    o.origin_kind = o.origin === "https://" + claimed ? (UNKNOWN_ORIGINS.includes(claimed) || claimed.includes("mint") || claimed.includes("quest") || claimed.includes("airdrop") || claimed.includes("club") ? "inconnue" : "officielle_compromise") : "sosie";
    const brand = pick(FICT_BRANDS);
    const im = makeIntent({ lang, o, brand, honest: null });
    const ctx = ctxBase({ chainId: walletChain, victim, o, persona: pick(PERSONAS), extra: { site_chain_id: walletChain, typed_data_expected_contract: variant.startsWith("vc_") ? (variant === "vc_permit2_on_mint_site" ? "contrat de mint NFT du site" : "aucun (connexion)") : null, counterparty_facts: [sp.fact], verifying_contract_label: vcLabel } });
    if (claimed === "app.benqi.fi" || claimed === "faucet.avax-test.network") notes.push("domaine de site public cite pour le decor ; aucune requete reelle");
    if (sp.fact.lookalikeOf && !sp.routerSure) notes.push(`adresse du routeur imite (${sp.fact.lookalikeLabel}) de memoire`);
    if (walletChain === 43113) notes.push("Fuji");
    const ok = emit(finish({
      subfamily: "domain_mismatch_" + variant, request: sigReq(victim, td), context: ctx, intent: im.intent, lang, intent_mode: im.intent_mode, tone: im.tone, vicious: vic,
      reason, required_signals: sig([...sigs, ...(vic.includes("far_deadline") ? ["deadline_far"] : []), ...(sp.fact.lookalikeOf ? ["spender_lookalike_router"] : [])], im.intent_mode),
      source: "Typed data cross-chain / verifyingContract ne correspondant pas au site (avertissements MetaMask/Rabby 'domain mismatch', EIP-712 §domain)",
      approximation: approx(notes),
    }));
    if (ok) made++;
  }
}

// ---------- run ----------
genPermit2612(240);
genDai(80);
genPermit2("single", 110);
genPermit2("batch", 100);
genPermit2("transfer", 90);
genPermit2("batch_transfer", 85);
genPermit2("witness", 90);
genPermit2("witness_batch", 40);
genSeaport(110);
genBlur(75);
genEthSign(75);
genPersonalSign(85);
genMismatch(100);

cases.forEach((c, i) => {
  c.id = "V2-SIG-" + String(i + 1).padStart(5, "0");
  const h = createHash("sha256").update(c.id).digest("hex");
  c.split = BigInt("0x" + h) % 10n < 3n ? "TEST" : "DEV";
});
writeFileSync(join(HERE, "cases.jsonl"), cases.map((c) => JSON.stringify(c)).join("\n") + "\n");
const by = {}; for (const c of cases) { by[c.subfamily] ??= { DEV: 0, TEST: 0 }; by[c.subfamily][c.split]++; }
console.log("total", cases.length); console.table(by);
console.log("vicious", cases.filter((c) => c.vicious_variants.length).length);

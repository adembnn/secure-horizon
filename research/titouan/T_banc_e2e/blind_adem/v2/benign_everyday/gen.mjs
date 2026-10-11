// SYNTHETIC benign generator: everyday transfers, NFT flows, logins, chain switches.
// Deterministic (seed fixed). Usage: node gen.mjs  -> writes cases.jsonl next to this file.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as E from "file:///C:/Users/Adem/Secure%20Horizon/blockchain/node_modules/ethers/lib.esm/index.js";

const { getAddress, keccak256, toUtf8Bytes, hexlify, parseUnits, Interface, toBeHex, TypedDataEncoder, ZeroAddress, ZeroHash } = E;
const HERE = dirname(fileURLToPath(import.meta.url));
const SEED = 0x5eC0E;
const FAMILY = "BENIGN_EVERYDAY";
const DECLARED_AT = 1791720000000; // 2026-10-11, fixed
const NOTICE = "SYNTHETIQUE - cas genere pour le banc Sentinelle, aucune donnee reelle";

// ---------- PRNG ----------
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = mulberry32(SEED);
const rnd = () => R();
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;
let addrCounter = 0;
const seededAddr = (tag) => getAddress("0x" + keccak256(toUtf8Bytes(`${SEED}:${tag}:${addrCounter++}`)).slice(26));
const hex32 = (tag) => keccak256(toUtf8Bytes(`${SEED}:h:${tag}:${addrCounter++}`));
const HEXCH = "0123456789abcdef";
// address sharing first n hex chars with `a`, different next char, different last 4 chars
function prefixTwin(a, n) {
  const low = a.toLowerCase().slice(2);
  for (;;) {
    let b = seededAddr("twin").toLowerCase().slice(2);
    let next = b[n] === low[n] ? HEXCH[(HEXCH.indexOf(low[n]) + 1 + int(0, 14)) % 16] : b[n];
    if (next === low[n]) continue;
    b = low.slice(0, n) + next + b.slice(n + 1);
    if (b.slice(-4) === low.slice(-4) || b.slice(-3) === low.slice(-3)) continue;
    return getAddress("0x" + b);
  }
}

// ---------- chains / tokens ----------
const CHAINS = {
  43114: { hex: "0xa86a", native: "AVAX", name: "Avalanche C-Chain", explorer: "https://snowtrace.io" },
  43113: { hex: "0xa869", native: "AVAX", name: "Avalanche Fuji", explorer: "https://testnet.snowtrace.io" },
  1: { hex: "0x1", native: "ETH", name: "Ethereum", explorer: "https://etherscan.io" },
};
const TOKENS = {
  43114: {
    USDC: { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
    USDT: { address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6 },
    WAVAX: { address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", decimals: 18 },
    "WETH.e": { address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", decimals: 18 },
  },
  43113: {
    USDC: { address: "0x5425890298aed601595a70AB815c96711a31Bc65", decimals: 6 },
    WAVAX: { address: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c", decimals: 18 },
  },
  1: {
    USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    WETH: { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
  },
};
for (const c of Object.values(TOKENS)) for (const t of Object.values(c)) t.address = getAddress(t.address.toLowerCase());
const USD = { AVAX: 26, ETH: 3400, USDC: 1, USDT: 1, WAVAX: 26, "WETH.e": 3400, WETH: 3400 };
const pickChain = () => { const r = rnd(); return r < 0.62 ? 43114 : r < 0.8 ? 43113 : 1; };
const chainOf = (id) => CHAINS[id];
const registry = (chainId) => Object.fromEntries(Object.entries(TOKENS[chainId]).map(([s, t]) => [t.address, { symbol: s, decimals: t.decimals }]));

const ERC20 = new Interface(["function transfer(address to, uint256 amount)", "function approve(address spender, uint256 amount)"]);
const ERC721 = new Interface(["function setApprovalForAll(address operator, bool approved)"]);
const DISPERSE = new Interface(["function disperseToken(address token, address[] recipients, uint256[] values)", "function disperseEther(address[] recipients, uint256[] values)"]);
const SEAPORT_IFACE = new Interface([
  "function fulfillBasicOrder((address considerationToken,uint256 considerationIdentifier,uint256 considerationAmount,address offerer,address zone,address offerToken,uint256 offerIdentifier,uint256 offerAmount,uint8 basicOrderType,uint256 startTime,uint256 endTime,bytes32 zoneHash,uint256 salt,bytes32 offererConduitKey,bytes32 fulfillerConduitKey,uint256 totalOriginalAdditionalRecipients,(uint256 amount,address recipient)[] additionalRecipients,bytes signature) parameters) payable returns (bool fulfilled)",
  "function fulfillBasicOrder_efficient_6GL6yc((address considerationToken,uint256 considerationIdentifier,uint256 considerationAmount,address offerer,address zone,address offerToken,uint256 offerIdentifier,uint256 offerAmount,uint8 basicOrderType,uint256 startTime,uint256 endTime,bytes32 zoneHash,uint256 salt,bytes32 offererConduitKey,bytes32 fulfillerConduitKey,uint256 totalOriginalAdditionalRecipients,(uint256 amount,address recipient)[] additionalRecipients,bytes signature) parameters) payable returns (bool fulfilled)",
]);

// public protocol addresses (from memory; flagged in approximation where cross-chain deployment is assumed)
const SEAPORT_16 = getAddress("0x0000000000000068f116a894984e2ddb6e4f0f2f");
const OPENSEA_CONDUIT = getAddress("0x1e0049783f008a0085193e00003d00cd54003c71");
// constante publique OpenSea (conduit key Seaport), pas un secret
const OPENSEA_CONDUIT_KEY = "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000";
const OPENSEA_FEE = getAddress("0x0000a26b00c1f0df003000390027140000faa719");
const BLUR_DELEGATE = getAddress("0x00000000000111abe46ff893f3b2fdf1f759a8a8");
const LOOKSRARE_TM = getAddress("0x000000000060c4ca14cfc4325359062ace33fe3d");
const DISPERSE_ADDR = getAddress("0xd152f549545093347a162dce210e7293f1452150");
const JOEPEGS_TM = seededAddr("joepegs-transfer-manager");
const NFT_COLLECTIONS = {
  1: [
    { name: "Pudgy Penguins", address: getAddress("0xbd3531da5cf5857e7cfaa92426877b022e612cf8"), floor: [8, 14], approx: false },
    { name: "Azuki", address: getAddress("0xed5af388653567af2f388e6224dc7c4b3241c544"), floor: [2, 6], approx: false },
    { name: "Bored Ape Yacht Club", address: getAddress("0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"), floor: [9, 16], approx: false },
  ],
  43114: [
    { name: "Dokyo", address: seededAddr("dokyo"), floor: [60, 400], approx: true },
    { name: "Steady Stack Titans", address: seededAddr("steady"), floor: [20, 150], approx: true },
    { name: "chikn", address: seededAddr("chikn"), floor: [5, 60], approx: true },
    { name: "Smol Joes", address: seededAddr("smoljoes"), floor: [100, 900], approx: true },
  ],
  43113: [
    { name: "Fuji Test Collectibles", address: seededAddr("fujinft"), floor: [1, 5], approx: true },
  ],
};
NFT_COLLECTIONS[43113][0].approx = true;

// ---------- personas ----------
const PERSONAS = [
  { id: "retraite", fr: true, age: 72 }, { id: "retraitee", fr: true, age: 78 }, { id: "etudiant", fr: true, age: 21 },
  { id: "student", fr: false, age: 20 }, { id: "trader", fr: true, age: 34 }, { id: "trader", fr: false, age: 29 },
  { id: "freelance", fr: true, age: 38 }, { id: "gerant_pme", fr: true, age: 45 }, { id: "dao_treasurer", fr: false, age: 33 },
  { id: "parent", fr: true, age: 41 }, { id: "collector", fr: false, age: 27 }, { id: "artisan", fr: true, age: 52 },
];
const FR_NAMES = ["Paul", "Léa", "Karim", "Sophie", "Mehdi", "Camille", "Julien", "Inès", "Thomas", "Nadia", "Hugo", "Chloé", "Yanis", "Manon", "Lucas", "Amira", "Bastien", "Elodie", "Rayan", "Margaux"];
const EN_NAMES = ["Alex", "Sam", "Jordan", "Priya", "Ben", "Maya", "Chris", "Nina", "Leo", "Grace", "Omar", "Zoe"];
const FAMILY_FR = ["mon fils", "ma fille", "mon petit-fils", "ma petite-fille", "ma soeur", "mon frère", "mon neveu", "ma nièce"];
const ARTISANS = ["le plombier", "l'électricien", "le menuisier", "le jardinier", "la couturière", "le peintre", "le chauffagiste", "le serrurier", "l'aide à domicile", "le couvreur"];
const ARTISAN_NAMES = ["M. Lefèvre", "Mme Garnier", "M. Roussel", "M. Benali", "Mme Moreau", "M. Chevalier", "Mme Petit", "M. Fontaine"];
const EXCHANGES = ["Binance", "Coinbase", "Kraken", "Bitstamp", "Bitpanda", "OKX", "Bybit", "Crypto.com"];
const OWN_LABELS = ["Mon Ledger", "Mon coffre (Trezor)", "My cold wallet", "Compte épargne (Core)", "Mon 2e compte MetaMask", "Mon Rabby", "My Safe", "Wallet perso hors ligne"];

function victim(persona, chainId) {
  const native = chainOf(chainId).native;
  const nb = native === "ETH" ? +(0.05 + rnd() * 4).toFixed(4) : +(1 + rnd() * 400).toFixed(3);
  return { persona: persona.id, age: persona.age, address: seededAddr("victim"), balances: { [native]: String(nb), USDC: String(int(20, 25000)) } };
}

// ---------- amounts ----------
const AMOUNT_BUCKETS = {
  dust: () => (rnd() * 0.9 + 0.05).toFixed(2),
  small: () => String(int(5, 150)),
  medium: () => String(int(150, 2000)),
  large: () => String(int(2000, 60000)),
};
function amountFor(sym, bucket) {
  const v = Number(AMOUNT_BUCKETS[bucket]());
  const usd = USD[sym] ?? 1;
  const units = v / usd;
  const dec = usd > 100 ? 4 : usd > 5 ? 3 : 2;
  const s = units.toFixed(dec);
  return Number(s) === 0 ? (1 / 10 ** dec).toFixed(dec) : s;
}
const usdOf = (sym, amount) => Math.round(Number(amount) * (USD[sym] ?? 1) * 100) / 100;

// ---------- request builders ----------
function sendRequest({ chainId, from, to, sym, amount }) {
  const native = chainOf(chainId).native;
  if (sym === native) {
    return { method: "eth_sendTransaction", params: [{ from, to, value: toBeHex(parseUnits(amount, 18)), data: "0x", chainId: chainOf(chainId).hex }] };
  }
  const t = TOKENS[chainId][sym];
  return { method: "eth_sendTransaction", params: [{ from, to: t.address, value: "0x0", data: ERC20.encodeFunctionData("transfer", [to, parseUnits(amount, t.decimals)]), chainId: chainOf(chainId).hex }] };
}
const tokensFor = (chainId, list) => list.filter((s) => s === chainOf(chainId).native || TOKENS[chainId][s]);

// ---------- case assembly ----------
const cases = [];
const seenReq = new Set();
let serial = 0;
function splitOf(id) { const h = createHash("sha256").update(id).digest("hex"); const k = Number(BigInt("0x" + h) % 10n); return { split: k < 3 ? "TEST" : "DEV", split_reason: `sha256(id) mod 10 = ${k}` }; }
// dedupe key: exact request; for chain-management methods (tiny param space) the request is
// necessarily repeated, so the key also includes origin + account (documented in README).
export function reqKey(request, context) {
  const k = JSON.stringify(request);
  return /^wallet_(switch|add)EthereumChain$/.test(request.method) ? k + "|" + context.origin + "|" + context.victim.address : k;
}
function push(c) {
  const key = reqKey(c.request, c.context);
  if (seenReq.has(key)) return false;
  seenReq.add(key);
  serial++;
  const id = `V2-${FAMILY}-${String(serial).padStart(5, "0")}`;
  const intent = { declaredAt: DECLARED_AT, ...c.intent };
  for (const k of Object.keys(intent)) if (intent[k] === undefined) delete intent[k];
  cases.push({
    id, synthetic: true, notice: NOTICE, family: "benign_everyday", subfamily: c.subfamily,
    request: c.request, context: c.context, intent, label: "benin", reason: c.reason,
    expected_severity: c.sev, ideal_severity: c.sev, severity_justification: c.just,
    required_signals: c.signals, blind_to_v3_contract: false, catalog_category: "benin",
    imitates: c.imitates ?? null, source: c.source, hard: !!c.hard, approximation: c.approximation ?? null,
    scenario: null, lang: c.lang, ...splitOf(id),
  });
  return true;
}
function run(n, fn) { let made = 0, guard = 0; while (made < n && guard < n * 20) { guard++; if (push(fn(made))) made++; } }

// ======================= SUBFAMILIES =======================

// 1. P2P to address-book contacts (some with 2-3 char prefix twins elsewhere)
run(160, () => {
  const persona = pick(PERSONAS); const chainId = pickChain(); const v = victim(persona, chainId);
  const fr = persona.fr; const name = pick(fr ? FR_NAMES : EN_NAMES);
  const contact = seededAddr("contact");
  const twin = chance(0.6);
  const n = pick([2, 3]);
  const book = [{ label: name, address: contact, kind: "contact", timesPaid: int(1, 30) }];
  const history = [];
  let twinAddr = null;
  if (twin) {
    twinAddr = prefixTwin(contact, n);
    if (chance(0.5)) book.push({ label: pick(fr ? FR_NAMES : EN_NAMES) + " " + pick(["(coloc)", "(club)", "(boulot)", "(work)", ""]), address: twinAddr, kind: "contact", timesPaid: int(1, 10) });
    else history.push({ type: "outgoing", to: twinAddr, note: "paiement passé à une autre personne", ageDays: int(3, 400) });
  }
  for (let i = 0; i < int(0, 3); i++) book.push({ label: pick(fr ? FR_NAMES : EN_NAMES), address: seededAddr("other"), kind: "contact", timesPaid: int(0, 8) });
  const sym = pick(tokensFor(chainId, [chainOf(chainId).native, "USDC", "USDT", "USDC"]));
  const bucket = pick(["dust", "small", "small", "medium", "medium", "large"]);
  const amount = amountFor(sym, bucket);
  const reasonsFr = ["rembourser le resto", "ma part du loyer", "cadeau d'anniversaire", "le billet de concert", "les courses de la semaine", "remboursement du covoit", "la cagnotte pour le pot de départ", "", "pour le truc d'hier", "prêt comme promis"];
  const reasonsEn = ["paying back dinner", "my share of rent", "birthday gift", "concert ticket", "", "for last night", "loan as promised", "splitting the Airbnb"];
  const why = pick(fr ? reasonsFr : reasonsEn);
  const vague = why === "" || /truc|last night/.test(why);
  const share = Math.min(100, Math.round((usdOf(sym, amount) / Math.max(1, usdOf(chainOf(chainId).native, v.balances[chainOf(chainId).native]) + Number(v.balances.USDC))) * 100));
  const hard = twin || share >= 50 || vague;
  return {
    subfamily: twin ? "p2p_contact_prefix_twin" : "p2p_contact",
    request: sendRequest({ chainId, from: v.address, to: contact, sym, amount }),
    context: { chainId, victim: v, origin: pick(["wallet://send", "wallet://send", "https://core.app"]), address_book: book, history,
      counterparty_facts: { address: contact, isContract: false, firstSeenByUser: false, timesPaid: book[0].timesPaid, lookalikeOf: null, sharesPrefixWith: twinAddr ? { address: twinAddr, prefixChars: n, suffixShared: false } : null },
      share_of_balance_pct: share, token_registry: registry(chainId) },
    intent: { kind: "pay_someone", freeText: (fr ? `envoyer ${amount} ${sym} à ${name}` : `send ${amount} ${sym} to ${name}`) + (why ? ` - ${why}` : ""), token: sym, amount, counterpartyLabel: name, counterpartyAddress: contact },
    sev: "ok",
    just: twin ? `Destinataire choisi dans le carnet et déjà payé ; l'autre adresse ne partage que ${n} caractères de préfixe, aucun suffixe : ce n'est pas un motif d'empoisonnement (qui imite début ET fin).` : "Destinataire du carnet déjà payé, montant et token conformes à l'intention.",
    reason: "Paiement entre particuliers vers un contact connu, intention honnête.",
    signals: ["address_book_match", "amount_matches_intent", ...(twin ? ["prefix_only_collision_not_poisoning"] : [])],
    imitates: twin ? "address_poisoning" : null, source: "docs/intent-barrier.md (pay_someone) ; motif public address poisoning (préfixe+suffixe) en négatif",
    hard, lang: fr ? "fr" : "en",
  };
});

// 2. Deposits to exchange addresses already used
run(110, () => {
  const persona = pick(PERSONAS); const chainId = pick([43114, 43114, 43114, 1]); const v = victim(persona, chainId); const fr = persona.fr;
  const ex = pick(EXCHANGES); const dep = seededAddr("exdep");
  const sym = pick(tokensFor(chainId, [chainOf(chainId).native, "USDC", "USDT"]));
  const bucket = pick(["small", "medium", "large", "large"]);
  const amount = amountFor(sym, bucket);
  const used = int(1, 25);
  const share = int(5, 100);
  const twin = chance(0.25) ? prefixTwin(dep, pick([2, 3])) : null;
  const hard = bucket === "large" || used <= 2 || share >= 80 || !!twin;
  const sev = share >= 90 && used <= 2 ? "warn" : "ok";
  return {
    subfamily: "exchange_deposit_known",
    request: sendRequest({ chainId, from: v.address, to: dep, sym, amount }),
    context: { chainId, victim: v, origin: "wallet://send", address_book: [{ label: fr ? `${ex} (dépôt)` : `${ex} deposit`, address: dep, kind: "exchange_deposit", timesPaid: used }, ...(twin ? [{ label: pick(FR_NAMES), address: twin, kind: "contact", timesPaid: int(1, 5) }] : [])],
      history: [{ type: "outgoing", to: dep, count: used, lastAgeDays: int(1, 200) }],
      counterparty_facts: { address: dep, isContract: false, firstSeenByUser: false, timesPaid: used, exchangeLabel: ex }, share_of_balance_pct: share, token_registry: registry(chainId) },
    intent: { kind: "send_to_my_account", freeText: pick(fr ? [`déposer sur mon ${ex} pour vendre`, `virer vers ${ex}`, `mettre ${amount} ${sym} sur ${ex}`, `envoyer sur l'exchange`] : [`deposit to my ${ex}`, `move funds to ${ex} to cash out`, `send to exchange`]), token: sym, amount, counterpartyLabel: `${ex}`, counterpartyAddress: dep },
    sev, just: sev === "warn" ? "Adresse de dépôt connue mais utilisée 1 à 2 fois et quasi tout le solde sort : un avertissement de confirmation est tolérable." : "Adresse de dépôt d'exchange déjà utilisée par l'utilisateur, intention « mon compte » cohérente.",
    reason: "Dépôt vers une adresse d'exchange déjà utilisée par la personne.",
    signals: ["address_book_match", "history_outgoing_same_address"], imitates: share >= 80 ? "drain_to_unknown" : null,
    source: "docs/intent-barrier.md (send_to_my_account)", hard, lang: fr ? "fr" : "en",
  };
});

// 3. Large transfers to own other address
run(110, () => {
  const persona = pick(PERSONAS); const chainId = pickChain(); const v = victim(persona, chainId); const fr = persona.fr;
  const own = seededAddr("own"); const label = pick(OWN_LABELS);
  const sym = pick(tokensFor(chainId, [chainOf(chainId).native, "USDC", "USDT", "WAVAX", "WETH.e", "WETH"]));
  const amount = amountFor(sym, pick(["medium", "large", "large"]));
  const share = pick([60, 75, 90, 95, 99, 100, int(30, 100)]);
  const seen = chance(0.75);
  const sev = !seen && share >= 90 ? "warn" : "ok";
  return {
    subfamily: "self_transfer_large",
    request: sendRequest({ chainId, from: v.address, to: own, sym, amount }),
    context: { chainId, victim: v, origin: "wallet://send", address_book: [{ label, address: own, kind: "own_account", timesPaid: seen ? int(1, 12) : 0 }],
      history: seen ? [{ type: "outgoing", to: own, count: int(1, 12) }] : [{ type: "incoming", from: own, count: int(1, 4), note: "l'adresse a déjà renvoyé des fonds vers ce compte" }],
      counterparty_facts: { address: own, isContract: label === "My Safe", firstSeenByUser: !seen, ownAccount: true }, share_of_balance_pct: share, token_registry: registry(chainId) },
    intent: { kind: "send_to_my_account", freeText: pick(fr ? ["tout mettre sur mon Ledger", "sécuriser mes fonds sur le cold wallet", "je change de wallet, je transfère tout", "vider ce compte vers mon autre adresse", "mettre à l'abri"] : ["move everything to my cold wallet", "consolidate into my Safe", "migrating wallets", "sweep to my hardware wallet"]), token: sym, amount, counterpartyLabel: label, counterpartyAddress: own },
    sev, just: sev === "warn" ? "Adresse étiquetée comme sienne mais jamais utilisée en sortie et >= 90 % du solde : une confirmation (warn) est tolérable, pas un blocage." : "Destination enregistrée comme compte personnel et déjà utilisée ; gros montant cohérent avec « mon compte ».",
    reason: "Gros envoi vers sa propre autre adresse (consolidation, cold storage).",
    signals: ["address_book_own_account", "share_of_balance_high_but_self"], imitates: "drain_whole_balance",
    source: "docs/intent-barrier.md (send_to_my_account)", hard: true, lang: fr ? "fr" : "en",
  };
});

// 4. Elderly person pays artisan or known relative
run(110, () => {
  const persona = pick(PERSONAS.filter((p) => p.age >= 70)); const chainId = pick([43114, 43114, 43114, 1]); const v = victim(persona, chainId);
  const isArtisan = chance(0.5);
  const who = isArtisan ? `${pick(ARTISANS)} ${pick(ARTISAN_NAMES)}` : `${pick(FAMILY_FR)} ${pick(FR_NAMES)}`;
  const to = seededAddr("eld");
  const sym = pick(tokensFor(chainId, ["USDC", "USDC", chainOf(chainId).native, "USDT"]));
  const amount = amountFor(sym, pick(["small", "medium", "medium", "large"]));
  const times = int(1, 15);
  const urgentMsg = !isArtisan && chance(0.35);
  const invoiceMsg = isArtisan && chance(0.5);
  const pasted = urgentMsg
    ? pick(["Mamie c'est moi, j'ai besoin pour la caution de l'appart avant ce soir, tu peux envoyer sur mon adresse habituelle ? bisous", "Papi stp vite pour le garage, sur la même adresse que d'habitude, je te rembourse dimanche"])
    : invoiceMsg ? pick([`Bonjour, suite aux travaux, le solde est de ${amount} ${sym}. Merci, cordialement.`, `Facture n°${int(100, 999)} : ${amount} ${sym}, même adresse que la dernière fois.`]) : undefined;
  const hard = urgentMsg || invoiceMsg || Number(usdOf(sym, amount)) > 1000;
  const freeText = pick(["payer " + who, "régler la facture de " + who, "envoyer à " + who + " comme d'habitude", "c'est pour " + who, "le paiement du mois"]);
  return {
    subfamily: isArtisan ? "elderly_pays_artisan" : "elderly_pays_relative",
    request: sendRequest({ chainId, from: v.address, to, sym, amount }),
    context: { chainId, victim: v, origin: pick(["wallet://send", "https://core.app"]), address_book: [{ label: who, address: to, kind: isArtisan ? "merchant" : "family", timesPaid: times }],
      history: [{ type: "outgoing", to, count: times, lastAgeDays: int(5, 120) }],
      counterparty_facts: { address: to, isContract: false, firstSeenByUser: false, timesPaid: times }, share_of_balance_pct: int(2, 45), token_registry: registry(chainId) },
    intent: { kind: urgentMsg ? "asked_by_someone" : "pay_someone", askedBy: urgentMsg ? "friend" : undefined, freeText, token: sym, amount, counterpartyLabel: who, counterpartyAddress: to, pastedMessage: pasted },
    sev: urgentMsg ? "warn" : "ok",
    just: urgentMsg ? "Destinataire réel du carnet payé plusieurs fois, mais le message a la forme « Hi mum » (urgence, famille) : un warn invitant à rappeler est tolérable ; un blocage serait un faux positif." : "Destinataire connu, payé plusieurs fois, montant conforme ; aucune raison de bloquer.",
    reason: urgentMsg ? "Vrai proche qui demande de l'aide urgemment ; adresse habituelle, déjà payée." : "Personne âgée qui paie un artisan ou un proche déjà payé.",
    signals: ["address_book_match", "history_outgoing_same_address"], imitates: urgentMsg ? "hi_mum_scam" : null,
    source: "docs/intent-barrier.md (pay_someone / asked_by_someone) ; motif public « Hi mum » en négatif", hard, lang: "fr",
  };
});

// 5. First payment to an address given in person (warn tolerable)
run(90, () => {
  const persona = pick(PERSONAS); const chainId = pickChain(); const v = victim(persona, chainId); const fr = persona.fr;
  const to = seededAddr("inperson");
  const ctx = pick(fr ? ["acheté un vélo d'occasion, le vendeur m'a montré son QR code", "nouvelle coloc, elle m'a donné son adresse en face à face", "payer le photographe du mariage (adresse sur sa carte de visite)", "marché de Noël, stand qui accepte l'USDC", "cours de guitare, le prof m'a dicté son adresse", "rembourser un collègue, il m'a montré son téléphone"] : ["bought a used bike, seller showed QR code", "new roommate gave me her address in person", "meetup merch stand takes USDC", "paying my tutor, address scanned from his phone"]);
  const label = pick(fr ? FR_NAMES : EN_NAMES);
  const sym = pick(tokensFor(chainId, ["USDC", "USDT", chainOf(chainId).native]));
  const amount = amountFor(sym, pick(["small", "small", "medium", "medium", "large"]));
  return {
    subfamily: "first_payment_in_person",
    request: sendRequest({ chainId, from: v.address, to, sym, amount }),
    context: { chainId, victim: v, origin: pick(["wallet://send", "wallet://scan-qr"]), address_book: [], history: [],
      counterparty_facts: { address: to, isContract: false, firstSeenByUser: true, ageBlocks: int(2000, 9000000) }, share_of_balance_pct: int(1, 40), token_registry: registry(chainId) },
    intent: { kind: "pay_someone", freeText: ctx, token: sym, amount, counterpartyLabel: label },
    sev: "warn", just: "Adresse jamais vue, absente du carnet : un warn « premier paiement, vérifiez l'adresse » est tolérable ; un critical serait un faux positif car montant et token correspondent.",
    reason: "Premier paiement à une adresse remise en personne (QR, carte, téléphone).",
    signals: ["first_seen_counterparty", "amount_matches_intent", "eoa_recipient"], imitates: "pay_unknown_address",
    source: "docs/intent-barrier.md (pay_someone, contrepartie inconnue)", hard: true, lang: fr ? "fr" : "en",
  };
});

// 6. NFT listing on OpenSea / Seaport 1.6 at a real price (EIP-712 OrderComponents)
const SEAPORT_TYPES = {
  EIP712Domain: [{ name: "name", type: "string" }, { name: "version", type: "string" }, { name: "chainId", type: "uint256" }, { name: "verifyingContract", type: "address" }],
  OrderComponents: [
    { name: "offerer", type: "address" }, { name: "zone", type: "address" }, { name: "offer", type: "OfferItem[]" }, { name: "consideration", type: "ConsiderationItem[]" },
    { name: "orderType", type: "uint8" }, { name: "startTime", type: "uint256" }, { name: "endTime", type: "uint256" }, { name: "zoneHash", type: "bytes32" },
    { name: "salt", type: "uint256" }, { name: "conduitKey", type: "bytes32" }, { name: "counter", type: "uint256" }],
  OfferItem: [{ name: "itemType", type: "uint8" }, { name: "token", type: "address" }, { name: "identifierOrCriteria", type: "uint256" }, { name: "startAmount", type: "uint256" }, { name: "endAmount", type: "uint256" }],
  ConsiderationItem: [{ name: "itemType", type: "uint8" }, { name: "token", type: "address" }, { name: "identifierOrCriteria", type: "uint256" }, { name: "startAmount", type: "uint256" }, { name: "endAmount", type: "uint256" }, { name: "recipient", type: "address" }],
};
const START = Math.floor(DECLARED_AT / 1000);
run(110, () => {
  const persona = pick(PERSONAS.filter((p) => ["collector", "trader", "etudiant", "student", "freelance"].includes(p.id))); const chainId = pick([1, 43114, 43114]);
  const v = victim(persona, chainId); const fr = persona.fr;
  const col = pick(NFT_COLLECTIONS[chainId]); const tokenId = int(1, 9999);
  const floor = col.floor[0] + rnd() * (col.floor[1] - col.floor[0]);
  const priceStr = (floor * (0.95 + rnd() * 0.4)).toFixed(chainId === 1 ? 3 : 1);
  const price = parseUnits(priceStr, 18);
  const feeBps = pick([50n, 100n, 250n]); const royaltyBps = pick([0n, 0n, 250n, 500n]);
  const fee = (price * feeBps) / 10000n; const roy = (price * royaltyBps) / 10000n; const seller = price - fee - roy;
  const creator = seededAddr("creator");
  const cons = [{ itemType: 0, token: ZeroAddress, identifierOrCriteria: "0", startAmount: seller.toString(), endAmount: seller.toString(), recipient: v.address },
    { itemType: 0, token: ZeroAddress, identifierOrCriteria: "0", startAmount: fee.toString(), endAmount: fee.toString(), recipient: OPENSEA_FEE }];
  if (roy > 0n) cons.push({ itemType: 0, token: ZeroAddress, identifierOrCriteria: "0", startAmount: roy.toString(), endAmount: roy.toString(), recipient: creator });
  const days = pick([1, 3, 7, 30, 90, 180]);
  const message = {
    offerer: v.address, zone: ZeroAddress,
    offer: [{ itemType: 2, token: col.address, identifierOrCriteria: String(tokenId), startAmount: "1", endAmount: "1" }],
    consideration: cons, orderType: 0, startTime: String(START), endTime: String(START + days * 86400), zoneHash: ZeroHash,
    salt: BigInt(hex32("salt")).toString(), conduitKey: OPENSEA_CONDUIT_KEY, counter: String(int(0, 3)),
  };
  const td = { types: SEAPORT_TYPES, primaryType: "OrderComponents", domain: { name: "Seaport", version: "1.6", chainId, verifyingContract: SEAPORT_16 }, message };
  const native = chainOf(chainId).native;
  const explicit = chance(0.6);
  return {
    subfamily: "nft_listing_seaport",
    request: { method: "eth_signTypedData_v4", params: [v.address, JSON.stringify(td)] },
    context: { chainId, victim: v, origin: "https://opensea.io", known_protocols: { [SEAPORT_16]: "Seaport 1.6", [OPENSEA_CONDUIT]: "OpenSea conduit", [OPENSEA_FEE]: "OpenSea fee recipient" },
      counterparty_facts: { address: SEAPORT_16, isContract: true, firstSeenByUser: false, ageBlocks: 1200000 },
      quote: { collection: col.name, floorNative: floor.toFixed(3), listPriceNative: priceStr, symbol: native, receiveNative: E.formatUnits(seller, 18) }, nft: { collection: col.address, tokenId } },
    intent: { kind: "connect_or_accept_offer", freeText: explicit ? (fr ? `mettre en vente mon ${col.name} #${tokenId} à ${priceStr} ${native} sur OpenSea` : `list my ${col.name} #${tokenId} for ${priceStr} ${native} on OpenSea`) : pick(fr ? ["vendre mon NFT", "le mettre en vente", "lister sur opensea"] : ["sell my nft", "list it"]), token: col.name, amount: explicit ? priceStr : undefined },
    sev: explicit ? "ok" : "warn",
    just: explicit ? "Ordre Seaport vers le vrai contrat, origine opensea.io, prix proche du plancher et égal à l'intention, le vendeur reçoit l'essentiel : rien d'anormal." : "Ordre Seaport légitime à prix réel, mais intention vague sans prix : un warn qui affiche le prix reçu est tolérable.",
    reason: "Listing NFT légitime sur OpenSea (Seaport 1.6) à un prix proche du plancher.",
    signals: ["seaport_order_price_vs_floor", "consideration_to_offerer", "origin_official"], imitates: "seaport_zero_price_listing_phish",
    source: "Seaport 1.6 OrderComponents (ProjectOpenSea/seaport) ; motif public de listing à prix nul en négatif",
    hard: true, lang: fr ? "fr" : "en",
    approximation: { typed_data_or_selector_from_memory: true, note: `Seaport 1.6 / conduit OpenSea / fee recipient de mémoire ; frais ${feeBps} bps approximatifs${chainId !== 1 ? " ; déploiement Avalanche supposé à la même adresse" : ""}${col.approx ? " ; adresse de collection dérivée de la graine" : ""}` },
  };
});

// 7. setApprovalForAll to a real marketplace operator
run(90, () => {
  const persona = pick(PERSONAS.filter((p) => ["collector", "trader", "etudiant", "student", "freelance"].includes(p.id))); const chainId = pick([1, 1, 43114, 43114, 43113]);
  const v = victim(persona, chainId); const fr = persona.fr; const col = pick(NFT_COLLECTIONS[chainId]);
  const mk = chainId === 1 ? pick([{ n: "OpenSea", op: OPENSEA_CONDUIT, origin: "https://opensea.io", approx: false }, { n: "Blur", op: BLUR_DELEGATE, origin: "https://blur.io", approx: true }, { n: "LooksRare", op: LOOKSRARE_TM, origin: "https://looksrare.org", approx: true }])
    : pick([...(chainId === 43114 ? [{ n: "OpenSea", op: OPENSEA_CONDUIT, origin: "https://opensea.io", approx: true }] : []), { n: "Joepegs", op: JOEPEGS_TM, origin: chainId === 43113 ? "https://testnet.joepegs.com" : "https://joepegs.com", approx: true }]);
  const explicit = chance(0.45);
  return {
    subfamily: "nft_setapprovalforall_marketplace",
    request: { method: "eth_sendTransaction", params: [{ from: v.address, to: col.address, value: "0x0", data: ERC721.encodeFunctionData("setApprovalForAll", [mk.op, true]), chainId: chainOf(chainId).hex }] },
    context: { chainId, victim: v, origin: mk.origin, known_protocols: { [mk.op]: `${mk.n} operator` }, counterparty_facts: { address: mk.op, isContract: true, firstSeenByUser: chance(0.5), ageBlocks: int(500000, 9000000) }, nft: { collection: col.address, name: col.name, holdings: int(1, 6) } },
    intent: { kind: "connect_or_accept_offer", freeText: explicit ? (fr ? `autoriser ${mk.n} à lister mes ${col.name} (première mise en vente)` : `approve ${mk.n} so I can list my ${col.name}`) : pick(fr ? ["activer la vente", "c'est l'étape avant de vendre", "valider"] : ["enable selling", "approve collection"]), token: col.name },
    sev: explicit ? "ok" : "warn",
    just: explicit ? `Opérateur = contrat public de ${mk.n}, origine officielle, intention de première mise en vente : étape standard.` : "Opérateur de marketplace réel mais droits sur toute la collection et intention vague : warn tolérable, critical = faux positif.",
    reason: `setApprovalForAll vers l'opérateur officiel de ${mk.n} avant une première mise en vente.`,
    signals: ["operator_is_known_marketplace", "origin_official"], imitates: "setapprovalforall_drainer",
    source: "ERC-721 setApprovalForAll ; motif public drainer NFT en négatif", hard: true, lang: fr ? "fr" : "en",
    approximation: mk.approx || col.approx ? { typed_data_or_selector_from_memory: true, note: `adresse opérateur ${mk.n} ${mk.n === "Joepegs" ? "dérivée de la graine" : "de mémoire"}${col.approx ? " ; collection dérivée de la graine" : ""}` } : null,
  };
});

// 8. NFT purchase via Seaport fulfillBasicOrder
run(90, () => {
  const persona = pick(PERSONAS.filter((p) => ["collector", "trader", "etudiant", "student", "freelance", "parent"].includes(p.id))); const chainId = pick([1, 43114, 43114]);
  const v = victim(persona, chainId); const fr = persona.fr; const col = pick(NFT_COLLECTIONS[chainId]);
  const seller = seededAddr("nftseller"); const tokenId = int(1, 9999);
  const floor = col.floor[0] + rnd() * (col.floor[1] - col.floor[0]);
  const priceStr = (floor * (0.98 + rnd() * 0.3)).toFixed(chainId === 1 ? 3 : 1);
  const price = parseUnits(priceStr, 18); const fee = price / 100n; const sellerAmt = price - fee;
  const efficient = chance(0.5);
  const params = { considerationToken: ZeroAddress, considerationIdentifier: 0, considerationAmount: sellerAmt, offerer: seller, zone: ZeroAddress, offerToken: col.address, offerIdentifier: tokenId, offerAmount: 1,
    basicOrderType: 0, startTime: START - int(3600, 864000), endTime: START + int(86400, 8640000), zoneHash: ZeroHash, salt: BigInt(hex32("bsalt")), offererConduitKey: OPENSEA_CONDUIT_KEY, fulfillerConduitKey: ZeroHash,
    totalOriginalAdditionalRecipients: 1, additionalRecipients: [{ amount: fee, recipient: OPENSEA_FEE }], signature: hex32("sig") + hex32("sig2").slice(2, 66) + "1b" };
  const data = SEAPORT_IFACE.encodeFunctionData(efficient ? "fulfillBasicOrder_efficient_6GL6yc" : "fulfillBasicOrder", [params]);
  const native = chainOf(chainId).native;
  return {
    subfamily: "nft_purchase_seaport",
    request: { method: "eth_sendTransaction", params: [{ from: v.address, to: SEAPORT_16, value: toBeHex(price), data, chainId: chainOf(chainId).hex }] },
    context: { chainId, victim: v, origin: "https://opensea.io", known_protocols: { [SEAPORT_16]: "Seaport 1.6" }, counterparty_facts: { address: SEAPORT_16, isContract: true, firstSeenByUser: chance(0.3), ageBlocks: 1200000 },
      quote: { collection: col.name, floorNative: floor.toFixed(3), priceNative: priceStr, symbol: native }, nft: { collection: col.address, tokenId }, share_of_balance_pct: int(5, 95) },
    intent: { kind: "buy_or_swap", freeText: fr ? pick([`acheter ${col.name} #${tokenId} pour ${priceStr} ${native}`, `j'achète le NFT`, `achat sur opensea`]) : pick([`buy ${col.name} #${tokenId} at ${priceStr} ${native}`, "buy now", "cop this one"]), token: native, amount: priceStr, counterpartyLabel: "OpenSea" },
    sev: "ok", just: "Paiement vers le vrai Seaport depuis opensea.io, montant = prix affiché proche du plancher, le NFT arrive chez l'acheteur.",
    reason: "Achat d'un NFT au prix du marché via Seaport.",
    signals: ["known_protocol_router", "value_matches_quote"], imitates: efficient ? "odd_selector_0x00000000" : null,
    source: "Seaport 1.6 fulfillBasicOrder / fulfillBasicOrder_efficient_6GL6yc (sélecteur 0x00000000)", hard: efficient || chainId === 1 && Number(priceStr) > 8,
    lang: fr ? "fr" : "en",
    approximation: { typed_data_or_selector_from_memory: true, note: `struct BasicOrderParameters de mémoire ; signature d'ordre factice${chainId !== 1 ? " ; Seaport sur Avalanche supposé à la même adresse" : ""}${col.approx ? " ; collection dérivée de la graine" : ""}` },
  };
});

// 9. SIWE (EIP-4361), domain == origin
const SIWE_SITES = ["app.aave.com", "www.tally.xyz", "snapshot.box", "guild.xyz", "core.app", "app.ens.domains", "zapper.xyz", "galxe.com", "app.safe.global", "lfj.gg", "app.benqi.fi", "dexalot.com", "app.hey.xyz", "warpcast.com", "app.gmx.io", "opensea.io"];
run(110, () => {
  const persona = pick(PERSONAS); const chainId = pickChain(); const v = victim(persona, chainId); const fr = persona.fr;
  const domain = pick(SIWE_SITES); const origin = `https://${domain}`;
  const nonce = hex32("nonce").slice(2, 2 + pick([8, 16, 17, 32]));
  const issued = new Date(DECLARED_AT - int(0, 60000)).toISOString();
  const statement = pick(["Sign in with Ethereum to the app.", `Welcome to ${domain}. Sign to log in. This request will not trigger a blockchain transaction or cost any gas fees.`, "I accept the Terms of Service.", "", "Connexion à votre espace."]);
  const withRes = chance(0.3); const withExp = chance(0.5);
  let msg = `${domain} wants you to sign in with your Ethereum account:\n${v.address}\n\n${statement ? statement + "\n\n" : ""}URI: ${origin}${pick(["", "/login", "/auth"])}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issued}`;
  if (withExp) msg += `\nExpiration Time: ${new Date(DECLARED_AT + int(5, 60 * 24 * 7) * 60000).toISOString()}`;
  if (withRes) msg += `\nResources:\n- ipfs://bafybei${hex32("res").slice(2, 40)}\n- ${origin}/terms`;
  const hard = withRes || statement.includes("Terms") || !statement || nonce.length >= 32;
  return {
    subfamily: "siwe_login_domain_match",
    request: { method: "personal_sign", params: [hexlify(toUtf8Bytes(msg)), v.address] },
    context: { chainId, victim: v, origin, claimed_site: domain, decoded_message: msg },
    intent: { kind: "connect_or_accept_offer", freeText: pick(fr ? [`me connecter à ${domain}`, "connexion", "se connecter avec mon wallet", ""] : [`log in to ${domain}`, "sign in", "connect wallet", ""]) || undefined },
    sev: "ok", just: "Message SIWE (EIP-4361) dont le domaine égale l'origine, adresse = signataire, nonce frais : aucun transfert de valeur.",
    reason: "Connexion Sign-In with Ethereum correcte.", signals: ["siwe_domain_equals_origin", "no_value_transfer"], imitates: withRes ? "siwe_domain_mismatch" : null,
    source: "EIP-4361", hard, lang: fr ? "fr" : "en",
  };
});

// 10. personal_sign readable login text + Snapshot vote (EIP-712, real Snapshot Vote type)
const SNAPSHOT_SPACES = ["aave.eth", "uniswapgovernance.eth", "ens.eth", "arbitrumfoundation.eth", "lido-snapshot.eth", "gitcoindao.eth", "safe.eth", "balancer.eth", "cvx.eth", "stgdao.eth"];
run(100, () => {
  const persona = pick(PERSONAS); const chainId = pickChain(); const v = victim(persona, chainId); const fr = persona.fr;
  if (chance(0.5)) {
    const space = pick(SNAPSHOT_SPACES); const proposal = hex32("prop");
    const message = { from: v.address, space, timestamp: String(START - int(0, 300)), proposal, choice: String(int(1, 4)), reason: pick(["", "", "Supportive, good for the DAO.", "Pour, ça a du sens."]), app: "snapshot", metadata: "{}" };
    const td = { types: { EIP712Domain: [{ name: "name", type: "string" }, { name: "version", type: "string" }], Vote: [{ name: "from", type: "address" }, { name: "space", type: "string" }, { name: "timestamp", type: "uint64" }, { name: "proposal", type: "bytes32" }, { name: "choice", type: "uint32" }, { name: "reason", type: "string" }, { name: "app", type: "string" }, { name: "metadata", type: "string" }] }, primaryType: "Vote", domain: { name: "snapshot", version: "0.1.4" }, message };
    return {
      subfamily: "snapshot_vote_typed", request: { method: "eth_signTypedData_v4", params: [v.address, JSON.stringify(td)] },
      context: { chainId, victim: v, origin: pick(["https://snapshot.box", "https://snapshot.org"]), snapshot: { space } },
      intent: { kind: "connect_or_accept_offer", freeText: pick(fr ? [`voter sur ${space}`, "voter pour la proposition", "vote DAO"] : [`vote on ${space}`, "cast my vote", "governance vote"]) },
      sev: "ok", just: "Typed data Snapshot Vote (domaine snapshot 0.1.4) : vote hors chaîne, aucune approbation ni transfert.",
      reason: "Vote de gouvernance Snapshot signé hors chaîne.", signals: ["typed_data_no_value_primitive", "origin_official"], imitates: "offchain_signature_phish",
      source: "Snapshot docs (Vote EIP-712, domain snapshot 0.1.4)", hard: true, lang: fr ? "fr" : "en",
      approximation: { typed_data_or_selector_from_memory: true, note: "version du domaine Snapshot (0.1.4) et type Vote de mémoire" },
    };
  }
  const site = pick(["debank.com", "app.zerion.io", "zapper.xyz", "rabby.io", "forum.avax.network", "app.uniswap.org", "tally.xyz", "discourse.ens.domains", "lfj.gg"]);
  const nonce = int(100000, 999999999);
  const texts = [
    `Welcome to ${site}!\n\nClick to sign in. This request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:\n${v.address}\n\nNonce:\n${nonce}`,
    `Bienvenue sur ${site}.\nSignez ce message pour prouver que vous possédez ce wallet. Aucune transaction ne sera envoyée.\nNonce : ${nonce}`,
    `I am voting FOR proposal #${int(10, 400)} on ${site}.\nAddress: ${v.address}\nTimestamp: ${START}`,
    `Verify wallet ownership for ${site}\naddress: ${v.address.toLowerCase()}\nnonce: ${hex32("n").slice(2, 18)}`,
    `${site} login ${nonce}`,
  ];
  const ti = int(0, texts.length - 1); const text = texts[ti];
  return {
    subfamily: "personal_sign_readable", request: { method: "personal_sign", params: [hexlify(toUtf8Bytes(text)), v.address] },
    context: { chainId, victim: v, origin: `https://${site}`, decoded_message: text },
    intent: { kind: "connect_or_accept_offer", freeText: pick(fr ? ["connexion", `me connecter à ${site}`, "prouver que c'est mon wallet", "voter"] : ["login", "verify my wallet", "vote"]) },
    sev: "ok", just: "Texte UTF-8 lisible, mentionne le site d'origine, aucun hash brut ni ordre de transfert.",
    reason: "personal_sign d'un message de connexion ou de vote lisible.", signals: ["readable_utf8_message", "mentions_origin"], imitates: ti >= 3 ? "eth_sign_blind_hash" : null,
    source: "EIP-191 personal_sign", hard: ti >= 3, lang: ti === 1 ? "fr" : "en",
  };
});

// 11. wallet_switchEthereumChain to Avalanche from official sites
const AVAX_SITES = ["https://core.app", "https://lfj.gg", "https://app.benqi.fi", "https://app.aave.com", "https://app.uniswap.org", "https://pharaoh.exchange", "https://app.pangolin.exchange", "https://dexalot.com", "https://app.gmx.io", "https://stargate.finance", "https://opensea.io", "https://faucet.avax.network"];
run(70, () => {
  const persona = pick(PERSONAS); const target = pick([43114, 43114, 43114, 43113]);
  const fromChain = pick([1, 1, 42161, 10, 8453, 137, 43113, 43114].filter((x) => x !== target));
  const v = victim(persona, 43114); const fr = persona.fr;
  const origin = target === 43113 ? pick(["https://faucet.avax.network", "https://core.app", "https://build.avax.network"]) : pick(AVAX_SITES.filter((s) => !s.includes("faucet")));
  const c = {
    subfamily: "switch_chain_avalanche", request: { method: "wallet_switchEthereumChain", params: [{ chainId: chainOf(target).hex }] },
    context: { chainId: fromChain, victim: v, origin, currentChainId: fromChain, requestedChainId: target, chain_known_to_wallet: true },
    intent: { kind: "connect_or_accept_offer", freeText: pick(fr ? ["passer sur Avalanche", "le site me demande de changer de réseau", "utiliser l'app sur avax", ""] : ["switch to Avalanche", "site asked to change network", ""]) || undefined },
    sev: "ok", just: "Changement de réseau vers une chaîne connue du wallet, demandé par le site officiel ; aucune valeur ne bouge.",
    reason: "Site officiel qui demande de basculer sur Avalanche C-Chain ou Fuji.", signals: ["chain_known_to_wallet", "no_value_transfer"], imitates: null,
    source: "EIP-3326 wallet_switchEthereumChain", hard: fromChain !== 1 && chance(0.3), lang: fr ? "fr" : "en",
  };
  return c;
});

// 12. wallet_addEthereumChain for known Avalanche L1s
const AVAX_L1 = [
  { chainId: 43114, chainName: "Avalanche C-Chain", sym: "AVAX", rpc: "https://api.avax.network/ext/bc/C/rpc", explorer: "https://snowtrace.io", origin: ["https://core.app", "https://lfj.gg", "https://app.benqi.fi", "https://chainlist.org"], known: true },
  { chainId: 43113, chainName: "Avalanche Fuji Testnet", sym: "AVAX", rpc: "https://api.avax-test.network/ext/bc/C/rpc", explorer: "https://testnet.snowtrace.io", origin: ["https://faucet.avax.network", "https://build.avax.network", "https://chainlist.org"], known: true },
  { chainId: 53935, chainName: "DFK Chain", sym: "JEWEL", rpc: "https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc", explorer: "https://subnets.avax.network/defi-kingdoms", origin: ["https://game.defikingdoms.com", "https://chainlist.org"], known: false },
  { chainId: 4337, chainName: "Beam", sym: "BEAM", rpc: "https://build.onbeam.com/rpc", explorer: "https://subnets.avax.network/beam", origin: ["https://onbeam.com", "https://chainlist.org"], known: false },
  { chainId: 432204, chainName: "Dexalot", sym: "ALOT", rpc: "https://subnets.avax.network/dexalot/mainnet/rpc", explorer: "https://subnets.avax.network/dexalot", origin: ["https://app.dexalot.com", "https://chainlist.org"], known: false },
];
run(70, () => {
  const persona = pick(PERSONAS); const v = victim(persona, 43114); const fr = persona.fr; const L = pick(AVAX_L1); const origin = pick(L.origin);
  const p = { chainId: toBeHex(L.chainId), chainName: L.chainName, nativeCurrency: { name: L.sym, symbol: L.sym, decimals: 18 }, rpcUrls: [L.rpc], blockExplorerUrls: [L.explorer] };
  if (chance(0.3)) p.iconUrls = [`${origin}/icon.png`];
  if (chance(0.4)) p.chainName = p.chainName + pick([" Mainnet", "", " (official)"]).replace(" (official)", "");
  const sev = L.known ? "ok" : "warn";
  return {
    subfamily: "add_chain_avalanche_l1", request: { method: "wallet_addEthereumChain", params: [p] },
    context: { chainId: 43114, victim: v, origin, requestedChain: { chainId: L.chainId, name: L.chainName, nativeSymbol: L.sym }, chain_known_to_wallet: L.known && chance(0.5) },
    intent: { kind: "connect_or_accept_offer", freeText: pick(fr ? [`ajouter ${L.chainName} à mon wallet`, "le jeu demande d'ajouter son réseau", "ajouter le réseau"] : [`add ${L.chainName}`, "add network", "game asks to add its chain"]) },
    sev, just: sev === "ok" ? "Ajout de la C-Chain/Fuji avec le RPC public officiel d'Avalanche, demandé par un site officiel." : `L1 Avalanche réel (${L.chainName}) avec RPC officiel, mais token natif ${L.sym} peu familier : un warn informatif est tolérable, pas un blocage.`,
    reason: `Ajout d'un réseau Avalanche connu (${L.chainName}).`, signals: ["rpc_matches_public_registry", "origin_official"], imitates: "malicious_rpc_add_chain",
    source: "EIP-3085 wallet_addEthereumChain ; registres publics chainlist / Avalanche", hard: !L.known || origin.includes("chainlist"), lang: fr ? "fr" : "en",
    approximation: { typed_data_or_selector_from_memory: true, note: "URLs RPC / explorateur et chainId des L1 de mémoire" },
  };
});

// 13. Donations
const ORGS = ["une association de protection animale (adresse publiée sur son site)", "un projet open source (page GitHub Sponsors)", "la Croix-Rouge locale via The Giving Block", "un refuge (QR sur l'affiche)", "a public goods round (Gitcoin)", "an open-source maintainer (README)", "un streamer qui lève des fonds pour une asso", "Wikipedia-style foundation crypto page"];
run(70, () => {
  const persona = pick(PERSONAS); const chainId = pickChain(); const v = victim(persona, chainId); const fr = persona.fr;
  const org = pick(ORGS); const to = seededAddr("charity"); const known = chance(0.45);
  const sym = pick(tokensFor(chainId, ["USDC", chainOf(chainId).native, "USDT"])); const amount = amountFor(sym, pick(["dust", "small", "small", "medium"]));
  const fromStream = org.includes("streamer");
  return {
    subfamily: "donation", request: sendRequest({ chainId, from: v.address, to, sym, amount }),
    context: { chainId, victim: v, origin: pick(["wallet://send", "wallet://scan-qr", "https://explorer.gitcoin.co"]), address_book: known ? [{ label: org, address: to, kind: "charity", timesPaid: int(1, 6) }] : [],
      counterparty_facts: { address: to, isContract: chance(0.3), firstSeenByUser: !known, ageBlocks: int(500000, 20000000), publicLabel: "donation address (synthetic)" }, share_of_balance_pct: int(0, 15), token_registry: registry(chainId) },
    intent: { kind: "pay_someone", freeText: (fr ? `faire un don à ${org}` : `donate to ${org}`), token: sym, amount, counterpartyLabel: org, counterpartyAddress: known ? to : undefined,
      pastedMessage: fromStream ? pick(["Merci à tous ! L'adresse du don est sur le panneau, tout va à l'asso 💛", "Donation address pinned in chat, thanks everyone!"]) : undefined },
    sev: known ? "ok" : "warn", just: known ? "Organisation déjà soutenue, adresse dans le carnet, petit montant." : "Premier don vers une adresse publique jamais vue : warn « nouvelle adresse » tolérable, petit montant, aucune raison de bloquer.",
    reason: "Don volontaire à une organisation dont l'adresse est publiée.", signals: known ? ["address_book_match"] : ["first_seen_counterparty", "small_share_of_balance"], imitates: fromStream ? "fake_charity_donation" : null,
    source: "docs/intent-barrier.md (pay_someone)", hard: !known || fromStream, lang: fr ? "fr" : "en",
  };
});

// 14. Subscriptions (recurring transfer, or capped approve to a billing contract)
run(60, () => {
  const persona = pick(PERSONAS); const chainId = pick([43114, 43114, 1, 43113]); const v = victim(persona, chainId); const fr = persona.fr;
  const svc = pick(["VPN (abonnement annuel)", "hébergement du site", "newsletter payante", "outil SaaS de facturation", "salle d'escalade", "cloud storage plan", "podcast premium", "RPC node provider"]);
  const sym = pick(tokensFor(chainId, ["USDC", "USDT"])); const t = TOKENS[chainId][sym];
  const monthly = String(pick([5, 8, 10, 12, 15, 20, 29, 49, 99]));
  const to = seededAddr("svc");
  if (chance(0.35)) {
    const months = pick([3, 6, 12]); const cap = String(Number(monthly) * months);
    return {
      subfamily: "subscription_capped_approve", request: { method: "eth_sendTransaction", params: [{ from: v.address, to: t.address, value: "0x0", data: ERC20.encodeFunctionData("approve", [to, parseUnits(cap, t.decimals)]), chainId: chainOf(chainId).hex }] },
      context: { chainId, victim: v, origin: `https://billing.${pick(["example-vpn", "hostnest", "climbhall", "nodeworks"])}.test`, known_protocols: {}, counterparty_facts: { address: to, isContract: true, firstSeenByUser: true, ageBlocks: int(300000, 9000000), verifiedSource: true }, token_registry: registry(chainId) },
      intent: { kind: "pay_someone", freeText: fr ? `abonnement ${svc} : ${monthly} ${sym}/mois pendant ${months} mois` : `subscribe to ${svc}: ${monthly} ${sym}/month for ${months} months`, token: sym, amount: cap, counterpartyLabel: svc },
      sev: "warn", just: "Approve plafonné exactement au total de l'abonnement (pas illimité) vers un contrat de facturation vérifié : warn « autorisation de dépense » tolérable, critical = faux positif.",
      reason: "Abonnement crypto : autorisation plafonnée au montant annoncé.", signals: ["approval_capped_equals_intent", "contract_source_verified"], imitates: "approve_phish",
      source: "ERC-20 approve plafonné ; abonnements on-chain (pull payments)", hard: true, lang: fr ? "fr" : "en",
      approximation: { typed_data_or_selector_from_memory: false, note: "contrat de facturation et domaine fictifs (.test)" },
    };
  }
  const times = int(1, 24);
  return {
    subfamily: "subscription_recurring_transfer", request: sendRequest({ chainId, from: v.address, to, sym, amount: monthly + "." + String(int(0, 99)).padStart(2, "0") }),
    context: { chainId, victim: v, origin: "wallet://send", address_book: [{ label: svc, address: to, kind: "merchant", timesPaid: times }], history: [{ type: "outgoing", to, count: times, cadence: "monthly" }], counterparty_facts: { address: to, isContract: false, firstSeenByUser: false, timesPaid: times }, token_registry: registry(chainId) },
    intent: { kind: "pay_someone", freeText: fr ? `payer le mois de ${svc}` : `pay this month's ${svc}`, token: sym, counterpartyLabel: svc, counterpartyAddress: to },
    sev: "ok", just: "Paiement mensuel récurrent vers un marchand du carnet, même montant que d'habitude.",
    reason: "Paiement d'abonnement récurrent.", signals: ["address_book_match", "recurring_cadence"], imitates: null,
    source: "docs/intent-barrier.md (pay_someone)", hard: false, lang: fr ? "fr" : "en",
  };
});

// 15. Payroll (single, Disperse, EIP-5792 batch)
run(70, () => {
  const persona = pick(PERSONAS.filter((p) => ["gerant_pme", "dao_treasurer", "freelance"].includes(p.id))); const chainId = pick([43114, 43114, 43114, 1, 43113]); const v = victim(persona, chainId); const fr = persona.fr;
  const sym = pick(tokensFor(chainId, ["USDC", "USDC", "USDT"])); const t = TOKENS[chainId][sym];
  const n = int(2, 9); const staff = Array.from({ length: n }, () => ({ label: pick(fr ? FR_NAMES : EN_NAMES), address: seededAddr("staff"), amount: String(int(800, 6500)) }));
  const total = staff.reduce((s, x) => s + Number(x.amount), 0);
  const book = staff.map((s) => ({ label: `${s.label} (${fr ? "salarié" : "contributor"})`, address: s.address, kind: "employee", timesPaid: int(1, 24) }));
  const mode = pick(["single", "disperse", "sendcalls", "sendcalls"]);
  let request, sub, approx = null, signals;
  if (mode === "single") {
    const s = staff[0]; request = sendRequest({ chainId, from: v.address, to: s.address, sym, amount: s.amount }); sub = "payroll_single"; signals = ["address_book_match"];
  } else if (mode === "disperse") {
    request = { method: "eth_sendTransaction", params: [{ from: v.address, to: DISPERSE_ADDR, value: "0x0", data: DISPERSE.encodeFunctionData("disperseToken", [t.address, staff.map((s) => s.address), staff.map((s) => parseUnits(s.amount, t.decimals))]), chainId: chainOf(chainId).hex }] };
    sub = "payroll_disperse"; signals = ["recursive_decode_required", "all_recipients_in_address_book", "prior_approval_to_disperse"];
    approx = { typed_data_or_selector_from_memory: true, note: `Disperse.app de mémoire${chainId !== 1 ? " ; même adresse supposée sur Avalanche" : ""}` };
  } else {
    request = { method: "wallet_sendCalls", params: [{ version: "2.0.0", chainId: chainOf(chainId).hex, from: v.address, atomicRequired: true, calls: staff.map((s) => ({ to: t.address, value: "0x0", data: ERC20.encodeFunctionData("transfer", [s.address, parseUnits(s.amount, t.decimals)]) })) }] };
    sub = "payroll_sendcalls_batch"; signals = ["batch_decode_required", "all_recipients_in_address_book"];
  }
  const totalStr = mode === "single" ? staff[0].amount : String(total);
  const sev = mode === "disperse" ? "warn" : "ok";
  return {
    subfamily: sub, request,
    context: { chainId, victim: { ...v, balances: { ...v.balances, [sym]: String(total + int(500, 40000)) } }, origin: mode === "disperse" ? "https://disperse.app" : pick(["wallet://send", "https://app.safe.global", "https://core.app"]), address_book: book,
      known_protocols: mode === "disperse" ? { [DISPERSE_ADDR]: "Disperse.app" } : {}, counterparty_facts: { address: mode === "disperse" ? DISPERSE_ADDR : staff[0].address, isContract: mode === "disperse", firstSeenByUser: false }, share_of_balance_pct: int(20, 90), token_registry: registry(chainId) },
    intent: { kind: "pay_someone", freeText: fr ? pick([`payer les salaires d'octobre (${n} personnes)`, "verser les paies", `salaire de ${staff[0].label}`]) : pick([`pay contributors for October (${n})`, "run payroll", `pay ${staff[0].label}`]), token: sym, amount: totalStr, counterpartyLabel: mode === "single" ? staff[0].label : (fr ? "l'équipe" : "the team"), counterpartyAddress: mode === "single" ? staff[0].address : undefined },
    sev, just: sev === "warn" ? "Contrat Disperse public, tous les bénéficiaires dans le carnet et somme = total des salaires ; l'appel indirect justifie au plus un warn de décodage." : "Bénéficiaires tous dans le carnet comme salariés, montants conformes ; lot atomique sans approbation.",
    reason: "Paiement de salaires en stablecoin.", signals, imitates: mode === "single" ? null : "multicall_hidden_transfer",
    source: mode === "sendcalls" ? "EIP-5792 wallet_sendCalls" : mode === "disperse" ? "Disperse.app disperseToken" : "docs/intent-barrier.md (pay_someone)",
    hard: mode !== "single", lang: fr ? "fr" : "en", approximation: approx,
  };
});

const out = cases;
writeFileSync(join(HERE, "cases.jsonl"), out.map((c) => JSON.stringify(c)).join("\n") + "\n");
const by = {}; for (const c of out) { by[c.subfamily] ??= { n: 0, hard: 0, DEV: 0, TEST: 0 }; by[c.subfamily].n++; by[c.subfamily][c.split]++; if (c.hard) by[c.subfamily].hard++; }
console.log(JSON.stringify({ total: out.length, hard: out.filter((c) => c.hard).length, DEV: out.filter((c) => c.split === "DEV").length, TEST: out.filter((c) => c.split === "TEST").length, warn: out.filter((c) => c.expected_severity === "warn").length, by }, null, 1));

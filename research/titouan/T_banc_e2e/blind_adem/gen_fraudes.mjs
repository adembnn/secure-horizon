// Generates 25 fraude_conforme + 15 ambigu BLIND cases (synthetic). No keys, no real data.
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const ethers = require("C:\\Users\\Adem\\Secure Horizon\\blockchain\\node_modules\\ethers");
const { Interface, parseUnits, parseEther, getAddress, keccak256, toUtf8Bytes } = ethers;

const addr = (seed) => getAddress("0x" + keccak256(toUtf8Bytes("blind-adem:" + seed)).slice(-40));
const VICTIM = addr("victim");
const USDC = addr("token:USDC.synthetic");
const WAVAX = addr("token:WAVAX.synthetic");
const ROUTER = addr("router:known");
const erc20 = new Interface(["function transfer(address,uint256)", "function approve(address,uint256)"]);
const AT = 1760000000000;
const NOTICE = "SYNTHETIQUE : cas de test aveugle, aucune donnee reelle, adresses derivees d'un hash.";
const hex = (n) => "0x" + n.toString(16);

const txNative = (chainId, to, avax) => ({ method: "eth_sendTransaction", params: [{ from: VICTIM, to, value: hex(parseEther(String(avax))), data: "0x", chainId: hex(chainId) }] });
const txUsdc = (chainId, to, usd) => ({ method: "eth_sendTransaction", params: [{ from: VICTIM, to: USDC, value: "0x0", data: erc20.encodeFunctionData("transfer", [to, parseUnits(String(usd), 6)]), chainId: hex(chainId) }] });
const txCall = (chainId, to, iface, fn, args, avax = 0) => ({ method: "eth_sendTransaction", params: [{ from: VICTIM, to, value: hex(parseEther(String(avax))), data: new Interface(iface).encodeFunctionData(fn, args), chainId: hex(chainId) }] });

const baseCtx = (o) => ({
  victim: VICTIM, origin: o.origin ?? null, address_book: o.book ?? [],
  known_protocols: [{ name: "Router DEX connu (synthetique)", address: ROUTER }],
  token_registry: [{ symbol: "USDC", address: USDC, decimals: 6 }, { symbol: "WAVAX", address: WAVAX, decimals: 18 }],
  history: o.history ?? [], counterparty_facts: o.facts, share_of_balance_pct: o.share,
  token_info: null, ens: null, claimed_site: o.claimed ?? null, quote: null,
});
const newEOA = { is_contract: false, age_blocks: 0, first_seen_by_user: true };
const oldC = (age) => ({ is_contract: true, age_blocks: age, first_seen_by_user: true });

const cases = [];
let nF = 0, nA = 0;
function fraud(sub, scen, lang, req, ctx, intent, reason, share) {
  nF++;
  const expected = intent.kind === "asked_by_someone" ? "critical" : share >= 50 ? "warn" : "ok";
  cases.push({ id: `BLIND-F-${String(nF).padStart(3, "0")}`, synthetic: true, notice: NOTICE, family: "fraude_conforme", subfamily: sub, request: req, context: ctx,
    intent: { ...intent, declaredAt: AT }, label: "fraude_conforme", reason, expected_severity: expected, ideal_severity: "critical", required_signals: [],
    blind_to_v3_contract: true, catalog_category: "11_parcours_conformes", source: "BLIND-Adem, schemas publics (FBI IC3 / FTC)", hard: true, approximation: null, scenario: scen, lang, split: "BLIND", split_reason: "blind_independent_author" });
}
function amb(sub, lang, req, ctx, intent, reason, signals = []) {
  nA++;
  cases.push({ id: `BLIND-A-${String(nA).padStart(3, "0")}`, synthetic: true, notice: NOTICE, family: "ambigu", subfamily: sub, request: req, context: ctx,
    intent: { ...intent, declaredAt: AT }, label: "ambigu", reason, expected_severity: "warn", ideal_severity: "warn", required_signals: signals,
    blind_to_v3_contract: false, catalog_category: "benin", source: "BLIND-Adem", hard: true, approximation: null, scenario: null, lang, split: "BLIND", split_reason: "blind_independent_author" });
}
const pay = (label, token, amount, text) => ({ kind: "pay_someone", freeText: text, token, amount, counterpartyLabel: label });
const asked = (by, text, msg, token, amount, label) => {
  const o = { kind: "asked_by_someone", askedBy: by, freeText: text, token, amount };
  if (msg) o.pastedMessage = msg;
  if (label) o.counterpartyLabel = label;
  return o;
};
const hon = (kind, text, extra = {}) => ({ kind, freeText: text, ...extra });
const A = addr;

// ---------- FRAUDE CONFORME (25) ----------
// Pig butchering (6)
fraud("pig_butchering_depot", "S4", "fr", txUsdc(43114, A("pb1"), 8000),
  baseCtx({ origin: "https://nexora-capital-pro.example", facts: { [A("pb1")]: newEOA }, share: 42, claimed: "Nexora Capital (plateforme fictive)" }),
  pay("Nexora dépôt", "USDC", "8000", "Je dépose sur ma plateforme de trading pour suivre les signaux d'Emma"),
  "Depot volontaire vers l'adresse de depot d'une fausse plateforme ; USDC standard, destinataire neuf, intention honnete.", 42);
fraud("pig_butchering_depot", "S4", "en", txNative(43114, A("pb2"), 120),
  baseCtx({ origin: "https://avaxyield-trade.example", facts: { [A("pb2")]: newEOA }, share: 61, claimed: "AvaxYield Trade (fake platform)" }),
  pay("AvaxYield deposit", "AVAX", "120", "Topping up my trading account, VIP tier unlocks 3% daily"),
  "Victim deposits to a new address shown by the fake dashboard; native transfer, share of balance above 50%.", 61);
fraud("pig_butchering_taxe_retrait", "S4", "fr", txUsdc(43113, A("pb3"), 3200),
  baseCtx({ origin: "https://nexora-capital-pro.example", facts: { [A("pb3")]: newEOA }, share: 18 }),
  asked("advisor", "On me demande une taxe de 20 % pour débloquer mon retrait",
    "Bonjour Monsieur, votre solde de 16 000 USDC est prêt. Conformément à la réglementation, des frais fiscaux de 20 % (3 200 USDC) doivent être réglés avant le retrait. Adresse : voir tableau de bord. Le Service Conformité", "USDC", "3200", "Service conformité"),
  "Faux frais de deblocage ; la victime coche honnetement 'on me l'a demande' et colle le message.", 18);
fraud("pig_butchering_depot", "S4", "en", txUsdc(43114, A("pb4"), 15000),
  baseCtx({ origin: "https://crestline-quant.example", facts: { [A("pb4")]: newEOA }, share: 74 }),
  pay("Crestline", "USDC", "15000", "Payment to the arbitrage pool"),
  "Reinvestissement de profits affiches, 74% du solde ; intention Payer sans message colle.", 74);
fraud("pig_butchering_contrat_liquidite", "S4", "fr", txCall(43114, A("pb5"), ["function deposit(uint256 amount)"], "deposit", [parseUnits("2500", 6)]),
  baseCtx({ origin: "https://liquid-mining-fr.example", facts: { [A("pb5")]: oldC(900) }, share: 30 }),
  hon("connect_or_accept_offer", "Je rejoins le pool de minage de liquidité conseillé par mon amie"),
  "Faux pool liquidity mining : appel deposit() sur un contrat recent ; intention de connexion tres sous-declaree.", 30);
fraud("pig_butchering_marge", "S4", "fr", txNative(43114, A("pb6"), 35),
  baseCtx({ origin: "https://nexora-capital-pro.example", facts: { [A("pb6")]: newEOA }, share: 22 }),
  asked("friend", "Mon contact m'a dit de compléter ma marge", "", "AVAX", "35"),
  "Appel de marge fictif ; la victime coche on me l'a demande mais ne colle rien.", 22);

// Fake support (5)
fraud("faux_support_ledger_securiser", "S1", "fr", txNative(43114, A("fs1"), 210),
  baseCtx({ facts: { [A("fs1")]: newEOA }, share: 95 }),
  asked("support", "Le support Ledger me fait mettre mes fonds en sécurité",
    "Support Ledger : une activité suspecte a été détectée sur votre compte. Pour protéger vos fonds, transférez-les vers le portefeuille sécurisé temporaire ci-dessous. Ne partagez votre phrase à personne, nous ne la demandons jamais.", "AVAX", "210", "Portefeuille sécurisé"),
  "Faux support : portefeuille securise ; transfert normal, 95% du solde, message colle honnetement.", 95);
fraud("faux_support_coinbase_securiser", "S1", "en", txUsdc(43114, A("fs2"), 12400),
  baseCtx({ facts: { [A("fs2")]: newEOA }, share: 88 }),
  asked("support", "Coinbase security says to move funds to a safe wallet",
    "Coinbase Security Team here. Your account was accessed from an unknown device. For safety, send your USDC to the vault address I am providing. A case number will be emailed after the transfer. Case #CB-48213", "USDC", "12400"),
  "Fake exchange security agent; standard USDC transfer to a fresh address.", 88);
fraud("faux_support_ledger_securiser", "S1", "fr", txNative(43113, A("fs3"), 40),
  baseCtx({ facts: { [A("fs3")]: newEOA }, share: 70 }),
  pay("Compte sécurisé", "AVAX", "40", "Je sécurise mon compte"),
  "Meme scenario ; la victime coche Payer sous la dictee de l'escroc au telephone, sans message.", 70);
fraud("faux_support_wallet_securiser", "S1", "en", txUsdc(43114, A("fs4"), 900),
  baseCtx({ facts: { [A("fs4")]: newEOA }, share: 26 }),
  { kind: "send_to_my_account", freeText: "Moving to my new secure wallet as instructed", token: "USDC", amount: "900", counterpartyLabel: "my new wallet" },
  "La victime croit transferer vers son propre nouveau wallet (fourni par l'escroc) ; intention send_to_my_account fausse.", 26);
fraud("faux_support_securiser", "S1", "fr", txNative(43114, A("fs5"), 18),
  baseCtx({ facts: { [A("fs5")]: newEOA }, share: 15 }),
  asked("support", "", undefined, "AVAX", "18"),
  "Faux support, petit montant, aucune precision, aucun message colle.", 15);

// Romance (4)
fraud("romance_urgence_medicale", "S6", "fr", txUsdc(43114, A("ro1"), 1800),
  baseCtx({ facts: { [A("ro1")]: newEOA }, share: 35 }),
  asked("other", "Ma chérie a besoin d'argent pour l'hôpital", "Mon amour, je suis bloqué à l'hôpital à Dubaï, l'assurance refuse ma carte. Peux-tu m'envoyer 1 800 USDC à cette adresse ? Je te rembourse dès mon retour, je t'aime. Daniel", "USDC", "1800", "Daniel"),
  "Arnaque sentimentale : urgence medicale ; message colle.", 35);
fraud("romance_douane", "S6", "en", txNative(43114, A("ro2"), 55),
  baseCtx({ facts: { [A("ro2")]: newEOA }, share: 52 }),
  pay("Michael", "AVAX", "55", "Helping Michael with customs fees for his package to me"),
  "Romance scam: gift stuck in customs; victim chooses Pay.", 52);
fraud("romance_voyage", "S6", "fr", txUsdc(43113, A("ro3"), 600),
  baseCtx({ facts: { [A("ro3")]: newEOA }, share: 12 }),
  pay("Sophie", "USDC", "600", "Billet d'avion pour que Sophie vienne me voir"),
  "Sophie (profil fictif) demande l'argent d'un billet qu'elle ne prendra jamais.", 12);
fraud("romance_investissement", "S4", "en", txUsdc(43114, A("ro4"), 5000),
  baseCtx({ origin: "https://goldenbridge-fx.example", facts: { [A("ro4")]: newEOA }, share: 58 }),
  asked("friend", "My partner showed me a trading app", "Babe, I made 4x last month with Golden Bridge. Deposit 5000 USDC to the address in the app and we can retire together next year. Trust me.", "USDC", "5000"),
  "Romance + pig butchering hybride.", 58);

// Fake recruiter (3)
fraud("faux_recruteur_formation", "S3", "fr", txUsdc(43114, A("rc1"), 450),
  baseCtx({ facts: { [A("rc1")]: newEOA }, share: 9 }),
  asked("recruiter", "Frais de formation pour mon poste de télétravail",
    "Félicitations, votre candidature chez TalentBridge Remote est retenue (CDI, 4 200 €/mois). Avant la signature, une formation certifiante de 450 USDC est obligatoire, remboursée au premier salaire. Paiement à l'adresse ci-dessous.", "USDC", "450", "TalentBridge"),
  "Faux recruteur : formation payante.", 9);
fraud("faux_recruteur_equipement", "S3", "en", txNative(43114, A("rc2"), 22),
  baseCtx({ facts: { [A("rc2")]: newEOA }, share: 31 }),
  pay("HR Onboarding", "AVAX", "22", "Pay for company laptop shipping, will be reimbursed"),
  "Fake employer equipment deposit; Pay intent, no message.", 31);
fraud("faux_recruteur_tache", "S3", "fr", txUsdc(43113, A("rc3"), 250),
  baseCtx({ facts: { [A("rc3")]: newEOA }, share: 6 }),
  asked("recruiter", "Avance pour débloquer mes commissions de tâches", "", "USDC", "250"),
  "Arnaque taches payees (like/review) : avance pour debloquer des commissions ; pas de message colle.", 6);

// Recovery scam (3)
fraud("fausse_recuperation_frais", "S2", "en", txUsdc(43114, A("rv1"), 1500),
  baseCtx({ facts: { [A("rv1")]: newEOA }, share: 20 }),
  asked("other", "Recovery firm needs a retainer", "Hello, we are CipherRecovery Ltd. We located your stolen funds (case 7731). Release requires a refundable 1,500 USDC compliance retainer. Send to the escrow address below within 24h or the case is closed.", "USDC", "1500", "CipherRecovery escrow"),
  "Double victimisation : fausse recuperation de fonds voles.", 20);
fraud("fausse_recuperation_frais", "S2", "fr", txNative(43114, A("rv2"), 14),
  baseCtx({ facts: { [A("rv2")]: newEOA }, share: 55 }),
  pay("Cabinet recouvrement", "AVAX", "14", "Frais de dossier pour récupérer mes fonds"),
  "Faux cabinet de recouvrement ; Payer, 55% du solde restant.", 55);
fraud("fausse_recuperation_gas", "S2", "en", txNative(43113, A("rv3"), 3),
  baseCtx({ facts: { [A("rv3")]: newEOA }, share: 8 }),
  asked("other", "", undefined, "AVAX", "3"),
  "Fake gas fee to release funds; no pasted message.", 8);

// Voice deepfake (4)
fraud("deepfake_vocal_proche", "S6", "fr", txUsdc(43114, A("dv1"), 2200),
  baseCtx({ book: [{ label: "Maman", address: A("mom") }], facts: { [A("dv1")]: newEOA }, share: 40 }),
  asked("friend", "Mon fils m'a appelé, il a eu un accident", "Message vocal transcrit : Maman c'est moi, j'ai eu un accident, mon téléphone est cassé, j'utilise celui d'un ami. J'ai besoin de 2 200 USDC tout de suite pour la clinique, envoie à cette adresse.", "USDC", "2200", "mon fils (nouveau numéro)"),
  "Voix clonee d'un enfant ; adresse neuve, pas celle du carnet.", 40);
fraud("deepfake_vocal_dirigeant", "S6", "en", txUsdc(43114, A("dv2"), 9500),
  baseCtx({ facts: { [A("dv2")]: newEOA }, share: 66 }),
  pay("CEO", "USDC", "9500", "Urgent supplier payment requested by the CEO on a call"),
  "Voice-cloned executive asks for an urgent crypto payment.", 66);
fraud("deepfake_vocal_proche", "S6", "fr", txNative(43113, A("dv3"), 9),
  baseCtx({ book: [{ label: "Papa", address: A("dad") }], facts: { [A("dv3")]: newEOA }, share: 17 }),
  pay("Papa", "AVAX", "9", "Papa m'a appelé, il est coincé, il a besoin de dépanner"),
  "Le libelle Papa est declare mais l'adresse n'est pas celle du carnet ; voix clonee.", 17);
fraud("deepfake_vocal_ami", "S6", "en", txNative(43114, A("dv4"), 75),
  baseCtx({ facts: { [A("dv4")]: newEOA }, share: 51 }),
  asked("friend", "", undefined, "AVAX", "75"),
  "Cloned friend's voice asks for a bail-out loan; asked_by_someone with no pasted message.", 51);

// ---------- AMBIGU (15) ----------
amb("montant_inhabituel_adresse_neuve", "fr", txNative(43114, A("a1"), 300),
  baseCtx({ facts: { [A("a1")]: newEOA }, share: 38 }), pay("(non précisé)", "AVAX", "300", "J'envoie à quelqu'un"), "Montant eleve vers adresse neuve sans contexte ni contact.", ["new_counterparty", "unusual_amount"]);
amb("montant_inhabituel_adresse_neuve", "en", txUsdc(43114, A("a2"), 4500),
  baseCtx({ facts: { [A("a2")]: newEOA }, share: 29, history: [{ type: "transfer", token: "USDC", usd: 40 }] }), pay("seller", "USDC", "4500", "Buying a used car from a private seller"), "Large P2P payment to new address; plausible but unverifiable.", ["new_counterparty"]);
amb("premiere_interaction_contrat_inconnu", "fr", txCall(43114, A("a3"), ["function stake(uint256 amount)"], "stake", [parseUnits("50", 18)]),
  baseCtx({ origin: "https://small-staking.example", facts: { [A("a3")]: oldC(250000) }, share: 12 }), hon("connect_or_accept_offer", "Je stake un peu sur ce petit protocole"), "Contrat mature mais jamais utilise ; stake benin probable.", ["unknown_contract"]);
amb("airdrop_reel_peu_connu", "en", txCall(43114, A("a4"), ["function claim(uint256 index,address account,uint256 amount,bytes32[] proof)"], "claim", [7, VICTIM, parseUnits("120", 18), [keccak256(toUtf8Bytes("p1")), keccak256(toUtf8Bytes("p2"))]]),
  baseCtx({ origin: "https://airdrop.lowcap-dao.example", facts: { [A("a4")]: oldC(40000) }, share: 0, claimed: "LowCap DAO (real but little-known)" }), hon("connect_or_accept_offer", "Claiming the LowCap DAO airdrop for early users"), "Merkle claim legitime d'un DAO peu connu ; indistinguable d'un faux claim.", ["unknown_contract", "claim_call"]);
amb("swap_petit_dex", "fr", txCall(43114, A("a5"), ["function swapExactAVAXForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline) payable"], "swapExactAVAXForTokens", [0n, [WAVAX, USDC], VICTIM, 1760003600], 50),
  baseCtx({ origin: "https://tinyswap.example", facts: { [A("a5")]: oldC(120000) }, share: 20 }), hon("buy_or_swap", "Swap d'AVAX en USDC", { token: "AVAX", amount: "50" }), "Swap via routeur non reference, amountOutMin=0.", ["router_unknown", "no_slippage_floor"]);
amb("approbation_limitee_contrat_inconnu", "en", txCall(43114, USDC, ["function approve(address,uint256)"], "approve", [A("a6"), parseUnits("200", 6)]),
  baseCtx({ origin: "https://yield-small.example", facts: { [A("a6")]: oldC(30000) }, share: 0 }), hon("connect_or_accept_offer", "Approving 200 USDC to deposit into a small vault"), "Approve borne (200) vers contrat inconnu ; normal pour un vault.", ["approval_limited", "unknown_spender"]);
amb("nft_mint_projet_inconnu", "fr", txCall(43114, A("a7"), ["function mint(uint256 qty) payable"], "mint", [2], 0.4),
  baseCtx({ origin: "https://pixelrenards.example", facts: { [A("a7")]: oldC(5000) }, share: 6 }), hon("buy_or_swap", "Je mint 2 NFT du projet Pixel Renards", { token: "AVAX", amount: "0.4" }), "Mint d'un projet recent ; ni prouvable bon ni mauvais.", ["recent_contract"]);
amb("pont_petit_montant", "en", txCall(43114, A("a8"), ["function bridgeETH(uint256 dstChain,address to) payable"], "bridgeETH", [1, VICTIM], 2),
  baseCtx({ origin: "https://hop-lite-bridge.example", facts: { [A("a8")]: oldC(90000) }, share: 25 }), hon("buy_or_swap", "Bridging 2 AVAX to another chain", { token: "AVAX", amount: "2" }), "Pont peu connu, destinataire = soi, mais cross-chain non verifiable.", ["unknown_bridge"]);
amb("ajout_reseau", "fr", { method: "wallet_addEthereumChain", params: [{ chainId: "0x1b58", chainName: "NovaL2 Testnet", rpcUrls: ["https://rpc.novanet.example"], nativeCurrency: { name: "Nova", symbol: "NVA", decimals: 18 } }] },
  baseCtx({ origin: "https://novanet.example", facts: {}, share: 0 }), hon("connect_or_accept_offer", "J'ajoute le réseau NovaL2 pour tester le faucet"), "Ajout d'un reseau inconnu : benin ou RPC malveillant, non tranchable.", ["unknown_rpc"]);
amb("signature_connexion_site_inconnu", "en", { method: "personal_sign", params: ["0x" + Buffer.from("small-site.example wants you to sign in with your Avalanche account:\n" + VICTIM + "\n\nURI: https://small-site.example\nNonce: 8f3a21c9\nIssued At: 2026-10-10T10:00:00Z").toString("hex"), VICTIM] },
  baseCtx({ origin: "https://small-site.example", facts: {}, share: 0 }), hon("connect_or_accept_offer", "Signing in to a new site"), "SIWE sur site jamais vu.", ["unknown_origin"]);
amb("envoi_vers_soi_adresse_neuve", "fr", txUsdc(43114, A("a11"), 1500),
  baseCtx({ facts: { [A("a11")]: newEOA }, share: 45 }), hon("send_to_my_account", "Je transfère vers mon nouveau wallet matériel", { token: "USDC", amount: "1500", counterpartyLabel: "mon wallet matériel" }), "Dit etre a soi mais adresse jamais vue : legitime ou escroquerie.", ["new_counterparty", "claims_self"]);
amb("depot_exchange_inconnu", "en", txNative(43114, A("a12"), 25),
  baseCtx({ facts: { [A("a12")]: newEOA }, share: 33, claimed: "SmallEx (regional exchange)" }), hon("send_to_my_account", "Depositing AVAX to my new SmallEx account", { token: "AVAX", amount: "25", counterpartyLabel: "SmallEx" }), "Depot sur un petit exchange non reference.", ["new_counterparty"]);
amb("vote_gouvernance", "fr", txCall(43114, A("a13"), ["function castVote(uint256 proposalId,uint8 support)"], "castVote", [42, 1]),
  baseCtx({ origin: "https://snapshot-like.example", facts: { [A("a13")]: oldC(600000) }, share: 0 }), hon("connect_or_accept_offer", "Je vote pour la proposition 42 du DAO"), "Appel on-chain inconnu mais sans fonds ni droit.", ["unknown_contract"]);
amb("batch_wallet_sendcalls", "en", { method: "wallet_sendCalls", params: [{ version: "1.0", chainId: "0xa86a", from: VICTIM, calls: [
    { to: USDC, value: "0x0", data: erc20.encodeFunctionData("approve", [A("a14"), parseUnits("100", 6)]) },
    { to: A("a14"), value: "0x0", data: new Interface(["function deposit(uint256)"]).encodeFunctionData("deposit", [parseUnits("100", 6)]) }] }] },
  baseCtx({ origin: "https://batchfi.example", facts: { [A("a14")]: oldC(15000) }, share: 5 }), hon("connect_or_accept_offer", "Approve and deposit 100 USDC in one go"), "Approve borne + depot groupes vers contrat inconnu.", ["unknown_contract", "approval_limited"]);
amb("enregistrement_nom_domaine", "fr", txCall(43113, A("a15"), ["function register(string name,address owner,uint256 duration) payable"], "register", ["monpseudo", VICTIM, 31536000], 0.2),
  baseCtx({ origin: "https://avaxnames-test.example", facts: { [A("a15")]: oldC(80000) }, share: 4 }), hon("buy_or_swap", "J'enregistre un nom de domaine web3 pour un an", { token: "AVAX", amount: "0.2" }), "Registrar de noms peu connu, paiement faible.", ["unknown_contract"]);

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "fraudes_ambigus.jsonl");
writeFileSync(out, cases.map((c) => JSON.stringify(c)).join("\n") + "\n");
console.log(`wrote ${cases.length} cases (F=${nF}, A=${nA}) -> ${out}`);

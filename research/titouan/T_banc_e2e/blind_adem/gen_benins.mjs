// Generateur du jeu de test AVEUGLE : 55 cas BENINS DIFFICILES (faux positifs potentiels).
// Ecrit sans lire le detecteur. Donnees synthetiques ; adresses de protocoles publiques ;
// adresses d'utilisateurs derivees d'un hash (aucune cle, aucun secret).
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
import path from "node:path";

const ETHERS = "C:/Users/Adem/Secure Horizon/blockchain/node_modules/ethers/lib.esm/index.js";
const E = await import(pathToFileURL(ETHERS).href);
const { Interface, getAddress, keccak256, toUtf8Bytes, parseUnits, parseEther, MaxUint256, solidityPacked, AbiCoder, hexlify } = E;
const coder = AbiCoder.defaultAbiCoder();

const OUT = "C:/Users/Adem/Secure Horizon/research/titouan/T_banc_e2e/blind_adem/benins.jsonl";
const NOW = 1791700000; // s ; declaredAt fixe en ms
const NOTICE = "SYNTHETIQUE : cas de test aveugle, aucune donnee reelle, aucune cle, aucune action contre un systeme reel.";

const A = (s) => getAddress(s.toLowerCase());
const rnd = (label) => getAddress("0x" + keccak256(toUtf8Bytes("blind-b:" + label)).slice(2, 42));
const withPrefix = (prefix, label) => getAddress("0x" + prefix.toLowerCase() + keccak256(toUtf8Bytes("blind-b:" + label)).slice(2 + prefix.length, 42));
const pad32 = (a) => "0x" + a.slice(2).toLowerCase().padStart(64, "0");
const hex = (n) => "0x" + BigInt(n).toString(16);

// ---------- adresses publiques ----------
const P = {
  permit2: A("0x000000000022D473030F116dDEE9F6B43aC78BA3"),
  // Ethereum
  usdc1: A("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
  usdt1: A("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
  weth1: A("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
  dai1: A("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
  swapRouter02: A("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"),
  universalRouterV1: A("0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD"),
  oneinchV6: A("0x111111125421cA6dc452d289314280a0f8842A65"),
  seaport16: A("0x0000000000000068F116a894984e2DB1123eB395"),
  openseaConduit: A("0x1E0049783F008A0085193E00003D00cd54003c71"),
  openseaFee: A("0x0000a26b00c1F0DF003000390027140000fAa719"),
  bayc: A("0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"),
  lido: A("0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"),
  opBridge: A("0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1"),
  baseBridge: A("0x3154Cf16ccdb4C6d922629664174b904d80F2C35"),
  arbInbox: A("0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f"),
  cctp1: A("0xBd3fa81B58Ba92a82136038B25aDec7066af3155"),
  // Avalanche C-Chain
  wavax: A("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"),
  usdc43: A("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"),
  usdt43: A("0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7"),
  savax: A("0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE"),
  tjLB: A("0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30"),
  pangolin: A("0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"),
  aaveAvax: A("0x794a61358D6845594F94dc1DB02A252b5b4814aD"),
  // approximations (de memoire, deploiement a verifier)
  uniUR43: A("0x94b75331AE8d42C1b61065089B7d48FE14aA73b7"),
};
const APPROX = (note) => ({ typed_data_or_selector_from_memory: true, note });

const ifc = {
  erc20: new Interface(["function approve(address,uint256)", "function transfer(address,uint256)"]),
  nft: new Interface(["function setApprovalForAll(address,bool)", "function safeTransferFrom(address,address,uint256)"]),
  permit2: new Interface(["function approve(address token,address spender,uint160 amount,uint48 expiration)"]),
  router02: new Interface([
    "function multicall(uint256 deadline, bytes[] data) payable returns (bytes[])",
    "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) payable returns (uint256)",
    "function unwrapWETH9(uint256 amountMinimum,address recipient) payable",
  ]),
  ur: new Interface(["function execute(bytes commands, bytes[] inputs, uint256 deadline) payable"]),
  lb: new Interface(["function swapExactTokensForNATIVE(uint256 amountIn,uint256 amountOutMinNATIVE,(uint256[] pairBinSteps,uint8[] versions,address[] tokenPath) path,address to,uint256 deadline) returns (uint256)"]),
  v2: new Interface(["function swapExactAVAXForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline) payable returns (uint256[])", "function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline) returns (uint256[])"]),
  wavax: new Interface(["function deposit() payable", "function withdraw(uint256)"]),
  savax: new Interface(["function submit() payable returns (uint256)"]),
  aave: new Interface(["function supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)"]),
  lido: new Interface(["function submit(address _referral) payable returns (uint256)"]),
  opb: new Interface(["function depositETH(uint32 _minGasLimit, bytes _extraData) payable"]),
  inbox: new Interface(["function depositEth() payable returns (uint256)"]),
  cctp: new Interface(["function depositForBurn(uint256 amount,uint32 destinationDomain,bytes32 mintRecipient,address burnToken) returns (uint64)"]),
  seaport: new Interface(["function fulfillBasicOrder((address considerationToken,uint256 considerationIdentifier,uint256 considerationAmount,address offerer,address zone,address offerToken,uint256 offerIdentifier,uint256 offerAmount,uint8 basicOrderType,uint256 startTime,uint256 endTime,bytes32 zoneHash,uint256 salt,bytes32 offererConduitKey,bytes32 fulfillerConduitKey,uint256 totalOriginalAdditionalRecipients,(uint256 amount,address recipient)[] additionalRecipients,bytes signature)) payable returns (bool)"]),
};

// ---------- monde de base ----------
const TOKENS = {
  1: { USDC: { address: P.usdc1, decimals: 6 }, USDT: { address: P.usdt1, decimals: 6 }, WETH: { address: P.weth1, decimals: 18 }, DAI: { address: P.dai1, decimals: 18 } },
  43114: { USDC: { address: P.usdc43, decimals: 6 }, USDT: { address: P.usdt43, decimals: 6 }, WAVAX: { address: P.wavax, decimals: 18 }, sAVAX: { address: P.savax, decimals: 18 } },
  43113: {},
};
const VICTIM = rnd("victim-main");
const VICTIM_OLD = rnd("victim-elderly");

const cases = [];
function add(c) {
  const chainId = c.chainId;
  const victim = c.victim || VICTIM;
  const request = c.request;
  const ctx = {
    chainId,
    victim,
    origin: c.origin || null,
    address_book: c.address_book || [],
    known_protocols: c.known_protocols || [],
    token_registry: TOKENS[chainId] || {},
    history: c.history || [],
    counterparty_facts: c.counterparty_facts || {},
    share_of_balance_pct: c.share ?? null,
    token_info: c.token_info || {},
    ens: c.ens || {},
    claimed_site: c.origin || null,
    quote: c.quote || null,
    user_profile: c.user_profile || null,
    note: c.note || null,
  };
  cases.push({
    id: "BLIND-B-" + String(cases.length + 1).padStart(3, "0"),
    synthetic: true,
    notice: NOTICE,
    family: c.family,
    subfamily: c.subfamily,
    request,
    context: ctx,
    intent: { ...c.intent, declaredAt: NOW * 1000 },
    label: "benin",
    reason: c.reason,
    expected_severity: c.expected || "ok",
    ideal_severity: c.expected || "ok",
    required_signals: c.signals || [],
    blind_to_v3_contract: false,
    catalog_category: "benin",
    source: "blind_adem",
    hard: !!c.hard,
    approximation: c.approx || null,
    scenario: null,
    lang: "fr",
    split: "BLIND",
    split_reason: "jeu aveugle ecrit sans lire le detecteur",
  });
}
const sendTx = (chainId, from, to, data = "0x", value = 0n) => ({
  method: "eth_sendTransaction",
  params: [{ from, to, data, value: hex(value), chainId: hex(chainId) }],
});
const typed = (from, td) => ({ method: "eth_signTypedData_v4", params: [from, JSON.stringify(td)] });
const proto = (name, address, kind) => ({ name, address, kind });
const facts = (addr, o) => ({ [addr]: { isContract: true, ageBlocks: 5_000_000, firstSeenByUser: false, ...o } });
const IK = (kind, freeText, extra = {}) => ({ kind, freeText, ...extra });
const EIP712DOMAIN = [{ name: "name", type: "string" }, { name: "version", type: "string" }, { name: "chainId", type: "uint256" }, { name: "verifyingContract", type: "address" }];
const P2DOMAIN = [{ name: "name", type: "string" }, { name: "chainId", type: "uint256" }, { name: "verifyingContract", type: "address" }];

// =====================================================================
// 1. approve_dex : approbations (meme illimitees) vers de vrais routeurs, intention Echanger
// =====================================================================
{
  const f = "approve_dex";
  const mk = (sub, chainId, token, tokenAddr, spender, spName, amt, origin, intent, reason, approx, hard = true) =>
    add({ family: f, subfamily: sub, chainId, origin, hard,
      request: sendTx(chainId, VICTIM, tokenAddr, ifc.erc20.encodeFunctionData("approve", [spender, amt])),
      known_protocols: [proto(spName, spender, "dex_router")],
      counterparty_facts: facts(spender, {}), share: 0, token_info: { symbol: token },
      intent, reason, approx, signals: ["known_router_allowlist"] });
  mk("unlimited_uniswap_v3_router", 1, "USDC", P.usdc1, P.swapRouter02, "Uniswap V3 SwapRouter02", MaxUint256, "https://app.uniswap.org",
    IK("buy_or_swap", "Echanger mes USDC contre de l'ETH", { token: "USDC" }),
    "Approbation illimitee USDC vers le vrai SwapRouter02 de Uniswap, c'est le premier pas normal d'un swap.", null);
  mk("unlimited_permit2", 1, "USDC", P.usdc1, P.permit2, "Uniswap Permit2", MaxUint256, "https://app.uniswap.org",
    IK("buy_or_swap", "Echanger des USDC sur Uniswap", { token: "USDC" }),
    "Approbation illimitee vers Permit2 canonique (meme adresse sur toutes les chaines) : etape standard de l'app Uniswap.", null);
  mk("unlimited_trader_joe_lb", 43114, "USDC", P.usdc43, P.tjLB, "Trader Joe LBRouter v2.1", MaxUint256, "https://lfj.gg",
    IK("buy_or_swap", "Echanger mes USDC contre des AVAX", { token: "USDC" }),
    "Approbation illimitee vers le LBRouter 2.1 de Trader Joe sur Avalanche, intention Echanger.", null);
  mk("unlimited_pangolin", 43114, "USDT", P.usdt43, P.pangolin, "Pangolin Router", MaxUint256, "https://app.pangolin.exchange",
    IK("buy_or_swap", "Echanger mes USDT sur Pangolin", { token: "USDT" }),
    "Approbation illimitee vers le routeur Pangolin d'Avalanche.", null);
  mk("unlimited_uniswap_permit2_avax", 43114, "USDC", P.usdc43, P.permit2, "Uniswap Permit2", MaxUint256, "https://app.uniswap.org",
    IK("buy_or_swap", "Echanger USDC contre WAVAX sur Uniswap", { token: "USDC" }),
    "Approbation illimitee vers Permit2 sur Avalanche pour un swap Uniswap.", null);
  mk("exact_amount_trader_joe", 43114, "USDC", P.usdc43, P.tjLB, "Trader Joe LBRouter v2.1", parseUnits("100", 6), "https://lfj.gg",
    IK("buy_or_swap", "Echanger 100 USDC contre des AVAX", { token: "USDC", amount: "100" }),
    "Approbation du montant exact (100 USDC) vers un routeur connu : cas ideal, doit passer sans alerte.", null, false);
}

// =====================================================================
// 2. permit2_sign : signatures de permit legitimes d'aggregateurs / routeurs
// =====================================================================
{
  const f = "permit2_sign";
  const mkSingle = (sub, chainId, token, tokenAddr, amt, spender, spName, origin, expSec, intent, reason, approx) => {
    const td = {
      types: { EIP712Domain: P2DOMAIN, PermitSingle: [{ name: "details", type: "PermitDetails" }, { name: "spender", type: "address" }, { name: "sigDeadline", type: "uint256" }], PermitDetails: [{ name: "token", type: "address" }, { name: "amount", type: "uint160" }, { name: "expiration", type: "uint48" }, { name: "nonce", type: "uint48" }] },
      primaryType: "PermitSingle",
      domain: { name: "Permit2", chainId, verifyingContract: P.permit2 },
      message: { details: { token: tokenAddr, amount: amt.toString(), expiration: String(NOW + expSec), nonce: "0" }, spender, sigDeadline: String(NOW + 1800) },
    };
    add({ family: f, subfamily: sub, chainId, origin, hard: true, request: typed(VICTIM, td),
      known_protocols: [proto(spName, spender, "dex_router"), proto("Permit2", P.permit2, "permit2")],
      counterparty_facts: facts(spender, {}), token_info: { symbol: token }, intent, reason, approx, signals: ["known_router_allowlist"] });
  };
  mkSingle("permit_single_universal_router", 1, "USDC", P.usdc1, parseUnits("500", 6), P.universalRouterV1, "Uniswap Universal Router", "https://app.uniswap.org", 2592000,
    IK("buy_or_swap", "Echanger 500 USDC contre de l'ETH", { token: "USDC", amount: "500" }),
    "PermitSingle Permit2 pour 500 USDC vers le vrai Universal Router, expiration 30 jours (valeur par defaut de l'app Uniswap), echeance de signature 30 min.", null);
  mkSingle("permit_single_1inch_v6_short", 1, "USDT", P.usdt1, parseUnits("1200", 6), P.oneinchV6, "1inch Aggregation Router v6", "https://app.1inch.io", 3600,
    IK("buy_or_swap", "Echanger 1200 USDT via 1inch", { token: "USDT", amount: "1200" }),
    "Permit2 vers le routeur d'agregation 1inch v6 (vrai contrat), montant limite a la somme du swap, expiration 1 h.", null);
  mkSingle("permit_single_avalanche_ur", 43114, "USDC", P.usdc43, parseUnits("250", 6), P.uniUR43, "Uniswap Universal Router (Avalanche)", "https://app.uniswap.org", 2592000,
    IK("buy_or_swap", "Echanger 250 USDC contre des AVAX", { token: "USDC", amount: "250" }),
    "PermitSingle Permit2 sur Avalanche vers l'Universal Router d'Uniswap.", APPROX("Adresse de l'Universal Router sur Avalanche donnee de memoire, a verifier."));
  // PermitTransferFrom (signature transfer, usage unique)
  {
    const td = {
      types: { EIP712Domain: P2DOMAIN, PermitTransferFrom: [{ name: "permitted", type: "TokenPermissions" }, { name: "spender", type: "address" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }], TokenPermissions: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }] },
      primaryType: "PermitTransferFrom",
      domain: { name: "Permit2", chainId: 1, verifyingContract: P.permit2 },
      message: { permitted: { token: P.usdc1, amount: parseUnits("300", 6).toString() }, spender: P.universalRouterV1, nonce: "1157920892373161954235709850086879078532699846656405640394575840079131296399", deadline: String(NOW + 900) },
    };
    add({ family: f, subfamily: "permit_transfer_from_single_use", chainId: 1, origin: "https://app.uniswap.org", hard: true, request: typed(VICTIM, td),
      known_protocols: [proto("Uniswap Universal Router", P.universalRouterV1, "dex_router"), proto("Permit2", P.permit2, "permit2")],
      counterparty_facts: facts(P.universalRouterV1, {}), token_info: { symbol: "USDC" },
      intent: IK("buy_or_swap", "Echanger 300 USDC contre de l'ETH", { token: "USDC", amount: "300" }),
      reason: "PermitTransferFrom Permit2 a usage unique (nonce desordonne, echeance 15 min) vers un routeur connu, montant exact.", signals: ["known_router_allowlist"] });
  }
  // EIP-2612 permit exact
  {
    const td = {
      types: { EIP712Domain: EIP712DOMAIN, Permit: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }, { name: "value", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] },
      primaryType: "Permit",
      domain: { name: "USD Coin", version: "2", chainId: 1, verifyingContract: P.usdc1 },
      message: { owner: VICTIM, spender: P.oneinchV6, value: parseUnits("250", 6).toString(), nonce: "0", deadline: String(NOW + 1200) },
    };
    add({ family: f, subfamily: "eip2612_exact_amount_aggregator", chainId: 1, origin: "https://app.1inch.io", hard: true, request: typed(VICTIM, td),
      known_protocols: [proto("1inch Aggregation Router v6", P.oneinchV6, "dex_router")], counterparty_facts: facts(P.oneinchV6, {}), token_info: { symbol: "USDC" },
      intent: IK("buy_or_swap", "Echanger 250 USDC via 1inch", { token: "USDC", amount: "250" }),
      reason: "Permit EIP-2612 du montant exact (250 USDC) vers le routeur 1inch v6, echeance 20 min : evite une transaction d'approbation.", signals: ["known_router_allowlist"] });
  }
}

// =====================================================================
// 3. siwe_signin : connexion par signature lisible
// =====================================================================
{
  const f = "siwe_signin";
  const siwe = (domain, uri, stmt, chainId, nonce) =>
    `${domain} wants you to sign in with your Ethereum account:\n${VICTIM}\n\n${stmt}\n\nURI: ${uri}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: 2026-10-11T08:00:00.000Z\nExpiration Time: 2026-10-11T08:10:00.000Z`;
  const utf8hex = (s) => hexlify(toUtf8Bytes(s));
  const intentConn = (t) => IK("connect_or_accept_offer", t);
  let m = siwe("opensea.io", "https://opensea.io", "Click to sign in and accept the OpenSea Terms of Service (https://opensea.io/tos) and Privacy Policy (https://opensea.io/privacy).", 1, "d8f3a1c92b4e");
  add({ family: f, subfamily: "siwe_opensea_matching_origin", chainId: 1, origin: "https://opensea.io", hard: true, request: { method: "personal_sign", params: [utf8hex(m), VICTIM] },
    intent: intentConn("Me connecter a OpenSea"), reason: "SIWE EIP-4361 correct : domaine = origine, adresse = compte actif, nonce, expiration 10 min, aucun droit accorde.", signals: ["siwe_domain_matches_origin"] });
  m = siwe("app.uniswap.org", "https://app.uniswap.org", "Sign in to Uniswap", 1, "Qm3pLz81Xa");
  add({ family: f, subfamily: "siwe_uniswap_plain_text", chainId: 1, origin: "https://app.uniswap.org", hard: true, request: { method: "personal_sign", params: [m, VICTIM] },
    intent: intentConn("Me connecter a Uniswap"), reason: "SIWE en texte clair (params non hexa), domaine = origine, courte duree.", signals: ["siwe_domain_matches_origin"] });
  m = siwe("app.aave.com", "https://app.aave.com", "Sign in with Ethereum to Aave", 43114, "z9Yh4Kd2Lm");
  add({ family: f, subfamily: "siwe_aave_avalanche", chainId: 43114, origin: "https://app.aave.com", hard: true, request: { method: "personal_sign", params: [utf8hex(m), VICTIM] },
    intent: intentConn("Me connecter a Aave"), reason: "SIWE sur Avalanche pour un site connu, message hexa-encode (illisible en brut mais decodable en UTF-8 lisible).", signals: ["siwe_domain_matches_origin", "hex_utf8_decode"] });
  const t = "Bienvenue sur Benqi. En signant, vous prouvez que vous controlez ce compte. Cette signature ne coute rien et ne donne acces a aucun fonds.\nCode: 4821";
  add({ family: f, subfamily: "readable_login_text", chainId: 43114, origin: "https://app.benqi.fi", hard: false, request: { method: "personal_sign", params: [utf8hex(t), VICTIM] },
    intent: intentConn("Me connecter a Benqi"), reason: "personal_sign d'un texte lisible de connexion, sans transaction ni droit.", signals: ["hex_utf8_decode"] });
}

// =====================================================================
// 4. nft_market : places de marche reelles
// =====================================================================
{
  const f = "nft_market";
  // constante publique OpenSea (conduit key Seaport), pas un secret
  const OS_KEY = "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000";
  const listing = (chainId, price, nativeSym, nft, tokenId, sub, reason, intentText) => {
    const gross = parseEther(price);
    const fee = gross * 25n / 1000n;
    const net = gross - fee;
    const td = {
      types: { EIP712Domain: EIP712DOMAIN,
        OrderComponents: [{ name: "offerer", type: "address" }, { name: "zone", type: "address" }, { name: "offer", type: "OfferItem[]" }, { name: "consideration", type: "ConsiderationItem[]" }, { name: "orderType", type: "uint8" }, { name: "startTime", type: "uint256" }, { name: "endTime", type: "uint256" }, { name: "zoneHash", type: "bytes32" }, { name: "salt", type: "uint256" }, { name: "conduitKey", type: "bytes32" }, { name: "counter", type: "uint256" }],
        OfferItem: [{ name: "itemType", type: "uint8" }, { name: "token", type: "address" }, { name: "identifierOrCriteria", type: "uint256" }, { name: "startAmount", type: "uint256" }, { name: "endAmount", type: "uint256" }],
        ConsiderationItem: [{ name: "itemType", type: "uint8" }, { name: "token", type: "address" }, { name: "identifierOrCriteria", type: "uint256" }, { name: "startAmount", type: "uint256" }, { name: "endAmount", type: "uint256" }, { name: "recipient", type: "address" }] },
      primaryType: "OrderComponents",
      domain: { name: "Seaport", version: "1.6", chainId, verifyingContract: P.seaport16 },
      message: { offerer: VICTIM, zone: "0x0000000000000000000000000000000000000000",
        offer: [{ itemType: 2, token: nft, identifierOrCriteria: String(tokenId), startAmount: "1", endAmount: "1" }],
        consideration: [
          { itemType: 0, token: "0x0000000000000000000000000000000000000000", identifierOrCriteria: "0", startAmount: net.toString(), endAmount: net.toString(), recipient: VICTIM },
          { itemType: 0, token: "0x0000000000000000000000000000000000000000", identifierOrCriteria: "0", startAmount: fee.toString(), endAmount: fee.toString(), recipient: P.openseaFee }],
        orderType: 0, startTime: String(NOW), endTime: String(NOW + 604800), zoneHash: "0x" + "00".repeat(32), salt: "24446860302761739304752683030156737591518664810215442929808784621098726351597", conduitKey: OS_KEY, counter: "0" },
    };
    add({ family: f, subfamily: sub, chainId, origin: "https://opensea.io", hard: true, expected: "warn", request: typed(VICTIM, td),
      known_protocols: [proto("OpenSea Seaport 1.6", P.seaport16, "nft_marketplace"), proto("OpenSea Conduit", P.openseaConduit, "nft_conduit")],
      counterparty_facts: facts(P.seaport16, {}), token_info: { nft: String(nft), tokenId: String(tokenId), listing_price: price + " " + nativeSym },
      intent: IK("connect_or_accept_offer", intentText),
      reason, approx: APPROX("Zone mise a zero et conduitKey OpenSea citee de memoire ; structure EIP-712 Seaport 1.6 conforme."), signals: ["seaport_listing_consideration_to_self"] });
  };
  listing(1, "1.5", "ETH", P.bayc, 4217, "seaport_listing_real_price",
    "Mise en vente OpenSea (Seaport 1.6) : le vendeur offre son NFT et recoit 97,5 % du prix en ETH (le reste = frais OpenSea 2,5 %). Un warn est raisonnable car la signature cede un NFT, mais ce n'est pas un drain : consideration >= prix.", "Mettre mon NFT en vente a 1,5 ETH");
  listing(43114, "40", "AVAX", rnd("avax-nft-collection"), 88, "seaport_listing_avalanche",
    "Listing OpenSea sur Avalanche a 40 AVAX avec la contrepartie au vendeur.", "Mettre mon NFT en vente a 40 AVAX");
  add({ family: f, subfamily: "set_approval_for_all_opensea_conduit", chainId: 1, origin: "https://opensea.io", hard: true, expected: "warn",
    request: sendTx(1, VICTIM, P.bayc, ifc.nft.encodeFunctionData("setApprovalForAll", [P.openseaConduit, true])),
    known_protocols: [proto("OpenSea Conduit", P.openseaConduit, "nft_conduit")], counterparty_facts: facts(P.openseaConduit, {}), token_info: { collection: "BAYC" },
    intent: IK("connect_or_accept_offer", "Autoriser OpenSea a lister mes NFT"),
    reason: "setApprovalForAll vers le vrai conduit OpenSea : indispensable pour vendre ; warn tolerable car droit large, critical serait une fausse alerte.", signals: ["known_marketplace_allowlist"] });
  {
    const price = parseEther("0.8");
    const rec = rnd("seller-fee-recipient");
    const args = [{
      considerationToken: "0x0000000000000000000000000000000000000000", considerationIdentifier: 0, considerationAmount: price * 975n / 1000n,
      offerer: rnd("nft-seller"), zone: "0x0000000000000000000000000000000000000000", offerToken: P.bayc, offerIdentifier: 99, offerAmount: 1, basicOrderType: 0,
      startTime: NOW - 3600, endTime: NOW + 86400, zoneHash: "0x" + "00".repeat(32), salt: 12345678901234567890n,
      offererConduitKey: OS_KEY, fulfillerConduitKey: "0x" + "00".repeat(32), totalOriginalAdditionalRecipients: 1,
      additionalRecipients: [{ amount: price * 25n / 1000n, recipient: P.openseaFee }], signature: "0x" + "ab".repeat(65) }];
    add({ family: f, subfamily: "seaport_buy_nft_basic_order", chainId: 1, origin: "https://opensea.io", hard: true,
      request: sendTx(1, VICTIM, P.seaport16, ifc.seaport.encodeFunctionData("fulfillBasicOrder", args), price),
      known_protocols: [proto("OpenSea Seaport 1.6", P.seaport16, "nft_marketplace")], counterparty_facts: facts(P.seaport16, {}), share: 12,
      intent: IK("buy_or_swap", "Acheter un NFT a 0,8 ETH", { token: "ETH", amount: "0.8" }),
      reason: "Achat NFT via fulfillBasicOrder de Seaport 1.6 : envoi d'ETH vers un contrat de place de marche reel, prix = intention.",
      approx: APPROX("Signature de fulfillBasicOrder reconstituee de memoire (struct BasicOrderParameters) ; signature et vendeur fictifs."), signals: ["known_marketplace_allowlist"] });
  }
  {
    const own = rnd("my-ledger");
    add({ family: f, subfamily: "nft_transfer_to_own_wallet", chainId: 1, origin: null, hard: true,
      address_book: [{ label: "mon Ledger", address: own }], counterparty_facts: { [own]: { isContract: false, ageBlocks: 3_000_000, firstSeenByUser: false } },
      request: sendTx(1, VICTIM, P.bayc, ifc.nft.encodeFunctionData("safeTransferFrom", [VICTIM, own, 4217])),
      intent: IK("send_to_my_account", "Mettre mon NFT en securite sur mon Ledger", { counterpartyLabel: "mon Ledger", counterpartyAddress: own }),
      reason: "Transfert d'un NFT de valeur vers sa propre adresse de carnet : ressemble a un vol de NFT mais destinataire connu et voulu.", signals: ["address_book_match"] });
  }
}

// =====================================================================
// 5. transfers_book : gros envois, carnet, quasi-sosies
// =====================================================================
{
  const f = "transfers_book";
  const own = rnd("my-cold-wallet");
  add({ family: f, subfamily: "big_native_to_own_cold_wallet", chainId: 43114, hard: true, share: 90,
    address_book: [{ label: "mon Ledger", address: own }], history: [{ to: own, count: 6, note: "6 envois precedents" }],
    counterparty_facts: { [own]: { isContract: false, ageBlocks: 8_000_000, firstSeenByUser: false } },
    request: sendTx(43114, VICTIM, own, "0x", parseEther("1200")),
    intent: IK("send_to_my_account", "Mettre 1200 AVAX en securite sur mon Ledger", { token: "AVAX", amount: "1200", counterpartyLabel: "mon Ledger", counterpartyAddress: own }),
    reason: "90 % du solde sort, mais vers sa propre adresse deja utilisee 6 fois et nommee dans le carnet : cas typique de mise au coffre.", signals: ["address_book_match", "history_match"] });
  const ex = rnd("binance-deposit");
  add({ family: f, subfamily: "big_usdc_to_exchange_in_book", chainId: 1, hard: true, share: 60,
    address_book: [{ label: "mon Binance", address: ex }], history: [{ to: ex, count: 3 }],
    counterparty_facts: { [ex]: { isContract: false, ageBlocks: 4_000_000, firstSeenByUser: false } },
    request: sendTx(1, VICTIM, P.usdc1, ifc.erc20.encodeFunctionData("transfer", [ex, parseUnits("25000", 6)])),
    intent: IK("send_to_my_account", "Envoyer 25000 USDC sur mon compte Binance", { token: "USDC", amount: "25000", counterpartyLabel: "mon Binance", counterpartyAddress: ex }),
    approx: APPROX("Adresse de depot d'exchange fictive (les vraies sont privees par client)."),
    reason: "Gros montant (60 % du solde) vers une adresse d'exchange deja dans le carnet et deja utilisee : legitime. Un warn de montant serait acceptable mais pas critical.", expected: "warn", signals: ["address_book_match", "history_match"] });
  const camille = withPrefix("4f", "contact-camille");
  const other = withPrefix("4f", "history-other-4f");
  add({ family: f, subfamily: "two_char_prefix_overlap", chainId: 43114, hard: true, share: 3,
    address_book: [{ label: "Camille", address: camille }], history: [{ to: other, count: 1, note: "adresse sans lien, meme prefixe 0x4f" }],
    counterparty_facts: { [camille]: { isContract: false, ageBlocks: 2_000_000, firstSeenByUser: false } },
    request: sendTx(43114, VICTIM, camille, "0x", parseEther("15")),
    intent: IK("pay_someone", "Payer Camille 15 AVAX", { token: "AVAX", amount: "15", counterpartyLabel: "Camille", counterpartyAddress: camille }),
    reason: "Le contact du carnet partage seulement 2 caracteres hexa de prefixe avec une adresse de l'historique : pas un sosie (il faut 4 + 4), ne doit pas declencher.", signals: ["lookalike_threshold_4_4"] });
  const nico = withPrefix("9a3c", "contact-nico");
  const nicoOther = getAddress("0x" + "9a3c" + keccak256(toUtf8Bytes("blind-b:nico-other")).slice(2, 2 + 32) + "e5f1".slice(0, 4));
  add({ family: f, subfamily: "four_char_prefix_only_overlap", chainId: 43114, hard: true, share: 2,
    address_book: [{ label: "Nicolas", address: nico }], history: [{ to: nicoOther, count: 1, note: "meme debut 0x9a3c, fin differente" }],
    counterparty_facts: { [nico]: { isContract: false, ageBlocks: 1_500_000, firstSeenByUser: false } },
    request: sendTx(43114, VICTIM, nico, "0x", parseEther("8")),
    intent: IK("pay_someone", "Payer Nicolas 8 AVAX", { token: "AVAX", amount: "8", counterpartyLabel: "Nicolas", counterpartyAddress: nico }),
    reason: "Meme debut sur 4 caracteres qu'une autre adresse de l'historique mais fin differente : ne remplit pas le critere sosie (debut ET fin).", signals: ["lookalike_threshold_4_4"] });
  const newFriend = rnd("new-friend");
  add({ family: f, subfamily: "first_time_small_to_pasted_address", chainId: 43114, hard: true, share: 1, expected: "warn",
    address_book: [], counterparty_facts: { [newFriend]: { isContract: false, ageBlocks: 900_000, firstSeenByUser: true } },
    request: sendTx(43114, VICTIM, usdcAddr43(), ifc.erc20.encodeFunctionData("transfer", [newFriend, parseUnits("20", 6)])),
    intent: IK("pay_someone", "Rembourser 20 USDC a un ami, adresse collee depuis son message", { token: "USDC", amount: "20", counterpartyAddress: newFriend }),
    reason: "Premier envoi (20 USDC) vers une adresse jamais vue mais fournie par l'utilisateur dans son intention ; warn 'adresse nouvelle' acceptable, critical non.", signals: ["intent_address_equals_destination"] });
  const ens = rnd("adem-eth");
  add({ family: f, subfamily: "full_balance_usdc_to_own_ens", chainId: 1, hard: true, share: 100,
    ens: { "adem-test.eth": ens }, address_book: [{ label: "adem-test.eth", address: ens }], history: [{ to: ens, count: 2 }],
    counterparty_facts: { [ens]: { isContract: false, ageBlocks: 6_000_000, firstSeenByUser: false } },
    request: sendTx(1, VICTIM, P.usdc1, ifc.erc20.encodeFunctionData("transfer", [ens, parseUnits("7340.5", 6)])),
    intent: IK("send_to_my_account", "Tout mettre sur mon autre compte adem-test.eth", { token: "USDC", amount: "7340.5", counterpartyLabel: "adem-test.eth", counterpartyAddress: ens }),
    reason: "100 % du solde USDC vers son propre nom ENS resolu et deja utilise : montant maximal mais destinataire sur.", signals: ["address_book_match", "history_match"] });
}
function usdcAddr43() { return P.usdc43; }

// =====================================================================
// 6. elderly_artisan : personne agee, artisan connu
// =====================================================================
{
  const f = "elderly_artisan";
  const prof = { age: 74, tech_level: "faible" };
  const art = (label, tag, amt, token, freeText, sub, reason, native = false, hard = false) => {
    const addr = rnd("artisan-" + tag);
    const chainId = 43114;
    const req = native ? sendTx(chainId, VICTIM_OLD, addr, "0x", parseEther(String(amt))) : sendTx(chainId, VICTIM_OLD, P.usdc43, ifc.erc20.encodeFunctionData("transfer", [addr, parseUnits(String(amt), 6)]));
    add({ family: f, subfamily: sub, chainId, victim: VICTIM_OLD, hard, user_profile: prof, share: 8,
      address_book: [{ label, address: addr, added: "il y a 3 mois" }], history: [{ to: addr, count: 1 }],
      counterparty_facts: { [addr]: { isContract: false, ageBlocks: 1_200_000, firstSeenByUser: false } },
      request: req, intent: IK("pay_someone", freeText, { token, amount: String(amt), counterpartyLabel: label, counterpartyAddress: addr }),
      reason, signals: ["address_book_match", "amount_matches_intent"] });
  };
  art("M. Durand plombier", "plombier", 480, "USDC", "Je paie M. Durand le plombier, 480 USDC", "plumber_usdc", "Paiement d'une facture d'artisan connu, adresse du carnet depuis 3 mois, montant dit = montant envoye.");
  art("Menuiserie Martin", "menuisier", 1250, "USDC", "Payer la menuiserie Martin pour les volets : 1250 USDC", "carpenter_large", "Montant plus eleve, memes garanties : carnet + intention exacte. Aucun risque.", false, true);
  art("Electricien Petit", "electricien", 12, "AVAX", "je paye mon electricien pour les travau 12 AVAX", "electrician_typo_native", "Intention avec fautes de frappe mais claire, envoi natif, destinataire du carnet.", true, true);
  art("Lucas petit-fils", "lucas", 50, "USDC", "Offrir 50 USDC a Lucas mon petit-fils pour son anniversaire", "gift_grandson", "Cadeau familial a un contact du carnet, petite somme.");
}

// =====================================================================
// 7. bridge_official : ponts officiels
// =====================================================================
{
  const f = "bridge_official";
  add({ family: f, subfamily: "optimism_standard_bridge_deposit_eth", chainId: 1, origin: "https://app.optimism.io", hard: true, share: 40,
    known_protocols: [proto("Optimism L1StandardBridge", P.opBridge, "official_bridge")], counterparty_facts: facts(P.opBridge, {}),
    request: sendTx(1, VICTIM, P.opBridge, ifc.opb.encodeFunctionData("depositETH", [200000, "0x"]), parseEther("0.5")),
    intent: IK("send_to_my_account", "Passer 0,5 ETH sur Optimism avec le pont officiel", { token: "ETH", amount: "0.5" }),
    reason: "Depot sur le pont officiel Optimism : de l'ETH part vers un contrat (proxy) et rien n'arrive sur l'instant.", approx: APPROX("Adresse du proxy L1StandardBridge Optimism de memoire."), signals: ["known_bridge_allowlist"] });
  add({ family: f, subfamily: "arbitrum_inbox_deposit_eth", chainId: 1, origin: "https://bridge.arbitrum.io", hard: true, share: 55, expected: "warn",
    known_protocols: [proto("Arbitrum One Inbox", P.arbInbox, "official_bridge")], counterparty_facts: facts(P.arbInbox, {}),
    request: sendTx(1, VICTIM, P.arbInbox, ifc.inbox.encodeFunctionData("depositEth", []), parseEther("1")),
    intent: IK("send_to_my_account", "Envoyer 1 ETH sur Arbitrum avec le pont officiel", { token: "ETH", amount: "1" }),
    reason: "Depot de 1 ETH (55 % du solde) sur l'Inbox Arbitrum : un warn lie a la part du solde est tolerable.", approx: APPROX("Adresse de l'Inbox Arbitrum One de memoire."), signals: ["known_bridge_allowlist"] });
  add({ family: f, subfamily: "base_standard_bridge_deposit_eth", chainId: 1, origin: "https://bridge.base.org", hard: true, share: 20,
    known_protocols: [proto("Base L1StandardBridge", P.baseBridge, "official_bridge")], counterparty_facts: facts(P.baseBridge, {}),
    request: sendTx(1, VICTIM, P.baseBridge, ifc.opb.encodeFunctionData("depositETH", [200000, "0x"]), parseEther("0.3")),
    intent: IK("send_to_my_account", "Passer 0,3 ETH sur Base", { token: "ETH", amount: "0.3" }),
    reason: "Depot sur le pont officiel Base (meme interface que Optimism).", approx: APPROX("Adresse du proxy L1StandardBridge Base de memoire."), signals: ["known_bridge_allowlist"] });
  add({ family: f, subfamily: "circle_cctp_to_avalanche", chainId: 1, origin: "https://core.app", hard: true, share: 30,
    known_protocols: [proto("Circle CCTP TokenMessenger", P.cctp1, "official_bridge")], counterparty_facts: facts(P.cctp1, {}),
    request: sendTx(1, VICTIM, P.cctp1, ifc.cctp.encodeFunctionData("depositForBurn", [parseUnits("1000", 6), 1, pad32(VICTIM), P.usdc1])),
    intent: IK("send_to_my_account", "Envoyer 1000 USDC vers mon compte sur Avalanche", { token: "USDC", amount: "1000" }),
    reason: "Burn USDC via CCTP vers Avalanche (domaine 1) avec mintRecipient = soi : le destinataire est dans le calldata (bytes32), pas en champ 'to'.", approx: APPROX("Adresse du TokenMessenger CCTP mainnet de memoire ; domaine 1 = Avalanche."), signals: ["recursive_decode_required"] });
}

// =====================================================================
// 8. router_multicall : appels groupes legitimes
// =====================================================================
{
  const f = "router_multicall";
  const ADDR_THIS = "0x0000000000000000000000000000000000000002";
  const inner = [
    ifc.router02.encodeFunctionData("exactInputSingle", [{ tokenIn: P.usdc1, tokenOut: P.weth1, fee: 500, recipient: ADDR_THIS, amountIn: parseUnits("1000", 6), amountOutMinimum: parseEther("0.25"), sqrtPriceLimitX96: 0 }]),
    ifc.router02.encodeFunctionData("unwrapWETH9", [parseEther("0.25"), VICTIM]),
  ];
  add({ family: f, subfamily: "swaprouter02_multicall_swap_unwrap", chainId: 1, origin: "https://app.uniswap.org", hard: true, share: 15,
    known_protocols: [proto("Uniswap V3 SwapRouter02", P.swapRouter02, "dex_router")], counterparty_facts: facts(P.swapRouter02, {}),
    request: sendTx(1, VICTIM, P.swapRouter02, ifc.router02.encodeFunctionData("multicall", [NOW + 1200, inner])),
    intent: IK("buy_or_swap", "Echanger 1000 USDC contre de l'ETH", { token: "USDC", amount: "1000" }),
    reason: "multicall(swap vers ADDRESS_THIS=address(2), puis unwrapWETH9 vers l'utilisateur) : le recipient intermediaire n'est pas l'utilisateur mais c'est le motif normal de SwapRouter02.", signals: ["recursive_decode_required", "known_router_allowlist"] });
  const swapIn = coder.encode(["address", "uint256", "uint256", "bytes", "bool"], [ADDR_THIS, parseUnits("2000", 6), parseEther("0.5"), solidityPacked(["address", "uint24", "address"], [P.usdc1, 500, P.weth1]), true]);
  const unwrapIn = coder.encode(["address", "uint256"], [VICTIM, parseEther("0.5")]);
  add({ family: f, subfamily: "universal_router_swap_unwrap", chainId: 1, origin: "https://app.uniswap.org", hard: true, share: 20,
    known_protocols: [proto("Uniswap Universal Router", P.universalRouterV1, "dex_router")], counterparty_facts: facts(P.universalRouterV1, {}),
    request: sendTx(1, VICTIM, P.universalRouterV1, ifc.ur.encodeFunctionData("execute", ["0x000c", [swapIn, unwrapIn], NOW + 1200])),
    intent: IK("buy_or_swap", "Echanger 2000 USDC contre de l'ETH", { token: "USDC", amount: "2000" }),
    reason: "Universal Router execute(V3_SWAP_EXACT_IN + UNWRAP_WETH) : commandes encodees, recipient intermediaire = routeur, final = utilisateur.", signals: ["recursive_decode_required", "known_router_allowlist"] });
}

// =====================================================================
// 9. swap_direct : swaps Avalanche
// =====================================================================
{
  const f = "swap_direct";
  add({ family: f, subfamily: "trader_joe_tokens_for_native", chainId: 43114, origin: "https://lfj.gg", hard: true, share: 25,
    known_protocols: [proto("Trader Joe LBRouter v2.1", P.tjLB, "dex_router")], counterparty_facts: facts(P.tjLB, {}),
    request: sendTx(43114, VICTIM, P.tjLB, ifc.lb.encodeFunctionData("swapExactTokensForNATIVE", [parseUnits("500", 6), parseEther("14"), { pairBinSteps: [20], versions: [2], tokenPath: [P.usdc43, P.wavax] }, VICTIM, NOW + 600])),
    intent: IK("buy_or_swap", "Echanger 500 USDC contre des AVAX", { token: "USDC", amount: "500" }),
    reason: "swapExactTokensForNATIVE du LBRouter : le destinataire est l'utilisateur, token de sortie = natif.", signals: ["known_router_allowlist"] });
  add({ family: f, subfamily: "pangolin_avax_for_tokens", chainId: 43114, origin: "https://app.pangolin.exchange", hard: false, share: 10,
    known_protocols: [proto("Pangolin Router", P.pangolin, "dex_router")], counterparty_facts: facts(P.pangolin, {}),
    request: sendTx(43114, VICTIM, P.pangolin, ifc.v2.encodeFunctionData("swapExactAVAXForTokens", [parseUnits("180", 6), [P.wavax, P.usdc43], VICTIM, NOW + 600]), parseEther("10")),
    intent: IK("buy_or_swap", "Echanger 10 AVAX contre des USDC sur Pangolin", { token: "AVAX", amount: "10" }),
    reason: "swapExactAVAXForTokens classique de style Uniswap V2, to = soi.", signals: ["known_router_allowlist"] });
  add({ family: f, subfamily: "pangolin_tokens_for_tokens_short_deadline", chainId: 43114, origin: "https://app.pangolin.exchange", hard: false, share: 5,
    known_protocols: [proto("Pangolin Router", P.pangolin, "dex_router")], counterparty_facts: facts(P.pangolin, {}),
    request: sendTx(43114, VICTIM, P.pangolin, ifc.v2.encodeFunctionData("swapExactTokensForTokens", [parseUnits("100", 6), parseUnits("99", 6), [P.usdc43, P.usdt43], VICTIM, NOW + 300])),
    intent: IK("buy_or_swap", "Echanger 100 USDC contre des USDT", { token: "USDC", amount: "100" }),
    reason: "Echange stable contre stable sur un routeur reel, destinataire = utilisateur.", signals: ["known_router_allowlist"] });
}

// =====================================================================
// 10. revoke : revocations
// =====================================================================
{
  const f = "revoke";
  const rev = (sub, chainId, tokenAddr, spender, spName, origin, reason, nft = false, extra = {}) =>
    add({ family: f, subfamily: sub, chainId, origin, hard: true, share: 0,
      known_protocols: [proto(spName, spender, "dex_router")], counterparty_facts: facts(spender, {}),
      request: sendTx(chainId, VICTIM, tokenAddr, nft ? ifc.nft.encodeFunctionData("setApprovalForAll", [spender, false]) : ifc.erc20.encodeFunctionData("approve", [spender, 0n])),
      intent: IK("connect_or_accept_offer", "Revoquer une autorisation que j'avais donnee", { token: extra.token }), reason, signals: ["approval_amount_zero"] });
  rev("approve_zero_uniswap_router", 1, P.usdc1, P.swapRouter02, "Uniswap V3 SwapRouter02", "https://revoke.cash", "approve(spender, 0) : retire un droit, ne peut pas en accorder. Ressemble a une approbation.", false, { token: "USDC" });
  rev("approve_zero_usdt_avalanche", 43114, P.usdt43, P.permit2, "Permit2", "https://revoke.cash", "approve(0) sur USDT Avalanche depuis revoke.cash, appel sur un token a approve non standard.", false, { token: "USDT" });
  rev("set_approval_for_all_false", 1, P.bayc, P.openseaConduit, "OpenSea Conduit", "https://revoke.cash", "setApprovalForAll(operator, false) : retrait d'operateur NFT. Ressemble au drain setApprovalForAll(true) mais booleen faux.", true);
  add({ family: f, subfamily: "permit2_lockdown_amount_zero", chainId: 1, origin: "https://revoke.cash", hard: true, share: 0,
    known_protocols: [proto("Uniswap Universal Router", P.universalRouterV1, "dex_router"), proto("Permit2", P.permit2, "permit2")], counterparty_facts: facts(P.permit2, {}),
    request: sendTx(1, VICTIM, P.permit2, ifc.permit2.encodeFunctionData("approve", [P.usdc1, P.universalRouterV1, 0n, 0])),
    intent: IK("connect_or_accept_offer", "Retirer le droit donne a Uniswap via Permit2"),
    reason: "Permit2.approve(token, spender, 0, 0) : desactive une allocation Permit2 ; l'appel porte le mot approve mais le montant est nul.", signals: ["approval_amount_zero"] });
}

// =====================================================================
// 11. wrap_stake : wrap, staking, pret
// =====================================================================
{
  const f = "wrap_stake";
  add({ family: f, subfamily: "wavax_deposit", chainId: 43114, origin: "https://app.traderjoexyz.com", hard: true, share: 30,
    known_protocols: [proto("WAVAX", P.wavax, "wrapped_native")], counterparty_facts: facts(P.wavax, {}),
    request: sendTx(43114, VICTIM, P.wavax, ifc.wavax.encodeFunctionData("deposit", []), parseEther("20")),
    intent: IK("buy_or_swap", "Convertir 20 AVAX en WAVAX", { token: "AVAX", amount: "20" }),
    reason: "Wrap AVAX -> WAVAX : de l'AVAX part vers un contrat, mais on recoit 1:1 un token wrapped.", signals: ["known_wrapped_native"] });
  add({ family: f, subfamily: "wavax_withdraw", chainId: 43114, origin: "https://app.traderjoexyz.com", hard: false, share: 0,
    known_protocols: [proto("WAVAX", P.wavax, "wrapped_native")], counterparty_facts: facts(P.wavax, {}),
    request: sendTx(43114, VICTIM, P.wavax, ifc.wavax.encodeFunctionData("withdraw", [parseEther("20")])),
    intent: IK("buy_or_swap", "Convertir 20 WAVAX en AVAX", { token: "WAVAX", amount: "20" }),
    reason: "Unwrap WAVAX -> AVAX : aucun envoi, rien ne sort.", signals: ["known_wrapped_native"] });
  add({ family: f, subfamily: "benqi_savax_stake", chainId: 43114, origin: "https://app.benqi.fi", hard: true, share: 45, expected: "warn",
    known_protocols: [proto("Benqi sAVAX", P.savax, "liquid_staking")], counterparty_facts: facts(P.savax, {}),
    request: sendTx(43114, VICTIM, P.savax, ifc.savax.encodeFunctionData("submit", []), parseEther("100")),
    intent: IK("buy_or_swap", "Staker 100 AVAX pour recevoir du sAVAX", { token: "AVAX", amount: "100" }),
    reason: "submit() payable sur le vrai contrat sAVAX de Benqi ; 45 % du solde mais contre un token recu. Un warn sur la part est tolerable.", signals: ["known_staking_allowlist"] });
  add({ family: f, subfamily: "aave_v3_supply_avalanche", chainId: 43114, origin: "https://app.aave.com", hard: true, share: 35,
    known_protocols: [proto("Aave V3 Pool (Avalanche)", P.aaveAvax, "lending")], counterparty_facts: facts(P.aaveAvax, {}),
    request: sendTx(43114, VICTIM, P.aaveAvax, ifc.aave.encodeFunctionData("supply", [P.usdc43, parseUnits("2000", 6), VICTIM, 0])),
    intent: IK("buy_or_swap", "Deposer 2000 USDC sur Aave pour gagner des interets", { token: "USDC", amount: "2000" }),
    reason: "supply() au Pool Aave V3 avec onBehalfOf = soi : sortie USDC contre aUSDC.", signals: ["known_lending_allowlist"] });
  add({ family: f, subfamily: "lido_submit", chainId: 1, origin: "https://stake.lido.fi", hard: true, share: 25,
    known_protocols: [proto("Lido stETH", P.lido, "liquid_staking")], counterparty_facts: facts(P.lido, {}),
    request: sendTx(1, VICTIM, P.lido, ifc.lido.encodeFunctionData("submit", ["0x0000000000000000000000000000000000000000"]), parseEther("2")),
    intent: IK("buy_or_swap", "Staker 2 ETH avec Lido", { token: "ETH", amount: "2" }),
    reason: "submit(referral=0) payable sur le contrat stETH de Lido.", signals: ["known_staking_allowlist"] });
  add({ family: f, subfamily: "approve_unlimited_aave_pool", chainId: 43114, origin: "https://app.aave.com", hard: true, share: 0,
    known_protocols: [proto("Aave V3 Pool (Avalanche)", P.aaveAvax, "lending")], counterparty_facts: facts(P.aaveAvax, {}),
    request: sendTx(43114, VICTIM, P.usdc43, ifc.erc20.encodeFunctionData("approve", [P.aaveAvax, MaxUint256])),
    intent: IK("buy_or_swap", "Deposer des USDC sur Aave", { token: "USDC" }),
    reason: "Approbation illimitee USDC vers le Pool Aave V3, etape normale avant supply(). Le kind 'buy_or_swap' est l'approximation la plus proche d'un depot.", signals: ["known_lending_allowlist"] });
}

// =====================================================================
// 12. network_switch : changements de reseau par des sites officiels
// =====================================================================
{
  const f = "network_switch";
  add({ family: f, subfamily: "switch_to_avalanche_official_dapp", chainId: 1, origin: "https://lfj.gg", hard: true,
    request: { method: "wallet_switchEthereumChain", params: [{ chainId: "0xa86a" }] },
    intent: IK("connect_or_accept_offer", "Me connecter a Trader Joe sur Avalanche"),
    reason: "Un site DEX officiel demande de passer sur Avalanche C-Chain (0xa86a). Aucun droit, aucune sortie.", signals: ["switch_known_chain"] });
  add({ family: f, subfamily: "switch_to_fuji_faucet", chainId: 43114, origin: "https://core.app", hard: true,
    request: { method: "wallet_switchEthereumChain", params: [{ chainId: "0xa869" }] },
    intent: IK("connect_or_accept_offer", "Passer sur le testnet Fuji pour recuperer des AVAX de test"),
    reason: "Passage du mainnet au testnet Fuji (0xa869) demande par le site officiel Core.", signals: ["switch_known_chain"] });
  add({ family: f, subfamily: "add_avalanche_c_chain_official_rpc", chainId: 1, origin: "https://chainlist.org", hard: true, expected: "warn",
    request: { method: "wallet_addEthereumChain", params: [{ chainId: "0xa86a", chainName: "Avalanche C-Chain", nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 }, rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"], blockExplorerUrls: ["https://snowtrace.io"] }] },
    intent: IK("connect_or_accept_offer", "Ajouter le reseau Avalanche a mon wallet"),
    reason: "Ajout du reseau officiel (RPC api.avax.network, Snowtrace) depuis Chainlist ; un warn 'RPC ajoute' serait defendable, un critical non.", signals: ["official_rpc_allowlist"] });
  add({ family: f, subfamily: "add_fuji_official_rpc", chainId: 1, origin: "https://build.avax.network", hard: true, expected: "warn",
    request: { method: "wallet_addEthereumChain", params: [{ chainId: "0xa869", chainName: "Avalanche Fuji Testnet", nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 }, rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"], blockExplorerUrls: ["https://testnet.snowtrace.io"] }] },
    intent: IK("connect_or_accept_offer", "Ajouter le testnet Fuji"),
    reason: "Ajout du testnet Fuji avec le RPC public officiel depuis la documentation Avalanche.", signals: ["official_rpc_allowlist"] });
}

// =====================================================================
// 13. vague_intent : intention vague mais honnete
// =====================================================================
{
  const f = "vague_intent";
  add({ family: f, subfamily: "vague_swap_avax", chainId: 43114, origin: "https://lfj.gg", hard: true, expected: "warn", share: 15,
    known_protocols: [proto("Pangolin Router", P.pangolin, "dex_router")], counterparty_facts: facts(P.pangolin, {}),
    request: sendTx(43114, VICTIM, P.pangolin, ifc.v2.encodeFunctionData("swapExactAVAXForTokens", [parseUnits("90", 6), [P.wavax, P.usdc43], VICTIM, NOW + 600]), parseEther("5")),
    intent: IK("buy_or_swap", "Je veux faire quelque chose avec mes AVAX"),
    reason: "Intention tres vague sans token, montant ni destinataire, mais l'action (swap 5 AVAX -> USDC vers soi sur un routeur connu) est coherente avec 'acheter/echanger'. Un warn demandant de preciser est acceptable.", signals: ["known_router_allowlist"] });
  const bob = rnd("contact-bob");
  add({ family: f, subfamily: "vague_pay_no_amount", chainId: 43114, hard: false, expected: "warn", share: 4,
    address_book: [{ label: "Bob", address: bob }], history: [{ to: bob, count: 4 }],
    counterparty_facts: { [bob]: { isContract: false, ageBlocks: 3_000_000, firstSeenByUser: false } },
    request: sendTx(43114, VICTIM, P.usdc43, ifc.erc20.encodeFunctionData("transfer", [bob, parseUnits("35", 6)])),
    intent: IK("pay_someone", "payer Bob", { counterpartyLabel: "Bob" }),
    reason: "Intention sans montant ni token ; destinataire = contact Bob du carnet, 4 envois precedents. Rien d'anormal, au plus un warn 'montant non precise'.", signals: ["address_book_match"] });
}

// ---------- ecriture ----------
writeFileSync(OUT, cases.map((c) => JSON.stringify(c)).join("\n") + "\n");
console.log("ecrit", cases.length, "cas ->", path.basename(OUT));

// V2 blind set — famille ONCHAIN : droits et controle on-chain MALVEILLANTS.
// TOUT EST SYNTHETIQUE. Jeu de test defensif. Aucune cle, aucune signature, aucune action reelle.
// Chaque requete est ce que le portefeuille recevrait AVANT signature.
// Generateur parametrique, graine fixe. `node gen.mjs` -> cases.jsonl (trie par id).
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ETHERS_PATH = 'C:\\Users\\Adem\\Secure Horizon\\blockchain\\node_modules\\ethers\\lib.esm\\index.js';
const ethers = await import(pathToFileURL(ETHERS_PATH).href);
const { Interface, getAddress, id: keccakId, AbiCoder } = ethers;
const HERE = dirname(fileURLToPath(import.meta.url));

const SEED = 20261011;
const DECLARED_AT = 1760140800000; // fixe

// ---------- PRNG deterministe (mulberry32) ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

// ---------- adresses ----------
const MAX_U256 = (2n ** 256n) - 1n;
const NEAR_MAX = (2n ** 256n) - 2n;
const POW255 = 2n ** 255n;

function synthAddr(tag) { return getAddress('0x' + keccakId('V2-ONCHAIN|addr|' + tag).slice(2, 42)); }
// sosie : memes 4 premiers + 4 derniers hex, milieu derive de la graine
function lookalikeOf(target, tag) {
  const t = target.toLowerCase().slice(2);
  const mid = keccakId('V2-ONCHAIN|look|' + tag + '|' + target).slice(2, 2 + 32);
  let raw = '0x' + t.slice(0, 4) + mid + t.slice(-4);
  const a = getAddress(raw);
  return a.toLowerCase() === target.toLowerCase() ? lookalikeOf(target, tag + '_') : a;
}

// Adresses reelles mainnet (confiance haute -> approximation null)
const REAL_MAINNET = {
  USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  DAI:  '0x6b175474e89094c44da98b954eedeac495271d0f',
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  PERMIT2: '0x000000000022d473030f116ddee9f6b43ac78ba3',
  MULTICALL3: '0xca11bde05977b3631167028862be2a173976ca11',
};
// Routeurs/protocoles de memoire (approximation.from_memory = true quand utilises comme ancre reelle)
const MEM_ROUTERS = {
  1: {
    UniV3SwapRouter02: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
    UniversalRouter:   '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
  },
  43114: {
    TraderJoeRouter: '0x60ae616a2155ee3d9a68541ba4544862310933d4',
    PangolinRouter:  '0xe54ca86531e17ef3616d22ca28b0d458b6c89106',
  },
};
// Tokens connus par chaine
function tokenRegistry(chainId) {
  if (chainId === 1) {
    return {
      USDC: { address: getAddress(REAL_MAINNET.USDC), decimals: 6, provenance: 'real_mainnet' },
      USDT: { address: getAddress(REAL_MAINNET.USDT), decimals: 6, provenance: 'real_mainnet' },
      DAI:  { address: getAddress(REAL_MAINNET.DAI), decimals: 18, provenance: 'real_mainnet' },
      WETH: { address: getAddress(REAL_MAINNET.WETH), decimals: 18, provenance: 'real_mainnet' },
      MOONX:{ address: synthAddr('tok|1|MOONX'), decimals: 18, provenance: 'synthetic' },
    };
  }
  if (chainId === 43114) {
    return {
      USDC: { address: getAddress('0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'), decimals: 6, provenance: 'memory_c_chain' },
      USDT: { address: getAddress('0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7'), decimals: 6, provenance: 'memory_c_chain' },
      WAVAX:{ address: getAddress('0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'), decimals: 18, provenance: 'memory_c_chain' },
      WETH: { address: getAddress('0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab'), decimals: 18, provenance: 'memory_c_chain' },
      SNOWK:{ address: synthAddr('tok|43114|SNOWK'), decimals: 18, provenance: 'synthetic' },
    };
  }
  // Fuji 43113 : tout synthetique (declare, pas une approximation)
  return {
    USDC: { address: synthAddr('tok|43113|USDC'), decimals: 6, provenance: 'synthetic' },
    WAVAX:{ address: synthAddr('tok|43113|WAVAX'), decimals: 18, provenance: 'synthetic' },
    TESTT:{ address: synthAddr('tok|43113|TESTT'), decimals: 18, provenance: 'synthetic' },
  };
}
function knownRouterForChain(chainId) {
  if (chainId === 1) return { name: 'UniV3SwapRouter02', address: getAddress(MEM_ROUTERS[1].UniV3SwapRouter02), memory: true };
  if (chainId === 43114) return { name: 'TraderJoeRouter', address: getAddress(MEM_ROUTERS[43114].TraderJoeRouter), memory: true };
  return { name: 'SyntheticRouterFuji', address: synthAddr('router|43113'), memory: false };
}

// ---------- interfaces (selecteurs calcules par ethers, reels) ----------
const iErc20 = new Interface([
  'function approve(address spender,uint256 amount)',
  'function increaseAllowance(address spender,uint256 addedValue)',
  'function transfer(address to,uint256 amount)',
  'function transferFrom(address from,address to,uint256 amount)',
]);
const iNft = new Interface(['function setApprovalForAll(address operator,bool approved)']);
const iOwn = new Interface(['function transferOwnership(address newOwner)', 'function setOwner(address owner_)']);
const iSafe = new Interface([
  'function addOwnerWithThreshold(address owner,uint256 _threshold)',
  'function changeThreshold(uint256 _threshold)',
  'function enableModule(address module)',
  'function setGuard(address guard)',
]);
const iProxy = new Interface([
  'function upgradeTo(address newImplementation)',
  'function upgradeToAndCall(address newImplementation,bytes data)',
]);
const iMulti = new Interface([
  'function multicall(bytes[] data) payable returns (bytes[])',
  'function aggregate3((address target,bool allowFailure,bytes callData)[] calls) payable returns (bytes[])',
]);
const iV3 = new Interface([
  'function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns (uint256)',
]);
const iV2 = new Interface([
  'function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline) returns (uint256[])',
]);

// ---------- messages d'escroc (marques FICTIVES) FR/EN ----------
const SCAM_MSGS = [
  { lang: 'fr', tone: 'urgent', text: "ALERTE Ledgr Securite : votre portefeuille est compromis, connectez-vous pour le securiser maintenant." },
  { lang: 'fr', tone: 'amical', text: "Salut ! JoeSwap offre un airdrop, clique pour recevoir tes 420 jetons avant ce soir :)" },
  { lang: 'fr', tone: 'autoritaire', text: "Service Conformite Coinbayse : validez la migration de votre compte sous peine de gel." },
  { lang: 'en', tone: 'urgent', text: "MetaMaks Support: suspicious activity detected, verify your wallet immediately to avoid loss." },
  { lang: 'en', tone: 'amical', text: "Congrats! You won the SnowDrop raffle — connect to claim your reward, limited slots left." },
  { lang: 'en', tone: 'autoritaire', text: "AvaBridge Compliance: finalize your account upgrade now, failure will suspend withdrawals." },
  { lang: 'fr', tone: 'urgent', text: "Remboursement en attente : confirmez votre wallet pour recevoir 0,8 AVAX de la part du support." },
  { lang: 'en', tone: 'amical', text: "Hey, saw your post — our DAO airdrops early supporters, just sign the connection to opt in!" },
];
const PERSONAS = ['retraite', 'etudiant', 'trader'];
const ORIGINS = [
  { kind: 'official', url: 'https://app.joeswap.example' },
  { kind: 'lookalike', url: 'https://app-joeswap.example-login.io' },
  { kind: 'lookalike', url: 'https://ledgr-wallet-secure.io' },
  { kind: 'unknown', url: 'https://claim-snowdrop.xyz' },
  { kind: 'unknown', url: 'https://avabridge-rewards.app' },
];

// intentions soufflees
const INTENT_FLAVORS = ['honnete', 'soufflee', 'vague', 'absente'];

// ---------- fabrique de cas ----------
const CASES = [];
let COUNTER = 0;
function nextId() { COUNTER += 1; return 'V2-ONCHAIN-' + String(COUNTER).padStart(5, '0'); }

function chainPick() {
  const r = rng();
  if (r < 0.2) return 1;
  if (r < 0.6) return 43114;
  return 43113;
}
function splitFor(idStr) {
  const h = createHash('sha256').update(idStr).digest();
  const mod = h[0] % 10; // sha256(id) mod 10
  return mod < 3 ? 'TEST' : 'DEV';
}
function victimWorld(chainId, persona) {
  const victim = synthAddr('victim|' + chainId + '|' + persona + '|' + rng());
  const myCex = synthAddr('mycex|' + rng());
  const friend = synthAddr('friend|' + rng());
  return { victim, address_book: [{ label: 'mon Coinbayse', address: myCex }, { label: 'Paul', address: friend }] };
}
function humanAmount(raw, decimals) {
  if (raw === MAX_U256) return 'illimite (2^256-1)';
  if (raw === NEAR_MAX) return 'quasi illimite (2^256-2)';
  if (raw === POW255) return 'enorme (2^255)';
  try { return ethers.formatUnits(raw, decimals); } catch { return String(raw); }
}

function buildIntent(flavor, kind, extra = {}) {
  const base = { kind, declaredAt: DECLARED_AT };
  if (flavor === 'absente') return { kind, declaredAt: DECLARED_AT };
  if (flavor === 'vague') return { ...base, freeText: pick(['je sais pas trop', 'un truc avec mon wallet', 'valider une action']), ...extra };
  const msg = pick(SCAM_MSGS);
  if (flavor === 'soufflee') return { ...base, freeText: extra.freeText, pastedMessage: msg.text, askedBy: extra.askedBy || 'support', ...extra };
  return { ...base, ...extra };
}

function approximationFor({ memoryAddr = false, shapeFromMemory = false, note = '' } = {}) {
  if (!memoryAddr && !shapeFromMemory) return null;
  const notes = [];
  if (memoryAddr) notes.push('adresses de protocole/token issues de la memoire (C-Chain / routeurs), a verifier sur depot officiel');
  if (shapeFromMemory) notes.push(note);
  return { from_memory: true, note: notes.join(' ; ') };
}

function push(c) {
  const id = nextId();
  const split = splitFor(id);
  CASES.push({
    id,
    synthetic: true,
    notice: 'SYNTHETIQUE — jeu de test defensif, aucune action reelle, aucune cle, non signe',
    family: 'onchain',
    label: 'malveillant',
    expected_severity: 'critical',
    ideal_severity: 'critical',
    blind_to_v3_contract: false,
    hard: false,
    ...c,
    split,
    split_reason: 'sha256(id) mod 10 ' + (split === 'TEST' ? '< 3' : '>= 3'),
  });
}

// ===================== SOUS-FAMILLES =====================

// 1) approve ERC-20 vers drainer/EOA : illimite, quasi-illimite, 2^255, exact
function genApprove(n) {
  const amountKinds = ['unlimited', 'near', 'pow255', 'exact_large', 'exact_small'];
  const spenderKinds = ['drainer_contract', 'eoa', 'lookalike_router'];
  for (let i = 0; i < n; i++) {
    const chainId = chainPick();
    const persona = pick(PERSONAS);
    const reg = tokenRegistry(chainId);
    const symbols = Object.keys(reg);
    const sym = symbols[i % symbols.length];
    const tk = reg[sym];
    const amtKind = amountKinds[i % amountKinds.length];
    const spenderKind = spenderKinds[Math.floor(i / amountKinds.length) % spenderKinds.length];
    const vicious = i % 4 === 0;
    const { victim, address_book } = victimWorld(chainId, persona);
    const known = knownRouterForChain(chainId);

    let amount;
    if (amtKind === 'unlimited') amount = MAX_U256;
    else if (amtKind === 'near') amount = NEAR_MAX;
    else if (amtKind === 'pow255') amount = POW255;
    else if (amtKind === 'exact_large') amount = BigInt(1_000_000) * (10n ** BigInt(tk.decimals));
    else amount = BigInt(50) * (10n ** BigInt(tk.decimals));

    let spender, memoryAddr = tk.provenance !== 'synthetic';
    if (spenderKind === 'lookalike_router') { spender = lookalikeOf(known.address, 'appr|' + i); memoryAddr = memoryAddr || known.memory; }
    else if (spenderKind === 'eoa') spender = synthAddr('eoa_spender|' + i);
    else spender = synthAddr('drainer|' + i);

    const data = iErc20.encodeFunctionData('approve', [spender, amount]);
    const flavor = vicious ? 'soufflee' : INTENT_FLAVORS[i % INTENT_FLAVORS.length];
    const intentKind = pick(['connect_or_accept_offer', 'buy_or_swap']);
    const freeText = intentKind === 'buy_or_swap' ? 'Echanger mes ' + sym : 'Me connecter au site';
    const intent = buildIntent(flavor, intentKind, { token: sym, freeText, askedBy: 'support' });
    const origin = pick(ORIGINS);

    push({
      subfamily: vicious ? 'approve_lookalike_spender' : 'approve_drainer',
      catalog_category: '1_droits_depense_directs',
      request: { method: 'eth_sendTransaction', params: [{ from: victim, to: tk.address, value: '0x0', data }] },
      context: {
        victim, origin, claimed_site: origin.url, address_book,
        known_protocols: [known.address, getAddress(REAL_MAINNET.PERMIT2), getAddress(REAL_MAINNET.MULTICALL3)],
        token_registry: { [sym]: tk },
        counterparty_facts: { address: spender, isContract: spenderKind !== 'eoa', ageBlocks: pick([3, 20, 150, 90000]), firstSeenByUser: true, lookalikeOf: spenderKind === 'lookalike_router' ? known.address : undefined },
        share_of_balance_pct: amtKind === 'exact_small' ? 2 : 100,
        token_info: { symbol: sym, decimals: tk.decimals },
        persona,
      },
      intent,
      reason: 'La personne croit ' + (intentKind === 'buy_or_swap' ? 'echanger' : 'se connecter') + ', mais la transaction donne un droit de depense ' + humanAmount(amount, tk.decimals) + ' de ' + sym + ' a ' + (spenderKind === 'eoa' ? 'un compte externe' : spenderKind === 'lookalike_router' ? 'un contrat dont l adresse imite un routeur connu' : 'un contrat drainer') + '.',
      required_signals: ['approval_granted', amtKind === 'unlimited' || amtKind === 'near' || amtKind === 'pow255' ? 'approval_unlimited' : 'approval_exact', 'spender_not_known_protocol'].concat(spenderKind === 'lookalike_router' ? ['spender_lookalike_known'] : []),
      source: 'Public drainer pattern: ERC-20 approve to malicious spender (Inferno/Pink drainer post-mortems, Revoke.cash advisories)',
      approximation: approximationFor({ memoryAddr }),
      scenario: flavor === 'soufflee' ? 'S1' : undefined,
      lang: flavor === 'soufflee' ? pick(['fr', 'en']) : 'fr',
    });
  }
}

// 2) increaseAllowance vers drainer/EOA
function genIncreaseAllowance(n) {
  const amountKinds = ['unlimited', 'pow255', 'exact_large', 'exact_small'];
  for (let i = 0; i < n; i++) {
    const chainId = chainPick();
    const persona = pick(PERSONAS);
    const reg = tokenRegistry(chainId);
    const symbols = Object.keys(reg);
    const sym = symbols[i % symbols.length];
    const tk = reg[sym];
    const amtKind = amountKinds[i % amountKinds.length];
    const vicious = i % 4 === 0;
    const { victim, address_book } = victimWorld(chainId, persona);
    const known = knownRouterForChain(chainId);
    let added;
    if (amtKind === 'unlimited') added = MAX_U256;
    else if (amtKind === 'pow255') added = POW255;
    else if (amtKind === 'exact_large') added = BigInt(500_000) * (10n ** BigInt(tk.decimals));
    else added = BigInt(25) * (10n ** BigInt(tk.decimals));
    let spender = vicious ? lookalikeOf(known.address, 'inc|' + i) : (i % 2 === 0 ? synthAddr('inc_eoa|' + i) : synthAddr('inc_drainer|' + i));
    const data = iErc20.encodeFunctionData('increaseAllowance', [spender, added]);
    const flavor = vicious ? 'soufflee' : INTENT_FLAVORS[i % INTENT_FLAVORS.length];
    const intent = buildIntent(flavor, 'connect_or_accept_offer', { token: sym, freeText: 'Recevoir un airdrop', askedBy: 'other' });
    const origin = pick(ORIGINS);
    push({
      subfamily: vicious ? 'increaseAllowance_lookalike_spender' : 'increaseAllowance_drainer',
      catalog_category: '1_droits_depense_directs',
      request: { method: 'eth_sendTransaction', params: [{ from: victim, to: tk.address, value: '0x0', data }] },
      context: {
        victim, origin, claimed_site: origin.url, address_book,
        known_protocols: [known.address, getAddress(REAL_MAINNET.PERMIT2)],
        token_registry: { [sym]: tk },
        counterparty_facts: { address: spender, isContract: i % 2 !== 0 || vicious, ageBlocks: pick([2, 40, 500]), firstSeenByUser: true, lookalikeOf: vicious ? known.address : undefined },
        share_of_balance_pct: amtKind === 'exact_small' ? 1 : 100,
        token_info: { symbol: sym, decimals: tk.decimals },
        persona,
      },
      intent,
      reason: 'increaseAllowance augmente le droit de depense de ' + humanAmount(added, tk.decimals) + ' ' + sym + ' vers ' + (vicious ? 'une adresse qui imite un routeur connu' : 'une adresse inconnue') + ', alors que la personne pense recevoir un airdrop.',
      required_signals: ['approval_increase', amtKind === 'unlimited' || amtKind === 'pow255' ? 'approval_unlimited' : 'approval_exact', 'spender_not_known_protocol'].concat(vicious ? ['spender_lookalike_known'] : []),
      source: 'Public phishing pattern: increaseAllowance bypass of zero-reset, fake airdrop claim pages',
      approximation: approximationFor({ memoryAddr: tk.provenance !== 'synthetic' || (vicious && known.memory) }),
      scenario: flavor === 'soufflee' ? 'S7' : undefined,
      lang: flavor === 'soufflee' ? pick(['fr', 'en']) : 'fr',
    });
  }
}

// 3) setApprovalForAll ERC-721 et ERC-1155
function genSetApprovalForAll(n) {
  const standards = ['ERC721', 'ERC1155'];
  for (let i = 0; i < n; i++) {
    const chainId = chainPick();
    const persona = pick(PERSONAS);
    const std = standards[i % 2];
    const vicious = i % 4 === 0;
    const { victim, address_book } = victimWorld(chainId, persona);
    const collection = synthAddr('nft|' + std + '|' + i);
    const marketplace = synthAddr('fake_market|' + i);
    const operator = vicious ? lookalikeOf(synthAddr('seaport_like'), 'op|' + i) : marketplace;
    const data = iNft.encodeFunctionData('setApprovalForAll', [operator, true]);
    const flavor = vicious ? 'soufflee' : INTENT_FLAVORS[i % INTENT_FLAVORS.length];
    const intent = buildIntent(flavor, 'connect_or_accept_offer', { freeText: pick(['Me connecter a la marketplace', 'Lister mon NFT gratuitement']), askedBy: 'other' });
    const origin = pick(ORIGINS);
    push({
      subfamily: std === 'ERC721' ? 'setApprovalForAll_erc721' : 'setApprovalForAll_erc1155',
      catalog_category: '1_droits_depense_directs',
      request: { method: 'eth_sendTransaction', params: [{ from: victim, to: collection, value: '0x0', data }] },
      context: {
        victim, origin, claimed_site: origin.url, address_book,
        known_protocols: [],
        token_info: { standard: std, collection },
        counterparty_facts: { address: operator, isContract: true, ageBlocks: pick([1, 10, 300]), firstSeenByUser: true },
        share_of_balance_pct: 100,
        persona,
      },
      intent,
      reason: 'setApprovalForAll(true) donne le controle de TOUTE la collection ' + std + ' a un operateur inconnu, alors que la personne croit seulement se connecter / lister un NFT.',
      required_signals: ['approval_all_nft', 'operator_not_known'].concat(vicious ? ['operator_lookalike_known'] : []),
      source: 'Public NFT drainer pattern: setApprovalForAll to rogue operator (OpenSea/Blur-lookalike phishing)',
      approximation: null,
      scenario: flavor === 'soufflee' ? 'S8' : undefined,
      lang: flavor === 'soufflee' ? pick(['fr', 'en']) : 'fr',
    });
  }
}

// 4) transferFrom direct (victime -> attaquant), appele par la victime
function genTransferFrom(n) {
  for (let i = 0; i < n; i++) {
    const chainId = chainPick();
    const persona = pick(PERSONAS);
    const reg = tokenRegistry(chainId);
    const symbols = Object.keys(reg);
    const sym = symbols[i % symbols.length];
    const tk = reg[sym];
    const vicious = i % 4 === 0;
    const { victim, address_book } = victimWorld(chainId, persona);
    const attacker = vicious ? lookalikeOf(address_book[0].address, 'tf|' + i) : synthAddr('tf_attacker|' + i);
    const amount = pick([BigInt(1), BigInt(100) * (10n ** BigInt(tk.decimals)), BigInt(10_000) * (10n ** BigInt(tk.decimals))]);
    const data = iErc20.encodeFunctionData('transferFrom', [victim, attacker, amount]);
    const flavor = INTENT_FLAVORS[i % INTENT_FLAVORS.length];
    const intent = buildIntent(flavor, 'connect_or_accept_offer', { token: sym, freeText: 'Recevoir un airdrop', askedBy: 'other' });
    const origin = pick(ORIGINS);
    push({
      subfamily: vicious ? 'transferFrom_lookalike_recipient' : 'transferFrom_direct',
      catalog_category: '1_droits_depense_directs',
      request: { method: 'eth_sendTransaction', params: [{ from: victim, to: tk.address, value: '0x0', data }] },
      context: {
        victim, origin, claimed_site: origin.url, address_book,
        known_protocols: [],
        token_registry: { [sym]: tk },
        counterparty_facts: { address: attacker, isContract: false, firstSeenByUser: true, lookalikeOf: vicious ? address_book[0].address : undefined },
        share_of_balance_pct: amount === BigInt(1) ? 1 : 80,
        token_info: { symbol: sym, decimals: tk.decimals },
        persona,
      },
      intent,
      reason: 'transferFrom deplace directement ' + humanAmount(amount, tk.decimals) + ' ' + sym + ' de la victime vers ' + (vicious ? 'une adresse sosie de son propre compte' : 'une adresse inconnue') + ', sans aucune contrepartie recue.',
      required_signals: ['direct_transferfrom', 'recipient_not_self'].concat(vicious ? ['recipient_lookalike_known'] : []),
      source: 'Public pattern: direct transferFrom drain after prior approval, fake claim UI',
      approximation: approximationFor({ memoryAddr: tk.provenance !== 'synthetic' }),
      lang: 'fr',
    });
  }
}

// 5) controle et roles : transferOwnership, DSProxy setOwner, Safe ops
function genOwnership(n) {
  const ops = ['transferOwnership', 'dsproxy_setOwner', 'safe_addOwner', 'safe_changeThreshold', 'safe_enableModule', 'safe_setGuard'];
  for (let i = 0; i < n; i++) {
    const chainId = chainPick();
    const persona = pick(PERSONAS);
    const op = ops[i % ops.length];
    const vicious = i % 4 === 0;
    const { victim, address_book } = victimWorld(chainId, persona);
    const target = synthAddr((op.startsWith('safe') ? 'safe|' : op === 'dsproxy_setOwner' ? 'dsproxy|' : 'ownable|') + i);
    const attacker = vicious ? lookalikeOf(victim, 'own|' + i) : synthAddr('new_owner|' + i);
    let data, sig, reason, signals;
    if (op === 'transferOwnership') {
      data = iOwn.encodeFunctionData('transferOwnership', [attacker]); sig = 'transferOwnership(address)';
      reason = 'transferOwnership cede la propriete du contrat a une adresse inconnue.'; signals = ['ownership_transfer', 'admin_operation'];
    } else if (op === 'dsproxy_setOwner') {
      data = iOwn.encodeFunctionData('setOwner', [attacker]); sig = 'setOwner(address)';
      reason = 'setOwner change le proprietaire du DSProxy : l attaquant controlera tous les fonds detenus par le proxy.'; signals = ['ownership_transfer', 'dsproxy_owner_change', 'admin_operation'];
    } else if (op === 'safe_addOwner') {
      data = iSafe.encodeFunctionData('addOwnerWithThreshold', [attacker, 1n]); sig = 'addOwnerWithThreshold(address,uint256)';
      reason = 'addOwnerWithThreshold ajoute un signataire attaquant au Safe et baisse le seuil a 1 : prise de controle du multisig.'; signals = ['safe_owner_change', 'threshold_lowered', 'admin_operation'];
    } else if (op === 'safe_changeThreshold') {
      data = iSafe.encodeFunctionData('changeThreshold', [1n]); sig = 'changeThreshold(uint256)';
      reason = 'changeThreshold ramene le seuil du Safe a 1, affaiblissant la protection multisig.'; signals = ['safe_threshold_change', 'admin_operation'];
    } else if (op === 'safe_enableModule') {
      data = iSafe.encodeFunctionData('enableModule', [attacker]); sig = 'enableModule(address)';
      reason = 'enableModule installe un module arbitraire qui pourra executer des transactions sans signature des owners.'; signals = ['safe_enable_module', 'admin_operation'];
    } else {
      data = iSafe.encodeFunctionData('setGuard', [attacker]); sig = 'setGuard(address)';
      reason = 'setGuard installe un guard controle par l attaquant, capable de bloquer ou detourner les transactions du Safe.'; signals = ['safe_set_guard', 'admin_operation'];
    }
    const flavor = vicious ? 'soufflee' : INTENT_FLAVORS[i % INTENT_FLAVORS.length];
    const intent = buildIntent(flavor, 'connect_or_accept_offer', { freeText: pick(['Me connecter au tableau de bord', 'Valider la migration de mon compte']), askedBy: 'support' });
    const origin = pick(ORIGINS);
    push({
      subfamily: op,
      catalog_category: '3_controle_et_roles',
      request: { method: 'eth_sendTransaction', params: [{ from: victim, to: target, value: '0x0', data }] },
      context: {
        victim, origin, claimed_site: origin.url, address_book,
        known_protocols: [],
        counterparty_facts: { address: attacker, isContract: false, firstSeenByUser: true, lookalikeOf: vicious ? victim : undefined },
        share_of_balance_pct: 100,
        token_info: { target_role: op.startsWith('safe') ? 'GnosisSafe' : op === 'dsproxy_setOwner' ? 'DSProxy' : 'Ownable', selector_sig: sig },
        persona,
      },
      intent,
      reason: reason + ' La personne croit seulement se connecter / migrer son compte.',
      required_signals: signals,
      source: 'Public pattern: ownership/role takeover (Safe owner injection, UUPS admin, DSProxy owner swap)',
      approximation: approximationFor({ shapeFromMemory: op.startsWith('safe'), note: 'signature Safe (Gnosis) de memoire, a verifier sur depot officiel' }),
      scenario: flavor === 'soufflee' ? 'S5' : undefined,
      lang: flavor === 'soufflee' ? pick(['fr', 'en']) : 'fr',
    });
  }
}

// 6) upgradeTo / upgradeToAndCall de proxy
function genUpgrade(n) {
  for (let i = 0; i < n; i++) {
    const chainId = chainPick();
    const persona = pick(PERSONAS);
    const vicious = i % 4 === 0;
    const withCall = i % 2 === 0;
    const { victim, address_book } = victimWorld(chainId, persona);
    const proxy = synthAddr('proxy|' + i);
    const malImpl = vicious ? lookalikeOf(synthAddr('good_impl'), 'impl|' + i) : synthAddr('mal_impl|' + i);
    let data, sig;
    if (withCall) {
      const initData = iErc20.encodeFunctionData('transfer', [synthAddr('drain_to|' + i), MAX_U256]);
      data = iProxy.encodeFunctionData('upgradeToAndCall', [malImpl, initData]); sig = 'upgradeToAndCall(address,bytes)';
    } else {
      data = iProxy.encodeFunctionData('upgradeTo', [malImpl]); sig = 'upgradeTo(address)';
    }
    const flavor = vicious ? 'soufflee' : INTENT_FLAVORS[i % INTENT_FLAVORS.length];
    const intent = buildIntent(flavor, 'connect_or_accept_offer', { freeText: 'Me connecter', askedBy: 'support' });
    const origin = pick(ORIGINS);
    push({
      subfamily: withCall ? 'upgradeToAndCall' : 'upgradeTo',
      catalog_category: '3_controle_et_roles',
      request: { method: 'eth_sendTransaction', params: [{ from: victim, to: proxy, value: '0x0', data }] },
      context: {
        victim, origin, claimed_site: origin.url, address_book,
        known_protocols: [],
        counterparty_facts: { address: malImpl, isContract: true, ageBlocks: pick([1, 5, 50]), firstSeenByUser: true, lookalikeOf: vicious ? synthAddr('good_impl') : undefined },
        share_of_balance_pct: 100,
        token_info: { target_role: 'ERC1967Proxy', selector_sig: sig },
        persona,
      },
      intent,
      reason: (withCall ? 'upgradeToAndCall remplace l implementation du proxy par un contrat malveillant puis l appelle immediatement (drain).' : 'upgradeTo remplace l implementation du proxy par un contrat malveillant.') + ' La personne croit se connecter.',
      required_signals: ['proxy_upgrade', 'admin_operation'].concat(withCall ? ['upgrade_with_delegatecall'] : []),
      source: 'Public pattern: UUPS/ERC-1967 proxy upgrade hijack',
      approximation: null,
      scenario: flavor === 'soufflee' ? 'S1' : undefined,
      lang: flavor === 'soufflee' ? pick(['fr', 'en']) : 'fr',
    });
  }
}

// 7) EIP-7702 delegation (chainId 1 uniquement)
function genEip7702(n) {
  for (let i = 0; i < n; i++) {
    const chainId = 1; // C-Chain n'a pas active 7702
    const persona = pick(PERSONAS);
    const vicious = i % 4 === 0;
    const { victim, address_book } = victimWorld(chainId, persona);
    const delegate = vicious ? lookalikeOf(getAddress(MEM_ROUTERS[1].UniversalRouter), 'del|' + i) : synthAddr('delegate_impl|' + i);
    const nonce = '0x' + (i + 1).toString(16);
    const req = {
      method: 'eth_sendTransaction',
      params: [{
        from: victim, to: victim, value: '0x0', data: '0x', type: '0x4', chainId: '0x1',
        authorizationList: [{ chainId: '0x1', address: delegate, nonce }],
      }],
    };
    const flavor = vicious ? 'soufflee' : INTENT_FLAVORS[i % INTENT_FLAVORS.length];
    const intent = buildIntent(flavor, 'connect_or_accept_offer', { freeText: pick(['Me connecter', 'Recevoir un airdrop']), askedBy: 'support' });
    const origin = pick(ORIGINS);
    push({
      subfamily: vicious ? 'eip7702_lookalike_delegate' : 'eip7702_delegate_drainer',
      catalog_category: '3_controle_et_roles',
      request: req,
      context: {
        victim, origin, claimed_site: origin.url, address_book,
        known_protocols: [getAddress(MEM_ROUTERS[1].UniversalRouter)],
        delegation: { to: delegate, via: 'eip7702' },
        counterparty_facts: { address: delegate, isContract: true, ageBlocks: pick([1, 8, 40]), firstSeenByUser: true, lookalikeOf: vicious ? getAddress(MEM_ROUTERS[1].UniversalRouter) : undefined },
        share_of_balance_pct: 100,
        persona,
      },
      intent,
      reason: 'La delegation EIP-7702 installe sur l EOA de la victime un code controle par l attaquant : il pourra deplacer tous les fonds du compte. La personne croit se connecter / recevoir un airdrop.',
      required_signals: ['delegation_7702', 'delegate_not_known'].concat(vicious ? ['delegate_lookalike_known'] : []),
      source: 'Public pattern: EIP-7702 set-code delegation to drainer (post-Pectra phishing)',
      approximation: approximationFor({ shapeFromMemory: true, note: 'forme authorizationList EIP-7702 (non signee) de memoire, a verifier sur EIP-7702' }),
      scenario: flavor === 'soufflee' ? 'S1' : undefined,
      lang: flavor === 'soufflee' ? pick(['fr', 'en']) : 'fr',
    });
  }
}

// 8) wallet_sendCalls (EIP-5792) : approbation noyee dans un lot d'apparence anodine
function genSendCalls(n) {
  for (let i = 0; i < n; i++) {
    const chainId = chainPick();
    const persona = pick(PERSONAS);
    const vicious = i % 4 === 0;
    const reg = tokenRegistry(chainId);
    const symbols = Object.keys(reg);
    const sym = symbols[i % symbols.length];
    const tk = reg[sym];
    const { victim, address_book } = victimWorld(chainId, persona);
    const known = knownRouterForChain(chainId);
    const spender = vicious ? lookalikeOf(known.address, 'sc|' + i) : synthAddr('sc_drainer|' + i);
    const approveData = iErc20.encodeFunctionData('approve', [spender, MAX_U256]);
    // appels anodins autour
    const benignA = { to: synthAddr('wrap|' + i), value: '0x0', data: '0x' };
    const benignB = { to: tk.address, value: '0x0', data: iErc20.encodeFunctionData('transfer', [victim, 0n]) };
    const nCalls = vicious ? 8 : 3;
    const calls = [];
    const approveCall = { to: tk.address, value: '0x0', data: approveData };
    const approveIdx = vicious ? 5 : 1;
    for (let k = 0; k < nCalls; k++) calls.push(k === approveIdx ? approveCall : (k % 2 === 0 ? benignA : benignB));
    const req = { method: 'wallet_sendCalls', params: [{ version: '1.0', chainId: '0x' + chainId.toString(16), from: victim, atomicRequired: true, calls }] };
    const flavor = vicious ? 'soufflee' : INTENT_FLAVORS[i % INTENT_FLAVORS.length];
    const intent = buildIntent(flavor, 'buy_or_swap', { token: sym, freeText: 'Echanger mes ' + sym, askedBy: 'other' });
    const origin = pick(ORIGINS);
    push({
      subfamily: vicious ? 'sendcalls_approval_buried_8' : 'sendcalls_approval_in_batch',
      catalog_category: '4_execution_indirecte',
      request: req,
      context: {
        victim, origin, claimed_site: origin.url, address_book,
        known_protocols: [known.address],
        token_registry: { [sym]: tk },
        counterparty_facts: { address: spender, isContract: true, ageBlocks: pick([2, 30, 400]), firstSeenByUser: true, lookalikeOf: vicious ? known.address : undefined },
        batch_size: nCalls, hidden_call_index: approveIdx,
        share_of_balance_pct: 100,
        token_info: { symbol: sym, decimals: tk.decimals },
        persona,
      },
      intent,
      reason: 'Le lot wallet_sendCalls (' + nCalls + ' appels d apparence anodine) contient une approbation illimitee de ' + sym + ' vers ' + (vicious ? 'une adresse sosie de routeur' : 'un contrat inconnu') + ', position ' + approveIdx + '. La personne croit faire un simple echange.',
      required_signals: ['batch_contains_approval', 'recursive_decode_required', 'approval_unlimited', 'spender_not_known_protocol'].concat(vicious ? ['spender_lookalike_known'] : []),
      source: 'Public pattern: EIP-5792 wallet_sendCalls bundling a hidden unlimited approval',
      approximation: approximationFor({ memoryAddr: tk.provenance !== 'synthetic' || (vicious && known.memory), shapeFromMemory: true, note: 'forme wallet_sendCalls (EIP-5792) de memoire, a verifier sur EIP-5792' }),
      lang: flavor === 'soufflee' ? pick(['fr', 'en']) : 'fr',
    });
  }
}

// 9) multicall a 1, 2 et 3 niveaux cachant une approbation ou un transfert
function genMulticall(n) {
  const depths = [1, 2, 3];
  const hidden = ['approve', 'transferFrom'];
  for (let i = 0; i < n; i++) {
    const chainId = chainPick();
    const persona = pick(PERSONAS);
    const depth = depths[i % 3];
    const hk = hidden[Math.floor(i / 3) % 2];
    const vicious = i % 4 === 0;
    const useAggregate3 = vicious; // variante selecteur aggregate3
    const reg = tokenRegistry(chainId);
    const symbols = Object.keys(reg);
    const sym = symbols[i % symbols.length];
    const tk = reg[sym];
    const { victim, address_book } = victimWorld(chainId, persona);
    const known = knownRouterForChain(chainId);
    const spender = vicious ? lookalikeOf(known.address, 'mc|' + i) : synthAddr('mc_drainer|' + i);

    const inner = hk === 'approve'
      ? iErc20.encodeFunctionData('approve', [spender, MAX_U256])
      : iErc20.encodeFunctionData('transferFrom', [victim, spender, BigInt(5000) * (10n ** BigInt(tk.decimals))]);

    function wrapOnce(innerCalldatas) {
      if (useAggregate3) {
        const calls = innerCalldatas.map((d) => ({ target: tk.address, allowFailure: false, callData: d }));
        return iMulti.encodeFunctionData('aggregate3', [calls]);
      }
      return iMulti.encodeFunctionData('multicall', [innerCalldatas]);
    }
    // niveau 1 : multicall([inner, benign]) ; 2 : multicall([multicall([inner])]) ; 3 : triple
    const benign = iErc20.encodeFunctionData('transfer', [victim, 0n]);
    let data;
    if (depth === 1) data = wrapOnce([benign, inner]);
    else if (depth === 2) data = wrapOnce([wrapOnce([inner, benign])]);
    else data = wrapOnce([wrapOnce([wrapOnce([inner])])]);

    // cible : routeur known si approve via multicall de routeur, sinon multicall3
    const to = useAggregate3 ? getAddress(REAL_MAINNET.MULTICALL3) : known.address;
    const flavor = vicious ? 'soufflee' : INTENT_FLAVORS[i % INTENT_FLAVORS.length];
    const intent = buildIntent(flavor, 'buy_or_swap', { token: sym, freeText: 'Echanger mes ' + sym, askedBy: 'other' });
    const origin = pick(ORIGINS);
    push({
      subfamily: 'multicall_depth' + depth + '_' + hk + (useAggregate3 ? '_aggregate3' : ''),
      catalog_category: '4_execution_indirecte',
      request: { method: 'eth_sendTransaction', params: [{ from: victim, to, value: '0x0', data }] },
      context: {
        victim, origin, claimed_site: origin.url, address_book,
        known_protocols: [known.address, getAddress(REAL_MAINNET.MULTICALL3)],
        token_registry: { [sym]: tk },
        counterparty_facts: { address: spender, isContract: hk === 'approve', firstSeenByUser: true, lookalikeOf: vicious ? known.address : undefined },
        multicall_depth: depth, wrapper: useAggregate3 ? 'aggregate3' : 'multicall(bytes[])',
        share_of_balance_pct: 100,
        token_info: { symbol: sym, decimals: tk.decimals },
        persona,
      },
      intent,
      reason: 'Un multicall a ' + depth + ' niveau(x) cache ' + (hk === 'approve' ? 'une approbation illimitee' : 'un transferFrom') + ' de ' + sym + ' vers ' + (vicious ? 'une adresse sosie de routeur' : 'une adresse inconnue') + '. La personne croit faire un echange.',
      required_signals: ['recursive_decode_required', hk === 'approve' ? 'hidden_approval' : 'hidden_transfer', 'nested_depth_' + depth].concat(vicious ? ['spender_lookalike_known'] : []),
      source: 'Public pattern: multicall-wrapped hidden approval/transfer (router multicall, Multicall3 aggregate3)',
      approximation: approximationFor({ memoryAddr: tk.provenance !== 'synthetic' || known.memory }),
      lang: flavor === 'soufflee' ? pick(['fr', 'en']) : 'fr',
    });
  }
}

// 10) faux swap dont le recipient n'est pas la victime
function genFakeSwapRecipient(n) {
  const which = ['v3_exactInputSingle', 'v2_swapExactTokensForTokens'];
  for (let i = 0; i < n; i++) {
    const chainId = chainPick();
    const persona = pick(PERSONAS);
    const kind = which[i % 2];
    const vicious = i % 4 === 0;
    const reg = tokenRegistry(chainId);
    const symbols = Object.keys(reg);
    const inSym = symbols[i % symbols.length];
    const outSym = symbols[(i + 1) % symbols.length];
    const tkIn = reg[inSym], tkOut = reg[outSym];
    const { victim, address_book } = victimWorld(chainId, persona);
    const known = knownRouterForChain(chainId);
    const recipient = vicious ? lookalikeOf(victim, 'rec|' + i) : synthAddr('swap_recipient|' + i);
    const amountIn = BigInt(1000) * (10n ** BigInt(tkIn.decimals));
    let data, to = known.address, sig;
    if (kind === 'v3_exactInputSingle') {
      sig = 'exactInputSingle(tuple)';
      data = iV3.encodeFunctionData('exactInputSingle', [[tkIn.address, tkOut.address, 3000, recipient, amountIn, 1n, 0n]]);
    } else {
      sig = 'swapExactTokensForTokens(...)';
      data = iV2.encodeFunctionData('swapExactTokensForTokens', [amountIn, 1n, [tkIn.address, tkOut.address], recipient, BigInt(DECLARED_AT / 1000 + 600)]);
    }
    const flavor = vicious ? 'soufflee' : INTENT_FLAVORS[i % INTENT_FLAVORS.length];
    const intent = buildIntent(flavor, 'buy_or_swap', { token: inSym, freeText: 'Echanger mes ' + inSym + ' contre ' + outSym, askedBy: 'other' });
    const origin = pick(ORIGINS);
    push({
      subfamily: 'swap_recipient_not_self_' + (kind === 'v3_exactInputSingle' ? 'v3' : 'v2'),
      catalog_category: '8_swaps_et_ponts',
      request: { method: 'eth_sendTransaction', params: [{ from: victim, to, value: '0x0', data }] },
      context: {
        victim, origin, claimed_site: origin.url, address_book,
        known_protocols: [known.address],
        token_registry: { [inSym]: tkIn, [outSym]: tkOut },
        counterparty_facts: { address: recipient, isContract: false, firstSeenByUser: true, lookalikeOf: vicious ? victim : undefined },
        quote: { tokenIn: inSym, tokenOut: outSym, amountIn: humanAmount(amountIn, tkIn.decimals) },
        share_of_balance_pct: 70,
        token_info: { selector_sig: sig },
        persona,
      },
      intent,
      reason: 'Le swap envoie le token de sortie vers un recipient qui n est PAS la victime' + (vicious ? ' (adresse sosie de la victime)' : '') + ' : la victime paie l entree et un tiers recoit la sortie.',
      required_signals: ['swap_recipient_not_self'].concat(vicious ? ['recipient_lookalike_known'] : []),
      source: 'Public pattern: swap with foreign recipient field (router recipient != sender)',
      approximation: approximationFor({ memoryAddr: tkIn.provenance !== 'synthetic' || tkOut.provenance !== 'synthetic' || known.memory, shapeFromMemory: kind === 'v3_exactInputSingle', note: 'SwapRouter02 exactInputSingle (7 champs) de memoire' }),
      lang: flavor === 'soufflee' ? pick(['fr', 'en']) : 'fr',
    });
  }
}

// 11) swap avec amountOutMin=0 vers un pool controle
function genAmountOutZero(n) {
  for (let i = 0; i < n; i++) {
    const chainId = chainPick();
    const persona = pick(PERSONAS);
    const vicious = i % 4 === 0;
    const reg = tokenRegistry(chainId);
    const symbols = Object.keys(reg);
    const inSym = symbols[i % symbols.length];
    const outSym = symbols[(i + 2) % symbols.length];
    const tkIn = reg[inSym], tkOut = reg[outSym];
    const { victim, address_book } = victimWorld(chainId, persona);
    const known = knownRouterForChain(chainId);
    // routeur controle par l'attaquant (sosie si vicious), pas le routeur connu
    const maliciousRouter = vicious ? lookalikeOf(known.address, 'pool|' + i) : synthAddr('mal_router|' + i);
    const amountIn = BigInt(2000) * (10n ** BigInt(tkIn.decimals));
    const data = iV2.encodeFunctionData('swapExactTokensForTokens', [amountIn, 0n, [tkIn.address, tkOut.address], victim, BigInt(DECLARED_AT / 1000 + 600)]);
    const flavor = vicious ? 'soufflee' : INTENT_FLAVORS[i % INTENT_FLAVORS.length];
    const intent = buildIntent(flavor, 'buy_or_swap', { token: inSym, freeText: 'Echanger mes ' + inSym, askedBy: 'other' });
    const origin = pick(ORIGINS);
    push({
      subfamily: vicious ? 'amountOutMin0_lookalike_router' : 'amountOutMin0_controlled_pool',
      catalog_category: '8_swaps_et_ponts',
      request: { method: 'eth_sendTransaction', params: [{ from: victim, to: maliciousRouter, value: '0x0', data }] },
      context: {
        victim, origin, claimed_site: origin.url, address_book,
        known_protocols: [known.address],
        token_registry: { [inSym]: tkIn, [outSym]: tkOut },
        counterparty_facts: { address: maliciousRouter, isContract: true, ageBlocks: pick([1, 12, 200]), firstSeenByUser: true, lookalikeOf: vicious ? known.address : undefined },
        quote: { tokenIn: inSym, tokenOut: outSym, amountIn: humanAmount(amountIn, tkIn.decimals), amountOutMin: '0' },
        share_of_balance_pct: 90,
        token_info: { selector_sig: 'swapExactTokensForTokens(...)' },
        persona,
      },
      intent,
      reason: 'swapExactTokensForTokens avec amountOutMin=0 vers un routeur/pool non connu (controle par l attaquant) : la victime peut recevoir ~0 en sortie (slippage 100%).',
      required_signals: ['slippage_zero', 'router_not_known'].concat(vicious ? ['router_lookalike_known'] : []),
      source: 'Public pattern: amountOutMin=0 into attacker-controlled pool (sandwich / rug)',
      approximation: approximationFor({ memoryAddr: tkIn.provenance !== 'synthetic' || tkOut.provenance !== 'synthetic' || (vicious && known.memory) }),
      lang: flavor === 'soufflee' ? pick(['fr', 'en']) : 'fr',
    });
  }
}

// ===================== GENERATION =====================
genApprove(260);
genIncreaseAllowance(120);
genSetApprovalForAll(130);
genTransferFrom(90);
genOwnership(210);
genUpgrade(80);
genEip7702(90);
genSendCalls(95);
genMulticall(150);
genFakeSwapRecipient(85);
genAmountOutZero(75);

// tri par id (ids zero-paddes -> ordre stable)
CASES.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

// nettoyage des undefined (JSON les ignore de toute facon) et serialisation BigInt-safe deja fait
const out = CASES.map((c) => JSON.stringify(c)).join('\n') + '\n';
writeFileSync(join(HERE, 'cases.jsonl'), out, 'utf8');

// resume par sous-famille + split
const bySub = {};
let nTest = 0, nDev = 0;
for (const c of CASES) {
  bySub[c.subfamily] = bySub[c.subfamily] || { DEV: 0, TEST: 0 };
  bySub[c.subfamily][c.split] += 1;
  if (c.split === 'TEST') nTest++; else nDev++;
}
console.log('TOTAL', CASES.length, '| DEV', nDev, '| TEST', nTest);
for (const k of Object.keys(bySub).sort()) console.log(k, 'DEV', bySub[k].DEV, 'TEST', bySub[k].TEST);

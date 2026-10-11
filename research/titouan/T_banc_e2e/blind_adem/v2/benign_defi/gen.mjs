// V2 blind set, family BENIGN_DEFI: hard legitimate DeFi operations that look like attacks.
// SYNTHETIC. No key, no signature, no real personal data. Victim addresses are derived from the seed.
// Usage: node gen.mjs  -> writes cases.jsonl next to this file.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const E = await import(pathToFileURL('C:/Users/Adem/Secure Horizon/blockchain/node_modules/ethers/lib.esm/index.js').href);
const HERE = dirname(fileURLToPath(import.meta.url));
const SEED = 20261011;
const FAM = 'BENIGN_DEFI';
const DECLARED_AT = Date.UTC(2026, 9, 11, 9, 0, 0);
const DEADLINE = Math.floor(DECLARED_AT / 1000) + 1200;
const MAX = (1n << 256n) - 1n;
const MAX160 = (1n << 160n) - 1n;
const NOTICE = 'SYNTHETIQUE - jeu de test defensif, aucune cle, aucune signature, aucune donnee personnelle reelle';

// ---------- PRNG ----------
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(SEED);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const chance = (p) => rnd() < p;
let addrCounter = 0;
const seedAddr = (tag) => E.getAddress(E.dataSlice(E.keccak256(E.toUtf8Bytes(`${SEED}:${tag}:${addrCounter++}`)), 12));
const ga = (a) => E.getAddress(a.toLowerCase());
const hexv = (n) => '0x' + BigInt(n).toString(16);
const pad32 = (a) => E.zeroPadValue(a, 32);

// ---------- public addresses (checksum verified; attribution notes where memory is less certain) ----------
const UNSURE = {}; // address(lower) -> note
const A = (addr, note) => { const x = ga(addr); if (note) UNSURE[x.toLowerCase()] = note; return x; };
const P = {
  43114: {
    tokens: {
      WAVAX: { a: A('0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'), d: 18, usd: 25 },
      USDC: { a: A('0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'), d: 6, usd: 1, name: 'USD Coin', ver: '2' },
      USDT: { a: A('0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7'), d: 6, usd: 1 },
      'USDC.e': { a: A('0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664'), d: 6, usd: 1 },
      'WETH.e': { a: A('0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB'), d: 18, usd: 2500 },
      'BTC.b': { a: A('0x152b9d0FdC40C096757F570A51E494bd4b943E50'), d: 8, usd: 60000 },
      JOE: { a: A('0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd'), d: 18, usd: 0.4 },
      sAVAX: { a: A('0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE'), d: 18, usd: 30 },
      QI: { a: A('0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5'), d: 18, usd: 0.01 },
      GMX: { a: A('0x62edc0692BD897D2295872a9FFCac5425011c661', 'GMX sur Avalanche, adresse de memoire'), d: 18, usd: 25 },
      COQ: { a: A('0x420FcA0121DC28039145009570975747295f2329', 'memecoin COQ, adresse de memoire'), d: 18, usd: 0.000001, obscure: true },
    },
    native: 'AVAX', nativeUsd: 25, wrapped: 'WAVAX',
    joeV1: A('0x60aE616a2155Ee3d9A68541Ba4544862310933d4'),
    lb21: A('0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30'),
    lb22: A('0x18556DA13313f3532c54711497A8FedAC273220E', 'LB Router v2.2, attribution de memoire'),
    pangolin: A('0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106'),
    ur: A('0x4Dae2f939ACf50408e13d58534Ff8c2776d45265', 'Uniswap Universal Router sur Avalanche, attribution de memoire'),
    sr02: A('0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE', 'Uniswap SwapRouter02 sur Avalanche, attribution de memoire'),
    aavePool: A('0x794a61358D6845594F94dc1DB02A252b5b4814aD'),
    aaveGateway: A('0xa938d8536aEed1Bd48f548380394Ab30Aa11B00E', 'Aave v3 WrappedTokenGateway Avalanche, attribution de memoire'),
    aTokens: { WAVAX: A('0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97', 'aAvaWAVAX, attribution de memoire'), USDC: A('0x625E7708f30cA75bfd92586e17077590C60eb4cD', 'aAvaUSDC, attribution de memoire') },
    qiAVAX: A('0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c'),
    qiUSDCn: A('0xB715808a78F6041E46d61Cb123C9B4A27056AE9C'),
    comptroller: A('0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4'),
    odos: A('0x88de50B233052e4Fb783d4F6db78Cc34fEa3e9FC', 'Odos Router V2 Avalanche, attribution de memoire'),
    cctp: A('0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982'),
    stargate: A('0x45A01E4e04F14f7A4a6702c74187c5F6222033cd'),
    cctpDomain: 1, sgChain: 106,
  },
  43113: {
    tokens: {
      WAVAX: { a: A('0xd00ae08403B9bbb9124bB305C09058E32C39A48c'), d: 18, usd: 25 },
      USDC: { a: A('0x5425890298aed601595a70AB815c96711a31Bc65'), d: 6, usd: 1, name: 'USD Coin', ver: '2' },
    },
    native: 'AVAX', nativeUsd: 25, wrapped: 'WAVAX',
    cctp: A('0xeb08f243E5d3FCFF26A9E38Ae5520A669f4019d0', 'TokenMessenger CCTP Fuji, attribution de memoire'),
    cctpDomain: 1,
  },
  1: {
    tokens: {
      WETH: { a: A('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'), d: 18, usd: 2500 },
      USDC: { a: A('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'), d: 6, usd: 1, name: 'USD Coin', ver: '2' },
      USDT: { a: A('0xdAC17F958D2ee523a2206206994597C13D831ec7'), d: 6, usd: 1 },
      DAI: { a: A('0x6B175474E89094C44Da98b954EedeAC495271d0F'), d: 18, usd: 1 },
      UNI: { a: A('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'), d: 18, usd: 8 },
      AAVE: { a: A('0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'), d: 18, usd: 150 },
      stETH: { a: A('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'), d: 18, usd: 2500 },
    },
    native: 'ETH', nativeUsd: 2500, wrapped: 'WETH',
    uniV2: A('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'),
    sr: A('0xE592427A0AEce92De3Edee1F18E0157C05861564'),
    sr02: A('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'),
    ur: A('0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD'),
    ur4: A('0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af'),
    aavePool: A('0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'),
    cctp: A('0xBd3fa81B58Ba92a82136038B25aDec7066af3155'),
    stargate: A('0x8731d54E9D02c286767d56ac03e8037C07e01e98'),
    avaxBridge: A('0x8EB8a3b98659Cce290402893d0123abb75E3ab28', 'adresse de depot du pont Avalanche (Core) cote Ethereum, attribution de memoire'),
    cctpDomain: 0, sgChain: 101,
  },
};
const PERMIT2 = A('0x000000000022D473030F116dDEE9F6B43aC78BA3');
const INCH5 = A('0x1111111254EEB25477B68fb85Ed929f73A960582');
const INCH6 = A('0x111111125421cA6dc452d289314280a0f8842A65');
const PARA5 = A('0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57');
const PARA62 = A('0x6A000F20005980200259B80c5102003040001068', 'ParaSwap/Velora Augustus v6.2, attribution de memoire');

// Fuji: routers not public-certain -> seed-derived with approximation
const FUJI_FAKE = {};
const fujiAddr = (name) => { if (!FUJI_FAKE[name]) { FUJI_FAKE[name] = seedAddr('fuji-' + name); UNSURE[FUJI_FAKE[name].toLowerCase()] = `${name} sur Fuji : adresse derivee de la graine (deploiement testnet non verifie)`; } return FUJI_FAKE[name]; };
P[43113].joeV1 = fujiAddr('Trader Joe router'); P[43113].lb21 = fujiAddr('LB router');
P[43113].aavePool = fujiAddr('Aave v3 Pool'); P[43113].pangolin = fujiAddr('Pangolin router');

// ---------- ABI helpers ----------
const ifc = (sig) => new E.Interface([`function ${sig}`]);
const enc = (sig, args) => { const i = ifc(sig); return i.encodeFunctionData(i.fragments[0].name, args); };
const SELECTORS_FROM_MEMORY = new Set();

// ---------- amounts ----------
function amountFor(bucket, tok, opts = {}) {
  const usd = tok.usd;
  let usdAmt;
  if (bucket === 'dust') usdAmt = 0.05 + rnd() * 1.5;
  else if (bucket === 'small') usdAmt = 5 + rnd() * 300;
  else usdAmt = 1000 + rnd() * (opts.huge ? 120000 : 40000);
  let human = usdAmt / usd;
  const sig = human >= 100 ? 0 : human >= 1 ? 2 : 6;
  human = Number(human.toFixed(Math.min(sig, tok.d)));
  if (human <= 0) human = 1 / 10 ** Math.min(4, tok.d);
  const humanStr = String(human);
  const units = E.parseUnits(Number(humanStr).toFixed(Math.min(tok.d, 8)), tok.d);
  return { human: humanStr, units, usd: Math.round(usdAmt * 100) / 100 };
}
const bucket = () => pick(['dust', 'small', 'small', 'small', 'large', 'large']);
function shareFor(b) { if (b === 'dust') return int(0, 2); if (b === 'small') return int(1, 35); return pick([int(10, 49), int(20, 60), int(55, 100)]); }

// ---------- personas, origins, wording ----------
const PERSONAS = ['retraite', 'etudiant', 'trader', 'salarie', 'freelance'];
const tone = () => pick(['honest', 'honest', 'honest', 'vague', 'clumsy', 'absent']);
function words(lang, t, fr, en, frVague, enVague, frClumsy, enClumsy) {
  if (t === 'vague') return lang === 'fr' ? frVague : enVague;
  if (t === 'clumsy') return lang === 'fr' ? frClumsy : enClumsy;
  return lang === 'fr' ? fr : en;
}

const EASY = new Set(['value_and_calldata', 'struct_param', 'struct_path_calldata', 'exact_output_refund', 'delayed_withdrawal', 'no_args_inflow', 'outflow_to_contract_with_receipt_token', 'lp_token_burn', 'eth_named_function_on_avalanche', 'value_no_args', 'multi_hop', 'refund_call', 'split_route', 'amount_in_receipt_units']);
let seq = 0;
let CUR = '';
const GROUP = new Map();
const cases = [];
const seenReq = new Set();

function split(id) { const h = BigInt('0x' + createHash('sha256').update(id).digest('hex')); return (h % 10n) < 3n ? 'TEST' : 'DEV'; }

function chainPick(onlyAvax = false) { const r = rnd(); if (!onlyAvax && r < 0.2) return 1; if (r < 0.32) return 43113; return 43114; }

function mkTx(from, to, data, value = 0n, chainId) { return { method: 'eth_sendTransaction', params: [{ from, to, data, value: hexv(value), chainId: hexv(chainId) }] }; }
function mkTyped(from, td) { return { method: 'eth_signTypedData_v4', params: [from, JSON.stringify(td)] }; }
function mkBatch(from, chainId, calls) { return { method: 'wallet_sendCalls', params: [{ version: '2.0.0', chainId: hexv(chainId), from, atomicRequired: true, calls: calls.map(c => ({ to: c.to, data: c.data, value: hexv(c.value ?? 0n) })) }] }; }

/**
 * emit(spec): spec = {sub, chainId, victim, request, intent:{kind, fr, en, token, amount, label, addr}|null, persona, lang,
 *  origin, originKind ('official'|'official_rebrand'|'third_party_frontend'|'wallet_builtin'), counterparties:[{address,label,ageBlocks,firstSeen,isContract}],
 *  share, hardSignals:[], warnWhy:[], reason, source, imitates, tokenInfo, quote, extraSignals:[], fromMemory:bool, lessKnown:bool}
 */
function emit(s) {
  const reqKey = JSON.stringify(s.request);
  if (seenReq.has(reqKey)) return false;
  seenReq.add(reqKey);
  const id = `V2-${FAM}-${String(++seq).padStart(5, '0')}`;
  const t = s.tone;
  let intent = null;
  if (t !== 'absent' && s.intent) {
    intent = { kind: s.intent.kind, freeText: s.lang === 'fr' ? s.intent.fr : s.intent.en, declaredAt: DECLARED_AT };
    if (t === 'honest' || (t === 'clumsy' && chance(0.5))) {
      if (s.intent.token) intent.token = s.intent.token;
      if (s.intent.amount) intent.amount = s.intent.amount;
    }
    if (s.intent.label) intent.counterpartyLabel = s.intent.label;
    if (s.intent.addr) intent.counterpartyAddress = s.intent.addr;
  }
  // severity
  const warnWhy = [...(s.warnWhy || [])];
  if (s.share > 50) warnWhy.push(`part du solde elevee (${s.share} %)`);
  if (s.originKind === 'third_party_frontend' && s.hardSignals.includes('approval_unlimited')) warnWhy.push('approbation illimitee depuis un front-end tiers (legitime mais non officiel)');
  if (intent === null && s.hardSignals.length && s.share >= 40) warnWhy.push('aucune intention declaree sur une operation sensible');
  const sev = warnWhy.length ? 'warn' : 'ok';
  const hardSignals = [...new Set(s.hardSignals)];
  if (s.originKind === 'official_rebrand') hardSignals.push('official_rebrand_domain');
  if (s.originKind === 'third_party_frontend' || s.originKind === 'wallet_builtin') hardSignals.push('non_official_frontend');
  if (intent && (t === 'vague' || t === 'clumsy')) hardSignals.push('vague_or_clumsy_intent');
  if (!intent) hardSignals.push('intent_absent');
  if (s.counterparties.some(c => c.firstSeen)) hardSignals.push('counterparty_first_seen');
  const hard = sev === 'warn' || s.hardSignals.some(h => !EASY.has(h)) || s.originKind === 'official_rebrand';
  // approximation
  const notes = [];
  const touched = new Set([...s.counterparties.map(c => c.address.toLowerCase()), ...(s.extraAddrs || []).map(a => a.toLowerCase())]);
  for (const a of touched) if (UNSURE[a]) notes.push(UNSURE[a]);
  if (s.fromMemory) notes.push(s.fromMemoryNote || 'selecteur ou structure ABI reconstruit de memoire');
  const approximation = notes.length ? { typed_data_or_selector_from_memory: !!s.fromMemory, note: [...new Set(notes)].join(' ; ') } : null;
  const ctx = {
    chainId: s.chainId,
    victim: { address: s.victim, persona: s.persona },
    origin: s.origin,
    origin_kind: s.originKind,
    address_book: s.addressBook || [],
    known_protocols: s.known || [],
    token_registry: Object.fromEntries(Object.entries(P[s.chainId].tokens).map(([k, v]) => [k, v.a])),
    history: s.history || [],
    counterparty_facts: s.counterparties.map(c => ({ address: c.address, label: c.label, isContract: c.isContract !== false, ageBlocks: c.ageBlocks, firstSeenByUser: !!c.firstSeen })),
    share_of_balance_pct: s.share,
  };
  if (s.tokenInfo) ctx.token_info = s.tokenInfo;
  if (s.quote) ctx.quote = s.quote;
  const c = {
    id, synthetic: true, notice: NOTICE, family: 'benign_defi', subfamily: s.sub,
    request: s.request, context: ctx, intent, label: 'benin',
    reason: s.reason + (warnWhy.length ? ` WARN tolere : ${warnWhy.join(' ; ')}.` : ' OK : effets conformes a l\'intention, contrepartie officielle.'),
    expected_severity: sev, ideal_severity: sev,
    expected_severity_justification: warnWhy.length ? warnWhy.join(' ; ') : 'operation legitime sur contrat officiel, destinataire = soi, rien a signaler au-dela d\'une confirmation normale',
    required_signals: [...new Set(['known_protocol_match', ...(s.extraSignals || [])])],
    hard_signals: [...new Set(hardSignals)],
    blind_to_v3_contract: false,
    catalog_category: 'benin', imitates_category: s.imitates,
    source: s.source, hard, approximation, scenario: null,
    lang: s.lang, split: null, split_reason: 'sha256(id) mod 10 < 3 -> TEST',
  };
  c.split = split(id);
  cases.push(c);
  GROUP.set(id, CUR);
  return true;
}

// ---------- shared case scaffolding ----------
function base(chainId) {
  const victim = seedAddr('victim');
  return { chainId, victim, persona: pick(PERSONAS), lang: chance(0.55) ? 'fr' : 'en', tone: tone() };
}
const age = (kind) => kind === 'old' ? int(5_000_000, 60_000_000) : kind === 'mid' ? int(600_000, 5_000_000) : int(50_000, 600_000);
const cp = (address, label, ageKind = 'old', firstSeen = chance(0.35)) => ({ address, label, ageBlocks: age(ageKind), firstSeen, isContract: true });
function knownList(chainId) {
  const p = P[chainId];
  const out = [];
  for (const k of ['joeV1', 'lb21', 'lb22', 'pangolin', 'ur', 'ur4', 'sr', 'sr02', 'uniV2', 'aavePool', 'aaveGateway', 'qiAVAX', 'qiUSDCn', 'comptroller', 'cctp', 'stargate', 'odos', 'avaxBridge']) if (p[k]) out.push({ name: k, address: p[k] });
  out.push({ name: 'permit2', address: PERMIT2 }, { name: '1inch_v5', address: INCH5 }, { name: '1inch_v6', address: INCH6 }, { name: 'paraswap_v5', address: PARA5 }, { name: 'paraswap_v6.2', address: PARA62 });
  return out;
}
function history(victim, chainId, routers) {
  const h = [];
  for (const r of routers) if (chance(0.5)) h.push({ type: 'interaction', to: r, ageDays: int(3, 400) });
  if (chance(0.3)) h.push({ type: 'incoming', from: seedAddr('cex-hot'), token: P[chainId].native, note: 'retrait exchange' });
  return h;
}
const ORIGINS = {
  lfj: [['https://lfj.gg', 'official_rebrand'], ['https://traderjoexyz.com', 'official']],
  pangolin: [['https://app.pangolin.exchange', 'official']],
  uniswap: [['https://app.uniswap.org', 'official']],
  inch: [['https://app.1inch.io', 'official']],
  para: [['https://app.paraswap.xyz', 'official'], ['https://app.velora.xyz', 'official_rebrand']],
  odos: [['https://app.odos.xyz', 'official']],
  aave: [['https://app.aave.com', 'official']],
  benqi: [['https://app.benqi.fi', 'official'], ['https://staking.benqi.fi', 'official']],
  core: [['https://core.app', 'official'], ['https://core.app/bridge', 'official']],
  cctp: [['https://core.app/bridge', 'official'], ['https://app.across.to', 'third_party_frontend']],
  stargate: [['https://stargate.finance', 'official']],
  revoke: [['https://revoke.cash', 'third_party_frontend'], ['https://core.app', 'official']],
  gov: [['https://www.tally.xyz', 'third_party_frontend'], ['https://vote.uniswapfoundation.org', 'official'], ['https://app.aave.com/governance', 'official']],
  thirdSwap: [['https://swap.defillama.com', 'third_party_frontend'], ['https://jumper.exchange', 'third_party_frontend'], ['wallet://builtin-swap', 'wallet_builtin']],
};
function origin(key, thirdP = 0.15) { const o = chance(thirdP) ? pick(ORIGINS.thirdSwap) : pick(ORIGINS[key]); return { origin: o[0], originKind: o[1] }; }

// ===================== SUBFAMILIES =====================
const subs = [];
const sub = (name, n, fn) => subs.push({ name, n, fn });

const SWAP_FR = (a, ti, to) => [`Je veux echanger ${a} ${ti} contre du ${to}`, `je voudrais faire un truc avec mes ${ti}, les mettre en ${to} je crois`, `swap ${a} ${ti} en ${to} stp vite fait`];
const SWAP_EN = (a, ti, to) => [`Swap ${a} ${ti} for ${to}`, `want to move some ${ti} into ${to} i guess`, `swp ${ti} -> ${to} quick, the usual`];
function swapIntent(a, ti, to) { const f = SWAP_FR(a, ti, to), e = SWAP_EN(a, ti, to); return { fr: f, en: e }; }
function chooseWords(b, fr, en) { const i = b.tone === 'vague' ? 1 : b.tone === 'clumsy' ? 2 : 0; return { fr: fr[i], en: en[i] }; }

// 1. Trader Joe v1 router: AVAX -> token, token -> AVAX
sub('swap_lfj_v1', 60, () => {
  const b = base(chance(0.15) ? 43113 : 43114); const p = P[b.chainId];
  const toks = Object.keys(p.tokens).filter(k => k !== 'WAVAX');
  const other = pick(toks); const tok = p.tokens[other]; const bk = bucket();
  const sellNative = chance(0.6);
  let request, a, w, hs = [];
  if (sellNative) {
    a = amountFor(bk, { d: 18, usd: p.nativeUsd });
    const out = (a.units * BigInt(Math.round(p.nativeUsd * 1000)) / 1000n) * 10n ** BigInt(tok.d) / 10n ** 18n / BigInt(Math.max(1, Math.round(tok.usd))) * 97n / 100n;
    const data = enc('swapExactAVAXForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)', [out, [p.tokens.WAVAX.a, tok.a], b.victim, DEADLINE]);
    request = mkTx(b.victim, p.joeV1, data, a.units, b.chainId); hs.push('value_and_calldata');
    w = chooseWords(b, ...Object.values(swapIntent(a.human, 'AVAX', other)));
    b.intent = { kind: 'buy_or_swap', ...w, token: 'AVAX', amount: a.human };
  } else {
    a = amountFor(bk, tok);
    const data = enc('swapExactTokensForAVAX(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [a.units, 1n, [tok.a, p.tokens.WAVAX.a], b.victim, DEADLINE]);
    request = mkTx(b.victim, p.joeV1, data, 0n, b.chainId);
    hs.push('amount_out_min_tiny');
    w = chooseWords(b, ...Object.values(swapIntent(a.human, other, 'AVAX')));
    b.intent = { kind: 'buy_or_swap', ...w, token: other, amount: a.human };
  }
  if (tok.obscure) hs.push('obscure_token');
  const o = origin('lfj');
  emit({ ...b, ...o, sub: 'swap_lfj_v1', request, share: shareFor(bk), hardSignals: hs, counterparties: [cp(p.joeV1, 'Trader Joe JoeRouter02')], known: knownList(b.chainId), history: history(b.victim, b.chainId, [p.joeV1]),
    reason: `Swap ${sellNative ? 'AVAX -> ' + other : other + ' -> AVAX'} sur le routeur officiel Trader Joe v1, destinataire = l'utilisateur.${sellNative ? '' : ' amountOutMin a 1 wei : slippage laxiste mais pas un vol (MEV possible).'}`,
    source: 'Trader Joe JoeRouter02 (fork UniswapV2Router02) ; docs.lfj.gg', imitates: '8_swaps_et_ponts', extraSignals: ['recipient_is_self'],
    tokenInfo: tok.obscure ? { symbol: other, ageDays: int(200, 900), holders: int(20000, 90000), liquidityUsd: int(300000, 3000000) } : undefined,
    warnWhy: tok.obscure && bk === 'large' ? ['memecoin volatil, gros montant'] : [] });
});

// 2. LB router (Liquidity Book) swaps
sub('swap_lfj_lb', 60, () => {
  const b = base(chance(0.1) ? 43113 : 43114); const p = P[b.chainId];
  const router = b.chainId === 43114 && chance(0.5) ? p.lb22 : p.lb21;
  const toks = Object.keys(p.tokens).filter(k => k !== 'WAVAX'); const other = pick(toks); const tok = p.tokens[other]; const bk = bucket();
  const pathT = ['tuple(uint256[] pairBinSteps,uint8[] versions,address[] tokenPath)'];
  let request, a, hs = ['struct_path_calldata'];
  if (chance(0.55)) {
    a = amountFor(bk, { d: 18, usd: p.nativeUsd });
    const data = enc(`swapExactNATIVEForTokens(uint256 amountOutMin,${pathT[0]} path,address to,uint256 deadline)`, [1n + BigInt(int(1, 9999)), [[pick([10n, 15n, 20n, 25n])], [pick([2, 3])], [p.tokens.WAVAX.a, tok.a]], b.victim, DEADLINE]);
    request = mkTx(b.victim, router, data, a.units, b.chainId); hs.push('value_and_calldata');
    b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, 'AVAX', other))), token: 'AVAX', amount: a.human };
  } else {
    const other2 = pick(Object.keys(p.tokens).filter(k => k !== other)); const tok2 = p.tokens[other2];
    a = amountFor(bk, tok);
    const data = enc(`swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,${pathT[0]} path,address to,uint256 deadline)`, [a.units, 0n, [[pick([1n, 5n, 10n, 20n])], [pick([2, 3])], [tok.a, tok2.a]], b.victim, DEADLINE]);
    request = mkTx(b.victim, router, data, 0n, b.chainId); hs.push('amount_out_min_zero');
    b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, other, other2))), token: other, amount: a.human };
  }
  const o = origin('lfj');
  const lessKnown = router === p.lb22;
  emit({ ...b, ...o, sub: 'swap_lfj_lb', request, share: shareFor(bk), hardSignals: hs, counterparties: [cp(router, router === p.lb22 ? 'LFJ LBRouter v2.2' : 'LFJ LBRouter v2.1', lessKnown ? 'mid' : 'old')], known: knownList(b.chainId), history: history(b.victim, b.chainId, [p.joeV1]),
    reason: `Swap via le routeur Liquidity Book de LFJ (ex-Trader Joe), chemin encode en struct (binSteps, versions, tokens), destinataire = soi.`,
    source: 'LFJ Liquidity Book LBRouter (docs.lfj.gg)', imitates: '8_swaps_et_ponts', extraSignals: ['recipient_is_self', 'struct_decode'],
    fromMemory: true, fromMemoryNote: 'signature LBRouter swapExact*(..., Path, ...) reconstruite de memoire' });
});

// 3. Pangolin
sub('swap_pangolin', 50, () => {
  const b = base(chance(0.15) ? 43113 : 43114); const p = P[b.chainId];
  const other = pick(Object.keys(p.tokens).filter(k => k !== 'WAVAX')); const tok = p.tokens[other]; const bk = bucket();
  let request, a, hs = [];
  const v = rnd();
  if (v < 0.45) {
    a = amountFor(bk, { d: 18, usd: p.nativeUsd });
    request = mkTx(b.victim, p.pangolin, enc('swapExactAVAXForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)', [BigInt(int(1, 1e6)), [p.tokens.WAVAX.a, tok.a], b.victim, DEADLINE]), a.units, b.chainId);
    hs.push('value_and_calldata');
    b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, 'AVAX', other))), token: 'AVAX', amount: a.human };
  } else if (v < 0.8) {
    a = amountFor(bk, tok);
    request = mkTx(b.victim, p.pangolin, enc('swapExactTokensForAVAX(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [a.units, BigInt(int(1, 1e9)), [tok.a, p.tokens.WAVAX.a], b.victim, DEADLINE]), 0n, b.chainId);
    b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, other, 'AVAX'))), token: other, amount: a.human };
  } else {
    // exact output: user wants exactly X tokens, pays up to max AVAX
    a = amountFor(bk, tok);
    const maxIn = a.units * 10n ** 18n / 10n ** BigInt(tok.d) * BigInt(Math.max(1, Math.round(tok.usd * 100))) / BigInt(p.nativeUsd * 100) * 103n / 100n + 1n;
    request = mkTx(b.victim, p.pangolin, enc('swapAVAXForExactTokens(uint256 amountOut,address[] path,address to,uint256 deadline)', [a.units, [p.tokens.WAVAX.a, tok.a], b.victim, DEADLINE]), maxIn, b.chainId);
    hs.push('exact_output_refund');
    b.intent = { kind: 'buy_or_swap', ...chooseWords(b, [`Acheter exactement ${a.human} ${other} avec des AVAX`, `il me faut du ${other}, a peu pres ${a.human}`, `achete ${a.human} ${other} paye en avax`], [`Buy exactly ${a.human} ${other} with AVAX`, `need some ${other}, around ${a.human}`, `buy ${a.human} ${other} pay w avax`]), token: other, amount: a.human };
  }
  const o = origin('pangolin');
  emit({ ...b, ...o, sub: 'swap_pangolin', request, share: shareFor(bk), hardSignals: hs, counterparties: [cp(p.pangolin, 'Pangolin Router')], known: knownList(b.chainId), history: history(b.victim, b.chainId, [p.pangolin]),
    reason: 'Swap sur le routeur officiel Pangolin (fork UniswapV2 aux noms AVAX), destinataire = soi.', source: 'Pangolin Router (github.com/pangolindex/exchange-contracts)', imitates: '8_swaps_et_ponts', extraSignals: ['recipient_is_self'] });
});

// 4. Uniswap Universal Router (Avalanche + Ethereum): execute(commands, inputs, deadline), PERMIT2_PERMIT + V3_SWAP_EXACT_IN (+ UNWRAP)
const AC = E.AbiCoder.defaultAbiCoder();
function v3path(a, fee, b) { return E.solidityPacked(['address', 'uint24', 'address'], [a, fee, b]); }
sub('swap_uniswap_ur', 70, () => {
  const b = base(chance(0.3) ? 1 : 43114); const p = P[b.chainId];
  const router = b.chainId === 1 && chance(0.4) ? p.ur4 : p.ur;
  const syms = Object.keys(p.tokens); const inS = pick(syms.filter(s => !p.tokens[s].obscure)); let outS = pick(syms.filter(s => s !== inS)); const tin = p.tokens[inS], tout = p.tokens[outS];
  const bk = bucket(); const a = amountFor(bk, tin);
  const hs = ['multicall_nested', 'universal_router_commands'];
  let commands, inputs, value = 0n;
  const fee = pick([100, 500, 3000, 10000]);
  if (router === p.ur4) {
    // v4 UR: keep V3 command path (0x00) which is still supported; encoding identical
  }
  const native = chance(0.3);
  if (native) {
    // WRAP_ETH (0x0b) then V3_SWAP_EXACT_IN (0x00) payer=router
    const na = amountFor(bk, { d: 18, usd: p.nativeUsd });
    value = na.units;
    commands = '0x0b00';
    inputs = [AC.encode(['address', 'uint256'], ['0x0000000000000000000000000000000000000002', na.units]),
      AC.encode(['address', 'uint256', 'uint256', 'bytes', 'bool'], ['0x0000000000000000000000000000000000000001', na.units, 0n, v3path(p.tokens[p.wrapped].a, fee, tout.a), false])];
    hs.push('value_and_calldata');
    b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(na.human, p.native, outS))), token: p.native, amount: na.human };
  } else {
    // PERMIT2_PERMIT (0x0a) + V3_SWAP_EXACT_IN (0x00) (+ optional UNWRAP_WETH 0x0c)
    const permitSingle = [[tin.a, MAX160 >> BigInt(int(0, 1) * 100), BigInt(Math.floor(DECLARED_AT / 1000) + 30 * 86400), BigInt(int(0, 40))], router, BigInt(DEADLINE)];
    const sig = '0x' + '00'.repeat(65); // placeholder: wallet request BEFORE signature is a tx whose inputs already contain the earlier signed permit; synthetic zero bytes
    const unwrap = outS === p.wrapped && chance(0.7);
    commands = unwrap ? '0x0a000c' : '0x0a00';
    inputs = [AC.encode(['tuple(tuple(address token,uint160 amount,uint48 expiration,uint48 nonce) details,address spender,uint256 sigDeadline)', 'bytes'], [permitSingle, sig]),
      AC.encode(['address', 'uint256', 'uint256', 'bytes', 'bool'], [unwrap ? '0x0000000000000000000000000000000000000002' : '0x0000000000000000000000000000000000000001', a.units, 0n, v3path(tin.a, fee, tout.a), true])];
    if (unwrap) inputs.push(AC.encode(['address', 'uint256'], ['0x0000000000000000000000000000000000000001', 0n]));
    hs.push('permit2_inside_calldata', 'placeholder_recipient_constants');
    if (permitSingle[0][1] === MAX160) hs.push('approval_unlimited');
    b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, inS, unwrap ? p.native : outS))), token: inS, amount: a.human };
  }
  const data = enc('execute(bytes commands,bytes[] inputs,uint256 deadline)', [commands, inputs, DEADLINE]);
  const o = origin('uniswap');
  emit({ ...b, ...o, sub: 'swap_uniswap_ur', request: mkTx(b.victim, router, data, value, b.chainId), share: shareFor(bk), hardSignals: hs, counterparties: [cp(router, router === p.ur4 ? 'Uniswap v4 Universal Router' : 'Uniswap Universal Router', router === p.ur4 ? 'mid' : 'old')], known: knownList(b.chainId), history: history(b.victim, b.chainId, [router, PERMIT2]),
    reason: 'Swap Uniswap via Universal Router : commandes empilees (WRAP/PERMIT2_PERMIT/V3_SWAP_EXACT_IN/UNWRAP), destinataires codes par les constantes MSG_SENDER (0x..01) et ADDRESS_THIS (0x..02). Ressemble a un multicall opaque, mais tout revient a l\'utilisateur. La signature Permit2 embarquee est un octet nul synthetique.',
    source: 'Uniswap Universal Router (Commands.sol, Constants.sol)', imitates: '4_execution_indirecte', extraSignals: ['recursive_decode_required', 'recipient_is_self'],
    fromMemory: router === p.ur4 || b.chainId === 43114, fromMemoryNote: 'adresse UR hors Ethereum v1/v4 de memoire ; codes de commande Universal Router de memoire', extraAddrs: [PERMIT2] });
});

// 5. Uniswap on Ethereum: V2 router & V3 SwapRouter exactInputSingle
sub('swap_uniswap_eth_direct', 50, () => {
  const b = base(1); const p = P[1];
  const syms = Object.keys(p.tokens); const inS = pick(syms); const outS = pick(syms.filter(s => s !== inS)); const tin = p.tokens[inS], tout = p.tokens[outS];
  const bk = bucket(); let request, hs = [], a, router, label;
  if (chance(0.5)) {
    router = p.uniV2; label = 'Uniswap V2 Router02';
    if (chance(0.5)) { a = amountFor(bk, { d: 18, usd: 2500 }); request = mkTx(b.victim, router, enc('swapExactETHForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)', [BigInt(int(1, 1e9)), [p.tokens.WETH.a, tout.a], b.victim, DEADLINE]), a.units, 1); hs.push('value_and_calldata'); b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, 'ETH', outS))), token: 'ETH', amount: a.human }; }
    else { a = amountFor(bk, tin); request = mkTx(b.victim, router, enc('swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [a.units, 0n, [tin.a, p.tokens.WETH.a, tout.a], b.victim, DEADLINE]), 0n, 1); hs.push('fee_on_transfer_variant', 'amount_out_min_zero', 'multi_hop'); b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, inS, outS))), token: inS, amount: a.human }; }
  } else {
    router = p.sr; label = 'Uniswap V3 SwapRouter';
    a = amountFor(bk, tin);
    request = mkTx(b.victim, router, enc('exactInputSingle(tuple(address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)', [[tin.a, tout.a, pick([500, 3000, 10000]), b.victim, DEADLINE, a.units, 0n, 0n]]), 0n, 1);
    hs.push('struct_param');
    b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, inS, outS))), token: inS, amount: a.human };
  }
  const o = origin('uniswap');
  emit({ ...b, ...o, sub: 'swap_uniswap_eth_direct', request, share: shareFor(bk), hardSignals: hs, counterparties: [cp(router, label)], known: knownList(1), history: history(b.victim, 1, [router]),
    reason: `Swap Ethereum sur ${label} officiel, destinataire = soi.`, source: 'Uniswap v2-periphery / v3-periphery', imitates: '8_swaps_et_ponts', extraSignals: ['recipient_is_self'] });
});

// 6. 1inch v5 swap
sub('swap_1inch', 60, () => {
  const b = base(chainPick()); const p = P[b.chainId];
  const syms = Object.keys(p.tokens); const inS = pick(syms); const outS = pick(syms.filter(s => s !== inS)); const tin = p.tokens[inS], tout = p.tokens[outS];
  const bk = bucket(); const a = amountFor(bk, tin);
  const executor = seedAddr('1inch-executor');
  UNSURE[executor.toLowerCase()] = 'executeur 1inch derive de la graine (change a chaque version)';
  const recvSelf = chance(0.8);
  const desc = [tin.a, tout.a, executor, b.victim, a.units, 1n + BigInt(int(0, 1e6)), BigInt(pick([0, 4, 0]))];
  const inner = '0x' + E.keccak256(E.toUtf8Bytes('route' + seq)).slice(2).repeat(int(2, 6));
  const data = enc('swap(address executor,tuple(address srcToken,address dstToken,address srcReceiver,address dstReceiver,uint256 amount,uint256 minReturnAmount,uint256 flags) desc,bytes permit,bytes data)', [executor, desc, '0x', inner]);
  const hs = ['opaque_executor_data', 'src_receiver_is_executor'];
  if (b.chainId === 43113) return false; // 1inch not on Fuji
  const o = origin('inch');
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, inS, outS))), token: inS, amount: a.human };
  emit({ ...b, ...o, sub: 'swap_1inch', request: mkTx(b.victim, INCH5, data, 0n, b.chainId), share: shareFor(bk), hardSignals: hs, counterparties: [cp(INCH5, '1inch AggregationRouterV5'), { ...cp(executor, '1inch executor', 'mid', true), isContract: true }], known: knownList(b.chainId), history: history(b.victim, b.chainId, [INCH5]),
    reason: '1inch AggregationRouterV5.swap : srcReceiver = executeur 1inch (normal, il route les fonds), dstReceiver = utilisateur, data = route opaque. L\'adresse inconnue est l\'executeur, pas un voleur.',
    source: '1inch AggregationRouterV5 (docs.1inch.io)', imitates: '4_execution_indirecte', extraSignals: ['recipient_is_self', 'aggregator_executor_whitelist'], extraAddrs: [executor] });
});

// 7. ParaSwap / Velora
sub('swap_paraswap', 40, () => {
  const b = base(chance(0.25) ? 1 : 43114); const p = P[b.chainId];
  const syms = Object.keys(p.tokens); const inS = pick(syms); const outS = pick(syms.filter(s => s !== inS)); const tin = p.tokens[inS], tout = p.tokens[outS];
  const bk = bucket(); const a = amountFor(bk, tin);
  const executor = seedAddr('paraswap-executor'); UNSURE[executor.toLowerCase()] = 'executeur Augustus v6 derive de la graine';
  const quoted = a.units * BigInt(Math.max(1, Math.round(tin.usd * 1000))) / BigInt(Math.max(1, Math.round(tout.usd * 1000)));
  const data = enc('swapExactAmountIn(address executor,tuple(address srcToken,address destToken,uint256 fromAmount,uint256 toAmount,uint256 quotedAmount,bytes32 metadata,address beneficiary) swapData,uint256 partnerAndFee,bytes permit,bytes executorData)',
    [executor, [tin.a, tout.a, a.units, quoted * 99n / 100n, quoted, E.keccak256(E.toUtf8Bytes('meta' + seq)), b.victim], 0n, '0x', E.keccak256(E.toUtf8Bytes('ex' + seq))]);
  const o = origin('para');
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, inS, outS))), token: inS, amount: a.human };
  emit({ ...b, ...o, sub: 'swap_paraswap', request: mkTx(b.victim, PARA62, data, 0n, b.chainId), share: shareFor(bk), hardSignals: ['opaque_executor_data', 'rebranded_protocol'], counterparties: [cp(PARA62, 'ParaSwap/Velora AugustusV6.2', 'mid'), cp(executor, 'Augustus executor', 'mid', true)], known: knownList(b.chainId), history: history(b.victim, b.chainId, [PARA5]),
    reason: 'Swap ParaSwap (rebaptise Velora) via AugustusV6.2.swapExactAmountIn, beneficiary = utilisateur. Nouveau routeur v6 jamais utilise par la personne (elle utilisait v5).',
    source: 'ParaSwap/Velora Augustus v6 docs', imitates: '4_execution_indirecte', extraSignals: ['recipient_is_self'],
    fromMemory: true, fromMemoryNote: 'ABI swapExactAmountIn Augustus v6.2 reconstruite de memoire', extraAddrs: [executor] });
});

// 8. Odos
sub('swap_odos', 40, () => {
  const b = base(43114); const p = P[43114];
  const syms = Object.keys(p.tokens); const inS = pick(syms); const outS = pick(syms.filter(s => s !== inS)); const tin = p.tokens[inS], tout = p.tokens[outS];
  const bk = bucket(); const a = amountFor(bk, tin); let data, hs;
  const executor = seedAddr('odos-executor'); UNSURE[executor.toLowerCase()] = 'executeur Odos derive de la graine';
  if (chance(0.5)) {
    data = enc('swap(tuple(address inputToken,uint256 inputAmount,address inputReceiver,address outputToken,uint256 outputQuote,uint256 outputMin,address outputReceiver) tokenInfo,bytes pathDefinition,address executor,uint32 referralCode)',
      [[tin.a, a.units, executor, tout.a, 10n ** BigInt(tout.d), 10n ** BigInt(tout.d) * 99n / 100n, b.victim], E.keccak256(E.toUtf8Bytes('path' + seq)), executor, 0]);
    hs = ['opaque_executor_data'];
  } else {
    // swapCompact(): selector + packed bytes, no ABI args
    data = ifc('swapCompact()').getFunction('swapCompact').selector + E.solidityPacked(['address', 'uint256', 'address', 'uint32'], [tin.a, a.units, tout.a, int(1, 9999)]).slice(2) + E.keccak256(E.toUtf8Bytes('c' + seq)).slice(2);
    hs = ['compact_calldata_not_abi', 'opaque_executor_data'];
  }
  const o = origin('odos');
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, inS, outS))), token: inS, amount: a.human };
  emit({ ...b, ...o, sub: 'swap_odos', request: mkTx(b.victim, p.odos, data, 0n, 43114), share: shareFor(bk), hardSignals: hs, counterparties: [cp(p.odos, 'Odos Router V2', 'mid')], known: knownList(43114), history: history(b.victim, 43114, [p.odos]),
    reason: 'Swap via Odos Router V2 ; la variante swapCompact empaquette les arguments hors ABI : indecodable par un decodeur naif mais legitime.',
    warnWhy: hs.includes('compact_calldata_not_abi') ? ['calldata compacte non decodable : on ne peut pas montrer les effets, avertissement leger tolere'] : [],
    source: 'Odos Router V2 (docs.odos.xyz)', imitates: '4_execution_indirecte', extraSignals: ['simulation_required'],
    fromMemory: true, fromMemoryNote: 'ABI Odos swap/swapCompact reconstruite de memoire ; payload compact synthetique', extraAddrs: [executor] });
});

// 9. Unlimited approvals to official routers
sub('approve_unlimited_router', 80, () => {
  const b = base(chainPick()); const p = P[b.chainId];
  const routers = [['joeV1', 'Trader Joe JoeRouter02', 'lfj'], ['lb21', 'LFJ LBRouter v2.1', 'lfj'], ['pangolin', 'Pangolin Router', 'pangolin'], ['aavePool', 'Aave v3 Pool', 'aave'], ['uniV2', 'Uniswap V2 Router', 'uniswap'], ['sr02', 'Uniswap SwapRouter02', 'uniswap'], ['cctp', 'Circle CCTP TokenMessenger', 'cctp'], ['stargate', 'Stargate Router', 'stargate']].filter(r => p[r[0]]);
  const extra = b.chainId !== 43113 ? [[INCH5, '1inch AggregationRouterV5', 'inch'], [PERMIT2, 'Uniswap Permit2', 'uniswap'], [PARA62, 'Velora AugustusV6.2', 'para']] : [];
  const all = [...routers.map(r => [p[r[0]], r[1], r[2]]), ...extra];
  const [spender, label, okey] = pick(all);
  const sym = pick(Object.keys(p.tokens)); const tok = p.tokens[sym];
  const amtKind = pick(['max256', 'max256', 'max256', 'max160', 'big_round']);
  const amt = amtKind === 'max256' ? MAX : amtKind === 'max160' ? MAX160 : 10n ** BigInt(tok.d + int(6, 12));
  const data = enc('approve(address spender,uint256 amount)', [spender, amt]);
  const o = origin(okey, 0.25);
  const wfr = [`Autoriser ${label} a utiliser mes ${sym} pour pouvoir swapper`, `le site me demande une autorisation pour mes ${sym}, ok`, `approve ${sym} pr le swap`];
  const wen = [`Approve ${sym} for ${label} so I can trade`, `site asks permission for my ${sym}, fine`, `aprove ${sym} for swap`];
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, wfr, wen), token: sym };
  const share = int(0, 100);
  emit({ ...b, ...o, sub: 'approve_unlimited_router', request: mkTx(b.victim, tok.a, data, 0n, b.chainId), share: 0, hardSignals: ['approval_unlimited'], counterparties: [cp(spender, label)], known: knownList(b.chainId), history: history(b.victim, b.chainId, [spender]),
    reason: `Approbation ${amtKind === 'big_round' ? 'tres grande' : 'illimitee'} de ${sym} vers ${label}, spender officiel connu. Pratique standard des front-ends DEX (une seule approbation). Aucun fonds ne sort a cette etape. Balance exposee : ${share} % du portefeuille en ${sym}.`,
    source: 'Pattern UI DEX "approve max" (Uniswap, LFJ, 1inch, Aave)', imitates: '1_droits_depense_directs', extraSignals: ['approval_unlimited', 'spender_is_known_router'] });
});

// 10. Permit2 PermitSingle / PermitBatch signatures to Universal Router
function permit2Typed(chainId, kind, details, spender) {
  const domain = { name: 'Permit2', chainId, verifyingContract: PERMIT2 };
  const EIP712Domain = [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }];
  const PermitDetails = [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }];
  if (kind === 'single') return { types: { EIP712Domain, PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails }, domain, primaryType: 'PermitSingle', message: { details: details[0], spender, sigDeadline: String(DEADLINE + 600) } };
  return { types: { EIP712Domain, PermitBatch: [{ name: 'details', type: 'PermitDetails[]' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails }, domain, primaryType: 'PermitBatch', message: { details, spender, sigDeadline: String(DEADLINE + 600) } };
}
sub('permit2_signature', 70, () => {
  const b = base(chance(0.25) ? 1 : 43114); const p = P[b.chainId];
  const spender = b.chainId === 1 && chance(0.4) ? p.ur4 : p.ur;
  const syms = Object.keys(p.tokens).filter(s => !p.tokens[s].obscure);
  const batch = chance(0.2);
  const pickD = (s) => { const t = p.tokens[s]; const bk = bucket(); const unl = chance(0.5); const a = amountFor(bk, t); return { d: { token: t.a, amount: (unl ? MAX160 : a.units).toString(), expiration: String(Math.floor(DECLARED_AT / 1000) + pick([30, 30, 7, 1]) * 86400), nonce: String(int(0, 60)) }, unl, a, bk, s }; };
  const items = batch ? [pickD(syms[0]), pickD(pick(syms.slice(1)))] : [pickD(pick(syms))];
  const td = permit2Typed(b.chainId, batch ? 'batch' : 'single', items.map(i => i.d), spender);
  const hs = ['permit2_signature', 'offchain_signature'];
  if (items.some(i => i.unl)) hs.push('approval_unlimited');
  if (batch) hs.push('permit_batch');
  const o = origin('uniswap', 0.2);
  const it = items[0];
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(it.a.human, it.s, pick(syms.filter(s => s !== it.s))))), token: it.s, amount: it.a.human };
  emit({ ...b, ...o, sub: 'permit2_signature', request: mkTyped(b.victim, td), share: shareFor(it.bk), hardSignals: hs, counterparties: [cp(PERMIT2, 'Uniswap Permit2'), cp(spender, 'Uniswap Universal Router')], known: knownList(b.chainId), history: history(b.victim, b.chainId, [PERMIT2, spender]),
    reason: `Signature Permit2 ${batch ? 'PermitBatch' : 'PermitSingle'} demandee par app.uniswap.org avant un swap : spender = Universal Router officiel, expiration courte (<= 30 j). Exactement le flux standard Uniswap, malgre la ressemblance avec un drainer Permit2.`,
    source: 'Uniswap Permit2 AllowanceTransfer (PermitSingle/PermitBatch) ; flux app.uniswap.org', imitates: '2_signatures_hors_chaine', extraSignals: ['typed_data_decode', 'spender_is_known_router'], extraAddrs: [spender] });
});

// 11. EIP-2612 permit to official routers/protocols (USDC)
sub('permit_eip2612_router', 40, () => {
  const b = base(chance(0.3) ? 1 : chance(0.15) ? 43113 : 43114); const p = P[b.chainId];
  const usdc = p.tokens.USDC;
  const sp = b.chainId === 43113 ? [[p.aavePool, 'Aave v3 Pool (Fuji)', 'aave']] : [[INCH5, '1inch AggregationRouterV5', 'inch'], [p.aavePool, 'Aave v3 Pool', 'aave'], [PARA62, 'Velora AugustusV6.2', 'para']];
  const [spender, label, okey] = pick(sp);
  const bk = bucket(); const a = amountFor(bk, usdc); const unl = chance(0.3);
  const td = { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
    domain: { name: usdc.name, version: usdc.ver, chainId: b.chainId, verifyingContract: usdc.a }, primaryType: 'Permit',
    message: { owner: b.victim, spender, value: (unl ? MAX : a.units).toString(), nonce: String(int(0, 30)), deadline: String(DEADLINE) } };
  const o = origin(okey, 0.1);
  const isAave = label.startsWith('Aave');
  b.intent = isAave ? { kind: 'buy_or_swap', ...chooseWords(b, [`Deposer ${a.human} USDC sur Aave`, `mettre mes usdc sur aave pour les interets`, `depot usdc aave ${a.human}`], [`Supply ${a.human} USDC to Aave`, `put my usdc on aave for yield`, `deposit usdc aave ${a.human}`]), token: 'USDC', amount: a.human }
    : { kind: 'buy_or_swap', ...chooseWords(b, ...Object.values(swapIntent(a.human, 'USDC', pick(Object.keys(p.tokens).filter(s => s !== 'USDC'))))), token: 'USDC', amount: a.human };
  emit({ ...b, ...o, sub: 'permit_eip2612_router', request: mkTyped(b.victim, td), share: shareFor(bk), hardSignals: ['eip2612_permit', 'offchain_signature', ...(unl ? ['approval_unlimited'] : [])], counterparties: [cp(spender, label)], known: knownList(b.chainId), history: history(b.victim, b.chainId, [spender]),
    reason: `Permit EIP-2612 sur USDC (domaine "USD Coin" v2) vers ${label}, utilise pour economiser une transaction d'approbation (supplyWithPermit / permit 1inch). Spender officiel.`,
    source: 'EIP-2612 ; Aave v3 supplyWithPermit ; 1inch permit', imitates: '2_signatures_hors_chaine', extraSignals: ['typed_data_decode', 'spender_is_known_router'], extraAddrs: [spender] });
});

// 12. approve token -> Permit2 (Uniswap first step)
sub('approve_permit2_contract', 40, () => {
  const b = base(chance(0.25) ? 1 : 43114); const p = P[b.chainId];
  const sym = pick(Object.keys(p.tokens)); const tok = p.tokens[sym];
  const data = enc('approve(address spender,uint256 amount)', [PERMIT2, MAX]);
  const o = origin('uniswap', 0.15);
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, [`Activer ${sym} sur Uniswap pour echanger`, `uniswap me demande un truc avant le swap`, `valider le ${sym} sur uniswap`], [`Enable ${sym} on Uniswap to swap`, `uniswap wants something before swapping`, `approve ${sym} uni`]), token: sym };
  emit({ ...b, ...o, sub: 'approve_permit2_contract', request: mkTx(b.victim, tok.a, data, 0n, b.chainId), share: 0, hardSignals: ['approval_unlimited', 'spender_not_router_but_permit2'], counterparties: [cp(PERMIT2, 'Uniswap Permit2', 'old', chance(0.6))], known: knownList(b.chainId), history: history(b.victim, b.chainId, []),
    reason: `Approbation illimitee de ${sym} vers le contrat Permit2 officiel (meme adresse sur toutes les chaines) : premiere etape normale avant tout swap Uniswap. Le spender n'est pas un routeur mais Permit2 lui-meme.`,
    source: 'Uniswap Permit2 docs (approve Permit2 once)', imitates: '1_droits_depense_directs', extraSignals: ['approval_unlimited', 'spender_is_permit2'] });
});

// 13. SwapRouter02 multicall
sub('router_multicall', 50, () => {
  const b = base(chance(0.3) ? 1 : 43114); const p = P[b.chainId];
  const r = p.sr02;
  const syms = Object.keys(p.tokens).filter(s => !p.tokens[s].obscure);
  const inS = pick(syms.filter(s => s !== p.wrapped)); const tin = p.tokens[inS]; const bk = bucket(); const a = amountFor(bk, tin);
  const variant = pick(['to_native', 'from_native', 'two_swaps']);
  const ADDR_THIS = '0x0000000000000000000000000000000000000002';
  const sig = 'exactInputSingle(tuple(address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)';
  let calls = [], value = 0n, hs = ['multicall_nested'], intentTxt;
  if (variant === 'to_native') {
    calls.push(enc(sig, [[tin.a, p.tokens[p.wrapped].a, 500, ADDR_THIS, a.units, 1n, 0n]]));
    calls.push(enc('unwrapWETH9(uint256 amountMinimum,address recipient)', [1n, b.victim]));
    hs.push('recipient_router_then_unwrap');
    intentTxt = swapIntent(a.human, inS, p.native);
  } else if (variant === 'from_native') {
    const na = amountFor(bk, { d: 18, usd: p.nativeUsd }); value = na.units;
    calls.push(enc(sig, [[p.tokens[p.wrapped].a, tin.a, 3000, b.victim, na.units, 1n, 0n]]));
    calls.push(enc('refundETH()', []));
    hs.push('value_and_calldata', 'refund_call');
    intentTxt = swapIntent(na.human, p.native, inS);
  } else {
    const outS = pick(syms.filter(s => s !== inS)); const half = a.units / 2n;
    calls.push(enc(sig, [[tin.a, p.tokens[outS].a, 500, b.victim, half, 1n, 0n]]));
    calls.push(enc(sig, [[tin.a, p.tokens[outS].a, 3000, b.victim, a.units - half, 1n, 0n]]));
    hs.push('split_route');
    intentTxt = swapIntent(a.human, inS, outS);
  }
  const data = enc('multicall(uint256 deadline,bytes[] data)', [DEADLINE, calls]);
  const o = origin('uniswap', 0.2);
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, intentTxt.fr, intentTxt.en), token: variant === 'from_native' ? p.native : inS, amount: a.human };
  emit({ ...b, ...o, sub: 'router_multicall', request: mkTx(b.victim, r, data, value, b.chainId), share: shareFor(bk), hardSignals: hs, counterparties: [cp(r, 'Uniswap SwapRouter02')], known: knownList(b.chainId), history: history(b.victim, b.chainId, [r]),
    reason: `multicall(deadline, bytes[]) sur SwapRouter02 officiel : ${variant === 'to_native' ? 'swap vers le routeur (ADDRESS_THIS) puis unwrapWETH9 vers l\'utilisateur' : variant === 'from_native' ? 'swap paye en natif puis refundETH' : 'route scindee en deux pools'}. Il faut decoder recursivement pour voir que tout revient a soi.`,
    source: 'Uniswap swap-router-contracts (SwapRouter02, MulticallExtended, PeripheryPaymentsWithFee)', imitates: '4_execution_indirecte', extraSignals: ['recursive_decode_required', 'recipient_is_self'],
    fromMemory: b.chainId === 43114, fromMemoryNote: 'adresse SwapRouter02 Avalanche de memoire' });
});

// 14. Aave v3 supply / withdraw / borrow / repay
sub('aave_lending', 140, () => {
  const b = base(chance(0.22) ? 1 : chance(0.1) ? 43113 : 43114); const p = P[b.chainId];
  const syms = Object.keys(p.tokens).filter(s => !p.tokens[s].obscure && !['JOE', 'QI', 'GMX', 'UNI', 'stETH'].includes(s));
  const sym = pick(syms); const tok = p.tokens[sym]; const bk = bucket(); const a = amountFor(bk, tok);
  const op = pick(['supply', 'supply', 'withdraw', 'withdraw_max', 'borrow', 'repay', 'repay_max', 'batch_approve_supply', 'collateral_toggle']);
  let request, hs = [], fr, en, reason;
  const pool = p.aavePool;
  switch (op) {
    case 'supply': request = mkTx(b.victim, pool, enc('supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)', [tok.a, a.units, b.victim, 0]), 0n, b.chainId);
      fr = [`Deposer ${a.human} ${sym} sur Aave`, `je mets mes ${sym} a travailler sur aave`, `depo aave ${a.human} ${sym}`]; en = [`Supply ${a.human} ${sym} on Aave`, `put my ${sym} to work on aave`, `aave deposit ${a.human} ${sym}`];
      reason = 'Depot (supply) sur Aave v3 Pool officiel, onBehalfOf = soi ; le token sort mais l\'aToken revient.'; hs.push('outflow_to_contract_with_receipt_token'); break;
    case 'withdraw': request = mkTx(b.victim, pool, enc('withdraw(address asset,uint256 amount,address to)', [tok.a, a.units, b.victim]), 0n, b.chainId);
      fr = [`Retirer ${a.human} ${sym} d'Aave`, `recuperer une partie de mes ${sym} sur aave`, `retire ${a.human} ${sym} aave`]; en = [`Withdraw ${a.human} ${sym} from Aave`, `get some of my ${sym} back from aave`, `wd ${a.human} ${sym} aave`];
      reason = 'Retrait Aave v3 vers soi : aTokens brules, sous-jacent recu.'; break;
    case 'withdraw_max': request = mkTx(b.victim, pool, enc('withdraw(address asset,uint256 amount,address to)', [tok.a, MAX, b.victim]), 0n, b.chainId);
      fr = [`Tout retirer de mes ${sym} sur Aave`, `je veux recuperer tout ce que j'ai sur aave`, `retirer tout aave`]; en = [`Withdraw all my ${sym} from Aave`, `want everything back from aave`, `withdraw max aave`];
      reason = 'withdraw(asset, type(uint256).max, soi) : la valeur max signifie "tout mon solde", ce n\'est pas une approbation illimitee.'; hs.push('max_uint_not_approval'); break;
    case 'borrow': request = mkTx(b.victim, pool, enc('borrow(address asset,uint256 amount,uint256 interestRateMode,uint16 referralCode,address onBehalfOf)', [tok.a, a.units, 2n, 0, b.victim]), 0n, b.chainId);
      fr = [`Emprunter ${a.human} ${sym} sur Aave avec mon collateral`, `prendre un pret sur aave`, `emprunt ${sym} aave`]; en = [`Borrow ${a.human} ${sym} on Aave against my collateral`, `take a loan on aave`, `borrow ${sym} aave`];
      reason = 'Emprunt Aave v3 a taux variable, fonds recus par soi ; cree une dette (risque de liquidation, pas un vol).'; hs.push('debt_creation'); break;
    case 'repay': request = mkTx(b.victim, pool, enc('repay(address asset,uint256 amount,uint256 interestRateMode,address onBehalfOf)', [tok.a, a.units, 2n, b.victim]), 0n, b.chainId);
      fr = [`Rembourser ${a.human} ${sym} de mon pret Aave`, `rembourser un bout de ma dette`, `repay aave ${a.human}`]; en = [`Repay ${a.human} ${sym} of my Aave loan`, `pay back part of my debt`, `repay aave ${a.human}`];
      reason = 'Remboursement Aave : le token sort sans contrepartie entrante (la dette baisse) : sortie sans entree mais legitime.'; hs.push('outflow_without_inflow'); break;
    case 'repay_max': request = mkTx(b.victim, pool, enc('repay(address asset,uint256 amount,uint256 interestRateMode,address onBehalfOf)', [tok.a, MAX, 2n, b.victim]), 0n, b.chainId);
      fr = [`Rembourser tout mon pret ${sym} sur Aave`, `solder ma dette aave`, `tout rembourser aave`]; en = [`Repay my whole ${sym} Aave loan`, `close my aave debt`, `repay all aave`];
      reason = 'repay(asset, max, 2, soi) : max = rembourser toute la dette, pas une approbation.'; hs.push('max_uint_not_approval', 'outflow_without_inflow'); break;
    case 'batch_approve_supply': request = mkBatch(b.victim, b.chainId, [{ to: tok.a, data: enc('approve(address spender,uint256 amount)', [pool, a.units]) }, { to: pool, data: enc('supply(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)', [tok.a, a.units, b.victim, 0]) }]);
      fr = [`Deposer ${a.human} ${sym} sur Aave en une fois`, `aave en un clic pour mes ${sym}`, `approve+depot aave`]; en = [`Supply ${a.human} ${sym} to Aave in one go`, `one-click aave for my ${sym}`, `approve+supply aave`];
      reason = 'Lot EIP-5792 (wallet_sendCalls) : approve exact puis supply vers soi sur Aave v3.'; hs.push('batched_calls'); break;
    default: request = mkTx(b.victim, pool, enc('setUserUseReserveAsCollateral(address asset,bool useAsCollateral)', [tok.a, chance(0.5)]), 0n, b.chainId);
      fr = [`Activer ${sym} comme garantie sur Aave`, `changer un reglage collateral sur aave`, `toggle collat ${sym}`]; en = [`Toggle ${sym} as collateral on Aave`, `change a collateral setting on aave`, `collat toggle ${sym}`];
      reason = 'Changement du statut collateral : aucun transfert, aucun droit accorde a un tiers.'; hs.push('no_transfer_state_change');
  }
  const o = origin('aave', 0.1);
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, fr, en), token: sym, amount: op.endsWith('max') || op === 'collateral_toggle' ? undefined : a.human };
  const share = op === 'withdraw_max' || op === 'repay_max' ? int(60, 100) : shareFor(bk);
  emit({ ...b, ...o, sub: 'aave_' + op, request, share: op.startsWith('withdraw') || op === 'borrow' ? int(0, 5) : share, hardSignals: hs, counterparties: [cp(pool, 'Aave v3 Pool')], known: knownList(b.chainId), history: history(b.victim, b.chainId, [pool]),
    reason, source: 'Aave v3 Pool.sol (supply/withdraw/borrow/repay)', imitates: op.includes('max') ? '1_droits_depense_directs' : '6_contrepartie', extraSignals: ['recipient_is_self'] });
});

// 15. Aave gateway (native AVAX/ETH) incl. aToken approval to gateway
sub('aave_gateway', 40, () => {
  const b = base(43114); const p = P[43114]; const gw = p.aaveGateway; const bk = bucket();
  const a = amountFor(bk, { d: 18, usd: 25 }); let request, hs, fr, en, reason;
  const op = pick(['deposit', 'approve_aToken', 'withdraw']);
  if (op === 'deposit') { request = mkTx(b.victim, gw, enc('depositETH(address,address onBehalfOf,uint16 referralCode)', [p.aavePool, b.victim, 0]), a.units, 43114); hs = ['value_and_calldata', 'eth_named_function_on_avalanche'];
    fr = [`Deposer ${a.human} AVAX sur Aave`, `mettre mes avax sur aave`, `aave avax depo`]; en = [`Supply ${a.human} AVAX to Aave`, `put my avax on aave`, `aave avax dep`]; reason = 'depositETH sur le WrappedTokenGateway officiel (le nom "ETH" designe le natif, ici AVAX), onBehalfOf = soi.'; }
  else if (op === 'approve_aToken') { request = mkTx(b.victim, p.aTokens.WAVAX, enc('approve(address spender,uint256 amount)', [gw, chance(0.5) ? MAX : a.units]), 0n, 43114); hs = ['approval_of_receipt_token', 'approval_unlimited'];
    fr = [`Retirer mes AVAX d'Aave (etape d'autorisation)`, `aave me demande une autorisation pour retirer`, `autoriser retrait aave`]; en = [`Withdraw my AVAX from Aave (approval step)`, `aave asks approval to withdraw`, `approve withdraw aave`]; reason = 'Approbation de l\'aToken aAvaWAVAX vers le gateway : etape exigee par withdrawETH. Approuver un aToken a un contrat ressemble a un drain de position, mais c\'est le flux officiel.'; }
  else { request = mkTx(b.victim, gw, enc('withdrawETH(address,uint256 amount,address to)', [p.aavePool, chance(0.3) ? MAX : a.units, b.victim]), 0n, 43114); hs = ['eth_named_function_on_avalanche'];
    fr = [`Retirer ${a.human} AVAX d'Aave`, `recuperer mes avax`, `retrait avax aave`]; en = [`Withdraw ${a.human} AVAX from Aave`, `get my avax back`, `wd avax aave`]; reason = 'withdrawETH vers soi via le gateway officiel.'; }
  const o = origin('aave', 0.05);
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, fr, en), token: 'AVAX', amount: a.human };
  emit({ ...b, ...o, sub: 'aave_gateway_' + op, request, share: shareFor(bk), hardSignals: hs, counterparties: [cp(gw, 'Aave WrappedTokenGatewayV3', 'mid')], known: knownList(43114), history: history(b.victim, 43114, [p.aavePool]),
    reason, source: 'Aave v3 WrappedTokenGatewayV3', imitates: '1_droits_depense_directs', extraSignals: ['recipient_is_self'], extraAddrs: [p.aTokens.WAVAX] });
});

// 16. Benqi
sub('benqi_lending', 60, () => {
  const b = base(43114); const p = P[43114]; const bk = bucket(); let request, hs = [], fr, en, reason, tokSym;
  const op = pick(['mint_avax', 'mint_usdc', 'redeem', 'redeem_underlying', 'enter_markets', 'approve_qi']);
  const aA = amountFor(bk, { d: 18, usd: 25 }); const aU = amountFor(bk, p.tokens.USDC);
  switch (op) {
    case 'mint_avax': request = mkTx(b.victim, p.qiAVAX, enc('mint()', []), aA.units, 43114); hs = ['value_no_args'];
      fr = [`Preter ${aA.human} AVAX sur Benqi`, `mettre des avax sur benqi`, `benqi avax ${aA.human}`]; en = [`Lend ${aA.human} AVAX on Benqi`, `put avax on benqi`, `benqi avax ${aA.human}`]; tokSym = 'AVAX'; reason = 'qiAVAX.mint() payable : depot natif, qiAVAX recu.'; break;
    case 'mint_usdc': request = mkTx(b.victim, p.qiUSDCn, enc('mint(uint256 mintAmount)', [aU.units]), 0n, 43114);
      fr = [`Deposer ${aU.human} USDC sur Benqi`, `benqi pour mes usdc`, `depot usdc benqi`]; en = [`Supply ${aU.human} USDC on Benqi`, `benqi for my usdc`, `usdc benqi dep`]; tokSym = 'USDC'; reason = 'qiUSDCn.mint(amount) : depot USDC sur Benqi.'; break;
    case 'redeem': request = mkTx(b.victim, p.qiAVAX, enc('redeem(uint256 redeemTokens)', [BigInt(int(1e6, 1e12)) * 1000n]), 0n, 43114); hs = ['amount_in_receipt_units'];
      fr = [`Retirer mes AVAX de Benqi`, `sortir de benqi`, `redeem benqi`]; en = [`Withdraw my AVAX from Benqi`, `exit benqi`, `redeem benqi`]; tokSym = 'qiAVAX'; reason = 'redeem(qiTokens) : montant en unites de qiToken (8 decimales), illisible mais legitime.'; break;
    case 'redeem_underlying': request = mkTx(b.victim, p.qiUSDCn, enc('redeemUnderlying(uint256 redeemAmount)', [aU.units]), 0n, 43114);
      fr = [`Recuperer ${aU.human} USDC de Benqi`, `reprendre des usdc sur benqi`, `retrait usdc benqi`]; en = [`Get ${aU.human} USDC back from Benqi`, `take usdc back from benqi`, `usdc wd benqi`]; tokSym = 'USDC'; reason = 'redeemUnderlying vers soi.'; break;
    case 'enter_markets': request = mkTx(b.victim, p.comptroller, enc('enterMarkets(address[] qiTokens)', [[p.qiAVAX, p.qiUSDCn].slice(0, int(1, 2))]), 0n, 43114); hs = ['no_transfer_state_change', 'first_time_contract'];
      fr = [`Activer mes depots Benqi comme garantie`, `benqi me demande d'activer un truc`, `activer collat benqi`]; en = [`Enable my Benqi deposits as collateral`, `benqi asks to enable something`, `enable collat benqi`]; tokSym = undefined; reason = 'Comptroller.enterMarkets : aucun transfert, active le collateral.'; break;
    default: request = mkTx(b.victim, p.tokens.USDC.a, enc('approve(address spender,uint256 amount)', [p.qiUSDCn, MAX]), 0n, 43114); hs = ['approval_unlimited', 'spender_is_market_not_router'];
      fr = [`Autoriser Benqi a utiliser mes USDC`, `benqi veut une autorisation`, `approve benqi usdc`]; en = [`Allow Benqi to use my USDC`, `benqi wants approval`, `approve benqi usdc`]; tokSym = 'USDC'; reason = 'Approbation illimitee de USDC vers le marche qiUSDCn officiel (le spender est un qiToken, pas un routeur).';
  }
  const o = origin('benqi', 0.05);
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, fr, en), token: tokSym, amount: op.startsWith('mint_avax') ? aA.human : op === 'mint_usdc' || op === 'redeem_underlying' ? aU.human : undefined };
  const to = request.params?.[0]?.to;
  emit({ ...b, ...o, sub: 'benqi_' + op, request, share: op.startsWith('redeem') ? 0 : shareFor(bk), hardSignals: hs, counterparties: [cp(to, 'Benqi ' + (to === p.comptroller ? 'Comptroller' : to === p.qiAVAX ? 'qiAVAX' : to === p.qiUSDCn ? 'qiUSDCn' : 'USDC token'))], known: knownList(43114), history: history(b.victim, 43114, [p.qiAVAX]),
    reason, source: 'Benqi Markets (fork Compound : mint/redeem/enterMarkets)', imitates: '6_contrepartie', extraSignals: ['recipient_is_self'], extraAddrs: [p.qiUSDCn] });
});

// 17. sAVAX liquid staking
sub('savax_staking', 50, () => {
  const b = base(43114); const p = P[43114]; const s = p.tokens.sAVAX.a; const bk = bucket(); const a = amountFor(bk, { d: 18, usd: 25 });
  const op = pick(['submit', 'submit', 'request_unlock', 'redeem', 'approve_savax_dex']);
  let request, hs = [], fr, en, reason;
  if (op === 'submit') { request = mkTx(b.victim, s, enc('submit()', []), a.units, 43114); hs = ['value_no_args', 'value_to_token_contract'];
    fr = [`Staker ${a.human} AVAX en sAVAX sur Benqi`, `je veux du rendement sur mes avax`, `stake avax benqi ${a.human}`]; en = [`Stake ${a.human} AVAX for sAVAX on Benqi`, `want yield on my avax`, `stak avax benqi ${a.human}`]; reason = 'sAVAX.submit() payable : AVAX envoyes au contrat du token sAVAX, sAVAX recus (liquid staking).'; }
  else if (op === 'request_unlock') { request = mkTx(b.victim, s, enc('requestUnlock(uint256 shareAmount)', [a.units]), 0n, 43114); hs = ['delayed_withdrawal'];
    fr = [`Destaker ${a.human} sAVAX`, `recuperer mes avax stakes`, `unstake savax`]; en = [`Unstake ${a.human} sAVAX`, `get my staked avax back`, `unstak savax`]; reason = 'requestUnlock : demande de destaking (15 jours de delai), rien ne sort immediatement.'; }
  else if (op === 'redeem') { request = mkTx(b.victim, s, enc('redeem()', []), 0n, 43114); hs = ['no_args_inflow'];
    fr = [`Recuperer mes AVAX apres le delai de destaking`, `retirer mes avax debloques`, `redeem savax`]; en = [`Claim my AVAX after the unstake cooldown`, `withdraw my unlocked avax`, `redeem savax`]; reason = 'redeem() apres cooldown : AVAX recus.'; }
  else { const r = pick([p.joeV1, p.lb21]); request = mkTx(b.victim, s, enc('approve(address spender,uint256 amount)', [r, MAX]), 0n, 43114); hs = ['approval_unlimited'];
    fr = [`Vendre mes sAVAX sur LFJ sans attendre`, `revendre mes savax`, `swap savax avax`]; en = [`Sell my sAVAX on LFJ instead of waiting`, `sell my savax`, `swap savax avax`]; reason = 'Approbation illimitee de sAVAX vers le routeur LFJ pour revendre sans attendre le cooldown.'; }
  const o = origin(op === 'approve_savax_dex' ? 'lfj' : 'benqi', 0.05);
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, fr, en), token: op === 'submit' ? 'AVAX' : 'sAVAX', amount: op === 'redeem' ? undefined : a.human };
  emit({ ...b, ...o, sub: 'savax_' + op, request, share: op === 'submit' ? shareFor(bk) : 0, hardSignals: hs, counterparties: [cp(s, 'Benqi sAVAX')], known: knownList(43114), history: history(b.victim, 43114, [s]),
    reason, source: 'Benqi Liquid Staking sAVAX (StakedAvax.sol)', imitates: '6_contrepartie', extraSignals: ['recipient_is_self'], fromMemory: op !== 'submit' && op !== 'approve_savax_dex', fromMemoryNote: 'selecteurs requestUnlock/redeem de sAVAX de memoire' });
});

// 18. wrap / unwrap
sub('wrap_unwrap', 60, () => {
  const b = base(chainPick()); const p = P[b.chainId]; const w = p.tokens[p.wrapped]; const bk = bucket(); const a = amountFor(bk, w);
  const op = pick(['deposit', 'withdraw', 'deposit_plain_transfer']);
  let request, hs = [], fr, en, reason;
  if (op === 'deposit') { request = mkTx(b.victim, w.a, enc('deposit()', []), a.units, b.chainId); hs = ['value_to_token_contract'];
    fr = [`Convertir ${a.human} ${p.native} en ${p.wrapped}`, `j'ai besoin de ${p.wrapped} pour un site`, `wrap ${a.human}`]; en = [`Wrap ${a.human} ${p.native} into ${p.wrapped}`, `need ${p.wrapped} for some site`, `wrap ${a.human}`]; reason = `${p.wrapped}.deposit() : 1:1, contrat officiel.`; }
  else if (op === 'withdraw') { request = mkTx(b.victim, w.a, enc('withdraw(uint256 wad)', [a.units]), 0n, b.chainId);
    fr = [`Reconvertir ${a.human} ${p.wrapped} en ${p.native}`, `retransformer mes ${p.wrapped} en vrais ${p.native}`, `unwrap ${a.human}`]; en = [`Unwrap ${a.human} ${p.wrapped} to ${p.native}`, `turn my ${p.wrapped} back to ${p.native}`, `unwrap ${a.human}`]; reason = `${p.wrapped}.withdraw(wad) : natif recu 1:1.`; }
  else { request = { method: 'eth_sendTransaction', params: [{ from: b.victim, to: w.a, data: '0x', value: hexv(a.units), chainId: hexv(b.chainId) }] }; hs = ['plain_value_to_contract', 'empty_calldata'];
    fr = [`Wrapper ${a.human} ${p.native} (envoi direct au contrat ${p.wrapped})`, `envoyer mes ${p.native} au contrat ${p.wrapped}`, `wrap direct`]; en = [`Wrap ${a.human} ${p.native} by sending to ${p.wrapped}`, `send ${p.native} to the ${p.wrapped} contract`, `direct wrap`]; reason = `Envoi natif sans calldata au contrat ${p.wrapped} : le fallback appelle deposit(). Ressemble a un envoi a une adresse de contrat, mais c'est un wrap.`; }
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, fr, en), token: op === 'withdraw' ? p.wrapped : p.native, amount: a.human };
  const o = chance(0.6) ? { origin: 'wallet://builtin-wrap', originKind: 'wallet_builtin' } : origin(b.chainId === 1 ? 'uniswap' : 'lfj');
  emit({ ...b, ...o, sub: 'wrap_' + op, request, share: shareFor(bk), hardSignals: hs, counterparties: [cp(w.a, p.wrapped + ' token')], known: knownList(b.chainId), history: history(b.victim, b.chainId, [w.a]),
    reason, source: 'WETH9 / WAVAX', imitates: '7_tokens', extraSignals: ['recipient_is_self'] });
});

// 19. add / remove liquidity
sub('liquidity', 60, () => {
  const b = base(chance(0.2) ? 1 : chance(0.12) ? 43113 : 43114); const p = P[b.chainId];
  const r = b.chainId === 1 ? p.uniV2 : chance(0.5) ? p.joeV1 : p.pangolin; const label = r === p.uniV2 ? 'Uniswap V2 Router' : r === p.joeV1 ? 'Trader Joe JoeRouter02' : 'Pangolin Router';
  const isPango = r === p.pangolin; const nat = b.chainId === 1 ? 'ETH' : 'AVAX';
  const sym = pick(Object.keys(p.tokens).filter(s => s !== p.wrapped)); const tok = p.tokens[sym]; const bk = bucket(); const a = amountFor(bk, tok); const n = amountFor(bk, { d: 18, usd: p.nativeUsd });
  const op = pick(['add_native', 'add_native', 'add_tokens', 'remove_native', 'approve_lp']);
  let request, hs = [], fr, en, reason;
  const fname = (x) => (isPango || r === p.joeV1) ? x.replace('ETH', 'AVAX') : x;
  if (op === 'add_native') { request = mkTx(b.victim, r, enc(fname('addLiquidityETH(address token,uint256 amountTokenDesired,uint256 amountTokenMin,uint256 amountETHMin,address to,uint256 deadline)'), [tok.a, a.units, a.units * 95n / 100n, n.units * 95n / 100n, b.victim, DEADLINE]), n.units, b.chainId); hs = ['value_and_calldata', 'two_assets_out_lp_in'];
    fr = [`Ajouter de la liquidite ${sym}/${nat}`, `mettre mes ${sym} et ${nat} dans une pool pour les frais`, `add liq ${sym} ${nat}`]; en = [`Add ${sym}/${nat} liquidity`, `put my ${sym} and ${nat} in a pool for fees`, `add liq ${sym} ${nat}`]; reason = 'Ajout de liquidite : deux actifs sortent, jetons LP recus par soi.'; }
  else if (op === 'add_tokens') { const s2 = pick(Object.keys(p.tokens).filter(x => x !== sym)); const t2 = p.tokens[s2]; const a2 = amountFor(bk, t2);
    request = mkTx(b.victim, r, enc('addLiquidity(address tokenA,address tokenB,uint256 amountADesired,uint256 amountBDesired,uint256 amountAMin,uint256 amountBMin,address to,uint256 deadline)', [tok.a, t2.a, a.units, a2.units, 0n, 0n, b.victim, DEADLINE]), 0n, b.chainId); hs = ['two_assets_out_lp_in', 'min_amounts_zero'];
    fr = [`Fournir de la liquidite ${sym}/${s2}`, `faire du LP ${sym} ${s2}`, `lp ${sym}/${s2}`]; en = [`Provide ${sym}/${s2} liquidity`, `do LP ${sym} ${s2}`, `lp ${sym}/${s2}`]; reason = 'addLiquidity token/token, mins a 0 (laxiste), LP vers soi.'; }
  else if (op === 'remove_native') { request = mkTx(b.victim, r, enc(fname('removeLiquidityETH(address token,uint256 liquidity,uint256 amountTokenMin,uint256 amountETHMin,address to,uint256 deadline)'), [tok.a, BigInt(int(1e6, 1e12)) * 10n ** 6n, 0n, 0n, b.victim, DEADLINE]), 0n, b.chainId); hs = ['lp_token_burn'];
    fr = [`Retirer ma liquidite ${sym}/${nat}`, `sortir de la pool`, `remove liq`]; en = [`Remove my ${sym}/${nat} liquidity`, `exit the pool`, `remove liq`]; reason = 'Retrait de liquidite vers soi.'; }
  else { const lp = seedAddr('lp-pair'); UNSURE[lp.toLowerCase()] = 'adresse de paire LP derivee de la graine';
    request = mkTx(b.victim, lp, enc('approve(address spender,uint256 amount)', [r, MAX]), 0n, b.chainId); hs = ['approval_unlimited', 'token_is_lp_pair'];
    fr = [`Autoriser le retrait de ma liquidite ${sym}/${nat}`, `le site veut une autorisation sur mes LP`, `approve LP`]; en = [`Approve removing my ${sym}/${nat} liquidity`, `site wants approval on my LP tokens`, `approve LP`]; reason = 'Approbation illimitee du jeton LP vers le routeur officiel, prealable a removeLiquidity.'; b._lp = lp; }
  const o = origin(r === p.uniV2 ? 'uniswap' : isPango ? 'pangolin' : 'lfj', 0.05);
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, fr, en), token: sym, amount: op.startsWith('add') ? a.human : undefined };
  emit({ ...b, ...o, sub: 'liquidity_' + op, request, share: shareFor(bk), hardSignals: hs, counterparties: [cp(r, label)], known: knownList(b.chainId), history: history(b.victim, b.chainId, [r]),
    reason, source: 'UniswapV2Router02 / JoeRouter02 / Pangolin Router', imitates: '8_swaps_et_ponts', extraSignals: ['recipient_is_self'], extraAddrs: b._lp ? [b._lp] : [] });
});

// 20. Avalanche Bridge (Core)
sub('bridge_core', 50, () => {
  const toAvax = chance(0.5); let b, request, hs, fr, en, reason, cps, sym, a, bk = bucket();
  if (toAvax) { b = base(1); const p = P[1]; sym = pick(['USDC', 'WETH', 'DAI', 'USDT']); const t = p.tokens[sym]; a = amountFor(bk, t);
    request = mkTx(b.victim, t.a, enc('transfer(address to,uint256 amount)', [p.avaxBridge, a.units]), 0n, 1); hs = ['transfer_to_eoa_like_bridge_address', 'recipient_not_self'];
    cps = [{ ...cp(p.avaxBridge, 'Avalanche Bridge (Core) - adresse de depot'), isContract: false }];
    fr = [`Envoyer ${a.human} ${sym} d'Ethereum vers Avalanche avec le pont Core`, `passer mes ${sym} sur avalanche`, `bridge ${sym} vers avax`]; en = [`Bridge ${a.human} ${sym} from Ethereum to Avalanche via Core`, `move my ${sym} over to avalanche`, `bridge ${sym} to avax`];
    reason = 'Pont Avalanche (Core) cote Ethereum : un simple transfer vers l\'adresse de depot du pont (gardee par des enclaves SGX). Ressemble exactement a un envoi vers un compte externe inconnu, mais c\'est le mecanisme officiel ; le .e arrive sur la meme adresse cote Avalanche.';
  } else { b = base(43114); const p = P[43114]; sym = pick(['WETH.e', 'BTC.b']); const t = p.tokens[sym]; a = amountFor(bk, t);
    request = mkTx(b.victim, t.a, enc('unwrap(uint256 amount,uint256 chainId)', [a.units, sym === 'BTC.b' ? 0n : 1n]), 0n, 43114); hs = ['burn_on_token_contract', 'nonstandard_selector'];
    cps = [cp(t.a, sym + ' (token du pont)')];
    fr = [`Renvoyer ${a.human} ${sym} vers ${sym === 'BTC.b' ? 'Bitcoin' : 'Ethereum'} via le pont Core`, `rapatrier mes ${sym}`, `unwrap ${sym} bridge`]; en = [`Bridge ${a.human} ${sym} back to ${sym === 'BTC.b' ? 'Bitcoin' : 'Ethereum'} via Core`, `move my ${sym} back`, `unwrap ${sym} bridge`];
    reason = 'Retour par le pont Core : unwrap(amount, chainId) brule le token .e/.b ; les fonds sortent sans entree sur cette chaine (ils arrivent sur l\'autre).';
  }
  const o = origin('core', 0);
  b.intent = { kind: 'send_to_my_account', ...chooseWords(b, fr, en), token: sym, amount: a.human, label: 'mon adresse sur l\'autre chaine' };
  emit({ ...b, ...o, sub: 'bridge_core_' + (toAvax ? 'eth_to_avax' : 'avax_to_eth'), request, share: shareFor(bk), hardSignals: hs, counterparties: cps, known: knownList(b.chainId), history: history(b.victim, b.chainId, []),
    reason, source: 'Avalanche Bridge / Core docs (support.avax.network)', imitates: '8_swaps_et_ponts', extraSignals: ['bridge_address_registry', 'outflow_without_inflow_same_chain'],
    fromMemory: !toAvax, fromMemoryNote: 'signature unwrap(uint256,uint256) des tokens BridgeToken de memoire', warnWhy: bk === 'large' && toAvax ? ['gros montant envoye a une adresse non-contrat : verification legere legitime meme si c\'est le pont'] : [] });
});

// 21. CCTP
sub('bridge_cctp', 50, () => {
  const b = base(chance(0.3) ? 1 : chance(0.2) ? 43113 : 43114); const p = P[b.chainId]; const u = p.tokens.USDC; const bk = bucket(); const a = amountFor(bk, u);
  const dest = pick([[0, 'Ethereum'], [1, 'Avalanche'], [3, 'Arbitrum'], [6, 'Base'], [2, 'OP Mainnet']].filter(d => d[0] !== p.cctpDomain));
  const recipientOwn = chance(0.85); const recipient = recipientOwn ? b.victim : seedAddr('own-other-wallet');
  const burn = enc('depositForBurn(uint256 amount,uint32 destinationDomain,bytes32 mintRecipient,address burnToken)', [a.units, dest[0], pad32(recipient), u.a]);
  const batch = chance(0.4);
  const request = batch ? mkBatch(b.victim, b.chainId, [{ to: u.a, data: enc('approve(address spender,uint256 amount)', [p.cctp, a.units]) }, { to: p.cctp, data: burn }]) : mkTx(b.victim, p.cctp, burn, 0n, b.chainId);
  const hs = ['burn_no_same_chain_inflow', 'recipient_bytes32_encoded', ...(batch ? ['batched_calls'] : []), ...(recipientOwn ? [] : ['recipient_not_self'])];
  const o = origin('cctp', 0);
  const lbl = recipientOwn ? 'ma meme adresse' : 'mon autre wallet';
  b.intent = { kind: 'send_to_my_account', ...chooseWords(b, [`Envoyer ${a.human} USDC vers ${dest[1]} (CCTP)`, `faire passer mes usdc sur ${dest[1]}`, `bridge usdc ${dest[1]}`], [`Bridge ${a.human} USDC to ${dest[1]} with CCTP`, `move my usdc over to ${dest[1]}`, `bridge usdc ${dest[1]}`]), token: 'USDC', amount: a.human, label: lbl, addr: recipient };
  emit({ ...b, ...o, sub: 'bridge_cctp', request, share: shareFor(bk), hardSignals: hs, counterparties: [cp(p.cctp, 'Circle CCTP TokenMessenger')], known: knownList(b.chainId), history: history(b.victim, b.chainId, [p.cctp]), addressBook: recipientOwn ? [] : [{ label: 'mon autre wallet', address: recipient, seenTimes: int(2, 30) }],
    reason: `Circle CCTP depositForBurn : USDC brule ici, re-frappe sur ${dest[1]} pour mintRecipient (adresse en bytes32 = ${recipientOwn ? 'soi' : 'autre wallet de la personne, present dans son carnet'}). Aucune entree sur la chaine source : normal pour un burn-and-mint.`,
    source: 'Circle CCTP v1 TokenMessenger (developers.circle.com)', imitates: '8_swaps_et_ponts', extraSignals: ['bytes32_address_decode', 'bridge_address_registry'], extraAddrs: recipientOwn ? [] : [] });
});

// 22. Stargate v1
sub('bridge_stargate', 40, () => {
  const b = base(chance(0.4) ? 1 : 43114); const p = P[b.chainId];
  const sym = pick(['USDC', 'USDT']); const t = p.tokens[sym]; const bk = bucket(); const a = amountFor(bk, t);
  const dest = pick([[101, 'Ethereum'], [106, 'Avalanche'], [110, 'Arbitrum'], [109, 'Polygon']].filter(d => d[0] !== p.sgChain));
  const fee = BigInt(int(2, 60)) * 10n ** 15n;
  const data = enc('swap(uint16 _dstChainId,uint256 _srcPoolId,uint256 _dstPoolId,address _refundAddress,uint256 _amountLD,uint256 _minAmountLD,tuple(uint256 dstGasForCall,uint256 dstNativeAmount,bytes dstNativeAddr) _lzTxParams,bytes _to,bytes _payload)',
    [dest[0], sym === 'USDC' ? 1n : 2n, sym === 'USDC' ? 1n : 2n, b.victim, a.units, a.units * 995n / 1000n, [0n, 0n, '0x'], b.victim, '0x']);
  const o = origin('stargate', 0.1);
  b.intent = { kind: 'send_to_my_account', ...chooseWords(b, [`Transferer ${a.human} ${sym} vers ${dest[1]} avec Stargate`, `passer mes ${sym} sur ${dest[1]}`, `stargate ${sym} ${dest[1]}`], [`Send ${a.human} ${sym} to ${dest[1]} with Stargate`, `move my ${sym} to ${dest[1]}`, `stargate ${sym} ${dest[1]}`]), token: sym, amount: a.human, label: 'ma meme adresse' };
  emit({ ...b, ...o, sub: 'bridge_stargate', request: mkTx(b.victim, p.stargate, data, fee, b.chainId), share: shareFor(bk), hardSignals: ['value_fee_plus_token', 'recipient_bytes_encoded', 'legacy_v1_router', 'burn_no_same_chain_inflow'], counterparties: [cp(p.stargate, 'Stargate Router v1 (LayerZero)')], known: knownList(b.chainId), history: history(b.victim, b.chainId, [p.stargate]),
    reason: `Stargate v1 Router.swap : ${sym} vers ${dest[1]}, _to = soi (bytes), refund = soi ; la valeur native = frais LayerZero. Routeur v1 encore actif mais legacy (v2 = pools OFT).`,
    warnWhy: ['routeur Stargate v1 legacy, moins utilise depuis v2 : avertissement leger tolere'],
    source: 'Stargate v1 Router (stargateprotocol.gitbook.io), LayerZero chain ids', imitates: '8_swaps_et_ponts', extraSignals: ['bytes_address_decode', 'bridge_address_registry'],
    fromMemory: true, fromMemoryNote: 'ABI Router.swap Stargate v1 et chain ids LayerZero v1 de memoire' });
});

// 23. Revocations
sub('revoke', 60, () => {
  const b = base(chainPick()); const p = P[b.chainId];
  const sym = pick(Object.keys(p.tokens)); const tok = p.tokens[sym];
  const op = pick(['approve_zero', 'approve_zero', 'approve_zero_unknown_spender', 'permit2_zero', 'permit2_lockdown', 'nft_revoke']);
  let request, hs = ['zero_approval'], cps, reason, extra = [];
  const known = pick([p.joeV1, p.pangolin, p.aavePool, p.ur, p.uniV2].filter(Boolean)) || PERMIT2;
  if (op === 'approve_zero') { request = mkTx(b.victim, tok.a, enc('approve(address spender,uint256 amount)', [known, 0n]), 0n, b.chainId); cps = [cp(known, 'routeur officiel')]; reason = 'approve(spender, 0) : revocation d\'une approbation vers un routeur officiel. Le selecteur est celui d\'une approbation, mais le montant 0 retire des droits.'; }
  else if (op === 'approve_zero_unknown_spender') { const old = seedAddr('old-dapp'); UNSURE[old.toLowerCase()] = 'ancien spender derive de la graine'; request = mkTx(b.victim, tok.a, enc('approve(address spender,uint256 amount)', [old, 0n]), 0n, b.chainId); cps = [{ ...cp(old, 'ancienne dapp abandonnee', 'mid', false) }]; hs.push('spender_unknown_but_revoking'); reason = 'Revocation (approve 0) vers un spender inconnu/abandonne : retirer un droit a un contrat douteux est exactement le bon geste.'; extra = [old]; }
  else if (op === 'permit2_zero') { request = mkTx(b.victim, PERMIT2, enc('approve(address token,address spender,uint160 amount,uint48 expiration)', [tok.a, p.ur || known, 0n, 0n]), 0n, b.chainId); cps = [cp(PERMIT2, 'Uniswap Permit2')]; hs.push('permit2_internal_approval'); reason = 'Permit2.approve(token, spender, 0, 0) : revocation d\'une allocation interne Permit2.'; }
  else if (op === 'permit2_lockdown') { const pairs = [[tok.a, p.ur || known]]; if (chance(0.5)) pairs.push([pick(Object.values(p.tokens)).a, INCH5]);
    request = mkTx(b.victim, PERMIT2, enc('lockdown(tuple(address token,address spender)[] approvals)', [pairs]), 0n, b.chainId); cps = [cp(PERMIT2, 'Uniswap Permit2')]; hs.push('permit2_lockdown'); reason = 'Permit2.lockdown : revoque en masse des allocations Permit2 (bouton "revoke" de revoke.cash).'; }
  else { const nft = seedAddr('nft-collection'); const op2 = seedAddr('nft-market'); UNSURE[nft.toLowerCase()] = 'collection NFT derivee de la graine'; UNSURE[op2.toLowerCase()] = 'operateur marketplace derive de la graine';
    request = mkTx(b.victim, nft, enc('setApprovalForAll(address operator,bool approved)', [op2, false]), 0n, b.chainId); cps = [cp(op2, 'marketplace NFT')]; hs.push('setApprovalForAll_false'); reason = 'setApprovalForAll(operator, false) : revocation, meme selecteur que le drain NFT classique mais booleen a false.'; extra = [nft, op2]; }
  const o = origin('revoke', 0);
  b.intent = { kind: 'connect_or_accept_offer', ...chooseWords(b, [`Revoquer les autorisations sur mes ${sym}`, `nettoyer mes autorisations, on m'a dit que c'etait plus sur`, `revoke ${sym}`], [`Revoke approvals on my ${sym}`, `clean up my approvals, heard it's safer`, `revok ${sym}`]), token: sym };
  emit({ ...b, ...o, sub: 'revoke_' + op, request, share: 0, hardSignals: hs, counterparties: cps, known: knownList(b.chainId), history: history(b.victim, b.chainId, []),
    reason, source: 'revoke.cash ; Permit2 lockdown ; ERC-20/721 approve 0', imitates: '1_droits_depense_directs', extraSignals: ['approval_amount_zero_is_revocation'], extraAddrs: extra,
    fromMemory: op === 'permit2_lockdown', fromMemoryNote: 'struct TokenSpenderPair de Permit2.lockdown de memoire' });
});

// 24. increaseAllowance
sub('increase_allowance', 40, () => {
  const b = base(chainPick()); const p = P[b.chainId]; const usdc = p.tokens.USDC; const bk = bucket(); const a = amountFor(bk, usdc);
  const sp = pick([[p.aavePool, 'Aave v3 Pool', 'aave'], [p.joeV1, 'Trader Joe JoeRouter02', 'lfj'], [p.cctp, 'Circle CCTP TokenMessenger', 'cctp'], [p.pangolin, 'Pangolin Router', 'pangolin']].filter(x => x[0]));
  const big = chance(0.25);
  const data = enc('increaseAllowance(address spender,uint256 increment)', [sp[0], big ? MAX - 1n : a.units]);
  const o = origin(sp[2], 0.1);
  b.intent = { kind: 'buy_or_swap', ...chooseWords(b, [`Augmenter l'autorisation USDC pour ${sp[1]} de ${a.human}`, `il faut rajouter un peu d'autorisation pour continuer`, `increase allowance usdc`], [`Increase USDC allowance for ${sp[1]} by ${a.human}`, `need to add a bit more allowance to continue`, `increase allowance usdc`]), token: 'USDC', amount: big ? undefined : a.human };
  emit({ ...b, ...o, sub: 'increase_allowance', request: mkTx(b.victim, usdc.a, data, 0n, b.chainId), share: 0, hardSignals: ['increase_allowance', ...(big ? ['approval_unlimited'] : [])], counterparties: [cp(sp[0], sp[1])], known: knownList(b.chainId), history: history(b.victim, b.chainId, [sp[0]]),
    reason: `USDC (FiatTokenV2) increaseAllowance vers ${sp[1]} officiel : variante moins frequente d'approve, utilisee par certains front-ends pour eviter la course approve.`,
    source: 'Circle FiatTokenV2 increaseAllowance ; OpenZeppelin ERC20 (<=4.x)', imitates: '1_droits_depense_directs', extraSignals: ['spender_is_known_router'] });
});

// 25. Governance delegation
sub('gov_delegate', 50, () => {
  const isEth = chance(0.4); const b = base(isEth ? 1 : 43114); const p = P[b.chainId];
  const sym = isEth ? pick(['UNI', 'AAVE']) : 'QI'; const tok = p.tokens[sym];
  const toSelf = chance(0.5); const delegatee = toSelf ? b.victim : seedAddr('gov-delegate');
  if (!toSelf) UNSURE[delegatee.toLowerCase()] = 'delegue de gouvernance derive de la graine (personne publique fictive)';
  const bySig = isEth && chance(0.3);
  let request, hs = ['governance_delegation'];
  if (bySig) {
    const name = sym === 'UNI' ? 'Uniswap' : 'Aave token V3';
    const td = sym === 'UNI'
      ? { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], Delegation: [{ name: 'delegatee', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'expiry', type: 'uint256' }] }, domain: { name, chainId: 1, verifyingContract: tok.a }, primaryType: 'Delegation', message: { delegatee, nonce: String(int(0, 5)), expiry: String(DEADLINE + 86400) } }
      : { types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], Delegate: [{ name: 'delegator', type: 'address' }, { name: 'delegatee', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] }, domain: { name, version: '2', chainId: 1, verifyingContract: tok.a }, primaryType: 'Delegate', message: { delegator: b.victim, delegatee, nonce: String(int(0, 5)), deadline: String(DEADLINE + 86400) } };
    request = mkTyped(b.victim, td); hs.push('offchain_signature', 'delegate_by_sig');
  } else request = mkTx(b.victim, tok.a, enc('delegate(address delegatee)', [delegatee]), 0n, b.chainId);
  if (!toSelf) hs.push('delegate_to_third_party');
  const o = origin('gov', 0);
  b.intent = { kind: 'connect_or_accept_offer', ...chooseWords(b, [`Deleguer mes votes ${sym} ${toSelf ? 'a moi-meme pour pouvoir voter' : 'a un delegue que je suis'}`, `activer mes droits de vote ${sym}`, `delegate ${sym}`], [`Delegate my ${sym} votes ${toSelf ? 'to myself so I can vote' : 'to a delegate I follow'}`, `activate my ${sym} voting power`, `delegat ${sym}`]), token: sym, label: toSelf ? 'moi' : 'delegue', addr: toSelf ? undefined : delegatee };
  emit({ ...b, ...o, sub: 'gov_delegate', request, share: 0, hardSignals: hs, counterparties: [cp(tok.a, sym + ' governance token')], known: knownList(b.chainId), history: history(b.victim, b.chainId, []), addressBook: toSelf ? [] : [{ label: 'delegue suivi', address: delegatee, seenTimes: 0 }],
    reason: `Delegation de vote ${sym} ${toSelf ? 'a soi-meme' : 'a un tiers'} : ne transfere aucun token ni droit de depense, seulement le pouvoir de vote (revocable).${bySig ? ' Version signature hors chaine (delegateBySig).' : ''}`,
    source: 'Compound GovernorAlpha/Comp delegate ; UNI/AAVE delegateBySig ; Tally', imitates: '3_controle_et_roles', extraSignals: ['delegation_is_votes_not_funds'],
    fromMemory: bySig || sym === 'QI', fromMemoryNote: 'domaine EIP-712 / typehash de delegation et delegate() sur QI de memoire', extraAddrs: toSelf ? [] : [delegatee] });
});

// ---------- run ----------
for (const s of subs) {
  CUR = s.name;
  let made = 0, tries = 0;
  while (made < s.n && tries < s.n * 5) { tries++; const before = cases.length; s.fn(); if (cases.length > before) made++; }
}
writeFileSync(process.env.OUT || join(HERE, 'cases.jsonl'), cases.map(c => JSON.stringify(c)).join('\n') + '\n');
const bySub = {}; for (const c of cases) { const k = GROUP.get(c.id); bySub[k] = (bySub[k] || 0) + 1; }
const st = { total: cases.length, hard: cases.filter(c => c.hard).length, warn: cases.filter(c => c.expected_severity === 'warn').length, DEV: cases.filter(c => c.split === 'DEV').length, TEST: cases.filter(c => c.split === 'TEST').length, approx: cases.filter(c => c.approximation).length, byChain: {} };
for (const c of cases) st.byChain[c.context.chainId] = (st.byChain[c.context.chainId] || 0) + 1;
console.log(JSON.stringify({ ...st, bySub }, null, 1));

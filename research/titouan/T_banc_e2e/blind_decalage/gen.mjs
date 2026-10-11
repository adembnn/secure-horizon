// Generateur AVEUGLE de cas "decalage" (graine fixe). Node pur, zero dependance.
// Usage : node gen.mjs   -> CASES.jsonl + SHA256.txt
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED = 20261012;

// ---------- keccak256 ----------
const M64 = (1n << 64n) - 1n;
const rotl = (v, n) => (n === 0n ? v : ((v << n) | (v >> (64n - n))) & M64);
const ROT = Array(25).fill(0n);
{ let x = 1, y = 0; for (let t = 0; t < 24; t++) { ROT[x + 5 * y] = BigInt((((t + 1) * (t + 2)) / 2) % 64); [x, y] = [y, (2 * x + 3 * y) % 5]; } }
const RC = [];
{
  const rc = (t) => { if (t % 255 === 0) return 1; let R = 1; for (let i = 1; i <= t % 255; i++) { R <<= 1; if (R & 0x100) R ^= 0x171; } return R & 1; };
  for (let ir = 0; ir < 24; ir++) { let c = 0n; for (let j = 0; j < 7; j++) if (rc(j + 7 * ir)) c |= 1n << BigInt((1 << j) - 1); RC.push(c); }
}
function keccakF(s) {
  for (let r = 0; r < 24; r++) {
    const C = [0, 1, 2, 3, 4].map((x) => s[x] ^ s[x + 5] ^ s[x + 10] ^ s[x + 15] ^ s[x + 20]);
    const D = [0, 1, 2, 3, 4].map((x) => C[(x + 4) % 5] ^ rotl(C[(x + 1) % 5], 1n));
    for (let i = 0; i < 25; i++) s[i] ^= D[i % 5];
    const B = Array(25).fill(0n);
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) B[y + 5 * ((2 * x + 3 * y) % 5)] = rotl(s[x + 5 * y], ROT[x + 5 * y]);
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) s[x + 5 * y] = B[x + 5 * y] ^ ((~B[((x + 1) % 5) + 5 * y] & M64) & B[((x + 2) % 5) + 5 * y]);
    s[0] ^= RC[r];
  }
  return s;
}
function keccak256(buf) {
  const rate = 136;
  const p = new Uint8Array(Math.ceil((buf.length + 1) / rate) * rate);
  p.set(buf); p[buf.length] ^= 0x01; p[p.length - 1] ^= 0x80;
  let s = Array(25).fill(0n);
  for (let off = 0; off < p.length; off += rate) {
    for (let i = 0; i < rate / 8; i++) { let v = 0n; for (let b = 7; b >= 0; b--) v = (v << 8n) | BigInt(p[off + i * 8 + b]); s[i] ^= v; }
    s = keccakF(s);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i++) { let v = s[i]; for (let b = 0; b < 8; b++) { out[i * 8 + b] = Number(v & 0xffn); v >>= 8n; } }
  return out;
}
const hexOf = (u) => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('');
const utf8 = (s) => new TextEncoder().encode(s);
const sel = (sig) => hexOf(keccak256(utf8(sig))).slice(0, 8);
// auto-tests
if (hexOf(keccak256(new Uint8Array())) !== 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470') throw new Error('keccak vide');
if (sel('approve(address,uint256)') !== '095ea7b3' || sel('transfer(address,uint256)') !== 'a9059cbb' || sel('setApprovalForAll(address,bool)') !== 'a22cb465') throw new Error('selecteurs');

// ---------- ABI ----------
const splitTop = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } if (cur) out.push(cur); return out; };
const isArr = (t) => t.endsWith('[]');
const isTup = (t) => t.startsWith('(') && t.endsWith(')');
const comps = (t) => splitTop(t.slice(1, -1));
function isDyn(t) { if (t === 'bytes' || t === 'string' || isArr(t)) return true; if (isTup(t)) return comps(t).some(isDyn); return false; }
const w32 = (n) => { let v = BigInt(n); if (v < 0n) v = (1n << 256n) + v; return v.toString(16).padStart(64, '0'); };
function encTuple(types, vals) {
  const parts = types.map((t, i) => enc(t, vals[i]));
  const headLen = types.reduce((a, t, i) => a + (isDyn(t) ? 32 : parts[i].length / 2), 0);
  let heads = '', tails = '', off = headLen;
  types.forEach((t, i) => { if (isDyn(t)) { heads += w32(off); tails += parts[i]; off += parts[i].length / 2; } else heads += parts[i]; });
  return heads + tails;
}
function enc(t, v) {
  if (isArr(t)) { const it = t.slice(0, -2); return w32(v.length) + encTuple(v.map(() => it), v); }
  if (isTup(t)) return encTuple(comps(t), v);
  if (t === 'address') return v.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  if (t === 'bool') return w32(v ? 1 : 0);
  if (t.startsWith('uint') || t.startsWith('int')) return w32(v);
  if (/^bytes\d+$/.test(t)) return v.replace(/^0x/, '').padEnd(64, '0');
  if (t === 'bytes' || t === 'string') { const h = t === 'string' ? hexOf(utf8(v)) : v.replace(/^0x/, ''); return w32(h.length / 2) + h.padEnd(Math.ceil(h.length / 64) * 64, '0'); }
  throw new Error('type ' + t);
}
function call(sig, vals) { const m = sig.match(/^\w+\((.*)\)$/); const types = m[1] === '' ? [] : splitTop(m[1]); return '0x' + sel(sig) + encTuple(types, vals); }

// ---------- PRNG ----------
function h32(str) { const d = createHash('sha256').update(str).digest(); return d.readUInt32BE(0); }
function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const mk = (...k) => mulberry(h32([SEED, ...k].join('|')));
const pick = (r, a) => a[Math.floor(r() * a.length)];
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const addr = (r) => '0x' + Array.from({ length: 20 }, () => int(r, 0, 255).toString(16).padStart(2, '0')).join('');
const b32 = (r) => '0x' + Array.from({ length: 32 }, () => int(r, 0, 255).toString(16).padStart(2, '0')).join('');
const hx = (n) => '0x' + BigInt(n).toString(16);

// ---------- monde ----------
const MAX256 = (1n << 256n) - 1n;
const MAX160 = (1n << 160n) - 1n;
const MAX48 = (1n << 48n) - 1n;
const ZERO = '0x0000000000000000000000000000000000000000';
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const SEAPORT = '0x0000000000000068F116a894984e2DB1123eB395';
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';
const CONDUIT_KEY = '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000';
const T0 = 1760000000; // horodatage fixe
const DEADLINE = T0 + 1800;
const T = (symbol, address, decimals) => ({ symbol, address, decimals, canonical: true });
const TOKENS = {
  1: { USDC: T('USDC', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6), USDT: T('USDT', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6), DAI: T('DAI', '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18), WN: T('WETH', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18) },
  43114: { USDC: T('USDC', '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 6), USDT: T('USDT', '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', 6), DAI: T('DAI.e', '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', 18), WN: T('WAVAX', '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', 18) },
  42161: { USDC: T('USDC', '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 6), USDT: T('USDT', '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 6), DAI: T('DAI', '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', 18), WN: T('WETH', '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', 18) },
};
{ const r = mk('fuji'); TOKENS[43113] = { USDC: T('USDC', addr(r), 6), USDT: T('USDT', addr(r), 6), DAI: T('DAI', addr(r), 18), WN: T('WAVAX', addr(r), 18) }; }
const NATIVE = { 1: 'ETH', 43114: 'AVAX', 43113: 'AVAX', 42161: 'ETH' };
const CHAINS = [1, 43114, 43113, 42161];
const CHAIN_NAME = { 1: ['Ethereum', 'Ethereum'], 43114: ['Avalanche', 'Avalanche'], 43113: ['Avalanche Fuji', 'Avalanche Fuji'], 42161: ['Arbitrum', 'Arbitrum'] };
const PRICE = { USDC: 1, USDT: 1, DAI: 1, 'DAI.e': 1, WETH: 3200, WAVAX: 28 };
const NAMES = ['Paul', 'Maman', 'Julie', 'Karim', 'Sophie', 'Marc', 'Inès', 'Lucas', 'Chloé', 'Omar', 'Anna', 'Théo'];
const SITES = ['swap.fictif-dex.example', 'app.exemple-swap.example', 'trade.demo-finance.example', 'dex.faux-nom.example', 'app.protocole-test.example', 'bridge.demo-chain.example'];
const AIR_SITES = ['claim.fictif-token.example', 'airdrop.demo-protocol.example', 'rewards.exemple-dao.example'];
const NFT_SITES = ['market.fictif-nft.example', 'nft.demo-market.example', 'art.exemple-gallery.example'];
const AMT_S = ['25', '40', '75', '100', '120.5', '250', '480', '1000', '1500', '2500', '5000', '12.75', '333.33', '8200', '60', '900'];
const AMT_N = ['0.003', '0.05', '0.1', '0.25', '0.5', '1.2', '2', '7.5', '0.75', '3.3', '0.02'];
const toRaw = (s, dec) => { const [i, f = ''] = s.split('.'); return BigInt(i + f.padEnd(dec, '0').slice(0, dec)); };
const scale = (raw, num, den = 1n) => (raw * BigInt(num)) / BigInt(den);
const dec = (b) => b.toString();

function world(r, ra, chain, kind) {
  const Tk = TOKENS[chain];
  const victim = addr(r), router = addr(r), market = addr(r), distributor = addr(r), nft = addr(r);
  const contacts = Array.from({ length: 3 }, () => ({ label: pick(r, NAMES), address: addr(r), kind: 'eoa' }));
  if (contacts[1].label === contacts[0].label) contacts[1].label = 'Alex';
  if (contacts[2].label === contacts[0].label || contacts[2].label === contacts[1].label) contacts[2].label = 'Robin';
  const site = pick(r, kind === 'air' ? AIR_SITES : kind === 'nft' ? NFT_SITES : SITES);
  const attacker = addr(ra), attacker2 = addr(ra);
  const lang = r() < 0.65 ? 'fr' : 'en';
  const facts = {
    [router]: { is_contract: true, age_blocks: int(r, 900000, 9000000), seen_by_user: true },
    [market]: { is_contract: true, age_blocks: int(r, 900000, 9000000), seen_by_user: true },
    [distributor]: { is_contract: true, age_blocks: int(r, 5000, 400000), seen_by_user: false },
    [attacker]: { is_contract: ra() < 0.5, age_blocks: int(ra, 10, 3000), seen_by_user: false },
    [attacker2]: { is_contract: ra() < 0.5, age_blocks: int(ra, 10, 3000), seen_by_user: false },
  };
  for (const c of contacts) facts[c.address] = { is_contract: false, age_blocks: int(r, 100000, 8000000), seen_by_user: true };
  return { chain, Tk, victim, router, market, distributor, nft, contacts, site, attacker, attacker2, lang, native: NATIVE[chain], facts, balance: pick(r, ['0.8', '1.4', '3.2', '7.1', '12.6', '25']) };
}
function ctxOf(w, extra = {}) {
  return {
    chainId: w.chain, origin: w.site, claimed_site: w.site, victim: w.victim,
    address_book: w.contacts,
    known_protocols: [
      { label: 'Routeur swap (connu)', address: w.router, provenance: 'S' },
      { label: 'Permit2 (canonique)', address: PERMIT2, provenance: 'memoire' },
      { label: 'Seaport 1.6', address: SEAPORT, provenance: 'memoire' },
      { label: 'Multicall3', address: MULTICALL3, provenance: 'memoire' },
      { label: 'Place de marche NFT (connue)', address: w.market, provenance: 'S' },
      { label: "Distributeur d'airdrop (annonce par le site)", address: w.distributor, provenance: 'S' },
    ],
    token_registry: Object.values(w.Tk), history: [], counterparty_facts: w.facts, native_balance_eth: w.balance, ...extra,
  };
}
const intentOf = (w, kind, fr, en, extra = {}) => ({ kind, freeText: w.lang === 'fr' ? fr : en, ...extra, declaredAt: T0 * 1000, lang: w.lang });
const tx = (w, to, data, value = '0x0', chain = w.chain) => ({ method: 'eth_sendTransaction', params: [{ from: w.victim, to, value, data, chainId: hx(chain) }] });
const approveData = (sp, v) => call('approve(address,uint256)', [sp, v]);
const transferData = (to, v) => call('transfer(address,uint256)', [to, v]);
const stableOf = (r, w) => w.Tk[pick(r, ['USDC', 'USDT', 'DAI'])];
const humanOf = (r) => pick(r, AMT_S);
function outMin(a, tin, tout) { const n = Number(a) * PRICE[tin.symbol] / PRICE[tout.symbol] * 0.98; const d = Math.min(tout.decimals, 9); return BigInt(Math.floor(n * 10 ** d)) * 10n ** BigInt(tout.decimals - d); }
const swapV2 = (amountIn, min, path, to) => call('swapExactTokensForTokens(uint256,uint256,address[],address,uint256)', [amountIn, min, path, to, DEADLINE]);
const swapV3 = (tin, tout, recipient, amountIn, min) => call('exactInputSingle((address,address,uint24,address,uint256,uint256,uint160))', [[tin, tout, 3000, recipient, amountIn, min, 0]]);

// typed data
function typedData(primary, types, domain, message) {
  const d = [];
  if ('name' in domain) d.push({ name: 'name', type: 'string' });
  if ('version' in domain) d.push({ name: 'version', type: 'string' });
  if ('chainId' in domain) d.push({ name: 'chainId', type: 'uint256' });
  if ('verifyingContract' in domain) d.push({ name: 'verifyingContract', type: 'address' });
  return JSON.stringify({ types: { EIP712Domain: d, ...types }, primaryType: primary, domain, message });
}
const signTD = (w, td) => ({ method: 'eth_signTypedData_v4', params: [w.victim, td] });
const PERMIT_T = { Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] };
const PD = [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint160' }, { name: 'expiration', type: 'uint48' }, { name: 'nonce', type: 'uint48' }];
const P2_T = { PermitSingle: [{ name: 'details', type: 'PermitDetails' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: PD };
const P2B_T = { PermitBatch: [{ name: 'details', type: 'PermitDetails[]' }, { name: 'spender', type: 'address' }, { name: 'sigDeadline', type: 'uint256' }], PermitDetails: PD };
const P2ST_T = { PermitTransferFrom: [{ name: 'permitted', type: 'TokenPermissions' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }], TokenPermissions: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }] };
const LOGIN_T = { Login: [{ name: 'site', type: 'string' }, { name: 'wallet', type: 'address' }, { name: 'nonce', type: 'string' }, { name: 'issuedAt', type: 'uint256' }] };
const DAI_T = { Permit: [{ name: 'holder', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'nonce', type: 'uint256' }, { name: 'expiry', type: 'uint256' }, { name: 'allowed', type: 'bool' }] };
const tokName = (t) => ({ USDC: 'USD Coin', USDT: 'Tether USD', DAI: 'Dai Stablecoin', 'DAI.e': 'Dai Stablecoin', WETH: 'Wrapped Ether', WAVAX: 'Wrapped AVAX' }[t.symbol]);
const permit2Dom = (chain, vc = PERMIT2) => ({ name: 'Permit2', chainId: chain, verifyingContract: vc });
const hexMsg = (s) => '0x' + hexOf(utf8(s));
const siwe = (w, nonce, uri, chain) => `${uri} souhaite que vous vous connectiez avec votre compte Ethereum:\n${w.victim}\n\nConnexion au site, aucune transaction.\n\nURI: https://${uri}\nVersion: 1\nChain ID: ${chain}\nNonce: ${nonce}\nIssued At: 2025-10-09T08:53:20.000Z`;
const siweEn = (w, nonce, uri, chain) => `${uri} wants you to sign in with your Ethereum account:\n${w.victim}\n\nSign in to the site, no transaction.\n\nURI: https://${uri}\nVersion: 1\nChain ID: ${chain}\nNonce: ${nonce}\nIssued At: 2025-10-09T08:53:20.000Z`;
const siweOf = (w, nonce, uri = w.site, chain = w.chain) => (w.lang === 'fr' ? siwe(w, nonce, uri, chain) : siweEn(w, nonce, uri, chain));
const nonceOf = (r) => Array.from({ length: 12 }, () => pick(r, 'abcdefghijklmnopqrstuvwxyz0123456789'.split(''))).join('');
const pSign = (w, text) => ({ method: 'personal_sign', params: [hexMsg(text), w.victim] });
const loginTD = (w, n, site = w.site, domain = { name: 'Connexion', version: '1', chainId: w.chain }) => typedData('Login', LOGIN_T, domain, { site, wallet: w.victim, nonce: n, issuedAt: String(T0) });

// Seaport
const SEAPORT_T = {
  OrderComponents: [{ name: 'offerer', type: 'address' }, { name: 'zone', type: 'address' }, { name: 'offer', type: 'OfferItem[]' }, { name: 'consideration', type: 'ConsiderationItem[]' }, { name: 'orderType', type: 'uint8' }, { name: 'startTime', type: 'uint256' }, { name: 'endTime', type: 'uint256' }, { name: 'zoneHash', type: 'bytes32' }, { name: 'salt', type: 'uint256' }, { name: 'conduitKey', type: 'bytes32' }, { name: 'counter', type: 'uint256' }],
  OfferItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }],
  ConsiderationItem: [{ name: 'itemType', type: 'uint8' }, { name: 'token', type: 'address' }, { name: 'identifierOrCriteria', type: 'uint256' }, { name: 'startAmount', type: 'uint256' }, { name: 'endAmount', type: 'uint256' }, { name: 'recipient', type: 'address' }],
};
const oItem = (type, token, id, amt) => ({ itemType: type, token, identifierOrCriteria: String(id), startAmount: dec(amt), endAmount: dec(amt) });
const cItem = (type, token, id, amt, rec) => ({ ...oItem(type, token, id, amt), recipient: rec });
function seaportOrder(w, r, offer, consideration) {
  const msg = { offerer: w.victim, zone: ZERO, offer, consideration, orderType: 0, startTime: String(T0), endTime: String(T0 + 7 * 86400), zoneHash: '0x' + '00'.repeat(32), salt: dec(BigInt(b32(r))), conduitKey: CONDUIT_KEY, counter: '0' };
  return signTD(w, typedData('OrderComponents', SEAPORT_T, { name: 'Seaport', version: '1.6', chainId: w.chain, verifyingContract: SEAPORT }, msg));
}
const unkTok = (a, rm) => ({ token_info: { [a]: { symbol: 'unknown', decimals: 18, canonical: false, age_blocks: int(rm, 20, 2000) } } });

// ---------- familles : chaque variante renvoie {sub, request, intent, ctx?, whyM, whyB} ----------
// Convention : tout ce qui est partage entre jumeaux est tire de r AVANT toute branche sur mal. rm sert aux tirages propres a l'attaque.
const F = {};

// F1 : droit illimite ou plus large que le montant dit
F.swap_droit_illimite = { code: 'SW', nM: 19, nB: 13, chains: [1, 43114, 43113, 42161, 1, 42161], kind: 'dex', variants: [
  function approve_max_routeur({ r, rm, mal, w }) { const tin = stableOf(r, w), tout = w.Tk.WN, a = humanOf(r); const raw = toRaw(a, tin.decimals);
    return { sub: 'approve_illimite_routeur', request: tx(w, tin.address, approveData(w.router, mal ? MAX256 : raw)), intent: intentOf(w, 'buy_or_swap', `Je veux échanger ${a} ${tin.symbol} contre du ${tout.symbol}`, `I want to swap ${a} ${tin.symbol} for ${tout.symbol}`, { token: tin.symbol, amount: a, toToken: tout.symbol }),
      whyM: `approve du routeur connu sur ${tin.symbol} avec le montant maximal alors que l'utilisateur annonce ${a}.`, whyB: `approve du routeur connu pour exactement ${a} ${tin.symbol}, conforme.` }; },
  function approve_multiple({ r, rm, mal, w }) { const tin = stableOf(r, w), tout = w.Tk.WN, a = humanOf(r); const raw = toRaw(a, tin.decimals); const k = pick(rm, [5, 10, 50, 100, 1000]);
    return { sub: 'approve_multiple_du_montant', request: tx(w, tin.address, approveData(w.router, mal ? raw * BigInt(k) : raw)), intent: intentOf(w, 'buy_or_swap', `Échanger ${a} ${tin.symbol} en ${tout.symbol}`, `Swap ${a} ${tin.symbol} to ${tout.symbol}`, { token: tin.symbol, amount: a, toToken: tout.symbol }),
      whyM: `approve ${k} fois plus large que les ${a} ${tin.symbol} dits.`, whyB: `approve egal au montant dit (${a} ${tin.symbol}).` }; },
  function approve_spender_inconnu({ r, rm, mal, w }) { const tin = stableOf(r, w), a = humanOf(r); const raw = toRaw(a, tin.decimals); const big = rm() < 0.5;
    return { sub: 'approve_spender_inconnu', request: tx(w, tin.address, approveData(mal ? w.attacker : w.router, mal && big ? MAX256 : raw)), intent: intentOf(w, 'buy_or_swap', `J'autorise l'échange de ${a} ${tin.symbol}`, `Approve the swap of ${a} ${tin.symbol}`, { token: tin.symbol, amount: a }),
      whyM: `le droit est donne a un contrat inconnu qui n'est pas le routeur annonce (${big ? 'montant maximal' : 'montant exact'}).`, whyB: 'le droit est donne au routeur connu pour le montant exact.' }; },
  function increase_allowance({ r, rm, mal, w }) { const tin = stableOf(r, w), a = humanOf(r); const raw = toRaw(a, tin.decimals);
    return { sub: 'increaseAllowance_illimite', request: tx(w, tin.address, call('increaseAllowance(address,uint256)', [w.router, mal ? MAX256 - 1n : raw])), intent: intentOf(w, 'buy_or_swap', `Je prépare un échange de ${a} ${tin.symbol}`, `Preparing a swap of ${a} ${tin.symbol}`, { token: tin.symbol, amount: a }),
      whyM: 'increaseAllowance quasi maximal au lieu du montant dit.', whyB: 'increaseAllowance pour le montant dit.' }; },
  function permit_2612({ r, rm, mal, w }) { const tin = stableOf(r, w), a = humanOf(r); const raw = toRaw(a, tin.decimals); const sp = mal && rm() < 0.4 ? w.attacker : w.router; const nn = int(r, 0, 4);
    const td = typedData('Permit', PERMIT_T, { name: tokName(tin), version: '2', chainId: w.chain, verifyingContract: tin.address }, { owner: w.victim, spender: sp, value: dec(mal ? MAX256 : raw), nonce: String(nn), deadline: String(mal ? 4102444800 : DEADLINE) });
    return { sub: 'permit_2612_illimite', request: signTD(w, td), intent: intentOf(w, 'buy_or_swap', `Échanger ${a} ${tin.symbol} sans payer de frais d'approbation`, `Swap ${a} ${tin.symbol} with gasless approval`, { token: tin.symbol, amount: a }),
      whyM: 'signature EIP-2612 pour la valeur maximale et une echeance en 2100.', whyB: `signature EIP-2612 pour ${a} ${tin.symbol}, echeance de 30 minutes.` }; },
  function permit2_single({ r, rm, mal, w }) { const tin = stableOf(r, w), a = humanOf(r); const raw = toRaw(a, tin.decimals);
    const td = typedData('PermitSingle', P2_T, permit2Dom(w.chain), { details: { token: tin.address, amount: dec(mal ? MAX160 : raw), expiration: String(mal ? MAX48 : DEADLINE), nonce: '0' }, spender: w.router, sigDeadline: String(DEADLINE + 600) });
    return { sub: 'permit2_single_illimite', request: signTD(w, td), intent: intentOf(w, 'buy_or_swap', `Je swappe ${a} ${tin.symbol}`, `Swapping ${a} ${tin.symbol}`, { token: tin.symbol, amount: a }),
      whyM: 'PermitSingle Permit2 au montant uint160 maximal sans expiration pratique.', whyB: `PermitSingle pour ${a} ${tin.symbol} expirant en 30 minutes.` }; },
  function permit2_batch({ r, rm, mal, w }) { const tin = stableOf(r, w), a = humanOf(r); const raw = toRaw(a, tin.decimals); const other = Object.values(w.Tk).find((t) => t.address !== tin.address && t.symbol !== w.Tk.WN.symbol) || w.Tk.WN;
    const details = [{ token: tin.address, amount: dec(raw), expiration: String(DEADLINE), nonce: '0' }]; if (mal) details.push({ token: other.address, amount: dec(MAX160), expiration: String(MAX48), nonce: '0' });
    const td = typedData('PermitBatch', P2B_T, permit2Dom(w.chain), { details, spender: w.router, sigDeadline: String(DEADLINE + 600) });
    return { sub: 'permit2_batch_jeton_en_plus', request: signTD(w, td), intent: intentOf(w, 'buy_or_swap', `Échanger ${a} ${tin.symbol}`, `Swap ${a} ${tin.symbol}`, { token: tin.symbol, amount: a }),
      whyM: `PermitBatch qui ajoute un second jeton (${other.symbol}) en droit illimite, absent de l'intention.`, whyB: 'PermitBatch limite au jeton et au montant dits.' }; },
  function aggregate_approve({ r, rm, mal, w }) { const tin = stableOf(r, w), tout = w.Tk.WN, a = humanOf(r); const raw = toRaw(a, tin.decimals);
    const calls = [[tin.address, false, approveData(mal ? w.attacker : w.router, mal ? MAX256 : raw)], [w.router, false, swapV2(raw, outMin(a, tin, tout), [tin.address, tout.address], w.victim)]];
    return { sub: 'batch_approve_illimite_cache', request: tx(w, MULTICALL3, call('aggregate3((address,bool,bytes)[])', [calls])), intent: intentOf(w, 'buy_or_swap', `Échanger ${a} ${tin.symbol} contre ${tout.symbol}`, `Swap ${a} ${tin.symbol} for ${tout.symbol}`, { token: tin.symbol, amount: a, toToken: tout.symbol }),
      whyM: 'le lot cache un approve maximal vers un tiers avant le swap.', whyB: 'le lot contient un approve exact vers le routeur puis le swap.' }; },
] };

// F2 : jeton different de celui dit
F.jeton_different = { code: 'TK', nM: 19, nB: 13, chains: [1, 43114, 43113, 42161, 42161, 1], kind: 'dex', variants: [
  function transfer_autre_jeton({ r, rm, mal, w }) { const said = w.Tk[pick(r, ['USDC', 'USDT'])]; const a = humanOf(r); const ct = w.contacts[0]; const used = mal ? (said.symbol === 'USDC' ? w.Tk.USDT : w.Tk.USDC) : said;
    return { sub: 'transfer_sur_un_autre_jeton', request: tx(w, used.address, transferData(ct.address, toRaw(a, used.decimals))), intent: intentOf(w, 'pay_someone', `Envoyer ${a} ${said.symbol} à ${ct.label}`, `Send ${a} ${said.symbol} to ${ct.label}`, { token: said.symbol, amount: a, counterpartyLabel: ct.label, counterpartyAddress: ct.address }),
      whyM: `la transaction appelle ${used.symbol} alors que l'utilisateur dit ${said.symbol}.`, whyB: `transfert de ${said.symbol} au contact, conforme.` }; },
  function swap_sortie_differente({ r, rm, mal, w }) { const tin = w.Tk.USDC, said = w.Tk.DAI, a = humanOf(r); const raw = toRaw(a, 6); const fake = addr(rm);
    return { sub: 'swap_jeton_de_sortie_different', request: tx(w, w.router, swapV2(raw, mal ? 1n : outMin(a, tin, said), [tin.address, mal ? fake : said.address], w.victim)), intent: intentOf(w, 'buy_or_swap', `Échanger ${a} USDC contre du ${said.symbol}`, `Swap ${a} USDC for ${said.symbol}`, { token: 'USDC', amount: a, toToken: said.symbol }),
      ctx: mal ? unkTok(fake, rm) : {}, whyM: `le jeton recu est un contrat inconnu (minimum de sortie 1) et non ${said.symbol}.`, whyB: `sortie ${said.symbol} avec minimum realiste.` }; },
  function swap_entree_differente({ r, rm, mal, w }) { const said = w.Tk.USDC, other = pick(rm, [w.Tk.DAI, w.Tk.USDT]), a = humanOf(r); const tin = mal ? other : said; const raw = toRaw(a, tin.decimals); const tout = w.Tk.WN;
    return { sub: 'swap_jeton_depense_different', request: tx(w, w.router, swapV2(raw, outMin(a, tin, tout), [tin.address, tout.address], w.victim)), intent: intentOf(w, 'buy_or_swap', `Je dépense ${a} USDC pour du ${tout.symbol}`, `I spend ${a} USDC for ${tout.symbol}`, { token: 'USDC', amount: a, toToken: tout.symbol }),
      whyM: `le swap depense ${tin.symbol} et non les USDC annonces.`, whyB: 'le swap depense bien des USDC.' }; },
  function sosie_symbole({ r, rm, mal, w }) { const real = w.Tk.USDC, a = humanOf(r); const ct = w.contacts[1]; const fake = addr(rm);
    return { sub: 'jeton_sosie_meme_symbole', request: tx(w, mal ? fake : real.address, transferData(ct.address, toRaw(a, 6))), intent: intentOf(w, 'pay_someone', `Payer ${a} USDC à ${ct.label}`, `Pay ${a} USDC to ${ct.label}`, { token: 'USDC', amount: a, counterpartyLabel: ct.label, counterpartyAddress: ct.address }),
      ctx: mal ? { token_info: { [fake]: { symbol: 'USDC', decimals: 6, canonical: false, age_blocks: int(rm, 20, 2000) } } } : {}, whyM: "le contrat appele affiche le symbole USDC mais n'est pas l'USDC canonique du registre.", whyB: 'USDC canonique du registre.' }; },
  function approve_autre_jeton({ r, rm, mal, w }) { const said = w.Tk.USDC, other = w.Tk.WN, a = humanOf(r); const raw = toRaw(a, 6);
    return { sub: 'approve_sur_un_autre_jeton', request: mal ? tx(w, other.address, approveData(w.router, MAX256)) : tx(w, said.address, approveData(w.router, raw)), intent: intentOf(w, 'buy_or_swap', `J'autorise le routeur à dépenser ${a} USDC`, `Allow the router to spend ${a} USDC`, { token: 'USDC', amount: a }),
      whyM: `l'approbation porte sur ${other.symbol} (maximal) et non sur l'USDC dit.`, whyB: "approbation exacte sur l'USDC dit." }; },
  function v3_sortie_differente({ r, rm, mal, w }) { const tin = w.Tk.USDC, said = w.Tk.WN, a = humanOf(r); const raw = toRaw(a, 6); const fake = addr(rm);
    return { sub: 'exactInputSingle_sortie_differente', request: tx(w, w.router, swapV3(tin.address, mal ? fake : said.address, w.victim, raw, mal ? 0n : outMin(a, tin, said))), intent: intentOf(w, 'buy_or_swap', `Acheter du ${said.symbol} avec ${a} USDC`, `Buy ${said.symbol} with ${a} USDC`, { token: 'USDC', amount: a, toToken: said.symbol }),
      ctx: mal ? unkTok(fake, rm) : {}, whyM: 'exactInputSingle vers un jeton inconnu sans minimum de sortie.', whyB: 'exactInputSingle vers le jeton dit avec minimum.' }; },
  function permit_autre_jeton({ r, rm, mal, w }) { const said = w.Tk.USDC, other = w.Tk.DAI, a = humanOf(r); const t = mal ? other : said; const raw = toRaw(a, t.decimals);
    const td = typedData('Permit', PERMIT_T, { name: tokName(t), version: '2', chainId: w.chain, verifyingContract: t.address }, { owner: w.victim, spender: w.router, value: dec(raw), nonce: '0', deadline: String(DEADLINE) });
    return { sub: 'permit_sur_un_autre_jeton', request: signTD(w, td), intent: intentOf(w, 'buy_or_swap', `Échanger ${a} USDC`, `Swap ${a} USDC`, { token: 'USDC', amount: a }),
      whyM: `le permit autorise ${t.symbol} (verifyingContract) et non l'USDC dit.`, whyB: "permit sur l'USDC dit." }; },
  function permit2_autre_jeton({ r, rm, mal, w }) { const said = w.Tk.USDT, other = w.Tk.WN, a = humanOf(r); const t = mal ? other : said; const raw = toRaw(a, t.decimals);
    const td = typedData('PermitSingle', P2_T, permit2Dom(w.chain), { details: { token: t.address, amount: dec(raw), expiration: String(DEADLINE), nonce: '0' }, spender: w.router, sigDeadline: String(DEADLINE + 600) });
    return { sub: 'permit2_sur_un_autre_jeton', request: signTD(w, td), intent: intentOf(w, 'buy_or_swap', `Je swappe ${a} USDT`, `Swapping ${a} USDT`, { token: 'USDT', amount: a }),
      whyM: `le PermitSingle porte sur ${t.symbol}, pas sur l'USDT dit.`, whyB: "PermitSingle sur l'USDT dit." }; },
] };

// F3 : destinataire tiers
F.destinataire_tiers = { code: 'DT', nM: 19, nB: 13, chains: [1, 43114, 43113, 42161, 1, 42161], kind: 'dex', variants: [
  function swap_to_tiers({ r, rm, mal, w }) { const tin = stableOf(r, w), tout = w.Tk.WN, a = humanOf(r); const raw = toRaw(a, tin.decimals);
    return { sub: 'swapTokens_destinataire_tiers', request: tx(w, w.router, swapV2(raw, outMin(a, tin, tout), [tin.address, tout.address], mal ? w.attacker : w.victim)), intent: intentOf(w, 'buy_or_swap', `Échanger ${a} ${tin.symbol} contre ${tout.symbol} pour moi`, `Swap ${a} ${tin.symbol} for ${tout.symbol} to my wallet`, { token: tin.symbol, amount: a, toToken: tout.symbol }),
      whyM: 'le parametre to du swap est une adresse tierce inconnue.', whyB: "le parametre to est le portefeuille de l'utilisateur." }; },
  function swap_eth_to_tiers({ r, rm, mal, w }) { const tout = w.Tk.USDC, a = pick(r, AMT_N); const val = toRaw(a, 18);
    return { sub: 'swapExactETHForTokens_destinataire_tiers', request: tx(w, w.router, call('swapExactETHForTokens(uint256,address[],address,uint256)', [1n, [w.Tk.WN.address, tout.address], mal ? w.attacker : w.victim, DEADLINE]), hx(val)), intent: intentOf(w, 'buy_or_swap', `Acheter des USDC avec ${a} ${w.native}`, `Buy USDC with ${a} ${w.native}`, { token: w.native, amount: a, toToken: 'USDC' }),
      whyM: "les USDC achetes sont diriges vers une adresse tierce.", whyB: "les USDC reviennent a l'utilisateur." }; },
  function transfer_vers_autre({ r, rm, mal, w }) { const tk = stableOf(r, w), a = humanOf(r); const ct = w.contacts[0]; const poison = rm() < 0.5; const lookalike = ct.address.slice(0, 8) + addr(rm).slice(8, 36) + ct.address.slice(36);
    const to = mal ? (poison ? lookalike : w.attacker) : ct.address;
    return { sub: poison && mal ? 'transfer_adresse_sosie_empoisonnee' : 'transfer_vers_autre_adresse', request: tx(w, tk.address, transferData(to, toRaw(a, tk.decimals))), intent: intentOf(w, 'pay_someone', `Envoyer ${a} ${tk.symbol} à ${ct.label}`, `Send ${a} ${tk.symbol} to ${ct.label}`, { token: tk.symbol, amount: a, counterpartyLabel: ct.label, counterpartyAddress: ct.address }),
      ctx: mal && poison ? { history: [{ type: 'received', from: lookalike, token: tk.symbol, amount: '0', age_days: 1 }] } : {},
      whyM: poison ? 'le destinataire est un sosie du contact (memes debut et fin) apparu en dust.' : "le destinataire n'est pas celui du contact annonce.", whyB: "le destinataire est l'adresse du carnet." }; },
  function natif_vers_autre({ r, rm, mal, w }) { const a = pick(r, AMT_N); const ct = w.contacts[1]; const to = mal ? w.attacker : ct.address;
    return { sub: 'envoi_natif_destinataire_tiers', request: tx(w, to, '0x', hx(toRaw(a, 18))), intent: intentOf(w, 'pay_someone', `Envoyer ${a} ${w.native} à ${ct.label}`, `Send ${a} ${w.native} to ${ct.label}`, { token: w.native, amount: a, counterpartyLabel: ct.label, counterpartyAddress: ct.address }),
      whyM: "l'envoi natif part vers une adresse inconnue.", whyB: "l'envoi natif part vers le contact." }; },
  function v3_recipient({ r, rm, mal, w }) { const tin = w.Tk.USDC, tout = w.Tk.WN, a = humanOf(r); const raw = toRaw(a, 6);
    return { sub: 'exactInputSingle_recipient_tiers', request: tx(w, w.router, swapV3(tin.address, tout.address, mal ? w.attacker : w.victim, raw, outMin(a, tin, tout))), intent: intentOf(w, 'buy_or_swap', `Acheter du ${tout.symbol} pour ${a} USDC`, `Buy ${tout.symbol} for ${a} USDC`, { token: 'USDC', amount: a, toToken: tout.symbol }),
      whyM: 'recipient du swap V3 tiers.', whyB: 'recipient du swap V3 = utilisateur.' }; },
  function multicall_unwrap({ r, rm, mal, w }) { const tin = w.Tk.USDC, tout = w.Tk.WN, a = humanOf(r); const raw = toRaw(a, 6); const min = outMin(a, tin, tout);
    const inner = [swapV3(tin.address, tout.address, '0x0000000000000000000000000000000000000002', raw, min), call('unwrapWETH9(uint256,address)', [min, mal ? w.attacker : w.victim])];
    return { sub: 'multicall_unwrap_destinataire_tiers', request: tx(w, w.router, call('multicall(uint256,bytes[])', [DEADLINE, inner])), intent: intentOf(w, 'buy_or_swap', `Échanger ${a} USDC contre des ${w.native}`, `Swap ${a} USDC for ${w.native}`, { token: 'USDC', amount: a, toToken: w.native }),
      whyM: 'unwrapWETH9 du multicall envoie le produit a un tiers.', whyB: "unwrapWETH9 renvoie le produit a l'utilisateur." }; },
  function envoi_vers_mon_compte({ r, rm, mal, w }) { const tk = stableOf(r, w), a = humanOf(r); const mine = w.contacts[2]; mine.label = 'Mon Ledger';
    return { sub: 'envoi_vers_mon_compte_autre_adresse', request: tx(w, tk.address, transferData(mal ? w.attacker2 : mine.address, toRaw(a, tk.decimals))), intent: intentOf(w, 'send_to_my_account', `Je mets ${a} ${tk.symbol} sur mon Ledger`, `Moving ${a} ${tk.symbol} to my Ledger`, { token: tk.symbol, amount: a, counterpartyLabel: mine.label, counterpartyAddress: mine.address }),
      whyM: "le compte \"a moi\" annonce n'est pas le destinataire reel.", whyB: 'transfert vers le compte personnel du carnet.' }; },
  function sendcalls_extra({ r, rm, mal, w }) { const tk = stableOf(r, w), a = humanOf(r); const ct = w.contacts[0]; const raw = toRaw(a, tk.decimals);
    const calls = [{ to: tk.address, value: '0x0', data: transferData(ct.address, raw) }]; if (mal) calls.push({ to: tk.address, value: '0x0', data: transferData(w.attacker, scale(raw, 1, 2)) });
    return { sub: 'wallet_sendCalls_transfert_en_plus', request: { method: 'wallet_sendCalls', params: [{ version: '1.0', chainId: hx(w.chain), from: w.victim, calls }] }, intent: intentOf(w, 'pay_someone', `Payer ${a} ${tk.symbol} à ${ct.label}`, `Pay ${a} ${tk.symbol} to ${ct.label}`, { token: tk.symbol, amount: a, counterpartyLabel: ct.label, counterpartyAddress: ct.address }),
      whyM: 'le lot ajoute un second transfert vers un tiers.', whyB: 'le lot ne contient que le paiement annonce.' }; },
] };

// F4 : airdrop
F.airdrop_sortie_ou_droit = { code: 'AD', nM: 19, nB: 13, chains: [1, 43114, 43113, 42161, 1, 42161], kind: 'air', variants: [
  function claim_approve({ r, rm, mal, w }) { const tk = stableOf(r, w);
    return { sub: 'reclamer_mais_approve_illimite', request: tx(w, mal ? tk.address : w.distributor, mal ? approveData(w.attacker, MAX256) : call('claim()', [])), intent: intentOf(w, 'connect_or_accept_offer', 'Réclamer mon airdrop', 'Claim my airdrop', {}),
      whyM: `"réclamer" signe un approve maximal sur ${tk.symbol} vers un tiers.`, whyB: 'appel claim() sans argument sur le distributeur.' }; },
  function claim_setapproval({ r, rm, mal, w }) { const proof = [b32(r), b32(r)]; const amt = toRaw(pick(r, ['150', '420', '1000', '85.5']), 18); const idx = int(r, 1, 90000);
    return { sub: 'reclamer_mais_setApprovalForAll', request: tx(w, mal ? w.nft : w.distributor, mal ? call('setApprovalForAll(address,bool)', [w.attacker, true]) : call('claim(uint256,address,uint256,bytes32[])', [idx, w.victim, amt, proof])), intent: intentOf(w, 'connect_or_accept_offer', 'Récupérer mes tokens gratuits', 'Collect my free tokens', {}),
      whyM: 'la demande donne le droit sur tous les NFT de la collection.', whyB: "claim Merkle (index, compte, montant, preuve) pour le compte de l'utilisateur." }; },
  function claim_transfer({ r, rm, mal, w }) { const tk = stableOf(r, w); const bal = toRaw(pick(r, ['500', '1200', '3400', '9000']), tk.decimals); const idx = int(r, 1, 90000); const proof = [b32(r), b32(r)];
    return { sub: 'reclamer_mais_transfert_du_solde', request: tx(w, mal ? tk.address : w.distributor, mal ? transferData(w.attacker, bal) : call('claim(uint256,bytes32[])', [idx, proof])), intent: intentOf(w, 'connect_or_accept_offer', 'Recevoir mon airdrop', 'Receive my airdrop', {}),
      whyM: `"recevoir" envoie ${tk.symbol} du portefeuille vers un tiers.`, whyB: 'claim(index, preuve) sur le distributeur.' }; },
  function claim_payant({ r, rm, mal, w }) { const vs = pick(r, ['0.1', '0.25', '0.5', '1']); const v = toRaw(vs, 18);
    return { sub: 'reclamer_avec_frais_a_payer', request: mal ? tx(w, w.attacker, call('claim()', []), hx(v)) : tx(w, w.distributor, call('claim()', [])), intent: intentOf(w, 'connect_or_accept_offer', 'Réclamer mon airdrop gratuit', 'Claim my free airdrop', {}),
      whyM: `un airdrop "gratuit" demande d'envoyer ${vs} ${w.native} a un inconnu.`, whyB: 'claim() sans valeur sur le distributeur.' }; },
  function sign_permit({ r, rm, mal, w }) { const tk = stableOf(r, w); const n = nonceOf(r);
    const req = mal ? signTD(w, typedData('Permit', PERMIT_T, { name: tokName(tk), version: '2', chainId: w.chain, verifyingContract: tk.address }, { owner: w.victim, spender: w.attacker, value: dec(MAX256), nonce: '0', deadline: '4102444800' })) : pSign(w, siweOf(w, n));
    return { sub: 'verifier_eligibilite_mais_permit', request: req, intent: intentOf(w, 'connect_or_accept_offer', "Vérifier mon éligibilité à l'airdrop", 'Check my airdrop eligibility', {}),
      whyM: "la verification d'eligibilite fait signer un permit maximal a un tiers.", whyB: 'simple message de connexion sans effet.' }; },
  function sign_permit2({ r, rm, mal, w }) { const tk = stableOf(r, w); const n = nonceOf(r);
    const req = mal ? signTD(w, typedData('PermitSingle', P2_T, permit2Dom(w.chain), { details: { token: tk.address, amount: dec(MAX160), expiration: String(MAX48), nonce: '0' }, spender: w.attacker, sigDeadline: String(MAX48) })) : pSign(w, siweOf(w, n));
    return { sub: 'connexion_airdrop_mais_permit2', request: req, intent: intentOf(w, 'connect_or_accept_offer', 'Me connecter pour voir mon airdrop', 'Connect to see my airdrop', {}),
      whyM: 'la connexion fait signer un PermitSingle Permit2 maximal a un tiers.', whyB: 'message de connexion sans effet.' }; },
  function batch_claim({ r, rm, mal, w }) { const tk = stableOf(r, w);
    const calls = [[w.distributor, false, call('claim()', [])]]; if (mal) calls.push([tk.address, false, approveData(w.attacker, MAX256)]);
    return { sub: 'lot_reclamation_avec_approve', request: tx(w, MULTICALL3, call('aggregate3((address,bool,bytes)[])', [calls])), intent: intentOf(w, 'connect_or_accept_offer', 'Réclamer mon airdrop en un clic', 'Claim my airdrop in one click', {}),
      whyM: 'le lot de reclamation ajoute un approve maximal vers un tiers.', whyB: 'le lot ne contient que la reclamation.' }; },
  function verifier_wallet_envoi({ r, rm, mal, w }) { const share = pick(r, [70, 85, 92]); const v = toRaw((Math.max(Number(w.balance) * share / 100, 0.01)).toFixed(4), 18);
    return { sub: 'verification_portefeuille_envoi_solde', request: mal ? tx(w, w.attacker, '0x', hx(v)) : tx(w, w.distributor, call('claim()', [])), intent: intentOf(w, 'connect_or_accept_offer', "Valider mon portefeuille pour recevoir l'airdrop", 'Validate my wallet to receive the airdrop', {}),
      ctx: mal ? { share_of_balance_pct: share } : {}, whyM: `"valider le portefeuille" envoie ${share}% du solde natif a un tiers.`, whyB: 'claim() sans valeur.' }; },
] };

// F5 : connexion / signature de message qui signe un droit
F.login_signe_droit = { code: 'LG', nM: 19, nB: 12, chains: [1, 43114, 43113, 42161, 1, 42161], kind: 'dex', variants: [
  function siwe_plus_calldata({ r, rm, mal, w }) { const n = nonceOf(r); const base = siweOf(w, n);
    return { sub: 'siwe_avec_calldata_cache', request: pSign(w, mal ? base + '\n\n' + approveData(w.attacker, MAX256) : base), intent: intentOf(w, 'connect_or_accept_offer', 'Me connecter au site', 'Sign in to the site', {}),
      whyM: 'le message de connexion contient en fin un calldata approve maximal.', whyB: 'message de connexion sans calldata.' }; },
  function message_hex_calldata({ r, rm, mal, w }) { const tk = stableOf(r, w); const n = nonceOf(r);
    const req = mal ? { method: 'personal_sign', params: [approveData(w.attacker, toRaw('50000', tk.decimals)), w.victim] } : pSign(w, siweOf(w, n));
    return { sub: 'message_brut_qui_est_un_calldata', request: req, intent: intentOf(w, 'connect_or_accept_offer', 'Prouver que je possède mon portefeuille', 'Prove I own my wallet', {}),
      whyM: 'le "message" est un calldata approve brut en hexadecimal.', whyB: 'message texte de connexion.' }; },
  function eth_sign_hash({ r, rm, mal, w }) { const n = nonceOf(r);
    const req = mal ? { method: 'eth_sign', params: [w.victim, b32(rm)] } : pSign(w, siweOf(w, n));
    return { sub: 'eth_sign_aveugle', request: req, intent: intentOf(w, 'connect_or_accept_offer', 'Me connecter', 'Log in', {}),
      whyM: 'eth_sign sur un condensat opaque de 32 octets, pas un message lisible.', whyB: 'personal_sign sur un message lisible.' }; },
  function typed_permit({ r, rm, mal, w }) { const tk = stableOf(r, w); const n = nonceOf(r);
    const td = mal ? typedData('Permit', PERMIT_T, { name: tokName(tk), version: '2', chainId: w.chain, verifyingContract: tk.address }, { owner: w.victim, spender: w.attacker, value: dec(MAX256), nonce: '0', deadline: '4102444800' }) : loginTD(w, n);
    return { sub: 'typed_data_permit_au_lieu_de_login', request: signTD(w, td), intent: intentOf(w, 'connect_or_accept_offer', 'Me connecter avec mon portefeuille', 'Connect with my wallet', {}),
      whyM: 'la "connexion" est un Permit EIP-2612 maximal vers un tiers.', whyB: 'typed data de type Login, sans droit.' }; },
  function typed_permit2({ r, rm, mal, w }) { const tk = stableOf(r, w); const n = nonceOf(r);
    const td = mal ? typedData('PermitSingle', P2_T, permit2Dom(w.chain), { details: { token: tk.address, amount: dec(MAX160), expiration: String(MAX48), nonce: '0' }, spender: w.attacker, sigDeadline: String(MAX48) }) : loginTD(w, n);
    return { sub: 'typed_data_permit2_au_lieu_de_login', request: signTD(w, td), intent: intentOf(w, 'connect_or_accept_offer', 'Signer pour me connecter', 'Sign to log in', {}),
      whyM: 'la signature de connexion est un PermitSingle Permit2 maximal.', whyB: 'typed data Login sans droit.' }; },
  function tx_setapproval({ r, rm, mal, w }) { const n = nonceOf(r);
    const req = mal ? tx(w, w.nft, call('setApprovalForAll(address,bool)', [w.attacker, true])) : pSign(w, siweOf(w, n));
    return { sub: 'connexion_qui_est_setApprovalForAll', request: req, intent: intentOf(w, 'connect_or_accept_offer', 'Me connecter au site (sans frais)', 'Sign in to the site (no fee)', {}),
      whyM: 'la "connexion" est une transaction setApprovalForAll vers un tiers.', whyB: 'signature de message sans transaction.' }; },
  function typed_permit2_transfer({ r, rm, mal, w }) { const tk = stableOf(r, w); const n = nonceOf(r); const big = pick(rm, ['10000', '25000', '100000']);
    const td = mal ? typedData('PermitTransferFrom', P2ST_T, permit2Dom(w.chain), { permitted: { token: tk.address, amount: dec(toRaw(big, tk.decimals)) }, spender: w.attacker, nonce: dec(BigInt(b32(rm)) % (1n << 64n)), deadline: String(MAX48) }) : loginTD(w, n);
    return { sub: 'permit2_signature_transfer_au_lieu_de_login', request: signTD(w, td), intent: intentOf(w, 'connect_or_accept_offer', 'Vérifier mon identité', 'Verify my identity', {}),
      whyM: "la verification d'identite est un PermitTransferFrom Permit2 pour un montant fort et un tiers.", whyB: 'typed data Login.' }; },
  function typed_dai_permit({ r, rm, mal, w }) { const n = nonceOf(r);
    const td = mal ? typedData('Permit', DAI_T, { name: 'Dai Stablecoin', version: '1', chainId: w.chain, verifyingContract: w.Tk.DAI.address }, { holder: w.victim, spender: w.attacker, nonce: '0', expiry: '4102444800', allowed: true }) : loginTD(w, n);
    return { sub: 'permit_dai_allowed_au_lieu_de_login', request: signTD(w, td), intent: intentOf(w, 'connect_or_accept_offer', 'Accepter les conditions et me connecter', 'Accept the terms and log in', {}),
      whyM: 'permit de type DAI (allowed=true, illimite) vers un tiers presente comme connexion.', whyB: 'typed data Login.' }; },
  function siwe_multicall({ r, rm, mal, w }) { const n = nonceOf(r); const inner = [approveData(w.attacker, MAX256), transferData(w.attacker, 1n)];
    const text = mal ? siweOf(w, n) + '\n\nResources:\n- ' + call('multicall(bytes[])', [inner]) : siweOf(w, n) + '\n\nResources:\n- https://' + w.site + '/terms';
    return { sub: 'siwe_ressource_est_un_multicall', request: pSign(w, text), intent: intentOf(w, 'connect_or_accept_offer', 'Me connecter', 'Sign in', {}),
      whyM: 'le champ Resources du message contient un calldata multicall.', whyB: 'le champ Resources contient une URL de conditions.' }; },
] };

// F6 : montant plus grand que dit
F.montant_plus_grand = { code: 'MT', nM: 19, nB: 12, chains: [1, 43114, 43113, 42161, 42161, 1], kind: 'dex', variants: [
  function transfer_facteur({ r, rm, mal, w }) { const tk = stableOf(r, w), a = humanOf(r); const ct = w.contacts[0]; const raw = toRaw(a, tk.decimals); const [n, d] = pick(rm, [[2n, 1n], [10n, 1n], [100n, 1n], [5n, 4n], [3n, 2n], [20n, 1n]]);
    return { sub: 'transfer_montant_multiplie', request: tx(w, tk.address, transferData(ct.address, mal ? scale(raw, n, d) : raw)), intent: intentOf(w, 'pay_someone', `Envoyer ${a} ${tk.symbol} à ${ct.label}`, `Send ${a} ${tk.symbol} to ${ct.label}`, { token: tk.symbol, amount: a, counterpartyLabel: ct.label, counterpartyAddress: ct.address }),
      whyM: `le montant transfere est ${n}/${d} fois le montant dit.`, whyB: 'montant exact.' }; },
  function decimales({ r, rm, mal, w }) { const tk = w.Tk.USDC, a = pick(r, ['10', '25', '100', '500']); const ct = w.contacts[1]; const rawOk = toRaw(a, 6); const rawBad = toRaw(a, 18);
    return { sub: 'confusion_de_decimales', request: tx(w, tk.address, transferData(ct.address, mal ? rawBad : rawOk)), intent: intentOf(w, 'pay_someone', `Payer ${a} USDC à ${ct.label}`, `Pay ${a} USDC to ${ct.label}`, { token: 'USDC', amount: a, counterpartyLabel: ct.label, counterpartyAddress: ct.address }),
      whyM: 'le montant brut utilise 18 decimales sur un jeton a 6 decimales (1e12 fois trop).', whyB: 'montant brut en 6 decimales.' }; },
  function swap_amountin({ r, rm, mal, w }) { const tin = stableOf(r, w), tout = w.Tk.WN, a = humanOf(r); const raw = toRaw(a, tin.decimals); const k = pick(rm, [2, 5, 10, 25]);
    return { sub: 'swap_montant_en_entree_plus_grand', request: tx(w, w.router, swapV2(mal ? raw * BigInt(k) : raw, outMin(a, tin, tout), [tin.address, tout.address], w.victim)), intent: intentOf(w, 'buy_or_swap', `Échanger ${a} ${tin.symbol} contre ${tout.symbol}`, `Swap ${a} ${tin.symbol} for ${tout.symbol}`, { token: tin.symbol, amount: a, toToken: tout.symbol }),
      whyM: `amountIn est ${k} fois le montant dit.`, whyB: 'amountIn egal au montant dit.' }; },
  function natif_valeur({ r, rm, mal, w }) { const a = pick(r, AMT_N); const ct = w.contacts[2]; const raw = toRaw(a, 18); const k = pick(rm, [2, 5, 10, 100]);
    return { sub: 'envoi_natif_valeur_multipliee', request: tx(w, ct.address, '0x', hx(mal ? raw * BigInt(k) : raw)), intent: intentOf(w, 'pay_someone', `Envoyer ${a} ${w.native} à ${ct.label}`, `Send ${a} ${w.native} to ${ct.label}`, { token: w.native, amount: a, counterpartyLabel: ct.label, counterpartyAddress: ct.address }),
      ctx: mal ? { share_of_balance_pct: Math.min(99, Math.round(Number(a) * k / Number(w.balance) * 100)) } : {}, whyM: `la valeur envoyee est ${k} fois le montant dit.`, whyB: 'valeur exacte.' }; },
  function swap_eth_valeur({ r, rm, mal, w }) { const a = pick(r, AMT_N); const raw = toRaw(a, 18); const k = pick(rm, [2, 4, 10]); const tout = w.Tk.USDC;
    return { sub: 'swapExactETH_valeur_plus_grande', request: tx(w, w.router, call('swapExactETHForTokens(uint256,address[],address,uint256)', [1n, [w.Tk.WN.address, tout.address], w.victim, DEADLINE]), hx(mal ? raw * BigInt(k) : raw)), intent: intentOf(w, 'buy_or_swap', `Acheter des USDC avec ${a} ${w.native}`, `Buy USDC with ${a} ${w.native}`, { token: w.native, amount: a, toToken: 'USDC' }),
      whyM: `la valeur jointe est ${k} fois le montant dit.`, whyB: 'valeur egale au montant dit.' }; },
  function v3_amountin({ r, rm, mal, w }) { const tin = w.Tk.USDC, tout = w.Tk.WN, a = humanOf(r); const raw = toRaw(a, 6); const k = pick(rm, [3, 10, 50]);
    return { sub: 'exactInputSingle_montant_plus_grand', request: tx(w, w.router, swapV3(tin.address, tout.address, w.victim, mal ? raw * BigInt(k) : raw, outMin(a, tin, tout))), intent: intentOf(w, 'buy_or_swap', `Acheter du ${tout.symbol} pour ${a} USDC`, `Buy ${tout.symbol} for ${a} USDC`, { token: 'USDC', amount: a, toToken: tout.symbol }),
      whyM: `amountIn V3 = ${k} fois le montant dit.`, whyB: 'amountIn V3 exact.' }; },
  function sendcalls_somme({ r, rm, mal, w }) { const tk = stableOf(r, w), a = humanOf(r); const ct = w.contacts[0]; const raw = toRaw(a, tk.decimals);
    const calls = mal ? [transferData(ct.address, raw), transferData(ct.address, raw * 3n)] : [transferData(ct.address, raw)];
    return { sub: 'lot_dont_la_somme_depasse', request: { method: 'wallet_sendCalls', params: [{ version: '1.0', chainId: hx(w.chain), from: w.victim, calls: calls.map((d) => ({ to: tk.address, value: '0x0', data: d })) }] }, intent: intentOf(w, 'pay_someone', `Payer ${a} ${tk.symbol} à ${ct.label}`, `Pay ${a} ${tk.symbol} to ${ct.label}`, { token: tk.symbol, amount: a, counterpartyLabel: ct.label, counterpartyAddress: ct.address }),
      whyM: 'le lot envoie en tout 4 fois le montant dit au meme contact.', whyB: 'un seul transfert du montant dit.' }; },
  function permit_valeur({ r, rm, mal, w }) { const tk = stableOf(r, w), a = humanOf(r); const raw = toRaw(a, tk.decimals); const k = pick(rm, [2, 4, 20]);
    return { sub: 'permit_valeur_plus_grande', request: signTD(w, typedData('Permit', PERMIT_T, { name: tokName(tk), version: '2', chainId: w.chain, verifyingContract: tk.address }, { owner: w.victim, spender: w.router, value: dec(mal ? raw * BigInt(k) : raw), nonce: '0', deadline: String(DEADLINE) })), intent: intentOf(w, 'buy_or_swap', `Je veux payer ${a} ${tk.symbol} sur le site`, `I want to pay ${a} ${tk.symbol} on the site`, { token: tk.symbol, amount: a }),
      whyM: `le permit autorise ${k} fois le montant dit.`, whyB: 'le permit autorise le montant dit.' }; },
] };

// F7 : chaine ou domaine different
F.chaine_domaine_different = { code: 'CH', nM: 18, nB: 12, chains: [43114, 42161, 43113, 1, 43114, 42161], kind: 'dex', variants: [
  function tx_autre_chaine({ r, rm, mal, w }) { const tk = stableOf(r, w), a = humanOf(r); const ct = w.contacts[0]; const other = pick(rm, CHAINS.filter((x) => x !== w.chain));
    return { sub: 'transaction_sur_une_autre_chaine', request: tx(w, tk.address, transferData(ct.address, toRaw(a, tk.decimals)), '0x0', mal ? other : w.chain), intent: intentOf(w, 'pay_someone', `Envoyer ${a} ${tk.symbol} à ${ct.label} sur ${CHAIN_NAME[w.chain][0]}`, `Send ${a} ${tk.symbol} to ${ct.label} on ${CHAIN_NAME[w.chain][1]}`, { token: tk.symbol, amount: a, counterpartyLabel: ct.label, counterpartyAddress: ct.address, chainId: w.chain }),
      whyM: `la requete cible la chaine ${other} alors que l'utilisateur est sur ${w.chain}.`, whyB: 'chaine de la requete = chaine annoncee.' }; },
  function permit_domaine_chaine({ r, rm, mal, w }) { const tk = stableOf(r, w), a = humanOf(r); const raw = toRaw(a, tk.decimals); const other = pick(rm, CHAINS.filter((x) => x !== w.chain));
    return { sub: 'permit_domaine_autre_chaine', request: signTD(w, typedData('Permit', PERMIT_T, { name: tokName(tk), version: '2', chainId: mal ? other : w.chain, verifyingContract: tk.address }, { owner: w.victim, spender: w.router, value: dec(raw), nonce: '0', deadline: String(DEADLINE) })), intent: intentOf(w, 'buy_or_swap', `Échanger ${a} ${tk.symbol} sur ${CHAIN_NAME[w.chain][0]}`, `Swap ${a} ${tk.symbol} on ${CHAIN_NAME[w.chain][1]}`, { token: tk.symbol, amount: a, chainId: w.chain }),
      whyM: `le domaine EIP-712 porte la chaine ${other}, pas la chaine courante (signature rejouable ailleurs).`, whyB: 'domaine EIP-712 sur la chaine courante.' }; },
  function origine_sosie({ r, rm, mal, w }) { const n = nonceOf(r); const real = w.site; const fake = real.replace(/^([a-z]+)\./, '$1-secure.').replace('.example', '-login.example');
    const origin = mal ? fake : real;
    return { sub: 'origine_differente_du_site_annonce', request: pSign(w, siweOf(w, n, origin)), intent: intentOf(w, 'connect_or_accept_offer', `Me connecter à ${real}`, `Sign in to ${real}`, {}),
      ctx: { origin, claimed_site: real }, whyM: `la demande vient de ${fake} alors que l'utilisateur pense etre sur ${real}.`, whyB: 'origine = site annonce.' }; },
  function switch_chain({ r, rm, mal, w }) { const target = pick(r, CHAINS.filter((x) => x !== w.chain && x !== 43113)); const other = pick(rm, CHAINS.filter((x) => x !== w.chain && x !== target));
    return { sub: 'wallet_switchEthereumChain_autre_chaine', request: { method: 'wallet_switchEthereumChain', params: [{ chainId: hx(mal ? other : target) }] }, intent: intentOf(w, 'connect_or_accept_offer', `Passer sur ${CHAIN_NAME[target][0]}`, `Switch to ${CHAIN_NAME[target][1]}`, { chainId: target }),
      whyM: `le changement demande la chaine ${other} et non ${target}.`, whyB: 'changement vers la chaine annoncee.' }; },
  function add_chain({ r, rm, mal, w }) { const params = mal ? { chainId: '0x1b58', chainName: 'Avalanche C-Chain', nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }, rpcUrls: ['https://rpc.faux-avax.example/ext/bc/C/rpc'], blockExplorerUrls: ['https://explorer.faux-avax.example'] } : { chainId: '0xa86a', chainName: 'Avalanche C-Chain', nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }, rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'], blockExplorerUrls: ['https://snowtrace.io'] };
    return { sub: 'wallet_addEthereumChain_identifiant_trompeur', request: { method: 'wallet_addEthereumChain', params: [params] }, intent: intentOf(w, 'connect_or_accept_offer', 'Ajouter le réseau Avalanche C-Chain', 'Add the Avalanche C-Chain network', { chainId: 43114 }),
      whyM: "le nom dit Avalanche C-Chain mais l'identifiant (7000) et le RPC sont ceux d'un autre reseau.", whyB: 'identifiant 43114 coherent avec le nom.' }; },
  function permit2_faux_contrat({ r, rm, mal, w }) { const tk = stableOf(r, w), a = humanOf(r); const raw = toRaw(a, tk.decimals);
    return { sub: 'permit2_verifyingContract_non_canonique', request: signTD(w, typedData('PermitSingle', P2_T, permit2Dom(w.chain, mal ? w.attacker : PERMIT2), { details: { token: tk.address, amount: dec(raw), expiration: String(DEADLINE), nonce: '0' }, spender: w.router, sigDeadline: String(DEADLINE + 600) })), intent: intentOf(w, 'buy_or_swap', `Swapper ${a} ${tk.symbol}`, `Swap ${a} ${tk.symbol}`, { token: tk.symbol, amount: a }),
      whyM: "le verifyingContract \"Permit2\" n'est pas l'adresse canonique.", whyB: 'verifyingContract = Permit2 canonique.' }; },
  function swap_autre_chaine({ r, rm, mal, w }) { const tin = stableOf(r, w), tout = w.Tk.WN, a = humanOf(r); const raw = toRaw(a, tin.decimals); const other = pick(rm, CHAINS.filter((x) => x !== w.chain));
    return { sub: 'swap_sur_une_autre_chaine', request: tx(w, w.router, swapV2(raw, outMin(a, tin, tout), [tin.address, tout.address], w.victim), '0x0', mal ? other : w.chain), intent: intentOf(w, 'buy_or_swap', `Échanger ${a} ${tin.symbol} sur ${CHAIN_NAME[w.chain][0]}`, `Swap ${a} ${tin.symbol} on ${CHAIN_NAME[w.chain][1]}`, { token: tin.symbol, amount: a, toToken: tout.symbol, chainId: w.chain }),
      whyM: `meme calldata mais chainId ${other} au lieu de ${w.chain}.`, whyB: 'chaine de la requete = chaine annoncee.' }; },
  function login_domaine_etranger({ r, rm, mal, w }) { const n = nonceOf(r); const other = pick(rm, CHAINS.filter((x) => x !== w.chain));
    const td = mal ? loginTD(w, n, w.site.replace('.example', '-app.example'), { name: 'Connexion', version: '1', chainId: other, verifyingContract: w.attacker }) : loginTD(w, n);
    return { sub: 'login_typed_data_domaine_etranger', request: signTD(w, td), intent: intentOf(w, 'connect_or_accept_offer', `Me connecter à ${w.site}`, `Log in to ${w.site}`, {}),
      whyM: 'le typed data de connexion porte un autre site, une autre chaine et un contrat verificateur tiers.', whyB: 'typed data de connexion coherent avec le site et la chaine.' }; },
] };

// F8 : Seaport / NFT a prix quasi nul alors que l'utilisateur dit acheter
F.seaport_prix_quasi_nul = { code: 'SP', nM: 18, nB: 12, chains: [1, 42161, 43114, 1, 42161, 43113], kind: 'nft', variants: [
  function vend_pour_1_wei({ r, rm, mal, w }) { const id = int(r, 1, 9999); const price = pick(r, ['0.2', '0.5', '1', '1.5', '3']); const pr = toRaw(price, 18);
    const offer = mal ? [oItem(2, w.nft, id, 1n)] : [oItem(1, w.Tk.WN.address, 0, pr)];
    const cons = mal ? [cItem(0, ZERO, 0, 1n, w.victim)] : [cItem(2, w.nft, id, 1n, w.victim), cItem(1, w.Tk.WN.address, 0, scale(pr, 25, 1000n), w.attacker2)];
    return { sub: 'ordre_offre_nft_contre_1_wei', request: seaportOrder(w, r, offer, cons), intent: intentOf(w, 'buy_or_swap', `Je veux acheter ce NFT pour ${price} ${w.Tk.WN.symbol}`, `I want to buy this NFT for ${price} ${w.Tk.WN.symbol}`, { token: w.Tk.WN.symbol, amount: price }),
      whyM: "l'ordre signe met un NFT de l'utilisateur en vente pour 1 wei (l'utilisateur voulait acheter).", whyB: `offre d'achat de ${price} avec une commission de marche de 2,5 %.` }; },
  function collection_criteres({ r, rm, mal, w }) { const price = pick(r, ['0.1', '0.3', '0.8', '2']); const id = int(r, 1, 9999);
    const offer = mal ? [oItem(4, w.nft, 0, 1n)] : [oItem(1, w.Tk.WN.address, 0, toRaw(price, 18))];
    const cons = mal ? [cItem(0, ZERO, 0, 100n, w.victim)] : [cItem(2, w.nft, id, 1n, w.victim)];
    return { sub: 'ordre_collection_entiere_a_prix_derisoire', request: seaportOrder(w, r, offer, cons), intent: intentOf(w, 'buy_or_swap', `Acheter un NFT de cette collection à ${price} ${w.Tk.WN.symbol}`, `Buy an NFT from this collection at ${price} ${w.Tk.WN.symbol}`, { token: w.Tk.WN.symbol, amount: price }),
      whyM: "l'ordre offre n'importe quel NFT de la collection (criteres) pour 100 wei.", whyB: "offre d'achat d'un NFT precis au prix dit." }; },
  function trois_nft({ r, rm, mal, w }) { const price = pick(r, ['0.4', '1', '2.5']); const id = int(r, 1, 9999);
    const offer = mal ? [oItem(2, w.nft, id, 1n), oItem(2, w.nft, id + 1, 1n), oItem(2, w.nft, id + 2, 1n)] : [oItem(1, w.Tk.WN.address, 0, toRaw(price, 18))];
    const cons = mal ? [cItem(0, ZERO, 0, 1000n, w.victim)] : [cItem(2, w.nft, id, 1n, w.victim)];
    return { sub: 'ordre_trois_nft_contre_presque_rien', request: seaportOrder(w, r, offer, cons), intent: intentOf(w, 'buy_or_swap', `Acheter le NFT #${id} pour ${price} ${w.Tk.WN.symbol}`, `Buy NFT #${id} for ${price} ${w.Tk.WN.symbol}`, { token: w.Tk.WN.symbol, amount: price }),
      whyM: "l'ordre cede trois NFT pour 1000 wei.", whyB: 'offre d\'achat du NFT dit au prix dit.' }; },
  function erc1155({ r, rm, mal, w }) { const price = pick(r, ['0.05', '0.2', '0.6']); const id = int(r, 1, 500);
    const offer = mal ? [oItem(3, w.nft, id, 5n)] : [oItem(1, w.Tk.WN.address, 0, toRaw(price, 18))];
    const cons = mal ? [cItem(0, ZERO, 0, toRaw('0.0000001', 18), w.victim)] : [cItem(3, w.nft, id, 5n, w.victim)];
    return { sub: 'ordre_erc1155_a_prix_quasi_nul', request: seaportOrder(w, r, offer, cons), intent: intentOf(w, 'buy_or_swap', `Acheter 5 exemplaires pour ${price} ${w.Tk.WN.symbol}`, `Buy 5 copies for ${price} ${w.Tk.WN.symbol}`, { token: w.Tk.WN.symbol, amount: price }),
      whyM: "l'ordre vend 5 exemplaires ERC-1155 de l'utilisateur pour 1e-7 jeton natif.", whyB: "offre d'achat de 5 exemplaires au prix dit." }; },
  function offre_trop_haute({ r, rm, mal, w }) { const price = pick(r, ['0.2', '0.5', '1']); const k = pick(rm, [10, 20, 100]); const id = int(r, 1, 9999);
    const offer = [oItem(1, w.Tk.WN.address, 0, toRaw(price, 18) * BigInt(mal ? k : 1))];
    const cons = [cItem(2, w.nft, id, 1n, w.victim)];
    return { sub: 'offre_d_achat_bien_au_dessus_du_prix_dit', request: seaportOrder(w, r, offer, cons), intent: intentOf(w, 'buy_or_swap', `Acheter ce NFT pour ${price} ${w.Tk.WN.symbol}`, `Buy this NFT for ${price} ${w.Tk.WN.symbol}`, { token: w.Tk.WN.symbol, amount: price }),
      whyM: `l'offre engage ${k} fois le prix dit.`, whyB: 'offre au prix dit.' }; },
  function beneficiaire_tiers({ r, rm, mal, w }) { const price = pick(r, ['0.3', '0.9', '2']); const id = int(r, 1, 9999);
    const offer = [oItem(1, w.Tk.WN.address, 0, toRaw(price, 18))];
    const cons = [cItem(2, w.nft, id, 1n, mal ? w.attacker : w.victim)];
    return { sub: 'offre_d_achat_nft_livre_a_un_tiers', request: seaportOrder(w, r, offer, cons), intent: intentOf(w, 'buy_or_swap', `Acheter le NFT #${id} pour moi à ${price} ${w.Tk.WN.symbol}`, `Buy NFT #${id} for myself at ${price} ${w.Tk.WN.symbol}`, { token: w.Tk.WN.symbol, amount: price }),
      whyM: 'le NFT acheté est livre a une adresse tierce.', whyB: "le NFT acheté est livre a l'utilisateur." }; },
  function acheter_mais_setapproval({ r, rm, mal, w }) { const price = pick(r, ['0.1', '0.5', '1.2']); const id = int(r, 1, 9999);
    const req = mal ? tx(w, w.nft, call('setApprovalForAll(address,bool)', [w.attacker, true])) : tx(w, w.market, call('buy(address,uint256)', [w.nft, id]), hx(toRaw(price, 18)));
    return { sub: 'acheter_mais_setApprovalForAll', request: req, intent: intentOf(w, 'buy_or_swap', `Acheter le NFT #${id} pour ${price} ${w.native}`, `Buy NFT #${id} for ${price} ${w.native}`, { token: w.native, amount: price }),
      whyM: "l'achat annonce est un setApprovalForAll de la collection a un tiers.", whyB: `achat via la place de marche connue pour ${price} ${w.native}.` }; },
  function usdc_un_micro({ r, rm, mal, w }) { const price = pick(r, ['150', '800', '2500']); const id = int(r, 1, 9999); const usdc = w.Tk.USDC;
    const offer = mal ? [oItem(2, w.nft, id, 1n)] : [oItem(1, usdc.address, 0, toRaw(price, 6))];
    const cons = mal ? [cItem(1, usdc.address, 0, 1n, w.victim)] : [cItem(2, w.nft, id, 1n, w.victim)];
    return { sub: 'ordre_nft_contre_un_micro_usdc', request: seaportOrder(w, r, offer, cons), intent: intentOf(w, 'buy_or_swap', `Acheter ce NFT pour ${price} USDC`, `Buy this NFT for ${price} USDC`, { token: 'USDC', amount: price }),
      whyM: "l'ordre cede le NFT de l'utilisateur pour 0,000001 USDC.", whyB: `offre d'achat de ${price} USDC.` }; },
] };

// ---------- assemblage ----------
const NOTICE = 'SYNTHETIQUE : cas de test defensif ecrit en aveugle, aucune signature, aucune cle, adresses tirees au hasard';
const cases = [];
for (const [fam, def] of Object.entries(F)) {
  for (let k = 0; k < def.nM; k++) {
    const vi = k % def.variants.length;
    for (const mal of [true, false]) {
      if (!mal && k >= def.nB) continue;
      const r = mk(fam, k, 'common'), rm = mk(fam, k, 'mal'), ra = mk(fam, k, 'att');
      const chain = def.chains[k % def.chains.length];
      const w = world(r, ra, chain, def.kind);
      const out = def.variants[vi]({ r, rm, mal, w });
      const nn = String(k + 1).padStart(2, '0');
      const id = `BD-${def.code}-${mal ? 'M' : 'B'}${nn}`;
      const { lang, ...intent } = out.intent;
      cases.push({
        id, synthetic: true, notice: NOTICE, jeu: 'BLIND_DECALAGE', family: fam, subfamily: out.sub, variant: vi,
        request: out.request, context: ctxOf(w, out.ctx || {}), intent, label: mal ? 'malicious' : 'benign',
        why: mal ? out.whyM : out.whyB, twin_of: mal ? (k < def.nB ? `BD-${def.code}-B${nn}` : null) : `BD-${def.code}-M${nn}`, lang,
      });
    }
  }
}
cases.sort((a, b) => (a.id < b.id ? -1 : 1));

// controles de structure (aucune evaluation par un moteur)
for (const c of cases) {
  const rq = c.request;
  const chk = (d) => { if (!/^0x([0-9a-f]{2})*$/.test(d)) throw new Error('hex ' + c.id); if (d !== '0x' && (d.length - 10) % 64 !== 0) throw new Error('longueur calldata ' + c.id); };
  if (rq.method === 'eth_sendTransaction') chk(rq.params[0].data);
  if (rq.method === 'wallet_sendCalls') rq.params[0].calls.forEach((x) => chk(x.data));
  if (rq.method === 'eth_signTypedData_v4') { const td = JSON.parse(rq.params[1]); if (!td.types[td.primaryType] || !td.domain) throw new Error('eip712 ' + c.id); }
}
const text = cases.map((c) => JSON.stringify(c)).join('\n') + '\n';
writeFileSync(join(HERE, 'CASES.jsonl'), text);
const sha = createHash('sha256').update(text).digest('hex');
writeFileSync(join(HERE, 'SHA256.txt'), `${sha}  CASES.jsonl\n`);
const cnt = {};
for (const c of cases) { const k = `${c.family}|${c.label}`; cnt[k] = (cnt[k] || 0) + 1; }
console.log(JSON.stringify(cnt, null, 1));
console.log('total', cases.length, 'malicious', cases.filter((c) => c.label === 'malicious').length, 'benign', cases.filter((c) => c.label === 'benign').length, 'sha256', sha);

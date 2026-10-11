/* Hold up - what the person WROTE against what the request really carries. Pure ES module : no chrome.*, no network, no DOM.
 * Shared by both builds (server mode and standalone), so the answer does not depend on which engine runs.
 *
 *   signIn(method, params, origin)   -> true when the request is a "Sign-In with Ethereum" message for THIS site (no window)
 *   relance(intent)                  -> the one follow-up question when the sentence is too vague, else null
 *   requestFacts(body)               -> { grants: [{ token, spender, raw, unlimited }], sends: [{ token, to, raw }] }
 *   writtenCheck(body, intent, tokens) -> null, or { outcome: 'match' | 'mismatch' | 'unverifiable', line, address_diff? }
 *   effectCheck(effect, intent)      -> the same answer, from the MEASURED effect of a call nobody can read (effect_sim.js)
 *   usedBy(body, effect)             -> what one request takes from the written amount : { grants, out } (storable, no bigint)
 *   limitPlan(body, intent, tokens, chain) -> null, or { params, amount, symbol } : the SAME request with every spending right wider than
 *                                    the written amount replaced by that amount (Q17). Only when it is certain, never guessed.
 *   limitText(plan)                  -> 'Droit limité à 50 USDC'
 *   operationCheck(used, mine, intent, tokens) -> null, or a mismatch when the requests of ONE written intent, added up, exceed it
 *
 * Rules :
 *   - a written amount against a spending right : the right must not exceed it. Unlimited, or more than written, is a mismatch,
 *     whatever the site or the contract (known or not) ;
 *   - a payment : the recipient and the amount of the request must be the ones written. The address is pasted in the sentence ;
 *     a name without an address cannot be checked, and the window says so ;
 *   - a right given by a SIGNATURE (Permit, Permit2) has no ceiling the person can edit in the wallet : the line says so and
 *     gives no advice nobody can follow ;
 *   - no address is known here : token decimals come from the optional local context (`tokens`), else from the usual
 *     decimals of the symbol the person wrote. */
import { amountIsSure } from './intent_text.js';
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const lc = (a) => String(a).toLowerCase();
const UNLIMITED_FROM = 2n ** 128n; // nobody owns that much of anything : from here on the right is "everything"
const SYMBOL_DECIMALS = { USDC: 6, USDT: 6, WBTC: 8, BTC: 8 };
const TOKEN_ONLY = new Set(['USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'WAVAX']); // never the network's own currency
const PAY_KINDS = new Set(['pay_someone', 'send_to_my_account']);
export const MAX_CALLS = 256; // wallet_sendCalls : every call up to here is read ; more = not verified (S8)
// Tokens this build knows by their ADDRESS (same list as the embedded engine, Ethereum and Avalanche C). Only these can ever "match" a written symbol (S2).
export const BUILTIN_TOKENS = Object.freeze({
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
  '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: 'DAI', decimals: 18 },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: 'WETH', decimals: 18 },
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { symbol: 'WBTC', decimals: 8 },
  '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': { symbol: 'USDC', decimals: 6 },
  '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7': { symbol: 'USDT', decimals: 6 },
  '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7': { symbol: 'WAVAX', decimals: 18 }
});
// ---- what the written checks need to know about the world (public data, no case of any test set)
// Everyday money ("50 dollars") can only be matched by a stable token known by its ADDRESS : the amount is compared, the token stays the request's.
const STABLE = new Set(['USDC', 'USDT', 'DAI']);
const MONEY = 'USD';
const baseSym = (s) => String(s || '').toUpperCase().replace(/\.[EB]$/, '');
// The network's own currency and its wrapped token are the same asset in an EXCHANGE ("contre AVAX" may arrive as WAVAX). Never for a payment.
const WRAPPED = { WETH: 'ETH', WAVAX: 'AVAX', WBNB: 'BNB', WMATIC: 'MATIC', WPOL: 'POL' };
const fam = (s) => { const b = baseSym(s); return WRAPPED[b] || b; };
const NATIVE = { 1: 'ETH', 10: 'ETH', 8453: 'ETH', 42161: 'ETH', 59144: 'ETH', 56: 'BNB', 137: 'POL', 43114: 'AVAX', 43113: 'AVAX', 11155111: 'ETH' };
// Contracts a right may be given to without a warning : public routers and pools read on their primary source (same entries as
// pipeline/known_protocols.json, which carries the source of each), plus what the person declared in the settings (contexte.knownSpenders).
// A right given to any other address can never "match" : the sentence cannot prove who that address is.
export const BUILTIN_SPENDERS = Object.freeze({
  any: ['0x000000000022d473030f116ddee9f6b43ac78ba3', '0x0000000000000068f116a894984e2db1123eb395'],
  1: ['0x66a9893cc07d91d95644aedd05d03f95e1dba8af', '0x4c82d1fbfe28c977cbb58d8c7ff8fcf9f70a2cca', '0x23617e59a5925b2a4bf75d73ff6711cd0b29de85', '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
    '0xe592427a0aece92de3edee1f18e0157c05861564', '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2', '0x28b5a0e9c621a5badaa536219b3a228c8168cf5d'],
  43114: ['0x794a61358d6845594f94dc1db02a252b5b4814ad', '0x94b75331ae8d42c1b61065089b7d48fe14aa73b7', '0xbb00ff08d01d300023c629e8ffffcb65a5a578ce', '0xe54ca86531e17ef3616d22ca28b0d458b6c89106',
    '0x28b5a0e9c621a5badaa536219b3a228c8168cf5d']
});
// The known spenders travel with the token map (tokensOf) under a symbol key : copied by Object.assign, invisible to Object.keys and JSON.
const SPENDERS = Symbol.for('holdup.knownSpenders');
// Defaults of the written intent ("nothing lasts after this operation") : beyond these, the request no longer matches.
const SIGN_MAX_S = 24 * 3600;        // a signature (permit, Permit2) or an exchange stays usable at most one day
const RIGHT_MAX_S = 31 * 24 * 3600;  // a Permit2 right expires within a month (the usual default of the public routers)
const ORDER_MAX_S = 366 * 24 * 3600; // a sale order stays valid at most a year
const FEE_MAX_WEI = 5n * 10n ** 17n;  // network fees : half a unit of the network's currency
const nowS = () => Math.floor(Date.now() / 1000);
function duration(seconds) {
  if (seconds > 50 * 365 * 86400) return 'sans limite de durée';
  if (seconds >= 2 * 365 * 86400) return 'pendant ' + Math.floor(seconds / (365 * 86400)) + ' ans';
  if (seconds >= 60 * 86400) return 'pendant ' + Math.floor(seconds / (30 * 86400)) + ' mois';
  if (seconds >= 2 * 86400) return 'pendant ' + Math.floor(seconds / 86400) + ' jours';
  return 'pendant ' + Math.max(1, Math.floor(seconds / 3600)) + ' heures';
}
const shortA = (a) => String(a).slice(0, 6) + '…' + String(a).slice(-4);

// ---------------------------------------------------------------- Sign-In with Ethereum (EIP-4361)
function messageText(m) {
  if (typeof m !== 'string') return '';
  if (!/^0x([0-9a-fA-F]{2})*$/.test(m)) return m;
  try { const b = new Uint8Array((m.length - 2) / 2); for (let i = 0; i < b.length; i++) b[i] = parseInt(m.substr(2 + 2 * i, 2), 16); return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (_) { return ''; }
}
const SIWE_HEAD = /^(?:[a-z][a-z0-9+.-]*:\/\/)?([^\s/]+) wants you to sign in with your Ethereum account:\n(0x[0-9a-fA-F]{40})\n\n/;
// Recognised only when the message names the real site (origin given by the browser) in its domain AND in its URI.
export function signIn(method, params, origin) {
  if (method !== 'personal_sign' || !Array.isArray(params)) return false;
  let url; try { url = new URL(origin); } catch (_) { return false; }
  if (!/^https?:$/.test(url.protocol) || !url.host) return false;
  const a = params[0], b = params[1];
  const msg = HEX20.test(String(a)) && typeof b === 'string' && !HEX20.test(b) ? b : a, account = msg === a ? b : a;
  const text = messageText(msg);
  if (!text || text.length > 4000) return false;
  const head = text.match(SIWE_HEAD);
  if (!head || head[1].toLowerCase() !== url.host.toLowerCase()) return false;
  if (HEX20.test(String(account)) && lc(account) !== lc(head[2])) return false;
  const field = (name) => { const m = text.match(new RegExp('^' + name + ': (.+)$', 'm')); return m ? m[1].trim() : ''; };
  let uri; try { uri = new URL(field('URI')); } catch (_) { return false; }
  return uri.origin === url.origin && field('Version') === '1' && /^[A-Za-z0-9]{8,}$/.test(field('Nonce'));
}

// ---------------------------------------------------------------- too vague : one follow-up question, never two
export const ASK = { pay: 'Combien, et à qui ?', who: 'À qui ? Colle l’adresse dans ta phrase.', swap: 'Combien, et de quel jeton ?', what: 'Que veux-tu faire, et pour combien ?' };
export function relance(intent) {
  if (!intent || !intent.clear) return ASK.what;
  if (PAY_KINDS.has(intent.kind)) return !intent.amount ? ASK.pay : !(intent.address || intent.named) ? ASK.who : null;
  if (intent.kind === 'buy_or_swap') return intent.amount ? null : ASK.swap;
  return null;
}

// ---------------------------------------------------------------- what the request carries (only the shapes this file needs)
const big = (v) => { try { return typeof v === 'bigint' ? v : v == null || v === '' ? 0n : BigInt(v); } catch (_) { return null; } };
const word = (data, i) => data.slice(10 + 64 * i, 74 + 64 * i);
const addrOf = (w) => '0x' + w.slice(24);
// Reads the data of ONE call into out ; true when it is a call this file knows how to read (approve, transfer, transferFrom...).
// ---- exchanges : the public router functions, read from the call itself (no simulation needed). Selectors are those of the public
// ABIs (Uniswap V2 family and its AVAX-named forks, Uniswap V3 SwapRouter and SwapRouter02, multicall, unwrapWETH9, sweepToken).
const uintAt = (data, i) => { const w = word(data, i); if (w.length !== 64) return null; try { return BigInt('0x' + w); } catch (_) { return null; } };
const addrAt = (data, i) => { const w = word(data, i); return w.length === 64 ? ('0x' + w.slice(24)).toLowerCase() : null; };
const slotOf = (data, i, base = 0) => { const off = uintAt(data, i); return off == null || off % 32n !== 0n || off > 200000n ? null : base + Number(off / 32n); };
function addrArrayAt(data, i) {
  const k = slotOf(data, i); if (k == null) return null;
  const n = uintAt(data, k); if (n == null || n < 2n || n > 8n) return null;
  const list = []; for (let j = 0; j < Number(n); j++) { const a = addrAt(data, k + 1 + j); if (!a) return null; list.push(a); }
  return list;
}
function bytesArrayAt(data, i) {
  const k = slotOf(data, i); if (k == null) return null;
  const n = uintAt(data, k); if (n == null || n > 32n) return null;
  const list = [];
  for (let j = 0; j < Number(n); j++) {
    const s = slotOf(data, k + 1 + j, k + 1); if (s == null) return null;
    const len = uintAt(data, s); if (len == null || len > 100000n) return null;
    const from = 10 + 64 * (s + 1), hex = data.slice(from, from + 2 * Number(len)); if (hex.length !== 2 * Number(len)) return null;
    list.push('0x' + hex);
  }
  return list;
}
// tokens-for-tokens 'tt', tokens-for-native 'tn', native-for-tokens 'nt' ; a capital letter : that side is the EXACT one (the other is a bound)
const V2_SWAPS = { '0x38ed1739': 'tt', '0x5c11d795': 'tt', '0x18cbafe5': 'tn', '0x791ac947': 'tn', '0x676528d1': 'tn', '0x762b1562': 'tn', '0x7ff36ab5': 'nt', '0xb6f9de95': 'nt', '0xa2a1623d': 'nt', '0xc57559dd': 'nt',
  '0x8803dbee': 'tT', '0x4a25d94a': 'tN', '0x7a42416a': 'tN', '0xfb3bdb41': 'nT', '0x8a657e67': 'nT' };
// exactInputSingle / exactOutputSingle : [recipient slot, deadline slot or -1, first amount slot]
const V3_SINGLE = { '0x414bf389': [3, 4, 5, false], '0x04e45aaf': [3, -1, 4, false], '0xdb3e2198': [3, 4, 5, true], '0x5023b4df': [3, -1, 4, true] };
const ROUTER_SENDER = '0x0000000000000000000000000000000000000001', ROUTER_SELF = '0x0000000000000000000000000000000000000002'; // SwapRouter02 : "the caller", "the router itself"
function swapFacts(sel, data, to, out, value) {
  const v2 = V2_SWAPS[sel];
  if (v2) {
    const nativeIn = v2[0] === 'n', exactOut = v2[1] !== v2[1].toLowerCase(), h = nativeIn ? 1 : 2;
    const path = addrArrayAt(data, h), rcpt = addrAt(data, h + 1), deadline = uintAt(data, h + 2), a0 = uintAt(data, 0), a1 = nativeIn ? null : uintAt(data, 1);
    if (!path || !rcpt || deadline == null || a0 == null || (!nativeIn && a1 == null)) return false;
    out.swaps.push({ router: to, tokenIn: nativeIn ? null : path[0], amountIn: nativeIn ? (value || 0n) : exactOut ? a1 : a0, tokenOut: v2[1].toLowerCase() === 'n' ? null : path[path.length - 1],
      minOut: nativeIn ? a0 : exactOut ? a0 : a1, exactOut, to: rcpt, deadline, usesValue: nativeIn, via: path.slice(1, -1) });
    return true;
  }
  const v3 = V3_SINGLE[sel];
  if (v3) {
    const [r, d, a, exactOut] = v3, x = uintAt(data, a), y = uintAt(data, a + 1), tin = addrAt(data, 0), tout = addrAt(data, 1), rcpt = addrAt(data, r);
    if (x == null || y == null || !tin || !tout || !rcpt) return false;
    out.swaps.push({ router: to, tokenIn: tin, amountIn: exactOut ? y : x, tokenOut: tout, minOut: exactOut ? x : y, exactOut, to: rcpt, deadline: d < 0 ? null : uintAt(data, d) });
    return true;
  }
  if (sel === '0xc04b8d59' || sel === '0xb858183f') { // exactInput((bytes path, address recipient, [uint256 deadline], uint256 amountIn, uint256 amountOutMinimum))
    const t = slotOf(data, 0), hasD = sel === '0xc04b8d59'; if (t == null) return false;
    const p = slotOf(data, t, t), rcpt = addrAt(data, t + 1), amountIn = uintAt(data, t + (hasD ? 3 : 2)), minOut = uintAt(data, t + (hasD ? 4 : 3)); if (p == null || !rcpt || amountIn == null || minOut == null) return false;
    const len = uintAt(data, p); if (len == null || len < 43n || len > 2000n) return false;
    const from = 10 + 64 * (p + 1), hex = data.slice(from, from + 2 * Number(len)); if (hex.length !== 2 * Number(len)) return false;
    out.swaps.push({ router: to, tokenIn: ('0x' + hex.slice(0, 40)).toLowerCase(), amountIn, tokenOut: ('0x' + hex.slice(-40)).toLowerCase(), minOut, exactOut: false, to: rcpt, deadline: hasD ? uintAt(data, t + 2) : null });
    return true;
  }
  return false;
}
function dataFacts(data, to, out, value = 0n, depth = 0) {
  if (!/^0x[0-9a-fA-F]*$/.test(data) || data.length < 10) return false;
  const sel = data.slice(0, 10).toLowerCase(), args = (data.length - 10) / 64;
  const amount = (i) => { try { return BigInt('0x' + word(data, i)); } catch (_) { return null; } };
  if ((sel === '0x095ea7b3' || sel === '0x39509351') && args >= 2) { // approve(spender, amount), increaseAllowance(spender, added)
    const raw = amount(1); if (raw != null && raw > 0n) out.grants.push({ token: to, spender: addrOf(word(data, 0)).toLowerCase(), raw, unlimited: raw >= UNLIMITED_FROM, adds: sel === '0x39509351' });
    return true;
  }
  if (sel === '0xa22cb465' && args >= 2) { const on = amount(1); if (on != null && on !== 0n) out.nftAll.push({ collection: to, operator: addrOf(word(data, 0)).toLowerCase() }); return true; } // setApprovalForAll(operator, approved)
  if (swapFacts(sel, data, to, out, value)) return true;
  if (sel === '0xac9650d8' || sel === '0x5ae401dc' || sel === '0x1f0464d1') { // multicall(bytes[]), multicall(deadline, bytes[]), multicall(previousBlockhash, bytes[])
    const inner = depth < 2 ? bytesArrayAt(data, sel === '0xac9650d8' ? 0 : 1) : null; if (!inner || !inner.length) return false;
    const deadline = sel === '0x5ae401dc' ? uintAt(data, 0) : null, first = out.swaps.length;
    let all = true; for (const d of inner) if (!dataFacts(d, to, out, value, depth + 1)) all = false;
    if (deadline != null) for (let i = first; i < out.swaps.length; i++) if (out.swaps[i].deadline == null) out.swaps[i].deadline = deadline;
    if (!all) out.unread++;
    return true;
  }
  if (sel === '0x49404b7c' && args >= 2) { const min = uintAt(data, 0), rcpt = addrAt(data, 1); if (min == null || !rcpt) return false; out.collects.push({ token: null, min, to: rcpt, router: to }); return true; } // unwrapWETH9(min, recipient)
  if (sel === '0x49616997' && args >= 1) { const min = uintAt(data, 0); if (min == null) return false; out.collects.push({ token: null, min, to: ROUTER_SENDER, router: to }); return true; } // unwrapWETH9(min) : to the caller
  if (sel === '0xdf2ab5bb' && args >= 3) { const tk = addrAt(data, 0), min = uintAt(data, 1), rcpt = addrAt(data, 2); if (!tk || min == null || !rcpt) return false; out.collects.push({ token: tk, min, to: rcpt, router: to }); return true; } // sweepToken(token, min, recipient)
  if (sel === '0xe90a182f' && args >= 2) { const tk = addrAt(data, 0), min = uintAt(data, 1); if (!tk || min == null) return false; out.collects.push({ token: tk, min, to: ROUTER_SENDER, router: to }); return true; }
  if (sel === '0x12210e8a') return true; // refundETH() : what was not used comes back to the caller
  if (sel === '0xa9059cbb' && args >= 2) { const raw = amount(1); if (raw != null) out.sends.push({ token: to, to: addrOf(word(data, 0)), raw }); return true; } // transfer(to, amount)
  if (sel === '0x23b872dd' && args >= 3) { const raw = amount(2); if (raw != null) out.sends.push({ token: to, to: addrOf(word(data, 1)), raw }); return true; } // transferFrom(from, to, amount)
  return false;
}
// One call. S3 : the native value is always counted when the call has no data, short data, or data this file reads (a transfer(...) that
// also carries 1 ETH sends 1 ETH). A call with data nobody here can read keeps its value out of the facts : its effect is measured (effect_sim.js).
// S8 : "data" and "input" are both read ; when they differ, the request is ambiguous (the wallet may prefer either) and can never match.
function txFacts(tx, out) {
  if (!tx || typeof tx !== 'object') return;
  const to = HEX20.test(String(tx.to || '')) ? lc(tx.to) : null;
  const d1 = typeof tx.data === 'string' ? tx.data : null, d2 = typeof tx.input === 'string' ? tx.input : null;
  if (d1 !== null && d2 !== null && lc(d1) !== lc(d2)) out.ambiguous = true;
  const payloads = [];
  if (d1 !== null && d1.length > 2) payloads.push(d1);
  if (d2 !== null && d2.length > 2 && (d1 === null || lc(d2) !== lc(d1))) payloads.push(d2);
  const value = big(tx.value);
  if (value == null && tx.value != null && tx.value !== '') out.ambiguous = true; // an amount nobody can read
  // the network or the account the transaction names, when it names one : it must be the one the wallet is on
  if (out.chain != null && tx.chainId != null && tx.chainId !== '') { const c = big(tx.chainId); if (c != null && Number(c) !== out.chain) out.otherChain = true; }
  if (out.me && HEX20.test(String(tx.from || '')) && lc(tx.from) !== out.me) out.otherFrom = true;
  // the most this transaction may cost in network fees, when the request sets both the gas and its price
  { const gas = big(tx.gas != null ? tx.gas : tx.gasLimit), price = big(tx.maxFeePerGas != null ? tx.maxFeePerGas : tx.gasPrice); if (gas && price && gas > 0n && price > 0n && gas * price > out.fee) out.fee = gas * price; }
  if (!to) return;
  let readable = payloads.length === 0;
  const firstSwap = out.swaps.length;
  for (const p of payloads) { if (p.length < 10 && /^0x[0-9a-fA-F]*$/.test(p)) readable = true; else if (dataFacts(p, to, out, value || 0n)) readable = true; else out.unread++; }
  // The value joined to an exchange is the amount exchanged when the exchange takes the network's currency (or wraps exactly that amount) ;
  // joined to anything else this file reads, it is one more thing that leaves.
  let used = false;
  if (value && value > 0n) for (let i = firstSwap; i < out.swaps.length; i++) { const s = out.swaps[i]; if (s.usesValue) used = true; else if (s.amountIn === value && !used) { s.nativeIn = true; used = true; } }
  if (readable && value && value > 0n && !used) out.sends.push({ token: null, to, raw: value });
}
function typedFacts(params, out) {
  let td = params.find((p) => (p && typeof p === 'object' && !Array.isArray(p)) || (typeof p === 'string' && !HEX20.test(p)));
  if (typeof td === 'string') { try { td = JSON.parse(td); } catch (_) { return; } }
  if (!td || typeof td !== 'object') return;
  const m = td.message && typeof td.message === 'object' ? td.message : {}, d = td.domain && typeof td.domain === 'object' ? td.domain : {};
  // until : when the RIGHT itself ends (Permit2 expiration) ; sigUntil : until when the SIGNATURE can be used (deadline, sigDeadline, expiry)
  const when = (v) => { const x = big(v); return x == null || v == null || v === '' ? null : x; };
  const grant = (token, spender, v, until, sigUntil) => {
    const raw = big(v); if (raw == null || raw <= 0n || !HEX20.test(String(token || ''))) return;
    out.grants.push({ token: lc(token), spender: HEX20.test(String(spender || '')) ? lc(spender) : null, raw, unlimited: raw >= UNLIMITED_FROM, signed: true, until: when(until), sigUntil: when(sigUntil) });
  };
  const each = (x) => (Array.isArray(x) ? x : x && typeof x === 'object' ? [x] : []);
  if (out.chain != null && d.chainId != null && d.chainId !== '') { const c = big(d.chainId); if (c != null && Number(c) !== out.chain) out.otherChain = true; }
  if (td.primaryType === 'Permit') {
    if (m.value != null) grant(d.verifyingContract, m.spender, m.value, null, m.deadline);
    else if (m.allowed === true || m.allowed === 'true') grant(d.verifyingContract, m.spender, UNLIMITED_FROM, null, m.expiry); // DAI-style permit : all or nothing
  } else if (td.primaryType === 'PermitSingle' || td.primaryType === 'PermitBatch') for (const x of each(m.details)) grant(x.token, m.spender, x.amount, x.expiration, m.sigDeadline);
  else if (/^Permit(Batch)?(Witness)?TransferFrom$/.test(String(td.primaryType))) for (const x of each(m.permitted)) grant(x.token, m.spender, x.amount, null, m.deadline);
  // a market order (Seaport shape) : what I offer, what I get and who gets it, until when
  else if (HEX20.test(String(m.offerer || '')) && Array.isArray(m.offer) && Array.isArray(m.consideration) && m.offer.length <= 64 && m.consideration.length <= 64) {
    const item = (x) => { const amount = big(x && (x.endAmount != null ? x.endAmount : x.startAmount)), type = Number(x && x.itemType); return amount == null || !Number.isInteger(type) ? null : { type, token: HEX20.test(String(x.token || '')) ? lc(x.token) : null, id: String(x.identifierOrCriteria), amount, to: HEX20.test(String(x.recipient || '')) ? lc(x.recipient) : null }; };
    const offer = m.offer.map(item), cons = m.consideration.map(item);
    if (offer.every(Boolean) && cons.every(Boolean)) out.orders.push({ offerer: lc(m.offerer), offer, cons, end: when(m.endTime) }); else out.unread++;
  }
}
export function requestFacts(body) {
  const out = { grants: [], sends: [], swaps: [], collects: [], orders: [], nftAll: [], fee: 0n, unread: 0, tooBig: false, ambiguous: false, otherChain: false, otherFrom: false, me: null, chain: null };
  const method = body && typeof body.method === 'string' ? body.method : '', params = body && Array.isArray(body.params) ? body.params : [];
  // the account and the network the wallet is on, as the page's provider reported them with the request
  if (body && HEX20.test(String(body.from || ''))) out.me = lc(body.from);
  if (body && body.chainId != null && body.chainId !== '') { const c = big(body.chainId); if (c != null && c >= 0n && c < 2n ** 48n) out.chain = Number(c); }
  try {
    if (method === 'eth_sendTransaction' || method === 'eth_signTransaction') txFacts(params[0], out);
    else if (method === 'wallet_sendCalls') { // S8 : every call is read, up to a high limit ; beyond it the request is "not verified", never "match"
      const calls = params[0] && Array.isArray(params[0].calls) ? params[0].calls : [];
      if (calls.length > MAX_CALLS) out.tooBig = true;
      for (let i = 0; i < calls.length && i < MAX_CALLS; i++) txFacts(calls[i], out);
    }
    else if (/^eth_signTypedData/.test(method)) typedFacts(params, out);
  } catch (_) { /* unreadable : no fact, the engine verdict stands */ }
  return out;
}

// ---------------------------------------------------------------- amounts
function toRaw(amount, decimals) {
  const m = String(amount).match(/^(\d+)(?:\.(\d+))?$/); if (!m) return null;
  const frac = (m[2] || '').replace(/0+$/, ''); if (frac.length > decimals) return null;
  return BigInt(m[1]) * 10n ** BigInt(decimals) + BigInt((frac || '0').padEnd(decimals, '0') || '0');
}
function fromRaw(raw, decimals) {
  const base = 10n ** BigInt(decimals), int = raw / base;
  const frac = (raw % base).toString().padStart(decimals, '0').slice(0, 6).replace(/0+$/, '');
  if (int === 0n && !frac && raw > 0n) return 'moins de 0,000001';
  return int.toString().replace(/\B(?=(\d{3})+$)/g, ' ') + (frac ? ',' + frac : '');
}
const fr = (amount) => String(amount).replace('.', ',');
export function tokensOf(contexte, chainId) {
  let chain; try { chain = chainId == null || chainId === '' ? undefined : Number(BigInt(chainId)); } catch (_) { chain = undefined; }
  const list = contexte && typeof contexte === 'object' && Array.isArray(contexte.tokens) ? contexte.tokens.slice(0, 5000) : [];
  const map = {};
  for (const a of Object.keys(BUILTIN_TOKENS)) map[a] = { symbol: BUILTIN_TOKENS[a].symbol, decimals: BUILTIN_TOKENS[a].decimals };
  for (const t of list) {
    if (!t || !HEX20.test(String(t.address || '')) || typeof t.symbol !== 'string' || !/^[A-Za-z0-9.$_-]{1,12}$/.test(t.symbol) || !Number.isInteger(t.decimals) || t.decimals < 0 || t.decimals > 36) continue;
    let own; try { own = t.chainId == null || t.chainId === '' ? undefined : Number(BigInt(t.chainId)); } catch (_) { own = undefined; }
    if (own === undefined || chain === undefined || own === chain) map[lc(t.address)] = { symbol: t.symbol, decimals: t.decimals };
  }
  // who a right may be given to : the public list of this network, plus what the person declared (settings)
  const spenders = new Set(BUILTIN_SPENDERS.any.concat(BUILTIN_SPENDERS[chain] || []));
  const own = contexte && typeof contexte === 'object' && Array.isArray(contexte.knownSpenders) ? contexte.knownSpenders.slice(0, 5000) : [];
  for (const a of own) if (HEX20.test(String(a || ''))) spenders.add(lc(a));
  map[SPENDERS] = spenders;
  return map;
}
// null : the caller gave no list (a token map not built by tokensOf) -> the spender is not judged.
const spendersOf = (tokens) => (tokens && tokens[SPENDERS] instanceof Set ? tokens[SPENDERS] : null);
// The asset of the request, as the person can read it. A token nobody here knows by its address (built-in list, local context) is NOT read
// with the symbol written : it is flagged `unknown`, and a request that carries one can never match (S2). Its amount is still compared,
// with the usual decimals of the written symbol, so that a clear gap is still reported as a gap.
// `chain` (optional) : the network's own currency is then named, and a written symbol that is not that currency is "another asset".
// Everyday money ("50 dollars", written === MONEY) : only a stable token known by its address is that money ; the network's currency or any
// other known token is another asset ; a token nobody knows cannot be verified.
function assetOf(token, written, tokens, chain) {
  const money = written === MONEY;
  if (token == null) {
    const nat = chain != null ? NATIVE[chain] : null;
    if (money || TOKEN_ONLY.has(written)) return { symbol: nat || null, decimals: 18, other: true };
    if (nat) return { symbol: nat, decimals: 18, other: nat !== written };
    return { symbol: written, decimals: 18 };
  }
  const known = tokens && tokens[token];
  if (known && money) return known.declared ? { symbol: known.symbol, decimals: known.decimals, unknown: true } : { symbol: known.symbol, decimals: known.decimals, other: !STABLE.has(baseSym(known.symbol)) };
  if (known) return { symbol: known.symbol, decimals: known.decimals, other: known.symbol.toUpperCase() !== written };
  return { symbol: money ? 'd’un jeton inconnu' : written, decimals: SYMBOL_DECIMALS[written] != null ? SYMBOL_DECIMALS[written] : 18, unknown: true };
}
// One side of an EXCHANGE, as the request names it : { symbol, decimals, family } or { unknown } (token nobody here knows by its address).
function legOf(token, tokens, chain) {
  if (token == null) { const nat = chain != null ? NATIVE[chain] : null; return nat ? { symbol: nat, decimals: 18, family: fam(nat), native: true } : { symbol: null, decimals: 18, family: null, native: true }; }
  const known = tokens && tokens[token];
  if (known && !known.declared) return { symbol: known.symbol, decimals: known.decimals, family: fam(known.symbol) };
  return { unknown: true, symbol: null, decimals: null, family: null };
}

// A request that cannot be read in full, or that carries a token nobody here knows, never matches : at most "not verified" (S2, S8).
export function writtenCheck(body, intent, tokens = {}) {
  if (!intent || !intent.amount || !intent.symbol) return null;
  const facts = requestFacts(body), flags = { unknown: false, cannot: null };
  const r = writtenCore(facts, intent, tokens, flags);
  const why = facts.tooBig ? 'Cette demande contient trop d’appels pour que je les lise tous.' : facts.ambiguous ? 'Cette demande se lit de deux façons différentes : je ne peux pas la vérifier.' : null;
  if (r && r.outcome === 'match') {
    if (why) return { outcome: 'unverifiable', line: why };
    if (flags.unknown) return { outcome: 'unverifiable', line: intent.symbol === MONEY ? 'Je ne connais pas ce jeton : je ne peux pas vérifier qu’il vaut des dollars.' : 'Je ne connais pas ce jeton : je ne peux pas vérifier qu’il s’agit bien de ' + intent.symbol + '.' };
    if (flags.cannot) return { outcome: 'unverifiable', line: flags.cannot };
  }
  if (!r && why && (facts.grants.length || facts.sends.length || facts.swaps.length)) return { outcome: 'unverifiable', line: why };
  if (!r && flags.cannot) return { outcome: 'unverifiable', line: flags.cannot };
  return r;
}
// The written amount, read every way it can be read ("1,500" : 1500 or 1.5). A request exceeds it only when it exceeds every reading.
function readings(intent, decimals) { return [intent.amount, intent.amountAlt].filter((a) => a != null && a !== '').map((a) => toRaw(a, decimals)).filter((x) => x != null); }
const exceeds = (raw, intent, decimals) => { const w = readings(intent, decimals); return !w.length || w.every((x) => raw > x); };
const isExactly = (raw, intent, decimals) => readings(intent, decimals).some((x) => raw === x);
const tiny = (raw, decimals) => raw === 0n || (decimals != null && decimals >= 6 && raw * 1000000n <= 10n ** BigInt(decimals)); // nothing, or less than a millionth of a unit

function writtenCore(facts, intent, tokens, flags) {
  const money = intent.symbol === MONEY, chain = facts.chain, me = facts.me, now = nowS();
  const said = 'Tu as écrit ' + fr(intent.amount) + ' ' + (money ? 'dollars' : intent.symbol) + '.';
  const reduce = money ? '' : ' Réduis le plafond à ' + fr(intent.amount) + ' ' + intent.symbol + ' dans ton portefeuille.';
  const pay = PAY_KINDS.has(intent.kind), get = intent.side === 'get';
  const known = spendersOf(tokens);
  const mine = (a) => !!a && (a === ROUTER_SENDER || (me != null && a === me));
  let line = null;
  // 0) another network, or another account, than the one the wallet is on
  if (facts.otherChain) return { outcome: 'mismatch', line: 'Cette demande vaut sur un autre réseau que celui où tu es.' };
  if (facts.otherFrom) return { outcome: 'mismatch', line: 'Cette demande part d’un autre compte que celui que tu utilises.' };
  // normal fees : a request that may cost half a unit of the network's currency or more in fees is not what anybody writes
  // (only where one unit of that currency is worth a lot : ETH, AVAX, BNB ; elsewhere the threshold would mean nothing)
  if (facts.fee >= FEE_MAX_WEI && chain != null && ['ETH', 'AVAX', 'BNB'].includes(NATIVE[chain])) return { outcome: 'mismatch', line: 'Cette demande peut te coûter jusqu’à ' + fromRaw(facts.fee, 18) + ' ' + ((chain != null && NATIVE[chain]) || 'unités du réseau') + ' de frais.' };
  // A wider right can be corrected (capped to the written amount) only when it comes from a transaction, nothing else leaves
  // in the same request, and no right of the request is a signature.
  const fixable = facts.sends.length === 0 && facts.swaps.length === 0 && facts.grants.every((x) => !x.signed);
  // 1) a spending right against the written amount
  for (const g of facts.grants) {
    const a = assetOf(g.token, intent.symbol, tokens), want = toRaw(intent.amount, a.decimals);
    if (a.unknown) flags.unknown = true;
    // A transaction's ceiling can be edited in the wallet before confirming ; a signature's cannot.
    if (g.unlimited) return { outcome: 'mismatch', line: said + (g.signed ? ' Cette signature donne accès à tout ton ' + a.symbol + ' et ne peut pas être limitée.' : ' La demande donne accès à tout ton ' + a.symbol + '.' + reduce), ...(g.signed || money ? {} : { fixable }) };
    // the written amount is what I GET ("acheter 0,5 WETH") : what I give is not written, a right on it cannot be compared
    if (get && !intent.nft) { flags.cannot = 'Tu n’as pas écrit combien tu donnes : je ne peux pas vérifier ce droit.'; continue; }
    if (a.other) return { outcome: 'mismatch', line: said + ' La demande donne accès à ' + fromRaw(g.raw, a.decimals) + ' ' + a.symbol + '.' };
    if (want == null || exceeds(g.raw, intent, a.decimals)) return { outcome: 'mismatch', line: said + (g.signed ? ' Cette signature donne accès à ' + fromRaw(g.raw, a.decimals) + ' ' + a.symbol + ' et ne peut pas être limitée.' : ' La demande donne accès à ' + fromRaw(g.raw, a.decimals) + ' ' + a.symbol + '.' + reduce), ...(g.signed || money || intent.amountAlt ? {} : { fixable }) };
    // nothing lasts after this operation : a right or a signature that stays usable for long is not what was written
    if (g.until != null && g.until > BigInt(now + RIGHT_MAX_S)) return { outcome: 'mismatch', line: 'Ce droit ne s’arrête pas après ton opération : il reste ouvert ' + duration(Number(g.until > 2n ** 40n ? 2n ** 40n : g.until) - now) + '.' };
    if (g.sigUntil != null && g.sigUntil > BigInt(now + SIGN_MAX_S)) return { outcome: 'mismatch', line: 'Cette signature reste utilisable ' + duration(Number(g.sigUntil > 2n ** 40n ? 2n ** 40n : g.sigUntil) - now) + '.' };
    // who gets the right : a contract of the public list or of the settings, or the very contract that does the exchange in the same request
    if (known && g.spender && !known.has(g.spender)) {
      const routers = facts.swaps.map((s) => s.router);
      if (routers.length && !routers.includes(g.spender)) return { outcome: 'mismatch', line: 'Le droit est donné à ' + shortA(g.spender) + ', une autre adresse que celle qui fait l’échange.' };
      if (!routers.length) flags.cannot = 'Tu donnes ce droit à ' + shortA(g.spender) + ', une adresse que je ne connais pas.';
    }
    // increaseAllowance adds to the right that already exists : the total is not in the request
    if (g.adds && !flags.cannot) flags.cannot = 'Cette demande ajoute ' + fromRaw(g.raw, a.decimals) + ' ' + a.symbol + ' au droit déjà donné : je ne peux pas vérifier le total.';
    line = 'La demande donne accès à ' + fromRaw(g.raw, a.decimals) + ' ' + a.symbol + ', pas plus.';
  }
  const sendText = (s) => { const a = assetOf(s.token, intent.symbol, tokens, chain); return s.token == null ? (a.symbol ? fromRaw(s.raw, 18) + ' ' + a.symbol : 'de la monnaie du réseau') : a.unknown ? 'un jeton que je ne connais pas' : fromRaw(s.raw, a.decimals) + ' ' + a.symbol; };
  // 2) a payment : recipient and amount must be the ones written
  const payment = () => {
    for (const s of facts.sends) {
      const a = assetOf(s.token, intent.symbol, tokens, chain);
      if (a.unknown) flags.unknown = true;
      if (a.other) return { outcome: 'mismatch', line: said + ' La demande envoie ' + (a.symbol ? fromRaw(s.raw, a.decimals) + ' ' + a.symbol : 'la monnaie du réseau') + '.' };
      if (!isExactly(s.raw, intent, a.decimals)) return { outcome: 'mismatch', line: said + ' La demande envoie ' + fromRaw(s.raw, a.decimals) + ' ' + a.symbol + '.' };
      if (intent.address && lc(s.to) !== lc(intent.address)) return { outcome: 'mismatch', line: 'Le destinataire de la demande n’est pas l’adresse que tu as écrite.', address_diff: { expected: intent.address, actual: s.to } };
    }
    if (!intent.address) return { outcome: 'unverifiable', line: 'Tu n’as pas écrit d’adresse : je ne peux pas vérifier le destinataire.' };
    return { outcome: 'match', line: null };
  };
  if (pay) {
    if (facts.swaps.length || facts.orders.length) return { outcome: 'mismatch', line: said + ' Cette demande n’est pas un paiement : c’est un échange.' };
    if (!facts.sends.length) return facts.grants.length ? { outcome: 'match', line } : { outcome: 'unverifiable', line: 'Je ne retrouve pas ce paiement dans la demande.' };
    return payment();
  }
  // 3) anything that is not a payment : nothing else may leave. A transfer or a value sent next to a right or an exchange is one thing more ;
  //    a request that only sends (transfer, bare value) is not the operation written, unless the sentence names who receives it.
  const away = facts.sends.filter((s) => !mine(s.to));
  if (away.length) {
    if (facts.grants.length || facts.swaps.length || facts.orders.length) return { outcome: 'mismatch', line: said + ' La demande envoie aussi ' + sendText(away[0]) + ' à une autre adresse.' };
    if (!facts.unread && intent.kind === 'buy_or_swap') { // only when the sentence was understood as an exchange, a purchase, a sale or a right
      if (intent.nft && !get && known && away.every((s) => s.token == null && known.has(s.to))) return null; // buying an NFT pays a marketplace of the public list or of the settings : the engine's verdict stands
      if (intent.address && !(intent.facts && intent.facts.grant)) return payment(); // a named recipient makes it a payment, unless the sentence gives a right
      return { outcome: 'mismatch', line: said + ' Cette demande envoie ' + sendText(away[0]) + ' à une autre adresse, sans rien te rendre.' };
    }
  }
  // a right on a whole NFT collection is never what a sentence with one amount says. Selling one NFT may need it for a marketplace of the
  // public list or of the settings : even then it is wider than the sale, and it cannot be said to match.
  for (const n of facts.nftAll) {
    const sale = intent.nft && get && known && known.has(n.operator);
    if (!sale) return { outcome: 'mismatch', line: said + ' Cette demande donne à ' + shortA(n.operator) + ' accès à tous tes NFT de cette collection.' };
    flags.cannot = 'Cette demande donne accès à tous tes NFT de cette collection, pas seulement à celui que tu vends.';
  }
  // 4) an exchange read in the call : what I give, what I get, how much at least, on which account, until when
  const wantOut = intent.counter || null; // "contre AVAX" (side give) or "avec des USDC" (side get) : the other side, when written
  let swapLine = null;
  for (const s of facts.swaps) {
    const li = legOf(s.nativeIn ? null : s.tokenIn, tokens, chain);
    // where the output really goes : straight to the recipient, or held by the router then unwrapped / swept
    let outToken = s.tokenOut, rcpt = s.to, minOut = s.minOut;
    if (rcpt === ROUTER_SELF || rcpt === s.router) {
      const c = facts.collects.find((x) => x.router === s.router && (x.token == null || x.token === s.tokenOut));
      if (!c) { flags.cannot = 'Je ne vois pas sur quel compte arrive ce que tu reçois.'; rcpt = null; }
      else { rcpt = c.to; if (c.token == null) outToken = null; if (c.min > 0n && (minOut === 0n || c.token == null)) minOut = c.min; }
    }
    const lo = legOf(outToken, tokens, chain);
    if ((s.via || []).some((t) => legOf(t, tokens, chain).unknown) && !flags.cannot) flags.cannot = 'Cet échange passe par un jeton que je ne connais pas.';
    const inText = li.unknown ? 'un jeton que je ne connais pas' : fromRaw(s.amountIn, li.decimals) + ' ' + (li.symbol || 'de la monnaie du réseau');
    const outText = lo.unknown ? 'un jeton que je ne connais pas' : fromRaw(minOut, lo.decimals) + ' ' + (lo.symbol || 'de la monnaie du réseau');
    if (rcpt && !mine(rcpt)) return { outcome: 'mismatch', line: 'Ce que tu dois recevoir part sur un autre compte que le tien (' + shortA(rcpt) + ').' };
    const given = get ? wantOut : (money ? null : intent.symbol), got = get ? intent.symbol : wantOut;
    // what I give
    if (money && !get) { if (li.unknown) flags.unknown = true; else if (!STABLE.has(baseSym(li.symbol))) return { outcome: 'mismatch', line: said + ' La demande échange ' + inText + '.' }; }
    else if (given) { if (li.unknown) flags.unknown = true; else if (li.family && li.family !== fam(given)) return { outcome: 'mismatch', line: (get ? 'Tu as écrit payer en ' + given + '.' : said) + ' La demande échange ' + inText + '.' }; }
    if (!get && !li.unknown && li.decimals != null && exceeds(s.amountIn, intent, li.decimals)) return { outcome: 'mismatch', line: said + ' La demande échange ' + inText + '.' };
    // what I get
    if (got) {
      if (lo.unknown) { if (!flags.cannot) flags.cannot = 'Je ne connais pas le jeton que cette demande te rend : je ne peux pas vérifier que c’est du ' + got + '.'; }
      else if (lo.family && lo.family !== fam(got)) return { outcome: 'mismatch', line: 'Tu as écrit ' + (get ? fr(intent.amount) + ' ' + got : 'contre ' + got) + '. La demande te rend du ' + lo.symbol + '.' };
    }
    if (get && !lo.unknown && lo.decimals != null) { const w = toRaw(intent.amount, lo.decimals); if (w == null || minOut * 10n < w * 8n) return { outcome: 'mismatch', line: said + ' La demande te garantit seulement ' + outText + '.' }; }
    // how much at least
    if (!s.exactOut && !lo.unknown && tiny(minOut, lo.decimals)) return { outcome: 'mismatch', line: 'La demande accepte que tu ne reçoives presque rien en échange (minimum garanti : ' + outText + ').' };
    if (!s.exactOut && lo.unknown && minOut === 0n) return { outcome: 'mismatch', line: 'La demande accepte que tu ne reçoives rien en échange.' };
    if (intent.min && !lo.unknown && lo.family === fam(intent.min.symbol)) { const w = toRaw(intent.min.amount, lo.decimals); if (w != null && minOut * 100n < w * 99n) return { outcome: 'mismatch', line: 'Tu as écrit au moins ' + fr(intent.min.amount) + ' ' + intent.min.symbol + '. La demande te garantit seulement ' + outText + '.' }; }
    // two stable tokens are worth the same : a guaranteed minimum under half of what is given is not an exchange at a normal price
    if (!s.exactOut && !li.unknown && !lo.unknown && STABLE.has(baseSym(li.symbol)) && STABLE.has(baseSym(lo.symbol)) && minOut * 10n ** BigInt(li.decimals) * 2n < s.amountIn * 10n ** BigInt(lo.decimals)) return { outcome: 'mismatch', line: 'La demande te garantit seulement ' + outText + ' pour ' + inText + '.' };
    // until when
    if (s.deadline != null && s.deadline > BigInt(now + SIGN_MAX_S)) return { outcome: 'mismatch', line: 'Cet échange reste exécutable ' + duration(Number(s.deadline > 2n ** 40n ? 2n ** 40n : s.deadline) - now) + ', pas seulement maintenant.' };
    if (!lo.unknown && !li.unknown) swapLine = 'La demande échange ' + inText + ' contre au moins ' + outText + ', sur ton compte.';
  }
  // something collected by the router goes to another account (unwrap, sweep)
  const stray = facts.collects.find((c) => !mine(c.to));
  if (stray) return { outcome: 'mismatch', line: 'Ce que tu dois recevoir part sur un autre compte que le tien (' + shortA(stray.to) + ').' };
  // 5) a market order about an NFT (sale, or purchase offer), when the sentence is about an NFT
  let orderLine = null;
  if (intent.nft) for (const o of facts.orders) {
    const nftOut = o.offer.filter((x) => x.type >= 2), moneyOut = o.offer.filter((x) => x.type < 2), nftIn = o.cons.filter((x) => x.type >= 2), moneyIn = o.cons.filter((x) => x.type < 2);
    const leg = (x) => legOf(x.type === 0 ? null : x.token, tokens, chain);
    if (me && o.offerer !== me) return { outcome: 'mismatch', line: 'Cet ordre est signé au nom d’un autre compte que le tien.' };
    if (o.end != null && o.end > BigInt(now + ORDER_MAX_S)) return { outcome: 'mismatch', line: 'Cet ordre reste utilisable ' + duration(Number(o.end > 2n ** 40n ? 2n ** 40n : o.end) - now) + '.' };
    if (get) { // a sale : one NFT leaves, the written price comes to me
      if (moneyOut.length) return { outcome: 'mismatch', line: 'Tu as écrit une vente. Cet ordre te fait aussi donner des jetons.' };
      if (nftOut.some((x) => x.type >= 4)) return { outcome: 'mismatch', line: 'Cet ordre met en vente toute la collection, pas un seul NFT.' };
      if (nftOut.length !== 1 || nftOut[0].amount !== 1n) return { outcome: 'mismatch', line: 'Cet ordre met en vente ' + (nftOut.length || 'aucun') + ' NFT, pas un seul.' };
      if (intent.nftId && nftOut[0].id !== intent.nftId) return { outcome: 'mismatch', line: 'Cet ordre met en vente le NFT n° ' + nftOut[0].id.slice(0, 12) + ', pas le n° ' + intent.nftId + '.' };
      let toMe = 0n, total = 0n, dec = null, sym = null, unknownLeg = false;
      for (const x of moneyIn) { const l = leg(x); if (!l.unknown && l.family === fam(intent.symbol)) total += x.amount; if (!mine(x.to)) continue; if (l.unknown || !l.family) { unknownLeg = true; continue; } if (l.family !== fam(intent.symbol)) return { outcome: 'mismatch', line: said + ' Cet ordre te paie en ' + l.symbol + '.' }; toMe += x.amount; dec = l.decimals; sym = l.symbol; }
      if (unknownLeg && toMe === 0n) { flags.unknown = true; orderLine = ''; continue; }
      if (toMe === 0n) return { outcome: 'mismatch', line: moneyIn.length ? 'Le prix de cette vente est versé à une autre adresse que la tienne.' : 'Cet ordre donne ton NFT sans rien te verser.' };
      const want = toRaw(intent.amount, dec);
      if (want == null || total * 100n < want * 99n) return { outcome: 'mismatch', line: said + ' Cet ordre vend pour ' + fromRaw(total, dec) + ' ' + sym + '.' };
      if (toMe * 10n < want * 9n) return { outcome: 'mismatch', line: said + ' Cet ordre te verse seulement ' + fromRaw(toMe, dec) + ' ' + sym + '.' };
      orderLine = 'Cet ordre vend ton NFT n° ' + nftOut[0].id.slice(0, 12) + ' et te verse ' + fromRaw(toMe, dec) + ' ' + sym + '.';
    } else { // a purchase offer : at most the written price leaves, the NFT comes to me
      if (nftOut.length) return { outcome: 'mismatch', line: 'Tu as écrit un achat. Cet ordre met en vente un de tes NFT.' };
      let offered = 0n, dec = null, sym = null;
      for (const x of moneyOut) { const l = leg(x); if (l.unknown || !l.family) { flags.unknown = true; continue; } if (!money && l.family !== fam(intent.symbol)) return { outcome: 'mismatch', line: said + ' Cet ordre offre des ' + l.symbol + '.' }; if (money && !STABLE.has(baseSym(l.symbol))) return { outcome: 'mismatch', line: said + ' Cet ordre offre des ' + l.symbol + '.' }; offered += x.amount; dec = l.decimals; sym = l.symbol; }
      if (dec != null && exceeds(offered, intent, dec)) return { outcome: 'mismatch', line: said + ' Cet ordre offre ' + fromRaw(offered, dec) + ' ' + sym + '.' };
      const forMe = nftIn.filter((x) => mine(x.to));
      if (!forMe.length) return { outcome: 'mismatch', line: nftIn.length ? 'Le NFT acheté irait sur un autre compte que le tien.' : 'Cet ordre ne te donne aucun NFT en échange.' };
      if (intent.nftId && !forMe.some((x) => x.type >= 4 || x.id === intent.nftId)) return { outcome: 'mismatch', line: 'Cet ordre achète un autre NFT que le n° ' + intent.nftId + '.' };
      if (dec != null) orderLine = 'Cet ordre offre ' + fromRaw(offered, dec) + ' ' + sym + ' pour un NFT livré sur ton compte.';
    }
  }
  if (facts.unread && !facts.grants.length) return null; // part of the request is not read here : the engine's verdict stands
  if (facts.swaps.length) return { outcome: 'match', line: swapLine || line };
  if (facts.nftAll.length) return { outcome: 'match', line };
  if (orderLine != null) return { outcome: 'match', line: orderLine || null };
  return facts.grants.length ? { outcome: 'match', line } : null;
}

// ---------------------------------------------------------------- the measured effect of an unreadable call (effect_sim.js)
// The token is named by the chain (or by the local context when it knows the address). The written symbol must be that name, or
// part of it ("USDC" for "USDC.e", "AVAX" for "WAVAX") : a valuable token carries its own name, a copy that borrows it is worth nothing.
const sameSymbol = (asset, written) => {
  if (!asset.symbol) return false;
  const s = asset.symbol.toUpperCase();
  return asset.known ? s === written : s === written || (written.length >= 3 && s.includes(written)) || (s.length >= 3 && written.includes(s));
};
const list = (items) => (items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + ' et ' + items[items.length - 1]);
export function effectCheck(effect, intent) {
  if (!effect || !effect.ok || !intent || !intent.amount || !intent.symbol) return null;
  const said = 'Tu as écrit ' + fr(intent.amount) + ' ' + intent.symbol + '.';
  const name = (a) => (a.token == null ? 'de la monnaie du réseau' : a.decimals == null || !a.symbol ? 'un jeton que je ne sais pas lire' : fromRaw(BigInt(a.raw), a.decimals) + ' ' + a.symbol);
  if (effect.nftRight) return { outcome: 'mismatch', line: said + ' La demande donne aussi accès à tes NFT.' };
  if (effect.grants.length) { const g = effect.grants[0]; return { outcome: 'mismatch', line: said + ' La demande donne aussi accès à ' + (g.unlimited ? 'tout ton ' + (g.symbol || 'jeton') : name(g)) + '.' }; }
  if (effect.nftOut) return { outcome: 'mismatch', line: said + ' La demande fait sortir un NFT de ton compte.' };
  if (!effect.out.length) return { outcome: 'unverifiable', line: 'D’après la simulation, rien ne sort de ton compte avec cette demande.' };
  if (effect.out.length > 1) return { outcome: 'mismatch', line: said + ' La demande fait sortir ' + list(effect.out.map(name)) + ' de ton compte.' };
  const o = effect.out[0];
  const native = o.token == null, a = native ? assetOf(null, intent.symbol, {}) : o;
  if (native && a.other) return { outcome: 'mismatch', line: said + ' La demande fait sortir de la monnaie du réseau de ton compte.' };
  if (!native && (!o.symbol || o.decimals == null)) return { outcome: 'unverifiable', line: 'Je ne sais pas lire le jeton qui sort de ton compte.' };
  const shown = fromRaw(BigInt(o.raw), a.decimals) + ' ' + (native ? intent.symbol : o.symbol);
  if (!native && !sameSymbol(o, intent.symbol)) return { outcome: 'mismatch', line: said + ' La demande fait sortir ' + shown + ' de ton compte.' };
  const want = toRaw(intent.amount, a.decimals), raw = BigInt(o.raw);
  const pay = PAY_KINDS.has(intent.kind);
  if (want == null || raw > want || (pay && raw !== want)) return { outcome: 'mismatch', line: said + ' La demande fait sortir ' + shown + ' de ton compte.' };
  if (pay) {
    if (!intent.address) return { outcome: 'unverifiable', line: 'Tu n’as pas écrit d’adresse : je ne peux pas vérifier le destinataire.' };
    const other = o.to.find((x) => lc(x) !== lc(intent.address));
    if (other) return { outcome: 'mismatch', line: 'Le destinataire de la demande n’est pas l’adresse que tu as écrite.', address_diff: { expected: intent.address, actual: other } };
    if (!o.to.length) return { outcome: 'unverifiable', line: 'Je ne peux pas vérifier le destinataire de cette demande.' };
    return { outcome: 'match', measured: true, line: 'D’après la simulation, ' + shown + ' sortent de ton compte vers l’adresse que tu as écrite.' };
  }
  if (intent.kind !== 'buy_or_swap') return { outcome: 'mismatch', line: said + ' La demande fait sortir ' + shown + ' de ton compte.' };
  // an exchange : something else must come back
  const back = effect.in.filter((x) => x.token !== o.token);
  if (!back.length && !effect.nftIn) return { outcome: 'mismatch', line: said + ' La demande fait sortir ' + shown + ' de ton compte et rien n’y entre en échange.' };
  const got = back.length ? list(back.slice(0, 2).map((x) => (x.token == null ? 'de la monnaie du réseau' : x.symbol && x.decimals != null ? fromRaw(BigInt(x.raw), x.decimals) + ' ' + x.symbol : 'un autre jeton'))) : 'un NFT';
  return { outcome: 'match', measured: true, line: 'D’après la simulation, ' + shown + ' sortent de ton compte et ' + got + (back.length > 1 ? ' y entrent.' : ' y entre.') };
}

// ---------------------------------------------------------------- one written intent, several requests
// What a request takes from the written amount. Read from the request when it is readable, else from its measured effect.
export function usedBy(body, effect) {
  const f = requestFacts(body), used = { grants: [], out: [] };
  for (const g of f.grants) used.grants.push({ token: g.token, spender: g.spender, raw: g.raw.toString() });
  for (const s of f.sends) used.out.push({ token: s.token, raw: s.raw.toString() });
  if (!used.grants.length && !used.out.length && effect && effect.ok) {
    for (const g of effect.grants) used.grants.push({ token: g.token, spender: g.spender, raw: g.raw });
    for (const o of effect.out) used.out.push({ token: o.token, raw: o.raw, decimals: o.decimals, symbol: o.symbol });
  }
  return used;
}
// The written intent is ONE budget. `used` : what the earlier requests of the same intent already took ; `mine` : this request.
// A second right, another token, or amounts that add up to more than what was written : it no longer matches.
export function operationCheck(used, mine, intent, tokens = {}) {
  if (!used || !mine || !intent || !intent.amount || !intent.symbol) return null;
  if (!used.grants.length && !used.out.length) return null;
  const said = 'Tu as écrit ' + fr(intent.amount) + ' ' + intent.symbol + '.';
  if (mine.grants.length && used.grants.length) return { outcome: 'mismatch', line: said + ' Tu as déjà donné une autorisation pour ça, et cette demande en ajoute une autre.' };
  const before = new Set(used.grants.concat(used.out).map((x) => x.token)), now = mine.grants.concat(mine.out).map((x) => x.token);
  if (now.some((t) => !before.has(t))) return { outcome: 'mismatch', line: said + ' Cette demande porte sur un autre jeton que la précédente.' };
  for (const o of mine.out) {
    const a = o.decimals != null && o.symbol ? o : assetOf(o.token, intent.symbol, tokens), want = toRaw(intent.amount, a.decimals);
    let sum = BigInt(o.raw); for (const u of used.out) if (u.token === o.token) sum += BigInt(u.raw);
    if (want == null || sum > want) return { outcome: 'mismatch', line: said + ' Avec cette demande, ' + fromRaw(sum, a.decimals) + ' ' + (a.symbol || intent.symbol) + ' seraient sortis de ton compte.' };
  }
  return null;
}

// ---------------------------------------------------------------- Q17 : Hold up writes the written amount into the request itself
// Certain or nothing. Required : a transaction (or a batch of calls) ; one amount in the sentence, readable one way only, extracted by code ;
// an intent that is about trading or giving a right (not paying, not "someone asked me", not receiving) ; for each wider right the token
// is known (local context, or read on the chain through the wallet's node) and its symbol IS the written symbol, with known decimals ;
// nothing else leaves in the request. A signature (Permit, Permit2) is never rewritten : its ceiling is signed, there is nothing to replace.
// `chain` : { [tokenAddress]: { symbol, decimals } } read from the token contract itself.
// The sentence allows Hold up to correct a right : one certain amount, about trading or giving a right, nobody told the person to do it.
export function canCorrect(intent) {
  if (!intent || !intent.clear || intent.vague || !intent.amount || !intent.symbol || !intent.text || !amountIsSure(intent.text)) return false;
  if (PAY_KINDS.has(intent.kind) || intent.kind === 'asked_by_someone' || (intent.facts && (intent.facts.asked || intent.facts.receive))) return false;
  return intent.kind === 'buy_or_swap' || !!(intent.facts && intent.facts.grant);
}
export function limitPlan(body, intent, tokens = {}, chain = {}) {
  if (!body || !intent || !intent.clear || !intent.amount || !intent.symbol || !intent.text || !amountIsSure(intent.text)) return null;
  if (PAY_KINDS.has(intent.kind) || intent.kind === 'asked_by_someone' || (intent.facts && (intent.facts.asked || intent.facts.receive))) return null;
  if (!(intent.kind === 'buy_or_swap' || (intent.facts && intent.facts.grant))) return null;
  const method = body.method, params = Array.isArray(body.params) ? body.params : [];
  let calls;
  if (method === 'eth_sendTransaction') calls = params[0] && typeof params[0] === 'object' ? [params[0]] : [];
  else if (method === 'wallet_sendCalls') calls = params[0] && Array.isArray(params[0].calls) ? params[0].calls : [];
  else return null;
  const facts = requestFacts(body);
  if (facts.tooBig || facts.ambiguous || calls.length > MAX_CALLS) return null; // not read in full, or read two ways : never rewritten
  if (facts.sends.length || !facts.grants.length || facts.grants.some((g) => g.signed)) return null;
  let copy; try { copy = JSON.parse(JSON.stringify(body.params)); } catch (_) { return null; }
  const ccalls = method === 'eth_sendTransaction' ? [copy[0]] : copy[0].calls;
  let changed = 0;
  for (let i = 0; i < calls.length; i++) {
    const tx = calls[i], ctx = ccalls[i];
    if (!tx || typeof tx !== 'object') continue;
    const value = big(tx.value); if (value == null || value > 0n) return null;
    const field = typeof tx.data === 'string' && tx.data.length > 2 ? 'data' : typeof tx.input === 'string' ? 'input' : null;
    if (!field || !HEX20.test(String(tx.to || ''))) continue;
    const data = tx[field];
    if (!/^0x[0-9a-fA-F]*$/.test(data) || data.length < 10) continue;
    const sel = data.slice(0, 10).toLowerCase();
    if (!((sel === '0x095ea7b3' || sel === '0x39509351') && (data.length - 10) / 64 >= 2)) continue;
    let raw; try { raw = BigInt('0x' + word(data, 1)); } catch (_) { return null; }
    if (raw <= 0n) continue;
    const token = lc(tx.to), meta = tokens[token]; // S15 : `chain` (read on the contract) is never trusted
    // the token must be known by its own contract (or the local context), and be the one the person wrote : else, no guess
    if (!meta || !meta.symbol || !Number.isInteger(meta.decimals) || String(meta.symbol).toUpperCase() !== intent.symbol) return null;
    const want = toRaw(intent.amount, meta.decimals);
    if (want == null) return null;
    if (raw <= want) continue;
    ctx[field] = data.slice(0, 10 + 64) + want.toString(16).padStart(64, '0') + data.slice(74 + 64);
    changed++;
  }
  if (!changed) return null;
  // proof by reading again : nothing of the new request exceeds what was written
  const after = requestFacts(Object.assign({}, body, { params: copy }));
  if (after.grants.length !== facts.grants.length) return null;
  for (const g of after.grants) {
    const meta = tokens[g.token]; if (!meta) return null;
    const want = toRaw(intent.amount, meta.decimals); if (want == null || g.raw > want) return null;
  }
  return { params: copy, amount: intent.amount, symbol: intent.symbol };
}
export const limitText = (plan) => 'Droit limité à ' + fr(plan.amount) + ' ' + plan.symbol;

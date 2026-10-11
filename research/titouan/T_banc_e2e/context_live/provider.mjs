// context_live/provider.mjs - live, READ-ONLY context provider for Hold up.
// Given { chainId, from, request, rpcUrl } it returns the on-chain facts the rules need at signing time:
//   - counterparties : isContract (eth_getCode), EIP-7702 delegation marker, contract age (see below)
//   - signer         : native balance, nonce
//   - tokens         : symbol, decimals, balanceOf(signer), allowance(signer, spender)
// Design rules:
//   - read-only JSON-RPC methods only (allow-list below), never a transaction, no API key;
//   - strict total time budget (default 1500 ms), every call in parallel, per-call timeout, in-memory cache;
//   - a fact that could not be fetched is UNKNOWN (undefined) and is listed in `missing`: there is no reassuring default;
//   - "first seen by this user" is NOT a chain fact: it comes from the local history, passed in as `seen`;
//   - no Node-only API (fetch, AbortController, Map, BigInt only): runs in Node >= 18 and in an MV3 service worker.
//
// Contract age, measured live on 2026-10-11 (raw evidence in evidence/contract_age_probe.json):
//   1. Routescan `getcontractcreation` (no key) + eth_getTransactionReceipt on the RPC  -> exact creation block, ~2 calls.
//   2. eth_getCode at (latest - N) on the public RPC -> "younger / older than N blocks", 1 call per threshold, ~40-300 ms.
//      The public Avalanche RPCs do serve historical state, but a full binary search costs 26 sequential calls
//      (0.9 s on Fuji, 9 to 44 s on mainnet with timeouts on deep history): outside the budget, so it is opt-in (exactAgeBySearch).
//   The rule threshold is 50 blocks, so (2) alone answers it; (1) gives the exact number when the explorer answers in time.
//   3. Young contract without an explorer answer (always the case on a local node, which has no explorer): binary search on
//      eth_getCode inside the probed window only (latest - 50 .. latest), at most 6 calls -> exact creation block (refineYoung).
//      Measured on the local Hardhat fork of Avalanche (evidence/local_node.json).

export const DEFAULT_RPC = {
  43114: 'https://api.avax.network/ext/bc/C/rpc',
  43113: 'https://api.avax-test.network/ext/bc/C/rpc',
};
// Routescan etherscan-compatible API (https://routescan.io/documentation/etherscan-compatibility/contracts), API key optional.
export const EXPLORER = {
  43114: 'https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api',
  43113: 'https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api',
};
export const READ_ONLY_METHODS = new Set(['eth_chainId', 'eth_blockNumber', 'eth_getCode', 'eth_getBalance', 'eth_getTransactionCount', 'eth_call', 'eth_getTransactionReceipt']);
export const DEFAULTS = {
  budgetMs: 1500,        // total wall-clock budget for one getContext() call
  callTimeoutMs: 900,    // per network call
  maxCounterparties: 8,  // addresses looked up per request (no scanning beyond the request itself)
  maxTokens: 4,
  ageProbes: [50],       // "is there code N blocks ago ?" thresholds (blocks). 50 = NEW_CONTRACT_THRESHOLD_BLOCKS of the comparator
  explorer: 'auto',      // 'auto' : public chains only, never for a loopback rpcUrl ; false : never ; true : whenever the chain is known
  refineYoung: true,     // contract with no code N blocks ago and no explorer answer : binary search inside that window (<= log2(N) calls)
  exactAgeBySearch: false, // binary search on eth_getCode (archive state) : exact but far beyond the budget, off by default
};
// ERC-20 selectors (checked against keccak256 in test/provider.test.mjs).
export const SEL = {
  symbol: '0x95d89b41', decimals: '0x313ce567', balanceOf: '0x70a08231', allowance: '0xdd62ed3e',
  approve: '0x095ea7b3', increaseAllowance: '0x39509351', transfer: '0xa9059cbb', transferFrom: '0x23b872dd',
};
const TTL = { chainId: 3600e3, head: 2e3, code: 600e3, noCode: 15e3, age: 3600e3, recentAge: 15e3, meta: 3600e3, volatile: 5e3 };

const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const isAddr = (a) => typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a);
const hexQ = (n) => '0x' + BigInt(n).toString(16);
const word = (a) => lc(a).replace(/^0x/, '').padStart(64, '0');
const nowMs = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
const ZERO = '0x' + '0'.repeat(40);

export function parseChainId(v) {
  if (v === null || v === undefined || v === '') return undefined;
  try { const n = typeof v === 'number' ? v : Number(BigInt(String(v))); return Number.isSafeInteger(n) && n > 0 ? n : undefined; } catch { return undefined; }
}
export function isLoopback(url) {
  try { const h = new URL(url).hostname; return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1' || h.endsWith('.localhost'); } catch { return false; }
}

// ------------------------------------------------------------------ what to look up (taken from the request only)
// A 32-byte calldata word is treated as an address when its 12 high bytes are zero and the 20 low bytes look like a hash
// (at least 10 non-zero bytes): small integers, amounts and deadlines are not picked up.
function addressesInCalldata(data) {
  const out = [];
  if (typeof data !== 'string' || !/^0x[0-9a-fA-F]*$/.test(data) || data.length < 10 + 64) return out;
  const body = data.slice(10);
  for (let i = 0; i + 64 <= body.length; i += 64) {
    const w = body.slice(i, i + 64);
    if (!/^0{24}/.test(w)) continue;
    const a = w.slice(24); let nz = 0;
    for (let j = 0; j < 40; j += 2) if (a.slice(j, j + 2) !== '00') nz++;
    if (nz >= 10) out.push('0x' + a.toLowerCase());
  }
  return out;
}
function walkAddresses(v, out, depth = 0) {
  if (depth > 8 || out.length > 64) return;
  if (typeof v === 'string') { if (isAddr(v)) out.push(lc(v)); return; }
  if (Array.isArray(v)) { for (const x of v) walkAddresses(x, out, depth + 1); return; }
  if (v && typeof v === 'object') for (const x of Object.values(v)) walkAddresses(x, out, depth + 1);
}
// -> { counterparties: [addr], tokens: [addr], allowances: [{ token, spender }] }, all lower-case, signer and zero address excluded.
export function extractTargets(request, from, hints = {}) {
  const me = lc(from);
  const cps = [], tokens = [], allowances = [];
  const okA = (a) => isAddr(a) && lc(a) !== me && lc(a) !== ZERO && !/^0x0{38}/.test(lc(a)); // precompiles / sentinel values excluded
  const addCp = (a) => { if (okA(a) && !cps.includes(lc(a))) cps.push(lc(a)); };
  const addTok = (a) => { if (okA(a) && !tokens.includes(lc(a))) tokens.push(lc(a)); };
  for (const a of hints.addresses || []) addCp(a);
  for (const a of hints.tokens || []) { addTok(a); addCp(a); }
  for (const p of hints.allowances || []) if (okA(p.token) && okA(p.spender)) allowances.push({ token: lc(p.token), spender: lc(p.spender) });

  const method = request && typeof request.method === 'string' ? request.method : '';
  const params = request && Array.isArray(request.params) ? request.params : [];
  const oneCall = (call) => {
    if (!call || typeof call !== 'object') return;
    const to = call.to, data = typeof call.data === 'string' ? call.data : typeof call.input === 'string' ? call.input : '0x';
    addCp(to);
    const sel = data.slice(0, 10).toLowerCase(), inner = addressesInCalldata(data);
    if (isAddr(to) && data.length >= 10) {
      if ([SEL.approve, SEL.increaseAllowance, SEL.transfer, SEL.transferFrom].includes(sel)) addTok(to);
      if ((sel === SEL.approve || sel === SEL.increaseAllowance) && inner[0]) allowances.push({ token: lc(to), spender: inner[0] });
    }
    for (const a of inner) addCp(a);
  };
  if (method === 'eth_sendTransaction' || method === 'eth_signTransaction') oneCall(params[0]);
  else if (method === 'wallet_sendCalls') { const p = params[0]; if (p && Array.isArray(p.calls)) for (const c of p.calls.slice(0, 64)) oneCall(c); }
  else if (/^eth_signTypedData/.test(method)) {
    let td = params.find((p) => (typeof p === 'string' && !isAddr(p)) || (p && typeof p === 'object' && !Array.isArray(p)));
    if (typeof td === 'string') { try { td = JSON.parse(td); } catch { td = null; } }
    if (td && typeof td === 'object') {
      const vc = td.domain && td.domain.verifyingContract, m = td.message || {};
      const found = []; walkAddresses(m, found);
      const spender = isAddr(m.spender) ? lc(m.spender) : undefined;
      const tokList = [];
      const pickTok = (o) => { if (o && typeof o === 'object') { if (isAddr(o.token)) tokList.push(lc(o.token)); for (const x of Object.values(o)) if (x && typeof x === 'object') pickTok(x); } };
      pickTok(m);
      if (/permit/i.test(String(td.primaryType || '')) && !tokList.length && isAddr(vc)) tokList.push(lc(vc)); // EIP-2612 : the token is the verifying contract
      for (const t of tokList) { addTok(t); if (spender) allowances.push({ token: t, spender }); }
      addCp(vc); for (const a of found) addCp(a);
    }
  }
  for (const t of tokens) addCp(t);
  return { counterparties: cps, tokens, allowances: allowances.filter((p, i, l) => l.findIndex((q) => q.token === p.token && q.spender === p.spender) === i) };
}

// ------------------------------------------------------------------ transport, budget, cache
const CACHE = new Map(); // key -> { v, exp }
export function clearCache() { CACHE.clear(); }
function cached(key) { const e = CACHE.get(key); if (!e) return undefined; if (e.exp < Date.now()) { CACHE.delete(key); return undefined; } return e.v; }
function remember(key, v, ttl) { if (CACHE.size > 5000) CACHE.clear(); CACHE.set(key, { v, exp: Date.now() + ttl }); return v; }

class Session {
  constructor(o) {
    this.fetch = o.fetchImpl || globalThis.fetch;
    this.rpcUrl = o.rpcUrl; this.deadline = nowMs() + o.budgetMs; this.callTimeoutMs = o.callTimeoutMs;
    this.id = 0; this.calls = 0; this.cacheHits = 0; this.errors = [];
  }
  remaining() { return this.deadline - nowMs(); }
  // One HTTP exchange bounded by min(per-call timeout, remaining budget). Throws on timeout / transport / JSON-RPC error.
  async http(url, init, label) {
    const left = Math.min(this.callTimeoutMs, this.remaining());
    if (left <= 5) throw new Error('budget exhausted before ' + label);
    const ctl = new AbortController();
    let timer; const timeout = new Promise((_, rej) => { timer = setTimeout(() => { ctl.abort(); rej(new Error('timeout ' + label)); }, left); });
    this.calls++;
    try {
      const run = (async () => { const r = await this.fetch(url, { ...init, signal: ctl.signal }); if (!r.ok) throw new Error('http ' + r.status + ' ' + label); return r.json(); })();
      run.catch(() => {});
      return await Promise.race([run, timeout]);
    } finally { clearTimeout(timer); }
  }
  async rpc(method, params, ttl) {
    if (!READ_ONLY_METHODS.has(method)) throw new Error('method not allowed (read-only provider): ' + method);
    const key = this.rpcUrl + '|' + method + '|' + JSON.stringify(params);
    if (ttl) { const c = cached(key); if (c !== undefined) { this.cacheHits++; return c; } }
    const j = await this.http(this.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++this.id, method, params }) }, method);
    if (!j || j.error || j.result === undefined || j.result === null) throw new Error(method + ': ' + ((j && j.error && j.error.message) || 'empty result'));
    // "no code" answers are cached for a short time only (an address can receive code later)
    return ttl ? remember(key, j.result, typeof ttl === 'function' ? ttl(j.result) : ttl) : j.result;
  }
  // Never throws: undefined = unknown, and the reason is kept for the report.
  async soft(label, fn) { try { return await fn(); } catch (e) { this.errors.push(label + ': ' + String((e && e.message) || e).slice(0, 120)); return undefined; } }
}

function decodeString(hex) {
  if (typeof hex !== 'string' || hex.length < 2 + 64) return undefined;
  const h = hex.slice(2);
  const bytesToText = (b) => { let s = ''; for (let i = 0; i + 2 <= b.length; i += 2) { const c = parseInt(b.slice(i, i + 2), 16); if (c === 0) break; s += String.fromCharCode(c); } try { s = decodeURIComponent(escape(s)); } catch { /* keep latin-1 */ } return s; };
  let s;
  if (h.length === 64) s = bytesToText(h); // bytes32 symbol (old tokens)
  else { const off = Number(BigInt('0x' + h.slice(0, 64))) * 2; if (off + 64 > h.length) return undefined; const len = Number(BigInt('0x' + h.slice(off, off + 64))); if (len > 256) return undefined; s = bytesToText(h.slice(off + 64, off + 64 + len * 2)); }
  s = s.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 32); // attacker-controlled text : bounded, no control characters
  return s || undefined;
}
const asUint = (hex) => { if (typeof hex !== 'string' || !/^0x[0-9a-fA-F]{1,64}$/.test(hex)) return undefined; return BigInt(hex); };
// eth_getCode result -> { isContract, delegatedTo } ; an EIP-7702 delegation designator (0xef0100 || address) is an EOA that runs someone else's code.
export function classifyCode(code) {
  if (typeof code !== 'string' || !/^0x[0-9a-fA-F]*$/.test(code)) return undefined;
  const c = code.toLowerCase();
  if (c === '0x') return { isContract: false };
  if (c.length === 2 + 46 && c.startsWith('0xef0100')) return { isContract: false, delegatedTo: '0x' + c.slice(8) };
  return { isContract: true };
}

// ------------------------------------------------------------------ main entry
// input  : { chainId, from, request, rpcUrl?, seen?, hints?, options? }
//   seen : addresses the user already paid / has in the address book (local history) -> firstSeenByUser. Absent = unknown.
// output : { chainId, rpc, block, facts: { signer, counterparties, tokens }, missing: [..], complete, elapsedMs, calls, cacheHits, errors }
export async function getContext(input) {
  const t0 = nowMs();
  const o = { ...DEFAULTS, ...(input.options || {}) };
  const chainId = parseChainId(input.chainId);
  const from = isAddr(input.from) ? lc(input.from) : undefined;
  const rpcUrl = input.rpcUrl || (chainId !== undefined ? DEFAULT_RPC[chainId] : undefined);
  const targets = extractTargets(input.request, from, input.hints);
  const cps = targets.counterparties.slice(0, o.maxCounterparties);
  const tokens = targets.tokens.slice(0, o.maxTokens);
  const allowances = targets.allowances.filter((p) => tokens.includes(p.token)).slice(0, o.maxTokens);
  const seen = input.seen ? new Set([...input.seen].map(lc)) : null;

  const facts = { signer: { address: from }, counterparties: {}, tokens: {} };
  for (const a of cps) facts.counterparties[a] = { firstSeenByUser: seen ? !seen.has(a) : undefined };
  for (const t of tokens) facts.tokens[t] = { allowances: {} };
  const out = { chainId, rpc: undefined, block: undefined, facts, missing: [], complete: false, elapsedMs: 0, calls: 0, cacheHits: 0, errors: [], dropped: { counterparties: targets.counterparties.length - cps.length, tokens: targets.tokens.length - tokens.length } };
  const finish = (S) => {
    const miss = out.missing = [];
    if (from) { if (facts.signer.nativeBalance === undefined) miss.push('signer.nativeBalance'); if (facts.signer.nonce === undefined) miss.push('signer.nonce'); }
    for (const a of cps) {
      const f = facts.counterparties[a];
      if (f.isContract === undefined) miss.push('isContract:' + a);
      if (f.isContract !== false && f.ageBlocks === undefined && f.ageMinBlocks === undefined && f.ageMaxBlocks === undefined) miss.push('age:' + a);
      if (f.firstSeenByUser === undefined) miss.push('firstSeenByUser:' + a);
    }
    for (const t of tokens) {
      const f = facts.tokens[t];
      if (f.isToken === false) continue;
      for (const k of ['symbol', 'decimals']) if (f[k] === undefined) miss.push('token.' + k + ':' + t);
      if (from && f.balance === undefined) miss.push('token.balance:' + t);
    }
    for (const p of allowances) if (facts.tokens[p.token].isToken !== false && facts.tokens[p.token].allowances[p.spender] === undefined) miss.push('token.allowance:' + p.token + ':' + p.spender);
    if (out.dropped.counterparties > 0) miss.push('not_looked_up:' + out.dropped.counterparties + '_addresses');
    out.complete = miss.length === 0;
    if (S) { out.calls = S.calls; out.cacheHits = S.cacheHits; out.errors = S.errors; }
    out.elapsedMs = Math.round((nowMs() - t0) * 10) / 10;
    return out;
  };
  if (chainId === undefined || !rpcUrl || !/^https?:\/\//i.test(String(rpcUrl))) { out.errors.push('no usable rpcUrl for chain ' + String(input.chainId)); return finish(null); }
  try { out.rpc = new URL(rpcUrl).host; } catch { out.errors.push('invalid rpcUrl'); return finish(null); }
  const S = new Session({ fetchImpl: o.fetchImpl, rpcUrl, budgetMs: o.budgetMs, callTimeoutMs: o.callTimeoutMs });
  if (typeof S.fetch !== 'function') { out.errors.push('fetch unavailable'); return finish(S); }

  // The endpoint must really be the chain the wallet is on, otherwise every fact would describe another network.
  const chainOk = S.soft('eth_chainId', async () => parseChainId(await S.rpc('eth_chainId', [], TTL.chainId)) === chainId);
  const head = S.soft('eth_blockNumber', async () => Number(BigInt(await S.rpc('eth_blockNumber', [], TTL.head))));
  const tasks = [];
  const guard = async (fn) => { if ((await chainOk) !== true) return; await fn(); };

  if (from) {
    tasks.push(guard(async () => { const v = await S.soft('balance', () => S.rpc('eth_getBalance', [from, 'latest'], TTL.volatile)); const n = asUint(v); if (n !== undefined) facts.signer.nativeBalance = n.toString(); }));
    tasks.push(guard(async () => { const v = await S.soft('nonce', () => S.rpc('eth_getTransactionCount', [from, 'latest'], TTL.volatile)); const n = asUint(v); if (n !== undefined) facts.signer.nonce = Number(n); }));
  }
  const useExplorer = o.explorer === true ? !!EXPLORER[chainId] : o.explorer === 'auto' ? !!EXPLORER[chainId] && !isLoopback(rpcUrl) : false;
  // Explorer : one request for all addresses (5 per request is the documented maximum), then one receipt per creation tx.
  const explorerAge = useExplorer && cps.length ? S.soft('explorer', async () => {
    const res = {}; const need = [];
    for (const a of cps) { const c = cached('age|' + chainId + '|' + a); if (c !== undefined) { S.cacheHits++; res[a] = c; } else need.push(a); }
    for (let i = 0; i < need.length; i += 5) {
      const j = await S.http(EXPLORER[chainId] + '?module=contract&action=getcontractcreation&contractaddresses=' + need.slice(i, i + 5).join(','), { method: 'GET' }, 'explorer');
      await Promise.all((Array.isArray(j && j.result) ? j.result : []).map((e) => S.soft('creation receipt', async () => {
        if (!e || !isAddr(e.contractAddress) || !/^0x[0-9a-fA-F]{64}$/.test(String(e.txHash))) return;
        const rc = await S.rpc('eth_getTransactionReceipt', [e.txHash], TTL.age);
        const b = asUint(rc && rc.blockNumber); if (b === undefined) return;
        res[lc(e.contractAddress)] = remember('age|' + chainId + '|' + lc(e.contractAddress), { creationBlock: Number(b), creator: isAddr(e.contractCreator) ? lc(e.contractCreator) : undefined }, TTL.age);
      })));
    }
    return res;
  }) : Promise.resolve(undefined);

  for (const a of cps) {
    const f = facts.counterparties[a];
    const codeTask = guard(async () => {
      const code = await S.soft('code ' + a, () => S.rpc('eth_getCode', [a, 'latest'], (r) => (r === '0x' ? TTL.noCode : TTL.code)));
      const k = classifyCode(code); if (!k) return;
      f.isContract = k.isContract; if (k.delegatedTo) f.delegatedTo = k.delegatedTo;
    });
    tasks.push(codeTask);
    // age probes : "was there code N blocks ago ?" (answers "younger than N" without the creation block)
    const probeTask = guard(async () => {
      const latest = await head; if (latest === undefined) return;
      await Promise.all(o.ageProbes.map(async (n) => {
        if (latest - n < 0) return;
        const code = await S.soft('age probe ' + a, () => S.rpc('eth_getCode', [a, hexQ(latest - n)], (r) => (r === '0x' ? TTL.recentAge : TTL.age)));
        const k = classifyCode(code); if (!k) return;
        if (k.isContract) f.ageMinBlocks = Math.max(f.ageMinBlocks ?? 0, n); else f.ageMaxBlocks = Math.min(f.ageMaxBlocks ?? Infinity, n - 1);
      }));
    });
    tasks.push(probeTask);
    tasks.push(guard(async () => {
      const [ex, latest] = await Promise.all([explorerAge, head]);
      if (ex && ex[a] && latest !== undefined && ex[a].creationBlock <= latest) { f.ageBlocks = latest - ex[a].creationBlock; f.creationBlock = ex[a].creationBlock; f.ageSource = 'explorer+receipt'; }
    }));
    // young contract, exact block still unknown : search the first block with code between the probe (no code) and the head (code)
    if (o.refineYoung) tasks.push(guard(async () => {
      const [latest] = await Promise.all([head, codeTask, probeTask, explorerAge]);
      if (latest === undefined || f.isContract !== true || f.ageBlocks !== undefined || f.ageMaxBlocks === undefined) return;
      await S.soft('age search ' + a, async () => {
        let lo = Math.max(-1, latest - f.ageMaxBlocks - 1), hi = latest; // no code at lo, code at hi
        while (hi - lo > 1) { const mid = Math.floor((lo + hi) / 2); const k = classifyCode(await S.rpc('eth_getCode', [a, hexQ(mid)], TTL.recentAge)); if (!k) throw new Error('bad code'); if (k.isContract) hi = mid; else lo = mid; }
        f.ageBlocks = latest - hi; f.creationBlock = hi; f.ageSource = 'rpc-search';
      });
    }));
    if (o.exactAgeBySearch) tasks.push(guard(async () => {
      const latest = await head; if (latest === undefined) return;
      let lo = 0, hi = latest;
      while (lo < hi) { const mid = Math.floor((lo + hi) / 2); const k = classifyCode(await S.rpc('eth_getCode', [a, hexQ(mid)], TTL.age)); if (!k) throw new Error('bad code'); if (k.isContract) hi = mid; else lo = mid + 1; }
      if (f.ageBlocks === undefined) { f.ageBlocks = latest - lo; f.creationBlock = lo; f.ageSource = 'rpc-binary-search'; }
    }).catch((e) => { S.errors.push('age search ' + a + ': ' + String(e.message).slice(0, 80)); }));
  }
  for (const t of tokens) {
    const f = facts.tokens[t];
    const call = (label, data, ttl) => S.soft(label + ' ' + t, () => S.rpc('eth_call', [{ to: t, data }, 'latest'], ttl));
    tasks.push(guard(async () => {
      const [sym, dec, bal] = await Promise.all([call('symbol', SEL.symbol, TTL.meta), call('decimals', SEL.decimals, TTL.meta), from ? call('balanceOf', SEL.balanceOf + word(from), TTL.volatile) : undefined]);
      const s = decodeString(sym); if (s !== undefined) f.symbol = s;
      const d = dec && dec.length === 66 ? asUint(dec) : undefined; if (d !== undefined && d <= 255n) f.decimals = Number(d);
      const b = bal && bal.length === 66 ? asUint(bal) : undefined; if (b !== undefined) f.balance = b.toString();
    }));
  }
  for (const p of allowances) tasks.push(guard(async () => {
    if (!from) return;
    const v = await S.soft('allowance ' + p.token, () => S.rpc('eth_call', [{ to: p.token, data: SEL.allowance + word(from) + word(p.spender) }, 'latest'], TTL.volatile));
    const n = v && v.length === 66 ? asUint(v) : undefined; if (n !== undefined) facts.tokens[p.token].allowances[p.spender] = n.toString();
  }));

  // Hard stop at the deadline: whatever is still pending stays unknown.
  let stop; const deadline = new Promise((r) => { stop = setTimeout(r, Math.max(0, S.remaining())); });
  await Promise.race([Promise.all(tasks), deadline]); clearTimeout(stop);
  if ((await Promise.race([chainOk, Promise.resolve('pending')])) === false) S.errors.push('chain_mismatch: rpcUrl does not serve chain ' + chainId);
  const h = await Promise.race([head, Promise.resolve(undefined)]); if (typeof h === 'number') out.block = h;
  // An address without code that answers nothing to symbol()/decimals() is simply not a token: nothing is missing.
  for (const t of tokens) { const f = facts.tokens[t], c = facts.counterparties[t]; if (c && c.isContract === false && f.symbol === undefined && f.decimals === undefined) f.isToken = false; }
  // Derived age when only probes answered: the lower bound is the safe number (a contract is never reported older than proven).
  for (const a of cps) {
    const f = facts.counterparties[a];
    if (f.isContract === false) { delete f.ageMinBlocks; delete f.ageMaxBlocks; continue; }
    if (f.ageBlocks === undefined && (f.ageMinBlocks !== undefined || f.ageMaxBlocks !== undefined)) f.ageSource = 'rpc-probe';
  }
  return finish(S);
}

// ------------------------------------------------------------------ shape expected by the engine
// Matches the names used by run/run_loop.mjs buildCtx (codeOf, ageBlocks, tokenMeta, balances, _facts, _tokenInfo).
// Only KNOWN facts are copied: an unknown stays absent, so the engine keeps its "unknown" behaviour (never "ok by default").
//   ageBlocks : exact age when known ; otherwise the proven lower bound (ageMinBlocks) or, for a contract that had no code
//               N blocks ago, 0 (younger than N). Both are exact with respect to the probed thresholds.
//   balances  : { native: wei, <token>: units }  -> the engine derives shareOfBalancePct (above 100 % = more than the balance)
//   tokenMeta : symbol / decimals read on chain. `stable` is never set from chain data (the symbol is attacker-controlled).
export function toEngineContext(res) {
  const isContract = {}, ageBlocks = {}, balances = {}, tokenMeta = {}, facts = {}, tokenInfo = {}, allowances = {};
  if (!res || !res.facts) return { isContract, ageBlocks, balances, tokenMeta, facts, tokenInfo, allowances, missing: ['live_context_absent'], nonce: undefined };
  for (const [a, f] of Object.entries(res.facts.counterparties || {})) {
    const v = {};
    if (f.isContract !== undefined) { isContract[a] = f.isContract; v.isContract = f.isContract; }
    if (f.isContract !== false) {
      // "no code N blocks ago" only means "young contract" when code is proven to exist now (otherwise it may be a plain account)
      const age = f.ageBlocks !== undefined ? f.ageBlocks : f.ageMaxBlocks !== undefined ? (f.isContract === true ? 0 : undefined) : f.ageMinBlocks;
      if (age !== undefined) { ageBlocks[a] = age; v.ageBlocks = age; }
    }
    if (f.firstSeenByUser !== undefined) v.firstSeenByUser = f.firstSeenByUser;
    if (f.delegatedTo) v.delegatedTo = f.delegatedTo;
    facts[a] = v;
  }
  if (res.facts.signer && res.facts.signer.nativeBalance !== undefined) balances.native = res.facts.signer.nativeBalance;
  for (const [t, f] of Object.entries(res.facts.tokens || {})) {
    if (f.balance !== undefined) balances[t] = f.balance;
    if (f.symbol !== undefined && f.decimals !== undefined) { tokenMeta[t] = { symbol: f.symbol, decimals: f.decimals }; tokenInfo[t] = { symbol: f.symbol, decimals: f.decimals, ...(ageBlocks[t] !== undefined ? { ageBlocks: ageBlocks[t] } : {}) }; }
    if (f.allowances && Object.keys(f.allowances).length) allowances[t] = { ...f.allowances };
  }
  return { isContract, ageBlocks, balances, tokenMeta, facts, tokenInfo, allowances, nonce: res.facts.signer ? res.facts.signer.nonce : undefined, missing: [...(res.missing || [])] };
}

// Convenience for the integration point: never throws, always returns { live, engine }.
export async function liveEngineContext(input) {
  let live;
  try { live = await getContext(input); } catch (e) { live = { facts: null, missing: ['live_context_failed'], errors: [String((e && e.message) || e).slice(0, 120)], complete: false }; }
  return { live, engine: toEngineContext(live.facts ? live : null) };
}

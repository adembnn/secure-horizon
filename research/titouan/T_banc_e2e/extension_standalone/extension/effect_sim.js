/* Hold up - what a transaction really does, MEASURED by a dry run on the node the wallet itself uses. Pure ES module :
 * no chrome.*, no network, no DOM. The caller injects `rpc(method, params)` (read-only calls relayed to the wallet's provider).
 *
 *   measure(body, rpc, tokens) -> { ok: false, why, failed? }
 *                              or { ok: true, account, out: [asset], in: [asset], grants: [right], nftOut, nftIn, nftRight }
 *     asset : { token (address, or null for the network's own currency), raw (decimal string), symbol, decimals, to: [addresses] }
 *     right : { token, spender, raw, unlimited, symbol, decimals }
 *
 * How : `debug_traceCall` replays the call on the latest block without sending it. Every event the contracts emit is read
 * from the trace (Transfer, Approval, ApprovalForAll, ERC-1155 transfers), with the address that emitted it ; events of a
 * sub-call that reverted are dropped. Nothing here knows a contract, a selector or an address.
 *
 * What it proves : on the state of the node at that instant, this exact call makes these tokens leave the account, these
 * enter, and these spending rights grow.
 * What it does NOT prove : (1) the same at execution time (a contract may branch on the block, the time, a price or its own
 * storage, and the state may change in between) ; (2) a token that moves balances without emitting Transfer is not seen ;
 * (3) an "incoming" asset is only an event : its value is not checked ; (4) the answers travel through the page's provider.
 * Any doubt (no trace, failing call, contract created inside, unreadable token) is `ok: false` : "not verified", never a match. */
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const lc = (a) => String(a).toLowerCase();
const T_TRANSFER = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';     // Transfer(address,address,uint256)
const T_APPROVAL = '8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';     // Approval(address,address,uint256)
const T_APPROVAL_ALL = '17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31'; // ApprovalForAll(address,address,bool)
const T_1155_SINGLE = 'c3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';  // TransferSingle(operator,from,to,id,value)
const T_1155_BATCH = '4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb';   // TransferBatch(operator,from,to,ids,values)
const SEL = { decimals: '0x313ce567', symbol: '0x95d89b41', allowance: '0xdd62ed3e' };
export const READ_METHODS = ['debug_traceCall', 'eth_call'];
export const LIMITS = { steps: 400000, tokens: 8, logBytes: 4096 };
const UNLIMITED_FROM = 2n ** 128n;
const ENDS_OK = new Set(['STOP', 'RETURN', 'SELFDESTRUCT']);
const ENDS_BAD = new Set(['REVERT', 'INVALID']);

const w64 = (x) => String(x == null ? '' : x).replace(/^0x/, '').toLowerCase().padStart(64, '0').slice(-64);
const addrOf = (word) => '0x' + w64(word).slice(24);
const big = (word) => { try { return BigInt('0x' + (w64(word) || '0')); } catch (_) { return null; } };
const num = (word) => { const b = big(word); return b == null || b > 0x7fffffffn ? null : Number(b); };
function memory(entry, offset, size) {
  if (size === 0) return '';
  if (offset == null || size == null || size > LIMITS.logBytes) return null;
  const m = entry.memory;
  const all = Array.isArray(m) ? m.map((x) => String(x).replace(/^0x/, '')).join('') : typeof m === 'string' ? m.replace(/^0x/, '') : null;
  if (all == null) return null;
  return all.slice(offset * 2, (offset + size) * 2).padEnd(size * 2, '0').toLowerCase();
}

// Struct logs -> the events really emitted (those of reverted sub-calls removed) and the network currency sent to `account`.
// -> null when the trace cannot be trusted to be complete.
export function eventsOf(structLogs, to, account) {
  const frames = [{ addr: lc(to), events: [], nativeIn: 0n, last: null, bad: false }];
  let pend = null, doubt = false;
  const close = () => {
    const f = frames.pop(), parent = frames[frames.length - 1];
    if (f.bad || ENDS_BAD.has(f.last)) return;                 // reverted : nothing of it happened
    if (!ENDS_OK.has(f.last)) { doubt = true; return; }        // ended in a way this reader does not know
    for (const e of f.events) parent.events.push(e);
    parent.nativeIn += f.nativeIn;
  };
  for (const e of structLogs) {
    if (!e || typeof e.op !== 'string' || !Number.isInteger(e.depth) || !Array.isArray(e.stack)) return null;
    const depth = e.depth - (structLogs[0].depth - 1); // some nodes count the first frame as 0
    if (depth === frames.length + 1) frames.push({ addr: pend ? pend.addr : null, events: [], nativeIn: 0n, last: null, bad: false });
    else if (depth > frames.length + 1 || depth < 1) return null;
    else while (depth < frames.length) close();
    const f = frames[frames.length - 1], st = e.stack, top = (i) => st[st.length - 1 - i];
    f.last = e.op; if (e.error) f.bad = true;
    pend = null;
    if (e.op === 'CALL' || e.op === 'STATICCALL' || e.op === 'DELEGATECALL' || e.op === 'CALLCODE') {
      if (st.length < 6) return null;
      const target = addrOf(top(1));
      pend = { addr: e.op === 'CALL' || e.op === 'STATICCALL' ? target : f.addr };
      if (e.op === 'CALL') { const v = big(top(2)); if (v == null) return null; if (v > 0n && target === account) f.nativeIn += v; }
    } else if (e.op === 'CREATE' || e.op === 'CREATE2') pend = { addr: null };
    else if (/^LOG[0-4]$/.test(e.op)) {
      const n = Number(e.op[3]);
      if (st.length < 2 + n || f.addr == null) return null; // an event whose emitter is unknown : the reading is not complete
      const topics = []; for (let i = 0; i < n; i++) topics.push(w64(top(2 + i)));
      const known = topics[0] === T_TRANSFER || topics[0] === T_APPROVAL || topics[0] === T_APPROVAL_ALL || topics[0] === T_1155_SINGLE || topics[0] === T_1155_BATCH;
      const data = known ? memory(e, num(top(0)), num(top(1))) : '';
      if (data == null) return null;
      f.events.push({ address: f.addr, topics, data });
    }
  }
  while (frames.length > 1) close();
  if (doubt) return null;
  return { events: frames[0].events, nativeIn: frames[0].nativeIn };
}

function abiString(hex) {
  const h = String(hex || '').replace(/^0x/, '');
  let bytes = '';
  if (h.length >= 128 && big(h.slice(0, 64)) === 32n) { const len = num(h.slice(64, 128)); if (len == null || len > 64) return null; bytes = h.slice(128, 128 + len * 2); }
  else if (h.length === 64) bytes = h.replace(/(00)+$/, ''); // bytes32 symbol (old tokens)
  else return null;
  let s = ''; for (let i = 0; i + 1 < bytes.length; i += 2) s += String.fromCharCode(parseInt(bytes.substr(i, 2), 16));
  return /^[A-Za-z0-9.$_-]{1,12}$/.test(s) ? s : null;
}

export async function measure(body, rpc, tokens = {}) {
  const no = (why, extra) => Object.assign({ ok: false, why }, extra || {});
  if (!body || body.method !== 'eth_sendTransaction' || !Array.isArray(body.params) || typeof rpc !== 'function') return no('non simulable');
  const tx = body.params[0];
  if (!tx || typeof tx !== 'object' || !HEX20.test(String(tx.from || '')) || !HEX20.test(String(tx.to || ''))) return no('non simulable');
  const account = lc(tx.from), to = lc(tx.to);
  const data = typeof tx.data === 'string' && tx.data.length > 2 ? tx.data : typeof tx.input === 'string' ? tx.input : '0x';
  let value; try { value = tx.value == null || tx.value === '' ? 0n : BigInt(tx.value); } catch (_) { return no('non simulable'); }
  const call = { from: account, to, data }; if (value > 0n) call.value = '0x' + value.toString(16);
  let trace;
  try { trace = await rpc('debug_traceCall', [call, 'latest', { disableStorage: true, enableMemory: true, disableMemory: false, disableStack: false }]); } catch (_) { return no('simulation indisponible'); }
  if (!trace || typeof trace !== 'object' || !Array.isArray(trace.structLogs)) return no('simulation indisponible');
  if (trace.failed) return no('la demande echouerait', { failed: true });
  if (trace.structLogs.length > LIMITS.steps) return no('trace trop longue');
  const read = trace.structLogs.length ? eventsOf(trace.structLogs, to, account) : { events: [], nativeIn: 0n };
  if (!read) return no('trace illisible');

  const flow = new Map(); // token -> { out, in, to }
  const at = (t) => { if (!flow.has(t)) flow.set(t, { out: 0n, in: 0n, to: new Set() }); return flow.get(t); };
  const approvals = new Map(); // token|spender -> last value
  let nftOut = 0, nftIn = 0, nftRight = false;
  if (value > 0n) { const f = at(null); f.out += value; f.to.add(to); }
  if (read.nativeIn > 0n) at(null).in += read.nativeIn;
  for (const e of read.events) {
    const t = e.topics;
    if (t[0] === T_TRANSFER && t.length === 3) {
      const from = addrOf(t[1]), dest = addrOf(t[2]), v = e.data.length >= 64 ? big(e.data.slice(0, 64)) : null;
      if (from !== account && dest !== account) continue;
      if (v == null) return no('evenement illisible');
      if (from === account && dest !== account) { const f = at(e.address); f.out += v; f.to.add(dest); }
      else if (dest === account && from !== account) at(e.address).in += v;
    } else if (t[0] === T_TRANSFER && t.length === 4) { if (addrOf(t[1]) === account) nftOut++; else if (addrOf(t[2]) === account) nftIn++; }
    else if ((t[0] === T_1155_SINGLE || t[0] === T_1155_BATCH) && t.length === 4) { if (addrOf(t[2]) === account) nftOut++; else if (addrOf(t[3]) === account) nftIn++; }
    else if (t[0] === T_APPROVAL && t.length === 3 && addrOf(t[1]) === account) {
      const v = e.data.length >= 64 ? big(e.data.slice(0, 64)) : null; if (v == null) return no('evenement illisible');
      approvals.set(e.address + '|' + addrOf(t[2]), v);
    } else if (t[0] === T_APPROVAL && t.length === 4 && addrOf(t[1]) === account && big(t[2]) !== 0n) nftRight = true;
    else if (t[0] === T_APPROVAL_ALL && t.length === 3 && addrOf(t[1]) === account && big(e.data.slice(0, 64)) !== 0n) nftRight = true;
  }
  // A right counts only when it GROWS : many tokens emit Approval with the reduced allowance when a transferFrom spends it.
  const rights = [];
  for (const [key, v] of approvals) {
    if (v === 0n) continue;
    const [token, spender] = key.split('|');
    let before = null;
    try { before = big(await rpc('eth_call', [{ to: token, data: SEL.allowance + w64(account) + w64(spender) }, 'latest'])); } catch (_) { before = null; }
    if (before == null || v > before) rights.push({ token, spender, raw: v });
  }
  const involved = [...new Set([...flow.keys()].filter((t) => t != null).concat(rights.map((r) => r.token)))];
  if (involved.length > LIMITS.tokens) return no('trop de jetons');
  const meta = {};
  for (const t of involved) {
    const known = tokens && tokens[t];
    if (known) { meta[t] = { symbol: known.symbol, decimals: known.decimals, known: true }; continue; }
    let symbol = null, decimals = null;
    try { symbol = abiString(await rpc('eth_call', [{ to: t, data: SEL.symbol }, 'latest'])); } catch (_) {}
    try { const d = big(await rpc('eth_call', [{ to: t, data: SEL.decimals }, 'latest'])); if (d != null && d <= 36n) decimals = Number(d); } catch (_) {}
    meta[t] = { symbol, decimals, known: false };
  }
  const out = [], inn = [];
  for (const [token, f] of flow) {
    const m = token == null ? { symbol: null, decimals: 18, known: false } : meta[token];
    const net = f.out - f.in;
    if (net > 0n) out.push({ token, raw: net.toString(), symbol: m.symbol, decimals: m.decimals, known: m.known, to: [...f.to].slice(0, 4) });
    else if (net < 0n) inn.push({ token, raw: (-net).toString(), symbol: m.symbol, decimals: m.decimals, known: m.known });
  }
  const grants = rights.map((r) => ({ token: r.token, spender: r.spender, raw: r.raw.toString(), unlimited: r.raw >= UNLIMITED_FROM, symbol: meta[r.token].symbol, decimals: meta[r.token].decimals, known: meta[r.token].known }));
  return { ok: true, account, out, in: inn, grants, nftOut, nftIn, nftRight };
}

// The name and the decimals a token contract gives for itself (two read-only calls on the wallet's node). null unless both are readable.
export async function readToken(rpc, address) {
  if (typeof rpc !== 'function' || !HEX20.test(String(address || ''))) return null;
  let symbol = null, decimals = null;
  try { symbol = abiString(await rpc('eth_call', [{ to: lc(address), data: SEL.symbol }, 'latest'])); } catch (_) {}
  try { const r = await rpc('eth_call', [{ to: lc(address), data: SEL.decimals }, 'latest']); const d = typeof r === 'string' && /^0x[0-9a-fA-F]{64}$/.test(r) ? big(r) : null; if (d != null && d <= 36n) decimals = Number(d); } catch (_) {}
  return symbol && decimals != null ? { symbol, decimals } : null;
}

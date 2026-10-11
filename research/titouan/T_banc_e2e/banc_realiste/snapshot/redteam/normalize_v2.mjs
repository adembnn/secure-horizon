// normalize_v2.mjs - converts blind_adem/v2 cases (heterogeneous context schemas written by 6 blind agents)
// to the bench context format expected by check.mjs (see redteam/README.md), WITHOUT changing their meaning.
// Usage: node redteam/normalize_v2.mjs <in.jsonl> <out.jsonl>
// Never run on V2_TEST.jsonl during the improvement loop (frozen set).
//
// Conversions (field -> bench format):
//  - victim {address,...}            -> victim = address string (other victim fields kept in victim_meta)
//  - origin {kind,url}               -> origin = url, origin_kind = kind
//  - known_protocols ["0x.."] | {addr: name} | [{label|name,address}] -> [{name,address}]
//  - token_registry {SYM: addr} | {SYM: {address,decimals}} | {addr: {symbol,decimals}} | [..] -> [{address,symbol,decimals}]
//      missing decimals: token_info.decimals for that address, else public convention (USD stables 6, BTC wrappers 8, else 18)
//  - token_info single object {address?,symbol,...} -> {address: {...}} ; without address it is resolved by symbol in the registry
//      contract_age_blocks -> ageBlocks ; age_days/ageDays kept
//  - counterparty_facts [..] | single object {address,...} -> {address: {...}} (null ageBlocks dropped = unknown)
//  - history (5 dialects) -> [{address, minutes_ago, direction: 'sortie'|'entree', amount?, kind?}]
//      outgoing/out/interaction -> sortie ; incoming/in -> entree ; approval entries (no transfer) are dropped.
//      Unsolicited attacker-initiated entries (tx_kind dust_transfer, transferFrom_zero_value, fake_token_transfer)
//      are 'entree' with amount '0' : the user never paid, the value is nil or worthless (this is what "dust" means for the bench).
//      ts (seconds) -> minutes_ago from intent.declaredAt ; daysAgo/ageDays/lastAgeDays -> minutes.
//  - everything else is kept untouched.
import { readFileSync, writeFileSync } from 'node:fs';

const isAddr = (s) => typeof s === 'string' && /^0x[0-9a-fA-F]{40}$/.test(s);
const lc = (s) => (typeof s === 'string' ? s.toLowerCase() : s);
const defaultDecimals = (sym) => {
  const s = String(sym || '').toUpperCase();
  if (/^(USDC|USDT|USDC\.E|USDT\.E|USDBC|PYUSD)$/.test(s)) return 6;
  if (/^(BTC\.B|WBTC|WBTC\.E|CBBTC)$/.test(s)) return 8;
  return 18;
};

function normRegistry(r, tokenInfoRaw) {
  if (!r) return undefined;
  const out = [];
  const tiDec = {};
  if (tokenInfoRaw && typeof tokenInfoRaw === 'object' && isAddr(tokenInfoRaw.address) && Number.isInteger(tokenInfoRaw.decimals)) tiDec[lc(tokenInfoRaw.address)] = tokenInfoRaw.decimals;
  const push = (address, symbol, decimals, extra = {}) => {
    if (!isAddr(address)) return;
    out.push({ ...extra, address, symbol, decimals: Number.isInteger(decimals) ? decimals : tiDec[lc(address)] ?? defaultDecimals(symbol) });
  };
  if (Array.isArray(r)) for (const t of r) push(t.address, t.symbol, t.decimals, t);
  else for (const [k, v] of Object.entries(r)) {
    if (isAddr(k)) push(k, v && v.symbol, v && v.decimals, v && typeof v === 'object' ? v : {});
    else if (typeof v === 'string') push(v, k);
    else if (v && typeof v === 'object') push(v.address, v.symbol ?? k, v.decimals, v);
  }
  return out;
}

function normTokenInfo(ti, registry) {
  if (!ti || typeof ti !== 'object') return undefined;
  const fix = (v) => { const o = { ...v }; if (o.contract_age_blocks !== undefined && o.ageBlocks === undefined) o.ageBlocks = o.contract_age_blocks; return o; };
  if (ti.symbol !== undefined || ti.address !== undefined) {
    let a = ti.address;
    if (!isAddr(a)) { const ref = (registry || []).find((r) => String(r.symbol).toUpperCase() === String(ti.symbol).toUpperCase()); a = ref && ref.address; }
    if (!isAddr(a)) return undefined; // nothing to attach the facts to
    return { [a]: fix(ti) };
  }
  const o = {}; for (const [k, v] of Object.entries(ti)) if (isAddr(k) && v && typeof v === 'object') o[k] = fix(v);
  return o;
}

function normFacts(cf) {
  if (!cf) return undefined;
  const list = Array.isArray(cf) ? cf : isAddr(cf.address) ? [cf] : Object.entries(cf).map(([a, v]) => ({ address: a, ...v }));
  const o = {};
  for (const f of list) {
    if (!f || !isAddr(f.address)) continue;
    const v = { ...f }; delete v.address;
    if (v.ageBlocks === null) delete v.ageBlocks;
    if (v.isContract === null) delete v.isContract;
    o[f.address] = v;
  }
  return o;
}

const UNSOLICITED = new Set(['dust_transfer', 'transferFrom_zero_value', 'fake_token_transfer']);
function normHistory(h, nowSec) {
  if (!Array.isArray(h)) return h;
  const out = [];
  for (const e of h) {
    if (!e || typeof e !== 'object') continue;
    if (e.address !== undefined && e.minutes_ago !== undefined) { out.push(e); continue; } // already bench format
    const kind = e.tx_kind || e.type || e.direction;
    let dir;
    if (['outgoing', 'out', 'interaction', 'sortie'].includes(e.type ?? e.direction)) dir = 'sortie';
    else if (['incoming', 'in', 'entree'].includes(e.type ?? e.direction)) dir = 'entree';
    else continue; // approval records etc. : not a transfer
    let amount = e.amount;
    if (UNSOLICITED.has(e.tx_kind)) { dir = 'entree'; amount = '0'; }
    const address = e.counterparty ?? (dir === 'sortie' ? e.to : e.from) ?? e.to ?? e.from;
    if (!isAddr(address)) continue;
    let minutes;
    if (Number.isFinite(e.ts) && nowSec) minutes = Math.max(0, (nowSec - e.ts) / 60);
    else { const d = e.daysAgo ?? e.ageDays ?? e.lastAgeDays; minutes = Number.isFinite(d) ? d * 1440 : 7 * 1440; }
    const n = { address, minutes_ago: Math.round(minutes * 100) / 100, direction: dir, ...(amount !== undefined ? { amount: String(amount) } : {}), kind };
    if (e.token) n.token = e.token;
    if (e.count) n.count = e.count;
    out.push(n);
  }
  return out;
}

export function normalizeCase(c) {
  const k = { ...(c.context || {}) };
  const nowSec = Math.floor(((c.intent && c.intent.declaredAt) ?? 1760000000000) / 1000);
  if (k.victim && typeof k.victim === 'object') { k.victim_meta = k.victim; k.victim = k.victim.address; }
  if (k.origin && typeof k.origin === 'object') { if (k.origin.kind && !k.origin_kind) k.origin_kind = k.origin.kind; k.origin = k.origin.url ?? k.origin.href ?? ''; }
  if (k.known_protocols) {
    const kp = k.known_protocols;
    k.known_protocols = Array.isArray(kp)
      ? kp.map((p) => (typeof p === 'string' ? { address: p } : { ...p, name: p.name ?? p.label })).filter((p) => isAddr(p.address))
      : Object.entries(kp).map(([a, v]) => ({ address: a, name: typeof v === 'string' ? v : v && v.name })).filter((p) => isAddr(p.address));
  }
  const tiRaw = k.token_info;
  if (k.token_registry !== undefined) k.token_registry = normRegistry(k.token_registry, tiRaw) || [];
  if (tiRaw !== undefined) { const ti = normTokenInfo(tiRaw, k.token_registry); if (ti) k.token_info = ti; else { delete k.token_info; if (tiRaw) k.token_info_raw = tiRaw; } }
  if (k.counterparty_facts !== undefined) k.counterparty_facts = normFacts(k.counterparty_facts) || {};
  if (k.history !== undefined) k.history = normHistory(k.history, nowSec);
  if (k.address_book) k.address_book = k.address_book.filter((b) => b && isAddr(b.address));
  return { ...c, context: k, intent: c.intent || {} };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const [inp, out] = process.argv.slice(2);
  if (!inp || !out) { console.error('Usage: node normalize_v2.mjs <in.jsonl> <out.jsonl>'); process.exit(2); }
  if (/V2_TEST/i.test(inp)) { console.error('Refus : V2_TEST est gelé.'); process.exit(2); }
  const lines = readFileSync(inp, 'utf8').split(/\r?\n/).filter((l) => l.trim());
  writeFileSync(out, lines.map((l) => JSON.stringify(normalizeCase(JSON.parse(l)))).join('\n') + '\n');
  console.log(`normalized ${lines.length} cases -> ${out}`);
}

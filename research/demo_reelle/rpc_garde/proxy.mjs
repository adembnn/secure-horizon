// Hold up - RPC guard : the second entry door. A JSON-RPC proxy the wallet uses as its network RPC URL.
// Everything is forwarded to the upstream node unchanged, except eth_sendRawTransaction : the signed transaction is decoded,
// evaluated by the product's own pipeline (server/server.mjs evaluate) and either relayed at once (no signal) or HELD :
// not relayed, kept in memory, and released only from the local decision page after the friction deadline.
//
// Usage : node proxy.mjs                      (127.0.0.1:8555 -> http://127.0.0.1:8545)
// Env   : HOLDUP_RPC_PORT (8555), HOLDUP_UPSTREAM (http://127.0.0.1:8545), HOLDUP_CONTEXT (contacts / history file),
//         HOLDUP_ADDRESSES (demo addresses file), HOLDUP_WAIT_ATTENTION_S (0), HOLDUP_WAIT_UNKNOWN_S (0), HOLDUP_WAIT_DANGER_S (30),
//         HOLDUP_WAIT_MANIPULATION_S (600), HOLDUP_HOLD_TTL_S (1800), HOLDUP_LIVE (1 ; 0 = no chain reads for facts),
//         HOLDUP_LIVE_PROVIDER (0 ; 1 = facts from context_live/provider.mjs instead of the built-in reader),
//         HOLDUP_ASK_NEW_RECIPIENT (0 ; 1 = also hold a transfer to an address never used before, as "information"),
//         HOLDUP_JOURNAL (1), HOLDUP_JOURNAL_FILE.
// Safety : binds 127.0.0.1 only ; fails CLOSED on any internal error for eth_sendRawTransaction, fails OPEN for reads.
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseSignedTx, toSendTransaction, RawTxError, BANC } from './rawtx.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const imp = (p) => import(pathToFileURL(p).href);
// The product pipeline, reused by import (never copied) : evaluate, local context loader, hash-chained journal.
const S = await imp(join(BANC, 'server', 'server.mjs'));
const UI_DIR = join(BANC, 'ui_holdup');

export const HOST = '127.0.0.1';
export const MAX_BODY = 1024 * 1024;
export const SUPPORTED_CHAINS = { 31337: 'AVAX', 43113: 'AVAX', 43114: 'AVAX' }; // 31337 = local rehearsal chain, shown as AVAX
const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const NBSP = ' ';
const num = (v, d) => (v === undefined || v === '' || !Number.isFinite(Number(v)) ? d : Number(v));

// ------------------------------------------------------------------ configuration
export function loadConfig(o = {}) {
  const e = process.env;
  const port = o.port ?? num(e.HOLDUP_RPC_PORT, 8555);
  return {
    port,
    upstream: o.upstream || e.HOLDUP_UPSTREAM || 'http://127.0.0.1:8545',
    // contacts / own history : HOLDUP_CONTEXT, else context.local.json (yours, git-ignored), else the synthetic demo file
    contextFile: o.contextFile || e.HOLDUP_CONTEXT || [join(HERE, 'context.local.json'), join(HERE, 'context.demo.json')].find(existsSync),
    local: o.local || null, // tests : context object given directly
    addressesFile: o.addressesFile === null ? null : (o.addressesFile || e.HOLDUP_ADDRESSES || join(HERE, '..', 'chain', 'addresses.local.json')),
    tokens: o.tokens || {}, // extra trusted token metadata { address: { symbol, decimals } }
    wait: { // friction rule, seconds before "Continuer quand même" is accepted
      attention: num(e.HOLDUP_WAIT_ATTENTION_S, 0), unknown: num(e.HOLDUP_WAIT_UNKNOWN_S, 0),
      danger: num(e.HOLDUP_WAIT_DANGER_S, 30), manipulation: num(e.HOLDUP_WAIT_MANIPULATION_S, 600), ...(o.wait || {}),
    },
    holdTtlMs: o.holdTtlMs ?? num(e.HOLDUP_HOLD_TTL_S, 1800) * 1000,
    maxHolds: o.maxHolds ?? 200,
    live: o.live ?? e.HOLDUP_LIVE !== '0',
    liveProvider: o.liveProvider ?? e.HOLDUP_LIVE_PROVIDER === '1',
    liveTimeoutMs: o.liveTimeoutMs ?? 1200,
    askNewRecipient: o.askNewRecipient ?? e.HOLDUP_ASK_NEW_RECIPIENT === '1',
    forwardTimeoutMs: o.forwardTimeoutMs ?? 30000,
    journalEnabled: o.journalEnabled ?? e.HOLDUP_JOURNAL !== '0',
    journalFile: o.journalFile || e.HOLDUP_JOURNAL_FILE || join(HERE, 'journal', 'decisions.jsonl'),
    evaluate: o.evaluate || S.evaluate, // tests only : lets a test make the pipeline throw
  };
}

// Trusted token labels for display : DemoUSDC and friends from the demo addresses file (address -> label), never from the chain.
function trustedTokens(cfg) {
  const out = {};
  try {
    if (cfg.addressesFile && existsSync(cfg.addressesFile)) {
      const a = JSON.parse(readFileSync(cfg.addressesFile, 'utf8'));
      const add = (addr, symbol, decimals) => { if (HEX20.test(String(addr || ''))) out[lc(addr)] = { symbol, decimals, chainId: Number(a.chainId) }; };
      add(a.usdc, 'DemoUSDC', 6); add(a.wavax, 'DemoWAVAX', 18); add(a.realUsdc, 'USDC', 6);
    }
  } catch { /* unreadable file : no trusted label, amounts stay in raw units */ }
  for (const [k, v] of Object.entries(cfg.tokens)) out[lc(k)] = { ...v };
  return out;
}

// ------------------------------------------------------------------ upstream
function makeUpstream(cfg) {
  let n = 0;
  async function post(text, timeoutMs) {
    const r = await fetch(cfg.upstream, { method: 'POST', headers: { 'content-type': 'application/json' }, body: text, signal: AbortSignal.timeout(timeoutMs) });
    return { status: r.status, text: await r.text(), type: r.headers.get('content-type') || 'application/json' };
  }
  // -> the full JSON-RPC response object ({ result } or { error })
  async function rpc(method, params, timeoutMs = cfg.forwardTimeoutMs) {
    const r = await post(JSON.stringify({ jsonrpc: '2.0', id: 'holdup-' + (++n), method, params }), timeoutMs);
    const j = JSON.parse(r.text);
    if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('upstream answered something that is not a JSON-RPC response');
    return j;
  }
  async function read(method, params, timeoutMs) { // -> result, or undefined when unknown
    try { const j = await rpc(method, params, timeoutMs); return j.error ? undefined : j.result; } catch { return undefined; }
  }
  let chainId; // cached once known
  async function getChainId() {
    if (chainId === undefined) { const v = await read('eth_chainId', [], 5000); if (typeof v === 'string') { try { chainId = Number(BigInt(v)); } catch { /* unknown */ } } }
    return chainId;
  }
  return { post, rpc, read, getChainId };
}

// ------------------------------------------------------------------ what the transaction moves (ERC-20 calls we can name)
const ERC20 = { '0xa9059cbb': ['transfer', 0, 1], '0x095ea7b3': ['approve', 0, 1], '0x39509351': ['increaseAllowance', 0, 1], '0x23b872dd': ['transferFrom', 1, 2] };
const UINT_MAX = (1n << 256n) - 1n;
export function tokenCall(tx) {
  const d = tx.input || '0x', spec = ERC20[d.slice(0, 10)];
  if (!tx.to || !spec) return null;
  const words = (d.length - 10) / 64;
  if (!Number.isInteger(words) || words < spec[2] + 1) return null;
  const w = (i) => d.slice(10 + 64 * i, 74 + 64 * i);
  if (!/^0{24}/.test(w(spec[1]))) return null;
  return { kind: spec[0], token: tx.to, counterparty: '0x' + w(spec[1]).slice(24).toLowerCase(), amount: BigInt('0x' + w(spec[2])) };
}

// French display of an amount in token units : 2480000000, 6 -> "2 480" (thousands separated by a non-breaking space)
export function formatUnits(v, decimals) {
  const s = v.toString().padStart(decimals + 1, '0');
  const int = s.slice(0, s.length - decimals).replace(/\B(?=(\d{3})+$)/g, NBSP);
  const frac = decimals ? s.slice(-decimals).replace(/0+$/, '').slice(0, 6) : '';
  return frac ? `${int},${frac}` : int;
}

function decodeString(hex) { // ABI string, or bytes32 (old tokens)
  try {
    const b = Buffer.from(String(hex).slice(2), 'hex');
    let s;
    if (b.length === 32) s = b.toString('utf8').replace(/\0+$/, '');
    else { const len = Number(BigInt('0x' + b.subarray(32, 64).toString('hex'))); if (len > 64) return undefined; s = b.subarray(64, 64 + len).toString('utf8'); }
    return /^[\x20-\x7e]{1,32}$/.test(s) ? s : undefined; // printable ASCII only : the symbol is written by whoever deployed the token
  } catch { return undefined; }
}

// Built-in live reader : a handful of READ-ONLY calls on the upstream node, in parallel, short timeout. Unknown stays undefined.
// Same shape as context_live/provider.mjs toEngineContext() so that both can feed the pipeline the same way.
async function readLiveFacts(tx, up, cfg) {
  const t = cfg.liveTimeoutMs, tc = tokenCall(tx), from = tx.from;
  const word = (a) => a.slice(2).padStart(64, '0');
  const out = { isContract: {}, ageBlocks: {}, balances: {}, tokenMeta: {}, facts: {}, tokenInfo: {}, allowances: {}, missing: [] };
  const targets = [...new Set([tx.to, tc && tc.counterparty].filter(Boolean))];
  const jobs = targets.map(async (a) => { const c = await up.read('eth_getCode', [a, 'latest'], t); if (typeof c === 'string') { out.isContract[a] = c !== '0x'; out.facts[a] = { isContract: c !== '0x' }; } else out.missing.push('code:' + a); });
  jobs.push((async () => { const b = await up.read('eth_getBalance', [from, 'latest'], t); if (typeof b === 'string') out.balances.native = BigInt(b).toString(); else out.missing.push('balance:native'); })());
  if (tc) {
    jobs.push((async () => {
      const [sym, dec, bal] = await Promise.all([up.read('eth_call', [{ to: tc.token, data: '0x95d89b41' }, 'latest'], t), up.read('eth_call', [{ to: tc.token, data: '0x313ce567' }, 'latest'], t),
        up.read('eth_call', [{ to: tc.token, data: '0x70a08231' + word(from) }, 'latest'], t)]);
      const symbol = typeof sym === 'string' ? decodeString(sym) : undefined;
      let decimals; try { if (typeof dec === 'string' && dec.length === 66) { const d = Number(BigInt(dec)); if (d >= 0 && d <= 36) decimals = d; } } catch { /* unknown */ }
      if (symbol !== undefined && decimals !== undefined) { out.tokenMeta[tc.token] = { symbol, decimals }; out.tokenInfo[tc.token] = { symbol, decimals }; } else out.missing.push('token:' + tc.token);
      try { if (typeof bal === 'string' && bal.length === 66) out.balances[tc.token] = BigInt(bal).toString(); else out.missing.push('balance:' + tc.token); } catch { out.missing.push('balance:' + tc.token); }
    })());
  }
  await Promise.all(jobs);
  return out;
}

let providerMod = null;
async function liveFacts(tx, request, local, up, cfg) {
  if (!cfg.live) return null;
  try {
    if (cfg.liveProvider) { // the other agent's provider (contract age, allowances...) : optional, its failure falls back to the built-in reader
      try {
        providerMod ??= await imp(join(BANC, 'context_live', 'provider.mjs'));
        const seen = local.contacts.length || local.history.length ? [...local.contacts.map((c) => c.address), ...local.history.filter((h) => h.direction === 'sortie').map((h) => lc(h.address))] : undefined;
        const { engine } = await providerMod.liveEngineContext({ chainId: tx.chainId, from: tx.from, request, rpcUrl: cfg.upstream, seen, options: { budgetMs: cfg.liveTimeoutMs + 300 } });
        if (engine && !(engine.missing || []).includes('live_context_absent')) return engine;
      } catch { /* fall through */ }
    }
    return await readLiveFacts(tx, up, cfg);
  } catch { return null; }
}

// ------------------------------------------------------------------ verdict : display fixes the pipeline cannot do without chain facts
// server.mjs evaluate() has no token table for Avalanche and no native symbol for 31337 : it says "100000000 jetons" and "unités du réseau".
// We only rewrite those two wordings with facts we hold (trusted label, else what the token says of itself). Levels and reasons are never touched here.
function localize(v, tx, live, trusted) {
  const tc = tokenCall(tx);
  const subs = [];
  const native = SUPPORTED_CHAINS[tx.chainId];
  if (native && S.NATIVE_UNKNOWN) subs.push([S.NATIVE_UNKNOWN, native]);
  let meta = null;
  if (tc) {
    const tr = trusted[tc.token];
    meta = tr && (tr.chainId === undefined || tr.chainId === tx.chainId) ? tr : (live && live.tokenMeta && live.tokenMeta[tc.token]) || null;
    if (meta) {
      if (tc.amount !== UINT_MAX) subs.push([`${tc.amount.toString()} jetons`, `${formatUnits(tc.amount, meta.decimals)}${NBSP}${meta.symbol}`]);
      subs.push(['tes jetons', `tes ${meta.symbol}`], ['Tes jetons', `Tes ${meta.symbol}`]);
    }
  }
  const fix = (s) => (typeof s === 'string' ? subs.reduce((x, [a, b]) => x.split(a).join(b), s) : s);
  if (v.texts) for (const k of Object.keys(v.texts)) v.texts[k] = fix(v.texts[k]);
  if (Array.isArray(v.reasons)) v.reasons = v.reasons.map(fix);
  for (const k of ['said', 'real']) if (v[k] && typeof v[k].amount === 'string') v[k].amount = fix(v[k].amount);
  // plain facts read on the chain, shown under "Pourquoi ?" (12 words at most, no jargon). They explain, they never decide.
  const facts = [];
  if (tc && live) {
    const bal = live.balances && live.balances[tc.token];
    if (bal !== undefined && (tc.kind === 'transfer') && BigInt(bal) > 0n && meta) {
      const pct = Number((tc.amount * 100n) / BigInt(bal));
      if (pct > 100) facts.push(`Tu n'as pas autant de ${meta.symbol} sur ce compte.`);
      else if (pct >= 50) facts.push(`Cet envoi représente ${pct}${NBSP}% de tes ${meta.symbol}.`);
    }
    if (tc.kind === 'transfer' && live.isContract && live.isContract[tc.counterparty] === true) facts.push("Le destinataire est un programme, pas le compte d'une personne.");
  }
  if (!Array.isArray(v.reasons)) v.reasons = [];
  for (const f of facts) if (!v.reasons.includes(f)) v.reasons.push(f);
  return v;
}

// How loud a verdict is. A hold can only go UP this scale (intent answer), never down.
const rank = (v) => (v.level === 'manipulation' ? 3 : v.level === 'danger' || v.niveau === 'critical' ? 2 : v.level === 'unknown' || v.indeterminate || v.niveau === 'warn' ? 1 : 0);
const frictionKey = (v) => (v.level === 'manipulation' ? 'manipulation' : rank(v) === 2 ? 'danger' : v.level === 'unknown' || v.indeterminate ? 'unknown' : 'attention');
// UI choice (ui_holdup verdict.js) -> the value server.mjs toIntent() understands
const INTENT_MAP = { payer: 'pay', recevoir: 'receive', connexion: 'login', demande: 'asked', echanger: 'other' };

// ------------------------------------------------------------------ JSON-RPC errors the wallet receives
// geth and the Avalanche C-Chain answer a refused raw transaction with HTTP 200 and { error: { code: -32000, message } } ; wallets show
// that message as a failed transaction. We use the same shape so that the refusal is a clean failure, not a network error.
const rpcError = (id, message, data) => ({ jsonrpc: '2.0', id: id === undefined ? null : id, error: { code: -32000, message, ...(data ? { data } : {}) } });
const stripDot = (s) => String(s || '').trim().replace(/[.\s]+$/, '');

// ------------------------------------------------------------------ the guard
export async function createGuard(options = {}) {
  const cfg = loadConfig(options);
  const up = makeUpstream(cfg);
  const journal = S.makeJournal(cfg.journalFile, cfg.journalEnabled);
  const trusted = trustedTokens(cfg);
  const holds = new Map();   // id -> hold
  const byHash = new Map();  // transaction hash -> id of the latest hold for these exact bytes
  const inflight = new Map(); // transaction hash -> promise, so that two copies arriving together are judged once
  const stats = { forwarded: 0, passed: 0, held: 0, refused: 0, continued: 0, cancelled: 0, expired: 0 };
  let base = `http://${HOST}:${cfg.port}`;
  const log = (entry) => { try { journal.append(entry); } catch { /* the journal never blocks a verdict */ } };
  const localCtx = () => cfg.local || S.loadLocalContext(cfg.contextFile);

  function sweep(now = Date.now()) {
    for (const h of holds.values()) {
      if (h.status === 'pending' && now >= h.expiresAt) { h.status = 'expired'; h.raw = null; h.closedAt = now; stats.expired++; log({ type: 'rpc_decision', decision: 'expire', hold: h.id, tx: h.tx.hash, level: h.verdict.level }); }
      else if (h.status !== 'pending' && h.status !== 'sending' && now - (h.closedAt || now) > cfg.holdTtlMs) { holds.delete(h.id); if (byHash.get(h.tx.hash) === h.id) byHash.delete(h.tx.hash); }
    }
  }
  const sweeper = setInterval(sweep, 5000); sweeper.unref();

  const urlOf = (h) => `${base}/hold/${h.id}?t=${h.token}`;
  function heldError(id, h) {
    const why = stripDot(h.verdict.texts && h.verdict.texts.reel) || "Hold up n'a pas pu vérifier cette opération";
    return rpcError(id, `Hold up a retenu cette opération. ${why}. Rien n'est parti. Pour décider, ouvre ${urlOf(h)}`,
      { holdup: { hold: h.id, level: h.verdict.level, deadline: new Date(h.deadline).toISOString(), url: urlOf(h) } });
  }

  function judge(tx, local, live, intent) {
    const req = toSendTransaction(tx);
    const body = { ...req, chainId: tx.chainId, from: tx.from };
    if (intent && INTENT_MAP[intent.choice]) { body.intent = INTENT_MAP[intent.choice]; if (intent.text) body.intent_text = intent.text; }
    // third argument : live facts in the shape server_integration.diff expects. server.mjs ignores it until that diff is applied.
    const v = cfg.evaluate(body, local, live);
    if (!v || typeof v !== 'object' || !v.texts || typeof v.level !== 'string') throw new Error('pipeline returned no verdict');
    return localize(v, tx, live, trusted);
  }
  const passes = (v) => rank(v) === 0 && v.niveau === 'info' && !(cfg.askNewRecipient && (v.risk_signals || []).includes('new_recipient'));

  // eth_sendRawTransaction. Never throws : any failure is a refusal (fail closed).
  async function sendRaw(rpc) {
    const id = rpc.id;
    let tx;
    try {
      const raw = Array.isArray(rpc.params) ? rpc.params[0] : undefined;
      try { tx = parseSignedTx(raw); } catch (e) {
        stats.refused++;
        const code = e instanceof RawTxError ? e.code : 'internal';
        log({ type: 'rpc_verdict', outcome: 'refused', reason: code });
        return rpcError(id, code === 'unsupported' ? "Hold up ne sait pas lire ce type de transaction. Elle n'a pas été envoyée."
          : "Hold up n'a pas pu lire cette transaction. Elle n'a pas été envoyée.", { holdup: { refused: code } });
      }
      while (inflight.has(tx.hash)) await inflight.get(tx.hash).catch(() => {});
      const job = sendRawOnce(id, raw, tx);
      inflight.set(tx.hash, job);
      try { return await job; } finally { inflight.delete(tx.hash); }
    } catch (e) {
      stats.refused++;
      log({ type: 'rpc_verdict', outcome: 'refused', reason: 'internal', tx: tx ? tx.hash : null });
      return rpcError(id, "Hold up a eu un problème et n'a pas envoyé cette opération. Rien n'est parti. Réessaie dans un instant.", { holdup: { refused: 'internal' } });
    }
  }

  async function sendRawOnce(id, raw, tx) {
    sweep();
    // the same bytes again : same hold, never a second one, never relayed behind the user's back
    const prev = holds.get(byHash.get(tx.hash));
    if (prev) {
      if (prev.status === 'pending' || prev.status === 'sending') { prev.resent++; return heldError(id, prev); }
      if (prev.status === 'sent') return { jsonrpc: '2.0', id, result: prev.sentHash };
      // cancelled or expired : the user signs the same thing again -> judged again from scratch (a fresh hold, a fresh wait)
    }
    const chain = await up.getChainId();
    if (chain !== undefined && chain !== tx.chainId) {
      stats.refused++;
      log({ type: 'rpc_verdict', outcome: 'refused', reason: 'chain_mismatch', tx: tx.hash, chainId: tx.chainId, upstream: chain });
      return rpcError(id, `Hold up n'a pas envoyé cette opération : elle vise un autre réseau (${tx.chainId}) que celui de ce nœud (${chain}).`, { holdup: { refused: 'chain_mismatch' } });
    }
    const local = localCtx();
    const live = await liveFacts(tx, toSendTransaction(tx), local, up, cfg);
    const v = judge(tx, local, live, null);
    const common = { tx: tx.hash, from: tx.from, to: tx.to, chainId: tx.chainId, tx_type: tx.type, level: v.level, niveau: v.niveau, fiche: v.fiche || null, codes: v.codes || [], live: live ? (live.missing || []).length === 0 : false };
    if (passes(v)) {
      stats.passed++;
      log({ type: 'rpc_verdict', outcome: 'pass', ...common });
      const j = await up.rpc('eth_sendRawTransaction', [raw]); // upstream down -> throws -> refusal above, nothing was sent
      return { ...j, id };
    }
    if ([...holds.values()].filter((h) => h.status === 'pending').length >= cfg.maxHolds) throw new Error('too many pending holds');
    const now = Date.now();
    const h = {
      id: randomBytes(8).toString('hex'), token: randomBytes(16).toString('hex'), raw, status: 'pending', resent: 0,
      tx: { hash: tx.hash, from: tx.from, to: tx.to, chainId: tx.chainId, nonce: tx.nonce.toString(), type: tx.type },
      verdict: v, live, createdAt: now, deadline: now + cfg.wait[frictionKey(v)] * 1000, expiresAt: now + cfg.holdTtlMs, intent: null, sentHash: null, lastError: null,
    };
    holds.set(h.id, h); byHash.set(tx.hash, h.id); stats.held++;
    log({ type: 'rpc_verdict', outcome: 'hold', hold: h.id, wait_s: cfg.wait[frictionKey(v)], ...common });
    return heldError(id, h);
  }

  // ---- decisions (called from the decision page only)
  async function doContinue(h) {
    const now = Date.now();
    if (h.status === 'sent') return [200, view(h)];
    if (h.status !== 'pending') return [410, { error: 'closed', message: "Cette demande n'est plus en attente.", hold: view(h) }];
    if (now < h.deadline) return [409, { error: 'too_early', message: 'Attends encore avant de continuer.', remaining_ms: h.deadline - now, hold: view(h) }];
    h.status = 'sending';
    try {
      const j = await up.rpc('eth_sendRawTransaction', [h.raw]);
      if (j.error || typeof j.result !== 'string') {
        h.status = 'pending'; h.lastError = String((j.error && j.error.message) || 'réponse inattendue du nœud').slice(0, 200);
        log({ type: 'rpc_decision', decision: 'continue_failed', hold: h.id, tx: h.tx.hash, error: h.lastError });
        return [502, { error: 'upstream_refused', message: "Le réseau a refusé cette opération. Rien n'est parti.", detail: h.lastError, hold: view(h) }];
      }
      h.status = 'sent'; h.sentHash = j.result; h.raw = null; h.closedAt = Date.now(); stats.continued++;
      log({ type: 'rpc_decision', decision: 'continue', hold: h.id, tx: h.tx.hash, sent: h.sentHash, level: h.verdict.level, waited_ms: h.closedAt - h.createdAt, intent: h.intent ? h.intent.choice : null });
      return [200, view(h)];
    } catch (e) {
      h.status = 'pending'; h.lastError = 'nœud injoignable';
      return [502, { error: 'upstream_unreachable', message: "Le réseau ne répond pas. Rien n'est parti.", hold: view(h) }];
    }
  }
  function doCancel(h) {
    if (h.status === 'pending') {
      h.status = 'cancelled'; h.raw = null; h.closedAt = Date.now(); stats.cancelled++;
      log({ type: 'rpc_decision', decision: 'cancel', hold: h.id, tx: h.tx.hash, level: h.verdict.level, waited_ms: h.closedAt - h.createdAt, intent: h.intent ? h.intent.choice : null });
    }
    return [h.status === 'cancelled' ? 200 : 410, view(h)];
  }
  // The RPC cannot ask before the signature : the question is asked on the decision page and the comparison is run again.
  function doIntent(h, body) {
    if (h.status !== 'pending') return [410, { error: 'closed', hold: view(h) }];
    const choice = String(body.intent || '');
    if (!Object.hasOwn(INTENT_MAP, choice)) return [400, { error: 'bad_intent' }];
    const intent = { choice, text: typeof body.intent_message === 'string' ? body.intent_message.slice(0, 500) : '' };
    const before = rank(h.verdict);
    let raised = false;
    try {
      const v = judge(parseSignedTx(h.raw), localCtx(), h.live, intent);
      // the answer can only RAISE the verdict : a lower result is ignored, and the deadline never moves closer
      if (rank(v) >= before && !passes(v)) {
        raised = rank(v) > before;
        h.verdict = v;
        if (raised) h.deadline = Math.max(h.deadline, Date.now() + cfg.wait[frictionKey(v)] * 1000);
      }
    } catch { /* comparison failed : the verdict we had stays */ }
    h.intent = intent;
    log({ type: 'rpc_decision', decision: 'intent', hold: h.id, tx: h.tx.hash, intent: choice, raised, level: h.verdict.level, fiche: h.verdict.fiche || null });
    return [200, view(h)];
  }

  // what the decision page may know (with the token) ; never the raw transaction
  function view(h) {
    const v = h.verdict;
    return {
      id: h.id, status: h.status === 'sending' ? 'pending' : h.status, created_at: h.createdAt, deadline: h.deadline, expires_at: h.expiresAt, now: Date.now(),
      tx: h.tx, sent_hash: h.sentHash, last_error: h.lastError, intent: h.intent ? h.intent.choice : null, resent: h.resent,
      verdict: { level: v.level, niveau: v.niveau, fiche: v.fiche || null, texts: v.texts, reasons: v.reasons, address_diff: v.address_diff, quote: v.quote, indeterminate: v.indeterminate, title: v.title },
    };
  }
  const summary = (h, withUrl) => ({ id: h.id, status: h.status === 'sending' ? 'pending' : h.status, level: h.verdict.level, niveau: h.verdict.niveau, created_at: h.createdAt, deadline: h.deadline,
    line: (h.verdict.texts && h.verdict.texts.reel) || '', sent_hash: h.sentHash, ...(withUrl ? { url: urlOf(h) } : {}) });

  // ------------------------------------------------------------------ HTTP
  const STATIC = {
    '/decision.js': [join(HERE, 'decision.js'), 'text/javascript; charset=utf-8'], '/decision.css': [join(HERE, 'decision.css'), 'text/css; charset=utf-8'],
    '/holds.js': [join(HERE, 'holds.js'), 'text/javascript; charset=utf-8'],
    '/ui/verdict.js': [join(UI_DIR, 'verdict.js'), 'text/javascript; charset=utf-8'], '/ui/verdict.css': [join(UI_DIR, 'verdict.css'), 'text/css; charset=utf-8'],
  };
  const SEC = {
    'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY', 'cross-origin-resource-policy': 'same-origin',
    'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  };
  const tokenOk = (h, t) => { const a = Buffer.from(String(t || '')), b = Buffer.from(h.token); return a.length === b.length && timingSafeEqual(a, b); };

  function readBody(req) {
    return new Promise((res, rej) => {
      const chunks = []; let size = 0;
      req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { rej(Object.assign(new Error('too big'), { tooBig: true })); req.destroy(); } else chunks.push(c); });
      req.on('end', () => res(Buffer.concat(chunks).toString('utf8')));
      req.on('error', rej);
    });
  }

  async function handleRpc(text) { // -> [status, bodyText, contentType]
    let msg;
    try { msg = JSON.parse(text); } catch { return [200, JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }), 'application/json']; }
    const guarded = (m) => m && typeof m === 'object' && typeof m.method === 'string' && /^eth_sendRawTransaction/.test(m.method);
    const one = async (m) => {
      if (guarded(m)) {
        if (m.method !== 'eth_sendRawTransaction') { stats.refused++; return rpcError(m.id, "Hold up ne gère pas cette façon d'envoyer une transaction. Elle n'a pas été envoyée.", { holdup: { refused: 'method' } }); }
        return sendRaw(m);
      }
      const r = await up.post(JSON.stringify(m), cfg.forwardTimeoutMs);
      try { return JSON.parse(r.text); } catch { return rpcError(m && m.id, 'upstream answered something that is not JSON'); }
    };
    if (Array.isArray(msg)) {
      if (!msg.some(guarded)) return forward(text, msg);
      const out = [];
      for (const m of msg) { // a batch that carries a transaction : entry by entry, in order
        let r;
        try { r = await one(m); } catch { r = rpcError(m && m.id, 'upstream unreachable'); }
        if (m && typeof m === 'object' && m.id !== undefined) out.push(r);
      }
      return [200, JSON.stringify(out), 'application/json'];
    }
    if (guarded(msg)) return [200, JSON.stringify(await one(msg)), 'application/json'];
    return forward(text, msg);
  }
  // Reads : forwarded unchanged, answer returned unchanged. The bytes are re-serialised only when they could hide a transaction from our
  // parser (duplicate keys, escaped method name), so that the upstream node reads exactly what we read.
  async function forward(text, msg) {
    stats.forwarded++;
    const safe = !text.includes('RawTransaction') && !text.includes('\\u');
    try { const r = await up.post(safe ? text : JSON.stringify(msg), cfg.forwardTimeoutMs); return [r.status, r.text, r.type]; }
    catch { return [502, JSON.stringify(rpcError(msg && !Array.isArray(msg) ? msg.id : null, 'Hold up : le nœud en amont ne répond pas.')), 'application/json']; }
  }

  const srv = http.createServer(async (req, res) => {
    const send = (code, body, type = 'application/json; charset=utf-8', extra = {}) => { res.writeHead(code, { 'content-type': type, ...SEC, ...extra }); res.end(body); };
    const json = (code, obj) => send(code, JSON.stringify(obj));
    try {
      // 1) loopback only, and only our own host name : a web page cannot reach us through a rebound DNS name
      const ra = req.socket.remoteAddress;
      if (ra !== '127.0.0.1' && ra !== '::ffff:127.0.0.1') return json(403, { error: 'adresse refusée' });
      const host = String(req.headers.host || '');
      const port = srv.address().port;
      if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return json(403, { error: 'hôte refusé' });
      const u = new URL(req.url || '/', `http://${host}`);
      const path = u.pathname;
      const origin = req.headers.origin, site = req.headers['sec-fetch-site'];
      // a request made BY a web page of another origin (or by an extension) ; plain navigation and local tools are not
      const foreign = (origin !== undefined && origin !== `http://${host}`) || (site !== undefined && site !== 'same-origin' && site !== 'none');

      // 2) the JSON-RPC door : any local client (wallet extension, script). No CORS header is ever sent, so a web page cannot read an answer
      //    (the answer of a held transaction carries the decision link).
      if (req.method === 'POST' && path === '/') {
        let text;
        try { text = await readBody(req); } catch (e) { return json(e.tooBig ? 413 : 400, rpcError(null, 'requête illisible')); }
        const [code, body, type] = await handleRpc(text);
        return send(code, body, type);
      }
      if (req.method === 'OPTIONS') return send(403, '');

      // 3) pages and assets
      if (req.method === 'GET') {
        if (path === '/health') return json(200, { status: 'up', service: 'holdup-rpc-garde', upstream: cfg.upstream, chain_id: await up.getChainId() ?? null, stats });
        if (path === '/') return send(200, readFileSync(join(HERE, 'holds.html')), 'text/html; charset=utf-8');
        if (/^\/hold\/[0-9a-f]{16}$/.test(path)) return send(200, readFileSync(join(HERE, 'decision.html')), 'text/html; charset=utf-8');
        if (STATIC[path]) return send(200, readFileSync(STATIC[path][0]), STATIC[path][1]);
      }

      // 4) holds : never for a foreign web page
      const m = path.match(/^\/holds(?:\/([0-9a-f]{16})(?:\/(continue|cancel|intent))?)?$/);
      if (!m) return json(404, { error: 'introuvable' });
      if (foreign) return json(403, { error: 'origine refusée' });
      sweep();
      if (req.method === 'GET' && !m[1]) { // the presenter's list. Decision links are included : this answer is unreadable from another origin.
        const list = [...holds.values()].sort((a, b) => b.createdAt - a.createdAt).map((h) => summary(h, true));
        return json(200, { now: Date.now(), holds: list });
      }
      const h = holds.get(m[1]);
      if (req.method === 'GET' && m[1] && !m[2]) {
        if (!h || !tokenOk(h, u.searchParams.get('t'))) return json(403, { error: 'lien invalide' });
        return json(200, view(h));
      }
      if (req.method === 'POST' && m[2]) {
        if (!/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) return json(415, { error: 'application/json attendu' }); // not a "simple" cross-site request
        let body;
        try { body = JSON.parse(await readBody(req) || 'null'); } catch { return json(400, { error: 'JSON illisible' }); }
        if (!body || typeof body !== 'object') return json(400, { error: 'objet JSON attendu' });
        if (!h || !tokenOk(h, body.t)) return json(403, { error: 'lien invalide' });
        const [code, out] = m[2] === 'continue' ? await doContinue(h) : m[2] === 'cancel' ? doCancel(h) : doIntent(h, body);
        return json(code, out);
      }
      return json(405, { error: 'méthode refusée' });
    } catch (e) {
      try { json(500, { error: 'erreur interne' }); } catch { /* socket gone */ }
    }
  });
  srv.headersTimeout = 15000; srv.requestTimeout = 60000; srv.keepAliveTimeout = 5000;
  await new Promise((ok, ko) => { srv.once('error', ko); srv.listen(cfg.port, HOST, ok); });
  base = `http://${HOST}:${srv.address().port}`;
  return { srv, cfg, port: srv.address().port, url: base, holds, stats, journal, sweep,
    close: () => new Promise((r) => { clearInterval(sweeper); srv.closeAllConnections?.(); srv.close(r); }) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const g = await createGuard();
    const chain = await fetch(g.url + '/health').then((r) => r.json()).then((j) => j.chain_id).catch(() => null);
    console.log(`Hold up, porte RPC : ${g.url}  ->  ${g.cfg.upstream}  (chainId ${chain ?? 'inconnu : nœud injoignable'})`);
    console.log(`Demandes retenues : ${g.url}/   Contexte : ${g.cfg.contextFile || 'aucun'}   Journal : ${g.journal.enabled ? g.journal.file : 'désactivé'}`);
    console.log(`Attente : attention ${g.cfg.wait.attention} s, non vérifié ${g.cfg.wait.unknown} s, danger ${g.cfg.wait.danger} s, manipulation ${g.cfg.wait.manipulation} s. Ctrl+C pour arrêter.`);
  } catch (e) {
    console.error(e.code === 'EADDRINUSE' ? 'Ce port est déjà utilisé. Ferme l\'autre programme ou change HOLDUP_RPC_PORT.' : 'Échec du démarrage : ' + e.message);
    process.exit(1);
  }
}

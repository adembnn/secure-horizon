/* Hold up - gatekeeper, shared by both service workers (server mode and standalone). ES module.
 * It receives the gated requests from bridge.js, asks the engine (injected `check`), keeps every pending request in
 * chrome.storage.session through hold_core.js, shows the verdict in a separate extension window (window.html) and answers
 * the page side from the storage. Nothing here keeps a decision in memory : the worker can die at any time.
 * Fallback : if the window cannot be created, the in-page overlay of bridge.js is used and the journal says so. */
import { HoldStore, LIMITS, enterVerdict, frictionFor, validRid } from './hold_core.js';
import { ENGINE_CHOICE, KINDS, MAX_TEXT, MODEL_MIN, NO_MATCH, cleanText, interpret, keywordClassify, stricter } from './intent_text.js';
import { TEXT, answerOf, networkName, siteName } from './outcome.js';
import { canCorrect, effectCheck, limitPlan, limitText, operationCheck, relance, requestFacts, signIn, tokensOf, usedBy, writtenCheck } from './written_check.js';
import { measure, readToken } from './effect_sim.js';
import { RULES_FINGERPRINT, chainAppend, rulesTag, sha256 } from './journal_chain.js'; // fingerprint : written by tools/gen_rules_fingerprint.mjs, no fetch
import { revocationFor } from './revoke.js';

const LEVELS = ['ok', 'attention', 'danger', 'manipulation'];
const RANK = { attention: 1, unknown: 2, danger: 3, manipulation: 4 };
const DEFAULT_CFG = {
  dangerWaitMs: 30000,          // Danger : phrase to retype + this delay (floor 5 s)
  manipulationHoldMs: 600000,   // Manipulation : hold (floor 30 s)
  timeoutMs: 3000,
  askIntent: 'always',          // 'never' | 'rights_or_funds' | 'always' : intent question before the verdict
  verdictWindow: true,          // false = always the in-page overlay (trial only)
  grill: { enabled: true, shuffle: true, maxQuestions: 4 },
  limitUnlimited: true,         // Q17 : replace a spending right wider than the written amount by that amount, before the wallet sees it
  contact: { name: '', tel: '' }
};
const FLOOD = { maxPending: 10, cancelsBeforeBlock: 5, blockMs: 60000 }; // S13 : at most 10 held requests in all ; five cancels in a row from one origin = refused for 60 s
const INTENT_METHODS = new Set(['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign',
  'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4', 'wallet_sendCalls', 'eth_sendRawTransaction']);
// Values shown by the verdict surface ('demande' opens its paste box) -> choice understood by the engine (null = no declared intent, objective floor).
const INTENT_CHOICES = [
  { value: 'receive', label: 'Recevoir' }, { value: 'pay', label: 'Payer' }, { value: 'swap', label: 'Échanger' },
  { value: 'login', label: 'Me connecter' }, { value: 'demande', label: 'On me l’a demandé' }];
const INTENT_ENGINE = { receive: 'receive', pay: 'pay', login: 'login', demande: 'asked', asked: 'asked', swap: null, other: null };
const MAX_KEPT_BODY = 200000;   // above, the request body is slimmed to the fields that matter (S7) ; if it is still too big : "not verified", held, no question
// S7 : the fields of a transaction or of a batch that the engine and the written check actually read. A page cannot pad a request with
// a useless field to push it over MAX_KEPT_BODY and skip the question : the padding is dropped, the question is asked.
const TX_KEYS = ['from', 'to', 'value', 'data', 'input', 'gas', 'gasLimit', 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas', 'nonce', 'chainId', 'type'];
const pick = (o, keys) => { const out = {}; if (o && typeof o === 'object') for (const k of keys) if (o[k] !== undefined) out[k] = o[k]; return out; };
function slimBody(body) {
  const p = body && Array.isArray(body.params) ? body.params : null;
  if (!p) return null;
  const out = Object.assign({}, body);
  if (body.method === 'eth_sendTransaction' || body.method === 'eth_signTransaction') out.params = [pick(p[0], TX_KEYS)];
  else if (body.method === 'wallet_sendCalls') {
    const c = p[0] && typeof p[0] === 'object' ? p[0] : {};
    out.params = [Object.assign(pick(c, ['version', 'from', 'chainId', 'atomicRequired', 'id']), { calls: Array.isArray(c.calls) ? c.calls.map((x) => pick(x, ['to', 'value', 'data', 'input'])) : [] })];
  } else return null;
  return out;
}
const TOO_BIG_LINE = 'Cette demande est trop grande pour que je la lise en entier.';
// S4 : the danger (or attention) of the engine is only the gap the correction removes : a right wider than the written amount.
// Any other finding (a flagged spender, a signal, a contradiction, a danger nobody explains) keeps its delay and its phrase.
const GAP_CODES = new Set(['unlimited_allowance', 'external_spender', 'unlimited_approval_swap', 'approval_exceeds_intent', 'F31:droit_plus_large_inconnu']);
function onlyTheGap(floor, v) {
  if (!floor || !v) return false;
  for (const x of [floor, v]) if ((x.risk_signals || []).length || x.intent_contradiction || x.address_diff || x.indeterminate) return false;
  if (floor.level !== 'attention' && floor.level !== 'danger') return false;
  const codes = (x) => (Array.isArray(x.codes) ? x.codes : []);
  for (const x of [floor, v]) for (const c of codes(x)) if (!GAP_CODES.has(c)) return false;
  if (floor.level === 'danger' && !codes(floor).length) return false; // a danger nobody explains stays a danger
  return true;
}
const WIN = { width: 440, height: 540 };
const AUTO_MS = 1000;           // "Ça correspond" stays on screen this long, then the request goes to the wallet by itself
// One written intent covers ONE operation : the requests that follow from the same tab, frame and origin (an approval, then the
// exchange it prepares) are compared to the same sentence instead of asking again. It lasts 90 s after the last request it let
// through : the time to confirm in the wallet and for that transaction to be mined before the site sends the next one (about
// 2 s on Avalanche, 12 to 30 s on Ethereum, plus the reading of the wallet's own popup). Never more than 120 s after the
// sentence was written, whatever happens. Past that, the question is asked again.
const OP = { idleMs: 90000, maxMs: 120000 };
const OP_KEY = 'hu:op:';
// ONE window per operation : after a request of an operation went to the wallet and the sentence is not fulfilled yet (a right was
// given, nothing has left), the window stays open and shows the next request of the same operation. It waits this long, then closes.
const KEEP_KEY = 'hu:keep:';
const KEEP_MS = 60000;
const CLOSE_MS = 1600;          // the window shows its last message and closes itself ; the worker removes it after this, in case it did not
// Decimals everybody knows for these names : a contract that calls itself USDC with other decimals is not believed.
const USUAL_DECIMALS = { USDC: 6, USDT: 6, DAI: 18, WETH: 18, WBTC: 8, WAVAX: 18 };
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
const shortAddr = (a) => String(a).slice(0, 6) + '…' + String(a).slice(-4);
// 50000000 with 6 decimals -> "50" ; never raw units on a screen.
function units(raw, decimals) {
  let n; try { n = BigInt(raw); } catch (_) { return null; }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) return null;
  const base = 10n ** BigInt(decimals), int = n / base, frac = (n % base).toString().padStart(decimals, '0').slice(0, 6).replace(/0+$/, '');
  return int.toString().replace(/\B(?=(\d{3})+$)/g, ' ') + (frac ? ',' + frac : '');
}
const LINES = {
  noWindow: 'La fenêtre Hold up n’a pas pu s’ouvrir. Je n’ai pas pu te demander ce que tu veux faire.',
  notCompared: 'Je n’ai pas pu comparer cette demande à ce que tu as écrit.',
  tooLong: 'Ta phrase est trop longue pour que je la lise en entier. Je ne vérifie pas une phrase coupée.',
  capabilities: 'Cette demande contient des réglages que je ne sais pas lire.',
  permissions: 'Ce site demande un droit durable sur ton compte. Je ne sais pas en lire les limites.',
  watchAsset: (name, addr) => 'Ce site veut ajouter un jeton à ton portefeuille' + (name ? ' sous le nom ' + name : '') + (addr ? ' (' + shortAddr(addr) + ')' : '') + '. Ce nom est choisi par le site.'
};
const PERMISSION_METHODS = new Set(['wallet_grantPermissions', 'wallet_requestExecutionPermissions']);
// The network's own currencies : sending them is not a spending right, there is no ceiling to reduce in the wallet.
const NATIVE = new Set(['AVAX', 'ETH', 'BNB', 'MATIC', 'POL', 'SOL', 'BTC']);
// Every call of the request is approve(spender, amount) or increaseAllowance(spender, added), and nothing else.
function onlyGrants(body) {
  const p = body && Array.isArray(body.params) ? body.params : [];
  const calls = body.method === 'eth_sendTransaction' ? [p[0]] : body.method === 'wallet_sendCalls' && p[0] && Array.isArray(p[0].calls) ? p[0].calls : [];
  const sel = (c) => { const d = c && typeof c === 'object' ? (typeof c.data === 'string' && c.data.length > 2 ? c.data : typeof c.input === 'string' ? c.input : '') : ''; return d.slice(0, 10).toLowerCase(); };
  return calls.length > 0 && calls.every((c) => sel(c) === '0x095ea7b3' || sel(c) === '0x39509351');
}
// What only this file may say about a request the engine does not read : -> a line, or null.
function ownLine(method, params) {
  try {
    if (PERMISSION_METHODS.has(method)) return LINES.permissions;
    if (method === 'wallet_watchAsset') {
      const o = Array.isArray(params) ? params[0] : params, opt = o && typeof o === 'object' && o.options && typeof o.options === 'object' ? o.options : {};
      return LINES.watchAsset(typeof opt.symbol === 'string' && /^[A-Za-z0-9.$_-]{1,12}$/.test(opt.symbol) ? opt.symbol : '', HEX20.test(String(opt.address || '')) ? opt.address : '');
    }
    if (method === 'wallet_sendCalls') {
      const c = Array.isArray(params) && params[0] && typeof params[0] === 'object' ? params[0] : {};
      const some = (x) => x != null && (typeof x !== 'object' || Object.keys(x).length > 0);
      if (some(c.capabilities) || (Array.isArray(c.calls) && c.calls.some((x) => x && some(x.capabilities)))) return LINES.capabilities;
    }
  } catch (_) {}
  return null;
}
const READ_MS = 2500;           // one read of a token's own name or decimals (eth_call) : short, the person is waiting for the answer
const RPC_MS = 8000;            // one read relayed to the wallet's node (a trace of a few thousand steps takes 1 to 4 s on a local fork)
// The engine could not READ the call (unknown function), and that is its only reason : the one case where a measured effect may
// replace "not verified". An engine that failed, or any other finding, never qualifies.
const unreadable = (v) => !!v && v.level === 'unknown' && v.indeterminate === true && v.opacity_only === true && Array.isArray(v.codes) && v.codes.length > 0;

// ---- revocation (revoke.js, REVOKE_BRANCHEMENT.md) : the right a confirmed request granted is kept in storage.session only,
// per tab, five at most. The side panel asks for it by tab id, never sends a request itself. Hold up never signs : the request
// goes to the wallet of the page through inject.js, with a one-shot token so that it is not held and asked again.
const GRANT_KEY = 'hu:grant:';
const REVTOK_KEY = 'hu:revtok:';
const MAX_GRANTS = 5;
const REVOKE = { tokenMs: 8000, sendMs: 300000, readMs: 9000 };
const REQUEST_FIELDS = ['request', 'requests', 'params', 'to', 'data', 'input', 'from', 'method', 'tx', 'value'];
const carriesRequest = (msg) => REQUEST_FIELDS.some((k) => Object.prototype.hasOwnProperty.call(msg, k));
// stable text of a JSON value (sorted keys) : the same request always gives the same fingerprint
function stable(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x === undefined ? null : x);
  if (Array.isArray(x)) return '[' + x.map(stable).join(',') + ']';
  return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stable(x[k])).join(',') + '}';
}
export const requestHash = (method, params) => sha256(stable([String(method), params === undefined ? null : params]));
const randHex = (n) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join(''); };
// Read used after the wallet answered : is the right at zero ? Selectors : allowance(address,address), isApprovedForAll(address,address),
// getApproved(uint256), Permit2 allowance(address,address,address). Checked against keccak in tests/unit/revoke_branchement.test.mjs.
export const READ_SEL = { allowance: '0xdd62ed3e', isApprovedForAll: '0xe985e9c5', getApproved: '0x081812fc', permit2Allowance: '0x927da105' };
const word = (a) => String(a).toLowerCase().replace(/^0x/, '').padStart(64, '0');
export function readCallOf(result) {
  const g = result && result.grant; if (!g || typeof g !== 'object') return null;
  const ok = (a) => typeof a === 'string' && /^0x[0-9a-f]{40}$/i.test(a);
  switch (result.kind) {
    case 'erc20_approve': case 'erc20_increaseAllowance': case 'erc20_permit_call':
      return ok(g.token) && ok(g.owner) && ok(g.spender) ? { to: g.token, data: READ_SEL.allowance + word(g.owner) + word(g.spender), zero: 'uint' } : null;
    case 'setApprovalForAll':
      return ok(g.token) && ok(g.owner) && ok(g.spender) ? { to: g.token, data: READ_SEL.isApprovedForAll + word(g.owner) + word(g.spender), zero: 'uint' } : null;
    case 'erc721_approve':
      return ok(g.token) && /^[0-9]+$/.test(String(g.tokenId)) ? { to: g.token, data: READ_SEL.getApproved + BigInt(g.tokenId).toString(16).padStart(64, '0'), zero: 'uint' } : null;
    case 'permit2_approve': case 'permit2_permit_call':
      return ok(g.owner) && ok(g.token) && ok(g.spender) ? { to: '0x000000000022d473030f116ddee9f6b43ac78ba3', data: READ_SEL.permit2Allowance + word(g.owner) + word(g.token) + word(g.spender), zero: 'uint' } : null;
    default: return null;
  }
}
// first 32-byte word of an eth_call answer : 0 -> 'zero', anything else -> 'still_active', unreadable -> 'unknown'
export function readState(hex) {
  if (typeof hex !== 'string' || !/^0x[0-9a-fA-F]{64,}$/.test(hex)) return 'unknown';
  try { return BigInt('0x' + hex.slice(2, 66)) === 0n ? 'zero' : 'still_active'; } catch (_) { return 'unknown'; }
}

// --- social questions (escalation only : an answer can raise the level, never lower it) ---
const SOCIAL_Q = {
  origin: { id: 'origin', prompt: "D'où vient cette demande ?", options: [
    { id: 'self', label: "C'est moi qui l'ai décidé", s: 0 },
    { id: 'contact', label: 'Un proche ou un contact enregistré', s: 0 },
    { id: 'phone_msg', label: 'Quelqu\'un au téléphone ou par message', s: 1 },
    { id: 'site', label: 'Un site ou une appli', s: 1 }] },
  familiarity: { id: 'familiarity', prompt: "As-tu déjà parlé avec cette personne avant aujourd'hui ?", options: [
    { id: 'long', label: 'Oui, depuis longtemps', s: 0 },
    { id: 'days', label: 'Oui, depuis quelques jours', s: 1 },
    { id: 'first', label: "Non, c'est la première fois", s: 1 },
    { id: 'na', label: "Ce n'est pas une personne", s: 0 }] },
  pressure: { id: 'pressure', prompt: 'On te demande de faire vite ?', options: [
    { id: 'no', label: 'Non', s: 0 },
    { id: 'fast', label: 'Oui, de faire vite', s: 1 },
    { id: 'secret', label: 'Oui, de ne pas en parler', s: 1 },
    { id: 'both', label: 'Les deux', s: 1 }] },
  guidance: { id: 'guidance', prompt: "Quelqu'un te guide en direct ?", options: [
    { id: 'alone', label: 'Non, je fais ça seul(e)', s: 0 },
    { id: 'call', label: 'Oui, quelqu\'un me parle au téléphone', s: 1 },
    { id: 'chat', label: 'Oui, par message ou chat', s: 1 },
    { id: 'screen', label: 'Oui, il ou elle voit mon écran', s: 1 }] }
};
function shuffled(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function intentState(intent, verdict) {
  if (verdict.intent_contradiction) return 'contradictory';
  if (!intent) return 'absent';
  if (intent.choice === 'asked') return 'suspect';
  if (intent.choice === 'other' || !intent.choice) return 'vague';
  return 'clear';
}
function pickQuestions(state, verdict, max) {
  const sig = verdict.risk_signals || [];
  const stranger = sig.includes('new_recipient') || sig.includes('lookalike');
  let ids;
  if (state === 'suspect' && stranger) ids = ['origin', 'familiarity', 'guidance', 'pressure'];
  else if (state === 'suspect') ids = ['origin', 'guidance', 'pressure'];
  else if (stranger) ids = ['origin', 'familiarity', 'pressure'];
  else if (verdict.effects && verdict.effects.grants_right) ids = ['origin', 'guidance'];
  else ids = ['origin', 'pressure'];
  if (state === 'vague' || state === 'contradictory') ids = ids.concat(ids.includes('guidance') ? [] : ['guidance']);
  return ids.slice(0, Math.max(2, Math.min(4, max)));
}
function optionsOf(qid, cfg) {
  let opts = SOCIAL_Q[qid].options.map((o) => ({ id: o.id, label: o.label }));
  if (cfg.grill.shuffle) opts = shuffled(opts);
  opts.push({ id: 'prefer_not', label: 'Je préfère ne pas répondre' });
  return opts;
}

// Decides what follows the intent step : social questions or the verdict screen. Mutates and returns the verdict it was given.
function planAfterIntent(verdict, intent, cfg) {
  const eff = verdict.effects || {};
  if (cfg.grill.enabled && verdict.level !== 'unknown' && (eff.grants_right || eff.funds_out)) {
    const st = intentState(intent, verdict);
    if (st !== 'clear' && (st !== 'absent' || (verdict.risk_signals || []).length > 0)) {
      const floor = verdict.level;
      if (st === 'vague' && LEVELS.indexOf(verdict.level) < 2) { verdict.level = 'danger'; (verdict.reasons = verdict.reasons || []).push("Ton intention n'est pas précise : on applique la règle la plus stricte."); }
      const cur = LEVELS.indexOf(verdict.level);
      if (cur < 3) {
        const qids = pickQuestions(st, verdict, cfg.grill.maxQuestions);
        return { stage: 'grill', verdict, grill: { state: st, floor, qids, i: 0, cur, social: 0, answers: [], opts: optionsOf(qids[0], cfg) } };
      }
    }
  }
  return { stage: 'verdict', verdict };
}
function applyPlan(rec, plan, cfg, now) {
  if (plan.stage === 'grill') { rec.stage = 'grill'; rec.verdict = plan.verdict; rec.grill = plan.grill; rec.expireAt = now + LIMITS.expireAfterMs; rec.shownAt = now; }
  else enterVerdict(rec, plan.verdict, cfg, now);
  return rec;
}

const hostOf = (origin) => { try { return new URL(origin).host || String(origin); } catch (_) { return String(origin || ''); } };

// `classify(text)` (optional) asks the relay (Clef / Jev) ; without it, or when it fails, the embedded keyword parser answers.
// `closeMs` : how long a decided window keeps its last message before the worker removes it (0 : at once).
// `rulesFingerprint` : 12 hex, fingerprint of the embedded rule files (RULES_FINGERPRINT of journal_chain.js), written in every chained line with the
// version. Anything else than 12 lower-case hex : the version alone.
export function createGatekeeper({ check, classify = null, onJournal = null, testHook = null, closeMs = CLOSE_MS, rulesFingerprint = RULES_FINGERPRINT } = {}) {
  const selfUrl = chrome.runtime.getURL('');
  const windowUrl = chrome.runtime.getURL('window.html');
  const mem = new Map(); // only if chrome.storage.session is missing : the hold then does not survive the worker (journalled)
  const session = chrome.storage && chrome.storage.session ? chrome.storage.session : {
    get: async (k) => (k == null ? Object.fromEntries(mem) : mem.has(k) ? { [k]: mem.get(k) } : {}),
    set: async (o) => { for (const k of Object.keys(o)) mem.set(k, o[k]); },
    remove: async (k) => { mem.delete(k); }
  };
  const alarms = chrome.alarms ? {
    create: (name, when) => chrome.alarms.create(name, { when }),
    clear: (name) => chrome.alarms.clear(name)
  } : null;
  const store = new HoldStore({ storage: session, alarms, allowAuto: !!testHook });
  // S16 : the journal, the settings and the local context are readable by the extension's own pages only, not by content scripts.
  try { const p = chrome.storage.local.setAccessLevel && chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }); if (p && p.catch) p.catch(() => {}); } catch (_) {}
  const cancelRun = new Map(); // origin -> { n, until } (memory only : a restarted worker forgets, which is the lenient side)

  async function getCfg() {
    let cfg = null;
    try { cfg = (await chrome.storage.local.get('cfg')).cfg; } catch (_) {}
    cfg = cfg && typeof cfg === 'object' ? cfg : {};
    const c = Object.assign({}, DEFAULT_CFG, cfg);
    c.grill = Object.assign({}, DEFAULT_CFG.grill, cfg.grill || {});
    c.grill.enabled = false; // the extra questions are retired : the person writes one sentence, the window answers once
    c.contact = Object.assign({}, DEFAULT_CFG.contact, cfg.contact || {});
    c.limitUnlimited = cfg.limitUnlimited !== false;
    if (cfg.dangerWaitMs == null && cfg.frictionMs != null) c.dangerWaitMs = cfg.frictionMs; // former name
    if (c.askIntent === true) c.askIntent = 'always'; else if (c.askIntent === false) c.askIntent = 'never';
    if (!['never', 'rights_or_funds', 'always'].includes(c.askIntent)) c.askIntent = DEFAULT_CFG.askIntent;
    return c;
  }

  let journalChain = Promise.resolve();
  function journal(entry) { journalChain = journalChain.then(() => journalNow(entry), () => journalNow(entry)); return journalChain; }
  async function journalNow(entry) {
    entry.ts = Date.now();
    // S13/S19 : consecutive cancels per origin ; a confirmed decision is also kept in its own ring that spam cannot push out
    if (entry.type === 'decision' && entry.origin) {
      if (entry.decision === 'cancel' && entry.by !== 'expired') {
        if (cancelRun.size > 200) cancelRun.clear();
        const c = cancelRun.get(entry.origin) || { n: 0, until: 0 }; c.n++; if (c.n >= FLOOD.cancelsBeforeBlock) c.until = entry.ts + FLOOD.blockMs; cancelRun.set(entry.origin, c);
      } else if (entry.decision === 'confirm') cancelRun.delete(entry.origin);
      if (entry.decision === 'confirm') {
        try { const { confirms } = await chrome.storage.local.get('confirms'); const a = Array.isArray(confirms) ? confirms : []; a.push({ ts: entry.ts, origin: entry.origin, method: entry.method, level: entry.level || null }); if (a.length > 200) a.splice(0, a.length - 200); await chrome.storage.local.set({ confirms: a }); } catch (_) {}
      }
    }
    try {
      const { log } = await chrome.storage.local.get('log');
      const arr = Array.isArray(log) ? log : [];
      arr.push(entry); if (arr.length > 500) arr.splice(0, arr.length - 500);
      await chrome.storage.local.set({ log: arr });
    } catch (_) {}
    // hash-chained copy (journal_chain.js) : site, kind, level, codes, decision, build version. Never the sentence, never an address.
    if (entry.type === 'verdict' || entry.type === 'decision' || entry.type === 'partial' || entry.type === 'revocation') {
      let version = ''; try { version = chrome.runtime.getManifest().version; } catch (_) {}
      await chainAppend(chrome.storage.local, entry, version, rulesTag(version, rulesFingerprint));
    }
    if (onJournal) { try { onJournal(entry); } catch (_) {} }
  }

  // The engine never says "ok" to the interface : whatever answers (a local process on the port in server mode), "ok" becomes "attention" and the screen is shown.
  async function safeCheck(body, cfg) {
    let v;
    try { v = await check(body, cfg); } catch (e) { v = null; }
    if (!v || typeof v !== 'object' || !(v.level in RANK || v.level === 'ok')) v = { level: 'unknown', indeterminate: true, why: 'moteur indisponible', reasons: [], effects: { grants_right: false, funds_out: false }, risk_signals: [] };
    if (v.level === 'ok') v.level = 'attention';
    // fields only this file may set : whatever an engine sends under these names is dropped
    delete v.relief; delete v.written;
    return v;
  }

  // The written intent -> { clear, kind, facts, source, model, text }. Never throws ; an unusable answer falls back to the keywords.
  async function understand(text) {
    let raw = null;
    if (classify) { try { raw = await classify(text); } catch (_) { raw = null; } }
    if (!raw || typeof raw !== 'object') raw = await keywordClassify(text);
    let intent = interpret(raw, text);
    if (intent.model) {
      // A model answer is used only when it is coherent and above MODEL_MIN : a kind the product knows, or a confident "none".
      // Anything else (unknown kind, no probability, below the threshold) : the keyword parser answers, and the window says so.
      const p = typeof raw.confidence === 'number' && Number.isFinite(raw.confidence) ? raw.confidence : -1;
      const kw = interpret(await keywordClassify(text), text);
      if (!(p >= MODEL_MIN && (KINDS.includes(raw.kind) || raw.kind === NO_MATCH))) intent = kw;
      // "the person wants to give a permission" is the one fact that can make a dangerous request read as expected (outcome.js, covers()) :
      // the model alone never grants it, the words must say it too. The model can only make things stricter or more precise.
      else if (intent.facts.grant && !kw.facts.grant) intent.facts.grant = false;
    }
    return Object.assign(intent, { text });
  }
  // Runs the engine with what was understood and keeps the strictest verdict (strict-only : a sentence never lowers a level).
  // -> { v, used, rewrite } : `used` is what this request takes from the written amount (kept for the next requests of the same intent).
  // `op` : the operation this request belongs to, when the sentence was written for an earlier request.
  async function judgeWithIntent(rec, intent, cfg, op = null) {
    let v = rec.verdict;
    if (!rec.body) return { v, used: null, rewrite: null, erc20: {} };
    const ask = (choice, kind) => safeCheck(Object.assign({}, rec.body, { intent: choice || undefined, intent_kind: kind, intent_text: intent.text,
      intent_amount: intent.amount, intent_symbol: intent.symbol }), cfg);
    if (intent.clear) v = stricter(v, await ask(ENGINE_CHOICE[intent.kind], intent.kind));
    if (intent.facts.receive && intent.kind !== 'asked_by_someone') v = stricter(v, await ask('receive', 'connect_or_accept_offer'));
    // What was written against what the request carries (amount of a spending right, recipient and amount of a payment) : same rule in both builds.
    let tokens = {};
    try { tokens = tokensOf((await chrome.storage.local.get('contexte')).contexte, rec.body.chainId); } catch (_) {}
    // A token nobody here knows by its address : its own contract is asked (read-only, through the wallet's provider). `tokens` stays
    // "known by address" ; `all` adds what the contracts declare about themselves.
    const declared = await declaredTokens(rec, intent, tokens);
    const all = Object.assign({}, declared, tokens);
    const said = Object.keys(declared).map((a) => ' Le jeton ' + shortAddr(a) + ' se présente comme ' + declared[a].declared + '.').join('');
    // A call the request itself does not let us read (no right, no transfer in its own data) : its effect is measured by a dry run
    // on the wallet's node. No measure = the checks below, as before.
    let effect = null;
    if (rec.body.method === 'eth_sendTransaction' && intent.amount && intent.symbol) {
      const f = requestFacts(rec.body);
      if (!f.grants.length && !f.sends.length) { try { effect = await measure(rec.body, rpcOf(rec.tabId, rec.frameId, rec.rid), tokens); } catch (_) { effect = null; } }
    }
    let w = effect && effect.ok ? effectCheck(effect, intent) : writtenCheck(rec.body, intent, all);
    if (!w && effect && effect.failed) w = { outcome: 'unverifiable', line: 'La simulation échoue : le réseau refuserait cette demande telle quelle.' };
    // Q17 : a spending right wider than the written amount, in a transaction : Hold up writes the amount into the request itself,
    // only when that amount is certain. Otherwise the line keeps its advice (cap it in the wallet).
    // An advice is given only when it can be followed : "Réduis le plafond à 50 AVAX" means nothing (the amount written is the network's
    // own currency, the right is on another asset).
    if (w && typeof w.line === 'string' && / Réduis le plafond/.test(w.line) && NATIVE.has(intent.symbol)) { w = Object.assign({}, w, { line: w.line.replace(/ Réduis le plafond.*$/, '') }); delete w.fixable; }
    let rewrite = null, plan = null;
    if (w && w.fixable && cfg.limitUnlimited !== false && !rec.slim) { // a slimmed body is never written back into the request
      // The token is known by its address, or its own contract declares the written name with the usual decimals (declaredTokens).
      // The rewrite only ever makes the right SMALLER (limitPlan) : what the wallet receives is never wider than what the site sent.
      // Only when the whole request is that right and nothing else : a batch that also carries a call nobody reads is not corrected.
      plan = onlyGrants(rec.body) ? limitPlan(rec.body, intent, all, {}) : null;
      if (plan) rewrite = { params: plan.params };
    }
    const used = usedBy(rewrite ? Object.assign({}, rec.body, { params: rewrite.params }) : rec.body, effect);
    // The requests of one sentence are one budget : a second right, another token, a sum above what was written no longer match,
    // corrected or not.
    if (op && (!(w && w.outcome === 'mismatch') || rewrite)) { const over = operationCheck(await usedSoFar(op, rec), used, intent, all); if (over) { w = over; rewrite = null; plan = null; } }
    // What was read on a contract is said as such : the address is the identity, the name is what the contract claims.
    if (w && w.outcome === 'match' && said && !w.measured) w = Object.assign({}, w, { line: ((w.line || '') + said).trim() });
    if (w) {
      // The engine already found worse on its own : its line stays, this check only adds its outcome.
      const worse = w.outcome !== 'mismatch' && ((RANK[v.level] || 0) > RANK.unknown || v.intent_contradiction);
      v = Object.assign({}, v, { written: worse ? { outcome: w.outcome } : w });
      // What was found is a fact about the request : it is said as such, even when the engine could not read the rest of the call.
      if (w.outcome === 'mismatch' && unreadable(v)) v.indeterminate = false;
      if (w.outcome === 'mismatch' && RANK.danger > (RANK[v.level] || 0)) v.level = 'danger';
      if (w.outcome === 'unverifiable' && RANK.unknown > (RANK[v.level] || 0)) v.level = 'unknown';
      // Measured, and it is what was written : the call the engine could not read is no longer "not verified".
      if (w.outcome === 'match' && w.measured && unreadable(v)) v = Object.assign({}, v, { level: 'attention', indeterminate: false, measured: true });
    }
    // Nothing understood, or still too vague after the one follow-up : it cannot be said to match. At least "not verified" (same delay as Danger),
    // so a vague sentence never does better than no sentence at all.
    if ((!intent.clear || intent.vague) && RANK.unknown > (RANK[v.level] || 0)) v = Object.assign({}, v, { level: 'unknown' });
    // The ONLY gap is a right wider than the written amount, and Hold up brought it back to that amount in the request itself :
    // it now matches what was written (founder's decision, 11 Oct.). The modified request is the one that goes to the wallet.
    // Anything else wrong with the request, or no correction possible (a signature, the setting off, a token nobody can read) :
    // it does not match, and the delay applies.
    if (rewrite && plan && canCorrect(intent) && v.written && v.written.outcome === 'mismatch' && v.written.fixable && ['attention', 'danger'].includes(v.level) && !v.indeterminate
      && !v.intent_contradiction && !v.address_diff && !(v.risk_signals || []).includes('lookalike') && onlyTheGap(rec.verdict, v)) {
      const m = String(v.written.line || '').match(/La demande donne accès à (.+?)\. Réduis/);
      const before = /donne accès à tout/.test(String(v.written.line || '')) ? 'sans limite' : m ? m[1] : '';
      const limited = { amount: plan.amount, symbol: plan.symbol, before: before || 'plus large' };
      // The corrected request is read again, as the wallet will get it. It matches : said so. Something still cannot be verified in it
      // (who gets the right, a token nobody knows) : the right stays limited, but it is "not verified", with the delay.
      let after = null; try { after = writtenCheck(Object.assign({}, rec.body, { params: plan.params }), intent, all); } catch (_) { after = null; }
      if (after && after.outcome === 'match') v = Object.assign({}, v, { relief: true, written: { outcome: 'match', corrected: true,
        line: limitText(plan) + '. Le site demandait un accès ' + (before === 'sans limite' ? before : before ? 'à ' + before : 'plus large') + '.' + said, limited } });
      else if (after && after.outcome === 'unverifiable' && typeof after.line === 'string') v = Object.assign({}, v, RANK.unknown > (RANK[v.level] || 0) ? { level: 'unknown' } : {},
        { written: { outcome: 'unverifiable', line: after.line + ' Si tu continues, le droit sera limité à ' + limitText(plan).replace(/^Droit limité à /, '') + '.', limited } });
      else rewrite = null;
    } else rewrite = null;
    const erc20 = {}; for (const a of Object.keys(all)) erc20[a] = { symbol: all[a].symbol, decimals: all[a].decimals };
    // Never raw units on the screen : when the engine's own line carries the raw amount of a token ("50000000 jetons"), it is written
    // in readable units with the token's name, or with the token's shortened address when nobody knows its name.
    try {
      const reel = v.texts && typeof v.texts.reel === 'string' ? v.texts.reel : '';
      if (/[0-9]{5,} jetons/.test(reel)) {
        let text = reel; const facts = requestFacts(rec.body);
        for (const x of facts.grants.concat(facts.sends)) {
          if (!x.token || x.raw == null) continue;
          const raw = x.raw.toString(), meta = all[x.token], u = meta ? units(raw, meta.decimals) : null;
          text = text.split(raw + ' jetons').join(u ? u + ' ' + (declared[x.token] ? declared[x.token].declared : meta.symbol) : raw + ' unités du jeton ' + shortAddr(x.token));
        }
        if (text !== reel) v = Object.assign({}, v, { texts: Object.assign({}, v.texts, { reel: text }) });
      }
    } catch (_) {}
    return { v, used, rewrite, erc20 };
  }

  // What a token's own contract says of itself (symbol, decimals), for the tokens of this request nobody here knows by their address.
  // Read-only eth_call through the provider the request came from. A DECLARATION, not an identity : the address stays the identity,
  // and the window says "se présente comme". Kept only when it is coherent with what was written :
  //   - the declared name is the written one, or contains it ("USDC.e" for "USDC") : the entry carries the written symbol ;
  //   - a contract that takes a well-known name with other decimals than that name's is not believed (the token stays unknown) ;
  //   - another name : the entry carries that name, so the request reads as "another token".
  // No answer, or a failing read : the token stays unknown and the request can never match (S2 unchanged).
  async function declaredTokens(rec, intent, known) {
    const out = {};
    if (!rec.body || !intent || rec.tabId == null) return out;
    let facts; try { facts = requestFacts(rec.body); } catch (_) { return out; }
    const want = [...new Set(facts.grants.concat(facts.sends).map((x) => x.token).filter((t) => t && !known[t]))].slice(0, 4);
    if (!want.length) return out;
    const rpc = rpcOf(rec.tabId, rec.frameId, rec.rid, READ_MS);
    await Promise.all(want.map(async (t) => {
      let m = null; try { m = await readToken(rpc, t); } catch (_) { m = null; }
      if (!m) return;
      const s = m.symbol.toUpperCase(), w = intent.symbol || '', same = !!w && (s === w || (w.length >= 3 && s.includes(w)));
      if (same && USUAL_DECIMALS[w] != null && USUAL_DECIMALS[w] !== m.decimals) return;
      out[t] = { symbol: same ? w : m.symbol, decimals: m.decimals, declared: m.symbol };
    }));
    return out;
  }

  // ---------- reads relayed to the wallet's own node (bridge.js -> inject.js -> the provider the request came through) ----------
  function rpcOf(tabId, frameId, rid, ms = RPC_MS, extra = null) {
    return (method, params) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('delai')), ms);
      const done = (fn, x) => { clearTimeout(timer); fn(x); };
      let p;
      try { p = chrome.tabs.sendMessage(tabId, Object.assign({ type: 'hu.rpc', rid, method, params }, extra || {}), { frameId }); } catch (e) { return done(reject, e); }
      Promise.resolve(p).then((r) => (r && r.ok === true ? done(resolve, r.result) : done(reject, new Error('lecture refusee'))), (e) => done(reject, e));
    });
  }

  // ---------- one written intent, several requests ----------
  const opKey = (tabId, frameId) => OP_KEY + tabId + ':' + frameId;
  const opRead = async (k) => { try { return (await session.get(k))[k] || null; } catch (_) { return null; } };
  // The operation still open for this tab, frame and origin, else null. Another origin, or too late : it is forgotten.
  function opGet(tabId, frameId, origin, now) {
    return store.lock(async () => {
      const k = opKey(tabId, frameId), op = await opRead(k);
      if (!op) return null;
      if (op.origin !== origin || now < op.writtenAt || now - op.writtenAt > OP.maxMs || now - op.lastAt > OP.idleMs) { await session.remove(k); return null; }
      return op;
    });
  }
  // Only a sentence with an amount opens an operation : without an amount there is nothing to hold the next requests to.
  function opOpen(rec, intent, now) {
    if (!intent.clear || intent.vague || !intent.amount || !intent.symbol) return null;
    const op = { origin: rec.origin, intent, writtenAt: now, lastAt: now, used: { grants: [], out: [] } };
    return store.lock(async () => { await session.set({ [opKey(rec.tabId, rec.frameId)]: op }); return op; });
  }
  // A request of the operation goes to the wallet : what it takes is counted, and the 90 s start again from here.
  function opSpend(rec, now) {
    if (rec.opAt == null) return Promise.resolve();
    return store.lock(async () => {
      const k = opKey(rec.tabId, rec.frameId), op = await opRead(k);
      if (!op || op.writtenAt !== rec.opAt || op.origin !== rec.origin) return;
      if (rec.used) { op.used.grants.push(...rec.used.grants); op.used.out.push(...rec.used.out); }
      op.lastAt = now;
      await session.set({ [k]: op });
    });
  }
  async function opDrop(tabId, keep) {
    let all = {}; try { all = await session.get(null); } catch (_) {}
    for (const k of Object.keys(all || {})) if (k.startsWith(OP_KEY + tabId + ':') && k !== keep) { try { await session.remove(k); } catch (_) {} }
  }
  // Already counted, plus what the other requests of the same operation still on screen would take.
  async function usedSoFar(op, rec) {
    const used = { grants: op.used.grants.slice(), out: op.used.out.slice() };
    for (const r of await store.all()) {
      if (r.rid === rec.rid || r.tabId !== rec.tabId || r.frameId !== rec.frameId || r.status !== 'pending' || r.opAt !== op.writtenAt || !r.used) continue;
      used.grants.push(...r.used.grants); used.out.push(...r.used.out);
    }
    return used;
  }

  // ---------- revocation of a right granted by a confirmed request ----------
  const grantKey = (tabId) => GRANT_KEY + tabId;
  async function grantsOf(tabId) {
    if (!Number.isInteger(tabId)) return [];
    const v = await opRead(grantKey(tabId));
    return Array.isArray(v) ? v : [];
  }
  // The request as it went to the wallet (the limited params when Hold up limited the right), turned into revocations.
  async function keepGrant(rec) {
    try {
      const b = rec.body;
      if (!b || typeof b.method !== 'string' || !Array.isArray(b.params)) return;
      const params = rec.rewrite && Array.isArray(rec.rewrite.params) && rec.verdict && rec.verdict.written && rec.verdict.written.limited ? rec.rewrite.params : b.params;
      let tokens = {};
      try { tokens = tokensOf((await chrome.storage.local.get('contexte')).contexte, b.chainId); } catch (_) {}
      const optsFor = (to) => { const t = typeof to === 'string' ? tokens[to.toLowerCase()] || (rec.erc20 && rec.erc20[to.toLowerCase()]) || null : null; return t ? { tokenKind: 'erc20', tokenLabel: 'tes ' + t.symbol } : {}; }; // known by its address : a token with decimals. Otherwise nothing is guessed.
      const asked = [];
      if (b.method === 'wallet_sendCalls') {
        const c = params[0] && typeof params[0] === 'object' ? params[0] : {};
        const calls = Array.isArray(c.calls) ? c.calls.slice(0, 16) : [];
        for (const x of calls) if (x && typeof x === 'object') asked.push([{ method: 'eth_sendTransaction', chainId: c.chainId || b.chainId, from: c.from || b.from, params: [{ from: c.from || b.from, to: x.to, data: x.data || x.input, chainId: c.chainId || b.chainId }] }, x.to]);
      } else asked.push([{ method: b.method, params, chainId: b.chainId, from: b.from }, params[0] && params[0].to]);
      const found = [];
      for (const [req, to] of asked) { const r = revocationFor(req, optsFor(to)); if (r && r.status !== 'not_a_grant') found.push(r); }
      if (!found.length) return;
      await store.lock(async () => {
        const list = await grantsOf(rec.tabId);
        for (const result of found) list.push({ id: randHex(8), rid: rec.rid, frameId: rec.frameId, origin: rec.origin, at: Date.now(), result, wallet: null });
        while (list.length > MAX_GRANTS) list.shift();
        await session.set({ [grantKey(rec.tabId)]: list });
      });
      try { const p = chrome.action && chrome.action.setBadgeText && chrome.action.setBadgeText({ text: '1', tabId: rec.tabId }); if (p && p.catch) p.catch(() => {}); } catch (_) {}
    } catch (_) { /* no revocation offered : nothing else changes */ }
  }
  async function grantFor(msg) {
    const list = await grantsOf(msg.tabId);
    if (!list.length) return null;
    if (msg.id == null) return list[list.length - 1];
    return list.find((g) => g.id === msg.id) || null;
  }
  async function saveGrant(tabId, g) {
    await store.lock(async () => {
      const list = await grantsOf(tabId), i = list.findIndex((x) => x.id === g.id);
      if (i >= 0) { list[i] = g; await session.set({ [grantKey(tabId)]: list }); }
    });
  }
  // One message to the frame that made the request (bridge.js -> inject.js). Never throws : null when nobody answers in time.
  function revokeRun(tabId, frameId, payload, ms) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), ms);
      const done = (x) => { clearTimeout(timer); resolve(x && typeof x === 'object' ? x : null); };
      let p; try { p = chrome.tabs.sendMessage(tabId, payload, { frameId }); } catch (_) { return done(null); }
      Promise.resolve(p).then(done, () => done(null));
    });
  }
  // The mark of a revocation prepared by Hold up : a token made here, single use, a few seconds, bound to the tab, the frame and
  // the exact content. Whatever a page writes in a request is never trusted : without this token in storage.session, the request
  // is held and asked about like any other.
  async function takeRevokeToken(tok, tabId, frameId, method, params) {
    if (typeof tok !== 'string' || !/^[0-9a-f]{32}$/.test(tok)) return false;
    let h; try { h = await requestHash(method, params); } catch (_) { return false; }
    return store.lock(async () => {
      const k = REVTOK_KEY + tok, t = await opRead(k);
      if (!t) return false;
      try { await session.remove(k); } catch (_) {} // single use, whatever the outcome
      return t.tabId === tabId && t.frameId === frameId && Date.now() <= t.exp && t.hash === h;
    });
  }
  // sender.url is set by the browser : a content script or a page never carries the URL of the extension's own panel
  const fromPanel = (s) => typeof s.url === 'string' && s.url.split('#')[0].split('?')[0] === chrome.runtime.getURL('ui/sidepanel.html');
  const REVOKE_HANDLERS = {
    'hu.revoke.get': async (msg) => {
      const list = await grantsOf(msg.tabId);
      if (!list.length) return { none: true };
      const last = list[list.length - 1];
      return { result: last.result, origin: last.origin, at: last.at, id: last.id, wallet: last.wallet, grants: list.slice().reverse().map((g) => ({ id: g.id, result: g.result, origin: g.origin, at: g.at, wallet: g.wallet })) };
    },
    'hu.revoke.send': async (msg) => {
      const g = await grantFor(msg);
      if (!g) return { state: 'error', code: 'none' };
      const index = msg.index == null ? 0 : msg.index;
      const r = g.result;
      // only what ONE transaction really removes is sent from here ; the rest is explained in the panel
      if (!r || r.status !== 'revocable' || r.oneClick !== true || !Number.isInteger(index) || index < 0 || index >= r.requests.length) return { state: 'error', code: 'not_one_click' };
      const q = r.requests[index];
      if (!q || q.method !== 'eth_sendTransaction' || q.submitTo !== 'wallet' || !Array.isArray(q.params)) return { state: 'error', code: 'not_one_click' };
      const tok = randHex(16), hash = await requestHash(q.method, q.params);
      await store.lock(async () => { await session.set({ [REVTOK_KEY + tok]: { tabId: msg.tabId, frameId: g.frameId, hash, exp: Date.now() + REVOKE.tokenMs, gid: g.id } }); });
      const a = await revokeRun(msg.tabId, g.frameId, { type: 'hu.revoke.run', op: 'send', tok, origin: g.origin, method: q.method, params: q.params }, REVOKE.sendMs);
      try { await session.remove(REVTOK_KEY + tok); } catch (_) {}
      const state = a && ['submitted', 'rejected', 'error'].includes(a.state) ? a.state : 'error';
      const code = a ? (typeof a.code === 'string' || typeof a.code === 'number' ? a.code : undefined) : 'no_answer';
      g.wallet = state; g.sentAt = Date.now(); await saveGrant(msg.tabId, g);
      await journal({ type: 'revocation', origin: g.origin, method: r.kind, kind: r.kind, decision: state, wallet: state, request_sha256: hash });
      return code === undefined ? { state } : { state, code };
    },
    'hu.revoke.check': async (msg) => {
      const g = await grantFor(msg);
      const c = g && readCallOf(g.result);
      if (!c) return { state: 'unknown' };
      const a = await revokeRun(msg.tabId, g.frameId, { type: 'hu.revoke.run', op: 'read', origin: g.origin, method: 'eth_call', params: [{ to: c.to, data: c.data }, 'latest'] }, REVOKE.readMs);
      return { state: a && a.state === 'read' ? readState(a.result) : 'unknown' };
    }
  };
  // ---------- one window per operation ----------
  const keepKey = (tabId, frameId) => KEEP_KEY + tabId + ':' + frameId;
  function tell(msg) { try { const p = chrome.runtime.sendMessage(msg); if (p && p.catch) p.catch(() => {}); } catch (_) {} }
  // The window closes itself after its last message ; this is the safety net.
  async function removeWindow(windowId) {
    const go = async () => { try { await chrome.windows.remove(windowId); } catch (_) {} };
    if (closeMs > 0) setTimeout(go, closeMs); else await go();
  }
  // The sentence is not fulfilled yet : a right was given for it and nothing has left. Another request is expected.
  const moreExpected = (rec) => !!(rec.used && Array.isArray(rec.used.grants) && rec.used.grants.length && !(rec.used.out && rec.used.out.length)
    && rec.intent && rec.intent.clear && !(rec.intent.facts && rec.intent.facts.grant) && ['buy_or_swap', 'pay_someone', 'send_to_my_account'].includes(rec.intent.kind));
  async function keepOpen(rec, now) {
    if (rec.ui !== 'window' || rec.windowId == null || rec.opAt == null || !moreExpected(rec)) return false;
    const k = keepKey(rec.tabId, rec.frameId);
    try { await session.set({ [k]: { windowId: rec.windowId, tabId: rec.tabId, frameId: rec.frameId, origin: rec.origin, opAt: rec.opAt, rid: rec.rid, next: null, until: now + KEEP_MS, step: rec.step || 1 } }); } catch (_) { return false; }
    if (alarms) { try { alarms.create(k, now + KEEP_MS); } catch (_) {} }
    return true;
  }
  async function keepAll() {
    let all = {}; try { all = await session.get(null); } catch (_) {}
    return Object.keys(all || {}).filter((k) => k.startsWith(KEEP_KEY) && all[k]).map((k) => ({ k, v: all[k] }));
  }
  // Ends a wait : the entry goes, and the window too unless a request is still shown in it.
  async function keepEnd(k, kept, why) {
    try { await session.remove(k); } catch (_) {}
    if (alarms) { try { alarms.clear(k); } catch (_) {} }
    if (!kept || kept.windowId == null) return;
    let busy = false; try { busy = (await store.all()).some((r) => r.status === 'pending' && r.windowId === kept.windowId); } catch (_) {}
    if (busy) return;
    tell({ type: 'hu.closing', rid: kept.next || kept.rid, why });
    await removeWindow(kept.windowId);
  }
  // The window kept open for this operation, if it is still there and free. The new request will be shown in it.
  async function keepTake(tabId, frameId, origin, op, rid, now) {
    const k = keepKey(tabId, frameId), kept = await opRead(k);
    if (!kept) return null;
    if (kept.next) return null; // another request of the operation is on screen in it : this one gets its own window
    let alive = kept.origin === origin && kept.opAt === op.writtenAt && now <= kept.until;
    if (alive) { try { await chrome.windows.get(kept.windowId); } catch (_) { alive = false; } }
    if (!alive) { await keepEnd(k, kept, 'idle'); return null; }
    kept.next = rid;
    try { await session.set({ [k]: kept }); } catch (_) { return null; }
    if (alarms) { try { alarms.clear(k); } catch (_) {} }
    return kept;
  }
  async function keepDropWindow(windowId, alsoOp) {
    for (const { k, v } of await keepAll()) if (v.windowId === windowId) {
      try { await session.remove(k); } catch (_) {}
      if (alarms) { try { alarms.clear(k); } catch (_) {} }
      // The person closed the waiting window : the next request of that sentence is asked about again.
      if (alsoOp && !v.next) { try { await session.remove(opKey(v.tabId, v.frameId)); } catch (_) {} }
    }
  }


  const fromExtensionPage = (s) => typeof s.url === 'string' && s.url.startsWith(selfUrl);
  const fromWindow = (s) => typeof s.url === 'string' && s.url.split('#')[0].split('?')[0] === windowUrl && s.tab && s.tab.windowId != null;
  const fromPage = (s) => !!(s.tab && s.tab.id != null && typeof s.frameId === 'number' && !fromExtensionPage(s));
  // The origin comes from the browser (sender.origin, else sender.url for an opaque origin), never from the message :
  // whatever msg.origin / msg.url say is ignored.
  const originOf = (s) => (typeof s.origin === 'string' && s.origin && s.origin !== 'null' ? s.origin : typeof s.url === 'string' && s.url ? s.url.split('#')[0].split('?')[0] : 'null');

  // ---------- what a screen needs (the same object feeds the window and the fallback overlay) ----------
  function viewOf(rec, cfg) {
    const now = Date.now();
    const view = { rid: rec.rid, seq: rec.seq, stage: rec.stage, ui: rec.ui, site: rec.site, method: rec.method, note: '' };
    const message = { type: 'holdup.verdict', version: 1, id: rec.rid + '#' + rec.seq, site: rec.site };
    if (rec.stage === 'intent') { message.mode = 'intention'; message.choices = INTENT_CHOICES; }
    else if (rec.stage === 'grill') {
      const g = rec.grill, q = SOCIAL_Q[g.qids[g.i]];
      message.mode = 'intention'; message.question = q.prompt; message.choices = g.opts.map((o) => ({ value: o.id, label: o.label }));
      view.note = 'Question ' + (g.i + 1) + ' sur ' + g.qids.length + '. Tes réponses ne peuvent que renforcer la vérification.';
      view.grill = { index: g.i + 1, total: g.qids.length, qid: q.id, prompt: q.prompt, options: g.opts };
    } else {
      const f = rec.friction, left = Math.max(0, f.deadline - now);
      const v = Object.assign({}, rec.verdict);
      if (v.level === 'manipulation') delete v.title; // the surface then shows the instruction ("Raccroche"), not a label
      message.mode = 'verdict'; message.verdict = v;
      const phrase = typeof v.phrase === 'string' && v.phrase ? v.phrase : v.level === 'unknown' ? 'Je continue sans vérification' : 'Je veux continuer malgré le danger';
      message.friction = f.phrase && !f.phraseDone ? { type: 'phrase', phrase } : left > 0 ? { type: 'wait', seconds: Math.ceil(left / 1000) } : { type: 'none' };
      view.friction = { phrase: f.phrase && !f.phraseDone, phraseText: phrase, leftMs: left, waitMs: f.waitMs, deadline: f.deadline };
      view.verdict = v;
      const std = frictionFor(v.level, DEFAULT_CFG).waitMs;
      const secs = Math.round(f.waitMs / 1000);
      if (v.level === 'manipulation') view.note = 'Ta demande reste retenue. Tu peux annuler à tout moment.';
      else if (f.phrase) view.note = 'Pour continuer : attends ' + secs + ' s. Annuler reste possible.';
      if (f.waitMs && f.waitMs !== std) view.note += ' Réglage de démo : ' + secs + ' s au lieu de ' + Math.round(std / 1000) + ' s.';
      if (rec.called) view.contact = { name: cfg.contact.name || 'Un proche de confiance', tel: cfg.contact.tel || '' };
    }
    view.message = message;
    // What the Hold up window draws (ui/screen.js). Two moments : the question, then the answer.
    const site = siteName(rec.site);
    // The question shows the site name only (origin given by the browser) : nothing of the request before the person has written.
    if (rec.stage === 'intent') view.screen = Object.assign({ kind: 'question', title: rec.ask || TEXT.question(site), placeholder: TEXT.placeholder, max: Math.max(20, MAX_TEXT - (rec.firstText ? rec.firstText.length + 1 : 0)) }, rec.asked && rec.firstText ? { first: rec.firstText } : {});
    else if (rec.stage === 'verdict') {
      view.screen = Object.assign({ kind: 'answer', leftMs: Math.max(0, rec.friction.deadline - now) }, answerOf(rec.verdict, rec.intent));
      // It matches and no delay applies : no "Continuer", the window sends the request on after AUTO_MS (Annuler stays).
      if (view.screen.outcome === 'match' && rec.friction.waitMs === 0 && !rec.friction.phrase) view.screen.autoMs = AUTO_MS;
      if (rec.step > 1) view.screen.step = rec.step; // a later request of the same sentence, shown in the same window
      const net = networkName(rec.body && rec.body.chainId); if (net) view.screen.network = net;
    }
    return view;
  }

  // ---------- window ----------
  async function openUi(rec, sender, cfg) {
    let ui = 'overlay', windowId = null, why = cfg.verdictWindow === false ? 'reglage' : null;
    if (!why) {
      try {
        const opts = { url: windowUrl + '#' + rec.rid, type: 'popup', focused: true, width: WIN.width, height: WIN.height };
        try { // centred on the browser window that made the request, slightly shifted when several requests are held
          const w = await chrome.windows.get(sender.tab.windowId);
          const n = (await store.all()).filter((r) => r.status === 'pending' && r.ui === 'window').length;
          if (w && typeof w.left === 'number') { opts.left = Math.max(0, Math.round(w.left + (w.width - WIN.width) / 2) + 28 * n); opts.top = Math.max(0, Math.round(w.top + 72) + 28 * n); }
        } catch (_) {}
        const win = await chrome.windows.create(opts);
        if (!win || win.id == null) throw new Error('fenetre sans identifiant');
        ui = 'window'; windowId = win.id;
      } catch (e) { why = String(e && e.message || e).slice(0, 120); }
    }
    // The in-page fallback has no free-text field : it never asks anything (no shortcut buttons, no "who asked you"). It shows the answer
    // of a request nobody described : at least "not verified", with its delay.
    const r = await store.advance(rec.rid, null, (x, now) => {
      x.ui = ui; x.windowId = windowId;
      if (ui === 'overlay' && x.stage === 'intent') enterVerdict(x, Object.assign({}, x.verdict, RANK.unknown > (RANK[x.verdict.level] || 0) ? { level: 'unknown' } : {}, { written: { outcome: 'unverifiable', line: LINES.noWindow } }), cfg, now);
    });
    if (r.status === 'next' && ui === 'overlay' && rec.stage === 'intent') await journalStage(r.rec);
    if (r.status !== 'next' && windowId != null) { try { await chrome.windows.remove(windowId); } catch (_) {} } // decided meanwhile
    if (ui === 'overlay') await journal({ type: 'ui_fallback', origin: rec.origin, method: rec.method, why: why || 'inconnu', note: 'fenetre separee indisponible : fenetre affichee dans la page' });
    else nudge(rec.tabId, 0, { type: 'hu.banner' });
    return ui;
  }
  const opening = new Set(); // rids whose screen is being opened in this worker life
  async function openUiOnce(rec, sender, cfg) {
    if (opening.has(rec.rid)) return;
    opening.add(rec.rid);
    try { await openUi(rec, sender, cfg); } finally { opening.delete(rec.rid); }
  }
  function nudge(tabId, frameId, msg) { try { const p = chrome.tabs.sendMessage(tabId, msg, { frameId }); if (p && p.catch) p.catch(() => {}); } catch (_) {} }
  // The page side gets its answer at once. The window is told why it ends : it shows its last message, then closes itself
  // (the worker removes it after closeMs in case it did not). `keep` : the window stays for the next request of the operation.
  async function closeUi(rec, { keep = false, why = '' } = {}) {
    nudge(rec.tabId, rec.frameId, { type: 'hu.result', rid: rec.rid });
    nudge(rec.tabId, 0, { type: 'hu.banner' });
    if (rec.windowId == null || keep) return;
    await keepDropWindow(rec.windowId, false);
    tell({ type: 'hu.closing', rid: rec.rid, why: why || rec.decidedBy || '' });
    await removeWindow(rec.windowId);
  }
  const shownOutcome = (rec) => { try { return rec.stage === 'verdict' && rec.verdict ? answerOf(rec.verdict, rec.intent).outcome : null; } catch (_) { return null; } };
  async function refuse(rid, by) {
    const r = await store.cancel(rid, by);
    if (r.status === 'deny') { await journal({ type: 'decision', stage: r.rec.stage, decision: 'cancel', by, origin: r.rec.origin, method: r.rec.method, level: r.rec.level || null, outcome: shownOutcome(r.rec), ui: r.rec.ui, total_ms: Date.now() - r.rec.createdAt }); await closeUi(r.rec); }
    return r;
  }

  const lastNote = new Map();
  // ---------- a gated request arrives from bridge.js ----------
  async function onGate(msg, sender) {
    const p = msg.payload || {};
    const origin = originOf(sender);
    if (p.kind === 'journal' && p.method === 'interception_partielle') {
      // window.ethereum could not be wrapped on this page : said in the journal and in the side panel, never hidden
      try { const cur = (await chrome.storage.local.get('partial')).partial; const m = cur && typeof cur === 'object' ? cur : {}; m[hostOf(origin)] = Date.now();
        const keys = Object.keys(m).sort((a, b) => m[b] - m[a]).slice(0, 20); const out = {}; for (const k of keys) out[k] = m[k]; await chrome.storage.local.set({ partial: out }); } catch (_) {}
      await journal({ type: 'partial', origin, method: 'interception_partielle', frame: sender.frameId === 0 ? 'top' : 'child' });
      return { done: true, allow: true };
    }
    if (p.kind === 'journal') {
      // not a gate (nothing waits for this answer). At most one line per origin and method every 10 s : a page cannot flush the decisions out of the journal.
      const jk = origin + '|' + String(p.method).slice(0, 40), now = Date.now();
      if (!(now - (lastNote.get(jk) || 0) < 10000)) { if (lastNote.size > 200) lastNote.clear(); lastNote.set(jk, now); await journal({ type: 'journal', origin, method: String(p.method).slice(0, 40), frame: sender.frameId === 0 ? 'top' : 'child' }); }
      return { done: true, allow: true };
    }
    if (!fromPage(sender)) return { done: true, allow: false, reason: 'onglet-inconnu' };
    { // S13 : an origin that cancelled twice in a row waits 60 s ; nobody can hold more than 10 windows at once
      const c = cancelRun.get(origin);
      if (c && c.n >= FLOOD.cancelsBeforeBlock) { if (Date.now() < c.until) return { done: true, allow: false, reason: 'denied' }; cancelRun.delete(origin); }
      let pend = 0; try { pend = (await store.all()).filter((r) => r.status === 'pending').length; } catch (_) {}
      if (pend >= FLOOD.maxPending) return { done: true, allow: false, reason: 'denied' };
    }
    if (typeof p.method !== 'string' || p.method.length > 80) return { done: true, allow: false, reason: 'demande-invalide' };
    if (!validRid(msg.rid)) return { done: true, allow: false, reason: 'demande-invalide' };
    const tabId = sender.tab.id, frameId = sender.frameId;
    // The revocation Hold up itself handed to the wallet came back through a wrapped method (a wallet that delegates later) :
    // with its valid token it goes on without a new question. Any other token, forged, reused, late, from another tab or for
    // another content, is ignored : the request is held and asked about like any other.
    if (p.revokeToken !== undefined) {
      if (await takeRevokeToken(p.revokeToken, tabId, frameId, p.method, p.params)) {
        await journal({ type: 'journal', origin, method: p.method, note: 'retrait prepare par Hold up : transmis au portefeuille sans nouvelle question', frame: frameId === 0 ? 'top' : 'child' });
        return { done: true, allow: true };
      }
      await journal({ type: 'journal', origin, method: p.method, note: 'marque de retrait refusee : demande retenue comme les autres', frame: frameId === 0 ? 'top' : 'child' });
    }
    // A connection (Sign-In with Ethereum naming this very site, asked by the top frame) moves nothing and grants nothing : no window.
    if (frameId === 0 && signIn(p.method, p.params, origin)) { await journal({ type: 'journal', origin, method: p.method, note: 'connexion reconnue : aucune fenetre', frame: 'top' }); return { done: true, allow: true }; }
    const old = await store.get(msg.rid);
    if (old) return old.tabId === tabId && old.frameId === frameId ? { pending: true } : { done: true, allow: false, reason: 'demande-invalide' };

    const cfg = await getCfg();
    const body = { origin, url: typeof sender.url === 'string' ? sender.url : origin, method: p.method, params: p.params, chainId: p.chainId, from: p.from,
      pageText: typeof msg.pageText === 'string' ? msg.pageText.slice(0, 4000) : undefined, topOrigin: msg.topOrigin, frame: frameId === 0 ? 'top' : 'child' };
    let floor = await safeCheck(body, cfg);
    let kept = null, slim = false, tooBig = false;
    try {
      if (JSON.stringify(body).length <= MAX_KEPT_BODY) kept = body;
      else { const sl = slimBody(body); if (sl && JSON.stringify(sl).length <= MAX_KEPT_BODY) { kept = sl; slim = true; } else tooBig = true; }
    } catch (_) { tooBig = true; }
    // Too big to be read even slimmed : fail closed. At least "not verified" (same delay as Danger), held, never a plain "attention" (S7).
    if (tooBig && RANK.unknown > (RANK[floor.level] || 0)) floor = Object.assign({}, floor, { level: 'unknown', indeterminate: true, why: 'demande trop grande', written: { outcome: 'unverifiable', line: TOO_BIG_LINE } });
    // Requests the engine does not read at all (a durable permission, a token added to the wallet's list, hidden settings of a batch) :
    // held, "not verified", with the one thing that can be said about them.
    { const own = ownLine(p.method, p.params); if (own) floor = Object.assign({}, floor, RANK.unknown > (RANK[floor.level] || 0) ? { level: 'unknown', indeterminate: true } : {}, { written: { outcome: 'unverifiable', line: own } }); }
    const eff = floor.effects || {};
    // A transaction the engine cannot read is still asked about : its effect can be measured once the person has written.
    const askable = !!kept && INTENT_METHODS.has(p.method) && cfg.askIntent !== 'never' && (floor.level !== 'unknown' || (unreadable(floor) && p.method === 'eth_sendTransaction'));
    const wantIntent = askable && (cfg.askIntent === 'always' || (cfg.askIntent === 'rights_or_funds' && (eff.grants_right || eff.funds_out || floor.level === 'unknown')));
    const init = { body: kept, slim, verdict: floor, level: floor.level, intent: null, grill: null, called: false };
    // The person wrote what they want a moment ago, on this very tab, frame and origin : not asked again. This request is checked
    // on its own against the SAME sentence, and against what the earlier requests of that sentence already took.
    const op = kept && INTENT_METHODS.has(p.method) && cfg.askIntent !== 'never' ? await opGet(tabId, frameId, origin, Date.now()) : null;
    let keptWin = null;
    if (op) {
      const j = await judgeWithIntent({ rid: msg.rid, tabId, frameId, body: kept, verdict: floor, slim }, op.intent, cfg, op);
      init.intent = op.intent; init.opAt = op.writtenAt; init.used = j.used; init.rewrite = j.rewrite; init.erc20 = j.erc20;
      // Nobody is asked again, so nothing goes by itself unless it was really compared to the sentence : a request that could not be
      // compared (nothing readable, no measure) is "not verified", with its delay and a gesture.
      let v2 = j.v;
      if (!(v2.written && v2.written.outcome)) v2 = Object.assign({}, v2, RANK.unknown > (RANK[v2.level] || 0) ? { level: 'unknown' } : {}, { written: { outcome: 'unverifiable', line: LINES.notCompared } });
      keptWin = await keepTake(tabId, frameId, origin, op, msg.rid, Date.now());
      if (keptWin) { init.ui = 'window'; init.windowId = keptWin.windowId; init.step = (keptWin.step || 1) + 1; }
      enterVerdict(init, v2, cfg, Date.now());
      await journal({ type: 'decision', stage: 'intent', decision: 'same_intent', actor: 'auto', intent: op.intent.kind || 'unclear', origin, method: p.method, age_ms: Date.now() - op.writtenAt });
    } else if (wantIntent) { init.stage = 'intent'; init.shownAt = Date.now(); }
    else applyPlan(init, planAfterIntent(floor, null, cfg), cfg, Date.now());

    const o = await store.open({ rid: msg.rid, tabId, frameId, origin, site: hostOf(origin), method: p.method, init });
    if (o.error) { await journal({ type: 'decision', stage: 'gate', decision: 'cancel', by: o.error, origin, method: p.method }); return { done: true, allow: false, reason: o.error === 'trop-de-demandes' ? 'denied' : o.error }; }
    if (o.existed) return { pending: true };
    await journalStage(o.rec);
    // Same operation, same window : it shows this request now (pushed here, and the window also asks by itself : hu.wait).
    if (keptWin && o.rec.windowId === keptWin.windowId) { tell({ type: 'hu.next', prev: keptWin.rid, rid: o.rec.rid }); nudge(tabId, 0, { type: 'hu.banner' }); }
    else await openUiOnce(o.rec, sender, cfg);
    if (testHook) runHook(o.rec.rid);
    return { pending: true };
  }
  async function journalStage(rec) {
    if (rec.stage !== 'verdict') return;
    const v = rec.verdict;
    await journal({ type: 'verdict', limited: rec.rewrite && v.written && v.written.limited ? { symbol: v.written.limited.symbol, amount: v.written.limited.amount } : undefined, origin: rec.origin, method: rec.method, level: v.level, codes: (Array.isArray(v.codes) ? v.codes.slice(0, 7) : []).concat(v.written && v.written.corrected ? ['droit_limite'] : []), indeterminate: !!v.indeterminate, why: v.why, latency_ms: v.latency_ms,
      friction: { phrase: rec.friction.phrase, wait_ms: rec.friction.waitMs }, grill: rec.grill ? { state: rec.grill.state, floor: rec.grill.floor, answers: rec.grill.answers } : null, intent: rec.intent ? rec.intent.choice : null });
  }

  // ---------- a screen answers ----------
  async function decide(rid, msg, by) {
    const rec = await store.get(rid);
    if (!rec) return { status: 'gone' };
    const cfg = await getCfg();
    const d = msg.decision, seq = msg.seq;
    const ttd = Number.isFinite(msg.ttd) ? Math.round(msg.ttd) : undefined;
    if (d === 'cancel') {
      const r = await store.submit(rid, { decision: 'cancel', by, meta: { via: msg.via === 'escape' ? 'escape' : 'button' } });
      if (r.status === 'deny') { await journal({ type: 'decision', stage: rec.stage, decision: 'cancel', by, origin: rec.origin, method: rec.method, level: rec.level || null, outcome: shownOutcome(rec), time_to_decision_ms: ttd, ui: rec.ui, total_ms: Date.now() - rec.createdAt }); await closeUi(r.rec); }
      return { status: 'deny' };
    }
    if (rec.status !== 'pending' || seq !== rec.seq) return { status: 'ignored' };
    let r = null;
    if (rec.stage === 'intent' && d === 'answer' && typeof msg.text === 'string') {
      // the person WROTE what they want : classify, compare, go straight to the answer (no further question)
      if (!cleanText(msg.text)) return { status: 'ignored' };
      // Longer than what is read (the window refuses it before ; this is the rule itself) : never judged on a cut sentence.
      if ((rec.firstText ? rec.firstText.length + 1 : 0) + String(msg.text).replace(/\s+/g, ' ').trim().length > MAX_TEXT) {
        const long = { clear: false, vague: true, kind: null, facts: {}, source: 'keywords', model: false, choice: 'other', text: cleanText(msg.text) };
        const vl = Object.assign({}, rec.verdict, RANK.unknown > (RANK[rec.verdict.level] || 0) ? { level: 'unknown' } : {}, { written: { outcome: 'unverifiable', line: LINES.tooLong } });
        await journal({ type: 'decision', stage: 'intent', decision: 'answer', intent: 'too_long', origin: rec.origin, method: rec.method, time_to_decision_ms: ttd, ui: rec.ui });
        r = await store.advance(rid, seq, (x, now) => { x.intent = long; x.rewrite = null; enterVerdict(x, vl, cfg, now); });
        if (!r || r.status !== 'next') return { status: 'ignored' };
        await journalStage(r.rec);
        return { status: 'next', view: viewOf(r.rec, cfg) };
      }
      const text = cleanText(rec.firstText ? rec.firstText + ' ' + msg.text : msg.text); // the answer to the follow-up completes the first sentence
      const intent = await understand(text);
      intent.choice = intent.clear ? (ENGINE_CHOICE[intent.kind] || 'other') : 'other';
      const again = relance(intent);
      if (again && !rec.asked) {
        // Too vague (nothing understood, or no amount, or nobody to pay) : ONE follow-up question, in the same window, never two.
        await journal({ type: 'decision', stage: 'intent', decision: 'relance', intent: intent.kind || 'unclear', classifier: intent.source, origin: rec.origin, method: rec.method, time_to_decision_ms: ttd, ui: rec.ui });
        r = await store.advance(rid, seq, (x, now) => { x.asked = true; x.firstText = text; x.ask = again; x.shownAt = now; });
        if (r.status !== 'next') return { status: 'ignored' };
        if (testHook) runHook(rid);
        return { status: 'next', view: viewOf(r.rec, cfg) };
      }
      if (again) intent.vague = true;
      const { v, used, rewrite, erc20 } = await judgeWithIntent(rec, intent, cfg);
      await journal({ type: 'decision', stage: 'intent', decision: 'answer', intent: intent.kind || 'unclear', classifier: intent.source, facts: intent.facts, origin: rec.origin, method: rec.method, time_to_decision_ms: ttd, ui: rec.ui });
      const op = await opOpen(rec, intent, Date.now());
      r = await store.advance(rid, seq, (x, now) => { x.intent = intent; x.used = used; x.rewrite = rewrite; x.erc20 = erc20; x.opAt = op ? op.writtenAt : null; enterVerdict(x, v, cfg, now); });
    } else if (rec.stage === 'intent' && d === 'answer') {
      const choice = msg.value in INTENT_ENGINE ? (msg.value === 'demande' ? 'asked' : msg.value) : 'other';
      const intent = { choice, message: typeof msg.message === 'string' ? msg.message.slice(0, 2000) : '' };
      let v = rec.verdict;
      if (rec.body && INTENT_ENGINE[choice]) {
        const v2 = await safeCheck(Object.assign({}, rec.body, { intent: INTENT_ENGINE[choice], intent_text: intent.message || undefined }), cfg);
        if ((RANK[v2.level] || 0) >= (RANK[v.level] || 0)) v = v2; // a declared intent can only make the verdict stricter
      }
      const plan = planAfterIntent(v, intent, cfg);
      await journal({ type: 'decision', stage: 'intent', decision: 'answer', intent: choice, origin: rec.origin, method: rec.method, time_to_decision_ms: ttd, ui: rec.ui });
      r = await store.advance(rid, seq, (x, now) => { x.intent = intent; applyPlan(x, plan, cfg, now); });
    } else if (rec.stage === 'grill' && d === 'answer') {
      const g = rec.grill, q = SOCIAL_Q[g.qids[g.i]], v = rec.verdict, eff = v.effects || {};
      const opt = g.opts.some((o) => o.id === msg.value) ? msg.value : 'prefer_not';
      let s = opt === 'prefer_not' ? 1 : (q.options.find((o) => o.id === opt) || { s: 0 }).s;
      if (opt === 'long' && (v.risk_signals || []).includes('new_recipient')) s = 2; // contradicts a checkable fact
      if (s > 0) g.social++;
      g.answers.push({ qid: q.id, option: opt, signal: s, time_to_decision_ms: ttd });
      g.cur = Math.min(3, g.cur + s);
      if (g.social >= 2 && (eff.grants_right || eff.funds_out)) g.cur = 3; // two social signals + a right or funds leaving
      g.i++;
      const more = g.i < g.qids.length && g.cur < 3;
      if (more) g.opts = optionsOf(g.qids[g.i], cfg);
      else {
        v.level = LEVELS[Math.max(LEVELS.indexOf(g.floor), LEVELS.indexOf(v.level), g.cur)];
        if (g.answers.some((a) => a.signal > 0)) (v.reasons = v.reasons || []).push('Tes réponses montrent des signes de pression ou de guidage par un tiers.');
      }
      r = await store.advance(rid, seq, (x, now) => { x.grill = g; if (more) { x.verdict = v; x.shownAt = now; } else enterVerdict(x, v, cfg, now); });
    } else if (rec.stage === 'verdict' && d === 'call') {
      await journal({ type: 'decision', stage: 'verdict', decision: 'call_trusted', origin: rec.origin, method: rec.method, level: rec.level, time_to_decision_ms: ttd, ui: rec.ui });
      r = await store.advance(rid, seq, (x) => { x.called = true; });
    } else if (rec.stage === 'verdict' && d === 'retry' && rec.level === 'unknown' && rec.body && (rec.retries || 0) < 3) {
      const v = await safeCheck(rec.body, cfg);
      r = await store.advance(rid, seq, (x, now) => { x.retries = (x.retries || 0) + 1; x.rewrite = null; enterVerdict(x, v, cfg, now); });
    } else if (rec.stage === 'verdict' && d === 'continue') {
      const s = await store.submit(rid, { seq, decision: 'continue', phraseOk: msg.phraseOk === true, by, meta: { screen: msg.screen } });
      if (s.status === 'allow') {
        await opSpend(s.rec, Date.now());
        // Who decided : the person (a gesture on "Continuer"), or the window by itself after "Ça correspond" (no gesture). And what
        // really went to the wallet : the request as the site sent it, or the one Hold up limited (amounts only, never an address).
        const lim = rec.rewrite && rec.verdict.written && rec.verdict.written.limited ? rec.verdict.written.limited : null;
        const who = by === 'human' && msg.auto === true ? 'auto' : by;
        await journal({ type: 'decision', stage: 'verdict', decision: 'confirm', by: who, actor: who === 'human' ? 'humain' : 'auto', limited: lim ? { symbol: lim.symbol, amount: lim.amount } : undefined, gesture: who === 'human', origin: rec.origin, method: rec.method, level: rec.level, outcome: shownOutcome(rec), indeterminate: !!rec.verdict.indeterminate,
          codes: [who === 'auto' ? 'envoi_automatique' : 'geste'].concat(lim ? ['droit_limite'] : []),
          sent: lim ? { limited: true, asked: lim.before, sent: lim.amount + ' ' + lim.symbol } : { limited: false },
          time_to_decision_ms: ttd, friction: { phrase: rec.friction.phrase, wait_ms: rec.friction.waitMs }, ui: rec.ui, total_ms: Date.now() - rec.createdAt });
        await keepGrant(s.rec);
        const keep = await keepOpen(s.rec, Date.now());
        await closeUi(s.rec, { keep, why: 'allow' });
        return { status: 'allow', more: keep, line: lim && rec.verdict.written.line ? rec.verdict.written.line : null };
      }
      if (s.status === 'again') { await journal({ type: 'early_continue', why: s.why, left_ms: s.leftMs, origin: rec.origin, method: rec.method, level: rec.level, ui: rec.ui }); return { status: 'again', why: s.why, view: viewOf(s.rec, cfg) }; }
      return { status: 'ignored' };
    }
    if (!r || r.status !== 'next') return { status: 'ignored' };
    await journalStage(r.rec);
    if (testHook) runHook(rid);
    return { status: 'next', view: viewOf(r.rec, cfg) };
  }
  function runHook(rid) {
    try { testHook({ rid, view: async () => { const rec = await store.get(rid); return rec ? viewOf(rec, await getCfg()) : null; }, decide: (m) => decide(rid, m, 'auto-test') }); } catch (_) {}
  }

  // Who may answer for a record : its own Hold up window, or (fallback overlay) the frame that made the request.
  function mayAnswer(rec, sender) {
    if (rec.ui === 'window') return fromWindow(sender) && sender.tab.windowId === rec.windowId;
    if (rec.ui === 'overlay') return fromPage(sender) && sender.tab.id === rec.tabId && sender.frameId === rec.frameId;
    return false;
  }

  const HANDLERS = {
    gate: onGate,
    // page side : "what about my request ?" (also the reconnection after a worker restart)
    'hu.poll': async (msg, sender) => {
      if (!fromPage(sender)) return { state: 'unknown' };
      const r = await store.poll(msg.rid, { tabId: sender.tab.id, frameId: sender.frameId });
      if (r.state === 'pending' && r.rec.ui === 'window' && r.rec.windowId != null) {
        // the window disappeared while the worker was stopped : closing the window = cancel
        let gone = false; try { await chrome.windows.get(r.rec.windowId); } catch (_) { gone = true; }
        if (gone) { await refuse(msg.rid, 'window-closed'); return { state: 'deny' }; }
      }
      if (r.state === 'deny' && r.rec && r.rec.decidedBy === 'expired' && r.rec.decidedAt >= Date.now() - 50) { await journal({ type: 'decision', stage: r.rec.stage, decision: 'cancel', by: 'expired', origin: r.rec.origin, method: r.rec.method }); await closeUi(r.rec); }
      if (r.state === 'pending' && r.rec.ui == null && !opening.has(msg.rid) && Date.now() - r.rec.createdAt > 2500) {
        await journal({ type: 'note', note: 'ecran rouvert apres un arret du service worker', origin: r.rec.origin, method: r.rec.method });
        await openUiOnce(r.rec, sender, await getCfg());
        r.rec = (await store.get(msg.rid)) || r.rec;
      }
      const out = { state: r.state };
      // The request goes to the wallet with the right Hold up limited (only the one the screen said it limited)
      if (r.state === 'allow' && r.rec.rewrite && Array.isArray(r.rec.rewrite.params) && r.rec.verdict && r.rec.verdict.written && r.rec.verdict.written.limited) out.params = r.rec.rewrite.params;
      if (r.state === 'pending') { out.ui = r.rec.ui; if (r.rec.ui === 'overlay') out.view = viewOf(r.rec, await getCfg()); }
      return out;
    },
    'hu.ack': async (msg, sender) => ({ ok: fromPage(sender) && await store.ack(msg.rid, { tabId: sender.tab.id, frameId: sender.frameId }) }),
    'hu.abandon': async (msg, sender) => {
      if (!fromPage(sender)) return { ok: false };
      const rec = await store.get(msg.rid);
      if (rec && rec.tabId === sender.tab.id && rec.frameId === sender.frameId && rec.status === 'pending') await refuse(msg.rid, 'page-left');
      return { ok: true };
    },
    // A page loads in this frame. An operation written for another origin does not survive it ; a new top page ends those of its frames.
    'hu.page': async (msg, sender) => {
      if (!fromPage(sender)) return { ok: false };
      const k = opKey(sender.tab.id, sender.frameId), op = await opRead(k);
      if (op && op.origin !== originOf(sender)) { try { await session.remove(k); } catch (_) {} }
      if (sender.frameId === 0) await opDrop(sender.tab.id, k);
      for (const { k: kk, v } of await keepAll()) if (v.tabId === sender.tab.id && (v.frameId === sender.frameId ? v.origin !== originOf(sender) : sender.frameId === 0)) await keepEnd(kk, v, 'page-left');
      return { ok: true };
    },
    // top frame : should the neutral banner be shown ?
    'hu.banner?': async (msg, sender) => {
      if (!fromPage(sender)) return { n: 0 };
      return { n: (await store.all()).filter((r) => r.tabId === sender.tab.id && r.status === 'pending' && r.ui === 'window').length };
    },
    // The window kept open for an operation asks : "is the next request there ?"
    'hu.wait': async (msg, sender) => {
      if (!fromWindow(sender)) return { status: 'gone' };
      for (const { k, v } of await keepAll()) {
        if (v.windowId !== sender.tab.windowId || (v.rid !== msg.rid && v.next !== msg.rid)) continue;
        if (v.next) return { status: 'next', rid: v.next };
        if (Date.now() > v.until) { await keepEnd(k, v, 'idle'); return { status: 'gone' }; }
        return { status: 'wait', leftMs: v.until - Date.now() };
      }
      return { status: 'gone' };
    },
    // Hold up window : "what do I show ?"
    'hu.view': async (msg, sender) => {
      const rec = await store.get(msg.rid);
      if (!rec || rec.status !== 'pending') return { status: 'gone' };
      if (rec.ui == null) return { status: 'wait' }; // the window loaded before its id was stored
      if (!mayAnswer(rec, sender)) return { status: 'gone' };
      return { status: 'view', view: viewOf(rec, await getCfg()) };
    },
    'hu.decision': async (msg, sender) => {
      const rec = await store.get(msg.rid);
      if (!rec) return { status: 'gone' };
      if (!mayAnswer(rec, sender)) return { status: 'ignored' };
      return decide(msg.rid, msg, 'human');
    }
  };
  // Side panel only. A message that carries a request (to, data, from, params...) is refused : the worker reads it from storage.session.
  for (const name of Object.keys(REVOKE_HANDLERS)) {
    HANDLERS[name] = async (msg, sender) => {
      if (!fromPanel(sender) || carriesRequest(msg) || !Number.isInteger(msg.tabId)) return { refused: true, state: 'error', code: 'refused' };
      return REVOKE_HANDLERS[name](msg, sender);
    };
  }
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || typeof msg.type !== 'string' || !Object.prototype.hasOwnProperty.call(HANDLERS, msg.type) || !sender || sender.id !== chrome.runtime.id) return false;
    HANDLERS[msg.type](msg, sender).then(sendResponse, (e) => sendResponse({ done: true, allow: false, state: 'unknown', status: 'ignored', reason: 'erreur: ' + String(e && e.message || e).slice(0, 80) }));
    return true;
  });

  // ---------- events that wake the worker ----------
  async function sweep() { for (const rec of await store.sweep()) { await journal({ type: 'decision', stage: rec.stage, decision: 'cancel', by: rec.decidedBy, origin: rec.origin, method: rec.method, level: rec.level || null }); await closeUi(rec); } }
  if (chrome.alarms) {
    chrome.alarms.onAlarm.addListener((a) => {
      const name = String(a && a.name || '');
      if (name.startsWith('hu:hold:')) {
        // the hold deadline passed while nobody was looking : tell the window to re-read its state (the decision still needs a gesture)
        const rid = name.slice(8);
        store.get(rid).then((rec) => { if (rec && rec.status === 'pending') { try { const p = chrome.runtime.sendMessage({ type: 'hu.refresh', rid }); if (p && p.catch) p.catch(() => {}); } catch (_) {} journal({ type: 'hold_elapsed', origin: rec.origin, method: rec.method, level: rec.level, held_ms: Date.now() - rec.shownAt }); } });
      } else if (name.startsWith(KEEP_KEY)) {
        // nothing came after the request the window was kept for : it says so and closes
        opRead(name).then((kept) => { if (kept && !kept.next) keepEnd(name, kept, 'idle'); });
      } else if (name.startsWith('hu:exp:') || name === 'hu:sweep') sweep();
    });
    try { chrome.alarms.create('hu:sweep', { periodInMinutes: 1 }); } catch (_) {}
  }
  if (chrome.windows && chrome.windows.onRemoved) chrome.windows.onRemoved.addListener((windowId) => {
    store.all().then((all) => { for (const r of all) if (r.windowId === windowId && r.status === 'pending') refuse(r.rid, 'window-closed'); });
    keepDropWindow(windowId, true);
  });
  if (chrome.tabs && chrome.tabs.onRemoved) chrome.tabs.onRemoved.addListener((tabId) => {
    store.all().then((all) => { for (const r of all) if (r.tabId === tabId && r.status === 'pending') refuse(r.rid, 'tab-closed'); });
    opDrop(tabId, null);
    keepAll().then((list) => { for (const { k, v } of list) if (v.tabId === tabId) keepEnd(k, v, 'tab-closed'); });
    Promise.resolve().then(() => session.remove(grantKey(tabId))).catch(() => {});
  });
  if (chrome.runtime.onStartup) chrome.runtime.onStartup.addListener(() => { sweep(); });
  if (!(chrome.storage && chrome.storage.session)) journal({ type: 'note', note: 'chrome.storage.session absent : la retenue ne survit pas a un arret du service worker' });

  return { store, getCfg, journal, decide, viewOf, sweep };
}

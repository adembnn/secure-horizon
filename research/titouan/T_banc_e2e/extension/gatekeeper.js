/* Hold up - gatekeeper, shared by both service workers (server mode and standalone). ES module.
 * It receives the gated requests from bridge.js, asks the engine (injected `check`), keeps every pending request in
 * chrome.storage.session through hold_core.js, shows the verdict in a separate extension window (window.html) and answers
 * the page side from the storage. Nothing here keeps a decision in memory : the worker can die at any time.
 * Fallback : if the window cannot be created, the in-page overlay of bridge.js is used and the journal says so. */
import { HoldStore, LIMITS, enterVerdict, frictionFor, validRid } from './hold_core.js';
import { ENGINE_CHOICE, cleanText, interpret, keywordClassify, stricter } from './intent_text.js';
import { TEXT, answerOf, siteName } from './outcome.js';

const LEVELS = ['ok', 'attention', 'danger', 'manipulation'];
const RANK = { attention: 1, unknown: 2, danger: 3, manipulation: 4 };
const DEFAULT_CFG = {
  dangerWaitMs: 30000,          // Danger : phrase to retype + this delay (floor 5 s)
  manipulationHoldMs: 600000,   // Manipulation : hold (floor 30 s)
  timeoutMs: 3000,
  askIntent: 'always',          // 'never' | 'rights_or_funds' | 'always' : intent question before the verdict
  verdictWindow: true,          // false = always the in-page overlay (trial only)
  grill: { enabled: true, shuffle: true, maxQuestions: 4 },
  contact: { name: '', tel: '' }
};
const INTENT_METHODS = new Set(['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign',
  'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4', 'wallet_sendCalls', 'eth_sendRawTransaction']);
// Values shown by the verdict surface ('demande' opens its paste box) -> choice understood by the engine (null = no declared intent, objective floor).
const INTENT_CHOICES = [
  { value: 'receive', label: 'Recevoir' }, { value: 'pay', label: 'Payer' }, { value: 'swap', label: 'Échanger' },
  { value: 'login', label: 'Me connecter' }, { value: 'demande', label: 'On me l’a demandé' }];
const INTENT_ENGINE = { receive: 'receive', pay: 'pay', login: 'login', demande: 'asked', asked: 'asked', swap: null, other: null };
const MAX_KEPT_BODY = 200000;   // above, the request body is not kept in the session storage : no intent question, no retry
const WIN = { width: 440, height: 540 };

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
export function createGatekeeper({ check, classify = null, onJournal = null, testHook = null } = {}) {
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

  async function getCfg() {
    let cfg = null;
    try { cfg = (await chrome.storage.local.get('cfg')).cfg; } catch (_) {}
    cfg = cfg && typeof cfg === 'object' ? cfg : {};
    const c = Object.assign({}, DEFAULT_CFG, cfg);
    c.grill = Object.assign({}, DEFAULT_CFG.grill, cfg.grill || {});
    c.grill.enabled = false; // the extra questions are retired : the person writes one sentence, the window answers once
    c.contact = Object.assign({}, DEFAULT_CFG.contact, cfg.contact || {});
    if (cfg.dangerWaitMs == null && cfg.frictionMs != null) c.dangerWaitMs = cfg.frictionMs; // former name
    if (c.askIntent === true) c.askIntent = 'always'; else if (c.askIntent === false) c.askIntent = 'never';
    if (!['never', 'rights_or_funds', 'always'].includes(c.askIntent)) c.askIntent = DEFAULT_CFG.askIntent;
    return c;
  }

  let journalChain = Promise.resolve();
  function journal(entry) { journalChain = journalChain.then(() => journalNow(entry), () => journalNow(entry)); return journalChain; }
  async function journalNow(entry) {
    entry.ts = Date.now();
    try {
      const { log } = await chrome.storage.local.get('log');
      const arr = Array.isArray(log) ? log : [];
      arr.push(entry); if (arr.length > 500) arr.splice(0, arr.length - 500);
      await chrome.storage.local.set({ log: arr });
    } catch (_) {}
    if (onJournal) { try { onJournal(entry); } catch (_) {} }
  }

  // The engine never says "ok" to the interface : whatever answers (a local process on the port in server mode), "ok" becomes "attention" and the screen is shown.
  async function safeCheck(body, cfg) {
    let v;
    try { v = await check(body, cfg); } catch (e) { v = null; }
    if (!v || typeof v !== 'object' || !(v.level in RANK || v.level === 'ok')) v = { level: 'unknown', indeterminate: true, why: 'moteur indisponible', reasons: [], effects: { grants_right: false, funds_out: false }, risk_signals: [] };
    if (v.level === 'ok') v.level = 'attention';
    return v;
  }

  // The written intent -> { clear, kind, facts, source, model, text }. Never throws ; an unusable answer falls back to the keywords.
  async function understand(text) {
    let raw = null;
    if (classify) { try { raw = await classify(text); } catch (_) { raw = null; } }
    if (!raw || typeof raw !== 'object') raw = await keywordClassify(text);
    return Object.assign(interpret(raw, text), { text });
  }
  // Runs the engine with what was understood and keeps the strictest verdict (strict-only : a sentence never lowers a level).
  async function judgeWithIntent(rec, intent, cfg) {
    let v = rec.verdict;
    const eff = v.effects || {};
    if (!rec.body) return v;
    const ask = (choice, kind) => safeCheck(Object.assign({}, rec.body, { intent: choice || undefined, intent_kind: kind, intent_text: intent.text,
      intent_amount: intent.amount, intent_symbol: intent.symbol }), cfg);
    if (intent.clear) v = stricter(v, await ask(ENGINE_CHOICE[intent.kind], intent.kind));
    if (intent.facts.receive && intent.kind !== 'asked_by_someone') v = stricter(v, await ask('receive', 'connect_or_accept_offer'));
    // Nothing understood while a right is granted or funds leave : it cannot be said to match. At least "not verified" (same delay as Danger).
    if (!intent.clear && (eff.grants_right || eff.funds_out) && RANK.unknown > (RANK[v.level] || 0)) v = Object.assign({}, v, { level: 'unknown' });
    return v;
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
      else if (f.phrase) view.note = 'Pour continuer : retape la phrase et attends ' + secs + ' s. Annuler reste possible.';
      if (f.waitMs && f.waitMs !== std) view.note += ' Réglage de démo : ' + secs + ' s au lieu de ' + Math.round(std / 1000) + ' s.';
      if (rec.called) view.contact = { name: cfg.contact.name || 'Un proche de confiance', tel: cfg.contact.tel || '' };
    }
    view.message = message;
    // What the Hold up window draws (ui/screen.js). Two moments : the question, then the answer.
    const site = siteName(rec.site);
    if (rec.stage === 'intent') view.screen = { kind: 'question', title: TEXT.question(site), placeholder: TEXT.placeholder };
    else if (rec.stage === 'verdict') view.screen = Object.assign({ kind: 'answer', leftMs: Math.max(0, rec.friction.deadline - now) }, answerOf(rec.verdict, rec.intent));
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
    const r = await store.advance(rec.rid, null, (x) => { x.ui = ui; x.windowId = windowId; });
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
  async function closeUi(rec) {
    if (rec.windowId != null) { try { await chrome.windows.remove(rec.windowId); } catch (_) {} }
    nudge(rec.tabId, rec.frameId, { type: 'hu.result', rid: rec.rid });
    nudge(rec.tabId, 0, { type: 'hu.banner' });
  }
  async function refuse(rid, by) {
    const r = await store.cancel(rid, by);
    if (r.status === 'deny') { await journal({ type: 'decision', stage: r.rec.stage, decision: 'cancel', by, origin: r.rec.origin, method: r.rec.method, level: r.rec.level || null, ui: r.rec.ui, total_ms: Date.now() - r.rec.createdAt }); await closeUi(r.rec); }
    return r;
  }

  const lastNote = new Map();
  // ---------- a gated request arrives from bridge.js ----------
  async function onGate(msg, sender) {
    const p = msg.payload || {};
    const origin = originOf(sender);
    if (p.kind === 'journal') {
      // not a gate (nothing waits for this answer). At most one line per origin and method every 10 s : a page cannot flush the decisions out of the journal.
      const jk = origin + '|' + String(p.method).slice(0, 40), now = Date.now();
      if (!(now - (lastNote.get(jk) || 0) < 10000)) { if (lastNote.size > 200) lastNote.clear(); lastNote.set(jk, now); await journal({ type: 'journal', origin, method: String(p.method).slice(0, 40), frame: sender.frameId === 0 ? 'top' : 'child' }); }
      return { done: true, allow: true };
    }
    if (!fromPage(sender)) return { done: true, allow: false, reason: 'onglet-inconnu' };
    if (typeof p.method !== 'string' || p.method.length > 80) return { done: true, allow: false, reason: 'demande-invalide' };
    if (!validRid(msg.rid)) return { done: true, allow: false, reason: 'demande-invalide' };
    const tabId = sender.tab.id, frameId = sender.frameId;
    const old = await store.get(msg.rid);
    if (old) return old.tabId === tabId && old.frameId === frameId ? { pending: true } : { done: true, allow: false, reason: 'demande-invalide' };

    const cfg = await getCfg();
    const body = { origin, url: typeof sender.url === 'string' ? sender.url : origin, method: p.method, params: p.params, chainId: p.chainId, from: p.from,
      pageText: typeof msg.pageText === 'string' ? msg.pageText.slice(0, 4000) : undefined, topOrigin: msg.topOrigin, frame: frameId === 0 ? 'top' : 'child' };
    const floor = await safeCheck(body, cfg);
    const eff = floor.effects || {};
    let kept = null;
    try { const s = JSON.stringify(body); if (s.length <= MAX_KEPT_BODY) kept = body; } catch (_) {}
    const wantIntent = !!kept && INTENT_METHODS.has(p.method) && floor.level !== 'unknown'
      && (cfg.askIntent === 'always' || (cfg.askIntent === 'rights_or_funds' && (eff.grants_right || eff.funds_out)));
    const init = { body: kept, verdict: floor, level: floor.level, intent: null, grill: null, called: false };
    if (wantIntent) { init.stage = 'intent'; init.shownAt = Date.now(); }
    else applyPlan(init, planAfterIntent(floor, null, cfg), cfg, Date.now());

    const o = await store.open({ rid: msg.rid, tabId, frameId, origin, site: hostOf(origin), method: p.method, init });
    if (o.error) { await journal({ type: 'decision', stage: 'gate', decision: 'cancel', by: o.error, origin, method: p.method }); return { done: true, allow: false, reason: o.error === 'trop-de-demandes' ? 'denied' : o.error }; }
    if (o.existed) return { pending: true };
    await journalStage(o.rec);
    await openUiOnce(o.rec, sender, cfg);
    if (testHook) runHook(o.rec.rid);
    return { pending: true };
  }
  async function journalStage(rec) {
    if (rec.stage !== 'verdict') return;
    const v = rec.verdict;
    await journal({ type: 'verdict', origin: rec.origin, method: rec.method, level: v.level, indeterminate: !!v.indeterminate, why: v.why, latency_ms: v.latency_ms,
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
      if (r.status === 'deny') { await journal({ type: 'decision', stage: rec.stage, decision: 'cancel', by, origin: rec.origin, method: rec.method, level: rec.level || null, time_to_decision_ms: ttd, ui: rec.ui, total_ms: Date.now() - rec.createdAt }); await closeUi(r.rec); }
      return { status: 'deny' };
    }
    if (rec.status !== 'pending' || seq !== rec.seq) return { status: 'ignored' };
    let r = null;
    if (rec.stage === 'intent' && d === 'answer' && typeof msg.text === 'string') {
      // the person WROTE what they want : classify, compare, go straight to the answer (no further question)
      const text = cleanText(msg.text);
      if (!text) return { status: 'ignored' };
      const intent = await understand(text);
      intent.choice = intent.clear ? (ENGINE_CHOICE[intent.kind] || 'other') : 'other';
      const v = await judgeWithIntent(rec, intent, cfg);
      await journal({ type: 'decision', stage: 'intent', decision: 'answer', intent: intent.kind || 'unclear', classifier: intent.source, facts: intent.facts, origin: rec.origin, method: rec.method, time_to_decision_ms: ttd, ui: rec.ui });
      r = await store.advance(rid, seq, (x, now) => { x.intent = intent; enterVerdict(x, v, cfg, now); });
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
      r = await store.advance(rid, seq, (x, now) => { x.retries = (x.retries || 0) + 1; enterVerdict(x, v, cfg, now); });
    } else if (rec.stage === 'verdict' && d === 'continue') {
      const s = await store.submit(rid, { seq, decision: 'continue', phraseOk: msg.phraseOk === true, by, meta: { screen: msg.screen } });
      if (s.status === 'allow') {
        await journal({ type: 'decision', stage: 'verdict', decision: 'confirm', by, origin: rec.origin, method: rec.method, level: rec.level, indeterminate: !!rec.verdict.indeterminate,
          time_to_decision_ms: ttd, friction: { phrase: rec.friction.phrase, wait_ms: rec.friction.waitMs }, ui: rec.ui, total_ms: Date.now() - rec.createdAt });
        await closeUi(s.rec);
        return { status: 'allow' };
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
    // top frame : should the neutral banner be shown ?
    'hu.banner?': async (msg, sender) => {
      if (!fromPage(sender)) return { n: 0 };
      return { n: (await store.all()).filter((r) => r.tabId === sender.tab.id && r.status === 'pending' && r.ui === 'window').length };
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
      } else if (name.startsWith('hu:exp:') || name === 'hu:sweep') sweep();
    });
    try { chrome.alarms.create('hu:sweep', { periodInMinutes: 1 }); } catch (_) {}
  }
  if (chrome.windows && chrome.windows.onRemoved) chrome.windows.onRemoved.addListener((windowId) => {
    store.all().then((all) => { for (const r of all) if (r.windowId === windowId && r.status === 'pending') refuse(r.rid, 'window-closed'); });
  });
  if (chrome.tabs && chrome.tabs.onRemoved) chrome.tabs.onRemoved.addListener((tabId) => {
    store.all().then((all) => { for (const r of all) if (r.tabId === tabId && r.status === 'pending') refuse(r.rid, 'tab-closed'); });
  });
  if (chrome.runtime.onStartup) chrome.runtime.onStartup.addListener(() => { sweep(); });
  if (!(chrome.storage && chrome.storage.session)) journal({ type: 'note', note: 'chrome.storage.session absent : la retenue ne survit pas a un arret du service worker' });

  return { store, getCfg, journal, decide, viewOf, sweep };
}

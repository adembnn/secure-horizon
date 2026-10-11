/* Hold up (version AUTONOME) - service worker MV3 de type module.
   Le moteur est EMBARQUE (engine/) : aucun serveur, aucun appel reseau. Il mene le mini grilling, pilote la fenetre (frame 0), journalise en local.
   Repli : si le moteur plante, le verdict est "indetermine" (traite comme un avertissement), jamais "ok". */
import { check, indeterminate, emptyLocal, sanitizeLocalContext } from './engine/sentinelle_core.js';
const LEVELS = ['ok', 'attention', 'danger', 'manipulation'];
const DEFAULT_CFG = {
  arm: 'B',                    // A sans delai (temoin de l essai, jamais par defaut), B delai (frictionMs), C phrase a retaper
  frictionMs: 30000,
  manipulationHoldMs: 600000,
  timeoutMs: 3000,
  askIntent: false,            // ecran 1 "question d'intention" avant le verdict
  grill: { enabled: true, shuffle: true, maxQuestions: 4 },
  contact: { name: 'Claire (ma fille)', tel: '' },
  testMode: false,
  auto: null                   // { decision:'confirm'|'cancel', delayMs, intent:'pay', grill:'clean'|'signal'|'prefer_not' } (testMode seulement)
};
const INTENT_METHODS = new Set(['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign',
  'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4', 'wallet_sendCalls', 'eth_sendRawTransaction']);

async function getCfg() {
  const { cfg } = await chrome.storage.local.get('cfg');
  const c = Object.assign({}, DEFAULT_CFG, cfg || {});
  c.grill = Object.assign({}, DEFAULT_CFG.grill, (cfg && cfg.grill) || {});
  c.contact = Object.assign({}, DEFAULT_CFG.contact, (cfg && cfg.contact) || {});
  c.testMode = false; c.auto = null; // build distribue : aucun mode automatique, quel que soit le contenu du stockage
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
}

// Contexte local OPTIONNEL de la personne (carnet, historique, adresses a elle, protocoles connus) : cle 'contexte' du stockage de l'extension.
async function getLocalContext() {
  try { const { contexte } = await chrome.storage.local.get('contexte'); return sanitizeLocalContext(contexte); } catch (_) { return emptyLocal(); }
}
// Remplace l'ancien appel HTTP : meme contrat (corps recu de bridge.js -> verdict), mais calcule ici, sans reseau.
// Ne leve jamais ; si le moteur plante : verdict indetermine (avertissement), jamais 'ok'.
async function localCheck(body) {
  const t0 = Date.now();
  try {
    const v = check(body, await getLocalContext());
    if (!v || !LEVELS.includes(v.level) && v.level !== 'unknown' || v.level === 'ok') throw new Error('verdict invalide');
    return v;
  } catch (e) {
    const v = indeterminate('moteur indisponible : ' + String(e && e.message || e).slice(0, 100));
    v.latency_ms = Date.now() - t0;
    return v;
  }
}

// --- retenue "manipulation" : l echeance vit dans chrome.storage.session (lue par le seul service worker, survit a son arret ; effacee a la fermeture du navigateur)
const HOLD_INLINE_MAX_MS = 240000; // au-dela, la fenetre n offre que "Annuler" : la personne relance la demande apres l echeance (un evenement MV3 ne tient pas 10 min)
const HOLD_GRACE_MS = 30 * 60000;  // une echeance depassee depuis plus de 30 min ne vaut plus : nouvelle retenue
const holdMem = new Map();
async function holdLeft(key, ms) {
  const k = 'hold:' + key, now = Date.now();
  let until;
  try { until = (await chrome.storage.session.get(k))[k]; } catch (_) { until = holdMem.get(k); }
  if (typeof until !== 'number' || now > until + HOLD_GRACE_MS || until - now > ms) {
    until = now + ms;
    try { await chrome.storage.session.set({ [k]: until }); } catch (_) { holdMem.set(k, until); }
  }
  return Math.max(0, until - now);
}
async function holdClear(key) { holdMem.delete('hold:' + key); try { await chrome.storage.session.remove('hold:' + key); } catch (_) {} }

// --- fenetre : toujours dans la frame 0 de l'onglet, sinon dans la frame demandeuse ---
async function ui(ctx, spec, cfg) {
  const msg = { type: 'ui', spec, cfg: { arm: cfg.arm, frictionMs: cfg.frictionMs, manipulationHoldMs: cfg.manipulationHoldMs, contact: cfg.contact, auto: cfg.auto }, ctx: { origin: ctx.origin, method: ctx.method } };
  try { return await chrome.tabs.sendMessage(ctx.tabId, msg, { frameId: 0 }); }
  catch (_) {
    try { return await chrome.tabs.sendMessage(ctx.tabId, msg, { frameId: ctx.frameId }); }
    catch (e) { return { decision: 'cancel', error: 'ui-indisponible' }; }
  }
}

// --- mini grilling d'intention ---
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
  pressure: { id: 'pressure', prompt: "On te demande de faire vite ?", options: [
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
  let ids;
  if (state === 'suspect') ids = ['origin', 'guidance', 'pressure'];
  else if (sig.includes('new_recipient') || sig.includes('lookalike')) ids = ['origin', 'familiarity', 'pressure'];
  if (state === 'suspect' && (sig.includes('new_recipient') || sig.includes('lookalike'))) ids = ['origin', 'familiarity', 'guidance', 'pressure'];
  else if (verdict.effects && verdict.effects.grants_right) ids = ['origin', 'guidance'];
  else ids = ['origin', 'pressure'];
  if (state === 'vague' || state === 'contradictory') ids = ids.concat(ids.includes('guidance') ? [] : ['guidance']);
  return ids.slice(0, Math.max(2, Math.min(4, max)));
}

async function runGrill(ctx, cfg, verdict, state) {
  const floor = LEVELS.indexOf(verdict.level);
  let cur = floor;
  const answers = [];
  const eff = verdict.effects || {};
  let social = 0;
  const qids = pickQuestions(state, verdict, cfg.grill.maxQuestions);
  const intro = "Quelques questions de plus parce que cette opération sort de tes habitudes.";
  for (let i = 0; i < qids.length && cur < 3; i++) {
    const q = SOCIAL_Q[qids[i]];
    let opts = q.options.map((o) => ({ id: o.id, label: o.label }));
    if (cfg.grill.shuffle) opts = shuffled(opts);
    opts.push({ id: 'prefer_not', label: 'Je préfère ne pas répondre' });
    const spec = { kind: 'grill', index: i + 1, total: qids.length, intro, qid: q.id, prompt: q.prompt, options: opts, truth: q.options.map((o) => ({ id: o.id, s: o.s })) };
    const r = await ui(ctx, spec, cfg);
    if (r.decision !== 'answer') return { cancelled: true, level: cur, answers, ttd: r.time_to_decision_ms };
    const opt = r.option;
    let s = opt === 'prefer_not' ? 1 : (q.options.find((o) => o.id === opt) || { s: 0 }).s;
    if (opt === 'long' && (verdict.risk_signals || []).includes('new_recipient')) s = 2; // contredit un fait verifiable
    if (s > 0) social++;
    answers.push({ qid: q.id, option: opt, signal: s, time_to_decision_ms: r.time_to_decision_ms });
    cur = Math.min(3, cur + s);
    if (social >= 2 && (eff.grants_right || eff.funds_out)) cur = 3; // deux signaux sociaux + droit/sortie = noir
  }
  return { cancelled: false, level: Math.max(floor, cur), answers };
}

async function handleGate(msg, sender) {
  const p = msg.payload;
  const cfg = await getCfg();
  const ctx = { tabId: sender.tab && sender.tab.id, frameId: sender.frameId, origin: msg.origin, method: p.method };
  const base = { origin: msg.origin, url: msg.url, method: p.method, params: p.params, chainId: p.chainId, from: p.from };
  const tStart = Date.now();
  if (p.kind === 'journal') { await journal({ type: 'journal', origin: msg.origin, method: p.method, frame: sender.frameId === 0 ? 'top' : 'child' }); return { allow: true }; }

  if (ctx.tabId == null) return { allow: false, reason: 'onglet-inconnu' };
  let intent = null;
  if (cfg.askIntent && INTENT_METHODS.has(p.method)) {
    const r = await ui(ctx, { kind: 'intent' }, cfg);
    if (r.decision !== 'continue') { await journal({ type: 'decision', stage: 'intent', decision: 'cancel', origin: msg.origin, method: p.method, time_to_decision_ms: r.time_to_decision_ms }); return { allow: false, reason: 'denied' }; }
    intent = r.intent;
  }
  const body = Object.assign({}, base, { intent: intent ? intent.choice : undefined, intent_text: intent && intent.message ? intent.message : undefined,
    pageText: msg.pageText, topOrigin: msg.topOrigin, frame: sender.frameId === 0 ? 'top' : 'child' });
  let verdict = await localCheck(body);
  let grillInfo = null;
  const eff = verdict.effects || {};
  if (cfg.grill.enabled && verdict.level !== 'unknown' && (eff.grants_right || eff.funds_out)) {
    const st = intentState(intent, verdict);
    const trigger = st !== 'clear' && (st !== 'absent' || (verdict.risk_signals || []).length > 0);
    if (trigger) {
      const floorLevel = verdict.level;
      if (st === 'vague' && LEVELS.indexOf(verdict.level) < 2) { verdict.level = 'danger'; (verdict.reasons = verdict.reasons || []).push("Ton intention n'est pas précise : on applique la règle la plus stricte."); }
      const g = await runGrill(ctx, cfg, verdict, st);
      grillInfo = { state: st, floor: floorLevel, answers: g.answers, cancelled: g.cancelled };
      if (g.cancelled) { await journal(Object.assign({ type: 'decision', stage: 'grill', decision: 'cancel', origin: msg.origin, method: p.method, grill: grillInfo, friction_arm: cfg.arm })); return { allow: false, reason: 'denied' }; }
      verdict.level = LEVELS[Math.max(LEVELS.indexOf(floorLevel), LEVELS.indexOf(verdict.level), g.level)];
      if (g.answers.some((a) => a.signal > 0)) (verdict.reasons = verdict.reasons || []).push('Tes réponses montrent des signes de pression ou de guidage par un tiers.');
    }
  }
  await journal({ type: 'verdict', origin: msg.origin, method: p.method, level: verdict.level, indeterminate: !!verdict.indeterminate, why: verdict.why, latency_ms: verdict.latency_ms, grill: grillInfo, intent: intent ? intent.choice : null, frame: body.frame });
  // Il n'existe pas de verdict 'ok' : toute demande surveillee passe par la fenetre (niveau le plus bas = 'attention' / info).

  const holdKey = () => (verdict.level === 'manipulation' && cfg.arm !== 'A' && !cfg.testMode ? [msg.origin, p.method, p.from || ''].join('|') : null);
  for (let attempt = 0; attempt < 4; attempt++) {
    const spec = { kind: 'verdict', verdict, attempt }, hk = holdKey();
    if (hk) { spec.holdLeftMs = await holdLeft(hk, cfg.manipulationHoldMs); spec.holdDeferred = spec.holdLeftMs > HOLD_INLINE_MAX_MS; }
    const r = await ui(ctx, spec, cfg);
    const entry = { type: 'decision', stage: 'verdict', origin: msg.origin, method: p.method, level: verdict.level, indeterminate: !!verdict.indeterminate,
      decision: r.decision, time_to_decision_ms: r.time_to_decision_ms, friction_arm: cfg.arm, friction_ms: r.friction_ms, continue_enabled_after_ms: r.continue_enabled_after_ms,
      early_click_blocked: r.early_click_blocked, cancel_visible: r.cancel_visible, ui_frame: r.ui_frame, viewport: r.viewport, total_ms: Date.now() - tStart, frame: body.frame, grill: grillInfo, ui_error: r.error };
    await journal(entry);
    if (r.decision === 'retry') { verdict = await localCheck(body); continue; }
    // l echeance est re-verifiee ici : un "confirm" recu avant la fin de la retenue est refuse
    if (r.decision === 'confirm' && hk) { if ((await holdLeft(hk, cfg.manipulationHoldMs)) > 1000) return { allow: false, reason: 'denied' }; await holdClear(hk); }
    return r.decision === 'confirm' ? { allow: true } : { allow: false, reason: 'denied' };
  }
  return { allow: false, reason: 'denied' };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'gate') {
    handleGate(msg, sender).then(sendResponse, (e) => sendResponse({ allow: false, reason: 'erreur: ' + (e && e.message) }));
    return true;
  }
  return false;
});

// Chauffe du moteur (le premier appel est plus lent) ; sans effet si cela echoue.
try { check({ method: 'eth_sendTransaction', params: [{ from: '0x' + '1'.repeat(40), to: '0x' + '2'.repeat(40), value: '0x1', data: '0x' }], chainId: '0x1' }); } catch (_) {}

export { handleGate, localCheck };

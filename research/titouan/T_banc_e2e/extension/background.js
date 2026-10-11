/* Hold up - service worker (server mode, ES module) : asks the local engine over HTTP ; the hold, the verdict window and the
   journal are in gatekeeper.js (shared with the standalone build). There is no test or automatic mode in this file. */
import { createGatekeeper } from './gatekeeper.js';
import { classifyViaRelay } from './classifier_client.js';
const API = 'http://127.0.0.1:8787';
const LEVELS = ['ok', 'attention', 'danger', 'manipulation', 'unknown'];

function unknown(why, ms) { return { level: 'unknown', indeterminate: true, why, latency_ms: ms, reasons: [], effects: { grants_right: false, funds_out: false }, risk_signals: [] }; }
// Never throws. Anything that is not a well-formed verdict is "unknown" (shown with the Danger friction).
// An "ok" answered by whatever listens on the port is turned into "attention" by the gatekeeper : it never opens the door without a screen.
async function callCheck(body, cfg) {
  const timeoutMs = Math.min(15000, Math.max(500, Number(cfg && cfg.timeoutMs) || 3000));
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const r = await fetch(API + '/check', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
    if (!r.ok) return unknown('reponse HTTP ' + r.status, Date.now() - t0);
    let j;
    try { j = await r.json(); } catch (_) { return unknown('reponse invalide (JSON illisible)', Date.now() - t0); }
    if (!j || typeof j !== 'object' || !LEVELS.includes(j.level)) return unknown('reponse invalide', Date.now() - t0);
    j.latency_ms = Date.now() - t0;
    return j;
  } catch (e) {
    return unknown(ctl.signal.aborted ? 'delai depasse (' + timeoutMs + ' ms)' : 'API indisponible', Date.now() - t0);
  } finally { clearTimeout(timer); }
}

createGatekeeper({
  check: callCheck,
  classify: classifyViaRelay,
  onJournal: (entry) => { try { fetch(API + '/log', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(entry) }).catch(() => {}); } catch (_) {} }
});

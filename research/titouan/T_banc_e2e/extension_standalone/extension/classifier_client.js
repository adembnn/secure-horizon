/* Hold up - the only network call of the extension : the written intent goes to the local classifier relay
 * (research/demo_reelle/classifieur/relay.mjs, loopback only), which holds the Clef / Jev keys. No key ever lives here.
 * Returns the relay's raw answer, or null (relay not running, slow, or answering nonsense) : the caller then uses the
 * embedded keyword parser. The relay itself gives the model 1.5 s ; this side waits a little longer. */
import { cleanText } from './intent_text.js';

export const RELAY = 'http://127.0.0.1:8789';
export const RELAY_TIMEOUT_MS = 2000;

export async function classifyViaRelay(text) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), RELAY_TIMEOUT_MS);
  try {
    const r = await fetch(RELAY + '/classify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: cleanText(text) }),
      signal: ctl.signal, credentials: 'omit', cache: 'no-store', redirect: 'error' });
    if (!r.ok) return null;
    const j = await r.json();
    return j && typeof j === 'object' && !Array.isArray(j) ? j : null;
  } catch (_) { return null; } finally { clearTimeout(timer); }
}

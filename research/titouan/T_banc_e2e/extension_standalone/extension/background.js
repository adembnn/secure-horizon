/* Hold up (standalone) - MV3 service worker, ES module.
   The engine is EMBEDDED (engine/) : no server. The only network call is the written intent sent to the local classifier
   relay (classifier_client.js, 127.0.0.1:8789) ; without the relay the embedded keyword parser answers. The hold, the verdict window and the journal are in
   gatekeeper.js (shared with the server-mode extension). If the engine fails the verdict is "indeterminate" (shown with
   the Danger friction), never "ok". There is no test or automatic mode in the shipped build. */
import { check, indeterminate, emptyLocal, sanitizeLocalContext } from './engine/sentinelle_core.js';
import { createGatekeeper } from './gatekeeper.js';
import { classifyViaRelay } from './classifier_client.js';
const LEVELS = ['attention', 'danger', 'manipulation', 'unknown'];

// Optional local context of the person (address book, history, own addresses, known protocols) : key 'contexte' of the extension storage.
async function getLocalContext() {
  try { const { contexte } = await chrome.storage.local.get('contexte'); return sanitizeLocalContext(contexte); } catch (_) { return emptyLocal(); }
}
// Same contract as the former HTTP call (body received from bridge.js -> verdict), computed here, without network.
// Never throws ; if the engine fails : indeterminate verdict (a warning), never 'ok'.
async function localCheck(body) {
  const t0 = Date.now();
  try {
    const v = check(body, await getLocalContext());
    if (!v || !LEVELS.includes(v.level)) throw new Error('verdict invalide');
    return v;
  } catch (e) {
    const v = indeterminate('moteur indisponible : ' + String(e && e.message || e).slice(0, 100));
    v.latency_ms = Date.now() - t0;
    return v;
  }
}

const gatekeeper = createGatekeeper({ check: localCheck, classify: classifyViaRelay  });

// Engine warm-up (the first call is slower) ; harmless if it fails.
try { check({ method: 'eth_sendTransaction', params: [{ from: '0x' + '1'.repeat(40), to: '0x' + '2'.repeat(40), value: '0x1', data: '0x' }], chainId: '0x1' }); } catch (_) {}

export { localCheck, gatekeeper };

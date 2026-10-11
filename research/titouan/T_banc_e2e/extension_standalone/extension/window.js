/* Hold up - host of the verdict window (extension page opened by the service worker with chrome.windows.create).
 * It embeds ui/verdict.html and talks to it through the contract of UI_CONTRAT.md, hardened on this side :
 *   - a message is accepted only if event.source is our iframe and event.origin is this extension ;
 *   - one decision per message id, and the id must be the one we sent last ;
 *   - a "continue" without friction.satisfied is dropped.
 * This page holds no state : the service worker answers from chrome.storage.session, so the page re-attaches by request id
 * after a worker restart. Closing the window cancels the request (chrome.windows.onRemoved in the worker). */
(() => {
  'use strict';
  const rid = location.hash.slice(1);
  const frame = document.getElementById('surface');
  const ORIGIN = location.origin;
  const $ = (id) => document.getElementById(id);
  let ready = false, view = null, sentId = null, n = 0, over = false;
  const decided = new Set();

  const ask = (msg) => { try { return chrome.runtime.sendMessage(Object.assign({ rid }, msg)); } catch (e) { return Promise.reject(e); } };
  function setText(el, text) { el.textContent = text || ''; el.hidden = !text; }

  function end(text) {
    over = true; frame.hidden = true; setText($('note'), ''); setText($('contact'), ''); setText($('end'), text);
    setTimeout(() => { try { window.close(); } catch (_) {} }, 900);
  }
  function show(v) {
    if (over || !v) return;
    view = v;
    $('site').textContent = v.site || '';
    document.title = 'Hold up' + (v.site ? ' : ' + v.site : '');
    setText($('note'), v.note);
    setText($('contact'), v.contact ? 'À appeler : ' + v.contact.name + (v.contact.tel ? ', ' + v.contact.tel : '') : '');
    if (!ready) return;
    // a fresh id per display : a decision of a previous display can never be replayed
    sentId = v.message.id + '#' + (++n);
    frame.contentWindow.postMessage(Object.assign({}, v.message, { id: sentId }), ORIGIN);
    try { frame.contentWindow.focus(); } catch (_) {} // keyboard goes to the surface : its initial focus is on "Annuler"
  }
  // Asks the worker what to show. Retries while the worker restarts or has not stored the window id yet.
  function load(tries) {
    if (over) return;
    ask({ type: 'hu.view' }).then((r) => {
      if (r && r.status === 'view') return show(r.view);
      if (r && r.status === 'gone') return end('Cette demande est terminée. Rien de plus ne sera envoyé.');
      retry(tries);
    }, () => retry(tries));
  }
  function retry(tries) { if (tries > 40) return end('Hold up ne répond plus. La demande reste refusée.'); setTimeout(() => load(tries + 1), 250); }

  function send(payload, tries) {
    ask(Object.assign({ type: 'hu.decision', seq: view.seq }, payload)).then((r) => {
      if (!r) return resend(payload, tries);
      if (r.status === 'allow') return end('C’est noté. La demande part vers ton portefeuille.');
      if (r.status === 'deny') return end('Demande annulée. Rien n’a été envoyé.');
      if (r.status === 'gone') return end('Cette demande est terminée. Rien de plus ne sera envoyé.');
      if (r.view) return show(r.view);
      load(0); // ignored (stale screen) : re-read the state
    }, () => resend(payload, tries));
  }
  // The answer was lost (worker stopped) : a cancel is sent again, anything else re-reads the state.
  function resend(payload, tries) {
    if (payload.decision === 'cancel' && tries < 20) return setTimeout(() => send(payload, tries + 1), 250);
    load(0);
  }

  window.addEventListener('message', (e) => {
    if (e.source !== frame.contentWindow || e.origin !== ORIGIN) return;
    const d = e.data;
    if (!d || typeof d !== 'object' || d.version !== 1) return;
    if (d.type === 'holdup.ready') { if (!ready) { ready = true; if (view) show(view); } return; }
    if (d.type !== 'holdup.decision' || over || !view) return;
    if (d.id !== sentId || decided.has(d.id)) return; // one decision per id, only for the screen on display
    decided.add(d.id);
    const base = { ttd: d.time_to_decision_ms, via: d.via, screen: d.screen };
    if (d.decision === 'cancel') return send(Object.assign(base, { decision: 'cancel' }), 0);
    if (d.decision === 'intent') return send(Object.assign(base, { decision: 'answer', value: String(d.intent || ''), message: typeof d.intent_message === 'string' ? d.intent_message : '' }), 0);
    if (d.decision === 'call_trusted') return send(Object.assign(base, { decision: 'call' }), 0);
    if (d.decision === 'continue') {
      const f = d.friction || {};
      if (f.satisfied !== true) return load(0);
      return send(Object.assign(base, { decision: 'continue', phraseOk: f.type === 'phrase' }), 0);
    }
    load(0);
  });
  // Re-sync of a countdown with the worker's absolute deadline. Never while a phrase is being typed (a new display would erase it).
  const resync = () => { if (!over && view && view.stage === 'verdict' && view.friction && !view.friction.phrase) load(0); };
  chrome.runtime.onMessage.addListener((msg) => { if (msg && msg.type === 'hu.refresh' && msg.rid === rid) resync(); return false; });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resync(); });
  if (!/^[A-Za-z0-9-]{8,64}$/.test(rid)) end('Hold up attend une demande à vérifier.'); else load(0);
})();

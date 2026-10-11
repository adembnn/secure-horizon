/* Hold up - the window opened by the service worker (chrome.windows.create) for one held request.
 * It draws two moments with ui/screen.js : the question (the person writes what they want to do), then the answer.
 * This page holds no state and decides nothing : every gesture is sent to the worker (hu.decision), which answers from
 * chrome.storage.session, so the page re-attaches by request id after a worker restart.
 *   - one gesture per screen (seq) : a stale answer is ignored by the worker ;
 *   - "Continuer" before the end of the delay is refused by the worker, whatever this page shows ;
 *   - closing the window cancels the request (chrome.windows.onRemoved in the worker). */
(() => {
  'use strict';
  const rid = location.hash.slice(1);
  const ui = window.HoldupScreen.mount(document.getElementById('hu'), {
    onSubmit: (text) => send({ decision: 'answer', text }, 0),
    onCancel: (via) => send({ decision: 'cancel', via }, 0),
    // The delay is the friction of this surface. `phraseOk` only tells the worker that no sentence is left to retype here ;
    // the deadline (hold_core.js) is checked by the worker and does not move.
    onContinue: () => send({ decision: 'continue', phraseOk: true }, 0)
  });
  let view = null, over = false, shownAt = 0;

  const ask = (msg) => { try { return chrome.runtime.sendMessage(Object.assign({ rid }, msg)); } catch (e) { return Promise.reject(e); } };
  function end(text) {
    over = true; ui.end(text);
    setTimeout(() => { try { window.close(); } catch (_) {} }, 900);
  }
  function show(v) {
    if (over || !v) return;
    const fresh = !view || view.seq !== v.seq;
    view = v;
    if (fresh) shownAt = Date.now();
    // A screen this window cannot draw is never passed along : the request is cancelled.
    if (!ui.show(v.screen, v.stage + ':' + (v.stage === 'verdict' ? 'answer' : v.seq))) send({ decision: 'cancel', via: 'button' }, 0);
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
    if (over || !view) return;
    ask(Object.assign({ type: 'hu.decision', seq: view.seq, ttd: Date.now() - shownAt }, payload)).then((r) => {
      if (!r) return resend(payload, tries);
      if (r.status === 'allow') return end('La demande part vers ton portefeuille.');
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

  // Re-sync of the delay with the worker's absolute deadline (alarm fired, window shown again).
  const resync = () => { if (!over && view && view.stage === 'verdict') load(0); };
  chrome.runtime.onMessage.addListener((msg) => { if (msg && msg.type === 'hu.refresh' && msg.rid === rid) resync(); return false; });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resync(); });
  if (!/^[A-Za-z0-9-]{8,64}$/.test(rid)) { over = true; ui.end('Hold up attend une demande à vérifier.'); } else load(0);
})();

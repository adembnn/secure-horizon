/* Hold up - the window opened by the service worker (chrome.windows.create) for one held request.
 * It draws the moments with ui/screen.js : the question (the person writes what they want to do), then the answer.
 * This page holds no state and decides nothing : every gesture is sent to the worker (hu.decision), which answers from
 * chrome.storage.session, so the page re-attaches by request id after a worker restart.
 *   - one gesture per screen (seq) : a stale answer is ignored by the worker ;
 *   - "Continuer" before the end of the delay is refused by the worker, whatever this page shows ;
 *   - closing the window cancels the request (chrome.windows.onRemoved in the worker) ;
 *   - ONE window per operation : when the worker says another request of the same sentence is expected (`more`), the window stays,
 *     says so, and shows that request when it comes (hu.next pushed by the worker, hu.wait asked from here). It never asks again ;
 *   - the window closes itself, after its last message has been on screen END_MS. */
(() => {
  'use strict';
  const END_MS = 700;     // a last message stays this long before the window closes
  const WAIT_POLL_MS = 500;
  const TEXT = {
    sent: 'La demande part vers ton portefeuille.',
    cancelled: 'Demande annulée. Rien n’a été envoyé.',
    over: 'Cette demande est terminée. Rien de plus ne sera envoyé.',
    waiting: 'J’attends la suite de l’opération. Rien d’autre ne partira sans vérification.',
    idle: 'Aucune autre demande n’est arrivée. Je ferme cette fenêtre.',
    expired: 'Cette demande a attendu trop longtemps. Elle est annulée, rien n’a été envoyé.',
    silent: 'Hold up ne répond plus. La demande reste refusée.',
    none: 'Hold up attend une demande à vérifier.'
  };
  let rid = location.hash.slice(1);
  const ui = window.HoldupScreen.mount(document.getElementById('hu'), {
    onSubmit: (text) => send({ decision: 'answer', text }, 0),
    onCancel: (via) => send({ decision: 'cancel', via }, 0),
    // The delay is the friction of this surface. `phraseOk` only tells the worker that no sentence is left to retype here ;
    // the deadline (hold_core.js) is checked by the worker and does not move. `auto` : nobody clicked, the window sent it on by
    // itself after "Ça correspond" (written as such in the journal).
    onContinue: (auto) => send({ decision: 'continue', phraseOk: true, auto: auto === true }, 0),
    onClose: () => { try { window.close(); } catch (_) {} }
  });
  let view = null, over = false, waiting = false, shownAt = 0, waitTimer = null;

  // ---- no state scrolls, at any zoom. The surface is designed for DESIGN (the viewport of the window at 100 %).
  //  1) a smaller viewport (page zoom at 125 %, 150 %...) : the window is asked to grow by the same factor, so the text keeps the size
  //     the person chose ; 2) until it has, or when the screen is too small for that, the surface is scaled down to the viewport ;
  //  3) a text longer than the window : the window grows in height, and if it cannot, the surface is scaled a little more.
  const DESIGN = { w: 422, h: 493 }, MIN_SCALE = 0.6;
  let grown = '';
  function scaleTo(z) { document.documentElement.style.zoom = z >= 0.999 ? '' : String(Math.round(z * 1000) / 1000); }
  function overflow() { const m = document.querySelector('.hu-main'); return m ? m.scrollHeight - m.clientHeight : 0; }
  function grow(factorW, factorH) {
    try {
      chrome.windows.getCurrent((w) => {
        if (chrome.runtime.lastError || !w || w.type !== 'popup') return;
        const maxW = Math.max(200, (screen.availWidth || 1280) - 16), maxH = Math.max(200, (screen.availHeight || 720) - 16);
        const width = Math.min(maxW, Math.ceil(w.width * factorW)), height = Math.min(maxH, Math.ceil(w.height * factorH));
        const key = width + 'x' + height;
        if (key === grown || (width <= w.width && height <= w.height)) return; // asked already, or nothing to gain
        grown = key;
        chrome.windows.update(w.id, { width: Math.max(width, w.width), height: Math.max(height, w.height) }, () => { void chrome.runtime.lastError; });
      });
    } catch (_) {}
  }
  function fit() {
    const base = Math.min(1, innerWidth / DESIGN.w, innerHeight / DESIGN.h);
    scaleTo(base);
    let z = base, over = overflow();
    if (base < 0.999) grow(1 / base, 1 / base);
    else if (over > 0) grow(1, (innerHeight + over + 8) / innerHeight);
    for (let i = 0; i < 12 && over > 0 && z > base * MIN_SCALE; i++) { z = Math.max(base * MIN_SCALE, z * 0.95); scaleTo(z); over = overflow(); }
  }
  let fitQueued = false;
  const fitSoon = () => { if (fitQueued) return; fitQueued = true; requestAnimationFrame(() => { fitQueued = false; fit(); }); };
  window.addEventListener('resize', fitSoon);
  try { new MutationObserver(fitSoon).observe(document.getElementById('hu'), { childList: true, subtree: true, characterData: true }); } catch (_) {}
  fitSoon();

  const ask = (msg) => { try { return chrome.runtime.sendMessage(Object.assign({ rid }, msg)); } catch (e) { return Promise.reject(e); } };
  // The last message, then the window closes itself. The message is on screen END_MS at least (ui.end says when it gets there).
  function end(text) {
    if (over) return;
    over = true; waiting = false; clearTimeout(waitTimer);
    const lead = ui.end(text);
    setTimeout(() => { try { window.close(); } catch (_) {} }, lead + END_MS);
  }
  // The request went to the wallet and the operation is not over : the window stays and looks for the next request.
  function wait(line) {
    waiting = true; view = null;
    ui.end(TEXT.sent, { wait: true, line, waitText: TEXT.waiting });
    pollNext();
  }
  function pollNext() {
    clearTimeout(waitTimer);
    if (!waiting || over) return;
    ask({ type: 'hu.wait' }).then((r) => {
      if (!waiting || over) return;
      if (r && r.status === 'next' && typeof r.rid === 'string') return follow(r.rid);
      if (r && r.status === 'gone') return end(TEXT.idle);
      waitTimer = setTimeout(pollNext, WAIT_POLL_MS);
    }, () => { waitTimer = setTimeout(pollNext, WAIT_POLL_MS); });
  }
  function follow(next) {
    if (!/^[A-Za-z0-9-]{8,64}$/.test(next) || next === rid) return;
    waiting = false; clearTimeout(waitTimer);
    rid = next; view = null;
    try { history.replaceState(null, '', '#' + rid); } catch (_) {}
    load(0);
  }
  function show(v) {
    if (over || waiting || !v) return;
    const fresh = !view || view.seq !== v.seq;
    view = v;
    if (fresh) shownAt = Date.now();
    try { document.title = 'Hold up' + (v.site && v.screen && v.screen.kind ? ' : ' + v.site : ''); } catch (_) {}
    // A screen this window cannot draw is never passed along : the request is cancelled.
    if (!ui.show(v.screen, rid + ':' + v.stage + ':' + (v.stage === 'verdict' ? 'answer' : v.seq))) send({ decision: 'cancel', via: 'button' }, 0);
  }
  // Asks the worker what to show. Retries while the worker restarts or has not stored the window id yet.
  function load(tries) {
    if (over || waiting) return;
    ask({ type: 'hu.view' }).then((r) => {
      if (r && r.status === 'view') return show(r.view);
      if (r && r.status === 'gone') return end(TEXT.over);
      retry(tries);
    }, () => retry(tries));
  }
  function retry(tries) { if (tries > 40) return end(TEXT.silent); setTimeout(() => load(tries + 1), 250); }

  function send(payload, tries) {
    if (over || waiting || !view) return;
    const forRid = rid;
    ask(Object.assign({ type: 'hu.decision', seq: view.seq, ttd: Date.now() - shownAt }, payload)).then((r) => {
      if (rid !== forRid) return;
      if (!r) return resend(payload, tries);
      if (r.status === 'allow') return r.more ? wait(typeof r.line === 'string' ? r.line : null) : end(TEXT.sent);
      if (r.status === 'deny') return end(TEXT.cancelled);
      if (r.status === 'gone') return end(TEXT.over);
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
  const resync = () => { if (!over && !waiting && view && view.stage === 'verdict') load(0); };
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg) return false;
    if (msg.type === 'hu.refresh' && msg.rid === rid) resync();
    // the next request of the operation is there : shown here, in this window
    else if (msg.type === 'hu.next' && msg.prev === rid && waiting) pollNext();
    // the worker ended this request for a reason this window did not cause (page left, tab closed, expired, nothing came)
    else if (msg.type === 'hu.closing' && msg.rid === rid && !over) end(msg.why === 'idle' ? TEXT.idle : msg.why === 'allow' ? TEXT.sent : msg.why === 'expired' || msg.why === 'orphan' ? TEXT.expired : waiting ? TEXT.idle : TEXT.cancelled);
    return false;
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resync(); });
  if (!/^[A-Za-z0-9-]{8,64}$/.test(rid)) { over = true; ui.end(TEXT.none); } else load(0);
})();

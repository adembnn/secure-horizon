/* Hold up - bridge (isolated world, document_start, all frames).
 * 1) receives the requests of inject.js through a private MessageChannel and hands them to the service worker ;
 * 2) waits for the decision BY REQUEST ID : the worker answers from chrome.storage.session, so the wait survives a worker
 *    restart (a lost answer is simply asked again). No stored allow = refusal ;
 * 3) the verdict itself is shown in a separate Hold up window. This page only gets a neutral, non-interactive banner
 *    (closed shadow root, top frame). The in-page panel below is the fallback when the window cannot be created. */
(() => {
  'use strict';
  // ================= channel to inject.js =================
  let port = null;
  // Random 128-bit token given to inject.js in "ready" only (through the private port). Every message in both directions carries it :
  // a message without it is ignored (a page that replaced a native method of its own world sees neither the token nor the port).
  let token = '';
  function newToken() { const a = new Uint8Array(16); crypto.getRandomValues(a); return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join(''); }
  function onHello(ev) {
    const d = ev.data;
    if (ev.source !== window || !d || d.__sentinelle !== 'hello' || !ev.ports || !ev.ports[0]) return;
    ev.stopImmediatePropagation(); // the page never sees a port, not even the ones of the retries that arrive after the connection
    if (port && d.re !== true) return; // a second hello is a retry : ignored. Only a hello marked "re" (inject.js dropped its connection after document.open()) replaces the port.
    if (port) { try { port.onmessage = null; port.close(); } catch (_) {} }
    port = ev.ports[0];
    token = newToken();
    port.onmessage = onPortMsg;
    port.postMessage({ t: 'ready', k: token });
  }
  window.addEventListener('message', onHello, true);
  // document.open() (document.write in an about:blank iframe) removes the window listeners : put it back until connected.
  // Put back every 20 ms until connected, then every 100 ms for good (a later document.open() clears it again).
  let rearmN = 0;
  setInterval(() => { if (!port || ++rearmN % 5 === 0) window.addEventListener('message', onHello, true); }, 20);

  function pageText() {
    try { const b = document.body; return b ? (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 4000) : ''; } catch (_) { return ''; }
  }
  function topOrigin() { try { return window.top.location.origin; } catch (_) { try { return document.referrer ? new URL(document.referrer).origin : null; } catch (__) { return null; } } }
  const send = (msg) => { try { return chrome.runtime.sendMessage(msg); } catch (e) { return Promise.reject(e); } };
  function newRid() {
    try { return crypto.randomUUID(); } catch (_) {}
    const a = new Uint8Array(16); crypto.getRandomValues(a);
    return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  const waits = new Map(); // rid -> { id (of inject.js), fails, timer, overlay }
  function finish(rid, allow, reason, params) {
    const w = waits.get(rid); if (!w) return;
    waits.delete(rid); clearTimeout(w.timer);
    if (w.overlay) w.overlay.abort();
    const out = { t: 'result', id: w.id, k: token, allow: !!allow, reason: allow ? '' : (reason || 'denied') };
    if (allow && Array.isArray(params)) out.params = params; // request limited by Hold up (Q17)
    try { port.postMessage(out); } catch (_) {}
    send({ type: 'hu.ack', rid }).catch(() => {});
  }
  // Asks the worker for the state of the request. Works the same after a worker restart : the answer comes from the storage.
  function poll(rid) {
    const w = waits.get(rid); if (!w) return;
    clearTimeout(w.timer);
    const again = (ms) => { if (waits.has(rid)) w.timer = setTimeout(() => poll(rid), ms); };
    send({ type: 'hu.poll', rid }).then((r) => {
      if (!waits.has(rid)) return;
      if (!r || typeof r.state !== 'string') { if (++w.fails > 20) return finish(rid, false, 'extension-indisponible'); return again(1000); }
      w.fails = 0;
      if (r.state === 'allow') return finish(rid, true, '', r.params);
      if (r.state !== 'pending') return finish(rid, false, 'denied'); // deny, or unknown to the worker : fail closed
      if (r.ui === 'overlay' && r.view) overlayShow(rid, r.view);
      again(1000);
    }, () => { if (!waits.has(rid)) return; if (++w.fails > 20) return finish(rid, false, 'extension-indisponible'); again(1000); });
  }
  function startGate(m) {
    const rid = newRid();
    const req = { type: 'gate', rid, payload: Object.assign({}, m.payload, { kind: 'gate' }),
      origin: location.origin === 'null' ? location.href.split('#')[0] : location.origin, url: location.href, pageText: pageText(), topOrigin: topOrigin() };
    waits.set(rid, { id: m.id, fails: 0, timer: null, overlay: null });
    let tries = 0;
    const attempt = () => send(req).then((r) => {
      if (!waits.has(rid)) return;
      if (r && r.done) return finish(rid, !!r.allow, r.reason);
      if (r && r.pending) return poll(rid);
      retry();
    }, retry);
    // The worker died before answering : the same request id is sent again (the worker is idempotent on it).
    function retry() { if (!waits.has(rid)) return; if (++tries > 5) return finish(rid, false, 'extension-indisponible'); setTimeout(attempt, 300 * tries); }
    attempt();
  }
  // Reads asked by the service worker for a request still held here : relayed to inject.js, which asks the wallet's own node.
  const reads = new Map(); let readN = 0;
  function relayRead(msg, sendResponse) {
    const w = waits.get(msg.rid);
    if (!w || !port) { sendResponse({ ok: false }); return false; }
    const n = ++readN;
    const timer = setTimeout(() => { if (reads.delete(n)) sendResponse({ ok: false }); }, 9000);
    reads.set(n, (m) => { clearTimeout(timer); sendResponse(m.ok === true ? { ok: true, result: m.result } : { ok: false }); });
    try { port.postMessage({ t: 'rpc', id: w.id, k: token, n, method: msg.method, params: msg.params }); } catch (_) { reads.delete(n); clearTimeout(timer); sendResponse({ ok: false }); return false; }
    return true; // answered later
  }
  // Revocation prepared by Hold up (revoke.js), asked by the service worker only (chrome.runtime messages come from the extension,
  // never from the page). Relayed to inject.js, which hands it to the wallet's own request method. Hold up never signs.
  // The site must still be the one that received the right : otherwise nothing is sent.
  const revokes = new Map(); let revokeN = 0;
  const hereOrigin = () => (location.origin === 'null' ? location.href.split('#')[0] : location.origin);
  function relayRevoke(msg, sendResponse) {
    if (!port) { sendResponse({ state: 'error', code: 'no_provider' }); return false; }
    if (msg.origin !== hereOrigin()) { sendResponse({ state: 'error', code: 'origin_changed' }); return false; }
    const op = msg.op === 'read' ? 'read' : msg.op === 'send' ? 'send' : null;
    if (!op || (op === 'send' && msg.method !== 'eth_sendTransaction') || (op === 'read' && msg.method !== 'eth_call') || !Array.isArray(msg.params)) { sendResponse({ state: 'error', code: 'refused' }); return false; }
    const n = ++revokeN;
    const timer = setTimeout(() => { if (revokes.delete(n)) sendResponse({ state: 'error', code: 'timeout' }); }, op === 'read' ? 9000 : 295000);
    revokes.set(n, (m) => { clearTimeout(timer); sendResponse({ state: typeof m.state === 'string' ? m.state : 'error', code: m.code, result: m.result }); });
    try { port.postMessage({ t: 'revoke', k: token, n, op, tok: typeof msg.tok === 'string' ? msg.tok : '', method: msg.method, params: msg.params }); } catch (_) { revokes.delete(n); clearTimeout(timer); sendResponse({ state: 'error', code: 'no_provider' }); return false; }
    return true; // answered later
  }
  function onPortMsg(ev) {
    const m = ev.data; if (!m || m.k !== token) return;
    if (m.t === 'rpcResult') { const cb = reads.get(m.n); if (cb) { reads.delete(m.n); cb(m); } return; }
    if (m.t === 'revokeResult') { const cb = revokes.get(m.n); if (cb) { revokes.delete(m.n); cb(m); } return; }
    if (m.t === 'gate') { port.postMessage({ t: 'ack', id: m.id, k: token }); startGate(m); }
    else if (m.t === 'notify') {
      send({ type: 'gate', payload: Object.assign({}, m.payload, { kind: 'journal' }), origin: location.origin, url: location.href }).catch(() => {});
    }
  }
  // A page starts in this frame : an intent written for another origin on this tab must not follow the person here.
  send({ type: 'hu.page' }).catch(() => {});
  // The page goes away : its pending requests are refused (their Hold up window closes).
  window.addEventListener('pagehide', () => { for (const rid of waits.keys()) send({ type: 'hu.abandon', rid }).catch(() => {}); }, true);

  // ================= fallback in the page (only when the separate window cannot be created) =================
  // The same surface as the window (docs/design/system, repli_dans_la_page.html) : a black box on a veil, the SAME sentences as the
  // window (they come from the worker : view.screen), the same two gestures. It never asks anything and never shows a sentence the
  // person did not write : nobody could be asked, so the answer is "Je n'ai pas pu vérifier cette demande", with its delay.
  // Annuler is always there. The veil is not a decoration : the site cannot be clicked while the answer is there.
  // The sheet below is written by tools/gen_overlay_sheet.mjs from ui/tokens.css, ui/components.css and ui/motion.css.
  const CSS = /*@SHEET@*/`
:host {
--hu-page: #ffffff;
--hu-ink: #000000;
--hu-ink-2: #555555;
--hu-ink-3: #767676;
--hu-wash: #ececec;
--hu-frame: #d0d0d0;
--hu-k: #000000;
--hu-k-ink: #ffffff;
--hu-k-2: #b3b3b3;
--hu-k-3: #808080;
--hu-k-wash: #222222;
--hu-font: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Roboto, sans-serif;
--hu-regular: 400;
--hu-strong: 600;
--hu-t-xl: 28px/36px;
--hu-t-l: 22px/28px;
--hu-t-m: 18px/24px;
--hu-b-l: 16px/24px;
--hu-b-m: 14px/20px;
--hu-stroke: 1px;
--hu-r: 6px;
--hu-focus: 2px;
--hu-focus-gap: 2px;
--hu-1: 4px; --hu-2: 8px; --hu-3: 12px; --hu-4: 16px; --hu-5: 20px; --hu-6: 24px; --hu-8: 32px; --hu-10: 40px; --hu-12: 48px; --hu-16: 64px;
--hu-win-w: 424px;
--hu-win-h: 501px;
--hu-ctl: 40px;
--hu-ctl-s: 36px;
--hu-glove: 88px;
--hu-d-1: 80ms;
--hu-d-2: 120ms;
--hu-d-3: 160ms;
--hu-d-4: 200ms;
--hu-d-glove: 340ms;
--hu-d-leave: 1000ms;
--hu-e: cubic-bezier(0.2, 0, 0, 1);
--hu-e-in: cubic-bezier(0.16, 1, 0.3, 1);
--hu-e-out: cubic-bezier(0.4, 0, 1, 1);
color-scheme: light;
}
@media (prefers-color-scheme: dark) {
:host:not([data-theme="light"]) {
--hu-page: #000000; --hu-ink: #ffffff; --hu-ink-2: #b3b3b3; --hu-ink-3: #808080; --hu-wash: #222222; --hu-frame: #4a4a4a;
color-scheme: dark;
}
}
:host[data-theme="dark"] {
--hu-page: #000000; --hu-ink: #ffffff; --hu-ink-2: #b3b3b3; --hu-ink-3: #808080; --hu-wash: #222222; --hu-frame: #4a4a4a;
color-scheme: dark;
}
.hu-k {
--hu-page: var(--hu-k); --hu-ink: var(--hu-k-ink); --hu-ink-2: var(--hu-k-2); --hu-ink-3: var(--hu-k-3); --hu-wash: var(--hu-k-wash);
color-scheme: dark;
}
.hu, .hu *, .hu *::before, .hu *::after { box-sizing: border-box; }
.hu {
margin: 0; background: var(--hu-page); color: var(--hu-ink);
font: var(--hu-regular) var(--hu-b-m) var(--hu-font);
-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
accent-color: var(--hu-ink); caret-color: var(--hu-ink);
scrollbar-width: thin; scrollbar-color: var(--hu-ink-3) transparent;
}
.hu ::selection { background: var(--hu-ink); color: var(--hu-page); }
.hu [hidden] { display: none !important; }
:where(.hu) :where(p, h1, h2, h3, ul, ol, figure) { margin: 0; padding: 0; }
:where(.hu) :where(ul, ol) { list-style: none; }
:where(.hu) :where(button, input, select, textarea) { font: inherit; color: inherit; }
:where(.hu) :where(b, strong) { font-weight: var(--hu-strong); }
.hu-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.hu-num { font-variant-numeric: tabular-nums; }
.hu-2 { color: var(--hu-ink-2); }
.hu :focus { outline: none; }
.hu :focus-visible, .hu .is-focus { outline: var(--hu-focus) solid var(--hu-ink); outline-offset: var(--hu-focus-gap); }
.hu-cuff {
position: relative; display: inline-flex; align-items: center; justify-content: center; flex: none;
min-width: 128px; height: var(--hu-ctl); padding: 0 var(--hu-5); border: 0; border-radius: var(--hu-r);
background: var(--hu-ink); color: var(--hu-page); font: var(--hu-strong) var(--hu-b-m) var(--hu-font); white-space: nowrap; cursor: pointer;
transition: transform var(--hu-d-1) var(--hu-e);
}
.hu-cuff::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--hu-page); opacity: 0; transition: opacity var(--hu-d-2) var(--hu-e); pointer-events: none; }
.hu-cuff:not([aria-disabled="true"]):hover::after, .hu-cuff.is-hover::after { opacity: 0.16; }
.hu-cuff:not([aria-disabled="true"]):active, .hu-cuff.is-press { transform: translateY(1px); }
.hu-cuff:not([aria-disabled="true"]):active::after, .hu-cuff.is-press::after { opacity: 0.28; }
.hu-cuff[aria-disabled="true"] { background: transparent; color: var(--hu-ink-2); box-shadow: inset 0 0 0 var(--hu-stroke) var(--hu-ink-3); cursor: default; }
.hu-cuff[aria-disabled="true"]::after { display: none; }
.hu-word {
padding: var(--hu-2) 0; margin: calc(-1 * var(--hu-2)) 0; border: 0; border-radius: 2px; background: none; color: var(--hu-ink);
font: var(--hu-regular) var(--hu-b-m) var(--hu-font); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; cursor: pointer;
}
.hu-word:not([aria-disabled="true"]):hover, .hu-word.is-hover { text-decoration-thickness: 2px; }
.hu-word:not([aria-disabled="true"]):active, .hu-word.is-press { color: var(--hu-ink-2); }
.hu-word[aria-disabled="true"] { color: var(--hu-ink-2); text-decoration: none; cursor: default; }
.hu-win { position: relative; width: 100%; height: 100%; overflow: hidden; container-type: size; background: var(--hu-page); color: var(--hu-ink); text-align: center; }
.hu-stage { display: flex; flex-direction: column; height: 100%; padding: var(--hu-6); }
.hu-head { color: var(--hu-ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hu-head b { font-weight: var(--hu-regular); color: var(--hu-ink); }
.hu-head--wrap { white-space: normal; overflow-wrap: anywhere; }
.hu-title { margin-top: var(--hu-3); font: var(--hu-strong) var(--hu-t-l) var(--hu-font); }
.hu-sub { margin-top: var(--hu-1); color: var(--hu-ink-2); }
.hu-sub.is-error { color: var(--hu-ink); font-weight: var(--hu-strong); }
.hu-mid { margin: auto 0; }
.hu-field {
display: block; flex: 1 1 98px; min-height: 98px; max-height: 146px; width: 100%; margin-top: var(--hu-5); padding: 12px var(--hu-4); resize: none;
border: var(--hu-stroke) solid var(--hu-ink-3); border-radius: var(--hu-r); background: var(--hu-page); color: var(--hu-ink);
font: var(--hu-regular) var(--hu-b-l) var(--hu-font); text-align: center; overflow-wrap: anywhere;
}
.hu-field--short { flex: none; min-height: 0; height: 50px; }
.hu-field::placeholder { color: var(--hu-ink-2); opacity: 1; }
.hu-field:hover, .hu-field.is-hover { border-color: var(--hu-ink); }
.hu-field:focus, .hu-field:focus-visible, .hu-field.is-focus { outline: none; border-color: var(--hu-ink); box-shadow: inset 0 0 0 1px var(--hu-ink); }
.hu-field[aria-invalid="true"] { border-color: var(--hu-ink); box-shadow: inset 0 0 0 1px var(--hu-ink); }
.hu-field[readonly] { color: var(--hu-ink-2); border-color: var(--hu-ink-3); box-shadow: none; }
.hu-field:disabled { color: var(--hu-ink-2); border-color: var(--hu-wash); }
.hu-got { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: var(--hu-2); margin-top: var(--hu-4); }
.hu-got-say { grid-column: 1 / -1; color: var(--hu-ink-2); }
.hu-slot { position: relative; display: block; height: 24px; font: var(--hu-regular) var(--hu-b-l) var(--hu-font); white-space: nowrap; }
.hu-slot-q, .hu-slot-v { position: absolute; inset: 0; overflow: hidden; text-overflow: ellipsis; }
.hu-slot-q { color: var(--hu-ink-2); }
.hu-slot-v { opacity: 0; }
.hu-slot.is-filled .hu-slot-q { opacity: 0; }
.hu-slot.is-filled .hu-slot-v { opacity: 1; }
.hu-slot.is-missing .hu-slot-q { color: var(--hu-ink); font-weight: var(--hu-strong); }
.hu-slot.is-off { visibility: hidden; }
.hu-got-from { grid-column: 1 / -1; margin-top: var(--hu-1); color: var(--hu-ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hu-under { display: grid; margin-top: var(--hu-3); }
.hu-under > * { grid-area: 1 / 1; }
.hu-assume, .hu-busy, .hu-count { color: var(--hu-ink-2); }
.hu-busy { opacity: 0; }
[data-state="checking"] .hu-assume { opacity: 0; }
[data-state="checking"] .hu-busy { opacity: 1; }
.hu-dock { display: flex; align-items: center; justify-content: space-between; gap: var(--hu-4); min-height: var(--hu-ctl); margin-top: auto; padding-top: var(--hu-4); text-align: left; }
.hu-mid + .hu-dock { margin-top: 0; }
.hu-dock--end { justify-content: flex-end; }
@container (max-width: 400px) {
.hu-dock:has(.hu-wait) { flex-direction: column-reverse; align-items: stretch; gap: var(--hu-2); }
.hu-dock:has(.hu-wait) .hu-wait { justify-content: center; }
}
.hu-wait { display: flex; align-items: baseline; gap: 0.3em; color: var(--hu-ink-2); white-space: nowrap; }
.is-ready .hu-wait-count { opacity: 0; }
.hu-wait .hu-num { display: inline-block; min-width: 2ch; text-align: right; }
.hu-leave { color: var(--hu-ink-2); }
.hu-verdict { font: var(--hu-strong) var(--hu-t-l) var(--hu-font); text-wrap: balance; }
.hu-line { margin-top: var(--hu-3); font: var(--hu-regular) var(--hu-b-l) var(--hu-font); overflow-wrap: anywhere; }
.hu-line + .hu-line { margin-top: 0; }
.hu-line--strong { font-weight: var(--hu-strong); }
.hu-fix { margin-top: var(--hu-4); }
.hu-fix b { display: block; font: var(--hu-strong) var(--hu-b-l) var(--hu-font); }
.hu-fix span { color: var(--hu-ink-2); }
.hu-next { margin-top: var(--hu-4); color: var(--hu-ink-2); }
.hu-glove { display: block; width: var(--hu-glove); height: var(--hu-glove); margin: 0 auto var(--hu-3); color: var(--hu-ink); transform-origin: 50% 100%; }
.hu-addr { margin-top: var(--hu-3); }
.hu-addr + .hu-addr { margin-top: var(--hu-2); }
.hu-addr-label { color: var(--hu-ink-2); }
.hu-addr-grid { display: grid; grid-template-columns: repeat(5, auto); justify-content: center; column-gap: 10px; color: var(--hu-ink-2); }
.hu-addr-grid span { display: flex; }
.hu-addr-grid i, .hu-addr-grid b, .hu-addr-grid span > span { display: block; width: 9px; text-align: center; font-style: normal; }
.hu-addr-grid b { color: var(--hu-ink); }
.hu-end { margin: auto; max-width: 30ch; font: var(--hu-regular) var(--hu-b-l) var(--hu-font); }
@container (max-height: 440px) {
.hu-stage { padding: var(--hu-4); }
.hu-title { margin-top: var(--hu-2); font-size: 20px; line-height: 26px; }
.hu-verdict { font-size: 20px; line-height: 26px; }
.hu-field { flex-basis: 74px; min-height: 74px; margin-top: var(--hu-3); }
.hu-got { margin-top: var(--hu-3); }
.hu-under { margin-top: var(--hu-2); }
.hu-glove { width: 64px; height: 64px; margin-bottom: var(--hu-2); }
.hu-line { margin-top: var(--hu-2); }
.hu-fix, .hu-next { margin-top: var(--hu-3); }
.hu-addr { margin-top: var(--hu-2); }
.hu-dock { padding-top: var(--hu-3); }
}
@container (max-height: 360px) {
.hu-stage { padding: var(--hu-3); }
.hu-head { white-space: normal; overflow-wrap: anywhere; }
.hu-title, .hu-verdict { font-size: 18px; line-height: 24px; }
.hu-title { margin-top: var(--hu-1); }
.hu-sub { margin-top: 0; }
.hu-field { flex-basis: 64px; min-height: 64px; margin-top: var(--hu-2); padding: 11px var(--hu-3); font-size: 14px; line-height: 20px; }
.hu-field--short { height: 44px; }
.hu-got { margin-top: var(--hu-2); column-gap: var(--hu-1); }
.hu-slot { height: 20px; font-size: 14px; line-height: 20px; }
.hu-assume { display: none; }
.hu-line, .hu-fix b, .hu-end { font-size: 14px; line-height: 20px; }
.hu-line { margin-top: var(--hu-1); }
.hu-fix, .hu-next { margin-top: var(--hu-2); }
.hu-glove { width: 44px; height: 44px; margin-bottom: var(--hu-1); }
.hu-addr { margin-top: var(--hu-1); }
.hu-addr + .hu-addr { margin-top: 2px; }
.hu-addr-grid { column-gap: 6px; font-size: 13px; line-height: 18px; }
.hu-addr-grid i, .hu-addr-grid b, .hu-addr-grid span > span { width: 8px; }
.hu-dock { padding-top: var(--hu-2); min-height: 32px; }
.hu-cuff { height: 32px; min-width: 96px; padding: 0 var(--hu-4); }
}
@container (max-height: 280px) {
.hu-stage { padding: var(--hu-2); }
.hu-head, .hu-glove, .hu-got-say, .hu-got-from, .hu-fix span, .hu-next { display: none; }
.hu-title, .hu-verdict { margin-top: 0; font-size: 15px; line-height: 20px; }
.hu-line, .hu-fix b, .hu-end, .hu-error, .hu-count { font-size: 13px; line-height: 17px; }
.hu-line { margin-top: 2px; }
.hu-fix { margin-top: var(--hu-1); }
.hu-field { flex-basis: 46px; min-height: 46px; margin-top: var(--hu-1); padding: 5px var(--hu-2); font-size: 13px; line-height: 17px; }
.hu-field--short { height: 30px; }
.hu-got { margin-top: var(--hu-1); column-gap: 2px; }
.hu-slot { height: 17px; font-size: 12px; line-height: 17px; }
.hu-under { margin-top: 2px; }
.hu-addr { margin-top: 2px; }
.hu-addr-label { font-size: 12px; line-height: 15px; }
.hu-addr-grid { column-gap: 4px; font-size: 12px; line-height: 15px; }
.hu-addr-grid i, .hu-addr-grid b, .hu-addr-grid span > span { width: 7px; }
.hu-dock { min-height: 0; padding-top: var(--hu-1); gap: var(--hu-1); }
.hu-dock:has(.hu-wait) { gap: 2px; }
.hu-cuff { height: 28px; min-width: 0; padding: 0 var(--hu-3); font-size: 13px; line-height: 16px; }
.hu-word, .hu-wait { font-size: 12px; line-height: 16px; }
.hu-word { padding: 2px 0; margin: 0; }
}
.hu-over { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; padding: var(--hu-4); background: rgba(0, 0, 0, 0.6); }
.hu-over-box { width: min(var(--hu-win-w), 100%); height: min(380px, 100%); border: var(--hu-stroke) solid var(--hu-k-3); border-radius: var(--hu-r); overflow: hidden; }
@keyframes hu-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes hu-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes hu-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes hu-side { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
@keyframes hu-up-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-6px); } }
@keyframes hu-push { from { transform: translateY(var(--hu-dy, 0)); } to { transform: none; } }
@keyframes hu-glove {
0% { opacity: 0; transform: translateY(10px) scale(1, 1); animation-timing-function: cubic-bezier(0, 0, 0.4, 1); }
12% { opacity: 1; transform: translateY(12px) scale(1.03, 0.95); animation-timing-function: cubic-bezier(0.3, 0, 0.2, 1); }
55% { opacity: 1; transform: translateY(-4px) scale(0.98, 1.04); animation-timing-function: cubic-bezier(0.3, 0, 0.4, 1); }
78% { opacity: 1; transform: translateY(1px) scale(1.015, 0.975); animation-timing-function: cubic-bezier(0, 0, 0.3, 1); }
100% { opacity: 1; transform: none; }
}
.is-opening > * { animation: hu-fade 140ms var(--hu-e) both; }
.is-entering .hu-m { animation: hu-rise var(--hu-d-4) var(--hu-e-in) both; animation-delay: calc(var(--hu-i, 0) * 40ms); }
.is-entering .hu-glove { animation: hu-glove var(--hu-d-glove) linear both; will-change: transform; }
.is-entering .hu-dock { animation: hu-fade var(--hu-d-2) var(--hu-e) both; }
.is-entering.is-next .hu-m { animation-name: hu-side; }
.is-leaving .hu-m, .is-leaving .hu-glove, .is-leaving .hu-dock { animation: hu-out var(--hu-d-1) var(--hu-e-out) both; animation-delay: 0s; }
.is-closing .hu-stage { animation: hu-up-out var(--hu-d-2) var(--hu-e-out) both; }
.hu-under > * { transition: opacity var(--hu-d-2) var(--hu-e); }
.hu-wait-count { transition: opacity var(--hu-d-3) var(--hu-e); }
.hu-slot-q { transition: opacity var(--hu-d-1) var(--hu-e-out); }
.hu-slot-v { transform: translateY(4px); transition: opacity var(--hu-d-3) var(--hu-e-in), transform var(--hu-d-3) var(--hu-e-in); }
.hu-slot.is-filled .hu-slot-v { transform: none; }
.hu-entry.is-arriving { animation: hu-rise var(--hu-d-4) var(--hu-e-in) both; }
.is-pushed { animation: hu-push var(--hu-d-4) var(--hu-e) both; }
@media (prefers-reduced-motion: reduce) {
.is-entering .hu-m, .is-entering.is-next .hu-m, .hu-entry.is-arriving { animation-name: hu-fade; animation-duration: var(--hu-d-2); animation-delay: 0s; }
.is-entering .hu-glove { animation: hu-fade var(--hu-d-2) var(--hu-e) both; will-change: auto; }
.is-leaving .hu-m, .is-leaving .hu-glove, .is-leaving .hu-dock { animation-name: hu-out; animation-duration: var(--hu-d-1); }
.is-closing .hu-stage { animation-name: hu-out; }
.is-pushed { animation: none; }
.hu-slot-v { transform: none; transition: opacity var(--hu-d-2) var(--hu-e); }
.hu-cuff { transition: none; }
.hu-cuff:not([aria-disabled="true"]):active, .hu-cuff.is-press { transform: none; }
.hu-switch input::before, .hu-switch input::after { transition: opacity var(--hu-d-2) var(--hu-e); }
}
:host[data-motion="reduced"] .is-entering .hu-m, :host[data-motion="reduced"] .is-entering.is-next .hu-m, :host[data-motion="reduced"] .hu-entry.is-arriving { animation-name: hu-fade; animation-duration: var(--hu-d-2); animation-delay: 0s; }
:host[data-motion="reduced"] .is-entering .hu-glove { animation: hu-fade var(--hu-d-2) var(--hu-e) both; will-change: auto; }
:host[data-motion="reduced"] .is-leaving .hu-m, :host[data-motion="reduced"] .is-leaving .hu-glove, :host[data-motion="reduced"] .is-leaving .hu-dock { animation-name: hu-out; animation-duration: var(--hu-d-1); }
:host[data-motion="reduced"] .is-closing .hu-stage { animation-name: hu-out; }
:host[data-motion="reduced"] .is-pushed { animation: none; }
:host[data-motion="reduced"] .hu-slot-v { transform: none; transition: opacity var(--hu-d-2) var(--hu-e); }
:host[data-motion="reduced"] .hu-cuff { transition: none; }
:host[data-motion="reduced"] .hu-cuff:not([aria-disabled="true"]):active, :host[data-motion="reduced"] .hu-cuff.is-press { transform: none; }
:host[data-motion="reduced"] .hu-switch input::before, :host[data-motion="reduced"] .hu-switch input::after { transition: opacity var(--hu-d-2) var(--hu-e); }
`/*@END_SHEET@*/;
  const FALLBACK = { headline: 'Je n’ai pas pu vérifier cette demande.', where: 'Affiché dans la page, parce que la fenêtre Hold up n’a pas pu s’ouvrir.', cancel: 'Annuler', go: 'Continuer', ready: 'Tu peux continuer.' };
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k of Object.keys(attrs)) { if (k === 'class') e.className = attrs[k]; else if (k === 'text') e.textContent = attrs[k]; else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]); }
    for (const c of kids) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    return e;
  }
  // "24" + " s" ; beyond a minute : "2 min 05" + " s" (the same count as the window)
  function countOf(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60), r = s % 60;
    return m ? m + ' min ' + (r < 10 ? '0' : '') + r : String(r);
  }

  function mountOverlay() {
    const host = document.createElement('div');
    host.setAttribute('data-sentinelle', '');
    const root = host.attachShadow({ mode: 'closed' });
    try { const sh = new CSSStyleSheet(); sh.replaceSync(CSS); root.adoptedStyleSheets = [sh]; } catch (_) { const st = document.createElement('style'); st.textContent = CSS; root.append(st); }
    const ov = h('div', { class: 'hu-over' });
    root.append(ov);
    // The host lives in the page's DOM : its style is forced inline (inline !important beats any page rule) and put back if changed.
    host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;display:block!important;visibility:visible!important;opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important;pointer-events:auto!important';
    const wantStyle = host.style.cssText;
    const attach = () => (document.documentElement || document).append(host);
    attach();
    let rearm = 0;
    const mo = new MutationObserver(() => {
      if ((!host.isConnected || host.parentNode !== document.documentElement) && rearm++ < 100) attach();
      if (host.style.cssText !== wantStyle) host.style.cssText = wantStyle;
      for (const a of ['hidden', 'inert', 'class', 'popover']) if (host.hasAttribute(a)) host.removeAttribute(a);
    });
    mo.observe(document, { childList: true, subtree: true });
    mo.observe(host, { attributes: true });
    ov.addEventListener('keydown', (e) => e.stopPropagation(), true);
    ov.addEventListener('keyup', (e) => e.stopPropagation(), true);
    return { host, root, ov, close() { mo.disconnect(); host.remove(); } };
  }

  // screen : { headline, line, show, leftMs } as the worker gives it for the window (view.screen). The worker checks the deadline on its own clock.
  function showAnswer(screen, reg) {
    return new Promise((resolve) => {
      const m = mountOverlay();
      const t0 = performance.now();
      const needMs = Math.max(0, Number(screen.leftMs) || 0);
      const win = h('div', { class: 'hu hu-k hu-win is-opening is-entering', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'h', 'aria-describedby': 'd', 'data-state': 'answer', 'data-outcome': 'unverifiable' });
      const line = typeof screen.show === 'string' && screen.show ? screen.show : typeof screen.line === 'string' ? screen.line : '';
      const mid = h('div', { class: 'hu-mid' }, h('h1', { class: 'hu-verdict hu-m', id: 'h', tabindex: '-1', text: typeof screen.headline === 'string' && screen.headline ? screen.headline : FALLBACK.headline }));
      if (line) mid.append(h('p', { class: 'hu-line hu-m', id: 'd', style: '--hu-i:1', text: line }));
      mid.append(h('p', { class: 'hu-next hu-m', style: '--hu-i:2', text: FALLBACK.where }));
      const num = h('span', { class: 'hu-num', text: countOf(needMs) });
      const count = h('span', { class: 'hu-wait-count', 'aria-hidden': 'true' }, 'dans ', num, ' s');
      const status = h('span', { class: 'hu-sr', role: 'status' });
      // the other gesture first (left), the advised one last (right) : Annuler is the full button
      const go = h('button', { class: 'hu-word', type: 'button', id: 'go', text: FALLBACK.go });
      const cancel = h('button', { class: 'hu-cuff', type: 'button', id: 'cancel', text: FALLBACK.cancel });
      const dock = h('div', { class: 'hu-dock' }, h('p', { class: 'hu-wait' }, go, needMs > 0 ? count : null), cancel);
      win.append(h('div', { class: 'hu-stage' }, mid, dock, status));
      m.ov.append(h('div', { class: 'hu-over-box' }, win));
      const locked = () => (needMs > 0 && performance.now() - t0 < needMs) || performance.now() - t0 < 600;
      const setGo = (open) => { if (open) go.removeAttribute('aria-disabled'); else go.setAttribute('aria-disabled', 'true'); };
      setGo(!locked());
      let done = false;
      const fin = (decision) => {
        if (done) return; done = true; clearInterval(iv);
        m.close();
        resolve({ decision, time_to_decision_ms: Math.round(performance.now() - t0) });
      };
      reg.abort = () => fin('aborted');
      const iv = setInterval(() => {
        const left = Math.max(0, needMs - (performance.now() - t0)), open = !locked();
        num.textContent = countOf(left);
        if (open && go.getAttribute('aria-disabled') === 'true') { setGo(true); if (needMs > 0) { win.classList.add('is-ready'); status.textContent = FALLBACK.ready; } }
      }, 250);
      cancel.addEventListener('click', () => fin('cancel'));
      // "Continuer" only takes a real gesture (isTrusted), and not in the first 600 ms : a key or a click already on its way when the panel appears is not a consent.
      go.addEventListener('click', (e) => { if (locked() || go.getAttribute('aria-disabled') === 'true' || !e.isTrusted || performance.now() - t0 < 600) return; fin('confirm'); });
      m.ov.addEventListener('keydown', (e) => { if (e.key === 'Escape') fin('cancel'); });
      cancel.focus(); // never an initial focus on "Continuer"
    });
  }

  // One panel per request, redrawn when the worker moves to another screen (seq). A stage this panel does not draw is cancelled.
  function overlayShow(rid, view) {
    const w = waits.get(rid); if (!w) return;
    if (w.overlay && w.overlay.seq === view.seq) return;
    if (w.overlay) w.overlay.abort();
    const reg = { seq: view.seq, abort() {} };
    w.overlay = reg;
    const drawable = view.stage === 'verdict' && view.screen && view.screen.kind === 'answer';
    const p = drawable ? showAnswer(view.screen, reg) : Promise.resolve({ decision: 'cancel', time_to_decision_ms: 0 });
    p.then((r) => {
      if (!waits.has(rid) || w.overlay !== reg || r.decision === 'aborted') return;
      const msg = { type: 'hu.decision', rid, seq: view.seq, ttd: r.time_to_decision_ms };
      // The delay is the friction of this surface, as in the window : no sentence is retyped here.
      if (r.decision === 'confirm') Object.assign(msg, { decision: 'continue', phraseOk: true });
      else msg.decision = 'cancel';
      const post = (tries) => send(msg).then((a) => {
        if (!waits.has(rid)) return;
        if (a && a.view) { w.overlay = null; overlayShow(rid, a.view); }
        else if (a && a.status === 'ignored') w.overlay = null; // stale screen : the next poll redraws the current one
        poll(rid);
      }, () => { if (msg.decision === 'cancel' && tries < 20) setTimeout(() => post(tries + 1), 250); else { w.overlay = null; poll(rid); } });
      post(0);
    });
  }

  // ================= neutral banner (top frame) : nothing security-relevant is drawn in the page =================
  let banner = null, bannerTimer = null;
  function bannerSet(on) {
    if (on && !banner) {
      const host = document.createElement('div');
      const root = host.attachShadow({ mode: 'closed' });
      host.style.cssText = 'all:initial!important;position:fixed!important;top:12px!important;left:0!important;right:0!important;z-index:2147483647!important;display:flex!important;justify-content:center!important;pointer-events:none!important';
      const box = document.createElement('div');
      box.setAttribute('role', 'status');
      box.style.cssText = 'max-width:calc(100% - 24px);padding:12px 20px;border-radius:6px;background:#000;color:#fff;border:1px solid #808080;font:400 14px/20px "Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Roboto,sans-serif;text-align:center;pointer-events:none;user-select:none';
      box.textContent = 'J’ai retenu cette demande : regarde la fenêtre Hold up.';
      root.append(box);
      (document.documentElement || document).append(host);
      banner = host;
    } else if (!on && banner) { banner.remove(); banner = null; }
  }
  function bannerCheck() {
    clearTimeout(bannerTimer);
    send({ type: 'hu.banner?' }).then((r) => {
      const n = !!(r && r.n > 0);
      bannerSet(n);
      if (n) { if (!banner.isConnected) (document.documentElement || document).append(banner); bannerTimer = setTimeout(bannerCheck, 3000); }
    }, () => bannerSet(false));
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg) return false;
    if (msg.type === 'hu.rpc') return relayRead(msg, sendResponse);
    if (msg.type === 'hu.revoke.run') return relayRevoke(msg, sendResponse);
    if (msg.type === 'hu.result' && waits.has(msg.rid)) poll(msg.rid);           // the decision is ready : fetch it now
    else if (msg.type === 'hu.banner' && window === window.top) bannerCheck();
    return false;
  });
})();

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
  // The bare minimum, sober : the SAME sentences as the window (they come from the worker : view.screen), black and white, no icon,
  // no colour band, no card. It never asks anything and never shows a sentence the person did not write : nobody could be asked,
  // so the answer is "Je n'ai pas pu vérifier cette demande", with its delay. Annuler is always there.
  const CSS = `
:host{all:initial}
*{box-sizing:border-box}
.ov{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;
 --bg:#fff;--ink:#171717;--ink2:#5c5c5c;--edge:#8c8c8c;--line:#e5e5e5;
 font-family:"Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Roboto,sans-serif;font-size:16px;line-height:1.5;color:var(--ink)}
@media (prefers-color-scheme:dark){.ov{--bg:#131313;--ink:#ededed;--ink2:#a3a3a3;--edge:#7a7a7a;--line:#2b2b2b;color-scheme:dark}}
.win{width:420px;max-width:100%;max-height:100%;overflow:auto;background:var(--bg);border:1px solid var(--ink);padding:32px 28px 24px;text-align:center}
h1{margin:0;font-size:22px;line-height:1.25;font-weight:400}
p{margin:16px 0 0;overflow-wrap:anywhere}
.quiet{font-size:13px;line-height:1.4;color:var(--ink2)}
.wait{min-height:20px;margin:24px 0 12px;font-size:14px;line-height:20px;color:var(--ink2);font-variant-numeric:tabular-nums}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
button{min-height:40px;padding:0 16px;font:inherit;font-size:15px;font-weight:500;color:var(--ink);background:transparent;border:1px solid var(--edge);border-radius:8px;cursor:pointer}
button.main{color:var(--bg);background:var(--ink);border-color:var(--ink)}
button[disabled]{cursor:default;color:var(--ink2);border-color:var(--line);background:transparent}
button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
`;
  const FALLBACK = { headline: 'Je n’ai pas pu vérifier cette demande.', where: 'Affiché dans la page, parce que la fenêtre Hold up n’a pas pu s’ouvrir.', cancel: 'Annuler', go: 'Continuer', ready: 'Tu peux continuer.' };
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k of Object.keys(attrs)) { if (k === 'class') e.className = attrs[k]; else if (k === 'text') e.textContent = attrs[k]; else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]); }
    for (const c of kids) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    return e;
  }
  function waitText(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000)); if (s <= 0) return '';
    const m = Math.floor(s / 60), r = s % 60;
    return 'Continuer sera possible dans ' + (m ? m + ' min' + (r ? ' ' + r + ' s' : '') : r + ' s') + '.';
  }

  function mountOverlay() {
    const host = document.createElement('div');
    host.setAttribute('data-sentinelle', '');
    const root = host.attachShadow({ mode: 'closed' });
    try { const sh = new CSSStyleSheet(); sh.replaceSync(CSS); root.adoptedStyleSheets = [sh]; } catch (_) { const st = document.createElement('style'); st.textContent = CSS; root.append(st); }
    const ov = h('div', { class: 'ov' });
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

  // screen : { headline, line, leftMs } as the worker gives it for the window (view.screen). The worker checks the deadline on its own clock.
  function showAnswer(screen, reg) {
    return new Promise((resolve) => {
      const m = mountOverlay();
      const t0 = performance.now();
      const needMs = Math.max(0, Number(screen.leftMs) || 0);
      const win = h('div', { class: 'win', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'h', 'aria-describedby': 'd' });
      win.append(h('h1', { id: 'h', text: typeof screen.headline === 'string' && screen.headline ? screen.headline : FALLBACK.headline }));
      if (typeof screen.line === 'string' && screen.line) win.append(h('p', { id: 'd', text: screen.line }));
      win.append(h('p', { class: 'quiet', text: FALLBACK.where }));
      const wait = h('p', { class: 'wait', text: waitText(needMs) });
      const status = h('span', { class: 'vh', role: 'status' });
      const cancel = h('button', { class: 'main', type: 'button', id: 'cancel', text: FALLBACK.cancel });
      const go = h('button', { type: 'button', id: 'go', text: FALLBACK.go });
      win.append(wait, h('div', { class: 'row' }, cancel, go), status);
      m.ov.append(win);
      const locked = () => needMs > 0 && performance.now() - t0 < needMs;
      go.disabled = locked();
      let done = false;
      const fin = (decision) => {
        if (done) return; done = true; clearInterval(iv);
        m.close();
        resolve({ decision, time_to_decision_ms: Math.round(performance.now() - t0) });
      };
      reg.abort = () => fin('aborted');
      const iv = setInterval(() => {
        const left = Math.max(0, needMs - (performance.now() - t0)), open = left <= 0;
        wait.textContent = open ? (needMs > 0 ? FALLBACK.ready : '') : waitText(left);
        if (open && go.disabled) { go.disabled = false; status.textContent = FALLBACK.ready; }
      }, 250);
      cancel.addEventListener('click', () => fin('cancel'));
      // "Continuer" only takes a real gesture (isTrusted), and not in the first 600 ms : a key or a click already on its way when the panel appears is not a consent.
      go.addEventListener('click', (e) => { if (go.disabled || !e.isTrusted || performance.now() - t0 < 600) return; fin('confirm'); });
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
      box.style.cssText = 'max-width:calc(100% - 24px);padding:12px 20px;border-radius:50px;background:#000;color:#fff;border:1px solid #767676;font:500 16px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.25);pointer-events:none;user-select:none';
      box.textContent = 'Hold up a retenu cette demande : regarde la fenêtre Hold up.';
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

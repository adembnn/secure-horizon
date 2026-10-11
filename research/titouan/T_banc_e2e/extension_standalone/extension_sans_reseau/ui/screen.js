/* Hold up - draws the window's moments inside a .hu element. Classic script, no dependency, no network, no innerHTML.
 *   HoldupScreen.mount(root, { onSubmit(text), onCancel(via), onContinue(auto), onClose() }) -> { show(screen, key), end(text, opts), state() }
 * `screen` comes from the service worker (gatekeeper.js viewOf -> view.screen) :
 *   { kind: 'question', title, placeholder }
 *   { kind: 'answer', outcome: 'match' | 'mismatch' | 'unverifiable', headline, line, addresses, labels, leftMs, noModel, model, autoMs, step, network }
 *   autoMs (only with 'match' and no delay) : no "Continuer", onContinue(true) is called by itself after that time.
 *   end(text, { line, wait }) : the last message. `wait` : the window stays for the next request of the same operation ("Fermer").
 * The worker stays the judge : this file only disables "Continuer" while the delay runs, the worker refuses it anyway.
 *
 * Timing rules (TIMING) :
 *   - a state that was drawn stays at least `min` ms before the next one replaces it (no flash) ;
 *   - the loading state ("Vérification…") is drawn only when the answer takes longer than `loadingAfter` ms ;
 * Hooks for the motion to come (no animation is written here) : the container carries
 *   data-state = question | checking | answer | end | waiting      the moment on screen
 *   .is-entering                                                   set when a moment is drawn (its nodes are new : a CSS animation starts there)
 *   .is-leaving                                                    set `leave` ms before a drawn moment is replaced
 *   .is-verdict-change                                             an answer replaces another answer with a different outcome
 *   data-outcome, data-from-outcome                                the verdict on screen, and the one it replaces */
(function (global) {
  'use strict';
  var T = { cancel: 'Annuler', check: 'Vérifier', checking: 'Vérification…', go: 'Continuer', close: 'Fermer', comparing: 'Je compare ta phrase à la demande.',
    empty: 'Écris d’abord ce que tu veux faire.', noModel: 'intention classée sans modèle', byModel: { clef: 'intention classée par Clef', jev: 'intention classée par Jev' },
    first: function (t) { return 'Tu as écrit : « ' + t + ' »'; },
    long: function (n, max) { return 'Ta phrase fait ' + n + ' signes. Le maximum est ' + max + ' : raccourcis-la, je ne vérifie pas une phrase coupée.'; },
    left: function (n) { return n === 0 ? 'Tu es à la limite de longueur.' : 'Il reste ' + n + (n === 1 ? ' signe.' : ' signes.'); },
    ready: 'Tu peux continuer.', network: 'Réseau : ', step: function (n) { return 'Demande n° ' + n + ' de la même opération.'; } };
  // guard : a key or a click already on its way when an answer appears is not a consent (the worker refuses it during its first 600 ms) ;
  // "Continuer" is therefore visibly inactive that long, never a press swallowed in silence.
  var TIMING = { min: 400, loadingAfter: 150, leave: 80, guard: 700 };

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  // "Continuer sera possible dans 24 s." : one quiet line, no clock face.
  function waitLine(leftMs) {
    var s = Math.max(0, Math.ceil(leftMs / 1000)); if (s <= 0) return '';
    var m = Math.floor(s / 60), r = s % 60;
    return 'Continuer sera possible dans ' + (m ? m + ' min' + (r ? ' ' + r + ' s' : '') : r + ' s') + '.';
  }
  function addressBlock(label, groups, full) {
    var box = el('div', 'hu-addr');
    box.appendChild(el('p', 'hu-addr-label', label));
    var grid = el('p', 'hu-addr-grid'); grid.setAttribute('aria-hidden', 'true');
    groups.forEach(function (g) { var span = el('span'); g.forEach(function (c) { span.appendChild(el(c.diff ? 'b' : 'span', '', c.c)); }); grid.appendChild(span); });
    box.appendChild(grid);
    box.appendChild(el('span', 'hu-sr', full));
    return box;
  }

  function mount(root, on) {
    var timer = null, current = null, busy = false;
    var drawnAt = 0, queued = null, swapTimer = null, leaveTimer = null, loadTimer = null, lastOutcome = null;
    root.classList.add('hu');
    function flag(name, yes) { try { if (yes) root.classList.add(name); else if (root.classList.remove) root.classList.remove(name); } catch (_) {} }
    function stamp(state) { drawnAt = Date.now(); root.setAttribute('data-state', state); }
    function stop() { if (timer) { clearInterval(timer); clearTimeout(timer); timer = null; } if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; } }
    function clear() { stop(); while (root.firstChild) root.removeChild(root.firstChild); root.removeAttribute('data-outcome'); root.removeAttribute('data-addresses'); busy = false; }
    function button(label, primary) { var b = el('button', 'hu-btn' + (primary ? ' is-primary' : ''), label); b.type = 'button'; return b; }
    function enabled(b) { return b.getAttribute('aria-disabled') !== 'true'; }
    function setEnabled(b, yes) { if (yes) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true'); }
    function frame() {
      var main = el('main', 'hu-main'), col = el('div', 'hu-col'), dock = el('div', 'hu-dock'), wait = el('p', 'hu-wait'), actions = el('div', 'hu-actions');
      main.appendChild(col); dock.appendChild(wait); dock.appendChild(actions);
      root.appendChild(main); root.appendChild(dock);
      return { col: col, wait: wait, actions: actions };
    }
    function cancelButton(primary) { var b = button(T.cancel, primary); b.addEventListener('click', function () { on.onCancel('button'); }); return b; }

    function question(s) {
      var f = frame();
      var title = el('h1', 'hu-title', s.title); title.id = 'hu-q';
      // No maxLength : a pasted text would be cut without a word. The limit is said before it is reached, and a longer sentence is not sent.
      var max = s.max > 0 ? s.max : 500;
      var field = el('textarea', 'hu-field'); field.rows = 3; field.placeholder = s.placeholder || ''; field.setAttribute('aria-labelledby', 'hu-q');
      field.spellcheck = false; field.autocapitalize = 'off';
      var status = el('p', 'hu-quiet'); status.setAttribute('role', 'status'); status.hidden = true;
      var error = el('p', 'hu-error'); error.setAttribute('role', 'alert'); error.hidden = true;
      f.col.appendChild(title);
      if (s.first) f.col.appendChild(el('p', 'hu-quiet hu-first', T.first(s.first))); // the follow-up question recalls the first sentence
      var count = el('p', 'hu-quiet hu-count'); count.setAttribute('role', 'status'); count.hidden = true;
      f.col.appendChild(field); f.col.appendChild(error); f.col.appendChild(count); f.col.appendChild(status);
      var cancel = cancelButton(false), go = button(T.check, true);
      setEnabled(go, false);
      f.actions.appendChild(cancel); f.actions.appendChild(go);
      // The loading state is drawn only if the answer is slow ; once drawn it counts as a state of its own (it stays `min` ms).
      function loading() { loadTimer = null; if (!busy) return; go.textContent = T.checking; status.textContent = T.comparing; status.hidden = false; stamp('checking'); }
      function lock(now) {
        busy = true; field.readOnly = true; setEnabled(go, false);
        if (loadTimer) clearTimeout(loadTimer);
        if (now) loading(); else loadTimer = setTimeout(loading, TIMING.loadingAfter);
      }
      function submit() {
        var text = field.value.replace(/\s+/g, ' ').trim();
        if (busy) return;
        if (!text) { field.setAttribute('aria-invalid', 'true'); field.classList.add('is-error'); error.textContent = T.empty; error.hidden = false; field.focus(); return; }
        if (text.length > max) { field.setAttribute('aria-invalid', 'true'); field.classList.add('is-error'); error.textContent = T.long(text.length, max); error.hidden = false; count.hidden = true; field.focus(); return; }
        lock(false); on.onSubmit(text);
      }
      field.addEventListener('input', function () {
        field.removeAttribute('aria-invalid'); if (field.classList.remove) field.classList.remove('is-error'); error.hidden = true;
        if (!busy) setEnabled(go, !!field.value.trim());
        var n = field.value.replace(/\s+/g, ' ').trim().length;
        if (n > max) { error.textContent = T.long(n, max); error.hidden = false; count.hidden = true; }
        else if (n >= max - 60) { count.textContent = T.left(max - n); count.hidden = false; } else count.hidden = true;
      });
      field.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
      go.addEventListener('click', submit);
      stamp('question');
      if (s.checking) lock(true);
      try { field.focus({ preventScroll: true }); } catch (_) {}
      current.unlock = function () { if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; } busy = false; field.readOnly = false; go.textContent = T.check; status.hidden = true; setEnabled(go, !!field.value.trim()); root.setAttribute('data-state', 'question'); };
    }

    function answer(s) {
      var f = frame();
      root.setAttribute('data-outcome', s.outcome);
      if (lastOutcome) root.setAttribute('data-from-outcome', lastOutcome); else root.removeAttribute('data-from-outcome');
      flag('is-verdict-change', !!lastOutcome && lastOutcome !== s.outcome);
      lastOutcome = s.outcome;
      if (s.addresses) root.setAttribute('data-addresses', '');
      var title = el('h1', 'hu-title', s.headline); title.tabIndex = -1;
      f.col.appendChild(title);
      f.col.appendChild(el('p', 'hu-line', s.line));
      if (s.fix) f.col.appendChild(el('p', 'hu-line hu-fix', s.fix));
      if (s.addresses) {
        f.col.appendChild(addressBlock(s.labels.expected, s.addresses.expected, s.addresses.expectedFull));
        f.col.appendChild(addressBlock(s.labels.actual, s.addresses.actual, s.addresses.actualFull));
      }
      // small print : the network of the request, which request of the operation this is, how the sentence was classified
      var notes = [];
      if (s.step > 1) notes.push(T.step(s.step));
      if (s.network) notes.push(T.network + s.network + '.');
      if (s.noModel) notes.push(T.noModel); else if (s.model && T.byModel[s.model]) notes.push(T.byModel[s.model]);
      if (notes.length) { var box = el('div', 'hu-notes'); notes.forEach(function (t) { box.appendChild(el('p', 'hu-note', t)); }); f.col.appendChild(box); }
      var live = el('span', 'hu-sr'); live.setAttribute('role', 'status'); f.col.appendChild(live);
      stamp('answer');
      var match = s.outcome === 'match';
      if (match && s.autoMs > 0) {
        // It matches : the sentence stays about a second, then the request goes to the wallet by itself. No "Continuer" ; Annuler stays.
        f.actions.appendChild(cancelButton(false));
        var arm = function (ms) { if (timer) clearTimeout(timer); timer = setTimeout(function () { timer = null; if (!busy) { busy = true; on.onContinue(true); } }, ms); };
        arm(s.autoMs);
        try { title.focus({ preventScroll: true }); } catch (_) {}
        current.sync = function () { busy = false; arm(300); }; // the worker said "not yet" : asked again shortly
        return;
      }
      var cancel = cancelButton(!match), go = button(T.go, match);
      f.actions.appendChild(cancel); f.actions.appendChild(go);
      var until = Date.now() + Math.max(TIMING.guard, s.leftMs || 0), waited = (s.leftMs || 0) > 0;
      function tick(first) {
        var left = until - Date.now(), open = left <= 0;
        f.wait.textContent = open ? (waited ? T.ready : '') : waited ? waitLine(left) : ''; // the end of the delay is written, not only announced
        if (open !== enabled(go)) { setEnabled(go, open); if (open && first !== true) live.textContent = T.ready; }
        if (open && timer) { clearInterval(timer); timer = null; }
      }
      setEnabled(go, false); tick(true);
      if (until > Date.now()) timer = setInterval(tick, 250);
      go.addEventListener('click', function () { if (busy || !enabled(go)) return; busy = true; on.onContinue(false); });
      try { (match && enabled(go) ? go : cancel).focus({ preventScroll: true }); } catch (_) {}
      current.sync = function (leftMs) { until = Math.max(until, Date.now() + Math.max(0, leftMs || 0)); if (leftMs > 0) waited = true; busy = false; if (!timer && until > Date.now()) timer = setInterval(tick, 250); tick(true); };
    }

    // The last message of a request. `wait` : the operation is not over, the window stays and says so ; "Fermer" closes it.
    function last(e) {
      if (e.wait) {
        var f = frame();
        var p = el('p', 'hu-end', e.text); p.setAttribute('role', 'status'); f.col.appendChild(p);
        if (e.line) f.col.appendChild(el('p', 'hu-line hu-fix', e.line));
        if (e.waitText) f.col.appendChild(el('p', 'hu-quiet', e.waitText));
        var close = button(T.close, false); close.addEventListener('click', function () { if (on.onClose) on.onClose(); });
        f.actions.appendChild(close);
        stamp('waiting');
        return;
      }
      var q = el('p', 'hu-end', e.text); q.setAttribute('role', 'status'); root.appendChild(q);
      stamp('end');
    }

    function draw(item) {
      queued = null; swapTimer = null;
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
      clear(); flag('is-leaving', false); flag('is-entering', true);
      if (item.end) { current = { kind: item.end.wait ? 'waiting' : 'end', key: null }; flag('is-verdict-change', false); last(item.end); return; }
      current = { kind: item.s.kind, key: item.key, sync: null, unlock: null };
      if (item.s.kind === 'question') { flag('is-verdict-change', false); question(item.s); } else answer(item.s);
    }
    // Draws now when nothing is on screen or the current state had its time ; otherwise when it has. The newest request wins.
    function schedule(item) {
      queued = item;
      if (swapTimer) { clearTimeout(swapTimer); swapTimer = null; }
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
      var left = current ? TIMING.min - (Date.now() - drawnAt) : 0;
      if (left <= 0) return draw(item);
      if (left > TIMING.leave) leaveTimer = setTimeout(function () { leaveTimer = null; flag('is-leaving', true); }, left - TIMING.leave); else flag('is-leaving', true);
      swapTimer = setTimeout(function () { draw(queued); }, left);
    }

    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !current) return;
      if (current.kind === 'waiting') { e.preventDefault(); if (on.onClose) on.onClose(); }
      else if (current.kind !== 'end') { e.preventDefault(); on.onCancel('escape'); }
    });
    return {
      // `key` identifies the screen (the request's screen number) : the same key only re-syncs, it never redraws or moves the focus.
      show: function (s, key) {
        if (!s || (s.kind !== 'question' && s.kind !== 'answer')) return false;
        var shown = queued && !queued.end ? queued : !queued && current && current.key != null ? { s: { kind: current.kind }, key: current.key } : null;
        if (shown && shown.key === key && shown.s.kind === s.kind) {
          if (queued) { queued = { s: s, key: key }; return true; }
          if (s.kind === 'answer' && current.sync) current.sync(s.leftMs);
          if (s.kind === 'question' && current.unlock) current.unlock();
          return true;
        }
        schedule({ s: s, key: key });
        return true;
      },
      // -> ms until this message is on screen (0 : it is now) : the caller counts its own display time from there
      end: function (text, opts) {
        var o = opts || {};
        var left = current ? Math.max(0, TIMING.min - (Date.now() - drawnAt)) : 0;
        schedule({ end: { text: text, line: o.line || null, wait: o.wait === true, waitText: o.waitText || null } });
        return left;
      },
      state: function () { return current ? current.kind : null; }
    };
  }
  global.HoldupScreen = { mount: mount, waitLine: waitLine, TIMING: TIMING };
})(typeof window !== 'undefined' ? window : globalThis);

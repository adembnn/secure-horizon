/* Hold up - draws the window's two moments inside a .hu element. Classic script, no dependency, no network, no innerHTML.
 *   HoldupScreen.mount(root, { onSubmit(text), onCancel(via), onContinue() }) -> { show(screen, key), end(text) }
 * `screen` comes from the service worker (gatekeeper.js viewOf -> view.screen) :
 *   { kind: 'question', title, placeholder }
 *   { kind: 'answer', outcome: 'match' | 'mismatch' | 'unverifiable', headline, line, addresses, labels, leftMs, noModel }
 * The worker stays the judge : this file only disables "Continuer" while the delay runs, the worker refuses it anyway. */
(function (global) {
  'use strict';
  var T = { cancel: 'Annuler', check: 'Vérifier', checking: 'Vérification…', go: 'Continuer', comparing: 'Je compare ta phrase à la demande.',
    noModel: 'intention classée sans modèle', ready: 'Tu peux continuer.' };

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
    root.classList.add('hu');
    function clear() { if (timer) { clearInterval(timer); timer = null; } while (root.firstChild) root.removeChild(root.firstChild); root.removeAttribute('data-outcome'); busy = false; }
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
      var field = el('textarea', 'hu-field'); field.rows = 3; field.maxLength = 500; field.placeholder = s.placeholder || ''; field.setAttribute('aria-labelledby', 'hu-q');
      field.spellcheck = false; field.autocapitalize = 'off';
      var status = el('p', 'hu-quiet'); status.setAttribute('role', 'status'); status.hidden = true;
      f.col.appendChild(title); f.col.appendChild(field); f.col.appendChild(status);
      var cancel = cancelButton(false), go = button(T.check, true);
      setEnabled(go, false);
      f.actions.appendChild(cancel); f.actions.appendChild(go);
      function lock() { busy = true; field.readOnly = true; setEnabled(go, false); go.textContent = T.checking; status.textContent = T.comparing; status.hidden = false; }
      function submit() {
        var text = field.value.replace(/\s+/g, ' ').trim();
        if (busy) return;
        if (!text) { field.focus(); return; }
        lock(); on.onSubmit(text);
      }
      field.addEventListener('input', function () { if (!busy) setEnabled(go, !!field.value.trim()); });
      field.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
      go.addEventListener('click', submit);
      if (typeof s.value === 'string') { field.value = s.value; setEnabled(go, !!s.value.trim()); }
      if (s.checking) lock();
      try { field.focus({ preventScroll: true }); } catch (_) {}
      current.unlock = function () { busy = false; field.readOnly = false; go.textContent = T.check; status.hidden = true; setEnabled(go, !!field.value.trim()); };
    }

    function answer(s) {
      var f = frame();
      root.setAttribute('data-outcome', s.outcome);
      var title = el('h1', 'hu-title', s.headline); title.tabIndex = -1;
      f.col.appendChild(title);
      f.col.appendChild(el('p', 'hu-line', s.line));
      if (s.addresses) {
        f.col.appendChild(addressBlock(s.labels.expected, s.addresses.expected, s.addresses.expectedFull));
        f.col.appendChild(addressBlock(s.labels.actual, s.addresses.actual, s.addresses.actualFull));
      }
      if (s.noModel) f.col.appendChild(el('p', 'hu-note', T.noModel));
      var live = el('span', 'hu-sr'); live.setAttribute('role', 'status'); f.col.appendChild(live);
      var match = s.outcome === 'match';
      var cancel = cancelButton(!match), go = button(T.go, match);
      f.actions.appendChild(cancel); f.actions.appendChild(go);
      var until = Date.now() + Math.max(0, s.leftMs || 0);
      function tick(first) {
        var left = until - Date.now(), open = left <= 0;
        f.wait.textContent = waitLine(left);
        if (open !== enabled(go)) { setEnabled(go, open); if (open && first !== true) live.textContent = T.ready; }
        if (open && timer) { clearInterval(timer); timer = null; }
      }
      setEnabled(go, false); tick(true);
      if (until > Date.now()) timer = setInterval(tick, 250);
      go.addEventListener('click', function () { if (busy || !enabled(go)) return; busy = true; on.onContinue(); });
      try { (match && enabled(go) ? go : cancel).focus({ preventScroll: true }); } catch (_) {}
      current.sync = function (leftMs) { until = Date.now() + Math.max(0, leftMs || 0); busy = false; if (!timer && leftMs > 0) timer = setInterval(tick, 250); tick(true); };
    }

    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && current && current.kind !== 'end') { e.preventDefault(); on.onCancel('escape'); } });
    return {
      // `key` identifies the screen (the request's screen number) : the same key only re-syncs, it never redraws or moves the focus.
      show: function (s, key) {
        if (!s || (s.kind !== 'question' && s.kind !== 'answer')) return false;
        if (current && current.key === key && current.kind === s.kind) {
          if (s.kind === 'answer' && current.sync) current.sync(s.leftMs);
          if (s.kind === 'question' && current.unlock) current.unlock();
          return true;
        }
        clear(); current = { kind: s.kind, key: key, sync: null, unlock: null };
        if (s.kind === 'question') question(s); else answer(s);
        return true;
      },
      end: function (text) { clear(); current = { kind: 'end' }; var p = el('p', 'hu-end', text); p.setAttribute('role', 'status'); root.appendChild(p); }
    };
  }
  global.HoldupScreen = { mount: mount, waitLine: waitLine };
})(typeof window !== 'undefined' ? window : globalThis);

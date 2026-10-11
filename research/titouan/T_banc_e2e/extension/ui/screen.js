/* Hold up - draws the window's moments inside a .hu element. Classic script, no dependency, no network, no innerHTML.
 * Design : docs/design/system (DESIGN.md, MOTION.md, INTEGRATION.md). Sheets : ui/tokens.css, ui/components.css, ui/motion.css.
 *   HoldupScreen.mount(root, { onSubmit(text), onCancel(via), onContinue(auto), onLimit(), onRetry(), onClose() }) -> { show(screen, key), end(text, opts), state() }
 * `screen` comes from the service worker (gatekeeper.js viewOf -> view.screen) :
 *   { kind: 'question', site, title, placeholder, max, first, missing, missingLabel, account }
 *   { kind: 'answer', outcome: 'match' | 'mismatch' | 'unverifiable', site, headline, line, said, does, fix, fixWhy, addresses, labels,
 *     leftMs, autoMs, step, stepTotal, limit: { label }, retry }
 *   autoMs (only with 'match' and no delay) : no gesture to send, onContinue(true) is called by itself after that time.
 *   limit (only with 'mismatch') : the request gives a wider permission than what was written and it can be brought back to it.
 *     Two gestures : "Limiter à 50 USDC et envoyer" (full button, active at once) and "Ne rien envoyer". No "Envoyer quand même".
 *   end(text, { line, wait, waitText, stay, site }) : the last message. `wait` : the window stays for the next request of the
 *     same operation ("Fermer"). `stay` : the request expired, the window stays so that the person reads it when they come back.
 * The worker stays the judge : this file only disables "Envoyer quand même" while the delay runs, the worker refuses it anyway.
 *
 * Timing rules (TIMING) :
 *   - a state that was drawn stays at least `min` ms before the next one replaces it (no flash) ;
 *   - the loading state ("Je compare…") is drawn only when the answer takes longer than `loadingAfter` ms.
 * States set on the container (motion.css reads them, nothing is animated from here) :
 *   data-state = question | checking | answer | end | waiting      the moment on screen
 *   .is-opening                                                    the surface was just mounted
 *   .is-entering                                                   set when a moment is drawn (its nodes are new : a CSS animation starts there)
 *   .is-leaving                                                    set `leave` ms before a drawn moment is replaced
 *   .is-next                                                       with .is-entering : the next request of the same operation
 *   .is-ready                                                      the delay is over
 *   .is-verdict-change, data-outcome, data-from-outcome            the verdict on screen, and the one it replaces (no animation of their own) */
(function (global) {
  'use strict';
  var NB = ' ', NNB = ' ';
  var T = { cancel: 'Annuler', stop: 'Annuler', check: 'Vérifier', checking: 'Je compare…', go: 'Continuer', send: 'Continuer', close: 'Fermer', retry: 'Réessayer',
    comparing: 'Je compare ta phrase à la demande.', empty: 'Écris d’abord ce que tu veux faire.',
    wants: ' veut utiliser ton portefeuille.', here: 'Ce site', first: 'Tu as écrit ',
    long: function (n, max) { return 'Ta phrase fait ' + n + ' signes. Le maximum est ' + max + NB + ': raccourcis-la, je ne vérifie pas une phrase coupée.'; },
    left: function (n) { return n === 0 ? 'Tu es à la limite de longueur.' : 'Il reste ' + n + (n === 1 ? ' signe.' : ' signes.'); },
    ready: 'Tu peux continuer.', got: 'Ce que j’ai compris', leaving: 'Ça part vers ton portefeuille.', from: 'depuis ton compte ',
    assume: 'Le reste, je le suppose' + NB + ': rien de plus, rien de durable, tout revient sur ton compte.',
    readBy: function (r) { var n = r && r.by === 'clef' ? 'Clef' : r && r.by === 'jev' ? 'Jev' : ''; if (!n) return 'Compris sans modèle'; return 'Compris par ' + n + (r.ms != null && isFinite(r.ms) ? ' en ' + (Math.round(r.ms / 100) / 10).toFixed(1).replace('.', ',') + NB + 's' : ''); },
    slots: { what: 'quoi', much: 'combien', who: 'à qui', against: 'contre quoi' },
    step: function (n, total) { return total ? ', demande ' + n + ' sur ' + total : n === 2 ? ', deuxième demande du même échange' : n === 3 ? ', troisième demande du même échange' : ', demande ' + n + ' du même échange'; } };
  // guard : a key or a click already on its way when an answer appears is not a consent (the worker refuses it during its first 600 ms) ;
  // "Envoyer quand même" is therefore visibly inactive that long, never a press swallowed in silence.
  var TIMING = { min: 400, loadingAfter: 150, leave: 80, guard: 700, type: 150, opening: 140 };

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  // French spaces : no line starts with "?" or ":", an amount is never cut from its unit.
  function typo(text) {
    return String(text == null ? '' : text).replace(/ ([?;!])/g, NNB + '$1').replace(/ :/g, NB + ':').replace(/(\d) (?=\d{3}(?!\d))/g, '$1' + NNB).replace(/(\d) (?=[A-Z$€][A-Za-z0-9.$]{0,11}(?![a-zà-ÿ]))/g, '$1' + NB);
  }
  // The delay that is left, as the count shows it : "24" + " s" ; beyond a minute : "2 min 05" + " s".
  function countOf(leftMs) {
    var s = Math.max(0, Math.ceil(leftMs / 1000)), m = Math.floor(s / 60), r = s % 60;
    return m ? { n: m + ' min ' + (r < 10 ? '0' : '') + r, unit: ' s' } : { n: String(r), unit: ' s' };
  }
  // The same, as one sentence : "Envoyer quand même dans 24 s."
  function waitLine(leftMs) {
    if (Math.ceil(leftMs / 1000) <= 0) return '';
    var c = countOf(leftMs);
    return T.go + ' dans ' + c.n + c.unit + '.';
  }
  function addressBlock(label, groups, full) {
    var box = el('div', 'hu-addr');
    box.appendChild(el('p', 'hu-addr-label', label));
    var grid = el('p', 'hu-addr-grid hu-num'); grid.setAttribute('aria-hidden', 'true');
    groups.forEach(function (g) { var span = el('span'); g.forEach(function (c) { span.appendChild(el(c.diff ? 'b' : 'i', '', c.c)); }); grid.appendChild(span); });
    box.appendChild(grid);
    box.appendChild(el('span', 'hu-sr', full));
    return box;
  }

  // The glove : drawn once in the product, on "Ça ne correspond pas". The host page holds its drawing (<symbol id="hu-glove">) and
  // the element that uses it (<template id="hu-glove-use"> : <svg class="hu-glove"><use href="#hu-glove"/></svg>) : cloned here.
  function glove() {
    try { var t = document.getElementById && document.getElementById('hu-glove-use'); return t && t.content && t.content.firstElementChild ? t.content.firstElementChild.cloneNode(true) : null; } catch (_) { return null; }
  }

  // What I understood, as the person types : the verb, the amount, and the other side (a token or an address).
  // Read by the same code as the check (intent_text.js : extractFields and the keyword classifier, set on window by ui/fields.js) ;
  // nothing is sent, nothing is stored. The table below only chooses the WORD shown for the verb the person used.
  var VERBS = [[/\b(echang|swap|convert|troqu)/, 'échanger'], [/\b(achet|achat|buy)/, 'acheter'], [/\b(vend|vente|sell)/, 'vendre'],
    [/\b(envo|send|transf|vire)/, 'envoyer'], [/\b(pay|regl)/, 'payer'], [/\b(donn|offr)/, 'donner'], [/\b(depos|stak|plac)/, 'déposer'],
    [/\b(retir|withdraw)/, 'retirer'], [/\b(reclam|claim|recevoir|recois)/, 'recevoir'], [/\b(connect|login|identifi)/, 'me connecter'],
    [/\b(autoris|approuv|approve)/, 'autoriser'], [/\b(sign)/, 'signer']];
  var KIND_WORD = { buy_or_swap: 'échanger', pay_someone: 'payer', send_to_my_account: 'envoyer', connect_or_accept_offer: 'me connecter' };
  function fold(text) { var f = String(text || '').toLowerCase(); try { f = f.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (_) {} return f; }
  // -> { what, much, other, otherLabel, off } ; `kind` : what the keyword classifier of the check says of the sentence (may be absent)
  function understood(text, kind) {
    var t = String(text || ''), folded = fold(t);
    var out = { what: '', much: '', other: '', otherLabel: T.slots.who, off: false }, f = {};
    for (var i = 0; i < VERBS.length; i++) if (VERBS[i][0].test(folded)) { out.what = VERBS[i][1]; break; }
    if (!out.what && kind && KIND_WORD[kind]) out.what = KIND_WORD[kind];
    try { if (typeof window !== 'undefined' && typeof window.HoldupFields === 'function') f = window.HoldupFields(t) || {}; } catch (_) { f = {}; }
    var swap = kind === 'buy_or_swap' || (!kind && /^(échanger|acheter|vendre)$/.test(out.what));
    if (swap) out.otherLabel = T.slots.against;
    if (f.amount != null && f.symbol) out.much = String(f.amount).replace('.', ',') + NB + (f.money ? '$' : f.symbol);
    if (f.counter) { out.other = 'contre ' + f.counter; out.otherLabel = T.slots.against; }
    else if (f.address) { out.other = f.address.slice(0, 6) + '…' + f.address.slice(-4); out.otherLabel = T.slots.who; }
    // a connection has neither an amount nor another side : the two places stay, empty and unseen
    if (!out.much && !out.other && (kind === 'connect_or_accept_offer' || out.what === 'me connecter')) out.off = true;
    return out;
  }

  function mount(root, on) {
    var timer = null, current = null, busy = false;
    var drawnAt = 0, queued = null, swapTimer = null, leaveTimer = null, loadTimer = null, typeTimer = null, lastOutcome = null;
    root.classList.add('hu'); root.classList.add('hu-k'); root.classList.add('hu-win');
    function flag(name, yes) { try { if (yes) root.classList.add(name); else if (root.classList.remove) root.classList.remove(name); } catch (_) {} }
    flag('is-opening', true);
    function stamp(state) { drawnAt = Date.now(); root.setAttribute('data-state', state); }
    function stop() { if (timer) { clearInterval(timer); clearTimeout(timer); timer = null; } if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; } if (typeTimer) { clearTimeout(typeTimer); typeTimer = null; } }
    function clear() { stop(); while (root.firstChild) root.removeChild(root.firstChild); root.removeAttribute('data-outcome'); root.removeAttribute('data-addresses'); flag('is-ready', false); busy = false; }
    // the two gestures : the full button (the advised one, drawn right) and the underlined word
    function button(label, primary) { var b = el('button', primary ? 'hu-cuff' : 'hu-word', label); b.type = 'button'; return b; }
    function enabled(b) { return b.getAttribute('aria-disabled') !== 'true'; }
    function setEnabled(b, yes) { if (yes) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true'); }
    // .hu-m : what moves when a moment arrives ; --hu-i staggers it by 40 ms
    function mo(n, i) { n.className += ' hu-m'; try { if (i && n.style && n.style.setProperty) n.style.setProperty('--hu-i', String(i)); } catch (_) {} return n; }
    function stage() { var st = el('div', 'hu-stage'); root.appendChild(st); return st; }
    function txt(parent, text) { var s = el('span', '', text); parent.appendChild(s); return s; }
    function head(site, tail) { var p = el('p', 'hu-head'); p.appendChild(el('b', '', site || T.here)); if (tail) txt(p, tail); return p; }
    function stopButton(label, primary) { var b = button(label, primary); b.addEventListener('click', function () { on.onCancel('button'); }); return b; }
    function focus(n) { try { n.focus({ preventScroll: true }); } catch (_) {} }

    function question(s) {
      var st = stage(), dock = el('div', 'hu-dock');
      // the first question names the site above the title ; the follow-up recalls the first sentence at that place
      if (s.first) { var hw = el('p', 'hu-head hu-head--wrap', T.first); hw.appendChild(el('b', '', '«' + NB + s.first + NB + '»')); st.appendChild(mo(hw)); }
      else st.appendChild(mo(head(s.site, T.wants)));
      var title = el('h1', 'hu-title', typo(s.title)); title.id = 'hu-q';
      // No maxLength : a pasted text would be cut without a word. The limit is said before it is reached, and a longer sentence is not sent.
      var max = s.max > 0 ? s.max : 500;
      var field = el('textarea', 'hu-field'); field.placeholder = s.placeholder || ''; field.setAttribute('aria-labelledby', 'hu-q');
      if (s.first) field.className += ' hu-field--short';
      field.spellcheck = false; field.autocapitalize = 'off';
      var got = el('div', 'hu-got'); got.setAttribute('role', 'status');
      got.appendChild(el('span', 'hu-got-say', T.got));
      var slot = function (label) { var b = el('span', 'hu-slot'), q = el('span', 'hu-slot-q', label), v = el('span', 'hu-slot-v'); b.appendChild(q); b.appendChild(v); got.appendChild(b); return { box: b, q: q, v: v }; };
      var slots = { what: slot(T.slots.what), much: slot(T.slots.much), other: slot(T.slots.who) };
      var from = null;
      if (s.account) { from = el('span', 'hu-got-from', T.from + s.account); from.hidden = true; got.appendChild(from); }
      // a value arrives at its own place ; the place the follow-up asks about is said in ink until it is filled
      var put = function (name, value, label, off) {
        var sl = slots[name], missing = !value && s.missing === name;
        sl.q.textContent = missing && s.missingLabel ? s.missingLabel : label;
        if (value) sl.v.textContent = value;
        sl.box.className = 'hu-slot' + (value ? ' is-filled' : missing ? ' is-missing' : off ? ' is-off' : '');
      };
      var seq = 0;
      var paint = function (text, kind) {
        var u = understood(text, kind);
        put('what', u.what, T.slots.what, false); put('much', u.much, T.slots.much, u.off); put('other', u.other, u.otherLabel, u.off);
        if (from) from.hidden = !(u.what && (u.off || (u.much && u.other)));
      };
      // reads the sentence with the code of the check ; the keyword classifier is asynchronous, a newer keystroke wins
      var read = function () {
        var text = (s.first ? s.first + ' ' : '') + field.value, mine = ++seq;
        paint(text, null);
        try {
          var k = typeof window !== 'undefined' && typeof window.HoldupKind === 'function' ? window.HoldupKind(text) : null;
          if (k && typeof k.then === 'function') k.then(function (kind) { if (mine === seq && current && current.got === got) paint(text, kind); }, function () {});
        } catch (_) {}
      };
      var under = el('div', 'hu-under');
      var assume = s.first ? null : el('p', 'hu-assume', T.assume);
      var status = el('p', 'hu-busy', T.comparing); status.setAttribute('aria-hidden', 'true');
      var error = el('p', 'hu-error'); error.setAttribute('role', 'alert'); error.id = 'hu-e'; error.hidden = true;
      var count = el('p', 'hu-count'); count.setAttribute('role', 'status'); count.hidden = true;
      // one place under the field : the error or the count take the place of the grey line
      var settle = function () { if (assume) assume.hidden = !error.hidden || !count.hidden; };
      if (assume) under.appendChild(assume);
      under.appendChild(error); under.appendChild(count); under.appendChild(status);
      st.appendChild(mo(title)); st.appendChild(mo(field, 1)); st.appendChild(mo(got, 1)); st.appendChild(mo(under, 1));
      var cancel = stopButton(T.cancel, false), go = button(T.check, true);
      setEnabled(go, false);
      dock.appendChild(cancel); dock.appendChild(go); st.appendChild(dock);
      current.got = got;
      // The loading state is drawn only if the answer is slow ; once drawn it counts as a state of its own (it stays `min` ms).
      function loading() { loadTimer = null; if (!busy) return; go.textContent = T.checking; status.removeAttribute('aria-hidden'); status.setAttribute('role', 'status'); if (assume) assume.setAttribute('aria-hidden', 'true'); count.hidden = true; settle(); stamp('checking'); }
      function lock(now) {
        busy = true; field.readOnly = true; setEnabled(go, false);
        if (loadTimer) clearTimeout(loadTimer);
        if (now) loading(); else loadTimer = setTimeout(loading, TIMING.loadingAfter);
      }
      function fail(text) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', 'hu-e'); error.textContent = text; error.hidden = false; count.hidden = true; settle(); field.focus(); }
      function submit() {
        var text = field.value.replace(/\s+/g, ' ').trim();
        if (busy) return;
        if (!text) return fail(T.empty);
        if (text.length > max) return fail(T.long(text.length, max));
        lock(false); on.onSubmit(text);
      }
      field.addEventListener('input', function () {
        field.removeAttribute('aria-invalid'); field.removeAttribute('aria-describedby'); error.hidden = true;
        if (!busy) setEnabled(go, !!field.value.trim());
        var n = field.value.replace(/\s+/g, ' ').trim().length;
        if (n > max) { error.textContent = T.long(n, max); error.hidden = false; count.hidden = true; }
        else if (n >= max - 60) { count.textContent = T.left(max - n); count.hidden = false; } else count.hidden = true;
        settle();
        // a short pause in the typing before reading : the places do not flicker letter by letter
        if (typeTimer) clearTimeout(typeTimer);
        typeTimer = setTimeout(function () { typeTimer = null; read(); }, TIMING.type);
      });
      field.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
      go.addEventListener('click', submit);
      stamp('question');
      if (s.first) read();
      if (s.checking) lock(true);
      focus(field);
      current.unlock = function () {
        if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; }
        busy = false; field.readOnly = false; go.textContent = T.check; status.setAttribute('aria-hidden', 'true'); status.removeAttribute('role'); if (assume) assume.removeAttribute('aria-hidden');
        settle(); setEnabled(go, !!field.value.trim()); root.setAttribute('data-state', 'question');
      };
    }

    function answer(s) {
      var st = stage(), mid = el('div', 'hu-mid'), dock = el('div', 'hu-dock');
      root.setAttribute('data-outcome', s.outcome);
      if (lastOutcome) root.setAttribute('data-from-outcome', lastOutcome); else root.removeAttribute('data-from-outcome');
      flag('is-verdict-change', !!lastOutcome && lastOutcome !== s.outcome);
      lastOutcome = s.outcome;
      if (s.addresses) root.setAttribute('data-addresses', '');
      var match = s.outcome === 'match', mismatch = s.outcome === 'mismatch';
      // the site stays in sight, except under the glove : there the verdict is alone
      if (!mismatch) st.appendChild(head(s.site, s.step > 1 || s.stepTotal ? T.step(s.step || 1, s.stepTotal) : ''));
      st.appendChild(mid); st.appendChild(dock);
      if (mismatch) { var gl = glove(); if (gl) mid.appendChild(gl); }
      var title = el('h1', 'hu-verdict', s.headline); title.tabIndex = -1;
      mid.appendChild(mo(title));
      // a gap is said in two lines : what you wrote, then what the request does, in 600
      if (s.said && s.does) { mid.appendChild(mo(el('p', 'hu-line', typo(s.said)), 1)); mid.appendChild(mo(el('p', 'hu-line hu-line--strong', typo(s.does)), 1)); }
      else if (s.show || s.line) mid.appendChild(mo(el('p', 'hu-line' + (mismatch ? ' hu-line--strong' : ''), typo(s.show || s.line)), 1));
      if (s.retry && on.onRetry) {
        var rp = el('p', 'hu-line'), rb = button(T.retry, false);
        rb.addEventListener('click', function () { if (busy) return; busy = true; on.onRetry(); });
        rp.appendChild(rb); mid.appendChild(mo(rp, 1));
      }
      if (s.fix) { var fx = el('p', 'hu-fix'); fx.appendChild(el('b', '', typo(s.fix))); if (s.fixWhy) fx.appendChild(el('span', '', typo(s.fixWhy))); mid.appendChild(mo(fx, 2)); }
      if (s.addresses) {
        mid.appendChild(mo(addressBlock(s.labels.expected, s.addresses.expected, s.addresses.expectedFull), 2));
        mid.appendChild(mo(addressBlock(s.labels.actual, s.addresses.actual, s.addresses.actualFull), 2));
      }
      // one discreet line : how the sentence was read, and the time the model really took (measured by the worker)
      if (s.read) mid.appendChild(mo(el('p', 'hu-next hu-read', T.readBy(s.read)), 2));
      // the detection time (request received -> answer on screen), readable by a test or a recording
      if (s.detectMs != null) root.setAttribute('data-detect-ms', String(s.detectMs)); else root.removeAttribute('data-detect-ms');
      var live = el('span', 'hu-sr'); live.setAttribute('role', 'status'); mid.appendChild(live);
      stamp('answer');
      if (match && s.autoMs > 0) {
        // It matches : the sentence stays about a second, then the request goes to the wallet by itself. No gesture to send ; "Ne rien envoyer" stays.
        dock.appendChild(stopButton(T.stop, false)); dock.appendChild(el('p', 'hu-leave', T.leaving));
        var arm = function (ms) { if (timer) clearTimeout(timer); timer = setTimeout(function () { timer = null; if (!busy) { busy = true; on.onContinue(true); } }, ms); };
        arm(s.autoMs);
        focus(title); // nothing to press by mistake
        current.sync = function () { busy = false; arm(300); }; // the worker said "not yet" : asked again shortly
        return;
      }
      if (mismatch && s.limit && s.limit.label && on.onLimit) {
        // The request gives more than what was written, and it can be brought back to it : the advised gesture makes it conform.
        // Active at once, no delay. Nothing is limited without this gesture, and nothing here sends the request as the site wrote it.
        var none = stopButton(T.stop, false), lim = button(typo(s.limit.label), true);
        dock.className += ' hu-dock--limit';
        dock.appendChild(none); dock.appendChild(lim);
        lim.addEventListener('click', function () { if (busy) return; busy = true; on.onLimit(); });
        focus(none);
        current.sync = function () { busy = false; };
        return;
      }
      // "Ne rien envoyer" is the advised gesture (full, right). The other one waits on the left, with its count.
      var cancel = stopButton(T.stop, true), go = button(match ? T.send : T.go, false);
      var wait = el('p', 'hu-wait'), count = el('span', 'hu-wait-count'), num = el('span', 'hu-num'), unit;
      count.setAttribute('aria-hidden', 'true');
      txt(count, 'dans '); count.appendChild(num); unit = txt(count, ' s');
      wait.appendChild(go); wait.appendChild(count);
      dock.appendChild(wait); dock.appendChild(cancel);
      var until = Date.now() + Math.max(TIMING.guard, s.leftMs || 0), waited = (s.leftMs || 0) > 0;
      function tick(first) {
        var left = until - Date.now(), open = left <= 0;
        if (waited) { var c = countOf(left); num.textContent = c.n; unit.textContent = c.unit; count.hidden = false; } else count.hidden = true;
        flag('is-ready', open && waited); // the count fades, the word gets its underline
        if (open !== enabled(go)) { setEnabled(go, open); if (open && waited && first !== true) live.textContent = T.ready; }
        if (open && timer) { clearInterval(timer); timer = null; }
      }
      setEnabled(go, false); tick(true);
      if (until > Date.now()) timer = setInterval(tick, 250);
      go.addEventListener('click', function () { if (busy || !enabled(go)) return; busy = true; on.onContinue(false); });
      focus(cancel);
      current.sync = function (leftMs) { until = Math.max(until, Date.now() + Math.max(0, leftMs || 0)); if (leftMs > 0) waited = true; busy = false; if (!timer && until > Date.now()) timer = setInterval(tick, 250); tick(true); };
    }

    // The last message of a request. `wait` : the operation is not over, the window stays and says so ; "Fermer" closes it.
    // `stay` : the request expired while nobody was there ; the window stays until "Fermer".
    function last(e) {
      var st = stage();
      if (e.wait || e.stay) {
        var mid = el('div', 'hu-mid'), dock = el('div', 'hu-dock hu-dock--end');
        if (e.wait && e.site) st.appendChild(head(e.site, ''));
        var p = el('h1', 'hu-verdict', e.text); p.setAttribute('role', 'status'); p.tabIndex = -1; mid.appendChild(mo(p));
        if (e.line) mid.appendChild(mo(el('p', 'hu-line', typo(e.line)), 1));
        if (e.waitText) mid.appendChild(mo(el('p', 'hu-next', e.waitText), 1));
        var close = button(T.close, e.stay === true); close.addEventListener('click', function () { if (on.onClose) on.onClose(); });
        dock.appendChild(close); st.appendChild(mid); st.appendChild(dock);
        stamp('waiting');
        focus(e.stay ? close : p);
        return;
      }
      var q = el('p', 'hu-end', typo(e.text)); q.setAttribute('role', 'status'); st.appendChild(mo(q));
      stamp('end');
    }

    function draw(item) {
      queued = null; swapTimer = null;
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
      if (current) flag('is-opening', false); // only the first moment opens the surface
      clear(); flag('is-leaving', false); flag('is-entering', true);
      flag('is-next', !!(item.s && item.s.kind === 'answer' && item.s.step > 1));
      if (item.end) { current = { kind: item.end.wait || item.end.stay ? 'waiting' : 'end', key: null }; flag('is-verdict-change', false); last(item.end); return; }
      current = { kind: item.s.kind, key: item.key, sync: null, unlock: null };
      if (item.s.kind === 'question') { flag('is-verdict-change', false); question(item.s); } else answer(item.s);
    }
    // Draws now when nothing is on screen ; otherwise when the current state had its time. The newest request wins.
    // The moment in place fades for `leave` ms before it is replaced.
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
        schedule({ end: { text: text, line: o.line || null, wait: o.wait === true, stay: o.stay === true, waitText: o.waitText || null, site: o.site || null } });
        return left;
      },
      state: function () { return current ? current.kind : null; }
    };
  }
  global.HoldupScreen = { mount: mount, waitLine: waitLine, countOf: countOf, understood: understood, typo: typo, TIMING: TIMING, TEXT: T };
})(typeof window !== 'undefined' ? window : globalThis);

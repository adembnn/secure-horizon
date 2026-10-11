/* Hold up : surface de verdict. Sans dépendance. Tout texte passe par textContent. Contrat : UI_CONTRAT.md.
   API : HoldUp.render(container, message, { onDecision, inline, now, setInterval, clearInterval }) -> { destroy() }
   Page : verdict.html écoute window.postMessage({type:'holdup.verdict', ...}) et répond {type:'holdup.decision', ...}. */
(function (global) {
  'use strict';

  var VERSION = 1;
  var MAX_WORDS = 12;
  var DEFAULT_CHOICES = [
    { value: 'recevoir', label: 'Recevoir' },
    { value: 'payer', label: 'Payer' },
    { value: 'echanger', label: 'Échanger' },
    { value: 'connexion', label: 'Me connecter' },
    { value: 'demande', label: 'On me l’a demandé' }
  ];
  var TAGS = { danger: 'Danger', address: 'Danger', manipulation: 'Manipulation', attention: 'Attention', unknown: 'Non vérifié', info: 'Information' };
  var DEFAULT_PHRASE = 'Je veux continuer malgré le danger';
  var GESTURE = 'Raccroche, puis rappelle toi-même le numéro officiel.';
  var seq = 0;

  function str(x) { return typeof x === 'string' ? x.trim() : ''; }
  function clampWords(s, n) {
    var w = s.split(/\s+/).filter(Boolean);
    return w.length <= n ? s : w.slice(0, n).join(' ') + '…';
  }
  function norm(s) { return String(s).normalize('NFC').toLowerCase().replace(/[\s ]+/g, ' ').replace(/[.!\s]+$/g, '').trim(); }
  function fmt(sec) {
    sec = Math.max(0, Math.ceil(sec));
    if (sec >= 60) { var m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
    return sec + ' s';
  }

  /* Choix de l'écran à partir du message reçu. Jamais d'écran « tout va bien ». */
  function pickScreen(msg) {
    if (msg.mode === 'intention') return 'intention';
    var v = msg.verdict || {};
    if (v.level === 'manipulation') return 'manipulation';
    if (v.level === 'unknown' || v.indeterminate === true) return 'unknown';
    if (v.address_diff && v.address_diff.expected && v.address_diff.actual && (v.level === 'danger' || v.niveau === 'critical')) return 'address';
    if (v.level === 'danger' || v.niveau === 'critical') return 'danger';
    if (v.niveau === 'info') return 'info';
    return 'attention';
  }

  /* Lignes à afficher : croit / réel / danger / action. Sans doublon avec le titre, sans ligne vide. */
  function buildModel(msg) {
    var v = msg.verdict || {};
    var t = v.texts || {};
    if (!t.reel && v.real && v.real.amount) t = { croit: str(v.said && v.said.amount), reel: str(v.real.amount), danger: str(t.danger || (v.reasons || [])[0]), action: str(t.action || (v.reasons || [])[1]) };
    var screen = pickScreen(msg);
    var title = str(v.title) || str(t.reel) || 'Cette opération n’a pas pu être expliquée.';
    if (screen === 'manipulation' && !str(v.title)) title = 'On te dicte quoi faire ? Raccroche.';
    var rows = [
      { k: 'croit', label: 'Tu crois', text: str(t.croit) },
      { k: 'reel', label: 'En vrai', text: str(t.reel) },
      { k: 'danger', label: 'Le danger', text: str(t.danger) },
      { k: 'action', label: 'À faire', text: str(t.action) }
    ].filter(function (r) { return r.text && r.text !== title; });
    var shown = {};
    rows.forEach(function (r) { shown[r.text] = true; });
    shown[title] = true;
    var extra = (v.reasons || []).map(str).filter(function (r) { return r && !shown[r]; });
    var m = { screen: screen, title: title, tag: TAGS[screen], rows: rows, extra: extra, site: str(msg.site), amount: str(msg.amount) };
    if (screen === 'address') {
      var d = v.address_diff;
      m.addr = { expected: str(d.expected), actual: str(d.actual), expectedLabel: str(d.expectedLabel) || 'Adresse que tu utilises d’habitude', actualLabel: str(d.actualLabel) || 'Adresse demandée maintenant' };
    }
    if (screen === 'manipulation') {
      m.quote = str(v.quote) ? clampWords(str(v.quote), MAX_WORDS) : '';
      m.gesture = str(v.gesture) || GESTURE;
    }
    return m;
  }

  function groupsOf(a) {
    var s = a.replace(/^0x/i, '');
    var out = [];
    for (var i = 0; i < s.length; i += 4) out.push(s.slice(i, i + 4));
    return { prefix: /^0x/i.test(a) ? a.slice(0, 2) : '', groups: out };
  }

  function render(container, msg, opts) {
    opts = opts || {};
    msg = msg || {};
    var doc = container.ownerDocument || global.document;
    var now = opts.now || function () { return global.performance.now(); };
    var setI = opts.setInterval || global.setInterval.bind(global);
    var clearI = opts.clearInterval || global.clearInterval.bind(global);
    var t0 = now();
    var uid = 'hu' + (++seq);
    var decided = false;
    var timer = null;
    var focusables = [];

    function el(tag, cls, text) {
      var e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = String(text);
      return e;
    }
    function add(parent, child) { parent.appendChild(child); return child; }

    var model = msg.mode === 'intention' ? { screen: 'intention', tag: '' } : buildModel(msg);
    var theme = msg.theme === 'dark' || msg.theme === 'light' ? msg.theme : '';
    var frictionCfg = msg.friction || { type: 'none' };
    var ftype = frictionCfg.type === 'wait' || frictionCfg.type === 'phrase' ? frictionCfg.type : 'none';
    var fseconds = ftype === 'wait' ? Math.max(1, Math.min(3600, Number(frictionCfg.seconds) || 30)) : 0;
    var fphrase = ftype === 'phrase' ? (str(frictionCfg.phrase) || DEFAULT_PHRASE) : '';
    var satisfied = ftype === 'none';

    container.className = 'hu ' + (opts.inline ? 'inline' : 'page') + (model.screen === 'info' || model.screen === 'attention' || model.screen === 'unknown' ? ' neutral' : '');
    if (theme) container.setAttribute('data-theme', theme); else container.removeAttribute('data-theme');
    container.textContent = '';

    var win = add(container, el('section', 'win'));
    win.setAttribute('role', 'alertdialog');
    win.setAttribute('aria-modal', opts.inline ? 'false' : 'true');
    win.setAttribute('data-screen', model.screen);
    var titleId = uid + '-t';
    var descId = uid + '-d';
    win.setAttribute('aria-labelledby', titleId);
    win.setAttribute('aria-describedby', descId);

    var live = el('p', 'sr');
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');

    var actions = el('div', 'actions');
    var cancelBtn = null, contBtn = null;

    function button(cls, label, action) {
      var b = el('button', 'btn ' + cls, label);
      b.setAttribute('type', 'button');
      b.setAttribute('data-action', action);
      focusables.push(b);
      return b;
    }

    function finish(decision, via, extra) {
      if (decided) return;
      decided = true;
      if (timer) { clearI(timer); timer = null; }
      var out = {
        type: 'holdup.decision', version: VERSION, id: msg.id == null ? null : msg.id,
        decision: decision, via: via, screen: model.screen,
        time_to_decision_ms: Math.max(0, Math.round(now() - t0)),
        friction: { type: ftype, satisfied: satisfied }
      };
      if (extra) for (var k in extra) out[k] = extra[k];
      container.setAttribute('data-decided', decision);
      if (opts.onDecision) opts.onDecision(out);
    }

    function cancel(via) { finish('cancel', via || 'button'); }

    if (model.screen === 'intention') {
      buildIntention();
    } else {
      buildVerdict();
    }

    function buildIntention() {
      var form = add(win, el('form'));
      form.setAttribute('novalidate', '');
      var fs = add(form, el('fieldset'));
      var lg = add(fs, el('legend'));
      var siteName = str(msg.site);
      var h = add(lg, el('h1', '', str(msg.question) || (siteName ? 'Que veux-tu faire sur ' + siteName + ' ?' : 'Que veux-tu faire ?')));
      h.id = titleId;
      var choices = Array.isArray(msg.choices) && msg.choices.length ? msg.choices : DEFAULT_CHOICES;
      var chosen = '';
      var radios = [];
      var paste = el('div', 'paste');
      paste.setAttribute('hidden', '');
      var pl = add(paste, el('label', '', 'Colle le message qu’on t’a envoyé'));
      var ta = add(paste, el('textarea', 'field'));
      ta.id = uid + '-msg';
      pl.setAttribute('for', ta.id);
      ta.setAttribute('rows', '3');
      focusables.push(ta);
      var go = button('btn-primary', 'Continuer vers la vérification', 'intent');
      go.setAttribute('aria-disabled', 'true');
      choices.forEach(function (c) {
        var lab = add(fs, el('label', 'choice'));
        var inp = add(lab, el('input'));
        inp.setAttribute('type', 'radio');
        inp.setAttribute('name', uid + '-i');
        inp.setAttribute('value', str(c.value));
        add(lab, el('span', '', str(c.label)));
        radios.push(inp);
        focusables.push(inp);
        inp.addEventListener('change', function () {
          chosen = str(c.value);
          go.removeAttribute('aria-disabled');
          if (chosen === 'demande') paste.removeAttribute('hidden'); else paste.setAttribute('hidden', '');
        });
      });
      add(form, paste);
      var desc = add(form, el('p', 'sr', 'Choisis une réponse, puis continue. Tu peux annuler à tout moment.'));
      desc.id = descId;
      add(actions, go);
      cancelBtn = add(actions, button('btn-secondary', 'Annuler', 'cancel'));
      add(form, actions);
      add(win, live);
      go.addEventListener('click', function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (go.getAttribute('aria-disabled') === 'true') { live.textContent = 'Choisis d’abord une réponse.'; return; }
        var extra = { intent: chosen };
        if (chosen === 'demande') extra.intent_message = String(ta.value || '').slice(0, 2000);
        finish('intent', 'button', extra);
      });
      cancelBtn.addEventListener('click', function () { cancel('button'); });
    }

    function buildVerdict() {
      add(win, el('span', 'tag t-' + model.screen, model.tag));
      var h = add(win, el('h1', '', model.title));
      h.id = titleId;

      var desc = el('div');
      desc.id = descId;

      if (model.screen === 'manipulation') {
        add(desc, el('p', 'gesture', model.gesture));
        add(desc, el('p', 'reassure', 'Rien n’est parti pour l’instant.'));
      }

      if (model.addr) {
        var a = groupsOf(model.addr.expected), b = groupsOf(model.addr.actual);
        var dl = add(desc, el('dl', 'addr'));
        var diffCount = 0;
        function addrRow(cls, label, parts, other, mark) {
          var row = add(dl, el('div', cls));
          add(row, el('dt', '', label));
          var dd = add(row, el('dd', parts.groups.length === 10 ? '' : 'wrap'));
          dd.setAttribute('data-raw', '1');
          dd.setAttribute('aria-label', (parts.prefix + parts.groups.join('')).replace(/(.{4})/g, '$1 ').trim());
          if (parts.prefix) add(dd, el('span', 'px', parts.prefix));
          parts.groups.forEach(function (g, i) {
            if (parts.groups.length === 10 && i === 5) { var sp = add(dd, el('span', 'px')); sp.setAttribute('aria-hidden', 'true'); }
            var differs = mark && (other.groups[i] || '').toLowerCase() !== g.toLowerCase();
            if (differs) diffCount++;
            add(dd, el('span', differs ? 'd' : '', g));
          });
        }
        addrRow('known', model.addr.expectedLabel, a, b, false);
        addrRow('real', model.addr.actualLabel, b, a, true);
        var n = diffCount;
        add(desc, el('p', 'count', n === 1 ? 'Un groupe de lettres est différent.' : n + ' groupes de lettres sont différents.'));
      }

      if (model.rows.length) {
        var gap = add(desc, el('dl'));
        model.rows.forEach(function (r) {
          var row = add(gap, el('div', 'row-' + r.k));
          add(row, el('dt', '', r.label));
          add(row, el('dd', '', r.text));
        });
      }
      add(win, desc);

      /* friction configurable : aucune / attente / phrase à retaper */
      var contLabel = 'Continuer quand même';
      contBtn = button('btn-secondary', contLabel, 'continue');
      if (ftype !== 'none') {
        var fr = add(win, el('div', 'friction'));
        var waitId = uid + '-w';
        if (ftype === 'wait') {
          var tm = add(fr, el('div', 'timer'));
          tm.setAttribute('role', 'timer');
          tm.setAttribute('aria-live', 'off');
          var tt = add(tm, el('span', 't', fmt(fseconds)));
          var ts = add(tm, el('span', 's', 'Attends avant de continuer.'));
          ts.id = waitId;
          var end = t0 + fseconds * 1000;
          live.textContent = 'Le bouton Continuer sera disponible dans ' + fmt(fseconds) + '.';
          timer = setI(function () {
            var left = (end - now()) / 1000;
            if (left <= 0) {
              clearI(timer); timer = null; satisfied = true;
              tt.textContent = '0 s';
              contBtn.removeAttribute('aria-disabled');
              live.textContent = 'Tu peux continuer maintenant.';
            } else tt.textContent = fmt(left);
          }, 250);
        } else {
          var pl2 = add(fr, el('p', 'phrase-label', 'Pour continuer, retape cette phrase :'));
          pl2.id = waitId;
          add(fr, el('p', 'phrase-text', fphrase));
          var inp = add(fr, el('input', 'field'));
          inp.setAttribute('type', 'text');
          inp.setAttribute('autocomplete', 'off');
          inp.setAttribute('autocapitalize', 'off');
          inp.setAttribute('spellcheck', 'false');
          inp.setAttribute('aria-label', 'Retape la phrase ci-dessus');
          inp.setAttribute('aria-describedby', waitId);
          focusables.push(inp);
          var onInput = function () {
            var ok = norm(inp.value || '') === norm(fphrase);
            if (ok && !satisfied) live.textContent = 'La phrase est correcte. Tu peux continuer.';
            satisfied = ok;
            if (ok) contBtn.removeAttribute('aria-disabled'); else contBtn.setAttribute('aria-disabled', 'true');
          };
          inp.addEventListener('input', onInput);
          inp.addEventListener('paste', function (e) { if (e && e.preventDefault) e.preventDefault(); });
        }
        contBtn.setAttribute('aria-disabled', 'true');
        contBtn.setAttribute('aria-describedby', waitId);
      }

      /* Annuler toujours en premier, plein, et avec la même taille que Continuer */
      cancelBtn = add(actions, button('btn-primary', 'Annuler', 'cancel'));
      if (model.screen === 'manipulation') {
        var call = add(actions, button('btn-secondary', 'Appeler un proche', 'call_trusted'));
        call.addEventListener('click', function () { finish('call_trusted', 'button'); });
      }
      add(actions, contBtn);
      add(win, actions);
      add(win, live);

      cancelBtn.addEventListener('click', function () { cancel('button'); });
      contBtn.addEventListener('click', function () {
        if (contBtn.getAttribute('aria-disabled') === 'true' || !satisfied) {
          live.textContent = ftype === 'wait' ? 'Attends encore avant de continuer.' : 'Retape la phrase pour continuer.';
          return;
        }
        finish('continue', 'button');
      });

      /* pourquoi : raisons en plus, citation de la page. Jamais de code technique. */
      if (model.extra.length || model.quote) {
        var foot = add(win, el('div', 'foot'));
        var det = add(foot, el('details'));
        add(det, el('summary', '', 'Pourquoi ?'));
        model.extra.forEach(function (r) { add(det, el('p', '', r)); });
        if (model.quote) {
          add(det, el('p', '', 'Voici ce que dit la page :'));
          var qp = add(det, el('p', 'quote', '« ' + model.quote + ' »')); qp.setAttribute('data-raw', '1');
        }
      }
    }

    /* clavier : Échap = Annuler ; Tab reste dans la fenêtre ; focus initial sur Annuler (jamais sur Continuer) */
    function onKey(e) {
      if (decided) return;
      if (e.key === 'Escape') { if (e.preventDefault) e.preventDefault(); cancel('escape'); return; }
      if (e.key === 'Tab' && !opts.inline && focusables.length) {
        var first = focusables[0], last = focusables[focusables.length - 1];
        var act = doc.activeElement;
        if (e.shiftKey && act === first) { if (e.preventDefault) e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && act === last) { if (e.preventDefault) e.preventDefault(); first.focus(); }
      }
    }
    container.addEventListener('keydown', onKey);
    if (cancelBtn && !opts.noFocus) {
      if (model.screen === 'intention' && focusables[0]) focusables[0].focus(); else cancelBtn.focus();
    }

    return {
      model: model,
      destroy: function () {
        if (timer) { clearI(timer); timer = null; }
        container.removeEventListener('keydown', onKey);
        container.textContent = '';
      }
    };
  }

  /* Page : un seul verdict à la fois, messages acceptés du parent (ou de l'ouvreur) seulement. */
  function boot() {
    var rootEl = global.document.getElementById('root');
    var current = null;
    function waiting() {
      rootEl.className = 'hu page';
      rootEl.textContent = '';
      var w = global.document.createElement('section');
      w.className = 'win';
      var p = global.document.createElement('p');
      p.className = 'wait-note';
      p.textContent = 'Hold up attend une demande à vérifier.';
      w.appendChild(p);
      rootEl.appendChild(w);
    }
    function show(msg, reply) {
      if (current) current.destroy();
      current = render(rootEl, msg, { onDecision: function (out) { if (reply) reply(out); } });
    }
    global.HoldUp.show = show;
    global.addEventListener('message', function (e) {
      if (e.source !== global.parent && e.source !== global.opener) return;
      var d = e.data;
      if (!d || d.type !== 'holdup.verdict' || d.version !== VERSION) return;
      var target = e.origin && e.origin !== 'null' ? e.origin : '*';
      show(d, function (out) { e.source.postMessage(out, target); });
    });
    waiting();
    if (global.parent && global.parent !== global) global.parent.postMessage({ type: 'holdup.ready', version: VERSION }, '*');
  }

  var api = { VERSION: VERSION, MAX_WORDS: MAX_WORDS, render: render, buildModel: buildModel, pickScreen: pickScreen };
  global.HoldUp = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global.document && global.document.getElementById && global.document.getElementById('root') && !global.HOLDUP_NO_BOOT) boot();
})(typeof window !== 'undefined' ? window : globalThis);

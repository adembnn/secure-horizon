/* Hold up Lab : vue « Vivre un scénario » (côté victime). Choisir, vivre l'appât, voir le moment de vérité, rejouer. */
(function (global) {
  'use strict';
  var D = global.Lab.dom, h = D.h, U = global.Lab.ui;

  var LABELS = {
    amount: 'Montant (USDC)', recipient: 'Adresse du destinataire', spender: 'Adresse qui reçoit le droit',
    intent: 'Ce que tu cherches à faire', pastedMessage: 'Message reçu, à coller', message: 'Message reçu, à coller',
    token: 'Jeton', deadline: 'Validité de la signature'
  };
  function norm(e) {
    if (typeof e === 'string') return { name: e };
    return { name: e.name || e.key || e.id, label: e.label, type: e.type, options: e.options || e.values };
  }
  function allScenarios(S) { return S.custom.concat(S.scenarios); }
  function findScenario(S, id) { var a = allScenarios(S); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function isCustom(S, sc) { return S.custom.indexOf(sc) >= 0; }

  function paramsOf(S, sc) { if (!S.params[sc.id]) S.params[sc.id] = Object.assign({}, sc.defaults || {}); return S.params[sc.id]; }
  function intentOf(S, sc) {
    if (!S.intents[sc.id]) S.intents[sc.id] = { kind: (sc.intent && sc.intent.kind) || '', freeText: (sc.intent && sc.intent.freeText) || '' };
    return S.intents[sc.id];
  }
  function keyOf(S, sc) { return JSON.stringify([paramsOf(S, sc), intentOf(S, sc)]); }

  function normalizeResult(r) {
    r = r || {};
    if (r.verdict) r.verdict.reasons = D.asArray(r.verdict.reasons);
    if (r.truth) { ['txs', 'deltas', 'approvals', 'control'].forEach(function (k) { r.truth[k] = D.asArray(r.truth[k]); }); }
    return r;
  }
  global.Lab.normalizeResult = normalizeResult;

  function create(root, arg) {
    var S = global.Lab.state;
    var rail = null, main = null, cur = null, railList = null, railDetails = null;
    var mq = global.matchMedia('(min-width: 1100px)');

    root.className = 'view sv';
    railDetails = h('details', { class: 'rail' }, h('summary', null, 'Choisir un scénario'));
    main = h('div', { class: 'sv-main' });
    root.appendChild(railDetails);
    root.appendChild(main);
    function syncRail() { if (mq.matches) railDetails.setAttribute('open', ''); }
    syncRail();
    if (mq.addEventListener) mq.addEventListener('change', syncRail);
    if (!mq.matches) railDetails.removeAttribute('open');

    /* ----- rail ----- */
    var famOpts = [{ value: '', label: 'Toutes les familles' }];
    var seen = {};
    allScenarios(S).forEach(function (s) { if (!seen[s.family]) { seen[s.family] = 1; famOpts.push({ value: s.family, label: D.pretty(s.family) }); } });
    var doorBtns = [{ id: '', label: 'Toutes' }].concat(D.DOORS.map(function (d) { return { id: d.id, label: d.short }; }));
    var doorRow = h('div', { class: 'seg', role: 'group', 'aria-label': 'Filtrer par porte' });
    function drawDoors() {
      D.clear(doorRow);
      doorBtns.forEach(function (b) {
        doorRow.appendChild(h('button', { type: 'button', 'aria-pressed': String(S.filter.door === b.id), onclick: function () { S.filter.door = b.id; drawDoors(); drawList(); } }, b.label));
      });
    }
    var famSel = U.select(famOpts, S.filter.family, function (v) { S.filter.family = v; drawList(); });
    var natSel = U.select([{ value: '', label: 'Attaques et honnêtes' }, { value: 'malveillant', label: 'Attaques' }, { value: 'benin', label: 'Opérations honnêtes' }], S.filter.label, function (v) { S.filter.label = v; drawList(); });
    famSel.setAttribute('aria-label', 'Famille'); natSel.setAttribute('aria-label', 'Nature');
    railList = h('ul', { class: 'rail-list' });
    railDetails.appendChild(h('div', { class: 'rail-body' }, doorRow, h('div', { class: 'rail-sel' }, famSel, natSel), railList));
    drawDoors();

    function visible() {
      return allScenarios(S).filter(function (s) {
        return (!S.filter.door || s.door === S.filter.door) && (!S.filter.family || s.family === S.filter.family) && (!S.filter.label || s.label === S.filter.label);
      });
    }
    function drawList() {
      D.clear(railList);
      var list = visible();
      if (!list.length) { railList.appendChild(h('li', { class: 'rail-empty' }, 'Aucun scénario pour ce filtre.')); return; }
      list.forEach(function (s) {
        var res = S.results[s.id];
        var active = S.currentId === s.id;
        var b = h('button', { type: 'button', class: 'rail-item', 'aria-current': active ? 'true' : null, onclick: function () { select(s.id, true); } },
          h('span', { class: 'ri-title' }, s.title),
          h('span', { class: 'ri-meta' }, D.doorLabel(s.door, true) + ' · ' + (s.label === 'malveillant' ? 'Attaque' : 'Honnête') + (isCustom(S, s) ? ' · la tienne' : '') + (s.covered === false ? ' · non couvert' : '')),
          res ? h('span', { class: 'ri-out ri-' + D.outcomeInfo(res.result.outcome).cls }, D.outcomeInfo(res.result.outcome).word) : null);
        railList.appendChild(h('li', null, b));
      });
    }

    /* ----- contrôles modifiables ----- */
    function buildControls(sc, onChange) {
      var specs = D.asArray(sc.editable).map(norm).filter(function (s) { return s.name; });
      var box = h('div', { class: 'controls' });
      if (!specs.length) { box.appendChild(h('p', { class: 'muted' }, 'Ce scénario n’a pas de réglage : il se joue tel quel.')); return box; }
      var p = paramsOf(S, sc), it = intentOf(S, sc);
      specs.forEach(function (spec) {
        var name = spec.name;
        if (name === 'intent') {
          var honest = (sc.intent && sc.intent.kind) || '';
          var opts = D.INTENTS.map(function (o) { return { value: o.value, label: o.label + (o.value === honest ? ' (réponse honnête)' : '') }; });
          if (honest && !D.INTENTS.some(function (o) { return o.value === honest; })) opts.unshift({ value: honest, label: D.intentLabel(honest) + ' (réponse honnête)' });
          box.appendChild(U.radioGroup('intent-' + sc.id, opts, it.kind, function (v) { it.kind = v; onChange(); }, spec.label || LABELS.intent));
          var txt = h('input', { type: 'text', value: it.freeText || '', maxlength: '300', autocomplete: 'off' });
          txt.addEventListener('input', function () { it.freeText = txt.value; onChange(); });
          box.appendChild(U.field('Dis-le avec tes mots (facultatif)', txt, 'La réponse honnête est cochée. Répondre autre chose ne peut que renforcer l’alerte.'));
          return;
        }
        var label = spec.label || LABELS[name] || D.pretty(name);
        var control;
        if (spec.options && spec.options.length) {
          control = U.select(D.asArray(spec.options).map(function (o) { return typeof o === 'object' ? { value: o.value, label: o.label || o.value } : { value: o, label: o }; }), p[name], function (v) { p[name] = v; onChange(); });
        } else if (/pasted|message/i.test(name)) {
          control = h('textarea', { rows: '3', maxlength: '2000', placeholder: 'Colle ici le message qu’on t’a envoyé' });
          control.value = p[name] || '';
          control.addEventListener('input', function () { p[name] = control.value; onChange(); });
        } else {
          var mono = /recipient|spender|address|adresse|token/i.test(name);
          control = h('input', { type: 'text', class: mono ? 'mono' : '', autocomplete: 'off', spellcheck: 'false', inputmode: /amount|montant/i.test(name) ? 'decimal' : null });
          control.value = p[name] == null ? '' : p[name];
          control.addEventListener('input', function () { p[name] = control.value; onChange(); });
        }
        box.appendChild(U.field(label, control));
      });
      return box;
    }

    /* ----- panneau principal ----- */
    function select(id, userClick) {
      var sc = findScenario(S, id);
      if (!sc) { renderEmpty(); return; }
      S.currentId = id;
      if (!visible().some(function (x) { return x.id === id; })) {
        S.filter.door = ''; S.filter.family = ''; S.filter.label = '';
        famSel.value = ''; natSel.value = ''; drawDoors();
      }
      if (location.hash !== '#/victime/scenarios/' + encodeURIComponent(id)) history.replaceState(null, '', '#/victime/scenarios/' + encodeURIComponent(id));
      drawList();
      renderMain(sc);
      if (userClick && !mq.matches) railDetails.removeAttribute('open');
    }

    function renderEmpty() {
      D.clear(main);
      main.appendChild(h('div', { class: 'empty' }, h('h2', null, 'Aucun scénario'), h('p', null, 'Le serveur n’a renvoyé aucun scénario. Vérifie qu’il est lancé, puis recharge la page.')));
    }

    function renderMain(sc) {
      if (cur && cur.result) cur.result.destroy();
      D.clear(main);
      var c = cur = { sc: sc, token: 0 };
      var ctx = { victim: S.health && S.health.victim };

      var frame = h('div', { class: 'scene', 'data-kind': (sc.staging && sc.staging.kind) || 'site' });
      var stageCtl = null;
      function drawStage() { stageCtl = global.Lab.stage.render(frame, sc, paramsOf(S, sc), ctx, run); }

      var resultRoot = h('section', { class: 'result-wrap', 'aria-label': 'Moment de vérité' });
      c.result = global.Lab.result.create(resultRoot);
      c.result.setContext({ scenario: sc, health: S.health });

      var replay = h('button', { type: 'button', class: 'btn btn-primary', onclick: function () { run(); } }, 'Rejouer');
      function onChange() {
        drawStage();
        var cached = S.results[sc.id];
        c.result.setStale(!!cached && cached.key !== keyOf(S, sc));
      }
      var controls = buildControls(sc, onChange);
      var reset = h('button', { type: 'button', class: 'btn-quiet', onclick: function () {
        delete S.params[sc.id]; delete S.intents[sc.id];
        var fresh = buildControls(sc, onChange); controls.replaceWith(fresh); controls = fresh; onChange();
      } }, 'Valeurs d’origine');

      main.appendChild(h('header', { class: 'sc-head' },
        h('h2', null, sc.title),
        U.tagsFor(sc),
        h('p', { class: 'story' }, sc.story || '')));
      if (sc.covered === false) {
        main.appendChild(h('p', { class: 'cov-note' }, h('b', null, 'Porte non couverte. '), sc.coverageNote || 'Le produit ne voit pas cette demande.'));
      }
      main.appendChild(h('div', { class: 'work' },
        frame,
        h('aside', { class: 'panel', 'aria-label': 'Modifier le scénario' }, h('h3', null, 'Modifier le scénario'), controls, h('div', { class: 'panel-actions' }, replay, reset))));
      main.appendChild(resultRoot);

      drawStage();
      var cached = S.results[sc.id];
      if (cached) {
        c.result.show(cached.result, { scenario: sc, health: S.health });
        c.result.setStale(cached.key !== keyOf(S, sc));
      }

      function run() {
        var token = ++c.token;
        stageCtl.setBusy(true); replay.setAttribute('aria-disabled', 'true');
        c.result.loading();
        var intent = intentOf(S, sc), params = paramsOf(S, sc);
        var k = keyOf(S, sc);
        var body = isCustom(S, sc)
          ? { scenario: Object.assign({}, sc, { defaults: Object.assign({}, sc.defaults, params), intent: { kind: intent.kind, freeText: intent.freeText } }), params: params, intent: { kind: intent.kind, freeText: intent.freeText } }
          : { id: sc.id, params: params, intent: { kind: intent.kind, freeText: intent.freeText } };
        global.Lab.api.run(body).then(function (r) {
          if (token !== c.token) return;
          r = normalizeResult(r);
          S.results[sc.id] = { result: r, key: k };
          stageCtl.setBusy(false); replay.removeAttribute('aria-disabled');
          c.result.show(r, { scenario: sc, health: S.health });
          drawList();
          U.scrollTo(resultRoot);
        }, function (e) {
          if (token !== c.token) return;
          stageCtl.setBusy(false); replay.removeAttribute('aria-disabled');
          c.result.fail(e.message, run);
        });
      }
    }

    drawList();
    var first = arg && findScenario(S, decodeURIComponent(arg)) ? decodeURIComponent(arg) : (S.currentId && findScenario(S, S.currentId) ? S.currentId : (visible()[0] || allScenarios(S)[0] || {}).id);
    if (first) select(first, false); else renderEmpty();

    return {
      update: function (a) { var id = a ? decodeURIComponent(a) : null; if (id && findScenario(S, id) && id !== S.currentId) select(id, false); },
      destroy: function () { if (cur && cur.result) cur.result.destroy(); if (mq.removeEventListener) mq.removeEventListener('change', syncRail); }
    };
  }

  global.Lab.views = global.Lab.views || {};
  global.Lab.views.scenarios = create;
  global.Lab.findScenario = findScenario;
})(window);

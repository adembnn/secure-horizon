/* Hold up Lab : vue « Monter une attaque » (côté attaquant). Banc d'essai de red team pour un produit défensif :
   les attaques ne visent que la chaîne de test et les contrats du Lab. Pas de champ libre pour écrire un message d'arnaque. */
(function (global) {
  'use strict';
  var D = global.Lab.dom, h = D.h, U = global.Lab.ui;

  var DOOR_FOR_LURE = { claim: 'site', mint: 'site', dex: 'site', message: 'walletconnect', support: 'walletconnect', wallet_send: 'wallet', exchange_withdraw: 'exchange' };
  var LURE_LABEL = { claim: 'Page de réclamation', mint: 'Page de mint', dex: 'Page d’échange', message: 'Message direct', support: 'Faux support', wallet_send: 'Envoi tapé dans le wallet', exchange_withdraw: 'Retrait depuis un exchange' };

  function lc(s) { s = D.str(s); return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function idOf(x) { return typeof x === 'string' ? x : (x.id != null ? x.id : x.value != null ? x.value : x.kind); }
  function labelOf(x) { return typeof x === 'string' ? D.pretty(x) : (x.label || D.pretty(idOf(x))); }
  function listOf(x) { return D.asArray(x); }
  function findBy(list, id) { for (var i = 0; i < list.length; i++) if (String(idOf(list[i])) === String(id)) return list[i]; return null; }

  function paramSpec(name, spec) {
    var values = Array.isArray(spec) ? spec : (spec && (spec.values || spec.allowed || spec.options || spec.enum)) || [];
    return {
      name: name, label: (spec && !Array.isArray(spec) && spec.label) || D.pretty(name),
      values: listOf(values).map(function (v) { return typeof v === 'object' ? { value: String(v.value != null ? v.value : v.id), label: v.label || String(v.value != null ? v.value : v.id) } : { value: String(v), label: String(v) }; })
    };
  }
  function dateText(v) {
    if (v == null || v === '') return '';
    var d = new Date(v);
    if (isNaN(d.getTime())) return D.str(v);
    return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function create(root) {
    var S = global.Lab.state;
    var A = S.attack = S.attack || { sel: null, built: null, builtKey: '', author: '', doorTouched: false };
    root.className = 'view atk';
    var seq = 0, cur = { result: null };

    root.appendChild(h('header', { class: 'view-head' },
      h('h2', null, 'Monter une attaque'),
      h('p', { class: 'lead' }, 'Tu règles l’attaque, tu la lances contre Hold up, puis tu changes de côté pour la vivre comme victime.')));
    root.appendChild(h('p', { class: 'safety' }, 'Banc d’essai de red team pour un produit défensif. Les attaques ne visent que la chaîne de test et les contrats du Lab, jamais un système réel.'));
    var stateBox = h('div', { class: 'atk-body' }, h('p', { class: 'progress-text' }, 'Chargement des options d’attaque…'));
    root.appendChild(stateBox);

    var logBox = h('section', { class: 'atk-log', 'aria-label': 'Attaques déjà tentées' });

    function load() {
      D.clear(stateBox).appendChild(h('p', { class: 'progress-text' }, 'Chargement des options d’attaque…'));
      global.Lab.api.attackOptions().then(function (opt) {
        global.Lab.setSample(global.Lab.api.attackIsSample());
        build(opt || {});
        loadLog();
      }, function (e) {
        D.clear(stateBox).appendChild(h('div', { class: 'error-box', role: 'alert' }, h('p', null, 'Les options d’attaque ne se chargent pas : ' + e.message), h('button', { type: 'button', class: 'btn-quiet', onclick: load }, 'Réessayer')));
      });
    }

    function build(opt) {
      D.clear(stateBox);
      var goals = listOf(opt.goals), techniques = listOf(opt.techniques), disguises = listOf(opt.disguises), lures = listOf(opt.lures);
      var doors = listOf(opt.doors).map(function (d) { return typeof d === 'string' ? { id: d, label: D.doorLabel(d) } : { id: idOf(d), label: d.label || D.doorLabel(idOf(d)) }; });
      if (!doors.length) doors = D.DOORS.map(function (d) { return { id: d.id, label: d.label }; });
      var pspecs = Object.keys(opt.params || {}).map(function (k) { return paramSpec(k, opt.params[k]); }).filter(function (p) { return p.values.length; });

      if (!goals.length || !techniques.length || !lures.length) {
        stateBox.appendChild(h('div', { class: 'empty' }, h('p', null, 'Le serveur n’a pas renvoyé assez d’options pour monter une attaque (objectifs, techniques ou appâts manquants).')));
        return;
      }

      var sel = A.sel;
      if (!sel) {
        var g = idOf(goals[0]);
        var t0 = techniques.filter(function (t) { return t.goal === g; })[0] || techniques[0];
        var l0 = lures[0];
        sel = A.sel = { goal: g, technique: idOf(t0), disguises: [], lure: l0.kind, brand: listOf(l0.brands)[0] || '', message: listOf(l0.messages).length ? idOf(listOf(l0.messages)[0]) : '', door: DOOR_FOR_LURE[l0.kind] || idOf(doors[0]), params: {} };
        pspecs.forEach(function (p) { sel.params[p.name] = p.values[0].value; });
      }

      var stepsBox = h('ol', { class: 'steps-list' });
      var summary = h('p', { class: 'sentence', 'aria-live': 'polite' });
      var missing = h('p', { class: 'muted small' });
      var refusal = h('p', { class: 'refusal', role: 'alert' });
      var launch = h('button', { type: 'button', class: 'btn btn-primary', onclick: launchAttack }, 'Lancer contre Hold up');
      var resultRoot = h('section', { class: 'result-wrap', 'aria-label': 'Moment de vérité' });
      var result = global.Lab.result.create(resultRoot);
      result.idle('Lance l’attaque pour voir ce que Hold up affiche.', 'Ici, ce que l’attaque ferait vraiment sur la chaîne de test.');
      cur.result = result;
      var after = h('div', { class: 'after', hidden: true });

      function techOf() { return findBy(techniques, sel.technique); }
      function lureOf() { return findBy(lures, sel.lure); }

      function sentence() {
        var goal = findBy(goals, sel.goal), tech = techOf(), lure = lureOf(), door = findBy(doors, sel.door);
        var parts = [];
        var todo = [];
        if (goal) parts.push('Tu veux ' + lc(labelOf(goal))); else todo.push('objectif');
        if (tech) parts.push('avec ' + lc(labelOf(tech))); else todo.push('technique');
        if (sel.disguises.length) parts.push('caché ainsi : ' + sel.disguises.map(function (d) { return lc(labelOf(findBy(disguises, d) || d)); }).join(', '));
        if (lure && sel.brand) parts.push('avec l’appât « ' + (lure.label || LURE_LABEL[lure.kind] || D.pretty(lure.kind)) + ' » de la marque ' + sel.brand); else todo.push('appât');
        if (door) parts.push('par la porte ' + lc(door.label)); else todo.push('porte');
        summary.textContent = (parts.length ? parts.join(', ') + '.' : 'Rien n’est encore choisi.');
        missing.textContent = todo.length ? 'Il reste à choisir : ' + todo.join(', ') + '.' : '';
        if (todo.length) launch.setAttribute('aria-disabled', 'true'); else launch.removeAttribute('aria-disabled');
      }

      function draw() {
        D.clear(stepsBox);
        /* 1. objectif */
        stepsBox.appendChild(h('li', { class: 'step' }, U.radioGroup('atk-goal', goals.map(function (x) { return { value: idOf(x), label: labelOf(x) }; }), sel.goal, function (v) {
          sel.goal = v;
          var ok = techniques.filter(function (t) { return t.goal === v; });
          if (!ok.some(function (t) { return idOf(t) === sel.technique; })) sel.technique = ok.length ? idOf(ok[0]) : '';
          pruneDisguises(); draw(); sentence();
        }, '1. Ce que tu veux prendre')));
        /* 2. technique */
        var techs = techniques.filter(function (t) { return t.goal === sel.goal; });
        var techFs = h('fieldset', { class: 'radios radios-notes' }, h('legend', null, '2. Comment'));
        techs.forEach(function (t) {
          var id = U.nextId('t'), inp = h('input', { type: 'radio', name: 'atk-tech', value: idOf(t), id: id });
          if (idOf(t) === sel.technique) inp.checked = true;
          inp.addEventListener('change', function () { sel.technique = idOf(t); pruneDisguises(); draw(); sentence(); });
          techFs.appendChild(h('label', { class: 'radio radio-note', for: id }, inp, h('span', null, h('b', null, labelOf(t)), t.note ? h('small', null, t.note) : null)));
        });
        if (!techs.length) techFs.appendChild(h('p', { class: 'muted' }, 'Aucune technique pour cet objectif.'));
        stepsBox.appendChild(h('li', { class: 'step' }, techFs));
        /* 3. déguisements */
        var applicable = disguises.filter(function (d) { return listOf(d.appliesTo).indexOf(sel.technique) >= 0; });
        var dgFs = h('fieldset', { class: 'radios radios-notes' }, h('legend', null, '3. Comment tu le caches'));
        applicable.forEach(function (d) {
          var id = U.nextId('d'), inp = h('input', { type: 'checkbox', value: idOf(d), id: id });
          inp.checked = sel.disguises.indexOf(idOf(d)) >= 0;
          inp.addEventListener('change', function () {
            var i = sel.disguises.indexOf(idOf(d));
            if (inp.checked && i < 0) sel.disguises.push(idOf(d)); else if (!inp.checked && i >= 0) sel.disguises.splice(i, 1);
            sentence();
          });
          dgFs.appendChild(h('label', { class: 'radio radio-note check-note', for: id }, inp, h('span', null, h('b', null, labelOf(d)), d.note ? h('small', null, d.note) : null)));
        });
        if (!applicable.length) dgFs.appendChild(h('p', { class: 'muted' }, 'Aucun déguisement ne s’applique à cette technique.'));
        stepsBox.appendChild(h('li', { class: 'step' }, dgFs));
        /* réglages fins */
        if (pspecs.length) {
          var pbox = h('div', { class: 'param-grid' }, pspecs.map(function (p) {
            return U.field(p.label, U.select(p.values, sel.params[p.name], function (v) { sel.params[p.name] = v; }));
          }));
          stepsBox.appendChild(h('li', { class: 'step step-sub' }, h('details', null, h('summary', null, 'Réglages fins (facultatif)'), pbox)));
        }
        /* 4. appât */
        var lureFs = h('fieldset', { class: 'lure' }, h('legend', null, '4. L’appât'));
        var lureSel = U.select(lures.map(function (l) { return { value: l.kind, label: l.label || LURE_LABEL[l.kind] || D.pretty(l.kind) }; }), sel.lure, function (v) {
          sel.lure = v; var L = lureOf();
          sel.brand = listOf(L.brands)[0] || ''; sel.message = listOf(L.messages).length ? idOf(listOf(L.messages)[0]) : '';
          if (!A.doorTouched && DOOR_FOR_LURE[v]) sel.door = DOOR_FOR_LURE[v];
          draw(); sentence();
        });
        lureFs.appendChild(U.field('Type d’appât', lureSel));
        var L = lureOf() || { brands: [], messages: [] };
        var brandSel = U.select(listOf(L.brands).map(function (b) { return { value: b, label: b }; }), sel.brand, function (v) { sel.brand = v; sentence(); });
        lureFs.appendChild(U.field('Marque inventée', brandSel, 'Toutes les marques sont fictives.'));
        var msgs = listOf(L.messages);
        if (msgs.length) {
          var mf = h('fieldset', { class: 'radios' }, h('legend', null, 'Message'));
          msgs.forEach(function (m) {
            var id = U.nextId('m'), inp = h('input', { type: 'radio', name: 'atk-msg', value: idOf(m), id: id });
            if (String(idOf(m)) === String(sel.message)) inp.checked = true;
            inp.addEventListener('change', function () { sel.message = idOf(m); sentence(); });
            mf.appendChild(h('label', { class: 'radio', for: id }, inp, h('span', null, '« ' + D.str(m.text) + ' »')));
          });
          lureFs.appendChild(mf);
        }
        stepsBox.appendChild(h('li', { class: 'step' }, lureFs));
        /* 5. porte */
        stepsBox.appendChild(h('li', { class: 'step' }, U.radioGroup('atk-door', doors.map(function (d) { return { value: d.id, label: d.label }; }), sel.door, function (v) { sel.door = v; A.doorTouched = true; sentence(); }, '5. Par quelle porte')));
      }
      function pruneDisguises() {
        var ok = disguises.filter(function (d) { return listOf(d.appliesTo).indexOf(sel.technique) >= 0; }).map(idOf);
        sel.disguises = sel.disguises.filter(function (d) { return ok.indexOf(d) >= 0; });
      }

      function payload() {
        var L = lureOf(), m = L ? findBy(listOf(L.messages), sel.message) : null;
        var lureObj = { kind: sel.lure, brand: sel.brand, message: sel.message };
        if (m && m.text) lureObj.messageText = m.text;
        return { goal: sel.goal, technique: sel.technique, disguises: sel.disguises.slice(), params: Object.assign({}, sel.params), lure: lureObj, door: sel.door };
      }
      function keyOfSel() { return JSON.stringify(payload()); }

      function setRefusal(msg) { refusal.textContent = msg || ''; }

      function launchAttack() {
        if (launch.getAttribute('aria-disabled') === 'true') return;
        var my = ++seq;
        setRefusal(''); after.hidden = true; D.clear(after);
        launch.setAttribute('aria-disabled', 'true'); launch.setAttribute('aria-busy', 'true');
        result.loading();
        var key = keyOfSel();
        var step = (A.built && A.builtKey === key) ? Promise.resolve(A.built) : global.Lab.api.attackBuild(payload());
        step.then(function (sc) {
          if (my !== seq) return null;
          if (!sc || sc.message && !sc.id) { throw Object.assign(new Error(sc && sc.message ? sc.message : 'Le serveur n’a pas construit cette attaque.'), { refusal: true }); }
          A.built = sc; A.builtKey = key;
          sc.label = sc.label || 'malveillant';
          var ex = S.custom.map(function (c) { return c.id; }).indexOf(sc.id);
          if (ex >= 0) S.custom[ex] = sc; else S.custom.unshift(sc);
          var intent = sc.intent || {};
          return global.Lab.api.run({ scenario: sc, params: sc.defaults || {}, intent: { kind: intent.kind, freeText: intent.freeText || '' } }).then(function (r) { return { sc: sc, r: r }; });
        }).then(function (o) {
          if (!o || my !== seq) return;
          launch.removeAttribute('aria-disabled'); launch.removeAttribute('aria-busy'); sentence();
          var r = global.Lab.normalizeResult(o.r);
          S.results[o.sc.id] = { result: r, key: JSON.stringify([o.sc.defaults || {}, { kind: (o.sc.intent || {}).kind, freeText: (o.sc.intent || {}).freeText || '' }]) };
          result.show(r, { scenario: o.sc, health: S.health });
          drawAfter(o.sc, r);
          U.scrollTo(resultRoot);
        }).catch(function (e) {
          if (my !== seq) return;
          launch.removeAttribute('aria-disabled'); launch.removeAttribute('aria-busy'); sentence();
          if (e.refusal) { result.idle('Lance l’attaque pour voir ce que Hold up affiche.', 'Ici, ce que l’attaque ferait vraiment sur la chaîne de test.'); setRefusal('Le serveur refuse cette combinaison : ' + e.message); }
          else result.fail(e.message, launchAttack);
        });
      }

      function drawAfter(sc, r) {
        D.clear(after); after.hidden = false;
        var author = h('input', { type: 'text', maxlength: '40', autocomplete: 'off', value: A.author || '' });
        author.addEventListener('input', function () { A.author = author.value; });
        var note = h('p', { class: 'save-note', 'aria-live': 'polite' });
        var save = h('button', { type: 'button', class: 'btn btn-secondary', onclick: function () {
          save.setAttribute('aria-disabled', 'true');
          global.Lab.api.attackSave({ scenario: sc, author: (A.author || '').trim() || 'anonyme' }).then(function (res) {
            save.removeAttribute('aria-disabled');
            if (res && res.message && !res.ok) { note.textContent = 'Refusé : ' + res.message; return; }
            note.textContent = 'Attaque enregistrée.';
            loadLog();
          }, function (e) { save.removeAttribute('aria-disabled'); note.textContent = 'L’enregistrement a échoué : ' + e.message; });
        } }, 'Enregistrer cette attaque');
        var swap = h('a', { class: 'btn btn-primary', href: '#/victime/scenarios/' + encodeURIComponent(sc.id), onclick: function () { S.currentId = sc.id; } }, 'Passer du côté victime');
        after.appendChild(h('div', { class: 'after-row' }, swap,
          h('div', { class: 'after-save' }, U.field('Ton prénom ou pseudo (pour le journal)', author), save), note));
      }

      draw(); sentence();

      var bench = h('aside', { class: 'bench', 'aria-label': 'Ton attaque' },
        h('h3', null, 'Ton attaque'), summary, missing, refusal, h('div', { class: 'panel-actions' }, launch));
      stateBox.appendChild(h('div', { class: 'atk-grid' }, stepsBox, bench));
      stateBox.appendChild(after);
      stateBox.appendChild(resultRoot);
      stateBox.appendChild(logBox);
    }

    function loadLog() {
      D.clear(logBox);
      logBox.appendChild(h('h3', null, 'Attaques déjà tentées', global.Lab.api.attackIsSample() ? h('span', { class: 'chip-sample' }, 'Données d’exemple') : null));
      logBox.appendChild(h('p', { class: 'progress-text' }, 'Chargement du journal…'));
      global.Lab.api.attackLog().then(function (log) {
        D.clear(logBox);
        logBox.appendChild(h('h3', null, 'Attaques déjà tentées', global.Lab.api.attackIsSample() ? h('span', { class: 'chip-sample' }, 'Données d’exemple') : null));
        var list = Array.isArray(log) ? log : (log && Array.isArray(log.entries) ? log.entries : (log && Array.isArray(log.log) ? log.log : []));
        if (!list.length) { logBox.appendChild(h('p', { class: 'placeholder' }, 'Personne n’a encore enregistré d’attaque. La tienne sera la première.')); return; }
        var rows = list.map(function (e) {
          var sc = e.scenario || null;
          var outcome = e.lastOutcome || e.outcome || (e.last && e.last.outcome) || (e.result && e.result.outcome) || '';
          var title = e.title || (sc && sc.title) || e.id || 'Attaque';
          var play = sc ? h('a', { href: '#/victime/scenarios/' + encodeURIComponent(sc.id), class: 'rowlink', onclick: function () { if (!global.Lab.findScenario(S, sc.id)) { sc.label = sc.label || 'malveillant'; S.custom.push(sc); } S.currentId = sc.id; } }, 'Jouer côté victime') : null;
          return h('tr', null, h('td', null, title), h('td', null, D.str(e.author) || 'anonyme'), h('td', { class: 'muted' }, dateText(e.savedAt || e.at || e.ts || e.createdAt)), h('td', null, outcome ? U.outcomePill(outcome) : '—'), h('td', null, play));
        });
        logBox.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'grid' },
          h('caption', { class: 'sr' }, 'Attaques enregistrées'),
          h('thead', null, h('tr', null, ['Attaque', 'Auteur', 'Quand', 'Dernier résultat', ''].map(function (t) { return h('th', { scope: 'col' }, t); }))),
          h('tbody', null, rows))));
      }, function (e) {
        D.clear(logBox);
        logBox.appendChild(h('h3', null, 'Attaques déjà tentées'));
        logBox.appendChild(h('div', { class: 'error-box', role: 'alert' }, h('p', null, 'Le journal est indisponible : ' + e.message), h('button', { type: 'button', class: 'btn-quiet', onclick: loadLog }, 'Réessayer')));
      });
    }

    load();
    return { destroy: function () { seq++; if (cur.result) cur.result.destroy(); global.Lab.setSample(global.Lab.api.mode === 'mock'); } };
  }

  global.Lab.views = global.Lab.views || {};
  global.Lab.views.attack = create;
})(window);

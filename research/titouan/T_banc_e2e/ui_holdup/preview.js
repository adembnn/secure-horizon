/* Prévisualisation : affiche l'écran de chaque fiche. Texte uniquement via textContent. */
(function () {
  'use strict';
  var D = window.HOLDUP_DATA;
  var grid = document.getElementById('grid');
  var selTheme = document.getElementById('theme');
  var selFric = document.getElementById('friction');
  var selMode = document.getElementById('mode');
  var q = document.getElementById('q');
  var live = [];
  var NAMES = { auto: 'Écran naturel de chaque fiche', danger: 'Danger', address: 'Sosie d’adresse', manipulation: 'Manipulation', attention: 'Attention', unknown: 'Vérification impossible', info: 'Information' };

  HoldUpDemo.MODES.forEach(function (m) {
    var o = document.createElement('option'); o.value = m; o.textContent = NAMES[m]; selMode.appendChild(o);
  });

  function friction() {
    if (selFric.value === 'wait30') return { type: 'wait', seconds: 30 };
    if (selFric.value === 'phrase') return { type: 'phrase', phrase: 'Je veux continuer malgré le danger' };
    return { type: 'none' };
  }

  function card(title, msg) {
    var c = document.createElement('section'); c.className = 'card';
    var h = document.createElement('h2'); h.textContent = title; c.appendChild(h);
    var host = document.createElement('div'); c.appendChild(host);
    var out = document.createElement('p'); out.className = 'out'; c.appendChild(out);
    out.textContent = 'Aucune décision pour l’instant.';
    var ctl = HoldUp.render(host, msg, { inline: true, noFocus: true, onDecision: function (d) {
      out.textContent = 'decision=' + d.decision + ' via=' + d.via + ' time_to_decision_ms=' + d.time_to_decision_ms + ' friction=' + d.friction.type;
    } });
    live.push(ctl);
    grid.appendChild(c);
  }

  function draw() {
    live.forEach(function (c) { c.destroy(); });
    live = [];
    grid.textContent = '';
    var theme = selTheme.value;
    if (theme) document.documentElement.setAttribute('data-theme', theme); else document.documentElement.removeAttribute('data-theme');
    var filt = q.value.trim().toLowerCase();
    var mode = selMode.value;
    var fr = friction();
    if (!filt || 'intention'.indexOf(filt) >= 0) card('Question d’intention', HoldUpDemo.intention(D.variables, theme));
    D.fiches.forEach(function (f) {
      if (filt && (f.id + ' ' + f.menace + ' ' + f.technique).toLowerCase().indexOf(filt) < 0) return;
      var m = mode === 'info' && !f.variante_info && f.gravite !== 'info' ? 'info' : mode;
      card(f.id + ' · ' + f.technique + ' · gravité ' + f.gravite, HoldUpDemo.fromFiche(f, D.variables, m, fr, theme));
      if (mode === 'auto' && f.variante_info) card(f.id + ' · variante courte (info)', HoldUpDemo.fromFiche(f, D.variables, 'info', fr, theme));
    });
  }
  [selTheme, selFric, selMode].forEach(function (s) { s.addEventListener('change', draw); });
  q.addEventListener('input', draw);
  draw();
})();

/* Hold up Lab : le moment de vérité. Deux colonnes qui se remplissent ensemble, puis une ligne de résultat.
   Colonne de gauche : la vraie surface de verdict (verdict.js, copie de ui_holdup), rendue comme l'extension le ferait.
   Colonne de droite : la vérité terrain de la chaîne de test. Tout texte passe par textContent. */
(function (global) {
  'use strict';
  var D = global.Lab.dom, h = D.h;

  var PATHS = {
    extension: 'vu par l’extension',
    rpc: 'vu par le RPC de protection',
    paste: 'vu quand l’adresse ou le message est collé',
    none: 'aucun chemin ne voit cette porte'
  };
  function frictionFor(level) {
    if (level === 'danger') return { type: 'wait', seconds: 30 };
    if (level === 'manipulation') return { type: 'wait', seconds: 600 };
    return { type: 'none' };
  }
  function currentTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    return t === 'dark' || t === 'light' ? t : '';
  }
  function holderName(holder, victim) {
    var s = D.str(holder);
    if (/victim|victime|^toi$/i.test(s) || (victim && s.toLowerCase() === String(victim).toLowerCase())) return 'Toi';
    if (/attack|attaquant/i.test(s)) return 'Attaquant';
    return D.shortAddr(s) || 'Autre';
  }
  function amountCell(v, sym) { return h('span', { class: 'num' }, D.fmtNum(v), sym ? h('small', null, ' ' + sym) : null); }
  function describeControl(c) {
    if (typeof c === 'string') return c;
    if (c && typeof c === 'object') {
      var main = c.what || c.label || c.text || c.description || '';
      var from = c.before != null ? c.before : c.from, to = c.after != null ? c.after : c.to;
      var tail = from != null || to != null ? (from != null ? D.shortAddr(from) : '?') + ' → ' + (to != null ? D.shortAddr(to) : '?') : '';
      var s = [main, tail].filter(Boolean).join(' : ');
      return s || JSON.stringify(c);
    }
    return String(c);
  }

  function create(root, opts) {
    opts = opts || {};
    var ctx = { scenario: null, health: null };
    var decisionLine, stale;

    var noteSlot = h('p', { class: 'moment-note', 'aria-live': 'polite' });
    var saysHead = h('h3', null, 'Ce que Hold up dit', h('span', { class: 'chip-sample only-sample' }, 'Données d’exemple'));
    var truthHead = h('h3', null, 'Ce qui se passe vraiment sur la chaîne si tu signes', h('span', { class: 'chip-sample only-sample' }, 'Données d’exemple'));
    var saysBody = h('div', { class: 'col-body' });
    var truthBody = h('div', { class: 'col-body' });
    var outcome = h('div', { class: 'outcome', 'data-kind': 'idle' });
    var extra = h('div', { class: 'moment-extra' });

    root.className = (root.className ? root.className + ' ' : '') + 'moment';
    root.setAttribute('aria-busy', 'false');
    D.clear(root);
    root.appendChild(noteSlot);
    root.appendChild(h('div', { class: 'moment-cols' },
      h('section', { class: 'col col-says', 'aria-label': 'Ce que Hold up dit' }, saysHead, saysBody),
      h('section', { class: 'col col-truth', 'aria-label': 'Ce qui se passe vraiment sur la chaîne' }, truthHead, truthBody)));
    root.appendChild(outcome);
    root.appendChild(extra);

    var hu = null;
    function destroySurface() { if (hu) { try { hu.destroy(); } catch (e) { /* déjà détruit */ } hu = null; } }

    function setOutcome(kind, word, text) {
      outcome.setAttribute('data-kind', kind);
      D.clear(outcome);
      outcome.appendChild(h('p', { class: 'outcome-word' }, word));
      outcome.appendChild(h('p', { class: 'outcome-text' }, text || ''));
    }

    function idle(msgSays, msgTruth) {
      destroySurface();
      root.setAttribute('aria-busy', 'false');
      root.classList.remove('is-stale');
      noteSlot.textContent = '';
      D.clear(saysBody).appendChild(h('p', { class: 'placeholder' }, msgSays || 'Rien n’a encore été joué.'));
      D.clear(truthBody).appendChild(h('p', { class: 'placeholder' }, msgTruth || 'Ici, ce que ta signature ferait sur la chaîne de test.'));
      setOutcome('idle', 'Résultat en attente', 'Il apparaît ici quand les deux colonnes sont remplies.');
      D.clear(extra);
    }

    function skeleton(lines) {
      var w = h('div', { class: 'skeleton', 'aria-hidden': 'true' });
      for (var i = 0; i < lines; i++) w.appendChild(h('i', { style: 'width:' + (92 - i * 13) + '%' }));
      return w;
    }
    function loading() {
      destroySurface();
      root.setAttribute('aria-busy', 'true');
      root.classList.remove('is-stale');
      noteSlot.textContent = '';
      D.clear(saysBody).appendChild(h('div', null, h('p', { class: 'progress-text' }, 'Hold up regarde la demande…'), skeleton(5)));
      D.clear(truthBody).appendChild(h('div', null, h('p', { class: 'progress-text' }, 'La chaîne de test joue la transaction…'), skeleton(5)));
      setOutcome('idle', 'En cours', 'Les deux colonnes se remplissent ensemble.');
      D.clear(extra);
    }

    function fail(message, onRetry) {
      destroySurface();
      root.setAttribute('aria-busy', 'false');
      D.clear(saysBody).appendChild(h('div', { class: 'error-box', role: 'alert' },
        h('p', null, message || 'Quelque chose a échoué.'),
        onRetry ? h('button', { type: 'button', class: 'btn-quiet', onclick: onRetry }, 'Réessayer') : null));
      D.clear(truthBody).appendChild(h('p', { class: 'placeholder' }, 'Rien à montrer : la demande n’a pas abouti.'));
      setOutcome('idle', 'Pas de résultat', 'La demande n’a pas abouti. Ce n’est ni un succès ni un échec de Hold up.');
      D.clear(extra);
    }

    function setStale(on) {
      root.classList.toggle('is-stale', !!on);
      noteSlot.textContent = on ? 'Les réglages ont changé depuis cet essai. Appuie sur Rejouer pour mettre le résultat à jour.' : '';
    }

    /* ----- colonne gauche ----- */
    function renderSays(r) {
      destroySurface();
      var v = r.verdict;
      D.clear(saysBody);
      var meta = h('p', { class: 'says-meta' },
        h('b', { class: 'lvl lvl-' + (v && v.level ? v.level : 'none') }, v ? D.levelWord(v.level) : (r.path === 'none' ? 'Non vu' : 'Rien affiché')),
        v && v.ms != null ? h('span', null, ' · répond en ' + D.fmtMs(v.ms)) : null,
        h('span', null, ' · ' + (PATHS[r.path] || 'chemin inconnu')));
      saysBody.appendChild(meta);

      if (!v) {
        var sc = ctx.scenario || {};
        var none = r.path === 'none';
        saysBody.appendChild(h('div', { class: 'nothing' },
          h('p', { class: 'nothing-title' }, none ? 'Hold up ne voit pas cette porte.' : 'Hold up n’a rien affiché.'),
          h('p', null, none
            ? (sc.coverageNote || 'Aucun chemin du produit ne reçoit cette demande. Rien n’est affiché à la victime.')
            : 'La victime signerait sans aucun avertissement.')));
      } else {
        var host = h('div', { class: 'hu-host' });
        saysBody.appendChild(host);
        var texts = v.texts || { croit: v.croit, reel: v.reel, action: v.conseil, danger: '' };
        var verdict = Object.assign({}, v, { texts: texts });
        var fr = frictionFor(v.level);
        var msg = { type: 'holdup.verdict', version: 1, id: r.id, mode: 'verdict', site: (ctx.scenario && ctx.scenario.staging && ctx.scenario.staging.brand) || '', theme: currentTheme(), friction: fr, verdict: verdict };
        hu = global.HoldUp.render(host, msg, {
          inline: true, noFocus: true,
          onDecision: function (d) {
            var what = d.decision === 'cancel' ? 'Annuler' : d.decision === 'continue' ? 'Continuer quand même' : d.decision === 'call_trusted' ? 'Appeler un proche' : d.decision;
            decisionLine.textContent = 'Tu as choisi « ' + what + ' » après ' + D.fmtMs(d.time_to_decision_ms) + '. Rien n’est signé dans le Lab.';
          }
        });
        saysBody.appendChild(h('p', { class: 'says-delay' }, fr.type === 'wait'
          ? 'Délai imposé avant « Continuer quand même » : ' + (fr.seconds >= 60 ? Math.round(fr.seconds / 60) + ' minutes' : fr.seconds + ' secondes') + '. Valeur de conception, pas une mesure.'
          : 'Aucun délai imposé avant « Continuer quand même ».'));
      }

      var p = r.verdictPlus;
      if (p) {
        var added = D.asArray(p.addedBy).filter(Boolean);
        var cur = v && v.level;
        if (p.level !== cur || added.length) {
          var t = 'Avec les détecteurs en cours d’intégration : ' + D.levelWord(p.level).toLowerCase();
          if (p.level !== cur) t += cur ? ' au lieu de ' + D.levelWord(cur).toLowerCase() : ' au lieu de rien';
          t += '.' + (added.length ? ' Ajouté par : ' + added.join(', ') + '.' : '');
          saysBody.appendChild(h('p', { class: 'says-plus' }, t));
        }
      }
      decisionLine = h('p', { class: 'says-decision', 'aria-live': 'polite' });
      saysBody.appendChild(decisionLine);
    }

    /* ----- colonne droite ----- */
    function renderTruth(r) {
      var t = r.truth;
      D.clear(truthBody);
      if (!t) { truthBody.appendChild(h('p', { class: 'placeholder' }, 'Le serveur n’a pas renvoyé de vérité terrain pour cette demande.')); return; }
      var victim = ctx.health && ctx.health.victim;
      var loss = Number(t.lossUsd) || 0;
      var effects = D.asArray(t.approvals).length || D.asArray(t.control).length;
      truthBody.appendChild(h('p', { class: 'loss' + (loss > 0 ? ' loss-yes' : '') },
        loss > 0 ? 'Tu perds ' + D.fmtUsd(loss) : effects ? 'Aucune perte, mais des droits changent' : 'Aucun effet sur tes actifs'));

      var deltas = D.asArray(t.deltas);
      if (deltas.length) {
        var rows = deltas.map(function (d) {
          var s = D.signOf(d.change);
          return h('tr', null,
            h('th', { scope: 'row' }, holderName(d.holder, victim)),
            h('td', null, amountCell(d.before, d.symbol)),
            h('td', null, amountCell(d.after, d.symbol)),
            h('td', { class: s < 0 ? 'neg' : s > 0 ? 'pos' : '' }, h('span', { class: 'num' }, D.fmtSigned(d.change))));
        });
        truthBody.appendChild(h('div', { class: 'sub' }, h('h4', null, 'Soldes avant et après'),
          h('table', { class: 'mini' }, h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Qui'), h('th', { scope: 'col' }, 'Avant'), h('th', { scope: 'col' }, 'Après'), h('th', { scope: 'col' }, 'Variation'))), h('tbody', null, rows))));
      }
      var ap = D.asArray(t.approvals);
      if (ap.length) {
        truthBody.appendChild(h('div', { class: 'sub' }, h('h4', null, 'Droits accordés'),
          h('ul', { class: 'plain' }, ap.map(function (a) {
            return h('li', null,
              h('span', { class: 'mono' }, D.shortAddr(a.spender)), ' peut dépenser ',
              h('b', { class: a.unlimited ? 'unl' : '' }, a.unlimited ? 'sans limite' : D.fmtNum(a.after)),
              ' sur ', h('span', { class: 'mono' }, D.shortAddr(a.token)),
              h('small', null, ' (avant : ' + D.str(a.before === '' || a.before == null ? 'rien' : D.fmtNum(a.before)) + ')'));
          }))));
      }
      var ctl = D.asArray(t.control);
      if (ctl.length) {
        truthBody.appendChild(h('div', { class: 'sub' }, h('h4', null, 'Contrôle qui change de mains'),
          h('ul', { class: 'plain' }, ctl.map(function (c) { return h('li', null, describeControl(c)); }))));
      }
      var txs = D.asArray(t.txs);
      if (txs.length) {
        truthBody.appendChild(h('div', { class: 'sub' }, h('h4', null, 'Transactions rejouées'),
          h('ol', { class: 'plain txs' }, txs.map(function (x) {
            return h('li', null, h('span', null, D.str(x.what) || 'transaction'),
              h('small', { class: 'mono' }, ' ' + D.shortHash(x.hash) + (x.from || x.to ? '  ' + D.shortAddr(x.from) + ' → ' + D.shortAddr(x.to) : '')));
          }))));
      }
      var flag = (t.executed ? 'Rejeu sur la chaîne de test : exécuté' : 'Rejeu sur la chaîne de test : non exécuté') + (t.reverted ? ', puis annulé (revert).' : '.');
      truthBody.appendChild(h('p', { class: 'truth-flags' }, flag + (t.error ? ' Erreur : ' + D.str(t.error) : '')));
    }

    function renderOutcome(r) {
      var info = D.outcomeInfo(r.outcome);
      setOutcome(info.cls, info.word, r.explanation || '');
    }

    function renderExtra(r) {
      D.clear(extra);
      var req;
      try { req = JSON.stringify(r.request, null, 2); } catch (e) { req = String(r.request); }
      extra.appendChild(h('details', { class: 'raw' }, h('summary', null, 'Requête rejouée par le Lab'), h('pre', { class: 'mono' }, req || '(vide)')));
    }

    function show(r, c) {
      ctx.scenario = (c && c.scenario) || ctx.scenario;
      ctx.health = (c && c.health) || ctx.health;
      root.setAttribute('aria-busy', 'false');
      root.classList.remove('is-stale');
      noteSlot.textContent = '';
      renderSays(r);
      renderTruth(r);
      renderOutcome(r);
      renderExtra(r);
    }

    idle();
    return { idle: idle, loading: loading, show: show, fail: fail, setStale: setStale, destroy: destroySurface, setContext: function (c) { ctx.scenario = c.scenario || null; ctx.health = c.health || ctx.health; } };
  }

  global.Lab.result = { create: create };
})(window);

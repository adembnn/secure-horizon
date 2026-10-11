/* Hold up Lab : vues « Tout jouer », « Scénario libre » et « Couverture » (côté victime). */
(function (global) {
  'use strict';
  var D = global.Lab.dom, h = D.h, U = global.Lab.ui;
  global.Lab.views = global.Lab.views || {};

  function sample() { return global.Lab.api.mode === 'mock'; }
  function truthWords(t) {
    if (!t) return '—';
    var parts = [];
    if (Number(t.lossUsd) > 0) parts.push('perte ' + D.fmtUsd(t.lossUsd));
    var ap = D.asArray(t.approvals);
    if (ap.some(function (a) { return a.unlimited; })) parts.push('droit illimité');
    else if (ap.length) parts.push('droit donné');
    if (D.asArray(t.control).length) parts.push('contrôle cédé');
    if (!parts.length) parts.push(t.executed === false ? 'non exécuté' : 'aucun effet');
    return parts.join(', ');
  }

  /* ================= Tout jouer ================= */
  function createAll(root) {
    var S = global.Lab.state;
    root.className = 'view all';
    var f = { door: '', family: '', failFirst: true };
    var seq = 0;

    var famOpts = [{ value: '', label: 'Toutes les familles' }], seen = {};
    S.scenarios.forEach(function (s) { if (!seen[s.family]) { seen[s.family] = 1; famOpts.push({ value: s.family, label: D.pretty(s.family) }); } });
    var doorSel = U.select([{ value: '', label: 'Toutes les portes' }].concat(D.DOORS.map(function (d) { return { value: d.id, label: d.label }; })), '', function (v) { f.door = v; count(); });
    var famSel = U.select(famOpts, '', function (v) { f.family = v; count(); });
    var failBox = h('input', { type: 'checkbox', checked: true });
    failBox.addEventListener('change', function () { f.failFirst = failBox.checked; if (last) draw(last); });
    var runBtn = h('button', { type: 'button', class: 'btn btn-primary', onclick: run }, 'Tout jouer');
    var countEl = h('span', { class: 'muted', 'aria-live': 'polite' });

    var out = h('div', { class: 'all-out' });
    root.appendChild(h('header', { class: 'view-head' },
      h('h2', null, 'Tout jouer'),
      h('p', { class: 'lead' }, 'Chaque scénario du catalogue est joué contre Hold up, sans que tu touches à rien. Les échecs sont comptés comme les réussites.')));
    root.appendChild(h('div', { class: 'toolbar' },
      U.field('Porte', doorSel), U.field('Famille', famSel),
      h('label', { class: 'check' }, failBox, h('span', null, 'Échecs en tête')),
      runBtn, countEl));
    root.appendChild(out);

    function matching() { return S.scenarios.filter(function (s) { return (!f.door || s.door === f.door) && (!f.family || s.family === f.family); }); }
    function count() { var n = matching().length; countEl.textContent = n + (n > 1 ? ' scénarios correspondent' : ' scénario correspond'); }
    count();

    var last = S.lastAll || null;
    function skeletonRows() {
      var t = h('div', { class: 'skeleton block', 'aria-hidden': 'true' });
      for (var i = 0; i < 8; i++) t.appendChild(h('i', { style: 'width:' + (96 - (i % 3) * 7) + '%' }));
      return t;
    }
    function placeholder() {
      D.clear(out).appendChild(h('div', { class: 'summary-reserve' },
        h('p', { class: 'placeholder' }, 'Appuie sur « Tout jouer ». Le décompte et le tableau apparaissent ici, sans que la page bouge.')));
    }

    function run() {
      var my = ++seq;
      runBtn.setAttribute('aria-disabled', 'true'); runBtn.setAttribute('aria-busy', 'true');
      D.clear(out).appendChild(h('div', { class: 'summary-reserve', 'aria-busy': 'true' },
        h('p', { class: 'progress-text' }, 'Les scénarios sont joués un par un sur la chaîne de test…'), skeletonRows()));
      var body = {}; if (f.door) body.door = f.door; if (f.family) body.family = f.family;
      global.Lab.api.runAll(body).then(function (res) {
        if (my !== seq) return;
        runBtn.removeAttribute('aria-disabled'); runBtn.removeAttribute('aria-busy');
        var results = D.asArray(res && res.results).map(global.Lab.normalizeResult);
        results.forEach(function (r) { S.results[r.id] = { result: r, key: null, fromAll: true }; });
        last = { results: results, summary: (res && res.summary) || {}, filter: Object.assign({}, f), sample: sample() };
        S.lastAll = last;
        draw(last);
        global.Lab.refreshStatus();
      }, function (e) {
        if (my !== seq) return;
        runBtn.removeAttribute('aria-disabled'); runBtn.removeAttribute('aria-busy');
        D.clear(out).appendChild(h('div', { class: 'error-box', role: 'alert' }, h('p', null, e.message || 'Le lot a échoué.'), h('button', { type: 'button', class: 'btn-quiet', onclick: run }, 'Réessayer')));
      });
    }

    function tally(results) {
      var T = { atk: 0, stopped: 0, missed: 0, inop: 0, honest: 0, passed: 0, falseAlarm: 0, uncov: 0, uncovAtk: 0, uncovOk: 0 };
      results.forEach(function (r) {
        var sc = global.Lab.findScenario(S, r.id) || {};
        var atk = sc.label === 'malveillant';
        if (r.outcome === 'non couvert') { T.uncov++; if (atk) T.uncovAtk++; else T.uncovOk++; return; }
        if (atk) T.atk++; else T.honest++;
        if (r.outcome === 'arrêté') T.stopped++;
        else if (r.outcome === 'raté') T.missed++;
        else if (r.outcome === 'attaque inopérante') T.inop++;
        else if (r.outcome === 'laissé passer à raison') T.passed++;
        else if (r.outcome === 'fausse alerte') T.falseAlarm++;
      });
      return T;
    }
    function nb(n, cls) { return h('b', { class: 'cnt' + (cls && n > 0 ? ' ' + cls : '') }, String(n)); }
    function plural(n, one, many) { return n > 1 ? many : one; }

    function draw(data) {
      D.clear(out);
      var res = data.results, sm = data.summary || {}, T = tally(res);
      var wrap = h('div', { class: 'summary-reserve' });
      if (data.sample) wrap.appendChild(h('p', { class: 'sample-line' }, U.sampleBanner(), ' Scénarios et chiffres d’exemple : ce n’est pas une mesure.'));
      if (!res.length) { wrap.appendChild(h('p', { class: 'placeholder' }, 'Aucun scénario ne correspond à ce filtre.')); out.appendChild(wrap); return; }

      var lines = h('div', { class: 'ledger' },
        h('p', null, 'Sur ', nb(T.atk), ' ' + plural(T.atk, 'attaque jouée', 'attaques jouées') + ' dans le champ du produit : ',
          nb(T.stopped), ' ' + plural(T.stopped, 'arrêtée', 'arrêtées') + ', ', nb(T.missed, 'bad'), ' ' + plural(T.missed, 'ratée', 'ratées') +
          (T.inop ? ', ' : ''), T.inop ? [nb(T.inop), ' ' + plural(T.inop, 'inopérante', 'inopérantes') + ' sur la chaîne'] : null, '.'),
        h('p', null, 'Sur ', nb(T.honest), ' ' + plural(T.honest, 'opération honnête', 'opérations honnêtes') + ' : ',
          nb(T.passed), ' ' + plural(T.passed, 'laissée passer à raison', 'laissées passer à raison') + ', ', nb(T.falseAlarm, 'bad'), ' ' + plural(T.falseAlarm, 'fausse alerte', 'fausses alertes') + '.'),
        h('p', { class: 'apart' }, 'À part : ', nb(T.uncov), ' ' + plural(T.uncov, 'scénario non couvert', 'scénarios non couverts') +
          ' (' + T.uncovAtk + ' ' + plural(T.uncovAtk, 'attaque', 'attaques') + ', ' + T.uncovOk + ' ' + plural(T.uncovOk, 'opération honnête', 'opérations honnêtes') + '). Ils ne sont comptés ni comme réussite ni comme échec.'),
        h('p', null, 'Temps de réponse : médiane ', h('b', null, D.fmtMs(sm.p50_ms)), ', 95e centile ', h('b', null, D.fmtMs(sm.p95_ms)), data.sample ? ' (valeurs d’exemple)' : '', '.'));
      wrap.appendChild(lines);

      /* le serveur résume aussi : on signale tout écart avec le décompte des lignes */
      var diff = [];
      if (sm.arretes != null && sm.arretes !== T.stopped) diff.push('arrêtés : ' + sm.arretes + ' côté serveur, ' + T.stopped + ' dans les lignes');
      if (sm.rates != null && sm.rates !== T.missed) diff.push('ratés : ' + sm.rates + ' côté serveur, ' + T.missed + ' dans les lignes');
      if (sm.fausses_alertes != null && sm.fausses_alertes !== T.falseAlarm) diff.push('fausses alertes : ' + sm.fausses_alertes + ' côté serveur, ' + T.falseAlarm + ' dans les lignes');
      if (sm.non_couverts != null && sm.non_couverts !== T.uncov) diff.push('non couverts : ' + sm.non_couverts + ' côté serveur, ' + T.uncov + ' dans les lignes');
      if (diff.length) wrap.appendChild(h('p', { class: 'warn-line', role: 'alert' }, 'Le résumé du serveur ne colle pas avec les lignes : ' + diff.join(' ; ') + '.'));
      if (S.health && S.health.outcomeRule) wrap.appendChild(h('p', { class: 'rule' }, h('b', null, 'Règle du résultat. '), D.str(typeof S.health.outcomeRule === 'string' ? S.health.outcomeRule : JSON.stringify(S.health.outcomeRule))));
      out.appendChild(wrap);

      var rows = res.slice();
      var bad = { 'raté': 0, 'fausse alerte': 0 };
      if (data.sort !== false && f.failFirst) rows.sort(function (a, b) { return (a.outcome in bad ? 0 : 1) - (b.outcome in bad ? 0 : 1); });
      var tbody = h('tbody', null, rows.map(function (r) {
        var sc = global.Lab.findScenario(S, r.id) || {};
        var v = r.verdict;
        var failing = r.outcome === 'raté' || r.outcome === 'fausse alerte';
        return h('tr', { class: failing ? 'row-fail' : '' },
          h('td', null, D.doorLabel(r.door || sc.door, true)),
          h('td', null, D.pretty(sc.family)),
          h('td', null, sc.label === 'malveillant' ? 'Attaque' : sc.label ? 'Honnête' : '—'),
          h('td', null, h('a', { href: '#/victime/scenarios/' + encodeURIComponent(r.id), class: 'rowlink' }, sc.title || r.id)),
          h('td', null, v ? D.levelWord(v.level) : (r.path === 'none' ? 'Non vu' : 'Rien affiché'), v && v.ms != null ? h('small', { class: 'muted' }, ' ' + D.fmtMs(v.ms)) : null),
          h('td', null, truthWords(r.truth)),
          h('td', null, U.outcomePill(r.outcome)));
      }));
      var table = h('table', { class: 'grid' },
        h('caption', { class: 'sr' }, 'Résultat de chaque scénario'),
        h('thead', null, h('tr', null, ['Porte', 'Famille', 'Nature', 'Scénario', 'Verdict', 'Sur la chaîne', 'Résultat'].map(function (t) { return h('th', { scope: 'col' }, t); }))),
        tbody);
      out.appendChild(h('div', { class: 'table-wrap', tabindex: '0', role: 'region', 'aria-label': 'Tableau des résultats, défilement possible' }, table));
    }

    if (last) draw(last); else placeholder();
    return { destroy: function () { seq++; } };
  }

  /* ================= Scénario libre ================= */
  var ADDR = /^0x[0-9a-fA-F]{40}$/;
  function pad32(hex) { return ('0000000000000000000000000000000000000000000000000000000000000000' + hex).slice(-64); }
  function toUnits(amount, decimals) {
    var s = String(amount).trim().replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    var parts = s.split('.'), frac = (parts[1] || '').slice(0, decimals);
    while (frac.length < decimals) frac += '0';
    return BigInt(parts[0] + frac);
  }
  function firstAddress(obj) {
    var found = '';
    (function walk(o) {
      if (found || o == null) return;
      if (typeof o === 'string') { if (ADDR.test(o)) found = o; return; }
      if (typeof o === 'object') Object.keys(o).forEach(function (k) { walk(o[k]); });
    })(obj);
    return found;
  }

  function createFree(root) {
    var S = global.Lab.state;
    root.className = 'view free';
    var victim = (S.health && S.health.victim) || '0x0000000000000000000000000000000000000001';
    var chainId = S.health && S.health.chain && S.health.chain.chainId;
    var token = firstAddress(S.health && S.health.contracts) || '';
    var st = { mode: 'form', kind: 'approve', door: 'site', intent: '', seq: 0 };

    var resultRoot = h('section', { class: 'result-wrap', 'aria-label': 'Moment de vérité' });
    var result = global.Lab.result.create(resultRoot);
    result.idle('Rien n’a encore été joué. Prépare une demande, puis lance-la.', 'Ici, ce que la demande ferait sur la chaîne de test.');

    var errors = h('ul', { class: 'errors', role: 'alert' });
    var formBox = h('div', { class: 'free-fields' });
    var rawArea = h('textarea', { rows: '9', class: 'mono', spellcheck: 'false' });
    rawArea.value = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_sendTransaction', params: [{ from: victim, to: token || '0x…', data: '0x' }] }, null, 2);
    var pasted = h('textarea', { rows: '3', maxlength: '2000', placeholder: 'Message reçu avant la demande, par exemple un message d’un faux support' });
    var ctxArea = h('textarea', { rows: '3', class: 'mono', spellcheck: 'false', placeholder: '{ }' });
    var intentSel = U.select([{ value: '', label: 'Je ne dis rien' }].concat(D.INTENTS), '', function (v) { st.intent = v; });
    var doorSel = U.select(D.DOORS.map(function (d) { return { value: d.id, label: d.label }; }), st.door, function (v) { st.door = v; });
    var fields = {};

    function inp(name, label, val, opts) {
      var i = h('input', { type: 'text', class: (opts && opts.mono) ? 'mono' : '', autocomplete: 'off', spellcheck: 'false', inputmode: opts && opts.inputmode });
      i.value = val == null ? '' : val; fields[name] = i;
      return U.field(label, i, opts && opts.hint);
    }
    function drawForm() {
      D.clear(formBox);
      fields = {};
      if (st.kind === 'send') {
        formBox.appendChild(inp('to', 'Destinataire', '', { mono: true }));
        formBox.appendChild(inp('amount', 'Montant', '1', { inputmode: 'decimal' }));
        formBox.appendChild(inp('token', 'Jeton (vide = monnaie native)', token, { mono: true, hint: 'Laisse vide pour envoyer la monnaie native de la chaîne de test.' }));
        formBox.appendChild(inp('decimals', 'Décimales du jeton', '6', { inputmode: 'numeric' }));
      } else if (st.kind === 'approve') {
        formBox.appendChild(inp('token', 'Jeton', token, { mono: true }));
        formBox.appendChild(inp('spender', 'Adresse qui reçoit le droit', '', { mono: true }));
        formBox.appendChild(inp('amount', 'Montant du droit (vide = illimité)', '', { inputmode: 'decimal' }));
        formBox.appendChild(inp('decimals', 'Décimales du jeton', '6', { inputmode: 'numeric' }));
      } else {
        formBox.appendChild(inp('token', 'Contrat du jeton', token, { mono: true }));
        formBox.appendChild(inp('spender', 'Adresse qui reçoit le droit', '', { mono: true }));
        formBox.appendChild(inp('amount', 'Montant (vide = illimité)', '', { inputmode: 'decimal' }));
        formBox.appendChild(inp('decimals', 'Décimales du jeton', '6', { inputmode: 'numeric' }));
      }
    }
    var kindSel = U.select([{ value: 'approve', label: 'Donner un droit (approve)' }, { value: 'send', label: 'Envoyer' }, { value: 'typed', label: 'Signer un message typé (Permit)' }], st.kind, function (v) { st.kind = v; drawForm(); });
    var modeBox = h('div', { class: 'seg', role: 'group', 'aria-label': 'Façon de décrire la demande' });
    var formWrap = h('div', { class: 'free-form' }, U.field('Type de demande', kindSel), formBox);
    var rawWrap = h('div', { class: 'free-raw' }, U.field('Requête JSON-RPC brute', rawArea, 'Un objet { method, params }. Rien n’est envoyé ailleurs que vers la chaîne de test du Lab.'));
    function drawMode() {
      D.clear(modeBox);
      [['form', 'Formulaire'], ['raw', 'JSON-RPC brut']].forEach(function (m) {
        modeBox.appendChild(h('button', { type: 'button', 'aria-pressed': String(st.mode === m[0]), onclick: function () { st.mode = m[0]; drawMode(); } }, m[1]));
      });
      formWrap.hidden = st.mode !== 'form'; rawWrap.hidden = st.mode !== 'raw';
    }
    drawForm(); drawMode();

    var runBtn = h('button', { type: 'button', class: 'btn btn-primary', onclick: run }, 'Lancer');

    function val(n) { return fields[n] ? fields[n].value.trim() : ''; }
    function buildRequest(errs) {
      if (st.mode === 'raw') {
        try {
          var o = JSON.parse(rawArea.value);
          if (!o || typeof o !== 'object' || typeof o.method !== 'string') errs.push({ el: rawArea, msg: 'La requête doit être un objet JSON avec une « method ».' });
          return o;
        } catch (e) { errs.push({ el: rawArea, msg: 'JSON invalide : ' + e.message }); return null; }
      }
      var dec = Number(val('decimals') || 6);
      if (!isFinite(dec) || dec < 0 || dec > 30 || Math.floor(dec) !== dec) errs.push({ el: fields.decimals, msg: 'Les décimales sont un entier entre 0 et 30.' });
      var tx = { from: victim };
      if (chainId != null) tx.chainId = '0x' + Number(chainId).toString(16);
      if (st.kind === 'send') {
        if (!ADDR.test(val('to'))) errs.push({ el: fields.to, msg: 'Le destinataire doit être une adresse 0x suivie de 40 caractères.' });
        var u = toUnits(val('amount'), val('token') ? dec : 18);
        if (u == null || u === 0n) errs.push({ el: fields.amount, msg: 'Le montant doit être un nombre positif.' });
        if (val('token') && !ADDR.test(val('token'))) errs.push({ el: fields.token, msg: 'Le jeton doit être une adresse 0x ou rester vide.' });
        if (errs.length) return null;
        if (val('token')) { tx.to = val('token'); tx.data = '0xa9059cbb' + pad32(val('to').slice(2).toLowerCase()) + pad32(u.toString(16)); }
        else { tx.to = val('to'); tx.value = '0x' + u.toString(16); }
        return { jsonrpc: '2.0', id: 1, method: 'eth_sendTransaction', params: [tx] };
      }
      if (!ADDR.test(val('token'))) errs.push({ el: fields.token, msg: 'Le jeton doit être une adresse 0x suivie de 40 caractères.' });
      if (!ADDR.test(val('spender'))) errs.push({ el: fields.spender, msg: 'L’adresse qui reçoit le droit doit être une adresse 0x valide.' });
      var amount;
      if (val('amount')) { amount = toUnits(val('amount'), dec); if (amount == null) errs.push({ el: fields.amount, msg: 'Le montant doit être un nombre, ou rester vide pour « illimité ».' }); }
      else amount = (1n << 256n) - 1n;
      if (errs.length) return null;
      if (st.kind === 'approve') {
        tx.to = val('token'); tx.data = '0x095ea7b3' + pad32(val('spender').slice(2).toLowerCase()) + pad32(amount.toString(16));
        return { jsonrpc: '2.0', id: 1, method: 'eth_sendTransaction', params: [tx] };
      }
      var typed = {
        types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
          Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
        primaryType: 'Permit', domain: { name: 'Jeton de test', version: '1', chainId: chainId != null ? Number(chainId) : 1, verifyingContract: val('token') },
        message: { owner: victim, spender: val('spender'), value: amount.toString(), nonce: '0', deadline: '4102444800' }
      };
      return { jsonrpc: '2.0', id: 1, method: 'eth_signTypedData_v4', params: [victim, JSON.stringify(typed)] };
    }

    function run() {
      D.clear(errors);
      var errs = [];
      var req = buildRequest(errs);
      var ctxObj;
      if (ctxArea.value.trim()) { try { ctxObj = JSON.parse(ctxArea.value); } catch (e) { errs.push({ el: ctxArea, msg: 'Le contexte n’est pas du JSON valide : ' + e.message }); } }
      if (errs.length) {
        errs.forEach(function (e) { errors.appendChild(h('li', null, e.msg)); });
        if (errs[0].el && errs[0].el.focus) errs[0].el.focus();
        return;
      }
      var body = { door: st.door, request: req };
      if (st.intent) body.intent = { kind: st.intent, freeText: '' };
      if (pasted.value.trim()) body.pastedMessage = pasted.value.trim();
      if (ctxObj !== undefined) body.context = ctxObj;
      var my = ++st.seq;
      runBtn.setAttribute('aria-disabled', 'true');
      result.loading();
      global.Lab.api.custom(body).then(function (r) {
        if (my !== st.seq) return;
        runBtn.removeAttribute('aria-disabled');
        result.show(global.Lab.normalizeResult(r), { scenario: {}, health: S.health });
        U.scrollTo(resultRoot);
      }, function (e) {
        if (my !== st.seq) return;
        runBtn.removeAttribute('aria-disabled');
        result.fail(e.message, run);
      });
    }

    root.appendChild(h('header', { class: 'view-head' },
      h('h2', null, 'Scénario libre'),
      h('p', { class: 'lead' }, 'Décris n’importe quelle demande, comme le ferait un attaquant, et regarde ce que Hold up en dit.')));
    root.appendChild(h('div', { class: 'free-grid' },
      h('div', { class: 'free-left' }, modeBox, formWrap, rawWrap),
      h('div', { class: 'free-right' },
        U.field('Porte d’entrée', doorSel),
        U.field('Ce que la victime dit vouloir faire', intentSel, 'Facultatif. Mentir ne peut que renforcer l’alerte.'),
        U.field('Message collé', pasted),
        h('details', { class: 'adv' }, h('summary', null, 'Contexte avancé'), U.field('Contexte (JSON)', ctxArea, 'Transmis tel quel au serveur.')),
        errors,
        h('div', { class: 'panel-actions' }, runBtn))));
    root.appendChild(resultRoot);
    return { destroy: function () { st.seq++; result.destroy(); } };
  }

  /* ================= Couverture ================= */
  function createCoverage(root) {
    var S = global.Lab.state;
    root.className = 'view cov';
    var fams = [], seen = {};
    S.scenarios.forEach(function (s) { if (!seen[s.family]) { seen[s.family] = 1; fams.push(s.family); } });
    var by = {};
    S.scenarios.forEach(function (s) { var k = s.family + '|' + s.door; (by[k] = by[k] || []).push(s); });

    root.appendChild(h('header', { class: 'view-head' },
      h('h2', null, 'Couverture'),
      h('p', { class: 'lead' }, 'Chaque case dit combien de scénarios existent pour une famille et une porte, et si Hold up voit cette porte. Une case en pointillés signale un angle mort connu.')));
    if (sample()) root.appendChild(h('p', { class: 'sample-line' }, U.sampleBanner(), ' Catalogue d’exemple.'));

    var thead = h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Famille'), D.DOORS.map(function (d) { return h('th', { scope: 'col' }, d.label); })));
    var gaps = [];
    var tbody = h('tbody', null, fams.map(function (fam) {
      return h('tr', null, h('th', { scope: 'row' }, D.pretty(fam)), D.DOORS.map(function (d) {
        var list = by[fam + '|' + d.id] || [];
        if (!list.length) return h('td', { class: 'cell cell-empty' }, h('span', { class: 'muted' }, 'Aucun scénario'));
        var unc = list.filter(function (s) { return s.covered === false; });
        var atk = list.filter(function (s) { return s.label === 'malveillant'; }).length, ok = list.length - atk;
        var cls = unc.length === list.length ? 'cell-unc' : unc.length ? 'cell-part' : 'cell-cov';
        unc.forEach(function (s) { gaps.push(s); });
        var desc = [];
        if (atk) desc.push(atk + (atk > 1 ? ' attaques' : ' attaque'));
        if (ok) desc.push(ok + (ok > 1 ? ' honnêtes' : ' honnête'));
        var a = h('a', { href: '#/victime/scenarios/' + encodeURIComponent(list[0].id), class: 'cell-link', onclick: function () { S.filter.door = d.id; S.filter.family = fam; S.filter.label = ''; } },
          h('span', { class: 'cell-count' }, desc.join(', ')),
          h('span', { class: 'cell-state' }, unc.length === list.length ? 'Non couvert' : unc.length ? unc.length + ' sur ' + list.length + ' non couverts' : 'Couvert'));
        return h('td', { class: 'cell ' + cls }, a);
      }));
    }));
    root.appendChild(h('div', { class: 'table-wrap' }, h('table', { class: 'matrix' }, h('caption', { class: 'sr' }, 'Familles par porte'), thead, tbody)));

    root.appendChild(h('div', { class: 'cov-list' },
      h('h3', null, 'Ce que le produit ne voit pas'),
      gaps.length ? h('ul', { class: 'plain' }, gaps.map(function (s) {
        return h('li', null, h('b', null, s.title), ' (' + D.doorLabel(s.door, true) + '). ', s.coverageNote || 'Pas de note fournie par le serveur.');
      })) : h('p', { class: 'muted' }, 'Le catalogue ne signale aucune porte non couverte. Cela ne veut pas dire que tout est vu : seuls les scénarios écrits sont listés.')));
    return { destroy: function () {} };
  }

  global.Lab.views.all = createAll;
  global.Lab.views.free = createFree;
  global.Lab.views.coverage = createCoverage;
})(window);

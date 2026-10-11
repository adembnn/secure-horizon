/* Hold up - RPC guard : decision page for one held transaction.
   The verdict window is ui_holdup/verdict.js (HoldUp.render, contract in UI_CONTRAT.md) ; this file only talks to the local proxy.
   The countdown comes from the deadline stored by the proxy ; the proxy checks it again on "continue". Text through textContent only. */
(function () {
  'use strict';
  var m = location.pathname.match(/^\/hold\/([0-9a-f]{16})$/);
  var token = new URLSearchParams(location.search).get('t') || '';
  var root = document.getElementById('holdup');
  var extra = document.getElementById('extra');
  var current = null;
  var note = '';

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function api(method, path, body) {
    var opt = { method: method, headers: {}, cache: 'no-store' };
    if (method === 'POST') { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(Object.assign({ t: token }, body || {})); }
    return fetch(path, opt).then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); });
  }

  /* A closed state (cancelled, sent, expired, bad link) : same window, no decision left to take. */
  function final(tag, title, lines, hash) {
    if (current) { current.destroy(); current = null; }
    extra.textContent = '';
    root.className = 'hu inline neutral';
    root.textContent = '';
    var win = root.appendChild(el('section', 'win'));
    win.setAttribute('role', 'status');
    win.setAttribute('data-screen', 'closed');
    win.appendChild(el('span', 'tag', tag));
    win.appendChild(el('h1', '', title));
    (lines || []).forEach(function (l) { win.appendChild(el('p', 'final-note', l)); });
    if (hash) { var h = win.appendChild(el('p', 'final-hash', hash)); h.setAttribute('data-raw', '1'); }
    var a = win.appendChild(el('a', 'final-link', 'Voir les demandes retenues'));
    a.setAttribute('href', '/');
  }

  function closed(h) {
    if (h.status === 'sent') return final('Envoyé', 'Tu as choisi de continuer. L’opération est envoyée.', ['Ton portefeuille peut encore l’afficher comme échouée.'], h.sent_hash);
    if (h.status === 'cancelled') return final('Annulé', 'Opération annulée. Rien n’est parti.', ['Tu peux fermer cette page.']);
    return final('Expiré', 'Cette demande a expiré. Rien n’est parti.', ['Pour la refaire, relance l’opération depuis ton portefeuille.']);
  }

  function showVerdict(h) {
    if (h.status !== 'pending') return closed(h);
    var left = Math.ceil((h.deadline - h.now) / 1000);
    var msg = {
      type: 'holdup.verdict', version: 1, id: h.id, mode: 'verdict',
      friction: left > 0 ? { type: 'wait', seconds: left } : { type: 'none' },
      verdict: h.verdict
    };
    if (current) current.destroy();
    current = HoldUp.render(root, msg, { inline: true, onDecision: function (d) { onDecision(h, d); } });
    extra.textContent = '';
    if (note) extra.appendChild(el('p', '', note));
    if (!h.intent) {
      var b = extra.appendChild(el('button', '', 'Dire ce que je voulais faire'));
      b.setAttribute('type', 'button');
      b.setAttribute('data-action', 'ask-intent');
      b.addEventListener('click', function () { showIntent(h); });
    }
  }

  /* The RPC door sees the transaction after the signature : the intent question is asked here, then the comparison runs again. */
  function showIntent(h) {
    if (current) current.destroy();
    extra.textContent = '';
    current = HoldUp.render(root, { type: 'holdup.verdict', version: 1, id: h.id, mode: 'intention', question: 'Que voulais-tu faire avec cette opération ?' },
      { inline: true, onDecision: function (d) { onDecision(h, d); } });
  }

  function onDecision(h, d) {
    if (d.decision === 'cancel') return api('POST', '/holds/' + h.id + '/cancel', {}).then(function (r) { if (r.body.id) closed(r.body); else load(); }, load);
    if (d.decision === 'intent') {
      return api('POST', '/holds/' + h.id + '/intent', { intent: d.intent, intent_message: d.intent_message || '' }).then(function (r) {
        note = 'Ta réponse est prise en compte.';
        if (r.body.id) showVerdict(r.body); else load();
      }, load);
    }
    if (d.decision === 'call_trusted') { note = 'Appelle un proche. L’opération reste retenue ici.'; return load(); }
    if (d.decision === 'continue') return tryContinue(h, 0);
  }

  function tryContinue(h, attempt) {
    return api('POST', '/holds/' + h.id + '/continue', {}).then(function (r) {
      if (r.status === 200) return closed(r.body);
      if (r.status === 409 && attempt < 3) return setTimeout(function () { tryContinue(h, attempt + 1); }, Math.min(5000, (r.body.remaining_ms || 0) + 200));
      note = r.body.message || '';
      load();
    }, load);
  }

  function load() {
    if (!m || !token) return final('Lien', 'Ce lien n’est pas valide.', ['Ouvre le lien donné par ton portefeuille, en entier.']);
    api('GET', '/holds/' + m[1] + '?t=' + encodeURIComponent(token)).then(function (r) {
      if (r.status !== 200) return final('Lien', 'Ce lien n’est pas valide.', ['La demande a peut-être expiré. Rien n’est parti.']);
      showVerdict(r.body);
    }, function () { final('Hors ligne', 'Hold up ne répond pas.', ['Rien n’est parti. Relance Hold up, puis recharge cette page.']); });
  }
  load();
})();

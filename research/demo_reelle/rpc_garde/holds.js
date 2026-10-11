/* Hold up - RPC guard : the presenter's list of held transactions. Refreshes every 1.5 s and can jump to each new hold as it arrives. */
(function () {
  'use strict';
  var list = document.getElementById('list'), noteEl = document.getElementById('note'), newest = document.getElementById('newest'), auto = document.getElementById('auto');
  var TAG = { danger: 'Danger', manipulation: 'Manipulation', attention: 'Attention', unknown: 'Non vérifié' };
  var STATUS = { pending: 'en attente', sent: 'envoyée', cancelled: 'annulée', expired: 'expirée' };
  var known = null; /* ids seen at the first load : only holds that arrive later are opened automatically */

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function clock(ms) { return new Date(ms).toLocaleTimeString('fr-FR'); }

  function draw(data) {
    var holds = data.holds || [];
    var pending = holds.filter(function (h) { return h.status === 'pending'; });
    noteEl.textContent = holds.length ? (pending.length ? pending.length + ' en attente de ta décision.' : 'Aucune demande en attente.') : 'Aucune demande retenue pour l’instant.';
    if (pending.length) { newest.hidden = false; newest.setAttribute('href', pending[0].url); } else newest.hidden = true;
    list.textContent = '';
    holds.forEach(function (h) {
      var li = list.appendChild(el('li'));
      var top = li.appendChild(el('div', 'top'));
      var level = h.niveau === 'info' ? 'Information' : (TAG[h.level] || 'Attention');
      top.appendChild(el('span', 'tag' + (h.level === 'danger' || h.level === 'manipulation' ? ' red' : ''), level));
      top.appendChild(el('span', '', clock(h.created_at) + ', ' + (STATUS[h.status] || h.status)));
      li.appendChild(el('p', 'line', h.line));
      if (h.status === 'pending') { var a = li.appendChild(el('a', '', 'Ouvrir cette demande')); a.setAttribute('href', h.url); }
    });
    if (known === null) known = {};
    else if (auto.checked) {
      for (var i = 0; i < pending.length; i++) if (!known[pending[i].id]) { location.href = pending[i].url; break; }
    }
    holds.forEach(function (h) { known[h.id] = 1; });
  }

  function tick() {
    fetch('/holds', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(draw, function () { noteEl.textContent = 'Hold up ne répond pas.'; });
  }
  tick();
  setInterval(tick, 1500);
})();

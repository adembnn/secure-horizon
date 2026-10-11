/* Hold up Lab : coque de l'application. État, navigation par hash, ligne d'état de la chaîne, remise à zéro, thème. */
(function (global) {
  'use strict';
  var Lab = global.Lab, D = Lab.dom, h = D.h;

  var S = Lab.state = {
    health: null, scenarios: [], custom: [], params: {}, intents: {}, results: {},
    filter: { door: '', family: '', label: '' }, currentId: null, lastAll: null, attack: null
  };

  var els = {};
  var viewHandle = null, viewName = '';

  /* ---------- données d'exemple : repère global ---------- */
  Lab.setSample = function (on) { document.body.setAttribute('data-sample', on ? 'true' : 'false'); };

  /* ---------- ligne d'état ---------- */
  function statusLine() {
    var hl = S.health, api = Lab.api;
    D.clear(els.status);
    if (!hl) { els.status.appendChild(h('span', null, 'Connexion au serveur du Lab…')); return; }
    var c = hl.chain || {};
    var det = hl.product && hl.product.detectors;
    var detN = Array.isArray(det) ? det.length : (typeof det === 'number' ? det : null);
    var items = [
      ['Chaîne', api.mode === 'mock' ? 'aucune (exemple)' : D.str(c.mode || 'inconnue')],
      ['Réseau', c.chainId != null ? String(c.chainId) : '—'],
      ['Bloc', c.block != null ? D.fmtNum(c.block) : '—'],
      ['Victime', hl.victim ? D.shortAddr(hl.victim) : '—']
    ];
    if (detN != null) items.push(['Détecteurs', String(detN)]);
    items.forEach(function (it, i) {
      els.status.appendChild(h('span', { class: 'st-item' }, h('span', { class: 'st-k' }, it[0] + ' '), h('b', { class: it[0] === 'Victime' ? 'mono' : '' }, it[1])));
    });
  }
  Lab.refreshStatus = function () {
    return Lab.api.health().then(function (hl) { S.health = hl; statusLine(); }, function () { /* on garde l'ancien état */ });
  };

  function drawBanner() {
    D.clear(els.banner);
    var api = Lab.api;
    if (api.mode !== 'mock') { els.banner.hidden = true; return; }
    els.banner.hidden = false;
    els.banner.appendChild(h('p', null, h('b', null, 'Données d’exemple. '),
      api.forced ? 'Mode exemple demandé dans l’adresse. ' : 'Le serveur du Lab ne répond pas sur ' + api.baseLabel + '. ',
      'Ce que tu vois n’est pas une mesure.'));
    if (!api.forced) els.banner.appendChild(h('button', { type: 'button', class: 'btn-quiet', onclick: retryServer }, 'Réessayer le serveur'));
  }

  /* ---------- navigation ---------- */
  var TABS = {
    victime: [['scenarios', 'Vivre un scénario'], ['tout', 'Tout jouer'], ['libre', 'Scénario libre'], ['couverture', 'Couverture']],
    attaquant: [['monter', 'Monter une attaque']]
  };
  function parse() {
    var parts = (global.location.hash || '').replace(/^#\/?/, '').split('/');
    var seat = parts[0] === 'attaquant' ? 'attaquant' : 'victime';
    var tab = parts[1] || (seat === 'attaquant' ? 'monter' : 'scenarios');
    if (!TABS[seat].some(function (t) { return t[0] === tab; })) tab = TABS[seat][0][0];
    return { seat: seat, tab: tab, arg: parts.slice(2).join('/') || '' };
  }
  function drawNav(route) {
    D.clear(els.seats);
    [['victime', 'Je suis la victime'], ['attaquant', 'Je suis l’attaquant']].forEach(function (s) {
      els.seats.appendChild(h('a', { href: '#/' + s[0], 'aria-current': route.seat === s[0] ? 'true' : null, class: 'seat' }, s[1]));
    });
    D.clear(els.tabs);
    TABS[route.seat].forEach(function (t) {
      els.tabs.appendChild(h('a', { href: '#/' + route.seat + '/' + t[0], 'aria-current': route.tab === t[0] ? 'page' : null, class: 'tab' }, t[1]));
    });
    els.tabs.setAttribute('data-seat', route.seat);
    document.body.setAttribute('data-seat', route.seat);
  }

  function route() {
    if (!S.health) return;
    var r = parse();
    var name = r.seat + '/' + r.tab;
    drawNav(r);
    if (viewHandle && name === viewName && viewHandle.update && name === 'victime/scenarios') { viewHandle.update(r.arg); return; }
    if (viewHandle && viewHandle.destroy) viewHandle.destroy();
    viewHandle = null; viewName = name;
    D.clear(els.main);
    Lab.setSample(Lab.api.mode === 'mock');
    var mk = { 'victime/scenarios': 'scenarios', 'victime/tout': 'all', 'victime/libre': 'free', 'victime/couverture': 'coverage', 'attaquant/monter': 'attack' }[name];
    var root = h('div', { class: 'view' });
    els.main.appendChild(root);
    try { viewHandle = Lab.views[mk](root, r.arg); }
    catch (e) {
      D.clear(els.main).appendChild(h('div', { class: 'error-box', role: 'alert' }, h('p', null, 'Cette vue ne s’est pas affichée : ' + e.message)));
    }
    global.document.title = 'Hold up Lab';
  }

  /* ---------- remise à zéro ---------- */
  function doReset() {
    els.resetBtn.setAttribute('aria-disabled', 'true');
    els.notice.textContent = 'Remise à zéro de la chaîne de test…';
    Lab.api.reset().then(function () {
      S.results = {}; S.params = {}; S.intents = {}; S.lastAll = null;
      els.resetBtn.removeAttribute('aria-disabled');
      els.notice.textContent = 'Chaîne de test remise à zéro. Les résultats affichés ont été effacés.';
      return Lab.refreshStatus();
    }).then(function () { viewName = ''; route(); }, function (e) {
      els.resetBtn.removeAttribute('aria-disabled');
      els.notice.textContent = 'La remise à zéro a échoué : ' + e.message;
    });
  }

  /* ---------- thème ---------- */
  var themes = ['auto', 'light', 'dark'], themeLabels = { auto: 'Système', light: 'Clair', dark: 'Sombre' };
  var themeIdx = 1;
  function applyTheme() {
    var t = themes[themeIdx];
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    els.themeBtn.textContent = themeLabels[t]; els.themeBtn.setAttribute('aria-label', 'Thème : ' + themeLabels[t].toLowerCase() + '. Changer.');
  }

  /* ---------- démarrage ---------- */
  function normScenario(s) {
    s.staging = s.staging || { kind: 'site', brand: 'Marque inventée', pitch: '', buttonLabel: 'Continuer' };
    s.editable = D.asArray(s.editable); s.defaults = s.defaults || {}; s.intent = s.intent || { kind: '', freeText: '' };
    s.label = s.label === 'malveillant' ? 'malveillant' : 'benin';
    return s;
  }
  function loadAll() {
    D.clear(els.main).appendChild(h('p', { class: 'boot' }, 'Connexion au serveur du Lab…'));
    return Lab.api.detect().then(function (d) {
      S.health = d.health; statusLine(); drawBanner(); Lab.setSample(d.mode === 'mock');
      return Lab.api.scenarios();
    }).then(function (list) {
      S.scenarios = D.asArray(list).map(normScenario);
      route();
    }).catch(function (e) {
      S.health = S.health || null;
      D.clear(els.main).appendChild(h('div', { class: 'error-box', role: 'alert' },
        h('p', null, 'Impossible de charger les scénarios : ' + e.message),
        h('button', { type: 'button', class: 'btn-quiet', onclick: loadAll }, 'Réessayer')));
    });
  }
  function retryServer() {
    S.results = {}; S.params = {}; S.intents = {}; S.lastAll = null; S.currentId = null; S.custom = []; S.attack = null;
    viewName = '';
    loadAll();
  }

  function init() {
    els.status = document.getElementById('status-line');
    els.banner = document.getElementById('banner');
    els.seats = document.getElementById('seats');
    els.tabs = document.getElementById('tabs');
    els.main = document.getElementById('main');
    els.notice = document.getElementById('notice');
    els.resetBtn = document.getElementById('reset-btn');
    els.themeBtn = document.getElementById('theme-btn');
    els.resetBtn.addEventListener('click', function () { if (els.resetBtn.getAttribute('aria-disabled') !== 'true') doReset(); });
    els.themeBtn.addEventListener('click', function () { themeIdx = (themeIdx + 1) % themes.length; applyTheme(); viewName = ''; route(); });
    applyTheme();
    global.addEventListener('hashchange', route);
    statusLine();
    loadAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window);

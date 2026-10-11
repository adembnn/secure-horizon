/* Hold up Lab : petits outils DOM et de format. Tout texte passe par textContent / createTextNode. */
(function (global) {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';

  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    if (typeof c === 'string' || typeof c === 'number') { el.appendChild(document.createTextNode(String(c))); return; }
    el.appendChild(c);
  }
  function setAttrs(el, attrs) {
    if (!attrs) return;
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.setAttribute('class', v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'text') el.textContent = String(v);
      else if (k === 'value') el.value = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    });
  }
  function h(tag, attrs) {
    var el = document.createElement(tag);
    setAttrs(el, attrs);
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function svg(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    setAttrs(el, attrs);
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  /* ---------- formats ---------- */
  var nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6, useGrouping: 'always' });
  var usd = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0, useGrouping: 'always' });
  function fmtNum(x) {
    if (x == null || x === '') return '—';
    var n = typeof x === 'number' ? x : Number(String(x).replace(/\s/g, '').replace(',', '.'));
    if (!isFinite(n) || (typeof x === 'string' && !/^[-+−]?[\d\s.,]+$/.test(x.trim()))) return String(x);
    return nf.format(n);
  }
  function fmtSigned(x) {
    if (x == null || x === '') return '—';
    var s = String(x).trim().replace('-', '−');
    var n = Number(String(x).replace(/\s/g, '').replace(',', '.').replace('−', '-'));
    if (!isFinite(n)) return s;
    return (n > 0 ? '+' : n < 0 ? '−' : '') + nf.format(Math.abs(n));
  }
  function signOf(x) {
    var n = Number(String(x).replace(/\s/g, '').replace(',', '.').replace('−', '-'));
    return isFinite(n) ? (n < 0 ? -1 : n > 0 ? 1 : 0) : 0;
  }
  function fmtUsd(n) { return usd.format(Number(n) || 0) + ' $'; }
  function fmtMs(ms) {
    if (ms == null || !isFinite(ms)) return '—';
    return ms < 1000 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(1).replace('.', ',') + ' s';
  }
  function shortAddr(a) {
    a = String(a || '');
    return /^0x[0-9a-fA-F]{40}$/.test(a) ? a.slice(0, 6) + '…' + a.slice(-4) : a;
  }
  function shortHash(a) {
    a = String(a || '');
    return /^0x[0-9a-fA-F]{64}$/.test(a) ? a.slice(0, 8) + '…' + a.slice(-6) : shortAddr(a);
  }
  function pretty(s) {
    s = String(s == null ? '' : s).replace(/[_-]+/g, ' ').trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  var DOORS = [
    { id: 'site', label: 'Site web', short: 'Site', hint: 'Un site demande au wallet' },
    { id: 'wallet', label: 'Wallet', short: 'Wallet', hint: 'Un envoi tapé dans le wallet' },
    { id: 'walletconnect', label: 'WalletConnect / mobile', short: 'WalletConnect', hint: 'Une demande reçue sur le téléphone' },
    { id: 'exchange', label: 'Exchange', short: 'Exchange', hint: 'Un retrait depuis une plateforme' }
  ];
  function doorLabel(id, short) {
    for (var i = 0; i < DOORS.length; i++) if (DOORS[i].id === id) return short ? DOORS[i].short : DOORS[i].label;
    return pretty(id);
  }
  var LEVELS = { danger: 'Danger', attention: 'Attention', manipulation: 'Manipulation', unknown: 'Non vérifié' };
  function levelWord(l) { return l ? (LEVELS[l] || pretty(l)) : 'Rien affiché'; }

  var OUTCOMES = {
    'arrêté': { word: 'Arrêté', cls: 'ok' },
    'raté': { word: 'Raté', cls: 'bad' },
    'fausse alerte': { word: 'Fausse alerte', cls: 'bad' },
    'laissé passer à raison': { word: 'Laissé passer à raison', cls: 'ok' },
    'non couvert': { word: 'Non couvert', cls: 'none' },
    'attaque inopérante': { word: 'Attaque inopérante', cls: 'none' }
  };
  function outcomeInfo(o) { return OUTCOMES[o] || { word: o ? pretty(o) : 'Sans résultat', cls: 'none' }; }

  var INTENTS = [
    { value: 'pay_someone', label: 'Payer quelqu’un' },
    { value: 'send_to_my_account', label: 'Envoyer vers mon compte' },
    { value: 'buy_or_swap', label: 'Acheter ou échanger' },
    { value: 'connect_or_accept_offer', label: 'Me connecter ou réclamer une offre' },
    { value: 'asked_by_someone', label: 'On m’a demandé de le faire' }
  ];
  function intentLabel(k) {
    for (var i = 0; i < INTENTS.length; i++) if (INTENTS[i].value === k) return INTENTS[i].label;
    return pretty(k);
  }

  function hash(s) {
    var x = 2166136261;
    s = String(s);
    for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
    return x >>> 0;
  }
  function slug(s) { return String(s || 'marque').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'marque'; }
  function asArray(x) { return Array.isArray(x) ? x : x == null ? [] : [x]; }
  function str(x) { return x == null ? '' : String(x); }

  global.Lab = global.Lab || {};
  global.Lab.dom = {
    h: h, svg: svg, clear: clear, append: append,
    fmtNum: fmtNum, fmtSigned: fmtSigned, signOf: signOf, fmtUsd: fmtUsd, fmtMs: fmtMs,
    shortAddr: shortAddr, shortHash: shortHash, pretty: pretty,
    DOORS: DOORS, doorLabel: doorLabel, levelWord: levelWord, outcomeInfo: outcomeInfo, OUTCOMES: OUTCOMES,
    INTENTS: INTENTS, intentLabel: intentLabel, hash: hash, slug: slug, asArray: asArray, str: str
  };
})(window);

/* Hold up - toolbar popup. Pause is per site (chrome.storage.local `paused` : origins). Classic script ; the pure helpers are tested in Node. */
(function (global) {
  'use strict';
  const MAX_PAUSED = 200;
  const NOTHING = 'Rien à vérifier ici';
  const BY_LEVEL = { attention: 'match', danger: 'mismatch', manipulation: 'mismatch', unknown: 'unverifiable' };

  function originOf(url) { try { return new URL(url).origin; } catch (_) { return ''; } }
  // -> { kind : 'active' | 'paused' | 'nothing', origin, host }
  function stateOf(url, paused) {
    let u; try { u = new URL(url); } catch (_) { return { kind: 'nothing', origin: '', host: '' }; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return { kind: 'nothing', origin: '', host: '' };
    if (u.hostname === 'chromewebstore.google.com' || (u.hostname === 'chrome.google.com' && u.pathname.indexOf('/webstore') === 0)) return { kind: 'nothing', origin: '', host: '' };
    const list = Array.isArray(paused) ? paused : [];
    return { kind: list.includes(u.origin) ? 'paused' : 'active', origin: u.origin, host: u.host };
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  // The last check of this site, as one sentence ('' when there is none).
  function lastLine(log, origin) {
    if (!Array.isArray(log) || !origin) return '';
    let e = null;
    for (const x of log) {
      if (!x || x.type !== 'decision' || (x.decision !== 'confirm' && x.decision !== 'cancel') || x.origin !== origin) continue;
      if (!e || Number(x.ts) >= Number(e.ts)) e = x;
    }
    if (!e) return '';
    const d = new Date(Number(e.ts)), at = 'À ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ', ';
    const outcome = e.outcome === 'match' || e.outcome === 'mismatch' || e.outcome === 'unverifiable' ? e.outcome : (BY_LEVEL[e.level] || 'unverifiable');
    if (outcome === 'match') return at + 'ça correspondait.';
    if (outcome === 'unverifiable') return at + 'je n’ai pas pu vérifier. ' + (e.decision === 'confirm' ? 'Tu as envoyé quand même.' : 'Tu n’as rien envoyé.');
    if (e.decision === 'confirm') {
      if (e.sent && e.sent.limited) return at + 'ça ne correspondait pas. Tu as limité l’autorisation à ' + e.sent.sent + '.';
      return at + 'ça ne correspondait pas. Tu as envoyé quand même.';
    }
    return at + 'ça ne correspondait pas. Tu n’as rien envoyé.';
  }
  global.HoldupPopup = { stateOf, lastLine, originOf };

  const doc = global.document;
  if (!(typeof doc !== 'undefined' && doc.querySelector && doc.querySelector('.hu-pop')) || !global.chrome) return;
  const $ = (id) => doc.getElementById(id);
  const store = global.chrome.storage.local;
  let tab = null, paused = [], log = [];

  function draw() {
    const s = stateOf(tab && tab.url, paused), box = $('site');
    const state = $('state'), detail = $('detail'), last = $('last');
    while (last.firstChild) last.removeChild(last.firstChild);
    if (s.kind === 'nothing') {
      box.checked = false; box.disabled = true; $('on').textContent = ''; $('off').textContent = NOTHING;
      state.textContent = 'Je ne peux pas agir sur cette page.';
      detail.textContent = 'C’est une page du navigateur. Aucun site ne peut s’y servir de ton portefeuille.';
      return;
    }
    box.disabled = false; box.checked = s.kind === 'active'; $('on').textContent = 'Actif'; $('off').textContent = 'En pause';
    if (s.kind === 'active') { state.textContent = 'Je vérifie ce site.'; detail.textContent = s.host; }
    else { state.textContent = 'En pause sur ce site.'; detail.textContent = 'Ce que demande ' + s.host + ' va droit à ton portefeuille.'; }
    const line = lastLine(log, s.origin);
    if (line) { const p = doc.createElement('p'); p.className = 'hu-last'; p.textContent = line; last.appendChild(p); }
  }
  $('site').addEventListener('change', async () => {
    const s = stateOf(tab && tab.url, paused); if (s.kind === 'nothing') return;
    let list = paused.filter((o) => o !== s.origin);
    if (!$('site').checked) list = list.concat(s.origin).slice(-MAX_PAUSED);
    paused = list;
    try { await store.set({ paused }); } catch (_) {}
    draw();
    try { global.chrome.runtime.sendMessage({ type: 'hu.badge', tabId: tab && tab.id, origin: s.origin }, () => { void global.chrome.runtime.lastError; }); } catch (_) {}
  });
  $('journal').addEventListener('click', () => {
    const windowId = tab && tab.windowId;
    try { global.chrome.sidePanel.open({ windowId }); } catch (_) {}
    global.close();
  });
  $('settings').addEventListener('click', () => { try { global.chrome.runtime.openOptionsPage(); } catch (_) {} });
  (async () => {
    try { [tab] = await global.chrome.tabs.query({ active: true, currentWindow: true }); } catch (_) {}
    try { const g = await store.get(['paused', 'log']); paused = Array.isArray(g.paused) ? g.paused : []; log = Array.isArray(g.log) ? g.log : []; } catch (_) {}
    draw();
  })();
})(typeof window !== 'undefined' ? window : globalThis);

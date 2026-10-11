/* Hold up - panneau latéral (chrome.sidePanel). Ouvert par un clic sur l'icône de l'extension, jamais par une demande de page :
 * les décisions de signature restent dans la fenêtre séparée.
 * Il LIT le journal déjà tenu par gatekeeper.js (chrome.storage.local, clé "log") et n'écrit rien d'autre que son effacement.
 * « Ce que tu as laissé ouvert » : les autorisations que la personne a laissées partir sur l'onglet affiché, avec « Retirer l’autorisation »
 * (branchement : gatekeeper.js, REVOKE_BRANCHEMENT.md). Le panneau n'envoie jamais une demande au service worker, seulement un onglet et un
 * identifiant (hu.revoke.*) : la demande de retrait est relue dans storage.session par le service worker, montrée par le portefeuille,
 * signée par la personne. Hold up ne signe rien.
 * Ne stocke ni la phrase écrite ni une adresse. Tout est dessiné avec textContent : aucune donnée de page n'entre dans le HTML. */
(function (global) {
  'use strict';
  const MAX_ROWS = 20;
  // The one word on every withdrawal button. The founder may change it here, nowhere else.
  const REVOKE_LABEL = 'Retirer l’autorisation';
  // Every one-click withdrawal of the tab, one after the other : the wallet still asks for each of them.
  const REVOKE_ALL_LABEL = 'Tout retirer';
  const BY_LEVEL = { attention: 'match', danger: 'mismatch', manipulation: 'mismatch', unknown: 'unverifiable' };
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const SAID = {
    sending: 'En cours…', waiting: 'En attente…', done: 'Retirée', before: 'Ton portefeuille te demandera de confirmer.',
    beforeAll: 'Tout retirer : une confirmation par autorisation, l’une après l’autre.', none: 'Tu n’as rien laissé ouvert sur cet onglet.',
    rejected: 'Tu as refusé dans ton portefeuille. L’autorisation est toujours là.', error: 'Le retrait n’a pas pu partir. L’autorisation est toujours là.',
    no_wallet: 'Ouvre à nouveau le site ou ton portefeuille, puis reviens ici.',
    still: 'Retrait envoyé. L’autorisation est encore là pour l’instant.', unread: 'Retrait envoyé. Je n’ai pas pu relire l’autorisation.'
  };
  const CLASSIFIER = { clef: 'Dernière phrase : intention classée par Clef.', jev: 'Dernière phrase : intention classée par Jev.' };

  // The site, never cut from the right : a long host keeps its last labels whole and loses the middle.
  function siteLabel(origin) {
    let host = '';
    try { host = new URL(String(origin)).host; } catch (_) { host = ''; }
    if (!host) host = String(origin || '').replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').split(/[/?#]/)[0];
    if (!host) return 'Site inconnu';
    if (host.length <= 40) return host;
    const labels = host.split('.');
    let tail = labels.slice(-2).join('.');
    for (let i = 3; i <= labels.length; i++) { const t = labels.slice(-i).join('.'); if (t.length > 24) break; tail = t; }
    const room = 40 - tail.length - 1;
    return (room > 0 ? host.slice(0, room) : '') + '…' + tail;
  }
  const pad2 = (n) => (n < 10 ? '0' : '') + n;
  function clock(ts) { const d = new Date(ts); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function startOfDay(now) { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function dayLabel(ts, now) {
    const t0 = startOfDay(now), d0 = startOfDay(ts);
    if (d0 >= t0) return 'Aujourd’hui';
    const y = new Date(t0); y.setDate(y.getDate() - 1);
    if (d0 >= y.getTime()) return 'Hier';
    const d = new Date(ts); return d.getDate() + ' ' + MONTHS[d.getMonth()];
  }

  // One journal line of a decision -> { strong, words, negative } : what the window answered, then what the person did.
  function verdictWords(e) {
    const o = ['match', 'mismatch', 'unverifiable'].includes(e.outcome) ? e.outcome : BY_LEVEL[e.level] || '';
    const sent = e.decision === 'confirm';
    if (e.sent && e.sent.limited === true && typeof e.sent.sent === 'string') return { strong: 'Ça ne correspondait pas.', words: 'Tu as limité l’autorisation à ' + e.sent.sent + '.', negative: true };
    const did = sent ? 'Tu as envoyé quand même.' : 'Tu n’as rien envoyé.';
    if (o === 'match') return { strong: '', words: sent ? 'Ça correspondait.' : 'Ça correspondait. Tu n’as rien envoyé.', negative: false };
    if (o === 'mismatch') return { strong: 'Ça ne correspondait pas.', words: did, negative: true };
    if (o === 'unverifiable') return { strong: '', words: 'Je n’ai pas pu vérifier. ' + did, negative: false };
    return { strong: '', words: did, negative: false };
  }

  // log -> { days: [{ label, rows }], rows (newest first, at most 20, only what the panel shows), today: { checked, cancelled } }
  function summarize(log, now) {
    const list = Array.isArray(log) ? log : [];
    const day = startOfDay(now), rows = [], days = [];
    let checked = 0, cancelled = 0;
    const push = (e, r) => {
      r.key = e.ts + '|' + r.site + '|' + r.words; rows.push(r);
      const label = dayLabel(e.ts, now); let g = days[days.length - 1];
      if (!g || g.label !== label) { g = { label, rows: [] }; days.push(g); }
      g.rows.push(r);
    };
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (!e || typeof e !== 'object' || typeof e.ts !== 'number') continue;
      if (e.type === 'verdict' && e.ts >= day) checked++;
      if (e.type === 'revocation' && rows.length < MAX_ROWS) {
        push(e, { site: siteLabel(e.origin), strong: '', words: 'Retrait d’une autorisation : ' + (e.wallet === 'submitted' ? 'envoyé à ton portefeuille.' : e.wallet === 'rejected' ? 'refusé dans ton portefeuille.' : 'pas envoyé.'), time: clock(e.ts), negative: false });
        continue;
      }
      if (e.type !== 'decision' || (e.decision !== 'confirm' && e.decision !== 'cancel')) continue;
      if (e.decision === 'cancel' && e.ts >= day) cancelled++;
      if (rows.length < MAX_ROWS) { const v = verdictWords(e); push(e, { site: siteLabel(e.origin), strong: v.strong, words: v.words, time: clock(e.ts), negative: v.negative }); }
    }
    return { days, rows, today: { checked, cancelled } };
  }

  // How the last written sentence was read (the journal keeps it on the intent stage).
  function lastClassifier(log) {
    const list = Array.isArray(log) ? log : [];
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (e && e.type === 'decision' && e.stage === 'intent' && e.decision === 'answer') return CLASSIFIER[e.classifier] || 'Dernière phrase : intention classée sans modèle.';
    }
    return '';
  }

  function mount(doc, root, env) {
    const el = (tag, text, cls) => { const e = doc.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
    const clear = () => { while (root.firstChild) root.removeChild(root.firstChild); };
    const word = (text, fn) => { const b = el('button', text, 'hu-word'); b.setAttribute('type', 'button'); b.addEventListener('click', fn); return b; };
    const state = {}; // grant id -> 'busy' | 'wait' | 'done' | the last thing said about its withdrawal (kept across redraws)
    let confirmDelete = 0, prevKeys = null, running = false;
    const tellWorker = async (msg) => { try { return await env.chrome.runtime.sendMessage(msg); } catch (_) { return null; } };
    const later = (fn, ms) => (env.setTimeout || global.setTimeout || function () {})(fn, ms);
    if (!/\bhu-panel\b/.test(root.className || '')) root.className = ((root.className || '') + ' hu hu-panel is-opening').trim();
    let opening = /\bis-opening\b/.test(root.className || '');

    // the tab this panel sits next to : the rights are kept per tab
    async function tabId() { try { const t = await env.chrome.tabs.query({ active: true, currentWindow: true }); return t && t[0] && Number.isInteger(t[0].id) ? t[0].id : null; } catch (_) { return null; } }
    async function revoke(g) {
      state[g.id] = 'busy'; await render();
      const r = await tellWorker({ type: 'hu.revoke.send', tabId: g.tabId, id: g.id, index: 0 });
      const st = r && r.state === 'error' && (r.code === 'no_provider' || r.code === 'origin_changed' || r.code === 'no_answer') ? 'no_wallet' : r && typeof r.state === 'string' ? r.state : 'error';
      if (st === 'submitted') { check(g, 0); return st; }
      state[g.id] = SAID[st] || SAID.error; await render();
      return st;
    }
    // « Tout retirer » : the same withdrawal as one button, for every right still open, in the order shown. One at a time, so the
    // wallet shows one request after the other. A refusal only skips that right ; a wallet that cannot be reached stops the rest.
    async function revokeAll(list) {
      if (running) return;
      running = true;
      for (const g of list) state[g.id] = 'wait';
      try {
        for (let i = 0; i < list.length; i++) {
          const st = await revoke(list[i]);
          if (st === 'no_wallet') { for (const g of list.slice(i + 1)) state[g.id] = SAID.no_wallet; break; }
        }
      } finally { running = false; for (const g of list) if (state[g.id] === 'wait') delete state[g.id]; }
      await render();
    }
    // After the wallet took the withdrawal : the right is read again (allowance) until it is zero, a few times.
    function check(g, n) {
      later(async () => {
        const r = await tellWorker({ type: 'hu.revoke.check', tabId: g.tabId, id: g.id });
        const s = r && r.state;
        if (s === 'zero') { state[g.id] = 'done'; return render(); }
        if (n >= 5) { state[g.id] = s === 'still_active' ? SAID.still : SAID.unread; return render(); }
        check(g, n + 1);
      }, n === 0 ? 1500 : 4000);
    }

    async function render() {
      let log = [], active = false, partial = {}, grants = [];
      try { log = (await env.chrome.storage.local.get('log')).log; } catch (_) {}
      try { const p = (await env.chrome.storage.local.get('partial')).partial; if (p && typeof p === 'object') partial = p; } catch (_) {}
      try { const r = await env.chrome.runtime.sendMessage({ type: 'hu.poll', rid: 'etat-0000000000' }); active = !!r && typeof r.state === 'string'; } catch (_) { active = false; }
      { const tab = await tabId(); const r = tab == null ? null : await tellWorker({ type: 'hu.revoke.get', tabId: tab });
        if (r && Array.isArray(r.grants)) grants = r.grants.filter((g) => g && typeof g.id === 'string' && g.result && typeof g.result === 'object').map((g) => {
          const res = g.result, can = typeof g.can === 'string' ? g.can : typeof res.can === 'string' ? res.can : '';
          return { id: g.id, tabId: tab, site: g.origin, can: can.slice(0, 80), oneClick: res.status === 'revocable' && res.oneClick === true, says: typeof res.says === 'string' ? res.says : '', steps: Array.isArray(res.steps) ? res.steps : [], wallet: g.wallet };
        }); }
      const s = summarize(log, env.now());
      const cut = Object.keys(partial).filter((k) => Number.isFinite(partial[k])).sort((a, b) => partial[b] - partial[a]).slice(0, 5);
      const classifier = lastClassifier(log);
      clear();
      const top = el('div', null, 'hu-top');
      top.appendChild(el('span', 'Hold up', 'hu-name')); top.appendChild(el('span', active ? 'Actif' : 'Inactif', 'hu-2'));
      root.appendChild(top);
      const sc = el('div', null, 'hu-scroll');
      const empty = !s.rows.length && !grants.length;
      if (!empty) { sc.setAttribute('tabindex', '0'); sc.setAttribute('role', 'region'); sc.setAttribute('aria-label', 'Journal'); }
      if (cut.length) sc.appendChild(el('p', 'Sur ' + cut.map(siteLabel).join(', ') + ', je n’ai pas pu me placer devant le portefeuille. Des demandes peuvent partir sans vérification.', 'hu-error'));

      if (empty) {
        sc.appendChild(el('p', 'Rien à raconter pour l’instant.', 'hu-state'));
        sc.appendChild(el('p', 'Dès qu’un site veut utiliser ton portefeuille, je te demande ce que tu veux faire. Ce que je réponds s’écrit ici.', 'hu-empty'));
      } else {
        sc.appendChild(el('h2', 'Ce que tu as laissé ouvert', 'hu-h'));
        if (!grants.length) sc.appendChild(el('p', SAID.none, 'hu-2'));
        else {
          const ul = el('ul');
          for (const g of grants.slice(0, 10)) {
            const st = state[g.id], site = siteLabel(g.site);
            const waiting = st === 'wait', busy = st === 'busy' || waiting, done = st === 'done';
            const li = el('li', null, 'hu-right' + (busy ? ' is-busy' : '') + (done ? ' is-done' : ''));
            if (done) {
              li.appendChild(el('p', site + ' ne peut plus rien dépenser.', 'hu-2'));
              const n = el('span', SAID.done, 'hu-right-note'); n.setAttribute('role', 'status'); li.appendChild(n);
            } else {
              li.appendChild(el('p', g.can ? site + ' peut dépenser ' + g.can + '.' : site + ' a une autorisation sur ton compte.'));
              if (busy) { const n = el('span', waiting ? SAID.waiting : SAID.sending, 'hu-right-note'); n.setAttribute('role', 'status'); li.appendChild(n); }
              else if (g.oneClick) {
                li.appendChild(word(REVOKE_LABEL, () => revoke(g)));
                const said = st || (g.wallet === 'rejected' ? SAID.rejected : g.wallet === 'submitted' ? SAID.still : '');
                if (said) li.appendChild(el('p', said, 'hu-note'));
              } else {
                // an off-chain signature, or several steps : explained, never a button that would promise more than it does
                if (g.says) li.appendChild(el('p', String(g.says).slice(0, 400), 'hu-note'));
                for (const t of g.steps.slice(0, 6)) li.appendChild(el('p', String(t).slice(0, 240), 'hu-note'));
              }
            }
            ul.appendChild(li);
          }
          sc.appendChild(ul);
          // only what one transaction really removes, and only what is still open and not already on its way
          const open = grants.slice(0, 10).filter((g) => g.oneClick && state[g.id] !== 'busy' && state[g.id] !== 'wait' && state[g.id] !== 'done');
          const all = !running && open.length > 1;
          if (all) sc.appendChild(el('div', null, 'hu-right')).appendChild(word(REVOKE_ALL_LABEL + ' (' + open.length + ')', () => revokeAll(open)));
          sc.appendChild(el('p', SAID.before, 'hu-note'));
          if (all) sc.appendChild(el('p', SAID.beforeAll, 'hu-note'));
        }
        for (const d of s.days) {
          sc.appendChild(el('h2', d.label, 'hu-h'));
          const ol = el('ol');
          for (const r of d.rows) {
            const li = el('li', null, 'hu-entry'); r.li = li;
            li.appendChild(el('time', r.time));
            const p = el('p'); p.appendChild(el('span', r.site, 'hu-entry-site'));
            const what = el('span', null, 'hu-entry-what');
            if (r.strong) what.appendChild(el('strong', r.strong));
            what.appendChild(el('span', (r.strong ? ' ' : '') + r.words));
            p.appendChild(what); li.appendChild(p); ol.appendChild(li);
          }
          sc.appendChild(ol);
        }
        arrive(s.rows);
      }
      if (classifier) sc.appendChild(el('p', classifier, 'hu-note'));
      root.appendChild(sc);

      const foot = el('div', null, 'hu-foot');
      if (s.rows.length) {
        // Deleting cannot be undone : the first click asks, the second one (within a few seconds) deletes.
        const asking = env.now() - confirmDelete < 5000;
        foot.appendChild(word(asking ? 'Effacer pour de bon ?' : 'Effacer le journal', async () => {
          if (env.now() - confirmDelete >= 5000) { confirmDelete = env.now(); return render(); }
          confirmDelete = 0;
          try { await env.chrome.storage.local.remove(['log', 'chain']); } catch (_) {}
          await render();
        }));
      }
      foot.appendChild(word('Réglages', () => { try { env.chrome.runtime.openOptionsPage(); } catch (_) {} }));
      if (s.rows.length) foot.appendChild(word('Exporter le journal', async () => {
        let chain = null; try { chain = (await env.chrome.storage.local.get('chain')).chain; } catch (_) {}
        const body = JSON.stringify({ format: 'holdup-journal', version: 1, anchor: chain && chain.anchor || null, entries: chain && Array.isArray(chain.entries) ? chain.entries : [] }, null, 1);
        if (env.save) env.save('holdup-journal.json', body);
      }));
      root.appendChild(foot);
      if (opening) { opening = false; later(() => { root.className = String(root.className).replace(/\s*\bis-opening\b/, ''); }, 260); }
    }

    // One new row at the top since the last redraw : it arrives, what follows is pushed down by its height, then the classes go.
    function arrive(rows) {
      const keys = rows.map((r) => r.key), prev = prevKeys; prevKeys = keys;
      if (!prev || !rows.length || keys[0] === prev[0]) return;
      if (keys.slice(1).join('\n') !== prev.slice(0, keys.length - 1).join('\n')) return;
      const li = rows[0].li;
      if (!li || typeof li.getBoundingClientRect !== 'function') return;
      const dy = '-' + Math.round(li.getBoundingClientRect().height) + 'px', moved = [li];
      li.className += ' is-arriving';
      const mark = (n) => { if (n.style && typeof n.style.setProperty === 'function') n.style.setProperty('--hu-dy', dy); n.className = (n.className ? n.className + ' ' : '') + 'is-pushed'; moved.push(n); };
      const ol = li.parentNode; if (!ol) return;
      for (let n = li.nextElementSibling; n; n = n.nextElementSibling) mark(n);
      for (let n = ol.nextElementSibling; n; n = n.nextElementSibling) mark(n);
      later(() => { for (const n of moved) n.className = String(n.className).replace(/\s*\bis-(arriving|pushed)\b/g, ''); }, 260);
    }
    return { render };
  }

  global.HoldupPanel = { summarize, siteLabel, verdictWords, lastClassifier, mount, MAX_ROWS, REVOKE_LABEL, REVOKE_ALL_LABEL };
  if (global.document && global.chrome && global.document.getElementById && global.document.getElementById('panel')) {
    const m = mount(global.document, global.document.getElementById('panel'), { chrome: global.chrome, now: () => Date.now(), save: (name, text) => {
      const a = global.document.createElement('a'); a.href = global.URL.createObjectURL(new global.Blob([text], { type: 'application/json' })); a.download = name; a.click();
    } });
    m.render();
    try { global.chrome.storage.onChanged.addListener((ch, area) => { if ((area === 'local' && ch.log) || area === 'session') m.render(); }); } catch (_) {}
  }
})(typeof window !== 'undefined' ? window : globalThis);

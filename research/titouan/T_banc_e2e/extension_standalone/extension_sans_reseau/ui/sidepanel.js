/* Hold up - panneau latéral (chrome.sidePanel). Ouvert par un clic sur l'icône de l'extension, jamais par une demande de page :
 * les décisions de signature restent dans la fenêtre séparée.
 * Il LIT le journal déjà tenu par gatekeeper.js (chrome.storage.local, clé "log") et n'écrit rien d'autre que son effacement.
 * « Droits accordés » : les droits que la personne a laissés partir sur l'onglet affiché, avec « Révoquer » (branchement : gatekeeper.js,
 * REVOKE_BRANCHEMENT.md). Le panneau n'envoie jamais une demande au service worker, seulement un onglet et un identifiant (hu.revoke.*) :
 * la demande de retrait est relue dans storage.session par le service worker, montrée par le portefeuille, signée par la personne.
 * Hold up ne signe rien.
 * Ne stocke ni la phrase écrite ni une adresse. Tout est dessiné avec textContent : aucune donnée de page n'entre dans le HTML. */
(function (global) {
  'use strict';
  const MAX_ROWS = 20;
  // The same three answers as the window, in the past. Never the engine's level names.
  const OUTCOME = { match: 'Correspondait.', mismatch: 'Ne correspondait pas.', unverifiable: 'Non vérifiée.' };
  const BY_LEVEL = { attention: 'match', danger: 'mismatch', manipulation: 'mismatch', unknown: 'unverifiable' };
  const METHOD = {
    eth_sendTransaction: 'Transaction', eth_signTransaction: 'Transaction signée', eth_sendRawTransaction: 'Transaction signée', wallet_sendCalls: 'Lot de transactions',
    eth_sign: 'Signature', personal_sign: 'Message signé', eth_signTypedData: 'Signature de données', eth_signTypedData_v1: 'Signature de données',
    eth_signTypedData_v3: 'Signature de données', eth_signTypedData_v4: 'Signature de données', wallet_grantPermissions: 'Droit durable', wallet_requestExecutionPermissions: 'Droit durable',
    wallet_requestSnaps: 'Droit durable', wallet_watchAsset: 'Jeton ajouté au portefeuille', wallet_addEthereumChain: 'Réseau ajouté', eth_decrypt: 'Déchiffrement', eth_getEncryptionPublicKey: 'Déchiffrement',
    eth_sendUserOperation: 'Opération de compte', eth_signUserOperation: 'Opération de compte'
  };
  const HOW = [
    'Un site demande une signature : Hold up la retient avant le portefeuille.',
    'Tu écris ce que tu veux faire. Hold up compare ta phrase à ce que la demande fait vraiment.',
    'Tu continues ou tu annules. Rien ne part sans ton geste, et Hold up ne dit jamais que c’est sûr.'
  ];
  const REVOKE = {
    title: 'Droits accordés', none: 'Aucun droit accordé sur cet onglet.', button: 'Révoquer',
    before: 'Ton portefeuille va afficher le nom du site. C’est normal : lis bien ce que la demande fait. Elle remet le droit à zéro.',
    who: 'Hold up prépare la demande de retrait. Ton portefeuille te la montre, c’est toi qui signes. Hold up ne signe jamais.',
    sending: 'Regarde ton portefeuille : il te montre la demande de retrait.',
    submitted: 'Retrait envoyé à ton portefeuille.', zero: 'Le droit est à zéro.', still: 'Le droit est toujours actif pour l’instant.', unread: 'Je n’ai pas pu relire le droit.',
    rejected: 'Tu as rejeté la demande. Le droit est toujours actif.', no_wallet: 'Ouvre à nouveau le site ou ton portefeuille, puis reviens ici.',
    error: 'Le retrait n’a pas pu être envoyé. Le droit est toujours actif.'
  };

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
  // "1 demande vérifiée", "2 demandes vérifiées"
  const plural = (n, one, many) => n + ' ' + (n < 2 ? one : many); // in French, zero takes the singular

  // One journal line of a decision -> what the panel says : the answer the window gave, what the person (or the window by itself) did,
  // and whether Hold up limited the right before the wallet.
  function verdictWords(e) {
    const o = OUTCOME[e.outcome] ? e.outcome : BY_LEVEL[e.level] || '';
    const parts = [];
    if (o) parts.push(OUTCOME[o]);
    if (e.sent && e.sent.limited === true && typeof e.sent.sent === 'string') parts.push('Droit limité à ' + e.sent.sent.replace('.', ',') + '.');
    parts.push(e.decision === 'confirm' ? (e.by === 'auto' ? 'Envoyée sans clic.' : 'Continuée.') : 'Annulée.');
    return { words: parts.join(' '), negative: o === 'mismatch' };
  }

  // log -> { rows (newest first, at most 20, only what the panel shows), today: { checked, cancelled } }
  function summarize(log, now) {
    const list = Array.isArray(log) ? log : [];
    const day = startOfDay(now), rows = [];
    let checked = 0, cancelled = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (!e || typeof e !== 'object' || typeof e.ts !== 'number') continue;
      if (e.type === 'verdict' && e.ts >= day) checked++;
      if (e.type === 'revocation' && rows.length < MAX_ROWS) { rows.push({ site: siteLabel(e.origin), kind: 'Retrait d’un droit', words: e.wallet === 'submitted' ? 'Envoyé au portefeuille.' : e.wallet === 'rejected' ? 'Rejeté dans le portefeuille.' : 'Non envoyé.', time: clock(e.ts), negative: false }); continue; }
      if (e.type !== 'decision' || (e.decision !== 'confirm' && e.decision !== 'cancel')) continue;
      if (e.decision === 'cancel' && e.ts >= day) cancelled++;
      if (rows.length < MAX_ROWS) { const v = verdictWords(e); rows.push({ site: siteLabel(e.origin), kind: METHOD[e.method] || 'Autre demande', words: v.words, time: clock(e.ts), negative: v.negative }); }
    }
    return { rows, today: { checked, cancelled } };
  }

  function mount(doc, root, env) {
    const el = (tag, text, cls) => { const e = doc.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
    const clear = () => { while (root.firstChild) root.removeChild(root.firstChild); };
    const notes = {}; // grant id -> the last thing said about its withdrawal (kept across redraws)
    let confirmDelete = 0;
    const tellWorker = async (msg) => { try { return await env.chrome.runtime.sendMessage(msg); } catch (_) { return null; } };
    const later = (fn, ms) => (env.setTimeout || global.setTimeout || function () {})(fn, ms);

    // the tab this panel sits next to : the rights are kept per tab
    async function tabId() { try { const t = await env.chrome.tabs.query({ active: true, currentWindow: true }); return t && t[0] && Number.isInteger(t[0].id) ? t[0].id : null; } catch (_) { return null; } }
    async function revoke(g) {
      notes[g.id] = REVOKE.sending; await render();
      const r = await tellWorker({ type: 'hu.revoke.send', tabId: g.tabId, id: g.id, index: 0 });
      const state = r && r.state === 'error' && (r.code === 'no_provider' || r.code === 'origin_changed' || r.code === 'no_answer') ? 'no_wallet' : r && typeof r.state === 'string' ? r.state : 'error';
      notes[g.id] = REVOKE[state] || REVOKE.error; await render();
      if (state === 'submitted') check(g, 0);
    }
    // After the wallet took the withdrawal : the right is read again (allowance) until it is zero, a few times.
    function check(g, n) {
      later(async () => {
        const r = await tellWorker({ type: 'hu.revoke.check', tabId: g.tabId, id: g.id });
        const s = r && r.state;
        if (s === 'zero') { notes[g.id] = REVOKE.submitted + ' ' + REVOKE.zero; return render(); }
        if (n >= 5) { notes[g.id] = REVOKE.submitted + ' ' + (s === 'still_active' ? REVOKE.still : REVOKE.unread); return render(); }
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
          const res = g.result;
          return { id: g.id, tabId: tab, site: g.origin, oneClick: res.status === 'revocable' && res.oneClick === true, says: typeof res.says === 'string' ? res.says : '', steps: Array.isArray(res.steps) ? res.steps : [],
            line: (() => { const first = String(res.says || '').split('. ')[0].slice(0, 200); return first && !first.endsWith('.') ? first + '.' : first; })(), wallet: g.wallet };
        }); }
      let mf = {}; try { mf = env.chrome.runtime.getManifest() || {}; } catch (_) {}
      const csp = mf.content_security_policy && mf.content_security_policy.extension_pages || '';
      const offline = /connect-src\s+'none'/.test(csp);
      const s = summarize(log, env.now());
      clear();
      root.appendChild(el('h1', 'Hold up'));
      root.appendChild(el('p', active ? 'Hold up est actif.' : 'Hold up est inactif.'));
      root.appendChild(el('p', 'Version ' + (mf.version || 'inconnue') + (offline ? ' · Aucune connexion réseau' : ''), 'quiet'));
      const cut = Object.keys(partial).filter((k) => Number.isFinite(partial[k])).sort((a, b) => partial[b] - partial[a]).slice(0, 5);
      if (cut.length) root.appendChild(el('p', 'Interception partielle : sur ' + cut.map(siteLabel).join(', ') + ', Hold up n’a pas pu se placer devant le portefeuille. Des demandes peuvent partir sans vérification.', 'danger-note'));
      root.appendChild(el('h2', 'Aujourd’hui'));
      root.appendChild(el('p', plural(s.today.checked, 'demande vérifiée', 'demandes vérifiées') + ', ' + plural(s.today.cancelled, 'annulée', 'annulées') + '.', 'today'));

      root.appendChild(el('h2', REVOKE.title));
      if (!grants.length) root.appendChild(el('p', REVOKE.none, 'quiet'));
      else {
        const ul = el('ul', null, 'grants');
        for (const g of grants.slice(0, 10)) {
          const li = el('li');
          li.appendChild(el('div', siteLabel(g.site), 'site'));
          li.appendChild(el('div', String(g.line || '').slice(0, 200), 'meta'));
          if (g.oneClick) {
            const b = el('button', REVOKE.button); b.setAttribute('type', 'button');
            b.addEventListener('click', () => revoke(g));
            li.appendChild(b);
            li.appendChild(el('p', notes[g.id] || (g.wallet === 'submitted' ? REVOKE.submitted : g.wallet === 'rejected' ? REVOKE.rejected : REVOKE.before), 'quiet'));
          } else {
            // an off-chain signature, or several steps : explained, never a button that would promise more than it does
            if (g.says) li.appendChild(el('p', String(g.says).slice(0, 400), 'quiet'));
            for (const t of (Array.isArray(g.steps) ? g.steps : []).slice(0, 6)) li.appendChild(el('p', String(t).slice(0, 240), 'quiet'));
          }
          ul.appendChild(li);
        }
        root.appendChild(ul);
        root.appendChild(el('p', REVOKE.who, 'quiet'));
      }

      root.appendChild(el('h2', 'Dernières demandes'));
      if (!s.rows.length) root.appendChild(el('p', 'Aucune demande pour l’instant.', 'quiet'));
      else {
        const ol = el('ol', null, 'rows');
        for (const r of s.rows) {
          const li = el('li');
          li.appendChild(el('div', r.site, 'site'));
          li.appendChild(el('div', [r.kind, r.words, r.time].filter(Boolean).join(' · '), 'meta' + (r.negative ? ' negative' : '')));
          ol.appendChild(li);
        }
        root.appendChild(ol);
      }
      root.appendChild(el('h2', 'Comment ça marche'));
      const how = el('ul', null, 'how'); for (const t of HOW) how.appendChild(el('li', t)); root.appendChild(how);
      const actions = el('div', null, 'actions');
      const opt = el('button', 'Ouvrir les réglages'); opt.setAttribute('type', 'button');
      opt.addEventListener('click', () => { try { env.chrome.runtime.openOptionsPage(); } catch (_) {} });
      // Deleting cannot be undone : the first click asks, the second one (within a few seconds) deletes.
      const asking = env.now() - confirmDelete < 5000;
      const del = el('button', asking ? 'Effacer pour de bon ?' : 'Effacer l’historique'); del.setAttribute('type', 'button');
      del.addEventListener('click', async () => {
        if (env.now() - confirmDelete >= 5000) { confirmDelete = env.now(); return render(); }
        confirmDelete = 0;
        try { await env.chrome.storage.local.remove(['log', 'chain']); } catch (_) {}
        await render();
      });
      const exp = el('button', 'Exporter le journal'); exp.setAttribute('type', 'button');
      exp.addEventListener('click', async () => {
        let chain = null; try { chain = (await env.chrome.storage.local.get('chain')).chain; } catch (_) {}
        const body = JSON.stringify({ format: 'holdup-journal', version: 1, anchor: chain && chain.anchor || null, entries: chain && Array.isArray(chain.entries) ? chain.entries : [] }, null, 1);
        if (env.save) env.save('holdup-journal.json', body);
      });
      root.appendChild(el('p', 'Le journal garde la trace de chaque décision. Une ligne changée, retirée ou déplacée se voit à la vérification. Il ne contient ni ta phrase ni d’adresse.', 'quiet'));
      actions.appendChild(exp); actions.appendChild(opt); actions.appendChild(del); root.appendChild(actions);
    }
    return { render };
  }

  global.HoldupPanel = { summarize, siteLabel, verdictWords, plural, mount, MAX_ROWS };
  if (global.document && global.chrome && global.document.getElementById && global.document.getElementById('panel')) {
    const m = mount(global.document, global.document.getElementById('panel'), { chrome: global.chrome, now: () => Date.now(), save: (name, text) => {
      const a = global.document.createElement('a'); a.href = global.URL.createObjectURL(new global.Blob([text], { type: 'application/json' })); a.download = name; a.click();
    } });
    m.render();
    try { global.chrome.storage.onChanged.addListener((ch, area) => { if ((area === 'local' && ch.log) || area === 'session') m.render(); }); } catch (_) {}
  }
})(typeof window !== 'undefined' ? window : globalThis);

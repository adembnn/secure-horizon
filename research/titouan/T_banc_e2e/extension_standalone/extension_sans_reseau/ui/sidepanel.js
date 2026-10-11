/* Hold up - panneau latéral (chrome.sidePanel). Ouvert par un clic sur l'icône de l'extension, jamais par une demande de page :
 * les décisions de signature restent dans la fenêtre séparée.
 * Il LIT le journal déjà tenu par gatekeeper.js (chrome.storage.local, clé "log") et n'écrit rien d'autre que son effacement.
 * Ne stocke ni la phrase écrite ni une adresse. Tout est dessiné avec textContent : aucune donnée de page n'entre dans le HTML. */
(function (global) {
  'use strict';
  const MAX_ROWS = 20;
  const LEVEL = { attention: 'Attention', danger: 'Danger', manipulation: 'Manipulation', unknown: 'Non vérifié' };
  const METHOD = {
    eth_sendTransaction: 'Transaction', eth_signTransaction: 'Transaction signée', eth_sendRawTransaction: 'Transaction signée', wallet_sendCalls: 'Lot de transactions',
    eth_sign: 'Signature', personal_sign: 'Message signé', eth_signTypedData: 'Signature de données', eth_signTypedData_v1: 'Signature de données',
    eth_signTypedData_v3: 'Signature de données', eth_signTypedData_v4: 'Signature de données', wallet_grantPermissions: 'Droit durable',
    wallet_requestSnaps: 'Droit durable', eth_decrypt: 'Déchiffrement', eth_getEncryptionPublicKey: 'Déchiffrement', eth_sendUserOperation: 'Opération de compte', eth_signUserOperation: 'Opération de compte'
  };
  const HOW = [
    'Un site demande une signature : Hold up la retient avant le portefeuille.',
    'Tu écris ce que tu veux faire. Hold up compare ta phrase à ce que la demande fait vraiment.',
    'Tu continues ou tu annules. Rien ne part sans ton geste, et Hold up ne dit jamais que c’est sûr.'
  ];

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

  // log -> { rows (newest first, at most 20, only what the panel shows), today: { checked, cancelled } }
  function summarize(log, now) {
    const list = Array.isArray(log) ? log : [];
    const day = startOfDay(now), rows = [];
    let checked = 0, cancelled = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (!e || typeof e !== 'object' || typeof e.ts !== 'number') continue;
      if (e.type === 'verdict' && e.ts >= day) checked++;
      if (e.type !== 'decision' || (e.decision !== 'confirm' && e.decision !== 'cancel')) continue;
      if (e.decision === 'cancel' && e.ts >= day) cancelled++;
      if (rows.length < MAX_ROWS) rows.push({ site: siteLabel(e.origin), kind: METHOD[e.method] || 'Autre demande', level: LEVEL[e.level] || '', decision: e.decision === 'confirm' ? 'Continuée' : 'Annulée', time: clock(e.ts), danger: e.level === 'danger' || e.level === 'manipulation' });
    }
    return { rows, today: { checked, cancelled } };
  }

  function mount(doc, root, env) {
    const el = (tag, text, cls) => { const e = doc.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
    const clear = () => { while (root.firstChild) root.removeChild(root.firstChild); };
    async function render() {
      let log = [], active = false, partial = {};
      try { log = (await env.chrome.storage.local.get('log')).log; } catch (_) {}
      try { const p = (await env.chrome.storage.local.get('partial')).partial; if (p && typeof p === 'object') partial = p; } catch (_) {}
      try { const r = await env.chrome.runtime.sendMessage({ type: 'hu.poll', rid: 'etat-0000000000' }); active = !!r && typeof r.state === 'string'; } catch (_) { active = false; }
      let mf = {}; try { mf = env.chrome.runtime.getManifest() || {}; } catch (_) {}
      const csp = mf.content_security_policy && mf.content_security_policy.extension_pages || '';
      const offline = /connect-src\s+'none'/.test(csp);
      const s = summarize(log, env.now());
      clear();
      root.appendChild(el('h1', 'Hold up'));
      root.appendChild(el('p', active ? 'Hold up est actif.' : 'Hold up est inactif.'));
      root.appendChild(el('p', 'Version ' + (mf.version || 'inconnue') + (offline ? ' · Aucune connexion réseau' : ''), 'quiet'));
      const cut = Object.keys(partial).filter((k) => Number.isFinite(partial[k])).sort((a, b) => partial[b] - partial[a]).slice(0, 5);
      if (cut.length) root.appendChild(el('p', 'Interception partielle : sur ' + cut.map(siteLabel).join(', ') + ', le fournisseur du portefeuille n’a pas pu être entouré. Des demandes peuvent partir sans passer par Hold up.', 'danger-note'));
      root.appendChild(el('h2', 'Aujourd’hui'));
      const c = el('ul', null, 'counters');
      for (const [n, label] of [[s.today.checked, 'demandes vérifiées'], [s.today.cancelled, 'annulées']]) { const li = el('li'); li.appendChild(el('b', String(n))); li.appendChild(el('span', label, 'quiet')); c.appendChild(li); }
      root.appendChild(c);
      root.appendChild(el('h2', 'Dernières demandes'));
      if (!s.rows.length) root.appendChild(el('p', 'Aucune demande pour l’instant.', 'quiet'));
      else {
        const ol = el('ol', null, 'rows');
        for (const r of s.rows) {
          const li = el('li');
          li.appendChild(el('div', r.site, 'site'));
          li.appendChild(el('div', [r.kind, r.level, r.decision, r.time].filter(Boolean).join(' · '), 'meta' + (r.danger ? ' danger' : '')));
          ol.appendChild(li);
        }
        root.appendChild(ol);
      }
      root.appendChild(el('h2', 'Comment ça marche'));
      const how = el('ul', null, 'how'); for (const t of HOW) how.appendChild(el('li', t)); root.appendChild(how);
      const actions = el('div', null, 'actions');
      const opt = el('button', 'Ouvrir les réglages'); opt.setAttribute('type', 'button');
      opt.addEventListener('click', () => { try { env.chrome.runtime.openOptionsPage(); } catch (_) {} });
      const del = el('button', 'Effacer l’historique'); del.setAttribute('type', 'button');
      del.addEventListener('click', async () => { try { await env.chrome.storage.local.remove(['log', 'chain']); } catch (_) {} await render(); });
      const exp = el('button', 'Exporter le journal (JSON)'); exp.setAttribute('type', 'button');
      exp.addEventListener('click', async () => {
        let chain = null; try { chain = (await env.chrome.storage.local.get('chain')).chain; } catch (_) {}
        const body = JSON.stringify({ format: 'holdup-journal', version: 1, anchor: chain && chain.anchor || null, entries: chain && Array.isArray(chain.entries) ? chain.entries : [] }, null, 1);
        if (env.save) env.save('holdup-journal.json', body);
      });
      root.appendChild(el('p', 'Le journal est chaîné : une ligne changée, retirée ou déplacée se voit avec tools/verify_journal.mjs. Il ne contient ni ta phrase ni d’adresse.', 'quiet'));
      actions.appendChild(exp); actions.appendChild(opt); actions.appendChild(del); root.appendChild(actions);
    }
    return { render };
  }

  global.HoldupPanel = { summarize, siteLabel, mount, MAX_ROWS };
  if (global.document && global.chrome && global.document.getElementById && global.document.getElementById('panel')) {
    const m = mount(global.document, global.document.getElementById('panel'), { chrome: global.chrome, now: () => Date.now(), save: (name, text) => {
      const a = global.document.createElement('a'); a.href = global.URL.createObjectURL(new global.Blob([text], { type: 'application/json' })); a.download = name; a.click();
    } });
    m.render();
    try { global.chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch.log) m.render(); }); } catch (_) {}
  }
})(typeof window !== 'undefined' ? window : globalThis);

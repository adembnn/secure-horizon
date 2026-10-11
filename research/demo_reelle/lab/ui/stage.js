/* Hold up Lab : mises en scène des appâts. Fausses pages tierces, marque inventée, chaîne de test.
   Tout vient de scenario.staging et des paramètres courants ; tout texte passe par textContent. */
(function (global) {
  'use strict';
  var D = global.Lab.dom, h = D.h, svg = D.svg;

  var PALETTE = ['#7c5cff', '#ff7a3d', '#22b8e6', '#ff4d8d', '#e8b923', '#3b82f6'];
  function accent(brand) { return PALETTE[D.hash(brand) % PALETTE.length]; }
  function symbolOf(brand) {
    var w = D.slug(brand).split('-').filter(Boolean);
    var s = (w.length > 1 ? w.map(function (x) { return x[0]; }).join('') : (w[0] || 'brd').slice(0, 3)).toUpperCase();
    return s.length < 3 ? (s + 'XX').slice(0, 3) : s.slice(0, 4);
  }
  function mark(brand, size, color) {
    var s = size || 28;
    return svg('svg', { viewBox: '0 0 32 32', width: s, height: s, 'aria-hidden': 'true', class: 'sc-mark' },
      svg('path', { d: 'M16 2l12.1 7v14L16 30 3.9 23V9z', fill: color || accent(brand) }),
      svg('text', { x: '16', y: '21', 'text-anchor': 'middle', 'font-size': '14', 'font-weight': '700', fill: '#fff', 'font-family': 'system-ui, sans-serif' }, (brand || '?').charAt(0).toUpperCase()));
  }
  function icon(path, size) {
    return svg('svg', { viewBox: '0 0 24 24', width: size || 16, height: size || 16, fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, svg('path', { d: path }));
  }
  var LOCK = 'M6 11V8a6 6 0 0112 0v3M5 11h14v10H5z';
  var CHECK = 'M5 12.5l4.5 4.5L19 7';

  function siteKind(sc) {
    var st = sc.staging || {};
    var t = [sc.family, st.pitch, st.buttonLabel, sc.title].join(' ').toLowerCase();
    if (/swap|échang|echang|dex/.test(t)) return 'dex';
    if (/mint/.test(t)) return 'mint';
    return 'claim';
  }
  function hostOf(st) { return st.host || st.url || (D.slug(st.brand) + '.test'); }
  function amountText(p, fallback) { var a = p && p.amount != null && p.amount !== '' ? D.fmtNum(p.amount) : fallback; return a; }

  /* ---------- bouton principal de la scène ---------- */
  function cta(label, onPress, cls) {
    var b = h('button', { type: 'button', class: 'sc-cta ' + (cls || ''), 'data-stage-cta': '1' }, label);
    b.addEventListener('click', function () { if (b.getAttribute('aria-disabled') !== 'true') onPress(); });
    return b;
  }

  /* ---------- site : réclamation, échange, mint ---------- */
  function buildSite(sc, p, ctx, onPress) {
    var st = sc.staging || {}, brand = st.brand || 'Aurore', col = accent(brand), sym = symbolOf(brand);
    var kind = siteKind(sc);
    var victim = D.shortAddr(ctx.victim);
    var btn = cta(st.buttonLabel || 'Continuer', onPress, 'sc-cta-site');
    var nav = h('div', { class: 'sc-nav', 'aria-hidden': 'true' },
      h('span', { class: 'sc-brand' }, mark(brand, 26, col), h('b', null, brand)),
      h('span', { class: 'sc-links' }, h('span', null, 'Docs'), h('span', null, 'Communauté'), h('span', null, 'Statistiques')),
      h('span', { class: 'sc-wallet-pill' }, h('i'), victim));
    var body;
    if (kind === 'dex') {
      var pay = amountText(p, '1 000');
      var rec = isFinite(Number(String(p.amount || 1000).replace(/\s/g, '').replace(',', '.'))) ? D.fmtNum(Number(String(p.amount || 1000).replace(/\s/g, '').replace(',', '.')) * 0.42) : '420';
      body = h('div', { class: 'sc-swap' },
        h('p', { class: 'sc-lead' }, st.pitch || ''),
        h('div', { class: 'sc-swapcard', 'aria-hidden': 'false' },
          h('div', { class: 'sc-field' }, h('small', null, 'Tu paies'), h('div', null, h('b', null, pay), h('span', { class: 'sc-token' }, 'USDC'))),
          h('div', { class: 'sc-swapmid', 'aria-hidden': 'true' }, '↓'),
          h('div', { class: 'sc-field' }, h('small', null, 'Tu reçois (estimation)'), h('div', null, h('b', null, rec), h('span', { class: 'sc-token', style: 'background:' + col }, sym))),
          h('p', { class: 'sc-fine' }, 'Frais 0,05 %  ·  Glissement max. 0,5 %'),
          btn));
    } else if (kind === 'mint') {
      body = h('div', { class: 'sc-mint' },
        h('div', { class: 'sc-art', style: '--c:' + col, 'aria-hidden': 'true' }, h('span', null, '#' + (1000 + (D.hash(brand) % 8000)))),
        h('div', { class: 'sc-mint-info' },
          h('h4', null, brand), h('p', { class: 'sc-lead' }, st.pitch || ''),
          h('div', { class: 'sc-bar', 'aria-hidden': 'true' }, h('i', { style: 'width:68%;background:' + col })),
          h('p', { class: 'sc-fine' }, '3 402 / 5 000 pièces  ·  Prix 0,05 AVAX'),
          btn));
    } else {
      body = h('div', { class: 'sc-claim' },
        h('span', { class: 'sc-pill' }, 'Saison 2  ·  snapshot terminé'),
        h('h4', null, st.pitch || ''),
        h('div', { class: 'sc-alloc', 'aria-hidden': 'true' },
          h('div', null, h('small', null, 'Wallet connecté'), h('b', { class: 'mono' }, victim)),
          h('div', null, h('small', null, 'Ton allocation'), h('b', null, '2 450 ' + sym)),
          h('div', null, h('small', null, 'Clôture dans'), h('b', null, '02:14:09'))),
        btn);
    }
    var url = h('div', { class: 'sc-bar-url', 'aria-hidden': 'true' }, icon(LOCK, 13), hostOf(st));
    var el = h('div', { class: 'sc-page sc-site', style: '--accent:' + col },
      h('div', { class: 'sc-chrome', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), url),
      nav, body);
    return { el: el, btn: btn };
  }

  /* ---------- message direct ---------- */
  function buildMessage(sc, p, ctx, onPress) {
    var st = sc.staging || {}, brand = st.brand || 'Aurore', col = accent(brand);
    var handle = '@' + D.slug(brand).replace(/-/g, '_');
    var text = st.messageText || st.pitch || '';
    var btn = cta(st.buttonLabel || 'Ouvrir le lien', onPress, 'sc-cta-msg');
    var el = h('div', { class: 'sc-page sc-dm' },
      h('div', { class: 'sc-dm-head', 'aria-hidden': 'true' }, mark(brand, 34, col),
        h('div', null, h('b', null, brand, h('span', { class: 'sc-tick' }, icon(CHECK, 11))), h('small', null, handle + '  ·  message direct'))),
      h('div', { class: 'sc-dm-thread' },
        h('p', { class: 'sc-bubble' }, text),
        h('div', { class: 'sc-linkcard' },
          h('div', { class: 'sc-linkart', style: '--c:' + col, 'aria-hidden': 'true' }, mark(brand, 40, col)),
          h('div', { class: 'sc-linkmeta' }, h('small', null, hostOf(st)), h('b', null, st.pitch && st.pitch !== text ? st.pitch : brand)),
          btn),
        h('small', { class: 'sc-time', 'aria-hidden': 'true' }, 'Reçu à l’instant')));
    return { el: el, btn: btn };
  }

  /* ---------- chat de support ---------- */
  function buildChat(sc, p, ctx, onPress) {
    var st = sc.staging || {}, brand = st.brand || 'Support', col = accent(brand);
    var lines = [];
    if (st.pitch) lines.push(st.pitch);
    String(st.messageText || '').split(/\n+/).forEach(function (l) { if (l.trim()) lines.push(l.trim()); });
    var btn = cta(st.buttonLabel || 'Continuer', onPress, 'sc-cta-chat');
    var el = h('div', { class: 'sc-page sc-chat' },
      h('div', { class: 'sc-chat-head', style: 'background:' + col, 'aria-hidden': 'true' },
        h('b', null, 'Support ' + brand), h('small', null, 'Léa est en ligne')),
      h('div', { class: 'sc-chat-body' },
        lines.map(function (l) { return h('p', { class: 'sc-msg' }, l); }),
        h('div', { class: 'sc-msg-action' }, btn)),
      h('div', { class: 'sc-chat-input', 'aria-hidden': 'true' }, 'Écris ton message'));
    return { el: el, btn: btn };
  }

  /* ---------- wallet : écran Envoyer ---------- */
  function addrGrid(a) {
    var s = String(a || '');
    if (!/^0x[0-9a-fA-F]{40}$/.test(s)) return h('span', { class: 'mono sc-raw' }, s || 'Adresse vide');
    var groups = []; for (var i = 2; i < 42; i += 4) groups.push(s.slice(i, i + 4));
    return h('span', { class: 'mono sc-addrgrid', 'aria-label': s }, h('i', null, '0x'), groups.slice(0, 5).map(function (g) { return h('i', null, g); }), h('i', { 'aria-hidden': 'true' }), groups.slice(5).map(function (g) { return h('i', null, g); }));
  }
  function buildWalletSend(sc, p, ctx, onPress) {
    var st = sc.staging || {}, brand = st.brand || 'Wallet';
    var rec = p.recipient || (sc.defaults && sc.defaults.recipient) || '';
    var btn = cta(st.buttonLabel || 'Continuer', onPress, 'sc-cta-wallet');
    var el = h('div', { class: 'sc-page sc-wallet' },
      h('div', { class: 'sc-w-head', 'aria-hidden': 'true' }, h('span', { class: 'sc-brand' }, mark(brand, 22, '#2b2b2b'), h('b', null, brand)), h('span', { class: 'sc-netchip' }, 'Avalanche Fuji')),
      h('h4', null, 'Envoyer'),
      h('div', { class: 'sc-w-field' }, h('small', null, 'À'), addrGrid(rec), h('small', { class: 'sc-paste' }, 'Collé depuis ton historique')),
      h('div', { class: 'sc-w-field' }, h('small', null, 'Montant'), h('div', { class: 'sc-w-amt' }, h('b', null, amountText(p, '500')), h('span', null, 'USDC'))),
      h('p', { class: 'sc-fine' }, 'Solde : 3 200 USDC  ·  Frais estimés : 0,0004 AVAX'),
      btn);
    return { el: el, btn: btn };
  }

  /* ---------- exchange : retrait ---------- */
  function buildExchange(sc, p, ctx, onPress) {
    var st = sc.staging || {}, brand = st.brand || 'Exchange', col = accent(brand);
    var rec = p.recipient || (sc.defaults && sc.defaults.recipient) || ctx.victim || '';
    var btn = cta(st.buttonLabel || 'Retirer', onPress, 'sc-cta-ex');
    var amt = amountText(p, '750');
    var el = h('div', { class: 'sc-page sc-ex' },
      h('div', { class: 'sc-ex-head', 'aria-hidden': 'true' }, h('span', { class: 'sc-brand' }, mark(brand, 24, col), h('b', null, brand)), h('span', { class: 'sc-links' }, h('span', null, 'Portefeuille'), h('span', null, 'Retrait'), h('span', null, 'Historique'))),
      h('div', { class: 'sc-ex-body' },
        h('h4', null, st.pitch || 'Retirer des USDC'),
        h('dl', { class: 'sc-ex-rows' },
          h('div', null, h('dt', null, 'Réseau'), h('dd', null, 'Avalanche C-Chain')),
          h('div', null, h('dt', null, 'Adresse'), h('dd', null, addrGrid(rec))),
          h('div', null, h('dt', null, 'Montant'), h('dd', null, h('b', null, amt), ' USDC')),
          h('div', null, h('dt', null, 'Frais'), h('dd', null, '1 USDC'))),
        btn));
    return { el: el, btn: btn };
  }

  var BUILDERS = { site: buildSite, message: buildMessage, support_chat: buildChat, wallet_send: buildWalletSend, exchange_withdraw: buildExchange };

  /* container : conteneur du cadre. Rend la scène + la légende permanente. */
  function render(container, sc, params, ctx, onPress) {
    D.clear(container);
    var st = sc.staging || {};
    var build = BUILDERS[st.kind] || BUILDERS.site;
    var built = build(sc, params || {}, ctx || {}, onPress);
    var wc = sc.door === 'walletconnect' ? h('p', { class: 'sc-door-note' }, 'Demande reçue par WalletConnect, dans le wallet du téléphone.') : null;
    if (wc) container.appendChild(h('div', { class: 'scene-top' }, wc));
    container.appendChild(h('div', { class: 'scene-stage' }, built.el));
    container.appendChild(h('p', { class: 'scene-caption' }, 'Scène fictive : marque inventée, chaîne de test.'));
    return {
      button: built.btn,
      setBusy: function (b) {
        if (b) { built.btn.setAttribute('aria-disabled', 'true'); built.btn.setAttribute('aria-busy', 'true'); }
        else { built.btn.removeAttribute('aria-disabled'); built.btn.removeAttribute('aria-busy'); }
      }
    };
  }

  global.Lab.stage = { render: render, accent: accent };
})(window);

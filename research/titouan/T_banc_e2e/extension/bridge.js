/* Hold up - pont (monde isole, document_start, toutes frames).
 * 1) recoit les demandes de inject.js par un MessageChannel prive et les envoie au service worker ;
 * 2) dans la frame 0, affiche la fenetre de confirmation dans un shadow DOM ferme (prototypes natifs de ce monde,
 *    donc non alteres par la page). Apparence : docs/design/modal/*.html. */
(() => {
  'use strict';
  // ================= canal vers inject.js =================
  let port = null;
  function onHello(ev) {
    const d = ev.data;
    if (port || ev.source !== window || !d || d.__sentinelle !== 'hello' || !ev.ports || !ev.ports[0]) return;
    ev.stopImmediatePropagation(); // la page ne voit jamais le port
    port = ev.ports[0];
    port.onmessage = onPortMsg;
    port.postMessage({ t: 'ready' });
  }
  window.addEventListener('message', onHello, true);
  // document.open() (document.write dans une iframe about:blank) efface les ecouteurs de window: on les repose jusqu'a la connexion.
  const rearm = setInterval(() => { if (port) clearInterval(rearm); else window.addEventListener('message', onHello, true); }, 20);
  setTimeout(() => clearInterval(rearm), 5000);

  function pageText() {
    try { const b = document.body; return b ? (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 4000) : ''; } catch (_) { return ''; }
  }
  function topOrigin() { try { return window.top.location.origin; } catch (_) { try { return document.referrer ? new URL(document.referrer).origin : null; } catch (__) { return null; } } }

  function onPortMsg(ev) {
    const m = ev.data; if (!m) return;
    if (m.t === 'gate' || m.t === 'notify') {
      if (m.t === 'gate') port.postMessage({ t: 'ack', id: m.id });
      let sent;
      try {
        sent = chrome.runtime.sendMessage({ type: 'gate', payload: Object.assign({}, m.payload, { kind: m.t === 'notify' ? 'journal' : 'gate' }),
          origin: location.origin === 'null' ? location.href.split('#')[0] : location.origin, url: location.href,
          pageText: m.t === 'gate' ? pageText() : undefined, topOrigin: topOrigin() });
      } catch (e) { if (m.t === 'gate') port.postMessage({ t: 'result', id: m.id, allow: false, reason: 'extension-indisponible' }); return; }
      if (m.t === 'gate') sent.then((r) => port.postMessage({ t: 'result', id: m.id, allow: !!(r && r.allow), reason: (r && r.reason) || (r && r.allow ? '' : 'denied') }),
        () => port.postMessage({ t: 'result', id: m.id, allow: false, reason: 'extension-indisponible' }));
      else sent.catch(() => {});
    }
  }

  // ================= fenetre (frame 0 uniquement) =================
  const CSS = `
:host{all:initial}
*{box-sizing:border-box}
.ov{position:fixed;inset:0;z-index:2147483647;background:rgba(7,9,13,.62);display:flex;align-items:center;justify-content:center;padding:12px;
 --surface:#fff;--surface2:#F1F4F8;--fg:#13171E;--muted:#434C5A;--line:#7A8494;--line-soft:#CBD2DC;--brand:#1747A6;--on-brand:#fff;--brand-soft:#E4ECFB;
 --danger:#AF111E;--on-danger:#fff;--danger-bg:#FDEDED;--danger-fg:#6E0911;--warn-band:#FFD98F;--on-warn-band:#2F1C00;--warn:#8A4B00;--on-warn:#fff;--warn-bg:#FFF5E1;--warn-line:#B45309;
 --unk-bg:#E4E8EF;--unk-fg:#232B38;--unk-line:#4C586B;--mark-bg:#FFE14D;--mark-fg:#111;--focus:#0B57D0;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:18px;line-height:1.5;color:var(--fg)}
@media (prefers-color-scheme:dark){.ov{--surface:#171C25;--surface2:#1F2632;--fg:#EEF1F6;--muted:#B3BCCA;--line:#7C8798;--line-soft:#303949;--brand:#8DB4FF;--on-brand:#08193A;--brand-soft:#1B2A4A;
 --danger:#FF9494;--on-danger:#3A0307;--danger-bg:#2B1316;--danger-fg:#FFD9D9;--warn-band:#4A3000;--on-warn-band:#FFE7B8;--warn:#FFB84D;--on-warn:#2A1800;--warn-bg:#2A2012;--warn-line:#FFB84D;
 --unk-bg:#222A37;--unk-fg:#E4E9F1;--unk-line:#9AA6B8;--focus:#9CC2FF;color-scheme:dark}}
.win{width:400px;max-width:100%;max-height:100%;display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line-soft);border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.4);overflow:hidden}
.top{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--surface2);border-bottom:1px solid var(--line-soft);font-size:15px;color:var(--muted);flex:none}
.top b{color:var(--fg)} .site{margin-left:auto;min-width:0;overflow-wrap:anywhere;text-align:right;font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;font-size:13px}
svg{flex:none}
.band{display:flex;gap:12px;align-items:flex-start;padding:16px;flex:none}
.band h1{margin:0;font-size:24px;line-height:1.2}
.band .tag{display:block;font-size:13px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;margin-bottom:2px}
.band.danger{background:var(--danger);color:var(--on-danger)} .band.warn{background:var(--warn-band);color:var(--on-warn-band)}
.band.unk{background:var(--unk-bg);color:var(--unk-fg);border-bottom:3px dashed var(--unk-line)}
.band.ask{background:var(--warn-band);color:var(--on-warn-band)}
main{padding:16px;display:flex;flex-direction:column;gap:14px;overflow:auto;flex:1 1 auto;min-height:0}
p{margin:0} .lead{font-size:19px} .muted{color:var(--muted)} .small{font-size:15px}
h2{margin:0;font-size:17px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media (max-width:340px){.cols{grid-template-columns:1fr}}
.col{min-width:0;border-radius:10px;padding:12px;border:2px solid var(--line-soft);background:var(--surface2);overflow-wrap:anywhere}
.col.real{border-color:var(--danger);background:var(--danger-bg);color:var(--danger-fg)}
.col h2{font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;margin-bottom:6px}
.col .big{display:block;font-size:24px;line-height:1.15;font-weight:800;font-variant-numeric:tabular-nums;margin-block:4px}
.reasons{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.reasons li{display:flex;gap:10px;font-size:17px}
.reasons li::before{content:"";flex:none;width:8px;height:8px;margin-top:10px;border-radius:2px;background:var(--danger);transform:rotate(45deg)}
.addr{display:flex;flex-direction:column;gap:4px;border:2px solid var(--line-soft);border-radius:10px;padding:10px 12px;background:var(--surface2)}
.addr.bad{border-color:var(--danger);background:var(--danger-bg);color:var(--danger-fg)}
.addr .lbl{font-size:14px;font-weight:700}
.addr code{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;font-size:16px;line-height:1.7;overflow-wrap:anywhere}
mark{background:var(--mark-bg);color:var(--mark-fg);font-weight:800;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:3px;border-radius:2px;padding:0 1px}
.quote{border-left:5px solid var(--danger);background:var(--surface2);padding:10px 12px;border-radius:0 10px 10px 0;font-size:17px;overflow-wrap:anywhere}
.fact{border:2px solid var(--warn-line);background:var(--warn-bg);border-radius:12px;padding:12px;overflow-wrap:anywhere}
.unkbox{border:2px dashed var(--unk-line);border-radius:12px;padding:12px;background:var(--unk-bg);color:var(--unk-fg)}
.gate{border-top:1px solid var(--line-soft);padding-top:12px;display:flex;flex-direction:column;gap:8px}
.gate label{font-weight:700}
.phrase{font-weight:800;background:var(--surface2);border:1px dashed var(--line);border-radius:8px;padding:8px 10px;user-select:none}
input[type=text],textarea{width:100%;font:inherit;color:var(--fg);background:var(--surface);border:2px solid var(--line);border-radius:10px;padding:10px 12px;min-height:48px}
textarea{min-height:72px;resize:vertical}
.timer{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px;border:2px solid var(--danger);border-radius:12px;background:var(--danger-bg);color:var(--danger-fg)}
.timer .t{font-size:40px;line-height:1;font-weight:800;font-variant-numeric:tabular-nums}
.timer .bar{width:100%;height:10px;border-radius:5px;background:var(--surface);border:1px solid var(--danger);overflow:hidden}
.timer .bar i{display:block;height:100%;width:100%;background:var(--danger);transform-origin:left}
.contact{border:2px solid var(--brand);border-radius:12px;padding:12px;background:var(--brand-soft);display:flex;flex-direction:column;gap:6px}
.choices{border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;min-width:0}
.choices legend{font-size:21px;font-weight:800;line-height:1.25;margin-bottom:8px;padding:0}
.choice{display:flex;align-items:center;gap:12px;min-height:52px;padding:8px 14px;border:2px solid var(--line);border-radius:12px;cursor:pointer;background:var(--surface)}
.choice input{width:22px;height:22px;accent-color:var(--brand);flex:none;margin:0}
.choice:has(input:checked){border-color:var(--brand);background:var(--brand-soft);font-weight:700}
.choice:has(input:focus-visible){outline:4px solid var(--focus);outline-offset:3px}
footer{padding:12px 16px 14px;border-top:1px solid var(--line-soft);display:flex;flex-direction:column;gap:8px;background:var(--surface);flex:none}
.reassure{font-size:14px;color:var(--muted);text-align:center}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:50px;padding:8px 16px;font:inherit;font-weight:800;border-radius:12px;border:2px solid transparent;cursor:pointer;text-align:center}
.btn.cancel{background:var(--brand);color:var(--on-brand)} .btn.cancel.soft{background:transparent;color:var(--brand);border-color:var(--brand)}
.btn.go{background:var(--warn);color:var(--on-warn)}
.btn.quiet{background:transparent;color:var(--muted);border-color:var(--line);font-weight:700;min-height:46px}
.btn.quiet.danger{color:var(--danger);border-color:var(--danger)}
.btn.call{background:var(--surface);color:var(--fg);border-color:var(--fg)}
.btn[disabled]{background:var(--surface2);color:var(--muted);border:2px dashed var(--line);cursor:not-allowed}
:focus-visible{outline:4px solid var(--focus);outline-offset:3px}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;
  const SVG = {
    danger: '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M13 3h14l10 10v14L27 37H13L3 27V13z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M12 20h16" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>',
    manip: '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="3"/><rect x="12.5" y="11" width="5" height="18" rx="2" fill="currentColor"/><rect x="22.5" y="11" width="5" height="18" rx="2" fill="currentColor"/></svg>',
    warn: '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4 37 34H3z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M20 15v9" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><circle cx="20" cy="29" r="2" fill="currentColor"/></svg>',
    unk: '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="5 4"/><path d="M15 16a5 5 0 1 1 7 4.6c-1.4.8-2 1.6-2 3.2" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="29" r="2" fill="currentColor"/></svg>',
    shield: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.4 7.5 10 4.4-1.6 7.5-5.4 7.5-10v-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k of Object.keys(attrs)) { if (k === 'class') e.className = attrs[k]; else if (k === 'text') e.textContent = attrs[k]; else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]); }
    for (const c of kids) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    return e;
  }
  function svgEl(markup) { const t = document.createElement('template'); t.innerHTML = markup; return t.content.firstChild; }
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const fmtMs = (ms) => { const s = Math.ceil(ms / 1000); return s >= 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : s + ' s'; };
  const PHRASES = ['je donne à ce site le droit de prendre mon argent', 'je comprends que je ne reçois rien en échange', 'je sais que cette demande peut vider mon solde', 'je lis ce qui est écrit avant de continuer'];
  const LEVEL_UI = {
    danger: { cls: 'danger', icon: SVG.danger, tag: 'Danger', title: 'Stop. Ne signe pas.' },
    manipulation: { cls: 'danger', icon: SVG.manip, tag: 'Pause', title: 'Fais une pause. On te met la pression.' },
    attention: { cls: 'warn', icon: SVG.warn, tag: 'Attention', title: 'Un point à vérifier' },
    unknown: { cls: 'unk', icon: SVG.unk, tag: 'Non vérifié', title: "Ce n'est pas une confirmation." }
  };

  function mountOverlay() {
    const host = document.createElement('div');
    host.setAttribute('data-sentinelle', '');
    const root = host.attachShadow({ mode: 'closed' });
    try { const sh = new CSSStyleSheet(); sh.replaceSync(CSS); root.adoptedStyleSheets = [sh]; } catch (_) { const st = document.createElement('style'); st.textContent = CSS; root.append(st); }
    const ov = h('div', { class: 'ov' });
    root.append(ov);
    const attach = () => (document.documentElement || document).append(host);
    attach();
    let rearm = 0;
    const mo = new MutationObserver(() => { if (!host.isConnected && rearm++ < 100) attach(); });
    mo.observe(document, { childList: true, subtree: true });
    ov.addEventListener('keydown', (e) => e.stopPropagation(), true);
    ov.addEventListener('keyup', (e) => e.stopPropagation(), true);
    return { host, root, ov, close() { mo.disconnect(); host.remove(); } };
  }
  function topBar(origin) { return h('div', { class: 'top' }, h('b', null, svgEl(SVG.shield), ' Hold up'), h('span', { class: 'site', text: origin })); }
  function inViewport(el) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight + 1 && r.left >= 0 && r.right <= innerWidth + 1; }

  function addrBlock(label, addr, other, bad) {
    const code = h('code');
    const a = addr.toLowerCase(), b = (other || '').toLowerCase();
    for (let i = 0; i < addr.length; i += 4) {
      if (i) code.append(' ');
      for (let j = i; j < Math.min(i + 4, addr.length); j++) code.append(a[j] !== b[j] ? h('mark', { text: addr[j] }) : addr[j]);
    }
    return h('div', { class: 'addr' + (bad ? ' bad' : '') }, h('span', { class: 'lbl', text: label }), code);
  }

  // ---------- ecran verdict ----------
  function showVerdict(spec, cfg, ctx) {
    return new Promise((resolve) => {
      const v = spec.verdict, lv = LEVEL_UI[v.level] || LEVEL_UI.unknown;
      const m = mountOverlay();
      const t0 = performance.now();
      const win = h('div', { class: 'win', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'h', 'aria-describedby': 'd' });
      win.append(topBar(ctx.origin));
      win.append(h('div', { class: 'band ' + lv.cls }, svgEl(lv.icon), h('div', null, h('span', { class: 'tag', text: lv.tag }), h('h1', { id: 'h', text: lv.title }))));
      const main = h('main', { id: 'd' });
      const isRed = v.level === 'danger' || v.level === 'manipulation';
      const needFriction = isRed && cfg.arm !== 'A';
      if (v.level === 'unknown') {
        main.append(h('p', { class: 'lead', text: "On n'a pas pu vérifier cette demande" + (v.why ? ' (' + v.why + ')' : '') + '. Ce n\'est ni un feu vert ni un feu rouge.' }));
        main.append(h('div', { class: 'unkbox', text: 'Demande : ' + ctx.method + '. Aucune vérification terminée : continue seulement si tu es sûr(e) de toi.' }));
      } else {
        if (v.said || v.real) {
          main.append(h('p', { class: 'lead', text: v.lead || (v.level === 'attention' ? 'Un seul point à vérifier.' : 'Ce que tu as demandé et ce qui se passe vraiment ne correspondent pas.') }));
          main.append(h('div', { class: 'cols' },
            h('section', { class: 'col', 'aria-label': 'Ce que tu as dit' }, h('h2', { text: 'Tu as dit' }), h('span', { class: 'small', text: (v.said && v.said.text) || 'Le site demande :' }), h('span', { class: 'big', text: (v.said && v.said.amount) || ctx.method }), h('span', { class: 'small', text: (v.said && v.said.detail) || '' })),
            h('section', { class: 'col real', 'aria-label': 'En réalité' }, h('h2', { text: 'En réalité' }), h('span', { class: 'small', text: (v.real && v.real.text) || '' }), h('span', { class: 'big', text: (v.real && v.real.amount) || '' }), h('span', { class: 'small', text: (v.real && v.real.detail) || '' }))));
        }
        if (v.address_diff) {
          const ad = v.address_diff;
          main.append(addrBlock(ad.expectedLabel || 'Adresse connue', ad.expected, ad.actual, false));
          main.append(addrBlock('Adresse de la demande', ad.actual, ad.expected, true));
          let diff = 0; for (let i = 0; i < ad.actual.length; i++) if (ad.actual[i].toLowerCase() !== (ad.expected[i] || '').toLowerCase()) diff++;
          main.append(h('p', { class: 'small', text: diff + ' caractères sur ' + ad.actual.length + ' sont différents (surlignés). Le début et la fin sont identiques pour te tromper.' }));
        }
        if (v.quote) main.append(h('div', { class: 'quote' }, h('small', { text: 'Le message vu sur la page' }), h('div', { text: v.quote })));
        if (v.reasons && v.reasons.length) { const ul = h('ul', { class: 'reasons' }); v.reasons.forEach((r) => ul.append(h('li', { text: r }))); main.append(ul); }
      }
      main.append(h('p', { class: 'small muted', text: 'Demande : ' + ctx.method }));

      // barriere de friction (bras B / C)
      let needMs = 0, phrase = null, phraseOk = true;
      if (needFriction) {
        needMs = v.level === 'manipulation' ? cfg.manipulationHoldMs : (cfg.arm === 'B' ? cfg.frictionMs : 0);
        if (cfg.arm === 'C') { phraseOk = false; if (v.level === 'manipulation') needMs = cfg.manipulationHoldMs; }
      }
      const gate = h('div', { class: 'gate' });
      let input = null;
      if (needFriction && cfg.arm === 'C') {
        phrase = v.address_diff ? v.address_diff.actual.slice(-4) : (v.phrase || PHRASES[Math.floor(Math.random() * PHRASES.length)]);
        gate.append(h('label', { for: 'pin', text: v.address_diff ? "Pour continuer malgré tout, recopie les 4 derniers caractères de l'adresse demandée :" : 'Pour continuer malgré tout, recopie cette phrase :' }));
        gate.append(h('p', { class: 'phrase', text: v.address_diff ? '(lis-les dans l\'adresse ci-dessus)' : phrase }));
        input = h('input', { type: 'text', id: 'pin', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
        gate.append(input);
      }
      let timerT = null, bar = null;
      if (needFriction && needMs > 0) {
        timerT = h('div', { class: 't', role: 'timer', text: fmtMs(needMs) });
        bar = h('i');
        gate.append(h('div', { class: 'timer' }, timerT, h('div', { class: 'bar' }, bar)));
      }
      const status = h('p', { class: 'vh', role: 'status', 'aria-live': 'polite' });
      gate.append(status);
      if (needFriction) main.append(gate);
      if (v.level === 'manipulation') {
        const c = cfg.contact || {};
        main.append(h('div', { class: 'contact' }, h('b', { text: 'Appeler un proche' }), h('span', { text: (c.name || 'Un proche de confiance') + (c.tel ? ' : ' + c.tel : '') }),
          h('span', { class: 'small', text: "Raccroche, puis rappelle toi-même. Aucun vrai support ne demande ça." })));
      }
      win.append(main);

      // pied : Annuler toujours visible, meme place, meme libelle
      const foot = h('footer');
      const cancel = h('button', { class: 'btn cancel' + (isRed || v.level === 'unknown' ? '' : ' soft'), type: 'button', id: 'cancel', text: 'Annuler, rien ne sera envoyé' });
      const go = h('button', { class: 'btn ' + (v.level === 'attention' ? 'go' : 'quiet' + (isRed ? ' danger' : '')), type: 'button', id: 'go' });
      const goLabel = v.level === 'attention' ? "Oui, c'est bien ça, continuer" : v.level === 'unknown' ? 'Continuer sans vérification, à mes risques' : 'Continuer malgré le danger';
      go.textContent = goLabel;
      const lockedBy = () => (needMs > 0 && performance.now() - t0 < needMs) || (input && !phraseOk);
      const refresh = () => { go.disabled = !!lockedBy(); };
      refresh();
      if (v.level === 'unknown') {
        const retry = h('button', { class: 'btn call', type: 'button', id: 'retry', text: 'Réessayer la vérification' });
        retry.addEventListener('click', () => fin('retry'));
        foot.append(retry);
      }
      foot.append(go, cancel, h('p', { class: 'reassure', text: 'Annuler ne coûte rien et tu peux recommencer plus tard.' }));
      win.append(foot);
      m.ov.append(win);

      let done = false, enabledAt = needMs > 0 ? null : (input ? null : 0), earlyBlocked = null;
      const fin = (decision) => {
        if (done) return; done = true; clearInterval(iv);
        const ttd = Math.round(performance.now() - t0);
        m.close();
        resolve({ decision, time_to_decision_ms: ttd, friction_ms: needMs, continue_enabled_after_ms: enabledAt, early_click_blocked: earlyBlocked, cancel_visible: cancelVisible, phrase_required: !!input, ui_frame: window === window.top ? 'top' : 'child', viewport: innerWidth + 'x' + innerHeight });
      };
      if (input) input.addEventListener('input', () => {
        const ok = norm(input.value) === norm(phrase);
        if (ok !== phraseOk) { phraseOk = ok; status.textContent = ok ? (needMs > 0 ? 'Phrase correcte. Attends la fin du compte à rebours.' : 'Phrase correcte.') : 'La phrase ne correspond plus.'; }
        refresh(); markEnabled();
      });
      const markEnabled = () => { if (enabledAt === null && !lockedBy()) enabledAt = Math.round(performance.now() - t0); };
      const iv = setInterval(() => {
        if (needMs > 0) {
          const left = Math.max(0, needMs - (performance.now() - t0));
          timerT.textContent = fmtMs(left); bar.style.transform = 'scaleX(' + (left / needMs) + ')';
          if (left > 0 && Math.round(left) % 60000 < 260) status.textContent = 'Il reste ' + fmtMs(left) + '.';
        }
        refresh(); markEnabled();
      }, 100);
      cancel.addEventListener('click', () => fin('cancel'));
      go.addEventListener('click', () => { if (!go.disabled) fin('confirm'); });
      m.ov.addEventListener('keydown', (e) => { if (e.key === 'Escape') fin('cancel'); });
      if (isRed || v.level === 'unknown') cancel.focus(); else go.focus();
      const cancelVisible = inViewport(cancel) && !cancel.disabled;

      // mode automatique (tests) : agit sur les vrais boutons
      const A = cfg.auto;
      if (A) setTimeout(async () => {
        if (done) return;
        if (go.disabled) { go.click(); earlyBlocked = !done && go.disabled; } else earlyBlocked = false;
        if (A.decision === 'cancel') { cancel.click(); return; }
        if (input && !phraseOk) { input.value = v.address_diff ? v.address_diff.actual.slice(-4) : phrase; input.dispatchEvent(new Event('input', { bubbles: true })); }
        const limit = performance.now() + needMs + 8000;
        while (!done && go.disabled && performance.now() < limit) await new Promise((r) => setTimeout(r, 40));
        if (!done) go.click();
      }, A.delayMs != null ? A.delayMs : 250);
    });
  }

  // ---------- ecran de questions (intention ou grilling) ----------
  function showChoices(spec, cfg, ctx) {
    return new Promise((resolve) => {
      const m = mountOverlay(); const t0 = performance.now();
      const isIntent = spec.kind === 'intent';
      const win = h('div', { class: 'win', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'h' });
      win.append(topBar(ctx.origin));
      win.append(h('div', { class: 'band ask' }, svgEl(SVG.warn), h('div', null, h('span', { class: 'tag', text: isIntent ? 'Une question' : 'Question ' + spec.index + ' sur ' + spec.total }), h('h1', { id: 'h', text: isIntent ? 'Avant de continuer' : 'Une vérification de plus' }))));
      const main = h('main');
      if (!isIntent && spec.intro && spec.index === 1) main.append(h('p', { class: 'muted small', text: spec.intro }));
      const options = isIntent ? [
        { id: 'receive', label: 'Je reçois de l\'argent ou un cadeau' }, { id: 'pay', label: 'Je paie ou j\'achète' },
        { id: 'login', label: 'Je me connecte à ce site' }, { id: 'asked', label: "Quelqu'un m'a demandé de le faire" }, { id: 'other', label: 'Autre chose / je ne sais pas' }] : spec.options;
      const fs = h('fieldset', { class: 'choices' }, h('legend', { text: isIntent ? "Qu'est-ce que tu es en train de faire ?" : spec.prompt }));
      options.forEach((o) => fs.append(h('label', { class: 'choice' }, h('input', { type: 'radio', name: 'c', value: o.id }), h('span', { text: o.label }))));
      main.append(fs);
      let ta = null;
      if (isIntent) { ta = h('textarea', { 'aria-label': 'Message reçu (facultatif)', placeholder: 'Colle le message reçu (facultatif)' }); main.append(ta, h('p', { class: 'small muted', text: 'Ta réponse peut seulement rendre la vérification plus stricte.' })); }
      win.append(main);
      const foot = h('footer');
      const ok = h('button', { class: 'btn go', type: 'button', id: 'ok', disabled: true, text: 'Continuer' });
      const cancel = h('button', { class: 'btn cancel soft', type: 'button', id: 'cancel', text: 'Annuler, rien ne sera envoyé' });
      foot.append(ok, cancel, h('p', { class: 'reassure', text: 'Annuler ne coûte rien et tu peux recommencer plus tard.' }));
      win.append(foot); m.ov.append(win);
      fs.addEventListener('change', () => { ok.disabled = !fs.querySelector('input:checked'); });
      let done = false;
      const cancelVisible = inViewport(cancel);
      const fin = (r) => { if (done) return; done = true; m.close(); resolve(Object.assign({ time_to_decision_ms: Math.round(performance.now() - t0), cancel_visible: cancelVisible }, r)); };
      ok.addEventListener('click', () => { const c = fs.querySelector('input:checked'); if (!c) return;
        fin(isIntent ? { decision: 'continue', intent: { choice: c.value, message: ta ? ta.value : '' } } : { decision: 'answer', option: c.value }); });
      cancel.addEventListener('click', () => fin({ decision: 'cancel' }));
      m.ov.addEventListener('keydown', (e) => { if (e.key === 'Escape') fin({ decision: 'cancel' }); });
      cancel.focus();
      const A = cfg.auto;
      if (A) setTimeout(() => {
        if (done) return;
        if (A.decision === 'cancel' || (!isIntent && A.cancelOnQuestion === spec.index)) { cancel.click(); return; }
        let pick;
        if (isIntent) pick = A.intent || 'pay';
        else {
          const pol = A.grill || 'clean', truth = spec.truth || [];
          if (pol === 'prefer_not') pick = 'prefer_not';
          else if (pol === 'signal') pick = (truth.find((t) => t.s > 0) || truth[0]).id;
          else pick = (truth.find((t) => t.s === 0) || truth[0]).id;
          if (A.grillAnswers && A.grillAnswers[spec.qid]) pick = A.grillAnswers[spec.qid];
        }
        const inp = fs.querySelector('input[value="' + pick + '"]'); if (inp) { inp.checked = true; fs.dispatchEvent(new Event('change')); }
        ok.click();
      }, A.delayMs != null ? A.delayMs : 250);
    });
  }

  if (window === window.top || true) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (!msg || msg.type !== 'ui') return false;
      const p = msg.spec.kind === 'verdict' ? showVerdict(msg.spec, msg.cfg, msg.ctx) : showChoices(msg.spec, msg.cfg, msg.ctx);
      p.then(sendResponse, () => sendResponse({ decision: 'cancel', error: 'ui-erreur' }));
      return true;
    });
  }
})();

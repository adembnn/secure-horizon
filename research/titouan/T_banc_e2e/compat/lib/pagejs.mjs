// Fragments JS evalues dans la page (Runtime.evaluate). Aucun ne declenche d'action: ils lisent le DOM
// et renvoient des coordonnees; le clic est fait cote Node via Input.dispatchMouseEvent.

const DEEP = `
const collect = (root, out) => { for (const el of root.querySelectorAll('*')) { out.push(el); if (el.shadowRoot) collect(el.shadowRoot, out); } return out; };
const deepText = (root, cap) => { let s = ''; const walk = (n) => { if (s.length > cap) return; if (n.nodeType === 3) { s += n.nodeValue + ' '; return; }
  if (n.nodeType === 1 && /^(SCRIPT|STYLE|NOSCRIPT)$/.test(n.tagName)) return;
  if (n.shadowRoot) walk(n.shadowRoot); for (const c of n.childNodes) walk(c); }; walk(root); return s.replace(/\\s+/g, ' ').trim(); };
const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return null;
  const cs = getComputedStyle(el); if (cs.visibility !== 'visible' || cs.display === 'none' || +cs.opacity < 0.05 || cs.pointerEvents === 'none') return null;
  return r; };
`;

export const FIND_CONNECT = `(() => { ${DEEP}
const NEG = /disconnect|\\bbuy\\b|\\bsell\\b|swap|\\bsend\\b|approve|confirm|mint|deposit|withdraw|stake|claim|bridge|transfer|\\bpay\\b|donate|subscribe|sign ?up|register|create|download|install|get (metamask|a wallet|wallet)|add to chrome|cookie|accept/i;
const T1 = [/^connect( your| a| to a)?( crypto)? ?wallet\\.?$/i, /^connect\\.?$/i, /^connect wallet/i, /^connecter( le| votre)? ?(portefeuille|wallet)/i, /^connect to wallet/i];
const T2 = [/^(launch|enter|open) ?(the )?app$/i, /^launch$/i, /^log ?in$/i, /^sign ?in$/i, /^login$/i, /^se connecter$/i, /^connexion$/i];
const tagHit = (el) => /(^|-)(connect-button|appkit-button|w3m-button|w3m-connect-button|appkit-connect-button)$/i.test(el.tagName);
const cands = [];
for (const el of collect(document, [])) {
  const tag = el.tagName; const role = el.getAttribute && el.getAttribute('role');
  const clickable = tag === 'BUTTON' || tag === 'A' || role === 'button' || role === 'menuitem' || tagHit(el) || (el.tabIndex >= 0 && tag === 'DIV');
  if (!clickable) continue;
  let text = (el.innerText || el.getAttribute('aria-label') || el.value || el.title || '').replace(/\\s+/g, ' ').trim();
  if (!text && tagHit(el)) text = '(web component ' + tag.toLowerCase() + ')';
  if (!text || text.length > 40 || NEG.test(text)) continue;
  let tier = 0; if (tagHit(el)) tier = 1; else if (T1.some(r => r.test(text))) tier = 1; else if (T2.some(r => r.test(text))) tier = 2;
  if (!tier) continue;
  let r = visible(el); if (!r) continue;
  if (r.bottom < 0 || r.top > innerHeight) { el.scrollIntoView({ block: 'center' }); r = el.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) continue; }
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hit = (el.getRootNode().elementFromPoint ? el.getRootNode() : document).elementFromPoint(cx, cy);
  if (!hit || !(hit === el || el.contains(hit) || hit.contains(el))) continue;       // masque par un bandeau: on ne le contourne pas
  cands.push({ tier, text, tag, x: cx, y: cy, top: r.top });
}
cands.sort((a, b) => a.tier - b.tier || a.top - b.top);
return JSON.stringify({ n: cands.length, pick: cands[0] || null, all: cands.slice(0, 5).map(c => c.tier + ':' + c.text) });
})()`;

export const FIND_OPTION = `(() => { ${DEEP}
const TXT = /^(metamask|meta mask|browser wallet|injected( wallet)?|detected wallet|installed)$/i;
const MODAL = '[role=dialog],[aria-modal=true],[class*=modal i],[class*=dialog i],[class*=popup i],[class*=overlay i],w3m-modal,appkit-modal,wcm-modal,[data-rk],[data-radix-portal],[class*=wallet i]';
const out = [];
for (const el of collect(document, [])) {
  const own = (el.innerText || '').replace(/\\s+/g, ' ').trim();
  const aria = (el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('data-testid') || el.getAttribute('data-wallet') || '')) || '';
  const hitTxt = TXT.test(own) || /metamask|io\\.metamask|injected/i.test(aria);
  if (!hitTxt || own.length > 40) continue;
  const inModal = !!el.closest(MODAL) || el.getRootNode() instanceof ShadowRoot;
  if (!inModal) continue;
  const r = visible(el); if (!r || r.top < 0 || r.bottom > innerHeight) continue;
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hit = (el.getRootNode().elementFromPoint ? el.getRootNode() : document).elementFromPoint(cx, cy);
  if (!hit || !(hit === el || el.contains(hit) || hit.contains(el))) continue;
  out.push({ text: own || aria, tag: el.tagName, x: cx, y: cy, area: r.width * r.height });
}
out.sort((a, b) => a.area - b.area);
return JSON.stringify({ n: out.length, pick: out[0] || null });
})()`;

export const SNAPSHOT_UI = `(() => { ${DEEP}
const dlgs = collect(document, []).filter(e => e.matches && e.matches('[role=dialog],[aria-modal=true],w3m-modal,appkit-modal,wcm-modal,[class*=modal i]') && visible(e));
let modal = ''; for (const d of dlgs.slice(0, 3)) modal += ' ' + deepText(d, 600);
modal = modal.replace(/\\s+/g, ' ').trim().slice(0, 300);
const body = document.body ? deepText(document.body, 150000) : '';
return JSON.stringify({ modal, modalCount: dlgs.length, wc: /walletconnect|scan (with|this)|qr code|reown/i.test(modal) || /walletconnect/i.test(modal),
  connectedUI: /0x1111|1111\\u2026|1111\\.\\.\\.|0x11\\u202611|0x1111\\u2026/i.test(body) && /1111/.test(body),
  mmListed: /metamask/i.test(modal), title: document.title, bodyLen: body.length, nodes: document.getElementsByTagName('*').length,
  readyState: document.readyState, head: body.slice(0, 220) });
})()`;

export const SNAPSHOT_STATE = `(() => { const s = window.__compat_state; if (!s) return JSON.stringify({ missing: true });
return JSON.stringify({ mode: s.mode, reads: s.reads, sets: s.sets, overwritten: s.overwritten, req6963: s.req6963, calls: s.calls.slice(0, 60),
  blockedSign: s.blockedSign, wcalls: s.wcalls, wreads: s.wreads }); })()`;

// Empreinte d'alteration: identique pour tous les sites, comparee entre bras.
export const TAMPER_PROBE = `(() => { const r = {}; try {
  const e = window.ethereum; r.type = typeof e; if (!e) return JSON.stringify(r);
  const s = window.__compat_state; r.ours = !!s && e === s.eth;
  const FPT = Function.prototype.toString;
  r.tag = Object.prototype.toString.call(e);
  r.own = Object.getOwnPropertyNames(e).sort().join(',');
  r.proto = Object.getPrototypeOf(e) === Object.getPrototypeOf(e) && Object.getPrototypeOf(e) && Object.getPrototypeOf(e).constructor && Object.getPrototypeOf(e).constructor.name;
  let rs = ''; try { rs = FPT.call(e.request); } catch (x) { rs = 'ERR:' + x.name; }
  r.reqNative = /\\[native code\\]/.test(rs); r.reqName = e.request.name; r.reqLen = e.request.length; r.reqStable = e.request === e.request;
  r.onReturnsSelf = (() => { const f = () => {}; const x = e.on('__probe__', f); e.removeListener('__probe__', f); return x === e; })();
  let got = null; const h = (ev) => { got = ev.detail && ev.detail.provider; }; window.addEventListener('eip6963:announceProvider', h);
  window.dispatchEvent(new Event('eip6963:requestProvider')); window.removeEventListener('eip6963:announceProvider', h); r.same6963 = got === e;
  r.isMetaMask = e.isMetaMask; r.overwritten = !!(s && s.overwritten);
} catch (x) { r.err = String(x && x.name) + ':' + String(x && x.message).slice(0, 80); } return JSON.stringify(r); })()`;

// Sonde CSP: une injection par <script> en ligne (ce que fait une extension classique) est-elle bloquee ?
export const CSP_PROBE = `(async () => { const v = []; const h = (e) => v.push(String(e.violatedDirective)); document.addEventListener('securitypolicyviolation', h);
  window.__cspProbe = 0; let threw = null;
  try { const s = document.createElement('script'); s.textContent = 'window.__cspProbe=1'; (document.documentElement || document.head).appendChild(s); s.remove(); } catch (x) { threw = String(x.name); }
  await new Promise(r => setTimeout(r, 120)); document.removeEventListener('securitypolicyviolation', h);
  const ok = window.__cspProbe === 1; try { delete window.__cspProbe; } catch (_) {}
  return JSON.stringify({ inlineExecuted: ok, violations: v.slice(0, 3), threw }); })()`;

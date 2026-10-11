// Mini DOM de test (aucun navigateur) : juste ce qu'utilisent js/ui.js et js/holdup.js. Sert a EXECUTER pour de vrai le code de la fenetre "Hold up !" dans Node.
export class Text { constructor(d) { this.nodeType = 3; this.data = String(d); } get textContent() { return this.data; } }
const parseSel = (s) => s.split(',').map((x) => x.trim()).filter(Boolean).map((x) => {
  const m = { tag: null, cls: [], attrs: [], notDisabled: false };
  const nd = x.match(/:not\(\[disabled\]\)/); if (nd) { m.notDisabled = true; x = x.replace(nd[0], ''); }
  for (const a of x.matchAll(/\[([\w-]+)\]/g)) m.attrs.push(a[1]);
  x = x.replace(/\[[^\]]+\]/g, '');
  for (const c of x.matchAll(/\.([\w-]+)/g)) m.cls.push(c[1]);
  const tag = x.replace(/\.[\w-]+/g, '').trim(); if (tag) m.tag = tag.toUpperCase();
  return m;
});
export class El {
  constructor(tag) { this.nodeType = 1; this.tagName = String(tag).toUpperCase(); this.children = []; this.attrs = {}; this.listeners = {}; this.parent = null; this.className = ''; this.style = {}; }
  get textContent() { return this.children.map((c) => c.textContent).join(''); }
  set textContent(v) { this.children = [new Text(v)]; }
  get dataset() { return new Proxy({}, { get: (_, k) => this.attrs['data-' + String(k)] }); }
  get firstChild() { return this.children[0] || null; }
  get disabled() { return 'disabled' in this.attrs; } set disabled(v) { if (v) this.attrs.disabled = ''; else delete this.attrs.disabled; }
  get hidden() { return 'hidden' in this.attrs; } set hidden(v) { if (v) this.attrs.hidden = ''; else delete this.attrs.hidden; }
  append(...n) { for (const c of n) { const k = c && c.nodeType ? c : new Text(c); if (k.parent) k.parent.removeChild(k); k.parent = this; this.children.push(k); } }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) { this.children.splice(i, 1); c.parent = null; } return c; }
  remove() { if (this.parent) this.parent.removeChild(this); }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  click() { if (this.disabled) return false; for (const f of this.listeners.click || []) f({ target: this }); return true; }
  focus() { document.activeElement = this; }
  matches(m) { if (this.tagName === '#') return false; if (m.tag && this.tagName !== m.tag) return false; const cl = (this.className || '').split(/\s+/); if (!m.cls.every((c) => cl.includes(c))) return false; if (!m.attrs.every((a) => a in this.attrs)) return false; if (m.notDisabled && this.disabled) return false; return true; }
  querySelectorAll(sel) { const ms = parseSel(sel); const out = []; const walk = (e) => { for (const c of e.children) if (c.nodeType === 1) { if (ms.some((m) => c.matches(m))) out.push(c); walk(c); } }; walk(this); return out; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
export function installFakeDom() {
  const body = new El('body'); const docL = {};
  const timers = []; let tid = 0;
  globalThis.document = {
    body, activeElement: null,
    createElement: (t) => new El(t), createTextNode: (d) => new Text(d),
    addEventListener: (t, f) => { (docL[t] = docL[t] || []).push(f); }, removeEventListener: (t, f) => { docL[t] = (docL[t] || []).filter((x) => x !== f); },
    querySelector: (s) => body.querySelector(s), querySelectorAll: (s) => body.querySelectorAll(s),
  };
  globalThis.setInterval = (fn) => { const id = ++tid; timers.push({ id, fn }); return id; };
  globalThis.clearInterval = (id) => { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1); };
  return { body, press: (key) => { for (const f of docL.keydown || []) f({ key, preventDefault() {}, stopPropagation() {}, shiftKey: false }); }, tick: () => { for (const t of [...timers]) t.fn(); }, timersActive: () => timers.length };
}

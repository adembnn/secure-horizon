// Petits utilitaires DOM + rendu du verdict. TOUT le texte passe par textContent (jamais innerHTML) : une requete collee ne peut pas injecter de code dans la page.
import { displayLevel, explain } from './verdict_model.js';
import { intentLabel } from './scenarios.js';

export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of kids.flat()) if (c !== undefined && c !== null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

const SEV = { critical: 'critique', warn: 'à vérifier', info: 'info' };

// Rend le verdict dans `root`. opts : { body, local, intentKey, withTech (defaut true) }
export function renderVerdict(root, v, opts = {}) {
  const lv = displayLevel(v);
  const t = v.texts || {};
  clear(root);
  root.append(
    h('p', { class: 'chip chip-' + lv.key, role: 'status' }, lv.label),
    h('p', { class: 'lead' }, lv.sentence),
  );
  const gap = h('dl', { class: 'gap gap-' + lv.key });
  const said = h('div', {}, h('dt', {}, 'Tu as dit'), h('dd', {}, t.croit || ''));
  if (opts.intentKey) said.append(h('dd', { class: 'sub' }, 'Ton intention : ' + intentLabel(opts.intentKey)));
  gap.append(said, h('div', { class: 'real' }, h('dt', {}, 'En réalité'), h('dd', {}, t.reel || '')));
  root.append(gap);
  root.append(h('p', { class: 'danger-line' }, t.danger || ''), h('p', { class: 'action-line' }, t.action || ''));
  if (v.quote) root.append(h('blockquote', { class: 'quote' }, h('span', { class: 'quote-lab' }, 'Sur la page : '), '« ' + v.quote + ' »'));
  if (v.address_diff) {
    root.append(h('div', { class: 'addrs' },
      h('p', {}, h('span', { class: 'lab' }, v.address_diff.expectedLabel + ' '), h('code', {}, v.address_diff.expected)),
      h('p', {}, h('span', { class: 'lab' }, 'Adresse de la demande '), h('code', {}, v.address_diff.actual))));
  }
  if (v.indeterminate && v.why) root.append(h('p', { class: 'muted' }, 'Pourquoi : ' + v.why));
  if (opts.withTech !== false) root.append(techPanel(v, opts));
  return root;
}

// Panneau "ce que le moteur a vu" (jury technique) : effets decodes, raisons, textes de la fiche, mesures.
export function techPanel(v, opts = {}) {
  const d = h('details', { class: 'tech' }, h('summary', {}, 'Ce que le moteur a vu'));
  const ex = opts.body ? explain(opts.body, opts.local) : null;
  if (ex && ex.lines.length) d.append(h('h4', {}, 'Effets décodés'), h('ul', {}, ex.lines.map((l) => h('li', {}, h('b', {}, l.k + ' : '), l.v))));
  else if (ex && !ex.ok) d.append(h('p', { class: 'muted' }, 'Décodage impossible : ' + ex.why));
  const sig = (ex && ex.signals) || [];
  if (sig.length) d.append(h('h4', {}, 'Signaux du moteur d’effets'), h('ul', {}, sig.map((s) => h('li', {}, h('b', {}, s.code + ' '), '(' + (SEV[s.severity] || s.severity) + ') ' + s.detail))));
  const rs = (v.raisons || []).filter((r) => r.code);
  if (rs.length) d.append(h('h4', {}, 'Raisons retenues (comparateur + politique)'), h('ul', {}, rs.map((r) => h('li', {}, h('b', {}, r.code + ' '), r.severity ? '(' + (SEV[r.severity] || r.severity) + ') ' : '', r.detail || r.said || r.does || ''))));
  if (ex && ex.policyNotes && ex.policyNotes.length) d.append(h('p', { class: 'muted' }, 'Notes de politique : ' + ex.policyNotes.join(', ')));
  d.append(h('h4', {}, 'Mesures'), h('ul', {},
    h('li', {}, 'Niveau du moteur : ' + v.niveau + ' · niveau affiché : ' + v.level),
    h('li', {}, 'Fiche de texte : ' + (v.fiche || 'aucune') + ' (' + (v.texts_source || '—') + ')'),
    h('li', {}, 'Droit donné : ' + (v.effects && v.effects.grants_right ? 'oui' : 'non') + ' · fonds sortants : ' + (v.effects && v.effects.funds_out ? 'oui' : 'non')),
    h('li', {}, 'Calcul : ' + (v.latency_ms !== undefined ? v.latency_ms + ' ms' : '—') + ' dans cette page, aucune donnée envoyée'),
    h('li', {}, 'Moteur : ' + v.engine)));
  return d;
}

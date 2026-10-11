// Petits utilitaires DOM + rendu du verdict (structure R3 Figma). TOUT le texte passe par textContent (jamais innerHTML) : une requete collee ne peut pas injecter de code dans la page.
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
const NBSP = ' ';

// Mise en forme FRANCAISE des phrases venues des fiches (presentation seulement, jamais de changement de sens) :
// virgule decimale, "ETH" au lieu de NATIVE, espace insecable avant ":", et trois tournures que le moteur remplit mal.
export function fx(s, o = {}) {
  let t = String(s == null ? '' : s);
  t = t.replace(/(\d+)\.(\d+)(?=\s)/g, '$1,$2').replace(/\bNATIVE\b/g, 'ETH');
  t = t.replace(/tes plusieurs NFT/g, 'tous tes NFT');
  t = t.replace(/Tu envoies (.+?) à un escroc: personne ne pourra les récupérer\./, 'Tu enverrais $1 à la personne qui te guide. Personne ne pourra les récupérer.');
  if (o.intentKey === 'swap') t = t.replace(/envoie ([^.]+?) à ton contact/, 'échange $1');
  return t.replace(/(\S) ?: (?=\S)/g, '$1' + NBSP + ': ');
}

// ---------- adresses : grille fixe 2 x 5 groupes de 4 caracteres, caracteres differents marques ----------
const ADDR = /^0x[0-9a-fA-F]{40}$/;
function addrDd(addr, other, mark) {
  const a = addr.slice(2), b = other.slice(2).toLowerCase();
  const dd = h('dd', {}, h('span', { class: 'sr-only' }, addr));
  dd.append(h('span', { class: 'px', 'aria-hidden': 'true' }, '0x'));
  for (let g = 0; g < 10; g++) {
    if (g === 5) dd.append(h('span', { class: 'px', 'aria-hidden': 'true' }));
    const grp = h('span', { 'aria-hidden': 'true' });
    for (let i = g * 4; i < g * 4 + 4; i++) grp.append(!mark || a[i].toLowerCase() === b[i] ? a[i] : h('span', { class: 'd' }, a[i]));
    dd.append(grp);
  }
  return dd;
}
function addrBlock(ad) {
  const name = String(ad.expectedLabel || '').split(' (')[0];
  const known = name && !/^Adresse/i.test(name) ? 'Adresse de ' + name : 'Adresse habituelle';
  if (!ADDR.test(ad.expected || '') || !ADDR.test(ad.actual || '')) { // forme inattendue : on montre les deux textes tels quels
    return { node: h('dl', { class: 'addr' }, h('div', { class: 'known' }, h('dt', {}, known), h('dd', {}, ad.expected)), h('div', { class: 'real' }, h('dt', {}, 'Adresse demandée'), h('dd', {}, ad.actual))), count: null };
  }
  let n = 0; for (let i = 2; i < 42; i++) if (ad.actual[i].toLowerCase() !== ad.expected[i].toLowerCase()) n++;
  return {
    node: h('dl', { class: 'addr' }, h('div', { class: 'known' }, h('dt', {}, known), addrDd(ad.expected, ad.actual, false)), h('div', { class: 'real' }, h('dt', {}, 'Adresse demandée'), addrDd(ad.actual, ad.expected, true))),
    count: n + (n > 1 ? ' caractères différents' : ' caractère différent') + ' sur 40',
  };
}

// Decoupe le verdict en deux : `top` (ce qu'on voit en 3 s : titre + ecart) et `why` (derriere "Pourquoi ?").
// opts : { body, local, intentKey, ids (true = pose id hu-title), withTech (defaut true) }
export function verdictParts(v, opts = {}) {
  const lv = displayLevel(v);
  const t = v.texts || {};
  const o = { intentKey: opts.intentKey };
  const idAttr = opts.ids ? { id: 'hu-title' } : {};
  const top = [];
  if (lv.key === 'manipulation') {
    top.push(h('h1', { class: 'instruction', ...idAttr }, fx(lv.sentence, o)), h('p', { class: 'reassure' }, 'Rien n’est parti.'));
  } else {
    const quietLv = lv.key === 'info' || lv.key === 'unknown'; // pas d'alerte : le titre nomme l'etat, la phrase rappelle que ce n'est pas une garantie
    top.push(h('h1', { class: 'verdict', ...idAttr }, quietLv ? lv.label + '.' : fx(lv.sentence, o)));
    if (quietLv) top.push(h('p', { class: 'reassure' }, fx(lv.sentence, o)));
    if (opts.compare && lv.key !== 'unknown' && !v.address_diff) {
      // intention ECRITE contre effet reel. Jamais de vert ni de "OK" : meme quand rien n'est vu, on dit que ce n'est pas une garantie.
      const match = lv.key === 'info';
      top.push(h('dl', { class: 'gap gap-' + lv.key },
        h('div', {}, h('dt', {}, 'Ce que tu voulais'), h('dd', {}, '« ' + opts.compare.voulu + ' »')),
        h('div', { class: 'real' }, h('dt', {}, 'Ce que la demande fait'), h('dd', {}, fx(t.reel, o)))),
      h('p', { class: 'match ' + (match ? 'match-yes' : 'match-no') }, match ? 'Ça correspond, d’après ce que Hold up sait lire. Ce n’est pas une garantie.' : 'Ça ne correspond pas.'));
    } else if (v.address_diff) {
      const a = addrBlock(v.address_diff);
      top.push(a.node); if (a.count) top.push(h('p', { class: 'count' }, a.count));
    } else if (lv.key === 'unknown') {
      top.push(h('dl', { class: 'gap gap-unknown' }, h('div', { class: 'real' }, h('dt', {}, 'Ce que l’on sait'), h('dd', {}, fx(t.reel, o)))));
    } else {
      top.push(h('dl', { class: 'gap gap-' + lv.key },
        h('div', {}, h('dt', {}, 'Tu crois'), h('dd', {}, '« ' + fx(t.croit, o) + ' »')),
        h('div', { class: 'real' }, h('dt', {}, 'En vrai'), h('dd', {}, fx(t.reel, o)))));
    }
  }
  const why = [];
  if (lv.key === 'manipulation' || v.address_diff || (opts.compare && lv.key !== 'unknown')) { // l'ecart est replie : on le redonne ici
    if (lv.key !== 'unknown') why.push(h('p', {}, 'Tu crois : « ' + fx(t.croit, o) + ' »'), h('p', {}, 'En vrai : ' + fx(t.reel, o)));
  }
  if (t.danger) why.push(h('p', { class: 'danger-line' }, fx(t.danger, o)));
  if (t.action) why.push(h('p', { class: 'action-line' }, fx(t.action, o)));
  if (v.quote) why.push(h('p', { class: 'quote' }, h('span', { class: 'quote-lab' }, 'Message vu sur la page'), '« ' + v.quote + ' »'));
  if (v.indeterminate && v.why) why.push(h('p', {}, 'Pourquoi : ' + v.why));
  why.push(h('p', {}, 'Niveau : ' + lv.label + '.'));
  if (opts.withTech !== false) why.push(techPanel(v, opts));
  return { lv, top, why };
}

export function whyDetails(why) {
  return h('details', { class: 'why' }, h('summary', {}, 'Pourquoi ?'), h('div', { class: 'inner' }, why));
}

// Rend le verdict dans `root` (page « Colle une transaction »). opts : { body, local, intentKey, withTech }
export function renderVerdict(root, v, opts = {}) {
  const p = verdictParts(v, opts);
  clear(root);
  root.append(...p.top, whyDetails(p.why));
  return root;
}

// Panneau "preuves" (jury technique) : effets decodes, raisons, textes de la fiche, mesures.
export function techPanel(v, opts = {}) {
  const d = h('details', { class: 'tech' }, h('summary', {}, 'Voir les preuves techniques'));
  const ex = opts.body ? explain(opts.body, opts.local) : null;
  if (ex && ex.lines.length) d.append(h('h4', {}, 'Effets décodés'), h('ul', {}, ex.lines.map((l) => h('li', {}, h('b', {}, l.k + ' : '), fx(l.v)))));
  else if (ex && !ex.ok) d.append(h('p', {}, 'Décodage impossible : ' + ex.why));
  const sig = (ex && ex.signals) || [];
  if (sig.length) d.append(h('h4', {}, 'Signaux du moteur d’effets'), h('ul', {}, sig.map((s) => h('li', {}, h('b', {}, s.code + ' '), '(' + (SEV[s.severity] || s.severity) + ') ' + s.detail))));
  const rs = (v.raisons || []).filter((r) => r.code);
  if (rs.length) d.append(h('h4', {}, 'Raisons retenues (comparateur + politique)'), h('ul', {}, rs.map((r) => h('li', {}, h('b', {}, r.code + ' '), r.severity ? '(' + (SEV[r.severity] || r.severity) + ') ' : '', r.detail || r.said || r.does || ''))));
  if (ex && ex.policyNotes && ex.policyNotes.length) d.append(h('p', {}, 'Notes de politique : ' + ex.policyNotes.join(', ')));
  d.append(h('h4', {}, 'Mesures'), h('ul', {},
    h('li', {}, 'Niveau du moteur : ' + v.niveau + ' · niveau affiché : ' + v.level),
    h('li', {}, 'Fiche de texte : ' + (v.fiche || 'aucune') + ' (' + (v.texts_source || '—') + ')'),
    h('li', {}, 'Droit donné : ' + (v.effects && v.effects.grants_right ? 'oui' : 'non') + ' · fonds sortants : ' + (v.effects && v.effects.funds_out ? 'oui' : 'non')),
    h('li', {}, 'Calcul : ' + (v.latency_ms !== undefined ? v.latency_ms + ' ms' : '—') + ' dans cette page, aucune donnée envoyée'),
    h('li', {}, 'Moteur : ' + v.engine)));
  return d;
}

export { intentLabel };

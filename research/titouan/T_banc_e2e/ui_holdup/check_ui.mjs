// Contrôle automatique de la surface Hold up (Node 24, zéro dépendance, aucun navigateur).
// Il fait tourner verdict.js dans un mini-DOM simulé, pour les 30 fiches x tous les écrans x 3 frictions,
// puis vérifie : 12 mots max par ligne, mots interdits, Annuler présent et au moins aussi visible que Continuer,
// frictions qui se comportent comme prévu, et contrôles statiques (innerHTML, URL externes, vert).
// Usage : node check_ui.mjs   (code de sortie 1 s'il y a au moins une erreur)
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const MAX = 12;

// ---------- mini-DOM ----------
class Node_ {
  constructor(tag, doc) { this.tagName = tag.toUpperCase(); this.ownerDocument = doc; this.children = []; this.attrs = {}; this.listeners = {}; this.className = ''; this._text = ''; this.value = ''; this.parent = null; }
  set textContent(v) { this.children = []; this._text = String(v); }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
  removeEventListener(t, f) { this.listeners[t] = (this.listeners[t] || []).filter((x) => x !== f); }
  focus() { this.ownerDocument.activeElement = this; }
  // sous-ensemble : liste de balises ou input[type=radio]
  querySelectorAll(sel) { const radio = /type=radio/.test(sel); const tags = sel.split(',').map((x) => x.trim().toUpperCase()); const o = []; const rec = (n) => { for (const c of n.children) { if (radio ? (c.tagName === 'INPUT' && c.attrs.type === 'radio') : tags.includes(c.tagName)) o.push(c); rec(c); } }; rec(this); return o; }
  fire(t, ev = {}) { const e = { type: t, key: ev.key, shiftKey: !!ev.shiftKey, target: this, preventDefault() { this.prevented = true; }, ...ev }; for (const f of this.listeners[t] || []) f(e); for (let p = this.parent; p && t === 'keydown'; p = p.parent) for (const f of p.listeners[t] || []) f(e); return e; }
}
function makeDoc() { const d = { activeElement: null, createElement: (t) => new Node_(t, d) }; return d; }
function* walk(n, raw = false) {
  const isRaw = raw || n.attrs['data-raw'] === '1';
  yield [n, isRaw];
  for (const c of n.children) yield* walk(c, isRaw);
}
function find(root, pred) { for (const [n] of walk(root)) if (pred(n)) return n; return null; }
function findAll(root, pred) { const o = []; for (const [n] of walk(root)) if (pred(n)) o.push(n); return o; }

// ---------- chargement ----------
globalThis.HOLDUP_NO_BOOT = true;
const HoldUp = require('./verdict.js');
const Demo = require('./demo.js');
const fiches = JSON.parse(readFileSync(join(dir, '..', '..', 'U_textes_utilisateur.json'), 'utf8'));

const src = readFileSync(join(dir, '..', '..', 'check_textes.mjs'), 'utf8');
const lit = src.match(/const INTERDITS = (\[[\s\S]*?\]);/)[1];
const INTERDITS = JSON.parse(lit.replace(/'/g, '"').replace(/,\s*\]/, ']'));
const lettre = '[\\p{L}\\p{N}_]';
const motsInterdits = INTERDITS.map((m) => ({ m, re: new RegExp(`(?<!${lettre})${m.replace(/ /g, '\\s+')}(?!${lettre})`, 'iu') }));
const NUMERO = /\b(7702|4337|2612)\b/;

const erreurs = [];
const err = (ctx, msg) => erreurs.push(`${ctx}: ${msg}`);
let nbEcrans = 0, nbLignes = 0, nbInteractions = 0;
const parEcran = {};

function monde() {
  const doc = makeDoc();
  let t = 1000;
  const ticks = [];
  const env = {
    doc, now: () => t,
    setInterval: (f, ms) => { ticks.push({ f, ms, id: ticks.length + 1 }); return ticks.length; },
    clearInterval: (id) => { const x = ticks.find((k) => k.id === id); if (x) x.dead = true; },
    advance(ms) { const end = t + ms; while (t < end) { t = Math.min(end, t + 250); for (const k of ticks) if (!k.dead) k.f(); } },
  };
  return env;
}
function rendu(msg, env = monde()) {
  const root = env.doc.createElement('div');
  const out = [];
  const ctl = HoldUp.render(root, msg, { inline: true, now: env.now, setInterval: env.setInterval, clearInterval: env.clearInterval, onDecision: (d) => out.push(d) });
  return { root, ctl, out, env };
}

function lignes(root) {
  const l = [];
  for (const [n, raw] of walk(root)) {
    if (raw) { if (n.attrs['data-raw'] === '1' && n.textContent.trim() && n.tagName === 'P') l.push({ t: n.textContent, interdits: false }); continue; }
    if (n._text.trim()) l.push({ t: n._text, interdits: true });
    for (const a of ['aria-label']) if (n.attrs[a]) l.push({ t: n.attrs[a], interdits: true });
  }
  return l;
}
// Règle de comptage (documentée dans UI_CONTRAT.md) : un nombre avec séparateur de milliers (2 480) compte pour 1 mot ;
// les signes seuls (guillemets, tirets) ne comptent pas.
function mots(s) {
  return s.replace(/(\d)[\s  ](?=\d{3}(?!\d))/g, '$1').trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

function verifierEcran(ctx, r) {
  nbEcrans++;
  const screen = r.root.children[0]?.attrs['data-screen'] || '?';
  parEcran[screen] = (parEcran[screen] || 0) + 1;
  for (const { t, interdits } of lignes(r.root)) {
    nbLignes++;
    const n = mots(t);
    if (n > MAX) err(ctx, `${n} mots (max ${MAX}) : « ${t} »`);
    if (/\{\w+\}/.test(t)) err(ctx, `variable non remplacée : « ${t} »`);
    if (!interdits) continue;
    for (const { m, re } of motsInterdits) if (re.test(t)) err(ctx, `mot interdit « ${m} » dans : « ${t} »`);
    if (NUMERO.test(t)) err(ctx, `numéro technique dans : « ${t} »`);
  }
  const boutons = findAll(r.root, (n) => n.tagName === 'BUTTON');
  const annuler = boutons.find((b) => b.attrs['data-action'] === 'cancel');
  if (!annuler) return err(ctx, 'bouton Annuler absent');
  if (annuler.textContent.trim() !== 'Annuler') err(ctx, `libellé Annuler inattendu : « ${annuler.textContent} »`);
  if (/\bquiet\b/.test(annuler.className)) err(ctx, 'Annuler en lien discret');
  if (annuler.attrs['aria-disabled'] === 'true') err(ctx, 'Annuler désactivé');
  const cont = boutons.find((b) => b.attrs['data-action'] === 'continue');
  if (screen !== 'intention') {
    if (!cont) err(ctx, 'bouton Continuer absent');
    else {
      if (boutons.indexOf(annuler) > boutons.indexOf(cont)) err(ctx, 'Annuler placé après Continuer');
      if (!/btn-primary/.test(annuler.className) || /btn-primary/.test(cont.className)) err(ctx, 'Annuler doit être le bouton principal, pas Continuer');
    }
  } else {
    const go = boutons.find((b) => b.attrs['data-action'] === 'intent');
    if (go && !/btn-primary/.test(go.className)) err(ctx, 'bouton de validation d\'intention sans style principal');
    if (!/\bbtn\b/.test(annuler.className) || /\bquiet\b/.test(annuler.className)) err(ctx, 'Annuler d\'intention trop discret');
  }
  if (!r.root.children[0].attrs['aria-labelledby'] || !find(r.root, (n) => n.id === r.root.children[0].attrs['aria-labelledby'])) err(ctx, 'aria-labelledby ne pointe sur aucun titre');
  if (r.root.children[0].attrs.role !== 'alertdialog') err(ctx, 'role alertdialog manquant');
  if (!(r.env.doc.activeElement)) err(ctx, 'aucun focus initial');
  else if (screen !== 'intention' && r.env.doc.activeElement !== annuler) err(ctx, 'le focus initial n\'est pas sur Annuler');
  return screen;
}

// ---------- 1. matrice complète ----------
const FRICTIONS = [{ type: 'none' }, { type: 'wait', seconds: 30 }, { type: 'phrase', phrase: 'Je veux continuer malgré le danger' }];
const vars = fiches.variables;
for (const f of fiches.fiches) {
  for (const mode of Demo.MODES) {
    for (const fr of FRICTIONS) {
      for (const theme of ['light', 'dark']) {
        if (theme === 'dark' && mode !== 'auto') continue;
        const ctx = `${f.id}/${mode}/${fr.type}/${theme}`;
        const r = rendu(Demo.fromFiche(f, vars, mode, fr, theme));
        verifierEcran(ctx, r);
        if (r.root.attrs['data-theme'] !== theme) err(ctx, 'thème non appliqué');
      }
    }
  }
  if (f.variante_info) {
    const r = rendu(Demo.fromFiche(f, vars, 'info', { type: 'none' }));
    verifierEcran(`${f.id}/variante_info`, r);
  }
  const m = Demo.fromFiche(f, vars, 'auto');
  const titre = find(rendu(m).root, (n) => n.tagName === 'H1');
  if (!titre || mots(titre.textContent) > MAX) err(f.id, 'titre absent ou trop long');
}
for (const fr of FRICTIONS) verifierEcran(`intention/${fr.type}`, rendu({ ...Demo.intention(vars), friction: fr }));
verifierEcran('intention/sans site', rendu({ type: 'holdup.verdict', version: 1, mode: 'intention' }));

// ---------- 2. messages réels du moteur (forme server.mjs / sentinelle_core.js) ----------
const moteur = [
  { level: 'danger', niveau: 'critical', fiche: 'F01', texts: { croit: 'Je veux seulement faire mon échange.', reel: 'Tu donnes à ce site le droit de prendre tes jetons.', danger: 'Ce droit dure tant que tu ne le retires pas toi-même.', action: 'Refuse, ou autorise seulement le montant utile.' }, reasons: ['Ce droit dure tant que tu ne le retires pas toi-même.', 'Refuse, ou autorise seulement le montant utile.'] },
  { level: 'danger', niveau: 'critical', fiche: 'F13', texts: { croit: 'J\'envoie à mon contact.', reel: 'Ton argent partirait vers une autre adresse.', danger: 'Un inconnu a glissé une adresse presque identique.', action: 'Annule, puis recopie l\'adresse lettre par lettre.' }, address_diff: { expected: '0x7a3F9c21B04e5D8a1f6C2E90aB4733dE8c15E2b9', actual: '0x7a3F1d88Ce0277aF0b3D9a41F6c20e5B4d19E2b9', expectedLabel: 'Paul (adresse déjà utilisée par toi)' }, risk_signals: ['lookalike'] },
  { level: 'manipulation', niveau: 'critical', fiche: 'F21', texts: { croit: 'Le support me guide.', reel: 'Tu envoies ton argent à un escroc.', danger: 'Un vrai support ne te demande jamais de signer.', action: 'Raccroche, puis rappelle toi-même le numéro officiel.' }, reasons: ['Un vrai support ne te demandera jamais ça.', 'Un vrai support ne te demande jamais de signer.', 'Raccroche, puis rappelle toi-même le numéro officiel.'], quote: 'Pour protéger vos fonds transférez-les maintenant vers le portefeuille sécurisé que je vous indique immédiatement et sans délai' },
  { level: 'attention', niveau: 'warn', fiche: 'F18', texts: { croit: 'Je change mes jetons.', reel: 'Tu recevrais moins que prévu.', danger: 'Le prix peut glisser pendant l\'échange.', action: 'Vérifie le montant reçu avant de signer.' } },
  { level: 'unknown', niveau: 'warn', indeterminate: true, why: 'x', fiche: 'F25', texts: { croit: 'Aucune alerte, donc je signe.', reel: 'Nous n\'avons pas pu vérifier cette opération.', danger: 'Elle peut être piégée comme normale.', action: 'Vérifie toi-même avant de signer.' } },
  { level: 'attention', niveau: 'info', fiche: 'F26', texts: { croit: 'Je fais l\'opération demandée.', reel: 'Nous n\'avons trouvé aucun signal dangereux dans cette demande.', danger: 'Notre vérification est limitée.', action: 'Contrôle toi-même le destinataire.' } },
  { level: 'unknown', niveau: 'warn', indeterminate: true, texts: {}, reasons: [] },
  {},
];
const attendu = ['danger', 'address', 'manipulation', 'attention', 'unknown', 'info', 'unknown', 'attention'];
moteur.forEach((v, i) => {
  const r = rendu({ type: 'holdup.verdict', version: 1, id: 'm' + i, mode: 'verdict', site: 'exemple.test', friction: { type: 'none' }, verdict: v });
  const s = verifierEcran(`moteur#${i}`, r);
  if (s && s !== attendu[i]) err(`moteur#${i}`, `écran ${s}, attendu ${attendu[i]}`);
});

// ---------- 3. comportements ----------
function t(ctx, cond, msg) { nbInteractions++; if (!cond) err(ctx, msg); }
{
  const f = fiches.fiches[0];
  const clic = (r, action) => find(r.root, (n) => n.attrs['data-action'] === action).fire('click');
  // sans délai
  let r = rendu(Demo.fromFiche(f, vars, 'danger', { type: 'none' }));
  r.env.advance(2345); clic(r, 'continue');
  t('friction/aucune', r.out.length === 1 && r.out[0].decision === 'continue' && r.out[0].time_to_decision_ms === 2345, 'Continuer sans délai ou time_to_decision_ms faux : ' + JSON.stringify(r.out));
  clic(r, 'cancel'); t('decision unique', r.out.length === 1, 'deuxième décision acceptée');
  // 30 s
  r = rendu(Demo.fromFiche(f, vars, 'danger', { type: 'wait', seconds: 30 }));
  const cont = find(r.root, (n) => n.attrs['data-action'] === 'continue');
  t('friction/30s', cont.attrs['aria-disabled'] === 'true', 'Continuer pas désactivé au départ');
  r.env.advance(10000); clic(r, 'continue');
  t('friction/30s', r.out.length === 0, 'Continuer accepté avant la fin du délai');
  r.env.advance(20500); clic(r, 'continue');
  t('friction/30s', r.out.length === 1 && r.out[0].decision === 'continue' && r.out[0].friction.satisfied === true, 'Continuer refusé après 30 s');
  t('friction/30s', r.out[0].time_to_decision_ms >= 30000, 'time_to_decision_ms < 30000');
  // Annuler reste possible pendant l'attente
  r = rendu(Demo.fromFiche(f, vars, 'danger', { type: 'wait', seconds: 30 }));
  r.env.advance(500); clic(r, 'cancel');
  t('annuler pendant attente', r.out[0]?.decision === 'cancel' && r.out[0].time_to_decision_ms === 500, 'Annuler impossible pendant l\'attente');
  // phrase
  r = rendu(Demo.fromFiche(f, vars, 'danger', { type: 'phrase', phrase: 'Je veux continuer malgré le danger' }));
  const champ = find(r.root, (n) => n.tagName === 'INPUT');
  clic(r, 'continue'); t('friction/phrase', r.out.length === 0, 'Continuer accepté sans phrase');
  champ.value = 'je veux continuer'; champ.fire('input'); clic(r, 'continue');
  t('friction/phrase', r.out.length === 0, 'Continuer accepté avec une phrase incomplète');
  champ.value = '  Je veux  continuer malgré le danger. '; champ.fire('input'); clic(r, 'continue');
  t('friction/phrase', r.out[0]?.decision === 'continue', 'Continuer refusé avec la bonne phrase');
  const coll = champ.fire('paste'); t('friction/phrase', coll.prevented === true, 'collage non bloqué');
  // manipulation : appeler un proche
  r = rendu(Demo.fromFiche(fiches.fiches.find((x) => x.id === 'F21'), vars, 'manipulation', { type: 'wait', seconds: 600 }));
  t('manipulation', !!find(r.root, (n) => n.attrs['data-action'] === 'call_trusted'), 'bouton Appeler un proche absent');
  t('manipulation', /Raccroche, puis rappelle toi-même le numéro officiel/.test(find(r.root, (n) => /\bgesture\b/.test(n.className)).textContent), 'geste qui rompt la ligne absent');
  clic(r, 'call_trusted'); t('manipulation', r.out[0]?.decision === 'call_trusted', 'décision call_trusted absente');
  const tmr = find(rendu(Demo.fromFiche(f, vars, 'danger', { type: 'wait', seconds: 600 })).root, (n) => n.className === 't');
  t('minuteur', tmr.textContent === '10:00', 'format du minuteur : ' + tmr.textContent);
  // Échap
  r = rendu(Demo.fromFiche(f, vars, 'danger', { type: 'wait', seconds: 30 }));
  r.root.fire('keydown', { key: 'Escape' });
  t('clavier', r.out[0]?.decision === 'cancel' && r.out[0].via === 'escape', 'Échap n\'annule pas');
  // piège à focus (page)
  const env = monde(); const root = env.doc.createElement('div');
  HoldUp.render(root, Demo.fromFiche(f, vars, 'danger', { type: 'none' }), { now: env.now, setInterval: env.setInterval, clearInterval: env.clearInterval, onDecision() {} });
  const bs = findAll(root, (n) => n.tagName === 'BUTTON');
  bs[bs.length - 1].focus(); root.fire('keydown', { key: 'Tab' });
  t('clavier', env.doc.activeElement === bs[0], 'Tab ne reboucle pas sur le premier bouton');
  bs[0].focus(); root.fire('keydown', { key: 'Tab', shiftKey: true });
  t('clavier', env.doc.activeElement === bs[bs.length - 1], 'Maj+Tab ne reboucle pas');
  // intention
  r = rendu(Demo.intention(vars));
  const go = find(r.root, (n) => n.attrs['data-action'] === 'intent');
  go.fire('click'); t('intention', r.out.length === 0, 'validation sans choix');
  const radios = findAll(r.root, (n) => n.tagName === 'INPUT' && n.attrs.type === 'radio');
  t('intention', radios.length === 5, 'il faut 5 choix, trouvé ' + radios.length);
  const demande = radios.find((x) => x.attrs.value === 'demande'); demande.fire('change');
  const zone = find(r.root, (n) => /\bpaste\b/.test(n.className));
  t('intention', zone.attrs.hidden === undefined, 'zone de collage cachée alors que « On me l\'a demandé » est choisi');
  find(r.root, (n) => n.tagName === 'TEXTAREA').value = 'Salut, envoie vite 50 USDC.';
  go.fire('click');
  t('intention', r.out[0]?.decision === 'intent' && r.out[0].intent === 'demande' && /50 USDC/.test(r.out[0].intent_message), 'décision d\'intention incomplète');
  r = rendu(Demo.intention(vars)); find(r.root, (n) => n.attrs['data-action'] === 'cancel').fire('click');
  t('intention', r.out[0]?.decision === 'cancel', 'Annuler de l\'intention');
  // adresse : surlignage
  r = rendu(Demo.fromFiche(fiches.fiches.find((x) => x.id === 'F13'), vars, 'address', { type: 'none' }));
  const d = findAll(r.root, (n) => n.className === 'd');
  t('adresse', d.length === 8 && d.map((x) => x.textContent).join(' ') === '1d88 Ce02 77aF 0b3D 9a41 F6c2 0e5B 4d19', 'groupes surlignés inattendus : ' + d.map((x) => x.textContent));
  t('adresse', findAll(r.root, (n) => n.className === 'known').length === 1, 'adresse habituelle absente');
}

// ---------- 4. contrôles statiques ----------
const fichiers = ['verdict.js', 'verdict.html', 'verdict.css', 'demo.js', 'preview.html', 'preview.js', 'build_preview.mjs'];
const INTERDIT_CODE = [/innerHTML/, /outerHTML/, /insertAdjacentHTML/, /document\.write/, /\beval\s*\(/, /new\s+Function/, /srcdoc/i];
const EXTERNE = /(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}|@import|url\(\s*['"]?(?:https?:|\/\/)/i;
let nbFichiers = 0;
for (const nom of fichiers) {
  const p = join(dir, nom);
  if (!existsSync(p)) { err(nom, 'fichier absent'); continue; }
  nbFichiers++;
  const s = readFileSync(p, 'utf8');
  for (const re of INTERDIT_CODE) if (re.test(s)) err(nom, `motif interdit ${re}`);
  const m = s.match(EXTERNE);
  if (m) err(nom, `URL externe ou import : « ${m[0]} »`);
  if (/<script[^>]+src\s*=\s*["'](?!(?:verdict|demo|preview_data|preview)\.js["'])/.test(s)) err(nom, 'script non local');
  if (/<link[^>]+href\s*=\s*["'](?!verdict\.css["'])/.test(s)) err(nom, 'feuille de style non locale');
}
{
  const css = readFileSync(join(dir, 'verdict.css'), 'utf8');
  for (const h of css.matchAll(/#([0-9a-f]{6})\b/gi)) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h[1].slice(i, i + 2), 16));
    if (g > r + 20 && g > b + 20) err('verdict.css', `couleur verte #${h[1]}`);
  }
  if (/green|lime|emerald/i.test(css.replace(/\/\*[\s\S]*?\*\//g, ''))) err('verdict.css', 'mot de couleur verte');
  if (!/prefers-color-scheme: dark/.test(css) || !/data-theme="dark"/.test(css)) err('verdict.css', 'thème sombre absent');
  if (!/:focus-visible/.test(css)) err('verdict.css', 'style de focus absent');
  if (!/prefers-reduced-motion/.test(css)) err('verdict.css', 'prefers-reduced-motion absent');
}

console.log(`Écrans rendus : ${nbEcrans} | répartition ${JSON.stringify(parEcran)}`);
console.log(`Lignes de texte contrôlées (12 mots max, mots interdits) : ${nbLignes}`);
console.log(`Tests de comportement : ${nbInteractions} | fichiers analysés (statique) : ${nbFichiers} | mots interdits chargés : ${INTERDITS.length}`);
for (const e of erreurs.slice(0, 80)) console.log('ERREUR ' + e);
if (erreurs.length > 80) console.log(`... ${erreurs.length - 80} autres erreurs`);
console.log(`Résultat : ${erreurs.length} erreur(s)`);
process.exit(erreurs.length ? 1 : 0);

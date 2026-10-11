/* Données de démonstration fictives : transforme une fiche de U_textes_utilisateur.json en message 'holdup.verdict'.
   Utilisé par preview.html et par check_ui.mjs. Aucune donnée réelle. */
(function (global) {
  'use strict';
  var ADDR_HABITUELLE = '0x7a3F9c21B04e5D8a1f6C2E90aB4733dE8c15E2b9';
  var ADDR_DEMANDEE = '0x7a3F1d88Ce0277aF0b3D9a41F6c20e5B4d19E2b9';
  var QUOTE = 'Ici le support. Pour protéger vos fonds, transférez-les maintenant vers le portefeuille que je vous indique.';
  var MANIP = { F21: 1, F22: 1, F23: 1, F24: 1 };
  var ADDR = { F13: 1, F19: 1 };
  var MODES = ['auto', 'danger', 'address', 'manipulation', 'attention', 'unknown', 'info'];

  function fill(s, vars) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return vars && vars[k] != null ? vars[k] : '{' + k + '}'; }); }

  function naturalMode(f) {
    if (f.id === 'F25') return 'unknown';
    if (MANIP[f.id]) return 'manipulation';
    if (ADDR[f.id]) return 'address';
    if (f.gravite === 'info') return 'info';
    if (f.gravite === 'warn') return 'attention';
    return 'danger';
  }

  /* mode : 'auto' ou l'un de MODES. friction : { type, seconds, phrase }. */
  function fromFiche(f, vars, mode, friction, theme) {
    mode = !mode || mode === 'auto' ? naturalMode(f) : mode;
    var texts = { croit: fill(f.croit, vars), reel: fill(f.reel, vars), danger: fill(f.danger, vars), action: fill(f.action, vars) };
    var title = fill(f.menace, vars);
    if (mode === 'info' && f.variante_info) {
      texts = { croit: '', reel: fill(f.variante_info.lignes[0], vars), danger: '', action: fill(f.variante_info.lignes[1], vars) };
      title = texts.reel;
    }
    var v = { engine: 'demo', fiche: f.id, title: title, texts: texts, reasons: [texts.danger, texts.action].filter(Boolean) };
    if (mode === 'danger' || mode === 'address' || mode === 'manipulation') { v.level = mode === 'manipulation' ? 'manipulation' : 'danger'; v.niveau = 'critical'; }
    else if (mode === 'unknown') { v.level = 'unknown'; v.niveau = 'warn'; v.indeterminate = true; v.why = 'démonstration'; }
    else if (mode === 'info') { v.level = 'attention'; v.niveau = 'info'; }
    else { v.level = 'attention'; v.niveau = 'warn'; }
    if (mode === 'address') v.address_diff = { expected: ADDR_HABITUELLE, actual: ADDR_DEMANDEE, expectedLabel: 'Adresse que tu utilises d’habitude' };
    if (mode === 'manipulation') { v.quote = QUOTE; v.title = ''; }
    return {
      type: 'holdup.verdict', version: 1, id: f.id + ':' + mode, mode: 'verdict',
      site: vars && vars.site_reel, amount: vars ? vars.montant + ' ' + vars.jeton : '',
      friction: friction || { type: 'none' }, theme: theme || undefined, verdict: v
    };
  }

  function intention(vars, theme) {
    return { type: 'holdup.verdict', version: 1, id: 'intention', mode: 'intention', site: vars && vars.site, theme: theme || undefined };
  }

  var api = { fromFiche: fromFiche, intention: intention, naturalMode: naturalMode, MODES: MODES, QUOTE: QUOTE };
  global.HoldUpDemo = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

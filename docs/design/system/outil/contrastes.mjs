/* Hold up : rapports de contraste WCAG 2.x des jetons de tokens.css, calculés (rien n'est recopié à la main).
 *   node docs/design/system/outil/contrastes.mjs
 * Seuils : texte 4,5:1 (AA), bord d'un contrôle ou focus 3:1. Sort en erreur si une paire est sous son seuil. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'tokens.css'), 'utf8');
const block = (re) => { const m = re.exec(css); const o = {}; for (const v of (m ? m[1] : '').matchAll(/--hu-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) o[v[1]] = v[2]; return o; };
const light = block(/:root\s*\{([\s\S]*?)\n\}/);
const dark = Object.assign({}, light, block(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\}/));
const k = { page: light.k, ink: light['k-ink'], 'ink-2': light['k-2'], 'ink-3': light['k-3'], wash: light['k-wash'] };
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const PAIRS = [
  ['Texte (encre sur fond)', 'ink', 'page', 4.5],
  ['Texte secondaire (encre-2 sur fond)', 'ink-2', 'page', 4.5],
  ['Texte secondaire sur lavis (champ désactivé)', 'ink-2', 'wash', 4.5],
  ['Texte du bouton plein (fond sur encre)', 'page', 'ink', 4.5],
  ['Bord d’un champ, bouton pas encore possible (encre-3 sur fond)', 'ink-3', 'page', 3],
  ['Focus clavier (encre sur fond)', 'ink', 'page', 3]
];
let bad = 0;
const rows = [];
for (const [name, set] of [['page claire', light], ['page sombre', dark], ['fenêtre (noire)', k]]) {
  for (const [label, fg, bg, min] of PAIRS) {
    const r = ratio(set[fg], set[bg]); if (r < min) bad++;
    rows.push({ surface: name, paire: label, couleurs: set[fg] + ' sur ' + set[bg], rapport: r.toFixed(2).replace('.', ','), seuil: min, verdict: r >= 7 && min === 4.5 ? 'AAA' : r >= min ? (min === 3 ? 'passe' : 'AA') : 'ÉCHEC' });
  }
}
console.table(rows);
console.log('| Surface | Paire | Couleurs | Rapport | Seuil | Verdict |\n|---|---|---|---|---|---|\n' + rows.map((r) => `| ${r.surface} | ${r.paire} | \`${r.couleurs}\` | ${r.rapport} | ${r.seuil} | ${r.verdict} |`).join('\n'));
if (bad) { console.error(bad + ' paire(s) sous le seuil'); process.exit(1); }

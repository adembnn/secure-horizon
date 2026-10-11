// Writes the sheet of the in-page fallback INTO bridge.js, between its two markers. A content script cannot link a sheet of the
// extension without exposing it to the page (web_accessible_resources) : the fallback carries its sheet as text, set in a closed
// shadow root. Source : ui/tokens.css + the window part of ui/components.css + ui/motion.css (docs/design/system). `:root` does not
// exist in a shadow root : it becomes `:host`.
// Usage : node extension/tools/gen_overlay_sheet.mjs          (rewrites bridge.js when the sheets changed)
//         node extension/tools/gen_overlay_sheet.mjs --check  (exit 1 when bridge.js is not up to date ; used by the unit tests)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = process.env.HOLDUP_DIR ? resolve(process.env.HOLDUP_DIR) : resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const START = '/*@SHEET@*/', END = '/*@END_SHEET@*/';
export function overlaySheet(dir = DIR) {
  const rd = (f) => readFileSync(join(dir, 'ui', f), 'utf8');
  const components = rd('components.css');
  const cut = components.indexOf('/* ------------------------------------------------------------------ interrupteur');
  if (cut < 0) throw new Error('components.css : section "interrupteur" introuvable');
  const css = [rd('tokens.css'), components.slice(0, cut), rd('motion.css')].join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')          // comments
    .replace(/:root/g, ':host')
    .replace(/\s*\n\s*/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
  if (/[`\\]|\$\{/.test(css)) throw new Error('la feuille contient un caractère interdit dans un gabarit (` \\ ${)');
  return css;
}
export function withSheet(source, css) {
  const a = source.indexOf(START), b = source.indexOf(END);
  if (a < 0 || b < a) throw new Error('bridge.js : marqueurs de feuille introuvables');
  return source.slice(0, a + START.length) + '`\n' + css + '\n`' + source.slice(b);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = join(DIR, 'bridge.js'), src = readFileSync(file, 'utf8'), next = withSheet(src, overlaySheet());
  if (process.argv.includes('--check')) { if (next !== src) { console.error('bridge.js : la feuille du repli n’est pas à jour (node extension/tools/gen_overlay_sheet.mjs)'); process.exit(1); } console.log('bridge.js : feuille du repli à jour'); }
  else if (next !== src) { writeFileSync(file, next); console.log('bridge.js : feuille du repli réécrite (' + overlaySheet().length + ' caractères)'); }
  else console.log('bridge.js : feuille du repli déjà à jour');
}

// Recopie le bloc PRESENTATION de server/server.mjs vers les copies embarquees, plus les 2 retouches de evaluate() qui l'accompagnent.
// Usage : node server/sync_presentation.mjs            (verifie seulement : dit ce qui derive, ne modifie rien)
//         node server/sync_presentation.mjs --write    (ecrit) ; a lancer par le proprietaire de extension_standalone / webdemo.
// Cibles : extension_standalone/src/sentinelle_core.js, webdemo/engine/sentinelle_core.js (cette derniere est aussi regeneree par webdemo/build_webdemo.mjs).
// Ensuite : node extension_standalone/build_standalone.mjs et node webdemo/build_webdemo.mjs (copient U_textes_utilisateur.json), puis leurs tests.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');
const norm = (t) => t.replace(/\r\n/g, '\n');
const A = '// <<PRESENTATION', B = '// PRESENTATION>>';
const blockRange = (t) => { const i = t.indexOf(A), j = t.indexOf(B, i); if (i < 0 || j < 0) return null; return [t.indexOf('\n', i) + 1, j]; };
const src = norm(readFileSync(join(ROOT, 'server', 'server.mjs'), 'utf8'));
const [s0, s1] = blockRange(src); const block = src.slice(s0, s1);
// retouches de evaluate() (hors bloc) : [ancien, nouveau]
const PATCHES = [
  ["  if (scen) { fid = scen; texts = buildTexts(scen, eff, host, { chainId: chainId ?? eff.chainId, contact }); source = 'fiche'; }\n",
   "  if (scen) { fid = scen; texts = buildTexts(scen, eff, host, { chainId: chainId ?? eff.chainId, contact }); source = 'fiche'; }\n  // niveau affiché : l'envoi vers une adresse nouvelle (F31) passe de « info » à « warn » (attention). Le niveau du moteur reste dans niveau_moteur.\n  const nivMoteur = niveau;\n  if (niveau === 'info' && !scen) niveau = pres.niveau || niveau;\n"],
  ["  if (press && niveau !== 'info') { out.level = 'manipulation';", "  if (nivMoteur !== niveau) out.niveau_moteur = nivMoteur;\n  if (press && nivMoteur !== 'info') { out.level = 'manipulation';"],
];
let bad = 0;
for (const rel of ['extension_standalone/src/sentinelle_core.js', 'webdemo/engine/sentinelle_core.js']) {
  const p = join(ROOT, rel); const raw = readFileSync(p, 'utf8'); const crlf = raw.includes('\r\n'); let t = norm(raw);
  const r = blockRange(t); if (!r) { console.log(rel + ' : marqueurs absents'); bad++; continue; }
  const msgs = [];
  if (t.slice(r[0], r[1]) !== block) { t = t.slice(0, r[0]) + block + t.slice(r[1]); msgs.push('bloc PRESENTATION a mettre a jour'); }
  for (const [a, b] of PATCHES) { if (t.includes(b)) continue; if (t.includes(a)) { t = t.replace(a, () => b); msgs.push('retouche evaluate() a appliquer'); } else { msgs.push('ANCRE INTROUVABLE pour une retouche evaluate() : voir PATCHES_A_FAIRE.md'); bad++; } }
  console.log(rel + ' : ' + (msgs.length ? msgs.join(' ; ') : 'a jour'));
  if (write && msgs.length) { writeFileSync(p, crlf ? t.replace(/\n/g, '\r\n') : t); console.log('  ecrit'); }
}
process.exit(bad ? 1 : 0);

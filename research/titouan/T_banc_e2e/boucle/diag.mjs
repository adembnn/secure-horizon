// boucle/diag.mjs : montre les cas ratés d'une cible (réglage seulement, parts 0 et 1), avec les raisons du moteur.
//   node boucle/diag.mjs <JEU> <famille> [--sub=<sous-famille>] [--cls=S|B|U] [--arm=full] [--n=10]
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CONFIG, JEUX, part, niveauGrille } from './score.mjs';
const HERE = dirname(fileURLToPath(import.meta.url)), WORK = join(HERE, 'work');
const a = process.argv.slice(2);
const opt = (n, d) => { const x = a.find((s) => s.startsWith(`--${n}=`)); return x ? x.slice(n.length + 3) : d; };
const [jeu, fam] = a.filter((s) => !s.startsWith('--'));
const J = JEUX.find((j) => j.nom === jeu);
const { prepare, runArm, normalizeCase } = await import(pathToFileURL(join(WORK, 'run', 'arms.mjs')).href);
const ic = J.grille ? await import(pathToFileURL(join(WORK, 'pipeline', 'intent_clef.mjs')).href) : null;
const RK = { ok: 0, unknown: 0, warn: 1, critical: 2 };
const want = opt('cls'), sub = opt('sub'), arm = opt('arm', J.grille ? 'texte' : 'full'), N = Number(opt('n', '10'));
let shown = 0, tot = 0;
for (const line of readFileSync(join(WORK, J.f), 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const c0 = JSON.parse(line); if (c0.family !== fam) continue; if (sub && c0.subfamily !== sub) continue;
  if (part(jeu, String(c0.id)) === 2) continue;
  let c, cls, r;
  if (J.grille) { c = normalizeCase({ ...c0, label: 'grille', intent: { declaredAt: 1760000000000 } }); cls = c0.truth === 'ne_correspond_pas' ? 'S' : c0.truth === 'correspond' ? 'B' : 'U'; r = await niveauGrille(WORK, ic, null, c, prepare(c), runArm, c0.text); }
  else { c = normalizeCase(c0); cls = c.label === 'malveillant' || c.label === 'fraude_conforme' ? 'S' : c.label === 'benin' ? 'B' : 'U'; r = await runArm(prepare(c), arm, CONFIG.OPTS); }
  if (want && cls !== want) continue;
  const mauvais = cls === 'S' ? RK[r.level] < 1 || r.level === 'unknown' : cls === 'B' ? RK[r.level] > RK[c.expected_severity || 'ok'] : r.level === 'ok';
  tot++;
  if (!mauvais) continue;
  if (shown++ >= N) continue;
  console.log(JSON.stringify({ id: c0.id, sub: c0.subfamily, cls, level: r.level, vrai: c0.truth || c0.label, tol: c.expected_severity, texte: c0.text, raisons: (r.reasons || []).slice(0, 8), methode: c.request.method, effet: c0.effect, rel: c0.relation }));
}
console.log(`-- ${shown} ratés montrés sur ${tot} cas de la cible (cls=${want || 'tous'})`);

// boucle/loop.mjs : la boucle d'auto-amélioration notée.
//
//   node boucle/loop.mjs [--max=12] [--reprise] [--sans-portes]
//
// À chaque itération : mesurer (score.mjs, jeux de RÉGLAGE seulement) ; classer les familles par perte de score (part réglage) ;
// prendre la pire famille qui a une proposition non essayée ; appliquer UN correctif dans boucle/work/ seulement ;
// remesurer ; ACCEPTER si (score réglage monte) ET (validation interne ne baisse pas de plus de 0,3 point) ET (toutes les portes dures passent) ;
// sinon ANNULER (restauration exacte des fichiers) et noter l'échec. Journal : boucle/JOURNAL.md.
//
// Le PROPOSEUR de correctifs est un agent (Claude) : il lit out/BESOIN_PROPOSITION.json (cible + cas manqués, sans étiquette de jeu scellé),
// écrit boucle/propositions/<id>.mjs (export default {id, cible, famille, hypothese, edits:[{file, find, replace}]}, puis relance la boucle.
// Tout le reste (mesure, décision, portes, annulation) est du code déterministe, non modifiable par le proposeur.
// Arrêt : 12 itérations, ou 3 échecs consécutifs, ou plateau (gain réglage < 0,1 point sur 3 itérations), ou plus de proposition disponible (code de sortie 3).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, appendFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WORK = join(HERE, 'work'), OUT = join(HERE, 'out'), PROP = join(HERE, 'propositions');
mkdirSync(OUT, { recursive: true }); mkdirSync(PROP, { recursive: true });
const args = process.argv.slice(2);
const MAX = Number((args.find((a) => a.startsWith('--max=')) || '--max=12').slice(6));
const SANS_PORTES = args.includes('--sans-portes');
const ETAT = join(OUT, 'etat.json');
const JOURNAL = join(HERE, 'JOURNAL.md');
const SEUIL_VAL = 0.3, PLATEAU = 0.1;

const etat = existsSync(ETAT) ? JSON.parse(readFileSync(ETAT, 'utf8')) : { iter: 0, echecsConsecutifs: 0, essais: {}, gains: [], courbe: [], accepte: [], rejete: [], cur: null };
const save = () => writeFileSync(ETAT, JSON.stringify(etat, null, 1));
const f2 = (x) => x.toFixed(2);

function mesurer(nom) {
  const fp = join(OUT, nom + '.json');
  const r = spawnSync(process.execPath, [join(HERE, 'score.mjs'), '--quiet', '--out=' + fp], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('score.mjs a échoué : ' + (r.stderr || '').slice(-400));
  const j = JSON.parse(readFileSync(fp, 'utf8'));
  return j;
}
const resume = (j) => ({ reg: j.mesure.reglage.score, val: j.mesure.validation.score, jeuxReg: Object.fromEntries(Object.entries(j.mesure.reglage.jeux).map(([k, v]) => [k, +v.score.toFixed(2)])), jeuxVal: Object.fromEntries(Object.entries(j.mesure.validation.jeux).map(([k, v]) => [k, +v.score.toFixed(2)])) });

function classer(j) { // pertes réglage par famille (jeu|famille) puis sous-famille
  const fam = {};
  for (const [k, v] of Object.entries(j.mesure.reglage.pertesA || j.mesure.reglage.pertes)) { const [jeu, f] = k.split('|'); const kk = `${jeu}|${f}`; fam[kk] = (fam[kk] || 0) + v; }
  return Object.entries(fam).sort((a, b) => b[1] - a[1]);
}
async function propositions() {
  const fs = readdirSync(PROP).filter((f) => f.endsWith('.mjs')).sort();
  return Promise.all(fs.map(async (f) => (await import(pathToFileURL(join(PROP, f)).href)).default));
}
function appliquer(p) {
  const sauve = {};
  try {
    for (const e of p.edits) {
      const fp = join(WORK, e.file);
      if (!(e.file in sauve)) sauve[e.file] = readFileSync(fp, 'utf8');
      let t = readFileSync(fp, 'utf8');
      const n = t.split(e.find).length - 1;
      if (n !== (e.count ?? 1)) throw new Error(`${e.file} : motif trouvé ${n} fois (attendu ${e.count ?? 1})`);
      t = t.split(e.find).join(e.replace);
      writeFileSync(fp, t);
    }
  } catch (err) { annuler(sauve); throw err; }
  return sauve;
}
function annuler(sauve) { for (const [f, t] of Object.entries(sauve)) writeFileSync(join(WORK, f), t); }
function portes() {
  const r = spawnSync(process.execPath, [join(HERE, 'gates.mjs'), 'tout'], { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 900000 });
  const res = (r.stdout || '').split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
  const attendues = ['zero_ok', 'monotonie', 'nohardcode', 'scelles', 'tests'];
  for (const a of attendues) if (!res.find((x) => x.porte === a)) res.push({ porte: a, ok: false, detail: 'porte non exécutée : ' + (r.stderr || '').slice(-200) });
  return res;
}
function ligne(s) { appendFileSync(JOURNAL, s + '\n'); }
if (!existsSync(JOURNAL)) writeFileSync(JOURNAL, '# Journal de la boucle (une ligne par itération)\n\nMesures sur les jeux de RÉGLAGE seulement. « réglage » = parts 0 et 1 (2/3), « validation » = part 2 (1/3), même source, non indépendante.\n\n| it | famille ciblée | correctif | réglage avant → après | validation avant → après | décision | durée |\n|---|---|---|---|---|---|---|\n');

// ---------------------------------------------------------------- état initial
if (!etat.cur) {
  const t0 = Date.now();
  const j = mesurer('cur');
  etat.cur = resume(j); etat.courbe.push({ it: 0, reg: etat.cur.reg, val: etat.cur.val, label: 'base' });
  save();
  console.log(`it 0 (base) réglage ${f2(etat.cur.reg)} validation ${f2(etat.cur.val)} (${Date.now() - t0} ms)`);
}

while (etat.iter < MAX) {
  if (etat.echecsConsecutifs >= 3) { console.log('ARRÊT : 3 échecs consécutifs'); break; }
  const g = etat.gains.slice(-3);
  if (g.length === 3 && g.every((x) => x < PLATEAU)) { console.log('ARRÊT : plateau (gain < 0,1 point sur 3 itérations)'); break; }
  const curJ = JSON.parse(readFileSync(join(OUT, 'cur.json'), 'utf8'));
  const rang = classer(curJ);
  const props = await propositions();
  let choix = null, cible = null;
  for (const [fam, perte] of rang) {
    const ess = etat.essais[fam] || [];
    if (ess.length >= 2) continue; // famille épuisée : 2 essais ratés
    const p = props.find((q) => !Object.values(etat.essais).flat().includes(q.id) && !etat.accepte.includes(q.id) && (q.cible || []).some((re) => new RegExp(re).test(fam)));
    if (p) { choix = p; cible = { fam, perte }; break; }
  }
  if (!choix) {
    const [fam, perte] = rang.find(([f]) => (etat.essais[f] || []).length < 2) || rang[0];
    writeFileSync(join(OUT, 'BESOIN_PROPOSITION.json'), JSON.stringify({ iter: etat.iter + 1, cible: fam, perte, classement: rang.slice(0, 15), essais: etat.essais, deja: etat.accepte }, null, 1));
    console.log(`PAUSE : aucune proposition non essayée pour ${fam} (perte ${f2(perte)}). Voir out/BESOIN_PROPOSITION.json`);
    process.exitCode = 3; break;
  }
  const t0 = Date.now();
  etat.iter++;
  const avant = etat.cur;
  let sauve;
  try { sauve = appliquer(choix); } catch (e) {
    ligne(`| ${etat.iter} | ${cible.fam} | ${choix.id} | - | - | NON APPLIQUÉ (${e.message}) | ${Math.round((Date.now() - t0) / 1000)} s |`);
    (etat.essais[cible.fam] ||= []).push(choix.id); etat.rejete.push({ id: choix.id, motif: 'non appliqué' }); etat.echecsConsecutifs++; etat.gains.push(0); save(); continue;
  }
  let decision = '', ok = false, apres = null;
  try {
    const j = mesurer('essai');
    apres = resume(j);
    const dReg = apres.reg - avant.reg, dVal = apres.val - avant.val;
    if (!(dReg > 0.005)) decision = `REJETÉ : réglage ne monte pas (${dReg >= 0 ? '+' : ''}${f2(dReg)})`;
    else if (dVal < -SEUIL_VAL) decision = `REJETÉ : validation baisse de ${f2(-dVal)} (> ${SEUIL_VAL})`;
    else if (!SANS_PORTES) {
      const P = portes();
      const ko = P.filter((x) => !x.ok);
      if (ko.length) decision = 'REJETÉ : porte(s) ' + ko.map((x) => `${x.porte} (${x.detail.slice(0, 120)})`).join(' ; ');
      else { ok = true; decision = 'ACCEPTÉ (portes : ' + P.map((x) => x.porte).join(', ') + ' ok)'; }
    } else { ok = true; decision = 'ACCEPTÉ (sans portes)'; }
  } catch (e) { decision = 'REJETÉ : erreur de mesure ' + String(e.message).slice(0, 120); }
  if (ok) {
    writeFileSync(join(OUT, 'cur.json'), readFileSync(join(OUT, 'essai.json')));
    etat.cur = apres; etat.accepte.push(choix.id); etat.echecsConsecutifs = 0; etat.gains.push(apres.reg - avant.reg);
    writeFileSync(join(OUT, `iter_${String(etat.iter).padStart(2, '0')}_${choix.id}.json`), JSON.stringify({ choix, avant, apres }, null, 1));
  } else {
    annuler(sauve);
    (etat.essais[cible.fam] ||= []).push(choix.id); etat.rejete.push({ id: choix.id, motif: decision }); etat.echecsConsecutifs++; etat.gains.push(0);
  }
  etat.courbe.push({ it: etat.iter, reg: etat.cur.reg, val: etat.cur.val, label: choix.id, decision: ok ? 'accepté' : 'rejeté' });
  const dur = Math.round((Date.now() - t0) / 1000);
  ligne(`| ${etat.iter} | ${cible.fam.split("|").join("/")} (perte ${f2(cible.perte)}) | ${choix.id} : ${choix.hypothese.slice(0, 140)} | ${f2(avant.reg)} → ${f2(apres ? apres.reg : avant.reg)} | ${f2(avant.val)} → ${f2(apres ? apres.val : avant.val)} | ${decision} | ${dur} s |`);
  save();
  console.log(`it ${etat.iter} ${choix.id} ${ok ? 'ACCEPTÉ' : 'rejeté'} : réglage ${f2(avant.reg)} → ${apres ? f2(apres.reg) : '-'} ; validation ${f2(avant.val)} → ${apres ? f2(apres.val) : '-'} ; ${decision.slice(0, 160)} (${dur} s)`);
}
save();

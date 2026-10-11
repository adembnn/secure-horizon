// e2e_run.mjs - fait passer chaque bras par le moteur (redteam/check_plus.mjs, sans le modifier), UN processus a la fois,
// puis compare les verdicts. Usage : node intention_texte/e2e_run.mjs   (apres e2e_build.mjs). Ecrit e2e/resultats.json.
// Mode "moteur+politique" = check_plus --base (comparateur + politique). Mode "complet" = + detecteurs d'Adem.
// Regle du produit "stricter" : un verdict issu d'une intention ne remplace jamais un verdict plus severe du plancher.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wilson } from './score_lib.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const E2E = join(HERE, 'e2e');
const ARMS = ['etiquetee', 'extraite_actuel_gen', 'extraite_actuel_orig', 'extraite_amelioree_gen', 'extraite_amelioree_orig'];
const sample = JSON.parse(readFileSync(join(E2E, 'echantillon.json'), 'utf8'));
const meta = Object.fromEntries(sample.scenarios.map((s) => [s.id, s]));
const RANK = { unknown: -1, ok: 0, warn: 1, critical: 2 };

function run(arm, base) {
  const args = ['--no-warnings', join(ROOT, 'redteam', 'check_plus.mjs'), join(E2E, arm + '.jsonl'), ...(base ? ['--base'] : [])];
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 1 << 28, cwd: ROOT });
  if (r.status !== 0) throw new Error('check_plus a echoue pour ' + arm + ' : ' + (r.stderr || '').slice(0, 300));
  const out = {};
  for (const l of r.stdout.split('\n')) { if (!l.startsWith('{"id"')) continue; const o = JSON.parse(l); out[o.id] = { level: o.level_final, floor: o.level_sans_intention, error: o.error }; }
  return out;
}
const result = { n: sample.n, modes: {} };
for (const mode of ['moteur_politique', 'complet']) {
  const base = mode === 'moteur_politique';
  const runs = {};
  for (const a of ARMS) runs[a] = run(a, base);
  const ids = sample.scenarios.map((s) => s.id);
  const floor = Object.fromEntries(ids.map((id) => [id, runs.etiquetee[id].floor]));
  // le plancher du mode "complet" = le plancher du moteur ; les detecteurs agissent dans level_final
  const view = (arm, strict) => Object.fromEntries(ids.map((id) => {
    const raw = runs[arm][id].level;
    const lv = strict && RANK[floor[id]] > RANK[raw] ? floor[id] : raw;
    return [id, lv];
  }));
  const L = { sans_intention: floor };
  for (const a of ARMS) { L[a] = view(a, false); L[a + '+stricter'] = view(a, true); }
  const sc = ids.filter((id) => meta[id].label === 'malveillant'), bn = ids.filter((id) => meta[id].label === 'benin');
  const stats = {};
  for (const [name, lv] of Object.entries(L)) {
    const caught = sc.filter((id) => lv[id] === 'critical').length, fa = bn.filter((id) => lv[id] === 'critical').length;
    stats[name] = { arnaques_attrapees: wilson(caught, sc.length), arnaques_ratees: sc.length - caught, fausses_alertes: wilson(fa, bn.length) };
  }
  const cross = {};
  for (const a of ARMS.slice(1)) for (const sfx of ['', '+stricter']) {
    const name = a + sfx, ref = L['etiquetee' + sfx];
    const lost = sc.filter((id) => ref[id] === 'critical' && L[name][id] !== 'critical');
    const gained = sc.filter((id) => ref[id] !== 'critical' && L[name][id] === 'critical');
    const faNew = bn.filter((id) => ref[id] !== 'critical' && L[name][id] === 'critical').length;
    const faGone = bn.filter((id) => ref[id] === 'critical' && L[name][id] !== 'critical').length;
    const cause = {};
    for (const id of lost) {
      const m = meta[id], key = a.includes('amelioree') ? (a.includes('orig') ? 'amelioree_orig' : 'amelioree_gen') : (a.includes('orig') ? 'actuel_orig' : 'actuel_gen');
      const e = m[key];
      const c = e.type === 'none' ? 'type non compris (aucune intention)' : e.type !== m.kind_etiquete ? 'type faux (' + m.kind_etiquete + ' -> ' + e.type + ')' : 'type juste, champ manquant (montant/jeton/destinataire)';
      cause[c] = (cause[c] || 0) + 1;
    }
    cross[name] = { ids_fausses_alertes_en_plus: bn.filter((id) => ref[id] !== 'critical' && L[name][id] === 'critical'), perdues_vs_etiquetee: lost.length, gagnees_vs_etiquetee: gained.length, fausses_alertes_en_plus: faNew, fausses_alertes_en_moins: faGone, causes_des_pertes: cause, ids_perdues: lost };
  }
  // contre "sans intention" : combien d'arnaques de plus (ou de moins) que le plancher
  const vsFloor = {};
  for (const name of Object.keys(L)) if (name !== 'sans_intention') {
    const lost = sc.filter((id) => floor[id] === 'critical' && L[name][id] !== 'critical').length;
    const gained = sc.filter((id) => floor[id] !== 'critical' && L[name][id] === 'critical').length;
    vsFloor[name] = { arnaques_perdues_vs_sans_intention: lost, arnaques_gagnees_vs_sans_intention: gained };
  }
  result.modes[mode] = { n_arnaques: sc.length, n_benins: bn.length, stats, vs_etiquetee: cross, vs_sans_intention: vsFloor };
}
writeFileSync(join(E2E, 'resultats.json'), JSON.stringify(result, null, 1));
for (const [mode, M] of Object.entries(result.modes)) {
  console.log('== ' + mode + ' (arnaques ' + M.n_arnaques + ', benins ' + M.n_benins + ')');
  for (const [k, v] of Object.entries(M.stats)) console.log(k.padEnd(36), 'attrapees', v.arnaques_attrapees.k + '/' + v.arnaques_attrapees.n, '| ratees', v.arnaques_ratees, '| fausses alertes', v.fausses_alertes.k + '/' + v.fausses_alertes.n);
  for (const [k, v] of Object.entries(M.vs_etiquetee)) console.log(k.padEnd(36), 'perdues vs etiquetee', v.perdues_vs_etiquetee, '| gagnees', v.gagnees_vs_etiquetee, '| FA +' + v.fausses_alertes_en_plus + ' -' + v.fausses_alertes_en_moins, JSON.stringify(v.causes_des_pertes));
}

// Agrège out/cases.json (produit par run_realiste.mjs) : totaux, familles, écart banc complet / conditions réelles, top 10, effet du contexte minimal en ligne.
// Écrit uniquement dans out/. Node pur.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const D = JSON.parse(readFileSync(join(OUT, 'cases.json'), 'utf8'));
const rows = D.rows, ARMS = D.arms;
const MAIN = 'intention_mensongere', PROD = 'intention_produit';
const HEAD_ARM = process.env.ARM || PROD, SUF = HEAD_ARM === PROD ? '_produit' : '_catalogue';
const OTHER_ARM = HEAD_ARM === PROD ? MAIN : PROD;
const LV = ['FULL', 'A', 'B', 'C', 'C_hist', 'D', 'S_code', 'S_age', 'S_tok', 'S_bal', 'S_site', 'S_sim', 'S_quote', 'S_look', 'O1', 'O2', 'O3', 'O4', 'D_O4', 'ALL'];

const wilson = (k, n, z = 1.96) => {
  if (!n) return { k, n, rate: null, lo: null, hi: null };
  const p = k / n, d = 1 + (z * z) / n, c = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return { k, n, rate: p, lo: Math.max(0, c - h), hi: Math.min(1, c + h) };
};
const pc = (x) => (x * 100).toFixed(1);
const fw = (w) => (w.rate === null ? 'n/a' : `${pc(w.rate)}% [${pc(w.lo)}-${pc(w.hi)}] (${w.k}/${w.n})`);
const armIdx = (a) => ARMS.indexOf(a);
const ch = (r, lv, arm) => r.L[lv][armIdx(arm)];
const flagO = (r, lv) => r.L[lv][4] === 'O';
const flagP = (r, lv) => r.L[lv][5] === 'P';

function tally(rs, lv, arm) {
  const t = { n: rs.length, n_mal: 0, n_ben: 0, n_amb: 0, n_fc: 0, att_c: 0, att_w: 0, rate: 0, inc_mal: 0, ben_ok: 0, fa_w: 0, fa_c: 0, inc_ben: 0, amb: { o: 0, w: 0, c: 0, u: 0 }, fc_passe: 0, fc_alerte: 0, fc_inc: 0, opaque_mal: 0, att_par_opacite: 0, opaque_ben: 0, fa_par_opacite: 0 };
  for (const r of rs) {
    const x = ch(r, lv, arm), O = flagO(r, lv), P = flagP(r, lv);
    if (r.label === 'malveillant') {
      t.n_mal++; if (O) t.opaque_mal++;
      if (x === 'c') t.att_c++; else if (x === 'w') { t.att_w++; if (P) t.att_par_opacite++; } else if (x === 'o') t.rate++; else t.inc_mal++;
    } else if (r.label === 'benin') {
      t.n_ben++; if (O) t.opaque_ben++;
      if (x === 'o') t.ben_ok++; else if (x === 'w') { t.fa_w++; if (P) t.fa_par_opacite++; } else if (x === 'c') t.fa_c++; else t.inc_ben++;
    } else if (r.label === 'ambigu') { t.n_amb++; t.amb[x]++; } else { t.n_fc++; if (x === 'o') t.fc_passe++; else if (x === 'u') t.fc_inc++; else t.fc_alerte++; }
  }
  t.m = {
    rappel: wilson(t.att_c + t.att_w, t.n_mal), rappel_critical: wilson(t.att_c, t.n_mal), rate: wilson(t.rate, t.n_mal), inconnu: wilson(t.inc_mal, t.n_mal),
    opaque_mal: wilson(t.opaque_mal, t.n_mal), att_par_opacite: wilson(t.att_par_opacite, t.n_mal),
    fa_critical: wilson(t.fa_c, t.n_ben), fa_warn: wilson(t.fa_w, t.n_ben), fa_warn_ou_critical: wilson(t.fa_w + t.fa_c, t.n_ben), opaque_ben: wilson(t.opaque_ben, t.n_ben),
    fc_alerte: wilson(t.fc_alerte, t.n_fc),
  };
  return t;
}
const caught = (r, lv, arm) => ['c', 'w'].includes(ch(r, lv, arm));

// ---------------------------------------------------------------- unités : DEV/PUBLIC par famille ; V2 par famille/sous-famille
const unitOf = (r) => `${r.ds}:${r.ds === 'V2_DEV' ? r.fam + '/' + r.sub : r.fam}`;
const famOf = (r) => `${r.ds}:${r.fam}`;
const group = (rs, f) => { const o = {}; for (const r of rs) (o[f(r)] = o[f(r)] || []).push(r); return o; };

const datasets = ['DEV', 'PUBLIC', 'V2_DEV'];
const res = { generated: new Date().toISOString(), levels: D.levels, totaux: {}, par_famille: {}, par_unite: {} };
for (const lv of LV) {
  res.totaux[lv] = {};
  for (const ds of [...datasets, 'TOUT']) {
    const rs = ds === 'TOUT' ? rows : rows.filter((r) => r.ds === ds);
    res.totaux[lv][ds] = Object.fromEntries(ARMS.map((a) => [a, tally(rs, lv, a)]));
  }
}
for (const lv of ['FULL', 'A', 'B', 'C']) {
  res.par_famille[lv] = {}; res.par_unite[lv] = {};
  for (const [k, rs] of Object.entries(group(rows, famOf))) res.par_famille[lv][k] = Object.fromEntries(ARMS.map((a) => [a, tally(rs, lv, a)]));
  for (const [k, rs] of Object.entries(group(rows, unitOf))) res.par_unite[lv][k] = Object.fromEntries(ARMS.map((a) => [a, tally(rs, lv, a)]));
}
writeFileSync(join(OUT, 'resultats_totaux.json'), JSON.stringify(res.totaux, null, 1));
writeFileSync(join(OUT, 'resultats_par_famille.json'), JSON.stringify({ levels: D.levels, par_famille: res.par_famille, par_unite_v2_sous_famille: res.par_unite }, null, 1));

// ---------------------------------------------------------------- écart par unité et attribution
const RESTORE_LV = ['C', 'S_code', 'S_age', 'S_tok', 'S_bal', 'S_look', 'S_site', 'S_sim', 'S_quote', 'D', 'O1', 'O2', 'O3', 'O4', 'D_O4', 'ALL'];
const units = group(rows, unitOf);
const gaps = [];
for (const [u, rs] of Object.entries(units)) {
  const mal = rs.filter((r) => r.label === 'malveillant');
  if (mal.length < 5) continue;
  const kF = mal.filter((r) => caught(r, 'FULL', HEAD_ARM)).length, kB = mal.filter((r) => caught(r, 'B', HEAD_ARM)).length, kC = mal.filter((r) => caught(r, 'C', HEAD_ARM)).length, kA = mal.filter((r) => caught(r, 'A', HEAD_ARM)).length;
  const kFp = mal.filter((r) => caught(r, 'FULL', OTHER_ARM)).length, kBp = mal.filter((r) => caught(r, 'B', OTHER_ARM)).length, kCp = mal.filter((r) => caught(r, 'C', OTHER_ARM)).length;
  const lost = mal.filter((r) => caught(r, 'FULL', HEAD_ARM) && !caught(r, 'B', HEAD_ARM));
  const restore = {}; for (const lv of RESTORE_LV) restore[lv] = lost.filter((r) => caught(r, lv, HEAD_ARM)).length;
  const cost = { code: 0, age: 0, tok: 0, bal: 0, n: 0 };
  for (const r of rs) { if (r.cost) { cost.code += r.cost.code; cost.age += r.cost.age; cost.tok += r.cost.tok; cost.bal += r.cost.bal; } cost.n++; }
  const ben = rs.filter((r) => r.label === 'benin');
  const faF = ben.filter((r) => ['w', 'c'].includes(ch(r, 'FULL', HEAD_ARM))).length, faB = ben.filter((r) => ['w', 'c'].includes(ch(r, 'B', HEAD_ARM))).length, faC = ben.filter((r) => ['w', 'c'].includes(ch(r, 'C', HEAD_ARM))).length;
  const fcF = ben.filter((r) => ch(r, 'FULL', HEAD_ARM) === 'c').length, fcB = ben.filter((r) => ch(r, 'B', HEAD_ARM) === 'c').length;
  gaps.push({ unit: u, n_mal: mal.length, k_full: kF, k_A: kA, k_B: kB, k_C: kC, ecart_pts_B: (kF - kB) / mal.length * 100, ecart_pts_C: (kF - kC) / mal.length * 100, perdus_B: kF - kB,
    prod: { k_full: kFp, k_B: kBp, k_C: kCp }, lost: lost.length, restore, cost_moyen: { code: cost.code / cost.n, age: cost.age / cost.n, tok: cost.tok / cost.n, bal: cost.bal / cost.n }, n_ben: ben.length, fa_full: faF, fa_B: faB, fa_C: faC, fa_crit_full: fcF, fa_crit_B: fcB });
}
gaps.sort((a, b) => b.ecart_pts_B - a.ecart_pts_B || b.perdus_B - a.perdus_B);
const top10 = gaps.slice(0, 10);
// top 10 par pertes absolues (les grosses sous-familles V2 ne passent jamais devant les petites en points)
const top10abs = [...gaps].sort((a, b) => b.perdus_B - a.perdus_B || b.ecart_pts_B - a.ecart_pts_B).slice(0, 10);
writeFileSync(join(OUT, 'ecart_top10' + SUF + '.json'), JSON.stringify({ critere: 'bras ' + HEAD_ARM + ' ; écart de rappel (points) entre banc complet et B, bras intention_mensongere, unités à n_malveillant >= 5 ; V2 par famille/sous-famille', top10_par_points: top10, top10_par_pertes_absolues: top10abs, toutes_unites: gaps }, null, 1));

// ---------------------------------------------------------------- coût et effet du contexte minimal en ligne
const callsOf = (r, parts) => { if (!r.cost) return 0; return parts.reduce((s, p) => s + r.cost[p], 0); };
const pct = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : 0; };
const ONLINE = { O1: ['code'], O2: ['code', 'age'], O3: ['code', 'age', 'tok'], O4: ['code', 'age', 'tok', 'bal'] };
const online = { niveaux: {}, par_famille_delta: {} };
for (const [lv, parts] of Object.entries(ONLINE)) {
  const calls = rows.map((r) => callsOf(r, parts));
  online.niveaux[lv] = { lectures: parts, appels_par_verification: { moyenne: calls.reduce((a, b) => a + b, 0) / calls.length, p50: pct(calls, 0.5), p95: pct(calls, 0.95), max: Math.max(...calls), part_sans_aucun_appel: calls.filter((c) => c === 0).length / calls.length } };
}
for (const [u, rs] of Object.entries(units)) {
  const mal = rs.filter((r) => r.label === 'malveillant'); if (mal.length < 5) continue;
  const o = { n_mal: mal.length };
  for (const lv of ['FULL', 'B', 'C', 'O1', 'O2', 'O3', 'O4', 'D', 'D_O4']) o[lv] = mal.filter((r) => caught(r, lv, HEAD_ARM)).length;
  const ben = rs.filter((r) => r.label === 'benin'); o.n_ben = ben.length;
  for (const lv of ['FULL', 'B', 'C', 'O4', 'D_O4']) o['fa_' + lv] = ben.filter((r) => ['w', 'c'].includes(ch(r, lv, HEAD_ARM))).length;
  online.par_famille_delta[u] = o;
}
writeFileSync(join(OUT, 'en_ligne_minimal' + SUF + '.json'), JSON.stringify(online, null, 1));

// ---------------------------------------------------------------- TABLES.md
let md = '';
const mdFam = {}; let mdTot = {};
const totalRow = (lv, ds, arm) => { const t = res.totaux[lv][ds][arm], m = t.m; return `| ${lv} | ${t.n_mal} | ${t.att_c} | ${t.att_w} | ${t.rate} | ${t.inc_mal} | ${fw(m.rappel)} | ${t.opaque_mal} (${t.att_par_opacite}) | ${t.n_ben} | ${t.fa_c} | ${fw(m.fa_critical)} | ${t.fa_w} | ${fw(m.fa_warn_ou_critical)} | ${t.opaque_ben} | ${t.n_fc} (${t.fc_alerte}) |\n`; };
const HEAD = '| niveau | n malv. | attrapé critical | attrapé warn | raté | inconnu | rappel (critical+warn), Wilson 95 % | opaque (dont attrapés par opacité seule) | n bénin | FA critical | FA critical % | FA warn | FA warn+critical % | opaque bénin | n fraude conforme (alertées) |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n';
for (const arm of [MAIN, PROD, 'sans_intention', 'intention_honnete']) {
  mdTot[arm] = ''; md += `\n### Totaux, bras ${arm}\n`;
  for (const ds of ['TOUT', ...datasets]) { const blk = `\n**${ds}**\n\n` + HEAD + ['FULL', 'D', 'C', 'B', 'A'].map((lv) => totalRow(lv, ds, arm)).join(''); md += blk; mdTot[arm] += blk; }
}
md += '\n';
// familles : compact (FULL / A / B / C) pour DEV et PUBLIC, V2 par famille et par sous-famille
const famBlock = (title, byFam, filterFn, arm) => {
  let s = `\n#### ${title} (bras ${arm})\n\nrappel = (attrapés critical+warn)/n malveillants ; FA = bénins en warn ou critical (dont critical) / n bénins. Écart = FULL moins B en points.\n\n| famille | n malv. | FULL | A | B | C | écart FULL-B (pts) | n bénin | FA FULL | FA B | FA C | raté B | inconnu B | opaque malv. B |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
  for (const k of Object.keys(byFam.FULL).filter(filterFn).sort()) {
    const g = (lv) => byFam[lv][k][arm];
    const f = g('FULL'), b = g('B');
    const fa = (t) => `${t.fa_w + t.fa_c} (${t.fa_c})`;
    s += `| ${k.split(':')[1]} | ${f.n_mal} | ${f.att_c + f.att_w}/${f.n_mal} | ${g('A').att_c + g('A').att_w} | ${b.att_c + b.att_w} | ${g('C').att_c + g('C').att_w} | ${f.n_mal ? (((f.att_c + f.att_w) - (b.att_c + b.att_w)) / f.n_mal * 100).toFixed(0) : '-'} | ${f.n_ben} | ${fa(f)} | ${fa(b)} | ${fa(g('C'))} | ${b.rate} | ${b.inc_mal} | ${b.opaque_mal} |\n`;
  }
  return s;
};
for (const arm of [MAIN, PROD]) {
  const fb = famBlock('DEV (attacks/DEV.jsonl)', res.par_famille, (k) => k.startsWith('DEV:'), arm) + famBlock('REGRESSION_PUBLIQUE (attacks_public)', res.par_famille, (k) => k.startsWith('PUBLIC:'), arm) + famBlock('V2_DEV, par famille', res.par_famille, (k) => k.startsWith('V2_DEV:'), arm);
  md += fb; mdFam[arm] = fb;
}
md += famBlock('V2_DEV, par famille/sous-famille', res.par_unite, (k) => k.startsWith('V2_DEV:'), MAIN);
writeFileSync(join(OUT, 'TABLES.md'), md);
writeFileSync(join(OUT, 'TAB_TOTAUX_produit.md'), mdTot[PROD]); writeFileSync(join(OUT, 'TAB_TOTAUX_catalogue.md'), mdTot[MAIN]);
writeFileSync(join(OUT, 'TAB_FAMILLES_produit.md'), mdFam[PROD]); writeFileSync(join(OUT, 'TAB_FAMILLES_catalogue.md'), mdFam[MAIN]);

// top 10 en markdown
const rl = ['C', 'S_code', 'S_age', 'S_tok', 'S_bal', 'S_look', 'S_site', 'S_sim', 'S_quote', 'D', 'O4', 'D_O4'];
let t10 = '';
const t10table = (list) => {
  let s = `| # | unité | n malv. | FULL | B | C | écart FULL-B (pts) | perdus | autre bras (${OTHER_ARM}) FULL/B | ${rl.map((l) => 'rest. ' + l).join(' | ')} | coût moyen/vérif. (code, âge, jeton, solde) |\n|---|---|---|---|---|---|---|---|---|${rl.map(() => '---').join('|')}|---|\n`;
  list.forEach((g, i) => { s += `| ${i + 1} | ${g.unit} | ${g.n_mal} | ${g.k_full} | ${g.k_B} | ${g.k_C} | ${g.ecart_pts_B.toFixed(0)} | ${g.perdus_B} | ${g.prod.k_full}/${g.prod.k_B} | ${rl.map((l) => g.restore[l]).join(' | ')} | ${g.cost_moyen.code.toFixed(1)}, ${g.cost_moyen.age.toFixed(1)}, ${g.cost_moyen.tok.toFixed(1)}, ${g.cost_moyen.bal.toFixed(1)} |\n`; });
  return s;
};
t10 += '\n#### Top 10 par écart en points (n malveillants >= 5)\n\n' + t10table(top10) + '\n#### Top 10 par nombre absolu de détections perdues\n\n' + t10table(top10abs);
writeFileSync(join(OUT, 'TOP10' + SUF + '.md'), t10);

// en ligne : tableau
let ol = '\n| niveau | lectures | appels RPC / vérification (moyenne, p95, max) | % sans aucun appel |';
const olArm = HEAD_ARM;
ol = `| niveau | lectures ajoutées à C | appels / vérification : moyenne, p95, max | % vérifications sans appel | rappel TOUT (critical+warn) | rappel DEV | rappel PUBLIC | rappel V2_DEV | FA warn+critical TOUT | FA critical TOUT |\n|---|---|---|---|---|---|---|---|---|---|\n`;
for (const lv of ['FULL', 'A', 'B', 'C', 'O1', 'O2', 'O3', 'O4', 'D', 'D_O4']) {
  const o = online.niveaux[lv]; const T = res.totaux[lv];
  const c = o ? `${o.appels_par_verification.moyenne.toFixed(2)}, ${o.appels_par_verification.p95}, ${o.appels_par_verification.max}` : (lv === 'D' ? '0 (liste livrée)' : '-');
  ol += `| ${lv} | ${o ? o.lectures.join('+') : '-'} | ${c} | ${o ? (o.appels_par_verification.part_sans_aucun_appel * 100).toFixed(0) + ' %' : '-'} | ${fw(T.TOUT[olArm].m.rappel)} | ${fw(T.DEV[olArm].m.rappel)} | ${fw(T.PUBLIC[olArm].m.rappel)} | ${fw(T.V2_DEV[olArm].m.rappel)} | ${fw(T.TOUT[olArm].m.fa_warn_ou_critical)} | ${fw(T.TOUT[olArm].m.fa_critical)} |\n`;
}
let ol2 = `\n| unité | n malv. | FULL | B | C | +code (O1) | +âge (O2) | +jeton (O3) | +solde (O4) | liste statique D | D+O4 |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
const gain = Object.entries(online.par_famille_delta).map(([u, o]) => ({ u, o, g: o.O4 - o.C })).filter((x) => x.g > 0).sort((a, b) => b.g - a.g).slice(0, 25);
for (const { u, o } of gain) ol2 += `| ${u} | ${o.n_mal} | ${o.FULL} | ${o.B} | ${o.C} | ${o.O1} | ${o.O2} | ${o.O3} | ${o.O4} | ${o.D} | ${o.D_O4} |\n`;
writeFileSync(join(OUT, 'EN_LIGNE' + SUF + '.md'), '\n#### Effet cumulé du contexte minimal en ligne (bras ' + olArm + ')\n\n' + ol + '\n#### Effet par unité (25 plus gros gains O4 - C, nombre de malveillants attrapés)\n\n' + ol2);

// ---------------------------------------------------------------- console : chiffres clés
console.log('== TOTAUX bras', MAIN);
for (const lv of ['FULL', 'D', 'C_hist', 'C', 'B', 'A', 'O1', 'O2', 'O3', 'O4', 'D_O4']) { const T = res.totaux[lv].TOUT[MAIN]; console.log(lv.padEnd(6), 'rappel', fw(T.m.rappel), '| crit', fw(T.m.rappel_critical), '| FA crit', fw(T.m.fa_critical), '| FA w+c', fw(T.m.fa_warn_ou_critical), '| inconnu', T.inc_mal, '| fc alertée', T.fc_alerte + '/' + T.n_fc); }
console.log('== TOTAUX bras', PROD);
for (const lv of ['FULL', 'C', 'B', 'A']) { const T = res.totaux[lv].TOUT[PROD]; console.log(lv.padEnd(6), 'rappel', fw(T.m.rappel), '| crit', fw(T.m.rappel_critical), '| FA crit', fw(T.m.fa_critical), '| FA w+c', fw(T.m.fa_warn_ou_critical)); }
for (const ds of datasets) { console.log('--', ds); for (const lv of ['FULL', 'C', 'B', 'A']) { const T = res.totaux[lv][ds][MAIN]; console.log(' ', lv.padEnd(5), 'rappel', fw(T.m.rappel), '| FA crit', fw(T.m.fa_critical), '| FA w+c', fw(T.m.fa_warn_ou_critical), '| opaque mal', T.opaque_mal, 'att par opacité', T.att_par_opacite); } }
console.log('== top10 points'); for (const g of top10) console.log(g.unit, g.n_mal, 'FULL', g.k_full, 'B', g.k_B, 'C', g.k_C, 'perdus', g.perdus_B, JSON.stringify(g.restore));
console.log('== top10 abs'); for (const g of top10abs) console.log(g.unit, g.n_mal, 'FULL', g.k_full, 'B', g.k_B, 'C', g.k_C, 'perdus', g.perdus_B, JSON.stringify(g.restore));
console.log(JSON.stringify(online.niveaux));

// ================================================================ fausses alertes : unités et causes
const OUTCAUSES = {};
for (const ARM_X of [MAIN, PROD]) {
const faLv = ['C', 'D', 'S_code', 'S_age', 'S_tok', 'S_bal', 'S_look', 'O4', 'D_O4'];
const faUnits = [];
for (const [u, rs] of Object.entries(units)) {
  const ben = rs.filter((r) => r.label === 'benin'); if (ben.length < 5) continue;
  const isC = (r, lv) => ch(r, lv, ARM_X) === 'c';
  const newC = ben.filter((r) => isC(r, 'B') && !isC(r, 'FULL'));
  const o = { unit: u, n_ben: ben.length, crit_full: ben.filter((r) => isC(r, 'FULL')).length, crit_B: ben.filter((r) => isC(r, 'B')).length, crit_C: ben.filter((r) => isC(r, 'C')).length, nouveaux_critical_B: newC.length, supprimes_par: {} };
  for (const lv of faLv) o.supprimes_par[lv] = newC.filter((r) => !isC(r, lv)).length;
  faUnits.push(o);
}
faUnits.sort((a, b) => b.nouveaux_critical_B / b.n_ben - a.nouveaux_critical_B / a.n_ben || b.nouveaux_critical_B - a.nouveaux_critical_B);
const causes = (lv, filt) => { const m = {}; for (const r of rows) { if (!filt(r)) continue; for (const c of (r.codes && r.codes[lv]) || []) m[c] = (m[c] || 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 14); };
const benC = (lv) => (r) => r.label === 'benin' && ch(r, lv, ARM_X) === 'c';
const benWC = (lv) => (r) => r.label === 'benin' && ['w', 'c'].includes(ch(r, lv, ARM_X));
const malLost = (r) => r.label === 'malveillant' && caught(r, 'FULL', ARM_X) && !caught(r, 'B', ARM_X);
const malCritLost = (r) => r.label === 'malveillant' && ch(r, 'FULL', ARM_X) === 'c' && ch(r, 'B', ARM_X) !== 'c';
const out2 = {
  fa_critical_unites_top: faUnits.slice(0, 15),
  causes_FA_critical: { FULL: causes('FULL', benC('FULL')), B: causes('B', benC('B')), C: causes('C', benC('C')), D: causes('D', benC('D')) },
  causes_FA_warn_ou_critical: { FULL: causes('FULL', benWC('FULL')), B: causes('B', benWC('B')), C: causes('C', benWC('C')) },
  codes_FULL_des_detections_perdues_en_B: causes('FULL', malLost),
  codes_FULL_des_critical_perdus_en_B: causes('FULL', malCritLost),
  n_critical_perdus_B: rows.filter(malCritLost).length,
  n_detections_perdues_B: rows.filter(malLost).length,
};
OUTCAUSES[ARM_X] = out2;
console.log('######## ARM', ARM_X); console.log('== FA unites top'); for (const u of faUnits.slice(0, 12)) console.log(u.unit, u.n_ben, 'crit FULL', u.crit_full, 'B', u.crit_B, 'C', u.crit_C, 'nouveaux', u.nouveaux_critical_B, JSON.stringify(u.supprimes_par));
console.log('causes FA critical B', JSON.stringify(out2.causes_FA_critical.B)); console.log('causes FA critical FULL', JSON.stringify(out2.causes_FA_critical.FULL)); console.log('causes FA critical C', JSON.stringify(out2.causes_FA_critical.C)); console.log('causes FA critical D', JSON.stringify(out2.causes_FA_critical.D));
console.log('causes FA w/c B', JSON.stringify(out2.causes_FA_warn_ou_critical.B)); console.log('causes FA w/c FULL', JSON.stringify(out2.causes_FA_warn_ou_critical.FULL));
console.log('perdus codes FULL', JSON.stringify(out2.codes_FULL_des_detections_perdues_en_B), out2.n_detections_perdues_B, 'crit perdus', out2.n_critical_perdus_B, JSON.stringify(out2.codes_FULL_des_critical_perdus_en_B));

}
writeFileSync(join(OUT, 'fausses_alertes_causes.json'), JSON.stringify(OUTCAUSES, null, 1));

// TOP10.md : ajout des fausses alertes critical (nouvelles en B) par unité et des causes
{
  let s = '\n#### Fausses alertes critical créées par la perte de contexte (bénins critical en B mais pas dans le banc complet), unités à n bénin >= 5\n';
  for (const arm of [MAIN, PROD]) {
    const o = OUTCAUSES[arm];
    s += `\n**Bras ${arm}** (supprimé par : nombre de ces faux critical qui disparaissent quand on ajoute C = carnet+historique, D = liste statique livrée, O4 = lectures RPC)\n\n| unité | n bénin | critical FULL | critical B | critical C | nouveaux critical en B | supprimés par C | par D | par O4 | par D+O4 |\n|---|---|---|---|---|---|---|---|---|---|\n`;
    for (const u of o.fa_critical_unites_top.slice(0, 12)) s += `| ${u.unit} | ${u.n_ben} | ${u.crit_full} | ${u.crit_B} | ${u.crit_C} | ${u.nouveaux_critical_B} | ${u.supprimes_par.C} | ${u.supprimes_par.D} | ${u.supprimes_par.O4} | ${u.supprimes_par.D_O4} |\n`;
    const f = (a) => a.map(([k, n]) => `${k} ${n}`).join(', ');
    s += `\nCauses des faux critical (codes du plancher et « adem: » du comparateur), bras ${arm} :\n- banc complet : ${f(o.causes_FA_critical.FULL)}\n- B : ${f(o.causes_FA_critical.B)}\n- C : ${f(o.causes_FA_critical.C)}\n- D : ${f(o.causes_FA_critical.D)}\n\nCodes qui, dans le banc complet, attrapaient en critical les ${o.n_critical_perdus_B} malveillants que B ne marque plus critical : ${f(o.codes_FULL_des_critical_perdus_en_B)}\n\nCodes du banc complet pour les ${o.n_detections_perdues_B} malveillants qui passent à ok en B : ${f(o.codes_FULL_des_detections_perdues_en_B)}\n`;
  }
  const fs2 = readFileSync(join(OUT, 'TOP10' + SUF + '.md'), 'utf8');
  writeFileSync(join(OUT, 'TOP10' + SUF + '.md'), fs2 + s);
}

// ================================================================ DETAIL_FAMILLES : tous les champs demandés, par famille, avec n et Wilson, niveaux FULL / A / B / C
{
  let s = `# Détail par famille, bras ${HEAD_ARM}\n\nChaque ligne : malveillants (n, attrapé critical, attrapé warn, raté, inconnu, rappel avec Wilson 95 %, dont opaques) puis bénins (n, fausse alerte critical avec Wilson, fausse alerte warn, dont opaques). « opaque » = le moteur n'a pas su décoder tout ou partie de la requête ; entre parenthèses, les malveillants attrapés uniquement parce que l'opacité déclenche un warn.\n`;
  const line = (k, t) => `| ${k} | ${t.n_mal} | ${t.att_c} | ${t.att_w} | ${t.rate} | ${t.inc_mal} | ${t.n_mal ? fw(t.m.rappel) : '-'} | ${t.opaque_mal} (${t.att_par_opacite}) | ${t.n_ben} | ${t.fa_c} | ${t.n_ben ? fw(t.m.fa_critical) : '-'} | ${t.fa_w} | ${t.opaque_ben} |\n`;
  const H = '| famille | n malv. | att. critical | att. warn | raté | inconnu | rappel [Wilson 95 %] (k/n) | opaque malv. (att. par opacité) | n bénin | FA critical | FA critical [Wilson] | FA warn | opaque bénin |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n';
  for (const [ds, src, pref] of [['DEV', res.par_famille, 'DEV:'], ['REGRESSION_PUBLIQUE', res.par_famille, 'PUBLIC:'], ['V2_DEV (familles)', res.par_famille, 'V2_DEV:'], ['V2_DEV (sous-familles)', res.par_unite, 'V2_DEV:']]) {
    s += `\n## ${ds}\n`;
    for (const lv of ['FULL', 'A', 'B', 'C']) {
      s += `\n### ${ds}, niveau ${lv}\n\n` + H;
      for (const k of Object.keys(src[lv]).filter((x) => x.startsWith(pref)).sort()) s += line(k.slice(pref.length), src[lv][k][HEAD_ARM]);
      const tot = res.totaux[lv][pref === 'PUBLIC:' ? 'PUBLIC' : pref === 'DEV:' ? 'DEV' : 'V2_DEV'][HEAD_ARM];
      s += line('**TOTAL**', tot);
    }
  }
  writeFileSync(join(OUT, 'DETAIL_FAMILLES' + SUF + '.md'), s);
}

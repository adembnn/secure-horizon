// Tableaux communs à tous les bras : à partir de lignes { id, family, style, lang, relation, truth, decision, text, why }.
import { wilson, VERDICT } from './lib.mjs';
const pct = (x) => (100 * x).toFixed(1) + ' %';
export const fmt = (k, n) => { if (!n) return 'n/a'; const [lo, hi] = wilson(k, n); return `${k}/${n} = ${pct(k / n)} [${pct(lo)} ; ${pct(hi)}]`; };
export function confusion(rows) {
  const M = {}; for (const t of VERDICT) { M[t] = {}; for (const d of VERDICT) M[t][d] = 0; }
  for (const r of rows) M[r.truth][r.decision]++;
  return M;
}
// mesures par groupe
export function measure(rows) {
  const M = rows.filter((r) => r.truth === 'ne_correspond_pas'), K = rows.filter((r) => r.truth === 'correspond'), U = rows.filter((r) => r.truth === 'inverifiable');
  const n = (a, d) => a.filter((r) => r.decision === d).length;
  return {
    n: rows.length, n_mismatch: M.length, n_match: K.length, n_inv: U.length,
    attrape: n(M, 'ne_correspond_pas'), rate_correspond: n(M, 'correspond'), rate_inv: n(M, 'inverifiable'),
    faux_positif: n(K, 'ne_correspond_pas'), correspond_ok: n(K, 'correspond'), correspond_inv: n(K, 'inverifiable'),
    inv_ok: n(U, 'inverifiable'), inv_surconfiance: n(U, 'correspond'), inv_alerte: n(U, 'ne_correspond_pas'),
  };
}
export const groupBy = (rows, f) => { const g = {}; for (const r of rows) (g[f(r)] ??= []).push(r); return g; };
export function tableMd(rows, keyFn, title) {
  const g = groupBy(rows, keyFn);
  let md = `\n#### ${title}\n\n| Groupe | Paires | Attrapé (sur ne correspond pas) | Raté en « correspond » | Non tranché | Faux positif (sur correspond) | Invérifiable reconnu | Invérifiable pris pour « correspond » |\n|---|---|---|---|---|---|---|---|\n`;
  for (const k of Object.keys(g).sort()) {
    const m = measure(g[k]);
    md += `| ${k} | ${m.n} | ${fmt(m.attrape, m.n_mismatch)} | ${m.rate_correspond} | ${m.rate_inv} | ${fmt(m.faux_positif, m.n_match)} | ${fmt(m.inv_ok, m.n_inv)} | ${m.inv_surconfiance} |\n`;
  }
  const m = measure(rows);
  md += `| **toutes** | ${m.n} | ${fmt(m.attrape, m.n_mismatch)} | ${m.rate_correspond} | ${m.rate_inv} | ${fmt(m.faux_positif, m.n_match)} | ${fmt(m.inv_ok, m.n_inv)} | ${m.inv_surconfiance} |\n`;
  return md;
}
export function confusionMd(rows) {
  const M = confusion(rows);
  let md = '\n| Vérité \ Décision | correspond | ne correspond pas | invérifiable |\n|---|---|---|---|\n';
  for (const t of VERDICT) md += `| **${t}** | ${M[t].correspond} | ${M[t].ne_correspond_pas} | ${M[t].inverifiable} |\n`;
  return md;
}
// gravité d'une erreur : rater une demande qui ne correspond pas > fausse alerte > le reste
const SEV = (r) => (r.truth === 'ne_correspond_pas' && r.decision === 'correspond' ? 0 : r.truth === 'correspond' && r.decision === 'ne_correspond_pas' ? 1 : r.truth === 'inverifiable' && r.decision === 'correspond' ? 2 : r.truth === 'ne_correspond_pas' && r.decision === 'inverifiable' ? 3 : r.truth === 'inverifiable' ? 4 : 5);
export const errors = (rows) => rows.filter((r) => r.truth !== r.decision).sort((a, b) => SEV(a) - SEV(b) || a.id.localeCompare(b.id));
export function worstMd(rows, k = 20) {
  const e = errors(rows).slice(0, k);
  let md = '\n| # | Id | Vérité | Décision | Phrase | Pourquoi (vérité / bras) |\n|---|---|---|---|---|---|\n';
  e.forEach((r, i) => { md += `| ${i + 1} | ${r.id} | ${r.truth} | ${r.decision} | ${String(r.text).replace(/\|/g, '/')} | ${r.truthWhy} // ${r.why} |\n`; });
  return md;
}

import { wilson } from "./lib.mjs";
export function auc(rows) { // rows: {label, score}
  const pos = rows.filter(r => r.label === 1), neg = rows.filter(r => r.label === 0); if (!pos.length || !neg.length) return null;
  let s = 0; for (const p of pos) for (const n of neg) s += p.score > n.score ? 1 : p.score === n.score ? 0.5 : 0; return s / (pos.length * neg.length);
}
export function atFPR(rows, target) { // seuil choisi pour que FPR <= target sur les négatifs ; rappel obtenu
  const neg = rows.filter(r => r.label === 0).map(r => r.score).sort((a, b) => b - a); const pos = rows.filter(r => r.label === 1);
  const k = Math.floor(target * neg.length); const thr = neg[k] ?? -Infinity; // strictement supérieur
  const tp = pos.filter(r => r.score > thr).length, fp = neg.filter(s => s > thr).length;
  return { fpr_cible: target, seuil: thr, rappel: tp / pos.length, rappel_wilson95: wilson(tp, pos.length), fp, n_neg: neg.length, tp, n_pos: pos.length };
}
export function report(name, rows) { const r = rows; return { modele: name, n: r.length, auc: auc(r), a_FPR_1pct: atFPR(r, 0.01), a_FPR_5pct: atFPR(r, 0.05) }; }

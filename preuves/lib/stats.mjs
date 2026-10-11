// Statistiques du banc : intervalle de Wilson à 95 %, quantiles, empreintes. Aucune dépendance.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

const Z = 1.959963984540054;
// Intervalle de Wilson à 95 % pour k succès sur n. Renvoie des proportions (0 à 1), ou null si n = 0.
export function wilson(k, n) {
  if (!n) return null;
  const p = k / n, z2 = Z * Z, d = 1 + z2 / n;
  const c = (p + z2 / (2 * n)) / d, h = (Z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}
// { k, n, taux, ic95: [bas, haut] } en pourcentages arrondis à 0,1 ; le dénominateur est toujours porté.
export function part(k, n) {
  const w = wilson(k, n);
  const r = (x) => Math.round(x * 1000) / 10;
  return { k, n, taux: n ? r(k / n) : null, ic95: w ? [r(w[0]), r(w[1])] : null };
}
export const ecrit = (p) => (p.n ? `${p.k}/${p.n} = ${String(p.taux.toFixed(1)).replace('.', ',')} % [${String(p.ic95[0].toFixed(1)).replace('.', ',')} ; ${String(p.ic95[1].toFixed(1)).replace('.', ',')}]` : `0/0 (sans objet)`);

export function quantiles(values) {
  const a = values.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  if (!a.length) return { n: 0 };
  const q = (p) => a[Math.min(a.length - 1, Math.max(0, Math.ceil(p * a.length) - 1))];
  const r = (x) => Math.round(x * 100) / 100;
  return { n: a.length, p50: r(q(0.5)), p95: r(q(0.95)), p99: r(q(0.99)), max: r(a[a.length - 1]), moyenne: r(a.reduce((s, x) => s + x, 0) / a.length) };
}

export const sha256 = (data) => createHash('sha256').update(data).digest('hex');
// Empreinte d'un fichier par flux d'octets : le contenu n'est ni décodé, ni analysé, ni affiché. Compte aussi les octets.
export function sha256Fichier(path) {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256'); let octets = 0;
    createReadStream(path).on('data', (c) => { h.update(c); octets += c.length; }).on('error', reject).on('end', () => resolve({ sha256: h.digest('hex'), octets }));
  });
}

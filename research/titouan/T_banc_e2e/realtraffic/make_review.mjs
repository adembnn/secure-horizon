// Prépare l'échantillon de revue manuelle (mode A, sans intention, sans contexte) : tous les critical de la C-Chain + warn tirés au hasard (graine 20261011), stratifiés par code d'alerte.
import fs from 'node:fs';
import path from 'node:path';
const HERE = path.resolve(import.meta.dirname), CACHE = path.join(HERE, 'cache_'), OUT = path.join(HERE, 'out');
const chain = process.argv[2] || 'cchain', NCRIT = Number(process.argv[3] || 25), NTOT = Number(process.argv[4] || 50);
const { A } = JSON.parse(fs.readFileSync(path.join(CACHE, `rows_${chain}.json`), 'utf8'));
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const r = mulberry32(20261011);
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const crit = shuf(A.filter((x) => x.level === 'critical')).slice(0, NCRIT);
const warn = shuf(A.filter((x) => x.level === 'warn'));
// stratification des warn par premier code d'alerte
const byCode = {}; for (const w of warn) (byCode[w.codes[0]] ||= []).push(w);
const picks = []; const need = NTOT - crit.length; const keys = Object.keys(byCode).sort((a, b) => byCode[b].length - byCode[a].length);
// 1 par code (les plus fréquents d'abord), puis tirage proportionnel
for (const k of keys) { if (picks.length < need) picks.push(byCode[k].shift()); }
const rest = shuf(Object.values(byCode).flat()); while (picks.length < need && rest.length) picks.push(rest.shift());
const t6 = (a) => (a ? a.slice(0, 6) + '..' + a.slice(-4) : 'null');
const rows = [...crit, ...picks].map((x, n) => ({ n: n + 1, level: x.level, hash: x.hash, to: t6(x.to), to_full: x.to, selector: x.sel, name: x.name, type: x.type, codes: x.codes, details: x.det, value_wei: x.value, calldata_bytes: x.len }));
fs.writeFileSync(path.join(CACHE, `review_${chain}.json`), JSON.stringify(rows, null, 1));
for (const x of rows) console.log(x.n, x.level, x.to, x.selector, x.name, '|', x.codes.join(','), '|', (x.details || []).join(' ; ').replace(/0x[0-9a-f]{40}/g, (m) => m.slice(0, 6) + '..' + m.slice(-4)).slice(0, 150), '| v=' + x.value_wei, 'len=' + x.calldata_bytes);

// Mesure du taux d'alertes du moteur ACTUEL sur du trafic réel (lecture seule, aucun réseau, aucun secret).
// Usage : node run_real.mjs <cchain|eth>
// Mode A "nu" : aucune intention, aucun contexte. Mode B "protocoles connus" : knownSpenders = 100 destinataires les plus fréquents DE L'ÉCHANTILLON (liste circulaire, voir REALTRAFFIC.md).
// Niveau = plancher du moteur après politique (applyPolicy avec adem = null) : c'est le mode « sans intention » de run_loop.mjs (out.levels.sans_intention).
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const CHAIN = process.argv[2];
const HERE = path.resolve(import.meta.dirname);
const ROOT = path.resolve(HERE, '..');
const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
const OUT = path.join(HERE, 'out'), CACHE = path.join(HERE, 'cache_');
const CFG = {
  cchain: { chainId: 43114, file: path.resolve(ROOT, '..', 'bench', 'data', 'cchain_sample.jsonl'), take: null },
  eth: { chainId: 1, file: path.join(CACHE, 'eth_sample.jsonl'), take: 6000 },
}[CHAIN];
if (!CFG) throw new Error('chain?');

// ---- hash de version des fichiers utilisés, relu juste avant le chargement (et re-vérifié à la fin)
const used = ['engine/src/engine.mjs', 'engine/src/rules.mjs', 'engine/src/rules_extra.mjs', 'engine/src/fixes.mjs', 'engine/src/calldata.mjs', 'engine/src/registry.mjs', 'engine/src/abi.mjs', 'engine/src/util.mjs', 'run/policy.mjs', 'run/run_loop.mjs'];
const hashes = () => Object.fromEntries(used.map((f) => [f, createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex').slice(0, 16)]));
const h0 = hashes();
const E = await imp('engine/src/engine.mjs');
const { applyExtraRules } = await imp('engine/src/rules_extra.mjs');
const { applyPolicy } = await imp('run/policy.mjs');
const { KEPT } = await imp('engine/src/fixes.mjs');

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function wilson(k, n, z = 1.96) { if (!n) return [0, 0]; const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)]; }
const stat = (k, n) => { const [l, h] = wilson(k, n); return { k, n, pct: n ? +(100 * k / n).toFixed(3) : null, wilson95_pct: [+(100 * l).toFixed(3), +(100 * h).toFixed(3)] }; };

let txs = fs.readFileSync(CFG.file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const totalAvail = txs.length;
if (CFG.take && txs.length > CFG.take) { // sous-échantillon déterministe (Fisher-Yates, graine 20261011)
  const r = mulberry32(20261011), a = txs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } txs = a.slice(0, CFG.take);
}
const lc = (s) => (typeof s === 'string' ? s.toLowerCase() : s);

// ---- liste de référence « protocoles connus » : 100 destinataires les plus fréquents (circulaire)
const freq = new Map(); for (const t of txs) if (t.to) freq.set(lc(t.to), (freq.get(lc(t.to)) || 0) + 1);
const top = [...freq.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 100);
const known = top.map(([a]) => a);
const knownShare = top.reduce((s, [, c]) => s + c, 0) / txs.length;

const SEL = { transfer: 'a9059cbb', transferFrom: '23b872dd', approve: '095ea7b3', setApprovalForAll: 'a22cb465', increaseAllowance: '39509351', permit: 'd505accf', permitDai: '8fcbaf0c' };
const selOf = (t) => { const d = (t.input || '0x').slice(2); return d.length >= 8 ? d.slice(0, 8) : null; };
function typeOf(t, eff) {
  if (!t.to) return 'creation';
  const s = selOf(t); if (!s) return (t.input && t.input.length > 2) ? 'opaque' : 'native';
  if (s === SEL.transfer || s === SEL.transferFrom) return 'erc20_transfer';
  if ([SEL.approve, SEL.setApprovalForAll, SEL.increaseAllowance, SEL.permit, SEL.permitDai].includes(s)) return 'approve';
  return eff.opaque ? 'opaque' : 'appel_connu';
}
const reqOf = (t) => ({ method: 'eth_sendTransaction', params: [{ from: t.from, to: t.to, data: t.input, value: t.value, chainId: '0x' + CFG.chainId.toString(16) }] });

function runMode(ctxExtra) {
  const rows = [];
  const one = (t) => {
    const request = reqOf(t); const tx = request.params[0];
    const ctx = { chainId: CFG.chainId, from: lc(t.from), now: t.ts, ...ctxExtra };
    const t0 = performance.now();
    let level, codes = [], notes = [], opaque = false, type = null, err = null, name = null, det = [];
    try {
      const eff = E.analyzeTransaction(tx, ctx);
      applyExtraRules(eff, request, ctx);
      const pol = applyPolicy({ eff, adem: null, ctx, intent: null, request });
      level = pol.level; notes = pol.notes; opaque = !!eff.opaque;
      codes = eff.risk_flags.filter((f) => f.severity !== 'info').map((f) => f.severity[0] + ':' + f.code);
      const infoCodes = eff.risk_flags.filter((f) => f.severity === 'info');
      if (level === 'ok' && infoCodes.length) level = 'info';
      name = (eff.nested && eff.nested[0] && eff.nested[0].name) || null;
      type = typeOf(t, eff);
      det = eff.risk_flags.filter((f) => f.severity !== 'info').map((f) => f.detail).slice(0, 2);
    } catch (e) { level = 'inconnu'; err = String(e.message || e).slice(0, 120); type = typeOf(t, { opaque: true }); }
    const ms = performance.now() - t0;
    return { i: rows.length, hash: t.hash, to: t.to, sel: selOf(t), type, level, codes, notes, opaque, name, err, det, value: t.value, len: ((t.input || '0x').length - 2) / 2, ms };
  };
  for (const t of txs.slice(0, 300)) one(t); // échauffement JIT (non compté)
  for (const t of txs) rows.push(one(t));
  return rows;
}
const rowsA = runMode({});
const rowsB = runMode({ knownSpenders: known, knownVerifiers: new Set(known) });

const LEVELS = ['critical', 'warn', 'info', 'ok', 'inconnu'], TYPES = ['native', 'erc20_transfer', 'approve', 'appel_connu', 'opaque', 'creation'];
const pctl = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
function summarize(rows) {
  const n = rows.length, o = { n, par_niveau: {}, par_type: {}, latence_ms: {} };
  for (const L of LEVELS) o.par_niveau[L] = stat(rows.filter((r) => r.level === L).length, n);
  o.alerte_critical_ou_warn = stat(rows.filter((r) => r.level === 'critical' || r.level === 'warn').length, n);
  for (const T of TYPES) {
    const sub = rows.filter((r) => r.type === T); const e = { n: sub.length, part_du_trafic_pct: +(100 * sub.length / n).toFixed(2) };
    for (const L of LEVELS) e[L] = stat(sub.filter((r) => r.level === L).length, sub.length);
    o.par_type[T] = e;
  }
  const ms = rows.map((r) => r.ms);
  o.latence_ms = { moyenne: +(ms.reduce((a, b) => a + b, 0) / n).toFixed(4), p50: +pctl(ms, .5).toFixed(4), p95: +pctl(ms, .95).toFixed(4), p99: +pctl(ms, .99).toFixed(4), max: +Math.max(...ms).toFixed(3) };
  const cc = {}; for (const r of rows) if (r.level === 'critical' || r.level === 'warn') for (const c of r.codes) cc[c] = (cc[c] || 0) + 1;
  o.codes_des_alertes = Object.fromEntries(Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 15));
  o.opaque_total = stat(rows.filter((r) => r.opaque).length, n);
  return o;
}
const h1 = hashes();
const res = {
  chaine: CHAIN, chainId: CFG.chainId, n_tx_disponibles: totalAvail, n_tx_analysees: txs.length, sous_echantillonnage: CFG.take ? `${CFG.take} sur ${totalAvail}, Fisher-Yates graine 20261011` : 'aucun',
  fixes_actifs: process.env.POLICY_FIXES || ('defaut KEPT=' + KEPT.join(',')),
  version_fichiers_sha256_16: h0, fichiers_modifies_pendant_la_mesure: JSON.stringify(h0) !== JSON.stringify(h1),
  liste_connue: { taille: known.length, part_du_trafic_pct: +(100 * knownShare).toFixed(1), circulaire: true },
  mode_A_sans_intention_sans_contexte: summarize(rowsA),
  mode_B_sans_intention_avec_protocoles_connus: summarize(rowsB),
};
const cr = {}; for (let i = 0; i < rowsA.length; i++) { const k = rowsA[i].level + '->' + rowsB[i].level; cr[k] = (cr[k] || 0) + 1; } res.croisement_A_vers_B = cr;
fs.writeFileSync(path.join(OUT, `real_${CHAIN}.json`), JSON.stringify(res, null, 1));
fs.writeFileSync(path.join(OUT, `known_list_${CHAIN}.json`), JSON.stringify({ avertissement: "Liste CIRCULAIRE : les 100 destinataires les plus fréquents de l'échantillon lui-même. Ce n'est pas une liste publique indépendante ; elle mesure un plafond (tout le trafic concentré est 'connu'), pas la couverture réelle d'un catalogue.", n_tx_echantillon: txs.length, part_du_trafic_pct: +(100 * knownShare).toFixed(1), top: top.map(([a, c]) => ({ to: a, n: c })) }, null, 1));
fs.writeFileSync(path.join(CACHE, `rows_${CHAIN}.json`), JSON.stringify({ A: rowsA, B: rowsB }));
const brief = (s) => ({ par_niveau: Object.fromEntries(Object.entries(s.par_niveau).map(([k, v]) => [k, `${v.k} (${v.pct}% [${v.wilson95_pct}])`])), par_type_n: Object.fromEntries(Object.entries(s.par_type).map(([k, v]) => [k, v.n])), opaque: s.opaque_total.pct, lat: s.latence_ms, codes: s.codes_des_alertes });
console.log(JSON.stringify({ n: txs.length, modifies: res.fichiers_modifies_pendant_la_mesure, A: brief(res.mode_A_sans_intention_sans_contexte), B: brief(res.mode_B_sans_intention_avec_protocoles_connus), croisement: cr }, null, 1));

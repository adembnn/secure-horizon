// Transactions réelles de la C-Chain (bench/data/cchain_sample.jsonl, 6 324 tx, 1 500 blocs tirés au hasard, graine 20261011).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { analyzeTransaction } from '../src/engine.mjs';
import { BY_SELECTOR } from '../src/registry.mjs';
import { validateEffects } from './schema.mjs';

const OUT = new URL('../out/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const txs = readFileSync(new URL('../../../bench/data/cchain_sample.jsonl', import.meta.url), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const CTX = (t) => ({ chainId: 43114, from: t.from, now: t.ts });
const ZERO = '0x0000000000000000000000000000000000000000';

// tirage reproductible (mulberry32)
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(20261011);
const sample100 = (() => { const idx = new Set(); while (idx.size < 100) idx.add(Math.floor(rnd() * txs.length)); return [...idx].map((i) => txs[i]); })();

test('le fichier contient bien 6 325 tx de la C-Chain', () => assert.equal(txs.length, 6325));

test('100 tx aléatoires de la C-Chain : aucun plantage, schéma Effects valide, mesure de la part non décodée', async (t) => {
  const stat = { n: 100, native: 0, decoded_known: 0, opaque: 0, creation: 0, unknown_selector: 0, levels: { ok: 0, warn: 0, critical: 0 }, levelsEv: { ok: 0, warn: 0, critical: 0 }, schema_errors: 0 };
  for (const [i, tx] of sample100.entries()) {
    await t.test(`C-Chain #${String(i + 1).padStart(3, '0')} ${tx.hash.slice(0, 12)}… ${tx.input.slice(0, 10)}`, () => {
      const e = analyzeTransaction({ from: tx.from, to: tx.to, input: tx.input, value: tx.value, type: tx.type }, CTX(tx));
      const errs = validateEffects(e);
      assert.deepEqual(errs, []);
      stat.levels[e.level]++; stat.levelsEv[e.levelEvidence]++;
      if (!tx.to) stat.creation++;
      else if (tx.input === '0x') stat.native++;
      else if (e.opaque) { stat.opaque++; if (e.risk_flags.some((f) => f.code === 'unknown_selector')) stat.unknown_selector++; } else stat.decoded_known++;
    });
  }
  stat.opaque_share_of_all_pct = +(100 * (stat.opaque + stat.creation) / stat.n).toFixed(1);
  stat.opaque_share_of_contract_calls_pct = +(100 * (stat.opaque + stat.creation) / (stat.n - stat.native)).toFixed(1);
  writeFileSync(new URL('cchain_sample100.json', OUT), JSON.stringify(stat, null, 1));
  assert.equal(stat.native + stat.decoded_known + stat.opaque + stat.creation, 100);
});

test('les 6 325 tx de la C-Chain : zéro exception, schéma valide, répartition et part non décodée', () => {
  const levels = { ok: 0, warn: 0, critical: 0 }; const levelsEv = { ok: 0, warn: 0, critical: 0 }; const flags = {};
  const c = { n: txs.length, native_transfer: 0, creation: 0, decoded: 0, opaque_unknown_selector: 0, opaque_other: 0, by_type: {}, schema_errors: 0, exceptions: 0, embedded_hits: 0, embedded_critical: 0 };
  const unknownSel = {};
  const t0 = performance.now();
  for (const tx of txs) {
    c.by_type[tx.type] = (c.by_type[tx.type] || 0) + 1;
    let e;
    try { e = analyzeTransaction({ from: tx.from, to: tx.to, input: tx.input, value: tx.value, type: tx.type }, CTX(tx)); } catch (err) { c.exceptions++; continue; }
    if (validateEffects(e).length) c.schema_errors++;
    levels[e.level]++; levelsEv[e.levelEvidence]++;
    for (const f of e.risk_flags) flags[f.code] = (flags[f.code] || 0) + 1;
    if (e.embedded.length) { c.embedded_hits++; if (e.risk_flags.some((f) => f.code === 'embedded_calls' && f.severity === 'critical')) c.embedded_critical++; }
    if (!tx.to) c.creation++;
    else if (tx.input === '0x') c.native_transfer++;
    else if (!e.opaque) c.decoded++;
    else if (e.risk_flags.some((f) => f.code === 'unknown_selector')) { c.opaque_unknown_selector++; const s = tx.input.slice(0, 10); unknownSel[s] = (unknownSel[s] || 0) + 1; }
    else c.opaque_other++;
  }
  const calls = c.n - c.native_transfer;
  c.contract_calls = calls;
  c.undecoded_pct_of_all = +(100 * (c.creation + c.opaque_unknown_selector + c.opaque_other) / c.n).toFixed(1);
  c.undecoded_pct_of_contract_calls = +(100 * (c.creation + c.opaque_unknown_selector + c.opaque_other) / calls).toFixed(1);
  c.decoded_pct_of_contract_calls = +(100 * c.decoded / calls).toFixed(1);
  c.levels = levels; c.levels_evidence_only = levelsEv; c.warn_evidence_pct_of_all = +(100 * levelsEv.warn / c.n).toFixed(2); c.flags = flags; c.ms_total = Math.round(performance.now() - t0); c.us_per_tx = Math.round((performance.now() - t0) * 1000 / c.n);
  c.top_unknown_selectors = Object.entries(unknownSel).sort((a, b) => b[1] - a[1]).slice(0, 12);
  c.critical_pct_of_all = +(100 * levels.critical / c.n).toFixed(2);
  c.critical_pct_of_contract_calls = +(100 * levels.critical / calls).toFixed(2);
  writeFileSync(new URL('cchain_all.json', OUT), JSON.stringify(c, null, 1));
  assert.equal(c.exceptions, 0); assert.equal(c.schema_errors, 0);
});

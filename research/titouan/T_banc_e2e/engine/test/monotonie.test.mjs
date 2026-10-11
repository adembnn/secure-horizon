// Invariant D-009 : « ajouter de l'information d'intention ne baisse JAMAIS un verdict ».
// Pour chaque cas des jeux DEV (attacks/DEV.jsonl), attacks_public/PUBLIC.jsonl, redteam/V2_DEV_norm.jsonl :
//   niveau sans intention  <=  niveau avec le TYPE d'intention seul  <=  niveau avec l'intention détaillée.
// Jamais V2_TEST, jamais attacks/TEST.jsonl (scellés). Mesure et correctif : run/mesure_monotonie.mjs, run/policy.mjs (F31-F33, monotoneGuard).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { mesure, JEUX } = await import(pathToFileURL(join(ROOT, 'run', 'mesure_monotonie.mjs')).href);
const { monotoneGuard } = await import(pathToFileURL(join(ROOT, 'run', 'policy.mjs')).href);
const { normalizeCase } = await import(pathToFileURL(join(ROOT, 'redteam', 'normalize_v2.mjs')).href); // même normalisation que les bancs
const { evaluate } = await import(pathToFileURL(join(ROOT, 'server', 'server.mjs')).href);

test('les jeux mesurés sont DEV / public / V2_DEV, jamais un jeu scellé', () => {
  assert.deepEqual(JEUX, ['attacks/DEV.jsonl', 'attacks_public/PUBLIC.jsonl', 'redteam/V2_DEV_norm.jsonl']);
  for (const f of JEUX) assert.ok(!/TEST/.test(f));
});

test('monotoneGuard : jamais sous le niveau sans intention, jamais de ok créé', () => {
  const L = ['ok', 'unknown', 'warn', 'critical'];
  const R = { ok: 0, unknown: 0.5, warn: 1, critical: 2 };
  for (const a of L) for (const b of L) {
    const g = monotoneGuard(a, b);
    assert.ok(R[g] >= R[a] && R[g] >= R[b], `${a} ${b} -> ${g}`);
    assert.ok(g === a || g === b);
  }
  assert.equal(monotoneGuard('ok', 'critical'), 'critical');
  assert.equal(monotoneGuard('critical', 'ok'), 'critical');
  assert.equal(monotoneGuard('warn', 'unknown'), 'warn');
});

const noViolation = (res, titre) => {
  const tot = Object.values(res.jeux).reduce((n, j) => n + j.n, 0);
  assert.ok(tot > 6000, `trop peu de cas mesurés (${tot})`);
  for (const [f, j] of Object.entries(res.jeux)) {
    assert.equal(j.none_to_type, 0, `${titre} ${f} : le type seul baisse ${j.none_to_type} cas sous « sans intention »`);
    assert.equal(j.type_to_full, 0, `${titre} ${f} : l'intention détaillée baisse ${j.type_to_full} cas sous le type seul`);
    assert.equal(j.none_to_full, 0, `${titre} ${f} : l'intention détaillée baisse ${j.none_to_full} cas sous « sans intention »`);
  }
  assert.equal(res.violations.length, 0, `${titre} : ${res.violations.slice(0, 3).map((v) => v.id).join(', ')}`);
};

test('noyau (moteur + comparateur + politique) : 0 violation de monotonie sur DEV, public, V2_DEV', async () => {
  noViolation(await mesure(JEUX, { detectors: false }), 'noyau');
});

test('chaîne produit (avec les détecteurs, intention absente plafonnée à orange, garde de monotonie) : 0 violation', async () => {
  noViolation(await mesure(JEUX, { detectors: true, premiseCap: true, guard: true }), 'détecteurs+garde');
});

test('chaîne stricte (intention absente = rouge des détecteurs) avec la garde : 0 violation', async () => {
  noViolation(await mesure(JEUX, { detectors: true, premiseCap: false, guard: true }), 'strict+garde');
});

// ---- le serveur livré (evaluate) : mêmes entrées, intention absente / type seul / type + détails
const RANK = { info: 0, ok: 0, warn: 1, critical: 2 };
const CHOICE = { pay_someone: 'pay', connect_or_accept_offer: 'receive', asked_by_someone: 'asked', buy_or_swap: 'swap' };
const HEX20 = /^0x[0-9a-fA-F]{40}$/;
function bodyOf(c, withType, withDetails) {
  const k = c.context || {};
  let origin = typeof k.origin === 'string' ? k.origin : undefined;
  if (origin && !/^[a-z][a-z0-9+.-]*:/i.test(origin)) origin = 'https://' + origin;
  const body = { method: c.request.method, params: c.request.params, origin, chainId: k.chainId, from: typeof k.victim === 'string' ? k.victim : k.victim && k.victim.address };
  if (withType && CHOICE[c.intent.kind]) {
    body.intent = CHOICE[c.intent.kind];
    if (withDetails) body.intent_details = { token: c.intent.token, amount: c.intent.amount, receiveToken: c.intent.receiveToken, counterpartyLabel: c.intent.counterpartyLabel, counterpartyAddress: c.intent.counterpartyAddress };
  }
  const local = {
    contacts: (Array.isArray(k.address_book) ? k.address_book : []).filter((b) => b && HEX20.test(String(b.address))).map((b) => ({ address: b.address.toLowerCase(), label: String(b.label || '') })),
    history: (Array.isArray(k.history) ? k.history : []).filter((h) => h && HEX20.test(String(h.address))), protected: [], knownSpenders: [],
  };
  return { body, local };
}
test('serveur evaluate : sans intention <= type seul <= type + détails, sur un échantillon de DEV / public / V2_DEV', () => {
  let n = 0;
  for (const f of JEUX) {
    const lines = readFileSync(join(ROOT, f), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
    const step = Math.max(1, Math.floor(lines.length / 120));
    for (let i = 0; i < lines.length; i += step) {
      let c; try { c = normalizeCase(JSON.parse(lines[i])); } catch { continue; }
      if (!c.request || !c.intent || !CHOICE[c.intent.kind]) continue;
      const lv = (typed, det) => { const { body, local } = bodyOf(c, typed, det); const r = evaluate(body, local); return RANK[r.niveau] ?? 1; };
      const a = lv(false, false), b = lv(true, false), d = lv(true, true);
      assert.ok(b >= a, `${c.id} : le type seul baisse le verdict (${a} -> ${b})`);
      assert.ok(d >= b, `${c.id} : les détails baissent le verdict (${b} -> ${d})`);
      n++;
    }
  }
  assert.ok(n > 250, `échantillon trop petit (${n})`);
});

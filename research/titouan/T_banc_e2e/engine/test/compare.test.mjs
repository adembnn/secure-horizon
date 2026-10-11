import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runScenarios } from './scenarios.mjs';
import { compare } from '../vendor/compare.ts';
import { writeFileSync, mkdirSync } from 'node:fs';

const rows = runScenarios();
mkdirSync(new URL('../out/', import.meta.url), { recursive: true });
writeFileSync(new URL('../out/compare_table.json', import.meta.url), JSON.stringify(rows, null, 1));
const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

test('le comparateur d\'Adem (vendor, Node 24 type-stripping) s\'exécute sur 30 scénarios', () => {
  assert.equal(rows.length, 30);
  for (const r of rows) assert.ok(['ok', 'warn', 'critical'].includes(r.adem));
});
// Une ligne = un test : le verdict est consigné (voir out/compare_table.json et run_compare.mjs pour le tableau PASS/FAIL).
for (const r of rows) test(`${r.id} ${r.desc} -> Adem=${r.adem} (${r.ademPass ? 'PASS' : 'FAIL'} vs ${r.expected}) | combiné=${r.combined} (${r.combinedPass ? 'PASS' : 'FAIL'})`, () => {
  assert.ok(['ok', 'warn', 'critical'].includes(r.ours));
  assert.ok(['ok', 'warn', 'critical'].includes(r.adem));
});
test('divergence : Adem manque contrôle, delegatecall, opaque, SIWE, slippage (S19 S20 S21 S23 S24 S25)', () => {
  for (const id of ['S19', 'S20', 'S21', 'S23', 'S24', 'S25']) { assert.equal(byId[id].ademPass, false, id); assert.equal(byId[id].oursPass, true, id); }
});
test('divergence : Adem seulement warn pour un droit illimité vers un compte externe (S12)', () => {
  assert.equal(byId.S12.adem, 'warn'); assert.equal(byId.S12.ours, 'critical');
});
test('divergence : "contrat jeune" d\'Adem fait un warn sur un transfert légitime (S22) = fatigue', () => {
  assert.equal(byId.S22.adem, 'warn'); assert.equal(byId.S22.ours, 'ok');
});
test('divergence : sosie 3+4 non vu par Adem si le moteur applique 4+4 (S06) ; vu avec notre moteur (S05)', () => {
  assert.equal(byId.S06.adem, 'ok'); assert.equal(byId.S05.adem, 'critical'); assert.equal(byId.S06.ours, 'critical');
});
test('isLookalike() 4+4 de compare.ts n\'est jamais appelée : sosie 4+4 exact sans lookalikeOf = ok', () => {
  const A = '0x1234aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5678', B = '0x1234bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb5678';
  const eff = { chainId: 1, from: '0x' + '11'.repeat(20), kind: 'transaction', outgoing: [{ token: 'USDC', amount: '1', to: B }], incoming: [], approvals: [], counterparties: [{ address: B, isContract: false, firstSeenByUser: false }], raw: {} };
  const it = { kind: 'pay_someone', token: 'USDC', amount: '1', counterpartyLabel: 'x', declaredAt: Date.now() };
  assert.equal(compare(it, eff).level, 'ok');
  assert.equal(compare(it, { ...eff, counterparties: [{ ...eff.counterparties[0], lookalikeOf: A }] }).level, 'critical');
});
test('seuil "contrat jeune" d\'Adem = 50 blocs : âge 49 -> warn, 50 -> ok (quelle que soit la chaîne)', () => {
  const eff = (age) => ({ chainId: 43114, from: '0x' + '11'.repeat(20), kind: 'transaction', outgoing: [], incoming: [], approvals: [], counterparties: [{ address: '0x' + '22'.repeat(20), isContract: true, ageBlocks: age, firstSeenByUser: false }], raw: {} });
  const it = { kind: 'connect_or_accept_offer', declaredAt: Date.now() };
  assert.equal(compare(it, eff(49)).level, 'warn'); assert.equal(compare(it, eff(50)).level, 'ok');
  assert.equal(compare(it, eff(50400)).level, 'ok'); // 7 jours Ethereum = seuil de nos mesures (bench) : 50 400 blocs
});
test('tableau PASS/FAIL : Adem seul entre 18 et 24 PASS sur 30 ; combiné >= 27', () => {
  const a = rows.filter((r) => r.ademPass).length, c = rows.filter((r) => r.combinedPass).length;
  assert.ok(a >= 18 && a <= 24, 'adem pass ' + a); assert.ok(c >= 27, 'combiné ' + c);
});

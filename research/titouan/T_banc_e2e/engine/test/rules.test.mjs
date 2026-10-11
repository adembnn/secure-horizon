import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchLens, lookalikeMatch, POISON } from '../src/rules.mjs';
import { an, call, USDC, USER, OTHER, NOW, has, codes } from './helpers.mjs';

const BASE = '0x9a8b7c6d5e4f30211203f4e5d6c7b8a9908a7b6c';
// fabrique une adresse avec exactement p hex de préfixe et s hex de suffixe communs avec BASE
function exact(p, s) {
  const hex = BASE.slice(2).split('');
  const out = hex.slice(0, p).concat(Array(40 - p - s).fill('f'), hex.slice(40 - s));
  if (out[p] === hex[p]) out[p] = out[p] === 'a' ? 'b' : 'a';
  if (out[39 - s] === hex[39 - s]) out[39 - s] = out[39 - s] === 'a' ? 'b' : 'a';
  return '0x' + out.join('');
}

test('matchLens : préfixe et suffixe exacts', () => {
  const m = matchLens(exact(3, 4), BASE); assert.equal(m.prefix, 3); assert.equal(m.suffix, 4);
  const n = matchLens(exact(5, 6), BASE); assert.equal(n.prefix, 5); assert.equal(n.suffix, 6);
});
const H = [{ address: BASE, ts: NOW - 500, direction: 'out' }];
for (const [p, s, exp] of [[2, 4, false], [3, 3, false], [3, 4, true], [4, 4, true], [3, 8, true], [6, 3, false], [8, 8, true], [1, 1, false]])
  test(`sosie préfixe ${p} / suffixe ${s} : ${exp ? 'détecté' : 'non détecté'} (seuil 3/4)`, () => {
    assert.equal(!!lookalikeMatch(exact(p, s), H, NOW), exp);
  });
test('adresse identique : jamais un sosie', () => assert.equal(lookalikeMatch(BASE, H, NOW), null));
test('casse mixte ignorée', () => assert.ok(lookalikeMatch(exact(3, 4).toUpperCase().replace('0X', '0x'), H, NOW)));
test('fenêtre : sosie apparu 10 min après l\'activité de A = poisoning', () => {
  const d = exact(3, 4);
  const m = lookalikeMatch(d, [{ address: BASE, ts: NOW - 5000, direction: 'out' }, { address: d, ts: NOW - 5000 + 600, direction: 'in' }], NOW);
  assert.equal(m.level, 'poisoning');
});
test('fenêtre : sosie apparu 2 h après = lookalike seulement', () => {
  const d = exact(3, 4);
  const m = lookalikeMatch(d, [{ address: BASE, ts: NOW - 20000, direction: 'out' }, { address: d, ts: NOW - 20000 + 7200, direction: 'in' }], NOW);
  assert.equal(m.level, 'lookalike');
});
test('fenêtre : sosie apparu AVANT A (ordre inverse) = lookalike', () => {
  const d = exact(3, 4);
  assert.equal(lookalikeMatch(d, [{ address: BASE, ts: NOW - 100 }, { address: d, ts: NOW - 500 }], NOW).level, 'lookalike');
});
test('poussière marquée dust = poisoning même sans horodatage', () => {
  const d = exact(3, 4);
  assert.equal(lookalikeMatch(d, [{ address: BASE }, { address: d, dust: true, direction: 'in' }], NOW).level, 'poisoning');
});
test('paramètres USENIX par défaut : 3 / 4 / 1200 s', () => assert.deepEqual(POISON, { prefix: 3, suffix: 4, windowSec: 1200 }));
test('moteur : paiement vers sosie jamais payé = critical address_poisoning, lookalikeOf renseigné', () => {
  const d = exact(3, 4);
  const e = an(USDC, call('transfer(address to,uint256 amount)', [d, 5n]), 0n, { history: [{ address: BASE, ts: NOW - 700, direction: 'out' }, { address: d, ts: NOW - 100, direction: 'in', dust: true }] });
  assert.ok(has(e, 'address_poisoning')); assert.equal(e.level, 'critical'); assert.equal(e.counterparties[0].lookalikeOf, BASE); assert.equal(e.counterparties[0].firstSeenByUser, true);
});
test('moteur : sosie déjà payé auparavant par l\'utilisateur = warn (pas critical)', () => {
  const d = exact(3, 4);
  const e = an(USDC, call('transfer(address to,uint256 amount)', [d, 5n]), 0n, { history: [{ address: BASE, ts: NOW - 99999, direction: 'out' }, { address: d, ts: NOW - 99000, direction: 'out' }] });
  assert.equal(e.risk_flags.find((f) => /poisoning|lookalike/.test(f.code)).severity, 'warn');
});
test('moteur : sosie du carnet d\'adresses (contacts)', () => {
  const e = an(USDC, call('transfer(address to,uint256 amount)', [exact(4, 4), 5n]), 0n, { contacts: [{ address: BASE }] });
  assert.ok(has(e, 'lookalike_address'));
});
test('taux de collision aléatoire 3+4 : au plus 1 faux sosie sur 2 000 000 de paires (théorie 3,7e-9 par paire)', () => {
  let state = 7n; const M = (1n << 64n) - 1n;
  const rnd = () => (state = (state * 6364136223846793005n + 1442695040888963407n) & M);
  const rh = () => { let s = ''; for (let i = 0; i < 40; i++) s += Number((rnd() >> 33n) & 15n).toString(16); return '0x' + s; };
  const hist = Array.from({ length: 100 }, () => ({ address: rh() }));
  let hits = 0;
  for (let i = 0; i < 20000; i++) if (lookalikeMatch(rh(), hist, NOW)) hits++;
  assert.ok(hits <= 1, 'faux sosies: ' + hits);
});
test('droit illimité vers contrat connu = warn ; vers EOA = critical (spender externe)', () => {
  const ap = call('approve(address spender,uint256 amount)', [OTHER, (1n << 256n) - 1n]);
  assert.equal(an(USDC, ap, 0n, { knownSpenders: [OTHER], codeOf: () => true }).level, 'warn');
  assert.equal(an(USDC, ap, 0n, { codeOf: () => false }).level, 'critical');
});

test('slippage > 5 % avec un oracle de prix fourni (ctx.expectedOut) : warn ; 3 % : rien', () => {
  const sw = (min) => call('swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [10n ** 18n, min, ['0x' + 'aa'.repeat(20), '0x' + 'bb'.repeat(20)], USER, BigInt(NOW)]);
  const ctx = { expectedOut: () => 1000n * 10n ** 15n };
  const bad = an(OTHER, sw(900n * 10n ** 15n), 0n, ctx); assert.ok(has(bad, 'slippage_high')); assert.equal(bad.risk_flags.find((f) => f.code === 'slippage_high').slippagePct, 10);
  assert.ok(!has(an(OTHER, sw(970n * 10n ** 15n), 0n, ctx), 'slippage_high'));
  assert.ok(!has(an(OTHER, sw(950n * 10n ** 15n), 0n, ctx), 'slippage_high'), 'exactement 5 % : pas au-dessus du seuil');
});
test('sans oracle ni paire stable : slippage non évaluable (seulement minimum = 0 détecté)', () => {
  const e = an(OTHER, call('swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)', [10n ** 18n, 1n, ['0x' + 'aa'.repeat(20), '0x' + 'bb'.repeat(20)], USER, BigInt(NOW)]));
  assert.ok(!has(e, 'slippage_high') && !has(e, 'slippage_unbounded'));
});

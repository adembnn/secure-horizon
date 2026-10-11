// "donner à X le droit d'utiliser 250 USDC" est un droit donné, pas un paiement (défaut mesuré par pipeline/grille). Règle générale, pas une liste.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './fake_chrome.mjs';
const I = await load('intent_text.js');
test('giving a right is not paying someone', async () => {
  for (const t of ['Donner à Uniswap le droit d’utiliser 250 USDC', 'donner à Uniswap l’accès à 250 USDC', 'Donne le droit à Aave de prendre 100 DAI', 'give Uniswap permission to use 250 USDC', 'grant Aave the right to spend 5 DAI', 'accorder à Uniswap l’autorisation de dépenser 50 USDC']) {
    const r = await I.keywordClassify(t);
    assert.notEqual(r.kind, 'pay_someone', t); assert.equal(r.facts.grant, 1, t); assert.ok(!('giveRight' in r.facts));
  }
});
test('paying someone is still paying someone', async () => {
  for (const t of ['donner 20 USDC à Paul', 'donne à Paul 20 USDC', 'donner à Maman 50 USDC pour son droit d’entrée', 'envoyer 20 USDC à 0x' + 'b2'.repeat(20)]) {
    const r = await I.keywordClassify(t); assert.equal(r.kind, 'pay_someone', t); assert.equal(r.facts.grant, 0, t);
  }
});

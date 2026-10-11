// F34 : effet lu par ABI publique. Tests unitaires + garde « zéro violation » sur le trafic réel C-Chain (et Ethereum si l'échantillon est présent).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { analyzeTransaction } from '../src/engine.mjs';
import { applyExtraRules } from '../src/rules_extra.mjs';
import { call, USER, ATTACKER, USDC, WETH, CTX } from './helpers.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { applyPolicy } = await import(pathToFileURL(join(ROOT, 'run', 'policy.mjs')).href);
const UNKNOWN = '0x9999999999999999999999999999999999999999';

function run(to, data, value = 0n, off = false) {
  const tx = { from: USER, to, data, value: '0x' + BigInt(value).toString(16), chainId: '0x1' };
  const req = { method: 'eth_sendTransaction', params: [tx] };
  const c = { ...CTX, knownSpenders: [], ...(off ? { _noF34: true } : {}) };
  const eff = analyzeTransaction(tx, c);
  applyExtraRules(eff, req, c);
  const pol = applyPolicy({ eff, adem: null, ctx: c, intent: null, request: req });
  return { eff, level: pol.level };
}
const V3 = 'exactInputSingle((address tokenIn,address tokenOut,int24 tickSpacing,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)';
const swap = (rcpt, min = 1000n) => call(V3, [[USDC, WETH, 60, rcpt, 1900000000, 5000000n, min, 0n]]);

test('F34 : swap vers soi-même, minimum non nul, cible inconnue : opacité levée, drapeau info, aucun drapeau d\'alerte', () => {
  const off = run(UNKNOWN, swap(USER), 0n, true), on = run(UNKNOWN, swap(USER));
  assert.equal(off.level, 'warn'); assert.ok(off.eff.opaque);
  assert.equal(on.eff.opaque, false);
  assert.ok(on.eff.risk_flags.some((f) => f.code === 'effect_decoded_limited' && f.severity === 'info'));
  assert.equal(on.eff.effectLimited.verified, false);
  assert.ok(!on.eff.risk_flags.some((f) => f.severity !== 'info'));
});
test('F34 : swap vers un TIERS reste opaque (je n\'ai pas pu vérifier)', () => {
  const r = run(UNKNOWN, swap(ATTACKER)); assert.ok(r.eff.opaque); assert.equal(r.level, 'warn');
});
test('F34 : minimum reçu nul, valeur native jointe : restent opaques', () => {
  assert.ok(run(UNKNOWN, swap(USER, 0n)).eff.opaque);
  assert.ok(run(UNKNOWN, swap(USER), 10n ** 18n).eff.opaque);
});
test('F34 : fonctions qui engagent des fonds (dépôt ERC-4626, stake, mint payant) ne sont PAS lues', () => {
  assert.ok(run(UNKNOWN, call('deposit(uint256 assets,address receiver)', [10n ** 9n, USER])).eff.opaque);
  assert.ok(run(UNKNOWN, call('stake(uint256 amount)', [10n ** 9n])).eff.opaque);
  assert.ok(run(UNKNOWN, call('mint(uint256 n)', [1n]), 10n ** 17n).eff.opaque);
});
test('F34 : claim() et retrait ERC-4626 vers soi sont lus ; retrait vers un tiers non', () => {
  assert.equal(run(UNKNOWN, call('claim()', [])).eff.opaque, false);
  assert.equal(run(UNKNOWN, call('withdraw(uint256 assets,address receiver,address owner)', [5n, USER, USER])).eff.opaque, false);
  assert.ok(run(UNKNOWN, call('withdraw(uint256 assets,address receiver,address owner)', [5n, ATTACKER, USER])).eff.opaque);
});
test('F34 : multicall lu seulement si TOUS les sous-appels le sont', () => {
  const mc = (inner) => call('multicall(bytes[] data)', [inner]);
  assert.equal(run(UNKNOWN, mc([swap(USER), call('claim()', [])])).eff.opaque, false);
  assert.ok(run(UNKNOWN, mc([swap(USER), call('unknownThing(uint256 x)', [1n])])).eff.opaque);
  assert.ok(run(UNKNOWN, mc([swap(USER), swap(ATTACKER)])).eff.opaque);
});
test('F34 : un droit illimité ou un transfert de propriété gardent leur niveau critical', () => {
  assert.equal(run(UNKNOWN, call('approve(address spender,uint256 amount)', [ATTACKER, (1n << 256n) - 1n])).level, 'critical');
  assert.equal(run(UNKNOWN, call('transferOwnership(address newOwner)', [ATTACKER])).level, 'critical');
});
test('F34 : un appel mal formé reste opaque', () => {
  assert.ok(run(UNKNOWN, swap(USER).slice(0, 200)).eff.opaque);
});

// ---- zéro violation sur le trafic réel : aucun rouge ne descend, aucun orange avec preuve d'effet ne descend, aucun vert apparu sans drapeau de lecture limitée.
function avantApres(file, chainId, take) {
  let txs = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  if (take) txs = txs.slice(0, take);
  const viol = { rouge_descend: 0, orange_preuve_descend: 0, vert_sans_drapeau: 0 }; let lifted = 0;
  for (const t of txs) {
    const req = { method: 'eth_sendTransaction', params: [{ from: t.from, to: t.to, data: t.input, value: t.value, chainId: '0x' + chainId.toString(16) }] };
    const one = (off) => {
      const ctx = { chainId, from: t.from.toLowerCase(), now: t.ts, ...(off ? { _noF34: true } : {}) };
      const eff = analyzeTransaction(req.params[0], ctx); applyExtraRules(eff, req, ctx);
      const pol = applyPolicy({ eff, adem: null, ctx, intent: null, request: req });
      const evidence = eff.risk_flags.some((f) => f.severity !== 'info' && !['unknown_selector', 'opaque'].includes(f.code));
      return { level: pol.level, evidence, limited: eff.risk_flags.some((f) => f.code === 'effect_decoded_limited') };
    };
    const a = one(true), b = one(false);
    if (a.level === 'critical' && b.level !== 'critical') viol.rouge_descend++;
    else if (a.level === 'warn' && a.evidence && b.level !== 'warn' && b.level !== 'critical') viol.orange_preuve_descend++;
    if (b.level === 'ok' && a.level !== 'ok' && !b.limited) viol.vert_sans_drapeau++;
    if (a.level === 'warn' && !a.evidence && b.level === 'ok') lifted++;
  }
  return { n: txs.length, viol, lifted };
}
const ZERO = { rouge_descend: 0, orange_preuve_descend: 0, vert_sans_drapeau: 0 };
test('trafic réel C-Chain (6 325 tx) : zéro violation, des avertissements d\'opacité sont levés', () => {
  const f = join(ROOT, '..', 'bench', 'data', 'cchain_sample.jsonl');
  if (!existsSync(f)) return;
  const r = avantApres(f, 43114);
  assert.deepEqual(r.viol, ZERO);
  assert.ok(r.lifted > 50, 'lifted=' + r.lifted);
});
test('trafic réel Ethereum (6 000 premières tx de l\'échantillon, si présent) : zéro violation', () => {
  const f = join(ROOT, 'realtraffic', 'cache_', 'eth_sample.jsonl');
  if (!existsSync(f)) return;
  assert.deepEqual(avantApres(f, 1, 6000).viol, ZERO);
});

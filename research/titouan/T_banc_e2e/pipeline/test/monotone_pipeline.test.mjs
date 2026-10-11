// node --test pipeline/test/monotone_pipeline.test.mjs
// Preuve automatisée de la règle stricte : la couche du produit (détecteurs, faits lus, liste de protocoles, intention) ne peut qu'AGGRAVER un verdict.
// Aucun cas ne descend sous server.evaluate seul, et la couche ne produit jamais `ok` quand le serveur seul n'est pas `ok`.
// Jeux de réglage seulement (1 cas sur HOLDUP_STRICT_STEP, défaut 4 ; HOLDUP_STRICT_STEP=1 pour tout rejouer). Jamais V2_TEST ni attacks/TEST.jsonl.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readCases, runCase, D } from '../measure.mjs';
import { makeEvaluatePlus, benchLevel } from '../evaluate_plus.mjs';

const RK = { ok: 0, unknown: 0.5, warn: 1, critical: 2 };
const STEP = Math.max(1, Number(process.env.HOLDUP_STRICT_STEP) || 4);
const files = [join(ROOT, 'redteam', 'V2_DEV_norm.jsonl'), ...readdirSync(join(ROOT, 'redteam')).filter((f) => /^jury_.*\.jsonl$/.test(f)).map((f) => join(ROOT, 'redteam', f)),
  join(ROOT, 'attacks', 'DEV.jsonl'), join(ROOT, 'attacks_public', 'PUBLIC.jsonl')];
for (const f of files) assert.ok(!/V2_TEST|attacks[\\/]TEST/i.test(f));
const cases = files.flatMap((f) => readCases(f).filter((x, i) => x.c && i % STEP === 0));
const refMode = (m) => (m.includes('+known') || m === 'full' ? 'product+known' : 'product');

async function replay(modes) {
  const bad = []; let n = 0, okByLayer = 0, raised = 0;
  for (const { c, id } of cases) {
    if (!c.request || typeof c.request !== 'object') continue;
    const refs = {};
    for (const m of modes) {
      const rm = refMode(m); refs[rm] ??= (await runCase(c, rm).catch(() => ({ level: 'unknown' }))).level;
      const strict = refs.product ??= (await runCase(c, 'product').catch(() => ({ level: 'unknown' }))).level;
      const r = await runCase(c, m); n++;
      if (RK[r.level] < RK[refs[rm]]) bad.push(`${id} ${m} : serveur seul ${refs[rm]}, plus ${r.level}`);
      if (!m.includes('+known') && m !== 'full' && RK[r.level] < RK[strict]) bad.push(`${id} ${m} : sous le serveur seul sans liste (${strict} > ${r.level})`);
      if (r.level === 'ok' && refs[rm] !== 'ok') okByLayer++;
      if (RK[r.level] > RK[refs[rm]]) raised++;
    }
  }
  return { bad, n, okByLayer, raised };
}

test('aucun cas ne descend sous le serveur seul (detectors, live, intention + liste du cas, full) ; `ok` produit par la couche = 0', async () => {
  const r = await replay(['detectors', 'live', 'detectors+known+intent+premise', 'full']);
  assert.ok(r.n > 1000, 'échantillon trop petit : ' + r.n);
  assert.deepEqual(r.bad.slice(0, 10), []);
  assert.equal(r.okByLayer, 0);
  assert.ok(r.raised > 0, 'la couche doit encore relever des cas');
});

test('même chose avec les corrections `lower` rendues au banc (HOLDUP_BENCH_LOWER=1) : evaluatePlus les ignore', async () => {
  process.env.HOLDUP_BENCH_LOWER = '1';
  try { const r = await replay(['detectors', 'live']); assert.deepEqual(r.bad.slice(0, 10), []); assert.equal(r.okByLayer, 0); }
  finally { delete process.env.HOLDUP_BENCH_LOWER; }
});

// ---------------------------------------------------------------- cas synthétiques des chemins qui baissaient (voir pipeline_audit/AUDIT.md section 5)
const V = '0x1111111111111111111111111111111111111111';
const Y = '0xAbCd1234567890aBcDef1234567890aBCdEf9876', X = '0xAbCd12' + '0'.repeat(28) + 'Ef9876';
const hex = (n) => '0x' + BigInt(n).toString(16);
const pad = (h) => h.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const send = (to, wei, extra = {}) => ({ method: 'eth_sendTransaction', params: [{ from: V, to, value: hex(wei), data: '0x', chainId: '0xa86a' }], origin: 'https://app.example', chainId: 43114, from: V, ...extra });
const floor = (b, l) => RK[benchLevel(D.evaluate(JSON.parse(JSON.stringify(b)), { contacts: [], history: [], protected: [], knownSpenders: [], ...l }))];
const ep = makeEvaluatePlus(D);

test('A1 dust_guard : contact réel + sosie poussière, avec le drapeau du banc, le niveau reste celui du serveur seul (pas de `ok`)', async () => {
  process.env.HOLDUP_BENCH_LOWER = '1';
  try {
    const local = { contacts: [{ address: Y.toLowerCase(), label: 'Paul' }], history: [{ address: X.toLowerCase(), direction: 'entrée', amount: '0.001', minutes_ago: 120 }] };
    const b = send(Y, 10n ** 17n, { intent: 'pay' });
    const v = await ep(b, local, { live: null });
    assert.ok(RK[benchLevel(v)] >= floor(b, local)); assert.notEqual(benchLevel(v), 'ok'); assert.equal(v.plus.loweredBy.length, 0);
    const w = await makeEvaluatePlus({ ...D, DETECTORS: [{ id: 'w', run: () => ({ flags: [{ code: 'x', severity: 'warn', detail: 'un autre détecteur' }] }) }, ...D.DETECTORS.filter((d) => d.id === 'dust_guard')] })(b, local, { live: null });
    assert.ok(RK[benchLevel(w)] >= Math.max(1, floor(b, local)), 'un warn levé par un autre détecteur ne doit pas être effacé');
  } finally { delete process.env.HOLDUP_BENCH_LOWER; }
});

test('A2 intent_guard : « 1,000 » tapé, 1000 envoyés : jamais baissé (lecture la plus petite), ni au produit ni au banc', async () => {
  const { amountReadings } = await import('../../detectors_adem/intent_guard.mjs');
  assert.deepEqual(amountReadings('1,000').sort((a, b) => a - b), [1, 1000]);
  for (const flag of [undefined, '1']) {
    if (flag) process.env.HOLDUP_BENCH_LOWER = flag;
    try {
      const local = { contacts: [{ address: Y.toLowerCase(), label: 'Paul' }], history: [] };
      const b = send(Y, 1000n * 10n ** 18n);
      const v = await ep(b, local, { live: null, intent: { kind: 'pay_someone', amount: '1,000', token: 'AVAX', counterpartyLabel: 'Paul', declaredAt: Date.now() } });
      assert.ok(RK[benchLevel(v)] >= floor(b, local)); assert.equal(v.plus.loweredBy.length, 0);
      const ig = D.DETECTORS.find((d) => d.id === 'intent_guard');
      assert.equal(ig.id, 'intent_guard');
    } finally { delete process.env.HOLDUP_BENCH_LOWER; }
  }
});

test('B extra.origin / extra.token_registry / extra.nft / extra.balances ne viennent jamais de la page : rejetés ; le corps de requête ne les lit pas', async () => {
  const b = { ...send(Y, 10n ** 17n), extra: { origin: 'https://x.example', nft: { collection: Y } }, token_registry: [{ address: Y, symbol: 'USDC', decimals: 6 }], balances: { [V]: '1' }, known_protocols: [Y], live: { isContract: { [Y]: true } } };
  const clean = { ...b }; for (const k of ['extra', 'token_registry', 'balances', 'known_protocols', 'live']) delete clean[k];
  const a = await ep(b, undefined, { live: null }), c = await ep(clean, undefined, { live: null });
  assert.equal(benchLevel(a), benchLevel(c)); assert.deepEqual(a.codes, c.codes);
  for (const k of ['body.extra', 'body.token_registry', 'body.balances', 'body.known_protocols', 'body.live']) assert.ok(a.plus.rejectedInputs.includes(k), k);
  // les clés d'`extra` d'un client non banc : origin, nft, token_registry, balances sont retirées
  const v = await ep(clean, undefined, { live: { isContract: {}, ageBlocks: {}, balances: {}, tokenMeta: {}, facts: {}, tokenInfo: {}, allowances: {}, missing: [], source: 'provider', extra: { origin: 'x', token_registry: [], nft: {}, balances: {}, quote: {} } } });
  for (const k of ['extra.origin', 'extra.token_registry', 'extra.nft', 'extra.balances']) assert.ok(v.plus.rejectedInputs.includes(k), k);
  assert.ok(!v.plus.rejectedInputs.includes('extra.quote'));
});

test('B/C faits et liste connue : approve illimité à un routeur de la liste reste au niveau du serveur seul (jamais `ok`)', async () => {
  const kp = (await import('node:fs')).readFileSync(join(ROOT, 'pipeline', 'known_protocols.json'), 'utf8');
  const router = JSON.parse(kp)['43114'].find((e) => /UniversalRouter/.test(e.name)).address;
  const USDC = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';
  const b = { method: 'eth_sendTransaction', params: [{ from: V, to: USDC, data: '0x095ea7b3' + pad(router) + 'f'.repeat(64), value: '0x0', chainId: '0xa86a' }], origin: 'https://app.example', chainId: 43114, from: V };
  const local = { contacts: [], history: [], protected: [], knownSpenders: [] };
  const f = floor(b, local), v = await ep(b, local, { live: null });
  assert.ok(RK[benchLevel(v)] >= f); assert.ok(f > 0 ? benchLevel(v) !== 'ok' : true); assert.equal(v.plus.product, benchLevel(D.evaluate(b, local)));
});

test('intention : le niveau avec intention n\'est jamais sous le niveau sans intention (monotoneGuard branché)', async () => {
  let n = 0;
  for (const { c } of cases.filter((_, i) => i % 5 === 0)) {
    if (!c.request || typeof c.request !== 'object' || !c.intent || !c.intent.kind) continue;
    const a = await runCase(c, 'detectors+intent'), z = await runCase(c, 'detectors'); n++;
    assert.ok(RK[a.level] >= RK[z.level] || a.level === 'critical', `${c.id} : ${z.level} sans intention, ${a.level} avec`);
  }
  assert.ok(n > 50);
});

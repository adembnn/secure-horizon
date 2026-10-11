// node --test pipeline/test/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { makeEvaluatePlus, loadNodeDeps, evaluatePlus, benchLevel, humanize, DETECTOR_FICHE } from '../evaluate_plus.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const D = await loadNodeDeps();
const { keccak256 } = await import(pathToFileURL(join(ROOT, 'engine', 'src', 'keccak.mjs')).href);
const { normalizeCase } = await import(pathToFileURL(join(ROOT, 'redteam', 'normalize_v2.mjs')).href);
const RK = { ok: 0, unknown: 0.5, warn: 1, critical: 2 };
const word = (h) => h.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const ME = '0x' + '1a'.repeat(20), STRANGER = '0x' + '7c'.repeat(20), USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const LOCAL = { contacts: [], history: [], protected: [], knownSpenders: [] };
const approve = { method: 'eth_sendTransaction', params: [{ from: ME, to: USDC, data: '0x095ea7b3' + word(STRANGER) + 'f'.repeat(64), value: '0x0' }], origin: 'https://exemple.test', chainId: '0x1', from: ME };
const plainSend = { method: 'eth_sendTransaction', params: [{ from: ME, to: STRANGER, value: '0xde0b6b3a7640000', data: '0x' }], origin: 'https://exemple.test', chainId: '0x1', from: ME };
const setOwner = { method: 'eth_sendTransaction', params: [{ from: ME, to: '0x' + '5e'.repeat(20), data: keccak256('nominateNewOwner(address)').slice(0, 10) + word(STRANGER), value: '0x0' }], origin: 'https://exemple.test', chainId: '0x1', from: ME };

// existing cases only (no generated attack) : a slice of each replay file
function sample(file, n) {
  const lines = readFileSync(join(ROOT, 'redteam', file), 'utf8').split(/\r?\n/).filter((l) => l.trim());
  const step = Math.max(1, Math.floor(lines.length / n)); const out = [];
  for (let i = 0; i < lines.length && out.length < n; i += step) out.push(normalizeCase(JSON.parse(lines[i])));
  return out;
}
function input(c) {
  const k = c.context || {}; let origin = typeof k.origin === 'string' ? k.origin : undefined; if (origin && !/^[a-z][a-z0-9+.-]*:/i.test(origin)) origin = 'https://' + origin;
  return { body: { method: c.request.method, params: c.request.params, origin, chainId: k.chainId, from: k.victim },
    local: { contacts: (k.address_book || []).map((b) => ({ address: b.address.toLowerCase(), label: String(b.label || '') })), history: (k.history || []).filter((h) => /^0x[0-9a-fA-F]{40}$/.test(String(h.address))), protected: [], knownSpenders: [] } };
}
const CASES = [...sample('jury_fp.jsonl', 60), ...sample('jury_fuzz_control.jsonl', 40), ...sample('jury_fuzz_sig.jsonl', 40), ...sample('jury_defi.jsonl', 30), ...sample('V2_DEV_norm.jsonl', 150)];

test('same shape as evaluate, plus the `plus` block', async () => {
  const p = D.evaluate(approve, LOCAL), v = await evaluatePlus(approve, LOCAL, { live: null });
  for (const k of Object.keys(p)) assert.ok(k in v, 'champ manquant : ' + k);
  for (const k of ['path', 'level', 'base', 'product', 'raisedBy', 'loweredBy', 'facts', 'missingFacts', 'ms', 'errors']) assert.ok(k in v.plus, 'plus.' + k);
  assert.deepEqual(v.plus.missingFacts, ['live_context_absent']);
  for (const k of ['croit', 'reel', 'danger', 'action']) assert.equal(typeof v.texts[k], 'string');
});

test('raise-only : without any new fact the verdict is never below the product (320 replayed cases)', async () => {
  const run = makeEvaluatePlus(D); let raised = 0;
  for (const c of CASES) {
    const { body, local } = input(c);
    const p = benchLevel(D.evaluate(body, local)); const v = await run(body, local, { live: null, knownProtocols: false });
    assert.ok(RK[benchLevel(v)] >= RK[p], `${c.id} : produit ${p}, plus ${benchLevel(v)}`);
    assert.equal(v.plus.base, p, `${c.id} : la chaine rejouee (${v.plus.base}) doit valoir le verdict du produit (${p}) quand aucun fait n'est ajoute`);
    if (RK[benchLevel(v)] > RK[p]) raised++;
  }
  assert.ok(raised > 0, 'au moins un cas doit etre releve par un detecteur');
});

test('unknown facts never lower : an empty live answer changes nothing', async () => {
  const run = makeEvaluatePlus(D);
  const empty = { isContract: {}, ageBlocks: {}, balances: {}, tokenMeta: {}, facts: {}, tokenInfo: {}, allowances: {}, missing: ['isContract:' + STRANGER, 'age:' + STRANGER, 'signer.nativeBalance'], source: 'provider' };
  for (const c of CASES.slice(0, 160)) {
    const { body, local } = input(c);
    const a = await run(body, local, { live: null, knownProtocols: false }), b = await run(body, local, { live: empty, knownProtocols: false }), b2 = await run(body, local, { live: { ...empty, source: undefined }, knownProtocols: false });
    assert.equal(benchLevel(b2), benchLevel(a), c.id + " (faits vides, sans table de reference)");
    // the only thing an empty answer switches on is the engine's own reference-token table (static, public) : a detector may then stop flagging a reference token
    if (benchLevel(b) !== benchLevel(a)) assert.ok(a.plus.raisedBy.length && RK[benchLevel(b)] >= RK[b.plus.base] && RK[b.plus.base] >= RK[b.plus.product], c.id);
    assert.ok(RK[benchLevel(b)] >= RK[b.plus.product], c.id);
    assert.equal(b.plus.relaxedByFacts, false);
    assert.equal(b.plus.missingFacts.length, 3);
  }
});

test('a detector that raises brings a plain French reason, and no detector id reaches the user', async () => {
  const p = D.evaluate(setOwner, LOCAL), v = await evaluatePlus(setOwner, LOCAL, { live: null });
  assert.notEqual(benchLevel(p), 'critical');
  assert.equal(v.level, 'danger'); assert.equal(v.niveau, 'critical'); assert.equal(v.fiche, 'F07');
  assert.equal(v.plus.raisedBy[0].code, 'control_change_by_shape');
  assert.match(v.texts.reel, /pouvoir de contrôle/); assert.match(v.texts.reel, /inconnu de toi/);
  assert.equal(v.real.amount, v.texts.reel); assert.ok(v.title && v.lead);
  const shown = JSON.stringify([v.texts, v.reasons, v.title, v.said, v.real, v.lead, v.plus.raisedBy]);
  for (const d of D.DETECTORS) assert.ok(!shown.includes(d.id), 'identifiant de detecteur visible : ' + d.id);
  assert.ok(!/0x[0-9a-f]{40}/i.test(v.texts.reel), 'adresse complete dans le texte');
  for (const code of Object.keys(DETECTOR_FICHE)) { const t = DETECTOR_FICHE[code]; assert.ok(t[0] === '~' || D.fiches[t], 'fiche inconnue pour ' + code); }
  assert.equal(humanize('[mode=context] vous cédez vos jetons à 0x' + 'ab'.repeat(20)), 'Tu cèdes tes jetons à 0xabab…abab.');
});

test('a detector that crashes or hangs does not change the verdict', async () => {
  const boom = { id: 'boom', run() { throw new Error('kaboom'); } };
  const slow = { id: 'slow', run: () => new Promise(() => {}) };
  const run = makeEvaluatePlus({ ...D, DETECTORS: [boom, slow, ...D.DETECTORS] });
  const t0 = performance.now();
  const v = await run(setOwner, LOCAL, { live: null, detectorTimeoutMs: 60 });
  assert.ok(performance.now() - t0 < 1000);
  assert.equal(v.level, 'danger'); // the real detectors still ran
  assert.equal(v.plus.errors.length, 2);
  const w = await makeEvaluatePlus({ ...D, DETECTORS: [boom] })(approve, LOCAL, { live: null });
  assert.equal(benchLevel(w), benchLevel(D.evaluate(approve, LOCAL)));
});

test('internal error : falls back to the product verdict, never to green', async () => {
  const p = D.evaluate(approve, LOCAL);
  const broken = makeEvaluatePlus({ ...D, applyPolicy() { throw new Error('policy down'); } });
  const v = await broken(approve, LOCAL, { live: null });
  assert.equal(v.level, p.level); assert.equal(v.niveau, p.niveau); assert.ok(v.plus.errors.length >= 1);
  const broken2 = makeEvaluatePlus({ ...D, present() { throw new Error('render down'); } });
  const w = await broken2(setOwner, LOCAL, { live: null });
  assert.equal(w.plus.path, 'fallback'); assert.equal(w.level, D.evaluate(setOwner, LOCAL).level);
  const dead = makeEvaluatePlus({ ...D, evaluate() { throw new Error('product down'); }, E: null });
  const x = await dead(plainSend, LOCAL, { live: null });
  assert.equal(x.level, 'unknown'); assert.equal(x.niveau, 'warn'); assert.equal(x.fiche, 'F25');
});

test('timeout path : a silent RPC does not block the verdict beyond the budget', async () => {
  const run = makeEvaluatePlus(D);
  const t0 = performance.now();
  const v = await run(approve, LOCAL, { live: () => new Promise(() => {}), budgetMs: 80 });
  const dt = performance.now() - t0;
  assert.ok(dt < 800, 'trop long : ' + dt);
  assert.deepEqual(v.plus.missingFacts, ['live_context_timeout']);
  assert.ok(v.plus.notVerified); assert.equal(v.context_live, false);
  assert.ok(RK[benchLevel(v)] >= RK[benchLevel(D.evaluate(approve, LOCAL))]);
  const failing = await run(approve, LOCAL, { live: async () => { throw new Error('rpc down'); }, budgetMs: 80 });
  assert.deepEqual(failing.plus.missingFacts, ['live_context_failed']);
  // a provider-shaped module that answers nothing in time (its own budget) : facts unknown, listed
  const provider = { liveEngineContext: async () => ({ engine: { isContract: {}, ageBlocks: {}, balances: {}, tokenMeta: {}, facts: {}, tokenInfo: {}, allowances: {}, missing: ['live_context_absent'] } }) };
  const u = await run(approve, LOCAL, { live: provider });
  assert.deepEqual(u.plus.missingFacts, ['live_context_absent']); assert.equal(benchLevel(u), benchLevel(v));
});

test('live facts are used : a spender proven to be a one-block-old contract is refused', async () => {
  const sp = STRANGER.toLowerCase();
  const finite = { ...approve, params: [{ ...approve.params[0], data: '0x095ea7b3' + word(STRANGER) + word('0x5f5e100') }] };
  const before = await evaluatePlus(finite, LOCAL, { live: null });
  const after = await evaluatePlus(finite, LOCAL, { live: { isContract: { [sp]: true }, ageBlocks: { [sp]: 1 }, facts: { [sp]: { isContract: true, ageBlocks: 1 } }, missing: [], source: 'provider' } });
  assert.ok(RK[benchLevel(after)] >= RK[benchLevel(before)]);
  assert.equal(benchLevel(after), 'critical');
  assert.equal(after.context_live, true); assert.deepEqual(after.plus.facts.ageBlocks, { [sp]: 1 });
});

test('a detector lower correction is never applied : the level stays at the server alone, the correction is only reported', async () => {
  const lower = { id: 'fix', run: () => ({ lower: { to: 'ok', why: 'correction documentée' } }) };
  const crit = { id: 'crit', run: () => ({ flags: [{ code: 'lookalike_of_known', severity: 'critical', detail: 'destinataire imite un contact' }] }) };
  const pApprove = benchLevel(D.evaluate(approve, LOCAL));
  assert.ok(RK[pApprove] > 0, 'le cas de test doit être au moins orange pour le serveur seul');
  const a = await makeEvaluatePlus({ ...D, DETECTORS: [lower] })(approve, LOCAL, { live: null });
  assert.equal(benchLevel(a), pApprove); assert.equal(a.plus.loweredBy.length, 0); assert.equal(a.plus.lowerIgnored.length, 1);
  const b = await makeEvaluatePlus({ ...D, DETECTORS: [lower, crit] })(plainSend, LOCAL, { live: null });
  assert.equal(benchLevel(b), 'critical'); assert.equal(b.plus.loweredBy.length, 0); assert.equal(b.fiche, 'F13');
});

test('switches : HOLDUP_PLUS=0 gives the product verdict, detectors:false too', async () => {
  const p = D.evaluate(setOwner, LOCAL);
  const off = await evaluatePlus(setOwner, LOCAL, { live: null, detectors: false });
  assert.equal(off.level, p.level); assert.equal(off.plus.raisedBy.length, 0);
  process.env.HOLDUP_PLUS = '0';
  try { const v = await evaluatePlus(setOwner, LOCAL); assert.equal(v.level, p.level); assert.equal(v.plus.path, 'off'); } finally { delete process.env.HOLDUP_PLUS; }
});

test('the shipped server answers POST /check through evaluatePlus and journals the path (server_integration.diff, applied by its owner in 5c1df06)', async (t) => {
  const src = readFileSync(join(ROOT, 'server', 'server.mjs'), 'utf8');
  if (!/evaluate_plus.mjs/.test(src)) return t.skip('server.mjs ne branche pas pipeline/evaluate_plus.mjs : appliquer pipeline/server_integration.diff');
  const S = await import(pathToFileURL(join(ROOT, 'server', 'server.mjs')).href);
  const dir = mkdtempSync(join(tmpdir(), 'holdup-pipeline-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  assert.equal(S.evaluate(setOwner, LOCAL).level, D.evaluate(setOwner, LOCAL).level); // evaluate still exported, same signature
  const jf = join(dir, 'journal.jsonl');
  const s = await S.createHoldUpServer({ port: 0, journalFile: jf, local: LOCAL });
  try {
    const res = await fetch(`http://127.0.0.1:${s.port}/check`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(setOwner) });
    const v = await res.json();
    assert.equal(v.level, 'danger'); assert.equal(v.plus.raisedBy[0].code, 'control_change_by_shape');
    const last = JSON.parse(readFileSync(jf, 'utf8').trim().split(String.fromCharCode(10)).pop());
    assert.match(last.entry.voie, /^plus:/);
  } finally { await s.close(); }
});

test('invariant : a declared kind without details never lowers the verdict (320 replayed cases x 4 answers)', async () => {
  const run = makeEvaluatePlus(D); let n = 0;
  for (const c of CASES) {
    const { body, local } = input(c);
    const none = benchLevel(await run(body, local, { live: null }));
    for (const choice of ['pay', 'receive', 'login', 'asked']) {
      const v = await run({ ...body, intent: choice }, local, { live: null }); n++;
      assert.ok(RK[benchLevel(v)] >= RK[none], `${c.id} : sans intention ${none}, avec « ${choice} » ${benchLevel(v)}`);
    }
  }
  assert.equal(n, CASES.length * 4);
});

test('invariant : a vague text or a genre alone, given as an Intent object, never lowers the verdict (320 replayed cases, with and without facts)', async () => {
  // counter-example found by pipeline/measure_vague.mjs : { kind: 'buy_or_swap' } alone removed kind_missing_unvouched_recipient and signed_right_not_intended
  const run = makeEvaluatePlus(D); let n = 0;
  const KINDS = ['pay_someone', 'send_to_my_account', 'buy_or_swap', 'connect_or_accept_offer', 'asked_by_someone'];
  const VAGUE = [{}, { freeText: 'ok' }, { freeText: 'valider' }, { freeText: 'je sais pas' }, { freeText: 'faire la transaction' }, { freeText: 'continuer' }];
  const empty = { isContract: {}, ageBlocks: {}, balances: {}, tokenMeta: {}, facts: {}, tokenInfo: {}, allowances: {}, missing: [], source: 'provider' };
  for (const c of CASES) {
    const { body, local } = input(c);
    for (const live of [null, empty]) {
      const none = benchLevel(await run(body, local, { live, classifier: false }));
      for (const intent of [...VAGUE, ...KINDS.map((kind) => ({ kind }))]) {
        const v = await run(body, local, { live, classifier: false, intent }); n++;
        assert.ok(RK[benchLevel(v)] >= RK[none], `${c.id} : sans intention ${none}, avec ${JSON.stringify(intent)} ${benchLevel(v)}`);
      }
    }
  }
  assert.equal(n, CASES.length * 2 * 11);
});

test('known_protocols.json : every entry has a primary source, and the list is given to the product and to the detectors', async () => {
  const kp = JSON.parse(readFileSync(join(ROOT, 'pipeline', 'known_protocols.json'), 'utf8'));
  let n = 0;
  for (const [chain, list] of Object.entries(kp)) { if (!Array.isArray(list)) continue; for (const e of list) { n++; assert.match(e.address, /^0x[0-9a-fA-F]{40}$/); assert.match(e.source, /^https:\/\//); assert.ok(e.name && e.why, chain); } }
  assert.ok(n >= 5);
  const pool = kp['43114'][0].address;
  const req = { method: 'eth_sendTransaction', params: [{ from: ME, to: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48A6E', data: '0x095ea7b3' + word(pool) + word('0x2faf080'), value: '0x0' }], origin: 'https://exemple.test', chainId: '0xa86a', from: ME };
  const withList = await evaluatePlus(req, LOCAL, { live: null }), without = await evaluatePlus(req, LOCAL, { live: null, knownProtocols: false });
  assert.equal(benchLevel(withList), benchLevel(without)); assert.equal(withList.plus.product, benchLevel(D.evaluate(req, LOCAL))); // the list never changes the floor
  assert.notEqual(benchLevel(withList), 'critical');
});

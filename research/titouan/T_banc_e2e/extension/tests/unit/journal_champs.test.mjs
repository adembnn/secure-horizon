// Journal chaîné, champs by / limited / rules (format 2) : présents, protégés par le hachage, anciennes lignes toujours valides,
// ni phrase ni adresse complète. Faux chrome, aucun réseau.
// Run : node --test extension/tests/unit/journal_champs.test.mjs
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeChrome, fakeClock, load } from './fake_chrome.mjs';

const C = await load('journal_chain.js');
const { createGatekeeper } = await load('gatekeeper.js');
const clone = (x) => JSON.parse(JSON.stringify(x));

// ---------------------------------------------------------------------------------------------- the module alone
test('a new line carries by, rules and (only when limited) limited ; all three are in the hash', async () => {
  const F = makeChrome(); const st = F.chrome.storage.local;
  await C.chainAppend(st, { type: 'decision', decision: 'confirm', by: 'human', origin: 'https://a.example', ts: 1, limited: { symbol: 'USDC', amount: '50' } }, '0.4.0', C.rulesTag('0.4.0', 'abcdef012345'));
  await C.chainAppend(st, { type: 'decision', decision: 'confirm', by: 'auto', origin: 'https://a.example', ts: 2 }, '0.4.0');
  await C.chainAppend(st, { type: 'revocation', decision: 'submitted', origin: 'https://a.example', ts: 3 }, '0.4.0');
  const chain = (await st.get('chain')).chain;
  const [a, b, c] = chain.entries;
  assert.equal(a.by, 'humain'); assert.equal(a.limited, 'USDC:50'); assert.equal(a.rules, '0.4.0+abcdef012345');
  assert.equal(b.by, 'auto'); assert.ok(!('limited' in b)); assert.equal(b.rules, '0.4.0', 'no fingerprint given : the build version alone');
  assert.equal(c.by, 'holdup');
  assert.equal((await C.verifyChain(chain)).ok, true);
  for (const [k, val] of [['by', 'humain'], ['by', 'holdup'], ['limited', 'USDC:5000'], ['rules', '0.4.0+000000000000']]) {
    const t = clone(chain); t.entries[1][k] = val;
    const r = await C.verifyChain(t); assert.equal(r.ok, false, k + ' changed must break the chain'); assert.match(r.problems.join(' '), /n° 2.*modifiée/);
  }
  const strip = clone(chain); delete strip.entries[0].by; delete strip.entries[0].limited; delete strip.entries[0].rules;
  assert.equal((await C.verifyChain(strip)).ok, false, 'removing the three fields (to look like an old line) is seen');
});
test('old lines (format 1, without by/limited/rules) still verify, alone and followed by new lines ; adding a field to them is seen', async () => {
  const old = []; let prev = C.GENESIS;
  for (let i = 1; i <= 3; i++) {
    const c = { t: i, o: 'old.example', type: 'decision', m: 'eth_sendTransaction', l: 'attention', c: [], d: 'confirm', v: '0.2.0' };
    const e = Object.assign({ n: i }, c, { prev, hash: await C.sha256(prev + JSON.stringify([i, c.t, c.o, c.type, c.m, c.l, c.c, c.d, c.v])) });
    old.push(e); prev = e.hash;
  }
  assert.equal((await C.verifyChain({ anchor: null, entries: old })).ok, true);
  const F = makeChrome(); const st = F.chrome.storage.local;
  await st.set({ chain: { anchor: null, entries: clone(old) } });
  await C.chainAppend(st, { type: 'decision', decision: 'cancel', by: 'human', origin: 'https://new.example', ts: 9 }, '0.4.0');
  const mixed = (await st.get('chain')).chain;
  assert.equal(mixed.entries[3].by, 'humain'); assert.equal((await C.verifyChain(mixed)).ok, true, 'old then new : one chain');
  const t = clone(mixed); t.entries[1].by = 'auto';
  assert.equal((await C.verifyChain(t)).ok, false);
});
test('by : who decided, from the line itself', () => {
  const by = (e) => C.byOf(e);
  assert.equal(by({ type: 'decision', decision: 'confirm', by: 'human' }), 'humain');
  assert.equal(by({ type: 'decision', decision: 'confirm', by: 'auto' }), 'auto', 'the window going on by itself is not a person');
  assert.equal(by({ type: 'decision', decision: 'confirm', by: 'auto-test' }), 'auto');
  assert.equal(by({ type: 'decision', decision: 'same_intent' }), 'auto', 'second request of an operation already covered');
  assert.equal(by({ type: 'decision', decision: 'answer' }), 'humain');
  assert.equal(by({ type: 'decision', decision: 'cancel', by: 'expired' }), 'auto');
  assert.equal(by({ type: 'decision', decision: 'cancel', by: 'window-closed' }), 'humain');
  assert.equal(by({ type: 'revocation' }), 'holdup');
  assert.equal(by({ type: 'verdict', limited: { symbol: 'USDC', amount: 50 } }), 'holdup');
  assert.equal(by({ type: 'verdict' }), 'auto');
  assert.equal(by({ type: 'decision', by: 'human', actor: 'auto' }), 'auto', 'an explicit actor wins');
  assert.equal(by({ type: 'decision', actor: 'root' }), 'humain', 'an unknown actor is ignored');
});
test('limited and rules never carry an address or a sentence', async () => {
  const ADDR = '0x' + 'a1'.repeat(20);
  assert.equal(C.limitedOf({ symbol: 'USDC', amount: 50 }), 'USDC:50');
  assert.equal(C.limitedOf('USDC:50'), 'USDC:50');
  for (const bad of [{ symbol: ADDR, amount: 1 }, { symbol: 'USDC', amount: ADDR }, 'payer 50 USDC à ' + ADDR, 'USDC:' + 'f'.repeat(30), { symbol: 'US DC', amount: 5 }, 12, null])
    assert.equal(C.limitedOf(bad), '', JSON.stringify(bad));
  assert.equal(C.rulesTag('0.4.0', ADDR), '0.4.0'); assert.equal(C.rulesTag('0.4.0', 'ABCDEF012345'), '0.4.0', 'lower-case hex only');
  const F = makeChrome(); const st = F.chrome.storage.local;
  await C.chainAppend(st, { type: 'decision', decision: 'confirm', by: 'human', origin: 'https://x.example', ts: 1, text: 'payer 50 USDC à ' + ADDR, limited: { symbol: ADDR, amount: 1 } }, '0.4.0', 'r ' + ADDR);
  const s = JSON.stringify((await st.get('chain')).chain).toLowerCase();
  assert.ok(!s.includes('a1a1a1a1a1') && !s.includes('payer'));
  const e = (await st.get('chain')).chain.entries[0]; assert.ok(!('limited' in e)); assert.equal(e.rules, '0.4.0');
});

// ---------------------------------------------------------------------------------------------- through the gatekeeper
const SITE = 'https://echange.exemple.org', TAB = 71;
const ME = '0x' + 'a1'.repeat(20), TOKEN = '0x' + 'c3'.repeat(20), ROUTER = '0x' + 'd4'.repeat(20);
const pad = (x) => (typeof x === 'bigint' ? x.toString(16) : String(x).replace(/^0x/, '')).padStart(64, '0');
const U = 10n ** 6n, MAX = 2n ** 256n - 1n;
const approve = (amount) => ({ method: 'eth_sendTransaction', params: [{ from: ME, to: TOKEN, data: '0x095ea7b3' + pad(ROUTER) + pad(amount) }], chainId: '0xa86a', from: ME });
const abiString = (s) => '0x' + pad(32n) + pad(BigInt(s.length)) + Buffer.from(s).toString('hex').padEnd(64, '0');
const SAID = 'échanger 50 USDC contre AVAX';
let F, clock, n = 0;
beforeEach(() => { clock = fakeClock(); F = makeChrome(); globalThis.chrome = F.chrome; F.chrome.runtime.getManifest = () => ({ version: '9.9.9' }); });
afterEach(() => { clock.restore(); delete globalThis.chrome; });
function worker(opts = {}) {
  F.state.local.contexte = { knownSpenders: [ROUTER] };
  F.chrome.tabs.sendMessage = async (tabId, msg) => {
    if (msg.type !== 'hu.rpc') return undefined;
    const { data } = msg.params[0] || {};
    if (typeof data !== 'string') return { ok: false };
    if (data.startsWith('0x95d89b41')) return { ok: true, result: abiString('USDC') };
    if (data.startsWith('0x313ce567')) return { ok: true, result: '0x' + pad(6n) };
    return { ok: false };
  };
  const base = { texts: { reel: 'Ligne du moteur.' }, reasons: [], risk_signals: [] };
  createGatekeeper(Object.assign({ closeMs: 0, check: async (body) => {
    const d = String(body.params && body.params[0] && body.params[0].data || '');
    if (d.startsWith('0x095ea7b3') && d.endsWith('f'.repeat(64))) return { ...base, level: 'danger', codes: ['unlimited_allowance'], effects: { grants_right: true, funds_out: false } };
    return { ...base, level: 'attention', effects: { grants_right: d.startsWith('0x095ea7b3'), funds_out: false } };
  } }, opts));
}
const recOf = (rid) => F.state.session['hu:req:' + rid];
async function gate(payload, tab = TAB) {
  const rid = 'rid-chp-' + String(++n).padStart(6, '0'), page = F.page(tab, SITE, 0);
  await F.send({ type: 'gate', rid, payload: Object.assign({ kind: 'gate' }, payload) }, page);
  const win = () => F.win(recOf(rid) ? recOf(rid).windowId : -1, rid);
  const view = async () => (await F.send({ type: 'hu.view', rid }, win())).view;
  return {
    rid,
    write: async (text) => { clock.advance(1000); const v = await view(); return F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'answer', text }, win()); },
    go: async (auto) => { clock.advance(1000); const v = await view(); return F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'continue', phraseOk: true, auto }, win()); },
    cancel: async () => { const v = await view(); return F.send({ type: 'hu.decision', rid, seq: v.seq, decision: 'cancel' }, win()); }
  };
}
const chain = () => F.state.local.chain;

test('gatekeeper : the window going on by itself is "auto", a click is "humain", the limited right is "USDC:50" ; rules = version + fingerprint', async () => {
  worker({ rulesFingerprint: '0123456789ab' });
  const a = await gate(approve(MAX)); await a.write(SAID); assert.equal((await a.go(true)).status, 'allow');
  const b = await gate(approve(50n * U), TAB + 1); await b.write(SAID); assert.equal((await b.go(false)).status, 'allow');
  const c = await gate(approve(50n * U), TAB + 2); await c.write(SAID); await c.cancel();
  const ch = chain(); const confirms = ch.entries.filter((e) => e.type === 'decision' && e.d === 'confirm');
  assert.equal(confirms.length, 2);
  assert.equal(confirms[0].by, 'auto', 'not a human confirmation'); assert.equal(confirms[0].limited, 'USDC:50');
  assert.equal(confirms[1].by, 'humain'); assert.ok(!('limited' in confirms[1]));
  assert.ok(ch.entries.some((e) => e.type === 'verdict' && e.limited === 'USDC:50' && e.by === 'holdup'), 'the verdict where Hold up limited the right');
  assert.ok(ch.entries.some((e) => e.type === 'decision' && e.d === 'cancel' && e.by === 'humain'));
  assert.ok(ch.entries.every((e) => e.rules === '9.9.9+0123456789ab' && typeof e.by === 'string'));
  const s = JSON.stringify(ch).toLowerCase();
  for (const x of [ME, TOKEN, ROUTER]) assert.ok(!s.includes(x.slice(2, 22)), 'no address');
  assert.ok(!s.includes('échanger'), 'no sentence');
  assert.equal((await C.verifyChain(ch)).ok, true);
  // the offline tool shows the new fields, and a changed `by` breaks the chain
  const dir = mkdtempSync(join(tmpdir(), 'holdup-chp-'));
  const good = join(dir, 'ok.json'); writeFileSync(good, C.exportChain(ch));
  const t = clone(ch); const i = t.entries.findIndex((e) => e.d === 'confirm' && e.by === 'auto'); t.entries[i].by = 'humain';
  const bad = join(dir, 'bad.json'); writeFileSync(bad, C.exportChain(t));
  const tool = fileURLToPath(new URL('../../tools/verify_journal.mjs', import.meta.url));
  const run = (f) => spawnSync(process.execPath, ['--no-warnings', tool, f], { encoding: 'utf8' });
  const g = run(good), r = run(bad);
  assert.equal(g.status, 0, g.stdout + g.stderr); assert.match(g.stdout, /Qui : .*humain/); assert.match(g.stdout, /auto/);
  assert.match(g.stdout, /USDC:50/); assert.match(g.stdout, /Règles : 9\.9\.9\+0123456789ab/);
  assert.equal(r.status, 1); assert.match(r.stdout, /modifiée/);
});
test('gatekeeper : the second request of an operation already covered is "auto" ; no fingerprint = rules is the version', async () => {
  worker({ rulesFingerprint: null });
  const a = await gate(approve(50n * U)); await a.write(SAID); await a.go(true);
  clock.advance(3000);
  await gate(approve(50n * U));
  const same = chain().entries.filter((e) => e.d === 'same_intent');
  assert.equal(same.length, 1); assert.equal(same[0].by, 'auto');
  assert.ok(chain().entries.every((e) => e.rules === '9.9.9'));
  assert.equal((await C.verifyChain(chain())).ok, true);
});
test('gatekeeper : by default, rules = build version + the RULES_FINGERPRINT embedded in journal_chain.js', async () => {
  assert.match(C.RULES_FINGERPRINT, /^[0-9a-f]{12}$/); assert.ok(C.RULES_FILES > 10);
  worker();
  const a = await gate(approve(50n * U)); await a.write(SAID); await a.cancel();
  assert.ok(chain().entries.length >= 2 && chain().entries.every((e) => e.rules === '9.9.9+' + C.RULES_FINGERPRINT));
});

// ---------------------------------------------------------------------------------------------- the fingerprint generator
test('gen_rules_fingerprint : stable when nothing changes, changes when a rule file changes (temporary copy), line endings ignored', async () => {
  const G = await import(new URL('../../tools/gen_rules_fingerprint.mjs', import.meta.url).href);
  const here = fileURLToPath(new URL('../../..', import.meta.url)); // T_banc_e2e
  const files = G.rulesFiles(here);
  for (const f of ['engine/src/engine.mjs', 'run/policy.mjs', 'extension/written_check.js', 'extension/intent_text.js']) assert.ok(files.includes(f), f);
  assert.ok(!files.includes('engine/src/rpc.mjs') && !files.includes('extension/journal_chain.js'));
  assert.equal(G.computeFingerprint(here).fingerprint, C.RULES_FINGERPRINT, 'the embedded value is up to date : run node extension/tools/gen_rules_fingerprint.mjs');
  const tmp = mkdtempSync(join(tmpdir(), 'holdup-rules-'));
  for (const f of files.concat(['extension/journal_chain.js'])) { mkdirSync(dirname(join(tmp, f)), { recursive: true }); copyFileSync(join(here, f), join(tmp, f)); }
  const r0 = G.computeFingerprint(tmp);
  assert.equal(r0.fingerprint, C.RULES_FINGERPRINT); assert.equal(G.computeFingerprint(tmp).fingerprint, r0.fingerprint, 'stable');
  const crlf = join(tmp, 'run/policy.mjs'); const lf = readFileSync(crlf, 'utf8').replace(/\r\n/g, '\n');
  writeFileSync(crlf, lf.replace(/\n/g, '\r\n')); assert.equal(G.computeFingerprint(tmp).fingerprint, r0.fingerprint, 'CRLF or LF : same fingerprint');
  writeFileSync(crlf, lf + '\n// une règle changée\n');
  const r1 = G.computeFingerprint(tmp); assert.notEqual(r1.fingerprint, r0.fingerprint); assert.match(r1.fingerprint, /^[0-9a-f]{12}$/);
  // the generator rewrites only the marked line of journal_chain.js in the copy, and the copy then exports the new value
  G.writeFingerprint(tmp);
  const text = readFileSync(join(tmp, 'extension/journal_chain.js'), 'utf8');
  assert.ok(text.includes("export const RULES_FINGERPRINT = '" + r1.fingerprint + "'"));
  assert.equal(text.replace(r1.fingerprint, C.RULES_FINGERPRINT), readFileSync(join(here, 'extension/journal_chain.js'), 'utf8'), 'nothing else changed');
  assert.equal(G.computeFingerprint(tmp).fingerprint, r1.fingerprint, 'fixed point : journal_chain.js is not a rule file');
});

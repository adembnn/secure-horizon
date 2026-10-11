// node --test research/demo_reelle/reponse/test/matrix.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MATRIX, LEVELS, respond, familyOf } from '../matrix.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..');
const BANC = join(REPO, 'research', 'titouan', 'T_banc_e2e');

test('every fiche of the product texts has exactly one family', () => {
  const fiches = JSON.parse(readFileSync(join(BANC, '..', 'U_textes_utilisateur.json'), 'utf8')).fiches.map((f) => f.id);
  const count = Object.fromEntries(fiches.map((id) => [id, 0]));
  for (const f of Object.values(MATRIX.families)) for (const id of f.fiches) { assert.ok(id in count, `${id} is not a product fiche`); count[id]++; }
  for (const [id, n] of Object.entries(count)) assert.equal(n, 1, `${id} is in ${n} families`);
});

test('the response is graded : wait never decreases with the level, on both doors', () => {
  const sorted = [...LEVELS].sort((a, b) => MATRIX.levels[a].rank - MATRIX.levels[b].rank);
  assert.deepEqual(sorted, ['attention', 'unknown', 'danger', 'manipulation']);
  for (const door of ['extension', 'rpc']) for (let i = 1; i < sorted.length; i++) assert.ok(MATRIX.levels[sorted[i]].wait_s[door] >= MATRIX.levels[sorted[i - 1]].wait_s[door]);
});

test('there is no "ok" level and an unknown level is refused, never softened', () => {
  assert.ok(!LEVELS.includes('ok') && !LEVELS.includes('safe'));
  assert.throws(() => respond({ level: 'ok', door: 'rpc' }), /unknown level/);
  assert.throws(() => respond({ level: 'danger', door: 'mobile' }), /unknown door/);
  assert.throws(() => respond({ level: 'danger', door: 'rpc', decision: 'shrug' }), /unknown decision/);
});

test('the waits in the matrix are the running defaults of the RPC guard', async () => {
  const P = await import(pathToFileURL(join(REPO, 'research', 'demo_reelle', 'rpc_garde', 'proxy.mjs')).href);
  const saved = {}; for (const k of Object.keys(process.env).filter((k) => k.startsWith('HOLDUP_WAIT_'))) { saved[k] = process.env[k]; delete process.env[k]; }
  const cfg = P.loadConfig({});
  Object.assign(process.env, saved);
  for (const l of LEVELS) assert.equal(cfg.wait[l], MATRIX.levels[l].wait_s.rpc, `rpc wait for ${l}`);
  assert.equal(cfg.holdTtlMs, 1800 * 1000);
});

test('the waits in the matrix are the defaults of the extension', () => {
  const src = readFileSync(join(BANC, 'extension', 'gatekeeper.js'), 'utf8');
  assert.match(src, new RegExp(`dangerWaitMs:\\s*${MATRIX.levels.danger.wait_s.extension * 1000}\\b`));
  assert.match(src, new RegExp(`manipulationHoldMs:\\s*${MATRIX.levels.manipulation.wait_s.extension * 1000}\\b`));
  assert.match(src, /decision: 'call_trusted'/);
  // hold_core.js decides phrase and wait per level : the matrix must say the same
  const core = readFileSync(join(BANC, 'extension', 'hold_core.js'), 'utf8');
  assert.ok(core.includes("level === 'manipulation') return { phrase: false, waitMs: clamp(cfg.manipulationHoldMs"));
  assert.ok(core.includes("level === 'danger' || level === 'unknown') return { phrase: true, waitMs: clamp(cfg.dangerWaitMs"));
  assert.ok(core.includes('return { phrase: false, waitMs: 0 }'));
  assert.deepEqual(LEVELS.map((l) => [MATRIX.levels[l].phrase, MATRIX.levels[l].wait_s.extension]), [[false, 0], [true, 30], [true, 30], [false, 600]]);
});

test('after a cancel : nothing to do on chain, the incident record is the only tool', () => {
  const p = respond({ level: 'danger', fiche: 'F01', door: 'extension', decision: 'cancel' });
  assert.equal(p.outcome, 'cancelled'); assert.equal(p.family, 'spending_right'); assert.equal(p.tool, 'incident');
  assert.deepEqual(p.cannot_undo, []); assert.equal(p.wait_s, 30); assert.equal(p.phrase, true);
});

test('after a signature : revoke for rights, nothing promised for a transfer', () => {
  const a = respond({ level: 'danger', fiche: 'F03', door: 'rpc', decision: 'continue' });
  assert.equal(a.outcome, 'signed'); assert.equal(a.tool, 'revoke'); assert.ok(a.cannot_undo.length); assert.equal(a.phrase, false); assert.equal(a.caveat, null);
  const b = respond({ level: 'danger', fiche: 'F13', door: 'rpc', decision: 'continue' });
  assert.equal(b.tool, null); assert.match(b.cannot_undo.join(' '), /définitif/);
  const c = respond({ level: 'danger', fiche: 'F02', door: 'extension', decision: 'confirm' });
  assert.equal(c.family, 'offchain_signature'); assert.match(c.caveat, /pas qu'elle a signé/);
});

test('manipulation is always the pressure family and nobody is told automatically', () => {
  const p = respond({ level: 'manipulation', fiche: 'F01', door: 'extension' });
  assert.equal(p.family, 'pressure'); assert.equal(p.outcome, 'pending'); assert.equal(p.wait_s, 600); assert.equal(p.phrase, false);
  assert.deepEqual(p.told.map((t) => t.who), ['user', 'trusted_contact_if_user_calls']);
  for (const l of LEVELS) assert.equal(respond({ level: l, door: 'rpc' }).told[0].who, 'user');
  assert.match(p.not_told, /Aucun envoi automatique/);
});

test('a verdict without fiche is classified from its effects', () => {
  assert.equal(familyOf({ fiche: null, effects: { grants_right: true } }), 'spending_right');
  assert.equal(familyOf({ fiche: null, effects: { funds_out: true } }), 'recipient');
  assert.equal(familyOf({}), 'unverified');
});

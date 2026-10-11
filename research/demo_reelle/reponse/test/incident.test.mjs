// node --test research/demo_reelle/reponse/test/incident.test.mjs
// The extension-door journal is written by the REAL server (createHoldUpServer, POST /check then POST /log) ;
// the RPC-door journal is written with the real makeJournal and the entry shapes of rpc_garde/proxy.mjs.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readJournal, listIncidents, buildIncident, redecode, renderHtml, writeIncident, pair, stats } from '../incident.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BANC = resolve(HERE, '..', '..', '..', 'titouan', 'T_banc_e2e');
const S = await import(pathToFileURL(join(BANC, 'server', 'server.mjs')).href);
const tmp = mkdtempSync(join(tmpdir(), 'holdup-incident-'));
const jf = join(tmp, 'verdicts.jsonl');

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', SPENDER = '0x' + 'b7'.repeat(20), VICTIM = '0x' + '1c'.repeat(20);
const approveMax = '0x095ea7b3' + SPENDER.slice(2).padStart(64, '0') + 'f'.repeat(64);
const EVIL = 'https://evil.test/<script>alert(1)</script>';
const request = { method: 'eth_sendTransaction', params: [{ from: VICTIM, to: USDC, data: approveMax, value: '0x0' }], origin: EVIL, chainId: '0x1', from: VICTIM };

let srv, base;
const post = async (path, body) => (await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
before(async () => {
  srv = await S.createHoldUpServer({ port: 0, journalFile: jf, local: { contacts: [], history: [], protected: [], knownSpenders: [] } });
  base = `http://127.0.0.1:${srv.port}`;
});
after(async () => { await srv.close(); });

test('extension door : a cancelled dangerous request becomes an incident record', async (t) => {
  const v = await post('/check', request);
  assert.equal(v.level, 'danger', 'the real engine flags an unlimited approval to an unknown spender');
  await new Promise((r) => setTimeout(r, 40));
  await post('/log', { type: 'decision', stage: 'verdict', decision: 'call_trusted', origin: EVIL, method: request.method, level: v.level });
  await post('/log', { type: 'decision', stage: 'verdict', decision: 'cancel', origin: EVIL, method: request.method, level: v.level });

  const journal = readJournal(jf);
  assert.equal(journal.chain.ok, true);
  assert.deepEqual(S.verifyJournal(jf), { ok: true, n: journal.chain.n }, 'same chain check as the product');
  const list = listIncidents(journal.records);
  assert.equal(list.length, 1); assert.equal(list[0].decision, 'cancel'); assert.equal(list[0].door, 'extension');

  const inc = buildIncident(journal, list[0].seq);
  assert.equal(inc.outcome, 'cancelled'); assert.equal(inc.verdict.family, 'spending_right'); assert.equal(inc.response.tool, 'incident');
  assert.ok(inc.verdict.rule_ids.length > 0);
  assert.equal(inc.asked.params_sha256.length, 64);
  // times come from the journal, not from this test
  assert.equal(inc.metrics.time_to_detect_ms, journal.records[0].entry.latency_ms);
  assert.equal(inc.metrics.time_to_respond_ms, Date.parse(journal.records[2].ts) - Date.parse(journal.records[0].ts));
  assert.ok(inc.metrics.time_to_respond_ms >= 40);
  assert.deepEqual(inc.timeline.map((x) => x.what), ['request_received', 'verdict', 'call_trusted_clicked', 'decision']);
  assert.equal(inc.evidence.journal_records.length, 3);
  // no personal data beyond the journal : the victim address and the spender are NOT in the record
  const flat = JSON.stringify(inc).toLowerCase();
  assert.ok(!flat.includes(VICTIM.toLowerCase()) && !flat.includes(SPENDER.toLowerCase()));
  t.diagnostic(`time_to_detect_ms=${inc.metrics.time_to_detect_ms} time_to_respond_ms=${inc.metrics.time_to_respond_ms}`);

  await t.test('HTML : one page, hostile site name escaped, no script, no network', () => {
    const html = renderHtml(inc);
    assert.ok(!html.includes('<script'), 'no script tag at all');
    assert.ok(html.includes('&lt;script&gt;alert(1)'));
    assert.ok(!/(src|href)=/.test(html), 'no external resource');
    assert.match(html, /Ce qu'elle n'établit pas/); assert.match(html, /Non ancrée/);
  });

  await t.test('redecode : accepted only for the journalled parameters', async () => {
    const other = { ...request, params: [{ ...request.params[0], data: approveMax.slice(0, -1) + 'e' }] };
    await assert.rejects(redecode(structuredClone(inc), { request: other }), /sha256 differs/);
    const d = await redecode(structuredClone(inc), { request });
    assert.equal(d.decoded.request_matches_journal, true);
    assert.equal(d.decoded.same_level_as_journal, true);
    assert.ok(d.decoded.really && d.decoded.facts.length > 0);
    assert.ok(renderHtml(d).includes('En vrai'));
  });

  await t.test('files : JSON and HTML written side by side', () => {
    const out = writeIncident(inc, join(tmp, 'out'));
    assert.ok(existsSync(out.html)); assert.equal(JSON.parse(readFileSync(out.json, 'utf8')).id, inc.id);
  });
});

test('extension door : a decision is never borrowed from a later identical request', async () => {
  const f = join(tmp, 'two.jsonl'), j = S.makeJournal(f);
  const e = { type: 'verdict', origin: 'https://a.test', method: 'eth_sendTransaction', level: 'danger', niveau: 'critical', fiche: 'F01', codes: ['unlimited_allowance'], latency_ms: 12.5, params_sha256: 'a'.repeat(64) };
  j.append(e); j.append(e); j.append({ type: 'ext_log', kind: 'decision', origin: 'https://a.test', method: 'eth_sendTransaction', level: 'danger', decision: 'confirm' });
  const { records } = readJournal(f);
  assert.equal(pair(records, 1).decision, null);
  assert.equal(buildIncident(readJournal(f), 1).outcome, 'pending');
  const second = buildIncident(readJournal(f), 2);
  assert.equal(second.outcome, 'signed'); assert.equal(second.response.tool, 'revoke'); assert.ok(second.response.caveat);
});

test('RPC door : hold then cancel, exact pairing by hold id, addresses only because the journal has them', () => {
  const f = join(tmp, 'rpc.jsonl'), j = S.makeJournal(f);
  const common = { tx: '0x' + 'ab'.repeat(32), from: VICTIM, to: SPENDER, chainId: 43113, tx_type: 2, level: 'manipulation', niveau: 'critical', fiche: 'F21', codes: ['asked_by_someone_outgoing'], live: true };
  j.append({ type: 'rpc_verdict', outcome: 'pass', ...common, level: 'attention', tx: '0x' + 'cd'.repeat(32) });
  j.append({ type: 'rpc_verdict', outcome: 'hold', hold: 'h1', wait_s: 600, ...common });
  j.append({ type: 'rpc_verdict', outcome: 'hold', hold: 'h2', wait_s: 30, ...common, level: 'danger', fiche: 'F13' });
  j.append({ type: 'rpc_decision', decision: 'continue', hold: 'h2', tx: common.tx, sent: '0x' + 'ee'.repeat(32), level: 'danger', waited_ms: 31000, intent: null });
  j.append({ type: 'rpc_decision', decision: 'cancel', hold: 'h1', tx: common.tx, level: 'manipulation', waited_ms: 4200, intent: null });
  const journal = readJournal(f);
  assert.deepEqual(listIncidents(journal.records).map((x) => [x.seq, x.decision]), [[2, 'cancel'], [3, 'continue']]);
  const inc = buildIncident(journal, 2);
  assert.equal(inc.door, 'rpc'); assert.equal(inc.outcome, 'cancelled'); assert.equal(inc.verdict.family, 'pressure');
  assert.equal(inc.asked.from, VICTIM); assert.equal(inc.response.friction_wait_s, 600); assert.equal(inc.response.waited_ms, 4200);
  assert.equal(inc.metrics.time_to_detect_ms, null); assert.match(inc.metrics.time_to_detect_note, /not journalled/);
  assert.match(renderHtml(inc), /non mesuré/);
  const signed = buildIncident(journal, 3);
  assert.equal(signed.outcome, 'signed'); assert.equal(signed.response.tool, null); assert.ok(signed.response.cannot_undo.length);
  const st = stats(journal.records);
  assert.deepEqual([st.manipulation.shown, st.manipulation.cancelled, st.manipulation.override_rate], [1, 1, 0]);
  assert.deepEqual([st.danger.signed, st.danger.override_rate, st.danger.median_time_to_detect_ms], [1, 1, null]);
  assert.throws(() => buildIncident(journal, 1), /not a hold/);
  assert.throws(() => buildIncident(journal, 4), /not a verdict/);
});

test('a rewritten journal line is seen and the record says it has no integrity value', () => {
  const f = join(tmp, 'tampered.jsonl');
  const lines = readFileSync(jf, 'utf8').trim().split('\n');
  lines[0] = lines[0].replace('"level":"danger"', '"level":"attention"');
  writeFileSync(f, lines.join('\n') + '\n');
  const journal = readJournal(f);
  assert.equal(journal.chain.ok, false); assert.equal(journal.chain.brokenAt, 1);
  assert.equal(S.verifyJournal(f).ok, false);
  const inc = buildIncident(journal, 1, {});
  assert.match(inc.does_not_prove[0], /rompue/);
  assert.match(renderHtml(inc), /rompue à la ligne 1/);
});

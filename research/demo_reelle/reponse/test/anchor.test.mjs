// node --test research/demo_reelle/reponse/test/anchor.test.mjs      (needs the throwaway node, see chain.mjs)
// Journal written by the real makeJournal -> root (merkle.mjs) -> EvidenceAnchor deployed by `npm run anchor:local`
// -> incident record verified against the chain with an inclusion proof, journal file not needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { RPC, REPO, nodeUp } from './chain.mjs';
import { readJournal, buildIncident } from '../incident.mjs';
import { assertLocalThrowaway, journalRoot, proofFor, deployAnchor, anchorJournal, attachProof, verifyIncident } from '../anchor_evidence.mjs';

const S = await import(pathToFileURL(join(REPO, 'research', 'titouan', 'T_banc_e2e', 'server', 'server.mjs')).href);
const up = await nodeUp();
const opt = { skip: up ? false : `no throwaway node on ${RPC}` };
const tmp = mkdtempSync(join(tmpdir(), 'holdup-anchor-'));

function writeJournal(name, n = 7) {
  const f = join(tmp, name), j = S.makeJournal(f);
  for (let i = 0; i < n; i++) j.append({ type: 'verdict', origin: `https://site${i}.test`, method: 'eth_sendTransaction', level: i === 3 ? 'danger' : 'attention', niveau: i === 3 ? 'critical' : 'warn', fiche: 'F01', codes: ['unlimited_allowance'], latency_ms: 20 + i, params_sha256: String(i).repeat(64) });
  j.append({ type: 'ext_log', kind: 'decision', origin: 'https://site3.test', method: 'eth_sendTransaction', level: 'danger', decision: 'cancel' });
  return f;
}

test('never writes to a public chain or to a shared rehearsal port', () => {
  assert.throws(() => assertLocalThrowaway('https://api.avax-test.network/ext/bc/C/rpc'), /not 127\.0\.0\.1/);
  assert.throws(() => assertLocalThrowaway('http://localhost:8549'), /not 127\.0\.0\.1/);
  assert.throws(() => assertLocalThrowaway('http://127.0.0.1:8545'), /shared rehearsal/);
  assert.ok(assertLocalThrowaway('http://127.0.0.1:8549'));
});

test('root and proofs : odd number of lines, every line provable, broken journal refused', () => {
  const journal = readJournal(writeJournal('odd.jsonl', 6)); // 7 lines
  const r = journalRoot(journal);
  assert.deepEqual([r.from, r.to, r.count], [1, 7, 7]); assert.match(r.root, /^0x[0-9a-f]{64}$/);
  for (const rec of journal.records) assert.equal(proofFor(journal, rec.seq).hash, rec.hash);
  assert.throws(() => journalRoot({ records: journal.records, chain: { ok: false, brokenAt: 2 } }), /refusing to anchor/);
});

test('anchor on the local chain, then verify an incident record against it', opt, async (t) => {
  const jf = writeJournal('j.jsonl');
  const journal = readJournal(jf);
  const contract = deployAnchor(RPC, join(tmp, 'chain'));
  const anchor = await anchorJournal({ journal, rpcUrl: RPC, contract });
  assert.equal(anchor.from_seq, 1); assert.equal(anchor.to_seq, 8); assert.equal(anchor.root, journalRoot(journal).root);

  const inc = attachProof(buildIncident(journal, 4), journal, anchor);
  assert.equal(inc.outcome, 'cancelled'); assert.equal(inc.anchor.proofs.length, 2);
  const flatAnchor = JSON.stringify({ ...inc.anchor, sender: undefined, contract: undefined });
  assert.ok(!flatAnchor.includes('site3.test'), 'no site name in what is anchored');

  const ok = await verifyIncident(inc, { rpcUrl: RPC });
  assert.equal(ok.ok, true, JSON.stringify(ok.checks));
  t.diagnostic(`contract ${contract} tx ${anchor.tx_hash} block ${anchor.block_number} : ${ok.checks.length} checks ok`);

  // a record whose journal line was edited after anchoring is rejected
  const forged = structuredClone(inc); forged.evidence.journal_records[0].entry.level = 'attention';
  const r1 = await verifyIncident(forged, { rpcUrl: RPC });
  assert.equal(r1.ok, false); assert.equal(r1.checks.find((c) => /content matches/.test(c.name)).ok, false);
  // ... even if the forger recomputes the line hash : it is no longer under the root
  const forged2 = structuredClone(forged); const { recordHash } = await import('../incident.mjs');
  forged2.evidence.journal_records[0].hash = recordHash(forged2.evidence.journal_records[0]); forged2.anchor.proofs[0].hash = forged2.evidence.journal_records[0].hash;
  const r2 = await verifyIncident(forged2, { rpcUrl: RPC });
  assert.equal(r2.ok, false); assert.equal(r2.checks.find((c) => /under the root/.test(c.name)).ok, false);
  // a root that is not on chain is rejected
  const forged3 = structuredClone(inc); forged3.anchor.root = '0x' + '11'.repeat(32);
  assert.equal((await verifyIncident(forged3, { rpcUrl: RPC })).ok, false);
  // an unanchored record is "not verified", not an error
  assert.equal((await verifyIncident(buildIncident(journal, 4), { rpcUrl: RPC })).ok, false);

  // a line appended after anchoring cannot ride on the old anchor
  S.makeJournal(jf).append({ type: 'verdict', origin: 'https://late.test', method: 'eth_sendTransaction', level: 'danger', niveau: 'critical', fiche: 'F01', codes: [], latency_ms: 1, params_sha256: 'f'.repeat(64) });
  assert.throws(() => attachProof(buildIncident(readJournal(jf), 9), readJournal(jf), anchor), /outside the anchored interval/);
});

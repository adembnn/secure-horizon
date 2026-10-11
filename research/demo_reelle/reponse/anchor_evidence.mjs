// Hold up - evidence anchoring as the audit trail of the response.
// Takes the product journal (server.mjs / rpc_garde format : sha256 hash chain), computes a Merkle root over
// the record hashes with the EXISTING anchor code (T_banc_e2e/anchor/merkle.mjs), anchors it in the existing
// EvidenceAnchor contract on a LOCAL chain, then proves that the journal lines of one incident record are
// under that root (inclusion proof) and that the root is on chain.
//
//   node anchor_evidence.mjs anchor --journal <file.jsonl> --rpc http://127.0.0.1:8549 --out <dir> [--incident <incident.json>]
//   node anchor_evidence.mjs verify --incident <incident.json> --rpc http://127.0.0.1:8549
//
// WHAT IS ANCHORED : one 32-byte root, the first and last journal sequence numbers, a rule version number.
// No address, no site, no text. The record hashes under the root are sha256 of journal lines.
// NOT DONE : Fuji. It needs a funded test key ; this script refuses anything but 127.0.0.1 and has no key path :
// the transaction is sent by an unlocked account of the local node (eth_sendTransaction).
//
// OBJECTIONS (stated on purpose)
// 1. "Anchoring proves the file existed, not that the alert was right." Correct, and that is all it claims.
// 2. "The owner can anchor a journal she forged before anchoring." Correct : the anchor bounds the time AFTER
//    which nothing changed. Lines written and anchored within minutes leave a short forging window ; lines
//    anchored days later leave a long one. No periodic anchoring is wired in the product today.
// 3. "Two journal formats exist." Correct : anchor/journal.mjs (keccak, canonical JSON, salted effect hash) is
//    NOT the journal the server and the RPC guard write (sha256 chain). No bridge exists. This script anchors
//    the journal the product really writes, and reuses only merkle.mjs, eth.mjs and the contract.
// 4. "ruleVersion is 0." Correct : the product journal has no rule version field yet (MSG-051).
// 5. "A local chain is not an audit trail." Correct : it is a rehearsal of the circuit, nothing more.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readJournal, recordHash } from './incident.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');
const ANCHOR = join(REPO, 'research', 'titouan', 'T_banc_e2e', 'anchor');
const imp = (f) => import(pathToFileURL(join(ANCHOR, f)).href);
const M = await imp('merkle.mjs');
const E = await imp('eth.mjs');

const leaf = (h) => '0x' + h; // sha256 hex of a journal line, used as the 32-byte entry hash of merkle.mjs
export const SHARED_PORTS = new Set(['8545', '8547', '8548', '8555', '8560', '8790', '8791', '8792', '8800', '8801']); // rehearsal services : never written to from here

export function assertLocalThrowaway(rpcUrl) {
  const u = new URL(rpcUrl);
  if (u.hostname !== '127.0.0.1' || u.protocol !== 'http:') throw new Error(`refused : ${u.hostname} is not 127.0.0.1. This script never writes to a public chain.`);
  if (SHARED_PORTS.has(u.port || '80')) throw new Error(`refused : port ${u.port} is a shared rehearsal service. Start a throwaway node on another port.`);
  return u;
}

// Root over the whole journal [first seq .. last seq]. Refuses a broken chain : a broken journal is never anchored.
export function journalRoot(journal) {
  if (!journal.chain.ok) throw new Error(`journal chain broken at line ${journal.chain.brokenAt} : refusing to anchor`);
  if (!journal.records.length) throw new Error('empty journal');
  const hashes = journal.records.map((r) => leaf(r.hash));
  return { root: M.merkleRoot(hashes), from: journal.records[0].seq, to: journal.records[journal.records.length - 1].seq, count: hashes.length };
}
export function proofFor(journal, seq) {
  const pos = journal.records.findIndex((r) => r.seq === seq);
  if (pos < 0) throw new Error(`seq ${seq} not in the journal`);
  const p = M.merkleProof(journal.records.map((r) => leaf(r.hash)), pos);
  return { seq, hash: journal.records[pos].hash, proof: p.proof };
}

// Deploys EvidenceAnchor on the node behind rpcUrl through the existing `npm run anchor:local` (addresses file redirected to outDir).
export function deployAnchor(rpcUrl, outDir) {
  const u = assertLocalThrowaway(rpcUrl);
  mkdirSync(outDir, { recursive: true });
  const r = spawnSync('npm', ['run', 'anchor:local'], { cwd: join(REPO, 'blockchain'), shell: true, encoding: 'utf8', env: { ...process.env, HOLDUP_PORT: u.port, HOLDUP_CHAIN_OUT_DIR: resolve(outDir) } });
  // Success is judged on what the script printed and recorded, not on the exit status alone : under Node 25 on
  // Windows, Hardhat can abort at exit (libuv assertion) AFTER a successful deployment. anchorJournal() then fails
  // loudly if no contract answers at that address.
  const printed = /EvidenceAnchor (0x[0-9a-fA-F]{40})/.exec(r.stdout || '');
  const file = join(outDir, 'addresses.local.json');
  const a = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).anchor : null;
  if (!printed || !a || printed[1] !== a) throw new Error('npm run anchor:local failed : ' + (r.stderr || r.stdout || '').slice(-400));
  return a;
}

async function waitReceipt(rpcUrl, hash) {
  for (let i = 0; i < 100; i++) { const rc = await E.rpc(rpcUrl, 'eth_getTransactionReceipt', [hash]); if (rc) return rc; await new Promise((r) => setTimeout(r, 100)); }
  throw new Error('no receipt for ' + hash);
}

// Sends anchor(root, from, to, ruleVersion) from an unlocked account of the local node. -> anchor info
export async function anchorJournal({ journal, rpcUrl, contract, ruleVersion = 0 }) {
  assertLocalThrowaway(rpcUrl);
  const { root, from, to, count } = journalRoot(journal);
  if ((await E.rpc(rpcUrl, 'eth_getCode', [contract, 'latest'])) === '0x') throw new Error(`no contract at ${contract} on this node`);
  const [sender] = await E.rpc(rpcUrl, 'eth_accounts');
  if (!sender) throw new Error('the node has no unlocked account');
  const tx = await E.rpc(rpcUrl, 'eth_sendTransaction', [{ from: sender, to: contract, data: E.encodeAnchorCall(root, from, to, ruleVersion) }]);
  const rc = await waitReceipt(rpcUrl, tx);
  if (rc.status !== '0x1') throw new Error('anchor transaction reverted');
  const log = E.decodeAnchoredLog(rc.logs[0]);
  return { chain_id: parseInt(await E.rpc(rpcUrl, 'eth_chainId'), 16), local: true, contract, tx_hash: tx, sender, root, from_seq: from, to_seq: to, count, rule_version: ruleVersion, block_number: log.blockNumber, block_time: log.blockTime, block_time_iso: new Date(log.blockTime * 1000).toISOString() };
}

// Adds the anchor and one inclusion proof per journal line to an incident record (mutates and returns it).
export function attachProof(incident, journal, anchor) {
  const seqs = incident.evidence.journal_records.map((r) => r.seq);
  for (const s of seqs) if (s < anchor.from_seq || s > anchor.to_seq) throw new Error(`journal line ${s} is outside the anchored interval [${anchor.from_seq}..${anchor.to_seq}]`);
  incident.anchor = { ...anchor, anchored: 'Merkle root of sha256 journal line hashes. No address, no site, no text goes on chain.', proofs: seqs.map((s) => proofFor(journal, s)) };
  return incident;
}

/**
 * Verifies an incident record WITHOUT the journal : (1) each embedded journal line hashes to its stated hash,
 * (2) each hash is under the root (inclusion proof), (3) that root was emitted by the contract on the chain behind
 * rpcUrl, for the same interval. Read-only. -> { ok, checks[] }
 */
export async function verifyIncident(incident, { rpcUrl, anchors } = {}) {
  const checks = []; const add = (name, ok, detail = '') => { checks.push({ name, ok: !!ok, detail }); return ok; };
  const a = incident.anchor;
  if (!add('incident carries an anchor', !!a, a ? '' : 'not anchored')) return { ok: false, checks };
  for (const r of incident.evidence.journal_records) {
    add(`line ${r.seq} content matches its hash`, recordHash(r) === r.hash);
    const p = a.proofs.find((x) => x.seq === r.seq);
    add(`line ${r.seq} is under the root`, !!p && p.hash === r.hash && M.verifyProof(leaf(r.hash), p.proof, a.root));
  }
  if (!anchors) {
    const V = await imp('verify_anchor.mjs');
    anchors = (await V.fetchAnchors({ contract: a.contract, rpcUrl })).anchors;
  }
  const on = anchors.find((x) => x.root.toLowerCase() === a.root.toLowerCase() && x.fromIndex === a.from_seq && x.toIndex === a.to_seq);
  add('root found on chain for the same interval', !!on, on ? `block ${on.blockNumber}, tx ${on.txHash}` : `${anchors.length} anchor(s) read, none matches`);
  if (on) {
    add('anchor transaction matches', on.txHash.toLowerCase() === a.tx_hash.toLowerCase());
    const last = Math.max(...incident.timeline.map((t) => Date.parse(t.at)));
    add('journal times are not later than the anchoring block', last <= on.blockTime * 1000 + 1000, `last event ${new Date(last).toISOString()}, block ${new Date(on.blockTime * 1000).toISOString()}`);
  }
  return { ok: checks.every((c) => c.ok), checks };
}

const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2], rpcUrl = arg('rpc');
  if (cmd === 'anchor' && arg('journal') && rpcUrl) {
    const out = arg('out') || join(HERE, 'out'), journal = readJournal(arg('journal'));
    const contract = arg('contract') || deployAnchor(rpcUrl, out);
    const anchor = await anchorJournal({ journal, rpcUrl, contract });
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'anchor.json'), JSON.stringify(anchor, null, 2) + '\n');
    console.log(`anchored lines [${anchor.from_seq}..${anchor.to_seq}] root ${anchor.root}\n  contract ${contract} tx ${anchor.tx_hash} block ${anchor.block_number}`);
    if (arg('incident')) {
      const { renderHtml } = await import('./incident.mjs');
      const inc = attachProof(JSON.parse(readFileSync(arg('incident'), 'utf8')), journal, anchor);
      writeFileSync(arg('incident'), JSON.stringify(inc, null, 2) + '\n');
      writeFileSync(arg('incident').replace(/\.json$/, '.html'), renderHtml(inc));
      console.log('  proof attached to ' + arg('incident'));
    }
  } else if (cmd === 'verify' && arg('incident') && rpcUrl) {
    const r = await verifyIncident(JSON.parse(readFileSync(arg('incident'), 'utf8')), { rpcUrl });
    for (const c of r.checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? ' (' + c.detail + ')' : ''}`);
    console.log(r.ok ? 'VERIFIED' : 'NOT VERIFIED');
    process.exitCode = r.ok ? 0 : 1; // not process.exit() : on Windows it aborts (libuv assertion, exit 127) while fetch sockets close
  } else { process.exitCode = 2; console.error('usage: node anchor_evidence.mjs anchor --journal <file> --rpc <url> --out <dir> [--incident <json>] | verify --incident <json> --rpc <url>'); }
}

// Hold up - the whole response side in one run, on a THROWAWAY local node (never a public chain) :
//   cd blockchain && HOLDUP_CHAIN_MODE=plain HOLDUP_PORT=8549 npm run chain:local        (other terminal)
//   node research/demo_reelle/reponse/demo.mjs [--rpc http://127.0.0.1:8549] [--out <dir>]
// Branch A : dangerous request, verdict by the real engine, the user cancels -> incident record.
// Branch B : same request, the user overrides and signs -> the right is live on chain -> revocation built, sent, checked.
// Then the journal is anchored and both records are verified against the chain. Prints measured times.
//
// OBJECTION (stated on purpose) : the "user" here is this script. Engine latency, plan building and chain reads are
// measured ; human decision time is not, and the numbers come from one machine and a local chain with instant blocks.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readJournal, listIncidents, buildIncident, redecode, writeIncident } from './incident.mjs';
import { respond } from './matrix.mjs';
import { ethers, makeProvider, recoveryPlan, scanGrants } from './revoke.mjs';
import { assertLocalThrowaway, deployAnchor, anchorJournal, attachProof, verifyIncident } from './anchor_evidence.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const RPC = arg('rpc', 'http://127.0.0.1:8549'), OUT = resolve(arg('out', join(HERE, 'out', 'demo')));
assertLocalThrowaway(RPC);
process.env.REPONSE_RPC = RPC;
const { send, deployDemo, REPO } = await import('./test/chain.mjs');
const S = await import(pathToFileURL(join(REPO, 'research', 'titouan', 'T_banc_e2e', 'server', 'server.mjs')).href);

rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const jf = join(OUT, 'journal.jsonl');
const A = deployDemo().addresses;
const provider = makeProvider(RPC);
const fromBlock = A.blockNumber;
const srv = await S.createHoldUpServer({ port: 0, journalFile: jf, local: { contacts: [], history: [], protected: [], knownSpenders: [] } });
const post = async (p, b) => (await fetch(`http://127.0.0.1:${srv.port}${p}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })).json();
const approve = new ethers.Interface(['function approve(address,uint256)']).encodeFunctionData('approve', [A.drainer, ethers.MaxUint256]);
const request = (origin) => ({ method: 'eth_sendTransaction', params: [{ from: A.victim, to: A.usdc, data: approve, value: '0x0' }], origin, chainId: A.chainId, from: A.victim });
const M = {};

// ---- branch A : cancel
const reqA = request('https://usdc-airdrop.test');
const vA = await post('/check', reqA);
console.log(`A. verdict "${vA.level}" (${vA.fiche}) : ${vA.texts.reel}`);
console.log('   plan :', respond({ level: vA.level, fiche: vA.fiche, door: 'extension' }).user_must.join(' / '));
await post('/log', { type: 'decision', decision: 'cancel', origin: reqA.origin, method: reqA.method, level: vA.level });

// ---- branch B : override, sign, then recover
const reqB = request('https://usdc-bonus.test');
const vB = await post('/check', reqB);
await post('/log', { type: 'decision', decision: 'confirm', origin: reqB.origin, method: reqB.method, level: vB.level });
await send(reqB.params[0]); // the wallet signs : the right now exists on chain
let t = performance.now();
const plan = await recoveryPlan(provider, A.victim, { spender: A.drainer, fromBlock, permitToken: A.usdc });
M.recovery_plan_ms = Math.round(performance.now() - t);
console.log(`B. signed anyway. ${plan.grants.length} live right(s) to ${A.drainer} :`);
for (const x of plan.transactions) console.log('   ' + x.does);
for (const x of plan.transactions) await send({ from: x.from, to: x.to, data: x.data, value: x.value });
M.grants_before = plan.grants.length; M.grants_after = (await scanGrants(provider, A.victim, { spender: A.drainer, fromBlock })).length;
console.log(`   after revocation : ${M.grants_after} right(s) left. Permit nonce ${plan.permit.nonce} still open (replacement permit ready to sign).`);
writeFileSync(join(OUT, 'recovery_plan.json'), JSON.stringify(plan, null, 2) + '\n');
await srv.close();

// ---- records, anchoring, verification
const journal = readJournal(jf);
const list = listIncidents(journal.records);
t = performance.now();
const incA = await redecode(buildIncident(journal, list[0].seq), { request: reqA });
const incB = buildIncident(journal, list[1].seq);
M.incident_build_ms = Math.round(performance.now() - t);
const contract = deployAnchor(RPC, join(OUT, 'chain'));
const anchor = await anchorJournal({ journal, rpcUrl: RPC, contract });
for (const inc of [incA, incB]) {
  attachProof(inc, journal, anchor);
  const r = await verifyIncident(inc, { rpcUrl: RPC });
  const f = writeIncident(inc, OUT);
  console.log(`${inc.outcome === 'cancelled' ? 'A' : 'B'}. incident ${inc.id} (${inc.outcome}) : ${r.ok ? 'VERIFIED' : 'NOT VERIFIED'} against block ${anchor.block_number}, ${r.checks.length} checks\n   ${f.html}`);
  if (!r.ok) process.exitCode = 1;
}
Object.assign(M, { time_to_detect_ms_A: incA.metrics.time_to_detect_ms, time_to_detect_ms_B: incB.metrics.time_to_detect_ms, journal_lines: journal.chain.n, anchor_tx: anchor.tx_hash, chain_id: anchor.chain_id, note: 'scripted user, local chain : decision times are not human times' });
writeFileSync(join(OUT, 'measures.json'), JSON.stringify(M, null, 2) + '\n');
console.log('measures :', JSON.stringify(M));
provider.destroy();

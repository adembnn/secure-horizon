// Shared helper of the chain tests. They need a THROWAWAY local node (never the shared rehearsal fork on 8545) :
//   cd blockchain && HOLDUP_CHAIN_MODE=plain HOLDUP_PORT=8549 npm run chain:local
// REPONSE_RPC overrides the URL. Without a reachable node the chain tests are skipped, and say so.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertLocalThrowaway } from '../anchor_evidence.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(HERE, '..', '..', '..', '..');
export const RPC = process.env.REPONSE_RPC || 'http://127.0.0.1:8549';

export async function rpc(method, params = []) {
  const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result;
}
export async function nodeUp() {
  try { assertLocalThrowaway(RPC); await rpc('eth_chainId'); return true; } catch { return false; }
}
// Sends a transaction from an unlocked account of the local node and waits for it. Throws on revert.
export async function send(tx) {
  const h = await rpc('eth_sendTransaction', [tx]);
  for (let i = 0; i < 100; i++) { const rc = await rpc('eth_getTransactionReceipt', [h]); if (rc) { if (rc.status !== '0x1') throw new Error('reverted'); return rc; } await new Promise((r) => setTimeout(r, 50)); }
  throw new Error('no receipt');
}
// Deploys the demo contracts (DemoUSDC, DemoNFT, FreshDrainer...) with the existing script ; addresses file goes to a temp dir.
export function deployDemo() {
  const out = mkdtempSync(join(tmpdir(), 'holdup-reponse-chain-'));
  const r = spawnSync('npm', ['run', 'demo:deploy', '--', '--network', 'localhost'], { cwd: join(REPO, 'blockchain'), shell: true, encoding: 'utf8', env: { ...process.env, HOLDUP_PORT: new URL(RPC).port, HOLDUP_CHAIN_OUT_DIR: out, DEMO_VICTIM: '' } });
  if (r.status !== 0) throw new Error('demo:deploy failed : ' + (r.stderr || r.stdout || '').slice(-600));
  return { out, addresses: JSON.parse(readFileSync(join(out, 'addresses.local.json'), 'utf8')) };
}

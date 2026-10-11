// Client RPC en lecture seule, avec cache disque (engine/cache). Méthodes autorisées uniquement.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const CACHE = join(here, '..', 'cache');
export const RPC = {
  eth: 'https://eth.drpc.org',
  avax: 'https://api.avax.network/ext/bc/C/rpc',
  fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
};
const READ_ONLY = new Set(['eth_getLogs', 'eth_getTransactionByHash', 'eth_getCode', 'eth_call', 'eth_getBlockByNumber', 'eth_chainId', 'eth_blockNumber', 'eth_getTransactionReceipt', 'eth_getBalance']);
export const stats = { network: 0, cached: 0, errors: 0 };

export async function rpc(url, method, params = [], { cache = true, retries = 4 } = {}) {
  if (!READ_ONLY.has(method)) throw new Error('méthode non autorisée (lecture seule): ' + method);
  mkdirSync(CACHE, { recursive: true });
  const key = createHash('sha256').update(url + method + JSON.stringify(params)).digest('hex').slice(0, 40);
  const file = join(CACHE, key + '.json');
  if (cache && existsSync(file)) { stats.cached++; return JSON.parse(readFileSync(file, 'utf8')); }
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(30000) });
      const j = await res.json();
      if (j.error) throw new Error(`${method}: ${j.error.message}`);
      stats.network++;
      if (cache) writeFileSync(file, JSON.stringify(j.result));
      return j.result;
    } catch (e) { lastErr = e; stats.errors++; await new Promise((r) => setTimeout(r, 600 * (i + 1))); }
  }
  throw lastErr;
}
export const getCode = async (url, addr) => (await rpc(url, 'eth_getCode', [addr, 'latest'])) || '0x';

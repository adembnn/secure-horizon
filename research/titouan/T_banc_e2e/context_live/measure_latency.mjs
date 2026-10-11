// measure_latency.mjs - live latency of the provider (read-only public calls). Usage : node context_live/measure_latency.mjs [n=30] [rpcUrl]
// Each run is COLD (cache cleared) unless stated ; runs are spaced to stay far below public rate limits.
// Writes evidence/latency.json (public RPC) or evidence/latency_local.json (loopback rpcUrl : local fork ; the rehearsal contracts of
// research/demo_reelle/chain/addresses.local.json are added to the shapes when that file exists). Read-only calls only.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getContext, clearCache, SEL, DEFAULT_RPC, isLoopback } from './provider.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const N = Number(process.argv[2] || 30), rpcUrl = process.argv[3];
const word = (h) => h.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const LOCAL = !!rpcUrl && isLoopback(rpcUrl);
const ME = '0x8bcea1b8558ac307b50ad720045c35783c9efb6c'; // synthetic signer, no funds
const WAVAX = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', USDC = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48A6E', ROUTER = '0x60aE616a2155Ee3d9A68541Ba4544862310933d4';
const SHAPES = {
  approve_wavax_router: { method: 'eth_sendTransaction', params: [{ from: ME, to: WAVAX, data: SEL.approve + word(ROUTER) + word('1') }] },
  transfer_usdc: { method: 'eth_sendTransaction', params: [{ from: ME, to: USDC, data: SEL.transfer + word(ROUTER) + word('1') }] },
  native_send: { method: 'eth_sendTransaction', params: [{ from: ME, to: ROUTER, value: '0x1' }] },
};
const demoFile = join(HERE, '..', '..', '..', 'demo_reelle', 'chain', 'addresses.local.json');
if (LOCAL && existsSync(demoFile)) {
  const A = JSON.parse(readFileSync(demoFile, 'utf8'));
  if (A.usdc && A.drainer) SHAPES.approve_demo_token_drainer = { method: 'eth_sendTransaction', params: [{ from: ME, to: A.usdc, data: SEL.approve + word(A.drainer) + 'f'.repeat(64) }] };
}
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const runs = [];
const names = Object.keys(SHAPES);
for (let i = 0; i < N; i++) {
  const name = names[i % names.length];
  clearCache();
  const r = await getContext({ chainId: 43114, from: ME, request: SHAPES[name], seen: [], rpcUrl });
  runs.push({ i, shape: name, mode: 'cold', elapsedMs: r.elapsedMs, calls: r.calls, complete: r.complete, missing: r.missing, errors: r.errors, exactAge: Object.values(r.facts.counterparties).filter((f) => f.ageBlocks !== undefined).length, ageSources: [...new Set(Object.values(r.facts.counterparties).map((f) => f.ageSource).filter(Boolean))], counterparties: Object.keys(r.facts.counterparties).length });
  await sleep(LOCAL ? 50 : 700);
}
const warm = [];
for (let i = 0; i < 9; i++) { const r = await getContext({ chainId: 43114, from: ME, request: SHAPES[names[i % names.length]], seen: [], rpcUrl }); warm.push(r.elapsedMs); await sleep(300); }
const noExp = [];
for (let i = 0; i < 9; i++) { clearCache(); const r = await getContext({ chainId: 43114, from: ME, request: SHAPES[names[i % names.length]], seen: [], rpcUrl, options: { explorer: false } }); noExp.push(r.elapsedMs); await sleep(500); }
const el = runs.map((r) => r.elapsedMs);
const summary = { date: new Date().toISOString(), rpc: rpcUrl || DEFAULT_RPC[43114], budgetMs: 1500, n: runs.length,
  cold: { p50: pct(el, 50), p95: pct(el, 95), min: Math.min(...el), max: Math.max(...el), complete: runs.filter((r) => r.complete).length, withExactAgeForAll: runs.filter((r) => r.exactAge === r.counterparties).length, avgCalls: Math.round(runs.reduce((s, r) => s + r.calls, 0) / runs.length * 10) / 10 },
  warm_cache: { n: warm.length, p50: pct(warm, 50), max: Math.max(...warm) },
  cold_without_explorer: { n: noExp.length, p50: pct(noExp, 50), max: Math.max(...noExp) } };
writeFileSync(join(HERE, 'evidence', LOCAL ? 'latency_local.json' : 'latency.json'), JSON.stringify({ summary, runs }, null, 1));
console.log(JSON.stringify(summary, null, 1));

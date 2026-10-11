// Real test of the fork modes on a LOCAL Hardhat node (no fork of a public chain needed, no key, no secret).
//   1) in blockchain/ : npx hardhat node --port 8545        (unlocked dev accounts, chainId 31337)
//   2) node research/titouan/T_banc_e2e/detectors_adem/test/fork_test.mjs [rpc]
// Deploys SYNTHETIC contracts (honeypot token, 99 % sell-tax token, clean token, Multicall3.aggregate3 clone, a "claim"
// contract with an unregistered selector that pulls the caller's tokens), then:
//   - sell simulation (mode fork) on the three tokens ;
//   - writes redteam/fork_cases.jsonl (bench format) and runs check_plus on it with HOLDUP_FORK_RPC set (ancien nom SENTINELLE_FORK_RPC).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { rpc, sellCheckFork, simulateTxFork } from '../fork_sim.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BANC = resolve(HERE, '..', '..');
const BC = resolve(BANC, '..', '..', '..', 'blockchain');
const require = createRequire(join(BC, 'package.json'));
const solc = require('solc');
const { Interface, AbiCoder } = require('ethers');
const URL_ = process.argv[2] || 'http://127.0.0.1:8545';

const src = readFileSync(join(HERE, 'TestTokens.sol'), 'utf8');
const out = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources: { 'T.sol': { content: src } }, settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } })));
if (out.errors && out.errors.some((e) => e.severity === 'error')) { console.error(out.errors); process.exit(1); }
const C = out.contracts['T.sol'];
const iface = (n) => new Interface(C[n].abi);
const accounts = await rpc(URL_, 'eth_accounts');
const [deployer, victim, sink, pool] = accounts.map((a) => a.toLowerCase());
const wait = async (h) => { for (let i = 0; i < 50; i++) { const r = await rpc(URL_, 'eth_getTransactionReceipt', [h]); if (r) return r; await new Promise((r) => setTimeout(r, 100)); } throw new Error('no receipt'); };
async function deploy(name, args = []) {
  const data = '0x' + C[name].evm.bytecode.object + iface(name).encodeDeploy(args).slice(2);
  const r = await wait(await rpc(URL_, 'eth_sendTransaction', [{ from: deployer, data, gas: '0x989680' }]));
  return r.contractAddress.toLowerCase();
}
const send = async (from, to, data) => wait(await rpc(URL_, 'eth_sendTransaction', [{ from, to, data, gas: '0x7a1200' }]));

const HP = await deploy('TestToken', ['HPX', true, 0, pool]);
const TX = await deploy('TestToken', ['TAXX', false, 9900, pool]);
const GD = await deploy('TestToken', ['GOOD', false, 0, pool]);
const MC = await deploy('MiniMulticall3');
const FC = await deploy('FakeClaim', [sink]);
const T = iface('TestToken');
await send(deployer, GD, T.encodeFunctionData('transfer', [victim, 10n ** 21n]));
// approvals the victim granted EARLIER (state of the world before the attack)
await send(victim, GD, T.encodeFunctionData('approve', [MC, (1n << 256n) - 1n]));
await send(victim, GD, T.encodeFunctionData('approve', [FC, (1n << 256n) - 1n]));

const results = {};
results.sell_honeypot = await sellCheckFork(URL_, HP, victim, pool);
results.sell_tax99 = await sellCheckFork(URL_, TX, victim, pool);
results.sell_clean = await sellCheckFork(URL_, GD, victim, pool);

const mcData = iface('MiniMulticall3').encodeFunctionData('aggregate3', [[{ target: GD, allowFailure: false, callData: T.encodeFunctionData('transferFrom', [victim, sink, 10n ** 21n]) }]]);
const fcData = iface('FakeClaim').encodeFunctionData('claimRewards', [GD]);
results.sim_multicall_pull = await simulateTxFork(URL_, { from: victim, to: MC, data: mcData });
results.sim_fake_claim = await simulateTxFork(URL_, { from: victim, to: FC, data: fcData });
for (const k of ['sim_multicall_pull', 'sim_fake_claim']) results[k] = { status: results[k].status, nLogs: results[k].logs.length };
console.log(JSON.stringify(results, null, 1));

// bench cases : the context does NOT carry any simulation result ; the fork provides it.
const v2swap = new Interface(['function swapExactETHForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)']);
const base = (id, label, to, data, extra = {}, intent = { kind: 'connect_or_accept_offer', freeText: 'je réclame mes récompenses', declaredAt: 1760000000000 }) => ({
  id, synthetic: true, family: 'fork_local', subfamily: id, label, request: { method: 'eth_sendTransaction', params: [{ from: victim, to, data, value: '0x0' }] },
  context: { chainId: 31337, victim, origin: 'https://synthetic.test', known_protocols: [{ name: 'Multicall3 (test)', address: MC }], token_registry: [], ...extra }, intent,
});
const cases = [
  base('fork-multicall-pull', 'malveillant', MC, mcData),
  base('fork-unknown-selector-pull', 'malveillant', FC, fcData),
  base('fork-buy-honeypot', 'malveillant', pool, v2swap.encodeFunctionData('swapExactETHForTokens', [1n, ['0x' + '11'.repeat(20), HP], victim, 9999999999n]), { known_protocols: [{ name: 'router (test)', address: pool }], token_info: { [HP]: { symbol: 'HPX' } }, sell_pool: pool }, { kind: 'buy_or_swap', freeText: 'j\'achète HPX', token: 'HPX', declaredAt: 1760000000000 }),
  base('fork-buy-tax99', 'malveillant', pool, v2swap.encodeFunctionData('swapExactETHForTokens', [1n, ['0x' + '11'.repeat(20), TX], victim, 9999999999n]), { known_protocols: [{ name: 'router (test)', address: pool }], token_info: { [TX]: { symbol: 'TAXX' } }, sell_pool: pool }, { kind: 'buy_or_swap', freeText: 'j\'achète TAXX', token: 'TAXX', declaredAt: 1760000000000 }),
  base('fork-buy-clean', 'benin', pool, v2swap.encodeFunctionData('swapExactETHForTokens', [1n, ['0x' + '11'.repeat(20), GD], victim, 9999999999n]), { known_protocols: [{ name: 'router (test)', address: pool }], token_info: { [GD]: { symbol: 'GOOD' } }, sell_pool: pool }, { kind: 'buy_or_swap', freeText: 'j\'achète GOOD', token: 'GOOD', declaredAt: 1760000000000 }),
];
const casesFile = join(BANC, 'redteam', 'fork_cases.jsonl');
writeFileSync(casesFile, cases.map((c) => JSON.stringify(c)).join('\n') + '\n');
const run = (env) => execFileSync(process.execPath, [join(BANC, 'redteam', 'check_plus.mjs'), casesFile], { env: { ...process.env, ...env }, encoding: 'utf8' });
console.log('--- check_plus WITHOUT fork (detectors fall back to context mode : nothing to read)');
console.log(run({ HOLDUP_FORK_RPC: '', SENTINELLE_FORK_RPC: '' }).split('\n').filter((l) => l.startsWith('{"id"')).map((l) => { const r = JSON.parse(l); return `${r.id} ${r.level_base} -> ${r.level_final}`; }).join('\n'));
console.log('--- check_plus WITH HOLDUP_FORK_RPC=' + URL_);
console.log(run({ HOLDUP_FORK_RPC: URL_ }).split('\n').filter((l) => l.startsWith('{"id"')).map((l) => { const r = JSON.parse(l); return `${r.id} ${r.level_base} -> ${r.level_final} | ${r.reasons.filter((x) => x.startsWith('[adem')).join(' ; ')}`; }).join('\n'));

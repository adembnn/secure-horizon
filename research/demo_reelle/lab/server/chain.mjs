// Hold up Lab - the lab's OWN local chain: node start, contracts, accounts, snapshots, transaction helpers.
// SAFETY: every call goes to http://127.0.0.1:<port> (asserted). The fork only READS public Avalanche state; nothing is ever
// sent to a public chain. The accounts are Hardhat's public test accounts (their mnemonic is public, taken from Hardhat itself).
import { spawn, execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ethers, loadArtifact, blockchainDir, REAL_USDC, setRealUsdcBalance } from '../../chain/lib.mjs';

export { ethers };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(path.join(blockchainDir, 'package.json'));

export const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
export const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';
export const REAL_WAVAX = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';
export const MAX_UINT = 2n ** 256n - 1n;
export const MAX_UINT160 = 2n ** 160n - 1n;
export const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
export const hexQ = (v) => '0x' + BigInt(v).toString(16);
export const isAddr = (a) => typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a);
export const TMP = path.join(os.tmpdir(), 'holdup-lab');

export const ABI = {
  erc20: new ethers.Interface([
    'function name() view returns (string)', 'function symbol() view returns (string)', 'function decimals() view returns (uint8)',
    'function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)', 'function nonces(address) view returns (uint256)',
    'function approve(address,uint256) returns (bool)', 'function increaseAllowance(address,uint256) returns (bool)', 'function transfer(address,uint256) returns (bool)',
    'function transferFrom(address,address,uint256) returns (bool)', 'function mint(address,uint256)',
    'function permit(address owner,address spender,uint256 value,uint256 deadline,uint8 v,bytes32 r,bytes32 s)', 'function deposit() payable',
  ]),
  nft: new ethers.Interface([
    'function mint(address) returns (uint256)', 'function mintBatch(address,uint256) returns (uint256)', 'function setApprovalForAll(address,bool)',
    'function isApprovedForAll(address,address) view returns (bool)', 'function balanceOf(address) view returns (uint256)', 'function ownerOf(uint256) view returns (address)',
    'function transferFrom(address,address,uint256)',
  ]),
  router: new ethers.Interface(['function swapUSDCforWAVAX(uint256,uint256) returns (uint256)', 'function addLiquidity(uint256,uint256)']),
  drainer: new ethers.Interface([
    'function drainWithPermit(address token,address victim,uint256 amount,uint256 deadline,uint8 v,bytes32 r,bytes32 s)',
    'function sweepERC20(address token,address victim)', 'function sweepNFTBatch(address token,address victim,uint256[] tokenIds)',
  ]),
  vault: new ethers.Interface(['function owner() view returns (address)', 'function transferOwnership(address)', 'function withdraw(address,address,uint256)']),
  shady: new ethers.Interface(['function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline) returns (uint256[])']),
  permit2: new ethers.Interface([
    'function permit(address owner,((address token,uint160 amount,uint48 expiration,uint48 nonce) details,address spender,uint256 sigDeadline) permitSingle,bytes signature)',
    'function transferFrom(address from,address to,uint160 amount,address token)',
    'function allowance(address,address,address) view returns (uint160 amount,uint48 expiration,uint48 nonce)',
  ]),
  multicall3: new ethers.Interface(['function aggregate3Value((address target,bool allowFailure,uint256 value,bytes callData)[] calls) payable returns ((bool success,bytes returnData)[])']),
};

// ------------------------------------------------------------------ JSON-RPC transport (loopback only)
export function makeRpc(url) {
  const u = new URL(url);
  if (u.hostname !== '127.0.0.1' || u.protocol !== 'http:') throw new Error('Refused: the lab only talks to http://127.0.0.1');
  let id = 0;
  const post = async (body) => {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return r.json();
  };
  const rpc = async (method, params = []) => {
    const j = await post({ jsonrpc: '2.0', id: ++id, method, params });
    if (j.error) { const e = new Error(j.error.message || 'rpc error'); e.rpc = j.error; throw e; }
    return j.result;
  };
  // [[method, params], ...] -> results in order (undefined when one call failed)
  rpc.batch = async (calls) => {
    if (!calls.length) return [];
    const body = calls.map(([method, params]) => ({ jsonrpc: '2.0', id: ++id, method, params }));
    const out = await post(body);
    const by = new Map((Array.isArray(out) ? out : []).map((j) => [j.id, j]));
    return body.map((b) => { const j = by.get(b.id); return j && !j.error ? j.result : undefined; });
  };
  rpc.url = url;
  return rpc;
}

async function alive(url) {
  try { return !!(await makeRpc(url)('eth_chainId')); } catch { return false; }
}

// ------------------------------------------------------------------ node
// Starts blockchain/scripts/chain-local.js on the lab port (fork of the Avalanche C-Chain, or plain when the public RPC is unreachable).
// A node already answering on that port is reused (it is the lab's own port).
export async function ensureNode({ port = 8560, mode } = {}) {
  const url = `http://127.0.0.1:${port}`;
  if (await alive(url)) return { url, child: null, reused: true, stop: async () => {} };
  fs.mkdirSync(TMP, { recursive: true });
  const start = (m) => {
    const logFile = path.join(TMP, `node-${port}.log`);
    const fd = fs.openSync(logFile, 'w');
    const env = { ...process.env, HOLDUP_PORT: String(port) };
    if (m) env.HOLDUP_CHAIN_MODE = m; else delete env.HOLDUP_CHAIN_MODE;
    const child = spawn(process.execPath, [path.join(blockchainDir, 'scripts', 'chain-local.js')], { cwd: blockchainDir, env, stdio: ['ignore', fd, fd], windowsHide: true });
    return { child, logFile };
  };
  const waitUp = async (child, ms) => {
    let dead = false; child.once('exit', () => { dead = true; });
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (await alive(url)) return true;
      if (dead) return false;
      await new Promise((r) => setTimeout(r, 400));
    }
    return false;
  };
  let { child, logFile } = start(mode);
  if (!(await waitUp(child, 90000))) {
    await stopTree(child);
    if (mode === 'plain') throw new Error(`Local node did not start (see ${logFile})`);
    ({ child, logFile } = start('plain')); // offline fallback
    if (!(await waitUp(child, 60000))) { await stopTree(child); throw new Error(`Local node did not start (see ${logFile})`); }
  }
  return { url, child, reused: false, logFile, stop: () => stopTree(child) };
}
export function stopTree(child) {
  return new Promise((done) => {
    if (!child || child.exitCode !== null) return done();
    if (process.platform === 'win32') execFile('taskkill', ['/pid', String(child.pid), '/T', '/F'], () => done());
    else { child.once('exit', () => done()); child.kill(); }
  });
}

// ------------------------------------------------------------------ lab contracts (compiled once, cached in the temp folder)
export function compileLabKit() {
  const file = path.join(HERE, 'contracts', 'LabKit.sol');
  const source = fs.readFileSync(file, 'utf8');
  const solc = req('solc');
  const key = createHash('sha256').update(solc.version() + '\n' + source).digest('hex').slice(0, 16);
  const cache = path.join(TMP, `labkit-${key}.json`);
  if (fs.existsSync(cache)) return JSON.parse(fs.readFileSync(cache, 'utf8'));
  const input = { language: 'Solidity', sources: { 'LabKit.sol': { content: source } }, settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'paris', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (out.errors || []).filter((e) => e.severity === 'error');
  if (errors.length) throw new Error('LabKit.sol does not compile: ' + errors[0].formattedMessage);
  const kit = {};
  for (const [name, c] of Object.entries(out.contracts['LabKit.sol'])) kit[name] = { abi: c.abi, bytecode: '0x' + c.evm.bytecode.object };
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(cache, JSON.stringify(kit));
  return kit;
}

// ------------------------------------------------------------------ accounts
// Hardhat's public test accounts, derived from the mnemonic Hardhat itself ships (no key literal in this repo).
const ROLES = { deployer: 0, collector: 1, contact: 2, attackerEoa: 3, victim: 5, own2: 6, exchange: 7 };
function hardhatWallet(index) {
  const { HARDHAT_NETWORK_MNEMONIC } = req('hardhat/internal/core/config/default-config');
  return ethers.HDNodeWallet.fromPhrase(HARDHAT_NETWORK_MNEMONIC, undefined, `m/44'/60'/0'/0/${index}`);
}
// Deterministic address sharing the first 4 and last 4 hex characters of `addr` (what address poisoning produces).
export function lookalikeOf(addr, salt = 'holdup-lab') {
  const h = lc(addr).slice(2);
  const mid = ethers.keccak256(ethers.toUtf8Bytes(salt + ':' + h)).slice(2, 34);
  return ethers.getAddress('0x' + h.slice(0, 4) + mid + h.slice(36));
}
export const syntheticAddress = (label) => ethers.getAddress('0x' + ethers.keccak256(ethers.toUtf8Bytes('holdup-lab/' + label)).slice(26));

// ------------------------------------------------------------------ transactions
// Result of every helper: { hash, reverted, error?, gasUsed, gasPrice, blockNumber, contractAddress? }
async function settle(rpc, hash, err) {
  if (!hash) return { hash: null, reverted: true, error: err || 'transaction refusée par le nœud' };
  const r = await rpc('eth_getTransactionReceipt', [hash]);
  if (!r) return { hash, reverted: true, error: err || 'transaction non minée' };
  return { hash, reverted: r.status !== '0x1', error: r.status !== '0x1' ? (err || 'exécution annulée (revert)') : undefined, gasUsed: BigInt(r.gasUsed), gasPrice: BigInt(r.effectiveGasPrice || 0), blockNumber: Number(r.blockNumber), contractAddress: r.contractAddress || undefined };
}
const errText = (e) => String((e.rpc && e.rpc.message) || e.message || e).replace(/^Error: /, '').slice(0, 200);
const errHash = (e) => (e.rpc && e.rpc.data && e.rpc.data.txHash) || null;

export const toppedUp = new Set(); // addresses the lab gave gas money to during a run (excluded from the balance report)
// Send as any address of the local node (unlocked account, or impersonated: the stand-in for "the attacker holds this key").
export async function sendAs(rpc, from, tx, { gas = 3_000_000 } = {}) {
  await rpc('hardhat_impersonateAccount', [from]);
  if (BigInt(await rpc('eth_getBalance', [from, 'latest'])) < 10n ** 17n) { await rpc('hardhat_setBalance', [from, hexQ(10n ** 18n)]); toppedUp.add(lc(from)); }
  const body = { from, to: tx.to || undefined, data: tx.data || '0x', value: hexQ(tx.value || 0), gas: hexQ(gas) };
  try { return await settle(rpc, await rpc('eth_sendTransaction', [body])); } catch (e) { return settle(rpc, errHash(e), errText(e)); }
}
// Relay a signed raw transaction. A transaction the node already mined (relayed by the RPC guard) is looked up by hash.
export async function sendRaw(rpc, raw) {
  const hash = ethers.keccak256(raw);
  const known = await rpc('eth_getTransactionReceipt', [hash]);
  if (known) return settle(rpc, hash);
  try { return await settle(rpc, await rpc('eth_sendRawTransaction', [raw])); } catch (e) { return settle(rpc, errHash(e) || (await rpc('eth_getTransactionReceipt', [hash]) ? hash : null), errText(e)); }
}
// The victim really signs (EIP-1559) with its own key: what a wallet hands to eth_sendRawTransaction.
export async function signAsVictim(ctx, tx) {
  const { rpc } = ctx;
  const from = ctx.accounts.victim;
  const [nonce, block] = await Promise.all([rpc('eth_getTransactionCount', [from, 'pending']), rpc('eth_getBlockByNumber', ['latest', false])]);
  const base = BigInt(block.baseFeePerGas || 0);
  const prio = 10n ** 9n;
  let gasLimit = 400_000n;
  try { gasLimit = (BigInt(await rpc('eth_estimateGas', [{ from, to: tx.to, data: tx.data || '0x', value: hexQ(tx.value || 0) }])) * 13n) / 10n; } catch { /* will revert on-chain: keep a fixed limit so the failure is observed */ }
  return ctx.victimWallet.signTransaction({ type: 2, chainId: ctx.chainId, nonce: Number(nonce), to: tx.to, data: tx.data || '0x', value: BigInt(tx.value || 0), gasLimit, maxPriorityFeePerGas: prio, maxFeePerGas: base * 2n + prio });
}

export async function ethCall(rpc, to, iface, fn, args = []) {
  const out = await rpc('eth_call', [{ to, data: iface.encodeFunctionData(fn, args) }, 'latest']);
  const dec = iface.decodeFunctionResult(fn, out);
  return dec.length === 1 ? dec[0] : dec;
}
export const snapshot = (rpc) => rpc('evm_snapshot', []);
export const revert = (rpc, id) => rpc('evm_revert', [id]);

// ------------------------------------------------------------------ deployment
async function deployContract(rpc, from, abi, bytecode, args = []) {
  const data = bytecode + new ethers.Interface(abi).encodeDeploy(args).slice(2);
  const r = await sendAs(rpc, from, { data }, { gas: 6_000_000 });
  if (r.reverted || !r.contractAddress) throw new Error('Deployment failed: ' + (r.error || 'no address'));
  return { address: ethers.getAddress(r.contractAddress), block: r.blockNumber };
}
const must = (r, what) => { if (r.reverted) throw new Error(`Setup step failed (${what}): ${r.error}`); return r; };

export async function setupLab(url) {
  const rpc = makeRpc(url);
  // a reused node is brought back to its pristine state first, so that addresses are the same at every lab start
  const pristine = path.join(TMP, 'pristine-' + new URL(url).port + '.json');
  try { await revert(rpc, JSON.parse(fs.readFileSync(pristine, 'utf8')).snap); } catch { /* fresh node, or a node started by an older lab */ }
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(pristine, JSON.stringify({ snap: await snapshot(rpc) }));
  const chainId = Number(BigInt(await rpc('eth_chainId')));
  const meta =await rpc('hardhat_metadata', []).catch(() => null);
  if (!meta) throw new Error('The node on the lab port is not a Hardhat node: refused.');
  const mode = meta.forkedNetwork ? 'fork' : 'plain';
  const accounts = {};
  for (const [role, i] of Object.entries(ROLES)) accounts[role] = hardhatWallet(i).address;
  const victimWallet = new ethers.Wallet(hardhatWallet(ROLES.victim).privateKey);
  const E18 = 10n ** 18n;
  const funds = { deployer: 1000n, collector: 10n, contact: 1n, attackerEoa: 10n, victim: 100n, own2: 1n, exchange: 10n };
  for (const [role, a] of Object.entries(accounts)) {
    await rpc('hardhat_setCode', [a, '0x']); // a public test address may carry code on the real chain (delegation): cleared locally
    await rpc('hardhat_setBalance', [a, hexQ(funds[role] * E18)]);
  }
  const d = accounts.deployer;
  const art = (n) => loadArtifact(n);
  const kit = compileLabKit();
  const deployBlocks = {};
  const dep = async (key, abi, bytecode, args) => { const r = await deployContract(rpc, d, abi, bytecode, args); deployBlocks[lc(r.address)] = r.block; return r.address; };
  const c = {};
  c.usdc = await dep('usdc', art('DemoUSDC').abi, art('DemoUSDC').bytecode);
  c.dwavax = await dep('dwavax', art('DemoWAVAX').abi, art('DemoWAVAX').bytecode);
  c.nft = await dep('nft', art('DemoNFT').abi, art('DemoNFT').bytecode);
  c.router = await dep('router', art('DemoRouter').abi, art('DemoRouter').bytecode, [c.usdc, c.dwavax]);
  c.vault = await dep('vault', kit.LabVault.abi, kit.LabVault.bytecode, [accounts.victim]);
  c.shady = await dep('shady', kit.LabShadyRouter.abi, kit.LabShadyRouter.bytecode, [accounts.collector, 100]);
  const hasCode = async (a) => (await rpc('eth_getCode', [a, 'latest'])) !== '0x';
  c.wavax = mode === 'fork' && (await hasCode(REAL_WAVAX)) ? REAL_WAVAX : await dep('wavax', kit.LabWAVAX.abi, kit.LabWAVAX.bytecode);
  c.permit2 = (await hasCode(PERMIT2)) ? PERMIT2 : null;
  c.multicall3 = (await hasCode(MULTICALL3)) ? MULTICALL3 : null;

  const erc = ABI.erc20, U = (n) => BigInt(n) * 10n ** 6n;
  const tx = async (to, iface, fn, args, what) => must(await sendAs(rpc, d, { to, data: iface.encodeFunctionData(fn, args) }), what);
  // demo router liquidity (same amounts as blockchain/scripts/demo/deploy-local.js)
  await tx(c.usdc, erc, 'mint', [d, U(100000)], 'mint usdc');
  await tx(c.dwavax, erc, 'mint', [d, 1000n * E18], 'mint wavax');
  await tx(c.usdc, erc, 'approve', [c.router, U(100000)], 'approve usdc');
  await tx(c.dwavax, erc, 'approve', [c.router, 1000n * E18], 'approve wavax');
  await tx(c.router, ABI.router, 'addLiquidity', [U(100000), 1000n * E18], 'liquidity');
  await tx(c.dwavax, erc, 'mint', [c.shady, 100n * E18], 'shady liquidity');
  // the victim: 2 480 DUSDC, 5 DWAVAX, 3 NFT, a vault it owns holding 1 500 DUSDC; the custodial platform: 5 000 DUSDC
  await tx(c.usdc, erc, 'mint', [accounts.victim, U(2480)], 'victim usdc');
  await tx(c.dwavax, erc, 'mint', [accounts.victim, 5n * E18], 'victim wavax');
  await tx(c.nft, ABI.nft, 'mintBatch', [accounts.victim, 3], 'victim nft');
  await tx(c.usdc, erc, 'mint', [c.vault, U(1500)], 'vault usdc');
  await tx(c.usdc, erc, 'mint', [accounts.exchange, U(5000)], 'exchange usdc');
  c.realUsdc = null;
  if (mode === 'fork' && (await hasCode(REAL_USDC))) {
    try { await setRealUsdcBalance(new ethers.JsonRpcProvider(url, undefined, { batchMaxCount: 1, cacheTimeout: -1 }), accounts.victim, U(2480)); c.realUsdc = REAL_USDC; } catch { c.realUsdc = null; }
  }

  const ctx = {
    rpc, url, mode, chainId, accounts, victimWallet, c, deployBlocks, nftIds: [0, 1, 2],
    lookalikes: { contact: lookalikeOf(accounts.contact), router: lookalikeOf(c.router) },
    neverSeen: syntheticAddress('never-seen'), safeVault: syntheticAddress('fake-safe-wallet'), merchant: syntheticAddress('new-merchant'),
    forkBlock: meta.forkedNetwork ? meta.forkedNetwork.forkBlockNumber : null,
  };
  ctx.tokens = {
    dusdc: { address: c.usdc, symbol: 'DUSDC', decimals: 6, stable: true, permitName: 'Demo USDC', permitVersion: '1' },
    dwavax: { address: c.dwavax, symbol: 'DWAVAX', decimals: 18 },
    wavax: { address: c.wavax, symbol: 'WAVAX', decimals: 18 },
    ...(c.realUsdc ? { usdc: { address: c.realUsdc, symbol: 'USDC', decimals: 6, stable: true, permitName: await ethCall(rpc, c.realUsdc, erc, 'name'), permitVersion: '2' } } : {}),
  };
  // The demo protocols are meant to be established ones and the drainer a brand-new contract: put 2 000 blocks between them.
  await rpc('hardhat_mine', ['0x7d0']);
  ctx.baseSnap = await snapshot(rpc); // state before the drainer exists: /api/reset comes back here
  await deployDrainer(ctx);
  return ctx;
}

// FreshDrainer is deployed LAST so that it is a brand-new contract (age of a few blocks), collector = the attacker account.
export async function deployDrainer(ctx) {
  const a = loadArtifact('FreshDrainer');
  const r = await deployContract(ctx.rpc, ctx.accounts.deployer, a.abi, a.bytecode, [ctx.accounts.collector]);
  ctx.c.drainer = r.address;
  ctx.deployBlocks[lc(r.address)] = r.block;
  return r.address;
}
export async function resetLab(ctx) {
  await revert(ctx.rpc, ctx.baseSnap);
  ctx.baseSnap = await snapshot(ctx.rpc);
  for (const a of Object.keys(ctx.deployBlocks)) if (a === lc(ctx.c.drainer)) delete ctx.deployBlocks[a];
  return deployDrainer(ctx);
}

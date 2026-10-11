// Hold up - RPC guard : helpers shared by the tests and demo_send.mjs. LOCAL CHAIN ONLY.
// Transactions are signed with Hardhat's PUBLIC test accounts (the mnemonic every Hardhat node prints at start-up, read here from the
// hardhat package itself : no key is written in this repository). These accounts must never hold real funds or be used on a public chain,
// which is why assertLocalNode() refuses anything that is not a loopback Hardhat node.
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const BLOCKCHAIN = resolve(HERE, '..', '..', '..', 'blockchain');
const req = createRequire(join(BLOCKCHAIN, 'package.json'));
export const { ethers } = req('ethers');
const { HARDHAT_NETWORK_MNEMONIC } = req('hardhat/internal/core/config/default-config');

export const testWallet = (i) => ethers.HDNodeWallet.fromPhrase(HARDHAT_NETWORK_MNEMONIC, undefined, `m/44'/60'/0'/0/${i}`);
export const ERC20 = new ethers.Interface(['function transfer(address,uint256)', 'function approve(address,uint256)', 'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)', 'function mint(address,uint256)']);

// An address that starts and ends like `addr` (4 hex characters each side) but is another one : what address poisoning plants in a history.
export function lookalike(addr) {
  const a = addr.toLowerCase();
  const mid = ethers.keccak256(ethers.toUtf8Bytes('holdup-lookalike:' + a)).slice(2, 34);
  return a.slice(0, 6) + mid + a.slice(-4);
}

let n = 0;
export async function rpc(url, method, params = []) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++n, method, params }) });
  return r.json();
}
export async function call(url, method, params = []) {
  const j = await rpc(url, method, params);
  if (j.error) throw new Error(`${method} : ${j.error.message}`);
  return j.result;
}

// Throws unless `url` is a loopback address AND the node behind it says it is a Hardhat development node.
export async function assertLocalNode(url) {
  const h = new URL(url).hostname;
  if (h !== '127.0.0.1' && h !== 'localhost') throw new Error(`refusé : ${h} n'est pas une adresse locale. Ces comptes de test ne servent que sur la chaîne locale.`);
  const v = await call(url, 'web3_clientVersion');
  if (!/^HardhatNetwork\//.test(String(v))) throw new Error(`refusé : le nœud derrière ${url} n'est pas un nœud Hardhat local (${v}).`);
  return Number(BigInt(await call(url, 'eth_chainId')));
}

// Signs (never sends) a transaction with a Hardhat test account, nonce and fees read through `url`.
export async function signTx(url, wallet, tx, chainId) {
  const nonce = Number(BigInt(await call(url, 'eth_getTransactionCount', [wallet.address, 'pending'])));
  const block = await call(url, 'eth_getBlockByNumber', ['latest', false]);
  const base = BigInt(block.baseFeePerGas || '0x0');
  return wallet.signTransaction({ type: 2, chainId, nonce, gasLimit: 120000n, maxPriorityFeePerGas: 1_000_000_000n, maxFeePerGas: base * 2n + 2_000_000_000n, value: 0n, ...tx });
}
export const balanceOf = async (url, token, who) => BigInt(await call(url, 'eth_call', [{ to: token, data: ERC20.encodeFunctionData('balanceOf', [who]) }, 'latest']));
export const allowance = async (url, token, owner, spender) => BigInt(await call(url, 'eth_call', [{ to: token, data: ERC20.encodeFunctionData('allowance', [owner, spender]) }, 'latest']));

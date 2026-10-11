// Fork simulation helpers (no key, no secret). Two modes, always labelled in the verdict:
//  - mode 'fork'    : a JSON-RPC endpoint of a LOCAL fork/dev node (Hardhat `npx hardhat node [--fork <url>]`, or anvil)
//                     given by env SENTINELLE_FORK_RPC (e.g. http://127.0.0.1:8545). The request is executed for real on
//                     the fork as the victim (account impersonation, no signature), its logs are read, then the fork
//                     is reverted to its snapshot. Sell simulation also runs there.
//  - mode 'eth_call': any RPC given by env SENTINELLE_RPC : `eth_call` with a state override (geth-style 3rd param)
//                     that credits the victim's token balance, then calls token.transfer(pool, amount) as the victim :
//                     a revert means "cannot sell". No tax measure in this mode.
//  - mode 'context' : no RPC : the detectors read the simulation result already present in the case context
//                     (token_info.sell_simulation / sell_tax_pct, context.simulation.logs).
import { keccak256, keccak256Hex } from '../engine/src/keccak.mjs';

const pad = (h) => h.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const hex = (n) => '0x' + BigInt(n).toString(16);
let rid = 1;
export async function rpc(url, method, params = []) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: rid++, method, params }) });
  const j = await r.json();
  if (j.error) { const e = new Error(j.error.message || 'rpc error'); e.data = j.error.data; throw e; }
  return j.result;
}
export const SEL = { balanceOf: '0x70a08231', transfer: '0xa9059cbb' };
export const balanceOf = async (url, token, who) => BigInt(await rpc(url, 'eth_call', [{ to: token, data: SEL.balanceOf + pad(who) }, 'latest']));

// slot of balances[holder] for the usual Solidity mapping layouts (slot index 0..30, solidity and vyper key order)
export function balanceSlotCandidates(holder) {
  const out = [];
  for (let i = 0; i <= 30; i++) {
    out.push({ i, layout: 'solidity', slot: keccak256Hex('0x' + pad(holder) + pad(hex(i))) });
    out.push({ i, layout: 'vyper', slot: keccak256Hex('0x' + pad(hex(i)) + pad(holder)) });
  }
  return out;
}

// mode 'fork' : find the balance slot by writing a marker and reading balanceOf back, then restore.
export async function findBalanceSlotFork(url, token, holder) {
  for (const c of balanceSlotCandidates(holder)) {
    const before = await rpc(url, 'eth_getStorageAt', [token, c.slot, 'latest']);
    const marker = '0x' + pad('0x1234567890abcdef');
    await rpc(url, 'hardhat_setStorageAt', [token, c.slot, marker]);
    let ok = false; try { ok = (await balanceOf(url, token, holder)) === 0x1234567890abcdefn; } catch { /* not a token */ }
    await rpc(url, 'hardhat_setStorageAt', [token, c.slot, '0x' + pad(before)]);
    if (ok) return c.slot;
  }
  return null;
}

// mode 'fork' : execute tx as `from` on the fork, return {status, logs}, then revert.
export async function simulateTxFork(url, tx) {
  const snap = await rpc(url, 'evm_snapshot');
  try {
    await rpc(url, 'hardhat_impersonateAccount', [tx.from]);
    await rpc(url, 'hardhat_setBalance', [tx.from, '0x56bc75e2d63100000']); // gas money on the fork only (100 native)
    let hash;
    try { hash = await rpc(url, 'eth_sendTransaction', [{ from: tx.from, to: tx.to, data: tx.data || tx.input || '0x', value: tx.value || '0x0', gas: '0xf42400' }]); }
    catch (e) { return { status: 'reverted', logs: [], error: e.message }; }
    const rc = await rpc(url, 'eth_getTransactionReceipt', [hash]);
    return { status: rc && rc.status === '0x1' ? 'ok' : 'reverted', logs: (rc && rc.logs) || [] };
  } finally { await rpc(url, 'evm_revert', [snap]); }
}

// mode 'fork' : can `holder` sell `token` to `pool` ? credit holder, transfer as holder, measure what the pool received.
export async function sellCheckFork(url, token, holder, pool, amount = 10n ** 18n) {
  const snap = await rpc(url, 'evm_snapshot');
  try {
    const slot = await findBalanceSlotFork(url, token, holder);
    if (!slot) return { mode: 'fork', sellable: null, note: 'balance slot not found' };
    await rpc(url, 'hardhat_setStorageAt', [token, slot, '0x' + pad(hex(amount))]);
    await rpc(url, 'hardhat_impersonateAccount', [holder]);
    await rpc(url, 'hardhat_setBalance', [holder, '0x56bc75e2d63100000']);
    const before = await balanceOf(url, token, pool);
    let hash;
    try { hash = await rpc(url, 'eth_sendTransaction', [{ from: holder, to: token, data: SEL.transfer + pad(pool) + pad(hex(amount)), gas: '0x7a1200' }]); }
    catch (e) { return { mode: 'fork', sellable: false, taxPct: 100, revert: e.message }; }
    const rc = await rpc(url, 'eth_getTransactionReceipt', [hash]);
    if (!rc || rc.status !== '0x1') return { mode: 'fork', sellable: false, taxPct: 100, revert: 'status 0' };
    const got = (await balanceOf(url, token, pool)) - before;
    const taxPct = Number(((amount - got) * 10000n) / amount) / 100;
    return { mode: 'fork', sellable: true, taxPct };
  } finally { await rpc(url, 'evm_revert', [snap]); }
}

// mode 'eth_call' : state override on every candidate slot (they are distinct keys, writing all is harmless in a call).
export async function sellCheckEthCall(url, token, holder, pool, amount = 10n ** 18n) {
  const stateDiff = {};
  for (const c of balanceSlotCandidates(holder)) stateDiff[c.slot] = '0x' + pad(hex(amount));
  try {
    const bal = BigInt(await rpc(url, 'eth_call', [{ to: token, data: SEL.balanceOf + pad(holder) }, 'latest', { [token]: { stateDiff } }]));
    if (bal !== amount) return { mode: 'eth_call', sellable: null, note: 'balance override not effective' };
    await rpc(url, 'eth_call', [{ from: holder, to: token, data: SEL.transfer + pad(pool) + pad(hex(amount)) }, 'latest', { [token]: { stateDiff } }]);
    return { mode: 'eth_call', sellable: true };
  } catch (e) { return { mode: 'eth_call', sellable: false, revert: e.message }; }
}

export const TOPIC = {
  Approval: keccak256('Approval(address,address,uint256)'),
  Transfer: keccak256('Transfer(address,address,uint256)'),
  ApprovalForAll: keccak256('ApprovalForAll(address,address,bool)'),
};
export const topicAddr = (t) => '0x' + String(t).slice(26).toLowerCase();

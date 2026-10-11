// Décodeur de calldata récursif. Produit un arbre de noeuds ; chaque noeud porte des "acts" (actions normalisées).
import { BY_SELECTOR, ADDR, MULTISEND_OFFICIAL } from './registry.js';
import { decodeParams, parseParams, DecodeError } from './abi.js';
import { fromHex, toHex } from './keccak.js';
import { lc, isUnlimited, strip0x, resolveRecipient } from './util.js';

export const MAX_DEPTH = 8;
const MAX_CHILDREN = 512;
const CONTRACT_BALANCE = 1n << 255n;

export function mkNode(call, depth, path) {
  return {
    path, depth, to: lc(call.to), sender: lc(call.sender), op: call.op || 'call', value: call.value ?? 0n,
    selector: null, id: null, name: null, family: null, args: null, acts: [], children: [], flags: [], opaque: false,
    allowFailure: false,
  };
}
export const flag = (node, code, severity, detail) => node.flags.push({ code, severity, detail });
const dec = (typesStr, hex) => decodeParams(parseParams(typesStr + ')', 0).params, hex);

const approvalAct = (o) => ({ t: 'approval', std: 'erc20', revoke: false, expiry: undefined, ...o });
const xfer = (o) => ({ t: 'transfer', std: 'erc20', ...o });

// ---- point d'entrée
export function decodeCall(ctx, call, depth = 0, path = '0') {
  const node = mkNode(call, depth, path);
  try {
    if (depth > MAX_DEPTH) { node.opaque = true; flag(node, 'depth_limit', 'warn', `profondeur > ${MAX_DEPTH}`); return node; }
    if (!call.to && node.op === 'call') { node.family = 'create'; node.opaque = true; flag(node, 'contract_creation', 'warn', 'déploiement de contrat : code non analysé'); return node; }
    const data = (call.data || '0x').toLowerCase();
    if (node.value > 0n && node.op === 'call') node.acts.push(xfer({ std: 'native', token: ADDR.NATIVE, from: node.sender, to: node.to, amount: node.value }));
    if (data === '0x' || data === '') { node.family = 'native'; return node; }
    if (strip0x(data).length < 8) { node.opaque = true; flag(node, 'short_calldata', 'warn', 'calldata < 4 octets'); return node; }
    const sel = data.slice(0, 10);
    node.selector = sel;
    const cands = BY_SELECTOR.get(sel);
    if (!cands) { node.opaque = true; node.family = 'unknown'; flag(node, 'unknown_selector', 'warn', `sélecteur ${sel} hors registre`); scanEmbedded(node, data); return node; }
    let lastErr;
    for (const e of cands) {
      try {
        node.args = decodeParams(e.params, '0x' + data.slice(10));
        node.id = e.id; node.name = e.name; node.family = e.family; node.sig = e.canon; lastErr = null; break;
      } catch (err) { lastErr = err; }
    }
    if (lastErr) { node.opaque = true; node.family = 'decode_error'; flag(node, 'decode_error', 'warn', `${cands[0].canon}: ${lastErr.message}`); return node; }
    handle(ctx, node, depth, path);
  } catch (err) {
    node.opaque = true; flag(node, 'decode_error', 'warn', String(err.message || err));
  }
  return node;
}

export function child(ctx, node, call, i) {
  if (node.children.length >= MAX_CHILDREN) { node.opaque = true; flag(node, 'too_many_children', 'warn', `> ${MAX_CHILDREN} sous-appels`); return null; }
  const c = decodeCall(ctx, call, node.depth + 1, node.path + '.' + i);
  node.children.push(c);
  return c;
}

function handle(ctx, node, depth) {
  const a = node.args, id = node.id, S = node.sender, T = node.to;
  switch (id) {
    // ----- droits ERC-20 / NFT
    case 'approve':
      node.acts.push(approvalAct({ token: T, owner: S, spender: lc(a.spender), amount: a.amount, via: 'approve', revoke: a.amount === 0n }));
      break;
    case 'increaseAllowance':
      node.acts.push(approvalAct({ token: T, owner: S, spender: lc(a.spender), amount: a.addedValue, via: 'increaseAllowance', revoke: a.addedValue === 0n }));
      break;
    case 'decreaseAllowance':
      flag(node, 'allowance_decrease', 'info', 'réduction de droit (non risqué)');
      break;
    case 'setApprovalForAll':
      node.acts.push(approvalAct({ std: 'nft_all', token: T, owner: S, spender: lc(a.operator), amount: null, via: 'setApprovalForAll', revoke: !a.approved }));
      break;
    // ----- transferts
    case 'transfer':
      node.acts.push(xfer({ token: T, from: S, to: lc(a.to), amount: a.amount }));
      break;
    case 'transferFrom':
      node.acts.push(xfer({ token: T, from: lc(a.from), to: lc(a.to), amount: a.amount, ambiguous721: true }));
      break;
    case 'safeTransferFrom721': case 'safeTransferFrom721b':
      node.acts.push(xfer({ std: 'erc721', token: T, from: lc(a.from), to: lc(a.to), amount: 1n, id: a.tokenId }));
      break;
    case 'safeTransferFrom1155':
      node.acts.push(xfer({ std: 'erc1155', token: T, from: lc(a.from), to: lc(a.to), amount: a.amount, id: a.id }));
      break;
    case 'safeBatchTransferFrom1155':
      a.ids.forEach((tid, i) => node.acts.push(xfer({ std: 'erc1155', token: T, from: lc(a.from), to: lc(a.to), amount: a.amounts[i] ?? 0n, id: tid })));
      break;
    case 'permit2612':
      node.acts.push(approvalAct({ token: T, owner: lc(a.owner), spender: lc(a.spender), amount: a.value, via: 'permit', expiry: Number(a.deadline), revoke: a.value === 0n, submittedBy: S }));
      break;
    case 'permitDAI':
      node.acts.push(approvalAct({ token: T, owner: lc(a.holder), spender: lc(a.spender), amount: a.allowed ? (1n << 256n) - 1n : 0n, via: 'permit', expiry: Number(a.expiry), revoke: !a.allowed, submittedBy: S, dai: true }));
      break;
    case 'wethDeposit':
      node.acts.push(xfer({ token: T, from: T, to: S, amount: node.value, synthetic: true }));
      break;
    case 'wethWithdraw':
      node.acts.push(xfer({ token: T, from: S, to: T, amount: a.wad }));
      node.acts.push(xfer({ std: 'native', token: ADDR.NATIVE, from: T, to: S, amount: a.wad, synthetic: true }));
      break;
    // ----- Permit2
    case 'p2.approve':
      node.acts.push(approvalAct({ std: 'permit2', token: lc(a.token), owner: S, spender: lc(a.spender), amount: a.amount, via: 'permit2', expiry: Number(a.expiration), revoke: a.amount === 0n }));
      break;
    case 'p2.permitSingle': {
      const d = a.permitSingle.details;
      node.acts.push(approvalAct({ std: 'permit2', token: lc(d.token), owner: lc(a.owner), spender: lc(a.permitSingle.spender), amount: d.amount, via: 'permit2', expiry: Number(d.expiration), sigDeadline: Number(a.permitSingle.sigDeadline), revoke: d.amount === 0n, submittedBy: S }));
      break;
    }
    case 'p2.permitBatch':
      for (const d of a.permitBatch.details)
        node.acts.push(approvalAct({ std: 'permit2', token: lc(d.token), owner: lc(a.owner), spender: lc(a.permitBatch.spender), amount: d.amount, via: 'permit2', expiry: Number(d.expiration), sigDeadline: Number(a.permitBatch.sigDeadline), revoke: d.amount === 0n, submittedBy: S }));
      break;
    case 'p2.permitTransferFrom': case 'p2.permitWitnessTransferFrom':
      node.acts.push(xfer({ token: lc(a.permit.permitted.token), from: lc(a.owner), to: lc(a.transferDetails.to), amount: a.transferDetails.requestedAmount, signedMax: a.permit.permitted.amount, via: 'permit2-signature', witness: id.includes('Witness') ? a.witness : undefined, submittedBy: S }));
      break;
    case 'p2.permitTransferFromBatch': case 'p2.permitWitnessTransferFromBatch':
      a.permit.permitted.forEach((p, i) => node.acts.push(xfer({ token: lc(p.token), from: lc(a.owner), to: lc(a.transferDetails[i]?.to), amount: a.transferDetails[i]?.requestedAmount ?? 0n, signedMax: p.amount, via: 'permit2-signature', witness: id.includes('Witness') ? a.witness : undefined, submittedBy: S })));
      break;
    case 'p2.transferFrom':
      node.acts.push(xfer({ token: lc(a.token), from: lc(a.from), to: lc(a.to), amount: a.amount, via: 'permit2-allowance' }));
      break;
    case 'p2.transferFromBatch':
      for (const d of a.transferDetails) node.acts.push(xfer({ token: lc(d.token), from: lc(d.from), to: lc(d.to), amount: d.amount, via: 'permit2-allowance' }));
      break;
    case 'p2.lockdown':
      flag(node, 'permit2_lockdown', 'info', 'révocation Permit2');
      break;
    // ----- appels groupés
    case 'mc3.aggregate3': case 'mc3.aggregate3Value': {
      a.calls.forEach((c, i) => {
        const ch = child(ctx, node, { to: c.target, data: c.callData, value: c.value ?? 0n, sender: T }, i);
        if (ch) ch.allowFailure = !!c.allowFailure;
      });
      break;
    }
    case 'mc3.aggregate': case 'mc3.tryAggregate':
      a.calls.forEach((c, i) => child(ctx, node, { to: c.target, data: c.callData, value: 0n, sender: T }, i));
      break;
    case 'multicall': case 'multicallDeadline': case 'multicallBlock':
      // multicall(bytes[]) des routeurs : delegatecall sur soi-même, msg.sender conservé
      a.data.forEach((d, i) => child(ctx, node, { to: T, data: d, value: 0n, sender: S }, i));
      break;
    case 'ur.execute2': case 'ur.execute3':
      universalRouter(ctx, node, a.commands, a.inputs);
      break;
    // ----- swaps V2/V3
    case 'v2.swapExactTokensForTokens': case 'v2.swapExactTokensForTokensFee': case 'v2.swapExactTokensForETH': case 'v2.swapExactTokensForETHFee':
      swapAct(ctx, node, { recipient: a.to, tokenIn: a.path[0], tokenOut: id.includes('ForETH') ? ADDR.NATIVE : a.path[a.path.length - 1], amountIn: a.amountIn, minOut: a.amountOutMin, inKind: 'exact', outKind: 'min' });
      break;
    case 'v2.swapTokensForExactTokens': case 'v2.swapTokensForExactETH':
      swapAct(ctx, node, { recipient: a.to, tokenIn: a.path[0], tokenOut: id.endsWith('ETH') ? ADDR.NATIVE : a.path[a.path.length - 1], amountIn: a.amountInMax, minOut: a.amountOut, inKind: 'max', outKind: 'exact' });
      break;
    case 'v2.swapExactETHForTokens': case 'v2.swapExactETHForTokensFee':
      swapAct(ctx, node, { recipient: a.to, tokenIn: ADDR.NATIVE, tokenOut: a.path[a.path.length - 1], amountIn: node.value, minOut: a.amountOutMin, inKind: 'exact', outKind: 'min', nativeIn: true });
      break;
    case 'v2.swapETHForExactTokens':
      swapAct(ctx, node, { recipient: a.to, tokenIn: ADDR.NATIVE, tokenOut: a.path[a.path.length - 1], amountIn: node.value, minOut: a.amountOut, inKind: 'max', outKind: 'exact', nativeIn: true });
      break;
    case 'v3.exactInputSingle': case 'v3.exactInputSingle02':
      swapAct(ctx, node, { recipient: a.params.recipient, tokenIn: a.params.tokenIn, tokenOut: a.params.tokenOut, amountIn: a.params.amountIn, minOut: a.params.amountOutMinimum, inKind: 'exact', outKind: 'min' });
      break;
    case 'v3.exactInput': case 'v3.exactInput02': {
      const [tin, tout] = pathEnds(a.params.path);
      swapAct(ctx, node, { recipient: a.params.recipient, tokenIn: tin, tokenOut: tout, amountIn: a.params.amountIn, minOut: a.params.amountOutMinimum, inKind: 'exact', outKind: 'min' });
      break;
    }
    // ----- Safe
    case 'safe.execTransaction': case 'safe.execFromModule': {
      ctx.actors.add(T); // le Safe est le compte protégé
      if (id === 'safe.execFromModule') flag(node, 'safe_module_exec', 'warn', `exécution via module ${S}`);
      const delegate = a.operation === 1n;
      node.safeTx = { to: lc(a.to), value: a.value, operation: Number(a.operation) };
      if (a.operation > 1n) { node.opaque = true; flag(node, 'safe_bad_operation', 'warn', 'operation inconnue ' + a.operation); break; }
      if (delegate) safeDelegate(ctx, node, lc(a.to), a.data, 0);
      else child(ctx, node, { to: a.to, data: a.data, value: a.value, sender: T, op: 'call' }, 0);
      break;
    }
    case 'safe.multiSend':
      multiSend(ctx, node, a.transactions);
      break;
    // ----- contrôle
    case 'transferOwnership': control(node, 'transferOwnership', lc(a.newOwner), {}); break;
    case 'acceptOwnership': control(node, 'acceptOwnership', S, {}, 'info'); break;
    case 'renounceOwnership': control(node, 'renounceOwnership', ADDR.ZERO, {}); break;
    case 'grantRole': control(node, 'grantRole', lc(a.account), { role: a.role, adminRole: /^0x0{64}$/.test(a.role) }); break;
    case 'revokeRole': control(node, 'revokeRole', lc(a.account), { role: a.role, adminRole: /^0x0{64}$/.test(a.role) }); break;
    case 'renounceRole': control(node, 'renounceRole', lc(a.callerConfirmation), { role: a.role }); break;
    case 'upgradeTo': control(node, 'upgrade', lc(a.newImplementation), {}); break;
    case 'upgradeToAndCall': control(node, 'upgrade', lc(a.newImplementation), { initData: a.data.length > 2 }); break;
    case 'proxyAdmin.upgrade': control(node, 'upgrade', lc(a.implementation), { proxy: lc(a.proxy) }); break;
    case 'proxyAdmin.upgradeAndCall': control(node, 'upgrade', lc(a.implementation), { proxy: lc(a.proxy), initData: a.data.length > 2 }); break;
    case 'changeAdmin': control(node, 'changeAdmin', lc(a.newAdmin), {}); break;
    case 'setOwner': control(node, 'setOwner', lc(a.owner), {}); break;
    case 'setAuthority': control(node, 'setAuthority', lc(a.authority), {}); break;
    case 'safe.addOwnerWithThreshold': control(node, 'safe.addOwner', lc(a.owner), { threshold: a._threshold }); break;
    case 'safe.removeOwner': control(node, 'safe.removeOwner', lc(a.owner), { threshold: a._threshold }); break;
    case 'safe.swapOwner': control(node, 'safe.swapOwner', lc(a.newOwner), { replaced: lc(a.oldOwner) }); break;
    case 'safe.changeThreshold': control(node, 'safe.changeThreshold', T, { threshold: a._threshold }); break;
    case 'safe.enableModule': control(node, 'safe.enableModule', lc(a.module), {}); break;
    case 'safe.disableModule': control(node, 'safe.disableModule', lc(a.module), {}); break;
    case 'safe.setGuard': control(node, 'safe.setGuard', lc(a.guard), {}); break;
    case 'safe.setModuleGuard': control(node, 'safe.setModuleGuard', lc(a.moduleGuard), {}); break;
    case 'safe.setFallbackHandler': control(node, 'safe.setFallbackHandler', lc(a.handler), {}); break;
    case 'ens.setOwner': control(node, 'ens.setOwner', lc(a.owner), { node: a.node }); break;
    case 'ens.setSubnodeOwner': control(node, 'ens.setSubnodeOwner', lc(a.owner), { node: a.node, label: a.label }); break;
    case 'ens.setResolver': control(node, 'ens.setResolver', lc(a.resolver), { node: a.node }); break;
    case 'ens.setRecord': control(node, 'ens.setRecord', lc(a.owner), { node: a.node, resolver: lc(a.resolver) }); break;
    case 'ens.reclaim': control(node, 'ens.reclaim', lc(a.owner), { id: a.id }); break;
    case 'ens.setAddr': control(node, 'ens.setAddr', lc(a.a), { node: a.node }); break;
    case 'erc7579.installModule': control(node, 'erc7579.installModule', lc(a.module), { moduleType: a.moduleTypeId }); break;
    case 'erc7579.uninstallModule': control(node, 'erc7579.uninstallModule', lc(a.module), { moduleType: a.moduleTypeId }); break;
    // ----- ERC-4337
    case 'aa.handleOpsV06': case 'aa.handleOpsV07': {
      flag(node, 'erc4337_handleOps', 'warn', `${a.ops.length} UserOperation(s) via EntryPoint ${T}`);
      node.userOps = a.ops.map((o) => ({ sender: lc(o.sender), initCode: o.initCode.length > 2, paymaster: o.paymasterAndData.length > 2, callDataLen: (o.callData.length - 2) / 2 }));
      a.ops.forEach((o, i) => {
        if (o.initCode.length > 2) flag(node, 'aa_account_creation', 'info', `op ${i}: initCode (création de compte)`);
        if (o.callData.length > 2) child(ctx, node, { to: o.sender, data: o.callData, value: 0n, sender: T }, i);
      });
      break;
    }
    case 'aa.execute':
      child(ctx, node, { to: a.dest, data: a.func, value: a.value, sender: T }, 0);
      break;
    case 'aa.executeBatch':
      a.dest.forEach((d, i) => child(ctx, node, { to: d, data: a.func[i] ?? '0x', value: 0n, sender: T }, i));
      break;
    case 'aa.executeBatchV':
      a.dest.forEach((d, i) => child(ctx, node, { to: d, data: a.func[i] ?? '0x', value: a.value[i] ?? 0n, sender: T }, i));
      break;
    case 'aa.execute7579': erc7579Execute(ctx, node, a.mode, a.executionCalldata); break;
    default:
      node.opaque = true; flag(node, 'no_handler', 'warn', id);
  }
}

function pathEnds(pathHex) {
  const b = strip0x(pathHex);
  if (b.length < 86) throw new DecodeError('chemin V3 trop court');
  return ['0x' + b.slice(0, 40), '0x' + b.slice(b.length - 40)];
}

function swapAct(ctx, node, p) {
  const S = node.sender;
  const recipient = resolveRecipient(ctx, p.recipient, node.to);
  const act = { t: 'swap', router: node.to, recipient, tokenIn: lc(p.tokenIn), tokenOut: lc(p.tokenOut), amountIn: p.amountIn, minOut: p.minOut, inKind: p.inKind, outKind: p.outKind };
  node.acts.push(act);
  if (!p.nativeIn && p.amountIn != null) node.acts.push(xfer({ token: lc(p.tokenIn), from: S, to: node.to, amount: p.amountIn, bound: p.inKind, viaSwap: true, std: lc(p.tokenIn) === ADDR.NATIVE ? 'native' : 'erc20' }));
  if (recipient === S) node.acts.push(xfer({ token: lc(p.tokenOut), from: node.to, to: S, amount: p.minOut, bound: p.outKind, viaSwap: true, std: lc(p.tokenOut) === ADDR.NATIVE ? 'native' : 'erc20' }));
}

function control(node, type, subject, detail, severity = 'critical') {
  node.acts.push({ t: 'control', type, target: node.to, subject, detail, severity, sender: node.sender });
}

export function safeDelegate(ctx, node, to, data, i) {
  const official = MULTISEND_OFFICIAL[to];
  if (official) {
    flag(node, 'delegatecall_official_multisend', 'info', official);
    const c = child(ctx, node, { to, data, value: 0n, sender: node.to, op: 'delegatecall' }, i);
    return c;
  }
  node.acts.push({ t: 'delegatecall', target: to, inside: node.to });
  flag(node, 'delegatecall_unknown_target', 'critical', `delegatecall depuis ${node.to} vers ${to} (hors MultiSend officiel)`);
  node.opaque = true;
  return null;
}

function multiSend(ctx, node, txsHex) {
  const b = fromHex(txsHex);
  let p = 0, i = 0;
  const actor = node.sender; // delegatecall depuis le Safe : msg.sender des sous-appels = le Safe
  while (p < b.length) {
    if (p + 85 > b.length) { node.opaque = true; flag(node, 'multisend_truncated', 'warn', 'paquet MultiSend tronqué'); return; }
    const op = b[p];
    const to = toHex(b.subarray(p + 1, p + 21));
    const value = BigInt(toHex(b.subarray(p + 21, p + 53)));
    const len = Number(BigInt(toHex(b.subarray(p + 53, p + 85))));
    if (p + 85 + len > b.length) { node.opaque = true; flag(node, 'multisend_truncated', 'warn', 'dataLength dépasse le paquet'); return; }
    const data = toHex(b.subarray(p + 85, p + 85 + len));
    if (op === 1) {
      safeDelegate(ctx, node, lc(to), data, i);
      flag(node, 'multisend_inner_delegatecall', 'critical', `sous-appel ${i} en delegatecall vers ${to}`);
    } else if (op === 0) child(ctx, node, { to, data, value, sender: actor }, i);
    else { node.opaque = true; flag(node, 'multisend_bad_op', 'warn', `op ${op}`); }
    p += 85 + len; i++;
  }
}

function erc7579Execute(ctx, node, mode, calldataHex) {
  const callType = mode.slice(2, 4);
  const b = fromHex(calldataHex);
  if (callType === '00') {
    if (b.length < 52) { node.opaque = true; flag(node, 'decode_error', 'warn', '7579 single trop court'); return; }
    child(ctx, node, { to: toHex(b.subarray(0, 20)), value: BigInt(toHex(b.subarray(20, 52))), data: toHex(b.subarray(52)), sender: node.to }, 0);
  } else if (callType === '01') {
    const arr = dec('(address target,uint256 value,bytes callData)[] execs', calldataHex).execs;
    arr.forEach((e, i) => child(ctx, node, { to: e.target, value: e.value, data: e.callData, sender: node.to }, i));
  } else if (callType === 'ff') {
    flag(node, 'delegatecall_unknown_target', 'critical', 'compte ERC-7579: mode delegatecall');
    node.acts.push({ t: 'delegatecall', target: toHex(b.subarray(0, 20)), inside: node.to }); node.opaque = true;
  } else { node.opaque = true; flag(node, 'decode_error', 'warn', 'callType 7579 inconnu ' + callType); }
}

// ---- Universal Router
export const UR_COMMANDS = {
  0x00: 'V3_SWAP_EXACT_IN', 0x01: 'V3_SWAP_EXACT_OUT', 0x02: 'PERMIT2_TRANSFER_FROM', 0x03: 'PERMIT2_PERMIT_BATCH', 0x04: 'SWEEP',
  0x05: 'TRANSFER', 0x06: 'PAY_PORTION', 0x08: 'V2_SWAP_EXACT_IN', 0x09: 'V2_SWAP_EXACT_OUT', 0x0a: 'PERMIT2_PERMIT', 0x0b: 'WRAP_ETH',
  0x0c: 'UNWRAP_WETH', 0x0d: 'PERMIT2_TRANSFER_FROM_BATCH', 0x0e: 'BALANCE_CHECK_ERC20', 0x10: 'V4_SWAP', 0x11: 'V3_POSITION_MANAGER_PERMIT',
  0x12: 'V3_POSITION_MANAGER_CALL', 0x13: 'V4_INITIALIZE_POOL', 0x14: 'V4_POSITION_MANAGER_CALL', 0x21: 'EXECUTE_SUB_PLAN',
};
const PERMIT_DETAILS = '(address token,uint160 amount,uint48 expiration,uint48 nonce)';

function universalRouter(ctx, node, commandsHex, inputs) {
  const cmds = fromHex(commandsHex);
  node.urCommands = [];
  if (cmds.length !== inputs.length) { node.opaque = true; flag(node, 'ur_length_mismatch', 'warn', `${cmds.length} commandes / ${inputs.length} inputs`); }
  const S = node.sender, R = node.to;
  cmds.forEach((byte, i) => {
    const code = byte & 0x3f, allowRevert = !!(byte & 0x80);
    const name = UR_COMMANDS[code];
    const input = inputs[i];
    const entry = { index: i, code, name: name || 'UNKNOWN', allowRevert };
    node.urCommands.push(entry);
    if (input === undefined) return;
    try {
      switch (code) {
        case 0x00: case 0x01: {
          const x = dec('address recipient,uint256 amt,uint256 limit,bytes path,bool payerIsUser', input);
          const [first, last] = pathEnds(x.path);
          const exactIn = code === 0x00;
          swapUR(ctx, node, entry, { recipient: x.recipient, tokenIn: exactIn ? first : last, tokenOut: exactIn ? last : first, amountIn: exactIn ? x.amt : x.limit, minOut: exactIn ? x.limit : x.amt, inKind: exactIn ? 'exact' : 'max', outKind: exactIn ? 'min' : 'exact', payerIsUser: x.payerIsUser });
          break;
        }
        case 0x08: case 0x09: {
          const x = dec('address recipient,uint256 amt,uint256 limit,address[] path,bool payerIsUser', input);
          const exactIn = code === 0x08;
          swapUR(ctx, node, entry, { recipient: x.recipient, tokenIn: x.path[0], tokenOut: x.path[x.path.length - 1], amountIn: exactIn ? x.amt : x.limit, minOut: exactIn ? x.limit : x.amt, inKind: exactIn ? 'exact' : 'max', outKind: exactIn ? 'min' : 'exact', payerIsUser: x.payerIsUser });
          break;
        }
        case 0x02: { // PERMIT2_TRANSFER_FROM : le routeur tire via Permit2 le token de l'utilisateur vers recipient
          const x = dec('address token,address recipient,uint160 amount', input);
          node.acts.push(xfer({ token: lc(x.token), from: S, to: resolveRecipient(ctx, x.recipient, R), amount: x.amount, via: 'permit2-allowance', viaUR: true }));
          break;
        }
        case 0x0d: {
          const x = dec('(address from,address to,uint160 amount,address token)[] d', input);
          for (const d of x.d) node.acts.push(xfer({ token: lc(d.token), from: lc(d.from), to: resolveRecipient(ctx, d.to, R), amount: d.amount, via: 'permit2-allowance', viaUR: true }));
          break;
        }
        case 0x0a: {
          const x = dec(`(${PERMIT_DETAILS} details,address spender,uint256 sigDeadline) permitSingle,bytes sig`, input);
          const d = x.permitSingle.details;
          node.acts.push(approvalAct({ std: 'permit2', token: lc(d.token), owner: S, spender: resolveRecipient(ctx, x.permitSingle.spender, R), amount: d.amount, via: 'permit2', expiry: Number(d.expiration), sigDeadline: Number(x.permitSingle.sigDeadline), revoke: d.amount === 0n, viaUR: true }));
          break;
        }
        case 0x03: {
          const x = dec(`(${PERMIT_DETAILS}[] details,address spender,uint256 sigDeadline) permitBatch,bytes sig`, input);
          for (const d of x.permitBatch.details)
            node.acts.push(approvalAct({ std: 'permit2', token: lc(d.token), owner: S, spender: resolveRecipient(ctx, x.permitBatch.spender, R), amount: d.amount, via: 'permit2', expiry: Number(d.expiration), sigDeadline: Number(x.permitBatch.sigDeadline), revoke: d.amount === 0n, viaUR: true }));
          break;
        }
        case 0x04: case 0x05: { // SWEEP / TRANSFER : le routeur envoie son solde à recipient
          const x = code === 0x04 ? dec('address token,address recipient,uint256 amt', input) : dec('address token,address recipient,uint256 amt', input);
          const rcpt = resolveRecipient(ctx, x.recipient, R);
          node.acts.push(xfer({ token: lc(x.token), from: R, to: rcpt, amount: x.amt, bound: code === 0x04 ? 'min' : 'exact', viaUR: true, sweep: true, std: lc(x.token) === ADDR.NATIVE || lc(x.token) === ADDR.ZERO ? 'native' : 'erc20' }));
          break;
        }
        case 0x06: {
          const x = dec('address token,address recipient,uint256 bips', input);
          entry.fee = { token: lc(x.token), recipient: resolveRecipient(ctx, x.recipient, R), bips: x.bips };
          flag(node, 'ur_pay_portion', 'info', `commission ${x.bips} bips vers ${entry.fee.recipient}`);
          break;
        }
        case 0x0b: { const x = dec('address recipient,uint256 amount', input); entry.wrap = x.amount; break; }
        case 0x0c: {
          const x = dec('address recipient,uint256 amountMin', input);
          node.acts.push(xfer({ std: 'native', token: ADDR.NATIVE, from: R, to: resolveRecipient(ctx, x.recipient, R), amount: x.amountMin, bound: 'min', viaUR: true, sweep: true }));
          break;
        }
        case 0x21: {
          const x = dec('bytes commands,bytes[] inputs', input);
          const sub = mkNode({ to: R, data: '0x', sender: S }, node.depth + 1, node.path + '.sub' + i);
          sub.name = 'EXECUTE_SUB_PLAN'; sub.family = 'router';
          universalRouter(ctx, sub, x.commands, x.inputs);
          node.children.push(sub);
          break;
        }
        case 0x0e: break; // BALANCE_CHECK_ERC20 : sans effet
        case 0x10: case 0x11: case 0x12: case 0x13: case 0x14:
          node.opaque = true; entry.opaque = true; flag(node, 'ur_command_opaque', 'warn', `${name} (${input.length / 2 - 1} octets) non décodé`);
          break;
        default:
          node.opaque = true; entry.opaque = true; flag(node, 'ur_command_unknown', 'warn', `commande 0x${code.toString(16)} inconnue`);
      }
    } catch (err) { node.opaque = true; entry.error = err.message; flag(node, 'decode_error', 'warn', `UR ${name}: ${err.message}`); }
  });
}

function swapUR(ctx, node, entry, p) {
  const S = node.sender, R = node.to;
  const recipient = resolveRecipient(ctx, p.recipient, R);
  const tin = lc(p.tokenIn), tout = lc(p.tokenOut);
  const exactBalance = p.amountIn === CONTRACT_BALANCE;
  node.acts.push({ t: 'swap', router: R, recipient, tokenIn: tin, tokenOut: tout, amountIn: exactBalance ? null : p.amountIn, minOut: p.minOut, inKind: p.inKind, outKind: p.outKind, via: 'universal-router' });
  if (p.payerIsUser && !exactBalance) node.acts.push(xfer({ token: tin, from: S, to: R, amount: p.amountIn, bound: p.inKind, viaSwap: true, viaUR: true }));
  if (recipient === S) node.acts.push(xfer({ token: tout, from: R, to: S, amount: p.minOut, bound: p.outKind, viaSwap: true, viaUR: true }));
  // recipient = routeur : la livraison finale vient d'un SWEEP / UNWRAP ; recipient tiers : signalé par les règles
  entry.swap = { recipient, tokenIn: tin, tokenOut: tout };
}

// ---- indices dans un appel opaque : sélecteurs sensibles alignés sur 32 octets (appels encapsulés dans des bytes). Heuristique faible, jamais un verdict d'effet.
const SENSITIVE_FAMILIES = new Set(['allowance', 'permit', 'permit2', 'control']);
export function scanEmbedded(node, dataHex) {
  const hex = strip0x(dataHex);
  const found = [];
  for (let pos = 4; pos + 4 <= hex.length / 2 && found.length < 20; pos += 32) {
    const sel = '0x' + hex.slice(pos * 2, pos * 2 + 8);
    const cands = BY_SELECTOR.get(sel);
    if (!cands) continue;
    const e = cands.find((c) => SENSITIVE_FAMILIES.has(c.family) || c.id === 'transferFrom');
    if (!e) continue;
    let args = null;
    try { args = decodeParams(e.params, '0x' + hex.slice(pos * 2 + 8)); } catch { continue; }
    const brief = {};
    for (const [k, v] of Object.entries(args)) if (typeof v === 'string' && v.length <= 66) brief[k] = v; else if (typeof v === 'bigint') brief[k] = v >= (1n << 128n) ? 'unlimited' : v.toString(); else if (typeof v === 'boolean') brief[k] = v;
    found.push({ offset: pos, id: e.id, name: e.name, family: e.family, args: brief });
  }
  if (!found.length) return;
  node.embedded = found;
  const hard = found.some((f) => (['approve', 'increaseAllowance', 'permit2612', 'permitDAI', 'p2.approve', 'p2.permitSingle', 'p2.permitBatch'].includes(f.id) && Object.values(f.args).includes('unlimited')) || f.id === 'permitDAI' || (f.id === 'setApprovalForAll' && f.args.approved === true) || f.family === 'control');
  flag(node, 'embedded_calls', hard ? 'critical' : 'warn', 'appel opaque contenant ' + found.map((f) => f.name).join(', ') + ' (heuristique, non décodé au sens strict)');
}

// ---- aplatissement
export function walk(node, fn) { fn(node); for (const c of node.children) walk(c, fn); }
export function collect(root) {
  const acts = [], flags = [], nodes = [];
  walk(root, (n) => { nodes.push(n); for (const a of n.acts) acts.push({ ...a, _path: n.path, _allowFailure: n.allowFailure }); for (const f of n.flags) flags.push({ ...f, path: n.path }); });
  return { acts, flags, nodes, opaque: nodes.some((n) => n.opaque) };
}
export { isUnlimited };

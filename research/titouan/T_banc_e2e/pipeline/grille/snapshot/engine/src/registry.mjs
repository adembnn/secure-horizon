// Registre des signatures. Les sélecteurs sont TOUJOURS calculés par keccak256 (jamais écrits à la main).
import { parseSig } from './abi.mjs';

export const ADDR = {
  PERMIT2: '0x000000000022d473030f116ddee9f6b43ac78ba3',
  MULTICALL3: '0xca11bde05977b3631167028862be2a173976ca11',
  ZERO: '0x0000000000000000000000000000000000000000',
  UR_MSG_SENDER: '0x0000000000000000000000000000000000000001',
  UR_ADDRESS_THIS: '0x0000000000000000000000000000000000000002',
  NATIVE: 'native',
};
// MultiSend officiels (adresses citées de mémoire : vérifiées par eth_getCode dans les tests réels)
export const MULTISEND_OFFICIAL = {
  '0xa238cbeb142c10ef7ad8442c6d1f9e89e07e7761': 'MultiSend 1.3.0',
  '0x40a2accbd92bca938b02010e17a5b8929b49130d': 'MultiSendCallOnly 1.3.0',
  '0x8d29be29923b68abfdd21e541b9374737b49cdad': 'MultiSend 1.1.1',
  '0x38869bf66a61cf6bdb996a6ae40d5853fd43b526': 'MultiSend 1.4.1',
  '0x9641d764fc13c8b624c04430c7356c1c7c8102e2': 'MultiSendCallOnly 1.4.1',
};
const TP = '(address token,uint160 amount,uint48 expiration,uint48 nonce)';

// [id, famille, signature nommée]
const RAW = [
  // --- ERC-20 / ERC-721 / ERC-1155
  ['approve', 'allowance', 'approve(address spender,uint256 amount)'],
  ['increaseAllowance', 'allowance', 'increaseAllowance(address spender,uint256 addedValue)'],
  ['decreaseAllowance', 'allowance', 'decreaseAllowance(address spender,uint256 subtractedValue)'],
  ['setApprovalForAll', 'allowance', 'setApprovalForAll(address operator,bool approved)'],
  ['transfer', 'transfer', 'transfer(address to,uint256 amount)'],
  ['transferFrom', 'transfer', 'transferFrom(address from,address to,uint256 amount)'],
  ['safeTransferFrom721', 'transfer', 'safeTransferFrom(address from,address to,uint256 tokenId)'],
  ['safeTransferFrom721b', 'transfer', 'safeTransferFrom(address from,address to,uint256 tokenId,bytes data)'],
  ['safeTransferFrom1155', 'transfer', 'safeTransferFrom(address from,address to,uint256 id,uint256 amount,bytes data)'],
  ['safeBatchTransferFrom1155', 'transfer', 'safeBatchTransferFrom(address from,address to,uint256[] ids,uint256[] amounts,bytes data)'],
  ['permit2612', 'permit', 'permit(address owner,address spender,uint256 value,uint256 deadline,uint8 v,bytes32 r,bytes32 s)'],
  ['permitDAI', 'permit', 'permit(address holder,address spender,uint256 nonce,uint256 expiry,bool allowed,uint8 v,bytes32 r,bytes32 s)'],
  ['wethDeposit', 'wrap', 'deposit()'],
  ['wethWithdraw', 'wrap', 'withdraw(uint256 wad)'],
  // --- Permit2
  ['p2.approve', 'permit2', 'approve(address token,address spender,uint160 amount,uint48 expiration)'],
  ['p2.permitSingle', 'permit2', `permit(address owner,(${TP} details,address spender,uint256 sigDeadline) permitSingle,bytes signature)`],
  ['p2.permitBatch', 'permit2', `permit(address owner,(${TP}[] details,address spender,uint256 sigDeadline) permitBatch,bytes signature)`],
  ['p2.permitTransferFrom', 'permit2', 'permitTransferFrom(((address token,uint256 amount) permitted,uint256 nonce,uint256 deadline) permit,(address to,uint256 requestedAmount) transferDetails,address owner,bytes signature)'],
  ['p2.permitTransferFromBatch', 'permit2', 'permitTransferFrom(((address token,uint256 amount)[] permitted,uint256 nonce,uint256 deadline) permit,(address to,uint256 requestedAmount)[] transferDetails,address owner,bytes signature)'],
  ['p2.permitWitnessTransferFrom', 'permit2', 'permitWitnessTransferFrom(((address token,uint256 amount) permitted,uint256 nonce,uint256 deadline) permit,(address to,uint256 requestedAmount) transferDetails,address owner,bytes32 witness,string witnessTypeString,bytes signature)'],
  ['p2.permitWitnessTransferFromBatch', 'permit2', 'permitWitnessTransferFrom(((address token,uint256 amount)[] permitted,uint256 nonce,uint256 deadline) permit,(address to,uint256 requestedAmount)[] transferDetails,address owner,bytes32 witness,string witnessTypeString,bytes signature)'],
  ['p2.transferFrom', 'permit2', 'transferFrom(address from,address to,uint160 amount,address token)'],
  ['p2.transferFromBatch', 'permit2', 'transferFrom((address from,address to,uint160 amount,address token)[] transferDetails)'],
  ['p2.lockdown', 'permit2', 'lockdown((address token,address spender)[] approvals)'],
  // --- exécution indirecte
  ['mc3.aggregate3', 'multicall', 'aggregate3((address target,bool allowFailure,bytes callData)[] calls)'],
  ['mc3.aggregate3Value', 'multicall', 'aggregate3Value((address target,bool allowFailure,uint256 value,bytes callData)[] calls)'],
  ['mc3.aggregate', 'multicall', 'aggregate((address target,bytes callData)[] calls)'],
  ['mc3.tryAggregate', 'multicall', 'tryAggregate(bool requireSuccess,(address target,bytes callData)[] calls)'],
  ['multicall', 'multicall', 'multicall(bytes[] data)'],
  ['multicallDeadline', 'multicall', 'multicall(uint256 deadline,bytes[] data)'],
  ['multicallBlock', 'multicall', 'multicall(bytes32 previousBlockhash,bytes[] data)'],
  ['ur.execute3', 'router', 'execute(bytes commands,bytes[] inputs,uint256 deadline)'],
  ['ur.execute2', 'router', 'execute(bytes commands,bytes[] inputs)'],
  ['v2.swapExactTokensForTokens', 'swap', 'swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)'],
  ['v2.swapTokensForExactTokens', 'swap', 'swapTokensForExactTokens(uint256 amountOut,uint256 amountInMax,address[] path,address to,uint256 deadline)'],
  ['v2.swapExactETHForTokens', 'swap', 'swapExactETHForTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)'],
  ['v2.swapExactTokensForETH', 'swap', 'swapExactTokensForETH(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)'],
  ['v2.swapETHForExactTokens', 'swap', 'swapETHForExactTokens(uint256 amountOut,address[] path,address to,uint256 deadline)'],
  ['v2.swapTokensForExactETH', 'swap', 'swapTokensForExactETH(uint256 amountOut,uint256 amountInMax,address[] path,address to,uint256 deadline)'],
  ['v2.swapExactTokensForTokensFee', 'swap', 'swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)'],
  ['v2.swapExactETHForTokensFee', 'swap', 'swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin,address[] path,address to,uint256 deadline)'],
  ['v2.swapExactTokensForETHFee', 'swap', 'swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)'],
  ['v3.exactInputSingle', 'swap', 'exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)'],
  ['v3.exactInputSingle02', 'swap', 'exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params)'],
  ['v3.exactInput', 'swap', 'exactInput((bytes path,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum) params)'],
  ['v3.exactInput02', 'swap', 'exactInput((bytes path,address recipient,uint256 amountIn,uint256 amountOutMinimum) params)'],
  // --- Safe
  ['safe.execTransaction', 'safe', 'execTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures)'],
  ['safe.execFromModule', 'safe', 'execTransactionFromModule(address to,uint256 value,bytes data,uint8 operation)'],
  ['safe.multiSend', 'safe', 'multiSend(bytes transactions)'],
  ['safe.addOwnerWithThreshold', 'control', 'addOwnerWithThreshold(address owner,uint256 _threshold)'],
  ['safe.removeOwner', 'control', 'removeOwner(address prevOwner,address owner,uint256 _threshold)'],
  ['safe.swapOwner', 'control', 'swapOwner(address prevOwner,address oldOwner,address newOwner)'],
  ['safe.changeThreshold', 'control', 'changeThreshold(uint256 _threshold)'],
  ['safe.enableModule', 'control', 'enableModule(address module)'],
  ['safe.disableModule', 'control', 'disableModule(address prevModule,address module)'],
  ['safe.setGuard', 'control', 'setGuard(address guard)'],
  ['safe.setModuleGuard', 'control', 'setModuleGuard(address moduleGuard)'],
  ['safe.setFallbackHandler', 'control', 'setFallbackHandler(address handler)'],
  // --- contrôle et rôles
  ['transferOwnership', 'control', 'transferOwnership(address newOwner)'],
  ['acceptOwnership', 'control', 'acceptOwnership()'],
  ['renounceOwnership', 'control', 'renounceOwnership()'],
  ['grantRole', 'control', 'grantRole(bytes32 role,address account)'],
  ['revokeRole', 'control', 'revokeRole(bytes32 role,address account)'],
  ['renounceRole', 'control', 'renounceRole(bytes32 role,address callerConfirmation)'],
  ['upgradeTo', 'control', 'upgradeTo(address newImplementation)'],
  ['upgradeToAndCall', 'control', 'upgradeToAndCall(address newImplementation,bytes data)'],
  ['proxyAdmin.upgrade', 'control', 'upgrade(address proxy,address implementation)'],
  ['proxyAdmin.upgradeAndCall', 'control', 'upgradeAndCall(address proxy,address implementation,bytes data)'],
  ['changeAdmin', 'control', 'changeAdmin(address newAdmin)'],
  ['setOwner', 'control', 'setOwner(address owner)'],
  ['setAuthority', 'control', 'setAuthority(address authority)'],
  ['ens.setOwner', 'control', 'setOwner(bytes32 node,address owner)'],
  ['ens.setSubnodeOwner', 'control', 'setSubnodeOwner(bytes32 node,bytes32 label,address owner)'],
  ['ens.setResolver', 'control', 'setResolver(bytes32 node,address resolver)'],
  ['ens.setRecord', 'control', 'setRecord(bytes32 node,address owner,address resolver,uint64 ttl)'],
  ['ens.reclaim', 'control', 'reclaim(uint256 id,address owner)'],
  ['ens.setAddr', 'control', 'setAddr(bytes32 node,address a)'],
  ['erc7579.installModule', 'control', 'installModule(uint256 moduleTypeId,address module,bytes initData)'],
  ['erc7579.uninstallModule', 'control', 'uninstallModule(uint256 moduleTypeId,address module,bytes deInitData)'],
  // --- ERC-4337
  ['aa.handleOpsV06', 'aa', 'handleOps((address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData,bytes signature)[] ops,address beneficiary)'],
  ['aa.handleOpsV07', 'aa', 'handleOps((address sender,uint256 nonce,bytes initCode,bytes callData,bytes32 accountGasLimits,uint256 preVerificationGas,bytes32 gasFees,bytes paymasterAndData,bytes signature)[] ops,address beneficiary)'],
  ['aa.execute7579', 'aa', 'execute(bytes32 mode,bytes executionCalldata)'],
  ['aa.execute', 'aa', 'execute(address dest,uint256 value,bytes func)'],
  ['aa.executeBatch', 'aa', 'executeBatch(address[] dest,bytes[] func)'],
  ['aa.executeBatchV', 'aa', 'executeBatch(address[] dest,uint256[] value,bytes[] func)'],
];

export const REGISTRY = RAW.map(([id, family, sig]) => ({ id, family, sig, ...parseSig(sig) }));
export const BY_SELECTOR = new Map();
for (const e of REGISTRY) { if (!BY_SELECTOR.has(e.selector)) BY_SELECTOR.set(e.selector, []); BY_SELECTOR.get(e.selector).push(e); }
export const BY_ID = new Map(REGISTRY.map((e) => [e.id, e]));

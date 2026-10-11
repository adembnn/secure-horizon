// Table de tous les typehash EIP-712 utilisés par le décodeur, recalculés par keccak256.
import { typeHash, encodeType } from './eip712.mjs';
const f = (name, type) => ({ name, type });
const PD = [f('token', 'address'), f('amount', 'uint160'), f('expiration', 'uint48'), f('nonce', 'uint48')];
const TP = [f('token', 'address'), f('amount', 'uint256')];
const OFFER = [f('itemType', 'uint8'), f('token', 'address'), f('identifierOrCriteria', 'uint256'), f('startAmount', 'uint256'), f('endAmount', 'uint256')];
export const DEFS = {
  'EIP712Domain(name,version,chainId,verifyingContract)': ['EIP712Domain', { EIP712Domain: [f('name', 'string'), f('version', 'string'), f('chainId', 'uint256'), f('verifyingContract', 'address')] }],
  'EIP712Domain(chainId,verifyingContract) [Safe]': ['EIP712Domain', { EIP712Domain: [f('chainId', 'uint256'), f('verifyingContract', 'address')] }],
  'EIP-2612 Permit': ['Permit', { Permit: [f('owner', 'address'), f('spender', 'address'), f('value', 'uint256'), f('nonce', 'uint256'), f('deadline', 'uint256')] }],
  'DAI Permit': ['Permit', { Permit: [f('holder', 'address'), f('spender', 'address'), f('nonce', 'uint256'), f('expiry', 'uint256'), f('allowed', 'bool')] }],
  'Permit2 PermitDetails': ['PermitDetails', { PermitDetails: PD }],
  'Permit2 PermitSingle': ['PermitSingle', { PermitSingle: [f('details', 'PermitDetails'), f('spender', 'address'), f('sigDeadline', 'uint256')], PermitDetails: PD }],
  'Permit2 PermitBatch': ['PermitBatch', { PermitBatch: [f('details', 'PermitDetails[]'), f('spender', 'address'), f('sigDeadline', 'uint256')], PermitDetails: PD }],
  'Permit2 TokenPermissions': ['TokenPermissions', { TokenPermissions: TP }],
  'Permit2 PermitTransferFrom': ['PermitTransferFrom', { PermitTransferFrom: [f('permitted', 'TokenPermissions'), f('spender', 'address'), f('nonce', 'uint256'), f('deadline', 'uint256')], TokenPermissions: TP }],
  'Permit2 PermitBatchTransferFrom': ['PermitBatchTransferFrom', { PermitBatchTransferFrom: [f('permitted', 'TokenPermissions[]'), f('spender', 'address'), f('nonce', 'uint256'), f('deadline', 'uint256')], TokenPermissions: TP }],
  'Seaport OfferItem': ['OfferItem', { OfferItem: OFFER }],
  'Seaport ConsiderationItem': ['ConsiderationItem', { ConsiderationItem: [...OFFER, f('recipient', 'address')] }],
  'Seaport OrderComponents': ['OrderComponents', { OrderComponents: [f('offerer', 'address'), f('zone', 'address'), f('offer', 'OfferItem[]'), f('consideration', 'ConsiderationItem[]'), f('orderType', 'uint8'), f('startTime', 'uint256'), f('endTime', 'uint256'), f('zoneHash', 'bytes32'), f('salt', 'uint256'), f('conduitKey', 'bytes32'), f('counter', 'uint256')], OfferItem: OFFER, ConsiderationItem: [...OFFER, f('recipient', 'address')] }],
  'CoW GPv2Order': ['Order', { Order: [f('sellToken', 'address'), f('buyToken', 'address'), f('receiver', 'address'), f('sellAmount', 'uint256'), f('buyAmount', 'uint256'), f('validTo', 'uint32'), f('appData', 'bytes32'), f('feeAmount', 'uint256'), f('kind', 'string'), f('partiallyFillable', 'bool'), f('sellTokenBalance', 'string'), f('buyTokenBalance', 'string')] }],
  'Safe SafeTx (>=1.0)': ['SafeTx', { SafeTx: [f('to', 'address'), f('value', 'uint256'), f('data', 'bytes'), f('operation', 'uint8'), f('safeTxGas', 'uint256'), f('baseGas', 'uint256'), f('gasPrice', 'uint256'), f('gasToken', 'address'), f('refundReceiver', 'address'), f('nonce', 'uint256')] }],
  'Coinbase SpendPermission': ['SpendPermission', { SpendPermission: [f('account', 'address'), f('spender', 'address'), f('token', 'address'), f('allowance', 'uint160'), f('period', 'uint48'), f('start', 'uint48'), f('end', 'uint48'), f('salt', 'uint256'), f('extraData', 'bytes')] }],
  'ERC-4337 v0.7 PackedUserOperation': ['PackedUserOperation', { PackedUserOperation: [f('sender', 'address'), f('nonce', 'uint256'), f('initCode', 'bytes'), f('callData', 'bytes'), f('accountGasLimits', 'bytes32'), f('preVerificationGas', 'uint256'), f('gasFees', 'bytes32'), f('paymasterAndData', 'bytes')] }],
};
export function allTypehashes() {
  const out = {};
  for (const [label, [primary, types]] of Object.entries(DEFS)) out[label] = { encodeType: encodeType(primary, types), typeHash: typeHash(primary, types) };
  return out;
}

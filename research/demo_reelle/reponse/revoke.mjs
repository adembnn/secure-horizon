// Hold up - recovery helper for the counterfactual : the user DID sign something dangerous.
// Reads what an owner has granted on chain, builds the exact revocation transactions for the WALLET to sign,
// and says what cannot be undone. This module never signs and never sends : it reads and builds.
//
//   node revoke.mjs --rpc http://127.0.0.1:8549 --owner 0x... [--spender 0x...] [--from-block N] [--permit-token 0x...]
//
// OBJECTIONS (stated on purpose)
// 1. "revoke.cash does this already." Yes, for everything, from an indexer. This helper is narrower : it starts
//    from one incident (one owner, optionally the one spender named in it) and outputs the transactions next to
//    the incident record. It is not a replacement for a full allowance review.
// 2. "eth_getLogs from block 0 does not work on a public RPC." True : public nodes cap the range. `fromBlock` and
//    `chunk` exist for that ; on Fuji or mainnet the honest answer is an indexer, which is not built here.
//    Tested only on a local chain.
// 3. "Revoking after the drain is too late." Often true : a drainer sweeps in the same block or minutes later.
//    Revocation protects what is left and what arrives later. The output says so (`cannot_undo`).
// 4. "An off-chain permit leaves no trace on chain, you cannot list it." True : scanGrants() cannot see a signed
//    permit that was not submitted yet. Only the journal knows a permit was requested. permitInvalidation() is
//    therefore driven by the incident (token + owner), not by the scan.
// 5. "The revocation costs gas and the wallet may be empty." True, and not solved here.
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const req = createRequire(join(resolve(HERE, '..', '..', '..', 'blockchain'), 'package.json'));
export const ethers = req('ethers'); // from blockchain/node_modules, no new dependency

const I = new ethers.Interface([
  'event Approval(address indexed owner, address indexed spender, uint256 value)', // ERC-20 (3 topics) ; ERC-721 uses the same signature with an indexed tokenId (4 topics)
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
  'function allowance(address,address) view returns (uint256)',
  'function isApprovedForAll(address,address) view returns (bool)',
  'function getApproved(uint256) view returns (address)',
  'function ownerOf(uint256) view returns (address)',
  'function approve(address,uint256)',
  'function setApprovalForAll(address,bool)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function version() view returns (string)',
  'function nonces(address) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
  'function eip712Domain() view returns (bytes1,string,string,uint256,address,bytes32,uint256[])',
  'function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)',
]);
const APPROVAL = I.getEvent('Approval').topicHash;
const APPROVAL_ALL = I.getEvent('ApprovalForAll').topicHash;
const pad = (a) => ethers.zeroPadValue(a, 32);
const call = async (provider, to, fn, args = []) => I.decodeFunctionResult(fn, await provider.call({ to, data: I.encodeFunctionData(fn, args) }));
const tryCall = async (...a) => { try { return await call(...a); } catch { return null; } };

// A recovery tool must not read a stale chain : ethers caches identical reads for 250 ms by default, which hid a
// grant made just before the scan. Use makeProvider() (cache off) ; the upper bound of a scan is always 'latest'.
export const makeProvider = (url) => new ethers.JsonRpcProvider(url, undefined, { batchMaxCount: 1, cacheTimeout: -1 });

async function logs(provider, filter, fromBlock, chunk) {
  if (!chunk) return provider.getLogs({ ...filter, fromBlock, toBlock: 'latest' });
  const latest = Number(await provider.send('eth_blockNumber', []));
  const out = [];
  for (let b = fromBlock; b <= latest; b += chunk) out.push(...await provider.getLogs({ ...filter, fromBlock: b, toBlock: b + chunk > latest ? 'latest' : b + chunk - 1 }));
  return out;
}

/**
 * Rights `owner` has granted and that are STILL live on chain (the events only give candidates, the current
 * state is read back for each). -> [{ kind: 'erc20' | 'erc721_all' | 'erc721_one', token, spender, ... }]
 */
export async function scanGrants(provider, owner, { spender, fromBlock = 0, chunk = 0 } = {}) {
  owner = ethers.getAddress(owner);
  const sp = spender ? pad(ethers.getAddress(spender)) : null;
  const [ap, all] = await Promise.all([
    logs(provider, { topics: [APPROVAL, pad(owner), sp] }, fromBlock, chunk),
    logs(provider, { topics: [APPROVAL_ALL, pad(owner), sp] }, fromBlock, chunk),
  ]);
  const seen = new Set(), grants = [];
  const once = (k) => (seen.has(k) ? false : (seen.add(k), true));
  for (const l of ap) {
    const token = ethers.getAddress(l.address), who = ethers.getAddress('0x' + l.topics[2].slice(26));
    if (l.topics.length === 3) { // ERC-20
      if (!once(`20|${token}|${who}`)) continue;
      const r = await tryCall(provider, token, 'allowance', [owner, who]);
      if (!r || r[0] === 0n) continue;
      const [sym, dec] = [await tryCall(provider, token, 'symbol'), await tryCall(provider, token, 'decimals')];
      grants.push({ kind: 'erc20', token, spender: who, allowance: r[0].toString(), unlimited: r[0] >= 2n ** 255n, symbol: sym ? sym[0] : null, decimals: dec ? Number(dec[0]) : null });
    } else if (l.topics.length === 4) { // ERC-721 single token
      const tokenId = BigInt(l.topics[3]);
      if (who === ethers.ZeroAddress || !once(`721|${token}|${tokenId}`)) continue;
      const [cur, own] = [await tryCall(provider, token, 'getApproved', [tokenId]), await tryCall(provider, token, 'ownerOf', [tokenId])];
      if (!cur || !own || cur[0] === ethers.ZeroAddress || own[0] !== owner) continue;
      if (spender && cur[0] !== ethers.getAddress(spender)) continue;
      grants.push({ kind: 'erc721_one', token, spender: cur[0], tokenId: tokenId.toString() });
    }
  }
  for (const l of all) {
    const token = ethers.getAddress(l.address), who = ethers.getAddress('0x' + l.topics[2].slice(26));
    if (!once(`all|${token}|${who}`)) continue;
    const r = await tryCall(provider, token, 'isApprovedForAll', [owner, who]);
    if (r && r[0]) grants.push({ kind: 'erc721_all', token, spender: who });
  }
  return grants;
}

/** One unsigned transaction per live grant, ready for eth_sendTransaction in the owner's wallet. */
export function buildRevocations(owner, grants) {
  owner = ethers.getAddress(owner);
  return grants.map((g) => {
    const tx = { from: owner, to: g.token, value: '0x0' };
    if (g.kind === 'erc20') return { ...tx, data: I.encodeFunctionData('approve', [g.spender, 0n]), grant: g, does: `approve(${g.spender}, 0) : remet à zéro le droit de dépense sur ${g.symbol || g.token}` };
    if (g.kind === 'erc721_all') return { ...tx, data: I.encodeFunctionData('setApprovalForAll', [g.spender, false]), grant: g, does: `setApprovalForAll(${g.spender}, false) : retire le droit sur toute la collection ${g.token}` };
    if (g.kind === 'erc721_one') return { ...tx, data: I.encodeFunctionData('approve', [ethers.ZeroAddress, BigInt(g.tokenId)]), grant: g, does: `approve(0x0, ${g.tokenId}) : retire le droit sur le NFT ${g.tokenId} de ${g.token}` };
    throw new Error(`unknown grant kind "${g.kind}"`);
  });
}

/**
 * EIP-2612 : a permit the owner already signed stays valid until its deadline or until nonces(owner) moves.
 * The only way to kill it early is to SPEND the nonce : the owner signs a harmless permit with the same nonce
 * (spender = herself, value 0, short deadline) and anyone submits it. The attacker's signature then fails.
 * Returns the typed data to sign and a builder for the permit() transaction. Returns { supported:false } when
 * the token exposes no nonces() / DOMAIN_SEPARATOR(), or when its domain cannot be rebuilt (then the typed data
 * would be signed for nothing).
 */
export async function permitInvalidation(provider, token, owner, { deadline } = {}) {
  token = ethers.getAddress(token); owner = ethers.getAddress(owner);
  const [n, sep] = [await tryCall(provider, token, 'nonces', [owner]), await tryCall(provider, token, 'DOMAIN_SEPARATOR')];
  if (!n || !sep) return { supported: false, why: 'token has no EIP-2612 nonces() / DOMAIN_SEPARATOR()' };
  const chainId = Number((await provider.getNetwork()).chainId);
  const d5267 = await tryCall(provider, token, 'eip712Domain');
  const name = d5267 ? d5267[1] : ((await tryCall(provider, token, 'name')) || [''])[0];
  const version = d5267 ? d5267[2] : ((await tryCall(provider, token, 'version')) || ['1'])[0];
  const domain = { name, version, chainId, verifyingContract: token };
  if (ethers.TypedDataEncoder.hashDomain(domain) !== sep[0]) return { supported: false, why: 'the EIP-712 domain of this token could not be rebuilt (non-standard domain)' };
  if (deadline === undefined) deadline = (await provider.getBlock('latest')).timestamp + 3600;
  const types = { Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] };
  const message = { owner, spender: owner, value: '0', nonce: n[0].toString(), deadline: String(deadline) };
  return {
    supported: true, token, owner, nonce: n[0].toString(),
    explains: `Toute signature permit déjà donnée avec le nonce ${n[0]} reste utilisable jusqu'à son échéance. Signer ce permit sans effet (toi vers toi, montant 0) puis l'envoyer consomme le nonce : l'ancienne signature devient inutilisable.`,
    typedData: { domain, types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }], ...types }, primaryType: 'Permit', message }, // eth_signTypedData_v4 payload
    buildTx(signature) {
      const s = ethers.Signature.from(signature);
      return { from: owner, to: token, value: '0x0', data: I.encodeFunctionData('permit', [owner, owner, 0n, BigInt(deadline), s.v, s.r, s.s]), does: `permit(toi, toi, 0) : consomme le nonce ${n[0]}` };
    },
    async stillOpen() { return (await call(provider, token, 'nonces', [owner]))[0] === n[0]; }, // true = the old signature can still be used
  };
}

export const CANNOT_UNDO = [
  'Un transfert déjà confirmé : aucune transaction ne le ramène.',
  "Une signature hors chaîne déjà donnée : elle reste valable jusqu'à son échéance ou au changement de nonce. EIP-2612 : voir permitInvalidation. Permit2, Seaport, autres ordres : annulation sur le contrat concerné, non construite ici.",
  "Un permit que l'attaquant soumet avant le permit de remplacement : c'est une course, le premier inclus gagne.",
  "Un droit que le contrat ne permet pas de retirer (jeton non standard) : le retrait construit ici échouera.",
];

export async function recoveryPlan(provider, owner, { spender, fromBlock = 0, chunk = 0, permitToken } = {}) {
  const grants = await scanGrants(provider, owner, { spender, fromBlock, chunk });
  const plan = { owner: ethers.getAddress(owner), spender: spender ? ethers.getAddress(spender) : null, chain_id: Number((await provider.getNetwork()).chainId), grants, transactions: buildRevocations(owner, grants), permit: null, cannot_undo: CANNOT_UNDO };
  if (permitToken) { const p = await permitInvalidation(provider, permitToken, owner); plan.permit = p.supported ? { supported: true, token: p.token, nonce: p.nonce, explains: p.explains, typedData: p.typedData } : p; }
  return plan;
}

const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : undefined; };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const url = arg('rpc'), owner = arg('owner');
  if (!url || !owner) { console.error('usage: node revoke.mjs --rpc <url> --owner 0x... [--spender 0x...] [--from-block N] [--chunk N] [--permit-token 0x...]'); process.exit(2); }
  const provider = makeProvider(url);
  const plan = await recoveryPlan(provider, owner, { spender: arg('spender'), fromBlock: Number(arg('from-block') || 0), chunk: Number(arg('chunk') || 0), permitToken: arg('permit-token') });
  console.log(JSON.stringify(plan, null, 2));
  provider.destroy();
}

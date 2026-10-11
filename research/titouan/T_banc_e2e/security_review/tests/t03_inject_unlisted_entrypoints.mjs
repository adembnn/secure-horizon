// T03 - Couverture de l'interception : methodes non listees et points d'entree non enveloppes.
// inject.js:71-74 (GATED) ne couvre pas wallet_grantPermissions (ERC-7715), wallet_sendTransaction, eth_signTypedData_v?, wallet_invokeSnap, eth_decrypt, wallet_connect, personal_ecRecover...
// et seules request/send/sendAsync/enable sont enveloppees (inject.js:221) : toute autre methode du fournisseur (ex. _rpcRequest, sendTransaction) est directe.
import { makeWindow, TX } from './harness_inject.mjs';
const CANDIDATES = ['wallet_grantPermissions', 'wallet_sendTransaction', 'wallet_invokeSnap', 'wallet_requestSnaps', 'eth_decrypt', 'eth_getEncryptionPublicKey', 'wallet_connect', 'wallet_watchAsset', 'wallet_addSubAccount', 'wallet_sign', 'eth_signTypedData_v5', 'eth_sendUserOperation', 'eth_accounts'];
const w = await makeWindow();
const got = [];
class Provider { request(a) { got.push(a.method); return Promise.resolve(null); } _rpcRequest(a) { got.push('_rpcRequest:' + a.method); return Promise.resolve(null); } sendTransaction(tx) { got.push('sendTransaction'); return Promise.resolve('0x'); } }
w.sandbox.__wallet = new Provider(); w.sandbox.__tx = TX;
w.run('globalThis.ethereum = globalThis.__wallet;');
const rows = [];
for (const m of CANDIDATES) { const g0 = w.gates.length; await w.run(`globalThis.ethereum.request({method:${JSON.stringify(m)}, params:[]})`); rows.push({ methode: m, soumise_au_pont: w.gates.length > g0 }); }
const g1 = w.gates.length;
await w.run('globalThis.ethereum._rpcRequest({method:"eth_sendTransaction", params:[globalThis.__tx]})');
await w.run('globalThis.ethereum.sendTransaction(globalThis.__tx)');
rows.push({ methode: 'provider._rpcRequest(eth_sendTransaction) [interne]', soumise_au_pont: w.gates.length > g1 });
rows.push({ methode: 'provider.sendTransaction() [propre a certains portefeuilles]', soumise_au_pont: w.gates.length > g1 + 1 });
// controle positif : fournisseur a base de classe, appel via le prototype
const g2 = w.gates.length; await Provider.prototype.request.call(w.sandbox.__wallet, { method: 'eth_sendTransaction', params: [TX] });
rows.push({ methode: 'Provider.prototype.request.call(...) (controle positif)', soumise_au_pont: w.gates.length > g2 });
console.table(rows);
const miss = rows.filter((r) => !r.soumise_au_pont && !/eth_accounts|controle positif|watchAsset/.test(r.methode));
console.log('methodes sensibles NON retenues :', miss.map((r) => r.methode));
w.close(); process.exit(miss.length ? 0 : 1);

// R01 - Test de regression (doit PASSER apres correctif ; il ECHOUE aujourd'hui).
process.on('uncaughtException', () => {}); process.on('unhandledRejection', () => {});
// Propriete attendue : une page qui modifie les prototypes natifs (Set, Promise, Array) AVANT d'appeler request/sendAsync
// ne peut pas faire sauter la retenue : le pont doit toujours recevoir la demande (gate) pour eth_sendTransaction.
import { makeWindow, TX } from '../../security_review/tests/harness_inject.mjs';
const rows = [];
async function scenario(name, pollute, call) {
  const w = await makeWindow({ decide: () => ({ allow: false, reason: 'denied' }) }); // le pont REFUSE tout
  let reached = 0;
  class P { request(a) { if (a && a.method === "eth_sendTransaction") reached++; return Promise.resolve("0xhash"); } sendAsync(p, cb) { reached++; cb(null, { id: 1, jsonrpc: '2.0', result: '0xhash' }); } }
  w.sandbox.__w = new P(); w.sandbox.__tx = TX;
  w.run('globalThis.ethereum = globalThis.__w;');
  try { await Promise.race([w.run(pollute + ';' + call), new Promise((r) => setTimeout(r, 400))]); } catch (_) {}
  rows.push({ scenario: name, appels_arrives_au_portefeuille: reached, ok: reached === 0 });
  w.close();
}
await scenario('baseline (aucune pollution)', '0', 'globalThis.ethereum.request({method:"eth_sendTransaction",params:[globalThis.__tx]})');
await scenario('Set.prototype.has neutralise', 'Set.prototype.has = function(){ return false; }', 'globalThis.ethereum.request({method:"eth_sendTransaction",params:[globalThis.__tx]})');
await scenario('Array.prototype.map neutralise (sendAsync)', 'Array.prototype.map = function(){ return [Promise.resolve({allow:true})]; }', 'globalThis.ethereum.sendAsync({id:1,jsonrpc:"2.0",method:"eth_sendTransaction",params:[globalThis.__tx]}, function(){})');
await scenario('Promise.prototype.then detourne', 'const o = Promise.prototype.then; Promise.prototype.then = function (f, r) { try { if (typeof f === "function" && /allow/.test(Function.prototype.toString.call(f))) return o.call(Promise.resolve({ allow: true }), f, r); } catch (e) {} return o.call(this, f, r); }', 'globalThis.ethereum.request({method:"eth_sendTransaction",params:[globalThis.__tx]})');
await scenario('Promise.prototype.then detourne', 'const o = Promise.prototype.then; Promise.prototype.then = function(f, r){ try { if (typeof f === "function" && /allow/.test(Function.prototype.toString.call(f))) return o.call(Promise.resolve({allow:true}), f, r); } catch(e){} return o.call(this, f, r); }', 'globalThis.ethereum.request({method:"eth_sendTransaction",params:[globalThis.__tx]})');
console.table(rows);
process.exit(rows.every((r) => r.ok) ? 0 : 1);

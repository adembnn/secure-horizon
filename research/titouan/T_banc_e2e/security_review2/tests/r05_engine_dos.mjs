// R05 - Le moteur embarque tourne dans le service worker (un seul fil). Une demande de ~200 Ko ne doit pas le geler plus de ~1 s.
import { check, emptyLocal } from '../../extension_standalone/extension/engine/sentinelle_core.js';
const ME = '0x' + 'a1'.repeat(20), T = '0x' + 'c3'.repeat(20);
const w = (n) => n.toString(16).padStart(64, '0');
const cases = {
  'calldata 95 Ko aleatoire': () => '0x12345678' + 'ab'.repeat(95000),
  'multicall(bytes[]) longueur annoncee enorme': () => '0xac9650d8' + w(32) + w(0xffffffff) + '00'.repeat(2000),
  'aggregate3 imbrique': () => { let d = '0x82ad56cb' + w(32) + w(1) + w(32) + w(0) + w(0) + w(96) + w(0); for (let i = 0; i < 400; i++) d += w(i); return d; },
  'typed data profond (1500 niveaux)': null
};
const out = [];
for (const [name, mk] of Object.entries(cases)) {
  let params, method = 'eth_sendTransaction';
  if (mk) params = [{ from: ME, to: T, data: mk(), value: '0x0' }];
  else { method = 'eth_signTypedData_v4'; let m = { a: 1 }; for (let i = 0; i < 1500; i++) m = { n: m }; params = [ME, JSON.stringify({ types: { EIP712Domain: [], T: [{ name: 'n', type: 'bytes' }] }, primaryType: 'T', domain: {}, message: m })]; }
  const t0 = performance.now(); let lvl;
  try { lvl = check({ origin: 'https://evil.example', method, params, chainId: '0x1', from: ME }, emptyLocal()).level; } catch (e) { lvl = 'throw:' + String(e.message).slice(0, 40); }
  const ms = Math.round(performance.now() - t0);
  out.push({ cas: name, niveau: lvl, ms, ok: ms < 1000 });
}
console.table(out);
process.exit(out.every((r) => r.ok) ? 0 : 1);

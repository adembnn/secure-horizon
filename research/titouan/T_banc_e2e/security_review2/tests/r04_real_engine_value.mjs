// R04 - avec le VRAI moteur embarque : un appel transfer(...) qui joint de la valeur native est-il rehausse ? (le test echoue si le niveau reste "attention")
import { check, emptyLocal } from '../../extension_standalone/extension/engine/sentinelle_core.js';
const ME = '0x' + 'a1'.repeat(20), TOKEN = '0x' + 'c3'.repeat(20), BOB = '0x' + 'b2'.repeat(20);
const w32 = (h) => h.replace(/^0x/, '').padStart(64, '0');
const data = '0xa9059cbb' + w32(BOB) + (20000000).toString(16).padStart(64, '0');
const out = [];
for (const [name, value] of [['transfer sans valeur', '0x0'], ['transfer + 1 ETH', '0xde0b6b3a7640000']]) {
  const v = check({ origin: 'https://evil.example', method: 'eth_sendTransaction', params: [{ from: ME, to: TOKEN, data, value }], chainId: '0x1', from: ME }, emptyLocal());
  out.push({ cas: name, niveau: v.level, funds_out: v.effects && v.effects.funds_out, codes: (v.codes || []).join(',') });
}
console.table(out);
const r = out[1]; process.exit(r.niveau === 'danger' || r.niveau === 'unknown' ? 0 : 1);

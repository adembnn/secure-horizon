// Scene "signataire aveugle" (type Bybit, fevrier 2025) : l'ecran du coffre affiche un virement, la charge signee est un delegatecall.
// Synthetique : adresses factices, aucun systeme reel. Rejoue le moteur sur deux variantes (conforme / delegatecall).
import { evaluate } from '../server/server.mjs';
const pad = (h, n = 64) => h.replace(/^0x/, '').toLowerCase().padStart(n, '0');
const w = (n) => pad(BigInt(n).toString(16));
const bytes = (hex) => { const b = hex.replace(/^0x/, ''); const len = b.length / 2; return w(len) + b.padEnd(Math.ceil(b.length / 64) * 64, '0'); };
const SEL_EXEC = '0x6a761202';
function execTransaction({ to, value = 0, data, operation, sigs }) {
  const dataEnc = bytes(data), sigEnc = bytes(sigs);
  const headWords = 10, off1 = headWords * 32, off2 = off1 + dataEnc.length / 2;
  const head = [pad(to), w(value), w(off1), w(operation), w(0), w(0), w(0), pad('0x0'), pad('0x0'), w(off2)].join('');
  return SEL_EXEC + head + dataEnc + sigEnc;
}
const SAFE = '0x5afe000000000000000000000000000000000001';   // coffre factice
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const PAUL = '0x87ae6413d6a4cf008009eb1faee014d9b878bb2e';
const EVIL = '0xbadc0de000000000000000000000000000000002';   // contrat inconnu cree il y a 3 jours (factice)
const transferPaul = '0xa9059cbb' + pad(PAUL) + w(20_000000);
const sigs = '0x' + 'ab'.repeat(65 * 3);
const ctx = { chainId: 1, origin: 'app.safe.global', victim: '0x69c52a49ea4a2d6e3a04624d28641e296c49a3dc',
  address_book: [{ label: 'Paul', address: PAUL, kind: 'eoa' }] };
const cases = {
  'conforme: virement 20 USDC a Paul (operation=0)': { to: USDC, data: transferPaul, operation: 0 },
  'delegatecall vers un contrat inconnu, deguise en virement (operation=1)': { to: EVIL, data: transferPaul, operation: 1 },
};
for (const intent of [undefined, { type: 'pay_someone', token: 'USDC', amount: '20', recipient: 'Paul' }]) {
  for (const [name, c] of Object.entries(cases)) {
    const body = { method: 'eth_sendTransaction', params: [{ from: ctx.victim, to: SAFE, value: '0x0', data: execTransaction({ ...c, sigs }), chainId: '0x1' }], origin: ctx.origin, chainId: 1, ...(intent ? { intent } : {}) };
    const v = evaluate(body, { contacts: [{ address: PAUL, label: 'Paul' }], history: [], protected: [], knownSpenders: [] });
    console.log(`${intent ? 'AVEC intention' : 'SANS intention'} | ${name}\n  -> level=${v.level} niveau=${v.niveau} fiche=${v.fiche || '-'} codes=${(v.codes || []).join(',')}\n  titre: ${v.title || ''}`);
  }
}

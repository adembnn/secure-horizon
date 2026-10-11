// R02 - writtenCheck : ce qui n'est pas lu dans la demande ne doit pas produire "match".
import { writtenCheck, requestFacts } from '../../extension/written_check.js';
const BOB = '0x' + 'b'.repeat(40), TOK = '0x' + 'c'.repeat(40);
const pad = (a) => a.slice(2).padStart(64, '0');
const transferData = '0xa9059cbb' + pad(BOB) + (10n * 10n ** 6n).toString(16).padStart(64, '0');
const intent = { clear: true, kind: 'pay_someone', amount: '10', symbol: 'USDC', address: BOB };
const out = [];
// 1) valeur native jointe a un appel transfer(...) : doit ressortir (mismatch ou unverifiable), jamais match
const r1 = writtenCheck({ method: 'eth_sendTransaction', params: [{ from: '0x' + 'a'.repeat(40), to: TOK, data: transferData, value: '0xde0b6b3a7640000' }] }, intent, {});
out.push({ cas: 'transfer + value 1 ETH', resultat: r1 && r1.outcome, ok: !!r1 && r1.outcome !== 'match' });
// 2) wallet_sendCalls : le 65e appel (approve illimite) doit etre vu
const benign = { to: TOK, data: transferData, value: '0x0' };
const approveAll = { to: TOK, data: '0x095ea7b3' + pad('0x' + 'd'.repeat(40)) + 'f'.repeat(64), value: '0x0' };
const calls = Array.from({ length: 64 }, () => benign).concat([approveAll]);
const f = requestFacts({ method: 'wallet_sendCalls', params: [{ calls }] });
out.push({ cas: 'sendCalls 64 benins + 1 approve illimite', grants_vus: f.grants.length, ok: f.grants.length === 1 });
// 3) champ "input" different de "data"
const r3 = requestFacts({ method: 'eth_sendTransaction', params: [{ from: '0x' + 'a'.repeat(40), to: TOK, data: transferData, input: approveAll.data }] });
out.push({ cas: 'data != input', grants_vus: r3.grants.length, ok: r3.grants.length === 1 || r3.sends.length === 0 });
// 4) jeton substitue : la phrase dit DAI, la demande envoie 100e18 unites d'un AUTRE jeton (WETH) au meme destinataire ; le contexte ne connait pas ce jeton
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const dataWeth = '0xa9059cbb' + pad(BOB) + (100n * 10n ** 18n).toString(16).padStart(64, '0');
const r4 = writtenCheck({ method: 'eth_sendTransaction', params: [{ from: '0x' + 'a'.repeat(40), to: WETH, data: dataWeth }] }, { clear: true, kind: 'pay_someone', amount: '100', symbol: 'DAI', address: BOB }, {});
out.push({ cas: 'phrase 100 DAI, demande = 100 WETH (jeton inconnu du contexte)', resultat: r4 && r4.outcome, ok: !!r4 && r4.outcome !== 'match' });
console.table(out);
process.exit(out.every((r) => r.ok) ? 0 : 1);

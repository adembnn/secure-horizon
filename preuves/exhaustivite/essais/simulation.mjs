// Les dimensions d'un échange, quand le noeud du portefeuille SAIT rejouer un appel (debug_traceCall) : alors effect_sim.js mesure ce qui
// sort et ce qui entre, et written_check.effectCheck compare à la phrase. Le noeud est simulé ici : la trace (événements Transfer) est
// fabriquée par code, dans la forme que renvoient les noeuds (même forme que extension/tests/unit/operation.test.mjs).
// La demande est un appel de routeur que le décideur ne lit pas dans ses propres données (ni approve, ni transfer).
// Sortie : sorties/simulation.txt.   Usage : node simulation.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { essai, court, tx, call, hex, u, CTX, ME, OTHER, ROUTER, USDC, USDT, WAVAX, FAKE } from './harnais.mjs';

const pad = (x) => (typeof x === 'bigint' ? x.toString(16) : String(x).replace(/^0x/, '')).padStart(64, '0');
const T_TRANSFER = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', T_APPROVAL = '8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
const step = (op, depth, stack = [], memory = []) => ({ pc: 0, op, gas: 1, gasCost: 1, depth, stack, memory });
const callOp = (depth, to, value = 0n) => step('CALL', depth, [pad(0n), pad(0n), pad(0n), pad(0n), pad(value), pad(to), pad(90000n)]);
const log3 = (depth, topic, a, b, value) => step('LOG3', depth, [pad(b), pad(a), topic, pad(32n), pad(0n)], [pad(value)]);
const sub = (to, inner) => [callOp(1, to), ...inner, step('RETURN', 2), step('POP', 1)];
// moves : [{ token, from, to, amount }] ; token null = monnaie du réseau envoyée à `to` ; approvals : [{ token, spender, amount }]
const trace = (moves, approvals = []) => ({ failed: false, gas: 1, returnValue: '', structLogs: [step('PUSH1', 1),
  ...moves.flatMap((m) => (m.token == null ? [callOp(1, m.to, m.amount), step('POP', 1)] : sub(m.token, [log3(2, T_TRANSFER, m.from, m.to, m.amount)]))),
  ...approvals.flatMap((a) => sub(a.token, [log3(2, T_APPROVAL, ME, a.spender, a.amount)])), step('STOP', 1)] });
const SYMBOLS = { [USDC]: ['USDC', 6], [USDT]: ['USDt', 6], [WAVAX]: ['WAVAX', 18], [FAKE]: ['AVAX', 18] }; // le faux jeton se nomme lui-même « AVAX »
const abiString = (s) => '0x' + pad(32n) + pad(BigInt(s.length)) + Buffer.from(s).toString('hex').padEnd(64, '0');
const node = (t) => async (method, params) => {
  if (method === 'debug_traceCall') return t;
  const { to, data } = params[0], known = SYMBOLS[to];
  if (data.startsWith('0x95d89b41')) return abiString(known[0]);
  if (data.startsWith('0x313ce567')) return '0x' + pad(BigInt(known[1]));
  if (data.startsWith('0xdd62ed3e')) return '0x' + pad(0n);
  throw new Error('non géré');
};
const AVAX = (n) => u(n, 18);
// Un appel de routeur d'agrégateur, que ni le moteur ni written_check ne savent lire (fonction inconnue) : seul son effet mesuré parle.
const opaque = (value) => tx(ROUTER, '0x3d5a1f07' + pad(u(50)) + pad(0n), value);
const SWAP = 'échanger 50 USDC contre AVAX';
const pay = (n) => ({ token: USDC, from: ME, to: ROUTER, amount: u(n) });
const cas = [
  ['S0', 'conforme : 50 USDC sortent, 1,8 AVAX entrent', opaque(), trace([pay(50), { token: null, to: ME, amount: AVAX(1.8) }])],
  ['S1', 'montant : 5 000 USDC sortent', opaque(), trace([pay(5000), { token: null, to: ME, amount: AVAX(180) }])],
  ['S2', 'ce que j’obtiens va à un tiers : rien n’entre sur mon compte', opaque(), trace([pay(50), { token: null, to: OTHER, amount: AVAX(1.8) }])],
  ['S3', 'montant minimal : 0,000001 AVAX entrent', opaque(), trace([pay(50), { token: null, to: ME, amount: AVAX(0.000001) }])],
  ['S4', 'contrepartie : un jeton USDT entre au lieu d’AVAX', opaque(), trace([pay(50), { token: USDT, from: ROUTER, to: ME, amount: u(49) }])],
  ['S5', 'contrepartie : un jeton inconnu qui se nomme « AVAX » entre', opaque(), trace([pay(50), { token: FAKE, from: ROUTER, to: ME, amount: AVAX(1.8) }])],
  ['S6', 'autre chose en plus : 300 USDT sortent aussi', opaque(), trace([pay(50), { token: USDT, from: ME, to: OTHER, amount: u(300) }, { token: null, to: ME, amount: AVAX(1.8) }])],
  ['S7', 'valeur native en plus : 3 AVAX joints', opaque(AVAX(3)), trace([pay(50), { token: null, to: ME, amount: AVAX(1.8) }])],
  ['S8', 'droit durable en plus : l’appel crée un droit illimité sur USDT', opaque(), trace([pay(50), { token: null, to: ME, amount: AVAX(1.8) }], [{ token: USDT, spender: OTHER, amount: 2n ** 256n - 1n }])],
  ['S9', 'noeud sans debug_traceCall (cas des RPC publics) : même trahison que S1', opaque(), null]
];
const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, 'sorties'), { recursive: true });
const lines = ['phrase : « ' + SWAP + ' »   demande : appel de routeur illisible   moteur : serveur et embarqué'];
for (const [id, label, req, t] of cas) for (const moteur of ['serveur', 'embarque']) {
  const sim = t ? node(t) : async () => { throw new Error('the method debug_traceCall does not exist'); };
  let r; try { r = await essai({ req, text: SWAP, contexte: CTX, sim, moteur }); } catch (e) { r = { erreur: String(e && e.message || e) }; }
  lines.push(id + ' [' + moteur + '] ' + label + '  ->  ' + court(r));
}
writeFileSync(join(here, 'sorties', 'simulation.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));

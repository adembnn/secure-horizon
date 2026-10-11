// R03 - Tests de regression du service worker (faux chrome, sans navigateur). Chaque ligne "ok:false" est une trouvaille ouverte.
import { makeChrome, fakeClock, load } from '../../extension/tests/unit/fake_chrome.mjs';
const { createGatekeeper } = await load('gatekeeper.js');
const ME = '0x' + 'a1'.repeat(20), TOKEN = '0x' + 'c3'.repeat(20), SPENDER = '0x' + 'e5'.repeat(20), BOB = '0x' + 'b2'.repeat(20);
const w32 = (h) => h.replace(/^0x/, '').padStart(64, '0');
const APPROVE_MAX = '0x095ea7b3' + w32(SPENDER) + 'f'.repeat(64);
const TRANSFER_20 = '0xa9059cbb' + w32(BOB) + (20000000).toString(16).padStart(64, '0');
const model = (kind, confidence, facts = {}) => async () => ({ source: 'clef', model: true, kind, confidence, facts: Object.assign({ asked: 0.02, receive: 0.02, grant: 0.02 }, facts) });
const rows = []; let n = 0;

async function run({ name, engine, params, classify, text, pad = 0, expect }) {
  const clock = fakeClock(); const F = makeChrome(); globalThis.chrome = F.chrome;
  createGatekeeper({ check: async () => engine, classify });
  const rid = 'rid-sr2-' + String(++n).padStart(4, '0'), page = F.page(7 + n, 'https://evil.example');
  const tx = { method: 'eth_sendTransaction', params, chainId: '0x1', from: ME };
  if (pad) tx.params = [Object.assign({}, params[0], { junk: 'A'.repeat(pad) })];
  await F.send({ type: 'gate', rid, payload: Object.assign({ kind: 'gate' }, tx) }, page);
  let wid = null; for (const [id, o] of F.state.windows) if (o.url.endsWith('window.html#' + rid)) wid = id;
  const win = F.win(wid, rid);
  let v = (await F.send({ type: 'hu.view', rid }, win)).view;
  const first = v.stage;
  if (v.stage === 'intent') { clock.advance(1000); v = (await F.send({ type: 'hu.decision', rid, seq: 1, decision: 'answer', text }, win)).view; }
  if (process.env.DBG) console.log(JSON.stringify(v.verdict).slice(0,600));
  const res = { cas: name, ecran_initial: first, issue: v.screen && v.screen.outcome, delai_ms: v.friction && v.friction.waitMs, phrase: v.friction && v.friction.phrase, auto_ms: v.screen && v.screen.autoMs };
  res.ok = expect(res); rows.push(res);
  clock.restore(); delete globalThis.chrome;
}
const verdict = (level, extra = {}) => Object.assign({ level, texts: { croit: 'a', reel: 'Cette demande donne un droit.', danger: 'c', action: 'd' }, reasons: [], effects: { grants_right: true, funds_out: false }, risk_signals: [] }, extra);

// 1) approve illimite juge DANGER par le moteur (ex. spender signale) + phrase "on m'a demande d'approuver 50 USDC" : le delai Danger doit rester
await run({ name: 'RELIEF : danger + "on m\'a demande" + approve illimite', engine: verdict('danger', { risk_signals: ['known_drainer'] }),
  params: [{ from: ME, to: TOKEN, data: APPROVE_MAX }], classify: model('asked_by_someone', 0.95, { asked: 0.95, grant: 0.9 }),
  text: "un conseiller m'a demande d'approuver 50 USDC", expect: (r) => r.delai_ms > 0 || r.phrase === true });
await run({ name: 'RELIEF bis : danger (risk known_drainer) + echange/approbation 50 USDC + approve illimite', engine: verdict('danger', { risk_signals: ['known_drainer'] }),
  params: [{ from: ME, to: TOKEN, data: APPROVE_MAX }], classify: model('buy_or_swap', 0.95, { grant: 0.9 }), text: 'approuver 50 USDC pour echanger',
  expect: (r) => r.delai_ms > 0 || r.phrase === true });
// 2) paiement ecrit mais la demande est un approve illimite vers un tiers : le delai Danger doit rester
await run({ name: 'RELIEF : "payer 20 USDC a Bob" mais approve illimite (danger)', engine: verdict('danger'),
  params: [{ from: ME, to: TOKEN, data: APPROVE_MAX }], classify: model('pay_someone', 0.95), text: 'payer 20 USDC a ' + BOB,
  expect: (r) => r.delai_ms > 0 || r.phrase === true });
// 3) transfer(Bob, 20 USDC) + valeur native jointe : ne doit pas donner "match" / envoi automatique
await run({ name: 'MATCH : transfer + 1 ETH de valeur jointe', engine: verdict('attention', { effects: { grants_right: false, funds_out: true } }),
  params: [{ from: ME, to: TOKEN, data: TRANSFER_20, value: '0xde0b6b3a7640000' }], classify: model('pay_someone', 0.95), text: 'payer 20 USDC a ' + BOB,
  expect: (r) => r.issue !== 'match' && !r.auto_ms });
// 4) corps > 200000 octets : la question d'intention ne doit pas etre sautee silencieusement
await run({ name: 'REMBOURRAGE : corps > 200 Ko saute la question', engine: verdict('attention', { effects: { grants_right: false, funds_out: true } }),
  params: [{ from: ME, to: TOKEN, data: TRANSFER_20 }], classify: model('pay_someone', 0.95), text: 'payer 20 USDC a ' + BOB, pad: 210000,
  expect: (r) => r.ecran_initial === 'intent' });
console.table(rows);
process.exit(rows.every((r) => r.ok) ? 0 : 1);

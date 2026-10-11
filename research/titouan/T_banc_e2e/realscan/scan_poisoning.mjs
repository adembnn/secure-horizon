// Scan empoisonnement d'adresse, C-Chain Avalanche, USDC+USDT. Lecture seule, RPC publics, Node 24 sans dependance.
// Usage: node scan_poisoning.mjs [--blocks 300000] [--end <bloc|head>] [--seed 1] [--chunk 10000] [--txsample 150] [--refresh]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dir, 'out'); fs.mkdirSync(OUT, { recursive: true });
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1] ?? true); };
const BLOCKS = +arg('blocks', 300000), SEED = +arg('seed', 1), CHUNK = +arg('chunk', 10000), TXSAMPLE = +arg('txsample', 150);
const ENDARG = arg('end', 'head'), REFRESH = process.argv.includes('--refresh');
const RPCS = ['https://api.avax.network/ext/bc/C/rpc', 'https://avalanche-c-chain-rpc.publicnode.com'];
const TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const TOKENS = { '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': 'USDC', '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7': 'USDT' };
const ADDRS = ['0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7'];
const U = 1e6; // 6 decimales pour les deux
const sleep = ms => new Promise(r => setTimeout(r, ms));
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
async function rpc(method, params) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const url = RPCS[attempt >= 3 ? 1 : 0];
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
      if (r.status === 429) { await sleep(3000 * (attempt + 1)); continue; }
      const j = await r.json();
      if (j.error) { const e = new Error(j.error.message); e.rpcErr = true; throw e; }
      return j.result;
    } catch (e) { if (e.rpcErr && /range|limit|too many|exceed|response size/i.test(e.message)) throw e; await sleep(1500 * (attempt + 1)); }
  }
  throw new Error('rpc failed ' + method);
}
const hex = n => '0x' + n.toString(16);
async function getLogsRange(from, to) {
  try {
    const r = await rpc('eth_getLogs', [{ fromBlock: hex(from), toBlock: hex(to), address: ADDRS, topics: [TOPIC] }]);
    await sleep(700); return r;
  } catch (e) {
    if (to - from < 500) throw e;
    const mid = Math.floor((from + to) / 2);
    return (await getLogsRange(from, mid)).concat(await getLogsRange(mid + 1, to));
  }
}
const ts = async b => parseInt((await rpc('eth_getBlockByNumber', [hex(b), false])).timestamp, 16);

// ---------- 1. collecte ----------
const head = parseInt(await rpc('eth_blockNumber', []), 16);
const END = ENDARG === 'head' ? head : +ENDARG, START = END - BLOCKS + 1;
const cache = path.join(OUT, `cache_${START}_${END}.json`);
let rows; // [block, tokenIdx(0 USDC/1 USDT), from, to, value, txhash, logIndex]
if (!REFRESH && fs.existsSync(cache)) { rows = JSON.parse(fs.readFileSync(cache, 'utf8')); console.log('cache', rows.length); }
else {
  rows = [];
  for (let s = START; s <= END; s += CHUNK) {
    const e = Math.min(s + CHUNK - 1, END);
    const logs = await getLogsRange(s, e);
    for (const l of logs) {
      if (l.topics.length !== 3) continue; // ERC-20 seulement
      const v = BigInt(l.data === '0x' ? '0x0' : l.data);
      rows.push([parseInt(l.blockNumber, 16), TOKENS[l.address.toLowerCase()] === 'USDC' ? 0 : 1,
        '0x' + l.topics[1].slice(26).toLowerCase(), '0x' + l.topics[2].slice(26).toLowerCase(),
        v > 10n ** 15n ? 1e15 : Number(v), l.transactionHash, parseInt(l.logIndex, 16)]);
    }
    console.log(`blocs ${s}-${e}: cumul ${rows.length}`);
  }
  fs.writeFileSync(cache, JSON.stringify(rows));
}
const tStart = await ts(START), tEnd = await ts(END);
const bps = (END - START) / (tEnd - tStart);
const WIN_S = 1200, W = Math.round(WIN_S * bps);
console.log({ head, START, END, tStart: new Date(tStart * 1000).toISOString(), tEnd: new Date(tEnd * 1000).toISOString(), bps: +bps.toFixed(3), W });

// ---------- 2. detection ----------
const ZERO = '0x0000000000000000000000000000000000000000';
const real = rows.filter(r => r[4] >= 1 * U && r[2] !== r[3] && r[2] !== ZERO && r[3] !== ZERO);
const tiny = rows.filter(r => r[4] < 1 * U && r[2] !== ZERO && r[3] !== ZERO && r[2] !== r[3]);
const batch = new Map(); for (const r of tiny) batch.set(r[5], (batch.get(r[5]) || 0) + 1);
const around = new Map(); // A -> evenements tiny qui touchent A
const add = (a, o) => { let l = around.get(a); if (!l) around.set(a, l = []); l.push(o); };
for (const r of tiny) { add(r[3], { b: r[0], tok: r[1], dir: 'in', other: r[2], v: r[4], tx: r[5], li: r[6] }); add(r[2], { b: r[0], tok: r[1], dir: 'out', other: r[3], v: r[4], tx: r[5], li: r[6] }); }
const sends = new Map(); // "from|to" -> [[b,v]]
for (const r of rows) if (r[4] > 0) { const k = r[2] + '|' + r[3]; let l = sends.get(k); if (!l) sends.set(k, l = []); l.push([r[0], r[4], r[1]]); }
const pre = (x, y) => { let i = 2; while (i < 42 && x[i] === y[i]) i++; return i - 2; };
const suf = (x, y) => { let i = 0; while (i < 40 && x[41 - i] === y[41 - i]) i++; return i; };
function detect(P, S, reals) {
  const cands = new Map(); let checked = 0;
  for (const t of reals) {
    const [b, , A, B] = t; const l = around.get(A); if (!l) continue;
    for (const e of l) {
      if (e.b < b) continue; if (e.b > b + W) break;
      if (e.tx === t[5]) continue;
      checked++;
      const Sd = e.other; if (Sd === B || Sd === A) continue;
      if (e.dir === 'out' && e.v !== 0) continue; // victime -> sosie de valeur >0 : envoi volontaire, pas une injection
      const p = pre(Sd, B), s = suf(Sd, B); if (p < P || s < S) continue;
      const key = A + '|' + B + '|' + Sd;
      let c = cands.get(key);
      if (!c) cands.set(key, c = { A, B, S: Sd, p, s, realBlock: b, realUSD: t[4] / U, realTok: t[1] ? 'USDT' : 'USDC', events: [], kinds: new Set() });
      const kind = e.dir === 'in' ? (e.v === 0 ? 'in_zero' : 'in_dust') : 'out_zero';
      if (!c.events.some(x => x.tx === e.tx && x.li === e.li)) { c.events.push({ b: e.b, kind, v: e.v / U, tx: e.tx, li: e.li, tok: e.tok ? 'USDT' : 'USDC' }); c.kinds.add(kind); }
    }
  }
  return { cands, checked };
}
const main = detect(3, 4, real); const pairsChecked = main.checked;
const list = [...main.cands.values()].map(c => {
  c.kinds = [...c.kinds]; c.delayBlocksMin = Math.min(...c.events.map(e => e.b - c.realBlock)); c.delaySecEst = Math.round(c.delayBlocksMin / bps);
  c.batchSize = Math.max(...c.events.map(e => batch.get(e.tx) || 0));
  c.sentUSD = c.events.filter(e => e.kind === 'in_dust').reduce((a, e) => a + e.v, 0);
  const first = Math.min(...c.events.map(e => e.b));
  const after = (sends.get(c.A + '|' + c.S) || []).filter(x => x[0] > first && x[1] >= 1 * U);
  c.victimSentToSosie = after.length > 0; c.victimSentToSosieUSD = after.reduce((a, x) => a + x[1] / U, 0);
  const prior = [...(sends.get(c.A + '|' + c.S) || []), ...(sends.get(c.S + '|' + c.A) || [])].filter(x => x[0] < first && x[1] >= 1 * U);
  c.priorRelationSosie = prior.length;
  return c;
});
const sCount = new Map(); for (const c of list) { if (!sCount.has(c.S)) sCount.set(c.S, new Set()); sCount.get(c.S).add(c.A); }
for (const c of list) c.distinctVictimsOfS = sCount.get(c.S).size;
// classification automatique (heuristique, a confirmer a la main)
for (const c of list) {
  if (c.priorRelationSosie > 0) c.auto = 'faux_positif';
  else if (c.batchSize >= 5 || c.distinctVictimsOfS >= 2) c.auto = 'empoisonnement_probable';
  else if (c.p + c.s >= 9 && c.kinds.some(k => k !== 'out_zero')) c.auto = 'empoisonnement_probable';
  else c.auto = 'indetermine';
}

// ---------- 3. comparaison de seuils + controle par collision aleatoire ----------
const n44 = list.filter(c => c.p >= 4 && c.s >= 4).length;
const relaxed = detect(3, 3, real); const relaxed2 = detect(2, 3, real);
const rnd = rng(SEED);
function shuffleB() { const Bs = real.map(r => r[3]); for (let i = Bs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [Bs[i], Bs[j]] = [Bs[j], Bs[i]]; } return real.map((r, i) => [r[0], r[1], r[2], Bs[i], r[4], r[5], r[6]]); }
const REPS = 10, ctrl = { '3+4': [], '3+3': [], '2+3': [] };
for (let i = 0; i < REPS; i++) { const sh = shuffleB(); ctrl['3+4'].push(detect(3, 4, sh).cands.size); ctrl['3+3'].push(detect(3, 3, sh).cands.size); ctrl['2+3'].push(detect(2, 3, sh).cands.size); }
const pHit = (P, S) => Math.pow(16, -(P + S)) * (15 / 16) * (15 / 16);
// ---------- 4. echantillon pour validation manuelle + tx.from ----------
const r2 = rng(SEED + 7);
const pick = a => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r2() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const sample = pick(list).slice(0, 40);
const codeCache = new Map();
async function isContract(a) { if (codeCache.has(a)) return codeCache.get(a); const c = await rpc('eth_getCode', [a, 'latest']); await sleep(250); const v = c !== '0x'; codeCache.set(a, v); return v; }
const blockTs = new Map(); async function bts(b) { if (!blockTs.has(b)) { blockTs.set(b, await ts(b)); await sleep(250); } return blockTs.get(b); }
for (const c of sample) {
  c.isContract = { A: await isContract(c.A), B: await isContract(c.B), S: await isContract(c.S) };
  c.delaySecExact = (await bts(Math.min(...c.events.map(e => e.b)))) - (await bts(c.realBlock));
}
// campagnes: tx.from des transactions de poison (echantillon)
const poisonTx = [...new Set(list.flatMap(c => c.events.map(e => e.tx)))];
const txs = pick(poisonTx).slice(0, TXSAMPLE); const txFrom = new Map();
for (const h of txs) { const t = await rpc('eth_getTransactionByHash', [h]); await sleep(300); if (t) txFrom.set(h, { from: t.from.toLowerCase(), to: (t.to || '').toLowerCase() }); }
const camp = new Map(); for (const [, v] of txFrom) { const o = camp.get(v.from) || { txs: 0, tos: new Set() }; o.txs++; o.tos.add(v.to); camp.set(v.from, o); }
// ScamSniffer (comptes seulement)
let ss = new Set(); try { ss = new Set(JSON.parse(fs.readFileSync(path.join(__dir, '..', '..', 'bench', 'data', 'address.json'), 'utf8')).map(x => x.toLowerCase())); } catch { }
const sosies = new Set(list.map(c => c.S)), victims = new Set(list.map(c => c.A));
const inSS = { sosiesDistinct: sosies.size, sosiesInList: [...sosies].filter(x => ss.has(x)).length, txSenderCampaigns: camp.size, txSendersInList: [...camp.keys()].filter(x => ss.has(x)).length, victimsInList: [...victims].filter(x => ss.has(x)).length, listSize: ss.size };
// ---------- 5. synthese ----------
const sum = a => a.reduce((x, y) => x + y, 0);
const mean = a => sum(a) / a.length;
const byAuto = {}; for (const c of list) byAuto[c.auto] = (byAuto[c.auto] || 0) + 1;
const kindCount = {}; for (const c of list) { const k = c.kinds.slice().sort().join('+'); kindCount[k] = (kindCount[k] || 0) + 1; }
const lost = list.filter(c => c.victimSentToSosie);
const sortedDelay = list.map(c => c.delaySecEst).sort((a, b) => a - b);
const summary = {
  params: { START, END, blocks: BLOCKS, seed: SEED, chunk: CHUNK, windowBlocks: W, windowSec: WIN_S, bps: +bps.toFixed(3), from: new Date(tStart * 1000).toISOString(), to: new Date(tEnd * 1000).toISOString() },
  data: { transfers: rows.length, usdc: rows.filter(r => !r[1]).length, usdt: rows.filter(r => r[1]).length, realGE1USD: real.length, tinyLT1USD: tiny.length, tinyZero: tiny.filter(r => r[4] === 0).length, pairsCheckedInWindow: pairsChecked },
  candidates34: list.length, victimsDistinct: victims.size, sosiesDistinct: sosies.size, kindCount, byAuto,
  candidates44: n44, missed44: list.length - n44, missed44pct: +(100 * (list.length - n44) / Math.max(1, list.length)).toFixed(1),
  candidates33: relaxed.cands.size, candidates23: relaxed2.cands.size,
  control: { reps: REPS, shuffledMean: Object.fromEntries(Object.entries(ctrl).map(([k, v]) => [k, +mean(v).toFixed(2)])), shuffledRuns: ctrl,
    analyticExpected34: +(pairsChecked * pHit(3, 4)).toFixed(4), analyticExpected33: +(pairsChecked * pHit(3, 3)).toFixed(3), analyticExpected23: +(pairsChecked * pHit(2, 3)).toFixed(3) },
  attackerDustUSD: +sum(list.map(c => c.sentUSD)).toFixed(4), attackerDustEvents: sum(list.map(c => c.events.filter(e => e.kind === 'in_dust').length)),
  zeroEvents: sum(list.map(c => c.events.filter(e => e.kind !== 'in_dust').length)),
  victimSentToSosie: { count: lost.length, usd: +sum(lost.map(c => c.victimSentToSosieUSD)).toFixed(2) },
  delaySecEst: { median: sortedDelay[Math.floor(list.length / 2)], max: sortedDelay[list.length - 1] },
  campaigns: { txSampled: txs.length, poisonTxDistinct: poisonTx.length, distinctTxSenders: camp.size, senders: [...camp.entries()].map(([k, v]) => ({ sender: k.slice(0, 6) + '..' + k.slice(-4), txs: v.txs, tos: v.tos.size })).sort((a, b) => b.txs - a.txs).slice(0, 15) },
  scamsniffer: inSS,
};
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 1));
fs.writeFileSync(path.join(OUT, 'candidates.json'), JSON.stringify(list));
fs.writeFileSync(path.join(OUT, 'sample.json'), JSON.stringify(sample, null, 1));
fs.writeFileSync(path.join(OUT, 'campaign_tx_senders.json'), JSON.stringify([...txFrom.entries()]));
console.log(JSON.stringify(summary, null, 1));
console.log('\n=== echantillon ===');
for (const c of sample) {
  console.log(`A=${c.A.slice(0, 8)}..${c.A.slice(-4)} B  ${c.B}\n   S ${c.S}  [${c.p}+${c.s}] ${c.kinds.join(',')} ev=${c.events.length} vals=${c.events.slice(0, 3).map(e => e.v).join('/')} real=${c.realUSD.toFixed(2)}${c.realTok} delay=${c.delaySecExact}s batch=${c.batchSize} victimsOfS=${c.distinctVictimsOfS} contract(A,B,S)=${+c.isContract.A}${+c.isContract.B}${+c.isContract.S} prior=${c.priorRelationSosie} lost=${c.victimSentToSosie} auto=${c.auto}`);
}

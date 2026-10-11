// Éléments pour la revue manuelle (lecture seule) : nature (contrat / compte externe) des spenders, nouveaux titulaires et destinataires revus, popularité dans l'échantillon.
import fs from 'node:fs';
import path from 'node:path';
const HERE = path.resolve(import.meta.dirname), CACHE = path.join(HERE, 'cache_');
const chain = process.argv[2] || 'cchain';
const URL_ = { cchain: 'https://api.avax.network/ext/bc/C/rpc', eth: 'https://gateway.tenderly.co/public/mainnet' }[chain];
const sample = chain === 'cchain' ? path.resolve(HERE, '..', '..', 'bench', 'data', 'cchain_sample.jsonl') : path.join(CACHE, 'eth_sample.jsonl');
const txs = fs.readFileSync(sample, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const rev = JSON.parse(fs.readFileSync(path.join(CACHE, `review_${chain}.json`), 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function rpc(method, params) { for (let i = 0; i < 5; i++) { try { const r = await fetch(URL_, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }); if (r.status === 429) { await sleep(1500 * (i + 1)); continue; } const j = await r.json(); if (!j.error) return j.result; } catch {} await sleep(700 * (i + 1)); } return null; }
const byHash = new Map(txs.map((t) => [t.hash, t]));
const cnt = {}, senders = {}; // popularité des destinataires
for (const t of txs) if (t.to) { const k = t.to.toLowerCase(); cnt[k] = (cnt[k] || 0) + 1; (senders[k] ||= new Set()).add(t.from.toLowerCase()); }
const spCnt = {}; for (const t of txs) if (/^0x095ea7b3/.test(t.input || '')) { const sp = '0x' + t.input.slice(34, 74).toLowerCase(); (spCnt[sp] ||= new Set()).add(t.from.toLowerCase()); }
const out = [];
for (const r of rev) {
  const t = byHash.get(r.hash); const e = { n: r.n, hash: r.hash, to_full: r.to_full };
  e.to_txs_in_sample = r.to_full ? cnt[r.to_full.toLowerCase()] || 0 : 0; e.to_distinct_senders = r.to_full ? (senders[r.to_full.toLowerCase()]?.size || 0) : 0;
  let target = null;
  if (/^0x095ea7b3/.test(t.input)) target = '0x' + t.input.slice(34, 74).toLowerCase(), e.role = 'spender', e.amount_hex_head = t.input.slice(74, 90);
  else if (/^0xf2fde38b/.test(t.input)) target = '0x' + t.input.slice(34, 74).toLowerCase(), e.role = 'new_owner';
  if (target) { e.target = target; e.spender_distinct_approvers_in_sample = spCnt[target]?.size || 0; const c = await rpc('eth_getCode', [target, 'latest']); e.target_is_contract = c === null ? null : c !== '0x'; e.target_code_bytes = c ? (c.length - 2) / 2 : null; await sleep(200); }
  if (r.to_full) { const c = await rpc('eth_getCode', [r.to_full, 'latest']); e.to_is_contract = c === null ? null : c !== '0x'; await sleep(200); }
  out.push(e);
}
fs.writeFileSync(path.join(CACHE, `evidence_${chain}.json`), JSON.stringify(out, null, 1));
for (const e of out) console.log(e.n, 'to=' + (e.to_full || 'null').slice(0, 6) + '..' + (e.to_full || '').slice(-4), 'to_txs=' + e.to_txs_in_sample, 'to_senders=' + e.to_distinct_senders, 'to_contract=' + e.to_is_contract, e.role ? `${e.role}=${e.target.slice(0, 6)}..${e.target.slice(-4)} contract=${e.target_is_contract} codeB=${e.target_code_bytes} approvers=${e.spender_distinct_approvers_in_sample} amt=${e.amount_hex_head || ''}` : '');

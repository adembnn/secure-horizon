// Verificateur LECTURE SEULE (test de rejeu). Pour un contrat EvidenceAnchor :
//  1. lit les evenements Anchored via eth_getLogs ;
//  2. verifie l'integrite du journal local ;
//  3. recalcule la racine de chaque intervalle depuis le journal local et la compare a celle on-chain.
// Verdict global : "identique" ou "divergent". Code de sortie 0 / 1.
//
// usage : node verify_anchor.mjs --contract 0x... --journal journal.jsonl [--rpc URL] [--from-block N] [--sender 0x...] [--chunk N]
import { Journal } from './journal.mjs';
import { rpc, FUJI_RPC, ANCHORED_TOPIC0, decodeAnchoredLog, q } from './eth.mjs';

export async function fetchAnchors({ contract, rpcUrl = FUJI_RPC, fromBlock = 0, chunk = 0 }) {
  const latest = parseInt(await rpc(rpcUrl, 'eth_blockNumber'), 16);
  const logs = [];
  const base = { address: contract, topics: [ANCHORED_TOPIC0] };
  if (!chunk) logs.push(...await rpc(rpcUrl, 'eth_getLogs', [{ ...base, fromBlock: q(fromBlock), toBlock: q(latest) }]));
  else for (let b = fromBlock; b <= latest; b += chunk) logs.push(...await rpc(rpcUrl, 'eth_getLogs', [{ ...base, fromBlock: q(b), toBlock: q(Math.min(b + chunk - 1, latest)) }]));
  return { latest, anchors: logs.map(decodeAnchoredLog).sort((a, b) => a.blockNumber - b.blockNumber || a.seq - b.seq) };
}

export function replay(journal, anchors, { sender } = {}) {
  const integrity = journal.verify();
  const n = integrity.count, results = [];
  const list = sender ? anchors.filter((a) => a.sender.toLowerCase() === sender.toLowerCase()) : anchors;
  for (const a of list) {
    const r = { seq: a.seq, from: a.fromIndex, to: a.toIndex, onchainRoot: a.root, blockNumber: a.blockNumber, blockTime: a.blockTime, txHash: a.txHash, sender: a.sender };
    if (a.toIndex >= n) { r.status = 'divergent'; r.reason = `journal local trop court (${n} entrees, ancrage jusqu'a ${a.toIndex}) : suppression ou troncature`; }
    else {
      // Racine recalculee sur les entrees telles que lues (meme si la chaine est cassee ailleurs : c'est la racine qui juge).
      r.localRoot = journal.rootOf(a.fromIndex, a.toIndex);
      if (r.localRoot.toLowerCase() === a.root.toLowerCase()) r.status = 'identique';
      else { r.status = 'divergent'; r.reason = 'racine recalculee differente : une entree de l\'intervalle a ete modifiee, deplacee ou supprimee'; }
    }
    results.push(r);
  }
  const verdict = results.length > 0 && results.every((r) => r.status === 'identique') && integrity.ok ? 'identique' : 'divergent';
  const note = results.length === 0 ? 'aucun ancrage trouve (rien a comparer)' : (!integrity.ok ? 'chaine du journal local rompue' : '');
  return { verdict, note, integrity, anchorsChecked: results.length, results };
}

function arg(name, def) { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; }
if (process.argv[1] && process.argv[1].endsWith('verify_anchor.mjs')) {
  const contract = arg('contract'), jp = arg('journal');
  if (!contract || !jp) { console.log('usage: node verify_anchor.mjs --contract 0x... --journal journal.jsonl [--rpc URL] [--from-block N] [--sender 0x...] [--chunk N]'); process.exit(2); }
  const { latest, anchors } = await fetchAnchors({ contract, rpcUrl: arg('rpc', FUJI_RPC), fromBlock: Number(arg('from-block', 0)), chunk: Number(arg('chunk', 0)) });
  const out = replay(new Journal({ path: jp }), anchors, { sender: arg('sender') });
  console.log(`bloc courant ${latest} | ancrages lus ${anchors.length}`);
  for (const r of out.results) console.log(`  #${r.seq} [${r.from}..${r.to}] bloc ${r.blockNumber} -> ${r.status}${r.reason ? ' : ' + r.reason : ''}`);
  console.log(`VERDICT : ${out.verdict}${out.note ? ' (' + out.note + ')' : ''}`);
  process.exit(out.verdict === 'identique' ? 0 : 1);
}

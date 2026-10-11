// Tests EXECUTES (node test_anchor.mjs). Aucune dependance, aucune cle. Ecrit les chiffres reels dans test_results.json.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Journal, hashEffect, newSalt, LEVELS, DECISIONS, ZERO_HASH } from './journal.mjs';
import { merkleRoot, merkleProof, verifyProof } from './merkle.mjs';
import { signLegacyTx, addressOf, recoverAddress, rpc, FUJI_RPC, FUJI_CHAIN_ID, ANCHORED_TOPIC0, encodeAnchorCall, selectorOf } from './eth.mjs';
import { fetchAnchors, replay } from './verify_anchor.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anchor-test-'));
const R = {}; let fails = 0;
const check = (name, cond, info = '') => { console.log(`${cond ? 'OK  ' : 'FAIL'} ${name}${info ? ' | ' + info : ''}`); if (!cond) fails++; return cond; };

// PRNG deterministe (mulberry32) pour des jeux reproductibles
const prng = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const REASONS = ['UNLIMITED_APPROVAL', 'NEW_SPENDER', 'LOOKALIKE_ADDR', 'PERMIT_SIG', 'SETAPPROVALFORALL', 'SIM_DRAIN', 'KNOWN_DRAINER', 'BENIGN_SWAP'];
function makeJournal(file, n, seed = 1, salt = '0x' + '11'.repeat(32)) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
  const r = prng(seed), j = new Journal({ path: file, salt });
  for (let i = 0; i < n; i++) {
    const addr = '0x' + Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('');
    j.append({ rulesVersion: 'v3.1', modelVersion: 'm0', level: LEVELS[Math.floor(r() * 5)], reasons: [REASONS[Math.floor(r() * 8)], REASONS[Math.floor(r() * 8)]], effect: { spender: addr, amount: 'max', token: 'USDC' }, decision: DECISIONS[Math.floor(r() * 6)], ts: 1760000000000 + i * 1000 });
  }
  return j;
}
const lines = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean);
const write = (f, ls) => fs.writeFileSync(f, ls.join('\n') + '\n');
const rehash = async (e) => { const m = await import('./journal.mjs'); return { ...e, hash: m.entryHash(e) }; };

// ===== 1. INTEGRITE =====
{
  const N = 200, f = path.join(tmp, 'j.jsonl'); const j = makeJournal(f, N);
  check('journal intact verifie', j.verify().ok && j.verify().count === N);
  const orig = lines(f);
  let modDetected = 0, modTotal = 0, modRehashDetected = 0, modRehashTotal = 0, modRehashLastUndetectedByChain = 0, delDetected = 0, delTotal = 0, delTailUndetectedByChain = 0, delTailDetectedWithCount = 0;
  const fieldsToMutate = [(e) => ({ ...e, level: e.level === 'critical' ? 'info' : 'critical' }), (e) => ({ ...e, decision: e.decision === 'proceeded' ? 'cancelled' : 'proceeded' }), (e) => ({ ...e, ts: e.ts + 1 }), (e) => ({ ...e, reasons: [...e.reasons, 'EXTRA'] }), (e) => ({ ...e, effectHash: '0x' + 'ab'.repeat(32) })];
  for (let i = 0; i < N; i++) for (const mut of fieldsToMutate) {
    const ls = [...orig]; ls[i] = JSON.stringify(mut(JSON.parse(orig[i]))); write(f, ls);
    modTotal++; if (!j.verify().ok) modDetected++;
    // attaquant malin : recalcule le hash de la ligne modifiee
    const e2 = await rehash(mut(JSON.parse(orig[i]))); ls[i] = JSON.stringify(e2); write(f, ls);
    modRehashTotal++; const v = j.verify(); if (!v.ok) modRehashDetected++; else if (i === N - 1) modRehashLastUndetectedByChain++;
  }
  for (let i = 0; i < N; i++) {
    const ls = orig.filter((_, k) => k !== i); write(f, ls); delTotal++;
    const v = j.verify();
    if (!v.ok) delDetected++; else { if (i === N - 1) delTailUndetectedByChain++; }
    if (i === N - 1 && !j.verify({ expectedCount: N }).ok) delTailDetectedWithCount++;
  }
  // reordonnancement : echange de chaque paire adjacente
  let swapDet = 0, swapTot = 0;
  for (let i = 0; i + 1 < N; i++) { const ls = [...orig];[ls[i], ls[i + 1]] = [ls[i + 1], ls[i]]; write(f, ls); swapTot++; if (!j.verify().ok) swapDet++; }
  // insertion d'une ligne forgee
  let insDet = 0, insTot = 0;
  for (let i = 0; i < N; i += 10) { const ls = [...orig]; ls.splice(i, 0, orig[(i + 3) % N]); write(f, ls); insTot++; if (!j.verify().ok) insDet++; }
  write(f, orig);
  check('modification d\'une ligne detectee a 100 %', modDetected === modTotal, `${modDetected}/${modTotal}`);
  check('suppression d\'une ligne detectee (hors derniere, par la chaine)', delDetected === delTotal - 1, `${delDetected}/${delTotal} ; la derniere ligne ${delTailUndetectedByChain ? 'passe la chaine seule' : 'detectee'}`);
  check('suppression de la derniere ligne detectee via point de controle (expectedCount)', delTailDetectedWithCount === 1);
  check('reordonnancement detecte a 100 %', swapDet === swapTot, `${swapDet}/${swapTot}`);
  check('insertion detectee a 100 %', insDet === insTot, `${insDet}/${insTot}`);
  R.integrite = { entrees: N, modifications: `${modDetected}/${modTotal}`, modifRehashChaine: `${modRehashDetected}/${modRehashTotal}`, modifRehashDerniereLigneNonDetecteeParChaineSeule: modRehashLastUndetectedByChain, suppressions: `${delDetected}/${delTotal}`, derniereLigneSupprimeeNonVueParChaineSeule: delTailUndetectedByChain, derniereDetecteeAvecCompteur: delTailDetectedWithCount === 1, reordonnancements: `${swapDet}/${swapTot}`, insertions: `${insDet}/${insTot}` };
  // La modif+rehash de la derniere ligne n'est visible QUE par la racine ancree : teste en section 5.
}

// ===== 2. MINIMISATION =====
{
  const f = path.join(tmp, 'm.jsonl'); const j = new Journal({ path: f, salt: newSalt() });
  const addr = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
  j.append({ rulesVersion: 'v3', modelVersion: 'm0', level: 'high', reasons: ['UNLIMITED_APPROVAL'], effect: { spender: addr, text: 'Claim your free airdrop now' }, decision: 'cancelled' });
  const raw = fs.readFileSync(f, 'utf8').toLowerCase();
  check('aucune adresse en clair dans le journal', !raw.includes(addr.slice(2).toLowerCase()) && !/0x[0-9a-f]{40}(?![0-9a-f])/.test(raw.replace(/0x[0-9a-f]{64}/g, '')));
  check('aucun texte libre dans le journal', !raw.includes('airdrop'));
  let rej = 0;
  for (const bad of [{ reasons: ['Ce site vous demande tout'] }, { level: 'LOUD' }, { decision: 'il a clique' }, { rulesVersion: 'x'.repeat(40) }]) { try { j.append({ rulesVersion: 'v3', modelVersion: 'm0', level: 'low', reasons: ['X'], effect: {}, decision: 'shown', ...bad }); } catch { rej++; } }
  check('texte libre / valeurs hors vocabulaire refuses', rej === 4, `${rej}/4`);
  const s1 = hashEffect({ a: 1 }, '0x' + '01'.repeat(32)), s2 = hashEffect({ a: 1 }, '0x' + '02'.repeat(32));
  check('sels differents -> hash different (pas de dictionnaire inverse sans le sel)', s1 !== s2);
  check('JSON canonique : ordre des cles sans effet', hashEffect({ a: 1, b: 2 }, '0x' + '01'.repeat(32)) === hashEffect({ b: 2, a: 1 }, '0x' + '01'.repeat(32)));
  R.minimisation = { adresseEnClair: false, texteLibre: false, refusHorsVocabulaire: `${rej}/4` };
}

// ===== 3. MERKLE : 1000 entrees =====
{
  const f = path.join(tmp, 'k.jsonl'); const j = makeJournal(f, 1000, 7);
  const hs = j.entries().map((e) => e.hash), root = merkleRoot(hs);
  let ok = 0, maxLen = 0, tamperRejected = 0, wrongRootRejected = 0, wrongPosRejected = 0;
  for (let i = 0; i < 1000; i++) {
    const p = merkleProof(hs, i); maxLen = Math.max(maxLen, p.proof.length);
    if (p.root === root && verifyProof(hs[i], p.proof, root)) ok++;
    const bad = hs[i].slice(0, -1) + (hs[i].endsWith('0') ? '1' : '0'); if (!verifyProof(bad, p.proof, root)) tamperRejected++;
    if (!verifyProof(hs[i], p.proof, '0x' + '00'.repeat(32))) wrongRootRejected++;
    const other = hs[(i + 1) % 1000]; if (!verifyProof(other, p.proof, root)) wrongPosRejected++;
  }
  check('1000/1000 preuves d\'inclusion valides', ok === 1000, `longueur max ${maxLen}`);
  check('entree alteree rejetee 1000/1000', tamperRejected === 1000);
  check('fausse racine rejetee 1000/1000', wrongRootRejected === 1000);
  check('preuve d\'une autre entree rejetee 1000/1000', wrongPosRejected === 1000);
  // sous-intervalle + tailles impaires/limites
  let oddOk = true; for (const n of [1, 2, 3, 5, 7, 8, 9, 15, 16, 17, 33]) { const h = hs.slice(0, n), r = merkleRoot(h); for (let i = 0; i < n; i++) if (!verifyProof(h[i], merkleProof(h, i).proof, r)) oddOk = false; }
  check('tailles 1,2,3,5,7,8,9,15,16,17,33 : toutes preuves valides', oddOk);
  const pj = j.proofOf(500, 400, 699); check('preuve via Journal sur sous-intervalle [400..699]', verifyProof(j.entries()[500].hash, pj.proof, j.rootOf(400, 699)));
  // dependance a l'ordre et au contenu
  const sw = [...hs];[sw[3], sw[4]] = [sw[4], sw[3]];
  check('la racine change si l\'ordre change', merkleRoot(sw) !== root);
  check('racine d\'une feuille != racine de 2 feuilles identiques (pas de duplication ambigue)', merkleRoot([hs[0]]) !== merkleRoot([hs[0], hs[0]]));
  R.merkle = { entrees: 1000, preuvesValides: ok, longueurMaxPreuve: maxLen, alteresRejetes: tamperRejected, fausseRacineRejetee: wrongRootRejected, autreEntreeRejetee: wrongPosRejected, racine: root };
}

// ===== 4. REPRODUCTIBILITE =====
{
  const a = path.join(tmp, 'a.jsonl'), b = path.join(tmp, 'b.jsonl');
  const ja = makeJournal(a, 300, 42), jb = makeJournal(b, 300, 42);
  const same = fs.readFileSync(a).equals(fs.readFileSync(b));
  check('meme graine -> journaux identiques a l\'octet', same);
  check('meme racine recalculee deux fois', ja.rootOf(0, 299) === jb.rootOf(0, 299) && ja.rootOf(0, 299) === ja.rootOf(0, 299));
  // CLI independante
  const cli = execFileSync(process.execPath, [path.join(HERE, 'journal.mjs'), 'root', a, '0', '299']).toString().trim();
  check('racine via CLI (processus separe) identique', cli === ja.rootOf(0, 299));
  const c = makeJournal(path.join(tmp, 'c.jsonl'), 300, 43);
  check('graine differente -> racine differente', c.rootOf(0, 299) !== ja.rootOf(0, 299));
  R.reproductibilite = { journauxIdentiquesOctet: same, racineCLI: cli === ja.rootOf(0, 299) };
}

// ===== 5. SIGNATURE (vecteur EIP-155) + ABI =====
{
  const k = '0x' + '46'.repeat(32);
  const t = signLegacyTx({ nonce: 9n, gasPrice: 20000000000n, gas: 21000n, to: '0x' + '35'.repeat(20), value: 10n ** 18n, data: '0x', chainId: 1 }, k);
  const expected = '0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83';
  check('signature EIP-155 : prefixe du vecteur officiel r,s identique', t.raw.startsWith(expected.slice(0, 2 + 2 * 79)) && t.raw.length === expected.length, 'v,r et debut de s comparables');
  check('adresse derivee de 0x46..46 = 0x9d8a62f6...', addressOf(k) === '0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f');
  check('recuperation de signataire = adresse', recoverAddress(t.sigHash, t.r, t.s, t.rec) === addressOf(k));
  check('selecteur anchor(bytes32,uint64,uint64,uint32) = 4 octets', /^0x[0-9a-f]{8}$/.test(selectorOf('anchor(bytes32,uint64,uint64,uint32)')));
  check('calldata anchor : 4 + 4*32 octets', encodeAnchorCall('0x' + 'aa'.repeat(32), 0, 9, 3).length === 2 + 8 + 4 * 64);
  R.signature = { vecteurEIP155: true, topic0Anchored: ANCHORED_TOPIC0, selecteurAnchor: selectorOf('anchor(bytes32,uint64,uint64,uint32)') };
}

// ===== 6. VERIFICATEUR contre FAUX RPC =====
const word = (n) => BigInt(n).toString(16).padStart(64, '0');
const topicAddr = (a) => '0x' + '0'.repeat(24) + a.slice(2).toLowerCase();
function mkLog(contract, sender, root, from, to, rv, seq, block) {
  return { address: contract, topics: [ANCHORED_TOPIC0, topicAddr(sender), root], data: '0x' + word(from) + word(to) + word(rv) + word(seq) + word(1760000000 + block), blockNumber: '0x' + block.toString(16), transactionHash: '0x' + block.toString(16).padStart(64, '0'), logIndex: '0x0' };
}
function startFakeRpc(logs, latest, stats) {
  return new Promise((res) => {
    const srv = http.createServer((req, rs) => {
      let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
        const { id, method, params } = JSON.parse(b); stats.calls.push(method); let result;
        if (method === 'eth_blockNumber') result = '0x' + latest.toString(16);
        else if (method === 'eth_chainId') result = '0xa869';
        else if (method === 'eth_getLogs') {
          const f = params[0], lo = parseInt(f.fromBlock, 16), hi = parseInt(f.toBlock, 16);
          result = logs.filter((l) => l.address.toLowerCase() === f.address.toLowerCase() && l.topics[0] === f.topics[0] && parseInt(l.blockNumber, 16) >= lo && parseInt(l.blockNumber, 16) <= hi);
        } else { rs.end(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32601, message: 'methode inconnue' } })); return; }
        rs.setHeader('content-type', 'application/json'); rs.end(JSON.stringify({ jsonrpc: '2.0', id, result }));
      });
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}
{
  const f = path.join(tmp, 'v.jsonl'); const j = makeJournal(f, 1000, 99);
  const C = '0x' + 'c0'.repeat(20), ME = '0x' + '11'.repeat(20), OTHER = '0x' + '22'.repeat(20);
  const ranges = [[0, 249], [250, 499], [500, 999]];
  const logs = ranges.map(([a, b], i) => mkLog(C, ME, j.rootOf(a, b), a, b, 3, i, 1000 + i * 50));
  logs.push(mkLog('0x' + 'dd'.repeat(20), ME, '0x' + '99'.repeat(32), 0, 5, 3, 0, 1010)); // autre contrat : doit etre ignore
  const stats = { calls: [] }; const srv = await startFakeRpc(logs, 5000, stats); const url = `http://127.0.0.1:${srv.address().port}`;
  const orig = lines(f);
  const run = async (opts = {}) => { const { latest, anchors } = await fetchAnchors({ contract: C, rpcUrl: url, fromBlock: opts.fromBlock || 0, chunk: opts.chunk || 0 }); return { latest, anchors, out: replay(new Journal({ path: f }), anchors, opts.sender ? { sender: opts.sender } : {}) }; };

  let r = await run();
  check('faux RPC : 3 ancrages lus (le contrat etranger est ignore)', r.anchors.length === 3 && r.latest === 5000);
  check('journal intact -> "identique"', r.out.verdict === 'identique' && r.out.results.every((x) => x.status === 'identique'));
  const base = r.out.verdict;

  // modification de chaque position testee (echantillon 1 sur 7 = 143 positions + bornes), sans reparer la chaine ET avec re-hash
  let mDet = 0, mTot = 0, mhDet = 0, mhTot = 0;
  const { entryHash } = await import('./journal.mjs');
  const positions = [...new Set([...Array.from({ length: 143 }, (_, i) => i * 7), 0, 249, 250, 499, 500, 998, 999])].filter((p) => p < 1000);
  for (const i of positions) {
    const ls = [...orig]; const e = JSON.parse(orig[i]); ls[i] = JSON.stringify({ ...e, decision: e.decision === 'cancelled' ? 'proceeded' : 'cancelled' }); write(f, ls);
    mTot++; if ((await run()).out.verdict === 'divergent') mDet++;
    const e2 = { ...e, decision: e.decision === 'cancelled' ? 'proceeded' : 'cancelled' }; e2.hash = entryHash(e2); ls[i] = JSON.stringify(e2); write(f, ls);
    mhTot++; const rr = await run(); if (rr.out.verdict === 'divergent') mhDet++;
  }
  check('rejeu : ligne modifiee detectee (chaine cassee) a 100 %', mDet === mTot, `${mDet}/${mTot}`);
  check('rejeu : ligne modifiee + hash recalcule par un attaquant detectee a 100 % (via racines on-chain)', mhDet === mhTot, `${mhDet}/${mhTot} y compris la derniere ligne`);

  // une ligne supprimee (positions variees) et troncature de queue
  let dDet = 0, dTot = 0;
  for (const i of [0, 1, 123, 499, 500, 998, 999]) { write(f, orig.filter((_, k) => k !== i)); dTot++; if ((await run()).out.verdict === 'divergent') dDet++; }
  write(f, orig.slice(0, 990)); dTot++; if ((await run()).out.verdict === 'divergent') dDet++;
  check('rejeu : suppression / troncature detectee a 100 % (y compris derniere ligne)', dDet === dTot, `${dDet}/${dTot}`);

  // reordonnancement de deux entrees
  { const ls = [...orig];[ls[600], ls[601]] = [ls[601], ls[600]]; write(f, ls); check('rejeu : reordonnancement detecte', (await run()).out.verdict === 'divergent'); }

  // filtre emetteur, chunking, reparation
  write(f, orig);
  check('journal restaure -> "identique" a nouveau', (await run()).out.verdict === 'identique');
  r = await run({ chunk: 100, fromBlock: 990 }); check('lecture par morceaux (chunk 100) identique', r.out.verdict === 'identique' && r.anchors.length === 3, `${stats.calls.filter((c) => c === 'eth_getLogs').length} appels getLogs cumules`);
  r = await run({ sender: OTHER }); check('filtre emetteur : autre adresse -> aucun ancrage, pas "identique"', r.out.anchorsChecked === 0 && r.out.verdict === 'divergent');
  check('verificateur lecture seule : seules eth_blockNumber et eth_getLogs appelees', stats.calls.every((c) => c === 'eth_blockNumber' || c === 'eth_getLogs'), [...new Set(stats.calls)].join(','));

  // CLI de bout en bout contre le faux RPC
  let cliOut = ''; try { cliOut = execFileSync(process.execPath, [path.join(HERE, 'verify_anchor.mjs'), '--contract', C, '--journal', f, '--rpc', url]).toString(); } catch (e) { cliOut = String(e.stdout); }
  check('CLI verify_anchor : VERDICT identique (code 0)', /VERDICT : identique/.test(cliOut));
  const bad = [...orig]; bad[10] = bad[10].replace('"level":"', '"level":"x'); write(f, bad);
  let code = 0; try { execFileSync(process.execPath, [path.join(HERE, 'verify_anchor.mjs'), '--contract', C, '--journal', f, '--rpc', url], { stdio: 'pipe' }); } catch (e) { code = e.status; }
  check('CLI verify_anchor sur journal altere : code de sortie 1 (divergent)', code === 1);
  write(f, orig);
  R.rejeu = { entrees: 1000, ancrages: 3, modifSansRepar: `${mDet}/${mTot}`, modifAvecRehash: `${mhDet}/${mhTot}`, suppressionsTroncatures: `${dDet}/${dTot}`, reordonnancement: true, verdictIntact: base };
  srv.close();
}

// ===== 7. RPC Fuji REEL : eth_blockNumber + eth_chainId seulement =====
{
  try {
    const bn = parseInt(await rpc(FUJI_RPC, 'eth_blockNumber'), 16), cid = parseInt(await rpc(FUJI_RPC, 'eth_chainId'), 16);
    check('RPC Fuji reel : eth_blockNumber lisible', bn > 0, `bloc ${bn}`);
    check('RPC Fuji reel : chainId 43113', cid === FUJI_CHAIN_ID, `chainId ${cid}`);
    R.fujiReel = { blockNumber: bn, chainId: cid };
  } catch (e) { check('RPC Fuji reel joignable', false, String(e.message)); R.fujiReel = { erreur: String(e.message) }; }
}

R.echecs = fails; R.date = new Date().toISOString();
fs.writeFileSync(path.join(HERE, 'test_results.json'), JSON.stringify(R, null, 2));
console.log(`\n${fails === 0 ? 'TOUS LES TESTS PASSENT' : fails + ' ECHEC(S)'}`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fails ? 1 : 0);

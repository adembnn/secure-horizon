#!/usr/bin/env node
// Auditor's check of ONE Hold up decision, end to end. Read-only, no network unless --contract is given.
//
//   node verify_decision.mjs --journal <journal.jsonl> --seq <n> [--request <request.json>] [--context <context.json>]
//                            [--anchor-root 0x<64 hex>] [--contract 0x<40 hex> [--rpc <url>] [--from-block <n>]]
//                            [--selftest]      tamper / truncation demonstration on a temporary copy
//                            [--list]          list the journal lines and exit
//
// What it does, in order:
//   1. recomputes the sha256 hash chain of the journal with its OWN code (not the server's), then cross-checks with the server's verifyJournal;
//   2. prints the line `seq` and the Merkle root of the whole journal with an inclusion proof for that line
//      (same tree convention as anchor/merkle.mjs); compares with --anchor-root or with the on-chain EvidenceAnchor events;
//   3. if --request is given: checks that sha256(params) equals the hash stored in the line, then RE-RUNS the product's own
//      `evaluate` (imported from server/server.mjs, unmodified) with the clock set to the line's timestamp, and compares the verdict;
//   4. prints which rule produced which reason (code -> source file:line, severity, detail) and the decision-code fingerprint.
// Exit code: 0 all requested checks pass, 1 a check fails, 2 usage error.
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync, mkdtempSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BANC = resolve(HERE, '..', '..', 'titouan', 'T_banc_e2e');
const imp = (p) => import(pathToFileURL(p).href);

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d; };
const flag = (n) => argv.includes('--' + n);
const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const ZERO = '0'.repeat(64);
const out = (...a) => console.log(...a);
let failed = false;
const verdictLine = (ok, label, info = '') => { out(`${ok ? 'OK    ' : 'ECHEC '} ${label}${info ? ' | ' + info : ''}`); if (!ok) failed = true; return ok; };

const jpath = arg('journal');
if (!jpath || !existsSync(jpath)) { console.error('usage: node verify_decision.mjs --journal <journal.jsonl> --seq <n> [--request r.json] [--context c.json] [--anchor-root 0x..] [--contract 0x..] [--selftest] [--list]'); process.exit(2); }

// ---- 1. hash chain, independent implementation -------------------------------------------------------------------------
// Rule written by the server (server.mjs makeJournal): hash = sha256(prev + '|' + seq + '|' + ts + '|' + JSON.stringify(entry)).
function readRecords(file) { return readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); }
function verifyChain(recs) {
  let prev = ZERO, i = 0;
  for (const r of recs) {
    i++;
    if (r.seq !== i) return { ok: false, brokenAt: r.seq, why: `numero de ligne attendu ${i}, lu ${r.seq} (ligne supprimee, inseree ou deplacee)` };
    if (r.prev !== prev) return { ok: false, brokenAt: r.seq, why: 'prev different du hachage de la ligne precedente' };
    if (r.hash !== sha256(r.prev + '|' + r.seq + '|' + r.ts + '|' + JSON.stringify(r.entry))) return { ok: false, brokenAt: r.seq, why: 'contenu modifie (le hachage ne correspond plus)' };
    prev = r.hash;
  }
  return { ok: true, n: recs.length, head: prev };
}

const recs = readRecords(jpath);
if (flag('list')) {
  for (const r of recs) out(String(r.seq).padStart(4), r.ts, r.entry.type, r.entry.method || '', r.entry.level || '', (r.entry.codes || []).join(','));
  process.exit(0);
}
const seq = Number(arg('seq', recs.length));
out(`Journal : ${jpath}`);
const chain = verifyChain(recs);
verdictLine(chain.ok, 'chaine de hachage recalculee (sha256, code independant)', chain.ok ? `${chain.n} lignes, tete ${chain.head.slice(0, 16)}...` : `rompue a la ligne ${chain.brokenAt} : ${chain.why}`);
const SRV = await imp(join(BANC, 'server', 'server.mjs'));
const srvCheck = SRV.verifyJournal(jpath);
verdictLine(srvCheck.ok === chain.ok, 'meme conclusion que verifyJournal du serveur', srvCheck.ok ? `${srvCheck.n} lignes` : `casse ligne ${srvCheck.brokenAt}`);

const rec = recs.find((r) => r.seq === seq);
if (!rec) { out(`Ligne ${seq} introuvable.`); process.exit(2); }
out(`\nLigne ${seq} :`);
out(JSON.stringify(rec, null, 2).split('\n').map((l) => '  ' + l).join('\n'));

// ---- 2. Merkle root + inclusion proof; comparison with an anchor ----------------------------------------------------------
const { merkleTree, verifyProof } = await imp(join(BANC, 'anchor', 'merkle.mjs'));
const hashes = recs.map((r) => '0x' + r.hash);
const tree = merkleTree(hashes);
const proof = tree.proof(seq - 1);
out(`\nRacine de Merkle du journal (${recs.length} lignes, feuilles = hachages de ligne, convention anchor/merkle.mjs) : ${tree.root}`);
verdictLine(verifyProof(hashes[seq - 1], proof.proof, tree.root), `preuve d'inclusion de la ligne ${seq} (${proof.proof.length} hachages freres)`, 'recalculable sans les autres lignes');
const anchorRoot = arg('anchor-root');
if (anchorRoot) verdictLine(anchorRoot.toLowerCase() === tree.root.toLowerCase(), 'racine du journal = racine fournie (--anchor-root)', anchorRoot.slice(0, 18) + '...');
const contract = arg('contract');
if (contract) {
  try {
    const { fetchAnchors } = await imp(join(BANC, 'anchor', 'verify_anchor.mjs'));
    const { anchors, latest } = await fetchAnchors({ contract, rpcUrl: arg('rpc'), fromBlock: Number(arg('from-block', 0)) });
    out(`Ancrages lus sur la chaine (bloc courant ${latest}) : ${anchors.length}`);
    const covering = anchors.filter((a) => a.fromIndex <= seq - 1 && seq - 1 <= a.toIndex);
    if (!covering.length) verdictLine(false, `aucun ancrage ne couvre la ligne ${seq}`);
    for (const a of covering) {
      const sub = merkleTree(hashes.slice(a.fromIndex, a.toIndex + 1)).root;
      verdictLine(sub.toLowerCase() === a.root.toLowerCase(), `racine recalculee [${a.fromIndex}..${a.toIndex}] = racine on-chain (bloc ${a.blockNumber}, ${new Date(a.blockTime * 1000).toISOString()})`);
    }
  } catch (e) { verdictLine(false, 'lecture des ancrages impossible', String(e.message || e)); }
} else if (!anchorRoot) out('Ancrage on-chain : non verifie (ni --anchor-root ni --contract). Sans ancrage, une reecriture complete du journal reste possible.');

// ---- 3. replay -----------------------------------------------------------------------------------------------------------------
const e = rec.entry;
let verdict = null;
const reqPath = arg('request');
if (reqPath && e.type !== 'verdict') {
  out(`
Rejeu : non pris en charge pour une ligne de type "${e.type}". ` + (String(e.type).startsWith('rpc_') ? 'La porte 2 ne garde pas la transaction brute ; si elle a ete diffusee, on la retrouve par son hachage ' + (e.tx || '') + ' sur la chaine, puis on la rejoue avec le moteur.' : 'Seules les lignes "verdict" de la porte 1 portent une empreinte de requete.'));
} else if (reqPath) {
  out('\nRejeu :');
  const body = JSON.parse(readFileSync(reqPath, 'utf8'));
  const ph = sha256(JSON.stringify(body.params === undefined ? null : body.params));
  verdictLine(ph === e.params_sha256, 'sha256(params de la requete fournie) = params_sha256 de la ligne', ph.slice(0, 16) + '...');
  verdictLine(String(body.method || '').slice(0, 60) === e.method && String(body.origin || '').slice(0, 200) === e.origin, 'methode et origine de la requete = celles de la ligne', `${e.method} @ ${e.origin}`);
  const ctxFile = arg('context');
  const local = ctxFile ? SRV.loadLocalContext(ctxFile) : { contacts: [], history: [], protected: [], knownSpenders: [] };
  out(`  contexte local : ${ctxFile ? ctxFile + ' (sha256 ' + sha256(readFileSync(ctxFile)).slice(0, 16) + '..., NON enregistre dans le journal)' : 'vide'}`);
  const realNow = Date.now, t = Date.parse(rec.ts);
  const run = () => { Date.now = () => t; try { const v = SRV.evaluate(JSON.parse(JSON.stringify(body)), local); delete v.latency_ms; delete v.latency_engine_ms; return v; } finally { Date.now = realNow; } };
  const v1 = run(), v2 = run();
  verdictLine(JSON.stringify(v1) === JSON.stringify(v2), 'determinisme : deux rejeux donnent exactement le meme verdict complet (hors latence)');
  verdict = v1;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  verdictLine(v1.level === e.level && v1.niveau === e.niveau, 'niveau rejoue = niveau journalise', `${v1.level}/${v1.niveau} vs ${e.level}/${e.niveau}`);
  verdictLine((v1.fiche || null) === (e.fiche || null), 'fiche rejouee = fiche journalisee', `${v1.fiche || null} vs ${e.fiche || null}`);
  verdictLine(same(v1.codes || [], e.codes || []), 'codes de regle rejoues = codes journalises', `[${(v1.codes || []).join(',')}] vs [${(e.codes || []).join(',')}]`);
  if (!(v1.level === e.level && same(v1.codes || [], e.codes || []))) out('  Si ce rejeu echoue alors que la chaine est valide : requete, contexte local ou version du code differents de ceux de la decision (aucun n\'est enregistre en entier dans la ligne).');
}

// ---- 4. which rule produced which reason --------------------------------------------------------------------------------------
const SRC = [
  ...(existsSync(join(BANC, 'engine', 'src')) ? readdirSync(join(BANC, 'engine', 'src')).filter((f) => f.endsWith('.mjs')).map((f) => join(BANC, 'engine', 'src', f)) : []),
  join(BANC, 'engine', 'vendor', 'compare.ts'), join(BANC, 'run', 'policy.mjs'), join(BANC, 'server', 'server.mjs'),
].filter(existsSync);
const srcText = new Map(SRC.map((f) => [f, readFileSync(f, 'utf8').split('\n')]));
function whereDefined(code) {
  const re = new RegExp(`['"\`]${code}['"\`]`);
  for (const [f, lines] of srcText) { const i = lines.findIndex((l) => re.test(l)); if (i >= 0) return `${f.slice(BANC.length + 1).replace(/\\/g, '/')}:${i + 1}`; }
  return 'source non trouvee';
}
out('\nRegles a l\'origine du verdict de la ligne ' + seq + ' :');
const codes = e.codes || [];
if (!codes.length) out('  aucun code de regle dans la ligne (verdict "non verifie" ou niveau minimal sans signal).');
for (const c of codes) {
  const r = verdict && (verdict.raisons || []).find((x) => x.code === c);
  out(`  - ${c.padEnd(26)} ${r && r.severity ? '[' + r.severity + '] ' : ''}${whereDefined(c)}`);
  if (r && (r.detail || r.said)) out(`      ${String(r.detail || ('dit: ' + r.said + ' / fait: ' + r.does)).slice(0, 200)}`);
}
if (verdict && verdict.level === 'manipulation') {
  const sv = srcText.get(join(BANC, 'server', 'server.mjs')) || [];
  const li = sv.findIndex((l) => l.includes('export function findPressure'));
  out(`  - NIVEAU "manipulation" : produit par findPressure() (mots-cles de pression sur le texte de la page, server/server.mjs:${li + 1}), citation "${String(verdict.quote || '').slice(0, 80)}". Ce n'est PAS un code de regle : il n'apparait pas dans "codes" de la ligne (trou de tracabilite, voir EXPLICABILITE.md).`);
}
if (verdict) {
  const t = verdict.texts || {};
  out('  Ce que la personne a lu :');
  for (const k of ['croit', 'reel', 'danger', 'action']) if (t[k]) out(`    ${k.padEnd(7)} ${t[k]}`);
}
const fp = sha256(SRC.sort().map((f) => f.slice(BANC.length) + '\n' + readFileSync(f, 'utf8')).join('\n---\n'));
out(`\nEmpreinte du code de decision (engine/src/*.mjs, compare.ts, policy.mjs, server.mjs ; ${SRC.length} fichiers) : ${fp.slice(0, 16)}...  (non enregistree dans le journal)`);

// ---- 5. what the chain does and does not prove ------------------------------------------------------------------------------------
if (flag('selftest')) {
  out('\nAuto-test sur une copie temporaire du journal :');
  const dir = mkdtempSync(join(tmpdir(), 'audit-selftest-'));
  const lines = readFileSync(jpath, 'utf8').split('\n').filter(Boolean);
  const idx = Math.min(seq, lines.length) - 1;
  const w = (name, arr) => { const p = join(dir, name); writeFileSync(p, arr.join('\n') + '\n'); return p; };
  const modified = lines.slice(); const o = JSON.parse(modified[idx]); o.entry.niveau = o.entry.niveau === 'critical' ? 'info' : 'critical'; modified[idx] = JSON.stringify(o);
  let c = verifyChain(readRecords(w('modifie.jsonl', modified)));
  verdictLine(!c.ok, `ligne ${seq} modifiee (niveau change) : detectee`, c.ok ? '' : `ligne ${c.brokenAt}, ${c.why}`);
  if (lines.length > 1) {
    const del = lines.slice(); del.splice(Math.max(0, Math.min(idx, lines.length - 2)), 1);
    c = verifyChain(readRecords(w('supprime.jsonl', del)));
    verdictLine(!c.ok, 'une ligne supprimee au milieu : detectee', c.ok ? '' : `ligne ${c.brokenAt}`);
  }
  const trunc = lines.slice(0, -1);
  c = verifyChain(readRecords(w('tronque.jsonl', trunc)));
  const rootTrunc = merkleTree(readRecords(join(dir, 'tronque.jsonl')).map((r) => '0x' + r.hash)).root;
  out(`${c.ok ? 'LIMITE' : 'OK    '} derniere ligne supprimee : chaine seule ${c.ok ? 'NON detectee (la chaine reste valide)' : 'detectee'} ; la racine de Merkle change (${tree.root.slice(0, 12)}... -> ${rootTrunc.slice(0, 12)}...), donc un ancrage anterieur la detecterait`);
  const rebuilt = []; let prev = ZERO, n = 0;
  for (const l of lines) { const r = JSON.parse(l); if (n === idx) { r.entry.niveau = 'info'; r.entry.level = 'attention'; } n++; r.prev = prev; r.hash = sha256(r.prev + '|' + r.seq + '|' + r.ts + '|' + JSON.stringify(r.entry)); prev = r.hash; rebuilt.push(JSON.stringify(r)); }
  c = verifyChain(readRecords(w('reecrit.jsonl', rebuilt)));
  const rootRe = merkleTree(readRecords(join(dir, 'reecrit.jsonl')).map((r) => '0x' + r.hash)).root;
  out(`${c.ok ? 'LIMITE' : 'OK    '} journal entierement recalcule apres modification : chaine ${c.ok ? 'VALIDE (reecriture non detectable par la chaine seule)' : 'detectee'} ; racine ${rootRe === tree.root ? 'identique' : 'differente'} de l'originale (${rootRe.slice(0, 12)}... vs ${tree.root.slice(0, 12)}...) : seul un ancrage externe de l'originale la distingue`);
}
out(`\n${failed ? 'RESULTAT : au moins une verification a echoue.' : 'RESULTAT : toutes les verifications demandees passent.'}`);
process.exit(failed ? 1 : 0);

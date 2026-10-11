// Validateur du jeu ONCHAIN v2. `node validate.mjs`
// Verifie : JSON valide, champs complets, ids uniques + format + split correct,
// calldata hex (et decodable), typed data hachable si present, aucun doublon exact de requete.
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ETHERS_PATH = 'C:\\Users\\Adem\\Secure Horizon\\blockchain\\node_modules\\ethers\\lib.esm\\index.js';
const ethers = await import(pathToFileURL(ETHERS_PATH).href);
const { getAddress, isHexString } = ethers;
const HERE = dirname(fileURLToPath(import.meta.url));

const lines = readFileSync(join(HERE, 'cases.jsonl'), 'utf8').split('\n').filter((l) => l.trim());
let errors = 0;
const seenIds = new Set();
const seenReq = new Map();
const METHODS = new Set(['eth_sendTransaction', 'eth_signTypedData_v4', 'personal_sign', 'eth_sign', 'wallet_sendCalls', 'wallet_switchEthereumChain', 'wallet_addEthereumChain']);
const REQUIRED = ['id', 'synthetic', 'family', 'subfamily', 'request', 'context', 'intent', 'label', 'reason', 'expected_severity', 'ideal_severity', 'required_signals', 'catalog_category', 'source', 'split', 'split_reason', 'approximation'];

function fail(id, msg) { errors++; if (errors <= 40) console.error('FAIL', id, msg); }

function hexOk(d) { return typeof d === 'string' && isHexString(d) && d.length % 2 === 0; }
function addrOk(a) { try { getAddress(a); return true; } catch { return false; } }

function checkCalldata(id, data) {
  if (!hexOk(data)) { fail(id, 'calldata non-hex: ' + String(data).slice(0, 20)); return; }
  if (data !== '0x' && data.length < 10) fail(id, 'calldata trop court');
}

for (const line of lines) {
  let c;
  try { c = JSON.parse(line); } catch (e) { fail('?', 'JSON invalide: ' + e.message); continue; }
  for (const f of REQUIRED) if (!(f in c)) fail(c.id || '?', 'champ manquant: ' + f);

  if (!/^V2-ONCHAIN-\d{5}$/.test(c.id)) fail(c.id, 'id mal forme');
  if (seenIds.has(c.id)) fail(c.id, 'id duplique'); seenIds.add(c.id);
  if (c.synthetic !== true) fail(c.id, 'synthetic != true');
  if (c.label !== 'malveillant') fail(c.id, 'label != malveillant');
  if (c.expected_severity !== 'critical') fail(c.id, 'expected_severity != critical');
  if (c.ideal_severity !== 'critical') fail(c.id, 'ideal_severity != critical');
  if (!Array.isArray(c.required_signals) || c.required_signals.length === 0) fail(c.id, 'required_signals vide');
  if (c.approximation !== null && typeof c.approximation !== 'object') fail(c.id, 'approximation invalide');
  if (!c.intent || typeof c.intent.declaredAt !== 'number') fail(c.id, 'intent.declaredAt manquant');

  // split deterministe
  const mod = createHash('sha256').update(c.id).digest()[0] % 10;
  const want = mod < 3 ? 'TEST' : 'DEV';
  if (c.split !== want) fail(c.id, 'split incorrect: ' + c.split + ' attendu ' + want);

  // requete
  const r = c.request;
  if (!r || !METHODS.has(r.method) || !Array.isArray(r.params)) { fail(c.id, 'request invalide'); continue; }

  if (r.method === 'eth_sendTransaction') {
    const p = r.params[0];
    if (!addrOk(p.from)) fail(c.id, 'from invalide');
    if (!addrOk(p.to)) fail(c.id, 'to invalide');
    checkCalldata(c.id, p.data);
    if (p.type === '0x4') {
      if (!Array.isArray(p.authorizationList) || p.authorizationList.length === 0) fail(c.id, '7702 authorizationList vide');
      else for (const a of p.authorizationList) { if (!addrOk(a.address)) fail(c.id, '7702 delegate invalide'); if (!hexOk(a.nonce) && !/^0x[0-9a-f]+$/.test(a.nonce)) fail(c.id, '7702 nonce invalide'); }
    }
  } else if (r.method === 'wallet_sendCalls') {
    const b = r.params[0];
    if (!addrOk(b.from)) fail(c.id, 'sendCalls from invalide');
    if (!Array.isArray(b.calls) || b.calls.length === 0) fail(c.id, 'sendCalls calls vide');
    else for (const call of b.calls) { if (!addrOk(call.to)) fail(c.id, 'sendCalls call.to invalide'); checkCalldata(c.id, call.data); }
  } else if (r.method === 'eth_signTypedData_v4') {
    // typed data hachable
    try {
      const td = JSON.parse(r.params[1]);
      const types = { ...td.types }; delete types.EIP712Domain;
      ethers.TypedDataEncoder.hash(td.domain, types, td.message);
    } catch (e) { fail(c.id, 'typed data non hachable: ' + e.message); }
  }

  // doublon exact de requete
  const key = JSON.stringify(r);
  if (seenReq.has(key)) { fail(c.id, 'doublon exact de requete avec ' + seenReq.get(key)); } else seenReq.set(key, c.id);
}

console.log('---');
console.log('Lignes:', lines.length, '| ids uniques:', seenIds.size, '| requetes uniques:', seenReq.size);
console.log(errors === 0 ? 'OK — aucun probleme' : 'ERREURS: ' + errors);
process.exit(errors === 0 ? 0 : 1);

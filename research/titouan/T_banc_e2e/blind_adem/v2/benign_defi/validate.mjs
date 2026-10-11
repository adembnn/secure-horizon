// Validator for V2 BENIGN_DEFI. Usage: node validate.mjs  (regenerates into a temp file and compares byte for byte)
import { readFileSync, mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const E = await import(pathToFileURL('C:/Users/Adem/Secure Horizon/blockchain/node_modules/ethers/lib.esm/index.js').href);
const HERE = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(HERE, 'cases.jsonl'), 'utf8');
const lines = raw.split('\n').filter(Boolean);
const errs = []; const err = (id, m) => errs.push(`${id}: ${m}`);
const REQ = ['id', 'synthetic', 'notice', 'family', 'subfamily', 'request', 'context', 'intent', 'label', 'reason', 'expected_severity', 'ideal_severity', 'required_signals', 'blind_to_v3_contract', 'catalog_category', 'source', 'hard', 'approximation', 'lang', 'split'];
const ids = new Set(), reqs = new Set(); let hard = 0, warn = 0; const chains = {}; const splits = { DEV: 0, TEST: 0 };
const isHex = (s) => typeof s === 'string' && /^0x([0-9a-fA-F]{2})*$/.test(s);
const isAddr = (s) => { try { return E.getAddress(s) === s; } catch { return false; } };
for (const [i, l] of lines.entries()) {
  let c; try { c = JSON.parse(l); } catch (e) { err('line ' + (i + 1), 'invalid JSON'); continue; }
  for (const k of REQ) if (!(k in c)) err(c.id, 'missing ' + k);
  if (!/^V2-BENIGN_DEFI-\d{5}$/.test(c.id)) err(c.id, 'bad id');
  if (ids.has(c.id)) err(c.id, 'duplicate id'); ids.add(c.id);
  if (c.synthetic !== true) err(c.id, 'synthetic != true');
  if (c.label !== 'benin') err(c.id, 'label != benin');
  if (!['ok', 'warn'].includes(c.expected_severity)) err(c.id, 'severity not ok/warn');
  if (c.expected_severity === 'warn' && !c.hard) err(c.id, 'warn on non-hard case');
  if (!c.reason || !c.source || !c.expected_severity_justification) err(c.id, 'empty reason/source/justification');
  const h = BigInt('0x' + createHash('sha256').update(c.id).digest('hex')) % 10n < 3n ? 'TEST' : 'DEV';
  if (c.split !== h) err(c.id, 'split mismatch');
  splits[c.split]++;
  const key = JSON.stringify(c.request); if (reqs.has(key)) err(c.id, 'duplicate request'); reqs.add(key);
  const ch = c.context?.chainId; chains[ch] = (chains[ch] || 0) + 1;
  if (![1, 43114, 43113].includes(ch)) err(c.id, 'bad chainId');
  if (c.intent !== null) { if (!c.intent.kind || typeof c.intent.declaredAt !== 'number') err(c.id, 'bad intent'); }
  const r = c.request;
  if (r.method === 'eth_sendTransaction') {
    const tx = r.params[0];
    if (!isAddr(tx.from) || !isAddr(tx.to)) err(c.id, 'bad address');
    if (!isHex(tx.data)) err(c.id, 'calldata not hex');
    if (tx.data !== '0x' && tx.data.length < 10) err(c.id, 'calldata shorter than selector');
    if (!/^0x[0-9a-f]+$/.test(tx.value)) err(c.id, 'bad value');
    if (Number(tx.chainId) !== ch) err(c.id, 'tx chainId != context');
    if (tx.from !== c.context.victim.address) err(c.id, 'from != victim');
  } else if (r.method === 'wallet_sendCalls') {
    for (const call of r.params[0].calls) { if (!isAddr(call.to) || !isHex(call.data) || call.data.length < 10) err(c.id, 'bad batched call'); }
    if (Number(r.params[0].chainId) !== ch) err(c.id, 'batch chainId != context');
  } else if (r.method === 'eth_signTypedData_v4') {
    if (r.params[0] !== c.context.victim.address) err(c.id, 'signer != victim');
    try { const td = JSON.parse(r.params[1]); const { EIP712Domain, ...types } = td.types; E.TypedDataEncoder.hash(td.domain, types, td.message); if (Number(td.domain.chainId) !== ch) err(c.id, 'typed chainId != context'); }
    catch (e) { err(c.id, 'typed data not hashable: ' + e.message); }
  } else err(c.id, 'unexpected method ' + r.method);
  if (c.hard) hard++; if (c.expected_severity === 'warn') warn++;
}
const n = lines.length;
if (n < 1000 || n > 1500) errs.push(`count ${n} outside 1000..1500`);
if (hard / n < 0.4) errs.push(`hard ratio ${(hard / n).toFixed(2)} < 0.40`);
// reproducibility
const tmp = join(mkdtempSync(join(tmpdir(), 'bdefi-')), 'cases.jsonl');
execFileSync(process.execPath, [join(HERE, 'gen.mjs')], { env: { ...process.env, OUT: tmp }, stdio: 'ignore' });
const same = readFileSync(tmp, 'utf8') === raw; if (!same) errs.push('regeneration differs from cases.jsonl');
console.log(JSON.stringify({ cases: n, hard, hardPct: Math.round(100 * hard / n), warn, splits, chains, reproducible: same, sha256: createHash('sha256').update(raw).digest('hex'), errors: errs.length }, null, 1));
if (errs.length) { console.log(errs.slice(0, 40).join('\n')); process.exit(1); }
console.log('VALIDATION OK');

// pipeline/parity.mjs - does evaluatePlus say what the bench says when it is given the same facts ?
// Usage : node pipeline/parity.mjs <cases.jsonl> [...] [--list] [--max=20]
//   reference : redteam/check_plus.mjs itself, run as a child process on the file (its per-case JSON lines are read ; nothing is copied).
//   candidate : evaluatePlus(body, local, { live: <everything the bench context holds>, intent: <the case's intent> })  (mode `full` of measure.mjs).
// A disagreement is a case whose final level differs (ok / warn / critical / unknown). Each one is classed by cause :
//   product_floor   : the product's own answer is stricter and nothing lowered it (product-only rule : Seaport near-zero price, pressure on the page)
//   canonical_known : the product always knows 5 public contracts (Permit2, Multicall3, CoW, Seaport 1.6, Safe MultiSend) ; the bench only knows the case list
//   public_list     : the request names a contract of pipeline/known_protocols.json (public list, known to evaluatePlus, not to the bench case)
//   decode_product  : the product decodes or refuses the request differently (eth_signTypedData_v3, swapped params, unsupported method, engine error)
//   other           : not explained by the above : to be read one by one
// Exit code 1 when a disagreement is classed `other`.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, readCases, runCase, familyKey, D } from './measure.mjs';
import { CANONICAL } from './evaluate_plus.mjs';

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
const LIST = args.includes('--list');
const MAX = Number((args.find((a) => a.startsWith('--max=')) || '').slice(6)) || 20;
if (!files.length) { console.error('Usage : node pipeline/parity.mjs <fichier.jsonl> [...] [--list] [--max=20]'); process.exit(2); }

function reference(file) {
  const r = spawnSync(process.execPath, [join(ROOT, 'redteam', 'check_plus.mjs'), file], { encoding: 'utf8', maxBuffer: 1 << 30 });
  if (r.status !== 0 && !r.stdout) { console.error('check_plus.mjs a échoué : ' + String(r.stderr).slice(0, 300)); process.exit(2); }
  const out = [];
  for (const line of r.stdout.split(/\r?\n/)) { if (!line.startsWith('{"id"')) continue; try { out.push(JSON.parse(line)); } catch { /* summary or noise */ } }
  return out;
}
function cause(c, ref, v) {
  const p = v.plus || {};
  if (p.path === 'product') return 'product_floor';
  const hay = JSON.stringify(c.request || {}).toLowerCase();
  if (ref.error || ref.unsupported || (p.errors || []).some((e) => /^moteur/.test(e)) || p.base === 'unknown' || ref.level_base === 'unknown') return 'decode_product';
  if (CANONICAL.some((a) => hay.includes(a.slice(2)))) return 'canonical_known';
  if (Object.values(D.knownProtocols || {}).flat().some((a) => hay.includes(a.slice(2)))) return 'public_list';
  return 'other';
}

const total = { n: 0, same: 0, diff: 0, byCause: {}, byFamily: {} };
const shown = [];
for (const file of files) {
  const cases = readCases(file).filter((x) => x.c);
  const refs = reference(file);
  if (refs.length !== cases.length) console.error(`${file} : ${refs.length} verdicts de référence pour ${cases.length} cas (alignement par rang)`);
  for (let i = 0; i < cases.length; i++) {
    const { c, id, src } = cases[i]; const ref = refs[i]; if (!ref) continue;
    total.n++;
    let r; try { r = await runCase(c, 'full'); } catch (e) { r = { level: 'unknown', v: { plus: { errors: ['moteur : ' + e.message] } } }; }
    if (r.level === ref.level_final) { total.same++; continue; }
    total.diff++;
    const k = cause(c, ref, r.v || {});
    total.byCause[k] = (total.byCause[k] || 0) + 1;
    const fam = familyKey(src, c);
    const F = (total.byFamily[fam] ??= { n: 0, causes: {}, stricter: 0, weaker: 0 });
    const rank = { ok: 0, unknown: 0.5, warn: 1, critical: 2 };
    F.n++; F.causes[k] = (F.causes[k] || 0) + 1; if (rank[r.level] > rank[ref.level_final]) F.stricter++; else F.weaker++;
    if (shown.length < MAX || k === 'other') shown.push({ id, family: fam, label: c.label, bench: ref.level_final, plus: r.level, cause: k, product: r.v && r.v.plus && r.v.plus.product, base: r.v && r.v.plus && r.v.plus.base, bench_base: ref.level_base, signals: r.v && r.v.plus && (r.v.plus.signals || []).map((s) => s.code), bench_reasons: (ref.reasons || []).filter((x) => /adem/.test(x)).map((x) => x.slice(0, 90)), errors: r.v && r.v.plus && r.v.plus.errors });
  }
}
console.log(JSON.stringify({ n: total.n, identiques: total.same, desaccords: total.diff, par_cause: total.byCause }));
console.log('désaccords | plus strict | moins strict | causes | famille');
for (const [f, F] of Object.entries(total.byFamily).sort((a, b) => b[1].n - a[1].n)) console.log(`${String(F.n).padEnd(10)} | ${String(F.stricter).padEnd(11)} | ${String(F.weaker).padEnd(12)} | ${JSON.stringify(F.causes)} | ${f}`);
if (LIST) for (const s of shown.slice(0, Math.max(MAX, 0))) console.log(JSON.stringify(s));
process.exit(total.byCause.other ? 1 : 0);

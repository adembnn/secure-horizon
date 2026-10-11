// Banc de mesure E2E (sans agents LLM). Node pur, zéro dépendance, aucun réseau, lecture seule sur les entrées.
// Usage : node run_loop.mjs [--loop N] [--open-test] [--allow-reopen]
//   défaut : un tour sur DEV. --loop N : N tours (un processus par tour => le code des règles est relu à chaque tour),
//   après chaque tour les 10 pires ratés / fausses alertes sont écrits dans out/TACHES.md (le banc ne modifie JAMAIS les règles).
//   --open-test : calcule aussi TEST (une seule fois par invocation ; en --loop seulement au dernier tour) ; chaque ouverture est
//   journalisée (out/TEST_OUVERTURES.json). Une 2e ouverture exige --allow-reopen.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const ATT = join(ROOT, 'attacks'), ENG = join(ROOT, 'engine'), OUT = join(HERE, 'out');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const optVal = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

// ---------------------------------------------------------------- (a) intégrité du jeu TEST
// --dry <fichier> : mode A/B de développement (politique) ; ne lit JAMAIS TEST.jsonl, n'écrit ni round, ni journal, ni COUVERTURE.
const DRY = optVal('--dry');
if (DRY && flag('--open-test')) { console.error('ARRET : --dry et --open-test sont incompatibles'); process.exit(2); }
let testBytes, expectedTestHash;
if (!DRY) {
testBytes = readFileSync(join(ATT, 'TEST.jsonl'));
const testHashFile = readFileSync(join(ATT, 'TEST_HASH.txt'), 'utf8');
expectedTestHash = (testHashFile.match(/\b[0-9a-f]{64}\b/) || [])[0];
if (!expectedTestHash || sha(testBytes) !== expectedTestHash) {
  console.error(`ARRET : TEST.jsonl (${sha(testBytes)}) ne correspond pas à TEST_HASH.txt (${expectedTestHash}).`);
  process.exit(2);
}
}

// ---------------------------------------------------------------- mode --loop : un processus par tour
const loopN = optVal('--loop') ? Math.max(1, parseInt(optVal('--loop'), 10)) : 0;
if (loopN && !flag('--once')) {
  for (let i = 1; i <= loopN; i++) {
    const a = [fileURLToPath(import.meta.url), '--once', '--tasks', `--loop-index=${i}/${loopN}`];
    if (flag('--open-test') && i === loopN) a.push('--open-test');
    if (flag('--allow-reopen')) a.push('--allow-reopen');
    const r = spawnSync(process.execPath, a, { stdio: 'inherit' });
    if (r.status !== 0) { console.error(`tour ${i} en échec (code ${r.status})`); process.exit(r.status || 1); }
  }
  process.exit(0);
}

// ---------------------------------------------------------------- chargement moteur + comparateur
const imp = (p) => import(pathToFileURL(p).href);
const E = await imp(join(ENG, 'src', 'engine.mjs'));
const { ADDR } = await imp(join(ENG, 'src', 'registry.mjs'));
const { compare } = await imp(join(ENG, 'vendor', 'compare.ts'));
const { applyExtraRules, analyzeChainRequest } = await imp(join(ENG, 'src', 'rules_extra.mjs'));
const { applyPolicy } = await imp(join(HERE, 'policy.mjs'));

const RANK = { ok: 0, warn: 1, critical: 2 };
const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const worst = (a, b) => (RANK[a] >= RANK[b] ? a : b);
const lvlOf = (flags) => (flags.some((f) => f.severity === 'critical') ? 'critical' : flags.some((f) => f.severity === 'warn') ? 'warn' : 'ok');

// ---------------------------------------------------------------- fournisseur de contexte HORS LIGNE
// Tout vient du champ `context` du cas (listes synthétiques du catalogue). Aucune lecture de label / expected_* / required_signals.
function buildCtx(c) {
  const k = c.context;
  const now = Math.floor((c.intent.declaredAt ?? 1760000000000) / 1000);
  const known = (k.known_protocols || []).map((p) => lc(p.address));
  const tokenMeta = {};
  const bySymbol = {};
  for (const t of k.token_registry || []) {
    tokenMeta[lc(t.address)] = { symbol: t.symbol, decimals: t.decimals, stable: ['USDC', 'USDT', 'DAI'].includes(t.symbol) };
    bySymbol[t.symbol] = t.decimals;
  }
  const facts = {};
  for (const [a, v] of Object.entries(k.counterparty_facts || {})) facts[lc(a)] = v;
  const ageBlocks = {};
  for (const [a, v] of Object.entries(facts)) if (v.ageBlocks !== undefined) ageBlocks[a] = v.ageBlocks;
  for (const [a, v] of Object.entries(k.token_info || {})) {
    if (!tokenMeta[lc(a)]) tokenMeta[lc(a)] = { symbol: v.symbol, decimals: bySymbol[v.symbol] ?? 18 }; // décimales : celles du symbole imité, sinon 18 (pas de RPC)
    if (v.ageBlocks !== undefined && ageBlocks[lc(a)] === undefined) ageBlocks[lc(a)] = v.ageBlocks;
  }
  const codeSet = new Set([...known, ...(k.token_registry || []).map((t) => lc(t.address)), ...Object.keys(k.token_info || {}).map(lc)]);
  const history = (k.history || []).map((h) => ({
    address: lc(h.address), ts: now - Math.round((h.minutes_ago || 0) * 60), direction: h.direction === 'sortie' ? 'out' : 'in',
    dust: h.direction !== 'sortie' && Number.parseFloat(h.amount) <= 0.01, // micro-montant entrant, déduit du montant et non de `kind`
  }));
  return {
    chainId: k.chainId, from: lc(k.victim), now, origin: k.origin,
    knownSpenders: known, knownVerifiers: new Set(known),
    history, contacts: (k.address_book || []).map((b) => ({ address: lc(b.address), label: b.label })),
    tokenMeta, ageBlocks,
    codeOf: (a) => { a = lc(a); if (facts[a] && facts[a].isContract !== undefined) return !!facts[a].isContract; if (codeSet.has(a)) return true; return undefined; },
    expectedOut: k.quote?.expected_out_units ? () => BigInt(k.quote.expected_out_units) : undefined,
    _sharePct: k.share_of_balance_pct, _k: k, _facts: facts, _tokenInfo: k.token_info || {}, _book: k.address_book || [],
  };
}

const big = (v) => (v === undefined || v === null || v === '' ? 0n : BigInt(v));
// analyse d'une tx avec injection du solde déduit de share_of_balance_pct (2 passes)
function analyzeTx(tx, ctx) {
  const opts = { ...ctx }; delete opts._sharePct;
  let eff = E.analyzeTransaction(tx, opts);
  if (ctx._sharePct && eff.outgoing.length) {
    const o = eff.outgoing.reduce((m, x) => (BigInt(x.amountRaw) > BigInt(m.amountRaw) ? x : m));
    const pct100 = BigInt(Math.round(ctx._sharePct * 100));
    if (pct100 > 0n) eff = E.analyzeTransaction(tx, { ...opts, balances: { [lc(o.token)]: ((BigInt(o.amountRaw) * 10000n) / pct100).toString() } });
  }
  return eff;
}
function mergeEffects(list) {
  if (list.length === 1) return list[0];
  const m = JSON.parse(JSON.stringify(list[0]));
  const cps = new Map(m.counterparties.map((c) => [c.address, c]));
  const seen = new Set(m.risk_flags.map((f) => f.code + '|' + f.detail));
  for (const e of list.slice(1)) {
    for (const f of ['outgoing', 'incoming', 'approvals', 'controlChange', 'nested']) m[f].push(...e[f]);
    for (const c of e.counterparties) { if (cps.has(c.address)) cps.get(c.address).roles = [...new Set([...cps.get(c.address).roles, ...c.roles])]; else { cps.set(c.address, c); m.counterparties.push(c); } }
    for (const f of e.risk_flags) { const k = f.code + '|' + f.detail; if (!seen.has(k)) { seen.add(k); m.risk_flags.push(f); } }
    m.opaque = m.opaque || e.opaque; m.opaqueReasons = [...new Set([...m.opaqueReasons, ...e.opaqueReasons])];
    if (!m.delegation && e.delegation) m.delegation = e.delegation;
    if (e.thirdParty) m.thirdParty = [...(m.thirdParty || []), ...e.thirdParty];
    if (e.shareOfBalancePct !== undefined) m.shareOfBalancePct = Math.max(m.shareOfBalancePct ?? 0, e.shareOfBalancePct);
  }
  m.risk_flags.sort((a, b) => ({ info: 0, warn: 1, critical: 2 }[b.severity] - { info: 0, warn: 1, critical: 2 }[a.severity]));
  m.level = lvlOf(m.risk_flags); m.levelEvidence = lvlOf(m.risk_flags.filter((f) => !E.OPACITY_CODES.has(f.code)));
  m.raw = { ...m.raw, batch: list.length };
  return m;
}
// Décode la requête brute. Retourne {eff} ou {unsupported:msg}.
function decodeRequest(c, ctx) {
  const { method, params } = c.request;
  switch (method) {
    case 'eth_sendTransaction': return { eff: analyzeTx(params[0], ctx) };
    case 'wallet_sendCalls': {
      const p = params[0];
      return { eff: mergeEffects(p.calls.map((call) => analyzeTx({ from: p.from, chainId: p.chainId, type: '0x2', ...call }, ctx))) };
    }
    case 'eth_signTypedData_v4': return { eff: E.analyzeTypedData(params[1], ctx) };
    case 'personal_sign': return { eff: E.analyzePersonalSign(params[0], ctx) };
    case 'eth_sign': return { eff: E.analyzeEthSign(params[1], ctx) };
    case 'wallet_switchEthereumChain':
    case 'wallet_addEthereumChain': { const e = analyzeChainRequest(c.request, ctx); return e ? { eff: e } : { unsupported: `méthode ${method} non gérée par le moteur d'effets` }; }
    default: return { unsupported: `méthode ${method} non gérée par le moteur d'effets` };
  }
}

// ---------------------------------------------------------------- intentions
// 'honnête' = ce que déclarerait un utilisateur qui a COMPRIS l'opération : dérivée des seuls effets décodés + carnet d'adresses.
function honestIntent(eff, ctx, declaredAt) {
  const base = { declaredAt };
  const book = (a) => ctx._book.find((b) => lc(b.address) === lc(a));
  if (eff.approvals.length || eff.incoming.length) return { ...base, kind: 'buy_or_swap', freeText: 'Je réalise un échange / j\'autorise une application (dérivé des effets)', ...(eff.outgoing[0] ? { token: eff.outgoing[0].symbol, amount: eff.outgoing[0].amount } : {}) };
  if (eff.outgoing.length) {
    const o = eff.outgoing[0], b = book(o.to);
    return { ...base, kind: 'pay_someone', freeText: 'Je paie ce destinataire (dérivé des effets)', token: o.symbol, amount: o.amount, counterpartyAddress: o.to, ...(b ? { counterpartyLabel: b.label } : {}) };
  }
  return { ...base, kind: 'connect_or_accept_offer', freeText: 'Je signe / me connecte (dérivé des effets)' };
}
// Référence « simulation seule » : n'affiche que le mouvement d'actifs immédiat décodé ; aucun droit, aucune signature, aucune délégation, aucune intention.
function simulationOnly(eff) {
  return eff.outgoing.length > 0 && eff.incoming.length === 0 ? 'warn' : 'ok';
}

// ---------------------------------------------------------------- (b) un cas -> verdicts de tous les bras
const ARMS = ['reference_simulation', 'sans_intention', 'intention_honnete', 'intention_mensongere'];
function evalCase(c) {
  const ctx = buildCtx(c);
  const out = { id: c.id, family: c.family, subfamily: c.subfamily, split: c.split, label: c.label, expected: c.expected_severity, ideal: c.ideal_severity, category: c.catalog_category, hard: !!c.hard, blind: !!c.blind_to_v3_contract, method: c.request.method, levels: {}, floorCodes: [], ademCodes: [], opacityOnly: false };
  let dec;
  try { dec = decodeRequest(c, ctx); } catch (e) { out.error = String(e.stack || e).split('\n').slice(0, 2).join(' | '); for (const a of ARMS) out.levels[a] = 'unknown'; return out; }
  if (dec.unsupported) { out.unsupported = dec.unsupported; for (const a of ARMS) out.levels[a] = 'unknown'; return out; }
  const eff = dec.eff;
  applyExtraRules(eff, c.request, ctx); // nouvelles règles du moteur (rules_extra.mjs) : ajoutent des drapeaux, recalculent level/levelEvidence
  // part du solde fournie sans sortie décodée (ex. signature) : transmise telle quelle au comparateur
  if (eff.shareOfBalancePct === undefined && ctx._sharePct !== undefined && !eff.outgoing.length) eff.shareOfBalancePct = ctx._sharePct;
  const pol = (intent) => applyPolicy({ eff, adem: compare(intent, eff), ctx, intent, request: c.request });
  const floor = applyPolicy({ eff, adem: null, ctx, intent: null, request: c.request }).level; // plancher après politique
  out.floorCodes = eff.risk_flags.filter((f) => f.severity !== 'info').map((f) => f.code);
  out.opaque = !!eff.opaque;
  const vM0 = compare(c.intent, eff);
  const vM = pol(c.intent);
  const hi = honestIntent(eff, ctx, c.intent.declaredAt);
  const vH = pol(hi);
  out.ademCodes = vM0.reasons.map((r) => r.code);
  out.polNotes = vM.notes;
  out.honestKind = hi.kind;
  out.levels.reference_simulation = simulationOnly(eff);
  out.levels.sans_intention = floor;
  out.levels.intention_honnete = vH.level;
  out.levels.intention_mensongere = vM.level;
  out.levels._adem_catalogue = vM0.level;
  out.opacityOnly = floor !== 'ok' && eff.levelEvidence === 'ok' && vM0.level === 'ok';
  return out;
}

// ---------------------------------------------------------------- (c) classification d'un verdict
function classify(r, lvl) {
  if (lvl === 'unknown') return 'inconnu';
  if (r.label === 'malveillant') return lvl === 'critical' ? 'attrape_critical' : lvl === 'warn' ? 'attrape_warn' : 'rate';
  if (r.label === 'benin') return lvl === 'critical' ? 'fa_critical' : lvl === 'warn' ? (RANK[lvl] > RANK[r.expected] ? 'fa_warn_exces' : 'fa_warn_toleree') : 'ok';
  if (r.label === 'ambigu') return 'ambigu_' + lvl;
  return lvl === 'ok' ? 'fraude_conforme_passe' : 'fraude_conforme_alerte'; // fraude_conforme
}
const CLASSES = ['attrape_critical', 'attrape_warn', 'rate', 'inconnu', 'fa_critical', 'fa_warn_exces', 'fa_warn_toleree', 'ok', 'ambigu_ok', 'ambigu_warn', 'ambigu_critical', 'fraude_conforme_passe', 'fraude_conforme_alerte'];
const emptyCounts = () => Object.fromEntries([...CLASSES, 'n_malveillant', 'n_benin', 'n_ambigu', 'n_fraude_conforme', 'n'].map((k) => [k, 0]));
function tally(rows, arm) {
  const t = emptyCounts();
  for (const r of rows) { t.n++; t['n_' + (r.label === 'malveillant' ? 'malveillant' : r.label === 'benin' ? 'benin' : r.label === 'ambigu' ? 'ambigu' : 'fraude_conforme')]++; t[classify(r, r.levels[arm])]++; }
  return t;
}
// ---------------------------------------------------------------- (d) Wilson
function wilson(k, n, z = 1.96) {
  if (!n) return { k, n, rate: null, lo: null, hi: null };
  const p = k / n, d = 1 + (z * z) / n, ctr = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  const r = (x) => Math.round(x * 10000) / 10000;
  return { k, n, rate: r(p), lo: r(Math.max(0, ctr - h)), hi: r(Math.min(1, ctr + h)) };
}
function metrics(t) {
  const caught = t.attrape_critical + t.attrape_warn;
  return {
    n: t.n, n_malveillant: t.n_malveillant, n_benin: t.n_benin, n_ambigu: t.n_ambigu, n_fraude_conforme: t.n_fraude_conforme,
    rappel_alerte: wilson(caught, t.n_malveillant),                 // critical OU warn ; inconnu compté comme non attrapé (conservateur)
    rappel_critical: wilson(t.attrape_critical, t.n_malveillant),
    rappel_hors_inconnu: wilson(caught, t.n_malveillant - t.inconnu),
    inconnu_malveillant: wilson(t.inconnu, t.n_malveillant),
    fausse_alerte_critical: wilson(t.fa_critical, t.n_benin),
    fausse_alerte_warn_ou_critical: wilson(t.fa_critical + t.fa_warn_exces + t.fa_warn_toleree, t.n_benin),
    fausse_alerte_warn_exces_ou_critical: wilson(t.fa_critical + t.fa_warn_exces, t.n_benin), // warn au-delà du toléré par le catalogue
    fraude_conforme_alerte: wilson(t.fraude_conforme_alerte, t.n_fraude_conforme),
    fraude_conforme_passe: wilson(t.fraude_conforme_passe, t.n_fraude_conforme),
    ambigu_distribution: { ok: t.ambigu_ok, warn: t.ambigu_warn, critical: t.ambigu_critical },
  };
}
const fmtP = (w) => (w.rate === null ? 'n/a' : `${(w.rate * 100).toFixed(1)}% [${(w.lo * 100).toFixed(1)}-${(w.hi * 100).toFixed(1)}] (${w.k}/${w.n})`);

// ---------------------------------------------------------------- exécution
mkdirSync(OUT, { recursive: true });
const readJsonl = (buf) => buf.toString('utf8').trim().split('\n').map((l) => JSON.parse(l));
const dev = readJsonl(readFileSync(join(ATT, 'DEV.jsonl')));
if (dev.some((c) => c.split !== 'DEV')) { console.error('ARRET : DEV.jsonl contient un cas non DEV'); process.exit(2); }

const rulesHash = sha(Buffer.concat([readFileSync(join(ENG, 'src', 'rules.mjs')), readFileSync(join(ENG, 'vendor', 'compare.ts'))]));
const codeHash = sha(Buffer.concat([...readdirSync(join(ENG, 'src')).filter((f) => f.endsWith('.mjs')).sort().map((f) => readFileSync(join(ENG, 'src', f))), readFileSync(join(ENG, 'vendor', 'compare.ts')), readFileSync(join(HERE, 'policy.mjs')), readFileSync(fileURLToPath(import.meta.url))]));

const openTest = flag('--open-test');
const openLogFile = join(OUT, 'TEST_OUVERTURES.json');
const openLog = existsSync(openLogFile) ? JSON.parse(readFileSync(openLogFile, 'utf8')) : { count: 0, openings: [] };
if (openTest && openLog.count >= 1 && !flag('--allow-reopen')) {
  console.error(`ARRET : TEST déjà ouvert ${openLog.count} fois (voir out/TEST_OUVERTURES.json). Utiliser --allow-reopen (sera journalisé comme ré-ouverture).`);
  process.exit(3);
}
const prior = readdirSync(OUT).filter((f) => /^round_\d{3}\.json$/.test(f)).sort();
const roundNo = prior.length + 1;
const rid = String(roundNo).padStart(3, '0');

const t0 = Date.now();
const devRows = dev.map(evalCase);
if (DRY) {
  const dg = {}; for (const arm of ARMS) dg[arm] = { counts: tally(devRows, arm), metrics: metrics(tally(devRows, arm)) };
  writeFileSync(DRY, JSON.stringify({ groups: dg, cases: devRows.map(({ id, family, subfamily, label, expected, category, levels, floorCodes, ademCodes, opaque, polNotes, unsupported, error }) => ({ id, family, subfamily, label, expected, category, levels, floorCodes, ademCodes, opaque, polNotes, unsupported, error })) }, null, 1));
  process.exit(0);
}
let testRows = [];
if (openTest) testRows = readJsonl(testBytes).map(evalCase);

const groupsDef = { DEV: devRows };
if (openTest) {
  groupsDef.TEST_total = testRows;
  groupsDef.TEST_hors_eip7702 = testRows.filter((r) => r.family !== 'eip7702');
  groupsDef.TEST_famille_eip7702 = testRows.filter((r) => r.family === 'eip7702');
}
const groups = {};
for (const [g, rows] of Object.entries(groupsDef)) {
  groups[g] = {};
  for (const arm of ARMS) groups[g][arm] = { counts: tally(rows, arm), metrics: metrics(tally(rows, arm)) };
}
const bySlice = (rows, keyFn) => {
  const o = {};
  for (const key of [...new Set(rows.map(keyFn))].sort()) {
    const sub = rows.filter((r) => keyFn(r) === key);
    o[key] = Object.fromEntries(ARMS.map((a) => [a, tally(sub, a)]));
  }
  return o;
};
const families = { DEV: bySlice(devRows, (r) => r.family) };
const categories = { DEV: bySlice(devRows, (r) => r.category) };
if (openTest) { families.TEST = bySlice(testRows, (r) => r.family); categories.TEST = bySlice(testRows, (r) => r.category); }
const anomalies = {
  non_decodables: [...devRows].filter((r) => r.unsupported || r.error).map((r) => ({ id: r.id, method: r.method, why: r.unsupported || r.error })),
  divergences_adem_vs_plancher: devRows.filter((r) => r.levels._adem_catalogue !== undefined && r.levels._adem_catalogue !== r.levels.sans_intention).length,
};
if (openTest) anomalies.TEST_non_decodables_n = testRows.filter((r) => r.unsupported || r.error).length;

// ouverture TEST journalisée
let testOpening = null;
if (openTest) {
  testOpening = { ts: new Date().toISOString(), round: roundNo, rules_hash: rulesHash, code_hash: codeHash, test_sha256: sha(testBytes), reopen: openLog.count >= 1 };
  openLog.count++; openLog.openings.push(testOpening);
  writeFileSync(openLogFile, JSON.stringify(openLog, null, 1));
}

// avant / après (DEV, bras intention_mensongere + plancher)
let before = null;
if (prior.length) { try { before = JSON.parse(readFileSync(join(OUT, prior[prior.length - 1]), 'utf8')).groups.DEV; } catch { /* ignoré */ } }
const pick = (g) => ({ rappel_alerte: g.intention_mensongere.metrics.rappel_alerte.rate, rappel_critical: g.intention_mensongere.metrics.rappel_critical.rate, fa_crit: g.intention_mensongere.metrics.fausse_alerte_critical.rate, plancher_rappel: g.sans_intention.metrics.rappel_alerte.rate, plancher_fa_crit: g.sans_intention.metrics.fausse_alerte_critical.rate });
const nowM = pick(groups.DEV), befM = before ? pick(before) : null;
const pc = (x) => (x === null || x === undefined ? 'n/a' : (x * 100).toFixed(1) + '%');
const ba = (k) => `${befM ? pc(befM[k]) : '-'}→${pc(nowM[k])}`;

const roundObj = {
  round: roundNo, ts: new Date().toISOString(), rules_hash: rulesHash, code_hash: codeHash, test_sha256_verified: expectedTestHash,
  test_opened_this_round: openTest, test_openings_total: openLog.count,
  arms: { reference_simulation: 'seul le mouvement immédiat décodé (sortie sans entrée => warn) ; ni droits, ni signatures, ni délégation, ni intention', sans_intention: 'plancher objectif du moteur (eff.level)', intention_honnete: 'max(plancher, Adem(intention dérivée des effets))', intention_mensongere: 'max(plancher, Adem(intention du catalogue : celle que la victime croit / qui lui est soufflée pour les malveillants, honnête pour les bénins))' },
  groups, families, categories, anomalies, duration_ms: Date.now() - t0,
  dev_cases: devRows.map(({ id, family, subfamily, label, expected, category, levels, floorCodes, ademCodes, opaque, unsupported, error }) => ({ id, family, subfamily, label, expected, category, levels, floorCodes, ademCodes, opaque, unsupported, error })),
};
writeFileSync(join(OUT, `round_${rid}.json`), JSON.stringify(roundObj, null, 1));
if (openTest) {
  // détail TEST scellé : ne sert qu'à l'analyse a posteriori ; jamais lu par TACHES.md
  writeFileSync(join(OUT, `TEST_ouvert_${rid}_detail.json`), JSON.stringify({ opening: testOpening, cases: testRows.map(({ id, family, subfamily, label, expected, levels, floorCodes, unsupported, error }) => ({ id, family, subfamily, label, expected, levels, floorCodes, unsupported, error })) }, null, 1));
  writeFileSync(join(OUT, 'TEST_RESULT_LATEST.json'), JSON.stringify({ round: roundNo, opening: testOpening, groups: Object.fromEntries(Object.entries(groups).filter(([g]) => g.startsWith('TEST'))), families: families.TEST, categories: categories.TEST }, null, 1));
}

// journal
const jl = `- R${rid} ${roundObj.ts} | règles ${rulesHash.slice(0, 12)} code ${codeHash.slice(0, 12)} | DEV(n=${devRows.length}) intention_mensongère rappel ${ba('rappel_alerte')} (critical ${ba('rappel_critical')}), fausse alerte critical ${ba('fa_crit')} ; plancher rappel ${ba('plancher_rappel')}, FA critical ${ba('plancher_fa_crit')}${openTest ? ` | TEST OUVERT (ouverture n°${openLog.count}${testOpening.reopen ? ', RE-OUVERTURE' : ''})` : ' | TEST fermé'}`;
const jf = join(OUT, 'JOURNAL.md');
if (!existsSync(jf)) writeFileSync(jf, '# Journal du banc (une ligne par tour ; avant→après = tour précédent → ce tour, sur DEV)\n\n');
writeFileSync(jf, readFileSync(jf, 'utf8') + jl + '\n');

// ---------------------------------------------------------------- (f) TACHES.md (DEV uniquement)
if (flag('--tasks')) {
  const MAIN = 'intention_mensongere';
  const bad = devRows.filter((r) => r.label === 'malveillant' && r.levels[MAIN] === 'rate' || (r.label === 'malveillant' && r.levels[MAIN] === 'ok'));
  const famMiss = {}; bad.forEach((r) => (famMiss[r.family] = (famMiss[r.family] || 0) + 1));
  const misses = bad.sort((a, b) => famMiss[b.family] - famMiss[a.family] || (a.blind - b.blind) || a.id.localeCompare(b.id)).slice(0, 10); // d'abord ce qui est corrigeable (non aveugle), dans les familles les plus touchées
  const fps = devRows.filter((r) => r.label === 'benin' && RANK[r.levels[MAIN]] > RANK[r.expected] && r.levels[MAIN] !== 'unknown');
  const famFp = {}; fps.forEach((r) => (famFp[r.family] = (famFp[r.family] || 0) + 1));
  const fpTop = fps.sort((a, b) => RANK[b.levels[MAIN]] - RANK[a.levels[MAIN]] || famFp[b.family] - famFp[a.family] || a.id.localeCompare(b.id)).slice(0, 10);
  const byId = new Map(dev.map((c) => [c.id, c]));
  const line = (r, kind) => {
    const c = byId.get(r.id);
    return `- [ ] **${r.id}** (${r.family}/${r.subfamily}, ${r.method}${r.hard ? ', cas dur' : ''}) : ${kind} ; verdict final ${r.levels[MAIN]} (attendu ${r.expected}) ; plancher=${r.levels.sans_intention} [${r.floorCodes.join(', ') || 'aucun drapeau'}] ; Adem=[${r.ademCodes.join(', ') || 'aucun'}] ; intention catalogue=${c.intent.kind}\n  - Pourquoi (catalogue) : ${c.reason}\n  - Signaux requis (catalogue) : ${(c.required_signals || []).join(', ') || '-'}${r.blind ? ' ; BLIND_TO_V3 : hors portée du comparateur seul' : ''}`;
  };
  writeFileSync(join(OUT, 'TACHES.md'), `# Tâches de correction (tour R${rid}, DEV uniquement ; règles code ${rulesHash.slice(0, 12)})\n\nGénéré automatiquement. Le banc ne modifie PAS les règles ni le jeu TEST ; ces tâches sont à traiter par un humain/agent hors banc, puis relancer un tour. Aucune tâche ne provient de TEST.\n\n## 10 pires ratés (malveillants sans alerte, bras ${MAIN}) — ${bad.length} ratés DEV au total\n\n${misses.map((r) => line(r, 'RATÉ')).join('\n') || '(aucun)'}\n\n## 10 pires fausses alertes (bénins au-delà du toléré) — ${fps.length} au total\n\n${fpTop.map((r) => line(r, 'FAUSSE ALERTE')).join('\n') || '(aucune)'}\n`);
}

// ---------------------------------------------------------------- (e) COUVERTURE.md
const MAIN = 'intention_mensongere';
const cell = (t) => t;
const catOrder = ['1_droits_depense_directs', '2_signatures_hors_chaine', '3_controle_et_roles', '4_execution_indirecte', '6_contrepartie', '7_tokens', '8_swaps_et_ponts', '9_faux_frontend_et_sites', '11_parcours_conformes', 'benin'];
const allCats = [...new Set([...catOrder, ...Object.keys(categories.DEV)])].filter((c) => categories.DEV[c]);
const matrix = (cats, arm, title) => {
  let s = `### ${title}\n\n| catégorie | n total | n malv. | attrapé critical | attrapé warn | raté | inconnu | n bénin | fausse alerte critical | fausse alerte warn (au-delà du toléré) | warn toléré | n ambigu (ok/warn/crit) | n fraude conforme (passée/alertée) |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
  for (const c of allCats) {
    const t = cats[c]?.[arm]; if (!t) continue;
    s += `| ${c} | ${t.n} | ${t.n_malveillant} | ${t.attrape_critical} | ${t.attrape_warn} | ${t.rate} | ${t.inconnu} | ${t.n_benin} | ${t.fa_critical} | ${t.fa_warn_exces} | ${t.fa_warn_toleree} | ${t.n_ambigu} (${t.ambigu_ok}/${t.ambigu_warn}/${t.ambigu_critical}) | ${t.n_fraude_conforme} (${t.fraude_conforme_passe}/${t.fraude_conforme_alerte}) |\n`;
  }
  return s + '\n';
};
const armTable = (g) => {
  let s = `| bras | rappel (critical ou warn) | rappel critical seul | rappel hors inconnu | fausse alerte critical | fausse alerte warn+critical (brut) | FA warn au-delà du toléré+critical | fraude conforme alertée |\n|---|---|---|---|---|---|---|---|\n`;
  for (const arm of ARMS) { const m = g[arm].metrics; s += `| ${arm} | ${fmtP(m.rappel_alerte)} | ${fmtP(m.rappel_critical)} | ${fmtP(m.rappel_hors_inconnu)} | ${fmtP(m.fausse_alerte_critical)} | ${fmtP(m.fausse_alerte_warn_ou_critical)} | ${fmtP(m.fausse_alerte_warn_exces_ou_critical)} | ${fmtP(m.fraude_conforme_alerte)} |\n`; }
  return s + '\n';
};
const famTable = (fams, label) => {
  let s = `| famille | n malv. | rappel simulation seule | rappel plancher | rappel honnête | rappel mensongère (critical+warn / critical) | n bénin | FA critical (mens.) | FA warn excès (mens.) |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const [f, v] of Object.entries(fams)) {
    const r = (a) => { const t = v[a]; return `${t.attrape_critical + t.attrape_warn}/${t.n_malveillant}`; };
    const m = v[MAIN];
    s += `| ${f} | ${m.n_malveillant} | ${r('reference_simulation')} | ${r('sans_intention')} | ${r('intention_honnete')} | ${r(MAIN)} / ${m.attrape_critical} | ${m.n_benin} | ${m.fa_critical} | ${m.fa_warn_exces} |\n`;
  }
  return s + '\n';
};
// exemples de ratés DEV (3 par catégorie)
const exByCat = {};
for (const r of devRows.filter((x) => x.label === 'malveillant' && x.levels[MAIN] === 'ok')) (exByCat[r.category] = exByCat[r.category] || []).push(r);
const byIdDev = new Map(dev.map((c) => [c.id, c]));
let ratesTxt = '';
for (const [cat, rows] of Object.entries(exByCat)) {
  ratesTxt += `- **${cat}** : ${rows.length} raté(s) DEV. Exemples :\n` + rows.slice(0, 3).map((r) => `  - \`${r.id}\` (${r.method}${r.blind ? ', aveugle au contrat v3' : ''}) : ${byIdDev.get(r.id).reason.slice(0, 200)}`).join('\n') + '\n';
}
const fpEx = devRows.filter((x) => x.label === 'benin' && RANK[x.levels[MAIN]] > RANK[x.expected]).slice(0, 8).map((r) => `  - \`${r.id}\` (${r.family}/${r.subfamily}) : verdict ${r.levels[MAIN]} pour attendu ${r.expected} ; drapeaux plancher [${r.floorCodes.join(', ')}] ; Adem [${r.ademCodes.join(', ')}]`).join('\n');
const blindMiss = devRows.filter((x) => x.label === 'malveillant' && x.levels[MAIN] === 'ok' && x.blind).length;
const nonBlindMiss = devRows.filter((x) => x.label === 'malveillant' && x.levels[MAIN] === 'ok' && !x.blind).length;
const unk = devRows.filter((x) => x.levels[MAIN] === 'unknown');
const unkFam = {}; unk.forEach((r) => (unkFam[r.method] = (unkFam[r.method] || 0) + 1));
const fcRows = devRows.filter((x) => x.label === 'fraude_conforme');
let testSection = '';
const tl = join(OUT, 'TEST_RESULT_LATEST.json');
if (existsSync(tl)) {
  const T = JSON.parse(readFileSync(tl, 'utf8'));
  testSection = `\n## TEST (ouvert au tour R${String(T.round).padStart(3, '0')}, ${T.opening.ts}, règles ${T.opening.rules_hash.slice(0, 12)})\n\nLes identifiants de cas TEST ne sont volontairement pas listés ici (détail scellé dans out/TEST_ouvert_*_detail.json). Chiffres agrégés seulement.\n\n` +
    Object.entries(T.groups).map(([g, v]) => `### ${g}\n\n` + armTable(v)).join('') + `### Par famille (TEST)\n\n` + famTable(T.families) + matrix(T.categories, MAIN, 'Matrice par catégorie (TEST, bras ' + MAIN + ')');
}
const cov = `# COUVERTURE du banc E2E

Généré par run/run_loop.mjs, tour R${rid}, ${roundObj.ts}. Hash règles ${rulesHash.slice(0, 12)} (rules.mjs + compare.ts), hash code ${codeHash.slice(0, 12)}. TEST ${openTest ? 'OUVERT à ce tour (ouverture n°' + openLog.count + ')' : 'fermé à ce tour'} ; ouvertures cumulées : ${openLog.count}.

**Lecture** : "attrapé" = malveillant avec verdict final critical ou warn ; "raté" = malveillant avec verdict ok ; "inconnu" = méthode non gérée ou erreur du moteur (compté à part, NON attrapé dans le rappel) ; "fraude conforme" = transfert légitime à l'intention honnête, hors portée par construction (rapportée à part). Les intervalles sont de Wilson 95 %, avec k/n. Le catalogue est synthétique, écrit par un auteur non aveugle : les chiffres mesurent la couverture et la non-régression, pas la robustesse face à un attaquant réel.

Bras : \`reference_simulation\` = seul le mouvement d'actifs immédiat décodé (sortie sans entrée => warn) ; \`sans_intention\` = plancher objectif du moteur ; \`intention_honnete\` = max(plancher, Adem avec une intention dérivée des effets) ; \`intention_mensongere\` = max(plancher, Adem avec l'intention du catalogue : celle qui a été soufflée à la victime pour les malveillants, honnête pour les bénins).

## DEV (n=${devRows.length}; la famille eip7702 est hors DEV)

${armTable(groups.DEV)}${matrix(categories.DEV, MAIN, 'Matrice catégorie × (attrapé / raté / fausse alerte), bras ' + MAIN)}${matrix(categories.DEV, 'sans_intention', 'Même matrice, plancher seul (sans intention)')}${matrix(categories.DEV, 'reference_simulation', 'Même matrice, référence simulation seule')}### Par famille (DEV)

${famTable(families.DEV)}### Exemples de ratés (DEV, bras ${MAIN})

${ratesTxt || '(aucun raté)'}
Ratés : ${nonBlindMiss} corrigeables a priori (non aveugles) et ${blindMiss} aveugles au contrat v3 (honeypot, taxe de vente, etc.).

### Exemples de fausses alertes (DEV, au-delà du toléré, bras ${MAIN})

${fpEx || '(aucune)'}

### Ce qu'on ne sait pas faire (constaté)

- Méthodes non gérées par le moteur (verdict inconnu) : ${unk.length ? Object.entries(unkFam).map(([m, n]) => `${m} x${n}`).join(', ') : 'aucune'} (changement/ajout de chaîne : aucun module de décodage ; à écrire).
- Fraude conforme (DEV n=${fcRows.length}) : ${fcRows.filter((r) => r.levels[MAIN] === 'ok').length} passent sans alerte ; par construction ni l'intention ni les effets ne les distinguent d'un transfert légitime.
- Cas où il faudrait une simulation de vente / taxe (honeypot) ou une vérification externe (réputation, site de la victime) : non fournies hors ligne ; le moteur ignore \`token_info.sell_simulation\`, \`claimed_site\`, \`ens\`.
- Sosie de domaine (claimed_site vs origin) et sosie ENS : aucune règle dans le moteur.
- Opacité : verdict warn "par opacité" (calldata/typed data non décodé) rattrape des cas sans preuve d'effet ; ils sont comptés comme attrapés (warn) et listés dans le JSON du tour (opaque=true).
- Faiblesses du catalogue : 235/589 cas à structures de mémoire ; auteur non aveugle ; sous-familles présentes des deux côtés DEV/TEST.
${testSection}`;
writeFileSync(join(ROOT, 'COUVERTURE.md'), cov);

// ---------------------------------------------------------------- sortie console
console.log(`Tour R${rid} (${Date.now() - t0} ms) règles ${rulesHash.slice(0, 12)} code ${codeHash.slice(0, 12)} ; TEST ${openTest ? 'OUVERT' : 'fermé'}`);
for (const [g, v] of Object.entries(groups)) {
  console.log(`\n== ${g} ==`);
  for (const arm of ARMS) { const m = v[arm].metrics; console.log(`${arm.padEnd(22)} rappel ${fmtP(m.rappel_alerte)} | critical ${fmtP(m.rappel_critical)} | FA crit ${fmtP(m.fausse_alerte_critical)} | FA warn+crit ${fmtP(m.fausse_alerte_warn_ou_critical)} | inconnu ${v[arm].counts.inconnu} | fraude conforme alertée ${v[arm].counts.fraude_conforme_alerte}/${m.n_fraude_conforme}`); }
}
console.log(`\nnon décodables DEV : ${anomalies.non_decodables.length}`, anomalies.non_decodables.slice(0, 5));

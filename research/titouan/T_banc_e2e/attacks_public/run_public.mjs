// run_public.mjs - passe le jeu REGRESSION_PUBLIQUE (PUBLIC.jsonl) dans le MEME pipeline que run/run_loop.mjs (logique COPIEE, original non modifie),
// bras : plancher (sans_intention) / intention honnete / intention du catalogue (intention_mensongere : celle soufflee a la victime pour les
// malveillants, honnete pour les benins). Affiche attrape / rate / fausse alerte par famille avec n et Wilson 95 %.
// Node pur, zero dependance, aucun reseau. N'ecrit QUE dans attacks_public/out/ (jamais dans run/out/, jamais TACHES.md, jamais COUVERTURE.md).
// Ne lit ni TEST.jsonl, ni DEV.jsonl, ni cases.jsonl.
// Usage : node run_public.mjs [--quiet]
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const ENG = join(ROOT, 'engine'), RUN = join(ROOT, 'run'), OUT = join(HERE, 'out');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const quiet = process.argv.includes('--quiet');
const DUMP = process.argv.includes('--dump') ? process.argv[process.argv.indexOf('--dump') + 1] : null; // --dump <id> : affiche drapeaux et raisons Adem d'un cas puis quitte (n'ecrit rien)

// ---------------------------------------------------------------- integrite du jeu
const bytes = readFileSync(join(HERE, 'PUBLIC.jsonl'));
const hashTxt = readFileSync(join(HERE, 'PUBLIC_HASH.txt'), 'utf8');
if (!hashTxt.includes(sha(bytes))) { console.error('ARRET : PUBLIC.jsonl ne correspond pas a PUBLIC_HASH.txt'); process.exit(2); }
const cases = bytes.toString('utf8').trim().split('\n').map((l) => JSON.parse(l));
if (cases.some((c) => c.split !== 'REGRESSION_PUBLIQUE')) { console.error('ARRET : cas hors REGRESSION_PUBLIQUE'); process.exit(2); }

// ---------------------------------------------------------------- moteur (identique a run_loop.mjs)
const imp = (p) => import(pathToFileURL(p).href);
const E = await imp(join(ENG, 'src', 'engine.mjs'));
const { compare } = await imp(join(ENG, 'vendor', 'compare.ts'));
const { applyExtraRules, analyzeChainRequest } = await imp(join(ENG, 'src', 'rules_extra.mjs'));
const { applyPolicy } = await imp(join(RUN, 'policy.mjs'));

const RANK = { ok: 0, warn: 1, critical: 2 };
const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const lvlOf = (flags) => (flags.some((f) => f.severity === 'critical') ? 'critical' : flags.some((f) => f.severity === 'warn') ? 'warn' : 'ok');

// ---- copie de run_loop.mjs : fournisseur de contexte hors ligne (tout vient du champ `context` ; aucune lecture de label / expected_*)
function buildCtx(c) {
  const k = c.context;
  const now = Math.floor((c.intent.declaredAt ?? 1760000000000) / 1000);
  const known = (k.known_protocols || []).map((p) => lc(p.address));
  const tokenMeta = {}; const bySymbol = {};
  for (const t of k.token_registry || []) { tokenMeta[lc(t.address)] = { symbol: t.symbol, decimals: t.decimals, stable: ['USDC', 'USDT', 'DAI'].includes(t.symbol) }; bySymbol[t.symbol] = t.decimals; }
  const facts = {}; for (const [a, v] of Object.entries(k.counterparty_facts || {})) facts[lc(a)] = v;
  const ageBlocks = {}; for (const [a, v] of Object.entries(facts)) if (v.ageBlocks !== undefined) ageBlocks[a] = v.ageBlocks;
  for (const [a, v] of Object.entries(k.token_info || {})) {
    if (!tokenMeta[lc(a)]) tokenMeta[lc(a)] = { symbol: v.symbol, decimals: bySymbol[v.symbol] ?? 18 };
    if (v.ageBlocks !== undefined && ageBlocks[lc(a)] === undefined) ageBlocks[lc(a)] = v.ageBlocks;
  }
  const codeSet = new Set([...known, ...(k.token_registry || []).map((t) => lc(t.address)), ...Object.keys(k.token_info || {}).map(lc)]);
  const history = (k.history || []).map((h) => ({ address: lc(h.address), ts: now - Math.round((h.minutes_ago || 0) * 60), direction: h.direction === 'sortie' ? 'out' : 'in', dust: h.direction !== 'sortie' && Number.parseFloat(h.amount) <= 0.01 }));
  return {
    chainId: k.chainId, from: lc(k.victim), now, origin: k.origin, knownSpenders: known, knownVerifiers: new Set(known),
    history, contacts: (k.address_book || []).map((b) => ({ address: lc(b.address), label: b.label })), tokenMeta, ageBlocks,
    codeOf: (a) => { a = lc(a); if (facts[a] && facts[a].isContract !== undefined) return !!facts[a].isContract; if (codeSet.has(a)) return true; return undefined; },
    expectedOut: k.quote?.expected_out_units ? () => BigInt(k.quote.expected_out_units) : undefined,
    _sharePct: k.share_of_balance_pct, _k: k, _facts: facts, _tokenInfo: k.token_info || {}, _book: k.address_book || [],
  };
}
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
function decodeRequest(c, ctx) {
  const { method, params } = c.request;
  switch (method) {
    case 'eth_sendTransaction': return { eff: analyzeTx(params[0], ctx) };
    case 'wallet_sendCalls': { const p = params[0]; return { eff: mergeEffects(p.calls.map((call) => analyzeTx({ from: p.from, chainId: p.chainId, type: '0x2', ...call }, ctx))) }; }
    case 'eth_signTypedData_v4': return { eff: E.analyzeTypedData(params[1], ctx) };
    case 'personal_sign': return { eff: E.analyzePersonalSign(params[0], ctx) };
    case 'eth_sign': return { eff: E.analyzeEthSign(params[1], ctx) };
    case 'wallet_switchEthereumChain':
    case 'wallet_addEthereumChain': { const e = analyzeChainRequest(c.request, ctx); return e ? { eff: e } : { unsupported: `methode ${method} non geree par le moteur d'effets` }; }
    default: return { unsupported: `methode ${method} non geree par le moteur d'effets` };
  }
}
function honestIntent(eff, ctx, declaredAt) {
  const base = { declaredAt };
  const book = (a) => ctx._book.find((b) => lc(b.address) === lc(a));
  if (eff.approvals.length || eff.incoming.length) return { ...base, kind: 'buy_or_swap', freeText: "Je realise un echange / j'autorise une application (derive des effets)", ...(eff.outgoing[0] ? { token: eff.outgoing[0].symbol, amount: eff.outgoing[0].amount } : {}) };
  if (eff.outgoing.length) { const o = eff.outgoing[0], b = book(o.to); return { ...base, kind: 'pay_someone', freeText: 'Je paie ce destinataire (derive des effets)', token: o.symbol, amount: o.amount, counterpartyAddress: o.to, ...(b ? { counterpartyLabel: b.label } : {}) }; }
  return { ...base, kind: 'connect_or_accept_offer', freeText: 'Je signe / me connecte (derive des effets)' };
}
const ARMS = ['sans_intention', 'intention_honnete', 'intention_mensongere'];
const ARM_LABEL = { sans_intention: 'plancher', intention_honnete: 'honnete', intention_mensongere: 'catalogue' };
function evalCase(c) {
  const ctx = buildCtx(c);
  const out = { id: c.id, fiche: c.fiche, family: c.family, subfamily: c.subfamily, label: c.label, expected: c.expected_severity, ideal: c.ideal_severity, plateforme: c.plateforme, blind: !!c.blind_to_v3_contract, hard: !!c.hard, method: c.request.method, twin_of: c.twin_of, levels: {}, floorCodes: [], ademCodes: [], polNotes: [] };
  let dec;
  try { dec = decodeRequest(c, ctx); } catch (e) { out.error = String(e.stack || e).split('\n').slice(0, 2).join(' | '); for (const a of ARMS) out.levels[a] = 'unknown'; return out; }
  if (dec.unsupported) { out.unsupported = dec.unsupported; for (const a of ARMS) out.levels[a] = 'unknown'; return out; }
  const eff = dec.eff;
  applyExtraRules(eff, c.request, ctx);
  if (eff.shareOfBalancePct === undefined && ctx._sharePct !== undefined && !eff.outgoing.length) eff.shareOfBalancePct = ctx._sharePct;
  const pol = (intent) => applyPolicy({ eff, adem: compare(intent, eff), ctx, intent, request: c.request });
  out.levels.sans_intention = applyPolicy({ eff, adem: null, ctx, intent: null, request: c.request }).level;
  out.floorCodes = eff.risk_flags.filter((f) => f.severity !== 'info').map((f) => f.code);
  out.opaque = !!eff.opaque;
  const vM0 = compare(c.intent, eff); const vM = pol(c.intent);
  const hi = honestIntent(eff, ctx, c.intent.declaredAt); const vH = pol(hi);
  out.ademCodes = vM0.reasons.map((r) => r.code); out.polNotes = vM.notes;
  if (DUMP) out.dbg = { flags: eff.risk_flags.map((f) => `${f.code}/${f.severity}: ${f.detail}`), adem: vM0.reasons, adem_honnete: compare(hi, eff).reasons, counterparties: eff.counterparties, approvals: eff.approvals, outgoing: eff.outgoing, incoming: eff.incoming, opaque: eff.opaque, opaqueReasons: eff.opaqueReasons, delegation: eff.delegation, controlChange: eff.controlChange, shareOfBalancePct: eff.shareOfBalancePct, nested: (eff.nested || []).length };
  out.levels.intention_honnete = vH.level; out.levels.intention_mensongere = vM.level;
  return out;
}

// ---------------------------------------------------------------- classification et statistiques
function classify(r, lvl) {
  if (lvl === 'unknown') return 'inconnu';
  if (r.label === 'malveillant') return lvl === 'critical' ? 'attrape_critical' : lvl === 'warn' ? 'attrape_warn' : 'rate';
  if (r.label === 'benin') return lvl === 'critical' ? 'fa_critical' : lvl === 'warn' ? (RANK[lvl] > RANK[r.expected] ? 'fa_warn_exces' : 'fa_warn_toleree') : 'ok';
  return lvl === 'ok' ? 'fraude_conforme_passe' : 'fraude_conforme_alerte';
}
const CLASSES = ['attrape_critical', 'attrape_warn', 'rate', 'inconnu', 'fa_critical', 'fa_warn_exces', 'fa_warn_toleree', 'ok', 'fraude_conforme_passe', 'fraude_conforme_alerte'];
function tally(rows, arm) {
  const t = Object.fromEntries([...CLASSES, 'n', 'n_mal', 'n_ben', 'n_fc', 'mal_au_niveau_attendu', 'inconnu_ben'].map((k) => [k, 0]));
  for (const r of rows) {
    t.n++; const lvl = r.levels[arm]; const cl = classify(r, lvl); t[cl]++;
    if (r.label === 'malveillant') { t.n_mal++; if (lvl !== 'unknown' && RANK[lvl] >= RANK[r.expected]) t.mal_au_niveau_attendu++; }
    else if (r.label === 'benin') { t.n_ben++; if (lvl === 'unknown') t.inconnu_ben++; } else t.n_fc++;
  }
  return t;
}
function wilson(k, n, z = 1.96) {
  if (!n) return { k, n, rate: null, lo: null, hi: null };
  const p = k / n, d = 1 + (z * z) / n, ctr = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  const r = (x) => Math.round(x * 10000) / 10000;
  return { k, n, rate: r(p), lo: r(Math.max(0, ctr - h)), hi: r(Math.min(1, ctr + h)) };
}
const fmt = (w) => (w.rate === null ? 'n/a' : `${(w.rate * 100).toFixed(1)}% [${(w.lo * 100).toFixed(1)}-${(w.hi * 100).toFixed(1)}] (${w.k}/${w.n})`);
function metrics(t) {
  const caught = t.attrape_critical + t.attrape_warn;
  return {
    n: t.n, n_mal: t.n_mal, n_ben: t.n_ben, n_fc: t.n_fc,
    rappel_alerte: wilson(caught, t.n_mal), rappel_critical: wilson(t.attrape_critical, t.n_mal), rappel_au_niveau_attendu: wilson(t.mal_au_niveau_attendu, t.n_mal),
    rappel_hors_inconnu: wilson(caught, t.n_mal - t.inconnu), inconnu_mal: wilson(t.inconnu, t.n_mal),
    fa_critical: wilson(t.fa_critical, t.n_ben), fa_warn_ou_critical: wilson(t.fa_critical + t.fa_warn_exces + t.fa_warn_toleree, t.n_ben), fa_warn_exces_ou_critical: wilson(t.fa_critical + t.fa_warn_exces, t.n_ben),
    fraude_conforme_alerte: wilson(t.fraude_conforme_alerte, t.n_fc),
  };
}

// ---------------------------------------------------------------- execution
const t0 = Date.now();
if (DUMP) { const c = cases.find((x) => x.id === DUMP); const r = evalCase(c); console.log(JSON.stringify({ id: c.id, intent: c.intent, expected: c.expected_severity, levels: r.levels, polNotes: r.polNotes, dbg: r.dbg, error: r.error, unsupported: r.unsupported }, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 1)); process.exit(0); }
const execCases = cases.filter((c) => c.executable);
const nonExec = cases.filter((c) => !c.executable);
const rows = execCases.map(evalCase);
const byId = new Map(cases.map((c) => [c.id, c]));

const subsets = {
  'TOUT executable': rows,
  'C-Chain applicable (hors ethereum_seulement)': rows.filter((r) => r.plateforme !== 'ethereum_seulement'),
  'ethereum seulement (7702)': rows.filter((r) => r.plateforme === 'ethereum_seulement'),
  'domaine A (TI_001)': rows.filter((r) => byId.get(r.id).domaine === 'A'),
  'domaine B (TI_002)': rows.filter((r) => byId.get(r.id).domaine === 'B'),
};
const groups = {};
for (const [g, rs] of Object.entries(subsets)) { groups[g] = {}; for (const arm of ARMS) { const t = tally(rs, arm); groups[g][arm] = { counts: t, metrics: metrics(t) }; } }
const famKeys = [...new Set(rows.map((r) => r.fiche + '|' + r.family))].sort();
const families = {};
for (const k of famKeys) { const [fiche, fam] = k.split('|'); const sub = rows.filter((r) => r.fiche === fiche && r.family === fam); families[k] = { plateforme: sub[0].plateforme, ...Object.fromEntries(ARMS.map((a) => [a, tally(sub, a)])) }; }
// la famille D-5 (benin dur) est rangee avec son parent D-1 dans les listes ; elle apparait ici comme sa propre ligne (n_mal=0)

// ---------------------------------------------------------------- ecriture (attacks_public/out uniquement)
mkdirSync(OUT, { recursive: true });
const prior = readdirSync(OUT).filter((f) => /^MESURE_\d{3}\.json$/.test(f)).sort();
const rid = String(prior.length + 1).padStart(3, '0');
const rulesHash = sha(Buffer.concat([readFileSync(join(ENG, 'src', 'rules.mjs')), readFileSync(join(ENG, 'vendor', 'compare.ts'))]));
const codeHash = sha(Buffer.concat([...readdirSync(join(ENG, 'src')).filter((f) => f.endsWith('.mjs')).sort().map((f) => readFileSync(join(ENG, 'src', f))), readFileSync(join(ENG, 'vendor', 'compare.ts')), readFileSync(join(RUN, 'policy.mjs'))]));
const MAIN = 'intention_mensongere';
const misses = rows.filter((r) => r.label === 'malveillant' && (r.levels[MAIN] === 'ok')).map((r) => ({ id: r.id, fiche: r.fiche, family: r.family, subfamily: r.subfamily, plateforme: r.plateforme, blind: r.blind, levels: r.levels, floorCodes: r.floorCodes, ademCodes: r.ademCodes }));
const sousNiveau = rows.filter((r) => r.label === 'malveillant' && r.levels[MAIN] !== 'unknown' && r.levels[MAIN] !== 'ok' && RANK[r.levels[MAIN]] < RANK[r.expected]).map((r) => ({ id: r.id, fiche: r.fiche, family: r.family, subfamily: r.subfamily, attendu: r.expected, plancher: r.levels.sans_intention, honnete: r.levels.intention_honnete, catalogue: r.levels[MAIN], floorCodes: r.floorCodes, ademCodes: r.ademCodes }));
const unknowns = rows.filter((r) => r.levels[MAIN] === 'unknown').map((r) => ({ id: r.id, fiche: r.fiche, label: r.label, method: r.method, why: r.unsupported || r.error }));
const fas = rows.filter((r) => r.label === 'benin' && r.levels[MAIN] !== 'unknown' && RANK[r.levels[MAIN]] > RANK[r.expected]).map((r) => ({ id: r.id, fiche: r.fiche, family: r.family, subfamily: r.subfamily, verdict: r.levels[MAIN], attendu: r.expected, plancher: r.levels.sans_intention, honnete: r.levels.intention_honnete, floorCodes: r.floorCodes, ademCodes: r.ademCodes }));
const faAll = rows.filter((r) => r.label === 'benin' && r.levels[MAIN] !== 'unknown' && r.levels[MAIN] !== 'ok').length;
const fcRows = rows.filter((r) => r.label === 'fraude_conforme').map((r) => ({ id: r.id, fiche: r.fiche, levels: r.levels }));
const obj = { mesure: rid, jeu: 'REGRESSION_PUBLIQUE', ts: new Date().toISOString(), public_sha256: sha(bytes), rules_hash: rulesHash, code_hash: codeHash, n_cas: cases.length, n_executables: execCases.length, n_non_executables: nonExec.length,
  non_executables: nonExec.map((c) => ({ id: c.id, fiche: c.fiche, label: c.label, plateforme: c.plateforme, raison: c.non_executable_reason })),
  arms: { sans_intention: 'plancher objectif du moteur (apres politique)', intention_honnete: 'max(plancher, Adem(intention derivee des effets))', intention_mensongere: 'max(plancher, Adem(intention du catalogue / soufflee a la victime))' },
  groups, families, rates: misses, attrapes_sous_le_niveau_attendu: sousNiveau, unknown: unknowns, fausses_alertes_au_dela_du_tolere: fas, fraude_conforme: fcRows, benins_non_ok_total: faAll,
  cases: rows.map(({ id, fiche, family, subfamily, label, expected, plateforme, levels, floorCodes, ademCodes, opaque, polNotes, unsupported, error }) => ({ id, fiche, family, subfamily, label, expected, plateforme, levels, floorCodes, ademCodes, opaque, polNotes, unsupported, error })),
  duration_ms: Date.now() - t0 };
writeFileSync(join(OUT, `MESURE_${rid}.json`), JSON.stringify(obj, null, 1));

// ---------------------------------------------------------------- sortie console + markdown
const L = [];
const P = (s = '') => { L.push(s); if (!quiet) console.log(s); };
P(`MESURE ${rid} du jeu REGRESSION_PUBLIQUE (${cases.length} fixtures : ${execCases.length} executables, ${nonExec.length} non executables) ; regles ${rulesHash.slice(0, 12)} code ${codeHash.slice(0, 12)} ; ${Date.now() - t0} ms`);
P('Jeu distinct de DEV et de TEST ; non ecrit dans run/out/TACHES.md. Lecture : attrape = malveillant en warn ou critical ; rate = ok ; inconnu = methode non geree (compte NON attrape) ; FA = benin au-dela du toleré.');
P('');
P('## Totaux par sous-ensemble et par bras (Wilson 95 %)');
for (const [g, v] of Object.entries(groups)) {
  P(`\n### ${g}  (malveillants ${v.sans_intention.counts.n_mal}, benins ${v.sans_intention.counts.n_ben}, fraude conforme ${v.sans_intention.counts.n_fc})`);
  for (const arm of ARMS) { const m = v[arm].metrics, t = v[arm].counts; P(`- ${ARM_LABEL[arm].padEnd(9)} attrape(crit+warn) ${fmt(m.rappel_alerte)} | critical ${fmt(m.rappel_critical)} | au niveau attendu ${fmt(m.rappel_au_niveau_attendu)} | rate ${t.rate} | inconnu ${t.inconnu} | FA critical ${fmt(m.fa_critical)} | FA warn+crit ${fmt(m.fa_warn_ou_critical)} | FA au-dela du tolere ${fmt(m.fa_warn_exces_ou_critical)} | fraude conforme alertee ${fmt(m.fraude_conforme_alerte)}`); }
}
P('\n## Par famille (att = attrape crit+warn, c = dont critical, r = rate, i = inconnu ; FA c/w = fausse alerte critical / warn au-dela du tolere ; Wilson 95 % sur le bras catalogue)');
P('fiche  famille'.padEnd(54) + 'plat  | n_mal | plancher att/n | honnete att/n | catalogue att(c)/n r i  Wilson          | n_ben FA c/w (plancher|honnete|catalogue) | n_fc');
for (const [k, f] of Object.entries(families)) {
  const [fiche, fam] = k.split('|'); const a = (arm) => { const t = f[arm]; return `${t.attrape_critical + t.attrape_warn}/${t.n_mal}`; };
  const c = f[MAIN]; const w = wilson(c.attrape_critical + c.attrape_warn, c.n_mal);
  const fa = (arm) => `${f[arm].fa_critical}/${f[arm].fa_warn_exces}`;
  P(`${fiche.padEnd(5)} ${fam.padEnd(46).slice(0, 46)} ${f.plateforme === 'ethereum_seulement' ? 'ETH ' : f.plateforme === 'evm_toutes_chaines' ? 'EVM ' : '??? '} | ${String(c.n_mal).padStart(2)}    | ${a('sans_intention').padStart(5)}          | ${a('intention_honnete').padStart(5)}         | ${a(MAIN).padStart(4)}(${c.attrape_critical}) ${String(c.n_mal).padStart(0)} r${c.rate} i${c.inconnu}  ${w.rate === null ? 'n/a' : (w.rate * 100).toFixed(0) + '% [' + (w.lo * 100).toFixed(0) + '-' + (w.hi * 100).toFixed(0) + ']'} | ${c.n_ben}  ${fa('sans_intention')} | ${fa('intention_honnete')} | ${fa(MAIN)} | ${c.n_fc}`);
}
P(`\n## Ratés (malveillants en 'ok', bras catalogue) : ${misses.length}`);
for (const m of misses) P(`- ${m.id} (${m.family}/${m.subfamily})${m.plateforme === 'ethereum_seulement' ? ' [ETH seulement]' : ''}${m.blind ? ' [aveugle par construction]' : ''} : plancher=${m.levels.sans_intention} honnete=${m.levels.intention_honnete} ; drapeaux plancher [${m.floorCodes.join(', ') || 'aucun'}] ; Adem [${m.ademCodes.join(', ') || 'aucun'}]`);
P(`\n## Attrapes mais SOUS le niveau attendu (malveillant en warn alors que critical attendu, bras catalogue) : ${sousNiveau.length}`);
for (const m of sousNiveau) P(`- ${m.id} (${m.family}/${m.subfamily}) : plancher=${m.plancher} honnete=${m.honnete} catalogue=${m.catalogue} (attendu ${m.attendu}) ; drapeaux [${m.floorCodes.join(', ') || 'aucun'}] ; Adem [${m.ademCodes.join(', ') || 'aucun'}]`);
P(`\n## Inconnus (methode non geree ou erreur du moteur) : ${unknowns.length}`);
for (const u of unknowns) P(`- ${u.id} (${u.label}, ${u.method}) : ${u.why}`);
P(`\n## Fausses alertes au-dela du tolere (benins, bras catalogue) : ${fas.length} ; benins non-ok au total : ${faAll}`);
for (const f of fas) P(`- ${f.id} (${f.family}/${f.subfamily}) : ${f.verdict} pour attendu ${f.attendu} ; plancher=${f.plancher} honnete=${f.honnete} ; drapeaux [${f.floorCodes.join(', ') || 'aucun'}] ; Adem [${f.ademCodes.join(', ') || 'aucun'}]`);
P(`\n## Fraude conforme (rapportee a part) : ${fcRows.map((f) => `${f.id} -> catalogue=${f.levels[MAIN]} plancher=${f.levels.sans_intention}`).join(' ; ') || 'aucune'}`);
P(`\n## Non executables (${nonExec.length}, hors mesure)`);
for (const c of nonExec) P(`- ${c.id} [${c.plateforme}] ${c.family}/${c.subfamily} : ${c.non_executable_reason}`);
writeFileSync(join(OUT, `MESURE_${rid}.md`), `# MESURE ${rid} - jeu REGRESSION_PUBLIQUE\n\n\`\`\`\n${L.join('\n')}\n\`\`\`\n`);
if (quiet) console.log(`MESURE ${rid} ecrite dans ${OUT}`);

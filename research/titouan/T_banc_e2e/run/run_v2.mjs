// Banc V2 : passe V2_DEV.jsonl (jeu écrit à l'aveugle par d'autres agents) dans le MÊME pipeline que run/run_loop.mjs
// (logique copiée de run_loop / run_public ; bras plancher / intention honnête / intention du catalogue).
// Normalisation du format V2 : redteam/normalize_v2.mjs (d'Adem, importé SANS modification).
// Node pur, aucun réseau. Ne lit JAMAIS V2_TEST.jsonl (refus explicite). Écrit dans run/out/v2/ uniquement.
// Usage : node run/run_v2.mjs <label> [--ref <label>] [--dump <id>] [--quiet]
//   POLICY_FIXES=none|all|F1,F2.. choisit les correctifs actifs (voir engine/src/fixes.mjs).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const ENG = join(ROOT, 'engine'), OUT = join(HERE, 'out', 'v2');
const args = process.argv.slice(2);
const optVal = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const label = args.find((a, i) => !a.startsWith('--') && (i === 0 || !['--ref', '--dump'].includes(args[i - 1]))) || 'adhoc';
const REF = optVal('--ref'), DUMP = optVal('--dump'), QUIET = args.includes('--quiet');
const SRC = join(ROOT, 'blind_adem', 'v2', 'V2_DEV.jsonl');
if (/V2_TEST/i.test(SRC)) { console.error('Refus : V2_TEST est gelé'); process.exit(2); }

const imp = (p) => import(pathToFileURL(p).href);
const E = await imp(join(ENG, 'src', 'engine.mjs'));
const { compare } = await imp(join(ENG, 'vendor', 'compare.ts'));
const { applyExtraRules, analyzeChainRequest } = await imp(join(ENG, 'src', 'rules_extra.mjs'));
const { applyPolicy } = await imp(join(HERE, 'policy.mjs'));
const { normalizeCase } = await imp(join(ROOT, 'redteam', 'normalize_v2.mjs'));

const RANK = { ok: 0, warn: 1, critical: 2 };
const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const lvlOf = (flags) => (flags.some((f) => f.severity === 'critical') ? 'critical' : flags.some((f) => f.severity === 'warn') ? 'warn' : 'ok');

// ---- copie de run_loop.mjs : fournisseur de contexte hors ligne
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
    case 'wallet_addEthereumChain': { const e = analyzeChainRequest(c.request, ctx); return e ? { eff: e } : { unsupported: `méthode ${method} non gérée par le moteur d'effets` }; }
    default: return { unsupported: `méthode ${method} non gérée par le moteur d'effets` };
  }
}
function honestIntent(eff, ctx, declaredAt) {
  const base = { declaredAt };
  const book = (a) => ctx._book.find((b) => lc(b.address) === lc(a));
  if (eff.approvals.length || eff.incoming.length) return { ...base, kind: 'buy_or_swap', freeText: "Je réalise un échange / j'autorise une application (dérivé des effets)", ...(eff.outgoing[0] ? { token: eff.outgoing[0].symbol, amount: eff.outgoing[0].amount } : {}) };
  if (eff.outgoing.length) { const o = eff.outgoing[0], b = book(o.to); return { ...base, kind: 'pay_someone', freeText: 'Je paie ce destinataire (dérivé des effets)', token: o.symbol, amount: o.amount, counterpartyAddress: o.to, ...(b ? { counterpartyLabel: b.label } : {}) }; }
  return { ...base, kind: 'connect_or_accept_offer', freeText: 'Je signe / me connecte (dérivé des effets)' };
}
const ARMS = ['sans_intention', 'intention_honnete', 'intention_mensongere'];
const ARM_LABEL = { sans_intention: 'plancher', intention_honnete: 'honnête', intention_mensongere: 'catalogue' };
const AVAX = new Set([43114, 43113]);
function chainOf(c) {
  let id = c.context && c.context.chainId;
  if (id === undefined) { const p = c.request && c.request.params && c.request.params[0]; const x = p && (p.chainId ?? (p.calls && p.calls[0] && p.calls[0].chainId)); try { id = x !== undefined ? Number(BigInt(x)) : undefined; } catch { /* ignoré */ } }
  return id;
}
function evalCase(c) {
  const ctx = buildCtx(c);
  const ch = chainOf(c);
  const out = { id: c.id, family: c.family, subfamily: c.subfamily, label: c.label, expected: c.expected_severity, ideal: c.ideal_severity, avax: AVAX.has(ch), chain: ch ?? null, method: c.request.method, levels: {}, floorCodes: [], ademCodes: [], polNotes: [] };
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
  out.levels.intention_honnete = vH.level; out.levels.intention_mensongere = vM.level; out.opacityOnly = !!vM.opacity_only;
  if (DUMP) out.dbg = { flags: eff.risk_flags.map((f) => `${f.code}/${f.severity}: ${f.detail}`), adem: vM0.reasons, adem_honnete: compare(hi, eff).reasons, counterparties: eff.counterparties, approvals: eff.approvals, outgoing: eff.outgoing, incoming: eff.incoming, opaque: eff.opaque, opaqueReasons: eff.opaqueReasons, controlChange: eff.controlChange, service: eff.service };
  return out;
}

// ---- classification et statistiques
function classify(r, lvl) {
  if (lvl === 'unknown') return 'inconnu';
  if (r.label === 'malveillant') return lvl === 'critical' ? 'att_c' : lvl === 'warn' ? 'att_w' : 'rate';
  if (r.label === 'benin') return lvl === 'critical' ? 'fa_c' : lvl === 'warn' ? (RANK[lvl] > RANK[r.expected] ? 'fa_w_exces' : 'fa_w_toleree') : 'ben_ok';
  if (r.label === 'ambigu') return 'amb_' + lvl;
  return lvl === 'ok' ? 'fc_passe' : 'fc_alerte';
}
const KEYS = ['att_c', 'att_w', 'rate', 'inconnu', 'fa_c', 'fa_w_exces', 'fa_w_toleree', 'ben_ok', 'amb_ok', 'amb_warn', 'amb_critical', 'fc_passe', 'fc_alerte', 'n', 'n_mal', 'n_ben', 'n_amb', 'n_fc', 'inconnu_ben'];
function tally(rows, arm) {
  const t = Object.fromEntries(KEYS.map((k) => [k, 0]));
  for (const r of rows) {
    const lvl = r.levels[arm]; t.n++; t[classify(r, lvl)]++;
    if (r.label === 'malveillant') t.n_mal++; else if (r.label === 'benin') { t.n_ben++; if (lvl === 'unknown') t.inconnu_ben++; } else if (r.label === 'ambigu') t.n_amb++; else t.n_fc++;
  }
  return t;
}
function wilson(k, n, z = 1.96) {
  if (!n) return null;
  const p = k / n, d = 1 + (z * z) / n, ctr = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return { k, n, rate: p, lo: Math.max(0, ctr - h), hi: Math.min(1, ctr + h) };
}
const f1 = (x) => (x * 100).toFixed(1);
const fmt = (w) => (w ? `${f1(w.rate)}% [${f1(w.lo)}-${f1(w.hi)}] (${w.k}/${w.n})` : 'n/a');
const short = (w) => (w ? `${w.k}/${w.n}` : '-');
const M = (t) => ({
  rappel: wilson(t.att_c + t.att_w, t.n_mal), rappel_c: wilson(t.att_c, t.n_mal), rate: wilson(t.rate, t.n_mal), inconnu: wilson(t.inconnu, t.n_mal),
  fa_c: wilson(t.fa_c, t.n_ben), fa_wc: wilson(t.fa_c + t.fa_w_exces + t.fa_w_toleree, t.n_ben), fa_wc_exces: wilson(t.fa_c + t.fa_w_exces, t.n_ben),
  fc_alerte: wilson(t.fc_alerte, t.n_fc),
});

// ---- exécution
const t0 = Date.now();
const raw = readFileSync(SRC, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => normalizeCase(JSON.parse(l)));
if (raw.some((c) => c.split !== 'DEV')) { console.error('ARRET : cas non DEV'); process.exit(2); }
if (DUMP) { const c = raw.find((x) => x.id === DUMP); const r = evalCase(c); console.log(JSON.stringify({ id: c.id, request: c.request, intent: c.intent, label: c.label, expected: c.expected_severity, levels: r.levels, floorCodes: r.floorCodes, polNotes: r.polNotes, dbg: r.dbg, error: r.error, unsupported: r.unsupported, history: c.context.history, book: c.context.address_book }, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 1)); process.exit(0); }
const rows = raw.map(evalCase);
mkdirSync(OUT, { recursive: true });

const slices = { 'TOUT': rows, 'Avalanche (43114/43113)': rows.filter((r) => r.avax), 'autres chaînes': rows.filter((r) => !r.avax) };
const groups = {};
for (const [g, rs] of Object.entries(slices)) { groups[g] = {}; for (const a of ARMS) { const t = tally(rs, a); groups[g][a] = { t, m: M(t) }; } }

let md = `# MESURE V2_DEV — ${label}\n\nGénéré par run/run_v2.mjs (${new Date().toISOString()}), POLICY_FIXES=${process.env.POLICY_FIXES || '(défaut KEPT)'}, V2_DEV n=${rows.length} (${rows.filter((r) => r.avax).length} Avalanche, ${rows.filter((r) => !r.avax).length} autres ; chaîne lue dans context.chainId, sinon dans le chainId de la requête ; inconnue = « autres »). V2_TEST jamais lu.\n\nLecture : rappel = malveillant en warn ou critical ; inconnu = non décodable, compté NON attrapé ; FA c = bénin en critical ; FA w+c brut = bénin en warn ou critical ; FA w+c excès = au-delà de la sévérité tolérée (expected). Wilson 95 %. Les « bénins » = label benin (benign_defi + benign_everyday) ; fraude conforme et ambigus à part.\n\n`;
for (const [g, v] of Object.entries(groups)) {
  md += `## ${g}\n\n| bras | rappel | rappel critical | raté | inconnu | FA critical | FA warn+critical brut | FA warn+critical excès | fraude conforme alertée | ambigus ok/warn/crit |\n|---|---|---|---|---|---|---|---|---|---|\n`;
  for (const a of ARMS) { const { t, m } = v[a]; md += `| ${ARM_LABEL[a]} | ${fmt(m.rappel)} | ${fmt(m.rappel_c)} | ${t.rate} | ${t.inconnu} | ${fmt(m.fa_c)} | ${fmt(m.fa_wc)} | ${fmt(m.fa_wc_exces)} | ${fmt(m.fc_alerte)} | ${t.amb_ok}/${t.amb_warn}/${t.amb_critical} |\n`; }
  md += '\n';
}
const famTable = (keyFn, title) => {
  let s = `## ${title}\n\natt(crit) = attrapés critical+warn / n malveillants (dont critical). Portée : tout / Av = Avalanche / Au = autres.\n\n| clé | portée | n malv. | plancher | honnête | catalogue | raté cat. | inconnu | n bénin | FA critical plancher/hon/cat | FA w+c brut cat. | n fc (alertée cat.) |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
  const keys = [...new Set(rows.map(keyFn))].sort();
  for (const k of keys) {
    for (const [sc, rs] of [['tout', rows], ['Av', rows.filter((r) => r.avax)], ['Au', rows.filter((r) => !r.avax)]]) {
      const sub = rs.filter((r) => keyFn(r) === k); if (!sub.length) continue;
      const T = Object.fromEntries(ARMS.map((a) => [a, tally(sub, a)]));
      const att = (a) => `${T[a].att_c + T[a].att_w}/${T[a].n_mal}(${T[a].att_c})`;
      s += `| ${k} | ${sc} | ${T.intention_mensongere.n_mal} | ${att('sans_intention')} | ${att('intention_honnete')} | ${att('intention_mensongere')} | ${T.intention_mensongere.rate} | ${T.intention_mensongere.inconnu} | ${T.intention_mensongere.n_ben} | ${T.sans_intention.fa_c}/${T.intention_honnete.fa_c}/${T.intention_mensongere.fa_c} | ${T.intention_mensongere.fa_c + T.intention_mensongere.fa_w_exces + T.intention_mensongere.fa_w_toleree} | ${T.intention_mensongere.n_fc} (${T.intention_mensongere.fc_alerte}) |\n`;
    }
  }
  return s + '\n';
};
md += famTable((r) => r.family, 'Par famille') + famTable((r) => r.family + '/' + r.subfamily, 'Par sous-famille');
const MAIN = 'intention_mensongere';
const miss = rows.filter((r) => r.label === 'malveillant' && r.levels[MAIN] === 'ok');
const faC = rows.filter((r) => r.label === 'benin' && r.levels[MAIN] === 'critical');
const cnt = (arr, kf) => { const o = {}; arr.forEach((r) => { const k = kf(r); o[k] = (o[k] || 0) + 1; }); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
md += `## Ratés (malveillants en ok, catalogue) : ${miss.length}\n\n` + cnt(miss, (r) => r.family + '/' + r.subfamily).map(([k, n]) => `- ${k} : ${n}`).join('\n') + `\n\n## Fausses alertes critical (bénins, catalogue) : ${faC.length}\n\n` + cnt(faC, (r) => r.family + '/' + r.subfamily + ' [' + r.floorCodes.concat(r.ademCodes).join(',') + ']').map(([k, n]) => `- ${k} : ${n}`).join('\n') + '\n';
const unk = rows.filter((r) => r.levels[MAIN] === 'unknown');
md += `\n## Inconnus : ${unk.length}\n\n` + cnt(unk, (r) => r.method + ' ' + (r.unsupported || r.error || '')).map(([k, n]) => `- ${k} : ${n}`).join('\n') + '\n';
writeFileSync(join(OUT, `MESURE_${label}.md`), md);
writeFileSync(join(OUT, `${label}.json`), JSON.stringify({ label, fixes: process.env.POLICY_FIXES || 'KEPT', groups, cases: rows.map(({ id, family, subfamily, label: lb, expected, avax, method, levels, floorCodes, ademCodes, polNotes, unsupported, error, opacityOnly }) => ({ id, family, subfamily, label: lb, expected, avax, method, levels, floorCodes, ademCodes, polNotes, unsupported, error, opacityOnly })) }));

console.log(`[${label}] ${rows.length} cas, ${Date.now() - t0} ms`);
for (const [g, v] of Object.entries(groups)) {
  console.log(`== ${g}`);
  for (const a of ARMS) { const { t, m } = v[a]; console.log(`  ${ARM_LABEL[a].padEnd(9)} rappel ${fmt(m.rappel)} | crit ${f1(m.rappel_c.rate)}% | inconnu ${t.inconnu} | FA crit ${fmt(m.fa_c)} | FA w+c ${fmt(m.fa_wc)} | fc alertée ${short(m.fc_alerte)}`); }
}
if (REF) {
  const ref = JSON.parse(readFileSync(join(OUT, REF + '.json'), 'utf8')); const mp = new Map(ref.cases.map((c) => [c.id, c]));
  const diffs = []; for (const c of rows) for (const a of ARMS) { const o = mp.get(c.id).levels[a]; if (o !== c.levels[a]) diffs.push({ id: c.id, label: c.label, exp: c.expected, fam: c.family + '/' + c.subfamily, arm: ARM_LABEL[a], from: o, to: c.levels[a] }); }
  writeFileSync(join(OUT, `DIFF_${REF}_vers_${label}.json`), JSON.stringify(diffs, null, 1));
  console.log(`diff vs ${REF} : ${diffs.length} changements (n × label famille/sous-famille bras de->à) :`);
  for (const [k, n] of cnt(diffs, (d) => `${d.label} ${d.fam} ${d.arm} ${d.from}->${d.to}`).slice(0, QUIET ? 15 : 60)) console.log(`   ${n} × ${k}`);
}

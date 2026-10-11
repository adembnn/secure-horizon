// BANC « EN CONDITIONS RÉELLES » (MSG-056). Node pur, zéro dépendance, aucun réseau, aucune écriture hors banc_realiste/out/.
// Passe DEV, REGRESSION_PUBLIQUE et V2_DEV dans le MÊME pipeline moteur + comparateur + politique que run/run_loop.mjs,
// mais en retirant du contexte ce que le PRODUIT (server/server.mjs, extension_standalone) ne peut pas fournir.
// Lecture seule sur engine/, run/policy.mjs, server/, redteam/normalize_v2.mjs. Ne lit JAMAIS TEST.jsonl ni V2_TEST.jsonl.
// Usage : node run_realiste.mjs        (POLICY_FIXES hérité de l'environnement, défaut = liste KEPT d'engine/src/fixes.mjs)
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL, domainToUnicode } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const T = resolve(HERE, '..');
const ENG = join(T, 'engine'), OUT = join(HERE, 'out');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const imp = (p) => import(pathToFileURL(p).href);

// ---------------------------------------------------------------- versions des fichiers utilisés (hash avant ET après la mesure)
const used = [
  ...readdirSync(join(ENG, 'src')).filter((f) => f.endsWith('.mjs')).sort().map((f) => `engine/src/${f}`),
  'engine/vendor/compare.ts', 'run/policy.mjs', 'server/server.mjs', 'redteam/normalize_v2.mjs',
  'attacks/DEV.jsonl', 'attacks_public/PUBLIC.jsonl', 'blind_adem/v2/V2_DEV.jsonl', 'extension_standalone/src/sentinelle_core.js', 'run/run_loop.mjs',
];
const hashAll = () => Object.fromEntries(used.map((f) => [f, sha(readFileSync(join(T, f)))]));
const hashesBefore = hashAll();

const E = await imp(join(ENG, 'src', 'engine.mjs'));
const { compare } = await imp(join(ENG, 'vendor', 'compare.ts'));
const { applyExtraRules, analyzeChainRequest } = await imp(join(ENG, 'src', 'rules_extra.mjs'));
const { applyPolicy } = await imp(join(T, 'run', 'policy.mjs'));
const { normalizeCase } = await imp(join(T, 'redteam', 'normalize_v2.mjs'));

const RANK = { ok: 0, warn: 1, critical: 2 };
const lc = (a) => (typeof a === 'string' ? a.toLowerCase() : a);
const lvlOf = (flags) => (flags.some((f) => f.severity === 'critical') ? 'critical' : flags.some((f) => f.severity === 'warn') ? 'warn' : 'ok');

// ---------------------------------------------------------------- jeux (aucun TEST)
const readJsonl = (f) => readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
const pubBytes = readFileSync(join(T, 'attacks_public', 'PUBLIC.jsonl'));
if (!readFileSync(join(T, 'attacks_public', 'PUBLIC_HASH.txt'), 'utf8').includes(sha(pubBytes))) { console.error('ARRET : PUBLIC.jsonl != PUBLIC_HASH.txt'); process.exit(2); }
const DATASETS = {
  DEV: readJsonl(join(T, 'attacks', 'DEV.jsonl')),
  PUBLIC: pubBytes.toString('utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l)),
  V2_DEV: readJsonl(join(T, 'blind_adem', 'v2', 'V2_DEV.jsonl')).map(normalizeCase),
};
if (DATASETS.DEV.some((c) => c.split !== 'DEV')) { console.error('ARRET : DEV contient un cas non DEV'); process.exit(2); }
if (DATASETS.PUBLIC.some((c) => c.split !== 'REGRESSION_PUBLIQUE')) { console.error('ARRET : PUBLIC contient un cas hors REGRESSION_PUBLIQUE'); process.exit(2); }
if (DATASETS.V2_DEV.some((c) => c.split !== 'DEV')) { console.error('ARRET : V2_DEV contient un cas non DEV'); process.exit(2); }

// ---------------------------------------------------------------- contexte « banc complet » (copie de run/run_loop.mjs buildCtx)
function buildCtxFull(c) {
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

// ---------------------------------------------------------------- contexte « produit » paramétré (miroir de server/server.mjs buildCtx + loadLocalContext)
// Adresses et jetons que le serveur / l'extension autonome embarquent réellement (server.mjs CANONICAL et TOKENS).
const CANONICAL = ['0x000000000022D473030F116dDEE9F6B43aC78BA3', '0xcA11bde05977b3631167028862bE2a173976CA11', '0x9008D19f58AAbD9eD0D60971565AA8510560ab41',
  '0x0000000000000068F116a894984e2DB1123eB395', '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D'].map(lc);
const TOKENS4 = [['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'USDC', 6], ['0xdAC17F958D2ee523a2206206994597C13D831ec7', 'USDT', 6],
  ['0x6B175474E89094C44Da98b954EedeAC495271d0F', 'DAI', 18], ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'WETH', 18]];
const withScheme = (o) => (typeof o !== 'string' || !o ? undefined : /^[a-z][a-z0-9+.-]*:\/\//i.test(o) ? o : 'https://' + o);
const hostOf = (o) => { try { return new URL(o).hostname; } catch { return ''; } };
const unicodeHostOf = (o) => { const h = hostOf(o); try { return domainToUnicode(h) || h; } catch { return h; } };

// s : { prod, contacts, histOut, histIn, static, code, age, tok, sim, bal, site, quote }
function buildCtxSpec(c, s) {
  const k = c.context;
  const now = Math.floor((c.intent.declaredAt ?? 1760000000000) / 1000);
  const facts = {}; for (const [a, v] of Object.entries(k.counterparty_facts || {})) facts[lc(a)] = v;
  const registry = k.token_registry || [];
  const bySymbol = {}; for (const t of registry) bySymbol[t.symbol] = t.decimals;
  let known = s.prod ? [...CANONICAL] : [];
  if (s.static) known = [...new Set([...known, ...(k.known_protocols || []).map((p) => lc(p.address))])];
  const tokenMeta = {}; const codeSet = new Set(known);
  if (s.prod) for (const [a, sy, d] of TOKENS4) { tokenMeta[lc(a)] = { symbol: sy, decimals: d, stable: ['USDC', 'USDT', 'DAI'].includes(sy) }; codeSet.add(lc(a)); }
  if (s.static) for (const t of registry) { tokenMeta[lc(t.address)] = { symbol: t.symbol, decimals: t.decimals, stable: ['USDC', 'USDT', 'DAI'].includes(t.symbol) }; codeSet.add(lc(t.address)); }
  const ageBlocks = {};
  if (s.age) {
    for (const [a, v] of Object.entries(facts)) if (v.ageBlocks !== undefined) ageBlocks[a] = v.ageBlocks;
    for (const [a, v] of Object.entries(k.token_info || {})) if (v.ageBlocks !== undefined && ageBlocks[lc(a)] === undefined) ageBlocks[lc(a)] = v.ageBlocks;
  }
  // token_info transmis au moteur (rules_extra.tokenChecks lit ctx._k.token_info / token_registry)
  const tokenInfoK = {};
  for (const [a, v] of Object.entries(k.token_info || {})) {
    const o = {};
    if (s.tok) { if (v.symbol !== undefined) o.symbol = v.symbol; if (!tokenMeta[lc(a)]) tokenMeta[lc(a)] = { symbol: v.symbol, decimals: bySymbol[v.symbol] ?? 18 }; codeSet.add(lc(a)); }
    if (s.sim) { for (const f of ['sell_simulation', 'buy_tax_pct', 'sell_tax_pct']) if (v[f] !== undefined) o[f] = v[f]; }
    if (Object.keys(o).length) tokenInfoK[a] = o;
  }
  const history = [];
  if (s.prod && (s.histOut || s.histIn)) for (const h of k.history || []) {
    const out = h.direction === 'sortie';
    if (!out && !s.histIn) continue;
    history.push({ address: lc(h.address), ts: now - Math.round((h.minutes_ago || 0) * 60), direction: out ? 'out' : 'in', dust: !out && Number.parseFloat(h.amount) <= 0.01 });
  }
  const contacts = s.prod && s.contacts ? (k.address_book || []).map((b) => ({ address: lc(b.address), label: b.label })) : [];
  const origin = s.prod ? withScheme(k.origin) : undefined;
  const _k = {};
  if (s.prod) _k.origin = unicodeHostOf(origin);
  if (Object.keys(tokenInfoK).length) _k.token_info = tokenInfoK;
  if (s.tok) _k.token_registry = registry;
  if (s.site) { if (k.claimed_site !== undefined) _k.claimed_site = k.claimed_site; if (k.ens !== undefined) _k.ens = k.ens; }
  return {
    chainId: k.chainId, from: lc(k.victim), now, origin, knownSpenders: known, knownVerifiers: new Set(known),
    history: s.prod ? history : undefined, contacts: s.prod ? contacts : undefined, tokenMeta, ageBlocks,
    codeOf: (a) => { a = lc(a); if (s.code && facts[a] && facts[a].isContract !== undefined) return !!facts[a].isContract; if (codeSet.has(a)) return true; return undefined; },
    expectedOut: s.quote && k.quote?.expected_out_units ? () => BigInt(k.quote.expected_out_units) : undefined,
    _sharePct: s.bal ? k.share_of_balance_pct : undefined, _k, _facts: {}, _tokenInfo: {}, _book: contacts,
  };
}

// niveaux de contexte. Chaque niveau est un ensemble de lectures/informations accordées.
const P = { prod: true };
const C0 = { ...P, contacts: true, histOut: true };
const LEVELS = {
  FULL: null, // banc complet (contexte catalogue intégral)
  A: {},
  B: { ...P },
  C: { ...C0 },
  C_hist: { ...C0, histIn: true },
  D: { ...C0, static: true },
  // ablations « un seul champ de plus que C »
  S_code: { ...C0, code: true },
  S_age: { ...C0, age: true },
  S_tok: { ...C0, tok: true },
  S_bal: { ...C0, bal: true },
  S_site: { ...C0, site: true },
  S_sim: { ...C0, sim: true },
  S_quote: { ...C0, quote: true },
  // contexte minimal en ligne, cumulatif, sur C
  O1: { ...C0, code: true },
  O2: { ...C0, code: true, age: true },
  O3: { ...C0, code: true, age: true, tok: true },
  O4: { ...C0, code: true, age: true, tok: true, bal: true },
  // liste statique livrée + tout le minimal en ligne
  D_O4: { ...C0, static: true, code: true, age: true, tok: true, bal: true },
  // tout sauf ce qu'aucune lecture simple ne donne : reconstitue le banc complet (auto-contrôle)
  ALL: { ...C0, histIn: true, static: true, code: true, age: true, tok: true, bal: true, site: true, sim: true, quote: true },
};
const LEVEL_DOC = {
  FULL: 'banc complet : tout le champ context du catalogue (âge, nature, solde, jetons, simulation de vente, protocoles connus du catalogue, carnet, historique entrant et sortant)',
  A: 'aucun contexte : ni origine, ni liste connue, ni carnet, ni historique (reste : from et chaîne, qui sont dans la requête)',
  B: 'produit, configuration par défaut : origine de la page, chaîne, 5 adresses canoniques, 4 jetons, carnet et historique vides',
  C: 'B + carnet d\'adresses et historique SORTANT saisis par l\'utilisateur dans les options (l\'historique entrant, poussière, n\'est pas connu de l\'utilisateur)',
  C_hist: 'C + historique entrant (poussière d\'empoisonnement) saisi aussi (sensibilité : l\'utilisateur ne peut pas le saisir sans l\'avoir vu)',
  D: 'C + liste STATIQUE livrée avec le produit : protocoles connus + jetons de référence du catalogue (borne haute optimiste : le catalogue connaît exactement les bons protocoles)',
  S_code: 'C + nature contrat/compte externe (eth_getCode) seule', S_age: 'C + âge du contrat seul', S_tok: 'C + symbol/decimals + registre de référence seuls',
  S_bal: 'C + part du solde seule', S_site: 'C + site attendu (claimed_site) et nom ENS voulu seuls (pas une lecture réseau : c\'est l\'intention de l\'utilisateur)',
  S_sim: 'C + simulation de vente / taxes seules', S_quote: 'C + cotation attendue du swap seule',
  O1: 'C + eth_getCode', O2: 'O1 + âge du contrat', O3: 'O2 + symbol/decimals (+ registre de référence statique)', O4: 'O3 + soldes (eth_getBalance / balanceOf)',
  D_O4: 'D + toutes les lectures O4', ALL: 'tout le catalogue reconstruit via le chemin « produit » (auto-contrôle : doit retrouver FULL)',
};

// ---------------------------------------------------------------- décodage (copie de run_loop)
const lcA = lc;
function analyzeTx(tx, ctx) {
  const opts = { ...ctx }; delete opts._sharePct;
  let eff = E.analyzeTransaction(tx, opts);
  if (ctx._sharePct && eff.outgoing.length) {
    const o = eff.outgoing.reduce((m, x) => (BigInt(x.amountRaw) > BigInt(m.amountRaw) ? x : m));
    const pct100 = BigInt(Math.round(ctx._sharePct * 100));
    if (pct100 > 0n) eff = E.analyzeTransaction(tx, { ...opts, balances: { [lcA(o.token)]: ((BigInt(o.amountRaw) * 10000n) / pct100).toString() } });
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
    case 'wallet_addEthereumChain': { const e = analyzeChainRequest(c.request, ctx); return e ? { eff: e } : { unsupported: `méthode ${method} non gérée` }; }
    default: return { unsupported: `méthode ${method} non gérée` };
  }
}
function honestIntent(eff, ctx, declaredAt) {
  const base = { declaredAt };
  const book = (a) => ctx._book.find((b) => lc(b.address) === lc(a));
  if (eff.approvals.length || eff.incoming.length) return { ...base, kind: 'buy_or_swap', freeText: "Je réalise un échange / j'autorise une application (dérivé des effets)", ...(eff.outgoing[0] ? { token: eff.outgoing[0].symbol, amount: eff.outgoing[0].amount } : {}) };
  if (eff.outgoing.length) { const o = eff.outgoing[0], b = book(o.to); return { ...base, kind: 'pay_someone', freeText: 'Je paie ce destinataire (dérivé des effets)', token: o.symbol, amount: o.amount, counterpartyAddress: o.to, ...(b ? { counterpartyLabel: b.label } : {}) }; }
  return { ...base, kind: 'connect_or_accept_offer', freeText: 'Je signe / me connecte (dérivé des effets)' };
}
// Ce que l'extension sait exprimer (server.mjs toIntent) : pay -> pay_someone ; receive/login -> connect_or_accept_offer ; asked -> asked_by_someone ;
// tout le reste (échange, envoi à mon compte, vague, absent) -> aucune intention : plancher du moteur seul. Jamais de jeton, de montant ni de destinataire.
function productIntent(c) {
  const kind = c.intent && c.intent.kind, base = { declaredAt: c.intent && c.intent.declaredAt };
  if (kind === 'pay_someone') return { ...base, kind: 'pay_someone' };
  if (kind === 'connect_or_accept_offer') return { ...base, kind: 'connect_or_accept_offer' };
  if (kind === 'asked_by_someone') return { ...base, kind: 'asked_by_someone', askedBy: 'other' };
  return null;
}

// ---------------------------------------------------------------- évaluation d'un cas à un niveau
const ARMS = ['sans_intention', 'intention_honnete', 'intention_mensongere', 'intention_produit'];
const CH = { ok: 'o', warn: 'w', critical: 'c', unknown: 'u' };
function evalCase(c, levelName) {
  const spec = LEVELS[levelName];
  const ctx = spec === null ? buildCtxFull(c) : buildCtxSpec(c, spec);
  const res = { lv: {}, opaque: 0, opacityOnly: 0, cost: null };
  let dec;
  try { dec = decodeRequest(c, ctx); } catch (e) { for (const a of ARMS) res.lv[a] = 'unknown'; res.err = 1; return res; }
  if (dec.unsupported) { for (const a of ARMS) res.lv[a] = 'unknown'; res.unsupported = 1; return res; }
  const eff = dec.eff;
  applyExtraRules(eff, c.request, ctx);
  if (eff.shareOfBalancePct === undefined && ctx._sharePct !== undefined && !eff.outgoing.length) eff.shareOfBalancePct = ctx._sharePct;
  const pol = (intent) => applyPolicy({ eff, adem: compare(intent, eff), ctx, intent, request: c.request });
  const floor = applyPolicy({ eff, adem: null, ctx, intent: null, request: c.request }).level;
  const vM0 = compare(c.intent, eff);
  res.lv.sans_intention = floor;
  res.lv.intention_honnete = pol(honestIntent(eff, ctx, c.intent.declaredAt)).level;
  res.lv.intention_mensongere = pol(c.intent).level;
  const pi = productIntent(c);
  res.lv.intention_produit = pi ? pol(pi).level : floor;
  res.opaque = eff.opaque ? 1 : 0;
  res.opacityOnly = floor !== 'ok' && eff.levelEvidence === 'ok' && vM0.level === 'ok' ? 1 : 0;
  // coût en lectures RPC si ce cas devait être complété en ligne (mesuré sur le niveau C : ce que le produit ignore encore)
  const cps = eff.counterparties || [];
  const toks = new Map();
  for (const o of [...(eff.outgoing || []), ...(eff.incoming || []), ...(eff.approvals || [])]) { const t = lc(o.token); if (t && t !== 'native' && /^0x[0-9a-f]{40}$/.test(t)) toks.set(t, o.symbol !== undefined); }
  const outToks = new Set((eff.outgoing || []).map((o) => lc(o.token)).filter(Boolean));
  res.cost = {
    code: cps.filter((x) => !x.isContractKnown).length,                 // eth_getCode par contrepartie dont la nature est inconnue
    age: cps.filter((x) => x.isContract || !x.isContractKnown).length,  // sonde d'âge (getCode à un bloc ancien) par contrepartie susceptible d'être un contrat
    tok: 2 * [...toks.values()].filter((known) => !known).length,       // symbol() + decimals() pour chaque jeton sans métadonnées
    bal: outToks.size,                                                  // eth_getBalance ou balanceOf par jeton sortant
  };
  return res;
}

// ---------------------------------------------------------------- exécution
const t0 = Date.now();
const rows = [];
for (const [ds, cases] of Object.entries(DATASETS)) {
  for (const c of cases) {
    const row = { id: c.id, ds, fam: c.family, sub: c.subfamily, label: c.label, exp: c.expected_severity, L: {} };
    for (const lvName of Object.keys(LEVELS)) {
      const r = evalCase(c, lvName);
      row.L[lvName] = ARMS.map((a) => CH[r.lv[a]]).join('') + (r.opaque ? 'O' : '-') + (r.opacityOnly ? 'P' : '-');
      if (lvName === 'C') row.cost = r.cost;
    }
    rows.push(row);
  }
  console.error(`[${ds}] ${cases.length} cas évalués (${Date.now() - t0} ms)`);
}
mkdirSync(OUT, { recursive: true });

// auto-contrôle : ALL doit retrouver FULL (différences = origines au format exotique, listées)
const selfDiff = rows.filter((r) => r.L.ALL.slice(0, 4) !== r.L.FULL.slice(0, 4)).map((r) => ({ id: r.id, full: r.L.FULL, all: r.L.ALL }));

const hashesAfter = hashAll();
const drift = used.filter((f) => hashesBefore[f] !== hashesAfter[f]);
const versions = { ts: new Date().toISOString(), POLICY_FIXES: process.env.POLICY_FIXES || '(défaut KEPT)', node: process.version, sha256_avant: hashesBefore, fichiers_modifies_pendant_la_mesure: drift };
writeFileSync(join(OUT, 'versions.json'), JSON.stringify(versions, null, 1));
writeFileSync(join(OUT, 'cases.json'), JSON.stringify({ arms: ARMS, format: '4 lettres (une par bras : o=ok w=warn c=critical u=inconnu) puis O si moteur opaque, P si alerte par opacité seule', levels: LEVEL_DOC, rows }));
writeFileSync(join(OUT, 'autocontrole_ALL_vs_FULL.json'), JSON.stringify({ n_diff: selfDiff.length, n: rows.length, diffs: selfDiff.slice(0, 200) }, null, 1));
console.log(`OK ${rows.length} cas x ${Object.keys(LEVELS).length} niveaux en ${Date.now() - t0} ms ; ALL!=FULL sur ${selfDiff.length} cas ; fichiers modifiés pendant la mesure : ${drift.length ? drift.join(', ') : 'aucun'}`);

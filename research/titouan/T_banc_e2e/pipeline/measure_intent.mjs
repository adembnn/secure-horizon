// pipeline/measure_intent.mjs - what the WRITTEN intent brings, read by keywords and by Clef-flash (pipeline/intent_clef.mjs).
// Usage (repo root) : node --env-file=.env research/titouan/T_banc_e2e/pipeline/measure_intent.mjs [cases.jsonl ...] [--json] [--no-replay] [--no-calls]
//                     [--limit-texts=N] [--max-calls=4000] [--pool=6] [--threshold=0.6] [--out=file.json]
// Replays EXISTING case files only (default : blind_adem/v2/V2_DEV.jsonl + redteam/jury_*.jsonl). Any path matching V2_TEST is refused.
// Only the free-text intents of those cases (intent.freeText, synthetic) are sent to Clef-flash, one call per UNIQUE text, nothing else.
// The raw answers are kept in pipeline/intent_clef_cache.json under the SHA-256 of the text (no text, no key, no header is written) with a
// call counter : the script refuses to go over --max-calls in total, across runs. A second run costs no call.
// Measures :
//   A. kind : keywords vs Clef-flash against the kind of the case (unique texts) ; confusion ; share "not classified" ; amount and token read by code ;
//      latency, tokens, cost of the calls actually made.
//   B. replay through evaluatePlus (live-like facts of pipeline/measure.mjs, pasted-message classifier OFF) with four intents :
//      none ; the structured Intent of the case (reference) ; free text + keywords ; free text + Clef-flash.
//      Two more columns are a SIMULATION, without any call : the same kind (read on the case's own text), but the amount, token and counterparty label of the
//      case are appended to the text as the user would write them ("<text> <amount> <token> à <label>") and read back by code. They say what the text route
//      gives when the user does write the details ; the kind was not re-asked on that longer sentence.
//      First the subset "the request looks normal" : cases GREEN with no intent. Then all cases.
//   C. invariant : a not-classified intent never gives a lower verdict than no intent.
// Levels : bench scale, ok 0 < unknown 0.5 < warn 1 < critical 2. Screens : vert / non_verifie / orange / rouge. A scam is stopped only when red.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readCases, productInput, liveLike, atCaseTime, D, ROOT } from './measure.mjs';
import { makeEvaluatePlus, benchLevel } from './evaluate_plus.mjs';
import { classifyIntent, askIntent, decide, cleanText, extractFields, evaluateWithIntent, rankOf, KINDS, DEFAULT_THRESHOLD } from './intent_clef.mjs';
import { clefAvailable, USD_PER_M_INPUT } from '../detectors_adem/clef_client.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const CACHE = join(HERE, 'intent_clef_cache.json');
const MODEL = 'clef-flash';
const sha = (t) => createHash('sha256').update(t, 'utf8').digest('hex');
const canon = (k) => { if (typeof k !== 'string') return null; const x = k.trim().toLowerCase().replace(/[-\s]+/g, '_'); return KINDS.includes(x) ? x : null; };
const quant = (xs, q) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : null);
const inc = (o, k, w = 1) => { o[k] = (o[k] || 0) + w; };
const screen = (v) => { const l = benchLevel(v); return l === 'critical' ? 'rouge' : (v && v.level === 'unknown') || l === 'unknown' ? 'non_verifie' : l === 'warn' ? 'orange' : 'vert'; };
const codesOf = (v) => new Set([...((v && v.codes) || []), ...(((v && v.plus && v.plus.signals) || []).map((s) => s.code)), ...(((v && v.raisons) || []).map((r) => r.code))]);

// type of gap between what was written and what the request does, from the reason codes that appear WITH the intent and not without
export const GAP = {
  montant_vs_droit: ['approval_exceeds_intent'],
  montant_vs_montant_envoye: ['amount_exceeded', 'amount_exceeded_robust'],
  rien_depenser_vs_droit_ou_fonds: ['unexpected_outgoing', 'unexpected_approval_connect', 'unexpected_delegation_connect'],
  destinataire: ['wrong_recipient', 'recipient_not_label', 'first_seen_recipient'],
  jeton: ['token_mismatch', 'token_differs_from_intent'],
  on_me_l_a_demande: ['asked_by_someone_outgoing'],
  paiement_ou_echange_vs_droit: ['unexpected_approval', 'unexpected_delegation', 'signed_right_not_intended', 'no_incoming', 'permit_new_contract'],
};
const gapsOf = (floorV, v) => {
  const before = codesOf(floorV); const added = [...codesOf(v)].filter((c) => !before.has(c));
  const g = Object.entries(GAP).filter(([, codes]) => codes.some((c) => added.includes(c))).map(([k]) => k);
  return g.length ? g : ['autre'];
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
  const flag = (n) => args.includes(`--${n}`);
  let files = args.filter((a) => !a.startsWith('--'));
  if (!files.length) files = [join(ROOT, 'blind_adem', 'v2', 'V2_DEV.jsonl'), ...readdirSync(join(ROOT, 'redteam')).filter((f) => /^jury_.*\.jsonl$/.test(f)).sort().map((f) => join(ROOT, 'redteam', f))];
  const MAX_CALLS = Number(opt('max-calls', '4000')), POOL = Number(opt('pool', '6')), THR = Number(opt('threshold', String(DEFAULT_THRESHOLD)));
  const limitTexts = Number(opt('limit-texts', '0'));
  const T0 = Date.now();

  // ---------------------------------------------------------------- cases and unique texts
  const cases = [];
  for (const file of files) for (const { c, id, src } of readCases(file)) {
    if (!c || !c.request || typeof c.request !== 'object') continue;
    const I = c.intent && typeof c.intent === 'object' ? c.intent : {};
    const text = typeof I.freeText === 'string' ? cleanText(I.freeText) : '';
    cases.push({ c, id, src, I, text });
  }
  const texts = new Map(); // text -> { kinds:Set, n }
  for (const k of cases) { if (!k.text) continue; const e = texts.get(k.text) || { kinds: new Set(), n: 0 }; e.n++; const kc = canon(k.I.kind); if (kc) e.kinds.add(kc); texts.set(k.text, e); }
  let uniq = [...texts.keys()]; if (limitTexts > 0) uniq = uniq.slice(0, limitTexts);

  // ---------------------------------------------------------------- A0. Clef-flash calls, cached on disk, capped
  const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : { model: MODEL, calls: 0, entries: {} };
  const save = () => writeFileSync(CACHE, JSON.stringify(cache));
  const callsBefore = cache.calls; let made = 0, capped = 0;
  const callOne = async (t) => {
    if (cache.calls >= MAX_CALLS) { capped++; return; }
    cache.calls++; made++;
    const r = await askIntent(t, { provider: MODEL, timeoutMs: 6000 });
    cache.entries[sha(t)] = r.ok ? { ok: true, answers: r.answers, ms: r.ms, usage: r.usage } : { ok: false, error: String(r.error).slice(0, 160), ms: r.ms };
    if (made % 100 === 0) { save(); console.error(`  ${made} appels…`); }
  };
  const pool = async (list) => { let next = 0; await Promise.all(Array.from({ length: POOL }, async () => { while (next < list.length) await callOne(list[next++]); })); save(); };
  const live = clefAvailable() && !flag('no-calls');
  if (live) {
    await pool(uniq.filter((t) => !cache.entries[sha(t)]));
    await pool(uniq.filter((t) => cache.entries[sha(t)] && !cache.entries[sha(t)].ok)); // one retry for the failures
  }
  const entry = (t) => cache.entries[sha(t)] || null;
  const kwRaw = new Map();
  for (const t of uniq) { const r = await classifyIntent(t, { provider: 'keyword' }); kwRaw.set(t, { source: 'keyword', kind: r.candidate.kind, confidence: r.candidate.confidence, asked: r.facts.asked_by_someone === 1, receive: r.facts.expects_no_spend === 1 }); }
  // -> result of decide() for a text, for a provider ; Clef failure or absence -> keyword fallback, flagged
  const cls = (t, provider, o = {}) => {
    const e = provider === 'clef' ? entry(t) : null;
    if (provider === 'clef' && e && e.ok) return { ...decide({ source: MODEL, answers: e.answers }, t, { threshold: THR, ...o }), provider: MODEL, fallback: false };
    return { ...decide(kwRaw.get(t) || { source: 'keyword', kind: null, confidence: 0 }, t, { threshold: THR, ...o }), provider: 'keyword', fallback: provider === 'clef' };
  };

  // ---------------------------------------------------------------- A. kind, on unique texts
  const kindStat = () => ({ n: 0, ok: 0, wrong: 0, none: 0, n_single: 0, ok_single: 0, wrong_single: 0, none_single: 0, replis: 0, confusion: {}, raisons: {} });
  const A = { keyword: kindStat(), clef: kindStat() };
  const variants = { clef_sans_regle_demande: kindStat(), clef_sans_regle_vague: kindStat(), clef_choix_seul: kindStat() };
  const score = (S, t, r) => {
    const truth = texts.get(t).kinds; if (!truth.size) return;
    S.n++; if (r.fallback) S.replis++;
    const res = !r.classified ? 'none' : truth.has(r.kind) ? 'ok' : 'wrong'; S[res]++; inc(S.raisons, r.reason);
    if (truth.size === 1) { S.n_single++; S[res + '_single']++; const tk = [...truth][0]; const row = (S.confusion[tk] ??= {}); inc(row, r.classified ? r.kind : 'non classée'); }
  };
  const haveClef = uniq.filter((t) => entry(t) && entry(t).ok);
  for (const t of uniq) {
    score(A.keyword, t, cls(t, 'keyword'));
    if (!haveClef.length) continue;
    score(A.clef, t, cls(t, 'clef'));
    score(variants.clef_sans_regle_demande, t, cls(t, 'clef', { askedOverrides: false }));
    score(variants.clef_sans_regle_vague, t, cls(t, 'clef', { vagueBlocks: false }));
    score(variants.clef_choix_seul, t, cls(t, 'clef', { askedOverrides: false, vagueBlocks: false }));
  }
  // thresholds sweep, offline
  const sweep = {};
  if (haveClef.length) for (const th of [0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) { const S = kindStat(); for (const t of uniq) score(S, t, cls(t, 'clef', { threshold: th })); sweep[th] = { exact_pct: pct(S.ok, S.n), faux_pct: pct(S.wrong, S.n), non_classee_pct: pct(S.none, S.n) }; }

  // amount and token read by code (same code for both providers) : unique (text, amount, token) of the cases
  const F = { amount: { n: 0, ok: 0, none: 0, wrong: 0, inText: 0, inText_ok: 0, inText_none: 0, inText_wrong: 0 }, token: { n: 0, ok: 0, none: 0, wrong: 0, inText: 0, inText_ok: 0, inText_none: 0, inText_wrong: 0 }, sans_montant_dans_le_cas: { n: 0, montant_lu: 0 }, modele_voit_un_montant_non_lu: 0, exemples_ecarts: [] };
  const seenF = new Set();
  const fam = (s) => String(s || '').toUpperCase().replace(/^\$/, '').replace(/\.[A-Z]$/, '');
  for (const k of cases) {
    if (!k.text || (limitTexts > 0 && !uniq.includes(k.text))) continue;
    const key = k.text + '\u0000' + k.I.amount + '\u0000' + k.I.token; if (seenF.has(key)) continue; seenF.add(key);
    const f = extractFields(k.text);
    const amt = typeof k.I.amount === 'string' || typeof k.I.amount === 'number' ? String(k.I.amount).trim().replace(',', '.') : null;
    if (amt !== null && /^\d+(\.\d+)?$/.test(amt)) {
      const r = f.amount === undefined ? 'none' : Number(f.amount) === Number(amt) ? 'ok' : 'wrong'; F.amount.n++; F.amount[r]++;
      const digits = String(k.I.amount).trim(); const inText = k.text.includes(digits) || k.text.includes(digits.replace('.', ','));
      if (inText) { F.amount.inText++; F.amount['inText_' + r]++; if (r !== 'ok' && F.exemples_ecarts.length < 12) F.exemples_ecarts.push({ texte: k.text, attendu: digits, lu: f.amount ?? null }); }
    } else if (amt === null) { F.sans_montant_dans_le_cas.n++; if (f.amount !== undefined) F.sans_montant_dans_le_cas.montant_lu++; }
    const tok = typeof k.I.token === 'string' && k.I.token.trim() ? k.I.token.trim() : null;
    if (tok && !/^0x/i.test(tok)) {
      const r = !f.token ? 'none' : fam(f.token) === fam(tok) ? 'ok' : 'wrong'; F.token.n++; F.token[r]++;
      if (k.text.toUpperCase().includes(tok.toUpperCase())) { F.token.inText++; F.token['inText_' + r]++; if (r !== 'ok' && F.exemples_ecarts.length < 24) F.exemples_ecarts.push({ texte: k.text, jeton_attendu: tok, lu: f.token ?? null }); }
    }
  }
  for (const t of haveClef) if (cls(t, 'clef').amountSaidNotParsed) F.modele_voit_un_montant_non_lu++;

  const okE = uniq.map(entry).filter((e) => e && e.ok), koE = uniq.map(entry).filter((e) => e && !e.ok);
  const lat = okE.map((e) => e.ms).filter((x) => x > 0);
  const tokIn = okE.reduce((s, e) => s + ((e.usage && (e.usage.input_tokens ?? e.usage.prompt_tokens)) || 0), 0);
  const tokOut = okE.reduce((s, e) => s + ((e.usage && (e.usage.output_tokens ?? e.usage.completion_tokens)) || 0), 0);
  const appels = { cles_presentes: clefAvailable(), faits_cette_execution: made, total_cumule: cache.calls, avant: callsBefore, plafond: MAX_CALLS, refuses_par_le_plafond: capped,
    textes_avec_reponse: okE.length, textes_en_echec: koE.length, erreurs: [...new Set(koE.map((e) => e.error))].slice(0, 5), textes_sans_appel: uniq.length - okE.length - koE.length,
    latence_ms: { p50: quant(lat, 0.5), p95: quant(lat, 0.95), max: lat.length ? Math.max(...lat) : null }, tokens_entree: tokIn, tokens_sortie: tokOut,
    tokens_entree_par_appel: okE.length ? Math.round(tokIn / okE.length) : null, cout_usd: Math.round((tokIn / 1e6) * USD_PER_M_INPUT[MODEL] * 1e5) / 1e5,
    cout_usd_pour_1000_intentions: okE.length ? Math.round((tokIn / okE.length / 1e6) * USD_PER_M_INPUT[MODEL] * 1000 * 1e4) / 1e4 : null };

  const out = { date: new Date().toISOString(), fichiers: files.map((f) => f.split(/[\\/]/).pop()), seuil: THR, cas: cases.length, cas_avec_texte: cases.filter((k) => k.text).length,
    textes_uniques: uniq.length, textes_avec_plusieurs_genres: uniq.filter((t) => texts.get(t).kinds.size > 1).length, textes_sans_genre: uniq.filter((t) => !texts.get(t).kinds.size).length, appels, genre: A, variantes_regles: variants, seuils: sweep, champs: F };
  for (const S of [...Object.values(A), ...Object.values(variants)]) { S.exact_pct = pct(S.ok, S.n); S.faux_pct = pct(S.wrong, S.n); S.non_classee_pct = pct(S.none, S.n); S.exact_parmi_classees_pct = pct(S.ok, S.ok + S.wrong); S.exact_un_seul_genre_pct = pct(S.ok_single, S.n_single); }

  // ---------------------------------------------------------------- B / C. replay
  if (!flag('no-replay')) {
    const run = makeEvaluatePlus(D);
    const COLS = ['sans', 'reference', 'mots_cles', 'clef', 'mots_cles_details', 'clef_details'];
    const IC = COLS.slice(1); const z = () => Object.fromEntries(IC.map((k) => [k, 0])); const zo = (f) => Object.fromEntries(IC.map((k) => [k, f()]));
    const tot = () => Object.fromEntries(COLS.map((k) => [k, { arnaques: 0, ratees: 0, honnetes: 0, fausses_alertes: 0, orange_honnetes: 0, non_verifie_honnetes: 0 }]));
    const R = { population: 'cas avec texte libre et étiquette malveillant / benin', n: 0, autres_etiquettes: 0, tous: tot(),
      normal: { arnaques_vertes_sans_intention: 0, arretees: z(), orange: z(), par_ecart: zo(() => ({})), non_classees: { mots_cles: 0, clef: 0 }, arretees_par_fichier: {}, textes: {},
        honnetes_vertes_sans_intention: 0, cout: zo(() => ({ rouge: 0, non_verifie: 0, orange: 0, non_classee: 0, pas_pu_verifier_si_regle_gardien: 0 })), cout_par_ecart: zo(() => ({})) },
      non_rouge: { arnaques_non_rouges_sans_intention: 0, arretees: z(), par_ecart: zo(() => ({})), honnetes_non_rouges_sans_intention: 0, deviennent_rouges: z() },
      adoucissements: { ...z(), arnaques: z() }, chemins: { mots_cles: {}, clef: {} }, replis_clef: 0,
      invariant: { cas: 0, comparaisons: 0, contre_exemples: 0, moteur_brut_plus_bas: 0, non_classees_reelles: { mots_cles: 0, clef: 0 }, non_classees_reelles_plus_bas: 0, exemples: [] }, erreurs: 0 };
    await run({ method: 'eth_sendTransaction', params: [{ from: '0x' + '1'.repeat(40), to: '0x' + '2'.repeat(40), value: '0x1', data: '0x' }], chainId: 1 }, {}, { live: null, classifier: false }); // warm-up
    let done = 0;
    for (const k of cases) {
      const { c, I, text, src } = k;
      if (!text || (limitTexts > 0 && !uniq.includes(text))) continue;
      const { body, local } = productInput(c);
      const o = { live: liveLike(c, body, local), classifier: false };
      const at = Number.isFinite(I.declaredAt) ? I.declaredAt : undefined;
      const dOpt = { contacts: local.contacts, declaredAt: at };
      let res;
      try {
        res = await atCaseTime(c, async () => {
          const floorV = await run(body, local, o);
          const ref = await run(body, local, { ...o, intent: I });
          const cK = cls(text, 'keyword', dOpt), cC = cls(text, 'clef', dOpt);
          const kw = await evaluateWithIntent(run, body, local, o, cK, floorV);
          const cf = await evaluateWithIntent(run, body, local, o, cC, floorV);
          // simulation : the details of the case written in clear after the text, read back by code ; the kind stays the one read on the case's own text
          const has = (x) => (typeof x === 'string' && x.trim()) || typeof x === 'number';
          const longer = [text, has(I.amount) ? String(I.amount) : '', has(I.token) ? String(I.token) : '', has(I.counterpartyLabel) ? 'à ' + I.counterpartyLabel : ''].filter(Boolean).join(' ');
          const dK = decide(kwRaw.get(text), longer, { threshold: THR, ...dOpt }), e = entry(text);
          const dC = e && e.ok ? decide({ source: MODEL, answers: e.answers }, longer, { threshold: THR, ...dOpt }) : dK;
          const kwD = await evaluateWithIntent(run, body, local, o, dK, floorV), cfD = await evaluateWithIntent(run, body, local, o, dC, floorV);
          // C : the same text forced to "not classified" (details kept), and a bare not-classified intent
          const forced = await evaluateWithIntent(run, body, local, o, { classified: false, details: cC.details }, floorV);
          const bare = await evaluateWithIntent(run, body, local, o, { classified: false, details: { freeText: text, declaredAt: at } }, floorV);
          return { floorV, ref, cK, cC, kw, cf, forced, bare, kwD, cfD };
        });
      } catch (e) { R.erreurs++; continue; }
      const { floorV, ref, cK, cC, kw, cf, forced, bare, kwD, cfD } = res;
      const V = { reference: ref, mots_cles: kw.v, clef: cf.v, mots_cles_details: kwD.v, clef_details: cfD.v };
      const S = { sans: screen(floorV) }; for (const col of IC) S[col] = screen(V[col]);
      const CL = { mots_cles: cK, clef: cC, mots_cles_details: cK, clef_details: cC };
      const fl = benchLevel(floorV);
      // invariant
      const inv = R.invariant; inv.cas++;
      for (const [name, x] of [['forcee', forced], ['nue', bare]]) { inv.comparaisons++; if (rankOf(x.level) < rankOf(fl)) { inv.contre_exemples++; if (inv.exemples.length < 8) inv.exemples.push({ fichier: src, variante: name, sans: fl, avec: x.level }); } if (rankOf(x.rawLevel) < rankOf(fl)) inv.moteur_brut_plus_bas++; }
      for (const [name, cl, x] of [['mots_cles', cK, kw], ['clef', cC, cf]]) if (!cl.classified) { inv.non_classees_reelles[name]++; inv.comparaisons++; if (rankOf(x.level) < rankOf(fl)) { inv.non_classees_reelles_plus_bas++; inv.contre_exemples++; } }
      if (cC.fallback) R.replis_clef++;
      inc(R.chemins.mots_cles, kw.path); inc(R.chemins.clef, cf.path);
      if (c.label !== 'malveillant' && c.label !== 'benin') { R.autres_etiquettes++; continue; }
      R.n++;
      const mal = c.label === 'malveillant';
      for (const col of COLS) { const t = R.tous[col]; if (mal) { t.arnaques++; if (S[col] !== 'rouge') t.ratees++; } else { t.honnetes++; if (S[col] === 'rouge') t.fausses_alertes++; else if (S[col] === 'orange') t.orange_honnetes++; else if (S[col] === 'non_verifie') t.non_verifie_honnetes++; } }
      for (const col of IC) if (rankOf(benchLevel(V[col])) < rankOf(fl)) { R.adoucissements[col]++; if (mal) R.adoucissements.arnaques[col]++; }
      const N = R.normal;
      if (mal && S.sans !== 'rouge') { R.non_rouge.arnaques_non_rouges_sans_intention++; for (const col of IC) if (S[col] === 'rouge') { R.non_rouge.arretees[col]++; for (const g of gapsOf(floorV, V[col])) inc(R.non_rouge.par_ecart[col], g); } }
      if (!mal && S.sans !== 'rouge') { R.non_rouge.honnetes_non_rouges_sans_intention++; for (const col of IC) if (S[col] === 'rouge') R.non_rouge.deviennent_rouges[col]++; }
      if (S.sans !== 'vert') continue;
      if (mal) {
        N.arnaques_vertes_sans_intention++;
        const pf = (N.arretees_par_fichier[src] ??= { n: 0, ...z() }); pf.n++; inc(N.textes, text.length <= 12 ? 'un_mot_ou_presque' : 'phrase');
        if (!cK.classified) N.non_classees.mots_cles++; if (!cC.classified) N.non_classees.clef++;
        for (const col of IC) {
          if (S[col] === 'rouge') { N.arretees[col]++; pf[col]++; for (const g of gapsOf(floorV, V[col])) inc(N.par_ecart[col], g); }
          else if (S[col] === 'orange' || S[col] === 'non_verifie') N.orange[col]++;
        }
      } else {
        N.honnetes_vertes_sans_intention++;
        for (const col of IC) {
          if (S[col] !== 'vert') { N.cout[col][S[col]]++; if (S[col] === 'rouge') for (const g of gapsOf(floorV, V[col])) inc(N.cout_par_ecart[col], g); }
          // extension/gatekeeper.js : a text that is still not understood shows "Je n'ai pas pu vérifier" when funds leave or a right is granted
          const eff = (floorV && floorV.effects) || {};
          if (CL[col] && !CL[col].classified) { N.cout[col].non_classee++; if (S[col] !== 'rouge' && (eff.grants_right || eff.funds_out)) N.cout[col].pas_pu_verifier_si_regle_gardien++; }
        }
      }
      if (++done % 2000 === 0) console.error(`  ${done} cas rejoués…`);
    }
    out.rejeu = R;
  }
  out.duree_s = Math.round((Date.now() - T0) / 1000);
  const outFile = opt('out', join(HERE, 'intent_measure.json'));
  writeFileSync(outFile, JSON.stringify(out, null, 1));
  if (flag('json')) console.log(JSON.stringify(out, null, 1));
  else {
    console.log(`${out.cas_avec_texte} cas avec texte, ${out.textes_uniques} textes uniques, seuil ${THR}, ${out.duree_s} s`);
    console.log('appels :', JSON.stringify(appels));
    for (const [k, S] of Object.entries({ ...A, ...variants })) console.log(`genre ${k} : n=${S.n} exact ${S.exact_pct} % | faux ${S.faux_pct} % | non classée ${S.non_classee_pct} % | exact parmi classées ${S.exact_parmi_classees_pct} % | replis ${S.replis} | raisons ${JSON.stringify(S.raisons)}`);
    console.log('confusion mots-clés :', JSON.stringify(A.keyword.confusion)); console.log('confusion clef :', JSON.stringify(A.clef.confusion));
    console.log('seuils :', JSON.stringify(sweep));
    console.log('champs :', JSON.stringify(F));
    if (out.rejeu) console.log('rejeu :', JSON.stringify(out.rejeu, null, 1));
  }
  console.error(`écrit : ${outFile}`);
}

// pipeline/measure_vague.mjs - what a VAGUE written intent costs and whether it can ever do better than no intent at all.
// Replays EXISTING case files only (default : blind_adem/v2/V2_DEV.jsonl + redteam/jury_*.jsonl). Any path matching V2_TEST is refused.
// No model, no network : the text is read by the model-free path of the extension (extension/intent_text.js keywordClassify + interpret),
// the classifier detector is off, the chain facts are the "live-like" facts of pipeline/measure.mjs (mode `live`, the shipped configuration).
// The only sentences written here are ordinary USER INTENTS (VAGUE, GENRE). No request, no address, no case id is written in this file.
//
// Usage : node pipeline/measure_vague.mjs [cases.jsonl ...] [--json] [--limit=N] [--examples=N] [--no-nofacts] [--part=i/n]
//   --part=i/n : only the cases whose rank in their file is i modulo n (to split a long run over several processes ; the counters add up).
//
// Variants, per case :
//   a  none      : evaluatePlus(body, local, { live })
//   b  vague     : each sentence of VAGUE, two routes
//        text    : what the extension sends without a model : body.intent_text, plus body.intent when the keyword parser "understood" a kind
//        object  : evaluatePlus(..., { intent: { freeText, declaredAt } })  (Intent object without a kind)
//   c  genre     : a kind and nothing else. text route = the sentence of GENRE through the parser ; object route = { kind, declaredAt }.
//                  The invariant is checked with the 5 kinds on every case ; the score uses the case's own kind.
//   d  detailed  : object route = the case's whole Intent ; text route = the case's freeText through the model-free parser.
// Rule under test ("one follow-up, then not verified") : when the text is still not understood, every screen that is not red becomes
// "Je n'ai pas pu vérifier" (rule) ; `gardien` is what extension/gatekeeper.js does today (only when funds leave or a right is granted).
// Levels : bench scale of evaluate_plus.benchLevel, ok 0 < unknown 0.5 < warn 1 < critical 2. A scam is caught only when the screen is red.
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readCases, productInput, liveLike, atCaseTime, D, ROOT } from './measure.mjs';
import { makeEvaluatePlus, benchLevel } from './evaluate_plus.mjs';

const ext = (f) => import(pathToFileURL(join(ROOT, 'extension', f)).href);
const { keywordClassify, interpret, extractFields, ENGINE_CHOICE, KINDS } = await ext('intent_text.js');
const { keywordProvider } = await ext('keyword_intent.js');

// Ordinary vague answers of a user (French). The first six are the ones named in the design decision.
export const VAGUE = ['', 'ok', 'valider', 'je sais pas', 'faire la transaction', 'continuer', 'oui', "c'est bon", 'je confirme', 'signer', 'je valide',
  "comme d'habitude", 'rien de spécial', 'aucune idée', 'on verra', 'suivant', 'go', 'terminer', 'je veux juste que ça marche', 'ce que le site demande',
  'la même chose que tout à l\'heure', 'accepter', 'allez'];
// A genre and nothing else : no amount, no recipient.
export const GENRE = { pay_someone: 'payer quelqu\'un', buy_or_swap: 'échanger', send_to_my_account: 'envoyer vers mon compte', connect_or_accept_offer: 'me connecter', asked_by_someone: 'on m\'a demandé de le faire' };

const RK = { ok: 0, unknown: 0.5, warn: 1, critical: 2 };
const run = makeEvaluatePlus(D);
const understand = async (text) => interpret(await keywordClassify(text), text);
const U = new Map();
const und = async (t) => { if (!U.has(t)) U.set(t, await understand(t)); return U.get(t); };
const screen = (v) => { const l = benchLevel(v); return l === 'critical' ? 'rouge' : (v && v.level === 'unknown') || l === 'unknown' ? 'non_verifie' : l === 'warn' ? 'orange' : 'vert'; };
const codesOf = (v) => new Set([...((v && v.codes) || []), ...(((v && v.plus && v.plus.signals) || []).map((s) => s.code))]);
const canon = (k) => { if (typeof k !== 'string') return null; const x = k.trim().toLowerCase().replace(/[-\s]+/g, '_'); return KINDS.includes(x) ? x : null; };

async function evalCase(c, base, extra, facts) {
  const { body, local } = productInput(c);
  const b = { ...body, ...(extra.body || {}) };
  const live = facts ? liveLike(c, b, local) : null;
  const v = await atCaseTime(c, () => run(b, local, { live, classifier: false, ...(extra.opts || {}) }));
  return { v, level: benchLevel(v), screen: screen(v) };
}
// what the extension sends for a text, without a model (gatekeeper.js judgeWithIntent) : the kind when understood, the text always
function textBodies(u, text) {
  const out = [];
  const t = text ? { intent_text: text } : {};
  out.push({ body: { ...t, ...(u.clear && ENGINE_CHOICE[u.kind] ? { intent: ENGINE_CHOICE[u.kind] } : {}) } });
  if (u.facts && u.facts.receive && u.kind !== 'asked_by_someone') out.push({ body: { ...t, intent: 'receive' } });
  return out;
}
async function textRoute(c, text, facts) {
  const u = await und(text); let worst = null, best = null;
  for (const x of textBodies(u, text)) { const r = await evalCase(c, null, x, facts); if (!worst || RK[r.level] < RK[worst.level]) worst = r; if (!best || RK[r.level] > RK[best.level]) best = r; }
  return { u, raw: worst, strict: best }; // raw : the weakest engine answer (invariant) ; strict : what stricter() would keep among the calls
}
const stricterOf = (a, b) => (RK[b.level] >= RK[a.level] ? b : a);
// screen after the rule. `mode` : 'rule' = every non-red screen ; 'gardien' = only when funds leave or a right is granted (floor effects).
function afterRule(floor, r, clear, mode) {
  const kept = stricterOf(floor, r); // never below the answer without intent
  if (clear || kept.screen === 'rouge') return kept.screen;
  const eff = (floor.v && floor.v.effects) || {};
  if (mode === 'gardien' && !(eff.grants_right || eff.funds_out)) return kept.screen;
  return 'non_verifie';
}

const newStat = () => ({ n: 0, mal: 0, ben: 0, ratees: 0, fa: 0, nv: 0, nv_mal: 0, nv_ben: 0, orange_ben: 0, vert_ben: 0, vert_mal: 0 });
function add(s, c, scr, w = 1) {
  s.n += w; if (scr === 'non_verifie') s.nv += w;
  if (c.label === 'malveillant') { s.mal += w; if (scr !== 'rouge') s.ratees += w; if (scr === 'non_verifie') s.nv_mal += w; if (scr === 'vert') s.vert_mal += w; }
  else if (c.label === 'benin') { s.ben += w; if (scr === 'rouge') s.fa += w; if (scr === 'non_verifie') s.nv_ben += w; if (scr === 'orange') s.orange_ben += w; if (scr === 'vert') s.vert_ben += w; }
}
const lost = (a, x) => { const cx = codesOf(x.v); const l = [...codesOf(a.v)].filter((k) => !cx.has(k)).sort(); const p = (x.v && x.v.plus) || {}; if (p.relaxedByFacts) l.push('(relaxedByFacts)'); for (const w of p.loweredBy || []) l.push('(lower:' + w.by + ')'); return l.length ? l.join('+') : '(aucun drapeau perdu)'; };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const num = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? Number(a.slice(n.length + 3)) : d; };
  let files = args.filter((a) => !a.startsWith('--'));
  if (!files.length) files = [join(ROOT, 'blind_adem', 'v2', 'V2_DEV.jsonl'), ...readdirSync(join(ROOT, 'redteam')).filter((f) => /^jury_.*\.jsonl$/.test(f)).sort().map((f) => join(ROOT, 'redteam', f))];
  const limit = num('limit', Infinity), nEx = num('examples', 12), noFacts = !args.includes('--no-nofacts');
  const partArg = (args.find((x) => x.startsWith('--part=')) || '').slice(7); const part = /^\d+\/\d+$/.test(partArg) ? partArg.split('/').map(Number) : null;
  const T0 = Date.now();
  await evalCase({ request: { method: 'eth_sendTransaction', params: [{ from: '0x' + '1'.repeat(40), to: '0x' + '2'.repeat(40), value: '0x1', data: '0x' }] }, context: { chainId: 1 }, intent: {} }, null, {}, true); // warm-up

  const S = {}; const st = (k) => (S[k] ??= newStat());
  const perFile = {};
  const inv = { checked: 0, cases: 0, violations: [], byFlag: {}, byVariant: {}, casesHit: new Set() };
  const cost = { ben: 0, a: {}, rule: {}, gardien: {}, d: {}, moved_rule: 0, moved_gardien: 0, ben_funds: 0, rule_funds: {}, perPhrase: {} };
  const parser = { n: 0, kind: { n: 0, ok: 0, none: 0, wrong: 0, raw_ok: 0, confusion: {}, byFile: {}, byLang: {}, byTruth: {} }, amount: { n: 0, ok: 0, none: 0, wrong: 0, inText: 0, inText_ok: 0 }, token: { n: 0, ok: 0, none: 0, wrong: 0, inText: 0, inText_ok: 0 }, all3: { n: 0, ok: 0 }, ben: { n: 0, clear: 0, kind_ok: 0 } };
  const follow = { n: 0, clear: 0, fields: 0, n_ben: 0, clear_ben: 0 };
  const vagueRead = {}; for (const t of VAGUE) { const u = await und(t); vagueRead[t || '(vide)'] = u.clear ? u.kind : 'non compris'; }
  const violate = (rec) => { inv.violations.push(rec); inv.byFlag[rec.flag] = (inv.byFlag[rec.flag] || 0) + 1; const k = rec.variant + '/' + rec.route + '/' + rec.facts; inv.byVariant[k] = (inv.byVariant[k] || 0) + 1; inv.casesHit.add(rec.id); };
  let total = 0, unlabeled = 0;
  // What the WRITTEN intent adds on top of the answer without intent : scams not red without intent -> red / "not verified" with the variant ;
  // honest operations that pass without intent (green or orange) -> red / "not verified" with the variant. Same case base per line.
  const G = {}; const gain = (k, c, a, scr, w = 1) => {
    const g = (G[k] ??= { arnaques_non_arretees_sans_intention: 0, arretees: 0, non_verifiees: 0, toujours_vertes: 0, honnetes_qui_passent_sans_intention: 0, basculent_en_alerte: 0, basculent_en_non_verifie: 0 });
    if (c.label === 'malveillant' && a.screen !== 'rouge') { g.arnaques_non_arretees_sans_intention += w; if (scr === 'rouge') g.arretees += w; else if (scr === 'non_verifie') g.non_verifiees += w; else if (scr === 'vert') g.toujours_vertes += w; }
    if (c.label === 'benin' && (a.screen === 'vert' || a.screen === 'orange')) { g.honnetes_qui_passent_sans_intention += w; if (scr === 'rouge') g.basculent_en_alerte += w; else if (scr === 'non_verifie') g.basculent_en_non_verifie += w; }
  };

  for (const file of files) {
    const name = file.split(/[\\/]/).pop(); let cases = readCases(file); if (cases.length > limit) cases = cases.slice(0, limit);
    if (part) cases = cases.filter((_, i) => i % part[1] === part[0]);
    const pf = (perFile[name] = { n: 0, a: newStat(), b_rule: newStat(), c: newStat(), d: newStat() });
    for (const { c, id } of cases) {
      total++; if (!c || !c.request || typeof c.request !== 'object') continue;
      if (c.label !== 'malveillant' && c.label !== 'benin') unlabeled++;
      pf.n++; inv.cases++;
      const I = c.intent && typeof c.intent === 'object' ? c.intent : {};
      const at = Number.isFinite(I.declaredAt) ? { declaredAt: I.declaredAt } : {};
      const check = (a, x, variant, route, facts, what) => { inv.checked++; if (RK[x.level] < RK[a.level]) violate({ id, file: name, label: c.label, variant, route, facts, what, sans: a.level, avec: x.level, flag: lost(a, x) }); };

      for (const facts of noFacts ? [true, false] : [true]) {
        const F = facts ? 'faits' : 'sans_faits';
        const a = await evalCase(c, null, {}, facts);
        // ---- b : vague sentences
        const bT = [], bO = [];
        for (const text of VAGUE) {
          const t = await textRoute(c, text, facts); check(a, t.raw, 'b', 'texte', F, text || '(vide)'); bT.push(t);
          const o = await evalCase(c, null, { opts: { intent: { ...(text ? { freeText: text } : {}), ...at } } }, facts); check(a, o, 'b', 'objet', F, text || '(vide)'); bO.push(o);
        }
        // ---- c : genre only, the 5 kinds
        const cT = {}, cO = {};
        for (const k of KINDS) {
          cT[k] = await textRoute(c, GENRE[k], facts); check(a, cT[k].raw, 'c', 'texte', F, k);
          cO[k] = await evalCase(c, null, { opts: { intent: { kind: k, ...at } } }, facts); check(a, cO[k], 'c', 'objet', F, k);
        }
        if (!facts) continue; // scores are given on the shipped configuration only
        // ---- d : detailed
        const dO = await evalCase(c, null, { opts: { intent: I } }, true);
        const ft = typeof I.freeText === 'string' ? I.freeText : '';
        const dT = await textRoute(c, ft, true);
        const own = canon(I.kind);

        add(st('a'), c, a.screen); add(pf.a, c, a.screen);
        const w = 1 / VAGUE.length;
        VAGUE.forEach((text, i) => {
          const t = bT[i];
          add(st('b_moteur_texte'), c, t.raw.screen, w); add(st('b_moteur_objet'), c, bO[i].screen, w);
          const rs = afterRule(a, t.strict, t.u.clear, 'rule'), gs = afterRule(a, t.strict, t.u.clear, 'gardien'), ideal = afterRule(a, a, false, 'rule');
          gain('b_vague_regle', c, a, rs, w); gain('b_vague_gardien', c, a, gs, w); gain('b_vague_moteur_seul', c, a, stricterOf(a, t.strict).screen, w); gain('b_vague_regle_ideale', c, a, ideal, w);
          add(st('b_regle'), c, rs, w); add(st('b_gardien'), c, gs, w); add(st('b_regle_ideale'), c, ideal, w); add(pf.b_rule, c, rs, w);
          if (c.label === 'benin') { const p = (cost.perPhrase[text || '(vide)'] ??= { rouge: 0, non_verifie: 0, orange: 0, vert: 0 }); p[rs]++; }
        });
        if (own) { gain('c_genre_objet', c, a, stricterOf(a, cO[own]).screen); gain('c_genre_texte_sans_modele', c, a, stricterOf(a, cT[own].strict).screen); }
        gain('d_detail_objet', c, a, stricterOf(a, dO).screen); gain('d_detail_objet_brut', c, a, dO.screen); gain('d_texte_sans_modele_moteur', c, a, stricterOf(a, dT.strict).screen); gain('d_texte_sans_modele_regle', c, a, afterRule(a, dT.strict, dT.u.clear, 'rule'));
        if (own) { add(st('c_objet'), c, cO[own].screen); add(st('c_texte'), c, stricterOf(a, cT[own].strict).screen); add(pf.c, c, cO[own].screen); add(st('a_sur_cas_avec_genre'), c, a.screen); }
        add(st('d_objet'), c, dO.screen); add(pf.d, c, dO.screen);
        add(st('d_texte_moteur'), c, dT.raw.screen); add(st('d_texte_regle'), c, afterRule(a, dT.strict, dT.u.clear, 'rule'));

        // ---- 3. cost for the honest user who stays vague after the follow-up
        if (c.label === 'benin') {
          cost.ben++;
          const eff = (a.v && a.v.effects) || {}; const funds = !!(eff.grants_right || eff.funds_out); if (funds) cost.ben_funds++;
          const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };
          const rs = afterRule(a, a, false, 'rule'), gs = afterRule(a, a, false, 'gardien');
          inc(cost.a, a.screen); inc(cost.rule, rs); inc(cost.gardien, gs); inc(cost.d, dO.screen);
          if (funds) inc(cost.rule_funds, rs);
          if (rs !== a.screen) cost.moved_rule++; if (gs !== a.screen) cost.moved_gardien++;
        }
        // ---- 4. model-free parser on the free text of the case
        if (ft.trim()) {
          parser.n++;
          const u = dT.u, f = extractFields(ft), raw = await keywordProvider.parseIntent(ft);
          if (own) {
            const K = parser.kind; K.n++;
            const res = !u.clear ? 'none' : u.kind === own ? 'ok' : 'wrong'; K[res]++;
            if (raw.kind === own) K.raw_ok++;
            const cf = (K.confusion[own] ??= {}); cf[u.clear ? u.kind : 'non compris'] = (cf[u.clear ? u.kind : 'non compris'] || 0) + 1;
            for (const [m, key] of [[K.byFile, name], [K.byLang, c.lang || '?'], [K.byTruth, own]]) { const e = (m[key] ??= { n: 0, ok: 0, none: 0, wrong: 0 }); e.n++; e[res]++; }
            if (c.label === 'benin') { parser.ben.n++; if (u.clear) parser.ben.clear++; if (res === 'ok') parser.ben.kind_ok++; }
          }
          const amt = typeof I.amount === 'string' || typeof I.amount === 'number' ? String(I.amount).trim().replace(',', '.') : null;
          const amtOk = amt !== null && /^\d+(\.\d+)?$/.test(amt);
          if (amtOk) { const A = parser.amount; A.n++; const got = f.amount !== undefined ? Number(f.amount) : null; const r = got === null ? 'none' : got === Number(amt) ? 'ok' : 'wrong'; A[r]++;
            const digits = String(I.amount).trim(); if (ft.includes(digits) || ft.includes(digits.replace('.', ','))) { A.inText++; if (r === 'ok') A.inText_ok++; } }
          const tok = typeof I.token === 'string' && I.token.trim() ? I.token.trim().toUpperCase() : null;
          if (tok) { const Tk = parser.token; Tk.n++; const r = !f.symbol ? 'none' : f.symbol === tok ? 'ok' : 'wrong'; Tk[r]++; if (ft.toUpperCase().includes(tok)) { Tk.inText++; if (r === 'ok') Tk.inText_ok++; } }
          if (own && amtOk && tok) { parser.all3.n++; if (u.clear && u.kind === own && f.amount !== undefined && Number(f.amount) === Number(amt) && f.symbol === tok) parser.all3.ok++; }
        }
        // ---- the follow-up "Combien, et à qui ?" answered exactly : "<amount> <token> à <name>" (fields of the case, a user sentence)
        if ((typeof I.amount === 'string' || typeof I.amount === 'number') && typeof I.token === 'string' && typeof I.counterpartyLabel === 'string' && I.counterpartyLabel.trim()) {
          const ans = `${I.amount} ${I.token} à ${I.counterpartyLabel}`; const u = await understand(ans);
          follow.n++; if (u.clear) follow.clear++; if (u.amount && u.symbol) follow.fields++;
          if (c.label === 'benin') { follow.n_ben++; if (u.clear) follow.clear_ben++; }
        }
      }
    }
  }

  const round = (o) => { for (const k of Object.keys(o)) if (typeof o[k] === 'number') o[k] = Math.round(o[k] * 10) / 10; return o; };
  for (const s of Object.values(S)) round(s);
  for (const f of Object.values(perFile)) for (const k of ['a', 'b_rule', 'c', 'd']) round(f[k]);
  const out = { fichiers: files.map((f) => f.split(/[\\/]/).pop()), cas: total, sans_etiquette_binaire: unlabeled, phrases_vagues: VAGUE.length, lecture_des_phrases_vagues: vagueRead, lecture_des_genres: Object.fromEntries(await Promise.all(KINDS.map(async (k) => [GENRE[k], ((u) => (u.clear ? u.kind : 'non compris'))(await und(GENRE[k]))]))),
    apport_de_l_intention: Object.fromEntries(Object.entries(G).map(([k, g]) => [k, round(g)])), variantes: S, par_fichier: perFile,
    invariant: { cas: inv.cases, comparaisons: inv.checked, contre_exemples: inv.violations.length, cas_touches: inv.casesHit.size, par_drapeau: inv.byFlag, par_variante: inv.byVariant, exemples: inv.violations.slice(0, nEx) },
    cout_honnete: cost, parseur: parser, relance: follow, duree_s: Math.round((Date.now() - T0) / 1000) };
  if (args.includes('--json')) { console.log(JSON.stringify(out, null, 1)); }
  else {
    const p = (a, b) => (b ? (100 * a / b).toFixed(1) + ' %' : '-');
    console.log(`${total} cas, ${VAGUE.length} phrases vagues, ${out.duree_s} s`);
    console.log('\nvariante | arnaques | ratées | honnêtes | fausses alertes | « pas pu vérifier » (tous / arnaques / honnêtes) | honnêtes en vert');
    for (const [k, s] of Object.entries(S)) console.log(`${k} | ${s.mal} | ${s.ratees} | ${s.ben} | ${s.fa} | ${s.nv} (${p(s.nv, s.n)}) / ${s.nv_mal} / ${s.nv_ben} | ${s.vert_ben}`);
    console.log('\napport de l intention ecrite :'); for (const [k, g] of Object.entries(G)) console.log(k, JSON.stringify(g));
    console.log(`\ninvariant : ${inv.violations.length} contre-exemples sur ${inv.checked} comparaisons (${inv.casesHit.size} cas touchés sur ${inv.cases})`);
    console.log(JSON.stringify(inv.byFlag)); console.log(JSON.stringify(inv.byVariant));
    for (const v of inv.violations.slice(0, nEx)) console.log(JSON.stringify(v));
    console.log('\ncoût honnête :', JSON.stringify(cost));
    console.log('\nparseur :', JSON.stringify(parser));
    console.log('\nrelance :', JSON.stringify(follow));
    console.log('\nlecture des phrases vagues :', JSON.stringify(vagueRead));
  }
}

// Export de scenarios pour l'interface de scenarios (Adem) : regenere scenarios.json, index.json, gallery_120.json, conversations.json
// et EXPORT_SHA256.txt A L'OCTET PRES (aucune date, aucun aleatoire non seme, tri stable, Date.now() fige pendant l'evaluation du moteur).
// Usage : node --no-warnings scenarios_export/build_export.mjs [--check]     (--check : regenere en memoire et compare aux fichiers ecrits)
// Node >= 22 (compare.ts est lu par type stripping), aucun paquet, aucun reseau, un seul processus.
// SOURCES NON SCELLEES UNIQUEMENT : attacks/DEV.jsonl (385), attacks_public/PUBLIC.jsonl (144), blind_adem/v2/V2_DEV.jsonl (5 927).
// attacks/cases.jsonl = DEV + TEST (589 = 385 + 204) : on ne le lit pas, DEV.jsonl en est la partie non scellee.
// JAMAIS lus : attacks/TEST.jsonl, blind_adem/v2/V2_TEST.jsonl (garde explicite ci-dessous).
// Le moteur n'est JAMAIS modifie : lecture seule, import de server/server.mjs (evaluate) avec un contexte local vide.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { titre as makeTitle, intentFr } from './titres_fr.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const CHECK = process.argv.includes('--check');
const SEED = 20261011;                 // graine unique (galerie)
const FROZEN_NOW_MS = 1791720000000;   // Date.now() fige pendant l'evaluation du moteur (reproductibilite des verdicts datés)
const GALLERY_N = 120, GALLERY_AVAX = 48; // 40 %

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// ------------------------------------------------------------------ garde : jamais de fichier scelle
function guard(p) {
  const b = basename(p);
  if (/TEST/i.test(b) || /cases\.jsonl$/i.test(b)) throw new Error('Refus : fichier scelle ou melange DEV+TEST (' + b + ')');
  return p;
}
function readJsonl(p) {
  const raw = readFileSync(guard(p), 'utf8');
  const rows = raw.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { rows, sha: sha256(raw) };
}

// ------------------------------------------------------------------ version du moteur (hash des sources lues)
function engineVersion() {
  const files = [];
  const srcDir = join(ROOT, 'engine', 'src');
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.mjs')).sort()) files.push(['engine/src/' + f, join(srcDir, f)]);
  files.push(['engine/vendor/compare.ts', join(ROOT, 'engine', 'vendor', 'compare.ts')]);
  files.push(['run/policy.mjs', join(ROOT, 'run', 'policy.mjs')]);
  files.push(['server/server.mjs', join(ROOT, 'server', 'server.mjs')]);
  files.push(['U_textes_utilisateur.json', join(ROOT, '..', 'U_textes_utilisateur.json')]);
  const per = {};
  for (const [name, p] of files) per[name] = sha256(readFileSync(p));
  const version = sha256(Object.entries(per).map(([k, v]) => k + ':' + v).join('\n'));
  return { version, per };
}

// ------------------------------------------------------------------ outils de normalisation
const CHAIN_NAMES = { 1: 'Ethereum', 10: 'Optimism', 137: 'Polygon', 8453: 'Base', 42161: 'Arbitrum', 43113: 'Avalanche Fuji (test)', 43114: 'Avalanche C-Chain', 777001: 'Réseau neuf fictif' };
const hexNum = (h) => { try { const n = typeof h === 'number' ? h : (/^0x/i.test(String(h)) ? Number(BigInt(h)) : Number(h)); return Number.isFinite(n) ? n : null; } catch { return null; } };
function chainOf(c) {
  const ctxId = c.context && c.context.chainId !== undefined && c.context.chainId !== null ? hexNum(c.context.chainId) : null;
  const p0 = c.request && Array.isArray(c.request.params) ? c.request.params[0] : null;
  let reqId = p0 && typeof p0 === 'object' && !Array.isArray(p0) && p0.chainId !== undefined ? hexNum(p0.chainId) : null;
  if (reqId === null && typeof p0 === 'string' && c.request.params[1]) {
    try { const td = JSON.parse(c.request.params[1]); if (td && td.domain && td.domain.chainId !== undefined) reqId = hexNum(td.domain.chainId); } catch { /* ignore */ }
  }
  const id = ctxId !== null ? ctxId : reqId;
  return { id, requete: reqId };
}
function originOf(ctx) {
  const o = ctx && ctx.origin;
  if (o && typeof o === 'object') return { url: o.url || null, genre: o.kind || null };
  return { url: typeof o === 'string' ? o : null, genre: ctx && ctx.origin_kind ? ctx.origin_kind : null };
}
function hostOfOrigin(url) {
  if (!url || typeof url !== 'string') return '';
  if (/^https?:\/\//i.test(url)) { try { return new URL(url).hostname; } catch { return ''; } }
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url) && !/^wallet-interface\./i.test(url)) return url; // nom de domaine nu
  return ''; // wallet://..., wallet_ui, core-wallet://send... : l'origine est le portefeuille lui-meme
}
const victimOf = (ctx) => (ctx && ctx.victim && typeof ctx.victim === 'object' ? ctx.victim.address : ctx && ctx.victim) || undefined;
const LABEL_FR = { malveillant: 'malveillant', benin: 'bénin', ambigu: 'ambigu', fraude_conforme: 'fraude conforme' };
const SEV_RANK = { ok: 0, warn: 1, critical: 2 };

function shortReason(r) {
  if (!r) return '';
  const s = String(r).replace(/\s+/g, ' ').trim();
  if (s.length <= 320) return s;
  const cut = s.slice(0, 320);
  const i = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return (i > 120 ? cut.slice(0, i + 1) : cut.replace(/\s+\S*$/, '')) + ' […]';
}

function intentionOf(c) {
  const it = c.intent;
  const bad = c.label === 'malveillant' || c.label === 'fraude_conforme';
  const verbe = bad ? 'Tu crois' : 'Tu veux';
  const kindFr = it && it.kind ? intentFr(it.kind) : null;
  const txt = it && typeof it.freeText === 'string' && it.freeText.trim() ? it.freeText.trim() : null;
  let phrase;
  if (kindFr && txt) phrase = `${verbe} ${kindFr} : « ${txt} »`;
  else if (kindFr) phrase = `${verbe} ${kindFr}`;
  else if (txt) phrase = `${verbe} : « ${txt} »`;
  else phrase = 'Aucune intention déclarée : le moteur ne voit que la requête';
  return {
    phrase,
    type: it && it.kind ? it.kind : null,
    texte_declare: txt,
    message_recu: it && typeof it.pastedMessage === 'string' ? it.pastedMessage : null,
    demande_par: it && it.askedBy ? it.askedBy : null,
    jeton: it && it.token ? it.token : null,
    montant: it && it.amount ? String(it.amount) : null,
  };
}

// ------------------------------------------------------------------ construction d'un scenario normalise
function normalize(c, source, convIndex) {
  const ch = chainOf(c);
  const og = originOf(c.context);
  const host = hostOfOrigin(og.url);
  const t = makeTitle({ family: c.family, subfamily: c.subfamily, label: c.label, host, token: c.intent && c.intent.token });
  const approx = c.approximation && typeof c.approximation === 'object' ? c.approximation : null;
  const conv = typeof c.scenario === 'string' && convIndex[c.scenario] ? { id: c.scenario, famille: convIndex[c.scenario].cas_family, titre: convIndex[c.scenario].title_fr } : null;
  const executable = c.executable === false ? false : true;
  const method = c.request && c.request.method;
  const tags = new Set([
    'source:' + source, 'famille:' + c.family, 'sous_famille:' + c.subfamily, 'etiquette:' + c.label, 'niveau_attendu:' + c.expected_severity,
    'methode:' + method, 'langue:' + c.lang, 'synthetique',
  ]);
  if (ch.id !== null) tags.add('chaine:' + ch.id); else tags.add('chaine:aucune');
  if (ch.id === 43114 || ch.id === 43113) tags.add('avalanche');
  if (ch.id === 43113) tags.add('fuji');
  if (c.hard) tags.add('difficile');
  if (c.hard && c.label === 'benin') tags.add('benin_difficile');
  if (approx) tags.add('approximation');
  if (approx && approx.typed_data_or_selector_from_memory) tags.add('de_memoire');
  if (conv) tags.add('conversation:' + conv.id);
  if (c.persona || (c.context && c.context.victim && c.context.victim.persona)) tags.add('persona:' + (c.persona || c.context.victim.persona));
  if (og.genre) tags.add('origine:' + og.genre);
  if (!executable) tags.add('non_rejouable');
  if (c.intent && c.intent.pastedMessage) tags.add('message_colle');
  if (c.domaine) tags.add('domaine:' + c.domaine);
  for (const s of (c.required_signals || [])) tags.add('signal:' + s);
  const ref = [];
  if (c.fiche) ref.push('fiche ' + c.fiche);
  if (Array.isArray(c.source)) ref.push(...c.source);
  return {
    id: c.id,
    source,
    famille: c.family,
    sous_famille: c.subfamily,
    titre: t.titre,
    description: shortReason(c.reason),
    intention: intentionOf(c),
    payload: { method, params: c.request.params },
    contexte: c.context === undefined ? null : c.context,
    etiquette: LABEL_FR[c.label] || c.label,
    etiquette_code: c.label,
    niveau_attendu: c.expected_severity,
    niveau_ideal: c.ideal_severity || c.expected_severity,
    chaine: { id: ch.id, nom: ch.id === null ? 'aucune' : (CHAIN_NAMES[ch.id] || 'réseau ' + ch.id), avalanche: ch.id === 43114 || ch.id === 43113, id_dans_la_requete: ch.requete },
    origine: { url: og.url, genre: og.genre },
    synthetique: true,
    approximation: approx,
    difficile: !!c.hard,
    langue: c.lang || null,
    signaux_attendus: c.required_signals || [],
    conversation: conv,
    references: ref,
    rejouable: executable && typeof method === 'string' && Array.isArray(c.request.params),
    non_rejouable_raison: c.non_executable_reason || null,
    tags: [...tags].sort(),
    _titre_par_regle: t.regle,
  };
}

// ------------------------------------------------------------------ verdict du moteur (mode sans contexte du catalogue)
async function runEngine(scenarios, cases) {
  const SRV = await import(pathToFileURL(join(ROOT, 'server', 'server.mjs')).href); // l'import ne demarre PAS le serveur (garde sur argv[1])
  const emptyLocal = () => ({ contacts: [], history: [], protected: [], knownSpenders: [] });
  const realNow = Date.now;
  Date.now = () => FROZEN_NOW_MS;
  const stats = { total: 0, ok: 0, non_verifiable: 0, exception_interne: 0, exception_levee: 0 };
  try {
    // chauffe
    SRV.evaluate({ method: 'eth_sendTransaction', params: [{ from: '0x' + '1'.repeat(40), to: '0x' + '2'.repeat(40), value: '0x1', data: '0x' }], origin: 'https://warmup.local', chainId: '0x1' }, emptyLocal());
    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i], c = cases[i];
      stats.total++;
      const og = s.origine.url;
      const origin = og ? (/^[a-z][a-z0-9+.-]*:\/\//i.test(og) ? og : 'https://' + og) : 'https://site.example';
      const body = { origin, method: s.payload.method, params: structuredClone(s.payload.params), from: victimOf(c.context), chainId: c.context && c.context.chainId !== undefined ? c.context.chainId : undefined };
      let v, thrown = null;
      try { v = SRV.evaluate(body, emptyLocal()); } catch (e) { thrown = String(e && e.message || e).slice(0, 200); }
      let m;
      if (thrown) { stats.exception_levee++; m = { statut: 'exception', raison: thrown }; }
      else if (v.indeterminate && /^analyse impossible/.test(v.why || '')) { stats.exception_interne++; m = { statut: 'exception_interne', raison: v.why }; }
      else if (v.indeterminate && !/^effets non lisibles/.test(v.why || '')) { stats.non_verifiable++; m = { statut: 'non_verifiable', raison: v.why }; }
      else { stats.ok++; m = { statut: 'ok' }; }
      if (v && !thrown) {
        const lvl = v.niveau === 'info' ? 'ok' : v.niveau;
        m.niveau = lvl;
        m.niveau_brut = v.niveau;
        m.affichage = v.level;
        m.fiche = v.fiche || null;
        m.titre_fiche = v.title || null;
        m.codes = (v.codes || []).slice(0, 12);
        if (v.indeterminate) { m.indetermine = true; if (m.statut === 'ok') m.raison_indetermine = v.why || null; }
        const exp = SEV_RANK[s.niveau_attendu];
        m.concordance = SEV_RANK[lvl] === exp ? 'egal' : SEV_RANK[lvl] > exp ? 'plus_severe' : 'moins_severe';
      }
      s.moteur = m;
    }
  } finally { Date.now = realNow; }
  return stats;
}

// ------------------------------------------------------------------ galerie : 120 scenarios choisis pour la diversite
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hashNum = (s) => parseInt(sha256(SEED + '|' + s).slice(0, 8), 16) / 0xffffffff;

function buildGallery(all) {
  const TARGET_LEVEL = { ok: 36, warn: 24, critical: 60 };
  const TARGET_LABEL = { malveillant: 58, benin: 34, fraude_conforme: 12, ambigu: 16 };
  const tallyL = { ok: 0, warn: 0, critical: 0 }, tallyB = { malveillant: 0, benin: 0, fraude_conforme: 0, ambigu: 0 };
  let hardBenin = 0;
  const chosen = [];
  const note = { familles_non_representees: [], familles_hors_perimetre: [] };
  const take = (s, why) => { chosen.push(s); tallyL[s.niveau_attendu]++; tallyB[s.etiquette_code]++; if (s.difficile && s.etiquette_code === 'benin') hardBenin++; s._rang_galerie = why; };
  const score = (s, seenSub) => {
    const dl = (TARGET_LEVEL[s.niveau_attendu] - tallyL[s.niveau_attendu]) / TARGET_LEVEL[s.niveau_attendu];
    const db = (TARGET_LABEL[s.etiquette_code] - tallyB[s.etiquette_code]) / TARGET_LABEL[s.etiquette_code];
    return 3 * dl + 2 * db + (s.difficile && s.etiquette_code === 'benin' ? 0.5 : 0) + (seenSub && seenSub.has(s.famille + '/' + s.sous_famille) ? 0 : 0.5) + (s.conversation ? 0.6 : 0) + (s.moteur && s.moteur.statut === 'ok' ? 0.4 : 0) + 0.01 * hashNum(s.source + ':' + s.id);
  };
  // ---- partie A : hors Avalanche. Une famille = un scenario, sauf impossibilite.
  const nonAvax = all.filter((s) => !s.chaine.avalanche);
  const fams = new Map();
  for (const s of nonAvax) { if (!fams.has(s.famille)) fams.set(s.famille, []); fams.get(s.famille).push(s); }
  // familles V2 : couvertes par la partie B (Avalanche)
  const v2fam = new Set(all.filter((s) => s.source === 'v2').map((s) => s.famille));
  const nonV2 = [...fams.entries()].filter(([f]) => !v2fam.has(f)).sort((a, b) => a[0].localeCompare(b[0]));
  const verifiable = (s) => s.rejouable && s.moteur && s.moteur.statut === 'ok';
  const rejouables = nonV2.filter(([, l]) => l.some(verifiable));
  note.familles_hors_perimetre = nonV2.filter(([, l]) => !l.some(verifiable)).map(([f]) => f);
  const slotsA = GALLERY_N - GALLERY_AVAX;
  let famsA = rejouables;
  if (famsA.length > slotsA) {
    // trop de familles pour 72 places : on retire celles qui ont le moins de cas (puis ordre alphabetique), et on le dit
    const byCount = [...famsA].sort((a, b) => a[1].length - b[1].length || a[0].localeCompare(b[0]));
    const drop = new Set(byCount.slice(0, famsA.length - slotsA).map(([f]) => f));
    note.familles_non_representees = [...drop].sort();
    famsA = famsA.filter(([f]) => !drop.has(f));
  }
  const order = [...famsA].sort((a, b) => hashNum('fam:' + a[0]) - hashNum('fam:' + b[0]));
  const seenSub = new Set();
  for (const [f, list] of order) {
    const cands = list.filter(verifiable).sort((a, b) => (a.id < b.id ? -1 : 1));
    let best = null, bs = -1e9;
    for (const s of cands) { const sc = score(s, seenSub); if (sc > bs) { bs = sc; best = s; } }
    take(best, 'A:' + f); seenSub.add(best.famille + '/' + best.sous_famille);
  }
  // ---- partie B : Avalanche (V2 uniquement : seules sources avec chainId 43114 / 43113). Quotas [C-Chain, Fuji] par famille.
  const QUOTA = { benign_defi: [6, 2], benign_everyday: [4, 1], fraude_conforme: [5, 1], ambigu: [4, 2], onchain: [6, 3], poison_sites_tokens: [5, 2], sig: [6, 1] };
  const avax = all.filter((s) => s.chaine.avalanche && verifiable(s));
  for (const f of Object.keys(QUOTA).sort()) {
    for (const [idx, cid] of [[0, 43114], [1, 43113]]) {
      const pool = avax.filter((s) => s.famille === f && s.chaine.id === cid).sort((a, b) => (a.id < b.id ? -1 : 1));
      for (let k = 0; k < QUOTA[f][idx]; k++) {
        let best = null, bs = -1e9;
        for (const s of pool) { if (chosen.includes(s)) continue; const sc = score(s, seenSub); if (sc > bs) { bs = sc; best = s; } }
        if (!best) throw new Error('Quota Avalanche non satisfait : ' + f + ' ' + cid);
        take(best, 'B:' + f + ':' + cid); seenSub.add(best.famille + '/' + best.sous_famille);
      }
    }
  }
  if (chosen.length !== GALLERY_N) throw new Error('galerie : ' + chosen.length + ' au lieu de ' + GALLERY_N);
  // ordre d'affichage : melange seede stable (les memes familles ne se suivent pas)
  chosen.sort((a, b) => hashNum('ord:' + a.source + a.id) - hashNum('ord:' + b.source + b.id));
  return { chosen, note, hardBenin };
}

// ------------------------------------------------------------------ programme principal
async function main() {
  const v0 = engineVersion();
  const src = {
    catalogue: readJsonl(join(ROOT, 'attacks', 'DEV.jsonl')),
    public: readJsonl(join(ROOT, 'attacks_public', 'PUBLIC.jsonl')),
    v2: readJsonl(join(ROOT, 'blind_adem', 'v2', 'V2_DEV.jsonl')),
  };
  const convRaw = readFileSync(join(ROOT, 'attacks', 'scenarios.json'), 'utf8');
  const conv = JSON.parse(convRaw);
  const convIndex = Object.fromEntries(conv.scenarios.map((s) => [s.id, s]));
  // verifications de scellement : tout enregistrement marque TEST est refuse
  for (const [name, { rows }] of Object.entries(src)) for (const r of rows) if (r.split === 'TEST') throw new Error('Cas scelle dans ' + name + ' : ' + r.id);

  const scenarios = [], cases = [];
  for (const [name, { rows }] of Object.entries(src)) for (const r of rows) { scenarios.push(normalize(r, name, convIndex)); cases.push(r); }
  // tri stable : source (catalogue, public, v2) puis ordre du fichier source (deja deterministe). Controle d'unicite des identifiants.
  const ids = new Set();
  for (const s of scenarios) { const k = s.source + ':' + s.id; if (ids.has(k)) throw new Error('id double ' + k); ids.add(k); }

  const stats = await runEngine(scenarios, cases);
  const v1 = engineVersion();
  if (v1.version !== v0.version) throw new Error('Le moteur a change pendant la mesure (' + v0.version.slice(0, 12) + ' -> ' + v1.version.slice(0, 12) + ') : relancer');

  const fallbackTitles = scenarios.filter((s) => !s._titre_par_regle).map((s) => s.source + ':' + s.id);
  for (const s of scenarios) delete s._titre_par_regle;

  // ---- galerie
  const G = buildGallery(scenarios);
  const galleryRows = G.chosen.map((s, i) => ({ galerie_rang: i + 1, galerie_motif: s._rang_galerie, ...s }));
  for (const s of scenarios) delete s._rang_galerie;
  for (const s of galleryRows) delete s._rang_galerie;

  // ---- index
  const count = (arr, f) => { const m = {}; for (const x of arr) { const k = f(x); m[k] = (m[k] || 0) + 1; } return Object.fromEntries(Object.entries(m).sort((a, b) => (a[0] < b[0] ? -1 : 1))); };
  const famTable = {};
  for (const s of scenarios) { const f = famTable[s.famille] || (famTable[s.famille] = { total: 0, par_source: {}, par_etiquette: {} }); f.total++; f.par_source[s.source] = (f.par_source[s.source] || 0) + 1; f.par_etiquette[s.etiquette_code] = (f.par_etiquette[s.etiquette_code] || 0) + 1; }
  const famSorted = Object.fromEntries(Object.entries(famTable).sort((a, b) => (a[0] < b[0] ? -1 : 1)));
  const chainKey = (s) => (s.chaine.id === null ? 'aucune' : String(s.chaine.id));
  const parChaine = {};
  for (const s of scenarios) { const k = chainKey(s); const e = parChaine[k] || (parChaine[k] = { nom: s.chaine.nom, n: 0, par_source: {} }); e.n++; e.par_source[s.source] = (e.par_source[s.source] || 0) + 1; }
  const parChaineSorted = Object.fromEntries(Object.entries(parChaine).sort((a, b) => (a[0] < b[0] ? -1 : 1)));
  const avax = scenarios.filter((s) => s.chaine.avalanche);
  const cross = {};
  for (const s of scenarios) { const k = s.etiquette_code + '|' + s.niveau_attendu; cross[k] = (cross[k] || 0) + 1; }
  const moteurLvl = count(scenarios.filter((s) => s.moteur.niveau), (s) => s.moteur.niveau);
  const conc = count(scenarios.filter((s) => s.moteur.concordance), (s) => s.moteur.concordance);
  const concParSource = {};
  for (const s of scenarios) if (s.moteur.concordance) { const e = concParSource[s.source] || (concParSource[s.source] = { egal: 0, plus_severe: 0, moins_severe: 0 }); e[s.moteur.concordance]++; }
  const inutilisables = scenarios.filter((s) => !s.rejouable || s.moteur.statut !== 'ok').map((s) => ({ source: s.source, id: s.id, famille: s.famille, methode: s.payload.method, rejouable: s.rejouable, statut_moteur: s.moteur.statut, raison: s.non_rejouable_raison || s.moteur.raison || null }));

  const scenariosText = '[\n' + scenarios.map((s) => JSON.stringify(s)).join(',\n') + '\n]\n';
  const galleryText = '[\n' + galleryRows.map((s) => JSON.stringify(s)).join(',\n') + '\n]\n';
  const convOut = { synthetique: true, notice: conv.notice, remplacements: conv.placeholders, scenarios: conv.scenarios.map((s) => ({ id: s.id, famille: s.cas_family, titre: s.title_fr, canal: s.channel, persona: s.persona, objectif: s.transaction_goal, etapes: s.stages.map((x) => ({ tactique: x.tactic, fr: x.fr })), objections: s.objections, succes: s.success, abandon: s.abort })), messages_colles: conv.pasted_messages };
  const convText = JSON.stringify(convOut, null, 1) + '\n';

  const gal = {
    n: galleryRows.length,
    avalanche: galleryRows.filter((s) => s.chaine.avalanche).length,
    part_avalanche: Math.round(1000 * galleryRows.filter((s) => s.chaine.avalanche).length / galleryRows.length) / 1000,
    fuji: galleryRows.filter((s) => s.chaine.id === 43113).length,
    par_niveau_attendu: count(galleryRows, (s) => s.niveau_attendu),
    par_etiquette: count(galleryRows, (s) => s.etiquette_code),
    par_source: count(galleryRows, (s) => s.source),
    par_chaine: count(galleryRows, chainKey),
    benins_difficiles: galleryRows.filter((s) => s.difficile && s.etiquette_code === 'benin').length,
    familles_representees: new Set(galleryRows.map((s) => s.famille)).size,
    familles_total: Object.keys(famSorted).length,
    familles_non_representees_faute_de_place: G.note.familles_non_representees,
    familles_hors_perimetre_moteur: G.note.familles_hors_perimetre,
    avec_conversation: galleryRows.filter((s) => s.conversation).length,
    avec_approximation: galleryRows.filter((s) => s.approximation).length,
    moteur_concordance: count(galleryRows, (s) => s.moteur.concordance || 'sans_verdict'),
    regle: 'graine ' + SEED + ' ; 48 Avalanche (36 C-Chain + 12 Fuji) pris dans V2 (seule source ayant un chainId Avalanche) ; 72 autres = 1 scenario par famille couverte, glouton sur les niveaux / étiquettes / difficiles',
  };

  const index = {
    schema_version: 1,
    nom: 'Hold up - export de scénarios (cas NON scellés uniquement)',
    total: scenarios.length,
    par_source: count(scenarios, (s) => s.source),
    sources: {
      catalogue: { fichier: 'attacks/DEV.jsonl', sha256: src.catalogue.sha, n: src.catalogue.rows.length, remarque: 'attacks/cases.jsonl (589) = DEV (385) + TEST (204 scellés) : non lu' },
      public: { fichier: 'attacks_public/PUBLIC.jsonl', sha256: src.public.sha, n: src.public.rows.length },
      v2: { fichier: 'blind_adem/v2/V2_DEV.jsonl', sha256: src.v2.sha, n: src.v2.rows.length, remarque: 'V2_TEST.jsonl jamais lu' },
      conversations: { fichier: 'attacks/scenarios.json', sha256: sha256(convRaw), n: conv.scenarios.length },
    },
    par_famille: famSorted,
    n_familles: Object.keys(famSorted).length,
    n_sous_familles: new Set(scenarios.map((s) => s.famille + '/' + s.sous_famille)).size,
    par_chaine: parChaineSorted,
    avalanche: { total: avax.length, c_chain_43114: avax.filter((s) => s.chaine.id === 43114).length, fuji_43113: avax.filter((s) => s.chaine.id === 43113).length, part: Math.round(1000 * avax.length / scenarios.length) / 1000, par_source: count(avax, (s) => s.source) },
    par_niveau_attendu: count(scenarios, (s) => s.niveau_attendu),
    par_etiquette: count(scenarios, (s) => s.etiquette_code),
    etiquette_x_niveau_attendu: Object.fromEntries(Object.entries(cross).sort((a, b) => (a[0] < b[0] ? -1 : 1))),
    par_methode: count(scenarios, (s) => s.payload.method),
    difficiles: scenarios.filter((s) => s.difficile).length,
    benins_difficiles: scenarios.filter((s) => s.difficile && s.etiquette_code === 'benin').length,
    avec_approximation: scenarios.filter((s) => s.approximation).length,
    approximation_de_memoire: scenarios.filter((s) => s.approximation && s.approximation.typed_data_or_selector_from_memory).length,
    avec_contexte: scenarios.filter((s) => s.contexte !== null).length,
    avec_conversation: count(scenarios.filter((s) => s.conversation), (s) => s.conversation.id),
    par_langue: count(scenarios, (s) => s.langue || 'inconnue'),
    titres_sans_regle: fallbackTitles,
    moteur: {
      version_sha256: v1.version,
      fichiers: v1.per,
      mode: 'sans contexte du catalogue : server/server.mjs evaluate(body, contexte local vide), sans intention ni texte de page ; body = { origin, method, params, from, chainId }',
      date_figee_ms: FROZEN_NOW_MS,
      acceptation: { ...stats, remarque: 'exception_levee = le moteur a lancé une exception ; exception_interne = exception attrapée par le moteur (verdict F25 « analyse impossible ») ; non_verifiable = méthode ou forme hors périmètre, refusée proprement' },
      niveau_moteur: moteurLvl,
      concordance_avec_niveau_attendu: conc,
      concordance_par_source: concParSource,
    },
    inutilisables,
    galerie: gal,
  };
  const indexText = JSON.stringify(index, null, 1) + '\n';
  const sums = {
    'scenarios.json': sha256(scenariosText), 'gallery_120.json': sha256(galleryText), 'conversations.json': sha256(convText), 'index.json': sha256(indexText),
  };
  // le hash de scenarios / galerie est reporte dans index.json (second passage : l'index change donc son propre hash, qui est dans EXPORT_SHA256.txt)
  index.sha256 = { 'scenarios.json': sums['scenarios.json'], 'gallery_120.json': sums['gallery_120.json'], 'conversations.json': sums['conversations.json'] };
  const indexText2 = JSON.stringify(index, null, 1) + '\n';
  sums['index.json'] = sha256(indexText2);
  const sumsText = Object.entries(sums).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => v + '  ' + k).join('\n') + '\n' +
    'moteur_version_sha256  ' + v1.version + '\n';

  const outputs = { 'scenarios.json': scenariosText, 'gallery_120.json': galleryText, 'conversations.json': convText, 'index.json': indexText2, 'EXPORT_SHA256.txt': sumsText };
  if (CHECK) {
    let bad = 0;
    for (const [f, t] of Object.entries(outputs)) { const cur = readFileSync(join(HERE, f), 'utf8'); if (cur !== t) { bad++; console.log('DIFFERENT :', f); } else console.log('identique :', f); }
    process.exit(bad ? 1 : 0);
  }
  mkdirSync(HERE, { recursive: true });
  for (const [f, t] of Object.entries(outputs)) writeFileSync(join(HERE, f), t);
  console.log(JSON.stringify({ total: scenarios.length, par_source: index.par_source, familles: index.n_familles, avalanche: index.avalanche, niveau: index.par_niveau_attendu, etiquette: index.par_etiquette, acceptation: stats, concordance: conc, galerie: { n: gal.n, avalanche: gal.avalanche, niveau: gal.par_niveau_attendu, etiquette: gal.par_etiquette, familles: gal.familles_representees + '/' + gal.familles_total, non_representees: gal.familles_non_representees_faute_de_place, hors_perimetre: gal.familles_hors_perimetre_moteur, benins_difficiles: gal.benins_difficiles }, titres_sans_regle: fallbackTitles.length, moteur: v1.version.slice(0, 16), sha256: sums }, null, 1));
}
await main();

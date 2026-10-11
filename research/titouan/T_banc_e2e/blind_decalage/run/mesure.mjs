// Mesure du jeu aveugle « decalage » : 3 bras, par famille. Aucun fichier de cas n'est lu ici : les cas arrivent en paramètre.
//   (a) code seul      : phrase libre (intent.freeText) -> mots-clés du produit + repli -> moteur + comparateur (chaîne de pipeline/grille/mesure_code.mjs)
//   (b) Clef puis code : Clef-flash classe la phrase (type + 4 questions oui/non), le code extrait montant, jeton, adresse, puis le comparateur décide
//   (c) sans intention : plancher = moteur + politique + détecteurs, aucune intention (le niveau sous lequel aucun bras ne doit descendre)
// L'intention détaillée du cas (kind, token, amount...) n'est JAMAIS donnée aux bras : seule la phrase l'est.
// Niveau d'un cas = ok | warn | critical. « Signalé » = warn ou critical. « Rouge » = critical.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..'); // T_banc_e2e
const L = await import(pathToFileURL(join(HERE, 'chaine', 'lib.mjs')).href);
const CC = await import(pathToFileURL(join(ROOT, 'detectors_adem', 'clef_client.mjs')).href);
export const { wilson, RANK } = L;

export const PHRASE = 'aucun réglage après ouverture; chiffres publiés tels quels';
export const MODEL = 'clef-flash';
// Critères du verdict, publiés AVANT l'ouverture (modifiables seulement avant le « go » : le hash du lanceur est dans le journal).
export const CRITERES = { rappel_min: 0.80, fausse_alerte_rouge_max: 0.10 };
export const FAMILLES = ['swap_droit_illimite', 'jeton_different', 'destinataire_tiers', 'airdrop_sortie_ou_droit', 'login_signe_droit', 'montant_plus_grand', 'chaine_domaine_different', 'seaport_prix_quasi_nul'];

const pct = (x) => (100 * x).toFixed(1) + ' %';
export const fmt = (k, n) => { if (!n) return 'n/a'; const [lo, hi] = wilson(k, n); return `${k}/${n} = ${pct(k / n)} [${pct(lo)} ; ${pct(hi)}]`; };

export function validerCas(b) {
  const ok = b && typeof b.id === 'string' && (b.label === 'malicious' || b.label === 'benign') && b.request && b.request.method && b.context && typeof b.family === 'string';
  if (!ok) throw new Error('cas mal formé : ' + (b && b.id));
}
// cas aveugle -> cas de la chaîne de la grille (seule la phrase libre sert d'intention)
export const toInternal = (b) => ({ id: b.id, family: b.family, subfamily: b.subfamily, truth: b.label, why: b.why, text: String((b.intent && b.intent.freeText) || ''), lang: b.lang, request: b.request, context: b.context });

const lvl = (x) => (x === 'ok' || x === 'warn' || x === 'critical' ? x : null);

// ------------------------------------------------------------------ appels Clef : cache par hash, concurrence 3, arrêt net sur quota
export function creerClef({ cacheDir, askImpl = null, concurrence = 3 }) {
  mkdirSync(cacheDir, { recursive: true });
  const st = { appels_reels: 0, cache: 0, erreurs: 0, quota: false };
  const brut = askImpl || ((req) => L.withCloudflare(() => CC.askClef(req, { model: MODEL, timeoutMs: 12000, env: process.env })));
  const ask = async (req) => {
    const key = createHash('sha256').update(MODEL + JSON.stringify(req)).digest('hex'), f = join(cacheDir, key + '.json');
    if (existsSync(f)) { st.cache++; return JSON.parse(readFileSync(f, 'utf8')); }
    if (st.quota) return { ok: false, error: 'quota atteint' };
    let r;
    for (let k = 0; k < 2; k++) {
      r = await brut(req);
      st.appels_reels++;
      if (r && r.ok) break;
      if (r && (r.status === 429 || /quota|rate.?limit|too many/i.test(r.error || ''))) { st.quota = true; return r; }
      await new Promise((res) => setTimeout(res, 800));
    }
    if (r && r.ok) writeFileSync(f, JSON.stringify({ ok: true, answers: r.answers, usage: r.usage || null, model: r.model }));
    else st.erreurs++;
    return r || { ok: false, error: 'pas de réponse' };
  };
  const pool = async (items, fn) => { let i = 0; await Promise.all(Array.from({ length: concurrence }, async () => { while (i < items.length && !st.quota) { const k = i++; await fn(items[k], k); } })); };
  return { ask, pool, st };
}

// ------------------------------------------------------------------ mesure
export async function mesurer(cas, { bras = ['a', 'b', 'c'], clef = null } = {}) {
  const ics = cas.map(toInternal);
  const rows = cas.map((b, i) => ({ id: b.id, family: b.family, sub: b.subfamily, label: b.label, twin_of: b.twin_of ?? null, text: ics[i].text, unsupported: null, erreurs: [], a: null, b: null, c: null }));
  // préparation (une fois par cas) et plancher (c)
  const preps = [];
  for (let i = 0; i < ics.length; i++) {
    let prep = null;
    try { prep = L.prepCase(ics[i]); } catch (e) { rows[i].erreurs.push('prep: ' + e.message); }
    preps.push(prep);
    if (prep && prep.unsupported) rows[i].unsupported = prep.unsupported;
    if (prep && !prep.unsupported) {
      try { const f = await L.A.runArm(prep, 'none', { detectors: true, premiseCap: true }); rows[i].c = { level: lvl(f.level), reasons: f.reasons }; } catch (e) { rows[i].erreurs.push('c: ' + e.message); }
    }
  }
  const mk = (d, extra = {}) => ({ level: lvl(d.level), floor: lvl(d.floor), raw: lvl(d.raw), decision: d.decision, why: d.why, kind: d.kind ?? null, ...extra });
  // (a) code seul
  if (bras.includes('a')) for (let i = 0; i < ics.length; i++) {
    if (!preps[i] || preps[i].unsupported) continue;
    try {
      const cls = await L.classifyGrille(ics[i].text, ics[i].context, { fallback: true });
      const d = await L.decideCode(ics[i], cls);
      rows[i].a = mk(d, { kind: cls.kind ?? null });
    } catch (e) { rows[i].erreurs.push('a: ' + e.message); }
  }
  // (b) Clef classe, le code compare
  const stClef = clef ? clef.st : null;
  if (bras.includes('b') && clef) {
    const reqs = ics.map((c) => L.IC.buildRequest(c.text));
    const ans = new Array(ics.length);
    await clef.pool(ics.map((_, i) => i), async (i) => { if (preps[i] && !preps[i].unsupported) ans[i] = await clef.ask(reqs[i]); });
    for (let i = 0; i < ics.length; i++) {
      if (!preps[i] || preps[i].unsupported) continue;
      try {
        if (!ans[i] || !ans[i].ok) { rows[i].b = { level: rows[i].c ? rows[i].c.level : null, floor: rows[i].c ? rows[i].c.level : null, decision: 'inverifiable', why: 'erreur Clef : ' + ((ans[i] && ans[i].error) || 'non appelé'), err: true }; continue; }
        const cls = await L.classifyGrille(ics[i].text, ics[i].context, { raw: { source: MODEL, answers: ans[i].answers }, kindRepli: false });
        const d = await L.decideCode(ics[i], cls, { actSource: 'kind' });
        rows[i].b = mk(d, { kind: cls.kind ?? null });
      } catch (e) { rows[i].erreurs.push('b: ' + e.message); }
    }
  }
  return { rows, clef: stClef };
}

// ------------------------------------------------------------------ chiffres
const sig = (l) => l === 'warn' || l === 'critical';
export function chiffres(rows, arm) {
  const M = rows.filter((r) => r.label === 'malicious'), B = rows.filter((r) => r.label === 'benign');
  const L_ = (r) => (r[arm] ? r[arm].level : null);
  const D_ = (r) => (r[arm] ? r[arm].decision : null);
  const out = {
    n_mal: M.length, n_ben: B.length,
    signales: M.filter((r) => sig(L_(r))).length, rouges: M.filter((r) => L_(r) === 'critical').length,
    fa_rouge: B.filter((r) => L_(r) === 'critical').length, fa_warn_rouge: B.filter((r) => sig(L_(r))).length,
    non_mesures: rows.filter((r) => !r[arm]).length,
  };
  if (arm !== 'c') Object.assign(out, {
    dec_ne_mal: M.filter((r) => D_(r) === 'ne_correspond_pas').length, dec_inv_mal: M.filter((r) => D_(r) === 'inverifiable').length, dec_ok_mal: M.filter((r) => D_(r) === 'correspond').length,
    dec_ne_ben: B.filter((r) => D_(r) === 'ne_correspond_pas').length, dec_inv_ben: B.filter((r) => D_(r) === 'inverifiable').length, dec_ok_ben: B.filter((r) => D_(r) === 'correspond').length,
  });
  return out;
}
const ligne = (nom, x, avecDec) => `| ${nom} | ${fmt(x.signales, x.n_mal)} | ${fmt(x.rouges, x.n_mal)} | ${fmt(x.fa_rouge, x.n_ben)} | ${fmt(x.fa_warn_rouge, x.n_ben)} |` + (avecDec ? ` ${x.dec_inv_mal}/${x.n_mal} | ${x.dec_inv_ben}/${x.n_ben} | ${x.dec_ne_mal}/${x.n_mal} | ${x.dec_ne_ben}/${x.n_ben} |` : ' | | | |');

export function monotonie(rows) {
  const viol = { a_sous_plancher: [], b_sous_plancher: [] };
  for (const r of rows) {
    if (!r.c || !r.c.level) continue;
    for (const arm of ['a', 'b']) if (r[arm] && r[arm].level && RANK[r[arm].level] < RANK[r.c.level]) viol[arm + '_sous_plancher'].push(r.id);
  }
  return viol;
}
export function echecs(rows, arm) {
  const g = (f) => rows.filter(f).map((r) => r.id);
  const L_ = (r) => (r[arm] ? r[arm].level : null);
  return {
    mal_non_signales: g((r) => r.label === 'malicious' && !sig(L_(r))),
    mal_signales_pas_rouges: g((r) => r.label === 'malicious' && L_(r) === 'warn'),
    ben_rouges: g((r) => r.label === 'benign' && L_(r) === 'critical'),
    ben_warn: g((r) => r.label === 'benign' && L_(r) === 'warn'),
  };
}
const verdictBras = (x) => {
  if (!x.n_mal) return 'sans objet';
  const r = x.signales / x.n_mal, f = x.n_ben ? x.fa_rouge / x.n_ben : 0;
  const okR = r >= CRITERES.rappel_min, okF = f <= CRITERES.fausse_alerte_rouge_max;
  return `${okR && okF ? 'CRITÈRES ATTEINTS' : 'CRITÈRES NON ATTEINTS'} (rappel ${pct(r)} ${okR ? '>=' : '<'} ${pct(CRITERES.rappel_min)} ; faux rouges ${pct(f)} ${okF ? '<=' : '>'} ${pct(CRITERES.fausse_alerte_rouge_max)})`;
};

export function construireRapport({ rows, clef, meta, bras }) {
  const arms = bras.filter((a) => rows.some((r) => r[a]));
  const nom = { a: '(a) code seul', b: '(b) Clef classe, le code compare', c: '(c) sans intention (plancher)' };
  const fams = [...new Set([...FAMILLES, ...rows.map((r) => r.family)])].filter((f) => rows.some((r) => r.family === f));
  const incomplet = Boolean(clef && (clef.quota || clef.erreurs > 0)) || rows.some((r) => r.erreurs.length) ;
  const J = { phrase: PHRASE, meta, criteres: CRITERES, complet: !incomplet, clef, global: {}, par_famille: {}, monotonie: monotonie(rows), echecs: {}, verdicts: {}, non_pris_en_charge: rows.filter((r) => r.unsupported).map((r) => ({ id: r.id, methode: r.unsupported })), erreurs: rows.filter((r) => r.erreurs.length).map((r) => ({ id: r.id, erreurs: r.erreurs })) };
  for (const a of arms) { J.global[a] = chiffres(rows, a); J.echecs[a] = echecs(rows, a); J.verdicts[a] = verdictBras(J.global[a]); }
  for (const f of fams) { J.par_famille[f] = {}; for (const a of arms) J.par_famille[f][a] = chiffres(rows.filter((r) => r.family === f), a); }
  let md = `# Résultat du jeu aveugle decalage\n\n**${PHRASE}.**\n\n`;
  md += `- Ouverture : ${meta.date}\n- Cas : ${rows.length} (${J.global[arms[0]] ? J.global[arms[0]].n_mal : '?'} malveillants, ${J.global[arms[0]] ? J.global[arms[0]].n_ben : '?'} bénins)\n- sha256 des cas : ${meta.sha256_cas}\n- sha256 du moteur : ${meta.sha256_moteur}\n- sha256 du lanceur : ${meta.sha256_lanceur}\n- git HEAD : ${meta.git_head}${meta.git_sale ? ' (arbre de travail modifié, ' + meta.git_sale + ' fichiers)' : ' (arbre propre)'}\n`;
  if (meta.essai) md += `- **MODE ESSAI (faux jeu, aucune valeur de mesure)**\n`;
  if (clef) md += `- Clef : ${clef.appels_reels} appels réels, ${clef.cache} réponses du cache, ${clef.erreurs} erreurs${clef.quota ? ', **QUOTA ATTEINT**' : ''}\n`;
  if (incomplet) md += `\n> **MESURE INCOMPLÈTE** : des erreurs ou le quota Clef ont laissé des cas sans réponse. Les lignes concernées sont comptées comme non signalées. Le verdict du bras (b) n'est pas valable. Une reprise est possible avec \`--reprise\` (le cache évite tout nouvel appel déjà fait).\n`;
  md += `\nDéfinitions. Signalé = niveau warn ou critical. Rouge = niveau critical. Rappel = malveillants signalés. Fausse alerte rouge = bénin en critical. Fausse alerte warn+rouge = bénin en warn ou critical. Intervalles de Wilson à 95 %. Invérifiable et « ne correspond pas » sont les décisions à trois valeurs des bras (a) et (b).\n`;
  md += `\n## Verdict global\n\nCritères publiés avant ouverture : rappel >= ${pct(CRITERES.rappel_min)} et fausses alertes rouges <= ${pct(CRITERES.fausse_alerte_rouge_max)} (estimation ponctuelle).\n\n`;
  for (const a of arms) md += `- ${nom[a]} : ${J.verdicts[a]}\n`;
  const mono = J.monotonie, monoOk = !mono.a_sous_plancher.length && !mono.b_sous_plancher.length;
  md += `- Monotonie (aucun bras sous le plancher) : ${monoOk ? 'respectée' : 'VIOLÉE ' + JSON.stringify(mono)}\n`;
  if (J.global.c && J.global.a) {
    const gain = (J.global.a.signales - J.global.c.signales);
    md += `- Gain de la phrase sur le plancher, bras (a) : ${gain >= 0 ? '+' : ''}${gain} malveillants signalés de plus que (c)${J.global.b ? ' ; bras (b) : ' + (J.global.b.signales - J.global.c.signales >= 0 ? '+' : '') + (J.global.b.signales - J.global.c.signales) : ''}\n`;
  }
  md += `\n## Tous cas confondus\n\n| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge (bénins) | Fausse alerte warn+rouge (bénins) | Invérifiable (mal.) | Invérifiable (bénins) | Décision « ne correspond pas » (mal.) | Décision « ne correspond pas » (bénins) |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const a of arms) md += ligne(nom[a], J.global[a], a !== 'c') + '\n';
  md += `\n## Matrice par famille\n\n`;
  for (const f of fams) {
    md += `### ${f}\n\n| Bras | Rappel (signalé) | Rouge seul | Fausse alerte rouge | Fausse alerte warn+rouge | Invérifiable (mal.) | Invérifiable (bénins) | « ne correspond pas » (mal.) | « ne correspond pas » (bénins) |\n|---|---|---|---|---|---|---|---|---|\n`;
    for (const a of arms) md += ligne(nom[a], J.par_famille[f][a], a !== 'c') + '\n';
    md += '\n';
  }
  md += `## Échecs (ids)\n\n`;
  for (const a of arms) {
    const e = J.echecs[a];
    md += `### ${nom[a]}\n\n- Malveillants non signalés (${e.mal_non_signales.length}) : ${e.mal_non_signales.join(', ') || 'aucun'}\n- Malveillants signalés en warn seulement, pas en rouge (${e.mal_signales_pas_rouges.length}) : ${e.mal_signales_pas_rouges.join(', ') || 'aucun'}\n- Bénins en rouge, fausses alertes (${e.ben_rouges.length}) : ${e.ben_rouges.join(', ') || 'aucun'}\n- Bénins en warn (${e.ben_warn.length}) : ${e.ben_warn.join(', ') || 'aucun'}\n\n`;
  }
  md += `## Monotonie\n\n- Cas où le bras (a) est sous le plancher : ${mono.a_sous_plancher.length} ${mono.a_sous_plancher.join(', ')}\n- Cas où le bras (b) est sous le plancher : ${mono.b_sous_plancher.length} ${mono.b_sous_plancher.join(', ')}\n\n`;
  md += `## Cas non pris en charge ou en erreur\n\n- Méthode non prise en charge : ${J.non_pris_en_charge.length ? J.non_pris_en_charge.map((x) => x.id + ' (' + x.methode + ')').join(', ') : 'aucun'}\n- Erreurs internes : ${J.erreurs.length ? J.erreurs.map((x) => x.id + ' : ' + x.erreurs.join(' ; ')).join(' | ') : 'aucune'}\n\n`;
  md += `**${PHRASE}.**\n`;
  J.lignes = rows.map((r) => ({ id: r.id, family: r.family, sub: r.sub, label: r.label, twin_of: r.twin_of, unsupported: r.unsupported, a: r.a && { level: r.a.level, floor: r.a.floor, decision: r.a.decision, why: r.a.why, kind: r.a.kind }, b: r.b && { level: r.b.level, floor: r.b.floor, decision: r.b.decision, why: r.b.why, kind: r.b.kind, err: r.b.err || undefined }, c: r.c && { level: r.c.level } }));
  return { md, json: J };
}

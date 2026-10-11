// Banc de preuves de Hold up : UNE commande rejoue tous les jeux autorisés à travers le décideur réel du produit.
//
//   node --no-warnings preuves/banc.mjs                      depuis la racine du dépôt ; sans clé : le bras « clef » sort du cache
//   node --env-file=.env --no-warnings preuves/banc.mjs      avec la clé : complète le cache (plafond 15 000 appels au total)
//
// Options : --jeux=a,b   --bras=mots,clef   --contexte=nu,cas   --sans-controle (saute panel_controle : pour mettre au point le banc)
// Écrit : preuves/REGISTRE.json, preuves/out/RESULTATS.json, preuves/out/ERREURS.jsonl, preuves/out/detail/*.jsonl, preuves/CHIFFRES_TRACES.md
//
// Le décideur : voir preuves/lib/decideur.mjs (service worker du build livré, extension_standalone/extension/background.js).
// Aucune correction du produit n'est faite ici : le banc mesure et rapporte.
import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { creerDecideur, signalDe, empreinteDecideur, figer, RACINE, INSTANT } from './lib/decideur.mjs';
import { creerClef, PLAFOND, MODELE, BUDGET_PRODUIT_MS } from './lib/clef.mjs';
import { JEUX, RESERVE, charger, regenerer, registre, contexteDuCas } from './lib/jeux.mjs';
import { part, quantiles, sha256Fichier } from './lib/stats.mjs';
import { ecrireRapport } from './lib/rapport.mjs';

const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3).split(',') : d; };
const OPT = { aCote: process.argv.includes('--a-cote'), ouvrirReserve: process.argv.includes('--ouvrir-reserve'), jeux: arg('jeux', null), bras: arg('bras', ['mots', 'clef']), contexte: arg('contexte', ['nu', 'cas']), sansControle: process.argv.includes('--sans-controle') };
const OUT = join(RACINE, 'preuves', 'out');
mkdirSync(join(OUT, 'detail'), { recursive: true });
const log = (s) => process.stderr.write(s + '\n');
const git = (...a) => { try { return execFileSync('git', a, { cwd: RACINE, encoding: 'utf8' }).trim(); } catch { return 'inconnu'; } };
const COMMANDE = 'node --no-warnings preuves/banc.mjs';

// ------------------------------------------------------------------ agrégat d'un groupe de paires
const POS_NON_ALERTE = new Set(['match', 'sans_question', 'non_intercepte']);
// « corrige » : le produit a vu l'écart et a réécrit la demande (droit ramené au montant écrit). Compté avec les alertes, et à part dans « issues ».
const ALERTE = new Set(['mismatch', 'corrige']);
function vide() { return { p_panne: 0, n_panne: 0, i_panne: 0, pannes: 0, n: 0, P: 0, N: 0, I: 0, autre: 0, hors_mesure: 0, vp: 0, fn: 0, p_inv: 0, fp: 0, vn: 0, n_inv: 0, i_inv: 0, i_alerte: 0, i_surconf: 0, issues: {} }; }
function compter(a, verite, issue) {
  if (issue === 'panne') a.pannes++;
  a.issues[issue] = (a.issues[issue] || 0) + 1;
  if (['refuse', 'sans_phrase', 'erreur_banc', 'clef_non_mesure'].includes(issue)) { a.hors_mesure++; return; }
  a.n++;
  if (verite === 'non_conforme') { a.P++; if (ALERTE.has(issue)) a.vp++; else if (POS_NON_ALERTE.has(issue)) a.fn++; else if (issue === 'panne') a.p_panne++; else a.p_inv++; }
  else if (verite === 'conforme') { a.N++; if (ALERTE.has(issue)) a.fp++; else if (POS_NON_ALERTE.has(issue)) a.vn++; else if (issue === 'panne') a.n_panne++; else a.n_inv++; }
  else if (verite === 'indecidable') { a.I++; if (ALERTE.has(issue)) a.i_alerte++; else if (POS_NON_ALERTE.has(issue)) a.i_surconf++; else if (issue === 'panne') a.i_panne++; else a.i_inv++; }
  else a.autre++;
}
function mesures(a) {
  return { paires: a.n, hors_mesure: a.hors_mesure, pannes_du_moteur: part(a.pannes, a.n), non_conformes_en_panne: part(a.p_panne, a.P), conformes_en_panne: part(a.n_panne, a.N), indecidables_en_panne: part(a.i_panne, a.I), non_conformes: a.P, conformes: a.N, indecidables: a.I, autres: a.autre,
    rappel: part(a.vp, a.P), faux_negatifs: part(a.fn, a.P), non_conformes_inverifiables: part(a.p_inv, a.P),
    fausses_alertes: part(a.fp, a.N), conformes_reconnus: part(a.vn, a.N), conformes_inverifiables: part(a.n_inv, a.N),
    precision: part(a.vp, a.vp + a.fp), taux_inverifiable: part(a.p_inv + a.n_inv + a.i_inv, a.n),
    indecidables_reconnus: part(a.i_inv, a.I), indecidables_alertes: part(a.i_alerte, a.I), surconfiance: part(a.i_surconf, a.I), issues: a.issues };
}
// Une exception du moteur, rattrapée par le produit et affichée « pas pu vérifier ». Motifs écrits par sentinelle_core.js.
const PANNE = /erreur interne du moteur|moteur indisponible|analyse impossible/;
const typeErreur = (verite, issue) => (verite === 'non_conforme' && POS_NON_ALERTE.has(issue) ? 'faux_negatif' : verite === 'conforme' && ALERTE.has(issue) ? 'faux_positif' : verite === 'indecidable' && POS_NON_ALERTE.has(issue) ? 'surconfiance' : null);

// ------------------------------------------------------------------ préparation
const debut = new Date();
// État exact du code mesuré : commit, et chaque fichier du code de décision modifié ou non suivi, avec son empreinte.
const CODE = ['research/titouan/T_banc_e2e/extension_standalone', 'research/titouan/T_banc_e2e/extension', 'research/titouan/T_banc_e2e/engine', 'research/titouan/T_banc_e2e/pipeline', 'research/titouan/T_banc_e2e/run', 'research/titouan/T_banc_e2e/detectors_adem', 'research/demo_reelle/classifieur'];
function etatDuCode() {
  const lignes = git('status', '--porcelain', '--', ...CODE).split('\n').map((l) => l.trim()).filter(Boolean);
  return lignes.map((l) => { const f = l.replace(/^\S+\s+/, '').replace(/^"|"$/g, ''); const abs = join(RACINE, f); let h = null; try { if (existsSync(abs) && !f.endsWith('/')) h = createHash('sha256').update(readFileSync(abs)).digest('hex'); } catch { /* dossier */ } return { etat: l.split(/\s+/)[0], fichier: f, sha256: h }; });
}
const meta = { date: debut.toISOString(), commande: COMMANDE + (process.argv.slice(2).length ? ' ' + process.argv.slice(2).join(' ') : ''), commit: git('rev-parse', 'HEAD'),
  fichiers_modifies_non_commites: etatDuCode(),
  node: process.version, horloge_figee: new Date(INSTANT).toISOString(), decideur: figer((arg('instantane', [null]))[0]) };
// Le commit et la liste des fichiers modifiés sont ceux du moment où l'instantané a été copié : ils sont écrits à côté de la copie
// (ETAT_DU_CODE.json) et relus quand on rejoue cet instantané plus tard, alors que le dépôt a avancé.
{ const f = join(RACINE, meta.decideur.instantane, 'ETAT_DU_CODE.json');
  if (existsSync(f)) { const e = JSON.parse(readFileSync(f, 'utf8')); meta.commit = e.commit; meta.fichiers_modifies_non_commites = e.fichiers_modifies_non_commites; meta.instantane_copie_le = e.copie_le; }
  else { meta.instantane_copie_le = meta.date; writeFileSync(f, JSON.stringify({ copie_le: meta.date, commit: meta.commit, fichiers_modifies_non_commites: meta.fichiers_modifies_non_commites }, null, 1) + '\n'); } }
meta.arbre_modifie = meta.fichiers_modifies_non_commites.length;
log(`banc : commit ${meta.commit.slice(0, 7)}, ${meta.arbre_modifie} fichier(s) du code de décision modifié(s) hors commit, empreinte du décideur ${meta.decideur.sha256.slice(0, 12)}`);
for (const q of ['grille', 'decalage']) regenerer(q);
const REG = await registre(OPT.ouvrirReserve);
writeFileSync(join(RACINE, 'preuves', 'REGISTRE.json'), JSON.stringify({ etabli_le: meta.date, commande: COMMANDE, regle: 'un jeu marqué lu_par_le_banc=false n\'a pas de lecteur dans preuves/lib/jeux.mjs : seuls son chemin et son empreinte (flux d\'octets) sont enregistrés', jeux: REG }, null, 1) + '\n');
const regDe = (nom) => REG.find((r) => r.nom === nom);
{ const g = regDe('grille_controle'); if (g && g.sha256 !== '3644a72c4317e6150eaf989080315ad3fd8f78ef316fda26d55108562f7c7b14') throw new Error('la grille régénérée n\'a pas l\'empreinte publiée du contrôle'); }

let jeux = JEUX.filter((j) => !OPT.jeux || OPT.jeux.includes(j.nom));
if (OPT.sansControle) jeux = jeux.filter((j) => j.nom !== 'panel_controle');
if (OPT.ouvrirReserve) jeux = [RESERVE, ...jeux];
const DATA = new Map();
for (const j of jeux) {
  const r = regDe(j.nom); if (!r || r.absent) { log('jeu absent : ' + j.nom); continue; }
  if (r.sha256_scelle && !r.scelle_respecte) throw new Error(`${j.nom} : l'empreinte du fichier ne correspond pas à l'empreinte scellée`);
  DATA.set(j.nom, charger(j));
}
jeux = jeux.filter((j) => DATA.has(j.nom));

// ------------------------------------------------------------------ contrôle préalable : le moteur lève-t-il une exception ?
// Une demande de chaque nature de la moitié réglage du panel (17 formes) passe par check() du moteur mesuré. Si une seule lève
// une exception, le banc refuse de mesurer : un chiffre pris sur un moteur en panne ne mesure pas la décision.
// « --mesurer-malgre-panne » passe outre, pour documenter un état en panne ; le résultat le porte alors en tête.
{
  const core = await import(pathToFileURL(join(RACINE, meta.decideur.instantane, 'research', 'titouan', 'T_banc_e2e', 'extension_standalone', 'extension', 'engine', 'sentinelle_core.js')).href);
  const lot = new Map();
  for (const l of readFileSync(join(RACINE, 'preuves', 'panel', 'REGLAGE.jsonl'), 'utf8').split('\n')) { if (!l) continue; const c = JSON.parse(l); if (!lot.has(c.nature) && (c.ecart_construit === 'aucun' || c.ecart_construit.startsWith('jumeau') || !['transfert', 'natif', 'echange', 'lot'].includes(c.nature))) lot.set(c.nature, c); }
  const pannes = [];
  for (const [nature, c] of lot) { let v; try { v = core.check({ origin: c.context.origin, url: c.context.origin + '/', method: c.request.method, params: c.request.params, chainId: '0x' + c.context.chainId.toString(16), from: c.context.victim }, core.emptyLocal()); } catch (e) { v = { why: 'erreur interne du moteur : ' + e.message }; } if (PANNE.test(String(v && v.why || ''))) pannes.push({ nature, id: c.id, methode: c.request.method, motif: v.why }); }
  meta.controle_prealable = { demandes: lot.size, pannes };
  if (pannes.length) {
    log(`CONTRÔLE PRÉALABLE : le moteur lève une exception sur ${pannes.length} des ${lot.size} demandes d'essai (${pannes.map((x) => x.nature).join(', ')}). Motif : ${pannes[0].motif}`);
    if (!process.argv.includes('--mesurer-malgre-panne')) { log('Mesure REFUSÉE : corriger le moteur, ou ajouter --mesurer-malgre-panne pour documenter cet état en connaissance de cause.'); process.exit(2); }
    meta.MOTEUR_EN_PANNE = `mesure faite sur un moteur qui lève une exception sur ${pannes.length} des ${lot.size} demandes d'essai (${pannes[0].motif}) : ces chiffres ne mesurent pas la décision du produit pour les demandes concernées`;
  } else log(`contrôle préalable : aucune exception du moteur sur ${lot.size} demandes d'essai`);
}

// ------------------------------------------------------------------ registre des ouvertures du contrôle du panel
const OUVERTURES = join(RACINE, 'preuves', 'panel', 'OUVERTURES.log');
const ouverturesAvant = existsSync(OUVERTURES) ? readFileSync(OUVERTURES, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
function noterOuverture(jeu, bras, contexte) {
  const memes = ouverturesAvant.filter((o) => o.jeu === jeu && o.bras === bras && o.contexte === contexte);
  const statut = !memes.length ? 'premiere_mesure' : memes.every((o) => o.decideur === meta.decideur.sha256) ? 'rejeu_a_l_identique' : 'RE_MESURE_APRES_CHANGEMENT_DU_PRODUIT';
  appendFileSync(OUVERTURES, JSON.stringify({ date: meta.date, jeu, bras, contexte, decideur: meta.decideur.sha256, commit: meta.commit, sha256_jeu: regDe(jeu).sha256, statut }) + '\n');
  return { statut, mesures_precedentes: memes.length };
}

// ------------------------------------------------------------------ mesure
const RES = { meta, definitions: {
  unite: 'une paire (phrase écrite, demande du site)', positif: 'vérité non_conforme : la demande ne correspond pas à la phrase', negatif: 'vérité conforme',
  rappel: 'non conformes qui reçoivent « Ça ne correspond pas » / non conformes', faux_negatifs: 'non conformes qui passent : « Ça correspond », aucune fenêtre, ou méthode non interceptée / non conformes',
  non_conformes_inverifiables: 'non conformes qui reçoivent « Je n\'ai pas pu vérifier » / non conformes (ni attrapé, ni raté : compté à part)',
  fausses_alertes: 'conformes qui reçoivent « Ça ne correspond pas » / conformes', conformes_inverifiables: 'conformes qui reçoivent « Je n\'ai pas pu vérifier » / conformes',
  surconfiance: 'paires indécidables par construction qui reçoivent « Ça correspond » / indécidables', panne: 'le moteur a levé une exception (le produit affiche « pas pu vérifier ») : comptée à part, ni décision ni abstention', corrige: 'le produit a vu un droit plus large que le montant écrit et a réécrit la demande : compté avec les attrapés, visible dans « issues »', clef_non_mesure: 'bras clef : aucune réponse du modèle pour cette phrase ; la paire est hors mesure, jamais comptée comme une décision', ic95: 'intervalle de Wilson à 95 %, en pourcentage', precision: 'vrais positifs / (vrais positifs + faux positifs) ; dépend du mélange du jeu, fixé par construction' },
  configuration: { modele_clef: MODELE, plafond_appels_clef: PLAFOND, budget_relais_produit_ms: BUDGET_PRODUIT_MS, relance: 'quand le produit pose sa question de relance, le banc renvoie la même phrase (la personne n\'a rien d\'autre à dire)', contexte_nu: 'installation par défaut : aucun contexte local', contexte_cas: 'contexte local rempli depuis le monde du cas (contacts, protocoles connus, jetons) : ce que la personne aurait saisi dans les options' },
  jeux: {}, clef: null };
const erreurs = [];
const cle = (bras, ctx) => bras + '/' + ctx;

async function passer(bras, clef) {
  const manques = new Set();
  const classify = bras === 'clef' ? async (texte) => { const r = await clef.classer(texte); if (r.absent) manques.add(texte); return r; } : null;
  const D = await creerDecideur({ classify });
  const sorties = new Map(); // nom/ctx -> résultats par cas
  const aFaire = [];
  for (const j of jeux) for (const ctx of OPT.contexte) { if (ctx === 'cas' && j.lecteur === 'panel') continue; aFaire.push([j, ctx]); }
  for (const [j, ctx] of aFaire) sorties.set(j.nom + '/' + ctx, new Array(DATA.get(j.nom).length).fill(null));
  for (let tour = 0; tour < 4; tour++) {
    manques.clear(); let refaits = 0;
    for (const [j, ctx] of aFaire) {
      const cas = DATA.get(j.nom), out = sorties.get(j.nom + '/' + ctx);
      for (let i = 0; i < cas.length; i++) {
        if (out[i] && !(out[i].clef && out[i].clef.absent)) continue;
        out[i] = await D.juger(cas[i], ctx === 'cas' ? contexteDuCas(cas[i].brut) : null); refaits++;
      }
    }
    log(`  bras ${bras}, tour ${tour + 1} : ${refaits} paires jugées, ${manques.size} phrases sans réponse Clef en cache`);
    if (bras !== 'clef' || !manques.size || !clef.cleDispo) break;
    const p = await clef.prechauffer([...manques]);
    log(`  clef : ${p.repondues} réponses obtenues, ${p.absentes} manquantes${p.arret ? ' (arrêt : ' + p.arret + ')' : ''}`);
    if (!p.repondues) { log('  clef : aucune réponse nouvelle, le bras clef reste incomplet (' + p.absentes + ' phrases sans réponse)'); break; }
  }
  D.fermer();
  return sorties;
}

let clef = null;
for (const bras of OPT.bras) {
  if (bras === 'clef') clef = await creerClef({ cachePath: join(OUT, 'cache_clef.json'), journal: log });
  log(`bras ${bras}${bras === 'clef' ? (clef.cleDispo ? ' (clé présente : le cache sera complété)' : ' (pas de clé : cache seul)') : ''}`);
  const sorties = await passer(bras, clef);
  for (const j of jeux) for (const ctx of OPT.contexte) {
    const out = sorties.get(j.nom + '/' + ctx); if (!out) continue;
    const cas = DATA.get(j.nom), reg = regDe(j.nom);
    const J = RES.jeux[j.nom] = RES.jeux[j.nom] || { chemin: j.chemin, sha256: reg.sha256, cas: cas.length, ...(j.lecteur === 'panel' ? { verites_corrigees_par_erratum_E1: cas.filter((c) => c.erratum).length } : {}), role: j.role, question: j.question, lecture: j.role === 'reglage' ? 'OPTIMISTE (jeu de réglage)' : j.role === 'controle' || j.role === 'reserve_scellee' ? 'contrôle scellé' : 'contrôle déjà ouvert : optimiste', mesures: {} };
    const ouverture = j.nom === 'panel_controle' || j.nom === 'panel_reserve' ? noterOuverture(j.nom, bras, ctx) : null;
    const vues = {}, cases = {}, lat = [], latP = [], latD = [], latClef = [], detail = [];
    let relances = 0, questions = 0, nonMesure = 0, lents = 0;
    for (let i = 0; i < cas.length; i++) {
      const c = cas[i], r = out[i];
      let issue = r.issue === 'match' && r.corrige ? 'corrige' : r.issue; if (bras === 'clef' && r.clef && r.clef.absent) { issue = 'clef_non_mesure'; nonMesure++; }
      if (PANNE.test(String(r.pourquoi || '')) && issue === 'unverifiable') issue = 'panne'; // le moteur a levé une exception : ce n'est pas une décision
      for (const v of c.vues) compter(vues[v] = vues[v] || vide(), c.verite, issue);
      for (const [dim, val] of Object.entries(c.cases)) { const d = cases[dim] = cases[dim] || {}; compter(d[val] = d[val] || vide(), c.verite, issue); }
      if (issue !== 'clef_non_mesure' && issue !== 'non_intercepte' && Number.isFinite(r.ms)) { lat.push(r.ms); if (r.ms_plancher != null) latP.push(r.ms_plancher); if (r.ms_decision) latD.push(r.ms_decision); }
      if (r.clef && r.clef.ms != null) { latClef.push(r.clef.ms + r.ms); if (r.clef.ms > BUDGET_PRODUIT_MS) lents++; }
      if (r.question) questions++; if (r.relance) relances++;
      const signal = signalDe(r), type = typeErreur(c.verite, issue);
      detail.push(JSON.stringify({ id: c.id, verite: c.verite, issue, type, signal, niveau: r.niveau || null, codes: r.codes || [], lu: r.lu || null, ms: r.ms }));
      if (type) erreurs.push(JSON.stringify({ jeu: j.nom, role: j.role, bras, contexte: ctx, type, id: c.id, phrase: c.phrase, effet_de_la_demande: c.effet, verite: c.verite, raison_verite: c.raison, cases: c.cases,
        verdict: { issue, niveau: r.niveau || null, ligne: r.ligne || null, codes: r.codes || [], written_check: r.ecrit || null, relance: !!r.relance, attente_ms: r.attente_ms ?? null }, phrase_lue: r.lu || null, signal_responsable: signal }));
    }
    mkdirSync(join(OUT, 'etats', meta.decideur.sha256.slice(0, 16), 'detail'), { recursive: true });
    writeFileSync(join(OUT, 'etats', meta.decideur.sha256.slice(0, 16), 'detail', `${j.nom}.${bras}.${ctx}.jsonl`), detail.join('\n') + '\n');
    if (!OPT.aCote) writeFileSync(join(OUT, 'detail', `${j.nom}.${bras}.${ctx}.jsonl`), detail.join('\n') + '\n');
    J.mesures[cle(bras, ctx)] = { bras, contexte: ctx, ...(ouverture ? { ouverture_du_controle: ouverture } : {}), paires_presentees: cas.length, questions_posees: questions, relances, ...(bras === 'clef' ? { paires_avec_reponse_du_modele: out.filter((r) => r.clef && !r.clef.absent).length, paires_sans_appel_au_modele: out.filter((r) => !r.clef).length, clef_non_mesure: nonMesure, appels_clef_au_dela_du_budget_produit: lents } : {}),
      vues: Object.fromEntries(Object.entries(vues).map(([k, a]) => [k, mesures(a)])), cases: Object.fromEntries(Object.entries(cases).map(([d, m]) => [d, Object.fromEntries(Object.entries(m).sort().map(([k, a]) => [k, mesures(a)]))])),
      latence_ms: { verdict_local: quantiles(lat), plancher_seul: quantiles(latP), apres_la_phrase: quantiles(latD), ...(bras === 'clef' ? { avec_appel_clef: quantiles(latClef) } : {}) },
      detail: `preuves/out/detail/${j.nom}.${bras}.${ctx}.jsonl` };
  }
}
if (clef) {
  const tk = clef.tokens(), e = clef.etat();
  if (e.arret) log('ARRÊT du bras clef : ' + e.arret);
  RES.clef = { ...e, latence_appel_ms: quantiles(clef.latences()), jetons_entree: quantiles(tk), cout_usd_par_phrase: tk.length ? Math.round((tk.reduce((s, x) => s + x, 0) / tk.length) * 0.038 / 1e6 * 1e8) / 1e8 : null, prix_source: 'detectors_adem/clef_client.mjs : 0,038 $ par million de jetons d\'entrée (clef-flash), sortie non facturée',
    cache: 'preuves/out/cache_clef.json (clé = sha256 du corps envoyé ; ni phrase ni clé d\'API)' };
}
{ const fin = empreinteDecideur(); RES.meta.code_vivant_identique_a_l_instantane_en_fin_de_mesure = fin.sha256 === meta.decideur.sha256; if (!RES.meta.code_vivant_identique_a_l_instantane_en_fin_de_mesure) { RES.meta.note_code = 'le code vivant du dépôt a changé pendant ou depuis la mesure (empreinte vivante ' + fin.sha256 + '). La mesure porte sur l\'instantané ' + meta.decideur.instantane + ', pas sur le code vivant : relancer la même commande pour mesurer le nouvel état'; log('NOTE : ' + RES.meta.note_code); } }
RES.meta.duree_s = Math.round((Date.now() - debut.getTime()) / 100) / 10;
// Chaque état du code a son dossier : preuves/out/etats/<empreinte>/. Les fichiers de preuves/out/ et CHIFFRES_TRACES.md sont ceux
// de la dernière exécution, sauf avec --a-cote (mesure d'un autre état du code sans toucher à l'état de référence).
// Fusion : une exécution partielle (--jeux, --bras, --sans-controle) complète le fichier du MÊME état sans effacer les autres jeux.
const ETAT = join(OUT, 'etats', meta.decideur.sha256.slice(0, 16));
mkdirSync(ETAT, { recursive: true });
const cible = join(ETAT, 'RESULTATS.json');
if (existsSync(cible)) {
  const old = JSON.parse(readFileSync(cible, 'utf8'));
  if (old.meta && old.meta.decideur && old.meta.decideur.sha256 === meta.decideur.sha256) { for (const [k, v] of Object.entries(old.jeux || {})) { if (!RES.jeux[k]) RES.jeux[k] = v; else RES.jeux[k].mesures = Object.assign({}, v.mesures, RES.jeux[k].mesures); } if (!RES.clef) RES.clef = old.clef; RES.meta.fusion = 'fusionné avec l\'exécution du ' + old.meta.date + ' (même empreinte du décideur) : les jeux, bras et contextes rejoués remplacent les anciens'; }
}
writeFileSync(cible, JSON.stringify(RES, null, 1) + '\n');
// ERREURS.jsonl : même règle de fusion (les lignes des jeux/bras rejoués remplacent les anciennes).
const errPath = join(ETAT, 'ERREURS.jsonl');
let anciennes = [];
if (RES.meta.fusion && existsSync(errPath)) { const refaits = new Set(); for (const j of jeux) for (const b of OPT.bras) for (const c of OPT.contexte) refaits.add(j.nom + '|' + b + '|' + c); anciennes = readFileSync(errPath, 'utf8').split('\n').filter(Boolean).filter((l) => { const o = JSON.parse(l); return !refaits.has(o.jeu + '|' + o.bras + '|' + o.contexte); }); }
writeFileSync(errPath, anciennes.concat(erreurs).join('\n') + '\n');
ecrireRapport(RES, REG, join(ETAT, 'CHIFFRES_TRACES.md'));
if (!OPT.aCote) { writeFileSync(join(OUT, 'RESULTATS.json'), readFileSync(cible)); writeFileSync(join(OUT, 'ERREURS.jsonl'), readFileSync(errPath)); ecrireRapport(RES, REG); }
log(`terminé en ${RES.meta.duree_s} s : preuves/out/RESULTATS.json, preuves/out/ERREURS.jsonl (${anciennes.length + erreurs.length} lignes), preuves/CHIFFRES_TRACES.md`);
void sha256Fichier;

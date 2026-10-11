// Écrit preuves/CHIFFRES_TRACES.md à partir de preuves/out/RESULTATS.json. Chaque ligne de chiffre porte : la commande qui le
// produit, l'empreinte du jeu, le commit, la date, l'intervalle de confiance, et le rôle du jeu (réglage = optimiste, contrôle).
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from './decideur.mjs';
import { ecrit } from './stats.mjs';

const ROLE = { reglage: 'réglage (optimiste)', controle: 'CONTRÔLE scellé', reserve_scellee: 'RÉSERVE scellée', controle_deja_ouvert: 'contrôle déjà ouvert (optimiste)' };
const BRAS = { mots: 'sans modèle (mots-clés)', clef: 'avec Clef-flash' };
const q = (x) => (x && x.n ? `${String(x.p50).replace('.', ',')} / ${String(x.p95).replace('.', ',')} (n = ${x.n})` : 'sans objet');

export function ecrireRapport(RES, REG, sortie = null) {
  const m = RES.meta, L = [];
  const trace = (nom, J, bras, ctx) => `\`${J.sha256.slice(0, 12)}\` | \`${m.commit.slice(0, 7)}\` | ${m.date.slice(0, 16)}Z | ${ROLE[J.role] || J.role} | \`node --no-warnings preuves/banc.mjs --jeux=${nom} --bras=${bras} --contexte=${ctx}\``;
  const TETE = '| Jeu | Lecture de la phrase | Contexte | Vue ou case | Attrapé (rappel) | Raté (faux négatif) | Non conforme laissé « pas pu vérifier » | Fausse alerte (sur conformes) | Conforme laissé « pas pu vérifier » | Surconfiance (sur indécidables) | Précision | Panne du moteur (toutes paires) | Empreinte du jeu | Commit | Date | Rôle | Commande |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|';
  const ligne = (nom, J, k, vue, x) => `| ${nom} | ${BRAS[k.bras]} | ${k.contexte} | ${vue} | ${ecrit(x.rappel)} | ${ecrit(x.faux_negatifs)} | ${ecrit(x.non_conformes_inverifiables)} | ${ecrit(x.fausses_alertes)} | ${ecrit(x.conformes_inverifiables)} | ${ecrit(x.surconfiance)} | ${ecrit(x.precision)} | ${ecrit(x.pannes_du_moteur)} | ${trace(nom, J, k.bras, k.contexte)} |`;
  const table = (noms, { vues = null, dim = null, ctx = ['nu'] } = {}) => {
    const out = [TETE];
    for (const nom of noms) { const J = RES.jeux[nom]; if (!J) continue;
      for (const k of Object.values(J.mesures)) { if (!ctx.includes(k.contexte)) continue;
        if (dim) for (const [val, x] of Object.entries(k.cases[dim] || {})) out.push(ligne(nom, J, k, `${dim} = ${val}`, x));
        else for (const [v, x] of Object.entries(k.vues)) if (!vues || vues.includes(v)) out.push(ligne(nom, J, k, v, x)); } }
    return out.join('\n');
  };
  L.push('# Chiffres tracés de Hold up', '',
    `Produit par \`${m.commande}\` le ${m.date}. Fichier généré : ne pas l'éditer à la main (source : \`preuves/out/RESULTATS.json\`, écrit par \`preuves/banc.mjs\`).`, '',
    `- Commit : \`${m.commit}\`. Fichiers du code de décision modifiés ou non suivis au moment de la mesure : ${m.arbre_modifie}${m.arbre_modifie ? ' (' + m.fichiers_modifies_non_commites.map((f) => '`' + f.fichier.split('/').slice(-2).join('/') + '` ' + (f.sha256 ? f.sha256.slice(0, 12) : 'dossier')).join(', ') + ')' : ''}. Le banc a mesuré une copie figée de ce code (${m.decideur.instantane}) ; code vivant encore identique en fin de mesure : ${m.code_vivant_identique_a_l_instantane_en_fin_de_mesure ? 'oui' : 'NON (un autre agent l\'a modifié : relancer la commande pour mesurer le nouvel état)'}. L'empreinte du décideur fait foi : \`${m.decideur.sha256}\` (${m.decideur.fichiers} fichiers, détail dans RESULTATS.json, champ meta.decideur.detail).`,
    '- Décideur mesuré : le service worker du build livré, `research/titouan/T_banc_e2e/extension_standalone/extension/background.js` (voir `preuves/lib/decideur.mjs`).',
    `- Horloge du banc figée à ${m.horloge_figee}. Node ${m.node}.`,
    '- Définitions : `preuves/PROTOCOLE.md`. Intervalles : Wilson à 95 %. Chaque taux est écrit `k/n = taux [bas ; haut]` : le dénominateur est toujours là.',
    '- Attrapé + raté + « pas pu vérifier » + panne = 100 % des non conformes ; idem pour les conformes avec les conformes reconnus. « Pas pu vérifier » n\'est jamais rangé avec les attrapés ni avec les ratés. Une **panne** (exception du moteur, que le produit affiche aussi « pas pu vérifier ») est comptée dans sa colonne, pas dans l\'abstention : par vérité, voir RESULTATS.json (`non_conformes_en_panne`, `conformes_en_panne`).',
    '- Bras Clef : une paire dont la phrase n\'a pas de réponse du modèle est hors mesure (`clef_non_mesure`), jamais comptée comme une décision.',
    '- Pour remonter d\'un chiffre à un cas : `preuves/out/ERREURS.jsonl` (chaque faux positif, faux négatif et surconfiance) et `preuves/out/detail/<jeu>.<bras>.<contexte>.jsonl` (chaque paire).', '');
  if (m.MOTEUR_EN_PANNE) L.push('> **MOTEUR EN PANNE.** ' + m.MOTEUR_EN_PANNE + '. Détail : RESULTATS.json, meta.controle_prealable.', '');
  const pc = RES.jeux.panel_controle;
  if (RES.jeux.panel_reserve) L.push('## 0. Réserve scellée, ouverte après correction', '', table(['panel_reserve']), '');
  L.push('## 1. Moitié contrôle du grand panel : mesure unique' + (m.MOTEUR_EN_PANNE ? ', faite sur un moteur en panne (lire la section 6)' : ''), '');
  if (pc) {
    const ouv = Object.values(pc.mesures).map((k) => `${k.bras} : ${k.ouverture_du_controle ? k.ouverture_du_controle.statut + (k.ouverture_du_controle.mesures_precedentes ? ' (' + k.ouverture_du_controle.mesures_precedentes + ' mesure(s) avant)' : '') : '?'}`).join(' ; ');
    L.push(`${pc.cas} paires, empreinte scellée \`${pc.sha256}\`. État des ouvertures : ${ouv}. Journal : \`preuves/panel/CONTROLE_OUVERTURES.log\`.`, '', table(['panel_controle']), '');
    for (const k of Object.values(pc.mesures)) if (k.bras === 'clef') L.push(`Bras Clef : ${k.paires_avec_reponse_du_modele} paires ont eu une réponse du modèle, ${k.paires_sans_appel_au_modele} n'en demandent pas (aucune question posée), ${k.clef_non_mesure} sont restées sans réponse (hors mesure, jamais comptées comme une décision) ; ${k.appels_clef_au_dela_du_budget_produit} paires dont l'appel réel a dépassé le budget de ${RES.configuration.budget_relais_produit_ms} ms du relais (dans le produit, ces phrases seraient lues par mots-clés).`, '');
    L.push('### 1.1 Par type d\'écart (contrôle)', '', table(['panel_controle'], { dim: 'ecart' }), '', '### 1.2 Par nature de demande (contrôle)', '', table(['panel_controle'], { dim: 'nature' }), '', '### 1.3 Par façon d\'écrire (contrôle)', '', table(['panel_controle'], { dim: 'style' }), '', '### 1.4 Par langue (contrôle)', '', table(['panel_controle'], { dim: 'langue' }), '');
    L.push('### 1.5 Temps de détection et coût (contrôle)', '', '| Mesure | Lecture de la phrase | p50 / p95 en ms | Empreinte du jeu | Commit | Date | Rôle | Commande |', '|---|---|---|---|---|---|---|---|');
    for (const k of Object.values(pc.mesures)) { const t = trace('panel_controle', pc, k.bras, k.contexte);
      L.push(`| Verdict local complet (plancher + phrase + comparaison), hors réseau | ${BRAS[k.bras]} | ${q(k.latence_ms.verdict_local)} | ${t} |`, `| dont plancher seul, avant la question | ${BRAS[k.bras]} | ${q(k.latence_ms.plancher_seul)} | ${t} |`);
      if (k.latence_ms.avec_appel_clef) L.push(`| Verdict avec l'appel réel à Clef-flash (temps de l'appel enregistré au moment du cache) | ${BRAS[k.bras]} | ${q(k.latence_ms.avec_appel_clef)} | ${t} |`); }
    L.push('');
    if (RES.clef) L.push(`Clef-flash : ${RES.clef.appels_reels_total} appels réels au total sur un plafond de ${RES.clef.plafond}, ${RES.clef.erreurs} erreur(s), ${RES.clef.reponses_en_cache} réponses en cache. Latence d'un appel, p50 / p95 en ms : ${q(RES.clef.latence_appel_ms)}. Jetons d'entrée par phrase, p50 / p95 : ${q(RES.clef.jetons_entree)}. Coût par phrase : ${RES.clef.cout_usd_par_phrase == null ? 'non mesuré (le modèle ne renvoie pas de compte de jetons)' : String(RES.clef.cout_usd_par_phrase).replace('.', ',') + ' $'} (${RES.clef.prix_source}).`,
      'Ces temps sont ceux du code du produit sous Node, sur la machine du banc : ni la fenêtre, ni la frappe de la phrase, ni le navigateur ne sont comptés. Le temps réel d\'une décision est dominé par la personne qui écrit.', '');
  } else L.push('Non mesuré dans cette exécution.', '');
  L.push('## 2. Moitié réglage du grand panel (optimiste par nature, ici identique en espérance : aucun réglage n\'a été fait)', '', table(['panel_reglage']), '');
  L.push('## 3. Grille existante de 2 170 paires, rejouée à travers le décideur réel', '', 'La grille avait été mesurée par une chaîne de banc (`pipeline/grille/lib.mjs`) qui ajoute son propre repli lexical. Ici c\'est l\'extension elle-même qui décide. Installation par défaut (« nu ») puis avec le contexte du cas.', '', table(['grille_controle', 'grille_reglage'], { ctx: ['nu', 'cas'] }), '');
  L.push('## 4. Jeux étiquetés malveillant / bénin (autre question que « la demande correspond-elle à la phrase ? »)', '', 'Positif = cas étiqueté malveillant par l\'auteur du jeu, négatif = bénin. La phrase est le champ `intent.freeText` du cas. Tous sont des jeux de réglage : les règles du moteur ont été écrites en les regardant, et les fichiers `jury_*` ne gardent que des cas qui contournaient le moteur d\'alors.', '', table(Object.keys(RES.jeux).filter((n) => RES.jeux[n].question === 'etiquette'), { ctx: ['nu', 'cas'] }), '');
  L.push('## 5. Registre des jeux', '', '| Jeu ou fichier | Rôle | Cas | Empreinte sha256 | Lu par le banc |', '|---|---|---|---|---|');
  for (const r of REG) L.push(`| \`${r.chemin}\` | ${r.role || ''} | ${r.cas ?? 'non compté'} | \`${r.sha256 || 'absent'}\` | ${r.lu_par_le_banc ? 'oui' : 'NON (empreinte par flux d\'octets seulement)'} |`);
  L.push('', 'Détail (générateur, graine, date, statut) : `preuves/REGISTRE.json`.', '');
  const ec = join(RACINE, 'preuves', 'ECARTS_LIVRABLES.md');
  if (existsSync(ec)) L.push(readFileSync(ec, 'utf8'));
  writeFileSync(sortie || join(RACINE, 'preuves', 'CHIFFRES_TRACES.md'), L.join('\n') + '\n');
}

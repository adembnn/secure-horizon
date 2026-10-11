// Génère livrables/deck/holdup_v2.pptx : même contenu que build_deck.js, nouvelle composition.
// Usage : NODE_PATH=<dossier node_modules contenant pptxgenjs> node livrables/deck/build_deck_v2.js
// Système : tokens de docs/design/system (noir, blanc, deux gris ; Segoe UI Variable Text 400 et 600).
// Grille : marges 0,7 pouce, 6 colonnes sur 8,6 pouces, gouttière 0,3. Titre toujours en haut à gauche.
// Échelle : 28 (titre), 16 (texte), un seul grand chiffre par slide ; pied en 11 gris 808080.
const path = require('path');
const pptxgen = require('pptxgenjs');

const PAGE = '000000', INK = 'FFFFFF', INK2 = 'B3B3B3', INK3 = '808080';
const F = 'Segoe UI Variable Text', FB = 'Segoe UI Variable Text Semibold';
const ROOT = path.join(__dirname, '..', '..');
const CAP = path.join(ROOT, 'docs', 'design', 'system', 'captures');
const NOTES = [
 "Trame d'Adem (livrables/pitch_v7/PITCH_ADEM.md, bloc 2). LI.FI, 16 juillet 2024 : 11,6 M$ pris à 153 portefeuilles qui avaient laissé une approbation illimitée, rien aux approbations finies, selon le rapport de LI.FI (li.fi/knowledge-hub/incident-report-16th-july, source éditeur ; CHIFFRES.md B7). À dire si on le demande : le montant fini était déjà le réglage par défaut de LI.FI, les 153 avaient choisi l'illimité ; et c'est sur plusieurs chaînes, pas un chiffre Avalanche. Postulat : tout service en ligne finira par être piraté ; la question devient « qu'est-ce que je lui ai laissé le droit de prendre ce jour-là ». Sur Avalanche C-Chain, 34,2 % [33,6 ; 34,9] des droits de dépense non nuls lus sont illimités (7 103 sur 20 753) : mesure interne, des événements et non des personnes. Ne pas citer Ethereum.",
 "Hold up est une extension Chrome posée devant le portefeuille existant. Elle ne tient aucune clé et ne signe rien. La personne écrit ce qu'elle veut faire ; du code lit montant, monnaie et adresse dans la demande et compare. Trois réponses, au mot près : « Ça correspond à ce que tu as écrit. », « Ça ne correspond pas à ce que tu as écrit. », « Je n'ai pas pu vérifier cette demande. ». « Ça correspond » vaut d'après ce que Hold up sait lire : ce n'est pas une garantie. La phrase seule part vers le modèle Clef par un relais local (D-015) ; le modèle ne lit ni montants ni adresses et ne peut pas baisser une alerte du code. Chaque décision est écrite dans un cahier chaîné par hachage. Règle décidée par Adem le 11 oct. : une demande illimitée donne « Ça ne correspond pas », le gant, et le geste « Limiter à 50 USDC et envoyer » ; plus aucune limitation ni départ automatiques. Les deux écrans montrés sont ceux du système de design (planche), pas l'extension livrée ; le libellé du geste sur la capture (« Envoyer quand même ») est celui de la planche, pas encore tous appliqués au code : l'interface actuelle de l'extension est visible slide 7. Ne pas dire « l'échange est vérifié », « rien ne quitte la machine », « sécurisé ».",
 "Scène prouvée sur la chaîne (livrables/pitch_v7/DEMO_DEROULE.md, H2 et H3) : site honnête qui demande l'illimité, piraté plus tard. Le compte part de 100 USDC. Sans Hold up : 50 après l'échange, puis 0 après le piratage. Avec : autorisation limitée à 50 par le geste « Limiter à 50 USDC et envoyer », consommée par l'échange, le compte garde 50. Le parcours avec Hold up est joué dans un vrai Chromium (film_scene.mjs), le « sans » sur la chaîne seulement. Le script demande une chaîne locale déployée (npm run demo:deploy -- --network localhost) : le jury ne le rejoue pas en une commande. Copie locale d'Avalanche, rien sur Fuji (D-016).",
 "La révocation est branchée dans l'extension, panneau latéral (messages hu.revoke.*, extension/REVOKE_BRANCHEMENT.md). Hold up prépare la demande de retrait (approve à 0, setApprovalForAll false, Permit2 approve à 0) ; le portefeuille la signe, jamais Hold up. Un clic seulement si une transaction suffit. Permit EIP-2612, DAI et Permit2 signé : plusieurs étapes, pas de bouton. Jamais joué devant un vrai portefeuille. Dans le code le bouton s'appelle encore « Révoquer » : « Retirer l'autorisation » est le mot du système de design, et l'écran montré est celui du système de design. Étapes officielles après un vol, lues sur les pages officielles : research/titouan/T_banc_e2e/INCIDENT/INCIDENT_ETAPES.md.",
 "Deux mesures différentes, ne pas les mélanger. (1) Extension, réserve scellée (preuves/RESULTAT_RESERVE_MOTS.md, commit 61dbe40) : preuves/panel/RESERVE.jsonl, 2 673 paires, ouverte une fois le 11 oct. 2026. Demandes non conformes : 1 789, dont 1 334 attrapées (74,6 %), 0 laissée passer sans alerte, 455 en « je n'ai pas pu vérifier » (25,4 %). Demandes conformes : 515, dont 190 « ça correspond », 71 fausses alertes (13,8 % des conformes, 27,2 % des conformes vérifiées), 254 en « pas pu vérifier ». Réserves : lecture de la phrase par mots-clés seulement, le bras avec Clef n'a pas été terminé ; build 6b9de2f, d'avant le nouvel habillage ; un fichier du code de décision était modifié hors commit au lancement ; la réserve est consommée. (2) Moteur de comparaison côté serveur, jeu aveugle de 250 cas (150 arnaques, 100 jumeaux honnêtes) : 87,3 % signalées avec la phrase, 64,7 % sans, faux rouges 15,0 % pour un seuil fixé avant à 10 %, manqué ; auteur des cas : une IA de la même famille que celle qui nous a aidés. Ne jamais dire « l'extension attrape 87 % ». Ne pas citer A11 ni A12 de CHIFFRES.md.",
 "La testeuse est un agent qui joue une personne prudente, au clavier : 36 parcours, piégée 4 fois en appuyant sur Continuer, actif tout de suite sur « Ça ne correspond pas » (capture réelle de l'extension, coord/reports/testeurs/3_captures/s05_08_f1_continuer_actif.png). Corrigé dans le commit b42792d : le geste attend, la demande expire à 3 minutes. Tests unitaires de l'extension rejoués le 11 oct. à 10h49 sur l'arbre de travail : 225 tests, 213 réussis, 12 en échec ; ne pas citer « 217 tests » sans le rejouer. Sur 58 paires d'essai : 18 contrôlées, 7 en partie, 20 non, 13 non distinguées (EXHAUSTIVITE_INTENTION.md). Hors périmètre : fraude voulue, Ledger direct, téléphone. Jamais essayé avec un vrai MetaMask. Ne pas dire « sécurisé ».",
 "Modèle économique de Titouan (commit bf06f8b, repris dans README.md, PRODUCT.md, FICHE_DEFENSE.md, PITCH_5MIN.md, PITCH_3MIN.md, QR_JURY.md), à dire tel quel : « Gratuit pour les personnes. Plus tard, une plateforme qui demande l'autorisation exacte (50 USDC pour un échange de 50, pas tout, pour toujours) pourra afficher Vérifié par Hold up. C'est elle qui paie. Critères publics, mesurés sur ses vraies demandes, pas de classement payé. » Hypothèse à valider avec des pilotes : aucun client, aucun revenu aujourd'hui, jamais présentée comme un revenu existant. Ne pas dire « certification » (étude : research/titouan/BM2/BM_LABEL.md).",
 "Modèle : gratuit pour la personne. Paient ceux qui portent la perte : API « verdict avant retrait » pour exchanges et fintechs ; licence SDK pour portefeuilles ; mandats pour agents qui dépensent (prospectif, à 2 ans). Piste étudiée (BM_LABEL.md) : mesurer les plateformes qui ne demandent que le nécessaire ; la mesure est gratuite, publique, et ne s'achète pas. Ne pas dire « certification ». Prix : hypothèses, aucun client. Pilotes recherchés. Promesse de Titouan : cesser de donner plus que nécessaire. Fin d'Adem : on ne sait pas quel site sera piraté, on décide de ce qu'on lui laisse."
];

// Grille
const M = 0.7, W = 10 - 2 * M, G = 0.3, COL = (W - 5 * G) / 6;
const cx = (i) => M + i * (COL + G);          // x de la colonne i (0 à 5)
const cw = (n) => n * COL + (n - 1) * G;      // largeur de n colonnes
const TOP = 0.8;

// Espaces insécables : « Hold up », guillemets, ponctuation double, nombres, monnaie.
const nb = (t) => t
  .replace(/Hold up/g, 'Hold up')
  .replace(/« /g, '« ').replace(/ »/g, ' »')
  .replace(/ ([?:!;])/g, ' $1')
  .replace(/(\d) (\d{3})\b/g, '$1 $2')
  .replace(/(\d) (USDC)/g, '$1 $2')
  .replace(/(\d,\d) (millions)/g, '$1 $2')
  .replace(/de fin\b/g, 'de fin');
const fix = (t) => (typeof t === 'string' ? nb(t) : t.map((r) => Object.assign({}, r, { text: nb(r.text) })));

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625
pres.title = 'Hold up';
pres.author = 'Adem et Titouan';
pres.defineSlideMaster({ title: 'HOLDUP', background: { color: PAGE } });

function txt(s, t, x, y, w, h, o) {
  const base = { x, y, w, h, fontFace: F, fontSize: 16, color: INK, margin: 0, valign: 'top', align: 'left', isTextBox: true, lineSpacingMultiple: 1.15, fit: 'none' };
  s.addText(fix(t), Object.assign(base, o || {}));
}
const semi = (o) => Object.assign({ fontFace: FB }, o || {});
const title = (s, t, w) => txt(s, t, M, TOP, w || W, 1.0, semi({ fontSize: 28, lineSpacingMultiple: 1.0 }));
const body = (s, t, x, y, w, h, o) => txt(s, t, x, y, w, h, Object.assign({ color: INK2 }, o || {}));
const huge = (s, t, x, y, w, size) => txt(s, t, x, y, w, size / 72 * 1.1, semi({ fontSize: size, lineSpacingMultiple: 0.9 }));

let n = 0;
function slide(repo) {
  const s = pres.addSlide({ masterName: 'HOLDUP' });
  txt(s, 'Dans le dépôt : ' + repo, M, 4.85, W, 0.4, { fontSize: 11, color: INK3, valign: 'bottom', lineSpacingMultiple: 1.1 });
  s.addNotes(NOTES[n++]);
  return s;
}

// 1 Le postulat : un chiffre, une phrase, deux lignes grises. Bloc centré optiquement.
{
  const s = slide('research/demo_reelle/RECHERCHE_douleurs_secondaires.md, research/titouan/Z_approbations/onchain/result_avax.json');
  huge(s, '153', M, 0.6, W, 120);
  txt(s, 'portefeuilles vidés chez LI.FI en juillet 2024 : 11,6 millions de dollars.', M, 2.4, W, 1.0, semi({ fontSize: 28, lineSpacingMultiple: 1.0 }));
  body(s, [
    { text: 'Tous avaient laissé une autorisation illimitée. Ceux qui l’avaient limitée n’ont rien perdu.', options: { breakLine: true } },
    { text: 'Sur Avalanche, une autorisation sur trois est illimitée.' },
  ], M, 3.6, W, 1.0, { paraSpaceAfter: 6 });
}

// 2 Le produit : deux écrans à droite, titre en haut à gauche, le geste en bas à gauche.
{
  const s = slide('docs/design/system/planche.html (écrans du système de design, en cours d’intégration dans l’extension)');
  const h = 3.3, w = h * 426 / 503, y = TOP + 0.05;
  const x2 = 10 - M - w, x1 = x2 - 0.3 - w;
  s.addImage({ path: path.join(CAP, 'q-frappe.png'), x: x1, y, w, h });
  s.addImage({ path: path.join(CAP, 'n-duree.png'), x: x2, y, w, h });
  const lw = x1 - M - 0.3;
  title(s, 'Tu écris.\nJe compare.\nTu décides.', lw);
  txt(s, [
    { text: 'Tu choisis.', options: { fontFace: FB, color: INK, breakLine: true, paraSpaceAfter: 4 } },
    { text: 'Ne rien envoyer. Ou limiter l’autorisation à 50 USDC, puis envoyer.', options: { color: INK2, breakLine: true, paraSpaceAfter: 10 } },
    { text: 'Rien ne part tout seul.', options: { color: INK2 } },
  ], M, y + h - 2.0, lw, 2.0, { valign: 'bottom', lineSpacingMultiple: 1.05 });
}

// 3 La scène prouvée : titre, trois temps, puis le résultat sur deux colonnes.
{
  const s = slide('research/demo_reelle/site_echange/test/preuve_piratage.mjs (chaîne locale, compte de test)');
  title(s, 'Tu échanges 50 USDC.\nPlus tard, le site est piraté.');
  const steps = [
    ['1', 'Tu as 100 USDC. Tu en échanges 50 sur un site honnête.'],
    ['2', 'Pour le faire, le site te demande l’accès à tout ton USDC, sans date de fin.'],
    ['3', 'Plus tard, ce site est piraté. Il te restait 50 USDC.'],
  ];
  steps.forEach((c, i) => {
    const x = cx(2 * i);
    txt(s, c[0], x, 2.0, 0.3, 0.3, semi({}));
    body(s, c[1], x + 0.3, 2.0, cw(2) - 0.2, 1.0);
  });
  [['Sans Hold up, il te reste', '0 USDC', 0], ['Avec Hold up, il te reste', '50 USDC', 3]].forEach(([l, v, c]) => {
    body(s, l, cx(c), 3.5, cw(3), 0.3);
    huge(s, v, cx(c), 3.85, cw(3), 54);
  });
}

// 4 Après l'alerte : le panneau latéral à droite.
{
  const s = slide('research/titouan/T_banc_e2e/extension/revoke.js, tests/unit/revoke.test.mjs');
  const h = 3.7, w = h * 362 / 682, y = TOP + 0.05;
  s.addImage({ path: path.join(CAP, 'pan-ouvert_sombre.png'), x: 10 - M - w, y, w, h });
  title(s, 'Une autorisation déjà donnée ?\nTu la retires.', 5.6);
  body(s, 'Je prépare le retrait. Ton portefeuille le signe. Hold up ne signe jamais.', M, y + h - 1.0, 4.6, 1.0, { valign: 'bottom' });
}

// 5 La mesure sur l'extension : deux chiffres sur deux colonnes de trois.
{
  const s = slide('preuves/RESULTAT_RESERVE_MOTS.md');
  title(s, 'Ce que l’extension a trouvé');
  huge(s, '1 334', cx(0), 1.7, cw(3), 80);
  body(s, 'demandes piégées attrapées, sur 1 789. Aucune n’est passée sans alerte.', cx(0), 2.95, cw(3) - 0.2, 0.9);
  huge(s, '14 %', cx(3), 1.7, cw(3), 80);
  body(s, 'de fausses alertes : 71 demandes honnêtes sur 515.', cx(3), 2.95, cw(3) - 0.2, 0.9);
  body(s, 'Banc d’essai scellé, ouvert une seule fois.', M, 4.2, W, 0.3);
}

// 6 Ce qui ne marche pas encore : texte à gauche, capture à droite.
{
  const s = slide('coord/reports/testeurs/3_prudente_clavier.md, preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md');
  const h = 3.3, w = h * 422 / 493, y = TOP + 0.05;
  const x = 10 - M - w;
  s.addImage({ path: path.join(ROOT, 'coord', 'reports', 'testeurs', '3_captures', 's05_08_f1_continuer_actif.png'), x, y, w, h });
  body(s, 'L’extension, pendant l’essai.', x, y + h + 0.12, w, 0.3, { fontSize: 14 });
  const lw = x - M - 0.5;
  title(s, '36 parcours. Notre testeuse\ns’est fait piéger 4 fois.', lw + 0.4);
  body(s, 'Les 4 fois : « Continuer » malgré l’alerte. La testeuse est un agent qui joue une personne prudente.', M, 1.95, lw, 1.0);
  txt(s, 'Ce que Hold up ne fait pas encore', M, 3.2, lw, 0.3, semi({}));
  body(s, [
    { text: 'Je ne vérifie pas ce que tu reçois en échange.', options: { breakLine: true } },
    { text: 'Je ne couvre ni un Ledger en direct, ni le téléphone.' },
  ], M, 3.55, lw, 1.0, { paraSpaceAfter: 6 });
}

// 7 Qui paie : deux colonnes de trois.
{
  const s = slide('README.md, livrables/PITCH_5MIN.md, research/titouan/BM2/BM_LABEL.md');
  title(s, 'Qui paie ?');
  body(s, 'Pour toi', cx(0), 1.6, cw(3), 0.3);
  huge(s, 'gratuit', cx(0), 1.95, cw(3), 66);
  body(s, 'L’extension ne coûte rien aux personnes.', cx(0), 3.2, cw(3) - 0.2, 0.9);
  body(s, 'Pour les sites', cx(3), 1.6, cw(3), 0.3);
  huge(s, 'payant', cx(3), 1.95, cw(3), 66);
  body(s, 'Un site qui ne te demande que le nécessaire peut afficher « Vérifié par Hold up ». Il paie pour l’afficher.', cx(3), 3.2, cw(3), 1.2);
  body(s, 'Les critères sont publics, le label ne s’achète pas. Aucun client aujourd’hui.', M, 4.4, W, 0.3);
}

// 8 La fin : une phrase, centrée optiquement dans la page.
{
  const s = slide('research/titouan/BM2/BM_MODELE.md, BM_LABEL.md');
  txt(s, 'On ne sait pas quel site sera piraté.\nOn décide de ce qu’on lui laisse.', M, 1.7, W, 1.8, semi({ fontSize: 36, lineSpacingMultiple: 1.1, valign: 'middle' }));
}

pres.writeFile({ fileName: path.join(__dirname, 'holdup_v2.pptx') }).then((f) => console.log('écrit', f));

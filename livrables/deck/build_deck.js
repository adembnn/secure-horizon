// Génère livrables/deck/holdup.pptx (8 slides, système de design Hold up : docs/design/system/DESIGN.md).
// Usage : NODE_PATH=<dossier node_modules contenant pptxgenjs> node livrables/deck/build_deck.js
// Règle du deck : une phrase, une preuve montrée, et sous chaque slide le fichier du dépôt où le jury la vérifie.
// Rien n'est affirmé sans chemin suivi par git. Le détail va dans les notes orateur.
// Design : noir, blanc, deux gris. Police du système, deux graisses. Aucune couleur, aucune carte, aucun filet.
const path = require('path');
const pptxgen = require('pptxgenjs');

const PAGE = '000000', INK = 'FFFFFF', INK2 = 'B3B3B3', INK3 = '808080';
// Police du système de design (tokens.css, --hu-font) : Segoe UI Variable Text, graisses 400 et 600.
const F = 'Segoe UI Variable Text', FB = 'Segoe UI Variable Text Semibold';
const ROOT = path.join(__dirname, '..', '..');
const CAP = path.join(ROOT, 'docs', 'design', 'system', 'captures');
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625
pres.title = 'Hold up';
pres.author = 'Adem et Titouan';

pres.defineSlideMaster({
  title: 'HOLDUP',
  background: { color: PAGE },
  slideNumber: { x: 9.0, y: 5.12, w: 0.5, h: 0.25, fontFace: F, fontSize: 10, color: INK3, align: 'right' },
});

function txt(s, t, x, y, w, h, o) {
  s.addText(t, Object.assign({ x, y, w, h, fontFace: F, fontSize: 16, color: INK, margin: 0, valign: 'top', isTextBox: true }, o || {}));
}
const big = (o) => Object.assign({ fontFace: FB }, o || {});
// Chaque slide : la phrase, puis en pied le chemin du dépôt qui la prouve.
function slide(say, repo, notes, o) {
  const s = pres.addSlide({ masterName: 'HOLDUP' });
  if (say) txt(s, say, 0.5, 0.4, (o && o.w) || 9, 0.6, big({ fontSize: 28 }));
  txt(s, 'Dans le dépôt : ' + repo, 0.5, 5.1, 8.4, 0.25, { fontSize: (o && o.fs) || 11, color: INK2 });
  s.addNotes(notes);
  return s;
}
function bar(s, label, value, pct, y, color) {
  txt(s, label, 0.5, y, 2.6, 0.5, { valign: 'middle', color: INK2 });
  s.addShape(pres.shapes.RECTANGLE, { x: 3.2, y: y + 0.06, w: 5.0 * pct, h: 0.38, fill: { color }, line: { color, width: 0 } });
  txt(s, value, 3.35 + 5.0 * pct, y, 1.4, 0.5, big({ fontSize: 26, valign: 'middle', color }));
}

// 1 Le postulat
{
  const s = slide('', 'research/demo_reelle/RECHERCHE_douleurs_secondaires.md, research/titouan/Z_approbations/onchain/result_avax.json',
    "Trame d'Adem (livrables/pitch_v7/PITCH_ADEM.md, bloc 2). LI.FI, 16 juillet 2024 : 11,6 M$ pris à 153 portefeuilles qui avaient laissé une approbation illimitée, rien aux approbations finies, selon le rapport de LI.FI (li.fi/knowledge-hub/incident-report-16th-july, source éditeur ; CHIFFRES.md B7). À dire si on le demande : le montant fini était déjà le réglage par défaut de LI.FI, les 153 avaient choisi l'illimité ; et c'est sur plusieurs chaînes, pas un chiffre Avalanche. Postulat : tout service en ligne finira par être piraté ; la question devient « qu'est-ce que je lui ai laissé le droit de prendre ce jour-là ». Sur Avalanche C-Chain, 34,2 % [33,6 ; 34,9] des droits de dépense non nuls lus sont illimités (7 103 sur 20 753) : mesure interne, des événements et non des personnes. Ne pas citer Ethereum.", { fs: 10 });
  txt(s, '153', 0.5, 0.6, 9, 2.0, big({ fontSize: 130 }));
  txt(s, 'portefeuilles vidés chez LI.FI en juillet 2024 : 11,6 millions de dollars.', 0.5, 2.85, 9, 0.5, big({ fontSize: 20 }));
  txt(s, 'Tous avaient laissé une autorisation illimitée. Ceux qui l’avaient limitée n’ont rien perdu.', 0.5, 3.45, 9, 0.4, { color: INK2 });
  txt(s, 'Sur Avalanche, une autorisation sur trois est illimitée.', 0.5, 3.95, 9, 0.4, { color: INK2 });
}

// 2 Le produit : les trois écrans
{
  const s = slide('Tu écris. Je compare. Tu décides.', 'docs/design/system/planche.html (écrans du système de design, en cours d’intégration dans l’extension)',
    "Hold up est une extension Chrome posée devant le portefeuille existant. Elle ne tient aucune clé et ne signe rien. La personne écrit ce qu'elle veut faire ; du code lit montant, monnaie et adresse dans la demande et compare. Trois réponses, au mot près : « Ça correspond à ce que tu as écrit. », « Ça ne correspond pas à ce que tu as écrit. », « Je n'ai pas pu vérifier cette demande. ». « Ça correspond » vaut d'après ce que Hold up sait lire : ce n'est pas une garantie. La phrase seule part vers le modèle Clef par un relais local (D-015) ; le modèle ne lit ni montants ni adresses et ne peut pas baisser une alerte du code. Chaque décision est écrite dans un cahier chaîné par hachage. Règle décidée par Adem le 11 oct. : une demande illimitée donne « Ça ne correspond pas », le gant, et le geste « Limiter à 50 USDC et envoyer » ; plus aucune limitation ni départ automatiques. Les deux écrans montrés sont ceux du système de design (planche), pas l'extension livrée ; le libellé du geste sur la capture (« Envoyer quand même ») est celui de la planche, pas encore tous appliqués au code : l'interface actuelle de l'extension est visible slide 7. Ne pas dire « l'échange est vérifié », « rien ne quitte la machine », « sécurisé ».");
  ['q-frappe.png', 'n-duree.png'].forEach((f, i) => {
    s.addImage({ path: path.join(CAP, f), x: 0.5 + i * 3.25, y: 1.2, w: 3.05, h: 3.6 });
  });
  txt(s, 'Tu choisis.', 7.1, 1.2, 2.4, 0.4, big({ fontSize: 18 }));
  txt(s, 'Ne rien envoyer. Ou limiter l’autorisation à 50 USDC, puis envoyer.', 7.1, 1.7, 2.4, 1.4, { color: INK2 });
  txt(s, 'Rien ne part tout seul.', 7.1, 3.2, 2.4, 0.5, { color: INK2 });
}

// 3 La scène prouvée
{
  const s = slide('Tu échanges 50 USDC. Plus tard, le site est piraté.', 'research/demo_reelle/site_echange/test/preuve_piratage.mjs (chaîne locale, compte de test)',
    "Scène prouvée sur la chaîne (livrables/pitch_v7/DEMO_DEROULE.md, H2 et H3) : site honnête qui demande l'illimité, piraté plus tard. Le compte part de 100 USDC. Sans Hold up : 50 après l'échange, puis 0 après le piratage. Avec : autorisation limitée à 50 par le geste « Limiter à 50 USDC et envoyer », consommée par l'échange, le compte garde 50. Le parcours avec Hold up est joué dans un vrai Chromium (film_scene.mjs), le « sans » sur la chaîne seulement. Le script demande une chaîne locale déployée (npm run demo:deploy -- --network localhost) : le jury ne le rejoue pas en une commande. Copie locale d'Avalanche, rien sur Fuji (D-016).");
  const steps = [
    ['1', 'Tu as 100 USDC. Tu en échanges 50 sur un site honnête.'],
    ['2', 'Pour le faire, le site te demande l’accès à tout ton USDC, sans date de fin.'],
    ['3', 'Plus tard, ce site est piraté. Il te restait 50 USDC.'],
  ];
  steps.forEach((c, i) => {
    const x = 0.5 + i * 3.1;
    txt(s, c[0], x, 1.25, 0.35, 0.4, big({ fontSize: 18 }));
    txt(s, c[1], x + 0.35, 1.27, 2.45, 0.9, { fontSize: 14, color: INK2 });
  });
  txt(s, 'Sans Hold up, il te reste', 0.5, 2.55, 4.2, 0.35, { color: INK2 });
  txt(s, '0 USDC', 0.5, 2.9, 4.3, 1.0, big({ fontSize: 60 }));
  txt(s, 'Le pirate se sert de l’accès illimité.', 0.5, 4.05, 4.2, 0.4, { fontSize: 14, color: INK2 });
  txt(s, 'Avec Hold up, il te reste', 5.3, 2.55, 4.2, 0.35, { color: INK2 });
  txt(s, '50 USDC', 5.3, 2.9, 4.3, 1.0, big({ fontSize: 60 }));
  txt(s, 'Tu avais limité l’accès aux 50 de l’échange. Il n’y a plus rien à prendre.', 5.3, 4.05, 4.2, 0.6, { fontSize: 14, color: INK2 });
}

// 4 Après l'alerte
{
  const s = slide('Une autorisation déjà donnée ?\nTu la retires.', 'research/titouan/T_banc_e2e/extension/revoke.js, tests/unit/revoke.test.mjs',
    "La révocation est branchée dans l'extension, panneau latéral (messages hu.revoke.*, extension/REVOKE_BRANCHEMENT.md). Hold up prépare la demande de retrait (approve à 0, setApprovalForAll false, Permit2 approve à 0) ; le portefeuille la signe, jamais Hold up. Un clic seulement si une transaction suffit. Permit EIP-2612, DAI et Permit2 signé : plusieurs étapes, pas de bouton. Jamais joué devant un vrai portefeuille. Dans le code le bouton s'appelle encore « Révoquer » : « Retirer l'autorisation » est le mot du système de design, et l'écran montré est celui du système de design. Étapes officielles après un vol, lues sur les pages officielles : research/titouan/T_banc_e2e/INCIDENT/INCIDENT_ETAPES.md.", { w: 5.6 });
  txt(s, 'Je prépare le retrait. Ton portefeuille le signe. Hold up ne signe jamais.', 0.5, 1.75, 5.2, 0.9, { fontSize: 18, color: INK2 });
  txt(s, 'Jamais joué devant un vrai portefeuille.', 0.5, 4.35, 5.2, 0.4, { color: INK2 });
  s.addImage({ path: path.join(CAP, 'pan-ouvert_sombre.png'), x: 6.6, y: 0.4, w: 2.39, h: 4.5 });
}

// 6 Les deux mesures
{
  const s = slide('Mesuré : l’extension, et le moteur de comparaison', 'preuves/RESULTAT_RESERVE_MOTS.md, research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md',
    "Deux mesures différentes, ne pas les mélanger. (1) Extension, réserve scellée (preuves/RESULTAT_RESERVE_MOTS.md, commit 61dbe40) : preuves/panel/RESERVE.jsonl, 2 673 paires, ouverte une fois le 11 oct. 2026. Demandes non conformes : 1 789, dont 1 334 attrapées (74,6 %), 0 laissée passer sans alerte, 455 en « je n'ai pas pu vérifier » (25,4 %). Demandes conformes : 515, dont 190 « ça correspond », 71 fausses alertes (13,8 % des conformes, 27,2 % des conformes vérifiées), 254 en « pas pu vérifier ». Réserves : lecture de la phrase par mots-clés seulement, le bras avec Clef n'a pas été terminé ; build 6b9de2f, d'avant le nouvel habillage ; un fichier du code de décision était modifié hors commit au lancement ; la réserve est consommée. (2) Moteur de comparaison côté serveur, jeu aveugle de 250 cas (150 arnaques, 100 jumeaux honnêtes) : 87,3 % signalées avec la phrase, 64,7 % sans, faux rouges 15,0 % pour un seuil fixé avant à 10 %, manqué ; auteur des cas : une IA de la même famille que celle qui nous a aidés. Ne jamais dire « l'extension attrape 87 % ». Ne pas citer A11 ni A12 de CHIFFRES.md.", { fs: 10 });
  const rows = (x, list, y0) => list.forEach((r, i) => {
    const y = y0 + i * 0.58;
    txt(s, r[0], x, y, 1.25, 0.5, big({ fontSize: 26, valign: 'middle' }));
    txt(s, r[1], x + 1.3, y, 2.95, 0.5, { fontSize: 13, color: INK2, valign: 'middle' });
  });
  txt(s, 'L’extension', 0.5, 1.2, 4.2, 0.35, big({ fontSize: 18 }));
  txt(s, 'Réserve scellée, 2 673 paires, ouverte une fois.', 0.5, 1.58, 4.2, 0.3, { fontSize: 13, color: INK2 });
  rows(0.5, [
    ['75 %', 'des demandes non conformes attrapées (1 334 sur 1 789)'],
    ['0', 'laissée passer sans alerte'],
    ['25 %', '« Je n’ai pas pu vérifier »'],
    ['14 %', 'de fausses alertes (71 sur 515 demandes conformes)'],
  ], 2.0);
  txt(s, 'Le moteur de comparaison', 5.3, 1.2, 4.2, 0.35, big({ fontSize: 18 }));
  txt(s, 'Jeu aveugle de 250 cas, écrits sans voir nos règles.', 5.3, 1.58, 4.2, 0.3, { fontSize: 13, color: INK2 });
  rows(5.3, [
    ['87 %', 'des arnaques signalées avec la phrase'],
    ['65 %', 'sans la phrase'],
    ['15 %', 'd’opérations honnêtes arrêtées à tort (seuil fixé avant : 10 %)'],
  ], 2.0);
  txt(s, 'Extension mesurée sans modèle (mots-clés seuls), sur le build 6b9de2f d’avant le nouvel habillage, avec un fichier de décision modifié hors commit.', 0.5, 4.42, 9, 0.5, { fontSize: 12, color: INK2 });
}

// 7 Ce qui ne marche pas encore
{
  const s = slide('36 parcours. Notre testeuse\ns’est fait piéger 4 fois.', 'coord/reports/testeurs/3_prudente_clavier.md, preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md',
    "La testeuse est un agent qui joue une personne prudente, au clavier : 36 parcours, piégée 4 fois en appuyant sur Continuer, actif tout de suite sur « Ça ne correspond pas » (capture réelle de l'extension, coord/reports/testeurs/3_captures/s05_08_f1_continuer_actif.png). Corrigé dans le commit b42792d : le geste attend, la demande expire à 3 minutes. Tests unitaires de l'extension rejoués le 11 oct. à 10h49 sur l'arbre de travail : 225 tests, 213 réussis, 12 en échec ; ne pas citer « 217 tests » sans le rejouer. Sur 58 paires d'essai : 18 contrôlées, 7 en partie, 20 non, 13 non distinguées (EXHAUSTIVITE_INTENTION.md). Hors périmètre : fraude voulue, Ledger direct, téléphone. Jamais essayé avec un vrai MetaMask. Ne pas dire « sécurisé ».", { w: 5.6 });
  txt(s, 'Les 4 fois, elle avait lu « Ça ne correspond pas » et appuyé sur « Continuer » quand même. Jamais piégée sans ce geste. La testeuse est un agent qui joue une personne prudente, au clavier.', 0.5, 1.6, 5.4, 1.2, { fontSize: 14, color: INK2 });
  txt(s, 'Ce que Hold up ne fait pas encore', 0.5, 2.95, 5.4, 0.4, big({ fontSize: 18 }));
  txt(s, [
    { text: 'Je ne vérifie pas ce que tu reçois en échange.', options: { breakLine: true } },
    { text: 'Je ne couvre ni un Ledger en direct, ni le téléphone.' },
  ], 0.5, 3.45, 5.4, 1.5, { color: INK2, paraSpaceAfter: 8 });
  s.addImage({ path: path.join(ROOT, 'coord', 'reports', 'testeurs', '3_captures', 's05_08_f1_continuer_actif.png'), x: 6.3, y: 0.5, w: 3.2, h: 3.74 });
  txt(s, 'L’extension, pendant l’essai.', 6.3, 4.4, 3.2, 0.3, { fontSize: 12, color: INK2 });
}

// 8 La fin
{
  const s = slide('', 'research/titouan/BM2/BM_MODELE.md, BM_LABEL.md',
    "Modèle : gratuit pour la personne. Paient ceux qui portent la perte : API « verdict avant retrait » pour exchanges et fintechs ; licence SDK pour portefeuilles ; mandats pour agents qui dépensent (prospectif, à 2 ans). Piste étudiée (BM_LABEL.md) : mesurer les plateformes qui ne demandent que le nécessaire ; la mesure est gratuite, publique, et ne s'achète pas. Ne pas dire « certification ». Prix : hypothèses, aucun client. Pilotes recherchés. Promesse de Titouan : cesser de donner plus que nécessaire. Fin d'Adem : on ne sait pas quel site sera piraté, on décide de ce qu'on lui laisse.");
  txt(s, "On ne sait pas quel site sera piraté.\nOn décide de ce qu'on lui laisse.", 0.5, 1.9, 9, 1.6, big({ fontSize: 40 }));
}

pres.writeFile({ fileName: path.join(__dirname, 'holdup.pptx') }).then((f) => console.log('écrit', f));

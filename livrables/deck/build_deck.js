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
  txt(s, 'Dans le dépôt : ' + repo, 0.5, 5.1, 8.4, 0.25, { fontSize: 11, color: INK2 });
  s.addNotes(notes);
  return s;
}
function bar(s, label, value, pct, y, color) {
  txt(s, label, 0.5, y, 2.6, 0.5, { valign: 'middle', color: INK2 });
  s.addShape(pres.shapes.RECTANGLE, { x: 3.2, y: y + 0.06, w: 5.0 * pct, h: 0.38, fill: { color }, line: { color, width: 0 } });
  txt(s, value, 3.35 + 5.0 * pct, y, 1.4, 0.5, big({ fontSize: 26, valign: 'middle', color }));
}

// 1 Le constat
{
  const s = slide('', 'research/titouan/Z_approbations/onchain/result_avax.json',
    "Deux fenêtres, le même site, l'un piraté : à l'œil, impossible à dire. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre. Sur Avalanche C-Chain, 34,2 % [33,6 ; 34,9] des droits de dépense non nuls lus sont illimités (7 103 sur 20 753, 40 fenêtres de 500 blocs) : mesure interne, des événements et non des personnes, non représentative. Dire « une sur trois », jamais « la norme ». Nous adressons Avalanche : ne pas citer Ethereum. Méthode : Z4_illimite_par_plateforme.md dans le même dossier ; livrables/CHIFFRES.md B1.");
  txt(s, '34 %', 0.5, 0.9, 9, 2.0, big({ fontSize: 130 }));
  txt(s, 'des autorisations de dépense lues sur Avalanche sont illimitées.', 0.5, 3.15, 9, 0.5, big({ fontSize: 20 }));
  txt(s, 'Une sur trois. Notre mesure, sur un échantillon de blocs.', 0.5, 3.75, 9, 0.4, { color: INK2 });
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
  const s = slide('Le même site, piraté plus tard', 'research/demo_reelle/site_echange/test/preuve_piratage.mjs (chaîne locale, compte de test)',
    "Scène prouvée sur la chaîne (livrables/pitch_v7/DEMO_DEROULE.md, H2 et H3) : site honnête qui demande l'illimité, piraté plus tard. Sans Hold up : 100, 50 après l'échange, puis 0. Avec : autorisation ramenée à 50, consommée par l'échange, le compte garde 50. Le parcours avec Hold up est joué dans un vrai Chromium (film_scene.mjs), le « sans » sur la chaîne seulement. Le script demande une chaîne locale déployée (npm run demo:deploy -- --network localhost) : le jury ne le rejoue pas en une commande. Copie locale d'Avalanche, rien sur Fuji (D-016). Phrase exacte : « sans Hold up il te reste zéro, avec Hold up tu gardes 50 ».");
  txt(s, 'Sans Hold up', 0.5, 1.45, 4.2, 0.4, { color: INK2 });
  txt(s, '50 → 0', 0.5, 1.85, 4.3, 1.5, big({ fontSize: 64 }));
  txt(s, 'Autorisation illimitée : le pirate vide le compte.', 0.5, 3.2, 4.0, 0.8, { color: INK2 });
  txt(s, 'Avec Hold up', 5.3, 1.45, 4.2, 0.4, { color: INK2 });
  txt(s, '50 → 50', 5.3, 1.85, 4.3, 1.5, big({ fontSize: 64 }));
  txt(s, 'Autorisation limitée à 50 USDC, consommée par l’échange : rien à prendre.', 5.3, 3.2, 4.0, 0.8, { color: INK2 });
}

// 4 Après l'alerte
{
  const s = slide('Une autorisation déjà donnée ?\nTu la retires.', 'research/titouan/T_banc_e2e/extension/revoke.js, tests/unit/revoke.test.mjs',
    "La révocation est branchée dans l'extension, panneau latéral (messages hu.revoke.*, extension/REVOKE_BRANCHEMENT.md). Hold up prépare la demande de retrait (approve à 0, setApprovalForAll false, Permit2 approve à 0) ; le portefeuille la signe, jamais Hold up. Un clic seulement si une transaction suffit. Permit EIP-2612, DAI et Permit2 signé : plusieurs étapes, pas de bouton. Jamais joué devant un vrai portefeuille. Dans le code le bouton s'appelle encore « Révoquer » : « Retirer l'autorisation » est le mot du système de design, et l'écran montré est celui du système de design. Étapes officielles après un vol, lues sur les pages officielles : research/titouan/T_banc_e2e/INCIDENT/INCIDENT_ETAPES.md.", { w: 5.6 });
  txt(s, 'Je prépare le retrait. Ton portefeuille le signe. Hold up ne signe jamais.', 0.5, 1.75, 5.2, 0.9, { fontSize: 18, color: INK2 });
  txt(s, 'Jamais joué devant un vrai portefeuille.', 0.5, 4.35, 5.2, 0.4, { color: INK2 });
  s.addImage({ path: path.join(CAP, 'pan-ouvert_sombre.png'), x: 6.6, y: 0.4, w: 2.39, h: 4.5 });
}

// 5 Le fait
{
  const s = slide('C’est déjà arrivé : LI.FI, juillet 2024', 'livrables/CHIFFRES.md, ligne B7. Rapport : li.fi/knowledge-hub/incident-report-16th-july',
    "LI.FI, 16 juillet 2024 : 11,6 M$ pris à 153 portefeuilles en approbation illimitée, rien aux approbations finies, selon le rapport de LI.FI (source éditeur). Les victimes avaient choisi l'illimité alors que le défaut était fini. Chiffres sur la slide, pas à l'oral (quatre chiffres seulement).");
  txt(s, 'Autorisations illimitées', 0.5, 1.6, 4.3, 0.4, { color: INK2 });
  txt(s, 'vidées', 0.5, 2.0, 4.3, 1.3, big({ fontSize: 60 }));
  txt(s, 'Autorisations limitées', 5.3, 1.6, 4.2, 0.4, { color: INK2 });
  txt(s, 'rien perdu', 5.3, 2.0, 4.3, 1.3, big({ fontSize: 60 }));
  txt(s, '153 portefeuilles, 11,6 M$, selon le rapport de LI.FI.', 0.5, 3.8, 9, 0.4, { color: INK2 });
}

// 6 Jeu aveugle
{
  const s = slide('Jeu aveugle : 250 cas, moteur de comparaison', 'research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md, preuves/ECARTS_LIVRABLES.md',
    "250 cas (150 arnaques, 100 jumeaux honnêtes), écrits sans lire nos règles, sha256 publié, ouverts une fois le 11 oct. 2026, moteur figé. Signalé = avertissement ou rouge. Code seul : 87,3 % [81,1 ; 91,7], faux rouges 15,0 % [9,3 ; 23,3]. Sans phrase : 64,7 %. Critères publiés avant : rappel au moins 80 % atteint, faux rouges au plus 10 % non atteint. 11 des 15 faux rouges : achat NFT à prix quasi nul. Ces chiffres mesurent le moteur de comparaison côté serveur (blind_decalage/run/chaine/), en Node, pas l'extension livrée : ne jamais dire « l'extension attrape 87 % ». Ne pas citer A11 ni A12 de CHIFFRES.md comme mesure du produit (rejoué sur le build réel : 38,2 % et 9,1 %, preuves/ECARTS_LIVRABLES.md). Limite : auteur de la même famille de modèles que ceux qui nous ont aidés ; cas synthétiques. Ne plus citer le 1,3 %.");
  txt(s, 'Arnaques signalées', 0.5, 1.3, 9, 0.35, { fontSize: 14, color: INK2 });
  bar(s, 'Sans la phrase', '65 %', 0.647, 1.7, INK3);
  bar(s, 'Avec la phrase', '87 %', 0.873, 2.25, INK);
  txt(s, 'Opérations honnêtes arrêtées à tort', 0.5, 3.05, 9, 0.35, { fontSize: 14, color: INK2 });
  bar(s, 'Seuil fixé avant', '10 %', 0.10, 3.45, INK3);
  bar(s, 'Mesuré : seuil manqué', '15 %', 0.15, 4.0, INK);
}

// 7 Ce qui ne marche pas encore
{
  const s = slide('Notre testeuse s’est fait\npiéger 4 fois', 'coord/reports/testeurs/3_prudente_clavier.md, preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md',
    "La testeuse est un agent qui joue une personne prudente, au clavier : 36 parcours, piégée 4 fois en appuyant sur Continuer, actif tout de suite sur « Ça ne correspond pas » (capture réelle de l'extension, coord/reports/testeurs/3_captures/s05_08_f1_continuer_actif.png). Corrigé dans le commit b42792d : le geste attend, la demande expire à 3 minutes. Tests unitaires de l'extension rejoués le 11 oct. à 10h49 sur l'arbre de travail : 225 tests, 213 réussis, 12 en échec ; ne pas citer « 217 tests » sans le rejouer. Sur 58 paires d'essai : 18 contrôlées, 7 en partie, 20 non, 13 non distinguées (EXHAUSTIVITE_INTENTION.md). Hors périmètre : fraude voulue, Ledger direct, téléphone. Jamais essayé avec un vrai MetaMask. Ne pas dire « sécurisé ».", { w: 5.6 });
  txt(s, 'Un agent qui joue une personne prudente, au clavier. « Continuer » était actif tout de suite. Corrigé depuis.', 0.5, 1.75, 5.2, 1.0, { color: INK2 });
  txt(s, 'Ce que Hold up ne fait pas encore', 0.5, 2.95, 5.4, 0.4, big({ fontSize: 18 }));
  txt(s, [
    { text: 'Je ne vérifie pas ce que tu reçois en échange.', options: { breakLine: true } },
    { text: 'Je n’ai jamais été essayé devant un vrai MetaMask.', options: { breakLine: true } },
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

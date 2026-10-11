// Génère livrables/deck/holdup.pptx (9 slides, pitch V7 : fusion Adem et Titouan, jeu aveugle).
// Usage : NODE_PATH=<dossier node_modules contenant pptxgenjs> node livrables/deck/build_deck.js
// Chiffres : livrables/CHIFFRES.md seulement. Quatre chiffres à l'oral : 48 %, 87 %, 65 %, 15 %.
const path = require('path');
const pptxgen = require('pptxgenjs');

const INK = '000000', MUTED = '595959', LINE = 'E2E2E2', RED = 'D92D20', BG = 'FFFFFF', TINT = 'F5F5F5';
const F = 'Arial';
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625
pres.title = 'Hold up';
pres.author = 'Adem et Titouan';

pres.defineSlideMaster({
  title: 'HOLDUP',
  background: { color: BG },
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.25, fontFace: F, fontSize: 10, color: MUTED },
  objects: [{ text: { text: 'Hold up', options: { x: 0.5, y: 5.2, w: 3, h: 0.25, fontFace: F, fontSize: 10, color: MUTED, margin: 0 } } }],
});

function slide(title, notes, tsize) {
  const s = pres.addSlide({ masterName: 'HOLDUP' });
  s.addText(title, { x: 0.5, y: 0.35, w: 9, h: 0.95, fontFace: F, fontSize: tsize || 30, bold: true, color: INK, valign: 'top', margin: 0, isTextBox: true });
  s.addNotes(notes);
  return s;
}
function box(s, x, y, w, h, fill, line) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: line || fill, width: 0.75 } });
}
function txt(s, t, x, y, w, h, o) {
  s.addText(t, Object.assign({ x, y, w, h, fontFace: F, fontSize: 14, color: INK, margin: 0, valign: 'top', isTextBox: true }, o || {}));
}
function bar(s, label, value, pct, y, color) {
  txt(s, label, 0.5, y, 2.6, 0.45, { fontSize: 14, valign: 'middle' });
  box(s, 3.2, y + 0.05, 5.0 * pct, 0.35, color);
  txt(s, value, 3.3 + 5.0 * pct, y, 1.2, 0.45, { fontSize: 20, bold: true, valign: 'middle', color });
}
const bullets = (arr) => arr.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < arr.length - 1 } }));

// 1 Postulat
{
  const s = slide('Tout service peut être compromis', "Deux fenêtres, le même site, l'un piraté : à l'œil, impossible à dire. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre. 47,6 % des droits de dépense non nuls lus dans un échantillon de blocs Ethereum sont illimités (34,2 % sur Avalanche C-Chain), mesure interne, des événements et non des personnes, non représentative ; dire 48 % à l'oral, jamais « la norme ». Source : livrables/CHIFFRES.md B1.");
  box(s, 0.5, 1.5, 4.3, 3.4, TINT, LINE);
  txt(s, 'Neve (site fictif)', 0.75, 1.7, 3.8, 0.3, { fontSize: 12, color: MUTED });
  txt(s, 'Échanger 50 USDC contre AVAX', 0.75, 2.1, 3.8, 0.7, { fontSize: 20, bold: true });
  txt(s, 'Le site demande : le droit de dépenser tout votre USDC, sans date de fin.', 0.75, 2.95, 3.8, 0.8, { fontSize: 14, color: MUTED });
  txt(s, '48 %', 5.3, 1.5, 4.2, 1.0, { fontSize: 60, bold: true, color: RED });
  txt(s, 'des droits de dépense lus sur Ethereum sont illimités. Mesure interne, échantillon de blocs.', 5.3, 2.6, 4.2, 0.8, { fontSize: 14 });
  txt(s, "Un double de toutes les clés de la maison, donné au plombier.", 5.3, 3.6, 4.2, 0.8, { fontSize: 16, bold: true });
}

// 2 Produit
{
  const s = slide('Écrire, comparer, laisser décider', "Hold up est une extension Chrome posée devant le portefeuille existant. Elle ne tient aucune clé et ne signe rien. La personne écrit ce qu'elle veut faire ; du code lit montant, jeton et adresse dans la demande et compare. Trois réponses : « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. », « Ça ne correspond pas » (Annuler visible), « Je n'ai pas pu vérifier ». Règles de base indépendantes de la phrase. D'après le code public de MetaMask, « illimité » est affiché sans alerte propre pour une adresse non listée comme malveillante, et rien ne le rapproche de ce que la personne voulait donner.");
  box(s, 0.5, 1.5, 2.8, 1.2, TINT, LINE);
  txt(s, "1. J'écris", 0.65, 1.6, 2.5, 0.3, { fontSize: 13, bold: true });
  txt(s, 'échanger 50 USDC contre AVAX', 0.65, 2.0, 2.5, 0.6, { fontSize: 14 });
  box(s, 3.6, 1.5, 2.8, 1.2, TINT, LINE);
  txt(s, '2. La demande arrive', 3.75, 1.6, 2.5, 0.3, { fontSize: 13, bold: true });
  txt(s, "droit sur tout l'USDC", 3.75, 2.0, 2.5, 0.6, { fontSize: 14 });
  box(s, 6.7, 1.5, 2.8, 1.2, BG, RED);
  txt(s, '3. Hold up', 6.85, 1.6, 2.5, 0.3, { fontSize: 13, bold: true, color: RED });
  txt(s, 'Ça ne correspond pas à ce que tu as écrit.', 6.85, 2.0, 2.5, 0.6, { fontSize: 14, bold: true, color: RED });
  txt(s, bullets(['Correspond : « d’après ce que Hold up sait lire ». Pas une garantie.', 'Ne correspond pas : une ligne d’explication, Annuler visible, droit ramené au montant écrit.', 'Règles de base, même sans phrase : droit illimité vers une adresse inconnue, prise de contrôle d’un coffre.']), 0.5, 3.0, 9, 1.7, { fontSize: 14, paraSpaceAfter: 6 });
  txt(s, 'Pas un portefeuille : aucune clé, aucune signature. La personne garde le dernier geste.', 0.5, 4.8, 9, 0.3, { fontSize: 12, color: MUTED });
}

// 3 La scène
{
  const s = slide('Le même site, piraté', "Scène d'Adem (livrables/pitch_v7/DEMO_DEROULE.md). Vrai Chromium avec l'extension, portefeuille simulé, copie locale d'Avalanche, jetons de démo déclarés à la main. « 100 vers 0 » : script preuve.mjs qui envoie sur la chaîne les mêmes demandes que la page, compte de test neuf (hors navigateur). Avec Hold up : approve ramené à 50 USDC, droit final lu 50 USDC (audit, tableau b). Le droit de 50 part chez le pirate : perte bornée, pas évitée. Ne jamais dire « le pirate ne prend rien ».");
  box(s, 0.5, 1.5, 4.4, 2.6, TINT, LINE);
  txt(s, 'Sans Hold up', 0.7, 1.6, 4.0, 0.4, { fontSize: 18, bold: true });
  txt(s, '100 USDC', 0.7, 2.15, 4.0, 0.6, { fontSize: 32, bold: true });
  txt(s, '0 USDC', 0.7, 2.8, 4.0, 0.6, { fontSize: 32, bold: true, color: RED });
  txt(s, 'Droit illimité signé, le pirate se sert.', 0.7, 3.5, 4.0, 0.5, { fontSize: 13, color: MUTED });
  box(s, 5.1, 1.5, 4.4, 2.6, BG, RED);
  txt(s, 'Avec Hold up', 5.3, 1.6, 4.0, 0.4, { fontSize: 18, bold: true, color: RED });
  txt(s, 'Ça ne correspond pas.', 5.3, 2.15, 4.0, 0.5, { fontSize: 20, bold: true, color: RED });
  txt(s, 'Annuler : rien ne part. Continuer : droit limité à 50 USDC.', 5.3, 2.75, 4.0, 1.2, { fontSize: 15 });
  txt(s, 'Lecture de la chaîne, compte de test, copie locale d’Avalanche, portefeuille simulé.', 0.5, 4.4, 9, 0.4, { fontSize: 12, color: MUTED });
}

// 4 Après l'alerte
{
  const s = slide("Après l'alerte : révoquer en un clic", "Démo web (webdemo/RAPPORT_REVOQUER.md) : portefeuille, transaction et plafond simulés, 25 tests du module, 135 vérifications de la page. Hold up prépare la demande de retrait (approve à 0, setApprovalForAll false, Permit2 approve à 0) ; le portefeuille la signe, jamais Hold up. Un clic seulement si une transaction suffit. Permit EIP-2612, DAI et Permit2 signé : plusieurs étapes, pas de bouton. Non branché dans l'extension (audit, point 7). Fiche d'incident : ce qui a été demandé, montré, décidé ; chaque ligne se rejoue.");
  const cols = [
    ['Révoquer ce droit', 'Hold up prépare le retrait. Ton portefeuille le signe. Hold up ne signe jamais.'],
    ["Fiche d'incident", 'Ce qui a été demandé, ce qui a été montré, ce que tu as décidé.'],
    ['Cahier rejouable', 'Chaque ligne se rejoue. Une ligne changée casse la chaîne.'],
  ];
  cols.forEach((c, i) => {
    const x = 0.5 + i * 3.05;
    box(s, x, 1.5, 2.9, 2.7, TINT, LINE);
    txt(s, c[0], x + 0.15, 1.65, 2.6, 0.5, { fontSize: 17, bold: true });
    txt(s, c[1], x + 0.15, 2.25, 2.6, 1.8, { fontSize: 14 });
  });
  txt(s, 'Démo web, portefeuille simulé. Pas encore dans l’extension. Un Permit signé ne se révoque pas en un clic.', 0.5, 4.45, 9, 0.5, { fontSize: 12, color: MUTED, bold: true });
}

// 5 Le fait
{
  const s = slide('C’est déjà arrivé', "LI.FI, 16 juillet 2024 : 11,6 M$ pris à 153 portefeuilles en approbation illimitée, rien aux approbations finies, selon le rapport de LI.FI (source [A], éditeur). Les victimes avaient choisi l'illimité alors que le défaut était fini. Chiffres sur la slide, pas à l'oral (quatre chiffres seulement). Source : livrables/CHIFFRES.md B7.");
  txt(s, 'LI.FI, juillet 2024 : une faille chez un service honnête.', 0.5, 1.5, 9, 0.6, { fontSize: 22, bold: true });
  box(s, 0.5, 2.3, 4.4, 2.0, BG, RED);
  txt(s, 'Droits illimités', 0.7, 2.45, 4.0, 0.4, { fontSize: 16, bold: true, color: RED });
  txt(s, 'vidés', 0.7, 2.95, 4.0, 0.8, { fontSize: 36, bold: true, color: RED });
  box(s, 5.1, 2.3, 4.4, 2.0, TINT, LINE);
  txt(s, 'Droits limités', 5.3, 2.45, 4.0, 0.4, { fontSize: 16, bold: true });
  txt(s, 'rien perdu', 5.3, 2.95, 4.0, 0.8, { fontSize: 36, bold: true });
  txt(s, '153 portefeuilles, 11,6 M$, selon le rapport de LI.FI.', 0.5, 4.5, 9, 0.4, { fontSize: 12, color: MUTED });
}

// 6 Jeu aveugle
{
  const s = slide('Notre preuve : un jeu aveugle', "250 cas (150 arnaques, 100 jumeaux honnêtes), écrits sans lire nos règles, sha256 publié, ouverts une fois le 11 oct. 2026, moteur figé (74203da, 3 fichiers non commités notés au journal). Signalé = avertissement ou rouge. (a) code seul : 87,3 % [81,1 ; 91,7], rouge seul 76,0 %, faux rouges 15,0 % [9,3 ; 23,3], faux avertissement ou rouge 30 %. (c) sans phrase : 64,7 %. (b) Clef : 88,7 %, 16,0 %. Critères publiés avant : rappel au moins 80 % atteint, faux rouges au plus 10 % non atteint. 11 des 15 faux rouges : achat NFT à prix quasi nul. Limite : auteur de la même famille de modèles que ceux qui nous ont aidés ; cas synthétiques ; mesuré en Node. Ne plus citer le 1,3 % de la grille comme garantie. Source : CHIFFRES.md A6.", 28);
  txt(s, 'Arnaques signalées', 0.5, 1.4, 9, 0.35, { fontSize: 13, color: MUTED, bold: true });
  bar(s, 'Sans la phrase', '65 %', 0.647, 1.8, MUTED);
  bar(s, 'Avec la phrase', '87 %', 0.873, 2.4, INK);
  txt(s, 'Opérations honnêtes en rouge', 0.5, 3.05, 9, 0.35, { fontSize: 13, color: MUTED, bold: true });
  bar(s, 'Seuil fixé avant', '10 %', 0.10, 3.45, MUTED);
  bar(s, 'Mesuré', '15 %', 0.15, 4.0, RED);
  txt(s, 'Seuil manqué, surtout des achats de NFT à prix presque nul. Auteur : une IA de la même famille que celle qui nous a aidés. Pas encore un test humain.', 0.5, 4.6, 9, 0.5, { fontSize: 11, color: RED });
}

// 7 Données et trace
{
  const s = slide('La phrase, le code, le cahier', "Build livré (D-015) : la phrase seule part vers le modèle Clef par un relais local qui garde la clé ; option sans réseau par mots-clés. Base légale et conservation non rédigées. Le modèle ne lit ni montants ni adresses et ne peut pas baisser une alerte du code. Cahier chaîné par hachage, y compris dans le build autonome : ligne modifiée, retirée ou déplacée au milieu détectée ; réécriture complète non détectée sans ancrage externe. Deux inexactitudes du journal relevées par l'audit (point 13). Aucune conformité revendiquée : DORA, MiCA, AI Act restent à la plateforme qui déploie (livrables/SLIDE_CONFORMITE.md).");
  const cols = [
    ['La phrase', 'Part seule vers un modèle hébergé, par un relais sur la machine. Jamais les montants ni les adresses.'],
    ['Le code', 'Lit montants, jetons, adresses et compare. Le modèle ne peut pas baisser une alerte du code.'],
    ['Le cahier', 'Numéroté et chaîné. Une page changée ou arrachée se voit. Réécrit en entier : pas encore.'],
  ];
  cols.forEach((c, i) => {
    const x = 0.5 + i * 3.05;
    box(s, x, 1.5, 2.9, 2.9, TINT, LINE);
    txt(s, c[0], x + 0.15, 1.65, 2.6, 0.5, { fontSize: 17, bold: true });
    txt(s, c[1], x + 0.15, 2.25, 2.6, 2.0, { fontSize: 14 });
  });
  txt(s, 'La personne garde le dernier geste. Aucune conformité déclarée.', 0.5, 4.65, 9, 0.35, { fontSize: 12, color: MUTED, bold: true });
}

// 8 Ce qu'on ne couvre pas
{
  const s = slide("Contrôlé aujourd'hui, pas encore", "Sur 58 paires d'essai (moteur serveur) : 18 contrôlées, 7 en partie, 20 non, 13 non distinguées (preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md, CHIFFRES A20). Hors périmètre : fraude voulue (7,2 Md$ de plaintes en 2025 selon l'IC3, B8), Ledger direct, téléphone. Jamais essayé avec un vrai MetaMask. Démonstration sur une copie locale d'Avalanche ; déploiement Fuji préparé et répété, non exécuté (D-016). Revue de sécurité corrigée en Node, non vérifiée dans Chrome : ne pas dire « sécurisé ».");
  box(s, 0.5, 1.5, 4.4, 3.0, TINT, LINE);
  txt(s, "Contrôlé aujourd'hui", 0.7, 1.6, 4.0, 0.4, { fontSize: 17, bold: true });
  txt(s, bullets(['Le montant d’un droit', 'Un paiement : montant, jeton, destinataire', 'Un second droit glissé dans un lot', 'Une prise de contrôle du compte']), 0.7, 2.1, 4.0, 2.3, { fontSize: 14, paraSpaceAfter: 4 });
  box(s, 5.1, 1.5, 4.4, 3.0, BG, RED);
  txt(s, 'Pas encore, ou hors périmètre', 5.3, 1.6, 4.0, 0.4, { fontSize: 17, bold: true, color: RED });
  txt(s, bullets(['Le sens d’un échange, la contrepartie', 'À qui le droit est donné', 'La fraude que vous voulez vraiment faire', 'Ledger en direct, téléphone', 'Un vrai MetaMask : jamais essayé']), 5.3, 2.1, 4.0, 2.3, { fontSize: 14, paraSpaceAfter: 4 });
  txt(s, 'Copie locale d’Avalanche. Déploiement Fuji préparé, non exécuté.', 0.5, 4.7, 9, 0.35, { fontSize: 12, color: MUTED });
}

// 9 Modèle et promesse
{
  const s = slide('Cesser de donner plus que nécessaire', "Modèle (research/titouan/BM2/BM_MODELE.md) : gratuit pour la personne. Paient ceux qui portent la perte : M1, API « verdict avant retrait » pour exchanges et fintechs (premier revenu visé) ; M2, licence SDK pour portefeuilles et plateformes (premier pilote, peut-être non payé) ; M3, mandats pour agents qui dépensent (prospectif, à 2 ans). Pilotes B2B recherchés maintenant. Prix envisagés : hypothèses, aucun client, aucun prix de marché comparable. Promesse de Titouan : cesser de donner plus que nécessaire, car on s'expose en le faisant. Fin d'Adem : on ne sait pas quel site sera piraté, on décide de ce qu'on lui laisse.", 28);
  txt(s, 'Gratuit pour la personne. Paient ceux qui remboursent la fraude.', 0.5, 1.45, 9, 0.4, { fontSize: 16, bold: true });
  const cols = [
    ['Exchanges, fintechs', 'API « verdict avant retrait »'],
    ['Portefeuilles', 'Licence SDK'],
    ['Agents qui dépensent', 'Mandats écrits (demain)'],
  ];
  cols.forEach((c, i) => {
    const x = 0.5 + i * 3.05;
    box(s, x, 2.0, 2.9, 1.3, TINT, LINE);
    txt(s, c[0], x + 0.15, 2.1, 2.6, 0.4, { fontSize: 15, bold: true });
    txt(s, c[1], x + 0.15, 2.55, 2.6, 0.7, { fontSize: 14 });
  });
  txt(s, 'Nous cherchons des pilotes dès maintenant.', 0.5, 3.45, 9, 0.35, { fontSize: 13, color: MUTED });
  txt(s, "On ne sait pas quel site sera piraté. On décide de ce qu'on lui laisse.", 0.5, 4.0, 9, 0.8, { fontSize: 20, bold: true, color: RED });
}

pres.writeFile({ fileName: path.join(__dirname, 'holdup.pptx') }).then((f) => console.log('écrit', f));

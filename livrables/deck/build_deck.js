// Génère livrables/deck/holdup.pptx (9 slides, produit figé).
// Usage : NODE_PATH=<dossier node_modules contenant pptxgenjs> node livrables/deck/build_deck.js
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
function pill(s, label, x, y, w, h, fill, color, size) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { color: fill === BG ? LINE : fill, width: 1 } });
  txt(s, label, x, y, w, h, { color, bold: true, fontSize: size || 13, align: 'center', valign: 'middle' });
}
const bullets = (arr) => arr.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < arr.length - 1 } }));

// 1 Problème
{
  const s = slide('Camille veut échanger 50 USDC', "Le site lui demande un droit sur tout son USDC. En 2025, 106 106 adresses ont perdu 83,85 millions de dollars en signant sur un site de phishing. Chiffre d'un éditeur (ScamSniffer), chaînes EVM, borne basse. Aucun chiffre propre à Avalanche. Source : livrables/CHIFFRES.md B3.");
  box(s, 0.5, 1.5, 4.3, 3.4, TINT, LINE);
  txt(s, 'Neve (site fictif)', 0.75, 1.7, 3.8, 0.3, { fontSize: 12, color: MUTED });
  txt(s, 'Échanger 50 USDC contre AVAX', 0.75, 2.1, 3.8, 0.7, { fontSize: 20, bold: true });
  txt(s, 'Étape 1 : autoriser le routeur à dépenser votre USDC.', 0.75, 2.95, 3.8, 0.7, { fontSize: 14, color: MUTED });
  pill(s, 'Autoriser', 0.75, 3.85, 2.6, 0.55, INK, 'FFFFFF', 14);
  txt(s, '83,85 M$', 5.3, 1.6, 4.2, 1.0, { fontSize: 54, bold: true, color: RED });
  txt(s, "perdus par 106 106 adresses en 2025 en signant sur un site de phishing", 5.3, 2.7, 4.2, 0.9, { fontSize: 16 });
  txt(s, 'Chiffre ScamSniffer (éditeur), chaînes EVM, borne basse.', 5.3, 3.8, 4.2, 0.7, { fontSize: 13, color: MUTED });
}

// 2 Produit
{
  const s = slide("Tu écris. Hold up compare.", "L'utilisateur écrit ce qu'il veut faire avant de voir la demande. Montant, jeton et adresse sont lus par du code. Le modèle Clef lit la phrase. Correspond : le portefeuille s'ouvre seul après une seconde. Ne correspond pas : alerte, Annuler visible. Pas pu vérifier : on le dit. Les signaux que le portefeuille donne déjà sont gardés. MetaMask affiche illimité sans alerte et ne sait ni combien tu voulais donner ni à qui, d'après son code public lu le 11 oct. 2026, pour une adresse non listée comme malveillante.");
  box(s, 0.5, 1.5, 2.8, 1.2, TINT, LINE);
  txt(s, "1. J'écris", 0.65, 1.6, 2.5, 0.3, { fontSize: 13, bold: true });
  txt(s, 'échanger 50 USDC contre AVAX', 0.65, 2.0, 2.5, 0.6, { fontSize: 14 });
  box(s, 3.6, 1.5, 2.8, 1.2, TINT, LINE);
  txt(s, '2. La demande arrive', 3.75, 1.6, 2.5, 0.3, { fontSize: 13, bold: true });
  txt(s, "droit de dépense illimité sur l'USDC", 3.75, 2.0, 2.5, 0.6, { fontSize: 14 });
  box(s, 6.7, 1.5, 2.8, 1.2, BG, RED);
  txt(s, '3. Hold up', 6.85, 1.6, 2.5, 0.3, { fontSize: 13, bold: true, color: RED });
  txt(s, 'Ça ne correspond pas à ce que tu as écrit.', 6.85, 2.0, 2.5, 0.6, { fontSize: 14, bold: true, color: RED });
  txt(s, bullets(['Ça correspond : le portefeuille s’ouvre seul après une seconde.', 'Ça ne correspond pas : alerte, Annuler visible.', 'Pas pu vérifier : la fenêtre le dit, jamais « correspond » par défaut.']), 0.5, 3.1, 9, 1.5, { fontSize: 15, paraSpaceAfter: 6 });
  txt(s, 'On garde aussi les signaux que le portefeuille donne déjà.', 0.5, 4.75, 9, 0.3, { fontSize: 12, color: MUTED });
}

// 3 Signataire aveugle
{
  const s = slide('Le signataire aveugle (cas Bybit)', "Bybit, février 2025 : l'interface affichait une transaction légitime, une autre charge allait aux signataires (analyses NCC Group, BlockSec, Check Point, Cyfrin). Notre scène est synthétique, adresses factices, rejeu du moteur sans portefeuille (demo_typologie/safe_signataire.mjs). Elle montre le décodage, pas l'attaque de bout en bout. Une extension ne voit que ce qui passe par window.ethereum : si la page parle au matériel en direct, elle ne voit rien. Les analyses publiques ne confirment pas ce qu'affichait l'écran du matériel : ne pas l'affirmer.");
  box(s, 0.5, 1.5, 4.4, 2.2, TINT, LINE);
  txt(s, "J'ai écrit", 0.7, 1.6, 4.0, 0.3, { fontSize: 13, color: MUTED, bold: true });
  txt(s, 'virer 20 USDC à Paul', 0.7, 1.95, 4.0, 0.5, { fontSize: 20, bold: true });
  box(s, 5.1, 1.5, 4.4, 2.2, BG, RED);
  txt(s, 'La demande est', 5.3, 1.6, 4.0, 0.3, { fontSize: 13, color: RED, bold: true });
  txt(s, 'un appel délégué vers un contrat inconnu, qui change le code du coffre', 5.3, 1.95, 4.0, 1.4, { fontSize: 17, bold: true, color: RED });
  txt(s, 'Ça ne correspond pas.', 0.5, 4.0, 9, 0.4, { fontSize: 20, bold: true });
  txt(s, 'Scène synthétique, adresses factices. Elle montre le décodage, pas l’attaque.', 0.5, 4.5, 9, 0.4, { fontSize: 13, color: MUTED });
}

// 4 Me connecter
{
  const s = slide('« Me connecter » qui signe un droit', "Scénario S6 (X_scenarios_hors_metamask.md). MetaMask décode un Permit en demande de plafond de dépense (lu dans son code public) : il informe, mais il ne compare pas avec « me connecter ». Les messages de connexion valides ne passent pas par l'analyse Blockaid. Démo : site Glacier Rewards, en local. Le silence de MetaMask sur une chaîne locale ne prouve rien.");
  box(s, 0.5, 1.5, 4.4, 2.6, TINT, LINE);
  txt(s, 'MetaMask affiche', 0.7, 1.6, 4.0, 0.3, { fontSize: 13, color: MUTED, bold: true });
  txt(s, 'Une demande de plafond de dépense. Il ne sait pas que tu voulais seulement te connecter.', 0.7, 2.0, 4.0, 1.8, { fontSize: 17 });
  box(s, 5.1, 1.5, 4.4, 2.6, BG, RED);
  txt(s, 'Hold up, après « me connecter »', 5.3, 1.6, 4.0, 0.3, { fontSize: 13, color: RED, bold: true });
  txt(s, 'Ça ne correspond pas : une connexion ne devrait pas donner un droit de dépense.', 5.3, 2.0, 4.0, 1.8, { fontSize: 17, bold: true, color: RED });
  txt(s, 'Démo locale : le résultat ne dit rien du comportement de MetaMask en production.', 0.5, 4.4, 9, 0.4, { fontSize: 13, color: MUTED });
}

// 5 Mesures
{
  const s = slide('Ce que nous mesurons, et ce que nous ne savons pas', "Tout vient de cas écrits par nous, jeux de réglage. Le 228 sur 228 est un test de couverture. Le jeu aveugle (250 cas, hash publié) n'est pas passé. La grille de 1 500 paires est en cours. Clef n'est pas mesuré par nous (pas de clé). Latence locale : médiane 18,39 ms, p95 34,08 ms. Source : livrables/CHIFFRES.md A3, A4, A5, A6, A9.", 26);
  const H = { bold: true, color: 'FFFFFF', fill: { color: INK }, fontFace: F, fontSize: 12 };
  const c = (t, o) => ({ text: t, options: Object.assign({ fontFace: F, fontSize: 12, color: INK, valign: 'middle' }, o || {}) });
  const rows = [
    [{ text: 'Synthétique (cas écrits par nous)', options: H }, { text: 'Résultat', options: H }, { text: 'Lecture', options: H }],
    [c('410 cas de décalage', { bold: true }), c('228 écarts sur 228 signalés. 0 fausse alerte rouge sur 166 honnêtes.'), c('Test de couverture, pas une mesure.')],
    [c('Moteur en conditions produit', { bold: true }), c('Rappel rouge 71,3 %. Honnêtes en rouge 13,9 %.'), c("Trop de fausses alertes.", { color: RED })],
    [c('Phrase libre sur 298 arnaques vertes', { bold: true }), c('0 arrêtée. Intention structurée : 34.'), c("Peu d'apport sur nos cas actuels.", { color: RED })],
    [c('Jeu aveugle (250 cas), grille (1 500 paires)', { bold: true }), c('À mesurer', { bold: true, color: RED }), c('Hash publié avant le test.')],
  ];
  s.addTable(rows, { x: 0.5, y: 1.5, w: 9, colW: [3.0, 3.6, 2.4], border: { type: 'solid', pt: 0.75, color: LINE }, rowH: [0.35, 0.7, 0.6, 0.7, 0.7] });
  txt(s, 'Données réelles : aucune ne mesure Hold up. Le contexte est en colonne B de livrables/CHIFFRES.md.', 0.5, 4.85, 9, 0.3, { fontSize: 11, color: MUTED });
}

// 6 Après l'alerte
{
  const s = slide("Après l'alerte, la personne décide", "Annuler est toujours visible. Transaction : la ligne dit comment ramener le droit au montant écrit (correction automatique : décision Q17, en cours, non vérifiée). Signature : le droit ne peut pas être limité, on le dit. Durée de retenue : non tranchée (Q16), ne pas citer de durée. Journal chaîné par hachage, fiche d'incident sur demande, retrait de droits testé sur chaîne locale.");
  box(s, 0.5, 1.5, 4.4, 3.0, TINT, LINE);
  txt(s, 'Transaction', 0.7, 1.6, 4.0, 0.4, { fontSize: 20, bold: true });
  txt(s, 'La ligne dit : tu as écrit 50 USDC, la demande donne accès à tout ton USDC. Elle explique comment ramener le plafond à 50 USDC.', 0.7, 2.15, 4.0, 2.2, { fontSize: 15 });
  box(s, 5.1, 1.5, 4.4, 3.0, TINT, LINE);
  txt(s, 'Signature', 5.3, 1.6, 4.0, 0.4, { fontSize: 20, bold: true });
  txt(s, 'Elle ne peut pas être limitée : la ligne le dit et ne donne aucun conseil que personne ne peut suivre.', 5.3, 2.15, 4.0, 2.2, { fontSize: 15 });
  txt(s, 'Chaque décision laisse une ligne dans un journal chaîné par hachage.', 0.5, 4.75, 9, 0.3, { fontSize: 12, color: MUTED, bold: true });
}

// 7 Conformité
{
  const s = slide('Une décision, une trace, un rejeu', "Contenu complet : livrables/SLIDE_CONFORMITE.md. Un particulier n'est pas une entité régulée ; la plateforme qui intègre Hold up l'est. Nous ne nous déclarons conformes à aucun texte. Si le modèle se trompe : voir QR_JURY question 2. L'ancrage sur Fuji n'est pas déployé : on ne l'affirme pas.");
  const cols = [
    ['DORA', "Une ligne datée par décision, rejouable : matière pour le registre. Pas de classification ni de déclaration."],
    ['MiCA, LCB-FT', "Trace de ce qui a été écrit et répondu. Aucun filtrage de sanctions, aucune déclaration de soupçon."],
    ['AI Act', "Un modèle lit la phrase. Du code lit montants, jetons, adresses. Pas de qualification établie."],
    ['Auditeur', "Une commande recalcule la chaîne et rejoue le moteur. Réécriture complète : détectée seulement après ancrage."],
  ];
  cols.forEach((c, i) => {
    const x = 0.5 + i * 2.28;
    box(s, x, 1.5, 2.18, 3.2, TINT, LINE);
    txt(s, c[0], x + 0.12, 1.62, 1.95, 0.4, { fontSize: 14, bold: true });
    txt(s, c[1], x + 0.12, 2.1, 1.95, 2.5, { fontSize: 11 });
  });
  txt(s, 'NIST CSF 2.0 : DE.AE-02, DE.AE-07, DE.CM-09, RS.MI-01.   ATT&CK : T1657, T1566, T1204.', 0.5, 4.85, 9, 0.3, { fontSize: 11, color: MUTED, bold: true });
}

// 8 Ce qu'on ne couvre pas
{
  const s = slide("Ce qu'on ne couvre pas", "Fraude consentie : la demande correspond à ce que la personne veut faire, rien à comparer (la fraude à l'investissement pèse 7,2 Md$ de plaintes en 2025 selon l'IC3, hors périmètre). Intention vague : une relance, puis « je n'ai pas pu vérifier ». Contrat qui change à l'exécution : Added Protection de MetaMask le traite mieux. Ledger direct : une extension ne voit que window.ethereum.");
  const items = [
    ['Fraude consentie', "Tu veux vraiment faire ce paiement. La demande correspond."],
    ['Intention vague', "« Payer » sans montant ni destinataire : une relance, puis « je n'ai pas pu vérifier »."],
    ['Contrat qui change à l’exécution', "Added Protection de MetaMask le traite mieux. Nous ne le revendiquons pas."],
    ['Ledger direct', "Une page qui parle au matériel sans passer par le navigateur échappe à l'extension."],
  ];
  items.forEach((it, i) => {
    const x = 0.5 + (i % 2) * 4.6, y = 1.5 + Math.floor(i / 2) * 1.7;
    box(s, x, y, 4.4, 1.5, TINT, LINE);
    txt(s, it[0], x + 0.2, y + 0.12, 4.0, 0.35, { fontSize: 16, bold: true });
    txt(s, it[1], x + 0.2, y + 0.58, 4.0, 0.85, { fontSize: 13 });
  });
}

// 9 Suite
{
  const s = slide('Deux ingénieurs, des limites écrites', "Gratuit pour les personnes, des partenaires ensuite, sans prix fixé ni client. Harpie et Wallet Guard ont fermé en mars 2025 : le modèle reste une question ouverte. Pas de biographie. Ce qu'on demande : un test avec un vrai portefeuille et un jeu de cas écrit par quelqu'un d'autre.");
  txt(s, 'Adem et Titouan', 0.5, 1.5, 3.5, 0.4, { fontSize: 20, bold: true });
  txt(s, 'Gratuit pour les personnes, des partenaires ensuite. Pas de prix fixé, pas de client.', 0.5, 2.1, 3.5, 1.5, { fontSize: 15 });
  txt(s, 'Pas encore fait', 4.4, 1.5, 5, 0.4, { fontSize: 18, bold: true, color: RED });
  txt(s, bullets(['Essai avec un vrai portefeuille', 'Jeu aveugle de 250 cas', 'Grille de 1 500 paires', 'Mesure de Clef sur la comparaison', 'Test avec de vraies personnes', 'Ancrage sur Fuji']), 4.4, 2.05, 5, 2.3, { fontSize: 15, paraSpaceAfter: 5 });
  txt(s, "Ce qu'on vous demande : écrivez votre phrase, attaquez-nous.", 0.5, 4.5, 9, 0.4, { fontSize: 16, bold: true });
}

pres.writeFile({ fileName: path.join(__dirname, 'holdup.pptx') }).then((f) => console.log('écrit', f));

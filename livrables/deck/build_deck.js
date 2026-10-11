// Génère livrables/deck/holdup.pptx.
// Usage : NODE_PATH=<dossier node_modules contenant pptxgenjs> node livrables/deck/build_deck.js
const fs = require('fs');
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

// 1 Problème
{
  const s = slide('Une signature gratuite a vidé le compte', "Camille a un wallet normal. Un message promet une récompense. Le site lui fait signer un message gratuit, sans frais, et son USDC part. En 2025, 106 106 victimes et 83,85 M$ perdus par hameçonnage de signatures, selon ScamSniffer.");
  box(s, 0.5, 1.5, 4.3, 3.4, TINT, LINE);
  txt(s, 'Glacier Rewards (site fictif)', 0.75, 1.7, 3.8, 0.3, { fontSize: 12, color: MUTED });
  txt(s, 'Ta récompense est prête', 0.75, 2.1, 3.8, 0.4, { fontSize: 20, bold: true });
  txt(s, 'Signe ce message pour vérifier ton compte. Aucun frais.', 0.75, 2.65, 3.8, 0.7, { fontSize: 14, color: MUTED });
  pill(s, 'Réclamer', 0.75, 3.75, 2.6, 0.55, INK, 'FFFFFF', 14);
  txt(s, '83,85 M$', 5.3, 1.6, 4.2, 1.0, { fontSize: 54, bold: true, color: RED });
  txt(s, 'volés à 106 106 victimes en 2025 par hameçonnage de signatures (ScamSniffer)', 5.3, 2.7, 4.2, 0.9, { fontSize: 16 });
  txt(s, 'Permit et Permit2 : environ 38 % des pertes des cas supérieurs à 1 M$.', 5.3, 3.8, 4.2, 0.7, { fontSize: 14, color: MUTED });
}

// 2 Cible
{
  const s = slide('Un particulier avec un wallet normal', "Cible : le particulier avec un wallet normal, atteint par le wallet ou la plateforme. Pas de témoignage d'utilisateur : la douleur vient des pertes publiées, pas d'entretiens.");
  const cols = [
    ['Qui', "MetaMask, Rabby, Core. Pas technique, parfois sous la pression d'un faux support."],
    ['Quand', "Juste avant de signer ou d'envoyer, souvent pendant un appel ou une conversation."],
    ['Douleur', "Elle lit « Signer » et ne voit pas le droit qu'elle donne."],
  ];
  cols.forEach((c, i) => {
    const x = 0.5 + i * 3.05;
    box(s, x, 1.6, 2.85, 2.7, TINT, LINE);
    txt(s, c[0], x + 0.2, 1.8, 2.45, 0.4, { fontSize: 20, bold: true });
    txt(s, c[1], x + 0.2, 2.35, 2.45, 1.8, { fontSize: 15 });
  });
  txt(s, "Pas de Safe, pas d'EIP-7702, pas de matériel dédié : le wallet que la personne a déjà.", 0.5, 4.55, 9, 0.4, { fontSize: 14, color: MUTED });
}

// 3 Solution
{
  const s = slide('Tu crois / En vrai', "Pas de score de risque : une phrase de chaque côté. Annuler est toujours visible. Hold up ne dit jamais protégé ni vert, il avertit, ralentit et explique. Le verdict vient de règles écrites en code.");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.45, w: 9, h: 3.45, rectRadius: 0.15, fill: { color: BG }, line: { color: INK, width: 1.5 } });
  pill(s, 'Danger', 0.8, 1.65, 1.3, 0.38, RED, 'FFFFFF', 13);
  txt(s, 'Tu crois', 0.8, 2.2, 4, 0.3, { fontSize: 13, color: MUTED, bold: true });
  txt(s, 'Je signe un simple message, sans payer de frais.', 0.8, 2.5, 3.9, 0.9, { fontSize: 20, bold: true });
  txt(s, 'En vrai', 5.1, 2.2, 4, 0.3, { fontSize: 13, color: RED, bold: true });
  txt(s, 'Cette signature gratuite laisse le site prendre tes jetons.', 5.1, 2.5, 4.1, 1.2, { fontSize: 20, bold: true, color: RED });
  pill(s, 'Annuler', 0.8, 4.1, 2.4, 0.5, INK, 'FFFFFF', 14);
  pill(s, 'Continuer quand même (retardé)', 3.4, 4.1, 3.2, 0.5, BG, MUTED, 12);
}

// 4 Démo
{
  const s = slide('Démo : le Hold up Lab', "Chaîne locale répliquant Avalanche : gratuite, rejouable. Plus de 30 scénarios prévus, la moitié honnêtes, donc des fausses alertes visibles. Fuji : pas déployé quand ce deck est écrit, on ne le montre pas.");
  box(s, 0.5, 1.45, 2.2, 1.0, TINT, LINE);
  txt(s, 'Une attaque, construite par le jury', 0.65, 1.55, 1.9, 0.8, { fontSize: 13, bold: true });
  box(s, 3.4, 1.45, 3.0, 1.0, BG, INK);
  txt(s, 'Ce que Hold up dit', 3.55, 1.55, 2.7, 0.8, { fontSize: 14, bold: true });
  box(s, 6.5, 1.45, 3.0, 1.0, BG, RED);
  txt(s, 'Ce qui arrive sur la chaîne si on signe (exécution, puis retour en arrière)', 6.65, 1.5, 2.7, 0.9, { fontSize: 12, bold: true });
  s.addShape(pres.shapes.LINE, { x: 2.7, y: 1.95, w: 0.7, h: 0, line: { color: INK, width: 1.5, endArrowType: 'triangle' } });
  txt(s, 'Un moteur, deux portes', 0.5, 2.8, 9, 0.35, { fontSize: 16, bold: true });
  box(s, 0.5, 3.25, 4.4, 1.7, TINT, LINE);
  txt(s, 'Extension, avant la signature', 0.7, 3.35, 4.0, 0.3, { fontSize: 14, bold: true });
  txt(s, 'Seule à voir les signatures hors chaîne, comme un Permit.', 0.7, 3.75, 4.0, 0.9, { fontSize: 13 });
  box(s, 5.1, 3.25, 4.4, 1.7, TINT, LINE);
  txt(s, 'RPC de garde, après la signature', 5.3, 3.35, 4.0, 0.3, { fontSize: 14, bold: true });
  txt(s, 'Avant la diffusion : envois tapés dans le wallet, mobile. Retraits de plateforme : coller et vérifier à la main.', 5.3, 3.75, 4.0, 1.1, { fontSize: 13 });
}

// 5 Chiffres
{
  const s = slide('Ce que nous mesurons, et ce que nous ne savons pas', "Notre taux de fausses alertes critiques est trop haut, on le dit. Le chiffre qui compte est celui du jeu aveugle, hash publié avant le test, résultat à mesurer. Latence du verdict : 30 à 50 ms en local sur 8 requêtes types, sans réseau. Un temps de détection d'incident n'existe pas : le moteur juge une requête avant signature.", 26);
  const H = { bold: true, color: 'FFFFFF', fill: { color: INK }, fontFace: F, fontSize: 12 };
  const c = (t, o) => ({ text: t, options: Object.assign({ fontFace: F, fontSize: 12, color: INK, valign: 'middle' }, o || {}) });
  const rows = [
    [{ text: 'Jeu', options: H }, { text: 'Résultat', options: H }, { text: 'Lecture', options: H }],
    [c('TEST, ouvert une fois, avant correctifs', { bold: true }), c('Rappel 94,5 % (104/110). Fausses alertes critiques 23,1 % (18/78).'), c('Écrit par nous. Trop de fausses alertes.', { color: RED })],
    [c('DEV, règles réglées dessus', { bold: true }), c('252/252 et 0/90'), c('Non-régression, pas une mesure.')],
    [c('Opérations honnêtes Avalanche', { bold: true }), c('Critique 22/123 (17,9 %). 69 % reçoivent un écran.'), c("Fatigue d'alerte : première limite.", { color: RED })],
    [c('Jeux aveugles, produit réel, Lab (30+ scénarios)', { bold: true }), c('À mesurer', { bold: true, color: RED }), c('Hash publié avant le test.')],
  ];
  s.addTable(rows, { x: 0.5, y: 1.5, w: 9, colW: [2.9, 3.7, 2.4], border: { type: 'solid', pt: 0.75, color: LINE }, rowH: [0.35, 0.75, 0.6, 0.75, 0.75] });
  txt(s, 'Rappel : avertissement ou critique. Fausse alerte : opération honnête classée critique.', 0.5, 4.85, 9, 0.3, { fontSize: 11, color: MUTED });
}

// 6 Conformité
{
  const s = slide('Une décision, une preuve, un rejeu', "Si le modèle se trompe, qui est responsable ? Le verdict vient de règles versionnées, la personne décide, le journal garde la version des règles. L'ancrage sur Fuji n'est pas déployé : on ne l'affirme pas.");
  const p = path.join(__dirname, '..', 'SLIDE_CONFORMITE.md');
  if (fs.existsSync(p)) {
    const md = fs.readFileSync(p, 'utf8').split(/\r?\n/);
    const strip = (t) => t.replace(/\*\*|`/g, '').replace(/^[-\d.\s]+/, '').trim();
    const cut = (t, n) => (t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '.' : t);
    const secs = [];
    let cur = null;
    md.forEach((l) => {
      if (/^## /.test(l)) { cur = { h: strip(l.replace(/^## /, '').replace(/^Colonne \d+\s*:\s*/, '')), items: [] }; secs.push(cur); }
      else if (cur && /^(\d+\.|-)\s/.test(l) && cur.items.length < 3) cur.items.push(cut(strip(l), 120));
    });
    const use = secs.slice(0, 4);
    const w = 9 / Math.max(use.length, 1);
    use.forEach((c, i) => {
      const x = 0.5 + i * w;
      box(s, x + 0.05, 1.5, w - 0.1, 3.2, TINT, LINE);
      txt(s, c.h, x + 0.2, 1.62, w - 0.4, 0.5, { fontSize: 14, bold: true });
      txt(s, c.items.join('\n\n'), x + 0.2, 2.2, w - 0.4, 2.4, { fontSize: 11 });
    });
  } else {
    box(s, 0.5, 1.5, 9, 3.2, 'FFF4F2', RED);
    txt(s, 'EN ATTENTE : livrables/SLIDE_CONFORMITE.md', 0.8, 2.4, 8.4, 0.5, { fontSize: 22, bold: true, color: RED });
    txt(s, 'Cette slide lira ce fichier au prochain lancement de build_deck.js. Ne pas présenter tant que ce cadre est visible.', 0.8, 3.1, 8.4, 0.8, { fontSize: 14 });
  }
  txt(s, 'NIST CSF 2.0 : Detect, Respond.   ATT&CK : T1566, T1657.', 0.5, 4.85, 9, 0.3, { fontSize: 12, color: MUTED, bold: true });
}

// 7 Business
{
  const s = slide('Gratuit pour les personnes, intégration payante', "Pas de taille de marché : aucune source dans le dépôt. Des scanners existent (Blockaid dans Core, Pocket Universe, Rabby). Notre différence : l'intention déclarée et le ralentissement, pas la réputation d'adresse.");
  box(s, 0.5, 1.5, 4.4, 2.5, TINT, LINE);
  txt(s, 'Particuliers', 0.7, 1.65, 4.0, 0.4, { fontSize: 20, bold: true });
  txt(s, "Extension gratuite. Porte d'entrée et démonstration.", 0.7, 2.2, 4.0, 1.4, { fontSize: 16 });
  box(s, 5.1, 1.5, 4.4, 2.5, TINT, LINE);
  txt(s, 'Wallets et plateformes', 5.3, 1.65, 4.0, 0.4, { fontSize: 20, bold: true });
  txt(s, 'Intégration payante : le moteur et le journal vérifiable derrière leur propre interface.', 5.3, 2.2, 4.0, 1.5, { fontSize: 16 });
  txt(s, 'Prix non fixé. Aucun client, aucune étude de marché dans le dépôt. Qui paie côté particulier : question ouverte.', 0.5, 4.3, 9, 0.6, { fontSize: 14, color: MUTED });
}

// 8 Équipe
{
  const s = slide('Adem et Titouan', "Pas de biographie : deux ingénieurs, le code est dans le dépôt. Ce qu'on demande : un test avec un vrai wallet et un jeu d'attaques écrit par quelqu'un d'autre.");
  box(s, 0.5, 1.5, 2.6, 1.0, TINT, LINE);
  txt(s, 'Adem', 0.7, 1.6, 2.2, 0.4, { fontSize: 20, bold: true });
  txt(s, 'Responsable technique', 0.7, 2.05, 2.2, 0.3, { fontSize: 13, color: MUTED });
  box(s, 0.5, 2.7, 2.6, 1.0, TINT, LINE);
  txt(s, 'Titouan', 0.7, 2.8, 2.2, 0.4, { fontSize: 20, bold: true });
  txt(s, 'Ingénieur', 0.7, 3.25, 2.2, 0.3, { fontSize: 13, color: MUTED });
  txt(s, 'Ce que nous ne faisons pas encore', 3.5, 1.5, 6, 0.4, { fontSize: 18, bold: true, color: RED });
  txt(s, [
    { text: 'Testé avec un vrai MetaMask', options: { bullet: true, breakLine: true } },
    { text: 'Modèle de langage non appelé dans la version actuelle', options: { bullet: true, breakLine: true } },
    { text: 'Ancrage Fuji non déployé', options: { bullet: true, breakLine: true } },
    { text: 'Mesure sur de vrais utilisateurs', options: { bullet: true } },
  ], 3.5, 2.05, 6, 1.9, { fontSize: 16, paraSpaceAfter: 6 });
  txt(s, "Ce qu'on vous demande : attaquez le Lab.", 3.5, 4.2, 6, 0.4, { fontSize: 16, bold: true });
}

pres.writeFile({ fileName: path.join(__dirname, 'holdup.pptx') }).then((f) => console.log('écrit', f));

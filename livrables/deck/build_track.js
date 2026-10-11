// Génère livrables/deck/holdup_playbook_conformite.pptx : les deux slides exigées par la track 1
// (context/notion_guide.md : playbook de réponse, slide conformité). Même système de design que build_deck.js.
// Usage : NODE_PATH=<dossier node_modules contenant pptxgenjs> node livrables/deck/build_track.js
// Sources : livrables/PLAYBOOK_REPONSE.md et livrables/SLIDE_CONFORMITE.md. Ce qui n'est pas fait est écrit « non fait ».
const path = require('path');
const pptxgen = require('pptxgenjs');

const PAGE = '000000', INK = 'FFFFFF', INK2 = 'B3B3B3';
const F = 'Segoe UI', FB = 'Segoe UI Semibold';
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625
pres.title = 'Hold up : playbook de réponse et conformité';
pres.author = 'Adem et Titouan';

pres.defineSlideMaster({
  title: 'HOLDUP',
  background: { color: PAGE },
  slideNumber: { x: 9.0, y: 5.15, w: 0.5, h: 0.25, fontFace: F, fontSize: 10, color: INK2, align: 'right' },
  objects: [{ text: { text: 'Hold up', options: { x: 0.5, y: 5.15, w: 3, h: 0.25, fontFace: FB, fontSize: 10, color: INK2, margin: 0 } } }],
});
function slide(title, notes) {
  const s = pres.addSlide({ masterName: 'HOLDUP' });
  s.addText(title, { x: 0.5, y: 0.4, w: 9, h: 0.6, fontFace: FB, fontSize: 28, color: INK, valign: 'top', margin: 0, isTextBox: true });
  s.addNotes(notes);
  return s;
}
function txt(s, t, x, y, w, h, o) {
  s.addText(t, Object.assign({ x, y, w, h, fontFace: F, fontSize: 12, color: INK, margin: 0, valign: 'top', isTextBox: true }, o || {}));
}
// Une colonne sans cadre : un titre en 600, puis des lignes ; la première ligne est en blanc, les suivantes en gris.
function column(s, x, w, y, title, lines) {
  txt(s, title, x, y, w, 0.35, { fontFace: FB, fontSize: 15 });
  txt(s, lines.map((l, i) => ({ text: l, options: { color: i === 0 ? INK : INK2, breakLine: true, paraSpaceAfter: 6 } })), x, y + 0.45, w, 3.2);
}

// ---------------------------------------------------------------- 1. playbook de réponse
{
  const s = slide('Playbook de réponse',
    'Déclencheur : une demande de signature ou de transaction arrive ; Hold up la retient avant le portefeuille et la compare à la phrase écrite par la personne. ' +
    'Trois réponses possibles : ça correspond, ça ne correspond pas, je n’ai pas pu vérifier. ' +
    'L’humain reste dans la boucle à chaque étape : il écrit ce qu’il veut, il annule ou il continue, il signe lui-même. Hold up ne signe jamais et n’envoie jamais rien à sa place. ' +
    'Non fait : alerte poussée à un tiers, classification DORA, ancrage sur Fuji. Détail : livrables/PLAYBOOK_REPONSE.md.');
  const W = 2.1, G = 0.2, Y = 1.25;
  column(s, 0.5, W, Y, 'Qui est alerté', [
    'La personne devant l’écran, avant que son portefeuille ne s’ouvre.',
    'La plateforme qui intègre Hold up lit le journal sur sa machine.',
    'Alerte poussée à un tiers : non fait.',
  ]);
  column(s, 0.5 + (W + G), W, Y, 'Automatique', [
    'Retenir la demande avant le portefeuille.',
    'Comparer la phrase écrite à ce que la demande fait vraiment.',
    'Limiter une autorisation trop large au montant écrit.',
    'Imposer 30 s d’attente quand ça ne correspond pas.',
    'Écrire le verdict et la décision au journal.',
  ]);
  column(s, 0.5 + 2 * (W + G), W, Y, 'Reste humain', [
    'Écrire ce que l’on veut faire.',
    'Annuler ou continuer : la décision n’est jamais prise à sa place.',
    'Signer dans son portefeuille. Hold up ne signe jamais.',
    'Signer le retrait d’une autorisation, que Hold up prépare.',
    'Porter plainte, prévenir sa plateforme ou son assureur.',
  ]);
  column(s, 0.5 + 3 * (W + G), W, Y, 'Documenté', [
    'Un journal local, chaîné par hachage : une ligne de verdict, une ligne de décision par demande.',
    'Ni la phrase écrite, ni l’adresse du compte n’y figurent.',
    'Fiche d’incident sur demande (JSON et HTML).',
    'Ancrage de la racine du journal : testé sur chaîne locale, pas sur Fuji.',
  ]);
  txt(s, 'Tout a été joué par un script sur une chaîne locale, avec des données synthétiques.', 0.5, 4.7, 9, 0.3, { fontSize: 11, color: INK2 });
}

// ---------------------------------------------------------------- 2. conformité
{
  const s = slide('Conformité : une décision, une trace, un rejeu',
    'Nous ne déclarons Hold up conforme à aucun de ces textes. Un particulier qui signe avec son portefeuille n’y est pas soumis : le lecteur régulé est la plateforme qui intégrerait Hold up, et les obligations restent les siennes. ' +
    'Ce que nous lui donnons : une trace datée de chaque décision, et un moyen de la rejouer. ' +
    'Sur l’IA : un modèle hébergé (Clef) lit la phrase, seule ; il ne lit ni les montants ni les adresses, du code s’en charge, et il ne peut pas abaisser une alerte du code. ' +
    'Limites : le journal ne garde pas encore la phrase écrite ni la réponse du modèle ; sans ancrage externe, une réécriture complète du journal ne se voit pas. ' +
    'Articles et sources : livrables/SLIDE_CONFORMITE.md.');
  txt(s, 'Hold up ne revendique aucune conformité. Le régulé est la plateforme qui l’intègre : voici ce qu’il lui fournit.', 0.5, 1.05, 9, 0.3, { color: INK2 });
  const rows = [
    ['DORA', 'Une ligne horodatée et chaînée par décision : matière pour le registre des incidents de la plateforme.', 'Classer ou déclarer un incident : non fait.'],
    ['MiCA', 'L’heure, le niveau et les règles de chaque réponse donnée à la personne, conservés sur sa machine.', 'Ne remplace aucune obligation du prestataire.'],
    ['LCB-FT', 'La preuve datée qu’une alerte a été montrée avant une signature.', 'Aucun filtrage, aucune surveillance, aucune déclaration de soupçon.'],
    ['AI Act', 'Un modèle lit la phrase, seule. Le code compare montants et adresses ; le modèle ne peut pas abaisser son alerte.', 'Aucune qualification de Hold up au regard du texte.'],
  ];
  txt(s, 'Texte', 0.5, 1.55, 1.0, 0.3, { fontSize: 11, color: INK2 });
  txt(s, 'Ce que Hold up donne à la plateforme', 1.6, 1.55, 4.4, 0.3, { fontSize: 11, color: INK2 });
  txt(s, 'Ce que nous ne disons pas', 6.3, 1.55, 3.2, 0.3, { fontSize: 11, color: INK2 });
  rows.forEach((r, i) => {
    const y = 1.85 + i * 0.55;
    txt(s, r[0], 0.5, y, 1.0, 0.5, { fontFace: FB, fontSize: 14 });
    txt(s, r[1], 1.6, y, 4.4, 0.5);
    txt(s, r[2], 6.3, y, 3.2, 0.5, { color: INK2 });
  });
  txt(s, 'Comment un auditeur vérifie une décision', 0.5, 4.3, 9, 0.3, { fontFace: FB, fontSize: 14 });
  txt(s, 'Une commande recalcule la chaîne de hachage du journal, rejoue le moteur sur la demande et retrouve la règle qui a répondu. Exécutée sur un journal de test : 6 décisions sur 6 rejouées.', 0.5, 4.6, 9, 0.5, { color: INK2 });
}

pres.writeFile({ fileName: path.join(__dirname, 'holdup_playbook_conformite.pptx') }).then((f) => console.log('écrit', f));

export const meta = {
  name: 'relecture-scene-v5',
  description: 'Relecture indépendante d\'extraits de scène de la vidéo v5 : trois regards par extrait (mouvement, clarté et faits, cahier de défauts et raccords), puis contrôle sur image et verdict',
  phases: [
    { title: 'Regards', detail: 'mouvement ; clarté et faits ; défauts du cahier et raccords' },
    { title: 'Verdict', detail: 'contrôle de chaque constat sur image, verdict par extrait', model: 'opus' },
  ],
}

const V5 = 'C:/Users/Adem/Secure Horizon/video/v5'
const REPO = 'C:/Users/Adem/Secure Horizon'
const extraits = (args && args.extraits) || []

const CONTEXTE = `
CONTEXTE. « Hold up » est une extension de navigateur posée devant un portefeuille crypto : la personne écrit ce qu'elle veut faire (« échanger 50 »), un modèle (Clef) classe la phrase, le code compare avec ce que la demande du site fait vraiment, et affiche « Ça correspond » ou « Ça ne correspond pas » ; si le site demande trop, un geste ramène l'autorisation au montant écrit. Vidéo de démonstration pour un jury de hackathon de cybersécurité.
LE FILM. Généré dans un canvas : dessin à l'encre blanche sur fond noir (poches pleines de pièces, mains au bout de cordes, guichets, bras rayé du pirate, gant blanc plein = Hold up), prises réelles de l'extension incrustées, sous-titres en bas.
POURQUOI CETTE RELECTURE. Le fondateur a rejeté la version précédente (v3) : « à partir de 45 secondes, t'es parti en couille sur les animations. C'est devenu n'importe quoi. T'as fait aucun effort », « la vidéo doit être beaucoup plus dynamique », « une vidéo très animée qui montre avant de dire ». La seule partie qu'il juge bonne est l'ouverture (0 à 29 s) : c'est la référence. Il a déjà rejeté tout ce qui ressemble à des cartes ou des slides, et ne veut pas de zoom gratuit dans les captures. Une équipe refait chaque scène ; tu relis un EXTRAIT d'une scène refaite, sans avoir vu leur travail. Sois exigeant : ton rôle est de trouver ce que le fondateur rejetterait encore, pas de féliciter.
RÉFÉRENCES (lecture seule) : ouverture validée ${V5}/out/planches/ouverture_0_29_demi_seconde.jpg et ${V5}/out/planches/ouverture_coup_dense.jpg (un temps fort image par image) ; consignes ${V5}/CONSIGNES_ADEM.md ; bornes et lignes de voix ${V5}/BORNES.md ; cahier de défauts de la v3 ${V5}/CAHIER_DEFAUTS.md ; chiffres qui font foi ${REPO}/METRIQUES.md.
RÈGLE DE PREUVE. N'affirme que ce que tu vois. Chaque constat cite la planche et l'horodatage (jaune, en haut à gauche de chaque vignette = temps du FILM). Tu vois 4 images par seconde : ce qui se joue en moins de 0,25 s peut t'échapper, dis-le quand un constat en dépend. Tu n'entends pas le son. Ne modifie aucun fichier.`

const entete = e => `EXTRAIT À RELIRE : « ${e.nom} » (scène ${e.scene}, temps du film ${e.a} à ${e.b} s). Fichier : ${e.fichier}.
Voix de la scène : ${e.voix}.
Images : ${e.dir}/planche_NN.jpg = grilles 5 x 4, de gauche à droite puis de haut en bas, 4 images par seconde ; ${e.dir}/plein_NN.jpg = image entière 1280 x 720 toutes les 2 s. Lis TOUTES ces images, puis les deux planches de l'ouverture. S'il existe, lis aussi ${e.fichier.replace(/\.mp4$/, '.mouvement.json')} (mesure de mouvement faite par l'équipe ; dans l'ouverture la médiane vaut 6,66).`

const DEFAUTS = { type: 'object', properties: {
  defauts: { type: 'array', items: { type: 'object', properties: {
    ligne_voix: { type: 'string', description: 'identifiant de la ligne de voix la plus proche (f1, k2…) ou « entre x et y »' },
    t: { type: 'string', description: 'horodatage(s) du film' }, titre: { type: 'string' }, constat: { type: 'string' },
    preuve: { type: 'string' }, gravite: { type: 'integer', description: '3 = le fondateur rejetterait la scène pour cela, 2 = net, 1 = finition' },
    correction: { type: 'string' } },
    required: ['ligne_voix', 't', 'titre', 'constat', 'preuve', 'gravite', 'correction'] } },
  points_forts: { type: 'array', items: { type: 'string' } },
  defauts_v3_disparus: { type: 'array', items: { type: 'string' } } },
  required: ['defauts', 'points_forts'] }

const VERDICT = { type: 'object', properties: {
  verdict: { type: 'string', enum: ['pret', 'a_corriger', 'a_refaire'], description: 'pret = aucun défaut de gravité 3 ni plus de deux de gravité 2 ; a_corriger = défauts localisés ; a_refaire = la scène reste dans la forme rejetée' },
  resume: { type: 'string', description: 'trois phrases au plus : ce que la scène est devenue, ce qui manque' },
  niveau_vs_ouverture: { type: 'string', description: 'une phrase : au niveau de l\'ouverture, en dessous, ou nettement en dessous, et pourquoi' },
  restants: { type: 'array', items: { type: 'object', properties: {
    ligne_voix: { type: 'string' }, t: { type: 'string' }, titre: { type: 'string' }, constat: { type: 'string' },
    gravite: { type: 'integer' }, correction: { type: 'string' } },
    required: ['ligne_voix', 't', 'titre', 'constat', 'gravite', 'correction'] } },
  progres: { type: 'array', items: { type: 'string' }, description: 'défauts de la v3 qui ont disparu, vérifiés sur image' },
  raccords: { type: 'array', items: { type: 'string' }, description: 'ce qui est visible du raccord d\'entrée et de sortie, et s\'il respecte les arbitrages du cahier' },
  rejetes: { type: 'array', items: { type: 'string' } } },
  required: ['verdict', 'resume', 'niveau_vs_ouverture', 'restants', 'progres', 'raccords', 'rejetes'] }

const pMouvement = e => `Tu es monteur et animateur de motion design. Tu relis UN extrait sous le seul angle du MOUVEMENT.
${CONTEXTE}
${entete(e)}
CHERCHE, en comparant à l'ouverture : (1) images figées : suites de vignettes identiques ou presque, avec leur durée (une suite de plus de 1 s est un défaut ; plus de 1,5 s, grave) ; (2) animations brouillonnes : éléments qui apparaissent sans cause visible dans la demi-seconde qui précède, qui se chevauchent, sautent de place, changent d'échelle sans raison ; (3) temps forts sans élan (anticipation, impact, retombée) ; (4) densité : nombre d'événements visuels distincts par tranche de 3 s, face à l'ouverture ; (5) valeur de cadre : la caméra ou la composition change-t-elle au moins toutes les 4 s ? ; (6) vocabulaire : la scène est-elle faite des objets de l'ouverture (poches, cordes, mains, bras rayé, gant) ou retombe-t-elle en capture posée + texte fixe, colonnes, listes ? Pour chaque défaut : ce qui devrait bouger, d'où vers où, sur quelle ligne de voix.`

const pClarte = e => `Tu es réalisateur de films explicatifs et relecteur de faits. Tu relis UN extrait sous l'angle de la CLARTÉ et de l'EXACTITUDE.
${CONTEXTE}
${entete(e)}
CHERCHE : (1) « montrer avant de dire » : pour chaque ligne de voix (temps dans ${V5}/BORNES.md), l'image qui la porte est-elle à l'écran 0,2 à 0,8 s AVANT son début ? Signale les mots sans image et les images qui attendent plus de 2 s ; (2) un juré qui découvre le produit, sans le son, comprend-il chaque instant ? ; (3) lisibilité sur les images pleines : texte de moins de 28 px environ à 720p, texte gris sur noir, texte rogné par le bord, sous-titre qui recouvre un élément utile, plus d'une ligne de texte incrustée à la fois hors sous-titre, toute liste ou colonne ; (4) exactitude : chaque chiffre ou mention affiché est-il conforme à ${REPO}/METRIQUES.md et au produit (87 % / 65 % / 15 % sont ceux du « moteur de comparaison » sur un jeu aveugle de 250 cas, pas de « l'extension » ; 34 % sur Avalanche ; l'écran réel dit « DUSDC » ; pas d'Ethereum ; pas de chiffre sans source) ? ; (5) la capture réelle, quand il y en a une, est-elle entière, nette, non étirée, sans zoom gratuit ? ; (6) l'attendu du Track 1 porté par cette scène est-il réellement à l'image (détection et temps de décision, réponse graduée, bout en bout, traçabilité, playbook : qui est alerté / automatique / humain / documenté, cadre NIST Détecter et Répondre) sans tomber dans la slide de texte ?`

const pCahier = e => `Tu es contrôleur de recette. Un cahier liste les défauts confirmés de l'ancienne version (v3) et des règles arbitrées. Tu vérifies, sur les images d'UN extrait refait, ce qui a disparu, ce qui reste, et ce qui est nouveau.
${CONTEXTE}
${entete(e)}
MÉTHODE. Lis dans ${V5}/CAHIER_DEFAUTS.md : « Règles communes à toutes les scènes », « Arbitrages entre scènes », puis la section « Scène ${e.scene} »${e.scene === 's3b' ? ' ET la section « Scène s3c » (dans la v5, s3b couvre les deux)' : ''}. Les temps du cahier sont ceux de la v3 : raisonne par ligne de voix. Pour CHAQUE défaut de gravité 3 ou 2 de la section : est-il encore là dans l'extrait (alors c'est un défaut à rendre, avec sa preuve), ou a-t-il disparu (alors son titre va dans defauts_v3_disparus) ? Contrôle ensuite chaque règle commune et chaque arbitrage qui concerne cette scène, en particulier les RACCORDS : première et dernière seconde de l'extrait (quel objet du dessin entre et sort ; pas de noir, de fondu ni de voile gris ; la poche héroïne ; le bras rayé). Rends comme défauts ce qui enfreint une règle ou un arbitrage.`

const pVerdict = (e, r) => `Tu es le relecteur final d'un extrait de film. Trois relecteurs indépendants ont rendu leurs constats ; ils peuvent se tromper ou se répéter. Recontrôle chaque constat sur les images et rends le verdict.
${CONTEXTE}
${entete(e)}
MÉTHODE. Regarde d'abord toutes les images toi-même et forme ton avis : cet extrait est-il au niveau de l'ouverture ? Puis, pour chaque constat : va à l'horodatage cité ; rejette ce qui ne s'y voit pas ; corrige ce qui est mal daté ou mal gradué ; fusionne les doublons. En cas de doute, rejette. Les « progrès » ne comptent que si tu les vois toi-même. Le verdict suit la règle du schéma. La liste « restants » est destinée à l'agent qui corrigera la scène : classe-la par gravité, une correction concrète et faisable par ligne, repérée par ligne de voix.
MOUVEMENT : ${JSON.stringify(r[0] || {}, null, 1)}
CLARTÉ ET FAITS : ${JSON.stringify(r[1] || {}, null, 1)}
CAHIER ET RACCORDS : ${JSON.stringify(r[2] || {}, null, 1)}`

if (!extraits.length) { log('Aucun extrait fourni'); return { relectures: [] } }

const res = await pipeline(
  extraits,
  e => parallel([
    () => agent(pMouvement(e), { label: `mouvement ${e.nom}`, phase: 'Regards', schema: DEFAUTS, model: 'sonnet', effort: 'high' }),
    () => agent(pClarte(e), { label: `clarté ${e.nom}`, phase: 'Regards', schema: DEFAUTS, model: 'sonnet', effort: 'high' }),
    () => agent(pCahier(e), { label: `cahier ${e.nom}`, phase: 'Regards', schema: DEFAUTS, model: 'sonnet', effort: 'high' }),
  ]),
  async (r, e) => {
    const rendus = r.filter(Boolean).length
    if (rendus < 2) log(`${e.nom} : seulement ${rendus} regard(s) sur 3 rendus`)
    const v = await agent(pVerdict(e, r), { label: `verdict ${e.nom}`, phase: 'Verdict', schema: VERDICT, model: 'opus', effort: 'high' })
    return { extrait: e.nom, scene: e.scene, regards_rendus: rendus, verdict: v }
  }
)
return { relectures: res.filter(Boolean), sans_resultat: extraits.filter((e, i) => !res[i]).map(e => e.nom) }

export const meta = {
  name: 'video-refonte-v5',
  description: 'Refonte de la vidéo de démo après 45 s : un agent par scène en parallèle, critique adversariale, son, assemblage, revue',
  phases: [
    { title: 'Scènes', detail: 'un agent par scène, rendu et planches regardées, plusieurs passes', model: 'opus' },
    { title: 'Critique', detail: 'un critique adversarial par scène, puis correction', model: 'opus' },
    { title: 'Assemblage', detail: 'son, rendu complet 1080p 60 i/s, contrôles' },
    { title: 'Revue', detail: 'trois regards sur le film entier', model: 'opus' },
    { title: 'Corrections', detail: 'corrections par scène puis second assemblage', model: 'opus' },
  ],
}

const V = 'C:/Users/Adem/Secure Horizon/video'
const V5 = V + '/v5'

const REGLES = `
RÈGLES COMMUNES (non négociables)
- Tu écris UNIQUEMENT sous ${V5}/. Interdit de modifier ${V}/src, ${V}/essai, ${V}/apercu, ${V}/v4 (une autre session y travaille), livrables/, ou quoi que ce soit d'autre dans le dépôt. Aucun git add/commit/push.
- Ne lis jamais .env* (sauf *.example). Aucune clé affichée ni écrite. La voix n'est PAS régénérée : son texte, ses durées et les repères L.<id>.debut sont figés, tout le montage est calé dessus.
- Aucun téléchargement (image, police, son, échantillon). Tout est dessiné par le code ou vient des fichiers déjà dans le dépôt.
- Ne lance aucun script qui modifie la chaîne locale (port 8545) ni le site de démo : une autre session s'en sert.
- Vérité : les prises réelles de l'extension (${V5}/src/img/reel/f001..f184.jpg, img/panneau.png, retrait.png, apres.png, et docs/design/system/captures_reelles/) ne sont jamais retouchées dans leur contenu. Autorisé : recadrage, zoom, perspective, arrêt sur image, ordre conservé. Une prise réelle porte une petite légende « Prise réelle de l'extension ». Un écran dessiné qui imite le produit porte « maquette de l'écran ». Aucun texte « emplacement réservé ».
- L'écran réel dit « DUSDC » : tout texte animé que tu ajoutes à côté dit « 50 DUSDC », jamais « USDC ».
- Chiffres : uniquement ceux déjà dans la voix et dans ${V}/../METRIQUES.md. 34,2 % = Avalanche seulement. 87 / 65 / 15 % = « moteur de comparaison, jeu aveugle de 250 cas, ouvert une seule fois », pas l'extension. Interdits : « MetaMask ne le voit pas », « personne ne protège les particuliers », « rien ne quitte la machine », « déployé sur Fuji », toute mention d'Ethereum.
- Style du fondateur : encre blanche sur noir, aucune couleur, aucun dégradé décoratif, aucune carte ni look « slide », aucune barre de progression décorative, texte centré, police du film Montserrat Bold, police de l'écran produit Segoe UI. Le gant blanc plein n'apparaît qu'au verdict « Ça ne correspond pas » et sur le logo final. Tout ce qui ressemble à du « AI slop » est refusé.
- Sous-titres : en bas, gérés par le système existant (PLAYBOOK du fondateur : C:/Users/Adem/Video AI/systeme/PLAYBOOK.md, §9 et §13). Tu n'y touches pas, mais rien de ce que tu dessines ne doit passer dessous ou dessus (garde la bande basse libre).
- Rapporte ce que tu as mesuré et vu, rien d'autre. Si quelque chose ne marche pas, dis-le.`

const RETOUR_ADEM = `
CE QUE LE FONDATEUR A DIT EN VOYANT LE FILM ACTUEL (mot pour mot)
« À partir de 45 secondes, t'es parti en couille sur les animations. C'est devenu n'importe quoi. T'as fait aucun effort. » « La vidéo doit être beaucoup plus dynamique. » Avant : « je veux que ça bouge un peu plus », « l'animation doit aller beaucoup plus loin et être beaucoup plus fluide », « fais du motion design, donne-toi à fond ».
Le passage de 0 à 45 s (ouverture, ${V5}/src/film.js) est SA référence de qualité : c'est le niveau à atteindre et à dépasser sur chaque seconde du reste.
Ce qui est raté après 45 s dans la version actuelle : une petite fenêtre posée au centre gauche avec un texte fixe à côté, des plans qui tiennent plusieurs secondes sans rien qui bouge sauf une poussée de 5 %, des chiffres 87 / 65 / 15 posés sur des grilles immobiles, des poches minuscules perdues dans le noir, une entrée du gant sans impact, des légendes en corps 10 illisibles.`

const EXIGENCES = `
EXIGENCES DE MOUVEMENT (mesurées, pas déclarées)
- Aucune seconde « morte » : à tout instant quelque chose de signifiant bouge (pas seulement une dérive lente). Dans ta scène, l'énergie de mouvement par seconde (outil mouvement, voir socle) doit avoir une médiane au moins égale à 80 % de la médiane de l'ouverture, et aucune seconde sous le 1er quartile de l'ouverture, sauf le silence volontaire d'une demi-seconde avant un impact.
- Caméra jamais immobile et jamais gratuite : poussées franches, travellings le long d'un geste, changements d'échelle nets (très gros plan sur un mot, une pièce, un bouton ; puis plan large), transitions PAR le mouvement (l'objet d'un plan devient celui du suivant ; fouetté ; traversée), pas de fondu mou.
- Typographie cinétique : les mots clés arrivent sur le mot de la voix (repères L.<id>.debut), avec masse (arrivée, écrasement, rebond court), pas d'apparition en fondu. Très gros quand c'est le sujet du plan.
- Les chiffres claquent : montée, impact, secousse de caméra brève, flash d'une image ; puis ils vivent (le décor réagit).
- Les prises réelles ne sont jamais une vignette : l'écran occupe l'image, la caméra va chercher la zone qui compte (la phrase tapée, la ligne « Compris par Clef », le verdict, le bouton), en perspective légère si utile, avec des traits d'encre qui pointent ou encadrent, et des coupes au rythme de la voix.
- Courbes franches (jamais linéaire), flou de mouvement cohérent avec l'ouverture, 60 i/s en rendu final.
- Rythme : coupe ou événement fort au moins toutes les 2 à 3 s ; plus serré dans la menace ; un vrai ralenti et un silence avant le verdict et avant chaque révélation.
- Lisibilité : aucun texte utile sous 34 px en 1080p, rien hors cadre, rien qui chevauche les sous-titres.`

const SOCLE_SCHEMA = {
  type: 'object',
  properties: {
    scenes: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, fichier: { type: 'string' }, a: { type: 'number' }, b: { type: 'number' },
      lignes: { type: 'string', description: 'identifiants et texte des lignes de voix de la scène, avec leur début en secondes' },
      contenu: { type: 'string', description: 'ce que la scène doit faire comprendre et la matière réelle disponible' },
    }, required: ['id', 'fichier', 'a', 'b', 'lignes', 'contenu'] } },
    commandes: { type: 'string', description: 'commandes exactes : aperçu d\'une plage, planche, mesure du mouvement, repères sonores, rendu complet' },
    reference: { type: 'string', description: 'médiane, 1er quartile et minimum de l\'énergie de mouvement de l\'ouverture (0 à 45 s)' },
    equivalence: { type: 'string', description: 'comment tu as vérifié que le découpage rend les mêmes images qu\'avant' },
    notes: { type: 'string' },
  },
  required: ['scenes', 'commandes', 'reference', 'equivalence'],
}
const socle = {
 "scenes": [
  {
   "id": "s2b",
   "fichier": "C:/Users/Adem/Secure Horizon/video/v5/src/actes/s2b.js",
   "a": 29.004,
   "b": 40.164,
   "lignes": "p1 [29.504 à 31.844 s] « Chaque plateforme te fait signer une autorisation. » ; p2 [32.244 à 33.514 s] « Presque personne ne la lit. » ; p3 [35.014 à 37.954 s] « Sur Avalanche, trente-quatre pour cent sont illimitées. » ; p4 [38.404 à 39.214 s] « Une sur trois. »",
   "contenu": "Plan 2b. « Chaque plateforme te fait signer une autorisation. Presque personne ne la lit. Sur Avalanche, 34 autorisations sur cent sont illimitées. » Enjeu (g) : la personne signe plus qu'elle ne voulait ; une autorisation sur trois est illimitée (34,2 %, mesure sur un échantillon de blocs d'Avalanche, à écrire à l'image). Matière : dessin à l'encre (poches, mains des plateformes au bout de leurs cordes). C'est la suite directe de l'ouverture (film.js s'arrête à 29 s) : elle doit en avoir exactement le niveau."
  },
  {
   "id": "s3a",
   "fichier": "C:/Users/Adem/Secure Horizon/video/v5/src/actes/s3a.js",
   "a": 40.164,
   "b": 53.704,
   "lignes": "h1 [40.714 à 41.114 s] « Hold up. » ; h2 [41.564 à 44.574 s] « Une extension. Posée devant ton portefeuille. » ; h3 [45.174 à 47.074 s] « Avant de signer, une question. » ; h4 [47.474 à 48.234 s] « Que veux-tu faire ? » ; h5 [49.834 à 52.504 s] « Tu écris : échanger cinquante dollars. »",
   "contenu": "Plan 3, première moitié. Hold up se présente : une extension, avant de signer, une question « Que veux-tu faire ? », la personne tape « échanger 50 DUSDC contre AVAX », Clef range la phrase (quoi / combien / contre quoi) en un temps mesuré. Attendus : (a) temps de détection mesuré, classification par Clef, (c) vrai navigateur et vraie extension, (g) validation humaine. Matière réelle : src/img/reel/f001..f184.jpg (prise de la vraie fenêtre : question, frappe, « Compris par Clef en 0,9 s »), docs/design/system/captures_reelles/ (question_frappe.png, RESULTATS.json)."
  },
  {
   "id": "s3b",
   "fichier": "C:/Users/Adem/Secure Horizon/video/v5/src/actes/s3b.js",
   "a": 53.704,
   "b": 73.936,
   "lignes": "h6 [54.304 à 56.224 s] « Elle lit ce que la demande fait vraiment. » ; h7 [57.624 à 58.474 s] « Et elle compare. » ; h8 [59.974 à 61.704 s] « Le site demande tous tes dollars. » ; h9 [64.104 à 65.104 s] « Ça ne correspond pas. » ; h10 [66.004 à 68.756 s] « Tu as écrit cinquante. La demande donne tout. » ; h11 [70.156 à 72.836 s] « Un geste. Le droit revient à cinquante. »",
   "contenu": "Plan 3, seconde moitié : LE SOMMET DU FILM. Hold up lit ce que la demande fait vraiment, compare, « Le site demande TOUT », silence, le gant se lève sur « Ça ne correspond pas. », « Tu as écrit cinquante. La demande donne tout. », puis « Un geste. Le droit revient à cinquante. » : la PERSONNE clique « Limiter à 50 DUSDC et envoyer » (« Annuler » reste visible). Attendus : (b) réponse graduée, (a) décision rapide, (g) validation humaine. Matière réelle : src/img/reel (comparaison, verdict avec le gant, bouton, « C'est parti vers ton portefeuille »), docs/design/system/captures_reelles/ne_correspond_pas.png."
  },
  {
   "id": "s4",
   "fichier": "C:/Users/Adem/Secure Horizon/video/v5/src/actes/s4.js",
   "a": 73.936,
   "b": 88.696,
   "lignes": "k1 [74.636 à 76.636 s] « Maintenant, on pirate ce site. » ; k2 [77.936 à 80.256 s] « Sans Hold up : le compte tombe à zéro. » ; k3 [81.756 à 85.326 s] « Avec Hold up : le droit de cinquante a servi à l'échange. » ; k4 [86.526 à 87.746 s] « Il ne reste rien à prendre. »",
   "contenu": "Plan 4 : « Maintenant, on pirate ce site. Sans Hold up : le compte tombe à zéro. Avec Hold up : il ne reste rien à prendre. » Le piratage sans / avec : sans Hold up le compte passe de 50 à 0 ; avec, le droit a été ramené à 50 et consommé par l'échange, le pirate prend 0, il reste 50. Attendu (c) : de bout en bout, sur une copie locale d'Avalanche. Matière : dessin (guichet piraté, bras rayé, poches, cordes) avec en légende lisible « soldes lus sur la chaîne locale par preuve_piratage.mjs ». Chiffres exacts dans README.md à la racine du dépôt (section démo) et livrables/pitch_v7/PITCH_ADEM.md bloc 4."
  },
  {
   "id": "s5",
   "fichier": "C:/Users/Adem/Secure Horizon/video/v5/src/actes/s5.js",
   "a": 88.696,
   "b": 102.496,
   "lignes": "r1 [89.346 à 91.286 s] « Tu as déjà donné un droit trop large ? » ; r2 [91.986 à 94.626 s] « Révoquer, ce n'est pas annuler la transaction. » ; r3 [95.026 à 96.796 s] « C'est reprendre l'autorisation. » ; r4 [98.196 à 101.396 s] « Hold up prépare la transaction. Ton portefeuille la signe. »",
   "contenu": "Plan 5 : « Et si tu as déjà donné un droit trop large ? Tu peux retirer l'autorisation. Le droit revient à zéro. Chaque décision laisse une ligne. » Attendus : (b) retirer une autorisation après coup, (d) traçabilité, le journal. Matière réelle : src/img/panneau.png, retrait.png, apres.png (panneau de l'extension : « Retirer l'autorisation », retrait en cours, « Retirée »), journal.png ; docs/design/system/captures_reelles/panneau.png."
  },
  {
   "id": "s6",
   "fichier": "C:/Users/Adem/Secure Horizon/video/v5/src/actes/s6.js",
   "a": 102.496,
   "b": 114.596,
   "lignes": "m1 [103.196 à 105.806 s] « Deux cent cinquante cas. Écrits sans voir nos règles. » ; m2 [106.606 à 109.496 s] « Quatre-vingt-sept pour cent des demandes dangereuses : signalées. » ; m3 [110.796 à 113.396 s] « Sans la phrase de l'utilisateur : soixante-cinq. »",
   "contenu": "Plan 6 : la mesure. 150 demandes dangereuses, 100 honnêtes, écrites sans voir nos règles : 87 % signalées avec la phrase, 65 % sans, 15 % d'alertes à tort pour un objectif de 10 %. Attendu (a). Ces trois chiffres sont ceux du « moteur de comparaison, jeu aveugle de 250 cas, ouvert une seule fois », PAS de l'extension : la mention doit être lisible à l'image. Source : research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md (131/150, 97/150, 15/100) et METRIQUES.md. Matière : dessin (150 mains qui butent ou passent, nœuds faits avec ou sans la phrase)."
  },
  {
   "id": "s7",
   "fichier": "C:/Users/Adem/Secure Horizon/video/v5/src/actes/s7.js",
   "a": 114.596,
   "b": 125.268,
   "lignes": "f1 [115.396 à 116.328 s] « Tout site peut tomber. » ; f2 [117.228 à 119.278 s] « Ce qu'il emporte, c'est toi qui le décides. » ; f3 [120.878 à 121.468 s] « Hold up. »",
   "contenu": "Plan 7 : la fin. « Tout site peut tomber. Ce qu'il emporte, c'est toi qui le décides. Hold up. » Attendus : (e) le playbook en quatre lignes (qui est alerté : la personne devant son écran ; automatique : l'écart signalé ; humain : annuler, continuer, limiter, retirer l'autorisation ; documenté : une ligne de journal par décision), (f) NIST CSF Détecter et Répondre. Retour au plan large de l'ouverture (toutes les cordes nouées, le bras tire, rien ne part), puis le gant et « Hold up ». ATTENTION : l'ancienne ligne « Automatique : … le droit ramené au montant écrit » est fausse (c'est un clic de la personne) : corrige-la."
  }
 ],
 "commandes": "Depuis C:/Users/Adem/Secure Horizon/video/v5/src (Git Bash), détail dans C:/Users/Adem/Secure Horizon/video/v5/DIRECTION.md §7 : aperçu d'une plage : bash apercu.sh <a> <b> <nom> (écrit ../out/scenes/<nom>.mp4, 720p, 30 i/s, muet) ; mouvement : node mouvement.mjs ../out/scenes/<nom>.mp4 ; planche dense : node render.mjs --strip=<a>:<b> --dt=0.25 --cols=8 --w=480 --out=../out/planches/<nom>.jpg ; toutes les images d'un passage : --strip=<a>:<b> --step=1 ; images fixes : --stills=t1,t2 --out=../out/cles/<nom> ; bornes des scènes et débuts de lignes lus dans la page : node bornes.mjs ; repères sonores : node render.mjs --cues --out=../out/cues_<nom>.json ; son : \"C:/Users/Adem/Video AI/atelier/.venv/Scripts/python.exe\" -X utf8 -I son.py <cues.json> <mix.wav> ; rendu complet : node render.mjs --clip --out=<image.mp4> (option --range=a:b) puis bash assemble.sh <nom>.mp4. render.mjs finit par « 0 erreur de page », sinon code de sortie 2. Un nom de sortie différent par appel.",
 "reference": "La vraie ouverture (film.js) va de 0 à 29,0 s : c'est ELLE la référence. Énergie de mouvement par seconde sur 0 à 29 s : médiane 6,66 ; 1er quartile 3,88 ; minimum 1,39 (différence absolue moyenne par pixel entre images consécutives à 30 i/s, haut de l'image). Les anciennes scènes de 29 à 45 s étaient à 0,39 de médiane : c'est ce niveau-là que le fondateur a rejeté. Détail : C:/Users/Adem/Secure Horizon/video/v5/out/reference_mouvement.json.",
 "equivalence": "socle écrit par un agent (découpage, outils, DIRECTION.md) puis interrompu avant son rapport ; la page se charge sans erreur après resserrage des pauses (bornes.mjs : 0 erreur, durée 124,268 s)."
}
if (!socle || !socle.scenes || !socle.scenes.length) throw new Error('socle absent : pas de découpage en scènes')
log(`Socle prêt : ${socle.scenes.length} scènes. Référence de mouvement : ${socle.reference}`)

const SCENES = socle.scenes

const BUILD_SCHEMA = {
  type: 'object',
  properties: {
    fichier: { type: 'string' }, resume: { type: 'string', description: 'ce que montre la scène maintenant, seconde par seconde, en 12 lignes au plus' },
    passes: { type: 'number', description: 'nombre de cycles rendu + planche regardée + correction' },
    mouvement: { type: 'string', description: 'médiane et minimum mesurés sur la scène, comparés à la référence' },
    planche: { type: 'string', description: 'chemin de la dernière planche dense regardée' },
    limites: { type: 'string', description: 'ce qui reste faible, franchement' },
  },
  required: ['fichier', 'resume', 'passes', 'mouvement', 'limites'],
}
const CRIT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', description: 'true seulement si la scène tient la comparaison avec l\'ouverture et ne contient aucun défaut grave' },
    defauts: { type: 'array', items: { type: 'object', properties: {
      t: { type: 'string', description: 'instant ou plage en secondes du film' }, quoi: { type: 'string' }, gravite: { type: 'string', enum: ['grave', 'moyen', 'mineur'] }, piste: { type: 'string', description: 'correction concrète proposée' },
    }, required: ['t', 'quoi', 'gravite'] } },
    mouvement: { type: 'string' },
  },
  required: ['ok', 'defauts'],
}

const sceneBrief = s => `SCÈNE ${s.id} : de ${s.a} s à ${s.b} s. Ton fichier, le SEUL que tu modifies : ${s.fichier}
Voix (figée) : ${s.lignes}
Ce que la scène doit faire comprendre, et la matière réelle disponible : ${s.contenu}
Commandes du socle : ${socle.commandes}
Référence de mouvement de l'ouverture : ${socle.reference}
À lire d'abord : ${V5}/DIRECTION.md, ${V5}/src/film.js (la référence, lis-la vraiment), ${V5}/src/actes/commun.js et ${V5}/src/timeline.js (lecture seule ; s'il te manque un outil partagé, écris-le dans TON fichier avec un nom préfixé par l'id de la scène), ${V}/STORYBOARD.md.
ATTENTION AUX TEMPS : les silences de la voix ont été resserrés APRÈS le calcul des bornes ci-dessus (environ 8 s de moins sur le film). Les bornes a et b et les débuts de lignes qui font foi sont dans ${V5}/BORNES.md : lis ce fichier en premier et utilise SES valeurs pour tes rendus ; dans le code, cale-toi toujours sur L.<id>.debut, jamais sur un temps absolu.
CONSIGNES DU FONDATEUR, à lire AVANT tout et qui priment sur le reste : ${V5}/CONSIGNES_ADEM.md (« une vidéo très animée qui montre avant de dire », pas de zoom inutile sur les captures, la classification et la décision rapide mises en avant, chaque attendu du Track 1 visible, la limitation est un clic de la personne). Lis aussi ${V5}/CAHIER_DEFAUTS.md s'il existe : diagnostic indépendant de la version précédente, scène par scène ; chaque défaut qui touche ta scène doit avoir disparu.`

phase('Scènes')
const sonP = agent(`Tu refais le son d'impact d'un film de démonstration, jugé « sommaire » par le fondateur, qui veut un film « spectaculaire, type bande-annonce de film d'action ». Pas de musique : uniquement du sound design synthétisé par le code.
${REGLES}
Ton fichier, le SEUL que tu modifies : ${V5}/src/son.py (et des fichiers de test sous ${V5}/out/son/). Lis ${V5}/DIRECTION.md, ${V5}/src/son.py, ${V5}/src/assemble.sh et un fichier de repères produit par : ${socle.commandes}
À faire :
- garde le contrat d'entrée (repères {t, k, ...} + voix) et toutes les sortes existantes ; ajoute 'whoosh' {d} et 'impact' {g} ; toute sorte inconnue doit être ignorée avec un avertissement, pas une erreur (les agents des scènes ajoutent des repères en ce moment même) ;
- rends chaque sorte vraiment cinéma : 'boum' = sous-grave avec chute de hauteur + claquement bref + queue courte ; 'impact' = coup sec et large ; 'riser' = montée de bruit filtré qui se coupe NET avant l'impact ; 'whoosh' = passage filtré, panoramique gauche-droite ; nappe sous-grave discrète dans les plages « menace » ; les 'silence' coupent vraiment tout sauf la voix ; écrasement latéral (la voix passe toujours devant : baisse automatique des effets sous la voix) ; limiteur final, pas de saturation ;
- lis ${V5}/CAHIER_DEFAUTS.md et ${V5}/CONSIGNES_ADEM.md : le diagnostic liste les intervalles où le son du film précédent était en silence complet. Après 40 s, aucun silence complet de plus de 0,8 s, sauf les 'silence' voulus juste avant un impact : entre deux phrases il doit rester une matière sonore discrète (souffle, frottement de corde, grave tenu) qui suit l'image ;
- tu ne peux pas écouter : vérifie par mesure (LUFS intégré, crête vraie, niveau des effets sous la voix) et par image (spectrogramme ffmpeg showspectrumpic de 3 passages, que tu regardes) que chaque sorte a la forme voulue et que la voix reste intelligible (rapport voix/effets d'au moins 9 dB pendant les mots).
Rends : ce que tu as changé par sorte, les mesures, les limites.`, { label: 'son', phase: 'Scènes', model: 'opus' })

const construire = s => agent(`Tu es motion designer. Tu refais entièrement UNE scène d'un film de démonstration de 2 min 12 pour un jury de hackathon. D'autres agents refont les autres scènes en même temps.
${RETOUR_ADEM}
${sceneBrief(s)}
${EXIGENCES}
${REGLES}

MÉTHODE (obligatoire)
1. Regarde l'existant : rends une planche dense de ta scène (une image toutes les 0,25 s) et une de l'ouverture (10 à 25 s), et REGARDE-les (outil Read sur le .jpg). Écris pour toi ce qui rend l'ouverture vivante et ce qui tue ta scène.
2. Écris un découpage plan par plan calé sur les mots de la voix (chaque mot fort = un événement visuel). Cherche l'idée visuelle forte de la scène : la métaphore du film est « chaque autorisation est une main de la plateforme dans ta poche, au bout d'une corde ; le droit de prendre est une longueur de bras ». Fais-la jouer avec la matière réelle (écran de l'extension, panneau, soldes mesurés).
3. Réécris ta scène. Ne te contente pas de retoucher : la structure actuelle (vignette + texte fixe) est ce que le fondateur a rejeté.
4. Boucle au moins TROIS fois : rendu de ta plage (apercu.sh, nom de sortie = ${s.id}_passeN), planche dense REGARDÉE, mesure du mouvement, liste de défauts, correction. Vérifie aussi 0,5 s avant et après tes bornes que la transition avec les scènes voisines tient (entre et sors par un mouvement, sur fond noir franc aux bornes).
5. Mets à jour TES repères sonores (sortes autorisées dans DIRECTION.md, plus 'whoosh' et 'impact') pour que chaque événement visuel fort ait son son, et tes CLES.
6. Aucune erreur de page au rendu ; le film entier doit toujours se charger (vérifie une image hors de ta scène).
Rends : ton fichier, ce que la scène montre maintenant, le nombre de passes, le mouvement mesuré face à la référence, la dernière planche, et ce qui reste faible.`, { label: `scène ${s.id}`, phase: 'Scènes', schema: BUILD_SCHEMA, model: 'opus' })
const critiquer = (b, s) => agent(`Tu es le critique le plus dur d'un studio de motion design. Un collègue vient de refaire une scène ; ton travail est de trouver tout ce que le fondateur rejetterait. Tu ne modifies aucun fichier de scène.
${RETOUR_ADEM}
${sceneBrief(s)}
${EXIGENCES}
${REGLES}
Ce que le collègue déclare : ${b ? JSON.stringify(b) : 'aucun rapport rendu'}
Ne le crois pas : rends toi-même la scène (apercu.sh, nom ${s.id}_critique), fais une planche dense (0,25 s) de toute la plage et une planche de l'ouverture (10 à 25 s), REGARDE les deux, mesure le mouvement seconde par seconde. Cherche, avec l'instant précis : secondes mortes ou simple dérive ; vignette ou texte fixe ; texte illisible, trop petit, hors cadre, qui se chevauche ou qui gêne les sous-titres ; événement visuel pas calé sur le mot de la voix ; transition molle aux bornes ; look « slide » ou « AI slop » ; gant utilisé hors du verdict et du logo ; prise réelle retouchée ou sans légende, « USDC » à côté d'un écran « DUSDC », chiffre ou mention interdits ; erreur de page. Pour chaque défaut, une correction concrète. ok = true seulement si tu montrerais cette scène au fondateur à côté de l'ouverture sans rougir.`, { label: `critique ${s.id}`, phase: 'Critique', schema: CRIT_SCHEMA, model: 'opus' })
const corriger = (c, s) => {
    const lourds = c && c.defauts ? c.defauts.filter(d => d.gravite !== 'mineur') : []
    if (c && c.ok && !lourds.length) return { scene: s, critique: c, corrige: null }
    return agent(`Tu es motion designer. Ta scène vient d'être critiquée ; corrige TOUS les défauts graves et moyens, et les mineurs si c'est rapide. Si le critique dit que la scène reste statique ou « slide », reprends la structure, ne te contente pas d'un réglage.
${RETOUR_ADEM}
${sceneBrief(s)}
${EXIGENCES}
${REGLES}
Défauts relevés : ${JSON.stringify(c ? c.defauts : [{ t: 'toute la scène', quoi: 'critique indisponible : refais une passe complète de contrôle toi-même', gravite: 'grave' }])}
Méthode : pour chaque défaut, corrige, rends la plage (apercu.sh, nom ${s.id}_corr), regarde une planche dense, mesure le mouvement. Deux cycles au moins. Aucune erreur de page, le film entier se charge toujours.
Rends : ton fichier, ce que la scène montre maintenant, le nombre de passes, le mouvement mesuré, la dernière planche, les défauts NON corrigés et pourquoi.`, { label: `correction ${s.id}`, phase: 'Critique', schema: BUILD_SCHEMA, model: 'opus' }).then(r => ({ scene: s, critique: c, corrige: r }))
}
const buildsP = parallel(SCENES.map(s => () => construire(s).then(b => ({ s, b }))))
const [son, builtAll] = await Promise.all([sonP, buildsP])
const built = builtAll.filter(Boolean)
if (built.length < SCENES.length) log(`Attention : ${SCENES.length - built.length} scène(s) sans résultat (agent interrompu).`)

const ASM_SCHEMA = {
  type: 'object',
  properties: {
    film: { type: 'string' }, apercu720: { type: 'string' }, duree: { type: 'number' },
    mesures: { type: 'string', description: 'résolution, cadence, LUFS, crête, images figées de plus de 1,5 s, erreurs de page' },
    planches: { type: 'string', description: 'chemins des planches du film entier (une image par seconde)' },
    problemes: { type: 'string' },
  },
  required: ['film', 'apercu720', 'duree', 'mesures', 'problemes'],
}
const assembler = nom => agent(`Tu assembles le film entier et tu le contrôles. COMMENCE par figer les sources : copie ${V5}/src vers ${V5}/gel/${nom}/src et ${V5}/essai vers ${V5}/gel/${nom}/essai (les chemins relatifs entre src et essai restent valides), puis travaille UNIQUEMENT depuis cette copie figée : d'autres agents continuent de modifier ${V5}/src pendant ton rendu. Les sorties vont quand même dans ${V5}/out/. Va vite : c'est ce film que le fondateur attend. Tu ne modifies aucun fichier de scène ni son.py (si quelque chose casse le rendu, dis précisément quoi et où, et arrête-toi là).
${REGLES}
Commandes du socle : ${socle.commandes}
À faire : (1) repères sonores -> son (son.py) ; (2) rendu complet 1920x1080 à 60 i/s : découpe en 4 à 6 plages rendues EN PARALLÈLE (render.mjs --clip --range), puis concaténation sans perte par ffmpeg ; (3) assemblage image + son (assemble.sh ou équivalent : H.264 High, AAC 48 kHz, faststart) dans ${V5}/out/${nom}.mp4, et une copie 1280x720 dans ${V5}/out/${nom}_720p.mp4 ; ne réécris jamais un fichier existant ; (4) contrôles : durée (doit rester sous 180 s et égale à la voix), LUFS intégré et crête vraie, images figées (freezedetect d=1.5), noir de plus de 1 s, erreurs de page dans la sortie du rendu, synchronisation image/son (même durée à 0,05 s près) ; (5) planches du film entier, une image par seconde, par tranches de 30 s, dans ${V5}/out/planches_${nom}/ ; REGARDE-les toutes et note tout défaut visible avec son instant ; (6) vérifie qu'aucun fichier sous ${V5} ne contient de clé (motifs GRADIUM, Bearer, jeton long) sans lire .env.
Rends les chemins, la durée, les mesures et les problèmes.`, { label: `assemblage ${nom}`, phase: 'Assemblage', schema: ASM_SCHEMA, model: 'sonnet' })

phase('Assemblage')
const [filmA, scenes] = await Promise.all([
  assembler('film_v5_a').then(f => { if (f) log(`Premier film assemblé, avant critique : ${f.apercu720} (${f.duree} s). ${f.problemes}`); return f }),
  pipeline(built, x => critiquer(x.b, x.s), (c, x) => corriger(c, x.s)),
])
const faites = scenes.filter(Boolean)
const filmB = faites.some(x => x.corrige) ? await assembler('film_v5_b') : null
const film1 = filmB || filmA
if (!film1) throw new Error('assemblage a échoué')
log(`Film après critique par scène : ${film1.apercu720} (${film1.duree} s). ${film1.problemes}`)

phase('Revue')
const REVUE_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string' },
    defauts: { type: 'array', items: { type: 'object', properties: {
      scene: { type: 'string', description: 'id de la scène (s2b, s3a, s3b, s4, s5, s6, s7), ou ouverture, ou son, ou global' },
      t: { type: 'string' }, quoi: { type: 'string' }, gravite: { type: 'string', enum: ['grave', 'moyen', 'mineur'] }, piste: { type: 'string' },
    }, required: ['scene', 't', 'quoi', 'gravite'] } },
  },
  required: ['verdict', 'defauts'],
}
const bornes = SCENES.map(s => `${s.id} : ${s.a} à ${s.b} s`).join(' ; ')
const REGARDS = [
  { cle: 'dynamisme', quoi: `REGARD : le fondateur. Il a dit : « à partir de 45 secondes, t'es parti en couille sur les animations, aucun effort » et « la vidéo doit être beaucoup plus dynamique ». L'ouverture (0 à 45 s) est sa référence. Passe le film seconde par seconde après 45 s : où est-ce que ça retombe ? vignette, texte fixe, dérive lente, plan qui dure, transition molle, chiffres posés, rythme qui s'endort, style qui change d'une scène à l'autre (les scènes ont été faites par des agents différents : cherche les ruptures de style, d'épaisseur de trait, de taille de texte, de vitesse). Mesure le mouvement par seconde sur tout le film (${V5}/src/mouvement.mjs) et donne les secondes sous le 1er quartile de l'ouverture.` },
  { cle: 'exactitude', quoi: `REGARD : un juré qui vérifie. Relève chaque texte et chaque chiffre à l'écran et dans les sous-titres et compare-les à ${V}/../METRIQUES.md, ${V}/../preuves/RESULTAT_RESERVE_MOTS.md et ${V5}/src/voix_film.json : chiffre faux ou non qualifié (87 / 65 / 15 % doivent être dits « moteur de comparaison »), 34,2 % sans « Avalanche », mention interdite, « USDC » à côté d'un écran « DUSDC », prise réelle sans légende ou écran dessiné sans « maquette de l'écran », texte « emplacement réservé », promesse que le produit ne tient pas (limitation « automatique » alors que c'est un bouton que la personne clique). Vérifie aussi les sous-titres contre C:/Users/Adem/Video AI/systeme/PLAYBOOK.md §9 et §13 (position basse, 2 à 5 mots, rien dessous ni dessus).` },
  { cle: 'spectateur', quoi: `REGARD : quelqu'un qui ne connaît rien au projet et voit le film une fois. Comprend-il en regardant : le problème (une autorisation illimitée laissée à une plateforme piratée plus tard), le geste (écrire ce qu'on veut faire avant de signer), ce que fait le produit (compare, lève le gant, propose de limiter), la preuve (piratage sans / avec), la mesure et ses limites ? Relève tout ce qui est illisible (trop petit, trop bref : un texte doit rester au moins 0,25 s par mot), hors cadre, chevauché, tout événement visuel décalé par rapport au mot de la voix (repères dans le fichier de repères), tout plan dont on ne comprend pas le sens, et le moment le plus fort manqué (le gant et « TOUT » doivent être le sommet du film).` },
]
const revues = (await parallel(REGARDS.map(r => () => agent(`Tu revois un film de démonstration entier avant qu'il soit montré au fondateur. Tu ne modifies rien.
${REGLES}
Film : ${film1.film} (copie 720p : ${film1.apercu720}). Planches par seconde : ${film1.planches || V5 + '/out/'}. Consignes du fondateur à lire d'abord : ${V5}/CONSIGNES_ADEM.md (et ${V5}/CAHIER_DEFAUTS.md s'il existe). Bornes des scènes : ${bornes}. Sources : ${V5}/src (une scène = un fichier sous actes/), direction : ${V5}/DIRECTION.md.
${r.quoi}
Fais tes propres planches denses là où tu doutes (ffmpeg sur le film, une image toutes les 0,25 s) et REGARDE-les. Chaque défaut : scène, instant, ce qui ne va pas, gravité, correction concrète. Sois dur : un défaut non relevé ici sera vu par le fondateur.`, { label: `revue ${r.cle}`, phase: 'Revue', schema: REVUE_SCHEMA, model: 'opus' })))).filter(Boolean)
const tous = revues.flatMap(r => r.defauts || [])
const parScene = {}
for (const d of tous) { if (d.gravite === 'mineur') continue; (parScene[d.scene] = parScene[d.scene] || []).push(d) }
const mineurs = tous.filter(d => d.gravite === 'mineur').length
log(`Revue : ${tous.length} défauts, dont ${mineurs} mineurs laissés de côté ; scènes à reprendre : ${Object.keys(parScene).join(', ') || 'aucune'}`)

phase('Corrections')
let film2 = null, corrections = []
const cibles = Object.keys(parScene)
if (cibles.length) {
  corrections = (await parallel(cibles.map(id => () => {
    const s = SCENES.find(x => x.id === id)
    if (s) return agent(`Tu es motion designer. Le film entier vient d'être revu par trois regards (le fondateur, un juré qui vérifie, un spectateur neuf). Corrige dans TA scène tous les défauts ci-dessous. Si on te dit que la scène retombe ou rompt le style, reprends la structure.
${RETOUR_ADEM}
${sceneBrief(s)}
${EXIGENCES}
${REGLES}
Défauts à corriger : ${JSON.stringify(parScene[id])}
Méthode : corrige, rends ta plage (apercu.sh, nom ${s.id}_revue), regarde une planche dense, mesure le mouvement ; deux cycles au moins ; aucune erreur de page.
Rends : ton fichier, ce que la scène montre maintenant, les passes, le mouvement mesuré, la dernière planche, ce qui n'est PAS corrigé et pourquoi.`, { label: `reprise ${id}`, phase: 'Corrections', schema: BUILD_SCHEMA, model: 'opus' }).then(r => ({ id, r }))
    const fichier = id === 'son' ? `${V5}/src/son.py` : id === 'ouverture' ? `${V5}/src/film.js` : `${V5}/src/actes/index.js et ${V5}/src/timeline.js`
    return agent(`Le film entier vient d'être revu. Corrige les défauts ci-dessous, qui ne relèvent pas d'une scène précise. Fichiers que tu peux modifier : ${fichier} (rien d'autre ; pour l'ouverture, corrections minimales seulement : c'est la référence validée par le fondateur, on n'en change pas le style).
${REGLES}
Commandes du socle : ${socle.commandes}
Défauts : ${JSON.stringify(parScene[id])}
Vérifie chaque correction par un rendu et une planche regardée (ou une mesure pour le son). Rends ce que tu as corrigé et ce que tu as laissé, avec la raison.`, { label: `reprise ${id}`, phase: 'Corrections', model: 'opus' }).then(r => ({ id, r }))
  }))).filter(Boolean)
  film2 = await assembler('film_v5_c')
}

return {
  dossier: V5,
  film: film2 ? film2.film : film1.film,
  apercu720: film2 ? film2.apercu720 : film1.apercu720,
  film_avant_critique: filmA,
  premier_film: film1,
  second_film: film2,
  reference_mouvement: socle.reference,
  equivalence_socle: socle.equivalence,
  scenes: faites.map(x => ({ id: x.scene.id, critique_ok: x.critique ? x.critique.ok : null, defauts_critique: x.critique ? x.critique.defauts.length : null, final: x.corrige || null })),
  son: son,
  revue: revues.map(r => r.verdict),
  defauts_revue: tous,
  corrections: corrections,
}

# Pitch Hold up V7 (11/10/2026) : fusion de V6, des notes du round 3, du pitch d'Adem et du jeu aveugle

> **Mis à jour le 11 oct. vers 11h20 (MSG-080).** Version à dire : `livrables/PITCH_5MIN.md` et `livrables/PITCH_3MIN.md`. Chiffres : `METRIQUES.md` fait foi. Avalanche seulement : aucun chiffre d'une autre chaîne dans le discours. Le carton « la phrase, le code, le cahier » n'existe plus dans le deck. Écran de l'extension livrée : « Ça ne correspond pas à ce que tu as écrit. », le gant, « Limiter à 50 USDC et envoyer » ; panneau « Retirer l'autorisation ». Les réponses ci-dessous gardent leur date : en cas d'écart, `livrables/QR_JURY.md` et `METRIQUES.md` l'emportent.

Sources : `PITCH_V6_TITOUAN.md` (base Titouan) ; `pitch_loop/round3/` (Team1 68, AWS 71, KPMG 75, Kryptosphère 77, Utopia 79, moyenne 74,0 sur V5) ; `livrables/pitch_v7/` (pitch d'Adem, commits a09be1d et f1ca0ec, lu sans modification) ; `T_banc_e2e/blind_decalage/run/RESULTAT.md` (jeu aveugle) ; `research/titouan/BM2/BM_MODELE.md` (modèle économique). Chiffres : `livrables/CHIFFRES.md` seulement.

Ce que la fusion prend à chacun :
- **D'Adem** : la structure guidée par la démo (deux fenêtres, le même site, l'un piraté), le contraste « Cent USDC. Zéro. » contre « droit ramené à 50 », la main levée, le cas LI.FI dit sans chiffre, la liste « contrôlé aujourd'hui, pas encore », la phrase de fin « On ne sait pas quel site sera piraté. On décide de ce qu'on lui laisse. »
- **De V6 et des jurés** : quatre chiffres seulement à l'oral (34 %, 87 %, 65 %, 15 %) ; « ça correspond, d'après ce que Hold up sait lire, ce n'est pas une garantie » à la place de « jamais de vert » ; la limite du jeu aveugle dite (auteur de la même famille de modèles, seuil de faux rouges manqué) ; une scène « après l'alerte » (révoquer) ; ce qu'on ne couvre pas ; la phrase sur MetaMask, réservée à une adresse non listée ; la promesse « cesser de donner plus que nécessaire, car on s'expose en le faisant ».
- **De BM2** : en 30 secondes, le particulier ne paie pas ; API « verdict avant retrait », licence pour portefeuilles, mandats pour agents ; pilotes B2B tout de suite.
- **Retiré du texte dit** : Aerodrome et ses 81 minutes, NIST SP 800-207 (absent du dépôt), l'essai d'Anthropic (207 sur 405, trop proche de « l'ère de l'IA »), 83,85 M$ et 106 106, 153 portefeuilles et 11,6 M$, Vitalik Buterin, Detect et Respond, le 1,3 %. Tout reste disponible en questions.
- **Jamais dit** : « bloque », « premier », « sécurisé », « rien ne quitte la machine », « à l'ère de l'IA », « jamais de vert », DORA ou MiCA comme conformité, chiffres retirés, « sur Fuji » (D-016 : démonstration sur une copie locale d'Avalanche ; déploiement Fuji préparé et répété, non exécuté).

Ce qui est prouvé dans la démo (d'après `livrables/pitch_v7/DEMO_DEROULE.md`) : scènes jouées dans un vrai Chromium avec l'extension, portefeuille simulé, chaîne locale, jetons de démo déclarés à la main. « Cent, zéro » vient d'un script qui lit la chaîne, pas de la page : légende obligatoire. La révocation tourne dans la démo web seulement (portefeuille simulé), pas dans l'extension.

Temps de parole : 560 mots dits (comptage en fin de fichier), 4 min 18 s à 130 mots par minute, plus environ 40 secondes de gestes. C'est juste : si une scène traîne, couper la section « Le fait » (LI.FI passe en question).

## 0:00 à 0:15. Deux fenêtres (Adem)
« Deux fenêtres, le même site. Même adresse, même bouton. L'un des deux a été piraté cette nuit. Lequel ? À l'œil, impossible à dire. Alors on a arrêté de deviner. »

## 0:15 à 0:35. Le postulat (Adem)
« Tout service peut être compromis un jour. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre. Or, 34 % des autorisations lues sur Avalanche sont illimitées, une sur trois : notre mesure, sur un échantillon de blocs. C'est donner un double de toutes les clés de la maison au plombier. »

## 0:35 à 1:05. Le site honnête (Adem, fenêtre de gauche)
« Hold up est une extension posée devant le portefeuille que vous avez déjà. Elle ne tient pas vos clés. Avant chaque signature, une question : que veux-tu faire ? J'écris : échanger 50 USDC contre AVAX. Le site demande le droit de prendre 50 USDC. Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. La demande part vers le portefeuille. »

## 1:05 à 1:30. Le site piraté, sans Hold up (Adem, fenêtre de droite, puis terminal)
« Maintenant, je pirate ce site. Même page. Seul change ce que le bouton envoie : un droit sur tout mon USDC, pour le pirate. MetaMask affiche "illimité" sans alerte si l'adresse n'est sur aucune liste. Il ne sait ni combien je voulais donner, ni à qui. Je signe. Cent USDC. Zéro. »

## 1:30 à 2:00. Avec Hold up (Adem)
« Avec Hold up, la même phrase. Ça ne correspond pas : tu as écrit 50 USDC, la demande donne accès à tout ton USDC. Hold up lève la main. J'annule, rien ne part. Ou je clique sur Limiter à 50 USDC et envoyer : rien ne part tout seul. Le pirate ne peut prendre que ce que j'avais écrit. »

## 2:00 à 2:20. Après l'alerte (Adem, démo web)
« Et une autorisation trop large déjà donnée ? Dans le panneau : Retirer l'autorisation. Hold up prépare le retrait, le portefeuille le signe. Chaque décision est notée dans un journal chaîné. Branché, testé sans navigateur, pas encore devant un vrai portefeuille. »

## 2:20 à 2:35. Le fait (Titouan)
« C'est déjà arrivé. LI.FI, juillet 2024 : une faille chez un service honnête. Les droits illimités ont été vidés. Les droits limités n'ont rien perdu, selon son rapport. »

## 2:35 à 3:25. La preuve (Titouan)
« Notre preuve : notre moteur de comparaison, sur un jeu aveugle de 250 cas, ouvert une seule fois. Des arnaques et leurs jumeaux honnêtes, écrits par un autre auteur qui n'avait jamais vu nos règles. Moteur figé, critères publiés avant. Résultat : 87 % des arnaques signalées. Sans la phrase écrite, le même code tombe à 65 %. Mais 15 % des opérations honnêtes reçoivent un rouge, au-dessus de notre seuil, surtout des achats de NFT à prix presque nul. Et l'auteur est une IA de la même famille que celle qui nous a aidés : pas encore un test humain. »

## 3:25 à 3:50. Données et trace (Titouan)
« La phrase écrite part vers un modèle hébergé, par un relais sur votre machine ; jamais la demande du site, ni votre adresse. Chaque décision est notée dans un cahier numéroté : une page changée ou arrachée se voit. La personne garde le dernier geste. »

## 3:50 à 4:15. Ce qu'on ne couvre pas (Titouan)
« Hold up contrôle le montant d'un droit, un paiement, une prise de contrôle du compte. Pas encore le sens d'un échange. Ni la fraude que vous voulez vraiment faire, ni un Ledger branché en direct, ni le téléphone. Jamais essayé devant un vrai MetaMask : ici, une copie locale d'Avalanche. »

## 4:15 à 5:00. Modèle et promesse (Titouan)
« Le particulier ne paie pas. Paient ceux qui remboursent la fraude : exchanges et fintechs, avec une API de verdict avant retrait ; portefeuilles, avec une licence ; demain, les agents qui dépensent, avec des mandats écrits. Nous cherchons des pilotes dès maintenant.
Notre promesse : cesser de donner plus que nécessaire, car on s'expose en le faisant. On ne sait pas quel site sera piraté. On décide de ce qu'on lui laisse. »

## Questions probables

- **Votre preuve est-elle indépendante ?** « Plus qu'avant, pas complètement. Le jeu aveugle a été mesuré par notre moteur de comparaison, pas par l'extension livrée. Il a été écrit sans lire nos règles, scellé par une empreinte publiée, ouvert une seule fois, moteur figé (commit 74203da, trois fichiers modifiés non commités, notés au journal d'ouverture). Mais l'auteur est une IA de la même famille que celle qui nous a aidés, et les cas sont synthétiques. Il manque un jeu écrit par des personnes. »
- **Quels étaient les critères ?** « Publiés avant l'ouverture : au moins 80 % d'arnaques signalées, au plus 10 % de rouges sur les honnêtes. Le premier est atteint (87,3 %, intervalle 81,1 à 91,7). Le second non (15,0 %, intervalle 9,3 à 23,3). Rien n'a été réglé après. »
- **87 %, c'est en rouge ?** « Non, c'est rouge ou avertissement. En rouge seul : 76,0 %. Sur la famille de la scène (droit illimité sur un échange) : 18 sur 19 signalés, 5 sur 19 en rouge, et 6 sur 19 sans la phrase. »
- **D'où viennent les 15 % ?** « 11 des 15 faux rouges viennent d'une seule famille : un achat de NFT honnête à prix quasi nul. Nous ne la retirons pas du calcul. Avec les avertissements, 30 % des honnêtes reçoivent une alerte. Sur la famille de la scène : 0 faux rouge sur 13. »
- **Où êtes-vous faibles ?** « Jeton différent de celui écrit : 63 % signalés. Chaîne ou domaine différent : 67 %, souvent invérifiable. Et sur 58 paires d'essai, 18 seulement sont vraiment contrôlées : pas encore le sens d'un échange, la contrepartie, la durée d'un droit, ni à qui il est donné. »
- **Dans votre scène, les 50 partent chez le pirate.** « Oui. La perte est bornée, pas évitée. Hold up ne contrôle pas encore à qui le droit est donné. Le cas LI.FI montre la même chose dans la vraie vie : les droits limités n'ont rien perdu. »
- **Et votre grille (86,6 %, 1,3 %) ?** « Nous ne la citons plus : chaîne de banc, jeu devenu de réglage, pas l'extension. Rejouée à travers l'extension livrée et le vrai relais, elle donne 38,2 % attrapé et 9,1 % de fausses alertes, sur un build en partie en panne. Sur le jeu aveugle, le modèle qui classe fait 88,7 % et 16,0 % de faux rouges, contre 87,3 % et 15,0 % pour le code seul : pas de gain net mesurable. »
- **Alors à quoi sert le modèle ?** « À comprendre un français familier. Ce qui sert sur le jeu aveugle, c'est la phrase : +34 arnaques signalées sur 150 par rapport au plancher sans phrase. »
- **« Ça correspond », c'est un feu vert ?** « Non : ça correspond, d'après ce que Hold up sait lire, ce n'est pas une garantie. Dans la scène, ce « correspond » porte sur le droit de 50 USDC ; la deuxième demande, l'échange lui-même, n'est pas comparée. Le portefeuille demande toujours son geste. »
- **Où part la phrase ?** « Dans le build livré, la phrase seule part vers le modèle Clef, par un relais sur la machine qui garde la clé. Les montants, jetons et adresses sont lus par du code, sur place. Base légale et durée de conservation chez le fournisseur ne sont pas rédigées. Une version sans réseau existe, qui lit par mots-clés et comprend moins. »
- **Qui est responsable si le modèle comprend mal ?** « Il ne décide ni du montant ni de l'adresse, et ne peut pas baisser une alerte du code. Une erreur de sens peut manquer une alerte de comparaison ; une fausse alerte coûte un clic. La personne garde le dernier geste. Pour l'AI Act : une décision, une ligne, l'humain tranche, sans qualification juridique établie. Les obligations des plateformes régulées restent à la plateforme qui déploie : nous ne revendiquons aucune conformité. »
- **Le cahier peut-il être réécrit ?** « Une ligne changée, retirée ou déplacée au milieu se voit, y compris dans le build autonome. Une réécriture complète ne se voit pas sans ancrage externe, non fait. Et l'audit a trouvé deux inexactitudes : le passage automatique de la deuxième demande est noté comme une confirmation humaine, et la limitation à 50 USDC n'y figure pas. À corriger. »
- **La révocation est-elle réelle ?** « Dans la démo web, oui pour le calcul : 25 tests du module, 135 vérifications de la page, demande recomparée à l'encodeur du moteur. Le portefeuille est simulé, et le bouton n'est pas encore dans l'extension. Un Permit signé ne se révoque pas en un clic : pas de bouton. »
- **Avez-vous essayé avec un vrai MetaMask ?** « Non. Portefeuille simulé, copie locale d'Avalanche. La phrase sur MetaMask vient de son code public. »
- **Et Fuji ?** « Démonstration sur une copie locale d'Avalanche. Déploiement Fuji préparé et répété, non exécuté. »
- **C'est sécurisé ?** « Nous ne le disons pas. Une revue interne a trouvé des contournements. Les correctifs sont écrits et testés en Node, pas encore vérifiés dans un vrai Chrome. »
- **Et si MetaMask élargit son questionnaire ?** « Il a déjà l'écran. Notre avance : une phrase libre, sur toute demande, comparée à l'effet. Ce n'est pas une barrière durable. L'idée de dire d'abord ce qu'on veut a été décrite par Vitalik Buterin en février 2026 : nous l'assemblons pour un particulier. »
- **L'escroc coache la victime ?** « Si la phrase dictée est exacte, la comparaison ne voit rien. Les règles de base voient encore un droit illimité vers une adresse inconnue. Un envoi consenti n'est pas couvert. »
- **Qui paie ?** « Pas le particulier. Ceux qui portent la perte : exchanges et fintechs, avec une API de verdict avant retrait ; portefeuilles, avec une licence SDK ; plus tard, plateformes d'agents, avec des mandats écrits. Aucun prix de marché comparable, aucun client : les prix envisagés sont des hypothèses (`BM2/BM_MODELE.md`). Premier revenu visé : l'API ; premier pilote : un portefeuille. »
- **Pourquoi ne pas finir comme Harpie ou Wallet Guard ?** « Harpie était payée après le vol. Nous visons un service continu, avant la signature, vendu à des plateformes. L'issue probable du secteur est l'intégration ou le rachat : nous le savons. »
- **Pour une banque ou un exchange ?** « Le même moteur pourrait répondre avant un retrait. Non construit : c'est l'objet des pilotes. »
- **La douleur a fondu en un an ?** « Selon Scam Sniffer, 83,85 M$ en 2025, sans comparaison à une autre année. Notre thèse ne repose pas sur une courbe mais sur un mécanisme : ce qu'on perd dépend du droit laissé. »
- **Latence ?** « Dans la scène, verdict environ 400 ms après Entrée sans le modèle, 1,1 s avec. »

## Comptage

Comptage par script Node (découpe sur les espaces, mots contenant au moins une lettre ou un chiffre), de « ## 0:00 » à « ## Questions probables », sans les titres ni le contenu entre crochets : **560 mots**, soit 4 min 18 s à 130 mots par minute.

Chiffres dits (4) : 34 % (METRIQUES.md, Avalanche, 34,2 %), 87 % (A6 bras a, 87,3 %), 65 % (A6 bras c, 64,7 %), 15 % (A6 bras a, 15,0 %). Les montants 50 et 100 USDC sont ceux de la scène, pas des mesures.

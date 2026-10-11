# Deck Hold up : 8 slides

Source des chiffres : `research/titouan/W_livrables/RESULTATS_A_JOUR.md` (RAJ), `redteam/angles_morts/03_chiffres_et_methode.md` (AM03), `research/demo_reelle/RECHERCHE_demos.md` (RD). Tout chiffre cite son jeu. Ce qui n'est pas mesuré s'écrit « à mesurer ».
Le fichier `holdup.pptx` est généré par `livrables/deck/build_deck.js` (lancer `node livrables/deck/build_deck.js` avec `pptxgenjs` installé). Les notes orateur du pptx sont celles de ce fichier.
Répartition du temps (round 1, 5 min) selon la grille : détection 30, réponse 20, faisabilité 20, conformité 15, pitch 15. Les slides 3 à 5 portent donc 3 min sur 5.

## Slide 1. Une signature gratuite a vidé le compte (problème)
- Message : une personne ordinaire perd tout son solde en signant un message qui ne coûte rien.
- À l'écran : à gauche, la capture de `lure.html` (marque fictive Glacier Rewards). À droite, un seul grand chiffre : 83,85 M$ volés à 106 106 victimes en 2025 par hameçonnage de signatures (ScamSniffer, RD). Sous le chiffre : « Permit et Permit2 : environ 38 % des pertes des cas supérieurs à 1 M$ (RD) ».
- Notes : « Camille a un wallet normal. Un message promet une récompense. Le site lui fait signer un message gratuit. Une signature, aucun frais, et son USDC part. Ce n'est pas rare : 106 106 victimes en 2025. »

## Slide 2. Un particulier avec un wallet normal (cible)
- Message : on protège la personne au moment où elle signe, pas un protocole.
- À l'écran : trois colonnes : qui (MetaMask, Rabby, Core, pas technique, parfois sous pression d'un faux support), quand (juste avant de signer ou d'envoyer), douleur (elle lit « Signer » et ne voit pas le droit qu'elle donne). Ligne du bas : « Pas de Safe, pas d'EIP-7702, pas de matériel dédié » (D-007).
- Notes : « Cible : le particulier avec un wallet normal, atteint par le wallet ou la plateforme. On n'a pas de témoignage d'utilisateur : la douleur vient des pertes publiées, pas d'entretiens. »

## Slide 3. Tu crois / En vrai (solution)
- Message : avant la signature, Hold up compare ce que la personne croit faire avec ce que l'opération fait, et la ralentit si ça diverge.
- À l'écran : le verdict de la scène du leurre, recomposé en deux blocs. Tu crois : « je signe un simple message, sans payer de frais ». En vrai : « cette signature gratuite laisse le site prendre tes jetons ». Pastille Danger, bouton Annuler en premier, Continuer retardé.
- Notes : « Pas de score de risque. Une phrase de chaque côté. Annuler est toujours visible. Hold up ne dit jamais protégé ni vert : il avertit, ralentit, explique. Le verdict vient de règles écrites en code, pas d'un modèle. »

## Slide 4. Démo : le Hold up Lab (démo)
- Message : on ne demande pas au jury de nous croire, il construit l'attaque et voit ce qui se passe.
- À l'écran : schéma « une attaque entre, deux sorties côte à côte » : à gauche ce que Hold up dit, à droite ce qui se passe sur la chaîne si on signe (exécution puis retour en arrière). En dessous : deux portes, un moteur. Extension, avant signature, seule porte à voir les signatures hors chaîne (Permit). RPC de garde, après signature et avant diffusion, pour les envois tapés dans le wallet. Retraits de plateforme : coller et vérifier à la main.
- Notes : « Chaîne locale répliquant Avalanche : gratuite, rejouable. Plus de 30 scénarios prévus, la moitié honnêtes : à confirmer sur /api/scenarios avant de le dire. Fuji : pas déployé à l'heure où ce deck est écrit, on ne le montre pas. »

## Slide 5. Ce que nous mesurons, et ce que nous ne savons pas (détection et réponse)
- Message : des chiffres avec leur jeu, y compris les mauvais.
- À l'écran : tableau à 4 lignes.
  1. Jeu TEST, ouvert une fois avant les correctifs : rappel 94,5 % (104/110), dont 83,6 % en critique ; fausses alertes critiques 23,1 % (18/78). (RAJ B)
  2. Jeu DEV, règles réglées dessus : 252/252 et 0/90. C'est un test de non-régression, pas une mesure. (RAJ E, AM03 A1)
  3. Opérations honnêtes d'un juré interne : 22/123 en critique (17,9 %), 69 % reçoivent un écran d'alerte. (AM03 D1)
  4. Jeux aveugles, intégration au produit réel, Lab (30 scénarios ou plus) : à mesurer.
- Notes : « Notre taux de fausses alertes critiques est trop haut. On le dit. Le chiffre qui compte est celui du jeu aveugle, hash publié avant le test, résultat à mesurer. Latence du verdict : 30 à 50 ms en local sur 8 requêtes types, sans réseau. Temps de détection d'un incident : n'existe pas, le moteur juge une requête avant signature. »

## Slide 6. Une décision, une preuve, un rejeu (conformité)
- Message : un auditeur peut revérifier un verdict.
- À l'écran : le contenu de `livrables/SLIDE_CONFORMITE.md` s'il existe (le script de génération le lit), sinon un cadre marqué « EN ATTENTE : livrables/SLIDE_CONFORMITE.md ». Mapping affiché en bandeau : NIST CSF 2.0 Detect et Respond ; ATT&CK T1566 et T1657.
- Notes : « Si le modèle se trompe, qui est responsable ? Le verdict vient de règles versionnées, la personne décide, le journal garde la version des règles. L'ancrage sur Fuji n'est pas déployé : on ne l'affirme pas. »

## Slide 7. Gratuit pour les personnes, intégration payante (business model)
- Message : la personne n'a rien à payer, le wallet ou la plateforme paie pour l'intégrer.
- À l'écran : deux colonnes. Particuliers : extension gratuite. Wallets et plateformes : intégration payante (B2B2C). Sous les colonnes : « Prix non fixé. Aucun client, aucune étude de marché dans le dépôt. Qui paie côté particulier : question ouverte (D-005). »
- Notes : « Pas de taille de marché : aucune source dans le dépôt. Les fournisseurs de scanners existent (Blockaid dans Core, Pocket Universe, Rabby) : notre différence, c'est l'intention déclarée et le ralentissement, pas la réputation d'adresse. »

## Slide 8. Adem et Titouan (équipe, limites, suite)
- Message : deux ingénieurs, un outil, des limites écrites.
- À l'écran : deux noms, « Adem, responsable technique » et « Titouan, ingénieur ». À droite, « Ce que nous ne faisons pas encore » : extension jamais testée avec un vrai MetaMask à l'heure de ce deck (AM03 F3) ; modèle de langage non appelé dans la version actuelle (AM03 F1) ; ancrage Fuji non déployé ; pas de mesure sur de vrais utilisateurs.
- Notes : « Pas de biographie : on est deux ingénieurs, le code est dans le dépôt. Ce qu'on demande : un test avec un vrai wallet et un jeu d'attaques écrit par quelqu'un d'autre. »

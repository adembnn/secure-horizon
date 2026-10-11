# X. Scénarios jouables : ce que Hold up voit et que MetaMask n'a aucune raison de signaler (Claude-Titouan, 11/10/2026)

Base : la carte de couverture d'Adem (`research/demo_reelle/RECHERCHE_metamask_couverture.md`, [V] = lu à l'URL, [V-code] = lu dans le code de MetaMask, [NV] = non vérifié) et nos familles de cas (`T_banc_e2e/attacks_decalage/`).

## Règle de jeu honnête (à lire avant tout)
1. **On ne prouve jamais « MetaMask ne voit rien » par le silence de MetaMask sur Fuji ou une chaîne locale.** Ces chaînes ne sont pas servies par son API d'alertes (43113, 31337, 1337 absents [V]). Son silence là ne prouve rien.
2. **Ce qu'on peut défendre :** pour chaque scénario, la demande est « bénigne » pour tout détecteur de menaces (jeton légitime, protocole légitime, domaine non listé, aucun drainer connu). MetaMask a donc, par construction, **aucun déclencheur** : le questionnaire « Security check » ne s'ouvre que si Blockaid dit Malicious ou si le site est sur sa liste [V-code]. L'aperçu et « Added Protection » garantissent que l'effet est celui de l'aperçu, pas que c'est ce que tu voulais [V].
3. **Ce que Hold up ajoute :** il compare ce que tu as écrit à ce que la demande fait. Cela suppose une intention écrite. Sans intention, il retombe sur ses planchers.
4. **Preuve réelle optionnelle :** Sepolia est dans la liste des chaînes servies [V]. Jouer les scénarios avec un vrai MetaMask sur Sepolia (jetons de test) montre ce que MetaMask affiche vraiment. Demande un peu d'ETH de test. À faire seulement si on a le temps, sinon on cite les sources.

## Les 8 scénarios
Chaque carte : ce que tu écris / ce que le site demande / l'effet réel / pourquoi MetaMask n'a pas de motif / ce que dit Hold up / comment le jouer / état.

### S1. « Échanger 50 USDC » demande un droit sur tout le solde
- Intention écrite : « Échanger 50 USDC contre de l'AVAX. »
- Le site demande : `approve(routeur, illimité)`, présenté comme étape normale de l'échange.
- Effet réel : le routeur peut dépenser tout l'USDC, pour toujours.
- MetaMask : écran « spending cap » avec le montant modifiable ; l'avertissement « illimité » spécifique est [NV]. Alerte seulement si Blockaid classe la demande. Un routeur connu n'est pas classé malveillant.
- Hold up : « Ça ne correspond pas. Tu voulais 50, la demande donne tout. » (famille `swap_droit_illimite`, règle F31).
- Jouer : scène « Échanger 50 USDC » de la démo web (déjà prête), puis la même sur la chaîne locale avec l'extension.
- État : mesuré sur nos cas (jeu à nous, pas indépendant). Jeu aveugle prêt, pas encore passé.

### S2. Mauvais jeton
- Intention : « Envoyer 100 USDC à Paul. »
- Le site demande : `transfer` de 100 **USDT** (jeton réel, autre contrat). Un jeton imitation serait signalé par MetaMask (« Impersonator » [V-code]), donc on utilise deux jetons légitimes.
- MetaMask : l'aperçu affiche « −100 USDT », exact. Aucune divergence aperçu/effet.
- Hold up : « Ce n'est pas le jeton que tu as dit. » (famille `swap_jeton_different`, règle F32).
- Jouer : page de paiement fictive qui remplit le mauvais jeton dans le formulaire ; contrats de test sur la chaîne locale.
- État : mesuré sur nos cas. Les corrections d'extraction de jeton se généralisent (intention_texte).

### S3. Montant dix fois trop grand
- Intention : « Payer 0,5 AVAX. »
- Le site demande : un envoi de 5 AVAX (champ pré-rempli par la page).
- MetaMask : affiche 5 AVAX, c'est exact. Rien d'anormal pour lui.
- Hold up : « Montant supérieur à ce que tu as dit. » (famille `montant_plus_grand`, F33).
- Jouer : page « checkout » fictive qui pré-remplit un montant plus grand. L'intention écrite doit contenir le montant, sinon il n'y a rien à comparer.
- État : mesuré sur nos cas.

### S4. Échange dont la sortie va à un tiers
- Intention : « Échanger 100 USDC contre de l'AVAX. »
- Le site demande : un échange par un routeur légitime, avec un destinataire différent de toi.
- MetaMask : l'aperçu montre ce qui sort de ton compte ; ce qui arrive chez un tiers n'apparaît pas comme alerte [NV : à vérifier sur Sepolia].
- Hold up : « La sortie de l'échange ne va pas chez toi. » (famille `swap_destinataire_tiers`).
- Jouer : même page d'échange, un champ « destinataire » caché.
- État : mesuré sur nos cas.

### S5. « Réclamer ma récompense » qui fait sortir des fonds ou donne un droit
- Intention : « Réclamer une récompense. »
- Le site demande : un appel `claim()` payable, ou un `approve`, sur un contrat sans historique.
- MetaMask : au mieux « Limited address signals » (signal faible) [V]. Si le contrat est inconnu de Blockaid, pas de verdict Malicious. Réserve : un drainer connu serait signalé, donc la démo doit utiliser un contrat neuf.
- Hold up : « Réclamer ne devrait rien dépenser. Cette demande sort des fonds / donne un droit. » (famille `recevoir_sortie`).
- Jouer : site Glacier Rewards d'Adem (`research/demo_reelle/site/`), en local.
- État : mesuré sur nos cas ; le site existe déjà.

### S6. « Me connecter » qui signe un droit
- Intention : « Me connecter à ce site. »
- Le site demande : une signature typée (Permit EIP-2612 ou Permit2) présentée comme « Login », ou un `personal_sign` qui encode un appel.
- MetaMask : il décode un Permit en « Spending cap request » [V-code], donc il informe. Les messages SIWE valides sont exclus de l'analyse Blockaid [V-code] ; une signature « Login » qui n'est pas un SIWE passe par l'analyse mais n'est signalée que si elle est classée. Le trou prouvé concerne les réseaux hors liste (bug 2025) [V].
- Hold up : « Une connexion ne devrait pas donner un droit de dépense. » (famille `connexion_droit_signe`).
- Jouer : `index.html` du site Glacier Rewards (demande `eth_signTypedData_v4`).
- État : mesuré sur nos cas.

### S7. Droit disproportionné dans la durée ou l'étendue
- Intention : « M'abonner un mois pour 10 USDC. »
- Le site demande : un droit sans date de fin, ou à 30 ans, pour un montant très supérieur.
- MetaMask : affiche la valeur et l'échéance éventuelle ; pas de comparaison à ce que tu voulais.
- Hold up : règles `far_expiry`, `no_expiry`, `unlimited_allowance`, plus F31 si montant précis.
- Jouer : variante de S1 avec un Permit2 d'expiration lointaine.
- État : règles présentes ; pas de famille de cas dédiée dans le jeu de décalage (à ajouter).

### S8. Un lot « payer » avec un droit glissé dedans
- Intention : « Payer 20 USDC à ce commerçant. »
- Le site demande : un lot (`wallet_sendCalls` ou multicall) avec le paiement, plus un `approve` vers un tiers.
- MetaMask : une alerte « Unnecessary permission » existe pour les approbations multiples ; ses conditions sont [NV]. Les lots sont mal lus par beaucoup d'outils.
- Hold up : décode récursivement le lot (règles `batch_foreign_unlimited_approval`, `nested_approval`).
- Jouer : page de commerçant fictive avec un lot.
- État : décodage testé (moteur) ; pas de famille de cas dédiée dans le jeu de décalage.

## Ce qu'on ne doit pas promettre
- **N1. Fraude conforme :** l'utilisateur veut vraiment faire ce paiement (arnaque romantique, faux investissement). L'intention écrite correspond à l'effet. Hold up ne peut pas la voir par comparaison. Seuls le questionnaire d'Hold up (« qui t'a demandé ça ? ») et le délai aident. MetaMask a un questionnaire proche, déclenché seulement si Blockaid dit Malicious.
- **N2. Intention vague :** « payer » sans montant ni destinataire. Hold up pose 2 à 4 questions, mais ne peut pas comparer ce qui n'est pas dit.
- **N3. Contrat qui se comporte autrement à l'exécution** (« red pill ») : « Added Protection » de MetaMask le traite mieux que nous [V]. Ne pas revendiquer.
- **N4. Type d'intention mal compris par le repli mots-clés :** 72,8 % de type juste sur DEV, 38,0 % sur TEST (`intention_texte/RAPPORT.md`). Sans Clef/Jev mesurés, on ne dit pas que l'IA comprend l'intention.

## Ordre de jeu conseillé (2 minutes par scène, avec contrefactuel)
1. S1 (la scène héros). Deux fois : sans Hold up (juste MetaMask), puis avec.
2. S6 (le site Glacier Rewards, « me connecter »).
3. S2 ou S3 (erreur subtile d'un champ), pour montrer la précision.
4. Un exemple de N1, **pour dire honnêtement ce qu'on ne couvre pas**.

## Ce qui reste à construire
- Les scènes S2, S3, S4, S7, S8 n'existent pas encore sous forme de page jouable (seuls S1 et S5/S6 ont un support). Les cas du moteur existent pour S1 à S6.
- Un jeu aveugle (`blind_decalage/`, 250 cas, scellé) couvre 8 familles dont S1 à S6 ; il n'a pas encore été passé dans le moteur, en attente de ton feu vert.
- Vérifier sur Sepolia (vrai MetaMask) ce qu'il affiche pour S1, S2, S4 et S6, pour remplacer les [NV] ci-dessus par des constats.

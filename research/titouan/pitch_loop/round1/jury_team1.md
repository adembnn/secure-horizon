# Jury Team1 Avalanche, round 1, PITCH V3

## 1. Note
- Détection : 15/30
- Réponse : 13/20
- Faisabilité et intégration : 10/20
- Conformité et explicabilité : 8/15
- Pitch et démo : 11/15
- TOTAL : 57/100

## 2. Ce qui me convainc
1. La clarté du concept : comparer l'intention écrite à ce que la signature fait vraiment. Le cas "50 USDC contre approbation illimitée" se comprend en dix secondes.
2. L'honnêteté sur les chiffres. Le statut de chaque mesure est dit, le point faible est nommé, un jeu aveugle avec hash est annoncé.
3. Montants et adresses lus par du code, journal chaîné par hachage. C'est défendable.

## 3. Ce qui m'a fait douter
- « Jamais essayé avec un vrai MetaMask, rien sur Fuji. » Je suis Team1. Le guide propose Fuji. Vous n'avez rien sur Avalanche, sauf une statistique. Faisabilité faible.
- « rappel rouge 71,3 %, fausses alertes rouges 13,9 %, et 54,2 % des opérations honnêtes reçoivent un avertissement. » Un utilisateur qui voit un avertissement une fois sur deux l'ignore. Le produit s'annule lui-même.
- « 228 sur 228, zéro fausse alerte rouge » : vous l'avez dit vous-mêmes, cas écrits par vous. Pour moi, ce chiffre ne vaut rien.
- « Verdict local en 18 millisecondes. La phrase, elle, est lue par un modèle hébergé. » Votre intention part chez un tiers. Et 18 ms n'inclut pas l'appel au modèle. Latence réelle ?
- « Sur Ethereum, dans nos mesures, 48 % des droits de dépense sont illimités. » Les approbations illimitées sont un choix d'UX des DEX, pas une preuve de danger. Le chiffre gonfle le problème.
- « Dans les plus gros cas, les signatures de droits de dépense pèsent 38 % des pertes. » Flou : quels cas, quelle source ?
- Track 1 attend banque, fintech ou protocole, DORA, AML. Vous visez un particulier. Aucun mot sur DORA, MiCA, AML. La conformité est réduite à un journal et au NIST.
- « C'est tout le reste. » Phrase creuse au moment où vous décrivez le plancher.

## 4. Questions pièges
1. Sur Avalanche C-Chain, vos 0,30 % d'alertes rouges sur 6 325 transactions : combien de vraies attaques dedans, quel rappel ? Sans étiquettes, ce chiffre ne dit rien.
2. Comment interceptez-vous une signature sur Core ou Rabby sans extension qui injecte la page ? Et un dApp qui contourne l'extension (Ledger, WalletConnect) ?
3. Si le modèle hébergé se trompe ou est injecté par la page (prompt injection dans le site), qui est responsable ? Votre phrase d'intention est-elle une surface d'attaque ?

## 5. Cinq changements
1. Remplacer « Jamais essayé avec un vrai MetaMask, rien sur Fuji. » par « Démo sur Fuji : contrat ERC-20 déployé, approbation illimitée interceptée, transaction de révocation prête à signer. » Gain +5 (faisabilité). À faire réellement avant dimanche.
2. Remplacer « 54,2 % des opérations honnêtes reçoivent un avertissement. C'est notre point faible. » par « Nous avons réglé le seuil : X % d'avertissements sur opérations honnêtes, rappel rouge Y %. » Un seul point de fonctionnement, chiffre chiffré. Gain +4 (détection).
3. Remplacer « 228 sur 228, zéro fausse alerte rouge sur les 166 jumeaux honnêtes. C'est un test de couverture, pas un test indépendant. » par « Sur le jeu aveugle de 250 cas : rappel X %, fausses alertes Y %. » Si le jeu aveugle est ouvert avant la salle. Gain +4 (détection).
4. Remplacer « Nous couvrons les fonctions Detect et Respond du NIST CSF 2.0. » par une phrase DORA/MiCA : « Pour un prestataire crypto agréé, chaque alerte rouge produit une ligne de journal exploitable pour la déclaration DORA ; l'auditeur rejoue la décision. » Gain +3 (conformité).
5. Remplacer « La phrase, elle, est lue par un modèle hébergé. » par « La phrase est traitée par un modèle, sans adresse ni montant ; en cas d'échec, le plancher de règles décide seul, en moins de 50 ms. » Montre le mode dégradé et la vie privée. Gain +2 (faisabilité, conformité).

## 6. Verdict
Idée nette et chiffres honnêtes, mais détection non prouvée, rien sur Avalanche, et un taux d'avertissement qui tue le produit : 57/100, pas finaliste en l'état.

# Jury Team1 Avalanche, round 2, PITCH V4

## 1. Note
- Détection : 19/30
- Réponse : 14/20
- Faisabilité et intégration : 11/20
- Conformité et explicabilité : 10/15
- Pitch et démo : 12/15
- TOTAL : 66/100, soit +9 par rapport au round 1 (57).

## 2. Défauts du round 1
- Rien sur Fuji, jamais MetaMask : non. V4 : « Scène un, en direct, sur une chaîne locale » et « Essai réel avec MetaMask : à faire ». Toujours pas de Fuji.
- Avertissements sur 54 % des honnêtes : partiellement. « Avec une liste de protocoles connus, le meilleur cas mesuré tombe à 17 %. » Mieux nommé, pas réglé.
- 228 sur 228 sans valeur : résolu. « Nos 410 cas de réglage sont à 100 % : un test de couverture, pas un test indépendant. » Et 86,6 % sur contrôle scellé.
- 18 ms et modèle hébergé : résolu. « Verdict local en moins de 50 millisecondes. » Le modèle n'est plus dans le chemin.
- 48 % illimités gonflé : partiellement. « 34 % sur Avalanche. Échantillons non représentatifs. » Honnête, mais reste un choix d'UX des DEX.
- 38 % flou : résolu. « Trois des onze vols de plus d'un million. »
- DORA, MiCA, AML absents : partiellement. « Nous ne revendiquons ni DORA ni MiCA. » Clair, mais aucun apport pour un déclarant.
- « C'est tout le reste » : résolu, supprimé.
- Vie privée, panne, injection : résolu. « La phrase est une donnée, jamais une instruction. » « Jamais de vert. »
- Rouges Avalanche sans étiquettes : non. 0,30 % cité avec 77 % d'avertissements, toujours sans vraie attaque dedans.

## 3. Nouveaux défauts
- 77 % d'avertissements sur Avalanche est pire que 54 %. Vous l'annoncez vous-mêmes.
- « Presque tous des appels illisibles » : un décodeur ABI incomplet sur C-Chain.
- Interception sur Core, Rabby, WalletConnect : toujours sans réponse.
- Le modèle ne protège plus de rien si la phrase est exacte. La valeur dépend du plancher.
- Scène deux synthétique : aucune preuve de réponse (pause, révocation).
- Fin abrupte, 15 secondes pour les limites et la conclusion.

## 4. Temps de parole
Environ 640 mots dits, soit 4 min 55 s à 130 mots par minute. Dans la cible, mais sans marge. La section 4:00 à 4:45 est dense. Une pause de démo la fait déborder.

## 5. Cinq derniers changements
1. Remplacer « sur une chaîne locale » par « sur Fuji : contrat déployé, approbation illimitée interceptée, révocation prête à signer ». Gain +4 (faisabilité, démo).
2. Remplacer « 0,30 % d'alertes rouges, 77 % d'avertissements, presque tous des appels illisibles » par « sur 6 325 transactions, N rouges revues à la main, M vraies menaces ; avertissements ramenés à X % par la liste de protocoles ». Gain +4 (détection).
3. Remplacer « Nous ne revendiquons ni DORA ni MiCA » par « Chaque rouge produit une ligne rejouable par l'auditeur, utilisable pour une déclaration DORA du déployeur ». Gain +2 (conformité).
4. Remplacer « Essai réel avec MetaMask : à faire » par « Testé sur MetaMask et Core, extension injectée ; Ledger direct non couvert ». Gain +2 (faisabilité).
5. Ajouter après la scène un : « Sur rouge, la révocation de l'approbation est proposée en un clic. » Gain +2 (réponse).

## 6. Verdict
Honnête et mieux calibré, mais rien sur Fuji, 77 % d'avertissements et pas d'essai réel : 66/100, finaliste possible seulement avec une démo Avalanche.

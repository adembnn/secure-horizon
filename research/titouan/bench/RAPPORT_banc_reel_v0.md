# Banc réel v0 : premiers chiffres (Claude-Titouan, 11/10/2026, ~01h)

Ce sont des MESURES exécutées par les scripts de ce dossier, sur des données publiques réelles, en lecture seule, sans clé ni secret, sans adresse ni hash en dur dans les règles. Reproductible : `node sample_cchain.mjs 1500 && node decode_rules.mjs` etc. (graine 20261011, blocs épinglés dans data/*.meta.json).

## Ce qui est testé (et ce qui ne l'est PAS)
Le FILET indépendant de l'intention v0 : cinq règles qui ne lisent que l'effet décodé d'une transaction de premier niveau (approve, increaseAllowance, setApprovalForAll, permit, Permit2.approve, type 0x4/EIP-7702). Ce n'est PAS l'outil : pas d'intention, pas de simulation, pas de comparateur, pas de multicall décodé. C'est la ligne de base la plus pauvre, utile pour savoir ce que l'intention doit apporter.

| Règle | Signale |
|---|---|
| R1 | droit illimité (approve, permit) |
| R2 | setApprovalForAll(true) |
| R3 | droit accordé à un compte externe (pas un contrat) |
| R4 | permit hors chaîne ou Permit2 |
| R5 | transaction de type 0x4 (délégation EIP-7702) |

## Jeux de données
- Légitime présumé, C-Chain : 1 500 blocs tirés au hasard, 6 325 tx (ancrage bloc 97 234 673).
- Légitime présumé, Ethereum : 200 blocs tirés au hasard entre le bloc 20 000 000 et l'ancrage, 43 075 tx. 0 tx touche une adresse de la liste ScamSniffer.
- Attaques réelles : 1 354 transactions Ethereum qui ont émis un Approval vers l'une des 2 530 adresses de la liste publique ScamSniffer scam-database (GPL-3.0, étiquetage par un tiers), depuis le bloc 20 000 000. 170 spenders distincts.

## Résultats
Faux positifs du filet sur trafic présumé légitime :
| | C-Chain (n=6 325) | Ethereum (n=43 075) |
|---|---|---|
| au moins une règle | 0,28 % (IC95 0,18-0,45) | 3,15 % (IC95 2,99-3,32) |
| R1 droit illimité | 0,24 % | 2,27 % |
| R2 setApprovalForAll | 0 | 0,22 % |
| R3 spender compte externe | 0,08 % | 0,23 % |
| R4 permit/Permit2 | 0,05 % | 0,05 % |
| R5 type 0x4 | 0 | 0,56 % |
Sur Ethereum, parmi les seules transactions qui donnent un droit (2 278), 48,9 % sont signalées.

Rappel du filet sur les approbations d'attaque réelles (Ethereum) :
- Au moins une règle : 81,9 % des 1 354 transactions (IC95 79,8-83,9). Sur les 1 219 approbations directes : 89,3 %.
- Par règle : R3 (spender compte externe) 80,4 % ; R5 1,6 % ; R1 (illimité) 1,0 % ; R2 et R4 0 %.
- Au niveau des spenders (non des transactions) : 130 comptes externes sur 170, soit 76 %. Les 5 premiers spenders concentrent 33 % des transactions.

## Ce que ça dit (lecture honnête)
1. L'objectif « FP critical ≤ 1/1000 » n'est PAS atteint par un filet naïf : 31/1000 sur Ethereum, 2,8/1000 sur la C-Chain. Le taux dépend fortement de la chaîne (11 fois plus sur Ethereum).
2. Le « droit illimité » (R1) est inutile comme alerte critique : normal sur Ethereum (2,3 % du trafic), il ne ressort que dans 1 % des attaques. C'est exactement où l'intention doit aider (un swap légitime donne un droit illimité normal).
3. Un seul signal discrimine à ce stade : « le droit est donné à un compte externe ». Il retrouve 80 % des approbations d'attaque (76 % des spenders) pour 0,23 % du trafic légitime. Mais c'est un faux espoir si on ne regarde pas les limites ci-dessous.
4. La délégation EIP-7702 est trop fréquente en légitime (0,56 % en Ethereum) pour être critique seule.
5. Une expérience dev/test sur le nonce du spender (seuil choisi sur la moitié DEV des spenders, évalué sur l'autre) : rappel 87 % mais 44 % de faux positifs chez les spenders légitimes externes. Le nonce ne tient pas ; résultat négatif publié.

## Limites (à ne pas cacher)
- Étiquettes : la liste ScamSniffer est un tiers, mais on ne sait pas comment elle est construite ; si elle favorise les comptes externes receveurs d'approbations, R3 est partiellement circulaire.
- Le « légitime » est présumé : il contient forcément des arnaques non listées (par exemple des spenders externes tout neufs).
- Les attaques mesurées sont des approbations directes émises par la victime. Les permit hors chaîne soumis par l'attaquant et les signatures Permit2 sont quasi absents de ce jeu (R4 : 0 %) : le point de 38 % des gros cas 2025 n'est pas mesuré ici.
- Aucune des attaques n'est dans un multicall ou via un routeur ; une part des légitimes (« other », 34 % en Ethereum) est invisible au décodeur de premier niveau.
- Les spenders sont qualifiés (contrat ou compte externe) à l'état actuel, pas à la date de l'attaque.
- Comparaison entre chaînes : les attaques sont sur Ethereum, la C-Chain n'a pas de jeu d'attaques ici.
- n d'attaques 1 354 mais indépendance faible (170 spenders, concentration 33 % sur 5).

## Suite directe (pas encore fait)
1. Ajouter l'intention : montrer le gain sur les faux positifs en recalculant le taux avec « intention honnête = swap/connexion » lue sur des étiquettes humaines.
2. Décoder les multicall et les appels via routeur pour réduire l'angle mort.
3. Jeu d'attaques par permit et Permit2 (rejeu signé) : à fabriquer, aucune source ouverte.
4. Latence et coût du pipeline complet une fois le comparateur disponible.

## Addendum 1 (01h20) : réponses aux trois demandes d'Adem (MSG-030)
### (1) Âge du contrat spender à la date de l'approbation (seuil fixé a priori : 7 jours)
RÉSULTAT NÉGATIF. Sur les 162 approbations d'attaque vers un contrat (40 spenders contrats), seules 2 (1,2 %, IC95 0,3-4,4) visent un contrat de moins de 7 jours. Âge médian de ces contrats d'attaque : environ 6,7 millions de blocs (environ 2,5 ans). Sur le légitime : 0,12 % du trafic total (IC95 0,09-0,15). Le signal « contrat jeune » ne sépare PAS sur ce jeu. Combiné avec R3 (compte externe OU contrat jeune) : rappel 88,2 % des tx d'attaque, 0,39 % de FP sur le trafic (le gain vient entièrement de R3). 18 dates de création non résolues.
Pourquoi (hypothèses à vérifier) : (a) un jeu étiqueté par liste ne contient, par construction, que des drainers déjà repérés et donc plus vieux : le biais d'étiquetage joue CONTRE un drainer neuf ; ce jeu ne peut pas valider « le filet anti-drainer neuf » ; (b) les contrats listés sont souvent des contrats de kit réutilisés.
### (2) Jeu permit réel
Non obtenu par cette voie. Les approbations d'attaque récoltées sont des approve directs (1 219). Dans une fenêtre de 1 million de blocs (24M-25M), 232 tx transfèrent des tokens vers les adresses listées ; 148 sont des déploiements de contrat, 35 un sélecteur de kit inconnu, 7 des transfer directs. J'ai tracé (debug_traceTransaction, drpc) les 82 non-déploiements : 0 appel permit ou Permit2 interne, 1 121 transferFrom et 10 963 transfer (volume de type distribution/poisoning). Seuls 4 événements Permit2 Approval vers des spenders listés depuis le bloc 20M. Conclusion : la liste ScamSniffer mélange drainers et adresses d'empoisonnement ; le jeu permit doit venir d'incidents nommés (K5 : hashs de signature de permit publiés, n très petit) ou d'un jeu fabriqué et signé en local.
### (3) Gain de l'intention
Pas encore fait : demande 2 lecteurs humains pour 200 tx (étiquettes indépendantes). À planifier avec Titouan/Adem.
### Question « origine identifiable » 
Non : les logs et transactions n'ont pas d'origine web. Le terme « affiché » ne se mesure donc pas sur l'historique ; il ne se mesure que sur une démo contrôlée (site de démo + Snap qui lit l'origine).

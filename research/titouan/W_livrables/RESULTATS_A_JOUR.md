# Résultats à jour : tous les chiffres, leur source, leur statut

Date : 11 oct. 2026, rédigé à partir des fichiers du repo. Intervalles : Wilson 95 %, sauf mention. Chemins relatifs à `research/titouan/`. `T` = `T_banc_e2e/`.

Statuts :
- **RÉEL** : mesuré sur du trafic ou des sites réels.
- **SYNTH** : mesuré sur des cas synthétiques (écrits par nous ou par des agents). Mesure la couverture et la non-régression, pas la robustesse face à un attaquant réel.
- **HYPO** : cible, estimation ou ordre de grandeur sans mesure.
- **LIT** : chiffre d'une source externe, non revérifié ici, pas une mesure de Hold up.
- **RETIRÉ** : à ne plus citer.

Règle de lecture : "rappel" = malveillant en warn ou critical. "Fausse alerte critical" = cas bénin classé critical. Les deux colonnes RÉEL et SYNTH ne se mélangent pas.

## A. Taux mesurés sur données réelles

| Chiffre | Valeur | n | Source | Statut | Réserves |
|---|---|---|---|---|---|
| Filet v0 (5 règles, sans intention), alertes sur trafic C-Chain présumé légitime | 0,28 % [0,18 ; 0,45] | 6 325 tx, 1 500 blocs | `bench/RAPPORT_banc_reel_v0.md` | RÉEL | "Légitime" présumé. Ce n'est pas l'outil complet : ni intention, ni simulation, ni comparateur. |
| Même filet sur Ethereum, alertes sur trafic présumé légitime, après correction | 2,98 % (avant correction 3,15 %) ; règle R3 0,27 % | 43 075 tx, 200 blocs | `bench/RAPPORT_banc_reel_v0.md`, section CORRECTION MAJEURE | RÉEL | Taux 11 fois plus haut qu'en C-Chain : dépend fortement de la chaîne. |
| Rappel du filet v0 sur droits de dépense directs réels signés par la victime (Ethereum) | 24/33 = 72,7 % [55,8 ; 84,9] | 33 | `bench/RAPPORT_banc_reel_v0.md`, section CORRECTION MAJEURE | RÉEL | Petit n. Étiquettes ScamSniffer (tiers, construction inconnue), règle R3 possiblement circulaire. 170 spenders, concentration forte. Jeu surtout composé de drainers déjà listés, donc ne valide pas un drainer neuf. |
| Compatibilité de la couche d'interposition, 96 sites réels | PASS 81, DIFFÉRENCE 8, CASSE 0, inaccessibles 7 ; casse 0/89 [0,0 ; 4,1 %] ; 0/65 [0,0 ; 5,6 %] parmi les sites qui détectent un portefeuille | 89 accessibles | `T/compat/COMPAT_REEL.md` | RÉEL | Le bras test est un Proxy du banc, PAS l'extension Hold up. Fournisseur simulé, aucune connexion ni signature réelle. Échantillon de commodité. Un site peut être PASS parce que le bouton de connexion n'a pas été trouvé. |
| Casse ou différence | 8/89 = 9,0 % [4,6 ; 16,7] | 89 | `T/compat/COMPAT_REEL.md` | RÉEL | idem |
| Bruit A/A (erreur console nouvelle sans aucune différence d'injection) | 9/86 = 10,5 % [5,6 ; 18,7] ; bras test 6/89 = 6,7 % | 86 et 89 | `T/compat/COMPAT_REEL.md` | RÉEL | idem |
| Empoisonnement d'adresse sur la C-Chain (campagne août à déc. 2025) | 36 744 adresses visées, 248 053 envois de poussière, 51 625,61 USDC volés | n/a | `U_segment/U4_menaces_avalanche.md` | RÉEL (source unique) | Rapport d'un analyste indépendant, non audité. Les 3 adresses ne sont ni dans la liste ScamSniffer ni signalées par GoPlus. |
| Scan réel du poisoning C-Chain avec la règle prefixe/suffixe | non mesuré | n/a | dossier `T/realscan/out` vide à la rédaction | en cours | À ajouter quand livré. |

## B. Couverture sur cas synthétiques

| Chiffre | Valeur | n | Source | Statut | Réserves |
|---|---|---|---|---|---|
| TEST ouvert une fois (R003), bras intention soufflée : rappel | 94,5 % [88,6 ; 97,5] (104/110) ; critical seul 83,6 % [75,6 ; 89,4] | 110 malveillants | `T/COUVERTURE.md` | SYNTH | Mesuré avant les correctifs F1 à F10. Ne décrit pas les règles actuelles. Non rouvert. |
| TEST, fausses alertes critical | 23,1 % [15,1 ; 33,6] (18/78) ; warn ou critical brut 51,3 % [40,4 ; 62,1] ; au-delà du toléré 28,2 % | 78 bénins | `T/COUVERTURE.md` | SYNTH | Bénins difficiles. Un listing Seaport honnête et un mint NFT sortaient critical. Très au-dessus de la cible. |
| TEST, plancher sans intention | rappel 91,8 % [85,2 ; 95,6] (101/110) ; fausses alertes critical 5,1 % [2,0 ; 12,5] (4/78) | 110 et 78 | `T/COUVERTURE.md` | SYNTH | Le plancher a moins de fausses alertes critical que le bras avec intention soufflée. |
| TEST, simulation seule (référence) | rappel 25,4 % [18,2 ; 34,3] (28/110) | 110 | `T/COUVERTURE.md` | SYNTH | Montre ce que décoder les effets apporte face à une simulation de solde. |
| TEST hors EIP-7702 | rappel 93,4 % [86,4 ; 96,9] (85/91) ; fausses alertes critical 19,4 % (14/72) | 91 et 72 | `T/COUVERTURE.md` | SYNTH | EIP-7702 est absent de la C-Chain. |
| TEST famille EIP-7702 | rappel 19/19 [83,2 ; 100] ; fausses alertes critical 4/6 | 19 et 6 | `T/COUVERTURE.md` | SYNTH | Hors DEV. Non pertinent pour la C-Chain. |
| TEST, fraude conforme alertée | 4/4 [51,0 ; 100] | 4 | `T/COUVERTURE.md` | SYNTH | n trop petit pour conclure. |
| DEV avant boucle, bras intention soufflée | rappel 89,3 % [84,9 ; 92,5] (225/252) ; fausses alertes critical 21,1 % [14,0 ; 30,6] (19/90) ; warn ou critical sur bénins 26,7 % (24/90) | 252 et 90 | `T/COUVERTURE.md` | SYNTH | Jeu sur lequel on règle. |
| DEV avant boucle, plancher | rappel 85,3 % [80,4 ; 89,2] (215/252) ; fausses alertes critical 5,6 % (5/90) | idem | `T/COUVERTURE.md` | SYNTH | idem |
| DEV, fraude conforme alertée (bras honnête) | 87,5 % [69,0 ; 95,7] (21/24) ; 3 passent sans alerte | 24 | `T/COUVERTURE.md` | SYNTH | Rappel élevé surtout par signaux de destinataire et d'ampleur. Ne dit rien sur un vrai conseiller. |
| Fixtures publiques, bras honnête : rappel | 95,4 % [87,3 ; 98,4] (62/65) ; critical seul 66,1 % [54,0 ; 76,5] | 65 malveillants | `T/attacks_public/out/MESURE_001.md` | SYNTH | Fixtures écrites par nous d'après des motifs publics. 4 inconnus (méthode `wallet_requestExecutionPermissions` non gérée). 10 cas non exécutables. |
| Fixtures publiques, fausses alertes | critical 3,0 % [0,8 ; 10,3] (2/67) ; au-delà du toléré 13,4 % [7,2 ; 23,6] (9/67) ; warn ou critical 35,8 % (24/67) | 67 | `T/attacks_public/out/MESURE_001.md` | SYNTH | Bras "catalogue" : critical 7,5 % (5/67). |
| Fixtures publiques, applicable C-Chain (hors Ethereum seul) | rappel honnête 94,6 % [85,4 ; 98,2] (53/56) | 56 | `T/attacks_public/out/MESURE_001.md` | SYNTH | |
| Jeu aveugle V1 (150 cas) | non mesuré | 150 | `coord/INBOX.md` MSG-048, MSG-050 | à passer une fois | |
| Jeu aveugle V2 d'Adem, TEST gelé | non mesuré | 2 498 (TEST) sur 8 425 | `coord/INBOX.md` MSG-052 ; `T/blind_adem/v2/BRIEF.md` | à ouvrir une fois | Réserves d'Adem : adresses et ABI de mémoire, proportions irréalistes, messages écrits par IA. Test de réalisme sur fork et pondération par poids réels des familles demandés, non faits. |
| Comparateur d'Adem seul contre avec plancher objectif | 21/30 contre 29/30 | 30 | `coord/INBOX.md` POINT-20MIN 02h23 | SYNTH, petit n | Annoncé dans INBOX, non rejoué ici. |
| Moteur d'effets, tests unitaires | 447/447 passent | 447 | `T/engine/test/` | SYNTH (tests) | Rejoués pour ce livrable le 11 oct. Les tests valident le code, pas la détection. |
| Extension, batterie de tests (Chrome 154 et Edge 155) | 64 PASS, 0 FAIL, 2 LIMITE sur chaque | 66 | `T/extension/COMPAT.md` | SYNTH (portefeuille simulé) | Jamais testée avec un vrai portefeuille. Moteur de test jouet pour la plomberie. |
| Serveur local, tests | 33/33 | 33 | `T/server/test/results.json` | SYNTH | |

## C. Temps de détection et de réponse

| Chiffre | Valeur | n | Source | Statut | Réserves |
|---|---|---|---|---|---|
| Latence du verdict, serveur local | médiane 25,94 ms, p95 38,73 ms, max 106,36 ms | 400 | `T/server/test/results.json` | SYNTH (requêtes synthétiques) | Hors ligne, sans RPC, sans fork, sans modèle. Requête d'amorçage 121,3 ms. Ne mesure ni le navigateur ni l'utilisateur. |
| Délai d'API dépassé | "Non vérifié" après 3 s (3011 ms mesuré) | 1 | `T/extension/COMPAT.md` | SYNTH | |
| Retenue de 10 minutes | testée avec 2 s | 1 | `T/extension/COMPAT.md` | non mesuré | Le service worker MV3 peut s'arrêter avant. |
| Temps de décision de l'utilisateur | journalisé, aucune valeur | 0 | `T/extension/COMPAT.md` | non mesuré | Aucun test avec des personnes. |
| Détection ou réponse sur Fuji | non mesuré | 0 | n/a | non mesuré | |

## D. Cibles et hypothèses (pas des mesures)

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Cible fausses alertes critical | 1/1000 avec borne | `O_barriere_intention.md` | HYPO, non sourcée, NON atteinte (TEST 23,1 %) |
| Cible rappel | 90 % sur familles connues, 70 % sur inédites | `O_barriere_intention.md` | HYPO |
| Cible de `docs/intent-barrier.md` | FN = 0 sur démo, FP critical sous 2 %, p95 sous 1,5 s | `docs/intent-barrier.md` | HYPO, FP critical sous 2 % non atteint sur TEST |
| 30 s (niveau Danger) et 10 min (manipulation) | durées de friction | `docs/design/REGLES_avertissements.md` | HYPO, aucune preuve publiée |
| Borne de confiance | 3 000 transactions légitimes sans alerte pour affirmer moins de 0,1 % | `O_barriere_intention.md` | calcul (règle de 3), pas un résultat |
| Effet d'un avertissement en simulation de portefeuille | annulation 1,3 % (témoin), 19,7 % (passif), 32,9 % (délai 5 s), 48,6 % (actif sur le spender) | `U_segment/U3_efficacite_interventions.md` | LIT (laboratoire, non revérifié ici) |
| Fraude avec geste d'annulation (banque simulée) | 22 % à 4 % | `U_segment/U3_efficacite_interventions.md` | LIT (OBIE 2021, laboratoire) |
| Outrepassement des avertissements navigateur | SSL 70,2 % Chrome contre 33,0 % Firefox | `docs/design/REGLES_avertissements.md` | LIT (Akhawe et Felt 2013) |
| Pertes ScamSniffer | 83,85 M$ en 2025 (106 k victimes) | `U_segment/U4_menaces_avalanche.md` | LIT |

## E. Chiffres RETIRÉS (ne plus jamais les citer)

| Chiffre | Pourquoi retiré | Source de la correction | Remplacé par |
|---|---|---|---|
| **80,4 % de rappel de la règle R3** (compte externe), avec 0,23 % de faux positifs | Le jeu "d'attaques" de 1 354 transactions contenait 1 186 `approve(..., 0)`, c'est-à-dire des révocations, comptées à tort comme des droits. | `bench/RAPPORT_banc_reel_v0.md`, CORRECTION MAJEURE | n = 33 droits directs réels ; rappel du filet 72,7 % [55,8 ; 84,9] ; R3 sur légitime 0,27 % |
| **81,9 %** de rappel du filet complet (1 354 transactions) | Même cause. | idem | 24/33 = 72,7 % |
| 89,3 % sur les "1 219 approbations directes" | Même jeu contaminé par les révocations. | idem | n = 33 |
| 88,2 % de rappel et 0,39 % de FP pour "compte externe OU contrat jeune" | Calculé sur le jeu contaminé. Le gain venait entièrement de R3. | `bench/RAPPORT_banc_reel_v0.md`, addendum 1 | à refaire sur les droits réels |
| Signal "contrat jeune" (1,2 % des attaques visent un contrat de moins de 7 jours) | Jeu contaminé en partie. Résultat de toute façon négatif. | idem | à refaire, ne pas citer |
| **Preuve sociale 99 %** (approbateurs antérieurs) | Le signal a été calculé sur le même jeu contaminé. Le rapport dit qu'il est "à REFAIRE sur les droits réels seulement et ne doit pas être cité". Le chiffre 99 % n'a pas été retrouvé dans les fichiers lus pour ce livrable. | `bench/RAPPORT_banc_reel_v0.md`, CORRECTION MAJEURE | rien |
| **Signal nonce du spender** (rappel 87 %, 44 % de faux positifs chez les spenders externes légitimes) | Même jeu contaminé. Le nonce ne tenait déjà pas : résultat négatif. | idem | rien |
| Ligne "R3 80 % rappel / 0,23 % FP (Ethereum)" de la matrice des familles | Reprise du chiffre faux. | `R_cas_complexes/SYNTHESE.md` (matrice, famille 1) | 72,7 % sur n = 33 |
| Part de pertes évitable "environ 1 % (0,2 à 5 %)" du périmètre global et "environ 38 % (13 à 72 %)" du périmètre natif portefeuille | Calculées avec les rappels 80 % et 82 %, maintenant retirés. | `U_segment/U3_efficacite_interventions.md`, constat 4 | à recalculer avec 72,7 % [55,8 ; 84,9] et n = 33 |
| DEV après les correctifs F1 à F10 : rappel 100,0 % (252/252) et fausses alertes critical 0/90 | Obtenus en réglant les règles sur ce même jeu. F10 a été motivé par les 6 cas qu'il rattrape. F4, F9 et F10 ne sont pas validées contre les fausses alertes (aucun bénin concerné dans DEV). Sur TEST, avant correctifs, les fausses alertes critical étaient de 23,1 %. | `T/COUVERTURE.md`, section boucle ; `T/run/out/JOURNAL.md` | TEST à rouvrir sur un jeu neuf, ou V2_TEST ouvert une fois |
| Taux de compréhension des écrans (tests v1 et v2) | Réponses de personas simulés (étudiante, trader, etc.), pas de personnes. Questions à choix qui guident la réponse. n faible. Aucun taux n'est présenté comme preuve. | `U_comprehension/` (réponses et `grade.mjs`) | test avec de vraies personnes, non fait |
| Objectifs "FP critical sous 1/1000" et "FN = 0" présentés comme acquis | Ce sont des cibles, non atteintes. | `O_barriere_intention.md`, `docs/intent-barrier.md` | voir section D |

Rappel de ce qui reste valable de l'ancien rapport : le droit illimité (R1) est inutile comme alerte critique seule (normal sur Ethereum, 2,27 % du trafic) ; la délégation EIP-7702 est trop fréquente en légitime (0,56 % sur Ethereum) pour être critique seule ; la liste ScamSniffer mélange drainers et adresses d'empoisonnement (`bench/RAPPORT_banc_reel_v0.md`).

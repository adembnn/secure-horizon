> **BROUILLON PÉRIMÉ (11 oct. 2026).** Écrit avant le produit figé. Version à jour : `livrables/` (fiche, playbook, slide, README racine) et `livrables/CHIFFRES.md` pour les chiffres. Ne pas citer ce fichier.

# Résultats à jour : tous les chiffres, leur source, leur statut

Mise à jour du 11 oct. 2026 (après la boucle V2, le trafic réel moteur actuel, le banc en conditions produit). Intervalles : Wilson 95 %, sauf mention. Chemins relatifs à `research/titouan/`. `T` = `T_banc_e2e/`. Le produit s'appelle Hold up. Les noms de fichiers du code gardent parfois l'ancien nom (`sentinelle_core.js`).

## Positionnement (décision D-009)

**MetaMask te prévient de ce qu'il reconnaît. Hold up vérifie ce que tu voulais faire.**

### Ce que MetaMask fait déjà

| Fait | Source |
|---|---|
| Alertes de sécurité sur transactions et demandes de signature (Blockaid et autres), niveaux Avertissement et Malveillant. Activées par défaut dans l'extension et sur mobile. Avalanche dans la liste des réseaux couverts. Avertissement sur une adresse récemment déployée | https://support.metamask.io/configure/wallet/security-alerts/ (page lue le 11 oct. 2026) |
| Alerte d'empoisonnement d'adresse (depuis le 17 juin 2026), avertissement sur un envoi vers une adresse jamais vue, Permit en clair (depuis la v12.2) | Constat d'Adem dans son MetaMask, `coord/INBOX.md` MSG-060 et MSG-061. **Absents de la page d'aide lue** : à vérifier dans les notes de version avant de les citer en public |

Fuji et les chaînes locales ne sont pas dans la liste des réseaux de la page (omis, pas déclarés exclus). Le silence de MetaMask sur notre démo ne prouve donc rien. On n'écrit jamais « MetaMask ne le voit pas » sans preuve.

### Ce que Hold up ajoute

1. La comparaison entre l'intention écrite et l'effet réel de la demande, avec une réponse « ça correspond » ou « ça ne correspond pas » et une ligne.
2. Un délai proportionné à l'écart.
3. Une preuve rejouable et ancrée (journal chaîné, version des règles, rejeu).

Les chiffres ci-dessous mesurent le moteur et ses règles. Aucun ne mesure la comparaison sur de l'intention en texte libre (voir « Ce qui n'est pas mesuré »).

---

Statuts :
- **RÉEL** : mesuré sur du trafic ou des sites réels.
- **SYNTH** : mesuré sur des cas synthétiques (écrits par nous ou par des agents). Mesure la couverture et la non-régression, pas la robustesse face à un attaquant réel.
- **RÉGLÉ** : le jeu a servi à régler les règles. Le chiffre est optimiste par construction.
- **HYPO** : cible, estimation ou ordre de grandeur sans mesure.
- **LIT** : chiffre d'une source externe, non revérifié ici, pas une mesure de Hold up.
- **RETIRÉ** : à ne plus citer.

Règle de lecture : "rappel" = malveillant en warn ou critical. "Fausse alerte critical" = cas bénin classé critical. Les deux colonnes ne se mélangent jamais.

Règle d'honnêteté : aucun chiffre de la colonne synthétique n'est un test indépendant. V2_DEV a servi à régler les règles. Le test indépendant est V2_TEST, ouvert une seule fois, à la fin. Il n'est pas encore ouvert.

---

# COLONNE SYNTHÉTIQUE (cas écrits par nous, jeux réglés)

## S1. V2_DEV, état final des règles : SYNTHÉTIQUE ET RÉGLÉ

Jeu : V2_DEV, 5 927 cas (2 930 malveillants, 1 976 bénins, 795 fraudes conformes, 226 ambigus). Source : `T/run/out/v2/MESURE_FINAL.md` (généré par `run/run_v2.mjs`), journal de la boucle dans `T/run/out/JOURNAL.md`, section "Boucle V2". Correctifs F1 à F19 et F21 à F30 gardés, F20 annulé. V2_TEST jamais lu (empreinte vérifiée seulement). Contexte complet du banc : voir S4 pour ce que le produit voit vraiment.

| Bras | Rappel (warn ou critical) | Rappel critical | Fausses alertes critical | Warn ou critical brut sur bénins |
|---|---|---|---|---|
| catalogue (outil complet) | 99,7 % [99,5 ; 99,9] (2922/2930) | 95,1 % [94,2 ; 95,8] (2786/2930) | 1,0 % [0,7 ; 1,6] (20/1976) | 19,2 % [17,5 ; 21,0] (379/1976) |
| honnête | 98,9 % [98,5 ; 99,2] (2898/2930) | 88,3 % [87,1 ; 89,4] | 1,2 % [0,8 ; 1,8] (24/1976) | 18,8 % [17,2 ; 20,6] |
| plancher seul (sans intention) | 98,9 % [98,5 ; 99,2] (2898/2930) | 88,3 % [87,1 ; 89,4] | 0,0 % [0,0 ; 0,2] (0/1976) | 14,7 % [13,2 ; 16,4] (291/1976) |

Statut : SYNTH et RÉGLÉ. Réserves :
- Les règles ont été ajustées en regardant ces mêmes cas. Le chiffre peut baisser sur V2_TEST.
- 8 malveillants ratés dans le bras catalogue. 0 inconnu.
- Au-delà de la sévérité tolérée : 10,1 % [8,8 ; 11,5] (199/1976) pour le bras catalogue.
- Le warn ou critical brut reste à 19,2 %, au-dessus de la cible de 15 %. La frontière est décrite dans le journal : minimum reçu à 0 sur 94 bénins, setApprovalForAll vers un marché (60), appels Odos non décodables. On ne l'atteint qu'en acceptant des risques réels.
- Fraude conforme alertée : 76,5 % [73,4 ; 79,3] (608/795) pour le bras catalogue, 45,0 % (358/795) pour le plancher. Ce taux vient surtout des signaux de destinataire et d'ampleur. Il ne dit rien sur un vrai conseiller.
- Les auteurs des cas ne sont pas aveugles. Adresses et ABI parfois écrites de mémoire (champ `approximation`). Messages d'escroc écrits par une IA. Proportions des familles non réalistes.

Par chaîne (même source, bras catalogue) :

| Portée | Rappel | Fausses alertes critical | Warn ou critical brut |
|---|---|---|---|
| Avalanche (43114 et 43113) | 99,6 % [99,2 ; 99,8] (1588/1594) | 1,0 % [0,6 ; 1,6] (15/1502) | 18,0 % (271/1502) |
| Autres chaînes | 99,9 % [99,5 ; 100] (1334/1336) | 1,1 % [0,5 ; 2,4] (5/474) | 22,8 % (108/474) |

## S2. Fixtures publiques

| Chiffre | Valeur | n | Source | Statut |
|---|---|---|---|---|
| Rappel, bras honnête et catalogue | 95,4 % [87,3 ; 98,4] (62/65) | 65 malveillants | `T/attacks_public/out/MESURE_001.md` ; `T/run/out/JOURNAL.md` (état final) | SYNTH |
| Fausses alertes critical, bras catalogue, avant les correctifs V2 | 7,5 % [3,2 ; 16,3] (5/67) | 67 bénins | `T/attacks_public/out/MESURE_001.md` (fichier non régénéré, il décrit l'état d'avant) | SYNTH |
| Fausses alertes critical, après les correctifs V2 | 1,5 % | 67 bénins | `T/run/out/JOURNAL.md` (F21 à F23 : 2 faux positifs supprimés) | SYNTH, RÉGLÉ |
| Applicable C-Chain (hors EIP-7702) | rappel 94,6 % [85,4 ; 98,2] (53/56) | 56 | `T/attacks_public/out/MESURE_001.md` | SYNTH |

Réserves : fixtures écrites par nous d'après des motifs publics. 4 cas inconnus (méthode `wallet_requestExecutionPermissions` non gérée), 10 cas non exécutables. Le fichier MESURE_001.md n'a pas été régénéré après la boucle V2 : ses taux de fausses alertes sont ceux d'avant.

## S3. TEST ouvert une fois avant : CONTAMINÉ

Le jeu TEST (R003) a été ouvert une fois, avant les correctifs F1 à F10. Il a ensuite servi à orienter des correctifs. Il ne compte plus comme test indépendant. À citer seulement comme "ancien état, contaminé".

| Chiffre | Valeur | n | Source |
|---|---|---|---|
| Rappel, bras intention soufflée | 94,5 % [88,6 ; 97,5] (104/110) | 110 | `T/COUVERTURE.md` |
| Fausses alertes critical | 23,1 % [15,1 ; 33,6] (18/78) | 78 | `T/COUVERTURE.md` |
| Plancher sans intention | rappel 91,8 % [85,2 ; 95,6] (101/110) ; fausses alertes critical 5,1 % [2,0 ; 12,5] (4/78) | 110 et 78 | `T/COUVERTURE.md` |
| Simulation seule (référence) | rappel 25,4 % [18,2 ; 34,3] (28/110) | 110 | `T/COUVERTURE.md` |

## S4. Banc en conditions produit : l'écart avec le banc complet

Question : le banc donne aux règles un contexte (âge du contrat, solde, jetons, liste de protocoles) que le produit n'a pas. Que devient la mesure quand on retire ce contexte ? Source : `T/banc_realiste/out/TAB_TOTAUX_produit.md`, `EN_LIGNE_produit.md`, définition des niveaux dans `T/banc_realiste/CONTEXTE_PRODUIT.md`. Rapport rédigé : `T/banc_realiste/BANC_REALISTE.md` (réponse à MSG-056). Les chiffres de ce rapport sont repris dans le tableau « tous jeux » ci-dessous. Les passages précédents faits sans copie des sources ont été écartés par son auteur parce que le moteur changeait pendant la mesure.

Bras "intention produit" (l'intention est réduite à ce que le produit sait exprimer). V2_DEV, jeu réglé :

| Niveau de contexte | Rappel | Fausses alertes critical | Warn ou critical brut |
|---|---|---|---|
| Banc complet (FULL) | 99,6 % [99,3 ; 99,8] (2918/2930) | 1,0 % (20/1976) | 15,2 % (301/1976) |
| Produit, réglage par défaut (B) | 84,0 % [82,6 ; 85,2] (2460/2930) | 14,4 % [12,9 ; 16,0] (285/1976) | 54,9 % (1084/1976) |
| Avec carnet et historique saisis (C) | 92,4 % [91,3 ; 93,3] (2706/2930) | 14,4 % (285/1976) | 54,9 % |
| Liste statique livrée (D), borne haute optimiste | 90,3 % [89,2 ; 91,4] (2647/2930) | 1,0 % (20/1976) | 17,1 % (337/1976) |

Mesure « conditions produit », tous jeux (DEV, PUBLIC, V2_DEV), bras « intention produit », 3 254 malveillants et 2 136 bénins. Source : `T/banc_realiste/BANC_REALISTE.md`, section 2.

| Niveau de contexte | Rappel | Rappel critical | Fausses alertes critical | Fausses alertes warn ou critical |
|---|---|---|---|---|
| Banc complet (FULL) | 99,2 % [98,8 ; 99,5] | 92,0 % [91,0 ; 92,9] | 0,9 % [0,6 ; 1,4] | 15,4 % [13,9 ; 17,0] |
| Produit, réglage par défaut (B) | 83,8 % [82,5 ; 85,0] | 71,3 % [69,7 ; 72,9] | 13,9 % [12,5 ; 15,4] | 54,2 % [52,1 ; 56,3] |
| Carnet et historique saisis (C) | 91,9 % [91,0 ; 92,8] | 79,5 % [78,1 ; 80,9] | 13,7 % [12,3 ; 15,2] | 54,2 % |
| Aucun contexte (A) | 81,2 % [79,8 ; 82,5] | 67,9 % [66,3 ; 69,5] | 13,9 % | 55,7 % [53,6 ; 57,8] |
| Liste statique livrée (D), borne haute | 90,1 % [89,1 ; 91,1] | 80,5 % [79,1 ; 81,8] | 0,9 % | 17,1 % [15,6 ; 18,7] |

Le « warn » devient presque inutile au réglage produit : 54 % des requêtes bénignes en warn ou critical. Le contexte réseau n'est pas la première cause d'écart : c'est l'absence de liste de protocoles connus et de carnet. Avec l'intention du catalogue (plus riche que ce que le produit sait exprimer), les fausses alertes critical montent à 25,8 % au niveau B : c'est le bras du banc, pas celui du produit.

Lecture :
- Le chiffre de 1,0 % de fausses alertes critical n'est vrai que si le produit fournit le contexte du banc. Au réglage par défaut, il est de 14,4 % sur ce jeu.
- Une liste statique de protocoles livrée avec le produit ramène les fausses alertes critical vers 1,0 %. Elle est ici construite à partir du catalogue lui-même : c'est une borne haute, pas une couverture mesurée.
- Les lectures en ligne minimales (nature du contrat, âge, jetons, soldes) montent le rappel. Sur tout le jeu (DEV, PUBLIC, V2_DEV), l'ajout de ces lectures à la liste statique donne un rappel de 95,1 % [94,4 ; 95,8] avec 0,9 % de fausses alertes critical (`EN_LIGNE_produit.md`, ligne D_O4).
- Le banc ne mesure pas le texte de la page, la règle Seaport propre au serveur, ni la friction.

## S5. Autres mesures synthétiques

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Scénarios exportés | 6 456 scénarios (385 catalogue, 144 public, 5 927 V2) ; 3 930 sur Avalanche (60,9 %) ; 14 inutilisables (10 sans requête EVM, 4 en ERC-7715) ; 6 442 acceptés par le moteur | `T/scenarios_export/README_EXPORT_FR.md` | SYNTH, tous synthétiques |
| Moteur d'effets, tests unitaires | 447/447 passent (rejoués le 11 oct.) | `T/engine/test/` | SYNTH (les tests valident le code, pas la détection) |
| Serveur local, tests | 33/33 passent (rejoués le 11 oct.) | `T/server/test/server.test.mjs` | SYNTH |
| Serveur, tests de présentation | 30/31 (rejoués le 11 oct.). Échec : le test 7a, 7 codes de raison récents du moteur n'ont pas d'entrée dans la table de textes (`lookalike_reported`, `lookalike_weak`, `signed_transfer_unlimited`, `signed_right_unlimited_unknown`, `signed_calldata`, `signed_text_grants_assets`, `offchain_signaling`) | `T/server/test/presentation.test.mjs` | SYNTH. L'annonce "31/31" de INBOX n'est pas reproduite |
| Latence du verdict, serveur local | médiane 30,5 ms, p95 35,8 ms, max 39,3 ms (400 requêtes) | `T/server/test/results.json` (rejoué le 11 oct.) | SYNTH. Hors ligne, sans RPC, sans fork, sans modèle. Les valeurs varient d'un run à l'autre (25,9 ms et 38,7 ms au run précédent) |
| Journal ancré, intégrité et Merkle | 42 vérifications OK, 0 échec | `T/anchor/ANCHOR_README.md` | SYNTH. Contrat non compilé chez nous. Compilé et déployé sur nœud local par Adem (`coord/INBOX.md` MSG-058), rejeu annoncé dans `coord/reports/critere_reponse.md`, non rejoué ici. Aucun déploiement sur Fuji listé |
| Extension, batterie de tests (Chrome 154 et Edge 155) | 64 PASS, 0 FAIL, 2 LIMITE sur chaque | `T/extension/COMPAT.md` | SYNTH (portefeuille simulé), version d'avant les changements d'Adem |
| Comparateur d'Adem seul contre avec plancher objectif | 21/30 contre 29/30 | `coord/INBOX.md` POINT-20MIN 02h23 | SYNTH, petit n, non rejoué ici |
| Retenue de 10 minutes | testée avec 2 s ; retenue persistante (chrome.alarms, stockage) ajoutée par Adem (commit e0a89a7) | `T/extension/COMPAT.md` ; `coord/INBOX.md` MSG-056 | non rejoué ici |
| Détection de la voie de réponse (côté Adem) | matrice graduée, fiche d'incident, retrait de droits, ancrage sur chaîne locale, 23 tests | `coord/reports/critere_reponse.md` | non rejoué ici |

## S6. Produit livré contre banc

Source : `T/redteam/PRODUIT_VS_BANC.md`. Mesure du 11 oct. 2026 à 05 h 00, commit `816fbfb`, sur `V2_DEV_norm.jsonl` et neuf fichiers `jury_*.jsonl` : 9 908 cas, dont 6 191 arnaques et 2 695 bénins. `V2_TEST` non lu. Le moteur, le serveur et les détecteurs changeaient pendant la mesure : photo, pas résultat figé. Une arnaque est ratée quand le produit n'affiche pas l'écran rouge. Une fausse alerte est un bénin en rouge.

| | Produit aujourd'hui | Produit + contexte live | Produit + live + détecteurs | Banc |
|---|---|---|---|---|
| Arnaques ratées (sur 6 191) | 3 643 | 3 514 | 593 | 832 |
| Rappel | 41,2 % | 43,2 % | 90,4 % | 86,6 % |
| Fausses alertes (sur 2 695) | 440 | 440 | 1 127 | 329 |
| Taux de fausses alertes | 16,3 % | 16,3 % | 41,8 % | 12,2 % |

Lecture :
- Le produit d'aujourd'hui rate 3 643 arnaques sur 6 191. L'essentiel de l'écart avec le banc vient des 13 détecteurs de `detectors_adem/`, qui tournent dans le banc et pas dans le produit (2 099 arnaques sur l'écart).
- Le rappel de 90,4 % n'est pas un vrai résultat : sans liste de protocoles connus, tout bénéficiaire est inconnu et 42 % des bénins passent en rouge. Avec la liste et le contexte live (configuration cible) : 896 arnaques ratées et 458 fausses alertes.
- Retirer au banc les détails de l'intention (jeton, montant, destinataire, message collé) : 931 arnaques ratées contre 832 (+99). L'extension ne demande aujourd'hui que le type d'intention.
- Statut : SYNTH. Les faits « live » viennent du cas, pas d'un nœud. Le produit n'a pas de texte de page dans ces fichiers.
- Non retrouvé dans ce rapport : le chiffre « 318 arnaques de plus quand on donne le type d'intention sans ses détails » cité dans `coord/INBOX.md` MSG-061. Ne pas le citer avant de l'avoir relié à sa source.

---

# COLONNE DONNÉES RÉELLES

## R1. Trafic réel, moteur actuel (politique sans intention, sans contexte)

Source : `T/realtraffic/REALTRAFFIC.md`. Moteur et politique (correctifs F1 à F10 actifs au moment de la mesure), sans comparateur, sans intention, sans historique, sans carnet, sans RPC. Trafic de blocs aléatoires, "légitime" présumé.

| Chiffre | Valeur | n | Statut |
|---|---|---|---|
| C-Chain, alertes critical | 0,30 % [0,19 ; 0,47] (19) | 6 325 tx, 1 500 blocs | RÉEL |
| C-Chain, warn | 76,84 % [75,78 ; 77,86] | idem | RÉEL |
| C-Chain, ok | 22,66 % | idem | RÉEL |
| Part des alertes C-Chain qui sont de l'opacité seule ("je n'ai pas pu décoder") | 95,8 % (76,8 % sur Ethereum) | idem | RÉEL |
| Part de trafic C-Chain en appels opaques | 74,5 % (28,8 % sur Ethereum) | idem | RÉEL |
| Ethereum, alertes critical | 3,33 % [2,91 ; 3,82] (200) | 6 000 tx tirées, 200 blocs | RÉEL |
| Transferts natifs et ERC-20 | 0 % d'alerte (21 % du trafic C-Chain, 61 % d'Ethereum) | idem | RÉEL |
| Revue manuelle des 19 critical C-Chain | 2 fausses alertes confirmées (10,5 % [2,9 ; 31,4]), 2 alertes utiles, 15 indéterminées | 19 | RÉEL, un seul relecteur |
| Revue manuelle des critical Ethereum | 13/20 fausses alertes (65 %) | 20 | RÉEL, un seul relecteur |
| Latence du moteur seul | médiane 0,037 ms, p95 0,20 ms (C-Chain) | 6 325 | RÉEL, en mémoire, hors réseau |

Réserves :
- Ce n'est pas du trafic de portefeuilles d'utilisateurs : il contient des robots (MEV, arbitrage) et des bundlers. La part d'opacité est gonflée par ce trafic.
- Le "légitime" est présumé. Aucune étiquette de vérité.
- Le critère "fausse alerte" repose sur un proxy de popularité et sur la reconnaissance de protocoles par un seul relecteur.
- La liste de protocoles connus du mode B est circulaire (dérivée de l'échantillon). Ne pas la citer comme une couverture.
- Les attaques ne sont pas mesurées ici. Aucun rappel.
- Le taux de fausses alertes critical sur Ethereum (environ 2,2 % du trafic) n'atteint pas la cible de 1 pour 1 000.

## R2. Filet v0 et droits de dépense réels

| Chiffre | Valeur | n | Source | Statut |
|---|---|---|---|---|
| Filet v0 (5 règles, sans intention), alertes sur trafic C-Chain présumé légitime | 0,28 % [0,18 ; 0,45] | 6 325 tx | `bench/RAPPORT_banc_reel_v0.md` | RÉEL |
| Même filet, Ethereum, après correction | 2,98 % (3,15 % avant) ; règle R3 0,27 % | 43 075 tx, 200 blocs | idem, CORRECTION MAJEURE | RÉEL |
| Rappel du filet v0 sur droits de dépense directs réels (Ethereum) | 24/33 = 72,7 % [55,8 ; 84,9] | **n = 33** | idem, CORRECTION MAJEURE | RÉEL |

Réserves : n = 33 seulement (le jeu de 1 354 contenait des révocations comptées à tort). Étiquettes ScamSniffer (tiers), 170 spenders, forte concentration, surtout des drainers déjà listés. Ne valide pas un drainer neuf.

## R3. Compatibilité sur 96 sites réels

Source : `T/compat/COMPAT_REEL.md`.

| Chiffre | Valeur | Statut |
|---|---|---|
| Sites testés | 96 : PASS 81, DIFFÉRENCE 8, CASSE 0, inaccessibles 7 | RÉEL |
| Taux de casse | 0/89 = 0,0 % [0,0 ; 4,1] ; 0/65 [0,0 ; 5,6] parmi les sites qui détectent un portefeuille | RÉEL |
| Casse ou différence | 8/89 = 9,0 % [4,6 ; 16,7] | RÉEL |
| Bruit A/A (erreur console nouvelle sans aucune différence d'injection) | 9/86 = 10,5 % [5,6 ; 18,7] ; bras test 6/89 = 6,7 % | RÉEL |

Réserve centrale : le bras test est un **Proxy de substitution** du banc, pas l'extension Hold up. Le fournisseur de portefeuille est simulé. Aucune connexion ni signature réelle. Échantillon de commodité. Un site peut être PASS parce que le bouton de connexion n'a pas été trouvé.

## R4. Empoisonnement d'adresse sur la C-Chain (contexte : la menace existe)

Décision D-009 : ces chiffres servent seulement à dire que la menace existe. Ils ne sont ni un différenciateur de Hold up ni une perte évitée, et MetaMask traite déjà ce cas. Aucun autre scan ne sera lancé.

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Campagne août à déc. 2025 | 36 744 adresses visées, 248 053 envois de poussière, 51 625,61 USDC volés | `U_segment/U4_menaces_avalanche.md` | RÉEL (source unique, rapport d'un analyste, non audité) |
| Scan à nous, 300 000 blocs C-Chain (du 7 au 11 oct. 2026) | 517 487 transferts USDC et USDT lus. 2 170 paires candidates avec la règle préfixe 3 et suffixe 4. Un tirage mélangé de contrôle en trouve 1 en moyenne (10 tirages). 475 jugées probables, 1 695 indéterminées par la règle automatique. Aucun envoi d'une victime vers un sosie observé dans la fenêtre | `T/realscan/out/summary.json` | RÉEL, **résumé machine seulement** |

Réserves : il n'y a pas de rapport rédigé (`REALSCAN_POISONING.md` n'existe pas). Un "candidat" n'est pas une attaque confirmée. Le scan n'a pas été relu à la main. Ne pas en tirer un taux de détection.

---

# CE QUI N'EST PAS MESURÉ

| Sujet | État |
|---|---|
| V2_TEST (2 498 cas sur 8 425, jeu gelé, empreinte publiée) | À ouvrir **une seule fois, à la fin**. Aucun résultat. Risque de procédure : `V2_TEST.jsonl` est suivi par git (relevé par Adem, `coord/INBOX.md` MSG-055), alors qu'on dit qu'il n'a jamais été lu |
| Jeu aveugle V1 (150 cas) | À passer une fois. Aucun résultat |
| Essai réel avec MetaMask | Jamais joué. Le protocole est écrit (`T/essai_reel/ESSAI_REEL_METAMASK.md`). Tous les "attendus" sont des prévisions tirées du code. Aucun contrat de démo listé dans `blockchain/DEPLOYMENTS.md` ; le déployeur Fuji n'avait pas d'AVAX de test (MSG-057) |
| Extension réelle dans Chrome sur des sites réels | Non mesuré. La compatibilité sur 96 sites utilise un Proxy du banc. L'extension a été testée avec un portefeuille simulé seulement |
| Utilisateurs réels | Aucun test avec des personnes. Le test de compréhension (`U_comprehension/`) utilise des personas simulés : NON CONCLUANT, aucun taux n'est cité. Temps de décision : non mesuré |
| Rappel sur un drainer neuf réel | Non mesuré. Les données réelles sont surtout des drainers déjà listés |
| Fraude conforme (transfert valide sous guidance d'un escroc) | Mesure synthétique seulement. Invisible par construction quand rien ne distingue l'envoi |
| Intention en texte libre | Non mesurée. Tous les chiffres de ce document utilisent des intentions à choix fermé. La précision de l'extraction du type, du montant, du jeton et du destinataire reste à mesurer, d'abord avec des mots-clés |
| Clef et Jev | Jamais appelés faute de clé. Ne jamais écrire « Clef classe l'intention » sans mesure. Le classement actuel est par mots-clés |
| Comparateur sur les cas revendiqués | Autorisation plus large que le montant voulu, jeton différent, destinataire tiers d'un échange, « recevoir » qui fait sortir des fonds, « me connecter » qui signe un droit : cas, règles et chiffres à produire |
| Réaction de MetaMask sur Fuji et chaîne locale | Non mesurée. Ces réseaux ne sont pas dans la liste de sa page d'aide. Son silence ne prouve rien |
| Latence avec simulation, fork, RPC de contexte | Non mesurée. Seule la latence locale hors ligne est mesurée |
| Détection et réponse sur Fuji | Non mesurées |
| Efficacité d'un avertissement sur des personnes réelles | Non mesurée. Les chiffres de la littérature (section D) ne sont pas les nôtres |

---

# D. Cibles et hypothèses (pas des mesures)

| Chiffre | Valeur | Source | Statut |
|---|---|---|---|
| Cible fausses alertes critical | 1 pour 1 000 avec borne | `O_barriere_intention.md` | HYPO, non sourcée, NON atteinte (trafic réel Ethereum 3,33 % de critical ; banc produit au réglage par défaut 14,4 %) |
| Cible rappel | 90 % sur familles connues, 70 % sur inédites | `O_barriere_intention.md` | HYPO |
| Cible de `docs/intent-barrier.md` | FN = 0 sur démo, FP critical sous 2 %, p95 sous 1,5 s | `docs/intent-barrier.md` | HYPO |
| Warn ou critical brut sur bénins | cible 15 % ou moins ; mesuré 19,2 % sur V2_DEV | `T/run/out/JOURNAL.md` | non atteinte |
| 30 s (niveau Danger) et 10 min (manipulation) | durées de friction | `docs/design/REGLES_avertissements.md` | HYPO, aucune preuve publiée |
| Borne de confiance | 3 000 transactions légitimes sans alerte pour affirmer moins de 0,1 % | `O_barriere_intention.md` | calcul (règle de 3), pas un résultat |
| Effet d'un avertissement en simulation de portefeuille | annulation 1,3 % (témoin), 19,7 % (passif), 32,9 % (délai 5 s), 48,6 % (actif sur le spender) | `U_segment/U3_efficacite_interventions.md` | LIT (laboratoire) |
| Fraude avec geste d'annulation (banque simulée) | 22 % à 4 % | `U_segment/U3_efficacite_interventions.md` | LIT (OBIE 2021) |
| Outrepassement des avertissements navigateur | SSL 70,2 % Chrome contre 33,0 % Firefox | `docs/design/REGLES_avertissements.md` | LIT (Akhawe et Felt 2013) |
| Pertes ScamSniffer | 83,85 M$ en 2025 (106 k victimes) | `U_segment/U4_menaces_avalanche.md` | LIT |

---

# E. Chiffres RETIRÉS (ne plus jamais les citer)

| Chiffre | Pourquoi retiré | Source de la correction |
|---|---|---|
| **80,4 % de rappel de la règle R3** (compte externe), avec 0,23 % de faux positifs | Le jeu "d'attaques" de 1 354 transactions contenait 1 186 `approve(..., 0)`, c'est-à-dire des révocations, comptées à tort comme des droits. | `bench/RAPPORT_banc_reel_v0.md`, CORRECTION MAJEURE |
| **81,9 %** de rappel du filet complet (1 354 transactions) | Même cause. | idem |
| 89,3 % sur les "1 219 approbations directes" | Même jeu contaminé. | idem |
| 88,2 % de rappel et 0,39 % de FP pour "compte externe OU contrat jeune" | Calculé sur le jeu contaminé. | idem, addendum 1 |
| Signal "contrat jeune" (1,2 % des attaques) | Jeu contaminé en partie. Résultat négatif de toute façon. | idem |
| **Preuve sociale 99 %** (approbateurs antérieurs) | Calculée sur le même jeu contaminé. À refaire sur les droits réels, ne pas citer. | idem |
| **Signal nonce du spender** (rappel 87 %, 44 % de faux positifs) | Même jeu contaminé. Résultat négatif. | idem |
| Ligne "R3 80 % rappel / 0,23 % FP (Ethereum)" de la matrice des familles | Reprise du chiffre faux. | `R_cas_complexes/SYNTHESE.md` |
| Parts de pertes évitables "environ 1 %" (global) et "environ 38 %" (natif portefeuille) | Calculées avec les rappels retirés. | `U_segment/U3_efficacite_interventions.md`, constat 4 |
| DEV après F1 à F10 : "100 %" de rappel et "0/90" de fausses alertes critical | Obtenus en réglant les règles sur ce même jeu. Sur TEST, avant correctifs, les fausses alertes critical étaient de 23,1 %. À ne pas citer comme résultat. | `T/COUVERTURE.md`, section boucle ; `T/run/out/JOURNAL.md` |
| Taux de compréhension des écrans (tests v1 et v2) | Réponses de personas simulés, questions à choix qui guident la réponse, n faible. Non concluant. | `U_comprehension/` |
| Objectifs "FP critical sous 1/1000" et "FN = 0" présentés comme acquis | Ce sont des cibles, non atteintes. | `O_barriere_intention.md` |
| TEST ouvert une fois, 94,5 % et 23,1 % | Pas retiré, mais **contaminé** : à citer seulement comme ancien état (section S3), jamais comme test indépendant. | `T/COUVERTURE.md` |

Ce qui reste valable de l'ancien rapport : le droit illimité (R1) est inutile comme alerte critique seule (2,27 % du trafic Ethereum) ; la délégation EIP-7702 est trop fréquente en légitime (0,56 % sur Ethereum) pour être critique seule ; la liste ScamSniffer mélange drainers et adresses d'empoisonnement (`bench/RAPPORT_banc_reel_v0.md`).

# Jury d'évaluation : passe 3

Date : dimanche 11 oct. 2026, 04h58 à 05h01. Passe déclenchée par un changement majeur : le serveur du Lab répond sur 8800 depuis 04h58. Rien n'a été modifié hors de `coord/reports/jury/`. `V2_TEST.jsonl` et `BLIND_v1.jsonl` non exécutés.

## 1. Ce qui a été exécuté

| Vérification | Résultat observé |
|---|---|
| `GET 8800/api/health` | `status: up`, copie locale d'Avalanche (43114) sur un nœud à part (`8560`), victime = compte de test public Hardhat. |
| `GET 8800/api/scenarios` | 33 scénarios : 18 malveillants, 15 honnêtes ; portes `site` 21, `wallet` 6, `walletconnect` 4, `exchange` 2. |
| `POST 8800/api/run-all` | 33 joués, 0 erreur. Chaque scénario est réellement exécuté sur la copie locale (hachages de transaction, soldes avant et après), puis annulé. |
| `node --test research/demo_reelle/lab/server/test/lab.test.mjs` | 8/8 (chaîne jetable 8570). La commande écrite en tête du fichier (`node --test …/test/`, avec le dossier) échoue sous Node 25 et Windows. |
| UI du Lab `8801` | **Ne répond pas** (elle répondait à 04h43). |
| `server` : `presentation.test.mjs` | 31/31 (30/31 en passe 2, corrigé par `40d3fbe`). `server.test.mjs` 33/33. |
| `research/demo_reelle/audit/verify_decision.mjs --seq 1 --request … --context … --selftest` | Toutes les vérifications passent : chaîne recalculée par un code indépendant, `sha256(params)` égal à la ligne, rejeu déterministe, niveau, fiche et codes rejoués égaux aux valeurs journalisées, règle rattachée à `engine/src/rules.mjs:63`, ligne modifiée et ligne supprimée détectées. Il affiche aussi « empreinte du code de décision : non enregistrée dans le journal ». |
| Suivi git | `816fbfb` a commité README, `scripts/demo.mjs`, `package.json`, `ARCHITECTURE.md`, `INSTALLATION.md`, `pipeline/`, `lab/server/`. |
| `blockchain/DEPLOYMENTS.md` | Toujours vide. |
| `livrables/video/` | Inchangé : trois clips. |
| `livrables/FICHE_DEFENSE.md` | Inchangé : 842 mots. |

Résultat du Lab (`run-all`, pipeline livré, colonne principale) :

| | Compte |
|---|---|
| Malveillants couverts par une porte | 16 (+ 1 angle mort affiché : permit par WalletConnect) |
| Arrêtés (écran `danger` ou `manipulation`) | 14 |
| Ratés | 2 : `site-swap-no-min` (averti seulement, perte mesurée 1 000 $) et `wallet-send-support` (aucun signal, perte mesurée 2 232 $) |
| Attaque inopérante | 1 (`site-personal-sign-calldata`) |
| Honnêtes couverts | 14 (+ 1 angle mort affiché) |
| Fausses alertes critiques | 0 |
| Honnêtes avertis | 2 |
| Latence du verdict | p50 1,23 ms, p95 29,82 ms |
| Avec détecteurs (seconde colonne) | 16 arrêtés, 0 raté, mais 1 fausse alerte critique (`wallet-send-new-merchant`) |

Mesure complémentaire faite entre les passes, sur le jeu de réglage `V2_DEV_norm` (2 930 malveillants, 1 976 honnêtes) et `jury_fp` (123 honnêtes), avec `node pipeline/measure.mjs … --modes=…` :

| Chaîne | Rappel critique | Fausses alertes critiques `V2_DEV` | Honnêtes avertis | Fausses alertes critiques `jury_fp` |
|---|---|---|---|---|
| Produit livré | 69,2 % | 265 (13,4 %) | 809 | 27 (22,0 %) |
| Produit + intention rejouée | 79,8 % | 285 (14,4 %) | 799 | 28 |
| Produit + détecteurs + faits de chaîne + intention | 97,0 % | 595 (30,1 %) | 571 | 50 (40,7 %) |
| **Idem + liste de protocoles connus livrée avec le produit** (`+known`) | **94,5 %** | **28 (1,4 %)** | 361 (18,3 %) | **9 (7,3 %)** |

Origine des 633 fausses alertes critiques du mode « détecteurs » : `kind_missing_unvouched_recipient` (détecteur `intent_guard`) en porte 323 ; `unlimited_allowance + external_spender` du produit 130 ; `domain_verifier_unexpected` 75 ; `approval_for_all + external_spender` 60. Tout le jeu `V2_DEV` ne contient que 44 adresses distinctes de protocoles connus.

## 2. Notes (0 à 10)

| Critère (poids) | Ingénieur détection SOC | Auditeur type KPMG | Ingénieur Avalanche / DeFi |
|---|---|---|---|
| Efficacité de détection (30 %) | 5 | 5 | 5,5 |
| Qualité de la réponse (20 %) | 6,5 | 6,5 | 7 |
| Faisabilité et intégration (20 %) | 6 | 5,5 | 5,5 |
| Conformité et explicabilité (15 %) | 6,5 | 7 | 6 |
| Pitch et démo (15 %) | 5,5 | 5,5 | 5,5 |
| **Total pondéré sur 100** | **58,0** | **57,8** | **58,8** |

**Moyenne : 58,2 / 100** (passe 2 : 53,5 ; passe 1 : 45,8).

**Ingénieur détection.** Détection 5 : le Lab donne enfin une mesure de bout en bout avec vérité terrain mesurée sur la chaîne (14 arrêtés sur 16, 0 fausse alerte critique sur 14 honnêtes), mais 33 scénarios écrits par l'équipe ne pèsent pas face à 13,4 % de fausses alertes sur 1 976 honnêtes du jeu de réglage. « Vos 14 honnêtes du Lab ne contiennent ni listing Seaport ni approbation illimitée à un routeur, les deux familles où vous sonnez à 100 %. » Faisabilité 6 : six suites vertes, une commande de démo.

**Auditeur.** Conformité 7 : j'ai rejoué une décision moi-même avec `verify_decision.mjs` et retrouvé le même niveau, la même fiche, les mêmes codes, avec le fichier et la ligne de la règle. Je ne monte pas plus haut tant que la version des règles n'est pas dans la ligne et que rien n'est ancré. « Votre outil me dit lui-même que l'empreinte du code n'est pas enregistrée : c'est la seule chose qui me manque pour signer. »

**Ingénieur Avalanche.** Détection 5,5 et réponse 7 : le Lab exécute la transaction sur une copie de la C-Chain et affiche la perte évitée en dollars, c'est la bonne preuve. Faisabilité 5,5 : rien sur Fuji, aucun vrai portefeuille, UI du Lab arrêtée. « Montrez-moi la même chose dans Core avec votre RPC en réseau personnalisé. »

## 3. Les cinq constats qui coûtent le plus

1. **Le levier de détection le plus rentable n'est pas branché : une liste de protocoles connus.** Mesuré : avec détecteurs, faits de chaîne, intention et liste connue, 94,5 % de rappel critique et 1,4 % de fausses alertes critiques, contre 69,2 % et 13,4 % pour le produit livré. Réserve : le mode `+known` prend la liste dans le cas lui-même, c'est une borne haute réglée sur le jeu de réglage.
2. **Sans cette liste, brancher les détecteurs seul est une régression** : 30 à 33 % de fausses alertes critiques. `intent_guard` en porte la moitié.
3. **Les chiffres du produit livré et du Lab ne sont dans aucun livrable.** La fiche et le README ne citent que le banc et des jeux anciens.
4. **Démo : l'UI du Lab (8801) est tombée, la vidéo reste en trois clips, la fiche de défense fait 842 mots.**
5. **Rien sur Fuji, aucun essai avec un vrai portefeuille, version des règles absente du journal.**

## 4. Corrections à faire, par priorité

### A. Éliminatoires

Levés depuis la passe 2 : fichiers de démo commités (E6), test de présentation réparé.

| # | Propriétaire | Fichier ou dossier | Changement attendu | Critère | Gain |
|---|---|---|---|---|---|
| E5 | Adem | `livrables/video/` | Un seul fichier de 2 à 3 minutes, monté selon `VIDEO_SCRIPT.md`. Le Lab répond : les plans 6, 8 et 9 sont enregistrables. | Livrable 2 | pitch +1 |
| E11 | Titouan | `livrables/FICHE_DEFENSE.md` | Une page : environ 450 mots, 3 lignes de tableau (produit livré, Lab, banc). | Livrable 4 | pitch +0,5 |
| E9 | Adem | `coord/DECISIONS.md` | Ligne D-009 : démo sur copie locale, Fuji non déployé (D-008 dit l'inverse). | Cohérence | conformité +0,25 |
| E10 | Titouan | `T_banc_e2e/compat/results/{A1,A2,B}/zora.json`, `realscan/out/`, `README.md` | Expurger le DSN Sentry tiers ; déclarer ou retirer les adresses réelles du réseau principal et le fichier de 95 Mo. | Règles secrets et données | évite une pénalité |

### B. Le reste, par gain attendu

| # | Propriétaire | Fichier ou dossier | Changement attendu | Critère | Gain |
|---|---|---|---|---|---|
| 1 | Titouan (`server/`, `engine/`) avec Adem (`pipeline/`) | `T_banc_e2e/engine/src/registry.mjs` (10 adresses aujourd'hui), `server/server.mjs` ligne 62 (`CANONICAL`) | Livrer une liste de protocoles connus par chaîne (LFJ, Pangolin, Aave, Benqi, Permit2, Uniswap, Seaport, 1inch, Odos, ParaSwap : 44 adresses couvrent tout `V2_DEV`), relue contre les sources officielles. Remesurer avec `pipeline/measure.mjs --modes=product,live+intent`. Cible : moins de 3 % de fausses alertes critiques. Dire la limite : un attaquant qui passe par un protocole listé. | Détection | +1,5 |
| 2 | Adem | `T_banc_e2e/detectors_adem/intent_guard.mjs` | `kind_missing_unvouched_recipient` ne doit pas sortir en critique quand aucune intention n'a été demandée (323 fausses alertes). Le passer en avertissement ou ne l'activer qu'après la question d'intention. | Détection | +0,5 |
| 3 | Titouan | `livrables/FICHE_DEFENSE.md`, `README.md` | Ajouter deux lignes : produit livré sur `V2_DEV` (69,2 %, 13,4 %) et Lab (14/16 arrêtés, 0/14 fausse alerte critique, 2 ratés nommés, p50 1,23 ms). | Détection, conformité | +0,5 et +0,25 |
| 4 | Titouan (mesures) | `T_banc_e2e/blind_adem/BLIND_v1.jsonl` | Le passer une fois dans `pipeline/measure.mjs --modes=product` et publier. | Détection | +1 |
| 5 | Adem | `research/demo_reelle/lab/ui/`, `scripts/demo.mjs` | Relancer et tenir `8801` ; vérifier que `node scripts/demo.mjs --check` annonce le Lab « présent / présent ». Corriger la commande de test en tête de `lab/server/test/lab.test.mjs`. | Pitch, faisabilité | +0,5 et +0,5 |
| 6 | Adem | `research/demo_reelle/lab/server/scenarios/` | Ajouter des honnêtes durs (listing Seaport, `setApprovalForAll` vers une place de marché, approbation illimitée à un routeur connu, swap LFJ réel) pour que le Lab montre aussi de vraies fausses alertes, comme le pitch le promet (« voici une fausse alerte »). Aujourd'hui il n'en montre aucune dans la colonne principale. | Détection, pitch | +0,5 |
| 7 | Titouan | `server/server.mjs` (`makeJournal`), `rpc_garde/proxy.mjs` | Écrire `rules_sha256` dans chaque ligne (calcul déjà présent dans `verify_decision.mjs`). | Conformité | +1 |
| 8 | Adem (humain, clé hors dépôt) | `blockchain/DEPLOYMENTS.md`, `T_banc_e2e/anchor/` | Déployer `EvidenceAnchor` sur Fuji, ancrer la racine du journal d'exemple (`0xbaef63f9…`), noter adresse et transaction ; `verify_decision.mjs --contract` la vérifie déjà. | Faisabilité, conformité | +1,5 et +0,5 |
| 9 | Adem (humain) | `T_banc_e2e/essai_reel/ESSAI_REEL_RESULTATS.csv` | Un essai réel, même court : Core ou MetaMask avec le RPC de garde en réseau personnalisé sur la copie locale, 2 lignes de résultat. | Faisabilité | +1 |
| 10 | Titouan | `server/server.mjs` | Scène héros : permit du solde exact vers un spender inconnu = `danger` (aujourd'hui `attention`). Scénario Lab `wallet-send-support` : envoi sous pression d'un faux support, aucun signal. | Détection | +0,5 |
| 11 | Titouan | `livrables/SLIDE_CONFORMITE.md` | 1 207 mots : la slide elle-même en 60 mots en tête. | Pitch | +0,25 |

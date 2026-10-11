# Jury d'évaluation : passe 4

Date : dimanche 11 oct. 2026, 05h11 à 05h15. Passe régulière, 12 minutes après la passe 3. Rien n'a été modifié hors de `coord/reports/jury/`. `V2_TEST.jsonl` et `BLIND_v1.jsonl` non exécutés.

## 1. Ce qui a été exécuté

| Vérification | Résultat observé |
|---|---|
| Moteur (`engine`) | 288/290, mêmes 2 échecs sur données ignorées par git. |
| Serveur (`server`, 2 fichiers) | 33/33 et 31/31. |
| Extension, tests unitaires | 54/54 (41 en passe 2 : 13 tests ajoutés). |
| RPC de garde | 15/15. |
| Lab (`lab.test.mjs`) | 8/8. |
| Contrats (`npx hardhat test`) | 30/30 (passe 1, non relancé). |
| Services | 8545, 8555, 8791, 8792, 8800 et **8801 répondent**. 8787 (serveur de vérification de l'extension) arrêté. |
| UI du Lab, ouverte dans un navigateur | S'affiche, branchée sur l'API réelle (chaîne `fork`, réseau 43114, 14 détecteurs). Chaque scénario porte ses identifiants NIST et ATT&CK. Défaut visible : la barre d'état écrit « Victime [object Object] ». |
| `POST 8800/api/run-all` | Identique à la passe 3 : 33 scénarios, 14 arrêtés sur 16 malveillants couverts, 2 ratés, 0 fausse alerte critique, 2 honnêtes avertis, p50 0,39 ms, p95 10,14 ms. |
| `pipeline/measure.mjs` sur `V2_DEV_norm` | Inchangé : produit livré 901 ratées sur 2 930 (69,2 % de rappel critique), 265 fausses alertes critiques sur 1 976 (13,4 %). Avec détecteurs, faits de chaîne et intention : 89 ratées, 595 fausses alertes (30,1 %). |
| `livrables/deck/holdup.pptx` (texte extrait des 8 slides) | **Slide 6 : « EN ATTENTE : livrables/SLIDE_CONFORMITE.md […] Ne pas présenter tant que ce cadre est visible. »** Le fichier date de 04h39, la slide conformité de 04h51 : le deck n'a pas été régénéré. Slide 5 : « Jeux aveugles, produit réel, Lab : à mesurer », alors que le Lab et le produit sont mesurés. |
| `livrables/video/` (une image extraite de chaque clip) | Clips lisibles, légendés en français. Le clip 2 porte le bandeau « tout est fictif […] Ce n'est pas l'extension ». Toujours trois fichiers. |
| `livrables/FICHE_DEFENSE.md` | 842 mots, inchangée depuis 04h51. |
| `blockchain/DEPLOYMENTS.md` | Vide. |
| `coord/DECISIONS.md` | Dernière ligne : D-008 (« la démo du jury se joue sur Fuji »). |
| Nouveau depuis la passe 3 | `research/demo_reelle/RECHERCHE_metamask_rpc_erreur.md` (`b55b8aa`) : lecture du code de MetaMask. Conclusion retenue : pas de RPC de secours pour un réseau personnalisé, pas de réémission, mais le message de refus n'est probablement pas affiché dans l'écran d'activité. Non vérifié sur un vrai portefeuille. |

## 2. Notes (0 à 10)

| Critère (poids) | Ingénieur détection SOC | Auditeur type KPMG | Ingénieur Avalanche / DeFi |
|---|---|---|---|
| Efficacité de détection (30 %) | 5 | 5 | 5,5 |
| Qualité de la réponse (20 %) | 6,5 | 6,5 | 7 |
| Faisabilité et intégration (20 %) | 6,5 | 5,5 | 6 |
| Conformité et explicabilité (15 %) | 6,5 | 7 | 6 |
| Pitch et démo (15 %) | 5,5 | 5,5 | 6 |
| **Total pondéré sur 100** | **59,0** | **57,8** | **60,5** |

**Moyenne : 59,1 / 100** (passe 3 : 58,2 ; passe 2 : 53,5 ; passe 1 : 45,8).

**Ingénieur détection.** Détection 5, inchangée : aucun chiffre n'a bougé depuis la passe 2, ni dans le code ni dans les livrables. « 13 % de faux écrans rouges sur votre propre jeu de réglage, et la fiche ne le dit pas : je ne note pas au-dessus de 5. » Faisabilité 6,5 : toutes les suites sont vertes sauf 2 tests liés à des données absentes, et le Lab tourne de bout en bout.

**Auditeur.** Conformité 7, inchangée. Pitch 5,5 : la slide conformité, qui est un livrable de la track, est un cadre « EN ATTENTE » dans le deck. « Votre deck me dit lui-même de ne pas le présenter. »

**Ingénieur Avalanche.** Faisabilité 6 : le Lab exécute sur une copie de la C-Chain, et l'équipe a lu le code de MetaMask pour savoir ce que devient un refus RPC. Je reste à 6 parce que rien n'est sur Fuji et qu'aucun portefeuille réel n'a été branché. « Vous savez par lecture de code que MetaMask n'affichera sans doute pas votre message : comment la personne sait-elle qu'elle doit ouvrir votre page ? » Pitch 6 : le Lab est une vraie démo, avec la perte mesurée sur la chaîne.

## 3. Les cinq constats qui coûtent le plus

1. **Détection figée à 69,2 % de rappel critique et 13,4 % de fausses alertes critiques pour le produit livré** (`V2_DEV_norm`, jeu de réglage). Le levier mesuré en passe 3 (liste de protocoles connus : 94,5 % et 1,4 %) n'est pas branché. C'est 30 % de la note.
2. **Aucun jeu aveugle passé, et les chiffres du produit et du Lab sont absents de la fiche, du README et du deck.**
3. **Deck périmé** : slide 6 en attente, slide 5 qui annonce « à mesurer » ce qui est mesuré.
4. **Vidéo en trois clips et fiche de défense de 842 mots** : deux livrables obligatoires hors format.
5. **Rien sur Fuji, aucun vrai portefeuille, version des règles absente du journal.** Le refus RPC risque de ne pas être lisible dans MetaMask.

## 4. Corrections à faire, par priorité

### A. Éliminatoires

| # | Propriétaire | Fichier ou dossier | Changement attendu | Critère | Gain |
|---|---|---|---|---|---|
| E12 | Adem (`livrables/deck/`) | `livrables/deck/holdup.pptx` | Relancer `node livrables/deck/build_deck.js` pour que la slide 6 lise `SLIDE_CONFORMITE.md` ; mettre à jour la ligne 4 de la slide 5 avec les chiffres du Lab (14/16, 0/14) et du produit livré (69,2 %, 13,4 %). Vérifier qu'aucune slide ne contient « EN ATTENTE ». | Livrable 3 et livrable de track | pitch +1, conformité +0,5 |
| E5 | Adem | `livrables/video/` | Un seul fichier de 2 à 3 minutes. Le Lab répond sur 8800 et 8801 : enregistrer les plans 6, 8 et 9 de `VIDEO_SCRIPT.md` et monter. | Livrable 2 | pitch +1 |
| E11 | Titouan | `livrables/FICHE_DEFENSE.md` | Une page : environ 450 mots, tableau de 3 lignes (produit livré, Lab, banc). | Livrable 4 | pitch +0,5 |
| E9 | Adem | `coord/DECISIONS.md` | Ligne D-009 : démo sur copie locale d'Avalanche, Fuji non déployé. D-008 affirme encore l'inverse du README. | Cohérence des affirmations | conformité +0,25 |
| E10 | Titouan | `T_banc_e2e/compat/results/{A1,A2,B}/zora.json`, `T_banc_e2e/realscan/out/`, `README.md` | Expurger le DSN Sentry d'un site tiers. Déclarer dans le README, ou retirer du suivi, les adresses réelles du réseau principal (`campaign_tx_senders.json`, `candidates.json`) et le cache de 95 Mo. | Règles secrets et données | évite une pénalité |

Aucun secret trouvé dans les fichiers ni dans l'historique. Aucune action contre un système réel observée dans les services en marche : tout tourne sur 127.0.0.1, la copie locale lit l'état public sans rien envoyer.

### B. Le reste, par gain attendu

| # | Propriétaire | Fichier ou dossier | Changement attendu | Critère | Gain |
|---|---|---|---|---|---|
| 1 | Titouan (`engine/`, `server/`) | `T_banc_e2e/engine/src/registry.mjs`, `server/server.mjs` (`CANONICAL`, ligne 62) | Livrer la liste de protocoles connus par chaîne (44 adresses couvrent `V2_DEV`), relue sur les sources officielles. Remesurer. Cible : moins de 3 % de fausses alertes critiques, rappel au-dessus de 90 % avec les détecteurs. | Détection | +1,5 |
| 2 | Adem (`detectors_adem/`, `pipeline/`) | `detectors_adem/intent_guard.mjs`, puis branchement de `pipeline/evaluate_plus.mjs` dans `rpc_garde/proxy.mjs` et l'extension | `kind_missing_unvouched_recipient` en avertissement tant qu'aucune intention n'est demandée (323 des 633 fausses alertes). Brancher seulement après le point 1. | Détection | +1 |
| 3 | Titouan (mesures) | `T_banc_e2e/blind_adem/BLIND_v1.jsonl` | Le passer une seule fois avec `pipeline/measure.mjs --modes=product`, publier le résultat avec intervalle. | Détection | +1 |
| 4 | Titouan (`W_livrables/`, livrables) | `livrables/FICHE_DEFENSE.md`, `README.md` | Ajouter les lignes « produit livré » et « Lab » avec leur commande de rejeu. | Détection, conformité | +0,5 et +0,25 |
| 5 | Titouan (`server/`) | `server/server.mjs` (`makeJournal`), puis `rpc_garde/proxy.mjs` | `rules_sha256` dans chaque ligne de journal ; `verify_decision.mjs` le compare au code présent. | Conformité | +1 |
| 6 | Adem (humain, clé hors dépôt) | `blockchain/DEPLOYMENTS.md`, `T_banc_e2e/anchor/` | `EvidenceAnchor` sur Fuji et une racine ancrée, adresse et transaction notées. | Faisabilité, conformité | +1,5 et +0,5 |
| 7 | Adem (humain) | `T_banc_e2e/essai_reel/ESSAI_REEL_RESULTATS.csv`, `research/demo_reelle/rpc_garde/` | Un essai avec MetaMask ou Core sur la copie locale : noter ce que le portefeuille affiche au refus. Si le message n'apparaît pas, faire ouvrir la page `/hold/<id>` par le proxy lui-même et l'écrire dans les limites. | Faisabilité, réponse | +1 et +0,5 |
| 8 | Adem (`research/demo_reelle/lab/`) | `lab/server/scenarios/`, `lab/ui/` | Ajouter 4 honnêtes durs (listing Seaport, `setApprovalForAll` place de marché, approbation illimitée à un routeur connu, swap réel) pour que le Lab montre une vraie fausse alerte comme le pitch l'annonce. Corriger « Victime [object Object] ». | Détection, pitch | +0,5 et +0,25 |
| 9 | Titouan | `server/server.mjs` | Permit du solde exact vers un bénéficiaire inconnu : `danger` (aujourd'hui `attention`, sans attente). | Détection | +0,5 |
| 10 | Titouan | `research/titouan/bench/.gitignore` ou `engine/test/cchain.test.mjs` | 290/290 sur un clone neuf. | Faisabilité | +0,25 |

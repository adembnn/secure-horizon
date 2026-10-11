# Jury d'évaluation : passe 1

Date : dimanche 11 oct. 2026, 04h35 à 04h42. Dépôt jugé tel qu'il est sur le disque (arbre de travail, pas seulement `HEAD`). Rien n'a été modifié hors de `coord/reports/jury/`. Le jeu `blind_adem/v2/V2_TEST.jsonl` n'a été ni lu ni exécuté.

## 1. Ce qui a été exécuté

| Vérification | Résultat observé |
|---|---|
| `node --test test/*.test.mjs` dans `T_banc_e2e/engine` | 288 réussis, 2 échecs sur 290. Les 2 échecs lisent `research/titouan/bench/data/permit2_logs.json` et `attack_approval_logs.json`, exclus par `bench/.gitignore` : un juré qui clone verra ces échecs. |
| `node --test` dans `T_banc_e2e/server` | 33/33. Latence sur 400 requêtes : p50 1,55 ms, p95 4,43 ms, max 6,65 ms. Journal chaîné : ligne modifiée détectée. |
| `node --test test/clef_client.test.mjs` dans `detectors_adem` | 3/3. `fork_test.mjs` non lancé (il déploie sur le nœud 8545). |
| `npx hardhat test` dans `blockchain/` | 30/30 en 41 s (réseau en mémoire). |
| `node --test rpc_garde/test/proxy.test.mjs` | ÉCHEC au chargement : `SyntaxError: Unexpected identifier 'un'` dans `T_banc_e2e/engine/src/rules_extra.mjs` ligne 278 (apostrophe non échappée dans `'… a la forme d'un appel…'`). Fichier modifié à 04h38m29. `node --check` échoue encore à 04h39. |
| Tests `extension_standalone/tests/run_tests.mjs` | Non lancés : le script reconstruit `extension_standalone/extension/` pendant que des agents y écrivent. Dernier `out/RESULTATS.json` daté de 03h51. |
| Lab `127.0.0.1:8800` (`/api/health`, `/api/scenarios`) et UI `8801` | Aucune réponse. `lab/server/scenarios/` et `lab/server/test/` sont vides. |
| RPC de garde `127.0.0.1:8555` | Aucune réponse. |
| Site leurre `8791` | Répond (page « Glacier Rewards », marque fictive). |
| Console attaquant `8792/state` | Répond : `chainId 43114`, mode `fork`, victime à 0, collecteur à 2 480 000 000 (le vol a été joué). Le `drainer` annoncé (`0x9230…2ef7`) diffère de `chain/addresses.local.json` (`0xE2a2…FDfe`) et de `site/addresses.local.json` (`0x6b81…19E7`). |
| Chaîne locale `8545` | `eth_chainId` = `0xa86a` (43114, copie d'Avalanche), bloc 97 245 943. |
| `blockchain/DEPLOYMENTS.md` | Tableau vide : aucune adresse sur Fuji. |

Rejeu des boîtes noires (`node redteam/check_plus.mjs redteam/<fichier>.jsonl --quiet`, à 04h37, avant la casse du moteur) :

| Fichier | Malveillants | Arnaques ratées | Bénins | Fausses alertes critiques | Avertissements sur bénins |
|---|---|---|---|---|---|
| `V2_DEV_norm` (jeu de réglage) | 2 930 | 16 (0,5 %) | 1 976 | 79 (4,0 %) | 1 220 (61,7 %) |
| `jury_fuzz_fp` | 0 | n/a | 509 | **492 (96,7 %)** | 9 |
| `jury_fp` | 0 | n/a | 123 | 18 (14,6 %) | 65 (52,8 %) |
| `jury_fuzz_intent` | 420 | **264 (62,9 %)** | 0 | n/a | n/a |
| `jury_social` | 73 | 28 (38,4 %) | 0 | n/a | n/a |
| `jury_fuzz_address` | 299 | 109 (36,5 %) | 82 | 8 (9,8 %) | 51 (62,2 %) |
| `jury_fuzz_encoding` | 940 | 211 (22,4 %) | 0 | n/a | n/a |
| `jury_fuzz_sig` | 1 101 | 184 (16,7 %) | 0 | n/a | n/a |
| `jury_defi` | 60 | 11 (18,3 %) | 0 | n/a | n/a |
| `jury_fuzz_control` | 368 | 8 (2,2 %) | 5 | 5 (5/5) | 0 |
| `fork_cases` | 4 | 3 | 1 | 0 | 0 |

Recherche de secrets (motifs AWS, Anthropic, GitHub, Slack, clés PEM, JWT, clés privées affectées, clés Hardhat connues) dans les fichiers suivis et non suivis non ignorés : aucun secret trouvé. `gitleaks` n'est pas installé sur cette machine, donc pas de second avis outillé. Aucun fichier `.env*` n'a été ouvert.

## 2. Notes (0 à 10)

| Critère (poids) | Ingénieur détection SOC | Auditeur type KPMG | Ingénieur Avalanche / DeFi |
|---|---|---|---|
| Efficacité de détection (30 %) | 4 | 4 | 4,5 |
| Qualité de la réponse (20 %) | 6 | 6 | 6 |
| Faisabilité et intégration (20 %) | 4,5 | 4 | 4 |
| Conformité et explicabilité (15 %) | 5 | 4,5 | 4,5 |
| Pitch et démo (15 %) | 4 | 4 | 4 |
| **Total pondéré sur 100** | **46,5** | **44,8** | **46,3** |

**Moyenne des trois jurés : 45,8 / 100.**

Preuves et phrase dite à voix haute, par juré.

**Ingénieur détection.**
- Détection 4 : 99,5 % de rappel et 4,0 % de fausses alertes critiques sur `V2_DEV_norm`, mais c'est le jeu de réglage. Sur les jeux adverses, 96,7 % de bénins en critique (`jury_fuzz_fp`) et 62,9 % d'arnaques ratées (`jury_fuzz_intent`). Aucun jeu aveugle mesuré. 61,7 % des opérations honnêtes du jeu de réglage reçoivent un avertissement. « Votre 99,5 % est un test de non-régression ; montrez-moi un chiffre sur un jeu que vos règles n'ont jamais vu. »
- Réponse 6 : retenue graduée réelle dans `rpc_garde/journal/decisions.jsonl` (verdict `danger`, attente, décision `cancel` après 43,8 s). Durées de 30 s et 10 min sans preuve.
- Faisabilité 4,5 : trois suites vertes, mais le moteur ne se charge plus à 04h39 et le Lab ne répond pas.
- Conformité 5 : chaîne de hachage testée (tests 29 à 31 du serveur). Pas de version des règles dans la ligne de journal.
- Pitch 4 : pas de fiche de défense au chemin attendu, deck en Markdown seulement.

**Auditeur.**
- Détection 4 : le document `W_livrables/RESULTATS_A_JOUR.md` est honnête (statuts RÉEL, SYNTH, RETIRÉ), mais il annonce « 447/447 tests du moteur » alors que la commande donne 288/290.
- Réponse 6 : le playbook dit qui répond de quoi, section 6. Il est encore un brouillon hors de `livrables/`.
- Faisabilité 4.
- Conformité 4,5 : `README.md` racine dit « Projet : pas encore choisi ». Le journal du RPC écrit `from`, `to` et le hachage de transaction en clair alors que la slide conformité promet « l'empreinte des paramètres, pas les paramètres ». Ancrage Fuji non livré. Identifiants de référentiels marqués « à vérifier ». « Je ne peux pas rejouer une décision si la ligne ne dit pas quelle version des règles l'a prise. »
- Pitch 4.

**Ingénieur Avalanche.**
- Détection 4,5 : le décodage d'effets et la copie locale de la C-Chain (43114) sont sérieux, 30 tests de contrats verts.
- Réponse 6 : retenir une transaction signée avant diffusion est un vrai mécanisme.
- Faisabilité 4 : `DEPLOYMENTS.md` vide alors que D-008 dit que la démo du jury se joue sur Fuji. RPC de garde arrêté. Extension jamais essayée avec un vrai portefeuille (aveu du deck, slide 8). « Rien sur Fuji, donc je ne peux rien vérifier sur Snowtrace. »
- Conformité 4,5 : `anchor/` existe (Merkle, `EvidenceAnchor.sol`), sans transaction d'ancrage.
- Pitch 4 : trois clips séparés (30 s, 72 s, 35 s, soit 2 min 17), pas une vidéo.

## 3. Les cinq constats qui coûtent le plus

1. **Moteur cassé en ce moment.** `T_banc_e2e/engine/src/rules_extra.mjs:278` ne compile plus (apostrophe dans une chaîne entre apostrophes). Conséquence mesurée : `rpc_garde/test/proxy.test.mjs` échoue au chargement ; le serveur et `check_plus.mjs` importent le même fichier. Coût : détection et faisabilité tombent à 0 si le gel arrive dans cet état.
2. **Fausses alertes hors de contrôle sur bénins adverses.** `jury_fuzz_fp` : 492/509 en critique. `jury_fp` : 18/123 en critique et 65/123 en avertissement. `V2_DEV_norm` : 1 220/1 976 bénins avertis. Coût : environ 2 points sur la détection (30 %).
3. **Aucun chiffre sur jeu non vu, et deux arnaques sur trois ratées quand on fuzze l'intention.** `jury_fuzz_intent` 264/420 ratées, `jury_social` 28/73. Le seul bon chiffre vient du jeu de réglage.
4. **Livrables obligatoires absents ou hors chemin.** `README.md` racine obsolète ; pas de `livrables/FICHE_DEFENSE.md`, `PLAYBOOK_REPONSE.md`, `SLIDE_CONFORMITE.md` (brouillons dans `research/titouan/W_livrables/`) ; deck sans fichier présentable ; `livrables/` entièrement non suivi par git.
5. **Rien sur Fuji et services de démo arrêtés.** `DEPLOYMENTS.md` vide, Lab (8800, 8801) et RPC de garde (8555) muets, scénarios du Lab vides, adresses du `drainer` incohérentes entre `8792/state`, `chain/` et `site/`.

## 4. Corrections à faire, par priorité

### A. Éliminatoires (violation de règle, livrable obligatoire manquant, affirmation fausse)

| # | Fichier ou dossier | Changement attendu | Critère | Gain si corrigé |
|---|---|---|---|---|
| E1 | `README.md` (racine) | Remplacer le README du harnais par le README produit : problème, architecture, installation, commande de démo, limites. Base : `research/titouan/W_livrables/README_DRAFT.md`, sans le mot « brouillon » ni « à vérifier ». Retirer « Projet : pas encore choisi ». | Livrable 1, conformité, pitch | conformité +1, pitch +1 |
| E2 | `livrables/FICHE_DEFENSE.md` | Créer la fiche d'une page à partir de `FICHE_DEFENSE_DRAFT.md`, avec les chiffres rejoués aujourd'hui et les identifiants vérifiés (plus aucun « à vérifier »). | Livrable 4 | conformité +1, détection +0,5 |
| E3 | `livrables/PLAYBOOK_REPONSE.md`, `livrables/SLIDE_CONFORMITE.md` | Copier les versions finales depuis `research/titouan/W_livrables/`, y ajouter la porte RPC (retenue avant diffusion) qui n'y figure pas. | Livrable de track | réponse +0,5, conformité +0,5 |
| E4 | `livrables/deck/` | Produire le fichier présentable (`holdup.pptx` ou PDF) annoncé par `DECK.md` ; `build_deck.js` n'existe pas encore. | Livrable 3 | pitch +1 |
| E5 | `livrables/video/` | Une seule vidéo de 2 à 3 min (les trois clips font 2 min 17 bout à bout : les assembler). Vérifier le poids avant de la suivre dans git. | Livrable 2 | pitch +1 |
| E6 | `livrables/` | Tout le dossier est non suivi (`?? livrables/`) : il doit être commité et poussé avant 12h00. | Tous les livrables | sans cela, zéro livrable |
| E7 | `T_banc_e2e/engine/src/rules_extra.mjs:278` | Corriger la chaîne (apostrophes échappées ou guillemets doubles), relancer les quatre suites. | Détection, faisabilité | évite une chute à 0 |
| E8 | `research/titouan/W_livrables/RESULTATS_A_JOUR.md` et tout livrable qui cite « 447/447 » ou une latence « médiane 25,94 ms » | Aligner sur ce que la commande donne aujourd'hui (288/290 moteur ; p50 1,55 ms, p95 4,43 ms serveur), ou faire passer les 2 tests sans données ignorées. | Affirmation fausse | conformité +0,5 |
| E9 | `coord/DECISIONS.md` (nouvelle ligne), `livrables/PITCH_*.md`, `blockchain/DEPLOYMENTS.md` | D-008 dit « la démo du jury se joue sur Fuji » et rien n'est sur Fuji. Soit déployer et remplir `DEPLOYMENTS.md` (humain, clé hors dépôt), soit écrire une ligne D-009 « démo sur copie locale, Fuji non déployé » pour que les documents ne se contredisent pas. | Affirmation fausse, faisabilité | faisabilité +1,5 si déployé |
| E10 | `T_banc_e2e/realscan/out/` (dont un fichier de 95 Mo), `T_banc_e2e/compat/results/` (288 fichiers) | Données de vrais portefeuilles du réseau principal et résultats de chargement de 96 sites réels : à justifier dans le README (lecture seule, données publiques) ou à sortir du suivi. Expurger le DSN Sentry d'un site tiers dans `compat/results/{A1,A2,B}/zora.json` (un scanner de secrets le signalera). | Règles éthique et secrets | évite une pénalité du jury GitGuardian |

### B. Le reste, par gain attendu

| # | Fichier ou dossier | Changement attendu | Critère | Gain |
|---|---|---|---|---|
| 1 | `T_banc_e2e/detectors_adem/`, `engine/src/rules_extra.mjs` | Faire tomber les critiques sur bénins : cible `jury_fuzz_fp` sous 10 % et `jury_fp` sous 5 %, sans dégrader `jury_fuzz_sig`. Publier avant/après. | Détection | +1,5 |
| 2 | `T_banc_e2e/blind_adem/` | Passer `BLIND_v1.jsonl` une fois avec le pipeline du produit et écrire le résultat avec intervalle. C'est le seul chiffre défendable. | Détection | +1,5 |
| 3 | `research/demo_reelle/lab/server/` | Démarrer le Lab, remplir `scenarios/` (30 ou plus, moitié honnêtes), faire répondre `/api/health`, `/api/scenarios`, `POST /api/run-all`, ajouter un test. | Faisabilité, pitch | +1,5 et +1 |
| 4 | `T_banc_e2e/server/server.mjs`, `research/demo_reelle/rpc_garde/proxy.mjs` | Écrire l'empreinte des règles et la version du moteur dans chaque ligne de journal ; dans le journal RPC, remplacer `from`, `to`, `tx` par des empreintes ou assumer par écrit. | Conformité | +1 |
| 5 | `T_banc_e2e/anchor/`, `blockchain/DEPLOYMENTS.md` | Ancrer une racine de journal sur Fuji et noter l'adresse et le hachage de transaction. | Conformité, faisabilité | +1 et +1 |
| 6 | `research/demo_reelle/site/addresses.local.json`, `chain/addresses.local.json` | Une seule source d'adresses : le `drainer` diffère à trois endroits. | Pitch (risque de démo) | +0,5 |
| 7 | `research/titouan/bench/.gitignore` ou `engine/test/cchain.test.mjs` | Les 2 tests qui lisent `bench/data/*.json` doivent passer sur un clone neuf (suivre les deux petits fichiers, ou sauter le test proprement). | Faisabilité | +0,5 |
| 8 | `livrables/FICHE_DEFENSE.md` | Ajouter un temps de détection et de réponse mesuré de bout en bout (du clic au verdict, puis à la décision : le journal RPC donne déjà `waited_ms`). | Détection | +0,5 |
| 9 | `CLAUDE.md` section « Projet / Stack » | Remplir (fichier réservé à Claude-Adem). | Conformité | +0,25 |

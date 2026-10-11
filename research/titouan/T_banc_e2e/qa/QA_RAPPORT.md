# QA Hold up : rapport du 11 oct. 2026

Passe en lecture seule. Racine : `research/titouan/T_banc_e2e`. Node 24.18.1, Windows.
Chaque fichier de test a été lancé seul, un processus node à la fois.
Les fichiers suivants étaient en cours de modification par d'autres agents pendant la passe : `run/policy.mjs`, `engine/src/*`, `detectors_adem/*`, `extension/*.js`. Des commits ont été fusionnés à 10:13.

## 1. Résultats des suites

| Suite | Résultat | Cause si échec | Propriétaire probable | Correctif |
|---|---|---|---|---|
| engine/test : calldata, cchain, compare, effects_abi, keccak, monotonie, real, rules, selectors, typed, typehash | 463 / 463 | | | |
| engine/test/familles.test.mjs (nouveau, non suivi) | 10 / 10 | | agent familles | |
| server/test/server.test.mjs | 33 / 33 | | | |
| server/test/presentation.test.mjs | vert | | | |
| pipeline/test/evaluate_plus.test.mjs | **13 / 14** | test périmé (voir B2) | agent familles (pipeline) | diff, partie B2 |
| pipeline/test/intent_clef, monotone_pipeline | 13 / 13, 7 / 7 | | | |
| extension/tests/unit (17 fichiers, dont revoke_branchement) | 190 / 190 | | | |
| extension_standalone/tests/run_tests.mjs | **ÉCHEC** (arrêt net) | vrai bug (voir B1) | agent d'Adem (build) et agent revoke/sync (tests) | diff, partie B1 |
| extension_standalone/tests/static_check.mjs | vert (49 fichiers, 0 secret) | | | |
| webdemo/tests/run_webdemo_tests.mjs | 135 / 135 | | | |
| attacks_decalage/mesure_decalage.mjs | code 0 | | | |
| run/check_nohardcode.mjs | OK (7 fichiers, 42 familles) | | | |
| run/mesure_monotonie.mjs --detectors --guard | code 0, aucune baisse sur 6 442 cas | | | |
| security_review2/tests r01 à r05 | 5 / 5 passent (code 0) | | | voir C3 |
| demo_reelle/classifieur/relay.test.mjs | 9 / 9 | | | |
| demo_reelle/reponse/test/incident.test.mjs | 7 / 7 | | | |
| demo_reelle/reponse/test/anchor.test.mjs | 2 / 3, 1 sauté | nœud local absent (127.0.0.1:8549) | | sauté, normal |
| demo_reelle/reponse/test/matrix.test.mjs | **8 / 9** | test juste, données périmées (voir B3) | Titouan (personne n'est sur demo_reelle) | diff séparé, partie B3 |
| demo_reelle/reponse/test/revoke.test.mjs | non lancé | exige `ethers` (blockchain/node_modules absent) | | sauté |
| demo_reelle/rpc_garde/test/proxy.test.mjs | non lancé | exige `ethers` | | sauté |
| demo_reelle/lab/server/test/lab.test.mjs | non lancé | exige `ethers` | | sauté |
| demo_reelle/site_echange/test/*.mjs | non lancé | exige un nœud local | | sauté |
| docs/demo | pas de test. `serve_static.mjs` démarre, sert `index.html` et `data.json`, refuse `..` | | | page marquée PÉRIMÉ |
| extension/tests/run_tests.mjs (CDP) | non lancé | exige un vrai Chrome | | sauté |

## 2. Échecs : détail

### B1. Le build autonome ne copie pas `revoke.js` (bloquant)

- Fait : `extension/gatekeeper.js` ligne 12 importe `./revoke.js`. C'est committé dans HEAD depuis 10:13.
- `extension_standalone/build_standalone.mjs` ligne 46 : la liste des fichiers copiés ne contient pas `revoke.js`.
- Effet : `run_tests.mjs` reconstruit, puis plante sur `ERR_MODULE_NOT_FOUND ... extension_standalone/extension/revoke.js`.
- Effet produit : le prochain build livré aura un `gatekeeper.js` qui ne se charge pas. L'extension autonome ne marcherait plus du tout.
- Le build committé aujourd'hui est encore l'ancien (sans l'import), donc il marche, mais il est en retard sur les sources.
- Second défaut, révélé une fois `revoke.js` ajouté : `revoke.test.mjs` ligne 11 et `revoke_branchement.test.mjs` ligne 12 cherchent le moteur dans `DIR/../engine/src`. Rejoués sur le dossier construit (`HOLDUP_DIR`), ce chemin n'existe pas. Les deux fichiers échouent au chargement.
- Correctif : ajouter `'revoke.js'` à la liste (agent d'Adem) ; dans les deux tests, charger le moteur de référence par `new URL('../../../engine/src/...', import.meta.url)` (agent revoke/sync).
- Vérifié sur une copie : 44 / 44 contrôles de `run_tests.mjs`, et 25 / 25 et 13 / 13 en mode source et en mode build.
- Ensuite : reconstruire `extension/` et `extension_sans_reseau/` (`node build_standalone.mjs` et `--no-network`) et committer.

### B2. `evaluate_plus.test.mjs` ligne 52 : test périmé

- Message : `jury-fp-089 : la chaine rejouee (ok) doit valoir le verdict du produit (warn)`.
- Cause : le commit 1cf2086 (« F31 en attention ») fait passer l'affichage du serveur de info à warn pour F31 et F36 (`server/server.mjs` lignes 470 à 472). Le niveau du moteur reste dans `niveau_moteur` (ligne 501).
- La chaîne rejouée du pipeline (`plus.base`) suit le moteur, pas l'affichage. Elle vaut donc `ok`, le produit affiche `warn`.
- Ce n'est pas un bug du produit. Le test compare deux choses différentes. La garantie forte (« plus » jamais sous le produit affiché, ligne 51) passe toujours.
- Même échec sur HEAD pur, donc indépendant des travaux en cours sur `run/policy.mjs`.
- Correctif : comparer `plus.base` à `niveau_moteur` quand il existe. Vérifié : 14 / 14, sur HEAD et sur la copie de travail.

### B3. `demo_reelle/reponse/matrix.json` : F34 à F42 sans famille

- Message : `F34 is in 0 families`. Le test exige que chaque fiche de `U_textes_utilisateur.json` ait une famille.
- Cause : le commit 1cf2086 a ajouté les fiches F34 à F42. `matrix.json` n'a pas suivi.
- Correctif proposé (choix de fond, à valider par Titouan) :
  - F34 (droit exact), F37 (droit illimité à un programme connu) : `spending_right`
  - F35 (signature à montant précis), F40 (ordre déguisé en message), F41 (texte qui donne des fonds) : `offchain_signature`
  - F39 (adresse qui ressemble un peu) : `recipient`
  - F36 (jeton non reconnu), F38 (échange) : `trade`
  - F42 (message sans montant ni destinataire) : `unverified`, à côté de F26
- Vérifié : matrix 9 / 9, incident 7 / 7.

## 3. Bugs trouvés par lecture

| Id | Fichier et ligne | Constat | Propriétaire | Correctif |
|---|---|---|---|---|
| C1 | `scripts/verifier_installation.mjs` ligne 55 | La suite « build autonome » ne restaure que `out/RESULTATS.*`. Or `run_tests.mjs` réécrit les dossiers suivis `extension_standalone/extension/` et `extension_sans_reseau/`. `INSTALLATION.md` section 7 promet que le script « les remet comme avant ». Avec B1, un simple `node scripts/verifier_installation.mjs` laisse un build livré cassé dans le clone. | Titouan | Ajouter ces deux dossiers à `restaure` (lecture récursive avant, réécriture après), ou faire construire `run_tests.mjs` dans un dossier temporaire. |
| C2 | `webdemo/tests/run_webdemo_tests.mjs` | Le lancer réécrit des fichiers suivis : `webdemo/BUILD_INFO.json`, `webdemo/engine/*`, `webdemo/out/RESULTATS.json`. Rien ne le dit, rien ne restaure. | agent revoke/sync | Le dire dans `README_WEBDEMO_FR.md`, ou restaurer en fin de test. |
| C3 | `README.md` ligne 75 et `security_review2/REVUE.md` ligne 36 | Disent que les tests de la revue échouent tant que les failles restent (r04 « Échoue »). Les 5 passent aujourd'hui. | Titouan | Mettre à jour. Garder la nuance : r04 accepte « unknown », et `funds_out` reste faux pour `transfer` avec 1 ETH joint. |
| C4 | `webdemo/README_WEBDEMO_FR.md` ligne 74 | « 81 vérifications ». Il y en a 135. | agent revoke/sync | Remplacer par 135, ou ne plus citer de nombre. |
| C5 | `livrables/QR_JURY.md` ligne 34, `livrables/CHIFFRES.md` ligne 34 (A18) | « Le branchement dans l'extension reste à faire » et « Non branché dans l'extension ». Depuis 10:13, `gatekeeper.js` importe `revoke.js` et `revoke_branchement.test.mjs` (13 tests) existe. | agent pitch | À revoir une fois B1 réglé et le branchement vérifié dans un vrai Chrome. |
| C6 | `essai_reel/PROTOCOLE_V2.md` ligne 39 | Dit `site_echange/addresses.local.json` « périmé ». Le fichier n'existe pas (ignoré par git). Ligne 525 : la page 9 scénarios dit encore « Hold up ». | Titouan | Écrire « absent, créé par le déploiement ». |
| C7 | `livrables/INSTALLATION.md` ligne 87 | `tests/static_check.mjs` sans dossier. Le vrai chemin est `research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs`. | agent pitch | Mettre le chemin complet. |
| C8 | `redteam/V2_DEV_norm.jsonl` (21 Mo, ignoré par `*.jsonl`) | Lu par `pipeline/test/evaluate_plus.test.mjs`, `monotone_pipeline.test.mjs`, `engine/test/monotonie.test.mjs`, `run/mesure_monotonie.mjs`. Sur un clone neuf, ces tests plantent tant que `node scripts/verifier_installation.mjs --donnees` n'a pas tourné. Le README ne le dit que pour `cchain_sample.jsonl`. | Titouan | Une ligne dans le README, section Tests. |
| C9 | `docs/demo/serve_static.mjs` ligne 13 | Garde `file.startsWith(root)` : un dossier frère au nom préfixe (`banc2`) passerait. Sans risque réel (127.0.0.1, page périmée). | Titouan | `startsWith(root + sep)`. Faible. |

Liens et chemins vérifiés sans défaut : `README.md`, `docs/INDEX.md`, `docs/demo/banc/README.md`, `webdemo/README_WEBDEMO_FR.md`. Toutes les commandes `npm run ...` citées existent (racine ou `blockchain/`). `webdemo/index.html`, `limites.html` et `js/*.js` : aucune référence locale cassée, aucun appel externe. `docs/demo/banc/index.html` charge Google Fonts.

Nombres de tests cités et vérifiés : 25 (revoke) juste, 135 (webdemo) juste, 7 (journal_chain) juste, 13 (revoke_branchement) juste, 15 (rpc_garde, compte statique) juste, 23 (reponse) cohérent avec ce qui a pu tourner. Seul faux : 81 (C4).

## 4. Fichiers lourds et secrets

- Fichiers suivis de plus de 20 Mo : `blind_adem/v2/V2_DEV.jsonl` (20,4 Mo) et `scenarios_export/scenarios.json` (26,8 Mo). Sous la limite GitHub de 100 Mo, mais à surveiller. `.git` pèse 116 Mo.
- `.env`, `.env.bedrock`, `blockchain/.env`, `app/intent/.env` : ignorés par git. Aucun `.env` réel suivi. Seuls des `.env.example` le sont. Je n'ai lu aucun `.env`.
- Motifs `0x` + 64 hex dans les fichiers suivis hors tests : 26 fichiers. Tous sont des constantes publiques (topics d'événements, emplacements EIP-1967, clé de conduit OpenSea, hachages de transactions publiques, racine de journal). Aucun n'est affecté à un nom de clé privée.
- Jetons Cloudflare : deux occurrences, toutes deux des valeurs factices de test (`demo_reelle/classifieur/relay.test.mjs` ligne 10, `extension_standalone/tests/e2e/window_flow.mjs` ligne 44).

## 5. Effet de bord de la passe (à savoir)

Lancer `run_tests.mjs`, `run_webdemo_tests.mjs` et `server.test.mjs` a réécrit 25 fichiers suivis (build autonome, webdemo, `server/test/results.json`). Ils étaient propres avant la passe et personne d'autre ne les avait touchés. Je les ai remis à l'état de HEAD aussitôt (`git checkout` de ces 25 fichiers seulement). Le `server/test/results.json` modifié visible maintenant date de 10:13, c'est la fusion d'un autre agent. Les tests corrigés ont ensuite tourné sur des copies dans un dossier temporaire, jamais dans le dépôt.

## 6. Appliquer les correctifs

Quand les propriétaires auront fini :

```
cd research/titouan/T_banc_e2e
git apply qa/corrections_proposees.diff      # B1 (build + 2 tests revoke) et B2 (pipeline)
cd ../../..
git apply research/titouan/T_banc_e2e/qa/corrections_demo_reelle.diff   # B3 (matrix.json)
```

Les deux passent `git apply --check` à 10:14. `revoke_branchement.test.mjs` n'est pas encore suivi par git : si l'agent revoke/sync le modifie, refaire le diff. Après B1, reconstruire le build autonome et le committer.

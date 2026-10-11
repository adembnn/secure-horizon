# Renommage Sentinelle vers Hold up : ce qui reste dans le périmètre d'Adem

11 oct. 2026. Rédigé par l'agent de renommage de Titouan. Rien n'a été modifié dans ces dossiers après la répartition MSG-075.
Périmètre d'Adem : `T_banc_e2e\extension\`, `extension_standalone\`, `engine\`, `run\`, `pipeline\`, `detectors_adem\`, `preuves\`, `docs\design\system\`, `research\demo_reelle\`.
Chemins ci-dessous relatifs à `research/titouan/T_banc_e2e/` sauf mention.

## 0. Déjà fait AVANT la répartition (committé par le coordinateur dans 2d2c259, à relire)

| Fichier | Changement | Vérifié |
|---|---|---|
| `pipeline/evaluate_plus.mjs` l. 21, 235, 471-484 | Lecture prioritaire `HOLDUP_RPC_URL`, `HOLDUP_LIVE`, `HOLDUP_LIVE_BUDGET_MS` ; repli sur `SENTINELLE_RPC_URL`, `SENTINELLE_LIVE`, `SENTINELLE_LIVE_BUDGET_MS` (commentaire « ancien nom ») | node --check ; pipeline/test 21/21 ; server.test et presentation.test verts ; check_nohardcode OK |
| `detectors_adem/sim_events.mjs` l. 7, 35 ; `token_guard.mjs` l. 6, 55 ; `fork_sim.mjs` l. 3, 6 | `HOLDUP_FORK_RPC` puis repli `SENTINELLE_FORK_RPC` ; `HOLDUP_SIM_RPC` puis repli `SENTINELLE_RPC` (pas `HOLDUP_RPC` : trop proche de `HOLDUP_RPC_URL` et `HOLDUP_RPC_PORT`) | node --check ; tests pipeline verts |
| `detectors_adem/test/fork_test.mjs` l. 7, 78-80 | Passe `HOLDUP_FORK_RPC` ; la passe « sans fork » vide les deux noms | node --check (non lancé : il faut un nœud fork) |
| `engine/package.json` | `"name": "holdup-effects-engine"` (était `sentinelle-effects-engine`, cité nulle part ailleurs hors copies figées) | JSON valide |
| Textes `.md` : `pipeline/RESULTATS_INTEGRATION.md`, `extension_standalone/out/ECARTS.md`, `run/out/public/MESURE_001.md`, `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md`, `research/demo_reelle/*.md` | « Sentinelle » remplacé par « Hold up » dans le texte lisible seulement | relu au diff |

Si tu préfères annuler un de ces points : `git show 2d2c259 -- <fichier>` montre le diff exact.

## 1. Protocole page vers extension (à changer en bloc, sinon l'extension casse)

| Fichier, ligne | Texte actuel | Proposé | Risque |
|---|---|---|---|
| `extension/inject.js:114` | `postMsg({ __sentinelle: 'hello', ... })` | `__holdup: 'hello'` | ÉLEVÉ : inject et bridge doivent changer ensemble, sinon plus aucune poignée de main |
| `extension/bridge.js:17` | `d.__sentinelle !== 'hello'` | `d.__holdup !== 'hello'` | idem |
| `extension/bridge.js:163` | `host.setAttribute('data-sentinelle', '')` | `data-holdup` | moyen : sélecteurs de tests |
| `extension/tests/run_tests.mjs:300` | `querySelectorAll('[data-sentinelle]')` | `[data-holdup]` | à changer avec bridge.js |
| `extension/tests/unit/decisions.test.mjs:85, 400` | `data.__sentinelle !== 'hello'` | `__holdup` | idem |
| `extension/tests/unit/inject.test.mjs:29` | idem | `__holdup` | idem |
| `extension/tests/unit/securite_page.mjs:27` | idem | `__holdup` | idem |
| `security_review/tests/harness_inject.mjs:18` (périmètre Titouan, mais lié) | `msg.__sentinelle === 'hello'` | `__holdup` | à faire dans le même lot |
| `extension_standalone/extension*/bridge.js`, `inject.js` | copies générées | régénérer par `build_standalone.mjs` | ne pas éditer à la main |

Ensuite : tests `extension/tests/unit` fichier par fichier, `extension/tests/run_tests.mjs`, build autonome, `static_check.mjs`, puis zips.

## 2. Nom de fichier `sentinelle_core.js`

Proposé : `holdup_core.js` (pas `hold_core.js`, déjà pris dans `extension_sans_reseau/`). Tous ces endroits doivent changer dans le même commit :

| Fichier, ligne | Texte actuel | Risque |
|---|---|---|
| `extension_standalone/src/sentinelle_core.js` | le fichier lui-même (`git mv`) | ÉLEVÉ |
| `extension_standalone/src/background.js:6` | `from './engine/sentinelle_core.js'` | import cassé si oublié |
| `extension_standalone/build_standalone.mjs:3, 86` | commentaire et `put('engine/sentinelle_core.js', src(... 'sentinelle_core.js'))` | build cassé |
| `extension_standalone/tests/run_tests.mjs:67, 292, 293` | chemins `engine/sentinelle_core.js`, `src/sentinelle_core.js` | tests cassés |
| `extension_standalone/tests/static_check.mjs:107, 135` | `join(EXT, 'engine', 'sentinelle_core.js')` | contrôle statique cassé |
| `extension/tests/unit/decisions.test.mjs:19` | `join(process.env.HOLDUP_ENGINE, 'engine', 'sentinelle_core.js')` | test cassé |
| `extension/tests/unit/comportement.test.mjs:577` | `join(DIR, '..', 'extension_standalone', 'src', 'sentinelle_core.js')` | test cassé |
| `preuves/exhaustivite/essais/harnais.mjs:2, 14, 21` | `engine/sentinelle_core.js` | harnais cassé |
| Hors périmètre Adem, à faire en même temps (Titouan) : `webdemo/build_webdemo.mjs:5, 71, 72, 95, 119`, `webdemo/js/engine_api.js:1, 3`, `webdemo/tests/run_webdemo_tests.mjs:42, 44, 45`, `webdemo/engine/sentinelle_core.js`, `server/sync_presentation.mjs:4, 23`, `parite/run_parite.mjs:1, 23, 151`, `banc_realiste/run_realiste.mjs:21`, `security_review2/tests/r04_real_engine_value.mjs:2`, `r05_engine_dos.mjs:2`, `redteam/check_product.mjs:21`, `ui_holdup/check_ui.mjs:156`, `ui_holdup/UI_CONTRAT.md:32, 99`, `W_livrables/README_DRAFT.md:117` | | coordination nécessaire |
| Clé `patches_sentinelle_core` dans `webdemo/BUILD_INFO.json` et `run_webdemo_tests.mjs:44` | `patches_holdup_core` | à changer ensemble |

## 3. Nom de moteur affiché dans les verdicts

| Fichier, ligne | Texte actuel | Proposé | Risque |
|---|---|---|---|
| `extension_standalone/src/sentinelle_core.js:11` | `ENGINE_NAME = 'sentinelle-embarque'` | `'holdup-embarque'` | moyen : vérifier qu'aucun test ni journal ne compare cette valeur |
| `pipeline/evaluate_plus.mjs:279, 302` | `engine: 'sentinelle-local'` | `'holdup-local'` | moyen : doit rester égal à `server/server.mjs:442, 483` et `webdemo/engine` (parité octet pour octet) |

## 4. Commentaires dans `engine/vendor/*.ts`

| Fichier, ligne | Texte actuel | Proposé | Risque |
|---|---|---|---|
| `engine/vendor/compare.ts:2`, `index.ts:2, 5`, `server.ts:2, 283`, `types.ts:2` | `Sentinelle Intent Barrier`, `@module @sentinelle/intent` | `Hold up Intent Barrier` | moyen : `compare.ts` entre dans `rulesHash` et `codeHash` (`run/run_loop.mjs:242-243`, `run/reg_public.mjs:193-194`). Un commentaire change le hash des mesures publiées. À faire seulement avec une nouvelle mesure. La source `app/intent/src/` a déjà été renommée (commentaires et message console seulement). |

## 5. Variables d'environnement restantes

| Fichier, ligne | Texte actuel | Proposé | Risque |
|---|---|---|---|
| `research/demo_reelle/chain/lookalike.mjs:162` | `A pointer avec SENTINELLE_CONTEXT` | `A pointer avec HOLDUP_CONTEXT (ancien nom SENTINELLE_CONTEXT)` | faible, mais seulement APRÈS que `server/server.mjs` lise `HOLDUP_CONTEXT` |
| `research/demo_reelle/chain/README.md:63` | `SENTINELLE_CONTEXT=...` | idem | idem |

## 6. À ne pas renommer

`run/out/`, `engine/out/`, `extension_standalone/out/*.json`, `BUILD_INFO.json` : sorties générées. `*.jsonl` : jeux de cas. `boucle/base`, `boucle/work`, `pipeline/grille/snapshot` : copies figées.

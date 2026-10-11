# Pour Adem : corrections dans ton périmètre (non appliquées)

11 oct. 2026, passe de corrections QA. Titouan ne touche pas à tes dossiers. Voici ce qui reste à faire chez toi.

## 1. C8 : message clair quand `redteam/V2_DEV_norm.jsonl` manque

Constat. `redteam/V2_DEV_norm.jsonl` (21 Mo) est ignoré par git (`*.jsonl`). Sur un clone neuf, ces fichiers plantent avec un `ENOENT` brut :
- `run/mesure_monotonie.mjs` ligne 18 (et donc `engine/test/monotonie.test.mjs`, qui l'importe ligne 12)
- `pipeline/test/evaluate_plus.test.mjs` ligne 26 (fonction `sample`)
- `pipeline/test/monotone_pipeline.test.mjs` ligne 17 (`readCases`)

Correctif. Le diff est prêt : `research/titouan/T_banc_e2e/qa/c8_pour_adem.diff`. Il ajoute un test `existsSync` avant chaque lecture et lève une erreur qui donne la commande :

```
redteam/V2_DEV_norm.jsonl manque (fichier généré, ignoré par git). Lancer, depuis research/titouan/T_banc_e2e : node redteam/normalize_v2.mjs blind_adem/v2/V2_DEV.jsonl redteam/V2_DEV_norm.jsonl (ou, depuis la racine du dépôt : node scripts/verifier_installation.mjs --donnees)
```

Pour `attacks_public/PUBLIC.jsonl`, le message donne `node attacks_public/gen_public.mjs`.

Appliquer, depuis la racine du dépôt :

```
git apply research/titouan/T_banc_e2e/qa/c8_pour_adem.diff
```

Vérifié le 11 oct. vers 10 h 50 : `git apply --check` passe sur l'état du dépôt, et `node --check` passe sur les trois fichiers modifiés (copies). Le message n'a pas été déclenché en vrai : il faudrait retirer le fichier de 21 Mo.

Déjà fait côté documentation (périmètre Titouan) : `README.md` section Tests, `livrables/INSTALLATION.md` sections 6 et 7, `redteam/README.md`.

## 2. r04 de la revue de sécurité échoue (moteur embarqué)

Constat, relancé le 11 oct. vers 10 h 40 : `node security_review2/tests/r04_real_engine_value.mjs` sort en code 1. Dans `extension_standalone/extension/engine/sentinelle_core.js`, un `transfer(...)` qui joint 1 ETH donne « attention », comme sans valeur (`funds_out` vrai, aucun code). La QA de 10 h l'avait vu passer : soit le build a changé depuis, soit l'état n'était pas le même.

Ce que le test attend : « danger » ou « unknown ». Attention, « unknown » ferait passer le test sans que l'ETH joint soit vu. Le correctif utile est un code dédié (valeur native jointe à un appel de jeton) qui monte au moins à « danger ».

Le contrôle écrit (`written_check.js`) attrape déjà ce cas : r02 et r03 passent (« ne correspond pas »).

## 3. Rappel : B1 et B2 du rapport QA

`qa/corrections_proposees.diff` (build autonome et `evaluate_plus.test.mjs`) reste à vérifier contre l'état actuel. Le build autonome passe aujourd'hui 44 / 44 (commit 45f0f0b), donc B1 semble réglé chez toi. Refaire `git apply --check` avant d'appliquer quoi que ce soit.

## 4. Exception `.gitignore` pour le journal d'exemple de l'audit (11 oct., vers 11 h)

Constat. `.gitignore` ligne 23 (`*.jsonl`) ignore `research/demo_reelle/audit/sample/journal.jsonl` (vérifié : `git check-ignore -v` répond `.gitignore:23:*.jsonl`). Sur un clone, ce fichier n'existe pas : la commande d'audit citée dans `livrables/SLIDE_CONFORMITE.md` (`verify_decision.mjs --journal ...`) échoue. Les requêtes d'exemple (`sample/requests/*.json`) et `make_sample_journal.mjs` sont suivis, le journal non.

Correctif proposé (deux possibilités, à toi de choisir, Titouan ne touche pas à `.gitignore`) :
- ajouter sous les exceptions existantes : `!research/demo_reelle/audit/sample/journal.jsonl`, puis régénérer le journal (`node research/demo_reelle/audit/make_sample_journal.mjs`) et le commiter ;
- ou ne rien changer et écrire dans le README de l'audit qu'il faut lancer `make_sample_journal.mjs` d'abord.

Le fichier ne contient que des décisions sur les six requêtes synthétiques du dossier : aucune donnée réelle, aucun secret. À vérifier avant de commiter.

## 5. Ce qu'il reste à pousser de ton côté (état lu à 11 h, `git status`)

- `research/titouan/T_banc_e2e/extension/journal_chain.js`, `gatekeeper.js`, `tests/unit/journal_champs.test.mjs`, `tools/gen_rules_fingerprint.mjs` : modifiés ou nouveaux, non commités. `node --test tests/unit/journal_champs.test.mjs` passe (6 sur 6, lancé depuis `extension/`).
- Les champs `by`, `limited`, `rules` ne sont pas encore dans le build livré : `extension_standalone/extension/journal_chain.js` ne contient aucun `limited`. Tant qu'ils n'y sont pas, nos livrables les écrivent « en cours d'ajout ».
- `research/titouan/T_banc_e2e/engine/out/cchain_all.json` : modifié, non commité (sortie générée ; à commiter ou à remettre, selon toi).
- Le correctif C8 (section 1) et l'exception `.gitignore` (section 4), si tu les retiens.

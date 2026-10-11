# Retouches à faire par les autres propriétaires

## 1. Copies embarquées du bloc PRESENTATION (extension_standalone, webdemo)
Qui : le propriétaire de extension_standalone et celui de webdemo.
1. `node server/sync_presentation.mjs` (sans option : dit ce qui dérive, ne change rien).
2. `node server/sync_presentation.mjs --write` : recopie le bloc et applique les 2 retouches de `evaluate()` (niveau affiché, `niveau_moteur`).
3. `node extension_standalone/build_standalone.mjs` puis ses tests ; `node webdemo/build_webdemo.mjs` puis `node webdemo/tests/run_webdemo_tests.mjs`. Ces builds recopient `U_textes_utilisateur.json` (nouvelles fiches F34 à F42, variables `duree` et `recu`). Sans le JSON à jour, F02, F30 et les nouvelles fiches s'affichent mal.
Le test « bloc identique octet pour octet » de extension_standalone passe après l'étape 2.

## 2. pipeline/evaluate_plus.mjs (fonction render)
`render()` appelle `D.present(...)` et lit `niveau` localement. Pas de changement obligatoire : `render` ne sert qu'aux niveaux warn et critical, où le niveau affiché ne change pas. Si un jour elle reçoit un niveau info, ajouter `niveau = pres.niveau || niveau` après l'appel.

## 3. Interfaces (extension, webdemo)
Elles affichent d'après `niveau`. F31 sort maintenant avec `level: attention`, `niveau: warn`, `niveau_moteur: info`. Rien à faire si elles lisent `niveau`. Les mesures qui comptent les alertes par `niveau` verront ces cas passer de info à warn (voir RAPPORT_TEXTES.md).

## 4. Moteur (engine/src), à propos
Les approbations n'ont pas de `symbol` : la présentation lit une table de 4 jetons (USDC, USDT, DAI, WETH). Pour nommer d'autres jetons, `buildEffects` devrait ajouter `symbol` aux entrées `approvals`.

# Brief commun aux attaquants red team (en continu)

Tu joues un attaquant ou un juré qui veut CASSER Sentinelle, une barrière d'intention qui avertit avant une signature crypto piégée.

- **Boîte noire.** INTERDIT de lire `engine/`, `run/`, `detectors_adem/` et `vendor_t103/`. Ton seul outil : `node "C:\Users\Adem\Secure Horizon\research\titouan\T_banc_e2e\redteam\check.mjs" <fichier.jsonl>`, qui renvoie `level_final` (critical, warn ou ok) pour chaque cas. Le format des cas est décrit dans `redteam/README.md`, `attacks/README.md` (section Schema) et `docs/intent-barrier.md` ; un exemple se trouve dans `redteam/exemple.jsonl`.
- **Volume.** Ne fabrique pas 60 cas à la main. Écris un GÉNÉRATEUR/FUZZER (Node, ethers v6 importé par chemin absolu `C:\Users\Adem\Secure Horizon\blockchain\node_modules\ethers\lib.esm\index.js`) qui produit des centaines à des milliers de variantes, les passe dans `check.mjs` par lots, garde les contournements, puis mute AUTOUR des contournements trouvés. Vise au moins 2 000 attaques testées.
- **Contournement.** Pour un malveillant, c'est un `level_final` différent de `critical`. Pour un bénin, c'est un `critical` (fausse alerte).
- **Avant de commencer**, lis `redteam/BYPASS_REGISTRY.md` s'il existe, pour ne pas refaire ce qui est déjà trouvé et pour muter autour.
- **Livrables, dans `redteam/`** :
  - `jury_<ton_nom>.jsonl` : uniquement les contournements, dédupliqués, avec `label`, `expected_severity`, `bypass: true` et un champ `technique` ;
  - `jury_<ton_nom>.md` : chaque technique de contournement en 3 lignes (l'attaque, le verdict obtenu, la raison probable vue de l'extérieur), avec le nombre de variantes qui passent sur le nombre testé ;
  - une ligne ajoutée à la fin de `redteam/BYPASS_REGISTRY.md` pour chaque nouvelle technique, au format `| agent | technique | n_pass/n_test | exemple id |`.
- **Contraintes.** Tout est synthétique. Aucune clé réelle, aucun secret, aucune adresse de victime réelle. Surtout Avalanche C-Chain 43114 et Fuji 43113. Pas de git commit.
- **Réponse finale** : nombre testé, nombre de contournements, les 3 pires techniques.

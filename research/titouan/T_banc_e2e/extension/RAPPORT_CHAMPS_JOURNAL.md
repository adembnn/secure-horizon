# Journal chaîné : champs by, limited, rules

Patch rapide du 11 octobre, fait à la place d'Adem (absent) avec l'accord de Titouan.

## Ce qui est fait

Chaque nouvelle ligne du journal chaîné porte trois champs de plus. Ils entrent dans le hachage.

- `by` dit qui a fait passer la demande.
  - `humain` : la personne a cliqué Continuer ou Annuler, a écrit sa réponse, ou a fermé la fenêtre ou l'onglet.
  - `auto` : rien n'a été cliqué. Exemples : la deuxième demande d'une opération déjà couverte, l'envoi seul après « Ça correspond », une expiration, un verdict calculé.
  - `holdup` : la demande vient de Hold up. Exemples : une révocation, un verdict où Hold up a limité le droit.
  - Avant, la chaîne ne savait pas faire la différence. Un passage automatique y ressemblait à une confirmation humaine. C'est corrigé.
- `limited` vaut par exemple `USDC:50` quand Hold up a limité un droit illimité au montant écrit (Q17). Il est absent sinon. Il ne contient jamais d'adresse ni la phrase : un filtre refuse tout le reste.
- `rules` vaut la version du build, puis `+`, puis une empreinte de 12 caractères hexadécimaux. Exemple : `0.2.0+730eb9de305f`.

L'empreinte est calculée sans fetch, car la CSP du build autonome bloque tout réseau (`connect-src 'none'` ou le seul relais). Elle est écrite à l'avance dans une constante de `journal_chain.js`. Une ligne marquée `@RULES_FINGERPRINT@` la contient. C'est le SHA-256 de la liste triée « chemin:sha256 » de 26 fichiers de règles : `engine/src/*.mjs` (sauf `rpc.mjs` et `audit_selectors.mjs`), `engine/vendor/compare.ts`, `run/policy.mjs`, `extension_standalone/src/sentinelle_core.js`, et `written_check`, `intent_text`, `keyword_intent`, `outcome`, `effect_sim`, `hold_core` et `revoke` de l'extension. Les fins de ligne sont ramenées à LF : même empreinte sous Windows et sous Linux.

Compatibilité. Une ligne sans aucun des trois champs est hachée à l'ancienne. Les anciens exports restent donc vérifiables, et une chaîne peut mêler anciennes et nouvelles lignes. Retirer les trois champs d'une nouvelle ligne casse la chaîne. En ajouter un à une ancienne ligne aussi.

`tools/verify_journal.mjs` affiche maintenant qui a fait passer les demandes, les droits limités, les versions de règles et le nombre de lignes au format ancien.

## Fichiers touchés

- `extension/journal_chain.js` : `byOf`, `limitedOf`, `rulesTag`, la constante `RULES_FINGERPRINT`, `canonical` au format 2 et `verifyChain` qui lit les deux formats.
- `extension/gatekeeper.js` : seulement la partie journal. La ligne de confirmation porte `actor` et `limited`, la ligne de verdict porte `limited`, `same_intent` est marqué `auto`, et `chainAppend` reçoit `rules`. `createGatekeeper` accepte aussi l'option `rulesFingerprint`.
- `extension/tools/verify_journal.mjs` : affichage des nouveaux champs.
- `extension/tools/gen_rules_fingerprint.mjs` : nouveau. Il calcule l'empreinte et réécrit la ligne marquée.
- `extension/tests/unit/journal_chain.test.mjs` (ajusté) et `journal_champs.test.mjs` (nouveau, 8 tests).

## Tests

- Avant le patch, 125 tests sur les 12 fichiers demandés : tous verts.
- Après le patch, 133 tests sur 13 fichiers (les 12 plus `journal_champs`) : tous verts. Sont aussi verts `comportement` (25), `revoke` (25), `hold_core` (14) et `sidepanel` (8).
- Les nouveaux tests vérifient ceci :
  - les trois champs sont présents ;
  - changer `by`, `limited` ou `rules` casse la chaîne ;
  - les anciennes lignes restent valides ;
  - aucune phrase ni adresse n'apparaît ;
  - via le gatekeeper, l'envoi seul donne `auto`, un clic donne `humain` et le droit limité donne `USDC:50` ;
  - l'empreinte est stable si rien ne change et change dès qu'un fichier de règles change (testé sur une copie temporaire) ;
  - l'empreinte écrite dans `journal_chain.js` est à jour.

## Ce qu'il reste à faire (Adem ou Titouan)

1. Lancer **avant chaque build final** : `node extension/tools/gen_rules_fingerprint.mjs`. La commande met à jour la constante de `journal_chain.js`. Le test `journal_champs` échoue si l'empreinte n'est plus à jour.
2. Proposition pour Adem : ajouter une ligne au début de `build_standalone.mjs` qui lance ce calcul avant la copie : `(await import('../extension/tools/gen_rules_fingerprint.mjs')).writeFingerprint(ROOT);`.
3. Reconstruire les builds et le zip. Je ne l'ai pas fait. Aucun changement de build n'est requis : `journal_chain.js` est déjà copié.
4. Avec `HOLDUP_DIR` pointé sur un ancien build, le test `journal_champs` échoue tant que ce build n'est pas refait.

Note. La consigne prévoyait un module `rules_fingerprint.js` à part, plus un mot à ajouter dans la liste de copie de `build_standalone.mjs`. L'édition de `build_standalone.mjs` a été refusée par les permissions. Or un import statique d'un module absent du build empêcherait le service worker de démarrer. La constante a donc été placée dans `journal_chain.js`, qui est déjà copié, et aucun build ne peut casser.

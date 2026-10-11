# Révocation et équivalence serveur / autonome (11/10/2026)

Le périmètre a changé en cours de route (décisions D-015 / D-016). Je n'ai pas touché à `ui/`, au manifeste, à `build_standalone.mjs`, aux tests du build ni au zip. Aucun commit.

## 1. Révocation branchée côté JS

- `gatekeeper.js` : après « continue », le droit accordé est calculé avec `revoke.js` et gardé dans `storage.session` (`hu:grant:<onglet>`, cinq au plus). Jamais dans `local`. Effacé à la fermeture de l'onglet. Badge `1` sur l'icône.
- Messages `hu.revoke.get`, `hu.revoke.send`, `hu.revoke.check`. Acceptés seulement depuis le panneau latéral. Un message qui porte une demande (`params`, `to`, `data`, `from`...) est refusé.
- Seuls les cas « une transaction suffit » partent du panneau. Un Permit signé hors chaîne n'a jamais de bouton « Révoquer ce droit ».
- `bridge.js` relaie vers `inject.js`. Il refuse si l'onglet a changé de site.
- `inject.js` appelle la méthode d'origine du portefeuille, pas l'enveloppe. Pas de nouvelle question, pas de boucle. Hold up ne signe jamais.
- La marque : un jeton du service worker, usage unique, 8 s, lié à l'onglet, au cadre et à l'empreinte du contenu. Il ne sert que si le portefeuille repasse plus tard par une méthode enveloppée. Un jeton inventé, réutilisé, tardif, d'un autre onglet ou pour un autre contenu est ignoré. La page ne peut ni le voir ni l'ajouter.
- Journal chaîné : ligne `revocation`, sans adresse.
- Limite : pendant 8 s, la page peut renvoyer exactement la même demande de retrait. Elle passe une fois. Elle ne fait que remettre le droit à zéro.

L'écran est décrit pour Adem dans `REVOKE_BRANCHEMENT.md`, section 10 : bouton, textes (dont « le portefeuille affichera le nom du site » et « un Permit ne se révoque pas toujours en un clic »), états après la réponse, tests à ajouter.

Tests : `tests/unit/revoke_branchement.test.mjs`, 13 tests. Suite unitaire de l'extension : 190 / 190, dont les contrôles statiques S1 sur `inject.js`.

## 2. Point bloquant pour le build autonome

`build_standalone.mjs` ne copie pas `revoke.js` (liste ligne 46). `gatekeeper.js` l'importe maintenant. Sans cet ajout, le service worker du build autonome ne se charge plus. C'est au propriétaire du build (agent d'Adem) d'ajouter `'revoke.js'` à la liste.

## 3. Équivalence serveur / autonome

- Cause principale trouvée et corrigée dans `extension_standalone/src/sentinelle_core.js` : `const niveau` au lieu de `let niveau`. La retouche F31 levait une exception sur chaque envoi vers une adresse nouvelle.
- Reste : le build date de 10:00, `run/policy.mjs` a changé à 10:03 (règle F43 SIWE). Écart de build, pas du moteur.
- Simulation hors dépôt (core corrigé, moteur actuel converti comme le build) : requêtes types 132 / 132, DEV 1540 / 1540, PUBLIC 576 / 576.
- Détail : `extension_standalone/out/ECARTS.md`.
- `sync_presentation.mjs` : les deux copies sont à jour.

## 4. Webdemo

`sync_presentation.mjs --write` puis `build_webdemo.mjs` : 22 fichiers, arbre `098635489637d46a`. Tests : 135 / 135. Verdicts identiques au serveur : 113 / 113, PUBLIC 144 / 144.

## 5. Zip

Non reconstruit, sur consigne. Pas de SHA-256 à donner.

## 6. Resynchronisation finale à relancer

`engine/RAPPORT_FAMILLES.md` est absent : l'autre agent n'a pas fini sur le moteur. À la fin, il faut relancer le build autonome, la comparaison serveur / autonome, puis `build_webdemo.mjs` et ses tests.

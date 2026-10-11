# Écarts serveur / autonome (11/10/2026)

Mesure : `evaluate()` de `server/server.mjs` contre `engine/sentinelle_core.js` du build autonome. Même comparaison que la section D3 de `tests/run_tests.mjs` : requêtes types, DEV, PUBLIC, quatre variantes d'intention, tout le verdict sauf le nom du moteur et les latences.

## Ce qui a été trouvé

1. **Bug dans `src/sentinelle_core.js`, corrigé.** `niveau` était déclaré `const`. La retouche F31 (`if (niveau === 'info' && !scen) niveau = pres.niveau`) lève alors « Assignment to constant variable ». Côté autonome, chaque envoi vers une adresse nouvelle levait une exception. C'était la cause des 16 écarts des requêtes types et de 300 des 312 écarts DEV. Correction : `let niveau`, comme dans `server.mjs` et dans `webdemo/engine/sentinelle_core.js`.
2. **Build en retard sur le moteur, pas un écart du moteur.** `run/policy.mjs` a été modifié à 10:03, le build autonome date de 10:00. La règle `site_differs_from_intent` (F43, SIWE pour un autre site avec une intention déclarée) manquait dans `engine/policy.js` du build. 12 écarts DEV et 3 PUBLIC. Un nouveau build les supprime.

## Résultat

Avec `src/sentinelle_core.js` corrigé et les sources actuelles de `engine/src` et `run/policy.mjs` converties comme le fait `build_standalone.mjs` (simulation dans un dossier temporaire, le build du dépôt n'a pas été touché) :

| Jeu | Identiques |
|---|---|
| Requêtes types | 132 / 132 |
| DEV | 1540 / 1540 |
| PUBLIC | 576 / 576 |

Aucun écart restant ne vient du moteur.

## À faire (propriétaire du build, agent d'Adem)

- Relancer `node extension_standalone/build_standalone.mjs` (et `--no-network`) pour embarquer le core corrigé et le dernier `run/policy.mjs`.
- Ajouter `'revoke.js'` à la liste de copie (ligne 46 de `build_standalone.mjs`). `gatekeeper.js` l'importe désormais : sans lui, le service worker du build autonome ne se charge pas.
- `engine/RAPPORT_FAMILLES.md` est absent : l'autre agent n'a pas fini sur le moteur. Refaire le build et cette comparaison à la fin.

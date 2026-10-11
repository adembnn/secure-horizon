# Rapport de reconstruction de la démo Hold up

Date : 11 oct. 2026. Rien dans `server/`, `engine/`, `run/`, `extension*/` n'a été modifié. Pas de commit.

## Ce qui a changé

1. **Reconstruction** : `node webdemo/build_webdemo.mjs` à partir du moteur et du serveur actuels (F31 à F33, monotoneGuard, nouveaux codes de raison, `toIntent` avec swap et `intent_details`). Arbre `1cdc3f7ce9fb931e`, 20 fichiers générés, build reproductible.
2. **Build** : `engine/policy.js` lit maintenant `./src/engine.js` et `./src/util.js` (avant, il passait par `../engine/src/`, qui marchait par hasard). Trois chemins d'import changent, le reste est identique à `run/policy.mjs`.
3. **Intention « Échanger une crypto »** : elle est maintenant transmise au comparateur (avant, la page la remplaçait par « aucune »). Même changement dans le mode « Colle une transaction ».
4. **Nouvelle scène « Échanger 50 USDC : droit illimité demandé »** (9e scénario). La personne veut échanger 50 USDC contre de l'ETH, le site réclame un droit illimité sur l'USDC pour un contrat inconnu.
   - La fenêtre affiche « Tu as écrit : « Échanger 50 USDC contre de l'ETH » ».
   - Le verdict met l'intention écrite face à l'effet réel : « Ce que tu voulais » / « Ce que la demande fait », puis « Ça ne correspond pas. », niveau Danger, délai de 10 s.
   - Le comparateur retient `approval_exceeds_intent` et `unlimited_allowance`.
   - Le détail dit (USDC, 50, ETH) n'est transmis que si la réponse choisie est l'intention écrite. Avec une autre réponse, pas de comparaison écrite, le plancher reste Danger.
   - Quand rien n'est vu, la phrase est « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. », sans vert, sans « OK » (couvert par un test, pas atteignable avec cette scène).
   - Pas de sosie d'adresse dans cette scène (D-009). Le scénario sosie existant reste comme cas de test du moteur.
5. Fichiers touchés : `build_webdemo.mjs`, `js/holdup.js`, `js/app.js`, `js/ui.js`, `js/scenarios.js`, `js/verdict_model.js`, `css/holdup.css`, `README_WEBDEMO_FR.md`, `limites.html`, `tests/`.

## Tests périmés réparés

| Test | Cause | Réparation |
|---|---|---|
| `policy.js = run/policy.mjs` | La copie réécrit 3 imports et non 1 | Le test attend les 3 chemins, comparaison octet pour octet sur le reste |
| Fenêtre : `btn('Recevoir')` plante | La question d'intention est devenue des pilules (boutons radio) plus un bouton « Vérifier » | Le test coche la pilule puis clique « Vérifier ». Le mini-DOM gère maintenant les radios, `:checked`, `[name="x"]`, `value`, `insertBefore` |
| Libellés de fenêtre | La fenêtre n'a plus le texte « Hold up ! », ni « Tu as dit / En réalité », ni « Ce que le moteur a vu » | Le test vérifie une fenêtre modale (`role=alertdialog`, `aria-modal`), « Tu crois / En vrai », « Voir les preuves techniques », « Message vu sur la page » |
| Cas « aucun signal » | Le bouton est « Continuer », sans « quand même » | Le test exige « Continuer » actif, sans délai |

Rien n'a été affaibli : mêmes contrôles de niveau, de friction, d'Annuler, de texte, de minuteur. Aucun test supprimé.

## Résultats

- `node webdemo/tests/run_webdemo_tests.mjs` : **63 / 63** (avant : 59 prévus, 2 échecs et un plantage). 4 nouveaux tests pour la scène.
- **Équivalence avec le serveur** (voie de référence `server/server.mjs`, champ par champ) : 89/89 cas de scénarios et requêtes types, **PUBLIC 144/144, DEV 385/385**. « ok » ne sort jamais (0 sur tous). Le jeu TEST n'est pas touché.
- Aucun appel réseau pendant les tests. Taille : 34 fichiers, 341 Ko (environ 114 Ko compressés).
- Contrôle visuel dans le navigateur intégré (lecture et clics, sans drapeau de débogage) : la scène s'affiche bien jusqu'au « Ça ne correspond pas. ». Mise en page téléphone non regardée.

## Divergences venant du moteur (non corrigées, hors périmètre)

- `echange_legitime` (ordre CoW signé) sort avec la fiche F31 : « Cette opération envoie 0.1 WETH à 0x9008…ab41, une adresse nouvelle ». Un échange est décrit comme un envoi à une adresse nouvelle (le contrat CoW). La démo l'affiche « Aucun signal trouvé » car le niveau du moteur est `info`, mais le texte est mal adapté.
- Le moteur renvoie `level: attention` avec `niveau: info` pour F31. La démo affiche le niveau d'après `niveau`, donc « Aucun signal trouvé ». À confirmer avec Adem si F31 doit s'afficher « Attention ».
- Faux support : sans la réponse « On m'a demandé de le faire », un envoi de 50 ETH vers une adresse inconnue reste « Aucun signal trouvé » (limite déjà connue, toujours vraie).
- Le serveur écrit encore « 1.3e+72 jours » pour une échéance illimitée : le build garde son correctif d'affichage.

## Limites

- La scène « échanger 50 USDC » compare à une intention dont les détails sont fixés par le scénario. En vrai, la personne les saisirait. Intention en texte libre toujours non mesurée.
- La phrase « Ça correspond » n'est jamais montrée par une scène piège, seulement par un test unitaire.
- Fenêtre vérifiée dans un mini-DOM de test et à l'œil sur un seul parcours, pas sur Safari ni téléphone.
- Aucun secret, aucune adresse réelle ajoutée (contrats fictifs `0xd4d4…`).

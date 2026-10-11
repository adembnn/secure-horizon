# Rapport de reconstruction 2 de la démo Hold up

Date : 11 oct. 2026. Rien dans `server/`, `engine/`, `run/`, `pipeline/`, `extension/`, `detectors_adem/` n'a été modifié. Pas de commit, aucun `.env`.

## Résultats

- Reconstruction : `node webdemo/build_webdemo.mjs`. Arbre `1cdc3f7ce9fb931e`, 20 fichiers, identique à la reconstruction précédente : le moteur et le serveur n'ont pas bougé sur les fichiers lus par le build (F31 à F33, garde de monotonie, règle stricte déjà dedans). Build reproductible.
- Tests : `node webdemo/tests/run_webdemo_tests.mjs` : **81 / 81** (avant : 63). 18 tests ajoutés pour les nouvelles scènes.
- Équivalence avec la voie de référence `server/server.mjs`, champ par champ : **113 / 113** cas de scènes et requêtes types (13 scènes sous 6 réponses, avec le contexte propre à chaque scène), **PUBLIC 144 / 144**, **DEV 385 / 385**. « ok » ne sort jamais (0). Jeu TEST non touché.
- Zéro appel réseau : `fetch`, `XMLHttpRequest`, `WebSocket` piégés pendant tous les tests de moteur, aucun trouvé dans le code publié, CSP `connect-src 'none'` (un `fetch` lancé depuis la page a bien été refusé dans le navigateur).
- Taille : 35 fichiers, 360 Ko (environ 118 Ko compressés). Aucun paquet, aucun build côté Vercel.

## Ce qui a changé

1. **Scène 1, échanger 50 USDC, en trois entrées.**
   - Temps 1, routeur connu : droit illimité vers un routeur de la liste « déjà utilisés » du faux utilisateur. Réponse : « Ça ne correspond pas. », niveau Attention (pas Danger), « Tu peux limiter le droit à 50 USDC, comme tu l'as écrit. », bouton « Limiter à 50 USDC ». Pas d'attente (Q16). Le clic relit la demande réécrite avec 50 USDC et affiche « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. ». Jamais de vert.
   - Temps 2, adresse neuve : même demande vers une adresse inconnue. « Ça ne correspond pas. », Danger, 10 s minimum, pas de limitation.
   - Site honnête (droit de 50 USDC) : « Ça correspond… », Continuer sans attente.
2. **Scène 2, coffre à signatures multiples** (rejeu de `demo_typologie/safe_signataire.mjs`). Deux scènes, étiquette « Scène synthétique, adresses factices » dans la liste et sur la requête. Le panneau montre ce que l'écran du coffre affiche (virement de 20 USDC à Paul) et ce que reçoit le portefeuille (`execTransaction`).
   - Appel délégué vers un contrat inconnu : Danger, fiche F09, avec ou sans phrase (testé : phrase honnête, « Autre », question d'intention décochée). La page dit « Tu n'as pas écrit ce que tu voulais faire. Hold up applique seulement ses règles de base. »
   - Version conforme : « Aucun signal trouvé », « Notre vérification est limitée : elle peut rater un piège. », « Ça correspond… pas une garantie ». Jamais vert.
3. **Scène 3, me connecter** : le scénario Permit devient « La page réclame un Permit », phrase écrite « Me connecter à ce site ». « Ça ne correspond pas. », Danger (F02). Aucune limitation proposée pour une signature.
4. **Les trois phrases** : « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. », « Ça ne correspond pas. », « Je n'ai pas pu vérifier cette demande. ». C'est maintenant le titre de la réponse chaque fois que la phrase écrite est comparée. La troisième s'affiche aussi pour toute demande illisible. Une ligne dessous donne le niveau.
5. **Page Limites** réécrite en tête : ce que la démo est (chaîne simulée dans le navigateur, vrai moteur, aucun appel réseau), ce qu'elle n'est pas (pas une chaîne, pas un portefeuille, pas l'extension, pas une mesure, pas un incident rejoué), et ce que les scènes ne montrent pas (limitation non prouvée avec un vrai portefeuille, routeur connu fictif, coffre branché à du matériel).
6. **Design** (v5 du dossier `docs/design/v5/DESIGN.md`, version bureau) : fond uni, encre `#171717`, gris `#5c5c5c`, bords `#e5e5e5` et `#8c8c8c`, un seul signal `#c9281c` réservé à « Ça ne correspond pas. » et aux erreurs de la page. Polices système. Boutons et champs à 8 px, 40 px de haut. Plus de pilules, d'ombres, de cartes arrondies, de gros minuteur ni de texte centré. Fenêtre de 440 px, texte à gauche, Annuler toujours visible. Aucun dégradé, aucun emoji, aucune image.
7. **Tests** : mini-DOM et tests adaptés (contexte propre à chaque scène, 13 scènes). Ajouts : temps 1, limitation, temps 2, site honnête, coffre (avec et sans phrase, réponse « Autre »), coffre conforme, Permit, « Je n'ai pas pu vérifier », étiquettes synthétiques, absence de « null » dans le panneau.

Fichiers touchés : `js/scenarios.js`, `js/ui.js`, `js/holdup.js`, `js/app.js`, `css/holdup.css`, `index.html`, `limites.html`, `README_WEBDEMO_FR.md`, `tests/run_webdemo_tests.mjs`. Générés : `BUILD_INFO.json`, `out/RESULTATS.json`.

## Contrôle visuel (navigateur intégré, 1280 px, serveur Node local sur 127.0.0.1)

Regardés : page de démo (liste par rubrique, panneau du faux portefeuille avec le plafond « illimité »), question d'intention, temps 1 (« Ça ne correspond pas », Attention, bouton Limiter), après limitation, coffre (écran du coffre contre ce que reçoit le portefeuille), coffre : appel délégué (Danger, attente), coffre conforme, page Limites. Un défaut vu et corrigé : le texte « null » dans le panneau du portefeuille. Pas regardés : le mode « Colle », le journal, la fenêtre « Je n'ai pas pu vérifier », le téléphone, le mode sombre (non prévu).

## Ce qui reste

- **Divergence Q16 à trancher.** Dans la démo, seule l'Attention (routeur connu) perd l'attente. Pour une adresse neuve la démo garde 10 s et le niveau Danger, comme le plancher du moteur. Le rapport `extension/RAPPORT_CORRECTIFS.md` retire l'attente dès que l'écart est « droit plus large que le montant » en transaction, sans distinguer l'adresse. À confirmer avec le propriétaire de l'extension.
- **La limitation est une simulation.** La démo réécrit la demande avec 50 USDC et la relit. L'extension (Q17) n'a été prouvée que sous Node, pas avec un vrai portefeuille. Dans l'extension le remplacement se fait seul à la poursuite, ici il faut cliquer.
- **Texte du moteur approximatif** : après limitation, « Ce que la demande fait » dit « Nous n'avons trouvé aucun signal dangereux dans cette demande » (fiche F26), pas « Tu donnes le droit de prendre 50 USDC ». Un échange légitime (CoW) reste décrit « envoie 0.1 WETH à 0x9008…, une adresse nouvelle » (F31) : la scène n'a donc pas de phrase écrite. À corriger côté moteur.
- Sans phrase, le routeur connu du temps 1 passe en « Aucun signal trouvé » (fiche F26, code `unlimited_allowance` retenu mais plancher info). C'est dit dans la scène. Faux support sans la réponse « On m'a demandé » : toujours « Aucun signal » (limite connue).
- La logique des clics sur « Vérifier » a été vérifiée avec des clics réels. Des clics synthétiques lancés par script dans le navigateur n'ont pas fait avancer la fenêtre (cause non trouvée, hors usage normal). À regarder si un test navigateur automatisé est un jour ajouté.
- Pas testé : Safari, Firefox, téléphone, lecteur d'écran. Le mode « Colle » n'utilise pas encore les trois phrases hors cas illisible.
- Intention en texte libre toujours non mesurée : la démo propose des choix fermés et une phrase écrite fixée par la scène.

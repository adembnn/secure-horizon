# Hold up Lab : interface

Interface statique du banc d'essai Hold up. Aucune dépendance, aucun build, aucune police ni ressource externe : elle tourne hors ligne.
Elle consomme l'API du serveur du Lab (`http://127.0.0.1:8800`) et sait se passer de lui grâce à `mock.js`.

## Lancer

```
node docs/demo/serve_static.mjs research/demo_reelle/lab/ui 8801
```

Puis ouvrir http://127.0.0.1:8801/ . Le serveur du Lab doit répondre sur le port 8800 et autoriser l'origine `http://127.0.0.1:8801` (CORS), sauf si l'interface est servie par le serveur du Lab lui-même (même origine, port 8800).
Autre adresse de serveur : `?api=http://hote:port` dans l'URL.

## Deux places, six vues

La barre du haut dit où tu es assis : **Je suis la victime** ou **Je suis l'attaquant**.

Côté victime :
- **Vivre un scénario** : on choisit un scénario (filtres porte, famille, nature), on voit l'appât dans une scène cadrée, on appuie sur son bouton. Deux colonnes se remplissent ensemble : à gauche la vraie surface de verdict (`verdict.js` et `verdict.css`, copies conformes de `research/titouan/T_banc_e2e/ui_holdup/`), à droite la vérité terrain de la chaîne de test. Une ligne de résultat suit : arrêté, raté, fausse alerte, laissé passer à raison, non couvert, attaque inopérante. Le panneau « Modifier le scénario » règle les champs `editable` (montant, destinataire, droit, intention, message collé) ; « Rejouer » relance.
- **Tout jouer** : appelle `/api/run-all` (filtres porte et famille). Le résumé est écrit en phrases avec des décomptes, jamais en pourcentage unique ; les non couverts sont comptés à part ; latence médiane et 95e centile. Les lignes qui ne collent pas avec le résumé du serveur sont signalées. Le tableau met les échecs en tête (case à décocher).
- **Scénario libre** : formulaire (approve, envoi, message typé Permit) ou JSON-RPC brut, intention et message collé facultatifs, contexte avancé en JSON. Envoyé à `/api/custom`.
- **Couverture** : matrice familles par portes, construite depuis `/api/scenarios`. Une case en pointillés est un angle mort (`covered: false` et sa note).

Côté attaquant :
- **Monter une attaque** : objectif, technique, déguisements (seulement ceux qui s'appliquent), appât (type, marque inventée, message choisi dans la liste, pas de champ libre), porte ; une phrase résume l'attaque au fur et à mesure. « Lancer contre Hold up » appelle `/api/attack/build` puis `/api/run { scenario }`. « Passer du côté victime » rejoue le même scénario dans la scène victime ; « Enregistrer cette attaque » appelle `/api/attack/save`. La liste « Attaques déjà tentées » vient de `/api/attack/log`.

Partout : ligne d'état (mode de la chaîne, réseau, bloc, victime, nombre de détecteurs) lue dans `/api/health`, bouton « Remettre à zéro » (`/api/reset`), thème clair par défaut (système et sombre au choix).

## Quand le mock s'allume

Au chargement, `api.js` appelle `/api/health` (1,8 s de délai). S'il n'y a pas de réponse, `mock.js` prend le relais pour tout (`api.mode = 'mock'`). Alors :
- un bandeau « Données d'exemple » reste en haut de chaque vue, avec « Réessayer le serveur » ;
- chaque colonne et chaque résumé porte la pastille « Données d'exemple » ;
- les latences sont étiquetées « valeurs d'exemple ».

Le mock a 6 scénarios (3 portes d'un côté, honnêtes et attaques, dont une fausse alerte, un raté et un non couvert). Rien de ce qu'il affiche n'est une mesure.
Forcer le mock : `?mock=1`.

Serveur réel présent mais sans routes d'attaque (404) : seule la vue attaquant bascule sur le moteur d'exemple, avec la pastille. Une panne du serveur pendant une partie n'est jamais masquée par le mock : la vue affiche l'erreur et « Réessayer ».

## Choix et limites

- Le délai avant « Continuer quand même » (30 s en danger, 600 s en manipulation) est choisi par le Lab, pas par le serveur : valeur de conception, annoncée comme telle.
- La vérité terrain affiche `executed` et `reverted` tels quels (« exécuté, puis annulé »). Si le serveur donne à `reverted` un autre sens, ce texte est à ajuster dans `result.js`.
- Les mots « trois mots sur la chaîne » du tableau sont déduits de `truth` (perte, droit illimité, contrôle cédé), pas fournis par le serveur.
- Les vocabulaires d'intention (`pay_someone`, `send_to_my_account`, `buy_or_swap`, `connect_or_accept_offer`, `asked_by_someone`) viennent de `app/intent/README.md`.
- La scène d'un `staging.kind` inconnu retombe sur la page de site.
- `verdict.js` et `verdict.css` sont des copies : à recopier si la surface change.

# Canal porte RPC vers la fenêtre de l'extension : conception

11 oct. 2026. Statut : **conception écrite, non construite.** Ce qui est livré aujourd'hui est listé à la fin.

## Le problème

Quand la porte RPC (`research/demo_reelle/rpc_garde/proxy.mjs`, 127.0.0.1:8555) retient une transaction signée, MetaMask l'affiche « Failed » et ramène la personne à son écran d'accueil ; notre message ne reste que dans une infobulle (`research/demo_reelle/RECHERCHE_metamask_rpc_erreur.md`). Il faut un deuxième canal, visible. Sur ordinateur, c'est la fenêtre de l'extension : les deux mêmes moments (la question en texte libre, puis « Ça correspond / Ça ne correspond pas à ce que tu as écrit », une ligne, les deux adresses si besoin), avec Annuler et Continuer branchés sur les routes du proxy.

## Décisions

### 1. Qui déclenche : le proxy pousse, l'extension écoute

Un service worker MV3 ne peut pas tenir une attente longue en `fetch`, et `chrome.alarms` ne descend pas sous 30 s : trop lent quand MetaMask a déjà affiché « Failed ».

Choix : une **WebSocket sortante du service worker vers `ws://127.0.0.1:8555/ext`**. Depuis Chrome 116, une WebSocket active prolonge la vie du service worker tant que des messages passent ; un ping toutes les 20 s suffit. À revérifier sur la documentation de Chrome (« Use WebSockets in service workers ») avant de coder : c'est le point dont tout dépend.

- Le proxy envoie `{ type: "hold", id, token, verdict, deadline, now }` à chaque nouvelle retenue, et `{ type: "closed", id, status }` quand elle se ferme.
- Une alarme (`hu:rpc`, toutes les 30 s) rouvre la connexion si le worker a été arrêté ou si le proxy a démarré après le navigateur. À la reconnexion, le proxy renvoie les retenues encore en attente : rien n'est perdu, seule l'ouverture de la fenêtre est retardée de 30 s au pire.
- Écartées : une page d'extension toujours ouverte (un onglet que la personne fermera) ; la page du proxy qui parle à l'extension (`externally_connectable` ouvrirait l'extension à une page web, et il faudrait que cette page soit ouverte) ; l'alarme seule (30 s de retard).

Objection d'un praticien : « une WebSocket locale, n'importe quelle page peut s'y connecter ». Réponse au point 2.

### 2. Comment le jeton arrive sans qu'une page web puisse libérer une retenue

Aujourd'hui le jeton par retenue n'existe que dans l'URL de décision, et le proxy refuse toute requête dont l'`Origin` n'est pas la sienne (y compris une extension).

- Le proxy n'accepte la WebSocket que si l'en-tête `Origin` vaut exactement `chrome-extension://<identifiant>`, l'identifiant étant épinglé par `HOLDUP_EXTENSION_ID` (même variable que le relais de classification). Une page web ne peut pas forger `Origin` ; une autre extension a un autre identifiant. Sans variable, le canal est fermé et la page de décision reste la seule voie.
- Pour que l'identifiant soit stable, le manifeste de la version autonome reçoit une clé publique (`key`) : l'identifiant ne dépend plus du dossier d'installation.
- Le jeton voyage dans le message `hold`, sur cette connexion seulement. L'extension le garde dans `chrome.storage.session` (effacé à la fermeture du navigateur, illisible par les pages).
- Les routes `POST /holds/:id/continue|cancel|intent` acceptent en plus cette origine épinglée, toujours avec le jeton dans le corps. Rien d'autre ne change : le délai reste vérifié par le proxy, qui reste la seule source de vérité.
- Hors périmètre, comme aujourd'hui : un programme local. Il lit déjà `GET /holds` sans `Origin`.

### 3. Ce que la fenêtre montre

La même `window.html`, ouverte avec `#rpc-<id>`. Un module du service worker (`rpc_channel.js`) répond aux mêmes messages `hu.view` et `hu.decision` que `gatekeeper.js`, mais son état vient du proxy.

1. Question : « Que voulais-tu faire avec cette opération ? » (la transaction est déjà signée : la question est au passé).
2. La phrase est classée par le relais (127.0.0.1:8789) ou par mots-clés, puis envoyée au proxy : `POST /holds/:id/intent` avec le choix du moteur (`ENGINE_CHOICE` de `intent_text.js` : `pay`, `login`, `asked`, `receive`). Le proxy relance sa comparaison ; chez lui aussi une réponse ne peut que durcir.
3. Réponse : `outcome.js` (`answerOf`) appliqué au verdict rendu par le proxy, qui a la même forme (`level`, `texts.reel`, `address_diff`, `intent_contradiction`). Mêmes trois phrases, même ligne, même comparaison 2 × 5.
4. Annuler appelle `/cancel`, Continuer appelle `/continue`. Un `409` (délai non écoulé) remet la ligne « Continuer sera possible dans N s. ».

Fermer la fenêtre annule la retenue, comme pour une demande venue d'une page. Si la page de décision et la fenêtre sont ouvertes ensemble, la première décision gagne ; l'autre reçoit `closed` et affiche l'état final.

### 4. Manifeste

À ajouter, et rien d'autre : `host_permissions` `http://127.0.0.1:8555/*` ; `connect-src` `http://127.0.0.1:8555 ws://127.0.0.1:8555` à côté de `http://127.0.0.1:8789`. `static_check.mjs` autorise ces deux adresses dans le seul fichier `rpc_channel.js`.

### 5. Sans l'extension

La page de décision du proxy reste la voie de repli, et la liste `http://127.0.0.1:8555/` aussi. Quand le canal est connecté, le message d'erreur renvoyé au portefeuille peut dire « Regarde la fenêtre Hold up » au lieu de donner un lien.

## Changements à faire dans `proxy.mjs` (non écrits)

1. Route `GET /ext` : poignée de main WebSocket (RFC 6455, sans dépendance), contrôle `Origin` épinglé, diffusion `hold` / `closed`, ping.
2. `foreign` : laisser passer l'origine épinglée sur les trois routes `POST /holds/:id/*`.
3. Servir `ui/screen.css`, `ui/screen.js` et `outcome.js` de l'extension pour que la page de décision dessine la même surface que la fenêtre, et accepter une phrase libre sur `/intent` (classement côté proxy par le relais).
4. Tests : origine web refusée sur `/ext` ; mauvaise extension refusée ; jeton jamais présent dans `GET /holds` pour une origine étrangère ; `continue` avant le délai toujours refusé par ce canal.

Aucun fichier `PATCH_extension_canal.diff` n'a été écrit : un patch non exécuté ne vaudrait pas mieux que cette liste.

## Ce qui est livré aujourd'hui

- Cette conception.
- Les pages de repli habillées en v5 autour de la surface : `decision.css` (jetons v5, polices système, un rayon, liste sans cartes), `holds.js` et `holds.html` (plus d'étiquette de niveau, plus de bandeau de marque), `decision.html` (plus de bandeau). Les 15 tests du proxy passent.

## Ce qui n'est pas construit

- Le canal lui-même : `rpc_channel.js`, la WebSocket, l'ouverture de la fenêtre pour une retenue RPC, les permissions 8555 dans le manifeste.
- Les changements de `proxy.mjs` ci-dessus.
- La surface de verdict de la page de décision : elle est encore celle de `ui_holdup` (choix multiples, « Tu crois / En vrai », étiquettes), servie par `proxy.mjs`. La remplacer demande le point 3.

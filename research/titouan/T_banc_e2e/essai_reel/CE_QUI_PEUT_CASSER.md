# Ce qui peut casser avec un vrai MetaMask, et comment diagnostiquer

Date : 11 oct. 2026. Étiquettes : **[code]** déduit de la lecture du code de `extension\` (inject.js, bridge.js, background.js, manifest.json), **[COMPAT]** repris de `extension\COMPAT.md`, **[hypothèse]** non vérifié, à confirmer pendant l'essai. Aucun de ces points n'a été observé avec un vrai MetaMask.

## 1. Les risques, un par un

| # | Risque | Pourquoi c'est plausible | Symptôme visible | Scénarios concernés |
|---|---|---|---|---|
| 1 | **EIP-6963** | MetaMask annonce son fournisseur par un événement `eip6963:announceProvider`. Sentinelle l'écoute en phase de capture et enveloppe le fournisseur annoncé, ou le remplace par un proxy s'il ne peut pas le modifier sur place [code]. Un site moderne (wagmi, RainbowKit) passe par là, pas par `window.ethereum`. Le fournisseur annoncé et `window.ethereum` peuvent être deux objets différents [hypothèse]. | Par `window.ethereum` la fenêtre apparaît, par EIP-6963 non (ou l'inverse) : MetaMask s'ouvre directement. | S1 et S1b (les deux modes de la page) |
| 2 | **Injection tardive / course au démarrage** | Sentinelle et MetaMask s'injectent tous deux dans la page au tout début, dans le « monde » de la page. L'ordre entre deux extensions n'est pas garanti [hypothèse]. Sentinelle gère les deux cas (piège sur `window.ethereum` + balayage toutes les 150 ms pendant ~30 s) [code], mais un site qui lit sa référence **avant** le premier balayage pourrait garder le fournisseur non enveloppé [COMPAT point 9]. | La **première** demande après un rechargement passe sans fenêtre, les suivantes sont retenues. | S1 ×5 avec rechargement (Ctrl+F5) avant chaque clic |
| 3 | **Onglet ou fenêtre de verrouillage de MetaMask** | Si MetaMask est verrouillé, il ouvre une fenêtre de déverrouillage (parfois un onglet) au premier appel. `eth_requestAccounts` n'est jamais retenue (journal seulement) [code] : la connexion peut donc ouvrir MetaMask sans passer par Sentinelle, c'est voulu. Pour les demandes sensibles, l'ordre attendu est Sentinelle d'abord, puis déverrouillage. Autre sens du mot « verrouillage » : Chrome peut **geler ou décharger** un onglet en arrière-plan [hypothèse] et perdre une fenêtre Sentinelle en attente. | MetaMask demande un mot de passe avant Sentinelle ; au retour sur un onglet resté longtemps en arrière-plan, la fenêtre a disparu ou la page est rechargée. | Test libre : verrouille MetaMask puis lance S1 ; S14 (onglets en arrière-plan) |
| 4 | **Permissions du service worker** | L'extension n'a que les permissions `storage` et l'accès à `http://127.0.0.1:8787/*` [code]. Le serveur n'accepte que l'origine `chrome-extension://…`, et refuse tout si `SENTINELLE_EXT_ID` est défini et ne correspond pas : l'identifiant d'une extension « non empaquetée » change si le dossier change [code, hypothèse]. Le service worker peut être arrêté par Chrome (inactivité de ~30 s, ou événement trop long, de l'ordre de 5 min) [COMPAT point 13]. Après un rechargement de l'extension, les onglets déjà ouverts perdent le lien avec elle (« contexte invalidé ») : mode fermé, 4900 [COMPAT point 14]. Réglages de Chrome qui coupent tout : « Accès au site » sur « Au clic » ; navigation privée non autorisée ; page en `file://` [COMPAT point 8]. | Tous les verdicts « Non vérifié (réponse HTTP 403) » ; ou erreur 4900 « vérification indisponible » ; ou aucune fenêtre du tout (extension absente de la page). | Tous ; surtout S10, S13a/b/c |
| 5 | **Fenêtres bloquées / mal ouvertes** | La fenêtre MetaMask est ouverte par MetaMask lui-même, pas par la page : le bloqueur de pop-ups de Chrome ne devrait pas jouer [hypothèse]. En revanche, si une fenêtre MetaMask est **déjà** ouverte (vieille demande), il la réutilise ou la met au premier plan : deux demandes s'empilent dans le même panneau. Sous Windows, une fenêtre peut aussi rester **derrière** le navigateur (vol de focus refusé). La fenêtre Sentinelle, elle, est dans la page (pas une vraie fenêtre) : une page qui la masque ou un onglet en arrière-plan la cache [code]. | « Rien ne se passe » alors qu'une fenêtre MetaMask est cachée derrière Chrome ; plusieurs demandes dans MetaMask ; pastille du renard avec un nombre > 1. | S14, S11b |
| 6 | **MetaMask détecte la modification de `window.ethereum`** | Sentinelle remplace `window.ethereum` par un accesseur (lecture / écriture) et intercepte `Object.defineProperty`, `Reflect.defineProperty` et `Object.defineProperties` quand ils visent `ethereum` [code]. MetaMask définit ce champ lui-même, de façon particulière [COMPAT point 11]. Conséquences possibles [hypothèse] : avertissement dans la console, MetaMask qui renonce à poser `window.ethereum` ou à émettre ses événements, un site qui ne détecte plus MetaMask (`isMetaMask` absent) ou qui affiche « installe MetaMask ». Limites déjà connues : `Object.getOwnPropertyDescriptor(window,'ethereum')` montre un accesseur, et un site peut détecter l'extension via un iframe vierge [COMPAT G2, G3]. | Le bouton « Connecter » dit « Aucun portefeuille trouvé » alors que MetaMask est installé ; événements `chainChanged` / `accountsChanged` absents du journal de la page ; message d'erreur de MetaMask dans sa console. | S1, S8 (événements) |
| 7 | **Lecture de `request` gardée avant le patch** | Si un site (ou une bibliothèque) garde `provider.request.bind(provider)` avant l'enveloppe, il contourne Sentinelle [COMPAT point 10]. Impossible à produire avec notre page simple : à surveiller avec une vraie dApp (hors périmètre de ce protocole). | Aucune fenêtre alors que `window.ethereum.request` est appelé par le site. | Hors protocole |
| 8 | **Double avertissement MetaMask** | MetaMask a ses propres alertes (simulation, listes de sites douteux). Deux écrans successifs peuvent dérouter la personne ou fausser le temps de décision mesuré. | Deux alertes de deux outils différents : noter laquelle est venue en premier et si elles disent la même chose. | S4, S5, S6 |
| 9 | **Lenteurs qui ne sont pas Sentinelle** | RPC Fuji lent ou limité, MetaMask qui estime le gaz, premier appel du serveur plus lent (chauffe), réveil à froid du service worker (quelques centaines de ms) [hypothèse]. | « Latence ressentie » élevée sans fenêtre Sentinelle (S0 sert de référence). | Tous |
| 10 | **Fenêtre fantôme après arrêt du service worker** | Le panneau Sentinelle vit dans la page ; si le service worker s'arrête pendant l'attente, la demande échoue en 4900 mais le panneau peut rester affiché sans effet [hypothèse, déduite du code]. | La page affiche « refusée code=4900 » alors que le panneau Sentinelle est toujours à l'écran. | S13b, S13c |

## 2. Où regarder pour diagnostiquer

### a. La console de la page (onglet de la page d'essai)
Ouverture : touche **F12** (ou clic droit → Inspecter) → onglet **Console**. Coche « Conserver le journal » (roue dentée de la console) pour garder les messages après un rechargement.
- Cherche des lignes rouges. Les codes à reconnaître : **4001** (refus : Sentinelle ou MetaMask, vérifie l'ouverture de la fenêtre MetaMask), **4900** (Sentinelle a bloqué par prudence, vérification indisponible), « Sentinelle: verification indisponible… » (message exact de l'extension).
- Teste que Sentinelle est bien dans la page (tape ou colle dans la console, ne contient aucun secret) :
  - `window.ethereum` → doit afficher un objet MetaMask (avec `isMetaMask: true`).
  - `Object.getOwnPropertyDescriptor(window,'ethereum')` → avec Sentinelle : une description avec `get` et `set` (accesseur) ; sans Sentinelle : en général `value`. C'est un indice de présence, pas une preuve de blocage.
  - Annonces EIP-6963 : `window.addEventListener('eip6963:announceProvider', e => console.log(e.detail.info.name, e.detail.info.rdns, e.detail.provider === window.ethereum)); window.dispatchEvent(new Event('eip6963:requestProvider'))` → liste les portefeuilles, et dit si l'objet annoncé est le même que `window.ethereum` (`true` / `false`).
- Menu déroulant « top » en haut de la console : tu peux changer le contexte vers « Sentinelle » (contexte isolé de l'extension) pour voir ses erreurs propres. Les erreurs de l'injecteur (monde de la page) apparaissent en contexte « top ».
- **Une console silencieuse est normale** : Sentinelle n'écrit presque aucun message ; l'absence d'erreur ne prouve donc pas que la retenue marche. La preuve de retenue, c'est la méthode R du protocole.

### b. La console du service worker de Sentinelle
Ouverture : `chrome://extensions` → carte « Sentinelle » → lien **service worker** (ou « Inspecter les vues »).
- Onglet **Console** : erreurs du service worker (extension rechargée, JSON illisible, moteur indisponible). Le service worker n'écrit que des erreurs.
- Onglet **Network** : lignes `check` (POST vers `127.0.0.1:8787`) : statut (200 normal ; 403 = origine refusée ; 0 / échec = serveur arrêté), temps (≈ 25 ms normalement ; ≈ 3000 ms puis « annulé » = délai dépassé).
- Onglet **Application** → **Stockage de l'extension** → **Local** : clés `cfg` (réglages), `log` (journal des décisions), `contexte` (version autonome).
- **Attention** : ouvrir ces outils **maintient le service worker en vie** et fausse S13b/S13c. Ne les ouvre qu'après ces scénarios, ou ferme-les avant.
- Pour savoir si le service worker est arrêté : `chrome://serviceworker-internals/` (colonne d'état de l'extension).
- Dans `chrome://extensions`, le bouton rouge **Erreurs** de la carte Sentinelle liste les erreurs d'exécution.

### c. La page d'options de Sentinelle (journal)
`chrome://extensions` → Sentinelle → Détails → **Options de l'extension**. La zone « Journal » liste les 30 dernières entrées : `verdict` (niveau, `why` si « non vérifié », `latency_ms`) et `decision` (`decision`, `time_to_decision_ms`, `friction_arm`, `early_click_blocked`, `cancel_visible`, `ui_error`). Un `ui_error: ui-indisponible` signifie que le panneau n'a pas pu s'afficher dans la page.

### d. Le serveur (version serveur)
- La fenêtre du terminal du serveur : affiche les erreurs de démarrage et « port déjà utilisé ».
- `http://127.0.0.1:8787/health` dans le navigateur : `"status":"up"`.
- `journal\verdicts.jsonl` : une ligne par verdict, chaînée par hachage ; `node server\server.mjs --verify-journal` vérifie que rien n'a été modifié.

### e. MetaMask
- Pastille sur l'icône du renard : nombre de demandes en attente (outil principal de la méthode R).
- MetaMask → **Activité** : ce qui a réellement été envoyé.
- Console de MetaMask : `chrome://extensions` → MetaMask → **service worker** → Console (messages d'erreur RPC, tentatives de redéfinition de `window.ethereum`).
- Snowtrace testnet (https://testnet.snowtrace.io) : colle l'**adresse publique** de A pour voir les transactions réellement envoyées sur Fuji. C'est la vérité ultime : si une transaction y apparaît alors que tu as annulé dans Sentinelle, c'est un FAIL critique.

### f. Remise à zéro quand tout est confus
1. Ferme les fenêtres MetaMask ouvertes et rejette les demandes en attente.
2. `chrome://extensions` → recharge Sentinelle (icône ⟳), puis **recharge la page d'essai** (F5) : sans cela, la page garde un ancien lien avec l'extension (4900).
3. Vérifie `http://127.0.0.1:8787/health`.
4. Rejoue seulement le scénario en cause, une fois, avec capture.

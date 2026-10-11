# Hold up autonome : essai à la main avec un vrai portefeuille

Ce que les tests Node ne peuvent pas prouver : que la fenêtre Hold up s'ouvre vraiment devant le portefeuille, dans un vrai Chrome, avec MetaMask ou Core. Compte 20 minutes pour les 10 contrôles.

Rien de réel ici : chaîne locale Hardhat, jeton de test, compte de test. N'importe jamais ta vraie clé dans le portefeuille utilisé pour cet essai.

## 1. Préparer

1. Construire l'extension (Node 23.2 ou plus récent), depuis `research/titouan/T_banc_e2e` :
   ```
   node extension_standalone/build_standalone.mjs
   node extension_standalone/tests/static_check.mjs
   ```
   Le contrôle statique doit finir sans ligne `ECHEC`.
2. Lancer la chaîne locale et le site leurre comme indiqué dans `research/demo_reelle/chain/README.md` et `research/demo_reelle/site/README.md`. RPC : `http://127.0.0.1:8545`. Site : `http://localhost:8791`.
3. Dans le portefeuille (MetaMask ou Core), ajouter le réseau : RPC `http://127.0.0.1:8545`, identifiant de chaîne `31337` (ou `43114` si le nœud tourne en copie d'Avalanche), symbole `AVAX`. Importer un compte de test Hardhat.

## 2. Charger l'extension dans Chrome

1. Ouvrir `chrome://extensions`.
2. Activer « Mode développeur » (en haut à droite).
3. Cliquer « Charger l'extension non empaquetée » et choisir le dossier `research/titouan/T_banc_e2e/extension_standalone/extension`.
4. La carte « Hold up (autonome) » doit apparaître sans bouton « Erreurs ». S'il y en a un, l'ouvrir et noter le message : l'essai s'arrête là.
5. Garder MetaMask ou Core activé à côté. Désactiver l'ancienne extension Hold up (version avec serveur) si elle est chargée : une seule des deux à la fois.
6. Recharger l'onglet du site leurre après chaque rechargement de l'extension.

Réglages utiles, dans « Détails » puis « Options de l'extension » :

- bouton « Durées de démo (10 s et 60 s) », puis « Enregistrer », pour ne pas attendre 30 s et 10 min à chaque contrôle ;
- « Mon contexte » : pour que le jeton de test porte son nom, ajouter `"tokens":[{"address":"<adresse usdc de addresses.local.json>","symbol":"DemoUSDC","decimals":6,"chainId":31337}]`.

## 3. Les 10 contrôles

Pour chacun : noter OK ou KO, et ce que tu as vu si c'est KO.

| N° | Geste | Ce que tu dois voir |
|---|---|---|
| 1 | Sur `http://localhost:8791`, connecter le portefeuille, puis cliquer « Réclamer ma récompense ». | Une fenêtre « Hold up » séparée s'ouvre au premier plan. La fenêtre du portefeuille n'est pas encore là. Dans la page, seul un bandeau noir dit de regarder la fenêtre Hold up : aucun bouton dans la page. |
| 2 | Dans la fenêtre Hold up, répondre à « Que veux-tu faire ? » (par exemple « Recevoir »). | La question est dans la même fenêtre. Ensuite l'écran rouge « Danger » s'affiche, avec « Annuler » en premier et en plein. Aucun écran vert, aucun « OK ». |
| 3 | Cliquer « Annuler ». | La fenêtre se ferme. Le portefeuille ne s'ouvre pas. Le site affiche « Signature annulée. ». Le bandeau disparaît. |
| 4 | Relancer la demande. Sur l'écran Danger, cliquer « Continuer quand même » sans rien taper. | Rien ne part. Le bouton reste inactif tant que la phrase n'est pas retapée. Coller la phrase ne marche pas. |
| 5 | Retaper la phrase, cliquer « Continuer quand même », attendre la fin du compte à rebours (10 s en durées de démo, 30 s sinon), cliquer encore. | Après la phrase, un compte à rebours remplace la phrase. À zéro, « Continuer quand même » s'active. Après le clic, la fenêtre Hold up se ferme et la fenêtre du portefeuille s'ouvre seulement à ce moment-là. Refuser dans le portefeuille pour ne rien signer. |
| 6 | Relancer la demande. Pendant que l'écran Danger est affiché : `chrome://extensions`, carte Hold up, lien « service worker », puis dans `chrome://serviceworker-internals` cliquer « Stop » sur Hold up (ou attendre 30 s sans rien toucher : Chrome l'arrête seul). Revenir à la fenêtre Hold up. | La fenêtre Hold up est toujours là et répond. Le compte à rebours n'est pas reparti de zéro. « Annuler » marche tout de suite. « Continuer » après la friction ouvre bien le portefeuille. |
| 7 | Relancer la demande, puis fermer la fenêtre Hold up avec la croix. | Même effet qu'« Annuler » : pas de fenêtre du portefeuille, « Signature annulée. » sur le site. |
| 8 | Ouvrir la console du site (F12) et lancer deux demandes d'affilée : `ethereum.request({method:'personal_sign',params:['0x48656c6c6f',ethereum.selectedAddress]})` deux fois. | Deux fenêtres Hold up, décalées. Annuler l'une ne touche pas l'autre. Chaque fenêtre ne décide que de sa demande. |
| 9 | Dans la console : `ethereum.request({get method(){return (this.n=(this.n||0)+1)<3?'eth_chainId':'personal_sign'},params:['0x48656c6c6f',ethereum.selectedAddress]})`, puis `Object.getPrototypeOf(ethereum).request.call(ethereum,{method:'personal_sign',params:['0x48656c6c6f',ethereum.selectedAddress]})`. Avec Core : refaire la seconde ligne avec `avalanche` à la place de `ethereum`. | Première ligne : le portefeuille ne s'ouvre pas pour une signature (il a reçu `eth_chainId`). Deuxième ligne : la fenêtre Hold up s'ouvre avant le portefeuille. |
| 10 | Options : remettre « Durées du produit », enregistrer. Sur une page qui contient un texte de pression (« Le support te demande d'agir vite »), lancer une demande qui donne un droit, et laisser la retenue aller au bout des 10 minutes. Tuer le service worker une fois en route (comme au contrôle 6). | Écran « Manipulation », compte à rebours de 10 minutes, « Annuler » et « Appeler un proche » actifs tout du long. Après 10 minutes, « Continuer quand même » s'active et la demande part vers le portefeuille. |

Après l'essai : ouvrir les options, lire le « Journal (local) ». Chaque demande doit y avoir une ligne `verdict` puis une ligne `decision`. Une ligne `ui_fallback` veut dire que la fenêtre séparée n'a pas pu s'ouvrir et que l'écran s'est affiché dans la page : à signaler.

## 4. Ce qui n'est pas couvert

- Un site qui écrit directement au script de contenu du portefeuille (`window.postMessage`) sans passer par `window.ethereum`, `window.avalanche` ni EIP-6963 : Hold up ne voit pas la demande.
- WalletConnect, portefeuilles mobiles, portefeuilles matériels branchés sur un autre appareil, MetaMask Snaps (`wallet_invokeSnap`) : pas retenus.
- Si Chrome refuse d'ouvrir la fenêtre séparée, l'écran s'affiche dans la page (repli journalisé). Une page hostile peut le recouvrir ; elle ne peut pas le valider à ta place.
- Un portefeuille qui rappelle `request` plus tard, de lui-même, pour la même demande, te fera voir deux fenêtres Hold up. C'est gênant, pas dangereux.
- Navigation privée et pages `file://` : il faut autoriser l'extension à la main dans `chrome://extensions`.
- Fermer Chrome efface les demandes retenues : elles sont refusées.

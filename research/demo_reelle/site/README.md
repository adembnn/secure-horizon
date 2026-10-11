# Site de démo « Glacier Rewards » — leurre pour Hold up

Accessoire d'entraînement défensif. Rien de réel : marque fictive, chaîne de test (Hardhat local ou Avalanche Fuji testnet), contrats de test (`blockchain/contracts/demo/`). Sert à montrer, devant un vrai portefeuille (MetaMask ou Core), ce qu'une victime rencontre réellement avant de signer — avec et sans Hold up.

## Ce dossier contient

- `index.html` — le leurre : page de réclamation de récompenses « Glacier Rewards » pour utilisateurs Avalanche. Connexion du portefeuille (EIP-6963, repli sur `window.ethereum`), vérification du réseau, puis demande de signature `eth_signTypedData_v4` d'un `Permit` EIP-2612 sur DemoUSDC (`owner` = compte connecté, `spender` = l'adresse « drainer », `value` = max uint256, échéance lointaine fixe).
- `lure.html` — le message qui amène la victime jusqu'au leurre (reconstitution d'un post, compte fictif).
- `attaquant.html` — la console du présentateur : deux grands nombres (solde victime / solde attaquant en DemoUSDC), une chronologie, le sélecteur de réseau, et les détails techniques qui ne doivent jamais apparaître côté victime.
- `style.css`, `chain-utils.js`, `app.js`, `attaquant.js` — code partagé, sans dépendance externe, sans CDN.
- `config.js` — script Node qui copie (en lecture seule) `addresses.local.json` / `addresses.fuji.json` depuis `research/demo_reelle/chain/` vers ce dossier, pour que le site statique puisse les lire par un simple `fetch` relatif. Ne modifie jamais le dossier `chain/`.

## Avant de lancer

1. Faire tourner la chaîne de démo (dossier `chain/`, propriété d'un autre agent) : nœud local Hardhat ou déploiement Fuji, plus le service local sur `http://127.0.0.1:8792` (`POST /drain`, `GET /state`).
2. Copier les adresses dans ce dossier :
   ```
   node research/demo_reelle/site/config.js
   ```
   Ajouter `--watch` pour une copie continue pendant une démo live. Relancer cette commande après chaque `reset.mjs` côté `chain/` (le contrat drainer change d'adresse à chaque rejeu).
3. Servir ce dossier :
   ```
   node docs/demo/serve_static.mjs research/demo_reelle/site 8791
   ```

## Les 3 URL

- `http://localhost:8791/lure.html` — le message qui amène la victime (point de départ de la mise en scène).
- `http://localhost:8791/index.html` — le leurre.
- `http://localhost:8791/attaquant.html` — la console à projeter côté présentateur.

## Choix du réseau

Le réseau se choisit par un paramètre d'URL explicite, jamais par un réglage visible sur le leurre :

- `?reseau=local` (défaut si absent) ou `?reseau=fuji`, propagé automatiquement de `lure.html` vers `index.html` quand il est présent.
- Côté présentateur (`attaquant.html`) uniquement : deux boutons « Chaîne locale » / « Avalanche Fuji » changent le réseau affiché et le mémorisent (`localStorage`) pour les prochains chargements de cette page.
- Le leurre (`index.html`, `lure.html`) n'a aucun réglage visible. S'il reçoit un réseau demandé dont le fichier d'adresses est absent, il **bascule silencieusement** sur le premier réseau disponible (local en priorité) sans jamais afficher de nom de fichier ni de commande. Le détail de ce repli n'apparaît que sur `attaquant.html`.
- Liens Snowtrace (explorateur de blocs) : uniquement affichés quand le réseau effectif est Fuji. En local, aucun lien n'est produit (il n'existe pas d'explorateur).

## Déroulé pour les deux prises

**Sans Hold up (contrefactuel) :**
1. Ouvrir `lure.html`, cliquer « Vérifier mon éligibilité — Glacier Rewards ».
2. Sur `index.html` : « Connecter mon portefeuille » → accepter dans MetaMask/Core → le portefeuille bascule sur la bonne chaîne.
3. « Réclamer ma récompense » → signer dans le portefeuille (aucune transaction, juste une signature).
4. La page affiche « Réclamation en cours… » puis la confirmation. Sur `attaquant.html`, le solde attaquant monte en direct ; la chronologie affiche « Signature reçue » puis « Transaction minée : 2 480,00 DemoUSDC transférés » avec le hash court (et un lien explorateur sur Fuji).

**Avec Hold up :**
Même parcours ; à l'étape de signature, Hold up s'interpose avant la fenêtre du portefeuille. Si l'utilisateur annule (dans Hold up ou dans le portefeuille), `index.html` affiche « Signature annulée. » et `attaquant.html` ne bouge pas.

## Ce qu'un humain avec un vrai portefeuille doit vérifier

- Avant de signer : le domaine EIP-712 affiché par le portefeuille porte bien `name: "Demo USDC"`, `verifyingContract` = l'adresse `usdc` de `addresses.<réseau>.json`, et jamais une adresse de token qu'il connaît par ailleurs.
- Le `spender` du Permit est l'adresse `drainer` de ce même fichier (un contrat de test, redéployé à chaque rejeu), jamais une adresse qu'il a vue sur un vrai site.
- Le réseau ajouté/sélectionné dans le portefeuille a pour RPC `http://127.0.0.1:8545` (ou le RPC public Fuji annoncé), jamais un RPC inconnu.
- Après une réclamation « réussie » sans Hold up, le solde DemoUSDC de son compte de test est passé à 0 : c'est la preuve que la signature valait une autorisation totale, pas une simple vérification.
- Il n'importe jamais sa vraie clé privée dans ce portefeuille de test ; seules des clés de test publiques (Hardhat) ou un compte Fuji financé par un faucet doivent y être utilisées.

## États gérés

- Aucun portefeuille détecté (pas d'EIP-6963, pas de `window.ethereum`) : message clair, bouton désactivé, aucun appel réseau superflu.
- Aucun fichier d'adresses exploitable pour aucun réseau : le leurre affiche une ligne neutre (« Service momentanément indisponible »), sans nom de fichier ni commande ; `attaquant.html` affiche le détail technique et la commande à lancer.
- Réseau demandé indisponible mais un autre réseau l'est : repli automatique et silencieux sur le leurre ; `attaquant.html` signale le repli.
- Signature refusée (utilisateur ou Hold up) : « Signature annulée. », le bouton redevient actif pour réessayer.
- Service de la chaîne (127.0.0.1:8792) hors service : `attaquant.html` l'indique et se reconnecte seul dès qu'il répond ; `index.html` affiche un message de réessai neutre.
- Compte connecté différent de la victime configurée dans `addresses.<réseau>.json` : le service refuse la demande ; le leurre reste neutre (« Service de démonstration indisponible pour le moment »), et `attaquant.html` (même origine, même navigateur) affiche l'alerte précise et la commande de correction (`DEMO_VICTIM=<adresse connectée>`).

## Limites connues

- Le repli automatique de réseau et l'alerte « compte ≠ victime configurée » reposent sur `localStorage`, donc sur le fait que les trois pages soient ouvertes depuis la même origine (`http://localhost:8791` partout, ou `http://127.0.0.1:8791` partout, pas un mélange des deux).
- Le chiffre de preuve sociale (41 382 portefeuilles, 6,1 M AVAX) est inventé pour la crédibilité du leurre ; il est fictif par construction, comme toute la page.
- Aucune police ni ressource externe n'est chargée : la police système du navigateur est utilisée pour que la démo fonctionne hors ligne.

Démonstration : site fictif, chaîne de test, contrats de test.

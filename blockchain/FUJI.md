# Déployer Hold up sur Avalanche Fuji (testnet, chainId 43113)

État au 11 oct. 2026 : **rien n'est encore déployé sur Fuji**. Le seul obstacle est le solde du déployeur
`0x6ce5e30b6014A74EebF53367b46cA93Fb711458B`, qui vaut 0 AVAX. Tout le reste a été répété sur une copie
locale de Fuji (voir « Répétition à blanc »). Jamais le réseau principal : les scripts refusent tout RPC
autre que `127.0.0.1` ou `api.avax-test.network`, et tout chainId autre que 43113.

## Marche à suivre (humain)

1. Ouvre https://build.avax.network/console/primary-network/faucet, connecte-toi (compte Builder Hub) et connecte un portefeuille (Core ou MetaMask) sur Fuji.
2. Demande des AVAX de test C-Chain. Si le robinet laisse choisir l'adresse, colle `0x6ce5e30b6014A74EebF53367b46cA93Fb711458B`. Sinon reçois-les sur ton portefeuille puis envoie **0,1 AVAX** (réseau Fuji) à cette adresse.
3. Secours si le robinet refuse : https://faucets.chain.link/fuji (0,5 AVAX, portefeuille connecté), ou https://core.app/tools/testnet-faucet/?subnet=c&token=c (solde AVAX non nul sur le réseau principal, ou coupon obtenu sur https://guild.xyz/avalanche).
4. `cd blockchain` puis `npm run fuji:check` : doit finir par `READY`.
5. `npm run fuji:all` (avec ton portefeuille de démo comme victime : PowerShell `$env:DEMO_VICTIM="0x..."; npm run fuji:all`, bash `DEMO_VICTIM=0x... npm run fuji:all`).
6. Lis la fin de la sortie : `DONE` et aucune ligne `FAIL`. Les adresses sont dans `blockchain/DEPLOYMENTS.md`.

## La commande unique

```
cd blockchain
npm run fuji:all        # tout ; relançable sans risque
npm run fuji:check      # contrôle seul : n'envoie rien, dit READY ou le montant exact manquant
```

`scripts/demo/fuji-all.js` fait, dans l'ordre : contrôle (clé, adresse, chainId, compilation, solde), déploiement de
DemoUSDC, DemoWAVAX, DemoNFT, DemoRouter (puis sa liquidité), FreshDrainer, EvidenceAnchor, 2 480 DemoUSDC pour la
victime, ancrage de la racine du journal, écriture de `research/demo_reelle/chain/addresses.fuji.json` et de
`blockchain/DEPLOYMENTS.md`, vérification du code source, relecture de la chaîne, copie des adresses vers les deux sites.

Options : `--fresh` (tout redéployer), `--no-verify`, `--journal <fichier.jsonl>`. Variables : `DEMO_VICTIM`
(défaut : le déployeur joue la victime), `DEMO_VICTIM_AVAX` (défaut : automatique, 0,2 AVAX au plus et jamais plus
de la moitié du solde restant), `FUJI_TIP_GWEI` (forcer le pourboire si le réseau refuse le prix par défaut).

## AVAX nécessaires

| Mesure | Valeur |
|---|---|
| Gaz réellement consommé (répétition, 13 transactions) | **7 447 993** |
| Gaz budgété par le script (+30 %) | 9 818 900 |
| Prix du gaz sur Fuji (RPC public, 11 oct. 2026) | base 10 wei, pourboire suggéré 150 wei |
| Plafond payé par le script | 340 wei par gaz (4 x base + 2 x pourboire) |
| **Montant exigé par le script** | **0,000000003338426 AVAX** |
| Coût attendu réel | environ 0,0000000023 AVAX |

Le gaz est donc négligeable : n'importe quel robinet suffit. Demande quand même 0,1 AVAX ou plus. La victime a besoin
d'AVAX pour signer ses propres transactions, et un portefeuille propose souvent un prix du gaz bien supérieur au
minimum du réseau. Si le prix du gaz remonte, `fuji:check` recalcule le montant au moment du lancement.

Détail du gaz mesuré : DemoUSDC 1 719 105, DemoWAVAX 941 749, DemoNFT 1 813 515, DemoRouter 899 455, liquidité
314 535 (5 transactions), FreshDrainer 1 048 417, EvidenceAnchor 542 926, DemoUSDC de la victime 51 900, ancrage
116 391. Avec une victime distincte : +21 000 (envoi d'AVAX).

## Contraintes, et comment chacune est réglée

| Contrainte | Vérifié comment | État |
|---|---|---|
| Compilation | `npx hardhat compile` (Solidity 0.8.24, OpenZeppelin 5.1.0 présent) et compilation d'EvidenceAnchor par `hardhat.anchor.config.js`. `fuji:all` recompile avant d'envoyer. | OK |
| Réseau | `hardhat.config.js` : `https://api.avax-test.network/ext/bc/C/rpc`, chainId 43113. Le RPC répond 43113. `FUJI_RPC_URL` du `.env` pointe sur ce même hôte. | OK |
| Clé | Jamais lue ni affichée. Un script a seulement répondu : `PRIVATE_KEY` définie oui, `FUJI_PRIVATE_KEY` non, adresse dérivée `0x6ce5…458B`, identique à l'adresse attendue. `fuji:check` refait ce contrôle. | OK |
| Solde | 0 AVAX, nonce 0 (lecture du RPC public). | **Bloquant, action humaine** |
| Ordre et dépendances | DemoUSDC et DemoWAVAX avant DemoRouter (il reçoit leurs adresses) ; la liquidité après le routeur ; FreshDrainer reçoit l'adresse du collecteur (adresse neuve, clé jamais conservée) ; EvidenceAnchor est indépendant ; l'ancrage vient après lui. | OK |
| Numéros d'ordre (nonces) | `fuji:all` compte ses nonces lui-même. Un RPC public réparti sur plusieurs nœuds peut renvoyer un compteur en retard. | Corrigé |
| Fichiers de sortie | `addresses.fuji.json` est réécrit après chaque transaction ; le bloc généré de `DEPLOYMENTS.md` (adresse, transaction, bloc, gaz, arguments, lien, date) est réécrit à chaque lancement. | OK |
| Idempotence | Chaque étape regarde d'abord la chaîne. Relancer n'envoie rien si tout est en place ; après une coupure, seul le manquant est refait (testé en effaçant le routeur et l'ancre du fichier). | OK |
| Vérification du source | Aucune clé d'API nécessaire. Routescan (derrière `testnet.snowtrace.io`) accepte n'importe quelle chaîne non vide ; la doc Avalanche dit la même chose pour Snowtrace. Configuré dans `hardhat.config.js` (`etherscan.customChains`). Jamais bloquant : en cas d'échec le script continue et relancer ne refait que cette étape. | Chemin testé en lecture, pas en écriture |
| Journal à ancrer | Par défaut `research/demo_reelle/rpc_garde/journal/decisions.jsonl`, sinon `audit/sample/journal.jsonl`. Seule une racine de 32 octets part sur la chaîne. Un journal à la chaîne de hachage cassée est refusé. | OK |
| Aucun secret dans le dépôt | `addresses.fuji.json` reçoit toujours l'URL publique du RPC, jamais celle du `.env`. Aucune clé écrite ni affichée. | OK |

## Répétition à blanc (11 oct. 2026)

Nœud Hardhat local, copie de Fuji au bloc courant, port 8557, chainId 43113. Solde du déployeur fixé à 2 AVAX par
`hardhat_setBalance`. La **vraie clé** du `.env` a signé, contre `127.0.0.1` seulement. Le nœud sur 8545 n'a pas été
touché. Le nœud de répétition est arrêté.

Pour la refaire :

```
cd blockchain
HOLDUP_CHAIN_MODE=fork HOLDUP_FORK_URL=https://api.avax-test.network/ext/bc/C/rpc HOLDUP_CHAIN_ID=43113 HOLDUP_PORT=8557 npm run chain:local
# autre terminal : donner du solde au déployeur sur cette copie (hardhat_setBalance), puis
FUJI_RPC_URL=http://127.0.0.1:8557 HOLDUP_CHAIN_OUT_DIR=<dossier jetable> npm run fuji:all
```

`HOLDUP_CHAIN_OUT_DIR` est obligatoire dès que le réseau « fuji » pointe sur `127.0.0.1` : les fichiers vont dans ce
dossier, jamais dans le dépôt. Sans ces deux variables, le comportement par défaut est inchangé.

Ce qui a été prouvé :

- `npm run demo:fuji` puis `npm run anchor:fuji` (scripts d'origine) passent, puis `npm run fuji:all` : 13 transactions, 7 447 993 gaz, 13 contrôles de relecture réussis (code aux 6 adresses, nom et décimales de DemoUSDC, `nonces`, liquidité du routeur, collecteur du FreshDrainer, solde de la victime, racine du journal relue dans EvidenceAnchor).
- Solde insuffisant : arrêt avant tout envoi, code de sortie 2, montant exact affiché.
- Relance : 0 transaction. Reprise après état partiel : seuls le routeur, sa liquidité, l'ancre et l'ancrage sont refaits.
- Victime distincte : 2 480 DemoUSDC et 0,2 AVAX reçus.
- `reset.mjs --network fuji`, `lookalike.mjs --network fuji` et `drain.mjs --network fuji --serve` fonctionnent sur ce chemin (clé du déployeur comme relais).

Ce qui a cassé et a été corrigé :

1. `reset.mjs` et `lookalike.mjs` en mode Fuji échouaient à leur deuxième transaction (« nonce has already been used »). Corrigé dans `research/demo_reelle/chain/lib.mjs` (compteur de nonces sur le signataire Fuji).
2. `demo:fuji` et `anchor:fuji` écrivaient dans le vrai `DEPLOYMENTS.md` même contre un nœud local. Ils exigent maintenant un dossier jetable dans ce cas.
3. `site_echange` ne savait lire que `addresses.local.json`. Il lit maintenant `addresses.fuji.json` avec `?reseau=fuji`.
4. `anchor:fuji` redéploie un contrat à chaque lancement (non idempotent). `fuji:all` réutilise l'ancre existante.

## Site et scène sur Fuji

`fuji:all` copie les adresses vers les deux sites (sinon : `node research/demo_reelle/site/config.js` et
`node research/demo_reelle/site_echange/config.js`). Ensuite, depuis la racine du dépôt :

```
node docs/demo/serve_static.mjs research/demo_reelle/site 8791
node research/demo_reelle/chain/drain.mjs --network fuji --serve
node docs/demo/serve_static.mjs research/demo_reelle/site_echange 8793
```

- Leurre : `http://localhost:8791/lure.html?reseau=fuji`. Console : `http://localhost:8791/attaquant.html?reseau=fuji`.
- Échange : `http://127.0.0.1:8793/?reseau=fuji&mode=honnete`, `&mode=piege`, `&mode=piege&via=permit`.
- Portefeuille : celui de `DEMO_VICTIM`. Le site propose d'ajouter le réseau Fuji (RPC public, chainId 43113).
- Entre deux passages : `node research/demo_reelle/chain/reset.mjs --network fuji`, puis les deux `config.js` (le FreshDrainer change d'adresse).

Vérifié sur la copie locale, avec un portefeuille de test simulé (clé aléatoire, en mémoire) : les trois modes de
`site_echange` aboutissent en `?reseau=fuji` ; le Permit porte `chainId 43113` et l'adresse du DemoUSDC ; sur le
leurre, signature puis vidage par le service local, la console affiche 2 430 DemoUSDC chez l'attaquant.

Extension : elle ne contient aucun chainId en dur, elle prend celui du portefeuille. Le serveur
(`T_banc_e2e/server/server.mjs`) connaît 43113. Interrogé avec `chainId 0xa869` sur les contrats de la répétition, il
classe en danger le Permit illimité et l'approve illimité vers le FreshDrainer. Pour le contexte en direct, lancer le
serveur avec `SENTINELLE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc`.

## Robinets (vérifié le 11 oct. 2026)

| Robinet | Conditions | Source |
|---|---|---|
| Builder Hub, `build.avax.network/console/primary-network/faucet` | La page exige : portefeuille détecté, portefeuille connecté, compte Builder Hub (connexion). Aucune mention de solde sur le réseau principal ni de coupon sur la page. Montant non lisible sans connexion. | Page lue en direct |
| Core, `core.app/tools/testnet-faucet` | Solde AVAX non nul sur le réseau principal, sinon coupon du rôle obtenu sur `guild.xyz/avalanche` ; en dernier recours les modérateurs du Discord officiel. | Centre d'aide Avalanche (article daté du 15 oct. 2025) |
| Chainlink, `faucets.chain.link/fuji` | 0,5 AVAX par demande, portefeuille connecté (MetaMask, WalletConnect, Coinbase Wallet). Autres conditions éventuelles non visibles avant connexion. | Page lue en direct |

## Ce qui peut encore échouer

- **Le robinet lui-même** : conditions derrière la connexion non vérifiables d'ici, et envoi possible seulement vers le portefeuille connecté (d'où l'étape « envoie 0,1 AVAX au déployeur »).
- **Le prix du gaz réel** : le réseau peut refuser un pourboire de 300 wei si les conditions changent. Le message dit quelle transaction a été refusée ; relancer avec `FUJI_TIP_GWEI=1` (coût : environ 0,01 AVAX). Non testable sans solde.
- **La vérification du source** : l'API a répondu sans clé en lecture (contrat déjà vérifié reconnu), l'envoi d'un source n'a pas pu être essayé sans contrat réel. Non bloquant.
- **L'extension réelle dans Chrome sur Fuji** : seul le serveur a été interrogé. La fenêtre de l'extension devant un vrai portefeuille sur 43113 reste à essayer à la main. Sans contexte (`knownSpenders`), le serveur classe aussi l'approve honnête de 50 DUSDC au routeur en danger : ajouter l'adresse `router` de `addresses.fuji.json` au contexte.
- **Node 25** : Hardhat ne le prend pas officiellement en charge (avertissement à chaque commande). Tout a tourné sous Node 25.6 ; le script juge les sous-commandes sur leur sortie, pas sur leur code de retour.
- **Le RPC public** : en cas de coupure en cours de route, relancer `npm run fuji:all` reprend où il s'est arrêté.

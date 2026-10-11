# context_live — le contexte lu sur la chaîne au moment de signer

Le banc donne aux règles un contexte riche pour chaque cas. Le produit livré tourne avec un contexte presque vide : quelques adresses connues en dur, aucun âge de contrat, aucun solde, aucune information de jeton. `provider.mjs` comble la partie de cet écart qui se lit sur la chaîne, en lecture seule, dans un délai borné.

L'écart mesuré entre le banc et le produit est dans `redteam/PRODUIT_VS_BANC.md`.

## Ce que le fournisseur renvoie

Entrée : `{ chainId, from, request, rpcUrl?, seen?, options? }`. Sans `rpcUrl`, le RPC public d'Avalanche est utilisé (43114 et 43113).

| Fait | Appel | Remarque |
|---|---|---|
| Contrat ou compte simple, pour chaque contrepartie | `eth_getCode` | Une délégation EIP-7702 est signalée à part (`delegatedTo`) |
| Âge du contrat | voir plus bas | En blocs |
| Solde natif et nonce du signataire | `eth_getBalance`, `eth_getTransactionCount` | |
| Symbole, décimales, solde du signataire | `eth_call` | Pour les jetons de la demande |
| Droit déjà accordé | `eth_call` `allowance` | Pour chaque couple jeton et bénéficiaire de la demande |
| Adresse jamais vue par l'utilisateur | aucun appel | Vient de `seen` (carnet et historique locaux). Sans `seen`, le fait est inconnu |

Les contreparties sont tirées de la demande seule : destinataire, adresses présentes dans les données d'appel, contrat vérificateur et adresses d'un message typé. Plafonds : 8 adresses et 4 jetons par demande.

Règles tenues par le code et vérifiées par les tests :

- Seules sept méthodes de lecture sont autorisées (`READ_ONLY_METHODS`). Aucune transaction n'est envoyée, aucune clé d'API n'est utilisée.
- Budget total de 1500 ms par défaut, appels en parallèle, 900 ms par appel, cache en mémoire.
- Un fait non obtenu est inconnu. Il est absent du résultat et listé dans `missing`. Il n'y a aucune valeur rassurante par défaut.
- Si le nœud ne sert pas la chaîne annoncée, aucun fait n'est retenu.

## Âge d'un contrat sans clé d'API

Trois moyens, mesurés en direct le 11 octobre 2026. Les réponses brutes sont dans `evidence/`.

1. **Explorateur Routescan puis reçu de création.** `getcontractcreation` donne la transaction de création, `eth_getTransactionReceipt` donne le bloc. Deux appels, bloc exact. Vérifié sur WAVAX (bloc 820), USDC (bloc 7 388 829) et le routeur Trader Joe (bloc 2 486 393) sur 43114, et sur WAVAX Fuji (bloc 3 525). Preuves : `evidence/contract_age_probe.json`, `evidence/fuji_check.json`.
2. **Sonde `eth_getCode` au bloc de tête moins 50.** Un appel, 40 à 300 ms. Elle répond à la seule question que pose la règle (seuil de 50 blocs) : plus jeune ou plus vieux. Elle sert de repli quand l'explorateur ne répond pas à temps.
3. **Recherche dichotomique dans la fenêtre des 50 derniers blocs**, pour un contrat jeune sans réponse de l'explorateur. Six appels au plus, bloc exact. C'est le chemin utilisé sur un nœud local, où aucun explorateur n'existe.

La recherche dichotomique sur tout l'historique fonctionne aussi : les RPC publics d'Avalanche servent l'état ancien. Elle coûte 26 appels en série, soit 0,9 s sur Fuji et 9 à 44 s sur le réseau principal avec des délais dépassés sur l'historique profond. Elle est hors budget, donc désactivée par défaut (`exactAgeBySearch`).

Sur le nœud local (`http://127.0.0.1:8545`, réplique Hardhat d'Avalanche) : l'explorateur n'est jamais appelé pour une adresse de bouclage. Les contrats de démonstration obtiennent un âge exact par le moyen 3 (jeton de démonstration : 19 blocs, contrat vidangeur : 0 bloc). Un contrat hérité de la réplique, comme le vrai USDC, obtient seulement « au moins 50 blocs ». Si le nœud ne sert pas l'état passé, l'âge est inconnu et listé dans `missing`. Preuve : `evidence/local_node.json`.

## Latence mesurée

30 appels à froid (cache vidé avant chaque appel), trois formes de demande, budget de 1500 ms. Script : `measure_latency.mjs`.

| Nœud | p50 | p95 | max | Appels réseau par demande | Demandes complètes |
|---|---|---|---|---|---|
| RPC public Avalanche et Routescan | 70 ms | 107 ms | 184 ms | 12 | 30 sur 30, âge exact pour toutes |
| Nœud local (réplique) | 11 ms | 92 ms | 508 ms | 13 | 30 sur 30 |

Avec le cache chaud, le p50 passe sous 1 ms. Sans l'explorateur, le RPC public répond en 62 ms au p50. Le maximum local de 508 ms est le premier appel : la réplique va chercher l'état d'origine sur le réseau. Détail : `evidence/latency.json` et `evidence/latency_local.json`.

## Point d'intégration

`server_integration.diff` est prêt et n'est pas appliqué. Il s'applique à `server/server.mjs` dans son état du 11 octobre à 05h00 (commit `816fbfb`) :

```
git apply --directory=research/titouan/T_banc_e2e research/titouan/T_banc_e2e/context_live/server_integration.diff
```

Si `server/server.mjs` change encore, `redteam/check_product.mjs --live-like` s'arrête avec un message clair : il reconstruit le serveur modifié à chaque lancement à partir de ce fichier.

### Serveur local (`server/server.mjs`)

- `liveFor(body, local)` (nouvelle fonction) appelle `liveEngineContext({ chainId, from, request, rpcUrl, seen })` et renvoie la forme `engine`. Elle est inactive sauf si `SENTINELLE_LIVE=1`. `SENTINELLE_RPC_URL` force le nœud, par exemple la réplique locale.
- Le gestionnaire de `POST /check` devient `evaluate(body, local, await liveFor(body, local))`.
- `evaluate(body, local, live = null)` passe `live` à `buildCtx(body, local, from, chainId, live)`.
- La réponse gagne `context_live` et `context_missing` pour que l'interface affiche « non vérifié » sur les faits manquants.

Sans `live`, le serveur modifié rend exactement les mêmes niveaux que le serveur actuel : vérifié sur les 9 908 cas (`parity_mismatch: 0`).

### Forme à passer

`toEngineContext()` renvoie la forme attendue. `buildCtx` la range sous les mêmes noms que `run/run_loop.mjs` :

| Champ renvoyé | Destination dans `ctx` | Équivalent dans le banc |
|---|---|---|
| `isContract[adresse]` | `codeOf(adresse)` | `counterparty_facts[a].isContract` |
| `ageBlocks[adresse]` | `ageBlocks` | `counterparty_facts[a].ageBlocks`, `token_info[a].ageBlocks` |
| `balances` (`native` et adresses de jetons) | `balances` | `share_of_balance_pct` (le moteur calcule la part) |
| `tokenMeta[jeton]` | `tokenMeta` | `token_registry`, `token_info` |
| `tokenInfo[jeton]` | `_tokenInfo` et `_k.token_info` | `token_info` |
| `facts[adresse]` | `_facts` | `counterparty_facts` |
| `missing` | réponse `context_missing` | aucun |

Le drapeau `stable` n'est jamais posé d'après la chaîne : le symbole est choisi par celui qui déploie le jeton.

### Extension autonome (`extension_standalone/src/sentinelle_core.js`)

Même modification, à porter à la main car le fichier est en cours de changement :

- `buildCtx(body, local, from, chainId)` reçoit un cinquième paramètre `live`, avec le même corps que dans le diff.
- `evaluate(body, local)` et `check(body, local)` le transmettent.
- Dans `background.js`, l'appel `check(body, await getLocalContext())` devient `check(body, local, (await liveEngineContext({ chainId, from, request, seen })).engine)`.

`provider.mjs` n'utilise que `fetch`, `AbortController`, `Map` et `BigInt`. Il tourne tel quel dans un service worker. Le manifeste doit autoriser les hôtes du RPC et de Routescan.

## Vie privée : ce qui sort du navigateur

Aujourd'hui le produit n'émet aucune requête. Avec le fournisseur activé, voici ce qui part à chaque demande :

| Destinataire | Ce qu'il reçoit |
|---|---|
| Nœud RPC (par défaut `api.avax.network` ou `api.avax-test.network`) | L'adresse du signataire, les adresses des contreparties et des jetons de la demande, le couple jeton et bénéficiaire |
| Routescan (`api.routescan.io`) | Les adresses des contreparties seulement. Jamais l'adresse du signataire |
| Nœud local | Tout reste sur la machine. Routescan n'est pas appelé |

Le nœud RPC voit donc quelle adresse s'apprête à interagir avec quel contrat, avec l'adresse IP de l'utilisateur. Le portefeuille envoie déjà la même chose à son propre RPC. Passer le RPC du portefeuille en `rpcUrl` évite d'ajouter un tiers. Rien d'autre ne sort : ni le texte de la page, ni l'origine, ni le carnet d'adresses, ni l'historique, ni le montant.

## Limites

- **Le contexte en direct seul rattrape peu d'arnaques.** Les chiffres sont dans `redteam/PRODUIT_VS_BANC.md`. Les règles qui exploitent ces faits sont surtout dans `detectors_adem/`, qui ne sont pas dans le produit.
- Les jetons d'un échange passés dans un chemin ne sont pas reconnus comme jetons. Leur symbole et leur solde ne sont pas lus. Ils sont traités comme des contreparties : code et âge seulement.
- La part du solde n'est calculée que pour une sortie de fonds. Pour un droit accordé, le solde est lu mais le moteur ne le compare pas au montant.
- `high_balance_share` n'a pas de fiche de texte côté serveur : la réponse porte `fiche: null`.
- Un contrat plus vieux que 50 blocs sur un nœud local n'a qu'une borne basse, pas d'âge exact.
- L'âge se compte en blocs. Un bloc dure environ 1,1 s sur 43114 et 2,1 s sur Fuji : 50 blocs font une à deux minutes.
- Les RPC publics limitent le débit. Le cache absorbe les répétitions, pas une rafale de demandes différentes.
- Un mandataire (proxy) a l'âge du mandataire, pas celui de son implémentation.
- Chaînes autres que 43114 et 43113 : il faut fournir `rpcUrl`, et l'âge repose sur la sonde seule.

## Fichiers

| Fichier | Rôle |
|---|---|
| `provider.mjs` | `getContext`, `toEngineContext`, `liveEngineContext`, `extractTargets` |
| `test/provider.test.mjs` | 15 tests avec `fetch` simulé, 1 test en direct activé par `HOLDUP_LIVE=1` |
| `measure_latency.mjs` | Mesure de latence. `node context_live/measure_latency.mjs 30 [rpcUrl]` |
| `server_integration.diff` | Modification de `server/server.mjs`, non appliquée |
| `evidence/` | Réponses brutes : âge de contrat, latence publique et locale, nœud local, Fuji |

```
node --test context_live/test/provider.test.mjs
HOLDUP_LIVE=1 node --test context_live/test/provider.test.mjs
HOLDUP_LIVE=1 HOLDUP_RPC_URL=http://127.0.0.1:8545 node --test --test-name-pattern=LIVE context_live/test/provider.test.mjs
```

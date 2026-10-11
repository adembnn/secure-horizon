# Hold up Lab

Le lab est un banc d'essai pour un juré : il choisit n'importe quel scénario (ou monte le sien, ou colle sa propre demande), et il voit côte à côte **ce que Hold up a dit** et **ce qui se passe vraiment sur la chaîne s'il signe**, y compris quand Hold up se trompe.

Ce qui le rend crédible : chaque scénario est réel, sur une copie locale d'Avalanche.

1. Le lab construit la demande exacte que le portefeuille ou la page enverrait à la victime.
2. Il demande son verdict au vrai produit (le code du produit est importé, jamais recopié).
3. Il établit la **vérité terrain** : la victime signe pour de bon avec sa clé, la transaction est minée sur la chaîne locale, l'attaquant utilise ensuite ce qu'il a obtenu (par exemple `permit` puis `transferFrom`), et le lab lit ce qui a bougé : soldes, autorisations, propriété des contrats.
4. Il remet la chaîne dans l'état où il l'a trouvée (`evm_snapshot` / `evm_revert`).

Rien n'est jamais envoyé sur une chaîne publique. La copie d'Avalanche ne fait que lire l'état public.

## Démarrer

```
node research/demo_reelle/lab/server/lab.mjs
```

Cette seule commande lance la chaîne du lab sur `127.0.0.1:8560` (copie d'Avalanche C-Chain ; chaîne vide si le réseau public est injoignable), déploie les contrats de démo, alimente la victime, branche le RPC protecteur du produit sur `127.0.0.1:8561` et sert l'API sur `http://127.0.0.1:8800`. Ctrl+C arrête tout.

Prérequis : `npm install` et `npm run compile` faits une fois dans `blockchain/`. Node 22 ou plus récent.

Variables : `LAB_PORT` (8800), `LAB_CHAIN_PORT` (8560), `LAB_GUARD_PORT` (8561), `LAB_CHAIN_MODE` (`fork` ou `plain`), `LAB_LIVE` (`0` : la seconde colonne ne reçoit aucun fait lu sur la chaîne), `LAB_CLASSIFIER` (`keyword` par défaut, hors ligne), `LAB_JURY_FILE`.

Tests : `node --test research/demo_reelle/lab/server/test/lab.test.mjs` (lance un lab jetable sur les ports 8570 à 8572, sans toucher à celui qui tourne).

## Ce que le lab met en place

| Qui | Quoi |
|---|---|
| Victime | compte de test public de Hardhat n° 5 : 100 AVAX, 2 480 DUSDC, 5 DWAVAX, 3 NFT, et sur la copie d'Avalanche 2 480 vrais USDC (écriture locale) |
| Coffre de la victime | contrat `LabVault` dont elle est propriétaire, 1 500 DUSDC |
| Contact « Paul », second compte de la victime | déjà payés : ils sont dans le carnet et l'historique que Hold up connaît |
| Routeur de démo | protocole connu de la victime (2 000 blocs d'ancienneté) |
| Attaquant | un compte, un contrat `FreshDrainer` tout neuf, un routeur inconnu `LabShadyRouter`, un sosie de l'adresse de Paul, un sosie de l'adresse du routeur |
| Plateforme d'échange | un compte qui détient 5 000 DUSDC « en dépôt » pour la victime |

`GET /api/health` donne toutes les adresses et ce que Hold up sait de la victime (`whatHoldUpKnows`).

## La règle de résultat

Elle est écrite une seule fois (`server/run.mjs`, `OUTCOME_RULE`), appliquée partout, et renvoyée par `/api/health`.

Le produit rend un niveau interne : `critical` (affiché « danger » ou « manipulation »), `warn` (affiché « attention » ou « non vérifié »), `info` (aucun signal). Attention : le champ `level` du produit vaut `attention` aussi bien pour `warn` que pour `info`. Lisez `niveau`, ou `affichage`.

| Cas | Résultat |
|---|---|
| le produit ne voit pas la demande par cette porte | `non couvert` |
| malveillant, mais la chaîne montre que rien n'est pris ni accordé | `attaque inopérante` (ni un arrêt, ni un raté) |
| malveillant + `critical` | `arrêté` |
| malveillant + `warn` | `raté`, détail « averti seulement » |
| malveillant + `info` | `raté`, détail « aucune alerte » |
| bénin + `critical` | `fausse alerte` |
| bénin + `warn` | `laissé passer à raison`, détail « avec avertissement » |
| bénin + `info` | `laissé passer à raison` |

Une transaction que le RPC protecteur refuse de lire compte comme `critical` : elle ne part pas.

## Les deux colonnes de verdict

- `verdict` : le produit tel qu'il est branché aujourd'hui. Porte site : `evaluate()` de `T_banc_e2e/server/server.mjs`, avec le texte de la page et l'intention déclarée. Porte portefeuille : la transaction signée passe par le vrai `rpc_garde/proxy.mjs`, branché sur la chaîne du lab. Porte plateforme : le même `evaluate()` sur l'envoi équivalent et le message collé.
- `verdictPlus` (« avec détecteurs ») : la chaîne du banc (`redteam/check_plus.mjs`) suivie des 14 détecteurs de `detectors_adem/`, qui ne tournent aujourd'hui que sur le banc. Cette colonne reçoit en plus les faits lus sur la chaîne du lab (contrat ou non, âge du contrat). `addedBy` liste les détecteurs qui ont levé un signal ; `baseLevel` donne le niveau avant eux. Par la porte portefeuille, elle ne reçoit ni l'intention ni le message, comme le produit.

## Scénarios (33 : 18 attaques, 15 opérations honnêtes)

Résultats du dernier `run-all` sur ce poste (copie d'Avalanche, 11 octobre 2026). Le produit change en ce moment : relancez `POST /api/run-all` pour les chiffres du jour.

### Porte « site » (demande envoyée par une page web)

| Scénario | Nature | Hold up | Avec détecteurs |
|---|---|---|---|
| `site-permit-unlimited` signature permit illimitée vers un contrat neuf | attaque | arrêté | arrêté |
| `site-permit-everything` permit pour tout le solde, échéance courte | attaque | arrêté | arrêté |
| `site-permit-eoa` permit au profit d'un simple compte | attaque | arrêté | arrêté |
| `site-permit2` signature de type Permit2 (copie d'Avalanche seulement) | attaque | arrêté | arrêté |
| `site-approve-unlimited` autorisation illimitée | attaque | arrêté | arrêté |
| `site-increase-allowance` increaseAllowance sur le vrai USDC (copie d'Avalanche seulement) | attaque | arrêté | arrêté |
| `site-nft-approval-all` autorisation sur tous les NFT | attaque | arrêté | arrêté |
| `site-batch-hidden-approve` lot qui cache une autorisation | attaque | arrêté | arrêté |
| `site-ownership-takeover` changement de propriétaire du coffre | attaque | arrêté | arrêté |
| `site-swap-no-min` échange sans minimum par un routeur inconnu | attaque | **raté** (averti seulement) | arrêté |
| `site-transfer-lookalike` paiement vers un sosie de Paul | attaque | arrêté | arrêté |
| `site-personal-sign-calldata` message signé en forme d'appel | attaque | attaque inopérante | attaque inopérante |
| `site-swap-ok` échange normal avec minimum | honnête | passe, avec avertissement « non vérifié » | passe, avec avertissement |
| `site-approve-capped` autorisation plafonnée au routeur connu | honnête | passe | passe |
| `site-permit-capped` permit plafonné, une heure, routeur connu | honnête | passe | passe |
| `site-mint` création d'un NFT | honnête | passe, avec avertissement « non vérifié » | passe, avec avertissement |
| `site-siwe` connexion par signature | honnête | passe | passe |
| `site-wrap` conversion AVAX vers WAVAX | honnête | passe | passe |
| `site-revoke`, `site-nft-revoke` retrait d'une autorisation | honnête | passe | passe |
| `site-pay-contact` paiement à Paul | honnête | passe | passe |

### Porte « wallet » (écran Envoyer du portefeuille, vue seulement par le RPC protecteur)

| Scénario | Nature | Hold up | Avec détecteurs |
|---|---|---|---|
| `wallet-send-lookalike` envoi vers un sosie de Paul | attaque | arrêté | arrêté |
| `wallet-send-support` presque tout le solde vers une adresse jamais vue, après un message de « support » | attaque | **raté** (aucune alerte) | arrêté |
| `wallet-send-avax-lookalike` AVAX vers un sosie de Paul | attaque | arrêté | arrêté |
| `wallet-send-contact` envoi au vrai contact | honnête | passe | passe |
| `wallet-send-own` envoi vers son second compte | honnête | passe | passe |
| `wallet-send-new-merchant` premier paiement à une adresse nouvelle | honnête | passe | **fausse alerte** |

### Porte « walletconnect »

| Scénario | Nature | Hold up | Avec détecteurs |
|---|---|---|---|
| `wc-approve-unlimited` autorisation illimitée | attaque | arrêté | arrêté |
| `wc-permit-blind-spot` signature permit | attaque | **non couvert** | non couvert |
| `wc-send-contact` paiement à Paul | honnête | passe | passe |
| `wc-siwe-blind-spot` connexion par signature | honnête | non couvert | non couvert |

Les transactions passent par le RPC du portefeuille, donc par le RPC protecteur. Les signatures hors chaîne passent par le relais WalletConnect : le RPC protecteur ne les voit jamais. Le lab exécute quand même l'attaque pour montrer la perte.

### Porte « exchange » (retrait depuis une plateforme)

| Scénario | Nature | Hold up | Avec détecteurs |
|---|---|---|---|
| `exchange-withdraw-platform` retrait vers une fausse plateforme de placement | attaque | arrêté | arrêté |
| `exchange-withdraw-own` retrait vers son propre portefeuille | honnête | passe | passe |

Il n'y a rien à intercepter : le retrait part de la plateforme. Vérifiable : l'adresse et le message que la personne colle avant de valider. Non vérifiable : le retrait lui-même, le solde et l'historique sur la plateforme. Le lab fait exécuter le retrait par le compte « plateforme ».

Total du dernier passage : 14 arrêtés, 2 ratés, 0 fausse alerte, 14 laissés passer à raison (dont 2 avec avertissement), 2 non couverts, 1 attaque inopérante. Avec détecteurs : 16 arrêtés, 0 raté, 1 fausse alerte.

## Monter sa propre attaque

Le juré peut jouer l'attaquant, puis s'asseoir à la place de la victime.

- `GET /api/attack/options` : les briques. Buts (prendre un solde de jetons, tous les NFT, le contrôle d'un contrat, obtenir un envoi), techniques par but (`permit`, `permit2`, `approve`, `increase_allowance`, `set_approval_for_all`, `transfer`, `transfer_ownership`, `swap_no_min`), déguisements, mise en scène, intention que la victime déclarera, message, porte.
- `POST /api/attack/build { goal, technique, disguises, params, lure, door }` : rend un scénario de la même forme que ceux du catalogue, avec un identifiant `jury-…`. Le lab le compile une fois sur la chaîne pour vérifier qu'il est exécutable.
- `POST /api/run { scenario }` : même chemin de verdict et de vérité terrain que le catalogue. Le scénario reçu n'est jamais cru : il est reconstruit à partir de sa recette.
- `POST /api/attack/save { scenario, author }` : ajoute l'attaque à `server/scenarios/jury_attacks.jsonl` (ajout seul) et l'exécute. `GET /api/attack/log` les rend avec leur dernier résultat. `run-all` les rejoue dans une section `jury` à part.
- `POST /api/attack/sweep { door?, max? }` : essaie toutes les combinaisons technique × déguisements, par porte.

Déguisements : `batch_1` (lot `wallet_sendCalls` avec une opération anodine), `batch_2` et `batch_3` (enveloppé dans Multicall3, une ou deux fois), `rename_primary_type`, `amount_below_max`, `amount_balance`, `deadline_near`, `deadline_far`, `spender_eoa`, `spender_lookalike_protocol`, `recipient_lookalike_contact`, `split_3`, `personal_sign_calldata`. Un seul par groupe.

Garde-fous : la cible est toujours la victime du lab, avec les jetons et contrats du lab. Bénéficiaire et destinataire se choisissent dans une liste d'adresses du lab ; aucune adresse libre, aucune URL de RPC, aucun identifiant de chaîne ne vient de l'appelant. Les messages viennent des catalogues existants du dépôt (`attacks/cases.jsonl`, `redteam/jury_social.jsonl`), lus par identifiant : le lab n'en écrit aucun.

La vérité terrain dit si l'attaque **marche**. Exemple : un `approve` enveloppé dans Multicall3 est émis par le contrat Multicall, pas par la victime ; il n'accorde rien, et le lab le classe « attaque inopérante » au lieu de le compter comme un raté.

### Balayage systématique (dernier passage)

175 combinaisons technique × (aucun, un ou deux déguisements) sont constructibles. Jouées par toutes les portes possibles, avec l'envoi direct essayé en DUSDC et en AVAX : 447 exécutions.

| | Arrêté | Raté | Attaque inopérante | Non couvert |
|---|---|---|---|---|
| Hold up | 139 | 60 | 171 | 77 |
| Avec détecteurs | 167 | 32 | 171 | 77 |

Ce qui passe, sans réglage de notre part :

- Envoi direct vers une adresse jamais vue (500 DUSDC, tout le solde, ou découpé en trois) : aucune alerte par aucune porte. Les détecteurs le rattrapent par le RPC, pas par le site ni la plateforme.
- Envoi d'AVAX enveloppé dans Multicall3, y compris vers le sosie de Paul : aucune alerte, avec ou sans détecteurs. C'est le trou le plus net : le sosie n'est plus vu une fois dans l'enveloppe.
- Échange sans minimum par un routeur inconnu : « attention » seulement. Arrêté avec détecteurs.
- `approve` ou `increaseAllowance` pour exactement tout le solde (au lieu de l'illimité), vu par le RPC : « attention » seulement. Arrêté avec détecteurs.
- 77 exécutions non couvertes : toutes les signatures hors chaîne par WalletConnect.

## Tester n'importe quoi

`POST /api/custom { door, request, intent?, pastedMessage?, context? }` accepte une demande libre : `eth_sendTransaction`, `wallet_sendCalls`, `eth_sendRawTransaction`, `eth_signTypedData_v4`, `personal_sign`, `eth_sign`, ou pour la porte plateforme `{ address, amount, asset }`.

- Entrées validées, 64 Ko au plus par demande. Une demande qui vise un autre identifiant de chaîne est refusée.
- La vérité terrain est exécutée quand la demande est une transaction de la victime du lab, ou un `permit` de la victime sur un jeton du lab. Le lab joue alors le pire cas : toute adresse qui a obtenu un droit s'en sert aussitôt.
- Pour une autre signature, ou une transaction d'un autre compte, `truth` vaut `null` et `truthReason` dit pourquoi.
- `context.label` (`malveillant` ou `benin`) fixe l'étiquette. Sans elle, le lab la déduit de la vérité terrain (`labelInferred`) : un envoi vers une adresse que la victime ne connaît pas est compté comme une attaque. Sans étiquette ni vérité terrain, `outcome` vaut `null`.

## API

| Route | Rôle |
|---|---|
| `GET /api/health` | chaîne, victime, contrats, produit, règle de résultat |
| `GET /api/scenarios` | catalogue, sans les fonctions, avec `defaults` pour les champs modifiables |
| `POST /api/run { id \| scenario, params?, intent? }` | un scénario : demande, verdict, vérité terrain, résultat |
| `POST /api/run-all { door?, family?, jury? }` | tout le catalogue, puis les attaques enregistrées |
| `POST /api/custom` | demande libre |
| `POST /api/reset` | revient à l'état initial et redéploie un `FreshDrainer` neuf |
| `GET /api/attack/options`, `POST /api/attack/build`, `/save`, `/sweep`, `GET /api/attack/log` | constructeur d'attaques |

Champs modifiables (`params`) : `amount` (nombre, ou `max`, `max_minus_1`, `balance`, `most`), `recipient` et `spender` (nom du lab ou adresse `0x`), `deadline` (`far`, `near`, `past`, ou secondes), `intentKind`, `pastedMessage`.

Écarts par rapport au contrat d'API de départ, tous additifs sauf le premier :

- `outcome` peut valoir `attaque inopérante`, et `null` pour une demande libre sans étiquette ni vérité terrain.
- `verdict` porte aussi `affichage`, `danger`, `codes`, `fiche`. `verdictPlus` porte aussi `niveau`, `baseLevel`, `reasons`, `liveFacts`, `ms`.
- `truth` porte aussi `attackWorks`, `harm`, `feesAvax`, et pour chaque autorisation `afterAttack`, `via`, `spenderName`. `truth.txs[].who` dit qui agit ; les opérations préalables de la victime sont marquées `before`.
- La réponse porte aussi `label`, `family`, `title`, `covered`, `coverageNote`, `pathNote`, `resolved`, `outcomeDetail`, `outcomePlus`.
- `summary` porte aussi `laisses_passer`, `benins_avertis`, `inoperantes`, `rates_avertis`, `rates_sans_alerte`, et le même décompte sous `avec_detecteurs`.

## Limites connues

- La victime est un compte de test local dont la clé est publique. Le lab signe à sa place ; aucun vrai portefeuille n'est branché.
- Porte « wallet » : le RPC protecteur est le vrai, mais le portefeuille est simulé. Le lab signe la transaction et la lui présente. Le RPC protecteur ne demande l'intention qu'après avoir retenu une opération : son verdict est donc rendu sans intention.
- Signatures hors chaîne par WalletConnect et retraits de plateforme : montrés comme non couverts ou vérifiables seulement par collage.
- Un lot `wallet_sendCalls` est exécuté comme une suite de transactions de la victime, pas de façon atomique.
- Une adresse sosie n'a pas de clé connue : pour jouer l'attaquant, le lab se fait passer pour elle sur le nœud local (`hardhat_impersonateAccount`). Sur la vraie chaîne, l'attaquant qui a fabriqué l'adresse en a la clé.
- `site-personal-sign-calldata` : une signature seule ne déplace rien. Le lab le dit (« attaque inopérante ») au lieu de prétendre le contraire.
- `site-permit2` et `site-increase-allowance` n'existent que sur la copie d'Avalanche (Permit2 et le vrai USDC). Hors ligne ils sont marqués indisponibles et sautés.
- DUSDC, DWAVAX et les NFT sont des jetons de démo. `lossUsd` compte un DUSDC ou un USDC pour un dollar, et vaut `null` quand seuls d'autres avoirs sont pris.
- La seconde colonne utilise le classifieur de messages par mots-clés, hors ligne.
- `jury_attacks.jsonl` est ignoré par git (règle `*.jsonl` du dépôt).
- Le lab importe le produit au démarrage : après une modification du moteur, relancez-le.

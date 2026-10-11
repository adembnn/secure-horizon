# La demande d'intention est-elle exhaustive ?

Date : 11 oct. 2026. Lecture seule sur le produit. Aucun commit. Tout ce qui suit sort d'un essai rejouable (`essais/`), pas d'une lecture seule du code.

## (a) Verdict en trois lignes

1. **Non.** La phrase écrite ne suffit pas à prouver l'intention d'un contrat, et le code ne la compare aujourd'hui qu'à trois choses : le montant d'un droit accordé, le montant, le jeton et le destinataire d'un paiement direct, et la présence d'un second droit.
2. Sur 12 défauts de l'hypothèse, **2 sont contrôlés** (2 montant du droit, 10 prise de contrôle du compte), **8 le sont en partie** (3, 4, 5, 6, 8, 9, 11, 12) et **2 ne le sont pas** (1 droit durable, 7 compte). Sur 58 paires d'essai, moteur serveur : 18 contrôlées, 20 non contrôlées, 7 en partie, 13 non distinguées. Un échange dont le montant, le sens, la contrepartie ou le minimum reçu est faux donne « Ça correspond » et part seul après 1 seconde.
3. La liste elle-même a **5 manques** (nature de l'opération, contrepartie reçue, prix ou minimum reçu, durée de validité, frais) et **3 dimensions qu'aucune phrase ne peut prouver** (à quel contrat le droit est donné, ce que le contrat fera plus tard, l'état au moment de l'exécution).

Avant tout le reste : **le build autonome livré plante** sur toute demande que son moteur juge sans signal. Voir (c) point 0.

## Comment les essais sont faits

- `essais/harnais.mjs` appelle le vrai décideur du build autonome : `gatekeeper.js`, `written_check.js`, `outcome.js`, `effect_sim.js`, sans navigateur (faux `chrome.*` des tests du produit, importé en lecture seule).
- Deux moteurs réels sont branchés derrière ce même décideur : `embarque` (`extension_standalone/extension/engine/sentinelle_core.js`, celui du zip) et `serveur` (`pipeline/evaluate_plus.mjs`, appelé comme `server/server.mjs`, détecteurs actifs, aucune lecture du réseau).
- La phrase est classée par le chemin mots-clés embarqué. Le relais Clef / Jev n'est pas appelé (aucun réseau). Un modèle peut mieux comprendre la phrase ; il ne change aucun des contrôles ci-dessous, qui sont du code.
- `essais/dimensions.mjs` : 58 paires. Pour chaque dimension, une demande conforme à la phrase et une demande qui ne trahit que cette dimension. Toutes sont fabriquées par code.
- `essais/simulation.mjs` : les dimensions d'un échange quand le nœud sait rejouer un appel (`debug_traceCall` simulé).
- `essais/operation.mjs` : une phrase, puis une deuxième demande du même site.
- Sorties réelles : `essais/sorties/dimensions.txt`, `dimensions.json`, `resume.txt`, `simulation.txt`, `operation.txt`.
- Rejouer : `node essais/dimensions.mjs && node essais/resume.mjs && node essais/simulation.mjs && node essais/operation.mjs`.

Lecture d'une ligne d'essai : **contrôlé** = la demande conforme donne « Ça correspond » et la demande qui trahit donne « Ça ne correspond pas ». **En partie** = la trahison donne « Je n'ai pas pu vérifier ». **Non contrôlé** = la trahison donne « Ça correspond ». **Aveugle** = les deux donnent « pas pu vérifier » (la dimension n'est pas distinguée).

## (b) Tableau : type de demande × paramètre × dimension × explicite ou défaut × contrôlé aujourd'hui

Colonne « Qui le sait » : **E** = la personne le sait et peut l'écrire. **D** = défaut supposé sans le demander. **X** = aucune phrase ne peut le prouver.
Colonne « Aujourd'hui » : résultat avec le moteur `serveur`, identifiant de l'essai entre parenthèses. Le moteur `embarque` est traité au point 0 de (c).

### 1. Transaction (`eth_sendTransaction`, `eth_signTransaction`, `eth_sendRawTransaction`)

Source : [execution-apis, transaction.yaml](https://raw.githubusercontent.com/ethereum/execution-apis/main/src/schemas/transaction.yaml), [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193).

| Paramètre | Dimension d'intention | Qui le sait | Exemple qui respecte la phrase et trahit l'intention | Aujourd'hui |
|---|---|---|---|---|
| `to` | à quel contrat je parle | X | « échanger 50 USDC » et l'appel va à un contrat qui imite le routeur | Non contrôlé, sauf liste locale. Limite assumée |
| `value` | aucune monnaie du réseau en plus (défaut 9) | D | approve de 50 USDC, avec 1 AVAX joint | **Non contrôlé** pour un échange : « Ça correspond » (D9a, D9b). Contrôlé pour un paiement (D9c) |
| `data` / `input` | ce que la demande fait vraiment | – | voir les lignes par fonction ci-dessous | Les deux champs sont lus, un écart entre eux bloque (S8, relu dans le code) |
| `from` | depuis ce compte (défaut 7) | D | la demande part d'un autre compte du portefeuille | **Non contrôlé** (D7). Danger faible : le portefeuille refuse en général |
| `chainId` | sur ce réseau (défaut 6) | D | même paiement, `chainId` d'une autre chaîne | **Non contrôlé** pour une transaction (D6b). Le réseau est relu après l'accord (S11) |
| `gas`, `maxFeePerGas`, `gasPrice` | frais (manque) | D | paiement de 20 USDC avec 20 AVAX de frais | **Non contrôlé** (M4) |
| `nonce` | – | – | pas une intention | sans objet |
| `type`, `authorizationList` | personne ne prend la main (défaut 10) | D | approve de 50 USDC plus une délégation EIP-7702 | **Contrôlé** (D10a) |
| `to` absent | création de contrat | D | – | Illisible : « pas pu vérifier » |

### 2. Jeton ERC-20

Source : [EIP-20](https://eips.ethereum.org/EIPS/eip-20). `increaseAllowance` n'est pas dans EIP-20 (ajout d'OpenZeppelin).

| Fonction, paramètre | Dimension | Qui le sait | Exemple de trahison | Aujourd'hui |
|---|---|---|---|---|
| `approve(_spender, _value)` : `_value` | seulement ce montant (défaut 2) | E | droit de 5 000 USDC ou illimité | **Contrôlé**, et corrigé dans la demande (E1a, D2a) |
| `approve` : `_spender` | à qui je donne le droit | **X** | droit de 50 USDC donné à une adresse quelconque | **Non contrôlé** : « Ça correspond » (M1a, M1b) |
| `approve` : contrat du jeton (`to`) | ce jeton, par son adresse (défaut 3) | D | 50 unités d'un jeton qui se nomme USDC | **En partie** : « pas pu vérifier » (D3a). Autre jeton connu : contrôlé (E2b) |
| `approve` : durée | pas un droit durable (défaut 1) | D | un `approve` n'a pas de date de fin | Borné par le montant seulement. Limite du standard |
| `increaseAllowance(spender, addedValue)` | seulement ce montant (défaut 2) | D | +50 USDC qui s'ajoutent à un droit déjà donné | **Non contrôlé** : lu comme un droit de 50 (D2d) |
| `transfer(_to, _value)` : `_value` | combien | E | 21 au lieu de 20 | **Contrôlé** (E1c) |
| `transfer` : `_to` | à qui | E | autre adresse | **Contrôlé** si l'adresse est collée dans la phrase (E3). Sinon « pas pu vérifier » |
| `transfer` : jeton | quel jeton | E | 20 USDT, ou un jeton inconnu | **Contrôlé** (E2a), en partie pour un inconnu (D3b) |
| `transfer` quand la phrase dit « échanger » | nature de l'opération (manque) | E | « échanger 50 USDC contre AVAX », la demande envoie 50 USDC à un tiers | **Non contrôlé** : « Ça correspond », part seul (E6a) |
| `transferFrom(_from, _to, _value)` | idem `transfer`, plus de quel compte | D | – | Lu comme un envoi |

### 3. NFT (ERC-721, ERC-1155)

Sources : [EIP-721](https://eips.ethereum.org/EIPS/eip-721), [EIP-1155](https://eips.ethereum.org/EIPS/eip-1155).

| Fonction, paramètre | Dimension | Qui le sait | Exemple de trahison | Aujourd'hui |
|---|---|---|---|---|
| `setApprovalForAll(_operator, _approved)` | cet objet, pas toute la collection (défaut 4) | D | « vendre mon NFT n° 12 » et le site prend toute la collection | Signalé par le moteur (O4 : « ne correspond pas »). **Aveugle** quand la phrase n'est pas comprise (D4a) |
| `approve(_approved, _tokenId)` | cet objet | E (le numéro) | autre numéro | **Non contrôlé** : le numéro n'est pas lu dans la phrase. La demande conforme affiche « je ne connais pas ce jeton… AVAX » (D4a) : le sélecteur est celui d'un jeton ERC-20 |
| `safeTransferFrom(_from, _to, _tokenId…)` | à qui part l'objet | E | autre destinataire | Non comparé à la phrase |
| ERC-1155 `_id`, `_value`, lots `_ids[]` / `_values[]` | quel objet, combien | E | plus d'objets que dit | Non comparé à la phrase |

### 4. Droits donnés par une signature

Sources : [EIP-712](https://eips.ethereum.org/EIPS/eip-712), [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612), [DAI](https://raw.githubusercontent.com/makerdao/dss/master/src/dai.sol), Permit2 : [IAllowanceTransfer](https://github.com/Uniswap/permit2/blob/main/src/interfaces/IAllowanceTransfer.sol), [ISignatureTransfer](https://github.com/Uniswap/permit2/blob/main/src/interfaces/ISignatureTransfer.sol), [PermitHash](https://github.com/Uniswap/permit2/blob/main/src/libraries/PermitHash.sol).

| Demande, paramètre | Dimension | Qui le sait | Exemple de trahison | Aujourd'hui |
|---|---|---|---|---|
| EIP-712 `domain.chainId` | sur ce réseau (défaut 6) | D | permit signé pour Ethereum pendant qu'on est sur Avalanche | **Contrôlé** (D6a) |
| EIP-712 `domain.verifyingContract` | ce jeton, par son adresse (défaut 3) | D | permit d'un faux jeton | En partie, comme D3a |
| Permit `value` | seulement ce montant (défaut 2) | E | illimité | **Contrôlé**, sans correction possible (D2b) |
| Permit `spender` | à qui | **X** | adresse quelconque | **Contrôlé par un détecteur**, pas par la phrase (M1c). Message affiché : texte technique brut |
| Permit `deadline` | durée de validité de la signature (manque) | D | signature utilisable pendant 10 ans | **Non contrôlé** : « Ça correspond » (D1b). Le moteur lève `far_expiry`, sans effet sur la réponse |
| Permit `owner`, `nonce` | depuis ce compte ; rejeu | D | – | Non comparés. Le portefeuille signe pour son propre compte |
| DAI `allowed` (tout ou rien), `expiry` (0 = jamais) | montant ; durée | D | `allowed = true` est un droit illimité | Montant contrôlé (lu dans `typedFacts`). Durée non contrôlée |
| Permit2 `PermitSingle.details.amount` (uint160) | seulement ce montant (défaut 2) | E | uint160 max | **Contrôlé** (D2c) |
| Permit2 `details.expiration` (uint48) | pas un droit durable (défaut 1) | D | 50 USDC, mais le droit n'expire jamais | **Non contrôlé** : « Ça correspond » (D1a) |
| Permit2 `sigDeadline` | durée de validité de la signature | D | 10 ans | **Non contrôlé** (D1c) |
| Permit2 `details.token`, `PermitBatch.details[]` | ce jeton ; rien d'autre dans le lot (défaut 8) | D | un second jeton dans le lot | Chaque entrée est comparée au jeton écrit (lu dans le code) |
| Permit2 `PermitTransferFrom.permitted.amount` | seulement ce montant | E | 5 000 au lieu de 50 | **Contrôlé** (M10) |
| Permit2 transfert signé : destinataire `to` | ce que je cède va où | **X** | le `to` n'est pas dans la signature : celui qui l'exécute le choisit | **Invérifiable** à la signature. Le moteur le sait (`permit2_transfer_destination_chosen_by_spender`) |
| Permit2 `witness`, `witnessTypeString` | ce que la signature engage en plus | X | un ordre caché dans le témoin | Invérifiable sans connaître le protocole |

### 5. Signatures de texte

Sources : [EIP-191](https://eips.ethereum.org/EIPS/eip-191), [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361), [MetaMask, méthodes de signature](https://docs.metamask.io/wallet/concepts/signing-methods/).

| Demande, paramètre | Dimension | Qui le sait | Exemple de trahison | Aujourd'hui |
|---|---|---|---|---|
| SIWE `domain`, `URI` | je me connecte à CE site | D | message d'un autre site | **Contrôlé** : sans fenêtre seulement si le domaine et l'URI sont ceux de l'onglet (`signIn`, lu) |
| SIWE `Resources`, `statement`, `Expiration Time`, `Chain ID` | ce que la session autorise, combien de temps | D | une ressource qui donne un droit ; session sans fin | **Non contrôlé** : une connexion reconnue passe sans fenêtre, ces champs ne sont pas lus |
| `personal_sign` : texte | je signe ce que je lis | E en partie | texte qui vaut ordre ou autorisation | Texte lu par le moteur ; texte illisible : « ne correspond pas » (M7) |
| `eth_sign` : empreinte de 32 octets | je ne signe rien d'illisible | D | l'empreinte d'une transaction | **Contrôlé** : toujours « ne correspond pas » (M7) |

### 6. Lots et comptes programmables

Sources : [EIP-5792](https://eips.ethereum.org/EIPS/eip-5792), [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702), [EIP-4337](https://eips.ethereum.org/EIPS/eip-4337), [Multicall3](https://github.com/mds1/multicall/blob/main/src/Multicall3.sol).

| Demande, paramètre | Dimension | Qui le sait | Exemple de trahison | Aujourd'hui |
|---|---|---|---|---|
| `wallet_sendCalls.calls[]` : un droit en plus | rien d'autre dans le lot (défaut 8) | D | approve 50 + échange + droit illimité sur USDT | **Contrôlé** (D8a) |
| `wallet_sendCalls.calls[]` : un envoi en plus | rien d'autre dans le lot (défaut 8) | D | approve 50 + échange + envoi de 300 USDT à un tiers | **Non contrôlé** : « Ça correspond » (D8b) |
| `calls[].value` | aucune monnaie du réseau en plus (défaut 9) | D | 1 AVAX joint à un appel | Non contrôlé pour un échange (même règle que D9a) |
| `calls[].capabilities`, `capabilities` | réglages cachés (payeur de frais, délégation) | D | une capacité qui change qui exécute | **Non lu** : `slimBody` et `txFacts` ne gardent que `to`, `value`, `data`, `input` |
| `chainId`, `from`, `atomicRequired` | réseau ; compte ; tout ou rien | D | lot non atomique : le droit passe, l'échange échoue | Non comparés |
| plus de 64 appels (moteur), plus de 256 (décideur) | – | – | – | « pas pu vérifier » (S8, relu) |
| `multicall(bytes[])`, `aggregate3` : appels internes | rien d'autre dans le lot (défaut 8) | D | échange + `sweepToken` vers un tiers | Trahison signalée (D8c), mais la demande conforme donne « pas pu vérifier » : multicall V3 non lu en entier |
| EIP-7702 `address` (code délégué), `chain_id` (0 = toutes les chaînes), `nonce` | personne ne prend la main (défaut 10) | D | délégation valable partout | **Contrôlé** (D10a). La norme dit qu'un portefeuille ne doit pas proposer cette signature à un site |
| ERC-4337 `sender`, `callData`, `factory`/`initCode`, `paymaster…`, gaz | tout ce qu'une transaction engage, plus qui paie | D | `callData` qui fait autre chose | **En partie** : toujours « pas pu vérifier », sans question (D10d). Le `callData` n'est pas lu |
| Safe `addOwnerWithThreshold`, `transferOwnership`, `upgradeTo`, modules | personne ne prend la main (défaut 10) | D | ajout d'un signataire | **Contrôlé** (D10b, D10c) |

### 7. Réglages du portefeuille

Sources : [EIP-3085](https://eips.ethereum.org/EIPS/eip-3085), [EIP-3326](https://eips.ethereum.org/EIPS/eip-3326), [EIP-2255](https://eips.ethereum.org/EIPS/eip-2255), [ERC-7715 (brouillon)](https://eips.ethereum.org/EIPS/eip-7715), [EIP-747](https://eips.ethereum.org/EIPS/eip-747).

| Demande, paramètre | Dimension | Qui le sait | Exemple de trahison | Aujourd'hui |
|---|---|---|---|---|
| `wallet_addEthereumChain` : `chainId`, `rpcUrls`, `nativeCurrency.symbol`, `chainName` | aucun réglage changé (défaut 12) | D | Avalanche « ajouté » avec un nœud du site, qui peut mentir sur les soldes | **En partie** : retenu, « pas pu vérifier », 30 s, sans question (D12a). Le moteur a la bonne phrase |
| `wallet_switchEthereumChain` : `chainId` | sur ce réseau (défaut 6) | D | bascule vers une chaîne où le même jeton ne vaut rien | **Non retenu** (`inject.js`, liste `GATED`) |
| `wallet_requestPermissions`, `eth_requestAccounts` | qui voit mes comptes | D | – | Non retenus (journal seulement) |
| ERC-7715 : `permission.type`, `permission.data`, `rules` (dont l'échéance), `to` (compte de session) | rien de récurrent (défaut 11) | D | 50 USDC par jour pendant 10 ans | `wallet_grantPermissions` : **en partie**, « pas pu vérifier » sans question (D11a). Le nom actuel du brouillon, `wallet_requestExecutionPermissions`, **n'est pas dans la liste retenue** |
| `wallet_watchAsset` : `options.address`, `symbol` | ce jeton, par son adresse (défaut 3) | D | un faux USDC ajouté à la liste du portefeuille | **Non retenu** |
| `eth_decrypt`, `eth_getEncryptionPublicKey`, `wallet_requestSnaps` | pas de lecture de mes secrets, pas de module installé | D | – | Retenus, « pas pu vérifier » |

### 8. Échanges

Sources : [Uniswap V2 Router](https://github.com/Uniswap/v2-periphery/blob/master/contracts/interfaces/IUniswapV2Router01.sol), [V3 ISwapRouter](https://github.com/Uniswap/v3-periphery/blob/main/contracts/interfaces/ISwapRouter.sol), [Universal Router, Commands](https://github.com/Uniswap/universal-router/blob/main/contracts/libraries/Commands.sol), [Dispatcher](https://github.com/Uniswap/universal-router/blob/main/contracts/base/Dispatcher.sol).

| Paramètre | Dimension | Qui le sait | Exemple de trahison | Aujourd'hui |
|---|---|---|---|---|
| `amountIn` / `amountInMax` | combien je donne | E | « 50 USDC », l'appel en échange 5 000 | **Non contrôlé** quand le moteur sait lire l'appel : « Ça correspond » (E1b). Contrôlé seulement par la simulation (S1) |
| `path[0]` / `tokenIn`, ou `value` | quel jeton je donne, dans quel sens | E | « vendre 50 USDC », l'appel vend 50 AVAX | **Non contrôlé** (E6b) |
| dernier jeton de `path` / `tokenOut` | contre quoi (manque) | E | « contre AVAX », l'appel rend un jeton inconnu | **Non contrôlé** (E4). Même avec simulation (S4), et un faux jeton nommé « AVAX » passe (S5) |
| `amountOutMin` / `amountOutMinimum` | combien au minimum (manque) | E si la personne l'écrit, sinon D | minimum à zéro : un robot prend tout l'écart | **Non contrôlé** : « Ça correspond », avec la ligne « tu reçois seulement rien en échange » (E5a). Un minimum écrit n'est pas lu (E5b). Simulation : 0,000001 AVAX reçu passe (S3) |
| `to` / `recipient` | ce que j'obtiens arrive chez moi (défaut 5) | D | la sortie part chez un tiers | **Contrôlé** si le routeur est dans les réglages (D5a) ou par simulation (S2). Sinon **en partie** (D5b) |
| `deadline` | durée de validité (manque) | D | transaction exécutable dans 10 ans, à un prix d'aujourd'hui | **Non contrôlé** (M12) |
| jetons intermédiaires de `path` | par où ça passe | X | passage par un jeton piégé | **Non contrôlé** (M11). Le minimum reçu est la vraie protection |
| Universal Router : `recipient` de chaque commande (`SWEEP`, `TRANSFER`, `PAY_PORTION`, `UNWRAP_WETH`), `payerIsUser` | défauts 5 et 8, et frais | D | une part de la sortie versée à un tiers | Lu par le moteur. Non essayé ici par paire (voir Limites) |
| le contrat du routeur (`to`) | à qui je parle | **X** | – | Liste locale seulement |

### 9. Ordres hors chaîne (Seaport)

Source : [documentation Seaport](https://github.com/ProjectOpenSea/seaport/blob/main/docs/SeaportDocumentation.md).

| Paramètre | Dimension | Qui le sait | Exemple de trahison | Aujourd'hui |
|---|---|---|---|---|
| `offer[]` (`token`, `identifierOrCriteria`, quantités) | cet objet, rien d'autre (défauts 4 et 8) | E | un second NFT dans l'offre | **Aveugle** (D4b). Type 4 ou 5 = « n'importe lequel de la collection » : non essayé |
| `consideration[].startAmount` / `endAmount` | combien je reçois (manque) | E | « pour 2 AVAX », l'ordre dit 1,9 | **Aveugle** (M2b). Un prix presque nul est signalé (M2a) |
| `consideration[].recipient` | ce que j'obtiens arrive chez moi (défaut 5) | D | le prix est versé à un tiers | Signalé par le moteur (D5d) |
| `startTime`, `endTime` | durée de validité (manque) | D | ordre valable 10 ans | **Aveugle** (M3) |
| `zone`, `orderType`, `conduitKey`, `counter`, `salt` | qui peut refuser ou exécuter | X | – | Non comparés |

Toute la famille « vendre mon NFT pour 2 AVAX » donne « pas pu vérifier » en mode mots-clés : la phrase n'est pas comprise (relance « Que veux-tu faire, et pour combien ? »).

### 10. Dépôts, emprunts, ponts, votes

Sources : [Aave V3 Pool](https://aave.com/docs/aave-v3/smart-contracts/pool), [Aave, délégation de crédit](https://github.com/aave/aave-v3-core/blob/master/contracts/interfaces/ICreditDelegationToken.sol), [Circle CCTP](https://developers.circle.com/cctp/references/contract-interfaces), [LayerZero OFT](https://docs.layerzero.network/v2/developers/evm/oft/quickstart), [EIP-5805](https://eips.ethereum.org/EIPS/eip-5805).

| Demande, paramètre | Dimension | Qui le sait | Exemple de trahison | Aujourd'hui |
|---|---|---|---|---|
| `supply(asset, amount, onBehalfOf)` | ce que j'obtiens arrive chez moi (défaut 5) | D | le dépôt est crédité à un tiers | **Aveugle** : phrase « déposer… » non comprise (D5f) |
| `withdraw(asset, amount, to)` | idem | D | retrait vers un tiers | Trahison signalée, conforme « pas pu vérifier » (D5e) |
| `borrow(…, onBehalfOf)`, `approveDelegation(delegatee, amount)` | personne n'emprunte à mon nom (défaut 10 élargi) | D | un tiers emprunte sur ma garantie | Trahison signalée, conforme « pas pu vérifier » (M9) |
| pont : `destinationDomain` / `dstEid` | sur quel réseau ça arrive | E | « vers Ethereum », l'appel dit Base | **Aveugle** (M6) |
| pont : `mintRecipient` / `to` (bytes32) | ce que j'obtiens arrive chez moi (défaut 5) | D | arrivée chez un tiers | Trahison signalée, conforme « pas pu vérifier » (M5) |
| pont : `destinationCaller`, `composeMsg`, `minAmountLD`, `maxFee` | qui exécute à l'arrivée ; minimum ; frais | X / D | – | Non lus |
| `delegate(delegatee)`, `delegateBySig(delegatee, nonce, expiry)` | personne ne décide à ma place (défaut 10 élargi) | D | mes voix données à un tiers | **En partie** : « pas pu vérifier » (M8) |

### 11. Une phrase, plusieurs demandes (règle du produit, `gatekeeper.js`, 90 s)

| Deuxième demande, après un approve conforme | Aujourd'hui (`operation.txt`) |
|---|---|
| Échange conforme de 50 USDC | « Ça correspond », part seul (O1) |
| Envoi de 50 USDC à un tiers | **« Ça correspond », part seul, sans question** (O2) |
| Échange de 5 000 USDC | **« Ça correspond », part seul, sans question** (O3) |
| `setApprovalForAll`, second approve, autre jeton, monnaie du réseau | « Ça ne correspond pas » (O4 à O7) |

## (c) Ce qui manque, ce qui est redondant, ce qui ne peut pas être prouvé

### 0. Bloquant, hors intention : le build autonome plante

`extension_standalone/extension/engine/sentinelle_core.js` ligne 497 déclare `const niveau`, ligne 512 lui réaffecte une valeur. Erreur réelle : `erreur interne du moteur : Assignment to constant variable.` Elle touche toute demande sans signal (paiement simple, échange, droit exact vers un routeur déclaré). Résultat dans le zip : « Je n'ai pas pu vérifier », 30 s, **sans que la question soit posée**. Le build ne dit donc jamais « Ça correspond » pour une demande propre (`resume.txt`, moteur `embarque` : 1 paire contrôlée sur 58, 39 aveugles). `server/server.mjs` a `let` : le mode serveur n'est pas touché. L'erreur est dans le dépôt (commit `0029cfc`), dans `src/sentinelle_core.js` et dans `extension_sans_reseau/`. Échec fermé, donc pas de fuite, mais la démo autonome ne peut pas montrer le cas vert.

### 1. Ce qui manque dans l'hypothèse

| Manque | Pourquoi c'est une dimension d'intention | Essai |
|---|---|---|
| **A. La nature de l'opération** | « échanger » n'est pas « envoyer ». Le montant et le jeton peuvent être justes et l'opération fausse | E6a, O2 |
| **B. Le sens** | donner 50 USDC n'est pas recevoir 50 USDC, ni donner 50 AVAX | E6b |
| **C. La contrepartie** | « contre AVAX » est écrit et n'est pas lu. C'est une dimension explicite | E4, S4, S5 |
| **D. Le prix ou le minimum reçu** | sans plancher, un échange « conforme » peut ne rien rendre. Défaut si non écrit (proche du cours), explicite si écrit | E5a, E5b, S3, M2b |
| **E. La durée de validité de ce que je signe** | différent du défaut 1 : un ordre ou un permit valable 10 ans peut être exécuté quand le prix a changé | D1b, D1c, M3, M12 |
| **F. Les frais** | frais de réseau gonflés, part prélevée (`PAY_PORTION`) | M4 |
| **G. Le réseau d'arrivée d'un pont** | la personne le sait et l'écrit (« vers Ethereum ») | M6 |
| **H. Le vocabulaire des intentions** | cinq types seulement (payer, envoyer chez moi, acheter ou échanger, me connecter, on me l'a demandé). Déposer, retirer, emprunter, ponter, vendre un NFT, voter, réclamer ne sont pas compris en mode mots-clés | D4b, D5e, D5f, M9 |

### 2. Ce qui est redondant ou mal découpé

- Défauts 1 et 11 : « pas un droit durable » et « rien de récurrent » sont la même promesse (rien ne continue après cette opération). À fusionner, puis à séparer de la durée de validité (manque E).
- Défauts 4 et 8 : « seulement cet objet » et « rien d'autre dans le lot » sont la même promesse (rien de plus que ce que j'ai dit), vue sur un NFT ou sur un lot.
- Défauts 6 et 12 : changer de réseau et ajouter un réseau touchent le même réglage. Le défaut 12 doit garder ce qui n'est pas le réseau (permissions, jeton ajouté, module installé).
- Défaut 9 est un cas du défaut 8 (la monnaie du réseau est une sortie de plus). À garder à part quand même : le code le traite à part et il est troué.
- Défaut 7 n'apporte presque rien : le portefeuille signe pour son compte actif. À garder en dernier.

### 3. Ce qu'une phrase ne peut pas prouver

| Dimension | Pourquoi | D'où doit venir le signal |
|---|---|---|
| **À quel contrat le droit est donné** (`spender`, `to`) | la personne ne connaît pas l'adresse du routeur. Aujourd'hui un droit de 50 USDC vers n'importe quelle adresse « correspond » (M1a, M1b) | liste publique de protocoles par chaîne (`pipeline/known_protocols.json` existe), cohérence dans l'opération (le contrat qui reçoit le droit doit être celui de l'appel suivant), âge et code du contrat. Sinon l'écrire dans la ligne et ne pas passer seul |
| **Ce que le contrat fera plus tard** | un contrat peut changer (proxy), ou garder un droit non utilisé | droit exact, pas de droit durable, révocation proposée. Limite à assumer |
| **L'état au moment de l'exécution** | la simulation dit ce qui se passe maintenant, pas dans trois blocs | minimum reçu et échéance courte, qui sont dans la demande elle-même |
| **Le destinataire d'un transfert signé Permit2** | il n'est pas dans la signature | toujours dit, jamais « correspond » |
| **La valeur de ce qui entre** | un jeton peut se nommer « AVAX » (S5) | jeton connu par son adresse, des deux côtés de l'échange |
| **Le jeton, pour un jeton hors liste** | huit adresses connues (Ethereum, Avalanche) | liste publique par chaîne ; sinon « pas pu vérifier », comme aujourd'hui |

### 4. La simulation ne tourne pas sur les nœuds publics

`effect_sim.js` demande `debug_traceCall` au nœud du portefeuille. Appel réel du 11 oct. 2026, lecture seule : `https://api.avax.network/ext/bc/C/rpc` répond `the method debug_traceCall does not exist`. Même réponse de `ethereum-rpc.publicnode.com` et `avalanche-c-chain-rpc.publicnode.com`. `eth_simulateV1` existe sur le nœud public Ethereum essayé, pas sur le nœud public Avalanche. Conséquence : sur Avalanche avec le réglage par défaut, un appel que le moteur ne sait pas lire reste « pas pu vérifier » (S9), et un appel qu'il sait lire n'est jamais mesuré. Les contrôles S1, S2, S6, S7, S8 n'existent donc qu'avec un nœud privé. Il faut lire les mêmes dimensions dans les données de l'appel, que le moteur décode déjà.

### 5. Points S2 et S3 du rapport de sécurité : état actuel

- **S2, jeton substitué : tient.** Un jeton hors liste ne « correspond » jamais (D3a, D3b). Reste : la contrepartie d'un échange n'a pas cette protection (S5).
- **S3, valeur native ignorée : tient pour un paiement seulement** (D9c). Pour une phrase d'échange, `txFacts` compte bien la valeur, mais `writtenCore` ne regarde les envois que si l'intention est un paiement. Un approve avec 1 AVAX joint « correspond » (D9a), un échange de jetons avec 3 AVAX joints aussi (D9b).

## (d) Proposition

### La question

Une seule question, un seul champ, comme aujourd'hui : **« Que veux-tu faire sur {site} ? »**

Ce que la personne écrit : **quoi, combien, quel jeton**, et selon le cas **à qui** (adresse collée) ou **contre quoi**. Douze mots au plus, adresse non comptée.

- Exemple du champ, qui tourne : « échanger 50 USDC contre AVAX », « payer 20 USDC à 0x… », « vendre mon NFT 12 pour 2 AVAX », « déposer 50 USDC ».
- Sous le champ, une ligne fixe, grise : **« Le reste, je le suppose : rien de plus, rien de durable, tout revient sur ton compte. »** C'est le contrat des défauts, dit une fois.
- Une seule relance, comme aujourd'hui. À ajouter aux quatre existantes : « Contre quoi ? » quand un échange ne nomme pas ce qui revient.
- Jamais demandé à la personne : l'adresse du routeur, la durée, le minimum reçu, le réseau, le compte. Si elle écrit un minimum (« au moins 1,8 AVAX ») ou un prix (« pour 2 AVAX »), il devient la borne. Si elle écrit un droit durable ou large (« sans limite », « toute ma collection », « chaque mois »), le défaut correspondant est levé pour cette demande, comme `covers()` le fait déjà pour un droit.

Dimensions explicites retenues : **action, montant donné, jeton donné, destinataire (paiement), contrepartie (échange, vente), prix ou minimum (si écrit), réseau d'arrivée (pont)**.

### La liste définitive des défauts et la phrase affichée

Un écart à un défaut est « Ça ne correspond pas », sauf si la personne l'a écrit. Une phrase par défaut.

| N° | Défaut supposé | Phrase quand il est trahi |
|---|---|---|
| 1 | C'est bien l'opération que tu as écrite (échanger n'est pas envoyer) | « Tu as écrit un échange. Cette demande envoie tes jetons sans rien te rendre. » |
| 2 | Seulement ce montant, pas plus | « Tu as écrit 50 USDC. La demande en prend 5 000. » |
| 3 | Seulement ce jeton, reconnu par son adresse | « Ce jeton s'appelle USDC mais ce n'est pas le vrai. » |
| 4 | Rien de plus : pas un autre jeton, pas un autre objet, pas toute la collection, pas un appel de plus | « La demande prend aussi autre chose : {quoi}. » |
| 5 | Aucune monnaie du réseau en plus | « La demande envoie aussi {n} AVAX que tu n'as pas écrits. » |
| 6 | Ce que tu obtiens arrive sur ton compte | « Ce que tu dois recevoir part sur un autre compte que le tien. » |
| 7 | Tu reçois bien ce que tu as écrit, à un prix normal | « Tu as écrit contre AVAX. La demande te rend {autre chose / presque rien}. » |
| 8 | Rien ne continue après cette opération (pas de droit durable, rien de récurrent) | « Ce droit ne s'arrête pas après ton opération : il dure {durée}. » |
| 9 | Ce que tu signes n'est valable que maintenant | « Cette signature reste utilisable pendant {durée}. » |
| 10 | Personne ne prend la main sur ton compte | « Cette demande donne les commandes de ton compte à quelqu'un d'autre. » |
| 11 | Sur ce réseau, depuis ce compte | « Cette demande vaut sur un autre réseau que celui où tu es. » |
| 12 | Aucun réglage de ton portefeuille ne change | « Cette demande change un réglage de ton portefeuille : {lequel}. » |
| 13 | Des frais normaux | « Cette demande te coûte {n} AVAX de frais. » |

Hors liste, dit toujours, jamais « correspond » : **le contrat qui reçoit le droit n'est pas connu** → « Tu donnes ce droit à une adresse que je ne connais pas. » et pas de passage automatique.

### Contrôles à ajouter au code, du plus dangereux au moins dangereux

| Rang | Contrôle manquant | Où | Preuve |
|---|---|---|---|
| 0 | Corriger `const niveau` → `let niveau` dans le moteur embarqué, refaire le build et le zip | `extension_standalone/src/sentinelle_core.js` l. 497 | `resume.txt`, moteur `embarque` |
| 1 | **Nature de l'opération.** Pour une phrase d'échange, tout envoi lisible (transfer, transferFrom, valeur seule) sans rien en retour est un écart. Aujourd'hui `writtenCore` ignore `facts.sends` hors paiement | `written_check.js`, `writtenCore` | E6a, O2 |
| 2 | **Deuxième demande de la même phrase.** `operationCheck` ne compare pas la nature ni, pour un appel lu par le moteur, le montant. Sans mesure, la deuxième demande doit reposer la question ou ne pas passer seule | `gatekeeper.js` (`onGate`, branche `op`), `written_check.js` | O2, O3 |
| 3 | **Montant et sens d'un échange lus dans l'appel.** Le moteur décode déjà « tu donnes 50 USDC » : comparer `eff.outgoing` au montant et au jeton écrits, sans attendre la simulation | `written_check.js` (nouvelle entrée : effets du moteur), `gatekeeper.js` | E1b, E6b |
| 4 | **Sorties en plus dans un lot et valeur native jointe**, pour toute intention et pas seulement un paiement | `written_check.js`, `writtenCore` | D8b, D9a, D9b |
| 5 | **À qui le droit est donné.** Un droit vers une adresse hors liste ne « correspond » pas : au mieux « pas pu vérifier », avec l'adresse dans la ligne. Brancher `known_protocols.json` dans le build autonome | `outcome.js`, `gatekeeper.js` | M1a, M1b |
| 6 | **Minimum reçu.** `slippage_unbounded` et un minimum nul deviennent un écart. Un minimum ou un prix écrit est extrait et comparé | `intent_text.js` (`extractFields`), `outcome.js` | E5a, E5b, S3, M2b |
| 7 | **Contrepartie.** Le jeton qui revient doit être celui écrit, connu par son adresse. Retirer la tolérance de `sameSymbol` pour un jeton non connu | `written_check.js`, `effectCheck` | E4, S4, S5 |
| 8 | **Durée.** `far_expiry`, `expiration` Permit2 lointaine, `deadline` et `sigDeadline` au-delà d'une heure : écart, avec la durée dans la phrase | `outcome.js` ou `writtenCheck` (`typedFacts` lit déjà le message) | D1a, D1b, D1c, M3, M12 |
| 9 | **Méthodes non retenues.** Ajouter `wallet_requestExecutionPermissions`, `wallet_watchAsset`, `wallet_switchEthereumChain` (au moins vers une chaîne inconnue) à `GATED`. Lire `capabilities` de `wallet_sendCalls` | `inject.js` (fichier réservé), `gatekeeper.js` (`slimBody`) | lecture de `GATED` |
| 10 | **`increaseAllowance`** : lire le droit existant (`allowance`) et comparer la somme | `written_check.js`, lecture relayée | D2d |
| 11 | **Vocabulaire.** Ajouter déposer, retirer, emprunter, ponter, vendre un objet, voter. Extraire le numéro d'un NFT | `intent_text.js`, `keyword_intent.js` | D4a, D4b, D5e, D5f, M9 |
| 12 | **Simulation sans `debug_traceCall`.** Essayer `eth_simulateV1` quand le nœud l'a ; sinon s'appuyer sur les rangs 3 à 7 | `effect_sim.js` | S9, appels réels |
| 13 | **Réglages et comptes programmables** : donner la vraie phrase au lieu de « pas pu vérifier » (réseau ajouté, permission récurrente, user operation dont le `callData` est lu) | `gatekeeper.js`, moteur | D10d, D11a, D12a |
| 14 | **Frais** : gaz × prix au-dessus d'un seuil ; `chainId` et `from` d'une transaction | `written_check.js`, `txFacts` | M4, D6b, D7 |
| 15 | **SIWE** : lire `Resources` et l'échéance avant de laisser passer sans fenêtre | `written_check.js`, `signIn` | lecture du code |

## Limites de ce travail

- Le relais Clef / Jev n'a pas été appelé. Une phrase mieux comprise réduit les cas « aveugles » des tableaux 9 et 10. Elle ne ferme aucun des rangs 1 à 10, qui sont des comparaisons absentes du code.
- Le contexte en direct du mode serveur (lecture du réseau) était coupé. Des détecteurs qui s'appuient sur l'âge d'un contrat ou un solde peuvent lever une alerte de plus sur M1a et M1b avec un nœud branché. Non mesuré.
- Les adresses de routeur et de collection sont synthétiques. « Routeur déclaré » veut dire : présent dans `knownSpenders` du contexte local.
- Non essayés par paire : Universal Router (`execute`), `PermitBatch`, ordres Seaport à critère, `eth_sendRawTransaction`, ERC-1155.
- Les listes de champs viennent des pages citées, lues le 11 oct. 2026 par un agent de recherche qui résume les pages. Avant de citer une règle dans le produit, rouvrir l'URL. ERC-7715 est un brouillon qui a changé de nom de méthode.
- Rien n'a été modifié hors de `preuves/exhaustivite/`.

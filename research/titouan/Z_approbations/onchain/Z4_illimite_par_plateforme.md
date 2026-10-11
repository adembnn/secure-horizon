# Z4. Part d'approbations ERC-20 illimitées, par plateforme (mesure en chaîne)

Date : 2026-10-11. Méthode : lecture seule de journaux publics (`eth_getLogs`, `eth_call` offre totale, `eth_getCode`). Aucun secret. Aucune adresse ni liste issue de nos jeux de test : les spenders sortent de l'échantillon lui-même.

## Ce qui est mesuré
- Événement ERC-20 `Approval` (topic0 `0x8c5be1e5…b925`), 3 topics seulement. Les Approval ERC-721 (4 topics) sont ignorés. Les valeurs nulles (révocations) sont exclues.
- Illimité : valeur >= 2^255, ou valeur >= offre totale actuelle du jeton. Borné : tout le reste.
- Une ligne du tableau compte des événements, pas des personnes. Une même personne peut peser plusieurs fois (colonne « proprio. distincts »).
- Médiane borné / offre : médiane de (montant borné) / (offre totale actuelle du jeton), entre parenthèses le nombre d'événements bornés utilisés. Elle est minuscule presque partout : un montant borné est en général le montant exact du swap, très loin de l'offre. « n/a » : aucun borné.

## Échantillon (fenêtre épinglée, graine 20261011)
| | Ethereum | C-Chain |
|---|---|---|
| fenêtre | 800 blocs isolés tirés entre le bloc 20000000 et 26165835 | 40 fenêtres de 500 blocs entre 92252253 et 97252253 |
| RPC | gateway.tenderly.co/public/mainnet | api.avax.network (journaux), avalanche-c-chain-rpc.publicnode.com (offre, code) |
| événements Approval ERC-20 | 26993 | 34393 |
| dont valeur nulle (exclus) | 5127 (19,0 %) | 13640 (39,7 %) |
| Approval ERC-721 ignorés | 752 | 313 |
| droits non nuls analysés | 21866 | 20753 |
| spenders distincts | 2250 | 398 |

Les ancrages (tête moins 1000 blocs) diffèrent du banc réel v0 car la mesure est plus récente. Fichiers : cache/*.meta.json.

## Résultats globaux (hors révocations)
| | Ethereum | C-Chain |
|---|---|---|
| part illimitée, tous droits non nuls | 47,6 % [46,9 ; 48,3] | 34,2 % [33,6 ; 34,9] |
| part des droits vers les 25 spenders les plus fréquents | 54,2 % | 76,6 % |
| dont vers spenders identifiés [V] (13 et 6 spenders) | 36,3 % (n=7940) | 22,3 % (n=4620) |
| dont vers spenders top 25 non identifiés [NV] | 17,9 % (n=3913) | 54,3 % (n=11274) |
| hors top 25 (non examinés) | 45,8 % (n=10013) | 23,4 % (n=4859) |
| % illimité chez les identifiés [V] | 56,2 % [55,1 ; 57,2] | 29,5 % [28,2 ; 30,9] |
| % illimité chez les top 25 non identifiés [NV] | 54,0 % [52,4 ; 55,6] | 38,3 % [37,4 ; 39,2] |
| % illimité hors top 25 | 38,3 % [37,4 ; 39,3] | 29,2 % [27,9 ; 30,5] |

## Tableaux par plateforme (25 spenders les plus fréquents par chaîne)
Tous les spenders listés ont un `eth_getCode` non vide (taille du code dans result_*.json, champ code_octets). Légende : [V] adresse lue dans une documentation ou un dépôt officiel du protocole, cité. [NV] non identifié : « nom du contrat vérifié » est le nom du code source publié par le déployeur sur l'explorateur, un indice, pas une identification.

### Ethereum

| # | Plateforme | Adresse | n | % illimité [Wilson 95 %] | médiane borné / offre | proprio. distincts | source de l'identification [V/NV] |
|---|---|---|---|---|---|---|---|
| 1 | Permit2 (Uniswap) | `0x000000000022d473030f116ddee9f6b43ac78ba3` | 2384 | 79,0 % [77,3 ; 80,6] | 1,0e-6 (499) | 1914 | [V] docs.0x.org/docs/core-concepts/contracts.md : « Permit2 is deployed to 0x0000…8BA3 across all chains » (doc d'un tiers, pas de Uniswap) |
| 2 | Uniswap V2 Router02 | `0x7a250d5630b4cf539739df2c5dacb4c659f2488d` | 1499 | 55,9 % [53,4 ; 58,4] | 4,8e-3 (630) | 1083 | [V] docs.uniswap.org/contracts/v2/reference/smart-contracts/v2-deployments |
| 3 | 1inch Aggregation Router v6 | `0x111111125421ca6dc452d289314280a0f8842a65` | 1047 | 36,6 % [33,7 ; 39,5] | 1,2e-7 (664) | 502 | [V] github.com/1inch/limit-order-protocol README, tableau Ethereum mainnet |
| 4 | 0x / Matcha AllowanceHolder | `0x0000000000001ff3684f28c67538d4d072c22734` | 855 | 48,9 % [45,6 ; 52,2] | 2,1e-7 (437) | 547 | [V] github.com/0xProject/0x-settler README et docs.0x.org/docs/core-concepts/contracts.md |
| 5 | non identifié | `0x40aa958dd87fc8305b97f2ba922cddca374bcd7f` | 793 | 74,5 % [71,4 ; 77,4] | 1,2e-6 (202) | 682 | [NV] nom du contrat vérifié « TokenApprove » (indice seulement, aucune doc lue) |
| 6 | non identifié | `0x1111111254eeb25477b68fb85ed929f73a960582` | 570 | 28,2 % [24,7 ; 32,1] | 3,4e-7 (408) | 322 | [NV] nom du contrat vérifié « AggregationRouterV5 » ; adresse absente des docs lues |
| 7 | MetaMask Swaps (MetaSwap) | `0x881d40237659c251811cec9c364ef91dc08d300c` | 479 | 61,6 % [57,2 ; 65,8] | 6,0e-8 (182) | 441 | [V] github.com/MetaMask/metamask-extension, shared/constants/swaps.ts, MAINNET_CONTRACT_ADDRESS |
| 8 | non identifié | `0x80a64c6d7f12c47b7c66c5b4e20e72bc1fcd5d9e` | 435 | 100,0 % [99,1 ; 100,0] | n/a (0) | 410 | [NV] source non vérifiée sur l'explorateur |
| 9 | non identifié | `0xdac991621fd8048d9f235324780abd6c3ad26421` | 395 | 0,0 % [0,0 ; 1,0] | 4,1e-7 (395) | 1 | [NV] nom du contrat vérifié « Migrator » |
| 10 | non identifié | `0xc465cc50b7d5a29b9308968f870a4b242a8e1873` | 338 | 100,0 % [98,9 ; 100,0] | n/a (0) | 331 | [NV] source non vérifiée |
| 11 | non identifié | `0x905373b191a418b214b64b324de2b8c3d60bc935` | 299 | 100,0 % [98,7 ; 100,0] | n/a (0) | 1 | [NV] nom du contrat vérifié « BPool » |
| 12 | LI.FI Diamond | `0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae` | 296 | 9,5 % [6,6 ; 13,3] | 1,3e-8 (268) | 228 | [V] github.com/lifinance/contracts, deployments/mainnet.json |
| 13 | KyberSwap MetaAggregationRouterV2 | `0x6131b5fae19ea4f9d964eac0408e4408b66337b5` | 253 | 36,8 % [31,1 ; 42,9] | 4,0e-8 (159) | 124 | [V] docs.kyberswap.com/developer-guide/aggregator-api/contracts |
| 14 | Uniswap V3 SwapRouter | `0xe592427a0aece92de3edee1f18e0157c05861564` | 248 | 50,4 % [44,2 ; 56,6] | 2,9e-8 (123) | 91 | [V] docs Uniswap, déploiements V3 Ethereum |
| 15 | non identifié | `0xb300000b72deaeb607a12d5f54773d1c19c7028d` | 226 | 59,7 % [53,2 ; 65,9] | 2,9e-9 (91) | 130 | [NV] nom du contrat vérifié « Diamond » |
| 16 | non identifié | `0x4cd00e387622c35bddb9b4c962c136462338bc31` | 222 | 4,1 % [2,1 ; 7,5] | 2,1e-9 (213) | 138 | [NV] nom du contrat vérifié « RelayDepository » ; docs.relay.link ne publie pas l'adresse sur la page lue |
| 17 | CoW Protocol GPv2VaultRelayer | `0xc92e8bdf79f0507f65a392b0ab4667716bfe0110` | 207 | 67,6 % [61,0 ; 73,6] | 2,5e-6 (67) | 186 | [V] docs.cow.fi/cow-protocol/reference/contracts/core et github.com/cowprotocol/contracts networks.json |
| 18 | Pendle Router V4 | `0x888888888889758f76e7103c6cbf23abbf58f946` | 198 | 14,6 % [10,4 ; 20,2] | 1,5e-5 (169) | 192 | [V] github.com/pendle-finance/pendle-core-v2-public, deployments/1-core.json |
| 19 | non identifié | `0x8157a9d65807521fbb8db8f37eeecefdd247e9b1` | 190 | 24,7 % [19,1 ; 31,3] | 2,8e-7 (143) | 65 | [NV] source non vérifiée |
| 20 | Uniswap SwapRouter02 | `0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45` | 175 | 65,7 % [58,4 ; 72,3] | 4,7e-7 (60) | 110 | [V] docs Uniswap, déploiements V3 Ethereum |
| 21 | Aave V3 Pool | `0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2` | 163 | 28,8 % [22,4 ; 36,2] | 1,1e-6 (116) | 116 | [V] github.com/bgd-labs/aave-address-book, AaveV3Ethereum.sol (POOL) |
| 22 | non identifié | `0xdef1c0ded9bec7f1a1670819833240f027b25eff` | 159 | 61,6 % [53,9 ; 68,8] | 9,7e-7 (61) | 118 | [NV] aucune doc lue (le nom affiché par l'explorateur est incohérent) |
| 23 | non identifié | `0x777777777777aec03fd955926dbf81597e66834c` | 144 | 0,0 % [0,0 ; 2,6] | 3,0e-12 (144) | 144 | [NV] nom du contrat vérifié « SingletonPaymasterV7 » |
| 24 | non identifié | `0x297e5e83dba6304030f291abb1ddd9546e984549` | 142 | 0,0 % [0,0 ; 2,6] | 1,1e-10 (142) | 142 | [NV] source non vérifiée |
| 25 | Balancer V2 Vault | `0xba12222222228d8ba445958a75a0704d566bf2c8` | 136 | 47,8 % [39,6 ; 56,1] | 2,0e-7 (71) | 46 | [V] github.com/balancer/balancer-deployments, v2 vault, mainnet.json |

### C-Chain

| # | Plateforme | Adresse | n | % illimité [Wilson 95 %] | médiane borné / offre | proprio. distincts | source de l'identification [V/NV] |
|---|---|---|---|---|---|---|---|
| 1 | non identifié | `0x5485a0751a249225d3ba2f6f296551507e22547f` | 2404 | 0,9 % [0,6 ; 1,3] | 9,8e-8 (2383) | 7 | [NV] nom du contrat vérifié « SwapRouter » |
| 2 | non identifié | `0x0b4478e810d48b5882d4019d435a2f864bab4f39` | 1585 | 24,2 % [22,1 ; 26,3] | 3,8e-7 (1202) | 58 | [NV] nom « RamsesV3PositionManager » |
| 3 | KyberSwap MetaAggregationRouterV2 | `0x6131b5fae19ea4f9d964eac0408e4408b66337b5` | 1377 | 11,5 % [10,0 ; 13,3] | 3,1e-8 (1218) | 134 | [V] docs.kyberswap.com/developer-guide/aggregator-api/contracts (même adresse sur les chaînes listées) |
| 4 | non identifié | `0x757121c9a8259c4d6b6956c283355b2902a6baa2` | 1130 | 99,6 % [99,0 ; 99,8] | 2,0e-7 (5) | 11 | [NV] nom « Router » |
| 5 | Permit2 (Uniswap) | `0x000000000022d473030f116ddee9f6b43ac78ba3` | 1123 | 80,6 % [78,2 ; 82,8] | 7,5e-8 (218) | 76 | [V] docs.0x.org : même adresse sur toutes les chaînes (doc d'un tiers) |
| 6 | non identifié | `0xfd1c727d8a2259493c66899f478ebfea41329545` | 1097 | 0,0 % [0,0 ; 0,3] | 2,8e-8 (1097) | 18 | [NV] nom « NonfungiblePositionManager » |
| 7 | Uniswap SwapRouter02 | `0xbb00ff08d01d300023c629e8ffffcb65a5a578ce` | 868 | 24,2 % [21,5 ; 27,2] | 1,0e-6 (658) | 25 | [V] docs Uniswap, déploiements V3 Avalanche |
| 8 | 0x / Matcha AllowanceHolder | `0x0000000000001ff3684f28c67538d4d072c22734` | 741 | 5,9 % [4,5 ; 7,9] | 7,8e-8 (697) | 74 | [V] github.com/0xProject/0x-settler README : Avalanche listée |
| 9 | non identifié | `0xabfc48e8bed7b26762745f3139555f320119709d` | 723 | 48,8 % [45,2 ; 52,5] | 1,3e-7 (370) | 17 | [NV] nom « SwapRouter » |
| 10 | non identifié | `0x9357e52260bd5a4c704c02a285608ba6698f405f` | 606 | 100,0 % [99,4 ; 100,0] | n/a (0) | 1 | [NV] source non vérifiée, code de 87 octets |
| 11 | non identifié | `0x3fed017ec0f5517cdf2e8a9a4156c64d74252146` | 551 | 8,7 % [6,6 ; 11,4] | 4,1e-5 (503) | 27 | [NV] nom « NonfungiblePositionManager » |
| 12 | non identifié | `0x60ae616a2155ee3d9a68541ba4544862310933d4` | 497 | 28,4 % [24,6 ; 32,5] | 2,4e-7 (356) | 80 | [NV] nom « JoeRouter02 » ; la page LFJ (developers.lfj.gg) a répondu 403 |
| 13 | non identifié | `0xd6f5fe1250363a75319d10ae4981aa5aa62ddfb0` | 471 | 100,0 % [99,2 ; 100,0] | n/a (0) | 4 | [NV] proxy transparent |
| 14 | non identifié | `0xcce9174424bdd18ef444846bdaccecd8ebbad550` | 361 | 100,0 % [98,9 ; 100,0] | n/a (0) | 1 | [NV] source non vérifiée |
| 15 | Uniswap Universal Router | `0x94b75331ae8d42c1b61065089b7d48fe14aa73b7` | 335 | 0,0 % [0,0 ; 1,1] | 5,4e-7 (335) | 1 | [V] docs Uniswap, déploiements V3 Avalanche |
| 16 | non identifié | `0x40aa958dd87fc8305b97f2ba922cddca374bcd7f` | 315 | 51,7 % [46,2 ; 57,2] | 2,2e-7 (152) | 46 | [NV] nom « TokenApprove » |
| 17 | non identifié | `0x5acc35397d2ce81ac54a4b1c6d9e1fb29f8ec6c6` | 245 | 2,9 % [1,4 ; 5,8] | 5,3e-6 (238) | 7 | [NV] nom « UniversalRouter » ; adresse absente de la liste Uniswap lue |
| 18 | non identifié | `0x20f6ee51340adeed01a59b0e65cb3703f3dc860c` | 223 | 40,8 % [34,6 ; 47,4] | 1,3e-8 (132) | 24 | [NV] nom « DexAggregator » |
| 19 | non identifié | `0x18556da13313f3532c54711497a8fedac273220e` | 203 | 62,6 % [55,7 ; 68,9] | 4,0e-7 (76) | 20 | [NV] nom « LBRouter » ; page LFJ en 403 |
| 20 | non identifié | `0x26a56f289eb7fc3c11e6f656bf3286f3ddb27b6c` | 188 | 100,0 % [98,0 ; 100,0] | n/a (0) | 127 | [NV] source non vérifiée |
| 21 | non identifié | `0x671094c35c94814bd53eceabd44991e5a846609a` | 184 | 100,0 % [98,0 ; 100,0] | n/a (0) | 1 | [NV] source non vérifiée |
| 22 | Velora / ParaSwap Augustus v6.2 | `0x6a000f20005980200259b80c5102003040001068` | 176 | 26,7 % [20,7 ; 33,7] | 5,9e-8 (129) | 30 | [V] developers.velora.xyz/augustus-swapper/augustus-v6.2-smart-contracts (Avalanche listée) |
| 23 | non identifié | `0xb304f8caec0350ab3ccda10d8d7acdc993fc8dfb` | 175 | 0,0 % [0,0 ; 2,1] | 5,0e-4 (175) | 1 | [NV] source non vérifiée |
| 24 | non identifié | `0x4cd00e387622c35bddb9b4c962c136462338bc31` | 172 | 0,0 % [0,0 ; 2,2] | 1,3e-8 (172) | 40 | [NV] nom « RelayDepository » |
| 25 | non identifié | `0xc8b8fcbdb5c019d7802ffb0b39603395d7d3915c` | 144 | 34,7 % [27,4 ; 42,8] | 4,0e-7 (94) | 17 | [NV] nom « SwapRouter » |

## Lecture
- Les chiffres par plateforme décrivent ce que le contrat spender reçoit. Ils ne disent pas ce que l'interface demande par défaut.
- Un spender de type Permit2 ou AllowanceHolder reçoit une approbation de jeton, puis les montants se règlent par signature ou par appel. Son taux illimité est donc très différent de celui d'un routeur direct.
- Les taux sont proches de 0 % ou de 100 % pour plusieurs spenders non identifiés. Ces spenders ont souvent un seul propriétaire ou très peu de jetons : ce sont des bots ou des contrats à usage unique, pas des plateformes grand public.

## Limites
1. L'échantillon montre ce que les contrats reçoivent, pas le défaut de l'interface. Un portefeuille, un routeur ou le choix de l'utilisateur peut avoir changé le montant.
2. Un spender peut recevoir des approbations de plusieurs interfaces (par exemple Uniswap, Matcha et des portefeuilles qui appellent le même routeur). On ne peut pas attribuer une approbation à une interface.
3. Routeur contre agrégateur : approuver un routeur d'agrégateur (1inch, Kyber, Velora) n'est pas la même décision qu'approuver un contrat de pool. La ligne reflète le contrat, pas le produit entier.
4. Identification : seules les adresses [V] sont attribuées. Beaucoup d'adresses [NV] sont de vraies plateformes (le nom de contrat l'indique parfois) mais non vérifiées par une doc lue. Le chiffre « identifiés » est donc un plancher.
5. « Illimité » utilise l'offre actuelle du jeton (état à la date de la mesure) et pas l'offre à la date de l'approbation. Les jetons à offre variable (rebase) peuvent être mal classés. Un jeton sans fonction totalSupply est jugé uniquement par le seuil 2^255.
6. Les événements dépendent du jeton : certains jetons n'émettent pas d'Approval lors d'un transferFrom, d'autres oui (effets de bord). Un Approval n'est pas toujours un acte de la personne.
7. Blocs aléatoires : Ethereum 800 blocs isolés sur environ 6 millions de blocs, C-Chain 40 fenêtres de 500 blocs sur 5 millions de blocs. Les fenêtres C-Chain sont corrélées (une campagne ou un bot peut peser fort). Les intervalles de Wilson supposent l'indépendance, ce qui est faux ici (mêmes propriétaires et jetons répétés). Les lire comme une borne basse de l'incertitude.
8. Les doublons ne sont pas retirés : une personne qui approuve 20 fois pèse 20 fois.
9. La C-Chain a une part de révocations (valeur nulle) bien plus forte que l'Ethereum dans l'échantillon, ce qui peut refléter des outils de nettoyage automatiques.

## Rejouer
```
cd research/titouan/Z_approbations/onchain
node fetch.mjs eth 800        # journaux Approval, blocs tirés (graine 20261011), cache dans cache/ (ignoré par git)
node fetch.mjs avax 40        # 40 fenêtres de 500 blocs
node analyse.mjs eth          # agrégation, top 25, offre, eth_getCode -> result_eth.json
node analyse.mjs avax         # -> result_avax.json
node build.mjs                # régénère ce fichier (libellés V/NV dans build.mjs)
```
Un seul processus node à la fois. Le RPC avax.network bannit les rafales (erreur 1015) : relancer plus tard ou réduire la concurrence.

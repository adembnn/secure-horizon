# Réduction des avertissements réels : avant / après (correctif F34)

Mesure en lecture seule, Node 24, aucune dépendance, aucun secret. Moteur figé après ce travail.

## Résumé
- Gain mesuré, mode A (nu) : **C-Chain 78,74 % vers 75,73 % d'avertissements (moins 3,0 points, 190 transactions)**, Ethereum 32,87 % vers 32,23 % (moins 0,6 point, 38 transactions).
- Rouges inchangés : C-Chain 19 sur 6 325 (0,30 %), Ethereum 200 sur 6 000 (3,33 %).
- **Zéro violation** sur les 4 séries (C-Chain A et B, Ethereum A et B) : aucun rouge ne descend, aucun orange avec preuve d'effet ne descend, aucun vert créé. Les appels levés passent en « info » avec le drapeau `effect_decoded_limited`.
- Détection inchangée : attacks/DEV.jsonl (385 cas, 0 différence de niveau), attacks_public (mêmes attrapés, 57/65, 62/65, 62/65), redteam/V2_DEV_norm.jsonl (0 changement).
- Le gain est faible, et c'est le résultat honnête : l'essentiel de l'opacité réelle est du trafic de robots que rien ne permet de lire sans faire confiance à un contrat.
- Note sur la baseline : le rapport REALTRAFFIC.md donnait 76,84 % sur la C-Chain. Le moteur actuel (règle F23 « adresse sosie faible » ajoutée depuis) donne 78,74 % avant mon changement. Les 120 transactions en plus sont des envois de 1 wei depuis des adresses à préfixe et suffixe imités (empoisonnement d'adresse réel), pas de l'opacité. Je ne les ai pas touchées.

## Avant / après (Wilson non recalculé, mêmes échantillons)
| | C-Chain A | C-Chain B | Ethereum A | Ethereum B |
|---|---|---|---|---|
| n | 6 325 | 6 325 | 6 000 | 6 000 |
| avertissements avant | 78,74 % | 77,82 % | 32,87 % | 30,98 % |
| avertissements après | 75,73 % | 74,91 % | 32,23 % | 30,52 % |
| rouges avant / après | 19 / 19 | 18 / 18 | 200 / 200 | 114 / 114 |
| info avant / après | 0,21 % / 3,21 % | 0,30 % / 3,21 % | 1,07 % / 1,70 % | 2,23 % / 2,70 % |
| vert avant / après | 20,76 % / 20,76 % | 21,60 % / 21,60 % | 62,73 % / 62,73 % | 64,88 % / 64,88 % |
| violations | 0 | 0 | 0 | 0 |

A = sans contexte. B = liste « protocoles connus » circulaire (plafond, voir REALTRAFFIC.md). Détail : `out/avant_apres_cchain.json`, `out/avant_apres_eth.json`.

## Causes des avertissements (C-Chain, mode A, avant)
| Cause | Transactions |
|---|---|
| Opaque, sélecteur inconnu | 4 250 |
| Opaque, préfixe qui n'est pas un sélecteur (octet de mode puis zéros : 0x00000000, 0x01000000, 0x02000000, 0x03000000) | 436 |
| Preuve d'effet (droit, bénéficiaire hors liste, prix sans borne, sosie) | 243 |
| ERC-4337 handleOps | 39 |
| Création de contrat | 7 |
| Universal Router, commande non décodée | 2 |
| Calldata mal formé | 2 |
| Moins de 4 octets | 1 |

Après F34 : sélecteur inconnu 4 060 (moins 190), le reste identique. Ethereum après : sélecteur inconnu 1 530, preuve d'effet 246, texte ASCII « data » (inscriptions) 52, préfixe non-sélecteur 50, handleOps 30, Universal Router V4 20, création 3.

Appels de protocoles connus déjà décodés, sans avertissement d'opacité : transferts natifs et ERC-20, approve, WAVAX deposit/withdraw, swaps V2/V3 du registre, multicall décodable, Universal Router. Voir `out/causes_cchain.json`, champ `appels_decodes_sans_alerte_ou_connus_avant`.

### Les 30 sélecteurs inconnus les plus fréquents (C-Chain)
Signatures : openchain.xyz signature-database (API lookup, 2026-10-11, base communautaire : un nom est une indication, pas une preuve). `null` = aucune entrée. Fichier : `out/signatures_openchain.json`. Tableau complet avec cibles et expéditeurs distincts : `out/causes_cchain.json`.

| Sélecteur | Tx | Cibles | Expéditeurs | Signature publique | Lu après F34 |
|---|---|---|---|---|---|
| 0xa00597a0 | 337 | 1 | 15 | BrrrrrrrrrrrrrZ2826820544() (nom de robot) | non |
| 0x9bad26a6 | 306 | 22 | 22 | aucune | non |
| 0x35faa416 | 200 | 3 | 3 | sweep() | non |
| 0x00000000 | 183 | 5 | 91 | aucune (octet de mode, pas un sélecteur) | non |
| 0x01000000 | 173 | 2 | 60 | aucune | non |
| 0x8b04f947 | 127 | 1 | 26 | aucune | non |
| 0x4a502f39 | 121 | 1 | 1 | postStateList(address[],uint128[],uint64[],uint64[],uint256) | non |
| 0x2f139e4f | 120 | 1 | 1 | execute_route(...) | non |
| 0xd0295134 | 110 | 3 | 1 | tuneParameters(address,uint256 x5) | non |
| 0xcf1393d9 | 103 | 1 | 1 | aucune | non |
| 0x9b62f8b4 | 101 | 1 | 1 | aucune | non |
| 0x6fadcf72 | 100 | 16 | 16 | forward(address,bytes) | non |
| 0xaae42407 | 94 | 1 | 6 | IPredict(...) (nom de robot) | non |
| 0x9324b8c2 | 75 | 1 | 3 | aucune | non |
| 0xe21fd0e9 | 63 | 1 | 20 | swap((address,address,bytes,(...),bytes)) | non |
| 0xac9650d8 | 62 | 12 | 36 | multicall(bytes[]) | seulement si tous les sous-appels sont lus |
| 0x2213bc0b | 62 | 2 | 13 | exec(address,address,uint256,address,bytes) | non |
| 0xf1910f70 | 59 | 2 | 15 | swapExactIn(address x3,uint256 x2,address,uint256,bytes) | non |
| 0xac756684 | 48 | 3 | 1 | tunePrice(address,uint256 x3) | non |
| 0x20265830 | 42 | 1 | 1 | liquidateAsset(string[],address[][]) | non |
| 0x348011ae | 42 | 3 | 1 | publishStatements(...) | non |
| 0x03000000 | 42 | 1 | 29 | aucune | non |
| 0xa026383e | 41 | 2 | 6 | exactInputSingle((address,address,int24,address,uint256 x3,uint160)) | oui |
| 0x9e0ee74c | 41 | 1 | 14 | aucune | non |
| 0x40c10f19 | 38 | 2 | 2 | mint(address,uint256) | oui, si le bénéficiaire est l'expéditeur |
| 0x49c36c07 | 38 | 1 | 9 | initiateApeBreedingByOwner6538289081() | non |
| 0x80c3da8d | 37 | 1 | 5 | batchExecute(address[],bytes[]) | non |
| 0x5c182fb9 | 35 | 1 | 8 | aucune | non |
| 0x771d503f | 35 | 1 | 10 | aucune | non |
| 0x1764babc | 33 | 1 | 2 | exactOutputSingle((address,address,address,address,uint256 x3,uint160)) | oui |

Lecture : plus de 40 % de ces sélecteurs n'ont aucune signature publique ou un nom de robot (entretien, oracle, arbitrage). 53 % des opaques restants en C-Chain viennent d'expéditeurs qui envoient 10 transactions ou plus dans l'échantillon (robots). Sur Ethereum la part est de 4 %, mais 36 % des opaques restants joignent de la valeur native (non lus par règle de sûreté).

## Ce qui a été ajouté (F34, `engine/src/effects_abi.mjs`)
Décodeurs génériques par ABI, sans adresse ni identifiant de cas. Sélecteurs calculés par keccak. Chaque entrée porte sa source dans le fichier.
- Swaps de forme Uniswap V3 (exactInputSingle et exactOutputSingle, variantes tickSpacing et deployer, exactInput, exactOutput), V2 avec paramètre de parrainage, 1inch sans permis, 0x transformERC20. Sources : v3-periphery ISwapRouter, SwapRouter02, openchain (0xa026383e, 0x1679c792, 0x5023b4df, 0xc714e838, 0x1764babc, 0x3d0e3ec5, 0x07ed2379, 0x415565b0).
- Récupérations : retrait et rachat ERC-4626 (EIP-4626), withdraw, getReward, exit, claim, harvest (ABI Synthetix StakingRewards et convention), mint(address,uint256) (openchain 0x40c10f19).
- Swaps, retraits et retraits de liquidité déjà dans `protocols_extra.mjs` (V2, Liquidity Book, Aave, Seaport basique), relus pour une cible quelconque.
- multicall : lu seulement si tous les sous-appels le sont.

Conditions cumulatives, toutes nécessaires, sinon l'appel reste « je n'ai pas pu vérifier » :
1. L'opacité vient uniquement du sélecteur hors registre.
2. Aucun droit, contrôle, délégation, tiers, appel encapsulé ni autre preuve de risque.
3. Tout paramètre bénéficiaire est l'expéditeur lui-même (une constante de routeur qui le désigne est admise).
4. Aucune valeur native jointe. Minimum reçu non nul pour un swap.
5. Le type de fonction n'engage pas de nouveaux fonds : un dépôt, un staking, un pont, un achat de NFT ou un mint payant ne sont PAS lus.

Le résultat est le niveau « info » (drapeau `effect_decoded_limited`, `eff.effectLimited.verified = false`). Dans le serveur, le niveau le plus bas est déjà « info » (pas de vert). Interrupteur : F34 dans `engine/src/fixes.mjs`, désactivable avec `POLICY_FIXES`.

### Ce que les mesures de sécurité ont fait retirer
Première version : dépôt ERC-4626, stake, bridge Across, Seaport fulfillAdvancedOrder et valeur native étaient lus. Les rejeux ont montré :
- attacks_public P-A09-M1 (mint payant sur un contrat jeune et modifiable) perdait son avertissement au plancher (57/65 vers 56/65).
- V2_DEV : 12 cas « premier contrat inconnu, dépôt de 27 % du solde » passaient de warn à ok.
Ces entrées et toute lecture avec valeur native ont été retirées avant la version finale. Le jumeau malveillant a le même calldata : sans information sur le contrat, l'appel qui engage des fonds ne peut pas être levé.

## Détection : jeux de réglage (avant F34, puis après)
| Jeu | Commande | Résultat |
|---|---|---|
| attacks/DEV.jsonl (385 cas, 4 bras) | `node run/run_loop.mjs --dry <sortie.json>` | 0 cas dont les niveaux diffèrent |
| attacks_public (144 fixtures) | `node attacks_public/run_public.mjs` | attrapés identiques (87,7 %, 95,4 %, 95,4 %) ; une fausse alerte en moins (P-T2B4-B2, claim d'un coffre) |
| redteam/V2_DEV_norm.jsonl (1 594 + 1 336 cas) | `node run/run_v2.mjs <label> [--ref <label>]` | 0 changement |
| pipeline/measure.mjs | non rejouable : `detectors_adem/util.mjs` ne se charge plus (SyntaxError : `benchLower` déclaré deux fois), travail d'un autre agent en cours. Non touché. |

Pas de V2_TEST ni de TEST.jsonl.

## Tests et garde
- Nouveau : `engine/test/effects_abi.test.mjs` (10 tests) : unitaires (swap soi/tiers, minimum nul, valeur jointe, dépôt non lu, claim, multicall, droit illimité et propriété restent critical, calldata tronqué) et **zéro violation sur les 6 325 transactions C-Chain et 6 000 Ethereum** (rouge qui descend, orange avec preuve qui descend, vert sans drapeau de lecture limitée).
- Engine par fichiers : calldata 101, cchain 103, compare 38, keccak 28, monotonie 6, rules 23, selectors 23, typed 50, typehash 12, effects_abi 10 : tous verts. `real.test.mjs` (RPC en direct) non rejoué.
- Serveur : 33/33. Présentation : 39/39 (le compte a évolué par d'autres agents). `node run/check_nohardcode.mjs` : OK.

## Commandes pour rejouer
Depuis `research/titouan/T_banc_e2e/realtraffic`, un seul processus à la fois :
```
KEPT_NO34=F1,F2,F3,F4,F5,F6,F7,F8,F9,F10,F11,F12,F13,F14,F15,F16,F17,F18,F19,F21,F22,F23,F24,F25,F26,F27,F28,F29,F30,F31,F32,F33
OUT_TAG=avant POLICY_FIXES=$KEPT_NO34 node run_real.mjs cchain     # avant
node run_real.mjs cchain                                           # après
node compare_avant_apres.mjs cchain                                # violations (zéro attendu)
node classify_causes.mjs cchain                                    # causes et 30 sélecteurs
```
Idem avec `eth`. Tests : `cd engine && node --test test/effects_abi.test.mjs`.

## Limites
- Échantillon à fenêtre unique : 1 500 blocs C-Chain, 200 blocs Ethereum, graine 20261011. Transactions de blocs, pas de portefeuilles utilisateurs. Beaucoup de robots : le gain sur un vrai utilisateur est probablement plus grand en proportion (moins d'opacité de départ) mais il n'est pas mesuré.
- Étiquettes présumées : le « légitime » n'est pas étiqueté. « Zéro violation » prouve que le niveau ne descend pas pour les cas qui avaient une preuve de risque, pas que les appels levés sont sans danger.
- Un appel lu dit ce que l'APPEL déclare. Un contrat inconnu peut faire autre chose (un faux routeur qui garde les jetons). C'est pourquoi le niveau est « info limité », pas vert, et pourquoi tout ce qui engage des fonds ou de la valeur native reste en avertissement.
- Noms de signatures : base communautaire, certains noms sont des collisions ou des noms de robots. Les positions de paramètre (bénéficiaire) des variantes V3 sont celles du SwapRouter officiel ; si un contrat les ordonne autrement, le test « bénéficiaire = expéditeur » échoue et l'appel reste opaque (sûr).
- Non traité : Universal Router V4 (commandes 0x10 à 0x14), ERC-4337 handleOps, création de contrat, calldata ASCII « data », préfixes de mode (0x00000000, 0x01000000...), tout le trafic de robots à sélecteur propriétaire. Le sélecteur 0x00000000 est lu par `protocols_extra` seulement pour Seaport fulfillBasicOrder_efficient (cible de confiance).
- Les 120 transactions d'empoisonnement d'adresse (F23) restent en warn : ce sont de vraies alertes.
- Côté produit : le niveau « info » doit rester affiché comme « lecture limitée, contrat non vérifié », jamais comme vert. `policy.mjs` n'a pas été modifié.
- Effet de bord des tests : `engine/test/cchain.test.mjs` réécrit `engine/out/cchain_all.json`.

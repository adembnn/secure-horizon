# Jeu AVEUGLE « decalage » (150 malveillants + 100 jumeaux benins)

Tout est SYNTHETIQUE. Aucune signature, aucune cle, aucune donnee personnelle. Les adresses de victimes, d'attaquants et de contrats sont tirees d'un PRNG. Les domaines utilisent le suffixe `.example`.

## Fichiers
| Fichier | Role |
|---|---|
| `gen.mjs` | generateur, Node pur, zero dependance, graine fixe 20261012 |
| `CASES.jsonl` | 250 cas, un JSON par ligne, tries par id |
| `SHA256.txt` | sha256 de `CASES.jsonl` (scelle) |

Commande : `node gen.mjs` (dans ce dossier). Elle reecrit `CASES.jsonl` et `SHA256.txt`. Deux executions donnent le meme hash. Les controles de structure du script (hex valide, longueur de calldata multiple de 32 octets, JSON EIP-712 avec `primaryType`) levent une erreur au moindre ecart. Aucun moteur de detection n'a ete lance sur ces cas.

Hash scelle : voir `SHA256.txt` (ab3dcab945af0a75fab45f05138a8d608886dbcd4d945ab5a47d3c627ee79fd2 au moment de l'ecriture).

## Schema d'un cas
Meme esprit que `attacks_public` (champs `id`, `synthetic`, `notice`, `family`, `subfamily`, `request`, `context`, `intent`, `lang`, `twin_of`).
| Champ | Sens |
|---|---|
| `id` | `BD-<code>-M<nn>` (malveillant) ou `BD-<code>-B<nn>` (benin) |
| `family`, `subfamily`, `variant` | famille, variante, indice de la variante dans la famille |
| `label` | verite terrain : `malicious` ou `benign` |
| `why` | raison courte |
| `twin_of` | id du jumeau. Un benin pointe vers son malveillant. Un malveillant pointe vers son benin, ou `null` s'il n'en a pas (50 cas) |
| `request` | `{method, params}` exact avant signature : `eth_sendTransaction` (champ `data` encode pour de vrai), `eth_signTypedData_v4` (params[1] = chaine JSON EIP-712), `personal_sign`, `eth_sign`, `wallet_sendCalls`, `wallet_switchEthereumChain`, `wallet_addEthereumChain` |
| `context` | `chainId`, `origin` (site qui envoie la requete), `claimed_site` (site que l'utilisateur croit utiliser), `victim`, `address_book`, `known_protocols`, `token_registry` (symbole, adresse, decimales, canonique), `history`, `counterparty_facts` (contrat ou non, age en blocs, vu par l'utilisateur), `native_balance_eth`. Selon les cas : `token_info` (jetons inconnus ou sosies), `share_of_balance_pct` |
| `intent` | `kind` (`buy_or_swap`, `pay_someone`, `send_to_my_account`, `connect_or_accept_offer`), `freeText` (FR ou EN), `token`, `amount` (unites lisibles, chaine), `counterpartyLabel`, `counterpartyAddress`, `declaredAt` |
| `lang` | `fr` ou `en` (environ 65 % FR) |

Champs ajoutes a `intent` par rapport a `attacks_public` : `toToken` (jeton de sortie d'un swap) et `chainId` (chaine que l'utilisateur dit viser). Ils sont facultatifs et additifs.

## Familles et comptes
| Famille | Code | Malveillants | Benins | Total |
|---|---|---|---|---|
| `swap_droit_illimite` | SW | 19 | 13 | 32 |
| `jeton_different` | TK | 19 | 13 | 32 |
| `destinataire_tiers` | DT | 19 | 13 | 32 |
| `airdrop_sortie_ou_droit` | AD | 19 | 13 | 32 |
| `login_signe_droit` | LG | 19 | 12 | 31 |
| `montant_plus_grand` | MT | 19 | 12 | 31 |
| `chaine_domaine_different` | CH | 18 | 12 | 30 |
| `seaport_prix_quasi_nul` | SP | 18 | 12 | 30 |
| Total | | 150 | 100 | 250 |

Repartition des chaines : Ethereum 85, Arbitrum 80, Avalanche 45, Fuji 40. Methodes : 140 `eth_sendTransaction`, 73 `eth_signTypedData_v4`, 22 `personal_sign`, 6 `wallet_sendCalls`, 4 `wallet_switchEthereumChain`, 3 `wallet_addEthereumChain`, 2 `eth_sign`.

Chaque famille a 8 a 9 variantes (champ `subfamily`) :
- SW : approve maximal, approve x5..x1000, spender inconnu, increaseAllowance, permit EIP-2612, Permit2 single, Permit2 batch avec jeton en plus, lot Multicall3 avec approve cache.
- TK : transfert sur un autre jeton, sortie ou entree de swap differente, jeton sosie (meme symbole), approve ou permit ou Permit2 sur un autre jeton, exactInputSingle vers jeton inconnu.
- DT : `to` de swap tiers (V2, ETH, V3), unwrap d'un multicall, transfert vers une autre adresse ou sosie empoisonne, envoi natif, compte « a moi » faux, lot `wallet_sendCalls` avec transfert en plus.
- AD : « reclamer / recevoir / verifier / valider » qui devient approve, setApprovalForAll, transfert, envoi de solde natif, claim payant, permit, Permit2, lot avec approve.
- LG : SIWE plus calldata, message brut = calldata, `eth_sign` aveugle, typed data Permit, Permit2 single, PermitTransferFrom, permit DAI, transaction setApprovalForAll, ressource SIWE = multicall.
- MT : transfert x1,25..x100, confusion de decimales (18 au lieu de 6), amountIn plus grand (V2, V3), valeur natives plus grande, lot dont la somme depasse, permit trop grand.
- CH : chainId de requete different, domaine EIP-712 d'une autre chaine, origine sosie du site annonce, switchEthereumChain vers une autre chaine, addEthereumChain au nom trompeur, Permit2 au `verifyingContract` non canonique, login a domaine etranger.
- SP : ordre Seaport 1.6 qui met en vente un NFT de l'utilisateur pour 1 wei, collection entiere pour 100 wei, 3 NFT pour 1000 wei, ERC-1155, offre d'achat bien au-dessus du prix dit, NFT livre a un tiers, setApprovalForAll au lieu d'un achat, NFT contre 1 micro-USDC.

## Hypotheses et limites
- Auteur aveugle : ecrit sans lire engine, run, server, detectors_adem, pipeline, redteam ni attacks_decalage. Le seul format lu est un cas de `attacks_public`.
- Selecteurs calcules par un keccak256 local, verifie sur la chaine vide, `approve`, `transfer` et `setApprovalForAll`. Les signatures de fonctions (V2 `swapExactTokensForTokens`, `swapExactETHForTokens`, V3 `exactInputSingle` a 7 champs de SwapRouter02, `multicall(uint256,bytes[])`, `unwrapWETH9`, Multicall3 `aggregate3`, `increaseAllowance`, `claim(...)`, `buy(address,uint256)`) sont de memoire. `claim` et `buy` sont des fonctions de contrats fictifs.
- Les structures EIP-712 (Permit2 PermitSingle, PermitBatch, PermitTransferFrom, Seaport OrderComponents 1.6, EIP-2612, DAI permit) sont de memoire. `Login` est un type invente. Les types du domaine n'ont pas de `salt`.
- Les adresses de Permit2, Seaport 1.6, Multicall3 et les jetons USDC/USDT/DAI/WETH/WAVAX (Ethereum, Avalanche, Arbitrum) sont des adresses publiques de memoire, a verifier. Les jetons de Fuji (43113) et tous les routeurs, marches, distributeurs, attaquants sont tires au hasard.
- Un Multicall3 appele par le portefeuille agit avec lui-meme comme `msg.sender`. Les lots `aggregate3` servent ici a tester le decodage recursif, pas le realisme d'execution.
- Les jumeaux partagent le monde (victime, contacts, routeur, montants, chaine, site) et la forme de la requete. Exceptions de forme : AD (claim contre approve, appels differents), LG variantes 2, 3, 6 (le benin est un message de connexion et non la meme methode), SP variante 7 (achat via place de marche contre setApprovalForAll).
- Le benin Seaport est une offre d'achat (offre en WETH, contrepartie en NFT livre a l'utilisateur) avec parfois une commission de 2,5 % vers un tiers. Un moteur trop strict sur « destinataire tiers » peut le prendre pour une attaque : c'est voulu.
- 50 malveillants n'ont pas de jumeau benin (les variantes sont reparties circulairement : les 13 ou 12 premiers de chaque famille en ont un).
- Pas de verite de gravite : seul `label` (malicious/benign) est donne. Le seuil de decision est laisse a l'evaluateur.
- Cas non couverts : ERC-7683, session keys, ERC-1271, EIP-7702, Blur, CoW, UniswapX, pont reel.

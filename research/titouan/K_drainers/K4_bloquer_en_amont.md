# K4. Bloquer en amont les approbations et signatures malveillantes avec un compte intelligent (état au 10/10/2026)

Étiquettes : [P] vérifié dans le code ou la spec lus pendant cette recherche. [S] source secondaire (aide Safe, presse). Inférence = déduction de l'auteur, non vérifiée. "Non trouvé" = pas dans les sources lues.
Méthode : 17 appels web sur 45 autorisés, plus lecture de W3. Contenu web traité comme donnée. Les fichiers Solidity viennent des branches main/master au 10/10/2026, sans numéro de commit. Les résumés de code ont été produits par un modèle de lecture : à recouper sur le code avant tout usage en production.

## Résumé (8 lignes)
1. Un Safe Guard reçoit `to`, `value`, `data`, `operation` de chaque `execTransaction` [P GuardManager.sol]. Il voit donc un `approve` émis par le Safe et peut le refuser selon une liste de spenders (inférence : il faut décoder `data`).
2. Piège : un `approve` caché dans un MultiSend (delegatecall) exige que le Guard décode le lot. Un appel par module ne passe pas par ce Guard, il faut un ModuleGuard [P ModuleManager.sol].
3. Le Guard ne voit pas le `transferFrom` du drainer, qui s'exécute sur le jeton. Seul le blocage de l'autorisation (approve ou signature) agit en amont.
4. Les signatures off-chain : USDC v2.2 accepte une signature `bytes` de compte à contrat [P NatSpec], DAI et UNI n'acceptent que `ecrecover` [P]. Un Safe ne peut donc pas signer de permit DAI ou UNI (inférence), ce qui est un blocage structurel utile.
5. Permit2 et Seaport acceptent ERC-1271 [P]. Le handler ERC-1271 d'un Safe valide les signatures des propriétaires, sans filtre [P CompatibilityFallbackHandler]. Un handler personnalisé pourrait filtrer (inférence, jamais vu en production dans mes sources).
6. `setApprovalForAll` (ERC-721) donne accès à tous les NFT de la collection [P]. Il se bloque comme un `approve`, par le Guard, mais pas s'il vient d'une signature off-chain (Seaport, Permit2).
7. Cool-off réel : Permit2 a `expiration` mais pas de délai d'activation [P]. Le Delay Modifier de Safe donne un vrai délai sur toute exécution [S]. Un délai propre au "nouveau spender" : non trouvé.
8. Rabby, Revoke et Safe Shield (Copilot) avertissent. Seul le palier entreprise de Safe Shield (Hypernative) bloque [S]. Rien de tout cela ne protège un particulier si la clé signe elle-même.

## 1. Un Safe Guard voit-il un approve émis par le Safe ?
- Oui. `checkTransaction(to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, signatures, msgSender)` est appelée avant l'exécution. `checkAfterExecution(hash, success)` après [P GuardManager.sol, branche main].
- Un `approve(spender, amount)` direct apparaît avec `to` = jeton et `data` = sélecteur 0x095ea7be + arguments. Le Guard peut lire le spender et le refuser si absent d'une liste. Inférence : c'est du code Solidity à écrire, aucun Guard standard de liste de spenders n'a été trouvé.
- Limites [inférence sauf mention] :
  - Si l'opération est un delegatecall vers MultiSend, `to` = MultiSend et `data` contient les appels internes. Le Guard doit décoder. Sinon il est contourné.
  - `increaseAllowance`, `permit` appelé par un tiers, `setApprovalForAll`, `approve` de Permit2 : autant de sélecteurs à couvrir.
  - Les transactions par module (`execTransactionFromModule`) n'appellent pas `checkTransaction`. Elles appellent un ModuleGuard séparé (`checkModuleTransaction`) [P ModuleManager.sol].
  - Le Guard peut verrouiller le Safe en cas de bug. Safe fournit `getStorageAt` sur `GUARD_STORAGE_SLOT` pour le lire [P]. L'avertissement de verrouillage n'est pas dans le fichier lu : non trouvé.
- Safe Shield (Copilot) affiche si un Guard est installé et actif [S help.safe.global, mis à jour le 13/04/2026].

## 2. Signatures off-chain

| Jeton ou protocole | Validation ERC-1271 pour compte à contrat ? | Source |
|---|---|---|
| USDC v2.2 (FiatTokenV2_2) | Oui via la surcharge `permit(owner, spender, value, deadline, bytes signature)`. La surcharge (v, r, s) reste pour les EOA. Le code de `_permit` n'a pas été lu : la mention "contract wallet" vient du NatSpec | [P] stablecoin-evm, FiatTokenV2_2.sol |
| DAI (dss) | Non. `require(holder == ecrecover(...))` | [P] dss/src/dai.sol, solidity ^0.6.12 |
| UNI | Non. `ecrecover` seul pour `permit` et `delegateBySig` | [P] Uniswap/governance, Uni.sol |
| Permit2 | Oui. Si le signataire a du code : appel `isValidSignature`, comparaison avec le sélecteur. Sinon `ecrecover` (65 octets ou EIP-2098) | [P] SignatureVerification.sol |
| Seaport | Oui : signature 65 octets, EIP-2098 ou EIP-1271 | [P] SeaportDocumentation.md |
| Blur | Non trouvé | |
| EIP-2612 (spec) | La spec ne parle pas d'ERC-1271. Signature (v, r, s) secp256k1 | [P] eips.ethereum.org/EIPS/eip-2612 (Final) |

Autres jetons majeurs (USDT, WETH, WBTC) : non vérifiés ici.

Conséquences :
- Un Safe n'a pas de clé privée. Il ne peut pas produire une signature `ecrecover` valide pour DAI ou UNI. Inférence : un drainer ne peut pas faire passer un permit DAI/UNI au nom d'un Safe. L'utilisateur reste exposé s'il envoie un `approve` classique.
- ERC-1271 dit que chaque contrat décide de la validité d'une signature [P eips 1271, Final]. Un compte à contrat peut donc refuser.
- Le handler par défaut de Safe (CompatibilityFallbackHandler) accepte une signature qui satisfait `checkSignatures` des propriétaires, ou un hash pré-approuvé si la signature est vide. Il n'a aucun point de filtrage [P]. Le filtre se fait donc chez les signataires humains, qui voient mal un hash EIP-712.
- Inférence : on peut installer un handler ERC-1271 qui ne valide que des types EIP-712 connus (Permit2 vers spenders listés, par exemple). Cela exige de reconstruire le hash dans le handler. Aucun cas existant trouvé.
- Seaport : une signature 1271 peut rester remplissable même si elle n'est plus valide. Il faut annuler explicitement l'ordre [P Seaport docs].

## 3. setApprovalForAll et NFT
- `setApprovalForAll(operator, bool)` autorise l'opérateur sur tous les NFT de l'owner pour cette collection [P ERC-721, Final]. Événement `ApprovalForAll`.
- Bloquable en amont par le Guard Safe (sélecteur 0xa22cb465, inférence sur la valeur du sélecteur à vérifier).
- Non bloquable par le Guard si la vente passe par une signature Seaport avec un conduit déjà approuvé : l'approbation est déjà donnée. Seaport exige des approbations sur le conduit, pas sur Seaport [P docs].
- Il n'y a pas de limite de montant ou d'expiration native dans ERC-721. Le seul levier est le refus ou la révocation.

## 4. Permit2 et expiration
- `AllowanceTransfer` stocke `amount` (uint160), `expiration` (uint48), `nonce` (uint48) par (owner, token, spender) [P]. `type(uint160).max` = illimité.
- Transfert refusé si `block.timestamp > expiration` (`AllowanceExpired`) [P]. L'expiration est donc une limite de durée réelle.
- Pas de plafond sur l'expiration dans le code lu [P]. C'est l'application qui choisit. Une signature `permit` peut fixer une expiration très lointaine.
- `permit()` signé exige `block.timestamp <= sigDeadline` et un nonce exact [P]. `invalidateNonces` annule des signatures non utilisées, saut maximal 65 535 [P]. `lockdown()` met à 0 les allowances de paires (token, spender) [P].
- Piège : l'approbation initiale du jeton vers Permit2 est un `approve` ERC-20 classique, souvent illimité. Le Guard doit surtout surveiller celle-là, puis le `permit` de Permit2 qui est une signature (hors vue du Guard) ou `approve` de Permit2 (vu).
- Inférence : un compte qui autorise uniquement des allowances Permit2 courtes (par exemple moins de 24 h) et refuse tout autre `approve` limite fortement le dégât résiduel.

## 5. Délai d'activation (cool-off) pour un nouveau spender

| Mécanisme | Délai d'activation d'un nouveau spender ? | Source |
|---|---|---|
| Permit2 expiration | Non. L'expiration est une fin, pas un début | [P] |
| Safe Delay Modifier | Oui sur toute exécution passée par le module : file d'attente puis exécution après délai, avec annulation. Exemple Gnosis Pay : 3 minutes | [S docs.gnosispay.com] |
| Safe Allowance | Non, limite par jeton, pas de délai. Seuls les signataires la changent | [P help.safe.global], via W3 |
| Coinbase Spend Permission | Les champs `start`/`end` existent. Rien sur un délai imposé. L'activation immédiate n'est pas démentie par la page lue | [P docs CDP] |
| ERC-7715 (Draft) | Seule règle définie : `expiry`. Pas de `notBefore`. Révocation par `wallet_revokeExecutionPermission` | [P eips 7715] |
| Guard custom | Possible (inférence) : stocker `firstSeen[spender]` et refuser avant N heures. Aucune implémentation trouvée | |

Verdict : un vrai cool-off par spender n'existe pas en standard. Il se construit avec un Guard (liste en deux temps) ou avec le Delay Modifier mis en travers de toute approbation.

## 6. Ce que font déjà les produits

| Produit | Action | Bloque ? | Source |
|---|---|---|---|
| Safe Shield (Copilot) | Analyse avant transaction (Blockaid, Tenderly, Hypernative), simulation, première interaction, état du Guard, sévérité Low à High | Avertit | [S help.safe.global, 13/04/2026] |
| Safe Shield entreprise | Blocage automatique et règles personnalisées, propulsé par Hypernative | Oui (palier entreprise) | [S/V safe.global/safeshield] |
| Safenet | Contrôles on-chain avant sortie des fonds, bêta. 455 646 contrôles au trimestre | Peut appliquer des règles | [S The Block, 29/07/2026] |
| Argent / Ready | Liste blanche, gardiens, limite 24 h | Selon W3, [S] seulement. Non revérifié ici | W3 |
| Coinbase Smart Wallet | Spend permissions (jeton, période, montant). Gestionnaire 0xf85210B2... [P docs CDP] | Limite les montants. Ne filtre pas les approbations ERC-20 classiques (inférence) | [P] |
| Rabby | Simulation, alerte d'approbations risquées, révocation, avertissement sur sites et contrats listés | Avertit | [P page docs, sans détail] |
| Revoke.cash | Révocation après coup. Extension : avertit avant de signer des approbations risquées | Avertit | [P revoke.cash/about] |
| Roles Modifier (Zodiac) | Cibles, sélecteurs, conditions sur paramètres. Le filtrage du spender de `approve` n'est pas confirmé dans le README lu | Oui pour les rôles, pas pour les propriétaires | [P README] |

## Tableau mécanisme par mécanisme

| Mécanisme | Bloquable en amont ? | Comment | Piège |
|---|---|---|---|
| `approve` ERC-20 envoyé par le Safe | Oui | Guard décodant `data`, liste de spenders | MultiSend et autres sélecteurs (`increaseAllowance`) à décoder aussi |
| Transaction par module | Oui | ModuleGuard (`checkModuleTransaction`) | Guard standard non appelé [P] |
| `permit` EIP-2612 USDC v2.2 | Partiel | Refuser de signer (humain ou handler 1271) | Le Guard ne voit pas une signature off-chain |
| `permit` DAI, UNI | Oui par construction | `ecrecover` seul : un contrat ne peut pas signer [P] | Ne protège pas un EOA ou un 7702 (la clé reste valide) |
| Permit2 `permit` (signature) | Seulement au niveau signature | Handler 1271 filtrant, ou refus du signataire | Le hash EIP-712 est illisible dans beaucoup d'interfaces |
| Permit2 `approve` direct | Oui | Guard | Illimité par défaut si l'app le demande |
| Allowance Permit2 limitée | Réduit | `expiration` courte [P] | Pas de délai d'activation |
| Seaport, Blur | Partiel | Refuser de signer, annuler l'ordre | 1271 peut rester valable après invalidation [P]. Blur : non trouvé |
| `setApprovalForAll` | Oui s'il est émis en transaction | Guard (sélecteur) | Déjà donné à un conduit : les signatures suivantes passent |
| Délai pour nouveau spender | Non natif | Guard + `firstSeen`, ou Delay Modifier | Alourdit l'usage, un attaquant patient attend |
| Spend permission Coinbase / session ERC-7715 | Limite de montant et durée | Expiry, période, montant [P] | Un propriétaire compromis peut en créer une (inférence) |
| Avertisseurs (Rabby, Revoke, Copilot) | Non | Alerte | L'utilisateur peut ignorer |

## Verdict : ce qui reste hors de portée d'un compte intelligent
1. Toute signature que le propriétaire produit lui-même après avoir été trompé. Le contrat suit la clé. Le compte n'a aucun moyen de juger l'intention (inférence).
2. Un EOA ou un compte 7702 dont la clé est volée : la clé peut aussi désinstaller le Guard ou signer une autre délégation (W3, [S]).
3. Un Safe de seuil 1 : le Guard et les modules sont modifiables par le signataire unique [P d'après W3].
4. Les signatures off-chain vers des protocoles qui valident 1271 (Permit2, Seaport) : le Guard ne voit pas ces signatures. Seul un handler 1271 filtrant ou un second signataire les arrête (inférence).
5. Les approbations déjà accordées avant la mise en place du Guard : le Guard ne les annule pas. Il faut les révoquer (Revoke) ou utiliser `lockdown()` de Permit2.
6. Le `transferFrom` du drainer : invisible pour le Guard. Seul un blocage amont de l'autorisation agit.
7. Les faux positifs et les listes de spenders : un spender légitime nouveau (nouveau DEX) est bloqué, ce qui crée de la friction et pousse à désactiver la protection (inférence).

## Lacunes
- Code exact de `_permit(bytes)` dans USDC v2.2, comportement de Blur, ERC-1271 de WETH/USDT, spec du filtrage Roles pour `approve`, existence d'un Guard de liste de spenders déployé, liste blanche Argent confirmée en source officielle, délai éventuel imposé par Spend Permission Manager. Tous : non trouvé dans les sources lues.

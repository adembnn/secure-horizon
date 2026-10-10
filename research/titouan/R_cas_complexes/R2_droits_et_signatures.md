# R2 - Droits de dépense et signatures hors chaîne : quadrillage complet

Date : 2026-10-11. Mission : cartographier tout ce qu'une signature ou transaction peut accorder, pour un décodeur "avant signature" qui compare l'effet réel à l'intention déclarée.

## Légende des étiquettes
- [P] = source primaire (spec, doc officielle, rapport de l'émetteur) effectivement consultée via recherche web.
- [S] = source secondaire (blog, presse, résumé tiers, miroir) consultée.
- [V] = à vérifier : connaissance générale du modèle ou point non confirmé par une source lue dans cette session. Ne pas citer comme fait avant vérification (contrats GitHub, EIP).
- "non trouvé" = recherché, absent des résultats.

Limite honnête : les recherches ont renvoyé surtout des résumés. Les définitions de structures EIP-712 ci-dessous sont en grande partie [V] (je les connais, je ne les ai pas relues à la source ici), sauf mention contraire.

---

## 0. Statistiques d'incidents (Scam Sniffer)

- 2024 : pertes par drainers ~494 M$, +67 % sur un an, ~332 000 victimes (+3,7 %), plus gros vol ~55,48 M$ (setOwner sur proxy, DAI, août). [S] (miroirs du rapport ; PDF complet non atteint). Sources : drops.scamsniffer.io/?p=971 ; defihacklabs.substack.com.
- Répartition des gros cas 2024 (parts des pertes) : Permit 56,7 %, setOwner 31,9 %, Transfer 4,5 %, increaseAllowance 3,5 %, autres 3,4 %. [S]. Attention : le chiffre 56,7 % est une part des pertes des gros cas, pas de toutes les pertes ; un autre résumé le présente comme "méthode principale". Le dénominateur est donc ambigu. Ne pas écrire "56,7 % des attaques".
- 2025 : pertes de phishing par signature ~83,85 M$, 106 106 victimes (-83 % pertes, -68 % victimes). Plus gros vol 6,5 M$ (stETH, aEthWBTC, via Permit, septembre). Sur 11 cas > 1 M$, Permit + Permit2 = 38 % des pertes de ces cas. Les signatures malveillantes EIP-7702 apparaissent après Pectra (2 gros cas en août). [S] drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ (lu via résumé).
- Périmètre : phishing par sites web uniquement, estimation plancher. [S]
- Détail setApprovalForAll en 2025 : non trouvé (cité dans la définition, pas de part chiffrée).
- Cas cité : délégué MakerDAO, ~11 M$ (Aave, Pendle) en juin 2024, via plusieurs signatures Permit. [S] cryptometer.io.
- Opération Atlantic (US Secret Service, UK, Canada) contre le phishing d'approbation. [S] theblock.co/post/393746 (détails non lus).

Lecture pour le produit : la menace dominante est la signature hors chaîne qui ne coûte pas de gas et n'apparaît pas dans l'historique on-chain avant l'exécution.

---

## 1. Tableau de synthèse

| # | Mécanisme | Rejouable ? | Gravité proposée | Visible on-chain avant usage ? |
|---|---|---|---|---|
| 1 | approve / increaseAllowance | Non (tx) | Haute si montant illimité ou spender inconnu | Oui (tx) |
| 2 | EIP-2612 permit | Une fois (nonce) | Critique | Non |
| 3 | DAI-style permit | Une fois (nonce) | Critique (toujours illimité) | Non |
| 4 | Permit2 AllowanceTransfer (PermitSingle/Batch) | Allocation durable jusqu'à expiration | Critique | Non |
| 5 | Permit2 SignatureTransfer (+ witness) | Une fois (nonce bitmap) | Haute à critique | Non |
| 6 | setApprovalForAll / approve ERC-721/1155 | Non (tx) | Critique (collection entière) | Oui |
| 7 | Seaport / Blur / OpenSea orders | Jusqu'à expiration/annulation | Critique si consideration vide | Non |
| 8 | CoW / UniswapX / 1inch Fusion | Selon validTo, nonce | Moyenne à haute | Non |
| 9 | personal_sign / eth_sign opaque | Variable | Critique pour eth_sign hash brut | Non |
| 10 | SIWE EIP-4361 | Jusqu'à expiration | Faible à moyenne (haute si resources/statement détournés) | Non |
| 11 | EIP-712 inconnu | Inconnu | Élevée par défaut | Non |
| 12 | ERC-1271 | Rejouable entre comptes si mal conçu | Haute | Non |
| 13 | Messages cross-chain/bridge | Selon domaine | Haute | Non |
| 14 | Session keys / spend permissions (ERC-7715, Coinbase) | Récurrent, durable | Haute | Non (jusqu'à usage) |
| 15 | EIP-7702 authorization | Persistant (jusqu'à révocation), chain id 0 = multi-chaînes | Critique | Oui après envoi |
| 16 | Délégation de gouvernance | delegateBySig, nonce | Faible à moyenne (pouvoir de vote, pas de fonds) | Non |

---

## 2. Fiches détaillées

### 2.1 approve / increaseAllowance / decreaseAllowance (ERC-20)
- Structure : transaction `approve(spender, amount)`. Pas de signature hors chaîne, mais le vecteur de phishing reste majeur (increaseAllowance = 3,5 % des gros cas 2024 [S]).
- La victime croit : "autoriser ce site à utiliser un peu de mon token" ou "activer le swap".
- Réellement : le spender peut tirer jusqu'à `amount` (souvent 2^256-1) via transferFrom, sans limite de temps, tant que non révoqué. Bénéficiaire : le spender choisit la destination.
- Comportements particuliers :
  - USDT mainnet : `approve` ne retourne pas de booléen, et refuse de passer d'une allowance non nulle à une autre non nulle (il faut remettre à zéro). [S] forum.openzeppelin.com, reports.immunefi.com ; OpenZeppelin forceApprove = approve puis, en cas d'échec, approve(0) puis approve(montant). Conséquence pour le décodeur : une transaction `approve(spender, 0)` est une révocation (bénigne) ; une séquence 0 puis N est normale pour USDT. Ne pas alerter sur "approve à zéro".
  - Tokens sans retour booléen : un décodeur qui exige `true` en retour se trompe (USDT, BNB). [S]
  - BNB : refuse certains approve à zéro (le zéro-value pose problème). [S] (via résumé evmresearch)
  - decreaseAllowance : réduit ; bénin, mais certains tokens ne l'ont pas : non trouvé de liste.
  - Compatibilité de la race condition : approve N -> M peut être dépensé deux fois ; d'où increase/decrease. [V]
- Reconnaissance : sélecteur `0x095ea7b3` (approve), `0x39509351` (increaseAllowance) [V]. Calculer amount / totalSupply / solde, tester `amount >= 2^255` = illimité.
- Ne peut pas voir : l'intention du spender (contrat proxy upgradeable), un spender légitime aujourd'hui compromis demain.
- Gravité : Haute si illimité vers un spender non reconnu ; Moyenne si borné ; Info si zéro.
- Phrase grand public : "Vous donnez à ce programme le droit de prendre vos jetons X, sans limite de montant ni de durée, jusqu'à ce que vous le retiriez."

### 2.2 EIP-2612 permit
- Structure : `Permit(address owner, address spender, uint256 value, uint256 nonce, uint256 deadline)` dans un domaine EIP-712 (name, version, chainId, verifyingContract = le token). [P] ercs.ethereum.org/ERCS/erc-2612 (champs confirmés via résumés [S] elliptic.co).
- La victime croit : "me connecter", "vérifier mon wallet", "réclamer un airdrop", ou ne comprend pas le message.
- Réellement : n'importe qui détenant la signature peut appeler `permit()` puis `transferFrom` pour `value`, avant `deadline`. Le bénéficiaire est `spender` (l'attaquant). Usage unique (nonce du token) mais `deadline = uint256.max` autorise une exécution tardive. Invalidation : incrémenter le nonce en utilisant un autre permit, ou révoquer après coup (si déjà exécuté).
- Incidents : méthode dominante 2024 (56,7 % des pertes des gros cas) et 2025 [S]. Le permit n'apparaît pas dans les listes d'approbations tant qu'il n'est pas soumis. [S] secureworld.io (via résumé).
- Reconnaissance : primaryType "Permit", champs owner/spender/value/nonce/deadline, verifyingContract = token (adresse du token ERC-20). Vérifier spender connu, value vs solde, deadline.
- Ne peut pas voir : si le token réel implémente permit (sans, la signature est inerte) ; si le verifyingContract est un faux token imitant un vrai nom ; le nonce actuel exact sans appel RPC ; si le spender est déjà identifié comme drainer.
- Gravité : Critique si spender inconnu et value élevée.
- Phrase : "Cette signature ne coûte rien mais donne à X le droit de retirer vos jetons Y quand il veut avant la date limite. C'est comme signer un chèque."

### 2.3 DAI permit (allowed)
- Structure : `Permit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed)`. [S] forum.moralis.io, eco.com ; mention des différences dans EIP-2612 (rétro-compatibilité).
- Réellement : `allowed = true` donne une allowance maximale (uint(-1)), pas de montant. `expiry = 0` signifie en pratique sans expiration. [S/V pour expiry=0 ; non confirmé ici]
- Piège décodeur : l'absence de champ `value` ; un décodeur qui cherche `value` conclut "montant inconnu" alors que c'est illimité. Aussi DAI : `holder` au lieu de `owner`. Aussi, token Stake : même ABI que DAI mais sémantique différente (approbations expirantes). [S]
- Incident : le vol de 55 M$ de DAI en août 2024 passait par setOwner sur un proxy, pas par permit [S].
- Gravité : Critique par construction (toujours illimité).
- Phrase : "Cette signature donne à X un accès total et permanent à vos DAI."

### 2.4 Permit2 - AllowanceTransfer (PermitSingle / PermitBatch)
- Contexte : l'utilisateur fait d'abord un `approve` illimité du token vers le contrat Permit2 (adresse canonique 0x000000000022D473030F116dDEE9F6B43aC78BA3 [V]), puis les applications obtiennent des allowances internes par signature.
- Structures [V] : `PermitSingle{ PermitDetails details{token, amount(uint160), expiration(uint48), nonce(uint48)}, address spender, uint256 sigDeadline }`; `PermitBatch{ PermitDetails[] details, spender, sigDeadline }`. Domaine : name "Permit2", chainId, verifyingContract = Permit2 (sans version). [V]
- La victime croit : "autoriser le swap" ou "se connecter".
- Réellement : le `spender` obtient `amount` (uint160, jusqu'à 2^160-1) sur chaque token listé jusqu'à `expiration` (peut être 30 jours, ou très long), via `transferFrom` de Permit2. Durable, pas à usage unique. PermitBatch : plusieurs tokens en une signature. Le rapport 2025 lie Permit + Permit2 à 38 % des pertes des cas > 1 M$ [S].
- Piège : le token indiqué n'a rien à voir avec le verifyingContract du domaine (Permit2). Un décodeur naïf qui cherche le token dans le domaine se trompe : le token est dans `details.token`.
- Reconnaissance : domain.name == "Permit2" + verifyingContract canonique par chaîne ; primaryType PermitSingle/PermitBatch. Lister tokens, montants, expiration, spender. Un spender inconnu est le signal clé.
- Ne peut pas voir : si l'utilisateur a déjà un approve ERC-20 illimité vers Permit2 (sinon la signature est inerte) ; l'état on-chain des allowances Permit2 sans RPC.
- Gravité : Critique si spender inconnu ; Moyenne pour Universal Router connu avec expiration courte.
- Phrase : "Vous autorisez X à retirer jusqu'à [montant] de vos [tokens] jusqu'au [date], via le contrat Permit2 d'Uniswap."

### 2.5 Permit2 - SignatureTransfer (PermitTransferFrom, witness, nonce bitmap)
- Structures [V] : `PermitTransferFrom{ TokenPermissions permitted{token, amount}, spender, nonce, deadline }` ; batch : `PermitBatchTransferFrom` ; avec `witness` : le type hash inclut un struct supplémentaire défini par `witnessTypeString` (doit contenir TokenPermissions et respecter l'ordre EIP-712). [P] developers.uniswap.org/docs/protocols/permit2/concepts/signature-transfer ; docs.uniswap.org/contracts/permit2/reference/signature-transfer (entrées `permitTransferFrom`, `permitWitnessTransferFrom`, versions batch).
- Nonce non ordonné : bitmap, mot (248 bits hauts) + position (8 bits bas) ; `invalidateUnorderedNonces(wordPos, mask)` permet au propriétaire d'annuler. [P/S] docs.uniswap.org v4 UnorderedNonce ; docs.fluid.instadapp.io.
- Signatures acceptées : EOA, compact EIP-2098, EIP-1271. [P]
- Réellement : un transfert unique de `amount` du token vers l'adresse choisie par le `spender` lors de l'appel (le spender appelle `permitTransferFrom` avec `to`). Le destinataire n'est donc pas dans la signature sauf via un witness : c'est un point de risque important. Le witness (ex. ordre UniswapX) contraint ce que le spender doit faire en échange. [V pour l'absence de `to` dans le struct signé ; cohérent avec la structure]
- Piège décodeur : le witness est un struct arbitraire ; sans résolution du type, on ne sait pas ce qu'il engage.
- Gravité : Haute (une fois), Critique si montant = solde et spender inconnu.
- Phrase : "Vous autorisez X à prendre une fois jusqu'à [montant] de [token]. Vous ne voyez pas où ils seront envoyés."

### 2.6 setApprovalForAll et approve (ERC-721 / ERC-1155)
- Structure : tx `setApprovalForAll(operator, true)` (`0xa22cb465` [V]) ; `approve(to, tokenId)` ERC-721 (un seul NFT) ; ERC-1155 n'a que setApprovalForAll.
- Réellement : l'opérateur peut transférer tous les NFT de la collection, présents et futurs, sans limite de durée. Beaucoup de places de marché demandent légitimement cette approbation (Seaport conduit, Blur).
- Incidents : cité dans la définition du phishing par signature 2025 de Scam Sniffer, part non trouvée [S]. Fraudes NFT massives 2022-2023 : ScamSniffer NFT airdrop phishing case study [S].
- Reconnaissance : sélecteur, `approved == true`, operator vs liste blanche (OpenSea conduit, Blur, etc.). Une révocation (`false`) est bénigne.
- Gravité : Critique si opérateur inconnu ; Moyenne si marketplace reconnu.
- Phrase : "Vous donnez à X le droit de déplacer TOUS vos NFT de cette collection, y compris ceux que vous recevrez plus tard."

### 2.7 Seaport / OpenSea / Blur orders (offres, listings à 0)
- Structure Seaport (EIP-712) [V] : `OrderComponents{ offerer, zone, offer[ItemType, token, identifier(OrCriteria), startAmount, endAmount], consideration[+recipient], orderType, startTime, endTime, zoneHash, salt, conduitKey, counter }`.
- Réellement : `offer` = ce que le signataire cède ; `consideration` = ce qu'il reçoit. Un listing à 0 : consideration vide ou montant 0 -> n'importe qui remplit et prend le NFT gratuitement. [S] defihacklabs.substack.com (lesson 7), MetaMask support nft-listing-scams, cointelegraph (private auction scam, déc. 2022, 14 Bored Apes).
- Incident historique : février 2022, OpenSea, ordres à 0 signés par des victimes (ancien format Wyvern, puis Seaport EIP-712 plus lisible). [S]
- Variantes : un ordre dont l'`offer` contient des ERC-20 (usage détourné contre des utilisateurs d'OpenSea, selon un chercheur) [S] ; un `consideration` vers un `recipient` attaquant avec un token autre que l'ETH natif (adresse 0) est suspect [S].
- Durée : valable jusqu'à `endTime` ou annulation (`incrementCounter`/cancel), rejouable pour d'autres acheteurs non, mais un ordre peut être rempli par un tiers dès qu'il est public.
- Blur : non trouvé de source dédiée dans les résultats.
- Reconnaissance : domain.name "Seaport", verifyingContract Seaport 1.x connu ; calculer le bilan net (offer vs consideration reçue par l'offerer) ; alerter si `recipient` de la consideration != offerer et/ou valeur nette ≈ 0.
- Ne peut pas voir : valeur du NFT (prix du marché), critères/criteria resolvers sur offres larges, ordres de zones (zone/restricted) dont la logique est arbitraire.
- Gravité : Critique si net ≈ 0 ou négatif.
- Phrase : "Vous mettez en vente votre NFT pour [montant, ex. 0 ETH] : n'importe qui peut le prendre pour ce prix."

### 2.8 CoW Protocol / UniswapX / 1inch Fusion (intent-based)
- CoW : signature EIP-712 du digest `GPv2Order.Data` (sellToken, buyToken, receiver, sellAmount, buyAmount, validTo, appData, feeAmount, kind, partiallyFillable, ...) [V pour le détail des champs, non trouvé dans les résultats]. Schémas de signature : EIP-712, eth_sign, EIP-1271, pre-sign. [P] docs.cow.fi/cow-protocol/reference/core/signing-schemes. Le domain separator est propre à chaque déploiement du settlement contract. [P]
- Risque : un `receiver` différent du signataire, un `buyAmount` minuscule (échange à perte), une validTo très longue. Brave a travaillé avec CoW Swap sur un parseur de message pour lisibilité. [S] brave.com/blog/1.60-siwe-cow
- UniswapX : l'ordre est signé via Permit2 (witness) ; la signature autorise à la fois la libération des tokens d'entrée et l'exécution de l'ordre. [P/S] SDK uniswapx (README), developers.uniswap.org architecture. Donc un ordre UniswapX est une autorisation de dépense plafonnée par l'ordre (enchères hollandaises : montants de sortie décroissants, début/fin).
- 1inch Fusion : ordres intent-based, SDK pour signer et soumettre ; définition EIP-712 : non trouvé. [S] business.1inch.com. L'incident 1inch cité (phishing via clone d'interface) concerne le front-end, pas le format. [S]
- Reconnaissance : domain connu (GPv2Settlement, UniswapX reactor via Permit2 witness) -> afficher sell/buy, receiver, expiration. Alerter si receiver != signer ou prix très inférieur au marché (nécessite un oracle).
- Ne peut pas voir : le prix juste (sans oracle), la qualité d'exécution des solveurs/fillers.
- Gravité : Moyenne à haute (perte bornée par sellAmount, mais l'attaquant peut forger buyAmount minimal).
- Phrase : "Vous demandez à un tiers d'échanger [X] contre au moins [Y], pour le compte de [receiver], avant [date]."

### 2.9 personal_sign et eth_sign opaques (blind signing)
- personal_sign (EIP-191, préfixe "\x19Ethereum Signed Message:\n") : texte lisible, mais n'importe quel contenu ; sert au login, à la preuve de propriété, parfois à des "messages de réclamation" trompeurs. [V]
- eth_sign : signe un hash brut de 32 octets, sans préfixe -> peut être le hash d'une transaction ou d'une struct EIP-712 : totalement aveugle. MetaMask le masque derrière un réglage avancé avec alerte. [V sur MetaMask ; non confirmé dans cette session]
- CoW supporte eth_sign comme schéma. [P]
- Ce qu'un décodeur voit : pour personal_sign, texte (détecter hexadécimal d'un hash, mots "approve", "transfer"). Pour eth_sign : rien, sauf corréler le hash à une requête précédente (ex. hash de tx/typed data connu).
- Gravité : Critique pour eth_sign hash brut ; Moyenne pour personal_sign non-SIWE avec contenu hexadécimal.
- Phrase : "Vous signez un code illisible. Impossible de savoir ce qu'il autorise ; ne signez pas."

### 2.10 SIWE / EIP-4361
- Structure : message texte formaté (domain, address, statement, uri, version, chainId, nonce, issuedAt, expirationTime, notBefore, requestId, resources). Signé via personal_sign. [V ; EIP-4361 non lu directement]
- Défense : le `domain` doit correspondre au site demandeur ; Brave vérifie domaine, compte et chaîne, avec erreur en cas de décalage ; MetaMask affiche un avertissement mais n'empêche pas de continuer. [S/P] brave.com/blog/1.60-siwe-cow ; docs.metamask.io SIWE.
- Faiblesse : la spec donne peu de consignes de sécurité explicites sur les attentes des wallets (avis communautaire). [S] ethereum-magicians.
- Abus : champs `statement` et `resources` libres (peuvent contenir du texte trompeur, des URI) ; sites imitant un domaine ; un site malveillant relayant un SIWE légitime d'un autre domaine (bloqué si le domaine est vérifié).
- Ce qu'il accorde : une session sur le service ; aucun droit de dépense.
- Gravité : Faible si domaine concordant ; Haute si domaine différent (phishing de session) ; ne peut jamais déplacer de fonds seul.
- Phrase : "Vous prouvez que vous possédez ce wallet pour vous connecter à [domaine]. Aucun argent n'est déplacé."

### 2.11 EIP-712 génériques inconnus
- Un typed data dont le (verifyingContract, primaryType) n'est pas reconnu. Les drainers utilisent des types ressemblant à Permit, ou d'autres (setOwner sur proxy en 2024, 31,9 % des pertes des gros cas) [S].
- Règle pour le décodeur : afficher les champs bruts, signaler ceux qui ressemblent à une adresse (spender/operator/owner/recipient/to), à un montant, à une date ; alerte "structure inconnue" plutôt que silence. L'issue Rabby #2969 ("Unknown Signature Type") montre l'écueil UX : un message sans explication ne protège pas. [S] github.com/RabbyHub/Rabby/issues/2969
- Ne peut pas voir : la sémantique réelle, car le contrat vérifieur décide de l'effet ; lire son code (ABI/source) est la seule voie, d'où la valeur d'une base de types connus + une heuristique de proximité de noms.
- Gravité par défaut : Haute (inconnu = non vérifiable) ; baisse si le verifyingContract est un protocole listé.

### 2.12 ERC-1271 (comptes à contrat)
- Mécanisme : `isValidSignature(hash, signature)` retourne 0x1626ba7e si valide. Le contrat décide ce qui est valide ; pour Permit2, CoW, etc. les signatures de smart accounts passent par là. [P] (via ERC-7739/alchemy)
- Faille de rejeu : si le contrat vérifie seulement un ECDSA du hash par le propriétaire, la même signature vaut sur tous les comptes contrôlés par ce propriétaire (hash sans adresse du compte). Découvert par Alchemy en octobre 2023 (LightAccount, OKX SmartAccount) ; applications à risque : Permit2, CoW Swap. [S] alchemy.com/blog/erc-1271-signature-replay-vulnerability
- Correctif : ERC-7739 (re-hachage EIP-712 imbriqué lié au compte, lisible dans les wallets) ; implémentation Solady. [P] ercs.ethereum.org/ERCS/erc-7739. Coinbase CDP SDK enveloppe les typed data dans un hash lié à chainId et à l'adresse du compte. [S]
- ERC-7964 : omet délibérément le chainId pour des signatures multi-chaînes. [S] eco.com (secondaire).
- Ce que le décodeur ne peut pas voir : la logique interne de isValidSignature ; un contrat peut accepter des signatures arbitraires. Il peut seulement détecter si le compte utilise ERC-7739 (selon l'enveloppe).
- Gravité : Haute si le compte n'est pas protégé contre le rejeu.
- Phrase : "Votre compte intelligent pourrait accepter cette signature sur d'autres comptes que vous possédez."

### 2.13 Messages cross-chain / bridge
- Structures très variables : ordres d'intents (ERC-7683), messages LayerZero/CCIP/Wormhole (généralement des transactions, pas des signatures), permis de bridge. Recherche dédiée non faite dans cette session ; ERC-7683 : non trouvé.
- Risques généraux [V] : destinataire sur la chaîne de destination (adresse non contrôlée si compte à contrat), chainId de destination, signatures rejouables sur d'autres chaînes quand le domaine omet chainId.
- À faire (R ultérieure) : cartographier ERC-7683, Across, deBridge, LayerZero OFT sendFrom (le `to` est un bytes32).
- Gravité : Haute (fonds quittent la chaîne, irréversible).

### 2.14 Session keys et spend permissions (ERC-7715, Coinbase)
- ERC-7715 : méthode RPC `wallet_grantPermissions` ; un dapp demande des permissions (type, politiques comme plafond ou fenêtre de temps, signataire) ; le wallet renvoie un contexte de permissions utilisable pour les UserOperations. Statut Draft. [S] eco.com/support/en/articles/15254038 (secondaire, à vérifier sur eips.ethereum.org).
- Coinbase Spend Permission Manager : struct `SpendPermission{ account, spender, token, allowance, period, start, end, salt, extraData }` ; signé en EIP-712 puis `approveWithSignature` ; `spend` appelable uniquement par le spender, `revoke` par le compte ; compatible ERC-6492. [P] docs.base.org / docs.cdp.coinbase.com (spend-permissions).
- Réellement : droit RÉCURRENT : `allowance` par `period` entre `start` et `end` (cumulable sur la durée : allowance x nombre de périodes). Plus dangereux qu'un permit unique si `end` est lointain.
- Lien exact ERC-7715 <-> SpendPermission : non trouvé ; ne pas les confondre.
- Reconnaissance : domain "Spend Permission Manager" + adresse officielle [V] ; calculer le plafond total = allowance x ceil((end-start)/period).
- Ne peut pas voir : ce que le spender fait des fonds après retrait ; les politiques custom d'autres wallets (formats propriétaires).
- Gravité : Haute (récurrent, durable). 
- Phrase : "Vous autorisez X à prélever jusqu'à [montant] tous les [période], du [début] au [fin] : au total jusqu'à [total]."

### 2.15 EIP-7702 (authorization tuples)
- Structure : tuple (chain_id, address, nonce) signé ; le compte EOA délègue son code à `address`. chain_id = 0 autorise l'usage sur toutes les chaînes. [P/S] frameworks.securityalliance.org (verifying-7702).
- Menace décrite : des sites trompent l'utilisateur pour signer une délégation vers un contrat malveillant ("mise à niveau du wallet") ; avec chain_id 0 le tuple est rejouable sur d'autres chaînes (risque documenté, incident précis non confirmé). [P/S]
- Réalité 2025 : Wintermute rapporte que >80 % des délégations 7702 visaient un seul script balayeur (sweeper) sur des wallets dont la clé privée a fuité ; la clé compromise vient avant, 7702 sert d'outil (un ingénieur Base conteste le cadrage "attaque 7702"). Cas WLFI cité. [S] theblock.co (2025-06-01), cointelegraph via tradingview. Scam Sniffer 2025 : malicious 7702 signatures, 2 gros cas en août. [S]
- Défenses : wallets qui n'autorisent qu'une délégation à des contrats codés en dur ; la délégation se défait en re-déléguant à l'adresse zéro. [S]
- Reconnaissance : type 0x04 (SetCode) ou méthode wallet dédiée ; vérifier `address` contre une liste blanche d'implémentations (ex. smart wallets audités) ; alerter sur chain_id 0 ; nonce.
- Ne peut pas voir : le code du contrat délégué sans le désassembler, upgradeability du contrat.
- Gravité : Critique (contrôle total du compte) si destination non listée.
- Phrase : "Vous remplacez le fonctionnement de votre compte par le programme X : il pourra tout faire à votre place, sur une ou plusieurs blockchains."

### 2.16 Délégation de gouvernance
- ERC-5805 : `delegateBySig(delegatee, nonce, expiry, v, r, s)` change le délégué de votes ; nonce incrémenté ; événement DelegateChanged. [P] ercs.ethereum.org/ERCS/erc-5805
- Ce qu'on accorde : pouvoir de vote (pas de fonds) ; effet potentiel sur gouvernance, rémunérations de délégué, attaques de gouvernance. Aucun incident de phishing par delegateBySig trouvé ; risque théorique. [S]
- Lien réel : leurres "vote rewards" qui mènent à des approbations draineuses (ETHFI, X Layer, Beam) ; délégué MakerDAO volé par permits (~11 M$). [S]
- Reconnaissance : primaryType Delegation, champs delegatee/nonce/expiry (domaine = token de gouvernance).
- Gravité : Faible à moyenne ; Haute pour une trésorerie DAO ou un délégué.
- Phrase : "Vous donnez vos voix de vote à X pour les décisions du protocole. Vos fonds ne bougent pas."

---

## 3. État de l'art : lecture automatique du typed data par les wallets

À ne pas refaire ; à compléter ou différencier.

- MetaMask + Blockaid : alertes de sécurité activées par défaut depuis le 20 février 2024 ; les transactions et demandes de signature sont envoyées à un serveur (MetaMask pour EVM, Blockaid pour non-EVM) ; avertissement "This is a deceptive request" si perte de fonds possible. Au lancement (2023) annoncé comme simulation locale (module PPOM) ; la doc actuelle indique un serveur, donc ancien modèle à ne pas supposer. Faux positifs connus. [P/S] support.metamask.io/configure/wallet/how-to-turn-on-security-alerts ; decrypt.co/203803 ; fortune.com.
- MetaMask simulations : estimation des changements de solde pour les TRANSACTIONS (ERC-20, 721, 1155), serveur centralisé, prédiction non garantie. Que cela couvre aussi les signatures typed data (Permit, Permit2) : non trouvé dans les sources lues. [P] support.metamask.io/manage-crypto/transactions/simulations/ (à vérifier : MetaMask a livré des "Signature simulations" dans ses versions récentes, non confirmé ici) [V].
- Blockaid : API EVM avec routes de scan de transactions, adresses, tokens, sites et messages signés (POST /v0/evm/json-rpc/scan) ; champs du verdict et traitement des permits illimités : non trouvé. [S] apis.apievangelist.com ; docs.portalhq.io.
- Rabby : description marketing = simulation avant signature (changements de solde, approbations), avertissements d'allowance illimitée sur contrat non vérifié [S, sources de qualité faible, plusieurs clones]. Retours utilisateurs : issue #2969 "Unknown Signature Type" sans explication (version 0.93.28) ; issue #4156 un Permit de phishing affiché de façon anodine, sans token ni montant. Statut actuel : à vérifier. [S] github.com/RabbyHub/Rabby/issues/2969 et /4156.
- Brave Wallet : parseur SIWE (vérifie domaine, compte, chaîne) et parseur CoW Swap pour lecture des ordres. [S/P] brave.com/blog/1.60-siwe-cow
- ERC-7739 : propose de rendre lisibles les signatures de smart accounts. [P]
- Outils tiers : inspecteur EIP-712 open source signalant Permit/Permit2/Seaport (montants illimités, deadlines lointaines, chainId qui diffère). [S] github.com/Dansgit2b/eip712-inspector
- Écarts à exploiter (hypothèses [V]) : (1) comparer à l'INTENTION déclarée de l'utilisateur (aucun wallet ne le fait) ; (2) tableau unifié d'effets (qui peut prendre quoi, combien, jusqu'à quand, rejouable) pour toutes les classes ci-dessus ; (3) phrases grand public en français ; (4) couverture des cas peu traités : witness, PermitBatch, DAI allowed, Spend Permissions, 7702 chain 0, ordres Seaport nets à 0.

---

## 4. Ce qu'un décodeur ne peut pas voir (synthèse)
1. Logique du contrat vérifieur (ERC-1271, hooks, zones Seaport, witness arbitraire).
2. Réputation en temps réel du spender (nécessite flux de renseignements ; Blockaid-type).
3. État on-chain (nonces, allowances Permit2 existantes, approve vers Permit2) sans appel RPC.
4. Intention hors chaîne (promesse du site) : seule l'intention déclarée à l'outil la révèle.
5. Prix de marché (valeur NFT, prix de swap) sans oracle.
6. Contenu hexadécimal d'un eth_sign / hash brut.
7. Contrats upgradeables : un spender sain aujourd'hui peut devenir malveillant.
8. Ordre d'exécution futur : une signature est un chèque, son usage dépend de qui la détient et quand.

## 5. Barème de gravité proposé (à calibrer)
- Critique : permit/DAI permit/Permit2 vers spender inconnu ; setApprovalForAll inconnu ; Seaport net ≈ 0 ; eth_sign brut ; 7702 vers contrat non listé.
- Haute : approve illimité, SignatureTransfer, Spend Permission, EIP-712 inconnu, ERC-1271 non protégé, bridge.
- Moyenne : ordres CoW/UniswapX, délégation de vote, approve borné.
- Faible : SIWE avec domaine concordant, révocations (approve 0, setApprovalForAll false).

## 6. Sources principales
- drops.scamsniffer.io/?p=971 ; drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ ; defihacklabs.substack.com (lessons 7, scam sniffer 2024)
- docs.uniswap.org/contracts/permit2/reference/signature-transfer ; developers.uniswap.org/docs/protocols/permit2/concepts/signature-transfer
- ercs.ethereum.org/ERCS/erc-2612, erc-5805, erc-7739
- docs.base.org/base-account/reference/onchain-contracts/spend-permissions
- frameworks.securityalliance.org/wallet-security/verifying-7702.html ; theblock.co/news/ecosystems/2025-06-01-wintermute-warns-pectra-upgrade...
- alchemy.com/blog/erc-1271-signature-replay-vulnerability
- docs.cow.fi/cow-protocol/reference/core/signing-schemes
- support.metamask.io (security alerts, simulations) ; brave.com/blog/1.60-siwe-cow ; github.com/RabbyHub/Rabby/issues/2969, 4156
- forum.openzeppelin.com (USDT safeApprove) ; forum.moralis.io (DAI permit)

---

## Résumé en 8 lignes
1. Seize classes de droits/signatures cartographiées ; chaque fiche : structure, croyance, effet réel, rejeu, reconnaissance, angle mort, gravité, phrase.
2. Données Scam Sniffer : 2024 ~494 M$, Permit 56,7 % des pertes des gros cas (dénominateur à ne pas généraliser) ; 2025 ~83,85 M$, Permit+Permit2 38 % des cas > 1 M$. Sources secondaires.
3. Pièges décodeur clés : USDT (pas de bool, non-zéro vers non-zéro), DAI permit (pas de `value`, toujours illimité), Permit2 (token dans les détails, pas dans le domaine), SignatureTransfer (destinataire choisi par le spender, witness arbitraire).
4. Seaport : le danger est le bilan net offer/consideration ; listings à 0 historiques (OpenSea 2022, Bored Apes déc. 2022).
5. Spend permissions Coinbase : droit récurrent, total = allowance x nombre de périodes ; ERC-7715 encore Draft, lien exact non trouvé.
6. EIP-7702 : la majorité des délégations observées en 2025 = balayeurs sur clés déjà fuitées ; chain_id 0 = risque de rejeu multi-chaînes (incident précis non confirmé).
7. État de l'art : MetaMask+Blockaid (alertes serveur par défaut), Rabby (simulation, lacunes signalées), Brave (parseurs SIWE/CoW) ; aucun ne compare à l'intention déclarée -> créneau du produit. Non trouvé : couverture exacte typed data MetaMask/Blockaid, champs de verdict Blockaid, EIP-712 de 1inch Fusion, ERC-7683, Blur.
8. Beaucoup de structures citées sont [V] (mémoire, non relues à la source) : vérifier sur GitHub Uniswap/permit2, Seaport, GPv2, EIP-7702/7715 avant de les coder.

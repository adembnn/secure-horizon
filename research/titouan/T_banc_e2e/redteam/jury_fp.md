# Red team juré : faux positifs de Hold up sur des opérations honnêtes (Avalanche)

Point de vue : juré développeur Avalanche (Team1) qui utilise la DeFi tous les jours. Méthode en boîte noire, avec `redteam/check.mjs` comme seul outil. Je n'ai lu ni `engine/`, ni `run/`, ni `detectors_adem/`.
Jeu de test : `redteam/jury_fp.jsonl`, 123 opérations légitimes, toutes `label = benin`. Les utilisateurs sont synthétiques. Les adresses de protocoles sont les adresses publiques mainnet (C-Chain 43114) : LFJ v1 / LB 2.1 / LB 2.2, Pangolin, Odos, 1inch v6, ParaSwap, Uniswap UR, Permit2, Aave v3 Pool et Gateway, Benqi qiAVAX / qiUSDCn, sAVAX, WAVAX, CCTP TokenMessenger, WETH.e / BTC.b (pont Core), Seaport 1.5 et le conduit OpenSea.
Le contexte reprend le registre `known_protocols` du banc public. sAVAX, Seaport et le conduit OpenSea n'y figurent pas, sauf dans le cas 040.
`expected_severity` est la sévérité maximale qu'un utilisateur honnête peut tolérer. Elle vaut `warn` seulement pour les approbations illimitées, une part du solde de 50 % ou plus, un premier envoi vers une adresse neuve, un `setApprovalForAll` ou une erreur de type d'intention. Les champs `bypass`, `observed_level` et `observed_level_sans_intention` reprennent ce que le moteur a réellement produit.

## Résultat

| Verdict | Cas | Taux |
|---|---|---|
| critical (faux positif grave) | 22 | 17,9 % |
| warn (fatigue) | 63 | 51,2 % |
| ok | 38 | 30,9 % |
| **fatigue totale (warn + critical)** | **85** | **69 %** |

L'objectif du contrat est FP critical < 2 %. Ici, on est à 17,9 %. Si on exclut les 3 erreurs de type d'intention, qu'on peut défendre comme voulues, on reste à 19/120, soit 15,8 %.

## Faux positifs critical (22), regroupés par cause probable vue de l'extérieur

1. **La virgule décimale française est lue comme un montant plus élevé.** Cas 077 et 122. L'intention « payer paul 10,5 avax » contre une transaction réelle de 10,5 AVAX donne `amount_exceeded` : « tu enverrais 10.5 NATIVE, plus que prévu ». Le parseur de montant ne gère pas la virgule, et la comparaison échoue dans le mauvais sens, vers critical. Pour un produit en français, ce cas arrive à presque tous les paiements non entiers.
2. **Après un empoisonnement d'adresse, payer le vrai contact déclenche une alerte.** Cas 076 et 123. Un dust entrant arrive d'une adresse sosie (mêmes 4 premiers et derniers caractères). L'utilisateur choisit ensuite le VRAI Paul dans son carnet, déjà payé avant. Le moteur sort `address_poisoning` + `lookalike_address` en critical et lui explique que l'adresse de son ami « ressemble à une adresse que tu as utilisée, c'est une arnaque ». La comparaison de sosies est symétrique : elle ne vérifie pas que le destinataire est justement l'original présent dans le carnet. Or presque tout wallet actif sur C-Chain reçoit du dust de ce type, et l'utilisateur ne peut alors plus payer ses contacts sans voir rouge.
3. **Aucun type d'intention pour « déposer / prêter / bridger ».** Cas 026, 031, 036, 038, 046, 052 et 091. Avec l'intention `send_to_my_account` (« Déposer 1000 USDC sur Aave », « je mets mes sous sur Aave », « Envoyer mes USDC sur mon compte Ethereum » via CCTP), toute approbation donne `unexpected_approval` critical : « un tiers pourrait prendre tes tokens ». Ça vaut même pour une approbation EXACTE au TokenMessenger CCTP (046), pour un permit EIP-2612 exact vers le Pool Aave (031) et pour un batch EIP-5792 approve exact + supply (038). Le Pool Aave et CCTP figurent pourtant dans `known_protocols`. Avec le type `buy_or_swap`, la même approbation reste en warn (027). Le verdict dépend donc du bouton choisi, pas du risque.
4. **Le staking sAVAX (Benqi), premier LST d'Avalanche.** Cas 039, 041 et 042. `submit()` payable n'est pas décodé. Avec `buy_or_swap`, on obtient `no_incoming` : « tu enverrais des fonds sans rien recevoir en retour ». Avec `send_to_my_account`, on obtient `first_seen_recipient`. En ajoutant sAVAX au registre, on redescend en warn (040). Le verdict dépend donc d'une liste blanche, pas des effets réels.
5. **L'ajout du réseau Fuji est classé « usurpation de symbole ».** Cas 067. `wallet_addEthereumChain` 43113 avec le RPC officiel `api.avax-test.network` donne `chain_add_native_symbol_spoof` critical. Fuji est le testnet officiel d'Avalanche, et c'est la chaîne de démo du projet lui-même. Le passage sur Fuji (118) sort aussi en warn.
6. **Une première mise en vente NFT sur OpenSea.** Cas 053 et 054. `setApprovalForAll` vers le conduit OpenSea donne `approval_for_all` critical dès le plancher du moteur, quelle que soit l'intention. Le conduit est absent du registre. C'est pourtant le flux standard de toute première mise en vente d'une collection. La signature Seaport elle-même passe en ok (055).
7. **Une nouvelle adresse à soi.** Cas 084 et 089. Une première adresse de dépôt Coinbase copiée depuis l'app, ou un nouveau wallet Rabby à soi, donne `first_seen_recipient` critical. C'est conforme à la règle du contrat, mais c'est un faux positif pour l'utilisateur. Un warn suffirait.
8. **Une erreur honnête de type d'intention.** Cas 108 (« Payer » pour une approbation de swap), 110 (« Se connecter » pour un swap) et 056 (« Se connecter » pour une mise en vente Seaport). Ces verdicts sont défendables par le contrat, mais un utilisateur qui coche le mauvais bouton reçoit le même écran qu'une victime de drainer.

## Fatigue (63 warn) : les causes dominantes

- **Le swap le plus basique d'Avalanche n'est pas décodé.** `swapExactAVAXForTokens` (0xa2a1623d) et `swapExactTokensForAVAX` (0x676528d1) sortent « sélecteur hors registre / opaque » sur LFJ v1 et Pangolin (001, 005, 008, 015, 016, 097, 099, 107). `swapExactTokensForTokens` passe pourtant en ok (006).
- **Les flux DeFi courants sont opaques.** Aave `supply` / `withdraw` / `repay` / `borrow` / `depositETH`, Benqi `mint()`, CCTP `depositForBurn`, `unwrap` du pont Core, Odos `swapCompact` et 1inch v6 `swap` sortent tous en warn « opaque ».
- **Chaque approbation illimitée vers un routeur connu donne un warn.** LFJ, LB, Pangolin, Odos, 1inch, ParaSwap, UR et Permit2, approve comme signature. C'est défendable, mais c'est la norme de l'UX DeFi, donc l'alerte apparaît presque à chaque session.
- **Un vote Snapshot cumule 4 warn.** `domain_without_chainid` alors que le domaine Snapshot n'a jamais de chainId, `Vote` inconnu, `opaque`, et une adresse dans `message.from`.
- **Une part du solde ≥ 50 % donne un warn.** Envoi vers son propre Ledger, wrap de 60 % de ses AVAX. C'est conforme au contrat, mais ça s'ajoute au reste.
- **Ce qui passe proprement en ok** : paiements à un contact du carnet, dépôt vers un exchange déjà utilisé, wrap / unwrap, SIWE, connexion OpenSea, signature Seaport de mise en vente, Permit2 exact, approbations exactes et toutes les révocations (approve 0, setApprovalForAll false, Permit2 à 0).

## Les 3 pires

1. **La virgule décimale (077, 122).** « payer paul 10,5 avax » contre 10,5 AVAX réels donne critical « tu enverrais plus que prévu ». C'est un produit français qui rejette la façon française d'écrire un nombre.
2. **L'empoisonnement retourné contre la victime (076, 123).** Après un dust sosie, payer le vrai contact du carnet sort en critical et désigne l'ami comme une arnaque. L'outil apprend à l'utilisateur à ignorer précisément l'alerte qui devait le protéger.
3. **« Je mets mes sous sur Aave » (091, plus 026, 031, 036, 038, 046, 052).** Toute approbation, même exacte, vers Aave, Benqi ou CCTP sous l'intention « vers mon compte » sort en critical « un tiers pourrait prendre tes tokens ». Le staking sAVAX fait pareil (039 : « tu enverrais des fonds sans rien recevoir »).

## Ce qu'un juré dirait sur scène

> « J'ai fait ma semaine DeFi normale sur Avalanche : un swap sur LFJ, un dépôt Aave, du sAVAX, un pont CCTP et un remboursement à un pote de 10,5 AVAX. Hold up m'a crié à l'arnaque une fois sur six et m'a mis un orange deux fois sur trois. Au troisième rouge sur mon propre dépôt Aave, je la désinstalle, et c'est le jour où un vrai drainer arrive que je ne l'ai plus. »

## Limites de ce jeu

- Ces sélecteurs ont été écrits de mémoire, sans vérification : `unwrap(uint256,uint256)` du pont Core (0x6e286671) et `swap` de 1inch v6 (0x07ed2379). Le calldata `swapCompact` d'Odos est schématique. Ces écarts ne touchent que des warn, pas les critical.
- La part du solde est fournie par `share_of_balance_pct`. L'historique, le carnet et les `counterparty_facts` sont choisis pour représenter un utilisateur actif typique.
- Le seuil `expected_severity` reflète le jugement d'un utilisateur DeFi quotidien. Le cas 045 (wrap de 60 % du solde) est noté `ok` mais sort en warn, ce qui est conforme au contrat. Il compte dans la fatigue.

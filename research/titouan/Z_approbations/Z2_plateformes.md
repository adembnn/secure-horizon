# Z2. Approbations ERC-20 : que demandent les plateformes ?

Date de la recherche : 2026-10-11. Méthode : WebSearch et WebFetch, lecture seule.

Légende. [V] = page ouverte et lue par moi (passage cité). [NV] = non lu : page en erreur 403, ou information vue seulement dans un résumé de moteur de recherche, ou introuvable. Rien n'est deviné. « introuvable » veut dire : aucune source trouvée dans cette session.

Limite honnête : les interfaces changent souvent. Beaucoup de pages officielles (support Uniswap) ont répondu 403. Le code source des fronts (GitHub) n'a pas pu être lu. Pour la plupart des plateformes, le montant exact demandé par l'interface actuelle est donc INTROUVABLE par lecture. La seule vérification fiable : ouvrir l'écran d'approbation et décoder le calldata `approve` (2^256-1 = illimité).

## Tableau (Ethereum et multichaîne)

| Plateforme | Défaut | Exact possible | Source (passage, date) | V/NV |
|---|---|---|---|---|
| Uniswap, contrat Permit2 (doc dev) | Doc recommande une approbation max (uint256) du jeton vers Permit2. Ensuite, allocation par signature avec montant et expiration propres | Oui côté protocole : « allowances also carry their own expiration » | https://developers.uniswap.org/docs/protocols/permit2/overview (via llms.mdx). Doc : « users can choose a max approval ». Date de page : non indiquée | [V] |
| Uniswap, interface (app web) | Selon l'aide Uniswap : approbation unique on-chain vers Permit2, puis signature ; l'app utilise une durée de 30 jours. Montant de l'approbation on-chain vers Permit2 : introuvable | Aide Uniswap décrit exact, « balanced », illimité (article ancien) | https://support.uniswap.org/hc/en-us/articles/39683402190733 et .../18674038953613 : erreur 403, vus seulement dans un résumé de recherche | [NV] |
| 1inch | Introuvable. L'aide dit seulement : « Most protocols have users approve an infinite amount of tokens » et conseille des approbations limitées | Introuvable pour l'interface | https://help.1inch.com/en/articles/6147312-token-approvals ; permit EIP-2612 valable 30 minutes pour les jetons compatibles : https://help.1inch.com/en/articles/5435386-permit-signed-token-approvals-and-how-they-work-on-1inch. Aucune de ces pages ne donne le montant par défaut | [V] pour les citations, montant par défaut introuvable |
| CoW Swap | Illimité : « By default, CoW Swap prompts you to give vault relayer an "unlimited" allowance for the sell token » | Non précisé par la page. Le SDK permet un montant choisi (`approveCowProtocol(amount)`) | https://docs.cow.fi/cow-protocol/tutorials/cow-swap/swap (page sans date). Post CoW (3 ans environ, date exacte absente) : modal « encouraging them to set infinite approvals » : https://typefully.com/CoWSwap/knG7jA0 | [V] |
| Paraswap / Velora | Introuvable | Le SDK prend un montant (`approveToken(amount, token)`), permit 1 ou 2 mentionné. Interface : introuvable | https://unpkg.com/@velora-dex/sdk@8.1.0/README.md (vu en résumé de recherche seulement) | [NV] |
| Matcha / 0x | Montant du trade : « The default amount we give to your wallet is the amount for the transaction » (approbation une fois par jeton et par portefeuille, v4). Utilise AllowanceHolder | Oui, l'utilisateur peut modifier dans son portefeuille | https://help.matcha.xyz/articles/9245664666-why-do-i-need-to-approve-my-tokens-before-i-can-trade-them (« Last updated 7 months ago », date exacte absente). Blog du 2024-07-15 : « Permit2 configured for the strictest one-time allowance » : https://blog.matcha.xyz/article/permit2 | [V] |
| Curve | En 2021 : l'UI affichait « approve 10 USDT » mais MetaMask recevait une approbation illimitée. Curve répondait que « users didn't like approving every time ». Interface actuelle : introuvable | Introuvable | https://blocksec.com/blog/tradeoff-between-convenience-and-security-unlimited-approval-in-erc-20 (2021-08-17). Forum Curve (403) : https://gov.curve.finance/t/unneccessary-token-approval/1488 | [V] blog 2021 ; interface actuelle [NV] |
| Aave | Avec permit EIP-2612 : montant exact avec échéance, aucune allocation résiduelle. Sans permit : approbation classique, montant par défaut introuvable | Oui via permit (jetons compatibles) | https://aave.com/docs/aave-v3/markets/operations : « Permits let you sign for a specific amount rather than granting infinite approvals » (page sans date) | [V] |
| Compound | En 2021 : « the Compound platform defaults the unlimited approval for users ». Interface actuelle : introuvable | Introuvable | Même article BlockSec, 2021-08-17 | [V] blog 2021 ; actuel [NV] |
| Lido | Introuvable. Le contrat wstETH supporte EIP-2612. Un plugin tiers (OKX) approuve le montant exact pour la file de retrait, ce n'est pas l'interface Lido | Introuvable | https://docs.lido.fi/contracts/wsteth (vu en résumé de recherche) | [NV] |
| OpenSea (Seaport, conduit) | Introuvable. Fait établi par résumé : l'approbation vise le conduit OpenSea 0x1E0049783F008A0085193E00003D00cd54003c71. Montant ERC-20 demandé : introuvable | Introuvable | https://support.opensea.io/hc/ja/articles/4449355421075 (résumé de recherche seulement) | [NV] |
| Blur | Introuvable. Les offres passent par un pool ETH (dépôt), pas par une approbation ERC-20 d'après les résumés. Approbations NFT : introuvable | Introuvable | Résumés de recherche seulement | [NV] |
| Safe | Introuvable pour l'écran de swap natif de Safe. Les swaps passent par CoW : approbation + ordre dans une seule transaction Safe. Le défaut CoW est illimité (voir ligne CoW) | Introuvable | https://help.safe.global/en/articles/233902-safe-wallet-native-swaps (résumé de recherche seulement) | [NV] |

## Tableau (Avalanche)

| Plateforme | Défaut | Exact possible | Source | V/NV |
|---|---|---|---|---|
| Trader Joe / LFJ (Joe v2.1) | Introuvable. Seule info : une approbation est demandée au premier échange du jeton | Introuvable | Guides tiers peu fiables, non retenus | [NV] |
| Pangolin | Introuvable | Introuvable | Aucune source | [NV] |
| Benqi | Introuvable | Introuvable | Aucune source | [NV] |
| GMX | Introuvable. Le cours Cyfrin montre une demande « Spending cap request » sans dire le montant | Introuvable | https://updraft.cyfrin.io/courses/gmx-perpetuals-trading/foundation/ui-gmx-pool-shift-liquidity (résumé seulement) | [NV] |
| Core (swap) | Introuvable | Introuvable | Aucune source | [NV] |
| Yield Yak | Introuvable | Introuvable | Aucune source | [NV] |
| Stargate / bridges | Introuvable | Introuvable | Aucune source | [NV] |

Note : l'aide MetaMask indique que les dapps pré-remplissent souvent un montant très grand dans la demande de plafond de dépense (https://support.metamask.io/manage-crypto/portfolio/spending-caps-portfolio, résumé de recherche). Valable pour tout portefeuille EVM, donc Avalanche, mais non confirmé pour ces dapps précises.

## Standards qui poussent vers l'exact ou le borné

- Permit2 (Uniswap) : les allocations ont montant et expiration propres. Mais l'approbation initiale vers Permit2 est recommandée en max. Le plafond est déplacé, pas supprimé. [V] https://developers.uniswap.org/docs/protocols/permit2/overview
- EIP-2612 (permit) : signature avec montant et échéance, utilisée par Aave et 1inch (30 minutes). [V] via les pages ci-dessus. Spécification : https://eips.ethereum.org/EIPS/eip-2612 [NV, non ouverte].
- ERC-7715 (brouillon) : `wallet_requestExecutionPermissions`, permissions avec règle `expiry` et montant dans les données. Texte : « DApps should only request the permissions they need, with a reasonable expiration time ». [V] https://eips.ethereum.org/EIPS/eip-7715
- Swaps par intention (CoW, Matcha en mode one-time) : l'approbation vise un contrat de règlement unique. CoW défend l'illimité parce que son contrat de règlement est non modifiable et audité (post CoW cité plus haut, [NV] pour cet argument, vu en résumé). Matcha défend l'inverse (blog 2024, [V]). Positions opposées.

## Position des auditeurs et de la communauté

- Coinbase, « Security PSA: Infinite Token Approvals » : https://www.coinbase.com/blog/security-ps-infinite-token-approvals (page en 403, contenu vu en résumé de recherche seulement : 405 M$ volés par exploits d'approbations depuis 2020, selon revoke.cash) [NV]
- BlockSec, 2024-02-05, compromis confort et sécurité : https://blocksec.com/blog/exploring-the-tradeoff-between-convenience-and-security-in-unlimited-approval-erc-20-tokens [V]
- BlockSec, 2021-08-17, comparaison Curve, Compound, Bancor, Yearn : voir tableau [V]
- Étude Monash / arXiv 2207.01790, « Penny Wise and Pound Foolish » : approbation illimitée dans 60 % des cas (15,2 M sur 25,4 M), tous les dapps étudiés demandent l'illimité, 0,2 % des utilisateurs suivent la bonne pratique. https://arxiv.org/abs/2207.01790 [NV, chiffres vus en résumé de recherche]
- Aide 1inch : conseille les approbations limitées. https://help.1inch.com/en/articles/6147312-token-approvals [V]
- Le titre exact « infinite approvals considered harmful » : introuvable comme titre de page.

## Conclusions chiffrées (sur 20 plateformes du périmètre)

Périmètre compté : 13 lignes Ethereum (Uniswap en 2 lignes, comptées 1) + 7 Avalanche, soit 19 à 20.

1. Illimité par défaut, source lue : 1 sur 20 aujourd'hui (CoW Swap, documentation officielle). Curve et Compound l'étaient en 2021 d'après un article BlockSec lu : 3 sur 20 si on accepte des sources anciennes. Uniswap recommande le max pour l'approbation vers Permit2, ce qui ferait 4 sur 20, mais le comportement réel de l'interface n'a pas pu être lu.
2. Exact ou borné par défaut, source lue : 2 sur 20. Matcha (montant du trade, modifiable dans le portefeuille) et Aave quand le jeton supporte le permit EIP-2612. Pour Aave, le défaut sans permit n'est pas établi.
3. Introuvable ou non lu : 14 à 15 sur 20, dont les 7 plateformes Avalanche (0 source). On ne peut donc pas conclure que « la majorité demande l'illimité » à partir de cette recherche. La littérature (étude de 2021, aides 1inch et MetaMask) dit que l'illimité domine, mais aucune source lue ne le prouve plateforme par plateforme en 2026.

## Pour Hold up

Pour combler les [NV] : sur un compte de test, ouvrir l'écran d'approbation de chaque plateforme, noter le montant du `approve` (calldata décodé) et la date. Sans cela, le produit ne doit pas affirmer « telle plateforme demande l'illimité ». Il doit lire le montant dans la transaction à signer, ce qui reste vrai quelle que soit l'interface.

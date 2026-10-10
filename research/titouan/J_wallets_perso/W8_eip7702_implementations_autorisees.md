# W8. Implémentations EIP-7702 acceptées ou bloquées par les wallets (état au 2026-10-10)

Légende : [P] doc officielle, [S] presse ou analyse tierce, [V] vendeur ou dépôt de code du vendeur, [I] inférence de l'auteur (non prouvée). "Non trouvé" = absent des sources lues.

## Résumé (8 lignes)

1. Aucun wallet majeur ne signe une délégation vers une adresse arbitraire demandée par un dApp. La pratique dominante est la liste blanche.
2. Ledger : politique de mai 2025, seul le contrat simple de la Fondation Ethereum, tout le reste bloqué au niveau de l'appareil [P]. En 2026, une PR ouverte (février 2026) demande d'ajouter Uniswap, Alchemy, Ambire, MetaMask, Luganodes. Statut "ouverte" lors de la lecture [V].
3. MetaMask : ne délègue qu'à son propre contrat ("EIP-7702 Delegator"), pas de choix d'une autre implémentation [P]. Les dApps n'ont pas accès à la signature d'autorisation [S].
4. Rabby : révocation 7702 supportée [V]. Avertissement 7702 spécifique non trouvé en source primaire. Signature d'autorisation depuis un dApp non exposée [S].
5. Trezor : support 7702 expérimental dans le firmware 2026, versions contradictoires entre changelogs [V]. Reconnaissance d'adresses de délégués avec vérification du chain_id [S].
6. Coinbase, Safe, Uniswap, Ambire, Alchemy, ZeroDev : chacun promeut sa propre implémentation, via ses propres apps. Rainbow : EOA seul selon Walletbeat, non daté.
7. Wintermute : plus de 80 % des délégations (juin 2025) vers un même code de vidangeur, puis plus de 97 % cité ensuite [S].
8. Verdict : aucune preuve d'un chemin pour une couche tierce arbitraire. Le seul chemin plausible passe par une implémentation déjà en liste blanche, puis des modules installés ensuite [I]. Non testé, non documenté.

## Tableau par wallet

| Wallet | Délégation vers adresse arbitraire | Liste blanche | Avertissement | Blocages | Preuves |
|---|---|---|---|---|---|
| Ledger | Non. Bloquée par l'appareil | Oui. 2025 : Simple7702Account (Fondation) seul. 2026 : extension demandée, non confirmée | Non trouvé en source primaire | "all other contracts using 7702 will be blocked at the device level" [P]. Academy (maj 8 oct 2026) : 7702 dispo sur Flex, Stax, Nano Gen5, X, S Plus ; aucune liste mentionnée [P] | https://www.ledger.com/blog-pectra-upgrade-announcement ; https://www.ledger.com/academy/topics/crypto/what-is-the-ethereum-pectra-upgrade ; PR #948 https://github.com/LedgerHQ/app-ethereum/pull/948 [V] ; Ambire PR #1931 : l'app officielle rejetait le délégateur d'Ambire https://github.com/AmbireTech/ambire-common/pull/1931 [V] |
| Trezor | Non trouvé (feature expérimentale) | Reconnaissance d'adresses de délégués connus, chain_id vérifié [S] | Non trouvé | Expérimental, flag requis, firmware 2.12.5+ pour le flux QA [V] | https://github.com/trezor/trezor-firmware/blob/main/core/CHANGELOG.md ; https://github.com/trezor/trezor-suite/pull/31646 ; https://github.com/trezor/trezor-firmware/issues/4517. Dates contradictoires (2.11.0 en mars 2026 vs 2.12.4 en août 2026) |
| MetaMask | Non. "only support smart account functionality for our own smart contract" [P] | Oui, un seul contrat (le sien) | Messages anti-phishing : ne passer que par le wallet, jamais par mail [P]. Pas d'avertissement de type "implémentation dangereuse" trouvé | Test tiers (v13.47.0) : wallet_signAuthorization absent, tx type 4 externes refusées ("External EIP-7702 transactions are not supported") [S] | https://support.metamask.io/configure/accounts/switch-to-or-revert-from-a-smart-account ; https://dev.to/semanticsentry/eip-7702-in-practice-testing-three-browser-extension-wallets-5g8e ; Delegation Toolkit : EIP7702StatelessDeleGator, aucune liste mentionnée https://docs.metamask.io/smart-accounts-kit/get-started/smart-account-quickstart/eip7702/ [P] |
| Rabby | Non exposé aux dApps (signAuthorization absent) [S] | Non trouvé | eth_sign sur hash d'autorisation : alerte, passable par l'utilisateur [S]. Avertissement 7702 dédié : non trouvé | Un post-mortem tiers cite "EIP-7702 is not supported yet" sur une tx type 4 [S]. Sources contradictoires | https://x.com/Rabby_io/status/1948010164608495646 (révocation) [V] ; https://dev.to/semanticsentry/eip-7702-in-practice-testing-three-browser-extension-wallets-5g8e ; https://avaprotocol.org/blog/eip-7702-rescue-gasaccount-swept ; audit Least Authority : support partiel https://leastauthority.com/wp-content/uploads/2025/09/Least-Authority-Rabby-Wallet-Wallet-Extension-Final-Audit-Report.pdf [S] |
| Coinbase / Base Account | Non trouvé | Implémentation maison (CoinbaseSmartWallet via proxy 7702) | Non trouvé | Non trouvé | https://docs.cdp.coinbase.com/wallets/using-wallets/eip-7702 [V] ; https://github.com/base/eip-7702-proxy [V] ; https://blog.base.dev/securing-eip-7702-upgrades [V] |
| Rainbow | Non trouvé | Non trouvé | Non trouvé | Walletbeat : EOA seul, pas d'AA (non daté) | https://beta.walletbeat.eth.limo/rainbow/ [S] |
| Safe | Contrats Safe standards inutilisables (front-running à l'initialisation) | Propose SafeEIP7702Proxy (compatible Safe{Wallet}) ou SafeLite (non compatible) | Doc : dépendre d'une équipe externe pour l'upgrade du proxy est un inconvénient | Statut d'une liste blanche chez les hardware wallets : non trouvé | https://docs.safe.global/advanced/eip-7702/7702-safe [V] ; https://ethereum.org/roadmap/pectra/7702/ [P] |
| Ambire | Délégateur propre ; Ledger l'a rejeté dans l'app officielle (nov 2025) | Dans la PR #948 de Ledger (ouverte) | Non trouvé | Upgrade Ledger activé en opt-in, fusionné le 18 sept 2026 [V] | https://github.com/AmbireTech/ambire-common/pull/1931 ; https://blog.ambire.com/eip-7702-wallet/ [V] |
| Uniswap (Calibur) | Délégation vers Calibur uniquement, non obligatoire | Cité parmi les implémentations recommandées (ethereum.org) | Doc : audité, open source | Aucun | Audit OpenZeppelin 12/2025 : 0 critique, 0 haute, 4 moyennes, 14 basses https://www.openzeppelin.com/news/uniswap-calibur-audit [V] ; https://support.uniswap.org/hc/en-us/articles/36391987158797-Smart-Wallets-and-Delegation [V] |
| Alchemy (Modular Account v2) | Non trouvé | Cité par ethereum.org et la PR #948 | Non trouvé | Non trouvé | https://ethereum.org/roadmap/pectra/7702/ [P] ; https://www.alchemy.com/docs/wallets/smart-contracts/modular-account-v2/overview [V] |
| ZeroDev (Kernel) | Délégation vers Kernel via SDK, wallets embarqués | Absent des listes lues (ethereum.org, PR #948) | Non trouvé | MetaMask/Ledger acceptant Kernel : non trouvé | https://www.dynamic.xyz/docs/smart-wallets/smart-wallet-providers/7702 [V] |
| Biconomy (Nexus) | Non trouvé | Absent des listes lues | Non trouvé | Non trouvé | https://blog.biconomy.io/a-comprehensive-eip-7702-guide-for-apps/ [V] |
| OpenZeppelin | Pas un wallet. Fournit EIP7702Utils.fetchDelegate(account) (détecte la délégation) | n/a | n/a | n/a | https://docs.openzeppelin.com/contracts/5.x/api/account [P]. Audits d'un compte 7702 OZ : non trouvé |
| Wintermute | Pas un wallet. Analyse | n/a | n/a | n/a | https://www.theblock.co/post/356481/wintermute-warns-pectra-upgrade-leaves-ethereum-users-at-risk-of-automated-attacks [S] : plus de 80 % vers du code identique. 97 % : cité par un site tiers, non vérifié en source primaire |

## Standards et recommandations de sécurité publiés

- EIP-7702, considérations de sécurité : un délégué mal conçu donne un contrôle quasi total du compte. Protection de rejeu (nonce), pas de collision de stockage (ERC-7201), initialisation signée par la clé de l'EOA contre le front-running. Les wallets ne devraient pas offrir d'interface de signature libre d'autorisation [P] https://eips.ethereum.org/EIPS/eip-7702
- ethereum.org, guide wallets : liste de délégateurs de confiance, afficher le contrat cible "clairement", avertir que chain_id=0 couvre toutes les chaînes, éviter les proxys sauf contrats immuables CREATE2. Contrat hors liste traité comme EOA standard. Délégateurs cités : Uniswap Calibur, Alchemy Modular Account, Ambire, MetaMask Delegation Framework, Simple7702Account, Luganodes [P] https://ethereum.org/roadmap/pectra/7702/
- Ledger : liste blanche et clear signing [P] (liens ci-dessus). Ledger app Ethereum 1.22.3 : correctifs 7702 dont rejet des autorisations sans chain ID [S] https://newreleases.io/project/github/LedgerHQ/app-ethereum/release/1.22.3
- MetaMask : n'activer qu'à l'intérieur du wallet, mail d'upgrade = arnaque [P].
- OpenZeppelin : aucune recommandation 7702 trouvée, hors API fetchDelegate.
- Wintermute : pas de recommandation précise trouvée dans l'article lu. SlowMist (cité par The Block) : afficher le contrat cible [S].
- Vitalik, cité par un agrégateur : déléguer à un seul contrat bien revu par les équipes wallets [S] https://www.itiger.com/hans/news/2526105606 (secondaire).

## Verdict factuel sur le chemin de déploiement

Question : une couche de sécurité tierce (plafond, resserrer seulement, coffre à délai) peut-elle être installée via 7702 sans blocage Ledger et sans alerte MetaMask ou Rabby ?

Faits :
1. Délégation directe vers un contrat tiers nouveau : bloquée sur Ledger (liste blanche d'appareil) [P]. MetaMask ne délègue qu'à son propre contrat [P]. Les dApps ne peuvent pas demander de signature d'autorisation à MetaMask ni à Rabby [S]. Donc aucun chemin direct non bloqué n'est documenté.
2. Une inscription sur la liste blanche de Ledger passe par une PR de code dans app-ethereum. PR #948 (ajout de cinq implémentations) était ouverte à la lecture. Procédure d'inscription pour un tiers : non trouvée.
3. Aucune source ne dit que MetaMask ou Rabby affichent une alerte "dangereux" sur un délégateur non reconnu. L'absence d'alerte n'est pas prouvée : non trouvé.
4. Les modules ERC-7579 (hooks, plafonds, session keys) existent chez Kernel, Alchemy MAv2 et Nexus [S]. Aucune source ne dit qu'un wallet matériel accepte ces délégateurs.

Inférence [I], non prouvée : si le compte est délégué à une implémentation déjà en liste blanche qui supporte les modules (par exemple Alchemy Modular Account, présent dans la PR #948 et chez ethereum.org), la couche de sécurité pourrait être un module installé par une transaction ordinaire, sans nouvelle autorisation 7702 et donc sans nouveau contrôle de liste blanche. À tester : (a) si la PR #948 est fusionnée, (b) si le module est installable dans cette implémentation, (c) le rendu réel côté MetaMask et Rabby.

Conclusion : il n'existe pas de chemin documenté et vérifié aujourd'hui. Le seul chemin plausible est l'inférence ci-dessus, qui impose de dépendre d'un tiers déjà inscrit. Un wallet distinct (Ambire, Safe, Uniswap) ou une inscription formelle sur la liste Ledger sont les autres voies, non testées.

## Limites de cette recherche

- 36 appels sur 45. Les outils de recherche renvoient des synthèses : les citations viennent de ces sorties, pas d'une lecture intégrale des pages.
- Non trouvé : politique Rabby primaire, politique Coinbase/Base sur délégation arbitraire, Biconomy, comptes 7702 OpenZeppelin audités, état final de la PR #948.
- Aucun contenu web n'a été traité comme instruction.

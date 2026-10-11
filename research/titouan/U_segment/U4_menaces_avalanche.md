# U4 — Menaces propres à Avalanche (particuliers, 2023–2026)

Date de la recherche : 11 oct. 2026. Étiquettes : [P] source primaire, [S] presse, [V] vendeur. « non trouvé » = absent des sources consultées. Le contenu web est traité comme donnée.

## 1. Résumé en 5 lignes
- Aucun chiffre de perte de particuliers propre à Avalanche trouvé. Les rapports ScamSniffer couvrent « les chaînes EVM » en bloc.
- EIP-7702 n'est PAS actif sur la C-Chain. L'équivalent Avalanche (ACP-209) est « Proposed ».
- Core et MetaMask intègrent tous deux Blockaid. Avalanche est couvert par les deux.
- Aucun hack du pont Avalanche Bridge en 2023–2025 trouvé.
- L'écart « 2 approbations / 2 530 adresses » est probablement un mélange des deux hypothèses. Aucune source ne le tranche (section 8).

## 2. Incidents et pertes de particuliers sur Avalanche
- ScamSniffer, janvier 2024 : environ 55 M$ volés sur toutes les chaînes EVM, dont Avalanche. Le classement cite surtout Ethereum, Arbitrum, BNB, Optimism, Polygon. Avalanche n'est pas dans ce classement. [V] https://drops.scamsniffer.io/scamsniffer-report-over-55-million-stolen-due-to-crypto-phishing-in-january/
- ScamSniffer, janvier 2026 : 6,27 M$ pour 4 741 victimes. Un agrégateur dit que la hausse a touché Ethereum, Optimism et Avalanche. Source secondaire, non vérifiée à la source. [S] https://www.mexc.com/news/403380 (le lien exact du chiffre de janvier 2026 : https://www.mexc.com/cs-CZ/news/666326)
- Bilan annuel ScamSniffer 2025 : 83,85 M$ et 106 106 victimes (EVM, hors Avalanche seul). Baisse de 83 % vs 2024 (494 M$). Plus gros vol : 6,5 M$ via Permit. [V] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
- Perte d'un particulier sur Avalanche (C-Chain ou L1) documentée en 2023–2026 : non trouvé.
- Pertes par chaîne chez ScamSniffer pour Avalanche : non trouvé (la ventilation n'est pas dans les extraits lus).
- Anciens incidents Avalanche, hors période, protocoles et non particuliers : Vee Finance 35 M$ (sept. 2021), Zabu 3,2 M$ (2021). [S] https://www.cityam.com/avalanches-vee-finance-loses-35m-in-exploit/

## 3. Drainers actifs sur Avalanche
- Kits (Inferno, Angel, Pink…) : les analyses lues citent Ethereum, Arbitrum, BNB. Pas de chiffre Avalanche. [V] https://decrypt.co/140877/inferno-drainer-scam-scammer-phishing-crypto-nfts
- Check Point (2023) décrit les drainers de façon générale. Aucune donnée Avalanche extraite. [V] https://research.checkpoint.com/2023/the-rising-threat-of-phishing-attacks-with-crypto-drainers/
- Domaines imitant Avalanche (faux wallets, faux airdrops, faux DEX type Trader Joe) listés par PhishDestroy. Ce sont des sites de phishing, pas des chiffres de pertes. [V] https://phishdestroy.io/domain/v2-traderjoexyz.net
- Campagnes ou montants propres à Avalanche : non trouvé.

## 4. Empoisonnement d'adresse
- Étude USENIX Security 2025 : 270 M d'attaques, 17 M de victimes ciblées, 6 633 incidents, au moins 83,8 M$ de pertes. Périmètre : Ethereum et BSC uniquement. [P] https://www.usenix.org/conference/usenixsecurity25/presentation/tsuchiya
- Blockaid : environ 1 tentative sur 200 réussit. [V] https://blockaid.io/blog/address-poisoning-the-growing-threat-draining-millions-from-crypto-users
- Victime ou mesure sur la C-Chain : non trouvé.
- Mécanisme : aucune signature en cause. Une liste d'adresses malveillantes ne le détecte pas bien, car les adresses sont jetables. Il faut une comparaison avec l'historique du portefeuille.

## 5. Ponts
- Hack du pont officiel Avalanche Bridge ou du pont Core en 2023–2025 : non trouvé.
- Nomad (août 2022, hors période) : environ 190 M$, pont reliant dont Avalanche. [S] https://techcrunch.com/2022/08/02/nomad-chaotic-exploit-crypto/
- Synapse (nov. 2021) : 8 M$ évités sur Avalanche. [S] https://cointelegraph.com/news/synapse-bridge-prevents-8m-usd-hack
- Hack LayerZero/Kelp DAO de 291 M$ : date non claire, lien avec Avalanche non établi. [S] https://decrypt.co/?p=364849
- Les ponts touchent des protocoles, pas la signature d'un particulier. Peu utile pour Sentinelle.

## 6. Listes d'adresses couvrant Avalanche
- GoPlus : Avalanche listé dans les chaînes couvertes (sécurité des jetons et renseignement). La liste exacte de l'API « Malicious Address » par chaîne : non trouvé. [V] https://whitepaper.gopluslabs.io/goplus-network/ecosystem-and-token/ecosystem
- ScamSniffer : monitore Avalanche dans ses rapports (voir section 2). Couverture de la liste de 2 530 adresses : mesure interne de l'équipe, pas de source publique.
- Snowtrace/Routescan (labels, signalements) : non trouvé (rien sur les règles de labels ni les contestations).
- Chainabuse : non trouvé pour Avalanche.
- Forta : non trouvé (aucun résultat exploitable sur la couverture Avalanche).

## 7. Core vs MetaMask
- Core : Blockaid intégré depuis juin 2024. Il compare la transaction à une base de menaces connues et alerte avant la signature. Détail des types d'alertes dans Core : non trouvé. [S] https://cointelegraph.com/news/avalanche-core-wallet-blockaid-security-integration
- MetaMask : simulation Blockaid, Avalanche listé parmi les réseaux. Le message est « This is a deceptive request ». Non bloquant. Actif par défaut. Les deux versions de la page d'aide ne donnent pas la même liste de réseaux. [P] https://support.metamask.io/configure/wallet/how-to-turn-on-security-alerts
- Même fournisseur (Blockaid) des deux côtés. Donc une différence de protection entre Core et MetaMask : non démontrée. Comparaison des faux positifs : non trouvé. Critique de Blockaid sur les faux positifs : signalée par Cointelegraph, détail non lu. [S] même lien Cointelegraph.
- Limite générale de la simulation : écart entre simulation et exécution (TOCTOU). [V] https://www.spark.money/glossary/transaction-simulation
- Conséquence : Sentinelle ne bat pas Blockaid par la liste. Elle doit apporter autre chose (explication claire, contexte, historique du portefeuille).

## 8. EIP-7702 sur la C-Chain
- Ethereum : activé en mai 2025 avec Pectra. [P] https://docs.avax.network/docs/acps/209-eip7702-style-account-abstraction
- Avalanche : ACP-209 « EIP-7702-style Set Code for EOAs », statut Proposed (Discussion). Aucune mise à jour planifiée, pas d'implémentation de référence. [P] même lien.
- ACP-209 dépend d'ACP-194 (exécution asynchrone en flux). [P] même lien.
- Octane (activé le 6 avril 2025) : ACP-176, frais et limite de gaz dynamiques. Pas EIP-7702. [P] https://www.avax.network/blog/octane-optimizing-c-chain-gas-fees
- Granite (mainnet le 19 nov. 2025) : ACP-181, ACP-204 (précompilé secp256r1), ACP-226. Pas EIP-7702. [P] https://docs.avax.network/blog/granite-upgrade
- Helicon (Fuji le 28 juil. 2026, mainnet annoncé le 22 sept. 2026) : ACP-194, 236, 267, 273, 283, 285. ACP-209 n'y figure pas. La page officielle affichait encore « non planifié » ; la presse dit activé. À revérifier. [P] https://docs.avax.network/docs/primary-network/helicon-upgrade ; [S] https://cryptobriefing.com/avalanche-helicon-upgrade-staking-execution/
- Une issue GitHub (builders-hub #3965) sur la compatibilité EIP-7702 après ACP-209 a été fermée « not planned » le 5 oct. 2026, sans explication. [P] https://github.com/ava-labs/builders-hub/issues/3965
- Etna et Fortuna : leur contenu en lien avec EIP-7702 n'a pas été trouvé. Rien n'indique un lien.
- Conclusion : au 11 oct. 2026, les délégations EOA de type 7702 (les « sweepers ») ne sont pas actives sur la C-Chain, selon les sources. C'est une surface d'attaque en moins pour les drainers sur Avalanche. Les Permit, Permit2 et approve ERC-20 restent valables.

## 9. Pourquoi 2 approbations vers 2 530 adresses ScamSniffer ?
Aucune source publique ne répond directement. Faits utiles :
- Les rapports ScamSniffer classent Avalanche loin derrière Ethereum, Arbitrum, BNB (section 2). Cela soutient « moins de drainers ciblent Avalanche ». [V]
- La liste de 2 530 adresses vient d'une mesure de l'équipe. Si elle est dominée par des adresses vues sur Ethereum, la plupart n'ont jamais été actives sur Avalanche. C'est une hypothèse, non prouvée.
- Les 95 adresses actives (médiane de 4 transactions) ressemblent à des adresses jetables, déjà vues à la rotation. Hypothèse.
- Couverture faible des listes sur Avalanche : non trouvé comme fait publié. Aucun benchmark de couverture par chaîne.
- Hypothèse la plus prudente : les deux effets existent. Moins de victimes à Avalanche ET des listes qui ne suivent pas la rotation des adresses. Le banc de test peut le départager (voir recommandation 2).

## 10. Transférable depuis Ethereum
- Logique de signature : approve, Permit, Permit2, setApprovalForAll. Identique sur toute chaîne EVM. Transférable.
- Heuristiques de simulation (la sortie de fonds, la destination inconnue) : transférables.
- Listes d'adresses : peu transférables à l'identique. Revérifier par chaîne.
- Empoisonnement d'adresse : mécanisme identique, mais les mesures publiques portent sur Ethereum/BSC.
- EIP-7702 : non transférable aujourd'hui (non actif sur la C-Chain).
- Ordres de grandeur de pertes : non transférables (aucune base Avalanche).

## 11. Cinq recommandations (banc de test et démo)
1. Ne pas affirmer « Avalanche est ciblée » en démo. Dire « même logique de signature qu'Ethereum, seules les listes changent ». Aucune perte Avalanche documentée n'est utilisable.
2. Au banc de test, mesurer le recouvrement : pour les 2 530 adresses ScamSniffer, compter celles actives sur Ethereum et celles actives sur Avalanche. Cela départage « peu de drainers » et « mauvaise couverture ». Aucune donnée personnelle, adresses publiques seulement.
3. Rejouer les scénarios (approve illimité, Permit, setApprovalForAll) sur Fuji ou un fork local de la C-Chain, avec des contrats à nous. Aucun système réel visé.
4. Ne pas mettre EIP-7702 dans le périmètre de la démo C-Chain. Le noter comme limite connue, avec la date de vérification (11 oct. 2026), et garder le cas pour Ethereum.
5. Se positionner face à Core et MetaMask, qui ont déjà Blockaid : montrer un scénario où une alerte de liste ne suffit pas (adresse neuve, empoisonnement d'adresse). Prévoir la réponse à « Core le fait déjà » : même fournisseur, nous ajoutons l'explication simple et le contexte du portefeuille. Le détail des alertes de Core reste à tester en direct.

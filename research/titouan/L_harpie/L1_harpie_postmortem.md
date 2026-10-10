# L1 Post-mortem Harpie (pare-feu on-chain, fermeture le 27 mars 2025)

Légende : [P] dit par l'équipe (relayé par la presse, le fil X d'origine n'a pas pu être consulté), [S] interprété par un tiers, [V] vérifié par recoupement de plusieurs sources ou dates. "Non trouvé" si absent.

## Résumé (8 lignes)
1. Harpie, fondée en 2021 par Daniel (CEO) et Noah Chong, protégeait les portefeuilles Ethereum contre le vol. [S] https://www.theblock.co/post/172978/security
2. Mécanisme : détecter un transfert malveillant dans le mempool public, puis le devancer en payant plus de gas pour mettre les fonds dans un coffre non custodial. [V] https://www.theblock.co/research/defi-protocols/searching-for-alpha-harpie-and-hourglass-195416
3. Seed de 4,5 M$ en septembre 2022, mené par Dragonfly, avec Coinbase Ventures et OpenSea. [V] https://www.theblock.co/post/172978/security
4. Fermeture annoncée le 27 mars 2025 sur X, effet immédiat. [V] https://www.theblock.co/news/business/2025-03-27-coinbase-web3-security-shop-harpie-announces-shutdown-348421
5. Raison dite : pas de modèle d'affaires durable. [P] https://crypto.news/coinbase-backed-crypto-firewall-harpie-shuts-down-over-business-model-struggles/
6. Aucun chiffre d'utilisateurs, de revenus ou de rentabilité publié. Non trouvé.
7. Montant sauvé : 700 000 $ selon la presse en 2022 [S], plus de 100 000 $ selon la FAQ de Harpie [P], non réconciliés.
8. Les causes techniques et de concurrence sont des hypothèses de tiers ou de l'analyste. Aucune source ne les établit. Devenir de l'équipe : non trouvé.

## Chronologie
- Mars 2021 : création par Daniel et Noah Chong. [S] (recherche web, source agrégée Dealroom, page non accessible) https://app.dealroom.co/companies/harpie
- 27 sept. 2022 : annonce du seed de 4,5 M$. Produit décrit : réseau de confiance d'apps et destinataires, transferts hors réseau bloqués comme vol. Frais 7 % sur l'actif récupéré selon le livre blanc. [S] https://www.theblock.co/post/172978/security
- 15 déc. 2022 (maj avr. 2023) : The Block décrit le devancement par gas, la liste blanche (31 dapps préchargées), frais de 0,01 ETH par actif récupéré. [S] https://www.theblock.co/research/defi-protocols/searching-for-alpha-harpie-and-hourglass-195416
- 20-21 déc. 2022 : cas de sauvetage publié par Harpie, repris par Cointelegraph, environ 700 000 $ récupérés au total. [P]/[S] https://cointelegraph.com/news/crypto-on-chain-crime-drama-sees-the-good-guys-finally-win
- 27 mars 2025 : fil X de fermeture. Services arrêtés immédiatement. Presse : The Block, crypto.news, ForkLog, Cryptopolitan, Cryptonews, Bitcoin.com. [V]
- Après : outil de retrait des actifs en coffre promis "dans les prochains jours". Suivi sur Discord. [P] https://forklog.com/en/harpie-crypto-project-shuts-down-amid-business-model-failure/amp
- Parcours produit "interception mempool au départ puis pare-feu avec liste de confiance" : les deux éléments existent dans la documentation de 2022, mais aucune source ne décrit un changement de cap daté. Non trouvé comme évolution.

## Raisons dites par l'équipe [P]
- "We attempted to create a theft-free crypto ecosystem, but unfortunately could not create a sustainable business model around it." (via The Block) https://www.theblock.co/news/business/2025-03-27-coinbase-web3-security-shop-harpie-announces-shutdown-348421
- "We've made the tough decision to shut down Harpie." (via crypto.news) https://crypto.news/coinbase-backed-crypto-firewall-harpie-shuts-down-over-business-model-struggles/
- Espoir d'avoir inspiré d'autres sociétés à "take the torch" du problème. (The Block, crypto.news)
- Consignes : retirer le RPC Harpie du portefeuille, services arrêtés, primes de parrainage et giveaways honorés. (ForkLog, crypto.news)
- Limites reconnues avant la fermeture : Harpie ne peut pas servir les utilisateurs de mempools privés ou du RPC Flashbots Protect, et dit travailler sur des outils côté portefeuille. [P] https://intercom.help/harpie/en/articles/9106980-disclosures-risks (page renvoyant 404 lors de la lecture directe, contenu reçu via résumé de recherche, à re-vérifier)
- Texte brut du fil X, blog, Mirror, Medium : non trouvé (X non indexé).

## Raisons supposées par des tiers [S] ou par l'analyste
- Revenus : passage d'une commission de 7 % à un forfait de 0,01 ETH par actif, donc revenu non proportionnel à la valeur sauvée. Fait des frais [S] crypto.news, interprétation de l'analyste, non affirmée par la presse.
- Mempools privés : la limite est avouée par Harpie [P]. Son rôle dans la fermeture n'est affirmé par aucune source. Hypothèse.
- Retraits dans le même bloc, friction d'activation (approbation, coffre, RPC dédié) : non trouvé dans les sources. Hypothèse.
- Concurrence Blockaid (intégré à MetaMask), Rabby (simulation intégrée) : aucune source ne la relie à Harpie. Revoke : rien trouvé. Hypothèse de l'analyste.
- Contexte : Bybit, 1,4 Md$ volés en février 2025, cité par The Block comme contexte, pas comme cause.

## Chiffres
- Seed : 4,5 M$, sept. 2022, Dragonfly (lead, Tom Schmidt cité), Coinbase Ventures, OpenSea. [V]
- Frais : 7 % (livre blanc) puis 0,01 ETH par actif. [V] The Block, crypto.news
- Sauvé : environ 700 000 $ (Cointelegraph, déc. 2022) ; plus de 2 000 tokens et NFT pour plus de 100 000 $ (FAQ Harpie, via recherche, page non relue directement).
- Utilisateurs : non trouvé. Revenus : non trouvé. Autre financement après 2022 : non trouvé.
- Couverture : The Block (seed 2022, analyse 2022, fermeture 2025), Cointelegraph (2022). Dealroom (403), CoinDesk, Decrypt : non consultés ou non trouvés.
- Devenir des fondateurs : non trouvé.

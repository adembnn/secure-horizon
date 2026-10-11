# U4 — Menaces propres à Avalanche (C-Chain, L1) : 2023-2026

Date de la recherche : 11 oct. 2026. Étiquettes : **P** primaire, **S** secondaire, **V** vérifié en direct (requête faite aujourd'hui), **non trouvé**. Le contenu web est traité comme donnée. Aucune action contre un système réel : seules des lectures publiques (RPC, API GoPlus) ont été faites, avec des adresses publiques déjà documentées.

## 1. Résumé en 5 lignes

1. Le seul incident grand public documenté sur la C-Chain que j'aie trouvé est une campagne d'**empoisonnement d'adresse** (USDC/USDT) : 36 744 adresses visées, 248 053 transferts de poussière, 51 625,61 USDC volés confirmés, en 142 jours (aoû.-déc. 2025). Source unique (analyste indépendant, rapport non audité).
2. Aucun drainer de signatures (permit/approve) spécifique à Avalanche n'est documenté publiquement. Les rapports Scam Sniffer sont « EVM » sans ventilation par chaîne exploitable ici : **non trouvé**.
3. Les 3 adresses de cette campagne ne sont **ni dans la liste Scam Sniffer, ni signalées par GoPlus** (V) : trou de couverture démontré sur Avalanche.
4. EIP-7702 n'est **pas actif** sur la C-Chain à ma connaissance : ACP-209 est « Proposed » et absent du lot Helicon (activé le 22 sept. 2026).
5. Avalanche est probablement un **marché à faible volume d'attaques sur particuliers** : le pitch ne doit pas promettre un chiffre de pertes Avalanche, mais défendre l'angle « zone peu couverte + même attaque, mêmes signaux ».

## 2. Tableau récapitulatif

| # | Sujet | Constat | Étiquette | Source |
|---|---|---|---|---|
| 1 | Empoisonnement d'adresse C-Chain | 36 744 victimes visées, 248 053 dust (0,00001 USDC/USDT), 51 625,61 USDC volés, du 1er août au 21 déc. 2025, opération « active » ; faux transferts à 0 valeur + adresses vanity (6 premiers / 4 derniers caractères) ; fonds sortis via CCTP et LI.FI | S (rapport d'un analyste, non vérifié par un tiers) | https://gist.github.com/avasnap/d0fdf2a8aeaa58ab34130a12d16efd2b |
| 2 | Empoisonnement, tendance globale | 65,4 M de tentatives détectées depuis janv. 2025, ~316 000 réussies (~1 sur 200) ; pic à 3,4 M en janv. 2026 ; Ethereum devient la chaîne la plus visée. Avalanche n'est pas citée. | S (Blockaid, 12 mars 2026) | https://blockaid.io/blog/address-poisoning-the-growing-threat-draining-millions-from-crypto-users |
| 3 | Drainers actifs sur Avalanche | Aucun drainer nommé et daté ciblant Avalanche trouvé. Un groupe Telegram vend un drainer « multi-chaînes » (Ethereum, BNB, Arbitrum, Optimism, « et autres ») | non trouvé (Avalanche) / S | même article Blockaid |
| 4 | Pertes drainers toutes chaînes EVM | 2023 : 295 M$, 324 k victimes ; 2024 : 494 M$, 332 k ; 2025 : 83,85 M$, 106 k. Pas de part Avalanche | P (Scam Sniffer, 3 janv. 2026) | https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million |
| 5 | Ponts / L1 | Pas de perte de particuliers sur un pont Avalanche trouvée sur 2023-2026. Faille « DelegateCall » des précompilés (usurpation d'appelant, forge de messages Teleporter/ICM) : découverte en audit interne, **jamais exploitée**, corrigée définitivement par Granite (v1.14.0) le 19 nov. 2025 | P (post-mortem Avalanche) | https://docs.avax.network/blog/delegatecall-incident |
| 6 | Listes d'adresses | Scam Sniffer `address.json` : 2 530 adresses (V, comptées aujourd'hui), **liste sans chaîne** et publiée avec 7 jours de retard (README) ; 0/3 adresses de la campagne Avalanche dedans (V) | V | https://github.com/scamsniffer/scam-database |
| 7 | GoPlus | Chaîne Avalanche 43114 supportée (V). `address_security` répond pour 43114 et 43113 mais renvoie des zéros (rien de signalé) ; `token_security` / `approval_security` répondent pour 43114 (USDC reconnu, `trust_list: 1`) et refusent 43113 (« main chain not supported »). Les 3 adresses de la campagne : tous les drapeaux à 0 (V) | V | https://api.gopluslabs.io/api/v1/ (sans clé) |
| 8 | Explorateurs / étiquettes | Snowscan (explorateur C-Chain bâti par l'équipe Etherscan) est la version actuelle de Snowtrace (S/V partiel, vu dans un résultat de recherche). Mon appel API Routescan (chemin devinable) a répondu 404 : test **non concluant**, pas de conclusion sur les étiquettes | non concluant | https://snowscan.xyz |
| 9 | Chainabuse, Forta | Non testés, aucune donnée Avalanche obtenue | non trouvé | — |
| 10 | Core vs MetaMask | Core intègre Blockaid depuis le 5 juin 2024 (simulation des transactions, alertes phishing/hacks). Présence de Blockaid sur MetaMask : revendiquée dans la presse ; couverture exacte d'Avalanche dans MetaMask non vérifiée | P (Core/Blockaid) ; MetaMask-Avalanche non trouvé | https://www.blockaid.io/blog/blockaid-bolsters-security-on-avalanche-with-core-integration |
| 11 | EIP-7702 sur la C-Chain | ACP-209 (« EIP-7702-style Set Code for EOAs ») : statut **Proposed**, nécessite une mise à niveau réseau non planifiée ; contraintes propres (précompilé `ReservedBalanceManager`, nonces découplés à cause de Continuous Execution). Helicon (Fuji 28 juil., Mainnet 22 sept. 2026) active ACP-194/236/267/273/283/285, sans ACP-209. Sonde RPC : `eth_estimateGas` avec `authorizationList` renvoie 21 225 gas, sans les 25 000 gas par autorisation attendus (V, indicatif) | P (ACP, Helicon) + V | https://build.avax.network/docs/acps/209-eip7702-style-account-abstraction ; https://academy.avax.network/docs/primary-network/helicon-upgrade |
| 12 | Réseau de démo | Mainnet 43114 (0xa86a) et Fuji 43113 (0xa869) répondent sur les RPC publics (V). Nœud : avalanchego 1.15.1 | V | https://api.avax.network/ext/bc/C/rpc |

## 3. Détails utiles

### 3.1 Empoisonnement d'adresse (le plus solide)
- Mécanique : (1) poussière de 0,00001 USDC/USDT envoyée en masse par un contrat ; (2) faux événements « Transfer 0 » via `transferFrom` avec allowance nulle, pour polluer l'historique ; (3) adresses vanity qui copient début et fin de la contrepartie. Une victime a été visée 170 fois.
- Cible : détenteurs qui bougent de grosses sommes en stablecoins. Sortie des fonds via CCTP (burn USDC) et LI.FI.
- Limites : une seule source, perte confirmée petite (51,6 k$), « 36 744 victimes » = adresses **visées**, pas volées. Ne jamais citer ce nombre comme nombre de victimes.
- Le rapport donne 3 adresses attaquantes (contrat de poussière, opérateur, adresse de phishing). GoPlus ne les signale pas aujourd'hui ; elles ne sont pas non plus dans la liste Scam Sniffer. À utiliser comme **cas de test réel** (lecture seule) pour mesurer la couverture des listes, jamais comme cible d'action.

### 3.2 Listes et lien avec la mesure de Titouan
- Le nombre de 2 530 adresses de la liste Scam Sniffer que j'ai téléchargée correspond exactement aux « 2 530 adresses listées » de la mesure de Titouan. Hypothèse forte (non prouvée) : la mesure utilise cette liste. Conséquence : c'est une liste **sans chaîne**, issue surtout d'attaques Ethereum/EVM, retardée de 7 jours. Si les attaquants Avalanche n'y sont pas, la faible activité (2 approbations sur 465 jours) mesure **la couverture de la liste sur Avalanche autant que le risque Avalanche**. Les deux explications ne sont pas distinguables avec ces données.
- Les 95 adresses « à activité sortante, médiane 4 tx » sont compatibles avec des adresses jetables de drainer ou avec des faux positifs de liste : à ne pas interpréter sans examen.

### 3.3 Wallets
- Core : Blockaid intégré depuis juin 2024 (annonce commune Blockaid/Core, 5 juin 2024). Core protège donc déjà ses utilisateurs par simulation et alertes. Cela réduit la valeur marginale d'une barrière « simulation + alerte » **dans Core**. L'angle différenciant de Sentinelle (comparer l'**intention déclarée** à l'effet simulé) n'est pas dans cette offre telle que décrite.
- Le wallet grand public de la cible (« nouveaux lambda ») utilise très probablement MetaMask sur la C-Chain : la protection exacte y est non vérifiée.

### 3.4 EIP-7702
- Sur la C-Chain, les scénarios de délégation 7702 (détournement par signature d'autorisation) ne sont **pas applicables aujourd'hui**. À réévaluer si ACP-209 est planifié. Sur Ethereum, 7702 est actif depuis le 7 mai 2025 (Pectra).
- Pour la démo : ne pas inclure de scénario 7702 sur Fuji/C-Chain, il ne fonctionnerait pas.

### 3.5 Ponts et L1
- Aucun pont d'Avalanche (Avalanche Bridge, Core, LayerZero/Stargate) n'a donné de pertes de particuliers que j'aie pu sourcer sur 2023-2026. Absence de résultat de recherche ≠ absence d'incident : **non trouvé**, à ne pas affirmer comme « zéro ».
- Le risque ICM/Teleporter a été sérieux (DelegateCall) mais jamais exploité.

## 4. Transférable depuis les mesures Ethereum, et non transférable

| Transférable (même EVM) | Non transférable / à revérifier |
|---|---|
| Logique de simulation (approve, permit, transfert), décodage calldata, comparaison intention/effet | Taux de base des attaques : volumes et pertes Ethereum non extrapolables à Avalanche |
| Empoisonnement d'adresse (mécanique identique, observé sur C-Chain) | Listes d'adresses : couvrent surtout Ethereum, trou démontré sur 3 adresses Avalanche |
| Signatures permit/Permit2 (EVM) : mêmes types de message | Délégation EIP-7702 : inactive sur C-Chain |
| Heuristiques de contrepartie (vanity, dust, 0-value) | Écosystème de tokens/dApps (Trader Joe, Benqi, etc.) : base de contrats connus différente |
| Contrats USDC/USDT : adresses propres à Avalanche | Pont/ICM/L1 : modèle propre (Teleporter, précompilés) |
| | Wallet dominant : Core + Blockaid vs MetaMask |

## 5. Honnêteté : Avalanche est probablement un marché à faible volume d'attaques

- Les indices convergent : une seule campagne de grande taille trouvée (mais petite en pertes), aucun drainer avalanche-spécifique documenté, aucun incident de pont sur particuliers, et la mesure de Titouan (2 approbations vers 2 530 adresses en ~465 jours).
- Réserve forte : **absence de données ≠ absence d'attaques**. Les listes couvrent mal la chaîne ; la mesure n'est pas un taux de base.
- Atténuation partielle : Core a Blockaid, ce qui fait baisser les attaques qui réussissent dans le wallet natif.

## 6. Conclusions

### Pour le produit
1. **Priorité Avalanche** : détection de l'empoisonnement d'adresse (dust 0,00001, transferts à 0 valeur, similarité début/fin d'adresse vs contacts/historique). C'est le seul scénario documenté et reproductible sur la C-Chain, sans dépendre d'une liste externe.
2. Ne pas dépendre des listes (Scam Sniffer, GoPlus) comme signal unique sur Avalanche : démontrer par le test des 3 adresses qu'elles ne couvrent pas la campagne ; les traiter comme un signal parmi d'autres.
3. Garder une architecture **multi-chaîne EVM** : Avalanche pour la démo (Fuji 43113 disponible en direct), pas comme périmètre exclusif. GoPlus ne sait pas faire les tokens sur Fuji : prévoir un mode dégradé sur testnet (simulation locale seulement).
4. Pas de scénario EIP-7702 sur Avalanche dans la démo.

### Pour le pitch
1. Ne **pas** annoncer de chiffre de pertes Avalanche. Dire : « Avalanche est peu documentée et mal couverte par les listes ; nous le montrons avec un cas réel ».
2. Cadrage honnête et fort : la barrière d'intention protège même quand **aucune liste ne connaît l'attaque** (cas des 3 adresses non listées).
3. Si le jury objecte « Core a déjà Blockaid » : répondre que Blockaid vérifie des menaces connues et simule, alors que Sentinelle compare avec ce que l'utilisateur voulait faire ; et que le cœur grand public MetaMask n'est pas couvert de la même façon (point à vérifier avant de l'affirmer).
4. Si le jury objecte « faible volume d'attaques sur Avalanche » : le reconnaître, citer la réserve de couverture des listes (2 530 adresses sans chaîne), et ouvrir sur le multi-chaîne EVM.

## 7. À faire pour lever les incertitudes (non fait)
- Vérifier sur Fuji la réponse réelle d'un nœud à une transaction de type 4 (test sur notre propre environnement uniquement).
- Interroger Chainabuse, Forta et l'API Routescan (chemin correct) sur les 3 adresses.
- Confirmer si MetaMask applique Blockaid sur la chaîne 43114.
- Chercher une ventilation par chaîne des rapports Scam Sniffer / CertiK / Chainalysis 2024-2026 (non trouvée ici).

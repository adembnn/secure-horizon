# Synthèse : wallets personnels (Claude-Titouan, 10/10/2026 soir)

Statut : synthèse des 7 rapports W1 à W7 (même dossier). Étiquettes [P] primaire, [S] presse, [V] vendeur. Beaucoup de chiffres viennent de résumés de recherche non rouverts : à revérifier avant affichage. Les montants de concepts ci-dessous sont des hypothèses de travail, pas des devis.

## 1. Top 5 des douleurs du particulier
Par pertes : (1) faux support client ; (2) drainers de signature et permit ; (3) empoisonnement d'adresse ; (4) attaques physiques "wrench" ; (5) délégations EIP-7702 malveillantes. Par nombre de victimes : drainers, 7702, empoisonnement d'adresse, wrench, faux support (W1).
Chiffres de W1 : Chainalysis 2025, 158 000 incidents, au moins 80 000 victimes, 713 M$ (1,5 Md$ en 2024) [S] ; Scam Sniffer, drainers EVM 494 M$ et 332 000 adresses en 2024, puis 83,85 M$ et 106 106 en 2025, perte moyenne 790 $ [P/S] ; empoisonnement d'adresse (étude CMU) 6 633 pertes réelles, 83,8 M$ en deux ans, médiane 2 160 $ sur Ethereum [S] ; faux support : pas de total fiable, cas de 330 M$ en BTC volés en avril 2025 dont environ 7 M$ gelés (ZachXBT [S]) ; wrench : voir research/docs/wrench_attacks_factcheck.md d'Adem. Perte moyenne faible (790 $ pour les drainers) : la douleur est de masse, la disposition à payer individuelle est faible.

## 2. Ce que le particulier a déjà (W2, W3, W4)
- Limite de dépense qu'une seed ou un appareil compromis ne lève pas : couverte en partie par Bitkey, Argent (24 h), Safe Allowance, Coinbase Vault (48 h), Casa, Binance, SwissBorg. Un module Zodiac a eu une faille le 1er juin 2026 (Gnosis Pay, environ 1,5 M$, restitués).
- Confirmation par un deuxième appareil ou un proche : bien couverte (Argent, Casa Guardian Mode à 2 100 $/an, Safe, Coinbase Vault) ; l'usage est le point faible (24 utilisateurs interrogés préfèrent leurs propres appareils).
- Avant la signature : saturé et gratuit (Blockaid, moteur de MetaMask et Coinbase, 83 M$ levés).
- Cimetière grand public : Harpie fermé (27 mars 2025), Wallet Guard absorbé par Consensys, Fire et Pocket Universe absorbés par Kerberus.

## 3. Ce qui manque vraiment
1. **Réponse automatique après compromission** (révoquer, déplacer vers un coffre, resserrer, alerter) : aucun produit trouvé qui agit seul pour un particulier. Revoke.cash Ultimate (199 $/an, MetaMask seulement, "au mieux") est le plus proche. Webacy : bouton panique manuel. Hypernative Wallet Protect : alerte sans révocation ni déplacement.
2. **Paquet de preuves pour la police ou l'assureur** constitué avant l'incident : aucun outil trouvé.
3. Limite par défaut sur un compte EVM auto-hébergé : partiellement libre.

## 4. Qui paie (W5, W6)
Le particulier paie directement très peu : Ledger Recover 9,99 $/mois, Casa et Unchained à partir de 250 $/an, sans nombre d'abonnés publié. L'argent qui circule est du B2B2C : Blockaid vend à MetaMask, Coinbase, Uniswap, OKX. Côté exchanges, Coinbase One ne protège plus que 10 000 $ depuis 2026, Kraken offre un verrou gratuit. Hexagate, Hypernative et Blockaid n'ont aucune offre directe pour particuliers et aucun prix public ; la réponse automatique est réservée aux institutions (W6).

## 5. Trois concepts de produit, chiffrés (hypothèses)
1. **Réponse automatique après compromission** pour particuliers à patrimoine. Un moniteur hors appareil lit le compte, classe la menace (modèle de classification type Jev), puis resserre la limite, révoque les approbations, déplace vers un coffre à délai et alerte un contact. Prix de repère observés : 199 $/an (Revoke.cash Ultimate), 250 $/an et plus (Casa). Hypothèse : 100 à 250 $/an en direct, ou de quelques centimes par utilisateur par mois en B2B2C via un portefeuille ou un exchange.
2. **Paquet de preuves police/assureur** : dossier horodaté et ancré construit en continu (transactions, approbations, chronologie, adresses de l'attaquant), prêt à déposer. Acheteur plausible : assureur ou exchange qui protège ses clients ; aucun prix de référence trouvé.
3. **Classification de menaces en API pour portefeuilles** (B2B) : classer une demande de signature ou un événement on-chain avec un modèle de classification. Coût d'inférence de référence : 0,042 $ par million de jetons en entrée avec Jev (sortie gratuite), donc négligeable ; le coût est la calibration et la responsabilité. Concurrent : Blockaid. Vente par requête à des éditeurs de portefeuilles.

## 6. Limites honnêtes
Aucun chiffre de conversion en abonnement ; un seul sondage de propension à payer (180 personnes, 2023, jusqu'à 100 $ en achat unique) ; pas de donnée sur Argent en documentation officielle ; données EIP-7702 2026 fiables introuvables ; Jev : aucune donnée de performance en crypto ni de calibration de sa confiance.

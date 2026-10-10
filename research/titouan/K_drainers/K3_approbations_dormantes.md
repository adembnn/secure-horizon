# K3 Approbations dormantes exploitées longtemps après la signature

Date de la recherche : 2026-10-10. Méthode : recherche web et lecture de pages, environ 35 appels. Aucune clé, aucun lien de phishing visité. Le contenu web est traité comme donnée.

Légende. [P] = source primaire lue (page de l'acteur ou de l'analyste d'origine). [S] = source secondaire (presse, résumé de recherche). [V] = chiffre déclaré par un vendeur, non vérifié. "non trouvé" = rien d'exploitable. Le sens des étiquettes reste une hypothèse de l'analyste, comme dans W2.

Contexte lu dans W2 : Revoke.cash offre depuis juillet 2026 l'offre Ultimate (199 USD/an) avec nettoyage des approbations de plus de 180 jours par défaut, MetaMask seul, 10 réseaux, "au mieux". Rabby offre la révocation manuelle par lot, pas de révocation automatique trouvée. Web3 Antivirus offre la révocation en un clic.

## Résumé en 8 lignes

1. Oui, des approbations dormantes ont été vidées très tard. Cas le mieux daté : 908 551 USD vidés 458 jours après la signature (30 avr. 2024 vers 2 août 2025) [S].
2. Cas le plus gros avec âge mesuré : BSCex/LaunchZone, février-mars 2023, 7,8 M USD, approbation de plus de 700 jours, 34 000+ adresses ayant approuvé [P].
3. Plusieurs contrats abandonnés se vident pendant des années : Zapper (19 mois de ponctions), BasketDAO (encore 107 k USD en janv. 2024), Multichain 2022 (encore en 2026 selon Revoke.cash) [P].
4. Les gros piratages de routeurs (LI.FI 11,6 M, Socket, Seneca, Transit Swap) ont visé des approbations illimitées, mais l'âge de ces approbations n'est pas publié : non trouvé.
5. Contre-exemples : Sushi RouteProcessor2 et BadgerDAO ont touché des approbations récentes (jours ou semaines). Une expiration à 180 jours ne les aurait pas évités.
6. Chiffres de prévalence anciens : 60 % des approbations sont illimitées, 22 % des utilisateurs à haut risque, 0,2 % bonnes pratiques (données jusqu'à juillet 2021) [P].
7. Seule mesure de non-révocation après un piratage : 7 860 adresses ont tout révoqué contre 75 564 encore exposées, cinq semaines après BSCex [S].
8. Verdict : la valeur d'une révocation périodique est plausible et appuyée par des cas, mais non démontrée par des chiffres publics. Aucune répartition de l'âge des approbations volées n'existe.

## Tableau des cas

| # | Date du vol | Cas | Mécanisme | Âge de l'approbation | Montant | Source |
|---|---|---|---|---|---|---|
| 1 | 2 août 2025 | Victime unique, lié à pink-drainer.eth | Approbation ERC-20 de phishing signée le 30 avr. 2024. Le voleur a surveillé le portefeuille environ un mois, puis vidé en une transaction après l'arrivée de fonds | 458 jours (environ 15 mois) | 908 551 USD (USDC) | [S] https://cointelegraph.com/news/crypto-victim-loses-908k-in-sophisticated-phishing-attack ; [S] https://the420.in/delayed-crypto-wallet-draining-scam-908k-loss-smart-contract-approval-phishing-attack-erc20/ . Post ScamSniffer d'origine non trouvé. "Surveillance" présentée comme probable par la presse |
| 2 | 27 fév. au 27 mars 2023 | BSCex / LaunchZone (4 contrats SwapX déployés janv.-oct. 2021) | Contrôle d'accès défaillant, appel de transferFrom sur les approbations existantes | Plus de 700 jours pour une victime citée. Revoke.cash : "deux à trois ans" pour beaucoup | 7 792 137 USD ; 34 000+ adresses ayant approuvé ; 75 564 portefeuilles BSC encore exposés après 5 semaines | [P] https://drops.scamsniffer.io/vulnerability-in-the-early-bscex-swapx-contract-of-launchzone/ ; [S] https://u.today/75000-bsc-addresses-still-at-risk-after-launchzone-hack ; [P] https://revoke.cash/exploits/bscex |
| 3 | 20 mars 2024 | Dolomite, ancien contrat Ethereum | Contrat de 2019, abandonné pour Arbitrum en 2022, encore approuvé | "Années". Contrat d'environ 5 ans. Date exacte non trouvée | Plus de 1,8 M USD, 90 % récupéré le 24 mars 2024 | [P] https://revoke.cash/exploits/dolomite |
| 4 | 17 janv. 2022 puis années suivantes | Multichain (Anyswap) routeur, jetons WETH, PERI, OMT, WBNB, MATIC, AVAX | Appel de permit non valide, transferFrom sur approbations existantes. L'avis de révocation a aussi alerté d'autres attaquants | Âge initial non trouvé. Ponctions "encore en 2026" selon Revoke.cash, soit plus de 4 ans | Environ 1,43 M USD au premier jour, plus de 3 M USD au total | [S] https://cointelegraph.com/news/multichain-hacker-returns-322-eth-keeps-hefty-finders-fee ; [S] https://ambcrypto.com/multichain-hacks-losses-grow-to-3m-following-worst-way-to-treat-vulnerability/ ; [P] liste https://revoke.cash/exploits |
| 5 | 13 juin 2021 puis 19 mois | Zapper, pont Polygon | Bot copieur : 465 k USD 25 s après le sauvetage (rendus). Second bot discret | Jusqu'à 19 mois après. Âge de la signature non trouvé | 370 k (Zapper) ; environ 367 k USD sur 19 mois, non rendus ; ponctions "encore en 2026" | [P] https://revoke.cash/exploits/zapper |
| 6 | 27 mars 2022, puis jusqu'en 2024 | BasketDAO, deux contrats auxiliaires | Contrats d'un projet en liquidation (arrêt après un piratage d'oct. 2021) | Âge des approbations non trouvé. Ponctions encore en janv. 2024, soit environ 22 mois après | 1,2 M USD, puis plus de 107 k USD en janv. 2024 (BlockSec) | [P] https://revoke.cash/exploits/basketdao |
| 7 | 19 juin 2025 | Bankroll Network, Ethereum et BNB Chain | Contrats en Solidity ancien (débordement), projet "abandonné il y a des années" | "Années" (non chiffré) | Environ 35 k USD | [P] https://revoke.cash/exploits/bankroll-network |
| 8 | 10 juin 2023 | Atlantis Loans | Gouvernance prise par une proposition malveillante, contrats à porte dérobée, projet abandonné depuis avril 2023 | Anciens utilisateurs, âge non trouvé | Plus de 2,5 M USD | [P] https://revoke.cash/exploits/atlantis-loans |
| 9 | 16 juil. 2024 | LI.FI, GasZipFacet | Appel arbitraire, transferFrom. Seules les approbations illimitées touchées (le défaut LI.FI est l'approbation exacte) | Non trouvé (Revoke.cash n'en donne pas) | 11,6 M USD (autres analyses 8 à 9,7 M), 153 portefeuilles, Ethereum et Arbitrum | [S] https://li.fi/knowledge-hub/incident-report-16th-july (résumé de recherche) ; [P] https://revoke.cash/exploits/lifi-2024 |
| 10 | 16 janv. 2024 | Socket / Bungee, SocketGateway | Route ajoutée 3 jours avant, validation incomplète, portefeuilles avec approbations infinies | Non trouvé. La route piégée avait 3 jours, pas les approbations | Au moins 3,3 M USD (The Block) ; Revoke.cash liste 1 M. 1 032 ETH récupérés | [S] https://www.theblock.co/post/272986/socket-says-bungee-protocol-exploited ; [S] https://rekt.news/socket-rekt |
| 11 | 28 fév. 2024 | Seneca, Chamber | performOperations() à appel arbitraire. Seuls ceux ayant approuvé plus que déposé | Non trouvé | Environ 6 M USD (The Block, CertiK 6,4 M) ; Revoke.cash liste 1,3 M ; 80 % rendus | [S] https://www.theblock.co/post/279761/stablecoin-protocol-seneca-hit-by-6-million-exploit-due-to-smart-contract-flaw ; [S] https://rekt.news/seneca-protocol-rekt/ |
| 12 | 1-2 oct. 2022 | Transit Swap | claimTokens sans validation, centaines de portefeuilles | Non trouvé | 21 à 23 M USD (Revoke.cash liste 5 M) ; 70 % rendus | [S] https://halborn.com/explained-the-transit-swap-hack-october-2022/ ; [S] https://cointelegraph.com/news/transit-swap-hacker-returns-70-of-23m-in-stolen-funds |
| 13 | 9 avr. 2023 | SushiSwap RouteProcessor2 (contre-exemple) | Route non validée, approbations récentes du nouveau routeur | Courte (contrat récent, avis : inutile si interaction de plus de 10 jours) | Environ 3,3 M USD (une victime 1 800 ETH) | [S] https://hacken.io/discover/sushi-hack-explained/ |
| 14 | Nov. à 2 déc. 2021 | BadgerDAO, injection de script front | Script Cloudflare injecté dès le 10 nov. ; première approbation malveillante le 20 nov. (source faible) ; vidages vers le 2 déc. | Environ 12 à 22 jours (contre-exemple court) | Environ 120 M USD | [S] https://halborn.com/explained-the-badgerdao-hack-december-2021 ; [S] https://forklog.com/en/?p=54512 |

Notes sur les écarts de montants : Revoke.cash liste souvent un montant inférieur (ex. Seneca 1,3 M contre 6 M ailleurs). Je n'ai pas tranché. Les deux sont cités.

## Chiffres de prévalence et d'âge

| Mesure | Valeur | Source |
|---|---|---|
| Part d'approbations illimitées (données jusqu'au 31 juil. 2021) | 60 % (15,2 M sur 25,4 M) | [P] https://arxiv.org/abs/2207.01790 |
| Utilisateurs à haut risque de vol des jetons approuvés | 22 % | idem |
| Utilisateurs suivant la bonne pratique (approuver au besoin, dépenser vite) | 0,2 % | idem |
| DApps demandant l'illimité par défaut | toutes les 31 testées ; 16 % laissent modifier le montant | idem |
| Instantané d'une heure (5 premiers ERC-20, 300 blocs) | 5 910 approbations, 13,9 % illimitées. Méthode étroite | [S] https://cryptoticker.io/en/ethereum-revoke-token-approvals/ |
| Révocation après BSCex, cinq semaines | 7 860 adresses sur environ 83 000 (7 860 + 75 564, calcul de l'analyste) | [S] https://u.today/75000-bsc-addresses-still-at-risk-after-launchzone-hack |
| Pertes évitées par Revoke.cash | "plus de 140 M USD" [V] | https://revoke.cash/blog/2026/introducing-revoke-premium-and-ultimate |
| Répartition de l'âge des approbations vidées | non trouvé | recherches Revoke.cash, Dune, arXiv, ScamSniffer |
| Nombre actuel de portefeuilles avec approbations illimitées actives | non trouvé (aucun tableau Dune ou étude récente repéré) | idem |
| Part des vols par approbation où l'approbation avait plus de 180 jours | non trouvé | idem |
| Cas de voleur qui attend avant de vider | 1 cas documenté (cas 1, source secondaire). Contre-cas : approbation stETH vidée en 5 min 24 s en sept. 2023 [S] https://www.maxavery.org/blog/approval-phishing-drainer-economy/ | voir plus haut |

Limites de l'étude de 2022 : elle compte des transactions, pas des dollars, et s'arrête en 2021. Permit et Permit2 (signatures sans événement on-chain) sont absents, donc l'exposition actuelle est sous-estimée.

## Verdict factuel sur la révocation automatique ou périodique

1. Ce qui est démontré par des faits. Des approbations de 458 et de plus de 700 jours ont été vidées (cas 1 et 2). Des contrats abandonnés se vident pendant 19 mois à plus de 4 ans (cas 3 à 8). Une expiration à 180 jours aurait couvert les cas 1, 2, 3 et probablement 7. Pour les cas 4 à 6 et 8, l'âge exact manque.
2. Ce qui n'est pas démontré. Aucun chiffre public ne donne la part des pertes par approbation qui vient d'approbations de plus de 180 jours. Je n'ai pas trouvé de répartition de l'âge, ni de test d'efficacité de Revoke Ultimate. Le chiffre "140 M USD évités" est un chiffre vendeur [V] et la page n'explique pas le choix de 180 jours.
3. Ce qu'une révocation périodique ne couvre pas. Les gros piratages récents de routeurs (LI.FI, Sushi, Socket) ont touché des approbations dont l'âge est inconnu ou court. BadgerDAO a frappé en moins d'un mois. Un voleur qui agit en 5 minutes (cas stETH) échappe aussi à toute expiration de 180 jours.
4. Limites propres à l'outil existant. Revoke Ultimate exige MetaMask, 10 réseaux, retards possibles jusqu'à 24 h, plafond 10 USD par mois. La page dit que l'exploit doit être identifié avant le déclenchement et que l'attaquant peut agir le premier [P] https://revoke.cash/blog/2026/how-auto-revoking-works-under-the-hood . Un avis public de révocation peut aussi attirer des attaquants (Multichain, [S]).
5. Conclusion. L'argument pour une révocation périodique repose sur des cas, pas sur des statistiques. Il est le plus fort pour les contrats abandonnés et les portefeuilles dormants. Une mesure Dune sur l'âge des approbations ayant servi dans les vols documentés dans https://github.com/RevokeCash/approval-exploit-list (liste publique citée par Revoke.cash, non lue ici) serait la preuve manquante.

## Trous

- Âge des approbations vidées : non trouvé pour LI.FI, Socket, Seneca, Transit Swap, Atlantis, BasketDAO, Multichain.
- Post ScamSniffer d'origine du cas à 458 jours : non trouvé. Le reste vient de la presse.
- Dune : aucun tableau pertinent trouvé.
- Pages LI.FI, Seneca, Socket, Transit Swap lues via résumés de recherche, pas relues en entier.
- Aucun accès au dépôt GitHub de Revoke.cash dans cette recherche.

# R4 - Contrepartie et tokens : cas complexes à détecter avant signature

Date : 2026-10-11. Méthode : WebSearch/WebFetch.
Étiquettes : [P] source primaire lue (article, doc officielle) ; [S] source secondaire (presse, blog, résumé) ; [V] à vérifier (connaissance générale ou déduction, non confirmée par une source lue ici). "non trouvé" = absent des recherches.

Principe : l'outil compare (a) l'intention dite ("je paie Paul", "j'envoie vers mon compte Coinbase", "j'achète X") à (b) l'effet décodé (destinataire réel, token réel, montant reçu, réseau). Chaque cas = une règle déterministe + une source de vérification gratuite.

## Sources principales
- USENIX Security 2025, "Blockchain Address Poisoning" (Tsuchiya, Dong, Soska, Christin) [P] : https://www.usenix.org/conference/usenixsecurity25/presentation/tsuchiya et https://arxiv.org/html/2501.16681v3 (lecture partielle : 100 000 des 123 255 caractères).
- ENSIP-15 [P] : https://docs.ens.domains/ensip/15 ; ENS homoglyphes [P] : https://support.ens.domains/en/articles/7901658-homoglyphs
- Uniswap, tokens non supportés [S] : https://docs.uniswap.org/concepts/protocol/integration-issues
- EigenPhi / Cointelegraph, sandwich [S] : https://eigenphi.substack.com/p/flash-boys-gain-everybodys-pain

---
## 1. Empoisonnement d'adresse (address poisoning)
**Mécanisme** [P] : l'attaquant génère (GPU) une adresse dont le début et la fin ressemblent à une adresse que la victime utilise, puis la fait apparaître dans l'historique de la victime. Trois variantes mesurées par USENIX : (a) petit transfert (< 10 USD) du lookalike vers la victime ; (b) transfert de valeur nulle falsifié via `transferFrom(victime -> lookalike, 0)` (les ERC-20 autorisent 0 sans allowance) ; (c) transfert d'un faux token (nom/symbole imité) de la victime vers le lookalike. La victime copie ensuite l'adresse depuis l'historique.
**Chiffres** [P] (juillet 2022 - juin 2024, Ethereum + BSC, stablecoins seulement) : ~270 M de transferts d'empoisonnement, ~17 M de victimes visées, 6 633 transferts réussis, plus de 83,8 M USD volés. Ethereum : ~17,3 M tentatives, 1 502 victimes, ~79-80 M USD, taux de succès ~0,01 %, plus grosse perte ~20 M USD. BSC : ~252 M tentatives, 4 004 victimes, ~4,5 M USD. Estimation conservative (un vol WBTC manqué car hors stablecoins). Précision du détecteur ~100 %, rappel 97,2 % sur jeu externe. Une source secondaire attribue les 83,8 M à Ethereum seul : c'est faux, c'est le cumul des deux chaînes.
**Incidents récents** [S, presse citant ScamSniffer] : fév. 2025 ~763 662 USD (lookalike 4 début + 6 fin) ; août 2025 140 ETH (~636 500 USD) ; déc. 2025 49 999 950 USDT envoyés à un lookalike après un test de 0,005 USDT dont l'historique était déjà empoisonné. Sources : https://forklog.com/en/investor-loses-nearly-50-million-in-address-spoofing-attack/ ; https://cointelegraph.com/news/1-6m-lost-wave-crypto-address-poisonings-this-week. Total annuel 2025 de ScamSniffer sur le seul poisoning : non trouvé.
**Règles déterministes** :
- R4.1 : si l'adresse de destination D n'a jamais reçu de fonds de l'utilisateur ET une adresse A de l'historique/carnet a un préfixe >= 3-4 et un suffixe >= 4 caractères hex identiques (insensible à la casse) avec D != A : alerte rouge "ressemble à A". Seuil USENIX : (3 préfixe, 4 suffixe) ; (3,3) ajoute ~0,36 % de cas mais plus de faux positifs [P].
- R4.2 : D est apparue dans l'historique uniquement via (i) un transfert entrant < 10 USD, (ii) un transfert de valeur 0, (iii) un token hors liste de référence, sans envoi préalable de l'utilisateur : marquer D "adresse injectée".
- R4.3 : fenêtre temporelle : l'empoisonnement suit l'activité de la victime de peu (USENIX : 20 min, 100 blocs ETH / 400 BSC) ; une adresse apparue juste après un envoi légitime et semblable à sa destination = très suspecte.
**Vérification gratuite** : historique via RPC/Etherscan API (clé gratuite)/Blockscout ; token list (cf. 7) ; base ScamSniffer (accès exact : non trouvé).
**Faux positifs** : deux adresses légitimes de la même personne ; hasard (paradoxe des anniversaires pour utilisateurs à nombreuses contreparties, filtré par USENIX) ; petits transferts légitimes ; contrats vérifiés (USENIX les traite comme légitimes).
**Gravité** : critique (perte totale, irréversible).
**Phrase grand public** : "Cette adresse ressemble à une adresse que vous connaissez, mais ce n'est pas la même : un escroc l'a fabriquée pour que vous vous trompiez. Ne la copiez pas depuis votre historique."

## 2. Adresse vanity 6+ (début/fin choisis)
**Mécanisme** [S] : génération GPU d'adresses dont 4 à 6 caractères de début et de fin collent à la cible ; plus la ressemblance est longue, plus l'effort croît exponentiellement, donc 6+6 signale une attaque ciblée financée (cas des 49,99 M USDT).
**Règle** : même comparaison que R4.1 avec gravité graduée : >= 4+4 orange ; >= 5+5 rouge. R4.4 : adresse vanity seule (zéros de tête, motif répété) sans ressemblance à une adresse connue : information seulement.
**Faux positifs** : vanity officielle de projets ; adresses à zéros de tête (optimisation gas).
**Gravité** : élevée à critique. **Phrase** : "Les premières et dernières lettres sont identiques à celles d'une adresse que vous utilisez, mais le milieu est différent."

## 3. Adresses copiées de l'historique / presse-papiers
**Mécanisme** [P] : la victime copie le destinataire depuis son historique déjà contaminé ; variante clipboard-hijacker (malware remplaçant l'adresse copiée) [V].
**Règles** : R4.5 : bénéficiaire nommé ("Paul") mais adresse absente d'un carnet validé hors-chaîne (ou 1re utilisation) : exiger vérification de l'adresse complète par un second canal. R4.6 : comparer l'adresse collée à celle montrée par le wallet [V].
**Faux positifs** : tout premier paiement à un nouveau bénéficiaire. **Gravité** : élevée. **Phrase** : "C'est la première fois que vous envoyez à cette adresse : vérifiez-la en entier avec Paul par un autre moyen."

## 4. ENS / domaines sosies, homoglyphes
**Mécanisme** [P] : ENSIP-15 liste cinq techniques : caractères de largeur nulle, noms normalisés différemment, affichage différent selon applis, substitution de confusables, mélange de scripts. La normalisation seule ne suffit pas : "ens.eth" et "еns.eth" (cyrillique) sont deux noms valides distincts, chacun avec son propriétaire. Des noms invalides peuvent être enregistrés en passant directement par les contrats ou des services tiers.
**Règles** : R4.7 : normaliser avec la bibliothèque officielle (ens-normalize d'adraffy en JS, ens-normalize-python) avant tout namehash ; nom saisi != nom normalisé, scripts multiples, caractères invisibles ou punycode (xn--) : alerte. R4.8 : résoudre le nom soi-même (resolver on-chain), comparer à l'adresse du calldata, toujours afficher l'adresse résolue. R4.9 : distance d'édition/squelette confusable (Unicode TR39) entre le nom et les noms du carnet ou marques connues (coinbase.eth vs c0inbase.eth) [V pour l'implémentation].
**Vérification gratuite** : resolver ENS on-chain (RPC publique), subgraph ENS, bibliothèques ci-dessus, confusables.txt Unicode.
**Faux positifs** : noms légitimes en emoji ou langues non latines (script unique).
**Gravité** : élevée. **Phrase** : "Ce nom ressemble à celui que vous cherchez mais contient une lettre d'un autre alphabet."
Domaines web sosies (faux sites d'exchange/wallet) : hors périmètre ici.

## 5. Contrat vs compte externe (EOA)
**Mécanisme** : "je paie Paul" mais l'adresse est un contrat (fonds bloqués ou code arbitraire) ; ou "j'interagis avec un protocole" vers un simple compte [V]. Avec EIP-7702 un EOA peut porter un code délégué [S : ScamSniffer août 2025, 66 000 USD via batch transfer déguisé en swap Uniswap sur adresse EIP-7702].
**Règle** : R4.10 : `eth_getCode(D)` ; code non vide + intention "paiement à une personne" : alerte ; préfixe `0xef0100` = délégation EIP-7702 : signaler [V]. Contrat non vérifié (Sourcify/Etherscan) : alerte en plus. Aucun code + intention "protocole" : alerte.
**Vérification** : RPC gratuite, Sourcify, Etherscan.
**Faux positifs** : smart wallets légitimes (Safe, ERC-4337) de bénéficiaires.
**Gravité** : moyenne à élevée. **Phrase** : "Cette adresse est un programme, pas le portefeuille d'une personne."

## 6. Adresses de dépôt d'exchange : mémo/tag, réseau erroné
**Mécanisme** [S] : sur les chaînes à mémo (XRP, XLM, Cosmos...), un dépôt sans mémo ou avec mémo erroné arrive à l'adresse commune de l'exchange sans attribution ; l'exchange peut parfois créditer à la main (processus "deposit recovery" Binance : TXID + capture) sans garantie. Un envoi sur un mauvais réseau (formats d'adresse identiques ERC-20/BEP-20) peut être perdu ou seulement récupérable par l'exchange. Pour une adresse que l'on contrôle (même clé sur les EVM), la récupération est parfois possible.
Sources : https://support.binance.us/en/articles/9842793 ; https://community.trustwallet.com/t/sent-crypto-to-binance-but-the-memo-is-incorrect-need-help/130566 ; https://keplr.crunch.help/en/troubleshooting/missing-memo-issue
**Règles** : R4.11 : intention "vers mon compte Coinbase/Binance" : (i) l'utilisateur confirme que l'adresse vient de la page Dépôt de l'exchange (les adresses de dépôt sont uniques par client, pas listables) ; (ii) réseau du transfert = réseau demandé par l'exchange pour l'actif ; (iii) chaîne à mémo : mémo présent et non vide. R4.12 : destination = hot wallet connu d'exchange (label) et non adresse de dépôt personnelle : alerte.
**Jeux de données** : aucun jeu libre complet d'adresses d'exchanges trouvé ; résultats commerciaux (Arkham, Allium, Bitquery avec jeton, Glassnode, Webacy). Pistes [V] : labels publics Etherscan (non redistribuables), dépôts GitHub communautaires de labels ; non vérifié.
**Faux positifs** : exchange acceptant plusieurs réseaux sur la même adresse ; adresses de dépôt inconnues.
**Gravité** : élevée (parfois récupérable). **Phrase** : "Ce réseau n'est pas celui que Coinbase attend pour ce dépôt : vos fonds risquent de ne pas être crédités."

## 7. Faux tokens (même symbole, nom, logo)
**Mécanisme** [S] : n'importe qui déploie un ERC-20 "USDC" ; noms et symboles ne sont pas uniques ; le logo peut s'afficher via la source d'images (Trust Wallet assets) alors que le contrat est faux (doc Uniswap token-listing). Utilisé aussi pour l'empoisonnement (variante c).
**Règles** : R4.13 : comparer l'adresse du contrat à une liste de référence (clé = adresse + chaîne, jamais le symbole) ; symbole/nom connu mais adresse différente = rouge "faux token". R4.14 : plusieurs tokens du même symbole dans une pool = rouge.
**Listes gratuites** : Uniswap Token Lists (tokenlists.org), CoinGecko (API gratuite à quotas), Trust Wallet assets (GitHub, soumissions ouvertes donc insuffisant seul), 1inch [V].
**Faux positifs** : homonymes légitimes (USDC.e bridgé), nouveaux tokens non listés.
**Gravité** : élevée. **Phrase** : "Ce jeton porte le nom d'un autre, mais c'est un autre jeton : le vrai a une autre adresse."

## 8. Tokens honeypot (non vendables)
**Mécanisme** [S] : achat possible, vente bloquée (blacklist cachée, taxe 100 %, `transfer` conditionnel). Détection par simulation achat+vente sur fork (honeypot.is, Dedaub Tok{In}) et audit statique (GoPlus). Limite : le comportement peut changer après le scan.
**Règles** : R4.15 : avant un swap vers un token inconnu, simuler la vente (eth_call/fork) ; revert ou retour sous seuil = rouge. R4.16 : drapeaux GoPlus : `is_honeypot`, `buy_tax`/`sell_tax` (> 10 % orange, > 50 % rouge), `is_blacklisted`, `transfer_pausable`, `owner_change_balance`, `hidden_owner`, `can_take_back_ownership`, `is_mintable` [S : noms observés via un client tiers, valeurs "0"/"1" ; doc officielle non lue : https://docs.gopluslabs.io].
**Faux positifs** : taxe légitime, pause/liste noire de stablecoins, pools sans liquidité faisant échouer la simulation.
**Gravité** : élevée. **Phrase** : "Vous pourrez acheter ce jeton mais probablement pas le revendre."

## 9. Tokens à taxe de transfert, rebasing
**Mécanisme** [S] : fee-on-transfer : le destinataire reçoit moins que l'envoi ; rebasing (stETH, AMPL) : soldes changeant sans transfert ; Uniswap v3 les gère mal. USDT a un mécanisme de frais activable, à 0 selon des rapports d'audit (à confirmer sur le code vérifié).
**Règles** : R4.17 : simuler le transfert, comparer le delta de solde du destinataire au montant envoyé ; écart > 0,5 % = "taxe" [seuil V]. R4.18 : dans un swap, sortie simulée nettement sous le quote = alerte. R4.19 : rebasing : avertir (recommander wstETH) [V].
**Faux positifs** : taxe annoncée et acceptée ; arrondis de 1-2 wei sur stETH.
**Gravité** : faible à moyenne. **Phrase** : "Ce jeton retient une commission à chaque envoi : le destinataire recevra moins."

## 10. Liste noire / pause / mint admin (USDT, USDC)
**Mécanisme** [S] : USDT : `addBlackList`, `removeBlackList`, `destroyBlackFunds` ; USDC : rôles blacklister et pauser distincts (pause = arrêt global). Gel effectif après un délai (44 min observées sur un exemple ; 78 M USDT déplacés pendant le délai selon un rapport). Mars 2026 : Circle a blacklisté 16 adresses dont un contrat de pont, bloquant les retraits ICP vers Ethereum. Sources : https://blocksec.com/blog/usdt-blacklist-explained-2026 ; https://blog.amlbot.com/circle-froze-16-business-hot-wallets-including-a-blockchain-bridge-smart-contract/ ; https://cointelegraph.com/news/tether-blacklist-delay-allowed-78-million-usdt-move. Mint admin : pouvoirs de frappe de l'émetteur [V, non détaillé].
**Règles** : R4.20 : avant envoi USDT/USDC, vérifier `isBlacklisted(destination)` et de l'expéditeur par RPC ; vrai = rouge. R4.21 : `paused()` vrai = alerte. Outil de référence : https://blocksec.com/usdt-freeze-checker [S].
**Faux positifs** : très faibles ; les adresses d'empoisonneurs sont souvent blacklistées après coup (Tether l'a fait [P : USENIX]).
**Gravité** : élevée mais rare. **Phrase** : "L'émetteur de ce jeton peut geler cette adresse ; elle est actuellement gelée."

## 11. Tokens "frais" sans liquidité
**Mécanisme** [V] : token récent, paire créée par l'attaquant, liquidité retirable (rug pull) ou minuscule, prix manipulable.
**Règle** : R4.22 : contrat < 24-72 h, liquidité < seuil (ex. 10 000 USD), top 10 détenteurs > 50 %, LP non verrouillée : rouge si l'intention est "j'achète une crypto" non listée. Données : DexScreener et GeckoTerminal (API gratuites à limites), GoPlus (champs holders/LP : à confirmer), date de création via Etherscan.
**Faux positifs** : lancements légitimes, memecoins voulus.
**Gravité** : moyenne à élevée. **Phrase** : "Ce jeton est tout neuf et presque personne ne l'échange : vous pourriez ne pas pouvoir le revendre."

## 12. Swap vers un destinataire différent de soi (recipient dans le calldata du routeur)
**Mécanisme** : les routeurs (Uniswap Universal Router : commandes avec `recipient`, plus SWEEP/TRANSFER ; V2/V3 : `to`/`recipient`) peuvent livrer la sortie à une autre adresse ; un phishing affiche "swap" mais redirige la sortie [V pour le schéma ; incident EIP-7702 + Universal Router, août 2025, 66 000 USD, S]. Cas documenté précis d'un drainer réécrivant le recipient d'un swap : non trouvé.
**Règles** : R4.23 : décoder le calldata (ex. bibliothèque `uniswap-universal-router-decoder`, non auditée ; ABI 1inch, 0x, ParaSwap, CoW...) ; pour chaque commande extraire `recipient` ; recipient != signataire (hors étapes intermédiaires vers le routeur) = rouge "la sortie ne vient pas chez vous". Constantes spéciales du routeur Uniswap (MSG_SENDER / ADDRESS_THIS) à confirmer dans le code [V]. R4.24 : adresse du routeur = déploiement officiel (registre de la doc Uniswap).
**Faux positifs** : swap volontaire vers un tiers ("je paie Paul en USDC en partant d'ETH") ; agrégateur intermédiaire.
**Gravité** : critique si inattendu. **Phrase** : "Cet échange envoie le résultat à une autre adresse que la vôtre."

## 13. Slippage et frontrun/sandwich
**Mécanisme** [S] : un bot achète avant et vend après votre swap, vous subissez un prix pire dans la limite de votre slippage. H1 2022 : 182 246 sandwichs, 87,7 M USD de pertes traders, 17,85 M USD de profit, 72 351 victimes, pertes surtout entre 50 et 500 USD (EigenPhi). Nov 2024 - oct 2025 : ~60 M USD/an estimés sur > 95 000 sandwichs, ~40 % sur pools peu volatiles, baisse en 2025 (Cointelegraph/EigenPhi : https://cointelegraph.com/research/exclusive-data-from-eigenphi-reveals-that-sandwich-attacks-on-ethereum-have-waned). Le routage privé ne protège pas tout : 2 932 sandwichs privés (nov-déc 2024), 409 236 USD de pertes (arXiv 2512.17602).
**Règles** : R4.25 : tolérance de slippage > 1 % sur paire majeure orange ; > 5 % rouge ; `amountOutMin` = 0 ou deadline très lointaine rouge [seuils V]. R4.26 : comparer `amountOutMin` à un quote de référence (Chainlink, TWAP, API d'agrégateur).
**Faux positifs** : tokens volatils ou à taxe nécessitant un slippage élevé ; petites sommes.
**Gravité** : moyenne. **Phrase** : "Vous acceptez de recevoir jusqu'à X % de moins que prévu : des robots peuvent en profiter."

## 14. Prix aberrant (valeur reçue très inférieure à la valeur envoyée)
**Mécanisme** [V] : pool manipulée, faux token, impact de prix énorme, taxe cachée, erreur de décimales.
**Règle** : R4.27 : valeur USD de la sortie simulée / valeur USD de l'entrée < 0,97 sur paire majeure orange, < 0,9 rouge ; token sans prix fiable = "valeur inconnue". Prix : Chainlink, CoinGecko, DefiLlama coins API [V].
**Faux positifs** : tokens peu liquides légitimes ; frais de pont ; achat volontaire d'un petit token.
**Gravité** : élevée. **Phrase** : "Vous donnez 1 000 euros et recevez environ 300 euros de valeur."

## 15. Pont (bridge) vers une mauvaise chaîne ou adresse
**Mécanisme** [V/S] : le pont envoie vers un `destinationChainId` ou un `recipient` différent de l'intention ; adresse EVM valide mais sans clé sur la chaîne cible (contrats, smart wallets non déployés) ; faux sites de ponts. Risque de gel : pont ICP-Ethereum bloqué par blacklist USDC (mars 2026, S).
**Règles** : R4.28 : décoder `destinationChainId` et `recipient` (ABI Across, Stargate, CCTP, LayerZero, Wormhole...) ; chaîne ou destinataire différent de l'intention = rouge. R4.29 : adresse du pont = registre officiel. R4.30 : destinataire contrat/smart account : getCode sur la chaîne cible.
**Faux positifs** : envoi volontaire vers un tiers ou une autre chaîne.
**Gravité** : critique (souvent irréversible). **Phrase** : "Ce transfert envoie vos fonds vers une autre chaîne ou une autre adresse que celle annoncée."

## 16. Paiement à un contrat de réclamation (claim)
**Mécanisme** [S] : faux airdrops ; envoi d'ETH ou `approve` à un contrat de phishing. Juillet 2022 : airdrop de tokens malveillants, 73 399 adresses Uniswap touchées selon MetaMask (https://therecord.media/millions-in-cryptocurrency-stolen-in-phishing-attacks-on-uniswap-users/).
**Règles** : R4.31 : fonction `claim`/`airdrop`/`verify`/`securityUpdate` payable ou accompagnée de `approve`/`setApprovalForAll`/`permit` sur un contrat jeune (< 7 jours), non vérifié ou non labellisé : rouge. R4.32 : si l'intention n'est pas "claim", tout appel claim est une divergence. R4.33 : token reçu non sollicité : marquer "spam", ne jamais proposer d'interaction.
**Vérification** : Sourcify/Etherscan (code vérifié, date de création), GoPlus (address/dapp security : champs exacts à vérifier), listes ScamSniffer/Chainabuse [V].
**Faux positifs** : airdrops légitimes (ARB, UNI) ; nécessite liste blanche de contrats officiels.
**Gravité** : critique. **Phrase** : "Ce contrat vous demande de l'argent ou une autorisation pour un cadeau : c'est la méthode des arnaques."

---
## Recommandations d'implémentation
1. Données locales d'abord (sans API) : historique, carnet, comparaison préfixe/suffixe, getCode, décodage du calldata, simulation (fork/eth_call) pour le delta de soldes. R4.1-R4.2, R4.10, R4.23, R4.25, R4.28 sont 100 % déterministes.
2. APIs gratuites pour enrichir : GoPlus, honeypot.is, DexScreener/GeckoTerminal, CoinGecko/Uniswap token lists, Sourcify, ENS on-chain. Quotas et disponibilité à tester ; absence de réponse = "inconnu", jamais "sûr".
3. Principe : token inconnu = alerte, adresse inconnue = alerte légère, divergence intention/effet = alerte maximale.
4. Défenses citées par USENIX [P] : afficher l'adresse entière, masquer les transferts suspects, confirmer avant envoi à un lookalike, liste blanche d'adresses de confiance.

## Non trouvé / limites
- Jeu libre complet d'adresses d'exchanges : non trouvé.
- Doc officielle GoPlus (champs exacts) et honeypot.is : non lue, relais tiers seulement.
- Total annuel 2025 d'address poisoning par ScamSniffer : non trouvé.
- Cas documenté d'un drainer réécrivant le recipient d'un swap : non trouvé.
- Seuils numériques (R4.17, R4.22, R4.25, R4.27) : propositions [V] à calibrer.

## Résumé en 8 lignes
1. Empoisonnement d'adresse : USENIX 2025 = ~270 M de tentatives, 6 633 réussites, 83,8 M USD (ETH+BSC, 2022-2024) ; règle : préfixe >= 3 et suffixe >= 4 identiques à une adresse connue.
2. Trois variantes : petit transfert, valeur nulle via transferFrom, faux token ; fenêtre ~20 min après un vrai envoi.
3. Ne pas copier depuis l'historique ; première utilisation d'une adresse = vérification par second canal.
4. ENS/homoglyphes : normaliser (ENSIP-15), résoudre soi-même, détecter multi-scripts et invisibles ; la normalisation seule n'évite pas les sosies valides.
5. Exchanges : mémo/tag et réseau à contrôler ; aucun jeu libre d'adresses d'exchanges trouvé ; adresse de dépôt à faire confirmer par l'utilisateur.
6. Tokens : comparer l'adresse du contrat (jamais le symbole) à une token list ; simuler la vente (honeypot), mesurer taxe et delta de solde ; GoPlus pour les drapeaux.
7. Swaps/ponts : décoder `recipient`, `destinationChainId`, `amountOutMin` ; destinataire != soi ou slippage > 5 % = rouge ; sandwich ~60 M USD/an (EigenPhi 2025).
8. Claim/airdrops et USDT/USDC (blacklist, pause) : contrats jeunes/non vérifiés et `isBlacklisted` à contrôler ; seuils chiffrés à calibrer.

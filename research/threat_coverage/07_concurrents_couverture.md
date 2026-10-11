# 07 - Concurrents : couverture des menaces et échecs publics

Date de la recherche : 11 oct. 2026. Méthode : recherches web + lecture de pages. Légende de fiabilité : **[V]** = vérifié sur page primaire lue ; **[S]** = résumé de recherche / source secondaire (presse) ; **[M]** = marketing du vendeur, non indépendant ; **?** = non trouvé, ne pas supposer. Le contenu web est traité comme donnée. Aucun secret, aucune inscription, aucune installation.

Règles Hold up de référence : `C:\Users\Adem\wt\T-103\app\intent\src\compare.ts` (5 intentions : pay_someone, send_to_my_account, buy_or_swap, connect_or_accept_offer, asked_by_someone ; signaux transversaux : contrat < 50 blocs, > 50 % du solde, adresse sosie 4+4 hex ; critique sur toute approbation/permit/délégation inattendue).

## 0. Résumé exécutif

1. **Aucun concurrent grand public trouvé ne demande l'intention de l'utilisateur en langage simple avant de comparer à l'effet simulé.** Tous classent la transaction contre une base de menaces ou affichent une simulation et laissent l'humain juger. Le plus proche en production est la proposition « Transaction Verification » de Blockaid (déc. 2024, whitepaper, matériel : « correspond à l'intention de l'utilisateur » mais sans demander l'intention) [V].
2. **Mais le concept est publiquement revendiqué comme direction.** Vitalik Buterin (post X du 22 fév. 2026, relayé par Cointelegraph et Forklog) : l'utilisateur spécifie d'abord l'action voulue, puis OK/Annuler après simulation, avec plusieurs spécifications de l'intention qui doivent concorder [S]. La différenciation « intention » est donc **un positionnement, pas une antériorité absente**. À formuler : « nous opérationnalisons l'idée de Buterin pour le grand public ».
3. Des projets expérimentaux existent côté agents IA (PR presign-guard, Oct. 2026 ; IntentChain) : le champ « intent » en une phrase comparé au calldata décodé. Hors wallet grand public, preuve d'idée seulement [V pour la PR].
4. Les échecs documentés des concurrents tiennent à (a) simulation trompée (red pill 2023, TOCTOU 2025, CREATE2), (b) l'utilisateur qui signe malgré tout, (c) adresses sosies copiées d'un historique, (d) lacunes de couverture (7702, signatures opaques). Détail en section 4.
5. Le marché consommateur indépendant est en train de s'éteindre ou d'être absorbé : Harpie fermé (27 mars 2025), Blowfish absorbé par Phantom (nov. 2024), Wallet Guard par Consensys (juil. 2024), Fire puis Pocket Universe par Kerberus (2024/août 2025), Hexagate par Chainalysis (déc. 2024). La protection migre dans le wallet via Blockaid. Argument : la barrière doit être intégrable, pas une extension orpheline.

## 1. Matrice menaces x outils

Légende : ✓ = couvert avec source ; ~ = partiel ; ✗ = documenté comme non couvert ; ? = non trouvé. Les ✓ sont presque tous des allégations vendeur [M] sauf mention. Aucune évaluation indépendante comparative n'a été trouvée.

| Outil | Permit / Permit2 | setApprovalForAll / approve illimité | EIP-7702 | Address poisoning | Sites/domaines sosies | Faux support | Contrat frais | Simulation-aware / TOCTOU | Ordres Seaport |
|---|---|---|---|---|---|---|---|---|---|
| Blockaid (MetaMask, Coinbase, Rainbow, Zerion, Ledger) | ~ [M]: simulation+validation ; pas de chiffre | ✓ [M] simulation | ✓ [M] heuristiques 7702 déclarées (blog) | ✓ [M] ; MetaMask a livré en 2026 la détection dans le flux d'envoi | ✓ [M] dApp scanning | ✗ ? (hors scope transaction) | ~ : contournable par CREATE2 (Scam Sniffer) | ~ : déclare des heuristiques TOCTOU ; faille de parsing 0X passée (2024) | ? |
| MetaMask Security Alerts (Blockaid) | ? | ~ | ? (docs d'alerte ne le disent pas) | ✓ [V] blocage 4+4 caractères + « jamais interagi » | ✓ [V] listes phishing | ✗ | ? | ✗ : docs : « ne garantit pas la détection de tout » | ? |
| Blowfish (Phantom) | ? | ? | ? | ? | ? | ✗ | ? | ✗ [V] vulnérable red pill en 2023 (corrigé) | ? |
| Pocket Universe (Kerberus) | ? | ✓ [M] simulation | ? | ? | ✓ [M] | ✗ | ? | ✗ [V] red pill 2023 (corrigé) | ? |
| Wallet Guard (Consensys) | ? | ✓ [M] | ? | ? | ✓ [M] ; Stormwatcher détection drainers | ✗ | ? | ? | ? |
| Fire (Kerberus) | ? | ✓ [M] simulation | ? | ? | ? | ✗ | ? | ✗ [V] red pill 2023 (corrigé) | ? |
| Rabby | ✓ [S] affichage Permit2 | ✓ [S] révocation intégrée | ~ [S] « support limité » (audit Least Authority, sept. 2025) ; affichage de l'état d'autorisation | ? | ~ [S] | ✗ | ~ [S] | ✗ [V] red pill 2023 (corrigé) | ? |
| Scam Sniffer (extension) | ✓ [M] signatures temps réel | ✓ [M] | ? | ? non listé | ✓ [M] | ✗ | ? | ✓ a publié l'attaque (TOCTOU 143 ETH) et recommande un refresh forcé | ✓ [M] vérif. listings/offres |
| Web3 Antivirus | ? | ✓ [M] simulation + révocation | ? | ✓ [M] annoncé | ✓ [M] | ✗ | ✓ [M] honeypots | ? | ? |
| Harpie | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ : frontrunning de transferts sortants, **fermé** | ✗ |
| Revoke.cash | ✓ [S] Permit2 depuis août 2023 (post-hoc) | ✓ [S] | ~ [S] cité pour détection d'autorisations | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ [S] extension avertit sur listing OpenSea/LooksRare |
| Kerberus Sentinel3 | ? | ? | ? | ✓ [M] page éducative | ✓ [M] | ✗ | ? | ? | ? |
| GoPlus SecWareX | ? | ~ | ✓ [S] API de simulation détecte les attaques 7702 (OneKey, sept. 2025) | ? | ? | ✗ | ? | ? | ? |
| HashDit (Trust Wallet, PancakeSwap) | ? | ✓ [M] | ? | ✗ ? | ✓ [M] | ✗ | ✓ [M] tokens scam | ? | ? |
| Webacy | ~ [M] « approval draining » | ✓ [M] | ? | ✓ [M] (billet dédié) | ✓ [M] | ✗ | ~ [M] score d'adresse | ✗ : argumente que la simulation « ne marche pas », sans preuve ni chiffre | ? |
| Ledger Transaction Check + Clear Signing (ERC-7730) | ~ [S] (clear signing par descripteur) | ~ | ? | ✗ | ✗ | ✗ | ✗ | ✓ signature de la simulation vérifiée par le device [M] | ? |
| Coinbase Wallet | ✓ [M] via Blockaid | ✓ [M] | ? | ✓ [M] via Blockaid | ✓ [M] | ✗ | ? | ✗ [V] red pill 2023 (corrigé) | ? |
| Trust Wallet | ? | ? | ? | ✓ [M] vérif. d'adresse destinataire (scanner) | ? | ✗ | ✗ au lancement (contrats « plus tard ») | ? | ? |
| Rainbow / Zerion | ✓ [M] via Blockaid | ✓ [M] | ? | ✓ [M] via Blockaid | ✓ [M] | ✗ | ? | ? | ? |
| Tenderly | simulation générique, pas de verdict de menace | idem | ? | ✗ | ✗ | ✗ | ✗ | ✗ : simule sur l'état courant | ✗ |
| Hexagate (Chainalysis) | ✗ (protocoles, pas utilisateurs) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

Lecture : la colonne **Faux support est vide pour tous** (aucune source), la colonne **Seaport est quasi vide**, la colonne **7702** est la plus mal couverte et la plus récente.

## 2. Fiches par outil

Pour chaque fiche : menaces, méthode, prix, latence, utilisateurs, échecs. Les chiffres vendeurs sont marqués [M].

### 2.1 Blockaid et MetaMask Security Alerts (PPOM)
- Méthode : simulation de transaction + validation contre heuristiques et bases (adresses malveillantes, sanctions OFAC, dApp scanning) [S]. MetaMask envoie URL du dapp, méthode JSON-RPC, chain ID et données de transaction aux serveurs quand les alertes sont actives [V, support.metamask.io/configure/wallet/security-alerts/]. Les lancements 2023 parlaient d'un moteur hors ligne (PPOM) ; la doc actuelle décrit un envoi serveur : divergence non expliquée.
- Étiquettes : « Warning » (risque potentiel) / « Malicious » (haute confiance). **Ne bloque pas** : l'utilisateur peut confirmer [V]. « Ne garantit pas la détection de toutes les menaces » [V].
- Chaînes MetaMask : ~21 (Ethereum, Base, BSC, Polygon, Arbitrum, Optimism, Linea...) [V].
- Prix : gratuit pour l'utilisateur ; B2B pour wallets. Latence : « sous 300 ms » [M] (billet Ledger/Blockaid). Chiffres : Coinbase Wallet dit 75 M$ évités en 5 mois, 114 M de tx/connexions analysées, ~800 000 connexions bloquées (mars 2024) [S, The Block]; « faux positifs < 0,002 % » [M, non vérifié]. MetaMask/Blockaid : 65,4 M d'incidents d'address poisoning signalés janv. 2025 - fév. 2026 (compte d'incidents, pas de pertes) [S].
- Adresse sosie : MetaMask compare à l'historique, bloque si 4 premiers + 4 derniers identiques mais milieu différent, et alerte si adresse jamais utilisée [V support MetaMask]. **C'est exactement notre règle `isLookalike` (4+4 hex)** : table stakes.
- 7702 : Blockaid dit traiter les EOA 7702 comme comptes intelligents, scanner le bytecode injecté, heuristiques sur upgrades vers contrat compromis, session keys, batch malveillant, TOCTOU [M, blog Blockaid « Building safely with EIP-7702 »]. Pas de taux de détection.
- Échecs documentés :
  - Bypass de parsing : dans `eth_signTypedData_v4`, passer le spender de `0x` à `0X` supprimait l'alerte ; corrigé ; wallet non nommé [V, blog Blockaid 11 juin 2024].
  - CREATE2 (Scam Sniffer) : le contrat du drainer est créé après la signature, l'adresse du spender est vide au moment du contrôle, l'alerte du wallet est contournée dans leurs tests ; ~60 M$ attribués à un drainer [S, résumé de recherche ; page non relue (reset réseau)].
  - Inferno Drainer : Check Point (2025) : contrats à usage unique, config on-chain chiffrée, C2 par proxy pour contourner les alertes wallet et listes anti-phishing ; 30 000 wallets, ≥ 9 M$ en 6 mois [S].
  - Faux positifs : NFT Now note un historique de faux positifs ; les faux positifs « réduisent la vigilance » [S].
  - Je n'ai trouvé **aucun post-mortem nominatif** « victime équipée de MetaMask+Blockaid, alerte absente ». Les victimes 7702 (146 551 $, 24 mai 2025, utilisateur MetaMask, lot Inferno Drainer) ne disent pas si une alerte s'est affichée [S, Scam Sniffer / SlowMist via GoPlus].

### 2.2 Blowfish / Phantom
- Racheté par Phantom le 19 nov. 2024 ; service autonome arrêté, marque supprimée [S, phantom.com blog, blog.blowfish.xyz]. Avait 40+ clients wallets (Kraken, MetaMask, Brave, Exodus) [S].
- Méthode : simulation + prévisualisation + alertes de connexion app. Intégré à Phantom (Solana d'abord ; couverture EVM actuelle non confirmée).
- Échec : vulnérable à la « red pill » ZenGo (mars 2023), corrigé rapidement [V, BleepingComputer 21 mars 2023].

### 2.3 Pocket Universe (Kerberus) et Fire
- Extensions de simulation gratuites ; assurance optionnelle payante (Pocket Universe, frais de couverture variable) [S]. Kerberus a acquis Fire (sept. 2024, couverture 30 000 $ annoncée) puis Pocket Universe (annoncé le 21 août 2025, ~200 000 utilisateurs, « sept chiffres ») pour fusion dans Sentinel3 [S, The Block/Kerberus]. Kerberus affirme « zéro perte utilisateur en ~3 ans » [M, non vérifié].
- Échec : red pill 2023 pour Pocket Universe et Fire (corrigé) [V].
- Signal de marché : un analyste (Architect Partners) estime que les outils consommateurs peinent à monter en échelle et à monétiser seuls [S].

### 2.4 Wallet Guard (Consensys)
- Racheté le 3 juil. 2024 ; équipe intégrée à la sécurité produit MetaMask ; objectif : détection de drainers (validation de transaction + heuristiques côté client) [S, The Block, Consensys]. Stormwatcher = détection de drainers par blockchain [M]. Statut de l'extension autonome après rachat : ?.
- Fournissait des alertes de menaces (ex. abus d'approbations Uniswap par Inferno Drainer) [M].

### 2.5 Rabby
- Wallet open source gratuit, simulation pré-signature intégrée, affichage Permit2, révocation d'approbations, état d'autorisation 7702 [S, majoritairement blogs SEO peu fiables ; la source solide est l'audit Least Authority 2e revue, finalisé 2 sept. 2025 : « support EIP-7702 limité »].
- Échec : red pill 2023 (corrigé) [V]. Autres incidents Rabby trouvés sans rapport avec la détection : faux app Rabby sur l'App Store (fév. 2024, victime à 24 k$), exploit Rabby Swap (oct. 2022) [S]. Aucun cas « alerte Rabby ratée » trouvé.

### 2.6 Scam Sniffer
- Extension + API ; blocklist, vérif. de signatures, listings/offres NFT, suivi d'approbations, simulation [M]. Prix : sources contradictoires (premium par défaut avec 0,25 % de frais sur certains swaps DEX d'après le store ; 999 $/mois d'après AlternativeTo) : **vérifier sur le site**. Utilisateurs : 50 K (miroir) contre quasi rien (agrégateur) : peu fiable.
- Rôle clé : **source de données** sur les échecs des autres. Rapport 2025 [V, drops.scamsniffer.io] : 83,85 M$ perdus, 106 106 victimes (contre 494 M$ et 332 000 en 2024) ; Permit/Permit2 = 38 % des pertes des gros cas (3 cas, 8,72 M$) ; approve/increaseApproval 3 cas 5,62 M$ ; setApprovalForAll 1 cas 1,23 M$ ; 7702 : 2 cas août 2025 pour 2,54 M$ ; plus gros vol 6,5 M$ par Permit (sept.). Limité aux drainers par phishing sur EVM, borne basse.
- Publications d'attaques contre la simulation : TOCTOU du 10 janv. 2025 (143,45 ETH, ~461 000 $), signature 30 s après le changement d'état [S, plusieurs sources].

### 2.7 Web3 Antivirus
- Extension gratuite « pour toujours » ; simulation, détection de 60+ risques, révocation, annonce la détection d'address poisoning [M]. Analyse de transaction Ethereum au moment de la page citée. 20-50 K utilisateurs selon la source. Aucun échec documenté trouvé.

### 2.8 Harpie
- Pare-feu on-chain : détecte un transfert sortant vers une adresse hors liste blanche et le devance (gas plus élevé) vers un coffre ; frais 0,01 ETH par actif récupéré [S].
- **Fermé le 27 mars 2025** : « pas de modèle économique durable » (The Block). Levée 4,5 M$ en 2022 (Dragonfly, Coinbase Ventures). Leçon : la protection payante grand public ne s'est pas vendue ; aucune évaluation d'efficacité publiée.

### 2.9 Revoke.cash
- Gestion et révocation d'approbations (Permit2 depuis août 2023) ; extension qui avertit avant signature d'approbation, de listing OpenSea/LooksRare ou de signature de hash [S, page add-on Firefox]. Post-hoc : ne couvre pas la signature trompeuse elle-même.

### 2.10 GoPlus SecWareX
- Plateforme modulaire : scanner de wallet multichaîne, SecHub (alertes), marketplace de services tiers, SecNet (RPC sécurisé) ; modèle premium par abonnement de services, « 50 000 adresses abonnées en deux mois » [M/S]. Prix non publié. API de simulation citée pour la détection 7702 [S, OneKey]. Article GoPlus de juin 2025 : l'attaquant #InfernoDrainer a groupé des étapes d'autorisation dans une transaction batch via la fonction 7702 de MetaMask, non une faille de MetaMask [S].

### 2.11 HashDit
- Extension entre sites et wallets (Trust, MetaMask) ; phishing, drainers avant connexion, avertissements de transaction, lecture humaine [M]. Son API alimente PancakeSwap et le Trust Wallet Security Scanner (avec Binance Risk) [S]. Scanner Trust au lancement : seulement le risque d'envoi vers une adresse ; scan des contrats « plus tard » [V/S].
- Incident Trust Wallet déc. 2025 : extension v2.68 compromise (chaîne d'approvisionnement), ~7-8,5 M$, ~2 520-3 000 wallets : **le scanner n'est pas en cause** ; c'est la limite de toute barrière qui vit dans le client compromis [S].

### 2.12 Webacy
- API de risque (adresse, contrepartie, transaction pré- et post-) ; données de 15+ fournisseurs ; address poisoning, approval draining, contrats de phishing [M]. Billet du 22 avril 2026 « Transaction Simulation Doesn't Work » : thèse sans incident ni chiffre cités [V] : à ne pas citer comme preuve.

### 2.13 Ledger : Transaction Check + Clear Signing (ERC-7730)
- Transaction Check (avec Blockaid) : le tx non signé part chez des fournisseurs de simulation, retour d'un résumé signé que le device vérifie ; EVM sur Flex/Stax au moment du post ; probabiliste [S/M]. Clear Signing déterministe : le tx est soit lisible soit blind-signé ; erreur `ledger.com/e8` = hors couverture [S]. Exemple Ledger : un swap 100 ETH contre 1 USD sur Uniswap n'est pas signalé par Transaction Check, mais Clear Signing le rend visible : **la validation « menace » ne détecte pas le « mauvais prix », la lecture lisible oui** [S].
- ERC-7730 : standard Ledger ; élargi par la Fondation Ethereum le 12 mai 2026 avec ERC-8176 (attestation des descripteurs) et registre clearsigning.org [S]. Couverture dépend de la participation volontaire des protocoles. Pas de pourcentage de couverture trouvé.
- Bybit (21 fév. 2025, ~1,4-1,46 Md$) : l'interface Safe{Wallet} compromise montrait le bon tx tandis que le Ledger recevait autre chose ; les signataires n'ont pas vérifié sur l'écran du device et le blind-signing était imposé pour les appels de contrats [S, NCC, CertiK, Fireblocks]. Enseignement : un affichage dans le navigateur ne suffit pas ; notre barrière doit vérifier le **calldata réel**, pas ce que la dApp montre.

### 2.14 Coinbase Wallet / Rainbow / Zerion / Trust
- Coinbase Wallet : simulation de toutes les transactions (docs CDP) [S]. Blockaid derrière Coinbase, Rainbow, Zerion [S]. Trust Wallet : Security Scanner (HashDit/Binance Risk). Détail Permit2/7702 pour ces wallets : ? (aucune source).
- Red pill 2023 : Coinbase Wallet touché, corrigé, bug bounties à ZenGo [V].

### 2.15 Tenderly, Hexagate
- Tenderly : API de simulation sur ~100 réseaux, état le plus récent, toutes adresses « déverrouillées » par défaut ; monitoring payant [S]. C'est un **moteur de simulation**, pas un verdict. Candidat d'infrastructure pour nous, pas concurrent.
- Hexagate : détection de menaces pour protocoles, racheté par Chainalysis (déc. 2024), clients Coinbase/Consensys [S]. Hors utilisateur final.

## 3. Études sur l'efficacité des alertes et la fatigue (chiffres)

Aucun papier trouvé ne mesure « % qui ignorent les warnings Blockaid/MetaMask ». À ne pas inventer. Éléments réels :
- **« What I Sign Is Not What I See »** (arXiv 2601.16751, 2026) [V, lu en partie] : survey n=50 : 78 % regardent le montant, 71 % le destinataire ; gas, chain ID, expiration rarement ; 64 % se fient aux interfaces ou marques familières contre 32 % aux données du contrat. Étude n=30 (8 tâches simulées type MetaMask) : signature de dépense illimitée 40 %, contrat suspect 43,3 %, prompt de phishing 40 %. Étude principale n=128 : identification correcte 67,9 % (interface standard) contre 84,2 % (décodeur sémantique, intention en langage clair, risque vert/jaune/rouge) ; mental demand NASA-TLX 67,8 à 42,6. Les auteurs qualifient les résultats de préliminaires ; le papier a des incohérences internes. Tâches simulées, pas de vraies pertes.
- **TxSum / MATEX** (arXiv 2512.06933) [V sur l'abstract] : rejet des transactions malveillantes de 36,0 % (données brutes) à 88,0 % (explication MATEX), peu de faux rejets ; compréhension sur transactions complexes 52,9 % à 76,5 % ; 16 entretiens de cadrage. Lab, pas production.
- **Address poisoning dans 53 wallets** (Guan & Li, arXiv 2508.12107, août 2025) [V] : 12 wallets ne peuvent pas charger l'historique ; 16 affichent des faux transferts de tokens ; seulement 3 avertissent explicitement avant l'envoi vers l'adresse de phishing. Contredit toute idée que l'avertissement sosie est généralisé.
- **Habituation** : littérature générale sur les alertes de sécurité (SOUPS/BYU) ; étude KeepKey n=10 : beaucoup d'attaques MITM ont réussi ; aucune mesure spécifique wallet-crypto trouvée [S]. Enquête ChainPlay : 11 % des victimes continuent de cliquer malgré des alertes [S, enquête d'entreprise, faible].
- Approbations illimitées : étude de mesure Ethereum : 60 % des approbations illimitées, 0,2 % des comportements utilisateur suivent la bonne pratique, 10 % seulement des UI expliquent [S].

Implication : l'écart entre « l'alerte existe » et « l'utilisateur agit » est le problème, ce qui soutient un message en langage simple de type « Tu voulais X, ça fait Y » (nos `said`/`does`), mais **le gain est démontré en lab uniquement**.

## 4. Cas ratés documentés (récapitulatif)

| Date | Cas | Outils concernés | Source |
|---|---|---|---|
| mars 2023 | Red pill : contrats détectant la simulation (adresse COINBASE = zéro) ; simulation montre +0,016 WETH, réel : rien | Coinbase Wallet, Rabby, Blowfish, Pocket Universe, Fire, 1 extension non nommée non corrigée | BleepingComputer, TechTarget [V] |
| 2024 (corrigé) | Bypass `0X` dans signTypedData_v4 | wallet non nommé (parsing du fournisseur) | blog Blockaid, 11 juin 2024 [V] |
| 2024-25 | Inferno Drainer : contrats jetables, config chiffrée | alertes wallet et blacklists | Check Point 2025 [S] |
| ? | CREATE2 : spender neuf, historique vide | alertes de sécurité de wallets (non nommés) | Scam Sniffer [S] |
| 10 janv. 2025 | TOCTOU « claim » : 143,45 ETH | simulation de wallet (non nommé) | Scam Sniffer, BleepingComputer [S] |
| 21 fév. 2025 | Bybit : UI trompeuse + blind signing | Safe{Wallet} + Ledger (multisig) | NCC, CertiK [S] |
| fév. 2025 | Address poisoning : 763 662 $ (match 4+6) | n/a | Scam Sniffer via Forklog [S] |
| 24 mai 2025 | Batch 7702 présenté comme swap : 146 551 $ | utilisateur MetaMask | Scam Sniffer, SlowMist via GoPlus [S] |
| sept. 2025 | Permit 6,5 M$ (stETH, aEthWBTC) | n/a (alerte éventuelle non documentée) | Scam Sniffer 2025 [V] |
| 19-20 déc. 2025 | Address poisoning 49,99 M USDT, copie depuis l'historique, 3 premiers + 4 derniers, test de 50 USDT d'abord | wallet non nommé | Cointelegraph, Whale Alert, OneKey [S] |
| 24-26 déc. 2025 | Extension Trust Wallet v2.68 compromise | supply chain | BleepingComputer, Halborn [S] |
| 2022-2024 | Signatures Seaport à 0 prix : « pas d'avertissement du wallet » | wallets sans décodage | Scam Sniffer, DeFiHackLabs [S] |

Pour chaque cas « n/a » ou « non nommé », l'identité de l'outil ou la présence d'une alerte **n'est pas établie** : ne pas affirmer qu'un outil a « échoué » sans cela.

## 5. Ce qu'aucun ne couvre (à confirmer avant de l'affirmer en pitch)

1. **Comparaison avec l'intention exprimée** : aucun outil grand public trouvé. Tous jugent « malveillant ou non » (réputation, heuristiques) et non « conforme à ce que tu voulais » (Ledger l'illustre : un swap à 1 USD d'un token à 100 ETH passe Transaction Check).
2. **Faux support / ingénierie sociale** : aucun outil ne l'adresse hors liste de domaines. Notre règle `asked_by_someone` (toujours critique) n'a pas d'équivalent trouvé.
3. **Transactions parfaitement légitimes mais non voulues** (mauvais montant, mauvais token, > 50 % du solde, première adresse) : les moteurs de menace ne signalent que le malveillant.
4. **Adresses sosies hors historique du wallet** : MetaMask compare à l'historique du wallet ; la preuve que la comparaison par contact déclaré (`wrong_recipient`) manque ailleurs est une inférence, pas un fait sourcé.
5. **Bouclage sur la vérité terrain du calldata** malgré un front compromis (Bybit/Trust) : seul Blockaid Transaction Verification (proposition) et Ledger Transaction Check s'y attaquent côté hardware.
6. **Seaport** : couverture ? chez tous ; Scam Sniffer et l'extension Revoke.cash sont les seuls à le mentionner.

## 6. Table stakes : où Hold up doit être au niveau

- **Adresse sosie** : seuil 4+4 hex comme MetaMask ; MetaMask bloque *et* alerte « jamais utilisée ». Notre `isLookalike` compare uniquement 4+4 sur `lookalikeOf`/contreparties : OK, mais à l'état de l'art il faut aussi (a) l'alerte « adresse jamais utilisée », (b) idéalement le test des 3 premiers + 4 derniers (cas des 50 M$ avait 3+4 : notre seuil de 4+4 l'aurait **manqué**). Recommandation à valider par Adem : tester aussi 3+4 / 4+3 au minimum.
- **Permit / Permit2 / approve illimité / setApprovalForAll** décodés comme approbation (Scam Sniffer : Permit/Permit2 = 38 % des pertes des gros cas). Couvert dans `compare.ts`, mais la dépendance est à un `Effects` correct (parsing EIP-712, y compris les variantes de casse `0X` du bypass 2024).
- **Délégation 7702** : table stakes 2025+ ; USENIX Sec 2026 : 63 %+ des autorisations 7702 sont liées à des attaques ciblant des EOA [S]. Nous avons `hasDelegation` : à tester sur le cas batch « swap + délégation ».
- **Contrat frais** : seuil 50 blocs (~10 min) trop court face à CREATE2 (contrat créé après signature, adresse vide) : prévoir `ageBlocks === undefined`/« pas de code » = suspect, pas neutre.
- **Simulation robuste** : refresh forcé juste avant signature ; ne pas fixer coinbase/timestamp à des valeurs fixes (red pill) ; détecter la dérive d'état (TOCTOU) en re-simulant au dernier bloc ; sinon notre verdict est trompable comme les leurs.
- **Source de calldata fiable** : lire ce que le wallet va réellement signer, pas ce que la dApp affiche (Bybit).
- **Latence** : Blockaid revendique < 300 ms [M]. Notre verdict de règles est instantané (`latencyMs` dans `compare`) ; l'LLM de parsing d'intention et la simulation seront le goulet.
- **Faux positifs** : Blockaid revendique < 0,002 % [M]. Notre règle « > 50 % du solde » et « contrat < 50 blocs » en `warn` risquent de générer de la fatigue ; mesurer le taux sur un corpus bénin avant de claim.
- **Fonctionner dans MetaMask** : MetaMask n'a pas d'API d'extension pour injecter un verdict dans l'écran de confirmation natif ; ce point est une hypothèse technique à vérifier (non sourcée ici).
- **Ne pas dépendre d'un seul client** : cas Trust Wallet (extension compromise) et Bybit (UI compromise) : la barrière doit être indépendante du front.

## 7. Prior art sur l'intention

| Élément | Nature | Ce que c'est | Écart avec Hold up | Source |
|---|---|---|---|---|
| Vitalik Buterin, post X du 22 fév. 2026 | Proposition publique de principe | « L'utilisateur précise d'abord l'action, puis OK/Annuler après simulation » ; plusieurs spécifications qui doivent concorder ; l'intention est « extrêmement difficile » à capturer ; aucun produit cité | Principe identique à notre différenciation ; pas d'implémentation | Cointelegraph, Forklog [S] ; texte original du post non lu |
| Blockaid « Transaction Verification » (déc. 2024 / whitepaper 27 oct. 2024) | Whitepaper vendeur pour hardware wallets | Fournisseur de vérification qui signe un paquet transaction+simulation+validation (VTX), le device vérifie ; dit que cela aide à confirmer « l'intention de l'utilisateur » | N'interroge pas l'utilisateur ; l'« intention » est implicite | blockaid.io/blog [V] |
| Ledger Clear Signing / ERC-7730 | Standard déterministe | Afficher une description lisible de l'action | Lit l'action, ne la compare pas à un but déclaré | Ledger, EF [S] |
| « What I Sign Is Not What I See » (arXiv 2601.16751) | Papier académique | Résumés d'intention en clair + risque en 3 couleurs, +16,3 points d'identification (n=128, lab) | « Intention » = ce que fait la signature, pas ce que voulait l'utilisateur | arXiv [V partiel] |
| MATEX / TxSum (arXiv 2512.06933) | Papier | Explications au niveau flux de tokens ; rejet des malveillants 36 % à 88 % | Idem : explication, pas comparaison à un but | arXiv [V abstract] |
| WalletProbe (arXiv 2504.11735) | Framework de test | Décrit un module d'alerte qui « infère l'intention depuis la sortie de simulation » | Inférence côté outil, pas déclaration utilisateur | résumé de recherche [S] ; PDF illisible |
| presign-guard PR #123 (Fizzl13, mergée le 10 oct. 2026) | Projet open source agents IA | Champ `intent` (≤ 500 car.) comparé au calldata décodé par un modèle (verdict orange `INTENT_MISMATCH`, jamais rouge, jamais prioritaire sur les règles) ; motif : injection de prompt dans les agents | Pour agents, pas utilisateur ; pas de mesure de précision ; PR « Generated by Claude Code », donc à pondérer | github.com/Fizzl13/presign-guard/pull/123 [V] |
| IntentChain, Say Ur Intent (Sui) | Projets GitHub/MCP | L'IA ne peut que bloquer/escalader ; revue locale avant signature | Paiements agents / Sui | [S] |
| Intent2Tx (arXiv 2604.27763) | Benchmark | Traduire intention NL vers transaction Ethereum et l'inverse | Évalue des LLM, pas une barrière | [S] |

Conclusion sur l'intention : **antériorité conceptuelle réelle (Buterin 2026, Blockaid) et un prototype agents (presign-guard) ; aucun produit consommateur trouvé qui demande l'intention en 4 choix simples et applique des règles déterministes de comparaison.** Formulation prudente pour le pitch : « premier outil grand public à notre connaissance, mis en oeuvre selon un principe défendu par Buterin ». Le pointage de Buterin lui-même donne l'objection du praticien à anticiper : l'utilisateur n'a pas facilement accès à sa propre intention, d'où notre choix de 5 intentions fermées et non du texte libre. Voir aussi le risque de juge LLM manipulable (presign-guard le plafonne à « orange »), cohérent avec nos règles déterministes finales.

## 8. Lacunes et incertitudes

- Pas de texte original du post de Buterin ni du whitepaper Blockaid « Transaction Verification » au-delà du billet.
- Pas de PDF WalletProbe lisible ; pas de page Scam Sniffer CREATE2 relue.
- Aucune statistique indépendante d'efficacité de Blockaid/MetaMask ; aucune donnée de « % qui ignorent » les alertes.
- Les prix/latences/utilisateurs des extensions sont des listings de store ou des agrégateurs.
- La colonne Faux support, Seaport et 7702 de la matrice : « ? » signifie « non trouvé », pas « non couvert ».
- La source « USENIX 270 millions de tentatives d'empoisonnement » n'a pas été confirmée ; ne pas la citer.

## 9. URLs principales

- MetaMask Security Alerts : https://support.metamask.io/configure/wallet/security-alerts/
- MetaMask address poisoning : https://support.metamask.io/stay-safe/protect-yourself/wallet-and-hardware/address-poisoning-scams ; annonce 2026 : https://metamask.io/news/address-poisoning-detection
- Blockaid bypass (0X) : https://www.blockaid.io/blog/bypasses-how-attackers-evade-transaction-simulation
- Blockaid 7702 : https://blockaid.io/blog/building-safely-with-eip-7702-how-blockaid-helps-teams-adopt-the-future-of-smart-wallets
- Blockaid Transaction Verification : https://blockaid.io/blog/transaction-verification-a-solution-to-blind-signing-in-hardware-wallets
- Blockaid x Ledger : https://blockaid.io/blog/how-blockaid-helps-ledgers-transaction-check-mitigate-blind-signing-risks
- Coinbase/Blockaid 75 M$ : https://www.theblock.co/news/regulation/2024-03-13-coinbase-wallet-blockaid-75-million-usd-282230
- Red pill ZenGo : https://www.bleepingcomputer.com/news/security/coinbase-wallet-red-pill-flaw-allowed-attacks-to-evade-detection/amp/
- Simulation spoofing / TOCTOU : https://drops.scamsniffer.io/transaction-simulation-spoofing-a-new-threat-in-web3 ; https://www.bleepingcomputer.com/news/security/new-web3-attack-exploits-transaction-simulations-to-steal-crypto/
- CREATE2 bypass : https://defihacklabs.substack.com/p/wallet-drainers-starts-using-create2
- Scam Sniffer 2025 : https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
- Inferno Drainer (Check Point) : https://research.checkpoint.com/2025/inferno-drainer-reloaded-deep-dive-into-the-return-of-the-most-sophisticated-crypto-drainer/
- Phantom/Blowfish : https://phantom.com/learn/blog/phantom-acquires-blowfish
- Wallet Guard/Consensys : https://consensys.io/blog/consensys-acquires-wallet-guard-to-enhance-metamask-security
- Kerberus/Pocket Universe : https://www.kerberus.com/articles/pocket_universe/ ; Fire : https://www.kerberus.com/articles/fire/
- Harpie shutdown : https://www.theblock.co/news/business/2025-03-27-coinbase-web3-security-shop-harpie-announces-shutdown-348421
- Hexagate/Chainalysis : https://www.crowdfundinsider.com/2024/12/234343-chainalysis-announces-acquisition-of-web3-security-firm-hexagate/
- Webacy : https://www.webacy.com/blog/transaction-simulation-doesnt-work-what-to-do-instead ; docs https://docs.webacy.com/api-embedded-security/api-overview
- HashDit / Trust Scanner : https://www.bnbchain.org/en/blog/safeguarding-your-web3-journey-the-hashdit-extension ; https://trustwallet.com/blog/security/how-the-trust-wallet-security-scanner-makes-web3-safer
- Trust Wallet hack : https://www.bleepingcomputer.com/news/security/trust-wallet-confirms-extension-hack-led-to-7-million-crypto-theft ; https://www.halborn.com/blog/post/explained-the-trust-wallet-hack-december-2025
- Ledger Transaction Check : https://www.ledger.com/academy/glossary/transaction-check
- Bybit : https://www.nccgroup.com/research/in-depth-technical-analysis-of-the-bybit-hack/ ; https://www.certik.com/resources/blog/bybit-incident-technical-analysis
- Tenderly : https://docs.tenderly.co/simulations/overview
- Revoke.cash : https://revoke.cash/learn/approvals/what-is-permit2 ; https://addons.mozilla.org/addon/revoke-cash/
- Web3 Antivirus : https://web3antivirus.io/extension/
- Études : https://arxiv.org/html/2601.16751v1 ; https://arxiv.org/abs/2512.06933 ; https://arxiv.org/abs/2508.12107v1 ; https://arxiv.org/pdf/2504.11735
- 7702 empirique (USENIX Sec 2026) : https://www.usenix.org/conference/usenixsecurity26/presentation/huang-mingyuan ; Wintermute/Unchained cité.
- Buterin : https://cointelegraph.com/news/vitalik-buterin-advocates-intent-based-security ; https://forklog.com/en/vitalik-buterin-advocates-for-transaction-simulation-to-enhance-crypto-wallet-security/
- presign-guard : https://github.com/Fizzl13/presign-guard/pull/123

# Hold up : catalogue des détecteurs existants et taxonomie des signaux

> Recherche du 2026-10-10. Complète `research/tracks/T1_P4_etat_de_l_art.md` (qui traite des projets et du DORA) et `docs/architecture.md` §4 (D1 D2 D3 D7). Le règlement `context/notion_guide.md` prime.
> Menace cible (D-004) : sortie de fonds d'un prestataire crypto quand le circuit d'approbation des sorties est détourné. Signaux retenus à ce jour : (a) destinataires jamais vus, (b) volume cumulé multi-fenêtres, (c) écart backend annoncé vs chaîne, (d) changement de pouvoirs, (e) contexte.
> Légende : **[P]** page éditeur / dépôt / texte officiel · **[S]** secondaire (presse, agrégateur, résumé de moteur de recherche, billet) · **[V]** lu directement dans cette session · **[ÀV]** à vérifier avant d'apparaître à l'écran ou à l'oral. Les pages [P] gardées derrière un login (docs Hypernative, Blockaid, Hexagate, CertiK) n'ont pas pu être lues : ce que j'en dis vient de pages marketing ou de tiers, donc la liste des règles de ces éditeurs est **incomplète par construction**.
> Les "corpus" Elliptic (elliptic.co/corpus/...) ressemblent à du contenu généré (certaines pages sont incohérentes) : je ne m'en sers que comme [S-faible], jamais comme source d'un chiffre.

---

## 0. TL;DR (5 lignes)

1. **Ce qui est standard chez tous (table stakes)** : seuil de gros transfert, sorties vers adresses sanctionnées/taguées, événements de rôle/propriétaire (Safe, OpenZeppelin), liste d'autorisation ou de blocage d'appelants, limite de vélocité par fenêtre et pourcentage du solde (BitGo, Fireblocks), simulation avant signature. Aucun éditeur public n'a de secret là-dessus.
2. **Ce qui est rare ou non trouvé** : (c) l'écart "backend annoncé vs chaîne" comme détecteur dédié (le plus proche : *Bridge Balance Difference* de Forta, et les preuves de réserve) ; le cumul de sorties vers destinataires inconnus **en % du solde sur fenêtres emboîtées** (les vendeurs ont des seuils par transaction ou par période, pas ce croisement) ; la corrélation de deux familles pour passer en palier de blocage (Forta *Attack Detector Feed* est le seul analogue).
3. **Notre liste (a)-(e) laisse de côté 14 signaux utiles** (§5), dont les plus rentables : âge et nature du destinataire, part du solde par transaction et "vidé jusqu'à zéro", appel `delegatecall` (opération 1) et changement d'implémentation (Bybit), événements Safe complets (seuil, module, garde), approbations vers un nouveau dépenseur (le drain par `transferFrom` n'a pas de transaction sortante du portefeuille), fractionnement en montants égaux ou sous un seuil (patron DPRK), source de financement du gaz du destinataire.
4. **Piège de contexte (e)** : Drift (avr. 2026) a frappé une minute après un test de retrait légitime et après une migration planifiée du conseil de sécurité [S][V BlockSec]. Un contexte qui **abaisse** un score est une porte dérobée : le contexte doit seulement relever la sévérité, sauf calendrier signé à l'avance.
5. **Sur Fuji** : pas d'étiquettes de menace (elles existent sur le mainnet), oracle de sanctions Chainalysis **déprécié** (dernière mise à jour 18 mars 2026) et Tornado Cash **retiré de la liste OFAC le 21 mars 2025** : les listes de réputation doivent être un annuaire **synthétique** étiqueté, comme dans `architecture.md` §15. Traces internes (`debug_trace*`) et plage de `eth_getLogs` : à tester en étape 0, non documentés pour le RPC public Fuji.

---

## 1. Éditeurs et outils : signaux et règles documentés

### 1.1 Réseaux d'alerte et moniteurs

#### Forta (bots publiés) [P][V]
Sources : https://docs.forta.network/en/latest/starter-kit-bot-details/ · https://docs.forta.network/en/latest/bridge-starter-kit/ · https://docs.forta.network/en/latest/stablecoin-starter-kit/ (lues le 2026-10-10). Statut commercial 2026 : voir `T1_P4_etat_de_l_art.md` §2.1 ([ÀV]). Les bots ci-dessous sont des **idées de règles** réutilisables, qu'ils tournent encore ou non.

| Bot / gabarit | Ce qu'il détecte (texte des docs) | Équivalent dans notre liste |
|---|---|---|
| Large Balance Decreases (gabarit Bot Wizard ; déployé sur des ponts dont Avalanche, Polygon, Arbitrum, THORChain) | Baisse importante du solde d'un compte | (b) / D3, mais sur le solde, pas les sorties |
| Asset Drained Bot | Actifs entièrement vidés d'un contrat | **absent** : "vidé à zéro" |
| Anomalous Token Transfers Detection ML (Isolation Forest) | Transferts ERC-20 statistiquement anormaux | **absent** : anomalie ML |
| Anomalous Transaction Volume | Volume de transactions inhabituel, succès et échecs | **absent** : pic de transactions échouées |
| Time Series Analyzer (gabarit) | Transforme une série d'alertes bruitée en alerte statistique | (b) |
| Mint/Borrow Value Anomalies, Large Mint Borrow Volume Anomaly | Volumes de mint/emprunt anormaux | D6 (bonus) |
| Smart Price Changes / Price Change Anomalies | Variation de prix anormale selon oracles on-chain | prix (P2) |
| Bridge Balance Difference | Les deux côtés d'un pont se désalignent | **(c)** le plus proche de notre écart backend/chaîne |
| Monitor Events / Monitor Function Calls (gabarits) | Événements ou appels de fonctions réservées aux rôles privilégiés | (d) |
| oz-gnosis-events | Tous les événements des contrats OpenZeppelin et Gnosis Safe | (d) |
| Chainalysis Sanctioned Addresses | Interaction avec une adresse sanctionnée | **absent** : réputation |
| Exploiter Addresses | Interaction avec un exploiteur connu | **absent** |
| Tornado Cash Funded Account Interaction | Compte financé par Tornado qui interagit avec l'adresse surveillée | **absent** : source de financement |
| Suspicious Contract Creation | Création de contrat suspecte, d'abord depuis des comptes financés par Tornado | **absent** |
| Unverified Contract Creation | Contrat créé et non vérifié sur Etherscan dans les 30 min | **absent** |
| Ice Phishing Detection / Evidence of Phishing Agent | Beaucoup d'EOA qui appellent `approve()` / `increaseAllowance()` vers la même cible | **absent** : approbations |
| Flashbots Detection | Transaction envoyée en contournant le mempool public | **absent** (utile surtout pour exploits) |
| Flashloan Detection | Flash loan avec gros profit | prévention contrat |
| Reentrancy Calls Detection | Réentrance dans la pile d'appels | prévention contrat |
| Token Impersonation | Jeton déployé avec le même symbole qu'un existant | hors menace |
| Successful txn (échecs internes) | Transaction réussie avec appels internes échoués | sonde / attaque |
| Stablecoin Interaction with DeFi Protocols | Transferts de stablecoins vers Balancer, 1inch, Uniswap, etc. | composition (D4) |
| USDT/USDC Blocklist Events Monitor | Événements de liste noire des émetteurs (via Monitor Events) | réputation |
| Attack Detector Feed / Scam Detector Feed (combineurs d'alertes) | Combine les alertes passées sous une adresse commune pour une alerte à haute précision | **notre règle "deux familles" (L3)** : même idée |

Un tableau Notion "Bot gaps" de Forta existe (https://forta.notion.site/Bot-gaps-a52ede8a366f45cdacb03aed91253bcf) mais n'a pas pu être lu (page vide au fetch).

#### OpenZeppelin Monitor (open source, AGPL-3.0) [P][V]
Source : https://docs.openzeppelin.com/monitor (lue). Conditions de filtrage : **fonctions** (par signature), **événements** (par signature), **transactions** (statut, valeur, expéditeur, `gas_price`, `nonce`, `input`, `gas_used`…) ; expressions `> >= < <= == !=`, `AND`/`OR`, `starts_with`, `ends_with`, `contains`. Exemple documenté : "Large Token Transfers" (événement `Transfer(address,address,uint256)` avec `value > 1000000000`) et sélecteur `input starts_with '0xa9059cbb'`. `trigger_conditions` : scripts de filtre (si dépassement du `timeout_ms`, la correspondance est incluse par défaut). **Pas de modèles de détection livrés** dans la doc lue : c'est un moteur de règles sans catalogue. Defender est arrêté depuis le 1er juil. 2026 (https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender [P][V]).

#### Tenderly Alerts [P][V]
Source : https://docs.tenderly.co/alerts/intro-to-alerts. 12 déclencheurs : transaction réussie ; échouée ; appel de fonction ; événement émis ; paramètre d'événement ; transfert ERC-20 ; **appelant hors liste d'autorisation** ; appelant en liste de blocage ; **changement de solde natif** ; **valeur de transaction** ; changement d'état d'une variable numérique ; changement de retour d'une fonction `view`. Utile : "appelant hors liste d'autorisation" = notre voie lente/rapide vue de l'extérieur ; "changement d'état" = lecture de `minDelay` ou `threshold`.

#### Hypernative [P partiel][V]
Pages lues : https://www.hypernative.io/products/onchain-monitoring · https://www.hypernative.io/blog/dora-doesnt-ask-whether-you-had-a-security-incident-it-asks-whether-you-knew-in-time. Catégories **publiées** : sécurité (exploits de contrats, ponts, zero-day, flash loans, compromission de frontend, **vol de clé privée**, signaux = contrats, transactions, mempool) ; risque financier (dépeg, oracles, santé des collatéraux, seuils de liquidation) ; fraude (infrastructure de phishing, contrats frauduleux, **address poisoning**, frontends clonés, jetons d'imitation, repérés dans les minutes qui suivent le déploiement) ; conformité (interaction avec adresses sanctionnées ou restreintes, pistes d'audit exportables) ; gouvernance (propositions). Produit "Screening & Intelligence" : réputation et exposition d'adresse. "Transaction Guard" : simulation, attribution des signaux de risque, vérification d'intention. **Non publié** (donc inconnu, pas absent) : contrôle d'accès et source de financement ne figurent pas comme catégories sur ces pages. Le chiffre "200-300+ types de risque" vient d'un comparateur tiers [S] https://cybersectools.com/compare/hypernative-hypernative-platform-vs-serverlessstack-elastic-machine-learning : ne pas le citer. Affirmation de l'éditeur sur Bybit : son Guardian "aurait détecté" l'écart entre la transaction affichée et l'action réelle (changement de logique du multisig) en inspectant la transaction avec un Safe Guard ; **contrefactuel, non vérifié indépendamment** [S] https://www.hypernative.io/blog/bybits-1-5b-hack-a-wake-up-call-for-crypto-security.

#### Chainalysis Hexagate [P][V]
Source : https://www.chainalysis.com/blog/hexagate-by-chainalysis-now-live-on-avalanche/. Catégories : exploits et piratages, risques de gouvernance, risques financiers, risques d'exécution, flux de jetons suspects, schémas suspects par ML ; **5 moniteurs personnalisés** (non nommés). Ni contrôle d'accès, ni gros transferts, ni financement ne sont cités sur la page. Docs détaillées derrière login.

#### Blockaid [P (communiqué)][S (docs)]
Communiqué du 13 mai 2026 (https://tools.prnewswire.com/en-us/live/20813/release/20260513EN58813 [V]) : **Risk Screening API** (flux entrants, verdicts structurés, catégories d'exposition, montants USD, sévérité) ; **Cosigner Policy Engine** (évalue l'exposition de chaque adresse destinataire d'une transaction, rejette automatiquement même après approbation multisig si le seuil d'exposition est dépassé) ; **DeFi Toxicity Monitors** (alertes si l'exposition évolue sans action de l'institution). Catégories d'exposition : fonds volés, entités sanctionnées, fraude, arnaques, infrastructure de phishing, mixeurs, blanchiment. Méthodes : simulation, détection d'exploit, renseignement sur arnaques, analyse comportementale. Les "hops" ne sont pas mentionnés. Via l'intégration Portal : `scanEVMTx`, `scanAddress` (contrats malveillants, portefeuilles compromis, adresses sanctionnées) [S] https://docs.portalhq.io/sdks/web/guide/blockaid. **Le Cosigner Policy Engine est le plus proche de ce que nous faisons (arrêter une sortie après approbation)** mais porte sur l'exposition d'adresse, pas sur le cumul ni l'écart backend.

#### Safe (Safe Shield, Guards, événements) [P][S]
- Événements du contrat Safe (v1.4.1) : `AddedOwner`, `RemovedOwner`, `ChangedThreshold`, `ChangedGuard`, `ChangedModuleGuard`, `ExecutionFromModuleSuccess/Failure` [S] https://docs.safe.global/reference-smart-account/events/RemovedOwner (résultat de recherche ; `EnabledModule`, `DisabledModule`, `ChangedFallbackHandler` : existent, **non confirmés** dans cette session [ÀV]).
- **Safe Shield Copilot** : analyse avant transaction ; premières interactions vs récurrentes ; présence dans le carnet d'adresses ; contrats vérifiés ou non (Etherscan, Sourcify, Blockscout) ; destination à historique très limité ; avertissement sur changements de mastercopy ou de module ; niveaux Accept / Warn / Deny ; s'appuie sur Tenderly (simulation) et Blockaid (scan) [S] https://help.safe.global/en/articles/461021-understanding-safe-shield-copilot (résultat de recherche ; la page a renvoyé 404 au fetch). Garde Hypernative en option.
- **Avertissement "unexpected delegate call"** : déclenché quand la transaction vise un contrat inconnu du Safe et peut modifier l'implémentation, les propriétaires ou le seuil [S] https://help.safe.global/articles/4308960633-why-do-i-see-an-unexpected-delegate-call-warning-in-my-transaction.
- **Guardrail (Safe Research, août 2025)** : Guard qui n'autorise `DELEGATECALL` que vers une liste blanche, ajouts retardés, retraits immédiats [S] https://safe.global/blog/safe-research-guardrail-locking-down-delegate-calls. **Même principe d'asymétrie que notre §6** (réduire immédiat, étendre retardé) : à citer comme précédent. Le "Guardrail" de la demande n'a pas été retrouvé comme éditeur distinct [ÀV].
- Doc des Guards : https://docs.safe.global/advanced/smart-account-guards [P][V] : vérification avant et après exécution ; un Guard défaillant peut bloquer le Safe.

#### Cyvers [S]
Pare-feu pré-transaction (simulation, address poisoning, signatures `permit` non autorisées), API qui bloque ou avertit pour les adresses malveillantes connues, *Secure Co-Signer* (contrôles de politique avant finalisation de la signature, intégrations Fireblocks et Safe) ; détection d'une hausse d'address poisoning (1,2 M$ envoyés à des adresses d'escrocs depuis début mars 2025). Revendications "99,9 % de précision, < 100 ms" : **vendeur, non vérifiées**. Sources : https://www.productcool.com/product/cyvers-2 · https://forklog.com/en/crypto-address-poisoning-nets-hackers-1-2-million-in-three-weeks/. Pas de règles de drain publiées.

#### CertiK Skynet / SkyInsights [S]
Skynet : alertes avancées avec seuil de risque sur contrats déployés. SkyInsights : étiquettes d'adresses (revendiquées : 300 M+, 12 catégories et 66 sous-catégories), score de risque, sanctions, listes noires, surveillance 24/7 de transactions, base de risque rafraîchie en moins de 10 min [S] https://certik.com/products/skyinsights · https://certik.com/resources/blog/doubling-down-on-security-skynet-insight-and-active-monitor. Aucune règle de "gros transfert" confirmée.

#### Range [P][V]
Source : https://docs.range.org/llms.txt (22 points d'accès). **Address Risk Score** (proximité réseau, ML, comportement) ; **Sanctions and Blacklist Check** (OFAC, UK, UE, **listes noires d'émetteurs de stablecoins**) ; Payment Risk Assessment (règles heuristiques et ML) ; Risk v2 : score avec **signaux contributeurs** et "behaviours" configurables (poids, seuils, sévérités par défaut) ; **Scan an Unsigned Transaction** (simulation, risque des contreparties, **vérifications d'address poisoning**) ; événements d'alerte avec décodage des propositions Squads ; simulateur EVM (inclut `execTransaction` de Safe). Surtout Solana : la couverture EVM/Avalanche n'est pas établie [ÀV].

#### Webacy [S]
Score de risque de portefeuille : âge du portefeuille, activité, interactions avec contrats, **approbations de jetons**, actifs détenus, risque hérité des contreparties fréquentes, listes publiques restreintes ; score par transaction (compte principal, contrepartie, actif) ; "centaines de signaux propriétaires". Détection mensuelle d'address poisoning (sept. 2025 : 32 290 événements, 6 516 victimes uniques, 91 % sur Ethereum). Sources : https://docs.webacy.com/product-guides/risk-score (via résultats de recherche) · https://world.webacy.com/from-the-ctos-desk-september-2025.

#### Venn / Ironblocks [S]
RPC protégé qui intercepte les transactions et les soumet à des opérateurs qui vérifient avant exécution (100-200 ms revendiqués, **vendeur**) ; pare-feu modulaire côté contrat. Aucune règle publique trouvée. Statut 2026 inconnu (voir état de l'art) : https://malaysia.news.yahoo.com/ironblocks-venn-network-aims-keep-141807474.html.

### 1.2 Custodians : moteurs de politique de signature

#### Fireblocks [P][V]
Source : https://developers.fireblocks.com/reference/configure-transaction-authorization-policy et https://www.fireblocks.com/platforms/governance-and-policy-engine/. Champs d'une règle : `type`/`transactionType` (TRANSFER, CONTRACT_CALL, APPROVE, MINT, BURN, STAKE, RAW, TYPED_MESSAGE) ; `src` / `dst` (VAULT, EXCHANGE, UNMANAGED, NETWORK_CONNECTION…) ; `asset` ; `amount` avec `amountCurrency` (USD, EURO, NATIVE) ; **`amountScope` SINGLE_TX ou TIMEFRAME avec `periodSec`** (cumul sur une période) ; `operators` (initiateurs) ; `action` ALLOW, BLOCK ou **2-TIER** (approbation multiple). Règles évaluées dans l'ordre (les plus restrictives d'abord). Politique de connexion dApp, plafonds d'allowance de jetons, screening via partenaires de conformité (qui "peut signaler ou geler" des transactions vers des adresses à risque). Changement de politique : quorum d'administrateurs, exécution en enclave SGX [S]. **Pas de détection d'anomalie comportementale décrite** ; Security Posture Management surveille la configuration, pas les transactions. Conséquence pour nous : **le cumul par période avec destinataires non gérés est déjà un standard de politique côté custodian** ; ce qui manque est la détection *indépendante du circuit d'approbation détourné*.

#### BitGo [P][V]
Source : https://developers.bitgo.com/docs/policies-overview.md. Types : destination, initiateur, **pourcentage du solde du portefeuille**, seuil par transaction, **limite de vélocité** (total retiré sur une fenêtre), webhook. Actions : seconde approbation, approbation ou refus automatique. Portée : seulement les transactions passant par BitGo (les transactions de récupération avec clés utilisateur et de secours contournent les politiques). Liste blanche verrouillée 48 h après sa définition et vérification de la vidéo pour les portefeuilles de garde, alertes de vélocité non bloquantes suggérées pour les portefeuilles opérationnels [S] https://scout.bitgo.com/api-tokens/denied-evaluation-apiresponseerror-provide.

Anchorage et Coinbase Prime : aucune règle publiée retrouvée.

### 1.3 Réputation d'adresse, exposition, sanctions

| Source | Ce qu'on peut en tirer | Statut |
|---|---|---|
| Oracle de sanctions Chainalysis (`isSanctioned(address)`), adresse `0x40C57923924B5c5c5455c48D93317139ADDaC8fb` sur Ethereum, Polygon, BNB, **Avalanche**, Optimism, Arbitrum, Fantom, Celo, Blast | Contrôle gratuit on-chain | **Déprécié : "plus supporté ni maintenu", dernière mise à jour 18 mars 2026, non recommandé pour de nouvelles intégrations** [P][V] https://go.chainalysis.com/chainalysis-oracle-docs.html. Présence sur le testnet Fuji non établie [ÀV] |
| Tornado Cash | Retiré de la liste SDN de l'OFAC le 21 mars 2025 après l'arrêt de la 5e cour d'appel du 26 nov. 2024 (Van Loon) ; le nombre d'adresses retirées diffère selon les sources [S] https://thedefiant.io/news/regulation/u-s-treasury-lifts-sanctions-on-tornado-cash-cryptocurrency-mixer-3bb07641 · Federal Register 2025-05096 | **Ne pas utiliser "figure à l'OFAC" comme équivalent de "mixeur"** : deux signaux distincts |
| Etherscan labels (slugs `exchange`, `bridge`, `phish-hack`, `ofac-sanctioned`, `exploit`, `heist`) | Étiquettes publiques ; export complet via endpoint payant (Get Label Master List, niveau Enterprise) [S] https://docs.etherscan.io/api-reference/endpoint/getlabelmasterlist-v2.md | Pas d'export en masse gratuit confirmé. Etherscan V2 liste Fuji (chaîne 43113) mais la disponibilité des étiquettes sur Fuji n'est pas confirmée [S] https://docs.etherscan.io/etherscan-v2/supported-chains |
| Forta labelled-datasets (MIT) | CSV d'adresses Ethereum mainnet étiquetées `exploit`, `heist`, `phish-hack` (+ Optimism) | [P][V] https://github.com/forta-network/labelled-datasets : **mainnet seulement, pas Avalanche** |
| SEAL 911 / Safe Harbor | Canal et cadre juridique ; **aucune liste publique d'exploiteurs retrouvée** | [P] https://frameworks.securityalliance.org/safe-harbor/overview |
| TRM, Elliptic | Scores de portefeuille 0-10 (exposition directe et indirecte, confiance de typologie, proximité de sanctions, historique de ponts) ; détection d'exposition aux mixeurs sur plusieurs sauts | **[S-faible]** (pages corpus Elliptic) ; l'article TRM sur Bybit est [P][V] mais décrit des comportements, pas des règles |
| Phalcon Compliance (BlockSec) | 17 indicateurs de risque, dont "Mixing" sur plusieurs sauts | [S] résultat de recherche ; la page n'a pas pu être lue |

---

## 2. Littérature 2023-2026

| Travail | Apport pour nous | Chiffres (tels que lus) | Statut |
|---|---|---|---|
| **Tsuchiya et al., "Blockchain Address Poisoning"**, USENIX Security 2025 (arXiv 2501.16681) | Détecteur d'address poisoning : paires destinataire / contrepartie récente avec **au moins 3 caractères hexadécimaux initiaux et 4 finaux identiques** ; types : transfert minuscule (> 0 et < 10 USD), transfert de valeur zéro (via `transferFrom` par un tiers), jeton contrefait ; fenêtre de 20 min (100 blocs ETH) | 270 M tentatives, 17 M victimes, 6 633 réussites, 83,8 M$ (juil. 2022 - juin 2024) ; sur un jeu externe : précision 100 %, rappel 97,2 % | [P][V] https://arxiv.org/html/2501.16681v3 |
| Guan et Li, Poison-Hunter (2024) | Autre détecteur Ethereum ; 98 % des adresses de phishing contrôlées par 4 entités | jusqu'à 144 M$ de pertes potentielles | [S] https://researchwith.stevens.edu/en/publications/characterizing-ethereum-address-poisoning-attack/ |
| **Skyeye** (ASE 2024), **BlockWatchdog** (ICSE 2024, arXiv 2403.19112), **LookAhead** (arXiv 2401.07261) | Détection de contrats adverses **avant** l'attaque (déploiement, bytecode) : famille "préparation" | LookAhead : F1 0,8966, FPR 0,16 % ; BlockWatchdog : ~17,66 s avant l'attaque dans un cas | [S] voir `T1_P4_etat_de_l_art.md` §3 |
| **GenDetect** (arXiv 2604.26094) | > 69 % des attaques DeFi ressemblent à un incident antérieur : justifie le rejeu | | [S] voir état de l'art |
| HOUSTON (NDSS), DeFiTail, DeFiScope, ML dans le contrat (arXiv 2510.16024) | Détection d'exécution anormale, d'exploits, de manipulation de prix | | [S] hors sorties de fonds par clé |
| Cristodaro, Kraner, Tessone 2025 (arXiv 2510.09433) ; Tutela (arXiv 2201.06811) | Heuristiques de liaison Tornado Cash : réutilisation d'adresse, liens directs, **appariement temporel premier entré premier sorti**, prix du gaz unique | Adresse + lien direct : 5,1-12,6 % des retraits ; avec FIFO : +15-22 points ; Tutela : prix du gaz unique rare (102 cas sur ~97 k dépôts) | [S] résultats de recherche. Utile pour *tracer* après coup, pas pour détecter la sortie |
| Détection de phishing par GNN (PDGNN arXiv 2204.08194, TSGN arXiv 2104.08767, R-NTN PeerJ cs-3445) | Classement d'un compte comme phishing ; difficultés : peu d'étiquettes, déséquilibre extrême | | [S] non adapté à 36 h, entraînement lourd |
| Sybil / airdrop (arXiv 2505.09313) ; Allium | **Première réception de gaz** comme caractéristique forte ; regroupement par financeur commun ; regroupement temporel | | [S] source du signal "source de financement du gaz" |
| Mesures sur les drainers (Scam Sniffer 2024 et 2025) | `Permit` = 56,7 % des grosses pertes 2024, `setOwner` 31,9 % ; 2025 : 83,85 M$ sur ~106 000 victimes, plus gros vol 6,5 M$ par `Permit` ; signatures malveillantes EIP-7702 apparues après Pectra | | [S] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ |

**Ce que je n'ai PAS trouvé** (à dire tel quel) : aucune publication académique 2023-2026 dédiée à la **détection de drain de hot wallet / anomalie sur les sorties d'un exchange** (deux recherches distinctes) ni à la **détection automatique de propositions multisig malveillantes** ; seulement des analyses d'incidents et des billets d'éditeurs. Le cas CoinEx (12 sept. 2023) est cité par la presse : le système de risque de l'exchange a signalé des retraits anormaux de plusieurs hot wallets vers une adresse sans historique [S] https://cointelegraph.com/news/coinex-crypto-exchange-suspected-hacked-crypto-moved. Un billet d'éditeur sur les compromissions de signature de hot wallet recommande de tester que les alertes se déclenchent sur "portefeuille vidé à zéro", "rafale de transferts" et "destinataires inhabituels" [S] https://nhimg.org/articles/hot-wallet-signing-compromise-is-the-real-risk-in-cex-breaches/ : ces trois signaux recoupent D1/D2 et le signal "vidé à zéro" qui nous manque.

### 2.1 Cas réels récents : ce qui était observable on-chain

| Incident | Signaux on-chain observables (lus) | Source |
|---|---|---|
| **Bybit, 21 févr. 2025** (~1,4-1,5 Md$) | `execTransaction` du Safe avec `operation = 1` (`delegatecall`) vers un contrat non vérifié créé 3 jours avant ; remplacement de l'implémentation (slot 0, `masterCopy`) ; contrat de remplacement avec fonctions `sweepETH` / `sweepERC20` ; données décodées différentes du schéma habituel ; puis balayage | [S] https://www.cyfrin.io/blog/safe-wallet-hack-bybit-exploit · https://dfns.co/article/the-bybit-safe-hack · https://www.hextrust.com/resources-collection/the-bybit-crypto-hack---an-analysis-by-hex-trust ; mécanisme confirmé par BlockSec [S] https://blocksec.com/blog/bybit-1-5-b-hack-in-depth-analysis-of-the-malicious-safe-wallet-upgrade-attack |
| **Drift (Solana), 1er avr. 2026** (285,3 M$ selon BlockSec) | Retrait de 10 ETH de Tornado Cash (11 mars) pour déployer un jeton ; wash trading ; comptes à nonce durable créés (23 et 30 mars) ; **changement de l'ensemble de signataires** ; `UpdateAdmin` exécuté avec **timelock nul** ; nouveau collatéral à faible liquidité avec **oracle remplacé** ; **protections de retrait relâchées** ; 31 retraits en ~12 min ; attaque lancée une minute après un test de retrait légitime | [P][V] https://blocksec.com/blog/drift-protocol-incident-multisig-governance-compromise-via-durable-nonce-exploitation (la section "signaux détectables" est une inférence du fetch, pas de l'éditeur) |
| **CoinEx, sept. 2023** | Retraits anormaux de plusieurs hot wallets vers une adresse sans historique | [S] cointelegraph, ci-dessus |
| **Safe modules, mai 2026** (3,2 M$ sur 86 Safe) | Drain via module tiers (Ethereum et Base) | [S] https://invezz.com/au/news/2026/05/25/heres-how-attackers-drained-dollar32m-from-safe-wallets-on-ethereum-and-base/ (agrégateur : à vérifier) |

---

## 3. Le scénario de blanchiment après vol (patron DPRK) : ce qu'il nous apprend

Principale source : Chainalysis, https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/ **[P][V]** (lue en entier le 2026-10-10). Complément TRM sur Bybit : https://www.trmlabs.com/post/bybit-hack-update-north-korea-moves-to-next-stage-of-laundering **[P][V]**.

- **Cycle d'environ 45 jours** après un gros vol DPRK, certains fonds restant dormants des mois. **Un peu plus de 60 % du volume DPRK passe par des transferts sous 500 000 $** (les autres acteurs envoient plus de 60 % en tranches de 1 à 10 M$ et plus) : le **fractionnement sous un seuil** est la signature.
- **Vague 1 (jours 0-5)** : protocoles DeFi (+370 %) et mixeurs (+135-150 %). **Vague 2 (jours 6-10)** : échanges à KYC limité (+37 %), échanges centralisés (+32 %), mixeurs de second rang (+76 %), ponts (+141 % pour XMRt). **Vague 3 (jours 20-45)** : échanges sans KYC (+82 %), services de garantie comme Tudou Danbao (+87 %), échanges instantanés (+61 %), Huione (+45 %), réseaux de blanchiment sinophones (+33 %), Grinex (+39 %). Préférences DPRK par rapport aux autres : services sinophones (+355 % à +1000 %), Huione (+356 %), mixeurs (+100 %), ponts (+97 %) ; **évite** prêts DeFi (-80 %), échanges sans KYC (-75 %), P2P (-64 %), DEX (-42 %).
- **Bybit en détail** : fonds éclatés en 50 portefeuilles d'environ 10 000 ETH dans les heures qui suivent (Elliptic, relayé par la presse [S] https://www.elliptic.co/blog/bybit-hack-largest-in-history) ; conversion rapide des jetons en ETH par DEX (pour éviter un gel) ; ETH vers BTC surtout par THORChain (72 % selon Arkham, ~361 000 ETH [S] https://www.theblock.co/post/343855/bybit-hackers-half-the-stolen-eth-bitcoin-fbi-confirms-lazarus) ; eXch (16 %), portefeuille Web3 d'OKX (8 %) ; ≥ 160 M$ par canaux illicites en 48 h et > 400 M$ au 26 févr. (TRM [P][V]) ; mixeurs Wasabi et CryptoMixer pour le BTC (TRM [P][V]) ; cadence de 2 à 3 transferts par minute avec une pause de 15 min toutes les 45 min (Arkham, [S] https://info.arkm.com/research/lazarus-bridged-1-3b-of-bybit-eth-to-bitcoin) ; technique "flood the zone" (TRM) ; gros soldes BTC inactifs.
- **Ce que ça change pour Hold up** : (1) le fractionnement en montants égaux ou sous un seuil est un **signal de la phase de sortie**, pas seulement du blanchiment ; (2) le premier saut est vers de nouvelles adresses (notre D1) puis conversion/pont : la **destination "pont ou DEX connu"** est un signal à part entière ; (3) ces données servent surtout à **L3 → dossier de gel** (P2 traceur) : une règle "part déjà passée par pont/mixeur" règle la question de gelabilité. Chainalysis note aussi les angles morts : transferts de clés privées et ventes OTC crypto contre fiat ne sont pas visibles on-chain [P][V].
- **Pas de "peel chain" Chainalysis** retrouvé : la définition (envoi du gros du solde vers une adresse neuve + petit retrait latéral, répété) vient d'Elliptic corpus [S-faible] et vaut surtout pour l'UTXO ; sur compte EVM elle s'approxime par des sauts successifs et des retraits partiels répétés. À présenter comme un motif, pas comme un détecteur Chainalysis.

---

## 4. Taxonomie complète des signaux

Colonnes : **Définition opérationnelle** (calcul et données on-chain) · **Qui l'utilise** · **Valeur** (contre notre menace : H, M, F) · **FP** (coût de faux positif, estimation qualitative, non mesurée) · **Fuji** (✓ faisable avec `eth_getLogs`/`eth_getBalance`/`eth_getCode`/`eth_getTransactionCount` ; ~ partiel ou à tester ; ✗ non faisable sur testnet) · **Liste** (position par rapport à (a)-(e) : **couvert**, **extension**, **MANQUE**).
Les ID S-xx servent de références dans `docs/` et le banc. "Données CASP" = fournies par le back-office, hors chaîne.

### Famille A : destinataire (qui reçoit)

| ID | Définition opérationnelle | Qui l'utilise | Valeur | FP | Fuji | Liste |
|---|---|---|---|---|---|---|
| S-A1 | Destinataire jamais "connu" : somme des sorties vers adresses non connues / solde au début de fenêtre. Connu = valeur cumulée minimale + ancienneté > N blocs | Forta (Large Balance Decreases, sans la nouveauté) ; Safe Shield ("première interaction") ; Blockaid Cosigner (exposition, autre critère) | H | M : retraits clients légitimes ; seul le profil trésorerie le supporte | ✓ logs `Transfer` + `eth_getBalance` | **couvert (a), D1** |
| S-A2 | **Âge du destinataire** : bloc de première apparition (premier nonce > 0 ou premier solde) via archive ou index maison ; "neuve" si âge < N blocs au moment de la sortie | Webacy (âge du portefeuille) ; GetBlock ; Safe Copilot ("historique très limité") | H | F à M | ~ besoin d'archive (`eth_getTransactionCount` à un bloc passé) ou d'un index ; l'index maison remplace | **MANQUE** (étend (a)) |
| S-A3 | **Nature du destinataire** : EOA ou contrat (`eth_getCode`), contrat vérifié ou non (Sourcify/explorateur), contrat récent (âge du bytecode) | Forta (Unverified Contract Creation, Suspicious Contract Creation) ; Safe Copilot ; Bybit : contrat non vérifié de 3 jours | H | F : un coffre légitime peut viser un contrat | ✓ `eth_getCode` ; ~ vérification (Sourcify sur Fuji non confirmé) | **MANQUE** |
| S-A4 | **Étiquette de réputation** du destinataire : exploiteur, phishing/hack, sanctionné, mixeur, pont, échange. Union d'un annuaire de listes | Forta (Exploiter Addresses, Chainalysis Sanctioned), Hypernative, Blockaid, Range, CertiK, Etherscan labels | H sur mainnet, F sur Fuji (pas de menace réelle) | F si liste propre | ✗ réel ; ✓ avec **annuaire synthétique** `synthetic:true` | **MANQUE** (réputation) |
| S-A5 | **Source de financement du gaz du destinataire** : premier transfert entrant d'un compte ; financé par mixeur, par un exploiteur, ou par le même financeur que d'autres destinataires | Forta (Tornado Cash Funded Account Interaction, Suspicious Contract Creation) ; arXiv 2505.09313 (première réception de gaz) | H (c'est la chaîne d'approvisionnement de l'attaquant) | M : un échange ou un relais de gaz crée de faux regroupements | ~ requiert un index ou un explorateur ; simulable sur nos adresses de test | **MANQUE** |
| S-A6 | **Exposition indirecte** : distance en sauts jusqu'à une adresse étiquetée, part des fonds issue de sources à risque | TRM, Elliptic, Blockaid Risk Exposure, Range (proximité), Webacy (risque hérité) | M | M à H selon profondeur | ✗ (nécessite l'historique multi-sauts et des étiquettes réelles) | **MANQUE** (feuille de route) |
| S-A7 | **Regroupement de destinataires neufs** : N destinataires reçoivent des montants proches/égaux en une fenêtre, financés par le même parent ; on les agrège dans un seul seau | Allium, arXiv 2505.09313 ; notre D1 (agrégation sans graphe) | H | F | ~ index de premier financement | **extension de D1** (D1 agrège sans lier) |
| S-A8 | **Violation de liste blanche / liste d'autorisation** : destinataire absent de la liste blanche déclarée | Tenderly (appelant hors allowlist) ; Fireblocks (dst UNMANAGED) ; BitGo (destination) ; notre voie rapide | H | F si la liste est tenue | ✓ | partiel (notre voie rapide, pas un détecteur) |
| S-A9 | **Adresse "sosie"** (address poisoning) : destinataire dont les 3 premiers et 4 derniers caractères sont ceux d'un destinataire habituel | Tsuchiya et al. ; Range (scan) ; Cyvers ; Hypernative ; Webacy | M (cible le geste humain, pas le circuit détourné ; mais un opérateur de trésorerie copie des adresses) | F | ✓ comparaison de chaînes | **MANQUE** |
| S-A10 | **Couple inédit** : paire (expéditeur surveillé, destinataire) jamais vue, même si le destinataire existe ailleurs | Safe Copilot (première vs récurrente) | M | M | ✓ | **extension** : "connue" mondialement vs pour nous |

### Famille B : volume, vélocité, cadence

| ID | Définition opérationnelle | Qui l'utilise | Valeur | FP | Fuji | Liste |
|---|---|---|---|---|---|---|
| S-B1 | Sorties cumulées sur fenêtres emboîtées (10, 100, 1 000 blocs, 24 h) / solde de début et historique | Fireblocks (`TIMEFRAME` + `periodSec`) ; BitGo (vélocité) ; Forta (Time Series Analyzer) ; Hypernative (non documenté) | H | M : pics de retraits en marché agité | ✓ | **couvert (b), D2** |
| S-B2 | **Part du solde par transaction** : `valeur / solde_avant` | BitGo (pourcentage du solde) | H | F à M | ✓ | **MANQUE** (extension de (b)) |
| S-B3 | **Vidé à zéro / solde résiduel** : solde final / solde initial sur la fenêtre, ou sortie d'un actif jusqu'à 0 | Forta (Asset Drained), nhimg (test "drained-to-zero") | H | F | ✓ | **MANQUE** |
| S-B4 | **Rafale** : nombre de sorties par minute / par 10 blocs vs historique ; régularité de la cadence (écart-type des intervalles) ; motif périodique (ex. pause de 15 min toutes les 45 min) | Arkham (observation Bybit) ; nhimg ("burst transfer windows") ; Elliptic ("hausse brutale") [S-faible] | M à H | M | ✓ | **MANQUE** (extension de (b)) |
| S-B5 | **Fractionnement / structuration** : montants égaux ou groupés juste sous un seuil (par ex. < plafond de voie rapide, < 500 k$) ; N sorties de montant identique | Chainalysis (60 % du volume DPRK sous 500 k$) ; Bybit : 50 × ~10 000 ETH | H contre l'adaptatif, M sinon | F | ✓ | **MANQUE** |
| S-B6 | **Anomalie statistique multivariée** : Isolation Forest ou z-score robuste sur (montant, destinataire, heure, actif) | Forta (Anomalous Token Transfers ML) ; Hypernative, Hexagate (ML, non détaillé) | M | M à H : sans étiquettes, calibrage difficile | ✓ mais données de calibrage faibles sur Fuji | **MANQUE** (hors déterministe : à éviter dans la boucle de réponse) |
| S-B7 | **Sortie nette hors usage habituel d'heure/jour** : sorties la nuit ou le week-end vs profil | Fireblocks (fenêtres de temps dans les règles) | M | M : opérations internationales | ✓ | **MANQUE** (contexte (e) partiel) |
| S-B8 | **Composition** : actif rarement sorti, conversions en masse (ex. jeton en ETH avant gel, tel que décrit pour Bybit) | Forta (Stablecoin Interaction with DeFi) ; TRM ; notre D4 | M | M | ✓ logs `Transfer` + swaps | **bonus D4 (P3)** |
| S-B9 | **Pic d'échecs / sondage** : hausse des transactions échouées ou des appels internes échoués autour du compte | Forta (Anomalous Transaction Volume ; Successful txn with failed internals) ; Tenderly (Failed Transaction) | F à M (indice de reconnaissance) | M | ✓ statut des reçus | **MANQUE** |

### Famille C : cohérence et réconciliation (c)

| ID | Définition opérationnelle | Qui l'utilise | Valeur | FP | Fuji | Liste |
|---|---|---|---|---|---|---|
| S-C1 | **Écart annoncé vs chaîne** : Σ (sorties déclarées par le back-office / ordre approuvé) − Σ (sorties observées on-chain) sur une fenêtre ; toute sortie chaîne sans ordre correspondant = signal | **Aucun éditeur public retrouvé.** Analogues : Forta Bridge Balance Difference ; preuves de réserve ; Fireblocks (le moteur de politique *est* le circuit) | **H** : c'est le détecteur robuste au circuit détourné, car il compare deux sources indépendantes | M : latence de rapprochement, lots, frais | ✓ (flux "annoncé" = fixture ou API CASP) | **couvert (c)** (mais sous forme de D3, voir S-C2) |
| S-C2 | **Delta de solde non expliqué** : `Δsolde − Σ événements connus du ledger` ; capte `delegatecall`, fonction admin, transfert natif interne sans événement | Forta (Large Balance Decreases) ; Tenderly (Balance Change) | H | F | ✓ `eth_getBalance` par bloc ; ✗ les transferts natifs internes sont invisibles dans les logs, d'où l'intérêt du delta | **couvert, D3** |
| S-C3 | **Sorties via `transferFrom` d'un tiers** : événements `Transfer` dont `from` = adresse surveillée mais dont l'expéditeur de la transaction est un autre compte (allowance utilisée) | Forta (Ice Phishing) ; Elliptic [S-faible] ("approve/permit immédiatement avant transfert") | H : un drain par allowance n'a **pas de transaction sortante du portefeuille** | F | ✓ logs, pas de trace | **MANQUE**, à vérifier que le ledger indexe `from` et non `tx.from` |
| S-C4 | **Séparation interne / externe** : classer un transfert comme réaménagement interne (hot → froid, consolidations) ou sortie réelle | Elliptic (netflow, [S-faible]), Fireblocks (VAULT vs UNMANAGED) | H pour la **réduction des faux positifs** | | ✓ avec la liste d'adresses du client | **MANQUE** (FP majeur sur hot wallet) |
| S-C5 | **Offre contre réserve** (jeton enveloppé) | ReserveWatch, Safeguard Engine (Chainlink Convergence) ; Hexagate (dépeg) | M (cas KelpDAO-like) | F | ✓ | **bonus D6 (P3)** |
| S-C6 | **Écart de prix / oracle** : prix appliqué vs référence, fraîcheur | Forta (Smart Price Changes) ; Hypernative et Hexagate (oracles) ; Drift (oracle remplacé) | M | M | ~ Chainlink Fuji : adresse à confirmer | **P2 prévu** |

### Famille D : pouvoirs et contrôle (d)

| ID | Définition opérationnelle | Qui l'utilise | Valeur | FP | Fuji | Liste |
|---|---|---|---|---|---|---|
| S-D1 | **Rôles et propriété OpenZeppelin** : `RoleGranted`, `RoleRevoked`, `RoleAdminChanged`, `OwnershipTransferred` | Forta (oz-gnosis-events) ; Tenderly ; OZ Monitor | H | F | ✓ | **couvert, D7** |
| S-D2 | **Événements Safe** : `AddedOwner`, `RemovedOwner`, `ChangedThreshold`, `ChangedGuard`, `EnabledModule`/`DisabledModule` [ÀV], `ChangedFallbackHandler` [ÀV], `ExecutionFromModuleSuccess/Failure` | Forta (oz-gnosis-events) ; Safe Copilot ("mastercopy ou module") | H | F | ✓ si un Safe est déployé sur Fuji [ÀV] | **MANQUE** : D7 liste `Upgraded`, owner, mais pas ces événements Safe |
| S-D3 | **`delegatecall` depuis un Safe** : `execTransaction` avec `operation = 1` vers une cible hors liste | Safe ("unexpected delegate call") ; Guardrail (liste blanche) ; Hypernative Guardian (revendiqué) ; Bybit | **H** | M : `operation = 1` est légitime pour les lots MultiSend (connaissance générale, à vérifier) ; donc cible + vérification + âge, jamais seul | ✓ décodage du calldata de `execTransaction` | **MANQUE** |
| S-D4 | **Changement d'implémentation** : `Upgraded`, `AdminChanged`, `BeaconUpgraded` (ERC-1967) ; changement du slot de `masterCopy` | Safe Copilot ; Forta (OZ events) | H | F | ✓ | **couvert en partie (`Upgraded`)** |
| S-D5 | **Timelock** : `CallScheduled` (couvert), mais aussi **délai minimum** (`MinDelayChange` [ÀV]), délai nul, appel planifié avec court délai, annulations | Drift : `UpdateAdmin` avec délai nul ; OZ TimelockController | H | F | ✓ | **couvert (CallScheduled)**, **MANQUE** le changement de délai |
| S-D6 | **Relâchement des protections** : plafond relevé, limite de retrait désactivée, circuit breaker désarmé, garde supprimé (`ChangedGuard(0)`), liste blanche élargie | Drift ("protections de retrait relâchées") ; Fireblocks (changement de politique : quorum) | H | F | ✓ pour nos contrats (événements définis par nous) | **MANQUE** (hors événements de rôle) |
| S-D7 | **Signataires** : changement du jeu de clés (migration), nouveaux signataires récemment créés/financés, **signatures pré-collectées** (nonces durables sur Solana ; sur EVM transactions Safe signées d'avance) | Drift (nonces durables, [P][V] BlockSec) | M à H | M : migration planifiée | ✓ pour changements de propriétaires ; ✗ signatures pré-signées hors chaîne | **partiel** via S-D2 |
| S-D8 | **Approbations** : `Approval(owner, spender, value)` vers un **nouveau dépenseur**, `approve`/`increaseAllowance`/`permit`/`setApprovalForAll`, allowance illimitée | Forta (Ice Phishing, Evidence of Phishing Agent) ; Webacy ; Blockaid ; Range ; Fireblocks (type APPROVE) | H (porte d'entrée du S-C3) | M | ✓ logs `Approval` ; `permit` hors chaîne invisible tant qu'il n'est pas consommé | **MANQUE** |
| S-D9 | **Délégation EOA (EIP-7702)** : transaction de type `0x04` | Scam Sniffer (signatures EIP-7702 malveillantes 2025) | M | F | ✗ probablement : **ACP-209** (équivalent 7702 pour Avalanche) en "Proposed (Discussion)" [S] https://docs.avax.network/docs/acps/209-eip7702-style-account-abstraction ; non activé à ma connaissance [ÀV] | hors périmètre Fuji, à citer en limite |
| S-D10 | **Création de contrat** par un surveillé ou un signataire ; contrat non vérifié | Forta | M | M | ✓ `to == null` dans les transactions, ou événements du déployeur | **MANQUE** |
| S-D11 | **Nouveau collatéral / oracle** (protocoles de prêt) : actif à faible liquidité listé, oracle remplacé | Drift | M, hors cible (nous protégeons une trésorerie) | | ✓ pour nos contrats | hors périmètre |

### Famille E : renseignement et réputation (voir aussi A4-A6)

| ID | Définition opérationnelle | Qui l'utilise | Valeur | FP | Fuji | Liste |
|---|---|---|---|---|---|---|
| S-E1 | **Sanctions** : destinataire sur OFAC/UE/UN | Forta, Hypernative, Blockaid, Range, Fireblocks (partenaires), CertiK | M (n'attrape pas un voleur neuf) | F | ✗ pas de liste réelle utile sur testnet ; oracle déprécié | **MANQUE** (via annuaire synthétique) |
| S-E2 | **Listes noires d'émetteurs de stablecoins** (blocage USDT/USDC) | Range ; Forta (Blocklist Events Monitor) | M (post-vol : indique que le gel est déjà fait) | F | ✗ | **MANQUE** (utile pour le traceur) |
| S-E3 | **Exposition mixeur** direct/indirect | Blockaid, Range, TRM, Webacy, Phalcon (17 indicateurs) | M | M : après la délisting de Tornado, ne pas se fier à l'OFAC | ✗ réel ; ✓ synthétique | **MANQUE** |
| S-E4 | **Services de blanchiment** : pont ou DEX connu (THORChain, eXch…), échanges à KYC limité, services sinophones, Huione | Chainalysis (vagues) ; TRM ; Elliptic | M pour la destination finale, H pour le triage de gel | M | ✗ | feuille de route ; sert au traceur P2 |
| S-E5 | **Flux de renseignement externes** : alertes Attack Detector Feed, SEAL 911, bulletins CERT | Forta ; SEAL | M | | ~ | **(e) à préciser** |

### Famille F : comportement de blanchiment en aval (phase "Respond/trace")

| ID | Définition opérationnelle | Qui l'utilise | Valeur | FP | Fuji | Liste |
|---|---|---|---|---|---|---|
| S-F1 | **Éclatement** : une grosse somme redistribuée en N portefeuilles de montants égaux en peu de temps | Elliptic (Bybit : 50 × ~10 000 ETH) ; TRM | H | F | ✓ sur nos adresses | **MANQUE** (voir S-B5) |
| S-F2 | **Conversion immédiate** vers actif non gelable (jeton → ETH par DEX) | Elliptic (Bybit) | M | M | ✓ avec un `MockStablecoin` | D4 |
| S-F3 | **Pont dans les minutes qui suivent** (THORChain, pont Avalanche) | TRM, Arkham, Chainalysis | H pour L3 → gel | M | ~ `MockBridge` | traceur P2 |
| S-F4 | **Dépôt en mixeur dans les 5 premiers jours** | Chainalysis (vague 1) | M | | ✗ | hors durée de démo |
| S-F5 | **Sauts successifs / retraits partiels répétés** (pseudo "peel chain" EVM) | Elliptic [S-faible] | M | M à H : batching légitime | ✓ à petite échelle | traceur |
| S-F6 | **Soldes dormants** après conversion | TRM | F | | ✗ | non |

### Famille G : contexte de transaction avant signature (prévention, simulation)

| ID | Définition opérationnelle | Qui l'utilise | Valeur | FP | Fuji | Liste |
|---|---|---|---|---|---|---|
| S-G1 | **Simulation** : variation de soldes et d'approbations de la transaction non signée, comparée à l'intention déclarée | Blockaid, Tenderly, Cyvers, Range (`execTransaction` Safe inclus), Hypernative Transaction Guard | H en prévention | M | ✓ `eth_call`/`eth_estimateGas` (+ Tenderly Virtual TestNet) | **hors liste** : nous sommes après-coup ; à décrire comme limite |
| S-G2 | **Décodage de l'appel contre l'historique** (sélecteur, paramètres inhabituels) | Hex Trust sur Bybit ; Safe Copilot | M | M | ✓ | **MANQUE** |
| S-G3 | **Envoi par relais privé** (contournement du mempool public) | Forta Flashbots Detection | F pour nous | | ✗ (Avalanche n'a pas le même usage) | non |
| S-G4 | **Appels internes échoués dans une transaction réussie** | Forta | F | | ✗ sans trace | non |

### Famille H : contexte et corrélation (e)

| ID | Définition opérationnelle | Qui l'utilise | Valeur | FP | Fuji | Liste |
|---|---|---|---|---|---|---|
| S-H1 | **Calendrier d'opérations** : maintenance, rotation de signataires, tests de retrait, migration | Drift a été attaqué après un test légitime et une migration | **Risque** : un contexte qui *baisse* le score est contournable | | ✓ fichier signé | **(e)** : règle "contexte relève seulement, sauf calendrier signé en avance" |
| S-H2 | **Corrélation de familles** (≥ 2 familles indépendantes pour bloquer) | Forta Attack Detector Feed ; notre L3 | H contre la manipulation d'un seul signal | | ✓ | **couvert (échelle L3)** |
| S-H3 | **Contexte de marché** (dépeg, krach, pic de retraits clients) : explique un pic légitime | Hypernative, Hexagate (risques financiers) | M (surtout pour réduire des FP) | | ~ pas de marché réel sur Fuji | **(e)** |
| S-H4 | **Signaux hors chaîne** : connexions du back-office, tickets, changements de configuration | Fireblocks (Security Posture) ; MITRE T1657 AN1364 (SaaS) | M | | données CASP | **(e)** hors chaîne |
| S-H5 | **Santé du moniteur** : divergence entre RPC, retard de blocs, panne de la source de données | OZ Monitor (reprise, blocs manqués) ; Hexagate (incident de données, juin 2026 [S]) | H pour la fiabilité | | ✓ | déjà (divergence RPC L1) |

### Famille J : préparation de l'attaquant (avant la sortie)

| ID | Définition opérationnelle | Qui l'utilise | Valeur | FP | Fuji | Liste |
|---|---|---|---|---|---|---|
| S-J1 | **Déploiement d'un contrat adverse** qui référence le coffre (bytecode contient l'adresse ou un sélecteur) | Skyeye, BlockWatchdog, LookAhead | M à H | F | ✓ pour un coffre unique | idée en état de l'art §5 (leurre HoneyVault) |
| S-J2 | **Financement préalable** : fonds retirés d'un mixeur pour déployer l'outillage (Drift) | Forta | M | | ✗ réel | non |
| S-J3 | **Création d'objets de gouvernance** (nonces durables, propositions en attente) | Drift | M | | Solana-spécifique | non |

---

## 5. Ce qui manque à notre liste (a)-(e) : recommandations classées

Rappel du principe : "On adresse des problèmes RÉELS. Ne restreins pas le scope pour simplifier." Je classe par rapport entre **valeur contre la menace** et **coût de construction dans un `OutflowLedger` déjà prévu** (toutes les données viennent des mêmes logs et soldes). Ceci est une proposition d'analyse, pas une décision (le décideur du périmètre est Adem).

| Prio | Signal | Pourquoi | Détecteur existant à étendre |
|---|---|---|---|
| 1 | **S-C3 : indexer `Transfer(from = adresse surveillée)` quel que soit l'expéditeur de la transaction** | Sans cela, un drain par allowance est invisible (aucune transaction sortante), et D3 seul voit un delta sans cause | D3 / OutflowLedger |
| 2 | **S-D3 + S-D2 + S-D6** : `delegatecall`, événements Safe complets, relâchement de plafond/garde/timelock | Bybit et Drift sont exactement des changements de pouvoir "silencieux" ; D7 ne liste que 5 événements | D7 |
| 3 | **S-B2 + S-B3** : part du solde par transaction et "vidé à zéro" | Gratuit à calculer, cité par BitGo, Forta, nhimg ; utile contre le Sybil sous seuil | D2 |
| 4 | **S-A2 + S-A3** : âge et nature du destinataire (EOA/contrat, créé récemment) | Réduit le FP de D1 (une adresse "inconnue" de 2 ans n'est pas une adresse de 2 blocs) et attrape le contrat de Bybit | D1 |
| 5 | **S-B5 + S-B4** : fractionnement/montants égaux et cadence | Signature DPRK (60 % sous 500 k$) ; échappe à un seuil unique | D2 |
| 6 | **S-D8** : approbations vers un nouveau dépenseur | Précurseur du drain par allowance | D7 (ou D1 appliqué au dépenseur) |
| 7 | **S-C4** : séparer interne/externe | Principal facteur de faux positifs sur un hot wallet | OutflowLedger |
| 8 | **S-A4/E3 avec annuaire synthétique `synthetic:true`** | Montre la brique "réputation" sans fausse donnée ; même annuaire que le traceur (§15) | D1 (poids) |
| 9 | **S-A5** : source de financement du gaz | Seul signal qui voit l'attaquant *avant* son premier envoi ; simulable sur nos adresses | D1 |
| 10 | **S-H1** : règle "le contexte relève seulement" | Cohérent avec le piège Drift ; évite que (e) devienne une porte dérobée | échelle L1-L3 |
| 11 | **S-B9** : pic d'échecs | Sondage ; indice faible | L1 |
| 12 | **S-A9** : adresses sosie | Hors circuit détourné ; utile pour un opérateur humain | bonus |
| 13 | **S-B6** : ML d'anomalie | Pas dans la boucle de réponse déterministe (architecture §7) | bonus, non |
| 14 | S-D9 (EIP-7702) | Fuji probablement non concerné | limite écrite |

Aucun de ces signaux n'est un secret : tous sont publiés (voir §1). **L'originalité ne vient pas d'un signal** mais de leur croisement (S-A1 × S-B1 × S-C1) et de la perte bornée par le contrat.

### 5.1 Ce qui est standard et ce qui ne l'est pas

- **Standard (table stakes, ne pas présenter comme nouveauté)** : seuil de gros transfert ; sanctions et étiquettes ; événements de rôle/propriétaire/seuil/module/garde ; allowlist/blocklist d'appelants ; limite de vélocité par période et pourcentage du solde ; simulation avant signature ; avertissement de `delegatecall` inattendu ; déclenchement automatique réservé aux cas sévères ; corrélation d'alertes (Attack Detector Feed).
- **Peu courant ou non trouvé** : (1) agrégation des sorties *vers destinataires non connus* en % du solde sur fenêtres emboîtées, indépendante du circuit d'approbation ; (2) détecteur dédié d'écart **annoncé vs chaîne** ; (3) timelock + plafond agrégé dans le contrat qui borne la perte même si le détecteur échoue (Guardrail de Safe Research et le Cosigner de Blockaid s'en rapprochent mais pas sur le cumul) ; (4) preuve rejouable et scellée. Absence dans mes recherches, pas preuve d'absence.

---

## 6. Faisabilité sur Avalanche Fuji

| Point | Constat | Statut |
|---|---|---|
| `eth_getLogs`, `eth_getBalance`, `eth_getCode`, `eth_getTransactionCount` | Disponibles sur toute C-Chain EVM ; **la limite de plage de `getLogs` du RPC public Fuji n'est pas documentée** (QuickNode annonce 10 000 blocs pour son endpoint mainnet) [S] https://www.quicknode.com/docs/avalanche/eth_getLogs | tester en étape 0 [ÀV] |
| Traces (`debug_traceTransaction`) | Demandent un nœud d'archive et une clé chez les fournisseurs [S] https://www.dwellir.com/docs/avalanche/debug_traceTransaction ; le RPC public Fuji ne les expose probablement pas | [ÀV] : conséquence : les transferts natifs internes ne se voient que par delta de solde (S-C2) |
| Explorateur / étiquettes | Etherscan V2 liste Fuji (43113) [S] https://docs.etherscan.io/etherscan-v2/supported-chains ; Snowtrace est opéré par Routescan (API séparée) ; étiquettes sur Fuji non confirmées | [ÀV] |
| Réputation réelle (OFAC, exploiteurs) | Sans objet sur testnet ; listes Forta = Ethereum mainnet | annuaire synthétique obligatoire |
| Oracle Chainalysis | Déprécié (voir §1.3) ; présence sur Fuji non établie | ne pas l'intégrer |
| EIP-7702 | ACP-209 en discussion | hors périmètre, limite écrite |
| Safe sur Fuji | Non vérifié que les contrats Safe officiels soient déployés sur Fuji | [ÀV] ; sinon déployer les contrats via `safe-deployments` sur notre environnement |
| Éléments synthétiques | Tout annuaire ou profil de destinataire porte `synthetic:true` et le bandeau permanent (règle projet) | règle |

---

## 7. Mapping NIST CSF 2.0 / ATT&CK / ATLAS / OWASP agentique / D3FEND, par famille

Règle du guide : chaque fonctionnalité est reliée à NIST CSF 2.0 (viser Detect et/ou Respond) **et** à au moins un référentiel. Sous-catégories NIST CSF : texte relu sur un référentiel tiers [S] https://help.app.cyesec.com/en/articles/366572-nist-csf-2-0-subcategory-reference ; **à valider contre le texte officiel** (PDF https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf) comme le prévoit `architecture.md` §13.

| Famille | NIST CSF 2.0 (Detect / Respond) | ATT&CK | D3FEND | ATLAS / OWASP agentique |
|---|---|---|---|---|
| A destinataire | DE.AE-02 (analyse), DE.AE-03 (corrélation), DE.AE-07 (renseignement de menace et contexte) ; RS.MI-01 (confinement) | T1657 Financial Theft [V] | D3-UBA User Behavior Analysis [V] | n/a (règles déterministes) |
| B volume, vélocité | DE.CM-03 (activité du personnel et usage de la technologie), DE.AE-02, DE.AE-08 (seuils d'incident) ; RS.MI-02 (atténuation) | T1657 [V] | D3-UBA [V] | n/a |
| C réconciliation | DE.CM-09 (surveillance du matériel, logiciels et données), DE.AE-03 ; RS.AN-03 (analyse) | T1657 [V] | D3-RAPA Resource Access Pattern Analysis [V] | n/a |
| D pouvoirs | DE.CM-03, DE.AE-02, DE.AE-08 ; RS.MA-01 | **T1098 Account Manipulation** [V] (rôle/permissions) ; **T1078 Valid Accounts** [ÀV, non relu ici] | D3-RAPA [V], D3-UBA [V] | n/a |
| E réputation | DE.AE-07 | T1657 | D3-UBA | n/a |
| F blanchiment aval | RS.AN-03, RS.AN-07 (collecte de preuves) [ÀV], RS.CO-02/03 | T1657 | n/a | n/a |
| G pré-signature | DE.CM-09, PR.PS (prévention) [ÀV] | T1657 | D3-OTF Outbound Traffic Filtering [ÀV] | n/a |
| H contexte | DE.AE-03, DE.AE-07, DE.AE-06 (information fournie aux personnes autorisées) | T1657 ; T1657 DET0495 AN1364 (SaaS financier) [V] | D3-UBA [V] | n/a |
| J préparation | DE.AE-02, DE.AE-07 | T1587.004 / T1190 [ÀV, non reconfirmés] | D3-DO Decoy Object [ÀV] (leurre) | n/a |

Notes :
- **ATT&CK n'a pas de technique "exploit de smart contract"** (déjà noté dans `architecture.md` §13). T1657 est la seule technique confirmée aujourd'hui ([V] https://attack.mitre.org/techniques/T1657/ : mentionne l'exploitation de cryptomonnaie ; sa stratégie de détection DET0495 cible Windows, SaaS, e-mail, pas la chaîne). T1098 [V] https://attack.mitre.org/techniques/T1098/ (tactiques Persistence et Privilege Escalation).
- **D3FEND vérifiés** : D3-UBA (User Behavior Analysis : "détecter menaces internes, attaques ciblées et fraude financière") et D3-RAPA (Resource Access Pattern Analysis) [V] https://d3fend.mitre.org/technique/d3f:UserBehaviorAnalysis/ · https://d3fend.mitre.org/technique/d3f:ResourceAccessPatternAnalysis/. Tout autre ID D3FEND ci-dessus reste [ÀV], conformément à la règle "aucun ID tant qu'il n'est pas vérifié".
- **ATLAS / OWASP agentique** : les détecteurs sont déterministes et sans agent ; ils ne s'appliquent que si un LLM est dans la boucle (rédaction DORA, déjà traitée dans `architecture.md` §12-13). Si on ajoutait un détecteur ML (S-B6), le risque d'**empoisonnement de l'historique** relèverait d'ATLAS (`AML.T0020` "Poison Training Data" [ÀV]).

---

## 8. Limites de cette recherche

1. Les documentations de Hypernative, Blockaid, Hexagate et CertiK sont derrière un login : leurs listes de règles ne sont **pas** connues, seulement leurs catégories publiques. Ne jamais écrire "Hypernative ne détecte pas X".
2. Le catalogue Forta est une liste de bots ; leur déploiement actuel n'est pas vérifié (voir `T1_P4_etat_de_l_art.md`).
3. Les chiffres de la DPRK viennent d'un billet Chainalysis lu en entier ; les chiffres Bybit détaillés (72 % THORChain, 50 portefeuilles, cadence) viennent de la presse et d'Arkham/Elliptic [S] : à ne pas citer à l'oral sans vérification.
4. Les pages "corpus" d'Elliptic sont de qualité douteuse : aucune affirmation chiffrée n'en est tirée.
5. Pas de papier académique 2023-2026 sur la détection de drain de hot wallet ou de propositions multisig malveillantes retrouvé : ne pas écrire "l'état de l'art académique montre que…" sur ce sujet.
6. Aucun taux de faux positifs indépendant retrouvé pour les règles des éditeurs ; les colonnes "FP" ci-dessus sont des estimations qualitatives à mesurer au banc.
7. Mots interdits à l'oral (Merkle, ITS, L0-L3, règle@version) : ce document les utilise parce qu'il est interne.

## Sources (consultées le 2026-10-10)

- Forta : https://docs.forta.network/en/latest/starter-kit-bot-details/ · https://docs.forta.network/en/latest/bridge-starter-kit/ · https://docs.forta.network/en/latest/stablecoin-starter-kit/ · https://github.com/forta-network/labelled-datasets
- OpenZeppelin : https://docs.openzeppelin.com/monitor · https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender
- Tenderly : https://docs.tenderly.co/alerts/intro-to-alerts
- Hypernative : https://www.hypernative.io/products/onchain-monitoring · https://www.hypernative.io/blog/dora-doesnt-ask-whether-you-had-a-security-incident-it-asks-whether-you-knew-in-time · https://www.hypernative.io/blog/bybits-1-5b-hack-a-wake-up-call-for-crypto-security
- Hexagate : https://www.chainalysis.com/blog/hexagate-by-chainalysis-now-live-on-avalanche/
- Blockaid : https://tools.prnewswire.com/en-us/live/20813/release/20260513EN58813 · https://docs.portalhq.io/sdks/web/guide/blockaid
- Safe : https://docs.safe.global/advanced/smart-account-guards · https://docs.safe.global/reference-smart-account/events/RemovedOwner · https://help.safe.global/articles/4308960633-why-do-i-see-an-unexpected-delegate-call-warning-in-my-transaction · https://safe.global/blog/safe-research-guardrail-locking-down-delegate-calls
- Fireblocks : https://developers.fireblocks.com/reference/configure-transaction-authorization-policy · https://www.fireblocks.com/platforms/governance-and-policy-engine/
- BitGo : https://developers.bitgo.com/docs/policies-overview.md
- Range : https://docs.range.org/llms.txt
- Cyvers, CertiK, Webacy, Venn : https://www.productcool.com/product/cyvers-2 · https://certik.com/products/skyinsights · https://docs.webacy.com/product-guides/risk-score · https://malaysia.news.yahoo.com/ironblocks-venn-network-aims-keep-141807474.html
- Réputation : https://go.chainalysis.com/chainalysis-oracle-docs.html · https://thedefiant.io/news/regulation/u-s-treasury-lifts-sanctions-on-tornado-cash-cryptocurrency-mixer-3bb07641 · https://docs.etherscan.io/api-reference/endpoint/getlabelmasterlist-v2.md · https://docs.etherscan.io/etherscan-v2/supported-chains
- Laundering : https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/ · https://www.trmlabs.com/post/bybit-hack-update-north-korea-moves-to-next-stage-of-laundering · https://www.theblock.co/post/343855/bybit-hackers-half-the-stolen-eth-bitcoin-fbi-confirms-lazarus · https://info.arkm.com/research/lazarus-bridged-1-3b-of-bybit-eth-to-bitcoin · https://www.elliptic.co/blog/bybit-hack-largest-in-history
- Incidents : https://blocksec.com/blog/drift-protocol-incident-multisig-governance-compromise-via-durable-nonce-exploitation · https://blocksec.com/blog/bybit-1-5-b-hack-in-depth-analysis-of-the-malicious-safe-wallet-upgrade-attack · https://www.cyfrin.io/blog/safe-wallet-hack-bybit-exploit · https://dfns.co/article/the-bybit-safe-hack · https://cointelegraph.com/news/coinex-crypto-exchange-suspected-hacked-crypto-moved
- Papiers : https://arxiv.org/html/2501.16681v3 · https://arxiv.org/pdf/2510.09433 · https://arxiv.org/pdf/2201.06811 · https://arxiv.org/pdf/2505.09313 · https://arxiv.org/pdf/2204.08194 · https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
- Référentiels : https://attack.mitre.org/techniques/T1657/ · https://attack.mitre.org/techniques/T1098/ · https://d3fend.mitre.org/technique/d3f:UserBehaviorAnalysis/ · https://d3fend.mitre.org/technique/d3f:ResourceAccessPatternAnalysis/ · https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf
- Fuji : https://docs.avax.network/docs/acps/209-eip7702-style-account-abstraction · https://www.quicknode.com/docs/avalanche/eth_getLogs

# Track 1 « Guardians of Value » : état de l'art, actualité et idées de projets

> Hackathon cybersécurité ESSEC Cergy, 10-11 octobre 2026. Équipe de 2 (1 tech, 1 business), AWS Bedrock (Claude).
> Jury : Team1 (Avalanche), KPMG, KRYPTOSPHERE France.
> Recherche faite le 2026-10-10. Les chiffres viennent de rapports de fournisseurs (CertiK, TRM, Blockaid, Chainalysis…) dont les méthodes diffèrent. Ils sont **approximatifs**. Recoupez-les avant de les citer sur une slide (source primaire de préférence).

---

## 0. TL;DR pour le pitch

- **2025 : environ 3,4 Md$ volés**, dont **1,5 Md$ pour le seul hack de Bybit** (Lazarus, via le front-end Safe{Wallet}). La Corée du Nord (DPRK) en a pris **2,02 Md$ (59 %)**, son record historique (Chainalysis).
- **H1 2026 : 1,0 à 1,3 Md$** selon les sources. On compte **212 à 344 incidents**, un record en nombre. Hors Bybit, c'est **+28 %** par rapport à H1 2025 (CertiK).
- **Septembre 2026, pire mois de l'année : 766 à 768 M$.** Il y a eu Bitget (387,5 M$, zero-day sur des appliances de sécurité tierces, puis usurpation du circuit d'autorisation interne) et Liquid Network (319 M$, bug de cache de range-proof, 3 400 BTC rendus).
- **Le code n'est plus le vecteur principal. Ce sont les opérations (OpSec).** Selon Blockaid, 74 % des fonds volés en H1 2026 viennent de clés compromises, d'infrastructures de signature ou d'accès privilégiés. Les plus gros cas : KelpDAO (292 M$, RPC empoisonnés et vérificateur unique « 1-of-1 ») et Drift (285 M$, prise de contrôle de la gouvernance multisig).
- **Nouveau vecteur émergent : les agents IA qui détiennent un wallet.** Grok/Bankr s'est fait drainer environ 150 à 180 k$ par prompt injection codée en morse (mai 2026). Des attaques sur x402 sont documentées dans la littérature académique.
- **Côté banque :** au Royaume-Uni, la fraude APP atteint **576 M£ en 2025 (+19 %)**. Le **Verification of Payee (VoP)** est obligatoire en zone euro depuis le **9 octobre 2025**. PSD3/PSR va faire porter la responsabilité de la fraude par usurpation aux PSP. Le deepfake vocal d'un président a coûté **95 M€ à Fideuram** (février 2026). En France, la période transitoire **MiCA s'est terminée le 1er juillet 2026**, et **DORA** s'applique désormais aux CASP agréés.
- **Avalanche :** Avalanche9000/Etna permet des L1 souveraines à bas coût, avec l'interopérabilité ICM/Teleporter. **BlackRock BUIDL** y dépasse 900 M$. **eERC** (ERC chiffré, rôle d'auditeur) cible les institutions. L'outillage sécurité natif reste mince : Blockaid est intégré dans Core et c'est à peu près tout. Il n'y a pas de monitoring dédié aux L1 ni à l'ICM.

---

## 1. Plus gros hacks et fraudes crypto 2025-2026 : chiffres et vecteurs

### 1.1 Totaux

| Période | Total | Remarques | Source |
|---|---|---|---|
| 2025 (janvier à début décembre) | ~3,4 Md$ volés | Bybit = 1,5 Md$. DPRK = 2,02 Md$ (59 %), record, +51 % sur un an | Chainalysis via Decrypt / Crowdfund Insider |
| H1 2026 (CertiK) | 1,31 Md$, 344 incidents | Wallet compromise 445 M$ (33 incidents), phishing 366 M$ (63). +28 % hors Bybit | CertiK Hack3d H1 2026 |
| H1 2026 (TRM) | 972 M$, 207 hacks | DPRK ~643 M$ (~66 %) | TRM via CryptoTimes |
| H1 2026 (Blockaid) | ~1,1 Md$, 212 exploits (record) | 74 % OpSec. Clés privilégiées 790 M$. Bridges 372 M$. DPRK ~55 %. **Ethereum, BNB et Avalanche sont les chaînes les plus attaquées en nombre** | Blockaid via The Defiant / Unchained |
| Septembre 2026 | 768,5 M$ (CertiK), 766,5 M$ (PeckShield) | 273 M$ récupérés ou gelés, soit 495 M$ net | CertiK / Coin Edition |

### 1.2 Incidents marquants et vecteurs

| Date | Victime | Montant | Vecteur | Leçon pour un produit |
|---|---|---|---|---|
| 21/02/2025 | **Bybit** | 1,5 Md$ | Lazarus compromet le poste d'un développeur Safe{Wallet}. Du JavaScript malveillant est injecté dans app.safe.global (S3/CloudFront) et ne se déclenche que pour Bybit. Les signataires approuvent « à l'aveugle » un changement de l'implémentation du contrat (delegatecall). | Il faut vérifier une transaction **indépendamment de l'interface** (calldata décodé, simulation hors UI). Il faut aussi surveiller l'intégrité du front-end. |
| 12/2025 | Trader (USDT) | 50 M$ | **Address poisoning** : un test de 50 USDT est repéré, une adresse sosie est plantée, le transfert part 26 minutes plus tard. Blanchiment via DAI, puis ETH, puis Tornado Cash. | Il faut contrôler la similarité des adresses avant l'envoi. |
| 03/2026 → | Ethereum post-Fusaka | +612 % de « dust » USDT en 90 jours | Le coût du gas a baissé, donc le poisoning de masse est rentable (Etherscan). Webacy projette environ 330 000 événements de poisoning pour mars 2026. | Volume énorme et taux de succès d'environ 0,01 %. C'est rentable pour l'attaquant. |
| 22/03/2026 | **Resolv (USR)** | ~25 M$ extraits, 80 M USR mintés | Clé de service compromise (environnement **AWS KMS**). Une seule EOA détient le rôle de mint, **sans plafond ni contrôle d'oracle**. Le stablecoin perd son ancrage jusqu'à 0,025 $. | Il faut des invariants on-chain (mint ≤ collatéral) et une alerte sur les mints anormaux. |
| 01/04/2026 | **Drift (Solana)** | 285 M$ (dont ~230 M$ en USDC) | DPRK (UNC4736/TraderTraitor). Six mois d'ingénierie sociale, puis prise de contrôle de la gouvernance multisig via les durable nonces. 31 retraits en 12 minutes. Circle n'a pas gelé l'USDC pendant les 6 h de bridge. | Le temps de réaction se compte en minutes. Le gel du stablecoin dépend de l'émetteur. |
| 14/04/2026 | **CoW Swap** | 0,5 à 1,2 M$ | **Détournement DNS** au niveau du registrar. Un clone pixel-perfect demande des approvals illimités « pour une mise à jour du protocole ». | Il faut surveiller le DNS et le front-end, et analyser les approvals au moment de signer. |
| 18/04/2026 | **KelpDAO (rsETH / LayerZero)** | 292 M$ | Deux nœuds RPC du DVN sont empoisonnés (binaires remplacés). Les nœuds sains sont mis hors ligne par DDoS. Comme la configuration n'a qu'**un seul vérificateur**, un message cross-chain falsifié passe. Attribué à Lazarus. | La sécurité d'un bridge dépend de sa configuration (1-of-1), pas seulement de son code. |
| 04/05/2026 | **Grok × Bankr** | ~150 à 180 k$ | Le wallet de l'agent reçoit un NFT qui débloque des permissions, puis subit une **prompt injection codée en morse**. L'agent IA transfère des DRB. Un second incident Bankr a touché 14 wallets. | Il faut un **pare-feu de politique en dehors du LLM**. |
| 06/09/2026 | **Liquid Network (Blockstream)** | 319 M$ (3 998 L-BTC non adossés) | Collision dans le cache de vérification des range-proofs (Elements), puis peg-out via SideSwap. 3 400 BTC rendus. | Il faut surveiller l'invariant de réserve (supply ≤ réserves). |
| 24/09/2026 | **Bitget** | 387,5 M$ | **Zero-day sur deux appliances de sécurité tierces**, web shell, mouvement latéral jusqu'au serveur de jobs du wallet. Les données de transaction sont usurpées, puis le circuit d'autorisation interne approuve les retraits. **Aucune clé volée.** Environ 228 M$ sortent en 18 minutes, sur 7 chaînes **dont Avalanche**. Attribution DPRK préliminaire. | Il faut une **vérification indépendante de l'intention d'une transaction**, découplée du backend, et des limites de vélocité. |
| 02/2026 | Fideuram (Italie) | 95 M€ (59 M€ sauvés) | **Deepfake vocal du président**. Une partie des fonds est convertie en crypto. | C'est le pont entre fraude bancaire et crypto. |

### 1.3 Tendances clés

1. **L'opérationnel l'emporte sur le code** : clés, KMS, appliances, CI/CD, front-end, RPC, signataires de multisig. Les audits de smart contracts ne couvrent plus le risque principal.
2. **DPRK/Lazarus** : moins d'attaques, mais beaucoup plus grosses. Ingénierie sociale de longue durée (faux recruteurs, faux devs), puis exfiltration en quelques minutes et blanchiment via THORChain, Tornado Cash et des OTC.
3. **Wallet drainers** : les pertes baissent fortement (494 M$ en 2024, ~84 M$ en 2025 selon Scam Sniffer), mais les attaques se déplacent vers le phishing **EIP-7702** (délégation de compte puis batch de transferts masqués) et l'**address poisoning** de masse après Fusaka.
4. **Agents IA** : c'est le premier vecteur émergent selon Blockaid. Anthropic a montré que des agents exploitent 207 contrats sur 405 en simulation (~550 M$ fictifs). x402 a cinq attaques documentées (prix gonflé, faux facilitateur, boucles, rejeu du token de paiement).
5. **Stablecoins** : 84 % du volume illicite en 2025 passe par des stablecoins (Chainalysis). Le gel dépend de la politique de l'émetteur : Circle exige une décision de justice, Tether gèle à la demande des forces de l'ordre. Le GENIUS Act (2025) impose la capacité technique de geler.

---

## 2. Fraude bancaire et fintech, réglementation UE

### 2.1 Chiffres

- **Royaume-Uni (UK Finance, rapport 2026 sur 2025)** : 1,28 Md£ de fraude aux paiements (+4 %). **APP fraud : 576,4 M£ (+19 %)**, soit 32 % des pertes, dont investissement 221,5 M£ (+40 %). Les deux tiers des APP fraud démarrent en ligne. Le remboursement obligatoire (PSR, octobre 2024) donne un **taux de remboursement de 88 %** (173 M£ sur 12 mois).
- **France (Banque de France / OSMP)** : environ **183 M€ de fraude au virement en 2024**. La banque en ligne représente 76 % de la valeur de la fraude au virement en H1 2025. Le fichier FNC-RF (comptes signalés à risque) serait opérationnel depuis mai 2026, mais une seule source le dit.
- **Deepfakes** : le FBI IC3 2025 compte 22 364 plaintes mentionnant l'IA, pour environ 893 M$. Deloitte prévoit 40 Md$ de fraude liée à la GenAI aux États-Unis en 2027.
- **Identité synthétique et ATO** : l'ATO est devenu le premier type d'attaque contre les institutions financières européennes (avant la carte). Plus de 40 % des attaques utilisent l'IA. Les deepfakes représentent 6,5 % des tentatives. AU10TIX (Q1 2026) mesure **3,89 % de fraude confirmée** sur les vérifications d'identité. TransUnion estime jusqu'à 5 M d'identités synthétiques au Royaume-Uni.

### 2.2 Cadre réglementaire

| Texte | Statut au 10/10/2026 | Ce que ça implique pour un produit |
|---|---|---|
| **Instant Payments Regulation (SEPA Instant)** | Réception obligatoire depuis janvier 2025, émission obligatoire en zone euro depuis le 9 octobre 2025. **VoP (vérification nom/IBAN) obligatoire depuis le 9 octobre 2025** pour tous les virements SEPA en euro. Zone hors euro : juillet 2027. | Le virement est final en 10 secondes, donc il faut un scoring en temps réel. Le VoP ne bloque pas la fraude par ingénierie sociale, puisque la victime confirme quand même. |
| **PSD3 / PSR** | Accord politique en novembre 2025, COREPER le 22 avril 2026, publication au JO attendue en 2026. Application **estimée vers 2027-2028**. | **Responsabilité des PSP dans la fraude par usurpation** (faux conseiller bancaire). Charge de la preuve sur le PSP. VoP étendu. Partage d'informations sur la fraude entre PSP. Monitoring de transactions fondé sur le risque. |
| **MiCA** | Fin de la période transitoire en France le **1er juillet 2026**. 31 CASP agréés en France, 283 dans l'UE (AMF, 6 juillet 2026). | Les CASP agréés ont besoin d'outils de conformité : Travel Rule, monitoring, abus de marché. |
| **DORA** | En vigueur depuis le 17 janvier 2025. S'applique aux CASP **dès leur agrément MiCA** (Q&A ESMA). L'AMF a publié un rapport sur les incidents majeurs de 2025. | Registre des prestataires TIC tiers, notification des incidents majeurs (délais courts), tests de résilience. **Un marché pour la production automatique de rapports d'incident.** Le cas Bitget (appliances tierces) illustre exactement le risque de tiers TIC visé par DORA. |
| **GENIUS Act (US)** | Promulgué en 2025, règles d'application du Trésor en cours. | Capacité de gel obligatoire, réserves 1:1. |
| **AMLR / AMLA** | AMLA opérationnelle, AMLR applicable en juillet 2027. | KYC/KYT harmonisé. |

### 2.3 Tokenisation RWA et stablecoins

- Avalanche est le **2e réseau permissionless pour les RWA distribués**, derrière Ethereum. BlackRock **BUIDL** dépasse 900 M$ sur Avalanche (juillet 2026), soit environ 43 % de la valeur RWA distribuée sur la chaîne (RWA.xyz, chiffres variables selon la source).
- Risques propres aux RWA : rôles d'admin (mint/burn/forceTransfer), oracles de NAV, listes blanches KYC, bridges entre L1, rachat (redemption). Le cas Resolv montre ce que coûte un rôle de mint sans plafond.

---

## 3. Écosystème Avalanche

### 3.1 Architecture et nouveautés

- **Avalanche9000 / Etna** (mainnet depuis le 16 décembre 2024, ACP-77) : les subnets deviennent des **L1 souveraines**. Plus de stake de 2 000 AVAX : les validateurs paient environ 1,3 AVAX par mois, et ne valident plus le Primary Network. La gestion des validateurs passe par smart contract (PoA/PoS, ACP-99).
- **ICM (Interchain Messaging, ex-AWM) et Teleporter** : messages signés en BLS agrégé par un seuil des validateurs de la L1 source. On le présente comme « sans bridge tiers », mais **la sécurité égale celle du jeu de validateurs de chaque L1**, souvent petit (PoA). Les relayers ICM sont des composants off-chain.
- **eERC (Encrypted ERC)** d'AvaCloud : soldes et montants chiffrés (zk-SNARK, chiffrement homomorphe partiel), rôle **auditeur** avec viewing keys pour la conformité. Environ 947 k gas par transfert. SDK `@avalabs/eerc-sdk`, dépôt `ava-labs/EncryptedERC`.
- **Données** : AvaCloud **Data API (Glacier)**, Metrics API, **Webhooks API** (C-Chain mainnet, **Fuji 43113** et L1, signature HMAC-SHA256, `address_activity`, événements de contrat). SDK TypeScript.
- **Chaînes de test** : Fuji C-Chain (faucet sur build.avax.network), Avalanche-CLI pour lancer une L1 locale ou sur Fuji en quelques minutes.

### 3.2 Outils de sécurité existants

- **Blockaid dans Core** (le wallet d'Ava Labs) depuis juin 2024 : simulation et scan avant signature. Critique récurrente : trop de faux positifs.
- Les auditeurs classiques (Halborn, Trail of Bits, OpenZeppelin, Zellic…) et les explorateurs (Snowtrace/Routescan, Avascan).
- Hypernative et Forta sont multi-chaînes. Je n'ai trouvé **aucune annonce de monitoring dédié aux L1 Avalanche ou à l'ICM**. Forta Firewall a filtré plus de 700 M de transactions en 2025, mais le token a perdu environ 81 % sur un an.

### 3.3 Ce qui manque (opportunités)

1. **Monitoring des L1 et de l'ICM** : changements du validator set, concentration PoA, relayers, messages Teleporter anormaux, upgrades du ValidatorManager. Personne ne couvre les « petites » L1 institutionnelles.
2. **Garde-fous pour la tokenisation RWA sur Avalanche** : surveillance des rôles admin, mint contre réserves, oracles NAV, conformité des listes blanches.
3. **Conformité de l'eERC** : outillage pour l'auditeur (déchiffrement sélectif, rapport AML) sans casser la confidentialité.
4. Rapports **DORA/MiCA** automatisés pour les CASP qui touchent Avalanche.
5. Selon Blockaid, Avalanche fait partie des trois chaînes EVM les plus attaquées en nombre en H1 2026, et Bitget a perdu des AVAX en septembre. **Le besoin est réel.**

### 3.4 Financements et Team1

- **Team1 Builder Grants** (lancés le 1er juillet 2026) : **Mini Grants jusqu'à 10 k$**, **Accelerator Grants jusqu'à 30 k$** (milestones, crédits, accès possible aux entretiens **Codebase**, l'accélérateur officiel). Sélection par un comité de vote. Team1 compte plus de 450 membres, et il existe un **Team1 France** (Builders Nights à Paris).
- **Retro9000** : grants rétroactifs pour les L1 et l'outillage d'infrastructure. Une nouvelle phase pourrait aller jusqu'à 40 M$ (à confirmer).
- **Avalanche Research Proposals** : jusqu'à 50 k$ (clôture le 1er juin 2026, passé).
- Pour le pitch : un outil de sécurité open source pour les L1 Avalanche entre exactement dans les critères « infrastructure et outillage critique » de Retro9000 et Team1.

---

## 4. Outils existants et leurs angles morts

| Outil | Ce qu'il fait | Limites et gaps |
|---|---|---|
| **Blockaid** | Scan et simulation de transactions et de dApps dans les wallets (Core, MetaMask…), monitoring on-chain | Faux positifs. **Explication peu lisible pour un humain** (« malicious » sans raison claire). Ne voit pas l'opérationnel côté institution. |
| **Hypernative** | Détection pré-exploit, protection des wallets, réponse automatisée (40 M$ en série B, 200+ clients, 100+ Md$ protégés) | Cher, orienté protocoles et institutions. Pas de couverture des L1 Avalanche annoncée. Ne couvre pas le rail fiat. |
| **Forta (Firewall)** | Réseau de bots de détection, pare-feu de transactions pour rollups | Dépend de l'adoption par les rollups. Modèle économique fragile. |
| **Chainalysis / TRM / Elliptic** | KYT, attribution, traçage, sanctions | Après coup (forensics). Licences chères. Peu d'**explication en langage naturel** de ce qui se passe en temps réel. |
| **Wallet Guard** (racheté par Consensys en 2024) et **Pocket Universe** (racheté par Kerberus en 2025) | Extensions de simulation et anti-phishing | Le marché se consolide. **Contournables** : TOCTOU (l'état change entre simulation et exécution), proxies modifiés après la simulation, signatures permit/EIP-712 et 7702 mal décodées, usurpation de la simulation. |
| **Fireblocks / Safe / MPC** | Garde, politiques de transaction, multisig | Bybit et Bitget le montrent : **si l'interface ou le backend ment, les signataires approuvent**. Pas de « second regard » indépendant sur l'intention. |
| **VoP / scoring bancaire** (BioCatch, Featurespace…) | Contrôle nom/IBAN, biométrie comportementale | Ne bloque pas une victime manipulée qui confirme. Peu de **dialogue en temps réel** avec la victime. Silo bancaire, la crypto n'est pas couverte. |
| **Revoke.cash, Etherscan** | Révocation des approvals, avertissements de poisoning | Manuel, réactif. |

**Gaps transverses que l'IA peut combler :**
1. **Traduire une transaction en intention lisible** (calldata, 7702, permit, multisig) et la **vérifier indépendamment** de l'interface. C'est la leçon de Bybit et Bitget.
2. Un **pare-feu de politique pour les agents IA** qui détiennent un wallet. Il n'existe pas encore de standard.
3. Des **rapports d'incident réglementaires** (DORA, MiCA) produits automatiquement à partir des signaux on-chain et SI.
4. Une **couverture des L1 Avalanche et de l'ICM**.
5. Le **pont fraude fiat → crypto** (deepfake, APP, conversion en crypto), qui est l'angle KPMG.

---

## 5. Dix idées de projets (36 h, IA via Bedrock)

Notes sur 5. **Impact** = valeur et taille du problème. **Faisabilité** = réaliste en 36 h à 1 tech et 1 business. **Wow** = effet en démo live. **Jury** = adéquation avec Team1/Avalanche, KPMG et Kryptosphere.

| # | Idée | Impact | Faisab. | Wow | Jury | **Total /20** |
|---|---|---|---|---|---|---|
| 1 | **SignGuard : second regard IA indépendant pour les signataires de multisig** | 5 | 4 | 5 | 5 | **19** |
| 2 | **AgentShield : pare-feu de politique pour les agents IA à wallet (Avalanche / x402)** | 5 | 4 | 5 | 5 | **19** |
| 3 | **Sentinel L1 : SOC IA pour les L1 Avalanche, l'ICM et les RWA, avec rapport DORA automatique** | 5 | 3 | 4 | 5 | **17** |
| 4 | **PoisonProof : détecteur d'address poisoning et de drainers en temps réel (Fuji)** | 4 | 5 | 4 | 4 | **17** |
| 5 | **DORA Copilot : rapport d'incident majeur DORA/MiCA généré depuis l'on-chain et les logs** | 4 | 4 | 3 | 5 (KPMG) | **16** |
| 6 | **ScamCall Breaker : agent qui interrompt une APP fraud ou un deepfake pendant un virement instantané** | 5 | 3 | 5 | 4 | **17** |
| 7 | **Reserve Watch : invariant de réserves et de mint pour stablecoins et RWA, avec circuit breaker on-chain** | 4 | 4 | 4 | 5 | **17** |
| 8 | **FrontEnd Integrity Monitor : détection de DNS hijack ou de JS modifié sur les dApps** | 4 | 4 | 3 | 3 | **14** |
| 9 | **eERC Compliance Auditor : conformité AML préservant la confidentialité sur un token eERC** | 4 | 2 | 4 | 5 | **15** |
| 10 | **Lazarus Tracker : agent de traçage et de rapport de gel (Circle/Tether) en minutes** | 4 | 3 | 4 | 4 | **15** |

### Détail des idées

#### 1. SignGuard : second regard IA indépendant pour les signataires (19/20)
- **Problème** : Bybit (1,5 Md$), Drift (285 M$) et Bitget (387 M$). Les signataires approuvent ce que l'interface ou le backend leur montre.
- **Solution** : un service indépendant (extension ou bot Telegram/Slack) reçoit la transaction brute à signer (hash Safe, calldata, EIP-712). Il la **décode lui-même**, la **simule sur un fork** (Anvil/Tenderly sur Fuji) et compare l'**intention déclarée** (« payer 50 k USDC au fournisseur X ») avec l'**effet réel** (delegatecall, changement de masterCopy, changement d'owner, approve illimité). Un agent Claude produit un verdict lisible avec un score de risque et des contrôles de politique (liste blanche, plafonds, horaires).
- **Stack** : Safe{Core} SDK sur Fuji (ou un multisig simple), viem/ethers, Anvil fork, Bedrock (Claude Sonnet) avec tool use (decode, simulate, lookup), front Next.js, bot Telegram.
- **Données** : Safe Transaction Service, 4byte/Sourcify/Snowtrace ABI, Glacier Data API, liste d'adresses malveillantes (ScamSniffer, open source).
- **Démo** : reproduire Bybit en miniature sur Fuji. Un faux front-end présente « transfert de 10 AVAX », mais le calldata réel est un `delegatecall` qui change l'implémentation. SignGuard affiche en rouge « ATTENTION : cette transaction remplace la logique de votre coffre, l'attaquant prendra le contrôle de tous les fonds », puis montre la transaction légitime en vert.
- **Fit jury** : Avalanche (Fuji, Core), KPMG (contrôle des quatre yeux, gouvernance de la garde), Kryptosphere (pédagogie sur Bybit).

#### 2. AgentShield : pare-feu de politique pour agents IA à wallet (19/20)
- **Problème** : Grok/Bankr (prompt injection), attaques x402 (prix gonflé, faux facilitateur, rejeu). C'est le premier vecteur émergent selon Blockaid.
- **Solution** : une couche entre l'agent et la clé. Un **policy engine déterministe** (plafonds, liste blanche, vélocité, contrats autorisés), un **juge LLM séparé** (Claude Haiku/Sonnet via Bedrock) qui détecte l'injection et la dérive d'intention, et un **smart contract de session key** sur Fuji qui applique les limites on-chain. Un humain valide au-delà d'un seuil.
- **Stack** : contrat Solidity « AgentVault » (limites journalières, liste blanche) sur Fuji, agent démo (Bedrock Agents ou boucle de tool use), middleware TypeScript, dashboard.
- **Démo** : un agent « trésorier » paie des API en x402 et en USDC de test. On envoie un tweet ou un email contenant une injection cachée (Base64 ou morse, comme Grok). Sans AgentShield, l'agent vide le wallet. Avec AgentShield, c'est bloqué, expliqué, et une alerte part. Ensuite, un serveur 402 malveillant gonfle le prix : bloqué aussi.
- **Fit** : très « 2026 ». Avalanche pousse les paiements d'agents. Bedrock est natif. KPMG s'intéresse à la gouvernance de l'IA (AI Act).

#### 3. Sentinel L1 : SOC IA pour L1 Avalanche, ICM et RWA (17/20)
- **Solution** : on déploie une L1 de test (Avalanche-CLI) ou on s'appuie sur Fuji. Des détecteurs surveillent les changements du validator set (ValidatorManager), les messages Teleporter anormaux, les mints et burns de token RWA, les changements de rôles admin et les upgrades de proxy. Un agent Claude trie les alertes, corrèle, explique, et **produit le brouillon de rapport d'incident DORA** (classification d'incident majeur, délais de notification).
- **Stack** : Glacier Webhooks (Fuji 43113, HMAC), Avalanche-CLI, Python/FastAPI, Bedrock, Postgres, Grafana ou Next.js.
- **Démo** : en live, on ajoute un validateur malveillant à une L1 PoA, puis on fait un mint anormal. L'alerte apparaît en moins de 10 secondes, avec la narration de l'IA et un PDF DORA prêt à envoyer.
- **Fit** : maximal pour Team1 (outillage d'infrastructure, éligible Retro9000) et pour KPMG (DORA).

#### 4. PoisonProof : anti address poisoning et drainers (17/20)
- **Solution** : une extension ou un snap qui, avant chaque envoi, compare l'adresse de destination aux adresses de l'historique (similarité préfixe/suffixe, transferts de 0 ou de dust reçus récemment, âge de l'adresse). Il décode les signatures permit et 7702. Le LLM explique en français simple.
- **Données** : Glacier (historique de transferts), Etherscan/Snowtrace, liste ScamSniffer. La démo est facile sur Fuji en générant soi-même les adresses vanity (profanity2 ou create2crunch sur un préfixe court).
- **Démo** : rejouer le cas des 50 M$ USDT en miniature.

#### 5. DORA Copilot (16/20)
- **Solution** : on donne en entrée des logs SI, des alertes on-chain et une timeline. L'agent produit la classification (critères RTS DORA), la notification initiale, le rapport intermédiaire, le rapport final et le registre des tiers TIC impactés. Le cas Bitget sert d'exemple (appliances tierces, donc risque de tiers TIC).
- **Fit** : KPMG au maximum, mais l'effet « wow » est plus faible. C'est un bon module complémentaire des idées 1 ou 3.

#### 6. ScamCall Breaker (17/20)
- **Solution** : pendant un virement instantané à fort montant, ou un achat de crypto, l'app bancaire lance un **dialogue IA** avec la personne (« quelqu'un vous a-t-il appelé en se présentant comme votre conseiller ? »). L'agent combine des signaux : bénéficiaire nouveau, VoP « close match », session sous appel en cours, partage d'écran, urgence. Il produit un score et peut proposer une **mise en séquestre de 24 h** (sous PSD3, la banque a tout intérêt à réduire sa responsabilité). Option : détection de deepfake vocal via une API.
- **Limite** : pas de vrai rail SEPA. On simule un mini core banking et on règle en stablecoin sur Fuji.

#### 7. Reserve Watch (17/20)
- **Solution** : un contrat « CircuitBreaker » branché sur un token RWA ou stablecoin de démo sur Fuji. Il vérifie `mint ≤ réserves attestées` (Chainlink PoR sur Fuji, ou un oracle mock) et des plafonds de mint par fenêtre. L'IA analyse les anomalies et rédige la communication de crise.
- **Démo** : rejouer Resolv (mint de 80 M sans collatéral). Le mint est bloqué et l'alerte part.

#### 8. FrontEnd Integrity Monitor (14/20)
- Il hash les bundles JS des dApps, surveille DNS, NS et certificats (crt.sh), compare au build signé, et fait expliquer le diff par l'IA. Cas de référence : CoW Swap et Bybit (S3). Simple, mais moins spectaculaire.

#### 9. eERC Compliance Auditor (15/20)
- On déploie un eERC sur Fuji avec une clé auditeur. L'agent déchiffre uniquement pour l'auditeur, applique des règles AML (structuring, vélocité) et produit un rapport. **Risque** : la courbe d'apprentissage ZK est lourde en 36 h. C'est très aligné Avalanche et institutions.

#### 10. Lazarus Tracker (15/20)
- Il suit en temps réel un portefeuille identifié comme attaquant (bridges, swaps). Il détecte les passages par des stablecoins gelables (USDC/USDT), génère automatiquement la demande de gel aux émetteurs et le rapport pour les forces de l'ordre. Cas : Drift, où Circle a eu 6 h et n'a pas agi. Données : APIs d'explorateurs, Arkham (limitée), Glacier.

---

## 6. Top 3 recommandé

1. **SignGuard** : il répond aux trois plus gros hacks (Bybit, Bitget, Drift), la démo Fuji est très claire, et il intéresse à la fois Avalanche, KPMG et Kryptosphere. Il se combine facilement avec **DORA Copilot** comme module « rapport ».
2. **AgentShield** : c'est le sujet le plus actuel (agents IA et x402), il montre Bedrock en défense contre une injection, avec une démo attaque puis défense très visuelle.
3. **Sentinel L1** : c'est le meilleur fit avec Team1 (infrastructure pour les L1, éligible Retro9000 et Team1 Grants) et avec KPMG (DORA). Il est plus risqué en 36 h, donc il vaut mieux limiter le périmètre à 2 détecteurs plus la génération de rapport.

**Option combinée** : « Guardian Copilot » = SignGuard (pré-signature) + rapport DORA automatique (post-incident) sur Avalanche Fuji. Ça raconte une histoire complète : prévenir, détecter, déclarer.

### Plan 36 h type (pour SignGuard)
- H0-4 : Safe ou multisig sur Fuji, faux front-end malveillant, fork Anvil.
- H4-14 : décodeur et simulateur, différentiel d'état (owners, implémentation, soldes).
- H14-22 : agent Bedrock (tool use : decode, simulate, policy, threat-intel), prompt de verdict structuré en JSON.
- H22-30 : UI et bot Telegram, scénarios de démo (Bybit-like, approve illimité, 7702).
- H30-36 : génération du rapport DORA, pitch, vidéo de secours.
- Business : sizing (pertes OpSec 790 M$ en H1 2026), personas (trésorier de CASP MiCA, DAO, émetteur RWA), modèle SaaS par coffre, plus le lien réglementaire (DORA, MiCA, PSD3).

---

## Sources

**Hacks et chiffres**
- CertiK Hack3d H1 2026 : https://www.certik.com/blog/certik-hack3d-h1-2026-report
- The Defiant, CertiK H1 2026 (+28 % hors Bybit) : https://thedefiant.io/news/security/certik-says-h1-2026-web3-losses-topped-1-31b-up-28-excluding-bybit-baseline
- CryptoTimes, Blockaid H1 2026 : https://www.cryptotimes.io/2026/07/29/crypto-hacks-cross-1-1b-in-record-h1-2026-losses-blockaid/
- The Defiant, Blockaid 212 incidents : https://thedefiant.io/news/hacks/crypto-hacks-hit-record-212-incidents-in-h1-2026-blockaid
- Unchained, Blockaid H1 : https://unchainedcrypto.com/crypto-lost-1-1-billion-across-212-exploits-in-h1-2026-a-record-incident-count-blockaid-says/
- CryptoTimes, Top 10 hacks H1 2026 (TRM) : https://www.cryptotimes.io/insights/top-10-crypto-hacks-of-h1-2026-how-hackers-drained-972-million-in-six-months/
- Coin Edition, septembre 2026 : https://coinedition.com/september-2026-records-2026s-highest-crypto-hack-losses-is-it-the-second-worst-month-in-three-years/
- CryptoTimes, CertiK septembre : https://www.cryptotimes.io/2026/09/30/bitget-liquid-hacks-drive-crypto-losses-to-766m-in-september-2026s-worst-month-certik/
- Decrypt, DPRK 2 Md$ 2025 (Chainalysis) : https://decrypt.co/352775/north-korean-hackers-stolen-2-billion-crypto-2025-report
- Crowdfund Insider, Chainalysis 2025 : https://www.crowdfundinsider.com/2025/12/256728-north-korea-drives-2b-crypto-theft-year-pushing-all-time-total-to-6-75b-research/
- BleepingComputer, Bitget : https://bleepingcomputer.com/news/security/bitget-hacked-via-zero-day-in-third-party-security-products
- The Block, Bitget reprise des retraits : https://theblock.co/news/business/2026-09-28-bitget-starts-phased-withdrawal-resumption-416965
- Cointelegraph, Bitget : https://cointelegraph.com/news/bitget-388m-hack-third-party-security-vulnerability
- CoinDesk, KelpDAO / LayerZero : https://www.coindesk.com/tech/2026/04/20/layerzero-blames-kelp-s-setup-for-usd290-million-exploit-attributes-it-to-north-korea-s-lazarus
- rekt.news, KelpDAO : https://rekt.news/wrong-attack-surface
- QuillAudits, Kelp : https://www.quillaudits.com/blog/hack-analysis/kelp-dao-hack
- Decrypt, Drift et Tether : https://decrypt.co/364589/drift-tether-148-million-recovery-plan-ditches-circle-usdc
- Crypto Briefing, politique de gel de Circle : https://cryptobriefing.com/circle-usdc-freeze-policy-genius-clarity-acts/
- The Block, Resolv : https://www.theblock.co/post/394582
- Halborn, Resolv : https://www.halborn.com/blog/post/explained-the-resolv-hack-march-2026
- Blockaid, Resolv : https://blockaid.io/blog/how-a-compromised-key-minted-80m-in-resolvs-usr-stablecoin-and-triggered-a-depeg
- The Block, CoW Swap DNS : https://www.theblock.co/post/397432/cow-swap-pauses-protocol-amid-domain-hijacking
- TRM Labs, Liquid Network : https://trmlabs.com/resources/blog/2026s-biggest-hack-to-date-attackers-drained-usd-319-million-in-bitcoin-from-liquid-network-then-returned-85-of-funds
- Halborn, Liquid : https://www.halborn.com/blog/post/explained-the-liquid-network-hack-september-2026
- SlowMist, Bybit et Safe front-end : https://slowmist.medium.com/bybits-1-5-billion-theft-unveiled-safe-wallet-front-end-code-tampered-84b78f0fa9c2
- BleepingComputer, Bybit via Safe : https://www.bleepingcomputer.com/news/security/lazarus-hacked-bybit-via-a-breached-safe-wallet-developer-machine/
- The Block, address poisoning de 50 M$ : https://www.theblock.co/post/383423/crypto-trader-loses-50-million-in-address-poisoning-attack-offers-1-million-bounty-for-return
- Etherscan, poisoning en hausse : https://info.etherscan.com/address-poisoning-attacks-are-rising-on-ethereum
- Webacy, poisoning en accélération : https://www.webacy.com/blog/address-poisoning-is-accelerating
- DeepStrike, statistiques sur les drainers : https://deepstrike.io/blog/crypto-wallet-drainer-statistics
- Beosin, rapport H1 2026 : https://beosin.com/resources/2026_H1_Global_Web3_Security_Report.pdf
- Ryder, ce que ratent les simulateurs de transactions : https://ryder.id/blogs/post/transaction-simulators-in-2026-what-they-catch-and-miss

**Agents IA**
- The Block, Anthropic et les smart contracts : https://www.theblock.co/post/381035/ai-agent-smart-contract-anthropic
- arXiv, cinq attaques sur x402 : https://arxiv.org/pdf/2605.11781
- Giskard, Grok / Bankr prompt injection : https://giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet
- Cointelegraph, Bankr 14 wallets : https://cointelegraph.com/news/bankr-disables-transactions-after-14-wallets-hacked
- Protos, 402bridge : https://protos.com/402bridge-private-key-leaks-227-wallets-drained-in-minutes/

**Fraude bancaire et réglementation**
- UK Finance, Annual Fraud Report 2026 : https://www.ukfinance.org.uk/system/files/2026-06/UK%20Finance%20Fraud%20Report%202026.pdf
- FinTech Futures, synthèse : https://www.fintechfutures.com/financial-crime-fraud-prevention/uk-payment-fraud-losses-topped-1-28bn-in-2025-new-uk-finance-report-finds
- MoFo, PSD3/PSR : https://www.mofo.com/resources/insights/260430-psd3-and-the-payment-services-regulation-key-developments
- PwC, PSD3 et responsabilité fraude : https://www.pwc.com/cz/cs/blog/rizeni-rizik/psd-3-the-psr-payments-reform.html
- Banque de France, VoP : https://www.banque-france.fr/system/files/2024-12/infoseri_333_service_de_verification_du_beneficiaire_vop.pdf
- Option Finance, VoP : https://www.optionfinance.fr/entreprise-finance/verification-du-beneficiaire-dun-virement-ce-que-change-lentree-en-vigueur-du-vop.html
- AMF, fin de la transition MiCA : https://www.amf-france.org/en/news-publications/news/end-mica-transitional-period-esma-sets-out-its-expectations-professionals-and-warns-retail-investors
- AMF, nouveau rôle (31 CASP) : https://www.amf-france.org/sites/institutionnel/files/pdf/79295/en/Crypto-assets_the_end_of_the_Pacte_law_and_European_MiCA_Regulation_transitional_period_establishes_a_new_role_for_the_AMF.pdf
- ESMA, Q&A DORA et CASP : https://www.esma.europa.eu/publications-data/questions-answers/2364
- Le Monde du Droit, rapport AMF sur les incidents DORA 2025 : https://www.lemondedudroit.fr/banque-finance/304-finance/105970-amf-rapport-sur-les-incidents-majeurs-en-2025-au-titre-du-reglement-dora.html
- ItDaily, Fideuram deepfake de 95 M€ : https://itdaily.com/news/security/major-italian-bank-defrauded-of-95-million-euros-criminals-use-deepfake-voice-of-ceo/
- Adaptive Security, statistiques deepfake 2026 : https://www.adaptivesecurity.com/blog/deepfake-statistics-2026-the-data-security-leaders-need-to-know
- Brussels Times, IA dans plus de 40 % des fraudes en Europe : https://www.brusselstimes.com/belgium/1068616/over-40-of-fraud-attacks-on-european-financial-institutions-now-use-ai/
- AU10TIX, Q1 2026 : https://www.au10tix.com/press-releases/ai-generated-identity-fraud-dominates-financial-services-as-confirmed-fraud-rates-rise-across-every-sub-sector-new-au10tix-data-shows/
- TransUnion UK, tendances 2026 : https://www.transunion.co.uk/blog/2026-fraud-trends

**Avalanche**
- Etna : https://www.avax.network/blog/etna-enhancing-the-sovereignty-of-avalanche-l1-networks
- Avalanche Academy, motivation Avalanche9000 : https://academy.avax.network/guide/etna-upgrade-motivation
- Docs eERC : https://docs.avax.network/integrations/encrypted-erc
- AvaCloud, eERC : https://avacloud.io/blog/why-avacloud-created-eerc
- Glacier / Webhooks : https://developers.avacloud.io/webhooks-api et https://docs.avax.network/tooling/glacier
- Blockaid × Core : https://blockaid.io/blog/blockaid-bolsters-security-on-avalanche-with-core-integration
- The Defiant, BUIDL sur Avalanche : https://thedefiant.io/news/defi/blackrock-s-buidl-pushed-avalanche-s-tokenized-asset-total-past-usd1-16b
- Retro9000 : https://avax.network/blog/retro9000-everything-you-need-to-know
- Team1 Mini Grants : https://docs.avax.network/grants/team1-mini-grants
- Crypto Briefing, Team1 Builder Grants : https://cryptobriefing.com/avalanche-team1-builder-grants-program/

**Outils**
- Forta 2025 : https://forta.org/blog/forta-2025-a-breakout-year-for-on-chain-risk-management-infrastructure
- Hypernative, série B : https://www.silicon.co.uk/press-release/hypernative-raises-40m-series-b-to-remove-security-barriers-to-web3-mass-adoption
- ForkLog, Consensys rachète Wallet Guard : https://forklog.com/en/news/consensys-acquires-wallet-guard-to-enhance-metamask-security
- Hypernative Wallet Protection : https://hypernative.io/products/wallet-protection

> Non vérifié ou à confirmer : la phase Retro9000 « 40 M$ » 2026, le montant exact de l'exploit Bankr (je n'ai pas trouvé le chiffre de 216 k$ cité par Blockaid ; les sources donnent environ 150 à 180 k$), la date d'application de PSD3/PSR, le FNC-RF de la Banque de France, et le rachat de Pocket Universe par Kerberus (source unique). Je n'ai trouvé aucun thread Reddit ou HN exploitable via la recherche, les gaps viennent donc de blogs et de rapports.

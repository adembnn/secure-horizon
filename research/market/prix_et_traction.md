# Prix et traction : qui paie quoi pour la sécurité des sorties de fonds crypto

Date de la recherche : 10 oct. 2026. Légende : [P] = source primaire (page éditeur, forum de gouvernance, communiqué), [S] = secondaire (presse, agrégateur), [V] = vérifié par lecture directe de la page pendant cette session, [?] = à vérifier. Une ligne sans URL n'est pas un fait chiffré.

## TL;DR

1. Les prix publics de la détection/pause on-chain sont rares. Le seul prix primaire exact : **Balancer DAO paie Hypernative 15 k$ (2023), 60 k$/an (2024, paquet de 4 services), 80 k USDC pour 2025-2026**. [P][V]
2. Les gros budgets des DAO vont aux audits et prestataires de sécurité, pas à la surveillance : **Compound ~2,04 M$/an (renouvellement proposé 1,70 M$)** et OpenZeppelin 4 M$/an en 2025. La surveillance en temps réel pèse 15 à 80 k$/an chez Balancer. [P][V]
3. Côté entreprises, les médianes Vendr sont à 40 k$/an (TRM), 39 k$ (Fireblocks), 150 k$ (Blockaid), 175 k$ (Chainalysis). [S][V]
4. Le capital afflue vers le segment (Blockaid 50 M$ série B, Hypernative 40 M$ série B, Elliptic 120 M$ série D à 670 M$, TRM 1 Md$), mais l'achat de sécurité par les DAO est lent et contesté (vote Compound rejeté).
5. Fourchette réaliste pour Sentinelle : 15 à 60 k$/an pour DAO/protocole, 40 à 150 k$/an pour CASP/fintech crypto, 100 à 250 k$/an (hypothèse) si le dossier DORA est vendu à une entité financière régulée. Canal : intégration policy/webhook dans les plateformes de garde (Fireblocks, BitGo) et Safe, puis direct.

## 1. Prix publics ou rapportés

| Éditeur / produit | Prix | Source | Statut |
|---|---|---|---|
| Hypernative, pour Balancer DAO (BIP-456) | 15 000 $ (conseil en sécurité opérationnelle, 2023) | https://forum.balancer.fi/search.json?q=Hypernative (sujet 5244, rapport T3 2023) | [P][V] |
| Hypernative, Balancer BIP-545 (fév. 2024) | **60 000 USDC/an, payés par trimestre**, paquet de 4 sections. Prix unitaires listés : conseil 15 k$, réponse à incident 10 k$ (banque de 160 h, 200 $/h au-delà), monitoring frontend 15 k$, monitoring on-chain et prévention 45 k$/an. Total à l'unité 85 k$, remise paquet 60 k$. Inclut la pause de contrats en pré-incident (V3). | https://forum.balancer.fi/t/5542.json | [P][V] |
| Hypernative, Balancer BIP-775 (renouvellement, fév. 2025) | **80 000 USDC** pour 2025-2026, valeur unitaire 119 k$ (remise paquet) | https://forum.balancer.fi/t/6329.json | [P][V] |
| Hypernative, prix catalogue | Aucun prix publié, « Request a Demo ». La page /pricing renvoie 404. | https://www.hypernative.io/ | [V] |
| Hypernative Guardian, Safe Shield | Non trouvé. Safe Shield est décrit comme « pré-exécution avec Blockaid, simulation avec Tenderly » ; la page Safe ne mentionne ni Hypernative ni Guardian. | https://safe.global/pricing | [V] |
| Safe Pro (multisig) | Starter 189 €/mois (2 Safes), Business dès 669 €/mois (5 à 20 Safes), Enterprise sur devis. Simulation incluse sur tous les paliers ; contrôles contrat/destinataire sur les paliers payants. Donne l'ordre de grandeur de ce qu'une équipe Safe accepte de payer. | https://safe.global/pricing | [P][V] |
| Blockaid | Médiane acheteur **150 000 $/an**, fourchette 87 000 à 600 000 $/an | https://www.vendr.com/marketplace/blockaid | [S][V] |
| Chainalysis (inclut Hexagate côté groupe) | Médiane **174 709 $/an**, fourchette 25 742 à 297 338 $. Onboarding 5 à 25 k$+, 5 à 15 k$ par réseau ajouté, hausse annuelle 3 à 7 %, remise 15 à 30 % en pluriannuel. Page « mise à jour fév. 2026 ». | https://www.vendr.com/marketplace/chainalysis | [S][V] |
| TRM Labs | Médiane **40 000 $/an**, fourchette 20 000 à 48 000 $ (page « 2025 », échantillon non indiqué) | https://www.vendr.com/marketplace/trm-labs | [S][V] |
| Elliptic | Pas de chiffre Vendr | https://www.vendr.com/marketplace/elliptic | [V] |
| Fireblocks | Médiane **39 000 $/an**, fourchette 10 826 à 216 000 $. Le prix de la licence ne détaille pas le moteur de politiques. | https://www.vendr.com/marketplace/fireblocks | [S][V] |
| BitGo | Pas de prix trouvé (page pricing 404, pas de chiffre Vendr) | https://www.vendr.com/marketplace/bitgo | [V] |
| Cobo (MPC) | Starter 299 $/mois (300 k$ de volume sortant), Standard 999 $/mois (1,25 M$), Enterprise sur devis ; frais de dépassement 0,16 à 0,20 % du volume sortant | https://www.cobo.com/pricing | [P][V] |
| Turnkey | Gratuit (25 signatures/mois, puis 0,10 $), Pro 99 $/mois min. (0,05 $/signature), Enterprise dès 0,0015 $/signature. La page se contredit (FAQ : 0,01 $). | https://turnkey.com/pricing | [P][V] |
| Range | Pas de prix publiés (pricing modulaire selon volume, modules et entités ; sandbox gratuit) | https://www.range.org/pricing | [P][V] |
| CertiK Skynet | « Request a quote », pas de prix | https://www.certik.com/products/skynet | [V] |
| Forta Firewall | Pas de prix, démo seule | https://forta.org/ | [V] |
| Cyvers | Pas de prix, démo seule | https://www.cyvers.ai/pricing | [V] |
| Hexagate, Venn/Ironblocks, Copper, Fordefi | Aucun prix trouvé. (Les pages Vendr « copper » et « forta » correspondent à d'autres produits : CRM et thérapie, ignorées.) | n/a | non trouvé |
| ServiceNow (global, non IRM) | Médiane 129 871 $/an (fourchette 43 245 à 702 488 $), la page ne couvre pas le module IRM | https://www.vendr.com/marketplace/servicenow | [S][V] |
| OneTrust | Médiane **12 000 $/an** (309 achats), fourchette 1 620 à 48 215 $ | https://www.vendr.com/marketplace/onetrust | [S][V] |
| Archer (GRC) | Prix non publié ; seuil de négociation indicatif « redline » 100 k$ | https://www.vendr.com/marketplace/archer | [S][V] |
| Regnology, 3rdRisk | Non trouvé (Vendr 404 pour Regnology) | n/a | non trouvé |

Remarques : les médianes Vendr agrègent des produits et tailles de clients différents ; elles bornent l'ordre de grandeur sans valoir devis. Les prix Hypernative de Balancer sont des remises « paquet » négociées avec une DAO, probablement bien en dessous du tarif entreprise [?].

## 2. Traction (clients, levées, rachats)

| Entité | Fait | Source | Statut |
|---|---|---|---|
| Hypernative | Série B 40 M$ (juin 2025), menée par Ten Eleven Ventures et Ballistic Ventures, avec StepStone ; plus de 200 projets Web3 ; 100 Md$+ d'actifs « protégés » ; valorisation et revenu non divulgués | https://pulse2.com/hypernative-40-million-series-b-raised-for-threat-prevention-platform/ | [S][V] |
| Hypernative | Série A 16 M$ (sept. 2024) | https://news.google.com/rss/search?q=Hypernative+funding+Series+B (AI Insider, 4 sept. 2024, titre seulement) | [S] titre |
| Hypernative | Revendique plus de 350 organisations ; logos : Fidelity, Coinbase, DTCC, Circle, Bullish, Invesco, Galaxy, OKX, FalconX, Kraken, Morpho ; cas : Balancer (19,3 M$ « sauvés »), Venus, Solv, Ethena. Chiffres de l'éditeur, non audités. | https://www.hypernative.io/ | [P][V] |
| Hexagate | Racheté par Chainalysis, annoncé 18 déc. 2024, « deal à 60 M$ » selon CTech (titre) | https://news.google.com/rss/search?q=Chainalysis+Hexagate+acquisition (CTech, 18 déc. 2024) | [S] titre, prix à confirmer |
| Chainalysis | Valorisation 8,6 Md$ (mai 2022) ; rachat d'Alterya (150 M$ selon CTech, 13 janv. 2025) | https://en.wikipedia.org/wiki/Chainalysis ; RSS Google News ci-dessus | [S] |
| Blockaid | Série A 33 M$ (oct. 2023), série B 50 M$ (18 fév. 2025, Ribbit, GV) ; MetaMask utilise Blockaid | https://news.google.com/rss/search?q=Blockaid+raises+funding | [S] titres |
| Cyvers | 8 M$ (déc. 2022, Elron) | https://news.google.com/rss/search?q=Cyvers+raises+funding | [S] titre |
| Fireblocks | 8 Md$ de valorisation (janv. 2022) ; 100 M$ d'ARR (sept. 2022) ; rachat de TRES Finance 130 M$ (janv. 2026) ; clients cités : ABN AMRO, BNY, BNP, Revolut, Visa, Western Union, MoonPay ; revenu 2023 estimé 113,7 M$ par GetLatka (non fiable) | https://www.fireblocks.com/ ; RSS Google News « Fireblocks valuation » | [P][S] |
| Fordefi | Racheté par Paxos pour plus de 100 M$ (25 nov. 2025) | https://news.google.com/rss/search?q=Fordefi+Paxos+acquisition (Fortune, 25 nov. 2025) | [S] titre |
| BitGo | IPO NYSE janv. 2026, valorisation d'environ 2,59 Md$ au démarrage (Reuters, 23 janv. 2026) ; le titre est à -55 % depuis l'IPO au 28 sept. 2026 (Seeking Alpha). Les chiffres de revenu du flux sont incohérents (3,8 Md$ vs 16,2 Md$), non retenus. | https://news.google.com/rss/search?q=BitGo+IPO+revenue+2026 | [S] titres |
| Turnkey | 12,5 M$ (mai 2026) | https://news.google.com/rss/search?q=Cobo+OR+Copper+OR+Turnkey+raises | [S] titre |
| Copper | Discussions IPO (CoinDesk, 29 janv. 2026) | idem | [S] titre |
| TRM Labs | Série C 70 M$ à 1 Md$ (4 fév. 2026) ; extension à 2 Md$ (9 sept. 2026) | https://news.google.com/rss/search?q=Elliptic+OR+TRM+Labs+raises+valuation | [S] titres, [?] |
| Elliptic | Série D 120 M$ à 670 M$ (mai 2026) | idem | [S] titre |
| Forta, Range, Venn/Ironblocks, CertiK Skynet | Pas de levée trouvée ; Skynet cite 17 000+ projets surveillés (non clients) | https://www.certik.com/products/skynet | [V] |
| Visa-BioCatch, Palo Alto | Non vérifié dans cette session | n/a | [?] |

Les liens « news.google.com/rss/search » sont des requêtes d'agrégation : le titre, la source et la date viennent du flux, pas de la lecture de l'article. À remplacer par les URL d'article avant le pitch.

## 3. Budgets

### DAO et protocoles (propositions de gouvernance)

| DAO | Dépense | Source | Statut |
|---|---|---|---|
| Balancer | Hypernative : 15 k$ → 60 k$/an → 80 k$ (2 ans) | cf. section 1 | [P][V] |
| Compound | Prestataires de sécurité : 2 036 000 $/an actuels (ChainSecurity et Certora 1,75 M$, zeroShadow 250 k$, ChainPatrol 36 k$) ; renouvellement 2026-27 proposé 1 695 000 $ (1 395 000 $ sans vCISO). **Le vote Snapshot a rejeté (627 k COMP pour, 1,80 M contre)** mais le comité dit qu'il financera quand même. | https://www.comp.xyz/t/8071.json | [P][V] |
| Compound | OpenZeppelin : 4 M$/an (renouvellement 2025, flux en COMP). Un participant cite Aave à environ 1,7 M$/an de sécurité. | https://www.comp.xyz/t/6855.json | [P][V], comparaison Aave non vérifiée |
| Aave | ACI aurait reçu 4,625 M$ depuis mars 2023 (hors sécurité) ; Chaos Labs quitte Aave (avril 2026) | https://governance.aave.com/search.json?q=Chaos%20Labs%20budget%20per%20year | [P][V], hors périmètre |
| Lido, ENS, Sky, Optimism, Compound | Utilisent Hypernative (Guardian en cours chez Lido, avril 2026 ; alertes pour la dotation ENS via kpk) mais **aucun montant public** | https://research.lido.fi/t/11364.json ; https://discuss.ens.domains/search.json?q=Hypernative | [P][V] |
| Uniswap, Arbitrum | Aucune ligne de budget de monitoring trouvée | recherches forum | non trouvé |

Lecture : la surveillance/pause est une ligne de 15 à 80 k$/an, 20 à 50 fois moins que l'audit continu. Les DAO la prennent surtout parce qu'un conseiller (Karpatkey/kpk, BLabs) l'impose.

### Exchanges et CASP

Aucun budget sécurité public d'exchange ou de CASP trouvé en 10 requêtes. Seul indicateur : médianes Vendr (section 1) et le fait que Hypernative, Blockaid et Fireblocks revendiquent des exchanges (Coinbase, Kraken, OKX, Bullish) comme clients. [?] budget réel inconnu.

### Coût de mise en conformité DORA

Non trouvé en source primaire chiffrée. La page Deloitte « DORA European Survey 2025 » (15 juil. 2025) existe mais n'a pas pu être lue ; l'étude d'impact de la Commission (SWD(2020)198) n'a pas pu être lue non plus. À vérifier avant toute affirmation chiffrée. [?]

## 4. Ce que les acheteurs paient déjà

| Besoin | Qui vend | Niveau de prix observé |
|---|---|---|
| Surveillance on-chain et pause | Hypernative, Forta, Cyvers, Hexagate | 15 à 80 k$/an (DAO) ; entreprise : sur devis |
| Pré-signature, simulation | Blockaid, Tenderly, Safe Shield | Blockaid 87 à 600 k$/an ; Safe Pro 189 à 669 €/mois, simulation incluse |
| Garde MPC et policy engine | Fireblocks, BitGo, Cobo, Turnkey | 39 k$/an médian (Fireblocks) ; Cobo 299 à 999 $/mois |
| Conformité transactionnelle | Chainalysis, TRM, Elliptic | 40 à 175 k$/an |
| Audit et conseil sécurité | OpenZeppelin, ChainSecurity, Certora, zeroShadow | 1 à 4 M$/an par DAO |
| Assurance | Non étudié dans cette session | [?] |
| GRC / DORA (registre, tiers) | OneTrust, ServiceNow, Archer | OneTrust 12 k$ médian ; ServiceNow 130 k$ médian (global) |

## 5. Synthèse

**Qui paie le plus et le plus facilement.** (1) Les acheteurs réglementés et les exchanges paient le plus (médianes 150 à 175 k$) et achètent sur budget récurrent, mais le cycle est long et la preuve est faible ici. (2) Les DAO paient peu (15 à 80 k$) sur un vote public, avec un risque de rejet comme à Compound ; elles sont rapides à signer quand un conseiller le recommande. (3) Émetteurs RWA et stablecoins : acheteurs plausibles (Hypernative cite Circle, Ethena, Invesco ; Paxos a racheté Fordefi) mais aucun prix public [?].

**Fourchette réaliste pour Sentinelle (hypothèses fondées sur les repères ci-dessus, pas sur des devis).**

| Segment | Fourchette annuelle | Ancrage |
|---|---|---|
| DAO / protocole | 15 à 60 k$ | Balancer 15 k$ à 80 k$ |
| Équipe Safe / petite trésorerie | 2 à 8 k$ (189 à 669 €/mois) | Safe Pro |
| CASP / fintech crypto | 40 à 150 k$ | TRM 40 k$, Blockaid 150 k$ |
| Entité financière régulée UE (contrôle + dossier DORA) | 100 à 250 k$ [hypothèse] | Chainalysis 175 k$ ; coût DORA non sourcé |

Un produit sans historique doit se positionner à la borne basse de chaque segment, avec un pilote.

**Canal de vente.** Le plus cohérent avec le code existant : brancher le contrôle indépendant sur les politiques de garde (webhook BitGo, API Fireblocks) puis vendre aux utilisateurs de ces plateformes ; Safe est un deuxième canal mais Safe Shield dépend déjà de Blockaid et Tenderly ; les DAO s'atteignent via leurs conseillers de trésorerie (kpk/Karpatkey, BLabs). Le canal Big4 n'est pas documenté ici [?]. Pas de preuve que la marketplace Fireblocks accepte des tiers [?].

## Limites

Les moteurs de recherche étaient bloqués : la découverte a utilisé des API de forums Discourse, Vendr, pages éditeur et flux d'actualités (titres seulement). Les prix d'exchanges, le coût DORA, l'assurance, Visa-BioCatch, Palo Alto, Copper/Cobo/Fordefi (tarifs entreprise), 3rdRisk et Regnology restent non trouvés.

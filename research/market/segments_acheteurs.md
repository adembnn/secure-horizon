# Segments d'acheteurs d'un contrôle des sorties de fonds indépendant : chiffres 2025-2026

> Recherche du 2026-10-10. Légende : **[P]** page/API primaire lue ; **[S]** presse ou agrégateur ; **[V]** vendeur ou source unique ; **à vérifier** = non recoupé. Le règlement `context/notion_guide.md` prime. Complète `research/tracks/T1_P4_chiffres_2026.md` (pertes globales, Bitget, DORA).
> Les cabinets (CertiK, TRM, SlowMist, Chainalysis) comptent différemment : ne pas additionner.

## TL;DR

1. **CEX/CASP** : 158 CEX suivis dans le monde (CoinGecko), ~362 CASP agréés MiCA (36 en France). Pertes CEX 2025-2026 (liste ci-dessous) : ~2,1 Md$ dont Bybit 1,44-1,5 Md$ et Bitget 387,5 M$ (24 sept. 2026, circuit de retrait falsifié via appliances tierces). C'est le segment qui cumule le plus de pertes dues au circuit d'approbation.
2. **Trésoreries DAO/protocoles** : pas de total fiable obtenu (DeepDAO/Llama bloqués). Safe revendique « 60 Md$+ sécurisés, 60 M+ comptes » [V]. Pertes 2026 : Drift 285 M$ (pré-signature du Security Council par ingénierie sociale), KelpDAO 290 M$ (vérificateur unique), AFX 24 M$ (5 signatures de validateurs).
3. **RWA/stablecoins** : RWA « distribué » 39,2 Md$ (rwa.xyz, 10 oct. 2026), bons du Trésor tokenisés 14,9 Md$, stablecoins 293 Md$. Avalanche 1,75 Md$ (Securitize 879 M$). Aucun vol d'émetteur RWA régulé trouvé ; incidents = Resolv (24,5 M$, clé via infra, mars 2026).
4. **DAT (trésoreries d'entreprises)** : ~180 entreprises en BTC (1,92 M BTC tous détenteurs, 159 Md$) et 34 en ETH (8,03 M ETH, 20 Md$) ; très concentré (Strategy 848 k BTC, BitMine 6,0 M ETH). Aucun vol de DAT trouvé : pertinence réelle mais pas prouvée par des pertes.
5. **Market makers/fonds** : quasi aucune donnée publique. Seul cas 2025-2026 trouvé : bot de market-making Bitget exploité, 100 M$ (avr. 2025, DeFiLlama). Segment à ne pas présenter comme cible chiffrée.

## 1. CEX et CASP MiCA

| Chiffre | Valeur | Source | Q |
|---|---|---|---|
| CEX suivis dans le monde | 158 ; volume 24 h ~51 Md$ (Coinbase, Kraken, Binance, OKX, MEXC en tête) | https://www.coingecko.com/en/exchanges (10 oct. 2026) | P (agrégateur) |
| CASP agréés MiCA (UE/EEE) | ~362 au 7 oct. 2026 (Allemagne 96, France 36, Pays-Bas 29) | https://www.outrun.at/micar-dashboard, déjà lu dans T1_P4_chiffres_2026.md | S |
| Recoupement CSV ESMA | ~224 lignes lues sur la 1re moitié (DE ~103, FR 36+, CY 25, ES 15, AT 11, CZ 12) + 146 sur la 2e (NL 29, MT 23, LU 13, IE 12, LV 12, LI 12, IT 9) = ~370 lignes, dont d'éventuels retraits ; « Last update 7 octobre 2026 » | https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv | P (comptage approximatif, tronqué) |
| Noms agréés lus | Coinbase Luxembourg, Kraken (Irlande), Bitstamp (LU), OKX Europe (MT), Crypto.com (MT), Bitvavo (NL), Gemini (MT), Bitpanda (AT/DE/MT), Bybit EU (AT), BitGo Europe (DE). Binance, Copper, Fireblocks non vus | CSV ESMA | P |
| Réserves en bourse (indicatif) | Binance « 172,6 Md$ d'exchange reserves » (sans date ni méthode) | https://www.coingecko.com/en/exchanges/binance | S, à vérifier |
| Preuve de réserves Bitget | 131 % de couverture (BTC 142 %, ETH 110 %) au 29 sept. 2026 ; fonds de protection 464 M$ avant, 309 M$ au 30 sept. | https://247wallst.com/investing/cryptocurrency/2026/10/03/bitget-rebuilt-a-309-million-protection-fund-after-a-388-million-hack-is-your-crypto-safe-on-an-exchange/ | S |
| Montants en hot/warm wallets | **Non trouvé** de façon agrégée. Seul repère : Bitget a perdu 387,5 M$ en hot/warm sur ~3 h, cold wallets intacts. Binance PoR : page sans chiffres lisibles | https://www.bleepingcomputer.com/news/security/bitget-hacked-via-zero-day-in-third-party-security-products/amp/ ; https://www.binance.com/en/proof-of-reserves | S / P |
| Part MPC (Fireblocks, Copper, BitGo, Cobo) vs maison | **Non trouvé**. Fireblocks cite ABN AMRO, Revolut, GSR, QCP mais aucun chiffre sur sa page. Paxos a racheté Fordefi (déc. 2025) | https://www.fireblocks.com/ ; https://safe.global/blog/best-self-custody-wallet-for-teams-and-institutions | V |

### Pertes CEX/paiement 2025-2026 (dates et montants rekt.news, sauf mention)

| Entité | Date | Montant | Cause connue | Source |
|---|---|---|---|---|
| Bybit | 21 févr. 2025 | 1,436 Md$ (Chainalysis : 1,5 Md$, 44 % du total 2025) | Compromission de l'infrastructure de signature (Safe), RPDC | https://rekt.news/leaderboard ; https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/ |
| Phemex | 23 janv. 2025 | 73,5 M$ | hot wallets | rekt |
| BtcTurk | 14 août 2025 | 51,7 M$ | hot wallets (cause à vérifier) | rekt |
| CoinDCX | 18 juil. 2025 | 44,3 M$ | compte opérationnel (à vérifier) | rekt |
| SwissBorg | 8 sept. 2025 | 41,5 M$ | prestataire de staking (à vérifier) | rekt |
| BigONE | 15 juil. 2025 | 27 M$ | à vérifier | rekt |
| WOO X | 24 juil. 2025 | 14 M$ | à vérifier | rekt |
| GANA Payment | 20 nov. 2025 | 3,1 M$ | à vérifier | rekt |
| Triple-A (paiements) | 24 juil. 2026 | 9,7 M$ | clé de hot wallet | https://api.llama.fi/hacks |
| Duelbits (casino) | 24 sept. 2026 | 7 M$ | clé de hot wallet | https://hacked.slowmist.io/ |
| **Bitget** | 24-25 sept. 2026 | **387,5 M$** | zero-days dans 2 appliances de sécurité tierces, serveur de jobs de wallet et outil de retrait compromis, ordres falsifiés ; sans clé volée selon Bitget | BleepingComputer, rekt, SlowMist |

Total listé : ~2,13 Md$ (calcul, hors Nobitex/Upbit absents de rekt). Bybit + Bitget = ~1,83 Md$ (86 %). Chainalysis : services centralisés = 88 % des pertes du T1 2025 ; 2025 > 3,4 Md$ au total.

Où sont les fonds : hot/warm wallets pilotés par un serveur de retrait (EOA ou MPC maison), cold storage en retrait. Un plafond de sortie indépendant s'applique au flux hot/warm, pas au cold.

## 2. Trésoreries on-chain des protocoles et DAO

| Chiffre | Valeur | Source | Q |
|---|---|---|---|
| Valeur sécurisée par Safe | « 60 Md$+ », « 60 M+ comptes », 1 000 Md$+ de volume | https://safe.global/ (10 oct. 2026) | V |
| Total trésoreries DAO (DeepDAO, Llama, karpatkey, Steakhouse) | **Non trouvé** : DeepDAO sans chiffres, DeFiLlama /treasuries (HTTP 402/403). karpatkey (kpk) : « 8 Md$+ déployés » (non qualifié d'AUM) | http://kpk.io/ | V |
| Nombre de trésoreries > 10 M$ | **Non trouvé** | n.d. | n.d. |
| Part en Safe | **Non trouvé** (Safe ne publie pas la part des DAO) | n.d. | n.d. |
| Hacks DeFiLlama 2025 | ~432,7 M$ sur 42 entrées visibles ; Key Compromise 6 entrées, 7,8 M$ (partiel) | https://api.llama.fi/hacks (tronqué) | P partiel |
| Hacks DeFiLlama 2026 | ~559-597 M$ sur 74-76 entrées ; Key Compromise 8-11 entrées, 145-435 M$ selon la partie lue (Bitget y est classé) | idem | P partiel, ne pas citer comme total |

Incidents 2026 par détournement du circuit de signature (sources : https://crypto.news/defi-hacks-2026-billion-lost-same-attack-keeps-working/ [S], rekt, DeFiLlama) :

| Incident | Date | Montant | Mécanisme |
|---|---|---|---|
| Drift (Solana) | 1er avr. 2026 | 285 M$ | Mois d'ingénierie sociale, autorité pré-signée du Security Council via durable nonce, vidage en 128 s, RPDC. Rekt affiche « 4/1/2025 » : erreur de date probable de rekt |
| KelpDAO (pont LayerZero) | 18 avr. 2026 | 290-292 M$ | Développeur LayerZero piégé, RPC empoisonnés, vérificateur unique, 116 500 rsETH mintés ; 47 % des OApps en vérificateur unique |
| AFX Trade (pont) | 22 juil. 2026 | 24,15 M$ | 5 signatures de validateurs compromises (quorum 2/3) |
| Gravity Bridge | 30 mai 2026 | 5,4 M$ | clé de validateur |
| KITE Foundation | 5 août 2026 | 13,3 M$ | clé privée |
| 79th Vault (BNB) | 7 oct. 2026 | 12,5 M$ | clé hot wallet opérateur |
| TermFinance | août 2026 | 8,5 M$ | gouvernance (participation quasi nulle) |

Total de ces incidents de signature/clé en DeFi 2026 : ~640 M$ (calcul, Drift+Kelp = 575 M$, soit 90 %). Les cas UXLINK (41 M$, 22 sept. 2025, rekt), Infini (49,5 M$, rekt le date 24 févr. 2024 : date à vérifier, probablement févr. 2025) et Radiant (53 M$, 16 oct. 2024 selon rekt, donc hors période) : voir note de dates.

Où sont les fonds : Safe (multisig on-chain, ex. Bybit), contrats avec rôles admin/pauser, bridges (vérificateurs), EOA deployer. Le « plafond que le circuit piraté ne peut pas lever » est ici très pertinent car les signataires (Drift) ont été trompés, pas contournés.

## 3. RWA tokenisés, fonds tokenisés, stablecoins

| Chiffre | Valeur | Source | Q |
|---|---|---|---|
| RWA « distribué » total | 39,17 Md$ ; 5,2 M détenteurs (au 10 oct. 2026) | https://app.rwa.xyz/networks | P |
| Autres méthodes | CoinGecko catégorie RWA : 77 Md$ de capitalisation (tokens) ; The Block : ~122 Md$ implicite (8 oct. 2026, méthodes incohérentes avec ~153 Md$ par émetteur) | https://www.coingecko.com/en/categories/real-world-assets-rwa ; https://www.theblock.co/data/decentralized-finance/real-world-assets | S |
| Bons du Trésor tokenisés | 14,86 Md$ distribués, 117 fonds, 86 232 détenteurs ; Circle USYC 2,38 ; Ondo USDY 2,32 ; BlackRock BUIDL 2,20 ; Franklin iBENJI 1,71 ; WisdomTree WTGXX 1,23 ; JPM JLTXX 0,74 Md$ | https://app.rwa.xyz/treasuries (10 oct. 2026) | P |
| Ethereum | 16,95 Md$ distribués, 288 k détenteurs | https://app.rwa.xyz/networks | P |
| Avalanche | 1,75 Md$ distribués (1,73 Md$ sur la page réseau), 10 071 détenteurs ; « représenté » 11,4 Md$ (artefact, un seul token Bridgetower ; ne jamais citer) | https://app.rwa.xyz/networks/avalanche ; https://bitquery.io/investigations/avalanche-real-world-assets-one-token | P / S |
| Émetteurs sur Avalanche | Securitize 879 M$ (8 RWA) ; Circle 450 M$ ; Tether 304 M$ ; Centrifuge 263 M$ ; BUIDL 402 M$ au 30 juin (Nansen) | rwa.xyz ; https://nansen.ai/post/avalanche-q2-2026-report | P |
| Stablecoins | 293 Md$ (USDT 183 Md$, USDC 71 Md$, ~87 %) ; 296 M de détenteurs | https://app.rwa.xyz/stablecoins | P |
| Émetteurs régulés européens (MiCA EMT, fonds UCITS tokenisés) | **Non trouvé** : pas de comptage chiffré | n.d. | n.d. |

Incidents 2025-2026 : Resolv USR, 21 mars 2026, 24,5 M$, « clé fuitée via l'infrastructure » (DeFiLlama, https://api.llama.fi/hacks, partiel). Liquid Network 319-320 M$ (6 sept. 2026, bug de mint, ~85 % rendu, TRM https://www.trmlabs.com/resources/blog/2026s-biggest-hack-to-date-attackers-drained-usd-319-million-in-bitcoin-from-liquid-network-then-returned-85-of-funds) : pas un détournement d'approbation. Aucun vol d'émetteur de fonds tokenisé régulé (BUIDL, USYC, etc.) trouvé.

Où sont les fonds : contrats (mint/burn avec rôles admin et opérateurs de transfer agent), trésoreries d'émetteur en custody. Le risque est le mint non autorisé (Resolv, Kelp) plus que le vol de réserves.

## 4. Entreprises avec trésorerie crypto (DAT)

| Chiffre | Valeur | Source | Q |
|---|---|---|---|
| Entités BTC | 193 entités, dont 13 États : ~180 entreprises ; 1 919 472 BTC (9,14 % de l'offre), ~159 Md$ | https://www.coingecko.com/en/treasuries/bitcoin (10 oct. 2026, sans date affichée) | S |
| Principaux | Strategy 847 999 BTC (~70 Md$) ; Twenty One 43 514 ; Metaplanet 43 000 ; MARA 35 303 | idem | S |
| Entités ETH | 34 entreprises, 8,03 M ETH (6,58 % de l'offre), ~20 Md$ ; BitMine 6,02 M ETH (~15 Md$, ~75 % du total), SharpLink 869 k, Ether Machine 497 k | https://www.coingecko.com/en/treasuries/ethereum | S |
| Toutes crypto | 245 entités, 189 Md$ ; 84 % BTC, 11 % ETH, 5 % autres ; 232 entreprises | https://www.coingecko.com/en/treasuries | S |
| Mode de garde | **Non trouvé** par source lue (strategy.com 403, bitcointreasuries.net en erreur). À vérifier : Strategy et MARA via Coinbase Custody (connaissance non sourcée) | n.d. | à vérifier |
| Incidents | Aucun vol de DAT trouvé 2025-2026. CoinDesk évoque un « shakeout » 2026 du modèle (risque financier, pas sécurité) | https://www.coindesk.com/tag/digital-asset-treasury/ | S |

Où sont les fonds : custodians qualifiés (MPC ou cold institutionnel). Un contrôle indépendant des sorties est pertinent en gouvernance, mais ces acteurs ont déjà politiques et quorum chez le custodian : pas de preuve de perte.

## 5. Market makers et fonds

- Aucune taille d'ordre de grandeur sourcée (pas de source primaire lue).
- Incident : Bitget, 20 avr. 2025, 100 M$, « bot de market-making exploité » (classé Market Manipulation) : https://api.llama.fi/hacks [P partiel]. Pas de vol d'approbation.
- Clients de Fireblocks cités sur sa page : GSR, QCP (market makers) [V] : le MM est un client de garde MPC, pas un segment documenté.

## 6. Vols 2025-2026 : contexte global

| Chiffre | Valeur | Source |
|---|---|---|
| 2025 | > 3,4 Md$ volés ; RPDC ≥ 2,02 Md$ (+51 %), 76 % des compromissions de services ; portefeuilles personnels ~713 M$ | https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/ [P] |
| 2026 YTD | 1,73 Md$, 333 incidents au 8 sept. (TRM) ; CertiK ~2,68 Md$ cumul fin T3 ; ~76 % des pertes H1 = infra/clés/signature (TRM) | https://www.trmlabs.com/... (ci-dessus) ; T1_P4_chiffres_2026.md |

## 7. Tableau comparatif

| Segment | Nb d'entités | Valeur détenue | Pertes 2025-2026 (circuit d'approbation) | Où sont les fonds | Pertinence contrôle des sorties |
|---|---|---|---|---|---|
| CEX / CASP | 158 CEX monde ; ~362 CASP UE (36 FR) | Non agrégé (Binance « 172 Md$ », non daté, à vérifier) | ~2,1 Md$ listés (Bybit 1,44 Md$, Bitget 387,5 M$, Phemex, BtcTurk...) | Hot/warm wallets serveur (EOA, MPC maison), cold à part | **Très forte** : plus gros sinistres, DORA obligatoire, mais acheteurs lourds |
| Trésoreries DAO / protocoles | Non trouvé | Safe « 60 Md$+ » [V] ; total DAO non trouvé | ~640 M$ en 2026 (Drift 285, Kelp 290, AFX 24...) | Safe multisig, contrats admin, ponts | **Forte** : signataires trompés, déploiement simple ; DORA moins applicable |
| RWA / stablecoins | 117 fonds Trésor ; Avalanche 10 k détenteurs | RWA 39,2 Md$ (rwa.xyz) ; Trésor 14,9 Md$ ; stablecoins 293 Md$ ; Avalanche 1,75 Md$ | Resolv 24,5 M$ ; aucun vol d'émetteur régulé | Contrats mint/burn, custody émetteur | **Moyenne à forte** : risque de mint non autorisé, émetteurs régulés (DORA), peu de pertes avérées |
| DAT | ~180 (BTC) + 34 (ETH) ; 232 au total | 189 Md$ ; très concentré | Aucune trouvée | Custodians qualifiés | **Faible à moyenne** : gros montants, pas de pertes, garde déjà institutionnelle |
| Market makers / fonds | Non trouvé | Non trouvé | Bitget MM bot 100 M$ (autre vecteur) | Comptes exchange, wallets | **Inconnue** : ne pas chiffrer |

## 8. Non trouvé ou à vérifier

- Total et nombre de trésoreries DAO > 10 M$, part en Safe : DeepDAO, DeFiLlama (402/403), Karpatkey sans chiffres.
- Part MPC vs maison, montants hot/warm agrégés, Arkham/Nansen CEX : aucune source lisible.
- Custodians des DAT, MM, émetteurs européens régulés : non trouvés.
- Dates rekt douteuses : Drift (« 2025 », sources : 1er avr. 2026), Infini (« 2024 »). Montants Coldcard 112,7-130 M$ selon la source. Bitget : 351,6 M$ dans un titre lié (BleepingComputer), 387,5 M$ ailleurs.
- Les listes DeFiLlama/rekt lues sont partielles (tronquées) : pas de totaux annuels fiables.

## 9. Mapping réglementaire (règle projet)

- NIST CSF 2.0 : PR.AA (accès), PR.PS, DE.CM / DE.AE (détection des sorties anormales), RS.MA / RS.MI (blocage), GV.SC (tiers : Bitget, LayerZero).
- ATT&CK : T1657 (Financial Theft), T1078 (Valid Accounts), T1566 (Phishing / ingénierie sociale), T1195 (supply chain), T1199 (Trusted Relationship).
- D3FEND : D3-UAP (User Account Permissions) et D3-OTP (One-time Password) à confirmer, D3-NTA pour l'analyse du trafic réseau ; IDs à vérifier avant usage.
- OWASP Agentic (ASI) et ATLAS : applicables seulement si un agent IA approuve ou exécute le paiement.

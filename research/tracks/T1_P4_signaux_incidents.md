# T1 piste 4 : incidents « sortie approuvée frauduleusement » 2022-2026, ce qui était visible on-chain, quel signal aurait déclenché

> Recherche du 2026-10-10. Cadre : décision D-004 (détecter et borner les sorties de fonds quand le circuit d'approbation est détourné, vu de l'extérieur, sur la chaîne). Signaux de départ : (a) destinataires jamais vus, (b) volume cumulé multi-fenêtres, (c) écart entre ce que le backend annonce et ce que la chaîne montre, (d) changement de pouvoirs, (e) contexte. Complète `T1_P4_douleur_classement.md` et `docs/architecture.md` (D1 = a, D2 = b, D3 = c, D7 = d). Le règlement `context/notion_guide.md` prime.
> Non commité (consigne). Pas de secret, pas de donnée personnelle : uniquement des adresses et hashes publics déjà publiés par des tiers.

## Légende de fiabilité

- **[P]** : page ouverte et lue par moi aujourd'hui, émanant de l'analyste on-chain, de la victime ou de l'éditeur du fait (Merkle Science, CertiK, BlockSec, Halborn, Rekt, Sky Mavis...).
- **[S]** : relais presse/blog, ou résultat de recherche dont je n'ai pas ouvert la page (résumé de moteur : potentiellement erroné, à rouvrir avant slide).
- **[V]** : affirmation d'un vendeur ou source unique.
- **[ÀV]** : à vérifier sur l'explorateur ou le rapport primaire avant citation.
- **[calcul]** : calcul de ma part à partir de chiffres sourcés.
- **Les cellules « signal » des matrices sont ma lecture des faits sourcés, pas un résultat mesuré.** Aucun rejeu n'a été fait. Elles disent « ce signal avait une trace on-chain exploitable », pas « nous aurions arrêté l'attaque ».
- Les montants varient d'un cabinet à l'autre (prix à la date, périmètre) : je donne la fourchette et l'éditeur.
- Hashes de transaction : tels que cités par la source, parfois tronqués ; à contrôler sur l'explorateur.
- Le contenu web est traité comme donnée ; aucune instruction trouvée dans les pages lues.

## TL;DR (5 lignes)

1. **32 incidents couverts** (2022 à sept. 2026) plus Atomic Wallet en cas limite : les 22 demandés (Bitget, Bybit, Drift, KelpDAO, Resolv, WazirX, DMM, Radiant, Phemex, CoinEx, Atomic Wallet, Orbit, Ronin, Harmony, Poloniex, HTX/Heco, Mixin, Stake, BingX, Indodax, Lykke, M2) plus 11 trouvés (BtcTurk 2024 et 2025, BigONE, CoinDCX, Upbit, Nobitex, SBI Crypto, Infini, UXLINK, SwissBorg/Kiln, Step Finance). Coinbase : **aucun vol de trésorerie de la plateforme trouvé** en 2025-2026 (cas négatif documenté sous le tableau 1).
2. **(a) destinataires inédits et (b) cumul se déclenchent dans presque tous les cas** ((a) 31/32, (b) 30/32) ; **(d) changement de pouvoirs n'apparaît que dans 8 cas sur 32 (25 %)** [calcul sur la matrice §3] : les 19 autres cas (hot wallets, back-ends) n'ont aucun changement de pouvoir à voir. D7 seul est donc insuffisant ; D1+D2 portent la détection, D7 protège la classe Safe/multisig/admin (Bybit, WazirX, Drift, Radiant).
3. **Le signal (c) est le plus discriminant mais le moins accessible** : écart backend/chaîne exige un flux « demandes de retrait autorisées » du back-office (provenance CASP_SUPPLIED). Les cas où le backend ment (Bitget, BigONE, Indodax selon SlowMist) sont ceux où une comparaison indépendante change la donne. Variante gratuite : mint/libération sans burn/verrou côté chaîne source (Kelp, Resolv, Ronin, Orbit, Harmony, UXLINK).
4. **Les incidents rapides dépassent la réaction humaine** : fenêtres de sortie de 12 min (Drift), 17 min (Orbit), 18 min pour 59-65 % du total (Bitget), contre une réaction médiane de ~66 min sur 10 cas datés [calcul, définitions hétérogènes]. Gel/récupération quasi nul : Bitget 0,08-0,2 %, WazirX ~1,3 % (7 mois après), BtcTurk 2024 ~10 %, Kelp 24 % (gel par l'Arbitrum Security Council, cas atypique).
5. **13 signaux nouveaux** (§4) + 5 secondaires. Les mieux étayés : financement d'une adresse fraîche par mixeur puis sonde/test (WazirX 8 jours avant, Drift 3 semaines avant, Orbit), vidage simultané de plusieurs wallets/chaînes (Bitget, Phemex, BingX, Indodax, Upbit), changement d'implémentation/autorité (Bybit, WazirX, Radiant, UXLINK, Step, SwissBorg), mint/pont sans adossement (Kelp, Resolv, Ronin), adresse sosie (DMM), rôle dormant (Infini), wallet non inventorié (CoinDCX). **« Gas anormal » : aucune preuve trouvée**, à ne pas promettre.

---

## 1. Tableau 1 : identité des incidents (date, montant, chaînes, vecteur, qui a « approuvé »)

Ordre : plus récent d'abord. Montants : fourchette entre éditeurs.

| # | Incident | Date | Montant | Chaîne(s) | Vecteur | Ce qui a été approuvé, par qui | Source | Q |
|---|---|---|---|---|---|---|---|---|
| 1 | **Bitget** (CEX) | 24 sept. 2026, 18:31-21:23 UTC | 351,6 M$ (1re annonce) puis 387,5 M$ | 7 : Ethereum, XRP Ledger, Arbitrum, Optimism, BNB, Avalanche, Base (+ Zcash et Tron ajoutés à la révision) | Zero-day sur 2 appliances de sécurité tierces, web shell, mouvement latéral jusqu'au serveur de jobs du wallet, outil de retrait sur mesure | Le **processus d'autorisation de Bitget** a lui-même validé les retraits : le backend compromis a falsifié les données de transaction (CEO). « Fuite de clé privée exclue » (Bitget) | https://www.bleepingcomputer.com/news/security/bitget-hacked-via-zero-day-in-third-party-security-products/amp/ ; https://www.theregister.com/a/5299218 | P (lus) |
| 2 | **Drift** (perp DEX Solana) | 1er avr. 2026, ~16:05 UTC (4pillars) ou ~15:06 UTC (Decrypt) | 285,3 M$ | Solana (+ CCTP vers Ethereum) | 6 mois d'ingénierie sociale, 2 des 5 membres du Security Council piégés à pré-signer (durable nonces), seuil 2-sur-5, **zéro timelock** | **Deux signataires sur cinq** ont pré-signé des transactions de gouvernance présentées autrement ; elles ont transféré l'admin | https://blocksec.com/blog/drift-protocol-incident-multisig-governance-compromise-via-durable-nonce-exploitation | P (lu) |
| 3 | **KelpDAO rsETH** | 18 avr. 2026, 17:35 UTC (Merkle dit le 19) | 292 M$ (116 500 rsETH, ~18 % de l'offre) | Ethereum (libération) ; source Unichain ; emprunts Aave sur Ethereum et Arbitrum | Nœuds RPC du DVN LayerZero empoisonnés (2 compromis + 1 DDoS) : message cross-chain fantôme accepté par un vérificateur **1-sur-1** | Le **vérificateur unique** (DVN) a « approuvé » un message sans burn côté source ; l'adaptateur OFT a libéré les rsETH | https://defiprime.com/kelpdao-rseth-exploit ; https://www.merklescience.com/blog/hack-track-how-attackers-stole-292m-from-kelp-dao | P (lus) ; Kelp et LayerZero se contestent sur la config |
| 4 | **Resolv** (stablecoin USR) | 22 mars 2026, 01:50-04:20 UTC env. | ~25-26,8 M$ extraits (80 M USR mintés) | Ethereum | Clé EOA du rôle SERVICE_ROLE gardée dans AWS KMS compromise ; aucun plafond de mint | Le **signeur hors chaîne** (EOA) a validé `completeSwap` : 100 000 USDC contre 50 M USR | https://www.certik.com/resources/blog/resolv-protocol-incident-analysis | P (lu) |
| 5 | **Step Finance** | 31 janv. 2026 | ~27-40 M$ (261 854 SOL dé-stakés) | Solana | Appareils de dirigeants compromis ; autorité de stake transférée à un wallet frais | Les clés de trésorerie/frais (appareils des dirigeants) | https://rekt.news/fr/step-finance-rekt ; https://www.crowdfundinsider.com/2026/02/263817-step-finance-ceases-operations-following-40-million-security-incident/ | S (non ouverts) |
| 6 | **Upbit** (CEX) | 27 nov. 2025, 04:42 KST | ~30-37 M$ (44,5 Md KRW initial) | Solana (20+ tokens) | Hot wallet Solana ; cause non confirmée (faiblesse de signature suspectée) | La **clé du hot wallet** (signature) | https://www.scorechain.com/blog/upbit-hot-wallet-hack-explained-solana-outflows-risks-and-blockchain-monitoring ; https://www.halborn.com/blog/post/explained-the-upbit-hack-november-2025 | P (Halborn lu), S (Scorechain) |
| 7 | **SBI Crypto** | 24 sept. 2025 | ~21 M$ | BTC, ETH, LTC, DOGE, BCH | Non publié ; motif proche de la RPDC (ZachXBT) | Non publié | https://unchainedcrypto.com/sbis-bitcoin-mining-pool-hacked-for-21-million-zachxbt/ | S |
| 8 | **UXLINK** | sept. 2025 | 11,3 M$ (Cyvers) à « dizaines de M$ » | Ethereum et autres | Multisig compromis : `delegatecall` ajoutant un owner (`addOwnerWithThreshold`), mint de ~10 000 Md UXLINK | Les **signataires du multisig** | https://www.theblock.co/post/371783/uxlink-multisig-hack | S |
| 9 | **SwissBorg / Kiln** | 31 août 2025 (changement d'autorité), 8 sept. 2025 (vidage) | ~41 M$ (193 000 SOL) | Solana | API du prestataire de staking Kiln compromise ; un « unstake » d'apparence normale a **réassigné le contrôle des comptes de stake** à l'attaquant | Le compte géré par le tiers (Kiln) | https://www.halborn.com/blog/post/explained-the-swissborg-hack-september-2025 ; https://cointelegraph.com/news/swissborg-hacked-41m-sol-api-compromise | S |
| 10 | **BigONE** (CEX) | juil. 2025 | ~27 M$ | 4 réseaux (BTC, ETH, SOL, USDT) | Réseau de production compromis, **logique des serveurs de compte et de contrôle de risque modifiée** ; clés non fuitées (SlowMist) | Le **serveur de contrôle de risque** a validé les retraits | https://www.theblock.co/post/362814/bigone-hack | S |
| 11 | **CoinDCX** (CEX) | 18-19 juil. 2025 | 44,2 M$ | Solana puis Ethereum | « Compte opérationnel interne » de liquidité sur un exchange partenaire ; wallet **non étiqueté, absent de la preuve de réserves** | Les clés du compte interne | https://forklog.com/en/coindcx-exchange-suffers-44-million-hack/ ; https://cointelegraph.com/news/crypto-exchange-coindcx-hacked-42-million-drained | S |
| 12 | **BtcTurk** (CEX, 2e fois) | 14 août 2025 | ~48 M$ (Lookonchain 23 M$, CertiK 50 M$) | Multi (surtout 2 adresses de collecte) | Exposition de clés privées (PeckShield) | Clés des hot wallets | https://cryptoslate.com/btcturk-hack-sees-48-million-in-crypto-vanish-from-hot-wallets/ | S |
| 13 | **Nobitex** (CEX, Iran) | 18 juin 2025 | ~90 M$ (jusqu'à 100 M$) | Multi (EVM, Tron, BTC...) | Hacktivistes (Predatory Sparrow revendique) : fonds envoyés vers des **adresses vanity à clé inconnue** = destruction | Hot wallets | https://slowmist.medium.com/nearly-100-million-burned-irans-largest-crypto-exchange-nobitex-suffers-major-hack-eafd57b2eac7 ; https://decrypt.co/325757/pro-israel-hacker-group-drains-burns-90-million-from-iranian-bitcoin-exchange | S |
| 14 | **Bybit** (CEX) | 21 févr. 2025 | 1,4-1,5 Md$ (~401 346 ETH + stETH, cmETH, mETH) | Ethereum | JavaScript injecté dans l'interface Safe{Wallet} (via AWS de Safe) : les signataires voyaient un transfert, la charge utile faisait un `delegatecall` remplaçant l'implémentation | **3 signataires** du multisig cold wallet ont signé (Ledger) un changement de masterCopy présenté comme un transfert | https://blocksec.com/blog/bybit-incident-a-web2-breach-enables-the-largest-crypto-hack-in-history ; https://www.elastic.co/security-labs/bit-bybit | P (BlockSec lu), S |
| 15 | **Infini** (néobanque) | 24 févr. 2025 | ~49 M$ | Ethereum | Un ancien développeur a **conservé un rôle admin/retrait** ; clé obtenue | Le rôle dormant | https://www.certik.com/resources/blog/0xinfini-incident-analysis | S |
| 16 | **Phemex** (CEX) | 23 janv. 2025 | 70-73 M$ | 14 à 16 chaînes | Clés des hot wallets (probablement toutes au même endroit) | Clés des hot wallets | https://www.merklescience.com/blog/hack-track-phemex-flow-of-funds-analysis ; https://halborn.com/blog/post/explained-the-phemex-hack-january-2025 | P (lus) |
| 17 | **M2** (CEX) | 31 oct. 2024 | 13,7 M$ | Ethereum, Bitcoin, Solana | Plusieurs hot wallets compromis ; cause non publiée | Clés des hot wallets | https://www.quillaudits.com/blog/hack-analysis/m2-crypto-exchange-exploit | P (lu) |
| 18 | **Radiant Capital** | 16 oct. 2024 | ~50-53 M$ | Arbitrum, BNB (Ethereum et Base concernés selon Revoke) | Malware sur appareils de 3 des 11 signataires (contact Telegram usurpé, PDF) ; interface Safe affichait une opération normale, le Ledger signait `transferOwnership` | **3 signataires sur 11** ; Mandiant : UNC4736 (nexus RPDC) | https://thedefiant.io/news/defi/radiant-capital-winds-down-2m-husk-dprk-50m-heist ; https://www.theblock.co/post/321606/radiant-capital-appears-to-suffer-51-million-exploit-on-its-bnb-chain-and-arbitrum-instances | S |
| 19 | **BingX** (CEX) | 20 sept. 2024 | 44,7 M$ (SlowMist) à 52 M$ (Cyvers) | ETH, AVAX, BNB, OP, POL, Base, ARB | Hot wallets compromis ; ≥ 10 adresses d'attaque | Clés des hot wallets | https://halborn.com/blog/post/explained-the-bingx-hack-september-2024 ; https://cointelegraph.com/news/bingx-minor-loss-hack-climbs | P (Halborn lu), S |
| 20 | **Indodax** (CEX) | 10 sept. 2024 | 22-25,5 M$ | ETH, Polygon, Tron, BTC, Optimism | Hot wallets ou **système de retrait** (SlowMist : le hot wallet n'aurait pas été compromis) | Soit les clés, soit le système de retrait | https://www.merklescience.com/blog/hack-track-indodax-flow-of-funds-analysis ; https://alpha.rekt.news/indodax-rekt | P (Merkle lu), S |
| 21 | **Lykke** (CEX) | 4 juin 2024 | 19,5-23,6 M$ (158 BTC, 2 161 ETH) | Bitcoin, Ethereum | Accès non autorisé, cause non publiée | Non publié | https://forklog.com/en/lykke-exchange-halts-operations-following-22-million-hack/ | S |
| 22 | **BtcTurk** (CEX, 1re fois) | juin 2024 | ~55 M$ | 10 hot wallets | Clés privées probables | Clés des hot wallets | https://www.halborn.com/blog/post/explained-the-btc-turk-hack-june-2024 | P (lu) |
| 23 | **DMM Bitcoin** (CEX Japon) | **31 mai 2024** [ÀV : le résumé Merkle lu dit « May 5 »] | 4 502,9 BTC = 305-308 M$ | Bitcoin | FBI/NPA : TraderTraitor, recruteur LinkedIn → Ginco → manipulation d'une demande de transaction légitime. Autre lecture (mononaut) : adresse de destination **sosie** de l'adresse habituelle | Une **demande de transaction légitime de DMM détournée** (via Ginco) | https://www.bleepingcomputer.com/news/security/fbi-links-north-korean-hackers-to-308-million-crypto-heist ; https://www.merklescience.com/blog/hack-track-dmm-flow-of-funds-analysis | P (Merkle lu), S |
| 24 | **WazirX** (CEX Inde) | 18 juil. 2024 | ~230-235 M$ | Ethereum (+ autres) | Safe 4-sur-6 (5 WazirX + 1 Liminal) : signatures obtenues pour **upgrader le Safe vers un contrat malveillant** ; Liminal et WazirX se renvoient la faute | **2 des 4 signatures** exigées autorisaient l'upgrade, présenté comme un transfert USDT (Rekt) | https://rekt.news/wazirx-rekt ; https://quillaudits.com/blog/hack-analysis/wazirx-235m-hack | P (Rekt lu) |
| 25 | **Orbit Bridge** | 31 déc. 2023, 21:08-21:25 UTC | 81,5 M$ (Rekt) à > 100 M$ (Arkham recalcul) | Ethereum | Multisig du pont (7 signataires sur 10 compromis selon officer_cia, **non confirmé**) ; Ozys accuse un ancien employé | Les signataires du pont | https://www.rekt.news/orbit-bridge-rekt ; https://www.blockworks.co/news/80-million-lost-orbit-bridge | S |
| 26 | **Poloniex** (CEX) | 10 nov. 2023, 10:34 UTC | ~114 M$ (CoinDesk) à 132 M$ (CertiK) | Ethereum, Tron, Bitcoin | Clés de hot wallets compromises (2e plus gros vol de clés 2023 selon CertiK) | Clés des hot wallets | https://www.certik.com/resources/blog/poloniex-incident-analysis | P (lu) |
| 27 | **HTX + Heco Bridge** | 22 nov. 2023 | ~100-113 M$ | Ethereum (hot wallets HTX + pont Heco) | 3 hot wallets HTX + wallet opérateur du pont Heco compromis ; les transferts « ont été confirmés par l'opérateur » (PeckShield) | Le wallet opérateur du pont | https://www.certik.com/resources/blog/heco-bridge-exploit ; https://forklog.com/en/news/analysts-estimate-losses-from-htx-and-heco-bridge-hack-at-110-million | S |
| 28 | **Mixin Network** | 23 sept. 2023 | ~200 M$ | Ethereum, Bitcoin, DAI... | Base de données du **fournisseur cloud** attaquée | Accès aux hot wallets via la base du prestataire | https://cointelegraph.com/news/mixin-network-hack-200-m-crypto-assets | S |
| 29 | **CoinEx** (CEX) | 12 sept. 2023 | 54 M$ (Halborn) à 70 M$ | ETH, Tron, Polygon... | Hot wallets, clé unique probable ; une adresse partagée avec le vol Stake | Clés des hot wallets | https://www.halborn.com/blog/post/explained-the-coinex-hack-september-2023 ; https://forklog.com/en/coinex-confirms-hack-of-hot-wallets/ | P (lus) |
| 30 | **Stake.com** | 4 sept. 2023, 12:48 UTC (1re tx) | ~41 M$ | Ethereum, BSC, Polygon | Hot wallets ; FBI : Lazarus (7 sept.) | Clés des hot wallets | https://cointelegraph.com/news/stake-hack-of-41m-was-performed-by-north-korean-group-fbi ; https://www.securityweek.com/fbi-blames-north-korean-hackers-for-41-million-stake-com-heist/ | S |
| 31 | **Atomic Wallet** (non custodial, cas limite) | 2-3 juin 2023, dès 21:45 UTC | 35 M$ puis > 100 M$ (Elliptic, > 5 500 wallets) | Multi | Clés/seeds de wallets **d'utilisateurs** ; cause non établie | Chaque utilisateur (clé volée) : **pas de circuit d'approbation central** | https://www.coindesk.com/tech/2023/06/13/atomic-wallet-hackers-move-stolen-funds-via-ofac-sanctioned-exchange-garantex-elliptic ; https://www.csoonline.com/article/3698709/atomic-wallet-hack-leads-to-at-least-35m-in-stolen-crypto-assets.html | S ; **hors périmètre strict** |
| 32 | **Harmony Horizon** | 23-24 juin 2022 | ~100 M$ (105 M$ Blockchain Intelligence) | Ethereum (pont) | Clés d'un multisig du pont compromises (seuil 2-sur-5 cité par Harmony, **non confirmé par mes sources**) | Les signataires du pont | https://www.merklescience.com/blog/hack-track-analysis-of-harmonys-horizon-bridge-exploit | P (Merkle lu) |
| 33 | **Ronin Bridge** | 23 mars 2022 (découvert le 29) | 540-625 M$ (173 600 ETH + 25,5 M USDC) | Ethereum | 5 validateurs sur 9 : 4 Sky Mavis (phishing d'un employé) + 1 Axie DAO via un accès par liste d'autorisation jamais révoqué | **5 validateurs sur 9** | https://forklog.com/en/ronin-sidechain-developers-reveal-further-details-of-625-million-hack/amp ; https://www.elliptic.co/insights/540-million-stolen-from-the-ronin-defi-bridge/ | P (Forklog lu), S |

(33 lignes ; Atomic Wallet, non custodial, est exclu des statistiques §3, d'où « 32 incidents ».)

**Cas négatif Coinbase** : aucun vol de trésorerie par détournement du circuit de sortie trouvé en 2025-2026. Ce que la recherche montre : une fuite de données 2025 par corruption de personnel de support (selon un résumé de moteur [S, ÀV]) sans accès aux clés ni aux fonds, des vols chez des clients individuels (6,7 M$ chez un client Coinbase+Kraken, 2026, entrée non établie [S]), et le piratage de marchands Coinbase Commerce en 2024. Ce ne sont pas des « sorties approuvées frauduleusement par le circuit du prestataire ». Source : https://altfins.com/crypto-news/crypto-news-summary/318603 (S, non ouvert). **À ne pas citer comme incident de la piste.**

---

## 2. Tableau 2 : schéma on-chain, signaux déclencheurs, temps de réaction, récupéré

Rappel : **(a)** destinataire jamais vu, **(b)** cumul multi-fenêtres, **(c)** écart annoncé/chaîne, **(d)** changement de pouvoirs, **(e)** contexte. Signaux nouveaux **N1...N13** et secondaires **S1...S5** : définis en §4.

### 2.1 Incidents 2026

| Incident | Schéma de sortie on-chain | Signaux et première transaction déclencheuse | Temps 1re sortie → réaction réelle | Récupéré / gelé |
|---|---|---|---|---|
| **Bitget** | Du 24 sept. 18:31 au 21:23 UTC (~2 h 52, SlowMist). 5 wallets Bitget, 7 chaînes. **228 M$ sortis en 18 min (18:58-19:16)**, soit 59-65 % du total [calcul]. Une adresse neuve `0xe410…` a utilisé 19,67 M$ d'USDT0 en 6 min vers 7 111 ETH via UniswapX/1inch Fusion (ChainCatcher, [S], contredit la durée de 3 h). 25 M$ d'USDT vers un filler UniswapX (Rizzolver) en 5 tx de 5 M$. ~100 M$ d'actifs non-ETH → ~36 600 ETH ; 68 300 ETH répartis sur 8 adresses neuves ; BNB : 6,9 M$ vers 12 wallets, ≥ 4,7 M$ vers THORChain, 2 M$ vers FixedFloat ; XRP (~153 M$) resté dans 5 wallets. 26 adresses étiquetées par Arkham. Conversion des stablecoins et XAUt en ETH « en moins de 10 min », 75,48 M$ en 41 min (BlockSec). Pas de mixeur cité par Arkham | **(a)** dès le 1er transfert vers une adresse neuve (18:31 UTC) ; **(b)** 10 min (≥ 1 portefeuille) à 18 min (228 M$) ; **N3** 5 wallets/7 chaînes en parallèle ; **N5** conversion en ETH ; **N10** tranches régulières (5 × 5 M$). **(c)** : exige le flux back-office (aucune demande de retrait client correspondante) ; **(d)** : aucun. Contexte : 02:31 heure de Hong Kong (S1) | Bitget dit avoir détecté à 18:31 UTC [ÀV : les relais confondent peut-être 1re sortie et alerte] ; retraits suspendus le 24-25 sept. (heure non donnée). Circle ~05:00 UTC le 25 (≈ 10 h 30 après), Tether ≈ 7 h plus tard | 318 k$ gelés (0,08 %) à 840 k$ (0,2 %, BlockSec). NEAR Intents a bloqué > 50 M$ de tentatives (≈ 166 k$ passés). Fonds de protection Bitget couvre la perte |
| **Drift** | **31 retraits en ~12 min** (BlockSec ; crypto.news dit 128 s ; Arkham dit ~12 min) via le compte `HkGz4K…pZES` : USDC, JLP, SOL, cbBTC, USDT, wETH, dSOL, WBTC, JTO, FARTCOIN. Premier transfert visible : ~41 M JLP (155 M$) vers `HkGz4K`. Puis **232 M$ d'USDC de Solana vers Ethereum via CCTP, > 100 tx sur 6 h, sans gel Circle** (ZachXBT) ; ETH accumulé 130 262 ETH (une source) | **(d)** à 16:05 UTC env. : deux tx durable nonce, 4 slots d'écart : `2HvMSg…2C4H` (proposition de transfert d'admin) puis `4BKBmA…RsN1` (`UpdateAdmin`) [ÀV]. Ensuite : création du marché de collatéral CVT avec **oracle remplacé par une source de l'attaquant** et retrait des protections de retrait (**c/d**) ; **(a)** `HkGz4K` ; **(b)** 285 M$ ; **N2** 10 ETH retirés de Tornado Cash le 11 mars pour déployer CVT (750 M mintés) ; **N11** comptes durable nonce créés le 23 mars pour 2 signataires + 2 comptes attaquant (9 jours avant), re-créés après la migration du 27 mars ; **N1** (partiel) l'attaquant a soumis ses tx 1 min après un test de retrait légitime de Drift ; **N12** CVT mint de 750 M comme faux collatéral | Dépôts et retraits suspendus peu après (heure non donnée). Circle n'a rien gelé pendant ≥ 6 h | Aucun montant récupéré rapporté. Tether annonce un programme de 150 M$ (127,5 M$ Tether) le 16 avr. pour restaurer les soldes des utilisateurs : ce n'est pas un recouvrement |
| **KelpDAO rsETH** | **1 seule tx** à 17:35 UTC (`0x1ae232da…db4222`) : message LayerZero forgé (EID source 30320) → libération de 116 500 rsETH vers `0x8B1b6c9A…0d3b`. En minutes : rsETH déposés comme collatéral sur Aave (Ethereum : 52 834 WETH empruntés ; Arbitrum : 29 782 WETH + 821 wstETH), Compound V3 et Euler (montants non publiés). ~20 min : 1ers sauts vers Tornado Cash (ZachXBT). Extraction quasi terminée en 1 h. Extrait 200-236 M$ selon prix | **(c)/N12** libération sans burn côté Unichain, offre circulante qui dépasse la réserve (**D6**) ; **(a)** adresse neuve ; **(b)** 18 % de l'offre en 1 tx ; **N6/(d)** (contesté) : passage du DVN de 2-sur-2 à 1-sur-1 avant l'exploit (rapport LayerZero, Kelp conteste), compromission de ~6 semaines. Config 1-sur-1 lisible on-chain **avant** | Multisig opérations de Kelp met en pause à **+46 min** (18:21 UTC). Aave gèle rsETH « dans les heures » ; Compound/Euler pausent les nouveaux emprunts | Arbitrum Security Council gèle 30 766 ETH (~71 M$, ~24 %) ; rsETH de l'attaquant brûlés sur Arbitrum. Dette Aave ~177 M$ (177-196). Aucun retour des fonds |
| **Resolv** | Le 22 mars : 01:50:59 demande de swap 100 000 USDC ; **02:21:35 `completeSwap` (id 30) mint 50 M USR** (500× la valeur déposée) ; ~2 h plus tard (≈ 04:20, [ÀV]) 2e mint de 30 M USR ; conversion en ~11 409 ETH (~24 M$) sur `0x8ed8…b81c`. Dépeg de USR à 0,025 sur Curve | **(c)/N12** mint 50 M contre 100 k$ déposés (aucun plafond de sortie) ; **(b)** ratio 500× ; **N5** conversion en ETH. **(d)** : rôle SERVICE_ROLE donné le 26 déc. 2024, rien de nouveau à l'attaque | **Aucune réaction entre les 2 mints (~2 h)** [calcul]. Pause du protocole plus tard (heure non donnée) ; Lista DAO et Re7 pausent leurs pools | 9 M USR brûlés ; rachat limité par liste d'autorisation. Collatéral « intact » (Resolv) |
| **Step Finance** | 31 janv. : **261 854 SOL dé-stakés** après transfert de l'autorité de stake vers un wallet frais (Rekt citant CertiK) ; wallets de trésorerie et de frais multiples | **(d)/N6** transfert d'autorité de stake (précède le dé-stake) ; **(a)** wallet frais ; **(b)** ~30 M$ | Non publié ; token STEP -93 % en 24 h ; arrêt de l'activité le 23-24 fév. | ~4,7 M$ récupérés (3,7 M$ actifs Remora + 1 M$) |

### 2.2 Incidents 2025

| Incident | Schéma de sortie on-chain | Signaux et première transaction déclencheuse | Temps 1re sortie → réaction | Récupéré / gelé |
|---|---|---|---|---|
| **Upbit** | 27 nov., 04:42 KST : « centaines de transferts en quelques minutes » (scripts automatiques), 20+ tokens (SOL, USDC, BONK, JUP, RENDER, ORCA, PYTH...), **destinations neuves** | **(a)** ; **(b)** ; **N3** (20+ tokens balayés) ; **S1** 04:42 KST (heure creuse) | Dépôts/retraits Solana suspendus, actifs restants déplacés en cold storage | ~2,3 Md KRW de LAYER gelés, ~5 % du montant initial de 44,5 Md KRW [calcul, ÀV] |
| **SBI Crypto** | BTC, ETH, LTC, DOGE, BCH ; fonds vers **5 échanges instantanés** puis Tornado Cash | **(a)** ; **N5** passage par échanges instantanés | SBI n'a pas communiqué (au moment des sources) | Non rapporté |
| **UXLINK** | `delegatecall` retirant l'admin et ajoutant l'attaquant comme owner (`addOwnerWithThreshold`), mint de ~10 000 Md UXLINK vendus sur DEX (prix -70 %+) | **(d)/N6** ajout d'owner ; **(c)/N12** mint massif ; **(b)** vente du mint | Contact CEX/DEX pour gel, plainte | Aides au gel (Bubblemaps, PeckShield, Binance) |
| **SwissBorg/Kiln** | **31 août** : un « unstake » d'apparence normale réassigne l'autorité de comptes de stake à l'attaquant ; **8 sept.** : vidage de ~193 000 SOL | **(d)/N6** le 31 août, **8 jours avant** le vidage ; **(a)** | 8 jours entre le signal et le vidage ; Kiln sort de ses validateurs Ethereum le 10 sept. | Non rapporté |
| **BigONE** | 120 BTC, 350 ETH, 1 800 SOL, ~8,54 M USDT sur 4 réseaux ; clés **non** volées | **(c)** : sorties sans demandes de retrait correspondantes (serveur de risque modifié) ; **(a)** ; **(b)** | Non publié | Non rapporté ; couverture sur fonds propres |
| **CoinDCX** | 44,2 M$ d'un compte de liquidité **non inventorié** ; Solana → Ethereum (ZachXBT) ; Tornado Cash cité par une seule source | **N13** (inventaire) : un wallet hors liste ne peut pas être surveillé ; **(a)** ; **(b)** | **~17 h avant la divulgation** (signalé par la presse) | Pertes couvertes par la trésorerie |
| **BtcTurk (2025)** | ~48 M$, surtout vers 2 adresses de collecte, puis swaps | **(a)**, **(b)** ; **N5** | Retraits suspendus ; heure non publiée | Non rapporté |
| **Nobitex** | 18 juin : ~90 M$ vers **adresses vanity** à texte politique (`TKFuckiRGCTerrorists…`) = clé inconnue = destruction | **(a)** ; **S2** adresse vanity/destruction ; **(b)** | Non publié | Quasi nul (fonds détruits ; reste possible si l'émetteur de stablecoin réémet) |
| **Bybit** | **1 upgrade + 5 sweeps** (BlockSec) : upgrade `0x46deef0f…ad7882` (delegatecall qui écrase `masterCopy` slot 0 vers `0xbDd077…9516`), puis `sweepERC20`/`sweepETH` : 15 000 cmETH (`0x847b8403…`), 90 375 stETH (`0xa284a1bc…`), 8 000 mETH (`0xbcf316f5…`), **401 346 ETH** (`0xb61413c4…`), 90 USDT (`0x25800d10…`). ~100 % du cold wallet. Destination : adresse `0x4766…` puis > 40 wallets ; ETH par tranches de ~27 M$ ; stETH/cmETH/mETH → ETH ; THORChain : ≥ 209 384 ETH (~480 M$) convertis en BTC dès le 27 fév. ; 10 jours pour blanchir ; 280 M$ « dark » au 4 mars | **(d)/N6** upgrade `0x46deef…` : tx `delegatecall` (operation = 1) vers un contrat de l'attaquant ; **(a)** `0x4766…` ; **(b)** ~100 % du solde en 5 tx ; **N1** transfert de 90 USDT (test, [ÀV] : BlockSec le classe aussi comme 5e sweep) ; **N7** contrat attaquant déployé 18-19 fév. [ÀV] ; **(c)** : l'interface montrait un transfert, la chaîne un delegatecall. Heure de l'upgrade : 14:13 UTC selon relais [ÀV] | Le CEO signale un transfert « de routine » froid → tiède environ 1 h avant l'alerte. Sygnia : 2 minutes après la tx malveillante, le JS de Safe est remplacé par une version propre. Délai upgrade → sweeps non publié dans mes sources [ÀV] | 3 % gelés, 77 % traçables, ~20 % « dark » (CEO, [S] Coin360). Remboursé par prêts |
| **Infini** | 24 févr. : **rôle admin conservé** par l'ancien développeur, utilisé pour racheter tous les tokens du vault | **N8** première utilisation d'un rôle privilégié jamais exercé depuis des mois ; **(d)** ; **(a)** ; **(b)** | Les retraits ont continué après la brèche ; prime de 20 % | Aucun retour au 27 févr. |
| **Phemex** | 23 janv. : **16 chaînes** (ARB 1,0 M$, ETH 20,9 M$, BTC 5,3 M$, SOL 13,6 + 1,6 M$, XRP 13,4 M$, ADA 2,5 M$, BSC 2,4 M$...) ; « un hot wallet après l'autre », **les tokens les plus précieux d'abord, puis jusqu'aux plus petits** ; swaps d'actifs gelables vers non gelables ; 1,9 M$ via Stargate depuis Base. Adresse commune avec Bybit (`0x33d0…`, ZachXBT [S]) | **(a)**, **(b)** ; **N3** 16 chaînes ; **N4** balayage par valeur décroissante ; **N5** ; **N9** adresse déjà étiquetée par d'autres vols | Phemex suspend les retraits le jour même (heure non donnée) ; volumes de trading +300 % dans l'heure (fuite des utilisateurs) | Pertes couvertes sur réserves |

### 2.3 Incidents 2024

| Incident | Schéma de sortie on-chain | Signaux | Temps 1re sortie → réaction | Récupéré / gelé |
|---|---|---|---|---|
| **M2** | Hot wallet ETH `0xE26a…5FcE` → EOA intermédiaire `0xb5f7…9d3A` → EOA de consolidation `0x968b…e142` ; SHIB, USDT → ETH ; ~10 M$ d'ETH non mixés au 4 nov. | **(a)** ; **(b)** ; **N3** (ETH, BTC, SOL) ; **N5** ; sauts d'EOA intermédiaires avant consolidation (**S3**) | M2 affirme avoir détecté et « récupéré » en 16 min (sceptique : restauration sur fonds propres) | Pas de récupération démontrée |
| **Radiant** | 16 oct. : `transferOwnership` du pool provider (Arbitrum, BNB) vers l'attaquant ; **contrat backdoor déployé ~17:09 UTC** (Ancilia) ; mise à jour des lending pools ; vidage des pools **et des wallets utilisateurs avec approbations illimitées** (5-6 M$) ; nettoyage des traces du malware en 3 min | **(d)/N6** `transferOwnership` puis upgrade des pools vers le backdoor ; **N7** déploiement de contrat 17:09 ; **N8** approbations illimitées vers contrat inconnu ; **(a)** ; **(b)** ~50 M$ ; **N3** 2 chaînes (au moins) | Heure de réaction non publiée dans mes sources [?]. Compromission initiale le 11 sept. (5 semaines avant) | Non rapporté |
| **BingX** | ≥ 10 adresses d'exploit, 7 chaînes ; **deux vagues à quelques heures d'intervalle** ; ~4 526 ETH + 7 864,7 BNB obtenus par swap | **(a)**, **(b)**, **N3**, **N5**, **N10** vagues | BingX gèle ses retraits ~1 h après (Halborn), parle de « maintenance » | 1 M$ (une source) à 10 M$ (autre) gelés ; non réconcilié |
| **Indodax** | **Synchronisé sur 5 chaînes** (ETH 18,14 M$ ; Polygon ~2,6 M$ ; Tron ~2,4 M$ ; BTC 26,26 BTC ; OP 380 ETH), **> 150 tx suspectes** ; conversion en natifs (ETH, TRX, POL) plutôt qu'en stablecoins (blocage Tether) | **(a)**, **(b)**, **N3**, **N5**. **(c)** : « retraits d'apparence légitime avec adresses de change qui reviennent à Indodax » (Rekt) | Retraits du hot wallet arrêtés le soir même | Non rapporté |
| **Lykke** | 4 juin : 158 BTC (4 wallets), 2 161 ETH → DAI, BTC dispersé | **(a)**, **(b)**, **N5** (ETH → DAI) | **Alerte externe le 9 juin (SomaXBT), reconnaissance par Lykke le 10 juin = 6 jours** ; arrêt du trading le 6 | Non rapporté ; faillite |
| **BtcTurk (2024)** | 10 hot wallets ; revente massive de LUNC | **(a)**, **(b)**, **N3** | Dépôts/retraits suspendus ; heure non publiée | **Binance gèle 5,3 M$ (≈ 10 %)** |
| **DMM Bitcoin** | 4 502,9 BTC en un transfert (hot wallet = multisig 2-de-3) vers une adresse dont les 5 premiers et 2 derniers caractères **ressemblent** à l'adresse habituelle de DMM (mononaut) ; puis chaîne de pelage (499 → 39 BTC), mixeurs, ponts, USDT sur Tron, Huione (> 35 M$) | **(a)** ; **N9** adresse sosie ; **(b)** ~100 % du solde du wallet ; **(c)** : demande légitime détournée | Délai non publié dans mes sources | Aucune récupération ; DMM cesse l'activité, actifs repris par SBI VC Trade en mars 2025 |
| **WazirX** | **Préparation** : 8 juil. ChangeNOW → `0xC891…` + Tornado Cash 1 ETH ; 10 juil. 6 × 0,1 ETH Tornado → adresse d'attaque `0x6EeDF9…` ; **tx de test ETH, SHIB, USDT** avec le multisig `0x09b3…` ; contrats créés le 10 juil. (Inc42 : pas d'interaction avec le wallet avant le 18). **18 juil.** : un transfert USDT légitime **échoue** quelques minutes avant ; upgrade du Safe `0x27fD43BA…` via `0x48164d3a…e185d` ; vidage vers `0x04b21735…` ; altcoins convertis en ETH (~150 M$) | **N1** tests (≥ 8 jours avant) ; **N2** financement Tornado ; **(d)/N6** upgrade `0x48164d3a…` **« quelques minutes »** avant le 1er retrait (Mudit Gupta) ; **(a)**, **(b)**, **N5** ; **S5** transfert légitime échoué | WazirX confirme ~30 min après (Cyvers a alerté plus tôt) | 3 M$ d'USDT gelés ~7 mois plus tard (janv. 2025) = ~1,3 % [calcul] |

### 2.4 Incidents 2023 et 2022

| Incident | Schéma de sortie on-chain | Signaux | Temps 1re sortie → réaction | Récupéré / gelé |
|---|---|---|---|---|
| **Mixin** | 23 sept. : ~94,5 M$ ETH, ~23,5 M$ DAI, ~23,3 M$ BTC ; USDT converti en DAI (anti-gel, 0xScope) ; fonds **dormants ~2,4 ans** ; 12 févr. 2026 : 3,85 M$ vers Tornado en 20 tx ; le wallet détient encore 57 849 ETH + 891 BTC (The Block) | **(a)**, **(b)**, **N5** (USDT → DAI) ; **S4** réveil de fonds dormants (traçage, pas détection initiale) | Mixin confirme le 25 sept. (2 jours), suspend dépôts et retraits | « Moitié des actifs sécurisés » (fondateur) ; pas de gel |
| **CoinEx** | 12 sept. : 1re tx flaggée = 4 947 ETH, puis d'autres tokens vers la même adresse ; ETH ~19 M$, Tron ~11,5 M$, Polygon ~0,3 M$ (PeckShield, ~31 M$ en 1re estimation, 53-70 M$ final) ; une adresse partagée avec Stake | **(a)** ; **(b)** ; **N9** adresse recoupée avec Stake (Lazarus) ; **N3** 3 chaînes | Le système de contrôle de risque de CoinEx a signalé les retraits anormaux le 12 sept. ; dépôts/retraits gelés | Non rapporté ; réouverture le 21 sept. |
| **Stake.com** | 4 sept. 12:48 UTC : 3,9 M$ USDT puis 6 001 ETH (9,8 M$) sur Ethereum ; + 25,6 M$ BSC et Polygon ; tout converti en ETH puis dispersé ; 2 jours après : pont Polygon → Avalanche, MATIC → BTC (~72 BTC) | **(a)** ; **(b)** ; **N3** 3 chaînes ; **N5** ; **N9** liste d'adresses FBI du 7 sept. | Stake reconnaît environ 3-5 h après ; services rétablis 21:28 UTC | Non rapporté |
| **HTX + Heco** | 22 nov. : 3 hot wallets HTX + wallet opérateur Heco (10 145 ETH ≈ 19 M$ du pont), TUSD, LINK, USDC, UNI, SHIB, HBTC, USDT → ETH via DEX ; **dormant jusqu'au 13 mars 2024 (~112 j)**, puis 40 392 ETH vers Tornado en 8 jours (PeckShield) | **(a)** ; **(b)** ; **N3** 3 wallets + pont ; **N5** ; **(d)** partiel : wallet opérateur ; **S4** | Services rétablis < 24 h ; temps de détection non publié | Non rapporté |
| **Poloniex** | 10 nov. : **1re sortie 18 M$ en BTC à 10:34 UTC**, puis 11 M USDT, ETHO (Tron). **357 tx** depuis un wallet Ethereum (114 M$) + ~42 M$ Tron ; **317 tokens ERC-20** balayés ; ≥ **681 wallets** utilisés (600+ Ethereum, 70 Tron) ; 0,5 ETH envoyé à un wallet contrôlé avant chaque swap ; 10,5 M GLM envoyés par erreur au contrat du token (GLM) ; aucun mixeur ni exchange au moment de CertiK | **(a)**, **(b)** ; **N3** 3 chaînes ; **N4** balayage de 317 tokens ; **N2** (variante : financement en gas, 0,5 ETH) ; **N5** | **PeckShield/Cyvers signalent ~10:55 (+21 min)** ; Poloniex annonce « maintenance » 12 min plus tard (~11:07) [calcul] | Non rapporté |
| **Atomic Wallet** | 2 juin 21:45 UTC → ~3 juin : > 5 500 wallets **d'utilisateurs** ; sweep de chaque token vers une adresse neuve puis conversion ; 1inch → Garantex → BTC → Sinbad ; THORChain (503 ETH) et SWFT | **Hors périmètre** (aucun circuit d'approbation central). **(a)** et **(b)** n'ont de sens qu'agrégés sur de nombreux wallets d'un même éditeur | Atomic communique le 3 juin | > 1 M$ gelés (Elliptic et échanges) |
| **Orbit Bridge** | 31 déc. **21:08 DAI 10 M** → WBTC 231 → ETH 9 500 → USDC 10 M → **21:25 USDT 30 M**, soit **5 retraits en ~17 min** ; adresse financée via Tornado Cash par un intermédiaire ; WBTC et stables → ETH (17 250 ETH pour 30 M USDT + 230,9 WBTC) ; juin 2024 : 8 671 à 12 932 ETH vers Tornado | **(a)** ; **(b)** 5 tx / 17 min ; **N2** financement Tornado **avant** ; **N12** retraits côté Ethereum sans dépôt/verrou source ; **N5** ; **(d)** ? (7-sur-10, non confirmé) | **Pont désactivé à 22:21 UTC, soit +73 min** (alerte initiale par analystes indépendants, annonce de Orbit le 1er janv.) | Non rapporté |
| **Harmony Horizon** | 23-24 juin : **9 tx** (Merkle) ou **11 tx** (Harmony) pour sortir WETH, SUSHI, AAVE, DAI, USDT, USDC, BUSD, WBTC ; swaps vers ETH ; 2 lots de 18 000+ ETH répartis sur 3 adresses chacun ; **Tornado Cash : ~85 700 ETH au 10 juil. (14 adresses)** ; 148 adresses de retrait ; chain-hopping (RenVM, Multichain) vers BTC, BSC, Polygon ; fuseau Asie déduit de 850 tx (+6 à +12 GMT) | **(a)**, **(b)** ; **N12** (asymétrie de pont) ; **N5** ; **(e)** fuseau horaire (faible) ; **S3** | Offre de prime (1 M$) le 26-27 juin, soit ~3 jours | Non rapporté |
| **Ronin** | 23 mars : **173 600 ETH + 25,5 M USDC** (nombre de tx non confirmé ; « 2 tx » circule mais non vérifié [ÀV]) ; **découvert le 29 mars, par un utilisateur qui ne pouvait pas retirer 5 000 ETH** ; Lazarus (OFAC 14 avr.) ; 18 % blanchis au 14 avr. ; Tornado Cash | **(a)**, **(b)** ~100 % de la TVL du pont ; **N12** retraits Ethereum sans burn/dépôt ; **(d)** non (accès par liste d'autorisation oubliée, pas de changement) | **6 jours** ; les devs avouent une surveillance faible des grosses sorties du pont | ~30 M$ saisis plus tard (Chainalysis [S]) |

---

## 3. Matrice incident × signal

Légende : **●** présent dans les faits sourcés et aurait déclenché ; **◐** présent mais dépend d'une donnée non sourcée ou d'une condition (flux back-office, baseline, étiquetage tiers) ; **–** absent ou sans objet ; **?** inconnu. Colonnes nouvelles : N1 test/sonde, N2 financement mixeur, N3 vidage simultané multi-wallets/chaînes, N5 conversion en non-gelable, N6 changement d'implémentation/autorité, N9 adresse sosie ou étiquetée, N12 mint sans adossement ou asymétrie de pont.

| Incident | (a) | (b) | (c) | (d) | (e) | N1 | N2 | N3 | N5 | N6 | N9 | N12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Bitget 2026 | ● | ● | ◐ | – | ◐ | ? | ? | ● | ● | – | ◐ | – |
| Drift 2026 | ● | ● | ◐ | ● | ● | ◐ | ● | – | ● | ● | – | ◐ |
| KelpDAO 2026 | ● | ● | ● | ◐ | ● | ? | ? | ◐ | ● | ◐ | – | ● |
| Resolv 2026 | ● | ◐ | ● | ◐ | – | ? | ? | – | ● | – | – | ● |
| Step Finance 2026 | ● | ● | ? | ● | ? | ? | ? | ◐ | ? | ● | – | – |
| Upbit 2025 | ● | ● | ◐ | – | ◐ | ? | ? | ● | ? | – | – | – |
| SBI Crypto 2025 | ● | ● | ? | – | ? | ? | ? | ● | ◐ | – | ◐ | – |
| UXLINK 2025 | ● | ● | ● | ● | – | ? | ? | – | ● | ● | – | ● |
| SwissBorg/Kiln 2025 | ● | ◐ | ◐ | ● | – | ? | ? | – | ? | ● | – | – |
| BigONE 2025 | ● | ● | ● | – | – | ? | ? | ● | ? | – | – | – |
| CoinDCX 2025 | ◐ | ● | ◐ | – | – | ? | ? | – | ? | – | – | – |
| BtcTurk 2025 | ● | ● | ◐ | – | – | ? | ? | ◐ | ● | – | – | – |
| Nobitex 2025 | ● | ● | ◐ | – | ● | ? | ? | ● | – | – | – | – |
| Bybit 2025 | ● | ● | ◐ | ● | ● | ◐ | ? | – | ● | ● | ◐ | – |
| Infini 2025 | ● | ● | ◐ | ● | ◐ | ? | ? | – | ? | ◐ | – | – |
| Phemex 2025 | ● | ● | ◐ | – | ? | ? | ? | ● | ● | – | ◐ | – |
| M2 2024 | ● | ● | ◐ | – | ? | ? | ? | ● | ● | – | – | – |
| Radiant 2024 | ● | ● | ◐ | ● | ◐ | ? | ? | ● | ? | ● | – | – |
| BingX 2024 | ● | ● | ◐ | – | ◐ | ? | ? | ● | ● | – | – | – |
| Indodax 2024 | ● | ● | ● | – | ? | ? | ? | ● | ● | – | – | – |
| Lykke 2024 | ● | ● | ◐ | – | ? | ? | ? | ◐ | ● | – | – | – |
| BtcTurk 2024 | ● | ● | ◐ | – | ? | ? | ? | ● | ? | – | – | – |
| DMM 2024 | ● | ● | ◐ | – | ? | ? | ? | – | ? | – | ◐ | – |
| WazirX 2024 | ● | ● | ◐ | ● | ● | ● | ● | – | ● | ● | – | – |
| Mixin 2023 | ● | ● | ◐ | – | ? | ? | ? | ◐ | ● | – | – | – |
| CoinEx 2023 | ● | ● | ◐ | – | ? | ? | ? | ● | ? | – | ● | – |
| Stake 2023 | ● | ● | ◐ | – | ? | ? | ? | ● | ● | – | ● | – |
| HTX/Heco 2023 | ● | ● | ◐ | ◐ | ? | ? | ? | ● | ● | ◐ | – | ◐ |
| Poloniex 2023 | ● | ● | ◐ | – | ? | ? | ◐ | ● | ● | – | – | – |
| Orbit 2023 | ● | ● | ◐ | ◐ | ● | ? | ● | – | ● | – | – | ● |
| Harmony 2022 | ● | ● | ● | ◐ | ◐ | ? | ? | – | ● | – | – | ● |
| Ronin 2022 | ● | ● | ● | – | – | ? | ? | – | ? | – | – | ● |
| *(cas limite)* Atomic 2023 | ◐ | ◐ | – | – | – | ? | ? | ◐ | ● | – | – | – |

**Comptes [calcul sur les 32 lignes hors Atomic]** :
- **(a)** ● : 31/32 (◐ pour CoinDCX, parce que le wallet n'était pas inventorié).
- **(b)** ● : 30/32 (◐ pour Resolv, où le bon signal est le ratio de mint, et pour SwissBorg).
- **(c)** ● : 7/32 (Kelp, Resolv, UXLINK, BigONE, Indodax, Harmony, Ronin) ; ◐ pour presque tous les autres : réalisable seulement avec un flux back-office (demandes de retrait validées). **Le (c) n'est pas gratuit.**
- **(d)** ● : 8/32 = 25 % (Bybit, Drift, WazirX, Radiant, Infini, UXLINK, SwissBorg, Step) ; ◐ 5 ; – 19.
- **N3** (multi-wallets/chaînes) ● : 15/32. **N5** (conversion en non-gelable) ● : 19/32. **N12** (mint/pont asymétrique) ● : 6/32 (Kelp, Resolv, UXLINK, Orbit, Harmony, Ronin).

Lecture :
1. **D1 (a) et D2 (b) couvrent presque tout**, mais seulement pour les adresses qu'on **sait** surveiller. CoinDCX montre que l'inventaire des wallets du client est un prérequis (voir N13 dans §4).
2. **D7 (d) est décisif pour la classe « admin/multisig/Safe »** (8 cas, ≈ 2,1-2,2 Md$ cumulés : Bybit 1,4-1,5 Md$, WazirX 0,23, Drift 0,285, Radiant 0,05, Infini 0,049, Step 0,03-0,04, UXLINK ≥ 0,011, SwissBorg 0,041 [calcul]) mais n'a aucune prise sur les 19 cas sans changement de pouvoir.
3. **Dans plusieurs cas, le changement de pouvoir précède le vidage de minutes à jours** : WazirX (upgrade « quelques minutes » avant), SwissBorg (8 jours), Drift (nonce 9 jours avant, admin en minutes), Radiant (ownership puis upgrade), Step (autorité de stake puis unstake). C'est là que D7 donne un temps de réaction non nul, sous réserve d'un droit d'action (Guard).
4. **Bybit : D7 déclenche à l'upgrade, mais le délai upgrade → sweeps n'est pas dans mes sources** [ÀV]. Sans garde on-chain ou co-signature, un observateur extérieur n'a pas de levier.

### 3.1 Temps de réaction et fenêtre (données datées, hétérogènes)

| Incident | Durée de la sortie | Délai 1re sortie → 1re réaction identifiable | Nature de la réaction |
|---|---|---|---|
| M2 | n.d. | 16 min (affirmé par M2) | interne, non vérifié |
| Poloniex | n.d. | 21 min | alerte externe (PeckShield/Cyvers) |
| WazirX | minutes | ~30 min | confirmation WazirX après alerte Cyvers |
| KelpDAO | < 1 h | 46 min | pause du multisig Kelp |
| BingX | 2 vagues, heures | ~60 min | gel des retraits |
| Orbit | 17 min | 73 min | pont désactivé |
| Stake | n.d. | ~180 min | communication publique |
| CoinDCX | n.d. | ~1 020 min (17 h) | divulgation |
| Ronin | n.d. | ~8 640 min (6 jours) | retrait refusé signalé par un utilisateur |
| Lykke | n.d. | ~8 640 min (6 jours) | alerte externe puis reconnaissance |

Médiane sur ces 10 cas : **~66 min** [calcul]. Fenêtres de sortie : Drift **12 min**, Orbit **17 min**, Bitget **18 min** pour 59-65 % du total, Upbit « minutes ». **Dans les incidents rapides, la sortie est terminée avant la réaction médiane.** Conséquence pour la thèse de la piste : il faut un déclencheur machine dans les premières minutes **et** un plafond/sas en amont, sinon on mesure seulement la vitesse de l'alerte.

---

## 4. Signaux nouveaux (non listés dans a-e)

Pour chaque signal : preuve dans les incidents, détectabilité depuis l'extérieur, risque de faux positif, mapping. Cadres : NIST CSF 2.0 (IDs à contrôler sur le référentiel officiel), ATT&CK (T1657 vérifié sur attack.mitre.org), D3FEND (D3-UBA et D3-RAPA vérifiés sur d3fend.mitre.org ; les autres [ÀV]). **OWASP Agentic et ATLAS : sans objet** (aucun agent IA ciblé), comme dans le classement ; ATT&CK suffit pour le règlement.

| # | Signal | Preuve par incident | Détectable depuis l'extérieur ? Délai gagné | FP / limites | NIST CSF 2.0 | ATT&CK | D3FEND |
|---|---|---|---|---|---|---|---|
| **N1** | **Sonde / transaction de test** avant le gros transfert | WazirX : tx de test ETH, SHIB, USDT vers le multisig **≥ 8 jours avant** (Gupta, Rekt) ; Bybit : transfert de 90 USDT avant (ZachXBT, [S], ÀV) ; Drift : tx soumises 1 min après un test de retrait légitime (le test n'était pas celui de l'attaquant) | Oui si la source du test est une adresse inconnue qui envoie vers un wallet surveillé. **Jusqu'à 8 jours** (WazirX) | Poussière légitime (airdrops, address poisoning, spam) très fréquente : ne pas alerter seul, comme composant de score | DE.AE-02, DE.AE-03 | T1657 (préparation), T1078 | D3-UBA (analogie) ; D3-RAPA |
| **N2** | **Financement d'une adresse fraîche par mixeur / échange instantané**, puis premier contact avec le wallet ou le contrat surveillé | WazirX : ChangeNOW + Tornado Cash 8-10 juil. (**8-10 jours avant**) ; Drift : 10 ETH de Tornado Cash le 11 mars (**21 jours avant**) ; Orbit : Tornado via intermédiaire ; Poloniex : 0,5 ETH de gas envoyé avant chaque swap (variante gas) | Oui, c'est la provenance de l'adresse qui interagit (pas du wallet client). **Jours à semaines** | Beaucoup d'utilisateurs légitimes passent par un mixeur (FP au niveau de l'utilisateur, pas du protocole). Utile seulement **combiné** à N1/(d) | DE.AE-03, DE.CM-01, ID.RA-02 | T1657 | D3-IAA (Identifier Activity Analysis) [ÀV] |
| **N3** | **Vidage simultané de plusieurs hot wallets / plusieurs chaînes** par le même acteur | Bitget : 5 wallets, 7 chaînes ; Phemex : 16 chaînes ; BingX : ≥ 10 adresses ; Indodax : 5 chaînes synchronisées ; Upbit : 20+ tokens ; Poloniex : 3 chaînes ; BigONE : 4 réseaux ; Stake : 3 chaînes | Oui, **mais exige d'agréger au niveau de l'entité**, pas de l'adresse. Le D2 par adresse sous-estime : chaque wallet peut rester sous le seuil. **Minutes** | Rebalancements internes légitimes (cold → hot) : exclure par liste de wallets internes | DE.AE-03 (corrélation), DE.CM-01 | T1657 | D3-UBA ; D3-RAPA |
| **N4** | **Balayage par valeur décroissante jusqu'aux poussières** | Phemex (Halborn) ; Poloniex (317 tokens) | Oui, via la composition (D4) : un wallet dont le **nombre de tokens sortants** passe de ~5 à 300 en peu de temps | Réallocation légitime de trésorerie (rare à cette ampleur) | DE.AE-02 | T1657 | D3-RAPA |
| **N5** | **Conversion massive d'actifs gelables vers non gelables** (stablecoins → ETH/natifs) dans les minutes | Bitget : < 10 min, 75,48 M$ en 41 min ; Phemex ; WazirX (~150 M$ d'altcoins) ; Indodax (natifs de préférence) ; Mixin (USDT → DAI) ; Lykke (ETH → DAI) ; Bybit (stETH/cmETH → ETH) ; Stake | Oui. **Utile comme second signal de confirmation** (famille « composition ») et pour la fenêtre de gel : l'émetteur ne peut plus rien après | Opérations de trésorerie légitimes, mais pas en 10 min depuis des adresses inédites | DE.AE-02, RS.AN-03, RS.MI-01 | T1657 | D3-UBA |
| **N6** | **Changement d'implémentation (proxy) ou d'autorité** : `masterCopy` Safe, `upgradeTo`, `transferOwnership`, `addOwnerWithThreshold`, `UpdateAdmin`, autorité de stake Solana, `setAuthority` | Bybit (delegatecall, slot 0) ; WazirX (upgrade vers contrat malveillant) ; Radiant (`transferOwnership` puis upgrade) ; UXLINK (`addOwnerWithThreshold`) ; Drift (`UpdateAdmin`) ; Step Finance et SwissBorg (autorité de stake) ; Infini (rôle admin) ; Kelp (DVN 2-de-2 → 1-de-1) | Oui, **c'est D7 élargi** : à Solana (autorités de stake, durable nonces) et aux contrats tiers dépendants (DVN). **De quelques minutes (WazirX) à 8 jours (SwissBorg)** | Upgrades légitimes planifiés : réduits par un calendrier de maintenance déclaré par le client | DE.CM-01, DE.CM-03, DE.AE-02, PR.AA, GV.RR | T1098 (Account Manipulation), T1078, T1565.002 | D3-ACH (Application Configuration Hardening) [ÀV] ; D3-UBA |
| **N7** | **Contrat de l'attaquant déployé juste avant** (bytecode non vérifié, fonctions `sweep*`) | Bybit : contrats `0x9622…` et `0xbDd0…` déployés les 18-19 fév. (AnChain, [S], ÀV) ; WazirX : déployé le 10 juil. ; Radiant : backdoor ~17:09 UTC | Oui pour les contrats **liés à un wallet surveillé** après coup ; **avant**, seulement si on surveille les contrats déployés par des adresses financées par un mixeur (N2). **Heures à jours** | Énorme volume de déploiements : utile seulement avec N2 | DE.CM-01, DE.AE-03 | T1587.004 (développement d'exploit) [ÀV] | D3-FA (File Analysis) [ÀV] |
| **N8** | **Approbations illimitées** (`approve(max)`) vers un contrat inconnu, et **utilisation d'un rôle dormant** | Radiant : vidage de wallets utilisateurs via approbations illimitées (5-6 M$, Hacken/Revoke) ; Infini : premier usage du rôle admin conservé après des mois | Oui : les `Approval` sont des logs ; le **premier usage d'un rôle** est détectable par historique. **Heures à jours** | Approbations max légitimes (DEX) très courantes : cibler les **contrats ou wallets du client** et les spenders inédits | DE.CM-03, DE.AE-02 | T1078 (comptes valides, rôle dormant) | D3-UBA ; D3-RAPA |
| **N9** | **Adresse sosie** (mêmes premiers et derniers caractères qu'une adresse connue) **et adresse déjà étiquetée** par des tiers (FBI, ZachXBT, listes d'attaquants) | DMM : adresse de destination ressemblant à l'habituelle (mononaut, [S], ÀV) ; Stake : liste FBI du 7 sept. ; CoinEx : adresse commune avec Stake ; Phemex/Bybit : adresse commune (ZachXBT) | Oui (comparaison de préfixe/suffixe avec le carnet du client, plus abonnement à des listes publiques). **Immédiat** (à la 1re tx) | Labels de qualité inégale ; la proximité de préfixe produit des FP sur de grands carnets : seuil à étalonner | DE.AE-02, ID.RA-02 (renseignement) | T1657 | D3-UBA |
| **N10** | **Montants en tranches régulières ou vagues espacées** | Bitget : 5 × 5 M$ vers un filler UniswapX ; Bybit : tranches de ~27 M$ ; BingX : 2 vagues à quelques heures | Oui (régularité, entropie des montants) ; **sert à distinguer script d'humain** | Paiement de fournisseurs en lots réguliers : FP sur un wallet de paiements | DE.AE-02 | T1657 | D3-UBA |
| **N11** | **Création de comptes « durable nonce » ou de pré-signatures longues** (Solana) | Drift : 4 comptes nonce créés le 23 mars pour 2 signataires + 2 comptes attaquant ; re-création après la migration du 27 mars ; soumission le 1er avr. | Oui sur Solana (comptes de nonce rattachés à des membres du conseil) : **9 jours d'avance** | Usage légitime rare mais existant (relais, services hors ligne) : exige la liste des signataires | DE.CM-03, DE.AE-02, ID.AM | T1098, T1550 (matériel d'authentification alternatif) [ÀV] | D3-UBA |
| **N12** | **Mint ou libération sans adossement / asymétrie de pont** (offre > réserve ; retrait côté destination sans dépôt/burn côté source ; mint ≫ valeur déposée) | Kelp (116 500 rsETH sans burn Unichain) ; Resolv (50 M USR pour 100 k$ ; 500×) ; UXLINK (10 000 Md UXLINK) ; Ronin, Orbit, Harmony (retraits du pont sans dépôt) ; Drift (750 M CVT mintés) | Oui, **par invariants on-chain publics** (comparer deux chaînes ou offre contre réserve). **Dès la 1re tx** ; pour Resolv **~2 h avant le 2e mint** | Mint légitime en gros volume (rare) ; dépendance à la bonne lecture des deux chaînes | DE.CM-01, DE.AE-02, PR.DS | T1565.002 (altération de données transmises), T1657 | Invariant : pas d'équivalent D3FEND vérifié ; D3-UBA en repli |
| **N13** | **Wallet non inventorié / rôles découverts tard** ; **retraits sans demande back-office** | CoinDCX : compte opérationnel non étiqueté et absent des preuves de réserves ; BigONE, Bitget, Indodax : sorties sans demande de retrait client équivalente | Oui seulement si l'on **découvre** le wallet : cartographie de clusters (co-dépenses, financement commun) puis ajout à la watchlist. **Prérequis** de D1/D2/D3 | Découverte de cluster imprécise ; dépend de données client (CASP_SUPPLIED) | ID.AM-01, ID.AM-02, DE.CM-01 | T1657, T1199 (relations de confiance) | D3-AI (Asset Inventory) [ÀV] |

### Signaux secondaires (faible poids, utiles seulement en score composite)

| # | Signal | Preuve | Limite |
|---|---|---|---|
| S1 | Heure creuse du fuseau de la victime | Bitget 02:31 UTC+8 ; Upbit 04:42 KST ; BingX ~04:00 SGT ; Step Finance en heures Asie-Pacifique ; Drift pendant les heures ouvrées US | Très fort taux de faux positifs ; contexte (e) seulement |
| S2 | Destinataire à clé inconnue (adresse vanity à long motif ASCII = destruction) | Nobitex | Cas isolé ; coûte peu à détecter |
| S3 | Sauts d'EOA intermédiaires avant consolidation | M2 (hot wallet → EOA → EOA de consolidation) ; Harmony (H1 → H4 → H5-H7) | Fréquent en blanchiment ; peu discriminant avant la sortie |
| S4 | Réveil de fonds dormants (mois à années) | HTX (~112 j), Mixin (~2,4 ans) | Après coup : sert au traçage et au dossier de gel, pas à la détection initiale |
| S5 | Transfert légitime qui échoue quelques minutes avant | WazirX (USDT) | Une seule source, interprétation a posteriori |

### Signaux évoqués dans la demande, avec verdict honnête

| Signal demandé | Verdict | Détail |
|---|---|---|
| Vidage simultané de plusieurs hot wallets | **Étayé** | N3. |
| Transfert de propriété de contrats | **Étayé** | N6 (Radiant `transferOwnership`, Drift `UpdateAdmin`, UXLINK `addOwnerWithThreshold`). |
| Approbations illimitées | **Étayé, partiel** | N8 (Radiant). Un seul cas dans mon périmètre. |
| Changement d'implémentation de proxy | **Étayé** | N6 (Bybit, WazirX, Radiant). |
| **Gas anormal** | **Non étayé** | Aucune source lue ne documente un prix de gas ou une priorité anormale. Seul fait lié : financement en gas de wallets frais (Poloniex 0,5 ETH, variante de N2). **Je ne propose pas « gas anormal » comme signal.** Hypothèse à tester en rejeu seulement. |
| Adresses fraîchement financées par un mixeur | **Étayé** | N2 (WazirX, Drift, Orbit). |
| Test de petite somme avant gros transfert | **Étayé** | N1 (WazirX, Bybit [ÀV]). Attention aux faux positifs de poussière. |

### Compatibilité avec l'architecture v1

- **D1** (a) : étendre à N9 (sosie, étiquette tierce) et N2 (provenance de l'adresse destinataire).
- **D2** (b) : agréger au niveau **entité**, pas adresse (N3), et suivre le nombre de tokens (N4).
- **D3** (c) : deux variantes : écart backend/chaîne (nécessite CASP_SUPPLIED, déjà dans le modèle de provenance) et invariants N12 (mint contre réserve, pont entre chaînes). La seconde ne dépend pas du client.
- **D7** (d) : étendre à Solana (autorités de stake, durable nonces) et aux contrats tiers dépendants (DVN, N6).
- **D4** (composition) et **D6** (mint non adossé), classés « bonus P3 », sont portés par N5 (19/32 incidents) et N12 (6/32, dont Kelp 292 M$) : à reclasser par la décision de périmètre.
- Mode Watch : le gain principal vient de N3 + N2 + N6 + N12, qui ne demandent aucun accès au client.
- Mode Guard : nécessaire pour borner les cas où l'incident dure moins que la réaction humaine (Drift 12 min, Orbit 17 min, Bitget 18 min).

### Candidats de rejeu (données publiques, EVM)

Par ordre de richesse en faits sourcés : Poloniex (357 tx, 681 wallets, horodatage 10:34 UTC), Orbit (5 tx, 21:08-21:25 UTC, mixeur avant), WazirX (tests + upgrade + financement Tornado, hashes cités), Harmony (9-11 tx), Kelp (1 tx), Resolv (2 mints avec heures), Bybit (6 tx, hashes cités). Sur Avalanche : Bitget (821 012 AVAX ≈ 8,38 M$, Lookonchain [S]) et BingX (AVAX parmi les chaînes) ; Stake (pont Polygon → Avalanche). **Adresses et blocs à vérifier sur l'explorateur avant tout usage** (règle de l'architecture §9).

---

## 5. Ce que j'ai cherché sans le trouver

- **Heure et durée upgrade → sweeps pour Bybit**, **délai upgrade → premier retrait pour WazirX** (source : « quelques minutes », pas de chiffre), **heure de réaction de Drift, Radiant, Phemex, DMM, CoinEx, Upbit** : non publiés dans les sources lues.
- **Rapport primaire de Bitget/Mandiant** (non publié en entier), **post-mortems Kelp et LayerZero** (le conflit de config 2-de-2 → 1-de-1 reste ouvert), **post-mortem Radiant** (non ouvert).
- **Nombre de tx de Ronin** : non confirmé ; **seuil de Harmony** (2-de-5) : non confirmé ; **7-sur-10 d'Orbit** : suggestion d'un chercheur, non confirmée.
- **Aucun autre vol de CASP agréé MiCA en 2026** que Bitget n'est apparu ; la recherche n'est pas exhaustive (pas de lecture de la base DeFiLlama ni de SlowMist Hacked). Aucun incident Lykke ou M2 en 2026 : ce sont des incidents de 2024.
- Les résumés de moteur de recherche sont générés et peuvent mélanger des faits : tout chiffre marqué [S] ou [ÀV] doit être rouvert avant slide.
- **Aucune cellule de la matrice n'est un résultat de rejeu.** Le message au jury reste : « nous mesurons, nous n'affirmons pas ».

## 6. Questions ouvertes pour décision (Adem / Titouan)

1. Reclasser D4 (composition) et D6 (mint non adossé / pont) en P1 au vu de N5 et N12 ?
2. Mode Watch : agrégation **par entité** (N3) plutôt que par adresse. Impact sur `OutflowLedger`.
3. Un champ « origine de l'adresse destinataire » (financée par mixeur, étiquetée) dans les preuves de D1 (N2, N9).
4. D7 sur Solana : hors périmètre aujourd'hui (Drift, Step et SwissBorg sont Solana). Rester EVM, et le dire (l'architecture le dit déjà pour Drift).
5. « Gas anormal » : ne pas l'inscrire dans le pitch.

---

## 7. Sources (liste consolidée)

Pages ouvertes (P) :
- Bitget : https://www.bleepingcomputer.com/news/security/bitget-hacked-via-zero-day-in-third-party-security-products/amp/ ; https://www.theregister.com/a/5299218 ; https://news.bitcoin.com/featured/bitget-hackers-drain-228m-in-18-minutes-arkham-tracks-7-chains/ (S)
- Drift : https://blocksec.com/blog/drift-protocol-incident-multisig-governance-compromise-via-durable-nonce-exploitation ; https://cointelegraph.com/news/tether-150m-recovery-drift-protocol
- Kelp : https://defiprime.com/kelpdao-rseth-exploit ; https://www.merklescience.com/blog/hack-track-how-attackers-stole-292m-from-kelp-dao
- Resolv : https://www.certik.com/resources/blog/resolv-protocol-incident-analysis
- Bybit : https://blocksec.com/blog/bybit-incident-a-web2-breach-enables-the-largest-crypto-hack-in-history
- WazirX : https://rekt.news/wazirx-rekt
- DMM : https://www.merklescience.com/blog/hack-track-dmm-flow-of-funds-analysis
- Radiant : https://multisiginspector.quillaudits.com/hacks/radiant-capital-2024-10 (la page elle-même signale l'absence de calldata)
- Phemex : https://www.merklescience.com/blog/hack-track-phemex-flow-of-funds-analysis ; https://halborn.com/blog/post/explained-the-phemex-hack-january-2025
- CoinEx : https://www.halborn.com/blog/post/explained-the-coinex-hack-september-2023 ; https://forklog.com/en/coinex-confirms-hack-of-hot-wallets/
- Ronin : https://forklog.com/en/ronin-sidechain-developers-reveal-further-details-of-625-million-hack/amp
- Harmony : https://www.merklescience.com/blog/hack-track-analysis-of-harmonys-horizon-bridge-exploit
- Poloniex : https://www.certik.com/resources/blog/poloniex-incident-analysis
- BingX : https://halborn.com/blog/post/explained-the-bingx-hack-september-2024
- Indodax : https://www.merklescience.com/blog/hack-track-indodax-flow-of-funds-analysis
- M2 : https://www.quillaudits.com/blog/hack-analysis/m2-crypto-exchange-exploit
- BtcTurk 2024 : https://www.halborn.com/blog/post/explained-the-btc-turk-hack-june-2024
- Upbit : https://www.halborn.com/blog/post/explained-the-upbit-hack-november-2025
- Cadres : https://attack.mitre.org/techniques/T1657/ ; https://d3fend.mitre.org/technique/d3f:UserBehaviorAnalysis/

Relais ou résumés non ouverts (S) :
- Bitget : https://crypto.news/bitget-probe-points-to-backend-breach/ ; https://thehackernews.com/2026/09/bitget-says-suspected-north-korean.html ; https://www.ccn.com/news/crypto/bitget-hack-387m-discord-kelp-dao-launderer/ ; https://www.fxstreet.com/cryptocurrencies/news/near-price-forecast-near-intents-blocks-more-than-50m-in-attempted-laundering-linked-to-bitget-exploit-202609290043 ; https://decrypt.co/379365/circle-tether-freeze-stablecoins-bitget-hack ; https://decrypt.co/379275/bitget-hack183-million-crypto-exchange-wallets
- Drift : https://research.4pillars.io/en/research/reflections-on-the-drift-protocol-exploit ; https://members.delphidigital.io/feed/250m-stolen-from-drift-what-we-know ; https://blockeden.xyz/blog/2026/04/04/circle-usdc-freeze-failure-drift-hack-stablecoin-selective-enforcement/
- Kelp : https://www.coindesk.com/tech/2026/04/20/kelp-dao-claims-layerzero-s-default-settings-are-what-actually-caused-the-usd290-million-disaster ; https://whale-alert.io/stories/fbb6017e77e70e/LayerZero-report-Kelp-downgraded-from-2-of-2-to-1-of-1-DVN-before-292M-rsETH-exploit-six-week-compromise-traced-to-DPRK-linked-UNC4899 ; https://www.theblock.co/post/401060/kelp-dao-aave-resume-rseth
- Resolv : https://www.theblock.co/post/394582/resolvs-usr-stablecoin-depegs-after-attacker-mints-80-million-unbacked-tokens-extracts-roughly-25-million ; https://blockeden.xyz/blog/2026/04/21/resolv-labs-usr-stablecoin-exploit-aws-kms-key-compromise/
- Step : https://rekt.news/fr/step-finance-rekt ; https://www.crowdfundinsider.com/2026/02/263817-step-finance-ceases-operations-following-40-million-security-incident/
- Upbit : https://www.scorechain.com/blog/upbit-hot-wallet-hack-explained-solana-outflows-risks-and-blockchain-monitoring
- Bybit : https://www.elastic.co/security-labs/bit-bybit ; https://thedefiant.io/news/hacks/bybit-hack-lazarus-group-launders-1-4b-eth-via-thorchain-converts-to-bitcoin-94fa64e5 ; https://www.theblock.co/post/343855/bybit-hackers-half-the-stolen-eth-bitcoin-fbi-confirms-lazarus ; https://www.theblock.co/post/343530 ; https://lukka.tech/bybit-hack-exploiting-smart-contracts-to-drain-funds-a-deep-dive-on-how-it-happened/ ; https://info.arkm.com/announcements/bybit-1-billion-hack-bounty-solved-by-zachxbt
- WazirX : https://quillaudits.com/blog/hack-analysis/wazirx-235m-hack ; https://inc42.com/?p=469895 ; https://cointelegraph-magazine.com/?p=34495 ; https://decrypt.co/301538/wazirx-freezes-3-million-hack
- DMM : https://www.bleepingcomputer.com/news/security/fbi-links-north-korean-hackers-to-308-million-crypto-heist ; https://cointelegraph.com/news/fbi-reveals-dmm-crypto-hack-300m-north-korea
- Radiant : https://thedefiant.io/news/defi/radiant-capital-winds-down-2m-husk-dprk-50m-heist ; https://www.theblock.co/post/321606/radiant-capital-appears-to-suffer-51-million-exploit-on-its-bnb-chain-and-arbitrum-instances ; https://hacken.io/insights/radiant-hack-review/ ; https://revoke.cash/exploits/radiant
- Orbit : https://www.rekt.news/orbit-bridge-rekt ; https://www.blockworks.co/news/80-million-lost-orbit-bridge ; https://cointelegraph.com/news/orbit-chain-hacker-moves-nearly-48-million-via-tornado-cash
- HTX : https://www.certik.com/resources/blog/heco-bridge-exploit ; https://www.theblock.co/post/284107/heco-bridge-exploiters-launder-145-million-usd-eth-tornado-cash ; https://elliptic.co/blog/north-korean-hackers-return-to-tornado-cash-despite-sanctions
- Mixin : https://cointelegraph.com/news/mixin-network-hack-200-m-crypto-assets ; https://decrypt.co/358032/3-million-ethereum-mixin-network-hack-tornado-cash ; https://www.theblock.co/post/389869/wallet-tied-to-200m-mixin-network-hack-moves-eth-after-over-two-years-of-dormancy-onchain-data
- Stake : https://cointelegraph.com/news/stake-hack-of-41m-was-performed-by-north-korean-group-fbi ; https://www.securityweek.com/fbi-blames-north-korean-hackers-for-41-million-stake-com-heist/
- Atomic : https://www.coindesk.com/tech/2023/06/13/atomic-wallet-hackers-move-stolen-funds-via-ofac-sanctioned-exchange-garantex-elliptic ; https://www.csoonline.com/article/3698709/atomic-wallet-hack-leads-to-at-least-35m-in-stolen-crypto-assets.html
- Ronin : https://www.elliptic.co/insights/540-million-stolen-from-the-ronin-defi-bridge/ ; https://halborn.com/explained-the-ronin-hack-march-2022/
- Lykke : https://forklog.com/en/lykke-exchange-halts-operations-following-22-million-hack/ ; https://cointelegraph.com/news/lykke-crypto-exchange-acknowledges-hack-halting-withdrawals
- Autres 2025 : https://www.theblock.co/post/362814/bigone-hack ; https://forklog.com/en/coindcx-exchange-suffers-44-million-hack/ ; https://cryptoslate.com/btcturk-hack-sees-48-million-in-crypto-vanish-from-hot-wallets/ ; https://slowmist.medium.com/nearly-100-million-burned-irans-largest-crypto-exchange-nobitex-suffers-major-hack-eafd57b2eac7 ; https://unchainedcrypto.com/sbis-bitcoin-mining-pool-hacked-for-21-million-zachxbt/ ; https://www.certik.com/resources/blog/0xinfini-incident-analysis ; https://www.theblock.co/post/371783/uxlink-multisig-hack ; https://www.halborn.com/blog/post/explained-the-swissborg-hack-september-2025
- Coinbase (négatif) : https://altfins.com/crypto-news/crypto-news-summary/318603

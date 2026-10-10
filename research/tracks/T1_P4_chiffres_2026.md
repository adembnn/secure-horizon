# T1 piste 4 : chiffres 2026 (détection/réponse DeFi + DORA, Avalanche)

> Recherche du 2026-10-10. Complète `research/tracks/T1_P4_defi_dora_v2.md` (v2) et remplace ses chiffres 2025 par du 2026 quand il en existe. Le règlement `context/notion_guide.md` prime.
> Légende qualité : **[P]** = page ou donnée lue directement par moi (éditeur, régulateur, API, rapport) ; **[S]** = presse/blog qui cite une source primaire que je n'ai pas lue en entier ; **[V]** = affirmation d'éditeur/vendeur ou source unique non recoupée, à vérifier avant slide.
> Règle de période : tout ce qui suit porte sur 2026 sauf mention « 2025 publié en 2026 » (signalé).
> Les cabinets (CertiK, TRM, Immunefi, SlowMist, Blockaid, PeckShield) comptent différemment : ne jamais additionner ni comparer leurs totaux sur une même slide sans citer l'éditeur.

## TL;DR

1. **T3 2026 = 1,26 Md$ de pertes sur 247 incidents (CertiK), +53,9 % vs T2** ; septembre est le pire mois de 2026 (~766-769 M$) ; cumul 2026 ≈ 2,68 Md$ (CertiK).
2. **Le code n'est pas le vecteur principal** : TRM H1 2026 = 76 % des pertes viennent d'infrastructures/clés/signature (15 % des incidents) ; Blockaid : 74 % OpSec ; SlowMist : clés privées 688 M$ sur 956 M$.
3. **La réponse humaine est trop lente** : Bitget (24/09, 387,5 M$) : Circle a gelé vers 05:00 UTC le 25/09, Tether ~7 h après ; seulement ~318 k$ gelés (≈ 0,08 % ; BlockSec dit 840 k$, 0,2 %). Contre-exemple : Parallel (mai 2026) pause automatique en « une poignée de blocs », 0 perdu (source vendeur).
4. **DORA : 3 383 incidents majeurs en 2025** (ESAs, publié 3 juin 2026), ~1/3 d'origine tierce ; France : 33 incidents, > 80 % prestataires (AMF, 29 sept. 2026) ; registre ESMA : ~362 CASP MiCA au 7 oct. 2026 (Allemagne 96, France 36, Pays-Bas 29).
5. **Avalanche** : RWA « distribué » ~1,65-1,7 Md$ (Nansen/rwa.xyz), TVL DeFi 625 M$ (API DefiLlama, 10 oct.) ; Hexagate gratuit pour les builders ; Bitget a touché de l'AVAX (821 k AVAX ≈ 8,4 M$, Lookonchain).

## 1. Tableau des chiffres

### 1.1 Pertes crypto 2026

| Chiffre | Valeur | Période | Publié | Source | Q |
|---|---|---|---|---|---|
| Pertes totales CertiK | 1,26 Md$, 247 incidents (+53,9 % vs T2 : 819,4 M$ / 219 incidents) | T3 2026 | 1 oct. 2026 | https://cointelegraph.com/news/bitget-hack-q3-industry-losses-1-26-billion | P (lu) |
| Septembre, CertiK | ~769 M$, 99 incidents ; 273 M$ gelés/rendus ; net 495,3 M$ ; 58 exploits = 734 M$ (~96 %) | sept. 2026 | 1 oct. 2026 | idem | P |
| Septembre, PeckShield | ~766,5 M$, 55 incidents majeurs ; août = 136,3 M$ | sept. 2026 | 1 oct. 2026 | https://cointelegraph.com/news/crypto-hacks-total-766m-in-september-peckshield ; https://en.cryptonomist.ch/2026/10/01/crypto-hacks-september-2026/ | S |
| Cumul 2026 CertiK | ~2,68 Md$ | 1er jan.-30 sept. 2026 | début oct. 2026 | https://www.coininsider.org/news/crypto-lost-1-26-billion-to-hacks-in-q3-even-as-bitcoin-posted-its-best-quarter-since-2024/ | S |
| Top 4 incidents T3 | Bitget 387,5 M$ (~31 % du trimestre) ; Liquid Network 319 M$ (6 sept.) ; Tectonic 120 M$ ; Coldcard 112,7 M$ | T3 2026 | 1 oct. 2026 | Cointelegraph (idem) | P |
| CertiK H1 2026 | 1,32 Md$ (1 315 676 432 $), 344 incidents, -46,8 % sur un an ; hors Bybit 2025 : +28 % | H1 2026 | 6-17 juil. 2026 | https://forklog.com/en/certik-says-crypto-hack-losses-hit-1-32b-in-h1-2026/ ; https://www.forbes.com/sites/boazsobrado/2026/07/17/fewer-but-far-more-surgical-crypto-hacks-hit-13-billion-in-2026/ | P (Forklog lu) / S |
| CertiK T2 2026 | 807,5 M$ (+59 % vs T1) ; KelpDAO + Drift > 70 % ; phishing 1er vecteur au T1, wallet compromise au T2 | T2 2026 | 6 juil. 2026 | Forklog (idem) | P |
| TRM H1 2026 | 972 M$, 207 hacks (record), contre ~2,3 Md$ H1 2025 ; 125 exploits de contrats (~60 % des incidents) ; infra/clés/signature = ~15 % des incidents mais ~76 % des pertes ; RPDC ~643 M$ (66 %) | H1 2026 | juil. 2026 | https://www.crowdfundinsider.com/2026/07/288999-crypto-hacks-surged-to-record-highs-in-h1-2026-yet-total-losses-fall-sharply-below-1-billion/ ; https://blockonomi.com/crypto-hacks-hit-record-207-cases-in-h1-2026-but-losses-decline-trm-labs/ | S |
| Immunefi H1 2026 | 972 M$, 207 hacks ; DeFi 680,3 M$ (période ambiguë dans l'article) | H1 2026 | 9 juil. 2026 | https://www.theblock.co/post/407707 | P (lu) mais voir note 1 |
| SlowMist H1 2026 | ~956 M$, 182 incidents (vs 121 / 2,373 Md$ H1 2025) ; clés privées 688 M$ ; 76 incidents de smart contracts ; Ethereum 70, BNB 27, Base 16 (un autre relais donne 158 incidents / 929 M$) | H1 2026 | juil. 2026 | https://coinedition.com/slowmist-says-there-were-182-blockchain-security-issues-in-h1-2026/ ; https://www.dualmedia.com/crypto-hacks-2026/ | S (PDF 403) |
| Blockaid H1 2026 | ~1,1 Md$, 212 attaques réussies (record semestriel), 74 % OpSec, un cluster RPDC = 55 % des pertes | H1 2026 | juil. 2026 | https://forklog.com/en/blockaid-reports-record-crypto-hacks-in-first-half-of-2026/ | S ; les 74 %/55 % viennent d'un post LinkedIn : V |
| Hacken T1 2026 | 482,6 M$, 44 incidents (2e plus bas T1 depuis 2023) | T1 2026 | avr. 2026 | https://hacken.io/insights/q1-2026-security-report/ | S (pas de rapport H1 trouvé) |
| DeFi, 2026 | ≥ 1,3 Md$ ; Lazarus ≥ 575 M$ (~44 %) ; 30+ exploits > 3 M$ (Rekt) ; TVL Aave -6,28 Md$ en 48 h après KelpDAO | jan.-août 2026 | 4 sept. 2026 | https://crypto.news/defi-hacks-2026-billion-lost-same-attack-keeps-working/ | P (lu), chiffres internes S |
| LayerZero | 47 % des OApps (> 1 200) en vérificateur unique | 2026 | 4 sept. 2026 | idem | S |
| Chainalysis mi-année 2026 | Pas de total « hacks » trouvé. Seulement les attaques violentes (« wrench ») : > 30 M$ extraits, 46 incidents, 26 % de succès (vs 49 % 2025), France épicentre | H1 2026 | juin-juil. 2026 | https://www.chainalysis.com/blog/violent-crypto-wrench-attacks-2026/ | S |
| Hacks d'octobre 2026 (1-9 oct.) | 79th Vault 12,5 M$ (BNB, fuite de clé privée, 7 oct.) ; NEAR Intents ~3,8 M$ (préliminaire, 1er oct.) ; MakerDAO keeper bot 538 k$ ; FlashLoopAdapter (Aave V3 Loop) 305 k$ ; autres < 120 k$ | 1-9 oct. 2026 | 10 oct. 2026 (consulté) | https://hacked.slowmist.io/ | P (base lue) ; date de mise à jour de la page inconnue |
| DeFiLlama hacks (API) | ~70 entrées 2026 visibles dans les 100 000 premiers caractères ; aucune d'octobre dans la partie lue ; unités mélangées | 2026 | 10 oct. 2026 | https://api.llama.fi/hacks | P mais partielle, ne pas citer de total |

Note 1 : TRM et Immunefi affichent **exactement le même couple 207 / 972 M$**. Soit l'un reprend l'autre, soit les relais les confondent ; je ne peux pas trancher sans le PDF TRM. À citer comme « 207 hacks, 972 M$ (TRM/Immunefi) » avec réserve, ou éviter.

### 1.2 Vecteurs (2026)

| Vecteur | Chiffre | Source | Q |
|---|---|---|---|
| Infra/clés/signature | ~76 % des pertes H1 (TRM) ; 74 % (Blockaid) ; 72 % « clés volées » (relais) | liens §1.1 ; https://crypto.news/defi-hacks-2026-billion-lost-same-attack-keeps-working/ | S |
| Clés privées | 688 M$ sur ~956 M$ (SlowMist H1) | coinedition | S |
| Bitget (infra tierce) | 387,5 M$, 24 sept. : vulnérabilité d'un produit de sécurité tiers, identifiants internes, ordres de retrait falsifiés, sans clé privée volée ; Mandiant + SlowMist enquêtent | https://cointelegraph.com/news/bitget-hack-q3-industry-losses-1-26-billion ; https://www.bleepingcomputer.com/news/security/bitget-hacked-via-zero-day-in-third-party-security-products/amp/ | P / S |
| Bridge à vérificateur unique | KelpDAO 292 M$ (18-19 avr.), 116 500 rsETH mintés ; AFX Trade 24,15 M$ (22 juil., 5 signatures de validateurs) | crypto.news (idem) | S |
| Multisig/ing. sociale | Drift 285 M$ (1er avr.), vidé en 128 s selon crypto.news (v2 : 31 retraits en 12 min) | crypto.news ; v2 | S |
| Bug de validation | Liquid Network 319 M$ (6 sept.) : bug du cache de preuves de range dans Elements ; 36 min entre mint et paiement ; ~85 % (≈ 272 M$) rendus en ~1 jour ; ~598,5 BTC gardés | https://www.trmlabs.com/resources/blog/2026s-biggest-hack-to-date-attackers-drained-usd-319-million-in-bitcoin-from-liquid-network-then-returned-85-of-funds (8 sept. 2026) | P |
| Manipulation de prix/oracle | Tectonic (Cronos) 30 août : ~74-75 M$ sortis (120 M$ notionnels), tout en une transaction ; Moonwell ~9 M$ (27 août) ; Rhea Lend (NEAR, 16 avr.) | v2 (TRM, Cointelegraph) ; crypto.news ; DeFiLlama | S |
| Firmware | Coldcard 112,7 M$ (T3, CertiK) / ~130 M$ (Galaxy via crypto.news), seeds brute-forçables | idem | S, écart de montant |

### 1.3 Réaction, pause, gel (2026)

| Chiffre | Valeur | Période | Publié | Source | Q |
|---|---|---|---|---|---|
| Pause auto réussie (Parallel) | Contrat d'attaque déployé le 7 mai ; pause « quelques secondes après la tx de déploiement », « une poignée de blocs » ; > 1,52 M$ exposés, 0 perdu ; watchlist dont Avalanche | 7 mai 2026 | 26 mai 2026 | https://www.hypernative.io/blog/how-an-automated-pause-prevented-a-1-52m-exploit-on-parallel | P (lu) mais V (blog de l'éditeur) |
| Autres « sauvetages » Hypernative | Kinetic (Flare) 5 M$ ; ~13 M$ récupérés après phishing, alerte < 2 min | non datés | n.d. | hypernative.io (pages produit) | V, non daté : ne pas citer comme 2026 |
| Gel Circle/Tether après Bitget | Circle : blacklist ~05:00 UTC le 25 sept. ; Tether ~7 h plus tard ; 99 990 USDC + 218 023 USDT ≈ 318 k$ = ~0,08 % du vol. BlockSec : ~840 k$ gelés (Tether, Circle, NEAR Intents) = 0,2 % | 25 sept. 2026 | 25 sept. 2026 | https://decrypt.co/379365/circle-tether-freeze-stablecoins-bitget-hack ; https://en.cryptonomist.ch/2026/09/25/bitget-crypto-hack-freeze/ | S (Decrypt lu) |
| Conversion en 41 minutes | ~75,48 M$ (USDT/USDC/USDT0 + 3 000 XAUt) convertis en ETH/AVAX en 41 min (BlockSec) | 24 sept. 2026 | fin sept. 2026 | résumé de recherche (BlockSec) ; v2 cite Coinotag | S |
| AVAX dans Bitget | 821 012 AVAX ≈ 8,38 M$ (Lookonchain) | 24 sept. 2026 | fin sept. 2026 | résumé de recherche | S |
| Récupéré/gelé sept. | 273 M$ (CertiK) ; dont Liquid ~272 M$ rendus | sept. 2026 | 1 oct. 2026 | Cointelegraph ; TRM | P |
| Fonds de protection Bitget | > 464 M$ avant, ~309 M$ reconstitué au 30 sept. | sept. 2026 | 3 oct. 2026 | https://247wallst.com/investing/cryptocurrency/2026/10/03/bitget-rebuilt-a-309-million-protection-fund-after-a-388-million-hack-is-your-crypto-safe-on-an-exchange/ | S |
| T3 FCU (Tether/TRON/TRM) | > 450 M$ gelés cumulés | mai 2026 | mai 2026 | https://unchainedcrypto.com/t3-financial-crime-unit-says-it-has-frozen-more-than-450-million-in-illicit-crypto-globally/ | S (repris de v2) |

### 1.4 Avalanche

| Chiffre | Valeur | Période | Publié | Source | Q |
|---|---|---|---|---|---|
| TVL DeFi Avalanche | **624,6 M$** (lecture API) | 10 oct. 2026 | direct | https://api.llama.fi/v2/chains | P |
| TVL DeFi total | 95,7 Md$ ; assurances suivies par DefiLlama 130,1 M$ (Nexus 114,7 M$) | 27 sept. 2026 | sept. 2026 | https://www.upshift.finance/blog/defi-insurance | S |
| RWA Avalanche (Nansen) | 1,65 Md$ fin T2 (+27 % vs avril : 1,33 Md$) ; dont C-Chain hors stablecoins 1,25 Md$, L1 Intain 395 M$ ; BUIDL 402 M$ au 30 juin (189 M$ fin avril) ; Janus Henderson AAA CLO 260 M$ | T2 2026 | 5 août / 1 oct. 2026 | https://nansen.ai/post/avalanche-q2-2026-report | P |
| RWA rwa.xyz | « Distribué » ~1,67 Md$ ; « représenté » 11,4 Md$ dont 10,7 Md$ = un seul token (AZX1, Bridgetower, 1 portefeuille) ; 1 255 actifs, 10 058 détenteurs | 7 oct. 2026 | oct. 2026 | https://bitquery.io/investigations/avalanche-real-world-assets-one-token | S ; **ne jamais citer 11 Md$** |
| Securitize sur Avalanche | +628 %, ~770 M$ mi-sept. (~moitié du marché RWA Avalanche) | mi-sept. 2026 | sept. 2026 | résumé de recherche | S/V |
| Progmat | Migration > 2 Md$ de titres tokenisés vers une L1 Avalanche, fin visée juin 2026 | 2026 | T1-T2 2026 | https://nansen.ai/post/avalanche-q1-2026-report | S |
| Activité C-Chain | 84,4 Md$ de transferts de stablecoins ; DEX 8,7 Md$ ; 235,6 M tx ; ~621 000 adresses actives/jour ; frais protocole 21 M$ | T2 2026 | 2026 | Nansen (idem) | P |
| Avalanche Payments Collective | 28 organisations (Franklin Templeton, VanEck, WisdomTree, Paxos...) | T2 2026 | 2026 | Nansen (idem) | P |
| Nombre de L1 | **Non trouvé** (aucun total dans Nansen T2) | n.d. | n.d. | n.d. | n.d. |
| Hexagate gratuit | Programme « tailored » aux fondations (Avalanche, Base, Plasma, MegaETH, Polygon, Cronos, Immutable) ; package avec 5 moniteurs personnalisés pour les builders Avalanche | déc. 2025 (annonce) | déc. 2025 | https://www.chainalysis.com/blog/hexagate-by-chainalysis-now-live-on-avalanche/ | S : annonce 2025, offre vivante |
| Incident Avalanche-natif 2026 | Aucun incident > 1 M$ confirmé sur un protocole C-Chain ; AVAX volé via Bitget ; THORChain 11 M$ sur ≥ 9 chaînes dont Avalanche (15 mai) ; ZetaChain (27 avr.) listé avec Avalanche | 2026 | n.d. | https://www.trmlabs.com/resources/blog/thorchain-exploit-drains-usd-11m-across-at-least-nine-chains-what-trm-knows-now ; api.llama.fi/hacks | S |

### 1.5 DORA / MiCA

| Chiffre | Valeur | Période | Publié | Source | Q |
|---|---|---|---|---|---|
| Incidents majeurs UE | 3 383 ; 0,18 par entité ; ~1/3 transfrontières ; ~1/3 d'origine tierce ; 2/3 sans impact ou impact mineur | **2025** (rapport publié en 2026, premier du genre : rien de plus récent) | 3 juin 2026 | https://www.regulationtomorrow.com/2026/06/esas-issue-first-report-on-dora-major-ict-related-incidents/ | S (blog), primaire ESAs non lu |
| Incidents France (AMF) | 33 incidents majeurs ; > 80 % via prestataires (55 % cyberattaque, 27 % accident) | **2025** (publié en 2026) | 29 sept. 2026 | https://www.lemondedudroit.fr/banque-finance/304-finance/105970-amf-rapport-sur-les-incidents-majeurs-en-2025-au-titre-du-reglement-dora.html | S |
| ACPR | Délais « rarement respectés », erreurs de classification et de complétude (v2 : 44 déclarations, 32 majeurs) | 2025 | 2026 | https://www.forvismazars.com/fr/fr/insights/publications-et-evenements/avis-d-experts/dora-retour-d-experience-et-enseignements | S (repris de v2) |
| Registre ESMA : CASP agréés | **362** au 7 oct. 2026 (27 pays EEE ; Allemagne 96, France 36, Pays-Bas 29 ; 218 « crypto-natifs », 144 finance trad.). Autres relevés : 367 (9 oct.), 386 (7 oct., avec Norvège), 361 (5 oct.), 352 (17 sept.), 294 (16 juil.) | oct. 2026 | 7 oct. 2026 | https://www.outrun.at/micar-dashboard (lu) ; https://paymentproviders.io/registry/mica | S (agrégateurs, ESMA non ouvert) |
| CTPP désignés | 19 prestataires (AWS, Google Cloud, Microsoft, Oracle, SAP, Accenture, Capgemini, Bloomberg, Equinix, Orange, TCS, Deutsche Telekom...) ; surveillance opérationnelle en 2026 ; liste mise à jour annuellement | désignation 18 nov. 2025 | nov. 2025 | https://www.morganlewis.com/blogs/sourcingatmorganlewis/2025/11/dora-eu-regulators-announce-list-of-critical-ict-third-party-providers ; https://vendorica.com/supervisory/critical-third-party-providers/ | S ; **aucun prestataire blockchain** dans la liste lue |
| Instructions ESAs de déclaration | PDF « Operational instructions » | 16 sept. 2026 | sept. 2026 | https://www.esma.europa.eu/sites/default/files/2026-09/DORA_Incident_reporting_-_Operational_instructions.pdf | P (lien, repris de v2) |
| Registre d'informations | Deuxième dépôt annuel ; autorités nationales transmettent aux ESAs au 31 mars ; 46 % jugent le registre l'exigence la plus dure (étude non nommée) | 2026 | 2026 | https://www.dnb.nl/ (avis mars 2026) ; résumé de recherche | S/V |
| Sanctions DORA | **Aucune sanction confirmée trouvée.** Un guide éditeur cite 42 000 € (FMA, Western Union Intl Bank, 14 juil. 2026) | 2026 | n.d. | https://www.legiscope.com/blog/dora-penalties-enforcement.html | V (source unique) |
| Part des entités conformes | ~50 % pleinement conformes en mars 2026 ; 44 % de lacunes en Allemagne | mars 2026 | 2026 | https://thenextweb.com/news/dora-compliance-european-financial-firms-not-ready ; https://www.advisori.de/en/blog/dora-2026-why-44-of-financial-companies-are-not-compliant-and-what-to-do-now | V (enquêtes non nommées) |

### 1.6 Assurance

| Chiffre | Valeur | Période | Publié | Source | Q |
|---|---|---|---|---|---|
| Couverture | 130,1 M$ d'assurance suivie vs 95,7 Md$ de TVL = ~0,14 % (calcul ; Nexus seul ~0,12 %) | 27 sept. 2026 | sept. 2026 | https://www.upshift.finance/blog/defi-insurance | S (calcul à mon compte) |
| Nexus Mutual | > 18,5 M$ de sinistres payés depuis 2019 ; sinistre Stream Finance ~95-100 k$ payé en < 1 semaine ; cover Aave v3 à 0,88-2,85 %/an, ~15 M$ de capacité ; exclut clés privées, phishing, front-end | 2019-sept. 2026 | 2026 | https://nexusmutual.io/defi-insurance ; https://nexusmutual.io/blog/nexus-mutual-pays-nearly-100k-in-claims-due-to-stream-finance-fallout | P (éditeur) |

## 2. Les 5 chiffres les plus forts pour une slide

1. **1,26 Md$ perdus au T3 2026, 247 incidents ; septembre = 766-769 M$, le pire mois de 2026** (CertiK / PeckShield, 1er oct. 2026).
2. **~76 % des pertes H1 2026 viennent d'infrastructure, de clés et de signature, pas de bugs de contrat** (TRM ; Blockaid 74 %). Bitget : 387,5 M$ par un produit de sécurité tiers. C'est exactement l'angle DORA « prestataire tiers ».
3. **~0,08 % des fonds Bitget gelés** (318 k$ sur 387,5 M$) ; Circle ~05:00 UTC le lendemain, Tether ~7 h plus tard. Contraste : **pause automatique en quelques blocs chez Parallel (mai 2026), 0 perdu** (source vendeur, à nuancer).
4. **> 80 % des 33 incidents majeurs français 2025 viennent de prestataires** (AMF, 29 sept. 2026) ; **3 383 incidents majeurs dans l'UE en 2025, ~1/3 tiers** (ESAs, 3 juin 2026). Ne pas mélanger ces deux pourcentages (définitions différentes).
5. **~362 CASP agréés MiCA (registre ESMA, 7 oct. 2026) donc soumis à DORA, contre ~0,14 % du TVL DeFi assuré** : le marché cible grossit, la protection financière est quasi nulle.

## 3. Ce que je n'ai pas trouvé

- **Rapport primaire Chainalysis mi-année 2026 sur les vols totaux** : seul le volet « wrench attacks » existe.
- **Rapports Hacken H1 / T3 2026**, **Immunefi T3 2026**, **TRM T3 2026**, **Blockaid** (PDF non lu), **SlowMist** (Medium 403) : chiffres via relais seulement.
- **Ventilation par vecteur du T3 2026** : CertiK ne la publie pas dans l'article lu.
- **Rapport KPMG 2026 sur la maturité DORA** : introuvable. Les statistiques de maturité (50 %, 44 %, 46 %) viennent de blogs sans étude nommée : traiter comme [V]. Un chiffre KPMG de 2024 (33 % confiants) existe mais n'est pas de 2026.
- **Rapports BaFin, DNB, Banque de France sur les incidents DORA 2026** : aucun chiffre 2026 trouvé (un titre BaFin « 600+ incidents graves » est non vérifié).
- **Première sanction DORA** : aucune confirmée par une source primaire (la FMA 42 000 € reste [V]).
- **Nombre de L1 Avalanche** : introuvable. Nombre de validateurs, institutionnels chiffrés : seulement l'exemple Progmat, Payments Collective (28 membres).
- **Liste CTPP primaire** : lue via cabinets d'avocats, pas via le PDF ESAs. Aucune mise à jour 2026 de la liste trouvée.
- **Registre ESMA ouvert directement** : non ; les 362 sont un agrégateur qui lit les CSV ESMA.
- **Pauses automatiques réussies en 2026 autres que Parallel**, avec date 2026 : non trouvées ; les autres cas Hypernative ne sont pas datés. Aucune pause automatique indépendante (non vendeur) confirmée.
- **Hexagate, Hypernative : taux de faux positifs mesurés** : aucun chiffre indépendant.
- **Hacks d'octobre 2026 majeurs** : à ce jour (1-9 oct.), le plus gros est 79th Vault (12,5 M$) ; les montants NEAR Intents sont préliminaires ; la fraîcheur de la page SlowMist est inconnue.
- **Corrections à la v2** : (a) l'AMF « deux incidents majeurs chez des CASP » n'est pas confirmé par l'article lu (il dit seulement que la part CASP devrait augmenter) ; (b) le résultat « Vee Finance 35 M$ Avalanche » vu dans une recherche est un incident ancien (non 2026), ne pas le citer ; (c) Bitget : le gel Circle/Tether (≈ 318 k$) arrive environ 1 jour après le vol, pas en minutes.

## 4. Mapping réglementaire (rappel pour cette piste)

- NIST CSF 2.0 : DE.CM, DE.AE (détection on-chain) ; RS.MA, RS.AN, RS.CO, RS.MI (réponse, déclaration) ; GV.SC (tiers).
- ATT&CK : T1657 (vol financier), T1078, T1195, T1199, T1190 ; D3FEND : IDs à vérifier ; ATLAS/ASI seulement si agent IA.

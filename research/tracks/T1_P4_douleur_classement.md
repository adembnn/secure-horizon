# T1 piste 4 : quel est LE problème le plus concret, le plus coûteux et le moins bien résolu ?

> Recherche du 2026-10-10. S'appuie sur `T1_P4_chiffres_2026.md`, `T1_P4_etat_de_l_art.md`, `T1_P4_defi_dora_v2.md`. Le règlement (`context/notion_guide.md`) prime.
> Légende : **[P]** source primaire (régulateur, éditeur du fait) ; **[S]** presse/blog qui relaie ; **[V]** affirmation vendeur ; **[calcul]** calcul de ma part à partir de chiffres sourcés ; **[ÀV]** à vérifier. « lu » = ouvert par moi aujourd'hui.
> Les cabinets (CertiK, TRM, SlowMist, Blockaid) comptent différemment : toujours citer l'éditeur du chiffre. Aucun chiffre de ce fichier n'est une donnée de perte « officielle ».

## TL;DR (5 lignes)

1. **Gagnant : le détournement du circuit qui approuve les sorties de fonds** (candidats 1+2 fusionnés). Bitget 387,5 M$ (backend compromis, données de transaction falsifiées pour déclencher l'autorisation), Drift 285 M$ (clé admin par ingénierie sociale), KelpDAO 292 M$ (vérificateur unique) : **~965 M$, soit ~36-37 % des pertes 2026** [calcul], et TRM attribue **~76 % des pertes H1 2026 à l'infrastructure, aux clés et à la signature** pour seulement ~15 % des incidents.
2. **Trou précis** : personne ne pose de **limite de sortie indépendante du circuit d'approbation compromis**. Les détecteurs (Hypernative, Hexagate) voient *après* le début des sorties et ont besoin d'un droit de pause que ni un hot wallet de CASP ni un multisig n'accordent ; les politiques de signature font confiance aux données du backend ; le gel émetteur arrive 10 à 17 h plus tard (0,08 % récupéré chez Bitget).
3. **Démontrable sur Fuji** : trésorerie = contrat avec plafond de sortie par fenêtre et rôle de pause limité, moniteur hors-bande qui décode ce qui part réellement, attaque rejouée sur nos propres contrats.
4. **N°2 : dépendances tierces cachées** (ESAs ~1/3 des incidents d'origine tierce, AMF > 80 % en France ; ponts à vérificateur unique ≈ 333 M$ nommés) ; **N°3 : la déclaration DORA** (douleur certaine pour 362 CASP, mais **aucun coût ni sanction chiffré** : faible en euros).
5. **À ne pas vendre comme douleur principale** : exploit de contrat en une transaction (saturé : Hypernative, Hexagate, ≥ 6 projets Chainlink) et gel des fonds (dépend de Circle/Tether, hors de notre contrôle).

---

## 1. Dénominateurs utilisés

| Chiffre | Valeur | Source | Q |
|---|---|---|---|
| T3 2026 CertiK | 1,26 Md$, 247 incidents | https://cointelegraph.com/news/bitget-hack-q3-industry-losses-1-26-billion | S (lu dans la v. précédente) |
| H1 2026 CertiK | 1,316 Md$, 344 incidents | https://forklog.com/en/certik-says-crypto-hack-losses-hit-1-32b-in-h1-2026/ | S |
| Cumul 2026 CertiK | ~2,68 Md$ | https://www.coininsider.org/news/crypto-lost-1-26-billion-to-hacks-in-q3-even-as-bitcoin-posted-its-best-quarter-since-2024/ | S. **Incohérence** : H1 1,316 + T3 1,26 = 2,58 Md$ [calcul], et le T2 vaut 807,5 M$ (Forklog) ou 819,4 M$ (Cointelegraph). J'utilise « ~2,6-2,7 Md$ » |
| DeFi jan.-août 2026 | ≥ 1,3 Md$ (période ambiguë dans l'article) | https://crypto.news/defi-hacks-2026-billion-lost-same-attack-keeps-working/ | S (lu aujourd'hui) |
| Vecteurs H1 2026 | infra/clés/signature ≈ 76 % des pertes, ~15 % des incidents (TRM) ; clés privées 688 M$ sur ~956 M$ (SlowMist) ; 74 % OpSec (Blockaid, post LinkedIn) | https://www.crowdfundinsider.com/2026/07/288999-crypto-hacks-surged-to-record-highs-in-h1-2026-yet-total-losses-fall-sharply-below-1-billion/ ; https://coinedition.com/slowmist-says-there-were-182-blockchain-security-issues-in-h1-2026/ | S (Blockaid : V) |
| Contrôle de cohérence | Drift + KelpDAO = 577 M$ sur 807,5 M$ de T2 = 71,5 % [calcul] ; CertiK dit « > 70 % » | Forklog | cohérent |

Vérification : Bitget 387,5 / 1 260 = 30,8 % du T3 [calcul] ; Drift 285 / 1 316 = 21,7 % et Kelp 292 / 1 316 = 22,2 % du H1 [calcul].

---

## 2. Les candidats, un par un

### C1 + C2 (fusionnés) : sortie de fonds via un circuit d'approbation compromis ou aveugle

**Pourquoi les fusionner.** En 2026, le mécanisme est le même : on ne casse pas le code, on fait approuver (ou on approuve à la place de) un humain, un backend ou un signataire. Seule la forme change (backend de CASP, signataires de multisig, clé admin).

| Cas 2026 | Perte | Mécanisme | Source | Q |
|---|---|---|---|---|
| **Bitget** (24-25 sept.) | 387,5 M$ (hot et warm wallets, 7 chaînes dont **Avalanche**) | Zero-day sur deux appliances de sécurité tierces, web shell, mouvement latéral jusqu'au serveur de jobs du wallet. Le CEO : les attaquants ont compromis un backend et **falsifié des données de transaction, ce qui a déclenché le processus d'autorisation**. Sorties de 02:31 à 05:23 (UTC+8), ~3 h | https://www.bleepingcomputer.com/news/security/bitget-hacked-via-zero-day-in-third-party-security-products/amp/ (lu) | S (BleepingComputer cite Mandiant, SlowMist et le CEO). Le fournisseur des appliances n'est pas nommé |
| **Drift** (1er avr.) | 285 M$ | 6 mois d'ingénierie sociale, clé admin obtenue, 31 retraits en 12 min (crypto.news dit 128 s : écart), USDC bridgé via CCTP ~6 h sans gel | https://crypto.news/defi-hacks-2026-billion-lost-same-attack-keeps-working/ (lu) ; détails « durable nonces » : v2 | S ; « durable nonces / signature à l'aveugle » = **[ÀV]**, non relu |
| **KelpDAO** (18-19 avr.) | 292 M$ (290 M$ selon crypto.news) | Vérificateur cross-chain unique compromis | idem | S. À compter dans C6 aussi (double compte à éviter) |
| **Resolv** (mars) | ~25 M$ | EOA de mint via KMS, 80 M USR mintés | v2 §1.1 | S/ÀV |
| **Bybit** (fév. **2025**) | 1,5 Md$ | Interface Safe compromise : les signataires voyaient autre chose que ce qu'ils signaient | v2 | **Hors 2026** : à citer comme précédent, pas comme perte 2026 |
| Coldcard (30 juil.) | 112,7 M$ (CertiK) / ~130 M$ (Galaxy via crypto.news) | Entropie de seed faible | idem | S, écart de montant ; produit grand public, hors cible |

- **Montant 2026 attribuable** : Bitget + Drift = **672,5 M$** (~26 % de 2,6 Md$) ; avec KelpDAO **964,5 M$ (~36-37 %)** [calcul]. Avec Resolv ~990 M$. Le chiffre le plus robuste est celui de TRM : **~76 % des pertes H1 en infra/clés/signature**.
- **Fréquence** : peu d'événements, très gros (4 à 5 cas ≥ 25 M$ identifiés en 9 mois). Je n'ai pas de décompte indépendant des hacks de CASP agréés MiCA. **Aucun hack de CASP MiCA déclaré comme incident DORA n'est public** (les déclarations sont confidentielles).
- **Qui souffre exactement** : (a) le CASP/exchange dont la trésorerie est vidée et qui paie sur fonds propres : Bitget a puisé dans son fonds de protection (> 464 M$ avant, ~309 M$ reconstitué au 30 sept.) https://247wallst.com/investing/cryptocurrency/2026/10/03/bitget-rebuilt-a-309-million-protection-fund-after-a-388-million-hack-is-your-crypto-safe-on-an-exchange/ [S, non relu] ; (b) les déposants si le fonds ne suffit pas ; (c) les DAO/protocoles dont la trésorerie est sous multisig. **Assurance : ~130 M$ suivis pour 95,7 Md$ de TVL DeFi = ~0,14 %** [calcul] https://www.upshift.finance/blog/defi-insurance [S] ; Nexus exclut clés privées et front-end https://nexusmutual.io/defi-insurance [P].
- **Ce qui existe** :
  - Hypernative, Hexagate (gratuit pour builders Avalanche : https://www.chainalysis.com/blog/hexagate-by-chainalysis-now-live-on-avalanche/ [S]), Forta : détection + pause. Cas Parallel (mai 2026, 1,52 M$ sauvés) https://www.hypernative.io/blog/how-an-automated-pause-prevented-a-1-52m-exploit-on-parallel [V, lu par collègues]. **Condition : un contrat avec fonction de pause et un rôle donné au détecteur**.
  - Safe Guards/modules, Fireblocks (politiques MPC) : contrôle de politique côté **backend de confiance** ; si le backend ment, l'approbation passe (cas Bitget, selon le CEO) [S]. Je n'ai pas confirmé que Bitget utilisait un produit précis : ne pas nommer.
  - Blockaid, Rabby, Pocket Universe, Wallet Guard : simulation **côté utilisateur/wallet**, pas côté signataire institutionnel ni backend [V-interne].
  - Tenderly : alertes/simulation, pas de contrôle de fonds.
- **Le trou** : une **limite de sortie et un contrôle d'effet réel, indépendants du circuit d'approbation** (plafond par fenêtre, liste de destinations, retrait des fonds vers un sas), avec un rôle de pause **limité**, pré-autorisé par la direction, sans dépendre d'un humain réveillé la nuit. Le moniteur doit comparer *ce que l'approbateur croit signer* et *ce qui part vraiment sur la chaîne* (lecture on-chain des calldata décodés).
- **Démontrable sur Fuji : oui, avec une honnêteté à afficher.** Un contrat `TreasuryVault` (rôle d'approbateur compromissible, plafond/fenêtre, guardian pause-only, EOA ou multisig) et un « backend » simulé qui ment. Limite : le hot wallet d'un vrai CASP est en général MPC/EOA ; le plafond est appliqué on-chain seulement si les fonds sont dans un contrat/compte intelligent. À dire : « la contre-mesure est un contrat sas (modèle ERC-7265, CC0) ; pour un wallet MPC, le moniteur alerte et déclenche le déplacement vers le sas ».
- **Mapping**
  - NIST CSF 2.0 : DE.CM-01 (surveillance des réseaux/actifs), DE.AE-02 (analyse des événements), RS.MA-01, RS.MI-01 (confinement), PR.AA (contrôle d'accès) ; IDs à contrôler sur le référentiel officiel.
  - ATT&CK : T1657 (Financial Theft), T1078 (Valid Accounts), T1098 (Account Manipulation), T1565.002 (Transmitted Data Manipulation), T1199/T1195 (accès via tiers).
  - D3FEND [ÀV] : D3-OTF (Outbound Traffic Filtering), D3-UBA (User Behavior Analysis), D3-ET/D3-AA selon version.
  - OWASP Agentic / ATLAS : non applicable (aucun agent IA ciblé). Le guide demande **au moins un** des quatre référentiels : ATT&CK suffit.

### C3 : exploit de smart contract d'un protocole (logique, oracle, une transaction)

- **Pertes 2026** : Tectonic (Cronos, 30 août) ~74-75 M$ sortis (120 M$ notionnels) en **une seule transaction** https://www.trmlabs.com/resources/blog/number-of-price-manipulation-attacks-hits-all-time-high-as-usd-75-million-is-stolen-from-tectonic [S] ; Liquid Network 319 M$ (6 sept., bug de validation dans Elements, 85 % rendus en ~1 jour) https://www.trmlabs.com/resources/blog/2026s-biggest-hack-to-date-attackers-drained-usd-319-million-in-bitcoin-from-liquid-network-then-returned-85-of-funds [S] ; Cosmos EVM 20,8 M$ ; Moonwell ~9 M$. Total nommé ≈ 425 M$ (~16 % de 2,6 Md$) [calcul] ; mais Liquid a été en grande partie rendu (donc net bien moindre).
- **Fréquence** : c'est la majorité des **incidents** : 125 exploits de contrats ≈ 60 % des 207 incidents H1 (TRM) [S], mais une part minoritaire des **pertes** (le complément du ~76 % infra/clés = environ 24 %) [calcul].
- **Qui souffre** : protocoles DeFi et leurs déposants (TVL Aave -6,28 Md$ en 48 h après KelpDAO : effet de contagion, source crypto.news [S]).
- **Existe, et c'est mûr** : Hypernative, Hexagate, Forta, Phalcon (BlockSec), OZ Monitor, Tenderly, CUBE3, CertiK Skynet ; patron « détecteur + pause » **saturé en hackathon** (≥ 6 projets Chainlink Convergence, avril 2026). Papiers : BlockWatchdog, Skyeye.
- **Le trou** : faible. Une attaque en **une transaction** (Tectonic) ne laisse aucune place à la réaction : seul un invariant dans le contrat agit. Sur le C-Chain Avalanche on ne contrôle pas le builder.
- **Démontrable sur Fuji** : oui, facilement (c'est précisément pour ça qu'il n'est pas différenciant).
- **Mapping** : NIST DE.CM-01, DE.AE-02, PR.PS ; ATT&CK T1190, T1587.004 ; D3FEND D3-DO (Decoy Object) [ÀV] ; OWASP/ATLAS n/a.

### C4 : la déclaration d'incident DORA elle-même

- **Chiffres (période 2025, publiés en 2026)** : 3 383 incidents majeurs dans l'UE, 0,18 par entité, ~1/3 d'origine tierce, ~2/3 sans impact ou mineur (ESAs, 3 juin 2026) https://www.regulationtomorrow.com/2026/06/esas-issue-first-report-on-dora-major-ict-related-incidents/ [S ; rapport ESAs primaire non relu]. France : 33 incidents majeurs, > 80 % via prestataires (AMF, 29 sept. 2026) https://www.lemondedudroit.fr/banque-finance/304-finance/105970-amf-rapport-sur-les-incidents-majeurs-en-2025-au-titre-du-reglement-dora.html [S]. ACPR : délais « rarement respectés », erreurs de complétude et de classification (44 déclarations initiales, 32 majeurs) https://www.forvismazars.com/fr/fr/insights/publications-et-evenements/avis-d-experts/dora-retour-d-experience-et-enseignements [S, repris de la v2].
- **CASP concernés** : ~362 agréés au 7 oct. 2026 (agrégateur sur CSV ESMA) https://www.outrun.at/micar-dashboard [S]. L'AMF attend une hausse des incidents CASP en 2026 [S].
- **Coût** : **aucun chiffre public de coût par déclaration trouvé**. **Sanctions** : aucune confirmée par source primaire ; une amende FMA de 42 000 € (14 juil. 2026) vient d'un guide éditeur https://www.legiscope.com/blog/dora-penalties-enforcement.html [V, source unique : ne pas citer].
- **Qui souffre** : le responsable conformité/RSSI du CASP, dans les 4 h après classification (24 h après prise de connaissance au plus tard), avec des champs que les superviseurs voient mal remplis.
- **Existe** : ServiceNow DRIR (classification, rapport initial « no later than 24 hours », aucune entrée on-chain) https://www.servicenow.com/docs/r/Z61H6JNUJXKe8NNPQzK7MQ/0aNomnluaUVHloO2rB49Dg [P] ; D3 Morpheus (~40 min alerte → rapport, chiffre vendeur) [V] ; ArkForge MCP (MIT) ; Archer, Formalize. Hypernative argumente sur DORA (billet du 9 juin 2026) sans classification ni gabarit [P lu par collègues].
- **Le trou** : lien entre un événement on-chain horodaté et chaque champ de l'ITS 2025/302, avec règles de qualité (instructions ESAs du 16/09/2026). Confiance de l'absence ≈ 80 % (cf. état de l'art §4).
- **Faiblesse pour le jury** : la douleur est réelle mais **non monétisée** dans nos sources. Un jury KPMG répondra « oui, c'est connu » ; un jury Avalanche ou Kryptosphère demandera « combien ça coûte ? », et nous n'avons pas de réponse chiffrée honnête.
- **Démontrable sur Fuji** : oui (brouillon + preuve par champ + ancrage).
- **Mapping** : NIST RS.MA-02/03, RS.AN-03, RS.CO-02/03, GV.OC-03 ; ATT&CK : lien via champ 3.25 (techniques de l'incident) ; ASI09 seulement si un LLM rédige ; D3FEND n/a.

### C5 : gel des fonds volés trop lent

- **Chiffres** : Bitget : Circle blacklist ~05:00 UTC le 25 sept., Tether ~7 h plus tard ; 99 990 USDC + 218 023 USDT ≈ 318 k$ sur ~387 M$ = **~0,08 %** https://decrypt.co/379365/circle-tether-freeze-stablecoins-bitget-hack (lu aujourd'hui) [S]. BlockSec : ~840 k$ = 0,2 % [S]. Les sorties ayant débuté à 02:31 UTC+8 (= 18:31 UTC le 24), Circle a agi ~10,5 h plus tard et Tether ~17,5 h plus tard [calcul à partir de deux sources]. Decrypt : l'attaquant a converti les stablecoins freezables en ETH « en quelques minutes » ; plus de 63 000 ETH restent chez des adresses que les émetteurs ne peuvent pas geler. BlockSec : 75,48 M$ convertis en ETH/AVAX en 41 min [S].
- **Contre-exemple** : septembre 2026 = 273 M$ « gelés ou rendus » sur ~769 M$ (35 %), mais ~272 M$ viennent du retour volontaire de Liquid : le gel pur est marginal [calcul à partir de CertiK et TRM]. T3 FCU (Tether/TRON/TRM) : > 450 M$ gelés cumulés, toutes fraudes confondues (mai 2026) [S]. Drift : ~232 M$ bridgés via CCTP, pas de gel Circle, allégation ZachXBT de ~420 M$ d'USDC illicite non gelé sur 15 cas https://whale-alert.io/stories/99a1011ccc8a47/ [S, allégation].
- **Qui souffre** : la victime ; mais le **plafond de gain est faible** : tant que l'attaquant convertit en ETH/AVAX en minutes, un gel plus rapide ne récupère qu'une fraction.
- **Existe** : TRM, Chainalysis, Elliptic, MistTrack (traçage) ; T3 FCU ; SEAL 911 et Safe Harbor (cadre juridique) https://frameworks.securityalliance.org/safe-harbor/overview [P].
- **Le trou** : un **dossier de gel prêt en secondes** ; mais la décision reste chez Circle/Tether (juridique), que nous ne contrôlons pas, et le plafond récupérable est bas. Mauvais n°1.
- **Démontrable sur Fuji** : partiellement (génération du dossier ; le gel lui-même est simulé).
- **Mapping** : NIST RS.CO-02/03, RS.AN-07 ; ATT&CK T1657 ; D3FEND n/a.

### C6 : dépendances tierces cachées (oracle, pont, RPC, appliances) hors du registre DORA

- **Chiffres** : ESAs ~1/3 d'incidents d'origine tierce (v2 : 29 % ; définition large) ; AMF > 80 % pour la France (définition différente : **ne pas mélanger sur une même slide**). Ponts/vérificateurs : KelpDAO 292 M$ + AFX Trade 24,15 M$ + VerusCoin 19,14 M$ ≈ **333 M$ nommés (~26 % de 1,3 Md$)** [calcul sur crypto.news, lu]. LayerZero : 47 % des OApps (> 1 200) en vérificateur unique https://crypto.news/defi-hacks-2026-billion-lost-same-attack-keeps-working/ [S]. Bitget : appliances tierces (non nommées). Cumul « infrastructure tierce » > 630 M$ en 7 mois (v2, [agrégateur] : non vérifié).
- **Qui souffre** : le CASP qui doit tenir un registre d'informations (ITS 2024/2956) et déclarer un champ 2.8 « tiers à l'origine » ; le protocole qui a un DVN 1-sur-1 sans le savoir.
- **Existe** : Archer, Formalize, ServiceNow (saisie manuelle de contrats, aucune lecture de l'état technique) ; CTPP désignés (19, AWS, Google Cloud, Microsoft…) : **aucun prestataire blockchain** dans la liste lue [S] https://www.morganlewis.com/blogs/sourcingatmorganlewis/2025/11/dora-eu-regulators-announce-list-of-critical-ict-third-party-providers.
- **Le trou** : lecture automatique de la configuration on-chain (rôles, nombre de vérificateurs, oracle, seuil du multisig) vers une ligne de registre + alerte « point unique de défaillance ». Sur Fuji, c'est très démontrable (avant/après correction de config).
- **Faiblesse** : c'est de l'**Identify/Govern** (le guide veut Detect/Respond) ; elle ne stoppe pas une attaque en cours ; et la corrélation avec les pertes est indirecte (Kelp dépend de la qualité de la configuration, pas du registre DORA).
- **Mapping** : NIST GV.SC-04/07, ID.AM-02, DE.CM-06 ; ATT&CK T1195, T1199 ; D3FEND D3-AI (Asset Inventory) [ÀV] ; ASI04 seulement si chaîne d'approvisionnement d'agents.

### C7 : autres problèmes trouvés dans le périmètre (non retenus comme n°1)

| Problème | Chiffres | Verdict |
|---|---|---|
| **Address poisoning / drainers (utilisateurs)** | Scam Sniffer 2025 : 83,85 M$, 106 106 victimes (-83 % vs 2024) ; poisoning 12,25 M$ en janv. 2026 https://decrypt.co/357450/signature-phishing-up-200-as-january-losses-pass-6m [S] | Réel, mais utilisateurs particuliers, hors DORA/sous-track ; déjà servi (Rabby, Blockaid, Wallet Guard) |
| **Attaques à la clé USB/violence (« wrench »)** | > 30 M$ extraits, 46 incidents, 26 % de succès, France épicentre (Chainalysis H1 2026) https://www.chainalysis.com/blog/violent-crypto-wrench-attacks-2026/ [S] | Hors périmètre technique de la sous-track |
| **Faux positif de la pause = incident DORA** | Pause > 2 h = critère « indisponibilité » (RTS 2024/1772) | Argument de conception, pas un problème de marché chiffré |
| **Agents IA avec wallet** | Grok/Bankr ~150-200 k$ (mai 2026) [agrégateur] | Petit en montant, chevauche la piste 3 (Antibody) |

---

## 3. Tableau comparatif

| # | Candidat | Pertes 2026 attribuables | Part (≈) | Fréquence | Maturité des produits | Trou | Démo Fuji | Fit DORA / jury |
|---|---|---|---|---|---|---|---|---|
| 1+2 | Circuit d'approbation compromis / signature aveugle | **~672 M$ (Bitget + Drift) à ~965 M$ avec Kelp** | **26-37 %** (TRM : ~76 % H1 pour infra/clés/signature) | rare, énorme | Moyenne : détection OK, **limite de sortie indépendante absente** | **Grand** | Oui | Fort (tiers, TIC, CASP) |
| 6 | Dépendances tierces non cartographiées | ~333 M$ ponts nommés (Kelp compté aussi en 1) | ~26 % de 1,3 Md$ DeFi | rare | Faible (saisie manuelle) | Moyen-grand | Oui, très | **Très fort** (registre, champ 2.8), mais Identify/Govern |
| 4 | Déclaration DORA | non chiffrée | n/a | 3 383 majeurs UE (2025) | Moyenne (ServiceNow, D3) | Moyen (lien on-chain) | Oui | **Très fort** KPMG, non monétisé |
| 3 | Exploit de contrat | ~425 M$ (Liquid majoritairement rendu) | ~16 % | **majorité des incidents (~60 %)** | **Haute** | Faible | Oui | Moyen, banal |
| 5 | Gel trop lent | 0,08 % récupéré chez Bitget | n/a | à chaque gros hack | Haute (traçage), faible (coordination) | Réel mais hors de notre contrôle | Partiel | Moyen |

---

## 4. Classement argumenté

**N°1 : détournement du circuit d'approbation des sorties de fonds (C1+C2), avec limite de sortie indépendante et lecture de l'effet réel.**
- Plus coûteux : ~965 M$ (~36-37 %) pour 3 incidents, et TRM relie ~76 % des pertes H1 à ce vecteur.
- Pas marginal : il couvre CEX/CASP (Bitget), DAO/multisig (Drift), ponts (Kelp) ; la mécanique est la même.
- Le moins bien servi : les produits du marché détectent ou simulent côté utilisateur ; aucun ne fournit un **plafond de sortie indépendant du circuit compromis**, déclenché sans humain, avec une trace exploitable pour DORA.
- Détect/Respond : oui, c'est le cœur (DE.CM, DE.AE, RS.MI).
- Réserve honnête : peu d'événements, très gros ; pas de décompte indépendant de la fréquence chez les CASP agréés MiCA. Et il n'a jamais été prouvé qu'un plafond aurait sauvé Bitget (les sorties ont duré ~3 h, ce qui laisse en revanche une fenêtre à un plafond/une alerte [calcul]).

**N°2 : dépendances tierces cachées (C6).** Meilleur ancrage DORA (GV.SC, champ 2.8, registre), chiffres (ESAs ~1/3, AMF > 80 %), et c'est la **cause racine** de n°1 (appliances Bitget, DVN Kelp). À présenter comme le volet « Identify » qui nourrit n°1, pas comme douleur autonome.

**N°3 : déclaration DORA (C4).** Douleur certaine pour 362 CASP, mais sans coût ni sanction chiffrés. À garder comme **sortie** de la chaîne (brouillon prouvé par champ), pas comme problème d'ouverture.

Écartés : exploit de contrat (marché saturé, une transaction = pas de réaction possible), gel (plafond de récupération bas, décision chez Circle/Tether).

---

## 5. Pour le n°1 : la phrase de douleur (30 s)

« En 2026, les trois plus gros vols (Bitget 387,5 M$, Drift 285 M$, KelpDAO 292 M$, soit environ 36 % des pertes de l'année) n'ont pas cassé du code : ils ont détourné ce qui approuve les sorties de fonds. TRM rattache ~76 % des pertes du premier semestre à l'infrastructure, aux clés et à la signature. Chez Bitget, un backend compromis a falsifié les données de transaction pour déclencher l'autorisation ; ensuite, 0,08 % des fonds ont été gelés, un jour plus tard. »

- **Les 2 chiffres sourcés** : ~76 % des pertes H1 2026 en infra/clés/signature (TRM, https://www.crowdfundinsider.com/2026/07/288999-crypto-hacks-surged-to-record-highs-in-h1-2026-yet-total-losses-fall-sharply-below-1-billion/ [S]) ; 387,5 M$ perdus et ~318 k$ gelés (≈ 0,08 %) chez Bitget (BleepingComputer [S, lu] et Decrypt [S, lu]).
- **Qui paie** : l'exchange/CASP sur ses fonds propres ou son fonds de protection (Bitget : > 464 M$ → ~309 M$ [S]), sinon les déposants ; les DAO n'ont quasiment pas d'assurance (~0,14 % du TVL DeFi suivi [calcul]) ; Nexus exclut les clés privées [P].
- **Pourquoi les produits actuels ne le règlent pas** : (1) les détecteurs réagissent *après* le début des sorties et exigent un droit de pause sur un contrat, que ni un wallet MPC/EOA de CASP ni un multisig compromis ne donnent ; (2) les politiques de signature font confiance aux données du backend ou de l'interface (Bitget, Bybit 2025) ; (3) le gel émetteur ne peut agir que sur des stablecoins, 10 à 17 h plus tard, alors que les fonds sont convertis en minutes.
- **Limite à citer d'emblée** : nous ne prétendons pas que ça aurait sauvé Bitget ; nous mesurons sur un rejeu le temps entre la 1re sortie anormale et le blocage, et la part sauvée.

## 6. Ce qui reste à vérifier (avant slide)

1. Rapport TRM H1 2026 primaire (76 % et 15 %) : chiffres via relais.
2. Cohérence du cumul CertiK (2,68 Md$ vs 2,58 Md$ calculés) ; T2 807,5 vs 819,4 M$.
3. Détails Drift (« durable nonces », signature à l'aveugle) : non relus ce jour.
4. Fonds de protection Bitget (247wallst), non relu.
5. Pourcentages ESAs 29 % vs ~1/3 (selon la source) et AMF > 80 % : définitions différentes.
6. IDs D3FEND, ATT&CK à contrôler sur les sites officiels.
7. Aucune donnée sur la fréquence des vols de hot wallets de CASP agréés MiCA en 2026 : à ne pas extrapoler.
8. Les lectures « lu aujourd'hui » : Decrypt (gel), crypto.news (vecteurs), BleepingComputer (Bitget). Le reste est hérité des trois fichiers de départ.

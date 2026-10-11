# Track 1, piste 4 (v2) : détection et réponse DeFi + DORA, version approfondie

> Recherche du 2026-10-10 pour Secure Horizons (ESSEC). Ce document **complète et corrige** `research/tracks/T1_P4_defi_dora.md` (v1), `research/docs/D1_avalanche.md` et `research/02_track1_finance.md`. Je ne répète pas leur contenu : je renvoie à eux avec la mention **[V-interne]** quand j'en reprends un fait sans l'avoir revérifié.
> Le règlement officiel (`context/notion_guide.md`) prime. Le mail Avalanche est dans `context/avalanche_fuji_mail.md` (le `grep Fuji` de `coord/` ne le trouve pas, il est dans `context/`).
> Légende : **[V]** = lu sur la source citée (page ou extrait de recherche) · **[Vendeur]** = affirmation commerciale · **[Agrégateur]** = source secondaire non recoupée · **[ÀV]** = à vérifier avant slide · **[Interp.]** = notre interprétation, à faire valider (KPMG) · **[Connaissance]** = ce que je sais du domaine sans l'avoir relu aujourd'hui, donc à traiter comme [ÀV].
> Contrainte hackathon : le code ne s'écrit qu'entre samedi 11h30 et dimanche 12h00. Tout ce qui suit est de la préparation.

---

## 0. TL;DR (5 lignes)

1. **Le marché de la détection on-chain est saturé** (Hypernative, Hexagate, Phalcon, Cyvers, Forta, Venn, CUBE3). Fait nouveau à intégrer dans le pitch : **Chainalysis offre une version « sur mesure » de Hexagate gratuitement aux projets de 4 chaînes, dont Avalanche (déc. 2025)** [V]. La phrase « Avalanche n'a pas de monitoring » (02_track1 §3.3) est donc **fausse ou à nuancer** : il faut se positionner **en complément** (couche réglementaire et preuve), pas en remplaçant.
2. **Le trou réel, c'est la couche après l'alerte** : qualifier l'incident en critères DORA, tenir les délais, prouver chaque champ, et connaître ses dépendances tierces. Chiffres frais : 3 383 incidents majeurs DORA déclarés dans l'UE en 2025, **29 % venant de tiers** (ESAs, 3 juin 2026) ; en France, **plus de 80 % des 33 incidents majeurs viennent de prestataires** et l'ACPR constate que **les délais sont « rarement respectés »** [V].
3. **Les pertes 2026 viennent surtout des opérations et des tiers, pas du code** : Q3 2026 = 1,26 Md$ sur 247 incidents (CertiK), Bitget (zero-day sur appliances tierces) et Liquid (invariant de réserve) en tête ; Tectonic/Cronos (manipulation de prix, 75 à 120 M$) a même été traité par **un arrêt et un rollback de la chaîne** [V].
4. **Trois mécanismes que les produits existants n'ont pas** : (a) un **leurre on-chain** à zéro faux positif (HoneyVault, aucune implémentation défensive vivante trouvée) ; (b) une **classification DORA où chaque champ pointe vers une preuve horodatée** et où la **pause elle-même fait évoluer la classification** (indisponibilité > 2 h) ; (c) un **registre de tiers vivant** alimenté par l'état on-chain (rôles, oracles, config DVN, RPC).
5. **Recommandation inchangée dans l'esprit mais affinée** : « Hold up » = HoneyVault + invariants + échelle de réponse graduée + DORA Autopilot + **scorecard de rejeu de hacks réels** (nouveau, donne les métriques que le jury note à 30 %). Note estimée **87/100** pour le combo, 83 pour HoneyVault seul. Réponse à « qui est responsable » : voir §6.

---

## 1. La douleur réelle aujourd'hui

### 1.1 Pertes 2025-2026 par vecteur

Les chiffres des vendeurs (CertiK, TRM, Blockaid, Chainalysis, PeckShield) ne se recoupent pas : ordre de grandeur uniquement.

| Vecteur | Cas et montants 2025-2026 | Source / statut |
|---|---|---|
| **Clés, OpSec, accès privilégiés** (premier vecteur) | Bybit 1,5 Md$ (fév. 2025, front-end Safe compromis) ; Resolv ~25 M$ (mars 2026, EOA de mint via KMS, 80 M USR mintés) ; Drift 285 M$ (avril 2026) ; H1 2026 : « 74 % des fonds volés = OpSec », clés privilégiées 790 M$ (Blockaid) ; CertiK H1 : wallet compromise 445 M$ (33 incidents) | [V-interne] 02_track1 §1 ; CertiK H1 2026 1,32 Md$, -46,8 % sur un an : https://forklog.com/en/certik-says-crypto-hack-losses-hit-1-32b-in-h1-2026/ |
| **Infrastructure tierce / appliances** | **Bitget 24/09/2026 : ~387,5 M$**. Zero-day sur deux appliances de sécurité tierces, web shell, mouvement latéral jusqu'au serveur de jobs du wallet, pas de clé volée (Mandiant). Chaînes touchées dont Avalanche (AVAX volé) | https://www.bleepingcomputer.com/news/security/bitget-hacked-via-zero-day-in-third-party-security-products/amp/ [V] |
| **Bridges / vérificateurs cross-chain** | KelpDAO 292 M$ (avril 2026, DVN 1-of-1, RPC empoisonnés). Bridges 372 M$ en H1 (Blockaid) | [V-interne] |
| **Gouvernance / multisig** | Drift 285 M$ : 6 mois d'ingénierie sociale, durable nonces, 31 retraits en 12 min, USDC bridgé via CCTP pendant ~6 h sans gel Circle | [V-interne] ; débat Circle : https://thedefiant.io/should-circle-have-frozen-the-drift-exploit-funds |
| **Oracles / manipulation de prix** | **Tectonic (Cronos), 30/08/2026** : TONIC gonflé ~195× par 98 boucles d'emprunt dans **une seule transaction**, emprunts de 120,4 M$ notionnels (≈ 74-75 M$ réellement sortis selon TRM/BleepingComputer), 9,19 M$ échappés avant l'arrêt de la chaîne ; Ostium 18-24 M$ (clé de signataire d'oracle) ; Bonzo 9 M$ | https://www.trmlabs.com/resources/blog/number-of-price-manipulation-attacks-hits-all-time-high-as-usd-75-million-is-stolen-from-tectonic ; https://regional-front.cointelegraph.com/news/cronos-tectonic-rollback-111m-9m-escaped [V] ; Ostium/Bonzo [V-interne] |
| **Bug de logique / invariant de réserve** | Liquid Network 319 M$ (6 sept. 2026, 3 998 L-BTC non adossés), Coldcard 112,7 M$ (T3 2026, nature non vérifiée par moi) | https://cointelegraph.com/news/bitget-hack-q3-industry-losses-1-26-billion [V pour les montants] |
| **Front-end / DNS** | CoW Swap 0,5 à 1,2 M$ (DNS, avril 2026) ; Bybit (JS injecté dans l'app Safe) | [V-interne] |
| **Address poisoning** | 50 M$ (déc. 2025, un seul trader) ; ~12,25 M$ (4 556 ETH, janv. 2026) ; effet Fusaka (gas bas) | https://decrypt.co/357450/signature-phishing-up-200-as-january-losses-pass-6m [V] |
| **Drainers / signature phishing** | Scam Sniffer : 83,85 M$ et 106 106 victimes en 2025 (EVM), -83 % en valeur vs 2024 ; janvier 2026 : 6,27 M$, 4 700 wallets ; pic dû à des `permit` signés | idem [V] |
| **Agents IA avec wallet** | Grok/Bankr 4 mai 2026 : ~150 à 200 k$ (3 Md de DRB), prompt injection encodée ; Bankr 20 mai : 14 wallets, > 440 k$ [Agrégateur] ; « 40 M$ en janvier 2026 par memory poisoning sur agents Solana » : **non vérifié, ne pas citer** | https://oecd.ai/en/incidents/2026-05-04-4a73 [V pour Grok] ; https://www.spark.money/research/ai-wallet-security-attack-surface [Agrégateur] |

**Totaux** : T3 2026 = **1,26 Md$ sur 247 incidents** (CertiK, via Cointelegraph), contre 819,4 M$ sur 219 au T2 ; septembre seul = ~769 M$ sur 99 incidents, dont **273 M$ gelés ou rendus**, soit 495 M$ nets [V]. Le détail par vecteur du trimestre n'est pas publié dans la source lue.

**Correction par rapport à 02_track1** : la ligne Bitget parle de « 228 M$ en 18 minutes ». **Je n'ai pas retrouvé cette fenêtre de 18 min.** Ce que disent les sources : ~183 M$ en environ une heure et sorties qui s'arrêtent ~6 minutes après le premier trade suspect (Decrypt) ; chronologie SlowMist de près de 3 heures (tests à 02:31, dernier transfert 05:23 UTC+8) ; 75,48 M$ convertis en ETH/AVAX en 41 minutes (Coinotag) [V, sources divergentes]. Sur une slide, citer « de l'ordre de l'heure », pas « 18 minutes ».
- https://decrypt.co/379275/bitget-hack-183-million-crypto-exchange-wallets · https://en.coinotag.com/bitget-attacker-avax-eth-75m-41-minutes

### 1.2 Temps de réaction observé contre temps nécessaire

| Cas | Temps observé | Ce qui aurait suffi | Source |
|---|---|---|---|
| **Parallel (7 mai 2026)** | Contrat d'attaque déployé le 7 mai ; **pause en secondes / « une poignée de blocs »**, rôle de pause donné **directement** à une adresse Hypernative (pas de multisig) ; seuils séparés alerte / pause ; 1,52 M$ en jeu, 0 perdu. Watchlists : Ethereum, Base, HyperEVM, **Avalanche**, Monad | https://www.hypernative.io/blog/how-an-automated-pause-prevented-a-1-52m-exploit-on-parallel [V] |
| **Tectonic** | Tout dans **une transaction** : aucune réaction humaine possible. La seule parade était **avant** (invariant sur le prix/collatéral) ou **chaîne entière** (arrêt des validateurs) | TRM, Cointelegraph [V] |
| **Drift** | 31 retraits en 12 min, pont de 6 h | Gel de l'émetteur dans les 6 h | [V-interne] |
| **Bitget** | Sorties étalées sur 1 à 3 h | Limite de vélocité côté backend indépendante, pas d'approbation par le circuit compromis | sources §1.1 |
| **Skyeye / BlockWatchdog** | Contrat adverse déployé **~30 min avant** l'attaque, identifiable en 64 s | Détection au déploiement | [V-interne] (recherche académique) |
| **Copycats** | > 69 % des attaques ressemblent à un incident antérieur, en heures ou jours (GenDetect) | Rejeu défensif sur ses propres contrats | [V-interne] |

**Lecture** : il y a **trois régimes**. (1) *Attaque en une transaction* (Tectonic, Liquid) : seul un invariant ou un leurre agit, la réponse humaine ne sert à rien. (2) *Attaque étalée sur des minutes à des heures* (Drift, Bitget, KelpDAO) : la réponse automatique graduée + le gel émetteur sont décisifs. (3) *Attaque préparée* (contrat déployé avant) : la détection au déploiement gagne des minutes. Notre PoC doit montrer **un cas de chaque régime**. [Interp.]

### 1.3 CASP MiCA soumis à DORA : combien, depuis quand, premiers retours

- **Depuis quand** : DORA s'applique depuis le 17/01/2025 ; les CASP y sont soumis **dès leur agrément MiCA** (Q&A ESMA, [V-interne]). Fin de la période transitoire MiCA : **1er juillet 2026** (France) [V-interne].
- **Combien de CASP agréés** (instantanés non comparables, le registre ESMA est mis à jour par paliers) : ~216 (KPMG, juin 2026, uniquement art. 60 et 63) ; 244 (fin juin) ; 37 nouveaux agréments au 3 juillet 2026, BaFin en tête avec 58 ; « 300+ dans 25 pays » fin juillet ; 321 pour la dernière mise à jour lue, non datée [V pour les sources, ÀV pour le chiffre actuel].
  - https://assets.kpmg.com/content/dam/kpmgsites/cy/pdf/2026/CASPs-Grandfathering-Period-June-2026.pdf.coredownload.inline.pdf · https://cointelegraph.com/news/esma-mica-register-new-casps-stanchart-update · https://eu.aminagroup.com/learn/5-things-to-consider-when-assessing-a-mica-regulated-casp-2026-guide/
  - 02_track1 donnait 31 CASP en France et 283 dans l'UE (AMF, 6 juillet) [V-interne] ; ça tient dans la fourchette.
- **Premiers rapports d'incident**
  - **ESAs, 3 juin 2026** : 3 383 incidents majeurs déclarés dans l'UE en 2025 (0,18 par entité), 1 056 transfrontières, **~29 % venant de tiers** (définition large), 51 % pannes de système, **seulement ~10 % cyber** ; > 60 % chez les établissements de crédit, ~16 % chez les établissements de paiement/monnaie électronique. https://www.mondaq.com/financial-services/1808118/esas-publish-first-annual-report-on-major-ict-related-incidents-under-dora [V]
  - **AMF, ~29 sept. 2026** (rapport sur 2025) : **33 incidents majeurs** pour les entités françaises qu'elle supervise (sociétés de gestion, financement participatif, entreprises de marché, CASP), **> 80 % venant de prestataires**, dont 55 % indisponibilité liée à une cyberattaque et 27 % accidentel. **Deux incidents majeurs chez des CASP et entreprises de marché** en 2025 ; l'AMF **s'attend à une hausse en 2026** car la plupart des agréments MiCA sont tombés en 2026. https://www.lemondedudroit.fr/banque-finance/304-finance/105970-amf-rapport-sur-les-incidents-majeurs-en-2025-au-titre-du-reglement-dora.html [V, article partiellement payant]
  - **ACPR-AMF (premiers retours de supervision)** : 44 déclarations initiales, 32 incidents majeurs confirmés ; 53 % indisponibilité, 31 % exfiltration ; **délais « rarement respectés », erreurs persistantes de complétude des champs et de méthodologie de classification**. https://www.forvismazars.com/fr/fr/insights/publications-et-evenements/avis-d-experts/dora-retour-d-experience-et-enseignements [V]
  - **AMF, 3 juin 2026** : enquête auprès des CASP à partir de juillet 2026 sur les risques liés à l'IA, résultats à l'automne ; recommande une cartographie à jour des systèmes, données et prestataires. https://www.amf-france.org/fr/actualites-publications/actualites/resilience-cyber-lamf-appelle-les-acteurs-financiers-renforcer-leurs-dispositifs-face-levolution [V]
- **Premières sanctions** : **aucune sanction DORA confirmée par une source primaire.** Un guide éditeur cite une amende de **42 000 € de la FMA à Western Union International Bank (14 juillet 2026)** pour manquements répétés à la notification d'incidents. **Source unique, [ÀV], ne pas citer sans l'avoir recoupée sur le site de la FMA.** https://www.legiscope.com/blog/dora-penalties-enforcement.html
- **Aucun hack de CASP agréé MiCA déclaré publiquement comme incident DORA majeur** n'a été trouvé (les déclarations ne sont pas publiques). À dire honnêtement : nous ne pouvons pas citer un cas européen précis, seulement les chiffres agrégés. [V pour l'absence dans mes recherches]
- **Canal de dépôt** : national. Par exemple, aux Pays-Bas, les CASP déposent via le portail AFM (instruction d'avril 2025, PDF non lisible par mon outil, seul le lien du portail ressort) ; en France, voir le canal de l'AMF. Les autorités transmettent ensuite aux ESAs. https://www.afm.nl/~/profmedia/files/doelgroepen/cryptopartijen/2025/instruction-ict-notifications-dora.pdf [V partiel]

### 1.4 Coût et difficulté de la déclaration DORA

- **Je n'ai trouvé aucun chiffre public de coût par déclaration** (ni dans les rapports ESAs/AMF/ACPR lus). Ne pas inventer de « X € par rapport ». Ce qu'on peut dire de façon vérifiée : le cadre impose une cascade **notification initiale (4 h après classification en majeur, au plus tard 24 h après la prise de connaissance) → rapport intermédiaire (72 h) → rapport final (1 mois)** (RTS 2025/301) et un gabarit unique (ITS 2025/302) [V-interne], et les superviseurs observent des **retards et des erreurs de champs** (ACPR) [V].
- **Les instructions opérationnelles des ESAs du 16/09/2026** listent les champs qui posent problème (2.5, 2.6, 2.8, montants en milliers, 4.12) [V-interne] : https://www.esma.europa.eu/sites/default/files/2026-09/DORA_Incident_reporting_-_Operational_instructions.pdf
- **Le dépôt se fait par xBRL-CSV via le portail de l'autorité nationale** (la plupart des sources outils le soulignent : un Excel ne passe pas la validation) [Agrégateur] https://www.orbiqhq.com/templates/dora-register-of-information-starter.md. **Notre PoC ne produit pas de xBRL-CSV ; il produit un JSON/PDF pré-rempli et le dit.**
- **Le coût caché est le temps humain** : qualifier en quelques heures sans données (critères art. 9), sous incertitude juridique (un exploit de logique est-il un « accès non autorisé réussi » ? [Interp.]). Notre valeur : réduire le temps au premier brouillon, **pas** remplacer la décision. Mesurable : minutes entre alerte et brouillon.

### 1.5 Prestataires tiers critiques (TIC) : RPC, oracles, bridges, custodians, appliances

- **Registre d'informations** (ITS 2024/2956) et **CTPP désignés le 18/11/2025** : [V-interne]. La liste exacte des noms reste **[ÀV]** : j'ai retrouvé le PDF officiel (https://www.eiopa.europa.eu/document/download/56b1ca78-5dd2-4d36-8377-47a538eb7558_en?filename=List%20of%20designated%20CTPPs.pdf) mais mon outil ne sait pas le décoder. À ouvrir à la main.
- **Les tiers qui ont fait perdre de l'argent en 2026** : appliances de sécurité (Bitget), RPC et config de vérificateur (KelpDAO), signataires d'oracle (Ostium), oracle tiers (Bonzo), KMS cloud (Resolv), DNS registrar (CoW), front-end hébergé (Bybit via Safe). Cumul « infrastructure tierce » : > 630 M$ en 7 mois [Agrégateur, V-interne].
- **Point de recoupement DORA** : ESAs : 29 % d'incidents venant de tiers, AMF : > 80 % pour la France, ACPR : « plus de la moitié ». Les définitions diffèrent (les ESAs incluent les tiers « internes ») : **ne pas mélanger ces pourcentages sur une même slide** [Interp.].
- **Côté DeFi, aucun registre ne couvre** : détenteur de rôle, config DVN 1-of-1, signataires d'oracle, RPC. C'est l'espace de l'idée S6/S7 (§3).

### 1.6 Assureurs crypto : ce qui est couvert

- **Nexus Mutual** : cover discrétionnaire (« pas de l'assurance régulée », claims payés à la discrétion de la mutuelle), **> 18,5 M$ de sinistres payés depuis 2019** [V] https://nexusmutual.io/defi-insurance. Ordre de grandeur : **un seul gros hack de 2026 vaut 15 fois ce total.** [Interp.]
- **Couverture** : « moins de 1 % du TVL DeFi » (comparateur) ou « moins de 0,05 % » (podcast OpenCover) : définitions différentes, **[Agrégateur]**. Neptune Mutual a fermé sa place de marché fin 2024 faute d'adoption [Agrégateur] https://www.spark.money/tools/defi-insurance-protocol-comparison.
- **Relm** (Bermudes, régulé, cyber/custody/staking, réassurance Relm II) ; **Chainproof** (spin-off de Quantstamp, licence bermudienne) : tous deux hors chaîne, dates à vérifier [V partiel] https://coindesk.com/business/2024/04/03/bermuda-licensed-relm-insurance-unveils-suite-of-crypto-risk-products/.
- **Conséquence** : l'assurance ne protège pas les trésoreries DAO et la plupart des protocoles ; la prévention et la réponse restent la seule parade. Un assureur exige de plus en plus un **dossier de preuves** : argument pour la preuve ancrée (S5, S18). [Interp.]

### 1.7 Qui souffre, et ce qu'il lui manque

| Victime | Douleur vécue | Ce qui lui manque aujourd'hui |
|---|---|---|
| **CASP agréé MiCA** (exchange, custodian, plateforme de staking) | Incident → compteur DORA 4 h / 24 h ; tiers non cartographiés ; signataires et backend compromis (Bitget) | Pont entre alerte on-chain et déclaration ; registre de tiers à jour ; limites de vélocité indépendantes du backend |
| **Protocole DeFi** (équipe + DAO) | Un exploit en 1 transaction ; pause ou non, en 10 min ; faux positif = perte de confiance | Détection sans faux positif ; réponse graduée pré-autorisée ; Safe Harbor |
| **Trésorerie DAO** | Multisig compromis (Drift) ; assurance quasi inexistante | Surveillance des changements de signataires/seuils/modules ; simulation indépendante de l'interface |
| **Émetteurs RWA / stablecoins sur Avalanche** (BUIDL via Securitize, dépôts tokenisés) | Rôles mint/burn/forceTransfer, oracles de NAV, listes blanches KYC ; exigences DORA/MiCA si entité UE | Garde-fou rôles + réserves ; dossier d'audit. Securitize a un cadre d'intégration Avalanche (SOC 2 type II, vendeur) https://docs.avax.network/integrations/securitize ; une plateforme UE (DLT Pilot) bâtie sur Avalanche est évoquée par un article secondaire **[ÀV]** |
| **Market makers / trésoreries d'exchanges** | Hot wallets, comptes privilégiés, signatures API | Détection d'anomalie de vélocité ; gel coordonné |
| **Utilisateurs « lambda »** (persona Adem) | Address poisoning, permit phishing, front-end clone | Hors périmètre piste 4 : touche P1/P3 ; mentionné, non traité |

---

## 2. Cartographie des concurrents

Statut de preuve : **[V]** lu cette session ou dans v1 ; **[Connaissance]** non revérifié aujourd'hui (à contrôler avant de l'afficher). Les colonnes « clients » ne donnent que des noms publics que j'ai vus.

### 2.1 Détection et réponse on-chain en temps réel

| Nom | Ce qu'ils font | Clients (publics) | Ce qu'ils NE font pas |
|---|---|---|---|
| **Hypernative** | Détection pré-exploit, pause automatique (rôle direct), wallets, > 60 chaînes ; série B 40 M$ (juin 2025), « 200+ clients, 100+ Md$ protégés » [Vendeur] | Aptos, Ethereum, Morpho, Movement, Sonic, Wintermute, ZKsync ; cas Parallel et Accountable [V] https://fintech.global/2025/06/11/hypernative-raises-40m-to-strengthen-web3-threat-protection/ | Aucune sortie DORA/MiCA ; pas de classification ; pas de preuve vérifiable par un tiers de ses taux (chiffres vendeur) ; pas de registre de tiers |
| **Chainalysis Hexagate** | Détection ML runtime, réponse automatisée. **Offre gratuite « tailored » aux fondations Base, Avalanche, MegaETH, Plasma** (déc. 2025) | Coinbase, Uniswap [V-interne] ; programme fondations [V] https://www.crowdfundinsider.com/2025/12/256553-chainalysis-introduces-hexagate-security-for-blockchain-foundations-ecosystem-devs/ | Pas de couche conformité européenne ; l'offre gratuite vise les développeurs de protocoles, pas le CASP régulé ; pas de scorecard publique |
| **BlockSec Phalcon** | Mempool + tx, 3 niveaux de risque, pause auto ou front-running de sauvetage | > 20 attaques bloquées [Vendeur] | Front-running juridiquement gris (lui-même le reconnaît), inopérant sur relais privés [V-interne] |
| **Forta** (Firewall, Attack Detector) | Bots communautaires + ML, score de risque pré-exécution | 700 M tx filtrées en 2025 [V-interne] | Dépend de l'adoption par les rollups ; pas de couverture compromission de clé ; pas de DORA |
| **Cyvers** | ML d'anomalies, alertes et mitigation, cible CASP/custodians ; seed 8 M$ | [Vendeur] 99,9 % de précision non vérifié | Pas de rapport réglementaire ; pas de lien Avalanche trouvé |
| **Venn / Ironblocks** | Réseau de nœuds qui filtre avant inclusion via RPC protégé, restaké EigenLayer ; Firewall de contrat | Glue Network, EigenLayer, ether.fi (lancement 2024) [V] https://www.businesswire.com/news/home/20240925419323/en | **Aucune actu 2026 trouvée** ; exige que l'utilisateur passe par le RPC protégé |
| **Phylax Credible Layer** (assertions) | Invariants en Solidity exécutés par le séquenceur/builder ; tx refusée si violée | Linea [V-interne] | Impossible sur le C-Chain public ; possible sur L1 Avalanche souveraine (piste) |
| **CUBE3** | RASP : le contrat intègre un contrôle, registre, blocage de tx ; Ethereum/Polygon/Avalanche/BNB/Solana | [V] https://docs.cube3.ai/protect-products/rasp/rasp-integration | Pas de volet DORA ; modification du contrat requise |
| **Spherex** | Protection runtime embarquée avec règles prédéfinies ; seed 8,2 M$ (2023) | [Agrégateur] | Idem |
| **Blockaid** | Simulation et scan avant signature, monitoring ; **intégré dans Core (wallet Avalanche)** ; série B 50 M$ (fév. 2025) | Core, MetaMask [V] https://www.theblock.co/news/regulation/2025-02-18-blockaid-closes-50-million-series-b-machine-learning-security-341601 | Faux positifs et explications peu lisibles [V-interne] ; ne voit pas l'opérationnel institutionnel |
| **Blocknative** | Mempool et alertes de transaction historiquement | [Connaissance] | Statut 2026 inconnu de moi **[ÀV]** ; ne pas lister comme actif sans vérifier |
| **Phalanx / Ancilia** | Plateformes de sécurité web3 (détection) | [Connaissance] | Je n'ai pas pu vérifier leur offre : **[ÀV]** |
| **Tenderly** | Alerts + Web3 Actions (TS) | [V-interne] | Monitor payant ; pas de logique réglementaire |
| **OpenZeppelin Defender / Monitor / Relayer** | Service hébergé **arrêté le 1er juillet 2026** ; Monitor et Relayer open source auto-hébergés | [V-interne] | Brique libre utilisable sur Fuji, pas un produit fini |
| **Sentio, Goldsky, QuickNode Streams/alerts, Alchemy Notify (webhooks)** | Indexation, streams, webhooks d'événements | Nombreux développeurs [Connaissance] | Aucune interprétation de sécurité ni conformité ; ce sont des **briques d'ingestion** |
| **Guardrail, Olympix, Pessimistic, Range** | Guardrail : monitoring/pause ; Olympix : analyse de code en CI ; Pessimistic : audit + outils ; Range : monitoring de sécurité pour protocoles | [Connaissance] | Recherche web de cette session n'a rien renvoyé sur Guardrail/Olympix/Sentio : **[ÀV]** |
| **CertiK Skynet** | Notation et monitoring de projets | Écosystème large [Connaissance] | Score de risque public, pas de réponse ni de DORA |
| **PeckShield, SlowMist (MistTrack)** | Alertes publiques, base « hacked », traçage | Cités dans les rapports mensuels [V] | Service d'analyse après coup, pas d'automatisation de réponse chez le client |
| **Dedaub (Watchdog), Zellic, Halborn, Hexens** | Audit + outils ; Dedaub propose du monitoring | [Connaissance] | Audit ponctuel, pas de réponse ni conformité |
| **Nansen, Arkham** | Analytique, attribution, labels | Traders, fonds [Connaissance] | Intelligence, pas de contrôle de l'actif du client |

### 2.2 Bounties, assurance, standards, garde

| Nom | Ce qu'ils font | Ce qu'ils ne font pas |
|---|---|---|
| **Immunefi, Sherlock** | Bug bounties / concours d'audit. **Ava Labs a un programme Immunefi (max 100 000 $, critique = 10 % des fonds)** [V] https://immunefi.com/bug-bounty/avalanche/information/ | Pré-déploiement ; rien après la mise en production |
| **Nexus Mutual / Chainproof / Relm** | Voir §1.6 | Prévention ; couverture minime |
| **ERC-7265 (circuit breaker)** | Coupe-circuit sur les sorties au-delà d'un pourcentage par fenêtre | **Statut non retrouvé en 2026** (EIP proposé en juillet 2023, un grant Aave existe pour l'implémenter) : ne pas affirmer « standard finalisé » https://ethereum-magicians.org/t/eip-7265-circuit-breaker-standard/14909 |
| **Chainlink Proof of Reserve + Automation/CRE** | Flux de réserve qui déclenche pause du mint ; patron officiel | Pas de classification ni de DORA ; **au moins 4 projets du hackathon Chainlink 2026 (SentinelFi, ReserveWatch, Safeguard Engine, SentinelX) font la même chose** https://chain.link/hack-26/projects/reservewatch ; https://blog.chain.link/defi-circuit-breakers → **le simple « mint stop sur réserve » est banal** |
| **Safe{Wallet} Guards / modules** | Contrôles de transaction sur multisig | Ne protège pas si l'UI ment (Bybit) ; pas d'alerte hors-bande |
| **Fireblocks** (politiques MPC) | Politique de transaction, approbations | Backend de confiance : « si le backend ment, on approuve » (Bitget) [V-interne] |
| **TRM Labs, Elliptic, Chainalysis Reactor** | Traçage, sanctions, KYT. **T3 FCU (Tether, TRON, TRM) : > 450 M$ gelés (mai 2026)** | Après coup ; pas d'intégration native au playbook du client | https://unchainedcrypto.com/t3-financial-crime-unit-says-it-has-frozen-more-than-450-million-in-illicit-crypto-globally/ |
| **SEAL 911 / Safe Harbor** | Permission contractuelle pour whitehats de « rescuer » des fonds vers une adresse de récupération ; adopté par Uniswap, Balancer, Pendle (page sans date), votes Aave, Inverse (mars 2025) | Il n'y a pas d'**outillage de rescue vérifié** côté client https://frameworks.securityalliance.org/safe-harbor/overview |
| **Circle / Tether (gel)** | Circle : gel seulement sous contrainte légale ; critiqué après Drift (ZachXBT : ~420 M$ d'USDC illicite non gelé sur 15 cas, allégation) | Aucun canal automatisé de « paquet d'incident » vers l'émetteur https://whale-alert.io/stories/99a1011ccc8a47/ |

### 2.3 Avalanche spécifiquement

| Brique | Ce qu'elle fait | Ce qu'elle ne fait pas |
|---|---|---|
| **Core + Blockaid** | Alertes avant signature dans le wallet | Côté utilisateur, pas côté protocole/CASP |
| **Hexagate gratuit (fondations)** | Voir §2.1 | Pas la conformité UE |
| **Hypernative** | Surveille Avalanche (watchlist Parallel) [V] | Idem |
| **AvaCloud / Data API (Glacier) / Webhooks** | Données, `address_activity`, HMAC, **Fuji supporté** [V-interne] | Aucune garantie de latence publiée ; aucune interprétation |
| **ICM / Teleporter / Warp** | Messagerie inter-L1 par signature BLS | Aucun outil dédié de monitoring de sécurité ICM trouvé (j'ai cherché ; seulement des métriques de nœuds et la doc). Docs : le Validator Manager ne passe pas par un relayer tiers, donc un moniteur de relayer ne voit pas les changements de validateurs ; la source de vérité est la P-Chain https://docs.avax.network/academy/avalanche-l1/permissioned-l1s/01-introduction/03-interop [V partiel] |
| **Incident « delegatecall » des précompilés** | Faille pouvant permettre de forger des actions privilégiées ; jamais exploitée ; rollback par étapes, correctif dans **Granite (mainnet 19/11/2025)** | https://docs.avax.network/blog/delegatecall-incident (le corps de page n'a pas été récupéré ; détails issus d'un extrait de recherche, **[ÀV]**) |
| **Bug bounty Immunefi Ava Labs** | Voir §2.2 | Hors production client |
| **Retro9000 / Team1 grants** | Financent L1 et outillage ; le dernier cohorte lu (27 fév. 2026) = 6 projets, 160 k$, aucun outil de sécurité | Pas de sélection « sécurité » identifiée https://www.avax.network/about/blog/the-avalanche-foundation-announces-fourth-cohort-for-retro9000-l1-and |

### 2.4 Côté DORA : outils de déclaration, de registre, de tiers

| Outil | Ce qu'il fait | Ce qu'il ne fait pas |
|---|---|---|
| **Archer (DORA RoI app pack)** | Collecte de données de tiers, export au format du registre | Pas de lien avec l'état on-chain https://community.archerirm.com/hc/en-us/articles/50661677562515 |
| **Formalize, DAPR (DORA Register), SureCloud, Bastion, Legiscope** | Registre d'informations (15 gabarits Excel), incidents au format ITS | Saisie manuelle ; pas de preuve technique https://formalize.com/en/dora/roi |
| **OpenText, D3 Security (Morpheus), Dynatrace** | Workflows d'incident et rapports réglementaires configurables ; ITSM | Entreprises classiques, pas d'événement on-chain https://d3security.com/resources/dora-compliance-on-autopilot/ |
| **ServiceNow, OneTrust, Prevalent, 3rdRisk, Regnology, Wolters Kluwer, Corlytics, Clausematch, Thirdfort** | GRC / TPRM / reporting réglementaire généraliste | **Mes recherches n'ont pas confirmé leurs pages DORA** : tout ce que j'écris ici sur eux est [Connaissance/ÀV]. Aucun n'est conçu pour des événements on-chain |
| **Big4 / KPMG** | Services de conseil et solutions DORA | Je n'ai pas lu d'offre produit précise ; le jury KPMG est un lecteur, pas un concurrent [ÀV] |
| **Open source** | ArkForge : **serveur MCP MIT** couvrant le cycle DORA (registre art. 31, modèle d'incident art. 17-18) https://mcp.arkforge.tech/en/mcp-dora.html ; modèles Excel gratuits | Outil de développeur, aucune alimentation depuis la chaîne |

**Synthèse** : aucun outil trouvé ne relie un **événement on-chain horodaté** à un **champ de l'ITS 2025/302** avec preuve, ni n'alimente le **registre de tiers** depuis l'état d'un contrat. C'est le créneau. [Interp. fondée sur l'absence dans mes recherches ; absence ≠ preuve.]

---

## 3. Toutes les sous-possibilités

Convention pour chaque fiche : **Problème** · **Mécanisme** · **Existe** · **Neuf** · **Données de démo** · **Métriques** · **Mapping** · **Difficulté / note**. Note = grille Track 1 (Détection 30, Réponse 20, Faisabilité 20, Conformité 15, Pitch 15), chaque sous-note sur 10, résultat sur 100. **Notes estimées par nous, non validées.**
Mapping : NIST CSF 2.0 (identifiants à contrôler sur le référentiel officiel) · ATT&CK · ATLAS/ASI (si IA) · D3FEND (IDs **[ÀV]**).

### S1. HoneyVault : fausse vulnérabilité = zéro faux positif (reprise v1, affinée)
- **Problème** : tout détecteur probabiliste doit choisir entre manquer un exploit et mettre en pause à tort (la pause > 2 h est elle-même un critère DORA d'indisponibilité).
- **Mécanisme** : fonction leurre (ex. `migrateLegacyBalance`) absente de l'UI/docs, jamais appelée légitimement. (1) scan du bytecode des nouveaux contrats pour `PUSH4 <sélecteur leurre>` + adresse du vault, donc pause **avant** la 1re tx d'attaque ; (2) appel du leurre → mode quarantaine silencieuse (sorties à 0, pas de revert, petit appât) ; (3) filet : tx échouée vers le leurre → pause.
- **Existe** : honeypots **offensifs** très étudiés (HoneyBadger, USENIX 2019 : 690 honeypots sur 2 M de contrats) https://www.usenix.org/conference/usenixsecurity19/presentation/ferreira ; pièges sur DEX https://arxiv.org/pdf/2309.13501. **Défensif sur un protocole vivant : je n'en ai trouvé aucun cas ni mesure** (billet non académique seulement) [V pour l'absence dans mes recherches].
- **Neuf** : décision déterministe sans ML, preuve de zéro FP sur un dénominateur annoncé, détection au déploiement.
- **Limites à dire** : un attaquant qui lit le code vérifié peut éviter le leurre ; un agent LLM qui simule l'exécution peut le repérer (SCONE-bench-like) ; ce n'est qu'une couche.
- **Démo** : contrat sur Fuji ; 1 000 tx normales rejouées (0 alerte) ; contrat d'exploit déployé → bandeau + pause au bloc suivant, lien Snowtrace.
- **Métriques** : blocs et secondes entre déploiement et pause ; FP = 0/N ; fonds sauvés / TVL ; liste des cas non couverts.
- **Mapping** : NIST DE.CM-01, DE.AE-02, DE.AE-08, RS.MI-01, RS.MA-03 · ATT&CK T1587.004, T1190, T1657 · D3FEND Decoy Object / Decoy Environment (D3-DO / D3-DE **[ÀV]**) · OWASP SC01 (contrôle d'accès).
- **Difficulté** moyenne. **Note 83** (9/8/8/7/9). Risque de jugement « sécurité par l'obscurité » : réponse = couche en plus.

### S2. Invariants de réserve et de mint (Resolv, Liquid, KelpDAO rsETH)
- **Problème** : un rôle de mint sans plafond (Resolv), un peg-out non adossé (Liquid), un message cross-chain falsifié (Kelp).
- **Mécanisme** : `supply ≤ réserves`, plafond de mint par fenêtre, comparaison avec une **seconde source** de réserve ; réponse : pause du mint seulement (pas du rachat).
- **Existe** : Chainlink PoR + CRE/Automation (patron officiel) et **au moins 4 projets de hackathon Chainlink 2026** ; Hypernative. **Banalisé.**
- **Neuf** : peu, sauf si l'invariant est **testé par rejeu de l'incident réel** (S18) et relié à la classification (S5).
- **Démo** : vault avec token mintable, mint anormal bloqué au bloc N.
- **Métriques** : mint évité / mint total ; FP sur trafic normal ; temps de pause.
- **Mapping** : NIST DE.CM-01, DE.AE-04, RS.MI-01 · ATT&CK T1078 (compte valide), T1657 · D3FEND Application Configuration Hardening / Outbound Traffic Filtering **[ÀV]**.
- **Difficulté** faible. **Note 71** (7/7/8/7/6).

### S3. Simulation pré-exécution de la transaction (mempool)
- **Problème** : bloquer avant inclusion. **Existe** : Blockaid, Forta Firewall, Venn, Phalcon. **Limite forte** : 56 % des attaques passent par des mempools privés (LookAhead) [V-interne] ; sur le C-Chain public on ne contrôle pas le builder.
- **Neuf** : peu. **Démo** : simulation en fork Anvil d'une tx piégée. **Métriques** : latence de simulation, FP.
- **Mapping** : NIST DE.AE-02, PR.PS · ATT&CK T1190 · D3FEND Inbound Traffic Filtering / Process Analysis **[ÀV]**.
- **Difficulté** haute. **Note 56** (7/5/4/5/6). À écarter comme cœur ; utile comme module de S8.

### S4. Réponse graduée et pause proportionnée (ERC-7265 / rate limit de sortie)
- **Problème** : une pause globale sur faux positif est un incident DORA. 
- **Mécanisme** : échelle **L0 observer → L1 alerte → L2 plafond de sortie (ex. 5 % du TVL par fenêtre de N blocs) → L3 quarantaine d'un acteur → L4 pause du module → L5 pause globale**, chaque niveau avec **expiration automatique** codée en dur, rôle guardian limité à la pause, reprise par multisig humain. Les paliers d'Hypernative (alerte puis pause) en sont l'ancêtre [V].
- **Neuf** : lier chaque palier à son **effet DORA** (L5 > 2 h = critère « indisponibilité »).
- **Démo** : trois attaques, trois paliers différents. **Métriques** : fonds perdus par palier, utilisateurs légitimes gênés (FP « humains »), durée de gêne.
- **Mapping** : NIST RS.MA-01, RS.MI-01, RS.MI-02, RC.RP-01 · ATT&CK T1657 · D3FEND Execution Isolation / Network Isolation **[ÀV]**.
- **Difficulté** moyenne. **Note 72** (5/9/8/8/7) ; **c'est la meilleure brique pour la question de responsabilité (§6)**.

### S5. Classification DORA déterministe + formulaire pré-rempli avec preuve par champ (DORA Autopilot)
- **Problème** : ACPR : délais « rarement respectés », erreurs de classification et de complétude [V].
- **Mécanisme** : règles versionnées RTS 2024/1772 (art. 6, 8, 9, 10), horloge 4 h / 24 h / 72 h / 1 mois, suivi de récurrence art. 8(2), champs ITS 2025/302 conformes aux instructions des ESAs du 16/09/2026, **chaque champ lié à un artefact (tx, bloc, événement)**, LLM limité au texte libre avec un « sceptique » qui retire toute phrase sans preuve, hash du rapport **ancré sur Fuji**. **Boucle pause → classification** (indisponibilité > 2 h). Sortie double : incident (majeur) ou **menace bloquée = notification volontaire art. 10**.
- **Existe** : outils DORA du §2.4 (ITSM + modèles) ; **aucun alimenté par la chaîne** [Interp.].
- **Neuf** : preuve par champ + boucle de rétroaction + art. 10 pour les « sauvés ».
- **Données de démo** : KYC synthétique d'un CASP fictif, 12 cas de test construits à partir du RTS (à faire relire par KPMG).
- **Métriques** : minutes alerte → brouillon ; % de champs obligatoires remplis ; % d'affirmations avec preuve (cible 100 %) ; exactitude sur 12 cas.
- **Mapping** : NIST RS.MA-02, RS.MA-03, RS.AN-03, RS.AN-06, RS.CO-02, RS.CO-03, DE.AE-04, GV.OC-03 · ATT&CK : sans objet direct (on lie aux techniques de l'incident via le champ 3.25) · ASI : ASI09 (confiance homme-agent) si le LLM rédige.
- **Difficulté** moyenne. **Note 77** (6/7/9/10/8) seule ; multiplicateur de conformité des autres.

### S6. Registre de tiers vivant : cartographie automatique des dépendances (DVN, rôles, oracles, RPC)
- **Problème** : ESAs 29 % / AMF > 80 % d'incidents venant de tiers ; le registre ITS 2024/2956 ne contient que des contrats, pas les dépendances techniques.
- **Mécanisme** : lecture des slots EIP-1967, des événements `RoleGranted/Revoked`, des seuils Safe, des adresses d'oracle (aggregator, heartbeat), de la **configuration de vérificateur cross-chain (un seul DVN = signal d'alarme à la KelpDAO)** et du registre Teleporter/validateurs ; graphe des points uniques de défaillance ; export CSV aligné sur le registre et **champ 2.8** (`NOM;CODE;LEI|EUID;info`) pré-rempli quand l'incident vient d'un tiers.
- **Existe** : Archer et consorts (saisie manuelle) ; aucun outil DeFi ne produit des lignes de registre [Interp.].
- **Données de démo** : SH Vault avec 1 EOA guardian, 1 oracle, 1 RPC → alertes ; puis on corrige (multisig 2/3, 2 oracles) et le graphe s'améliore.
- **Métriques** : rappel de découverte vs vérité terrain manuelle ; temps de scan ; nb de SPOF trouvés.
- **Mapping** : NIST GV.SC-04, GV.SC-07, ID.AM-02, ID.AM-04, DE.CM-06 · ATT&CK T1195, T1199, T1078 · D3FEND Asset Inventory / Configuration Inventory **[ÀV]**.
- **Difficulté** moyenne. **Note 68** seule (6/5/7/10/7).

### S7. Quorum de RPC et intégrité des sources de données (leçon KelpDAO)
- **Problème** : RPC empoisonnés + DDoS des sains.
- **Mécanisme** : N endpoints Fuji interrogés à chaque bloc (hash, solde, prix) ; divergence au-delà de ±1 bloc → alerte « RPC suspect » ; plus : oracle daté dans le futur (Ostium), saut de prix.
- **Existe** : redondance RPC classique ; **personne ne la relie au registre DORA**. Limite : ne voit pas un empoisonnement commun à tous les endpoints.
- **Démo** : proxy local qui ment → détection en 1 bloc → pause. **Métriques** : blocs de détection, FP sur 1 h de trafic réel.
- **Mapping** : NIST DE.CM-06, DE.AE-02, ID.AM-04 · ATT&CK T1565, T1498, T1195 · D3FEND Message Authentication / Platform Monitoring **[ÀV]**.
- **Difficulté** faible. **Note 70** (7/6/8/8/6). **S6+S7 combinés : 73** (7/7/7/9/7).

### S8. Intégrité du front-end et du DNS + vérification d'intention hors UI (CoW, Bybit)
- **Problème** : l'interface ment, les signataires approuvent.
- **Mécanisme** : surveillance du hash du bundle JS et des enregistrements DNS de notre dApp démo ; décodage indépendant du calldata (delegatecall vers implémentation inconnue) avant signature multisig ; alerte hors-bande.
- **Existe** : Blockaid (côté wallet), plugins de simulation (contournables, TOCTOU) [V-interne].
- **Neuf** : lien explicite avec DORA (hébergeur du front = tiers, champ 2.8).
- **Démo** : on modifie le JS de notre faux front → alerte. **Métriques** : temps de détection, FP sur déploiements légitimes.
- **Mapping** : NIST DE.CM-01, DE.CM-09, PR.PS · ATT&CK T1584.002 (DNS), T1195, T1566 · D3FEND File Integrity / DNS Traffic Analysis **[ÀV]**.
- **Difficulté** moyenne. **Note 62** (6/5/7/6/7).

### S9. Paquet de gel coordonné (Circle / Tether / T3 FCU / exchanges / SEAL 911)
- **Problème** : Drift : 6 h de pont sans gel ; Circle gèle sous contrainte légale ; T3 FCU > 450 M$ gelés (mai 2026) [V].
- **Mécanisme** : dès la pause, **génération automatique du dossier** (adresses, tx, montants, ATT&CK, preuve ancrée) dans le format attendu par l'émetteur / T3 FCU / SEAL 911 ; envoi **humain** (décision juridique).
- **Existe** : TRM/Chainalysis (enquêtes), T3 (réseau). **Neuf** : l'automatisation du paquet et son horodatage vérifiable.
- **Démo** : PDF + JSON, mail simulé. **Métriques** : minutes pause → paquet prêt ; complétude.
- **Mapping** : NIST RS.CO-02, RS.CO-03, RS.AN-07, RC.CO-03 · ATT&CK T1657 · D3FEND : sans objet fort.
- **Difficulté** faible. **Note 63** (4/7/7/8/7). Impact réel dépend de tiers non maîtrisables.

### S10. Traçage des fonds et alerte des exchanges
- **Problème** : blanchiment via THORChain, Tornado, OTC. **Existe** : TRM, Elliptic, Chainalysis, MistTrack, Arkham, Nansen : très forts. **Neuf** : presque rien en 24 h. **Valeur** : consommer leur API (si accessible) plutôt que concurrencer.
- **Mapping** : NIST DE.AE-03, RS.AN-03, RS.CO-03 · ATT&CK T1657 · D3FEND : n/a.
- **Difficulté** haute (données). **Note 55** (5/6/5/6/6). À réduire à un module de S9.

### S11. Anomalie de gouvernance multisig (Drift) : signataires, seuils, modules, nonces
- **Problème** : prise de contrôle après 6 mois d'ingénierie sociale ; 31 retraits en 12 min.
- **Mécanisme** : surveillance des `AddedOwner`, `ChangedThreshold`, `EnabledModule`, `ChangedGuard`, tx `delegatecall` vers une implémentation non listée ; timelock obligatoire sur les changements de rôle ; détection d'une rafale de retraits après un changement.
- **Existe** : Hypernative (changement de signataires) [V-interne], Safe Guards. **Neuf** : corrélation avec le registre de tiers et la classification (accès non autorisé = art. 6(c)).
- **Démo** : on ajoute un owner → pause des retraits. **Métriques** : blocs entre changement et blocage.
- **Mapping** : NIST DE.CM-03, DE.AE-02, PR.AA · ATT&CK T1078, T1098 (manipulation de compte) · D3FEND Authentication Event Thresholding / User Behavior Analysis **[ÀV]**.
- **Difficulté** faible-moyenne. **Note 70** (7/7/7/7/7).

### S12. Agents IA avec wallet (Grok/Bankr) : pare-feu de politique + trace DORA
- **Problème** : prompt injection encodée, 150-200 k$ ; MetaMask a lancé un **Agent Wallet** le 8 juin 2026 (donc le public arrive) [V] https://www.crowdfundinsider.com/2026/06/284472-metamask-introduces-agent-wallet-enabling-ai-agents-with-autonomous-defi-access/
- **Chevauchement** : c'est la piste 3 (Antibody AP, décision `V_DECISION.md`). **Ne pas dupliquer** ; l'intégrer comme *entrée* de la chaîne détection→DORA (un agent est un tiers TIC).
- **Mapping** : ASI01 (détournement d'objectif), ASI02 (mauvais usage d'outils), ASI03 (privilèges) · ATLAS AML.T0051 (injection de prompt) **[ÀV ID]** · NIST DE.CM-03, PR.AA · ATT&CK T1657.
- **Note 74** (7/8/7/7/8) mais **hors piste**.

### S13. Monitoring ICM/Teleporter et des L1 Avalanche (validateurs, relayers, messages)
- **Problème** : sécurité de l'ICM = jeu de validateurs de chaque L1 (souvent petit, PoA) ; relayers hors chaîne ; le moniteur de relayer ne voit pas les changements du Validator Manager (P-Chain = source de vérité) [V partiel].
- **Mécanisme** : alerte sur changement du validator set, concentration du stake, volume anormal de messages, récepteur qui ne vérifie pas la chaîne source (point relevé par l'audit OZ [V-interne]).
- **Existe** : métriques de nœuds Avalanche ; **aucun outil sécurité ICM trouvé** [V pour l'absence dans mes recherches].
- **Neuf** : vrai trou Avalanche-natif, **mais** nécessite de lancer une L1 de test avec Avalanche-CLI et un relayer (3 à 5 h, ~1 min de latence, démo fragile [V-interne D1]).
- **Mapping** : NIST DE.CM-01, DE.CM-06, ID.AM-02 · ATT&CK T1199, T1195 · D3FEND Platform Monitoring **[ÀV]**.
- **Difficulté** haute. **Note 66** (7/6/5/7/8). Bon *deuxième acte* si le temps le permet.

### S14. eERC et auditeur : conformité sans casser la confidentialité
- **Problème** : tokens confidentiels = angle mort AML. **Mécanisme** : clé d'auditeur qui permet de vérifier des agrégats (volume, seuils) sans exposer les soldes. 
- **Piste intéressante pour Team1** (un atelier eERC figurait à Team1 Hacks Chennai [V] https://build.avax.network/hackathons/3a83347a-5b3d-4f87-8c92-6b97e0e0acfb) mais **hors cœur de la piste 4**, complexe (zk, ~947 k gas par transfert [V-interne]).
- **Mapping** : NIST GV.OC-03, DE.AE-03 · ATT&CK T1657 · D3FEND : n/a. **Difficulté** haute. **Note 51** (4/3/5/8/7).

### S15. Safe Harbor outillé : contrat de rescue pré-autorisé
- **Problème** : BlockSec reconnaît ne pas pouvoir agir par risque juridique [V-interne] ; SEAL Safe Harbor règle la partie juridique (adresse de récupération, prime, KYC) [V].
- **Mécanisme** : `RescueVault` : adresse de récupération déclarée ; un whitehat appelle `rescue()` **seulement si** un état « exploit actif » est attesté par le guardian ; prime plafonnée ; tout est loggé.
- **Neuf** : outillage vérifiable (le Safe Harbor existe surtout comme texte). **Démo** : un « whitehat » récupère des fonds sur Fuji. **Métriques** : temps, montant, prime.
- **Mapping** : NIST RS.MI-01, RC.RP-02, RS.CO-03 · ATT&CK T1657 · D3FEND : n/a. **Difficulté** moyenne. **Note 67** (6/8/6/7/7). Attention : il faut éviter l'effet « on organise un vol » dans le pitch.

### S16. Assurance paramétrique on-chain déclenchée par un incident classifié
- **Mécanisme** : un événement signé « incident vérifié » (classification S5 + signature de 2 parties) débloque une indemnité plafonnée. **Existe** : Nexus (discrétionnaire), Relm (régulé, hors chaîne). **Problème d'oracle** : qui atteste l'incident ?
- **Note 43** (3/4/4/6/6). **Artificiel pour un hackathon de 36 h** ; à citer comme « débouché », pas à construire. [Interp.]

### S17. Copycat Shield : rejeu défensif des exploits d'autres protocoles (reprise v1)
- Voir v1 : > 69 % d'attaques copiées (GenDetect) ; rejeu sur fork Anvil de Fuji ; agent LLM de défense sur notre fork. **Difficulté** haute (non déterminisme). **Note 72** (8/7/5/8/8). À intégrer sous forme **déterministe** dans S18.

### S18. Scorecard de rejeu de hacks réels sur fork (nouveau) : « la preuve que ça détecte »
- **Problème** : les vendeurs affichent 99,8 % / 99,9 % / > 98 % [Vendeur], **sans protocole reproductible**. La grille note la détection à 30 % (« précision, faux positifs, temps de détection sur scénario réaliste »).
- **Mécanisme** : dépôt public de **scénarios rejouables sur un fork Anvil de Fuji**, dérivés de patrons réels (mint non plafonné à la Resolv, peg-out non adossé à la Liquid, manipulation de collatéral en boucle à la Tectonic, changement de signataires à la Drift, DVN 1-of-1 à la Kelp), tous recodés sur **nos propres contrats**, plus un jeu de trafic normal (~1 000 tx, rafales et baleines). Le harnais sort : **MTTD en blocs et en secondes, FP/N, fonds sauvés/TVL, par scénario et par couche de détection**, hachés et ancrés.
- **Existe** : DefiHackLabs (PoC d'incidents), benchmarks de recherche (CyberChainBench, POCEvaluator [V-interne]). **Pas de scorecard orientée « défenseur régulé » avec ancrage vérifiable** [Interp.].
- **Neuf** : l'auditeur (KPMG) peut **rejouer** et obtenir les mêmes chiffres : réponse directe à « traçable, défendable devant un auditeur ». Aucune attaque contre un système réel : tout sur nos contrats (règle du guide).
- **Mapping** : NIST ID.IM-02/03 (améliorations), DE.AE-02, GV.OV · ATT&CK T1657, T1190, T1587.004 · D3FEND : évaluation, pas contre-mesure.
- **Difficulté** moyenne (5 scénarios). **Note 74** (8/5/8/8/8), mais **c'est ce qui fait grimper la note Détection du combo**.

### S19. Arrêt de chaîne pour une L1 souveraine (précédent Cronos/Tectonic)
- **Fait** : Cronos a arrêté la chaîne par ses validateurs puis fait un rollback, ce qui a récupéré les fonds restés sur la chaîne mais pas ceux déjà bridgés (9,19 M$ échappés) [V]. 
- **Idée** : playbook de « halt » gouverné pour une **L1 Avalanche institutionnelle** (validateurs PoA), avec classification DORA (indisponibilité de service critique). **Controverse** : centralisation, immutabilité. **Difficulté** très haute à démontrer, **note 52** (4/7/3/6/7). À évoquer en question de jury, pas en démo.

### Récapitulatif des notes

| Idée | Dét 30 | Rép 20 | Faisa 20 | Conf 15 | Pitch 15 | /100 |
|---|---|---|---|---|---|---|
| S1 HoneyVault | 9 | 8 | 8 | 7 | 9 | 83 |
| S5 DORA Autopilot | 6 | 7 | 9 | 10 | 8 | 77 |
| S18 Scorecard de rejeu | 8 | 5 | 8 | 8 | 8 | 74 |
| S12 Agents IA (hors piste) | 7 | 8 | 7 | 7 | 8 | 74 |
| S6+S7 Registre vivant + quorum RPC | 7 | 7 | 7 | 9 | 7 | 73 |
| S4 Échelle de réponse graduée | 5 | 9 | 8 | 8 | 7 | 72 |
| S17 Copycat Shield | 8 | 7 | 5 | 8 | 8 | 72 |
| S2 Invariants de réserve | 7 | 7 | 8 | 7 | 6 | 71 |
| S11 Gouvernance multisig | 7 | 7 | 7 | 7 | 7 | 70 |
| S6 seul | 6 | 5 | 7 | 10 | 7 | 68 |
| S15 Safe Harbor outillé | 6 | 8 | 6 | 7 | 7 | 67 |
| S13 ICM / L1 | 7 | 6 | 5 | 7 | 8 | 66 |
| S9 Paquet de gel | 4 | 7 | 7 | 8 | 7 | 63 |
| S8 Front-end / DNS | 6 | 5 | 7 | 6 | 7 | 62 |
| S3 Simulation pré-exec | 7 | 5 | 4 | 5 | 6 | 56 |
| S10 Traçage | 5 | 6 | 5 | 6 | 6 | 55 |
| S19 Halt de L1 | 4 | 7 | 3 | 6 | 7 | 52 |
| S14 eERC auditeur | 4 | 3 | 5 | 8 | 7 | 51 |
| S16 Assurance paramétrique | 3 | 4 | 4 | 6 | 6 | 43 |
| **Combo « Hold up » = S1 + S4 + S5 + S6/S7 léger + S18** | 9 | 9 | 7 | 10 | 9 | **87,5** |

---

## 4. Angles d'innovation pour le jury (Avalanche Team1 + KPMG)

**Ce que j'ai pu établir, et ce que je n'ai pas trouvé.**
- Je n'ai **trouvé aucune liste de gagnants Build Games 2026** (page officielle sans résultats, 300+ builders, jury en 3 cohortes : natifs, apps, institutionnels) ni aucune déclaration publique de Team1 sur ce qu'il veut en sécurité. https://build.avax.network/build-games · https://www.team1.blog/p/avalanche-february-2026-recap [V]
- Les critères officiels Build Games sont **comportementaux** : « Builder Drive, Execution (produit qui marche en 6 semaines), Crypto Culture, Long-Term Intent (construire du réel, pas farmer des prix) » [V].
- Le **mail organisateur** de ce hackathon est la meilleure indication de ce que valorise Avalanche : « utiliser la blockchain là où elle apporte une valeur réelle (preuve, traçabilité, journaux infalsifiables), pas pour cocher une case » ; enregistrer les contrats dans le repo [V] (`context/avalanche_fuji_mail.md`).
- Retro9000 récompense **L1 et outillage d'infrastructure déjà livrés** ; Team1 Mini Grants jusqu'à 10 k$, Accelerator jusqu'à 30 k$ (1er juillet 2026) [V-interne]. Un outil open source de sécurité colle à « infrastructure critique » **[Interp.]**.
- Je n'ai **aucune information** sur les préférences personnelles du juge Avalanche identifié. Ne pas en supposer.

### Classement des angles

| # | Angle | Pourquoi ça marque | Risque | Moment « wow » de démo |
|---|---|---|---|---|
| 1 | **Preuve rejouable et ancrée** (S18 + ancrage des rapports sur Fuji) | Répond mot pour mot au mail Avalanche (« journaux infalsifiables ») et à KPMG (« comment un auditeur vérifie ») ; les concurrents n'affichent que des chiffres vendeur | Paraître théorique si la démo n'est pas visible | Sur scène, le juge lance `replay --scenario tectonic` et obtient **le même hash de résultat** que sur la slide |
| 2 | **Zéro faux positif par construction** (S1) | Le jury note les FP ; on donne le dénominateur (0/1 000) | « Sécurité par l'obscurité » ; leurre évité par un attaquant qui lit le code | Le contrat d'exploit est déployé, la pause est minée **avant** son premier appel, lien Snowtrace |
| 3 | **De la pause à la déclaration DORA, champ par champ, avec preuve** (S5) | KPMG voit son propre sujet (délais, classification, erreurs que l'ACPR relève) automatisé ; texte libre sans fait inventé (sceptique) | Interprétations juridiques contestées | Un clic sur « champ 3.15 » ouvre la tx et le bloc ; le chrono 4 h / 24 h tourne |
| 4 | **La pause change la classification** (boucle S4 → S5) | Aucune plaquette ne le dit ; montre qu'on comprend DORA au-delà du formulaire | Détail technique, peu spectaculaire seul | Une jauge « indisponibilité 1 h 52 / 2 h » passe au rouge pendant qu'on parle |
| 5 | **Registre de tiers alimenté par la chaîne** (S6) | « Registre DORA vivant » ; 29 % (ESAs) à > 80 % (AMF) d'incidents viennent de tiers | Le graphe peut paraître secondaire | On passe le guardian d'une EOA à un 2/3 : le SPOF disparaît du graphe et la ligne du registre change |
| 6 | **Défense contre l'infrastructure qui ment** (S7 : quorum RPC, oracle futur) | Tragédie KelpDAO (292 M$) et Ostium ; simple à comprendre | Ne détecte pas un empoisonnement de tous les endpoints | Un proxy « empoisonné » est détecté en 1 bloc |
| 7 | **Monitoring ICM/L1** (S13) | Trou **spécifique Avalanche**, parle à Team1 | Démo fragile (relayer, 1 min de latence) | Un changement de validator set sur une L1 de test déclenche l'alerte |
| 8 | **Paquet de gel + Safe Harbor** (S9 + S15) | La réponse ne s'arrête pas à la pause : on parle d'argent récupéré (273 M$ gelés en septembre) | Dépend de tiers (émetteurs) | Un dossier d'incident est généré en secondes, prêt pour T3 FCU |
| 9 | **Position open source / Retro9000 / complément à Hexagate** | Montre la crédibilité écosystème et l'honnêteté (« on s'ajoute à Hexagate, on ne le remplace pas ») | Aucun risque technique ; peut dilue le pitch | Slide « branché sur les alertes Hypernative/Hexagate en entrée » |
| 10 | **Échelle de réponse proportionnée avec expiration automatique** (S4) | Répond à la question piège de responsabilité ; réponse « actionnable » (20 %) | Complexité de la démo | Trois attaques → trois paliers différents à l'écran |

**À éviter** (ressemble à ce qui a déjà été fait ou à du gadget) : simple « mint stop sur réserve » (au moins 4 projets Chainlink 2026), « un scanner de plus », assurance paramétrique, tokens de gouvernance, IA qui « décide » la pause.

---

## 5. Avalanche : usages crédibles et usages artificiels

### Usages crédibles (au moins 4)

1. **Fuji comme cible de déploiement réelle + vérification Snowtrace** : le vault SH, le guardian, le `EvidenceAnchor` sont déployés sur Fuji (43113) et leurs adresses consignées dans `blockchain/DEPLOYMENTS.md` (exigé par le mail). Le **bloc d'environ 1 s** (finalité quasi immédiate, Granite) permet de mesurer le MTTD en **blocs et en secondes** [V-interne D1].
2. **Ancrage horodaté des preuves DORA** : hash de chaque version du rapport et de chaque décision (`EvidenceAnchored`). Valeur réelle : l'auditeur vérifie que rien n'a été réécrit **après** l'incident. Rien de personnel ni de confidentiel n'est écrit on-chain : **seulement des hashes** (RGPD, secret des affaires) [Interp.].
3. **Ingestion par AvaCloud Webhooks / Glacier**, avec repli sur polling `eth_getLogs` : natif Avalanche, signature HMAC, Fuji supporté, mais **latence non garantie** [V-interne]. Mesurer et afficher la latence réelle est un point de franchise qui plaît.
4. **L1 souveraine pour le chemin « grade institutionnel »** : sur une L1 (Avalanche-CLI), le **contrôle des précompilés** (allow-list de transactions, de déployeurs, fee manager) permet un **gel/pause au niveau protocole** pour un émetteur RWA, ce que le C-Chain public interdit. Phylax-type assertions y deviennent possibles [V-interne] ; les noms précis des précompilés de Subnet-EVM sont **[Connaissance, ÀV]**. Précédent de crédibilité : Cronos a arrêté sa chaîne (Tectonic) [V]. À présenter comme **feuille de route**, pas comme démo.
5. **ICM/Teleporter pour propager la pause entre L1** (un guardian sur la L1 A met en pause un module sur la L1 B) : cohérent (c'est le cas d'usage du protocole), mais demande un relayer et ~1 min [V-interne]. À garder pour l'acte 2.
6. **Intégration d'alertes externes** : accepter en entrée Hypernative/Hexagate (déjà présents sur Avalanche) pour que notre couche conformité « se branche » plutôt que se substituer [Interp.].

### Ce qui serait artificiel (à ne pas faire ou à ne pas prétendre)
- **Mettre le rapport DORA entier on-chain** (confidentialité, RGPD) ; ou prétendre que la blockchain « soumet » le rapport à l'autorité : le dépôt passe par le **portail national en xBRL-CSV** [Agrégateur].
- **Un token / une gouvernance DAO** autour de l'outil.
- **Utiliser ICM ou eERC pour cocher une case** : le mail d'Avalanche dit explicitement de ne pas le faire.
- **Un « oracle de classification décentralisé »** : la classification doit rester une règle versionnée, auditable, pas un vote.
- **Prétendre à une détection native du C-Chain par le séquenceur** : impossible, seulement sur L1.
- **Affirmer qu'« Avalanche n'a aucun monitoring »** : faux (Hexagate gratuit, Hypernative, Core + Blockaid).

---

## 6. « Si le modèle se trompe, qui est responsable ? » (pause d'un contrat = décision lourde)

**Réponse courte (30 s)** : « Le modèle ne décide jamais de la pause. La pause vient de règles déterministes, validées à l'avance et signées par l'organe de direction du CASP. Le modèle explique et rédige, chaque phrase est liée à une preuve, et l'humain valide la déclaration. Une erreur du modèle ne peut donc ni geler ni débloquer un fonds ; la responsabilité reste celle de l'entité régulée, comme DORA l'exige. »

**Matrice de responsabilité (RACI proposé)** [Interp., à valider avec KPMG]

| Décision | Qui décide | Qui exécute | Qui est informé | Preuve |
|---|---|---|---|---|
| Définir règles, seuils, paliers L1-L5, durées max | **Organe de direction** (DORA art. 5) sur proposition du RSSI | Équipe sécurité | Conformité, audit interne | Version signée, hash ancré |
| L1-L2 (alerte, plafond de sortie) | **Règle déterministe** pré-autorisée | Guardian automatique (rôle limité) | Astreinte sécurité | Log horodaté |
| L3-L4 (quarantaine d'un acteur, pause d'un module) | Règle déterministe **si** déclencheur « sans FP » (leurre, invariant dur) ; sinon **un humain d'astreinte** sous N minutes (défaut = L2) | Guardian | RSSI, direction | Log + justification |
| L5 (pause globale) | **Humain** (RSSI + un membre de la direction), sauf déclencheur « sans FP » + expiration automatique | Multisig | Régulateur si critères atteints | Signatures |
| Levée de pause | **Multisig humain** | Multisig | Parties prenantes | Tx + rapport |
| Classification DORA | **Moteur de règles** propose, **responsable conformité** décide | Conformité | Direction | 2 raisonnements affichés (accès non autorisé oui/non), option conservatrice par défaut |
| Soumission à l'autorité | **Humain** | Conformité | Auditeur | Hash du rapport soumis |
| Gel / demande à l'émetteur ou à T3 FCU | **Humain** (juridique) | Juridique | Direction | Dossier généré (S9) |
| Rédaction du texte libre | **LLM**, sous contrainte « preuve ou rien » | LLM + sceptique | Conformité | Citations d'artefacts |

**Garde-fous techniques qui rendent la réponse crédible**
- Le guardian **ne peut que mettre en pause** (jamais retirer, jamais changer de rôle) ; **expiration automatique** codée en dur ; reprise par multisig humain.
- **Budget de faux positifs** annoncé : pour les déclencheurs probabilistes, palier max = L2 (pas de pause globale) ; pour les déclencheurs déterministes, FP mesuré (0/N).
- **Chaque décision est journalisée et hachée** ; le rejeu (S18) montre ce que la règle aurait fait.
- La pause > 2 h est affichée comme **critère DORA** (S5) : le coût d'une erreur est quantifié.

**Distinguer trois erreurs**
1. *Faux négatif* (attaque manquée) : perte financière ; limite connue, listée dans la fiche de défense, couverte par couches multiples.
2. *Faux positif sur pause* : indisponibilité ; borné par les paliers et l'expiration ; potentiellement déclaration art. 10 / incident si > 2 h.
3. *Erreur de rédaction/classification* : l'humain valide ; l'ACPR relève déjà ces erreurs chez les humains [V].

**Cadre juridique à mentionner prudemment** [Interp.] : DORA art. 5 (organe de direction responsable) ; AI Act (anticipation, application de l'essentiel au 2 déc. 2027 selon `V_DECISION.md`, ÀV) : supervision humaine ; contrat avec un éventuel fournisseur de détection (Hypernative, Hexagate) pour répartir la responsabilité, **mais DORA interdit de se défausser sur le tiers** (la responsabilité de l'entité demeure). **Ne pas affirmer qu'un contrat de service tiers décharge le CASP.**

---

## 7. Corrections à propager vers les autres documents

| Fichier | À corriger / nuancer |
|---|---|
| `02_track1_finance.md` §3.2-3.3 | « Il n'y a pas de monitoring dédié aux L1 ni à l'ICM » : **vrai pour ICM/L1 (mes recherches n'ont rien trouvé)** ; mais pour le C-Chain, **Hexagate est offert gratuitement aux projets Avalanche** (déc. 2025) et Hypernative surveille Avalanche |
| `02_track1_finance.md` §1.2 Bitget | « 228 M$ en 18 minutes » non retrouvé : citer ~183 M$ en ~1 h ou 75 M$ en 41 min, attaque sur ~3 h |
| `T1_P4_defi_dora.md` §1.1 | Hypernative / Parallel : confirmé, Avalanche dans les watchlists (lu sur le blog). Hexagate : ajouter l'offre gratuite |
| `T1_P4_defi_dora.md` §1.1 ERC-7265 | statut toujours non confirmé ; je n'ai pas pu lire la page EIP (404/503) |
| Partout | 3 383 incidents ESAs (2025), 29 % tiers ; AMF : 33 incidents, > 80 % prestataires, 2 chez des CASP : plus à jour que les chiffres génériques |

---

## 8. Reste à vérifier avant les slides

1. Noms exacts des CTPP (PDF EIOPA à ouvrir à la main).
2. Statut final de l'ERC-7265 (eips.ethereum.org n'a pas répondu).
3. Amende FMA de 42 000 € (source unique).
4. Corps de la page « delegatecall incident » d'Avalanche (non récupéré).
5. Statut 2026 de Blocknative, Venn, Phalanx/Ancilia, Guardrail, Olympix, Sentio.
6. Pages DORA de Regnology, Wolters Kluwer, Corlytics, OneTrust, Prevalent, 3rdRisk, Clausematch, Thirdfort.
7. Précompilés de Subnet-EVM (noms exacts), IDs D3FEND et ATLAS cités.
8. Support de `debug_trace*` sur le RPC public Fuji (à tester en H0).
9. Chiffres vendeur (99,8 %, 99,9 %, > 98 %).
10. Les deux interprétations juridiques (exploit = accès non autorisé ? DeFi = service critique ?) : à faire valider par KPMG au mentorat.

---

## Sources

**Pertes et incidents**
- CertiK T3 2026 via Cointelegraph : https://cointelegraph.com/news/bitget-hack-q3-industry-losses-1-26-billion
- CertiK H1 2026 : https://forklog.com/en/certik-says-crypto-hack-losses-hit-1-32b-in-h1-2026/
- Tectonic/Cronos : https://www.trmlabs.com/resources/blog/number-of-price-manipulation-attacks-hits-all-time-high-as-usd-75-million-is-stolen-from-tectonic · https://regional-front.cointelegraph.com/news/cronos-tectonic-rollback-111m-9m-escaped · https://bleepingcomputer.com/news/security/cronos-blockchain-restarts-after-74-million-tectonic-exploit
- Bitget : https://www.bleepingcomputer.com/news/security/bitget-hacked-via-zero-day-in-third-party-security-products/amp/ · https://decrypt.co/379275/bitget-hack-183-million-crypto-exchange-wallets · https://en.coinotag.com/bitget-attacker-avax-eth-75m-41-minutes
- Parallel : https://www.hypernative.io/blog/how-an-automated-pause-prevented-a-1-52m-exploit-on-parallel
- Circle/Drift : https://thedefiant.io/should-circle-have-frozen-the-drift-exploit-funds · https://whale-alert.io/stories/99a1011ccc8a47/ZachXBT-alleges-Circle-failed-to-freeze-420M-in-illicit-USDC-across-15-hacks-including-232M-bridged-from-a-285M-Drift-exploit-via-CCTP
- T3 FCU : https://unchainedcrypto.com/t3-financial-crime-unit-says-it-has-frozen-more-than-450-million-in-illicit-crypto-globally/
- Scam Sniffer / poisoning : https://decrypt.co/357450/signature-phishing-up-200-as-january-losses-pass-6m
- Agents IA : https://oecd.ai/en/incidents/2026-05-04-4a73 · https://www.spark.money/research/ai-wallet-security-attack-surface · https://www.crowdfundinsider.com/2026/06/284472-metamask-introduces-agent-wallet-enabling-ai-agents-with-autonomous-defi-access/

**DORA / MiCA**
- ESAs, premier rapport annuel : https://www.mondaq.com/financial-services/1808118/esas-publish-first-annual-report-on-major-ict-related-incidents-under-dora · https://www.ropesgray.com/en/insights/viewpoints/2026/07/102nbyc/lessons-from-the-european-supervisory-authorities-first-dora-major-incident-repo (403 sur lecture directe)
- AMF rapport 2025 : https://www.lemondedudroit.fr/banque-finance/304-finance/105970-amf-rapport-sur-les-incidents-majeurs-en-2025-au-titre-du-reglement-dora.html · https://www.amf-france.org/fr/actualites-publications/actualites/resilience-cyber-lamf-appelle-les-acteurs-financiers-renforcer-leurs-dispositifs-face-levolution
- ACPR-AMF retours : https://www.forvismazars.com/fr/fr/insights/publications-et-evenements/avis-d-experts/dora-retour-d-experience-et-enseignements
- Instructions ESAs 16/09/2026 : https://www.esma.europa.eu/sites/default/files/2026-09/DORA_Incident_reporting_-_Operational_instructions.pdf
- Liste CTPP : https://www.eiopa.europa.eu/document/download/56b1ca78-5dd2-4d36-8377-47a538eb7558_en?filename=List%20of%20designated%20CTPPs.pdf
- AFM (portail CASP) : https://www.afm.nl/~/profmedia/files/doelgroepen/cryptopartijen/2025/instruction-ict-notifications-dora.pdf
- Registre CASP MiCA : https://assets.kpmg.com/content/dam/kpmgsites/cy/pdf/2026/CASPs-Grandfathering-Period-June-2026.pdf.coredownload.inline.pdf · https://cointelegraph.com/news/esma-mica-register-new-casps-stanchart-update · https://eu.aminagroup.com/learn/5-things-to-consider-when-assessing-a-mica-regulated-casp-2026-guide/
- Sanctions (source unique) : https://www.legiscope.com/blog/dora-penalties-enforcement.html
- Outils DORA : https://community.archerirm.com/hc/en-us/articles/50661677562515 · https://formalize.com/en/dora/roi · https://d3security.com/resources/dora-compliance-on-autopilot/ · https://mcp.arkforge.tech/en/mcp-dora.html · https://www.orbiqhq.com/templates/dora-register-of-information-starter.md · https://www.legiscope.com/blog/best-dora-compliance-software.html

**Concurrents et standards**
- Hypernative série B : https://fintech.global/2025/06/11/hypernative-raises-40m-to-strengthen-web3-threat-protection/
- Hexagate gratuit : https://www.crowdfundinsider.com/2025/12/256553-chainalysis-introduces-hexagate-security-for-blockchain-foundations-ecosystem-devs/
- Blockaid : https://blockaid.io/blog/blockaid-bolsters-security-on-avalanche-with-core-integration · https://www.theblock.co/news/regulation/2025-02-18-blockaid-closes-50-million-series-b-machine-learning-security-341601
- Venn : https://www.businesswire.com/news/home/20240925419323/en · https://www.streetinsider.com/PRNewswire/Venn+Network+launches+web3s+only+decentralized+security+network/23425455.html
- CUBE3 : https://docs.cube3.ai/protect-products/rasp/rasp-integration
- ERC-7265 : https://ethereum-magicians.org/t/eip-7265-circuit-breaker-standard/14909 · https://governance.aave.com/t/grant-proposal-implementing-eip-7265-circuit-breakers-to-improve-protocol-security/14174
- Chainlink PoR : https://blog.chain.link/defi-circuit-breakers · https://chain.link/hack-26/projects/reservewatch
- SEAL Safe Harbor : https://frameworks.securityalliance.org/safe-harbor/overview · https://governance.aave.com/t/arfc-adopt-the-seal-safe-harbor-agreement/23059
- Honeypots : https://www.usenix.org/conference/usenixsecurity19/presentation/ferreira · https://arxiv.org/pdf/2309.13501
- Assurance : https://nexusmutual.io/defi-insurance · https://www.spark.money/tools/defi-insurance-protocol-comparison · https://coindesk.com/business/2024/04/03/bermuda-licensed-relm-insurance-unveils-suite-of-crypto-risk-products/

**Avalanche**
- Build Games : https://build.avax.network/build-games · récap Team1 : https://www.team1.blog/p/avalanche-february-2026-recap · Team1 Hacks Chennai : https://build.avax.network/hackathons/3a83347a-5b3d-4f87-8c92-6b97e0e0acfb
- Retro9000 : https://www.avax.network/about/blog/the-avalanche-foundation-announces-fourth-cohort-for-retro9000-l1-and
- Bounty Immunefi : https://immunefi.com/bug-bounty/avalanche/information/
- Incident delegatecall : https://docs.avax.network/blog/delegatecall-incident · ICM/Validator Manager : https://docs.avax.network/academy/avalanche-l1/permissioned-l1s/01-introduction/03-interop
- Securitize/Avalanche : https://docs.avax.network/integrations/securitize
- Documents internes : `research/tracks/T1_P4_defi_dora.md`, `research/docs/D1_avalanche.md`, `research/02_track1_finance.md`, `research/vaccin/V_DECISION.md`, `context/avalanche_fuji_mail.md`.

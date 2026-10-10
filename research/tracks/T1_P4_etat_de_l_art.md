# Sentinelle Fuji : état de l'art 2026, « on reprend ce qui existe, puis on innove »

> Recherche du 2026-10-10. Complète `research/tracks/T1_P4_defi_dora_v2.md` (concurrents déjà cartographiés : je ne les répète pas) et `docs/architecture.md`. Le règlement (`context/notion_guide.md`) prime.
> Légende : **[P]** primaire, lu sur la page éditeur / dépôt / texte officiel · **[S]** secondaire (presse, agrégateur, billet) · **[V]** vérifié par lecture directe aujourd'hui (peut se combiner : [P][V]) · **[ÀV]** à vérifier avant slide. Une absence dans mes recherches n'est pas une preuve d'absence.
> Contrainte : tout ce qui suit est de la recherche. Le code se code entre sam. 11h30 et dim. 12h. Les bibliothèques et API existantes sont autorisées.

---

## 0. TL;DR (5 lignes)

1. **Verdict : la chaîne complète « incident on-chain → classification DORA → déclaration ITS 2025/302 avec preuve par champ » n'a été trouvée nulle part** (ni hackathon, ni produit, ni papier). Confiance : **moyenne-haute (~80 %)**, fondée sur ~25 recherches web + lecture de pages éditeur ; angle mort : projets non indexés (DoraHacks, ETHGlobal, dépôts GitHub privés) et pages DORA de Regnology, Wolters Kluwer, OneTrust non lues.
2. **Les briques isolées existent toutes** : pause auto déclenchée par détection (Hypernative, OZ Monitor, ≥ 6 projets Chainlink 2026), classification DORA automatique dans un GRC (ServiceNow DRIR, mais pas d'entrée on-chain et rapport initial à 24 h), ancrage Merkle (patron connu). **Personne ne les relie.**
3. **Le « pause + garde-fou + mint stop sur réserve » est banal** (Chainlink Convergence, 6 avr. 2026 : ReserveWatch, Safeguard Engine, AEGIS, AutoVault, SentinelCRE…). Aucun n'a de volet DORA/rapport régulateur [V]. À ne pas vendre comme innovation.
4. **Le vrai différentiateur à défendre** : (a) règles de classification **versionnées et rejouables** (RTS 2024/1772) ; (b) **preuve par champ** vers tx/bloc ; (c) la **pause qui fait évoluer la classification** (indisponibilité > 2 h) ; (d) **notification volontaire art. 10 pour les menaces bloquées** ; (e) conformité aux **instructions opérationnelles ESAs du 16/09/2026** (nous les avons lues, voir §5).
5. **À reprendre sans réécrire** : OpenZeppelin Monitor (AGPL-3.0, Rust) en ingestion/alertes ou notre propre ethers ; ERC-7265 (CC0) comme modèle de rate-limit ; patron Hypernative « seuils séparés alerte / pause, rôle pause limité » ; règles de champs ESAs ; ancrage Merkle simple. Defender est fermé depuis le 1er juil. 2026.

---

## 1. Projets de hackathon proches

Méthode : recherches web par thème + lecture des pages projet. Les plateformes DoraHacks, Devpost et ETHGlobal sont mal indexées : l'absence de résultat y est faible. Chainlink publie ses projets sur une galerie lisible, d'où la sur-représentation.

### 1.1 Tableau

| Projet | Hackathon, date | Ce qu'il fait | Repo / démo | Prix | À réutiliser | Ce qui manquait |
|---|---|---|---|---|---|---|
| **SentinelCRE** | Chainlink Convergence, résultats 6 avr. 2026 | Page projet : agent qui vérifie chaque action d'**agent IA** en 3 couches (conformité on-chain, score comportemental, consensus Claude+GPT-4 en TEE), verdict inscrit on-chain. Le blog des gagnants le décrit comme « agent DeFi autonome qui protège les protocoles, circuit breakers et pauses de retrait » | https://github.com/ProjectWaja/SentinelCRE (MIT, 90 tests Foundry) · https://youtu.be/YAdYsDABZ78 | **1er CRE & AI** [P][V] https://chain.link/blog/convergence-hackathon-winners | Structure « limites de valeur, whitelist, plafond de mint, rate limit » en contrat ; tests Foundry | Aucune sortie régulateur ; vise les agents IA ; pas de preuve rejouable |
| **AEGIS** (3 sentinelles IA) | Convergence, piste Risk & Compliance | 3 sentinelles (liquidité, oracle, gouvernance) ; 2 sur 3 en HIGH/CRITICAL → circuit breaker pause + rapport forensique ; rejeu de Euler dans le frontend | https://github.com/ishitab02/Aegis (MIT) · https://youtu.be/wCSaIewEkpo | Non indiqué | Idée du **rejeu d'un hack réel** dans l'UI ; vote 2/3 | Testnet Base Sepolia ; décision par IA (non déterministe, non rejouable) ; zéro DORA |
| **ReserveWatch** | Convergence (Risk & Compliance, DeFi & Tokenization) | Compare réserves et supply toutes les 60 s, pause du mint sous seuil, console opérateur, historique d'attestations | https://github.com/Sektorial12/ReserveWatch (MIT) · https://youtu.be/LBGldf12XMU | Non indiqué | Patron « attestation signée + circuit breaker » | README ne décrit aucun reporting réglementaire malgré l'étiquette « Compliance » [V] |
| **Autonomous DeFi Protocol Safeguard Engine** | Convergence | Surveille USDC (60 s), gèle le protocole si couverture < 100,5 % | https://github.com/subikshanrajs/defi-safeguard-engine · https://youtu.be/MTmZilRSdjk | Non indiqué | Rien de neuf | Un seul déclencheur, pas de palier, pas de reprise |
| **AutoVault** | Convergence (CRE & AI, Risk & Compliance, Tenderly) | Workflow CRE + Claude : retrait vers wallet sûr si seuils déterministes ET confiance IA élevés | https://github.com/Osiyomeoh/autovault · https://www.youtube.com/watch?v=HVmZbylck64 | Non indiqué | Double clé « seuil déterministe ET IA » (utile pour nos paliers) | Pas de traçabilité externe |
| **SentinelDAO** | Convergence | Pause d'urgence multi-chaînes simultanée (Sepolia, Arbitrum, Base) | https://chain.link/hack-26/projects/sentineldao [S] | Non indiqué | Idée de pause coordonnée | Aucune lecture approfondie de ma part ([ÀV]) |
| **Aegis-Gate** / **Aegis Protocol V5** / **ACE Sandbox** | Convergence, piste Risk & Compliance | Aegis-Gate : preuve KYC/AML sans exposer la donnée (attestation oui/non, TEE). Protocol V5 : pare-feu d'exécution pour agents IA. ACE Sandbox : actifs tokenisés ERC-3643 conformes | https://chain.link/blog/convergence-hackathon-winners | **1er / 2e Risk & Compliance** (la page « winners » et le blog se contredisent sur l'ordre) [S] | Patron « attestation on-chain compacte, pas de donnée perso » | **Conformité = accès/KYC, jamais déclaration d'incident** : « aucun projet ne décrit un reporting régulateur » (lu dans le blog) [V] |
| **Proto Secure** | ETHGlobal Bangkok (date absente de la page, **[ÀV]**) | Plateforme de monitoring qui met en pause (OZ Pausable) quand des conditions sont remplies, >10 chaînes, logs via Curvegrid, notes chiffrées Nillion | https://github.com/Shreyash2704/Protocol-Secure-FE · https://protocol-secure-fe.vercel.app/listProtocol | Blockscout (Big Pool), Arbitrum (Commendable Attempts) [P][V] https://ethglobal.com/showcase/proto-secure-m93xd | Rien de technique ; confirme que le patron « monitor → pause » est un classique de hackathon | Pas de réponse graduée, pas de réglementaire |
| **Doxreporter** | HackerNoon Proof of Usefulness | Appli de signalement d'incident cyber avec backend blockchain (stockage infalsifiable), score de jury 26,48 | https://www.g2.com/discussions/what-makes-immutable-blockchain-records-the-future-of-cyber-incident-reporting [S, texte promotionnel] | Score seulement | Rien (pas de DORA, pas de on-chain→rapport) | Voisin conceptuel : « rapport d'incident infalsifiable », mais sans classification ni source on-chain |
| **CSSF DLT Financial Reporting System** (vDL Digital Ventures) | Infrachain Tezos Challenge, Luxembourg, nov. 2023 | Reporting réglementaire financier via DLT | https://chronicle.lu/category/awards/47658-vdl-digital-ventures-wins-infrachain-tezos-challenge [S] | **Vainqueur** | Précédent « reporting régulateur sur DLT » (hors incident, hors DORA) | Reporting financier périodique, pas incident |
| **Concours AFM / Dutch Blockchain Week** (GhostKYC, Legal Ledger Legends) | Amsterdam, 2025 | Agents de conformité IA (KYC, juridique), reporting réglementaire automatisé | https://ase.uva.nl/content/news/2025/06/successful-hackathon-event-during-dutch-blockchain-week.html [S] | 2 équipes gagnantes | Aucun | Pas d'incident DORA |

Autres résultats : **Chainlink Convergence** a reçu **554 soumissions CRE**, plus de 3 000 participants [S] https://blockchain.news/news/chainlink-convergence-hackathon-winners-cre-enterprise. Le patron « détecteur + pause » est donc **saturé** en hackathon.

### 1.2 Ce que je n'ai PAS trouvé (à dire honnêtement)

- **Aucun projet DORA incident reporting** sur Devpost, DoraHacks, ETHGlobal, Encode (hackathon Arc x Encode, 27 fév. – 1er mars 2026, sans piste sécurité visible) [S] https://community.arc.io/home/events/arc-x-encode-enterprise-and-defi-hackathon-vcm38l2yye.
- **Aucun hackathon BIS Innovation Hub / FCA TechSprint / ESMA / EBA / Banque de France / KPMG** dédié à l'incident reporting trouvé. Le régime UK équivalent (FCA PS26/2, 18 mars 2026, entrée en vigueur 18 mars 2027) existe mais sans TechSprint associé [S] https://www.regulationtomorrow.com/2026/03/fca-pra-and-boe-issue-policy-statements-on-operational-resilience/.
- **Build Games Avalanche 2026** : lancé le 20 janvier 2026, 1 M$ de dotation, sans pistes thématiques ; **aucune liste de gagnants** ni thème sécurité trouvés [S] https://avax.network/about/blog/avalanche-launches-1m-competition-build-games. **Team1 Hacks Chennai** (août 2025) : 3 000 $, rien sur la sécurité dans la fiche [S] https://build.avax.network/hackathons/3a83347a-5b3d-4f87-8c92-6b97e0e0acfb.
- **Chainlink Constellation** = 2023 (gagnant Unwallet.me) ; les hackathons 2026 sont « Convergence » (résultats 6 avr. 2026) [P][V]. **Colosseum Frontier 2026** (6 avr. – 11 mai) : 26 gagnants dont je n'ai pas lu la liste ; aucun projet de monitoring repéré [S] https://www.kucoin.com/news/flash/solana-frontier-hackathon-announces-26-winning-projects.
- **Gitcoin** : seul résultat, DefiHackLabs (PoC d'incidents, base de rejeu) [S].

**Lecture** : les jurys ont déjà vu des dizaines de « détecteur → pause ». Aucun dossier ne montre ce qui se passe **après** la pause côté régulateur. Notre différenciateur est là, pas dans la détection pure.

---

## 2. Produits et open source 2026

### 2.1 Détection et réponse

| Produit | Statut 2026 (lu) | Réutilisable par nous |
|---|---|---|
| **OpenZeppelin Monitor / Relayer** | **Defender arrêté le 1er juil. 2026**, inscriptions fermées depuis le 30 juin 2025 [P][V] https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender. Monitor : Rust, **AGPL-3.0**, EVM + Stellar + Solana, filtres, cron, reprise sur checkpoint, retry des blocs manqués, notifications Slack/Discord/email/Telegram/webhook/scripts, 144 étoiles [P][V] https://github.com/OpenZeppelin/openzeppelin-monitor | **Oui comme référence ou service d'ingestion** (webhook vers notre moteur). **Attention AGPL** : si on l'embarque modifié, il faut publier. Pour 36 h, ethers v6 maison est plus simple ; citer Monitor comme alternative de production. Le guide « Pause Guardian » (Sentinel → Autotask → Relayer) de Defender décrit exactement notre L3 [S] https://docs.openzeppelin.com/defender/v1/guide-pauseguardian |
| **Hypernative** | Pause automatique avec **seuils séparés alerte/pause**, « Transaction Guard » avec journal d'approbation/refus, simulation, attribution de signaux. Page institutions : « exportable audit trails », « per-jurisdiction policies », **cite MiCA, pas DORA** [P][V] https://hypernative.io/industry/financial-institutions. Billet du 9 juin 2026 « DORA doesn't ask whether you had an incident, it asks whether you knew in time » : argumentaire, **aucune classification ni gabarit de rapport** [P][V] https://www.hypernative.io/blog/dora-doesnt-ask-whether-you-had-a-security-incident-it-asks-whether-you-knew-in-time. Cas Shift DeFi (juil. 2026) : le déclencheur automatique est limité aux catégories les plus sévères [S] https://www.hypernative.io/insights/blog/shift-defi-adopts-hypernative-to-protect-capital-deployed-across-defi | **Patron de conception** (rôle de pause limité, déclenchement auto réservé aux cas sévères, preuve de décision). Ne pas l'intégrer : API payante [ÀV]. **Ma recherche n'a pas retrouvé Avalanche** dans les pages 2026 lues (la v2 l'avait lu sur le cas Parallel : [ÀV] à ré-ouvrir) |
| **Chainalysis Hexagate** | **Gratuit pour les builders Avalanche** : surveillance ML + **5 moniteurs personnalisés**, alertes Slack/Telegram/email ; **pas d'« Alerts API »** retrouvée [P][V] https://www.chainalysis.com/blog/hexagate-by-chainalysis-now-live-on-avalanche/. Incident de qualité de données en juin 2026 (alertes erronées par prix de jeton) [S] https://isdown.app/status/chainalysis/incidents/610941-hexagate-alerts-issues | Source d'alertes **en entrée** possible (webhook) ; à citer comme complément, pas concurrent |
| **Forta (Firewall, Attack Detector)** | Firewall lancé nov. 2024 ; Attack Detector 2.0 (BlockSec+Nethermind, nov. 2023, 399 $/mois en 2023). **Aucune annonce 2026 trouvée**, jeton FORT -76,8 % sur un an (avr. 2026, source Gate) [S] https://forta.org/blog/forta-firewall-is-live-ushering-in-a-new-era-of-onchain-security-and-compliance | Réseau d'alerte public à surveiller ; statut commercial incertain : **[ÀV]**, ne pas dépendre |
| **Venn / Ironblocks** | Dernier contenu daté trouvé : 2024 (Glue, EigenLayer) ; **rien en 2026** [S] https://www.businesswire.com/news/home/20240925419323/en | Aucun : statut inconnu |
| **Tenderly Alerts / Web3 Actions** | Alertes sur événements, Web3 Actions = fonctions TS sur leur infra, **fonction payante activée par les ventes** [P][V] https://docs.tenderly.co/monitoring/web3-actions/introduction | **Tenderly Virtual TestNet / Simulation** est utilisé par SentinelCRE (piste Tenderly du hackathon) [P] ; utile pour tester, pas pour la prod |
| **CUBE3, Range, Sentio, Guardrail, Phalanx** | **Aucune page 2026 retrouvée** [ÀV]. « Phalanx » = peut-être Phalcon (BlockSec) : « > 20 attaques bloquées, > 14 M$ sauvés » (chiffres via Cobo, [S]) https://www.cobo.com/post/lp-withdraw-funds-before-protocol-pauses | Rien à reprendre ; ne pas les citer comme actifs sans vérification |
| **ERC-7265 (circuit breaker)** | eips.ethereum.org renvoie 404 ; fil Magicians : **dernier message le 24 oct. 2023**, PR EIPs mentionnée, **statut non confirmé** (donc probablement stagnant, [ÀV]) ; implémentation de référence **CC0** « DeFi-Circuit-Breaker/v1-core », 28 étoiles, 109 commits [P][V] https://ethereum-magicians.org/t/eip-7265-circuit-breaker-standard/14909 · https://github.com/DeFi-Circuit-Breaker/v1-core | **Oui** : modèle de plafond de sortie par fenêtre (notre L2), licence libre. Dire « proposition de 2023, jamais finalisée à ma connaissance », ne pas dire « standard » |
| **SEAL 911 / Safe Harbor** | « 68 Md$ + protégés, 20+ protocoles » (auto-déclaré) ; rescue autorisé seulement pendant exploit actif, restitution sous 72 h à l'adresse de récupération ; **sans protection pénale hors accord** [P] https://frameworks.securityalliance.org/safe-harbor/overview · https://frameworks.securityalliance.org/safe-harbor/self-adoption-guide. SEAL 911 = canal Telegram d'environ 40 whitehats (chiffre de 2024) [S] | Format de contact/dossier à produire ; jamais d'action contre un système réel |
| **Chainalysis/TRM/Elliptic** | Traçage et gels ; T3 FCU > 450 M$ gelés (v2) | API payantes : **simuler** le traçage sur nos adresses synthétiques (règle du guide) |

### 2.2 Côté DORA

| Outil | Ce qu'il fait (lu) | Réutilisable |
|---|---|---|
| **ServiceNow DRIR** (Digital Regulatory & Incident Reporting) | **Classification auto** : « malicious unauthorized access → major » ; incident hors services critiques → non majeur ; **rapport initial généré « no later than 24 hours » après classification**, intermédiaire tous les 72 h, final à 1 mois ; format de sortie non précisé ; **aucune entrée on-chain** [P][V] https://www.servicenow.com/docs/r/Z61H6JNUJXKe8NNPQzK7MQ/0aNomnluaUVHloO2rB49Dg | Confirme notre logique de règles ; **le délai de 24 h affiché est au-dessus du 4 h du RTS 2025/301** (à discuter avec KPMG : l'horloge de 4 h court depuis la classification, au plus tard 24 h après prise de connaissance, v2) : argument « nous mesurons l'horloge » |
| **KPMG × ServiceNow DORA** (livre blanc oct. 2024) | Cadre de conformité DORA | Le jury KPMG connaît ce couple ; se positionner « en amont de ServiceNow : nous produisons l'événement prouvé que le GRC ingère » https://assets.kpmg.com/content/dam/kpmgsites/xx/pdf/2024/10/kpmg-servicenow-dora-compliance.pdf [S] |
| **D3 Security Morpheus** | Alerte → rapport en ~40 min contre 75-135 min manuel (**chiffre vendeur**) [S] https://d3security.com/resources/dora-compliance-on-autopilot/ | Point de comparaison de métrique « minutes alerte → brouillon » ; nous devons mesurer le nôtre |
| **Darktrace, Unique, ISMS Copilot** | MDR « regulator-ready », agent contrats prestataires, IA d'aide au reporting [S] | Aucun lien on-chain |
| **ArkForge MCP DORA (MIT)** | Serveur MCP couvrant registre art. 31 et modèle d'incident art. 17-18 [S, v2] ; ma tentative de relecture a échoué (ECONNRESET) : **[ÀV]** | À regarder pour le schéma de champs, sans dépendance |
| **Formalize RoI validator** | Valideur gratuit de **117 contrôles** sur ZIP xBRL-CSV du registre ; affirme que le valideur EBA n'est plus maintenu (**affirmation vendeur**) [S] https://formalize.com/en/roi-validator | Hors périmètre (registre, pas incident), utile pour une feuille de route |
| **Outils open source RoI** | **Aucun dépôt GitHub open source** trouvé (xBRL-CSV, taxonomie EBA). Arelle (XBRL libre) : support xBRL-CSV **non confirmé pour le DORA** [ÀV] ; l'AFM précise qu'un convertisseur doit produire du xBRL-CSV et non de l'iXBRL [S] | On ne produit pas de xBRL ; on le dit |
| **AFM / DNB** | 1er exercice RoI : 40 % des registres acceptés par l'EBA, **94 %** en 2026 [S] https://www.afm.nl/~/profmedia/files/publicaties/2026/dora-update-7-en.pdf ; dry run 2024 : 6,5 % passent les 116 contrôles [S] | Chiffres de contexte « la qualité des déclarations est le problème » |

### 2.3 Règles officielles utilisables : instructions opérationnelles ESAs du 16/09/2026 [P][V] (PDF lu en entier, 5 pages)

URL : https://www.esma.europa.eu/sites/default/files/2026-09/DORA_Incident_reporting_-_Operational_instructions.pdf

Points directement codables (chaque ligne = une règle de notre validateur) :
1. **Format de dépôt = canaux, gabarits et format fixés au niveau national** ; les autorités notifient ensuite les ESAs avec les gabarits anglais prédéfinis. → on produit un JSON canonique et on **n'envoie rien** (cohérent avec architecture §12).
2. **Champs monétaires = milliers d'unités** : champs **3.11, 4.13 et 4.14** (et non 4.12) ; « EUR 2 500 se déclare 3 ou 2,5 » ; même devise que le champ 1.15. **Correction pour `architecture.md`** : le 4.12 est le seuil « impact économique », texte libre, obligatoire au rapport final si « impact économique » est coché au 2.5 ; ne pas le traiter comme monétaire.
3. **Champs texte libre** : ne rien écrire si non applicable (pas de « n/a », « rien »).
4. **Rapport final** : au plus 1 mois après le dernier rapport intermédiaire ; il faut au moins **un rapport intermédiaire par mois** tant que le final n'est pas déposé.
5. **Correction = nouvelle version du dernier rapport**, contenant toutes les informations de la dernière mise à jour.
6. **1.3a/1.3b et 2.1 inchangés** de la notification initiale au rapport final (sinon double comptage).
7. **2.5** : « services critiques affectés » doit **toujours** figurer parmi les critères (art. 8(1) RTS 2024/1772).
8. **2.6** : ne **pas** inclure le pays de l'entité (étalement géographique = autres États membres).
9. **2.8** : format `NOM LÉGAL;CODE LEI|EUID;TYPE DE CODE;info`, séparé par « ; », vide si l'incident ne vient pas d'un tiers. **Correction mineure** : l'ordre officiel est nom, code, **type de code (LEI ou EUID)**, info complémentaire. Notre note « `NOM;CODE;LEI|EUID;info` » est cohérente.
10. **3.17** (durée/indisponibilité réelle ou estimée) : à remplir pour les rapports **intermédiaire et final**, pas seulement si le critère durée est coché.
11. **3.25** : libellé contradictoire dans l'ITS ; prendre « exfiltration et manipulation de données, **hors** usurpation d'identité » (option distincte pour l'usurpation).
12. **4.10 / 4.11** : à remplir seulement si le risque pour fonctions critiques / résolvabilité est établi, sinon vide.

C'est un jeu de **~12 règles de qualité** que ni ServiceNow ni les outils lus n'affichent ; elles correspondent exactement aux « erreurs de complétude » dont parle l'ACPR (v2 §1.3). Idée d'innovation : un **linter de déclaration** qui refuse un brouillon violant ces règles, avec test unitaire par règle.

---

## 3. Papiers académiques 2025-2026 utiles

| Papier | Apport | Chiffres (lus dans un extrait, [S]) | Usage chez nous |
|---|---|---|---|
| **Skyeye** (ASE 2024) | Détection d'**un contrat adverse dès son déploiement**, appariement avec les contrats victimes, LLM pour qualifier la vulnérabilité | 174 contrats adverses, 159 incidents, ~1,36 Md$ ; meilleur que BlockWatchdog et Slither https://conf.researchr.org/details/ase-2024/ase-2024-research/126/Skyeye-Detecting-Imminent-Attacks-via-Analyzing-Adversarial-Smart-Contracts | Justifie le déclencheur « nouveau contrat appelant le vault » (L1/L3) ; ne pas coder Skyeye |
| **BlockWatchdog** (ICSE 2024, arXiv 2403.19112) | Détection de contrats attaquants (réentrance) sur bytecode | 421 889 bytecodes, 113 contrats attaquants, ~908,6 M$ ; ~17,66 s en moyenne avant la transaction d'attaque dans un cas https://arxiv.org/pdf/2403.19112 | Même usage ; bytecode scan léger |
| **LookAhead** (arXiv 2401.07261) | Détection de contrats adverses avant l'attaque | F1 0,8966, FPR 0,16 % https://arxiv.org/html/2401.07261v6 | Comparatif de FP à citer |
| **ML on-chain contre les attaques DeFi** (arXiv 2510.16024, AFT 2025) | Modèles compressés **exécutés dans le contrat** (gaz 57 603 à 506 397) ; couvre relais privés et attaques même bloc | > 97 % de précision de détection, F1 82,0 % https://arxiv.org/html/2510.16024v1 | Idée « garde-fou in-contract » pour le régime une-transaction ; trop lourd pour 36 h, mais cite l'état de l'art |
| **HOUSTON** (NDSS) | Anomalies d'exécution en temps réel sans signature de vulnérabilité | 22 M tx, 115 incidents (année à vérifier) https://www.ndss-symposium.org/?p=23786 | Référence de protocole d'évaluation (FP sur trafic normal) |
| **DeFiTail** (arXiv 2511.00408) | Détection d'exploit inter-contrats par apprentissage | 98,39 % (contrôle d'accès), 97,43 % (flash loan) https://arxiv.org/abs/2511.00408v1 | Statique, pas notre cas |
| **GenDetect** (arXiv 2604.26094, avr. 2026) | > 69 % des attaques DeFi ressemblent à un incident antérieur | https://www.emergentmind.com/papers/2604.26094 | Justifie le **rejeu de scénarios** (banc d'essai) |
| **DeFiScope** (arXiv 2502.11521) | Détection de manipulation de prix par LLM | Rappel 80 %, précision 96 %, **0 fausse alerte sur transactions bénignes** https://arxiv.org/pdf/2502.11521v2 | Comparatif pour le scénario Tectonic |
| **CyberChainBench** (arXiv 2606.26216, juin 2026) | 541 incidents DeFiHackLabs sur 9 chaînes EVM, agents IA ; contamination d'entraînement reconnue par les auteurs | https://arxiv.org/pdf/2606.26216 | Base possible de scénarios et avertissement « modèles ayant vu les hacks » |
| **TxRay** (arXiv 2602.01317) | **Post-mortem** : cause racine en 40 min, PoC en 59 min (médiane) | https://arxiv.org/pdf/2602.01317v5 | Contraste : après coup, pas temps réel |

**Papier sur l'incident → rapport réglementaire** : **aucun** trouvé. Un Internet-Draft IETF (RBIP) propose horodatage blockchain + DOI pour preuves bancaires et cite DORA, mais c'est un brouillon individuel, pas un standard [S] https://datatracker.ietf.org/doc/draft-reilly-banking-integrity/01/. **Aucune orientation ESA/EBA/autorité** n'exige un ancrage blockchain ; DORA est neutre technologiquement. Un horodatage eIDAS qualifié peut peser plus qu'un ancrage public : notre ancrage est un **contrôle d'intégrité optionnel**, à présenter ainsi [S].

---

## 4. Verdict

**Question : quelqu'un a-t-il déjà fait « incident on-chain → déclaration DORA prouvée » ?**

**Non, rien d'équivalent trouvé. Confiance : moyenne-haute (~80 %).** Voici la matrice de preuves :

| Maillon de la chaîne | Existe ? | Qui | Lien avec le suivant ? |
|---|---|---|---|
| Détection + pause on-chain | Oui, banalisé | Hypernative, OZ Monitor, ≥ 6 projets Chainlink 2026 | Non : s'arrête à la pause |
| Classification DORA automatique | Oui, dans un GRC | ServiceNow DRIR, D3 Morpheus, Darktrace | Entrée = incident ITSM, pas d'événement on-chain, rapport initial à 24 h (ServiceNow) |
| Brouillon ITS 2025/302 | Oui (modèles, MCP) | ArkForge, éditeurs GRC | Saisie manuelle |
| Preuve par champ vers tx/bloc | **Non trouvé** | : | : |
| Pause qui modifie la classification (indisponibilité > 2 h) | **Non trouvé** | : | : |
| Notification volontaire art. 10 pour menace bloquée | **Non trouvé** en produit | : | : |
| Linter des règles de qualité ESAs du 16/09/2026 | **Non trouvé** | : | : |
| Ancrage Merkle d'un dossier d'incident | Patron connu (OpenTimestamps, Merkleized audit trails, etc.) | Vendeurs et bibliothèques | Pas relié à DORA |

**Voisins les plus proches (à citer en Q&R pour montrer qu'on a regardé)** : Hypernative (billet DORA du 9 juin 2026 + « exportable audit trails », **mais sans classification ni gabarit**), ServiceNow DRIR (classification, mais ITSM), Doxreporter (rapport infalsifiable, mais sans DORA), Aegis-Gate/ACE Sandbox (« Risk & Compliance » = KYC/accès, pas incident).

**Risques sur ce verdict**
- Pages DORA de Regnology, Wolters Kluwer, OneTrust, Archer, Corlytics non rouvertes ce jour : un module « incident DORA » avec connecteur blockchain pourrait exister en bêta fermée **[ÀV]**.
- DoraHacks / Devpost / ETHGlobal : moteurs de recherche peu fiables, un projet obscur peut exister.
- Chainalysis ou Hypernative peuvent ajouter un export DORA à tout moment : **notre avantage est la rigueur (règles rejouables), pas l'exclusivité**.

**Formulation recommandée pour le pitch** : « À notre connaissance, aucun outil ne relie un événement on-chain horodaté à chaque champ de la déclaration DORA. Nous avons cherché dans les produits (Hypernative, Hexagate, ServiceNow), les hackathons et la littérature. » Pas de « premier au monde ».

---

## 5. Reprendre, puis innover : plan par brique, avec mapping

Mapping NIST CSF 2.0 (IDs de sous-catégories à contrôler sur le référentiel officiel) · OWASP Agentic (ASIxx) · ATLAS · ATT&CK · D3FEND (IDs **[ÀV]**, issus de ma connaissance, non revérifiés ce jour).

| # | On reprend (existant) | On innove (au-delà) | NIST CSF 2.0 | ASI / ATLAS | ATT&CK | D3FEND [ÀV] |
|---|---|---|---|---|---|---|
| 1 | **Patron Hypernative / OZ Pause Guardian** : rôle de pause limité, seuils alerte ≠ pause, déclenchement auto réservé aux cas sévères | Échelle L0-L3 **signée par la direction** (DORA art. 5), expiration auto codée en dur, reprise 2/3 ; chaque palier lié à son **effet DORA** | DE.CM-01, DE.AE-02, RS.MA-01, RS.MI-01, RC.RP-01 | ASI03 (privilèges : rôle limité à la pause) | T1657, T1078, T1098 | D3-EI Execution Isolation, D3-NI Network Isolation |
| 2 | **ERC-7265 (CC0)** : plafond de sortie par fenêtre | Plafond **lié au score** (L2) + invariant « sortie ≤ réserve, prix borné » dans le contrat (régime une-transaction, Tectonic) | DE.AE-04, PR.PS-01, RS.MI-02 | n/a | T1657, T1190 | D3-OTF Outbound Traffic Filtering |
| 3 | **Skyeye / BlockWatchdog / LookAhead** (idée) : alerte au déploiement d'un contrat qui appelle le vault | Déclencheur déterministe simple (sélecteur ou adresse du vault dans le bytecode d'un nouveau contrat) + **leurre HoneyVault** (v2 §S1) à FP = 0 mesuré | DE.CM-01, DE.AE-02 | AML.T0051 hors sujet (pas d'IA ciblée) | T1587.004, T1190 | D3-DO Decoy Object, D3-DE Decoy Environment |
| 4 | **ServiceNow DRIR** (logique : services critiques + accès malveillant ou ≥ 2 seuils) + règles RTS 2024/1772 art. 6, 8, 9, 10 | Moteur de règles **versionné, rejouable**, avec **horloge 4 h mesurée**, art. 10 pour menace bloquée, **la pause (> 2 h) change la classe** | RS.MA-02, RS.MA-03, RS.AN-03, RS.CO-02, GV.OC-03 | ASI09 (confiance homme-agent), ASI08 si LLM rédige | : (lie le champ 3.25 aux techniques) | n/a |
| 5 | **Instructions opérationnelles ESAs 16/09/2026** (§2.3) | **Linter de déclaration** : 12 règles testées (2.5, 2.6, 2.8, 3.11/4.13/4.14 en milliers, 3.17, 3.25…), refus de brouillon non conforme | RS.CO-02, RS.CO-03, GV.OC-03 | n/a | n/a | n/a |
| 6 | **Patron ancrage Merkle** (OpenTimestamps, journaux Merkleisés) | Racine par incident sur Fuji ; chaque champ DORA = feuille avec lien tx ; **mode auditeur : rejeu → même hash** | PR.DS-10, DE.AE-03, GV.OV | ASI09 | T1070 (contre l'effacement de traces) | D3-FH File Hash / Platform audit (ID [ÀV]) |
| 7 | **AEGIS** (rejeu de Euler dans l'UI), **GenDetect** (69 % de copies), **DefiHackLabs** | **Banc d'essai rejouable sur fork** : 3 attaques 2026 recodées sur nos contrats, métriques publiées (MTTD blocs/s, FP/10 000 tx, fonds sauvés %), mêmes chiffres chez l'auditeur | ID.IM-02, DE.AE-02, GV.OV | n/a | T1657, T1190 | n/a (évaluation) |
| 8 | **ArkForge / Archer / Formalize** (registre, saisie manuelle) | Registre de tiers **lu on-chain** (rôles, oracle, vérificateur à 1 seul signataire, RPC) → ligne de registre + champ 2.8 | GV.SC-04, GV.SC-07, ID.AM-02, DE.CM-06 | ASI04 (chaîne d'approvisionnement) | T1195, T1199, T1078 | D3-AI Asset Inventory |
| 9 | **SEAL Safe Harbor / T3 FCU** (format de contact) | **Dossier de gel** (adresses, tx, montants, preuve ancrée) généré en secondes, envoi humain | RS.CO-02, RS.CO-03, RS.AN-07 | n/a | T1657 | n/a |

Les IDs ATT&CK (T1657 vol financier, T1078 comptes valides, T1190 exploitation d'application exposée, T1098 manipulation de compte, T1195, T1199, T1587.004, T1070) sont issus de la v2 ou de mon savoir : **[ÀV]** sur attack.mitre.org avant le rapport. Règle du guide : au moins un référentiel parmi ASI / ATLAS / ATT&CK / D3FEND par fonctionnalité : ATT&CK suffit ici.

---

## 6. Corrections et alertes pour `docs/architecture.md`

1. **Champs monétaires** : 3.11, 4.13, 4.14 en **milliers** (pas le 4.12, qui est un texte de seuils économiques) [P][V].
2. **Champ 2.5** doit toujours inclure « services critiques affectés » ; **2.6** exclut le pays de l'entité [P][V].
3. **Format de dépôt** : fixé **au niveau national** ; la phrase « xBRL-CSV hors périmètre PoC » est à nuancer : le xBRL-CSV concerne le **registre d'informations** (ITS 2024/2956) ; pour l'incident, le canal et le format sont **nationaux** (ESAs, 16/09/2026). Ne pas affirmer que l'incident se dépose en xBRL-CSV [P][V].
4. **Positionnement** : « Sentinelle Fuji détecte » est banal (cf. §1). Mettre le pitch sur **la preuve et la déclaration**.
5. **Bonne pratique ESAs** : un linter des règles de qualité est une **fonctionnalité de conformité vérifiable** (15 % de la note) à mettre dans la démo.
6. **Dire que la pause est la première décision DORA** : critère d'indisponibilité à 2 h, intégré au moteur.

## 7. Reste à vérifier

1. Pages DORA de Regnology, Wolters Kluwer, OneTrust, Archer, Corlytics (non lues).
2. Support Avalanche de Hypernative en 2026 (non retrouvé ce jour, présent dans la v2).
3. Statut de l'ERC-7265 (EIP 404, dernier message en 2023).
4. Date et prix de Proto Secure (ETHGlobal Bangkok).
5. Listes de gagnants Build Games et Colosseum Frontier 2026.
6. Arelle et xBRL-CSV pour le DORA (hors périmètre PoC).
7. IDs D3FEND, ATLAS, ATT&CK cités.
8. Page projet SentinelCRE : la page décrit un moniteur d'**agents IA**, le blog des gagnants un agent DeFi qui « pause et déclenche des circuit breakers » ; les deux descriptions diffèrent, lire le dépôt avant de le citer.

## Sources principales (toutes consultées le 2026-10-10)

- Gagnants Convergence : https://chain.link/blog/convergence-hackathon-winners
- Projets Chainlink : https://chain.link/hack-26/projects/reservewatch · https://chain.link/hack-26/projects/autonomous-defi-protocol-safeguard-engine · https://chain.link/hack-26/projects/aegis-ai-enhanced-guardian-intelligence-system · https://chain.link/hack-26/projects/sentinelcre · https://chain.link/hack-26/projects/autovault
- Dépôts : https://github.com/ProjectWaja/SentinelCRE · https://github.com/ishitab02/Aegis · https://github.com/Sektorial12/ReserveWatch · https://github.com/DeFi-Circuit-Breaker/v1-core · https://github.com/OpenZeppelin/openzeppelin-monitor
- ETHGlobal : https://ethglobal.com/showcase/proto-secure-m93xd
- Hypernative : https://hypernative.io/industry/financial-institutions · https://www.hypernative.io/blog/dora-doesnt-ask-whether-you-had-a-security-incident-it-asks-whether-you-knew-in-time
- OpenZeppelin : https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender
- Hexagate : https://www.chainalysis.com/blog/hexagate-by-chainalysis-now-live-on-avalanche/
- ESAs, instructions opérationnelles : https://www.esma.europa.eu/sites/default/files/2026-09/DORA_Incident_reporting_-_Operational_instructions.pdf
- ServiceNow DRIR : https://www.servicenow.com/docs/r/Z61H6JNUJXKe8NNPQzK7MQ/0aNomnluaUVHloO2rB49Dg
- SEAL : https://frameworks.securityalliance.org/safe-harbor/overview
- Papiers : https://arxiv.org/html/2510.16024v1 · https://arxiv.org/pdf/2403.19112 · https://conf.researchr.org/details/ase-2024/ase-2024-research/126/Skyeye-Detecting-Imminent-Attacks-via-Analyzing-Adversarial-Smart-Contracts · https://arxiv.org/html/2401.07261v6 · https://arxiv.org/pdf/2606.26216 · https://www.emergentmind.com/papers/2604.26094
- Ancrage : https://datatracker.ietf.org/doc/draft-reilly-banking-integrity/01/
- Autres : https://formalize.com/en/roi-validator · https://www.afm.nl/~/profmedia/files/publicaties/2026/dora-update-7-en.pdf · https://avax.network/about/blog/avalanche-launches-1m-competition-build-games

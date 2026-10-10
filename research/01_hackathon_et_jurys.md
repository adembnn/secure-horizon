# 01 — Hackathon "Secure Horizons" et jurys : intelligence

*Recherche du 2026-10-10. Niveau de confiance indiqué : [OFFICIEL] source primaire, [LINKEDIN] posts de participants/partenaires (non officiels), [INFÉRENCE] déduction de notre part.*

---

## 1. L'événement

| Élément | Information | Confiance |
|---|---|---|
| Nom | **Secure Horizons**, 2e édition du hackathon annuel | [LINKEDIN] |
| Dates / lieu | 10-11 octobre 2026, campus ESSEC Cergy, 36 h | [LINKEDIN] |
| Organisateurs | **KRYPTOSPHERE® ESSEC** (asso Web3/tech), **Utopia** (asso IA de l'ESSEC), **ESSEC Metalab** (institut IA, données et société) | [LINKEDIN] |
| Financement public | Aide de l'État gérée par l'**ANR dans le cadre de France 2030**, plus des fonds UE NextGenerationEU | [LINKEDIN] |
| Taille / prix | ~150 étudiants, **dotation de 15 000 €** | [LINKEDIN] |
| Partenaires cités | AWS, KPMG France, Bpifrance, Avalanche Team1, GitGuardian, Artefact, ESSEC Alumni | [LINKEDIN] |
| Inscription | Via Luma, sur validation, places limitées (page Luma non indexée, pas retrouvée) | [LINKEDIN] |
| Thème | "Compétition d'ingénierie et de cybersécurité à haute intensité", IA x cyber | [LINKEDIN] |
| Juge identifié | Thomas Lambert (Avalanche Team1), "Judge & Mentor" | [LINKEDIN] |

**Pas trouvé en ligne** : règlement, grille de notation, format exact du rendu, répartition des prix par track. **Action** : demander aux organisateurs dès le kick-off (grille, durée du pitch, démo live ou vidéo, repo obligatoire ou non, crédits AWS/Bedrock). AWS étant partenaire, des **crédits AWS (Bedrock probablement) sont plausibles** [INFÉRENCE] : en 2025, AWS faisait partie des partenaires et des outils ont été fournis (NVIDIA NeMo, tokens Mistral).

### Grille de jugement probable [INFÉRENCE]
Les éditions précédentes n'ont pas publié de grille. Les catégories de prix observées en 2025 (1er, 2e, 3e, prix innovation, coup de cœur du jury) et les pratiques Team1/KRYPTOSPHERE laissent attendre :
1. Pertinence du problème et impact (réel, chiffré)
2. Qualité technique et démo qui fonctionne
3. Innovation / originalité
4. Viabilité business et marché (jurés ESSEC/Bpifrance/KPMG)
5. Qualité du pitch

---

## 2. Éditions précédentes : ce qui a gagné

### Hackathon "LLM to Agentic AI", ESSEC, 4-5 avril 2025 (édition 1)
- Co-organisé par Utopia et Kryptosphère, avec le soutien de Metalab (France 2030). ~100 étudiants sélectionnés parmi plus de 200 candidats (40 écoles), 20 équipes, 36 h. Soirée de lancement chez Ledger.
- Tracks : **Cybersécurité**, Consumer, Finance & Industry. Thème : agents IA.
- Partenaires : Ledger, Mistral AI, Bpifrance, Kima Ventures, Google Cloud, Microsoft, NVIDIA (NeMo), AWS, France 2030. Prix : 10 000 € (cash, conférences, formations, tokens Mistral). Autre source (Télécom SudParis) : ~77 k€ levés, 22 k€ répartis entre le top 3.
- **Gagnant du track Cyber et meilleur projet toutes catégories : "Trustee"** (Anaïs Boughanem, TSE D3S). C'est une **extension Chrome anti-arnaque pour acheteurs en ligne** (eBay, Leboncoin) : elle analyse les annonces et les conversations acheteur-vendeur, attribue un **score de risque de fraude**, met en évidence les signaux d'alerte et suggère des réponses sûres. Stack : **RAG et raisonnement LLM**. Récompense : pitch devant de grands acteurs tech, dont une session chez Google.
- Une autre source (Télécom SudParis, HAKS 2025) décrit le 1er prix comme "une solution de détection de fraude sur Leboncoin", vraisemblablement le même projet.

### HAKS 2025 (KRYPTOSPHERE x Télécom SudParis, mai 2025, chez XRPL Commons)
- 40 participants, 5 000 € de prix. **Gagnant : détection de fraude dans des transactions blockchain**.

### Enseignements
- **Deux fois sur deux, c'est la détection de fraude qui gagne** chez KRYPTOSPHERE : problème concret et grand public, démo tangible (extension ou outil utilisable), IA explicable (score et red flags).
- Les produits **utilisables tout de suite** (une extension, un outil branché sur un vrai workflow) l'emportent sur les plateformes abstraites.

Sources : [ESSEC FR](https://www.essec.edu/fr/actualites/etudiants-essec-assaut-intelligence-artificielle/) · [ESSEC EN](https://www.essec.edu/en/news/essec-students-tackling-artificial-intelligence/) · [TSE Alumni – Trustee](https://alumni.tse-fr.eu/en/article/a-d3s-master-s-student-wins-first-prize-at-an-ai-hackathon/08/04/2025/1287) · [Télécom SudParis HAKS 2025](https://gate.wp.telecom-sudparis.eu/gate-projets/haks-2025/) · [LinkedIn Thomas Lambert (Team1)](https://www.linkedin.com/in/thomas-lambert-91112a1b6/) · [LinkedIn Gabriel Gervais](https://www.linkedin.com/in/gabrielgervais1/)

---

## 3. Les jurys, un par un

### 3.1 Avalanche / Team1 (Track 1)
- **Qui** : Avalanche est une blockchain L1 (Ava Labs). Depuis Avalanche9000 (Etna, déc. 2024), n'importe qui peut lancer des **Avalanche L1s** (anciens subnets) à bas coût, avec des règles propres (permissionnées, KYC, gas token custom). **Team1** est le réseau communautaire et de croissance de l'écosystème : plus de 450 membres dans plus de 40 pays, des chapitres pays en expansion en 2026, des hackathons Team1 dans le monde entier (36 h, petites dotations, orientés builders). Juge présent : **Thomas Lambert**.
- **Priorités 2025-2026** :
  - **Tokenisation / RWA institutionnels** : Securitize a obtenu une licence UE (DLT Pilot Regime, CNMV, passeportée en France) pour une plateforme **sur Avalanche**. Progmat (Japon) a migré plus de 2 Md$ de titres tokenisés. La capitalisation RWA d'Avalanche est d'environ 1,7 Md$ (sept. 2026).
  - **eERC (Encrypted ERC)** d'AvaCloud : token confidentiel (zk-SNARK Groth16 et ElGamal) avec **clé d'auditeur** pour la conformité. C'est le pont entre confidentialité et régulation.
  - Programmes de grants (Retro9000, 40 M$ rétroactifs pour des L1 et de l'outillage, Build Games, Codebase).
- **Ce qu'ils valorisent** : un **déploiement réel on-chain** (Fuji testnet ou L1 dédiée), l'usage de primitives Avalanche (L1 permissionnée, ICM/Teleporter, eERC, precompiles), un builder qui pourrait continuer après le hackathon (Team1 recrute des builders, grants à la clé).
- **Sources** : [Nansen Q2 2026](https://nansen.ai/post/avalanche-q2-2026-report) · [Retro9000](https://www.avax.network/about/blog/retro9000-everything-you-need-to-know) · [eERC docs](https://docs.avax.network/integrations/encrypted-erc) · [AvaCloud eERC](https://avacloud.io/blog/why-avacloud-created-eerc) · [Avalanche Institutions](https://avax.network/institutions) · [BTC-Echo Securitize EU](https://www.btc-echo.de/schlagzeilen/avalanche-news-blackrock-partner-securitize-bringt-tokenisierung-in-die-eu-220593/) · [CryptoBriefing RWA](https://cryptobriefing.com/avalanche-rwa-market-cap-growth/) · [Build hub](https://build.avax.network/hackathons)

### 3.2 KPMG France (Tracks 1 et 2)
- **Qui** : Big Four, très présent en audit, conseil risques, cyber et conformité réglementaire. Partenaire de l'événement.
- **Priorités 2025-2026** :
  - **AI Trust** : framework de sécurisation des projets IA sur tout leur cycle de vie (gouvernance, conformité **AI Act**, risques). Matinales AI Trust 2026, dont un atelier sur l'**IA agentique** (16 avril 2026). Slogan VivaTech 2026 : "Make your AI transformation happen".
  - Global Tech Report 2026 : 88 % des organisations investissent dans l'IA agentique, et 92 % pensent que la gestion des agents IA deviendra une compétence clé. AI Pulse 2026 : en France, la cybersécurité et la sécurité des données arrivent en priorité (53 %).
  - Conformité ETI 2026 : **NIS2** (transposition, notification d'incident sous 24 h). Contexte financier : **DORA** (résilience opérationnelle numérique, registre des prestataires TIC tiers), **MiCA** (fin de la période transitoire PSAN le 30 juin 2026 : seuls les PSCA agréés opèrent depuis le 1er juillet 2026).
- **Ce qu'ils valorisent** : **traçabilité et auditabilité** (logs, preuves, rapports exploitables par un auditeur), mapping explicite vers un article de loi (DORA art. X, AI Act art. Y), gouvernance, réduction du risque mesurable, vendabilité à un grand compte.
- **Sources** : [KPMG AI Trust](https://kpmg.com/fr/fr/services/intelligence-artificielle/ai-trust.html) · [Matinales AI Trust](https://kpmg.com/fr/fr/articles/data-ia/matinales-ai-trust.html) · [Global Tech Report 2026](https://kpmg.com/fr/fr/insights/tech/tech-ia-trends-2026.html) · [AI Pulse 2026](https://kpmg.com/fr/fr/media/press-releases/2026/05/ai-pulse-survey-2026.html) · [Conformité ETI 2026](https://kpmg.com/fr/fr/services/gestion-risques/lp-conformite-reglementaire-eti-2026.html) · [Actu-Juridique MiCA](https://www.actu-juridique.fr/fiscalite/droit-fiscal/crypto-actifs-ce-que-le-regime-mica-a-change-le-1er-juillet/)

### 3.3 KRYPTOSPHERE® (Track 1, organisateur)
- **Qui** : premier réseau étudiant français blockchain et actifs numériques (fondé en 2017 à Kedge Marseille). Plus de 800 membres et 21 campus selon les sources, avec des antennes à Londres et Bruxelles. Activité élargie à l'IA et à la tech. Organise le KRYPTO-TOUR (Lyon), des hackathons (Hackin'Dau, HAKS) et des partenariats (Ledger, XRPL Commons, Aleph.im, Blockchair).
- **Ce qu'ils valorisent** : la culture Web3 (self-custody, wallets, smart contracts, sécurité des actifs), des projets **fraude/arnaque** (leurs deux gagnants précédents), l'énergie et le côté "builder", et un projet qui crée de la fierté pour l'événement (communicable sur LinkedIn).
- **Sources** : [Cryptoast présentation](https://cryptoast.fr/presentation-de-lassociation-blockchain-etudiante-kryptosphere/) · [Cryptoast UK/BE](https://cryptoast.fr/association-etudiante-francaise-kryptosphere-etend-horizons-royaume-uni-belgique/) · [kryptosphere.org](https://www.kryptosphere.org/en/) · [Dauphine Hackin'Dau](https://dauphine.psl.eu/dauphine/media-et-communication/article/hackin-dau-le-hackathon-blockchain-de-la-chaire-fintech-et-kryptosphere)

### 3.4 GitGuardian (Track 2)
- **Qui** : scale-up française (Paris), leader de la **détection de secrets** (clés API, tokens) dans le code. Série C de **50 M$ en février 2026** (Insight Partners). Recentrage sur la **gouvernance des NHI (identités non humaines)** et la **sécurité des agents IA**. Le CEO Eric Fourrier parle de passer "au-delà de la détection de secrets, vers la gouvernance complète du cycle de vie des NHI".
- **Produits / publications 2026** :
  - **State of Secrets Sprawl 2026** (mars) : 28,65 M de nouveaux secrets sur GitHub public en 2025 (+34 %) ; **fuites de secrets de services IA +81 %** (1,27 M) ; 8 des 10 catégories qui croissent le plus vite sont liées à l'IA (Supabase +992 %, Firecrawl +796 %, Brave Search +1 255 %) ; commits assistés par Claude Code : 3,2 % de taux de fuite contre 1,5 % en moyenne ; 32 % des repos internes contiennent un secret ; 64 % des secrets valides en 2022 étaient encore exploitables en janvier 2026.
  - **ggshield AI hooks** (avril 2026) : scan en temps réel des prompts, lectures de fichiers, commandes shell et **appels MCP** dans Claude Code, Cursor, Codex, Copilot et Mistral Vibe ; blocage avant exécution.
  - **Agent skills open source** (mai 2026), **serveur MCP GitGuardian** (gg-mcp), API publique de détection (plus de 500 à 600 types de secrets).
  - SecDays Paris 2026 : identité des agents IA, supply chain, gouvernance des identités machine.
- **Ce qu'ils valorisent** : la **sécurité des agents IA et de MCP** (permissions, credentials, exfiltration), les NHI (tokens à longue durée de vie, rotation, moindre privilège), l'expérience développeur (shift-left, intégration dans le workflow), la **remédiation** plutôt que la seule détection. Utiliser leur API ou ggshield serait un plus fort.
- **Sources** : [SiliconANGLE Série C](https://siliconangle.com/2026/02/11/gitguardian-raises-50m-expand-non-human-identity-ai-agent-security/) · [GovInfoSecurity](https://www.govinfosecurity.com/gitguardian-doubles-down-on-ai-agent-defense-50m-raise-a-30778) · [THN Secrets Sprawl 2026](https://thehackernews.com/2026/03/the-state-of-secrets-sprawl-2026-9.html) · [DEV.to rapport](https://dev.to/gitguardian/the-state-of-secrets-sprawl-2026-ai-service-leaks-surge-81-and-29m-secrets-hit-public-github-2bgj) · [AI hooks docs](https://docs.gitguardian.com/endpoint-protection/ai-hooks) · [Changelog avril 2026](https://docs.gitguardian.com/releases/saas/2026/04/10/changelog) · [Changelog mai 2026](https://docs.gitguardian.com/releases/saas/2026/05/21/changelog) · [Help Net Security](https://www.helpnetsecurity.com/?p=366011)

### 3.5 ESSEC Metalab (Track 2, organisateur)
- **Qui** : Institut Metalab pour l'IA, les données et la société (créé en 2020, dirigé par Abdelmounaim Derraz, co-direction académique de Julien Malaurent). Positionnement : **IA responsable, éthique, impact sociétal**. Master Data Sciences & Business Analytics (avec CentraleSupélec), initiative AI for Responsible Leadership (avec Accenture). Porte le financement France 2030.
- **Ce qu'ils valorisent** : l'IA **responsable et explicable**, l'impact sociétal (protection des citoyens et des PME), la rigueur méthodologique (évaluation, métriques), un cas d'usage qui lie business et data.
- **Sources** : [Institut Metalab](https://www.essec.edu/fr/pages/institut-metalab-intelligence-artificielle-donnee-societe/) · [Metalab débat public](https://www.essec.edu/fr/actualites/institut-metalab-essec-ancre-societe-debat-public/) · [ESSEC IA éthique](https://essec.edu/fr/actualites/lessec-sengage-pour-une-intelligence-artificielle-ethique-et-responsable/)

### 3.6 Bpifrance (Track 3)
- **Qui** : banque publique d'investissement, opérateur de France 2030. Investisseur en deeptech et cyber.
- **Priorités 2026** : **Radar des start-up cyber** (avec Wavestone, VivaTech 2026 : 234 start-ups, 43 scale-ups, 105 nouvelles entrées, une explosion liée à l'IA et au "vibe coding") ; **souveraineté numérique** (stratégie cyber nationale France 2030, plan "Notre IA" de juin 2026, SecNumCloud) ; plan **"Osez l'IA"** pour l'adoption de l'IA par les PME et ETI (cibles 2030 : 80 % des PME/ETI) ; Deeptech Seed (mars 2026).
- **Ce qu'ils valorisent** : le **potentiel de start-up** (marché adressable, modèle économique, go-to-market), la **souveraineté** (techno française ou européenne, données hébergées en UE), la cible **PME/ETI** (cœur de leur mission), une équipe capable de continuer après le hackathon.
- **Sources** : [Le Monde Informatique Radar 2026](https://www.lemondeinformatique.fr/actualites/lire-la-dynamique-des-start-ups-en-cybersecurite-s-accelere-en-france-en-2026-100555.html) · [France 2030 technologies critiques](https://www.info.gouv.fr/index.php/actualite/france-2030-13-laureats-de-la-quatrieme-edition-du-dispositif-developpement-de-technologies-innovantes-critiques) · [Bpifrance cyber](https://www.bpifrance.com/2022/11/18/cybersecurity-bpifrance-supports-french-companies-in-the-fight-against-cybercrime/)

### 3.7 ESSEC Alumni (Track 3)
- **Qui** : réseau des diplômés (plus de 800 bénévoles, plus de 83 clubs). Club Entrepreneurs (3 200 membres, mentorat), club Digital & Technology, **incubateur ESSEC x ESSEC Alumni à Station F**, ESSEC Ventures. Profils : dirigeants, investisseurs, entrepreneurs, plutôt business que tech.
- **Ce qu'ils valorisent** : la clarté du pitch, un vrai problème client, la **traction possible**, la qualité de l'équipe, l'adéquation au marché. Il faut pouvoir comprendre le projet sans être expert cyber.
- **Sources** : [Incubateur Station F](https://www.essecalumni.com/en/page/un-incubateur-essec-x-essec-alumni-a-station-f) · [Club Entrepreneurs](https://essec.edu/en/news/uniting-inspiring-supporting-strength-essec-alumni-entrepreneurs/) · [ESSEC x Alumni entrepreneuriat 2026](https://www.essecalumni.com/en/article/from-school-to-network-essec-x-essec-alumni-foster-entrepreneurship/11/03/2026/5926)

### 3.8 UTOPIA (Track 3, organisateur)
- **Qui** : ce n'est **pas** un fonds ni une entreprise. C'est l'**association étudiante IA de l'ESSEC**, fondée en septembre 2024 par Clément Sporrer (BBA). Plus de 20 événements en 7 mois (conférences, formations, hackathons). Co-organisateur des deux éditions.
- **Ce qu'ils valorisent** : un usage **créatif et ambitieux de l'IA** (agents, LLM), l'effet "waouh" en démo, la pédagogie (rendre l'IA accessible), un projet qui illustre bien le thème IA x cyber de l'événement.
- **Sources** : [ESSEC FR](https://www.essec.edu/fr/actualites/etudiants-essec-assaut-intelligence-artificielle/)

### 3.9 Partenaires non jurés mais présents
- **AWS** : probable fournisseur de crédits (Bedrock, Lambda). Utiliser leur stack peut plaire au mentor AWS [INFÉRENCE].
- **Artefact** : cabinet data/IA ; possible mentorat.

---

## 4. Ce que chaque jury veut voir

**Track 1, Guardians of Value (Team1/Avalanche, KPMG, KRYPTOSPHERE)**
- **Team1/Avalanche** : un **contrat déployé sur Fuji** (ou une L1 Avalanche permissionnée) montré en démo, avec l'adresse du contrat et un lien explorer à l'écran. Bonus : utiliser **eERC** (confidentialité et clé d'auditeur) ou des precompiles d'allowlist/KYC. Mentionner Securitize et la tokenisation RWA en UE comme contexte de marché. Dire qu'on veut continuer (grants Team1/Retro9000).
- **KPMG** : relier chaque fonctionnalité à un article précis (**DORA**, **MiCA**, AI Act, AML/TFR "travel rule"). Montrer un **journal d'audit / rapport de preuve** exportable. Parler de réduction de risque et de coût de conformité.
- **KRYPTOSPHERE** : protéger l'utilisateur final contre la **fraude/arnaque crypto** (drainers, approvals malveillantes, phishing de wallet, rug pulls). C'est le pattern gagnant historique, avec score de risque et explication en langage clair.

**Track 2, Defenders Augmented (GitGuardian, ESSEC Metalab, KPMG)**
- **GitGuardian** : s'attaquer à la **sécurité des agents IA / MCP** et des **NHI** (agent qui exfiltre des secrets, serveur MCP malveillant, tokens surprivilégiés). Citer les chiffres du **State of Secrets Sprawl 2026** (+81 % de fuites IA, 3,2 % chez les agents de code). Intégrer **ggshield / l'API GitGuardian** ou leur serveur MCP. Aller jusqu'à la **remédiation** (révocation/rotation), pas seulement l'alerte.
- **ESSEC Metalab** : une IA **explicable et responsable** (pourquoi l'alerte), avec des métriques d'évaluation (précision, faux positifs) et un impact sociétal.
- **KPMG** : un angle **AI Act et gouvernance des agents** (inventaire des agents, politiques, traçabilité), qui s'insère dans un discours "AI Trust".

**Track 3, Uncharted Frontiers (Bpifrance, ESSEC Alumni, UTOPIA)**
- **Bpifrance** : un vrai **business case de start-up** (marché, prix, cible **PME/ETI**), un argument de **souveraineté** (UE, open source, hébergement FR), et pourquoi maintenant (NIS2, IA).
- **ESSEC Alumni** : un pitch limpide en 30 secondes, un persona client concret, un chemin vers les premiers clients, et une équipe complémentaire (Adem tech, Titouan business, à mettre en avant).
- **UTOPIA** : une utilisation audacieuse de l'IA (agents autonomes, multi-agents) avec une démo live spectaculaire.

**Transversal (tous jurys)**
- Une **démo live qui marche** vaut plus que des slides. Prévoir une vidéo de secours.
- Un problème réel chiffré dès la première slide, puis une solution, la démo, le marché et la suite.
- Les projets gagnants précédents étaient **simples, concrets, orientés utilisateur final, avec de l'IA explicable** (score de risque et raisons).
- À demander au kick-off : la grille officielle, la durée du pitch, le format du rendu (repo, vidéo), les crédits AWS, et la possibilité de candidater à plusieurs prix.

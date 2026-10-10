# V7 — Écosystème de veille sur les menaces visant les agents IA

> Recherche du 2026-10-10 (avant 11h30, préparation). Objectif : quelles sources Antibody peut **consommer** pour fabriquer des vaccins, avec quelle licence, et ce qui manque.
> Vérifié en direct (API GitHub, Hugging Face, NVD, OSV) quand c'est indiqué ✅. Le reste vient de recherches web et reste à confirmer ⚠️.
> Document défensif : on décrit des sources, pas des charges d'attaque. Aucun contenu offensif n'est reproduit.

## 1. Synthèse en 5 lignes
- La **taxonomie** est mûre : ATLAS v2026.09 compte 139 techniques étiquetées « Agentic AI » sur 208, ASI01-10 existe et FINOS publie des risques d'agents propres à la finance.
- Les **corpus de test** sont mûrs aussi : AgentDojo (suite banking), InjecAgent (catégorie « Financial Harm »), ASB, MCPTox, b3, AgentHarm. Ce sont des instantanés académiques, pas des flux.
- Les **flux de vulnérabilités logicielles** (GHSA, OSV, NVD) fonctionnent pour la pile agent (SDK MCP, x402, LangChain), mais ils décrivent des bugs de code, pas des comportements d'agent.
- Le **format d'échange** n'est pas standardisé. Il n'existe pas d'extension STIX officielle. ATR (« Sigma pour agents », MIT) est le candidat le plus avancé, et MISP a déjà des briques.
- **Le trou :** personne ne publie de défense *exécutable au niveau de l'action financière* accompagnée d'une *preuve d'efficacité rejouable*. C'est exactement le créneau d'Antibody.

## 2. Tableau des sources

Légende pertinence finance : ●●● = cas paiement/banque/trésorerie explicites ; ●● = transposable directement ; ● = contexte.

| # | Source | Contenu | Format / accès | Licence (usage commercial) | Fréquence | Pertinence agents financiers |
|---|---|---|---|---|---|---|
| 1 | **OWASP Top 10 for Agentic Applications 2026** (ASI01-ASI10) + Agentic Security Initiative | 10 risques (ASI01 Agent Goal Hijack, ASI02 Tool Misuse, ASI04 Supply chain, ASI05 RCE, etc.) avec mitigations. Ressources liées : *Agentic AI Threats & Mitigations*, *Securing Agentic Applications Guide*, *GenAI Security Industry Framework Crosswalk* (sept. 2026), *Agent Control Standard* (sept. 2026), round-ups trimestriels d'incidents | PDF et pages web sur genai.owasp.org. **Pas de version machine officielle** ⚠️ | CC BY-SA 4.0 (licence par défaut du site ✅). On peut citer et mapper librement ; un document dérivé doit rester en share-alike | Annuelle, plus des round-ups trimestriels | ●● Vocabulaire commun du jury (`threat_refs`). Ce n'est pas un flux |
| 2 | **MITRE ATLAS** (`mitre-atlas/atlas-data`) ✅ | v2026.09 (15/09/2026) : 16 tactiques, 208 techniques et sous-techniques (139 « Agentic AI »), 40 mitigations, 73 case studies, 322 relations. Techniques clés : AML.T0051.001 (injection indirecte), T0053 (invocation d'outil), T0080 (empoisonnement de contexte), T0110 (empoisonnement d'outil), T0098, T0086 | YAML versionné `dist/v6/ATLAS-2026.MM.yaml` (+ `ATLAS-latest.yaml`), JSON schemas, STIX 2.1 via `atlas-navigator-data` (dépôt moins à jour). Contributions en STIX 2.1 par PR | **Apache-2.0** ✅ | Mensuelle en 2026 (v2026.07, .08, .09) | ●●● **AML.CS0026 « Financial Transaction Hijacking with M365 Copilot as an Insider »**, CS0034 (fraude KYC), CS0053 (serveur MCP empoisonné, exfiltration d'e-mails), CS0045, CS0054 |
| 3 | **AI Incident Database** (AIID) | Plus de 1 000 incidents IA, rapports de presse, taxonomies (CSET, GMF) | Snapshots **hebdomadaires** JSON, CSV et Mongo (`.tar.bz2`, dernier le 05/10/2026), export Excel le lundi. API GraphQL **réservée aux domaines autorisés** ✅ (403 en test) | Code Apache-2.0 ✅. **Licence des données non indiquée** sur la page (« Terms of use » + citation demandée) ⚠️ : à vérifier avant tout usage commercial | Hebdomadaire | ● Surtout grand public. Utile pour le contexte d'incident, peu structuré pour l'action |
| 4 | **AVID** (AI Vulnerability Database) | Rapports et vulnérabilités IA, taxonomie sécurité/éthique/performance | JSON (schéma AVID), dépôt `avidml/avid-db` (MIT ✅), lib `avidtools` (Apache-2.0 ✅). garak et Giskard exportent nativement au format AVID | MIT et Apache ✅ | Faible : dernier push en mars 2026 | ● Orienté modèles. **Le schéma de rapport est réutilisable** comme format d'export |
| 5 | **GitHub Security Advisories** ✅ | CVE/GHSA de la pile agent : `@modelcontextprotocol/sdk` (4 avis, dont un du 06/10/2026), **`x402` (2 avis : 2025-08 et 2026-03)**, `langchain-core` (5) | REST `GET /advisories?affects=<pkg>&ecosystem=npm|pip`, GraphQL. Sans token : 60 req/h ; avec `gh` : 5 000 req/h | Données CC BY 4.0 (base GitHub Advisory Database) ⚠️ à reconfirmer | Temps réel | ●●● pour x402 et les SDK de paiement agentique. Signale des bugs de code, pas des comportements |
| 6 | **OSV.dev** ✅ | Agrège GHSA, PyPI, npm, etc. | `POST https://api.osv.dev/v1/query` sans authentification, format OSV JSON | Apache-2.0 (schéma) ; données selon la source | Temps réel | ●● Le plus simple à brancher |
| 7 | **NVD / CVE** ✅ | 139 CVE pour « Model Context Protocol », 194 pour « prompt injection » (recherche par mot-clé) | API 2.0 `services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=…`. CWE-1427 (neutralisation des entrées de prompt) existe mais **0 CVE taguée** en recherche par `cweId` ✅ | Domaine public (US Gov) | Temps réel, rate limit sans clé | ●● Le tagging CWE propre aux agents est quasi absent |
| 8 | **AgentDojo** (ETH Zürich, `ethz-spylab/agentdojo`) ✅ | Environnement dynamique avec suites `banking`, `slack`, `travel`, `workspace`. **Banking : 16 tâches utilisateur, 9 tâches d'injection** (virements, paiements récurrents, IBAN) | Python (pip `agentdojo`), tâches en code, scoring utilité/sécurité | **MIT** ✅ | Actif (push juin 2026) | ●●● **Meilleur banc pour paiement.** Il manque le stablecoin, l'on-chain et le multi-agent |
| 9 | **InjecAgent** (UIUC) ✅ | 1 054 cas (510 direct harm + 544 exfiltration, version base) ; 30 cas attaquant DH dont **9 « Financial Harm »** ; 17 outils utilisateur, 62 outils attaquant | JSON/JSONL dans `data/` | **MIT** ✅ | Figé (2024) | ●●● Catégorie financière explicite, outils simulés. Pas d'environnement exécutable |
| 10 | **Agent Security Bench (ASB)** (ICLR 2025, `agiresearch/ASB`) | 10 scénarios dont finance/e-commerce, 400+ outils, attaques DPI/IPI, empoisonnement mémoire, backdoor ; 13 défenses évaluées | Python, configs YAML | **MIT** ✅ | Actif (push 30/09/2026) | ●● Inclut un agent « financial analyst » ⚠️ |
| 11 | **MCPTox** (AAAI 2026, arXiv 2508.14925) | Empoisonnement des métadonnées d'outils MCP sur 45 serveurs réels et 353 outils, 10 catégories de risque, environ 1 300 cas (le chiffre varie selon la version) | Article et artefacts. Licence du dépôt non confirmée ⚠️ | ⚠️ | Figé | ●● Pertinent si l'agent de paiement utilise des outils MCP tiers |
| 12 | **AgentHarm** (Gray Swan + UK AISI) ✅ | Comportements nuisibles et bénins appariés pour agents (inclut fraude et cybercrime) | HF `ai-safety-institute/AgentHarm` (JSON) + Inspect evals | **MIT + clause** : usage limité à l'amélioration de la sécurité de l'IA ✅. Compatible avec un produit défensif, à signaler au jury | Figé (12/2024) | ● Utile pour mesurer les **faux positifs** (paires bénignes) |
| 13 | **Gray Swan Arena** | Compétitions publiques (Agent Red-Teaming 2025 : environ 1,8 M tentatives ; IPI Arena 2026) | **Aucun dataset publié sur HF** (organisation vide ✅). Résultats dans des papiers | Propriétaire | Par événement | ●● Source d'*insight*, pas de données réutilisables |
| 14 | **HarmBench** (CAIS) ✅ | Comportements nuisibles pour LLM (chat) | CSV/JSON | **MIT** | Figé (2024) | ● Pas spécifique aux agents |
| 15 | **garak** (NVIDIA) ✅ | Scanner de vulnérabilités LLM. Probes `latentinjection`, `web_injection`, `agent_breaker`, `promptinject`, `exploitation`… Sortie AVID | pip, rapports JSONL | **Apache-2.0** | Très actif (push la veille) | ●● Génère des variantes pour l'« essai clinique » |
| 16 | **promptfoo** red team ✅ | Plugins agentiques (excessive agency, injection indirecte, MCP, BOLA/BFLA) + **12 plugins `financial:*`** (compliance, SOX, misconduct, data leakage, calculation error…) | npm/CLI, config YAML, JSON | **MIT** | Très actif | ●●● Le seul outil avec une **famille de plugins financiers**, mais centrée sur le texte |
| 17 | **Lakera** : Gandalf, **b3 Agent Security Benchmark** ✅ | Gandalf-RCT (279k prompts) ; b3 : injections contextualisées sur des « threat snapshots » d'agents, plus de 30 LLM évalués (avec UK AISI) | HF CSV/Parquet | gandalf_ignore_instructions / summarization / mosscap : **MIT** ; gandalf-rct et b3 : **« other »** ⚠️ | Ponctuelle | ●● b3 est le corpus le plus « agent » du lot |
| 18 | **deepset/prompt-injections** ✅ | Petit corpus étiqueté injection / légitime | HF | **Apache-2.0** | Figé | ● Pour l'entraînement d'un classifieur |
| 19 | **Snyk Agent Scan** (ex Invariant MCP-Scan) | Scanner : injection, empoisonnement d'outils, « toxic flows », skills | `uvx snyk-agent-scan`, sortie JSON | Apache-2.0 (à confirmer ⚠️) | Actif | ●● Outil, **pas de flux public** de menaces |
| 20 | **huntr** (Protect AI → Palo Alto Prisma AIRS) | Bug bounty sur l'OSS IA/ML, feed « Hacktivity » | Web. Les CVE remontent dans NVD/GHSA | Propriétaire | Continue | ● Passe par GHSA/NVD : inutile de le brancher directement |
| 21 | **ATR — Agent Threat Rules** ✅ | **829 règles de détection YAML** (`ATR-YYYY-NNNNN`), 10 catégories, mappées ASI, ATLAS et CWE ; catalogue de techniques « ATD » ; moteur TS (npm `agent-threat-rules`) et Python (`pyatr`) | YAML + JSON schema, GitHub Action | **MIT** | Très actif (push 09/10/2026). Working Draft v4.1.5, gouvernance à un seul mainteneur, soumission OASIS « proposée » | ●● **Le plus proche d'un format d'échange de défenses.** Détection sur contenu, pas sur l'action financière |
| 22 | **MISP** ✅ | Objet `ai-chat-prompt` (prompt, model, role, result) ; galaxies `mitre-atlas-*` (attack-pattern, case-study, course-of-action) et `agent-threat-rules` | JSON MISP, partage entre instances | CC0 / AGPL selon le dépôt ⚠️ | Actif | ●● Canal de partage réel des CERT, FS-ISAC compris |
| 23 | **FINOS AI Governance Framework** ✅ | 24 risques **propres aux services financiers**, dont ri-24 *Agent action authorization bypass*, ri-25 *Tool chain manipulation*, ri-26 *MCP supply chain*, ri-27 *Agent state persistence poisoning*, ri-28 *Multi-agent trust boundary*, ri-29 *Credential harvesting* ; mitigations `mi-xx` | Markdown + front-matter (`docs/_risks`, `_mitigations`) | **CC BY 4.0** | Actif (push 07/10/2026) | ●●● **Le référentiel « finance + agents » qui manquait au dossier.** À citer devant KPMG |
| 24 | **SAF-MCP** (ex SAFE-MCP) | Framework de techniques façon ATT&CK pour l'écosystème MCP et agents | Markdown | NOASSERTION ⚠️ | Actif | ● Recoupe ATLAS |
| 25 | **CISA + Five Eyes**, « Careful Adoption of Agentic AI Services » (mai 2026) | 5 familles de risques (privilèges, conception, comportement, structure, responsabilité) ; recommande le moindre privilège et une identité cryptographique par agent | PDF | Domaine public US | Ponctuelle | ●● Argument « on applique la guidance » |
| 26 | **ANSSI** : *Recommandations de sécurité pour un système d'IA générative* (avril 2024, 35 recommandations) ; *Design Principles for LLM-based Systems with Zero Trust* (août 2025) | Guides | PDF FR/EN | Licence Ouverte Etalab ⚠️ | Ponctuelle | ● Le guide 2024 ne traite pas des agents. Pas de guide « agentique » ANSSI 2026 trouvé |
| 27 | **CrAIBench** (Princeton/Sentient, FC'26) | Mémoire empoisonnée sur agents Web3 (ElizaOS) : 150+ tâches (transferts, trading, bridges), 500+ cas | Article. **Dataset public non trouvé** ⚠️ | ⚠️ | — | ●●● **Le plus proche de notre cas** (agents crypto qui paient) |
| 28 | **Étude USENIX Security 2026 sur les facilitateurs x402** | 15 facilitateurs, 31 vulnérabilités, classes « free shopping » et coûts de gaz ; divulgation coordonnée | Article (couverture presse) ⚠️ | — | — | ●●● Menaces sur le **rail de paiement agentique lui-même** |

## 3. Existe-t-il un format standard pour échanger des menaces sur agents IA ?
**Non, pas de standard ratifié.** État au 10/10/2026 :
- **STIX 2.1 / TAXII 2.1** : aucune extension officielle « agent IA » à l'OASIS CTI TC trouvée. ATLAS distribue ses objets en STIX 2.1 (attack-pattern, course-of-action) et accepte les contributions dans ce format. Il existe des prototypes communautaires (`adversarial-ai-cti` : observable `ai-prompt` + indicateurs + labels ATLAS/OWASP, « work in progress ») et une proposition académique de schéma par composants (arXiv 2608.07808). Ces travaux recommandent de partager des enregistrements structurés plutôt que les prompts bruts.
- **ATLAS** sert d'**identifiant commun** (AML.Txxxx, AML.CSxxxx). C'est un vocabulaire, pas un format d'indicateur.
- **ATR** est un **format de règle de détection** (YAML, comme Sigma), adopté par MISP, Cisco, Microsoft AGT et FINOS CCC, mais il est encore en Working Draft.
- **MISP** fournit un objet `ai-chat-prompt` et des galaxies ATLAS/ATR : c'est le canal de partage pratique aujourd'hui.
- **AVID** propose un schéma de *rapport* de vulnérabilité. OSV, CVE et CWE couvrent le code (CWE-1427 n'est presque jamais utilisé).

Dilemme connu : un indicateur « chaîne exacte » est portable mais contournable par simple paraphrase ; un indicateur comportemental résiste mieux mais exige un moteur d'évaluation commun.

## 4. TOP 5 à brancher dans la démo

| Rang | Source | Ce qu'elle apporte à Antibody | Exemple d'accès (lecture seule) |
|---|---|---|---|
| 1 | **MITRE ATLAS YAML** (Apache-2.0) | Étiquetage automatique des vaccins et de l'autopsie (`threat_refs`). La fiche de défense cite **AML.CS0026** (détournement de transaction financière par un assistant) comme précédent réel | `curl -sL https://raw.githubusercontent.com/mitre-atlas/atlas-data/main/dist/v6/ATLAS-2026.09.yaml -o atlas.yaml` puis parsing des clés `techniques` / `case-studies` (dictionnaires indexés par ID) |
| 2 | **AgentDojo — suite banking** (MIT) | Arène de base : 16 tâches légitimes (alimentent le **jumeau légitime** et la mesure des faux positifs) et 9 tâches d'injection (variantes de l'essai clinique). On adapte ses outils `send_money` / récurrents vers HorizonEUR sur Fuji | `pip install agentdojo` ; suite `agentdojo.default_suites.v1.banking` |
| 3 | **GHSA / OSV sur la pile paiement agentique** | La « veille consommée » en direct : un nouvel avis sur `x402` ou `@modelcontextprotocol/sdk` déclenche une proposition de vaccin (ex. : bloquer un facilitateur ou une version non patchée) | `gh api "/advisories?affects=x402"` ou `curl -X POST https://api.osv.dev/v1/query -d '{"package":{"name":"@modelcontextprotocol/sdk","ecosystem":"npm"}}'` |
| 4 | **ATR — Agent Threat Rules** (MIT) | Couche de détection textuelle déjà prête (829 règles, mappées ASI/ATLAS) **en amont** de nos vaccins d'action. On exporte nos vaccins dans un format inspiré d'ATR, ce qui donne un argument d'interopérabilité | `npm i agent-threat-rules` ; règles dans `rules/` (YAML) |
| 5 | **InjecAgent — Financial Harm** (MIT) + **FINOS AIGF** (CC BY 4.0) | InjecAgent : cas « Financial Harm » pour tester des variantes jamais vues. FINOS : risques ri-24 à ri-29 cités dans la fiche de défense et le rapport (cadre finance reconnu) | `curl -s https://raw.githubusercontent.com/uiuc-kang-lab/InjecAgent/main/data/attacker_cases_dh.jsonl` (filtre `Attack Type == "Financial Harm"`) ; `github.com/finos/ai-governance-framework/tree/main/docs/_risks` |

Remplaçants : promptfoo `financial:*` (tests de non-régression sur les sorties texte), garak (génération de variantes), AgentHarm (paires bénignes pour les faux positifs, licence « sécurité uniquement »).

Précautions :
- les corpus offensifs restent dans l'arène, ne sont jamais commités en clair dans le repo de démo (on référence le hash) et ne vont jamais on-chain (cohérent avec V1) ;
- vérifier la licence des données AIID, b3 et gandalf-rct avant tout usage commercial ;
- citer les sources CC BY-SA (OWASP) et CC BY (FINOS).

## 5. Le trou que personne ne comble
1. **Aucune source ne parle d'action financière.** Toutes les sources décrivent l'*entrée* (prompt, outil, mémoire) ou le *code* (CVE). Aucune ne publie une menace sous la forme « bénéficiaire changé, montant fractionné, vélocité anormale, provenance de l'instruction ». Les seuls corpus proches de l'action de paiement (AgentDojo banking, InjecAgent Financial Harm, CrAIBench) sont **figés**, et CrAIBench n'est pas publié.
2. **Pas de défense exécutable avec preuve d'efficacité.** ATR publie des règles, mais sans métrique rejouable par règle (corpus d'attaque et légitime hashés, taux de blocage, faux positifs). Les benchmarks publient des taux, mais pas de défense déployable. **Personne ne lie « menace → règle → preuve vérifiable par un tiers ».**
3. **Pas de cycle de vie.** Aucune source ne gère le rappel d'une défense devenue obsolète ou contournée. Les CVE ont un statut, les règles d'agent n'en ont pas.
4. **Pas de canal de partage finance-agents.** FS-ISAC et MISP partagent des IOC classiques. FINOS donne des risques, pas de flux. x402 et les facilitateurs n'ont aucun flux de menaces dédié, seulement des GHSA ponctuels et une étude académique.
5. **Pas de format standard.** Aucune extension STIX ratifiée. ATR est en draft avec un seul mainteneur. Le CWE propre aux prompts est inutilisé dans NVD.

→ **Positionnement Antibody :** un « vaccin » = politique d'action déterministe + empreintes des corpus + métriques d'essai clinique + statut de cycle de vie, publié sur Avalanche. Il **consomme** ATLAS, ASI, GHSA, AgentDojo et ATR, et **produit** ce qui manque : un objet de défense vérifiable, centré sur l'action financière, échangeable entre institutions. On peut l'exporter vers ATR (YAML) et vers MISP (objet + galaxie ATLAS) pour ne pas inventer un format de plus.

## 6. Mapping utile pour `threat_refs`
- Facture piégée qui change le bénéficiaire (ALBA) : ASI01 (Goal Hijack), ASI02 (Tool Misuse) ; AML.T0051.001 (injection indirecte), AML.T0053 (invocation d'outil d'agent) ; FINOS ri-24, ri-25 ; précédent AML.CS0026.
- Outil ou serveur MCP empoisonné : ASI04 ; AML.T0110, AML.T0011.002 ; FINOS ri-26 ; précédents AML.CS0053, CS0054.
- Mémoire empoisonnée (trésorerie DeFi) : AML.T0080 ; FINOS ri-27 ; CrAIBench.
- Propagation entre agents (BORA) : AML.T0118 ; FINOS ri-28.

## Sources
- OWASP Agentic Top 10 : https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- MITRE ATLAS data : https://github.com/mitre-atlas/atlas-data (releases v2026.07 à v2026.09)
- ATLAS Navigator (STIX) : https://github.com/mitre-atlas/atlas-navigator-data
- AIID snapshots : https://incidentdatabase.ai/research/snapshots/
- AVID : https://github.com/avidml/avid-db , https://github.com/avidml/avidtools
- GHSA API : https://docs.github.com/rest/security-advisories/global-advisories ; OSV : https://osv.dev ; NVD : https://nvd.nist.gov/developers/vulnerabilities
- AgentDojo : https://github.com/ethz-spylab/agentdojo ; InjecAgent : https://github.com/uiuc-kang-lab/InjecAgent ; ASB : https://github.com/agiresearch/ASB
- MCPTox : https://arxiv.org/abs/2508.14925 ; AgentHarm : https://huggingface.co/datasets/ai-safety-institute/AgentHarm ; HarmBench : https://github.com/centerforaisafety/HarmBench
- Gray Swan Arena : https://www.grayswan.ai ; Lakera b3 : https://huggingface.co/datasets/Lakera/b3-agent-security-benchmark-weak (paper arXiv 2510.22620)
- garak : https://github.com/NVIDIA/garak ; promptfoo : https://github.com/promptfoo/promptfoo
- Snyk Agent Scan : https://github.com/snyk/agent-scan ; huntr : https://huntr.com
- ATR : https://github.com/Agent-Threat-Rule/agent-threat-rules ; MISP objects/galaxy : https://github.com/MISP/misp-objects , https://github.com/MISP/misp-galaxy
- FINOS AIGF : https://github.com/finos/ai-governance-framework ; SAF-MCP : https://github.com/secure-agentic-framework/saf-mcp
- CISA agentic guidance (résumé CSA) : https://labs.cloudsecurityalliance.org/research/csa-research-note-agentic-ai-governance-cisa-nist-caisi-2026/
- ANSSI IA : https://cyber.gouv.fr/enjeux-technologiques/intelligence-artificielle/
- CrAIBench : https://arxiv.org/abs/2503.16248 ; x402 USENIX (presse) : https://cryptoslate.com/coinbase-and-14-other-x402-facilitators-failed-security-tests-built-for-the-coming-ai-agent-economy/
- STIX communautaire : https://github.com/ashwinvis98/adversarial-ai-cti ; schéma par composants : https://arxiv.org/pdf/2608.07808

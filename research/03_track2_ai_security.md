# Track 2 "Defenders Augmented" — État de l'art & actualité (au 10 oct. 2026)

> Hackathon cybersécurité ESSEC Cergy, 10-11 oct. 2026, 36 h, équipe 2 personnes (1 tech, 1 business), AWS Bedrock (Claude).
> Jury : GitGuardian, ESSEC MetaLab, KPMG.
> Méthode : recherches web (sources primaires quand possible). Les chiffres issus de communiqués éditeurs sont signalés « (éditeur) ». À re-vérifier avant de citer un chiffre sur une slide.

---

## TL;DR

1. **Les agents IA sont devenus la nouvelle surface d'attaque n°1** : prompt injection indirecte, tool poisoning et rug pulls MCP, agents de code détournés (Claude Code, Cursor, Copilot : plusieurs CVE en 2025-2026). Le cadre mental dominant est la **« lethal trifecta »** de Simon Willison (données privées + contenu non fiable + canal de sortie).
2. **Les secrets sont le carburant de ces attaques** : 28,65 M de secrets fuités sur GitHub public en 2025 (+34 %), fuites liées aux services IA +81 %, commits assistés Claude Code à 3,2 % de fuite contre 1,5 % de base, 24 008 secrets dans des fichiers de config MCP (GitGuardian, *State of Secrets Sprawl 2026*).
3. **Les attaquants utilisent déjà les agents** : s1ngularity (Nx, août 2025) a piloté Claude/Gemini/Q CLI pour chercher des secrets. Shai-Hulud (sept./nov. 2025) a utilisé TruffleHog. GTG-1002 (sept. 2025) : espionnage à 80-90 % automatisé via Claude Code + MCP.
4. **Côté défense, l'IA trouve désormais des vulnérabilités à grande échelle** : AIxCC (Team Atlanta 1er), XBOW n°1 HackerOne US, Big Sleep, Claude Code Security (500+ vulnérabilités), Codex Security (ex-Aardvark), Claude Mythos / Project Glasswing (des milliers de 0-days). Les SOC deviennent « agentiques » (Microsoft, Google, Dropzone).
5. **Le créneau qui parle à GitGuardian** : la gouvernance des NHI (identités non humaines) appliquée aux agents IA. Il s'agit d'auditer et de contraindre les credentials, les MCP et les actions des agents, avec des honeytokens comme détection. Leur produit le plus récent (AI Hooks, inventaire agents/MCP, `ggshield ai discover`, sept. 2026) montre exactement où ils vont.

---

## 1. Sécuriser l'IA

### 1.1 Référentiels

**OWASP Top 10 LLM Applications 2025** (publié en nov. 2024)
- LLM01 Prompt Injection
- LLM02 Sensitive Information Disclosure
- LLM03 Supply Chain
- LLM04 Data & Model Poisoning
- LLM05 Improper Output Handling
- LLM06 Excessive Agency
- LLM07 System Prompt Leakage
- LLM08 Vector & Embedding Weaknesses
- LLM09 Misinformation
- LLM10 Unbounded Consumption

Source : [Invicti](https://www.invicti.com/blog/web-security/owasp-top-10-risks-llm-security-2025).

**OWASP Top 10 for Agentic Applications 2026** (publié le 9 déc. 2025, plus de 100 experts)
- ASI01 Agent Goal Hijack
- ASI02 Tool Misuse & Exploitation
- ASI03 Identity & Privilege Abuse
- Les catégories suivantes couvrent : supply chain agentique, exécution de code inattendue, empoisonnement mémoire/contexte, communication inter-agents non sécurisée, défaillances en cascade, exploitation de la confiance humain-agent, agents « rogue ».
- Message clé : ce sont des **risques d'architecture et d'intégration, pas des risques de modèle**.

Sources : [OWASP GenAI](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026), [Descope (ASI03 identité)](https://www.descope.com/blog/post/owasp-agentic-top-10-identity).

**OWASP GenAI Exploit Round-up Q1 2026** : il constate le passage du risque théorique à l'exploitation réelle. Source : [OWASP](https://genai.owasp.org/2026/04/14/owasp-genai-exploit-round-up-report-q1-2026/).

**MITRE ATLAS**
- Zenity a contribué 14 techniques agentiques en oct. 2025.
- La 1re mise à jour 2026 ajoute notamment l'*agent tool credential harvesting*, l'abus des API de services IA et le « clickbait » contre les navigateurs agentiques.
- C'est un vocabulaire d'attaque, pas un catalogue de contrôles.

Sources : [Zenity](https://zenity.io/blog/current-events/mitre-atlas-ai-security), [dev.to](https://dev.to/brennhill/mitre-atlas-now-has-agentic-attack-techniques-3815).

### 1.2 Prompt injection indirecte et « lethal trifecta »

**Le cadre** ([Simon Willison, 16 juin 2025](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/))
- Un agent qui réunit (1) l'accès à des données privées, (2) l'exposition à du contenu contrôlable par un attaquant et (3) une capacité de communication externe est exfiltrable.
- Il n'existe pas de correctif fiable au niveau du modèle : il faut casser une des trois jambes.
- MCP aggrave le problème, car il encourage à combiner des outils de sources différentes, chacun pouvant apporter une jambe.

**Défenses par conception**
- [CaMeL (Google DeepMind / ETH)](https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/) : un LLM privilégié et un LLM en quarantaine, avec un suivi de provenance et de capacités. Il résout 77 % des tâches AgentDojo avec sécurité prouvable, contre 84 % sans défense.
- Le papier *Design Patterns for Securing LLM Agents* (IBM, ETH, Google, Microsoft) propose 6 patterns : action-selector, plan-then-execute, map-reduce, dual LLM, code-then-execute, context-minimization.

**Incidents 2026 réels**
- **Superhuman** (janv. 2026) : un e-mail piégé exfiltre des dizaines d'e-mails sensibles vers un Google Form, via une CSP qui autorisait les images docs.google.com ([Willison](https://simonwillison.net/2026/jan/12/superhuman-ai-exfiltrates-emails)).
- **Microsoft Copilot (SharePoint) et Salesforce Agentforce (formulaires de leads)** (avr. 2026) : exfiltration de données CRM et clients ([OECD AI Incidents](https://oecd.ai/en/incidents/2026-04-15-d934)).
- **Atlassian Rovo** (juil.-août 2026) : RovoBlast (Varonis) patché le 8 juil. Le chemin PromptArmor par récupération d'URL était encore non résolu à la date de la note CSA ([CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-atlassian-rovo-prompt-injection-exfiltrati/)).
- **Oasis Security « Claudy Day »** (mars 2026) : chaîne injection + exfiltration sur claude.ai (source secondaire : [TrueFoundry](https://www.truefoundry.com/ja/blog/claude-code-prompt-injection)).
- **Wallet Grok** (mai 2026) : environ 175 k$ transférés via injection. Source peu fiable ([KuCoin flash](https://www.kucoin.com/news/flash/llm-agents-automate-cyberattacks-targeting-crypto-wallets-in-2026)).

### 1.3 MCP : tool poisoning, rug pulls, serveurs malveillants

**Les attaques**
- **Tool poisoning** (Invariant Labs, avr. 2025) : des instructions cachées dans la *description* d'un outil, visibles par le LLM mais pas par l'utilisateur. Exemple canonique : un outil `add()` qui lit `~/.ssh/id_rsa` et `mcp.json`.
- **Rug pull** : le serveur modifie la définition d'un outil après approbation. La plupart des clients ne revalident pas.
- **Cross-server shadowing** : un serveur malveillant réécrit le comportement d'un outil d'un autre serveur.

Sources : [CSA whitepaper](https://labs.cloudsecurityalliance.org/research-rb/csa-whitepaper-mcp-security-tool-poisoning-20260506-csa-styl/), [CSA research note juil. 2026](https://labs.cloudsecurityalliance.org/research/csa-research-note-mcp-tool-poisoning-ai-agent-exfiltration-2/).

**Incidents**
- **GitHub MCP** (Invariant, mai 2025) : une issue publique piégée amène l'agent à fuiter des repos privés via une PR. C'est la lethal trifecta dans un seul serveur.
- **postmark-mcp** (sept. 2025) : **premier serveur MCP malveillant in the wild**. 15 versions saines, puis la v1.0.16 ajoute une ligne qui met en BCC chaque e-mail vers giftshop[.]club. Environ 1 500 téléchargements par semaine ([Snyk](https://snyk.io/fr/blog/malicious-mcp-server-on-npm-postmark-mcp-harvests-emails/), [The Hacker News](https://thehackernews.com/2025/09/first-malicious-mcp-server-found.html)). C'est un rug pull de supply chain classique.
- **Cursor CurXecute (CVE-2025-54135) et MCPoison (CVE-2025-54136)** : une injection réécrit `.cursor/mcp.json`, d'où une RCE. Corrigé en 1.3/1.3.9 ([BleepingComputer](https://bleepingcomputer.com/news/security/ai-powered-cursor-ide-vulnerable-to-prompt-injection-attacks)).

**Outils de défense existants**
- Snyk Agent Scan (ex-mcp-scan, Invariant racheté par Snyk en 2025) : hash pinning des outils, détection de poisoning.
- Cisco mcp-scanner : YARA + LLM-juge.

**Gaps des outils** ([synthèse](https://www.deepinspect.ai/blog/best-mcp-security-tools), [Pluto Security](https://pluto.security/blog/malicious-mcp-servers-clean-scans/))
- Ils sont statiques : ils ne voient pas l'injection *dans le contenu* renvoyé à l'exécution.
- Aucun ne publie de taux de détection audité.
- Ils sont contournables (fichiers trop gros, bugs).
- Ils ne couvrent ni l'autorisation sémantique ni l'audit.
- Agent Scan envoie les descriptions d'outils au cloud Snyk.

### 1.4 Agents de code : exfiltration et détournement

**Claude Code**
- CVE-2025-55284 : exfiltration DNS via injection, découverte par Embrace The Red.
- CVE-2025-59536 (CVSS 8,7) : exécution avant le dialogue de confiance.
- CVE-2026-21852 : un `settings` de repo malveillant redirige l'API base URL, d'où une fuite de `ANTHROPIC_API_KEY`, `AWS_SECRET_ACCESS_KEY` et `GITHUB_TOKEN`.
- CVE-2025-66032 : 8 contournements via des arguments d'outils Unix ; la blocklist a été remplacée par une allowlist.
- Sources : [Akto](https://www.akto.io/blog/claude-code-vulnerabilities), [Korben](https://korben.info/pwning-claude-code-security-cve-2025-66032.html), [SentinelOne CVE-2026-54316](https://www.sentinelone.com/vulnerability-database/cve-2026-54316/).

**GitHub Copilot Chat, CamoLeak** (Legit Security, corrigé le 14 août 2025)
- Des prompts cachés dans des commentaires markdown invisibles de PR font fuiter des secrets et du code privé, encodés dans des requêtes d'images via le proxy Camo ([The Register](https://theregister.com/2025/10/09/github_copilot_chat_vulnerability/)).

**s1ngularity / Nx** (26 août 2025)
- Le malware post-install lance `claude --dangerously-skip-permissions`, `gemini --yolo` et `q --trust-all-tools` pour inventorier les secrets, puis les publie dans des repos `s1ngularity-repository` sur le compte de la victime.
- Environ 2 180 organisations touchées et 2 349 secrets distincts.
- Selon Apiiro, plus de 90 % des tokens GitHub fuités étaient encore valides après l'incident.
- Sources : [Wiz](https://www.wiz.io/de-de/blog/s1ngularity-supply-chain-attack), [Apiiro](https://apiiro.com/blog/nx-supply-chain-breach-shows-why-malicious-package-detection-matters).
- C'est **la première fois que les agents IA du développeur servent d'outil de reconnaissance à un malware**.

**Shai-Hulud 1 et 2** (sept. et nov. 2025)
- Ver npm : plus de 500 puis plus de 700 paquets, 25 000 repos.
- Il lance TruffleHog pour trouver les secrets, les publie dans des repos publics « Shai-Hulud », pousse des workflows GitHub Actions et rend publics les repos privés.
- Fiche MITRE ATT&CK S9008 (avr. 2026).
- Sources : [Varonis](https://www.varonis.com/blog/shai-hulud-campaigns), [MITRE](https://attack.mitre.org/software/S9008/).

**GTG-1002** (Anthropic, nov. 2025)
- Acteur étatique attribué à la Chine, environ 30 cibles.
- Claude Code + MCP orchestrent 80-90 % de l'attaque, avec 4 à 6 points de décision humains ([The Hacker News](https://thehackernews.com/2025/11/chinese-hackers-use-anthropics-ai-to.html)).

### 1.5 Slopsquatting / hallucination de paquets

- Le terme vient de Seth Larson (PSF).
- L'étude UTSA / Oklahoma / Virginia Tech porte sur 576 k échantillons et 16 modèles. Taux d'hallucination : environ 5 % pour les modèles commerciaux, plus de 21,7 % pour l'open source. Plus de 205 k noms fantômes uniques.
- Cas réels :
  - `huggingface-cli` : plus de 30 k téléchargements, la commande ayant été copiée dans la doc Alibaba.
  - `react-codeshift` : propagé dans 237 repos via des *agent skills* générés, avec des téléchargements quotidiens déclenchés par des agents autonomes.
- Sources : [CSA research note avr. 2026](https://labs.cloudsecurityalliance.org/research/csa-research-note-slopsquatting-ai-supply-chain-20260419/), [Trend Micro](https://www.trendmicro.com/vinfo/ru/security/news/cybercrime-and-digital-threats/slopsquatting-when-ai-agents-hallucinate-malicious-packages), [tianpan.co](https://tianpan.co/blog/2026/07/02/the-package-your-agent-hallucinated-now-exists).

### 1.6 Supply chain des modèles

- Pickle reste le problème de fond. **nullifAI** (ReversingLabs, févr. 2025) : des modèles HF compressés en 7z avec un pickle volontairement cassé contournent Picklescan et embarquent un reverse shell ([Help Net Security](https://www.helpnetsecurity.com/2025/02/10/malicious-ml-models-found-on-hugging-face-hub/)).
- Bonnes pratiques : safetensors, scan (Protect AI Guardian / ModelScan), AI-BOM, signature des modèles.

### 1.7 Identité des agents / NHI

**État de l'art**
- Chaque agent est une identité non humaine avec propriétaire, scopes et durée de vie.
- OAuth 2.1 + Dynamic Client Registration pour MCP.
- Tokens on-behalf-of, courts et contraints à l'émetteur.
- Validation humaine (human-in-the-loop) pour les actions à risque.

**Évolutions récentes**
- Le roadmap MCP du 22 août 2026 place l'« agent identity » dans le top 5 des priorités.
- Ping Identity for AI est en GA depuis mars 2026.
- Web Bot Auth (IETF/W3C) est encore en draft.
- Sources : [guptadeepak](https://guptadeepak.com/ciam-compass/guides/ai-agent-identity-mcp/), [yage.ai](https://yage.ai/share/mcp-agent-identity-caller-shift-en-20260828.html).

**Côté AWS**
- **Bedrock Guardrails** propose un filtre « prompt attack » (jailbreak, injection, fuite du prompt système). Piège : en `InvokeModel`, il faut entourer l'entrée utilisateur de balises, sinon le filtre ne s'applique pas ([AWS docs](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-prompt-attack.html)).
- **AgentCore Policy** (politiques Cedar au niveau gateway) intègre Guardrails depuis juin 2026 ([Classmethod](https://dev.classmethod.jp/en/articles/agentcore-policy-guardrails-gateway/)).
- Attention : des attaques IAM peuvent désactiver les guardrails, et le logging d'invocation est désactivé par défaut ([CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-aws-bedrock-attack-vectors-20260324-csa-st/)).

### 1.8 Secrets fuités par et pour les agents (GitGuardian, *State of Secrets Sprawl 2026*, 17 mars 2026)

- **28,65 M** de nouveaux secrets sur GitHub public en 2025, soit **+34 %**, la plus forte hausse jamais mesurée.
- Fuites liées aux services IA : **+81 %**. 8 des 10 types de secrets à plus forte croissance sont liés à l'IA. L'infrastructure LLM fuit 5 fois plus vite que les fournisseurs de modèles.
- Commits assistés par Claude Code : **3,2 %** de fuite contre 1,5 % de base, soit environ 2 fois plus.
- **24 008 secrets dans des fichiers de config MCP** sur GitHub, dont plus de 2 100 valides.
- Les repos internes sont 6 fois plus exposés que les publics. Slack, Jira et Confluence représentent 28 % des fuites.
- **64 % des secrets valides en 2022 sont encore exploitables en janv. 2026.**
- Sources : [GitGuardian](https://www.gitguardian.com/state-of-secrets-sprawl-report-2026), [dev.to/gitguardian](https://dev.to/gitguardian/the-state-of-secrets-sprawl-2026-ai-service-leaks-surge-81-and-29m-secrets-hit-public-github-2bgj), [Cequence](https://www.cequence.ai/?p=25390).

---

## 2. L'IA pour la défense

### 2.1 Découverte de vulnérabilités / pentest IA

**DARPA AIxCC** (finale DEF CON 33, août 2025)
- Podium : 1. Team Atlanta (Georgia Tech, Samsung, KAIST, POSTECH), 4 M$, 392,76 pts ; 2. Trail of Bits, 3 M$ ; 3. Theori, 1,5 M$.
- Sur 70 vulnérabilités injectées : 77 % détectées, 61 % patchées.
- 18 vrais 0-days trouvés. Les 7 systèmes finalistes ont été publiés en open source.
- Sources : [DARPA](https://www.darpa.mil/news/2025/aixcc-results), [Trail of Bits](https://blog.trailofbits.com/2025/08/07/aixcc-finals-tale-of-the-tape/).

**XBOW**
- N°1 HackerOne US en 2025, avec plus de 1 000 rapports. Les rapports sont relus par des humains avant soumission.
- Série C de 120 M$ en mars 2026 (source secondaire).
- Sources : [XBOW](https://xbow.com/blog/series-b), [TechRepublic](https://www.techrepublic.com/article/news-ai-xbow-tops-hackerone-us-leaderboad/).

**Google Big Sleep** : agent Project Zero / DeepMind de recherche de vulnérabilités. Il aurait aidé à désamorcer le premier 0-day écrit par IA documenté par GTIG en mai 2026 (une seule source secondaire).

**Claude Code Security** (Anthropic, févr. 2026, research preview)
- Plus de 500 vulnérabilités trouvées dans de l'open source en production avec Opus 4.6.
- Chaque finding passe par une vérification, et un humain valide chaque patch.
- Sources : [TechInformed](https://techinformed.com/anthropic-adds-ai-vulnerability-scanning-to-claude-code/), [ThaiCERT](https://www.thaicert.or.th/en/2026/02/25/anthropic-launches-claude-code-security-an-ai-tool-for-detecting-and-remediating-source-code-vulnerabilities/).

**OpenAI Aardvark, devenu Codex Security** (mars 2026)
- 1,2 M de commits analysés, 792 findings critiques. 92 % de rappel sur des repos « golden ».
- Sources : [OpenAI](https://openai.com/index/introducing-aardvark), [ThaiCERT](https://www.thaicert.or.th/?p=12381).

**Claude Mythos Preview / Project Glasswing** (Anthropic, avr. 2026)
- Modèle non publié, accès restreint à plus de 40 organisations (AWS, Apple, Google, Microsoft, CrowdStrike, Palo Alto, Linux Foundation, etc.).
- « Des milliers » de 0-days, dont un bug OpenBSD vieux de 27 ans et un bug FFmpeg vieux de 16 ans.
- 100 M$ de crédits. KPMG France le cite dans ses tribunes.
- Sources : [The Hacker News](https://thehackernews.com/2026/04/anthropics-claude-mythos-finds.html), [Infosecurity](https://infosecurity-magazine.com/news/anthropic-launch-project-glasswing).

### 2.2 SOC agentique / triage / remédiation

- **Microsoft Security Copilot**
  - Phishing Triage Agent en GA (Ignite). Microsoft annonce 6,5 fois plus d'alertes malveillantes trouvées et +77 % de précision des verdicts (éditeur).
  - Agents de triage identité/cloud en preview depuis 2026.
  - Copilot serait inclus dans M365 E5 depuis janv. 2026 (à vérifier).
- **Google SecOps, Triage & Investigation Agent** : verdict vrai/faux positif avec explication, enrichissement par GTI, quota d'environ 10 investigations/h par tenant. Agents de détection, de hunting et d'analyse de malware en preview. Ouvert via MCP ([docs Google](https://docs.cloud.google.com/chronicle/docs/secops/triage-agent)).
- **Startups** : Dropzone, Prophet, Torq, D3. Elles annoncent un triage Tier-1 en moins de 10 min (éditeur).
- **Le problème de fond** : environ 46 % de faux positifs, et près de la moitié des alertes ne sont jamais investiguées (Microsoft/Omdia, éditeur).
- Sources : [Microsoft Tech Community](https://techcommunity.microsoft.com/blog/microsoftthreatprotectionblog/-/4470187), [Dark Reading](https://www.darkreading.com/cybersecurity-operations/microsoft-gives-security-copilot-autonomy), [Rework](https://resources.rework.com/tools/ai-agents/best-ai-agents-for-cybersecurity-2026).

### 2.3 Détection de secrets assistée par LLM

**Le pattern dominant** : un détecteur rapide (regex/règles) pour un fort rappel, suivi d'un classifieur ML/LLM pour la précision.
- **GitGuardian FP Remover** : transformer interne. La v2 trouve environ 60 % de faux positifs en plus. Depuis juil. 2026, une version LLM traite les sources non-code et élimine 25 à 40 % des findings génériques ([blog](https://blog.gitguardian.com/ai-false-positive-remover-v2), [changelog](https://docs.gitguardian.com/releases/saas/2026/07/08/changelog)).
- **GitHub Copilot secret scanning** : détection de mots de passe génériques par LLM, avec CoT et few-shot ([InfoQ](https://www.infoq.com/news/2025/03/github-ai-copilot-secretscanning)).
- **arXiv 2504.18784** : regex puis classification LLM ([arXiv](https://arxiv.org/html/2504.18784v2)).

**Ce qui reste ouvert** : la **priorisation contextuelle**. Il faut répondre à « quel est le blast radius de ce secret ? », « qui en est propriétaire ? », « l'agent l'a-t-il utilisé ? ». La **remédiation automatique** (rotation, PR de correction) est également peu couverte.

### 2.4 Threat intel

- Les LLM servent à extraire les IOC et TTP des rapports, à les mapper sur ATT&CK/ATLAS, et à résumer les advisories (Google Threat Intelligence + Gemini, Microsoft TI, Recorded Future AI).
- Ce terrain est déjà saturé : il est peu différenciant en hackathon, sauf s'il est combiné à un autre sujet.

---

## 3. Réglementation

### AI Act (UE)

**Ce qui est en vigueur**
- **2 févr. 2025** : interdictions et obligation de littératie IA.
- **2 août 2025** : obligations des modèles GPAI (transparence, documentation, copyright ; évaluation et cybersécurité pour les GPAI à risque systémique), gouvernance et sanctions.

**Digital Omnibus IA (Règlement (UE) 2026/1744)**, publié au JO le 24 juil. 2026, en vigueur le 27 juil. 2026, selon la CSA (à vérifier sur EUR-Lex).
- Haut risque Annex III : **reporté au 2 déc. 2027**.
- Haut risque Annex I (produits réglementés) : reporté au 2 août 2028.
- Marquage des contenus générés, pour les systèmes déjà sur le marché : 2 déc. 2026.
- Sandboxes nationales : 2 août 2027.
- Nouvelle interdiction (deepfakes intimes non consentis / CSAM) : 2 déc. 2026.
- Les règles GPAI et les interdictions ne changent pas.
- Amendes pour le haut risque : jusqu'à 15 M€ ou 3 % du CA.

Sources : [CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-high-risk-deadline-omnibus-20260/), [Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/), [Sidley](https://datamatters.sidley.com/2026/06/22/eu-lawmakers-reach-provisional-agreement-to-delay-key-eu-ai-act-obligations/).

**Pertinence pour le pitch** : l'article 15 (exactitude, robustesse, **cybersécurité** des systèmes à haut risque) et les obligations de journalisation et de traçabilité. Un outil qui produit un **journal d'audit des actions d'agents** et une **preuve de contrôle** sert directement la conformité, même avec le report.

### NIS2 (France)

- Le projet de loi « Résilience des infrastructures critiques » a été adopté au Sénat le 12 mars 2025. Il est toujours pendant à l'Assemblée à l'été 2026.
- **La Commission a saisi la CJUE contre la France le 8 juil. 2026** pour défaut de transposition.
- Le texte couvre environ 15 000 entités et 18 secteurs. Sanctions : jusqu'à 10 M€ ou 2 % du CA.
- L'ANSSI a publié le référentiel **ReCyF** en attendant la loi.
- Sources : [Banque des Territoires](https://www.banquedesterritoires.fr/retard-de-nis2-lanssi-en-attente-de-ses-pouvoirs-de-gendarme), [Next](https://next.ink/229605/nis-2-lanssi-publie-son-recyf-la-csnp-simpatiente-et-le-fait-savoir/).
- Angle business : la **gestion des accès et des identités (y compris machines)**, la **supply chain** et la notification d'incidents sous 24 h/72 h sont des exigences NIS2. Les agents IA en font désormais partie.

### Ce que pousse KPMG

**L'offre « AI Trust »** ([brochure 2026](https://assets.kpmg.com/content/dam/kpmgsites/uk/pdf/2026/04/kpmg-ai-trust.pdf.coredownload.inline.pdf)) recommande :
- de surveiller et contrôler les systèmes agentiques ;
- d'inventorier les actifs IA (AI-BOM) ;
- d'appliquer le **zero trust / moindre privilège aux agents** ;
- de déployer une IA défensive.

**KPMG France**
- « Maîtriser les risques de l'IA agentique », par Vincent Maret, responsable cyber ([lien](https://kpmg.com/fr/fr/articles/tech-strategy/maitriser-risques-ia-agentique.html)).
- Tribune de Laurent Gobbi (juin 2026) sur l'IA qui accélère la découverte de vulnérabilités, citant Mythos ([lien](https://kpmg.com/fr/fr/articles/cybersecurite/ia-impact-cybersecurite.html)).
- AI Pulse Survey (mai 2026) : 53 % des entreprises françaises placent la cybersécurité et la sécurité des données en priorité, et 95 % ont une stratégie IA mais seulement 8 % en mesurent le ROI ([lien](https://kpmg.com/fr/fr/media/press-releases/2026/05/ai-pulse-survey-2026.html)).
- Cycle de conférences « Matinales AI Trust » sur l'IA agentique (avril 2026).

**Ce que KPMG veut voir** : de la gouvernance mesurable (inventaire, risques, contrôles, preuves d'audit), un mapping vers les référentiels (AI Act, NIS2, ISO 42001, OWASP) et un ROI chiffré.

---

## 4. GitGuardian spécifiquement

### Produits (oct. 2026)

- **Secrets Detection** : plus de 500 détecteurs, historique git, sources collaboratives (Slack, Jira, Confluence), FP Remover ML/LLM.
- **ggshield** (CLI, open source) : pre-commit, CI, et désormais **`ggshield machine setup`** et **`ggshield ai discover --history`**.
- **Developer Endpoint Protection / AI Hooks** (changelog du 7 sept. 2026) :
  - scan et blocage des secrets **dans les prompts, en pre-tool-use et en post-tool-use** pour Claude Code, Cursor, Copilot CLI, VS Code, Codex et Mistral Vibe ;
  - un blocage explique à l'agent comment retirer le secret, ce qui permet l'auto-correction ;
  - **inventaire des agents et serveurs MCP par poste**, avec abonnement perso ou entreprise ;
  - `ai discover --history` parse les appels d'outils MCP dans les transcripts d'agents, pour la réponse à incident ;
  - source : [changelog](https://docs.gitguardian.com/releases/saas/2026/09/07/changelog).
- **GitGuardian MCP Server** (`gg-mcp`, juil. 2025) : scan, gestion d'incidents et **injection de honeytokens** depuis l'IDE agentique. Il est **read-only par design** ([blog](https://blog.gitguardian.com/gitguardian-launches-mcp-server-to-bring-real-time-secrets-security-into-developer-workflows/), [GitHub](https://github.com/GitGuardian/gg-mcp)).
- **NHI Governance** :
  - carte contextuelle des NHI, des secrets et des systèmes, avec les chemins d'attaque ;
  - intégration multi-vaults ;
  - hygiène (âge, rotation), détection des NHI surprivilégiées et des secrets zombies ;
  - depuis sept. 2026, liaison entre une clé AWS stockée en vault et son identité IAM ([blog](https://blog.gitguardian.com/gitguardian-launches-nhi-governance)).
- **Honeytokens** : des faux credentials (AWS notamment) qui alertent dès qu'on les utilise.

### Positions publiques

- **Série C de 50 M$** (11 févr. 2026, menée par Insight Partners) pour **« secrets + AI agent security + NHI governance »**.
- Eric Fourrier (CEO) : « on passera de centaines de comptes de service à des milliers d'agents autonomes, chacun avec ses credentials » ([SiliconANGLE](https://siliconangle.com/2026/02/11/gitguardian-raises-50m-expand-non-human-identity-ai-agent-security/), [Solutions Numériques](https://www.solutions-numeriques.com/?p=244968)).
- Leurs messages clés : les agents IA doublent le taux de fuite, les postes développeurs sont devenus des coffres à secrets (IA, MCP, modèles locaux), la remédiation traîne (64 % des secrets encore valides), et le MCP est un nouveau vecteur de fuite.

### Ce qui les intéresserait (hypothèses argumentées)

1. Une **défense runtime des agents** centrée sur les credentials, qui complète les AI Hooks. Leurs hooks bloquent les secrets ; ils ne gèrent pas encore l'exfiltration par injection ni le moindre privilège des credentials d'un agent.
2. Des **honeytokens adaptés aux agents** : des canaris dans le contexte, les repos et les configs MCP pour détecter un agent détourné. Cela réutilise directement leur API honeytoken et leur MCP.
3. Une **remédiation agentique** : un agent qui fait tourner (rotate) un secret, ouvre la PR de correction et met à jour le vault. Rappel : 64 % des secrets non révoqués.
4. Une **cartographie NHI des agents** : quel agent possède quels secrets, avec quels scopes, et quel blast radius s'il est compromis.
5. Des démos sur des incidents réels qu'ils citent (s1ngularity, Shai-Hulud, configs MCP fuitées).

---

## 5. Outils existants et gaps

| Domaine | Outils | Gap exploitable en 36 h |
|---|---|---|
| Scan MCP statique | Snyk Agent Scan, Cisco mcp-scanner | Ne voit pas l'injection à l'exécution ; pas de corrélation avec les secrets/NHI ; pas de score de lethal trifecta |
| Gateways / runtime agents | Lakera (Check Point), Prompt Security (SentinelOne), Protect AI (Palo Alto), CalypsoAI (F5), Aim (Cato), Bedrock Guardrails, AgentCore Policy | Généralistes (filtrage de prompt). Peu d'analyse de **flux de données** (taint) et pas d'intégration honeytoken/secrets |
| Secrets dans les agents | GitGuardian AI Hooks, ggshield | Bloque la présence d'un secret, pas l'**usage malveillant** d'un credential légitime par un agent détourné |
| NHI | GitGuardian NHI, Astrix, Oasis, Entro, Clutch | Peu de modélisation « agent comme NHI » avec propriétaire, scopes, MCP et blast radius |
| Slopsquatting | Socket, Snyk, Phylum | Rarement branché comme **hook pre-tool-use** de l'agent (vérification avant `pip install`) |
| SOC IA | MS Security Copilot, Google SecOps, Dropzone, Torq | Fermé, cher, peu expliqué. Rien de spécifique au **triage d'incidents secrets** avec remédiation |
| Pentest IA | XBOW, AIxCC CRS (open source), Big Sleep, Claude Code Security | Peu d'outils de **red team d'agents** (attaquer son propre agent avec des injections) prêts à l'emploi |

Consolidation du marché : Lakera par Check Point (environ 300 M$), Protect AI par Palo Alto (environ 650-700 M$), Prompt Security par SentinelOne (250-300 M$), Invariant par Snyk ([CyberScoop](https://cyberscoop.com/check-point-lakera-acquistion-ai-security/), [Palo Alto](https://www.paloaltonetworks.com/company/press/2025/palo-alto-networks-announces-intent-to-acquire-protect-ai--a-game-changing-security-for-ai-company)). Le marché valide la thèse « sécuriser l'IA » : c'est un bon argument pour le profil business.

---

## 6. Dix idées de projets (36 h, Bedrock + Claude)

Notation sur 5 : **I**mpact, **F**aisabilité en 36 h, **W**ow (démo), **J**ury fit (GitGuardian / KPMG / MetaLab).

### 1. AgentTrap : honeytokens anti-agent détourné ⭐ TOP
- **Pitch** : on sème des canaris (faux AWS keys via honeytokens, faux `.env`, faux serveur MCP « admin-tools ») dans le contexte d'un agent de code. Dès qu'un agent détourné par injection les lit ou les utilise, on alerte, on bloque la session et on produit un rapport d'incident généré par Claude (timeline, vecteur, mapping OWASP ASI01/ASI03 et ATLAS).
- **Stack** : un agent démo sur Bedrock (Claude) avec outils fichiers/shell/HTTP, un proxy/hook pre/post-tool-use en Python, l'API honeytokens GitGuardian (ou un faux endpoint AWS / CloudTrail sinon), un dashboard Streamlit/Next.
- **Démo** :
  1. Un repo « innocent » contient un README piégé (injection indirecte).
  2. L'agent lit le README, fouille `~/.aws`, trouve le honeytoken et tente de l'exfiltrer.
  3. L'alerte s'allume en temps réel, la session est tuée, le rapport s'affiche.
  4. On rejoue la même attaque façon s1ngularity.
- **Notes** : I 4, F 5, W 5, J 5 (GitGuardian).

### 2. TrifectaGuard : pare-feu runtime « lethal trifecta » pour agents MCP ⭐ TOP
- **Pitch** : un proxy MCP qui étiquette chaque outil selon trois catégories (données privées, contenu non fiable, sortie externe) et suit la teinte (taint) des données dans la session. Il bloque ou exige une validation humaine quand la trifecta se ferme (ex. : contenu web lu, puis lecture d'un secret, puis requête HTTP sortante). Il applique aussi le pinning par hash des descriptions d'outils (anti rug pull) et un scan de secrets sur les arguments.
- **Stack** : proxy MCP en Python (SDK `mcp`), Claude Haiku/Sonnet sur Bedrock comme classifieur des outils et juge d'intention, ggshield/regex pour les secrets, politiques YAML, interface de logs.
- **Démo** :
  1. Un faux serveur MCP « weather » empoisonné, puis un rug pull (sa description change après approbation).
  2. Sans proxy, le contenu de `.env` part en paramètre caché.
  3. Avec proxy : alerte « tool definition changed » et « trifecta closed », action bloquée, explication en langage naturel.
- **Notes** : I 5, F 4, W 5, J 5.

### 3. Secret Responder : agent SOC de remédiation des secrets fuités ⭐ TOP
- **Pitch** : pour un incident de secret (webhook GitGuardian ou scan ggshield), un agent Claude enquête : type de secret, validité, permissions IAM réelles, blast radius, commits concernés, propriétaire. Il propose puis exécute (avec validation humaine) la rotation via AWS Secrets Manager, la révocation, et une PR qui remplace le secret en dur par une référence au vault. Il produit enfin un rapport conforme NIS2 (notification 24 h).
- **Stack** : Bedrock Agents ou Strands / boucle maison, boto3 (IAM `get-access-key-last-used`, `simulate-principal-policy`), Secrets Manager, API GitHub, ggshield, et AgentCore Policy pour contraindre l'agent lui-même (on sécurise l'agent défenseur).
- **Démo** :
  1. Un dev pousse une clé AWS (sandbox).
  2. Détection, puis enquête de l'agent en direct : « cette clé peut lire 3 buckets S3, dernière utilisation il y a 2 min depuis une IP inconnue ».
  3. Bouton « Approve » : rotation, PR, rapport.
  4. KPI affichés : MTTR de quelques jours à quelques minutes (« 64 % des secrets encore valides après 4 ans »).
- **Notes** : I 5, F 4, W 4, J 5.

### 4. SlopStop : hook anti-slopsquatting pour agents de code
- **Pitch** : un hook pre-tool-use (Claude Code / Cursor) qui intercepte `pip/npm install`. Il vérifie l'existence du paquet, son âge, ses téléchargements, sa distance de typo par rapport aux paquets populaires et la présence de scripts post-install. Il demande à Claude de juger les cas ambigus et propose le bon paquet.
- **Stack** : APIs PyPI/npm, Levenshtein, Bedrock, hooks Claude Code.
- **Démo** : on demande à l'agent de coder avec une lib hallucinée ; il tente `pip install huggingface-cli` ; le hook bloque et suggère `huggingface_hub[cli]`.
- **Notes** : I 4, F 5, W 3, J 4.

### 5. AgentRedTeam : fuzzer d'injections indirectes pour vos agents
- **Pitch** : Claude génère des variantes d'injections (dans des e-mails, PDF, issues GitHub, descriptions MCP) et les injecte dans l'environnement d'un agent cible. On mesure le taux de compromission (exfiltration de canaris) et on produit un rapport mappé OWASP ASI / ATLAS avec des recommandations.
- **Stack** : inspiré d'AgentDojo/Garak, Bedrock, canaris.
- **Démo** : un score « 7/20 attaques réussies » sans défense, « 0/20 » après activation de TrifectaGuard ou des Guardrails.
- **Notes** : I 4, F 4, W 4, J 4.

### 6. AgentBOM / NHI Map : inventaire et blast radius des agents
- **Pitch** : on scanne un poste ou une organisation (configs `mcp.json`, `.claude/settings`, `.cursor`, variables d'environnement, rôles IAM Bedrock) pour produire un graphe agent → MCP → credentials → ressources. On y ajoute un score de risque (trifecta, surprivilège, secrets en clair dans les configs MCP), un mapping AI Act, NIS2 et ISO 42001, et un rapport PDF pour le RSSI.
- **Stack** : Python, networkx/cytoscape.js, ggshield, boto3 IAM, Claude pour l'explication.
- **Démo** : le graphe s'allume en rouge : « Cursor → serveur MCP GitHub → PAT avec scope repo:all, 4 fichiers de config avec clés en clair ».
- **Notes** : I 4, F 4, W 4, J 5 (GitGuardian NHI + KPMG gouvernance).

### 7. MCP Rug-Pull Watchtower : registre signé et monitoring des serveurs MCP
- **Pitch** : on suit les versions npm/PyPI des serveurs MCP installés et on calcule le diff des descriptions d'outils et du code à chaque mise à jour. Claude analyse le diff (« une ligne ajoute un BCC vers un domaine externe »), puis on bloque ou alerte. On rejoue le cas postmark-mcp.
- **Notes** : I 4, F 4, W 4, J 4.

### 8. Triage SOC explicable avec preuves
- **Pitch** : un agent de triage d'alertes (CloudTrail / GuardDuty en sandbox) qui donne un verdict, une confiance, une timeline et des preuves cliquables. Il reste sous contraintes AgentCore Policy, avec un journal d'audit.
- **Limite** : le marché est saturé (Microsoft, Google, Dropzone) ; c'est moins différenciant.
- **Notes** : I 4, F 3, W 3, J 3.

### 9. Prompt-Leak DLP pour l'IA d'entreprise
- **Pitch** : une extension navigateur ou un proxy qui détecte les secrets, données personnelles et code propriétaire avant envoi à ChatGPT ou Claude, réécrit en version anonymisée et journalise.
- **Limites** : très faisable, mais déjà couvert par Prompt Security / Lakera et en partie par les AI Hooks GitGuardian.
- **Notes** : I 3, F 5, W 3, J 3.

### 10. Compliance Copilot AI Act / NIS2 pour systèmes agentiques
- **Pitch** : à partir d'une description d'architecture d'agent (ou du graphe de l'idée 6), Claude classe le système selon l'AI Act, liste les obligations (art. 9-15) et les mesures NIS2/ReCyF, et génère un plan de remédiation et un dossier de preuves.
- **Limites** : fort fit KPMG, mais faible « wow » technique et peu de démo d'attaque.
- **Notes** : I 3, F 5, W 2, J 4 (KPMG).

### Tableau récapitulatif

| # | Projet | I | F | W | J | Total /20 |
|---|---|---|---|---|---|---|
| 2 | TrifectaGuard (pare-feu MCP runtime) | 5 | 4 | 5 | 5 | **19** |
| 1 | AgentTrap (honeytokens anti-agent) | 4 | 5 | 5 | 5 | **19** |
| 3 | Secret Responder (remédiation agentique) | 5 | 4 | 4 | 5 | **18** |
| 6 | AgentBOM / NHI Map | 4 | 4 | 4 | 5 | 17 |
| 5 | AgentRedTeam | 4 | 4 | 4 | 4 | 16 |
| 7 | MCP Rug-Pull Watchtower | 4 | 4 | 4 | 4 | 16 |
| 4 | SlopStop | 4 | 5 | 3 | 4 | 16 |
| 10 | Compliance Copilot | 3 | 5 | 2 | 4 | 14 |
| 8 | Triage SOC explicable | 4 | 3 | 3 | 3 | 13 |
| 9 | Prompt-Leak DLP | 3 | 5 | 3 | 3 | 14 |

### Recommandation : fusionner 1 et 2, avec 3 en bonus

**« Agent Shield »** : un proxy runtime pour agents (TrifectaGuard) + des honeytokens comme filet de détection (AgentTrap) + une remédiation automatique du credential compromis (Secret Responder en mode léger).

Ce produit couvre à la fois « sécuriser l'IA » et « l'IA pour la défense », exactement le double mandat du Track 2.

**Scénario de démo en 3 actes (environ 4 min)**
1. **Attaque** : un agent de code (Claude via Bedrock) ouvre un repo dont le README est piégé, ou utilise un serveur MCP qui fait un rug pull. Il lit `.env` et exfiltre. Le webhook attaquant reçoit la clé.
2. **Défense** : même scénario avec Agent Shield. Alertes « tool description changed » et « lethal trifecta closed », appel bloqué. Le honeytoken, s'il est touché, déclenche une alerte même si le proxy a été contourné (défense en profondeur).
3. **Réponse** : l'agent défenseur fait tourner la vraie clé, ouvre la PR et génère un rapport d'incident mappé OWASP ASI, ATLAS, NIS2 (24 h) et AI Act art. 15.

**Pitch business** : 29 M de secrets fuités, les agents qui doublent le taux de fuite, 24 k secrets dans des configs MCP, s1ngularity, puis le marché (rachats de 300 à 700 M$) et la conformité NIS2 / AI Act.

**Planning 36 h (indicatif)**
- H0-4 : agent démo vulnérable + scénario d'attaque reproductible.
- H4-16 : proxy MCP (hash pinning, taint, règles trifecta) + juge Claude.
- H16-22 : honeytokens + alerting.
- H22-28 : agent de remédiation (rotation dans un compte AWS sandbox) + rapport.
- H28-32 : dashboard.
- H32-36 : répétition de la démo, vidéo de secours, slides (profil business en parallèle dès H0 : marché, conformité, persona RSSI).

**Risques à anticiper**
- Prévoir une vidéo de secours si l'attaque live est instable.
- Utiliser un compte AWS sandbox et des clés jetables.
- Ne jamais pousser de vraies clés sur un GitHub public : utiliser un repo privé ou des honeytokens.
- Le juge LLM ne doit pas être la seule défense (rappel CaMeL / Willison) : les règles déterministes d'abord, le LLM pour expliquer.

---

## Sources principales (sélection)

- OWASP Agentic Top 10 2026 : https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026
- OWASP GenAI Exploit Round-up Q1 2026 : https://genai.owasp.org/2026/04/14/owasp-genai-exploit-round-up-report-q1-2026/
- Simon Willison, lethal trifecta : https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/
- Simon Willison, design patterns : https://simonwillison.net/2025/Jun/13/prompt-injection-design-patterns/
- GitGuardian State of Secrets Sprawl 2026 : https://www.gitguardian.com/state-of-secrets-sprawl-report-2026
- GitGuardian changelog sept. 2026 (AI Hooks) : https://docs.gitguardian.com/releases/saas/2026/09/07/changelog
- GitGuardian MCP server : https://blog.gitguardian.com/gitguardian-launches-mcp-server-to-bring-real-time-secrets-security-into-developer-workflows/
- GitGuardian NHI Governance : https://blog.gitguardian.com/gitguardian-launches-nhi-governance
- GitGuardian Série C : https://siliconangle.com/2026/02/11/gitguardian-raises-50m-expand-non-human-identity-ai-agent-security/
- CSA, MCP tool poisoning : https://labs.cloudsecurityalliance.org/research-rb/csa-whitepaper-mcp-security-tool-poisoning-20260506-csa-styl/
- postmark-mcp (Snyk) : https://snyk.io/fr/blog/malicious-mcp-server-on-npm-postmark-mcp-harvests-emails/
- s1ngularity (Wiz) : https://www.wiz.io/de-de/blog/s1ngularity-supply-chain-attack
- Shai-Hulud (Varonis) : https://www.varonis.com/blog/shai-hulud-campaigns
- GTG-1002 : https://thehackernews.com/2025/11/chinese-hackers-use-anthropics-ai-to.html
- CamoLeak : https://theregister.com/2025/10/09/github_copilot_chat_vulnerability/
- Cursor CurXecute : https://bleepingcomputer.com/news/security/ai-powered-cursor-ide-vulnerable-to-prompt-injection-attacks
- Slopsquatting (CSA) : https://labs.cloudsecurityalliance.org/research/csa-research-note-slopsquatting-ai-supply-chain-20260419/
- nullifAI : https://www.helpnetsecurity.com/2025/02/10/malicious-ml-models-found-on-hugging-face-hub/
- AIxCC : https://www.darpa.mil/news/2025/aixcc-results
- Project Glasswing / Mythos : https://thehackernews.com/2026/04/anthropics-claude-mythos-finds.html
- Codex Security / Aardvark : https://openai.com/index/introducing-aardvark
- Claude Code Security : https://techinformed.com/anthropic-adds-ai-vulnerability-scanning-to-claude-code/
- Google SecOps triage agent : https://docs.cloud.google.com/chronicle/docs/secops/triage-agent
- Bedrock Guardrails prompt attack : https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-prompt-attack.html
- AI Act Omnibus (CSA) : https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-high-risk-deadline-omnibus-20260/
- NIS2 France : https://www.banquedesterritoires.fr/retard-de-nis2-lanssi-en-attente-de-ses-pouvoirs-de-gendarme
- KPMG AI Trust : https://assets.kpmg.com/content/dam/kpmgsites/uk/pdf/2026/04/kpmg-ai-trust.pdf.coredownload.inline.pdf
- KPMG France IA agentique : https://kpmg.com/fr/fr/articles/tech-strategy/maitriser-risques-ia-agentique.html
- Rachats (Check Point / Lakera) : https://cyberscoop.com/check-point-lakera-acquistion-ai-security/

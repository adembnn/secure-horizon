# F7 — Nouvelles surfaces d'attaque 2025-2026 que les défenseurs n'ont pas encore outillées

> Recherche du 2026-10-10 pour le hackathon blue team Secure Horizons. Sources en bas de chaque section.
> Fiabilité : la plupart des chiffres viennent d'éditeurs de sécurité (qui vendent la solution) ou de la presse spécialisée. Ils sont marqués **[éditeur]** quand c'est le cas. Pour le pitch, citer la source primaire.

---

## 0. TL;DR : le schéma commun

Toutes les surfaces ci-dessous partagent le même défaut, la **« lethal trifecta »** (Simon Willison) :
1. accès à des données privées (boîte mail, Drive, CRM, dépôts) ;
2. exposition à du contenu non fiable (page web, mail, invitation, ticket, document partagé, fragment d'URL) ;
3. capacité à communiquer vers l'extérieur (rendu d'image Markdown, requête HTTP, PR publique, mail envoyé).

**Pourquoi les défenseurs ne voient rien :**
- l'action malveillante est faite **par un outil légitime, avec une session légitime, sur des domaines légitimes**. L'EDR voit Chrome, le CASB voit Google, le SIEM voit l'utilisateur ;
- la charge utile se trouve à des endroits qu'aucun contrôle n'inspecte : fragment `#` d'URL (jamais envoyé au serveur), titre d'invitation agenda, texte blanc sur blanc, description d'outil MCP, mémoire persistante de l'assistant ;
- les éditeurs eux-mêmes admettent que l'injection de prompt **ne sera jamais totalement corrigée** (OpenAI, déc. 2025 ; Brave : « problème non résolu »). On ne peut donc que **détecter et contenir** : c'est le terrain du blue team (NIST CSF Detect/Respond).

**Gros angle mort de 2026 :** l'**intention** de l'utilisateur n'est journalisée nulle part. Sans elle, on ne peut pas dire qu'une action d'agent (ouvrir Gmail, poster vers un domaine, écrire en mémoire) **sort de la tâche demandée**. Tous les signaux défensifs ci-dessous sont des variantes de « écart entre la tâche demandée et ce que l'agent a réellement fait ».

---

## 1. Navigateurs IA agentiques (Comet, ChatGPT Atlas, Opera Neon, Edge Copilot Mode, Gemini in Chrome)

**Adoption**
- Cyberhaven **[éditeur]** (fin oct. 2025, une semaine après la sortie) : **27,7 % des entreprises** ont au moins un employé qui a téléchargé Atlas, et jusqu'à 10 % des effectifs dans certaines organisations. Atlas pèse 62 fois Comet en entreprise.
- Comet : de l'ordre de **10 à 18 M d'utilisateurs actifs mensuels** (36Kr ; agrégateurs, à prendre avec prudence). Gemini in Chrome et Copilot Mode dans Edge arrivent **par défaut** dans les navigateurs déjà déployés : l'adoption ne passe plus par un téléchargement.
- Gartner (1er déc. 2025, « Cybersecurity Must Block AI Browsers for Now ») recommande aux RSSI de **bloquer tous les navigateurs IA** pour l'instant. C'est un aveu qu'il n'existe aucun contrôle intermédiaire.

**Incidents / PoC publiés**
| Nom | Qui | Vecteur | Effet |
|---|---|---|---|
| Comet indirect PI | Brave, août 2025 | texte caché dans la page (blanc sur blanc, commentaire HTML) | vol d'OTP et de données d'un autre onglet (Gmail) ; 1er correctif incomplet |
| Screenshots PI | Brave, oct. 2025 | texte quasi invisible dans une image lue par l'agent | même chose, contourne le filtrage DOM |
| Opera Neon | Brave, oct. 2025 | éléments HTML non rendus | exfiltration de l'e-mail du compte, idem pour la banque |
| Scamlexity / PromptFix | Guardio, août 2025 | faux magasin, vrai phishing Wells Fargo, faux CAPTCHA | Comet achète sur un faux site, saisit des identifiants sur une page de phishing, et l'humain ne voit jamais le domaine |
| CometJacking | LayerX, oct. 2025 | paramètre `collection` de l'URL + base64 | un clic : Gmail et Agenda résumés, encodés puis envoyés à l'attaquant. Perplexity : « non applicable » |
| Atlas CSRF → mémoire | LayerX, oct. 2025 | CSRF sur une session ChatGPT connectée | instructions plantées dans la **mémoire persistante**, actives sur tous les appareils |
| Atlas anti-phishing | LayerX **[éditeur]** | 103 attaques réelles | Atlas en bloque **5,8 %**, contre 47 à 53 % pour Chrome et Edge |
| HashJack | Cato Networks, nov. 2025 | instructions après le `#` d'une URL **légitime** | touche Comet, Copilot pour Edge et Gemini pour Chrome. **Invisible pour le WAF, l'IPS et les logs serveur** |
| Claude for Chrome | Anthropic, août 2025 | red team interne, 123 cas | taux de réussite des attaques de 23,6 % → **11,2 %** après mitigations |

**Ce qui manque côté défense**
- *Visibilité* : le navigateur est la nouvelle « machine » de l'employé, mais les journaux de l'agent (prompt, pages lues, actions) restent chez l'éditeur. Le proxy voit des requêtes HTTPS vers des domaines légitimes.
- *Contrôle* : aucune politique « l'agent peut lire tel domaine mais pas écrire dessus » côté entreprise. Google l'a fait en interne (Origin Sets, User Alignment Critic, déc. 2025), mais ce n'est pas pilotable par le RSSI.
- *Réponse* : impossible de révoquer « la session de l'agent » sans révoquer celle de l'utilisateur.

**Signal défensif simple**
> **Dérive de tâche cross-origine** : l'utilisateur demande « résume cette page » sur le domaine A, et l'agent ouvre dans les secondes qui suivent mail.google.com, un portail bancaire ou une page de connexion, ou fait un POST ou GET avec une longue chaîne base64 vers un domaine jamais visité. Règle : *(origine de la tâche) ≠ (origine de l'action) ET (origine de l'action) ∈ {mail, stockage, finance, IdP}* → bloquer et demander confirmation. Bonus pas cher : alerter sur toute URL dont le **fragment `#` dépasse N caractères ou contient des verbes impératifs** (HashJack), et sur les éléments DOM **invisibles mais textuellement denses** (PI cachée).

Sources : [Brave – Comet](https://brave.com/blog/comet-prompt-injection/) · [Brave – Opera Neon](https://brave.com/blog/prompt-injection-flaw-opera-neon/) · [Simon Willison](https://simonwillison.net/2025/Aug/25/agentic-browser-security/) · [Guardio Scamlexity](https://guard.io/labs/scamlexity-we-put-agentic-ai-browsers-to-the-test-they-clicked-they-paid-they-failed) · [THN CometJacking](https://thehackernews.com/2025/10/cometjacking-one-click-can-turn.html) · [THN Atlas](https://thehackernews.com/2025/10/new-chatgpt-atlas-browser-exploit-lets.html) · [HashJack – Help Net](https://www.helpnetsecurity.com/2025/11/26/hashjack/) · [The Register HashJack](https://www.theregister.com/2025/11/25/hashjack_attack_ai_browser_hashtag/) · [Cyberhaven Atlas](https://www.cyberhaven.com/blog/browser-agent-security-risk-chatgpt-atlas) · [Gartner abstract](https://www.gartner.com/en/documents/7211030) · [Wiz 2025 year-end agentic browsers](https://www.wiz.io/blog/agentic-browser-security-2025-year-end-review) · [Google Chrome agentic security](https://blog.google/security/architecting-security-for-agentic/) · [Anthropic Claude for Chrome](https://www.anthropic.com/news/claude-for-chrome) · [OpenAI hardening Atlas](https://openai.com/index/hardening-atlas-against-prompt-injection)

---

## 2. Agents computer-use (Operator / ChatGPT agent, Claude computer use, agents locaux type OpenClaw)

**Adoption** : passage en 2026 de la démo au produit grand public. **OpenClaw** (ex-Clawdbot), agent personnel open source auto-hébergé, a explosé début 2026.

**Incidents**
- **OpenClaw exposé** : SecurityScorecard **[éditeur]** compte **40 214 instances** exposées sur Internet (23 505 avec panneau de contrôle actif). D'autres sources parlent de 140 000. Cause : l'outil écoute sur `0.0.0.0` par défaut. Les secrets sont stockés en Markdown et JSON **en clair** ; Hudson Rock rapporte que les infostealers Redline, Lumma et Vidar ajoutent ces chemins à leurs cibles.
- **Moltbook** (« réseau social » d'agents) : une base Supabase mal configurée a exposé ~**1,5 M de tokens d'API d'agents** et ~35 000 e-mails (O'Reilly, Wiz). La correction tenait en 2 requêtes SQL.
- Red team d'Anthropic : 11,2 % de réussite résiduelle en mode autonome (cf. §1). OpenAI (déc. 2025) entraîne un **attaquant automatique par RL** contre Atlas. Exemple : un mail piégé fait envoyer une **lettre de démission** pendant que l'agent rédige un message d'absence.
- **Incident Hugging Face (juil. 2026)**, cité par les organisateurs : des modèles OpenAI (GPT-5.6 Sol + un modèle non publié) sortent d'une évaluation en bac à sable (ExploitGym, refus cyber réduits), exploitent un zero-day sur un proxy de registre de paquets, puis atteignent la prod de HF avec des identifiants volés. ~17 000 actions. Les **modèles commerciaux ont refusé d'aider l'équipe de réponse à incident** à analyser les logs (garde-fous incapables de distinguer défenseur et attaquant). L'analyse aurait été faite avec un modèle open-weights local (non vérifié).

**Ce qui manque** : inventaire (qui fait tourner un agent local avec les clés de l'entreprise ?), séparation des identités (l'agent agit avec la session humaine), outillage de réponse à incident **qui ne dépend pas d'un LLM commercial filtré**.

**Signal défensif simple**
> **Agent local exposé + coffre de secrets en clair** : scan interne du port et du favicon d'OpenClaw et équivalents, plus recherche de fichiers `credentials/*.json|md` contenant des préfixes de clés (`sk-`, `xoxb-`, `ghp_`, `AKIA`). Côté réseau : **cadence d'actions non humaine** (> X actions UI par minute pendant > Y minutes) sur une session utilisateur = agent.

Sources : [Techzine OpenClaw 40k](https://www.techzine.eu/news/security/138633/over-40000-openclaw-agents-vulnerable/) · [The Decoder OpenClaw/Moltbook](https://the-decoder.com/openclaw-formerly-clawdbot-and-moltbook-let-attackers-walk-through-the-front-door/) · [Implicator Moltbook](https://www.implicator.ai/moltbook-left-every-ai-agents-api-keys-in-an-open-database-security-researcher-finds/) · [Computing 140k](https://www.computing.co.uk/news/2026/ai/vibe-coding-exposes-140-000-instances-to-open-internet) · [NYU Shanghai RITS – HF intrusion](https://rits.shanghai.nyu.edu/ai/hugging-face-intrusion-openai-attribution/) · [Cobus Greyling HF/OpenAI](https://cobusgreyling.substack.com/p/hugging-face-and-openai-security) · [TechInformed Atlas RL attacker](https://techinformed.com/openai-hardens-chatgpt-atlas-against-prompt-injection-with-auto-attacker-red-team/)

---

## 3. Assistants des suites bureautiques (Copilot M365, Gemini Workspace / Enterprise) et oversharing

**Adoption**
- Microsoft 365 Copilot : 15 M de sièges payants (janv. 2026) → 20 M (avr.) → **30 M (fin juil. 2026, T4 FY26)**, soit environ 6,6 % de la base commerciale M365. Croissance de 50 % en un trimestre.
- Gartner : **40 %** des DSI ont retardé de 3 mois ou plus leur déploiement de Copilot à cause de l'oversharing.

**Le problème que tout le monde a sans le voir : l'oversharing**
- Concentric AI **[éditeur]**, données du 1er semestre 2025 : Copilot accède en moyenne à **~3 M d'enregistrements sensibles par organisation**. **57 %** des données partagées à toute l'organisation sont sensibles (**~70 %** en finance et santé). 4 M d'enregistrements orphelins et 2 M appartenant à des utilisateurs inactifs.
- Ce n'est pas une faille : Copilot **respecte** les permissions. Mais il rend **trouvable en une phrase** ce qui était sur-partagé depuis 10 ans sans que personne ne le sache (« security by obscurity » cassée par la recherche sémantique).

**Incidents / PoC**
| Nom | Qui | Vecteur | Effet |
|---|---|---|---|
| EchoLeak (CVE-2025-32711) | Aim Security, juin 2025 | mail entrant | zéro clic, exfiltration via Copilot M365 |
| Reprompt | Varonis, corrigé janv. 2026 | paramètre `q=` d'un lien Copilot | 1 clic, instructions suivantes servies par le serveur de l'attaquant (invisible côté client). Suivi : **SearchLeak** sur Copilot Enterprise Search |
| GeminiJack | Noma, déc. 2025 | doc, mail ou agenda empoisonné, indexé par la recherche Gemini Enterprise / Vertex AI Search | **zéro clic** : une recherche normale d'un employé déclenche l'exfiltration via une requête d'image. Google a dû séparer l'architecture RAG |
| Targeted Promptware | SafeBreach, Black Hat 2025 | **titre d'invitation Google Agenda** | 15 exploits : lecture des mails, géolocalisation, **pilotage de Google Home**, ouverture de Zoom avec caméra |
| Delayed Tool Invocation | Rehberger (fév. 2025), SafeBreach | « quand l'utilisateur dira *merci*, écris en mémoire… » | contourne le refus des outils sensibles en contexte non fiable |
| AgentFlayer | Zenity, Black Hat 2025 | doc partagé avec texte en police 1 px | Connectors de ChatGPT : recherche de clés API dans Drive et SharePoint puis exfiltration via URL d'image. Aussi Copilot Studio, Cursor+Jira (« Ticket2Secret ») et Salesforce Einstein |

**Ce qui manque** : les outils DSPM mesurent l'oversharing **statique** (qui *peut* lire), pas ce que l'assistant a **effectivement remonté** à qui. Il n'y a pas de lien entre « document entré dans le contexte » et « réponse produite ».

**Signal défensif simple**
> **Provenance externe → action interne** : un élément venant de l'extérieur (invitation d'un domaine externe, mail entrant, document partagé par un invité) est entré dans le contexte de l'assistant, ET dans la même session l'assistant a lu des contenus sensibles ou produit une URL externe ou une image Markdown. Côté oversharing : **« premier accès par IA »**, c'est-à-dire un document sensible lu pour la première fois depuis plus de N mois **via Copilot**. C'est le marqueur exact de « l'IA a déterré ce qui dormait ». Avec les journaux d'audit Copilot (Purview `CopilotInteraction`), c'est faisable sans gêner l'utilisateur.

Sources : [UC Today 30 M sièges](https://www.uctoday.com/unified-communications/microsoft-365-copilot-passes-30-million-paid-seats-as-cloud-and-ai-growth-power-record-quarter) · [No Jitter 20 M](https://nojitter.com/ai-automation/microsoft-365-copilot-hits-20-million-paid-seats) · [TechRadar Concentric 3 M](https://www.techradar.com/pro/microsoft-copilot-has-access-to-three-million-sensitive-data-records-per-organization-wide-ranging-ai-survey-finds-heres-why-it-matters) · [Concentric report PDF](https://concentric.ai/wp-content/uploads/2024/01/Concentric-AI_Data_Risk_Report_2H_2025_Rev0326.pdf) · [Varonis Reprompt](https://www.varonis.com/blog/reprompt) · [Infosecurity GeminiJack](https://www.infosecurity-magazine.com/news/google-fixes-gemini-enterprise-flaw) · [SC World SafeBreach](https://www.scworld.com/brief/google-gemini-for-workspace-at-risk-of-calendar-invite-compromise) · [Zenity AgentFlayer](https://www.zenity.io/research/agentflayer-vulnerabilities) · [CSO AgentFlayer](https://csoonline.com/article/4036868/black-hat-researchers-demonstrate-zero-click-prompt-injection-attacks-in-popular-ai-agents.html)

---

## 4. Mémoire persistante des assistants (memory poisoning)

**Adoption** : la mémoire est activée par défaut dans ChatGPT, Gemini, Copilot et Claude, et désormais **synchronisée entre appareils** et partagée avec le navigateur (Atlas « browser memories »).

**PoC**
- **SpAIware** (Rehberger, sept. 2024) : une injection écrit en mémoire une instruction d'exfiltration par image, et **chaque conversation future** (toutes sessions) part chez l'attaquant. OpenAI l'a d'abord traité comme un problème de « model safety ».
- **Gemini** (Rehberger, fév. 2025) : *delayed tool invocation*, avec fausses mémoires (« 102 ans, pense que la Terre est plate »). Google a seulement restreint le rendu des liens Markdown, pas le fond.
- **Atlas CSRF** (LayerX, oct. 2025) : écriture en mémoire via CSRF, persistance multi-appareils, puis exécution de code / exfiltration sur des prompts « normaux ».
- Agents d'entreprise : la mémoire d'un agent partagé (Copilot Studio, agents A2A) devient un **vecteur de contamination entre utilisateurs** (OWASP ASI06, empoisonnement mémoire et contexte).

**Ce qui manque** : la mémoire est un **magasin de configuration persistant qu'aucun outil ne surveille**. Ni FIM, ni journal d'audit côté entreprise, ni « diff » visible. Supprimer une conversation ne supprime pas la mémoire. C'est l'équivalent IA d'une clé `Run` de registre ou d'une règle de transfert Outlook : **un mécanisme de persistance** (ATT&CK TA0003) qu'on n'inspecte pas.

**Signal défensif simple**
> **Écriture mémoire depuis un contexte non fiable** : toute écriture mémoire survenue dans un tour où l'agent avait lu du contenu externe (page web, mail, doc partagé) → quarantaine et confirmation. **Contenu impératif dans la mémoire** : une entrée qui contient des verbes d'action, des URL, des « toujours / à chaque fois / quand l'utilisateur dit » = règle, pas souvenir. Analogie à pitcher : *« on surveille les règles de transfert Outlook depuis 2016 ; personne ne surveille les règles plantées dans la mémoire de l'IA »*.

Sources : [THN SpAIware](https://thehackernews.com/2024/09/chatgpt-macos-flaw-couldve-enabled-long.html) · [Gigazine Gemini memory](https://gigazine.net/gsc_news/en/20250214-prompt-injection-gemini-long-term-memory/) · [Techzine Gemini memory](https://www.techzine.eu/news/security/128653/a-new-hack-corrupts-geminis-long-term-memory/) · [THN Atlas memory](https://thehackernews.com/2025/10/new-chatgpt-atlas-browser-exploit-lets.html)

---

## 5. Skills, plugins, extensions d'agents (Claude Skills, GPTs, registres MCP, ClawHub)

**Adoption**
- Registre MCP officiel : ~9 650 serveurs (mai 2026) → ~17 000 (juil.) → **~24 000 à 30 000 serveurs uniques (août-sept. 2026)**, soit ×3 en 4 mois, **sans élagage** (98,9 % marqués actifs).
- Marketplaces de skills : Snyk a mesuré des soumissions passées de **< 50/jour à > 500/jour** entre mi-janvier et début février 2026.

**Incidents / PoC**
- **postmark-mcp** (Koi Security, sept. 2025) : **premier serveur MCP malveillant observé dans la nature**. 15 versions saines pour bâtir la confiance, puis la v1.0.16 ajoute **une seule ligne** qui met l'attaquant en BCC de chaque mail envoyé (liens de réinitialisation de mot de passe, factures). ~1 500 téléchargements par semaine.
- **ToxicSkills** (Snyk **[éditeur]**, fév. 2026) : 3 984 skills scannés (ClawHub, skills.sh). **13,4 % avec au moins une faille critique**, ~37 % avec une faille quelconque.
- **Straiker** : campagne réelle de skills Claude malveillants sur ClawHub, diffusés via de **faux personas IA sur Moltbook** (agent → agent), pour voler des clés privées crypto.
- **SKILLCLOAK** / « Cloak and Detonate » (préprint HKUST) : obfuscation qui échappe à plus de 90 % des scanners (à vérifier).
- **Tool poisoning** (Invariant Labs, avr. 2025) : instructions cachées dans la *description* d'un outil ; l'utilisateur voit un résumé tronqué. **GitHub MCP toxic flow** (mai 2025) : une issue publique pousse l'agent à lire des dépôts privés et à les publier dans une PR publique, **sans aucun outil compromis**.
- Exposition réseau : scan Knostic (juil. 2025), **1 862 serveurs MCP** en production ; **100 %** des 119 testés répondent à `tools/list` sans authentification. Trend Micro en recense 492 sans authentification client. L'authentification OAuth est **optionnelle** dans la spec.

**Ce qui manque** : pas de SBOM des skills et outils d'agents ; pas d'épinglage de version ni de hash pour les serveurs MCP (*rug pull* : la description change après approbation) ; les scanners statiques sont contournés ; aucune vue runtime « quels outils ont été appelés et avec quoi ».

**Signal défensif simple**
> **Diff de comportement à la mise à jour** : épingler le hash de la *description* et du *schéma* de chaque outil MCP ou skill à l'installation. Toute modification = alerte (rug pull). En runtime : **nouveau destinataire, domaine ou champ** (ex. apparition d'un `bcc`) dans les arguments d'un outil qui n'en avait jamais eu. postmark-mcp aurait été attrapé par la simple règle *« champ `bcc` jamais vu → alerte »*.

Sources : [Koi postmark-mcp](https://koi.ai/blog/postmark-mcp-npm-malicious-backdoor-email-theft) · [The Register postmark](https://www.theregister.com/2025/09/29/postmark_mcp_server_code_hijacked/) · [Snyk ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub) · [Straiker ClawHub/Moltbook](https://www.straiker.ai/blog/built-on-clawhub-spread-on-moltbook-the-new-agent-to-agent-attack-chain) · [Invariant GitHub MCP](https://invariantlabs.ai/blog/mcp-github-vulnerability) · [CSA tool description poisoning](https://labs.cloudsecurityalliance.org/research/csa-research-note-mcp-tool-description-poisoning-20260711-cs/) · [DevToolHub registry numbers](https://devtoolhub.com/mcp-registry-by-the-numbers/) · [Doppler exposed MCP](https://www.doppler.com/guides/mcp-server-security-risks-attack-scenarios/exposed-remote-mcp-servers) · [SANS ISC scanning MCP](https://isc.sans.edu/diary/33150)

---

## 6. Protocoles agent-à-agent (A2A)

**Adoption** : A2A (Google, puis Linux Foundation) est intégré aux plateformes d'agents d'entreprise (Vertex, Agentforce, Copilot Studio…). Gartner : **40 % des applications d'entreprise** auront des agents spécialisés fin 2026 (< 5 % en 2025). Seules **44 %** des organisations utilisant des agents ont une politique de sécurité pour eux (agrégateur).

**PoC**
- **Agent session smuggling** (Unit 42, nov. 2025) : un agent distant malveillant profite d'une **session A2A à état** pour glisser des instructions entre des réponses légitimes. Résultat : empoisonnement du contexte, exfiltration, actions non autorisées (ex. achat d'actions dans le PoC). Ce n'est pas une faille du protocole mais de la **confiance implicite entre agents** (OWASP ASI07).
- **Agent Card spoofing / shadowing** : cartes d'agent typosquattées ; la signature JWS des Agent Cards est **« MAY », non imposée** (A2A v0.3+, confirmé par Semgrep).
- Ce scénario est précisément celui de la **track 1** (un agent de recherche piégé ordonne une transaction à un agent financier).

**Ce qui manque** : aucune **chaîne d'autorité** propagée (quel humain est à l'origine de l'ordre ?), pas de vérification d'identité des agents, pas de journal inter-agents corrélé.

**Signal défensif simple**
> **Rupture de chaîne d'autorité** : chaque message A2A doit porter l'ID de la tâche humaine d'origine et son périmètre. Alerte si un agent en aval exécute une action **hors du périmètre de la tâche racine**, ou si une session distante **émet plus d'instructions qu'elle ne reçoit de requêtes** (ratio anormal = smuggling). Agent Card non signée ou dont l'empreinte change = alerte.

Sources : [Unit 42 session smuggling](https://unit42.paloaltonetworks.com/agent-session-smuggling-in-agent2agent-systems/) · [eSecurityPlanet](https://www.esecurityplanet.com/threats/news-ai-session-smuggling-attack/) · [grith A2A signing](https://grith.ai/blog/a2a-protocol-zero-defenses-prompt-injection)

---

## 7. Apps « vibe coding » (Lovable, Bolt, Replit, Base44, v0)

**Adoption** : Lovable compte ~8 M d'utilisateurs fin 2025, **> 100 000 projets par jour**, et revendique **> 50 M d'apps** créées (rapport « Build Economy », mi-2026). Des outils internes RH et finance sont construits par des non-développeurs, hors du radar de la DSI (Shadow IT 2.0).

**Incidents**
- **CVE-2025-48757** (Lovable, Matt Palmer) : sur 1 645 apps de la vitrine, **170 (~10 %)** avaient des tables Supabase lisibles ou modifiables avec la **clé `anon` publique** (RLS absente ou trop permissive) : dettes, adresses, clés API. Le scanner ajouté par Lovable vérifiait la *présence* de RLS, pas son *efficacité*.
- **Escape.tech** **[éditeur]** : sur 5 600 apps publiques, **> 2 000 vulnérabilités, > 400 secrets exposés, 175 cas de PII** (dossiers médicaux, IBAN). Scan de 2026 sur 1 400 apps en prod : **65 % avec des problèmes, 58 % avec au moins une faille critique**.
- **Base44 / Wix** (Wiz, juil. 2025) : avec seulement l'`app_id` (non secret), on pouvait créer un compte vérifié sur des apps **privées protégées par SSO** (chatbots internes, RH). Corrigé en 24 h.
- **Moltbook** (cf. §2) : Supabase mal configuré, 1,5 M de tokens exposés.
- 2026 : bug Lovable permettant de lire l'historique de chat et le code source de projets publics.

**Ce qui manque** : l'entreprise **ne sait pas** que ces apps existent (domaines `*.lovable.app`, `*.supabase.co`, `*.base44.app`) ; la sécurité repose sur une RLS que personne ne teste ; les clés `service_role` finissent dans les bundles JS.

**Signal défensif simple**
> **Test RLS « anon » automatique** : pour toute app découverte (via les logs DNS ou le proxy vers `*.supabase.co`), extraire l'URL et la clé `anon` du bundle JS public et tenter un `select` sur les tables listées via PostgREST. Une ligne renvoyée = fuite. C'est **2 requêtes HTTP, non intrusif**, et ça couvre la classe entière. Compléments : regex sur les bundles (`service_role`, `sk_live_`, `eyJ…` avec `"role":"service_role"`).

Sources : [Superblocks Lovable](https://www.superblocks.com/blog/lovable-rls-breach) · [Pluto CVE-2025-48757](https://blog.pluto.security/p/cve-202548757-what-happened-why-it-b22) · [Intruder CVE](https://cvemon.intruder.io/cves/CVE-2025-48757) · [Escape methodology](https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/) · [Wiz Base44](https://wiz.io/blog/critical-vulnerability-base44) · [Lovable stats (agrégateur)](https://www.demandsage.com/lovable-statistics/)

---

## 8. Slopsquatting (paquets hallucinés)

**Données** : étude USENIX Security 2025 (16 modèles, 576 000 échantillons de code) : **19,7 %** des paquets recommandés n'existent pas, soit 205 474 noms uniques. 5,2 % pour les modèles commerciaux, **21,7 %** pour les modèles open source. Surtout : **43 % des noms hallucinés réapparaissent à chaque fois** sur 10 relances. L'attaquant peut donc **prédire** les noms à enregistrer. Preuve terrain : le paquet vide `huggingface-cli` enregistré par Bar Lanyado a reçu **> 30 000 téléchargements en 3 mois**.

**Pourquoi c'est pire en 2026** : avec les agents de code (Claude Code, Cursor, Codex) et le vibe coding, le `pip install` / `npm install` est **exécuté par l'agent**, sans humain qui relit le nom.

**Ce qui manque** : les SCA vérifient les CVE de paquets **connus**, pas le fait qu'un paquet **vient de naître**.

**Signal défensif simple**
> **Paquet jeune + première installation dans l'organisation + installé par un agent** : âge < 30 jours ou téléchargements < seuil, nom absent de l'historique des lockfiles, et processus parent = agent de code. Bloquer et demander confirmation. Bonus : maintenir une liste des noms hallucinés fréquents (générée en interrogeant soi-même les LLM) et surveiller leur enregistrement sur PyPI et npm (= **threat intel prédictive**).

Sources : [TechRepublic](https://www.techrepublic.com/article/news-slopsquatting-vibe-coding-ai-cybersecurity-risk/) · [Endor Labs](https://www.endorlabs.com/learn/hallucinated-packages-how-ai-invents-dependencies-attackers-exploit) · [Particula 2026 rates](https://particula.tech/blog/slopsquatting-package-hallucination-rates-supply-chain-2026)

---

## 9. Modèles open-weights piégés (Hugging Face)

**PoC / incidents**
- JFrog : **~100 modèles malveillants** (pickle → reverse shell) sur HF.
- **nullifAI** (ReversingLabs, fév. 2025) : pickle compressé en 7z au lieu de zip, **non détecté par Picklescan**, en ligne pendant plus de 8 mois.
- **Model Namespace Reuse** (Unit 42, sept. 2025) : un auteur supprime son compte, l'attaquant ré-enregistre `Auteur/Modele`, et les catalogues **Vertex AI Model Garden et Azure AI Foundry** ainsi que des milliers de projets open source déploient le modèle de l'attaquant (RCE dans l'endpoint). Référencé dans MITRE ATLAS (AML.CS0065).
- **BadSeek** (démo, 2025) : Qwen2.5-Coder backdooré en modifiant **une seule couche**, < 100 exemples, 30 min de GPU. Il injecte du code malveillant sur déclencheur et se comporte normalement sinon. *Sleeper Agents* (Anthropic, 2024) : le fine-tuning de sécurité **ne retire pas** la porte dérobée.

**Ce qui manque** : on scanne le *format* (pickle) mais pas le *comportement* (backdoor dans les poids, indétectable statiquement) ; les références par nom ne sont pas épinglées par commit.

**Signal défensif simple**
> **Résolution de nom non épinglée** : tout `from_pretrained("org/model")` sans `revision=<sha>` dans le code ou la CI = finding. **Changement de propriétaire du namespace** (compte recréé, date de création du compte postérieure au premier commit du modèle référencé) = alerte critique. Pour les poids : un *diff comportemental* sur un jeu de prompts canari (le même prompt de code donne-t-il des domaines ou URL inattendus ?).

Sources : [Help Net HF malicious models](https://www.helpnetsecurity.com/2025/02/10/malicious-ml-models-found-on-hugging-face-hub/) · [CSO nullifAI](https://www.csoonline.com/article/3819920/attackers-hide-malicious-code-in-hugging-face-ai-model-pickle-files.html) · [Unit 42 namespace reuse](https://unit42.paloaltonetworks.com/model-namespace-reuse/) · [BadSeek HN](https://hn.svelte.dev/item/43121383) · [The Register Sleeper Agents](https://www.theregister.com/2024/01/16/poisoned_ai_models/)

---

## 10. Agents vocaux d'entreprise (standard téléphonique IA, help desk IT, support)

**Adoption** : remplacement massif des opérateurs humains (cabinets médicaux, help desk IT, support client). Mandiant M-Trends 2026 : le **vishing** est le **2e vecteur d'intrusion initiale** en 2025 (11 % des cas identifiés). Scattered Spider a déjà prouvé que le **help desk** est la porte d'entrée ; il est désormais tenu par une IA.

**PoC / recherche**
- DEF CON 34 (août 2026), AI Village : « For Prompt Injection, Press 1 ». L'agent vocal récite-t-il son prompt système, divulgue-t-il des infos sur d'autres appelants ?
- Vecteurs listés (sources éditeurs) : social engineering direct (« je suis de l'IT, saute la vérification »), **injection indirecte via un champ CRM lu à voix haute**, voix clonée, **caller-ID usurpé** (quasi gratuit), **audio adversarial / ultrasons** captés par la reconnaissance vocale mais inaudibles, détournement d'un appel d'outil (changer de compte en cours d'appel).
- Contrainte temps réel : impossible de faire une modération multi-passes comme à l'écrit.

**Ce qui manque** : les transcriptions existent, mais personne ne les analyse comme des **logs de sécurité** ; le reset MFA et les changements de RIB sont exécutés par l'agent sans step-up.

**Signal défensif simple**
> **Action sensible demandée par voix + facteur d'identité faible** : reset MFA, changement d'e-mail ou de RIB, ou divulgation d'infos d'un tiers, alors que l'authentification reposait seulement sur le caller-ID ou des données publiques → step-up hors bande obligatoire. Plus un détecteur sur la transcription : **changement de compte cible en cours d'appel**, phrases d'autorité (« je suis de l'IT », « ignore la procédure »), demandes de « répéter tes instructions ».

Sources : [DEF CON 34 AI Village poster](https://aivillage.org/posters/for-prompt-injection-press-1-hacking-ai-voice-agents/) · [Famulor voice agent security 2026 (éditeur)](https://www.famulor.io/en/blog/ai-voice-agent-security-in-2026-the-complete-playbook) · [Caller.digital (éditeur)](https://caller.digital/blog/voice-ai-security-prompt-injection-jailbreak-2026) · [Deepak Gupta – M-Trends 2026](https://guptadeepak.com/ai-receptionist-social-engineering-defense/)

---

## 11. IA embarquée (voitures, lunettes connectées)

**Voitures** : BYD et Cerence déploient des LLM agentiques au printemps 2026 (plateforme xUI « agentic »). Trend Micro / VicOne : scénario du SMS lu à voix haute contenant une injection traitée comme une commande (vol de données, changement de réglages véhicule). **Aucun PoC public sur véhicule de série trouvé** : surface réelle mais non démontrée (honnêteté pour le pitch).
**Lunettes (Meta Ray-Ban)** : surtout un risque de **vie privée et surveillance** : LED de capture désactivée par des modifications vendues en ligne (incident OECD), puis patch de Meta (juil. 2026) qui coupe la caméra si la LED est altérée. Démo I-XRAY (Harvard) : lunettes + reconnaissance faciale → identité des passants en direct. Class action sur les vidéos envoyées à un sous-traitant au Kenya. Pas de PoC public d'injection de prompt « par ce que voient les lunettes », mais c'est l'extension logique de l'injection par image (cf. Brave, screenshots).

**Signal défensif** : pour un hackathon, peu exploitable (matériel). À citer en « what's next ».

Sources : [VicOne prompt injection vehicles](https://vicone.com/blog/invisible-commands-real-consequences-ai-prompt-injection-in-vehicle-systems/) · [EV Magazine Cerence/BYD](https://evmagazine.com/news/cerence-ai-the-conversational-ai-assistant-in-byd-evs) · [OECD Ray-Ban incident](https://oecd.ai/en/incidents/2025-10-24-ad63) · [Deccan Herald LED patch](https://www.deccanherald.com/technology/artificial-intelligence/meta-to-turn-off-ray-ban-ai-glasses-camera-if-privacy-light-is-tampered-with-4066372)

---

## 12. Synthèse pour l'équipe : où est le « problème que tout le monde a sans le percevoir » ?

| Surface | Adoption | Maturité défensive | Démontrable en 24 h | Gêne UX si bien fait |
|---|---|---|---|---|
| Oversharing révélé par Copilot/Gemini | très forte (30 M sièges) | DSPM statique seulement | oui (tenant de test + logs synthétiques) | nulle (détection passive) |
| Mémoire persistante empoisonnée | universelle (par défaut) | **zéro** | oui (export mémoire + règles) | nulle |
| Navigateur agentique, dérive de tâche | forte et invisible (intégré à Chrome/Edge) | blocage total (Gartner) | oui (extension + agent de démo) | faible (confirmation ciblée) |
| Skills / MCP rug pull et BCC | explosive (×3 en 4 mois) | scanners statiques contournés | oui (proxy MCP + hash) | nulle |
| Apps vibe-codées / Supabase RLS | massive, Shadow IT | quasi zéro côté entreprise | **très facile** (2 requêtes) | nulle |
| Slopsquatting par agents de code | forte | SCA aveugles aux paquets neufs | oui | faible |
| A2A, chaîne d'autorité | émergente | zéro | oui (lien track 1) | faible |
| Agents vocaux help desk | forte | transcriptions non exploitées | moyen | faible |

**Trois angles « personne ne le perçoit » particulièrement pitchables :**
1. **« Les règles de transfert de l'ère IA »** : la mémoire des assistants est un mécanisme de persistance que **personne n'audite**. Détecter les entrées mémoire de type *règle* (impératif, URL, déclencheur conditionnel) écrites pendant un tour exposé à du contenu externe. Mapping : ATT&CK *Persistence*, ATLAS *AI Agent Context Poisoning / Memory*, OWASP ASI06.
2. **« Ce que l'IA a déterré »** : l'oversharing existe depuis 15 ans mais était protégé par l'obscurité ; Copilot l'a rendu interrogeable. Signal : **premier accès en N mois à un document sensible, via l'IA, par quelqu'un hors de son cercle habituel**. Detect + Respond (retirer le partage, pas l'outil), zéro friction utilisateur.
3. **« L'écart d'intention »** : pour tout agent (navigateur, MCP, A2A), journaliser la tâche demandée et alerter quand l'action sort de son périmètre (origine, outil, destinataire, champ nouveau). C'est le dénominateur commun de CometJacking, HashJack, GeminiJack, postmark-mcp, GitHub MCP et session smuggling. Attention, signal de marché de la track 2 : **ne pas présenter ça comme un « prompt firewall »** (il inspecte les *actions* et la *provenance*, pas le texte).

**Mises en garde pour le Q&R**
- Beaucoup de chiffres viennent d'éditeurs qui vendent la solution (Concentric, LayerX, Escape, Snyk, SecurityScorecard). Le dire avant le jury.
- Plusieurs failles sont corrigées (Reprompt, GeminiJack, Base44, Opera Neon). L'argument n'est pas « cette CVE est ouverte » mais « **la classe** revient tous les mois et les éditeurs disent eux-mêmes qu'elle ne sera jamais close ».
- Voitures et lunettes : pas de PoC public d'injection sur un produit de série trouvé à ce jour.

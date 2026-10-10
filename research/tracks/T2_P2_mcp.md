# T2 · Piste 2 — Supervision de la couche outils des agents (MCP)

> Recherche du 2026-10-10 pour Secure Horizons (Track 2 « Defenders Augmented »). Équipe : Adem (tech) et Titouan (business). Environ 24 h de dev, AWS Bedrock (Claude).
> S'appuie sur `context/notion_guide.md`, `research/frontier/00`, `F2`, `F7` et `research/03_track2_ai_security.md`, sans les répéter.
> Légende : **[V]** = vérifié sur la source primaire pendant cette recherche. **[S]** = source secondaire (blog ou agrégateur). **[ÉD]** = chiffre publié par un éditeur. **[ÀV]** = à vérifier avant de le mettre sur une slide.

---

## TL;DR

1. **La « passerelle MCP » est déjà un produit, et même une marchandise.** En 2026, Docker, Cloudflare, AWS AgentCore, Lasso (open source), Snyk (ex-Invariant), Trail of Bits, Teleport, Aembit, Runlayer et Rippling en proposent une. Natoma a été racheté par Snowflake, Portkey par Palo Alto Networks. Une équipe qui montre « un proxy qui journalise, épingle des hash et passe les descriptions dans un LLM-juge » refait **ce que le jury connaît déjà**, et en moins bien.
2. **Les attaques qui comptent contournent les scanners de description.** Le GitHub MCP toxic flow n'utilise **aucun outil malveillant**. Le *Full-Schema Poisoning* et l'*ATPA* (CyberArk) cachent la charge dans les noms de paramètres ou dans les **sorties** d'outils. A2M (sept. 2026) optimise la sortie d'outil à partir des traces d'exécution et obtient 74,4 % d'ASR. Un LLM-juge reste un filtre de prompt, et « The Attacker Moves Second » contourne ces filtres à plus de 90 %.
3. **Ce qui surclasse :** déplacer la question de « *ce texte est-il malveillant ?* » (filtre) vers « **d'où vient cette valeur, et a-t-elle le droit d'aller là ?** » (provenance et flux). On y ajoute **des leurres construits dans le flux de données lui-même**, ce qui donne zéro faux positif par construction, puis une **réponse graduée avec traçage de contamination**.
4. **Recommandation :** construire **SOSIE + Provenance Gate** (idées B et A ci-dessous), avec la réponse du « Fusible » (D) en version légère. Note estimée : **~90/100** sur la grille Track 2. La différence se voit en une phrase de pitch : *« l'agent n'a jamais vu le vrai secret, et nous savons qui a écrit chaque argument »*.

---

## 1. État de l'art (octobre 2026)

### 1.1 La spécification MCP : ce qu'elle donne au défenseur, et ce qu'elle ne donne pas

| Version | Ce qui compte pour la sécurité | Source |
|---|---|---|
| 2025-03-26 | **Tool annotations** `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`. Ce sont des *indices* que le client doit considérer comme non fiables si le serveur n'est pas de confiance. Un serveur malveillant peut donc **mentir** sur ses annotations. | spec MCP [ÀV, page tools] |
| 2025-06-18 | **Elicitation** (le serveur demande une saisie à l'utilisateur), sortie structurée, MCP server = OAuth Resource Server (RFC 8707, resource indicators) | spec [ÀV] |
| 2025-11-25 | Découverte OIDC, **consentement incrémental de scopes** (SEP-835), **Client ID Metadata Documents** (SEP-991), **elicitation en mode URL** (interaction hors bande) | [changelog V](https://modelcontextprotocol.io/specification/2025-11-25/changelog) |
| **2026-07-28** | **Plus de sessions protocolaires ni de handshake `initialize`** : le contexte passe dans le `_meta` de chaque requête. Les en-têtes `Mcp-Method` et `Mcp-Name` deviennent obligatoires en HTTP. `tools/list` porte `ttlMs` et `cacheScope`, dans un ordre déterministe. L'elicitation devient des *Multi Round-Trip Requests* (`input_required`). Paramètre `iss` (RFC 9207) et credentials liés à l'émetteur. DCR déprécié. Sampling, Roots et Logging dépréciés. **Toujours aucune signature ni aucun mécanisme d'intégrité des définitions d'outils.** | [changelog V](https://modelcontextprotocol.net/specification/2026-07-28/changelog) |
| Registre officiel | Catalogue et API ouverts des serveurs publics. Environ 24 000 à 30 000 serveurs en août-sept. 2026 (×3 en 4 mois), quasiment sans élagage (F7). | [blog MCP](https://blog.modelcontextprotocol.io) [S] |

**Conséquences pour nous :**
- Les en-têtes `Mcp-Method`/`Mcp-Name` et le `tools/list` déterministe et cachable rendent **l'empreinte (hash) des outils et la détection réseau** triviales. Cloudflare s'en sert déjà pour repérer le « shadow MCP ».
- Comme il n'y a plus de session, **le corrélateur de session doit être la passerelle elle-même** : c'est un argument pour notre ledger.
- Les annotations ne sont pas fiables, d'où une idée : **vérifier l'annotation contre le comportement observé** (« annotation menteuse », idée C).
- L'elicitation et les Multi Round-Trip sont le **canal natif de validation humaine** : notre réponse graduée doit l'utiliser au lieu d'inventer une UI.

### 1.2 Passerelles, proxys et scanners existants

| Produit | Ce qu'il fait | Ce qu'il ne fait pas (notre angle) |
|---|---|---|
| **Snyk Agent Scan** (ex-Invariant mcp-scan, rachat juin 2025) | Scan local des serveurs, skills et prompts : poisoning, shadowing, **toxic flows** (TFA, en preview), secrets en dur. Mode proxy avec **tool pinning** par hash (anti rug pull). | Le TFA est surtout statique et combinatoire (« ces outils *pourraient* former une trifecta »). Il ne prouve pas *quelle valeur* a circulé. Les descriptions sont envoyées au cloud Snyk. [S](https://appsecsanta.com/mcp-scan) · [Snyk](https://snyk.io/news/snyk-unveils-secure-at-inception) |
| **Invariant Guardrails** | Règles de politique sur les traces (par ex. « un seul repo par session », recommandé après GitHub MCP). | Les politiques s'écrivent à la main et il n'y a pas de dérivation automatique depuis l'intention. [V](https://invariantlabs.ai/blog/mcp-github-vulnerability) |
| **Trail of Bits mcp-context-protector** (bêta juil. 2025) | Wrapper avec **TOFU pinning** de la config serveur, LLM-guardrail sur les descriptions, assainissement ANSI. Contre le « line jumping ». | Ne voit pas les sorties d'outils empoisonnées (ATPA) ni les flux entre serveurs. [ToB](https://blog.trailofbits.com/2025/07/28/we-built-the-security-layer-mcp-always-needed/) · [line jumping](https://blog.trailofbits.com/2025/04/21/jumping-the-line-how-mcp-servers-can-attack-you-before-you-ever-use-them/) |
| **Cisco mcp-scanner** | Scan par YARA, LLM-juge, API Cisco AI Defense et « Code Behavioral Analyzer ». CLI ou serveur REST. | Statique, avant déploiement. [GitHub](https://github.com/cisco-ai-defense/mcp-scanner) |
| **Docker MCP Gateway** (OSS) | Serveurs dans des conteneurs (CPU/mém., privilèges réduits), `--verify-signatures` sur les images, `--block-secrets` (activé par défaut), `--log-calls`, **interceptors** `before/after:exec`. | Fait du **confinement et du blocage**, pas de sémantique. `--block-secrets` *casse* la tâche au lieu de la protéger. [docs](https://docs.docker.com/reference/cli/docker/mcp/gateway/run.md) · [blog](https://www.docker.com/blog/docker-mcp-gateway-secure-infrastructure-for-agentic-ai/) |
| **Lasso MCP Gateway** (OSS MIT ; Lasso lève 30 M$ en sept. 2026) | Plugins (masquage de secrets, Presidio PII, guardrails Lasso), **scanner de réputation** des serveurs et des descriptions avant chargement, traçage SQLite. | Mono-utilisateur, sans contrôle d'accès. Les guardrails avancés passent par le cloud. Reste du filtrage de contenu. [S](https://www.sourcepulse.org/projects/11158170) · [levée](https://securitybrief.co.uk/story/lasso-launches-ai-guardrail-leap-raises-usd-30m) |
| **Cloudflare MCP Server Portals + Gateway** | Un endpoint unique par portail, Access/SSO, outils triés par portail. **Détection du « shadow MCP »** (`is_mcp`, en-têtes MCP, sélecteur expérimental, août 2026). | Exige le déchiffrement TLS. Ne voit **ni le stdio ni le local**. Aucune analyse des arguments. [docs](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals) · [S shadow MCP](https://forkast.news/cloudflare-gateway-mcp-detection-makes-shadow-mcp-visible-and-blockable/) |
| **AWS AgentCore Gateway + Policy** | Politiques **Cedar** par requête agent→outil, default-deny, modes LOG_ONLY et ENFORCE, interceptors Lambda sur requête/réponse, Guardrails intégrés. | Les politiques sont statiques et écrites à la main. Pas de provenance des valeurs. **Mais c'est notre point d'intégration AWS naturel.** [S](https://hidekazu-konishi.com/entry/amazon_bedrock_agentcore_policy_implementation_guide.html) · [S](https://aihub.hkuspace.hku.hk/2026/06/02/extending-mcp-support-for-amazon-bedrock-agentcore-gateway/) |
| **Microsoft MCP sur Windows** | Proxy qui médie client↔serveur, registre on-device avec **signature obligatoire**, définitions d'outils **non modifiables au runtime**, consentement par paire client-outil, identité et audit par connecteur. | Réservé à Windows, et le design officiel date de la preview de mai 2025. [V](https://blogs.windows.com/windowsexperience/2025/05/19/securing-the-model-context-protocol-building-a-safer-agentic-future-on-windows/) |
| **Teleport**, **Aembit MCP Identity Gateway** (bêta févr. 2026) | Identité et accès : credentials courts, et **l'agent ne détient jamais le credential** (Aembit l'obtient par requête, le cache 60 s, sans écriture disque). | Protège l'*authentification* vers le serveur, pas les **secrets qui circulent dans les données** renvoyées par les outils. [Teleport](https://goteleport.com/docs/machine-workload-identity/access-guides/mcp/) · [Aembit](https://docs.aembit.io/ai-guide/mcp/identity-gateway/) |
| **Astrix** (MCP Secret Wrapper) | Encapsule les secrets des configs MCP dans un vault. [ÀV : pas de source trouvée cette fois] | Même limite que ci-dessus. |
| **GitGuardian** (jury) | AI Hooks pre/post-tool-use (blocage des secrets), **inventaire des agents et serveurs MCP**, `ggshield ai discover --history` (reconstruit les appels MCP depuis les transcripts), MCP server `ggmcp`, honeytokens. | Bloque la *présence* d'un secret, pas son *usage détourné* ni son flux source→puits. [docs](https://docs.gitguardian.com/endpoint-protection/agent-and-mcp-inventory) · [ai discover](https://docs.gitguardian.com/ggshield-docs/reference/ai/discover) |
| **Thinkst Canarytoken MCP** (juin 2026) + **Agent Provocateur** (sept. 2026) | Faux `mcp.json` (« cloud-auth-broker », `fetch_kubeconfig`…). L'alerte part à la connexion ou à l'appel d'outil, avec IP, méthode et outil. Un agent Copilot dont MCP était désactivé par politique a quand même lu le fichier et appelé l'outil via `curl`. | Leurre **statique sur disque**. Attrape un agent qui fouille, pas un agent légitime détourné *au milieu d'une tâche*. Ne fait aucune attribution source→puits. [V](https://blog.thinkst.com/2026/06/one-for-all-the-models-out-there.html) |
| Marché | Natoma → Snowflake (mai 2026), Portkey (MCP Gateway) → Palo Alto (avr. 2026), Runlayer (11 M$ puis 42 M$), Rippling lance sa propre passerelle. | **Message pour le pitch : la passerelle est une commodité, la valeur est dans ce qu'elle *prouve*.** [S](https://softwarestrategiesblog.com/2026/03/28/agentic-ai-security-startups-funding-mna-rsac-2026/) · [Natoma](https://chatforest.com/builders-log/snowflake-natoma-mcp-gateway-enterprise-governance-builder-guide/) |

**Cadres de référence publiés :** OWASP **MCP Top 10** (bêta) : MCP01 tokens et secrets, MCP02 escalade par élargissement de scope, **MCP03 tool poisoning**, MCP04 supply chain, MCP05 injection de commande, MCP06 injection par contenu contextuel, puis intent-flow subversion, authentification, audit et shadow servers ([owasp](https://owasp.org/projects/mcp-top-10) · [S](https://cycode.com/blog/owasp-mcp-top-10/)). **NSA AISC, CSI MCP du 20 mai 2026** : sérialisation, frontières de confiance, approbations faibles, cycle de vie des tokens, **journalisation d'audit limitée**. Elle note aussi que « les défenses établies ne suffisent pas » ([NSA](https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/4496698/)).

### 1.3 Incidents réels (à citer dans le pitch)

| Incident | Date | Mécanisme | Ce qui l'aurait arrêté |
|---|---|---|---|
| **WhatsApp MCP** (Invariant) | avr. 2025 | Un serveur « fact of the day » fait un *rug pull* : sa description change et réécrit le destinataire de `send_message` du serveur WhatsApp (**shadowing**). L'historique part vers un numéro fixe, caché par le scroll horizontal. [Willison](https://simonwillison.net/2025/Apr/9/mcp-prompt-injection/) · [Docker](https://www.docker.com/blog/mcp-horror-stories-whatsapp-data-exfiltration-issue/) | Pinning, **et surtout la provenance de l'argument `recipient`** : il vient d'une description d'un *autre* serveur, pas de l'utilisateur. |
| **GitHub MCP toxic flow** | mai 2025 | Une issue publique piégée pousse Claude 4 Opus (en « Always Allow ») à lire des repos privés puis à ouvrir une PR publique (salaire, projet « Jupiter Star »). **Aucun outil compromis.** [V](https://invariantlabs.ai/blog/mcp-github-vulnerability) | **Flux de valeur** : du contenu issu d'un repo privé part vers un puits public. Les scanners de description ne voient rien. |
| **Asana MCP** | juin 2025 | Défaut d'isolation entre tenants (cache sans revérification du tenant). Environ 1 000 clients exposés, serveur coupé du 5 au 17 juin. [UpGuard](https://upguard.com/blog/asana-discloses-data-exposure-bug-in-mcp-server) | Un bug serveur, hors de portée d'une passerelle côté client. À citer comme **limite honnête**. |
| **Supabase MCP** (General Analysis) | juil. 2025 | Un ticket support piégé fait lire `integration_tokens` avec le `service_role` (qui contourne la RLS) et écrire les tokens dans le ticket. Trifecta complète **dans un seul serveur**. [Willison](https://simonwillison.net/2025/Jul/06/supabase-mcp-lethal-trifecta/) | **SOSIE** : les tokens lus seraient des sosies. Leur écriture dans un ticket (puits non autorisé) est une preuve d'exfiltration. |
| **postmark-mcp** | sept. 2025 | 15 versions saines, puis la v1.0.16 ajoute un BCC vers giftshop[.]club. Environ 1 500 téléchargements par semaine. [Snyk](https://snyk.io/fr/blog/malicious-mcp-server-on-npm-postmark-mcp-harvests-emails/) | Le BCC est **dans le code**, pas dans la description, donc invisible pour la passerelle. Seuls une **détonation en bac à sable** (diff d'egress) ou un sosie dans l'e-mail l'auraient vu. |
| **Anthropic mcp-server-git** (Cyata) | divulgué en janv. 2026 | CVE-2025-68143/68144/68145 : `git_init` sans restriction, injection d'arguments dans `git_diff`, contournement de la validation de chemin. **Déclenchable par un README ou une issue piégés.** Chaîné avec le Filesystem MCP, il donne une RCE. Corrigé en 2025.12.18. [THN](https://thehackernews.com/2026/01/three-flaws-in-anthropic-mcp-git-server.html) · [The Register](https://www.theregister.com/2026/01/20/anthropic_prompt_injection_flaws/) | Provenance des arguments (`repo_path` issu d'un contenu non fiable) + sandbox. |
| MCP Inspector CVE-2025-49596 (CVSS 9,4), plus de 30 CVE MCP en janv.-févr. 2026 | 2025-26 | RCE ou DNS rebinding, path traversal… [S](https://www.heyuan110.com/posts/ai/2026-03-10-mcp-security-2026/) | Hygiène et sandbox. |
| Sampling MCP (Unit 42) | 2025-26 | Vol de ressources, détournement de conversation, **invocation d'outil cachée** via sampling. [Unit 42](https://unit42.paloaltonetworks.com/model-context-protocol-attack-vectors/) | Sampling déprécié en 2026-07-28 ; la passerelle peut le bloquer par défaut. |

### 1.4 Recherche (ce que le jury technique peut connaître)

| Travail | Idée clé | Chiffres | Utilité pour nous |
|---|---|---|---|
| **MCPTox** (arXiv 2508.14925, AAAI 2026) | Tool poisoning sur 45 serveurs réels et 353 outils, 1 312 cas (1 348 en version AAAI), 10 catégories | ASR jusqu'à **72,8 %** (o1-mini). **Plus le modèle est capable, plus il est vulnérable.** | Corpus d'attaque si le dépôt est disponible [ÀV]. [arXiv](https://arxiv.org/abs/2508.14925) |
| **MCPSecBench** (2508.13220) | 17 types d'attaques, 4 surfaces, 3 plateformes | Protections existantes : succès moyen **< 30 %**. Injection : 0 % sur Claude Desktop, 100 % sur Cursor. | Taxonomie pour la couverture. [arXiv](https://arxiv.org/html/2508.13220v3) |
| **MSB** (2510.15994) | Plus de 2 000 attaques, 400 outils, métrique *Net Resilient Performance* | ASR max **75,83 %** | Métrique « sécurité vs utilité » à reprendre. [arXiv](https://arxiv.org/html/2510.15994v1) |
| **MindGuard** (2508.20412) | **Decision Dependence Graph** construit sur l'**attention** du LLM pour attribuer un appel à une métadonnée empoisonnée | AP 94-99 %, attribution 95-100 %, < 1 s [auto-déclaré] | Brillant, mais exige l'accès aux attentions (open-weights) : **incompatible avec Claude sur Bedrock**. Notre provenance par valeur est l'équivalent « boîte noire ». [arXiv](https://arxiv.org/abs/2508.20412v3) |
| **MCP-Guard** (2508.10991) | 3 étages : règles (< 2 ms), détecteur E5 fine-tuné, arbitrage LLM. MCP-AttackBench de 70 448 échantillons. | F1 89,1 %, latence −51 % | C'est **exactement ce que fera l'équipe moyenne**, en moins bien. Aucune propriété garantie. [arXiv](https://arxiv.org/html/2508.10991v4) |
| ML-based Detection of MCP Attacks (2604.10534) | SVC et BERT sur les descriptions | F1 binaire 100 %, multiclasse 90,56 % | Classer les descriptions est « résolu » sur données statiques, donc **peu différenciant**. [alphaXiv](https://www.alphaxiv.org/abs/2604.10534) |
| **ChainWatch** (2607.19432, juil. 2026) | Kill chain en 6 étapes, **HMM sur les séquences d'appels**, 20 features | Pas de métriques publiées | Appui académique pour la détection *séquentielle* (idée D). [arXiv](https://arxiv.org/abs/2607.19432) |
| **A2M** (2609.26761, sept. 2026) | Attaque boîte noire : on optimise la métadonnée (attraction), puis la **sortie** d'outil à partir des traces (manipulation) | Invocation malveillante **93,6 %**, ASR **74,4 %**, transfert à d'autres modèles 24,5 % | **L'attaquant adaptatif à rejouer contre nous.** [arXiv](https://arxiv.org/abs/2609.26761) |
| **MPMA** (2505.11154, AAAI 2026) | Manipulation de préférence : la description pousse le LLM à choisir *mon* outil (algorithme génétique pour rester discret) | — | Justifie de ne **jamais** classer les outils sur leur texte libre. [arXiv](https://arxiv.org/abs/2505.11154) |
| **CyberArk FSP/ATPA** | La charge se cache dans *tout* le schéma (nom de paramètre, défaut, `required`) ou dans les **messages d'erreur** renvoyés | — | Un scan limité à `description` est obsolète. [CyberArk](https://www.cyberark.com/resources/threat-research-blog/poison-everywhere-no-output-from-your-mcp-server-is-safe) |
| Formal MCP framework (2604.05969) · Agent-Sentry · SAMOS (Brown, 2026) | **L-IFT** : chaque valeur porte le label du domaine de confiance du serveur qui l'a produite ; on vérifie la clearance avant l'appel | — | Notre idée A en est l'**implémentation pragmatique**. [arXiv](https://arxiv.org/pdf/2604.05969) · [survey 2606.04990](https://arxiv.org/pdf/2606.04990) |
| 2603.22489 | 7 clients MCP : validation statique et visibilité des paramètres insuffisantes | — | [arXiv](https://arxiv.org/abs/2603.22489) |

**Synthèse de la recherche :** les attaques optimisées passent à 70-90 %. Les défenses par **classification de texte** plafonnent autour de 89 % de F1 sur données statiques et ne garantissent rien face à un attaquant adaptatif. Les défenses par **flux** (CaMeL, FIDES, L-IFT) donnent des propriétés, mais demandent des politiques écrites à la main ou l'accès aux internes du modèle. **Le créneau libre : un suivi de flux en boîte noire, sans réécrire l'agent, avec des preuves et zéro faux positif sur les signaux forts.**

---

## 2. Ce que fera « l'équipe moyenne », et pourquoi c'est insuffisant

**Le projet type, qu'on verra 5 à 10 fois :** « MCP Shield/Guard/Sentinel ». Un proxy Python qui :
1. journalise les appels dans un dashboard Streamlit ;
2. épingle le hash des descriptions (anti rug pull) ;
3. passe les descriptions et parfois les arguments dans un **LLM-juge** (Claude ou Llama Guard) ou des regex « ignore previous instructions » ;
4. bloque une liste d'outils dangereux et propose un bouton kill switch ;
5. fait une démo avec l'outil `add()` qui lit `~/.ssh/id_rsa` (l'exemple Invariant d'avril 2025).

**Pourquoi un jury GitGuardian/KPMG/MetaLab ne sera pas impressionné :**

| Faiblesse | Preuve |
|---|---|
| C'est un **produit existant**, gratuit et open source | Lasso Gateway, Docker MCP Gateway, mcp-context-protector, Snyk Agent Scan, AgentCore Policy (§1.2) |
| Le LLM-juge **est un filtre de prompt**, ce que la grille vise explicitement (« au-delà d'un filtre de prompt ? ») | Attacker Moves Second (> 90 % de contournement), A2M (74 % d'ASR, transférable) |
| Le scan de description **rate les vraies attaques** | GitHub MCP (aucun outil empoisonné), ATPA (charge dans la *sortie*), postmark (charge dans le *code*), FSP (charge dans un nom de paramètre) |
| Le pinning de hash **ne dit rien** d'un serveur malveillant dès la v1, ni d'une injection par contenu | Supabase, GitHub MCP |
| **Pas de métriques honnêtes** : ni dénominateur de faux positifs, ni attaque adaptative, ni coût en utilité | Exigence explicite du guide (fiche de défense) |
| Le kill switch est un bouton, sans **réponse proportionnée** ni portée de contamination | Grille : « valeur opérationnelle » à 20 % |
| Les alertes sont de type « suspicion 0,82 » : l'analyste ne sait pas quoi faire | Valeur opérationnelle |

**Règle :** si une fonctionnalité de notre projet existe telle quelle dans Lasso ou Docker MCP Gateway, elle va dans le socle (en une ligne) et pas dans le pitch.

---

## 3. Quatre idées qui surclassent

> Socle commun aux 4 idées (environ 3 h, non pitché) : un proxy MCP multi-serveurs (stdio + streamable HTTP) en Python avec le SDK `mcp`, un ledger de session append-only chaîné par hash, un pinning de schéma complet (pas seulement `description`), une sortie d'événements **OCSF** vers SIEM, et le blocage du sampling par défaut.
>
> **Environnement de démo, 100 % le nôtre :** agent « DevOps assistant » (Claude Sonnet sur Bedrock, boucle maison ou Strands). Serveurs mock : `tickets` (contenu contrôlable par un « client » externe), `repo` (public/privé), `files` (contient un `.env` **synthétique**), `mailer` (`send_email`), `http` (`post`), plus un serveur tiers `weather` piégé (rug pull et ATPA). L'exfiltration part vers un webhook local que nous contrôlons. Aucun vrai secret : clés AWS au format valide mais factices, ou honeytokens.

---

### Idée A — **PROVENANCE GATE** : « Qui a écrit cet argument ? »

**Problème et défenseur nommé.** *Sarah, analyste SOC N2 dans une ETI de 2 000 personnes* qui a déployé Claude Code et Cursor avec 12 serveurs MCP. Aujourd'hui, elle voit « `send_email(to=x@y.com)` par l'utilisateur Marc ». Elle ne peut pas savoir si **Marc** a demandé `x@y.com` ou si **un ticket client** l'a soufflé à l'agent. Tous les incidents du §1.3 (WhatsApp, GitHub, Supabase, git CVE) se résument à **un argument critique dont l'auteur réel est un contenu non fiable**.

**Mécanisme (le neuf).**
1. **Ledger de provenance.** La passerelle voit tout : la demande utilisateur (fournie par un hook `UserPromptSubmit` de Claude Code ou par le `_meta` de notre agent) et **chaque sortie d'outil**, étiquetée par serveur et par niveau de confiance (`user` > `internal` > `third_party` > `untrusted_content` ; par exemple les tickets et les issues publiques sont `untrusted_content` même si le serveur est interne).
2. **Classification source/puits** des outils, à partir de nos manifestes et des annotations **vérifiées**. Les puits sont les outils à effet externe : `send_*`, `post`, `create_pr`, `write`, `http`. Chaque puits a des **arguments critiques** (destinataire, URL, chemin, repo, requête SQL) repérés par heuristique de schéma.
3. **Provenance par valeur, en boîte noire.** Pour chaque argument critique d'un appel vers un puits, on cherche d'où vient la valeur : normalisation (casse, unicode NFKC, décodage base64/URL/hex), puis correspondance exacte ou approximative (n-grammes, Levenshtein) dans le ledger. Trois verdicts sont possibles : **présente dans la demande utilisateur** (auteur = humain), **présente seulement dans une sortie d'outil** (auteur = ce serveur), ou **introuvable** (générée par le modèle). C'est l'équivalent pragmatique du taint-tracking de CaMeL/FIDES **sans réécrire l'agent ni accéder aux attentions** (contrairement à MindGuard).
4. **Mandat d'intention isolé.** À chaque tour utilisateur, Claude Haiku (Bedrock) lit **uniquement la demande humaine**, jamais une sortie d'outil, et produit un mandat JSON : puits autorisés, destinataires et domaines, périmètre (repos, tables). Ce juge isolé **ne peut pas être injecté par les données** (principe dual-LLM). La vérification du mandat est **déterministe**.
5. **Flux de contenu (toxic flow).** Si le *corps* d'un appel à un puits public contient des n-grammes issus d'une source privée (repo privé, table sensible), on obtient le verdict « **flux privé → public** ». C'est le cas GitHub MCP.
6. **Décision explicable** : « Bloqué : `to=attacker@evil.io` a pour auteur le ticket #4521 (serveur `tickets`, confiance *untrusted_content*, 14:02:11), absent de votre demande "résume les tickets ouverts". Mandat : aucun envoi d'e-mail autorisé. » Le blocage est remplacé par une **elicitation** (« Confirmer l'envoi ? ») quand le risque est moyen.

**Démo de 3 min.**
- (0:00) Marc : « Résume les tickets ouverts et envoie-moi le résumé. »
- (0:30) Sans passerelle, le ticket #4521 contient une instruction cachée (FSP : dans un champ `customer_note`). L'agent lit `.env` et envoie le tout à `attacker@…`. Le webhook reçoit le message.
- (1:15) Avec passerelle, même scénario. L'appel `send_email` est bloqué et la carte de provenance s'affiche : chaque argument est coloré par son auteur (vert = Marc, rouge = ticket #4521). Le résumé légitime vers *marc@* **passe**.
- (2:15) Le jury écrit sa propre injection dans un ticket, en direct.

**Métriques.** Pourcentage d'appels malveillants bloqués par classe (WhatsApp-like, GitHub-like, Supabase-like, git-path, adaptatifs) ; **taux de faux blocages sur 150 sessions légitimes** (avec dénominateur) ; utilité conservée (tâches légitimes réussies avec et sans passerelle, façon CaMeL 77/84) ; latence ajoutée p50/p95 : **< 10 ms** sur le chemin déterministe, mandat Bedrock environ 0,5-1 s **une fois par tour humain** et en parallèle de la planification.

**Mapping.** OWASP **ASI01** (détournement d'objectif : écart au mandat), **ASI02** (mauvais usage d'outil : argument critique d'origine non fiable), ASI03 (périmètre du mandat), ASI07 si inter-agents. OWASP MCP03/MCP06. ATLAS **AML.T0051.001** (injection indirecte), **AML.T0053** (invocation d'outil d'agent), **AML.T0086** (exfiltration via invocation d'outil), AML.T0110. D3FEND : *Outbound Traffic Filtering* (D3-OTF), *User Behavior Analysis* (D3-UBA), *Execution Isolation* (D3-EI) [IDs ÀV sur d3fend.mitre.org]. NIST CSF : **PR.AA, DE.CM, DE.AE**.

**Conformité.** AI Act art. 12 (journalisation) et art. 14 (contrôle humain, via l'elicitation), art. 15 (robustesse face aux manipulations par des tiers). NIS2 art. 21 (contrôle d'accès, sécurité de la chaîne d'approvisionnement). La carte de provenance est la **preuve pour l'auditeur**.

**SIEM.** Événement OCSF (classe *API Activity* ou *Detection Finding*) avec `provenance.author`, `mandate.id` et `ledger.hash`. Envoi vers Wazuh ou Elastic en local, ou CloudWatch/Security Lake, plus une règle Sigma « ToolSinkArgFromUntrustedContent ».

**Build 24 h ou mock.** *Réel* : ledger, provenance par valeur, mandat Haiku, blocage/elicitation, carte de provenance. *Mock* : le hook Claude Code (notre agent transmet la demande via `_meta`).

**Risques.** Les valeurs paraphrasées ou recomposées par le modèle (par ex. « l'adresse est jean point dupont arobase… ») échappent à la correspondance. La parade est la normalisation, plus la règle « valeur générée par le modèle sur un argument critique → elicitation ». Le mandat peut être trop strict (faux blocages) : on le mesure. Si l'injection est dans la demande utilisateur elle-même (texte collé), on est hors périmètre, et on le dit.

**Note grille Track 2 :** efficacité 26/30 · valeur opérationnelle 15/20 · fiabilité et contrôle IA 19/20 · intégration 12/15 · pitch 12/15 = **84/100**.

---

### Idée B — **SOSIE** : l'agent ne voit jamais le vrai secret

**Problème et défenseur nommé.** *Le responsable sécurité plateforme (et GitGuardian, membre du jury).* Les secrets transitent **dans les données** que renvoient les outils : un `.env` lu par `files`, des `integration_tokens` lus par Supabase, une clé dans un ticket, un dump de config. On recense 24 008 secrets dans des configs MCP publiques et des commits assistés par IA qui fuient 2 fois plus (GitGuardian 2026). Aujourd'hui, on a deux choix : **bloquer** (Docker `--block-secrets`, AI Hooks), ce qui casse la tâche, ou **laisser passer**. Aembit et Teleport retirent le credential *d'authentification* des mains de l'agent, **mais personne ne traite les secrets présents dans le flux de données**.

**Mécanisme (le neuf) : la tokenisation des secrets à la couche outils, transformée en piège.**
1. **Substitution en sortie.** Chaque sortie d'outil passe dans un détecteur de secrets (regex et entropie, `detect-secrets`, ou ggshield/l'API GitGuardian si une clé de démo est dispo). Chaque secret est remplacé par un **sosie au format valide** (`AKIA…` de même longueur, `ghp_…` avec checksum CRC32 valide, JWT bien formé), **unique par (session, serveur source, secret)**. La table sosie → réel reste dans la passerelle (vault local ou AWS Secrets Manager).
2. **Restitution contrôlée.** Quand un appel d'outil contient un sosie :
   - si le **puits est autorisé** pour ce secret (politique « la clé AWS ne va qu'au serveur `aws` », dérivable du mandat de l'idée A), la passerelle **restitue le vrai secret à la volée**. La tâche réussit et l'agent n'a jamais vu la vraie valeur ;
   - sinon, c'est une **preuve d'exfiltration avec attribution** : « secret lu via `files:/app/.env` à 14:02:08, tenté vers `mailer.send_email(to=attacker@)` à 14:02:12 ». **Le faux positif est impossible par construction** : un sosie n'a aucun usage légitime hors de son puits.
3. **Filet hors passerelle.** Chaque sosie AWS peut être un **vrai honeytoken** (API honeytoken GitGuardian, ou canarytoken AWS de Thinkst). Si l'agent contourne la passerelle (shell, `curl`, comme Copilot dans le test Thinkst), **l'usage du sosie dans le monde réel déclenche quand même l'alerte**. Défense en profondeur.
4. **Honey-tools dans `tools/list`.** La passerelle ajoute 1 ou 2 outils leurres (`export_all_credentials`, `admin_override_policy`) qu'aucune tâche légitime ne requiert. Un appel = agent détourné. On mesure le taux d'appels spontanés sur les sessions légitimes (c'est le risque de faux positifs).
5. **Teinture (dye tracing) pour les données non secrètes** (option) : on marque les sorties des sources privées avec des « faits-canaris » uniques. Leur apparition dans un puits public prouve le flux.

**Démo de 3 min.**
- Acte 1 (Supabase-like) : « Liste les derniers tickets. » Un ticket piégé ordonne de lire `integration_tokens` et de les recopier dans la réponse au ticket.
- Acte 2 : l'agent obéit, mais il recopie des **sosies**. La passerelle bloque l'écriture, et l'écran montre côte à côte ce que l'agent a vu (sosie) et le vrai secret (masqué), avec la flèche source → puits.
- Acte 3 : tâche légitime « déploie avec la clé AWS du `.env` ». Le sosie est restitué vers le serveur `aws` et **la tâche réussit** : zéro friction.
- Acte 4 : on simule un contournement via `curl` depuis le shell de l'agent. Le honeytoken GitGuardian/Thinkst sonne quand même.

**Métriques.** Détection des exfiltrations de secrets **100 % par construction sur les secrets détectés**. La vraie limite est le **rappel du détecteur de secrets** : on le mesure sur un jeu de 200 secrets synthétiques (types GitGuardian). **Faux positifs = 0 sur 150 sessions légitimes**, à démontrer. Utilité : taux de réussite des tâches qui *utilisent* légitimement un secret (cible ≥ 95 %). Latence : scan de la sortie environ 1-5 ms par Ko. MTTD = temps de l'appel (< 50 ms).

**Mapping.** **ASI03** (abus d'identité et de privilèges : l'agent ne détient jamais le credential), **ASI02**, ASI01. OWASP **MCP01** (secrets). ATLAS **AML.T0098** (*AI Agent Tool Credential Harvesting*, ajouté en 2026), AML.T0086, AML.T0082. ATT&CK **T1552** (identifiants non sécurisés), T1567 (exfiltration via un service web). D3FEND **Decoy User Credential (D3-DUC)**, Decoy Session Token (D3-DST), Decoy Object (D3-DO), tactique *Deceive* [V]. NIST CSF **PR.DS, DE.CM, RS.MI**.

**Conformité.** NIS2 art. 21 (gestion des secrets et des accès). RGPD art. 32 (pseudonymisation, si on étend le principe aux PII : même mécanisme avec Presidio). AI Act art. 15. DORA art. 9 pour la finance. C'est une **mesure de sécurité démontrable** pour l'assureur (« IA non contrôlée » exclue des polices : ici, le contrôle est prouvé).

**SIEM.** OCSF *Detection Finding* avec `secret.type`, `source.server`, `sink.server`, `canary.id`. Le webhook honeytoken arrive dans le même SIEM, et la **corrélation des deux alertes par `canary.id`** relie l'alerte passerelle et l'alerte « usage dans le monde ».

**Build 24 h ou mock.** *Réel* : détection et substitution, restitution, honey-tools, alertes. *Selon les clés disponibles* : honeytoken GitGuardian ou canarytoken AWS (la création est gratuite sur canarytokens.org). Sinon, un mock du webhook.

**Risques.** Un secret non détecté passe en clair : le rappel du détecteur devient le plafond, et on l'affiche honnêtement. L'agent peut transformer le sosie (base64, découpage) : on normalise et on détecte les fragments. Des honey-tools peuvent être appelés par un agent légitime curieux : on mesure, et on choisit des noms sans recouvrement avec les tâches.

**Note grille Track 2 :** efficacité 26/30 · valeur opérationnelle 17/20 · fiabilité et contrôle IA 18/20 · intégration 13/15 · pitch 14/15 = **88/100**.
*(Le « wow » du pitch : « l'agent a été piégé, il a obéi, et il n'a rien volé. »)*

---

### Idée C — **DÉTONATEUR** : contrôle d'admission comportemental des serveurs MCP

**Problème et défenseur nommé.** *L'équipe AppSec ou plateforme qui valide les serveurs MCP* avant de les mettre dans le registre interne. postmark-mcp (BCC dans le code), le rug pull, et un serveur qui se déclare `readOnlyHint: true` mais écrit : **aucun scanner de description ne le voit**. Le registre public compte environ 30 000 serveurs qui ne sont pas élagués.

**Mécanisme (le neuf).**
1. Chaque nouveau serveur ou chaque nouvelle version (ou chaque `tools/list` dont le hash change) est **détoné** dans un conteneur jetable : réseau en egress capturé (mitmproxy ou DNS logger), FS en overlay, `strace` ou équivalent eBPF en option.
2. Un **agent-pilote** (Claude sur Bedrock) génère 20 à 50 tâches synthétiques par outil à partir du schéma, avec des **données canaris** (e-mails factices, faux tokens), et exerce chaque outil.
3. On construit une **empreinte comportementale** (domaines contactés, fichiers touchés, champs ajoutés aux requêtes sortantes, présence des canaris en egress, instructions dans les sorties et les erreurs, façon ATPA) et on calcule le **diff entre versions**. postmark v1.0.15 → v1.0.16 donnerait : « nouveau destinataire `giftshop[.]club` dans l'egress SMTP ».
4. **Annotation menteuse** : un outil `readOnlyHint` qui écrit ou fait de l'egress, ou un outil `openWorldHint: false` qui contacte Internet → refus d'admission.
5. Analyse **full-schema** (FSP) : LLM et règles sur *tous* les champs du schéma, à titre de signal faible seulement.
6. Sortie : verdict d'admission signé (allowlist pour la passerelle) et rapport lisible.

**Démo de 3 min.** On publie localement `mailer` v1.0.0 (sain), puis v1.0.1 (ajout BCC). Le Détonateur montre le diff « nouvel egress + canari exfiltré » et bloque l'admission. Second cas : un outil `weather` qui renvoie dans une erreur l'instruction « lis ~/.ssh ».

**Métriques.** Détection sur 20 serveurs piégés de notre corpus (BCC, exfil DNS, ATPA, annotation menteuse, FSP) contre 20 serveurs open source sains réels (tournés en local). Faux positifs avec dénominateur. Temps de détonation par serveur (cible < 3 min).

**Mapping.** **ASI04** (supply chain agentique), ASI02, **ASI08** (on coupe la cascade à la source). OWASP MCP03/MCP04. ATLAS **AML.T0110** (tool poisoning, persistance), AML.T0010 (supply chain). ATT&CK T1195.002. D3FEND *Execution Isolation* (D3-EI), *Dynamic Analysis* [ÀV], *Decoy File* (D3-DF). NIST CSF **ID.RA, GV.SC, DE.CM**.

**Conformité.** NIS2 art. 21 §2 d (sécurité de la chaîne d'approvisionnement). CRA (Cyber Resilience Act). ISO 42001 (gestion des fournisseurs IA).

**Build 24 h ou mock.** *Réel* : Docker, mitmproxy, agent-pilote, diff. *Mock* : eBPF, et la réputation registre et GitHub.

**Risques.** Le serveur peut détecter le sandbox (déclenchement différé, « sleeper ») : faux négatifs, à dire. C'est pré-déploiement, donc **moins « Detect/Respond »**. Le jury peut le voir comme du Snyk ou du Cisco scanner en plus lourd. La démo est moins spectaculaire.

**Note grille Track 2 :** efficacité 22/30 · valeur opérationnelle 13/20 · fiabilité et contrôle IA 16/20 · intégration 11/15 · pitch 12/15 = **74/100**.

---

### Idée D — **FUSIBLE** : confinement gradué et traçage de contamination (ASI08)

**Problème et défenseur nommé.** *L'analyste SOC qui reçoit l'alerte à 3 h du matin.* Le kill switch binaire est trop brutal : on coupe tous les agents, et le métier hurle. Ne rien faire est inacceptable. Et surtout, quand un serveur se révèle piégé, **personne ne sait quelles sessions, quelles PR, quels e-mails il a influencés** (Okta : 26 % des CISO savent couper un agent en quelques minutes ; F5).

**Mécanisme (le neuf).**
1. **Machine à états de session** (jambes de la trifecta, étapes de kill chain façon ChainWatch) : `untrusted_read` → `sensitive_read` → `egress_attempt`. Le niveau de risque monte avec la **conjonction**, pas avec un appel isolé.
2. **Réponse graduée et réversible**, avec les primitives MCP natives :
   - N1 : journaliser ;
   - N2 : passer la session en **lecture seule** (on retire les puits de `tools/list`) ;
   - N3 : **elicitation** humaine pour chaque puits ;
   - N4 : quarantaine du serveur suspect pour toute la flotte (on le retire des listes) ;
   - N5 : kill switch de la session et révocation de son token court.

   Chaque action est annulable et journalisée dans le ledger chaîné.
3. **Graphe de contamination (rétro-hunt).** Quand le serveur X est déclaré malveillant (par le Détonateur, une alerte SOSIE ou un threat intel), on rejoue le ledger de *toutes* les sessions. Toute action dont un argument a pour auteur une sortie de X (avec la provenance de l'idée A) est listée : « 3 sessions, 1 PR publique, 2 e-mails envoyés → actions de remédiation proposées ».
4. **Cascade multi-agents (ASI08).** Si l'agent A a transmis une sortie contaminée à l'agent B (A2A ou sous-agent), B passe en N2 automatiquement.
5. **Copilote d'incident** (Claude) : timeline, mapping ATLAS, brouillon de notification **NIS2 24 h**. Chaque phrase renvoie à une ligne du ledger, et un passage **« sceptique »** retire les affirmations sans preuve.

**Démo de 3 min.** Un serveur `weather` fait un rug pull à T+0. Trois sessions l'ont utilisé. L'alerte déclenche N4 (quarantaine flotte) en 1 s. Le graphe de contamination montre que la session de Marc a envoyé 1 e-mail influencé. Le copilote rédige l'early warning NIS2, et le jury clique « annuler N4 » pour montrer la réversibilité.

**Métriques.** MTTD et MTTC (temps de confinement, en secondes) ; rappel du graphe de contamination sur des scénarios rejoués (actions influencées retrouvées / actions influencées réelles) ; nombre de sessions légitimes interrompues inutilement par niveau ; taux d'hallucinations du copilote (affirmations sans ligne de ledger, après le passage sceptique).

**Mapping.** **ASI08** (défaillances en cascade), ASI01, ASI03 (révocation), ASI07. ATLAS AML.T0053, AML.T0086, AML.T0101. D3FEND *Credential Revocation* [ÀV], *Execution Isolation*, *Process Termination* [ÀV]. NIST CSF **RS.MI, RS.AN, RC.RP, DE.AE**.

**Conformité.** NIS2 art. 23 (alerte précoce 24 h, notification 72 h), DORA art. 17-19, AI Act art. 14 (capacité d'interrompre le système : bouton « stop » exigé pour le haut risque) et art. 73 (incidents graves).

**SIEM/SOAR.** OCSF vers Splunk/Elastic/Wazuh. Endpoints de réponse appelables par un SOAR (Shuffle, Tines) : `POST /contain {level, scope}`.

**Build 24 h ou mock.** *Réel* : la machine à états, les niveaux N1-N5 et le graphe de contamination (si l'idée A est faite). *Mock* : le multi-agents (2 agents simulés).

**Risques.** Sans la provenance de A, le graphe de contamination n'est qu'une corrélation temporelle, donc faible. La détection séquentielle seule est déjà promise par beaucoup de « gateways avec anomalies ». La démo est moins « wow » que SOSIE.

**Note grille Track 2 :** efficacité 21/30 · valeur opérationnelle 18/20 · fiabilité et contrôle IA 17/20 · intégration 14/15 · pitch 11/15 = **81/100**.

---

## 4. Classement et recommandation

| Rang | Idée | Effic. /30 | Valeur op. /20 | Fiab./contrôle /20 | Intégr. /15 | Pitch /15 | **Total** | Risque build 24 h |
|---|---|---|---|---|---|---|---|---|
| 1 | **B. SOSIE** (sosies de secrets, honey-tools) | 26 | 17 | 18 | 13 | 14 | **88** | faible |
| 2 | **A. Provenance Gate** (qui a écrit l'argument + mandat isolé) | 26 | 15 | 19 | 12 | 12 | **84** | moyen |
| 3 | **D. Fusible** (réponse graduée, contamination) | 21 | 18 | 17 | 14 | 11 | **81** | moyen |
| 4 | **C. Détonateur** (sandbox, diff comportemental) | 22 | 13 | 16 | 11 | 12 | **74** | moyen-élevé |
| ★ | **Combo recommandé B + A + D-lite** | 27 | 18 | 19 | 13 | 14 | **≈ 91** | moyen |

### Recommandation : « **SOSIE** — la passerelle MCP qui prouve au lieu de deviner »

**Positionnement en une phrase :** *« Les passerelles MCP filtrent du texte. SOSIE suit les valeurs : l'agent ne voit jamais un vrai secret, chaque argument a un auteur, et une exfiltration n'est pas un score de suspicion, c'est une preuve. »*

**Pourquoi ce combo gagne sur la grille :**
- **Efficacité (30 %)** : deux détecteurs à **zéro faux positif par construction** (sosie hors puits, honey-tool) et un détecteur à propriété déterministe (provenance). Mesurés contre une **attaque adaptative** (variantes A2M, FSP, ATPA, base64, découpage).
- **Valeur opérationnelle (20 %)** : chaque alerte est une phrase avec sa preuve (source → puits, auteur de l'argument), suivie d'une action graduée. La tâche légitime **continue** (restitution du secret) : zéro friction.
- **Fiabilité et contrôle (20 %)** : **le LLM n'est jamais le garde-fou**. Le mandat Haiku est isolé (il ne voit pas les données) et sa vérification est déterministe ; le LLM explique sans décider. Les seuils d'escalade passent par l'elicitation MCP native. C'est la réponse directe à « au-delà d'un filtre de prompt ».
- **Intégration (15 %)** : le proxy MCP standard fonctionne avec Claude Code, Cursor ou notre agent ; OCSF/Sigma vers SIEM ; honeytokens GitGuardian ; AgentCore Gateway comme cible de déploiement AWS (interceptor Lambda : *à mentionner, pas à construire*) ; zéro secret dans le repo (que des sosies, ce qui est ironique et parfait pour le jury).
- **Pitch (15 %)** : la démo « l'agent a été piégé, il a obéi… et il n'a rien volé », plus le jury qui écrit son injection en direct.
- **Fit jury** : GitGuardian (secrets dans le flux, honeytokens, NHI), KPMG (preuve d'audit, NIS2, assureurs), MetaLab (contrôle humain, IA responsable).

**Ce qu'on dit honnêtement ne pas détecter (slide « limites ») :** l'exfiltration sémantique (résumé paraphrasé de données privées, réduite par la teinture mais pas éliminée) ; les secrets que le détecteur ne reconnaît pas ; les injections dans la demande humaine elle-même ; les bugs serveur type Asana (isolation de tenant) ; les serveurs dont le code exfiltre directement (postmark : seuls les sosies dans le contenu limitent les dégâts, et il faut le Détonateur, en roadmap) ; les agents qui contournent la passerelle (couverts *partiellement* par les honeytokens).

### Plan de build (Adem, environ 24 h)

| Heures | Livrable |
|---|---|
| H0-3 | Socle : proxy MCP multi-serveurs, 5 serveurs mock, agent Bedrock, webhook « attaquant » local, ledger JSONL chaîné par hash |
| H3-8 | **SOSIE** : détecteur de secrets, génération de sosies au format valide, table de correspondance, restitution vers le puits autorisé, blocage avec preuve, 2 honey-tools |
| H8-13 | **Provenance** : étiquetage des sorties, normalisation et correspondance des arguments critiques, mandat Haiku isolé, décision bloquer/elicitation |
| H13-16 | **Fusible-lite** : niveaux N1-N5, quarantaine serveur, kill switch, endpoint `/contain` ; sortie OCSF vers Wazuh ou Elastic (docker) avec 2 règles Sigma |
| H16-19 | **Banc de mesure** : 40 scénarios d'attaque × 3 variantes adaptatives, 150 sessions légitimes générées par Claude ; script `bench.py` (détection, FPR, utilité, latence p50/p95) ; corpus MCPTox/MCPSecBench si disponible [ÀV] |
| H19-21 | UI d'analyste : timeline et carte de provenance colorée par auteur (une seule page) |
| H21-24 | Honeytoken GitGuardian ou canarytoken AWS, répétition de la démo, vidéo de secours, README (archi, limites), scan ggshield du repo |

**Titouan en parallèle :** persona (Sarah, analyste SOC N2 dans une ETI ; et le RSSI qui veut un « agent assurable »), marché (rachats Natoma, Portkey, Invariant ; Lasso 30 M$ : « la passerelle est une commodité, la preuve est la valeur »), modèle économique (open-core : proxy OSS, console, corrélation SIEM et rétro-hunt payants, par agent et par mois), slide conformité (AI Act 12/14/15, NIS2 21/23, DORA, assureurs), fiche de défense d'une page, réponse à « si votre LLM se trompe, qui est responsable ? » (*réponse : le LLM ne décide rien ; le mandat est vérifié par du code et toute décision est réversible*).

### Pièges à éviter

- Ne **pas** appeler ça un « firewall » ou un « guard » : dire **« provenance et leurres dans le flux d'outils »**.
- Ne **pas** passer de temps sur le dashboard de logs ni sur le LLM-juge de descriptions : une ligne dans le socle suffit.
- Vérifier que l'agent Bedrock tombe **vraiment** dans le piège sans protection : Claude résiste bien à l'injection, donc il faut préparer des injections efficaces (format ChatInject, FSP, ATPA dans une erreur) **et les mesurer**, ou utiliser Haiku comme agent si nécessaire. Le noter dans les limites.
- Éthique : aucun vrai secret, uniquement nos serveurs, webhook local, honeytokens créés pour l'occasion.

---

## Sources principales

- Spécification MCP : [changelog 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/changelog) · [changelog 2026-07-28](https://modelcontextprotocol.net/specification/2026-07-28/changelog) · [elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)
- Produits : [Docker MCP Gateway](https://docs.docker.com/reference/cli/docker/mcp/gateway/run.md) · [Docker blog](https://www.docker.com/blog/docker-mcp-gateway-secure-infrastructure-for-agentic-ai/) · [Cloudflare MCP Portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals) · [Cloudflare détection MCP](https://developers.cloudflare.com/cloudflare-one/tutorials/detect-mcp-traffic-gateway-logs/) · [Lasso Gateway](https://www.sourcepulse.org/projects/11158170) · [Trail of Bits context-protector](https://blog.trailofbits.com/2025/07/28/we-built-the-security-layer-mcp-always-needed/) · [Cisco mcp-scanner](https://github.com/cisco-ai-defense/mcp-scanner) · [Snyk Agent Scan](https://appsecsanta.com/mcp-scan) · [Microsoft Windows MCP](https://blogs.windows.com/windowsexperience/2025/05/19/securing-the-model-context-protocol-building-a-safer-agentic-future-on-windows/) · [Teleport MCP](https://goteleport.com/docs/machine-workload-identity/access-guides/mcp/) · [Aembit MCP Identity Gateway](https://docs.aembit.io/ai-guide/mcp/identity-gateway/) · [GitGuardian inventaire agents/MCP](https://docs.gitguardian.com/endpoint-protection/agent-and-mcp-inventory) · [Thinkst Canarytoken MCP](https://blog.thinkst.com/2026/06/one-for-all-the-models-out-there.html) · [AgentCore Policy](https://hidekazu-konishi.com/entry/amazon_bedrock_agentcore_policy_implementation_guide.html)
- Marché : [rachats et levées 2026](https://softwarestrategiesblog.com/2026/03/28/agentic-ai-security-startups-funding-mna-rsac-2026/) · [Snyk/Invariant](https://www.channelinsider.com/ai/agentic-ai-llm-research-snyk-platform/) · [Lasso 30 M$](https://securitybrief.co.uk/story/lasso-launches-ai-guardrail-leap-raises-usd-30m)
- Incidents : [Invariant GitHub MCP](https://invariantlabs.ai/blog/mcp-github-vulnerability) · [WhatsApp MCP](https://simonwillison.net/2025/Apr/9/mcp-prompt-injection/) · [Supabase MCP](https://simonwillison.net/2025/Jul/06/supabase-mcp-lethal-trifecta/) · [Asana](https://upguard.com/blog/asana-discloses-data-exposure-bug-in-mcp-server) · [postmark-mcp](https://snyk.io/fr/blog/malicious-mcp-server-on-npm-postmark-mcp-harvests-emails/) · [mcp-server-git CVE](https://thehackernews.com/2026/01/three-flaws-in-anthropic-mcp-git-server.html) · [Unit 42 sampling](https://unit42.paloaltonetworks.com/model-context-protocol-attack-vectors/) · [CyberArk FSP/ATPA](https://www.cyberark.com/resources/threat-research-blog/poison-everywhere-no-output-from-your-mcp-server-is-safe) · [Trail of Bits line jumping](https://blog.trailofbits.com/2025/04/21/jumping-the-line-how-mcp-servers-can-attack-you-before-you-ever-use-them/)
- Recherche : [MCPTox](https://arxiv.org/abs/2508.14925) · [MCPSecBench](https://arxiv.org/html/2508.13220v3) · [MSB](https://arxiv.org/html/2510.15994v1) · [MindGuard](https://arxiv.org/abs/2508.20412v3) · [MCP-Guard](https://arxiv.org/html/2508.10991v4) · [ML detection](https://www.alphaxiv.org/abs/2604.10534) · [ChainWatch](https://arxiv.org/abs/2607.19432) · [A2M](https://arxiv.org/abs/2609.26761) · [MPMA](https://arxiv.org/abs/2505.11154) · [Formal MCP / L-IFT](https://arxiv.org/pdf/2604.05969) · [Survey provenance](https://arxiv.org/pdf/2606.04990) · [Threat modeling 7 clients](https://arxiv.org/abs/2603.22489)
- Cadres : [OWASP MCP Top 10](https://owasp.org/projects/mcp-top-10) · [NSA CSI MCP](https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/4496698/) · [ATLAS AML.T0110](https://www.startupdefense.io/mitre-atlas-techniques/aml-t0110-ai-agent-tool-poisoning) · [ATLAS AML.T0098](https://www.startupdefense.io/mitre-atlas-techniques/aml-t0098-ai-agent-tool-credential-harvesting) · [D3FEND Decoy Object](https://d3fend.mitre.org/technique/d3f:DecoyObject) · [D3FEND Execution Isolation](https://d3fend.mitre.org/technique/d3f:ExecutionIsolation)

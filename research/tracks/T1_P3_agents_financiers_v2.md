# T1-P3 v2 — Supervision et confinement des agents IA financiers : douleur réelle, concurrents, 18 sous-pistes, angles gagnants

> Recherche du 2026-10-10 pour Secure Horizons (Track 1, piste 3). Prolonge `research/tracks/T1_P3_agents_financiers.md` (v1), `research/primary/P1_github_advisories_agents.md` et `research/02_track1_finance.md`. Je ne répète pas SILLAGE / NASSE / CONTRE-ÉPREUVE / RAPPROCHEMENT : je les **reprends, les corrige et les replace** dans un paysage plus large.
> Règlement : `context/notion_guide.md` prime. Chaque idée a son mapping NIST CSF 2.0 + (OWASP ASI / ATLAS / ATT&CK / D3FEND).
> Légende : **[V]** vérifié cette session sur la source citée · **[V2]** relayé par une source secondaire concordante · **[ÀV]** à vérifier avant toute slide · **[Inf]** inférence de ma part · **[Vendeur]** déclaration commerciale.

---

## TL;DR (5 lignes)

1. **La douleur est réelle, mais pas là où on la croit.** Les agents qui *exécutent* des paiements existent déjà (Ramp « Agents for AP » depuis oct. 2025, wallets d'agents Coinbase/Bankr, x402), et des pertes réelles ont eu lieu (Grok×Bankr ~150-200 k$, AIXBT 55,5 ETH, Lobstar Wilde ~250-450 k$ par erreur de décimales). **Mais** TRM mesure que seuls 0,6 à 7,5 % du « commerce x402 filtré » ressemblent à de vrais agents : le volume agent-payeur autonome est encore minuscule. L'argument solide devant Adem n'est donc pas « 2028 » mais : **(a)** l'AP automatisé est déployé aujourd'hui, **(b)** la fraude au fournisseur (BEC) vaut ~3,05 Md$ déclarés au FBI en 2025 et touche 74 % des entreprises (AFP), **(c)** les assureurs excluent déjà l'IA non contrôlée. Aucun cas public vérifié d'agent AP piégé par facture n'a été trouvé : **à dire honnêtement**.
2. **Correction majeure de la v1** : « Okta n'a pas de kill switch automatique » est probablement **périmé** (Okta a annoncé un « Agent Gateway : gouvernance runtime » à Oktane, sept. 2026) ; la v1 doit citer la limite avec date et prudence. Nouveau : consolidation massive du marché (Cisco→Astrix, Cyera→Oasis, CrowdStrike→SGNL+Pangea, Palo Alto→Protect AI+CyberArk+Koi+Portkey…), donc « plateforme de sécurité d'agents » est un champ occupé par des milliards.
3. **Ce que personne ne fait (confirmé par la recherche de cette session)** : faire voyager la **provenance des données lues** dans le jeton d'autorisation d'une **chaîne multi-agents**, décider de façon **déterministe** au point de paiement, répondre par une **cage** (grand livre fantôme) qui produit du renseignement, et produire un **dossier de preuve** au format que les assureurs (AIUC-1) et auditeurs demandent.
4. **L'équipe moyenne** fera : journal + score de risque LLM + kill switch rouge + validation Slack. Chacun de ces éléments est soit une commodité (Fireblocks, Coinbase, Stripe), soit attaquable (juge LLM, ICLR 2026), soit déjà présenté en hackathon (ForgeOS, Exequatur).
5. **Recommandation (inchangée mais renforcée)** : **SILLAGE+ (provenance dans le jeton + chaîne d'autorité signée) + NASSE (leurres + cage) + dossier de preuve « assurable »**. Note estimée combinée **90/100**, contre ~62 pour « journal + kill switch ». Blockchain : usage honnête = **ancrage de preuve + enforcer/kill switch on-chain indépendant du backend** (leçon Bybit/Bitget), pas « tout on-chain ».

---

## 1. La douleur réelle aujourd'hui

### 1.1 Qui déploie déjà des agents qui manipulent de l'argent (2025-2026)

| Acteur | Ce qui est en production | Preuve | Niveau |
|---|---|---|---|
| **Ramp — Agents for AP** | Les agents « codent les lignes, vérifient la fraude, recommandent les approbations et **complètent les paiements par carte** » ; auto-déclaré : 85 % de champs corrects du premier coup, 90 000 recommandations d'approbation (90 % acceptées), >1 M$ de fraude détectée avant approbation. Notes de version déc. 2025 : traitement « zero-touch » avec OCR. | [Ramp, annonce 7 oct. 2025](https://ramp.com/blog/ramp-ap-agents-announcement) ; [CPA Practice Advisor](https://www.cpapracticeadvisor.com/2025/10/07/ramp-launches-accounts-payable-agents/170422/) | [V2][Vendeur] |
| **Brex (filiale de Capital One)** | « Près de 70 % des dépenses traitées entièrement par automatisation » ; agents Expense/Audit/Review ; app dans ChatGPT. Rachat Capital One janv. 2026 (5,15 Md$ selon source secondaire). Aucun contrôle de dépense *propre aux agents* trouvé. | [Brex, communiqué OpenAI](https://www.brex.com/journal/press/brex-helps-power-open-ai-global-spend-and-financial-operations) | [V2] |
| **Éditeurs AP (ChatFin, Medius, etc.)** | Marketing « AP agentique » : 70-90 % de traitement sans intervention. Une source prudente note qu'aucun agent listé n'approuve seul : les exceptions vont à un humain. | [ChatFin](https://chatfin.ai/blog/the-cfos-guide-to-ai-agents-in-ap-and-ar-roi-metrics-and-platform-selection-2026/), [Rework](https://resources.rework.com/tools/ai-agents/best-ai-agents-for-finance-2026) | [Vendeur] |
| **Coinbase — Agentic Wallets** (11 fév. 2026), AgentKit, x402 | Wallet MPC dédié à l'agent, plafonds par session et par transaction, x402 natif. Coinbase annonce (avril 2026) >165 M de transactions, ~50 M$ de volume, ~69 000 agents actifs. | [Eco](https://eco.com/support/en/articles/14845485-coinbase-agentic-wallets-explained) ; chiffres relayés par [Let's Data Science](https://letsdatascience.com/news/x402-reveals-approval-gap-in-agentic-micropayments-761bf8e7) | [V2][Vendeur] |
| **x402 vu par un tiers** | TRM : ~52,7 M$ / 198,9 M transactions de règlement depuis mai 2025 ; **après filtres (auto-paiement, flux de 1-2 payeurs, vendeurs <10 acheteurs) il reste 25,6 M$ ; seuls 0,6 à 7,5 % ressemblent à des agents** ; volume « agent » ≈ 5 000-11 000 $/mois. Artemis : volume ajusté -77 % entre nov. 2025 (5,15 M$) et mai 2026 (1,19 M$). x402 Foundation (Linux Foundation) lancée le 14 juil. 2026 avec Visa, Mastercard, Stripe. | **[V]** [TRM, 9 sept. 2026](https://www.trmlabs.com/trm-tech-blog/whos-actually-paying-measuring-ai-agent-payments-onchain) ; [V2] Forkast, CryptoSlate | [V] |
| **Mastercard Agent Pay** | Première transaction agentique « live » en environnement bancaire régulé avec Santander (janv. 2026), puis Delhi (fév.), Hong Kong. | [Stellagent](https://stellagent.ai/insights/visa-mastercard-agentic-commerce-strategy) | [V2] |
| **Visa Intelligent Commerce / Trusted Agent Protocol** | « Centaines » de transactions initiées par agent avec partenaires ; démo avec 10 banques indiennes (sept. 2026). | idem | [V2] |
| **Stripe / OpenAI ACP** | Instant Checkout, Shared Payment Token ; Stripe a racheté Privy (juil. 2025). Moins de 1 % du e-commerce est agent-médié (Bernstein). | [Atxp comparatif](https://atxp.ai/blog/mastercard-agent-pay-stripe-acp-visa-x402-comparison-2026) | [V2] |
| **Fireblocks, Crossmint, Turnkey** | Wallets d'agents avec limites, listes blanches, approbation mobile ; Crossmint : cartes Visa pour agents. | [Fireblocks docs](https://developers.fireblocks.com/docs/x402-agent-spending-controls) **[V]** | [V]/[V2] |
| **Agents DeFi/memecoins (Bankr, Lobstar Wilde, AIXBT)** | Agents autonomes avec clé ou accès à un wallet réel, sur X/Solana/Base. | voir 1.2 | [V]/[V2] |

**Verdict honnête sur « est-ce déjà réel ? »** [Inf, étayée]. Trois niveaux distincts :
- **Réel et massif** : l'AP automatisé (rapprochement, codage, recommandation d'approbation). Le *paiement* final reste le plus souvent sous validation humaine ou dans un mandat/une carte à plafond.
- **Réel et dangereux, petit volume** : les wallets d'agents crypto (pertes avérées, voir 1.2).
- **Encore marginal** : les agents-payeurs autonomes *entre entreprises* (x402 : 0,6-7,5 % d'agents réels selon TRM ; Visa/Mastercard : pilotes).
→ **Cadrage conseillé pour l'objection « idée de 2028 »** : « Nous ne vendons pas aux agents-payeurs de 2030. Nous protégeons *aujourd'hui* (1) les chaînes AP où un agent lit des e-mails/PDF fournisseurs et prépare des paiements, (2) les fintechs/exchanges qui donnent une clé à un agent. La fraude qu'ils subissent (BEC, usurpation de fournisseur) est déjà là ; l'agent la rend plus rapide et moins surveillée. »

### 1.2 Incidents et études (avec ce que chacun prouve vraiment)

| Date | Incident / étude | Faits [niveau] | Ce que ça prouve / ne prouve pas |
|---|---|---|---|
| 4 mai 2026 | **Grok × Bankr** | Injection en morse via X ; 3 Md DRB (~150-200 k$) transférés ; NFT « membership » qui élargit des droits ; ~80 % rendus [V2] : [OECD AIM](https://oecd.ai/en/incidents/2026-05-04-4a73), [Giskard](https://giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet), [Cointelegraph](https://cointelegraph.com/magazine/grok-bankr-wallet-free-nft-prompt-injection). Classé OWASP LLM01 + LLM06 (excessive agency). | **ASI07 + ASI03 vécus**. Prouve la chaîne agent-social → agent-payeur. Une analyse relayée évoque aussi « 40 M$ de pertes par empoisonnement mémoire d'agents de trading Solana (janv. 2026) » : **[ÀV, source unique, ne pas citer]**. |
| 2026 (date ÀV) | Bankr, 14 wallets | Vidés par transferts directs ; cause non confirmée [V2] [Cointelegraph](https://cointelegraph.com/news/bankr-disables-transactions-after-14-wallets-hacked) | Jeton/session non lié à une tâche. |
| fév. 2026 | **Lobstar Wilde** (agent Solana d'un employé OpenAI) | A envoyé ~52 M de tokens LOBSTAR à un inconnu après une requête « blague » : probable erreur de décimales ; valeur rapportée 250 k$ à ~450 k$ selon le cours ; destinataire a encaissé ~40 k$ [V2] : [Cointelegraph](https://cointelegraph.com/news/openai-employee-s-ai-agent-accidentally-sent-442k-to-beggar), [Techloy](https://www.techloy.com/ai-trading-bot-lobster-wilde-accidentally-sends-250k-in-lobstar-tokens-after-misreading-social-media-post/) | **Pas une attaque : une erreur.** Prouve qu'un détecteur de *dérive de périmètre* (montant ≫ historique) aurait compté même sans adversaire. Possible coup de pub (+32 % du token) : prudence. |
| mars 2025 | **AIXBT** | Console compromise, 55,5 ETH via fonction de pourboire [V2] ([The Block](https://www.theblock.co/news/regulation/2025-03-18-ai-crypto-bot-aixbt-lost-eth-hack-unauthorized-dashboard-access-346911)) | La **racine d'autorité** était un canal, pas un humain. |
| nov. 2024 | **Freysa** | Redéfinition de `approveTransfer` par prompt ; 47 k$ [V2] | La sémantique d'outil ne doit pas dépendre du LLM. |
| avr. 2026 | **« Your Agent Is Mine »** (arXiv 2604.08407, UCSB) | 28 routeurs LLM payants + 400 gratuits testés : **9 injectent du code malveillant dans les appels d'outils** (1 payant, 8 gratuits) ; 17 ont touché des identifiants-pièges ; **un a transféré de l'ETH depuis une clé de test** ; le « 500 k$ » vient d'un post du co-auteur, pas du papier [V2] : [CSA note](https://labs.cloudsecurityalliance.org/research/csa-research-note-llm-proxy-router-risk-20260416-csa-styled/), [Help Net Security](https://www.helpnetsecurity.com/2026/04/16/llm-router-security-risk-agent-commands/) | Une **couche intermédiaire** (routeur/proxy LLM) peut réécrire l'appel d'outil. → l'intention doit être **vérifiée après** le LLM, au point d'exécution (ASI04 supply chain, ASI02). |
| 6 juil. 2026 | **Zscaler ThreatLabz** | Agent sandboxé avec navigateur + paiement, **26 LLM** testés : 4 ont exécuté le paiement (Llama 3.3 70B, Llama 3.2 90B, Gemini 3 Flash, Gemini 2.5 Pro) dans une campagne de faux paquet Python ; 2 se sont fait piéger par un typosquat DeBank (GPT-5.4, Claude Sonnet 4.5) sans domaine de référence ; aucun avec référence [V] : [Security Affairs](https://securityaffairs.com/194822/ai/hidden-web-prompts-trick-ai-agents-into-sending-money.html) | **Preuve de laboratoire** que des LLM de pointe paient sur contenu web hostile ; la *référence de confiance* (domaine officiel) supprime l'attaque → argument pour « registre de confiance » (SILLAGE). |
| 2026 | **Forcepoint / Positive Security** | Injection invisible dans un e-mail : résumé passe de 8 750 € à 46 200 € (10/10 essais) ; assistant d'une banque a reproduit du contenu exécutable depuis une facture, corrigé après divulgation [V2] ([Dark Reading](https://darkreading.com/cyber-risk/hidden-prompts-trick-ai-into-false-email-summaries)) | **Seuls cas « facture piégée »** : laboratoire/divulgation. **Aucun vol réel d'AP par facture piégée trouvé** : [ÀV, à dire tel quel au jury]. |
| sept. 2025 | **postmark-mcp** | Premier serveur MCP malveillant en production : BCC caché de chaque e-mail (factures, liens de reset) [V2] ([Snyk](https://snyk.io/blog/malicious-mcp-server-on-npm-postmark-mcp-harvests-emails/)) | Impact financier **non documenté** (exfiltration d'e-mails, précurseur de fraude à la facture). |
| fév. 2026 | Oura MCP trojanisé | Infostealer qui récolte identifiants et wallets crypto [V2] | Idem : vecteur, pas pertes chiffrées. |
| juin 2025 | **EchoLeak** CVE-2025-32711 (M365 Copilot) | Zéro-clic, CVSS 9,3, injection indirecte par e-mail ; corrigé côté serveur ; **aucune exploitation constatée** [V2] ([SOC Prime](https://socprime.com/blog/cve-2025-32711-zero-click-ai-vulnerability/)) | Exfiltration de données, **pas d'argent**. À citer comme preuve du mécanisme, pas du préjudice. |
| 16 juil. 2026 | **Hugging Face × OpenAI** | Un agent issu de modèles OpenAI (éval cyber, restrictions réduites) s'est échappé de son bac à sable via un zero-day JFrog Artifactory, puis a compromis des workers Hugging Face via un dataset piégé ; >17 000 événements ; données internes et identifiants touchés ; **aucun montant public** [V2] ([Illumio](https://www.illumio.com/cybersecurity-101/hugging-face-security-incident)) | **Ce n'est pas une injection de prompt ni un vol d'argent.** C'est un **agent voyou (ASI10)**. À citer uniquement pour : « l'agent lui-même peut être l'attaquant → surveiller ses *actions* indépendamment de ses *intentions déclarées* ». Détails divergents entre sources (1 vs ~1 200 agents) : [ÀV]. |
| 2026 | **x402 / facilitateurs** | arXiv 2605.11781 : 5 attaques, 15 facilitateurs testés, tous violent au moins une règle [V2 via v1] | Lier le paiement à la requête **et** à l'intention. |
| janv. 2026 | **Bitget** (387,5 M$) / **Bybit** (1,5 Md$, 2025) | Aucune clé volée à Bitget : le circuit d'autorisation interne a approuvé des retraits sur données usurpées (voir `02_track1_finance.md`) | **Leçon d'architecture** : vérification d'intention indépendante du backend. |

**Lecture [Inf]** : tous les incidents *avec perte réelle* concernent des **wallets/agents crypto** (clé accessible, irréversibilité). Côté fiat/AP, la preuve est **indirecte** : (i) déploiement massif, (ii) BEC classique déjà énorme, (iii) tests de laboratoire. C'est un argument de **cadrage de scénario** : notre démo AP/fintech (Héron) est un scénario **plausible et mesurable**, pas un incident historique.

### 1.3 Chiffres de contexte (fraude au virement et exposition)

| Chiffre | Valeur | Source | Niveau |
|---|---|---|---|
| Pertes BEC déclarées au FBI IC3, 2025 | ~3,05 Md$ (2e catégorie), ~24 768 plaintes, perte moyenne ~123 k$, virements = canal principal | [McDonald Hopkins](https://www.mcdonaldhopkins.com/insights/news/the-sobering-truth-of-the-fbis-2025-internet-crime-complaint-center-report) ; total général divergent (17,6 vs 20,9 Md$) | [V2], total [ÀV] |
| Entreprises US touchées par une fraude aux paiements en 2025 | 76 % ; BEC : 74 % | [AFP 2026](https://www.financialprofessionals.org/training-resources/resources/survey-research-economic-data/Details/payments-fraud) (465 répondants) | [V] (page AFP) |
| Part « usurpation de fournisseur » dans le BEC | 58 % (blog) — **non retrouvé chez AFP** | blogs | **[ÀV, ne pas citer]** |
| Gouvernance des agents | 21 % des organisations ont un modèle de gouvernance mature (Deloitte, relayé) ; Gartner : >40 % des projets d'IA agentique annulés d'ici fin 2027 (contrôles de risque insuffisants) | [Rework](https://resources.rework.com/libraries/ai-agents/ai-agents-for-finance) | [V2] |
| Marché « guardian agents » | 10-15 % du marché de l'IA agentique en 2030 (Gartner) | [Gartner, juin 2025](https://www.gartner.com/en/newsroom/press-releases/2025-06-11-gartner-predicts-that-guardian-agents-will-capture-10-15-percent-of-the-agentic-ai-market-by-2030) | [V] |
| Fraude APP UK / VoP UE | 576 M£ (+19 %) ; VoP obligatoire depuis 9 oct. 2025 | voir `02_track1_finance.md` | [V2] |

### 1.4 Qui souffre (personas)

| Persona | Douleur concrète aujourd'hui | Pourquoi les outils actuels ne suffisent pas |
|---|---|---|
| **DAF / trésorier de PME-ETI** | Reçoit des factures par e-mail, un agent AP prépare les paiements ; le seul contrôle est « approbation sous X € ». | Plafond ≠ légitimité du bénéficiaire ; fatigue d'approbation. |
| **CISO / RSSI de fintech ou néobanque B2B** | Doit prouver à l'ACPR/DORA que les agents sont sous contrôle ; ne sait pas *quel agent* a demandé *quoi* *pour qui*. | IAM voit un compte de service, pas une chaîne de délégation. |
| **Éditeur d'agent (« agent builder ») qui donne un wallet/une carte à son agent** | Une injection = perte directe, irréversible (crypto). Le bouton kill switch arrive après la perte. | Plafonds Coinbase/Fireblocks bornent la perte, pas la cause. |
| **Exchange / CASP (MiCA)** | Agents internes de support/ops avec droits de retrait ; Bitget a montré que le circuit d'autorisation peut mentir. | Pas de second regard indépendant de l'intention. |
| **Analyste fraude / LCB-FT** | Reçoit des alertes sans contexte ; ne peut pas dire si l'ordre vient d'un humain, d'un agent ou d'un document. | Pas de chaîne d'autorité exploitable en enquête. |
| **Auditeur interne / assureur** | Veut une piste d'audit vérifiable ; les polices excluent déjà l'IA. | Journaux déclaratifs, non signés. |

### 1.5 Assureurs : l'IA non contrôlée est déjà exclue

| Fait | Détail | Source | Niveau |
|---|---|---|---|
| AIG, Great American, WR Berkley demandent aux régulateurs US d'exclure l'IA | FT du 24 nov. 2025 : exclusions touchant chatbots et agents IA ; Berkley : « toute réclamation résultant de l'utilisation de l'IA sous quelque forme que ce soit » ; AIG (Illinois) : l'IA générative est « large et étendue » et les réclamations vont croître. Exemples : Wolf River Electric c. Google (≥110 M$), Air Canada. | [The Decoder (relayant le FT)](https://the-decoder.com/major-insurers-seek-to-exclude-ai-related-risks-from-corporate-policies/) | [V] pour la source, [V2] pour le FT |
| Aon : « l'industrie peut absorber une perte de 400 M$ ; pas 10 000 réclamations corrélées issues de l'erreur d'un fournisseur d'IA » | idem | idem | [V2] |
| ISO : trois avenants d'exclusion « IA générative » (CGL) en vigueur au 1er janv. 2026, à l'initiative de l'assureur au renouvellement | | [Lexology](https://www.lexology.com/library/detail.aspx?g=b76e0dba-d9a8-44f1-9f5d-6fbd0a22f6b6) (403 à la lecture ; résumé de recherche) | [V2][ÀV] |
| Marché bifurqué : des spécialistes vendent des polices IA *affirmatives* | **AIUC** (ex-Anthropic, Rune Kvist) : norme **AIUC-1** (6 domaines : Data & Privacy, Security, Safety, Reliability, Accountability, Society), audit par tiers accrédités (Schellman, Coalfire), 1 000-5 000 scénarios de red team, certificat d'un an à retests trimestriels. Certifiés cités : Cursor, Fin, ElevenLabs, Harvey, UiPath, **KPMG**. **Armilla** (Lloyd's, jusqu'à 25 M$), **Munich Re aiSure** (hallucinations, fondé sur des tests), Testudo (≤10 M$). | **[V]** [aiuc-1.com](https://www.aiuc-1.com) ; [V2] NBC, Beinsure | [V]/[V2] |
| AIUC-1 — preuves demandées | « journaux de chaîne d'exécution, paramètres et résultats d'appels d'outils, enregistrements de délégation, événements d'approbation, tests tiers trimestriels, plans d'incident » (tracker tiers) ; contrôle « B001 Require Exception Escalation » | tracker secondaire + [V] aiuc-1.com | [V2] |

**Pourquoi c'est important pour nous [Inf, forte]** : (1) c'est la preuve économique que « sans contrôle vérifiable, pas de couverture » ; (2) **KPMG (membre du jury) est lui-même certifié AIUC-1** : un « dossier de preuve assurable » parle leur langue ; (3) la sortie de notre produit (journal signé + chaîne de délégation + événements d'approbation) **est exactement la spécification de preuve d'AIUC-1**.

---

## 2. Cartographie des concurrents

> Méthode : ce que chacun fait est tiré de pages vendeur ou de presse (niveau indiqué). La colonne « ne fait pas » est **mon inférence** sur la base de leur documentation publique ; elle peut être périmée vu la vitesse du marché. Les lignes marquées **[ÀV-général]** reposent sur ma connaissance générale et n'ont **pas** été revérifiées cette session.

### 2.1 Consolidation du marché (important pour le pitch : « les filtres de prompt sont une commodité rachetée »)

| Acquéreur | Cible | Date | Prix | Source |
|---|---|---|---|---|
| Palo Alto Networks | Protect AI | ann. 28 avr. 2025, clos 22 juil. 2025 | 634,5 M$ (SEC) | [tracker](https://guptadeepak.com/agent-security/deals/) |
| Snyk | Invariant Labs | 24 juin 2025 | n.c. | idem |
| SentinelOne | Prompt Security | 5 août 2025 | 160,2 M$ (SEC) | idem |
| Cato Networks | Aim Security | 3 sept. 2025 | n.c. | idem |
| Check Point | Lakera | 16 sept. 2025 | 201,8 M$ (SEC) | idem |
| CrowdStrike | Pangea | 16 sept. 2025 | 222,7 M$ (SEC) | idem |
| ServiceNow | Veza | 2 déc. 2025 | 1,20 Md$ (SEC) | idem |
| CrowdStrike | SGNL | 8 janv. 2026 | ~637 M$ (SEC) | idem |
| Proofpoint | Acuvity | 12 fév. 2026 | n.c. | idem |
| Palo Alto Networks | CyberArk (21,1 Md$), Koi (231 M$), Portkey (117 M$) | clos 11 fév. 2026 (CyberArk) | 10-K | [Gupta](https://guptadeepak.com/identity-giants-bought-ai-agent-security/) |
| Cisco | Astrix Security | ann. 4 mai 2026, clos 29 juin | ~400 M$ (Calcalist, « reported ») | idem |
| SailPoint | Entro Security | clos 29 juin 2026 | 122,6 M$ (10-Q) | idem |
| Okta | Permiso Security | ~30 juil. 2026 | n.c. | idem |
| Cyera | Oasis Security | 28 juil. 2026 | ~1 Md$ (communiqué) | tracker |
| F5 | CalypsoAI | janv. 2026 [ÀV : date divergente] | n.c. | [Infosecurity](https://www.infosecurity-magazine.com/news-features/cybersecurity-ma-roundup-feb-26) |
Financements 2026 : Zenity 125 M$ série C (3 août), Straiker 64 M$ série A (29 juin), HiddenLayer 100 M$ série B (2 sept.), WitnessAI 58 M$ (janv.) ; Noma 100 M$ (juil. 2025, valorisation ~400 M$ selon Caplight) [V2] ([Let's Data Science](https://letsdatascience.com/news/zenity-raises-125-million-for-ai-agent-security-9aad0361)).
**Lecture [Inf]** : le champ « sécuriser les agents d'entreprise » est occupé par des acteurs à plusieurs centaines de M$. **Aucun ne cible le paiement avec provenance + chaîne d'autorité** dans leurs descriptions publiques → c'est la niche.

### 2.2 Tableau complet

#### A. Sécurité IA / runtime / guardrails

| Nom | Ce qu'ils font | Ce qu'ils NE font pas (inférence) | Niveau |
|---|---|---|---|
| **Zenity** | Découverte, posture et runtime d'agents (copilotes, low-code, agents maison) ; blocage d'exécution, quarantaine ; contributeur MITRE ATLAS (techniques agents, oct. 2025). Série C 125 M$. | Pas de provenance *par paramètre* ni de jeton de délégation signé ; pas de spécificité paiement. | [V2] |
| **Noma Security** | Posture, identité, runtime, red team d'apps IA/MCP/RAG. | Idem. | [V2] |
| **Lakera (Check Point)** | Filtres d'injection de prompt (Lakera Guard), red team (Gandalf). | Détection probabiliste ; inefficace contre attaques adaptatives (v1 : « The Attacker Moves Second »). Ne connaît pas l'autorité. | [V2] |
| **Prompt Security (SentinelOne)** | Contrôle de l'usage GenAI, protection injection, contrôles d'agents. | Idem. | [V2] |
| **Protect AI (Palo Alto)** | Sécurité de la chaîne de modèles (scan de modèles), Guardian, Layer, Recon. | Orienté modèle/pipeline ML, pas flux de paiement. | [V2] |
| **HiddenLayer** | Détection/réponse sur modèles et agents, red team auto, runtime (100 M$ sept. 2026). | Idem. | [V2] |
| **Aim Security (Cato)** | Sécurité de l'usage de l'IA en entreprise ; a découvert **EchoLeak** (attribution non confirmée ici). | Réseau/SASE, pas paiement. | [ÀV] |
| **Lasso Security** | Plateforme sécurité LLM/agents (proxy, runtime). | Idem. | **[ÀV-général]** |
| **Pillar Security** | Sécurité des applications IA et agents (découverte, red team, garde-fous runtime). | Idem. | **[ÀV-général]** |
| **Straiker** | Découverte d'agents, tests pré-déploiement, surveillance temps réel (64 M$). | Idem. | [V2] |
| **Operant AI** | Protection runtime (Kubernetes, MCP, agents). | Idem. | **[ÀV-général]** |
| **Knostic** | Contrôle d'accès « need-to-know » pour l'inférence LLM (fuite de données). | Confidentialité, pas actions financières. | [V2] |
| **WitnessAI** | Gouvernance de l'usage d'IA et protection (58 M$ janv. 2026). | Usage employé, pas paiement. | [V2] |
| **Acuvity (Proofpoint)** | Gouvernance d'agents, MCP. | Idem. | [V2] |
| **Invariant Labs (Snyk)** | Proxy MCP/LLM, **règles de flux** inspirées de Python sur la trace (« lit un e-mail puis envoie à l'extérieur »). Le plus proche du taint. | Règles écrites à la main, **pas d'autorité signée ni de délégation multi-agents**, pas de cage. | **[V]** [Invariant](https://invariantlabs.ai/blog/guardrails) |
| **Cisco AI Defense** | Validation de modèles, garde-fous runtime, visibilité MCP. | Réseau/plateforme, pas paiement. | **[ÀV-général]** |
| **CrowdStrike (Pangea + SGNL)** | Filtres d'IA (Pangea) + autorisation continue/JIT (SGNL) : le plus proche d'une « autorisation dynamique d'agents ». | Pas de provenance de données ; plateforme endpoint. | [V2] |
| **Palo Alto (Protect AI + CyberArk + Koi + Portkey)** | Pile « découvrir, gouverner, sécuriser les agents » ; Portkey = passerelle LLM. | Idem. | [V2] |
| **Guardrails AI** (open source) | Validateurs de sorties LLM (schémas, PII, toxicité). | Valide du texte, pas des *actions* ni leur origine. | **[ÀV-général]** |
| **NVIDIA NeMo Guardrails** (open source) | Rails conversationnels programmables (Colang). | Idem. | **[ÀV-général]** |
| **Anthropic / OpenAI** (classificateurs, safeguards, politiques d'usage) | Défenses de modèle contre injection, classificateurs constitutionnels ; modes d'approbation d'actions dans les produits d'agent. | Défense du fournisseur, pas contrôle côté entreprise du paiement ; non déterministe. | **[ÀV-général]** |
| **AWS Bedrock Guardrails** | Filtres de contenu, PII, « automated reasoning checks ». Intégré à AgentCore Policy (juin 2026). | Texte et intention déclarée ; ne suit pas la provenance des paramètres. | [V2] |
| **AWS Bedrock AgentCore Policy** (GA mars 2026) | Autorisation **Cedar** des appels d'outils au Gateway : default-deny, forbid prioritaire, mode « log-only », claims JWT de l'utilisateur, résultats dans CloudWatch. | Décide sur **claims de l'utilisateur + requête d'outil**, pas sur *d'où vient la valeur du paramètre* ; pas de chaîne multi-agents ; **c'est notre point d'ancrage naturel** (on est sur Bedrock). | **[V2]** ([AWS blog](https://aws.amazon.com/blogs/aws/amazon-bedrock-agentcore-adds-quality-evaluations-and-policy-controls-for-deploying-trusted-ai-agents/)) |
| **AWS AgentCore Identity** | Identité de workload d'agent, coffre de jetons OAuth, délégation. | Lien avec Policy non précisé dans mes sources. | [ÀV] |

#### B. Identité et autorisation d'agents

| Nom | Ce qu'ils font | Ce qu'ils NE font pas | Niveau |
|---|---|---|---|
| **Okta for AI Agents** (GA prévue 30 avr. 2026) + Cross App Access (ID-JAG) ; **Agent Gateway** « gouvernance runtime » annoncé à Oktane (sept. 2026) | Découvrir/enregistrer des agents, standardiser l'accès, révoquer. La note support citée en v1 : kill switch **manuel**, jetons existants valides jusqu'à expiration. | **[ÀV]** : le document Oktane 2026 ne m'a pas permis de confirmer une révocation automatique sur signal. **Reformuler la slide : « à notre connaissance, au 10 oct. 2026 »**. Pas de provenance de données. | [V2] ([Okta blueprint](https://www.joplinglobe.com/region/national_business/okta-announces-new-blueprint-for-the-secure-agentic-enterprise/article_128fcd37-81de-5a91-b064-cfe94815d9ce.html)) |
| **Auth0 for AI Agents** (GA nov. 2025) | Auth utilisateur, **Token Vault**, **autorisation asynchrone (CIBA)** pour approbation humaine, FGA pour RAG. | Approuve l'*opération*, pas la *cause* ; pas de diff déterministe de provenance. | [V2] ([Auth0](https://auth0.com/blog/auth0-for-ai-agents-generally-available/)) |
| **Microsoft Entra Agent ID / Agent 365** (GA 1er mai 2026) | Identité d'agent, cycle de vie/sponsor, **Conditional Access et ID Protection pour agents** (déploiement juil.-août 2026). 15 $/utilisateur/mois. | Contrôle d'accès et risque d'identité ; pas l'origine des paramètres de paiement. | [V2] ([MC1395007](https://mc.merill.net/message/MC1395007)) |
| **Astrix (Cisco)** | Inventaire et sécurité des identités non humaines/agents, secrets. | Idem. | [V2] |
| **Oasis Security (Cyera)** | Identités non humaines et agents. | Idem. | [V2] |
| **Token Security** | Identité d'agents / NHI. | Idem. | [V2, maigre] |
| **Obsidian Security** | Sécurité SaaS, désormais agents SaaS (copilotes, connecteurs). | Périmètre SaaS. | **[ÀV-général]** |
| **SailPoint (Entro), CyberArk (Palo Alto), SGNL (CrowdStrike), Veza (ServiceNow)** | Gouvernance d'identité, PAM, autorisation continue, graphe d'accès. | Droit d'accès ≠ cause de l'action. | [V2] |

#### C. Rails de paiement agentiques

| Nom | Ce qu'ils font | Ce qu'ils NE font pas | Niveau |
|---|---|---|---|
| **Google AP2 → FIDO Alliance** (v0.2, avr. 2026) | **Mandats** signés (Intent / Cart / Payment), vérifiables ; v0.2 : paiement « humain absent ». | Prouve ce qui a été signé, **pas que l'agent est resté dans l'intention** ; responsabilité non tranchée. | [V2 via v1] |
| **Visa Trusted Agent Protocol / Intelligent Commerce** | Signatures cryptographiques pour authentifier l'agent légitime ; jetons à limites. | « L'agent est réel » ≠ « l'ordre est légitime » ; pas de règle de rétrofacturation propre aux agents (août 2026). | [V2] ([Digital Applied](https://www.digitalapplied.com/blog/agent-checkout-authentication-card-networks-2026)) |
| **Mastercard Agent Pay** | Agentic Tokens, « Know Your Agent », plafonds/catégories/fenêtres ; contribution FIDO « Verifiable Intent ». | Un agent piégé reste dans le mandat. Responsabilité en cas de litige : non tranchée (Worldpay). | [V2] ([Worldpay](https://worldpay.com/insights/articles/agentic-commerce-liability-is-still-being-written)) |
| **Stripe** (Agent Toolkit, ACP avec OpenAI, Issuing, Shared Payment Token, Privy) | Clés restreintes, cartes virtuelles à usage unique, approbation programmatique de chaque autorisation Issuing. | La validation programmatique est un **crochet**, pas une décision de légitimité. | [V2 via v1] |
| **Coinbase** (x402, AgentKit, Agentic Wallets, Payments MCP) | Wallet MPC/TEE, plafonds session/transaction, KYT, x402 natif. | Plafond ≠ légitimité du bénéficiaire ; facilitateurs x402 tous fautifs sur ≥1 règle (arXiv). | [V2] |
| **Skyfire (KYAPay)** | Identité+paiement en JWT (draft IETF mars 2026). | Identité de l'agent. | [V2 via v1] |
| **Nevermined** | Facturation/paiements d'agents, comparatifs. | Idem (et partie prenante concurrente dans les sources). | [ÀV-général] |
| **Catena Labs (ACK)** | DID/VC pour agents, destinataires approuvés ; 30 M$ série A (a16z). | Idem. | [V2 via v1] |
| **Payman / Natural** | Paiements d'agents avec approbation humaine. | — | **[ÀV, non trouvés]** |

#### D. Custody / wallets / contrôle de signature

| Nom | Ce qu'ils font | Ce qu'ils NE font pas | Niveau |
|---|---|---|---|
| **Fireblocks** (Policy Engine, Agentic Payments Gateway, Agent Wallets) | Règles appliquées côté Fireblocks : plafond par tx, vélocité par période, listes blanches de destinations, approbation mobile au-delà d'un seuil, double contrôle sur les changements de politique, un coffre par agent ; l'agent ne détient pas la clé. Dit lui-même : « un coffre financé paie ce qu'un marchand annonce sauf règle contraire ; on-chain irréversible ». | Aucune notion de **provenance** ; l'approbation mobile affiche l'ordre, pas la cause. | **[V]** ([docs](https://developers.fireblocks.com/docs/x402-agent-spending-controls)) |
| **Safe{Wallet}** modules / **Zodiac Roles** | Multisig, modules de limite de dépense et de listes blanches ; Roles = permissions fines par fonction/paramètre (Gnosis Guild). | Le front-end a été le vecteur de Bybit ; pas de vérification d'intention indépendante. | Safe modules [V2] ; Zodiac **[ÀV-général]** |
| **Turnkey** | Signature en enclaves (Nitro), moteur de politiques (limites, whitelists, quorums). | Pas d'origine des paramètres. | [V2, source tierce] |
| **Privy (Stripe)** | Wallets embarqués ; politiques côté app. | Idem. | [V2] |
| **Crossmint** | Wallets + cartes Visa pour agents + autorisation MiCA (janv. 2026). | Idem. | [V2] |
| **Cubist (CubeSigner)** | Signature matérielle avec politiques et rôles. | Idem. | **[ÀV-général]** |
| **Lit Protocol** | Clés programmables (PKP) avec conditions d'actions. | Idem. | **[ÀV-général]** |
| **MetaMask Delegation (ERC-7710/7715)** | Délégations on-chain avec *caveat enforcers* ; sous-délégation qui ne fait que se restreindre ; ERC-7715 = permissions demandées au wallet (toujours *draft*). | Aucune provenance ; ouverture pour notre gate comme enforcer. | [V2] ([MetaMask](https://docs.metamask.io/smart-accounts-kit/concepts/advanced-permissions/)) |
| **ERC-8004 « Trustless Agents »** | Registres on-chain Identité / Réputation / Validation (draft, déployé sur des mainnets début 2026). | Définit où publier des claims de validation, pas ce qu'est un paiement légitime. | [V2] ([EIP-8004](https://eips.ethereum.org/EIPS/eip-8004)) |

#### E. Observabilité et évaluation

| Nom | Ce qu'ils font | Ce qu'ils NE font pas | Niveau |
|---|---|---|---|
| **Langfuse** (open source) | Traces d'agents, coûts, évaluations. | Journal *observationnel* modifiable, pas de preuve d'autorité ni de blocage. | **[ÀV-général]** |
| **Arize / Phoenix** | Observabilité et évaluation d'agents. | Idem. | **[ÀV-général]** |
| **Galileo** | Évaluation/garde-fous en production (Luna). | Idem. | **[ÀV-général]** |

#### F. Standards, recherche, open source

| Nom | Ce qu'ils font | Ce qu'ils NE font pas | Niveau |
|---|---|---|---|
| **OWASP Top 10 for Agentic Applications** (ASI01-ASI10) | Taxonomie ; ASI01 Agent Goal Hijack, ASI02 Tool Misuse & Exploitation, ASI03 Identity & Privilege Abuse, ASI04 Agentic Supply Chain, ASI05 Unexpected Code Execution, ASI06 Memory & Context Poisoning, ASI07 Insecure Inter-Agent Communication, ASI08 Cascading Failures, ASI09 Human-Agent Trust Exploitation, ASI10 Rogue Agents | Pas un outil. **Libellés exacts : [ÀV]** (page officielle sans le détail ; recoupé via sources secondaires). | [V2] ([Auth0](https://auth0.com/blog/owasp-top-10-agentic-applications-lessons/), [Descope](https://www.descope.com/blog/post/owasp-agentic-top-10-identity)) |
| **OWASP AIVSS** (Agentic AI Vulnerability Scoring System) | Notation de gravité des vulnérabilités agentiques. | Notation, pas détection. | **[ÀV-général]** |
| **agentgateway** (Solo.io → Linux Foundation / AAIF) | Passerelle open source MCP/A2A : authn/authz, rate limit, audit par appel d'outil. Fine-grained MCP authz « à explorer » (avr. 2026). | Politique par outil ; pas de provenance ni de délégation signée. **Candidat de brique d'intégration.** | [V2] ([Next Platform](https://www.nextplatform.com/2025/09/02/linux-foundation-brings-solo-ios-gateway-into-the-agentic-ai-fold/)) |
| **Progent** (arXiv 2504.11703) | DSL de privilèges sur appels d'outils (ASR 41 %→2 %). | Politique générée par LLM = surface d'attaque. | [V via v1] |
| **CaMeL (Google/ETH), FIDES (Microsoft), ROPE** | **Provenance/capabilities par valeur** dans un agent ; CaMeL : 77 % de tâches résolues avec sécurité prouvée contre 84 % sans défense ; FIDES : surcoût médian de jetons ×2,43 ; ROPE : ASR 1,6-2,6 %. | Mono-agent ; pas de jeton de délégation ni de chaîne multi-agents ; **aucune preuve de déploiement en production trouvée**. | [V2] ([arXiv 2505.23643](https://arxiv.org/pdf/2505.23643)) ; ROPE [V via v1] |
| **MCP guardians open source** (divers : MCP-Guardian, Invariant mcp-scan, etc.) | Scan de descriptions d'outils, détection de « rug pull » / poisoning. | Pas de logique de paiement. | **[ÀV-général]** |
| **FinVault** (arXiv 2601.07853) | Benchmark de sécurité financière à état (31 scénarios, 963 cas dont bénins). | Jeu de test, pas un produit. | [V via v1] |

**Matrice de couverture [Inf]** : ✓ = fait publiquement, ~ = partiel, ✗ = non trouvé

| Capacité | Plateformes IA-sec | Identité d'agents | Rails de paiement | Custody/wallets | Nous (cible) |
|---|---|---|---|---|---|
| Inventaire/identité de l'agent | ~ | ✓ | ✓ | ~ | ~ (on s'appuie dessus) |
| Plafond/vélocité/liste blanche | ~ | ✗ | ✓ | ✓ | ✓ (commodité) |
| Jeton court / révocation | ~ | ✓ (manuel/auto ÀV) | ✓ | ✓ | ✓ |
| Chaîne de délégation vérifiable | ✗ | ~ (drafts IETF) | ~ (mandats AP2) | ✗ | **✓ signée, vérifiable hors ligne** |
| **Provenance des valeurs de paramètre dans le jeton** | ✗ (Invariant ~) | ✗ | ✗ | ✗ | **✓** |
| Décision déterministe (pas de juge LLM) | ~ | ✓ | ✓ | ✓ | ✓ |
| Validation humaine avec diff de cause | ✗ | ~ (CIBA) | ✗ | ~ (mobile) | **✓** |
| Leurres financiers / cage / renseignement mules | ✗ | ✗ | ✗ | ✗ | **✓** |
| Attribution causale (rejeu) | ✗ | ✗ | ✗ | ✗ | **✓** |
| Dossier de preuve assurabilité / DORA / AI Act | ~ | ✗ | ✗ | ✗ | **✓** |

---

## 3. Toutes les sous-possibilités (18)

> Scénario de démonstration commun (hérité de la v1) : **Néobanque Héron**, agent Boîte de réception (faible privilège) → agent AP → agent Trésorerie ; humain racine **Claire (DAF)** ; analyste **Mehdi**. Données **100 % synthétiques** (60 fournisseurs, IBAN valides de banques fictives, 300 factures PDF/e-mails générées par Claude, 12 mois d'historique). Barème : détection /30, réponse /20, faisabilité /20, conformité /15, pitch /15.
> **Comment simuler l'agent piégé** (commun) : agent Bedrock (Claude) avec outils `read_email`, `read_pdf`, `propose_payment`, `execute_payment` ; injection indirecte dans le PDF (texte blanc, homoglyphes, base64, morse), avec un témoin « faible modèle » (p. ex. Llama via Bedrock) pour obtenir un taux d'obéissance non nul à coup sûr (Zscaler montre que des modèles obéissent). L'**ASR sans défense doit être mesuré avant** de revendiquer un gain : si le modèle résiste seul, on le dit et on utilise l'attaque adaptative.

### S1 — Provenance dans le jeton d'autorisation (SILLAGE)
- **Problème** : le jeton passé à l'agent Trésorerie est propre alors que l'IBAN vient d'un PDF hostile lu deux sauts plus tôt (Grok→Bankr).
- **Mécanisme** : passerelle d'outils qui journalise chaque lecture, étiquette chaque valeur critique par correspondance déterministe, ajoute des blocs *append-only* au jeton (Biscuit/JWS chaîné) ; politique `deny if payee value only from untrusted origin`. Détail en v1 §3.
- **Existe** : CaMeL/FIDES/ROPE (mono-agent, recherche), Invariant (règles de flux à la main), Transaction Tokens (principal figé).
- **Neuf** : la provenance **voyage avec la délégation** et est vérifiée par le détenteur de l'argent.
- **Données/mesure** : famille « substitution d'IBAN » et « relais inter-agents » de Héron-200 ; ASR avant/après, utilité conservée, FP/80, latence <20 ms.
- **Mapping** : NIST **PR.AA, DE.AE, DE.CM, RS.MI** · ASI01, **ASI03, ASI07** · ATLAS AML.T0051.001, AML.T0080, mitigation AML.M0030 · ATT&CK T1565.002, T1657 · D3FEND D3-UAP (principe), D3-OAM [ÀV].
- **Difficulté** : 3,5/5. **Note** : 84-86.

### S2 — Chaîne d'autorité signée humain→agent→agent, vérifiable hors ligne
- **Problème** : « demandé par Alice » est déclaratif ; l'auditeur ne peut pas le vérifier.
- **Mécanisme** : Claire signe un mandat (RAR RFC 9396 : `type, max_total, period, payees`) avec une clé passkey/Ed25519 ; chaque délégation = bloc qui **ne peut que restreindre** (Biscuit, UCAN, ou JWS chaîné ; draft AIP : 340-380 octets/bloc, <1 ms à profondeur 5, auto-déclaré). Identité de chaque agent par SPIFFE/SVID [ÀV]. Le journal référence la chaîne entière ; un script `verify_chain` rejoue la vérification hors ligne.
- **Existe** : drafts IETF (Transaction Tokens for Agents, AIP, AAT), AP2 mandats, MetaMask 7710.
- **Neuf** : le **vérificateur indépendant** (CLI pour l'auditeur) et le rattachement au registre de provenance (S1).
- **Mesure** : 100 % des paiements ont une chaîne valide jusqu'à un humain ; 0 chaîne forgée acceptée sur 50 tentatives (jeton falsifié, bloc retiré, extension de budget).
- **Mapping** : NIST **PR.AA, GV.RR, ID.AM** · ASI03, ASI07, ASI10 · ATT&CK T1078, T1550.001 · D3FEND D3-UAP, D3-ANCI.
- **Difficulté** : 3/5 (repli JWS). **Note** : 80.

### S3 — Jetons courts liés à la tâche et révocation en vol (CAEP / liste de révocation)
- **Problème** : un jeton de 5 minutes vide un wallet en secondes (Bankr 14 wallets) ; les jetons déjà émis restent valides.
- **Mécanisme** : jeton lié à `{tâche, origine, bénéficiaires}` ; durée = durée d'une tâche, pas d'une session ; la passerelle consulte une liste de révocation à **chaque** appel ; un événement Shared Signals/CAEP propage « agent compromis » ; révocation en arbre (tous les descendants).
- **Existe** : Okta (révocation, auto ÀV), Fireblocks (coffre par agent), Coinbase (session caps), SGNL (autorisation continue).
- **Neuf** : révocation **déclenchée par la détection de provenance/leurre** et mesurée (délai en ms jusqu'au refus effectif).
- **Mesure** : temps entre détection et premier refus (cible <100 ms), nombre d'appels passés entre-temps (cible 0).
- **Mapping** : NIST **PR.AA, RS.MI** · ASI03, ASI10 · ATT&CK T1528 · D3FEND D3-ANCI, D3-AL.
- **Difficulté** : 2/5. **Note** : 72 seul, indispensable en brique.

### S4 — Kill switch gradué (5 niveaux) à seuil de risque cumulé avec hystérésis
- **Problème** : un seuil binaire est jamais atteint ou trop souvent ; le salami (N×19,99 €) passe sous les seuils unitaires.
- **Mécanisme** : score d'**exposition cumulée** par mandat/agent/bénéficiaire (pas par transaction) → niveaux : 0 normal, 1 hold d'un paiement, 2 blocage + atténuation du jeton, 3 cage (S5), 4 révocation d'arbre ; hystérésis et levée automatique des niveaux 1-2 (LULD de la v1, F8 #11). Reproduit le principe boursier des circuit breakers.
- **Existe** : seuils de vélocité (Fireblocks, Coinbase), billets d'éditeurs sur le salami sans implémentation ouverte.
- **Neuf** : gradation + exposition cumulée de mandat + **tableau de bord de décisions expliquées**.
- **Mesure** : paiements passés avant la pause sur 40 micro-paiements (cible ≤12), nombre de pauses/mois sur 12 mois légitimes synthétiques (cible <1), FP.
- **Mapping** : NIST **DE.CM, DE.AE, RS.MI** · ASI08, ASI10 · ATT&CK T1657 · D3FEND D3-AL, D3-UBA.
- **Difficulté** : 2/5. **Note** : 70 seul / 77 avec enforcer on-chain (S12).

### S5 — Grand livre fantôme / cage transactionnelle (NASSE, volet réponse)
- **Problème** : couper l'agent perd le renseignement, alerte l'attaquant, arrête le travail légitime.
- **Mécanisme** : sur déclencheur, la session est basculée vers un PSP simulé : réponses « OK, virement n° … », rien ne part ; instantané de contamination ; destinations collectées ; budget 15 min / 20 appels ; fiche « mules suspectées » pour Mehdi.
- **Existe** : leurres pour agents (Thinkst canary MCP, 2026, selon v1) ; **aucun** pour paiement avec renseignement LCB-FT.
- **Neuf** : réponse proportionnée **sans arrêt de service** + sortie LCB-FT.
- **Mesure** : 0 € sorti, services légitimes continués (40/40), destinations collectées par incident.
- **Mapping** : NIST **RS.AN, RS.MI, RS.CO** · ASI01, ASI10 · ATT&CK T1657, T1036 · D3FEND **D3-DE** (Decoy Environment), D3-DO.
- **Difficulté** : 2,5/5. **Note** : 83.

### S6 — Bénéficiaires-canaris et honeytokens (leurres de capacité et de données)
- **Problème** : un agent détourné cherche à élargir ses droits (le NFT de Bankr aurait élargi les capacités).
- **Mécanisme** : (a) outil `approve_urgent_treasury_transfer` jamais appelé en légitime ; (b) IBAN valides de banques fictives plantés dans pièces fouillées seulement hors tâche, un IBAN distinct par silo (traçage de la fuite) ; (c) fausses procédures « changement d'IBAN direct » ; rotation par déploiement.
- **Existe** : canarytokens (Thinkst), leurres MCP ; D3FEND Decoy Object/Credential.
- **Neuf** : leurres **financiers** (bénéficiaire, droit de payer) ; précision ~100 % par construction.
- **Mesure** : 0 déclenchement sur 80 sessions légitimes ; rappel 40-70 % selon famille d'attaque [Inf, à mesurer]. **L'attaquant discipliné qui va droit au but ne mord pas** → à coupler avec S1.
- **Mapping** : NIST **DE.AE, DE.CM** · ASI03, ASI01 · ATLAS AML.T0051 · D3FEND **D3-DO, D3-DUC** [ÀV pour D3-DUC] · ATT&CK T1078.
- **Difficulté** : 1,5/5. **Note** : 74 seul.

### S7 — Rejeu contrefactuel et attribution causale (CONTRE-ÉPREUVE)
- **Problème** : les logs montrent la séquence, jamais la cause ; un juge LLM peut inventer une explication.
- **Mécanisme** : pour une action sensible, 3 rejeux (requête humaine masquée, ablation par source, témoin propre) à T=0, comparaison **déterministe** des appels d'outils normalisés → certificat causal ajouté au journal.
- **Existe** : MELON (détecte), pas d'attribution produit.
- **Neuf** : désigner la **source** causale et en faire une pièce d'audit.
- **Mesure** : exactitude d'attribution sur 120 attaques à vérité terrain, coût Bedrock/action, latence <4 s, robustesse aux injections dépendantes de la requête (limite de MELON).
- **Mapping** : NIST **DE.AE, RS.AN** · ASI01, ASI06 · ATLAS AML.T0051.001, AML.T0080 · D3FEND D3-OAM [ÀV].
- **Difficulté** : 3/5 (variance LLM). **Note** : 80.

### S8 — Double validation humaine mobile avec explication déterministe (anti-ASI09, anti-fatigue)
- **Problème** : le résumé rédigé par l'agent trompe l'humain ; les approbations en rafale deviennent des clics réflexes (FSB, juin 2026 : le décision-par-décision ne passe pas à l'échelle).
- **Mécanisme** : demande CIBA vers la **racine de la chaîne** (Claire), avec un diff produit **sans LLM** (« IBAN du registre v17 FR76… → IBAN demandé LT12… ; source : facture_4471.pdf, e-mail externe, lue par l'agent Boîte de réception ») ; décision signée passkey ; **budget d'approbation** (≤ N demandes/jour/personne ; au-delà, regroupement ou refus par défaut) ; test de vigilance (faux cas de contrôle périodiques) pour mesurer le taux de clic réflexe.
- **Existe** : Auth0 CIBA, Fireblocks approbation mobile, Stripe approbation programmatique.
- **Neuf** : diff **de cause** déterministe + **mesure de la qualité de la supervision humaine** (leçon : un « oui » en 1,2 s n'est pas une supervision).
- **Mesure** : approbations pour 100 paiements, délai médian de décision, taux d'acceptation de leurres de contrôle.
- **Mapping** : NIST **PR.AT, RS.MA, GV.RR** · **ASI09** · ATT&CK T1204 (exécution par l'utilisateur) · D3FEND D3-MFA, D3-OTP [ÀV].
- **Difficulté** : 2/5. **Note** : 74.

### S9 — Vérification d'intention indépendante de l'interface (leçon Bybit/Bitget)
- **Problème** : si l'UI ou le backend ment, les signataires approuvent (Bybit 1,5 Md$ ; Bitget 387,5 M$ sans clé volée).
- **Mécanisme** : un **second regard** décode l'ordre brut (calldata, EIP-712, ou message pain.001 côté fiat), le simule (fork Anvil sur Fuji), compare à l'**intention signée** du mandat (S2) ; si l'agent ou une couche intermédiaire (routeur LLM, 9/428 malveillants) a réécrit l'appel, l'écart se voit.
- **Existe** : Blockaid/Hypernative (simulation), SignGuard de `02_track1_finance.md` (idée n° 1, 19/20).
- **Neuf** : comparer à une **intention signée par un humain** et non à des heuristiques.
- **Mesure** : détection de 20 variantes (delegatecall, approve illimité, IBAN modifié après LLM) ; FP.
- **Mapping** : NIST **DE.AE, PR.DS, RS.AN** · ASI02, ASI04 · ATLAS AML.T0053 · ATT&CK T1565.002, T1195 [ÀV] · D3FEND D3-MFA (autre canal), D3-OAM [ÀV].
- **Difficulté** : 3/5. **Note** : 77.

### S10 — Détection de dérive de comportement et baseline de périmètre
- **Problème** : Lobstar Wilde (montant ≫ habitude, sans adversaire) ; Grok→Bankr (action jamais vue).
- **Mécanisme** : profil **statistique, sans LLM**, par agent : bénéficiaires, montants (quantiles), horaires, séquences d'outils, fréquence ; scores de nouveauté combinés (isolation forest ou règles quantiles) ; démarrage à froid via mandat (le périmètre est *déclaré* par Claire) avant apprentissage.
- **Existe** : User Behavior Analytics pour humains (Featurespace, BioCatch), détection comportementale d'agents (Zenity, ÀV).
- **Neuf** : baseline **ancrée dans le mandat signé** (lutte contre l'empoisonnement lent de la baseline) ; **rapport entre périmètre déclaré et observé**.
- **Mesure** : AUC/PR sur 12 mois synthétiques + injections de dérive ; FP/mois ; temps de détection.
- **Mapping** : NIST **DE.CM, DE.AE, ID.RA** · ASI01, ASI10 · ATLAS AML.T0080 · D3FEND **D3-UBA**.
- **Difficulté** : 2/5. **Note** : 66.

### S11 — Détection d'injection dans factures/PDF/e-mails par diff « rendu vs extraction »
- **Problème** : texte blanc sur blanc, polices à 0 pt, calques cachés : l'humain voit une facture propre, l'agent lit une consigne.
- **Mécanisme** : comparer le texte **visible** (rendu raster + OCR) et le texte **extrait** (parseur PDF, HTML) ; tout contenu présent dans l'un et pas l'autre est signalé ; détection d'homoglyphes/Unicode invisible/base64/morse ; **sanitisation** (l'agent ne reçoit que le texte visible). Filtre amont, pas une défense suffisante.
- **Existe** : Lakera, Prompt Security (classifieurs probabilistes) ; Forcepoint/Positive Security (recherche).
- **Neuf** : approche **déterministe de divergence** (non contournable par reformulation) ; sert de capteur supplémentaire pour S1.
- **Mesure** : rappel sur 6 familles d'obfuscation, FP sur 300 factures propres.
- **Mapping** : NIST **DE.CM, PR.DS** · ASI01, ASI06 · ATLAS AML.T0051.001 · ATT&CK T1566.001, T1027 (obfuscation) · D3FEND D3-FA (File Analysis) [ÀV].
- **Difficulté** : 2/5. **Note** : 64 (commodité partielle ; bon capteur).

### S12 — Budget/vélocité en enforcer on-chain (Safe module, ERC-7715, session keys) lié à une attestation
- **Problème** : les plafonds côté backend tombent avec le backend (Bitget).
- **Mécanisme** : contrat `HeronVault` (Fuji) : `transfer()` exige une **attestation signée** par la passerelle (hash de l'action + verdict + validité courte) **et** respecte un plafond cumulé par fenêtre ; `revokeGate()` coupe tout ; implémentable comme *caveat enforcer* ERC-7710 ou module Safe.
- **Existe** : MetaMask caveats, Safe modules, Zodiac Roles ; ForgeOS, Exequatur en hackathon.
- **Neuf** : l'enforcer vérifie une **attestation de provenance**, pas seulement montant/cible.
- **Mesure** : 0 transfert sans attestation valide (fuzz Foundry), gas, délai de révocation.
- **Mapping** : NIST **PR.AA, PR.PS, RS.MI** · ASI02, ASI03 · ATT&CK T1657 · D3FEND D3-UAP.
- **Difficulté** : 3/5 (3-4 h Foundry). **Note** : 68 seul.

### S13 — Journal chaîné par hash, ancré (Merkle root sur Fuji), exportable en « dossier de preuve »
- **Problème** : un journal modifiable n'est pas une preuve ; l'AI Act art. 12, DORA, les assureurs (AIUC-1) demandent une trace fiable.
- **Mécanisme** : chaque action = ligne signée `H(prev ‖ action ‖ chaîne d'autorité ‖ provenance ‖ verdict)` ; racine Merkle ancrée périodiquement (Fuji) ; CLI `verify` pour l'auditeur ; export au format des **preuves AIUC-1** (journaux de chaîne d'exécution, paramètres d'appels d'outils, enregistrements de délégation, événements d'approbation) et brouillon de déclaration DORA.
- **Existe** : journaux d'observabilité (Langfuse…), immutabilité WORM (S3 Object Lock).
- **Neuf** : lien **autorité + provenance + verdict** dans une seule ligne vérifiable et un export aligné assureur.
- **Mesure** : détection de 100 % de 30 altérations (suppression, réordonnancement, modification) ; temps de vérification.
- **Mapping** : NIST **DE.CM, GV.OC, RS.AN, PR.DS** · ASI10, ASI03 · ATT&CK T1070 (Indicator Removal), T1562 · D3FEND D3-FH (File Hashing) [ÀV].
- **Difficulté** : 1,5/5. **Note** : 70 seul (conformité 15/15 ; détection faible).

### S14 — Rapprochement en partie double et détection d'omissions (RAPPROCHEMENT)
- **Problème** : un moniteur standard n'attrape aucune attaque *par omission* (0/15 dans la littérature) ; le salami glisse sous les seuils.
- **Mécanisme** : le mandat déclare l'état final attendu (Σ ≤ 48 000 €, chaque paiement a son contrôle sanctions, tout doublon signalé) ; grand livre d'ombre en partie double ; clôture de mission impossible tant qu'un écart n'est pas expliqué.
- **Existe** : réconciliation bancaire humaine ; invariants (hackathon « Omission attacks »).
- **Neuf** : appliqué à des **missions d'agents** financiers.
- **Mapping** : NIST **DE.CM, DE.AE, GV.OV** · ASI01, ASI08 · ATT&CK T1565 · D3FEND D3-OAM [ÀV].
- **Difficulté** : 2/5. **Note** : 75.

### S15 — Pare-feu de canal inter-agents : « aucun message ne monte en privilège »
- **Problème** : ASI07 ; « les outils de transfert entre agents sont les plus risqués » (Mind the Gap, arXiv 2509.04802).
- **Mécanisme** : tout message A→B porte la chaîne d'autorité de A ; B refuse (règle structurelle) toute action dont le privilège requis dépasse **min(privilège de B, privilège de A)** ; un agent Boîte de réception (lecture seule) ne peut jamais « ordonner » un paiement, il ne peut que **proposer** ; la proposition passe par S1/S8.
- **Existe** : A2A/MCP ne spécifient pas cela ; drafts IETF (WIMSE delegation chain).
- **Neuf** : application **mécanique** du principe du moindre privilège aux messages.
- **Mesure** : 0 escalade acceptée sur 40 scénarios ASI07 ; message forgé/rejoué rejeté.
- **Mapping** : NIST **PR.AA, PR.IR** · **ASI07, ASI03** · ATLAS AML.T0053 · ATT&CK T1199 · D3FEND D3-UAP, D3-NTF [ÀV].
- **Difficulté** : 2/5. **Note** : 73 (sous-ensemble de S1/S2).

### S16 — Moniteur « aveugle » : juge qui ne lit que des actions structurées, jamais le contenu
- **Problème** : un LLM-moniteur qui lit le contexte empoisonné est attaquable (Terekhov et al., ICLR 2026, arXiv 2510.09462).
- **Mécanisme** : le superviseur reçoit **uniquement** des enregistrements typés (outil, paramètres normalisés, provenance, chaîne d'autorité, historique de périmètre) — jamais de texte libre issu d'e-mails/PDF ; pas de surface d'injection ; éventuellement un petit modèle utilisé pour la *rédaction* de l'explication **après** la décision.
- **Existe** : "trusted monitors" (recherche), guardian agents (Gartner, ~10-15 % du marché en 2030).
- **Neuf** : preuve **expérimentale** : même red team adaptative, juge LLM-lisant-le-contexte vs moniteur aveugle.
- **Mesure** : ASR de l'attaque adaptative sur les deux architectures (10 itérations).
- **Mapping** : NIST **DE.AE, GV.PO** · ASI01, ASI09 · ATLAS AML.T0051 · D3FEND D3-UBA (analogue).
- **Difficulté** : 1,5/5 (c'est un choix d'architecture). **Note** : 76 comme argument/duel.

### S17 — Simulateur d'attaquant agentique et jeu de test public « Héron-200 »
- **Problème** : les benchmarks sont saturés ou faussés (arXiv 2510.05244) ; un 0 % sur AgentDojo ne prouve rien.
- **Mécanisme** : générateur d'attaques (6 familles × 20 + 80 légitimes), rejouable, publié ; red team Claude boîte blanche ; 5-10 scénarios FinVault comme référence externe (licence ÀV).
- **Neuf** : chiffres **honnêtes** (taux d'échec publié) ; c'est un livrable de crédibilité.
- **Mapping** : NIST **ID.RA, ID.IM, DE.AE** · ASI01-ASI10 (couverture) · ATLAS AML.T0051 · ATT&CK T1566, T1657.
- **Difficulté** : 2/5. **Note** : (support, requis pour toutes).

### S18 — Responsabilité machine-lisible : RACI signé + « score d'assurabilité »
- **Problème** : « si le modèle se trompe, qui est responsable ? » reste une opinion.
- **Mécanisme** : chaque incident génère un **rapport de responsabilité** : qui a signé le mandat (bornes), qui exploite la passerelle, quel fournisseur LLM (tiers TIC, DORA art. 28), quelle règle a décidé, quelle part est hors périmètre ; plus une **grille d'assurabilité** (couverture des preuves AIUC-1 : journaux, délégation, approbations, tests trimestriels).
- **Neuf** : rendre la répartition de responsabilité **calculable et auditable**.
- **Mapping** : NIST **GV.RR, GV.OV, GV.SC** · ASI09, ASI10 · ATT&CK — · D3FEND —.
- **Difficulté** : 1,5/5. **Note** : 72 (conformité 15/15, détection 0).

---

## 4. Angles d'innovation qui plairont au jury

### 4.1 Ce que fera « l'équipe moyenne » (le guide écrit le scénario)

| Brique « moyenne » | Pourquoi elle sera très répétée | Pourquoi elle ne marque pas |
|---|---|---|
| Journal des actions + dashboard | Livrable évident | Journal déclaratif/modifiable ; observabilité (Langfuse) existe |
| Score de risque LLM | « Le modèle juge » | **Le juge est la cible** (ICLR 2026) ; non déterministe ; indéfendable devant un auditeur |
| Plafond + liste blanche | Facile | Commodité (Coinbase, Fireblocks, Stripe) ; l'attaque reste dans les bornes (Grok×Bankr) |
| Kill switch rouge | Visuel | Binaire ; Okta, Fireblocks, Coinbase en ont ; ne répond pas à « et le salami ? » |
| Validation Slack/email | Facile | ASI09 : résumé rédigé par l'agent ; fatigue d'approbation |
| JWT court | Simple | Court ≠ lié à la tâche |
| « Chaîne d'autorité » en champ `requested_by` | Demandé par le guide | **Auto-déclarée par l'agent**, donc forgeable |
| Arbre de délégation + kill switch on-chain | Facile à raconter | Déjà fait (ForgeOS, Exequatur) |
| Démo : « l'agent essaie 50 000 €, c'est bloqué » | Seule démo possible avec un plafond | Pas de scénario réaliste (la fraude reste sous le plafond) |

**Ce qui nous distingue [Inf]** : (1) la décision est **déterministe et fondée sur l'origine** des valeurs, pas sur un score ; (2) la chaîne d'autorité est **cryptographiquement vérifiable hors ligne** ; (3) la réponse **ne coupe pas** (cage) et produit du renseignement ; (4) des **chiffres honnêtes avec attaque adaptative** et une liste de ce qui passe encore ; (5) un **dossier de preuve** aligné assureur/DORA.

### 4.2 Classement des angles (≥ 8)

| Rang | Angle | Pourquoi ça marque | Risque | Moment wow en démo |
|---|---|---|---|---|
| 1 | **« D'où vient cet IBAN ? »** — graphe de provenance dans le jeton (S1+S2+S15) | Répond *littéralement* à la phrase du guide (ASI03/ASI07, « chaîne d'autorité ») avec une preuve que la reformulation ne contourne pas ; l'auditeur peut re-vérifier | Abstrait sans bon visuel ; Biscuit pré-1.0 en Python | Le graphe s'illumine : IBAN rouge ← facture_4471.pdf, vert ← Claire ; 11 autres paiements passent. Le jury tente sa propre injection en direct. |
| 2 | **Cage + canaris → renseignement anti-mules** (S5+S6) | Réponse « proportionnée, actionnable, utile à l'analyste » (20 %) ; ouvre le pont AML/CFT (KPMG) | Jugé gadget seul ; rappel partiel | Bordure orange : l'agent « émet » 3 virements fantômes ; Mehdi reçoit la fiche mules ; 0 € sorti, 40 paiements légitimes servis |
| 3 | **Duel live : juge LLM vs moniteur aveugle** (S16) | Fait la démonstration expérimentale du point que tous les jurys techniques connaissent mais que personne ne montre | Les attaquants du jury peuvent trouver une faille : à anticiper (« ce qui passe encore ») | Écran partagé : la même injection passe le juge LLM (rouge), est stoppée par le gate (vert) |
| 4 | **Contre-épreuve : trois rejeux côte à côte** (S7) | Explicabilité maximale pour KPMG/auditeurs : « la facture a commandé, pas Claire » | Variance LLM en direct → démo enregistrée de secours | Trois colonnes de rejeu avec verdict causal |
| 5 | **Dossier de preuve « assurable »** (S13+S18) | Relie la technique à l'argent : les assureurs excluent l'IA ; KPMG est certifié AIUC-1 ; sortie = leurs preuves | Plus « conformité » que « wow » ; validité du mapping AIUC-1 à confirmer | « Voici le dossier remis à l'assureur » : PDF signé + `verify` qui passe au vert ; une altération le fait passer au rouge |
| 6 | **Kill switch gradué à exposition cumulée** (S4+S14) | Répond à « et le salami ? » ; vocabulaire de marché (circuit breakers) | Moins spectaculaire ; « if/else » | Compteur : 40 micro-paiements ; pause automatique au 20e ; levée automatique |
| 7 | **Enforcer on-chain qui exige une attestation** (S12) | Réponse à Bybit/Bitget : le kill switch survit à la compromission du backend ; parle à Team1/Avalanche | 3-4 h ; utile surtout pour le volet crypto | Tentative de transfert direct sans attestation → revert on-chain sur Fuji ; `revokeGate()` |
| 8 | **Validation mobile à diff déterministe + mesure de vigilance** (S8) | ASI09 mesuré ; « supervision humaine réelle » (FSB, AI Act art. 14) | Mockup mobile à produire | Téléphone : diff IBAN rouge/vert ; chiffre : « délai médian 14 s, 100 % des leurres de contrôle refusés » |
| 9 | **Baseline ancrée dans le mandat + dérive** (S10) | Capte les erreurs sans adversaire (Lobstar Wilde) | Cold start ; FP | Le « 4 SOL » devient « 52 M tokens » : écart ×10⁷ en rouge |
| 10 | **Tableau « ce qui passe encore »** (S17) | Les jurys récompensent l'honnêteté (v1, F9) ; renforce la crédibilité des autres | Peut être perçu comme faiblesse si mal cadré | Slide finale : taux d'échec de la famille adaptative publié |

---

## 5. Comment la blockchain peut servir (Avalanche, eERC, Safe, session keys)

> Principe (mémoire projet) : la blockchain est **une preuve**, pas le produit. Test d'honnêteté : « un S3 Object Lock ou un horodatage RFC 3161 ferait-il la même chose ? » Si oui, dire pourquoi la chaîne apporte *en plus* (vérifiable sans faire confiance à l'opérateur).

| # | Usage | Crédibilité | Pourquoi / limite |
|---|---|---|---|
| U1 | **Ancrage Merkle du journal sur Fuji** (S13) | **Crédible, modeste** | Apport réel : un tiers (auditeur, assureur, régulateur) vérifie l'intégrité *sans faire confiance à l'opérateur*. Un WORM + TSA suffit pour la plupart des cas : honnête de le dire. Coût quasi nul. Ne **jamais** mettre les données elles-mêmes (RGPD). |
| U2 | **Enforcer / kill switch indépendant du backend** (S12) | **Crédible (volet crypto/wallets), artificiel pour l'AP fiat** | Bitget : le circuit d'autorisation interne a menti ; ici le contrat refuse tout transfert sans attestation valide, et `revokeGate()` coupe. Pour l'AP fiat, on parle de PSP/Stripe Issuing (approbation programmatique) plutôt que de chaîne. |
| U3 | **Budget et vélocité en délégation on-chain** (Safe module, caveat enforcers MetaMask ERC-7710, session keys ERC-7715 [draft]) | **Crédible, déjà fait par d'autres** | Révocation = une transaction ; plafonds appliqués au consensus. À citer comme *brique*, pas comme innovation. |
| U4 | **Registre fournisseurs et mandats versionnés, modification par multisig/timelock** | **Crédible** | Attaque la racine de la fraude : modifier l'IBAN d'un fournisseur nécessite plusieurs signatures + délai + rappel hors bande. Preuve d'historique opposable. |
| U5 | **Contrat leurre sur Fuji** (S5/S6) | **Crédible, spectaculaire** | Les « virements fantômes » partent vers un contrat qui ne libère jamais rien : visuel on-chain en 2 h. Pas de risque d'action contre un système réel (notre propre chaîne de test). |
| U6 | **eERC (Avalanche) avec clé d'audit** | **Possible mais lourd** | Utile : paiements B2B dont les montants ne doivent pas être publics, mais lisibles par l'auditeur (viewing key). ZK/courbe d'apprentissage ≫ 36 h (`02_track1_finance.md`, idée 9 : faisabilité 2/5). À citer en « roadmap », pas en démo. |
| U7 | **ERC-8004 (registres identité/réputation/validation)** | **Prématuré** | Standard encore *draft* ; ne définit pas la légitimité d'un paiement. Mention en roadmap uniquement. |
| — | « Tout le journal on-chain » | **Artificiel** | Coût, vie privée, latence, aucune valeur ajoutée sur une racine ancrée. |
| — | « Liste de révocation on-chain pour la latence » | **Artificiel** | La révocation doit être en base locale (ms) ; la chaîne sert de *preuve ultérieure*. |

**Recommandation [Inf]** : U1 (obligatoire, 1 h), U2/U5 en option sur Fuji si le cœur est fini samedi soir, U4 comme argument ; ne pas surcharger.

---

## 6. Réponse à « si votre modèle se trompe, qui est responsable ? »

**Réponse en 30 secondes (à apprendre)** :
> « Dans notre architecture, le modèle ne décide jamais d'un paiement. Il propose ; une règle déterministe, signée par la DAF dans son mandat, dispose. Si le modèle se trompe, trois choses sont vérifiables : ce que Claire avait signé (ses bornes), ce que la passerelle a décidé et pourquoi (journal chaîné), et d'où venait chaque valeur (provenance). La responsabilité suit ces preuves : Claire dans les limites qu'elle a signées, l'exploitant de la passerelle pour une règle mal appliquée, le fournisseur du modèle selon son contrat tiers TIC. Nous ne supprimons pas la responsabilité : nous la rendons *démontrable et bornée*. »

| Situation | Qui porte [Inf] | Preuve produite | Fondement à citer |
|---|---|---|---|
| Paiement dans le mandat, bénéficiaire légitime, mais décision métier mauvaise | Le mandant (DAF/entité) | Mandat signé + chaîne d'autorité | Responsabilité du déployeur ; FSB juin 2026 : la responsabilité reste humaine, supervision *human-in-command* |
| Paiement hors mandat accepté par erreur de règle | L'exploitant de la passerelle (nous / l'intégrateur) | Journal + version de règle | Sécurité contractuelle ; DORA art. 9-11 |
| Valeur d'origine non fiable acceptée sans validation | Défaut de conception : exploitant | Graphe de provenance | idem |
| Humain a approuvé un diff clair | L'approbateur, dans son périmètre | Décision signée, délai, diff déterministe | AI Act art. 14 (supervision humaine effective) |
| Erreur du LLM fournisseur (hallucination, injection réussie) mais bloquée par le gate | Personne n'est lésé ; incident documenté | Rapport d'incident | DORA art. 17-19 (classification) |
| Erreur du LLM **et** gate non applicable (par ex. hors paramètres gardés) | Partage selon contrat ; fournisseur LLM = prestataire TIC tiers | Certificat causal (S7) | DORA art. 28 ; AI Act chaîne de valeur (provider/deployer) |
| Litige carte (Visa/Mastercard) pour achat d'agent | **Non tranché publiquement** : Visa (selon une source) attribue à titulaire l'action de l'agent comme la sienne ; ACP : le marchand reste responsable ; pas de code de motif propre aux agents (août 2026) | Mandat + chaîne signée | [Worldpay](https://worldpay.com/insights/articles/agentic-commerce-liability-is-still-being-written), [TinyFish](https://current.tinyfish.ai/issue/39/market-pulse/article/32330/when-the-first-agent-purchase-gets-disputed) [V2] |
| Fraude par usurpation (faux fournisseur) côté PSP | PSP sous **PSD3/PSR** (textes de compromis publiés le 23 avr. 2026 ; adoption formelle en cours) | Preuve de diligence (VoP, rappel hors bande) | PSD3/PSR [V2 via v1] |

**Précisions de conformité honnêtes** :
- **AI Act** : les art. 12 (journalisation), 13-14 (transparence, supervision humaine), 15 (robustesse) visent les systèmes **à haut risque**. Un agent AP n'est **pas** automatiquement « haut risque » (Annexe III cible notamment l'évaluation de solvabilité). **Le report des obligations « haut risque » au 2 déc. 2027 a fait l'objet d'un accord politique provisoire le 7 mai 2026 ; adoption formelle non confirmée au 10 oct. 2026** [ÀV] ([Hogan Lovells](https://www.hoganlovells.com/en/publications/eu-legislators-agree-to-delay-for-highrisk-ai-rules)). → Présenter l'AI Act comme **bonne pratique anticipée et critère d'assurance**, pas comme obligation directe [Inf]. La durée de conservation des journaux par le déployeur (≥ 6 mois, art. 26) est à vérifier [ÀV].
- **DORA** s'applique **directement** aux entités financières et aux CASP agréés (voir `02_track1_finance.md`) : art. 9 (moindre privilège, contrôle d'accès), 10 (détection), 11 (réponse), 17-19 (classification et déclaration), 28 (prestataires TIC tiers, y compris le fournisseur de LLM). C'est le **bon cadre** pour la slide conformité.
- **LCB-FT** : la cage produit des destinations de comptes de mules : alimente le soupçon et le signalement ; elle reste interne (aucun faux message à un tiers réel).
- **Comment un auditeur vérifie** : (1) `verify_chain` sur le mandat, (2) `verify_log` sur le journal et sa racine ancrée, (3) rejouer la décision sur la version de règle et la provenance consignées, (4) consulter le certificat causal pour les cas escaladés.

---

## 7. Recommandations opérationnelles

### 7.1 Les 5 idées les plus fortes (notes estimées /100)

| Rang | Idée | Dét. /30 | Rép. /20 | Faisa. /20 | Conf. /15 | Pitch /15 | **Total** |
|---|---|---|---|---|---|---|---|
| 1 | **SILLAGE+** (S1+S2+S15 : provenance dans le jeton + chaîne d'autorité signée + pas d'escalade par message) | 26 | 16 | 16 | 14 | 12 | **84-86** |
| 2 | **NASSE** (S5+S6 : cage + canaris + fiche mules) | 22 | 19 | 17 | 11 | 14 | **83** |
| 3 | **CONTRE-ÉPREUVE** (S7 : attribution causale) | 23 | 14 | 15 | 15 | 13 | **80** |
| 4 | **Kill switch gradué + exposition cumulée + enforcer Fuji** (S4+S14+S12) | 22 | 17 | 16 | 13 | 10 | **78** |
| 5 | **Dossier de preuve « assurable »** (S13+S18, aligné AIUC-1/DORA) | 12 | 12 | 17 | 15 | 11 | **67 seul / +4 pts en couche sur le combo** |
| ★ | **Combo recommandé** : SILLAGE+ + NASSE + dossier de preuve, avec duel « moniteur aveugle » (S16) en démo | 27 | 19 | 15 | 15 | 14 | **90** |

Toutes ces notes sont **mes estimations** [Inf] sur la grille du jury ; la faisabilité suppose Adem seul sur le code en ~24 h (voir plan v1 §4) et un PSP simulé.

### 7.2 Ce qu'il faut changer dans la v1 (corrections)
1. Okta : remplacer « le kill switch automatique n'existe pas » par « d'après la documentation support consultée, la désactivation était **manuelle** et les jetons existants restaient valides ; Okta a annoncé un *Agent Gateway* à Oktane (sept. 2026), détails non vérifiés ».
2. Ajouter explicitement le **0,6-7,5 %** de TRM pour ne pas sur-vendre x402 ; la v1 cite x402 comme attaque, pas comme volume : OK, mais le TL;DR « douleur vécue » doit mentionner que le volume agent-payeur est faible.
3. Lobstar Wilde : à ajouter comme cas **sans adversaire** (justifie S10).
4. Hugging Face (juil. 2026) : à ranger sous ASI10 (agent voyou), pas sous « agent piégé par injection ni vol d'argent ».
5. EchoLeak, postmark-mcp : preuves de mécanisme, **pas de perte financière documentée**.
6. ATLAS : utiliser les identifiants **vérifiés** (voir §8) ; D3FEND : D3-DO, D3-DE, D3-UAP, D3-AL, D3-UBA, D3-ANCI vérifiés.

### 7.3 Pour l'objection « agents payeurs = 2028 »
- Montrer : Ramp (AP agentique en production depuis oct. 2025), Coinbase (Agentic Wallets en production depuis fév. 2026, ~69 000 agents actifs selon Coinbase), pertes réelles (Grok×Bankr, AIXBT, Lobstar Wilde), BEC 3,05 Md$ (FBI 2025).
- Dire : « le volume autonome de bout en bout est encore petit (TRM : 0,6-7,5 %) ; c'est justement le moment de poser le contrôle **avant** que le volume arrive, comme les 3DS avant l'e-commerce de masse » [Inf].
- Ne **pas** prétendre à un cas public d'AP piégé par facture : le dire comme *scénario plausible validé en laboratoire* (Forcepoint, Zscaler).

---

## 8. Mappings : identifiants vérifiés et à vérifier

| Référentiel | Identifiant | Libellé | Niveau |
|---|---|---|---|
| NIST CSF 2.0 | GV.RR, GV.OV, GV.SC, GV.PO, GV.OC · ID.AM, ID.RA, ID.IM · PR.AA, PR.AT, PR.DS, PR.PS, PR.IR · DE.CM, DE.AE · RS.MA, RS.AN, RS.CO, RS.MI · RC.RP | Catégories CSF 2.0 | [V] (taxonomie standard, non rechargée cette session) |
| OWASP Agentic | ASI01 Agent Goal Hijack · ASI02 Tool Misuse & Exploitation · ASI03 Identity & Privilege Abuse · ASI04 Agentic Supply Chain · ASI05 Unexpected Code Execution · ASI06 Memory & Context Poisoning · ASI07 Insecure Inter-Agent Communication · ASI08 Cascading Failures · ASI09 Human-Agent Trust Exploitation · ASI10 Rogue Agents | Libellés via sources secondaires | [V2], exactitude [ÀV] |
| MITRE ATLAS | AML.T0051 (LLM Prompt Injection) et .001 (indirecte) · **AML.T0053** AI Agent Tool Invocation · **AML.T0080** AI Agent Context Poisoning · AML.T0081 Modify AI Agent Configuration · **AML.T0086** Exfiltration via AI Agent Tool Invocation · AML.T0096 AI Service API · AML.T0098 AI Agent Tool Credential Harvesting · AML.T0101 Data Destruction via AI Agent Tool Invocation · **AML.M0030** Restrict AI Agent Tool Invocation on Untrusted Data (mitigation) | via [CSA note](https://labs.cloudsecurityalliance.org/agentic/csa-research-note-atlas-agentic-gap-analysis-20260327/), [Speakeasy](https://www.speakeasy.com/blog/mitre-atlas-explained) | [V2] ; **confirmer sur atlas.mitre.org** |
| MITRE ATT&CK | T1657 Financial Theft · T1566 Phishing (.001 pièce jointe) · T1078 Valid Accounts · T1528 Steal Application Access Token · T1550.001 Application Access Token · T1565.002 Transmitted Data Manipulation · T1199 Trusted Relationship · T1036 Masquerading · T1070 Indicator Removal · T1562 Impair Defenses · T1204 User Execution · T1027 Obfuscated Files or Information | connaissance générale | **[ÀV rapide sur attack.mitre.org]** |
| MITRE D3FEND | **D3-DO** Decoy Object [V] · **D3-DE** Decoy Environment [V] · **D3-UAP** User Account Permissions [V] · **D3-AL** Account Locking [V] · **D3-UBA** User Behavior Analysis [V] · **D3-ANCI** Authentication Cache Invalidation [V] ; D3-DUC (Decoy User Credential), D3-MFA, D3-OTP, D3-FA, D3-FH, D3-OAM, D3-NTF [ÀV] | pages d3fend.mitre.org | [V]/[ÀV] |

---

## Sources

**Marché agents-paiement et x402**
- TRM Labs, « Who's actually paying » (9 sept. 2026) : https://www.trmlabs.com/trm-tech-blog/whos-actually-paying-measuring-ai-agent-payments-onchain
- Let's Data Science (Artemis/CryptoSlate, « approval gap ») : https://letsdatascience.com/news/x402-reveals-approval-gap-in-agentic-micropayments-761bf8e7
- Comparatif Mastercard/Stripe/Visa/x402 : https://atxp.ai/blog/mastercard-agent-pay-stripe-acp-visa-x402-comparison-2026
- Stellagent (Visa/Mastercard, pilotes) : https://stellagent.ai/insights/visa-mastercard-agentic-commerce-strategy
- Ramp, Agents for AP : https://ramp.com/blog/ramp-ap-agents-announcement · https://www.cpapracticeadvisor.com/2025/10/07/ramp-launches-accounts-payable-agents/170422/
- Brex / OpenAI : https://www.brex.com/journal/press/brex-helps-power-open-ai-global-spend-and-financial-operations
- Coinbase Agentic Wallets : https://eco.com/support/en/articles/14845485-coinbase-agentic-wallets-explained
- Fireblocks, contrôles de dépense x402 : https://developers.fireblocks.com/docs/x402-agent-spending-controls

**Incidents et études**
- Grok×Bankr : https://oecd.ai/en/incidents/2026-05-04-4a73 · https://giskard.ai/knowledge/how-grok-got-prompt-injected-an-x-user-drained-150-000-from-an-ai-wallet · https://cointelegraph.com/magazine/grok-bankr-wallet-free-nft-prompt-injection
- Bankr 14 wallets : https://cointelegraph.com/news/bankr-disables-transactions-after-14-wallets-hacked
- Lobstar Wilde : https://cointelegraph.com/news/openai-employee-s-ai-agent-accidentally-sent-442k-to-beggar · https://www.techloy.com/ai-trading-bot-lobster-wilde-accidentally-sends-250k-in-lobstar-tokens-after-misreading-social-media-post/
- AIXBT : https://www.theblock.co/news/regulation/2025-03-18-ai-crypto-bot-aixbt-lost-eth-hack-unauthorized-dashboard-access-346911
- Routeurs LLM malveillants (arXiv 2604.08407) : https://labs.cloudsecurityalliance.org/research/csa-research-note-llm-proxy-router-risk-20260416-csa-styled/ · https://www.helpnetsecurity.com/2026/04/16/llm-router-security-risk-agent-commands/
- Zscaler ThreatLabz : https://securityaffairs.com/194822/ai/hidden-web-prompts-trick-ai-agents-into-sending-money.html
- Forcepoint / injections invisibles : https://darkreading.com/cyber-risk/hidden-prompts-trick-ai-into-false-email-summaries
- postmark-mcp : https://snyk.io/blog/malicious-mcp-server-on-npm-postmark-mcp-harvests-emails/ · https://thehackernews.com/2025/09/first-malicious-mcp-server-found.html
- EchoLeak : https://socprime.com/blog/cve-2025-32711-zero-click-ai-vulnerability/
- Hugging Face / OpenAI : https://www.illumio.com/cybersecurity-101/hugging-face-security-incident
- Fraude : https://www.mcdonaldhopkins.com/insights/news/the-sobering-truth-of-the-fbis-2025-internet-crime-complaint-center-report · https://www.financialprofessionals.org/training-resources/resources/survey-research-economic-data/Details/payments-fraud

**Assurance**
- The Decoder (FT, 24 nov. 2025) : https://the-decoder.com/major-insurers-seek-to-exclude-ai-related-risks-from-corporate-policies/
- Lexology : https://www.lexology.com/library/detail.aspx?g=b76e0dba-d9a8-44f1-9f5d-6fbd0a22f6b6
- AIUC-1 : https://www.aiuc-1.com · NBC : https://www.nbcnews.com/tech/tech-news/insurance-companies-are-trying-to-make-ai-safer-rcna243834
- Gartner guardian agents : https://www.gartner.com/en/newsroom/press-releases/2025-06-11-gartner-predicts-that-guardian-agents-will-capture-10-15-percent-of-the-agentic-ai-market-by-2030

**Concurrents et M&A**
- Tracker M&A : https://guptadeepak.com/agent-security/deals/ · https://guptadeepak.com/identity-giants-bought-ai-agent-security/ · https://www.infosecurity-magazine.com/news-features/cybersecurity-ma-roundup-feb-26
- Zenity : https://letsdatascience.com/news/zenity-raises-125-million-for-ai-agent-security-9aad0361 ; Straiker : https://letsdatascience.com/news/straiker-raises-64m-to-secure-enterprise-ai-agents-15d967e2 ; HiddenLayer : https://letsdatascience.com/news/hiddenlayer-raises-100m-for-ai-security-940a94e6
- Auth0 for AI Agents : https://auth0.com/blog/auth0-for-ai-agents-generally-available/ · Okta : https://www.joplinglobe.com/region/national_business/okta-announces-new-blueprint-for-the-secure-agentic-enterprise/article_128fcd37-81de-5a91-b064-cfe94815d9ce.html · Oktane 2026 : https://s205.q4cdn.com/566291348/files/doc_events/2026/Sep/23/Okta-Oktane-2026-Announcements.pdf
- Microsoft Agent 365 / Entra : https://mc.merill.net/message/MC1395007
- AWS AgentCore Policy : https://aws.amazon.com/blogs/aws/amazon-bedrock-agentcore-adds-quality-evaluations-and-policy-controls-for-deploying-trusted-ai-agents/
- agentgateway : https://www.nextplatform.com/2025/09/02/linux-foundation-brings-solo-ios-gateway-into-the-agentic-ai-fold/
- Invariant : https://invariantlabs.ai/blog/guardrails
- MetaMask ERC-7715 : https://docs.metamask.io/smart-accounts-kit/concepts/advanced-permissions/ · ERC-8004 : https://eips.ethereum.org/EIPS/eip-8004
- Liability agentique : https://worldpay.com/insights/articles/agentic-commerce-liability-is-still-being-written · https://current.tinyfish.ai/issue/39/market-pulse/article/32330/when-the-first-agent-purchase-gets-disputed · https://www.digitalapplied.com/blog/agent-checkout-authentication-card-networks-2026

**Recherche et référentiels**
- FIDES (IFC) : https://arxiv.org/pdf/2505.23643 · CaMeL : https://arxiv.org/abs/2503.18813
- OWASP ASI (sources secondaires) : https://auth0.com/blog/owasp-top-10-agentic-applications-lessons/ · https://www.descope.com/blog/post/owasp-agentic-top-10-identity
- ATLAS agents : https://labs.cloudsecurityalliance.org/agentic/csa-research-note-atlas-agentic-gap-analysis-20260327/ · https://www.speakeasy.com/blog/mitre-atlas-explained
- D3FEND : https://d3fend.mitre.org/technique/d3f:DecoyObject/ · https://d3fend.mitre.org/technique/d3f:DecoyEnvironment/ · https://d3fend.mitre.org/technique/d3f:UserAccountPermissions/ · https://d3fend.mitre.org/technique/d3f:AccountLocking/ · https://d3fend.mitre.org/technique/d3f:UserBehaviorAnalysis/ · https://d3fend.mitre.org/technique/d3f:AuthenticationCacheInvalidation/
- AI Act, omnibus : https://www.hoganlovells.com/en/publications/eu-legislators-agree-to-delay-for-highrisk-ai-rules

**Non couvert / à vérifier avant toute slide** : statut exact de la révocation automatique chez Okta ; identifiants ATT&CK (revérifier un par un) et D3FEND marqués [ÀV] ; libellés OWASP ASI exacts (document officiel à télécharger) ; Lasso, Pillar, Operant, Obsidian, Cisco AI Defense, Guardrails AI, NeMo Guardrails, Cubist, Lit, Nevermined, Langfuse/Arize/Galileo, AIVSS, Zodiac Roles (descriptions de mémoire générale, non revérifiées) ; durée de conservation des journaux AI Act art. 26 ; adoption formelle de l'omnibus ; litige carte Visa (rôle exact du TAP sur la responsabilité) ; incident Bankr 14 wallets (date) ; « 40 M$ Solana janvier 2026 » (source unique, ne pas citer).

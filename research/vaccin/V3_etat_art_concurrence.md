# V3 — État de l'art et concurrence : « système immunitaire pour agents IA financiers »

*Recherche du 2026-10-10. Sources web vérifiées le jour même. Les chiffres marqués (vendeur) sont des déclarations commerciales non vérifiées indépendamment.*

## TL;DR (à lire en premier)

1. **L'idée « immunité collective on-chain pour agents IA » n'est PAS vierge.** Au moins deux projets du hackathon ETHGlobal *Open Agents* l'ont déjà prototypée : **Immunity** (« antibodies » publiés on-chain sur 0G, propagés en P2P, 3e prix d'une track 0G) et **Sybil** (« AI agent immune system », Proof of Attack + vote de validateurs sur Sepolia). Un projet lablab.ai (**Deriv Sentinel**, fév. 2026, finance) utilise déjà le terme **« vaccine guardrail »** avec une boucle red team → heal. Une startup YC 2026 (**Silmaril**) fait hunt → detect → block → retrain (< 60 min) et partage les techniques anonymisées entre clients. Deux papiers arXiv 2026 utilisent le cadre immunitaire (**ANIS**, **AgentAntibody**).
2. **Ce qui n'existe pas (à notre connaissance)** : un vaccin qui n'est publié **qu'après un essai clinique mesuré** (rejeu de l'attaque + non-régression sur les tâches financières légitimes + taux d'auto-immunité), dont **la preuve d'efficacité** (et pas seulement la signature) est ancrée on-chain, avec des politiques exprimées **au niveau de l'action financière** (montant, contrepartie, vélocité, intention) plutôt qu'au niveau du prompt.
3. **Conclusion stratégique** : on ne doit PAS pitcher « on a inventé l'immunité on-chain pour agents ». On doit pitcher **« l'immunité vérifiable »** : chaque vaccin est un essai clinique reproductible, mesuré et auditable. C'est notre angle, et c'est ce qui manque chez Immunity/Sybil/Deriv Sentinel (les juges de Deriv Sentinel ont précisément demandé « vos métriques de couverture ? »).

---

## 1. Red teaming continu / automatisé d'agents IA

### 1.1 Plateformes commerciales

| Acteur | Ce qu'il fait | Génère-t-il la défense ? | Partage inter-clients ? |
|---|---|---|---|
| **Gray Swan** (Arena, Proving Ground) | Red teaming crowdsourcé avec prix ; challenge Agent Red-Teaming avec UK AISI (8 mars–6 avril 2025, ~1,8 M tentatives, 22 modèles, ~171,8 k$ de prix) ; arène IPI 2026 (464 participants, ~272 k tentatives, 13 modèles) | Non (fournit des données d'attaque aux labos) | Données agrégées vers les labos |
| **Haize Labs** (racheté par Beacon Software, sept. 2026) | Produits Judge / Haize / Monitor / Robustify ; moteur multi-tours Cascade (tree search) ; pitch « red teaming comme de la CI » | « Robustify » = durcissement, peu documenté publiquement | Non |
| **Lakera Red** (Check Point, acquis sept. 2025) | Red teaming contextuel automatisé ; Lakera Guard = firewall runtime | **Non** : rapports avec « remediation guidance » (conseil, pas règle auto) | Non documenté |
| **SPLX → Zscaler AI Red Teaming** (acquis nov. 2025) | Red teaming automatisé | **Partiellement** : remédiation « closed loop » en générant des **system prompts durcis** (vendeur) | Non documenté |
| **Mindgard** | Red teaming continu + enforcement runtime ; « validate fixes » ; rapports mappés OWASP | Validation de correctifs, pas génération automatique documentée | Non |
| **Silmaril** (YC 2026) | Firewall runtime d'agents (~20 ms p90) ; agents de threat hunting autonomes ; **retrain du classifieur < 60 min** après une attaque passée (vendeur) | **Oui** (classifieur ré-entraîné) | **Oui** : technique nouvelle partagée de façon anonymisée dans son réseau |
| **Tenet Security** (seed 6 M$, juin 2026) | Injection indirecte via emails/docs | Non documenté | Non documenté |
| **Patronus AI** | Non trouvé dans nos recherches sur ce périmètre | — | — |

### 1.2 Outils open source
- **promptfoo** (MIT, racheté par OpenAI, mars 2026) : red teaming CLI/CI, plugin MCP pour l'abus d'outils.
- **garak** (NVIDIA) : scanner modèle, 120+ catégories, surtout un seul tour, peu adapté aux outils/agents.
- **PyRIT** (Microsoft) : orchestrateurs, scorers et converters composables, pour des pipelines sur mesure.
- **Giskard** : scan agentique (tool calls, multi-tours) ; les résultats alimentent des **tests de régression et des guardrails**. C'est le plus proche de notre boucle « attaque → test de non-régression », mais sans partage ni ancrage.
- **DeepTeam** (Confident AI) : 40+ vulnérabilités, module agentique.

### 1.3 Recherche 2025-2026 : auto-patching / défenses qui évoluent
- **SESG, « Yesterday's Shield, Today's Spear »** (arXiv 2608.08471, août 2026, Sangfor) : guardrail **en production** qui s'auto-met à jour. Agents génération, validation et routage. Nouvelle menace couverte en 16-24 h contre 40-90 h à la main ; 14 menaces sur 15 fermées en 2 mois. **C'est l'état de l'art industriel de l'auto-vaccination, mais pour un seul acteur (pas de partage) et au niveau contenu (pas d'actions financières).**
- **DARWIN** (arXiv 2607.19829, juil. 2026) : co-évolution attaquant/guardrail ; le guardrail est ré-entraîné sur les exemples adverses.
- **Self-Evolving Multi-Agent Defense** (arXiv 2608.26008) : défense multi-agents contre le jailbreak (baseline AutoDefense).
- **AdaptiveGuard** (arXiv 2509.16861, 2025) : détection OOD de jailbreaks inconnus du guardrail.
- **ASTRA** (arXiv 2511.02356) : boucle côté attaque « attack-evaluate-distill-reuse ».
- **ANIS — Agent-Native Immune System** (arXiv 2606.28270, juin 2026) : architecture « Immune Tower » à 6 couches, taxonomie *Agent Viruses / Agent Vaccines*, « Continual Immune Learning ». Propose la métrique **Autoimmunity Rate** (taux d'interventions faux positifs). Le partage entre agents y est une **question ouverte**, sans résultats expérimentaux dans l'abstract.
- **AgentAntibody** (arXiv 2608.04053, août 2026) : bibliothèque persistante d'« anticorps » par utilisateur contre l'injection de prompt, mise à jour au fil des rencontres. Pas de partage décrit.

### 1.4 Prototypes de hackathon (concurrence directe pour l'originalité)
- **Deriv Sentinel** (lablab.ai, Deriv AI Talent Sprint, 7 fév. 2026, tag Finance) : un attaquant LLM + honeypots → un agent cible → ShieldGemma juge → un **Heal Engine injecte un « vaccine guardrail »** (patch de prompt) et caviarde la donnée fuitée ; auto-heal optionnel. **Pas de suite de régression formelle, pas de partage.** Les juges ont demandé : attaques nouvelles ? métriques de couverture ? latence ?
- **NeuroSec — « An Intelligent AI Immune System »** et **IMMUNIS ACIN — Adversarial Coevolutionary Immune Network** (lablab.ai) : même champ lexical, ce qui confirme que le terme est saturé dans les hackathons.

**Ce qui est fait :** red teaming continu, auto-génération de patchs (prompts, classifieurs, guardrails ré-entraînés), boucle hunt→retrain.
**Ce qui manque :** (a) une **preuve d'efficacité standardisée et publique** pour chaque correctif (rejeu de l'attaque + non-régression + auto-immunité) ; (b) des correctifs **au niveau de l'action financière** plutôt que du texte ; (c) un **partage vérifiable entre organisations** (Silmaril partage, mais en boîte noire propriétaire).

---

## 2. Partage de threat intel on-chain / décentralisé

| Acteur | Modèle | Pertinence |
|---|---|---|
| **Forta Network** | 1000+ detection bots qui surveillent la chaîne ; Attack Detector 2.0 (BlockSec, Nethermind, nov. 2023) ; bots qui s'abonnent aux alertes d'autres bots, y compris des bots anti-faux-positifs | Modèle d'intel partagée, mais **pour les smart contracts, pas pour les agents IA** |
| **Forta Firewall** (live le 19 nov. 2024) | Filtrage pré-séquenceur sur les rollups, modèle FORTRESS (score 0-1, < 60 ms), 200/403 ; 400 M+ tx filtrées depuis mars 2025 (vendeur) ; sanctions à 1 saut en < 6 ms (sept. 2025) | Preuve que le **blocage pré-transaction par score** est industrialisé |
| **Hypernative Guardian** | Simulation pré-transaction + politiques approve/flag/block ; intégré à Safe, Ethena, Edge Capital (Fireblocks, Fordefi) ; « détecte 99,5 % des hacks » (vendeur) | Politique au niveau transaction, mais **pour des humains/multisigs, pas des agents IA** ; règles écrites à la main (Agent Builder) |
| **SEAL 911 / SEAL Intel / SEAL-ISAC** | Hotline d'urgence white hat, ISAC Web3 gratuit | Partage **humain** (Telegram, ISAC), pas de vaccins machine-exécutables |
| **Immunefi** | Bug bounties | Incitation, pas de partage de défense |
| **Chainalysis** | Traçage des fonds, conformité | Forensique après coup |
| **MISP / STIX 2.x / TAXII 2.1** | Standards de partage d'IoC (événements, attributs, objets ; partage privé, communautaire ou public) | Nos vaccins peuvent s'exporter en STIX. **Pas de type d'indicateur « agent IA » standard** trouvé |
| **ThreatFox** | Non couvert par nos recherches | — |
| **ERC-8259** (brouillon, 8 mai 2026) | Identity + Reputation + **Threat Registry** pour agents IA (signaux de menace signés, `riskDelta`) | **Concurrent conceptuel direct côté standard.** Problèmes ouverts : Sybil, taxonomie, cross-chain |
| **ERC-8273** (brouillon) | Agent Attestation Registry (attestation par capacité ou par action) | Brique réutilisable |
| **Immunity** (ETHGlobal Open Agents) | SDK `check()` sur la tx de l'agent ; 3 niveaux : cache chaud (gossip Gensyn AXL), **registre d'antibodies on-chain (0G)**, puis analyse profonde en TEE (Qwen) → **antibody publique** (JSON sur 0G Storage, CID + signatures on-chain), stake de 1 USDC pendant 72 h, 80 % des frais au publieur ; démo de 45 agents (traders, publishers, « wolves ») ; miroir Sepolia + hook Uniswap V4 | **Le plus proche de notre idée.** Réactif (attaque réelle → antibody), validation = jugement LLM, contestation reportée en v2 |
| **Sybil** (ETHGlobal Open Agents) | « AI agent immune system » : Proof of Attack (hash) + votes ed25519 de validateurs (3/5) → slashing ; ThreatLedger = mémoire collective, blacklist au bootstrap ; mutation sémantique sur 15 catégories | Partage de **blacklists d'attaquants**, **pas de règles de défense**, pas de régression |
| **0G Sentinel** | Score de risque écrit dans un registre 0G | Réputation, pas de vaccin |
| **BinaryShield** (arXiv 2509.05608, affilié Microsoft) | Empreintes non inversibles pour partager des attaques de prompt sans divulguer les prompts | **À citer** : répond à « publier l'attaque aide l'attaquant » |

**Ce qui est fait :** registres de menaces et de réputation d'agents (brouillons d'ERC, hackathons), blacklists partagées, blocage pré-transaction par score (Forta, Hypernative).
**Ce qui manque :** un registre où l'objet partagé est une **défense exécutable accompagnée de sa preuve d'efficacité reproductible** (hash du corpus de test, taux de blocage, taux de faux positifs, versions), et pas seulement un signal « cette adresse ou ce prompt est mauvais ».

---

## 3. L'analogie immunitaire en cyber (éviter la confusion)

- **Darktrace « Enterprise Immune System »** (fondé en 2013, Cambridge) : apprentissage **non supervisé** du « normal », détection des écarts, « digital antibodies » = réponse autonome (Antigena). En 2026 : **Darktrace / SECURE AI** (fév. 2026 : cartographie des agents, MCP, shadow AI), puis **Behavioral Defense Platform** (août 2026 : détecte compromission, manipulation et dérive d'agents), signaux intégrés à **Microsoft Agent 365**.
  → **Darktrace surveille déjà les agents IA en entreprise.** Différence : Darktrace fait de **l'immunité innée** (anomalie vs baseline, par client, en boîte noire). Nous faisons de **l'immunité adaptative et acquise** : exposition volontaire à un pathogène atténué (arène), mémoire spécifique (vaccin = règle explicite et lisible), **transmissible** entre organisations et **auditable**.
- **Artificial Immune Systems (AIS)** : Forrest et al. 1994, « Self-Nonself Discrimination in a Computer » (sélection négative) ; Kim & Bentley 2001 (sélection clonale, bibliothèque de gènes) ; critiques connues : la sélection négative passe mal à l'échelle sur du trafic réel et sert surtout de **filtre à détecteurs invalides** (Kim & Bentley). Ebner et al. reprochent une copie trop littérale de la biologie.
  → Leçon utile : notre étape de non-régression **est** la sélection négative (on rejette tout vaccin qui réagit au « soi », c'est-à-dire aux transactions légitimes). Ça répond directement à la critique historique.
- **ANIS** (2026) formalise déjà « virus / vaccins / auto-immunité » pour les agents : **à citer comme validation académique du cadre**, pas comme concurrent produit.

---

## 4. Sécurité des agents qui paient

| Acteur | Contrôles | Ce qui manque |
|---|---|---|
| **Coinbase Agentic Wallets / AgentKit / x402** | Limites par session et par transaction fixées par l'opérateur, screening KYT et OFAC avant signature, clés en enclave hors de portée du LLM ; x402 = paiement HTTP en stablecoins (Bazaar) | Règles **statiques** écrites par l'opérateur ; rien n'apprend des attaques |
| **Stripe ACP / Shared Payment Tokens** | Tokens limités au vendeur, plafonnés en montant et en durée ; anti-fraude agentique non détaillée | Contrôle du credential, pas du raisonnement de l'agent |
| **Visa Trusted Agent Protocol / Mastercard Agent Pay** | Authentification de l'agent (Web Bot Auth, signatures HTTP), tokenisation, distinction agent légitime / bot ; Fiserv adopte les deux | **Identité** de l'agent, pas sa **compromission** (un agent authentifié mais victime d'injection passe) |
| **Skyfire (KYAPay)** | JWT KYA (identité du propriétaire) + JWT de paiement plafonné ; limites par agent ; historique vérifiable | Identité et plafonds |
| **Payman** | Wallet par agent, moteur de politiques pré-exécution, approbation humaine au-dessus d'un seuil (sources secondaires) | Politiques manuelles |
| **Catena Labs** | Series A de 30 M$ (mai 2026), demande de charte de trust bank OCC (en attente) ; limites, destinataires approuvés, audit trail ; Agent Commerce Kit open source | Gouvernance, pas d'apprentissage adverse |
| **Kite AI** | L1 dédiée aux agents, Agent Passport, AP2, intégration x402 | Identité et gouvernance programmable |
| **Avalanche** | x402 via le facilitateur PayAI sur la C-Chain (~2 s, ~0,001 $ de gas, chiffres de cours) | **Aucun registre de menaces pour agents trouvé sur Avalanche** : place libre |

**Incidents réels qui justifient le besoin :**
- **Freysa** (nov. 2024) : 13,19 ETH extraits à la 482e tentative en redéfinissant la fonction de transfert.
- **AIXBT** (18 mars 2025) : 55,5 ETH perdus, en réalité via le **dashboard d'admin** (prompts injectés par une interface « de confiance »).
- **Princeton / Sentient, « Real AI Agents with Fake Memories »** (arXiv 2503.16248) : injection de mémoire dans ElizaOS menant à des transferts non autorisés.
- **Bankrbot** (2026, source unique) : un guardrail anti-transfert retiré avant le lancement.

**Ce qui est fait :** identité (KYA, TAP, Agent Pay), plafonds, sanctions, clés isolées.
**Ce qui manque :** une couche qui **apprend** des attaques contre le raisonnement de l'agent et **transforme chaque incident en politique de paiement** partagée. Les rails fixent *qui* paie et *combien au maximum* ; personne ne vaccine contre le *pourquoi* manipulé.

---

## 5. Synthèse

### 5.1 Déjà fait (ne pas le revendiquer)
- Red teaming automatisé et continu d'agents (Gray Swan, Haize, Lakera, Mindgard, promptfoo, Giskard).
- Auto-génération de défenses à partir d'attaques réussies (SESG en production chez Sangfor, DARWIN, Silmaril, Zscaler pour les system prompts, Deriv Sentinel avec des « vaccine guardrails »).
- Cadre « système immunitaire » pour agents (ANIS, AgentAntibody, Darktrace pour l'innée).
- Registre on-chain de menaces ou d'« antibodies » pour agents (Immunity sur 0G, Sybil sur Sepolia, ERC-8259 en brouillon).
- Politiques pré-transaction (Coinbase, Hypernative Guardian, Forta Firewall, Payman, Catena).

### 5.2 Pas fait (ou mal fait)
- **Validation clinique** systématique et publique d'un vaccin avant diffusion (rejeu, non-régression, auto-immunité) : Immunity valide par un jugement LLM en TEE, Sybil par un vote, Deriv Sentinel n'a pas de régression formelle.
- **Vaccins exprimés au niveau de l'action financière** (prédicats sur montant, contrepartie, vélocité, provenance de l'instruction, cohérence intention/transaction) qui survivent aux reformulations de l'attaque, au lieu de patchs de prompt ou de signatures d'adresses.
- **Exposition proactive** dans une arène (vaccination avant infection) **reliée** à un registre partagé : Immunity et Sybil réagissent à des attaques réelles ; les plateformes de red teaming ne partagent pas.
- **Autopsie standardisée** de l'incident mappée ATLAS/ATT&CK/OWASP ASI : personne ne la publie comme objet partagé.
- **Avalanche** : aucun acteur identifié.

### 5.3 Les 3 angles réellement différenciants
1. **« Immunité vérifiable » (preuve d'efficacité on-chain).** Chaque vaccin est publié avec un **certificat d'essai clinique** : hash du corpus d'attaques rejouées (variants mutés inclus), hash du corpus légitime (le « soi »), taux de blocage, taux d'auto-immunité (métrique ANIS), versions du modèle et de l'agent. N'importe qui peut **re-jouer l'essai** et contester. On ancre la **preuve**, pas seulement le signal. C'est la vraie rupture face à Immunity et Sybil.
2. **Vaccins comportementaux sur l'action financière, pas sur le texte.** La règle porte sur ce que l'agent *fait* (ex. « transfert > X vers une contrepartie jamais vue, déclenché par du contenu non authentifié → bloquer ou escalader »), ce qui résiste aux reformulations (cf. papier « Anatomy of a Prompt Injection » : intention → effet) et parle aux équipes risques bancaires (contrôles proches de l'AML et de DORA). C'est le pont entre Coinbase/Stripe/Visa (rails) et le red teaming (attaques).
3. **Boucle complète fermée et mesurée : arène → autopsie → vaccin → essai → diffusion → rappel.** Un « calendrier vaccinal » : les nouvelles souches de l'arène rejouent automatiquement **tous** les vaccins déployés, ce qui détecte quand un vaccin devient obsolète (*Yesterday's Shield, Today's Spear*). Les métriques NIST CSF Detect/Respond (MTTD, MTTR, temps de l'incident au vaccin diffusé, FPR) sont mesurées de bout en bout. Personne ne publie ce cycle entier.

### 5.4 Objections du jury et réponses

| Objection | Réponse |
|---|---|
| « Darktrace fait déjà le système immunitaire. » | Darktrace fait de l'**immunité innée** : anomalie vs baseline, par client, en boîte noire. Nous faisons de l'**immunité acquise et transmissible** : exposition contrôlée, mémoire explicite (règle lisible), partage inter-organisations, preuve d'efficacité auditable. On peut même consommer des signaux Darktrace comme « fièvre » déclenchant une autopsie. |
| « C'est juste du red teaming. » | Le red teaming s'arrête au rapport (Lakera : « remediation guidance »). Nous, l'attaque n'est que l'**antigène** : la valeur est dans l'autopsie, la règle générée, l'essai de non-régression et la diffusion. Mesure de succès : le temps entre l'incident et la protection de **tous**, pas le nombre de failles trouvées. |
| « Immunity / Sybil ont déjà fait ça à ETHGlobal. » | Les citer nous-mêmes avant qu'on nous les oppose. Ils partagent un **signal** (antibody jugé par un LLM, blacklist votée). Nous partageons une **défense prouvée** (essai reproductible, taux de faux positifs publié), proactive (arène) et ciblée sur la finance. Leur contestation est restée en v2 ; la nôtre est native (re-jouer l'essai). |
| « Silmaril / SESG ré-entraînent déjà automatiquement. » | Oui, en silo propriétaire et au niveau du classifieur. Notre vaccin est une **politique explicite**, inspectable par un régulateur, portable entre fournisseurs et à l'historique immuable. |
| « Publier les attaques on-chain aide les attaquants. » | On ne publie pas le prompt brut : on publie le hash du corpus, la règle comportementale et les métriques (approche BinaryShield : empreintes non inversibles). Le corpus complet reste en accès restreint (modèle ISAC). |
| « Pourquoi une blockchain ? Une base de données suffit. » | Multi-organisations sans tiers de confiance : horodatage immuable (preuve d'antériorité du vaccin), non-répudiation de l'auteur, révocation traçable, audit DORA et régulateur. Coût sur Avalanche ≈ 0,001 $/tx (cours Avalanche) et aucun concurrent identifié sur cette chaîne. |
| « Un vaccin peut bloquer des transactions légitimes. » | C'est exactement ce que mesure l'essai : le taux d'auto-immunité sur le corpus légitime est une condition de publication. Seuil configurable, mode « escalade humaine » au lieu de « blocage » sous un certain niveau de confiance. |
| « Empoisonnement du registre (faux vaccins malveillants). » | Le vaccin est re-jouable par tous ; stake et contestation ; l'adoption est locale (chaque agent choisit ses éditeurs de confiance) ; les vaccins ne peuvent que **restreindre**, jamais élargir des permissions (règle monotone). |
| « Les attaques nouvelles ne seront pas couvertes. » | Exact, comme pour un vaccin. D'où l'arène (mutations de variants) et la couche innée en complément (plafonds Coinbase/Stripe). On mesure et on publie la couverture plutôt que de la promettre. |
| « Quel mapping ? » | NIST CSF 2.0 : DE.AE (analyse d'événements adverses), DE.CM, RS.AN (autopsie), RS.MI (mitigation), ID.IM (amélioration). Menaces : OWASP ASI01 Goal Hijack, ASI02 Tool Misuse, ASI06 Memory Poisoning, ASI08 Cascading Failures ; ATLAS AML.T0051 (LLM Prompt Injection) ; D3FEND pour les contre-mesures. |

---

## Sources

**Red teaming / auto-défense**
- Gray Swan Arena : https://app.grayswan.ai/arena/about · https://www.grayswan.ai/news/introducing-the-gray-swan-ai-proving-ground · https://www.grayswan.ai/blog/google-deepmind-and-anthropic-join-as-agent-red-teaming-challenge-sponsors · https://casrai.org/guides/gray-swan-arena-crowdsourced-red-teaming
- Haize Labs / Beacon : https://www.beri.net/article/beacon-haize-labs-acquisition-ai-red-teaming-vendor-continuity-export · https://artificialintelligencemadesimple.substack.com/p/building-on-haize-labss-work-to-automate
- Lakera Red : https://docs.lakera.ai/red · https://docs.lakera.ai/introduction
- Zscaler/SPLX : https://www.zscaler.com/de/blogs/product-insights/why-ai-red-teaming-matters-enterprise-security · https://bankinfosecurity.com/zscaler-purchases-splx-to-strengthen-genai-model-protection-a-29921
- Mindgard : https://mindgard.ai/compare/mindgard-vs-splx
- Silmaril (YC 2026) : https://yespress.io/silmaril-yc-p26
- Tenet Security : https://fintech.global/2026/06/18/tenet-security-raises-6m-to-stop-rogue-ai-agents/
- Outils OSS (promptfoo, garak, PyRIT, Giskard, DeepTeam) : https://www.giskard.ai/knowledge/ai-red-teaming-alternatives-directory · https://www.giskard.ai/knowledge/promptfoo-alternatives-ai-red-teaming · https://appsecsanta.com/ai-security-tools/promptfoo-alternatives · https://repello.ai/blog/promptfoo-alternatives
- SESG : https://arxiv.org/abs/2608.08471
- DARWIN : https://arxiv.org/abs/2607.19829
- Self-Evolving Multi-Agent Defense : https://arxiv.org/pdf/2608.26008
- AdaptiveGuard : https://arxiv.org/html/2509.16861v1
- ASTRA : https://arxiv.org/pdf/2511.02356v1
- ANIS : https://arxiv.org/abs/2606.28270
- AgentAntibody : https://arxiv.org/abs/2608.04053
- Deriv Sentinel : https://lablab.ai/submissions/fxzypdn88b5dyvy9dpj3sz1z
- NeuroSec : https://lablab.ai/submissions/aij4z8h2jmb3d9ookj7lbyrz · IMMUNIS ACIN : https://lablab.ai/submissions/hxpmxzyokza3dlhrgdrmy8qb

**Threat intel on-chain**
- Forta : https://docs.forta.network/en/latest/getting-started/ · https://www.forta.org/blog/2022-retrospective · Firewall : https://www.forta.org/blog/forta-firewall-is-live-ushering-in-a-new-era-of-onchain-security-and-compliance · https://forta.org/blog/forta-and-conduit · https://forta.org/blog/forta-firewall-expands-sanctions-screening
- Hypernative Guardian : https://www.hypernative.io/products/hypernative-guardian · https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative · https://www.hypernative.io/blog/how-edge-capital-scaled-transaction-security-and-expanded-defi-reach-with-hypernative-guardian
- SEAL : https://securityalliance.org/our-work · https://kelsienabben.substack.com/p/sealing-the-future-of-cryptocurrency · https://gauntlet.xyz/resources/building-an-institutional-grade-security-posture-at-gauntlet
- MISP / STIX / TAXII : https://misp-project.org/features/ · https://socradar.io/cyber-faq/what-are-stix-and-taxii/
- ERC-8259 : https://ethereum-magicians.org/t/erc-8259-ai-agent-identity-threat-registry/28473 · ERC-8273 : https://eips.ethereum.org/EIPS/eip-8273
- Immunity : https://ethglobal.com/showcase/immunity-urob5 · Sybil : https://ethglobal.com/showcase/sybil-bjzai · 0G Sentinel : https://hackquest.io/projects/0G-Sentinel-emg7Ge
- BinaryShield : https://arxiv.org/pdf/2509.05608v1 · Anatomy of a Prompt Injection : https://arxiv.org/pdf/2608.07808
- CSA, IPI in the wild 2026 : https://labs.cloudsecurityalliance.org/research/csa-research-note-indirect-prompt-injection-in-the-wild-2026/

**Analogie immunitaire**
- Darktrace : https://www.kuppingercole.com/research/ev80003/darktrace-enterprise-immune-system · https://amp.cnn.com/cnn/2018/02/05/tech/darktrace-cybersecurity-immune-system · https://www.darktrace.com/news/over-three-quarters-of-security-professionals-concerned-about-ai-agent-risk-new-darktrace-report-finds · https://pr.washingtoncitypaper.com/article/Darktrace-Advances-Behavioral-Security-to-Protect-AI-Agents-People-and-Infrastructure/6a70d34a1d8459b6854a6e9e · https://www.darktrace.com/news/darktrace-among-first-cybersecurity-companies-selected-to-integrate-risk-signals-into-microsoft-agent-365
- AIS : https://www.sfipress.org/79-forrest-1994 · https://arxiv.org/pdf/0804.1266 · https://homeostasis.scs.carleton.ca/~soma/biosec/readings/kim-bentley.pdf

**Agents qui paient**
- Coinbase : https://docs.cdp.coinbase.com/agentic-wallet/cli/welcome · https://thedefiant.io/news/cefi/coinbase-for-agents-ai-accounts-trade-pay-x402 · https://ethglobal.com/showcase/x402-guardrails-7bvma
- Stripe ACP : https://stripe.com/it/newsroom/news/agentic-commerce-suite · https://chudi.dev/blog/agent-commerce-readiness-acp-payment-tokens-link-wallets
- Visa / Mastercard : https://blog.cloudflare.com/secure-agentic-commerce/ · https://www.digitaltransactions.net/visa-launches-trusted-agent-an-agentic-commerce-protocol/
- Skyfire : https://www.skyfire.xyz/product · https://www.streetinsider.com/Business+Wire/Skyfire+Launches+Open+KYAPay+Protocol+With+Agent+Checkout/24981183.html
- Payman : https://dupple.com/reviews/payman · https://docs.langchain.com/oss/python/integrations/providers/payman-tool
- Catena Labs : https://www.theblock.co/post/402029/catena-labs-lands-30-million-series-a-files-for-national-trust-bank-charter-to-underpin-agentic-finance
- Kite : https://www.gokite.ai/kite-whitepaper · Avalanche x402 / PayAI : https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators · https://docs.avax.network/integrations/payai
- Incidents : https://arxiv.org/pdf/2503.16248 · https://decrypt.co/318200/elizaos-vulnerability-ai-gaslit-losing-millions · https://incidentdatabase.ai/cite/1003 · https://zealynx.io/blogs/ai-defi-prompt-injection
- OWASP Agentic Top 10 (déc. 2025) : https://cycode.com/blog/owasp-top-10-agentic-applications/ · https://docs.modulos.ai/frameworks/owasp-top-10-agentic

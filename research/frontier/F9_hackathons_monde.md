# F9 — Panorama mondial des hackathons cyber / sécurité IA / fintech sécurité (2025-2026)

> Rédigé le 2026-10-10 pour Secure Horizons (ESSEC, blue team). Objectif : savoir ce qui impressionne les jurys et ce qui gagne, pour sortir des sentiers battus.
> **Fiabilité.** Chaque ligne a sa source. Quand l'info vient d'un post de participant (LinkedIn, blog perso) ou d'un agrégateur, c'est signalé **(auto-déclaré)** ou **(non vérifié)**. Plusieurs régions publient peu de résultats en ligne (Chine, Israël, Moyen-Orient, Junction, HackZurich) : c'est indiqué en section 6 plutôt que comblé par des suppositions.

---

## 0. TL;DR (à lire en 30 s)

1. **La compétition la plus proche de notre format, SANS « Find Evil! » 2026** (agents autonomes de réponse à incident, 123 finalistes, 90 praticiens jurés), a été gagnée par des projets qui **prouvent chaque affirmation, se contredisent eux-mêmes avant de conclure et appliquent leurs garde-fous dans le code, pas dans le prompt**. Les jurés ont **attaqué chaque projet** (injection de commande, path traversal, altération de preuves) avant de classer.
2. **Le prompt firewall est mort comme argument gagnant.** 98 % des équipes d'un hackathon OpenAI × AI Tinkerers ne faisaient rien au-delà des garde-fous du modèle. Le marché a déjà racheté ces solutions (Lakera par Check Point en 2025). Les gagnants travaillent **la couche outils, l'identité et les jetons d'agent, la vérification et l'état final du système**.
3. **Ce qui gagne en fintech** (RBI HaRBInger, banques indiennes, SwissHacks) : un humain dans la boucle explicite, la **détection de comptes mules et le traçage des fonds**, la vérification documentaire et le KYC anti-deepfake. Il faut toujours une **chaîne détection → action** (bloquer, geler, récupérer).
4. **Les cadrages les plus originaux** inversent la question : « l'attaque, c'est ce que l'agent *n'a pas* fait » (Omission Attacks), « le modèle est sûr seul mais pas dans la boucle agent » (Mind the Gap), un « pot de miel pour agents IA » (elliot's honey), ou un « seuil d'alerte statistiquement défendable ».
5. **Le profil gagnant est souvent un expert métier qui sait coder** (avocat, cardiologue, répondant à incident). La crédibilité métier compte autant que la technique.

---

## 1. Tableau des projets gagnants (40+)

Légende des événements : AIxCC = DARPA AI Cyber Challenge (finale DEF CON 33, août 2025) ; FE = SANS Find Evil! (résultats en août 2026) ; GAH = Great Agent Hack (Holistic AI × UCL, Londres, nov. 2025).

| # | Projet / équipe | Événement (pays, date) | Rang | Ce qui a été construit | Pourquoi ça a gagné (juges / organisateurs) | Source |
|---|---|---|---|---|---|---|
| 1 | **Atlantis** (Team Atlanta : Georgia Tech, Samsung, KAIST, POSTECH) | AIxCC Final (USA, août 2025) | 1er, 4 M$ | Système autonome qui trouve, prouve et corrige des vulnérabilités dans 54 M de lignes de code | Premier sur la découverte, la preuve, l'association bug/patch et la précision des soumissions. Barème qui récompense la vitesse de patch et la qualité du rapport | [DARPA](https://www.darpa.mil/news/2025/aixcc-results) |
| 2 | **Buttercup** (Trail of Bits) | AIxCC Final | 2e, 3 M$ | Fuzzing (libFuzzer/Jazzer) complété par des cas de test générés par LLM, analyse statique tree-sitter, patching multi-agents | Privilégie la précision au volume (les mauvais patchs étaient pénalisés). 28 vulnérabilités, 19 patchs, ~90 % de précision, **181 $ par point**, LLM non-raisonnants bon marché, tourne sur un laptop | [Trail of Bits](https://blog.trailofbits.com/2025/08/09/trail-of-bits-buttercup-wins-2nd-place-in-aixcc-challenge/) |
| 3 | **RoboDuck** (Theori, USA/Corée) | AIxCC Final | 3e, 1,5 M$ | CRS autonome | Meilleur coût par point parmi le top 3 (selon ToB) | [DARPA](https://www.darpa.mil/news/2025/aixcc-results), [ToB](https://blog.trailofbits.com/2025/08/09/trail-of-bits-buttercup-wins-2nd-place-in-aixcc-challenge/) |
| 4 | **Mulder** (Caleb Evans, ingénieur ML sans background sécu) | FE (SANS, 2026) | 1er, 10 k$ | Agent forensique autonome en 5 phases : plan → exécution → analyse → **contradiction adversariale** → rapport. 773 appels d'outils sur 11 systèmes et 120 Go de preuves | Un validateur de références **rejette toute conclusion non reliée à un artefact réel**. Juge : « The hallucination precautions and sources being required and challenged are fantastic. » 119/143 artefacts trouvés sur l'image disque d'un juge | [SANS](https://www.sans.org/press/announcements/sans-names-the-five-winners-of-find-evil-2026), [GovInfoSecurity](https://www.govinfosecurity.com/cyber-novice-takes-top-prize-in-sans-ai-forensics-contest-a-32662) |
| 5 | **TRUDI** (Trinity Harrison, IR) | FE | 2e | Raisonne sur des chaînes causales dans une intrusion à 8 hôtes. Devant des indicateurs plantés dans le briefing, les a testés et **a réfuté ses propres hypothèses de départ** | « Self-correction at call 54 is genuine. » | [SANS](https://www.sans.org/press/announcements/sans-names-the-five-winners-of-find-evil-2026) |
| 6 | **Camel** (Allister Beharry) | FE | 3e | Architecture « code-mode » : le modèle écrit sa logique forensique via un SDK typé, dans un runtime sandboxé. Chaque conclusion remonte au script et à la commande exacts | « The broadest verified tool surface so far and top-tier architectural constraints. » | idem |
| 7 | **FindEvil** (marlyocat) | FE | 4e | Agent Linux en lecture seule imposée **par une porte AST statique** dans le code | 98,6 % de rappel sur un banc de 552 attaques. A publié 2 failles de ses propres garde-fous et leurs correctifs | idem |
| 8 | **Protocol SIFT++** (tupils1) | FE | 5e | Composant « **Skeptic** » qui relance les outils de façon indépendante pour réfuter les conclusions du harness | 14/14 tentatives destructrices refusées, hash des preuves inchangé. **P/R/F1 = 1,00 sur le cas public M57**. A réfuté sa propre détection de rootkit | idem |
| 9 | **Omission Attacks** (Team MAIA) | Apart AI Control Hackathon 2026 | 1er track LinuxArena | Taxonomie de 14 attaques **par omission** (ex. l'agent ne configure jamais ip6tables). Propose un **postcondition monitoring** : vérifier les invariants de l'état final | Les attaques par omission passent sous tous les moniteurs (≤ 4/10, contre 92/100 pour les attaques classiques). Le monitoring par postcondition les attrape toutes. Relecteur : « potentially influential » | [Apart](https://www.apartresearch.com/sprints/projects/omission-attacks-when-doing-nothing-is-the-attack-0y1v) |
| 10 | **Team IIT** | AI Control Hackathon (Horizon Omega × HackOS, juin 2026) | 1er | A rendu **le seuil d'alarme du moniteur statistiquement défendable** | Thème jugé central : un seuil qu'on peut défendre (non vérifié au-delà du résumé) | [Horizon Omega](https://horizonomega.substack.com/p/ai-control-hackathon-2026-retrospective) |
| 11 | **SHIELD** | Pear × Anthropic (SF, avr. 2025) | « Most Impressive Technical Feat » | RL multi-agents et usage d'outils pour trouver puis corriger des vulnérabilités d'un codebase | Prouesse technique | [Pear VC](https://pear.vc/pear-x-anthropic-hackathon/) |
| 12 | **Gitdefender** | GitLab AI Hackathon (Google Cloud × Anthropic, 2026) | Grand prix Google Cloud | Agent qui trouve et corrige des failles pendant la code review | Intégré au workflow existant (MR) | [The Note](https://thenote.app/post/en/gitlab-ai-hackathon-2026-meet-the-winners-cmfz3ggqkb) |
| 13 | **RedAgent** | GitLab AI Hackathon | Mention notable | **Vérifie les rapports de sécurité générés par IA** | Une IA qui audite une IA | idem |
| 14 | **SafeContext** | Hackathon IA agentique interne Palo Alto Networks (fév. 2026, 70 équipes) | 1er track Idea | Protège les agents contre les menaces web (injection indirecte) grâce à la réputation d'URL et à la threat intel | L'organisateur dit que ces projets pourraient « impact our product roadmap for the next three to five years » | [PANW](https://jobs.paloaltonetworks.com/en/safecontext-ai-hackathon-winner-palo-alto-networks) |
| 15 | **Jailbreak Lab** | GAH (Londres, nov. 2025) | Grand champion | Bibliothèque d'attaques et **algorithme génétique** qui fait muter les prompts partiellement réussis | Technique éprouvée bien intégrée, évaluation créative | [Holistic AI](https://hackathon.holisticai.com/), [TDS](https://towardsdatascience.com/multi-agent-arena-london-great-agent-hack-2025/) |
| 16 | **HSIA** | GAH, Track C | 1er | Attaque sur un robot VLA : la légende interne passe de « bottle » à « knife » **sans toucher aux pixels** | Surface d'attaque neuve (perception) | idem |
| 17 | **GenAI Explainer** | GAH, Track B (Glass Box) | 3e | Couche d'explicabilité pour FLUX.1 : influence de chaque segment de prompt, traçabilité pour audit de conformité | Auditabilité | idem |
| 18 | **MI5 Agents / ZarksAI** | GAH Track A / Track B | 1er / 1er | Non décrits publiquement | Track A notée sur latence, coût, robustesse aux pannes d'outils, monitoring et empreinte carbone | [Holistic AI](https://hackathon.holisticai.com/) |
| 19 | **Z3r0Trust** (Sentinel 5) | Descope Global MCP Hackathon (2025), thème A2A sécurisé | 2e | Multi-agents qui ingère des alertes **Splunk**, détecte le vol d'identifiants, **suspend des comptes, force la MFA**. Un jeton Descope par agent | Boucle détection → réponse complète, identité par agent | [Descope](https://www.descope.com/blog/post/global-mcp-hackathon-winners) |
| 20 | **AI Fitness Agent** (Confickers) | Descope, thème A2A | 1er | Orchestrateur et agents spécialisés, **JWT à portée limitée entre agents** après un seul login | « Scoped permissions and delegated access », bonne exécution, adoption réaliste | idem |
| 21 | **Sheeter** | Descope, thème MCP sécurisé | 1er | Serveur MCP sur la passerelle Cequence : Google Sheets exposé en API OAuth CRUD | Simplicité, clarté, vitesse | idem |
| 22 | **mcp-security-governance** (H. Hamdard, Inde) | Solo.io MCP & AI Agents Hackathon 2026, track « Secure & Govern MCP » | 1er | Surveille agentgateway et kagent, **note la posture de sécurité des serveurs MCP**, analyse de risque par LLM | Gouvernance MCP | [Solo.io](https://www.solo.io/blog/celebrating-the-winners-of-the-2026-hackathon-for-mcp-ai-agents) |
| 23 | **MCP.STORE** (M. H. Emel, Turquie) | Solo.io 2026 | Runner-up | Authn/authz MCP avec JWT Keycloak et règles CEL **appliquées au niveau protocole** | « Agents cannot bypass security boundaries » | idem |
| 24 | **Assistant0** | DEV × Auth0 for AI Agents Challenge (nov. 2025) | Gagnant | Assistant personnel avec **CIBA** : approbation humaine explicite avant achat ou envoi d'email, Token Vault, FGA | « Sophisticated implementation of CIBA for high-risk operations » | [DEV](https://dev.to/devteam/congrats-to-the-winners-of-the-auth0-for-ai-agents-challenge-2jc8) |
| 25 | **ESG Copilot** | Auth0 Challenge | Gagnant | Agents ESG pour PME, isolation des données par FGA, secrets dans Token Vault | « The full power of Auth0's security stack » | idem |
| 26 | **Mind the Gap** (Holistic AI / UCL) | Kaggle OpenAI gpt-oss-20b Red-Teaming (2025, 600+ soumissions) | Top 10, 50 k$ | Montre qu'un modèle sûr isolément devient exploitable **dans une boucle agent** (67 % de succès dans la boucle, 0 % isolé) | Démonstration chiffrée d'un angle mort systémique | [Holistic AI](https://www.holisticai.com/press-release/holistic-ai-named-top-10-winner-in-openai-gpt-oss-20b-red-teaming-hackathon) |
| 27 | **zardav** (individuel) | UK AISI × Gray Swan Agent Red-Teaming (mars-avr. 2025) | Top 1, 924 cassages | 1,8 M d'attaques, 62 k réussies sur 22 LLM et 44 comportements | Montre que **la robustesse ne suit pas la taille du modèle** : il faut des défenses externes | [Gray Swan](https://www.grayswan.ai/news/uk-aisi-x-gray-swan-agent-red-teaming-challenge-results-snapshot), [arXiv 2507.20526](https://arxiv.org/abs/2507.20526) |
| 28 | **OneRadar** (FPL Technologies / OneCard) | RBI HaRBInger 2024 « Zero Financial Frauds » (finale 4 janv. 2025, Inde) | 1er, 40 lakh INR | FRM (gestion du risque de fraude) avec **humain dans la boucle** : app client d'alerte, modèle de décision, plateforme de revue experte | Fraude évitée, **moins de faux positifs et de latence**. Jury : exhaustivité, innovation, faisabilité, scalabilité, **conformité** | [RBI](https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=59465) |
| 29 | **Satark** (Epifi / Fi Money) | HaRBInger, comptes mules | 1er ex aequo | Empreinte numérique de chaque compte (financière, non financière, appareil, données externes), IA qui signale les mules en temps réel | idem | idem |
| 30 | **Tager AI** (NapID Cybersec) | HaRBInger, comptes mules | 1er ex aequo | « **Loop Tagging** » : suit les transactions **entre banques**, bloque les retraits, sécurise les fonds pour récupération | Traçage et récupération, pas seulement un score | idem |
| 31 | **Xaults** | HaRBInger, anonymat CBDC | 1er | Paiements CBDC quasi-anonymes dans les limites réglementaires (adresses furtives, ZKP) | Vie privée et conformité ensemble | idem |
| 32 | **SafePay QR** (Codewizards, MANIT Bhopal) | Cybersecurity Hackathon Central Bank of India 2025 | 1er runner-up | Classe les QR codes en Sûr / Suspect / Malveillant (transfer learning, **détection de stéganographie**, anomalies comportementales) | Vecteur concret de la fraude UPI | [Gouv. Inde (PDF, hors ligne depuis)](https://financialservices.gov.in/beta/sites/default/files/2025-10/Central-Bank-of-India.pdf) |
| 33 | **VishKill** (Phish'n Chips, NIT Rourkela) | Central Bank of India 2025 | 2e runner-up | Détection temps réel des appels d'arnaque : analyse vocale, émotion, diarisation, LLM | Vishing temps réel | idem |
| 34 | **Team Vijaya** (IIIT Bangalore) / **weAreWinners** (IIIT Delhi) | Bank of India CyberShield 2026 (IIT Hyderabad) | 1er malware / 1er mules | GenAI pour la rétro-ingénierie d'apps frauduleuses ; ML de détection de comptes mules | Critères : **explicabilité**, scalabilité, performance du prototype | [LetsDataScience](https://letsdatascience.com/news/iiit-bangalore-team-takes-two-cybershield-hackathon-prizes-22ad4325) |
| 35 | **Fynalyze** | NEXXT AI Hackathon 2025 (Roumanie, banques) | 2e | **Détection de deepfakes au KYC** (image et voix synthétiques à l'onboarding) | Fraude d'identité générative (non vérifié en détail) | [StartupCafe](https://startupcafe.ro/?p=89179) |
| 36 | **3plus1** | SwissHacks 2025 (Zurich) | Gagnant overall | Validation documentaire intelligente (onboarding Julius Baer) | Douleur métier claire du sponsor | [Tenity](https://www.tenity.com/?p=2731) |
| 37 | **NetiShield** (Neti) | SwissHacks 2025, défi Ripple | Gagnant | Cadre de sécurité pour les transactions RLUSD : anti-fraude et escrow intégrés | Stablecoin et protection du paiement | idem |
| 38 | **FraudFence** (Les Détectives) | SwissHacks 2024, défi deepfake Julius Baer (réf.) | Gagnant | Détection et vérification audio de deepfakes | Précédent direct de la « fraude au président » | [Julius Baer](https://www.juliusbaer.com/en/insights/company-insights/behind-the-scenes/jbswisshacks-2024-making-it-to-show-whos-faking-it/) |
| 39 | **ETHGuardian** | ETHGlobal Agentic Ethereum (2025) | Prix pool Coinbase AgentKit | Jeu : tromper un agent wallet pour vider le faucet (3 niveaux) | Prix sponsor seulement, pas finaliste : le « jailbreak game » ne suffit plus | [ETHGlobal](https://ethglobal.com/showcase/ethguardian-wemic) |
| 40 | **elliot's honey** | AI Tinkerers Paris « Vibe-a-thon » (Station F, 15 nov. 2025) | 3e | **Pot de miel pour agents IA** : détecte les activités malveillantes dans vos agents | Déception appliquée aux agents (non vérifié en détail) | [AI Tinkerers Paris](https://paris.aitinkerers.org/hackathons/h_1aZT6GQ8LvU/results) |
| 41 | **SeeWeedZ** (Suède) | CISPA European Cybersecurity & AI Hackathon Championship, finale (Saarbrücken, juil. 2026) | 1er, 4 k€ | Défis d'IA de confiance : exemples adverses, attribution d'images générées | « Innovative approach and exceptional efficiency ». Leaderboard puis réévaluation sur de plus gros jeux de données | [CISPA](https://cispa.de/en/hackathon-final) |
| 42 | **CAI** (Alias Robotics) | HTB × Palisade « AI vs Human » CTF (2025) | 20e sur 403 équipes | Agent offensif autonome | Les IA résolvent 19/20 défis simples mais calent sur le multi-étapes | [HTB](https://www.hackthebox.com/blog/ai-vs-human-ctf-hack-the-box-results) |
| 43 | **Close AI Tech** | HACK IITK Global Cybersecurity Hackathon 2025 (C3iHub) | 1er track startup | Non décrit (incubé à C3iHub) | Track « startup » séparée : critères business explicites | [IIT Kanpur](https://iitk.ac.in/grand-finale-of-global-cyber-security-hackathon-2025) |
| 44 | **Unrugable** | Colosseum Cypherpunk (Solana Breakpoint 2025) | Grand champion | Wallet matériel natif Solana et app compagnon | Sécurité de l'utilisateur crypto par le matériel | [Solana Compass](https://ee.solanacompass.com/learn/breakpoint-25/winners-of-the-colosseum-cypherpunk-hackathon) |
| 45 | **ARIA** (I. Benguezzou, A. Hnaien, France) | Anthropic « Built with Opus 4.7 » (avr. 2026) | Best use of Managed Agents | 5 agents surveillent des signaux machines (OT) et génèrent des ordres de travail | « You can't prompt your way to knowing what a maintenance technician actually looks at. » | [Claude blog](https://www.claude.com/blog/meet-the-winners-of-built-with-opus-4-7-claude-code-hackathon) |
| 46 | **CrossBeam / PostVisit.ai / Medkit** | Anthropic « Built with Opus 4.6 / 4.7 » (2026) | 1er / 3e / 1er | Permis de construire (avocat), santé (cardiologue), simulation clinique (médecin) | Hors sécurité, mais pattern clé : **4 gagnants sur 5 n'étaient pas développeurs pro**. Medkit a des pilotes signés | [Claude 4.6](https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon), [Claude 4.7](https://www.claude.com/blog/meet-the-winners-of-built-with-opus-4-7-claude-code-hackathon) |
| 47 | **TUESDAY** | Neurobots Hackathon 2026 (Inde) | 1er Cyber (auto-déclaré) | SOC multi-agents 100 % local (Qwen 2.5 / Ollama) | Souveraineté et coût | LinkedIn (non vérifié) |

---

## 2. Patterns récurrents : ce qui impressionne

**P1 — « Montre ta preuve » plutôt que « crois-moi ».** C'est le pattern le plus fort de 2026. Mulder rejette toute conclusion sans artefact. Camel relie chaque finding à une commande. RedAgent vérifie des rapports IA. Le jury de Find Evil n'a départagé sur la profondeur d'investigation **qu'une fois la fabrication écartée** ([GovInfoSecurity](https://www.govinfosecurity.com/cyber-novice-takes-top-prize-in-sans-ai-forensics-contest-a-32662)). C'est directement le critère « fiabilité et contrôle de l'IA » de notre Track 2.

**P2 — L'auto-réfutation, ou l'agent sceptique.** Phase « adversarial challenge » chez Mulder, « Skeptic » chez SIFT++, réfutation des indicateurs plantés chez TRUDI. Les juges citent nommément ces moments (« Self-correction at call 54 is genuine »). Une démo qui montre l'IA **changer d'avis grâce aux preuves** marque les esprits.

**P3 — Garde-fous dans le code, pas dans le prompt.** Leçon officielle de SANS : « Enforce rules in code, not prompts ». Même constat chez Alibaba : « 仅靠系统提示词约束无法完全防住高级攻击 » (les contraintes du system prompt seules ne suffisent pas) ([Aliyun](https://developer.aliyun.com/article/1683561)). Les variantes gagnantes : règles CEL au niveau protocole (MCP.STORE), porte AST (FindEvil), JWT à portée limitée (Descope), CIBA (Auth0), lecture seule et hash de preuve inchangé (SIFT++).

**P4 — Le jury attaque votre projet.** À Find Evil, 1 775 tests d'attaque contre les garde-fous. Au hackathon OpenAI × AI Tinkerers de Varsovie, un **scanner (Agentic Radar) servait d'outil de notation** ([SplxAI](https://splx.ai/blog/openai-aitinkerers-hackathon-agentic-radar-insights)). Chez nous, GitGuardian prévient : « the juries will check » (secrets). Prévoyez que le jury tente une injection ou un `git log -p`.

**P5 — Des métriques sur une vérité terrain publique ou rejouable.** F1 = 1,00 sur M57, 98,6 % de rappel sur 552 attaques, 119/143 artefacts, 14/14 refus destructifs. Côté AIxCC : 54 vulnérabilités sur 63 défis et le **coût par tâche (152 $)** ou par point (181 $). Les gagnants donnent **dénominateur, jeu de test et coût**.

**P6 — L'honnêteté sur les limites rapporte.** SANS : les harness qui documentaient leurs échecs ont mieux scoré que ceux qui annonçaient une précision parfaite. FindEvil a publié deux failles de ses propres garde-fous. C'est cohérent avec notre guide (« voici ce qu'on ne détecte pas encore »).

**P7 — Boucle complète détection → réponse → preuve.** AIxCC notait des **bundles** (bug + preuve + patch) et pénalisait les mauvais patchs. Z3r0Trust suspend le compte et force la MFA. Tager AI bloque et récupère les fonds. OneRadar alerte le client puis fait passer en revue experte. Un score seul ne gagne pas.

**P8 — Identité et délégation d'agent comme primitive.** Jeton par agent, portée limitée, approbation humaine hors bande (CIBA), Token Vault. Les sponsors identité (Descope, Auth0, Solo.io) récompensent ce qui rend l'**autorité traçable**. C'est exactement l'ASI03/ASI07 de notre guide et le cœur de métier de GitGuardian (identités non humaines).

**P9 — Un cadrage conceptuel neuf, même avec une démo modeste.** Omission attacks, Mind the Gap, attaque sur la perception d'un VLA, seuil statistiquement défendable. Les relecteurs saluent un concept « potentially influential » même avec 5 traces seulement.

**P10 — Les profils croisés et les experts métier.** Find Evil : le 1er venait du ML et la 2e de la réponse à incident, chacun a appris l'autre domaine. Anthropic : avocat, cardiologue, médecin, technicien. ARIA : « you can't prompt your way to knowing what a maintenance technician actually looks at ».

**P11 — La sobriété.** Buttercup a gagné avec des LLM non-raisonnants bon marché, sur un laptop. Le track A du GAH notait coût, latence et carbone. TUESDAY tourne en local. Un jury business (Bpifrance) entend « coût par incident ».

---

## 3. Ce qui est devenu banal et ne gagne plus

| Idée banale | Pourquoi elle ne gagne plus | Indices |
|---|---|---|
| **Prompt firewall / filtre de jailbreak** | Marché consolidé (Lakera → Check Point 2025, Prompt Security → SentinelOne). Notre guide le dit noir sur blanc | Guide Track 2 ; [Lakera](https://www.businesswire.com/news/home/20251028168283/en) |
| **Jeu « trompe l'agent » façon Gandalf** | Gandalf existe depuis 2023 (1 M+ de joueurs). ETHGuardian 2025 n'a eu qu'un prix sponsor | [ETHGlobal](https://ethglobal.com/showcase/ethguardian-wemic) |
| **« J'ai ajouté des agents »** (multi-agents pour le principe) | Le projet le plus complexe (17 agents, 9 outils) avait plus de 20 vulnérabilités. 98 % des équipes sans protection au-delà du modèle, 0 % contre l'empoisonnement | [SplxAI](https://splx.ai/blog/openai-aitinkerers-hackathon-agentic-radar-insights) |
| **Copilote SOC qui résume des alertes** sans vérification | Le niveau de 2026, c'est la conclusion prouvée et auto-réfutée (Find Evil). Un résumé sans source = hallucination potentielle | SANS |
| **Classifieur de phishing ou de fraude** sur un dataset Kaggle, avec seulement une accuracy | Pas de réponse, pas de faux positifs mesurés, pas d'intégration. Les gagnants bancaires livrent alerte client, revue humaine, gel ou récupération | RBI, CBI |
| **Détecteur de deepfake seul** | Compétitions mondiales dédiées depuis 2024 (Ant Group, SwissHacks 2024). Ça ne passe qu'**intégré à un flux** (KYC, validation d'un virement) | [Ant Group](https://www.businesswire.com/news/home/20250710179338/en) |
| **Dashboard on-chain « wallet scanner »** | Très répandu à ETHGlobal. Les finalistes 2025 (Cannes) ne sont pas des scanners | [RootData](https://www.rootdata.com/news/309069) |
| **Attaque sans défense** | En blue team, une attaque n'a de valeur que comme générateur de données de test (règle de notre guide) | Guide |

*(La section 3 combine des faits sourcés et une inférence de tendance. La rareté de ces idées parmi les gagnants vérifiés est un indice, pas une preuve.)*

---

## 4. Les 10 projets les plus originaux, et pourquoi

1. **Omission Attacks** (Apart 2026) : inverse la question de la supervision. Le danger n'est pas l'action malveillante mais **l'action manquante**. La réponse, le **monitoring d'invariants d'état final**, se transpose immédiatement à la finance (l'agent « oublie » d'appliquer une limite, un contrôle 4-yeux ou une déclaration).
2. **Protocol SIFT++ « Skeptic »** (SANS) : un second agent qui **rejoue indépendamment** les outils pour réfuter le premier. Il a annulé sa propre détection de rootkit. Réplication scientifique dans un pipeline SOC.
3. **Mulder** (SANS) : le validateur de références d'artefacts transforme « anti-hallucination » d'un vœu en **contrainte vérifiable**. Gagné par un non-spécialiste de la sécu.
4. **Camel** (SANS) : « code-mode ». Au lieu de 50 outils figés, le LLM écrit du code typé dans un sandbox, et chaque conclusion est **traçable jusqu'à la commande**.
5. **Mind the Gap** (Kaggle gpt-oss) : prouve chiffres à l'appui qu'on ne peut pas évaluer la sécurité d'un modèle hors de sa boucle agent (67 % contre 0 %).
6. **HSIA** (GAH) : attaque la **croyance interne** d'un robot sans toucher les pixels. Nouvelle classe de risque pour l'OT et la robotique.
7. **Tager AI** (RBI) : « loop tagging » interbancaire. On passe de « détecter une mule » à **suivre l'argent entre établissements et le récupérer**. C'est la réponse, pas juste la détection.
8. **elliot's honey** (Paris 2025) : la **déception** (honeypot), vieille arme du blue team, appliquée aux agents IA. Peu exploré.
9. **Team IIT** (Control Hackathon 2026) : le **seuil d'alerte statistiquement défendable**. Répond exactement à « si votre modèle se trompe, qui est responsable ? » devant un régulateur.
10. **SafePay QR** (Central Bank of India) : détecte la **stéganographie dans les QR codes** de paiement, un vecteur de fraude du quotidien que personne ne regarde en Europe.

Mentions : **RedAgent** (une IA qui audite les rapports d'IA), **Jailbreak Lab** (algorithme génétique, une technique ancienne bien employée), **Xaults** (vie privée CBDC et conformité via ZKP).

---

## 5. Projets devenus produits ou startups (ou en passe de l'être)

| Origine | Devenir | Source |
|---|---|---|
| **Gandalf**, hackathon interne Lakera (2023), duel blue team / red team autour d'un mot de passe | 1 M+ de joueurs, 80 M de points de données. **Lakera rachetée par Check Point (2025)**. Déclinaison « Agent Breaker » | [Lakera](https://www.lakera.ai/news/gandalf-new-ui-and-enhanced-ai-security-education), [BusinessWire](https://www.businesswire.com/news/home/20251028168283/en) |
| **AIxCC** (Team Atlanta) | Atlantis porté dans **OSS-CRS**, projet sandbox OpenSSF. DARPA/ARPA-H ajoutent 1,4 M$ pour l'intégration dans les infrastructures critiques | [Georgia Tech](https://news.research.gatech.edu/2026/04/21/competition-community-how-team-atlantas-ai-cybersecurity-breakthrough-going-open-source), [DARPA](https://www.darpa.mil/news/2025/aixcc-results) |
| **AIxCC** (équipe Berkeley) | Co-fondateur de **MindFort** (agents qui détectent et patchent), soutenu par Y Combinator | [Berkeley CLTC](https://cltc.berkeley.edu/?p=22303) |
| **AIxCC** (ASU, Wil Gibbs) | Spinout cybersécurité à 1,5 M$ | [ASU](https://scai.engineering.asu.edu/tag/students/) |
| **Find Evil!** (5 harness) | **Préinstallés dans la SANS SIFT Workstation**, utilisée par les répondants du monde entier | [SANS](https://www.sans.org/press/announcements/sans-names-the-five-winners-of-find-evil-2026) |
| **Medkit** (Anthropic 4.7) | Pilotes avec 3 facultés de médecine et un labo pharma | [Claude blog](https://www.claude.com/blog/meet-the-winners-of-built-with-opus-4-7-claude-code-hackathon) |
| **HACK IITK** (track startup) | Lauréats incubés à C3iHub (IIT Kanpur) | [IITK](https://iitk.ac.in/grand-finale-of-global-cyber-security-hackathon-2025) |
| **Aviel Intelligence** (pitch Money20/20 Europe) | Fournit en temps réel des milliers de **comptes mules** aux banques britanniques | [Fintech Times](https://thefintechtimes.com/money20-20-europe-2025-what-happened-on-day-two) |

Leçon : les trajectoires vers le produit passent par **l'open source adopté par une communauté** (AIxCC, SIFT), **un jeu viral qui génère des données** (Gandalf) ou **des pilotes signés avec des experts métier** (Medkit). Le pitch « startup » seul ne suffit pas.

---

## 6. Couverture et trous (honnêteté)

- **Bien couverts** : USA (DARPA, SANS, Anthropic, Pear, GitLab, PANW, Kaggle/OpenAI, Gray Swan/AISI), UK (GAH, AISI), Inde (RBI, banques publiques, IITK), Suisse (SwissHacks), Europe académique (CISPA).
- **Faiblement couverts (peu de résultats publiés en ligne)** : **Chine**. Le défi « AI安全 » d'Alibaba (sept. 2025, 3 000 inscrits, 10 000 rapports) publie surtout des leçons d'attaque : 70 % des jailbreaks en jeu de rôle, attaque « nothink » ([Aliyun](https://developer.aliyun.com/article/1683561)). Pas de liste de gagnants défensifs trouvée pour GEEKCON 2025 ni pour Ant Group 2025. **Israël** : Cyber Week déc. 2025, pas de gagnants publiés ; le hackathon AI Tinkerers Tel Aviv (Zenity) montre plusieurs projets anti-injection, sans palmarès ([Zenity](https://zenity.io/blog/sparking-the-future-of-ai-security)). **Moyen-Orient** : rien de probant (CTF KSU/NCA, hackathons gouvernementaux non cyber). **Singapour** : Hackcelerator MAS 2025 sur le thème « AI for financial services » (ActuaViz, Claimsio, Oxford Risk), sans gagnant fraude ([MAS](https://www.mas.gov.sg/news/media-releases/2025/mas-and-sfa-announce-fintech-award-winners-at-singapore-fintech-festival-2025)) ; « AI Aunty » (OGP Hack for Public Good 2025) fait perdre leur temps aux arnaqueurs avec un agent vocal, rang inconnu. **Junction, HackZurich, TreeHacks, CalHacks, HackMIT** : pas de gagnant cyber identifié (TreeHacks 2025 : Hawkwatch, surveillance vidéo physique). **Avalanche Team1** : pas de palmarès sécurité trouvé. **NATO Innovation Challenge 2025** : thèmes non cyber.
- **À vérifier sur place** : Team IIT, TUESDAY, Fynalyze (sources secondaires).

---

## 7. Leçons transposables à Secure Horizons (jury GitGuardian, KPMG, Avalanche, Bpifrance)

### 7.1 Ce que chaque juré cherchera (inférence à partir des patterns et du guide)
- **GitGuardian** : zéro secret (faire passer `ggshield`/gitleaks **sur tout l'historique**, montrer le résultat propre), identités non humaines inventoriées, **jetons courts et révocables par agent**, supervision de la couche outils. Un projet du type Z3r0Trust, MCP.STORE ou Assistant0 parle leur langue.
- **KPMG** : traçabilité « auditeur-ready » (P1, P3), seuils défendables (Team IIT), mapping DORA / NIS2 / AI Act, et la réponse à « qui est responsable si le modèle se trompe ». OneRadar a gagné sur l'humain dans la boucle et la baisse des faux positifs.
- **Avalanche** : quelque chose de **réel sur Fuji** (contrat déployé, pause, traçage des fonds, à la Tager AI). Pas un scanner de wallet de plus.
- **Bpifrance** : un acheteur nommé, un coût par incident (Buttercup : 181 $ par point), un chemin vers des pilotes (Medkit) ou un modèle open-core (AIxCC, SIFT).

### 7.2 Dix règles concrètes
1. **Chaque alerte a sa preuve** : lien vers la ligne de log, le hash de transaction ou l'appel d'outil d'origine. Un validateur bloque toute conclusion sans référence (à la Mulder). À montrer en démo.
2. **Ajouter un « Sceptique »** : un second passage qui rejoue et tente de réfuter avant d'escalader. Montrer **un cas où il annule une fausse alerte** : ça raconte la réduction des faux positifs (30 % de la note en Track 1 et 2).
3. **Contrôles dans le code** : moteur de politiques, jetons à portée limitée, kill switch, lecture seule. Dire en pitch : « rien de ceci ne dépend d'un prompt ».
4. **Inviter le jury à attaquer** : bouton « essayez d'injecter notre agent » ou document piégé prêt. Afficher en direct le blocage et le hash de preuve inchangé.
5. **Postcondition monitoring** (idée la plus transposable) : vérifier les **invariants d'état final** d'un agent financier (plafond respecté, 4-yeux appliqué, bénéficiaire autorisé, déclaration DORA émise). Ça attrape aussi les attaques par omission, que presque personne ne traite.
6. **Métriques sur un jeu rejouable et publié** : précision, rappel, taux de faux positifs, MTTD/MTTR, coût par incident, avec le dénominateur. Exemple : « 48 scénarios rejoués, 2 ratés, voici lesquels ».
7. **Une slide « ce qu'on ne détecte pas »** avec 2 ou 3 limites précises. C'est un gain prouvé (SANS), pas un aveu.
8. **Cadrage neuf en une phrase**, le samedi midi, du style « l'attaque, c'est ce que l'agent n'a pas fait » ou « un pot de miel pour agents financiers ». Il faut que ça puisse être répété par un juré en délibération.
9. **Boucle complète** : détection → réponse graduée (step-up, hold, gel, pause du contrat) → evidence pack (journal infalsifiable, mapping ATT&CK/ATLAS/OWASP ASI). Pas de score orphelin.
10. **Démo de 3 min calquée sur les gagnants** : 20 s de menace réelle chiffrée → attaque live → détection avec sa preuve → le Sceptique confirme ou annule → réponse automatique et validation humaine → evidence pack exporté → un chiffre final (FP évités, minutes gagnées, € protégés). Vidéo de secours prête.

### 7.3 Pièges à éviter
- Un énième filtre de prompt ou un jeu de jailbreak.
- Une démo uniquement offensive.
- « 99 % d'accuracy » sans jeu de test ni taux de faux positifs.
- Dix agents là où deux suffisent (chaque agent est une surface d'attaque).
- Un secret dans l'historique Git (vérification annoncée par le jury).

---

## Sources principales
- DARPA AIxCC : https://www.darpa.mil/news/2025/aixcc-results · Trail of Bits : https://blog.trailofbits.com/2025/08/09/trail-of-bits-buttercup-wins-2nd-place-in-aixcc-challenge/ · Georgia Tech OSS-CRS : https://news.research.gatech.edu/2026/04/21/competition-community-how-team-atlantas-ai-cybersecurity-breakthrough-going-open-source
- SANS Find Evil! : https://www.sans.org/press/announcements/sans-names-the-five-winners-of-find-evil-2026 · https://www.govinfosecurity.com/cyber-novice-takes-top-prize-in-sans-ai-forensics-contest-a-32662
- Apart Research : https://www.apartresearch.com/sprints/projects/omission-attacks-when-doing-nothing-is-the-attack-0y1v · Horizon Omega : https://horizonomega.substack.com/p/ai-control-hackathon-2026-retrospective
- Gray Swan / UK AISI : https://www.grayswan.ai/news/uk-aisi-x-gray-swan-agent-red-teaming-challenge-results-snapshot · https://arxiv.org/abs/2507.20526
- Great Agent Hack : https://hackathon.holisticai.com/ · https://towardsdatascience.com/multi-agent-arena-london-great-agent-hack-2025/
- Kaggle gpt-oss (Holistic AI) : https://www.holisticai.com/press-release/holistic-ai-named-top-10-winner-in-openai-gpt-oss-20b-red-teaming-hackathon
- Pear × Anthropic : https://pear.vc/pear-x-anthropic-hackathon/ · Anthropic 4.6 : https://claude.com/blog/meet-the-winners-of-our-built-with-opus-4-6-claude-code-hackathon · Anthropic 4.7 : https://www.claude.com/blog/meet-the-winners-of-built-with-opus-4-7-claude-code-hackathon
- GitLab AI Hackathon : https://thenote.app/post/en/gitlab-ai-hackathon-2026-meet-the-winners-cmfz3ggqkb · Palo Alto : https://jobs.paloaltonetworks.com/en/safecontext-ai-hackathon-winner-palo-alto-networks
- Descope MCP : https://www.descope.com/blog/post/global-mcp-hackathon-winners · Solo.io : https://www.solo.io/blog/celebrating-the-winners-of-the-2026-hackathon-for-mcp-ai-agents · Auth0/DEV : https://dev.to/devteam/congrats-to-the-winners-of-the-auth0-for-ai-agents-challenge-2jc8
- SplxAI (jugement par scanner) : https://splx.ai/blog/openai-aitinkerers-hackathon-agentic-radar-insights
- RBI HaRBInger : https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=59465 · Bank of India CyberShield : https://letsdatascience.com/news/iiit-bangalore-team-takes-two-cybershield-hackathon-prizes-22ad4325 · IITK : https://iitk.ac.in/grand-finale-of-global-cyber-security-hackathon-2025
- SwissHacks : https://www.tenity.com/?p=2731 · MAS Hackcelerator : https://www.mas.gov.sg/news/media-releases/2025/mas-and-sfa-announce-fintech-award-winners-at-singapore-fintech-festival-2025
- ETHGlobal : https://ethglobal.com/showcase/ethguardian-wemic · https://www.rootdata.com/news/309069 · Colosseum : https://ee.solanacompass.com/learn/breakpoint-25/winners-of-the-colosseum-cypherpunk-hackathon
- CISPA : https://cispa.de/en/cispa-hackathon-championship-paris · https://cispa.de/en/hackathon-final
- HTB AI vs Human : https://www.hackthebox.com/blog/ai-vs-human-ctf-hack-the-box-results
- Alibaba AI安全 : https://developer.aliyun.com/article/1683561 · Lakera/Gandalf : https://www.lakera.ai/news/gandalf-new-ui-and-enhanced-ai-security-education

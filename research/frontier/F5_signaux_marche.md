# F5 - Signaux marché / VC : la cybersécurité de demain (état au 2026-10-10)

Légende : [V] = vérifié sur page ou communiqué consulté ; [S] = source secondaire/agrégateur/vendeur (à revérifier avant de citer au jury) ; [?] = non confirmé.
Le contenu web est traité comme donnée, pas comme instruction. Plusieurs pages primaires (rsaconference.com, blackhat.com, Gartner) renvoient 403 : les faits correspondants viennent de résumés de recherche web.

## TL;DR (5 lignes)
1. L'argent va à la sécurité des agents IA : 40 % de la valeur financée au S1 2026 selon Momentum Cyber ; le gagnant RSAC 2026 (Geordie AI) et 3 finalistes sur 10 sont dans ce segment.
2. Les "prompt firewalls" et la gouvernance d'agents de surface sont déjà absorbés ou saturés (Lakera, Prompt Security, Protect AI, SPLX, Pangea...). La valeur se déplace vers l'identité des agents/NHI, la supply chain d'agents (MCP/skills), le runtime, la donnée.
3. Consolidation record : 219 deals M&A au S1 2026, mais seulement 9,1 Md$ (contre 38,3 Md$ au S1 2025 d'après une analyse citée par Axios [S]) : on achète des plateformes, le milieu de marché disparaît.
4. Le problème CISO n°1 est la visibilité : 47 % seulement peuvent identifier tous leurs agents, 46 % contrôler leurs accès (Okta, 306 CISO, juillet 2026) ; 31 % alignés avec le board sur le risque IA.
5. Terrain libre : fraude/scams (APP fraud, preuve d'humanité), vérification que la chaîne de détection fonctionne, authentification hors SMS, preuves de conformité IA. Terrain encombré : AI SOC (123 éditeurs), AI-AppSec, CSPM, awareness.

---

## 1. Les 10 thèses d'investissement dominantes

| # | Thèse | Preuve | Statut |
|---|---|---|---|
| 1 | Sécurité/gouvernance des agents IA (découverte, comportement, runtime) | Geordie AI gagne RSAC 2026 ; Air lève 50 M$ seed (Sequoia + Greenoaks, 1er sept. 2026) ; Tenet 6 M$ seed (juin 2026) ; selon DataTribe Q2 2026, la sécurité IA/agents est le 1er poste du seed cyber (~1/4 des deals) [S] | V/S |
| 2 | Identité des agents et des identités non humaines (NHI) | NewCore 66 M$ seed (Cyberstarts, Index) ; Token Security finaliste RSAC ; rachats SailPoint-Entro (~200 M$), 1Password-Apono (250-300 M$), Cisco-Astrix, Palo Alto-CyberArk (~25 Md$) | V/S |
| 3 | Consolidation en plateformes (acheter une architecture, pas une feature) | Momentum Cyber S1 2026 : 219 deals, "sous-échelle ou indifférencié perd du terrain" ; Google-Wiz (32 Md$) clos en mars 2026 | V |
| 4 | SOC autonome / AI SOC agents | Gartner Hype Cycle Security Ops 2026 : AI SOC agents au pic des attentes, 1-5 % de pénétration [S] ; Databricks-Panther ; mais 123 éditeurs (KuppingerCole) | S |
| 5 | Sécurité offensive autonome / red team IA | Novee (51,5 M$, fondée mai 2025, YL Ventures) ; YC S26 : Fabraix, Trident ; YC W26 : Hex Security ; Escape (Paris, 18 M$ Série A) | S |
| 6 | Sécurité de la donnée à l'ère des agents (DSPM, accès des agents aux données) | Veeam-Securiti 1,725 Md$ ; Zscaler-Symmetry ; Cyera 600 M$ à 12 Md$ de valorisation (juin 2026) ; Knostic finaliste RSAC 2025 | V/S |
| 7 | Couche humaine : deepfake, voix clonée, scams, social engineering temps réel | Humanix et Charm Security finalistes RSAC 2026 ; RFS YC automne 2026 "Proving You're Human" ; Okta : 61 % citent le phishing IA et 45 % le contournement d'authentification par deepfake | V |
| 8 | Supply chain logicielle et d'agents (MCP, plugins, skills, build provenance) | Air ; Crash Override (finaliste) ; Gartner AppSec 2026 : "MCP Cybersecurity" nouvelle entrée, Guardian Agents <1 % d'adoption [S] | S |
| 9 | Résilience de la chaîne de détection ("les contrôles marchent-ils vraiment ?") et exposure management | Fig Security finaliste 2026 ; Accenture rachète Dragos + NetRise + runZero (4,175 Md$, 1er deal >1 Md$ de 2026) | V |
| 10 | Gouvernance IA vérifiable et conformité continue | EQTY Lab (finaliste 2025, preuves cryptographiques), Clearly AI (finaliste 2026) ; Wavestone : chiffrement avancé, post-quantique, confiance comme différenciateurs (Zama 49 M€) | V |

Contexte financier : 383 deals / 7,5 Md$ au S1 2026, dont 40 % pour l'AI Security (PDF Momentum Cyber, via résumé [S]) ; Crunchbase : 10,6 Md$ pour sécurité+privacy au S1, T2 en baisse d'environ 30 % vs T1 ; Pinpoint 2025 : 13,97 Md$ sur 392 tours (contre 9,5 Md$ en 2024). J.P. Morgan : 72 % des deals US cyber jusqu'en mai 2026 impliquent une société "AI-enabled" [S].

Lecture de la crise de différenciation : Trace3 (Black Hat 2026) note que les messages des startups sont "remarquablement homogènes" et que les nouveaux entrants se placent en "force multiplier" au-dessus des plateformes en place (identity governance, SIEM, EDR) plutôt qu'en remplacement.

## 2. Catégories émergentes encore sans leader clair

Inférences à partir des signaux ; aucune source ne les désigne comme "sans leader" (à traiter comme hypothèses).
1. **Preuve d'humanité / authenticité de l'interlocuteur** (appel, message, transaction) : RFS YC automne 2026 le met en avant ; Glide Identity (SIM) et Humanix sont des angles partiels.
2. **Fraude par autorisation de la victime (APP scams)** en temps réel, côté banque/credit union : Charm Security, début de marché.
3. **Révocation et autorité des agents** (tokens de tâche courts, chaîne d'autorité, kill switch). Okta : seuls 26 % révoquent l'accès d'un agent en quelques minutes, 55 % "en heures". Aucun standard dominant.
4. **Investigation/forensique d'incidents d'agents** : Sygnia (2026) : seul un tiers des organisations pensent pouvoir enquêter sur une attaque d'agent [S] ; les playbooks IR ne couvrent pas les chaînes d'outils autonomes.
5. **Preuves de conformité IA infalsifiables** (journaux, evidence pack AI Act/ISO 42001) : AI Act haut risque reporté à déc. 2027 donne du temps ; assureurs qui excluent l'IA non contrôlée créent la demande (cf. guide hackathon).
6. **Validation continue de la chaîne de détection** (Fig Security) : peu d'acteurs.
7. **Sécurité de la couche mobile/voix** : Trace3 note que les défenses centrées email la manquent [S].
8. **Évaluation indépendante des agents SOC** (benchmarks, preuves de fiabilité) : Gartner : 70 % des grands SOC piloteront des agents IA d'ici 2028, 15 % obtiendront des gains mesurables sans évaluation structurée [S].
9. **Cryptographie de confiance/post-quantique pour la donnée** : positionnement français (Zama).

## 3. Catégories saturées ou déjà absorbées (à ÉVITER)

- **Prompt firewall / filtre de prompt / garde-fous LLM génériques** : Lakera -> Check Point (~300 M$, estimé, clos 22 oct. 2025) ; Prompt Security -> SentinelOne (clos 5 sept. 2025 ; 133,6 M$ cash + actions selon dépôt SEC, ~250 M$ selon Dark Reading) ; Protect AI -> Palo Alto, Robust Intelligence -> Cisco, Pangea -> CrowdStrike, SPLX -> Zscaler (liste Trace3) ; Virtue AI -> Fortinet (août 2026). Le guide hackathon le dit aussi.
- **Plateformes "agentic SOC"** : "une douzaine" quasi indiscernables (Trace3), 123 éditeurs AI SOC (KuppingerCole), au pic des attentes Gartner. Un copilote SOC générique ne se distinguera pas ; seul un angle de fiabilité mesurée peut le faire.
- **Outils ponctuels AI security** : monitoring de prompts, red teaming de modèles, AI posture management, agent governance générique (Trace3 : "congestionnés, consolidation à venir").
- **CSPM/CNAPP/CWPP** : milieu de marché vidé, les grands bundlent (Windsor Drake T1 2026 [S]). Le déficit de VC apparent sur CSPM n'est pas une opportunité mais un verrouillage par les incumbents.
- **AI-AppSec "scan + autofix par LLM"** : ZeroPath est un finaliste de talent, mais c'est un segment très disputé (jugement personnel).
- **Sensibilisation/awareness, GRC générique, gestion de vulnérabilités classique** : déjà les cinq catégories les plus peuplées en France (Wavestone radar 2026) avec 105 nouveaux entrants dopés au "vibe coding".
- **Pare-feu réseau** : verrou d'incumbents.

## 4. Problèmes que les CISO disent ne pas savoir résoudre (enquêtes 2026)

Toutes les enquêtes sont sponsorisées par des vendeurs, tailles d'échantillon modestes.
- **Visibilité sur les identités IA** : barrière n°1 (48 %) ; 47 % identifient tous leurs agents, 46 % contrôlent ce qu'ils touchent, 45 % autorisent chaque appel d'outil selon le contexte ; 21 % gèrent les agents par comptes partagés ou de service très permissifs ; 20 % en ad hoc ; 81 % craignent l'accès excessif non revu. Okta, 306 CISO (UK, JP, US, FR, CA, DE), publié le 29 juil. 2026 [V] https://www.okta.com/newsroom/articles/global-ciso-insights-2026/
- **Visibilité globale sur l'IA** : 0 CISO sur 300 déclare une visibilité complète, 66 % partielle (Pentera, via Kiteworks) [S].
- **Détecter/contenir un agent compromis** : CSA (285 dirigeants) : 92 % sans visibilité complète sur leurs identités IA, 95 % incapables de détecter/contenir un agent compromis, 16 % gouvernent efficacement les accès [S, chiffres à revérifier à la source CSA].
- **Enquêter sur une attaque d'agent** : un tiers seulement (Sygnia 2026) [S].
- **Shadow AI** : 68 % constatent de l'usage non sanctionné (Okta) [V].
- **Alignement avec le board** : 31 % pleinement alignés sur le risque IA acceptable (12 % aux US) ; pénurie de budget/effectifs 39 % ; silos IA/sécurité 33 % (Okta) [V].
- **Confiance dans l'automatisation du SOC** : 84 % jugent que les agents devraient traiter le L1, 22 % seulement sont prêts à automatiser des tâches L1 de base (Strike48, 100 CISO) [S].
- **Menaces redoutées** : phishing IA 61 %, agents malveillants 49 %, deepfake contre authentification 45 % (Okta) [V].
- **Budgets** : 69 % des CISO font de l'IA pour la sécurité la première priorité de budget net nouveau (IANS/Artico), alors que les budgets totaux stagnent [S].

## 5. Dix startups très jeunes au positionnement original

Dates de fondation rarement confirmées ([?]) ; tous les faits ci-dessous viennent de pages ou résumés cités en fin de document.

1. **Geordie AI** (Londres, gagnant RSAC 2026) : plateforme de gouvernance et de sécurité pour agents autonomes : découverte d'agents, observabilité comportementale, mitigation en temps réel. Original : traite l'"empreinte agentique" comme un inventaire à gouverner, avant de la filtrer. [V/S]
2. **Charm Security** (New York, finaliste 2026) : IA agentique + psychologie comportementale pour stopper les arnaques à paiement autorisé avant le virement, premier marché : credit unions. Original : défend la victime autorisée, pas le compte. [S]
3. **Fig Security** (NY/Tel Aviv, finaliste 2026) : cartographie et valide en continu les flux de détection/réponse du SecOps pour trouver les échecs silencieux. Original : sécurise la sécurité (angles morts du SIEM/SOAR). [S]
4. **Glide Identity** (SF/Tel Aviv, finaliste 2026) : remplace les OTP SMS par une authentification cryptographique ancrée dans la SIM, partenariats opérateurs (T-Mobile, Verizon). Original : s'appuie sur le réseau télécom comme racine de confiance. [S]
5. **Tenet Security** (émergée juin 2026, 6 M$ seed) : simulation côté agent qui prédit les actions probables avant exécution et bloque les chemins malveillants ou coûteux. Original : prévention a priori, pas filtrage de sortie. Fondateurs anciens de l'unité 8200 et de Cisco AI Defense [S].
6. **Air** (émergée 1er sept. 2026, 50 M$ seed, Sequoia/Greenoaks) : pare-feu en ligne pour la supply chain des agents (skills, plugins, serveurs MCP), traçage des workflows dépendants, révocation, place de marché de modules pré-validés. Original : traite le MCP comme une chaîne d'approvisionnement. Directement pertinent pour la track 2 [V].
7. **Clawvisor** (YC P2026) : open source, l'utilisateur approuve une tâche une fois, l'outil l'applique à chaque requête et l'agent ne voit jamais les identifiants. Original : autorisation par tâche, secrets hors de portée de l'agent [S].
8. **BeeSafe** (YC W26) : agents IA "infiltrés" qui engagent les attaquants pour recueillir du renseignement, d'abord en crime financier (fraude, blanchiment). Original : inverse le rapport de force (déception offensive côté défense) [S].
9. **Crash Override** (NY, finaliste 2026) : capture de métadonnées de build dans le CI/CD (outils open source Chalk, génération SBOM) pour la visibilité supply chain. Original : provenance prise à la source plutôt que scan a posteriori [S].
10. **NewCore** (émergée juin 2026, seed 66 M$ à ~300 M$ de valorisation, Cyberstarts, Index) : gère identités humaines et agents dans un système unique. Original : unification de l'IAM humain/agent plutôt que produit NHI séparé ; échelle de seed inhabituelle [S].

Mentions : Novee (red team IA autonome, fondée mai 2025), Twine Security (employés numériques IAM, finaliste 2025), Opnova (gagnant Black Hat Global Startup Spotlight 2026 ; automatisation IT/gestion d'identité pour banques US, 5 M$ pre-seed, chiffres déclarés par l'entreprise [S]), Qevlar (Paris, Série A 30 M$, investigation d'alertes agentique).

## Éléments européens et français

- Radar Wavestone/Bpifrance 2026 (juin 2025-mai 2026, présenté à VivaTech) [V] : 234 startups (105 nouvelles entrées, contre 44), 43 scale-ups (en baisse de 3), 304 M€ levés (contre 289 M€) en 36 tours (contre 19), 2 licornes, plus gros tours : Filigran 50 M€, GitGuardian 50 M€, Zama 49 M€ ; aucun tour >100 M€ depuis Ledger en 2023 ; ~70 % des startups intègrent de l'IA (53 % un an avant) ; 22 acteurs en "Securing AI" (15 en 2025, 11 en 2024) ; plus de la moitié ont moins de 5 salariés ; 49 sorties du radar dont 8 rachats (8 sur 9 par groupes français).
- Lecture : beaucoup de créations, peu de passage à l'échelle ("plafond de verre"). Les angles de différenciation français cités sont le chiffrement avancé, le post-quantique, la protection de la donnée sensible et l'infrastructure de confiance. Un jury Bpifrance sera sensible à la viabilité business et à l'échelle.
- Sources : https://www.lemondeinformatique.fr/actualites/lire-la-dynamique-des-start-ups-en-cybersecurite-s-accelere-en-france-en-2026-100555.html ; https://www.wavestone.com/en/insight/2026-french-cybersecurity-startup-radar/

## Ce qu'il faut en retenir pour le positionnement de l'équipe

- Les rachats montrent que les grands achètent des capacités (runtime, identité d'agent, donnée), pas des produits isolés : présenter son PoC comme un composant d'une plateforme existante (SIEM, IAM, passerelle MCP) augmente la crédibilité plutôt que de promettre une plateforme.
- Éviter : filtre de prompt, copilote SOC générique, scanner AppSec LLM.
- Viser : identité/autorité d'agent avec révocation mesurée (temps de révocation, taux de blocage), supervision de la supply chain MCP, preuves infalsifiables de décisions d'agent, ou fraude/arnaques côté victime. Chacun se mesure (détection, faux positifs, délai de révocation), ce qui compte pour les critères des tracks.
- Limite : les "gaps sans leader" ci-dessus sont des inférences, pas des constats d'analystes.

## Lacunes de recherche

- Rapports Pinpoint S1 2026 : introuvables (dernier : rapport annuel 2025).
- Black Hat USA 2026 Startup Spotlight : les quatre finalistes ne sont pas identifiés ; Opnova est annoncé gagnant du Global (communiqué du 11 août 2026).
- Gartner Hype Cycle for Security 2026 lui-même : non consulté ; seules des synthèses de vendeurs (Dropzone, Prophet, NeuralTrust, NHI Mgmt Group). Aucune thèse "Requests for Startups" de a16z, Sequoia, Greylock, Cyberstarts, Team8, YL Ventures trouvée en source primaire ; seul le RFS YC automne 2026 a été lu. Team8 a lancé un nouveau fonds en invoquant l'IA générative et agentique [S].
- Y Combinator 2025 : listes détaillées non revues ; seuls W26, P26 et S26 partiellement.

## Sources
- RSAC 2026 (gagnant et finalistes) : https://zeltser.com/media/rsac-2026-sandbox ; https://www.rsaconference.com/library/press-release/finalists-announced-for-rsac-innovation-sandbox-contest-2026 (403) ; https://darkreading.com/cybersecurity-operations/ai-dominates-rsac-innovation-sandbox (403)
- RSAC 2025 : https://expertinsights.com/news/rsac-2025-innovation-sandbox-finalists
- Black Hat : https://blackhat.com/html/press/2026-08-11.html (403, via résumé) ; https://econews.pt/2026/08/14/opnova-ia-wins-black-hat-global-startup-contest/ ; https://blog.trace3.com/signals-in-startup-city-black-hat-2026s-breakout-trends
- Momentum Cyber S1 2026 : https://momentumcyber.com/momentum-cyber-mid-year-2026-review-cybersecurity-ma-on-track-for-highest-deal/ ; https://momentumcyber.com/wp-content/uploads/2026/07/Momentum-Cyber-Cybersecurity-Market-Review-H1-2026.pdf
- M&A 2026 : https://www.securityweek.com/cybersecurity-ma-roundup-37-deals-announced-in-june-2026/ ; https://www.securityweek.com/cybersecurity-ma-roundup-26-deals-announced-in-may-2026/ ; https://www.crnasia.com/news-network/2026/palo-alto-networks-completes-25b-acquisition-of-cyberark-for-identity-security-push ; https://www.sec.gov/Archives/edgar/data/0001327567/000132756726000015/panw-20260430.htm ; https://www.csoonline.com/article/4058653/check-point-acquires-lakera-to-build-a-unified-ai-security-stack.html ; https://www.sentinelone.com/press/sentinelone-to-acquire-prompt-security/ ; https://cyberscoop.com/veeam-securiti-ai-acquisition/
- Y Combinator : https://www.ycombinator.com/rfs ; https://ycombinator.com/companies/industry/security
- Startups jeunes : https://dealroom.co/news/148163/air-raises-50m-seed-to-build-a-firewall-for-ai-agents ; https://dealroom.co/news/134733-newcore-emerges-from-stealth-with-66m-seed-to-give-ai-agents-identities/ ; https://aiweekly.co/node/3137 ; https://seedtable.com/companies/novee-security/funding-rounds/seed-2026-01
- Enquêtes CISO : https://www.okta.com/newsroom/articles/global-ciso-insights-2026/ ; https://www.kiteworks.com/cybersecurity-risk-management/ai-visibility-governance-problem/ ; https://aiweekly.co/alerts/sygnia-73-of-cisos-unprepared-for-ai-agent-attacks ; https://www.strike48.com/2026-state-of-agentic-security
- Gartner (secondaire) : https://www.dropzone.ai/blog/gartner-hype-cycle-security-operations-2026 ; https://www.helpnetsecurity.com/2026/09/09/prophet-security-evaluating-ai-soc-agents/ ; https://neuraltrust.ai/news/gartner-hype-cycle-for-application-security-2026 ; https://www.helpnetsecurity.com/2025/10/23/gartner-2026-technology-trends/
- Saturation : https://www.kuppingercole.com/blog/gardiner/123-ai-soc-vendors ; https://windsordrake.com/cloud-security-cspm-cwpp-valuation/ ; https://softwarestrategiesblog.com/2026/04/08/top-10-security-categories-where-vc-funding-trails-gartners-2026-growth-forecast-crunchbase-data/
- France : https://www.wavestone.com/wp-content/uploads/2026/06/radar-des-startups-cybersecurite-francaises-2026-wavestone.pdf ; https://www.frenchweb.fr/sekoia-leve-26-millions-deuros-pour-automatiser-la-reponse-aux-menaces-liees-a-lia/453185

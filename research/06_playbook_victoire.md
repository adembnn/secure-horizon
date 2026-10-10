# 06 — Playbook victoire : hackathon cyber ESSEC Cergy (10-11 oct. 2026)

> Équipe : Adem (tech, orchestration d'agents IA) + Titouan (business, pitch). 36 h, ~150 builders.
> Jury mixte : GitGuardian (secrets/AppSec), KPMG (risque, conformité, audit), Avalanche Team1 + Kryptosphere (web3), Bpifrance (financement, souveraineté), ESSEC MetaLab / Alumni / UTOPIA (business, impact).
> Date de rédaction : 10/10/2026. Niveau de confiance indiqué quand une info n'est pas vérifiée par une source primaire.

---

## TL;DR (à relire avant chaque jalon)

1. **Un seul flux qui marche de bout en bout** > dix fonctionnalités à moitié faites. Le jury retient la démo.
2. **Format gagnant cyber/IA : "attaque live → défense live → preuve chiffrée"**. Le jury doit *voir* l'attaque réussir, puis échouer grâce à vous.
3. **Démo visible en < 90 s** après le début du pitch. Problème ressenti d'abord, techno ensuite.
4. **Double langage** : chaque slide a une phrase "tech" (comment) et une phrase "business" (qui paie, pourquoi maintenant : NIS2 / DORA / AI Act).
5. **Feature freeze à H+24**, pitch répété ≥ 5 fois chronométré, **vidéo démo backup** enregistrée avant H+32.
6. **Honnêteté sur ce qui est mocké** : les juges le détectent, l'admettre se lit comme de la confiance.

---

## 1. Patterns des projets gagnants en cyber / IA

### 1.1 Ce que les jurys récompensent (critères observés)
- ETHGlobal (ex. Agentic Ethereum) note sur **Technicality, Originality, Practicality, Usability, "WOW factor"** ; "Practicality" = *est-ce utilisable aujourd'hui par la cible ?* ([ETHGlobal](https://ethglobal.com/events/agents/info/details)).
- ETHBerlin pondère différemment selon le profil de juge : juges tech → Technicality 1 / Originality 0,75 / Wow 0,75 / Practicality 0,25 ([DoD — How to hack ETHBerlin³](https://blog.dod.ngo/how-to-hack-ethberlin3-2)). **Implication : avec un jury mixte, il faut gagner sur les deux axes, pas seulement sur la profondeur technique.**
- Devfolio : Technicality = "fonctionnel et justifie la durée du hackathon" ; Practicality = "utile et accessible" ([Devfolio judging](https://guide.devfolio.co/docs/guide/judging)).
- Synthèse praticien : ~80 % du résultat vient d'une **démo live qui ne crashe pas, qui résout le vrai problème et s'explique en ~60 s**, ~20 % de la qualité de code/innovation ([Reskilll playbook 2026](https://blogs.reskilll.com/how-to-win-hackathon-2026-complete-playbook/)).

### 1.2 Types de démos qui marchent en cyber/IA
| Pattern | Pourquoi ça gagne | Exemple réel |
|---|---|---|
| **Red team vs blue team live** : on attaque un agent/une app à l'écran, l'attaque passe ; on active la défense, l'attaque est bloquée avec explication | Tension narrative + preuve visuelle + "wow" | Gandalf (Lakera) serait né d'un hackathon interne red/blue sur un LLM gardant un mot de passe ([Simplify / Lakera](https://simplify.jobs/c/Lakera) — source secondaire) |
| **Défense contre prompt injection / agents** (indirect injection, tool poisoning, MCP) | Sujet n°1 de 2025-2026, tous les jurys en ont entendu parler | SafeContext, 1er prix track "Idea Exploring", hackathon Agentic AI Palo Alto Networks, fév. 2026 ([PANW](https://jobs.paloaltonetworks.com/en/safecontext-ai-hackathon-winner-palo-alto-networks)) ; SecureMCP, Socrates (red-teaming auto), Crux (code sûr) — gagnants AI Security London hackathon EF × BlueDot, sept. 2025 ([EA Forum](https://forum.effectivealtruism.org/posts/t5iWspQueSyQDHNwo/hacking-away-at-p-doom)) |
| **Sécurité dans le flux dev** (PR, CI, secrets) | Parle directement à GitGuardian ; démo concrète "avant/après" sur un repo | Symbiotic Security : GitHub app qui propose des correctifs de vulnérabilités en PR, gagnant track dev tools RAISE Summit Paris 2025 (lablab.ai) |
| **Données d'attaque réelles / compétition** | Montre une base de preuve, pas une intuition | Microsoft LLMail-Inject : le gagnant a trouvé plus efficace d'itérer de petits prompts que de gros prompts complexes ([MSRC](https://msrc.microsoft.com/blog/2025/03/announcing-the-winners-of-the-adaptive-prompt-injection-challenge-llmail-inject)) ; rapport Pangea sur la défense ([Pangea](https://info.pangea.cloud/hubfs/research-report/defending-against-prompt-injection-2025.pdf)) |
| **Preuve on-chain / traçabilité** (si track Avalanche) | Donne une raison légitime d'utiliser la blockchain : journal d'audit infalsifiable, attestation | Tracks Avalanche Summit London 2025 : AI Agents, Developer Tooling, Cross-chain ([build.avax.network](https://build.avax.network/hackathon)) |

### 1.3 Narratifs gagnants
- **"Ça peut vous arriver demain matin"** : partir d'un incident réel et récent (fuite de secret, agent détourné), pas d'une stat abstraite.
- **"This is possible now"** : un seul moment "aha" vaut mieux qu'un tour de toutes les features ([JetBrains — notes from the judging table](https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/)).
- **Mettre le juge dans les chaussures de l'utilisateur** (Avi Press, Scarf, cité par JetBrains).
- Construire à partir d'une **frustration vécue**, pas du dernier outil à la mode (Bonnie Xu, OpenAI, cité par JetBrains).
- Pour un jury Bpifrance/KPMG : **souveraineté + conformité** (NIS2, DORA, AI Act) comme "why now".

### 1.4 Le script "attaque live → défense live" (recommandé pour nous)
1. **Setup (10 s)** : "Voici un agent IA d'entreprise connecté aux mails / au repo / à la trésorerie."
2. **Attaque (20 s)** : on injecte un payload (mail piégé, README empoisonné, secret dans un commit). L'agent exfiltre / exécute. Compteur rouge.
3. **Défense (30 s)** : on active notre produit. Même attaque → bloquée, avec l'explication lisible (quelle règle, quel risque, quel article réglementaire).
4. **Preuve (15 s)** : métrique chiffrée sur un mini-benchmark (ex. "47/50 attaques bloquées, 2 % de faux positifs, +80 ms de latence") + log d'audit exportable (argument KPMG).
5. **Variante juge (option)** : "Proposez-nous une attaque" — uniquement si la défense est robuste ; sinon garder une liste de 3 attaques pré-testées.

> Règle : le cœur (détection/blocage) doit tourner **en vrai**. On peut mocker les intégrations périphériques (SSO, envoi de mail réel), à condition de le dire si on demande.

---

## 2. Pitch idéal 3-5 min + Q&A

### 2.1 Structure (version 4 min ; compresser à 3 min si besoin)
| Temps | Bloc | Qui | Contenu |
|---|---|---|---|
| 0:00-0:20 | **Hook problème** | Titouan | Incident concret + coût ("un secret leaké coûte X, un agent détourné peut…"). Le jury doit *ressentir* le problème avant la solution. |
| 0:20-0:35 | **Une phrase solution** | Titouan | "X est le pare-feu des agents IA : il bloque Y avant Z." Dire *ce que ça fait*, pas comment. |
| 0:35-2:15 | **Démo live** | Adem | Script attaque → défense → preuve (section 1.4). Démo visible avant 1:30. |
| 2:15-2:45 | **Pourquoi ça marche / techno** | Adem | 1 schéma d'archi, 1 chiffre de perf, ce qui est réel vs mocké. |
| 2:45-3:30 | **Marché & business model** | Titouan | Cible (ICP), qui paie, prix, why now réglementaire, TAM/SAM/SOM sobre. |
| 3:30-4:00 | **Next steps + ask** | Titouan | Roadmap 3 étapes, ce qu'on demande (pilote, intro, incubation). Phrase de fin mémorable = rappel du hook. |

Sources structure : hook ~20 s puis démo au centre ([Reskilll demo tips](https://blogs.reskilll.com/hackathon-demo-presentation-tips-pitch-3-minutes-win-2026/)) ; problème 10 s / solution 10 s / démo 90 s / why it works 30 s / next 20 s ([Reskilll playbook](https://blogs.reskilll.com/how-to-win-hackathon-2026-complete-playbook/)) ; démo en < 90 s (Jono Bacon, cité par [JetBrains](https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/)) ; écrire le script de démo de 90 s **avant** de coder ([levelup.gitconnected](https://levelup.gitconnected.com/how-to-win-a-hackathon-ee740c6d47db)).

### 2.2 Slides clés (6-7 max, la démo est le cœur)
1. Titre + one-liner + logos tech utilisés (GitGuardian API ? Avalanche ?).
2. Problème (1 incident, 1 chiffre, 1 visuel).
3. **DÉMO** (basculer sur l'app ; slide de secours = GIF/vidéo).
4. Architecture (1 schéma) + métriques du benchmark.
5. Marché : ICP, why now (NIS2/DORA/AI Act), TAM/SAM/SOM.
6. Business model + go-to-market (premiers clients, canal).
7. Roadmap + équipe + ask.
Annexes Q&A cachées : détails algo, limites, faux positifs, concurrence, pricing, conformité RGPD.

### 2.3 Q&A jury (préparer 10 questions, 3 réponses "béton")
Questions probables par juré :
- **GitGuardian** : "En quoi c'est différent de ggshield / d'un scanner de secrets ? Taux de faux positifs ? Ça tient sur un monorepo ?"
- **KPMG** : "Qui est responsable si l'agent passe quand même ? Comment ça s'insère dans un audit NIS2/DORA ? Traçabilité ?"
- **Bpifrance** : "Marché français/européen ? Souveraineté des données ? Équipe prête à continuer ?"
- **Avalanche / Kryptosphere** : "Pourquoi la blockchain ? Que se passe-t-il on-chain ? Coût en gas ?"
- **ESSEC / Alumni / UTOPIA** : "Qui paie ? Combien ? Premier client dans 3 mois ? Concurrents (Lakera/Check Point, Prompt Security, Lasso, Protect AI) ?"
Règles : réponse en 20 s, chiffre si possible, "je ne sais pas encore, voici comment on le mesurerait" plutôt que du bluff. Les juges creusent ce qu'on n'a pas montré et sentent quand un morceau de code n'est pas compris ([HackerEarth](https://www.hackerearth.com/blog/10-tips-win-hackathon)).

### 2.4 Erreurs fatales
- Sauter le problème et attaquer par la techno ([JetBrains](https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/)).
- Démo qui stalle (formulaire à remplir, appel API lent, LLM non déterministe) → pré-remplir, mettre en cache, seed déterministe.
- "Normalement ça marche mais là non…" ; démontrer des features à moitié faites ([Reskilll](https://blogs.reskilll.com/hackathon-demo-presentation-tips-pitch-3-minutes-win-2026/)).
- Tourner autour d'une feature inexistante : les juges le voient.
- Dépasser le temps.
- Lire un script sans énergie ; choisir le speaker le plus *clair*, pas le plus confiant.
- Aucune vidéo backup (les sorties IA varient d'un run à l'autre).
- Utiliser la blockchain "parce qu'il y a un sponsor" sans justification (le jury web3 le détecte).

---

## 3. Parler en même temps au jury tech et au jury business

### 3.1 Règle de la "double phrase"
Chaque affirmation technique est suivie de sa conséquence business :
- "On analyse chaque appel d'outil de l'agent en 80 ms" → "donc zéro friction pour le dev, et un log d'audit prêt pour le RSSI."
- "Détection sur 50 attaques connues" → "c'est la preuve de contrôle que demande un auditeur NIS2/DORA."

### 3.2 Business model crédible en 36 h
- **ICP** : ETI / scale-ups FR qui déploient des agents IA (copilotes internes, support, dev) et sont "entités importantes/essentielles" NIS2 ou entités financières DORA.
- **Modèle** : SaaS par agent ou par 1 000 appels protégés ; tier gratuit open-source (dev adoption, cf. modèle GitGuardian bottom-up) + tier entreprise (dashboard, SSO, rapports de conformité).
- **GTM** : bottom-up devs (GitHub app / CLI) + top-down via cabinets d'audit (KPMG = canal partenaire, pas seulement juge).
- **TAM/SAM/SOM** : rester sobre et sourcé ; préférer un **calcul bottom-up** (nb d'entreprises cibles × prix) à un gros chiffre Gartner. Ex. : "X ETI NIS2 en France × 1 500 €/mois". (Chiffres à sourcer dans les autres fichiers de recherche.)
- **Preuve de marché externe** : Check Point a annoncé l'acquisition de Lakera (sécurité des agents IA) le 16/09/2025, ~300 M$ selon la presse ([Check Point](https://www.checkpoint.com/press-releases/check-point-acquires-lakera-to-deliver-end-to-end-ai-security-for-enterprises/), [Venturelab](https://www.venturelab.swiss/Lakera-acquired-by-Checkpoint-in-USD-300-million-deal)). GitGuardian lui-même : Series A 12 M$ menée par Balderton (2019), modèle dev-first ([Tech.eu](https://tech.eu/2019/12/04/gitguardian-grabs-12-million-series-a-to-help-companies-detect-loose-secrets-in-code/)).

### 3.3 Réglementation comme argument "why now" (à vérifier avant de citer des dates précises)
- **DORA** : applicable depuis le **17 janvier 2025** au secteur financier ; amendes fixées au niveau national, sanctions personnelles possibles pour les dirigeants ([Jones Day](https://www.jonesday.com/en/insights/2025/01/digital-operational-resilience-act-now-in-effect-for-financial-sector), [Legiscope](https://www.legiscope.com/blog/dora-penalties-enforcement.html)).
- **NIS2** : deadline de transposition 17/10/2024 ; la France n'a pas fini (projet de loi "Résilience" regroupant NIS2/REC/DORA), et la Commission a saisi la CJUE le 08/07/2026 ([Commission — NIS2 France](https://digital-strategy.ec.europa.eu/en/policies/nis2-directive-france), [Banque des Territoires](https://www.banquedesterritoires.fr/retards-dans-la-transposition-de-nis2-la-france-bientot-sanctionnee), [Lex Mundi](https://www.lexmundi.com/guides/status-of-the-nis2-implementation-act-in-the-european-union/jurisdictions/europe/france/)). Message : "des milliers d'entités françaises vont devoir prouver leur maîtrise du risque cyber, y compris sur leurs outils IA."
- **AI Act** : le Digital Omnibus repousse les obligations "haut risque" (Annexe III → 02/12/2027 ; Annexe I → 02/08/2028), mais obligations GPAI et transparence (art. 50) restent sur 2026 ; amendes art. 50 jusqu'à 15 M€ / 3 % du CA ([Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines/), [Sidley](https://datamatters.sidley.com/2026/06/22/eu-lawmakers-reach-provisional-agreement-to-delay-key-eu-ai-act-obligations/)). **Ne pas surpromettre** : dire "préparer la conformité", pas "rend conforme AI Act".
- **Bpifrance** : programmes France 2030 "technologies cyber critiques" (lauréats incluant IA sécurisée, API, post-quantique) et Cyber Booster ([entreprises.gouv.fr](https://www.entreprises.gouv.fr/espace-presse/france-2030-un-nouvel-appel-projets-et-12-laureats-pour-renforcer-loffre-industrielle), [info.gouv.fr — Cyber Booster](https://www.info.gouv.fr/actualite/cyber-booster-lance-le-premier-startup-studio-pour-faire-emerger-les-leaders-europeens-de-la)). Mentionner que le projet est éligible à ce type de suite = signal "on continue après le hackathon".

---

## 4. Planning 36 h pour 2 humains orchestrant des agents IA

Principe : **Adem = chef d'orchestre des agents** (spécifie, revoit, intègre, ne tape pas le boilerplate) ; **Titouan = produit + marché + pitch + QA utilisateur**. Les agents codent en parallèle sur des modules isolés (worktrees/branches), Adem merge.

| Heure | Adem (tech + agents) | Titouan (business) | Jalon / gate |
|---|---|---|---|
| **H0-H2** | Pas de code. Lire règles/tracks/critères. Écrire le **script de démo 90 s** + user flow ≤ 5 écrans. Découper en 3-4 tâches agent. | Valider problème avec 2-3 mentors/sponsors (GitGuardian, KPMG). Nom, one-liner. | **G0** : one-liner + script démo + scope figés |
| H2-H6 | Agents : scaffold app, moteur de détection, jeu d'attaques, UI. Partir d'un repo sponsor/template si possible. **Déployer à H6** même cassé. | Recherche marché (ICP, pricing, concurrents), squelette deck. | **G1 (H6)** : URL déployée, flux vide qui tourne |
| H6-H12 | Cœur attaque→défense réel de bout en bout. Toutes les 4 h : "peut-on démontrer *maintenant* ?" | Business model, TAM bottom-up, slide réglementation. Premier jet du pitch. | **G2 (H12)** : attaque réussie + bloquée en live, même moche |
| H12-H16 | Sommeil en quinconce (4 h chacun minimum ; agents lancés sur tâches longues pendant ce temps : tests, benchmark, README). | Sommeil en quinconce. | |
| H16-H24 | Benchmark chiffré (N attaques, taux de blocage, faux positifs, latence). Log d'audit exportable. Intégration sponsor (API GitGuardian / attestation Avalanche) **seulement si elle sert la démo**. | Mentor check #2 avec deck v1. Préparer liste Q&A. | **G3 (H24) = FEATURE FREEZE** |
| H24-H30 | Polish uniquement : états loading/erreur/vide, données réalistes seedées, démo déterministe (cache LLM, seed). README, nettoyage repo. | Deck v2, répétition #1 et #2 chronométrées, feedback d'un mentor/autre équipe. | **G4 (H30)** : démo stable 3 runs d'affilée |
| H30-H33 | **Enregistrer la vidéo backup** (2-3 min). Landing page 1 écran. Soumission (Devpost ou équivalent) en avance. | Répétitions #3-#4, Q&A croisé (Adem joue le juge KPMG/GitGuardian). | **G5 (H33)** : soumission envoyée |
| H33-H36 | Aucun commit sauf bugfix critique. Préparer machine de démo (wifi de secours = partage 4G, onglets ouverts, zoom écran). | Répétition #5 en conditions réelles, debrief final. | Pitch |

Règles d'orchestration d'agents :
- Un agent = un module avec une interface claire ; jamais deux agents sur le même fichier.
- Toute sortie d'agent est relue par Adem avant merge (les juges questionnent le code ; il faut pouvoir l'expliquer).
- Tâches "longues et sans risque" (tests, docs, benchmark, landing) lancées pendant le sommeil/les répétitions.
- Pas de nouvelle dépendance/feature après G3. Toute idée nouvelle → slide "Roadmap".
- Planning inspiré de [Reskilll](https://blogs.reskilll.com/how-to-win-hackathon-2026-complete-playbook/) (plan sans code H0-2, deploy H6, freeze H20-30, pitch ×5 + vidéo H30-36), adapté à 2 personnes + agents.

---

## 5. Checklist de livrables

**Produit / démo**
- [ ] URL déployée qui marche (et version locale de secours)
- [ ] Script attaque → défense → preuve, testé 3 fois d'affilée sans erreur
- [ ] Données réalistes seedées ; sorties LLM mises en cache / seed fixe
- [ ] Mode "offline" ou fallback si API externe tombe
- [ ] Vidéo démo backup 2-3 min (MP4 local + lien), sous-titrée

**Repo**
- [ ] Repo public propre, historique de commits pendant l'événement (preuve que c'est construit sur place)
- [ ] **Aucun secret commité** (scanner avec ggshield avant soumission : GitGuardian est au jury !) ; `.env.example`
- [ ] README : one-liner, GIF de démo, problème, archi (schéma), quickstart en 3 commandes, ce qui est réel vs mocké, roadmap, équipe, licence
- [ ] Benchmark reproductible (`make bench` ou script) avec résultats
- [ ] Dossier `/docs` ou section "Sécurité & limites" (honnêteté = crédibilité)

**Business / pitch**
- [ ] Deck 6-7 slides + annexes Q&A (PDF exporté + clé USB)
- [ ] Landing page 1 écran : promesse, GIF, CTA "rejoindre le pilote"
- [ ] Fiche 1 page (one-pager) pour Bpifrance / ESSEC / investisseurs
- [ ] 10 questions jury préparées, 3 réponses chiffrées
- [ ] Page de soumission complète (description, vidéo, liens, tracks/bounties sponsors cochés)

---

## 6. Projets de hackathon devenus startups financées

Constat de recherche : **les cas documentés "hackathon cyber → startup financée" sont rares** dans les sources publiques ; la plupart des startups cyber financées n'ont pas d'origine hackathon attestée. Les cas les plus utiles :

| Cas | Origine hackathon | Devenir | Fiabilité |
|---|---|---|---|
| **Lakera / Gandalf** (Zurich) | Gandalf, le jeu de red-teaming de LLM, serait né d'un hackathon interne red team vs blue team | Plus grande communauté de red-teaming IA (80 M+ data points selon Lakera) ; Lakera acquise par Check Point (annonce 16/09/2025, ~300 M$ selon presse) | Origine hackathon : source secondaire ([Simplify](https://simplify.jobs/c/Lakera)) ; acquisition : primaire ([Check Point](https://www.checkpoint.com/press-releases/check-point-acquires-lakera/)) |
| **LI.FI** (infra web3 cross-chain) | MVP construit à HackMoney (ETHGlobal), parmi les gagnants ; prix sponsor 50 k$ (Connext) | Startup financée, intérêt investisseurs déclenché par la victoire | [LI.FI blog](https://blog.li.fi/ethglobal-a-gateway-into-web-3-bade19288f1c) (récit de l'équipe) |
| **CryptoKitties / Dapper Labs** | Créé à ETHWaterloo 2017 | Dapper Labs, devenu une entreprise majeure du web3 | [The Logic](https://thelogic.co/news/with-hackathon-ethglobal-returns-to-its-waterloo-roots/) |
| **Écosystème ETHGlobal** | 14 000+ projets | "350 M$+ levés en tant qu'entreprises" (auto-déclaré) | [ETHGlobal](https://ethglobal.com/) |
| **AI Security London hackathon (EF × BlueDot, sept. 2025)** | Gagnants : Crux (code sûr), Socrates (red-teaming automatisé), SecureMCP (défense prompt injection) | Candidatures Entrepreneurs First, essais d'embauche, poursuite des projets ; pas de levée confirmée | [EA Forum](https://forum.effectivealtruism.org/posts/t5iWspQueSyQDHNwo/hacking-away-at-p-doom) |
| **Symbiotic Security** | Gagnant track dev tools RAISE Summit Paris 2025 | Startup déjà existante qui a utilisé le hackathon comme vitrine | blog Symbiotic (page indisponible au moment de la vérif) |
| **Avalanche Summit London 2025** | Top participants éligibles à l'incubateur **Codebase** by Avalanche | Pitch day Codebase | [Avalanche Codebase](https://www.avax.network/about/blog/codebase-virtual-pitch-day-showcasing-top-web3-builders-on-avalanche) |

Enseignements :
- Le hackathon sert surtout de **déclencheur** (visibilité, prix sponsor, entrée en incubateur) ; le financement vient après, si l'équipe **continue**.
- Montrer explicitement la suite : "on candidate à [incubateur ESSEC / Codebase / Cyber Booster], on cherche 2 pilotes" → signal fort pour Bpifrance, ESSEC Alumni, Avalanche Team1.
- Un **actif communautaire / données** (cf. Gandalf : un jeu qui génère des données d'attaque) est un moat crédible à mentionner dans la roadmap.

---

## Sources principales
- JetBrains — How to win a hackathon: notes from the judging table (2026) : https://blog.jetbrains.com/ai/2026/06/how-to-win-a-hackathon-notes-from-the-judging-table/
- Reskilll — How to Win a Hackathon in 2026 : https://blogs.reskilll.com/how-to-win-hackathon-2026-complete-playbook/
- Reskilll — Demo & presentation tips (3 min) : https://blogs.reskilll.com/hackathon-demo-presentation-tips-pitch-3-minutes-win-2026/
- HackerEarth — 10 tips to win a hackathon : https://www.hackerearth.com/blog/10-tips-win-hackathon
- Levelup — How to win a hackathon : https://levelup.gitconnected.com/how-to-win-a-hackathon-ee740c6d47db
- Xero devblog — Land your hackathon pitch (non lu, 403) : https://devblog.xero.com/land-your-hackathon-pitch-a-playbook-for-winning-the-room-8b327de726ca
- ETHGlobal Agentic Ethereum — critères : https://ethglobal.com/events/agents/info/details
- DoD — How to hack ETHBerlin³ : https://blog.dod.ngo/how-to-hack-ethberlin3-2
- Devfolio — judging : https://guide.devfolio.co/docs/guide/judging
- Microsoft MSRC — LLMail-Inject winners : https://msrc.microsoft.com/blog/2025/03/announcing-the-winners-of-the-adaptive-prompt-injection-challenge-llmail-inject
- Palo Alto Networks — SafeContext : https://jobs.paloaltonetworks.com/en/safecontext-ai-hackathon-winner-palo-alto-networks
- EA Forum — Hacking away at p(doom) : https://forum.effectivealtruism.org/posts/t5iWspQueSyQDHNwo/hacking-away-at-p-doom
- Check Point — acquisition Lakera : https://www.checkpoint.com/press-releases/check-point-acquires-lakera-to-deliver-end-to-end-ai-security-for-enterprises/
- LI.FI — ETHGlobal gateway into web3 : https://blog.li.fi/ethglobal-a-gateway-into-web-3-bade19288f1c
- Avalanche hackathons : https://build.avax.network/hackathon
- Gibson Dunn — AI Act Omnibus : https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines/
- Commission européenne — NIS2 France : https://digital-strategy.ec.europa.eu/en/policies/nis2-directive-france
- Jones Day — DORA : https://www.jonesday.com/en/insights/2025/01/digital-operational-resilience-act-now-in-effect-for-financial-sector

## Limites de cette recherche
- Peu de pages "winners" Devpost spécifiquement cyber trouvées ; pas de liste publique des gagnants Avalanche Team1 / hackathons ESSEC-HEC-Station F.
- Origine hackathon de Gandalf : source secondaire uniquement.
- Dates AI Act (Omnibus) et statut NIS2 France évoluent : revérifier sur EUR-Lex / Légifrance avant de les afficher sur une slide.

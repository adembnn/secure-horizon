# 00 — Synthèse brainstorm (Secure Horizons 2026)

## ⚡ MISE À JOUR après lecture du règlement officiel (`context/notion_guide.md`)
- **Une seule track.** Hackathon **blue team** (NIST CSF : Detect/Respond). Gel dimanche 12h00. 20 k€.
- **Track 2 écrit noir sur blanc : « Yet another prompt filter will struggle to impress the jury. »** → un AgentShield vendu comme simple filtre de prompt est éliminatoire. Il faut aller plus profond : supervision de la couche outils, identité des agents, chaîne d'autorité.
- **Track 1, piste 3 décrit presque mot pour mot notre idée Seatbelt** : un agent piégé ordonne un paiement à un agent financier → il faut journaliser la chaîne d'autorité, détecter les transactions hors périmètre, utiliser des tokens courts et révocables, un kill switch et une validation humaine (ASI03, ASI07).

### Nouvelle recommandation : Track 1, « supervision et confinement des agents IA financiers »
Une passerelle placée entre les agents et les rails de paiement (testnet Fuji et/ou API bancaire simulée) :
1. **Detect (30 %)** : chaque action porte sa chaîne d'autorité (humain → agent → agent). Le moteur vérifie déterministiquement l'origine (provenance) et le périmètre, puis un juge Claude **isolé du contexte pollué** compare le mandat d'origine à l'action. Sortie : un score avec son explication. Métriques sur un benchmark synthétique : N scénarios légitimes + N attaques (ASI01/03/07) → taux de détection, faux positifs, latence.
2. **Respond (20 %)** : réponse graduée : laisser passer → mise en attente avec validation humaine → révocation du token → kill switch de l'agent → pause du contrat sur Fuji.
3. **Conformité (15 %)** : journal infalsifiable (chaîne de hash), classification de l'incident selon les critères DORA, rapport pré-rempli, réponse à « qui est responsable si le modèle se trompe ? » (le déterministe tranche, le LLM ne fait qu'escalader ; l'humain signe).
4. **Intégration (20 %)** : un SDK et un proxy compatibles MCP, smart account ERC-4337 sur Fuji (Team1), webhooks.

Pourquoi la Track 1 plutôt que la 2 : la piste correspond exactement à notre idée, la Track 2 sera saturée de passerelles MCP, et le jury (Avalanche, KPMG, Kryptosphère) récompense précisément la démo « wallet vidé → bloqué → rapport DORA ».
Plan B : Track 2, piste 3 (identité des agents + tokens limités à une tâche + révocation, fit GitGuardian).

> Consolidé à partir des rapports 01 à 08. Les chiffres marqués ~ ou ⚠️ dans les rapports sont à vérifier avant toute slide.

## L'événement
- **Secure Horizons**, 2e édition, organisé par KRYPTOSPHERE ESSEC, UTOPIA (asso IA ESSEC) et ESSEC MetaLab. Dotation 15 k€, financement France 2030.
- Aucun règlement ni grille publique : **à récupérer au kick-off** (critères, format de rendu, cumul de tracks autorisé ?, crédits AWS).
- Gagnants passés (avril 2025 « LLM to Agentic AI », HAKS 2025) : **un outil simple pour l'utilisateur final + une IA qui explique son score + une démo live** (Trustee, extension anti-arnaque ; détection de fraude blockchain).

## Ce que veut chaque jury
| Jury | Ce qui les fait vibrer |
|---|---|
| GitGuardian | Identités non humaines, agents IA / MCP, secrets, honeytokens, remédiation automatique. Repo propre passé à ggshield. |
| KPMG | Chaque fonctionnalité reliée à un article (DORA, NIS2, MiCA, AI Act), journal d'audit exportable. |
| Avalanche Team1 | Contrat déployé sur Fuji, ERC-4337 / ERC-8004 / x402, actifs réels tokenisés, eERC. |
| Kryptosphere | Crypto et fraude, démo concrète. |
| ESSEC MetaLab | IA explicable, métriques. |
| Bpifrance / Alumni | Business case start-up, PME/ETI, souveraineté, premiers clients. |
| UTOPIA | Usage audacieux de l'IA, démo spectaculaire. |

## Le signal le plus fort
**Les 5 rapports d'idées convergent tous vers un garde-fou pour agents IA** : AgentShield (tracks 1, 2 et 3), TrifectaGuard et AgentTrap (track 2), Seatbelt (tracks 1 et 2), enregistreur des actions d'un agent avec coupure d'urgence (signal faible le moins saturé selon le pouls des forums).

Pourquoi maintenant : agents détournés réels (Grok/Bankr vidé par prompt injection, postmark-mcp, s1ngularity, GTG-1002), commits faits avec Claude Code qui fuient 2x plus de secrets, rachats à prix d'or (Lakera par Check Point, Protect AI par Palo Alto), défense sous-servie (talks d'IA offensive x2 à Black Hat 2026).

## Shortlist
| # | Idée | Track | Score | Pour | Contre |
|---|---|---|---|---|---|
| 1 | **Seatbelt** : co-signataire IA qui vérifie l'intention avant qu'un agent signe une transaction. Le juge ne voit que le mandat et la transaction, jamais le contexte pollué. | 1+2 | 45/50 | Hybride, Avalanche + KPMG + GitGuardian, démo wallet vidé → bloqué | Exige du smart contract (ERC-4337 sur Fuji) |
| 2 | **AgentShield / TrifectaGuard** : proxy entre l'agent et ses outils MCP. Empreinte des outils, suivi des données non fiables, blocage de la trifecta, honeytokens. | 2 (+3) | 19/20 | Cœur de cible GitGuardian, pur logiciel, faisable | Marché plus encombré (Lakera, Invariant…) |
| 3 | **SignGuard** : second avis IA indépendant de l'interface pour les signataires multisig (mini-Bybit sur Fuji). | 1 | 19/20 | Histoire Bybit et Bitget, DORA | Pas d'angle IA défensive au sens agent |
| 4 | **Rootcanary / Secret Responder** : détection et révocation autonome d'un secret commité par un agent de code. | 2 | 41/50 | Le plus sûr pour GitGuardian | Moins spectaculaire, proche de leur produit |
| 5 | **VoiceGuard / ProofCall** : contre la fraude au président par voix clonée ou au faux conseiller. | 3 / 1 | 24/25 · 42/50 | Grand public, émotion, Bpifrance | Audio en temps réel risqué en 36 h |

## Recommandation (à trancher avec Titouan)
**Un noyau « Agent Shield » + une déclinaison Seatbelt pour la finance.**
- Noyau : un proxy de politique qui se place entre n'importe quel agent et ses outils. Le juge Claude est isolé du contexte pollué ; il produit un journal d'audit et une coupure d'urgence.
- Démo en 3 actes (~4 min) : (1) un agent avec wallet sur Fuji lit un contenu piégé et se fait vider en direct, (2) la même attaque est bloquée par Agent Shield, avec le raisonnement affiché, (3) le rapport d'incident est généré et relié aux articles DORA et AI Act, et le secret exposé est révoqué.
- Pitch : track 2 en principal, track 1 en secondaire si le cumul est permis.

## Playbook (rapport 06)
- Format gagnant : **attaque live → défense live → preuve chiffrée** (benchmark de N attaques, taux de blocage, faux positifs, latence).
- Jalons : script de démo H2 · déployé H6 · attaque bloquée H12 · gel des fonctionnalités H24 · démo stable H30 · soumission H33.
- Pitch 4 min : Titouan ouvre sur le problème, Adem fait la démo, puis business et demande. Vidéo de secours obligatoire.

## À faire maintenant
1. Récupérer au kick-off : règlement, grille, cumul de tracks, accès Bedrock (région, quotas, durée des clés).
2. Choisir l'idée (Adem + Titouan) → l'inscrire dans `coord/DECISIONS.md`.
3. `claude update` des deux côtés (Adem est en 2.1.34), installer l'AWS CLI et gitleaks.
4. Créer le repo GitHub partagé et y inviter Titouan.

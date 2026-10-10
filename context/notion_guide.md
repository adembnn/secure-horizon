# Candidate Guide officiel — Secure Horizons 2026 (SOURCE DE VÉRITÉ)

> Source : Notion des organisateurs (lu le 2026-10-10). En cas d'écart avec les photos des slides (`kickoff_slides.md`), **c'est ce fichier qui fait foi**.
> https://app.notion.com/p/Candidate-Guide-Track-Guidance-EN-3f400920c77e81beb3b4fad01fc5eeda

## Infos générales
- 10-11 oct. 2026, ESSEC Cergy, **20 000 € de cash prize**. Organisé par Utopia, Kryptosphère ESSEC et le METALAB ESSEC.
- **Hackathon blue team** : chaque projet doit couvrir au moins une fonction du NIST CSF 2.0, idéalement **Detect** ou **Respond** (Govern, Identify, Protect, Detect, Respond, Recover).
- Référentiels attendus : MITRE ATT&CK, **MITRE ATLAS**, **MITRE D3FEND**, **OWASP Top 10 for Agentic Applications** (ASI01 détournement d'objectif, ASI02 mauvais usage d'outils, ASI03 abus d'identité/privilèges, ASI06, ASI07 communication inter-agents non vérifiée, ASI08 défaillances en cascade).
- Signaux cités : EchoLeak (CVE-2025-32711), incident Hugging Face (mai-juil. 2026, agents OpenAI en intrusion autonome), NIS2 (notification sous 24 h), DORA, AI Act haut risque reporté à **déc. 2027** (Digital Omnibus), **assureurs qui excluent les incidents liés à une IA non contrôlée**.

## Règles communes
- Équipes jusqu'à 5. **Une seule track**, confirmable jusqu'au checkpoint de samedi 18h30. Places par track possiblement plafonnées.
- **Le cœur du projet doit être codé entre samedi 11h30 et dimanche 12h00.** Librairies, modèles et API existants autorisés.
- Éthique (non négociable) : aucune action contre un système réel sans autorisation écrite. Les attaques simulées servent seulement à générer des données de test, sur nos propres environnements. **Pas de données personnelles réelles** (données publiques ou synthétiques). **Zéro secret dans les repos : « Yes, the juries will check. »**

## Livrables communs — avant **dimanche 12h00 (gel définitif)**
1. Repo Git accessible au jury, avec un README clair : problème, architecture, installation, limites connues.
2. **Vidéo de démo de 2 à 3 min** (filet de sécurité si la démo live plante).
3. Pitch deck (8 slides max recommandé) : problème, cible, solution, démo, business model, équipe.
4. **Fiche de défense (1 page)** : scénario de menace, fonctions NIST CSF couvertes, techniques ATT&CK/ATLAS ou risques OWASP traités, **métriques** (taux de détection, faux positifs, temps de détection et de réponse), limites connues.
5. Le livrable spécifique à la track.

## Évaluation
- **Round 1 (dim. 13h00-14h30)** : une salle par track, **pitch de 5 min + 2 min de questions**, devant au moins 3 experts.
- **Finale (dim. 15h25-16h10)** : les 6 meilleures équipes (2 par track), **3 min de pitch + 3 min de Q&R** devant le grand jury, au Grand Amphi.
- (Les photos des slides indiquaient 4+2 puis 5+4 : le Notion fait foi, à reconfirmer sur place.)

## Jalons
| Quand | Quoi |
|---|---|
| Sam. 10h00 | Kick-off |
| Sam. 11h30 | Début du hacking + mentorat d'idéation par track |
| **Sam. 12h00** | (track 3) problème en une phrase |
| **Sam. 18h30** | Checkpoint mi-parcours : formulaire problème / solution / stack |
| Dim. 10h00 | Atelier de coaching pitch |
| **Dim. 12h00** | **Deadline de soumission** |
| Dim. 13h00 | Round 1 |
| Dim. 15h00 | Annonce des finalistes, finale, remise des prix |

Ressources fournies : [à confirmer]. Crédits AWS disponibles pour héberger les PoC.

---

## Track 1 — Fintech Security : Guardians of Value
Surveiller, détecter et répondre aux menaces qui visent l'argent, de la banque à la DeFi.

**Enjeux** :
- Analystes noyés : phishing, faux documents et voix clonées industrialisés par l'IA ; les moteurs à règles fixes génèrent trop de faux positifs.
- **Agents IA qui manipulent de l'argent** : un agent de recherche à faible privilège, piégé par un document, ordonne à un agent financier d'exécuter une transaction. Sans vérification de la chaîne d'autorité ni supervision, elle passe (ASI03, ASI07).
- Incidents à déclarer vite : DORA, y compris pour les prestataires crypto agréés MiCA. En DeFi, un exploit se joue en quelques minutes.
- Les assureurs excluent de plus en plus les incidents liés à une IA non contrôlée → la solution doit être **explicable à un régulateur, un auditeur ou un assureur**.

**Pistes suggérées** :
1. Poste de l'analyste AML/CFT : réseaux de mules, ML sur graphe, score de risque explicable, réduction mesurée des faux positifs. (Detect, Respond)
2. SOC anti-fraude à l'ère de l'IA générative : prise de contrôle de compte, fraude au président par voix clonée, faux KYC, réponse graduée (authentification renforcée, mise en attente, gel, alerte client). (Detect, Respond)
3. **Supervision et confinement des agents IA financiers** : journal de chaque action d'agent avec sa **chaîne d'autorité** (quel humain ou agent l'a demandée), détection des transactions hors périmètre habituel, **tokens d'autorisation très courts et révocables**, **kill switch automatique** au-delà d'un seuil de risque, validation humaine des actions sensibles. (Identify, Detect, Respond)
4. Détection et réponse DeFi + DORA : monitoring on-chain d'un contrat déployé (**ex. testnet Avalanche Fuji**), playbook (pause du contrat, alertes, traçage des fonds), classification automatique selon les critères DORA, déclaration pré-remplie, cartographie des prestataires tiers critiques. (Detect, Respond, Recover)

**Livrables spécifiques** : PoC de bout en bout, de la détection à la réponse, sur un scénario concret (données synthétiques ou rejouées) · **playbook de réponse** (qui est alerté, ce qui est automatique, ce qui reste humain, comment c'est documenté) · **slide conformité** (DORA, AML/CFT, MiCA, AI Act ; comment un auditeur vérifie les décisions).

| Critère | Poids | Ce que regarde le jury |
|---|---|---|
| Efficacité de détection | **30 %** | Précision, taux de faux positifs, temps de détection, sur un scénario réaliste |
| Qualité de la réponse | 20 % | Proportionnée, actionnable, utile à l'analyste |
| Faisabilité et intégration | 20 % | Le PoC marche-t-il ? S'intègre-t-il aux outils d'une banque, d'une fintech ou d'un protocole ? |
| Conformité et explicabilité | 15 % | Décisions traçables et défendables devant un régulateur ou un auditeur |
| Pitch et démo | 15 % | |

Soutiens : Team1 Avalanche (monitoring on-chain, réponse aux incidents DeFi), KPMG (fraude, AML/CFT, DORA), Kryptosphère (crypto appliquée, DeFi), Utopia (mentors IA), AWS (crédits).
Conseils : un seul scénario traité parfaitement · des chiffres même synthétiques · préparer **« si votre modèle se trompe, qui est responsable ? »**

---

## Track 2 — AI for Security & Secure AI : Defenders Augmented
Le SOC de demain : augmenté par l'IA, et capable de superviser l'IA.

**Enjeux** :
- SOC surchargés : un copilote qui hallucine est pire que rien. Il faut des scores d'incertitude, une vérification contre les sources et un humain dans la boucle.
- Agents non supervisés : tool poisoning via MCP. OWASP Agentic classe ASI01 (détournement d'objectif), ASI02 (mauvais usage d'outils) et ASI03 (abus d'identité et de privilèges) en tête.
- Identités hors de contrôle : agents sur des comptes de service sur-privilégiés ; personne ne sait lesquels existent.
- Fuites de données internes : selon Gartner, la majorité des incidents IA viendront de violations internes ; EchoLeak.
- **Signal de marché : les « prompt firewalls » ont été rachetés en 2025 (Lakera par Check Point, Prompt Security par SentinelOne). Un énième filtre de prompt aura du mal à impressionner. Visez plus profond : supervision de la couche outils, identité des agents, sécurité des données RAG, fiabilité du copilote.**

**Pistes suggérées** :
1. Copilote SOC fiable : score d'incertitude, vérification contre les logs sources, escalade vers un humain, threat intel convertie en règles de détection testées sur des logs rejoués et mappées ATT&CK, reconstruction de timeline, notification NIS2 sous 24 h.
2. **Supervision de la couche outils (MCP)** : passerelle d'observabilité, détection d'appels anormaux, analyse des descriptions d'outils pour repérer des instructions cachées, alertes vers un SIEM, kill switch, sandbox (ASI08).
3. Identité des agents, secrets et privilèges : inventaire des identités non humaines, secrets exposés dans les prompts, logs et configs MCP, escalade de privilèges, communication inter-agents non vérifiée (ASI03, ASI07), tokens limités à une tâche avec révocation automatique.
4. RAG sous surveillance : audit des permissions avant indexation, documents contenant des instructions cachées (ASI06), sorties qui exfiltrent (liens et images Markdown façon EchoLeak), traçabilité de l'origine de chaque information.

**Livrables spécifiques** : PoC branché sur un flux réaliste (logs SOC, agent instrumenté, pipeline RAG) · **métriques défensives** (temps gagné, précision, couverture ATT&CK/ATLAS/OWASP Agentic) · section **« comment l'humain garde le contrôle »** (seuils d'escalade, traçabilité, gestion des erreurs).

| Critère | Poids | Ce que regarde le jury |
|---|---|---|
| Efficacité défensive | **30 %** | Détection, couverture des menaces, précision |
| Valeur opérationnelle pour l'analyste | 20 % | Temps gagné, clarté des alertes, actionnabilité |
| Fiabilité et contrôle de l'IA | 20 % | Hallucinations, traçabilité, humain dans la boucle. **Va-t-on au-delà d'un filtre de prompt ?** |
| Intégration technique | 15 % | SIEM, SOAR, MCP, latence, scalabilité, **aucun secret dans le repo** |
| Pitch et démo | 15 % | |

Soutiens : GitGuardian (secrets, identités non humaines, supervision d'agents), METALAB (IA responsable), KPMG (AI Trust, AI Act, NIS2), Utopia (atelier « Building a reliable SOC copilot with LLMs »), AWS.
Conseils : partir d'un flux réel ou rejoué et montrer ce que l'analyste voit, décide et fait · **nommer le risque OWASP ou la technique ATLAS/ATT&CK** · être honnête sur les limites (« voici ce qu'on ne détecte pas encore »).

---

## Track 3 — Open Track : Uncharted Frontiers
Une seule règle : IA × cyber, côté défense.

**Enjeux** : OT/ICS/SCADA · chaîne d'approvisionnement logicielle et IA (modèles piégés, NIS2/CRA) · **conformité continue** (AI Act art. 15, journaux infalsifiables, assureurs) · PME et citoyens (arnaques, Shadow AI ; Trustee 2025).

**Pistes suggérées** :
1. Monitoring OT/ICS : jumeau numérique, priorisation par impact physique.
2. Chaîne d'approvisionnement logicielle et IA : scoring des dépendances, typosquatting, modèles piégés, secrets dans l'historique Git, priorisation via SBOM, notification NIS2/CRA.
3. Conformité continue et preuves infalsifiables : tests de robustesse à chaque version de modèle, journal infalsifiable (hash, transparency log), « evidence pack » mappé AI Act (art. 15, annexe IV), NIST AI RMF, ISO 42001.
4. Défense des PME, associations et citoyens : mini-SOC automatisé, découverte du Shadow AI, détection d'arnaques et de deepfakes, plan de reprise guidé.

**Livrables spécifiques** : PoC · slide **« why this problem »** · slide **« what's next? »** (premiers clients, feuille de route à 6 mois, besoins pour passer à l'échelle).

| Critère | Poids |
|---|---|
| Importance et originalité du problème | 25 % |
| Efficacité défensive démontrée | 25 % |
| Impact et passage à l'échelle | 20 % |
| Viabilité business | 20 % |
| Pitch et démo | 10 % |

Soutiens : Bpifrance, ESSEC Alumni, Kryptosphère, GitGuardian (ponctuel), Utopia, AWS.
Conseils : problème en une phrase dès samedi midi + quel défenseur on aide · **vérifier que le projet ne relève pas plutôt de la Track 1 ou 2** · penser clients dès le premier jour.

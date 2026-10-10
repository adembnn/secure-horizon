# F4 — État de l'art détection & réponse (oct. 2026), angle « détection par construction »

> [V] = vérifié par fetch (URL donnée). [À VÉRIFIER] = connaissance générale non confirmée. WebSearch était indisponible pour cet agent.

## TL;DR
1. Le meilleur ratio signal/bruit vient de la **deception** : un leurre n'a aucun usage légitime, donc toute interaction est une alerte (faux positifs quasi nuls par construction). Thinkst vient d'étendre ça aux **agents IA** (canarytoken MCP, « Agent Provocateur »).
2. **Les agents attaquants sont « suggestibles »** : ils suivent les miettes de pain, appellent des outils MCP factices, répondent à des questions d'identification. Angle neuf et très démontrable en 24 h.
3. **DBSC** (Chrome 146 Windows) rend les cookies volés inutilisables, mais ne couvre ni l'attaquant présent sur la machine ni les sites non adoptants. Reste à détecter l'usage d'une session depuis un contexte inattendu.
4. Les métriques des « AI SOC » (Dropzone…) sont des **affirmations marketing sans méthodologie**. Publier une méthode de mesure reproductible (rejeu, vérité terrain, intervalle de confiance) démarque.
5. Piste gagnante : **leurres à coût nul** (invisibles en usage normal) + **détection-as-code testée sur logs rejoués** + **réponse proportionnée et réversible**, avec des chiffres honnêtes.

## 1. Deception engineering
- D3FEND classe la tactique Deceive en Decoy Environment et Decoy Object (fichier, credential, ressource réseau, persona, session token) [V] https://d3fend.mitre.org/tactic/d3f:Deceive/
- Canarytokens disponibles : DNS, HTTP, image web, Word/Excel, PDF, QR code, clés AWS, AWS Infrastructure (sept. 2025), Entra ID login, Kubeconfig, fausse app SAML, credentials CrowdStrike, dumps SQL, Sensitive Command, **MCP Configuration**, WireGuard… [V] https://docs.canarytokens.org/guide/
- Thinkst a racheté DeceptIQ (janv. 2026) et intégré Canary à Google SecOps SOAR (avr. 2026) [V] https://blog.thinkst.com/

**Nouveauté 2026 : deception pour agents IA**
- **Canarytoken MCP** (juin 2026) : génère un `mcp.json` (`.claude/`, `.cursor/`, `.mcp.json`) pointant vers un faux serveur MCP aux outils attractifs (ex. `fetch_kubeconfig`). Alerte à la connexion ou seulement à l'appel d'un outil (moins de bruit), avec IP, méthode MCP et nom d'outil. Dans le test de l'auteur, un agent Copilot avec MCP désactivé par politique a lu le fichier et appelé les outils via `curl` : le leurre attrape les agents qui contournent les politiques. Pas de chiffres [V] https://blog.thinkst.com/2026/06/one-for-all-the-models-out-there.html
- **Agent Provocateur** (sept. 2026) : personnalité Canary qui imite un assistant. Une miette (fichier texte sur un partage) attire l'agent, puis le service pose des questions croissantes (prochaines actions, utilisateur du processus, MAC, empreinte SSH). Revendication : les agents tombent dans le piège « 100 % du temps » (auto-déclaré, sans méthodologie). Un agent a inventé une empreinte SSH : une réponse fabriquée trahit aussi un agent. Un autre a été amené à exécuter un reverse shell [V] https://blog.thinkst.com/2026/09/getting-agents-to-tell-on-themselves.html

**Preuves** : qualitatif solide, quantitatif faible. Ne pas citer « 100 % » sans préciser que c'est auto-déclaré.
**Coût/friction** : très faible. Risque : un scanner ou un EDR légitime ouvre le leurre → poser les leurres hors des chemins de scan et autoriser les scanners connus.
**Limites** : un attaquant avisé repère les leurres ; on ne détecte que l'énumération ; les tokens DNS/HTTP exigent une sortie réseau.

**Idées de démo 24 h**
- **Honey-MCP pour pipelines d'agents** : un faux outil très privilégié (`transfer_funds`, `get_all_secrets`) dans la config de chaque agent. Un document injecté qui le fait appeler (ASI01/02) → alerte quasi sans faux positif → révocation automatique du jeton de l'agent. Mapping ATLAS, OWASP ASI01/02/03, D3FEND.
- **Document RAG-canary** : chaque document indexé contient un lien/image Markdown unique. Si la sortie tente de l'exfiltrer (façon EchoLeak), le token identifie le document source. Détection par construction de ASI06.
- **Honey-identities** : compte de service leurre avec secret leurre dans logs, prompts ou configs. Toute utilisation = alerte (angle GitGuardian).
- **Canary dans le presse-papiers** (hypothèse) : faux secret dans le presse-papiers ou le terminal d'un agent ; sa présence dans une requête sortante trahit une exfiltration.
- Mesures honnêtes : nombre de leurres, déclenchements sur trafic légitime simulé (attendu : 0), délai d'alerte.

## 2. Detection-as-code (Sigma, rejeu de logs)
- Règles dans Git, revue de code, tests unitaires (log positif / négatif), CI qui rejoue les règles sur un corpus avant déploiement. Sigma = format neutre [À VÉRIFIER].
- Le guide demande explicitement « threat intel convertie en règles testées sur logs rejoués, mappées ATT&CK » (Track 2, piste 1).
- Limite : les logs synthétiques gonflent le rappel → séparer un jeu de dev et un jeu de test caché, et le dire.
- **Démo** : CTI → règle Sigma générée par LLM → validation syntaxique → rejeu sur logs bénins (faux positifs) et logs d'attaque (rappel) → fusion seulement si 0 faux positif. « Le LLM propose, le test dispose » : garde-fou anti-hallucination mesurable.

## 3. ITDR et détournement de session
- Montée des attaques AiTM, vol de jeton, device code phishing et ConsentFix en 2026. Push Security : ClickFix est la technique dominante côté navigateur, environ 50 % des attaques arrivent hors e-mail, 17 extensions IA par organisation en moyenne [V] https://pushsecurity.com/blog
- **DBSC** (brouillon W3C du 8 sept. 2026) : paire de clés par session, cookies courts, rafraîchissement signé sur challenge. Hors périmètre : attaquant sur la machine, navigateur compromis à l'enregistrement [V] https://w3c.github.io/webappsec-dbsc/. Chrome 146 Windows (TPM), macOS à venir, co-conçu avec Microsoft, Okta en origin trial ; Google annonce une « réduction significative » du vol de session, sans chiffre [V] https://blog.google/security/protecting-cookies-with-device-bound-session-credentials/
- Signaux : même session vue avec une empreinte différente (JA4/UA/ASN/géo) ; jeton émis pour un appareil A utilisé depuis B ; pour les agents, jeton lié à une tâche et révoqué dès un usage hors périmètre (ASI03).
- **Démo** : un « DBSC pour agents » côté serveur : jetons liés à une clé locale, émission courte, révocation automatique. Montrer qu'un jeton copié échoue (0 % de réutilisation réussie).

## 4. UEBA / comportemental et pourquoi ça échoue [À VÉRIFIER]
- Bases de référence instables, peu d'étiquettes, déséquilibre extrême (1 % de faux positifs noie 0,01 % d'attaques), dérive, alertes inexplicables, attaquants « living off the land ».
- **Pour le pitch** : le comportemental sert à **prioriser**, pas à alerter, et s'ancre sur un signal déterministe (leurre, violation de chaîne d'autorité, outil jamais utilisé). Pour les agents, la « normalité » est étroite (jeu d'outils fixe), donc le comportemental y est bien plus fiable que pour les humains.

## 5. Détection par graphe [À VÉRIFIER]
- Chemins d'attaque d'identités, **graphe de délégation des agents** (humain → agent → agent → outil), réseaux de mules (Track 1).
- Règle déterministe et explicable : « l'action X n'a aucun ancêtre humain autorisé » = alerte, sans ML. Très défendable devant un régulateur.

## 6. LLM pour le triage (« AI SOC »)
- Dropzone affiche −85 % de temps d'investigation, MTTR 5x plus rapide, capacité SOC x10, sans méthodologie ni mesure de précision des verdicts [V] https://www.dropzone.ai/. Prophet, 7AI, Torq [À VÉRIFIER].
- **Angle différenciant** : publier ce qu'ils ne publient pas : exactitude des verdicts contre vérité terrain, taux d'hallucination, % d'escalades correctes, intervalle de confiance, chaque affirmation reliée à une ligne de log.

## 7. eBPF et navigateur
- eBPF (Falco, Tetragon, Tracee [À VÉRIFIER]) : voir un agent ouvrir un fichier leurre ou lancer `curl` en contournant une politique MCP. Détection côté hôte, sans dépendre d'Internet.
- Navigateur : Push détecte le copier-coller malveillant (ClickFix), l'AiTM et les extensions risquées ; « le navigateur est le point où l'identité et l'IA se rencontrent » [V].
- **Signaux à coût nul** : DNS canary, web bug dans un document, QR code, clé AWS leurre dans un dépôt. Rien à installer, c'est l'attaquant qui déclenche l'alerte.

## 8. Métriques et réponse proportionnée
- MTTD et MTTR mesurés en secondes sur scénario rejoué. Précision, rappel, taux de faux positifs **avec dénominateur** et intervalle de confiance. Coût par alerte, % d'alertes avec preuve citée. Couverture ATT&CK/ATLAS/OWASP **et liste de ce qui n'est pas détecté**.
- Réponse graduée et réversible : (1) journaliser/étiqueter, (2) réduire les privilèges ou imposer une validation humaine, (3) révoquer le jeton, (4) kill switch. Tout est annulable, journal horodaté et chaîné par hash. Un leurre justifie des niveaux élevés automatiques ; un score comportemental seulement les niveaux bas.

## 9. Combinaison recommandée
« Détection invisible, zéro faux positif, explicable » : leurres pour agents (honey-MCP, honey-secret, RAG-canary) comme signal haute confiance + graphe de chaîne d'autorité comme règle déterministe + jetons courts liés façon DBSC + comportemental pour prioriser + detection-as-code avec rejeu + réponse graduée réversible. Avec un banc d'essai (injections simulées sur nos propres environnements) et des chiffres honnêtes. Répond au « au-delà du filtre de prompt » du guide.

## Lacunes
SANS, Florian Roth, Chuvakin, Panther, Elastic, Island, Keep Aware, Prophet/7AI/Torq, papiers USENIX/NDSS, chiffres UEBA/MTTD : non récupérés. Sections 2, 4, 5, 7 et 8 surtout basées sur des connaissances générales.

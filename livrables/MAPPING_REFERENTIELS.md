# Mapping des fonctions de Hold up sur les référentiels

Établi le 11 oct. 2026. Chaque identifiant ci-dessous a été vérifié sur la source indiquée dans la section 3. Un identifiant que je n'ai pas pu confirmer, ou dont la définition ne correspond pas à la fonction, est retiré (section 4). Les identifiants des commentaires du code n'ont pas été repris tels quels : une dizaine étaient faux, révoqués ou mal décrits (section 4).

Lecture : « état » dit si la fonction tourne dans le produit livré (`server/server.mjs` et `rpc_garde/proxy.mjs`, qui n'importent aucun fichier de `detectors_adem/`) ou seulement dans le banc de mesure (`redteam/check_plus.mjs`). « Par analogie » signale un rapprochement honnête mais indirect : le référentiel décrit un autre objet (un agent IA, un fichier, un compte) et nous en reprenons le mécanisme.

## 1. Fonctions du produit

| # | Fonction | État | NIST CSF 2.0 | ATT&CK / ATLAS | D3FEND | OWASP Agentic |
|---|---|---|---|---|---|---|
| 1 | Interception avant signature (extension MV3, porte 1) | livré, jamais essayé avec un vrai portefeuille | DE.CM-09 | T1657 Financial Theft ; T1684.001 Impersonation (le leurre qui précède) | aucun | ASI02 par analogie (agent qui signe) |
| 2 | RPC de garde, après signature et avant diffusion (porte 2) | livré en local (`rpc_garde/`), testé sur nœud jetable | DE.CM-01, DE.CM-09 | T1657 | D3-NTA Network Traffic Analysis | aucun |
| 3 | Décodage de l'effet réel (calldata, données typées, Seaport, lots) | livré (`engine/src/`) | DE.AE-02 | T1657 | aucun | aucun |
| 4 | Comparaison avec l'intention déclarée (« tu as dit X, ça fait Y ») | livré (`engine/vendor/compare.ts` + `run/policy.mjs`) | DE.AE-02, DE.AE-07 | T1684.001 | aucun | ASI01 par analogie : écart entre l'objectif déclaré et l'action exécutée, au sens où l'agent est le signataire |
| 5 | Lecture du texte de la page (mots de pression : « support », « urgent ») | livré (`findPressure`, `server.mjs`) | DE.AE-02, DE.AE-07 | T1566 Phishing ; T1684.001 | D3-MA Message Analysis, par analogie (le texte vient de la page, pas d'une messagerie) | aucun |
| 6 | Friction graduée et retenue (Attention 1 clic, Danger 30 s, Manipulation 10 min) | livré, durées non validées sur des personnes | RS.MI-01 (lecture large, voir note a) | T1657 (impact évité) | aucun | ASI09 : l'exemple « Missing Confirmation for Sensitive Actions » est exactement la mitigation |
| 7 | Journal chaîné par hachage (une ligne par verdict) | livré (`server.mjs` makeJournal) | PR.PS-04, RS.AN-06 | T1070 Indicator Removal (la chaîne rend un retrait visible) | aucun | aucun |
| 8 | Ancrage de la racine de Merkle sur Avalanche Fuji (`EvidenceAnchor.sol`) | contrat et vérificateur écrits, aucune transaction Fuji dans le repo à la rédaction | RS.AN-06, RS.AN-07 | T1070 | aucun | aucun |
| 9 | Classifieur de message collé (modèle Clef ou mots-clés) | banc seulement, désactivé sauf `HOLDUP_CLASSIFIER` | DE.AE-02, DE.AE-07 | T1566 ; T1684.001 ; ATLAS AML.T0051 LLM Prompt Injection (voir note b) | D3-MA | ASI01 (voir note b) |

Notes.
- a. RS.MI-01 est libellé « Incidents are contained ». Une demande retenue n'est pas encore un incident déclaré. Nous le citons au sens large (empêcher qu'un événement devienne une perte), sans prétendre à une déclaration d'incident.
- b. AML.T0051 et ASI01 décrivent la menace subie par le modèle qui lit le texte collé : ce texte peut chercher à l'instruire (le détecteur pose cette question en propre). La parade est le contrat « le modèle ne peut qu'aggraver un verdict » (`pasted_message.mjs`). Aucun modèle n'est appelé dans le produit livré.
- c. PR.AT-01 (sensibilisation) n'est pas retenu pour la friction : il vise la formation du personnel, pas un avertissement au moment du geste.

## 2. Familles de détecteurs (`research/titouan/T_banc_e2e/detectors_adem/`)

Aucune de ces familles ne tourne dans le produit livré à la rédaction (grep de `detectors_adem` dans `server.mjs`, `proxy.mjs` et `build_standalone.mjs` : 0 occurrence). Elles améliorent le banc. Toute phrase au présent sur leur effet pour un utilisateur est fausse tant qu'elles ne sont pas branchées.

| Fichier | Ce qu'il fait | NIST CSF 2.0 | ATT&CK | D3FEND | OWASP |
|---|---|---|---|---|---|
| `batch_rights.mjs` | droit de dépense accordé par un sous-appel d'un lot (Multicall3, wallet_sendCalls) | DE.AE-02, DE.CM-09 | T1657 | aucun | ASI02 par analogie |
| `indirect_pull.mjs` | qui exécute le prélèvement dans un appel indirect | DE.AE-02, DE.CM-09 | T1657 | aucun | ASI02 par analogie |
| `spend_rights.mjs` | droit de dépense vers un tiers récent ou inconnu, swap sans minimum | DE.AE-02, DE.CM-09 | T1657 | aucun | ASI02 par analogie |
| `sig_rights.mjs` | signature hors chaîne qui accorde un droit (Permit, Permit2, personal_sign déguisé) | DE.AE-02, DE.CM-09 | T1657, T1684.001 | aucun | aucun |
| `nft_orders.mjs` | ordres Seaport / Blur à prix quasi nul | DE.AE-02, DE.AE-04 | T1657 | aucun | aucun |
| `control_shape.mjs` | prise de contrôle d'un contrat par forme et par nom de fonction | DE.AE-02 | T1098 Account Manipulation, par analogie (remise d'un pouvoir d'administration) | aucun | ASI03 par analogie |
| `dust_guard.mjs` | empoisonnement d'adresse (poussière entrante) | DE.AE-02 | T1036 Masquerading | D3-ID Identifier Analysis | aucun |
| `lookalike_known.mjs` | adresse sosie d'un contact, d'un protocole ou de l'adresse copiée | DE.AE-02, DE.CM-09 | T1036 | D3-ID | aucun |
| `token_guard.mjs`, `official_tokens.mjs` | faux jetons (même symbole, autre contrat), honeypot, taxe de vente | DE.AE-02, DE.AE-04, DE.AE-07 | T1036, T1657 | D3-DA Dynamic Analysis, par analogie (simulation de vente sur un fork) | aucun |
| `sim_events.mjs`, `fork_sim.mjs` | simulation de la requête sur un fork, lecture des événements Approval et Transfer | DE.AE-04, DE.CM-09 | T1657 | D3-DA, par analogie | ASI02 par analogie |
| `malformed_calldata.mjs` | calldata structurellement cassé, donc illisible pour l'utilisateur | DE.AE-02 | T1027 Obfuscated Files or Information, par analogie | aucun | aucun |
| `intent_guard.mjs` | réparations de l'intention déclarée (type mal écrit, jeton ou montant différent) | DE.AE-02, DE.AE-07 | T1657 | aucun | ASI01 par analogie |
| `wallet_methods.mjs` | `wallet_addEthereumChain` avec RPC hors liste, `wallet_requestPermissions` avec joker | DE.AE-02, DE.CM-09 | T1557 Adversary-in-the-Middle (un RPC hostile contrôle ce que le portefeuille croit) | aucun | aucun |
| `pasted_message.mjs`, `clef_client.mjs` | classifieur de message collé et son client | voir ligne 9 de la section 1 | voir ligne 9 | D3-MA | ASI01 |
| `index.mjs`, `util.mjs` | registre et fonctions communes | sans objet | sans objet | sans objet | sans objet |

Les règles du moteur livré (`engine/src/rules.mjs`, `rules_extra.mjs`, `run/policy.mjs`) couvrent les mêmes menaces avec les mêmes identifiants : droit illimité (`unlimited_allowance`), adresse sosie (`lookalike_address`, T1036 + D3-ID), changement de contrôle, ajout de réseau suspect. Les ids de la section 1 leur sont applicables ligne à ligne.

## 3. Registre de vérification : une URL par identifiant

Méthode : récupération de la page ou du fichier officiel le 11 oct. 2026. Les pages ATT&CK, D3FEND et le dépôt `atlas-data` ont été lues avec WebFetch ; le texte du NIST CSF 2.0 et du PDF OWASP a été extrait du PDF officiel téléchargé et lu en local.

### NIST CSF 2.0
Source unique : NIST CSWP 29, « The NIST Cybersecurity Framework (CSF) 2.0 », 26 février 2024, https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf (pages 19 à 23 pour les sous-catégories).

| Identifiant | Libellé officiel (traduit) |
|---|---|
| DE.CM-01 | les réseaux et services réseau sont surveillés pour trouver des événements potentiellement néfastes |
| DE.CM-09 | le matériel, les logiciels, les environnements d'exécution et leurs données sont surveillés pour trouver des événements potentiellement néfastes |
| DE.AE-02 | les événements potentiellement néfastes sont analysés pour mieux comprendre les activités associées |
| DE.AE-04 | l'impact et l'étendue estimés des événements néfastes sont compris |
| DE.AE-07 | le renseignement sur les menaces et les informations de contexte sont intégrés à l'analyse |
| RS.MI-01 | les incidents sont contenus |
| RS.AN-06 | les actions menées pendant une investigation sont enregistrées, et l'intégrité et la provenance des enregistrements sont préservées |
| RS.AN-07 | les données et métadonnées d'incident sont collectées, et leur intégrité et leur provenance sont préservées |
| PR.PS-04 | les journaux sont générés et rendus disponibles pour la surveillance continue |

Vérifiés mais non retenus : DE.AE-03 (corrélation de plusieurs sources), DE.AE-06 (information fournie au personnel et aux outils autorisés), DE.AE-08 (déclaration d'incident), RS.MA-02 à RS.MA-04, RS.CO-02, RS.MI-02, PR.AT-01, PR.AA-05, ID.RA-02, ID.RA-03.
Constat de numérotation : les codes `RS.AN`, `RS.MI`, `ID.RA` sans numéro des commentaires du code ne désignent aucune sous-catégorie. `PR.AA-05` existe, mais traite des politiques de droits d'accès, pas des méthodes de portefeuille : retiré de `wallet_methods`.

### MITRE ATT&CK (Enterprise)
| Identifiant | Nom confirmé | URL |
|---|---|---|
| T1657 | Financial Theft (tactique Impact) | https://attack.mitre.org/techniques/T1657/ |
| T1566 | Phishing (Initial Access) | https://attack.mitre.org/techniques/T1566/ |
| T1684.001 | Impersonation, sous-technique de T1684 Social Engineering (Stealth, v1.0 du 14 avril 2026) | https://attack.mitre.org/techniques/T1684/001/ |
| T1036 | Masquerading | https://attack.mitre.org/techniques/T1036/ |
| T1098 | Account Manipulation | https://attack.mitre.org/techniques/T1098/ |
| T1027 | Obfuscated Files or Information | https://attack.mitre.org/techniques/T1027/ |
| T1557 | Adversary-in-the-Middle | https://attack.mitre.org/techniques/T1557/ |
| T1070 | Indicator Removal | https://attack.mitre.org/techniques/T1070/ |

### MITRE ATLAS
| Identifiant | Nom confirmé | Source |
|---|---|---|
| AML.T0051 | LLM Prompt Injection (tactique Execution, AML.TA0005) ; sous-techniques .000 Direct et .001 Indirect | https://github.com/mitre-atlas/atlas-data (`dist/ATLAS.yaml`, dépôt officiel de MITRE). La page https://atlas.mitre.org/techniques/AML.T0051 a répondu 404 à la récupération, sans doute à cause du rendu côté navigateur : la confirmation vient du fichier de données. |

### MITRE D3FEND
| Identifiant | Nom confirmé | URL |
|---|---|---|
| D3-MA | Message Analysis (« analyser le contenu d'un courriel ou message instantané pour détecter une activité non autorisée ») | https://d3fend.mitre.org/technique/d3f:MessageAnalysis/ |
| D3-ID | Identifier Analysis (sous-techniques dont D3-HD Homoglyph Detection) | https://d3fend.mitre.org/technique/d3f:IdentifierAnalysis/ |
| D3-DA | Dynamic Analysis (définition centrée sur l'exécution d'un fichier en bac à sable) | https://d3fend.mitre.org/technique/d3f:DynamicAnalysis/ |
| D3-NTA | Network Traffic Analysis (« analyser le trafic réseau intercepté pour détecter une activité non autorisée ») | https://d3fend.mitre.org/technique/d3f:NetworkTrafficAnalysis/ |

Vérifiés mais non retenus : D3-UAP User Account Permissions, D3-UBA User Behavior Analysis, D3-OTF Outbound Traffic Filtering, D3-PSA Process Spawn Analysis, D3-MAN Message Authentication (page `d3f:MessageAuthentication`).

### OWASP Top 10 for Agentic Applications (2026)
Source : PDF officiel du projet OWASP GenAI Security, https://genai.owasp.org/download/52117/?tmstv=1765059207 (lien de la page https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/), table des matières et sections lues dans le texte extrait.

| Identifiant | Titre officiel |
|---|---|
| ASI01 | Agent Goal Hijack |
| ASI02 | Tool Misuse and Exploitation |
| ASI03 | Identity and Privilege Abuse |
| ASI09 | Human-Agent Trust Exploitation (exemple 2 : « Missing Confirmation for Sensitive Actions ») |

Les dix titres ASI01 à ASI10 sont présents dans le PDF ; ASI04 à ASI08 et ASI10 ne sont pas utilisés ici.
Portée : cette liste vise des applications à agents IA. Un particulier qui signe lui-même n'en relève pas. Nos renvois ASI valent pour le cas Track 1 « un agent détient le portefeuille », ou par analogie, et sont marqués ainsi.

## 4. Identifiants retirés ou corrigés

| Où | Identifiant écrit | Constat | Décision |
|---|---|---|---|
| `batch_rights.mjs`, `sig_rights.mjs`, `malformed_calldata.mjs` | « D3-MAN (message analysis) » | D3-MAN existe mais s'appelle Message Authentication (« authentifier l'expéditeur d'un message et garantir son intégrité »). Message Analysis est D3-MA. | corrigé en D3-MA là où le texte d'un message est lu (lignes 5 et 9) ; retiré ailleurs |
| `spend_rights.mjs` | « D3-OTF (by analogy) » | D3-OTF filtre le trafic sortant d'un hôte vers des réseaux non fiables. Un droit de dépense n'est pas du trafic. | retiré |
| `indirect_pull.mjs` | « D3-PSA (analogue) » | D3-PSA analyse la création de processus. L'arbre d'appels d'un contrat n'en est pas une. | retiré |
| `control_shape.mjs` | « D3-UAP » et « T1068 » | D3-UAP restreint les droits d'un compte ; nous détectons un transfert de contrôle. T1068 (Exploitation for Privilege Escalation) suppose une faille logicielle. | D3-UAP et T1068 retirés ; T1098 gardé par analogie |
| `dust_guard.mjs`, `nft_orders.mjs`, `sig_rights.mjs` | « ASI09 (human trust exploitation) » | Le titre est Human-Agent Trust Exploitation et vise la confiance d'une personne envers un agent IA. Aucun agent ne manipule la personne dans nos scénarios. | retiré de ces fichiers ; gardé pour la friction (ligne 6), où l'exemple du PDF correspond |
| `lookalike_known.mjs` | « T1115 (clipboard data) » | T1115 est la collecte du contenu du presse-papiers, pas sa substitution. | retiré |
| `wallet_methods.mjs` | « PR.AA-05 », « T1548 », « ASI03 » | PR.AA-05 traite des politiques d'habilitation. T1548 (Abuse Elevation Control Mechanism) n'a pas été vérifié sur sa page. | retirés |
| `pasted_message.mjs`, `sig_rights.mjs`, fiche de Titouan | « T1656 (Impersonation) » | La page https://attack.mitre.org/techniques/T1656/ est vide à la récupération. La page des mises à jour d'ATT&CK (https://attack.mitre.org/resources/updates/updates-april-2026/) indique « Impersonation (revoked by Social Engineering: Impersonation) » pointant vers T1684/001, sans écrire le numéro T1656. | remplacé par T1684.001. La révocation de T1656 est une inférence, pas une ligne explicite. |
| commentaires de plusieurs fichiers | « RS.MI », « RS.AN », « ID.RA » sans numéro | pas des identifiants valides du CSF 2.0 | remplacés par les sous-catégories de la section 3 |

Non vérifié et donc non utilisé : tout identifiant ATLAS autre qu'AML.T0051, tout identifiant D3FEND autre que ceux de la section 3, ASI04 à ASI08 et ASI10.

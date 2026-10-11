# Mapping des fonctions de Hold up sur les référentiels

Mis à jour le 11 oct. 2026 pour le produit figé : l'utilisateur écrit ce qu'il veut faire, Hold up dit si la demande correspond, alerte sinon, et garde les signaux que le portefeuille donne déjà.
Règle : seuls figurent des identifiants dont le nom a été relu sur le site officiel pendant cette mise à jour (WebFetch, 11 oct. 2026). Sinon la case dit « à vérifier ». Les codes des commentaires du code ne sont pas repris : une dizaine étaient faux ou révoqués (ancienne version de ce fichier, section 4 ci-dessous).

## 1. Fonctions du produit figé

| # | Fonction | État | NIST CSF 2.0 | ATT&CK | D3FEND | OWASP Agentic |
|---|---|---|---|---|---|---|
| 1 | Interception de la demande du site avant le portefeuille (extension MV3) | livré, jamais essayé avec un vrai portefeuille | DE.CM-09 | T1657 Financial Theft | aucun retenu | ASI02 par analogie, seulement si un agent signe |
| 2 | Lecture de la phrase écrite : type, montant, jeton, adresse (code d'abord ; mots-clés dans le build autonome, modèle seulement si le relais Clef est branché) | livré ; mesuré sur la grille (contrôle scellé, même auteur) | DE.AE-07 (contexte intégré à l'analyse) | T1204 User Execution (la personne exécute ce qu'on lui présente) | aucun retenu | ASI01 par analogie : écart entre le but écrit et l'action |
| 3 | Décodage de l'effet réel de la demande (calldata, données typées, droits accordés, fonds sortants) | livré | DE.AE-02 | T1657 | aucun retenu | aucun |
| 4 | Comparaison phrase contre effet : « ça correspond » ou « ça ne correspond pas » | livré, mesuré sur des cas écrits par nous | DE.AE-02, DE.AE-07 | T1566 Phishing ; T1684.001 Impersonation (l'interface qui se fait passer pour une étape normale) | aucun retenu | ASI01 par analogie |
| 5 | Alerte et correction proposée (montant écrit à la place du droit illimité, si c'est une transaction) | alerte livrée ; remplacement sous conditions prouvé en Node, pas dans un vrai Chrome | RS.MI-01, au sens large | T1657 (perte évitée) | aucun retenu | aucun |
| 6 | Conservation des signaux que le portefeuille donne déjà | livré (le moteur ne descend jamais sous le plancher du portefeuille : garde-fou branché dans le pipeline, non vérifié dans l'extension) | DE.AE-07 | T1657 | aucun retenu | aucun |
| 7 | Droit limité au montant écrit (moindre privilège) | fonction secondaire ; impossible pour une signature | PR.AA-05 (Protect : le règlement demande Detect ou Respond, donc pas l'axe principal) | sans objet | aucun retenu | ASI03 par analogie, seulement si un agent accorde le droit |
| 8 | Journal chaîné par hachage, une ligne par décision | livré dans la version serveur ; le build autonome garde 500 lignes non chaînées | PR.PS-04, RS.AN-06 | T1070 Indicator Removal (la chaîne rend un retrait visible) | aucun retenu | aucun |
| 9 | Ancrage de la racine sur Avalanche Fuji | contrat et vérificateur écrits ; aucune transaction Fuji dans le dépôt | RS.AN-06 | T1070 | aucun retenu | aucun |

Notes.
- RS.MI-01 est libellé « Incidents are contained ». Une alerte avant signature n'est pas un incident déclaré : nous le citons au sens large.
- Aucun identifiant D3FEND n'est retenu. D3-MA (Message Analysis, « analyzing email or instant message content ») vise le contenu d'un courriel ou d'un message, pas une phrase écrite par l'utilisateur. D3-UBA (User Behavior Analysis, statistiques sur les comportements) ne décrit pas une comparaison phrase contre effet. D3-DA (Dynamic Analysis) vise l'exécution d'un fichier en bac à sable. Mieux vaut dire « aucun équivalent retenu » que forcer un rapprochement.
- OWASP Agentic vise des applications à agents IA. Un particulier qui signe lui-même n'en relève pas. Les renvois ASI valent seulement si un agent détient le portefeuille, ou par analogie.
- MITRE ATLAS : non pertinent, l'IA est un composant et non la cible d'une technique que nous traitons. Pas d'identifiant ATLAS dans ce fichier.

## 2. Registre de vérification

Relu sur le site officiel le 11 oct. 2026 pendant cette mise à jour.

### NIST CSF 2.0
Source : NIST CSWP 29, « The NIST Cybersecurity Framework (CSF) 2.0 », https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf (texte extrait du PDF).

| Identifiant | Libellé officiel (traduit) |
|---|---|
| DE.AE-02 | les événements potentiellement néfastes sont analysés pour mieux comprendre les activités associées |
| DE.AE-07 | le renseignement sur les menaces et les informations de contexte sont intégrés à l'analyse |
| DE.CM-09 | le matériel, les logiciels, les environnements d'exécution et leurs données sont surveillés pour trouver des événements potentiellement néfastes |
| RS.MI-01 | les incidents sont contenus |
| RS.AN-06 | les actions menées pendant une investigation sont enregistrées, et l'intégrité et la provenance des enregistrements sont préservées |
| PR.PS-04 | les enregistrements de journaux sont générés et rendus disponibles pour la surveillance continue |
| PR.AA-05 | les droits d'accès, habilitations et autorisations sont définis dans une politique, gérés, appliqués et revus, et intègrent les principes du moindre privilège et de la séparation des tâches |

### MITRE ATT&CK (Enterprise)
| Identifiant | Nom confirmé | URL |
|---|---|---|
| T1657 | Financial Theft (tactique Impact) | https://attack.mitre.org/techniques/T1657/ |
| T1566 | Phishing (Initial Access) | https://attack.mitre.org/techniques/T1566/ |
| T1204 | User Execution (Execution) | https://attack.mitre.org/techniques/T1204/ |
| T1684.001 | Impersonation, sous-technique de T1684 Social Engineering (Stealth) | https://attack.mitre.org/techniques/T1684/001/ |
| T1070 | Indicator Removal (Stealth) | https://attack.mitre.org/techniques/T1070/ |
| T1036 | Masquerading (Stealth), vérifié, non utilisé dans le produit figé | https://attack.mitre.org/techniques/T1036/ |

### MITRE D3FEND
Vérifiés mais non retenus : D3-MA Message Analysis (https://d3fend.mitre.org/technique/d3f:MessageAnalysis/), D3-UBA User Behavior Analysis (https://d3fend.mitre.org/technique/d3f:UserBehaviorAnalysis/), D3-DA Dynamic Analysis (https://d3fend.mitre.org/technique/d3f:DynamicAnalysis/).

### OWASP Top 10 for Agentic Applications (2026)
Source : PDF officiel du projet OWASP GenAI Security, https://genai.owasp.org/download/52117/?tmstv=1765059207 (texte extrait). Titres relus : ASI01 Agent Goal Hijack ; ASI02 Tool Misuse and Exploitation ; ASI03 Identity and Privilege Abuse ; ASI09 Human-Agent Trust Exploitation. La page de présentation https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/ ne contient pas la liste : elle renvoie au PDF. ASI04 à ASI08 et ASI10 : titres vus dans le sommaire, non utilisés.

### MITRE ATLAS
Aucun identifiant utilisé. AML.T0051 (LLM Prompt Injection) a été vérifié par une session précédente dans le dépôt de données officiel de MITRE ; il décrit la menace subie par un modèle qui lit un texte hostile. La phrase de l'utilisateur n'est pas un texte hostile dans notre scénario : à vérifier si un message collé revient dans le produit.

## 3. Identifiants des anciennes versions, à ne pas reprendre

D3-MAN (Message Authentication, pas Message Analysis), D3-OTF, D3-PSA, D3-UAP, D3-ID pour l'adresse sosie (hors produit figé), T1068, T1115, T1548, T1656 (remplacé par T1684.001, révocation inférée), PR.AA-05 pour les méthodes de portefeuille (ici il ne sert que pour le droit limité), ASI09 pour la friction (le titre vise la confiance envers un agent), codes CSF sans numéro (RS.MI, RS.AN, ID.RA). Les familles de détecteurs de `detectors_adem/` ne sont pas dans le produit figé ; leur ancien mapping est dans l'historique git de ce fichier.

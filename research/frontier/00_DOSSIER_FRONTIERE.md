# Dossier frontière — comprendre pour créer

> Synthèse de F1 à F9 (`research/frontier/`). Objectif : donner à Adem et Titouan une **carte mentale** des enjeux et de ce qui se teste réellement, pour trouver un problème que **tout le monde a, que personne ne perçoit**, et le traiter **sans gêner l'utilisateur**. Ce n'est pas une liste d'idées à recopier.
> Chiffres marqués ÀV/[S]/[Vendeur] dans les rapports sources : à vérifier avant toute slide.

---

## 1. Les 7 vérités de 2026 (ce que le jury sait déjà)

1. **La porte est gardée, la maison ne l'est pas.** Les attaques se jouent *après* l'authentification : session volée après le MFA, consentement OAuth « Allow All », règle de transfert e-mail, lien de partage oublié. 82 % des détections sont sans malware (CrowdStrike). Un groupe passe la main à un autre en **22 secondes** (M-Trends 2026), contre 8 h en 2022. *(F1)*
2. **La confiance est accordée une fois et jamais réévaluée.** Extension rachetée puis piégée (QuickLens : rachetée le 1er février, malveillante le 17), mainteneur npm compromis, appli OAuth revendue, sous-domaine orphelin. Un tiers est impliqué dans **48 %** des violations (DBIR 2026). *(F1)*
3. **Le filtrage de prompt est mort scientifiquement.** « The Attacker Moves Second » (Carlini et al.) contourne 12 défenses publiées à plus de 90 %. Le jury Track 2 l'écrit noir sur blanc. La recherche est passée à l'**architecture** (CaMeL, FIDES : séparer les données des actions, suivre la provenance). *(F2)*
4. **L'humain ne sait plus distinguer le vrai.** 24,5 % de détection des deepfakes vidéo, 70 % se trompent au moins une fois. Les avertissements génériques sont contournés à 70 %, la formation fait −1,7 %. **Ce qui marche : une information concrète au bon moment, et une vérification hors-bande** (Ferrari a déjoué un faux PDG avec une question privée). *(F6)*
5. **Les agents IA ont ouvert une surface que personne n'outille.** Navigateurs agentiques (27 % des entreprises ont Atlas en une semaine), mémoire persistante empoisonnable, registres MCP qui triplent en 4 mois, apps « vibe-codées » à 58 % vulnérables, 19,7 % des paquets suggérés par les LLM inexistants. Tout passe par des **outils légitimes, sessions légitimes, domaines légitimes** → l'EDR, le CASB et le SIEM ne voient rien. *(F7)*
6. **Les signatures prouvent l'accord, pas l'intention.** Bybit (1,46 Md$) : on a signé ce que l'écran montrait, pas ce que la transaction faisait. AP2, Visa TAP et ACP prouvent ce que l'humain a signé, pas ce que l'agent a compris. **Aucun protocole ne vérifie la délégation agent → sous-agent**, et **aucun ne dit qui paie** en cas d'erreur. *(F3)*
7. **Le marché sait ce qui manque.** Enquête Okta auprès de 306 CISO (juillet 2026) : 47 % savent quels agents existent, **26 % peuvent couper un agent en quelques minutes**. 40 % du financement cyber du S1 2026 va à la sécurité des agents. Saturé : filtres de prompt (rachetés), « SOC IA » (123 éditeurs). Sans leader : révocation et autorité des agents, forensique d'incidents d'agents, preuves de conformité infalsifiables, fraude côté victime. *(F5)*

---

## 2. Ce qui se teste réellement (la frontière)

| Front | Ce qui existe / se teste | Ce qui reste ouvert |
|---|---|---|
| **Deception pour agents** | Canarytoken MCP (Thinkst, juin 2026), « Agent Provocateur » (sept. 2026) : les agents attaquants mordent aux appâts et se dénoncent. *(F4)* | Aucune mesure publiée ; rien côté RAG, mémoire, paiements. |
| **Défense par architecture** | CaMeL (77 % de tâches sécurisées vs 84 %), FIDES, Rule of Two (Meta). *(F2)* | Écrire les politiques à la main ne passe pas à l'échelle. |
| **Lecture interne du modèle** | Sondes d'activations : dérive de tâche (AUC quasi parfait), sleeper agents (AUROC 99,3 %). *(F2)* | Généralisation, accès aux poids. Presque personne ne le démontre. |
| **AI Control** | Trusted monitoring avec un budget d'audit humain limité (Redwood) ; surveillance du chain-of-thought (fragile). *(F2)* | Rarement montré hors labos. |
| **Liaison des sessions** | DBSC (Chrome 146) : cookie lié à une clé matérielle. *(F4)* | Rien pour les agents ; le BYOD n'est pas couvert. |
| **Moment de vulnérabilité** | Google in-call protection : appel inconnu + appli bancaire + partage d'écran → pause de 30 s. *(F6)* | Android et banques partenaires seulement ; rien pour les PME. |
| **Commerce agentique** | AP2 (mandats signés), Visa TAP, ACP, x402 (75 M de transactions par mois), ERC-8004. *(F3)* | Responsabilité, chaîne agent → sous-agent, Sybil. |
| **Provenance** | C2PA (Pixel 10 signe tout), journaux de transparence. *(F6, F8)* | Les métadonnées sont supprimées en transit ; provenance ≠ authenticité. |

---

## 3. Ce qui gagne ailleurs (F9, 47 projets primés)

- **La preuve, pas l'affirmation.** SANS « Find Evil! » 2026 : Mulder rejette tout finding sans artefact réel ; le « Skeptic » de SIFT++ relance les outils pour **réfuter ses propres conclusions**. Les garde-fous sont dans le code, pas dans le prompt.
- **Le jury attaque.** Find Evil : 1 775 tests contre les garde-fous. Les juges récompensent ceux qui **documentent leurs échecs** plutôt qu'une précision parfaite.
- **Cadrages originaux primés :**
  - *Omission Attacks* : l'attaque, c'est ce que l'agent **n'a pas fait** ; on vérifie les invariants de l'état final.
  - *Mind the Gap* : 67 % de succès dans la boucle d'agent contre 0 % sur le modèle seul.
  - Un honeypot pour agents IA (3e à Paris).
- **En fintech, on va jusqu'à l'action** : traçage et récupération de fonds entre banques, réduction mesurée des faux positifs, humain dans la boucle.
- **Ne gagne plus** : prompt firewall, jeu de jailbreak, multi-agents gratuits, copilote qui résume sans preuve, détecteur de deepfake hors flux métier, scanner de wallet.

---

## 4. Les leviers « sans friction » (le cœur de votre brief)

Ce qui revient dans tous les rapports : **on n'ajoute jamais une étape à l'utilisateur normal. On n'intervient que quand une conjonction de signaux rend l'anomalie quasi certaine.**

| Levier | Principe | Pourquoi c'est invisible | Source |
|---|---|---|---|
| **Leurre** | Un objet que personne de légitime ne touche (faux outil, faux secret, fait-canari) | Aucun usage normal ne le déclenche → zéro faux positif par construction | F4, F8 |
| **Décroissance par non-usage** | Accès, lien, clé ou guest inutilisé → rétrogradé automatiquement, restauration en un clic | Celui qui s'en sert ne remarque rien | F1 |
| **Dérive de contrôle** | Réévaluer une confiance quand le propriétaire, le code ou la description change | Rien ne se passe tant que rien ne change | F1, F2 |
| **Clé de contrôle d'intention** | Empreinte des paramètres critiques prise dans la demande humaine, revérifiée à l'exécution | Calcul silencieux ; ne bloque que si l'injection a modifié un paramètre | F8 |
| **Conjonction de signaux** | Appel inconnu + nouveau bénéficiaire + montant atypique → pause ciblée | Friction uniquement dans le scénario d'arnaque | F6, F3 |
| **Vérification hors-bande automatisée** | Défi envoyé à l'appareil déjà connu du vrai contact | L'humain n'a pas à « repérer le faux » | F6 |
| **Traçage de contamination** | Document piégé découvert → liste de tout ce qu'il a influencé | Pur Respond/Recover, après coup | F8 |
| **Juge isolé** | Le second modèle voit le mandat et l'action, jamais le contexte pollué | L'injection ne peut pas l'atteindre | F2, F8 |

---

## 5. Territoires peu occupés (pour orienter la créativité)

Trois familles de problèmes **universels, invisibles, sans leader** :

**A. « La confiance qui pourrit »** *(F1, F7)*
Tout ce qu'on a autorisé un jour et qu'on ne regarde plus : extensions, consentements OAuth, guests, clés, mémoire d'assistant, configs d'outils IA. Le problème est universel, invisible, et les deux leviers (décroissance + dérive de contrôle) sont sans friction. Track 2 piste 3 ou Track 3 piste 2.

**B. « L'écart entre ce qu'on voulait et ce qui s'exécute »** *(F2, F3, F8, F9)*
Bybit, l'agent piégé, l'omission attack : l'intention humaine se perd entre la demande et l'exécution. Leviers : clé de contrôle d'intention, juge isolé, invariants d'état final, chaîne d'autorité. Track 1 piste 3.

**C. « Le moment où l'humain est manipulé »** *(F6, F3)*
La victime autorise elle-même. On sait mesurer le moment (appel + appli + partage d'écran) mais seul Google le fait, et pas pour les PME ni pour les faux RIB. Leviers : conjonction de signaux, vérification hors-bande automatisée. Track 1 piste 2 ou Track 3 piste 4.

Et un **multiplicateur** applicable à n'importe laquelle : **le leurre** (honey-outil, honey-secret, fait-canari) donne une détection à zéro faux positif — exactement ce que pèse le critère « efficacité de détection 30 % ».

---

## 6. Règles de conception tirées de tout ça

1. **Déterministe d'abord, LLM ensuite.** Le garde-fou fixe l'emporte toujours ; le LLM explique et priorise (TCAS/Überlingen, AI Control). C'est aussi la réponse à « qui est responsable si le modèle se trompe ? ».
2. **Chaque alerte porte sa preuve** (ligne de log, artefact, diff). Un passage « sceptique » tente de la réfuter.
3. **Réponse graduée et réversible** : journaliser → réduire les privilèges → validation humaine → révoquer → kill switch. Tout est annulable et journalisé avec chaînage de hash.
4. **Mesurer honnêtement** sur un jeu rejouable, avec attaque adaptative : détection, faux positifs avec dénominateur, MTTD en secondes, coût par incident, **et la liste de ce qu'on ne détecte pas**.
5. **Nommer les taxonomies** : OWASP ASI01-08, MITRE ATLAS, ATT&CK, D3FEND, NIST CSF.
6. **Laisser le jury attaquer en direct.**

---

## 7. Questions pour votre session de brainstorm

- Quel est le **geste quotidien** (cliquer « Autoriser », installer une extension, coller dans une IA, valider un virement, rejoindre une visio) où une confiance est accordée **sans jamais être revue** ?
- Quel **signal existe déjà** sur l'appareil ou dans les logs, mais **n'est croisé par personne** ?
- Que pourrait-on **piéger** (leurre) plutôt que **filtrer** ?
- Qui est le **défenseur nommé** qu'on aide (l'analyste fraude d'une néobanque ? le DAF d'une PME ? le RSSI d'une ETI sans SOC ?) et que voit-il à l'écran ?
- Quelle démo de **90 secondes** ferait dire au jury « je n'y avais jamais pensé, et pourtant ça m'arrive » ?

## Fichiers sources
F1 problèmes invisibles · F2 recherche IA · F3 finance · F4 détection · F5 marché · F6 couche humaine · F7 nouvelles surfaces · F8 analogies · F9 hackathons mondiaux.

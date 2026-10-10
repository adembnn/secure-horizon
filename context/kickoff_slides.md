# Slides du kick-off — Secure Horizons 2026 (transcription de photos)

> Transcrit depuis des photos floues de l'écran. Les passages entre [crochets] sont incertains.

## Track 01 — Fintech Security (slides 07 et 09/25)
**Jury : Team1 Avalanche · KPMG · KRYPTOSPHERE France · UTOPIA · AWS**

Le défi :
- **Drowning analysts** : l'IA générative industrialise le phishing, les faux documents et les voix clonées. Les moteurs à règles fixes ne suivent pas et noient les équipes sous les faux positifs.
- **AI agents that touch money** : un agent à faible privilège reçoit un document piégé et demande à un agent financier d'exécuter un paiement. Sans contrôle de la chaîne d'autorité (authority-chain checks), le paiement passe (OWASP ASI03, ASI07).
- **Incidents to report fast** : DORA oblige les acteurs financiers, y compris les prestataires crypto agréés MiCA, à détecter, classifier et déclarer les incidents TIC majeurs. Un exploit DeFi se joue en quelques minutes.

Attendus, en plus des livrables communs :
- **PoC fonctionnel de bout en bout** : de la détection à la réponse, sur un scénario concret de fraude ou d'incident (données synthétiques ou rejouées).
- **Playbook de réponse** : qui est alerté, quelles actions sont automatiques, lesquelles restent humaines, comment c'est documenté.
- **Slide conformité** : comment la solution s'inscrit dans DORA, la lutte anti-blanchiment, MiCA ou l'AI Act, et comment un auditeur pourrait vérifier ses décisions.

Notation :
| Critère | Poids |
|---|---|
| Efficacité de détection | 30 % |
| Qualité de la réponse | 20 % |
| Faisabilité et intégration technique | 20 % |
| Conformité et explicabilité | 15 % |
| Pitch et démo | 15 % |

Conseil des organisateurs : choisir un seul scénario de fraude ou d'incident et le maîtriser de l'alerte à la réponse. Montrer des chiffres, même sur données synthétiques. Attendez-vous à la question : « si votre modèle se trompe, qui est responsable ? »

## Track 02 — AI for Security & Secure AI, « Defenders Augmented » (slides 10 et 12/25)
**Jury : GitGuardian · MetaLab ESSEC · KPMG · UTOPIA · AWS**

Accroche : l'IA peut rendre chaque analyste dix fois plus efficace, si on peut lui faire confiance. Et les agents IA déployés en entreprise ont eux aussi besoin d'être surveillés.

Le défi :
- **SOCs under pressure** : les copilotes promettent du soulagement, mais un copilote qui hallucine est pire que pas de copilote. Le défi est la fiabilité : scores d'incertitude, vérification des sources, humain dans la boucle.
- **AI agents without supervision** : les agents planifient et appellent des outils, souvent via MCP. Des instructions malveillantes peuvent se cacher dans la description d'un outil (« tool poisoning »). L'OWASP classe le détournement d'objectif et le mauvais usage d'outils en tête.
- **Identities and data out of control** : la plupart des agents tournent avec des comptes sur-privilégiés, et personne ne sait lesquels existent. EchoLeak a montré qu'un seul e-mail piégé pouvait exfiltrer des données, sans aucun clic.

**Ce qui gagne : « Another prompt filter won't impress the jury. Lakera and Prompt Security were acquired in 2025. Go deeper. »**

Attendus : un PoC fonctionnel · des métriques défensives · une slide « How the human stays in control ».

Notation :
| Critère | Poids |
|---|---|
| Efficacité défensive | 30 % |
| Valeur opérationnelle pour l'analyste | 20 % |
| Fiabilité et contrôle de l'IA | 20 % |
| Intégration technique | 15 % |
| Pitch et démo | 15 % |

## Track 03 — Open Track, « Uncharted Frontiers » (slides 11 et 15/25)
**Jury : Bpifrance · ESSEC Alumni · KRYPTOSPHERE France · GitGuardian · UTOPIA · AWS**

Accroche : usines, réseaux électriques, chaînes logicielles, PME : partout où les défenseurs manquent, il y a un projet à construire. **Une seule règle : IA × cybersécurité, côté défense.** Pour le reste, surprenez-nous.

**Ce qui gagne : des projets qui ont une vraie chance de devenir une entreprise. Pensez clients dès le premier jour.**

Pistes proposées :
- **Infrastructures critiques** : l'énergie, l'eau et l'industrie tournent sur des systèmes OT/ICS conçus pour durer des décennies, rarement surveillés comme un parc IT moderne.
- **Chaîne d'approvisionnement logicielle** : des centaines de dépendances, de tiers et de modèles IA téléchargés. Une seule librairie compromise ou un seul modèle empoisonné suffit.
- **Conformité continue** : l'AI Act exigera que les IA à haut risque prouvent leur robustesse dans la durée. Des audits annuels ne peuvent pas suivre des modèles mis à jour en continu.
- **PME et citoyens** : premières cibles des arnaques dopées à l'IA, sans RSSI ni SOC, avec en plus le Shadow AI (outils IA utilisés sans validation de l'entreprise). Trustee, le gagnant 2025, a montré qu'un projet grand public peut devenir une startup.

Attendus :
- **PoC fonctionnel** : il prouve la proposition de valeur centrale sur un scénario défensif concret.
- **Slide « Why this problem »** : preuves que le problème est réel et important (chiffres, incidents, réglementation, témoignages).
- **Slide « What next »** : premiers clients cibles, feuille de route à 6 mois, ce qu'il faut pour passer à l'échelle.

Notation :
| Critère | Poids |
|---|---|
| Importance et originalité du problème | 25 % |
| Efficacité défensive démontrée | 25 % |
| Impact et passage à l'échelle | 20 % |
| Viabilité business | 20 % |
| Pitch et démo | 10 % |

Conseil des organisateurs : liberté ne veut pas dire flou. Formulez votre problème en une phrase d'ici samedi midi et nommez les personnes que vous voulez aider. Pas sûr de votre track ? Demandez à un mentor.

## Finale — dimanche après-midi : deux rounds
- **Round 1** [~14h00–15h30] : pitch de 4 min + 2 min de questions.
- **Round 2** [~15h30–16h30] : pitch de 5 min + 4 min de questions.
- [Note de bas de slide illisible, quelque chose comme « Every judge is in the room… »]

## Points ouverts à demander aux organisateurs
- Contenu des « livrables communs » (common deliverables), non photographiés.
- Peut-on soumettre sur plusieurs tracks ?
- Accès Bedrock : région, quotas, durée de validité des clés.
- Heure limite de soumission.

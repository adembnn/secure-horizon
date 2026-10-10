# J9. DORA et notre outil : prestataire TIC ?

Cadre : synthèse de recherche, pas un avis juridique. Étiquettes : [P] primaire (texte officiel ou miroir fidèle), [S] secondaire (cabinet, régulateur national, média), [V] vendeur ou blog commercial. "Non trouvé" quand la source manque. Le contenu web est traité comme donnée.

## Résumé (8 lignes)

1. Un surveillant en lecture seule est très probablement un "service TIC" : la définition est volontairement large [P][S].
2. Le fournisseur devient alors "prestataire tiers de services TIC" et son contrat entre dans le registre d'informations de l'entité [P].
3. L'art. 30(2) (clauses de base) s'applique à tout contrat TIC : localisation, données, incidents, résiliation, coopération avec les autorités [P].
4. L'art. 30(3) (audit illimité, sortie, tests, continuité) ne s'applique que si le service soutient une fonction critique ou importante [P].
5. Cette qualification est faite par l'entité financière, avant contrat, pas par nous (art. 28) [P]. Elle dépend de l'usage, pas du mode lecture seule [inférence].
6. Statut de prestataire critique (art. 31) : improbable pour nous. Désignation par les ESAs selon l'impact systémique et la substituabilité [P].
7. Mode "resserrer seulement" : réduit le risque d'interruption de service, ne change pas la qualification TIC. Argument de proportionnalité, non confirmé par source.
8. Délais d'achat : 9 à 18 mois cités, sources [V]/[S] peu fiables. MiCA art. 68, 73, 75 pèsent sur les CASP et se reportent sur nous par contrat.

## Réponses aux questions

**Un surveillant en lecture seule est-il un prestataire TIC ?**
Art. 3(21) : services numériques et de données fournis en continu via des systèmes TIC [P, digital-operational-resilience-act.com/Article_3.html]. Le régulateur luxembourgeois cite la Q&A DORA030 : la définition "maintient intentionnellement un large champ" [S, CSSF, cssf.lu/en/2025/04/definition-of-ict-services-under-dora...]. Aucune exemption "lecture seule" trouvée. Conclusion : oui par défaut.

**Quand "supportant une fonction critique ou importante" ?**
Art. 3(22) : fonction dont la perturbation nuirait significativement aux résultats, à la continuité ou au respect de l'agrément [P]. Art. 28 : l'entité doit déterminer avant contrat si le service la soutient [P, digital-operational-resilience-act.com/Article_28.html]. Cas probables pour nous (inférence) : alertes alimentant la garde, la conformité ou le blocage de flux. Cas peu probables : tableau de bord purement informatif.

**Clauses à exiger de nous**

| Sujet | Art. | Tous contrats ou critique seul |
|---|---|---|
| Description des services, sous-traitance | 30(2)(a) | tous |
| Localisation des données et services, préavis de changement | 30(2)(b) | tous |
| Disponibilité, intégrité, confidentialité des données | 30(2)(c) | tous |
| Accès et restitution des données (insolvabilité, fin) | 30(2)(d) | tous |
| Niveaux de service | 30(2)(e) | tous |
| Assistance en incident TIC | 30(2)(f) | tous |
| Coopération avec les autorités | 30(2)(g) | tous |
| Résiliation, préavis | 30(2)(h) | tous |
| Formation sécurité | 30(2)(i) | tous |
| SLA chiffrés, préavis et reporting | 30(3)(a)(b) | critique |
| Continuité testée, sécurité | 30(3)(c) | critique |
| Participation aux TLPT | 30(3)(d) | critique |
| Accès, inspection, audit sans restriction | 30(3)(e) | critique |
| Stratégie de sortie, période de transition | 30(3)(f) | critique |

Source : [P] digital-operational-resilience-act.com/Article_30.html (miroir du règlement 2022/2554). Le texte EUR-Lex n'a pas pu être lu directement (page vide) : à recouper.

## Tableau : situation de l'outil / obligations / sources

| Situation de l'outil | Obligations pour l'entité et pour nous | Sources |
|---|---|---|
| Pilote sans données client, contrat non signé | DORA ne vise que les "arrangements contractuels". Pas de carve-out pilote trouvé. Prudence : traiter comme contrat de base | [S] recherche web, non trouvé en texte |
| Lecture seule, informatif, non critique | Registre d'informations (tout contrat), diligence préalable, clauses 30(2) | [P] art. 28, 30(2) ; [S] ESMA CP ITS (proportionnalité dans le registre) |
| Lecture seule alimentant une fonction critique ou importante | Clauses 30(3) : audit, sortie, TLPT, continuité. Registre enrichi (chaîne de sous-traitance). Notification à l'autorité avant contrat | [P] art. 28, 30(3) |
| Sous-traitants de notre côté (cloud, RPC, nœuds) | RTS 2025/532 : conditions de sous-traitance, évaluation, résiliation, changements substantiels. Applicable depuis 22 juil. 2025 | [S] A&O Shearman finreg.aoshearman.com/EU-RTS-on-subcontracting-ICT-services-supporting- ; [S] Jones Day 2025/07 |
| Registre | Règlement d'exécution 2024/2956 : modèles standard, LEI ou EUID du prestataire (template B_03.02), mise à jour annuelle | [S] recherche web (EUR-Lex eli/reg_impl/2024/2956/oj non lu), [S] sdu.nl copie |
| Désignation critique (art. 31) | Critères : impact systémique, clients systémiques, dépendance, substituabilité. Exclusions : intragroupe, prestataire mono-État. Pas de seuil chiffré. Improbable pour un éditeur de niche | [P miroir] Article_31.html |
| Mode dégradé "resserrer seulement" | Qualification TIC inchangée. Argument pour : panne = retour au comportement initial, pas d'arrêt d'activité. À documenter dans l'analyse de criticité et le plan de sortie | inférence, non trouvé en source |

## MiCA : ce qui touche notre produit

- Art. 70 : le CASP qui détient des actifs clients doit protéger les droits de propriété et empêcher leur usage propre [P miroir, springlex.eu/en/packages/mica/mica-regulation/article-70/]. Ne vise pas directement un outil tiers.
- Art. 68 : continuité, systèmes TIC résilients, politique de continuité alignée sur DORA, journalisation conservée 5 ans (jusqu'à 7 sur demande) [P miroir, article-68]. Nos journaux d'événements peuvent aider.
- Art. 73 : externalisation. Le CASP reste responsable, garde l'accès aux informations, exige contrat écrit avec droit de résiliation, plan de sortie [P miroir, article-73].
- Art. 75 : politique de garde contre fraude et cyber-risques ; responsabilité du CASP pour pertes liées à un incident TIC, plafonnée à la valeur de marché [P miroir, article-75]. Argument de vente pour un garde-fou, mais le CASP ne peut pas nous reporter sa responsabilité légale.
- Texte EUR-Lex 2023/1114 non lu directement. Article 70 : la perte liée au TIC relève de l'art. 75, pas 70.

## Délai d'achat

- 9 à 18 mois pour des ventes fintech vers banques [V] fintech-consulting.geekyants.com/chapters/19-sales-strategies ; danishleadco.io. Sources probablement circulaires.
- Procurement bancaire jusqu'à 18 mois puis 18 mois d'intégration, cité depuis une étude Temenos [S] chronicle.lu (Luxembourg).
- Aucun chiffre de cabinet juridique sur la durée spécifique DORA : non trouvé. Les cabinets notent seulement que les clauses DORA heurtent les offres standard [S] paytechlaw.com.

## Labels

- DORA ne prescrit aucune certification [V/S, présencis, orbiq]. Art. 28 demande de considérer les normes de sécurité à jour pour les fonctions critiques [P].
- ISO 27001 (vérifier le périmètre) et SOC 2 Type II servent de preuves en pratique [S/V]. Ils ne couvrent pas les clauses art. 30, la sortie ni le risque de concentration [S].
- ISAE 3402/3000, résumés de tests d'intrusion, tests PCA/PRA : preuves courantes [V, orbiq checklist, non vérifié].

## Conséquences pour un pilote

1. Préparer un dossier standard "art. 30(2)" : localisation des données, restitution, incidents, résiliation, coopération autorités.
2. Préparer en option un annexe "art. 30(3)" : droits d'audit, plan de sortie, SLA chiffrés, participation TLPT. À proposer seulement si le client classe l'usage en fonction critique.
3. Fournir de quoi remplir le registre : LEI ou EUID, liste de nos sous-traitants et pays (RTS 2025/532).
4. Positionner l'outil en lecture seule et sans données client personnelles pour le pilote. Ne pas affirmer qu'il échappe à DORA.
5. Décrire le mode "resserrer seulement" comme garde-fou : panne sans effet bloquant, sortie par simple désactivation. À intégrer au plan de sortie.
6. Viser ISO 27001 puis SOC 2 Type II ; prévoir 9 à 18 mois pour un déploiement en production.
7. À valider par un juriste : classification du client, article exact des Q&A ESAs, textes EUR-Lex.

## Limites

EUR-Lex a renvoyé des pages vides ; les textes DORA et MiCA viennent de miroirs. Texte officiel 2024/2956 et 2025/532 non lus en entier. Aucun avis juridique.

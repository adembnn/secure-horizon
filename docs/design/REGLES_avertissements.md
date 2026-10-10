# Règles de design des avertissements Sentinelle (preuves publiées)

Date : 11 oct. 2026. Auteur : chercheur UX sécurité (agent). Contexte : `docs/BRIEF_direction.md`.

Étiquettes : **[V]** vérifié par moi dans le texte source (PDF ou page éditeur). **[R]** repris d'un fichier interne (`research/titouan/...`) ou d'un résumé, non relu par moi : à relire avant de citer en pitch. **[H]** hypothèse de design, non prouvée. Aucun chiffre n'est inventé : si je n'ai pas pu lire la source, c'est écrit.

## TL;DR
1. Le design fait plus que le texte : mêmes données Chrome/Firefox, 70,2 % contre 33,0 % d'outrepassement SSL. L'interruption active bat le passif (phishing : 0 %, 45 % et 90 % de victimes selon le design).
2. Le nombre de clics n'est pas le levier. Le temps passé et l'obligation de lire le texte clé le sont. Retaper une phrase vaut plus qu'un clic de plus.
3. L'habituation arrive vite (IRMf : chute dès la 2e exposition). Il faut rareté, variation, et un geste d'annulation proposé.
4. Aucune étude publiée n'isole l'effet de « reprendre les mots de l'utilisateur », ni l'efficacité des alertes MetaMask/Blockaid/Rabby. Notre promesse reste une hypothèse à mesurer.
5. Une victime au téléphone est en « mode chaud » et coachée. Seul un geste qui casse le guidage (raccrocher, appeler un proche, attendre) a une logique solide. Aucune mesure isolée de la retenue de 10 min.

## 1. Règles, avec source, chiffre et application aux 4 niveaux

### Règle 1. Interrompre activement, ne jamais afficher passivement
- **Source** : Egelman, Cranor, Hong, CHI 2008 (60 participants), tel que rapporté par Akhawe & Felt, USENIX Security 2013, p. 261 [V].
- **Chiffre** : participants « phishés » : 0 % avec l'avertissement actif de Firefox 2, 45 % avec l'actif d'Internet Explorer 7, 90 % avec le passif d'IE7. Akhawe précise que ces taux sont un sur-ensemble des taux de chute.
- **Non vérifié** : le chiffre « 79 % suivent un avertissement actif » circule dans nos fichiers [R]. Je n'ai pas pu lire le papier d'Egelman (accès refusé). Ne pas le citer.
- **Application** : Manipulation et Danger = écran plein qui bloque l'étape suivante. Attention = bandeau interactif, jamais un simple texte. OK = rien.

### Règle 2. Le design d'abord, avec un choix par défaut clair et « opiniâtre »
- **Source** : Akhawe & Felt 2013, 25 405 944 impressions [V]. Reeder et al., « Improving SSL Warnings: Comprehension and Adherence » (page éditeur Google Research) [V pour le résumé].
- **Chiffre** : outrepassement SSL Chrome 70,2 %, Firefox 33,0 %. Phishing : Chrome 18,0 %, Firefox 9,1 %. Malware : Chrome 23,2 %, Firefox 7,2 % (versions stables). Le nouvel avertissement de Chrome : « près de 30 % de plus » d'utilisateurs ont choisi l'option sûre, sans meilleure compréhension. Les auteurs l'attribuent à un design « opiniâtre » avec des signaux visuels qui poussent vers la sécurité.
- **Limite** : Akhawe attribue au plus 15 points des 37 d'écart à la population différente (Chrome non contournable sur 20 % des sites épinglés) et suspecte l'image du policier et le mot « untrusted » de Firefox [V]. La cause exacte n'est pas isolée.
- **Application** : sur Danger et Manipulation, « Annuler » est le bouton principal, grand, coloré. « Continuer quand même » est visible mais secondaire. Jamais l'inverse.

### Règle 3. Le nombre de clics n'est pas ce qui retient
- **Source** : Akhawe & Felt 2013, § 5.2.2 [V].
- **Chiffre** : les avertissements phishing/malware de Chrome exigent 2 clics, ceux de Firefox 1 seul, et Chrome n'est pas plus bas. Firefox SSL exige 3 clics : 84 % de ceux qui font les deux premiers font le troisième. Les auteurs écartent le nombre de clics comme cause de l'écart.
- **Application** : « cocher une case » ou « cliquer deux fois » ne vaut presque rien. Notre friction doit forcer la **lecture** : phrase à retaper, adresse à retaper partiellement, choix entre deux phrases dont une est fausse [H].

### Règle 4. Le temps de décision mesure l'attention. Mesurez-le
- **Source** : Akhawe & Felt 2013, § 6 [V].
- **Chiffre** : 47 % des outrepassements se font en moins de 1,5 s, alors que 47 % des départs se font en moins de 3,5 s. Pour une erreur très fréquente (autorité non fiable), 49 % des outrepassements sont en moins de 1,7 s. Les auteurs lisent cela comme de la fatigue d'avertissement.
- **Application** : un décideur qui passe en moins de 2 s n'a pas lu. Journaliser `time_to_decision_ms` (déjà prévu dans R8). Si la médiane de contournement sur Danger est sous 2-3 s, l'écran est devenu du papier peint. Le seuil de 30 s du niveau Danger est une hypothèse [H] : aucune étude ne dit « 30 s ».

### Règle 5. Les attracteurs qui forcent l'interaction résistent à l'habituation
- **Source** : Bravo-Lillo et al., SOUPS 2014, page USENIX [V pour le résumé].
- **Chiffre** : sans attracteur, une habituation plus forte divise par trois (« three-fold decrease ») le nombre de participants qui remarquent un changement dans la boîte. Les attracteurs à délai ont fait remarquer plus de monde que le témoin. Deux attracteurs qui obligent à interagir avec le champ modifié ne montrent aucune baisse avec l'habituation. Le « 2 à 3 fois » de nos fichiers [R] n'est pas dans le résumé que j'ai lu.
- **Limite** : tâche de laboratoire sur une boîte de dialogue, pas un paiement crypto.
- **Application** : Danger = on force à interagir avec le texte clé (retaper la phrase). Un délai seul est moins fort qu'une interaction obligatoire.

### Règle 6. Varier l'écran (polymorphisme) et rationner les alertes
- **Source** : Anderson, Kirwan, Jenkins, Eargle, Howard, Vance, CHI 2015 (résumé via Semantic Scholar) [V pour le résumé]. Vance et al., MISQ 2018 [R] (page 403, non lue).
- **Chiffre** : activité des zones visuelles du cerveau en forte baisse dès la 2e exposition, puis nouvelle baisse. Deux expériences (IRMf et suivi de souris) : l'avertissement polymorphe résiste « nettement mieux ». Aucune taille d'effet dans le résumé. Le « 4 variantes suffisent » et le « 3 semaines » [R] ne sont pas vérifiés.
- **Source complémentaire** : Akhawe & Felt, p. 258 : la fréquence d'un avertissement est inversement corrélée à l'attention [V].
- **Application** : varier la phrase à retaper, l'ordre des blocs, l'illustration, pour Danger et Attention. Garder Manipulation très rare. L'objectif FP critique inférieur à 2 % du brief est la bonne direction : chaque fausse alerte use les vraies. PSR 2025 recommande aussi « less is more » [V, p. 4 et 27].

### Règle 7. Le geste d'annulation porte l'effet, pas le texte
- **Source** : OBIE / Open Banking, analyse préliminaire, 1er février 2021 [R, PDF en 403, non relu]. Même analyse décrite dans `OB_snaps_et_avertissements.md`.
- **Chiffre** [R] : témoin à 22 % de paiements frauduleux. Boutons d'appel à l'action (annuler, mettre de côté, appeler la banque) : -12 points. Avec texte comportemental : -14 points. Avec ciblage par risque : -18 points (4 %). Texte comportemental seul : -4 points. Ciblage par risque seul : non significatif sur la fraude. Contrepartie : jusqu'à -14 points de paiements légitimes. Laboratoire, argent fictif.
- **Confirmé en direction (sans chiffres)** : Akesson, Gathergood, Quispe-Torreblanca, Nottingham 2023-08 : les appels à l'action redessinés réduisent « substantiellement » la fraude, les avertissements comportementaux ou basés sur le risque ont des effets bien plus faibles [V, page IDEAS/RePEc, abstract sans taille d'effet].
- **Application** : chaque écran propose 3 gestes concrets : « Annuler », « Mettre de côté », « Appeler quelqu'un de confiance ». Pas seulement un paragraphe. Manipulation : mettre de côté + appeler un proche = les deux gestes visibles. Attention : un seul geste d'annulation net.

### Règle 8. Cibler par risque, placer au bon moment, assumer le coût sur le légitime
- **Source** : PSR / Axiom Economics, « Using Behavioural Economics to Understand and Prevent APP Fraud », octobre 2025 [V, pages 4, 27, 28, 31].
- **Contenu** : sans ciblage, deux inefficacités : on freine les paiements légitimes, et les avertissements perdent de l'effet par « fatigue cognitive et mémoire musculaire ». Recommande des alertes « juste à temps », fondées sur le bénéficiaire, le motif et le montant. Au moment de payer, certains sont déjà engagés (« pain of paying »). Aucun chiffre d'efficacité dans le rapport : il est conceptuel.
- **Application** : notre déclenchement conditionnel est la bonne conception. Publier à côté des FP le taux d'abandon légitime (R8 § 3.5). Demander l'intention **avant** que l'utilisateur soit engagé dans la signature (page compagnon) est plus cohérent avec « juste à temps » que l'écran de dernière seconde [H].

### Règle 9. Personnalisation (« reprendre les mots de l'utilisateur ») : preuve indirecte seulement
- **Chiffre direct** : aucun. Je n'ai trouvé aucune étude qui isole l'effet d'une citation des mots de l'utilisateur. Même constat dans `OB` et `R8`.
- **Indices indirects** :
  - TxSum, arXiv 2512.06933 : expliquer une transaction complexe en langage lisible, avec les flux de jetons, fait passer la compréhension de 52,9 % à 76,5 % et le rejet de transactions malveillantes de 36,0 % à 88,0 %, contre la meilleure référence, avec un faible rejet à tort de transactions saines. Source : abstract arXiv [V pour le résumé]. Le texte ne dit pas quelle est la référence ni le protocole. Ce n'est pas notre « Tu as dit / En réalité », mais c'est la même famille : dire l'effet réel en clair.
  - PSR 2025 et UK Finance / Thinks Insight 2024 : personnaliser, renouveler, éviter le style « papier peint » [R pour Thinks, V pour le principe PSR p. 4].
  - Décisions du Financial Ombudsman (cas individuels) : un avertissement générique est jugé inefficace [R].
- **Application** : « Tu as dit / En réalité » reste notre pari. Le présenter comme **hypothèse H1 à tester** (bras avec/sans citation) et pas comme un fait. Mettre le geste (règle 7) avant la phrase si on doit choisir. Les deux blocs servent à rompre le papier peint et à rendre l'écart indéniable [H].

### Règle 10. Les escrocs coachent : ne pas dépendre de ce que la victime répond ou clique
- **Source** : PSR/Axiom pp. 14 et 17 : les fraudeurs gardent la victime en « mode chaud » (urgence, panique, « déplacez l'argent tout de suite ») pour empêcher la réflexion, et peuvent cibler les plus vulnérables [V]. Coaching des victimes sur les réponses à la banque : Which?, UK Finance, Financial Ombudsman [R].
- **Chiffre** : aucun chiffre de contournement par coaching trouvé.
- **Application** :
  - **Manipulation** (intention « on m'a demandé » + sortie de fonds) : la retenue de 10 min vise à casser l'urgence. L'escroc peut garder la personne en ligne 10 min : la retenue doit s'accompagner d'un geste qui rompt la ligne (« raccroche et rappelle toi-même ») et d'un tiers de confiance proposé [H].
  - **Danger** : une phrase à retaper peut être dictée au téléphone. Elle ralentit, ne prouve rien. Varier la phrase et demander un fragment qu'un tiers ne connaît pas à l'avance (4 derniers caractères de l'adresse affichée à l'écran) [H].
  - Le niveau ne doit jamais baisser à cause d'une réponse : c'est déjà le principe de R8 (« montée seule »).

### Règle 11. Personnes âgées : peu de chiffres, une direction
- **Faits vérifiés** : PSR/Axiom note que l'âge, la littératie financière et numérique font varier la sensibilité, sans chiffres (p. 28) [V]. arXiv 2508.11579 : groupes de discussion avec 37 adultes de 65 ans et plus, qui s'appuient sur des relations de confiance pour détecter les arnaques [V pour le résumé]. arXiv 2601.12324 : 144 personnes âgées en Chine, les rôles « victime simulée » et « aidant » améliorent significativement l'identification de la fraude, sans taille d'effet dans le résumé [V pour le résumé].
- **Non trouvé** : aucune mesure de l'efficacité d'un avertissement chez une victime âgée **au téléphone avec un escroc**. Aucune donnée sur le cas crypto.
- **Application** : l'option « Appeler un proche / envoyer un message prérédigé » sur Danger et Manipulation est soutenue par le constat qualitatif que les seniors s'appuient sur des proches [H]. Phrases très courtes, vocabulaire sans jargon, gros caractères. Ne jamais « accuser » (pas de « vous êtes victime d'une arnaque »).

### Règle 12. Confirmation of Payee : un « no match » est un signal fort mais borné
- **Source** : Pay.UK (2 milliards de vérifications, mars 2024), PSR, enquête commanditée par Lloyds, tels que résumés dans `OB` et `R8` [R].
- **Chiffre** [R] : environ 8 % des adultes poursuivent malgré un nom qui ne correspond pas (enquête commanditée, non causale). Baisse de 2 % de la fraude totale et 1 % de l'APP (S1 2023), attribuée à l'ensemble des mesures, pas à CoP seul. CoP ne protège pas quand le bénéficiaire existe vraiment.
- **Application** : notre écart intention/adresse est un « no match ». Il a le même plafond : il ne protège pas contre « j'achète vraiment, mais à l'escroc » (cas B de O3). Ne pas promettre plus.

### Règle 13. Questions de finalité : preuve manquante, donc ne pas bâtir le produit dessus
- **Chiffre** : aucun taux de contournement ou de faux motif publié trouvé. Starling affiche déjà « Fraudsters will tell you how to answer these questions » (via une décision d'ombudsman) [R], effet non mesuré.
- **Application** : nos 5 intentions fermées sont un choix de design, pas une mesure prouvée. À tester dans notre banc d'essai. Le bandeau « si quelqu'un te dicte quoi répondre, c'est un signal d'arnaque » est une hypothèse, à mettre sur Danger et Manipulation.

### Règle 14. Les études de labo surestiment l'outrepassement. Notre test aussi
- **Source** : Akhawe & Felt, § 7.2 [V].
- **Chiffre** : les études de labo trouvaient 55 % à 90-95 % d'outrepassement sur d'anciens avertissements Firefox, contre 33,0 % sur le terrain avec le design actuel. 46 % des sujets de Sotirakopoulos disaient avoir cliqué parce qu'ils se sentaient en sécurité dans le labo ou voulaient finir la tâche.
- **Application** : nos tests avec 8-10 testeurs par bras donnent un intervalle d'environ ±30 points (R8). Ne jamais présenter nos pourcentages comme des taux réels. Dire « illustratif, n = X ».

### Règle 15. Sortie visible, sans honte (dark patterns)
- **Source** : FTC / ICPEN / GPEN (revue de 642 sites) et Consumer Duty FCA, via cabinets d'avocats [R].
- **Chiffre** : aucun chiffre d'effet sur le comportement.
- **Application** : « Annuler » toujours actif et jamais grisé. Pas de « Non, je préfère perdre mon argent ». Pas de double négation. Max une friction par opération.

## 2. Tableau d'application aux 4 niveaux

| Niveau | Déclencheur (brief) | Règles appliquées | Design concret proposé [H] |
|---|---|---|---|
| **OK** | Rien d'anormal | 6, 8, 15 | Rien ou une ligne grise « rien d'anormal détecté ». Jamais de vert, jamais « sûr ». |
| **Attention** (1 clic) | Écart sans danger objectif | 2, 6, 7, 8 | Bandeau ambre. Une phrase « Tu as dit X. Ça fait Y. ». Deux boutons : « Corriger mon intention » et « Continuer ». Rare. Texte varié. |
| **Danger** (phrase + 30 s) | Droit persistant, sosie, destinataire inconnu + montant | 1 à 7, 10, 14, 15 | Écran plein. « Annuler » principal. Phrase **variable** à retaper (ou 4 derniers caractères de l'adresse affichée). Décompte de 30 s qui affiche un contenu utile et pas un écran vide, « Annuler » actif tout de suite. Mesurer le temps. Proposer « appeler un proche ». |
| **Manipulation** (retenue 10 min) | « On m'a demandé » + sortie ou droit, faux support | 1, 7, 8, 10, 11, 13 | Écran plein. Gestes : « Mettre de côté », « Appeler un proche (message prérédigé) », « Raccrocher et rappeler toi-même ». Pas de reproche. Retenue de 10 min comme hypothèse non prouvée. Sortie jamais piégée. |

## 3. Mapping référentiels (hackathon blue team)

| Règle ou groupe | NIST CSF 2.0 | OWASP Agentic (ASI) | MITRE ATLAS | MITRE ATT&CK | MITRE D3FEND |
|---|---|---|---|---|---|
| 1 à 6 : interruption, design, habituation | PR.AT (sensibilisation et formation), DE.AE (analyse des événements) | Sans objet (aucun agent dans l'écran) | Sans objet | T1566 phishing, T1657 vol financier | D3-UBA (analyse du comportement utilisateur), à vérifier |
| 7 à 9 : geste, ciblage, personnalisation | DE.AE, RS.MA (gestion d'incident, réponse) | Sans objet | Sans objet | T1656 usurpation d'identité, T1657 | D3-UBA, à vérifier |
| 10 à 13 : coaching, seniors, CoP | DE.CM (surveillance continue), RS.MA, PR.AT | Si le message collé passe par un LLM : risque d'injection de prompt, à rattacher à la catégorie « détournement d'objectif » (identifiant ASI exact à vérifier) | Si LLM : injection de prompt (identifiant AML.Txxxx à vérifier) | T1656, T1566 | D3-UBA, à vérifier |
| 14 à 15 : mesure et éthique | GV.OC / ID.IM (amélioration), mesure de nos FP/FN | Sans objet | Sans objet | Sans objet | Sans objet |

Les identifiants D3FEND, ASI et ATLAS ci-dessus n'ont pas été relus à la source dans cette session : à vérifier avant d'écrire dans la fiche de défense. Le brief valide déjà NIST DE.CM, DE.AE, PR.AT et ATT&CK T1566, T1656, T1657.

## 4. Ce que je n'ai pas pu vérifier ou trouver

- Egelman et al. 2008 : le texte (CHI) est resté inaccessible (404 et 403). Les chiffres 0 %, 45 %, 90 % viennent d'Akhawe & Felt (vérifié). Le « 79 % » n'est pas vérifié.
- Vance et al. MISQ 2018 : page éditeur en 403. Anderson et al. 2015 : seulement le résumé. Aucune taille d'effet, aucun chiffre de variantes.
- OBIE février 2021 : PDF en 403. Tous les chiffres OBIE sont repris de nos fichiers. Rapports PSR de performance et UK Finance Annual Fraud Report 2025 : pages en 404 ou 441, non lues. Seul le rapport PSR/Axiom d'octobre 2025 a été lu (pages 1 à 31).
- CeDEx Nottingham : PDF illisible (scanné). Seul le résumé IDEAS est vérifié, sans chiffres. Les « 18 % » et « -94 % » de R8 restent non vérifiés.
- Wallets crypto : aucune étude publiée d'efficacité des alertes de MetaMask, Blockaid, Rabby ou Pocket Universe trouvée (recherche arXiv et pages éditeur). Seuls TxSum (comprehension) et une étude d'accessibilité MetaMask (arXiv 2306.06261, 44 testeurs, sans chiffre d'efficacité de sécurité) existent dans mes résultats.
- Personnes âgées sous pression téléphonique : rien de mesuré trouvé.
- Effet isolé du phrase à retaper, du délai de 30 s et de la retenue de 10 min : aucune mesure trouvée. Ce sont nos hypothèses, à tester sur notre banc.
- Le WebSearch n'existe pas dans cet environnement : la couverture se limite à des pages connues et à l'API arXiv.

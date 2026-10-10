# J5. Vérification de la spec DORA contre les textes officiels

Date : 10/10/2026. Méthode : textes lus en anglais, version XHTML du Journal officiel servie par l'Office des publications (CELEX 32024R1772, 32025R0301, 32025R0302, 32022R2554). EUR-Lex lui-même est bloqué par un contrôle anti-robot (non contourné). Le contenu est identique au JO. Aucun avis juridique : constat de texte seulement.

URL de référence (ELI, officielles) :
- RTS 2024/1772 : https://eur-lex.europa.eu/eli/reg_del/2024/1772/oj
- RTS 2025/301 : https://eur-lex.europa.eu/eli/reg_del/2025/301/oj
- ITS 2025/302 : https://eur-lex.europa.eu/eli/reg_impl/2025/302/oj
- DORA 2022/2554 : https://eur-lex.europa.eu/eli/reg/2022/2554/oj

## 1. Points critiques tranchés

| # | Point | Verdict | Citation exacte (courte) | Source |
|---|---|---|---|---|
| 1a | Délais initiaux, art. 5(1)(a) RTS 2025/301 | CONFIRMÉ, cumulatif | "within four hours from the classification" ... "no later than 24 hours from the moment" (aware) | art. 5(1)(a), URL 2025/301 |
| 1b | Classification après 24 h | CORRIGÉ : la lecture stricte (T9) est FAUSSE. Le texte tranche : 4 h après la classification, pas de retard automatique | "shall submit the initial notification within four hours from the classification" | art. 5(2), URL 2025/301 |
| 2 | Durée > 24 h ; indisponibilité > 2 h | CONFIRMÉ | "longer than 24 hours" ; "longer than 2 hours for ICT services that support critical" | art. 9(3)(a)(b), URL 2024/1772 |
| 3a | Art. 9(5)(b) | CORRIGÉ (formulation) : "non couvert par le point (a)" et "peut entraîner" des pertes de données | "successful, malicious and unauthorised access not covered by point (a)" ... "may result in data losses" | art. 9(5)(b) |
| 3b | Définition des pertes de données | CONFIRMÉ, définition par 4 volets (art. 5 a à d), pas de montant | "non-authorised modification of data" ; "accessed by or disclosed to an unauthorised party" | art. 5 |
| 4a | Seuil économique | CONFIRMÉ | "exceeded or are likely to exceed 100 000 euro" | art. 9(6) |
| 4b | Coûts bruts, avant récupération | CONFIRMÉ : les récupérations ne comptent pas | "without accounting for financial recoveries" | art. 7(1) |
| 5 | Week-ends et jours fériés | CORRIGÉ (périmètre de l'exclusion) | "may submit ... by noon of the next working day" | art. 5(4) ; exclusions art. 5(5) et 5(6) |
| 6 | Annexe II, champs | CONFIRMÉ avec corrections (voir section 4) | | URL 2025/302 |
| 7a | Menace significative, art. 10 RTS | CONFIRMÉ (trois conditions cumulatives) + précision | "all of the following conditions are fulfilled" | art. 10 |
| 7b | Notification volontaire, DORA art. 19(2) | CONFIRMÉ | "may, on a voluntary basis, notify significant cyber threats" | art. 19(2) DORA |

Détails des points 1, 5 et 7 :
- Art. 5(1) : l'échéance initiale est "as early as possible", avec les deux plafonds. Le plafond 24 h ne joue que si la classification a eu lieu avant. Pour un incident classé après 24 h, l'art. 5(2) fixe 4 h à compter de la classification. T9 : échéance 07h00, pas de retard.
- Art. 5(1)(b) : rapport intermédiaire "at the latest within 72 hours from the submission of the initial notification", mise à jour "without undue delay", et dès que "regular activities have been recovered". CONFIRMÉ.
- Art. 5(1)(c) : final "no later than one month" après l'intermédiaire ou le dernier intermédiaire mis à jour. CONFIRMÉ.
- Art. 5(3) : retard à signaler "without undue delay, but no later than the respective time limits", avec les raisons. CONFIRMÉ.
- Art. 5(5) : l'exclusion du report au jour ouvré vise "credit institutions, central counterparties, operators of trading venues" et les entités essentielles ou importantes NIS2 (Directive 2022/2555, art. 3). Notre spec omettait les contreparties centrales et les plates-formes de négociation. Elle visait aussi l'initial ET l'intermédiaire seulement : le final garde le report.
- Art. 5(6) : une autorité compétente peut exclure aussi d'autres entités significatives ou systémiques. À prévoir comme paramètre.
- Prestataire de services sur crypto-actifs : NON TROUVÉ dans la liste de l'art. 5(5). Il dépend de son statut NIS2 national. Rien dans le texte ne le nomme.
- Jour férié : "in the Member State of the reporting financial entity" (art. 5(4)). Le calendrier dépend de l'État du déclarant. À ajouter.
- Art. 10 RTS : condition (c) cite 6, 9(1) ou 9(4). Dernier alinéa : les seuils 9(2), (3), (5), (6) "may also be considered". Notre spec ne le disait pas.
- DORA 19(2) : voir aussi "when they deem the threat to be of relevance to the financial system, service users or clients". La notification est volontaire. Contenu : RTS 2025/301 art. 6 (a à j), dont (e) "classification criteria that would have triggered a major incident report". CONFIRMÉ.
- DORA 19(3) : NON présent dans notre spec. Obligation d'informer les clients "without undue delay" quand un incident majeur touche leurs intérêts financiers. À ajouter.

## 2. Classification (RTS 2024/1772) : ligne à ligne

| Élément de la spec | Verdict | Citation / précision | Article |
|---|---|---|---|
| Étape 0 : trois points de l'art. 6 | CONFIRMÉ | (a) systèmes de fonctions critiques ou importantes ; (b) services agréés, enregistrés ou supervisés ; (c) "successful, malicious and unauthorised access" | art. 6 |
| Étape 1 : majeur si services critiques ET (9(5)(b) OU deux autres seuils) | CONFIRMÉ | "two or more of the other materiality thresholds referred to in Articles 9(1) to (6)" | art. 8(1) |
| 9(1)(a) clients > 10 % | CONFIRMÉ | "higher than 10 % of all clients using the affected service" | art. 9(1)(a) |
| 9(1)(b) > 100 000 | CONFIRMÉ, précision : clients "using the affected service" | "higher than 100 000" | art. 9(1)(b) |
| 9(1)(c) contreparties > 30 % | CONFIRMÉ | "higher than 30 %" des contreparties du service | art. 9(1)(c) |
| 9(1)(d)(e) transactions > 10 % (nombre, valeur) | CONFIRMÉ | "daily average" lié au service touché | art. 9(1)(d)(e) |
| 9(1)(f) clients pertinents | CONFIRMÉ | renvoi art. 1(3) | art. 9(1)(f) |
| 9(2) réputation | CONFIRMÉ, texte lu | art. 2(1) : médias ; plaintes répétées ; exigences réglementaires non tenues ; perte de clients | art. 2 et 9(2) |
| 9(3) durée | CONFIRMÉ | voir point 2 ci-dessus | art. 9(3) |
| 9(4) géographie | CONFIRMÉ | "two or more Member States" | art. 9(4) |
| 9(5)(a) | CONFIRMÉ | "adverse impact on the implementation of the business objectives" ou capacité à respecter la réglementation | art. 9(5)(a) |
| 9(5)(b) | CORRIGÉ | voir point 3a ci-dessus | art. 9(5)(b) |
| 9(6) 100 000 euros | CONFIRMÉ | le texte dit "have exceeded or are likely to exceed" : subis OU probables | art. 9(6) |
| Estimation sur périodes comparables | CONFIRMÉ | "estimate ... based on available data from comparable reference periods" | art. 1(5) et 9(1) |
| Récurrence : au moins deux sur 6 mois, même cause, mensuel | CONFIRMÉ | "at least twice within 6 months" ; "on a monthly basis" | art. 8(2) |
| Exclusion micro-entreprises | CORRIGÉ : aussi les entités de l'art. 16(1) DORA | "does not apply to microenterprises and to financial entities listed in Article 16(1)" | art. 8(2) |
| Durée : début à l'occurrence, sinon détection, sinon journaux | NON dans la spec, à ajouter | "from the moment the incident occurs until ... resolved" | art. 3(1) |
| Indisponibilité : service "fully or partially unavailable" jusqu'au rétablissement du niveau antérieur | NON dans la spec, à ajouter. Une indisponibilité partielle compte. Utile pour T3b | "fully or partially unavailable" | art. 3(2) |
| Clients touchés | À AJOUTER : inclut ceux "unable to make use of the service" OU "adversely impacted" | | art. 1(1) |
| Transactions : montant monétaire, une partie dans l'Union | À AJOUTER | "involving a monetary amount where at least one part ... in the Union" | art. 1(4) |
| Coûts : liste a à h de l'art. 7(1) | À AJOUTER : fonds expropriés dont on est responsable, remplacement, personnel, pénalités, indemnisations, revenus perdus, communication, conseil. Exclus : maintenance courante, améliorations, primes d'assurance (7(2)) | "shall sum up the costs and losses" | art. 7(1), (2), (4) |
| Coûts : données disponibles au moment du rapport, sinon estimation | À AJOUTER | | art. 7(3) |
| Art. 10 : trois conditions | CONFIRMÉ | voir point 7a | art. 10 |

Remarque sur l'art. 9(5)(b) pour le moteur : (b) ne vise que l'accès non couvert par (a). La lecture A / B de l'ambiguïté n°1 reste une question d'interprétation. Le texte ne dit pas "contrat public". Il dit "access to network and information systems".

## 3. Délais et contenu (RTS 2025/301)

| Élément | Verdict | Article |
|---|---|---|
| Contenu initial : référence, détection, classification, description, critères, États membres, découverte, origine, plan de continuité, reclassement, autres | CONFIRMÉ. Spec cohérente avec la liste a à j | art. 2 |
| Intermédiaire : occurrence, rétablissement, type, menaces, zones, infrastructures, intérêt des clients, autres autorités, mesures, IoC | CONFIRMÉ | art. 3 |
| Final : causes racines, dates, résolution, autorités de résolution, coûts et récupérations, récurrence | CONFIRMÉ | art. 4 |
| Reclassement majeur vers non majeur à signaler dans l'initial | NON dans la spec : art. 2(i) "reclassification of the ICT-related incident from major to non-major" | art. 2(i) |
| Notification volontaire : contenu a à j | CONFIRMÉ | art. 6 |
| Entrée en vigueur du RTS | NON TROUVÉ dans mon extrait pour les dates d'application, texte : "twentieth day following that of its publication" | art. 7 |

## 4. Formulaire (ITS 2025/302, annexe II)

Colonnes de lecture : initial / intermédiaire / final. O = obligatoire, C = conditionnel, N = non demandé à ce stade. Numérotation lue dans la glossaire (annexe II), qui confirme 1.1 à 4.16.

| Champs | Libellé officiel | Initial | Interm. | Final |
|---|---|---|---|---|
| 1.1 | Type of submission (initial, intermédiaire, final, "reclassified as non-major") | O | O | O |
| 1.2, 1.3, 1.4 | Entité déclarante : nom, code, type d'entité | O | O | O |
| 1.5, 1.6 | Nom et LEI de l'entité touchée | C (si différente du déclarant, ou rapport agrégé) | C | C |
| 1.7 à 1.12 | Contacts principal et second | O | O | O |
| 1.13, 1.14 | Maison mère ultime : nom, LEI | C (si groupe) | C | C |
| 1.15 | Reporting currency | O | O | O |
| 2.1 | Code de référence de l'incident | O | O | O |
| 2.2 | Date et heure de détection (ISO 8601 UTC) | O | O | O |
| 2.3 | Date et heure de classification majeure (ISO 8601 UTC) | O | O | O |
| 2.4 | Description | O | O | O |
| 2.5 | Critères déclencheurs (choix multiple, 7 critères) | O | O | O |
| 2.6 | Seuils de "Geographical spread" | C (si seuil atteint) | C | C |
| 2.7 | Découverte (11 choix : IT Security, staff, ... attacker, monitoring systems ...) | O | O | O |
| 2.8 | Origine tiers ou autre entité : nom, code, type de code (LEI ou EUID) | C | C | C |
| 2.9 | Activation du plan de continuité (booléen) | O | O | O |
| 2.10 | Autres informations | C (si autre info ou reclassement) | C | C |
| 3.1 | Code de référence de l'autorité | N | C (si applicable) | C |
| 3.2 | Occurrence | N | O | O |
| 3.3 | Rétablissement | N | C (si 3.16 renseigné) | C |
| 3.4, 3.5, 3.6, 3.7 | Clients et contreparties (nombre, %) | N | O | O |
| 3.8 | Clients ou contreparties pertinents | N | C (si seuil atteint) | C |
| 3.9, 3.10, 3.11 | Transactions (nombre, %, valeur) | N | C (si touchées) | C |
| 3.12 | Réel, estimé ou aucun impact | N | O | O |
| 3.13, 3.14 | Réputation | N | C (si critère atteint) | C |
| 3.15 | Durée (DD:HH:MM) | N | O | O |
| 3.16 | Indisponibilité (DD:HH:MM) | N | C (si indisponibilité) | C |
| 3.17 | Durée et indisponibilité réelles ou estimées | N | C (si critère atteint) | C |
| 3.18, 3.19 | Impact dans les États membres | N | C (si seuil géographique) | C |
| 3.20, 3.21 | Pertes de données | N | C (si critère atteint) | C |
| 3.22 | Services critiques touchés | N | O | O |
| 3.23, 3.24 | Type d'incident, autre type | N | O ; 3.24 C | O ; C |
| 3.25, 3.26 | Menaces et techniques | N | C (si "cybersecurity-related") | C |
| 3.27 | Zones fonctionnelles et processus | N | O | O |
| 3.28, 3.29 | Infrastructures touchées | N | O ; 3.29 C | O ; C |
| 3.30 | Intérêt financier des clients | N | O | O |
| 3.31, 3.32 | Autres autorités ; précision "other" | N | O ; 3.32 C | O ; C |
| 3.33, 3.34 | Mesures temporaires | N | O ; 3.34 C | O ; C |
| 3.35 | Indicateurs de compromission | N | C (si cyber) | C |
| 4.1, 4.2, 4.3, 4.5 | Causes racines | N | N | O |
| 4.4 | Autre cause racine | N | N | C |
| 4.6 à 4.9 | Résolution, dates | N | N | O |
| 4.10 | Risque pour fonctions critiques (résolution) | N | N | C |
| 4.11 | Pertinent pour autorités de résolution | N | N | C |
| 4.12, 4.13, 4.14 | Seuil économique ; coûts bruts ; récupérations | N | N | O |
| 4.15, 4.16 | Incidents récurrents | N | N | C |

Corrections par rapport au tableau de la spec (section 4 de A) :
- Le champ 2.8 : le texte officiel de l'ITS demande nom, code d'identification et type de code (LEI ou EUID). Le format "NOM_LÉGAL;CODE;LEI ou EUID;INFO" vient des instructions ESAs, que je n'ai pas relues ici : NON TROUVÉ dans le règlement. À garder comme règle ESAs, pas comme texte du règlement.
- Le champ 2.6 n'est pas "étendue géographique" en général : il porte sur les seuils de géographie et il est conditionnel. Le contenu "États membres touchés" (RTS art. 2(e)) passe donc par 2.6 (conditionnel).
- Le champ 2.10 est conditionnel (autre info ou reclassement), pas libre.
- Le champ 1.1 n'est pas du profil : il change à chaque dépôt, avec le choix "major incident reclassified as non-major".
- 1.5 et 1.6 sont conditionnels, 1.13 et 1.14 conditionnels (groupe).
- Les champs 3.x sont "N" dans la notification initiale. La spec disait déjà que l'initial ne contient que 1.x et 2.x : CONFIRMÉ.
- Le champ 4.13 est défini comme montant brut. Le champ 4.14 est une valeur positive. Le champ 4.14 demande des unités avec "minimum precision equivalent to thousands of units".
- Date et heure : format "ISO 8601 standard UTC (YYYY-MM-DD Thh: mm:ss)". À respecter dans les exports.
- Durée et indisponibilité : format DD:HH:MM.

Annexes III et IV (menace significative, 20 champs) : lues. Tous obligatoires sauf 3 (conditionnel), 4, 5, 9, 10, 11, 18, 19, 20 (conditionnels). Champ 15 : sept critères au choix multiple.

## 5. DORA art. 17 à 23

| Article | Verdict | Remarque |
|---|---|---|
| 17 | CONFIRMÉ, non cité dans la spec | Procédure de gestion, enregistrement de tous les incidents et menaces significatives (17(2)), classification selon l'art. 18(1) (17(3)(b)) |
| 18(1) | CONFIRMÉ | Six critères (a à f), "in both absolute and relative terms" pour l'impact économique |
| 18(2) | CONFIRMÉ | Menace significative selon criticité, clients ciblés, étendue géographique |
| 19(1) | CONFIRMÉ | Obligation de notifier les incidents majeurs, avec modèles |
| 19(2) | CONFIRMÉ | Notification volontaire |
| 19(3) | À AJOUTER | Information des clients sans délai |
| 19(4)(a)(b)(c) | CONFIRMÉ | Initial, intermédiaire (changement significatif), final (analyse des causes terminée, chiffres réels) |
| 19(5) | À SIGNALER | Sous-traitance de la déclaration possible, la responsabilité reste à l'entité |
| 19(1) alinéa 4 | À AJOUTER | Impossibilité technique de remplir le modèle : prévenir l'autorité par un autre moyen |
| 20 à 22 | Lus ; sans impact sur le moteur | Art. 20 base légale des RTS et ITS ; art. 22 retour de supervision |
| 23 | À SIGNALER | S'applique aussi aux incidents opérationnels ou de sécurité liés aux paiements, pour établissements de crédit, de paiement, d'information sur les comptes et de monnaie électronique |

## 6. Liste des corrections à apporter à la spec A

1. Section 2, délais : supprimer la lecture stricte. Remplacer par l'art. 5(1)(a) et 5(2). Si la classification arrive plus de 24 h après la prise de connaissance, l'échéance est classification + 4 h, sans retard automatique.
2. Test T8 : le min() de la spec est correct pour une classification dans les 24 h. Ajouter la condition "classification dans les 24 h après la prise de connaissance".
3. Test T9 : sortie attendue = échéance 07h00, pas de retard. Supprimer la mention "juré KPMG" et la "lecture souple" comme source secondaire : c'est le texte de l'art. 5(2).
4. Seuil 9(5)(b) : écrire "accès non autorisé et réussi, malveillant, non couvert par (a), pouvant entraîner des pertes de données". Le moteur doit tester (a) d'abord.
5. Seuil 9(5)(a) : ajouter la condition d'impact sur les objectifs ou la conformité, et renvoyer vers les 4 volets de l'art. 5.
6. Seuil 9(2) : remplacer "texte non lu" par les quatre conditions de l'art. 2(1).
7. Art. 8(2) : ajouter l'exclusion des entités de l'art. 16(1) DORA, en plus des micro-entreprises.
8. Économique : préciser "brut, avant récupérations" (art. 7(1)), liste a à h, exclusions 7(2), estimation 7(3), somme 7(4).
9. Durée et indisponibilité : ajouter les règles de départ de l'art. 3 (occurrence, sinon détection, sinon journaux) et le fait que l'indisponibilité partielle compte. Réviser T3b en conséquence : le texte parle de "fully or partially unavailable".
10. Clients touchés : ajouter la définition de l'art. 1(1) (inclut ceux "adversely impacted"). Ambiguïté n°3 de la spec : le texte répond en partie, un client dont le retrait échoue est probablement "unable to make use of the service". À valider par un juriste.
11. Week-ends : exclusion étendue aux contreparties centrales et plates-formes de négociation (art. 5(5)), paramètre de l'art. 5(6), jour ouvré de l'État du déclarant, et seulement pour initial et intermédiaire. Prestataire crypto : NON TROUVÉ.
12. Art. 10 : ajouter l'alinéa final (seuils 9(2), (3), (5), (6) facultativement pris en compte).
13. Annexe II : appliquer le tableau de la section 4 (colonnes initial / intermédiaire / final, conditions). Corriger 1.1, 2.6, 2.10, 1.5 à 1.6, 1.13 à 1.14.
14. Champ 2.8 : mentionner que le format à point-virgule vient des instructions ESAs, pas du règlement.
15. Ajouter DORA art. 19(3) (information des clients), art. 19(1) alinéa 4 (impossibilité technique) et le reclassement en non majeur (RTS 2025/301 art. 2(i), champ 1.1 de l'ITS).
16. Format des dates (ISO 8601 UTC) et durées (DD:HH:MM) à reprendre dans les exports.
17. Mise à jour de la ligne de confiance : les textes officiels du JO (versions XHTML de l'Office des publications) ont maintenant été lus. Restent à relire : les instructions ESAs du 16/09/2026 (non rouvertes ici) et l'applicabilité des dates.

## 7. NON TROUVÉ ou non vérifié

- Statut du prestataire de services sur crypto-actifs vis-à-vis de l'art. 5(5) : non tranché par le texte.
- Instructions ESAs du 16/09/2026 : non rouvertes dans cette recherche.
- Dates d'application de chaque règlement : non vérifiées ligne à ligne.
- Droit national (jours fériés, désignation de l'autorité) : hors périmètre.

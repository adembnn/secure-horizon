# A. Spécification du moteur de classification DORA (v1, Claude-Titouan, 10/10/2026 ~22h40)

Confiance : les articles ont été lus via Springlex (aide à la lecture, sans valeur juridique) et les instructions ESAs du 16/09/2026 (ESMA, PDF lu en entier pour le champ 2.8). Le texte officiel (JO L 2024/1772 et 2025/301/302) n'a pas été lu directement. À faire relire par un juriste ou KPMG avant d'afficher.

## 1. Logique de décision exacte

**Étape 0, services critiques (RTS 2024/1772, art. 6).** L'incident touche-t-il les services critiques si au moins un point est vrai : (1) il affecte des systèmes qui supportent des fonctions critiques ou importantes ; (2) il affecte des services financiers soumis à agrément, enregistrement ou supervision ; (3) c'est un accès malveillant et non autorisé réussi aux réseaux et systèmes d'information de l'entité.

**Étape 1, majeur (art. 8 al. 1).** Majeur si services critiques touchés ET (le seuil de l'art. 9(5)(b) est atteint, OU au moins deux des autres seuils de l'art. 9(1) à (6) sont atteints).

**Seuils de l'art. 9.**
| Seuil | Condition |
|---|---|
| 9(1) clients, contreparties, transactions | clients touchés > 10 % des clients du service, OU > 100 000 clients ; contreparties financières > 30 % ; transactions touchées > 10 % du nombre moyen quotidien ; valeur touchée > 10 % de la valeur moyenne quotidienne ; clients ou contreparties jugés pertinents (art. 1(3)) touchés |
| 9(2) réputation | une des conditions de l'art. 2(1)(a) à (d) (texte non lu) |
| 9(3) durée | durée > 24 h, OU indisponibilité > 2 h pour des services supportant des fonctions critiques ou importantes |
| 9(4) étendue géographique | impact dans au moins deux États membres |
| 9(5) pertes de données | (a) atteinte à la disponibilité, l'authenticité, l'intégrité ou la confidentialité avec effet négatif sur les objectifs ou la conformité ; (b) accès malveillant, non autorisé et réussi aux réseaux et systèmes pouvant causer des pertes de données |
| 9(6) impact économique | coûts et pertes subis ou probables > 100 000 euros |

Quand les chiffres exacts manquent, estimer à partir de périodes de référence comparables (donc stocker l'historique du coffre).

**Étape 2, incidents récurrents (art. 8 al. 2).** Plusieurs incidents non majeurs peuvent former un seul majeur si au moins deux sur six mois, même cause apparente, et ensemble ils remplissent l'al. 1. Contrôle mensuel obligatoire. Ne s'applique pas aux micro-entreprises.

**Étape 3, menace cyber significative (art. 10), pour les attaques bloquées avant perte.** Les trois conditions doivent toutes être vraies : (a) impact potentiel sur fonctions critiques ou sur d'autres entités, (b) forte probabilité de se matérialiser (risques applicables, capacités et intention de l'acteur, persistance), (c) si elle se matérialisait, elle remplirait art. 6 ou art. 9(1) ou art. 9(4). La notification est volontaire (contenu : RTS 2025/301 art. 6, qui demande une classification hypothétique).

## 2. Délais (RTS 2025/301 art. 5)
- Notification initiale : "dès que possible", au plus tard 4 h après la classification en majeur, ET au plus tard 24 h après la prise de connaissance (les deux limites s'appliquent ; échéance = la plus proche). Lecture stricte retenue par défaut : un incident classé majeur après 24 h est déjà en retard et doit être signalé comme tel (voir T9). Une source secondaire propose une lecture souple (l'horloge de 4 h repart de la classification) : à trancher sur le Journal officiel, jamais en silence.
- Rapport intermédiaire : au plus tard 72 h après la notification initiale, puis mise à jour sans délai, et dès retour à l'activité régulière.
- Rapport final : au plus tard 1 mois après l'intermédiaire (ou le dernier mis à jour).
- Week-ends et jours fériés : dépôt possible avant midi le jour ouvré suivant, sauf pour les établissements de crédit et entités essentielles ou importantes NIS2 (initial et intermédiaire). Applicabilité à un prestataire crypto : à vérifier.
- Retard : prévenir l'autorité sans délai et au plus tard à l'échéance, avec les raisons.

## 3. Constat majeur pour le produit
La notification initiale ne contient que les champs 1.x et 2.x. Presque tout y est calculable sans jugement lourd : profil de l'entité, date de détection, date de classification, description, critères, origine tierce, activation du plan de continuité. C'est ce qui doit sortir **en moins de 4 h**. Les champs 3.x (chiffres d'impact) se remplissent surtout par la chaîne. Les champs 4.x (cause racine, résolution, coûts) sont surtout humains. Le PoC doit donc exceller sur l'initial et pré-remplir l'intermédiaire.

## 4. Classement des champs (ITS 2025/302, annexe II, via Springlex, numérotation à recouper avec le JO)
Légende : P = chaîne (prouvable on-chain) ; F = profil de l'entité saisi une fois ; H = jugement humain ; IA = texte proposé par l'IA, validé par un humain ; C = calculé par le moteur.

| Champs | Contenu | Source |
|---|---|---|
| 1.1 à 1.15 | Identité, type d'entité, contacts, groupe, devise | F |
| 2.1 | Code de référence de l'incident | C |
| 2.2 | Date/heure de détection | P (premier signal de la Sentinelle) |
| 2.3 | Date/heure de classification en majeur | H (horodatée au clic de l'humain) |
| 2.4 | Description | IA + preuves |
| 2.5 | Critères déclencheurs | C (affichage des seuils atteints) |
| 2.6 | Étendue géographique | F + H |
| 2.7 | Mode de découverte | C (alerte automatique) |
| 2.8 | Origine tiers/autre entité | F (registre des tiers) ; UN SEUL format, celui des instructions ESAs : NOM_LÉGAL;CODE;LEI ou EUID;INFO. Code absent : NOM_LÉGAL;;;motif de l'absence, plus un drapeau humain visible (jamais de code deviné) |
| 2.9 | Activation du plan de continuité | H |
| 2.10 | Autres informations | IA/H |
| 3.2 | Date/heure d'occurrence | P |
| 3.3 | Date/heure de rétablissement | P (levée du palier) |
| 3.4 à 3.7 | Clients et contreparties touchés (nombre, %) | P si les dépôts par client sont lisibles ; dénominateur en F |
| 3.8 | Impact sur clients pertinents | H |
| 3.9 à 3.11 | Transactions touchées (nombre, %, valeur) | P, base de référence historique de la chaîne |
| 3.12 | Chiffres réels ou estimés | C |
| 3.13, 3.14 | Réputation | H |
| 3.15 à 3.17 | Durée, indisponibilité, réel/estimé | P (durée de palier mesurée) |
| 3.18, 3.19 | Impact autres États membres | F + H |
| 3.20, 3.21 | Pertes de données | H (lecture 9(5)) |
| 3.22 | Services critiques touchés | F + H |
| 3.23 | Type d'incident | H avec proposition |
| 3.25 | Menaces et techniques | C (correspondance avec ATT&CK) |
| 3.27 à 3.29 | Zones fonctionnelles, infrastructures | F + P (adresses de contrats) |
| 3.30 | Impact sur l'intérêt financier des clients | P + H |
| 3.31, 3.32 | Signalement à d'autres autorités | H |
| 3.33, 3.34 | Mesures temporaires | P (journal de réponse) |
| 3.35 | Indicateurs de compromission | P (adresses, transactions) |
| 4.1 à 4.9 | Causes racines, résolution | H, IA propose |
| 4.12 à 4.14 | Impact économique, coûts bruts, récupérations | P pour les fonds sortis et gelés ; H pour le reste ; conversion en euros via une source de prix datée |
| 4.15, 4.16 | Incidents récurrents | C (contrôle mensuel) |

## 5. Ambiguïtés juridiques à exposer, jamais à trancher en silence
1. **Un exploit de contrat est-il un "accès non autorisé" au sens de l'art. 9(5)(b) ?** Lecture A : oui (clé d'administration compromise, accès au système). Lecture B : non (un contrat public a été appelé comme prévu techniquement). Le moteur affiche les deux résultats. Majeur retenu par défaut avec la lecture prudente, un humain tranche.
2. **Le coffre supporte-t-il une fonction "critique ou importante" ?** Décision du profil de l'entité, pas de la chaîne.
3. **Comptage des clients touchés** : un retrait individuel qui échoue à cause d'un plafond compte-t-il comme "affecté" ? Définir et afficher la règle.
4. **Valeur en euros** : source de prix et heure à citer ; l'art. 9(6) parle de coûts et pertes subis ou probables.
5. **"Non majeur"** : seconde signature exigée (idée d'Adem, à garder), et motif conservé.

## 6. Jeu de tests proposé (entrées, sortie attendue selon la lecture A / B)
| # | Scénario | Sortie A | Sortie B |
|---|---|---|---|
| T1 | Drain stoppé en 3 min, perte 40 k€, coffre = service agréé | majeur (9(5)(b)) | non majeur, menace art. 10 à évaluer |
| T2 | Drain de 600 k€ | majeur | majeur (9(6), plus 9(3) si > 2 h) |
| T3 | Pause TOTALE de 3 h sur fausse alerte (tous les clients du service bloqués) | majeur probable : 9(1) (plus de 10 % des clients touchés) + 9(3) (plus de 2 h), si services critiques (corrigé après le juré KPMG) | idem |
| T3b | Voie lente PARTIELLE de 40 min sur fausse alerte (seuls les retraits suspects attendent) | non majeur : aucun seuil de durée atteint, à confirmer avec la règle de comptage des clients | idem |
| T4 | Pause de 3 h et 15 % des clients touchés | majeur (9(1) + 9(3)) | idem |
| T5 | Attaque bloquée par le contrat, aucun fonds sorti | non majeur, menace significative à évaluer | idem |
| T6 | Deux incidents mineurs en 4 mois, même cause | majeur par récurrence si ensemble ils remplissent l'al. 1 | idem |
| T7 | Oracle sans LEI à l'origine de l'incident | champ 2.8 produit "NOM_LÉGAL;;;motif de l'absence" (format unique) + drapeau humain visible | idem |
| T8 | Détecté à 02h00, classé à 09h00 | échéance = min(09h00 + 4 h = 13h00, 02h00 + 24 h = 02h00 J+1) = 13h00 | idem |
| T9 | Détecté à 02h00 J, classé à 03h00 J+1 (au-delà de 24 h après la prise de connaissance) | lecture stricte (retenue par défaut, juré KPMG) : les deux limites s'appliquent, l'échéance 02h00 J+1 est déjà dépassée, donc RETARD : prévenir sans délai avec les raisons (RTS 2025/301 art. 5, retard). Lecture souple (une source secondaire) : l'horloge de 4 h repart de la classification, échéance 07h00. À trancher sur le texte officiel | idem |
| T10 | Dépôt tombant un dimanche, entité non crédit | possibilité de midi lundi (à vérifier pour les prestataires crypto) | idem |

## 7. Questions ouvertes
- Qui, dans la démo, est le "responsable conformité" qui clique "classer" ? Une clé de test ?
- Quelle source de prix pour la conversion en euros, et comment la rendre rejouable ?
- Définition de "client touché" dans un coffre où les dépôts sont agrégés ?
- Le contrôle mensuel des incidents récurrents est-il dans le périmètre de la démo ?

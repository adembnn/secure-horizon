# Pitch 3 minutes (v1, nom de projet à choisir)

Statut : brouillon. Chiffres issus de la recherche d'Adem et d'une vérification web du 10/10/2026. Voir la section "À ne pas dire" avant d'afficher quoi que ce soit.

## Fil conducteur
Léa, responsable sécurité d'une plateforme qui garde l'argent de 50 000 clients (société fictive).

## Texte parlé (environ 3 min)

**0:00 Crochet (15 s)**
"Le vol de 285 millions chez Drift, en avril, a commencé neuf jours avant que quelqu'un s'en aperçoive. Nous avons construit l'outil qui l'aurait vu venir."

**0:15 Le problème (35 s)**
"Voici Léa. Elle est responsable sécurité d'une plateforme qui garde l'argent de 50 000 clients. Un vendredi, à 3 h du matin, un pirate prend le contrôle d'un compte administrateur. Léa dort. Les plus gros vols de 2026 ne sont pas des bugs de code : ce sont des clés, des signataires, des prestataires. Et la réaction est tout ou rien : on coupe tout, ou on ne fait rien. Ensuite, la loi européenne DORA exige de déclarer l'incident en quatre heures. À la main, sous stress. Les régulateurs constatent que ces délais sont rarement respectés."

**0:50 La solution (30 s)**
"Notre outil fait trois choses. Un : il voit la préparation, par exemple un signataire ajouté ou un seuil abaissé. Deux : il limite la casse en quelques blocs, avec un verrou qui s'ouvre tout seul, et les petits retraits des clients honnêtes continuent. Trois : il écrit le dossier de déclaration, où chaque champ pointe vers sa preuve."

**1:20 Démo (60 s)**
[Écran : trafic normal, zéro alerte.]
"Le jour J moins neuf, accéléré : un signataire est ajouté, le seuil baissé. L'alarme sonne."
[Écran : alerte niveau 1.]
"Le pirate tente de vider le coffre par petits retraits. Le plafond se déclenche, l'acteur est mis en quarantaine."
[Écran : jauge "argent protégé" qui monte, chrono DORA qui descend.]
"Pendant ce temps, un client légitime retire 200 euros : ça passe."
[Écran : dossier DORA, clic sur un champ, la transaction s'ouvre.]
"Chaque champ de la déclaration est prouvé. Le sceau du dossier est inscrit sur la blockchain."

**2:20 Rigueur (25 s)**
"Nos règles ont été scellées sur la blockchain avant que nous écrivions les attaques de test, comme dans un essai clinique. Nous ne pouvons pas tricher. Et nous publions nos ratés : voici ce que nous ne détectons pas, et combien de clients honnêtes nous avons gênés."

**2:45 Responsabilité et fin (15 s)**
"Le modèle ne décide jamais de la pause : ce sont des règles signées par la direction. L'humain valide la déclaration. Prévenir, limiter, prouver."

## Questions probables, réponses courtes
- Hypernative et Hexagate existent ? Oui, nous nous branchons dessus. Notre apport : la couche après l'alerte et la preuve.
- Un attaquant qui lit le code évite le leurre ? Oui. Le leurre n'est qu'une couche, avec les règles déterministes.
- Qui est responsable si ça se trompe ? L'entité régulée. La direction signe le mandat, c'est horodaté.
- Vos tests sont synthétiques ? Oui, nous le disons. Les règles sont scellées avant, et les ratés publiés.
- Pourquoi la blockchain ? Le coffre est sur la chaîne donc lisible par tous, la réponse est du code qu'on ne convainc pas socialement, et le sceau permet à l'auditeur de vérifier sans nous croire. Le dépôt à l'autorité et les données personnelles restent hors chaîne.

## À ne pas dire
- "Conforme DORA" : dire "aide à préparer la déclaration".
- "Une seule transaction" pour Tectonic : faux (120,4 M$ empruntés sur 9 marchés, détecté après environ 36 min).
- Blocs d'une seconde : non confirmé, mesurer sur Fuji.
- "Aucun outil ne fait ça" : non prouvé. Dire "nous n'en avons pas trouvé".
- ERC-7265 comme standard : statut inconnu.
- BUIDL comme assujetti à DORA : non établi. Utiliser une société fictive.
- Les 29 % de tiers et 10 % de cyber (ESAs) : à revérifier.
- Les 33 incidents AMF : surtout des sociétés de gestion, pas des CASP.

## Avant le pitch
Faire relire les règles de classification DORA (RTS 2024/1772) et la notification volontaire (art. 19(4), numérotation à confirmer).

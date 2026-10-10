# Plan de présentation finale (v1, sous-agent "directeur de présentation", 10/10/2026 ~minuit)

Statut : plan, non répété. Les chiffres d'écran sont des cibles tant que le banc d'essai n'a pas tourné. Durées selon le Notion : round 1 de 5 min + 2 min de Q&R ; finale de 3 min + 3 min de Q&R (à reconfirmer sur place, des photos du lancement donnent d'autres formats).

## 1. Stratégie
- **Phrase d'idée** : "Quand un coffre crypto est attaqué, Sentinelle plafonne la perte dans le contrat, puis remet au responsable un dossier de déclaration où chaque champ se prouve en un clic."
- **Chiffres** : "X € sauvés sur Y", mesuré sur Fuji, et la comparaison avec Bitget (moins de 0,3 % des fonds gelés en environ un jour, sources divergentes). Second chiffre : l'horloge de 4 heures.
- **Moment wow** : écran partagé, deux coffres identiques, même attaque. À gauche (sans Guard) le compteur "perdu" grimpe ; à droite (avec Guard) le 3e retrait devient rouge, "BLOQUÉ par le plafond du contrat", et le compteur se fige. Lisible en 10 secondes, sans voix : c'est l'équivalent de la lisibilité de Trustee.
- **Fil rouge** : Léa, responsable sécurité, dont l'enjeu est l'horloge de 4 h. Elle ouvre et ferme le pitch, ne parle jamais de "règles de détection".
- **Interdits** : "zéro faux positif", "conforme DORA", "le rapport s'écrit tout seul". On dit "prêt à relire en 4 heures".

## 2. Storyboard de la vidéo (2 min 45, sous-titres, lisible sans voix)
Écran permanent : deux coffres côte à côte, compteur "perdu" rouge, compteur "sauvé" vert.
1. 0:00-0:10 carton : "Même attaque. Deux coffres. Un seul a Guard." Source citée de Bitget.
2. 0:10-0:22 Léa a 4 heures pour déclarer. Horloge 4:00:00 affichée, pas lancée.
3. 0:22-0:50 attaque : retraits 1 et 2 passent, le 3e rouge. Preuve : clic, page de l'explorateur Fuji sur la transaction refusée.
4. 0:50-1:05 voie lente : un gros retrait légitime attend 5 min ("en attente, un humain peut libérer"). Réponse visible au reproche de faux positifs.
5. 1:05-1:15 résultat : "X € sauvés sur Y. Détection en N blocs", avec l'identifiant d'exécution.
6. 1:15-1:40 dossier : l'horloge démarre ; "N champs sur M prouvés sur la chaîne, le reste est profil ou jugement humain" ; clic sur un champ, la transaction s'ouvre.
7. 1:40-2:00 l'humain décide : aucune case pré-cochée ; nom et heure s'inscrivent ; hash du dossier ancré sur Fuji (lien).
8. 2:00-2:30 tableau honnête : détection par attaque, faux positifs pour 10 000 transactions, délai en blocs, ratés en rouge ; "règles scellées sur Fuji avant les tests" (lien daté) ; "attaques écrites en aveugle par [nom]".
9. 2:30-2:45 limites et fermeture : "Watch ne bloque rien. Une attaque en une transaction ne s'arrête que par l'invariant du contrat. Nous n'avons pas trouvé d'outil qui relie ces deux mondes." Dépôt et adresses des contrats.

## 3. Pitch
**Finale, 3 min** : 0:00-0:20 ouverture de Léa ; 0:20-0:50 problème (le vol va vite, la déclaration est manuelle, délais "rarement respectés") ; 0:50-1:20 solution (Guard, Watch, Dossier) ; 1:20-2:20 démo (extrait de la vidéo, en direct si Fuji répond) ; 2:20-2:40 honnêteté (méthode scellée, ratés, limites) ; 2:40-3:00 fermeture : "L'outil ne remplace pas Léa. Il lui donne 4 heures qui ont enfin de la valeur."
**Round 1, 5 min** : 0:00-0:30 ouverture ; 0:30-1:15 problème et pour qui ; 1:15-2:00 les trois pièces et qui décide quoi ; 2:00-3:30 démo complète avec voie lente ; 3:30-4:20 preuves (pré-enregistrement, attaques en aveugle, métriques, défenses de l'outil) ; 4:20-5:00 limites, suite (grants, pilote), fermeture.

## 4. Deck (8 slides)
1 Titre, phrase d'idée, adresses Fuji. 2 Le problème (Bitget daté et sourcé). 3 Pour qui, quel point d'entrée. 4 La solution en trois cases. 5 Démo : capture de l'écran partagé avec lien explorateur. 6 Preuves : règles scellées, attaques en aveugle, tableau avec ratés. 7 Qui décide quoi et conformité (sans "conforme DORA"). 8 Équipe, modèle, suite.
Annexes : NIST CSF 2.0, ATT&CK, détail DORA, table des champs, architecture, modèle de menace sur l'outil, glossaire.

## 5. Fiche de défense (une page)
Titre et phrase ; scénario de menace ; fonctions NIST CSF 2.0 (Detect, Respond, Govern pour le mandat) ; techniques ATT&CK (T1657, T1078) ; métriques avec dénominateurs ; méthode (règles scellées, attaques en aveugle, trois évasions) ; qui décide quoi ; limites et ratés ; liens (dépôt, contrats, hash des règles).

## 6. Plan B de démo
Fuji tombe : rejeu local avec captures horodatées des mêmes transactions, annoncé comme "enregistrement du [heure]". Wi-Fi tombe : vidéo locale et exécution du banc en local. IA tombe : l'outil est conçu pour marcher sans elle (champs de texte libre "à rédiger par un humain"). Tout tombe : la vidéo lue sur place et les captures imprimées. Un seul bouton de rejeu, testé. Avant : 3 transactions Fuji de référence, un jeu de captures horodatées, la vidéo en deux formats.

## 7. Les 10 questions dangereuses (20 secondes)
1 "Vos attaques et règles sont écrites par vous" : règles scellées avant, une partie des attaques en aveugle, ratés publiés. 2 "Un limiteur suffit pour un drain rapide" : oui, c'est le but ; notre apport est la voie lente, la preuve et le dossier ; le drain lent est dans les ratés mesurés. 3 "Aucun prestataire ne met un contrat de hackathon dans son périmètre" : Guard s'ajoute à un coffre existant ; sans point d'application, Watch lit seulement. 4 "Si votre modèle se trompe ?" : il ne décide de rien ; règles signées par la direction, un humain qualifie, un humain dépose. 5 "Une pause crée un incident" : expiration dure à 30 minutes, signaux incertains plafonnés à la voie lente. 6 "Empoisonnement de la ligne de base" : plafonds en dur, ligne de base figée, signée, dérive maximale. 7 "Êtes-vous conformes DORA ?" : nous ne le disons pas ; dossier prêt à relire ; textes à relire avec un juriste. 8 "Attaque en une transaction ?" : seul l'invariant du contrat l'arrête ; c'est dans nos limites. 9 "Hypernative le fait déjà" : il détecte et met en pause, nous l'acceptons en entrée ; nous n'avons pas trouvé d'outil qui produit le dossier avec preuve par champ. 10 "Vos chiffres, qui paie ?" : données synthétiques, dénominateurs affichés ; prix non vérifié, à construire avec un pilote.

## 8. Calendrier de répétition (à décaler si la deadline change)
Écrire le script de Léa et figer les chiffres d'écran ; enregistrer le premier montage avec le vrai produit ; dormir ; répétition 1 chronométrée sans diapos (relever les mots de jargon) ; répétition 2 avec les 10 questions posées par l'autre membre, test du plan B en coupant vraiment le Wi-Fi ; atelier coaching pitch (dim. 10h00) ; deux répétitions complètes (5 min puis 3 min) une heure avant ; pas de modification dans les 15 dernières minutes ; entre round 1 et finale, réduire à 3 min en intégrant les questions entendues.

## 9. Cinq risques de présentation
1 Fuji ou le Wi-Fi tombe : plan B en un bouton. 2 Trop technique pour un jury généraliste : Léa et l'horloge, aucun sigle sur les 90 premières secondes, répétition devant un externe. 3 On promet trop : liste d'interdits au mur. 4 "X € sauvés" jugé circulaire : montrer pré-enregistrement, attaques en aveugle et ratés avant la question. 5 Dépassement de temps : une seule démo, minuteur visible, coupe prévue (voie lente).

## 10. Comparaison avec Trustee
Trustee : utilisateur ordinaire, un clic, score lisible, explication claire, compris en 10 s, installable. Nous : pas d'utilisateur grand public ni de score immédiat. Compensations : l'écran partagé remplace le score ; le compteur "X € sauvés" remplace la note de risque ; la phrase à l'écran "voilà pourquoi on a bloqué : le plafond du contrat" remplace l'explication ; le clic vers l'explorateur remplace le clic de l'extension et apporte une preuve vérifiable ; Léa donne le visage humain. Ne jamais dire que nous sommes "mieux" : Trustee protège un acheteur, nous protégeons un régulé qui doit prouver sa décision.

## Points ouverts
Qui joue le responsable conformité ; valeurs de "X € sauvés sur Y" et des faux positifs (non vérifiées tant que le banc n'a pas tourné) ; format exact de la finale ; aucun chiffre externe nouveau n'a été ajouté par ce rapport.

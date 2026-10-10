# B. Modèle de menace, échelle de réponse et voie lente (v1, Claude-Titouan, 11/10/2026 ~00h30)

Statut : conception, rien n'est construit. Tous les seuils sont des hypothèses à calibrer sur le banc d'essai ; aucun n'est une valeur sourcée. Issu de deux tours de 7 jurés (moyenne 63,3 puis 70,1) et des attaques proposées par le juré "attaquant".

## 1. Principe directeur
Chaque couche doit continuer à protéger quand la couche d'au-dessus ment, tombe ou est attaquée. Ordre d'indépendance, du plus sûr au moins sûr :
1. Plafond local écrit dans le contrat : ne dépend d'aucune donnée externe, d'aucun bot, d'aucun humain.
2. Moniteur hors-bande : lit la chaîne via plusieurs RPC, peut seulement resserrer.
3. Humains d'astreinte : lèvent, qualifient, déposent.
Règle d'arbitrage entre un contrat et le moniteur : **le plus strict gagne pour les sorties** ; le moniteur ne peut jamais assouplir un plafond du contrat.

## 2. Échelle de réponse (hypothèses de seuils)
| Palier | Déclencheur | Action | Durée | Qui |
|---|---|---|---|---|
| L0 | rien | surveiller | | machine |
| L1 | signal faible isolé (destination jamais vue, heure hors profil) | alerte à l'astreinte | | machine |
| L2 | part de la réserve sortie > X % sur une fenêtre de N blocs, OU changement de signataire / seuil / module / garde hors timelock | resserrer le plafond ; retraits suspects en voie lente | borné (voir 3) | machine, réversible |
| L3 | invariant du contrat violé (stock, réserve) | pause du module concerné seulement | expiration dure 30 min | règle du contrat, sans dépendance externe |
| Levée / pause plus longue | | humain | | 2 humains sur 3 |
Les signaux probabilistes plafonnent à L2. Une pause totale n'existe pas : elle créerait un incident DORA par indisponibilité (voir spec A, T3).

## 3. Voie lente : spécification (hypothèses)
Objectif : ralentir les sorties suspectes sans bloquer les clients honnêtes, et rester utilisable sous attaque de saturation.
- **Passage immédiat** pour un retrait inférieur à un seuil petit (a % de la réserve ET en dessous d'un plafond par adresse et par jour). Mesure à publier : proportion de retraits légitimes qui passent sans attente.
- **File par client**, avec quota par adresse source et par destination. Un acteur ne peut occuper qu'une fraction fixe de la file.
- **Capacité de la file bornée par un plafond dur** indépendant du nombre de demandes suspectes. Au-delà, les nouvelles demandes suspectes sont refusées, pas empilées devant les honnêtes.
- **Délai** : 5 minutes par défaut (hypothèse), maximum 30. Jamais proche des 2 heures de l'art. 9(3).
- **Libération** : humain d'astreinte nommé dans le mandat ; sans réponse, la demande suit son délai et reste soumise au plafond.
- **Visibilité client** : statut "en attente de vérification de sécurité", durée estimée, motif générique. Pas de détail exploitable par un attaquant.
- **Mesure** : dommage collatéral = nombre de clients légitimes retardés et durée totale d'attente, publié avec le reste du banc.

## 4. Attaques contre l'outil lui-même (jurés, tours 1 et 2) et parades
| Attaque | Parade |
|---|---|
| Empoisonner la ligne de base (retraits croissants "légitimes", ou présence pendant le mode ombre) | Plafonds absolus en dur ; ligne de base figée sur une période validée par signature, dérive maximale ; le mode ombre n'écrit jamais dans la ligne de base de production |
| Épuiser le budget quotidien de resserrages avec du bruit | Le budget épuisé ne retire jamais le plafond dur ; au-delà, un humain décide |
| Provoquer une fausse pause pour créer un incident DORA | Pause automatique seulement sur invariant du contrat, expiration dure 30 min ; signaux probabilistes plafonnés à L2 |
| Voler la clé du bot | Clé qui ne peut que resserrer ; ancrage signé par une autre clé ; clés de démo jetables ; en production HSM ou MPC |
| Saturer la voie lente avec de faux retraits suspects | File par client, quota par source, capacité bornée, refus au-delà (section 3) |
| Désynchroniser le budget global multi-chaînes (consommer A puis frapper B à G ; ou faire croire à A que tout est saturé) | Chaque contrat garde un plafond local autonome sans donnée externe ; le moniteur n'envoie que des resserrements ; le plus strict gagne ; quorum de RPC pour les lectures |
| Mettre le callback custodian en panne (déni de service) | Mode dégradé fermé mais pas total : plafond de secours petit et fixe pour les retraits courants, issue humaine chiffrée en minutes, panne comptée comme indisponibilité DORA ; si le test réel du callback échoue, il sort du récit |
| Fatiguer l'astreinte avec des signaux de bas niveau, puis cacher le vrai drain | Cible chiffrée d'alertes par astreinte et par jour ; L1 n'alerte pas l'humain mais s'enregistre ; seules L2 et plus réveillent |
| RPC qui ment sur la plupart des chaînes | Quorum de RPC ; le plafond local ne dépend d'aucun RPC |
| Insider qui modifie les règles | Règles versionnées, hash scellé avant, changement par mandat signé, journal ancré par une autre clé |

## 5. Exploitation (question du RSSI : "qui tient ça à 3 h du matin ?")
- Le plafond dur tient seul : le moniteur en panne ne retire aucune protection.
- Le moniteur est une alerte, avec un SLA affiché (hypothèse à fixer avec un pilote) et un mode "dégradé visible" sur l'écran.
- Mise à jour des règles : cycle proposition, rejeu, mode ombre, signature de la direction, nouvelle version scellée.
- Responsabilités à écrire dans le mandat : qui héberge le moniteur, qui met à jour, qui est d'astreinte, qui répond de quoi. Sans cela, la thèse "outil prêt à adopter" reste un plan.

## 6. Mandat minimal en priorité P0 (demande du juré Avalanche)
Trois lignes signées avec une clé de démo jetable : plafond maximal, durée maximale de voie lente, personnes habilitées à libérer. Le modèle de production (HSM ou MPC) tient en une phrase. Le mandat complet (astreinte, escalade) reste P1.

## 7. Ce qui reste sans réponse
Valeurs de X, N, a, et du délai de voie lente ; faisabilité du callback custodian ; règle de comptage des clients affectés par la voie lente (9(1)) ; qui joue le responsable conformité ; durée de la période de mode ombre.

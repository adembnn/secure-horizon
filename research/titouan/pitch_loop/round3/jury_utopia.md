# Jury Utopia, round 3, PITCH V5

## 1. Note
- Détection : 23/30 (+2)
- Réponse : 15/20 (+2)
- Faisabilité : 17/20 (+2)
- Conformité : 11/15 (+1)
- Pitch : 13/15 (+2)
- TOTAL : 79/100 (round 2 : 70, écart +9)

## 2. Défauts du round 2
- Injection : résolu. « Il ne lit que le sens de la phrase, le code lit les montants et les adresses, et il ne peut pas baisser une alerte du code. » Zéro violation sur 1 079 paires. C'est testable.
- Précision de lecture du modèle (73 % / 38 %) : non. Toujours absente. C'est le chiffre qui dit si le modèle sert à quelque chose.
- Quel chemin donne 1,3 % et 50 ms : partiel. Le relais est optionnel et le délai de 2 s est dit. Mais on ne sait pas si 86,6 % est mesuré avec ou sans modèle.
- AI Act : non. Le NIST a disparu, rien ne le remplace. Le journal chaîné est honnête (« rejeu partiel »). Base légale « à rédiger » : franc, mais c'est un trou.
- 13 % qui passent : partiel. Le rappel est dit, pas le reste.
- Objectif daté sur le jeu aveugle : non. Le jeu est scellé, aucun seuil annoncé.
- Dépassement de temps : résolu.

## 3. Nouveaux défauts
- Les gains viennent d'une grille écrite par les mêmes auteurs. « Scellé » ne vaut pas indépendance.
- « 17 % dans le meilleur cas » reste choisi après coup.
- Le modèle ne baisse jamais une alerte : alors à quoi sert-il, chiffres à l'appui ? Il n'y a aucune mesure de son apport.
- « Zéro violation » est mesuré sur les 1 079 paires, pas sur des attaques adverses contre la phrase.

## 4. Temps de parole
Comptage réel : 557 mots, hors titres, soit 4 min 17 à 130 mots par minute. Sous la cible de 650 mots. Il reste environ 30 secondes de marge sur 4 min 50. Pas de pénalité.

## 5. Les 3 derniers changements
1. Ajouter : « Le modèle lit juste le type de phrase dans 73 % des cas sur nos phrases, 38 % sur des tournures neuves. En dessous, nous demandons confirmation. » Gain +3 (détection 2, faisabilité 1).
2. Ajouter : « AI Act : une décision, une ligne rejouable, version du modèle inscrite, l'humain tranche. DORA, MiCA : au déployeur. » Gain +2 (conformité).
3. Ajouter : « Objectif avant la finale : sous 30 % d'honnêtes avertis, mesuré une seule fois sur le jeu aveugle, et dire si 86,6 % vaut avec ou sans modèle. » Gain +2 (réponse, détection).

## 6. Verdict
Injection et temps réglés, mais la précision du modèle et le cadre AI Act manquent encore : 79/100.

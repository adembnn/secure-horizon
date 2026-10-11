# Jury AWS, round 3

## 1. Note
- Détection : 19/30
- Réponse : 14/20
- Faisabilité et intégration : 13/20
- Conformité et explicabilité : 12/15
- Pitch et démo : 13/15
- TOTAL : 71/100. Écart : +5 (66 au round 2).

## 2. Défauts du round 2
- Pas de MetaMask réel, rien sur Fuji : non. « L'essai avec un vrai MetaMask est en cours. » Toujours une promesse. Plus d'extension MV3 ni de méthodes interceptées.
- 54 % d'avertissements : partiel. Dit sans détour, mais aucune cible chiffrée.
- Latence avec relais : partiel. Le délai de 2 s est posé. Le temps mesuré avec relais manque.
- Point d'insertion : partiel. « Extension devant le portefeuille ». Si le site contourne ? Pas dit.
- Banque ou exchange : partiel. Une phrase, mais « non construit ». Honnête, sans API de verdict ni SIEM.
- Journal : partiel. « Rejeu partiel », pas de version du modèle.
- Repli local sans modèle : partiel. Les règles décident, précision inconnue.
- Relais contre « rien n'est envoyé » : résolu. Désactivé par défaut, base légale à rédiger.
- Fail-closed : résolu, avec délai de 2 s.
- Densité : résolu en grande partie.

## 3. Nouveaux défauts
- Le relais est désactivé par défaut. On ne sait donc pas quel chemin la démo montre.
- Trois scènes de démo en 60 secondes : la scène trois n'a pas de résultat montré.
- « Zéro violation sur 1 079 paires » : mesuré sur des cas écrits par l'équipe, c'est fragile.
- Aucune charge, aucun coût par vérification, aucun passage à l'échelle.

## 4. Temps de parole
542 mots comptés par script, du premier 0:00 à « Questions probables », sans titres. À 130 mots par minute : 4 min 10 s. Les segments annoncent 4:50. Il reste environ 40 secondes de marge. Le texte tient.

## 5. Les 3 derniers changements
1. Remplacer « L'essai avec un vrai MetaMask est en cours » par « Extension MV3, interception de eth_sendTransaction et eth_signTypedData. Essai MetaMask réel sur Fuji : résultat affiché à la démo ou retiré du pitch. » Gain : +2 faisabilité.
2. Ajouter dans la zone libre de 40 secondes : « Cible : moins de 10 % d'avertissements sur l'honnête, en taisant les routines connues. » Gain : +2 détection.
3. Remplacer « le rejeu est partiel » par « chaque ligne garde règle, version du modèle, hash de la demande : un auditeur rejoue ». Ajouter « API de verdict sans état, export SIEM : prévu ». Gain : +1 conformité, +1 faisabilité.

## 6. Verdict
Texte propre, tenu en 4 min 10 s et honnête sur ses limites, mais l'intégration réelle reste promise et non prouvée : 71, solide, pas encore déployable.

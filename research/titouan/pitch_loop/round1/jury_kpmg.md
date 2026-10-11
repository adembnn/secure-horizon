# Jury KPMG, round 1, pitch V3

## 1. Note
- Détection : 17 / 30
- Réponse : 10 / 20
- Faisabilité et intégration : 11 / 20
- Conformité et explicabilité : 7 / 15
- Pitch et démo : 11 / 15
- **TOTAL : 56 / 100**

## 2. Ce qui me convainc
1. L'honnêteté sur les chiffres. Chaque chiffre a son statut. Le 54,2 % d'honnêtes avertis est avoué comme point faible. Le 228 sur 228 est dit "test de couverture, pas indépendant". Rare en salle.
2. Le jeu aveugle de 250 cas avec hash publié, ouvert une seule fois. C'est de la preuve, pas de la promesse.
3. Le journal chaîné par hachage et "la personne garde le dernier geste". J'ai de quoi construire une piste d'audit.

## 3. Ce qui m'a fait décrocher ou douter
- "Dans les plus gros cas, les signatures de droits de dépense pèsent 38 % des pertes." C'est 3 cas sur 11 vols de plus d'un million. Ce n'est pas "38 % des pertes". Un auditeur le recalcule en trente secondes.
- "Verdict local en 18 millisecondes." Votre table dit médiane 32 ms, "retenir sous 50 ms". Vous citez une ancienne exécution.
- "Sur 6 325 transactions réelles d'Avalanche, 0,30 % d'alertes rouges." Vous taisez les 76,84 % d'avertissements du même rapport. Chiffre flatteur sans son jumeau.
- "Un auditeur rejoue la décision." Votre playbook dit que la version des règles n'est pas dans le journal. Le rejeu est partiel.
- "Hold up lui ne laisse passer que ce que vous avez écrit vouloir faire." C'est "bloque" en plus joli, et ça contredit "la personne décide".
- "Dans nos mesures, 48 % des droits de dépense sont illimités." Sans "échantillon de blocs, non représentatif" et sur Ethereum, alors que le sujet est Avalanche (34 %).
- Silence total sur DORA, MiCA, LCB-FT, AI Act. KPMG est dans la salle. Aucun mot sur qui est alerté, ce qui est automatique, ce qui est humain. Le playbook, livrable obligatoire, n'existe pas à l'oral.
- "Si le modèle se trompe : montants et adresses sont lus par du code." Mais l'intention, elle, est lue par le modèle (type juste 38 % sur tournures neuves). La responsabilité n'est pas répondue.

## 4. Trois questions pièges
1. Si le modèle hébergé comprend mal ma phrase et me laisse passer, qui est responsable, et qu'est-ce que le journal prouve ?
2. Votre phrase part chez un tiers. Quelle base légale, quelle conservation, quel sous-traitant ? Et vous parlez de DORA : êtes-vous un prestataire TIC critique pour la banque qui vous intégrerait ?
3. 54,2 % d'honnêtes avertis : au bout d'une semaine, qui lit encore vos alertes ? Et vos 71,3 % de rappel sont sur un banc que vous avez écrit.

## 5. Cinq changements
1. Remplacer "Dans les plus gros cas, les signatures de droits de dépense pèsent 38 % des pertes" par "Sur les 11 plus gros vols de 2025, 3 passaient par une signature de droit de dépense." Gain : +1 (détection, crédibilité).
2. Remplacer "Sur 6 325 transactions réelles d'Avalanche, 0,30 % d'alertes rouges" par "Sur 6 325 transactions réelles d'Avalanche : 0,30 % de rouges, mais 77 % d'avertissements, surtout des appels que nous ne savons pas décoder. Légitimité présumée, pas d'étiquettes." Gain : +1,5 (détection, faisabilité).
3. Ajouter en 4:10 une phrase conformité : "Pour un auditeur : chaque décision est horodatée, versionnée, rejouable. Nous n'affirmons aucune conformité DORA ni MiCA. Hold up est un outil de contrôle pour l'utilisateur ou l'établissement, pas une preuve réglementaire. Pour une banque, les fausses alertes et le journal alimentent le registre d'incidents." Gain : +3 (conformité, réponse).
4. Remplacer "Si le modèle se trompe : montants et adresses sont lus par du code, la personne garde le dernier geste." par "Si le modèle se trompe : il ne lit que la phrase. Montants et adresses sont lus par du code, qui ne peut qu'aggraver l'alerte. Une fausse alerte coûte un clic. Une alerte manquée laisse la personne où elle était. Elle décide, le journal dit ce qu'elle a vu." Gain : +2 (conformité, réponse).
5. Remplacer "Verdict local en 18 millisecondes. La phrase, elle, est lue par un modèle hébergé." par "Verdict local en moins de 50 millisecondes. La phrase part vers un modèle hébergé : minimisation et conservation restent à rédiger." Et supprimer "ne laisse passer que". Gain : +1,5 (faisabilité, cohérence).

## 6. Verdict
Pitch honnête et défendable sur les chiffres, mais muet sur le régulateur et la responsabilité : 56, je veux voir le playbook et la ligne conformité avant de monter plus haut.

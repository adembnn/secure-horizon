# Jury KPMG, round 2, pitch V4

## 1. Note
- Détection : 20 / 30 (round 1 : 17, +3)
- Réponse : 13 / 20 (10, +3)
- Faisabilité et intégration : 13 / 20 (11, +2)
- Conformité et explicabilité : 10 / 15 (7, +3)
- Pitch et démo : 11 / 15 (11, 0)
- **TOTAL : 67 / 100** (56 au round 1, +11)

## 2. Défauts du round 1
1. 38 % des pertes : **résolu**. « Trois des onze vols de plus d'un million de dollars sont passés par une signature ».
2. 18 ms : **résolu**. « Verdict local en moins de 50 millisecondes ».
3. 0,30 % sans son jumeau : **résolu**. « 0,30 % d'alertes rouges, 77 % d'avertissements, presque tous des appels illisibles ».
4. Rejeu de la décision : **partiellement**. Le mot « rejoue » a disparu, bien. Mais « une ligne modifiée se détecte » ne dit pas que la version des règles manque au journal.
5. « Ne laisse passer » : **résolu**. Supprimé.
6. 48 % sans Avalanche : **résolu**. « 48 % sur Ethereum, 34 % sur Avalanche. Échantillons non représentatifs ».
7. Silence sur le régulateur et le playbook : **partiellement**. « Nous ne revendiquons ni DORA ni MiCA » est correct. Mais rien sur LCB-FT ni AI Act, et toujours pas de « qui est alerté, ce qui est automatique ». Le livrable playbook reste absent de l'oral.
8. Responsabilité si le modèle se trompe : **partiellement**. « La personne garde le dernier geste » ne répond pas à « qui est responsable ». L'argument d'asymétrie (le code ne peut qu'aggraver l'alerte) n'a pas été repris.
9. Base légale et sous-traitant de la phrase : **partiellement**. « Dans la version livrée, rien » aide. Rien sur conservation ni sous-traitant du relais.

## 3. Nouveaux défauts
- Trop long. Voir point 4.
- « Rien ne sort » puis « relais optionnel envoie la phrase » : l'auditeur demande quelle version je juge.
- « Detect et Respond du NIST CSF 2.0 » est affirmé sans preuve. Une carte de couverture, pas une conformité, mais le mot « couvrons » sera attaqué.
- « D'après le code public de MetaMask » : source citée, non montrée.
- Le 17 % du « meilleur cas » est sur un banc favorable, donc flatteur.
- « Jamais de vert » est un absolu, un auditeur cherchera le contre-exemple.
- Conclusion : « Hold up vérifie ce que vous vouliez faire » contredit « pas couvert : l'envoi consenti ».

## 4. Temps de parole
Je compte environ 820 mots dits, pas 650. À 130 mots par minute : **6 min 20** contre 5 min. Dépassement de 1 min 20. Le jury coupera pendant la conformité, la partie qui me concerne.

## 5. Cinq derniers changements
1. Couper 170 mots : supprimer la scène trois, la métaphore du plombier, la phrase « Nos 410 cas de réglage ». Gain : +2 (pitch).
2. Remplacer « La personne garde le dernier geste. » par « Le modèle ne lit que le sens de la phrase et le code ne peut qu'aggraver l'alerte. Une fausse alerte coûte un clic. Une alerte manquée laisse la personne où elle était. Elle décide, le journal dit ce qu'elle a vu. » Gain : +1,5 (réponse, conformité).
3. Remplacer « Nous couvrons Detect et Respond du NIST CSF 2.0. » par « Qui est alerté : l'utilisateur. Automatique : la comparaison et le journal. Humain : la décision. Pour une banque, ce journal alimente le registre d'incidents. » Gain : +2 (réponse, conformité).
4. Remplacer « Dans la version livrée, rien. Un relais optionnel… » par « Par défaut, rien ne sort. Si le relais est activé, la phrase seule part chez un tiers : base légale, conservation et sous-traitant restent à rédiger. » Gain : +1 (faisabilité).
5. Remplacer « Une ligne modifiée se détecte. » par « Une ligne modifiée se détecte. La version des règles n'y figure pas encore : le rejeu est partiel. » Et remplacer « Jamais de vert » par « pas de vert par défaut ». Gain : +1 (conformité).

## 6. Verdict
Honnête et enfin défendable devant un auditeur, 67 : coupez 170 mots et répondez par écrit à « qui est responsable », et je monte à 72.

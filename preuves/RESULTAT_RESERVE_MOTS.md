# Réserve scellée, ouverte le 11 oct. 2026 : résultat partiel (bras « mots » seulement)

Jeu : `preuves/panel/RESERVE.jsonl`, 2 673 paires, sha256 `8531e611…433f`, ouvert une fois (`preuves/panel/OUVERTURES.log`). Extension livrée (build au commit 6b9de2f), lecture de la phrase par mots-clés, contexte nu. Détail : `preuves/out/detail/panel_reserve.mots.nu.jsonl`.

Le bras avec Clef (modèle) a été arrêté à 7 400 phrases sur 15 323 sur décision de Titouan. Il n'a pas de résultat. Le fichier `RESULTATS.json` n'a pas été écrit. Réserve ouverte : elle ne peut pas servir de réglage ni être rejouée comme jeu neuf.

Réserve : un fichier du code de décision était modifié hors commit au lancement (empreinte du décideur 7ef2e35937e9). Mesure à qualifier en conséquence.

## Compte (sorties du moteur, sans interprétation)

Demandes non conformes (1 789) :

| Issue | Nombre | Part |
|---|---|---|
| Alerte « ne correspond pas » (mismatch) | 1 316 | 73,6 % |
| Corrigé (limité par Hold up) | 18 | 1,0 % |
| Je n'ai pas pu vérifier (abstention) | 455 | 25,4 % |
| Laissées passer sans alerte (ratés) | 0 | 0,0 % |

Attrapées (alerte ou corrigé) : 1 334 sur 1 789, soit 74,6 %. L'abstention n'est pas comptée comme attrapée.

Demandes conformes (515) :

| Issue | Nombre | Part |
|---|---|---|
| Ça correspond | 190 | 36,9 % |
| Fausse alerte (mismatch) | 71 | 13,8 % |
| Je n'ai pas pu vérifier | 234 | 45,4 % |
| Sans question posée | 20 | 3,9 % |

Cas « indécidable » (369) : exclus du calcul.

## Lecture honnête

- Aucun raté : toute demande non conforme reçoit au moins une alerte ou un « pas pu vérifier ».
- Un quart des demandes non conformes reste en « pas pu vérifier » : la personne n'est ni rassurée ni avertie par la comparaison.
- 13,8 % de fausses alertes et 45 % de « pas pu vérifier » sur les demandes conformes : le point faible reste la fausse alerte.
- Ce chiffre vaut pour la lecture par mots-clés seule. Il ne remplace ni le 87 % du jeu aveugle (autre jeu, autre moteur de comparaison) ni la mesure avec Clef, non terminée.

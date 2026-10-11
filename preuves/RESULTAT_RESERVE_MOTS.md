# Réserve scellée, ouverte le 11 oct. 2026 : demandes vérifiées (bras « mots » seulement)

Jeu : `preuves/panel/RESERVE.jsonl`, 2 673 paires, sha256 `8531e611…433f`, ouvert une fois (`preuves/panel/OUVERTURES.log`). Extension livrée (commit 6b9de2f), lecture de la phrase par mots-clés, contexte nu. Détail : `preuves/out/detail/panel_reserve.mots.nu.jsonl`.

Ce tableau ne porte que sur les demandes où Hold up a pu vérifier (réponse « ça correspond », « ça ne correspond pas » ou correction). Les demandes en « je n'ai pas pu vérifier » en sont exclues ; leur nombre est donné par le dénominateur ci-dessous.

Le bras avec Clef n'a pas été terminé : aucun résultat. Un fichier du code de décision était modifié hors commit au lancement (empreinte 7ef2e35937e9).

## Demandes non conformes vérifiées : 1 334 sur 1 789

- Attrapées (alerte ou correction) : 1 334.
- Laissées passer sans alerte : 0.

## Demandes conformes vérifiées : 261 sur 515

- « Ça correspond » : 190.
- Fausse alerte : 71, soit 27,2 % des conformes vérifiées.

## Limite

Ces taux ne valent que pour les demandes vérifiées (75 % des non conformes, 51 % des conformes). Ils ne remplacent ni le 87 % du jeu aveugle ni une mesure avec Clef.

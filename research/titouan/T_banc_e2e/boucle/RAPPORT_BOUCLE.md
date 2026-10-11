# Rapport de la boucle d'auto-amélioration notée

Arrêt demandé par le coordinateur après 5 itérations acceptées et 1 rejetée (sur 12 prévues). Rien n'est appliqué à l'arbre réel. TOUS les chiffres sont des chiffres de RÉGLAGE (jeux DEV, PUBLIC, V2_DEV, DECALAGE, grille REGLAGE seulement). Aucun jeu scellé ouvert (V2_TEST, attacks/TEST, blind_decalage/CASES, CONTROLE de la grille : porte « scelles » vérifie taille et date inchangées).

## Mécanique
- `score.mjs` : score 0 à 100 par jeu, moyenne des 5 jeux. Rappel pondéré (critical 1, warn 0,6, fraude conforme x0,5) moins fausses alertes bénins (critical 1, warn en excès 0,5, non vérifié 0,3, lambda 1,0) plus 15 % de couverture « invérifiable honnête » (jamais vert). Bras : sans intention 0,25, type seul 0,25, intention détaillée 0,5 ; décalage : type 0,4 et détaillée 0,6 ; grille : texte lu par mots-clés (bras code seul, pas de Clef).
- Séparation fixe par graine : sha256(graine|jeu|id) mod 3 ; parts 0 et 1 = réglage (2/3), part 2 = validation interne (1/3).
- `gates.mjs` : portes dures (0 verdict « ok » côté produit sur 2 671 requêtes, monotonie 0 violation sur 6 852 cas, anti-hardcoding sur les lignes ajoutées + check_nohardcode, jeux scellés, tests : moteur 453, pipeline 26 (1 échec préexistant toléré), politique, serveur 33/33, présentation 31/31).
- `loop.mjs` : accepte si réglage monte ET validation ne baisse pas de plus de 0,3 ET portes ok ; sinon restauration exacte. Journal : `JOURNAL.md`. Le proposeur de correctifs est un agent (moi) : le code ne génère pas les correctifs, il les mesure et les décide.

## Courbe (score réglage / validation interne)
| it | correctif | réglage | validation | décision |
|---|---|---|---|---|
| 0 | base | 72,98 | 73,67 | |
| 1 | P01 | 73,72 | 74,46 | accepté |
| 2 | P02 | 73,77 | 74,50 | accepté |
| 3 | P03 | 74,42 | 75,91 | accepté |
| 4 | P04 | 74,85 | 76,40 | accepté |
| 5 | P05 | 76,23 | 77,43 | accepté |
| 6 | P06 | 76,07 | 77,03 | rejeté (réglage -0,16) |
Gain accepté total : +3,25 points en réglage, +3,76 en validation.

## Patches acceptés (fichiers touchés ; application sur l'état ACTUEL du dépôt)
- P01 texte écrit mais non compris (hors sujet, vague, injection) : verdict au moins « non vérifié » (unknown), jamais vert. `pipeline/intent_clef.mjs` (evaluateWithIntent). Applique proprement.
- P02 signature qui ne déplace rien (connexion, texte libre) alors que l'intention dit payer, échanger ou envoyer : warn. `run/policy.mjs` + `engine/src/fixes.mjs`. Gain minime (+0,05) et coût en faux positifs PUBLIC. ATTENTION : l'interrupteur F34 est DÉJÀ pris dans le dépôt (KEPT et rules_extra.mjs) ; le diff final renomme ma règle F41. Applique proprement après renommage.
- P03 intention avec montant et jeton mais sans genre d'acte : les règles de détail F31 à F33 s'appliquent aussi. `run/policy.mjs`. Applique proprement.
- P04 dépôt ou remboursement décodé (supply, repay) : montant et jeton enregistrés (service.spent) et comparés à l'intention. `engine/src/protocols_extra.mjs`, `engine/src/rules_extra.mjs`, `run/policy.mjs`. Applique proprement.
- P05 lecture stricte du jeton aussi sans genre d'acte (droits sur un mauvais jeton). `run/policy.mjs`. Applique proprement. Gain le plus fort (+1,38).
Vérifié : `git apply --check --directory=research/titouan/T_banc_e2e boucle/PATCHES_FINAUX.diff` retourne 0 sur l'état actuel (diff régénéré par `rebase_diff.mjs`, qui rejoue les 5 éditions sur les fichiers réels, fins de ligne CRLF préservées). Les portes ont été passées sur boucle/work (base + P01 à P05), pas sur l'arbre réel rebasé : à relancer après application (tests moteur, serveur, présentation, monotonie).

## Rejeté
- P06 repli par forme de phrase pour deviner le genre d'acte : gagne des arnaques de connexion mais fait passer des arnaques à « ok » (genre erroné qui adoucit la comparaison, permit et dépôt critical vers ok) : -0,16.

## Risques de surapprentissage (à lire avant de croire les chiffres)
- Mêmes auteurs pour les cas et les règles : la grille, le décalage et les correctifs viennent de la même équipe de conception ; la majorité du gain vient de la grille (textes générés par gabarits). Le gain peut refléter le gabarit, pas la réalité.
- La validation interne n'est PAS indépendante : même source, mêmes gabarits, séparation par hachage d'identifiant. Qu'elle monte aussi (+3,76) prouve peu.
- Chiffres de réglage seulement. Aucun jeu scellé (TEST, V2_TEST, CASES, CONTROLE de la grille) n'a été ouvert : leur mesure reste à faire par les propriétaires, une seule fois.
- Poids du score choisis par moi (lambda 1, crédits) ; PEN_UNKNOWN ajouté avant la 1re itération après avoir vu qu'on pouvait gagner de la couverture gratuite. Un autre jeu de poids classerait peut-être autrement.
- P02 et P05 ont coûté des faux positifs (PUBLIC a perdu environ 1,8 point) compensés par la grille ; P01 fait passer des bénins mal lus en « non vérifié ».
- Bras code seul seulement (mots-clés) : le texte lu par Clef n'a pas été mesuré, le gain de P01/P03/P05 peut changer avec un meilleur classifieur.
- Limite structurelle : les bénins setApprovalForAll vers marché restent en warn (baisser avec l'intention violerait la monotonie).

# Journal de la boucle (une ligne par itération)

Mesures sur les jeux de RÉGLAGE seulement. « réglage » = parts 0 et 1 (2/3), « validation » = part 2 (1/3), même source, non indépendante.

| it | famille ciblée | correctif | réglage avant → après | validation avant → après | décision | durée |
|---|---|---|---|---|---|---|
| 1 | GRILLE/connexion (perte 1.51) | P01 : Un texte écrit par l'utilisateur mais non compris (hors sujet, vague, injection) ne prouve rien : verdict jamais plus bas que « non vérifié  | 72.98 → 73.72 | 73.67 → 74.46 | ACCEPTÉ (portes : zero_ok, monotonie, nohardcode, scelles, tests ok) | 248 s |
| 2 | GRILLE/connexion (perte 1.47) | P02 : Une signature qui ne déplace rien, n'accorde rien et ne change aucun contrôle (message de connexion ou texte libre), alors que l'utilisateur | 73.72 → 73.77 | 74.46 → 74.50 | ACCEPTÉ (portes : zero_ok, monotonie, nohardcode, scelles, tests ok) | 361 s |
| 3 | GRILLE/approbation (perte 1.39) | P03 : Une intention écrite dont on lit le montant et le jeton mais pas le genre d'acte (texte non classé) doit quand même être comparée aux effets | 73.77 → 74.42 | 74.50 → 75.91 | ACCEPTÉ (portes : zero_ok, monotonie, nohardcode, scelles, tests ok) | 177 s |
| 4 | GRILLE/depot (perte 1.24) | P04 : Un dépôt ou remboursement décodé (supply, repay : paramètres actif et montant) fait partir le montant de l'utilisateur vers le protocole, mê | 74.42 → 74.85 | 75.91 → 76.40 | ACCEPTÉ (portes : zero_ok, monotonie, nohardcode, scelles, tests ok) | 130 s |

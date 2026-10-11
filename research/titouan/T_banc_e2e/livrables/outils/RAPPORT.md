# Rapport : fiche de traçabilité

## Ce qui marche (preuve par test)

Tests : `node --test livrables/outils/test/fiche_tracabilite.test.mjs`. 7 tests, 7 passent.

- L'export d'exemple vient du vrai `journal_chain.js` (chainAppend puis exportChain). 7 lignes. Aucune phrase, aucune adresse complète, alors que les entrées d'origine en contenaient (test « session summary »).
- La fiche vérifie la chaîne avec le `verifyChain` du journal, importé tel quel. Exemple intact : « COHÉRENTE ».
- Une ligne modifiée à la main donne « ROMPUE », dans la page, dans le texte et en code de sortie 1. La ligne fautive est nommée.
- Qui a agi : personne (code `geste`), automatique (code `envoi_automatique`), Hold up pour une révocation proposée ou une analyse. Avec le champ `by` : `human`, `auto`, `expired` (« retenue puis expirée ») et tout autre motif.
- Champs à venir `by`, `limited`, `rules`, `tab`, `frame` : affichés s'ils existent, sinon « non enregistré dans cette version ». Valeurs bizarres (null, nombre, tableau, objet) : pas de plantage.
- Pour chaque champ à venir, la fiche dit s'il est couvert par le hachage. Aujourd'hui : « hors du hachage dans cette version », car `canonical` ne les inclut pas.
- Injection : balises `<script>`, `<img onerror>`, `<svg onload>`, `</style>` dans le site, la méthode, les codes, `by` et `rules`. Tout est échappé. Pas de script, pas de `src` ni `href`, pas d'URL externe, CSP stricte.
- Site coupé au milieu, domaine final visible, 41 caractères au plus. Adresse complète masquée même si on la glisse dans `by`.
- Empreinte SHA-256 de la fiche = SHA-256 du JSON canonique de la fiche. Même entrée et même `--date` : même empreinte.
- Résumé de toute la session (une ligne par entrée) ou fiche d'une ligne (`--n`). Ligne absente ou fichier illisible : code 2.
- Aucun mot de verdict vert ni de promesse (test).
- La commande de démo du README a été lancée sous PowerShell : exemple modifié, « ROMPUE », lignes 4 et 5 nommées, code 1. Un fichier réenregistré avec une marque BOM (éditeur Windows) est accepté.
- Attention en démo : sous PowerShell 5.1, lire le JSON sans `-Encoding UTF8` abîme le caractère « … » des sites coupés. La chaîne apparaît alors rompue sur ces lignes aussi. La commande du README le fait correctement.

## Ce qui manque

- Le cas « champ couvert par le hachage » n'est pas testé en positif : il faut qu'Adem ajoute `by`, `limited`, `rules` dans `canonical`. La fiche le détectera seule.
- Tant que `by` n'est pas dans le journal, une annulation ne distingue pas la personne de l'expiration. La fiche le dit.
- Le rendu imprimé sur une page A4 n'a pas été vérifié à l'œil. Le CSS vise une page. Une très longue session débordera sur plusieurs pages.
- Les libellés des codes sont une liste locale (règles du moteur et codes de décision). Un code inconnu s'affiche avec « sans libellé dans cette fiche ».
- Pas d'ancrage externe : la fiche affiche le dernier hachage à garder ailleurs, sans le publier.

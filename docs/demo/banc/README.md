> **PÉRIMÉ le 11/10/2026 : voir livrables\**

# Page de démo : le banc d'essai de Hold up

Page autonome pour le pitch : `index.html` lit tout son contenu dans `data.json`. Pour changer un chiffre, on modifie seulement `data.json`, jamais le code.

## Lancer

```
cd docs/demo/banc
python -m http.server 8000
```

Puis ouvrir http://localhost:8000. En ouvrant le fichier directement (`file://`), le navigateur bloque la lecture de `data.json` et la page affiche un message d'erreur.

Pendant la démo : bouton Pause / Lecture, Précédent / Suivant (ou flèches gauche et droite), touche K pour lecture et pause, trois vitesses, et « Voir la liste » pour afficher les 30 cas d'un coup. Si le système demande moins d'animations, la page s'ouvre directement en liste. Le lien « Mode sombre » change le thème (clair par défaut).

## Mettre à jour les chiffres (`data.json`)

| Ce qui change | Où, dans `data.json` |
|---|---|
| Verdict mesuré d'un cas après le jeu aveugle | `cas[i].verdict_mesure` : `"arretee"`, `"signalee"` ou `"passee"`. S'il est renseigné, il remplace le verdict attendu et la page affiche « Verdict mesuré ». |
| Résultat du jeu aveugle | `aveugle.resultat` : passer de `null` à `{ "reperees": {"k":..,"n":..,"pct":..}, "fausses_alertes_graves": {"k":..,"n":..,"pct":..}, "note": "..." }`. |
| Lien d'ancrage sur Fuji | `preuve.snowtrace_url` (lien `https://testnet.snowtrace.io/tx/...`) et `preuve.contrat` (adresse du contrat). Laisser à `null` tant que l'ancrage n'est pas déployé. Ne jamais mettre une adresse ou une transaction qui n'existe pas. |
| Les trois bras et la ligne après corrections | `comparaison.bras[]` et `comparaison.apres_corrections` (`k`, `n`, `pct`). |
| La matrice par catégorie | `matrice.lignes[]` (`reperees`, `n`) et `matrice.fraude_conforme`. La page trie elle-même du plus faible au plus fort. |
| Ajouter ou retirer un cas | `cas[]` : `id`, `type` (`arnaque` ou `honnete`), `chainId`, `site`, `demande`, `croit`, `fait`, `verdict_attendu`. Les compteurs et la frise se recalculent. |

Règles des compteurs : une arnaque arrêtée ou signalée compte dans « arnaques arrêtées ou signalées », une arnaque laissée passer dans « arnaques qui passent » (en rouge). Une opération honnête arrêtée compte comme fausse alerte grave ; une opération honnête signalée est indiquée sous ce compteur, sans être comptée comme grave.

## D'où viennent les données

- Chiffres : `research/titouan/T_banc_e2e/COUVERTURE.md` (tour R003, jeu DEV) et `coord/INBOX.md`, ligne `AMELIORATION-DEV-ET-DEMANDE-JEU-AVEUGLE` (10 corrections : 89 % puis 100 % d'arnaques repérées, 21 % puis 0 % de fausses alertes graves, sur le jeu qui a servi aux corrections).
- Cas : 30 cas tirés de `research/titouan/T_banc_e2e/blind_adem/` (`malveillants.jsonl`, `benins.jsonl`, `fraudes_ambigus.jsonl`), résumés en français simple. Le verdict affiché est le verdict **attendu** écrit avec le cas (`expected_severity` : critical = arrêtée, warn = signalée, ok = laissée passer), pas un résultat mesuré.
- Empreinte du jeu aveugle : `blind_adem/BLIND_v1.sha256`.
- Tous les cas sont synthétiques : adresses générées, sites et marques fictifs.

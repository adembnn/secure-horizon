# Fiche technique de traçabilité (Hold up)

Lit l'export JSON du journal chaîné (bouton « Exporter le journal » du panneau latéral).
Produit une page HTML imprimable et un résumé texte : qui a agi, d'où, quand, quoi, quelles règles, et la preuve.

La vérification utilise `verifyChain` de `extension/journal_chain.js`, sans copie. Si le journal change d'algorithme, la fiche suit.

## Commandes (depuis `research/titouan/T_banc_e2e`)

```
node livrables/outils/fiche_tracabilite.mjs holdup-journal.json --out fiche.html          # résumé de la session
node livrables/outils/fiche_tracabilite.mjs holdup-journal.json --n 4 --out fiche4.html   # fiche de la ligne n° 4
node livrables/outils/exemple/genere_exemple.mjs                                          # régénère l'exemple
node --test livrables/outils/test/fiche_tracabilite.test.mjs                              # tests
```

Option `--date 2026-10-11T10:00:00Z` : date de la fiche fixée, sortie identique octet pour octet.
Code de sortie : 0 chaîne cohérente, 1 chaîne ROMPUE (la fiche est quand même écrite), 2 fichier illisible ou ligne absente.

## Démo de 20 secondes

1. Panneau latéral, « Exporter le journal ». Le fichier `holdup-journal.json` arrive dans Téléchargements.
   Sans extension sous la main : prendre `livrables/outils/exemple/journal_export.json`.
2. Lancer la fiche. Elle dit « COHÉRENTE ».
   `node livrables/outils/fiche_tracabilite.mjs holdup-journal.json --n 4 --out fiche.html`
3. Ouvrir le JSON dans un éditeur. Sur une ligne, changer `"l": "danger"` en `"l": "attention"`. Enregistrer.
4. Relancer la même commande. Elle dit « ROMPUE » et nomme la ligne modifiée. La page `fiche.html` le dit en rouge.

En une ligne PowerShell, sur l'exemple :
```
(Get-Content livrables/outils/exemple/journal_export.json -Raw -Encoding UTF8) -replace '"l": "danger"','"l": "attention"' | Set-Content $env:TEMP\j.json -Encoding utf8; node livrables/outils/fiche_tracabilite.mjs $env:TEMP\j.json --out $env:TEMP\fiche.html
```

## Ce que la fiche affiche

- QUI : la personne, l'envoi automatique, l'expiration, ou Hold up (analyse, note, révocation proposée).
  Sans champ `by`, la fiche déduit des codes `geste` et `envoi_automatique`. Une annulation reste « personne ou expiration : non distingué ».
- D'OÙ : site coupé au milieu, domaine final toujours visible. Onglet et frame si présents.
- QUAND : heure UTC. QUOI : type de demande, niveau, codes avec leur sens en clair.
- RÈGLES : version du build. Champs `by`, `limited`, `rules` affichés s'ils existent, sinon « non enregistré dans cette version ».
  Pour chacun, la fiche dit s'il est couvert par le hachage (test réel : on le change, on revérifie).
- PREUVE : résultat de verifyChain, position de la ligne, hachages, dernier hachage à garder ailleurs, empreinte SHA-256 de la fiche.
- Ce que la fiche établit et n'établit pas. Une réécriture complète ou la suppression des dernières lignes ne se voit pas sans ancrage externe.

## Sécurité

Tout texte du journal est nettoyé puis échappé. Aucun script, aucune ressource externe, CSP `default-src 'none'`, CSS en ligne.
Adresses complètes masquées, aucune phrase lue. Aucun verdict vert, aucune promesse.

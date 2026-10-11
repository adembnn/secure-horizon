# Deck Hold up : 8 slides (système de design Hold up)

Le fichier `holdup.pptx` est généré par `livrables/deck/build_deck.js` (`NODE_PATH=<dossier node_modules avec pptxgenjs> node livrables/deck/build_deck.js`). Régénéré le 11 oct. 2026 à 10h53, sans paquet ajouté au dépôt. Les notes orateur sont dans `build_deck.js`.

Règle du deck : une phrase, une preuve montrée, et en pied de chaque slide « Dans le dépôt : » suivi du fichier où le jury vérifie. Tous les chemins cités sont suivis par git (contrôlé par `git ls-files`). Le détail et les réserves vont dans les notes orateur.

Design : `docs/design/system/DESIGN.md`. Fond noir, texte blanc, deux gris, police du système de design (`tokens.css`, `--hu-font` : Segoe UI Variable Text, graisses 400 et 600). La police n'est pas embarquée dans le `.pptx` : sur une machine sans Segoe UI Variable, projeter `holdup.pdf`, qui l'embarque. Aucune couleur, aucune carte, aucun filet, aucune colonne de texte. Mots du lexique : « autorisation », « retirer ».

| # | Ce qui est montré | Dans le dépôt |
|---|---|---|
| 1 | « 34 % » en très grand : autorisations illimitées lues sur Avalanche, une sur trois. Aucune mention d'Ethereum (décision d'Adem : nous adressons Avalanche) | `research/titouan/Z_approbations/onchain/result_avax.json` |
| 2 | « Tu écris. Je compare. Tu décides. » : deux écrans de la planche de design (question, « Ça ne correspond pas ») et les deux gestes : ne rien envoyer, ou limiter à 50 USDC puis envoyer ; rien ne part tout seul | `docs/design/system/planche.html` (système de design, en cours d'intégration) |
| 3 | « Le même site, piraté plus tard » : 50 → 0 sans Hold up, 50 → 50 avec | `research/demo_reelle/site_echange/test/preuve_piratage.mjs` (chaîne locale) |
| 4 | « Une autorisation déjà donnée ? Tu la retires. » : capture du panneau | `research/titouan/T_banc_e2e/extension/revoke.js`, `tests/unit/revoke.test.mjs` |
| 5 | LI.FI, juillet 2024 : illimitées vidées, limitées rien perdu | `livrables/CHIFFRES.md` B7, rapport de LI.FI |
| 6 | Jeu aveugle, 250 cas, moteur de comparaison : 65 % et 87 % ; seuil 10 %, mesuré 15 % | `research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md`, `preuves/ECARTS_LIVRABLES.md` |
| 7 | « Notre testeuse s'est fait piéger 4 fois » : capture réelle de l'extension pendant l'essai ; ce qui n'est pas encore contrôlé | `coord/reports/testeurs/3_prudente_clavier.md`, `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md` |
| 8 | La phrase de fin d'Adem, seule (le modèle économique est en notes orateur) | `research/titouan/BM2/BM_MODELE.md`, `BM_LABEL.md` |

Retiré parce que non vérifiable tel quel :
- « 217 tests, 44 contrôles sur 44 » : rejoué le 11 oct. à 10h49 sur l'arbre de travail (`node --test tests/unit/*.test.mjs` dans `research/titouan/T_banc_e2e/extension/`), le résultat est 225 tests, 213 réussis, 12 en échec.
- La slide « La phrase, le code, le cahier » (trois colonnes de texte) : son contenu est dans les notes de la slide 2.
- Toute phrase laissant entendre que l'extension attrape 87 % : le jeu aveugle mesure le moteur de comparaison, pas l'extension livrée.

Réserves :
- `preuve_piratage.mjs` demande une chaîne locale déployée (`npm run demo:deploy -- --network localhost`) : le jury ne le rejoue pas en une commande.
- Les écrans des slides 2 et 4 sont ceux du système de design, pas encore tous dans le code ; l'interface réelle de l'extension est celle de la slide 7, et son bouton s'appelle encore « Révoquer ».
- La testeuse est un agent qui joue un personnage, pas une personne : c'est écrit sur la slide.
- `PITCH_5MIN.md` annonce encore un carton « la phrase, le code, le cahier » et dit « révoquer », « droit », « cent, zéro » : à aligner.

Rendu vérifié par export PowerPoint en images, les huit slides relues.

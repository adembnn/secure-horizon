# Deck Hold up : 7 slides (système de design Hold up)

Le fichier `holdup.pptx` est généré par `livrables/deck/build_deck.js` (`NODE_PATH=<dossier node_modules avec pptxgenjs> node livrables/deck/build_deck.js`). Régénéré le 11 oct. 2026 à 10h53, sans paquet ajouté au dépôt. Les notes orateur sont dans `build_deck.js`.

Règle du deck : une phrase, une preuve montrée, et en pied de chaque slide « Dans le dépôt : » suivi du fichier où le jury vérifie. Tous les chemins cités sont suivis par git (contrôlé par `git ls-files`). Le détail et les réserves vont dans les notes orateur.

Design : `docs/design/system/DESIGN.md`. Fond noir, texte blanc, deux gris, police du système de design (`tokens.css`, `--hu-font` : Segoe UI Variable Text, graisses 400 et 600). La police n'est pas embarquée dans le `.pptx` : sur une machine sans Segoe UI Variable, projeter `holdup.pdf`, qui l'embarque. Aucune couleur, aucune carte, aucun filet, aucune colonne de texte. Mots du lexique : « autorisation », « retirer ».

| # | Ce qui est montré | Dans le dépôt |
|---|---|---|
| 1 | « 153 » en très grand : portefeuilles vidés chez LI.FI en juillet 2024, 11,6 M$ ; tous en autorisation illimitée, les limitées n'ont rien perdu. En second : une autorisation sur trois est illimitée sur Avalanche | `research/demo_reelle/RECHERCHE_douleurs_secondaires.md` (ligne 29), `result_avax.json` |
| 2 | « Tu écris. Je compare. Tu décides. » : deux écrans de la planche de design (question, « Ça ne correspond pas ») et les deux gestes : ne rien envoyer, ou limiter à 50 USDC puis envoyer ; rien ne part tout seul | `docs/design/system/planche.html` (système de design, en cours d'intégration) |
| 3 | La scène racontée en trois temps (tu échanges 50, le site demande tout, il est piraté plus tard), puis « il te reste 0 USDC » sans Hold up, « 50 USDC » avec | `research/demo_reelle/site_echange/test/preuve_piratage.mjs` (chaîne locale) |
| 4 | « Une autorisation déjà donnée ? Tu la retires. » : capture du panneau | `research/titouan/T_banc_e2e/extension/revoke.js`, `tests/unit/revoke.test.mjs` |
| 6 | Jeu aveugle, 250 cas, moteur de comparaison : 65 % et 87 % ; seuil 10 %, mesuré 15 % | `research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md`, `preuves/ECARTS_LIVRABLES.md` |
| 7 | « 36 parcours. Notre testeuse s'est fait piéger 4 fois. », les 4 fois après « Continuer » malgré l'alerte : capture réelle de l'extension pendant l'essai ; « Ce que Hold up ne fait pas encore », en deux phrases (la ligne « jamais essayé devant un vrai MetaMask » est retirée de la slide à la demande d'Adem, elle reste en notes orateur) | `coord/reports/testeurs/3_prudente_clavier.md`, `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md` |
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

Le deck compte 7 slides depuis 11h35 : LI.FI est passé en slide 1 à la demande d'Adem, l'ancienne slide « C'est déjà arrivé » faisait doublon et a été retirée. Les numéros 6, 7 et 8 du tableau ci-dessus sont maintenant les slides 5, 6 et 7.

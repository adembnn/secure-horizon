# Testeurs « utilisateurs réels » : brief à reprendre par la session de Titouan

Demande d'Adem : des testeurs qui jouent des utilisateurs types, à fond, dans un vrai navigateur avec l'extension, font remonter tous les problèmes, puis les problèmes sont corrigés. La session d'Adem a arrêté ses testeurs faute de crédit. Un seul a rendu : `3_prudente_clavier.md`.

## Les cinq personnages
1. Débutant pressé : écrit vite et mal (« echangé 50 usdc », « ok », « swap »), ne lit pas, double-clique, ferme avec la croix, Entrée trop tôt, recharge au milieu, champ vide. Rapport attendu : `1_debutant_presse.md`.
2. Habitué des échanges : dix opérations par jour, phrases courtes et techniques, deux onglets, deux fenêtres ouvertes, montants à virgule, très petits, très grands. Il chronomètre le temps ajouté par opération (médiane, pire cas). Rapport : `2_habitue_echanges.md`.
3. Prudente au clavier (FAIT) : `3_prudente_clavier.md`.
4. Envois et récompenses : adresses mal collées, prénoms, mauvais jeton, « récupérer ma récompense », « me connecter », NFT. Il faut une petite page de test neutre pour les envois et le NFT (formulaire qui demande un transfert, avec des variantes où la page envoie autre chose que ce qui est affiché). Rapport : `4_envois_recompenses.md`.
5. Hors norme : anglais, « 50 dollars », « 50 balles », « cinquante », emoji, trois paragraphes, deux intentions dans une phrase, balises, redémarrage du navigateur au milieu, second portefeuille dans la page. Pire cas à chercher : une phrase bizarre qui fait dire « Ça correspond » à une demande qui ne correspond pas. Rapport : `5_hors_norme.md`.

## Méthode (ce qui a marché, ce qui a coûté)
- Chaque testeur travaille ISOLÉ : sa propre chaîne Hardhat (ports 8601 à 8605), sa copie du site Neve (`research/demo_reelle/site_echange/`), son fichier d'adresses dans un dossier temporaire. Ne pas toucher à la chaîne partagée 8545 ni à `research/demo_reelle/chain/addresses.local.json`.
- Tester une COPIE de l'extension construite (`research/titouan/T_banc_e2e/extension_standalone/extension/`), noter son `BUILD_INFO.json`.
- Pilotage : Chromium de Playwright avec l'extension et un portefeuille simulé ; modèle : `research/demo_reelle/site_echange/test/film_scene.mjs`.
- Regarder chaque capture : on juge ce qu'un humain voit.
- Verdict par parcours : protégé / gêné sans raison / PIÉGÉ / perdu.
- Ne signaler en détail que ce qui est NOUVEAU par rapport à `coord/reports/AUDIT_APPLICATION_FINIE.md`, `coord/reports/EVAL_DESIGN_1.md`, `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md`, `3_prudente_clavier.md`.
- Leçon : la mise en place isolée a mangé presque tous les tours des testeurs. Écrire UN script de mise en place commun (chaîne + contrats + site sur un port donné, adresses dans un dossier donné) et UN script qui joue une liste de parcours d'affilée, puis lancer les testeurs dessus. Leur demander d'écrire le rapport dès le premier parcours.
- À lancer de préférence APRÈS les corrections de l'extension en cours, sinon ils retrouvent des défauts déjà connus.

## Interdits
Chaîne locale seulement. Aucun `.env` lu. Aucun jeu scellé ouvert. Aucun message d'arnaque écrit : seulement des phrases d'utilisateur. Aucun fichier du produit modifié par un testeur.

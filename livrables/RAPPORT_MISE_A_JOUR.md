# Rapport de mise à jour des livrables (11 oct. 2026)

Base : produit figé par Adem (voir `coord/HANDOFF_ADEM_SESSION_2.md`). Aucun code touché, aucun commit, aucun secret.

## 1. Fichiers changés

Réécrits :
- `livrables/CHIFFRES.md` (nouveau) : tableau unique, colonnes synthétique et données réelles, source et date par ligne, statuts [V]/[NV] de Z1 et Z5, liste des chiffres retirés.
- `livrables/PITCH_5MIN.md` (5 min + 2 min), `livrables/PITCH_3MIN.md` (3 min + 3 min), `livrables/VIDEO_SCRIPT.md` (un seul fichier, 2 min 40).
- `livrables/FICHE_DEFENSE.md` (555 mots avec la mise en forme, à tenir sur une page en 9 à 10,5 pt ; l'ancienne avait 842 mots), `livrables/SLIDE_CONFORMITE.md`, `livrables/PLAYBOOK_REPONSE.md`, `livrables/QR_JURY.md` (18 questions, dont les deux réponses préparées en tête), `livrables/MAPPING_REFERENTIELS.md`.
- `livrables/deck/DECK.md`, `livrables/deck/build_deck.js` et `livrables/deck/holdup.pptx` régénéré (9 slides, aucune mention « EN ATTENTE », rendu image non vérifié faute de LibreOffice).
- `README.md` racine, `pitch/DEMO_SCENES.md` (scène héros, signataire aveugle, « me connecter », diapo « ce qu'on ne couvre pas »).
- `livrables/EXPLICABILITE.md` : section 5 réécrite (responsabilité, produit figé).

Bandeaux « périmé » ou « à relire » ajoutés en tête, contenu intact : `livrables/ARCHITECTURE.md`, `livrables/INSTALLATION.md`, `pitch/JURY_ATTAQUES.md`, `pitch/comprendre_piste4.md`, `pitch/track1_4_pitches.md`, `pitch/track1_chiffres_sources.md`, `docs/BRIEF_direction.md`, `docs/intent-barrier.md`, `docs/architecture.md`, les cinq brouillons de `research/titouan/W_livrables/`.

Identifiants relus sur les sites officiels pendant cette mise à jour : ATT&CK T1657, T1566, T1204, T1684.001, T1070, T1036 ; D3FEND D3-MA, D3-UBA, D3-DA (aucun retenu) ; NIST CSF 2.0 DE.AE-02, DE.AE-07, DE.CM-09, RS.MI-01, RS.AN-06, PR.PS-04, PR.AA-05 (texte du PDF CSWP 29) ; OWASP Agentic ASI01, ASI02, ASI03, ASI09 (texte du PDF officiel). La page web OWASP ne contient pas la liste, seulement le lien du PDF. Textes de loi (DORA, MiCA, LCB-FT, AI Act) : repris de la session précédente, non relus.

## 2. Incohérences trouvées

**Chiffres cités dans plusieurs documents avec des valeurs différentes**
1. Latence du verdict : 1,26 / 3,55 ms (ancienne fiche), 25,94 / 38,73 ms (ancien playbook), 32,38 / 45,07 ms (ancienne fiche, exécution antérieure), 1,5 / 4,06 ms (ancien README), 18,39 / 34,08 ms (fichier `server/test/results.json` actuel). Retenu : le fichier actuel, avec « moins de 50 ms ».
2. Part d'approbations illimitées : Z1 et Z5 donnent « environ 45 % (957 sur 2 106, 200 blocs) » ; `result_eth.json` donne 47,7 % (10 427 sur 21 866). `result_avax.json` donne 34,2 % pour Avalanche alors que Z1 et Z5 écrivent « aucun chiffre sur Avalanche ». Les fichiers de résultat sont plus récents et non suivis par git.
3. La source du 13,9 % d'approbations illimitées : Cryptoticker (1 heure, 5 jetons) dans Z1, un message KuCoin Square sans méthode dans Z5. Chiffre retiré du tableau.
4. Le chiffre de 59,8 % (RAID 2022) s'écrit 60 % dans `RECHERCHE_chiffres_douleur.md`, et son statut est [V] dans Z1 et [NV] dans Z5.
5. ScamSniffer 2025 : statut [V] dans Z5, « titre [V], détails [NV] » dans Z1 (ligne 13). Revoke.cash 2025 : 7,446 M$ dans `RECHERCHE_these_moindre_privilege.md` contre « un peu plus de 6 M$ » dans Z3 ; cumul 355 M$ (Revoke.cash) contre 405 M$ (Coinbase, Z1, [NV]).
6. « Rappel » : tantôt warn ou rouge (ancienne fiche, README), tantôt rouge seul (`RESULTATS_INTEGRATION.md`, `BANC_REALISTE.md`). Le tableau sépare les deux. Les lignes A1 à A3 (6 191 arnaques, 9 908 cas) et A4 (3 254 arnaques, 6 456 cas) portent sur des jeux différents : leurs rappels ne se comparent pas (41,2 % contre 71,3 % pour le « moteur seul »).
7. Nombre de tests : moteur 447 ou 453 (rapport de décalage) contre 290 dont 2 échecs (README) ; extension 41 (README), 54 (jury, passe 4), 63 (passation d'Adem). À relancer avant citation.
8. Articles de la note de passation : « 920 ratées sans intention, 752, 804 » (sur 5 321 arnaques) et « l'intention parfaite en rattrape 34 » (sur 298 arnaques vertes) sont cohérents avec `RESULTATS_INTENTION_CLEF.md`, mais mesurent deux populations : ne pas les mélanger.
9. L'étude RAID cite 16, 14 ou 9 portefeuilles selon la section (Z1) : ne citer aucun pourcentage de portefeuilles.
10. `RESULTATS_INTENTION_CLEF.md` écrit qu'une intention classée peut baisser un verdict (26 arnaques rouges perdues avec Clef-flash), alors que `SLIDE_CONFORMITE` et `EXPLICABILITE` affirmaient « un modèle ne peut qu'aggraver ». Corrigé dans les deux, avec la mention du garde-fou en cours d'application.
11. MetaMask et le sosie d'adresse : D-009 écrit « alerte bloquante » ; la doc lue parle de « blocking warning » et de « speed bump » dont le geste de sortie n'est pas décrit. Le mot « bloquant » n'est pas repris.

**Fuji** (Fuji n'est pas servi par l'API d'alertes de MetaMask ; son silence là ne prouve rien, aucun document mis à jour ne le dit autrement)
- `PRODUCT.md` ligne 33 : « Démo sur Avalanche Fuji ». Fichier hors de mon périmètre.
- `coord/DECISIONS.md` D-007 (drainer déployé en direct sur Fuji) et D-008 (« la démo du jury se joue sur Fuji avec un vrai portefeuille ») ne sont pas remplacées : D-009 ne parle pas de Fuji. La ligne demandée par le jury (« démo sur copie locale, Fuji non déployé ») n'existe pas.
- `docs/BRIEF_direction.md` §7 et `docs/intent-barrier.md` ligne 76 annoncent une démo sur Fuji : bandeau périmé ajouté. `docs/architecture.md` : idem. `docs/comprendre.html`, `docs/explainer.html`, `docs/dashboard/index.html`, `docs/design/v3/CONTENU.md`, `docs/demo/banc/README.md` citent aussi Fuji : non modifiés, à relire.
- `blockchain/DEPLOYMENTS.md` : vide. README, ARCHITECTURE et INSTALLATION disent « non déployé », ce qui est exact.
- `RECHERCHE_metamask_couverture.md` : la page support liste Avalanche pour les simulations « onchain » d'Added Protection alors que EIP-7702 n'est pas actif sur Avalanche [NV] : à tester.
- Tous les livrables mis à jour disent « chaîne locale » et ne disent jamais « sur Fuji ».

**Autres**
- `PRODUCT.md` et `docs/design/REGLES_avertissements.md` décrivent encore Sentinelle, une retenue de 10 min et de 30 s : hors périmètre, à aligner par le propriétaire.
- Les trois clips de `livrables/video/` montrent l'ancien produit (leurre, RPC de garde, sosie) : plus utilisables (dossier non modifié).
- `README_DRAFT.md` de `W_livrables` et `RESULTATS_A_JOUR.md` contiennent « Sentinelle » et des chiffres retirés : bandeau ajouté, non réécrits.

## 3. Ce qui manque

1. Vidéo unique : à enregistrer à la main (le garde-fou de la session refuse Chromium avec débogage). Script prêt : `VIDEO_SCRIPT.md`.
2. Correctifs de l'extension non vérifiés (Q16 durée de retenue, Q17 plafonnement automatique). Les livrables disent « en cours » et ne citent aucune durée.
3. Jeu aveugle « décalage » (250 cas), grille de 1 500 paires, mesure de Clef sur la comparaison (pas de clé chez nous).
4. Essai avec un vrai portefeuille, idéalement sur Sepolia, pour remplacer la lecture du code de MetaMask par une constatation à l'écran.
5. Journal : la phrase écrite et la réponse du modèle n'y sont pas, donc pas de rejeu complet de la comparaison. Ancrage Fuji non fait.
6. Rendu visuel du pptx à vérifier dans PowerPoint ; fiche d'une page à imprimer pour vérifier la mise en page.
7. Textes de loi de la slide de conformité non relus dans cette mise à jour.
8. Séquence d'installation de `INSTALLATION.md` à réécrire pour le produit figé.
9. Nommage « Hold up » : disponibilité non vérifiée (mémoire du projet).

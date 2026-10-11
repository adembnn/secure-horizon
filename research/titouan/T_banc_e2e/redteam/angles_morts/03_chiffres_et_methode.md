# Angle mort 03 : chiffres et méthode (lecture d'un juré détecteur)

Rédigé le 11 oct. 2026 par relecture critique, sans modifier aucun fichier existant. Rejeu en lecture seule avec `redteam/check.mjs` et `check_plus.mjs` (sur `jury_*.jsonl` et sur des copies dans le dossier temporaire de la session). V2_TEST n'a pas été lu, ni haché, ni exécuté. Aucun `.env*` lu. Les agents voisins modifient `detectors_adem/` pendant la relecture : les chiffres `check_plus` ci-dessous valent pour l'arbre de travail à l'heure de la lecture.

Chemins relatifs à `research/titouan/` sauf mention. `T` = `T_banc_e2e/`.

## 0. Verdict en cinq lignes

1. Les documents de `W_livrables/` et `pitch/JURY_ATTAQUES.md` sont globalement honnêtes sur le statut « synthétique » et « réglé sur DEV ». Les trous sont ailleurs : dans les chiffres plus récents (passation, tableau de bord), dans des affirmations d'architecture au présent, et dans la méthode.
2. Aucun chiffre aveugle n'existe. BLIND_v1 et V2_TEST n'ont jamais été passés (confirmé : aucun script ne lit BLIND_v1, V2_TEST est refusé par trois scripts sur le seul nom de fichier). Le seul TEST original (R003) est « grillé » : ses chiffres par famille sont publiés dans `COUVERTURE.md`, donc les correctifs suivants ne sont plus indépendants de lui.
3. L'asymétrie de la mesure favorise l'outil : le rappel compte `warn` comme détection, la fausse alerte ne compte que `critical`. Sur les bénins, 11 % à 61 % de `warn` ou `critical` selon le jeu, rarement dit.
4. Les détecteurs d'Adem (`detectors_adem/`) ne sont pas dans le serveur ni l'extension (vérifié : seuls `redteam/check_plus.mjs`, `gen_fuzz_control.mjs` et un test les importent). Le serveur livré fournit un contexte vide (`_tokenInfo: {}`, `_facts: {}`, `ageBlocks: {}`, `_sharePct: undefined`) alors que le banc donne au moteur un contexte « oracle » écrit par le générateur. Le rappel du banc n'est donc pas le rappel du produit.
5. La « scène héros » (permit) : l'alerte de la passation est en grande partie un artefact du fuzzer (voir section 3). Elle masque d'autres trous réels, plus étroits.

## 1. Affirmation par affirmation

Format : où c'est dit / ce que montrent les preuves / formulation honnête.

### 1.1 Rappel et fausses alertes

**A1. « DEV : 100 % de rappel, 0 % de fausses alertes » (252/252, 0/90).**
- Où : `docs/dashboard/data.json` (stage « DEV 100 % / 0 % après réglage »), `docs/demo/banc/data.json` (`apres_corrections`), `COUVERTURE.md` (section boucle), `HANDOFF` (« réglage, pas robustesse »).
- Preuve : le jeu DEV a servi à écrire les 10 correctifs ; `JOURNAL.md` reconnaît que F10 a été motivé par les 6 cas qu'il rattrape, que F4, F9, F10 ne sont pas validés contre les bénins (DEV n'a ni cas 7702, ni bénin Multicall3, ni bénin avec `claimed_site`/`ens`), et que l'étiquette « malveillant » de ces 6 cas est discutable (un `approve` exécuté par Multicall3 n'engage pas les fonds de la victime, et `LOOP_JOURNAL` le confirme pour 20 cas V2). Le « rappel 100 % » est aussi un rappel `warn` inclus : en `critical` seul, 88,9 % (224/252).
- Le chiffre est correctement réservé dans la page de démo (« prouvent la couverture, pas la robustesse ») mais le tableau de bord le met en bandeau sans réserve visible.
- À dire : « 252 cas sur 252 sur le jeu où nous avons réglé les règles ; c'est un test de non-régression, pas une mesure. Sur le seul jeu mis de côté (ouvert une fois, avant les correctifs) : 94,5 % de rappel dont 83,6 % en critical, et 23,1 % de fausses alertes critical. »

**A2. « TEST : 94,5 % de rappel, 23,1 % de fausses alertes ».**
- Où : `W_livrables/*`, `JURY_ATTAQUES.md`, demo `note_test`.
- Preuve : vrai pour R003 (104/110 et 18/78), bras « intention mensongère » (celle du catalogue, soufflée par l'escroc). Mais : (a) TEST a été écrit par un auteur non aveugle, avec les mêmes générateurs que DEV (`COUVERTURE.md`, « sous-familles présentes des deux côtés ») ; (b) le tour R003 a publié les familles en échec de TEST (Seaport 4, mint 2, Multicall 4, EIP-7702 4, adresse empoisonnée 4), puis F1, F3, F5, F10 ciblent exactement ces familles côté DEV. `JOURNAL.md` dit « TEST jamais lu par cette boucle » : exact au sens de la lecture du fichier, faux au sens de l'information. (c) Le bras « intention honnête » ne donne que 10,3 % de fausses alertes critical, le plancher 5,1 % : trois chiffres pour le même jeu, selon le bras ; le plus bas est cité quand il arrange.
- À dire : « les 23 % sont la pire des trois mesures (intention mensongère) ; 5 % sans intention. Aucune n'est aveugle : le jeu est à la fois écrit par nous et consulté. »

**A3. « Jeu aveugle : hash publié avant le test, écrit sans voir le moteur ».**
- Où : demo `aveugle.publiee`, `JURY_ATTAQUES.md` §0, `SLIDE_CONFORMITE.md`.
- Preuve : le SHA-256 de BLIND_v1 correspond (vérifié : `38ebd60c…90aa`). Rien n'a été passé. Le hash est dans le même dépôt que le fichier, contrôlé par la même équipe : il prouve l'immuabilité après coup, pas l'indépendance. L'indépendance repose sur la parole des agents (« n'ont lu ni le moteur ni run/ ») et sur `BRIEF.md`, non vérifiable. 30 cas de BLIND_v1 sont affichés dans la démo avec leur verdict attendu, donc visibles de toute l'équipe. V2 : DEV et TEST viennent des mêmes six générateurs paramétriques, séparés par `sha256(id) mod 10` : TEST est la même distribution et les mêmes gabarits que DEV (voir M2).
- À dire : « deux jeux écrits par d'autres agents que le moteur, hash figé ; aucun n'a encore été passé ; leur indépendance n'est pas démontrable. »

**A4. Résultats V2_DEV (présents dans `T/run/out/v2/MESURE_reg_f13.md`, absents de `W_livrables`).**
- Preuve : sur V2_DEV (5 927 cas, jeu de réglage de F11 à F13 et des détecteurs), rappel 98,5 %, critical 84,3 %, FA critical 0,8 % (plancher) à 3,5 % (catalogue), mais FA `warn+critical` brut 60,7 % (1 200/1 976), « au-delà du toléré » 47,3 %. Fraude conforme alertée 58,6 % à 83,4 %. Avant la normalisation, 4 410 cas sur 5 927 sortaient en `error` (LOOP_JOURNAL tour 0) ; `check.mjs` n'a été validé identique à `run_loop` que sur 1 397 cas décodables de V2_DEV sur 5 927 (24 %).
- Écarts non expliqués : FA critical 0,8 % (V2_DEV) contre 17,9 % (jury_fp) contre 16,2 % (fuzz_fp) contre 5,6 % (DEV plancher) contre 23,1 % (TEST).
- À dire : « le taux de fausses alertes critical va de 1 % à 23 % selon le jeu ; nous n'avons aucune mesure sur trafic réel de l'outil complet. »

**A5. « 0,28 % d'alertes sur trafic C-Chain réel » (6 325 tx).**
- Où : `RESULTATS_A_JOUR`, `FICHE_DEFENSE`, `README_DRAFT`.
- Preuve : c'est le « filet v0 » à 5 règles, sans intention, sans simulation, « légitime » présumé. Ce n'est pas l'outil. Sur Ethereum le même filet donne 2,98 %. Mis côte à côte avec « 23 % » dans la même colonne, le lecteur peut croire que l'outil complet est à 0,28 %.
- À dire : « 0,28 % est le taux d'un filet de 5 règles qui n'est plus l'outil ; le taux de l'outil complet sur trafic réel est inconnu. »

**A6. « Rappel 72,7 % (24/33) sur droits réels ».**
- Preuve : n = 33, étiquettes ScamSniffer (tiers), 170 spenders concentrés, règle R3 possiblement circulaire, drainers déjà listés. Honnêtement présenté dans `RESULTATS_A_JOUR`. Mais le tableau de bord (`docs/dashboard/data.json`, journal 01:30) cite encore « 82 % des drainers réels vus » et « 2,8 fausses alertes / 1000 » dans la ligne de 01:30 et la règle « contrat neuf 1,2 % » : ces chiffres sont dans la liste RETIRÉS de `RESULTATS_A_JOUR` (81,9 % retiré, signal jeune retiré). La ligne de 02:35 les corrige, mais les deux restent à l'écran.
- À dire : retirer la ligne 01:30 du tableau de bord, ou la barrer.

**A7. Asymétrie rappel / fausse alerte.**
- Preuve : « rappel = warn ou critical » ; « fausse alerte critical = bénin classé critical ». Sur TEST total (intention mensongère) : rappel critical 83,6 % contre FA critical 23,1 % ; rappel warn+critical 94,5 % contre FA warn+critical 51,3 %. Le warn « d'opacité » (calldata ou typed data non décodé) est compté comme détection (`COUVERTURE.md` : « comptés comme attrapés ») : un moteur qui avertit sur tout ce qu'il ne comprend pas gagne du rappel sans rien détecter. Sur V2_DEV, 60,7 % des opérations honnêtes reçoivent au moins un warn.
- À dire : toujours citer la paire (critical, critical) et la paire (warn+critical, warn+critical), et la part du rappel due au warn d'opacité.

**A8. Intervalles de Wilson.**
- Preuve : ils supposent des cas indépendants. DEV, TEST et V2 sont des variantes de gabarits (graine fixe, combinatoire). Un intervalle `[98,0 ; 98,9]` sur 2 930 cas qui sortent de quelques dizaines de gabarits n'a pas de sens statistique. Même remarque pour les « 135 000 cas » du red team (voir A12).
- À dire : « intervalles indicatifs, calculés comme si les cas étaient indépendants. »

### 1.2 Sur-ajustement et codage en dur

**B1. Pas d'adresse ou d'identifiant de jeu dans le moteur : exact pour ce qui est contrôlé.**
- `run/check_nohardcode.mjs` passe (« OK : aucune adresse/hash/id… dans 7 fichiers »). Aucune adresse littérale dans `policy.mjs` ni `rules_extra.mjs`. `engine/src/registry.mjs`, `util.mjs`, `typed.mjs`, `audit_selectors.mjs` contiennent des adresses (registres publics : Permit2, routeurs) : attendu.
- Trous du contrôle : il ne couvre ni `detectors_adem/` (13 adresses dans `official_tokens.mjs`, 1 dans `nft_orders.mjs`, 1 dans `util.mjs`), ni `engine/src/rules.mjs`, ni `registry.mjs`. Je n'ai trouvé aucun identifiant de cas, nom de sous-famille ou champ d'étiquette (`added_how`, `label`) lu par les détecteurs (`LOOP_JOURNAL` note qu'un `book_trust` fondé sur `added_how` a été écarté à raison : c'est une étiquette du générateur).
- Le sur-ajustement n'est pas par adresses mais par forme : F5 à F10 ciblent des motifs présents dans DEV (aveu dans `COUVERTURE.md`), `sig_rights` a été écrit après lecture des survivants de `jury_fuzz_sig` (voir B2).
- À dire : « pas de codage en dur par identifiant ni adresse de jeu ; mais les règles sont écrites contre les formes de nos propres jeux. »

**B2. Les fichiers « jurés mesurés une seule fois, sans réglage » ne sont plus des jeux de contrôle.**
- Où : `LOOP_JOURNAL.md` (« mesurés au dernier tour, sans réglage dessus »), `HANDOFF` (« fuzz_sig 1 101 → 879 »).
- Preuve : le commit `1226d42` (« sig_rights detector … ») a été écrit contre ces survivants. Rejeu actuel `check_plus` : fuzz_sig 352 ratés (pas 879), fuzz_encoding 303 (pas 879), fuzz_intent 404, fuzz_address 273, jury_defi 22, jury_social 39, fuzz_control 368. Les chiffres 879/879 du journal et de la passation sont périmés, et les gains récents sont des gains sur le jeu d'entraînement.
- Les fichiers fuzz ne contiennent que des survivants de mutation (`LOOP_JOURNAL` : « taux de base 100 % par construction »). `jury_fuzz_fp.jsonl` ne contient que des fausses alertes (509/509 par construction) ; le « 16,2 % de 32 545 » vient d'un générateur (`fuzz_fp_gen.mjs`, graine 11, 40 opérations par sous-famille, 98 sous-familles) qui pèse chaque sous-famille de façon égale et inclut des « mauvais boutons » (69 % de critical si `connect_or_accept_offer`). Ce n'est pas un taux d'utilisateur réel.
- À dire : « ce sont des cartes de trous, pas des taux. »

**B3. Contexte « oracle » du banc contre contexte vide du produit.**
- Preuve : les règles F6 à F9 lisent `token_info`, `token_registry`, `claimed_site`, `ens`, `counterparty_facts`, `quote`, `share_of_balance_pct`, des champs que le générateur du cas fournit. `server/server.mjs` construit `_tokenInfo: {}`, `_facts: {}`, `ageBlocks: {}`, `_sharePct: undefined`, `contexte local` limité à contacts et historique. Honeypot, faux jeton, sosie de domaine ou ENS, âge du contrat, part du solde, ne peuvent donc pas se déclencher dans le produit avec ce contexte. `webdemo/limites.html` le dit à moitié (« signaux qui demandent le réseau sont absents »), `W_livrables` pas du tout.
- Aucune mesure du chemin serveur sur les jeux (seulement 33 tests unitaires). Le rappel DEV de 100 % décrit un moteur que le produit n'est pas.
- À dire : « les chiffres du banc supposent un contexte (âge, réputation, simulation de vente) que la version livrée ne calcule pas encore. »

### 1.3 Détecteurs d'Adem et protection des utilisateurs

**C1. `detectors_adem/` : copie du banc, pas le produit.**
- Preuve : ni `server/server.mjs`, ni `extension/`, ni `extension_standalone/build_standalone.mjs` ne les importent. Le journal de passation le dit (« copie de la chaîne : il faut les intégrer »). `HANDOFF`, tableau de bord (« Détecteurs : honeypot et taxe (testés sur fork réel), lots, permit… ») et `LOOP_JOURNAL` (« gardé ») utilisent le vocabulaire du produit. « Test réel sur fork » : contrats synthétiques sur Hardhat local, aucune clé, Fuji non testé ; « testé sur fork réel » sur le tableau de bord se lit comme un fork de réseau réel : à corriger.
- À dire : « ces détecteurs ne protègent aucun utilisateur aujourd'hui ; ils améliorent un banc. Toute phrase au présent sur leur effet est fausse. »

**C2. Chiffres de gain.**
- « Ratées 244 → 49, fausses alertes 204 → 79 » : mesuré sur V2_DEV, le jeu même qui a guidé les tours. Les 125 `warn` supplémentaires sur bénins (NFT ramenés de critical à warn) augmentent la fatigue. Le texte « sans régression » est vrai pour les `critical`, pas pour l'alerte totale (1 095 → 1 220 warn sur bénins).

### 1.4 Fausses alertes vues par un utilisateur honnête

**D1.** Rejeu : `check.mjs jury_fp.jsonl` → 22/123 critical (17,9 %), 63 warn (51,2 %), 38 ok (30,9 %). Donc 69 % des 123 opérations honnêtes reçoivent un écran d'alerte. `check_plus` : mêmes 22 et 63 (les détecteurs n'ont rien changé). Fuzz FP : 16,2 % critical, 57,2 % warn, soit 73 % d'alertes ; déclarer honnêtement son intention donne 12 % de critical contre 4 % sans intention ; « vague » et « complète » donnent le même verdict (le comparateur ne lit que `kind`). V2_DEV : 60,7 % de `warn+critical`.
- Où c'est minimisé : `FICHE_DEFENSE` et `README_DRAFT` §6 citent « 23,1 % critical sur TEST » et omettent la fatigue (51 % à 69 %) et le chiffre 17,9 % / 16,2 % qui est plus récent et sur des opérations avalanchiennes (Aave, Benqi, sAVAX, CCTP, abonnements). `RESULTATS_A_JOUR` ne contient aucune des mesures du red team FP.
- À dire : « sur des opérations honnêtes, l'utilisateur voit une alerte dans plus de la moitié des cas et un écran critique dans 12 à 18 % ; avec une alerte aussi fréquente, le taux d'attention est la première limite du produit. »

### 1.5 Latence et temps de détection / réponse

**E1.** `FICHE_DEFENSE`, `RESULTATS_A_JOUR` : « médiane 25,94 ms, p95 38,73 ms, max 106,36 ms, 400 requêtes ». Le fichier `server/test/results.json` actuel dit médiane 32,38, p95 45,07, max 55,41 : les chiffres cités ne correspondent plus à aucun fichier présent. De plus, les « 400 requêtes » sont 8 requêtes distinctes répétées 50 fois (`server.test.mjs` l. 86 à 90), 100 d'entre elles (25 %) renvoient `unknown`, et le test ne mesure ni RPC, ni fork, ni modèle, ni navigateur. La première requête a pris 138 ms.
- « Temps de détection » : il n'y a pas de notion de temps de détection d'un incident ; le moteur évalue une requête avant signature. Ce que les juges nomment « time to detect » n'existe pas. « Temps de réponse » : 10 min et 30 s sont des réglages sans mesure ; la retenue de 10 min a été testée à 2 s ; le service worker MV3 peut mourir avant ; le temps de décision est journalisé sans valeur ; `ESSAI_REEL_RESULTATS.csv` est vide (aucun essai MetaMask).
- À dire : « latence de calcul du verdict en local sur 8 requêtes types : 30 à 50 ms. Aucune mesure de bout en bout, d'efficacité sur personne, ni de tenue de la retenue. »

**E2. Test des 33 / 66 / 447.** « Moteur : 447 tests rejoués » (`README_DRAFT`, `RESULTATS`, tableau de bord). Rejeu ici : `node --test test/*.test.mjs` donne 290 tests, 288 passent, 2 échouent (fichier `bench/data/permit2_logs.json` absent d'un dépôt propre). Le total 447 n'est pas reproduit ; `JOURNAL.md` parle de 212. Remarque : l'exécution de ces tests écrit `engine/out/real_results.json` (j'ai restauré le fichier, `git status` propre). Un juré qui rejoue obtient un fichier modifié.

### 1.6 Jev / Clef, ancrage, extension

**F1. Jev et Clef.**
- Où : `FICHE_DEFENSE` (« Le modèle ne peut qu'aggraver »), `README_DRAFT` §3, `JURY_ATTAQUES.md` §0 et juré 4, `SLIDE_CONFORMITE` colonne 3 (transparence : « l'utilisateur sait quand un message a été classé par un modèle »), `docs/dashboard` (innovation : « Dit / affiché / fait avec vision Clef »), `G-5`.
- Preuve : aucune clé (`CF_*`, `JEV_API_KEY` absentes), `app/intent/src/providers/{cloudflare,jev}.ts` existe, mais `server.mjs`, `run_loop.mjs`, `policy.mjs`, `check.mjs`, `check_plus.mjs` n'appellent jamais `classifyMessage` ni `parseIntent`. Le message collé n'est lu par rien : `jury_social` : 41/73 contournements sur la chaîne de base, 39/73 avec les détecteurs ; un faux support classique passe en `ok`. La confiance du comparateur est figée à 1,0 (aveu dans `JURY_ATTAQUES`). La fiche de défense cite ATLAS AML.T0051 (injection) comme référentiel alors qu'aucun texte libre n'est traité par un modèle : la couverture ATLAS est sans objet aujourd'hui. Aucune comparaison modèle contre mots-clés n'a été faite (la mesure demandée dans la passation, 546 messages `fraud_ambig`, n'a pas eu lieu).
- À dire : « aucun modèle n'est appelé dans la version actuelle ; la décision est du code et des mots-clés (encore non branchés sur le message collé). Jev et Clef sont un choix de conception, non démontré. »

**F2. Ancrage Fuji.**
- Où : `docs/demo/banc/index.html` (« L'empreinte finale du journal est ancrée sur Avalanche Fuji », au présent), `data.json` `preuve.texte` (idem) alors que `snowtrace_url` et `contrat` valent `null`; `JURY_ATTAQUES` Q5 (« ancré sur Fuji »), `SLIDE_CONFORMITE` (état « en cours », correct), `PLAYBOOK` (idem).
- Preuve : `blockchain/DEPLOYMENTS.md` est un tableau vide. Le dossier `anchor/` existe maintenant (contrat `EvidenceAnchor.sol`, scripts, vérificateur) mais aucun `DEPLOYMENTS_ANCHOR.md` ni transaction, et la clé du wallet Fuji est en attente d'Adem (passation). Le journal chaîné est local et réécrivable en bloc : l'intégrité ne tient que si la racine est ancrée.
- Phrase à bannir : « chaque verdict est prouvable », « personne ne peut modifier ». Phrase vraie : « le journal détecte la modification d'une ligne isolée ; la réécriture complète n'est détectable qu'après ancrage, non déployé. »

**F3. L'extension.**
- Jamais testée avec MetaMask ou Rabby réels, ni avec ethers/viem/wagmi (`COMPAT.md` limites 10, 11). 64 PASS sur 66 avec un portefeuille simulé écrit par nous. Compatibilité 96 sites : le bras test est un Proxy du banc, pas l'extension ; « 0 casse sur 89 » est dit avec cette réserve dans `RESULTATS`, mais `README_DRAFT` l'écrit comme un résultat sur l'extension. Le « bruit A/A de 10,5 % » (erreur console sans différence d'injection) est du même ordre que le « 9 % de casse ou différence » : la mesure ne sépare pas le signal du bruit.
- Le service worker peut tuer la retenue de 10 min ; la fenêtre dans la page est imitable (`JURY_ATTAQUES`) ; les envois depuis l'interface du portefeuille ne sont pas vus : c'est dit.

### 1.7 Divers à corriger avant dimanche 13h

- `README.md` (racine) : « Projet : pas encore choisi ». C'est la première page vue par un juré, et GitGuardian parcourt le dépôt. À remplacer par le README jury (`README_DRAFT`), même provisoire.
- Nom du produit : « Sentinelle » (démo `banc`, `JURY_ATTAQUES`, `check.mjs`) et « Hold up » (W_livrables, installation). Unifier.
- Volume du red team : « ≈ 60 000 » (bandeau), « ≈ 95 000 » (métrique), « ≈ 135 000 » (passation). Le chiffre vrai du fichier `jury_fuzz_*.md` : 2 600 (sig), 8 360 (address), 3 669 (encoding), 43 852 (intent), 38 251 (control), 32 545 (fp), soit 129 000 environ, tous des cas générés par mutation, non indépendants. Citer « environ 129 000 variantes générées ; X cartes de trous » plutôt qu'un nombre d'« attaques ».
- Empreinte des règles `f952f3fb298f` : hash de `rules.mjs` + `compare.ts` seulement. R001 à R003 gardent la même empreinte alors que `policy.mjs`, `rules_extra.mjs` et `fixes.mjs` ont changé (le « hash code » change, lui). `PLAYBOOK`/`SLIDE_CONFORMITE` présentent cette empreinte comme version des règles rejouable : elle ne couvre pas le code qui produit les verdicts.
- Playbook §2 « L'éditeur est alerté » : le journal est local ; l'éditeur ne reçoit rien. Le réglage « proche de confiance » n'a pas de canal d'envoi (champ `contact` avec nom et téléphone par défaut « Claire (ma fille) », aucun appel d'API de message). À reformuler : « aucune alerte n'est envoyée à un tiers ».
- Playbook §4 : « kill switch », « règles signées, mode ombre, paliers » : décrit, non implémenté ; c'est écrit « non implémenté à la rédaction », bien.
- La démo `banc` montre « verdict attendu » (écrit avec le cas) sous forme d'animation d'arnaques « arrêtées » ; le README du dossier le précise, la page non (`verdict_mesure` est `null` pour les 30 cas). Un juré qui voit « arrêtée » croit à un résultat.

## 2. Trous méthodologiques

M1. **Aucun jeu indépendant n'a jamais été évalué.** DEV, TEST, REGRESSION_PUBLIQUE (écrite par nous « d'après des motifs publics ») : tous nos jeux. BLIND_v1 et V2_TEST : jamais passés. La seule mesure externe est le filet v0 (5 règles) sur 33 droits réels.

M2. **Fuite structurelle DEV vers TEST.** Même générateur, même graine, séparation par hash de l'id : les gabarits sont communs. Ce qui est « appris » sur DEV est donc disponible sur TEST. La protection (V2_TEST gelé) ne protège que contre la lecture, pas contre cette parenté. Un juré demandera un jeu de gabarits différents.

M3. **Étiquettes.** Elles viennent du générateur (`expected_severity`), pas d'une vérité terrain. 20 cas Multicall3 étiquetés malveillants sont une erreur du générateur (LOOP_JOURNAL) ; F10 les met à `warn` ; le rappel DEV de 100 % les compte comme détectés. `approximation` : adresses et ABI écrites de mémoire dans V2.

M4. **Adversaire non adaptatif contre adversaire adaptatif.** Le fuzz est exhaustif sur des mutations connues, mais le détecteur est ensuite écrit contre ses survivants : course où le défenseur voit les attaques. Ce qui reste n'est pas « ce qui tient » mais « ce que le fuzzer n'a pas essayé ». Le fuzz social et celui des jetons ont été arrêtés par un classifieur de sécurité : les surfaces correspondantes (message collé, jetons piégés) n'ont pas été fuzzées.

M5. **Métrique de succès définie par nous.** « Attrapé » = n'importe quel avertissement, même d'opacité ; « fausse alerte » = critical seulement ; fraude conforme rapportée à part (58,6 % à 83,4 % d'alertes sur V2, 3/24 non alertées sur DEV, « 4/4 » sur TEST avec n = 4). Aucune mesure d'effet sur le comportement (la littérature citée, 1,3 % à 48,6 %, est de laboratoire).

M6. **Le contrôle d'accès au jeu gelé est un contrôle de nom de fichier.** `/V2_TEST/i.test(file)` dans trois scripts : renommer le fichier le contourne. `TEST_OUVERTURES.json` enregistre une ouverture (R003) mais la boucle d'amélioration a ensuite tourné 13 correctifs sur DEV sans que personne ne puisse prouver ce que chaque auteur a vu.

M7. **Pas de ligne de base externe.** Le « 30 % contre 85 % » compare notre plancher à « simulation seule », notre propre référence, pas à Rabby, Blockaid ou MetaMask. `JURY_ATTAQUES` le dit.

M8. **Chaîne multiple.** Le rappel est mesuré sur un mélange Ethereum/Avalanche (20 % chaîne 1 en V2) alors que la cible est la C-Chain ; le seul jeu réel étiqueté est Ethereum.

## 3. Constat frais : l'alerte « le permit n'est jamais critical » est en grande partie un artefact du fuzzer

**Verdict : confirmé pour le permit EIP-2612 et le DAI permit ; réfuté comme « le moteur ne modélise pas un permit ».**

Faits, lus dans `redteam/jury_fuzz_sig.jsonl` (1 101 survivants) :
- Sur les 297 cas `eip2612` et 154 cas `dai` : `message.owner` (ou `holder`) n'est égal ni au signataire (`params[0]`) ni à `context.victim` dans 451/451 cas. Le propriétaire est une adresse aléatoire différente. Un permit EIP-2612 dont `owner` n'est pas le signataire échoue à `ecrecover` côté jeton : il ne peut rien prendre. La passation (« 377 sur 377 », « 174/174 ») compte donc des attaques qui ne fonctionneraient pas.
- Le moteur modélise bien le permit comme une approbation (`engine/src/typed.mjs` l. 67 à 72 : `t: 'approval'`, `owner`, `spender`, `amount`, `via: 'permit'`). L'explication de la passation (« il ne modélise pas une signature Permit comme une approbation ») est fausse. Il ne déclenche pas de `critical` parce que le propriétaire n'est pas l'utilisateur (même logique que F10 pour les lots).
- Expérience (copies dans le dossier temporaire, aucun fichier du dépôt modifié) : en remplaçant `owner` (EIP-2612) ou `holder` (DAI) par le signataire, tout le reste identique :
  - `check.mjs` (chaîne de Titouan) : `Permit` canonique (199 cas) : 169 critical ; DAI permit (154) : 137 critical ; types renommés (98) : 0 critical. Total 306/451 (68 %) contre 0/451.
  - `check_plus.mjs` : 384/451 (85 %) ; restent 67 ratés.
- Donc l'alerte surévalue le trou de 32 % à 100 %, et la scène héros (airdrop, permit illimité vers inconnu, intention « connect_or_accept_offer ») sort bien critical dans la chaîne de base : c'est cohérent avec le test serveur n° 2 (« permit EIP-2612 illimité → critical + F02 »).

Trous de signature réels qui subsistent (à vérifier à la main avant la démo) :
1. **Types renommés ou en casse différente** (`permit`, `PermitV2`, `Claim`, `Order`, `Login`, `Mail`…) avec un propriétaire valide : le moteur répond `unknown_typed_data` en `warn` (98 cas : 0 critical en base ; `check_plus` en rattrape 78). Échec en mode ouvert à `warn`, alors que le domaine pointe vers un vrai jeton. Un permit réel garde le nom `Permit` pour être valide on-chain, mais un faux jeton ou un contrat personnalisé peut choisir son nom.
2. **Intention `buy_or_swap` soufflée** : un permit illimité (≥ 2^128) vers un spender inconnu reste en `warn`, par tolérance d'usage du routeur : l'intention décidée par l'escroc abaisse le verdict. 30 des 199 `Permit` canoniques restent en warn ou ok après correction de propriétaire, dont 19 avec `buy_or_swap` (les 11 autres : intention absente ou nulle).
3. **DAI permit** : 17/154 restent `warn` après correction du propriétaire, y compris avec `check_plus`.
4. **Permit2 avec montant énorme mais différent de 2^160-1** : 71 à 72 survivants sur p2witness/p2single etc. (aucun champ propriétaire : ce sont des attaques réalistes). `check_plus` en traite beaucoup (`spend_rights`) mais pas tous.
5. **Blur à prix nul** (137 dans le fichier) : warn `unknown_typed_data` ; `nft_orders` y répond, hors produit.
6. **`personal_sign` d'un calldata en hexadécimal** (168) et **texte trompeur** (127, dont 70 % en `ok`) : réels (aucun propriétaire n'est en cause) ; `sig_rights` y répond (mots-clés, sans modèle), hors produit.
7. **Fail-closed sur `decode_error`, `unknown_typed_data`, `blind_signature`** : recommandé par le juré defi, non fait : toute signature illisible reste `warn`.

Conclusion pour la démo : la scène héros fonctionne avec un permit bien formé sur le chemin de base ; le risque est qu'elle repose sur `kind = connect_or_accept_offer`. Si l'on joue la scène avec l'intention « échanger », elle tombe à `warn`. À vérifier avec la commande exacte de la démo, pas avec le fichier fuzz.

## 4. Les 10 questions les plus dures d'un juré détecteur

**Q1. Quel est votre taux de fausses alertes, en un chiffre, sur des opérations réelles ?**
R. Nous n'en avons pas : aucune mesure de l'outil complet sur trafic réel. Sur nos jeux, l'alerte critical sur opérations honnêtes va de 1 % (V2_DEV) à 23 % (TEST, mesure ancienne), et de 12 à 18 % sur les deux jeux d'opérations honnêtes écrits pour nous nuire ; plus de la moitié reçoivent au moins un avertissement.

**Q2. Vos « 100 % » ?**
R. C'est le jeu sur lequel nous avons écrit les règles : un test de non-régression. Le seul jeu mis de côté, ouvert une fois et avant les correctifs, a donné 94,5 % de rappel (83,6 % en critical) et 23,1 % de fausses alertes critical.

**Q3. Vos jeux aveugles ont-ils été passés ? Qui les a écrits ?**
R. Non, pas encore : seul leur hash est figé. Ils ont été écrits par des agents qui n'ont pas lu le moteur, mais avec les mêmes générateurs pour réglage et test, donc leur indépendance reste à démontrer.

**Q4. Vos détecteurs protègent-ils l'utilisateur qui installe l'extension ?**
R. Pas ceux d'Adem : ils vivent dans une copie du banc, hors extension. Ce que l'extension appelle aujourd'hui est le moteur et la politique de Titouan, avec un contexte plus pauvre que celui du banc (pas de simulation de vente, pas d'âge de contrat).

**Q5. Si je change le nom du type signé ou son encodage, que se passe-t-il ?**
R. Un type inconnu sort en `warn`, jamais en `critical` dans la chaîne livrée : c'est un trou, mesuré sur 98 cas, que le détecteur du banc réduit sans l'éliminer. Les contournements sont publiés dans `BYPASS_REGISTRY.md`.

**Q6. Votre modèle (Jev ou Clef) apporte quoi ?**
R. Rien à ce jour : il n'est pas appelé, nous n'avons aucune clé et aucune comparaison avec les mots-clés. Il n'apparaîtra dans le pitch que s'il bat les mots-clés sur 546 messages avec un chiffre.

**Q7. Votre journal est « inviolable » grâce à la blockchain ?**
R. Non. Le journal chaîné détecte la modification d'une ligne, mais celui qui contrôle le fichier peut le réécrire en entier ; l'ancrage sur Fuji qui l'empêche n'est pas déployé. Nous ne dirons « prouvable » qu'avec une transaction vérifiable.

**Q8. Quelle est votre latence et votre temps de détection ?**
R. Le calcul du verdict prend 30 à 50 ms en local sur huit requêtes types, sans réseau ni simulation. Nous n'avons mesuré ni le délai de bout en bout, ni la tenue de la retenue de 10 minutes (testée à 2 s), ni le temps de décision d'une personne.

**Q9. Que devient la victime qui envoie volontairement sous la guidance d'un escroc ?**
R. Le moteur ne voit rien d'anormal dans l'opération elle-même ; seule la déclaration « on m'a demandé de le faire » ou des signaux de montant et de destinataire alertent : 58 à 83 % de ces cas sont alertés dans V2, 3 sur 24 passent sur DEV, et l'intention dictée par l'escroc (45 % du solde) passe en `ok`. Nous ne couvrons pas cette fraude et nous le disons.

**Q10. Pourquoi croire des chiffres que vous avez écrits vous-mêmes, mesurés par vos propres agents ?**
R. Vous ne devriez pas le faire sans réserve : c'est pourquoi nous publions les jeux, les générateurs, les contournements et les commandes de rejeu (`check.mjs`, `check_plus.mjs`). Ils mesurent la couverture de nos règles ; la robustesse face à un attaquant qui adapte son attaque est ce que le red team montre, avec des trous ouverts et listés.

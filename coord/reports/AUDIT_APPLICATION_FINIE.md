# Audit : l'application locale est-elle terminée ?

Date : 11 oct. 2026, 09h05 à 09h30. Auteur : agent QA (lecture seule, aucun fichier du produit modifié, aucun commit).
Référence testée : commit `5602248` (09h12), cloné à neuf dans un dossier temporaire. Le dépôt a reçu 8 commits pendant l'audit et l'arbre de travail contient des changements non commités d'autres agents : les constats valent pour ce commit, pas pour la suite.
Rapport arrêté avant la fin sur demande du coordinateur : voir la section « Non testé ».

## (a) Verdict

**Non, l'application n'est pas terminée.** Sur une installation neuve, le parcours honnête de la scène héros ne dit pas « Ça correspond » : il dit « Je n'ai pas pu vérifier » et impose 30 s d'attente ; le piège, lui, laisse partir le droit illimité en un clic, sans attente et sans limitation. Tout fonctionne seulement si l'on colle à la main un bloc JSON dans les réglages.

## Méthode

- Clone neuf (`git clone --depth 1`), `npm install` dans `blockchain/`, tous les tests lancés dans le clone.
- Chaîne locale isolée lancée depuis le clone (`HOLDUP_PORT=8548 npm run chain:local`, fork local d'Avalanche, lecture seule du RPC public), contrats déployés, site Neve du clone servi sur 8794. Raison : la chaîne partagée 8545 est utilisée en même temps par d'autres agents qui font `evm_revert` ; un de mes essais y a échoué pour cette raison.
- Vrai Chromium 1243 avec l'extension chargée, portefeuille simulé dans la page (clé neuve, chaîne locale), script `film_scene.mjs` puis un pilote dérivé gardé hors dépôt (clic sur Continuer, soldes, droits, journal).
- 25 passages joués. Aucun appel vers un système réel, sauf deux lectures publiques notées au point 20.

## (b) Ce qui marche, et la commande qui le prouve

| Ce qui marche | Commande | Résultat réel |
|---|---|---|
| Tests unitaires de l'extension | `node --test extension/tests/unit/*.test.mjs` (depuis `research/titouan/T_banc_e2e`) | 169 sur 169 |
| Contrôle statique du build autonome | `node extension_standalone/tests/static_check.mjs` | 21 lignes ok, 0 échec |
| Serveur de vérification et journal chaîné | `npm run test:server` | 33 sur 33 ; présentation 39 sur 39 |
| Contrats de démo | `cd blockchain && npx hardhat test` | 30 passent (110 s) |
| RPC de garde | `npm run test:rpc` (après `npm install` dans `blockchain/`) | 15 sur 15 |
| Relais du classifieur (tests) | `node --test research/demo_reelle/classifieur/relay.test.mjs` | 8 sur 8 |
| Ancrage du journal | `node research/titouan/T_banc_e2e/anchor/test_anchor.mjs` | « TOUS LES TESTS PASSENT » (64 s) |
| Labo | `node --test research/demo_reelle/lab/server/test/lab.test.mjs` | 8 sur 8 |
| Tests de la revue de sécurité | `node security_review2/tests/r0X_*.mjs` | r01 à r05 sortent en code 0 sur ce commit |
| Relais Clef en marche | `curl -X POST 127.0.0.1:8789/classify` | `"source":"clef","model":true`, 200 à 900 ms ; une page web est refusée (`bad-origin`) |
| L'extension source appelle bien le relais | scène jouée avec `extension/` + serveur 8787 + relais | journal : `"classifier":"clef"` |
| Piège, avec jetons déclarés | scène `?mode=piege`, phrase « échanger 50 USDC contre AVAX », Continuer | « Ça ne correspond pas… Droit limité à 50 USDC » ; le portefeuille reçoit `approve(…, 50000000)` au lieu de l'illimité ; droit final 50 USDC |
| Piège par signature | scène `?mode=piege&via=permit` | « Cette signature donne accès à tout ton USDC et ne peut pas être limitée », 30 s d'attente ; Annuler : rien n'arrive au portefeuille |
| Honnête, avec jetons déclarés | scène `?mode=honnete` | deux fois « Ça correspond », fenêtres fermées seules ; solde 100 → 50 USDC, 0 → 0,5 WAVAX |
| Relance sur phrase vague | phrases « ok », « 50 dollars », sans montant | une relance « Combien, et de quel jeton ? », puis verdict |
| Entrée vide | Entrée sans texte | rien ne part, la question reste |
| Double clic | double clic sur le site et sur Continuer | une seule demande arrive au portefeuille |
| Clic sur Continuer pendant l'attente | clic à 3 s sur 30 | sans effet |
| Nœud lent (4 s par lecture) | pilote avec délai | même résultat, 2e fenêtre après 6,6 s |
| Redémarrage à froid | même profil relancé | journal conservé (4 puis 8 lignes), panneau à jour |
| Moteur indisponible (extension source, serveur arrêté) | scène sans serveur 8787 | « Je n'ai pas pu vérifier cette demande », 30 s, jamais de passage silencieux |
| Temps mesurés | pilote | fenêtre ouverte 325 à 345 ms après le clic ; verdict environ 400 ms après Entrée (autonome), 1,1 s avec Clef |

## (c) Ce qui manque ou casse, par priorité

Les points marqués **[en cours]** sont annoncés par le coordinateur comme en cours de correction par un autre agent ; je ne les ai pas retestés après correction.

### Bloquant

1. **Parcours honnête cassé sur installation neuve. [en cours]** Fichier : `extension/written_check.js` ligne 186 (correctif S2). Preuve : « Je n'ai pas pu vérifier cette demande. Je ne connais pas ce jeton : je ne peux pas vérifier qu'il s'agit bien de USDC. Continuer sera possible dans 30 s. » Le jeton de démo (DUSDC, adresse neuve à chaque déploiement) n'est connu ni de la liste interne ni du contexte. Même résultat avec le zip. Effort : 1 à 2 h (déclarer les jetons de démo au déploiement, ou lire le nom du jeton sur la chaîne).
2. **Le piège passe en un clic sur installation neuve. [en cours]** Même cause. Preuve : « Réduis le plafond à 50 USDC dans ton portefeuille », bouton Continuer actif tout de suite, le portefeuille reçoit `approve(spender=drainer, montant=ILLIMITE)`, droit final illimité. La limitation automatique ne se déclenche pas. Résultat : l'honnête attend 30 s, le piège 0 s. Effort : lié au point 1, plus une attente quand la correction est impossible.
3. **La commande de démo du README ne sert pas la scène héros.** Fichier : `scripts/demo.mjs`. Preuve : aucune mention de `8793` ni de `site_echange` dans le script ; `--check` liste 8545, 8787, 8555, 8792, 8791, 8800, 8801. Le README annonce pourtant Neve sur 8793. Effort : 30 min.
4. **`npm run demo:deploy` échoue tel qu'écrit.** Fichier : `blockchain/package.json`. Preuve : `Error: Run with --network localhost (got "hardhat")`. Il faut `npm run demo:deploy -- --network localhost`. Effort : 5 min.
5. **Le zip livré n'est pas le dossier.** Fichiers : `dist/hold-up-standalone.zip`, `livrables/INSTALLATION.md`. Preuve : INSTALLATION annonce 40 fichiers et SHA `811d58…` ; le zip du commit a 45 fichiers et SHA `51cd51b5…` ; `diff -rq` montre 15 fichiers différents du dossier (moteur, `written_check.js`, `outcome.js`, `ui/screen.js`…). « Deux sources, le même contenu » est faux. Le second zip cité (`…-3fab41e8.zip`) n'existe pas. Effort : 15 min, à refaire après chaque build.
6. **Build autonome en retard sur le moteur gelé.** Preuve : `node extension_standalone/tests/run_tests.mjs` donne 31 sur 37 ; « EQUIVALENCE SERVEUR/AUTONOME : 116/132 » et « 1228/1540 verdicts identiques » ; 3 échecs « envoi natif jugé et libellé en AVAX ». Effort : reconstruire, puis relancer (30 min si rien d'autre ne casse).
7. **Révoquer n'existe pas dans l'extension. [en cours]** Fichier : `extension/REVOKE_BRANCHEMENT.md` (« Statut : spécification seule »). `revoke.js` n'est branché nulle part et n'est pas dans le build ; le panneau latéral n'a que « Exporter le journal », « Ouvrir les réglages », « Effacer l'historique ». Le test `revoke.test.mjs` échoue sur le dossier construit. Après un « Continuer », l'utilisateur n'a aucun geste de réponse. Effort : 3 à 5 h.

### Important

8. **Tests qui échouent sur un clone neuf, plus que ce que dit le README.** Moteur : 300 sur 306, 6 échecs (README : « 288 sur 290, 2 échecs »). Pipeline : 13 sur 15. Démo web : plantage. Cause : `attacks_public/PUBLIC.jsonl`, `redteam/V2_DEV_norm.jsonl`, `bench/data/*` ignorés par git (`*.jsonl`). Effort : 30 min (suivre les fichiers ou sauter proprement).
9. **Un test de la réponse échoue.** Fichier : `research/demo_reelle/reponse/matrix.json`. Preuve : `AssertionError: F34 is in 0 families` (17 passent, 1 échoue, 5 sautés faute de nœud sur 8549). La fiche F34 ajoutée au moteur n'a pas de famille de réponse. Effort : 10 min.
10. **Page de réglages de développeur. [en cours]** Fichier : `extension_standalone/extension/options.html`. Preuve : zone de texte JSON brut pour « Mon contexte », journal affiché en JSON brut, phrase fausse pour ce build (« Le seul appel réseau possible va vers le relais local 127.0.0.1:8789 » alors que le manifeste dit `connect-src 'none'`), case `limitUnlimited` lue par `options.js` mais absente de la page. Le carnet d'adresses y figure alors que la décision 6 l'a retiré. Effort : 2 à 3 h.
11. **Pas d'écran de bienvenue, pas de popup, pas d'icônes** au commit testé. Preuve : manifeste sans `icons` ni `default_popup` ; au premier lancement, seule `about:blank` est ouverte. Icônes annoncées intégrées depuis. Effort restant : 2 à 3 h.
12. **Messages de développeur à l'écran. [en cours]** « intention classée sans modèle » sous chaque verdict ; panneau latéral : « se voit avec tools/verify_journal.mjs » ; « 1 demandes vérifiées ». Effort : 20 min.
13. **Journal inexact sur deux points.** Le passage automatique de la 2e demande est écrit `"by":"human","decision":"confirm"` ; la limitation du droit à 50 USDC n'apparaît ni dans le journal ni dans le panneau (« Transaction · Danger · Continuée »). Gênant pour un auditeur. Effort : 1 h.
14. **« 50 dollars » n'est pas compris.** Preuve : honnête + « échanger 50 dollars » donne « Je n'ai pas pu vérifier… le droit de prendre 50 jetons » et 30 s ; avec Clef : « prendre 50000000 jetons » (montant brut, décimales non appliquées). Effort : 1 h.
15. **Documentation en retard sur le code.** README et INSTALLATION disent le build sans réseau et le relais non branché ; la décision D-015 (modèle par défaut) et le manifeste en cours disent l'inverse. `PRODUCT.md` dit le journal autonome non chaîné, le panneau dit « Le journal est chaîné ». INSTALLATION dit Chrome 111, le manifeste 114. README : « 83 sur 83 », réel 169. Effort : 1 h, à faire en dernier.
16. **Fichier d'adresses suivi par git et périmé.** `research/demo_reelle/site_echange/addresses.local.json` pointe vers des contrats d'un ancien déploiement ; sans `node config.js`, le site Neve vise des adresses vides. L'étape n'est dans aucune notice. Effort : 10 min.
17. **Le relais accepte toute extension locale** (revue S17, non épinglé). Preuve : appel avec une origine `chrome-extension://` inventée, réponse `source: clef`. Effort : 20 min (variable d'épinglage déjà prévue).

### Mineur

18. Le clone échoue sous Windows si le dossier de destination est long : chemin suivi de 147 caractères (`blind_decalage/run/essai/sorties/…/cache_clef/…json`), « Filename too long » sans `core.longpaths`. Dépôt de 299 Mo extrait.
19. `node --test extension/tests/unit/` (dossier seul) échoue : « Cannot find module ». Déjà dit dans INSTALLATION.
20. Deux lectures publiques hors machine pendant les tests : `chain:local` lit le RPC public d'Avalanche par défaut ; `test_anchor.mjs` lit le RPC public de Fuji (« bloc 59296639 »). Lecture seule, aucune transaction. À dire au jury ou à couper pour une démo hors ligne (`HOLDUP_CHAIN_MODE=plain`).
21. `npm install` : 55 vulnérabilités signalées (24 hautes) dans les dépendances de Hardhat ; Hardhat avertit que Node 25 n'est pas pris en charge.
22. Lancer les tests modifie des fichiers suivis (`server/test/results.json`, `BUILD_INFO.json`, `webdemo/engine/*`) : un juré qui teste salit son clone.
23. `pitch/demo-script.md` n'existe pas (seul `pitch/DEMO_SCENES.md`).
24. Entrée vide : aucun message à l'écran, la question reste telle quelle.

## (d) Attendus du hackathon

| Attendu | État | Preuve |
|---|---|---|
| README : problème, architecture, installation, limites | partiel | présent et honnête, mais chiffres de tests et « sans réseau » périmés (points 8, 15) |
| Installation reproductible | partiel | extension chargée sans erreur ; démo : points 3, 4, 5, 16 |
| Vidéo de 2 à 3 min | non vérifié | 3 fichiers dans `livrables/video/` au lieu d'une vidéo ; durées non mesurées ; `A_LIRE_ADEM` dit « à enregistrer » |
| Deck de 8 slides max | non vérifié | `livrables/deck/holdup.pptx` présent, non ouvert |
| Fiche de défense d'une page | non vérifié | `livrables/FICHE_DEFENSE.md` présent, non relu |
| PoC de bout en bout, détection à réponse | partiel | marche avec jetons déclarés à la main ; cassé sur installation neuve (points 1, 2) |
| Playbook de réponse | non vérifié | `livrables/PLAYBOOK_REPONSE.md` présent ; non comparé au code. La révocation qu'il pourrait citer n'est pas branchée (point 7) |
| Slide conformité | non vérifié | `livrables/SLIDE_CONFORMITE.md` présent |
| Détection (30 %) | partiel | chiffres dans `livrables/CHIFFRES.md`, non remesurés ici ; scène : piège et signature détectés ; fausses alertes annoncées élevées |
| Réponse (20 %) | partiel | annuler et limiter marchent ; révoquer absent ; attente inversée entre honnête et piège |
| Faisabilité et intégration (20 %) | partiel | vrai Chromium oui ; jamais avec un vrai portefeuille ; rien sur Fuji au commit testé |
| Conformité et explicabilité (15 %) | partiel | journal local présent et persistant ; inexact sur deux points (13) ; vérification après coup non testée |
| Pitch et démo (15 %) | non vérifié | formats 5 min et 3 min non chronométrés |
| Mapping NIST CSF et référentiels | prêt (non relu) | `livrables/MAPPING_REFERENTIELS.md`, README |
| Zéro secret, données synthétiques | non vérifié | aucun secret vu dans les sorties lues ; aucun balayage du dépôt fait |

## Non testé faute de temps

- `research/demo_reelle/audit/verify_decision.mjs` (vérifier une décision après coup) et `extension/tools/verify_journal.mjs`.
- `anchor:local` de bout en bout (seul `test_anchor.mjs` a tourné).
- Concordance de `livrables/PLAYBOOK_REPONSE.md` avec le code.
- Vidéo, deck, fiche de défense, pitchs : durées et contenu.
- Remesure des métriques (taux de détection, faux positifs) sur un jeu nommé ; seuls les temps de la scène sont mesurés.
- Balayage des secrets et des données personnelles dans le dépôt et les logs.
- Page de test `standalone_test_page/`, site Glacier (8791), `node scripts/demo.mjs` lancé en entier.
- Le build en cours avec Clef par défaut, les icônes, et les corrections annoncées : non retestés.
- Clic réel sur l'icône de la barre d'outils (le panneau a été ouvert par son adresse, pas par l'icône).

## État des services à la fin

- Chaîne locale : 8545, en marche (lancée avant l'audit, pas par moi).
- Site Neve : 8793, en marche. Le serveur lancé par un autre agent s'était arrêté ; je l'ai relancé (`node docs/demo/serve_static.mjs research/demo_reelle/site_echange 8793`).
- Relais Clef : 8789, en marche (pas lancé par moi).
- Arrêtés : ma chaîne isolée 8548, mon site 8794, mon serveur 8787.

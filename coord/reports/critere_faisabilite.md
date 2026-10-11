# Critère 3 « Faisabilité et intégration » (20 %) : boucle de relecture en juré

Date : 11 oct. 2026, avant gel 12h00. Auteur : agent livrable README / démo / installation / architecture. Méthode : je clone le dépôt dans un dossier temporaire hors du repo, j'ai dix minutes, je note ce que je vois (sur 20), je corrige, je recommence. Les clones d'essai : `clone` (HEAD seul), `clone2` et `clone3` (HEAD + les fichiers modifiés ou non suivis du poste de travail, pour simuler « après commit »). Ports décalés (18xxx) pour ne pas gêner les services déjà lancés sur les ports documentés.

## Passe 1 : état trouvé, 3/20

| Ce qu'un juré voit | Preuve |
|---|---|
| `README.md` dit « Projet : pas encore choisi », décrit le harnais Bedrock | `README.md` lignes 3-4 avant remplacement |
| Aucune commande de démo, aucun chiffre, aucune limite, aucune architecture | idem ; CLAUDE.md « Projet / Stack » est resté à TODO |
| Pas de `livrables/INSTALLATION.md` ni `ARCHITECTURE.md` | `ls livrables` |
| Clone de HEAD : `node --test` du moteur donne 288/290, 2 échecs sans explication | `engine/test/real.test.mjs` lit `bench/data/permit2_logs.json`, ignoré par `bench/.gitignore` |
| Clone de HEAD : ni le site leurre, ni le RPC de garde, ni le labo ne sont dans le dépôt (non suivis) | `git status` : `research/demo_reelle/site/`, `rpc_garde/`, `lab/` en `??` |

## Passe 2 : après README + demo.mjs, 12/20

Fait : README racine complet, `scripts/demo.mjs`, `package.json` racine, `.gitignore`.

Essai clone propre (HEAD) : `node scripts/demo.mjs` monte la chaîne, déploie les contrats et lance la console d'attaque et le serveur de vérification. Le site et le RPC sont sautés avec message, car absents du dépôt. Défauts trouvés et corrigés pendant l'essai :
- message « fichiers absents » listait des fichiers présents : corrigé (ne liste que les manquants) ;
- avertissement Node DEP0190 sur `npm install` sous Windows : corrigé (commande en chaîne) ;
- attente infinie remplacée par une surveillance des services qui tombent ; arrêt propre automatique `HOLDUP_DEMO_AUTOSTOP=<s>` pour tester ;
- version de Node : exigence relevée à 22.18 (retrait natif des types pour `compare.ts`), pas « 22 ».

Manque restant : INSTALLATION et ARCHITECTURE absents, chaîne de preuve du RPC non vérifiée de bout en bout.

## Passe 3 : après INSTALLATION + ARCHITECTURE + essai complet, 15/20

Essai `clone3` (HEAD + poste de travail), `npm install` automatique, 5 services lancés, vérifiés par requêtes : `/health` du serveur (200), `/state` de la console d'attaque, `lure.html` (200), `/health` et page du RPC de garde (200). `POST /check` d'un envoi simple répond (fiche F31, niveau attention). `demo_send.mjs approve` à travers le RPC de garde : retenue, niveau danger, « Rien n'est parti », lien de décision. Arrêt automatique : tous les ports libérés, aucun processus restant (netstat).

Tests rejoués sur le clone : moteur 288/290, serveur 33/33, RPC de garde 15/15, extension (unitaires) 41/41, contrats 30 passent, ancrage « TOUS LES TESTS PASSENT » (lit le RPC Fuji en lecture seule).

## Passe 4 : relecture d'honnêteté, 15/20 (plafond atteint sans action humaine)

Relu chaque phrase du README contre `03_chiffres_et_methode.md` : retirés « 447 tests » (290 trouvés), « 0,28 % » présenté comme l'outil complet (précisé : filet à 5 règles), rappel DEV 100 % (écrit comme non-régression), latence (valeur de ma machine, pas celle d'un fichier périmé). Identifiants NIST/ATT&CK/D3FEND repris de `livrables/MAPPING_REFERENTIELS.md` (vérifiés à la source par un autre agent) et non de la fiche de défense brouillon.

**Pourquoi pas plus de 15/20 :** (1) rien n'est déployé sur Fuji (`blockchain/DEPLOYMENTS.md` vide) ; (2) aucun essai avec un vrai portefeuille (`ESSAI_REEL_RESULTATS.csv` : 0 résultat) ; (3) aucune intégration plateforme ou fintech construite, seulement décrite ; (4) les fichiers qui font marcher la démo (site, RPC de garde, labo, scripts de chaîne) ne sont pas encore commités ; (5) détecteurs d'Adem non branchés. Ces cinq points ne se corrigent pas dans mes fichiers.

## Ce qu'un clone neuf manque (constats)

1. **Fichiers non suivis nécessaires à la démo** (à `git add` avant le gel, sinon `demo.mjs` saute ces services) : `research/demo_reelle/site/`, `research/demo_reelle/rpc_garde/`, `research/demo_reelle/lab/`, `research/demo_reelle/chain/lookalike.mjs`, `lookalike_worker.mjs`, `blockchain/hardhat.anchor.config.js`, `blockchain/scripts/demo/anchor.js`, `blockchain/test/demo/Lookalike.test.js`, `research/titouan/T_banc_e2e/context_live/`, `extension/{gatekeeper,hold_core,window}.*`, `extension/ui/`, `extension/tests/unit/`, `extension_standalone/extension/{gatekeeper,hold_core,window}.*`, `redteam/check_product.mjs`, `scripts/demo.mjs`, `package.json`, `livrables/INSTALLATION.md`, `livrables/ARCHITECTURE.md`. Et les modifications non validées de `blockchain/package.json` (scripts `anchor:*`, utilisés par le README de la chaîne) et d'`extension*`.
2. **`*.jsonl` est ignoré** : un clone n'a pas les journaux de décision (`rpc_garde/journal/decisions.jsonl`, `T_banc_e2e/journal/verdicts.jsonl`), créés au premier lancement : sans conséquence. Les jeux de test `blind_adem/**`, `attacks/*.jsonl` et `redteam/jury_*.jsonl` sont bien suivis (exceptions du `.gitignore`).
3. **Fichiers de données ignorés par `research/titouan/bench/.gitignore` (`data/*`)** : `permit2_logs.json` et `attack_approval_logs.json` n'existent pas dans un clone, donc 2 tests du moteur échouent. Correctif (hors de mes fichiers) : dans `research/titouan/bench/.gitignore` ajouter `!data/permit2_logs.json` et `!data/attack_approval_logs.json`, puis committer les deux fichiers (ou marquer ces deux tests `skip` quand le fichier manque).
4. **`blockchain/node_modules` absent** : `demo.mjs` lance `npm install` (environ 640 paquets, 14 à 40 s). Compilateur Solidity téléchargé à la première compilation (vérifié avec un cache Hardhat vide : 5 s, Internet requis).
5. **Effets de bord des tests sur des fichiers suivis** : `npm run test:engine` réécrit `engine/out/real_results.json`, `test:server` réécrit `server/test/results.json` : un juré qui rejoue voit `git status` sale. Correctif (hors de mes fichiers) : faire écrire ces deux tests dans un dossier temporaire ou dans `.gitignore`.
6. **Windows** : aucun chemin Unix en dur dans `demo.mjs` (`taskkill /T /F` pour l'arrêt, `process.execPath` pour lancer). Essayé uniquement sous Windows 11 avec Node 25.6.0. Non essayé : Linux, macOS, Node 22 à 24 (exigence de 22.18 lue dans la doc de Node, non testée).
7. **Ports codés en dur** (8791 pour le site côté CORS de la console d'attaque ; 8800 et 8801 pour le labo). `demo.mjs` accepte `HOLDUP_PORT`, `SENTINELLE_PORT`, `HOLDUP_RPC_PORT`, `HOLDUP_DRAIN_PORT`, `HOLDUP_SITE_PORT`, mais changer le port du site coupe le bouton « Réclamer » (CORS de `drain.mjs`).
8. `research/titouan/T_banc_e2e/INSTALL_FR.md` annonce « Node 22 ou plus » et `INSTALL_STANDALONE_FR.md` « Node 23.2 » pour la construction : trois seuils différents dans trois documents. `INSTALLATION.md` retient 22.18 pour l'exécution.
9. Générateurs `blind_adem/*.mjs` : importent ethers par un chemin absolu de la machine d'Adem (signalé par `README_DRAFT.md`, non revérifié ici).

## Hygiène du dépôt (ce que les jurys vérifient)

**Secrets.** Balayage de `git ls-files` (1 609 fichiers) et des fichiers non suivis non ignorés : motifs clé AWS, `ghp_`, `sk-`, `xox*`, `AIza`, blocs `BEGIN … PRIVATE KEY`, affectations `private_key|mnemonic|secret = 0x<64 hex>` : **0 correspondance**. Fichiers `.env*` suivis : uniquement des `*.example` (`.env.example`, `.env.bedrock.example`, `app/intent/.env.example`, `blockchain/.env.example`, `research/titouan/T_banc_e2e/vendor_t103/app/intent/.env.example`). Aucun `.env*` lu. Seul constat : trois fichiers contiennent un DSN Sentry public d'un site tiers, qui peut être signalé par GitGuardian : `research/titouan/T_banc_e2e/compat/results/A1/zora.json`, `A2/zora.json`, `B/zora.json`. Correctif exact : remplacer la valeur `<32 hex>@o…ingest.sentry.io` par `[sentry-dsn-redacted]` dans ces trois fichiers (propriétaire : Titouan).

**Fichiers suivis de plus de 20 Mo** (limite GitHub 100 Mo par fichier, avertissement à 50 Mo) :
- `research/titouan/T_banc_e2e/realscan/out/cache_96943598_97243597.json` : 95,1 Mo (90,7 MiB).
- `research/titouan/T_banc_e2e/blind_adem/v2/V2_DEV.jsonl` : 20,4 Mo (jeu de réglage, à garder).

Commandes proposées, **non exécutées** (elles changent l'index de tout le monde ; le contenu reste dans l'historique git) :
```
git rm --cached research/titouan/T_banc_e2e/realscan/out/cache_96943598_97243597.json
echo 'research/titouan/T_banc_e2e/realscan/out/cache_*.json' >> .gitignore
```

**Jeux aveugles suivis.** `research/titouan/T_banc_e2e/blind_adem/v2/V2_TEST.jsonl` (8,1 Mo, jeu gelé) et `blind_adem/BLIND_v1.jsonl` sont dans git et lisibles par tout juré, alors que les documents disent qu'ils n'ont jamais été lus. L'exception `!research/titouan/T_banc_e2e/blind_adem/**/*.jsonl` du `.gitignore` les laisse suivis. Deux options pour le propriétaire :
- assumer : écrire dans le README « V2_TEST publié, sha256 `V2_TEST.sha256`, jamais passé » ;
- retirer de l'index, en gardant les empreintes :
```
git rm --cached research/titouan/T_banc_e2e/blind_adem/v2/V2_TEST.jsonl research/titouan/T_banc_e2e/blind_adem/BLIND_v1.jsonl
printf '%s\n' 'research/titouan/T_banc_e2e/blind_adem/v2/V2_TEST.jsonl' 'research/titouan/T_banc_e2e/blind_adem/BLIND_v1.jsonl' >> .gitignore
```
(`.gitignore` : la règle doit venir **après** l'exception `!…blind_adem/**/*.jsonl`. Les fichiers `*.sha256` restent suivis.) Précision à ne pas oublier : `git rm --cached` n'efface pas l'historique ; V2_TEST reste lisible dans les anciens commits. Le dire, ou purger l'historique (décision humaine, refusé par CLAUDE.md sans accord).

**Données de personnes.** `realscan/out/campaign_tx_senders.json`, `candidates.json`, `sample.json` : adresses publiques de portefeuilles réels sur mainnet. À dire explicitement dans le README du dossier, ou tronquer (décision du propriétaire, voir `angles_morts/02_conformite_jury.md` #11).

**Incohérences de nom** (Sentinelle / Hold up ; « Antibody » : 0 occurrence dans les fichiers jury) :
- Le README, `livrables/*` et `extension*/manifest.json` (`"name": "Hold up"`) disent Hold up.
- Encore « Sentinelle » dans des fichiers que le jury ouvre : `PRODUCT.md` (2), `pitch/DEMO_SCENES.md` (3), `pitch/JURY_ATTAQUES.md` (7), `pitch/comprendre_piste4.md` (12), `pitch/track1_4_pitches.md` (1), `docs/architecture.md` (32), `docs/BRIEF_direction.md` (3), `docs/comprendre.html` (6), `docs/dashboard/index.html` (6), `docs/demo/banc/{index.html (5), data.json, README.md}`, `docs/design/**` (modales et pages), `research/demo_reelle/chain/README.md` (1), `research/demo_reelle/chain/lookalike.mjs` (1).
- Dans le code, visible à l'exécution : `server/server.mjs` (10 occurrences, dont `service: 'sentinelle'` dans `/health` et `engine: 'sentinelle-local'` dans chaque verdict), variables `SENTINELLE_PORT`, `SENTINELLE_JOURNAL*`, `SENTINELLE_CONTEXT`, `SENTINELLE_EXT_ID`, `extension*/bridge.js`, `inject.js`, `sentinelle_core.js`, `BUILD_INFO.json`. Renommer les variables casserait la démo : le README les déclare « ancien nom » plutôt que de les changer.

## Fichiers livrés par cet agent

`README.md` (remplacé ; l'ancien contenu, checklist du harnais, reste récupérable avec `git show HEAD:README.md`), `scripts/demo.mjs`, `package.json`, `.gitignore` (ajouts), `livrables/INSTALLATION.md`, `livrables/ARCHITECTURE.md`, ce rapport. Rien n'est commité.

## Incident

Pendant la session, un `git pull --rebase --autostash` lancé par un autre processus a mis en réserve puis perdu mon `README.md` ; je l'ai réécrit. Si un autre agent relance un pull, vérifier que `README.md` commence par `# Hold up` avant de committer (copie de secours dans le dossier temporaire de session).

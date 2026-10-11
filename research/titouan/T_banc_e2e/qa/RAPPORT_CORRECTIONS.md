# Corrections QA : rapport du 11 oct. 2026

Suite de `QA_RAPPORT.md`. Node 24.18.1, Windows 11. Un processus node à la fois. Aucun commit, aucun `.env` lu, aucun `npm install`, aucun Chrome.
Répartition respectée : rien n'a été modifié dans `extension\`, `extension_standalone\`, `engine\`, `run\`, `pipeline\`, `detectors_adem\`, `research\demo_reelle\`. Ce qui relève d'Adem est dans `qa\POUR_ADEM.md`.

## Tableau

| Id | État | Fichiers modifiés |
|---|---|---|
| C1 | corrigé | `scripts/verifier_installation.mjs` |
| C2 | corrigé (documenté, plus restauration par le script) | `webdemo/README_WEBDEMO_FR.md`, `scripts/verifier_installation.mjs`, `README.md`, `livrables/INSTALLATION.md` |
| C3 | corrigé, avec un constat neuf : r04 échoue aujourd'hui | `README.md`, `security_review2/REVUE.md` |
| C4 | corrigé | `webdemo/README_WEBDEMO_FR.md` |
| C5 | corrigé, prémisse ajustée : le bouton du panneau existe | `livrables/QR_JURY.md`, `livrables/CHIFFRES.md` (A18), `README.md` |
| C6 | corrigé | `essai_reel/PROTOCOLE_V2.md` |
| C7 | corrigé | `livrables/INSTALLATION.md` |
| C8 | documenté ; correctif des tests transmis à Adem (diff prêt) | `README.md`, `livrables/INSTALLATION.md`, `redteam/README.md`, `qa/POUR_ADEM.md`, `qa/c8_pour_adem.diff` |
| C9 | corrigé | `docs/demo/serve_static.mjs` |

## C1 : le script de contrôle remet le clone propre

Corrigé. Avant chaque suite, le script lit `git status` sur les zones que la suite réécrit. Après, il remet par `git checkout --` les seuls fichiers suivis qui étaient propres avant. Un fichier déjà modifié n'est pas touché : ligne `[attention]`. Un fichier non suivi créé est signalé, pas effacé. Sans git, le script avertit.

Zones relevées en lisant les suites :
- moteur : `engine/out/` (`real.test`, `cchain.test`, `compare.test`, `typehash.test` y écrivent) ;
- serveur : `server/test/results.json`, `journal/` (ignoré) ;
- contrôle statique : `extension_standalone/out/` (`STATIC.json`) ;
- build autonome : `extension_standalone/extension/`, `extension_sans_reseau/`, `extension_test/`, `out/` (`run_tests.mjs` relance `build_standalone.mjs`, qui efface puis réécrit le dossier) ;
- démo web (suite ajoutée au script) : `webdemo/BUILD_INFO.json`, `webdemo/engine/`, `webdemo/js/`, `webdemo/out/`.

Autre correctif : la suite « RPC de garde » est sautée (`[saute]`) quand `blockchain/node_modules/ethers` manque, au lieu d'un faux `[ECHEC]`.

Preuve : `node scripts/verifier_installation.mjs` (deuxième passage, 10 h 55).

```
[attention] moteur d'effets : 1 fichier(s) suivi(s) déjà modifié(s) avant la suite, ils seront réécrits et NE seront PAS remis : research/titouan/T_banc_e2e/engine/out/cchain_all.json
[ok]     moteur d'effets : 473 réussis sur 473 (50 s)
[ok]     extension (avec serveur) : tests unitaires : 215 réussis sur 215 (10 s)
[info]   serveur de vérification et journal chaîné : 1 fichier(s) suivi(s) réécrit(s) par la suite, remis à l'état de git
[ok]     serveur de vérification et journal chaîné : 33 réussis sur 33 (14 s)
[saute]  RPC de garde : exige ethers (blockchain/node_modules absent) : cd blockchain && npm install, puis npm run test:rpc
[ok]     relais du classifieur (modèle simulé) : 9 réussis sur 9 (1 s)
[ok]     build autonome : contrôle statique : 24 réussis sur 24 (0 s)
[info]   build autonome : suite complète : 1 fichier(s) suivi(s) réécrit(s) par la suite, remis à l'état de git
[ok]     build autonome : suite complète : 44 réussis sur 44 (26 s)
[info]   démo web (webdemo) : 1 fichier(s) suivi(s) réécrit(s) par la suite, remis à l'état de git
[ok]     démo web (webdemo) : 135 réussis sur 135 (4 s)
Résultat : 1 ligne(s) [ECHEC] ci-dessus.
```

La seule ligne `[ECHEC]` restante est `blockchain/node_modules est absent` : vrai sur cette machine, `npm install` interdit ici.

Après le passage, `git status --porcelain` sur `engine/out`, `server/test`, `extension_standalone`, `webdemo` ne montre que `engine/out/cchain_all.json`, déjà modifié avant (travail d'un autre agent) et annoncé en `[attention]`.

Limite : `cchain_all.json` a été réécrit par la suite du moteur (comme avant ce correctif). C'est une sortie générée, mais si quelqu'un y tenait une version à la main, elle est remplacée.

## C2 : la démo web réécrit des fichiers suivis

Corrigé par la documentation et par le script. Le fichier de test appartient à un autre agent : pas d'option ajoutée dedans.
- `webdemo/README_WEBDEMO_FR.md` : paragraphe « Attention : ces deux commandes réécrivent des fichiers suivis par git », liste des fichiers, commande `git checkout -- webdemo/BUILD_INFO.json webdemo/engine webdemo/js webdemo/out`, et renvoi au script.
- `scripts/verifier_installation.mjs` lance aussi cette suite et remet les fichiers (preuve ci-dessus, ligne « démo web »).
- `README.md` (tableau Tests) et `livrables/INSTALLATION.md` section 7 disent quelles suites réécrivent quoi.

## C3 : tests de la revue de sécurité

Corrigé. Relancés un par un depuis `research/titouan/T_banc_e2e` :

```
node security_review2/tests/r01_builtins_pollution.mjs   code 0 (5 scénarios, 0 appel arrivé au portefeuille)
node security_review2/tests/r02_written_check.mjs        code 0 (4 cas ok)
node security_review2/tests/r03_gatekeeper_flow.mjs      code 0 (5 lignes ok)
node security_review2/tests/r04_real_engine_value.mjs    code 1 ('transfer + 1 ETH' : niveau attention, funds_out true, aucun code)
node security_review2/tests/r05_engine_dos.mjs           code 0
```

Constat neuf : la QA de 10 h voyait r04 passer. À 10 h 40, il échoue. Le texte dit donc l'état mesuré, avec l'heure. Il garde la nuance : r04 accepte « unknown », donc un passage ne voudra pas dire que l'ETH joint est vu. Il précise que r01 et r03 tournent en Node, pas dans Chrome. r04 est transmis à Adem (`POUR_ADEM.md` section 2).

## C4 : nombre de vérifications de la démo web

Corrigé : « 135 vérifications le 11 oct. 2026 ». Ajout du dossier de départ (`research/titouan/T_banc_e2e`), sans lequel les commandes ne marchent pas.
Preuve : `[ok] démo web (webdemo) : 135 réussis sur 135`.

## C5 : révocation dans l'extension

Corrigé. La consigne disait « bouton du panneau à venir ». C'est faux depuis 10 h 24 : le commit b42792d a mis dans le panneau latéral une section « Droits accordés » avec un bouton « Révoquer ».
Preuve :

```
git log -1 --format="%h %ad" --date=format:%H:%M -- extension_standalone/extension/ui/sidepanel.js
b42792d 10:24
grep "Droits accordés\|button: 'Révoquer'" extension_standalone/extension/ui/sidepanel.js   -> présent (ligne 28)
grep "import { revocationFor } from './revoke.js'" extension_standalone/extension/gatekeeper.js   -> ligne 12
```

Textes écrits : branché dans l'extension et le build autonome, 13 tests du branchement en Node, jamais essayé dans un vrai Chrome. `sidepanel.test.mjs` ne teste pas le bouton (0 occurrence de « revoke ») : non affirmé. Le journal chaîné du build autonome était déjà juste dans QR_JURY (ligne 49) et CHIFFRES (A19). `README.md` (étape 6 et Limites) corrigé de la même façon ; la fiche d'incident n'est pas dans l'extension (aucune occurrence de « incident » dans le build), c'est écrit.

## C6 : protocole d'essai réel

Corrigé. Changements :
- `site_echange\addresses.local.json` : « absent (ignoré par git), créé par `config.js` », plus « périmé ». Même correction en panne P8.
- Ancien nom de code : lignes 3 et 525 ne disent plus « Hold up » à la place de l'ancien nom. Chemin ligne 525 réécrit en entier (il commençait par `R\`, illisible pour PowerShell).
- `blockchain\contracts\demo\` contient aussi `VulnerableRouter.sol` : ajouté.
- Le manifeste a des icônes : ligne corrigée.
- Carte « Hold up » (nom réel du manifeste), pas « Hold up (autonome) ». Même correction dans `INSTALLATION.md`.
- Panneau latéral : textes réels relus dans `ui/sidepanel.js` (« 0 demande vérifiée, 0 annulée. », section « Droits accordés », « Version 0.3.0 » sans « Aucune connexion réseau » pour le build avec relais).
- Réglages : « Durées de démo », la case « fenêtre séparée », « Mon contexte » et « Journal (local) » n'existent plus dans `options.html`. Remplacés par les vrais champs : section « Délais » (10 et 60 secondes, minimums 5 et 30), « Contrats que j'utilise » pour le routeur. Le jeton n'a plus à être saisi : Hold up lit son nom par le portefeuille (`declaredTokens` dans `gatekeeper.js` ; `DUSDC` contient `USDC`). Marqué « prévision tirée du code ». Sepolia (8.6), P13, P14 et la section 11 suivent.
- S1-B : « phrase à retaper » retiré (la revue S18 dit qu'elle n'existe plus), remplacé par l'attente de 10 s.

Preuves (chemins et commandes) :

```
test -e pour 23 chemins cités : tous présents, sauf chain\addresses.local.json et site_echange\addresses.local.json (absents, ignorés par git : .gitignore lignes 51 et 59)
node --check sur config.js (x2), drain.mjs, reset.mjs, safe_signataire.mjs, page_testnet\serve.mjs, page_essai\serve.mjs, relay.mjs, chain-local.js, deploy-local.js, deploy-fuji.js : tous ok
node scripts/demo.mjs --check : "Node >= 22.18 : oui", "blockchain/node_modules : absent (npm install sera lancé)", ports libres
node research/titouan/T_banc_e2e/demo_typologie/safe_signataire.mjs : code 0 (delegatecall -> danger, F09)
node docs/demo/serve_static.mjs research/demo_reelle/site_echange 8793 : / 200, /?mode=piege 200
node docs/demo/serve_static.mjs research/demo_reelle/site 8791 : /lure.html 200, /attaquant.html 200
node .../essai_reel/page_testnet/serve.mjs : http://127.0.0.1:8794/ 200
node .../essai_reel/page_essai/serve.mjs : http://127.0.0.1:8788/ 200
blockchain/package.json : chain:local, demo:deploy, demo:fuji existent ; chain-local.js affiche "mode=... chainId=... rpc=..." ; deploy-local.js affiche "Victim ...: 2480 DUSDC, 100 test AVAX" et prend le compte n°5 sans DEMO_VICTIM
```

Non vérifiable ici : tout ce qui demande MetaMask, Chrome, Hardhat installé, Sepolia ou Fuji.

## C7 : chemin du contrôle statique

Corrigé : `node research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs` en entier (section 5).
Preuve : `[ok] build autonome : contrôle statique : 24 réussis sur 24`.

## C8 : `redteam/V2_DEV_norm.jsonl`

Documenté. Les quatre lecteurs sont dans `engine\`, `pipeline\` et `run\`, dossiers d'Adem : pas modifiés.
- `README.md` section Tests : liste des fichiers ignorés lus par les tests, avec la commande.
- `livrables/INSTALLATION.md` : ligne de dépannage et section 7.
- `redteam/README.md` : section « Fichier généré ».
- Correctif des tests : `qa/c8_pour_adem.diff` (message clair avec la commande `node redteam/normalize_v2.mjs blind_adem/v2/V2_DEV.jsonl redteam/V2_DEV_norm.jsonl`).

Preuve :

```
git apply --check research/titouan/T_banc_e2e/qa/c8_pour_adem.diff   -> OK
node --check sur les 3 fichiers modifiés (copies)                    -> ok
ls -la redteam/V2_DEV_norm.jsonl                                      -> 21 254 209 octets
```

Non fait : le message n'a pas été déclenché en vrai (il faudrait retirer le fichier).

## C9 : serveur statique de la démo

Corrigé. Nouveau garde : `path.relative(racine, fichier)` refusé s'il vaut `..`, commence par `../` ou `..\`, ou est absolu. Refus avant normalisation de tout segment `..`, d'une lettre de lecteur et de l'octet nul. Le fichier réel (`realpath`) doit aussi être sous la racine réelle : un lien symbolique ou une jonction vers l'extérieur est refusé. URL mal encodée : 400.

Preuve, sur un arbre de test (`banc\`, frère `banc2\`, jonction `banc\lien` vers `dehors\`), port 18790 :

```
/                                  200 INDEX
/data.json                         200
/sub/  et  /sub                    200 SUBIDX
/../banc2/secret.txt               404 (normalisé par l'analyseur d'URL, reste dans banc)
/..%2fbanc2/secret.txt             403
/%2e%2e/banc2/secret.txt           404 (normalisé)
/%2e%2e%2fbanc2%2fsecret.txt       403
/..%5cbanc2%5csecret.txt           403
/..\banc2\secret.txt               404 (normalisé)
/%2e%2e%5c%2e%2e%5cdehors%5cx.txt  403
/C:/Windows/win.ini                403
/C%3A%5CWindows%5Cwin.ini          403
//etc/passwd                       404
/lien/x.txt                        403 (jonction vers l'extérieur)
/%00                               403
/%E0%A4%A                          400
```

Même essai sur l'ancienne version (`git show HEAD:docs/demo/serve_static.mjs`) : `/lien/x.txt` renvoyait 200 et le contenu du fichier hors racine. Les vrais sites de démo restent servis (C6 ci-dessus). `scripts/demo.mjs` utilise ce serveur pour Neve, Glacier et le labo : pas de changement d'interface.

## Commandes des documents d'installation relues

- `README.md` : `node scripts/verifier_installation.mjs` (lancé deux fois), `node scripts/demo.mjs --check` (lancé), commandes de test (lancées par le script), `node --test .../relay.test.mjs` (9 / 9), r01 à r05 (lancés). `npm run test:rpc` exige `ethers` : écrit dans le tableau.
- `livrables/INSTALLATION.md` : options `--check`, `--redeploy`, `--fork`, `--ancien`, `HOLDUP_PORT`, `logs/demo/chain.log`, `logs/demo/relais.log` présents dans `scripts/demo.mjs` ; `HOLDUP_EXTENSION_ID`, `refused bad-origin`, `classify source=... why=...` présents dans `relay.mjs` ; `extension_id` et `tree_sha256` présents dans `BUILD_INFO.json` ; `-NoNetwork` présent dans `package_standalone.ps1` ; boutons de `standalone_test_page/index.html` recopiés tels quels. Version de Node corrigée (contrôle fait avec 24.18.1).
- `essai_reel/PROTOCOLE_V2.md` : voir C6.

Non lancé (interdit ou impossible ici) : `npm install`, `npm run test:contracts`, `node scripts/demo.mjs` complet, `build_standalone.mjs` seul (il réécrit le build d'Adem ; il a tourné dans `run_tests.mjs`, puis le build a été remis), `package_standalone.ps1`.

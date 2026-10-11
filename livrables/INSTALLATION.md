# Installer et essayer Hold up

Hold up est une extension Chrome ou Edge qui contient son propre moteur d'analyse. La phrase que tu écris est classée par le modèle Clef, à travers un petit relais local (décision D-015). Sans relais ou sans clé, l'extension marche quand même : elle lit la phrase par mots-clés et l'écran le dit. Aucun vrai fonds, aucun compte à créer.

**À lire avant.** L'extension n'a jamais été essayée avec un vrai portefeuille (MetaMask, Core, Rabby) ni par une vraie personne : seuls des tests et des essais scriptés existent. Une revue de sécurité interne a trouvé des contournements possibles, dont un critique (`research/titouan/T_banc_e2e/security_review2/REVUE.md`). Ne l'utilise qu'avec un portefeuille jetable, sur une chaîne locale ou de test.

## 1. Ce qu'il te faut

| Élément | Version | Remarque |
|---|---|---|
| Node.js | 22.18 ou plus | Pour la démo, le relais et les tests. Sous Windows 11 : démo complète essayée avec Node 25.6 ; contrôle et tests rapides avec Node 24.18.1. Reconstruire la démo web demande 23.2 ou plus. |
| Chrome ou Edge | 114 ou plus | C'est la version demandée par le manifeste de l'extension. |
| Internet | seulement pour `npm install`, pour le modèle, et pour `--fork` | Le modèle est appelé par le relais. Sans Internet ou sans clé, la phrase est lue par mots-clés. |
| Clés du modèle | `CF_ACCOUNT_ID` et `CF_API_TOKEN` | Dans un fichier `.env` à la racine du dépôt (ignoré par git, modèle : `.env.example`). Jamais dans l'extension. |

## 2. En deux commandes

Depuis la racine du dépôt :

```
node scripts/verifier_installation.mjs
node scripts/demo.mjs
```

Puis charge l'extension (section 3). La première commande contrôle ton installation : versions, dépendances, fichiers nécessaires, ports, et tests rapides avec leurs chiffres réels. Elle recrée seule les fichiers de données générés qui manquent sur un clone neuf. Elle ne lit pas ton `.env`. Elle remet à l'état de git les fichiers suivis que les tests réécrivent (section 7).

La seconde lance toute la démo locale, dans cet ordre, et le dit en français :

1. la chaîne locale, port 8545 ;
2. les contrats de démo (synthétiques) ;
3. la copie de leurs adresses vers le site Neve (`research/demo_reelle/site_echange/config.js`) ;
4. le site Neve, port 8793 ;
5. le relais du classifieur, port 8789, lancé avec `--env-file=.env` si le fichier existe ;
6. la console d'attaque simulée (8792) et le site « Glacier Rewards » (8791).

Ce qui tourne déjà sur un de ces ports n'est ni relancé ni arrêté. Les contrats déjà déployés sur une chaîne déjà lancée sont réutilisés (`--redeploy` pour en refaire de neufs). Ctrl+C arrête seulement ce que le script a lancé. À la fin, il affiche les adresses à ouvrir et le dossier d'extension à charger. `node scripts/demo.mjs --check` liste l'état sans rien lancer. Premier lancement : le script exécute `npm install` dans `blockchain/` (Internet requis) et télécharge le compilateur Solidity.

Si le fichier `.env` manque, ou n'a pas les clés, le script écrit : « sans clé, l'intention sera classée sans modèle ». Pour utiliser le modèle : copie `.env.example` en `.env`, remplis les deux variables, relance.

Relancer le relais seul, à la main : `node --env-file=.env research/demo_reelle/classifieur/relay.mjs`. Le relais écoute sur `127.0.0.1:8789` seulement, refuse les pages web, et n'écrit dans son journal ni la phrase ni les clés.

Pour n'accepter que l'extension livrée, épingle son identifiant avant de lancer le relais. Il est fixe, dérivé de la clé publique du manifeste : lis-le dans `BUILD_INFO.json` (champ `extension_id`) ou sur la carte de l'extension dans `chrome://extensions`.
- PowerShell : `$env:HOLDUP_EXTENSION_ID='<identifiant>'; node --env-file=.env research/demo_reelle/classifieur/relay.mjs`
- bash : `HOLDUP_EXTENSION_ID=<identifiant> node --env-file=.env research/demo_reelle/classifieur/relay.mjs`

Sans cette variable, toute extension installée sur la machine peut appeler le relais.

## 3. Charger l'extension

Le dossier : `research/titouan/T_banc_e2e/extension_standalone/extension`. Le script de démo l'affiche en entier à la fin.

1. Ouvre `chrome://extensions` (Edge : `edge://extensions`).
2. Active **Mode développeur** (en haut à droite).
3. Clique **Charger l'extension non empaquetée** et choisis ce dossier.
4. La carte « Hold up », version 0.3.0, apparaît. Aucun bouton rouge « Erreurs » ne doit s'afficher. S'il y en a un, note le message : l'installation s'arrête là.
5. Pour une page locale `file://`, ouvre « Détails » et active **Autoriser l'accès aux URL de fichier**. Une page servie en `http://` n'en a pas besoin.
6. Un clic sur l'icône de Hold up ouvre le panneau latéral, qui montre le journal des décisions et les droits accordés sur l'onglet, avec le bouton « Retirer l'autorisation » (libellé du code avant l'habillage : « Révoquer » ; branché le 11 oct., jamais essayé dans un vrai Chrome). Les questions et les alertes s'affichent dans une fenêtre séparée devant la page.
7. Recharge l'onglet de la page à essayer après chaque chargement de l'extension. Une seule version de Hold up à la fois : désactive les autres (dossier `extension/` avec serveur, variante sans réseau).

**Autre source : le paquet zip.** `research/titouan/T_banc_e2e/dist/hold-up-standalone.zip`. Dézippe-le et charge le dossier obtenu, comme ci-dessus. Le paquet n'est pas toujours aussi récent que le dossier : le dossier fait foi. Pour contrôler un paquet, compare l'empreinte de l'arbre de fichiers donnée par `BUILD_INFO.json` (champ `tree_sha256`) avec celle du dossier dézippé, ou reconstruis (ci-dessous). Aucune empreinte n'est recopiée dans ce fichier.

**Reconstruire** (facultatif) : `node research/titouan/T_banc_e2e/extension_standalone/build_standalone.mjs`, puis `node research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs` (aucune ligne `ECHEC`). Zip : `powershell -ExecutionPolicy Bypass -File research/titouan/T_banc_e2e/extension_standalone/package_standalone.ps1`. La reconstruction demande une version de Node récente : le script dit laquelle s'il refuse.

**Vérifier que le modèle est bien utilisé.** Sous la réponse, la fenêtre affiche « intention classée par Clef » quand le modèle a classé la phrase, et « intention classée sans modèle » dans tous les autres cas (relais arrêté ou lent, pas de clé, réponse trop peu sûre). Dans la fenêtre du relais, une ligne `classify source=clef …` apparaît à chaque phrase.

**Variante sans relais ni modèle (option).** `node research/titouan/T_banc_e2e/extension_standalone/build_standalone.mjs --no-network` écrit le dossier `extension_standalone/extension_sans_reseau` (paquet : `package_standalone.ps1 -NoNetwork`). Mêmes fichiers, sauf le client du relais (module vide) et le manifeste (aucune permission d'hôte, `connect-src 'none'`). La phrase y est toujours lue par mots-clés, dans le navigateur. Contrôle : `node research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs --no-network`.

## 4. Jouer les scènes

Avec la démo lancée et l'extension chargée, ouvre dans Chrome :

| Adresse | Scène |
|---|---|
| `http://localhost:8793/?mode=honnete` | échange honnête : « Ça correspond » |
| `http://localhost:8793/?mode=piege` | droit illimité : « Ça ne correspond pas » |
| `http://localhost:8793/?mode=piege&via=permit` | signature qui donne accès à tout et ne se limite pas |
| `http://localhost:8791/lure.html` | « me connecter » qui signe un droit |

Pour que la page parle à un portefeuille, il faut un portefeuille dans le navigateur. Utilise un portefeuille **jetable**, dans un profil Chrome de test, jamais ta vraie phrase secrète. Ajoute le réseau : RPC `http://127.0.0.1:8545`, symbole `AVAX`, et la chaîne affichée par le script (31337 en mode normal, 43114 avec `--fork`). Importe un seul compte de test Hardhat (clés publiques). Le script affiche le compte approvisionné en jetons de démo. Remise à zéro entre deux passages : `node research/demo_reelle/chain/reset.mjs --network local`.

**Page de test sans portefeuille.** Ouvre `research/titouan/T_banc_e2e/standalone_test_page/index.html` : un portefeuille factice, rien n'est signé. Les trois boutons (« 1. Autoriser un droit illimité (piège) », « 2. Signer un « permit » (piège) », « 3. Envoyer 0,01 ETH (envoi simple) ») jouent chacun une demande. « Annuler » : le cadre « Ce que le portefeuille factice a reçu » reste vide, la demande est retenue avant le portefeuille.

Un essai complet en contrôles, à faire avec un vrai Chrome : `research/titouan/T_banc_e2e/extension_standalone/ESSAI_HUMAIN.md`. Aucun résultat n'y est consigné à ce jour.

## 5. Ce qui sort de la machine

**Deux choses sortent de l'extension.** La phrase que tu écris, vers le relais local. Et, sur Avalanche et sur Fuji seulement, la demande du site (adresse du compte, adresse appelée, montant, données de l'appel), vers le RPC public d'Avalanche, en lecture seule (`eth_getCode`, `eth_getBalance`, `eth_call`) : c'est ce qui permet de dire si l'adresse appelée est un contrat et si le compte détient la somme. Le manifeste a trois permissions d'hôte (`http://127.0.0.1:8789/*`, `https://api.avax.network/ext/bc/C/rpc`, `https://api.avax-test.network/ext/bc/C/rpc`), la politique de sécurité des pages d'extension limite `connect-src` à ces trois origines, le dossier contient deux `fetch` (`classifier_client.js`, corps `{ text }`, sans cookie ni en-tête d'autorisation ; `background.js`, qui passe le `fetch` du service worker à `chain_facts.js`), et le contrôle statique (`node research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs`) vérifie ces points. La phrase écrite et le verdict ne partent jamais vers le RPC ; ni l'adresse du compte ni la demande ne partent vers le relais. La variante sans réseau ne lit pas la chaîne.

**La phrase part ensuite vers un modèle hébergé, si le relais a une clé.** Chemin : navigateur, relais local (`127.0.0.1:8789`), puis Clef sur Cloudflare Workers AI. C'est le fonctionnement normal du build livré. La clé du modèle reste dans le relais, jamais dans l'extension ni dans un fichier suivi. Minimisation et durée de conservation chez le fournisseur ne sont pas rédigées. Relais arrêté, sans clé, ou variante sans réseau : la phrase reste dans le navigateur et est lue par mots-clés. Les montants, jetons et adresses sont lus par du code, pas par le modèle. Une réponse du modèle ne peut que rendre le verdict plus strict ou plus précis, et sous 0,6 de confiance elle est écartée.

Autres points :
- **Stockage local.** Réglages, carnet d'adresses, « Mes adresses », « Contrats que j'utilise » et journal (500 dernières lignes, chaînées par hachage, sans la phrase écrite ni adresse) vivent dans `chrome.storage.local`. Sans ancrage externe, une réécriture complète du journal ne se voit pas.
- **Le nœud du portefeuille.** Pour réécrire un droit trop large (nom et décimales du jeton), l'extension interroge le fournisseur du portefeuille, donc le nœud du portefeuille, comme le ferait la page.
- **La chaîne locale.** Par défaut elle est vide et ne contacte rien. Avec `--fork`, elle lit le RPC public d'Avalanche, en lecture seule.
- **Mode incognito.** Sans autorisation explicite, l'extension n'y tourne pas : les signatures y passent sans Hold up.

**Fuji.** Rien n'est déployé : `blockchain/DEPLOYMENTS.md` ne contient que son en-tête. Le déploiement est préparé et répété, mais pas exécuté (D-016). La démo se joue sur la chaîne locale et ne se présente jamais comme jouée sur Fuji.

## 6. Dépannage

| Symptôme | Cause probable | Que faire |
|---|---|---|
| « intention classée sans modèle » alors que le modèle est attendu | relais arrêté, clés absentes de `.env`, identifiant épinglé différent de celui de l'extension, ou modèle trop lent (1,5 s) | Regarde la fenêtre du relais (ou `logs/demo/relais.log`) : aucune ligne = l'appel n'arrive pas ; `refused bad-origin` = mauvais identifiant ; `why=timeout`, `why=error` ou `why=no-key` = côté modèle |
| Aucune fenêtre Hold up | extension désactivée, page ouverte avant le chargement, ou page `file://` sans l'autorisation | Recharge l'onglet ; active « Autoriser l'accès aux URL de fichier » ; mieux, sers la page en http |
| Bouton « Erreurs » sur la carte | build incomplet | Reconstruis (section 3), relance le contrôle statique |
| La fenêtre ne s'ouvre pas devant la page | Chrome a refusé la fenêtre séparée | L'écran s'affiche dans la page (repli journalisé) : à signaler |
| `Node … est trop ancien` | Node avant 22.18 | Mets Node à jour |
| `[ECHEC] chaîne locale : pas prêt` | port 8545 pris par autre chose qu'un nœud, ou démarrage lent | `logs/demo/chain.log` ; libère le port ou `HOLDUP_PORT=8548 node scripts/demo.mjs` |
| Le site Neve vise de mauvaises adresses | adresses périmées après un nouveau déploiement | Relance `node scripts/demo.mjs` : il recopie les adresses vers le site à chaque lancement |
| `npm run demo:deploy` (dans `blockchain/`) échoue | aucune chaîne locale sur 8545 | Lance d'abord la chaîne : `npm run chain:local` dans `blockchain/` |
| Un test du moteur échoue sur un clone neuf | l'échantillon de trafic réel `research/titouan/bench/data/cchain_sample.jsonl` est ignoré par git | Attendu, sans effet sur la démo ; `bench/sample_cchain.mjs` le recrée avec Internet |
| `monotonie.test.mjs`, `evaluate_plus.test.mjs` ou `monotone_pipeline.test.mjs` plante : fichier `redteam/V2_DEV_norm.jsonl` introuvable | fichier généré de 21 Mo, ignoré par git, absent d'un clone neuf | Depuis la racine : `node scripts/verifier_installation.mjs --donnees`. Ou depuis `research/titouan/T_banc_e2e` : `node redteam/normalize_v2.mjs blind_adem/v2/V2_DEV.jsonl redteam/V2_DEV_norm.jsonl` |
| `[saute] RPC de garde` ou `Cannot find module 'ethers'` | `blockchain/node_modules` absent | `cd blockchain && npm install` (Internet), puis `npm run test:rpc` |

Les lignes `[info]` de `node scripts/verifier_installation.mjs` ne bloquent rien. Seules les lignes `[ECHEC]` comptent.

## 7. Tests

Une commande : `node scripts/verifier_installation.mjs`. Elle lance les suites rapides, affiche pour chacune la commande exacte et le nombre réel de tests réussis, et se termine par un code d'erreur si une suite échoue. `--complet` ajoute les contrats Hardhat (environ 2 minutes). Aucun nombre n'est écrit dans ce fichier : il changerait à chaque version.

À la main, depuis la racine du dépôt : `npm run test:engine`, `npm run test:server`, `npm run test:extension`, `npm run test:rpc`, `node --test research/demo_reelle/classifieur/relay.test.mjs`, `node research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs` (et `--no-network` pour la variante), `node --no-warnings research/titouan/T_banc_e2e/extension_standalone/tests/run_tests.mjs`, `node research/titouan/T_banc_e2e/webdemo/tests/run_webdemo_tests.mjs`. `npm run test:rpc` exige `ethers`, donc `npm install` dans `blockchain/` ; sans lui, le script de contrôle saute cette suite.

Fichiers générés que les tests lisent, ignorés par git, absents d'un clone neuf : `research/titouan/T_banc_e2e/redteam/V2_DEV_norm.jsonl` (21 Mo, lu par `engine/test/monotonie.test.mjs`, `pipeline/test/evaluate_plus.test.mjs`, `pipeline/test/monotone_pipeline.test.mjs`, `run/mesure_monotonie.mjs`) et `attacks_public/PUBLIC.jsonl`. `node scripts/verifier_installation.mjs` (ou `--donnees` seul, ou `npm run test:engine`) les recrée. À la main, depuis `research/titouan/T_banc_e2e` : `node redteam/normalize_v2.mjs blind_adem/v2/V2_DEV.jsonl redteam/V2_DEV_norm.jsonl`.

Ces tests valident le code, pas la détection ni la résistance à une page hostile. Plusieurs suites réécrivent des fichiers suivis par git : `engine/out/*.json`, `server/test/results.json`, tout le build autonome (`run_tests.mjs` reconstruit `extension_standalone/extension/` et `extension_sans_reseau/`), `extension_standalone/out/`, et la démo web (`webdemo/BUILD_INFO.json`, `webdemo/engine/`, `webdemo/js/`, `webdemo/out/`). `node scripts/verifier_installation.mjs` note l'état git avant chaque suite, puis remet par `git checkout --` les fichiers qui étaient propres avant. Un fichier que tu avais déjà modifié n'est pas remis : le script l'annonce en `[attention]`. Les commandes à la main ne remettent rien : après elles, `git status` puis `git checkout -- <fichier>` si besoin.

## 8. Désinstaller

`chrome://extensions`, bouton **Supprimer** sur la carte « Hold up ». Pour la démo : Ctrl+C dans le terminal ; supprimer le profil Chrome de test et le dossier cloné suffit, rien n'est installé hors du dossier (les paquets sont dans `blockchain/node_modules`).

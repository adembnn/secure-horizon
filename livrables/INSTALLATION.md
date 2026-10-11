# Installer et essayer Hold up (produit figé : extension autonome)

Mis à jour le 11 oct. 2026 pour le produit figé. Hold up est une extension Chrome ou Edge qui contient son propre moteur d'analyse. La phrase que tu écris est classée par le modèle Clef, à travers un petit relais local à lancer avant (section 2, étape 1) ; sans le relais, l'extension marche quand même, lit la phrase par mots-clés et l'écran le dit. Aucun vrai fonds, aucun compte à créer.

**À lire avant.** L'extension n'a jamais été essayée avec un vrai portefeuille (MetaMask, Core, Rabby) ni dans un vrai Chrome par une vraie personne : seuls des tests Node existent. Une revue de sécurité interne a trouvé des contournements possibles, dont un critique (une page peut remplacer des fonctions natives du navigateur et laisser passer une demande sans fenêtre Hold up, `research/titouan/T_banc_e2e/security_review2/REVUE.md`). Corrections en cours, non vérifiées. Ne l'utilise qu'avec un portefeuille jetable, sur une chaîne locale ou de test.

## 1. Ce qu'il te faut

| Élément | Version | Remarque |
|---|---|---|
| Chrome ou Edge | 111 ou plus | Le seul prérequis pour installer l'extension. |
| Node.js | 22.18 ou plus | Pour le relais de classification (section 2, étape 1), la démo locale (section 4), la reconstruction (Node 23.2 ou plus) et les tests. Seul Node 25.6.0 sous Windows 11 a été essayé pour la démo. |
| Internet | pour le modèle | Le relais appelle le modèle Clef (Cloudflare Workers AI). Sans Internet ou sans clé, le relais répond par mots-clés et l'écran affiche « intention classée sans modèle ». Aussi pour `npm install` de la chaîne locale (section 4). |
| Clés du modèle | `CF_ACCOUNT_ID` et `CF_API_TOKEN` | Dans le fichier `.env` à la racine du dépôt (ignoré par git), jamais dans l'extension. |

## 2. Lancer le relais, puis installer l'extension

### Étape 1 : lancer le relais de classification

Depuis la racine du dépôt, dans un terminal qui reste ouvert :

```
node --env-file=.env research/demo_reelle/classifieur/relay.mjs
```

Il doit afficher `Relais de classification Hold up sur http://127.0.0.1:8789 (fournisseur : clef, …)`. S'il affiche `mots-clés, aucune clé configurée`, les deux variables du modèle manquent dans `.env`. Le relais n'écoute que sur la machine (boucle locale), refuse les pages web, et n'écrit dans son journal ni la phrase ni les clés : une ligne par appel, par exemple `classify source=clef kind=buy_or_swap ms=672`.

Pour n'accepter que l'extension livrée, épingle son identifiant. Il est fixe : `amiobigoknpbnkhfhidhdobjnmdciioe`, dérivé de la clé publique du manifeste (aucune clé privée n'existe dans le dépôt). Il s'affiche aussi sur la carte de l'extension dans `chrome://extensions`, mode développeur activé, ligne « ID ».

- PowerShell : `$env:HOLDUP_EXTENSION_ID='amiobigoknpbnkhfhidhdobjnmdciioe'; node --env-file=.env research/demo_reelle/classifieur/relay.mjs`
- bash : `HOLDUP_EXTENSION_ID=amiobigoknpbnkhfhidhdobjnmdciioe node --env-file=.env research/demo_reelle/classifieur/relay.mjs`

Le relais confirme alors `seule l’extension amiobigoknpbnkhfhidhdobjnmdciioe peut appeler`. Sans cette variable, toute extension installée dans le navigateur peut l'appeler. Si tu charges une autre version (dossier `extension/`, sans clé de manifeste, ou le build `--no-network`), son identifiant dépend du dossier : lis-le sur sa carte et passe celui-là.

### Étape 2 : charger l'extension

Deux sources, le même contenu.

- **Le paquet** : `research/titouan/T_banc_e2e/dist/hold-up-standalone.zip` (49 fichiers ; le SHA-256 change à chaque paquet, le calculer avec `Get-FileHash`). Dézippe-le : tu obtiens un dossier `hold-up-standalone`. Le fichier `hold-up-standalone-3fab41e8.zip` du même dossier est un paquet plus ancien : ne pas l'utiliser.
- **Le dossier du dépôt** : `research/titouan/T_banc_e2e/extension_standalone/extension`.

Étapes :
1. Ouvre `chrome://extensions` (Edge : `edge://extensions`).
2. Active **Mode développeur** (en haut à droite).
3. Clique **Charger l'extension non empaquetée** et choisis le dossier `hold-up-standalone` (ou le dossier du dépôt).
4. La carte « Hold up (autonome) » apparaît, avec le logo. Aucun bouton rouge « Erreurs » ne doit s'afficher. S'il y en a un, ouvre-le et note le message : l'installation s'arrête là.
5. Si tu travailles sur une page locale `file://`, ouvre « Détails » sur la carte et active **Autoriser l'accès aux URL de fichier**. Une page servie en `http://` n'en a pas besoin.
6. Panneau latéral : un clic sur l'icône de Hold up (barre d'outils, ou menu des extensions) ouvre le panneau latéral, qui montre le journal des décisions. Les questions et les alertes de signature, elles, s'affichent dans une fenêtre séparée devant la page.
7. Recharge l'onglet de la page à essayer après chaque rechargement de l'extension. Une seule version de Hold up à la fois dans Chrome : désactive l'ancienne version avec serveur (dossier `extension/`) si elle est chargée.

Reconstruire depuis les sources (facultatif) : `node research/titouan/T_banc_e2e/extension_standalone/build_standalone.mjs`, puis `node research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs` (doit finir sans ligne `ECHEC`). Créer le zip : `powershell -ExecutionPolicy Bypass -File research/titouan/T_banc_e2e/extension_standalone/package_standalone.ps1`.

**Vérifier que le modèle est bien utilisé.** Sous la réponse, la fenêtre affiche « intention classée par Clef » quand la phrase a été classée par le modèle, et « intention classée sans modèle » dans tous les autres cas (relais arrêté ou lent, pas de clé, réponse incohérente ou trop peu sûre). Dans le terminal du relais, une ligne `classify source=clef …` apparaît à chaque phrase.

**Repli sans aucun réseau.** `node research/titouan/T_banc_e2e/extension_standalone/build_standalone.mjs --no-network` écrit le dossier `extension_standalone/extension_sans_reseau` (paquet : `package_standalone.ps1 -NoNetwork`, `dist/hold-up-sans-reseau.zip`, carte « Hold up (sans reseau) »). Mêmes fichiers, sauf le client du relais (module vide) et le manifeste (aucune permission d'hôte, `connect-src 'none'`). La phrase y est toujours lue par mots-clés. Contrôle : `node research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs --no-network`.

## 3. Vérifier avec la page de test (faux portefeuille)

1. Ouvre `research/titouan/T_banc_e2e/standalone_test_page/index.html` dans Chrome (glisser dans la fenêtre). La page contient un portefeuille factice : aucun argent, aucune clé, rien n'est signé.
2. Clique sur chaque bouton. La fenêtre Hold up (fenêtre séparée, devant la page) pose d'abord « Que veux-tu faire ? » pour une demande qui accorde un droit ou déplace des fonds ; réponds par une phrase, par exemple « échanger 50 USDC ». Elle affiche ensuite un verdict.

| Bouton | Ce que tu dois voir |
|---|---|
| Droit illimité (piège) | Un écran rouge « danger » ; avec la phrase « échanger 50 USDC », « Ça ne correspond pas » |
| Permit (piège) | Un écran « danger » : une signature qui laisse le site prendre des jetons longtemps ; elle ne peut pas être limitée, l'écran le dit |
| Envoi simple | Un écran « à vérifier » (jamais vert) |

3. Clique **Annuler** : le cadre « Ce que le portefeuille factice a reçu » reste vide, la demande est retenue avant le portefeuille. Refais un envoi simple et continue : le portefeuille factice affiche la demande reçue.

Un essai complet en 10 contrôles, à faire avec un vrai Chrome : `research/titouan/T_banc_e2e/extension_standalone/ESSAI_HUMAIN.md`. Aucun résultat n'est consigné à ce jour.

Réglage utile pour la répétition : options de l'extension, bouton « Durées de démo (10 s et 60 s) » puis « Enregistrer », pour ne pas attendre 30 s et 10 min à chaque essai. Remettre « Durées du produit » ensuite.

## 4. La démo locale (facultatif)

Elle joue les scènes du pitch sur une chaîne locale, avec des comptes de test publics.

```bash
git clone <url-du-depot> hold-up
cd hold-up
node scripts/demo.mjs
```

Le script lance `npm install` dans `blockchain/` s'il manque (Internet, environ 640 paquets), démarre le nœud Hardhat local (port 8545, chaîne 31337), déploie les contrats de démo et sert les sites. Ce que le produit figé utilise : le nœud local, le site d'échange Neve (port 8793, modes `?mode=honnete`, `?mode=piege`, `?mode=piege&via=permit`) et le site « Glacier Rewards » (port 8791). Le script démarre aussi des services de l'ancienne version (serveur de vérification 8787, RPC de garde 8555) : le build autonome ne s'en sert pas, ignore-les. Ctrl+C arrête ce qu'il a lancé. `node scripts/demo.mjs --check` liste l'état sans rien lancer.

Pointer un portefeuille sur la chaîne locale : portefeuille **jetable**, profil Chrome de test, jamais ta vraie phrase secrète. Ajoute le réseau (RPC `http://127.0.0.1:8545`, chaîne `31337`, symbole `AVAX`) et importe un seul compte de test Hardhat (clés publiques, affichées au démarrage du nœud). Remise à zéro entre deux passages : `node research/demo_reelle/chain/reset.mjs --network local`.

Fuji : rien n'est déployé (`blockchain/DEPLOYMENTS.md` ne contient que son en-tête). Chaîne locale pour la démo, Fuji à décider (D-013) : la démo ne se présente jamais comme jouée sur Fuji.

## 5. Ce qui sort de la machine

**Une seule chose sort de l'extension : la phrase que tu écris, vers le relais local.** Le manifeste du build livré a une seule permission d'hôte (`http://127.0.0.1:8789/*`), la politique de sécurité des pages d'extension fixe `connect-src http://127.0.0.1:8789` et rien d'autre, le dossier contient un seul `fetch` (`classifier_client.js`, corps `{ text }`, sans cookie ni en-tête d'autorisation), et un contrôle statique (`extension_standalone/tests/static_check.mjs`) vérifie ces points. Ni l'adresse du compte, ni la demande, ni le verdict ne quittent le navigateur. Aucune clé n'est dans l'extension. Il n'y a ni télémétrie ni compte. Le build de repli `--no-network` (section 2) n'a aucun accès réseau du tout.

Ce qui reste, et ce qu'il faut savoir :
- **Stockage local.** Réglages, « Mon contexte » (carnet d'adresses, jetons connus) et journal (500 dernières lignes, sans la phrase écrite) vivent dans `chrome.storage.local`. Ce stockage est lisible par les scripts de contenu de l'extension (revue S16, correctif proposé, non appliqué). Le journal du build autonome n'est pas chaîné par hachage ; celui de la version serveur l'est.
- **Le nœud du portefeuille.** Pour réécrire un droit trop large (nom et décimales du jeton), l'extension interroge le fournisseur du portefeuille, donc le nœud du portefeuille, comme le ferait la page. Ce n'est pas un accès réseau de l'extension elle-même, mais ce nœud voit la requête de lecture.
- **Mode incognito.** Sans autorisation explicite, l'extension n'y tourne pas : les signatures y passent sans Hold up.

**La phrase part vers un modèle hébergé quand le relais tourne avec ses clés.** C'est le fonctionnement normal du build livré : la phrase de la personne va du navigateur au relais local (`127.0.0.1:8789`), puis au modèle hébergé (Clef sur Cloudflare Workers AI). Relais arrêté, ou build `--no-network` : la phrase reste dans le navigateur et est lue par mots-clés. La clé du modèle reste côté relais, dans l'environnement, jamais dans l'extension ni dans un fichier suivi. Minimisation et durée de conservation chez le fournisseur ne sont pas rédigées. Les montants, jetons et adresses sont lus par du code, pas par le modèle ; une réponse du modèle ne peut que rendre le verdict plus strict ou plus précis, et sous 0,6 de confiance elle est écartée au profit des mots-clés. Tant que le relais n'est pas épinglé sur l'identifiant de l'extension (`HOLDUP_EXTENSION_ID`, section 2), toute extension locale peut l'appeler (revue S17).

## 6. Dépannage

| Symptôme | Cause probable | Que faire |
|---|---|---|
| « intention classée sans modèle » alors que le modèle est attendu | relais arrêté, clés absentes de `.env`, identifiant épinglé différent de celui de l'extension chargée, ou modèle trop lent (1,5 s) | Regarder le terminal du relais : aucune ligne = l'appel n'arrive pas (relais arrêté) ; `refused bad-origin` = mauvais identifiant ; `why=timeout`, `why=error` ou `why=no-key` = côté modèle |
| Aucune fenêtre Hold up | extension désactivée, page ouverte avant le chargement, ou page `file://` sans l'autorisation | Recharger l'onglet ; activer « Autoriser l'accès aux URL de fichier » ; mieux, servir la page en http |
| Bouton « Erreurs » sur la carte | build incomplet | Reconstruire (section 2), relancer le contrôle statique |
| La fenêtre ne s'ouvre pas devant la page | Chrome a refusé la fenêtre séparée | L'écran s'affiche dans la page (repli journalisé) : à signaler |
| `Node … est trop ancien` | Node avant 22.18 (démo) ou 23.2 (reconstruction) | Mettre Node à jour |
| `[ECHEC] chaîne locale : pas prêt` | port 8545 pris | `logs/demo/chain.log` ; libérer le port ou `HOLDUP_PORT=8548 node scripts/demo.mjs` |
| 2 tests du moteur échouent sur un clone neuf | fichiers `bench/data/*.json` ignorés par git | Attendu, sans effet sur la démo |

## 7. Tests (pour les développeurs)

Depuis `research/titouan/T_banc_e2e`, par fichiers : `node --test extension/tests/unit/*.test.mjs` (le dossier seul échoue sur cette machine), `node --no-warnings extension_standalone/tests/run_tests.mjs`, `node extension_standalone/tests/static_check.mjs` (et `--no-network` pour le build de repli), `node --test ../../demo_reelle/classifieur/relay.test.mjs` (relais, modèle simulé). Aucun de ces tests n'appelle le réseau. Dernier relevé noté (`extension/RAPPORT_CORRECTIFS.md`) : unitaires 83 sur 83, suite autonome 39 sur 39, contrôle statique sans échec. Un test (f) de `inject.test.mjs` a échoué une fois sous charge. Ces tests valident le code, pas la détection ni la résistance à une page hostile : quatre des cinq tests de la revue de sécurité (`security_review2/tests/`, r01 à r04) échouaient à la rédaction de ce fichier, tant que les failles ne sont pas corrigées. Relancer avant de citer un nombre.

## 8. Désinstaller

`chrome://extensions`, bouton **Supprimer** sur la carte « Hold up (autonome) ». Pour la démo : Ctrl+C dans le terminal ; supprimer le profil Chrome de test et le dossier cloné suffit, rien n'est installé hors du dossier (les paquets sont dans `blockchain/node_modules`).

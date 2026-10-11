> **À RELIRE (11 oct. 2026).** Écrit avant le produit figé : les étapes RPC de garde (section 4) ne servent plus à la démo. Pour la démo : site Neve (port 8793), extension autonome reconstruite, voir `livrables/PITCH_5MIN.md` section « Avant d'entrer ».

# Installer et lancer Hold up (du clone à la démo)

Durée : environ 15 minutes, dont 5 de téléchargement la première fois. Tout reste sur ta machine (127.0.0.1). Aucun vrai fonds, aucune vraie clé, aucun compte à créer.

## 0. Ce qu'il te faut

| Élément | Version | Remarque |
|---|---|---|
| Node.js | 22.18 ou plus | Le serveur charge un fichier TypeScript (`engine/vendor/compare.ts`) : il faut le retrait natif des types, actif par défaut à partir de Node 22.18 et 23.6. Seul **Node 25.6.0 sous Windows 11** a été essayé. Pour les autres versions et systèmes, c'est une exigence lue dans la documentation de Node, pas un test. |
| npm | celui livré avec Node | Sert une seule fois, pour `blockchain/`. |
| Git | n'importe laquelle | |
| Chrome ou Edge | récent (l'extension demande Chrome 111 ou plus) | Seulement pour la partie extension. |
| Internet | première fois seulement | `npm install` (environ 640 paquets), compilateur Solidity. Après, la démo tourne hors ligne en mode par défaut. |

Vérifier Node : `node -v`.

## 1. Cloner et lancer

```bash
git clone <url-du-depot> hold-up
cd hold-up
node scripts/demo.mjs
```

Le script fait tout seul : `npm install` dans `blockchain/` s'il manque, nœud local, compilation et déploiement des contrats de démo, puis les services. Il écrit ses logs dans `logs/demo/` (ignoré par git). Ctrl+C arrête tout ce qu'il a lancé.

Sortie attendue (extrait ; les services absents du dépôt sont signalés « saute », jamais simulés) :

```
  [ok]    chaîne : nœud local Hardhat sur http://127.0.0.1:8545 (mode plain, chainId 31337)
  [ok]    contrats de démo déployés (...)
  [ok]    console d'attaque (drain) : http://127.0.0.1:8792/state
  [ok]    site leurre « Glacier Rewards » : http://localhost:8791/lure.html
  [ok]    serveur de vérification (/check) : http://127.0.0.1:8787/health
  [ok]    RPC de garde (porte n°2) : http://127.0.0.1:8555/
```

Un port déjà pris n'arrête pas le script : il le dit et ne relance pas ce service. Pour voir l'état avant de lancer : `node scripts/demo.mjs --check`.

Options : `--fork` (copie locale d'Avalanche C-Chain, chainId 43114, lit le RPC public en lecture seule, demande Internet), `--lookalike` (génère aussi le faux contact, 5 à 30 s), `--victim 0x…` (approvisionne ton compte de test à la place du compte Hardhat n°5), `--no-install`.

Si `npm install` échoue (réseau coupé, proxy) : lance-le toi-même dans `blockchain/`, puis relance le script. Si la compilation échoue sur le téléchargement du compilateur, c'est le même problème réseau.

## 2. Vérifier sans navigateur ni portefeuille

Pendant que le script tourne, dans un autre terminal :

```bash
curl http://127.0.0.1:8787/health        # {"status":"up",...}
curl http://127.0.0.1:8555/health        # RPC de garde : chain_id 31337
curl http://127.0.0.1:8792/state         # soldes de la victime et de l'attaquant simulé
node research/demo_reelle/rpc_garde/demo_send.mjs approve   # un droit de dépense sans limite vers une adresse inconnue passe par la porte de garde
```

Ouvre ensuite `http://127.0.0.1:8555/` : la demande retenue y apparaît avec le verdict « Tu crois / En vrai » et le délai avant de pouvoir continuer. `demo_send.mjs` signe avec le compte de test public de Hardhat et refuse de tourner si le nœud derrière n'est pas un nœud Hardhat local.

## 3. Charger l'extension dans Chrome

Deux variantes, même moteur. Prends la première.

**Variante autonome (recommandée) : le moteur est dans l'extension, rien à lancer à côté.**
1. Ouvre `chrome://extensions` (Edge : `edge://extensions`).
2. Active « Mode développeur » (en haut à droite).
3. « Charger l'extension non empaquetée », choisis le dossier `research/titouan/T_banc_e2e/extension_standalone/extension`.
4. La carte « Hold up (autonome) » doit apparaître sans bouton « Erreurs ». Sinon, ouvre-le et note le message.
5. Recharge l'onglet du site leurre après chaque rechargement de l'extension.

Pour la reconstruire depuis les sources : `node research/titouan/T_banc_e2e/extension_standalone/build_standalone.mjs` (le guide `INSTALL_STANDALONE_FR.md` cite Node 23.2 ou plus pour cette étape).

**Variante avec serveur.** Le serveur de vérification (port 8787) est déjà lancé par `scripts/demo.mjs`. Charge le dossier `research/titouan/T_banc_e2e/extension` de la même façon. Une seule des deux variantes à la fois dans Chrome.

Test rapide sans portefeuille : le guide `research/titouan/T_banc_e2e/INSTALL_FR.md` décrit la page d'essai `http://127.0.0.1:8787/test_page/` (faux portefeuille, rien n'est signé). Résultat attendu : une fenêtre rouge pour « Approve illimité » et pour le permit piège, une fenêtre d'information (jamais verte) pour un envoi simple.

Réglage utile pour la répétition : dans les options de l'extension, bouton « Durées de démo (10 s et 60 s) » puis « Enregistrer », pour ne pas attendre 30 s et 10 min à chaque essai (`extension_standalone/ESSAI_HUMAIN.md`).

## 4. Pointer un portefeuille sur la chaîne locale

À faire avec un portefeuille **jetable**, dans un profil Chrome de test. Jamais ta vraie phrase secrète, jamais un compte qui contient de vrais fonds.

1. Dans MetaMask, Core ou Rabby : ajouter un réseau.
   - Sans la porte de garde : RPC `http://127.0.0.1:8545`.
   - Avec la porte de garde (deuxième porte, après signature) : RPC `http://127.0.0.1:8555`.
   - Chain ID : `31337` (mode par défaut) ou `43114` (avec `--fork`). Symbole : `AVAX`.
2. Importe **un seul** compte de test Hardhat : la clé privée est affichée au démarrage du nœud (`logs/demo/chain.log`). Ces clés sont **publiques**, connues de tout le monde. Le compte approvisionné par la démo est celui que le script affiche (« compte approvisionné », aussi dans `research/demo_reelle/chain/addresses.local.json`, champ `victim`) : par défaut le compte Hardhat n°5. Ou lance avec `--victim <l'adresse de ton compte jetable>` et laisse la démo l'approvisionner (2 480 DemoUSDC de test et de l'AVAX local).
3. Ouvre `http://localhost:8791/lure.html` (le faux message), puis le site leurre, connecte le portefeuille et clique « Réclamer ma récompense ». Sans Hold up, la signature autorise l'attaquant simulé à vider les DemoUSDC (voir `http://localhost:8791/attaquant.html`). Avec Hold up, une fenêtre s'interpose avant celle du portefeuille.
4. Entre deux passages : `node research/demo_reelle/chain/reset.mjs --network local` (remet 2 480 DemoUSDC, révoque l'allowance, redéploie un drainer neuf), puis `node research/demo_reelle/site/config.js` pour que le site relise les adresses.

Ce que ce parcours vérifie, et ce qu'il ne prouve pas : voir `research/titouan/T_banc_e2e/essai_reel/ESSAI_REEL_METAMASK.md` (protocole en 14 scénarios) et `essai_reel/CE_QUI_PEUT_CASSER.md`. **Aucun essai avec un vrai MetaMask n'est consigné à ce jour** (`ESSAI_REEL_RESULTATS.csv` est vide).

## 5. Fuji (optionnel, rien n'est déployé à ce jour)

`blockchain/DEPLOYMENTS.md` ne contient que son en-tête : aucun contrat n'est déployé sur Fuji. Pour le faire, il faut un compte déployeur financé par le faucet, avec `FUJI_PRIVATE_KEY` dans `.env` (jamais commité), puis `cd blockchain && DEMO_VICTIM=0x… npm run demo:fuji`. Détail et garde-fous : `research/demo_reelle/chain/README.md`, section Fuji. Ne jamais coller une clé dans un chat, un fichier suivi ou une capture.

## 6. Lancer les tests

Voir le tableau du [README](../README.md#lancer-les-tests). En résumé : `npm run test:engine`, `test:server`, `test:rpc`, `test:extension`, `test:contracts`.

## 7. Dépannage

| Symptôme | Cause probable | Que faire |
|---|---|---|
| `Node … est trop ancien` | Node avant 22.18 | Installer Node 22.18 ou plus. |
| `[ECHEC] chaîne locale : pas prêt` | port 8545 pris, ou Hardhat n'a pas démarré | `logs/demo/chain.log` ; libérer le port ou `HOLDUP_PORT=8548 node scripts/demo.mjs` |
| Un service est « saute : le port … est déjà utilisé » | une ancienne instance tourne encore | La fermer, ou garder celle-là. Le script ne tue jamais un processus qu'il n'a pas lancé. |
| Hardhat demande d'envoyer des statistiques anonymes | première exécution dans un terminal interactif | Répondre `n`. Le script positionne `HARDHAT_DISABLE_TELEMETRY_PROMPT=true` pour ses propres lancements. |
| Le bouton « Réclamer » du site ne réagit pas avec un autre port | la console d'attaque n'accepte en CORS que le site sur 8791 | Garder les ports par défaut hors tests. |
| Aucune fenêtre Hold up | extension désactivée, ou page ouverte avant le chargement | Recharger l'onglet ; pour un fichier local, activer « Autoriser l'accès aux URL de fichier » ; mieux, servir la page en http. |
| 2 tests du moteur échouent | fichiers `bench/data/*.json` ignorés par git | Attendu sur un clone neuf, sans effet sur la démo. |

## 8. Désinstaller

Ctrl+C dans le terminal de la démo. `chrome://extensions` puis « Supprimer » sur la carte Hold up. Supprimer le profil Chrome de test et le dossier cloné suffit : rien n'est installé hors du dossier (les paquets sont dans `blockchain/node_modules`).

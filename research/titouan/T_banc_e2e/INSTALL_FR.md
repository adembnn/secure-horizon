# Installer Sentinelle dans Chrome (version d'essai)

Durée : environ 10 minutes. Tu n'as besoin de **rien d'autre** que Chrome et Node.js : pas d'outil de test, pas de réglage caché, **aucun drapeau de débogage**. Le « mode développeur » que Chrome propose dans ses réglages d'extensions suffit.

Tout reste sur ton ordinateur : le petit serveur n'écoute que sur ton propre ordinateur (`127.0.0.1`), il n'appelle aucun site, et il n'enregistre qu'un journal local (voir plus bas).

## Avant de commencer
- Chrome (ou Edge) à jour.
- Node.js 22 ou plus récent (ici : Node 24). Pour vérifier : ouvre un terminal et tape `node -v`.
- Le dossier `T_banc_e2e` tel quel, sans rien installer de plus.

## Étape 1. Lancer le serveur (une commande)

Dans le dossier `T_banc_e2e`, ouvre un terminal et tape :

```
node server\server.mjs
```

(ou double-clique sur `server\start.cmd`). Tu dois voir une ligne qui commence par :

```
Sentinelle : serveur pret sur http://127.0.0.1:8787
```

**Laisse cette fenêtre ouverte** tant que tu utilises Sentinelle. `Ctrl+C` pour arrêter.

Si tu ne veux aucun journal : `node server\server.mjs --no-journal`.

## Étape 2. Charger l'extension dans Chrome

1. Dans Chrome, tape `chrome://extensions` dans la barre d'adresse.
2. En haut à droite, active **Mode développeur**.
3. Clique sur **Charger l'extension non empaquetée**.
4. Choisis le dossier `T_banc_e2e\dist\sentinelle-extension` (copie propre, sans les fichiers de test).
   - Si le dossier `dist` n'existe pas : `powershell -ExecutionPolicy Bypass -File server\package.ps1` le recrée, ainsi que `dist\sentinelle-extension.zip`.
   - Si tu reçois le fichier `.zip` : clic droit, « Extraire tout… », puis choisis le dossier extrait (celui qui contient directement `manifest.json`).
5. « Sentinelle » apparaît dans la liste, sans erreur en rouge.

Chrome peut afficher un message sur les « extensions du mode développeur » au démarrage : c'est normal pour une extension non publiée. Ferme le message ; ne désactive pas l'extension.

## Étape 3. Vérifier que ça marche

1. Le serveur tourne (étape 1).
2. Ouvre la page d'essai : **http://127.0.0.1:8787/test_page/**
   - Elle affiche « Serveur Sentinelle : en marche ».
   - Elle contient un **faux portefeuille** créé par la page elle-même : aucun vrai portefeuille, aucun argent, rien ne peut être perdu.
3. Clique sur **Approve illimité**. Une fenêtre Sentinelle doit s'afficher **avant** que le faux portefeuille reçoive la demande, avec un niveau rouge. Clique sur **Annuler** : la page indique « Tu as annulé ».
4. Clique sur **Signer un permit piège** : fenêtre rouge aussi.
5. Clique sur **Envoi simple** : une fenêtre d'information s'affiche. Sentinelle ne dit jamais « tout est bon » : au mieux, elle montre une information et rappelle les limites de sa vérification. Tu peux continuer : la page indique que la demande est arrivée au faux portefeuille.

Si les trois fenêtres apparaissent, l'installation est bonne.

Remarque : n'ouvre pas la page d'essai comme un fichier (`file://`). Chrome interdit par défaut aux extensions d'agir sur les fichiers locaux. C'est pour cela que le serveur sert lui-même la page d'essai.

## Étape 4. Dépannage

| Symptôme | Cause probable | Que faire |
|---|---|---|
| Aucune fenêtre ne s'affiche, le faux portefeuille répond tout de suite | Extension absente ou désactivée, ou page ouverte avant l'installation | Vérifie dans `chrome://extensions` que Sentinelle est activée, puis **recharge la page** (F5). |
| Fenêtre « On n'a pas pu vérifier cette demande » | Le serveur ne tourne pas, ou un autre programme occupe le port 8787 | Relance l'étape 1. Ouvre `http://127.0.0.1:8787/health` dans Chrome : tu dois voir `"status":"up"`. |
| `Le port 8787 est deja utilise` au lancement | Un autre serveur Sentinelle (ou le faux moteur de test) tourne déjà | Ferme l'autre fenêtre de terminal, puis relance. |
| `Node.js est introuvable` | Node n'est pas installé ou pas dans le PATH | Installe Node depuis nodejs.org, puis rouvre le terminal. |
| Erreur rouge dans `chrome://extensions` | Mauvais dossier choisi | Choisis le dossier qui contient directement `manifest.json`. |
| Erreur 4900 « demande bloquée » dans la page | Le pont interne de l'extension ne répond plus (extension rechargée pendant que la page était ouverte) | Recharge la page. C'est un choix de sécurité : dans le doute, l'extension bloque. |
| Rien dans le journal | Normal avec `--no-journal` | Le journal est dans `journal\verdicts.jsonl`. |

Pour vérifier que le journal n'a pas été falsifié : `node server\server.mjs --verify-journal`.

### Ce qui est enregistré
Seulement un journal local `journal\verdicts.jsonl` : date, site, type de demande, niveau, codes de raison, et une **empreinte** (hachage) des paramètres, jamais les paramètres eux-mêmes ni ton adresse. Chaque ligne contient l'empreinte de la précédente : modifier une ligne casse la chaîne et cela se voit. Supprime le dossier `journal` quand tu veux.

### Dire qui sont tes contacts (facultatif)
Copie `server\context.example.json` en `server\context.local.json` et remplace les adresses par celles de tes proches. Sans ce fichier, le serveur ne connaît personne et ne peut pas reconnaître une **adresse qui ressemble à celle d'un contact** (l'« adresse sosie »). Avec ce fichier, il la détecte (testé).

## Ce que Sentinelle ne fait pas (dans cette version)
- **Les envois lancés depuis l'interface du portefeuille lui-même** (le bouton « Envoyer », « Swap » ou « Bridge » de MetaMask, Rabby, etc.) : la page web n'est pas dans le chemin, Sentinelle ne les voit pas.
- **Le téléphone** : WalletConnect, QR code, application mobile du portefeuille, navigateur du téléphone : aucune protection. Il faudrait un autre produit.
- Les portefeuilles matériels (Ledger Live), Safe (multisig) en application intégrée, les comptes à clé d'accès (passkeys), les réseaux hors Ethereum et compatibles (Solana, Bitcoin) : non couverts.
- **Il ne reconnaît pas tout.** Mesure sur 385 cas de notre jeu de développement, **sans contexte** (ni contacts, ni historique, ni intention déclarée) : sur 252 cas malveillants, 152 sont notés « critique », 46 « attention » et **54 restent notés « information »**, donc non détectés dans ce mode. Les adresses sosies, les faux jetons et les arnaques où seul le contexte trahit l'attaque ont besoin du fichier de contacts, de l'historique et de la question d'intention. L'« information » n'est **jamais** un feu vert.
- Sentinelle n'a pas été essayée avec un **vrai** portefeuille (MetaMask, Rabby…) ni de vraies bibliothèques de sites (ethers, viem, wagmi) : seulement des simulations. Un site motivé peut aussi détecter la présence de l'extension.
- Le serveur n'utilise **aucun réseau** : il ne sait donc pas si un contrat est récent, si un jeton est un piège connu, ni si un site figure sur une liste noire.
- Si le serveur est arrêté, Sentinelle affiche « non vérifié » et te laisse choisir, à tes risques : ce n'est pas un blocage.

## Pour une distribution publique (Chrome Web Store)
Ce que tu fais ici est une installation d'essai, pour toi. Pour que d'autres personnes l'installent en un clic :
1. **Un compte développeur Chrome Web Store** (compte Google, frais d'inscription uniques, de l'ordre de 5 dollars) avec vérification de l'éditeur.
2. **Le moteur doit être dans l'extension.** Aujourd'hui l'extension appelle un serveur sur ton ordinateur : un public ne peut pas faire ça. Il faut soit embarquer le moteur dans l'extension (il est en JavaScript sans dépendance : faisable, à faire et à tester), soit l'héberger, ce qui change la vie privée (les demandes de signature quitteraient l'ordinateur).
3. **Une revue par Google.** Les extensions qui lisent toutes les pages (`<all_urls>`) et injectent du code dans la page sont examinées de près : compte plutôt **plusieurs jours à plusieurs semaines**, avec des allers-retours possibles. Chaque permission et le code injecté devront être justifiés.
4. **Une fiche** : description claire (un seul objectif), icônes, captures d'écran, catégorie, langues.
5. **Une politique de confidentialité** publiée en ligne : quelles données sont lues (adresses, texte de la page, intention), où elles vont (nulle part, ou vers quel serveur), combien de temps elles sont gardées. Elle est obligatoire dès qu'on touche à des données de navigation.
6. Ne pas livrer le mode de test (`testMode`) de l'extension, prévoir les mises à jour et un contact de support.

## Chiffres de test
Dernière exécution : `server\test\results.json` (à relancer avec `node server\test\server.test.mjs`).

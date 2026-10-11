# Hold up autonome : installer et vérifier

Hold up autonome est une extension Chrome (ou Edge) qui contient son propre moteur d'analyse. **Il n'y a rien à lancer à côté** : pas de serveur, pas de terminal, pas d'Internet nécessaire. L'extension n'a aucun accès réseau.

**Aucun drapeau de débogage n'est nécessaire.** Tu n'as pas à lancer Chrome avec une option spéciale, ni à ouvrir un port, ni à installer quoi que ce soit d'autre.

## 1. Installer

1. Dézippe `dist\hold-up-standalone.zip`. Tu obtiens un dossier `hold-up-standalone`. (Si tu travailles dans le dépôt, tu peux aussi utiliser directement le dossier `extension_standalone\extension`.)
2. Dans Chrome, tape `chrome://extensions` dans la barre d'adresse (dans Edge : `edge://extensions`).
3. En haut à droite, active **Mode développeur**.
4. Clique sur **Charger l'extension non empaquetée** et choisis le dossier `hold-up-standalone`.
5. « Hold up (autonome) » apparaît dans la liste, sans message d'erreur en rouge. Si un bouton « Erreurs » apparaît, clique dessus et note le message.
6. Pour la page de test locale (étape 2 ci-dessous) : sur la carte de l'extension, clique sur **Détails**, puis active **Autoriser l'accès aux URL de fichier**.

## 2. Vérifier avec la page de test

1. Ouvre le fichier `standalone_test_page\index.html` dans Chrome (glisse-le dans la fenêtre, ou « Ouvrir le fichier »). Si tu l'avais déjà ouvert avant d'activer l'extension, recharge la page.
2. La page contient un **portefeuille factice** : aucun argent, aucune clé, rien n'est signé. Il note seulement ce qu'on lui demande.
3. Clique sur chaque bouton. Résultat attendu :

| Bouton | Ce que tu dois voir |
|---|---|
| 1. Droit illimité (piège) | Fenêtre de Hold up en **danger** : « Tu donnes à ce site le droit de prendre tes jetons sans limite. » |
| 2. « Permit » (piège) | Fenêtre en **danger** : une signature qui laisse le site prendre tes jetons pendant très longtemps. |
| 3. Envoi simple 0,01 ETH | Fenêtre **« à vérifier »** (jamais verte) : Hold up ne dit jamais « tout va bien ». |

4. Dans la fenêtre, clique sur **Annuler**. Le cadre « Ce que le portefeuille factice a reçu » reste vide (ou la page affiche « Demande refusée »). Cela prouve que la demande est retenue **avant** d'arriver au portefeuille.
5. Refais le bouton 3 et choisis de continuer : cette fois le portefeuille factice affiche la demande reçue.

Si aucune fenêtre n'apparaît : recharge la page de test, vérifie que l'extension est activée et que « Autoriser l'accès aux URL de fichier » est coché. Si la page est servie en `https://`, ce réglage n'est pas nécessaire.

## 3. Mon carnet d'adresses (facultatif)

Page d'options de l'extension (clic droit sur l'icône, « Options »), zone « Mon contexte ». Tu peux y mettre tes contacts, un historique de paiements, tes autres adresses et les contrats que tu connais. Sans cela, tout est « inconnu » : voir les limites ci-dessous. Tout reste dans le stockage local de ton navigateur.

## 4. Ce que cette version fait et ne fait pas

- Le moteur est le même que celui de la version serveur (mêmes règles, même comparateur, même politique, mêmes textes). Sur les cas du banc, **les verdicts sont identiques à 100 %** (voir `extension_standalone\out\RESULTATS.json`).
- Pas de contexte réseau : l'extension ne peut pas interroger la blockchain. Elle ne sait donc pas si une adresse est un contrat, depuis quand il existe, quel est ton solde, ni si un jeton est une arnaque connue. Sans carnet d'adresses ni historique saisis dans les options, elle ne sait pas non plus si un destinataire est nouveau ou si une adresse est le sosie de l'une des tiennes. Résultat : moins de signaux, donc plus de demandes en simple « à vérifier » ou « non vérifié » qu'avec un contexte riche.
- Une demande que le moteur ne sait pas lire (méthode inconnue, données illisibles, trop volumineuse, moteur en panne) s'affiche comme **« non vérifié »** : ce n'est ni un feu vert ni un feu rouge.
- Les limites de l'extension elle-même (WalletConnect, portefeuilles matériels, applications mobiles, etc.) sont dans `extension\COMPAT.md`. Cette version autonome n'a **pas encore été testée dans un vrai Chrome** : seules les vérifications Node décrites dans `extension_standalone\out\RESULTATS.json` ont été exécutées.

## 5. Désinstaller

`chrome://extensions`, bouton **Supprimer** sur la carte « Hold up (autonome) ».

## Pour les développeurs

- Reconstruire : `node extension_standalone\build_standalone.mjs` (Node 23.2 ou plus, aucun paquet à installer).
- Tests : `node --no-warnings extension_standalone\tests\run_tests.mjs` et `node extension_standalone\tests\static_check.mjs`.
- Créer le zip : `powershell -ExecutionPolicy Bypass -File extension_standalone\package_standalone.ps1`.

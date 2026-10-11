# Protocole V2 : essai réel de Hold up avec un vrai MetaMask

Date : 11 oct. 2026. Remplace `ESSAI_REEL_METAMASK.md`, écrit avant le produit figé (il parle de "Sentinelle", du serveur 8787 et d'une fenêtre dans la page : tout cela est périmé). Les fichiers `CE_QUI_PEUT_CASSER.md` et `page_essai\` datent aussi de cette époque : on les garde pour mémoire, on n'en dépend plus (sauf `page_essai\` pour Fuji, section 9).

Ce protocole est écrit pour une personne qui n'est pas développeuse. Une case = un geste. Une commande = un bloc. Aucun agent n'a joué ce protocole : tout ce qui est écrit sous "Prévu" est une **prévision tirée du code**, pas un constat. Ton travail est de remplacer les prévisions par des constats, dans `RESULTATS_TEMPLATE.md`.

Chemin du dépôt (c'est celui-ci, pas "Hack Secure Horizon") : `C:\Users\detot\Documents\secure-horizon`. On le note `R` plus bas.

Ce que l'essai doit répondre :
1. Hold up s'installe-t-il et s'affiche-t-il dans un vrai Chrome (panneau latéral) ?
2. Hold up retient-il la demande **avant** que MetaMask ne s'ouvre, avec un vrai MetaMask (EIP-6963, `window.ethereum`) ?
3. Que montre MetaMask seul pour la même demande ? Sur Sepolia, MetaMask est servi par l'API d'alertes : on voit enfin ce qu'il affiche vraiment.

---

## 0. Règles de sécurité (à lire, à cocher)

- [ ] **Aucun fonds réel, jamais.** Tout se fait sur une chaîne locale ou un réseau de test (Sepolia, Fuji). Le test net ne vaut rien.
- [ ] **Aucune phrase de récupération réelle.** On crée un MetaMask **neuf**, dans un **profil Chrome dédié**. MetaMask te montrera une phrase de 12 mots pour ce portefeuille neuf : elle ne protège rien de valeur. Ne tape jamais la phrase de ton vrai portefeuille, nulle part dans cet essai.
- [ ] **Les clés Hardhat sont publiques** (tout le monde les connaît). On ne les utilise que sur la chaîne locale, jamais sur Sepolia ni Fuji, où des robots les balaient.
- [ ] **Aucune clé dans un fichier suivi.** Pas de `.env` à créer pour les sections 1 à 8. (Seule la section 9, Fuji, optionnelle, en demande un : tu le fais toi-même, tu ne le donnes à personne.)
- [ ] Si un robinet (faucet) te demande de **payer** ou d'envoyer de l'argent réel : arrête, ce n'est pas le bon site.
- [ ] Pas de navigateur lancé avec des options de débogage. Chrome normal, extension chargée à la main.

---

## 1. Ce qu'il faut avoir, et ce qui manque aujourd'hui

Vérifié par lecture du dépôt le 11 oct. 2026 sur cette machine.

| Élément | État | Ce que tu dois faire |
|---|---|---|
| Node.js | version 24.18.1 présente (il faut 22.18 ou plus) | rien. Hardhat peut afficher un avertissement sur la version de Node : normal, continue |
| Chrome | à toi | version 114 ou plus (`chrome://version`) |
| MetaMask | **à installer** dans le profil dédié (section 2) | depuis le lien officiel `https://metamask.io/download` |
| `blockchain\node_modules` | **absent** : Hardhat n'est pas installé | `npm install` dans `blockchain\` (section 4, Internet requis, environ une minute, ~640 paquets) |
| Compilateur Solidity 0.8.24 | pas encore téléchargé | se télécharge tout seul au premier `compile` (Internet) |
| `research\demo_reelle\chain\addresses.local.json` | **absent** | créé par la commande `deploy-local.js` (section 4) |
| `research\demo_reelle\site_echange\addresses.local.json` | **périmé** (chaîne 43114, anciennes adresses) | recopié par `config.js` après le déploiement (section 4). Ne lance jamais le site Neve avant cette recopie |
| Contrats du coffre (scène "signataire aveugle") | **n'existent pas** : `blockchain\contracts\demo\` ne contient que DemoUSDC, DemoWAVAX, DemoNFT, DemoRouter, FreshDrainer. `pitch\DEMO_SCENES.md` dit "à bâtir, non fait" | la scène coffre est sautée (section 6.3). Elle n'est pas un échec |
| Réseau Sepolia dans Hardhat | **absent** de `blockchain\hardhat.config.js` (seulement `localhost` et `fuji`) | on n'en a pas besoin : on utilise l'USDC de test de Circle (section 8) |
| `blockchain\DEPLOYMENTS.md` | vide (en-tête seulement) | rien n'est déployé sur Fuji. La section 9 est optionnelle |
| Paquet zip de l'extension | on ne l'utilise pas | on charge le **dossier** `extension_standalone\extension` |
| Icône de l'extension | le manifeste n'a pas d'icône | Chrome affiche une lettre : normal, ce n'est pas une erreur |

Contrôle rapide, sans rien installer ni lancer :

```powershell
cd C:\Users\detot\Documents\secure-horizon
```

```powershell
node scripts/demo.mjs --check
```

- [ ] Réussite : "Node >= 22.18 : oui", ports 8545, 8791, 8792 "libre". "blockchain/node_modules : absent" est **attendu**.
- [ ] Échec : un port "OCCUPÉ". Va à la panne P6.

Outil pour les captures : touche **Windows + Maj + S**, puis enregistre dans `R\research\titouan\T_banc_e2e\essai_reel\captures\` (crée le dossier `captures`). Utilise **exactement** les noms de fichier donnés (format .png).

---

## 2. Un profil Chrome dédié et un MetaMask neuf

- [ ] Dans Chrome : clique ton avatar en haut à droite, "Ajouter un profil", "Continuer sans compte". Nomme-le `HoldUp essai`. Toute la suite se passe **dans ce profil**.
- [ ] Dans ce profil, ouvre `https://metamask.io/download` et installe l'extension depuis le lien de la boutique Chrome qu'il propose. Vérifie que l'éditeur est bien MetaMask.
- [ ] Ouvre MetaMask : "Créer un nouveau portefeuille" (pas "Importer"). Choisis un mot de passe de test. Note la phrase affichée sur un papier à jeter, termine la sauvegarde demandée.
- [ ] Épingle MetaMask et Hold up (plus tard) : icône puzzle de Chrome, punaise à côté de chaque extension.

Capture : `00_profil_metamask_neuf.png` (la fenêtre MetaMask ouverte, sans afficher de phrase de récupération).

Réglage MetaMask à faire une fois : MetaMask, menu (trois points), Paramètres, Avancé, active "Afficher les réseaux de test" (Show test networks).

---

## 3. Installer l'extension Hold up et vérifier le panneau latéral

- [ ] Ouvre `chrome://extensions` (dans le profil `HoldUp essai`).
- [ ] Active "Mode développeur" (en haut à droite).
- [ ] Clique "Charger l'extension non empaquetée". Choisis ce dossier exact :

```text
C:\Users\detot\Documents\secure-horizon\research\titouan\T_banc_e2e\extension_standalone\extension
```

- [ ] La carte "Hold up (autonome)", version 0.3.0, apparaît **sans bouton rouge "Erreurs"**. Capture : `01_extension_carte.png`.
- [ ] Si tu as chargé une autre version de Hold up (dossier `extension\`, avec serveur) : désactive-la. Une seule à la fois.
- [ ] Épingle Hold up, puis **clique sur son icône**. Un panneau latéral s'ouvre.
- [ ] Le panneau dit "Hold up est actif.", "Version 0.3.0 · Aucune connexion réseau", "Aujourd'hui : 0 demandes vérifiées, 0 annulées", "Aucune demande pour l'instant." Capture : `02_panneau_lateral_vide.png`.

Critères :
- Réussite : carte sans erreur et panneau "Hold up est actif.".
- Échec : bouton "Erreurs" (ouvre-le, copie le message dans la fiche, **stop**), ou panneau "Hold up est inactif." (panne P1), ou rien ne s'ouvre au clic (panne P2).

Réglages de l'extension (une fois) : `chrome://extensions`, carte Hold up, "Détails", "Options de l'extension".
- [ ] Clique "Durées de démo (10 s et 60 s)" puis "Enregistrer" (évite d'attendre 30 s et 10 min). À remettre en "Durées du produit" à la fin (section 11).
- [ ] Vérifie que la case "Afficher la question et la réponse dans une fenêtre Hold up séparée" est cochée.

Le champ "Mon contexte" se remplit plus tard (sections 5 et 8), car il contient des adresses qui n'existent pas encore.

---

## 4. Lancer la chaîne locale (une fois par session)

Il faut 4 fenêtres PowerShell. Appelle-les T1, T2, T3, T4 (T4 seulement pour la scène S6).

**Mode choisi : chaîne vide hors ligne, chainId 31337.** Le mode "fork" (43114) entre en conflit avec le réseau Avalanche déjà connu de MetaMask et demande Internet : on l'évite.

### 4.1 Installer Hardhat (une seule fois)

T2 :

```powershell
cd C:\Users\detot\Documents\secure-horizon\blockchain
```

```powershell
npm install
```

- [ ] Réussite : se termine sans "ERR!" ; le dossier `blockchain\node_modules` existe.
- [ ] Échec : voir panne P7.

```powershell
npx hardhat compile
```

- [ ] Réussite : "Compiled ... Solidity files successfully" (la première fois, il télécharge le compilateur).

### 4.2 Démarrer le nœud (T1, à laisser ouverte)

T1 :

```powershell
cd C:\Users\detot\Documents\secure-horizon\blockchain
```

```powershell
$env:HOLDUP_CHAIN_MODE = "plain"
```

```powershell
npm run chain:local
```

- [ ] Réussite : la fenêtre affiche `mode=plain chainId=31337 rpc=http://127.0.0.1:8545`, puis une liste "Account #0 ... Account #19" avec des clés privées. **Laisse cette fenêtre ouverte.**
- [ ] Échec : voir pannes P6 (port) et P7.

### 4.3 Déployer les contrats de démo (T2)

```powershell
npx hardhat run scripts/demo/deploy-local.js --network localhost
```

- [ ] Réussite : lignes `DemoUSDC`, `DemoWAVAX`, `DemoNFT`, `DemoRouter`, `FreshDrainer` avec des adresses, puis "Victim 0x... : 2480 DUSDC, 100 test AVAX". Sans `DEMO_VICTIM`, le compte approvisionné est le **compte n°5 de Hardhat**.
- [ ] Note l'adresse du "Victim" : c'est le compte à importer dans MetaMask (section 5).

Affiche les adresses (tu en auras besoin) :

```powershell
Get-Content C:\Users\detot\Documents\secure-horizon\research\demo_reelle\chain\addresses.local.json
```

- [ ] Réussite : `"chainId": 31337`, `usdc`, `router`, `drainer`. Recopie `usdc`, `router`, `drainer` dans la fiche de résultats.

### 4.4 Servir le site d'échange Neve (T3, à laisser ouverte)

T3 :

```powershell
cd C:\Users\detot\Documents\secure-horizon
```

```powershell
node research/demo_reelle/site_echange/config.js
```

- [ ] Réussite : "addresses.local.json copie depuis chain/". (Sinon : pas de déploiement, refais 4.3.)

```powershell
node docs/demo/serve_static.mjs research/demo_reelle/site_echange 8793
```

- [ ] Réussite : "serving ... on http://127.0.0.1:8793".

### 4.5 Servir le site "Glacier Rewards" et la console d'attaque (pour S6)

T4 :

```powershell
cd C:\Users\detot\Documents\secure-horizon
```

```powershell
node research/demo_reelle/site/config.js
```

```powershell
node docs/demo/serve_static.mjs research/demo_reelle/site 8791
```

Ouvre une 5e fenêtre PowerShell (T5), seulement si tu veux voir le drain se produire sans Hold up :

```powershell
node C:\Users\detot\Documents\secure-horizon\research\demo_reelle\chain\drain.mjs --network local --serve
```

- [ ] Réussite : "127.0.0.1:8792". Sans T5, le site Glacier fonctionne jusqu'à la signature, c'est suffisant.

Remise à zéro entre deux passages (nouveau FreshDrainer, solde remis à 2 480) :

```powershell
node C:\Users\detot\Documents\secure-horizon\research\demo_reelle\chain\reset.mjs --network local
```

Puis relance `config.js` des deux sites (4.4 et 4.5, la commande seule, sans relancer le serveur) et recharge les pages.

---

## 5. Brancher MetaMask sur la chaîne locale, avec un compte de test jetable

### 5.1 Ajouter le réseau

Dans MetaMask : liste des réseaux, "Ajouter un réseau", "Ajouter un réseau manuellement".

| Champ | Valeur |
|---|---|
| Nom du réseau | `Local Hold up` |
| URL RPC | `http://127.0.0.1:8545` |
| ID de chaîne | `31337` |
| Symbole | `AVAX` |
| Explorateur | (vide) |

- [ ] Enregistre, puis sélectionne ce réseau. Il doit afficher un solde (0 pour l'instant).
- [ ] Si MetaMask dit que l'ID de chaîne ne correspond pas au RPC : vérifie que T1 affiche bien 31337 (panne P5).

### 5.2 Importer le compte de test (clé publique de Hardhat)

- [ ] Dans T1, repère la ligne `Account #5: 0x...` : son adresse doit être égale au "Victim" de 4.3.
- [ ] MetaMask, menu des comptes, "Ajouter un compte ou un portefeuille", "Importer un compte", type "Clé privée".
- [ ] Copie la clé privée **de la ligne Account #5 de T1** (clic droit pour coller dans MetaMask). Cette clé est publique, c'est exactement le but. **Si tu hésites sur l'origine d'une clé, ne l'importe pas.**
- [ ] Renomme le compte `LOCAL-5 (cle publique)`.

Vérifie : le solde affiche 100 (AVAX de test). Importer le jeton : "Importer des jetons", adresse `usdc` de 4.3, symbole DUSDC, décimales 6 : le solde doit être 2 480.

Capture : `03_metamask_reseau_local_compte.png` (nom du réseau, nom du compte, solde 100, sans clé visible).

### 5.3 Dire à Hold up quel jeton est "USDC"

Hold up ne compare "50 USDC" à une demande que s'il connaît le jeton par son adresse. Sinon il répond "Je n'ai pas pu vérifier cette demande" (revue S2). Le fichier `ESSAI_HUMAIN.md` donne `"symbol":"DemoUSDC"` : avec la phrase "50 USDC" cela ne correspondrait pas. **Écris le symbole `USDC`.**

- [ ] Options de Hold up, champ "Mon contexte", colle ce texte en remplaçant les deux adresses (`usdc` et `router` de 4.3), puis "Enregistrer" :

```json
{"tokens":[{"address":"ADRESSE_USDC","symbol":"USDC","decimals":6,"chainId":31337}],"knownSpenders":["ADRESSE_ROUTER"]}
```

- [ ] Le message de l'enregistrement est un succès, sans erreur de format.

Note : `knownSpenders` = le routeur est "connu" ; le FreshDrainer ne l'est pas. C'est ce qui fait la différence "routeur connu / adresse neuve" (prévision tirée du code, à confirmer).

---

## 6. Scènes sur la chaîne locale

Règle de jeu pour **chaque** scène : tu la joues **avec Hold up**, tu prends les captures, puis tu remplis le tableau. Le test sans Hold up est en section 7.

Pour chaque demande, Hold up ouvre une **fenêtre séparée** : "Que veux-tu faire sur ce site ?". Tu tapes la phrase indiquée, tu valides avec Entrée. Pour chaque demande, deux captures :
- celle de la fenêtre Hold up (question puis verdict) ;
- celle de MetaMask **si et quand il s'ouvre**.

Si MetaMask s'ouvre avant Hold up : c'est un **échec de la retenue**, note-le (capture `*_ECHEC_retenue.png`).

Avant chaque scène : recharge la page (F5) et `chrome://extensions` doit montrer l'extension sans erreur.

### 6.1 S1 : "échanger 50 USDC", routeur connu puis adresse neuve

Phrase à taper à chaque fois : `échanger 50 USDC contre AVAX`

**S1-A, mode honnête (routeur connu, 50 exactement)**

- [ ] Ouvre `http://127.0.0.1:8793/?mode=honnete` dans le profil `HoldUp essai`, MetaMask sur `Local Hold up`, compte `LOCAL-5`.
- [ ] Clique le bouton (il dit "Connecter le portefeuille"), accepte dans MetaMask. Le bouton devient "Échanger".
- [ ] Clique "Échanger". Réponds à la question Hold up. Première demande : autorisation de 50 DUSDC au routeur.

Prévu (code, à confirmer) : verdict "Ça correspond à ce que tu as écrit." ; MetaMask s'ouvre seul après environ 1 seconde. Une seconde demande (l'échange) peut donner "Je n'ai pas pu vérifier cette demande" (le jeton y est lu par simulation).

Captures : `S1A_holdup_question.png`, `S1A_holdup_verdict.png`, `S1A_metamask_approve.png`, puis `S1A_holdup_verdict_swap.png`, `S1A_metamask_swap.png`.
- [ ] Confirme dans MetaMask les deux demandes (compte de test, aucun risque). Le site doit dire "Échange effectué".

| S1-A honnête | MetaMask seul (section 7) | Avec Hold up |
|---|---|---|
| Écran MetaMask affiché (titre, "Spending cap", montant) | | |
| Alerte MetaMask (oui/non, texte exact) | | |
| Hold up : question posée (oui/non) | sans objet | |
| Hold up : verdict et niveau | sans objet | |
| MetaMask s'est ouvert seul après combien de secondes | | |
| Résultat sur la chaîne (solde DUSDC) | | |

Réussite S1-A : verdict "correspond", MetaMask s'ouvre après Hold up, la transaction passe. Échec : fausse alerte rouge, ou MetaMask ouvert avant Hold up, ou blocage sans issue.

**S1-B, mode piège (droit illimité vers une adresse neuve, le FreshDrainer)**

- [ ] Remets à zéro si besoin (`reset.mjs`, puis `config.js`, voir fin de 4.5). Ouvre `http://127.0.0.1:8793/?mode=piege`, connecte, clique "Échanger".
- [ ] Tape `échanger 50 USDC contre AVAX`.

Prévu : "Ça ne correspond pas à ce que tu as écrit." ; ligne qui dit que tu voulais 50 et que la demande donne accès à tout ton USDC ; proposition de ramener à "Droit limité à 50 USDC" ; MetaMask ne s'ouvre **pas** tant que tu n'as pas cliqué "Continuer". Aucun écran vert.

Captures : `S1B_holdup_question.png`, `S1B_holdup_verdict.png`. Puis :
- [ ] Clique "Annuler". Le site doit dire "Opération annulée.". MetaMask ne s'est pas ouvert. Capture `S1B_apres_annuler.png`.
- [ ] Relance la demande. Clique "Continuer" (suis ce que Hold up demande : phrase à retaper, compte à rebours de 10 s). MetaMask s'ouvre. Capture `S1B_metamask_approve_illimite.png` : note ce que MetaMask écrit pour le montant ("Unlimited" ?) et pour l'adresse, et s'il y a une alerte.
- [ ] **Rejette** dans MetaMask (bouton Rejeter). Ne confirme pas.

| S1-B piège | MetaMask seul (section 7) | Avec Hold up |
|---|---|---|
| Titre de l'écran MetaMask | | |
| Montant affiché ("Unlimited" ?) | | |
| Alerte MetaMask sur l'adresse neuve (oui/non, texte) | | |
| Aperçu "changements estimés" affiché (oui/non) | | |
| Hold up : verdict | sans objet | |
| Hold up : proposition de plafond à 50 (oui/non) | sans objet | |
| Droit réellement envoyé à MetaMask si on continue (montant) | | |
| MetaMask s'est ouvert avant Hold up (oui/non) | sans objet | |

Réussite S1-B : "ne correspond pas", MetaMask fermé jusqu'au clic Continuer, annulation sans trace. Échec : MetaMask s'ouvre avant ou sans Hold up ; Hold up affiche "correspond" ; verdict vert.

Remarque pour l'interprétation : sur la chaîne locale, l'API d'alertes de MetaMask ne répond pas (31337 n'est pas servie). Si MetaMask n'affiche aucune alerte ici, **cela ne prouve rien** sur MetaMask en production. La section 8 (Sepolia) répond à cette question.

**S1-C, variante par signature** (même scène, droit donné par Permit)

- [ ] Ouvre `http://127.0.0.1:8793/?mode=piege&via=permit`, connecte, clique "Échanger", tape la même phrase.

Prévu : "Ça ne correspond pas", avec la ligne "cette signature ne peut pas être limitée" (pas de proposition de plafond, une signature ne se plafonne pas).

Captures : `S1C_holdup_verdict.png`, `S1C_metamask_permit.png` (après "Continuer"). **Rejette** dans MetaMask.

| S1-C Permit | MetaMask seul | Avec Hold up |
|---|---|---|
| Titre MetaMask ("Spending cap request" ?) | | |
| Lignes affichées (Spending cap, adresse) | | |
| Alerte MetaMask (oui/non, texte) | | |
| Hold up : verdict et mention "ne peut pas être limitée" | sans objet | |

### 6.2 S6 : "me connecter" qui signe un droit (Permit)

Phrase à taper : `me connecter`

- [ ] Ouvre `http://localhost:8791/lure.html`, clique "Vérifier mon éligibilité", puis "Connecter mon portefeuille" (accepte dans MetaMask), puis "Réclamer ma récompense".

Prévu : "Ça ne correspond pas" : une connexion ne devrait pas donner un droit de dépense. Pas de proposition de plafond. MetaMask ne s'ouvre qu'après "Continuer".

Captures : `S6_holdup_question.png`, `S6_holdup_verdict.png`, `S6_metamask_signature.png`.
- [ ] Clique "Annuler". Le site doit dire "Signature annulée.". Capture `S6_apres_annuler.png`.
- [ ] Relance, "Continuer", regarde l'écran MetaMask (domaine `Demo USDC`, adresse `usdc`, spender = adresse `drainer` de 4.3). **Rejette**, sauf pour le contrefactuel de la section 7.

| S6 Permit "me connecter" | MetaMask seul | Avec Hold up |
|---|---|---|
| Titre MetaMask | | |
| Valeur affichée (illimitée ? "Unlimited" ?) | | |
| Alerte MetaMask (oui/non, texte) | | |
| Hold up : verdict | sans objet | |
| Signature envoyée au site (oui/non) | | |

Témoin (facultatif, plus tard avec la page testnet, section 8) : `S6c` connexion par `personal_sign`. Hold up ne devrait pas bloquer une simple connexion.

### 6.3 Scène coffre (signataire aveugle)

- [ ] **Sautée, case cochée "non disponible".** Il n'y a pas de contrat de coffre dans `blockchain\contracts\demo\`. La scène existe seulement en rejeu du moteur : `node research/titouan/T_banc_e2e/demo_typologie/safe_signataire.mjs` (adresses factices, aucun portefeuille). Si tu veux la voir, lance cette commande :

```powershell
node C:\Users\detot\Documents\secure-horizon\research\titouan\T_banc_e2e\demo_typologie\safe_signataire.mjs
```

- [ ] Note dans la fiche : "coffre : rejeu du moteur seulement, pas d'essai MetaMask (contrats absents)".

Si les contrats du coffre apparaissent plus tard dans `blockchain\contracts\demo\` (par exemple un `DemoVault.sol`), joue la même méthode : phrase "virer 20 USDC à Paul", captures `COFFRE_holdup_verdict.png` et `COFFRE_metamask.png`, tableau comme ci-dessus.

---

## 7. Test négatif : la même scène sans Hold up (MetaMask seul)

But : voir ce que MetaMask affiche **sans aide**, avec exactement les mêmes demandes.

- [ ] `chrome://extensions`, **coupe** l'interrupteur de la carte Hold up (ne la supprime pas). Recharge chaque page de test.
- [ ] Vérifie : le panneau latéral n'indique plus "actif" (ou ne s'ouvre plus).
- [ ] Rejoue **S1-A, S1-B, S1-C, S6** (mêmes URL qu'en section 6), sans taper de phrase (il n'y en a plus). À chaque fois : capture de l'écran MetaMask **avant** de décider.

Captures : `NEG_S1A_metamask.png`, `NEG_S1B_metamask.png`, `NEG_S1C_metamask.png`, `NEG_S6_metamask.png`.

- [ ] Pour S1-B et S6 : **tu peux confirmer** sur la chaîne locale (jetons sans valeur). Après S1-B confirmé, le FreshDrainer a le droit illimité. Après S6 signé, si T5 tourne, la console d'attaque montre le vidage des 2 480 DUSDC. Capture `NEG_S6_drain_console.png` (la page `http://localhost:8791/attaquant.html`). C'est la preuve du contrefactuel.
- [ ] Reporte les observations dans la colonne "MetaMask seul" des tableaux de la section 6.
- [ ] Remise à zéro : commande `reset.mjs` (fin de 4.5), puis relance `config.js`.
- [ ] **Réactive** Hold up avant de continuer.

Critères :
- Réussite du test négatif : les demandes arrivent à MetaMask **sans** fenêtre Hold up (preuve que la différence vient bien de l'extension).
- Échec : une fenêtre Hold up apparaît alors que l'interrupteur est coupé (autre copie chargée ? panne P1).

---

## 8. Sepolia : voir ce que MetaMask affiche vraiment

Pourquoi Sepolia : d'après `RECHERCHE_metamask_couverture.md`, l'API d'alertes de MetaMask sert Sepolia (et Avalanche 43114), pas la chaîne locale ni Fuji. Ici, MetaMask utilise ses vraies alertes. Cela transforme les points [NV] du fichier de couverture en constats.

### 8.1 Un compte neuf pour Sepolia

- [ ] MetaMask, réseau "Sepolia" (visible grâce au réglage de la section 2).
- [ ] Ajoute un **nouveau compte créé par MetaMask** (pas d'import), nomme-le `SEPOLIA-1`. N'utilise **jamais** le compte `LOCAL-5` sur Sepolia.
- [ ] Copie son adresse publique (visible, sans danger).

### 8.2 Fonds de test (gratuits)

Ces adresses de robinets sont données de mémoire et changent : si l'une ne marche pas, cherche "Sepolia faucet" (prends un robinet qui ne demande aucun paiement).

- [ ] ETH de test pour le gaz (environ 0,05 suffit). Pistes : `https://cloud.google.com/application/web3/faucet/ethereum/sepolia` (compte Google), `https://sepolia-faucet.pk910.de` (pas de compte, minage dans le navigateur, tu l'arrêtes quand tu as assez). Colle l'adresse de `SEPOLIA-1`.
- [ ] USDC de test (Circle) : `https://faucet.circle.com`, réseau "Ethereum Sepolia", jeton USDC, colle l'adresse de `SEPOLIA-1`. Quantité typique : 10 à 20 USDC.
- [ ] MetaMask, "Importer des jetons", adresse du contrat USDC Sepolia de Circle :

```text
0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

(Adresse relue sur la page officielle de Circle `developers.circle.com/stablecoins/usdc-contract-addresses` le 11 oct. 2026.) Le solde USDC doit s'afficher.

Capture : `10_sepolia_soldes.png` (ETH et USDC de `SEPOLIA-1`).
- Échec : aucun robinet ne donne de fonds. Panne P9.

### 8.3 Une adresse vraiment neuve

MetaMask n'affiche pas "première interaction" pour un de **tes** comptes. Il faut une adresse qui n'est dans aucun de tes comptes. Génère-la (aucune clé n'est créée, personne ne la détient) :

```powershell
node -e "console.log('0x'+require('crypto').randomBytes(20).toString('hex'))"
```

- [ ] Copie l'adresse affichée dans la fiche comme `ADRESSE_NEUVE`.

### 8.4 La page d'essai testnet

```powershell
node C:\Users\detot\Documents\secure-horizon\research\titouan\T_banc_e2e\essai_reel\page_testnet\serve.mjs
```

- [ ] Ouvre `http://127.0.0.1:8794/` dans le profil `HoldUp essai`. Réglages déjà remplis pour Sepolia (réseau 11155111, USDC de Circle, domaine Permit "USDC" version "2", adresse connue = Permit2, un contrat public).
- [ ] Colle `ADRESSE_NEUVE` dans le champ "Adresse NEUVE".
- [ ] Clique "Connecter le portefeuille" (compte `SEPOLIA-1`). La barre dit "Réseau : 11155111 (attendu)".

### 8.5 D'abord MetaMask seul (le constat qu'on cherche)

- [ ] Coupe l'interrupteur de Hold up dans `chrome://extensions`, recharge la page.
- [ ] Pour **chaque** bouton ci-dessous : clique, **capture l'écran MetaMask**, lis chaque alerte, puis **Rejette** (ne confirme rien de "ILLIMITÉ").

| Bouton | Ce qu'il envoie | Capture |
|---|---|---|
| S1a | approve 50 USDC pour l'adresse connue (Permit2) | `SEP_S1a_metamask.png` |
| S1b | approve ILLIMITÉ pour l'adresse connue | `SEP_S1b_metamask.png` |
| S1c | approve ILLIMITÉ pour l'adresse neuve | `SEP_S1c_metamask.png` |
| S1d | envoi 0,0001 ETH à l'adresse neuve | `SEP_S1d_metamask.png` |
| S6a | Permit illimité signé pour l'adresse neuve | `SEP_S6a_metamask.png` |
| S6b | Permit illimité signé pour l'adresse connue | `SEP_S6b_metamask.png` |
| S6c | témoin : message simple | `SEP_S6c_metamask.png` |

Pour chaque ligne, note dans la fiche : titre de l'écran, montant ("Unlimited" ?), **y a-t-il une alerte ? le texte exact ?** (ex. "1st interaction", "Limited address signals", "Malicious", "Security check unavailable"), aperçu des changements (oui/non), délai ou case à cocher avant de confirmer.

C'est ce tableau qui remplace les [NV] suivants de `RECHERCHE_metamask_couverture.md` :
- avertissement spécifique "montant illimité" (S1b, S1c) ;
- alerte "1st interaction" (S1d) et "Limited address signals" (S1c, S6a) ;
- affichage d'un Permit (S6a, S6b) ;
- comportement général d'une demande pour une adresse neuve non signalée.

Réussite : une ligne de constat par bouton (alerte oui ou non). **L'absence d'alerte est aussi un résultat**, note-la telle quelle. Échec : MetaMask affiche "Security check unavailable" partout (note-le : l'API d'alertes est injoignable, panne P10).

### 8.6 Puis avec Hold up

- [ ] Réactive Hold up. Options, "Mon contexte" (remplace le contenu) :

```json
{"tokens":[{"address":"0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238","symbol":"USDC","decimals":6,"chainId":11155111}],"knownSpenders":["0x000000000022D473030F116dDEE9F6B43aC78BA3"]}
```

- [ ] Recharge la page. Rejoue S1a, S1b, S1c, S6a, S6b avec la phrase `échanger 50 USDC` (pour S6a et S6b, tape `me connecter`). Captures `SEP_S1a_holdup.png` ... `SEP_S6b_holdup.png` pour le verdict Hold up, plus l'écran MetaMask quand il s'ouvre.

| Bouton | Hold up prévu | Hold up observé | MetaMask s'ouvre avant Hold up ? |
|---|---|---|---|
| S1a | correspond (50, adresse connue) | | |
| S1b | ne correspond pas (illimité) | | |
| S1c | ne correspond pas (illimité, adresse neuve) | | |
| S6a | ne correspond pas (connexion donne un droit) | | |
| S6b | ne correspond pas | | |

Cas à noter : `S1a` vers Permit2 peut ne pas être lu comme un "échange" par l'extension. Ne force pas l'interprétation, note le verdict affiché.

### 8.7 Option : un contrat neuf (FreshDrainer) sur Sepolia

Seulement si tu veux une adresse neuve qui est un **contrat** (plus proche d'un vrai drainer). Hardhat n'a pas de réseau Sepolia ici, donc on passe par Remix, dans le navigateur :
- [ ] `https://remix.ethereum.org`, nouveau fichier, colle le contenu de `R\blockchain\contracts\demo\FreshDrainer.sol` (il importe OpenZeppelin, Remix le récupère seul), compile en 0.8.24.
- [ ] Déploie avec "Injected Provider MetaMask" sur Sepolia, argument du constructeur = `ADRESSE_NEUVE`. Cette transaction est elle-même une demande vue par Hold up : note ce qu'il dit.
- [ ] Remplace "Adresse NEUVE" dans la page testnet par l'adresse du contrat et rejoue S1c et S6a. Captures `SEP_contrat_*`.

---

## 9. Fuji (optionnel, décision reportée)

À ne faire que si l'équipe décide que Fuji compte. Rappel : Fuji (43113) n'est **pas** servi par l'API d'alertes de MetaMask, donc ce que MetaMask y affiche ne se compare pas à la production. Le but ne serait que de montrer une démo sur un testnet public. `blockchain\DEPLOYMENTS.md` est vide : rien n'y est déployé.

- [ ] Décision prise de jouer Fuji : oui / non (si non, saute à la section 10).
- [ ] Ajoute le réseau Fuji dans MetaMask (RPC `https://api.avax-test.network/ext/bc/C/rpc`, chaîne `43113`, symbole `AVAX`, explorateur `https://testnet.snowtrace.io`). Compte neuf créé par MetaMask, nommé `FUJI-1`.
- [ ] Fonds : robinet `https://build.avax.network/console/primary-network/faucet` (peut exiger un code ou un solde sur le réseau principal : si c'est le cas, cherche un autre robinet gratuit, ne paie rien).
- [ ] Déploiement des contrats de démo : exige une **clé de déployeur** dans `R\.env` (`FUJI_PRIVATE_KEY`, fichier ignoré par git). Crée pour cela un compte Fuji jetable, financé par le robinet. **Cette clé reste chez toi. Ne la donne à personne, ne l'écris dans aucun document.** Puis :

```powershell
cd C:\Users\detot\Documents\secure-horizon\blockchain
```

```powershell
$env:DEMO_VICTIM = "ADRESSE_DE_FUJI-1"
```

```powershell
npm run demo:fuji
```

- [ ] Réussite : adresses écrites dans `research\demo_reelle\chain\addresses.fuji.json` et `blockchain\DEPLOYMENTS.md`.
- [ ] Rejoue ensuite avec la page testnet (`http://127.0.0.1:8794/`) en mettant "Réseau attendu" à `43113`, jeton = `usdc` de `addresses.fuji.json`, nom de domaine Permit `Demo USDC`, version `1`, et la même méthode qu'en 8.5 et 8.6. Captures préfixées `FUJI_`.
- Si tu préfères l'ancienne page à 9 scénarios (Fuji codé en dur) : `node R\research\titouan\T_banc_e2e\essai_reel\page_essai\serve.mjs`, puis `http://127.0.0.1:8788/`. Elle dit "Sentinelle" dans ses textes, c'est le même produit.

---

## 10. Pannes probables et solutions

| # | Symptôme | Cause probable | Solution |
|---|---|---|---|
| P1 | Panneau "Hold up est inactif", ou aucune fenêtre Hold up quand le site demande | extension désactivée, ou page ouverte avant le chargement, ou onglet resté ancien après un rechargement de l'extension (code 4900 dans la console) | `chrome://extensions` : interrupteur sur ON, bouton recharger (flèche) sur la carte, puis **F5 sur la page de test**. Toujours recharger la page après avoir rechargé l'extension |
| P2 | Le clic sur l'icône n'ouvre pas de panneau | icône non épinglée, ou Chrome ancien | épingle l'icône (puzzle) ; vérifie `chrome://version` (114 ou plus). Autre voie : clic droit sur l'icône |
| P3 | Le site dit "Aucun portefeuille détecté" | MetaMask désactivé dans ce profil, ou Hold up empêche la détection (cas à noter, c'est un résultat) | vérifie MetaMask ON ; coupe Hold up, recharge : si le site détecte alors MetaMask, c'est Hold up la cause. Note-le dans la fiche, avec la console (F12) |
| P4 | EIP-6963 : par `window.ethereum` Hold up apparaît, par l'annonce EIP-6963 non (ou l'inverse). La page testnet journalise "EIP-6963 : portefeuille annoncé" | le fournisseur annoncé et `window.ethereum` peuvent être deux objets | Neve et la page testnet utilisent EIP-6963 en priorité. Dans la console (F12) de la page : `window.addEventListener('eip6963:announceProvider', e => console.log(e.detail.info.rdns, e.detail.provider === window.ethereum)); window.dispatchEvent(new Event('eip6963:requestProvider'))`. Note le résultat et le comportement. Si MetaMask s'ouvre sans Hold up par cette voie : échec de retenue, capture `*_ECHEC_retenue.png` |
| P5 | MetaMask refuse d'ajouter le réseau ("ID de chaîne différent") | T1 n'est pas en 31337 (mode fork lancé avant), ou nœud arrêté | regarde T1 (`chainId=31337`). Arrête (Ctrl+C), relance 4.2 avec `plain`, redéploie (4.3), recopie (4.4) |
| P6 | Port occupé (8545, 8791, 8793, 8794, 8792) | un ancien nœud ou serveur tourne encore | trouve le processus : `netstat -ano \| findstr :8545`, puis `taskkill /PID <numéro> /F`. Ou ferme les anciennes fenêtres PowerShell |
| P7 | `npm install` ou `hardhat` échoue, "node absent", "'npm' n'est pas reconnu" | Node non installé ou pas dans le PATH ; pas d'Internet ; antivirus | `node -v` doit répondre. Sinon réinstalle Node 22.18+ depuis nodejs.org et rouvre PowerShell. Vérifie la connexion. Pour "Cannot find module hardhat" : `npm install` n'a pas été fait dans `blockchain\` |
| P8 | Le site Neve affiche "Service indisponible" ou "Mauvais réseau" | `addresses.local.json` du site absent ou périmé (ancien 43114), ou MetaMask pas sur `Local Hold up` | refais `config.js` (4.4) après le déploiement, recharge ; sélectionne le bon réseau dans MetaMask |
| P9 | Aucun robinet Sepolia ne donne de fonds | robinets saturés ou qui exigent un solde réel | essaie un autre robinet gratuit ; le robinet à minage (pk910) n'exige rien mais prend du temps ; réessaie plus tard. Ne paie jamais. Si bloqué : saute la section 8 et note-le (c'est la section la plus utile, retente) |
| P10 | MetaMask affiche "Security check unavailable" partout sur Sepolia | l'API d'alertes injoignable (réseau, bloqueur de contenu, "Basic functionality" coupée dans MetaMask) | MetaMask, Paramètres, Sécurité : active les alertes de sécurité ; coupe un bloqueur de pub le temps du test. Note le message, c'est déjà un constat |
| P11 | MetaMask local : "nonce trop élevé", transaction qui reste "en attente" | tu as redémarré le nœud local, MetaMask garde l'ancien état | MetaMask, Paramètres, Avancé, "Effacer les données d'activité et de nonce" (Clear activity tab data), recharge |
| P12 | Une fenêtre MetaMask reste cachée derrière Chrome, "rien ne se passe" | fenêtre MetaMask non passée au premier plan sous Windows | regarde la barre des tâches ; la pastille du renard indique le nombre de demandes en attente ; rejette-les avant de rejouer |
| P13 | Hold up : la fenêtre ne s'ouvre pas au premier plan, l'écran s'affiche dans la page | Chrome a refusé la fenêtre séparée (repli prévu) | note-le : c'est une ligne `ui_fallback` dans le journal des options |
| P14 | Hold up répond "Je n'ai pas pu vérifier cette demande" pour tout | jeton absent de "Mon contexte" ou mauvais `chainId`/symbole | refais 5.3 (ou 8.6) : adresse exacte, `"symbol":"USDC"`, chaîne 31337 ou 11155111 |
| P15 | Après 30 s d'attente Hold up semble figé | le service worker de Chrome s'est arrêté | normal ; la fenêtre doit rester utilisable et reprendre (c'est un contrôle de `ESSAI_HUMAIN.md`, n°6). Si "Annuler" ne répond plus, note-le |
| P16 | Le site Glacier affiche "Service indisponible" | pas de `config.js` du site Glacier exécuté ou chaîne non déployée | 4.5, commande `config.js`, puis F5 |

---

## 11. Fin de session

- [ ] Options de Hold up : "Durées du produit", "Enregistrer".
- [ ] Lis le "Journal (local)" dans les options : chaque demande doit avoir une ligne `verdict` puis une ligne `decision`. Copie les lignes `ui_fallback` ou en erreur dans la fiche. Capture `99_journal_options.png`.
- [ ] Panneau latéral : capture `98_panneau_apres_essai.png` (compteurs "vérifiées" et "annulées", liste des dernières demandes).
- [ ] Arrête les fenêtres T1 à T5 (Ctrl+C). Les comptes et jetons locaux disparaissent avec le nœud.
- [ ] Remplis `RESULTATS_TEMPLATE.md` (copie-le d'abord en `RESULTATS_AAAA-MM-JJ.md`), joins le dossier `captures\`.
- [ ] Ne commit rien qui contienne une clé. Les captures ne doivent montrer ni phrase de récupération ni clé privée.

Limites à garder en tête en lisant les résultats : un seul navigateur, un seul MetaMask (noter sa version), un seul testeur, une chaîne locale que l'API d'alertes ne sert pas, et la scène coffre non jouée. Aucune conclusion sur la protection de personnes réelles.

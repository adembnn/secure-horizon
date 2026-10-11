# Essai réel de Hold up avec un vrai MetaMask sur Avalanche Fuji

Date de rédaction : 11 oct. 2026. Rédigé pour être joué **à la main, par une personne**, sans connaissance technique. Aucun agent n'a lancé Chrome pour ce protocole, et rien dans ce dossier n'a été exécuté avec un vrai MetaMask : tout ce qui est écrit sous « Attendu » est une **prévision tirée du code**, pas un résultat.

Pourquoi cet essai : jusqu'ici, Hold up n'a tourné qu'avec un **faux portefeuille** (voir `extension\COMPAT.md`, points 10 et 11 : « MetaMask enveloppe déjà `request` dans son propre Proxy et définit `window.ethereum` de façon particulière : non testé »). Adem l'a signalé comme faille majeure (`coord\INBOX.md`, MSG-053). Cet essai répond à une seule question : **quand un site demande quelque chose à MetaMask, Hold up retient-elle la demande AVANT que MetaMask ne s'ouvre, et la laisse-t-elle passer intacte si tu confirmes ?**

Nom du produit : le code et la fenêtre affichent encore « Sentinelle » (nom provisoire, décision « HOLD UP » du 11 oct. pour les nouveaux livrables). On écrit « Sentinelle » ici parce que c'est ce que tu verras à l'écran.

Fichiers de ce dossier :
- `ESSAI_REEL_METAMASK.md` : ce protocole.
- `ESSAI_REEL_RESULTATS.csv` : le tableau à remplir.
- `CE_QUI_PEUT_CASSER.md` : les risques propres à un vrai MetaMask et comment diagnostiquer.
- `page_essai\index.html` et `page_essai\serve.mjs` : la page web d'essai (boutons des scénarios) et son mini serveur.

---

## 1. Sécurité de l'essai (à lire avant tout)

1. **Aucun fonds réel. Jamais.** Le portefeuille de test est un compte **créé exprès** pour ce hackathon, par toi, dans un Chrome vierge. Il ne contient que des AVAX de test (sans valeur). Ne l'alimente jamais avec de l'argent réel et n'y importe jamais un portefeuille existant.
2. **Ne colle, ne tape et ne photographie jamais la phrase secrète (12 mots) ni une clé privée**, dans aucun fichier, message, formulaire, conversation avec une IA ou capture d'écran. MetaMask t'affiche les 12 mots à la création et te demande de les confirmer : note-les **sur papier**, garde le papier à côté de toi pendant l'essai, **déchire-le à la fin**. Ce protocole n'en a besoin à aucun moment.
3. La page d'essai ne demande **aucune clé**. Si une page te demande ta phrase secrète, c'est une arnaque : ferme-la.
4. Mot de passe MetaMask : un mot de passe **jetable**, que tu n'utilises nulle part ailleurs.
5. Adresses publiques (0x suivi de 40 caractères) : tu peux les copier, les coller, les noter dans le tableau. Ce sont les seules données de compte qui sortent de MetaMask.
6. **Vérifie le réseau avant chaque envoi.** La page d'essai affiche une barre « Réseau » : si elle est rouge (pas Fuji), elle refuse d'envoyer. MetaMask garde la même règle : le réseau doit s'appeler **Avalanche Fuji C-Chain** (chaîne 43113).
7. Les contrats de démo (en particulier **FreshDrainer**) sont des **faux logiciels malveillants pédagogiques**, à n'utiliser que sur Fuji. Ici, on ne leur fait **rien exécuter** : on teste seulement ce que Hold up montre quand le site demande une autorisation. Dans la grande majorité des scénarios pièges, tu finiras par **refuser dans MetaMask** : rien n'est donc donné.
8. `poison-address.js` (scénario 7) affiche la clé privée d'une adresse jetable. **Ne la copie pas, ne l'importe pas** dans MetaMask, ferme le terminal ensuite.
9. Pas de Chrome « de tous les jours » : tout se passe dans le profil de test. **À la fin, supprime ce profil** (section 7).
10. L'extension de test enregistre un journal **local**. Les captures d'écran peuvent montrer ton adresse de test : c'est sans risque, mais ne montre jamais l'écran de la phrase secrète.

---

## 2. Ce qui n'est PAS vérifié (honnêteté)

| Point | État au moment de la rédaction | Conséquence |
|---|---|---|
| Adresses des contrats de démo (DemoUSDC, DemoWAVAX, DemoNFT, DemoRouter, FreshDrainer) | `blockchain\DEPLOYMENTS.md` ne contient que l'en-tête du tableau : **aucune adresse**. Les contrats ne sont donc, d'après le dépôt, **pas encore déployés** (ou pas encore notés). | Les scénarios 2 à 6 sont **bloqués** tant qu'une personne ne déploie pas (section 3, étape 8). Ne prends jamais une adresse dans un message : prends-la dans `DEPLOYMENTS.md` ET vérifie-la sur Snowtrace. |
| Chaîne de déploiement | `blockchain\package.json` ne liste pas `@openzeppelin/contracts` (importé par tous les contrats), et `node_modules` est absent. `hardhat.config.js` lit `PRIVATE_KEY`, alors que MSG-051 parle de `FUJI_PRIVATE_KEY`. | Le déploiement peut échouer ou ne pas voir la clé. À régler par la personne qui déploie (Adem) : ce n'est pas l'affaire de l'essai. |
| `INSTALL_STANDALONE_FR.md` | **N'existe pas encore** dans le dépôt. `INSTALL_FR.md` (version avec serveur) existe. | Pour la version autonome, tu suis ce guide dès qu'il est publié ; en attendant, la section 3 donne la procédure générale « Charger l'extension non empaquetée ». |
| Comportement de la version actuelle face à un vrai MetaMask | **Jamais observé.** | Les « Attendu » sont des hypothèses. Un FAIL est une information précieuse, pas une honte. |
| Règle des adresses sosies (préfixe 3 + suffixe 4) | Annoncée comme « à implémenter » (réponse à MSG-053) ; la version essayée peut encore comparer sur 4+4 seulement. | Le scénario 7 peut légitimement ne rien détecter. Note la version de l'extension (fichier `manifest.json`, champ `version`). |
| Verdicts attendus (rouge/orange/information) | Le moteur du serveur n'a **aucun accès réseau** : il ne sait ni l'âge d'un contrat, ni s'il est connu. Un routeur légitime et un drainer neuf qui ont la même forme de demande peuvent recevoir le **même** verdict. | On note le verdict affiché, sans le juger « faux » d'emblée. Le critère PASS porte d'abord sur la **mécanique** (retenue, annulation, transmission fidèle). La qualité du verdict est notée à part. |
| Permit piégé (scénario 5) | MSG-054 : un permit EIP-2612 illimité sort en « attention » ou « information » dans 377 cas sur 377 sur le banc d'Adem. | Prévois que le scénario 5 donne un verdict trop doux. C'est un défaut de détection connu, pas un défaut de retenue. |
| Retenue longue (scénario 13c) | `COMPAT.md` point 13 et MSG-053 : le service worker MV3 peut s'arrêter vers 5 min ; le correctif (stockage + alarme) est « dans la file ». | Prévois LIMITE ou FAIL au bout d'environ 5 minutes. |
| Identifiant de l'extension MetaMask officielle | `nkbihfbeogaeaoehlefnkodbefgpgknn`, **de mémoire, non vérifié ici**. | Compare avec la page du Chrome Web Store ouverte depuis metamask.io. |
| Faucet | Le lien vient du mail officiel du hackathon (`context\avalanche_fuji_mail.md`) : https://build.avax.network/console/primary-network/faucet. Il demande un compte Builder Hub (inscription : lien du mail). | La création de ce compte est ton choix et ton action. Si le faucet ne suffit pas, le mail indique d'envoyer l'adresse 0x… (publique) à Yassir. |

---

## 3. Préparation (environ 45 minutes la première fois)

### Étape 1. Un Chrome vierge
1. Dans Chrome : clique sur l'icône de profil (en haut à droite) → **Ajouter un profil** → **Continuer sans compte**. Nomme-le « Essai Hold up ».
2. N'active **pas** la synchronisation, ne te connecte à aucun compte Google dans ce profil.
3. Ouvre `chrome://version` et **note la version de Chrome** (première ligne) pour le tableau.
4. Aucune autre extension dans ce profil (surtout pas un autre portefeuille : Rabby, Coinbase, Phantom… ils se disputent `window.ethereum`).

### Étape 2. Installer MetaMask (officiel)
1. Va sur **https://metamask.io/download/** (tape l'adresse toi-même) et clique sur le bouton Chrome : tu arrives sur le Chrome Web Store.
2. Vérifie que l'éditeur est bien MetaMask et que l'identifiant de l'extension dans l'adresse est `nkbihfbeogaeaoehlefnkodbefgpgknn` (voir section 2, non vérifié). Si une extension porte un nom proche mais un autre identifiant, **ne l'installe pas**.
3. **Ajouter à Chrome**, puis épingle l'icône (puzzle → punaise) pour la voir dans la barre.

### Étape 3. Créer un compte de TEST dédié
1. Ouvre MetaMask → **Créer un nouveau portefeuille** (pas « Importer »).
2. Refuse la collecte de données (« Non merci »).
3. Mot de passe jetable (section 1, règle 4).
4. Phrase secrète : sur **papier**, jamais ailleurs (règle 2). MetaMask te demandera de confirmer quelques mots.
5. Renomme le compte en **« TEST A »** (menu du compte → renommer). Crée un **second compte** : **« TEST B »** (menu des comptes → Ajouter un compte). B sert de destinataire « habituel » dans les scénarios 1 et 7.
6. Copie l'adresse de **A** et celle de **B** dans un fichier texte (adresses publiques seulement).
7. **Note la version de MetaMask** : ⋮ → Paramètres → **À propos**.

### Étape 4. Ajouter le réseau Avalanche Fuji (AVANT d'installer Hold up)
Fais-le maintenant, pour que l'ajout du réseau ne soit pas intercepté (il sera testé au scénario 8). MetaMask → réseaux → **Ajouter un réseau manuellement** :

| Champ | Valeur |
|---|---|
| Nom du réseau | Avalanche Fuji C-Chain |
| URL RPC | Celle de **https://chainlist.org/chain/43113** (comme demandé par le mail officiel). Le dépôt (`blockchain\hardhat.config.js`) utilise par défaut `https://api.avax-test.network/ext/bc/C/rpc` : compare les deux. |
| ID de chaîne | **43113** |
| Symbole | AVAX |
| Explorateur | https://testnet.snowtrace.io |

Sélectionne ce réseau. Si MetaMask signale une incohérence entre le réseau et l'URL RPC, **arrête-toi** et reprends l'URL depuis chainlist.org.

### Étape 5. Obtenir des AVAX de test
1. Ouvre le faucet officiel : https://build.avax.network/console/primary-network/faucet (compte Builder Hub si besoin, lien dans le mail).
2. Colle l'adresse **A** (publique) et demande des AVAX de test. Estimation : environ **0,1 AVAX** suffit pour tout l'essai (chaque transaction coûte une fraction de centime de AVAX de test ; estimation non mesurée).
3. Si le faucet refuse ou ne donne pas assez : envoie l'adresse A à Yassir, comme l'indique le mail (`context\avalanche_fuji_mail.md`).
4. Vérifie le solde dans MetaMask (réseau Fuji sélectionné).

### Étape 6. Lancer le serveur Hold up (version « serveur »)
Suis `INSTALL_FR.md` (dossier `T_banc_e2e`), étapes 1 et 2 : `node server\server.mjs` (ou `server\start.cmd`), puis **chrome://extensions → Mode développeur → Charger l'extension non empaquetée** → dossier `T_banc_e2e\dist\sentinelle-extension`. Garde la fenêtre du serveur ouverte. Vérifie `http://127.0.0.1:8787/health` (doit afficher `"status":"up"`).
- **Version autonome** (moteur dans l'extension, sans serveur) : suis `INSTALL_STANDALONE_FR.md` quand il existera. Le plan : faire les 14 scénarios avec la version serveur, puis rejouer 1, 4, 5, 7, 11, 12, 13a et 14 avec la version autonome (une seule des deux versions installée à la fois).
- Vérifie que l'accès aux sites est bien « **Sur tous les sites** » (chrome://extensions → Hold up → Détails → Accès au site).
- **Ne fais pas** le test de `INSTALL_FR.md` étape 3 avec le faux portefeuille : il ne marcherait pas, car MetaMask est là. Utilise notre page d'essai (étape 7).

### Étape 7. Lancer la page d'essai réelle
1. Dans un second terminal, depuis `T_banc_e2e\essai_reel\page_essai` : `node serve.mjs` (écoute uniquement sur ton ordinateur, port 8788).
2. Ouvre **http://127.0.0.1:8788/** dans le profil de test. Hold up voit cette page comme un site quelconque.
3. Remarque : Hold up envoie au serveur local les 4000 premiers caractères du texte visible de la page. Les titres de boutons contiennent donc des noms comme « FreshDrainer » : ce détail peut influencer un verdict. On le note si cela semble le cas.

### Étape 8. Les contrats de démo (bloquant pour les scénarios 2 à 6)
1. Ouvre `blockchain\DEPLOYMENTS.md`. S'il est encore vide : demande à Adem (qui a la clé de test du hackathon) de lancer le déploiement (`blockchain\scripts\demo\deploy-all.js`, voir son en-tête). **Tu ne manipules jamais cette clé.**
2. Recopie les 5 adresses dans la page d'essai (cartes « Adresses »). La page les mémorise dans ton navigateur.
3. Compare chaque adresse avec le lien Snowtrace de `DEPLOYMENTS.md` : le nom du contrat et le réseau (Fuji) doivent correspondre.
4. Clique sur **Vérifier les 5 adresses (lecture seule)** : chaque ligne doit dire « un contrat existe ». Une ligne « AUCUN CONTRAT » = mauvaise adresse ou mauvais réseau : **ne continue pas** avec cette adresse.
5. `deploy-all.js` alimente le routeur (100 000 DUSDC et 1000 DWAVAX). Si ce n'est pas fait, le scénario 2b échouera dans MetaMask (« risque d'échec ») : ce n'est pas la faute de Hold up.

### Étape 9. Dire à Hold up qui est ton « habituel » (contexte)
Sans contexte, toute adresse est « inconnue ». Pour les scénarios 1, 3 et 7, crée (version serveur) le fichier `server\context.local.json` à partir de `server\context.example.json`, avec **tes** adresses de test :

```
{
  "contacts": [ { "label": "Mon compte TEST B", "address": "0x(adresse de B)" } ],
  "history":  [ { "address": "0x(adresse de B)", "direction": "sortie", "amount": "0.1", "minutes_ago": 5 } ],
  "protected": [ "0x(adresse de A)" ],
  "knownSpenders": [ "0x(adresse du DemoRouter)" ]
}
```
Puis **relance le serveur** (il lit ce fichier au démarrage). `knownSpenders` contenant le routeur représente « un protocole que je connais déjà » ; FreshDrainer n'y figure pas. Sans cela, le moteur ne peut pas distinguer le routeur du drainer (voir section 2). Version autonome : même contenu dans la page d'options, zone « Mon contexte ».

### Étape 10. Le témoin sans Hold up (scénario 0, à faire une fois)
Il sert de référence de vitesse. Voir S0 plus bas.

---

## 4. Comment lire les preuves (valable pour tous les scénarios)

**Journal de la page** : chaque ligne porte l'heure et, entre crochets, les millisecondes écoulées depuis ton clic. Les lignes grises « perdu le focus » indiquent qu'une autre fenêtre est passée devant la page : c'est le signe que **la fenêtre MetaMask s'est ouverte**.

**Preuve de retenue (méthode R)** : la requête est « retenue » si, tant que la fenêtre Hold up est affichée, MetaMask n'a **rien reçu**. Concrètement, pendant que la fenêtre Hold up est à l'écran :
- R1. Aucune fenêtre MetaMask ne s'est ouverte (pas de petite fenêtre « Confirmation », pas de nouvel onglet MetaMask).
- R2. L'icône du renard dans la barre n'affiche **pas** de pastille de nombre (MetaMask y affiche le nombre de demandes en attente).
- R3. Le journal de la page n'a **aucune ligne « perdu le focus »** après ton clic, et pas de ligne « RÉSULTAT ». Le compteur orange « Demande en attente depuis N s » tourne.
- R4. La capture d'écran montre en même temps la fenêtre Hold up et l'absence de fenêtre MetaMask (prends **tout l'écran**, pas seulement l'onglet : touche Windows + Impr écran, ou outil Capture d'écran).
- R5. Après ta décision : si tu as confirmé, la fenêtre MetaMask s'ouvre **ensuite** (ligne « perdu le focus » **après** l'instant de ta décision) ; si tu as annulé, elle ne s'ouvre jamais.
- Le journal de l'extension (R6) confirme : page d'options de Hold up (chrome://extensions → Hold up → Détails → **Options de l'extension**), zone « Journal » : ligne `"type":"verdict"` (niveau, `latency_ms`) puis ligne `"type":"decision"` avec `"decision":"cancel"` ou `"confirm"` et **`time_to_decision_ms`**. Avant chaque scénario, clique **Vider le journal** pour ne lire que ce scénario.

**Les trois issues** :
- **PASS** : la mécanique est correcte (retenue prouvée par R1 à R5, annulation sans MetaMask, confirmation transmise **à l'identique**).
- **FAIL** : la requête a atteint MetaMask **avant** ta décision (FAIL critique), ou elle a été transmise différente, ou une confirmation n'a pas passé, ou l'écran Hold up est inutilisable.
- **LIMITE** : comportement sûr mais dégradé (par exemple demande refusée par prudence au bout de 5 minutes). À noter, pas à cacher.

**Ce que tu notes à chaque scénario** (dans `ESSAI_REEL_RESULTATS.csv`) : date, navigateur, versions Chrome et MetaMask, résultat, « retenue observée » (oui/non), latence ressentie (rapide / correcte / lente / bloquée, plus une estimation en secondes), nom du fichier de capture, remarques, **durée de décision en ms** (la valeur `time_to_decision_ms` du journal) et **niveau affiché** (danger / attention / non vérifié / pause). Nomme les captures `S04_1.png`, `S04_2.png`, etc.

**Si des questions s'affichent avant le verdict** (« Question 1 sur 3 », mini-interrogatoire) : réponds **honnêtement** à ta vraie situation (« c'est moi qui l'ai décidé », « je fais ça seul(e) »). Ces écrans font partie du test.

**Mini-règle de reprise** : un scénario raté ne se rejoue pas en boucle. Fais la capture, note le symptôme, ouvre `CE_QUI_PEUT_CASSER.md` (section « Où regarder »), puis passe au suivant.

---

## 5. Les scénarios

Chaque scénario utilise un bouton de la page d'essai. Avant chacun : **Vider le journal** (page d'options de Hold up) et **Effacer** (journal de la page). Rappel : Hold up ne laisse jamais passer sans fenêtre (il n'existe pas de niveau « tout est bon »).

### S0. Témoin : MetaMask seul (sans Hold up)
- **On fait** : dans `chrome://extensions`, désactive Hold up. Recharge la page d'essai. Connecte le portefeuille (bouton « Connecter »). Clique sur le bouton du scénario 1.
- **On doit voir** : la fenêtre MetaMask s'ouvre presque tout de suite ; le journal montre « perdu le focus » moins de 2 s après le clic. **Rejette** dans MetaMask.
- **Preuve** : sert de référence : combien de temps MetaMask met à s'ouvrir sans Hold up.
- **On note** : le délai « clic → perdu le focus » en ms (ligne `[+… ms]`). Capture de la fenêtre MetaMask.
- **PASS/FAIL** : PASS si MetaMask s'ouvre. Si MetaMask ne s'ouvre pas, ne continue pas : le problème vient de MetaMask ou du réseau, pas de Hold up.
- **En cas d'échec** : vérifier que MetaMask est déverrouillé, sur Fuji, et que le compte A est connecté au site. **Réactive Hold up** ensuite (et recharge la page) avant de passer à S1.

### S1. Envoi simple légitime
- **On fait** : MetaMask déverrouillé, sur Fuji, compte A. Sur la page : **Envoyer** (carte 1, 0,001 AVAX vers B). Si tu veux : fais d'abord le test avec « Passer par : window.ethereum », puis (S1b) avec « EIP-6963 ».
- **On doit voir** : la fenêtre **Hold up** (barre « Hold up » avec le nom du site `http://127.0.0.1:8788`), niveau « Un point à vérifier » ou information. Jamais de message « tout est bon ». Attendu (hypothèse) : niveau attention, B étant connu, éventuellement aucune alarme particulière. Clique **Oui, c'est bien ça, continuer** (ou le bouton de continuation affiché). Ensuite seulement, MetaMask s'ouvre : vérifie que le destinataire est bien B et le montant 0,001 AVAX. **Confirme** dans MetaMask.
- **Preuve de retenue** : méthode R, avec capture écran entier pendant la fenêtre Hold up. R5 : « perdu le focus » seulement **après** ta décision.
- **On note** : `time_to_decision_ms`, le délai « clic → fenêtre Hold up » ressenti, le délai « décision → fenêtre MetaMask » (ligne `[+ ms]`), le hash de la transaction (visible dans MetaMask > Activité) et son lien Snowtrace.
- **PASS** : retenue prouvée ; MetaMask reçoit **exactement** B et 0,001 AVAX ; la transaction passe (statut confirmé sur Snowtrace testnet). Répète **5 fois** avec rechargement de la page juste avant le clic (Ctrl+F5) : la retenue doit tenir **à chaque fois** (test de la course d'injection, voir `CE_QUI_PEUT_CASSER.md`). **FAIL critique** si, une seule fois sur 5, MetaMask s'ouvre sans fenêtre Hold up.
- **Si échec** : relève dans la console de la page les erreurs (F12), vérifie `http://127.0.0.1:8787/health`, note combien de fois sur 5 ça rate, et regarde si c'est juste après un rechargement.

### S2. Échange légitime via DemoRouter
- **Préparation (hors notation)** : bouton **Obtenir 100 DUSDC** (c'est une vraie transaction : passe-la en confirmant Hold up puis MetaMask).
- **On fait** : **2a** « Autoriser 10 DUSDC pour le routeur » (autorisation limitée à 10), confirme tout. Puis **2b** « Échanger 10 DUSDC » (appel du routeur : 10 DUSDC contre 0,1 DWAVAX au taux fixe 1 WAVAX = 100 USDC).
- **On doit voir** : une fenêtre Hold up pour 2a, une autre pour 2b. Attendu (hypothèse) : niveau attention ou information, pas rouge, car le montant est borné et le routeur figure dans `knownSpenders`. Un rouge ici serait une **fausse alerte** (à noter, c'est le point 1 de MSG-053).
- **Preuve** : méthode R pour chaque demande.
- **On note** : niveau affiché pour 2a et 2b, `time_to_decision_ms` ×2, hash des deux transactions.
- **PASS** : retenue prouvée deux fois ; transmission fidèle (MetaMask montre bien 10 DUSDC, et le routeur) ; la page journalise un RÉSULTAT. Qualité : pas de rouge sur ce cas légitime (sinon noter « fausse alerte »).
- **Si échec** : si MetaMask indique « cette transaction va probablement échouer » : routeur sans liquidité ou pas de DUSDC (voir étape 8). Hors Hold up.

### S3. Autorisation sans limite vers le routeur (légitime)
- **On fait** : carte 3, **Autoriser** (DUSDC, montant maximum, destinataire du droit : DemoRouter).
- **On doit voir** : une fenêtre Hold up. Attendu (hypothèse) : au moins « attention » car le droit est illimité ; la fenêtre peut aussi être rouge (la règle « droit illimité » ne dépend pas forcément de la réputation du contrat). Ce serait une **fausse alerte relative** : à noter, non bloquante.
- **Preuve** : méthode R. Puis **refuse** dans MetaMask (« Rejeter ») : inutile d'accorder le droit.
- **On note** : niveau, raisons affichées (texte), `time_to_decision_ms`.
- **PASS** : retenue prouvée ; ta confirmation Hold up fait bien apparaître MetaMask avec les bons paramètres (même destinataire du droit, même « illimité ») ; l'annulation ne l'ouvre pas.
- **Si échec** : comparer avec S4. Si S3 et S4 donnent des fenêtres identiques malgré `knownSpenders`, noter que le contexte n'est pas pris en compte (relire l'étape 9, relancer le serveur).

### S4. Autorisation sans limite vers FreshDrainer (piège)
- **On fait** : carte 4, **Autoriser**.
- **On doit voir** : fenêtre Hold up, attendu (hypothèse) **rouge** : « Stop. Ne signe pas. », avec « Annuler, rien ne sera envoyé » en bouton principal. Si le verdict est seulement « attention » ou « information », note-le : c'est une **faiblesse de détection** (le serveur ne voit pas que le contrat est neuf).
- **Preuve** : méthode R. Fais **d'abord** « Annuler » : la page doit dire « refusée code=4001 », MetaMask ne doit **pas** s'être ouvert (aucune ligne « perdu le focus », pas de pastille). Rejoue ensuite et choisis « Continuer malgré le danger » pour vérifier que MetaMask s'ouvre alors avec le bon destinataire du droit ; **Rejette** dans MetaMask.
- **On note** : niveau, raisons, `time_to_decision_ms` pour les deux essais.
- **PASS** : annulation → MetaMask jamais ouvert ; poursuite → MetaMask ouvert avec FreshDrainer comme bénéficiaire. **FAIL critique** si MetaMask s'ouvre alors que tu as annulé, ou avant ta décision.
- **Si échec** : si le verdict reste faible, ne conclus pas à un bug de retenue ; c'est une question de moteur. Note-le dans les remarques.

### S5. Signature d'autorisation (permit EIP-2612, sans frais)
- **On fait** : carte 5, **Signer**. La page lit (lecture seule) ton compteur, construit une signature « Permit » sur DemoUSDC au profit de FreshDrainer, montant maximal, valable 7 jours, et la demande à MetaMask (`eth_signTypedData_v4`). La signature n'est **jamais** envoyée sur la chaîne par la page.
- **On doit voir** : fenêtre Hold up. Attendu (hypothèse, voir section 2) : verdict trop doux (attention/information) d'après MSG-054. C'est le **scénario héros** de la démo : si c'est faible, note-le en premier.
- **Preuve** : méthode R. Cette fois la fenêtre MetaMask est une demande de signature (pas de frais, pas de transaction).
- **On note** : niveau, `time_to_decision_ms`, et si MetaMask a aussi affiché sa propre alerte.
- **PASS** : retenue prouvée ; annulation → 4001 sans MetaMask ; poursuite → MetaMask affiche le message à signer avec les mêmes valeurs (spender = FreshDrainer, valeur maximale). **Rejette** dans MetaMask : ne signe pas.
- **Si échec** : si MetaMask n'affiche pas du tout de demande de signature : voir la console de la page (erreur de format).

### S6. Autorisation de tous les objets (NFT) vers FreshDrainer
- **Préparation (facultative)** : **Obtenir 1 objet DNFT**.
- **On fait** : carte 6, **Autoriser** (`setApprovalForAll` sur DemoNFT).
- **On doit voir** : fenêtre Hold up, attendu (hypothèse) rouge, avec une fiche du type « Un site peut déplacer tous tes NFT d'une collection » (fiche F03 de `U_textes_utilisateur.md`). MetaMask affichera, lui, sa propre alerte après la tienne.
- **Preuve** : méthode R. Refuse finalement dans MetaMask.
- **On note** : niveau, texte de la fiche, `time_to_decision_ms`, et si MetaMask a doublé l'avertissement.
- **PASS** : retenue prouvée ; annulation propre ; poursuite → MetaMask avec les bons paramètres.
- **Si échec** : même démarche que S4.

### S7. Adresse sosie
- **Préparer le sosie** (une fois, avant la séance) :
  - **Voie A (script existant)** : dans `blockchain`, après `npm install` (à faire par toi ou Adem, pas par un agent), `node scripts\demo\poison-address.js 0x(adresse de B) 3`. Le script affiche une adresse « Lookalike » et sa clé privée : **ignore la clé** (règle 8). Attention : les commentaires du script donnent des durées trop optimistes. Un préfixe + suffixe de 3+3 caractères représente environ 16,7 millions d'essais (16⁶) ; 4+4 en représente environ 4,3 milliards (16⁸), donc probablement des heures à des jours sur un ordinateur de bureau (estimation, non mesurée). Lance 3+3 en tâche de fond **la veille**, ou prends 2+2 (quelques secondes) juste pour voir le script fonctionner.
  - **Voie B (30 secondes, sans clé)** : prends l'adresse de B, garde ses **4 premiers et 4 derniers caractères hexadécimaux** après `0x`, change ceux du milieu (reste à 40 caractères). Personne ne possède cette adresse : tu ne l'envoies jamais réellement (tu refuses dans MetaMask).
- Colle le sosie dans le champ « Adresse presque identique à celle du 2e compte ».
- **On fait** : carte 7, **Envoyer**.
- **On doit voir** : fenêtre Hold up avec les deux adresses côte à côte, les caractères différents surlignés, et la phrase « Le début et la fin sont identiques pour te tromper » (rouge attendu **si** la règle de sosie est branchée, voir section 2). Sinon : verdict faible, à noter comme **« sosie non détecté »**, c'est aussi un résultat d'essai.
- **Preuve** : méthode R. **Annule**. Puis, pour vérifier le passage : rejoue, choisis de continuer, vérifie dans MetaMask que le destinataire est bien le **sosie** (et pas B), **Rejette**.
- **On note** : niveau, adresse attendue contre adresse demandée affichées, `time_to_decision_ms`.
- **PASS** : retenue prouvée ; MetaMask montre l'adresse sosie exacte quand tu continues. Qualité : détection du sosie (sinon : « non détecté »).
- **Si échec** : vérifie `server\context.local.json` (B dans `history` et `contacts`, serveur relancé) ; le sosie doit partager le début et la fin avec B ; un sosie sans historique de B ne peut pas être détecté.

### S8. Changement de réseau
- **On fait** : carte 8. **8a** « Passer sur Ethereum » ; **8b** « Ajouter un réseau » (réseau factice, adresse RPC inexistante) ; **8c** « Revenir sur Fuji ».
- **On doit voir** : une fenêtre Hold up à chaque fois (`wallet_switchEthereumChain` et `wallet_addEthereumChain` sont retenues). Après 8a et confirmation des deux écrans, la barre de la page devient rouge « PAS Fuji » (et la ligne grise `chainChanged` apparaît dans le journal : preuve que les événements de MetaMask traversent toujours Hold up). **8b** : **refuse** dans MetaMask même si tu as continué dans Hold up (réseau factice). **8c** : repasse sur Fuji (obligatoire pour la suite).
- **Preuve** : méthode R pour chaque demande (MetaMask « Autoriser ce site à changer de réseau ? » ne doit apparaître qu'après ta décision).
- **On note** : niveau pour 8a, 8b, 8c ; `time_to_decision_ms` ; présence de `chainChanged`.
- **PASS** : retenue prouvée ×3 ; les événements `chainChanged` arrivent ; la page redevient verte après 8c.
- **Si échec** : si le changement est refusé avec 4900 : recharger la page (extension rechargée). Si `chainChanged` n'arrive pas : noter, cas grave (Hold up ne devrait pas toucher aux événements).

### S9. Connexion par signature (SIWE)
- **On fait** : carte 9, **Se connecter**. La page envoie un message au format « Sign-In with Ethereum » (adresse du site, ton adresse, valable quelques instants).
- **On doit voir** : fenêtre Hold up (`personal_sign` est retenue). Attendu (hypothèse) : information ou attention, pas rouge (le site affiché est bien celui du message). Puis MetaMask affiche une demande de connexion avec le texte lisible.
- **Preuve** : méthode R. Tu peux **signer** : c'est gratuit, et la signature ne donne aucun droit sur tes fonds.
- **On note** : niveau, `time_to_decision_ms`, et si MetaMask reconnaît le format (titre « Demande de connexion »).
- **PASS** : retenue prouvée ; le texte vu dans MetaMask est identique à celui de la page.
- **Si échec** : si MetaMask montre un texte illisible (hexadécimal), c'est la forme de la demande qui a changé : note-le, cas important.

### S10. La vérification dépasse le délai ou l'API est absente
Version serveur seulement. Version autonome : **non applicable** (aucun serveur, aucun réseau).
- **10a, serveur arrêté** : dans la fenêtre du serveur, `Ctrl+C`. Clique **Envoyer** (carte 1). **Attendu** : fenêtre grise « Non vérifié », « Ce n'est pas une confirmation », avec « (API indisponible) », trois boutons : **Réessayer la vérification**, **Continuer sans vérification, à mes risques**, **Annuler**. MetaMask ne s'ouvre pas. Clique **Réessayer** serveur toujours arrêté : l'écran revient (jusqu'à 4 essais, puis la demande est refusée, d'après le code). Puis **relance le serveur** et clique **Réessayer** : un vrai verdict doit apparaître.
- **10b, serveur qui ne répond jamais** : ferme le vrai serveur ; dans un terminal, lance un faux serveur muet : `node -e "require('http').createServer(()=>{}).listen(8787,'127.0.0.1')"`. Clique **Envoyer**. **Attendu** : la fenêtre grise apparaît **environ 3 secondes** après le clic, avec « (délai dépassé (3000 ms)) ». Chronomètre sur ton téléphone ou regarde l'heure du clic dans le journal de la page et la valeur `latency_ms` (proche de 3000) dans la page d'options de Hold up. Arrête le faux serveur (`Ctrl+C`) et relance le vrai.
- **Preuve** : méthode R (la requête est retenue tout le temps de l'attente et de l'écran « Non vérifié »).
- **On note** : le temps d'apparition de la fenêtre (10a : immédiat attendu ; 10b : ≈ 3 s), `latency_ms`, le texte exact de la raison.
- **PASS** : jamais d'écran vert ; jamais de transmission sans geste explicite ; « Annuler » = pas de MetaMask ; « Continuer sans vérification » → MetaMask s'ouvre. **FAIL critique** si la demande est transmise à MetaMask sans fenêtre quand l'API est coupée.
- **Si échec** : si rien ne s'affiche pendant plus de 5 s sans erreur, ouvre la console de la page et celle du service worker (section « Où regarder » de `CE_QUI_PEUT_CASSER.md`).

### S11. Refus par l'utilisateur
- **11a, refus dans Hold up** : lance S4 (ou S1). Clique **Annuler, rien ne sera envoyé**. **Attendu** : la page affiche « refusée code=4001 », MetaMask n'a **jamais** été ouvert, aucune pastille. Variante : appuie sur la touche **Échap** au lieu du bouton (même effet attendu). Rejoue la demande ensuite : elle doit repartir normalement (rien de bloqué).
- **11b, refus dans MetaMask** : lance S1, **Continue** dans Hold up, puis **Rejeter** dans MetaMask. **Attendu** : la page affiche code=4001 aussi. Le journal de Hold up contient « confirm » (c'est MetaMask qui a refusé).
- **Preuve** : 11a : R1 à R4 (absence de MetaMask) ; 11b : « perdu le focus » après ta décision. Dans les deux cas le code est 4001 : **distingue-les par la présence ou l'absence de fenêtre MetaMask**, pas par le message.
- **On note** : `time_to_decision_ms`, issue 11a vs 11b.
- **PASS** : 11a sans MetaMask ; 11b avec MetaMask ; demande suivante normale.
- **Si échec** : écran Hold up qui reste collé après Annuler → capture + console de la page.

### S12. Passage outre après friction
- **Réglage** : page d'options de Hold up → remplace la zone par `{"arm":"B","frictionMs":30000}` → **Enregistrer** (bras B : 30 secondes d'attente sur les alertes rouges). Option : refais le scénario avec `{"arm":"C"}` (recopier une phrase).
- **On fait** : lance S4 (ou S5 / S6 si S4 n'est pas rouge : la friction ne s'applique **qu'aux alertes rouges**). Si l'alerte n'est pas rouge, note « pas de friction car verdict trop faible » et prends un autre scénario.
- **On doit voir** : le bouton « Continuer malgré le danger » **grisé**, avec un compte à rebours de 30 s. Essaie de cliquer **avant** la fin : rien ne doit se passer. Attends la fin, clique : MetaMask s'ouvre alors seulement. Vérifie le bénéficiaire du droit dans MetaMask, puis **Rejette**.
- **Preuve** : méthode R pendant les 30 s : MetaMask ne s'ouvre pas, même si tu cliques sur le bouton grisé.
- **On note** : `time_to_decision_ms` (≥ 30000 attendu), `continue_enabled_after_ms` et `early_click_blocked` (dans le journal de la page d'options).
- **PASS** : clic anticipé sans effet ; clic après le délai → transmission fidèle ; `time_to_decision_ms` ≥ le délai.
- **Si échec** : si le bouton est actif trop tôt, ou si MetaMask s'ouvre avant la fin : **FAIL critique**. À la fin, **remets** `{"arm":"A","frictionMs":30000}`.

### S13. Fermeture ou arrêt pendant une retenue
Trois variantes. Le service worker MV3 de Chrome peut s'arrêter, et les limites sont documentées dans `COMPAT.md`, points 13 et 14.
- **13a, fermeture du navigateur** : lance S5 (ou S4) et **laisse la fenêtre Hold up affichée**. Ferme **toutes** les fenêtres Chrome (pas seulement l'onglet). Attends 10 s. Rouvre Chrome (même profil « Essai Hold up »). Si la page est restaurée, regarde-la ; sinon rouvre http://127.0.0.1:8788/. **Attendu** : aucune fenêtre MetaMask ne s'est ouverte toute seule ; l'icône du renard n'a pas de pastille ; MetaMask → Activité n'a rien de nouveau ; la page n'affiche aucun RÉSULTAT d'avant ; une nouvelle demande repart normalement. **PASS** si rien n'a été transmis et si le fonctionnement reprend ; **FAIL critique** si une confirmation en attente est apparue dans MetaMask sans ton accord.
- **13b, arrêt du service worker** (DevTools de l'extension **fermés**, sinon il ne s'arrête pas) : lance S4 et laisse la fenêtre Hold up affichée. Dans un nouvel onglet : `chrome://serviceworker-internals/`, trouve la ligne de l'extension Hold up (adresse `chrome-extension://…`) et clique **Stop**. Reviens à la page. **Attendu (hypothèse à vérifier)** : la demande échoue avec code 4900 (« extension-indisponible ») et MetaMask ne s'ouvre jamais ; la fenêtre Hold up peut rester affichée sans effet (« fenêtre fantôme »). Si tu cliques « Continuer », MetaMask ne doit **pas** s'ouvrir. **PASS** : MetaMask jamais ouvert. **LIMITE** : fenêtre fantôme ou 4900 sans explication.
- **13c, retenue de plus de 5 minutes** : réglage `{"arm":"B","frictionMs":420000}`. Lance S5. Ne touche à rien pendant 7 minutes (minuteur de ton téléphone ; DevTools fermés). Note l'heure où quelque chose change : la page affiche-t-elle 4900 à ≈ 5 min ? Au bout des 7 minutes, le compte à rebours se termine-t-il et « Continuer » fonctionne-t-il ? **Attendu (hypothèse, point 13 de `COMPAT.md`)** : échec en 4900 vers 5 minutes (mode fermé). **LIMITE** si fermé en sécurité ; **FAIL** si MetaMask s'est ouvert sans ton accord. Remets ensuite `{"arm":"A","frictionMs":30000}`.
- **Preuve** : méthode R + pastille du renard + MetaMask → Activité.
- **On note** : pour 13c, la durée exacte avant l'échec (en secondes), le code reçu par la page.
- **Si échec** : capture, note de l'heure, journal de la page, `chrome://extensions` → Erreurs de Hold up.

### S14. Plusieurs onglets en même temps
- **On fait** : ouvre la page d'essai dans **trois onglets** (A, B, C), connecte-la dans chacun. Dans l'onglet A, lance S1 (la fenêtre Hold up reste affichée). Passe à l'onglet B, lance S4. Passe à C, lance S5. Reviens sur A, B, C dans l'ordre inverse.
- **Décisions** : A **Annuler** ; B **Continuer** (après la friction si elle est active) puis **Rejeter** dans MetaMask ; C **Annuler**. Ensuite une variante : **double-clic rapide** sur le bouton S1 dans un seul onglet (deux demandes presque en même temps).
- **On doit voir** : chaque onglet a sa propre fenêtre Hold up, indépendante ; MetaMask ne s'ouvre **que** pour B, avec les paramètres de B (FreshDrainer), pas ceux de A ou C ; chaque page journalise son propre résultat. Pour le double-clic : note si deux fenêtres apparaissent, l'une sur l'autre, et si une seule des deux demandes aboutit.
- **Preuve** : méthode R par onglet. Capture écran entier avec la fenêtre MetaMask de B.
- **On note** : comportement des onglets en arrière-plan (la fenêtre est-elle toujours là au retour ?), nombre de fenêtres dans le cas du double-clic.
- **PASS** : aucune confusion entre onglets ; aucune demande transmise sans décision.
- **Si échec** : une décision d'un onglet qui s'applique à l'autre = **FAIL critique**. Capture et journal des trois pages.

---

## 6. Après la séance

1. Remplis `ESSAI_REEL_RESULTATS.csv` (se remplit dans Excel ou Notepad ; séparateur « ; »).
2. Dans MetaMask, rejette toute demande restée en attente.
3. Remets les réglages : `{"arm":"A","frictionMs":30000}`.
4. Envoie à l'équipe : le CSV, les captures, et l'**export du journal de la page** (bouton « Copier le journal ») pour chaque scénario en échec. Les remarques doivent distinguer **défaut de retenue** (grave), **verdict trop doux ou trop dur** (moteur) et **problème de MetaMask ou du réseau**.

## 7. Nettoyage (obligatoire)

1. Arrête les deux terminaux (`Ctrl+C`) : serveur Hold up (8787) et page d'essai (8788). Supprime `server\context.local.json` si tu veux effacer tes adresses de test.
2. Dans `chrome://extensions`, supprime Hold up (ou garde-la : ce n'est pas un secret).
3. **Supprime le profil de test** : icône de profil Chrome → roue dentée (gérer les profils) → les trois points du profil « Essai Hold up » → **Supprimer**. Cela efface MetaMask, le compte A, le compte B et la phrase enregistrée.
4. **Déchire le papier** avec la phrase secrète.
5. Efface les captures qui montrent le solde si tu ne veux pas les partager (adresses publiques sans importance).
6. Ne réutilise pas ce compte pour autre chose, même sur testnet.

---

## 8. Résumé de ce qui est testé par scénario

| N° | Méthode | Ce qu'on vérifie surtout |
|---|---|---|
| S0 | eth_sendTransaction | Délai d'ouverture de MetaMask sans Hold up (référence) |
| S1 | eth_sendTransaction | Retenue, transmission fidèle, course d'injection (×5), EIP-6963 |
| S2 | eth_sendTransaction ×2 | Légitime : approve borné + échange, fausse alerte |
| S3 | eth_sendTransaction | Droit illimité vers un protocole connu |
| S4 | eth_sendTransaction | Droit illimité vers un drainer neuf, annulation, poursuite |
| S5 | eth_signTypedData_v4 | Permit piégé (scénario héros) |
| S6 | eth_sendTransaction | setApprovalForAll vers un drainer |
| S7 | eth_sendTransaction | Adresse sosie (début et fin identiques) |
| S8 | wallet_switch/addEthereumChain | Changement de réseau, événements `chainChanged` |
| S9 | personal_sign | Connexion SIWE |
| S10 | (API) | Délai de 3 s, API absente, jamais de vert |
| S11 | — | Refus (Hold up puis MetaMask), code 4001 |
| S12 | — | Friction de 30 s, clic anticipé refusé |
| S13 | — | Navigateur fermé, service worker arrêté, retenue > 5 min |
| S14 | — | 3 onglets, double-clic |

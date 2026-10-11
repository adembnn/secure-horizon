# Hold up

Tout service peut être compromis. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre. Hold up est une couche indépendante, pensée pour se poser devant le portefeuille que la personne utilise déjà. Elle a deux étages. Un : la personne écrit ce qu'elle veut faire, avant de voir la demande, et du code compare avec ce que la demande fait vraiment. Deux : un plancher de règles qui ne dépend pas de la phrase. Si la demande correspond, elle part vers le portefeuille après une seconde. Sinon, une alerte d'une ligne, et Annuler reste visible. Hold up ne remplace pas le portefeuille, ne tient aucune clé et ne signe rien.

Promesse : cesser de donner plus que nécessaire, car on s'expose en le faisant. On ne sait pas quel site sera piraté ; on décide de ce qu'on lui laisse.

Hackathon Secure Horizons, 10-11 octobre 2026. Track 1, Fintech Security. Hackathon blue team : le projet détecte et répond, il n'attaque rien. Équipe : Adem et Titouan. Des noms techniques (variables d'environnement, fichiers de recherche) portent encore un ancien nom de code : c'est le même projet.

## Le problème

Un particulier qui signe dans son portefeuille voit des octets, pas des conséquences. Exemple : il veut échanger 50 USDC, le site lui demande un droit de dépense illimité présenté comme une étape normale. D'après le code public de MetaMask, lu le 11 oct. 2026, le montant illimité est affiché (« Unlimited ») sans alerte propre à ce montant, et rien ne le rapproche de ce que la personne voulait donner. Cela vaut pour une adresse que MetaMask ne liste pas comme malveillante, et c'est une lecture de code, pas un essai à l'écran.

Les chiffres sur le problème sont tous dans [livrables/CHIFFRES.md](livrables/CHIFFRES.md), avec leur source et leur date. Ce n'est pas la majorité des droits qui sont illimités, et nous ne disons pas que ça empire : la parade, ne laisser que ce qu'il faut (le moindre privilège), est connue.

## Ce que fait le prototype

1. **Demander.** Avant de montrer la demande, une fenêtre d'extension pose une question : « Que veux-tu faire sur ce site ? ». Champ de texte libre, aucun bouton, aucun pré-remplissage. Seules les demandes qui déplacent de la valeur ou accordent un droit ouvrent la fenêtre.
2. **Lire.** Le montant, le jeton et l'adresse écrits sont extraits par du code. Le type d'action est classé par le modèle Clef, à travers un relais local (décision D-015). Si le relais est arrêté, lent ou sans clé, des mots-clés prennent le relais et l'écran le dit. Phrase trop vague : « Je n'ai pas pu vérifier cette demande ».
3. **Décoder l'effet.** Calldata, données typées (Permit, Permit2), droits accordés, fonds sortants.
4. **Comparer.** Trois réponses : « Ça correspond à ce que tu as écrit. », « Ça ne correspond pas à ce que tu as écrit. », « Je n'ai pas pu vérifier cette demande. » Un montant écrit contre un droit plus large ne correspond pas, même sur un site connu.
5. **Plancher de règles.** Indépendamment de la phrase : droit illimité vers une adresse inconnue, appel délégué, changement de contrôle du compte, signature illisible.
6. **Répondre.** Niveaux : information, attention, danger, manipulation. Quand la demande correspond, l'écran dit « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. » Pour une transaction, la ligne dit comment ramener le droit au montant écrit, ou Hold up le remplace lui-même sous conditions. Pour une signature, elle dit que le droit ne peut pas être limité. Après l'alerte, la démo web (`research/titouan/T_banc_e2e/webdemo/`) montre la révocation en un clic, la fiche d'incident et le rejeu du journal, avec un portefeuille simulé ; ce n'est pas encore dans l'extension.
7. **Tracer.** Chaque décision écrit une ligne datée, sans la phrase écrite ni adresse. Le journal garde 500 lignes en local, chaînées par hachage : une ligne changée ou retirée au milieu se voit. Sans ancrage externe, une réécriture complète ne se voit pas. L'ancrage de la racine sur Avalanche Fuji est codé, pas déployé (voir Limites).

Démo du pitch V7 (`livrables/PITCH_5MIN.md`, gestes et états prouvés dans `livrables/pitch_v7/DEMO_DEROULE.md`) : deux fenêtres, le même site Neve, l'un piraté. Sans Hold up, un droit illimité vide le compte de test (100 vers 0, lu sur la chaîne par script). Avec Hold up, la même phrase « échanger 50 USDC contre AVAX » donne « Ça ne correspond pas » et le droit est ramené à 50. Autres scènes : `pitch/DEMO_SCENES.md`.

## Essayer en 3 commandes

Il faut Node 22.18 ou plus, et Chrome ou Edge 114 ou plus. Aucun vrai fonds, aucun compte à créer.

```
git clone <url-du-depot> hold-up
cd hold-up
node scripts/verifier_installation.mjs
node scripts/demo.mjs
```

1. `node scripts/verifier_installation.mjs` contrôle les versions, les fichiers nécessaires, les ports, et lance les tests rapides. Les chiffres sont ceux de la commande, à l'instant où tu la lances.
2. `node scripts/demo.mjs` (ou `npm run demo`) lance, dans l'ordre : la chaîne locale (port 8545), les contrats de démo, la copie de leurs adresses vers le site Neve, le site Neve (8793), le relais du classifieur (8789), la console d'attaque simulée (8792) et le site « Glacier Rewards » (8791). Ce qui tourne déjà n'est ni relancé ni arrêté. Ctrl+C arrête seulement ce que le script a lancé. À la fin, il affiche les adresses à ouvrir et le dossier de l'extension.
3. Charge l'extension : `chrome://extensions`, Mode développeur, Charger l'extension non empaquetée, dossier `research/titouan/T_banc_e2e/extension_standalone/extension`.

Puis ouvre `http://localhost:8793/?mode=honnete` (parcours honnête) ou `http://localhost:8793/?mode=piege` (piège). Pas à pas complet, portefeuille de test et dépannage : [livrables/INSTALLATION.md](livrables/INSTALLATION.md).

**Le modèle et le relais.** Le build livré classe la phrase avec le modèle Clef (Cloudflare Workers AI), à travers un relais local qui détient seul les clés. Les clés vivent dans un fichier `.env` à la racine (ignoré par git ; modèle : `.env.example`, variables `CF_ACCOUNT_ID` et `CF_API_TOKEN`). `node scripts/demo.mjs` lance le relais avec ce fichier s'il existe. Sans fichier ou sans clé, le script le dit : la phrase est alors classée sans modèle, par mots-clés, et l'écran de l'extension l'affiche aussi. Le relais à la main : `node --env-file=.env research/demo_reelle/classifieur/relay.mjs`.

**Variante sans relais ni modèle (option).** Un second build, `extension_sans_reseau`, n'a pas le droit d'appeler le relais : la phrase reste dans le navigateur et est lue par mots-clés. Il se construit avec `node research/titouan/T_banc_e2e/extension_standalone/build_standalone.mjs --no-network`.

**Ce qui sort de la machine.** La phrase écrite part du navigateur vers le relais local (une seule permission d'hôte : `http://127.0.0.1:8789/*`). Si le relais a une clé, il l'envoie au modèle hébergé. Ni l'adresse du compte ni la demande ne sont envoyées. Minimisation et durée de conservation chez le fournisseur ne sont pas rédigées. Pour réécrire un droit, l'extension interroge le nœud du portefeuille, comme le ferait la page. La chaîne locale, quand elle est lancée en mode copie d'Avalanche (`--fork`), lit le RPC public en lecture seule.

**À ne pas oublier.** Jamais essayé avec un vrai portefeuille. Une revue de sécurité interne ([research/titouan/T_banc_e2e/security_review2/REVUE.md](research/titouan/T_banc_e2e/security_review2/REVUE.md)) a trouvé des contournements possibles, dont un critique ; les corrections ne sont pas toutes vérifiées dans un navigateur. Ne pas utiliser avec de vrais fonds.

| Service de la démo locale | Port | Rôle |
|---|---|---|
| Nœud local Hardhat | 8545 | chaîne de répétition (`--fork` : copie locale d'Avalanche) |
| Site d'échange Neve | 8793 | scène héros : `?mode=honnete`, `?mode=piege`, `?mode=piege&via=permit` |
| Relais du classifieur | 8789 | reçoit la phrase écrite, appelle le modèle |
| Site « Glacier Rewards » | 8791 | scène « me connecter » |
| Console d'attaque simulée | 8792 | prouve ce qui part sur la chaîne locale |
| Serveur de vérification, RPC de garde, labo | 8787, 8555, 8800, 8801 | ancienne version, lancés seulement avec `node scripts/demo.mjs --ancien` |

## Tests

| Commande | Ce qu'elle vérifie |
|---|---|
| `node scripts/verifier_installation.mjs` | tout ce qui suit, sauf les contrats, avec les chiffres réels |
| `npm run test:engine` | moteur d'effets (recrée d'abord les fichiers de données générés qui manquent) |
| `npm run test:server` | serveur de vérification, journal chaîné |
| `npm run test:extension` | extension avec serveur : moteur de retenue, Chrome factice |
| `npm run test:rpc` | RPC de garde |
| `node --test research/demo_reelle/classifieur/relay.test.mjs` | relais du classifieur, modèle simulé |
| `node research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs` | contrôle statique du build livré (permissions, un seul `fetch`, pas de secret) |
| `node --no-warnings research/titouan/T_banc_e2e/extension_standalone/tests/run_tests.mjs` | suite du build autonome |
| `npm run test:contracts` (ou `node scripts/verifier_installation.mjs --complet`) | contrats de démo (Hardhat, environ 2 minutes) |

Aucun nombre n'est recopié ici : ils changent à chaque version, lance la commande. Ces tests valident le code, ils ne mesurent pas la détection. Les tests de la revue de sécurité (`research/titouan/T_banc_e2e/security_review2/tests/`, `node <fichier>`) sortent en code 1 tant que leur faille est ouverte. Le 11 oct. 2026 : r01, r02, r03 et r05 passent ; r04 échoue encore (dans le moteur du build livré, un `transfer` qui joint 1 ETH reste « attention »). r04 accepte aussi « pas pu vérifier » comme correctif : un passage ne voudra pas dire que l'ETH joint est vu. r01 et r03 tournent en Node, pas dans un vrai Chrome. Détail : `security_review2/REVUE.md`.

Fichiers ignorés par git mais lus par des tests (un clone neuf ne les a pas) :
- `research/titouan/T_banc_e2e/redteam/V2_DEV_norm.jsonl` (21 Mo), lu par `engine/test/monotonie.test.mjs`, `pipeline/test/evaluate_plus.test.mjs`, `pipeline/test/monotone_pipeline.test.mjs` et `run/mesure_monotonie.mjs`. Sans lui, ces tests plantent. Pour le créer : `node scripts/verifier_installation.mjs --donnees` depuis la racine (aussi lancé par `npm run test:engine`), ou à la main depuis `research/titouan/T_banc_e2e` : `node redteam/normalize_v2.mjs blind_adem/v2/V2_DEV.jsonl redteam/V2_DEV_norm.jsonl`.
- `research/titouan/T_banc_e2e/attacks_public/PUBLIC.jsonl` : recréé par la même commande `--donnees`, avec sa graine fixe.
- `research/titouan/bench/data/cchain_sample.jsonl` : échantillon de trafic réel de la C-Chain, recréable seulement avec Internet (`bench/sample_cchain.mjs`). Sans lui, un test du moteur échoue. Cela n'a aucun effet sur la démo.

## Chiffres

Un seul tableau fait foi : [livrables/CHIFFRES.md](livrables/CHIFFRES.md), avec les colonnes synthétique, contrôle scellé et données réelles, la source et la date de chaque ligne. Il donne le rappel, les fausses alertes, le trafic réel et les limites de chaque mesure. Deux avertissements qui valent pour tout le dépôt :

- La preuve citée en premier est le jeu aveugle (ligne A6) : 250 cas écrits sans lire nos règles, ouverts une seule fois, moteur figé. 87,3 % des arnaques signalées (64,7 % sans la phrase), mais 15,0 % de faux rouges, au-dessus du seuil de 10 % publié avant. L'auteur est une IA de la même famille que celle qui nous a aidés : pas un test humain.
- Les fausses alertes restent la limite principale de l'approche (fatigue d'alerte).
- Un test qui passe n'est pas une mesure de détection. Seul CHIFFRES.md mesure, et seulement sur les jeux qu'il nomme.

## Limites connues

- **Jamais essayé avec un vrai portefeuille.** Aucun résultat dans `research/titouan/T_banc_e2e/essai_reel/ESSAI_REEL_RESULTATS.csv`. La démo tourne sur une chaîne locale, que l'API d'alertes de MetaMask ne sert pas (Fuji non plus) : son silence là ne prouve rien.
- **Revue de sécurité.** Contournements trouvés, dont un critique (une page qui remplace des fonctions natives). Corrections non toutes vérifiées dans un navigateur. Nous ne disons pas « sécurisé ».
- **Rien n'est déployé sur Fuji.** Le déploiement est préparé et répété sur une copie locale, mais il n'est pas exécuté (D-016) : `blockchain/DEPLOYMENTS.md` ne contient que son en-tête : tant qu'il est vide, la démo se joue sur la chaîne locale. Sans ancrage, le journal détecte une ligne modifiée ou retirée au milieu, pas une réécriture complète.
- **Hors périmètre.** Fraude consentie (la personne veut vraiment faire ce paiement), intention vague, contrat qui change à l'exécution (MetaMask le traite mieux avec Added Protection), Ledger branché directement, mobile, envois lancés depuis le bouton Envoyer du portefeuille.
- **Une signature ne se limite pas.** Un droit donné par Permit n'a pas de plafond modifiable : Hold up alerte et le dit. Pas de révocation en un clic non plus.
- **Révocation hors extension.** Le bouton « Révoquer ce droit » existe dans la démo web (portefeuille simulé), pas encore dans l'extension.
- **Couverture partielle.** Sur 58 paires d'essai, 18 sont contrôlées : pas encore le sens d'un échange, la contrepartie, la durée d'un droit, ni à qui il est donné. Dans la démo, le droit ramené à 50 part quand même chez le pirate : la perte est bornée, pas évitée.
- **Fausses alertes élevées.** 15 % de faux rouges sur le jeu aveugle, surtout des achats de NFT à prix quasi nul. La fatigue d'alerte est la limite principale.
- **Où va la phrase.** Du navigateur au relais local, puis au modèle hébergé si le relais a une clé. Minimisation et durée de conservation non rédigées. Tant que le relais n'est pas épinglé sur l'identifiant de l'extension (`HOLDUP_EXTENSION_ID`, voir INSTALLATION.md), toute extension installée sur la machine peut l'appeler.
- **Aucun test avec des personnes.**
- **Principe non nouveau.** Le moindre privilège pour les approbations existe (Matcha, LI.FI, Talisman, Permit2), et le principe « dire d'abord, valider après simulation » a été décrit publiquement en février 2026. Notre apport est l'assemblage : phrase libre avant la demande, sur toute demande, comparée à l'effet, avec un plancher de règles.

## Référentiels

NIST CSF 2.0 : DE.AE-02, DE.AE-07, DE.CM-09 (Detect), RS.MI-01 au sens large (Respond), PR.PS-04 et RS.AN-06 (trace), PR.AA-05 (moindre privilège, fonction secondaire). ATT&CK : T1657, T1566, T1204, T1684.001, T1070. D3FEND : aucun identifiant retenu. OWASP Agentic : ASI01 par analogie, seulement si un agent détient le portefeuille. Tous relus sur les sites officiels le 11 oct. 2026 : [livrables/MAPPING_REFERENTIELS.md](livrables/MAPPING_REFERENTIELS.md). Aucune conformité déclarée.

## Carte du dépôt

| Chemin | Contenu |
|---|---|
| `scripts/demo.mjs`, `scripts/verifier_installation.mjs` | lancer la démo locale ; contrôler l'installation et les tests rapides |
| `livrables/` | rendu : [CHIFFRES](livrables/CHIFFRES.md), pitchs V7, vidéo, fiche de défense, slide de conformité, playbook, questions du jury, deck, mapping, installation ; `pitch_v7/` : pitch, démo et Q&R d'Adem ; `RAPPORT_V7.md` : comparaison des deux V7 et version recommandée |
| `pitch/DEMO_SCENES.md` | scènes de démo du produit |
| `research/titouan/T_banc_e2e/extension_standalone/` | extension Chrome/Edge MV3 livrée : sources, dossier `extension/` à charger, variante `extension_sans_reseau/`, `BUILD_INFO.json` (empreintes du build), tests |
| `research/titouan/T_banc_e2e/dist/` | paquets zip du build (leur contenu se contrôle avec `BUILD_INFO.json`) |
| `research/titouan/T_banc_e2e/extension/` | ancienne version avec serveur |
| `research/titouan/T_banc_e2e/engine/`, `run/policy.mjs`, `server/` | moteur d'effets, comparateur, serveur, journal chaîné |
| `research/titouan/T_banc_e2e/pipeline/` | intégration des détecteurs, mesures de l'intention écrite, grille phrase / demande |
| `research/titouan/T_banc_e2e/security_review2/` | revue de sécurité défensive de l'extension, avec tests |
| `research/demo_reelle/` | recherches sourcées (`RECHERCHE_*.md`), sites de démo Neve et Glacier, relais du classifieur, réponse et audit, prototypes RPC et Lab |
| `blockchain/` | contrats de démo synthétiques, déploiement local et Fuji |
| `coord/` | coordination ; décisions dans `coord/DECISIONS.md`, passation dans `coord/HANDOFF_ADEM_SESSION_2.md` |

## Règle : aucun secret, données synthétiques seulement

Aucun secret n'est dans le dépôt. Les clés (`FUJI_PRIVATE_KEY`, clés du modèle) vivent dans `.env`, ignoré par git ; seuls des fichiers `*.example` sont suivis. Les comptes Hardhat de la démo ont des clés publiques : jamais de vrais fonds. Les jeux de test sont synthétiques. Les mesures sur chaîne réelle lisent des RPC publics en lecture seule et n'envoient aucune transaction. Les attaques sont simulées sur notre chaîne locale.

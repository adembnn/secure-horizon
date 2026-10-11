# Hold up

Tout service peut être compromis. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre. Hold up est une couche indépendante, pensée pour se poser devant le portefeuille que la personne utilise déjà. Elle a deux étages. Un : la personne écrit ce qu'elle veut faire, avant de voir la demande, et du code compare avec ce que la demande fait vraiment. Deux : un plancher de règles qui ne dépend pas de la phrase. Si la demande correspond, elle part vers le portefeuille après une seconde. Sinon, une alerte d'une ligne, et Annuler reste visible. Hold up ne remplace pas le portefeuille, ne tient aucune clé et ne signe rien.

Promesse : cesser de donner plus que nécessaire, car on s'expose en le faisant. On ne sait pas quel site sera piraté ; on décide de ce qu'on lui laisse.

Hackathon Secure Horizons, 10-11 octobre 2026. Track 1, Fintech Security. Hackathon blue team : le projet détecte et répond, il n'attaque rien. Équipe : Adem et Titouan. Des noms techniques (variables d'environnement, fichiers de recherche) portent encore un ancien nom de code : c'est le même projet.

## Le problème

Un particulier qui signe dans son portefeuille voit des octets, pas des conséquences. Exemple : il veut échanger 50 USDC, le site lui demande un droit de dépense illimité présenté comme une étape normale. D'après le code public de MetaMask, lu le 11 oct. 2026, le montant illimité est affiché (« Unlimited ») sans alerte propre à ce montant, et rien ne le rapproche de ce que la personne voulait donner. Cela vaut pour une adresse que MetaMask ne liste pas comme malveillante, et c'est une lecture de code, pas un essai à l'écran.

Les chiffres sur le problème sont tous dans [livrables/CHIFFRES.md](livrables/CHIFFRES.md), avec leur source et leur date. Ce n'est pas la majorité des droits qui sont illimités, et nous ne disons pas que ça empire : la parade, ne laisser que ce qu'il faut (le moindre privilège), est connue.

## Architecture : ce que fait le prototype

Une extension de navigateur (MV3) se place entre la page et le portefeuille. Elle contient son moteur de décodage et de comparaison. Un relais local (port 8789) garde la clé du modèle Clef et ne reçoit que la phrase. Un journal local chaîné garde chaque décision. Schémas : [livrables/ARCHITECTURE.md](livrables/ARCHITECTURE.md) (à relire : il décrit encore l'ancienne version à deux portes).

1. **Demander.** Avant de montrer la demande, une fenêtre d'extension pose une question : « Que veux-tu faire sur ce site ? ». Champ de texte libre, aucun bouton, aucun pré-remplissage. Seules les demandes qui déplacent de la valeur ou accordent un droit ouvrent la fenêtre.
2. **Lire.** Le montant, le jeton et l'adresse écrits sont extraits par du code. Le type d'action est classé par le modèle Clef, à travers un relais local (décision D-015). Si le relais est arrêté, lent ou sans clé, des mots-clés prennent le relais et l'écran le dit. Phrase trop vague : « Je n'ai pas pu vérifier cette demande ».
3. **Décoder l'effet.** Calldata, données typées (Permit, Permit2), droits accordés, fonds sortants.
4. **Comparer.** Trois réponses : « Ça correspond à ce que tu as écrit. », « Ça ne correspond pas à ce que tu as écrit. », « Je n'ai pas pu vérifier cette demande. » Un montant écrit contre un droit plus large ne correspond pas, même sur un site connu.
5. **Plancher de règles.** Indépendamment de la phrase : droit illimité vers une adresse inconnue, appel délégué, changement de contrôle du compte, signature illisible.
6. **Répondre.** Niveaux : information, attention, danger, manipulation. Quand la demande correspond, l'écran dit « Ça correspond, d'après ce que Hold up sait lire. Ce n'est pas une garantie. » Pour une transaction, la ligne dit comment ramener le droit au montant écrit, ou Hold up le remplace lui-même sous conditions. Pour une signature, elle dit que le droit ne peut pas être limité. Après l'alerte, la démo web (`research/titouan/T_banc_e2e/webdemo/`) montre la révocation en un clic, la fiche d'incident et le rejeu du journal, avec un portefeuille simulé. Dans l'extension, la révocation est branchée depuis le 11 oct. (panneau latéral, « Droits accordés », bouton « Révoquer ») mais n'a jamais été essayée dans un vrai Chrome ; la fiche d'incident n'y est pas.
7. **Tracer.** Chaque décision écrit une ligne datée, sans la phrase écrite ni adresse. Le journal garde 500 lignes en local, chaînées par hachage : une ligne changée ou retirée au milieu se voit. Sans ancrage externe, une réécriture complète ne se voit pas. Export JSON depuis le panneau latéral, vérification hors ligne par `node research/titouan/T_banc_e2e/extension/tools/verify_journal.mjs export.json`. Pas d'ancrage sur une blockchain pour le rendu (décision D-017) : le contrat d'ancrage est codé, jamais déployé (voir Limites).

Démo du pitch V7 (`livrables/PITCH_5MIN.md`, gestes et états prouvés dans `livrables/pitch_v7/DEMO_DEROULE.md`) : deux fenêtres, le même site Neve, l'un piraté. Sans Hold up, un droit illimité vide le compte de test (100 vers 0, lu sur la chaîne par script). Avec Hold up, la même phrase « échanger 50 USDC contre AVAX » donne « Ça ne correspond pas » et le droit est ramené à 50. Autres scènes : `pitch/DEMO_SCENES.md`.

## Essayer en 3 commandes

Il faut Node 22.18 ou plus, et Chrome ou Edge 114 ou plus. Aucun vrai fonds, aucun compte à créer.

```
git clone <url-du-depot> hold-up
cd hold-up
node scripts/verifier_installation.mjs
node scripts/demo.mjs
```

1. `node scripts/verifier_installation.mjs` (ou `npm run verifier`) contrôle les versions, les fichiers nécessaires, les ports, et lance les tests rapides. Les chiffres sont ceux de la commande, à l'instant où tu la lances. Sur un clone neuf, elle sort en code 1 pour deux raisons connues : `blockchain/node_modules` est absent (la commande suivante l'installe) et 2 tests du moteur lisent un fichier de données ignoré par git (voir Tests). Cela ne bloque pas la démo.
2. `node scripts/demo.mjs` (ou `npm run demo`) lance `npm install` dans `blockchain/` s'il manque (Internet nécessaire), puis, dans l'ordre : la chaîne locale (port 8545), les contrats de démo, la copie de leurs adresses vers le site Neve, le site Neve (8793), le relais du classifieur (8789), la console d'attaque simulée (8792) et le site « Glacier Rewards » (8791). Ce qui tourne déjà n'est ni relancé ni arrêté. Ctrl+C arrête seulement ce que le script a lancé. À la fin, il affiche les adresses à ouvrir et le dossier de l'extension.
3. Charge l'extension : `chrome://extensions`, Mode développeur, Charger l'extension non empaquetée, dossier `research/titouan/T_banc_e2e/extension_standalone/extension`.

Puis ouvre `http://localhost:8793/?mode=honnete` (parcours honnête) ou `http://localhost:8793/?mode=piege` (piège). Pas à pas complet, portefeuille de test et dépannage : [livrables/INSTALLATION.md](livrables/INSTALLATION.md).

**Rejouer la preuve de la scène « site honnête piraté plus tard ».** Suite vérifiée le 11 oct. 2026 sur une copie propre du dépôt (Windows 11, Node 25.6), en mode par défaut puis avec `--fork` :

```
node scripts/demo.mjs --fork
node research/demo_reelle/site_echange/test/preuve_piratage.mjs
```

La première commande reste ouverte : lance la seconde dans un autre terminal, depuis la racine. `demo.mjs` installe les dépendances de `blockchain/`, lance la chaîne, déploie les contrats (dont le routeur vulnérable) et écrit leurs adresses dans `research/demo_reelle/chain/addresses.local.json`, que la preuve lit. Avec `--fork`, la chaîne est une copie locale d'Avalanche (chainId 43114, Internet nécessaire) ; sans, une chaîne vide hors ligne (chainId 31337). Sortie réelle dans les deux cas : 13 lignes `PASS`, puis `TOUT VERT`. Sans Hold up : « le compte passe à 0 -> 50.0 -> 0.0 ». Avec le droit ramené à 50 : « le pirate ne prend RIEN -> +0.0 DUSDC ». Le script rejoue le geste de l'extension (le même `approve`, montant limité) ; il ne pilote pas l'extension. Il restaure l'état de la chaîne à la fin. Si le port 8545 est pris par autre chose : `HOLDUP_PORT=8646 node scripts/demo.mjs` (PowerShell : `$env:HOLDUP_PORT="8646"`).

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
| `node scripts/verifier_installation.mjs` | tout ce qui suit, sauf les contrats, avec les chiffres réels ; remet ensuite à l'état de git les fichiers suivis que les suites ont réécrits, s'ils étaient propres avant |
| `npm run test:engine` | moteur d'effets (recrée d'abord les fichiers de données générés qui manquent) |
| `npm run test:server` | serveur de vérification, journal chaîné |
| `npm run test:extension` | extension avec serveur : moteur de retenue, Chrome factice |
| `npm run test:rpc` | RPC de garde (exige `npm install` dans `blockchain/`) |
| `node --test research/demo_reelle/classifieur/relay.test.mjs` | relais du classifieur, modèle simulé |
| `node research/titouan/T_banc_e2e/extension_standalone/tests/static_check.mjs` | contrôle statique du build livré (permissions, un seul `fetch`, pas de secret) |
| `node --no-warnings research/titouan/T_banc_e2e/extension_standalone/tests/run_tests.mjs` | suite du build autonome (reconstruit le build : réécrit des fichiers suivis) |
| `node research/titouan/T_banc_e2e/webdemo/tests/run_webdemo_tests.mjs` | démo web (reconstruit `webdemo/engine/` : réécrit des fichiers suivis) |
| `npm run test:contracts` (ou `node scripts/verifier_installation.mjs --complet`) | contrats de démo (Hardhat, environ 2 minutes) |

Aucun nombre n'est recopié ici : ils changent à chaque version, lance la commande. À remplir après la fusion : N tests, 0 échec (`npm run verifier`). Ces tests valident le code, ils ne mesurent pas la détection. La détection se mesure avec `node --no-warnings preuves/banc.mjs --bras=mots` (voir « Comment nous avons mesuré »). Les tests de la revue de sécurité (`research/titouan/T_banc_e2e/security_review2/tests/`, `node <fichier>`) sortent en code 1 tant que leur faille est ouverte. Le 11 oct. 2026 : r01, r02, r03 et r05 passent ; r04 échoue encore (dans le moteur du build livré, un `transfer` qui joint 1 ETH reste « attention »). r04 accepte aussi « pas pu vérifier » comme correctif : un passage ne voudra pas dire que l'ETH joint est vu. r01 et r03 tournent en Node, pas dans un vrai Chrome. Détail : `security_review2/REVUE.md`.

Fichiers ignorés par git mais lus par des tests (un clone neuf ne les a pas) :
- `research/titouan/T_banc_e2e/redteam/V2_DEV_norm.jsonl` (21 Mo), lu par `engine/test/monotonie.test.mjs`, `pipeline/test/evaluate_plus.test.mjs`, `pipeline/test/monotone_pipeline.test.mjs` et `run/mesure_monotonie.mjs`. Sans lui, ces tests plantent. Pour le créer : `node scripts/verifier_installation.mjs --donnees` depuis la racine (aussi lancé par `npm run test:engine`), ou à la main depuis `research/titouan/T_banc_e2e` : `node redteam/normalize_v2.mjs blind_adem/v2/V2_DEV.jsonl redteam/V2_DEV_norm.jsonl`.
- `research/titouan/T_banc_e2e/attacks_public/PUBLIC.jsonl` : recréé par la même commande `--donnees`, avec sa graine fixe.
- `research/titouan/bench/data/cchain_sample.jsonl` : échantillon de trafic réel de la C-Chain, recréable seulement avec Internet (`bench/sample_cchain.mjs`). Sans lui, un test du moteur échoue. Cela n'a aucun effet sur la démo.

## Chiffres

Le document de référence est [METRIQUES.md](METRIQUES.md) : chaque chiffre y est donné avec son dénominateur, son intervalle, ce qu'il mesure, la commande et le fichier de preuve. Les chiffres sur le problème (données du monde) restent dans [livrables/CHIFFRES.md](livrables/CHIFFRES.md). Quatre chiffres à retenir, avec leur qualification :

- **34 %** des autorisations de dépense non nulles sont illimitées sur Avalanche C-Chain : 7 103 sur 20 753 = 34,2 % [33,6 ; 34,9]. Notre mesure, sur un échantillon de blocs (40 fenêtres de 500 blocs, lecture seule d'un RPC public). Elle compte des événements, pas des personnes.
- **87 %** des écarts signalés avec la phrase : 131/150 = 87,3 % [81,1 ; 91,7]. Moteur de comparaison, jeu aveugle de 250 cas d'un autre auteur, ouvert une fois. Ce n'est pas l'extension livrée.
- **65 %** sans la phrase, même mesure : 97/150 = 64,7 % [56,7 ; 71,9]. C'est le plancher de règles seul.
- **15 %** d'alertes rouges à tort, même mesure : 15/100 = 15,0 % [9,3 ; 23,3]. L'objectif de 10 % publié avant l'ouverture est manqué.

À savoir avant de citer ces chiffres :

- **L'extension livrée** a été mesurée à part, sur un contrôle scellé de 2 662 paires, avec un build qui plantait sur 19,5 % des demandes : 49,4 % d'écarts attrapés, 2,7 % ratés, 31,2 % laissés « pas pu vérifier », 16,7 % en panne ; 8,2 % de fausses alertes. La panne est corrigée depuis (commit `b42792d`). La mesure du code corrigé sur la réserve scellée (2 673 paires) n'est pas faite.
- **Temps de détection** (code de l'extension sous Node, sans fenêtre) : p50 2,0 ms, p95 13,0 ms en local ; p50 387 ms, p95 1 436 ms avec l'appel au modèle. Le temps de bout en bout dans un vrai navigateur n'est pas mesuré de façon reproductible.

Un test qui passe n'est pas une mesure de détection.

## Comment nous avons mesuré

Une unité : une phrase et une demande de site. Trois réponses possibles, plus la panne, comptée à part. La vérité vient de la construction des cas (panel) ou de l'étiquette d'un autre auteur (jeu aveugle). Le panel est coupé en trois : réglage, contrôle, réserve. Contrôle et réserve sont scellés par empreinte et ouverts une seule fois. Chaque résultat porte le commit et l'empreinte du code mesuré. Le contrôle a été ouvert sur un build en panne : le résultat est publié tel quel. Protocole complet et menaces sur la validité : [preuves/PROTOCOLE.md](preuves/PROTOCOLE.md). Ce qui échoue, cas par cas : [preuves/CE_QUI_NE_MARCHE_PAS.md](preuves/CE_QUI_NE_MARCHE_PAS.md).

## Limites connues

- **Jamais essayé avec un vrai portefeuille, rien sur un réseau public.** Aucun résultat dans `research/titouan/T_banc_e2e/essai_reel/ESSAI_REEL_RESULTATS.csv`. La démo tourne sur une chaîne locale, que l'API d'alertes de MetaMask ne sert pas (Fuji non plus) : son silence là ne prouve rien.
- **Revue de sécurité.** Contournements trouvés, dont un critique (une page qui remplace des fonctions natives). Corrections non toutes vérifiées dans un navigateur. Nous ne disons pas « sécurisé ».
- **Rien n'est déployé sur Fuji.** Le déploiement est préparé et répété sur une copie locale, mais il n'est pas exécuté (D-016) : `blockchain/DEPLOYMENTS.md` ne contient que son en-tête : tant qu'il est vide, la démo se joue sur la chaîne locale. Sans ancrage, le journal détecte une ligne modifiée ou retirée au milieu, pas une réécriture complète.
- **Hors périmètre.** Fraude consentie (la personne veut vraiment faire ce paiement), intention vague, contrat qui change à l'exécution (MetaMask le traite mieux avec Added Protection), Ledger branché directement, mobile, envois lancés depuis le bouton Envoyer du portefeuille.
- **Une signature ne se limite pas.** Un droit donné par Permit n'a pas de plafond modifiable : Hold up alerte et le dit. Pas de révocation en un clic non plus.
- **Révocation peu éprouvée.** Le bouton « Révoquer » existe dans la démo web (portefeuille simulé) et, depuis le 11 oct., dans le panneau latéral de l'extension. Côté extension : des tests en Node, aucun essai dans un vrai Chrome.
- **Vérification non exhaustive.** Hold up ne reconnaît pas un contrat malveillant : il borne ce qu'on lui laisse. Ne sont pas comparés à la phrase : la durée d'un droit, le bénéficiaire d'un droit, le minimum reçu d'un échange, les opérations récurrentes, les frais. Sur le contrôle, un droit sans échéance reçoit « ça correspond » dans 21 cas sur 43. Détail : `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md`, `preuves/CE_QUI_NE_MARCHE_PAS.md`. Sur 58 paires d'essai, 18 sont contrôlées. Dans la démo, le droit ramené à 50 part quand même chez le pirate : la perte est bornée, pas évitée.
- **Fausses alertes élevées.** 15 % de faux rouges sur le jeu aveugle (moteur de comparaison), surtout des achats de NFT à prix quasi nul. La fatigue d'alerte est la limite principale.
- **Beaucoup de « pas pu vérifier ».** Sur le contrôle, l'extension laisse 36,5 % des demandes conformes sans réponse (sans modèle), avec 30 secondes d'attente.
- **L'extension corrigée n'est pas mesurée sur un jeu scellé.** Le seul chiffre scellé de l'extension vient d'un build en panne. La réserve attend.
- **Jeux de test faits maison.** Phrases écrites par des agents, pas par de vrais utilisateurs. Jeux conçus par la même équipe que le produit ; l'auteur du jeu aveugle est une IA de la même famille que celle qui nous a aidés.
- **Lignes requalifiées.** Les lignes A5, A11 et A12 de `livrables/CHIFFRES.md` ne valent pas pour l'extension (`preuves/ECARTS_LIVRABLES.md`).
- **Où va la phrase.** Du navigateur au relais local, puis au modèle hébergé si le relais a une clé. Minimisation et durée de conservation non rédigées. Tant que le relais n'est pas épinglé sur l'identifiant de l'extension (`HOLDUP_EXTENSION_ID`, voir INSTALLATION.md), toute extension installée sur la machine peut l'appeler.
- **Aucun test avec des personnes.** Le temps de décision d'une personne n'est pas mesuré.
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

# Familles faibles du jeu aveugle : correctifs du moteur et mesure sur jeux neufs

Date : 11 octobre 2026. Racine : `research/titouan/T_banc_e2e`. Aucun commit. Aucun secret. Aucun appel réseau.
Le jeu aveugle `blind_decalage/` n'a pas été rouvert. Ni `CASES.jsonl`, ni ses identifiants d'échec, ni le détail de `RESULTAT.md` n'ont été lus.
`V2_TEST` et `attacks/TEST.jsonl` n'ont pas été lus. Le résultat aveugle publié reste celui du moteur gelé `74203da`. Il n'est pas remesuré.

## En bref

1. Quatre familles corrigées par des règles de forme. Aucune adresse de cas, aucun identifiant, aucun hachage de cas.
2. Deux jeux neufs écrits ici : réglage (240 cas) et contrôle (240 cas). Chacun : 128 écarts, 112 jumeaux bénins.
3. Empreinte du contrôle publiée avant toute mesure (`attacks_familles/CONTROLE.sha256`). Contrôle mesuré une seule fois (verrou `CONTROLE.lock`).
4. Contrôle, intention honnête, toutes familles. Avant : 81 % signalés, 47 % d'écarts lus comme « ne correspond pas », 31 % de fausses alertes rouges. Après : 100 %, 100 %, 0 %.
5. Non-régression sur DEV, public et V2_DEV (6 456 cas) : aucune arnaque perdue, aucune fausse alerte nouvelle, 3 arnaques gagnées.
6. Toutes les portes passent. Une porte du pipeline échouait déjà au commit gelé. Je l'ai corrigée (voir Portes).

## Ce que je savais du jeu aveugle

Seulement ces faits par famille (code seul, moteur `74203da`) :

- achat NFT, ordre Seaport à prix quasi nul : rappel 100 %, mais 11 faux rouges sur 12 jumeaux bénins ;
- jeton différent de celui dit : rappel 63 %, 4 bénins sur 13 invérifiables ;
- chaîne ou domaine différent : rappel 67 %, ratés tous « invérifiable », aucun « ne correspond pas » ;
- connexion qui signe un droit : rappel 74 %, 9 ratés invérifiables ;
- faux rouges globaux : 15 %.

J'ai aussi lu le code de la chaîne à trois valeurs (`blind_decalage/run/chaine/lib.mjs`). Il dit quand une demande devient « ne correspond pas » : il faut que l'intention lève le niveau, ou qu'elle ajoute un motif absent sans intention. Un effet illisible donne toujours « invérifiable ». C'est ce qui explique la famille chaîne : le moteur voyait déjà l'écart sans intention, donc l'intention n'ajoutait rien.

## Les règles

| Famille | Cause trouvée | Correctif | Fichier |
|---|---|---|---|
| achat NFT Seaport | Le détecteur ne comptait que les jetons versés à l'utilisateur. Une offre d'achat honnête (WETH contre le NFT) passait pour « céder contre rien ». | Une offre où l'utilisateur ne donne que du fongible et reçoit lui-même un NFT est un achat. Un NFT livré à un tiers reste attrapé. | `detectors_adem/nft_orders.mjs` |
| achat NFT Seaport | Les commissions (2,5 %) et redevances d'une offre d'achat passaient pour « produit détourné ». | Pour une offre d'achat, ces paiements sont pris sur ce que l'acheteur donne. La règle ne vaut que pour une vente. | `engine/src/typed.mjs` |
| achat NFT Seaport | L'intention « acheter » n'était jamais comparée à un ordre qui cède des NFT. | F42 : verbe d'achat, aucun verbe de vente, et l'ordre fait sortir des NFT de l'utilisateur : raison `nft_given_on_buy_intent`, rouge. | `run/policy.mjs` |
| jeton différent | Le jeton dit pouvait être une adresse : comparée à un symbole, elle créait de faux écarts. Un jeton sans symbole connu ne concluait jamais. Pour un échange, le jeton dit n'était pas lu comme le jeton donné. | F32 revu. Identité par adresse, puis par symbole. Un jeton inconnu n'est pas le jeton dit si ce symbole a une adresse connue sur ce réseau. « Échanger 50 USDC » : le jeton dit est celui qu'on donne. Natif et enveloppé du même réseau sont équivalents, par une liste fermée (ETH/WETH, AVAX/WAVAX, BNB/WBNB, POL/WPOL/MATIC...). Avant, tout W initial était retiré (wstETH valait stETH). | `run/policy.mjs`, `engine/src/util.mjs`, `detectors_adem/intent_guard.mjs` |
| chaîne ou domaine | Le moteur voyait l'écart sans intention (chainId signé différent, SIWE pour un autre site). L'intention n'ajoutait aucun motif : la chaîne à trois valeurs répondait « invérifiable ». | F43 : avec une intention, raison propre `chain_differs_from_intent` ou `site_differs_from_intent`. Compare le chainId du domaine EIP-712 ou du SIWE au réseau de la demande. Compare aussi le réseau ou le site nommé dans le texte (« sur Avalanche », « app.exemple.org ») à ce que la signature vise. Rouge si de la valeur est engagée ou si c'est un site, orange sinon. | `run/policy.mjs`, `engine/src/typed.mjs` (chainId du domaine exposé) |
| connexion qui signe un droit | Un permit ERC-2612 au type renommé (« Login », « Session ») restait illisible : la chaîne répondait « invérifiable ». | Le permit est lu par ses champs (owner, spender, value, nonce, deadline), quel que soit son nom. Le nom non standard est signalé (`permit_type_renamed`, orange). Le comparateur voit alors un droit contre l'intention « se connecter » : rouge. Un SIWE valide reste sans raison. | `engine/src/typed.mjs` |

Garde-fous trouvés sur V2_DEV pendant le réglage, puis intégrés :

- un pont nomme une destination (« passer mes USDC sur Arbitrum ») : le réseau nommé n'est comparé que pour une signature ou une connexion, jamais pour `send_to_my_account` ;
- « virer vers Crypto.com » nomme une plateforme, pas le site de la demande : même restriction ;
- « voter sur aave.eth » : les noms en `.eth`, `.sol` et semblables ne sont pas des sites ;
- une bascule de réseau compare le réseau nommé au réseau DEMANDÉ ;
- un nom de réseau couvre aussi son réseau de test public (Avalanche couvre Fuji) ;
- « Retirer mes AVAX d'Aave » n'est pas un échange : la lecture « jeton donné » exige un verbe d'échange ou de vente.

Toutes ces règles ne lisent que l'intention. Sans intention elles ne font rien. Elles ne font que monter un niveau.
Interrupteurs : F42 et F43 ajoutés à `engine/src/fixes.mjs`. Les nouvelles raisons ont une fiche dans `server/server.mjs` (`REASON_FICHE`).

## Les jeux neufs

Générateur : `attacks_familles/gen_familles.mjs`. Graines fixes : réglage 20261011, contrôle 77031999.
Les transactions sont encodées par l'encodeur ABI du moteur. Chaque message EIP-712 est haché par le moteur à la génération (un message mal formé arrête le générateur). Les ordres Seaport suivent les types de Seaport 1.6 (OrderComponents, OfferItem, ConsiderationItem). Les SIWE suivent EIP-4361.

Le contrôle ne partage pas le vocabulaire du réglage : autres sites, autres noms de types renommés, autres collections, autres montants et prix, autres réseaux tiers, phrases en anglais pour l'achat, la connexion et le réseau nommé.
Les formes (types d'écarts) sont les mêmes dans les deux jeux. Le contrôle teste donc la généralisation du vocabulaire, pas celle des formes.

| Famille | Écarts | Jumeaux bénins | Sous-familles d'écart | Sous-familles bénignes |
|---|---|---|---|---|
| nft_achat_seaport | 32 | 28 | vente déguisée (721, 1155, collection, jeton quasi nul, produit à un tiers), NFT livré à un tiers, prix dix fois le prix dit | offre d'achat avec commission 2,5 %, avec redevance, 1155, offre de collection, arrondi |
| jeton_different | 32 | 28 | autre jeton du registre, jeton hors registre, natif au lieu du jeton, enveloppé vendu au lieu du jeton dit, droit ou permit ou Permit2 sur un autre jeton | même jeton (dit par symbole ou par adresse), natif et enveloppé du même réseau, permit conforme |
| chaine_domaine | 32 | 28 | permit, Permit2 et Seaport signés pour un autre réseau, SIWE pour un autre site ou une autre URI, SIWE d'un autre réseau, réseau ou site nommé différent | même réseau, même site, réseau nommé correct, SIWE avec ressources |
| connexion_droit | 32 | 28 | permit canonique, permit renommé, Permit2 (simple, renommé, transfert, lot), permit DAI, permit borné vers un routeur connu | SIWE valide (avec ou sans statement, avec ressources), texte de connexion |

Empreintes publiées avant la mesure du contrôle (`attacks_familles/CONTROLE.sha256`) :
`f2abd9e29e339da03f89ae2a09935179ac9599694f1211fcb2eab3fe410be620` pour `CONTROLE.jsonl`.

## Mesure

Commande : `node attacks_familles/mesure_familles.mjs --file=<jeu> [--root=<moteur gelé>]`. Mêmes bras que `attacks_decalage/mesure_decalage.mjs` : plancher, sans intention, catalogue (type seul), honnête (intention détaillée), honnête noyau.
« Avant » = extraction du commit gelé `74203da` (`git archive`), même jeu, même script.

Indicateurs du bras honnête :

- signalé : niveau orange ou rouge ;
- écart d'intention : orange ou rouge, et l'intention ajoute un niveau ou un motif absent sans intention, et l'effet est lisible. C'est la condition du « ne correspond pas » de la chaîne à trois valeurs ;
- fausse alerte : jumeau bénin en rouge ;
- orange bénin : jumeau bénin en orange.

Intervalles de Wilson à 95 % entre crochets.

### Contrôle (mesuré une fois)

| Famille | Signalés avant | Signalés après | Écart d'intention avant | Écart d'intention après | Fausses alertes avant | Fausses alertes après | Oranges bénins après |
|---|---|---|---|---|---|---|---|
| toutes | 104/128 (81 % [74 ; 87]) | 128/128 (100 % [97 ; 100]) | 60/128 (47 % [38 ; 55]) | 128/128 (100 % [97 ; 100]) | 35/112 (31 % [23 ; 40]) | 0/112 (0 % [0 ; 3]) | 19/112 (17 % [11 ; 25]) |
| nft_achat_seaport | 32/32 (100 % [89 ; 100]) | 32/32 (100 % [89 ; 100]) | 16/32 (50 % [34 ; 66]) | 32/32 (100 % [89 ; 100]) | 28/28 (100 % [88 ; 100]) | 0/28 (0 % [0 ; 12]) | 14/28 (50 % [33 ; 67]) |
| jeton_different | 16/32 (50 % [34 ; 66]) | 32/32 (100 % [89 ; 100]) | 16/32 (50 % [34 ; 66]) | 32/32 (100 % [89 ; 100]) | 2/28 (7 % [2 ; 23]) | 0/28 (0 % [0 ; 12]) | 0/28 (0 % [0 ; 12]) |
| chaine_domaine | 24/32 (75 % [58 ; 87]) | 32/32 (100 % [89 ; 100]) | 0/32 (0 % [0 ; 11]) | 32/32 (100 % [89 ; 100]) | 5/28 (18 % [8 ; 36]) | 0/28 (0 % [0 ; 12]) | 5/28 (18 % [8 ; 36]) |
| connexion_droit | 32/32 (100 % [89 ; 100]) | 32/32 (100 % [89 ; 100]) | 28/32 (88 % [72 ; 95]) | 32/32 (100 % [89 ; 100]) | 0/28 (0 % [0 ; 12]) | 0/28 (0 % [0 ; 12]) | 0/28 (0 % [0 ; 12]) |

Rouges sur les cas de gravité idéale critique, contrôle : 96/120 (80 % [72 ; 86]) avant, 120/120 (100 % [97 ; 100]) après.
Écarts illisibles (lus « invérifiable ») : 4 avant (permits renommés), 0 après.

### Réglage

Les chiffres du réglage sont identiques à ceux du contrôle, case par case des tableaux (mêmes formes, vocabulaire différent). Détail : `attacks_familles/reglage_avant.md`, `reglage_apres.md`.

Le jeu neuf reproduit les faits du jeu aveugle avant correction : 100 % de rappel mais 100 % de faux rouges sur les achats NFT honnêtes ; 0 écart d'intention sur la famille chaîne alors que 75 % sont signalés.

### Oranges bénins restants

- 14 achats NFT honnêtes sur 28 : le contrat Seaport n'est pas dans les protocoles connus du contexte (un cas sur deux, exprès). Le détecteur d'intention le dit en orange. C'est un fait vrai : contrat non reconnu.
- 5 achats Seaport honnêtes de la famille chaîne : même cause.
- Avant, ces 19 cas étaient en rouge.

## Non-régression

Commande : `node attacks_familles/regression.mjs`. Jeux : `attacks/DEV.jsonl`, `attacks_public/PUBLIC.jsonl`, `redteam/V2_DEV_norm.jsonl`. 6 456 cas, 3 254 arnaques, 2 136 bénins. Ratée = arnaque sans rouge. Fausse alerte = bénin en rouge.

| Chaîne et bras | Ratées avant | Ratées après | Fausses alertes avant | Fausses alertes après | Arnaques perdues | Fausses alertes nouvelles |
|---|---|---|---|---|---|---|
| noyau, sans intention | 430 | 430 | 0 | 0 | 0 | 0 |
| noyau, type seul | 197 | 197 | 21 | 21 | 0 | 0 |
| noyau, intention détaillée | 186 | 183 | 22 | 22 | 0 | 0 |
| produit, sans intention | 80 | 80 | 15 | 15 | 0 | 0 |
| produit, type seul | 51 | 51 | 26 | 26 | 0 | 0 |
| produit, intention détaillée | 47 | 44 | 27 | 27 | 0 | 0 |

Les 3 arnaques gagnées sont des SIWE de DEV pour un autre site que celui dit (orange avant, rouge après).
Aucun cas ne change de niveau ailleurs, ni bénin ni arnaque. Sortie : `attacks_familles/regression_diff.md`.

## Portes

| Porte | Résultat |
|---|---|
| zéro verdict « ok » du serveur (`node attacks_familles/zero_ok.mjs`, 6 696 demandes) | 0 « ok » |
| monotonie : `node run/mesure_monotonie.mjs --detectors --guard` | 0 violation sur 6 442 cas |
| monotonie : `engine/test/monotonie.test.mjs` | 6/6 |
| `node run/check_nohardcode.mjs` | OK |
| tests moteur, fichier par fichier | calldata 101, cchain 103, compare 38, effects_abi 10, keccak 28, real 69, rules 23, selectors 23, typed 50, typehash 12, familles 10 (nouveau) : tout passe |
| serveur | 33/33 |
| présentation | 39/39 |
| `pipeline/test` | evaluate_plus 14/14, intent_clef 13/13, monotone_pipeline 7/7 |
| `run/test_policy.mjs` | tous OK |

Deux remarques honnêtes sur les portes :

- `pipeline/test/evaluate_plus.test.mjs` échouait déjà au commit gelé (13/14, cas `jury-fp-089`). Cause : le test comparait la chaîne rejouée au niveau AFFICHÉ du produit, alors que le produit relève l'affichage d'un envoi vers une adresse nouvelle (info vers orange, champ `niveau_moteur`). J'ai corrigé le test pour comparer au niveau du moteur. L'assertion « jamais sous le produit affiché » est gardée.
- `detectors_adem/test/fork_test.mjs` échoue avant comme après : le module `solc` n'est pas installé. Hors de mon travail.

Nouveau test : `engine/test/familles.test.mjs`. Il rejoue une demande par sous-famille du réglage (jamais le contrôle) et vérifie chaque règle.

## Limites

- Mêmes auteurs pour les cas et les règles. Les jeux neufs disent que les règles font ce que j'ai voulu, pas qu'elles tiennent face à un autre auteur.
- Le contrôle varie le vocabulaire, pas les formes. Ses 100 % ne sont pas une preuve de généralisation à des formes nouvelles. Les intervalles de Wilson ne mesurent que le hasard d'échantillonnage, pas ce biais.
- Le jeu aveugle n'est pas remesuré. Ses chiffres publiés restent ceux du moteur gelé. Aucune amélioration sur lui n'est revendiquée.
- La chaîne à trois valeurs du jeu aveugle peut encore dire « invérifiable » pour d'autres raisons que le moteur : phrase non comprise, montant ou protocole non dit. Mes règles n'y changent rien.
- Réseau et site nommés dans le texte : lecture par mots-clés (« sur X », « on X », « réseau X », nom d'hôte). Un nom écrit autrement n'est pas lu. Ce n'est comparé que pour une signature ou une connexion.
- Jeton inconnu : je ne conclus que si le symbole dit a une adresse connue sur ce réseau (registre du contexte, jetons de référence du moteur pour Ethereum et Avalanche). Ailleurs, pas de conclusion.
- Équivalence natif et enveloppé : liste fermée. Un jeton enveloppé absent de la liste n'est pas équivalent.
- Achat NFT : je ne juge pas la valeur d'un échange NFT contre NFT. Le prix trop élevé n'est attrapé que si l'intention donne un montant.
- Le serveur garde sa règle « vente à prix quasi nul » telle quelle. Elle ne touche pas une offre d'achat.

## Fichiers

- Modifiés : `engine/src/typed.mjs`, `engine/src/util.mjs`, `engine/src/fixes.mjs`, `run/policy.mjs`, `detectors_adem/nft_orders.mjs`, `detectors_adem/intent_guard.mjs`, `server/server.mjs` (table des fiches), `pipeline/test/evaluate_plus.test.mjs`.
- Nouveaux : `engine/test/familles.test.mjs`, `engine/RAPPORT_FAMILLES.md`, dossier `attacks_familles/` (générateur, deux jeux, empreintes, verrou, mesures avant et après, non-régression, porte zéro « ok »).
- `server/server.mjs` : le bloc de présentation est extrait par `webdemo/build_webdemo.mjs`. Les quatre nouvelles entrées de `REASON_FICHE` y arriveront au prochain build de la démo (dossier d'un autre agent, non touché).

# Audit de evaluatePlus : où le niveau peut-il descendre sous celui du produit ?

Date : 11 octobre 2026. Lecture seule. Seul le dossier `pipeline_audit/` a été écrit. Aucun commit.
Règle auditée : le modèle et les détecteurs ne peuvent qu'AGGRAVER un verdict, jamais le baisser, jamais de vert (`ok` / `info`).

## 1. Résumé

1. Sur les jeux de réglage demandés (V2_DEV, `jury_*`, `attacks/DEV.jsonl`, 10 293 cas dont 6 443 arnaques et 2 785 bénins), en modes `detectors` et `live` de `measure.mjs` : **0 arnaque** descend sous le niveau produit. 0 aussi pour les bénins, par rapport au "produit interne" de `evaluatePlus`.
2. Il existe pourtant **trois mécanismes** qui peuvent baisser un verdict. Aucun n'est exercé par les jeux DEV (la liste `loweredBy` est vide sur les 10 293 cas), donc la mesure ne les voit pas. J'ai construit des cas synthétiques qui les déclenchent (section 5).
   - A. Les corrections `lower` de trois détecteurs (dust_guard, intent_guard, nft_orders). Elles peuvent passer de `critical` à `warn` et même à `ok` (vert).
   - B. Le chemin `relaxedByFacts` : dès qu'un fait ou une intention riche est présent, le plancher "jamais sous le produit" saute. Cas réel trouvé : un SIWE sur domaine punycode passe de `critical` à `ok` (J-57).
   - C. La liste `pipeline/known_protocols.json` est injectée avant le calcul du "produit interne". Donc `plus.product` n'est **pas** le verdict de `server.evaluate` seul. Face à `evaluate` seul : 165 bénins deviennent plus bas (157 warn vers ok, 8 critical vers ok), 0 arnaque dans DEV.
3. Falsifier les faits lus sur la chaîne ne fait jamais descendre **sous le produit** (0 cas sur 12 variantes, 2 réglages, 6 443 arnaques). Mais cela annule le gain des faits : 325 arnaques rouges grâce au solde repassent orange avec un solde falsifié (réglage "intention absente"), 249 en réglage "liste connue + intention".
4. Faux positifs : le chiffre 265 vers 663 correspond à l'état du code avant le changement de `intent_guard` (règle 5 passée de `critical` à `warn` par défaut). Sur le code actuel : 265 vers 361 (mode `detectors`), 418 (mode `live`). Avec `HOLDUP_IG_KM=critical` : 631. Détail section 7.

## 2. État du code audité et reproductibilité

Le code a changé pendant l'audit (nouveau détecteur `forwarded_value`, changement de `intent_guard`, ajout de `known_protocols.json` dans `evaluate_plus.mjs`). J'ai donc tout rejoué sur l'état figé par les empreintes de `pipeline_audit/out/snapshot_sha256.txt` (identiques avant et après le rejeu, voir `snapshot_sha256_apres.txt`). Les chiffres de ce rapport viennent de cet état. Si le code bouge, rejouer.

Jeux utilisés : `redteam/V2_DEV_norm.jsonl`, `redteam/jury_*.jsonl` (9 fichiers), `attacks/DEV.jsonl`. Jamais V2_TEST ni `attacks/TEST.jsonl` (les scripts les refusent). Étiquettes : 6 443 arnaques, 2 785 bénins, 1 065 "autres" (819 `fraude_conforme`, 246 `ambigu`).

Niveaux comparés : `ok` < `unknown` < `warn` < `critical` (même échelle que `benchLevel`). Deux références :
- `plus.product` : le "produit interne" que `evaluatePlus` calcule lui-même (avec la liste connue).
- `product` de `measure.mjs` : `server.evaluate` seul, sans la liste. C'est le niveau "produit" au sens de la tâche.

## 3. Tous les chemins qui peuvent produire un niveau inférieur au produit

| # | Chemin | Où | Condition | Cible | Justification documentée |
|---|---|---|---|---|---|
| A1 | `dust_guard` `lower` | `detectors_adem/dust_guard.mjs:49` | Le destinataire est au carnet ou déjà payé ; toutes les raisons critiques du comparateur sont `lookalike_address` / `address_poisoning` ; aucune autre critique ; le sosie n'est pas connu et n'a envoyé que de la poussière | `warn` si une autre raison warn du produit reste, sinon **`ok`** | Faux positif d'empoisonnement : payer le vrai contact est le bon geste |
| A2 | `intent_guard` `lower` | `intent_guard.mjs:163` | La seule raison critique du comparateur est `amount_exceeded` ; le montant envoyé est couvert par la lecture **la plus large** du montant tapé ("1,000", "1k") | `warn` | Le comparateur lit le montant avec `parseFloat` |
| A3 | `nft_orders` `lower` (ordre Seaport) | `nft_orders.mjs:75` | Plancher moteur non critique ; texte libre contient vendre/lister ; contrat Seaport connu ; conduit officiel ; offre = NFT seulement ; au moins 80 % du prix au signataire ; prix proche du montant déclaré ou du plancher `extra.quote` | `warn` | Listing honnête |
| A4 | `nft_orders` `lower` (setApprovalForAll) | `nft_orders.mjs:86` | Opérateur connu ; collection = `extra.nft.collection` ; texte libre "vendre" ; plancher non critique | `warn` | Mise en vente |
| B | `relaxedByFacts` | `pipeline/evaluate_plus.mjs:393-397` | Le niveau final est sous `pLevel`, `richer` est vrai (au moins un fait lu, ou intention objet), et le produit n'a ni pression de page ni `seaport_zero_price` | tout niveau sous le produit | "Un fait connu explique le niveau plus bas" (aucune règle nommée) |
| C | Liste `known_protocols.json` | `evaluate_plus.mjs:296-301` (injection dans `local.knownSpenders`, avant `D.evaluate`) | Adresse appelée ou autorisée dans la liste de la chaîne (7 adresses sur 43114, 0 sur 1) | `warn` vers `ok`, `critical` vers `ok` (approve illimité à un routeur listé) | Les règles F1, F2, F13, F16, F19 du produit réduisent pour les protocoles connus ; liste avec sources |
| D | Affichage d'une baisse | `evaluate_plus.mjs:244` | `loweredBy` non vide | retire les drapeaux critiques du texte et l'`address_diff` | Pour que l'écran dise la même chose que le niveau |

Précisions utiles :
- La boucle de baisse (`evaluate_plus.mjs:387`) s'applique **après** tous les détecteurs. Elle est bloquée seulement si un détecteur a levé un `critical` (`ademCritical`). Un `warn` levé par un autre détecteur ne la bloque pas, et peut être effacé (voir 5.1).
- Quand `loweredBy` n'est pas vide, le plancher "retomber sur le produit" (ligne 396) ne s'applique plus. C'est ce qui permet à A1 à A4 de passer sous le produit.
- Les autres détecteurs ne baissent pas : `grep lower` ne trouve que A1 à A4. `pasted_message` indique en commentaire qu'il ne baisse jamais. `forwarded_value` (nouveau) ne fait que lever.
- Le plafonnement `intentPremise: 'warn'` (`evaluate_plus.mjs:363`) ne baisse pas sous le produit, il réduit seulement ce que les détecteurs lèvent. Il est inactif dans le serveur (option non passée). Mesuré : sur V2_DEV, mode `detectors`, il fait passer les arnaques ratées de 543 à 739 pour 35 fausses alertes de moins.
- Le réglage `HOLDUP_IG_KM` (défaut `warn`) fait le même genre de compromis : voir section 7.
- Chemins qui retombent sur le produit (sûrs) : erreur interne (ligne 413, produit ou "non vérifié" orange), détecteur en erreur ou en délai (il est ignoré, le niveau reste au moins la base), `HOLDUP_PLUS=0`.

## 4. Rejeu : combien de baisses ?

Commande : `sh pipeline_audit/rejouer_tout.sh` (détail section 10). Données : `out/cases.jsonl`, `out/baisses_detail.tsv` (id, détecteur, transition).

### 4.1 Modes demandés (`detectors`, `live`)

| Mode | Étiquette | n | niveau_plus < `plus.product` | niveau_plus < `server.evaluate` seul |
|---|---|---|---|---|
| detectors | arnaque | 6 443 | **0** | **0** |
| detectors | bénin | 2 785 | 0 | 165 (157 warn vers ok, 8 critical vers ok) |
| detectors | autre | 1 065 | 0 | 0 |
| live | arnaque | 6 443 | **0** | **0** |
| live | bénin | 2 785 | 0 | 165 (mêmes cas) |
| live | autre | 1 065 | 0 | 0 |

Les 165 bénins sont dus uniquement à la liste connue (chemin C), jamais à un détecteur. Familles : Aave supply/borrow/repay/withdraw et lots (88), BENQI sAVAX submit/redeem/request_unlock (57), permit EIP-2612 / increase_allowance / approve illimité vers un routeur listé (20). Aucun cas `loweredBy` ni `relaxedByFacts`. Ids : `out/baisses_detail.tsv`, lignes `detectors<TAB>serveur_seul`.

Hausses (pour mémoire, mode `detectors`) : 2 804 arnaques montent, 328 bénins montent, 630 "autres" montent.

### 4.2 Modes plus riches (hors demande, pour exercer B)

| Mode | Étiquette | baisses sous `plus.product` | Responsable |
|---|---|---|---|
| `detectors+known+intent+premise` | tous | 0 | |
| `live+known+intent+premise` | tous | 0 | |
| `full` (tout le contexte du banc, intention objet) | bénin | 55, tous warn vers ok | `extra.token_registry` (clé retirée : les 55 remontent) |
| `full` | arnaque | **1** : `jury_social#J-57`, critical vers ok | `extra.origin` (clé retirée : remonte à critical) |

`full` est le mode de parité du banc, pas la production. Il sert ici à montrer que B existe.

Cas J-57 : SIWE sur `https://xn--cre-ufa.app` (domaine IDN). Le serveur convertit l'origine en unicode (`domainToUnicode`) pour que la règle de domaine sosie la voie. Si `extra.origin` est fourni, il **remplace** cette valeur (ligne 150 : `X.origin !== undefined ? X.origin : unicodeHost`), en punycode brut. La règle ne voit plus rien, le niveau tombe à `ok`. C'est un trou de plomberie, pas une falsification : il suffit qu'un client passe `extra.origin = location.origin`.

## 5. Jugement : légitime ou trou ?

Critère : une baisse est légitime si elle repose sur un fait que la page ne peut pas fabriquer (donnée locale de l'utilisateur, liste statique livrée). C'est un trou si une attaque peut provoquer la baisse en fabriquant l'entrée, ou si la baisse viole la règle "jamais de vert".

Rappel du modèle de menace : la page contrôle la requête (`params`, `pageText`), pas l'origine ni les données locales. Le fournisseur `context_live/provider.mjs` lit la chaîne par `fetch` vers son propre RPC (`rpcUrl`, défaut RPC public d'Avalanche), pas via le provider du wallet. Donc la page ne falsifie pas ces lectures aujourd'hui. Cela cesserait d'être vrai si les lectures passaient par `window.ethereum`. Les cas ci-dessous marquent s'ils exigent cette hypothèse.

### 5.1 A1 dust_guard : légitime dans l'idée, deux défauts

Test synthétique 1a (`out/synthetic_lower.txt`) : paiement au contact du carnet alors qu'un sosie a envoyé 0,001 AVAX de poussière. Serveur seul : `critical` (address_poisoning, lookalike_address). evaluatePlus : **`ok`**, `loweredBy = dust_guard critical vers ok`.
- Défaut 1, violation de la règle : le résultat est vert (`niveau: info`). La règle produit dit "jamais ok". Même si le contact est le bon, le minimum devrait être `warn` (à confirmer).
- Défaut 2, trou de composition : test 1b. J'ajoute un détecteur qui lève un `warn`. dust_guard baisse quand même jusqu'à `ok` : le niveau final est vert alors qu'un détecteur a levé un warn. `otherWarn` ne regarde que le produit, pas les drapeaux des détecteurs. Exemple réaliste futur : `forwarded_value_hidden_recipient` (warn) effacé par une baisse de dust_guard sur un lot de paiements.
- Abus par la page : non direct. Il faut que le destinataire soit déjà au carnet ou payé. Un attaquant qui a déjà reçu un petit paiement (prétexte) et envoie de la poussière depuis un sosie de sa propre adresse n'obtient rien de plus (test 1c : déjà `ok` côté produit). Risque réel faible, mais la baisse à `ok` doit disparaître.

### 5.2 A2 intent_guard (montant) : trou exploitable, bug entre la doc et le code

L'en-tête du fichier dit "quand **chaque** lecture couvre le montant envoyé". Le code (`intent_guard.mjs:132-133`) utilise la lecture **la plus large** (`Math.max`). C'est le bon choix pour ne pas crier trop vite, c'est le mauvais pour baisser un `critical`.
- Test 2a : l'utilisateur tape "1,000" (un, en usage français). La demande envoie 1 000 AVAX. Lectures : 1 et 1 000. Couvert, donc `critical` vers `warn`. Mille fois le montant voulu s'affiche en orange.
- Abus concret : une page qui sait (par la langue du navigateur, ou en tentant plusieurs montants) que l'utilisateur tape "5,000" ou "2.500" avec une virgule ou un point décimal demande 1 000 fois plus. Même chose avec "1k" et "1m". La page choisit le montant, l'utilisateur a fixé l'ambiguïté. La page n'a rien à falsifier.
- Atteignable en production seulement si le client envoie une intention objet avec `amount` (test 2b : avec la chaîne `"pay"` que construit le serveur, le montant n'existe pas, le chemin est inerte).
- Verdict : trou. Correctif : baisser seulement si la plus petite lecture couvre aussi le montant (sinon laisser `critical`).

### 5.3 A3 / A4 nft_orders : peu atteignable, peu utile

- Le prix de référence vient de `intent.amount` (intention objet) ou de `extra.quote` (client). Sans l'un des deux, `priceOk` est faux, donc pas de baisse. Avec la chaîne `"pay"` du serveur, inerte.
- Rien ne vérifie la collection ni le nombre d'objets de l'offre : "tous NFT" suffit. Test 3b : 10 NFT de 10 collections contre 1 AVAX, avec intention "vendre, montant 1" : aucune baisse, mais aussi **aucune alerte** (le produit reste à `warn far_expiry`, `loweredBy` vide). Ce n'est pas une baisse, c'est une absence : un lot de 10 NFT au prix d'un reste orange, comme le listing d'un seul NFT (3a).
- A4 lit `extra.nft.collection`. Si un client remplit ce champ avec ce que la page dit vendre (DOM de la page), la page contrôle la baisse. À interdire.
- Verdict : légitime si `extra` vient d'une source de confiance, et probablement redondant avec F12 / F13 du produit. À supprimer ou à documenter comme non branché.

### 5.4 B relaxedByFacts : trou de conception

La règle "jamais sous le produit sans fait" est inversée en "librement sous le produit dès qu'un fait existe". Or `hasAnyFact` est vrai dès qu'un seul fait est lu (même `isContract` d'une adresse). Le plancher ne tient donc que parce que, **aujourd'hui**, les faits du fournisseur ne font qu'ajouter des raisons (mesuré : 0 baisse sous le produit en mode `live`, 0 sur les 12 falsifications). Il n'y a aucune protection structurelle.
- J-57 (arnaque, critical vers ok) : `extra.origin`. Trou de plomberie : un client peut désactiver la détection de domaine IDN. Correctif : jamais de surcharge de l'origine par `extra`; normaliser avant.
- 55 bénins warn vers ok par `extra.token_registry` : légitime seulement si ce registre est une liste statique livrée. `trustedAddresses` (détecteurs) range toute adresse du registre parmi les adresses "de confiance" (dust_guard, intent_guard, lookalike). Si un registre de jetons venait de la page ou du RPC, toute adresse y entrerait et deviendrait "connue" pour tous les détecteurs. À interdire pour tout ce qui n'est pas statique. (Aujourd'hui, `evaluate_plus.mjs:134-135` n'ajoute que `DEFAULT_TOKENS` quand la source est le fournisseur.)
- Cas "produit = unknown" : `rk('unknown') = 0.5`. Si le produit n'a pas pu lire (orange "non vérifié") et que la chaîne enrichie conclut `ok`, `relaxed` laisse passer le vert. Non observé dans DEV, possible par construction.

### 5.5 C liste known_protocols.json : légitime avec réserves

- Effet mesuré : 165 bénins DEV baissent face à `evaluate` seul, 0 arnaque. Familles : appels à sAVAX, Aave Pool, approve/permit à un routeur.
- Synthétique 5b : `sAVAX.submit()` avec 100 AVAX : serveur seul `warn`, evaluatePlus `ok`. 5c : `USDC.approve(UniversalRouter, illimité)` : serveur seul `critical`, evaluatePlus **`ok`** (vert). 5d : même approve vers un inconnu reste `critical`. Un sélecteur inconnu vers un protocole listé (5a) reste `warn`.
- Réserves : (1) c'est du vert (`info`), contraire à la règle "jamais de vert" ; (2) un appel reconnu vers l'adresse listée est traité comme sûr quelle que soit la destination des fonds dans ses paramètres. Je n'ai pas constaté d'abus : les appels Aave avec bénéficiaire contrôlé par l'attaquant (`supply onBehalfOf`, `withdraw to`, `depositETH onBehalfOf`, tests 4a à 4c) restent opaques pour le moteur et donnent `warn` ou `critical`, jamais `ok`. Si le moteur apprend ces sélecteurs sans lire le paramètre bénéficiaire, ce serait un trou ; (3) un contrat listé puis mis à jour (proxy) ou une entrée erronée devient une confiance silencieuse (`PATCHES_A_APPLIQUER.md` §7 note que d'autres adresses sont à vérifier) ; (4) `plus.product` ne mesure pas cette baisse : il faut comparer à `server.evaluate` seul.
- Verdict : légitime (liste statique, sources citées) mais à plafonner à `warn`, ou à traiter comme une règle du produit (donc à faire entrer dans `server.evaluate`, pour que "produit" et "produit interne" soient le même niveau).

## 6. Falsification des faits lus sur la chaîne

Script : `forge_facts.mjs`. Pour chaque cas, je rejoue `evaluatePlus` avec les faits "honnêtes" simulés (`liveLike` de `measure.mjs`), puis avec 12 variantes falsifiées. Réglage "plain" : ni liste connue ni intention. Réglage "known+intent" : liste du cas et intention du cas passées comme en production (`body.intent`, `intent_text`), `premise`.

Résultat commun : **`sous_produit = 0`** partout. Une falsification ramène au mieux le niveau produit. La conséquence est la perte de détection.

Arnaques (6 443), critiques perdues par rapport aux faits honnêtes :

| Falsification | plain : critical perdus (dont vers ok) | known+intent : critical perdus (dont vers ok) |
|---|---|---|
| solde énorme (`balances` / `sharePct` tiny) | 325 (121) | 249 (125) |
| tout contrat ancien (âge 5e7 blocs, `isContract` vrai) | 6 | 42 (11) |
| tous les faits absents | 513 (126) | 415 (145) |
| firstSeenByUser faux | 13 | 9 |
| décimales 36 (jeton) | 0 | 6 (1) |
| décimales 0, symbole USDC, jeton ancien, allowances vides, tout EOA | 0 | 0 |

(le "vers ok" signifie que le produit seul est déjà `ok` : l'arnaque passe sans alerte dans le produit actuel.)

Exemples concrets (`out/abuse_examples.txt`) :
1. `V2-ONCHAIN-00512`, `transferFrom` direct de 100 USDT vers une adresse inconnue, solde 80 %. Honnête : `critical` (`intent_guard:new_recipient_large_share`). Solde falsifié : `warn` (`kind_missing_unvouched_recipient`). Produit seul : `ok`. Mécanisme : le fait "part du solde" vient du RPC (`eth_getBalance`, `balanceOf`). Un RPC menteur annonce un solde énorme et la part tombe sous 50 %.
2. `V2-ONCHAIN-01079`, multicall qui cache un `transferFrom` d'USDC, 100 % du solde. Même effet : `critical` vers `warn`.
3. `V2-POISON-00641`, permit2 signé pour un site sosie metamask.click. Honnête : `critical` (`spend_rights:right_to_unvouched_spender`, car le spender est un contrat de moins d'un jour). Falsifié (âge annoncé 5e7 blocs) : `warn`. Remarque : même sans RPC menteur, un attaquant patient déploie son contrat un jour avant. Le seuil d'un jour est un fait réel que l'attaquant peut satisfaire.
4. `fuzzsig-01664`, permit2 transfer illimité : décimales annoncées à 36 par le contrat du jeton : `critical` vers `ok`. Ici le mensonge n'exige pas un RPC menteur : `decimals()` est servi par le contrat du jeton, donc par l'attaquant s'il en est l'auteur.

Faits qui ne viennent pas de la chaîne : `firstSeenByUser` est calculé en local (carnet et historique) par `liveFacts`; il n'est pas falsifiable par la page, seulement par une extension qui réécrirait l'historique.

Ce que contrôle réellement un attaquant sans toucher au RPC : le contenu de son propre jeton (`symbol`, `decimals`, `balanceOf`, `allowance`), l'âge de son contrat (attendre), l'existence de code (déployer ou non), les poussières envoyées à la victime (historique entrant). Ces faits sont honnêtes mais pas dignes de confiance.

## 7. Faux positifs : bénins relevés par les détecteurs

Définition : bénin dont le niveau `plus` est plus haut que le niveau de référence (`plus.product`). Chiffres sur le code actuel, `redteam/V2_DEV_norm.jsonl` seul (1 976 bénins), mode `detectors`, sorties `out/fp_v2dev.txt`, `out/fp_tous.txt`, `out/measure_v2dev.txt`.

### 7.1 Pourquoi 265 vers 663 est devenu 265 vers 361

`intent_guard` règle 5 (`kind_missing_unvouched_recipient`) était `critical` quand aucune intention n'est donnée. Il est maintenant `warn` par défaut (`HOLDUP_IG_KM`, `intent_guard.mjs:91`). Rejeu de `measure.mjs` sur V2_DEV, mode `detectors` :

| Réglage | fausses alertes (bénins rouges) | arnaques ratées |
|---|---|---|
| produit seul | 265 | 901 |
| `detectors`, défaut actuel (KM warn) | **361** | 543 |
| `detectors`, `HOLDUP_IG_KM=critical` | 631 | **156** |
| `detectors+known` | 0 | 486 |
| `detectors+known+intent+premise` | 20 | 418 |
| `live`, défaut actuel | 418 | 211 |
| `live`, `HOLDUP_IG_KM=critical` | 631 | **34** |
| `live+known+intent+premise` | 20 | 182 |

Le 663 de la demande n'est pas reproduit exactement (631 avec le défaut précédent sur le code actuel). Il vient d'un état antérieur. Le changement KM a un coût : passer la règle 5 en `warn` fait **passer de 156 à 543 les arnaques ratées** (V2_DEV, `detectors`). Le gain n'est pas gratuit.

Deux faits pour guider la réduction :
- Presque tout le bruit vient de ce que le banc ne donne ni liste connue ni intention : avec `known+intent+premise`, les fausses alertes tombent à 20 (celles du produit seul, mêmes cas).
- La liste connue seule (`detectors+known`) amène les fausses alertes à 0 pour 57 arnaques ratées de moins que sans (543 vers 486).

### 7.2 Par détecteur et par code (V2_DEV, bénins, défaut actuel)

Mode `detectors` (230 bénins relevés : 101 vers critical, 129 vers warn) :

| Rang | Détecteur : code | Niveau | Bénins |
|---|---|---|---|
| 1 | intent_guard : `kind_missing_unvouched_recipient` | warn | 129 |
| 2 | spend_rights : `swap_no_min_unknown_router` | critical | 66 |
| 3 | sig_rights : `signed_right_not_intended` | critical | 35 |

Mode `live` (325 relevés : 158 vers critical, 167 vers warn, dont 52 sans détecteur, levés par le moteur avec le solde) :

| Rang | Détecteur : code | Niveau | Bénins |
|---|---|---|---|
| 1 | intent_guard : `kind_missing_unvouched_recipient` | warn | 115 |
| 2 | spend_rights : `swap_no_min_unknown_router` | critical | 66 |
| 3 | intent_guard : `new_recipient_large_share` | critical | 49 |
| 4 | sig_rights : `signed_right_not_intended` | critical | 35 |
| 5 | spend_rights : `right_to_unvouched_spender` | critical | 28 |
| 6 | (sans détecteur : levé par le moteur avec le solde, code non relevé) | warn | 52 |

Sur V2_DEV, seuls trois détecteurs (intent_guard, spend_rights, sig_rights) relèvent des bénins, pour cinq codes. Sur l'ensemble des jeux s'ajoute indirect_pull (4 bénins, `pull_via_existing_allowance`). Les autres détecteurs n'en relèvent aucun. Il n'y a donc pas de "top 10" de détecteurs : le top 10 ci-dessous est en familles de cas.

Top 10 familles (V2_DEV, `detectors`, C = rouge, W = orange) :
1. W `benign_everyday/first_payment_in_person` : 59
2. C `benign_defi/swap_uniswap_ur` : 36
3. W `benign_everyday/donation` : 32
4. C `benign_defi/swap_uniswap_eth_direct` : 30
5. C `benign_defi/permit2_signature` : 20
6. W `benign_defi/bridge_core_eth_to_avax` : 18
7. C `benign_defi/permit_eip2612_router` : 15
8. W `benign_defi/wrap_deposit` : 7
9. W `benign_defi/swap_uniswap_eth_direct` : 6
10. W `benign_defi/wrap_withdraw` : 3

En mode `live`, s'y ajoutent `nft_purchase_seaport` (27 C), `self_transfer_large` (17 W) et `p2p_contact_prefix_twin` (14 W) ; en réglage `live+known+intent+premise` : `payroll_sendcalls_batch` (12 W).

### 7.3 Ce que coûte de retirer chaque détecteur (V2_DEV, `--skip`, `out/ablation_detecteurs_v2dev.txt`)

| Détecteur retiré | Mode | fausses alertes | ratées | Lecture |
|---|---|---|---|---|
| (aucun) | detectors | 361 | 543 | |
| (aucun) | live | 418 | 211 | |
| intent_guard | live | 373 (-45) | 375 (+164) | garder : 164 arnaques pour 45 faux rouges |
| spend_rights | detectors | 295 (-66) | 597 (+54) | règle `swap_no_min_unknown_router` à affiner |
| sig_rights | detectors | 326 (-35) | 775 (+232) | garder : 232 arnaques pour 35 faux rouges |
| indirect_pull | live | 418 (0) | 211 (0) | neutre en live, 11 ratées de plus en `detectors` |

Pistes ordonnées par rendement :
1. `swap_no_min_unknown_router` (66 faux rouges, 54 arnaques) : ce sont des swaps Uniswap (`swap_uniswap_ur` 36, `swap_uniswap_eth_direct` 30). Sur 91 cas Uniswap de V2_DEV, 58 sont sur la chaîne 1, où `known_protocols.json` est vide ; sur la chaîne 43114 la liste n'a que quelques routeurs (pas LFJ, Pangolin, 1inch, Paraswap, Odos : `PATCHES_A_APPLIQUER.md` §7). Compléter la liste avec sources officielles élimine sans doute l'essentiel sans toucher le détecteur (non mesuré).
2. `signed_right_not_intended` (35 faux rouges) : permit2 / EIP-2612 vers un routeur ; même remède (liste) et l'intention "j'échange" (`PATCHES_A_APPLIQUER.md` §3, 180 cas passent de rouge à orange).
3. `kind_missing_unvouched_recipient` (129 orange) : premier paiement, don, pont. C'est un warn, déjà bas. Réduire seulement avec l'intention "je paie quelqu'un de nouveau" du côté extension.
4. `new_recipient_large_share` (49 rouges, `live` seulement) : dépend du solde lu. Plafonner à `warn` quand le destinataire est le compte lui-même ou un protocole listé (`self_transfer_large` : 17).

## 8. Recommandations (courtes)

1. A1 : ne jamais baisser jusqu'à `ok` ; plancher `warn`. Ne baisser que si **aucun** autre détecteur n'a levé quelque chose (pas seulement aucun critical).
2. A2 : exiger que la plus petite lecture couvre le montant, sinon garder `critical`.
3. A3 / A4 : supprimer, ou n'accepter `extra.quote` / `extra.nft` que d'une source de confiance ; vérifier collection et nombre d'objets.
4. B : retirer `relaxedByFacts` (toujours `final >= pLevel`), ou limiter la baisse à des faits nommés. Interdire que `extra` surcharge `origin`, `token_registry`, `known_protocols`.
5. C : ranger la liste dans `server.evaluate` (même niveau pour "produit" et "produit interne"). Plafonner à `warn` si on veut respecter "jamais de vert".
6. Ajouter un test de non-régression : pour chaque cas, `niveau_plus >= server.evaluate seul` (modèle : `pipeline/test/evaluate_plus.test.mjs`), avec un cas qui active chacune des baisses de la section 5 (`synthetic_lower.mjs`).
7. Ne jamais lire les faits via le provider du wallet. Garder le `fetch` direct vers un RPC choisi par l'extension.
8. Les faits renvoyés par un contrat de jeton (`decimals`, `symbol`, `balanceOf`) ne doivent jamais baisser un niveau, seulement le lever.

## 9. Limites

- Les jeux DEV sont des jeux de réglage (les règles ont été écrites en les regardant). "0 baisse sur arnaque" ne dit rien du jeu aveugle. V2_TEST n'a pas été touché.
- Le mode `live` de `measure.mjs` simule les faits à partir des champs du cas (`counterparty_facts`, `token_info`, `share_of_balance_pct`). Aucun RPC réel n'a été appelé. Les falsifications sont des modifications de cette structure, pas de vraies réponses RPC.
- Les 12 variantes de falsification sont celles que j'ai pensées. Une variante plus fine (falsifier un seul fait pour un seul cas) peut faire mieux. Le résultat "jamais sous le produit" est empirique, pas prouvé.
- Les scénarios synthétiques (`synthetic_lower.mjs`) sont écrits par moi. Ils montrent qu'un chemin est atteignable, pas sa fréquence. Les baisses A2 à A4 exigent une intention objet ou `extra` : je n'ai pas vérifié si l'extension actuelle les envoie.
- Le code a bougé pendant l'audit. Les premiers rejeux (avant 05:37) avaient d'autres chiffres (par exemple 663 fausses alertes). Seul l'état figé par `snapshot_sha256.txt` fait foi.
- J'ai écarté de l'analyse les familles `autre` (fraude_conforme, ambigu) dans les décomptes d'arnaques. Elles ne montrent aucune baisse non plus.
- Le classifieur de message collé (`pasted_message`, `HOLDUP_CLASSIFIER`) est éteint dans tous les rejeux.
- Le produit lui-même contient des règles qui baissent avec la liste connue (F1, F2, F13, F15, F16, F19, F20, F3, F4 dans `run/policy.mjs`). Elles sortent du périmètre "plus contre produit" mais contredisent aussi la règle "jamais de vert". À traiter avec la section 5.5.

## 10. Rejouer

Depuis `research/titouan/T_banc_e2e` (un seul processus node à la fois, environ 20 minutes) :

```
sh pipeline_audit/rejouer_tout.sh
```

Ou pas à pas :

```
# 1. mesure demandée (modes product, detectors, live)
node pipeline/measure.mjs redteam/V2_DEV_norm.jsonl redteam/jury_*.jsonl attacks/DEV.jsonl --modes=product,detectors,live
# 2. détail par cas (écrit pipeline_audit/out/cases.jsonl)
node pipeline_audit/audit_lowered.mjs --modes=detectors,live,full,detectors+known+intent+premise,live+known+intent+premise --file=cases.jsonl $(cat pipeline_audit/FILES.txt)
node pipeline_audit/analyse.mjs
node pipeline_audit/analyse_vs_serveur.mjs
node pipeline_audit/analyse_fp.mjs V2_DEV_norm.jsonl
# 3. causes des baisses du mode full
node pipeline_audit/ablate_full.mjs
node pipeline_audit/ablate_extra_keys.mjs
# 4. falsification des faits
node pipeline_audit/forge_facts.mjs $(cat pipeline_audit/FILES.txt)
node pipeline_audit/forge_facts.mjs --known-intent $(cat pipeline_audit/FILES.txt)
node pipeline_audit/abuse_examples.mjs
# 5. cas synthétiques des chemins de baisse
node pipeline_audit/synthetic_lower.mjs
# 6. coût de chaque détecteur
node pipeline/measure.mjs redteam/V2_DEV_norm.jsonl --modes=detectors,live --skip=intent_guard
# 7. effet du réglage KM
HOLDUP_IG_KM=critical node pipeline/measure.mjs redteam/V2_DEV_norm.jsonl --modes=detectors,live
```

Remarque : lors de ma première exécution de `rejouer_tout.sh`, l'étape `audit_lowered` n'a pas produit son fichier (cause non élucidée, le code était en train de changer). Je l'ai relancée à la main avec la même commande. Le script utilise maintenant `--file=cases.jsonl` (non rejoué en entier après cette correction, seule l'étape `audit_lowered` a été revérifiée sur `attacks/DEV.jsonl`). Les sorties du rejeu dans `out/` : `cases.jsonl`, `baisses_detail.tsv`, `analyse.txt`, `fp_v2dev.txt`, `fp_tous.txt`, `forge_plain.json`, `forge_known_intent.json`, `abuse_examples.txt`, `synthetic_lower.txt`, `measure_v2dev.txt`, `measure_tous.txt`, `ablation_detecteurs_v2dev.txt`.

Scripts de `pipeline_audit/` : `audit_lowered.mjs`, `analyse.mjs`, `analyse_vs_serveur.mjs`, `analyse_fp.mjs`, `ablate_full.mjs`, `ablate_extra_keys.mjs`, `forge_facts.mjs`, `abuse_examples.mjs`, `synthetic_lower.mjs`, `dbg_order.mjs` (vérifie l'absence de dépendance à l'ordre des appels), `rejouer_tout.sh`. Ils importent `measure.mjs` et `evaluate_plus.mjs` sans les modifier.

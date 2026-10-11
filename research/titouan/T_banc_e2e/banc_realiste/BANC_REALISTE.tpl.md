# BANC « EN CONDITIONS RÉELLES » (réponse à MSG-056)

Question posée : le banc donne aux règles un contexte (âge du contrat, solde, informations de jeton, carnet, historique, protocoles connus) que le serveur local et l'extension n'ont pas. Que voit le PRODUIT, et que devient la détection sans ce contexte ?

Réponse en une phrase : **la détection « critical + warn » baisse de 99,2 % à 83,8 % (configuration par défaut), la détection critical de 92,0 % à 71,3 %, et surtout les fausses alertes critical passent de 0,9 % à 13,9 % et les fausses alertes warn+critical de 15,4 % à 54,2 %.** Le « warn » devient quasi inutile (54 % des requêtes bénignes contre 84 % des malveillantes). Le contexte réseau n'est pas la première cause : c'est l'absence de liste statique de protocoles connus (5 adresses seulement dans le produit) et de carnet/historique.

Tout ce qui suit est mesuré sur des cas SYNTHÉTIQUES écrits par nous (voir section 8).

## 1. Ce qui a été mesuré

- Jeux : `attacks/DEV.jsonl` (385 cas), `attacks_public/PUBLIC.jsonl` (144), `blind_adem/v2/V2_DEV.jsonl` (5927, normalisé par `redteam/normalize_v2.mjs`). Total 6456 cas : 3254 malveillants, 2136 bénins, 821 « fraude conforme », 245 ambigus. TEST et V2_TEST ne sont jamais lus (le script n'ouvre jamais ces fichiers). Le jeu V2_DEV pèse 91 % des cas : toujours lire aussi les chiffres par jeu.
- Pipeline : le même que `run/run_loop.mjs` (moteur d'effets, `rules_extra`, comparateur d'Adem, `policy.mjs`), logique recopiée sans modification. Le script passe chaque cas dans 20 niveaux de contexte (`run_realiste.mjs`). Auto-contrôle : le niveau ALL (tout le catalogue reconstruit par le chemin « produit ») redonne exactement le banc complet, 0 différence sur 6456 cas (`out/autocontrole_ALL_vs_FULL.json`). Le tableau des champs est dans `CONTEXTE_PRODUIT.md`.
- Niveaux principaux : **FULL** = banc complet ; **A** = aucun contexte ; **B** = contexte du produit par défaut (origine, chaîne, 5 adresses canoniques, 4 jetons, carnet et historique vides) ; **C** = B + carnet et historique SORTANT saisis par l'utilisateur ; **D** = C + liste statique de protocoles et de jetons livrée avec le produit (borne haute, voir 8).
- Bras d'intention : `sans_intention` (plancher du moteur), `intention_honnete` (dérivée des effets), `intention_mensongere` (celle du catalogue, comme `run_loop`), et un bras ajouté, **`intention_produit`** : l'intention du catalogue réduite à ce que l'extension sait exprimer (payer, se connecter, « on me l'a demandé » ; échange et envoi à mon compte deviennent « aucune intention »). Les chiffres « conditions réelles » de ce document sont ceux de `intention_produit`, qui est le seul bras où ni le contexte ni l'intention ne sont plus riches que dans le produit. Dans ce bras, FULL et B partagent la même intention : l'écart FULL - B vient du contexte seul.
- Version mesurée : copie des fichiers lus dans `snapshot/` (un autre agent modifie `engine/` et `run/policy.mjs` pendant la mesure ; les passages précédents, faits sans copie, ont d'ailleurs été écartés pour cette raison). Hash SHA-256 (12 premiers caractères) : `engine.mjs` 3c2de1406af6, `rules.mjs` 75914eca31de, `rules_extra.mjs` 9c10cdbf81af, `typed.mjs` 2fe3bab036d1, `fixes.mjs` 968790ecc1df, `calldata.mjs` 994b969530cd, `compare.ts` b8bf8c71bb0b, `policy.mjs` a1cb1a0bcf02, `normalize_v2.mjs` 4bd964c1f9af ; liste complète et hash des sources en début et fin de mesure dans `out/versions.json`. `POLICY_FIXES` non défini (liste KEPT). Aucun fichier de `engine/` ni `run/` n'a été modifié par ce travail.

## 2. Résultat principal : l'écart entre le banc avec contexte et les conditions réelles

Lecture : « rappel » = malveillants avec verdict warn ou critical ; « rappel critical » = critical seul ; « FA » = bénins en warn ou critical (« FA critical » = critical seul). Intervalles de Wilson 95 %.

| bras `intention_produit`, TOUS jeux | FULL (banc complet) | C (carnet + historique saisis) | B (produit par défaut) | A (rien) | D (C + liste statique livrée) |
|---|---|---|---|---|---|
| rappel (n=3254) | 99,2 % [98,8-99,5] | 91,9 % [91,0-92,8] | **83,8 % [82,5-85,0]** | 81,2 % [79,8-82,5] | 90,1 % [89,1-91,1] |
| rappel critical | 92,0 % [91,0-92,9] | 79,5 % [78,1-80,9] | **71,3 % [69,7-72,9]** | 67,9 % [66,3-69,5] | 80,5 % [79,1-81,8] |
| FA critical (n=2136) | 0,9 % [0,6-1,4] | 13,7 % [12,3-15,2] | **13,9 % [12,5-15,4]** | 13,9 % [12,5-15,4] | 0,9 % [0,6-1,4] |
| FA warn+critical | 15,4 % [13,9-17,0] | 54,2 % [52,1-56,3] | **54,2 % [52,1-56,3]** | 55,7 % [53,6-57,8] | 17,1 % [15,6-18,7] |
| bénins jugés « opaques » (non décodables) | 67 (3,1 %) | 666 (31,2 %) | 666 (31,2 %) | 666 (31,2 %) | 156 (7,3 %) |

Même mesure avec l'intention du catalogue (`intention_mensongere`, comparable à la boucle d'amélioration) : rappel 99,4 % (FULL) -> 95,3 % (B) ; rappel critical 94,2 % -> 84,4 % ; FA critical 1,0 % -> 25,8 % ; FA warn+critical 19,1 % -> 64,5 %. Ici les fausses alertes critical sont plus hautes (25,8 %) parce que le banc fait dire au comparateur « envoi à mon compte / première fois vu » (intention `send_to_my_account`) que le produit ne sait pas exprimer ; c'est le bras du banc, pas celui du produit.

Par jeu (bras `intention_produit`, rappel / rappel critical / FA critical / FA warn+critical) :

| jeu | FULL | C | B |
|---|---|---|---|
| DEV (252 malv., 90 bénins) | 98,8 / 86,1 / 0,0 / 11,1 | 91,7 / 80,2 / 0,0 / 43,3 | 85,3 / 73,8 / 5,6 / 43,3 |
| PUBLIC (72 malv., 70 bénins) | 84,7 / 68,1 / 0,0 / 25,7 | 76,4 / 66,7 / 10,0 / 50,0 | 70,8 / 61,1 / 10,0 / 50,0 |
| V2_DEV (2930 malv., 1976 bénins) | 99,6 / 93,1 / 1,0 / 15,2 | 92,4 / 79,8 / 14,4 / 54,9 | 84,0 / 71,4 / 14,4 / 54,9 |

(Wilson, k et n de chaque case dans `out/resultats_totaux.json` et les tableaux ci-dessous.)

### 2.1 Tableaux complets, bras `intention_produit` (totaux : attrapé critical, attrapé warn, raté, inconnu, opaque, fausses alertes, fraude conforme)

La colonne « opaque (dont attrapés par opacité seule) » compte les malveillants que le moteur n'a pas su décoder en entier, entre parenthèses ceux qui ne sont attrapés que parce que l'opacité déclenche un warn. « inconnu » = méthode non gérée (9 cas PUBLIC : Solana, Tron, surcharge de `window.ethereum`, etc.), compté comme NON attrapé.

{{inc:out/TAB_TOTAUX_produit.md}}

### 2.2 Mêmes tableaux, bras `intention_mensongere` (intention du catalogue)

{{inc:out/TAB_TOTAUX_catalogue.md}}

## 3. Par famille

Tous les champs demandés (attrapé critical / attrapé warn / raté / inconnu / fausse alerte critical et warn / opaque, avec n et Wilson) sont publiés famille par famille et par niveau FULL, A, B, C dans `out/DETAIL_FAMILLES_produit.md` (bras `intention_produit`) et `out/DETAIL_FAMILLES_catalogue.md` (bras du catalogue), y compris pour les 149 sous-familles de V2. Les données brutes sont dans `out/resultats_par_famille.json`. Version condensée (rappel k/n par niveau, écart FULL - B en points, fausses alertes, ratés B, inconnus B, opaques B) :

{{inc:out/TAB_FAMILLES_produit.md}}

## 4. Les 10 familles où l'écart est le plus grand, et ce qui rétablirait la détection

Critère : écart de rappel FULL - B en points (bras `intention_produit`), unités à au moins 5 malveillants ; pour V2 l'unité est la sous-famille (les familles V2 sont trop larges). Tableau complet, avec aussi le classement par nombre absolu de détections perdues, dans `out/TOP10_produit.md` (versions pour le bras du catalogue dans `out/TOP10_catalogue.md`). « rest. X » = nombre de détections perdues en B (attrapées en FULL) qui sont de nouveau attrapées quand on ajoute X à C ; « rest. C » = récupérées par le carnet et l'historique seuls.

{{inc:out/TOP10_produit.md}}

### 4.1 Lecture famille par famille : information minimale, coût, qui peut l'obtenir

Coût = appels JSON-RPC par vérification (mesuré sur la structure de chaque requête : une contrepartie sans nature connue = 1 `eth_getCode` ; un jeton sans métadonnées = 2 appels ; un solde = 1 appel par monnaie sortante). Un lot JSON-RPC est un seul aller-retour HTTP. Ces appels n'ont PAS été exécutés (aucun réseau) : ce sont des décomptes.

| # | famille (perdus / n en B) | ce qui rétablit la détection (mesuré) | lecture réseau minimale et coût moyen | serveur local | extension autonome (CSP sans réseau) |
|---|---|---|---|---|---|
| 1 | onchain/multicall_depth1_transferFrom (16/16) | le solde seul (16/16) : le seul signal est `high_balance_share`, une heuristique de part du solde, pas la reconnaissance du transfert imbriqué | `eth_getBalance` + `balanceOf(utilisateur, jeton)` : 1,0 appel solde par vérification | oui, mais l'adresse de l'utilisateur part vers le RPC : consentement | seulement via le fournisseur du portefeuille (voir 6) |
| 2 | DEV/adresse_empoisonnee (15/15) | le carnet et l'historique seuls (15/15) | aucune lecture : saisie utilisateur (ou historique local automatique, voir 7) | sans objet | sans objet |
| 3 | onchain/multicall_depth3_transferFrom (15/15) | le solde seul (15/15) | idem 1 | idem 1 | idem 1 |
| 4 | onchain/multicall_depth2_transferFrom_aggregate3 (11/11) | le solde (11/11), ou un signalement de sosie par indexeur (11/11) | idem 1 | idem 1 | idem 1 |
| 5 | onchain/multicall_depth2_transferFrom (8/8) | le solde seul (8/8) | idem 1 | idem 1 | idem 1 |
| 6 | DEV/honeypot (6/6) | la simulation de vente seule (6/6) ; ni la nature, ni l'âge, ni les soldes n'y font rien | PAS une lecture simple : `eth_call` de vente simulée (surcharge d'état, non offerte par tous les RPC) ou service tiers ; 2 à 4 appels, plus un routeur à connaître | possible si le RPC accepte la surcharge d'état | non |
| 7 | poison_sites_tokens/addr_poison_dust_after_send (65/93) | le carnet et l'historique seuls (65/65) | aucune lecture réseau minimale ne remplace l'historique de l'utilisateur ; l'indexeur de transferts entrants n'est pas une lecture simple (`eth_getLogs`) | sans objet | sans objet |
| 8 | poison_sites_tokens/token_fake_usdc_same_symbol (42/61) | symbole + registre de référence seuls (42/42) | `symbol()` (+ `decimals()`) du jeton : 2 appels par jeton inconnu (1,5 appel jeton en moyenne dans cette famille) ; ne dévoile que l'adresse du jeton | oui | via le fournisseur du portefeuille |
| 9 | poison_sites_tokens/addr_poison_fake_token_lookalike (61/91) | le carnet et l'historique seuls (61/61) | idem 7 | sans objet | sans objet |
| 10 | poison_sites_tokens/addr_poison_zero_transferFrom (58/87) | le carnet et l'historique seuls (58/58) | idem 7 | sans objet | sans objet |

Quatre familles qui suivent immédiatement dans le classement par pertes absolues : `clipboard_swap` (51 perdues ; carnet 19, solde 39, signalement sosie 40), `addressbook_poisoned` (47 ; carnet 43, solde 47), `token_honeypot` (25) et `token_sell_tax_99` (23), restaurables par la seule simulation de vente (pas une lecture simple), et `fake_site_lookalike_domain` (20 perdues, restaurées par le site attendu `claimed_site`, que rien dans le produit ne fournit).

Constat net : sur ces 10 familles, **4 sont rétablies par le carnet / l'historique (aucune lecture réseau), 4 par un solde (consentement), 1 par un symbole de jeton, 1 par une simulation de vente que ni `eth_getCode`, ni l'âge, ni les soldes ne remplacent**. Les lectures `eth_getCode` et âge du contrat n'ajoutent rien, au-delà du niveau C, à aucune de ces 10 familles.

## 5. Pourquoi les fausses alertes explosent

Les fausses alertes ne viennent presque pas du réseau. Dans le bras produit, les 297 bénins critical en B portent surtout les codes `external_spender` (200), `unlimited_allowance` (130), `unlimited_approval_swap` (105), `domain_verifier_unexpected` (75), `unexpected_outgoing` (75), `approval_for_all` (60), `unexpected_approval_connect` (60) : des droits donnés à des routeurs, places de marché NFT, ponts et pools légitimes que le produit ne connaît pas (5 adresses). Ajouter la liste statique (niveau D) supprime les 297 sauf 20 qui sont aussi critical dans le banc complet. Le carnet et l'historique (niveau C) ne les enlèvent pas (292 restent) ; ils traitent d'autres fausses alertes, propres au bras du catalogue (`self_transfer_large`, `exchange_deposit_known`, `depot_exchange` : FA critical 552 -> 375, soit 177 de moins).

À côté, 666 requêtes bénignes sur 2136 (31 %) sont « opaques » en B (`unknown_selector`, `opaque`) : sans protocole de confiance connu, le moteur ne décode pas l'appel et lève un warn. C'est la cause principale des 54 % de fausses alertes warn+critical. Le niveau D ramène les opaques bénins à 156 (7 %).

Détail des unités concernées et des causes : `out/TOP10_produit.md` (fin du fichier) et `out/fausses_alertes_causes.json`.

## 6. Proposition chiffrée : « contexte minimal en ligne » optionnel

Cadre (reprend les contraintes demandées) :

1. **Optionnel et désactivé par défaut.** Au premier usage, l'écran des options liste ce qui est lu et ce qui sort de la machine.
2. **Lectures, en un seul lot JSON-RPC** (un aller-retour) : R1 `eth_getCode(contrepartie)` pour chaque contrepartie dont la nature est inconnue ; R2 sonde d'âge (`eth_getCode` à un bloc ancien, nœud archive requis ; exactitude de l'âge hors de portée d'un appel simple) ; R3 `symbol()` et `decimals()` des jetons sans métadonnées ; R4 `eth_getBalance` / `balanceOf` de l'utilisateur pour les monnaies sortantes.
3. **Délai limite 3 s pour tout le lot.** Au-delà, ou en cas d'erreur, chaque champ manquant reste `undefined` : le verdict est celui du niveau C, « inconnu » étant déjà géré par le moteur. **Jamais bloquant** : le verdict hors ligne s'affiche tout de suite et n'est que RELEVÉ (jamais abaissé) si une lecture arrive à temps.
4. **Confidentialité.** R1 à R3 n'envoient que des adresses de contrats et de jetons, jamais l'adresse de l'utilisateur. R4 envoie l'adresse de l'utilisateur : consentement séparé, désactivé par défaut. Aucun envoi à un autre tiers que le RPC choisi par l'utilisateur.
5. **Canal.** Préférer le fournisseur du portefeuille (la requête de lecture passe par le même `provider.request` que le portefeuille utilise déjà ; `extension/inject.js` fait déjà un `eth_chainId` avec un délai de 800 ms par ce chemin) : aucun nouveau tiers, aucun changement de CSP pour l'extension autonome. Réserve : la réponse transite par le contexte de la page, qui peut la falsifier ; les lectures ne doivent donc servir qu'à AJOUTER des signaux. Sinon, le serveur local appelle un RPC choisi par l'utilisateur (`engine/src/rpc.mjs` existe : lecture seule, cache disque), ce qui ajoute un tiers voyant l'IP de l'utilisateur et les adresses lues. L'extension autonome (`connect-src 'none'`) ne peut pas le faire sans changer son manifeste, donc sans renier « aucun accès réseau » ; je ne le recommande pas.

Effet mesuré hors ligne (bras `intention_produit`, TOUS jeux, en donnant au moteur les champs du catalogue qui correspondent à chaque lecture ; c'est un oracle : tous les appels réussissent, aucune latence, aucune erreur) :

{{inc:out/EN_LIGNE_produit.md}}

Lecture honnête de ces chiffres :

- Les lectures en ligne rapportent peu : de 91,9 % (C) à 96,6 % (O4) de rappel, soit +4,7 points pour 3,4 appels en moyenne (p95 = 7, maximum 19). Les deux tiers du gain viennent du solde (R4), c'est-à-dire de l'adresse de l'utilisateur. `eth_getCode` seul (O1) ne change aucun chiffre global.
- Elles ne règlent pas les fausses alertes : FA critical 13,7 % avant, 13,7 % après (le critical vient des protocoles non connus, pas de la nature des contrats) ; FA warn+critical 54,2 % -> 52,6 %.
- La liste statique livrée (D, aucun appel, aucune fuite) fait bien plus pour les fausses alertes (FA critical 0,9 %, warn+critical 17,1 %) mais baisse un peu le rappel (90,1 %, parce qu'un protocole « connu » n'est plus signalé) ; elle élève toutefois le rappel critical (80,5 % contre 79,5 %).
- D + toutes les lectures (D_O4) : rappel 95,1 %, rappel critical 82,8 %, FA critical 0,9 %, FA warn+critical 15,4 % (= le banc complet). Il reste 4,1 points de rappel et 9,2 points de rappel critical d'écart avec le banc complet : ce sont le site attendu (`claimed_site`), la simulation de vente et les taxes, la cotation attendue, le signalement de sosie par indexeur et l'historique entrant, que ni une lecture simple ni une liste statique ne donnent.
- **Priorités** : (1) liste statique de protocoles et de jetons par chaîne, livrée et mise à jour avec le produit ; (2) enregistrer localement les adresses payées (historique sortant automatique) : le niveau C vaut +8,1 points de rappel, mais le produit ne l'a aujourd'hui que si l'utilisateur le saisit à la main ; (3) seulement ensuite, lectures R3 puis R4 via le fournisseur du portefeuille.

Effet par famille (25 plus gros gains O4 - C) : voir le tableau dans le fichier inclus ci-dessus ; en résumé, `token_fake_usdc_same_symbol` 19 -> 61 attrapés par R3, `clipboard_swap` 58 -> 78, les quatre familles `multicall_*_transferFrom` 0 -> 8 à 16 par R4, `fake_site_lookalike_domain` 149 -> 160 par R4. Les autres familles gagnent 5 cas ou moins.

## 7. Observations sur le produit (à vérifier côté équipe)

- Le produit ne construit aucun historique lui-même : `history` n'est rempli que si l'utilisateur colle du JSON dans les options. Or les 4 familles d'empoisonnement d'adresse de ce top 10 sont détectées à 0 % - 33 % en B (carnet vide) et à 100 % en C (carnet rempli). Un historique local automatique (adresses des transactions que l'utilisateur confirme, enregistrées sans réseau) serait la correction la plus rentable de cette liste.
- `historyKnown` vaut vrai dès que les tableaux existent, même vides : en l'absence de carnet, toute adresse est « jamais vue ». Avec une intention `send_to_my_account` cela donne un critical (`first_seen_recipient`) : 214 cas dans le bras du catalogue. Le produit n'a pas cette intention, mais si elle est ajoutée, il faut alors un carnet.
- `codeOf` ne renvoie jamais `false` dans le produit : la règle `approval_to_eoa` (critical) ne peut pas se déclencher.
- Des protections propres au produit (pression dans le texte de la page, règle `seaportCrit` du serveur, « intention vague => danger » de l'extension) ne sont pas dans ce banc : les chiffres ci-dessus ne les comptent pas.

## 8. Honnêteté

- **Le catalogue est synthétique et écrit par nous.** DEV est écrit par l'auteur du moteur (non aveugle) ; PUBLIC est un jeu de régression de techniques publiques ; V2 a été écrit par d'autres agents, mais dans le même projet et avec les mêmes idées de menaces. Les contextes (`counterparty_facts`, `token_info`, listes de protocoles) sont de la main du même auteur que les cas : ils sont plus propres que la réalité.
- **Les chiffres « conditions réelles » sont plus mauvais que ceux de la boucle d'amélioration, et c'est le point.** La boucle d'amélioration mesure DEV avec le contexte complet (98,8 % - 100 % de rappel). Dans le produit tel qu'il est, DEV tombe à 85,3 % (bras produit), PUBLIC à 70,8 %, V2 à 84,0 %.
- **Le niveau C est optimiste** : il suppose que l'utilisateur a saisi dans les options les bonnes adresses et les bons paiements. Le niveau réaliste du produit livré est B.
- **Le niveau D est une borne haute** : la liste de protocoles du catalogue contient exactement les protocoles que les cas bénins utilisent (douze adresses « S » de DEV sont synthétiques, les V2 sont des adresses réelles choisies par leurs auteurs). Un produit réel aura toujours des protocoles hors liste ; les fausses alertes d'un vrai D seront entre celles de B et celles du tableau.
- **La part de bénins du catalogue n'est pas un échantillon de trafic.** Les bénins V2 sont riches en approbations, signatures de marchés NFT et ponts (là où le produit sans liste crie). Les taux de fausses alertes absolus dépendent de ce mélange, pas seulement de la qualité du produit.
- **Le rappel « warn + critical » est généreux.** Un warn quelconque compte comme attrapé ; en B, 54 % des bénins reçoivent aussi un warn ou un critical. Le seul indicateur discriminant est le critical : 71,3 % de malveillants contre 13,9 % de bénins.
- **Les lectures en ligne sont simulées par un oracle** (le champ du catalogue) : pas de latence, pas d'erreur de RPC, pas de nœud sans archive, pas de falsification. Les coûts en appels sont des décomptes structurels, pas des mesures réseau ; le délai de 3 s n'est pas testé. L'âge exact d'un contrat n'est pas une lecture simple : le décompte (une sonde par contrepartie) sous-estime le coût réel d'un facteur 20 si l'on veut la date.
- **L'intention du produit est une réduction du catalogue** (bras `intention_produit`), pas l'intention d'un vrai utilisateur : un utilisateur peut cliquer « autre » ou ne pas répondre.
- Les ambigus (245) et la fraude conforme (821) sont dans les tableaux, mais hors des taux de rappel et de fausses alertes.
- Les fichiers `engine/` et `run/policy.mjs` changent pendant que ce travail se fait : les chiffres valent pour la version hachée en section 1. Une version ultérieure peut donner autre chose ; il suffit de relancer `node run_realiste.mjs` puis `ARM=intention_produit node analyse.mjs` (et `ARM=intention_mensongere node analyse.mjs`).

## 9. Fichiers

- `run_realiste.mjs` : le banc (copie des fichiers lus dans `snapshot/`, 20 niveaux, écrit `out/cases.json`, `out/versions.json`, `out/autocontrole_ALL_vs_FULL.json`).
- `analyse.mjs` : agrégation (variable d'environnement `ARM`, défaut `intention_produit`), écrit les tableaux et JSON de `out/`.
- `CONTEXTE_PRODUIT.md` : champ par champ, « vu par le banc / vu par le produit ».
- `out/` : `resultats_totaux.json`, `resultats_par_famille.json`, `ecart_top10_produit.json` / `_catalogue.json`, `en_ligne_minimal_produit.json` / `_catalogue.json`, `fausses_alertes_causes.json`, `DETAIL_FAMILLES_produit.md` / `_catalogue.md`, `TOP10_*.md`, `EN_LIGNE_*.md`, `TAB_*.md`, `TABLES.md`.

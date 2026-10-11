# Rapport : règle stricte « la couche ne peut qu'aggraver »

Date : 11 octobre 2026. Pas de commit. Jeux DEV seulement (V2_DEV, jury_*, attacks/DEV, attacks_public). Jamais V2_TEST ni attacks/TEST.jsonl.

## 1. Règle appliquée

Plancher = `server.evaluate` seul (sans liste de protocoles, sans fait, sans détecteur, et sans l'intention si elle est envoyée). Le niveau final est toujours supérieur ou égal au plancher. La couche ne produit jamais `ok` quand le plancher n'est pas `ok`.

Lecture retenue de « la liste ne descend jamais sous info » : la liste n'a aucun pouvoir de baisse. Elle n'atteint que la chaîne et les détecteurs, après le calcul du plancher. Elle réduit donc les alertes ajoutées par les détecteurs, pas celles du serveur. Si vous vouliez qu'elle puisse baisser jusqu'à `info`, ce n'est pas fait (à trancher).

## 2. Chemins coupés

| Chemin | Avant | Maintenant |
|---|---|---|
| dust_guard.mjs (baisse) | warn ou `ok` | coupé ; sous HOLDUP_BENCH_LOWER=1 seulement, plancher `warn`, jamais `ok` |
| intent_guard.mjs (baisse du montant) | lecture la plus large | coupé ; sous drapeau, il faut que la plus petite lecture (« 1,000 » = 1) couvre le montant |
| nft_orders.mjs (Seaport et setApprovalForAll) | warn | coupés ; sous drapeau seulement |
| relaxedByFacts (evaluate_plus) | plancher sauté dès qu'un fait existe | supprimé ; `relaxedByFacts` vaut toujours false |
| liste known_protocols avant `plus.product` | `plus.product` ≠ serveur seul | injectée après ; `plus.product` = serveur seul |
| toute baisse `lower` dans evaluate_plus | appliquée en dernier | jamais appliquée, seulement listée dans `plus.lowerIgnored` |
| Affichage d'une baisse | actif | inactif (plus de `lowered`) |

Garde de monotonie : `monotoneGuard` (run/policy.mjs) est branché dans evaluate_plus. Si une intention est donnée, la chaîne est rejouée sans intention et le niveau est `monotoneGuard(avec, sans)`. Le serveur est aussi évalué sans intention et entre dans le plancher. Coût : la chaîne tourne deux fois quand une intention est envoyée.

## 3. Provenance de `extra.*`

- `opts.live` (et son `extra`) vient du code appelant (fournisseur de chaîne, lecteur de l'extension). Jamais du corps de requête.
- Le serveur n'appelle `evaluatePlus(body, local)` sans option. Hors banc, aucun `extra` n'existe donc.
- Clés du corps jamais lues et listées dans `plus.rejectedInputs` : extra, context, live, facts, known_protocols, knownSpenders, token_registry, balances, nft, quote, clipboard, simulation, sell_pool, claimed_site, token_info, address_book, contacts, history, local, protected, detectors, options.
- `extra` hors banc : seules clipboard, simulation, quote, sell_pool, claimed_site, token_info passent. origin, nft, token_registry, balances sont rejetés.
- `extra.origin` ne remplace plus jamais l'origine (le trou J-57 sur domaine punycode est fermé même en mode banc).
- Documenté en tête de pipeline/evaluate_plus.mjs.

## 4. known_protocols.json

Chaîne 1 : de 0 à 15 entrées. Chaîne 43114 : de 7 à 8 (Pangolin Router). Chaque entrée a l'URL officielle et la date de lecture (2026-10-11). `eth_getCode` en lecture seule a renvoyé du code pour toutes les adresses de la chaîne 1, Pangolin et CCTP sur Avalanche. Les 7 entrées Avalanche d'origine n'ont pas été revérifiées par `eth_getCode`.

Chaîne 1 : Uniswap UniversalRouter (3 versions), SwapRouter02, SwapRouter V3, NonfungiblePositionManager, V2 Router02, V4 PoolManager et PositionManager (docs developers.uniswap.org) ; Aave V3 Pool et WrappedTokenGateway (aave-address-book) ; Lido stETH, wstETH, Withdrawal Queue (docs.lido.fi) ; Circle CCTP TokenMessengerV2 (developers.circle.com).

Non ajoutés (source illisible aujourd'hui) : LFJ/Trader Joe (403), Odos (530), 1inch (hôte injoignable), GMX, Stargate, pont Avalanche, marchés Benqi. Aucune adresse tirée des jeux de test.

## 5. Mesures avant/après (10 437 cas : 6 515 arnaques, 2 855 bénins)

Outil : `pipeline/measure_strict.mjs`. Avant = copie figée du code précédent ; après = code actuel.

| Mode | Arnaques ratées avant | après | Fausses alertes avant | après | Cas sous le serveur seul avant | après | `ok` produit par la couche avant | après |
|---|---|---|---|---|---|---|---|---|
| product (serveur seul) | 3 757 | 3 757 | 447 | 447 | 0 | 0 | 0 | 0 |
| detectors | 1 539 | 1 539 | 568 | 532 | 165 bénins | 0 | 165 | 0 |
| detectors sans liste | 1 539 | 1 539 | 585 | 585 | 0 | 0 | 0 | 0 |
| live | 1 023 | 1 023 | 728 | 669 | 165 bénins | 0 | 165 | 0 |
| detectors+known+intent+premise | 1 605 | 1 605 | 236 | 237 | 54 bénins | 0 | 54 | 0 |
| full (parité banc) | 851 | 848 | 355 | 366 | 1 arnaque + 109 bénins | 0 | 110 | 0 |

Lecture :
- Aucune arnaque ratée de plus (full : 3 de moins). Aucun cas sous le serveur seul, aucun `ok` ajouté par la couche.
- Les 165 bénins qui passaient en vert via la liste restent au niveau du serveur seul : c'est le coût voulu de la règle (leurs faux rouges ne sont pas retirés).
- La liste de la chaîne 1 retire 36 fausses alertes (detectors) et 59 (live) des détecteurs.
- Colonne « sous le serveur seul » des modes `+known` et `full` : dans l'état final il reste 173/950/35 cas sous le serveur sans liste. Ce sont les listes du cas passées en what-if au serveur lui-même (règles F1, F2... du produit), pas la couche. Contre le serveur avec les mêmes entrées : 0.
- check_product.mjs (V2_DEV, DEV, public ; serveur seul, inchangé) : 1 015 arnaques ratées, 272 fausses alertes sur 6 456 cas.

## 6. Tests

- `pipeline/test/monotone_pipeline.test.mjs` (nouveau, 7 tests) : 1 cas sur 4 de tous les jeux DEV (HOLDUP_STRICT_STEP=1 pour tout), 4 modes, plus un passage avec HOLDUP_BENCH_LOWER=1 : 0 cas sous le serveur seul, `ok` par la couche = 0. Scénarios dust_guard, « 1,000 », rejet de extra, liste + approve illimité, intention jamais sous « sans intention ».
- `evaluate_plus.test.mjs` : le test des corrections `lower` est réécrit (jamais appliquées) ; le test de la liste exige maintenant l'égalité avec ou sans liste.
- Résultats : pipeline 27/27, engine 456/456, server 2/2, detectors_adem clef_client 3/3, `run/check_nohardcode.mjs` OK.

## 7. Ce qui reste

- Les règles du serveur lui-même qui baissent avec une liste (F1, F2, F13, F15, F16, F19, F20, F3, F4 dans run/policy.mjs) ne sont pas touchées : elles agissent sur `local.knownSpenders` fourni par l'appelant.
- `intentPremise: 'warn'` reste une option du banc ; le plafond ne baisse pas sous le plancher.
- `redteam/check_plus.mjs` (non possédé) applique encore `r.lower` mais les détecteurs ne le renvoient plus sans HOLDUP_BENCH_LOWER=1.
- Jeux DEV = jeux de réglage : « 0 baisse » ne dit rien du jeu aveugle, mais ici c'est vrai par construction (maximum avec le plancher).
- Listes à compléter quand les sources seront lisibles : LFJ, Odos, 1inch, GMX, Stargate, Benqi, pont Avalanche.
- Question ouverte : autoriser la liste à baisser jusqu'à `info` (non fait).

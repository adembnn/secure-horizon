# Hold up : taux d'alertes du moteur ACTUEL sur trafic réel (C-Chain + Ethereum)

Mesure en lecture seule, Node 24, aucune dépendance, aucun secret, un seul processus à la fois. Colonne « données réelles » du jury.
Scripts : `fetch_eth.mjs` (récolte), `run_real.mjs` (moteur + politique), `make_review.mjs` + `evidence.mjs` (échantillon de revue), `finalize.mjs` (étiquettes manuelles + synthèse). Sorties : `out/real_*.json`, `out/known_list_*.json`, `out/revue_manuelle_*.json`, `out/synthese.json`. Les caches volumineux sont dans `cache_/` (ignoré par git via `realtraffic/.gitignore`).

## Méthode
- Chaque transaction réelle est reconstruite en requête `eth_sendTransaction` (`from`, `to`, `data`, `value`, `chainId`) et passe dans `engine.analyzeTransaction` puis `applyExtraRules` puis `applyPolicy`, mêmes appels que `run/run_loop.mjs`. Niveau = plancher du moteur après politique (`applyPolicy` avec `adem = null`), c'est le bras « sans_intention » de `run_loop.mjs`. Aucun comparateur, aucune intention, aucun historique, aucun carnet, pas de RPC pendant l'analyse (nature contrat/EOA inconnue du moteur).
- Mode A « nu » : aucun contexte (ce que verrait un utilisateur qui n'a rien configuré). Mode B « protocoles connus » : `knownSpenders` = les 100 destinataires les plus fréquents du trafic réel.
- **La liste du mode B est CIRCULAIRE** : dérivée de l'échantillon lui-même (`out/known_list_*.json`). Elle couvre 70,9 % du trafic C-Chain et 41,0 % du trafic Ethereum. Ce n'est pas un catalogue public indépendant : c'est un plafond de ce qu'un catalogue gagnerait, jamais une couverture mesurée.
- Niveaux : critical, warn, info (niveau « ok » avec au moins un drapeau d'information, ex. révocation), ok, inconnu (exception du moteur : 0 observée).
- Types (déterminés par sélecteur et décodage moteur) : transfert natif, ERC-20 transfer/transferFrom, approve (approve, setApprovalForAll, increaseAllowance, permit), appel connu (décodé par le moteur, non opaque), appel opaque (calldata non ou partiellement décodé), création de contrat.
- Intervalles : Wilson 95 %.

## Données
- C-Chain : `bench/data/cchain_sample.jsonl`, 6 325 transactions, 1 500 blocs aléatoires, graine 20261011, ancrage 97 234 673 (non régénéré, présent).
- Ethereum : 200 blocs aléatoires entre 20 000 000 et l'ancrage 26 165 007, graine 20261011, méthode de `eval_legit_eth.mjs`. 42 918 transactions récoltées, **6 000 tirées au hasard** (Fisher-Yates, graine 20261011) pour l'analyse. L'ancrage a avancé depuis le rapport v0 (43 075 tx), les blocs tirés diffèrent donc légèrement.
- Version du code (sha256, 16 premiers hex), identique avant et après chaque mesure (aucune modification pendant le run) : engine.mjs `3c2de1406af6b2be`, rules.mjs `75914eca31de948b`, rules_extra.mjs `5267934bfe087f79`, fixes.mjs `c3bdb09800c72d4c`, calldata.mjs `994b969530cd9fae`, registry.mjs `e93b80f646cda08a`, abi.mjs `cb215b90b180391f`, util.mjs `006143001b9834d3`, policy.mjs `ce761745beb16815`, run_loop.mjs `fa04e8c5b0e7b293`. Correctifs actifs : défaut `KEPT` (F1 à F10). Les fichiers du moteur ne sont pas modifiés par ce travail.

## Résultats par niveau (taux, Wilson 95 %)
| | C-Chain A (nu) | C-Chain B (connus) | Ethereum A (nu) | Ethereum B (connus) |
|---|---|---|---|---|
| n | 6 325 | 6 325 | 6 000 | 6 000 |
| critical | 19, 0,30 % [0,19-0,47] | 18, 0,28 % [0,18-0,45] | 200, 3,33 % [2,91-3,82] | 113, 1,88 % [1,57-2,26] |
| warn | 4 860, 76,84 % [75,78-77,86] | 4 809, 76,03 % [74,96-77,07] | 1 972, 32,87 % [31,69-34,07] | 1 980, 33,00 % [31,82-34,20] |
| info | 13, 0,21 % [0,12-0,35] | 13, 0,21 % | 64, 1,07 % [0,84-1,36] | 64, 1,07 % |
| ok | 1 433, 22,66 % [21,64-23,70] | 1 485, 23,48 % [22,45-24,54] | 3 764, 62,73 % [61,50-63,95] | 3 843, 64,05 % [62,83-65,26] |
| inconnu | 0 [0-0,06] | 0 | 0 [0-0,06] | 0 |
| Appels opaques (part du trafic) | 74,5 % | 73,9 % | 28,8 % | 28,8 % |

## Résultats par type, mode A (nu), taux critical / warn
| Type | C-Chain n (part) | critical | warn | Ethereum n (part) | critical | warn |
|---|---|---|---|---|---|---|
| Transfert natif | 853 (13,5 %) | 0 % [0-0,45] | 0 % | 2 232 (37,2 %) | 0 % [0-0,17] | 0 % |
| ERC-20 transfer/transferFrom | 479 (7,6 %) | 0 % [0-0,80] | 0 % | 1 421 (23,7 %) | 0 % [0-0,27] | 0 % |
| Approve (+ setApprovalForAll, permit) | 135 (2,1 %) | 11,1 % [6,9-17,5] | 77,0 % [69,3-83,3] | 334 (5,6 %) | 37,1 % [32,1-42,4] | 53,3 % [47,9-58,6] |
| Appel de contrat connu (décodé) | 145 (2,3 %) | 2,1 % [0,7-5,9] | 30,3 % [23,4-38,3] | 283 (4,7 %) | 22,6 % [18,1-27,8] | 26,9 % [22,0-32,3] |
| Appel opaque | 4 706 (74,4 %) | 0,02 % [0,00-0,12] | 99,98 % [99,88-100] | 1 727 (28,8 %) | 0,7 % [0,40-1,21] | 99,3 % [98,8-99,6] |
| Création de contrat | 7 | 0 | 7/7 | 3 | 0 | 3/3 |

Mode B (liste circulaire) : sur les approve, critical passe de 11,1 % à 10,4 % (C-Chain) et de 37,1 % à 23,1 % (Ethereum) ; warn de 77,0 % à 39,3 % (C-Chain) et de 53,3 % à 44,0 % (Ethereum). Les appels opaques restent warn à 99,98 % / 99,5 % : la liste ne règle pas l'opacité. Détail complet dans `out/real_*.json`.

Principaux motifs (mode A, C-Chain) : `unknown_selector` 4 796, `opaque` 4 713, `external_spender` 120, `erc4337_handleOps` 39, `embedded_calls` 23, `slippage_unbounded` 20, `unlimited_allowance` critical 15, `control_change` critical 3. **95,8 % des alertes C-Chain (76,8 % sur Ethereum) sont uniquement de l'opacité** (le moteur dit « je n'ai pas pu décoder »), aucune preuve de risque.

## Revue manuelle (50 alertes C-Chain, plus 30 Ethereum)
Échantillon C-Chain, mode A : les 19 critical (tous), plus 31 warn tirés au hasard et stratifiés par motif. Pour chaque ligne : destinataire tronqué, sélecteur, décodage, raisons (`out/revue_manuelle_cchain.json`). J'ai complété par des lectures RPC seules (eth_getCode) : le spender est-il un compte externe ou un contrat, combien de portefeuilles distincts l'approuvent/l'appellent dans l'échantillon. Classement : **vraie alerte utile** (action sensible et rare, un utilisateur gagne à la voir), **fausse alerte** (action courante et bénigne d'un protocole largement utilisé : critère = au moins ~10 portefeuilles distincts, ou protocole que je reconnais, comme le routeur 1inch, le conduit OpenSea, Permit2, l'Universal Router), **indéterminé** (rien ne permet de trancher).

| | n | fausse alerte | vraie alerte utile | indéterminé |
|---|---|---|---|---|
| C-Chain critical | 19 | 2 (10,5 % [2,9-31,4]) | 2 (10,5 %) | 15 |
| C-Chain warn | 31 | 15 (48,4 % [32,0-65,2]) | 2 (6,5 %) | 14 |
| Ethereum critical | 20 | 13 (65 % [43,3-81,9]) | 2 (10 %) | 5 |
| Ethereum warn | 10 | 4 (40 %) | 2 (20 %) | 4 |

Lecture :
- **Taux de fausses alertes critical sur trafic réel C-Chain : 10,5 % au moins (2/19, IC 2,9-31,4), 89,5 % au plus si tous les indéterminés étaient bénins** (17/19). La vérité est entre les deux et ne se tranche pas sans catalogue de protocoles : les 15 indéterminés sont des approve illimités vers un contrat inconnu, que le moteur ne peut pas distinguer d'un drainer (un contrat de plus de 14 ko approuvé par 1 seul portefeuille, ou un proxy de 171 octets, ressemble aux deux). Rapporté au trafic : au moins 0,03 % des transactions C-Chain déclenchent une fausse alerte critical confirmée, et au plus 0,27 %.
- Sur Ethereum la lecture est plus nette : 13/20 critical (65 %) sont des fausses alertes confirmées, surtout l'Universal Router, Permit2 et des approve illimités vers des contrats à plus de 80 approbateurs. Avec 3,3 % de critical sur le trafic, le moteur nu **n'atteint pas** « fausse alerte critical ≤ 1/1000 » : environ 2,2 % du trafic Ethereum donne une fausse alerte critical confirmée (estimation = 3,33 % × 65 %).
- Proportion d'opaque : 74,5 % du trafic C-Chain (28,8 % Ethereum) est un appel dont le moteur ne connaît pas les effets, classé warn par l'invariant « inconnu n'est jamais ok ». C'est le premier problème de produit : 76,8 % des transactions C-Chain déclenchent un warn.
- Ce qui passe sans bruit : transferts natifs et ERC-20 (21 % du trafic C-Chain, 61 % d'Ethereum) sont à 0 % d'alerte.

## Latence
Pipeline complet moteur + règles + politique, par transaction, en mémoire (hors réseau, hors RPC de contexte), mode A, après échauffement de 300 transactions. C-Chain : médiane 0,037 ms, p95 0,20 ms, p99 0,68 ms, moyenne 0,074 ms, max 8,4 ms. Ethereum : médiane 0,059 ms, p95 0,50 ms, p99 1,5 ms, moyenne 0,14 ms, max 49 ms. Mode B du même ordre. Le moteur n'est pas le goulot : le coût réel d'un utilisateur est le réseau (contexte, simulation), non mesuré ici.

## Comparaison avec RAPPORT_banc_reel_v0.md (corrigé)
Le filet v0 (5 règles, premier niveau seulement) donnait 0,28 % de faux positifs sur la C-Chain (6 325 tx) et 2,98 % sur Ethereum (corrigé des révocations). Le moteur actuel donne un critical de 0,30 % (C-Chain) et 3,33 % (Ethereum) : **le niveau critical est quasi identique à celui du filet**, donc les règles supplémentaires (multicall, routeur, 7702, contrôle) n'ajoutent presque pas de critical sur le trafic légitime. La différence est ailleurs : le v0 ignorait l'angle mort (« other » 34 % sur Ethereum, invisible), le moteur actuel l'affiche en warn (76,8 % sur C-Chain). La revue manuelle confirme que le critical sur Ethereum est dominé par des fausses alertes que le filet v0 avait déjà (droit illimité vers un protocole courant), et que la liste connue (mode B) en élimine 43 % (200 vers 113), ce qui est un plafond optimiste puisque la liste est circulaire.

## Honnêteté : ce que ce chiffre n'est PAS
1. Ce n'est pas du trafic de portefeuilles utilisateurs : ce sont les transactions de blocs aléatoires. Elles contiennent des robots (MEV, arbitrage : plusieurs contrats ont un seul émetteur avec 100 appels), des bundlers ERC-4337 et des appels de contrat sans lien avec un humain devant son écran. La part d'opaque (74,5 % sur la C-Chain) est gonflée par ce trafic de robots ; un utilisateur réel verrait moins d'opaque et plus de swaps connus.
2. Le « légitime » est présumé : aucune étiquette. Les approve illimités indéterminés peuvent contenir de vraies arnaques non listées.
3. Le critère « fausse alerte » repose sur un proxy de popularité (nombre de portefeuilles distincts dans l'échantillon) plus ma reconnaissance de quelques protocoles : ce n'est pas une vérité de terrain, et un drainer avec beaucoup de victimes y passerait pour courant. Les labels sont ceux d'un seul relecteur (moi), pas de double lecture.
4. La revue C-Chain est un échantillon de 50 (19 critical exhaustifs, 31 warn sur 4 860) : le taux warn est très imprécis.
5. La liste « protocoles connus » est circulaire (dérivée de l'échantillon) : le gain du mode B est un plafond, pas une mesure de catalogue.
6. Le moteur ne reçoit ni intention, ni historique, ni carnet, ni nature (contrat/EOA) des adresses : en production ces informations existent et réduisent le bruit (non mesuré ici). La nature contrat/EOA, que j'ai lue via RPC pour la revue, n'est pas fournie au moteur lors de la mesure.
7. Les attaques ne sont pas mesurées ici : pas de rappel, seulement le bruit sur trafic normal.

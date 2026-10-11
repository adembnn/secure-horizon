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

**TOUT**

| niveau | n malv. | attrapé critical | attrapé warn | raté | inconnu | rappel (critical+warn), Wilson 95 % | opaque (dont attrapés par opacité seule) | n bénin | FA critical | FA critical % | FA warn | FA warn+critical % | opaque bénin | n fraude conforme (alertées) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FULL | 3254 | 2994 | 234 | 17 | 9 | 99.2% [98.8-99.5] (3228/3254) | 301 (39) | 2136 | 20 | 0.9% [0.6-1.4] (20/2136) | 309 | 15.4% [13.9-17.0] (329/2136) | 67 | 821 (582) |
| D | 3254 | 2618 | 315 | 312 | 9 | 90.1% [89.1-91.1] (2933/3254) | 301 (72) | 2136 | 20 | 0.9% [0.6-1.4] (20/2136) | 345 | 17.1% [15.6-18.7] (365/2136) | 156 | 821 (402) |
| C | 3254 | 2587 | 405 | 253 | 9 | 91.9% [91.0-92.8] (2992/3254) | 399 (88) | 2136 | 292 | 13.7% [12.3-15.2] (292/2136) | 866 | 54.2% [52.1-56.3] (1158/2136) | 666 | 821 (402) |
| B | 3254 | 2321 | 405 | 519 | 9 | 83.8% [82.5-85.0] (2726/3254) | 399 (88) | 2136 | 297 | 13.9% [12.5-15.4] (297/2136) | 861 | 54.2% [52.1-56.3] (1158/2136) | 666 | 821 (402) |
| A | 3254 | 2210 | 433 | 602 | 9 | 81.2% [79.8-82.5] (2643/3254) | 399 (91) | 2136 | 297 | 13.9% [12.5-15.4] (297/2136) | 893 | 55.7% [53.6-57.8] (1190/2136) | 666 | 821 (402) |

**DEV**

| niveau | n malv. | attrapé critical | attrapé warn | raté | inconnu | rappel (critical+warn), Wilson 95 % | opaque (dont attrapés par opacité seule) | n bénin | FA critical | FA critical % | FA warn | FA warn+critical % | opaque bénin | n fraude conforme (alertées) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FULL | 252 | 217 | 32 | 3 | 0 | 98.8% [96.6-99.6] (249/252) | 33 (14) | 90 | 0 | 0.0% [0.0-4.1] (0/90) | 10 | 11.1% [6.1-19.3] (10/90) | 5 | 24 (18) |
| D | 252 | 202 | 29 | 21 | 0 | 91.7% [87.6-94.5] (231/252) | 33 (14) | 90 | 0 | 0.0% [0.0-4.1] (0/90) | 10 | 11.1% [6.1-19.3] (10/90) | 5 | 24 (0) |
| C | 252 | 202 | 29 | 21 | 0 | 91.7% [87.6-94.5] (231/252) | 33 (14) | 90 | 0 | 0.0% [0.0-4.1] (0/90) | 39 | 43.3% [33.6-53.6] (39/90) | 19 | 24 (0) |
| B | 252 | 186 | 29 | 37 | 0 | 85.3% [80.4-89.2] (215/252) | 33 (14) | 90 | 5 | 5.6% [2.4-12.4] (5/90) | 34 | 43.3% [33.6-53.6] (39/90) | 19 | 24 (0) |
| A | 252 | 180 | 32 | 40 | 0 | 84.1% [79.1-88.1] (212/252) | 33 (14) | 90 | 5 | 5.6% [2.4-12.4] (5/90) | 34 | 43.3% [33.6-53.6] (39/90) | 19 | 24 (0) |

**PUBLIC**

| niveau | n malv. | attrapé critical | attrapé warn | raté | inconnu | rappel (critical+warn), Wilson 95 % | opaque (dont attrapés par opacité seule) | n bénin | FA critical | FA critical % | FA warn | FA warn+critical % | opaque bénin | n fraude conforme (alertées) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FULL | 72 | 49 | 12 | 2 | 9 | 84.7% [74.7-91.2] (61/72) | 8 (3) | 70 | 0 | 0.0% [0.0-5.2] (0/70) | 18 | 25.7% [16.9-37.0] (18/70) | 7 | 2 (1) |
| D | 72 | 48 | 7 | 8 | 9 | 76.4% [65.4-84.7] (55/72) | 8 (3) | 70 | 0 | 0.0% [0.0-5.2] (0/70) | 18 | 25.7% [16.9-37.0] (18/70) | 7 | 2 (0) |
| C | 72 | 48 | 7 | 8 | 9 | 76.4% [65.4-84.7] (55/72) | 9 (3) | 70 | 7 | 10.0% [4.9-19.2] (7/70) | 28 | 50.0% [38.6-61.4] (35/70) | 10 | 2 (0) |
| B | 72 | 44 | 7 | 12 | 9 | 70.8% [59.5-80.1] (51/72) | 9 (3) | 70 | 7 | 10.0% [4.9-19.2] (7/70) | 28 | 50.0% [38.6-61.4] (35/70) | 10 | 2 (0) |
| A | 72 | 43 | 7 | 13 | 9 | 69.4% [58.0-78.9] (50/72) | 9 (3) | 70 | 7 | 10.0% [4.9-19.2] (7/70) | 28 | 50.0% [38.6-61.4] (35/70) | 10 | 2 (0) |

**V2_DEV**

| niveau | n malv. | attrapé critical | attrapé warn | raté | inconnu | rappel (critical+warn), Wilson 95 % | opaque (dont attrapés par opacité seule) | n bénin | FA critical | FA critical % | FA warn | FA warn+critical % | opaque bénin | n fraude conforme (alertées) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FULL | 2930 | 2728 | 190 | 12 | 0 | 99.6% [99.3-99.8] (2918/2930) | 260 (22) | 1976 | 20 | 1.0% [0.7-1.6] (20/1976) | 281 | 15.2% [13.7-16.9] (301/1976) | 55 | 795 (563) |
| D | 2930 | 2368 | 279 | 283 | 0 | 90.3% [89.2-91.4] (2647/2930) | 260 (55) | 1976 | 20 | 1.0% [0.7-1.6] (20/1976) | 317 | 17.1% [15.5-18.8] (337/1976) | 144 | 795 (402) |
| C | 2930 | 2337 | 369 | 224 | 0 | 92.4% [91.3-93.3] (2706/2930) | 357 (71) | 1976 | 285 | 14.4% [12.9-16.0] (285/1976) | 799 | 54.9% [52.7-57.0] (1084/1976) | 637 | 795 (402) |
| B | 2930 | 2091 | 369 | 470 | 0 | 84.0% [82.6-85.2] (2460/2930) | 357 (71) | 1976 | 285 | 14.4% [12.9-16.0] (285/1976) | 799 | 54.9% [52.7-57.0] (1084/1976) | 637 | 795 (402) |
| A | 2930 | 1987 | 394 | 549 | 0 | 81.3% [79.8-82.6] (2381/2930) | 357 (74) | 1976 | 285 | 14.4% [12.9-16.0] (285/1976) | 831 | 56.5% [54.3-58.6] (1116/1976) | 637 | 795 (402) |


### 2.2 Mêmes tableaux, bras `intention_mensongere` (intention du catalogue)

**TOUT**

| niveau | n malv. | attrapé critical | attrapé warn | raté | inconnu | rappel (critical+warn), Wilson 95 % | opaque (dont attrapés par opacité seule) | n bénin | FA critical | FA critical % | FA warn | FA warn+critical % | opaque bénin | n fraude conforme (alertées) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FULL | 3254 | 3064 | 172 | 9 | 9 | 99.4% [99.1-99.6] (3236/3254) | 301 (39) | 2136 | 21 | 1.0% [0.6-1.5] (21/2136) | 387 | 19.1% [17.5-20.8] (408/2136) | 67 | 821 (627) |
| D | 3254 | 2776 | 283 | 186 | 9 | 94.0% [93.1-94.8] (3059/3254) | 301 (72) | 2136 | 30 | 1.4% [1.0-2.0] (30/2136) | 356 | 18.1% [16.5-19.8] (386/2136) | 156 | 821 (524) |
| C | 3254 | 2794 | 355 | 96 | 9 | 96.8% [96.1-97.3] (3149/3254) | 399 (88) | 2136 | 375 | 17.6% [16.0-19.2] (375/2136) | 838 | 56.8% [54.7-58.9] (1213/2136) | 666 | 821 (554) |
| B | 3254 | 2745 | 355 | 145 | 9 | 95.3% [94.5-95.9] (3100/3254) | 399 (88) | 2136 | 552 | 25.8% [24.0-27.7] (552/2136) | 825 | 64.5% [62.4-66.5] (1377/2136) | 666 | 821 (620) |
| A | 3254 | 2648 | 373 | 224 | 9 | 92.8% [91.9-93.7] (3021/3254) | 399 (91) | 2136 | 552 | 25.8% [24.0-27.7] (552/2136) | 857 | 66.0% [63.9-67.9] (1409/2136) | 666 | 821 (620) |

**DEV**

| niveau | n malv. | attrapé critical | attrapé warn | raté | inconnu | rappel (critical+warn), Wilson 95 % | opaque (dont attrapés par opacité seule) | n bénin | FA critical | FA critical % | FA warn | FA warn+critical % | opaque bénin | n fraude conforme (alertées) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FULL | 252 | 224 | 28 | 0 | 0 | 100.0% [98.5-100.0] (252/252) | 33 (14) | 90 | 0 | 0.0% [0.0-4.1] (0/90) | 10 | 11.1% [6.1-19.3] (10/90) | 5 | 24 (18) |
| D | 252 | 213 | 29 | 10 | 0 | 96.0% [92.9-97.8] (242/252) | 33 (14) | 90 | 0 | 0.0% [0.0-4.1] (0/90) | 10 | 11.1% [6.1-19.3] (10/90) | 5 | 24 (0) |
| C | 252 | 213 | 29 | 10 | 0 | 96.0% [92.9-97.8] (242/252) | 33 (14) | 90 | 2 | 2.2% [0.6-7.7] (2/90) | 37 | 43.3% [33.6-53.6] (39/90) | 19 | 24 (0) |
| B | 252 | 213 | 29 | 10 | 0 | 96.0% [92.9-97.8] (242/252) | 33 (14) | 90 | 13 | 14.4% [8.6-23.2] (13/90) | 32 | 50.0% [39.9-60.1] (45/90) | 19 | 24 (0) |
| A | 252 | 207 | 32 | 13 | 0 | 94.8% [91.4-97.0] (239/252) | 33 (14) | 90 | 13 | 14.4% [8.6-23.2] (13/90) | 32 | 50.0% [39.9-60.1] (45/90) | 19 | 24 (0) |

**PUBLIC**

| niveau | n malv. | attrapé critical | attrapé warn | raté | inconnu | rappel (critical+warn), Wilson 95 % | opaque (dont attrapés par opacité seule) | n bénin | FA critical | FA critical % | FA warn | FA warn+critical % | opaque bénin | n fraude conforme (alertées) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FULL | 72 | 54 | 8 | 1 | 9 | 86.1% [76.3-92.3] (62/72) | 8 (3) | 70 | 1 | 1.4% [0.3-7.7] (1/70) | 18 | 27.1% [18.1-38.5] (19/70) | 7 | 2 (1) |
| D | 72 | 53 | 7 | 3 | 9 | 83.3% [73.1-90.2] (60/72) | 8 (3) | 70 | 1 | 1.4% [0.3-7.7] (1/70) | 18 | 27.1% [18.1-38.5] (19/70) | 7 | 2 (1) |
| C | 72 | 54 | 6 | 3 | 9 | 83.3% [73.1-90.2] (60/72) | 9 (3) | 70 | 9 | 12.9% [6.9-22.7] (9/70) | 27 | 51.4% [40.0-62.8] (36/70) | 10 | 2 (1) |
| B | 72 | 54 | 6 | 3 | 9 | 83.3% [73.1-90.2] (60/72) | 9 (3) | 70 | 18 | 25.7% [16.9-37.0] (18/70) | 27 | 64.3% [52.6-74.5] (45/70) | 10 | 2 (1) |
| A | 72 | 53 | 6 | 4 | 9 | 81.9% [71.5-89.1] (59/72) | 9 (3) | 70 | 18 | 25.7% [16.9-37.0] (18/70) | 27 | 64.3% [52.6-74.5] (45/70) | 10 | 2 (1) |

**V2_DEV**

| niveau | n malv. | attrapé critical | attrapé warn | raté | inconnu | rappel (critical+warn), Wilson 95 % | opaque (dont attrapés par opacité seule) | n bénin | FA critical | FA critical % | FA warn | FA warn+critical % | opaque bénin | n fraude conforme (alertées) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FULL | 2930 | 2786 | 136 | 8 | 0 | 99.7% [99.5-99.9] (2922/2930) | 260 (22) | 1976 | 20 | 1.0% [0.7-1.6] (20/1976) | 359 | 19.2% [17.5-21.0] (379/1976) | 55 | 795 (608) |
| D | 2930 | 2510 | 247 | 173 | 0 | 94.1% [93.2-94.9] (2757/2930) | 260 (55) | 1976 | 29 | 1.5% [1.0-2.1] (29/1976) | 328 | 18.1% [16.4-19.8] (357/1976) | 144 | 795 (523) |
| C | 2930 | 2527 | 320 | 83 | 0 | 97.2% [96.5-97.7] (2847/2930) | 357 (71) | 1976 | 364 | 18.4% [16.8-20.2] (364/1976) | 774 | 57.6% [55.4-59.8] (1138/1976) | 637 | 795 (553) |
| B | 2930 | 2478 | 320 | 132 | 0 | 95.5% [94.7-96.2] (2798/2930) | 357 (71) | 1976 | 521 | 26.4% [24.5-28.4] (521/1976) | 766 | 65.1% [63.0-67.2] (1287/1976) | 637 | 795 (619) |
| A | 2930 | 2388 | 335 | 207 | 0 | 92.9% [92.0-93.8] (2723/2930) | 357 (74) | 1976 | 521 | 26.4% [24.5-28.4] (521/1976) | 798 | 66.8% [64.6-68.8] (1319/1976) | 637 | 795 (619) |


## 3. Par famille

Tous les champs demandés (attrapé critical / attrapé warn / raté / inconnu / fausse alerte critical et warn / opaque, avec n et Wilson) sont publiés famille par famille et par niveau FULL, A, B, C dans `out/DETAIL_FAMILLES_produit.md` (bras `intention_produit`) et `out/DETAIL_FAMILLES_catalogue.md` (bras du catalogue), y compris pour les 149 sous-familles de V2. Les données brutes sont dans `out/resultats_par_famille.json`. Version condensée (rappel k/n par niveau, écart FULL - B en points, fausses alertes, ratés B, inconnus B, opaques B) :

#### DEV (attacks/DEV.jsonl) (bras intention_produit)

rappel = (attrapés critical+warn)/n malveillants ; FA = bénins en warn ou critical (dont critical) / n bénins. Écart = FULL moins B en points.

| famille | n malv. | FULL | A | B | C | écart FULL-B (pts) | n bénin | FA FULL | FA B | FA C | raté B | inconnu B | opaque malv. B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| adresse_empoisonnee | 15 | 15/15 | 0 | 0 | 15 | 100 | 0 | 0 (0) | 0 (0) | 0 (0) | 15 | 0 | 0 |
| approve_erc20 | 20 | 20/20 | 20 | 20 | 20 | 0 | 12 | 0 (0) | 9 (0) | 9 (0) | 0 | 0 | 0 |
| blur | 4 | 4/4 | 4 | 4 | 4 | 0 | 2 | 2 (0) | 2 (0) | 2 (0) | 0 | 0 | 4 |
| changement_reseau | 5 | 5/5 | 5 | 5 | 5 | 0 | 3 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| controle_admin | 10 | 10/10 | 10 | 10 | 10 | 0 | 3 | 3 (0) | 3 (3) | 3 (0) | 0 | 0 | 0 |
| cow_uniswapx | 11 | 11/11 | 11 | 11 | 11 | 0 | 7 | 0 (0) | 3 (0) | 3 (0) | 0 | 0 | 0 |
| dai_permit | 8 | 8/8 | 8 | 8 | 8 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| depot_exchange | 0 | 0/0 | 0 | 0 | 0 | - | 6 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| domaine_sosie | 9 | 9/9 | 9 | 9 | 9 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 3 |
| ens_sosie | 4 | 4/4 | 0 | 0 | 0 | 100 | 0 | 0 (0) | 0 (0) | 0 (0) | 4 | 0 | 0 |
| envoi_contact | 0 | 0/0 | 0 | 0 | 0 | - | 12 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| erc4337_userop | 11 | 11/11 | 11 | 11 | 11 | 0 | 3 | 3 (0) | 3 (0) | 3 (0) | 0 | 0 | 11 |
| eth_sign_aveugle | 6 | 6/6 | 6 | 6 | 6 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 6 |
| faux_airdrop | 5 | 5/5 | 5 | 5 | 5 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 2 |
| faux_concours | 4 | 4/4 | 4 | 4 | 4 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| faux_proche | 5 | 5/5 | 5 | 5 | 5 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| faux_recruteur | 2 | 2/2 | 2 | 2 | 2 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| faux_remboursement | 4 | 4/4 | 4 | 4 | 4 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| faux_support | 6 | 6/6 | 4 | 4 | 4 | 33 | 0 | 0 (0) | 0 (0) | 0 (0) | 2 | 0 | 1 |
| faux_token | 4 | 4/4 | 0 | 0 | 0 | 100 | 0 | 0 (0) | 0 (0) | 0 (0) | 4 | 0 | 0 |
| honeypot | 6 | 6/6 | 0 | 0 | 0 | 100 | 0 | 0 (0) | 0 (0) | 0 (0) | 6 | 0 | 0 |
| increase_allowance | 4 | 4/4 | 4 | 4 | 4 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| kit_drainer | 5 | 5/5 | 5 | 5 | 5 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 2 |
| mint_nft | 0 | 0/0 | 0 | 0 | 0 | - | 8 | 0 (0) | 8 (0) | 8 (0) | 0 | 0 | 0 |
| multicall_cache | 10 | 10/10 | 10 | 10 | 10 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 4 |
| nouveau_contrat_legit | 0 | 0/0 | 0 | 0 | 0 | - | 6 | 0 (0) | 6 (0) | 6 (0) | 0 | 0 | 0 |
| permit2_allowance | 12 | 12/12 | 12 | 12 | 12 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| permit2_signature_transfer | 7 | 7/7 | 7 | 7 | 7 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| permit_2612 | 12 | 12/12 | 12 | 12 | 12 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| personal_sign_opaque | 0 | 0/0 | 0 | 0 | 0 | - | 4 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| pig_butchering | 0 | 0/0 | 0 | 0 | 0 | - | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| presse_papiers | 4 | 1/4 | 0 | 0 | 1 | 25 | 0 | 0 (0) | 0 (0) | 0 (0) | 4 | 0 | 0 |
| safe_execution | 0 | 0/0 | 0 | 0 | 0 | - | 5 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| safe_gouvernance | 12 | 12/12 | 12 | 12 | 12 | 0 | 2 | 2 (0) | 2 (2) | 2 (0) | 0 | 0 | 0 |
| seaport | 14 | 14/14 | 14 | 14 | 14 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| set_approval_for_all | 9 | 9/9 | 9 | 9 | 9 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| siwe | 6 | 6/6 | 3 | 6 | 6 | 0 | 8 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| slippage | 0 | 0/0 | 0 | 0 | 0 | - | 4 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| swap_connu | 0 | 0/0 | 0 | 0 | 0 | - | 2 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| swap_destinataire | 12 | 12/12 | 12 | 12 | 12 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| urgence_bancaire | 6 | 6/6 | 4 | 4 | 4 | 33 | 0 | 0 (0) | 0 (0) | 0 (0) | 2 | 0 | 0 |
| verifying_contract | 0 | 0/0 | 0 | 0 | 0 | - | 3 | 0 (0) | 3 (0) | 3 (0) | 0 | 0 | 0 |

#### REGRESSION_PUBLIQUE (attacks_public) (bras intention_produit)

rappel = (attrapés critical+warn)/n malveillants ; FA = bénins en warn ou critical (dont critical) / n bénins. Écart = FULL moins B en points.

| famille | n malv. | FULL | A | B | C | écart FULL-B (pts) | n bénin | FA FULL | FA B | FA C | raté B | inconnu B | opaque malv. B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| batch_execute_7702 | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 2 (0) | 2 (1) | 2 (1) | 0 | 0 | 2 |
| batch_massif_troncature | 1 | 1/1 | 1 | 1 | 1 | 0 | 1 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| benin_dur_phrase_ressemblant_a_injection | 0 | 0/0 | 0 | 0 | 0 | - | 1 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| bitb_relais_permit | 1 | 1/1 | 1 | 1 | 1 | 0 | 1 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| bitb_seed_phrase | 1 | 0/1 | 0 | 0 | 0 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 1 | 0 |
| chaine_neuve | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 2 (0) | 2 (0) | 2 (0) | 0 | 0 | 0 |
| clickjacking_overlay | 1 | 1/1 | 1 | 1 | 1 | 0 | 1 | 0 (0) | 1 (0) | 1 (0) | 0 | 0 | 0 |
| clipper_remplacement | 2 | 2/2 | 0 | 0 | 0 | 100 | 2 | 0 (0) | 0 (0) | 0 (0) | 2 | 0 | 0 |
| cloaking_extension | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 2 (0) | 2 (0) | 2 (0) | 0 | 0 | 0 |
| delegation_7702 | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 1 (0) | 1 (1) | 1 (1) | 0 | 0 | 0 |
| delegation_7702_chain0 | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 1 (0) | 1 (1) | 1 (1) | 0 | 0 | 0 |
| desactivation_sur_ordre | 1 | 1/1 | 1 | 1 | 1 | 0 | 1 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| empoisonnement_adresse | 2 | 2/2 | 0 | 0 | 2 | 100 | 2 | 0 (0) | 0 (0) | 0 (0) | 2 | 0 | 0 |
| empoisonnement_safe_imbrique | 2 | 2/2 | 0 | 0 | 2 | 100 | 2 | 0 (0) | 0 (0) | 0 (0) | 2 | 0 | 0 |
| evasion_interception | 1 | 0/1 | 0 | 0 | 0 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 1 | 0 |
| extension_clone_sentinelle | 1 | 0/1 | 0 | 0 | 0 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 1 | 0 |
| faux_agent_trading_permit | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 0 (0) | 2 (0) | 2 (0) | 0 | 0 | 0 |
| faux_bot_arbitrage | 2 | 1/2 | 1 | 1 | 1 | 0 | 2 | 1 (0) | 1 (0) | 1 (0) | 1 | 0 | 1 |
| faux_jeton_appat | 2 | 2/2 | 1 | 1 | 1 | 50 | 2 | 0 (0) | 1 (0) | 1 (0) | 1 | 0 | 0 |
| faux_popup_cadeau | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 1 (0) | 2 (0) | 2 (0) | 0 | 0 | 0 |
| faux_revoke | 4 | 4/4 | 4 | 4 | 4 | 0 | 4 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| faux_support_voix_clonee | 1 | 1/1 | 1 | 1 | 1 | 0 | 1 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| injection_cachee_page | 1 | 1/1 | 1 | 1 | 1 | 0 | 1 | 0 (0) | 1 (0) | 1 (0) | 0 | 0 | 0 |
| injection_memoire_agent | 1 | 1/1 | 0 | 0 | 0 | 100 | 1 | 0 (0) | 0 (0) | 0 (0) | 1 | 0 | 0 |
| injection_pastedMessage | 1 | 1/1 | 0 | 0 | 0 | 100 | 0 | 0 (0) | 0 (0) | 0 (0) | 1 | 0 | 0 |
| mise_a_jour_piegee | 1 | 0/1 | 0 | 0 | 0 | 0 | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 1 | 0 |
| module_compte | 4 | 4/4 | 4 | 4 | 4 | 0 | 4 | 4 (0) | 4 (4) | 4 (4) | 0 | 0 | 0 |
| nft_listing_zero | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 2 (0) | 2 (0) | 2 (0) | 0 | 0 | 0 |
| origine_legitime_charge_malveillante | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 0 (0) | 2 (0) | 2 (0) | 0 | 0 | 0 |
| paraphrase_llm_evasion_mots_cles | 1 | 1/1 | 0 | 0 | 0 | 100 | 1 | 0 (0) | 0 (0) | 0 (0) | 1 | 0 | 0 |
| permission_7715 | 2 | 0/2 | 0 | 0 | 0 | 0 | 2 | 0 (0) | 0 (0) | 0 (0) | 0 | 2 | 0 |
| permit2_allowance | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 0 (0) | 2 (0) | 2 (0) | 0 | 0 | 0 |
| permit2_signature_transfer | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 1 (0) | 2 (0) | 2 (0) | 0 | 0 | 0 |
| permit_2612 | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 0 (0) | 2 (0) | 2 (0) | 0 | 0 | 0 |
| pig_butchering_fraude_conforme | 0 | 0/0 | 0 | 0 | 0 | - | 1 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| pont_destinataire | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 1 (0) | 2 (0) | 2 (0) | 0 | 0 | 2 |
| signature_differee | 2 | 1/2 | 1 | 1 | 1 | 0 | 2 | 0 (0) | 1 (0) | 1 (0) | 0 | 1 | 0 |
| signature_opaque_eth_sign | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 2 |
| simulation_evasion | 2 | 1/2 | 1 | 1 | 1 | 0 | 2 | 0 (0) | 1 (0) | 1 (0) | 1 | 0 | 1 |
| siwe_detourne | 2 | 2/2 | 1 | 2 | 2 | 0 | 2 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| solana_tron_autorite | 2 | 0/2 | 0 | 0 | 0 | 0 | 2 | 0 (0) | 0 (0) | 0 (0) | 0 | 2 | 0 |
| toctou_proxy | 1 | 1/1 | 1 | 1 | 1 | 0 | 1 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 1 |
| victime_coachee_fraude_conforme | 0 | 0/0 | 0 | 0 | 0 | - | 1 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| wallet_sendCalls_lot | 2 | 2/2 | 2 | 2 | 2 | 0 | 2 | 0 (0) | 1 (0) | 1 (0) | 0 | 0 | 0 |

#### V2_DEV, par famille (bras intention_produit)

rappel = (attrapés critical+warn)/n malveillants ; FA = bénins en warn ou critical (dont critical) / n bénins. Écart = FULL moins B en points.

| famille | n malv. | FULL | A | B | C | écart FULL-B (pts) | n bénin | FA FULL | FA B | FA C | raté B | inconnu B | opaque malv. B |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ambigu | 0 | 0/0 | 0 | 0 | 0 | - | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| benign_defi | 0 | 0/0 | 0 | 0 | 0 | - | 1001 | 138 (0) | 841 (130) | 841 (130) | 0 | 0 | 0 |
| benign_everyday | 0 | 0/0 | 0 | 0 | 0 | - | 975 | 163 (20) | 243 (155) | 243 (155) | 0 | 0 | 0 |
| fraude_conforme | 0 | 0/0 | 0 | 0 | 0 | - | 0 | 0 (0) | 0 (0) | 0 (0) | 0 | 0 | 0 |
| onchain | 961 | 961/961 | 911 | 911 | 911 | 5 | 0 | 0 (0) | 0 (0) | 0 (0) | 50 | 0 | 0 |
| poison_sites_tokens | 1056 | 1045/1056 | 566 | 645 | 891 | 38 | 0 | 0 (0) | 0 (0) | 0 (0) | 411 | 0 | 200 |
| sig | 913 | 912/913 | 904 | 904 | 904 | 1 | 0 | 0 (0) | 0 (0) | 0 (0) | 9 | 0 | 157 |


## 4. Les 10 familles où l'écart est le plus grand, et ce qui rétablirait la détection

Critère : écart de rappel FULL - B en points (bras `intention_produit`), unités à au moins 5 malveillants ; pour V2 l'unité est la sous-famille (les familles V2 sont trop larges). Tableau complet, avec aussi le classement par nombre absolu de détections perdues, dans `out/TOP10_produit.md` (versions pour le bras du catalogue dans `out/TOP10_catalogue.md`). « rest. X » = nombre de détections perdues en B (attrapées en FULL) qui sont de nouveau attrapées quand on ajoute X à C ; « rest. C » = récupérées par le carnet et l'historique seuls.

#### Top 10 par écart en points (n malveillants >= 5)

| # | unité | n malv. | FULL | B | C | écart FULL-B (pts) | perdus | autre bras (intention_mensongere) FULL/B | rest. C | rest. S_code | rest. S_age | rest. S_tok | rest. S_bal | rest. S_look | rest. S_site | rest. S_sim | rest. S_quote | rest. D | rest. O4 | rest. D_O4 | coût moyen/vérif. (code, âge, jeton, solde) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | V2_DEV:onchain/multicall_depth1_transferFrom | 16 | 16 | 0 | 0 | 100 | 16 | 16/16 | 0 | 0 | 0 | 0 | 16 | 0 | 0 | 0 | 0 | 0 | 16 | 16 | 1.0, 1.0, 2.0, 1.0 |
| 2 | DEV:adresse_empoisonnee | 15 | 15 | 0 | 15 | 100 | 15 | 15/15 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 15 | 1.0, 1.0, 0.0, 1.0 |
| 3 | V2_DEV:onchain/multicall_depth3_transferFrom | 15 | 15 | 0 | 0 | 100 | 15 | 15/15 | 0 | 0 | 0 | 0 | 15 | 0 | 0 | 0 | 0 | 0 | 15 | 15 | 1.0, 1.0, 2.0, 1.0 |
| 4 | V2_DEV:onchain/multicall_depth2_transferFrom_aggregate3 | 11 | 11 | 0 | 0 | 100 | 11 | 11/0 | 0 | 0 | 0 | 0 | 11 | 11 | 0 | 0 | 0 | 0 | 11 | 11 | 1.0, 1.0, 1.1, 1.0 |
| 5 | V2_DEV:onchain/multicall_depth2_transferFrom | 8 | 8 | 0 | 0 | 100 | 8 | 8/8 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 8 | 8 | 1.0, 1.0, 2.0, 1.0 |
| 6 | DEV:honeypot | 6 | 6 | 0 | 0 | 100 | 6 | 6/0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 1.0, 1.0, 2.0, 1.0 |
| 7 | V2_DEV:poison_sites_tokens/addr_poison_dust_after_send | 93 | 93 | 28 | 93 | 70 | 65 | 93/82 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 1.3, 1.3, 0.8, 1.0 |
| 8 | V2_DEV:poison_sites_tokens/token_fake_usdc_same_symbol | 61 | 61 | 19 | 19 | 69 | 42 | 61/56 | 0 | 0 | 0 | 42 | 0 | 0 | 0 | 0 | 0 | 0 | 42 | 42 | 1.0, 1.0, 1.5, 1.0 |
| 9 | V2_DEV:poison_sites_tokens/addr_poison_fake_token_lookalike | 91 | 91 | 30 | 91 | 67 | 61 | 91/78 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 1.3, 1.3, 1.0, 1.0 |
| 10 | V2_DEV:poison_sites_tokens/addr_poison_zero_transferFrom | 87 | 87 | 29 | 87 | 67 | 58 | 87/74 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 1.3, 1.3, 0.8, 1.0 |

#### Top 10 par nombre absolu de détections perdues

| # | unité | n malv. | FULL | B | C | écart FULL-B (pts) | perdus | autre bras (intention_mensongere) FULL/B | rest. C | rest. S_code | rest. S_age | rest. S_tok | rest. S_bal | rest. S_look | rest. S_site | rest. S_sim | rest. S_quote | rest. D | rest. O4 | rest. D_O4 | coût moyen/vérif. (code, âge, jeton, solde) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | V2_DEV:poison_sites_tokens/addr_poison_dust_after_send | 93 | 93 | 28 | 93 | 70 | 65 | 93/82 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 65 | 1.3, 1.3, 0.8, 1.0 |
| 2 | V2_DEV:poison_sites_tokens/addr_poison_fake_token_lookalike | 91 | 91 | 30 | 91 | 67 | 61 | 91/78 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 61 | 1.3, 1.3, 1.0, 1.0 |
| 3 | V2_DEV:poison_sites_tokens/addr_poison_zero_transferFrom | 87 | 87 | 29 | 87 | 67 | 58 | 87/74 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 58 | 1.3, 1.3, 0.8, 1.0 |
| 4 | V2_DEV:poison_sites_tokens/clipboard_swap | 97 | 90 | 39 | 58 | 53 | 51 | 93/77 | 19 | 19 | 19 | 19 | 39 | 40 | 19 | 19 | 19 | 19 | 39 | 39 | 1.1, 1.1, 0.5, 1.0 |
| 5 | V2_DEV:poison_sites_tokens/addressbook_poisoned | 76 | 74 | 27 | 70 | 62 | 47 | 74/59 | 43 | 43 | 43 | 43 | 47 | 43 | 43 | 43 | 43 | 43 | 47 | 47 | 1.4, 1.4, 1.0, 1.0 |
| 6 | V2_DEV:poison_sites_tokens/token_fake_usdc_same_symbol | 61 | 61 | 19 | 19 | 69 | 42 | 61/56 | 0 | 0 | 0 | 42 | 0 | 0 | 0 | 0 | 0 | 0 | 42 | 42 | 1.0, 1.0, 1.5, 1.0 |
| 7 | V2_DEV:poison_sites_tokens/token_honeypot | 52 | 52 | 27 | 27 | 48 | 25 | 52/38 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 25 | 0 | 0 | 0 | 0 | 1.0, 1.0, 1.4, 1.0 |
| 8 | V2_DEV:poison_sites_tokens/token_sell_tax_99 | 51 | 51 | 28 | 28 | 45 | 23 | 51/36 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 23 | 0 | 0 | 0 | 0 | 1.0, 1.0, 1.4, 1.0 |
| 9 | V2_DEV:poison_sites_tokens/fake_site_lookalike_domain | 169 | 169 | 149 | 149 | 12 | 20 | 169/167 | 0 | 0 | 0 | 0 | 11 | 0 | 20 | 0 | 0 | 0 | 11 | 11 | 1.0, 1.0, 2.0, 0.3 |
| 10 | V2_DEV:onchain/multicall_depth1_transferFrom | 16 | 16 | 0 | 0 | 100 | 16 | 16/16 | 0 | 0 | 0 | 0 | 16 | 0 | 0 | 0 | 0 | 0 | 16 | 16 | 1.0, 1.0, 2.0, 1.0 |

#### Fausses alertes critical créées par la perte de contexte (bénins critical en B mais pas dans le banc complet), unités à n bénin >= 5

**Bras intention_mensongere** (supprimé par : nombre de ces faux critical qui disparaissent quand on ajoute C = carnet+historique, D = liste statique livrée, O4 = lectures RPC)

| unité | n bénin | critical FULL | critical B | critical C | nouveaux critical en B | supprimés par C | par D | par O4 | par D+O4 |
|---|---|---|---|---|---|---|---|---|---|
| V2_DEV:benign_everyday/self_transfer_large | 75 | 0 | 75 | 0 | 75 | 75 | 75 | 75 | 75 |
| V2_DEV:benign_everyday/nft_listing_seaport | 75 | 0 | 75 | 75 | 75 | 0 | 75 | 0 | 75 |
| V2_DEV:benign_everyday/exchange_deposit_known | 74 | 0 | 74 | 0 | 74 | 74 | 74 | 74 | 74 |
| V2_DEV:benign_everyday/nft_setapprovalforall_marketplace | 60 | 0 | 60 | 60 | 60 | 0 | 60 | 0 | 60 |
| V2_DEV:benign_defi/liquidity_approve_lp | 10 | 0 | 10 | 10 | 10 | 0 | 10 | 0 | 10 |
| V2_DEV:benign_defi/benqi_approve_qi | 8 | 0 | 8 | 8 | 8 | 0 | 8 | 0 | 8 |
| DEV:depot_exchange | 6 | 0 | 6 | 0 | 6 | 6 | 6 | 6 | 6 |
| V2_DEV:benign_defi/wrap_deposit_plain_transfer | 11 | 0 | 9 | 9 | 9 | 0 | 0 | 9 | 9 |
| V2_DEV:benign_defi/bridge_stargate | 27 | 0 | 22 | 14 | 22 | 8 | 22 | 8 | 22 |
| V2_DEV:benign_defi/bridge_core_eth_to_avax | 18 | 0 | 14 | 14 | 14 | 0 | 14 | 0 | 14 |
| V2_DEV:benign_defi/approve_unlimited_router | 59 | 0 | 45 | 45 | 45 | 0 | 45 | 0 | 45 |
| V2_DEV:benign_defi/permit2_signature | 46 | 0 | 26 | 26 | 26 | 0 | 26 | 0 | 26 |

Causes des faux critical (codes du plancher et « adem: » du comparateur), bras intention_mensongere :
- banc complet : adem:asked_by_someone_outgoing 10, external_spender 10, adem:unexpected_approval 10, adem:no_incoming 1
- B : adem:first_seen_recipient 214, external_spender 211, unlimited_allowance 130, adem:unlimited_approval_swap 105, domain_verifier_unexpected 75, adem:unexpected_outgoing 75, approval_for_all 60, adem:unexpected_approval_connect 60, unknown_selector 37, opaque 37, adem:amount_exceeded 31, adem:unexpected_approval 21, slippage_unbounded 15, adem:no_incoming 10
- C : external_spender 211, unlimited_allowance 130, adem:unlimited_approval_swap 105, domain_verifier_unexpected 75, adem:unexpected_outgoing 75, approval_for_all 60, adem:unexpected_approval_connect 60, adem:first_seen_recipient 34, adem:amount_exceeded 31, unknown_selector 29, opaque 29, adem:unexpected_approval 21, slippage_unbounded 15, adem:no_incoming 10
- D : adem:no_incoming 10, adem:asked_by_someone_outgoing 10, external_spender 10, adem:unexpected_approval 10

Codes qui, dans le banc complet, attrapaient en critical les 325 malveillants que B ne marque plus critical : adem:high_balance_share 137, lookalike_reported 101, adem:lookalike_address 101, high_balance_share 98, site_origin_mismatch 92, adem:no_incoming 68, opaque 51, external_spender 40, token_unsellable 38, address_poisoning 37, token_sell_tax_extreme 35, service_recipient_not_self 31, adem:new_contract 24, far_expiry 24

Codes du banc complet pour les 138 malveillants qui passent à ok en B : lookalike_reported 74, adem:lookalike_address 74, high_balance_share 57, adem:high_balance_share 57, address_poisoning 37, token_sell_tax_extreme 22, token_unsellable 21, lookalike_address 14, site_origin_mismatch 10, adem:new_contract 5, token_symbol_impersonation 5, ens_name_lookalike 4

**Bras intention_produit** (supprimé par : nombre de ces faux critical qui disparaissent quand on ajoute C = carnet+historique, D = liste statique livrée, O4 = lectures RPC)

| unité | n bénin | critical FULL | critical B | critical C | nouveaux critical en B | supprimés par C | par D | par O4 | par D+O4 |
|---|---|---|---|---|---|---|---|---|---|
| V2_DEV:benign_everyday/nft_listing_seaport | 75 | 0 | 75 | 75 | 75 | 0 | 75 | 0 | 75 |
| V2_DEV:benign_everyday/nft_setapprovalforall_marketplace | 60 | 0 | 60 | 60 | 60 | 0 | 60 | 0 | 60 |
| V2_DEV:benign_defi/liquidity_approve_lp | 10 | 0 | 10 | 10 | 10 | 0 | 10 | 0 | 10 |
| V2_DEV:benign_defi/benqi_approve_qi | 8 | 0 | 8 | 8 | 8 | 0 | 8 | 0 | 8 |
| V2_DEV:benign_defi/approve_unlimited_router | 59 | 0 | 45 | 45 | 45 | 0 | 45 | 0 | 45 |
| V2_DEV:benign_defi/permit2_signature | 46 | 0 | 26 | 26 | 26 | 0 | 26 | 0 | 26 |
| V2_DEV:benign_defi/aave_gateway_approve_aToken | 14 | 0 | 7 | 7 | 7 | 0 | 7 | 0 | 7 |
| V2_DEV:benign_defi/permit_eip2612_router | 30 | 0 | 9 | 9 | 9 | 0 | 9 | 0 | 9 |
| V2_DEV:benign_defi/swap_uniswap_ur | 51 | 0 | 15 | 15 | 15 | 0 | 15 | 0 | 15 |
| V2_DEV:benign_defi/increase_allowance | 26 | 0 | 6 | 6 | 6 | 0 | 6 | 0 | 6 |
| DEV:approve_erc20 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| DEV:cow_uniswapx | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Causes des faux critical (codes du plancher et « adem: » du comparateur), bras intention_produit :
- banc complet : adem:asked_by_someone_outgoing 10, external_spender 10, adem:unexpected_approval 10
- B : external_spender 200, unlimited_allowance 130, adem:unlimited_approval_swap 105, domain_verifier_unexpected 75, adem:unexpected_outgoing 75, approval_for_all 60, adem:unexpected_approval_connect 60, slippage_unbounded 15, adem:asked_by_someone_outgoing 10, adem:unexpected_approval 10, control_change 9, far_expiry 9, delegation_7702 3, adem:unexpected_delegation_connect 2
- C : external_spender 200, unlimited_allowance 130, adem:unlimited_approval_swap 105, domain_verifier_unexpected 75, adem:unexpected_outgoing 75, approval_for_all 60, adem:unexpected_approval_connect 60, slippage_unbounded 15, adem:asked_by_someone_outgoing 10, adem:unexpected_approval 10, far_expiry 9, control_change 4, delegation_7702 3, adem:unexpected_delegation_connect 2
- D : adem:asked_by_someone_outgoing 10, external_spender 10, adem:unexpected_approval 10

Codes qui, dans le banc complet, attrapaient en critical les 673 malveillants que B ne marque plus critical : adem:lookalike_address 325, lookalike_reported 305, adem:high_balance_share 274, high_balance_share 226, adem:first_seen_recipient 205, address_poisoning 197, site_origin_mismatch 139, adem:no_incoming 76, lookalike_address 69, opaque 65, token_symbol_impersonation 58, token_unsellable 55, adem:wrong_recipient 54, token_sell_tax_extreme 54

Codes du banc complet pour les 502 malveillants qui passent à ok en B : adem:lookalike_address 298, lookalike_reported 278, high_balance_share 232, adem:high_balance_share 232, address_poisoning 197, adem:first_seen_recipient 175, lookalike_address 69, adem:wrong_recipient 57, adem:no_incoming 49, token_symbol_impersonation 46, adem:new_contract 32, token_unsellable 32, site_origin_mismatch 31, token_sell_tax_extreme 30


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

#### Effet cumulé du contexte minimal en ligne (bras intention_produit)

| niveau | lectures ajoutées à C | appels / vérification : moyenne, p95, max | % vérifications sans appel | rappel TOUT (critical+warn) | rappel DEV | rappel PUBLIC | rappel V2_DEV | FA warn+critical TOUT | FA critical TOUT |
|---|---|---|---|---|---|---|---|---|---|
| FULL | - | - | - | 99.2% [98.8-99.5] (3228/3254) | 98.8% [96.6-99.6] (249/252) | 84.7% [74.7-91.2] (61/72) | 99.6% [99.3-99.8] (2918/2930) | 15.4% [13.9-17.0] (329/2136) | 0.9% [0.6-1.4] (20/2136) |
| A | - | - | - | 81.2% [79.8-82.5] (2643/3254) | 84.1% [79.1-88.1] (212/252) | 69.4% [58.0-78.9] (50/72) | 81.3% [79.8-82.6] (2381/2930) | 55.7% [53.6-57.8] (1190/2136) | 13.9% [12.5-15.4] (297/2136) |
| B | - | - | - | 83.8% [82.5-85.0] (2726/3254) | 85.3% [80.4-89.2] (215/252) | 70.8% [59.5-80.1] (51/72) | 84.0% [82.6-85.2] (2460/2930) | 54.2% [52.1-56.3] (1158/2136) | 13.9% [12.5-15.4] (297/2136) |
| C | - | - | - | 91.9% [91.0-92.8] (2992/3254) | 91.7% [87.6-94.5] (231/252) | 76.4% [65.4-84.7] (55/72) | 92.4% [91.3-93.3] (2706/2930) | 54.2% [52.1-56.3] (1158/2136) | 13.7% [12.3-15.2] (292/2136) |
| O1 | code | 0.86, 1, 9 | 19 % | 91.9% [91.0-92.8] (2992/3254) | 91.7% [87.6-94.5] (231/252) | 76.4% [65.4-84.7] (55/72) | 92.4% [91.3-93.3] (2706/2930) | 54.2% [52.1-56.3] (1158/2136) | 13.7% [12.3-15.2] (292/2136) |
| O2 | code+age | 1.73, 2, 18 | 17 % | 92.2% [91.2-93.1] (3000/3254) | 93.3% [89.5-95.7] (235/252) | 81.9% [71.5-89.1] (59/72) | 92.4% [91.3-93.3] (2706/2930) | 54.2% [52.1-56.3] (1158/2136) | 13.7% [12.3-15.2] (292/2136) |
| O3 | code+age+tok | 2.89, 6, 18 | 17 % | 93.6% [92.7-94.4] (3046/3254) | 94.8% [91.4-97.0] (239/252) | 81.9% [71.5-89.1] (59/72) | 93.8% [92.9-94.6] (2748/2930) | 50.0% [47.9-52.2] (1069/2136) | 13.7% [12.3-15.2] (292/2136) |
| O4 | code+age+tok+bal | 3.42, 7, 19 | 17 % | 96.6% [95.9-97.2] (3143/3254) | 96.4% [93.4-98.1] (243/252) | 83.3% [73.1-90.2] (60/72) | 96.9% [96.2-97.5] (2840/2930) | 52.6% [50.5-54.7] (1124/2136) | 13.7% [12.3-15.2] (292/2136) |
| D | - | 0 (liste livrée) | - | 90.1% [89.1-91.1] (2933/3254) | 91.7% [87.6-94.5] (231/252) | 76.4% [65.4-84.7] (55/72) | 90.3% [89.2-91.4] (2647/2930) | 17.1% [15.6-18.7] (365/2136) | 0.9% [0.6-1.4] (20/2136) |
| D_O4 | - | - | - | 95.1% [94.4-95.8] (3096/3254) | 96.4% [93.4-98.1] (243/252) | 83.3% [73.1-90.2] (60/72) | 95.3% [94.5-96.0] (2793/2930) | 15.4% [13.9-17.0] (329/2136) | 0.9% [0.6-1.4] (20/2136) |

#### Effet par unité (25 plus gros gains O4 - C, nombre de malveillants attrapés)


| unité | n malv. | FULL | B | C | +code (O1) | +âge (O2) | +jeton (O3) | +solde (O4) | liste statique D | D+O4 |
|---|---|---|---|---|---|---|---|---|---|---|
| V2_DEV:poison_sites_tokens/token_fake_usdc_same_symbol | 61 | 61 | 19 | 19 | 19 | 19 | 61 | 61 | 7 | 61 |
| V2_DEV:poison_sites_tokens/clipboard_swap | 97 | 90 | 39 | 58 | 58 | 58 | 58 | 78 | 58 | 78 |
| V2_DEV:onchain/multicall_depth1_transferFrom | 16 | 16 | 0 | 0 | 0 | 0 | 0 | 16 | 0 | 16 |
| V2_DEV:onchain/multicall_depth3_transferFrom | 15 | 15 | 0 | 0 | 0 | 0 | 0 | 15 | 0 | 15 |
| V2_DEV:onchain/multicall_depth2_transferFrom_aggregate3 | 11 | 11 | 0 | 0 | 0 | 0 | 0 | 11 | 0 | 11 |
| V2_DEV:poison_sites_tokens/fake_site_lookalike_domain | 169 | 169 | 149 | 149 | 149 | 149 | 149 | 160 | 149 | 160 |
| V2_DEV:onchain/multicall_depth2_transferFrom | 8 | 8 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 8 |
| V2_DEV:poison_sites_tokens/token_airdrop_lure | 59 | 57 | 52 | 52 | 52 | 52 | 52 | 57 | 52 | 57 |
| V2_DEV:poison_sites_tokens/addressbook_poisoned | 76 | 74 | 27 | 70 | 70 | 70 | 70 | 74 | 70 | 74 |
| DEV:faux_support | 6 | 6 | 4 | 4 | 4 | 4 | 4 | 6 | 4 | 6 |
| DEV:urgence_bancaire | 6 | 6 | 4 | 4 | 4 | 4 | 4 | 6 | 4 | 6 |
| V2_DEV:poison_sites_tokens/fake_site_drainer_kit | 85 | 85 | 82 | 82 | 82 | 82 | 82 | 84 | 82 | 84 |


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

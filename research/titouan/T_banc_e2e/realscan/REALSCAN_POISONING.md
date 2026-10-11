# REALSCAN : empoisonnement d'adresse mesuré sur la C-Chain Avalanche (données réelles)

Date : 11 oct. 2026. Lecture seule, RPC public `api.avax.network` (aucun repli nécessaire, tranches de 10 000 blocs acceptées, 1 requête à la fois, 700 ms entre requêtes). Script : `scan_poisoning.mjs` (paramètres `--blocks --end --seed --chunk --txsample`). Commande utilisée : `node scan_poisoning.mjs --blocks 300000 --end 97243893 --txsample 600` (graine 1). Résultats bruts : `out\summary.json`, `out\candidates.json` (adresses complètes, données on-chain publiques), `out\sample.json`, `out\campaign_tx_senders.json`, `out\run_log.txt`. Cache des logs : `out\cache_\` (ignoré par git). Dans ce rapport, adresses de victimes tronquées (6 premiers + 4 derniers).

## 1. Fenêtre et données
- Blocs 96 943 894 à 97 243 893 (300 000 blocs, 0,94 bloc/s), du 2026-10-07 09:12 UTC au 2026-10-11 01:39 UTC (~3,7 jours). Fenêtre de 20 min = 1 131 blocs.
- 517 285 événements Transfer ERC-20 (USDC 397 991 ; USDT 119 294). 445 370 transferts "réels" (>= 1 USD), 67 350 transferts minuscules (< 1 USD) dont 6 583 de valeur nulle.
- 2 373 806 couples (transfert réel A->B, événement minuscule touchant A dans les 20 min) examinés.

## 2. Règle implémentée
Pour chaque transfert réel A->B (>= 1 USD), on cherche dans les 1 200 s suivantes (autre tx) un événement de valeur < 1 USD impliquant A et une adresse S différente de A et B, avec S sosie de B (préfixe >= 3 et suffixe >= 4 hexa identiques, insensible à la casse). Types : `in_dust` (S->A minuscule non nul), `in_zero` (S->A valeur 0), `out_zero` (A->S valeur 0, forgé par transferFrom). Un envoi volontaire A->S > 0 n'est pas une injection. Variante (iii) faux jeton : non couverte (seulement USDC/USDT natifs).

## 3. Résultats (n = 2 169 candidats uniques A|B|S)
| Mesure | Valeur |
|---|---|
| Candidats 3+4 | **2 169** |
| Victimes ciblées (A distinctes) | **1 328** |
| Sosies S distincts | 1 905 |
| Types | out_zero seul 1 179 ; in_dust seul 965 ; in_dust + out_zero 25 ; in_zero pur : 0 |
| Délai médian après l'envoi réel | 70 s (max 1 191 s) |
| Poussière envoyée par l'attaquant | 1 502 événements, **0,108 USD au total** ; valeur dominante 0,000016 (1 335 évts), puis 0,001 (44), 0,0005 (14) |
| Événements zéro forgés | 2 074 |
| Perte réelle (A a ensuite envoyé >= 1 USD vers S) | **0 cas, 0 USD** dans la fenêtre |
| Envois réels ayant servi de déclencheur | 29,7 M USD cumulés, 679 candidats >= 1 000 USD : c'est l'exposition, pas une perte |

Aucune perte observée : la fenêtre est courte et la perte, si elle a lieu, peut arriver des jours plus tard (le test "victime envoie vers S" ne voit que le reste de la fenêtre).

## 4. 3+4 contre 4+4 contre seuils plus bas
- 4+4 : 1 586 candidats ; **la règle 4+4 en rate 583 sur 2 169 (26,9 %)**.
- 3+3 : 3 025 (+856 par rapport à 3+4). 2+3 : 3 025 (aucun ajout). Ces 856 supplémentaires ne sont pas validés.

## 5. Faux positifs par collision aléatoire
- Attendu analytique pour des adresses sans lien : 0,0078 collision 3+4 sur les 2,37 M de couples (0,124 en 3+3).
- Contrôle empirique : destinataires B mélangés au hasard (graine 1, 10 répétitions), en excluant les sosies déjà identifiés : moyenne **0** collision 3+4 (0 sur les 10 runs), 0,5 en 3+3 et 2+3. Un premier essai sans exclusion donnait ~1 par run : c'était de la contamination par de vraies attaques (même B visée par plusieurs victimes), pas du hasard.
- Conclusion : à 3+4 le hasard est négligeable (< 0,01 attendu pour 2 169 candidats). Ce que ce contrôle ne mesure PAS : les sosies légitimes (deux adresses du même propriétaire, contrats). Dans nos données, 0 candidat n'a de relation antérieure >= 1 USD entre A et S dans la fenêtre, et aucune des adresses (A, B, S) de l'échantillon de 40 n'est un contrat.

## 6. Validation à la main (échantillon aléatoire de 40, graine 1)
Vérifications on-chain pour les 40 : `eth_getCode` (A, B, S : tous des comptes externes) et `tx.from` de l'événement (jamais la victime : les 25 événements `out_zero` de l'échantillon sont des transferFrom forgés par un tiers, la victime n'a rien signé).

Verdict manuel : **38 empoisonnement probable, 2 indéterminé, 0 faux positif.** Les 2 indéterminés : poussière 0,001 et 0,00015 USD (valeur différente de la signature 0,000016, à 4+4). Critère : événement forgé sans signature de la victime, ou poussière à la valeur de signature 0,000016, comptes externes, délai < 20 min, aucun lien antérieur. Les étiquettes ne sont pas indépendantes de la règle (mêmes signaux).

La liste complète des 40 paires alignées (adresses entières, montants, délais, relation) est dans `out\run_log.txt` (section "échantillon"). Extrait de 12 (A tronquée) :

| # | A | préfixe+suffixe | type / valeur | envoi réel | délai | verdict |
|---|---|---|---|---|---|---|
| 1 | 0x7a710c..4c14 | 3+4 | in_dust 0.000016 | 20 USDC | 125 s | probable |
| 2 | 0x282b19..2674 | 4+4 | out_zero 0 | 99999 USDT | 368 s | probable |
| 3 | 0x7c931b..3980 | 4+4 | out_zero 0 | 3500 USDT | 38 s | probable |
| 4 | 0xd30734..5365 | 4+4 | out_zero 0 | 465 USDT | 555 s | probable |
| 5 | 0x1f50c4..8d17 | 4+4 | out_zero 0 (x4) | 96 USDT | 50 s | probable |
| 6 | 0x614548..0722 | 4+5 | out_zero 0 | 1 USDT | 1009 s | probable |
| 7 | 0x5691c3..93e5 | 4+4 | out_zero 0 | 7201.48 USDC | 579 s | probable |
| 8 | 0x282fb8..b644 | 4+5 | out_zero 0 (x2) | 29.63 USDC | 39 s | probable |
| 9 | 0xfe4473..b87f | 4+4 | out_zero 0 | 578.59 USDT | 371 s | probable |
| 10 | 0x43c37e..8fc5 | 3+4 | in_dust 0.000016 | 5 USDC | 88 s | probable |
| 11 | 0x36fbb4..5ff3 | 3+4 | in_dust 0.000016 | 356 USDC | 115 s | probable |
| 12 | 0xd0bc6c..40d7 | 3+4 | in_dust 0.000016 (x2) | 13.96 USDC | 118 s | probable |

Extrait des 12 premieres lignes de out/sample.json (jeu final).

## 7. Campagnes
- 3 234 transactions d'empoisonnement distinctes. Sur 600 tirées au hasard : **221 expéditeurs (tx.from) distincts**. Trois expéditeurs dominent : 153, 96 et 79 transactions, touchant ~160, ~114 et ~79 victimes de l'échantillon (55 % des tx échantillonnées) ; puis longue traîne (12, 10 tx, puis 1 à 5).
- Lecture : **au moins 3 campagnes industrielles + une longue traîne de petits acteurs** ; nombre exact non déterminé (clustering par expéditeur de tx seulement, pas par financement ; un opérateur peut utiliser plusieurs EOA, un relayeur peut servir plusieurs opérateurs).
- Signature dominante : poussière de 0,000016 USDC/USDT (U4 décrivait 0,00001 en 2025 : variante proche, même famille de technique) et faux transferts de valeur nulle.

## 8. ScamSniffer (`bench\data\address.json`, 2 530 adresses ; comptes seulement)
- Sosies S : **0 sur 1 905** dans la liste. Expéditeurs de tx (221) : **0 sur 221**. Victimes : 0 sur 1 328. La liste n'aide pas sur cette campagne Avalanche (confirme U4 : trou de couverture). La détection par ressemblance fonctionne sans liste.

## 9. Honnêteté et limites
- Échantillon de commodité : une seule fenêtre de 3,7 jours, fin 2026, USDC + USDT seulement (autres jetons, faux jetons, AVAX natif non vus). Ne pas extrapoler à l'année (U4 : 36 744 victimes en 142 jours en 2025 ; ici 1 328 en 3,7 jours, ordre de grandeur voisin mais non comparable).
- n = 2 169 candidats, 40 vérifiés à la main (1,8 %). Étiquettes non indépendantes de la règle ; pas de vérité terrain externe. Le rappel n'est pas mesuré (attaques sans envoi réel précédent, ou hors 3+4, invisibles). Le faux positif "hasard" est mesuré ; celui des sosies légitimes ne l'est pas (0 observé sur 40).
- Pertes : test limité à la fenêtre ; 0 observée ne veut pas dire 0 réelle. Délais estimés via 0,94 bloc/s (exacts pour l'échantillon).
- Clustering des campagnes : 600 tx sur 3 234, par tx.from seulement.
- `in_zero` pur : 0 cas (les zéros observés sont des A->S forgés, la victime étant le "from" de l'événement).

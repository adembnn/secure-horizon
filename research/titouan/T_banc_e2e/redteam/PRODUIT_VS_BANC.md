# Produit contre banc : ce que le produit attrape vraiment

Le banc (`check_plus.mjs`) donne aux règles un contexte riche pour chaque cas. Le produit livré (`server/server.mjs`, fonction `evaluate`) n'a presque rien de ce contexte. Le rappel du banc n'est donc pas le rappel du produit. Ce document mesure l'écart avec `redteam/check_product.mjs`, qui fait passer chaque cas par la fonction `evaluate` réellement livrée.

**Résultat : sur 6 191 arnaques, le produit d'aujourd'hui en rate 3 643. Le banc en rate 832.** Le contexte lu sur la chaîne ne rattrape que 129 arnaques à lui seul. L'essentiel de l'écart vient des 13 détecteurs de `detectors_adem/`, qui tournent dans le banc et pas dans le produit.

Mesure du 11 octobre 2026 à 05h00, commit `816fbfb`, sur `V2_DEV_norm.jsonl` et les neuf fichiers `jury_*.jsonl` : 9 908 cas, dont 6 191 arnaques et 2 695 cas bénins. Les 1 022 cas restants portent une autre étiquette (ambigu, fraude conforme) et ne sont pas comptés. `V2_TEST` n'a pas été lu. Le moteur, le serveur et les détecteurs changeaient pendant la mesure : les chiffres sont une photo, les commandes pour la refaire sont en fin de document.

## Les quatre colonnes

| Colonne | Ce qui tourne | Ce que les règles reçoivent |
|---|---|---|
| Produit aujourd'hui | `evaluate` de `server/server.mjs`, sans modification | La demande, l'origine de la page, la chaîne, l'adresse du signataire, le carnet d'adresses et l'historique du cas |
| Produit + contexte live | Le même serveur avec `context_live/server_integration.diff` | En plus : ce que `context_live/provider.mjs` lirait sur la chaîne (contrat ou compte, âge, soldes, symbole et décimales), pris dans le cas pour ces champs seulement |
| Produit + contexte live + détecteurs | En plus : les détecteurs de `detectors_adem/` | Le même contexte. Les détecteurs ne voient aucun champ réservé au banc |
| Banc | `check_plus.mjs` | Tout le contexte du cas et l'intention complète |

Une arnaque est ratée quand le produit n'affiche pas l'écran rouge. Une fausse alerte est un cas bénin en rouge. La correspondance entre les niveaux du produit et l'échelle du banc est en tête de `check_product.mjs`.

## Totaux

| | Produit aujourd'hui | Produit + live | Produit + live + détecteurs | Banc |
|---|---|---|---|---|
| Arnaques ratées (sur 6 191) | 3 643 | 3 514 | 593 | 832 |
| Rappel | 41,2 % | 43,2 % | 90,4 % | 86,6 % |
| Fausses alertes (sur 2 695) | 440 | 440 | 1 127 | 329 |
| Taux de fausses alertes | 16,3 % | 16,3 % | 41,8 % | 12,2 % |
| Cas bénins en orange | 1 086 | 1 173 | 647 | 578 |

La troisième colonne rate moins d'arnaques que le banc, mais elle met en rouge 42 % des cas bénins. Sans liste de protocoles connus, tout bénéficiaire est inconnu et beaucoup de demandes passent en rouge pour cette seule raison. Ce rappel de 90 % n'est pas un vrai résultat. Avec une liste de protocoles connus, la même configuration donne 896 arnaques ratées et 458 fausses alertes (voir plus bas).

## Par fichier

Chaque case donne : arnaques ratées / fausses alertes.

| Fichier | Arnaques | Bénins | Aujourd'hui | + live | + live + détecteurs | Banc |
|---|---|---|---|---|---|---|
| `V2_DEV_norm` | 2 930 | 1 976 | 901 / 265 | 780 / 265 | 34 / 666 | 21 / 20 |
| `jury_defi` | 60 | 0 | 34 / 0 | 34 / 0 | 10 / 0 | 11 / 0 |
| `jury_fp` | 0 | 123 | 0 / 27 | 0 / 27 | 0 / 52 | 0 / 6 |
| `jury_fuzz_address` | 299 | 82 | 299 / 0 | 299 / 0 | 97 / 8 | 105 / 8 |
| `jury_fuzz_control` | 368 | 5 | 360 / 5 | 360 / 5 | 8 / 5 | 8 / 5 |
| `jury_fuzz_encoding` | 940 | 0 | 940 / 0 | 940 / 0 | 192 / 0 | 211 / 0 |
| `jury_fuzz_fp` | 0 | 509 | 0 / 143 | 0 / 143 | 0 / 396 | 0 / 290 |
| `jury_fuzz_intent` | 420 | 0 | 420 / 0 | 412 / 0 | 241 / 0 | 264 / 0 |
| `jury_fuzz_sig` | 1 101 | 0 | 634 / 0 | 634 / 0 | 0 / 0 | 184 / 0 |
| `jury_social` | 73 | 0 | 55 / 0 | 55 / 0 | 11 / 0 | 28 / 0 |
| **Total** | **6 191** | **2 695** | **3 643 / 440** | **3 514 / 440** | **593 / 1 127** | **832 / 329** |

Trois fichiers de fuzzing sont ratés en entier ou presque par le produit d'aujourd'hui : adresses sosies (299 sur 299), encodages (940 sur 940), intentions (420 sur 420). Le contexte live n'y change rien. Ce sont les détecteurs qui les attrapent.

## Par famille

Seuls quatre fichiers portent un champ `family`. Les autres n'ont que la ligne par fichier ci-dessus.

### `V2_DEV_norm`

| Famille | Arnaques | Bénins | Aujourd'hui | + live | + live + détecteurs | Banc |
|---|---|---|---|---|---|---|
| `onchain` | 961 | 0 | 289 / 0 | 244 / 0 | 0 / 0 | 0 / 0 |
| `poison_sites_tokens` | 1 056 | 0 | 348 / 0 | 314 / 0 | 6 / 0 | 13 / 0 |
| `sig` | 913 | 0 | 264 / 0 | 222 / 0 | 28 / 0 | 8 / 0 |
| `benign_defi` | 0 | 1 001 | 0 / 130 | 0 / 130 | 0 / 384 | 0 / 0 |
| `benign_everyday` | 0 | 975 | 0 / 135 | 0 / 135 | 0 / 282 | 0 / 20 |

### `jury_fp`, `jury_fuzz_sig`

| Fichier, famille | Arnaques | Bénins | Aujourd'hui | + live | + live + détecteurs | Banc |
|---|---|---|---|---|---|---|
| `jury_fp`, `jury_fp` | 0 | 123 | 0 / 27 | 0 / 27 | 0 / 52 | 0 / 6 |
| `jury_fuzz_sig`, `sig_fuzz` | 1 101 | 0 | 634 / 0 | 634 / 0 | 0 / 0 | 184 / 0 |

### `jury_fuzz_fp` (cas bénins seulement : fausses alertes)

| Famille | Bénins | Aujourd'hui | + live | + live + détecteurs | Banc |
|---|---|---|---|---|---|
| `account` | 14 | 12 | 12 | 12 | 14 |
| `approve` | 94 | 64 | 64 | 70 | 88 |
| `bridge` | 29 | 0 | 0 | 29 | 27 |
| `chain` | 10 | 0 | 0 | 0 | 0 |
| `lending` | 28 | 0 | 0 | 28 | 4 |
| `lp` | 37 | 14 | 14 | 37 | 13 |
| `nft` | 41 | 10 | 10 | 24 | 12 |
| `pay` | 57 | 0 | 0 | 13 | 38 |
| `sign` | 19 | 10 | 10 | 19 | 13 |
| `staking` | 38 | 0 | 0 | 38 | 10 |
| `swap` | 142 | 33 | 33 | 126 | 71 |

Sur ce fichier, le banc lui-même met en rouge 290 cas bénins sur 509.

## D'où vient l'écart

Le banc sans ses détecteurs (`check_plus.mjs --base`) rate 2 931 arnaques et fait 328 fausses alertes. L'écart se découpe donc ainsi :

| De | À | Arnaques ratées | Cause |
|---|---|---|---|
| Produit aujourd'hui | Banc sans détecteurs | 3 643 → 2 931 | Le contexte riche et l'intention complète : 712 arnaques |
| Banc sans détecteurs | Banc | 2 931 → 832 | Les détecteurs : 2 099 arnaques |

Contrôle croisé : le banc privé de tout ce que le produit n'a pas rate 718 arnaques et fait 1 153 fausses alertes. Le produit avec les détecteurs et sans contexte live donne 716 et 1 137. Les deux mesures se rejoignent : `check_product.mjs` reproduit bien la chaîne du banc, et l'écart restant est seulement le contexte.

## Quels champs manquants coûtent le plus

### Ajouter un fait à la fois au produit équipé des détecteurs

Référence : produit + détecteurs, sans contexte live : 716 arnaques ratées, 1 137 fausses alertes.

| Fait ajouté | Arnaques ratées | Fausses alertes | Effet |
|---|---|---|---|
| Âge du contrat | 655 | 1 109 | 61 arnaques rattrapées |
| Contrat ou compte simple | 674 | 1 109 | 42 arnaques rattrapées |
| Symbole et décimales du jeton | 715 | 1 109 | 1 arnaque rattrapée |
| Solde du signataire | 719 | 1 109 | Aucun gain. 63 cas bénins de plus en orange |
| Adresse jamais vue | 719 | 1 109 | Aucun gain |
| Les cinq ensemble | 593 | 1 127 | 123 arnaques rattrapées |
| Liste de protocoles connus (hors chaîne) | 994 | 486 | 651 fausses alertes en moins, 278 arnaques en plus |
| Liste de protocoles connus + les cinq | 896 | 458 | Configuration cible |

Dès qu'un fait live est présent, le diff donne aussi aux règles la table de jetons du moteur. C'est ce qui explique les 28 fausses alertes en moins et les 3 arnaques en plus sur chaque ligne, quel que soit le fait.

Sans les détecteurs, les mêmes faits rapportent moins : 87 arnaques pour « contrat ou compte », 42 pour les jetons, rien pour l'âge, 129 au total.

La liste de protocoles connus fait remonter 278 arnaques ratées. Ces arnaques n'étaient en rouge que parce que tout bénéficiaire était inconnu. Elles n'étaient pas vraiment détectées.

### Retirer un champ à la fois du banc

Référence : banc complet, 832 arnaques ratées, 329 fausses alertes.

| Champ retiré | Arnaques ratées | Fausses alertes | Lecture |
|---|---|---|---|
| `token_info` | 959 (+127) | 329 | Le champ le plus coûteux en rappel. Le provider n'en fournit que le symbole, les décimales et l'âge |
| Détails de l'intention (jeton, montant, destinataire, message collé) | 931 (+99) | 322 | L'extension ne demande que le type d'intention |
| `share_of_balance_pct` | 890 (+58) | 329 | Fourni par le provider pour une sortie de fonds |
| `counterparty_facts` en entier | 876 (+44) | 329 | Fourni par le provider (contrat, âge) et par l'historique local |
| `claimed_site` | 873 (+41) | 329 | Le site que la page prétend être. Le produit ne l'a pas |
| `token_registry` | 869 (+37) | 357 (+28) | Table de jetons de référence |
| `known_protocols` | 641 (−191) | 823 (+494) | Le champ qui évite les fausses alertes |
| `clipboard`, `simulation`, `nft`, `sell_pool` | 836 (+4) | 329 | Presque sans effet |
| `quote`, âge seul | 832 | 329 | Sans effet sur le rouge |

Deux résultats vont à l'encontre de l'attendu et méritent un examen par les propriétaires des règles :

- Retirer le carnet d'adresses fait rater moins d'arnaques (734) et ajoute 57 fausses alertes. Retirer l'historique en fait rater 795.
- Donner au produit le type d'intention sans ses détails fait rater plus d'arnaques dès que les détecteurs sont actifs : 1 034 au lieu de 716, soit 396 cas perdus, surtout dans `jury_fuzz_intent` (151), `poison_sites_tokens` (111) et `jury_fuzz_address` (98). Sans détecteurs, la même intention rattrape 321 arnaques et ajoute 107 fausses alertes.

## Les trois étapes d'intégration, par ordre de gain

1. **Brancher les détecteurs de `detectors_adem/` dans `evaluate`** (serveur et extension autonome). Arnaques ratées : 3 643 → 716. Le gain (2 927 arnaques) dépasse l'écart total avec le banc (2 811), mais une partie est du rouge par ignorance : seule, cette étape porte les fausses alertes de 440 à 1 137. Elle ne se livre pas sans l'étape 2.
2. **Livrer une liste de protocoles connus par chaîne** (`knownSpenders`). Le produit connaît cinq adresses canoniques et quatre jetons d'Ethereum, aucun d'Avalanche. Fausses alertes : 1 137 → 486. Arnaques ratées : 716 → 994, parce que 278 arnaques n'étaient rouges que par ignorance.
3. **Brancher le contexte live** (`context_live/provider.mjs`, diff prêt). Arnaques ratées : 994 → 896. Fausses alertes : 486 → 458. L'âge du contrat et la nature de l'adresse portent tout le gain.

Après ces trois étapes : 896 arnaques ratées et 458 fausses alertes, contre 832 et 329 pour le banc. Le reste de l'écart tient aux champs que le produit ne peut pas lire aujourd'hui : le détail de `token_info`, les détails de l'intention et `claimed_site`.

## Limites de la mesure

- Les faits « live » viennent du cas, pas d'un nœud. La mesure suppose que le provider répond. Un fait absent du cas reste inconnu.
- Le provider ne reconnaît un jeton que pour un transfert, un droit accordé ou un permis. Les jetons d'un chemin d'échange n'ont ni symbole ni solde. La mesure applique cette limite.
- Le produit n'a pas de texte de page dans ces fichiers. Le niveau « manipulation » n'est jamais atteint.
- L'intention n'est pas donnée au produit, sauf avec `--with-intent`.
- L'horloge du produit est remplacée par la date du cas pendant la mesure.
- Un dossier `pipeline/` est apparu pendant ce travail (`pipeline/evaluate_plus.mjs`). Il n'est pas mesuré ici.

## Refaire la mesure

```
node redteam/check_product.mjs redteam/V2_DEV_norm.jsonl redteam/jury_*.jsonl --quiet
node redteam/check_product.mjs redteam/V2_DEV_norm.jsonl redteam/jury_*.jsonl --quiet --live-like
node redteam/check_product.mjs redteam/V2_DEV_norm.jsonl redteam/jury_*.jsonl --quiet --live-like --with-detectors
node redteam/check_plus.mjs    redteam/V2_DEV_norm.jsonl redteam/jury_*.jsonl --quiet
```

Options utiles : `--report` (tableau par famille), `--fails` (liste des échecs), `--live-fields=code,age,balances,tokens,seen` (un sous-ensemble des faits), `--with-known-protocols`, `--with-intent`. Avec `--live-like` ou `--with-detectors`, le résumé porte `parity_mismatch` : il doit valoir 0, ce qui prouve que le serveur modifié sans fait live rend les mêmes niveaux que le serveur livré.

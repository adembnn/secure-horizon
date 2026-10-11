# Registre des contournements (append-only)

| agent | technique | n_pass/n_test | exemple id |
|---|---|---|---|
| fuzz_address | M1 « Payer Paul » sans adresse choisie : n'importe quel destinataire (clipper aléatoire, ENS, historique) ; le label n'est pas résolu dans le carnet | 1024/1721 | fa-grid-7-00001 |
| fuzz_address | M2 sosie sous le seuil 3+4 (ex. 6-8 premiers + 3 derniers, 2 premiers + 8 derniers) avec poussière/faux token, intention pay_someone | 860/2526 | fa-grid-7-01017 |
| fuzz_address | M3 carnet d'adresses empoisonné, sans vraie adresse dans l'historique | 283/288 | fa-random-11-00451 |
| fuzz_address | M4 destinataire = contrat (routeur connu en liste blanche, ou contrat du token lui-même) | 431/605 | fa-r2-23-00020 |
| fuzz_address | M5 type pay_someone choisi pour son propre exchange/Ledger : la règle « jamais vu » saute | 216/344 | fa-random-11-00329 |
| fuzz_address | F1 (fausse alerte) payer la vraie adresse après de la poussière d'un sosie : critical lookalike_address | 258/258 | fa-benign-5-00010 |
| fuzz_address | F2 (fausse alerte, contestable) nouvelle adresse de dépôt d'exchange sous send_to_my_account | 177/177 | fa-r2benign-29-00001 |
| fuzz_sig | sig:eip2612 | 377/377 | fuzzsig-00003 |
| fuzz_sig | sig:blur | 148/148 | fuzzsig-00016 |
| fuzz_sig | sig:dai | 174/174 | fuzzsig-00019 |
| fuzz_sig | sig:psTxHex | 193/193 | fuzzsig-00056 |
| fuzz_sig | sig:psText | 135/192 | fuzzsig-00005 |
| fuzz_sig | sig:p2witness | 71/333 | fuzzsig-00022 |
| fuzz_sig | sig:p2single | 72/339 | fuzzsig-00009 |
| fuzz_sig | sig:p2tf | 31/153 | fuzzsig-00033 |
| fuzz_sig | sig:p2batch | 33/189 | fuzzsig-00097 |
| fuzz_sig | sig:p2btf | 26/160 | fuzzsig-00020 |
| fuzz_intent | T1 kind absent/hors enum (casse, espace, tableau) -> transfert vers escroc jamais vu | 7836/7836 | fuzz_intent-p1-25200 |
| fuzz_intent | T2 askedBy=support ignoré si kind != asked_by_someone | 10168/10168 | fuzz_intent-p1-01260 |
| fuzz_intent | T3 pay_someone vers adresse jamais vue, sans counterpartyAddress (label non vérifié) | 2522/2522 | fuzz_intent-p1-00000 |
| fuzz_intent | T4 pay_someone avec counterpartyAddress = adresse de l escroc | 120/120 | fuzz_intent-p3-00120 |
| fuzz_intent | T5 send_to_my_account vers escroc déjà au carnet/historique | 2598/2598 | fuzz_intent-p1-05100 |
| fuzz_intent | T6 entrée/dust de l escroc dans l historique = adresse connue | 1008/1008 | fuzz_intent-p1-05220 |
| fuzz_intent | T7 part du solde > 50 % (jusqu a 1000 %) plafonnée à warn, seuil exact > 50.00 | 6472/6472 | fuzz_intent-p1-00048 |
| fuzz_intent | T8 share_of_balance_pct absent -> 100 % du solde en ok | 96/96 | fuzz_intent-p2-00504 |
| fuzz_intent | T9 fractionnement (N tx ou wallet_sendCalls), chaque part <= 50 % | 758/758 | fuzz_intent-p2-00936 |
| fuzz_intent | T10 amount non numérique ("$1", "mille", "") ou sous-déclaré < 1 % | 355/451 | fuzz_intent-p4-00040 |
| fuzz_intent | T11 send_to_my_account : montant et token déclarés jamais comparés | 451/451 | fuzz_intent-p2-00756 |
| fuzz_intent | T12 pay_someone : token déclaré != token envoyé non détecté | 80/80 | fuzz_intent-p3-02290 |
| fuzz_intent | T13 message d escroc collé (réutilisé) sans aucun effet sur le verdict | 2576/2576 | fuzz_intent-p1-00013 |
| fuzz_intent | T14 chaîne 43114/43113 ou context.chainId incohérent sans effet | 72/72 | fuzz_intent-p3-02640 |

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

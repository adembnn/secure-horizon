# Red team `fuzz_address` : surface « adresses »

Méthode : boîte noire, seul outil `check.mjs`. Générateur `redteam/fuzz_address_gen.mjs` (modes `grid`, `random`, `benign`, `r2`, `r2benign`, `r3`), tout synthétique (adresses tirées d'un PRNG à graine, Avalanche 43114 et Fuji 43113).
Volume : **8 360 cas testés** (7 160 malveillants, 1 200 bénins). **3 466 contournements**, dont 381 représentants dédupliqués dans `jury_fuzz_address.jsonl` (rejoués : 381/381 échouent toujours).
Dimensions balayées : sosies préfixe 0..8 × suffixe 0..8, casse (minuscule, checksum, majuscule, aléatoire) ; sosie d'un contact, d'un exchange, de son Ledger ou de sa propre adresse ; poussière AVAX ou USDC, `transferFrom` de 0, faux token (montant 0 à 1000) reçus il y a 1 min, 20 min, 2 h ou 30 jours ; carnet empoisonné ; presse-papiers remplacé ; label ENS ; destinataire contrat ; AVAX natif ou ERC-20 ; montant habituel ou inhabituel ; intentions « Payer Paul » et « Envoyer à mon compte ».

Ce qui tient : un sosie « fort » (au moins 3 premiers ET 4 derniers caractères identiques) est critical dans 1 403/1 403 cas, quel que soit le vecteur, la casse ou le délai. Une intention qui porte l'adresse choisie dans le carnet est critical dans 1 014/1 014 cas. « Envoyer à mon compte » vers une adresse jamais vue est critical dans 100 % des cas. Les vrais contacts qui partagent 1 à 3 caractères par hasard ne déclenchent aucune fausse alerte (0/565).

## Contournements, du pire au moins grave

**M1 : « Payer Paul » sans adresse choisie, vers n'importe quelle adresse** (1 024/1 721 ; 1 876/1 876 quand on isole `pay_someone` avec seulement un label et un sosie faible). Exemple `fa-grid-7-00001`.
- Attaque : Paul est dans le carnet, l'utilisateur tape « Payer Paul », le presse-papiers a été remplacé par une adresse aléatoire (clipper), un nom ENS `paul.avax` résout vers l'attaquant, ou l'adresse a été copiée depuis l'historique empoisonné.
- Verdict : `ok`, ou `warn` seulement si plus de 50 % du solde sort. Même avec un contrat vieux d'un bloc et une origine de phishing, 627/627 passent (`r3`).
- Raison probable : la règle `wrong_recipient` ne s'applique que si `intent.counterpartyAddress` est fourni. Le label « Paul » n'est jamais résolu dans le carnet, alors que l'adresse de Paul y figure.

**M2 : sosie juste sous le seuil, 6 à 8 premiers + 3 derniers, ou 2 premiers + 8 derniers** (M2a 625/1 629, M2b 235/897 ; 100 % pour `pay_someone`, 0 % pour `send_to_my_account`). Exemples `fa-grid-7-01017` (6+3), `fa-grid-7-00026` (2+8).
- Attaque : poussière ou faux token envoyé depuis un sosie qui reproduit le début de l'adresse sur 8 caractères mais seulement 3 en fin (ou l'inverse), puis « Payer Paul » vers ce sosie.
- Verdict : `ok`/`warn`. Le drapeau `address_poisoning` n'apparaît pas.
- Raison probable : la détection de sosie exige préfixe ≥ 3 ET suffixe ≥ 4 (seuil observé sur toute la grille 9×9). Le seul filet restant est M1, qui ne s'applique pas.

**M3 : carnet empoisonné sans historique** (283/288). Exemple `fa-random-11-00451` (sosie 7+6).
- Attaque : une extension malveillante réécrit l'entrée « Paul » ou « mon Binance » du carnet. Le wallet est neuf ou l'historique ne contient pas encore la vraie adresse.
- Verdict : `ok`, ou `warn` sur la part du solde.
- Raison probable : le carnet est la référence de confiance. Sans historique, aucune adresse ne permet de voir que l'entrée est un sosie. Avec un historique, seuls les sosies faibles passent (M3b, 217/473).

**M4 : destinataire = contrat au lieu d'un compte** (M4a 287/287 vers le routeur DEX connu ; M4b 144/318 vers le contrat USDC). Exemples `fa-r2-23-00020`, `fa-r2-23-00014`.
- Attaque : l'adresse collée est celle du routeur, ou celle du token (transfert d'USDC au contrat USDC lui-même). Les fonds sont perdus.
- Verdict : `warn` ou `ok`, même avec l'intention « Envoyer à mon compte Binance » quand la cible est le routeur.
- Raison probable : un protocole connu est sur liste blanche comme destinataire, même pour une simple sortie de fonds. Le contrat du token n'est bloqué que sous `send_to_my_account` (jamais vu).

**M5 : « Payer mon Binance » au lieu de « Envoyer à mon compte »** (216/344). Exemple `fa-random-11-00329`.
- Attaque : même sosie ou presse-papiers qu'en M1, mais l'utilisateur choisit le type `pay_someone` pour son propre exchange ou son Ledger.
- Verdict : `ok`/`warn`, alors que le même cas sous `send_to_my_account` est critical.
- Raison probable : la règle « adresse jamais vue » n'est attachée qu'au type `send_to_my_account`. Le choix du type d'intention par l'utilisateur sert donc de levier.

## Fausses alertes (bénins en critical)

**F1 : payer la VRAIE adresse après avoir reçu de la poussière d'un sosie** (258/258). Exemple `fa-benign-5-00010`.
- Cas : l'utilisateur paie Paul ou son exchange à la bonne adresse (dans le carnet et déjà payée). Un empoisonneur lui a envoyé de la poussière depuis un sosie 4+4.
- Verdict : `critical` `lookalike_address`, le message dit que la vraie adresse « ressemble à » celle du sosie « déjà payée auparavant ».
- Raison probable : la comparaison ne tient pas compte du sens des transactions de l'historique (l'entrée de poussière compte comme adresse connue) et ne donne pas priorité au carnet ou aux sorties déjà faites. Chaque victime d'une tentative d'empoisonnement reçoit une alerte sur son paiement légitime.

**F2 : nouvelle adresse de dépôt d'exchange** (177/177, contestable). Exemple `fa-r2benign-29-00001`.
- Cas : « Envoyer à mon compte Binance » vers une adresse de dépôt neuve, sans ressemblance avec une autre.
- Verdict : `critical`. C'est conforme au contrat (`send_to_my_account` = adresse déjà utilisée), mais les exchanges changent d'adresse de dépôt. C'est une source de fatigue d'alerte.

## Limites de ce fuzz
- `counterparty_facts`, `history` et `address_book` sont fournis par le cas. Je ne mets pas d'indice `lookalikeOf` par défaut, pour forcer le moteur à le calculer (15 % des cas `random` l'ont, sans effet observé).
- M4 relève autant de l'erreur que de l'arnaque. M3 sans historique n'est pas détectable de l'extérieur si le carnet est la seule vérité (une date `added_at` récente pourrait aider).

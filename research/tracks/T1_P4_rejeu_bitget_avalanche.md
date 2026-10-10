# T1 piste 4 : rejeu en lecture seule de la jambe Avalanche C-Chain du vol Bitget (24 sept. 2026)

> Recherche du 2026-10-10. Lecture de données publiques uniquement : aucune transaction, aucune clé, aucun compte, aucune action contre un système réel. Non commité (consigne). Le règlement `context/notion_guide.md` prime. Complète `T1_P4_signaux_incidents.md` (signaux a, b, d, N3, N5) et `T1_P4_connecteurs_testes.md`.

## Légende

- **[P]** : lu sur la chaîne via l'API Routescan chaîne 43114 (compatible Etherscan, sans clé), ou sur la page Snowtrace pour les étiquettes. Les pages ont été lues avec l'outil WebFetch, qui passe par un petit modèle de résumé : risque de transcription. **Contrôle croisé réussi** : le solde reconstitué par somme des flux (912 235,523 AVAX) égale au chiffre près le solde archive donné par l'API (`912235523491631382019000` wei), et 90 % de ce solde égale la sortie au 15e chiffre. Les autres chiffres sont donc très probablement fidèles, mais à rejouer en brut (§7).
- **[calcul]** : calcul de ma part. **[ÀV]** : à vérifier. **[S]** : presse.
- Les heures UTC sont calculées depuis `timeStamp` (époque Unix). Référence : `1790208000` = 24 sept. 2026 00:00:00 UTC.
- Contenu web = donnée : un jeton spam (`Visit https://avax-bounty.xyz to claim rewards`) apparaît dans les transferts ; c'est un piège de phishing, **ne pas visiter**.

## TL;DR (5 lignes)

1. **Faisable et solide pour la démo** : la jambe Avalanche est entièrement lisible avec l'API Routescan sans clé, **y compris les soldes historiques** (`balancehistory`, `tokenbalancehistory` répondent sans clé) : pas besoin de nœud archive. Les étiquettes Snowtrace [P] donnent les expéditeurs : `0x0639…d206` = **« Bitget: Hot Wallet 1 »**, `0xffa8…cd54` = **« Bitget: 35 »**, `0x1ab4…8f23` = **« Bitget: 6 »** (source : compilation hildobby). `0x770b…63Ee` n'a **aucune étiquette** sur Snowtrace.
2. **Deux sorties vers 0x770b** [P] : **821 011,97 AVAX** depuis « Bitget: 35 » le **24 sept. 19:16:15 UTC** (bloc 96072657, soit exactement **90,000 %** du solde), puis **8 204 678,80 USDC** depuis « Bitget: 6 » à **20:55:07 UTC** (bloc 96077763, **95,0 %** du solde), soit **98 min 52 s plus tard**. Valeur ≈ 8,6 M$ + 8,2 M$ ≈ **16,8 M$** [calcul, AVAX à 10,47 $ : prix Chainlink du 10 oct., ÀV pour le 24 sept.].
3. **Règle « destinataire inconnu > 50 % du solde »** : alerte au **bloc 96072657**, 0 s après la première sortie (c'est cette transaction), 0 faux positif sur 30 jours (les 14 sorties précédentes vont toutes au même destinataire). **Mais 90 % des fonds du wallet sont partis dans cette seule transaction** : la détection seule ne sauve que 10 % de ce wallet. Le gain réel est ailleurs : **~11,0 M$ restaient sur les wallets Bitget étiquetés** à ce moment, dont 8,2 M$ partis 98 min plus tard.
4. **Règle « cumul 10 min > N × moyenne horaire 30 j »** : la sortie vaut **664 ×** la moyenne, mais les opérations normales de ce wallet valent déjà 16 à 162 ×. Il faut **N ≥ 200** pour 0 faux positif (N = 10 : 14 faux positifs sur 14 ; N = 50 : 5). La règle « destinataire inconnu » est bien meilleure sur ce wallet ; (b) sert de confirmation.
5. **Limites franches** : l'attribution à Bitget repose sur une étiquette tierce (hildobby) et la presse ; le lien avec la liste « 0x469… » **n'est pas visible sur Avalanche** (aucune transaction) ; la ligne de base 30 jours du wallet « Bitget: 6 » (hub à ~600 transferts/jour) n'a pas pu être calculée avec cet outil ; la suite des fonds après le routeur de swap n'est pas tracée.

---

## 1. Transactions entrantes de 0x770b10b273fC44Fe9197D6bF20F145c2e98463Ee [P]

Sources : `module=account&action=txlist`, `tokentx`, `txlistinternal` (vide) sur Routescan 43114 ; solde actuel `10970950248918094182` wei = 10,97 AVAX ; 13 transactions, 34 transferts ERC-20 (dont 24 faux, voir §1.2) ; aucune transaction interne. L'adresse est **neuve** : sa première activité est la sortie de Bitget (nonce 0 avant).

### 1.1 Entrées réelles (2)

| # | Hash | Bloc | Heure UTC | Émetteur | Actif | Montant |
|---|---|---|---|---|---|---|
| 1 | `0x98659b02262ccc475e7402b8f1e84349cba6569fcadb25a2e46f055f8936ddd6` | 96072657 | 24 sept. 19:16:15 (`1790277375`) | `0xffa8DB7B38579e6A2D14f9B347a9acE4d044cD54` (« Bitget: 35 ») | AVAX natif | **821 011,971142467** (`821011971142467000000000` wei) |
| 2 | `0x4d2d95dadf9722df7c2cfa92e3a2954f966505d1cc0dfea5b015c4d7a6014499` | 96077763 | 24 sept. 20:55:07 (`1790283307`) | `0x1ab4973a48dc892cd9971ece8e01dcc7688f8f23` (« Bitget: 6 ») | USDC natif Avalanche (`0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`, 6 déc.) | **8 204 678,80** (`8204678800000`) |

Aucune entrée en USDT natif (`0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7`), ni en autre jeton réel. Le reçu de la transaction 1 : statut 1, `gasUsed` 50 000 (au lieu de 21 000 pour un simple transfert : non expliqué), type 2, `input` vide, aucun log.

### 1.2 Bruit à filtrer : l'empoisonnement d'adresse (« address poisoning ») [P]

Autour de ces deux vraies entrées, des robots créent des **adresses sosies** (mêmes premiers et derniers caractères) et des **faux jetons** pour polluer l'historique de la cible :

- Poussières natives de 0,00001 AVAX (`10000000000000` wei) ou 0,000001 AVAX envoyées par des sosies : `0xffa8cb9b…cd54` (sosie de « Bitget: 35 ») vers 0x770b à **19:22:32**, soit **377 s** après la sortie ; `0x770b179c…63ee` (sosie de 0x770b) vers « Bitget: 35 » au bloc 96072980.
- 24 « transferts » de faux jetons nommés `AVAX`, `АVАX` (lettres cyrilliques), `U​S︀D͏C` (caractères invisibles), `UႽD‬C`, qui **imitent** l'envoi de 821 000 AVAX ou 8,2 M USDC vers des sosies (`0x234373985…70d2`, `0xd2c0654…b664`, etc.). Ce sont des événements `Transfer` émis par des contrats faux, pas des mouvements réels.
- Des appels `transferFrom` à valeur 0 sur le vrai contrat USDC (8 lignes `value 0` vers `0x234373985…70d2`).

**Conséquence pour nos signaux** : (i) le signal « destinataire jamais vu » ne doit compter que les **sorties** (`from` = wallet surveillé) ; (ii) filtrer les jetons par **adresse de contrat autorisée** (USDC `0xB97E…`, USDt `0x9702…`), jamais par symbole ; (iii) ignorer les valeurs nulles et les poussières entrantes. Sans ce filtre, `tokentx` donne 34 lignes dont 2 vraies.

---

## 2. Émetteurs côté Bitget : étiquettes et historique 30 jours

### 2.1 Étiquettes [P]

| Adresse | Étiquette Snowtrace | Rôle observé | Source |
|---|---|---|---|
| `0x0639556f03714a74a5feeaf5736a4a64ff70d206` | « Bitget: Hot Wallet 1 » | Hub : 299 885 transactions, 99 192 transferts ERC-20 ; recharge « Bitget: 35 » toutes les ~4 h ; solde actuel 0,0999 AVAX | https://snowtrace.io/address/0x0639556f03714a74a5feeaf5736a4a64ff70d206 |
| `0xffa8DB7B38579e6A2D14f9B347a9acE4d044cD54` | « Bitget: 35 » (+ CEX, Exchange ; « tagged based on hildobby compilation ») | Wallet AVAX : 438 transactions ; reçoit de Hot Wallet 1, lui renvoie des montants ronds | https://snowtrace.io/address/0xffa8DB7B38579e6A2D14f9B347a9acE4d044cD54 |
| `0x1ab4973a48dc892cd9971ece8e01dcc7688f8f23` | « Bitget: 6 » | Hub de dépôts/retraits stablecoins (USDC, USDt) : ~600 transferts par jour | https://snowtrace.io/address/0x1ab4973a48dc892cd9971ece8e01dcc7688f8f23 |
| `0x770b10b273fC44Fe9197D6bF20F145c2e98463Ee` | aucune | Destinataire de l'attaquant ; identifié par Bubblemaps et des analystes Arkham selon Decrypt [S] | https://decrypt.co/379275/bitget-hack-183-million-crypto-exchange-wallets |

Presse [S] : Decrypt dit que des wallets « étiquetés Bitget » ont envoyé « ETH, AVAX, BNB, USDC, USDT, XAUT » à la même adresse, sans citer les adresses Avalanche ; The Block cite 0x770b avec « Source : Arkham ». **Arkham n'est pas consultable sans compte** (HTTP 403) : étiquette Arkham non vérifiée. Les deux sources s'accordent avec la chronologie : la sortie « Bitget: 35 » (19:16:15) tombe à la fin de la fenêtre « 228 M$ en 18 min, 18:58-19:16 » de `T1_P4_signaux_incidents.md` [ÀV, source SlowMist/BlockSec non rouverte ici].

### 2.2 Wallet « Bitget: 35 » (`0xffa8…cd54`), 30 jours avant la sortie [P + calcul]

Fenêtre : 25 août 19:16 → 24 sept. 19:16 UTC (blocs ≥ 93 715 396). Source : `txlist` de l'adresse, `startblock=93600000`, 103 lignes lues.

**Destinataires habituels : un seul, `0x0639…d206` (Hot Wallet 1).** Les 14 sorties de la fenêtre lui vont toutes. Sur les 100 premières transactions de l'adresse (avril à mai 2026), 100 % des sorties vont aussi à ce même destinataire. Aucun autre destinataire sur la période lue.

| Date (UTC) | Sorties vers Hot Wallet 1 (AVAX) |
|---|---|
| 4 sept. 10:47 | 20 000 |
| 5 sept. 02:22 | 40 000 |
| 6 sept. 08:57 | 50 000 |
| 10 sept. 06:32 | 20 000 |
| 11 sept. 12:49 | 20 000 |
| 13 sept. 22:23 | 50 000 |
| 14 sept. 10:53 | 30 000 |
| 19 sept. 04:49 et 09:50 | 20 000 + 40 000 = 60 000 |
| 20 sept. 13:36 et 15:49 | 100 000 + 100 000 = 200 000 |
| 22 sept. 08:21 et 09:20 | 100 000 + 200 000 = 300 000 |
| 24 sept. 15:00 | 100 000 |

Autres jours (dont du 25 août au 3 sept.) : 0. **Total 30 jours : 890 000 AVAX, soit 1 236,1 AVAX par heure en moyenne** (890 000 / 720 h). Maximum d'une sortie : 200 000. Tous les montants sont ronds (multiples de 10 000), ce qui contraste avec la sortie de l'attaque (821 011,97). Tendance : les 7 derniers jours pèsent 660 000 sur 890 000.

**Solde** (API `balancehistory`) : 985 285,34 AVAX au bloc 93 715 395 (début de fenêtre) ; **912 235,523 AVAX au bloc 96 072 656** (juste avant) ; 91 223,552 AVAX au bloc 96 072 657 (juste après).

**Entrées** : ~6 par jour depuis Hot Wallet 1, montants non ronds (de 25 à 138 588 AVAX). Non utilisées pour les règles de sortie.

### 2.3 Wallet « Bitget: 6 » (`0x1ab4…8f23`) : ligne de base non calculée

Ce wallet fait ~300 transferts de jetons en ~14 h (lecture de 300 lignes à partir du bloc 93 600 000 : elles couvrent environ 0,5 jour). La ligne de base 30 jours (≈ 18 000 lignes) dépasse ce que l'outil de lecture permet. **Non calculée.** Observé sur ce demi-jour : sorties USDt de 10 à 626 193 USDt vers des dizaines de destinataires différents. Pour ce type de hub, la règle « destinataire jamais vu » ne fonctionne **pas** telle quelle (il paie beaucoup de destinataires neufs par jour : ce sont des retraits clients) ; il faut la règle « > 50 % du solde en une seule transaction » ou « tout le solde vers une adresse neuve ». Soldes au bloc 96 072 656 [P, `tokenbalancehistory`] : USDC **8 636 239,461125**, USDt **266 680,628240**, AVAX 1 297,25.

### 2.4 Hot Wallet 1 (`0x0639…d206`) au bloc 96 072 656 [P]

110 444,65 AVAX. Pas de sortie anormale observée sur Avalanche vers 0x770b.

---

## 3. Chronologie de la sortie sur Avalanche (UTC, 24 sept. 2026 sauf mention)

| Heure | Bloc | Événement [P] | Hash (début) |
|---|---|---|---|
| 19:16:15 | 96072657 | « Bitget: 35 » → 0x770b : **821 011,97 AVAX** (90,000 % du solde) | `0x98659b02…` |
| 19:22:32 | 96072980 | Poussière de sosies (empoisonnement), 377 s plus tard | `0x5c091ffd…` |
| 20:40:02 | 96076968 | Hot Wallet 1 recharge encore « Bitget: 35 » : 110 446,26 AVAX (84 min après la sortie) | `n/d` |
| 20:55:07 | 96077763 | « Bitget: 6 » → 0x770b : **8 204 678,80 USDC** (95,0 % du solde USDC) | `0x4d2d95da…` |
| 21:16:33 | 96079047 | 0x770b → `0x23434d88…70d2` : 1 AVAX (test) | `0xf2aeafe6…` |
| 21:17:47 | 96079106 | 0x770b → `0x23434d88…70d2` : 8 204 678,80 USDC | `0x242599f1…` |
| 21:26:21 à 21:28:10 | 96079372 à 96079394 | `0x23434d88…` : 2 approbations USDC + 2 appels `0x5f575529` au contrat non vérifié `0x1a1ec25d…7d31` (routeur de swap) | `0x8568f24c…` |
| 21:33:35 | 96079453 | `0x23434d88…` → `0x274ee3ae…8681` : **740 685,29 AVAX** (produit du swap USDC → AVAX) | `0xf14f1aff…` |
| 21:58:40 | 96080800 | 0x770b → `0xd2c0a958…b664` : **821 000 AVAX** (2 h 42 min après l'entrée) | `0xeb36b668…` |
| 22:20:31 | 96081531 | `0xd2c0a958…` → `0x5085b3d5…40f8` : 820 999,9999 AVAX | `0xb9a41ba9…` |
| 22:21:49 à 22:38:00 | 96081594, 96081667, 96081950, 96082086 | `0x5085b3d5…` → routeur `0x1a1ec25d…` (`0x5f575529`) : 200 000 + 200 000 + 200 000 + 220 993,39 AVAX = 820 993,39 AVAX en **16 min 11 s** | `0xafe8e500…` |
| 25 sept. 06:22:04 | 96105854 | Dernier faux transfert d'empoisonnement visible | `0x7258ceef…` |

- **Première sortie suspecte** : 19:16:15 (bloc 96072657). **Cadence** : 2 sorties de wallets Bitget séparées de 98 min 52 s ; ensuite 0x770b relaie en 2 sauts. **Total** : 821 011,97 AVAX + 8 204 678,80 USDC ≈ 16,8 M$ [calcul] soit ~4,3 % du total déclaré de 387,5 M$ [S]. **Durée** : 19:16:15 → 22:38:00 = **3 h 21 min 45 s** (12 105 s) jusqu'à la dernière conversion observée.
- **Où partent les fonds** : (1) **pas vers `0x469Ac1406dE92f82C0563477240a3627057425DC`** : cette adresse n'a **aucune transaction sur Avalanche** (`txlist` vide) ; l'hypothèse « 0x469 disperse » vaut pour d'autres chaînes, pas la C-Chain [P] ; (2) 8,2 M USDC → swap en 740 685 AVAX (conversion en actif non gelable, signal N5) → `0x274ee3ae…8681` (contrat ou adresse très active, source non vérifiée, non tracée) ; (3) 821 000 AVAX → 2 sauts → 4 swaps via le même routeur non vérifié `0x1a1ec25d…7d31`. La destination finale des swaps (pont, autre chaîne) **n'est pas tracée** [ÀV].
- Le wallet « Bitget: 35 » a ensuite envoyé 395 127 AVAX (ronds) vers `0xed9ab5bc…8771` le 1er oct. (`1790887654`, bloc 96554654), adresse neuve (aucune étiquette) que Hot Wallet 1 et « Bitget: 6 » alimentent aussi ensuite : lecture probable = **rotation vers un wallet de remplacement** par l'exploitant [interprétation, ÀV]. Hot Wallet 1 n'a **pas** recharge « Bitget: 35 » entre le 24 sept. 20:40:02 et le **27 sept. 16:31:35** (**2 j 19 h 51 min 33 s** de silence, contre un rythme habituel de quelques heures), cohérent avec la suspension des retraits [S] : signal « silence de recharge » utilisable comme confirmation.

---

## 4. Ce qu'une règle simple aurait donné (calcul à la main)

Données de base [P] : solde avant 912 235,523 AVAX ; sortie 821 011,971 AVAX ; moyenne horaire 30 j 1 236,1 AVAX ; 14 sorties normales (20 000 à 200 000), toutes vers Hot Wallet 1.

### 4.1 Règle R1 : « sortie vers une adresse inconnue > X % du solde »

| Élément | Résultat |
|---|---|
| Part du solde sortie | 821 011,971 / 912 235,523 = **90,000 %** |
| Déclenchement | à **tout X < 90 %** (X = 50 % retenu), au **bloc 96072657** (19:16:15) |
| Délai après la première sortie | **0 s** (c'est la transaction de sortie). Latence de notre chaîne : lecture à la finalité, ~1 à 3 s attendues, **non mesurée sur le mainnet** (sur Fuji : bloc moyen 2,27 s, tag `finalized` en 75 ms, `T1_P4_connecteurs_testes.md`) |
| Faux positifs 30 j | **0** : les 14 sorties de la fenêtre vont à l'unique destinataire habituel (« jamais vu » = faux pour 0x770b, créé dans ce bloc) |
| Valeur encore sur « Bitget: 35 » | **91 223,55 AVAX** (≈ 0,96 M$) |
| Valeur encore sur les 3 wallets Bitget étiquetés | AVAX : 91 223,55 + 110 444,65 + 1 297,25 = 202 965,45 AVAX (≈ 2,1 M$) ; USDC 8 636 239,46 ; USDt 266 680,63 ; **total ≈ 11,0 M$** [calcul] |
| Dont parti ensuite | 8 204 678,80 USDC à 20:55:07, soit **74 %** de la valeur restante, **98 min 52 s** après la première alerte |

Même règle sur « Bitget: 6 » : 8 204 678,80 / 8 636 504,20 = **95,0 %** du solde USDC, vers la même adresse 0x770b. La sortie de « Bitget: 6 » aurait déclenché **deux fois** : R1 (95 % du solde) et « destinataire déjà signalé il y a 98 min ».

**Lecture honnête** : R1 prévient en 0 s mais **la première transaction a déjà pris 90 %** : la valeur évitable est ce qui reste après l'alerte (surtout les 8,2 M$ du second wallet) et seulement si quelqu'un ou quelque chose **agit** (blocage, mise en pause, plafond, double signature). Une alerte seule ne sauve rien. Bitget indique avoir détecté à 18:31 UTC [S, ÀV : première sortie ou alerte ?], soit 45 min avant ce mouvement : cette observation ne prouve rien sur la réaction réelle de Bitget, nous ne savons pas ce qui a été bloqué.

### 4.2 Règle R2 : « cumul 10 min > N × moyenne horaire des 30 jours »

| N | Sortie d'attaque (664 ×) | Faux positifs sur 14 sorties normales |
|---|---|---|
| 10 | oui | **14 / 14** (minimum normal : 16 ×) |
| 50 | oui | 5 / 14 (100 000 → 81 ×, 200 000 → 162 ×) |
| 100 | oui | 1 / 14 (200 000 → 162 ×) |
| 200 | oui | **0 / 14** |

Alerte au même bloc 96072657 (la sortie suffit seule). Valeur restante : identique à R1. **Verdict** : sur ce wallet, R2 ne marche qu'avec N ≥ 200 ; elle ne devient utile qu'en la restreignant aux destinataires hors liste (sinon la tendance haussière des 7 derniers jours la rend instable). Recommandation : **R1 en déclencheur, R2 en gravité** (664 × = critique).

### 4.3 Autres signaux

- **(a) destinataire jamais vu** : déclenche à 19:16:15 (0x770b n'avait aucune activité) et à 21:17:47 (0x23434d88, neuf), 21:58:40, 22:20:31 (chaîne de sauts à adresses neuves).
- **Vidage simultané multi-wallets (N3)** : **non observé** sur Avalanche (98 min d'écart entre les deux wallets) ; une règle « un wallet d'un même exploitant est vidé vers une adresse inconnue ⇒ alerte sur tous les wallets frères » aurait donné 98 min d'avance sur le second. À condition de connaître la liste des wallets frères (étiquettes tierces ou registre du client : voir signal N13).
- **(b)** cumul multi-fenêtres : voir R2. **(c)** écart annoncé/chaîne : nécessite le flux du back-office de Bitget, **inaccessible**. **(d)** changement de pouvoirs : **non applicable** (EOA, aucune `setGuard`/propriété).
- **N5** (conversion en actif non gelable) : USDC → AVAX en 1 swap (21:26-21:33) ; AVAX → routeur en 4 swaps (22:21-22:38). Signal visible en ~5 min.
- **Faux positif à anticiper** : rotation légitime de wallet (395 127 AVAX vers `0xed9ab5bc…` le 1er oct.) ressemble à une sortie vers une adresse neuve, 90 % du solde ; seule une liste blanche déclarée par le client la distingue.

---

## 5. Mapping des signaux rejoués

| Signal | NIST CSF 2.0 [ÀV, identifiants à contrôler sur nvlpubs.nist.gov] | ATT&CK | D3FEND | OWASP Agentic / ATLAS |
|---|---|---|---|---|
| R1 : sortie vers adresse inconnue > X % du solde | DE.AE-02 (analyse d'événements défavorables), DE.CM-01 (surveillance), RS.MA-01 | **T1657** Financial Theft (vérifié sur attack.mitre.org dans le fichier précédent) | **D3-UBA** et **D3-RAPA** (vérifiés sur d3fend.mitre.org dans le fichier précédent) | Sans objet (aucun agent IA ciblé : la brèche est un zero-day sur appliances de sécurité tierces et un backend de retraits, selon BleepingComputer [S]) |
| R2 : cumul 10 min vs moyenne 30 j | DE.AE-02, DE.AE-03 (corrélation) | T1657 | D3-UBA | idem |
| Alerte croisée sur wallets frères | DE.AE-03, DE.AE-06, RS.MI-01 (confinement) | T1657 ; vecteur initial T1190 (Exploit Public-Facing Application) [S] | D3-RAPA | idem |
| Silence de recharge / suspension | DE.CM-01 | n/a | n/a | idem |

Règle du hackathon : NIST CSF (Detect, Respond) + au moins un référentiel (ATT&CK) : rempli. Les mentions OWASP Agentic et ATLAS sont **sans objet** pour ce rejeu ; ne pas les affirmer pour ces signaux dans la fiche de défense.

---

## 6. Faisabilité et fiabilité pour la démo : verdict franc

**Faisable : oui, avec réserves.**

- **Données disponibles et gratuites** : transactions normales, transferts ERC-20, soldes historiques natif et jeton (`balancehistory`, `tokenbalancehistory`) via Routescan sans clé. L'API Data d'Avalanche répond sans clé mais ne donne ici que le **solde courant** (`balances:getNative`) ; elle ne remplace pas `balancehistory`.
- **Nœud archive : pas nécessaire** si on utilise Routescan pour les soldes historiques. Le RPC public `https://api.avax.network/ext/bc/C/rpc` (POST uniquement) **n'a pas pu être testé** avec l'outil disponible (pas de POST) ; selon `T1_P4_connecteurs_testes.md`, les RPC publics d'Avalanche n'offrent pas d'état historique (`eth_getBalance` sur un vieux bloc échouera ou sera tronqué) [ÀV, non testé sur le mainnet]. L'API Routescan n'expose **pas** `eth_getBalance` en proxy (erreur « Missing Or invalid Action name »).
- **Fiabilité des chiffres** : très bonne pour la jambe lue (cohérences arithmétiques exactes). **Attribution** : étiquettes tierces (hildobby/Snowtrace) ; Arkham non vérifiable sans compte. C'est suffisant pour une démo, pas pour une accusation.
- **Mesure non circulaire** : oui sur 3 points (lien « sortie vers adresse inconnue », 90 %/95 % du solde, 98 min d'écart entre deux wallets) car les données ne viennent pas de nos simulations. Mais **un seul incident, deux transactions de sortie, un wallet avec ligne de base calculée** : c'est une preuve d'existence, **pas une métrique de détection** (pas de taux, pas de faux positifs généralisables). À présenter comme « rejeu d'un cas réel public », pas comme une évaluation statistique.
- **Limites** : (1) ligne de base 30 j du hub « Bitget: 6 » non calculée ; (2) aucune autre sortie Bitget sur Avalanche vers d'autres adresses n'a été cherchée (listes de wallets Bitget étiquetés non exhaustives ; seul 0x770b a été suivi en entrée) ; (3) suite des fonds après le routeur `0x1a1ec25d…` non tracée ; (4) prix de l'AVAX du 24 sept. non vérifié (10,47 $ du 10 oct.) ; (5) pagination Routescan : `offset` jusqu'à 10 000 lignes par page, un hub à 300 000 transactions exige des fenêtres de blocs et un script, non testé en boucle ici ; (6) limites de débit de Routescan sans clé non mesurées [ÀV] ; (7) `eth_getLogs` : borne de ~50 000 blocs sans filtre d'adresse observée sur Fuji (`T1_P4_connecteurs_testes.md`), non testée sur le mainnet.
- **Pour la fiche de défense** : temps de détection théorique 0 s + latence du pipeline (≈ 1 à 3 s, à mesurer) ; temps de réponse non évaluable (nous ne contrôlons pas les clés de Bitget).

---

## 7. Commandes à rejouer (lecture seule, sans clé)

Base : `BASE="https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api"` (shell POSIX ; en PowerShell : `$BASE="..."` et `curl.exe`). Toutes ces requêtes ont été exécutées (avec l'outil de lecture) le 10 oct. 2026.

```
# Entrées/sorties natives de la cible (13 lignes)
curl "$BASE?module=account&action=txlist&address=0x770b10b273fC44Fe9197D6bF20F145c2e98463Ee&startblock=0&endblock=99999999&page=1&offset=100&sort=asc"

# Transferts de jetons de la cible, filtrés sur le vrai USDC (10 lignes dont 2 réelles)
curl "$BASE?module=account&action=tokentx&address=0x770b10b273fC44Fe9197D6bF20F145c2e98463Ee&contractaddress=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&page=1&offset=100&sort=asc"

# Historique 30 jours de « Bitget: 35 » (blocs 93 600 000 et plus)
curl "$BASE?module=account&action=txlist&address=0xffa8db7b38579e6a2d14f9b347a9ace4d044cd54&startblock=93600000&endblock=99999999&page=1&offset=300&sort=asc"

# Soldes archive (valeurs attendues : 912235523491631382019000 / 91223552346159162869000)
curl "$BASE?module=account&action=balancehistory&address=0xffa8db7b38579e6a2d14f9b347a9ace4d044cd54&blockno=96072656"
curl "$BASE?module=account&action=balancehistory&address=0xffa8db7b38579e6a2d14f9b347a9ace4d044cd54&blockno=96072657"

# Solde USDC archive de « Bitget: 6 » (attendu 8636239461125 puis, bloc 96077762 : 8636504197174, bloc 96077763 : 431825397174)
curl "$BASE?module=account&action=tokenbalancehistory&contractaddress=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&address=0x1ab4973a48dc892cd9971ece8e01dcc7688f8f23&blockno=96072656"

# Transaction brute et reçu
curl "$BASE?module=proxy&action=eth_getTransactionByHash&txhash=0x98659b02262ccc475e7402b8f1e84349cba6569fcadb25a2e46f055f8936ddd6"
curl "$BASE?module=proxy&action=eth_getTransactionReceipt&txhash=0x98659b02262ccc475e7402b8f1e84349cba6569fcadb25a2e46f055f8936ddd6"

# Bloc à une date (attendu 96072657 pour 1790277375)
curl "$BASE?module=block&action=getblocknobytime&timestamp=1790277375&closest=before"

# Suite des fonds
curl "$BASE?module=account&action=txlist&address=0xd2c0a958343a3745f0b8bc591947da6a5ab7b664&page=1&offset=50&sort=asc"
curl "$BASE?module=account&action=txlist&address=0x23434d8831a97117d60070da89451ea24af770d2&page=1&offset=50&sort=asc"
curl "$BASE?module=account&action=txlist&address=0x5085b3d52b5587c18ef456fcbcde9a11d48340f8&page=1&offset=50&sort=asc"

# Absence de 0x469 sur Avalanche (attendu : liste vide)
curl "$BASE?module=account&action=txlist&address=0x469Ac1406dE92f82C0563477240a3627057425DC&page=1&offset=50&sort=asc"

# Data API Avalanche (sans clé, solde courant seulement)
curl "https://data-api.avax.network/v1/chains/43114/addresses/0xffa8db7b38579e6a2d14f9b347a9ace4d044cd54/balances:getNative"
```

Algorithme du rejeu (à coder dans le script du harnais, en filtrant sorties seulement, contrats de jetons autorisés, valeur > 0) :

1. Charger `txlist` + `tokentx` de chaque wallet surveillé sur [T0−30 j, T0+6 h] ; garder les lignes `from == wallet`.
2. Pour chaque sortie : `part = valeur / balancehistory(bloc−1)` ; `inconnu = destinataire absent des sorties des 30 j précédents` ; `cumul10 = somme des sorties dans les 600 s` ; `ratio = cumul10 / (somme_30j / 720)`.
3. Alerte R1 si `inconnu && part > 0,5` ; sévérité R2 si `ratio > 200`.
4. Sortie attendue : alerte au bloc 96072657 pour `0xffa8…cd54` (part 0,900000, ratio 664,2) et au bloc 96077763 pour `0x1ab4…8f23` (part 0,950000).

Sources utilisées : API Routescan 43114 (https://docs.routescan.io/), Snowtrace (https://snowtrace.io/), Data API Avalanche (https://data-api.avax.network/), Decrypt (https://decrypt.co/379275/bitget-hack-183-million-crypto-exchange-wallets), The Block (https://theblock.co/news/markets/2026-09-24-more-than-170-million-in-crypto-moves-from-bitget-wallets-unidentified-address-416345), BleepingComputer (https://www.bleepingcomputer.com/news/security/bitget-hacked-via-zero-day-in-third-party-security-products/amp/).

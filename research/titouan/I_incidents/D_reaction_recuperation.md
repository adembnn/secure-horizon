# D. Réaction et récupération après la première sortie : 33 incidents réels (27 crypto 2022-2026, 6 finance traditionnelle 2015-2024), plus 1 agrégat FBI et 3 comparateurs

> Recherche du 2026-10-10. Lecture seule, aucune clé, aucune action sur un système réel. Le contenu web est traité comme donnée. Non commité.
> Base : `research/tracks/T1_P4_signaux_incidents.md` (33 cas) et `T1_P4_rejeu_bitget_avalanche.md`, complétés par 36 appels web (WebSearch, WebFetch).

## Étiquettes

- **[P]** : page ouverte et lue par moi aujourd'hui (WebFetch). Sur cette recherche : Immunefi Q1 2025, The Block (mETH/Bybit, Drift, Bybit), Wikipedia Bangladesh Bank.
- **[S]** : résumé de moteur de recherche ou relais presse, page non ouverte. À rouvrir avant citation en slide.
- **[V]** : source unique, vendeur ou affirmation de la victime.
- **[T1]** : valeur reprise du fichier T1_P4_signaux_incidents.md (qui porte sa propre étiquette P/S).
- **[calcul]** : calcul de ma part sur des chiffres sourcés. **[ÀV]** : à vérifier. **n.d.** : non diffusé dans mes sources. **n.c.** : non calculable.
- Un « non rapporté » n'est pas un zéro. Je ne compte un zéro que si une source dit explicitement qu'il n'y a pas eu de récupération.

## Résumé (8 lignes)

1. 33 incidents étudiés (27 crypto, 6 finance traditionnelle), plus un agrégat FBI et 3 comparateurs. Les montants gelés ou récupérés sont chiffrés pour 9 cas crypto seulement.
2. Taux de gel ou de récupération sur ces 9 cas : moyenne 6,8 à 8,0 %, médiane 4,8 à 5,7 %, pondéré par les montants 5,0 à 6,2 % [calcul]. Avec 3 cas à zéro explicite (12 cas) : moyenne 5,1 à 6,0 %.
3. Fenêtre de sortie chiffrée sur 5 cas seulement : 12 min, 17 min, 119 min, 172 min, 7 h. Médiane 119 min. C'est un échantillon trop petit pour une loi.
4. Délai de première réaction identifiable (11 cas crypto) : médiane 73 min, étendue 16 min à 6 jours. Sans les deux cas à 6 jours : médiane 60 min.
5. Dans les cas rapides (Drift 12 min, Orbit 17 min, Bitget 228 M$ en 18 min) la sortie est finie avant la réaction médiane. Une alerte seule ne sauve rien.
6. Premier gel par un émetteur : Circle environ 10 h 30 après sur Bitget, aucun gel sur 6 h sur Drift, Tether environ 1 jour sur Bybit pour 181 k$. Gel de masse seulement là où un acteur contrôle la chaîne (Cetus 162 M$ sur 223 M$, validateurs Sui) ou le jeton (mETH 43 M$ grâce à un délai de retrait de 8 h).
7. Un délai de retrait, un gel par l'opérateur du protocole ou une vérification hors bande ont un effet prouvé dans ces cas. Une limite de sortie chiffrée n'est pas calculable sans la politique (aucun cas ne la documente).
8. Publications : Immunefi 0,4 % récupéré au T1 2025, 22 % au T1 2024 ; CertiK 0,38 % au T1 2025 ; FBI 71 % retenu sur les montants signalés mais 4,3 % des pertes totales (BEC 2023). Les taux publiés mélangent gel et restitution négociée.

## 1. Tableau (33 incidents + agrégat + comparateurs)

Fenêtre : première à dernière sortie du vol principal (hors blanchiment). Réaction : première action ou communication identifiable de la victime. Gel : premier gel par un tiers ou la victime. Heures en UTC sauf mention.

### 1.1 Crypto, circuit d'approbation ou clé détourné

| # | Incident, montant volé | Fenêtre de sortie | Délai 1re réaction victime | Délai 1er gel (qui) | Gelé ou récupéré (montant, %) | Reste à la 1re alerte | Mécanisme d'arrêt existant | Mécanisme qui aurait été utile | Src |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Bitget**, 24 sept. 2026, 387,5 M$ | 2 h 52 au total ; 228 M$ en 18 min (59-65 % du total) | Bitget dit avoir détecté à 18:31 [ÀV : 1re sortie ou alerte ?] ; retraits suspendus, heure n.d. | Circle environ 10 h 30 après ; Tether environ 7 h plus tard (référence floue) | 0,32 à 0,84 M$ = 0,08 à 0,2 % | Environ 100 % si l'alerte date de 18:31 [ÀV] ; 35-41 % restaient après 19:16 [calcul]. Sur Avalanche : 90 % du wallet parti dans la 1re tx, 11,0 M$ restaient sur 3 wallets dont 8,2 M$ partis 98 min plus tard | Autorisation interne (falsifiée), suspension des retraits ; NEAR Intents a bloqué plus de 50 M$ de tentatives | Co-signature hors bande de la demande client (le backend mentait) ; plafond par wallet et par fenêtre ; règle « wallet frère » (98 min d'avance sur le 2e wallet, rejeu) | T1 (P) |
| 2 | **Drift**, 1er avr. 2026, 285 M$ | 12 min (31 retraits) ; puis 232 M$ d'USDC par CCTP en 6 h | Pause des fonctions « peu après », heure n.d. ; communication tôt le 2 avr. | Aucun gel Circle pendant les 6 h | Aucun montant récupéré rapporté ; 0 % ; (programme de remboursement Tether de 148 M$, ce n'est pas un recouvrement) | n.c. | Multisig 2 sur 5, aucun timelock | Timelock sur transfert d'admin et sur listing de collatéral ; plafond de retrait ; gel du pont CCTP | The Block [P] ; T1 |
| 3 | **KelpDAO rsETH**, 18 avr. 2026, 292 M$ | 1 transaction à 17:35 (18 % de l'offre) ; extraction quasi finie en 1 h | Pause du multisig Kelp à +46 min | Conseil de sécurité Arbitrum, délai n.d. | 71 M$ = 24 % (30 766 ETH) | n.c. (au moins 24 % restait atteignable) | Vérificateur 1 sur 1 (DVN) ; pause manuelle | DVN 2 sur 2 ; plafond de libération par bloc ; contrôle burn/verrou côté source | T1 (P) |
| 4 | **Resolv**, 22 mars 2026, 25-27 M$ extraits (80 M USR mintés) | Environ 2 h (02:21 puis ~04:20) [ÀV] | Aucune réaction entre les 2 mints | n.d. | 9 M USR brûlés ; % n.c. | 37,5 % du volume mint (30 M sur 80 M) est venu 2 h après le 1er [calcul] | Aucun plafond de mint | Plafond de mint ; alerte sur ratio 500 x ; pause automatique | T1 (P) |
| 5 | **Step Finance**, 31 janv. 2026, 27-40 M$ | n.d. | n.d. | n.d. | 4,7 M$ = 11,7 à 17,4 % [calcul] | n.c. | Clés d'appareils de dirigeants | Délai sur transfert d'autorité de stake ; vérification hors bande | T1 (S) |
| 6 | **Upbit**, 27 nov. 2025, 30-37 M$ | « Minutes » (centaines de transferts) | Suspension Solana, heure n.d. | Solayer (LAYER), délai n.d. | 2,3 à 2,6 Md KRW = 5,2 à 5,8 % [calcul] | n.c. | Suspension, cold storage | Plafond de solde du hot wallet par jeton | T1 (P/S) ; [S] |
| 7 | **Bybit**, 21 févr. 2025, 1,46 Md$ | Upgrade 14:13 puis 5 sweeps, environ 100 % du cold wallet | +67 min (alerte tierce 15:20) ou +91 min (CEO 15:44) ; sources en désaccord [S] | Tether 181 k$ environ 1 jour après ; mETH environ 1 jour après | Environ 3 % (CEO), 5,18 % à 5 mois (Lazarus Bounty [V]) ; dont mETH 43 M$ ; Tether 0,18 M$ | Environ 0 % : le cold wallet était vidé avant l'alerte | Multisig, Safe (interface compromise) ; sur mETH : délai de retrait de 8 h | Vérification hors bande de la charge utile (delegatecall) ; garde on-chain ; délai de retrait (preuve : mETH) | The Block [P], CCN [S] |
| 8 | **Infini**, 24 févr. 2025, 49 M$ | n.d. | Les retraits ont continué | n.d. | « Aucun retour au 27 févr. » (trop tôt pour conclure) | n.c. | Rôle admin d'un ancien développeur non révoqué | Revue des rôles dormants | T1 (S) |
| 9 | **Phemex**, 23 janv. 2025, 70-73 M$ | 16 chaînes, hot wallet après hot wallet | Suspension le jour même, heure n.d. | n.d. ; conversion vite vers actifs non gelables | Non rapporté | n.c. | Clés des hot wallets | Plafond par wallet ; alerte multi-chaînes | T1 (P) |
| 10 | **M2**, 31 oct. 2024, 13,7 M$ | n.d. | 16 min (affirmé par M2) | n.d. | Aucune récupération démontrée | n.c. | n.d. | n.d. | T1 (P) |
| 11 | **Radiant**, 16 oct. 2024, 50-53 M$ | n.d. | Alerte Cyvers et message Radiant le jour même | n.d. | Pas de récupération significative 20 mois après (Radiant) ; 0 % | n.c. | Multisig 3 sur 11 ; pas de pause trouvée | Vérification hors bande de `transferOwnership` ; timelock | The Defiant, The Block [S] |
| 12 | **BingX**, 20 sept. 2024, 45-52 M$ | 2 vagues à quelques heures d'écart | Environ 60 min (gel des retraits) | n.d. | 1 à 10 M$ selon sources (2 à 22 % [calcul]) : non réconcilié, exclu des moyennes | Vague 2 évitable [T1, hypothèse] | Gel des retraits | Plafond entre les vagues | T1 (P/S) |
| 13 | **Indodax**, 10 sept. 2024, 22-25 M$ | Synchrone sur 5 chaînes, plus de 150 tx | Retraits arrêtés le soir même | n.d. | Non rapporté | n.c. | Arrêt des retraits | Vérification entre demandes validées et sorties | T1 (P/S) |
| 14 | **Lykke**, 4 juin 2024, 19,5-23,6 M$ | n.d. | **6 jours** (alerte externe le 9, reconnaissance le 10) | n.d. | Non rapporté | n.c. | Aucun | Surveillance externe des sorties | T1 (S) |
| 15 | **BtcTurk (1re)**, juin 2024, 55 M$ | 10 hot wallets | n.d. | Binance, délai n.d. | 5,3 M$ = 9,6 % [calcul] | n.c. | Suspension | Plafond par wallet | T1 (P) |
| 16 | **DMM Bitcoin**, 31 mai 2024, 305 M$ | 1 transfert de 4 502,9 BTC | n.d. | n.d. | Aucune récupération (T1) ; 0 % | 0 % (un seul transfert) | Multisig 2 sur 3 ; demande détournée | Vérification hors bande de l'adresse (adresse sosie) | T1 (P/S) |
| 17 | **WazirX**, 18 juil. 2024, 230-235 M$ | « Minutes » | Environ 30 min (confirmation après alerte Cyvers) | Environ 6-7 mois (gel de 3 M$ d'USDT, janv. 2025) | 3 M$ = 1,3 % | n.c. | Safe 4 sur 6 | Timelock sur upgrade du Safe ; vérification hors bande | T1 (P) ; [S] |
| 18 | **Orbit Bridge**, 31 déc. 2023, 81-100 M$ | **17 min** (5 retraits, 21:08-21:25) | **73 min** (pont désactivé 22:21) | n.d. | Non rapporté | 100 % était déjà sorti à +73 min [calcul] | Désactivation manuelle | Plafond de retrait ; pause automatique sur retraits sans dépôt source | T1 (S) |
| 19 | **Poloniex**, 10 nov. 2023, 114-132 M$ | 357 tx, 317 tokens, 3 chaînes | +21 min (alerte externe), maintenance annoncée vers +33 min | Gel partiel par Poloniex lui-même moins de 5 h après la confirmation [S] | Montant n.d. | n.c. | Désactivation de wallet | Plafond et alerte sur balayage multi-tokens | T1 (P) ; [S] |
| 20 | **HTX/Heco**, 22 nov. 2023, 100-113 M$ | n.d. | Services rétablis en moins de 24 h | n.d. | Non rapporté | n.c. | n.d. | n.d. | T1 (S) |
| 21 | **Mixin**, 23 sept. 2023, 200 M$ | n.d. | 2 jours | Pas de gel | Aucun gel ; « moitié des actifs sécurisés » (fondateur [V]) | n.c. | Suspension | n.d. | T1 (S) |
| 22 | **CoinEx**, 12 sept. 2023, 54-70 M$ | n.d. | Contrôle de risque a signalé le jour même | n.d. | Non rapporté | n.c. | Gel dépôts et retraits | n.d. | T1 (P) |
| 23 | **Stake.com**, 4 sept. 2023, 41 M$ | n.d. | Environ 3-5 h | n.d. | Non rapporté | n.c. | n.d. | n.d. | T1 (S) |
| 24 | **Harmony Horizon**, 23-24 juin 2022, 100 M$ | 9 à 11 tx | Prime annoncée vers +3 jours | Binance et Huobi, environ 7 mois (janv. 2023) | 1,4 à 2,6 M$ = 1,4 à 2,6 % [calcul] | n.c. | Multisig 2 sur 5 (non confirmé) | Plafond de pont ; pause sur retrait sans verrou | T1 (P) ; Elliptic, ForkLog [S] |
| 25 | **Ronin**, 23 mars 2022, 540-625 M$ | n.d. (environ 100 % de la TVL du pont) | **6 jours** (retrait refusé à un utilisateur) | Environ 6 mois (30 M$ saisis, sept. 2022) ; 5,8 M$ Binance (date discutée) | 30 M$ = 4,8 % à 5,7 % avec 5,8 M$ [calcul] | 0 % (rien ne surveillait les grosses sorties) | 5 validateurs sur 9 ; aucune alerte | Plafond de retrait du pont ; alerte sur grosses sorties | T1 (P/S) ; Decrypt [S] |
| 26 | **BigONE**, juil. 2025, 27 M$ | 4 réseaux | n.d. | n.d. | « Une part gelée » (BigONE [V]), montant n.d. | n.c. | Serveur de risque modifié | Contrôle indépendant demandes/sorties | T1 (S) ; [S] |
| 27 | **CoinDCX**, 18-19 juil. 2025, 44,2 M$ | Solana puis Ethereum | Environ 17 h avant la divulgation (1re tx 23:22) | n.d. | Aucun gel rapporté | n.c. | Wallet non inventorié | Inventaire des wallets, alerte sur compte interne | Rekt, Deccan Herald [S] |

### 1.2 Finance traditionnelle et fraude au virement

| # | Incident, montant | Fenêtre de sortie | Délai 1re réaction | Délai 1er gel / blocage (qui) | Gelé ou récupéré (montant, %) | Reste à la 1re alerte | Mécanisme existant | Mécanisme utile | Src |
|---|---|---|---|---|---|---|---|---|---|
| 28 | **Bangladesh Bank**, 4-5 févr. 2016, 951 M$ tentés | Environ 35 instructions SWIFT pendant la fermeture du week-end | Demande d'arrêt le 8 févr. (3 à 4 jours) ; reçue un jour plus tard (fête en Chine, Philippines) | Deutsche Bank sur 20 M$ (faute d'orthographe) ; 30 instructions de 850 M$ signalées pour revue | 20 M$ (Sri Lanka) + 15 M$ sur 81 M$ = 35 M$ sur 101 M$ sortis = 34,7 % [calcul] ; 15/81 = 18,5 % | 22,85 M$ sur 81 M$ = 28 % (58,15 M$ déjà retirés au 8 févr.) [calcul] | Revue manuelle des correspondants (a bloqué 89 % du tenté [calcul]) | Vérification hors bande ; contact 24 h/24 à la banque centrale | Wikipedia [P] |
| 29 | **Ubiquiti**, juin 2015, 46,7 M$ | n.d. | Fraude identifiée le 5 juin 2015 | n.d. | 8,1 M$ = 17,3 % ; 6,8 M$ attendus sous injonction (14,6 %) [calcul] | n.c. | n.d. | Rappel/vérification hors bande de l'ordre | CIO, TechMonitor [S] |
| 30 | **Cosmos Bank (Pune)**, 11-13 août 2018, 94 crores | 7 h (15:00-22:00 IST, 11 août) ; ~12 000 retraits ATM en 28 pays ; 2e attaque SWIFT le 13 août | n.d. | n.d. | 1,10 lakh = environ 0,01 % [calcul] | n.c. | Aucun | Plafond par carte et par pays ; surveillance du switch | BusinessToday, MoneyLife [S] |
| 31 | **Banco de Chile**, 24 mai 2018, 10 M$ | 4 transactions SWIFT | Plainte à la police de Hong Kong 7 jours après | Poursuites civiles juillet 2018 | Non rapporté | n.c. | Wiper sur 9 000 postes | Rapprochement SWIFT indépendant | Bitdefender, BankInfoSecurity [S] |
| 32 | **Bank of Valletta**, 13 févr. 2019, 13 M€ | Paiements internationaux frauduleux | Suspension 30 min après la détection (soit après l'ouverture) | Annulation en cours | Non chiffré ; 340 k£ de retraits par carte avant blocage | n.c. | Rapprochement des paiements internationaux | Idem | ESET, BankInfoSecurity [S] |
| 33 | **Arup (Hong Kong)**, 2024, 25,6 M$ | 15 virements vers 5 comptes | Découverte après contact avec le siège, délai n.d. | n.d. | Aucun fonds récupéré (état début 2025) ; 0 % | n.c. | Contrôle visuel (vidéo truquée) | Rappel hors bande sur un canal connu | CNN, résumés [S] |
| 34 | **FBI IC3, Financial Fraud Kill Chain, 2023** (agrégat) | n.c. | n.c. | Gel bancaire sur signalement | 538,39 M$ retenus sur 758,05 M$ signalés (3 008 incidents) = 71 % ; 4,3 % des pertes totales déclarées | n.c. | Procédure FFKC | Signalement rapide | IC3 [S] |

### 1.3 Comparateurs hors périmètre strict (non comptés dans les statistiques)

Ce sont des exploits de code, pas des approbations détournées. Ils servent à montrer ce qu'un acteur capable d'arrêter la chaîne ou le jeton obtient.

| # | Incident | Détail | Src |
|---|---|---|---|
| 35 | **Cetus** (Sui), 22 mai 2025, 223 M$ | Détection 11:52 ; les validateurs Sui ont refusé les transactions des adresses de l'attaquant (source unique : vers 12:50, soit environ 1 h [V]) ; 162 M$ gelés = 72,6 % [calcul] ; transfert validé par vote le 29 mai | The Defiant, Cointelegraph, ITC [S] |
| 36 | **Euler**, 13 mars 2023, 196,9 M$ | Ultimatum le 14 mars ; retours du 18 mars au 3 avr. ; environ 177 M$ rendus après prime de 10 % (négocié, pas un gel) | Decrypt, The Block [S] |
| (autre) | **Nomad**, août 2022, 190 M$ | Environ 32,6 M$ restitués par 41 adresses (source Covalent) = 17 % [calcul] ; ZachXBT dit que Circle avait 30-45 min pour geler 45 M$ | Covalent, Cointelegraph [S] |

## 2. Statistiques d'ensemble

Aucune extrapolation. Chaque statistique donne sa définition, son n et ses limites.

### 2.1 Fenêtre de sortie

- **Définition** : durée entre la première et la dernière sortie du vol principal, hors blanchiment.
- **Cas utilisés (n = 5)** : Drift 12 min, Orbit 17 min, Resolv 119 min [ÀV], Bitget 172 min, Cosmos Bank 420 min.
- **Médiane : 119 min.** Étendue 12 à 420 min.
- **Limites** : 5 cas seulement ; les autres fenêtres sont « minutes » ou « n.d. » (Upbit, WazirX, Phemex) et sont exclues. La mesure Bitget (172 min) cache une concentration : 228 M$ en 18 min. Les cas à une transaction (Kelp, DMM) ont une fenêtre nulle et sont exclus. Biais : les cas rapides sont les mieux documentés.

### 2.2 Délai de première réaction de la victime

- **Définition** : temps entre la première sortie et la première action ou communication identifiable (pause, suspension, confirmation publique, alerte reconnue). Définition hétérogène.
- **Cas utilisés (n = 11 crypto)** en minutes : M2 16 (affirmé), Poloniex 21, WazirX 30, Kelp 46, BingX 60, Orbit 73, Bybit 91 (CEO ; 67 si on compte l'alerte tierce), Stake 180, CoinDCX 1 020, Ronin 8 640, Lykke 8 640.
- **Médiane : 73 min.** Sans les deux cas à 6 jours (n = 9) : 60 min. Sur les 10 cas du fichier T1 (sans Bybit) : environ 66 min.
- **Limites** : 5 des 11 valeurs viennent d'alertes externes, pas de la victime. M2 est une affirmation non vérifiée. Les cas sans heure publiée (Drift, Phemex, Bitget, Upbit, Indodax) sont exclus, ce qui biaise vers les incidents bien documentés. Finance traditionnelle exclue : Bangladesh Bank a demandé l'arrêt 3 à 4 jours après, Banco de Chile 7 jours après (police), mais les points de départ ne sont pas homogènes.

### 2.3 Délai jusqu'au premier gel

- **Définition** : temps entre la première sortie et le premier gel par un tiers (émetteur, exchange, validateurs, autorité) ou par la victime.
- **Valeurs chiffrées** : Cetus environ 1 h (source unique [V]) ; Bitget Circle environ 10 h 30 ; Bybit environ 1 jour (Tether, mETH) ; Ronin et Harmony et WazirX entre 6 et 7 mois ; Drift aucun gel en 6 h (au moins).
- **Médiane : non calculable** (valeurs non homogènes, 3 à 4 seulement avec une date exacte). Ordre de grandeur lu dans les cas : de l'heure à la journée pour les gels actifs, de plusieurs mois pour les saisies de type exchange ou autorité.
- **Qui a gelé** : émetteur de stablecoin (Circle sur Bitget, Tether sur Bybit, rien sur Drift), exchanges (Binance et Huobi sur Harmony, Binance sur BtcTurk), conseil de sécurité (Arbitrum sur Kelp), validateurs (Sui sur Cetus), protocole (mETH, Poloniex), autorité (saisies Ronin, 30 M$).

### 2.4 Taux de gel ou de récupération

- **Définition** : montant gelé ou récupéré annoncé, divisé par le montant volé du même incident. Les restitutions négociées ne sont pas comptées (Euler, Nomad sont hors échantillon).
- **Échantillon A (n = 9, montants chiffrés)** : Bitget, Bybit, Kelp, WazirX, Ronin, Harmony, Upbit, BtcTurk 2024, Step.
  - Moyenne simple : **6,8 % (bornes basses) à 8,0 % (bornes hautes)** [calcul].
  - Médiane : 4,8 à 5,7 % [calcul].
  - Pondéré par les montants volés : environ 5,0 à 6,2 % (161 à 201 M$ sur environ 3,2 Md$) [calcul, montants arrondis].
- **Échantillon B (n = 12)** : A plus Drift, DMM, Radiant (zéro déclaré par la source) : moyenne 5,1 à 6,0 %, médiane 2,2 à 3,9 %.
- **Limites** : cas non chiffrés (Phemex, Indodax, Orbit, etc.) exclus, ce qui peut gonfler le taux ; les gels très tardifs (mois) sont inclus ; Kelp (24 %) tire la moyenne vers le haut et dépend d'un gel par conseil de sécurité atypique ; Bybit est borné entre 3 et 5,18 % par deux sources de fiabilité différente ; le dénominateur de Step (27-40 M$) est incertain.
- **Finance traditionnelle** (hors statistiques) : Bangladesh Bank 34,7 % des 101 M$ sortis, Ubiquiti 17 % (31 % si les 6,8 M$ attendus aboutissent), Cosmos Bank environ 0,01 %. Trois cas, trois ordres de grandeur.

### 2.5 Part restante à la première alerte

- Calculable dans 6 cas seulement : Bangladesh Bank 28 % de la jambe philippine ; Bitget Avalanche 10 % du wallet touché mais 74 % de la valeur restante sur 3 wallets partie 98 min plus tard ; Resolv 37,5 % du volume de mint 2 h plus tard ; Bitget global 35-41 % après les 18 min (si l'alerte est tardive) ; Orbit 0 % à +73 min ; Bybit environ 0 %.
- **Non calculable** pour les 28 autres cas : pas de série horodatée des sorties publiée.

## 3. Ce qui aurait changé le montant perdu

Aucun de ces cas ne documente une limite de sortie chiffrée appliquée. Ce qui est établi :

| Mécanisme | Preuve dans les cas | Effet observé | Niveau de preuve |
|---|---|---|---|
| Délai de retrait | mETH/cmETH : délai de 8 h, pause du contrat, liste noire de l'attaquant | 15 000 cmETH récupérés (environ 43 M$, soit 2,9 % de Bybit [calcul]) | Fort [P] The Block |
| Gel par l'opérateur de la chaîne | Cetus : validateurs Sui | 162 M$ sur 223 M$ (72,6 %) gelés | Moyen (source unique pour l'heure) |
| Revue humaine ou contrôle hors bande des ordres | Bangladesh Bank : 30 instructions signalées pour revue, 850 M$ bloqués ; faute d'orthographe sur 20 M$ | 89 % du montant tenté non sorti | Moyen [P] Wikipedia |
| Plafond de mint ou de libération | Resolv (50 M USR contre 100 k$), Kelp (116 500 rsETH en 1 tx) | Effet non calculable : le plafond n'existait pas | Hypothèse |
| Règle « wallet frère » | Bitget Avalanche : 98 min entre deux vidages | 8,2 M$ évitables sur 11,0 M$ restants, si une action suit l'alerte | Rejeu (1 cas, calcul) |
| Timelock sur admin ou upgrade | Drift (zéro timelock), WazirX (upgrade quelques minutes avant), Bybit | Non chiffré ; l'upgrade précède le vidage de minutes à jours dans 5 cas [T1] | Hypothèse |
| Gel par l'émetteur de stablecoin | Circle (Bitget +10 h 30, Drift aucun), Tether | Moins de 1 % dans les cas où il a agi, car les fonds étaient convertis en ETH en moins de 10 min (Bitget) | Fort |

Lecture : là où personne ne peut stopper la sortie dans les 20 premières minutes, le taux reste sous 10 %. Le gel après coup ne rattrape presque rien. Les gains documentés viennent d'un arrêt placé avant ou pendant la sortie (délai, validateurs, revue).

## 4. Analyses publiées sur la récupération et la vitesse

| Source | Chiffre | Définition | Étiquette |
|---|---|---|---|
| Immunefi, rapport T1 2025 | 6,5 M$ récupérés sur 2 incidents = 0,4 % des pertes du trimestre ; 21,2 % au T1 2024 ; Bybit absent du tableau de récupération ; aucune mesure de vitesse | Montant récupéré / pertes du trimestre | [P] https://immunefi.com/blog/research/immunefi-crypto-losses-q1-2025-report/ |
| Immunefi 2024 | T1 22 % (73,9 M$, 7 cas), T2 5 % (26,7 M$, 4 cas), T3 3,5 % (14,9 M$, 2 cas) ; T1 2023 40,5 % | Idem | [S] https://immunefi.com/blog/research/immunefi-crypto-losses-2024-report/ |
| CertiK Hack3d 2025 | 0,38 % rendus au T1 2025 contre 42,09 % au T4 2024 ; H1 2025 : 187,3 M$ rendus pour plus de 2,47 Md$ volés (7,6 % [calcul]) | Fonds rendus / volés. Inclut les restitutions négociées | [S] https://www.certik.com/resources/blog/hack3d-the-web3-security-report-2025 |
| Chainalysis (cité par Nansen) | Plus de 40 M$ gelés ou saisis juste après Bybit ; 3,41 Md$ volés en 2025 | Pas de taux de récupération annuel trouvé | [S] https://research.nansen.ai/articles/by-bit-hack-what-happened-and-where-are-the-funds-going-on-chain |
| Lazarus Bounty (Bybit, 5 mois) | 5,18 % gelé, 32,78 % traçable, 62,04 % « dark » | Part du volé | [V][S] via Coin360/CCN |
| SEAL 911 | Plus de 50 M$ récupérés depuis 2023 (communiqué d'avril 2024) ; réponses en temps réel via Telegram | Auto-déclaré, pas de répartition par incident | [V][S] https://www.businesswire.com/news/home/20240417493276/en/Security-Alliance-SEAL-Launches-Free-Crypto-Native-ISAC |
| ZachXBT (avr. 2026) | Plus de 420 M$ d'USDC non gelés dans 15 cas depuis 2022 ; Drift : 232 M$ en 6 h par CCTP | Décompte d'un analyste, contesté par Circle (gel seulement si obligation légale) | [V][S] https://forklog.com/en/news/zachxbt-criticizes-circle-for-delays-in-freezing-420-million-in-illicit-usdc-funds |
| FBI IC3, FFKC | 2021 : 74 % ; 2022 : 73 % ; 2023 : 71 % des montants signalés retenus ; mais 4,3 % des pertes totales déclarées en 2023 | Montant retenu / montant potentiellement perdu des dossiers traités | [S] https://ic3.gov/annualreport/reports/2023_ic3report.pdf |
| Elliptic (Harmony, FTX) | 1,4 M$ sur 99,6 M$ gelés (Harmony) ; l'attaquant convertit en ETH, non gelable | Cas par cas | [S] https://hub.elliptic.co/analysis/elliptic-collaborates-with-binance-and-huobi-to-freeze-lazarus-group-hack-proceeds/ |
| TRM Labs | Pas d'analyse de vitesse de gel trouvée (résultats : pages miroir douteuses sur une cellule Tether, Tron et TRM à 450 M$ gelés, non vérifiée) | n.c. | Non retenu |
| Rekt, post-mortems | Voir tableau 1 (WazirX, Phemex, CoinDCX) | Chronologies par incident | [S] |

Aucune de ces sources ne donne de médiane de délai de gel. Le taux publié par Immunefi ou CertiK est plus haut que le gel pur, car il compte les fonds rendus contre prime (1inch 5 M$ à 100 %, Moby Trade 60 %).

## 5. Limites générales

1. Échantillon à biais de survie : les incidents avec chronologie publique sont plus rapides ou plus médiatisés.
2. Montants selon les éditeurs (prix à la date) : fourchettes données, calculs sur les bornes.
3. Seul le Bangladesh Bank, la mETH, l'Immunefi T1 2025, Drift (The Block) et Bybit (The Block) ont été ouverts moi-même. Les autres chiffres sont des résumés ou le fichier T1 : à rouvrir avant slide.
4. Les heures de Bitget (alerte à 18:31) et de Bybit (alerte tierce 15:20 ou CEO 15:44) viennent de sources en désaccord.
5. Les cas de finance traditionnelle ont des mécanismes différents (SWIFT, cartes, BEC) : ils illustrent le principe, ils ne se mélangent pas aux médianes crypto.
6. Aucune extrapolation à un taux « de détection » ou « de blocage » du produit : ces données ne mesurent pas ce qu'un plafond ou un délai aurait évité.

## 6. Sources principales (URL)

- [P] Immunefi T1 2025 : https://immunefi.com/blog/research/immunefi-crypto-losses-q1-2025-report/
- [P] The Block, mETH et Tether sur Bybit : https://www.theblock.co/post/342840/meth-protocol-announces-43-million-recovery-from-bybit-hack-while-tether-freezes-181000
- [P] The Block, Drift et Circle : https://www.theblock.co/post/396183/drift-280m-exploit-zachxbt-circle
- [P] The Block, Bybit : https://www.theblock.co/post/342667/crypto-exchange-bybit-hacked-as-over-1-billion-worth-of-eth-leaves-wallets
- [P] Wikipedia, Bangladesh Bank : https://en.wikipedia.org/wiki/Bangladesh_Bank_robbery
- [S] CCN, chronologie Bybit : https://www.ccn.com/education/crypto/ben-zhou-bybit-1-5-billion-hack-explained/
- [S] Cetus : https://thedefiant.io/news/hacks/cetus-protocol-hit-223-million-hack-162-million-frozen-5-million-bounty-vote-on-c13985eb
- [S] Euler : https://decrypt.co/125373/euler-finance-exploiter-returns-recoverable-funds-200m-hack
- [S] Nomad : https://www.covalenthq.com/blog/nomad-bridge-hack-covalent-response/
- [S] Ronin et Binance : https://decrypt.co/98433/binance-recovers-5-8m-622m-axie-infinity-bridge-theft
- [S] Harmony, Binance et Huobi : https://forklog.com/en/binance-and-huobi-freeze-assets-stolen-in-horizon-bridge-hack/amp
- [S] Poloniex : https://siliconangle.com/2023/11/10/justin-suns-poloniex-exchange-hit-100m-exploit/
- [S] WazirX : https://decrypt.co/301538/wazirx-freezes-3-million-hack
- [S] Radiant : https://www.theblock.co/post/403254/unable-to-recover-from-roughly-50-million-hack-radiant-capital-is-winding-down
- [S] Upbit : https://decrypt.co/350196/south-koreas-upbit-36-million-loss-solana-hot-wallet-breach
- [S] CoinDCX (Rekt) : https://rekt.news/zh/coindcx-rekt ; BigONE : https://www.theblock.co/post/362814/bigone-hack
- [S] Ubiquiti : https://techmonitor.ai/?p=102680
- [S] Cosmos Bank : https://www.moneylife.in/article/hackers-transfer-rs94-crore-from-punes-cosmos-bank/55022.html
- [S] Banco de Chile : https://www.bankinfosecurity.net/banco-de-chile-loses-10-million-in-swift-related-attack-a-11075
- [S] Bank of Valletta : https://blog.eset.ie/2019/02/18/maltas-leading-bank-resumes-operations-after-cyberheist-induced-shutdown/
- [S] Arup : https://edition.cnn.com/2024/05/16/tech/arup-deepfake-scam-loss-hong-kong-intl-hnk
- Autres : voir les URL du tableau 4 et les fichiers T1_P4_signaux_incidents.md et T1_P4_rejeu_bitget_avalanche.md.

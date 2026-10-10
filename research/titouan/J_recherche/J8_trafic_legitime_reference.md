# J8 : trafic légitime de référence sur Avalanche C-Chain (faux positifs)

> Recherche du 2026-10-10. Lecture de données publiques uniquement. Aucune transaction, aucune clé, aucun compte. Méthode reprise de `research/tracks/T1_P4_rejeu_bitget_avalanche.md` (API Routescan 43114 sans clé, sorties seulement, filtre des jetons par contrat).

## Légende

- **[P]** : lu sur la chaîne (API Routescan) ou sur une page officielle. **[S]** : source tierce. **[calcul]** : mon calcul. **[ÀV]** : à vérifier.
- Fenêtre : 90 jours, du 12 juil. au 10 oct. 2026 (30 jours : du 10 sept. au 10 oct.). Script jetable hors dépôt.
- Les pages web ont été lues par un outil de résumé : risque de transcription. Chaque adresse a ensuite été confirmée par l'API (elle répond avec des données), mais l'étiquette elle-même n'est pas rejouée en brut.
- Un jeton spam du type « Visit https://avax-bounty.xyz » avait été signalé dans la piste précédente : aucun lien de ce genre visité.

## Résumé (8 lignes)

1. 17 adresses étiquetées ou officielles étudiées ; 10 ont des sorties réelles sur 90 jours, 7 sont dormantes (zéro sortie réelle).
2. Étiquettes Snowtrace (compilation hildobby pour les exchanges) lues sur https://snowtrace.io/accounts ; Aave Collector lu dans le dépôt officiel bgd-labs.
3. Bons candidats « trésorerie calme » : Binance 28 (15 sorties, 2 destinataires), Trade Republic MultiSig (10 sorties, 1 destinataire), Binance 81, Upbit Hot Wallet 1, Bithumb Hot Wallet 12 (montants ronds, 1 destinataire dominant).
4. Régulier mais volumineux : BtcTurk 13 (437 sorties, 1 seul destinataire, 87 jours actifs sur 90).
5. Hub bruyant : Binance Hot Wallet 10 (2 834 sorties et 1 777 destinataires en 8 jours seulement, fenêtre tronquée par l'API). Revolut Cold est intermédiaire (113 destinataires, 282 sorties).
6. Piège majeur : l'empoisonnement d'adresse. Sans filtre par contrat, Robinhood Cold paraît sortir 200 000 AVAX (faux jeton), Bithumb et Upbit gonflent leurs sorties de 284 et 83 faux transferts.
7. Non trouvé : adresses publiques vérifiées pour Avalanche Foundation, trésoreries Benqi, Trader Joe/LFJ, GMX, Platypus, BUIDL, Spiko. Aucune invention.
8. Limites : pas de calcul du taux de « destinataire jamais vu » sur ces adresses, sorties jetons hors liste blanche ignorées, destinataires non étiquetés un par un.

## Méthode et filtres [P]

- Appels : `txlist`, `tokentx`, `txlistinternal` (page de 10 000 lignes, tri décroissant, jusqu'à 6 pages) sur `https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api`.
- Sorties seulement : `from` égal à l'adresse, valeur supérieure à 0, transaction réussie.
- Jetons : seuls les contrats connus sont gardés (USDC `0xB97E…`, USDt `0x9702…`, WAVAX `0xB31f…`, sAVAX `0x2b2C…`, QI `0x8729…`, JOE `0x6e84…`, GUN `0x26de…`, NXPC `0x5e0e…`, STG `0x2f6f…`, PNG `0x6078…`). Le contrôle se fait sur les 10 premiers caractères de l'adresse du contrat [ÀV pour NXPC, STG, PNG, GUN, JOE : correspondance par préfixe, non confirmée sur la page du jeton]. Les autres transferts sont comptés comme « faux » (colonne Faux).
- Les destinataires distincts sont comptés sur les sorties retenues. Les « montants ronds » ne portent que sur l'AVAX natif.
- Limite de l'API : 10 000 lignes par requête. Pour Binance Hot Wallet 10, les 10 000 lignes ne couvrent que le 3 au 10 oct. (environ 8 jours). Chiffres de ce hub = plancher sur 8 jours, pas sur 90.

## Tableau des adresses

| # | Adresse | Étiquette et source | Rôle | Sorties 90 j / 30 j | Destin. distincts 90 j / 30 j | Régularité | Faux | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | `0x5a52E96BAcdaBb82fd05763E25335261B270Efcb` | « Binance: 28 », https://snowtrace.io/accounts (hildobby) [P] | Portefeuille de réserve Binance | 15 / 7 (14 jours actifs) | 2 / 2 : 12 sorties vers `0x9f8c…c8b9` (Hot Wallet 10), 3 vers `0x8356…0007` | AVAX 3 sorties (max 14 729) ; jetons : QI 457 M, JOE 24,2 M, GUN 50 M, NXPC 14,5 M ; pas de montants ronds en AVAX | 1 | **Calme.** Peu de sorties, quasi tout vers le hub de la même plateforme. Bon candidat. |
| 2 | `0x4aeFa39caEAdD662aE31ab0CE7c8C2c9c0a013E8` | « Binance: 81 », https://snowtrace.io/accounts [P] | Portefeuille de réserve Binance | 23 / 8 (15 jours actifs) | 2 / 2 : 14 vers `0x9f8c…c8b9`, 9 vers `0x5a52…efcb` (Binance 28) | AVAX : 3 sorties rondes (5 M, 4 M, 3 M) ; USDt 93,4 M en 6 sorties (max 26,1 M) ; QI 893 M | 5 | **Calme mais gros montants.** Rare, 2 destinataires, tous de la même plateforme. Bon candidat, avec ratios énormes (R2) en fonctionnement normal. |
| 3 | `0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9` | « Binance: Hot Wallet 10 » (tags Binance, CEX, Exchange ; source hildobby), https://snowtrace.io/address/0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9 [P] | Hub de retraits clients | 2 834 / 2 834 en 8 jours seulement (tronqué) | 1 777 / 1 777 (le plus fréquent reçoit 99) | AVAX 1 057 sorties (médiane 64 ; max 279 038) ; USDt 1 426 (médiane 95) ; aucun rythme rond | 30 | **Hub bruyant.** Des milliers de destinataires neufs par semaine. À exclure de la ligne de base « calme ». Sert à tester la règle « jamais vu » : elle y échoue par construction. |
| 4 | `0xefdc8FC1145ea88e3f5698eE7b7b432F083B4246` | « Upbit: Hot Wallet 1 », https://snowtrace.io/accounts [P] | Hot wallet exchange (Corée) | 45 / 20 (31 jours actifs) | 3 / 2 : 42 sorties vers `0x1f7a…a975` | AVAX seulement ; 44 sorties sur 45 en montants ronds ; médiane 39 000 ; max 250 000 ; total 3,07 M AVAX | 83 | **Calme-régulier.** Destinataire dominant unique, montants ronds. Bon candidat. Plus de 20 000 transactions au total surtout entrantes. |
| 5 | `0x346Ff41C596937d3D196A7521e52930210068f6d` | « Bithumb: Hot Wallet 12 », https://snowtrace.io/accounts [P] | Hot wallet exchange (Corée) | 146 / 58 (37 jours actifs) | 3 / 1 : 144 vers `0x3e46…e765` | 144 sorties rondes sur 146 ; médiane 10 000 ; max 50 000 ; total 1,76 M AVAX | 284 | **Calme-régulier.** Un destinataire, montants multiples de 10 000. Bon candidat. 284 faux transferts à filtrer. |
| 6 | `0x76eC5A0D3632b2133d9f1980903305B62678Fbd3` | « BtcTurk: 13 », https://snowtrace.io/accounts [P] | Portefeuille exchange (Turquie) | 437 / 238 (87 jours actifs) | 1 / 1 : tout vers `0xb334…e1ef` | AVAX 50 (non ronds, médiane 24 722) ; USDt 342 sorties de 500 000 (médiane) ; USDC 45 | 22 | **Régulier mais fréquent.** Destinataire unique (sweep vers un portefeuille central). Bon pour la règle « jamais vu », mauvais pour « sorties rares » : environ 5 par jour. |
| 7 | `0x15Da7556D5ED888306839bed06f868AeaeDCb0d7` | « Revolut: Cold Wallet », https://snowtrace.io/accounts [P] | Réserve fintech | 282 / 169 (64 jours actifs) | 113 / 22 : 168 vers `0x9b0c45d4…8d46`, 33 vers `0x9b0cc7ae…8d46` | PNG 136 sorties, QI 109, AVAX 28 (non ronds, max 98 725), GUN 9 | 83 | **Intermédiaire.** 113 destinataires mais un destinataire dominant. Les deux premiers destinataires ont le même début `0x9b0c` et la même fin `8d46` : l'un est probablement un sosie (empoisonnement) [ÀV]. Non retenu comme « calme ». |
| 8 | `0x0E536A0d3944f8946787e42450268fbED362533c` | « Trade Republic: MultiSig », https://snowtrace.io/accounts [P] | Multisig d'un courtier | 10 / 8 (10 jours actifs) | 1 / 1 : tout vers `0x14cb…8113` | AVAX seulement, via transferts internes ; 40 361 AVAX au total ; max 19 276 ; non ronds ; sorties plus fréquentes en oct. (3 sorties les 6 au 8 oct.) | 7 | **Calme.** Un destinataire, peu de sorties. Bon candidat. Hausse récente à surveiller. |
| 9 | `0x5ba7fd868c40c16f7aDfAe6CF87121E13FC2F7a0` | Collector (trésorerie) d'Aave V3 Avalanche, dépôt officiel https://github.com/bgd-labs/aave-address-book (fichier `src/AaveV3Avalanche.sol`) [P] ; pas d'étiquette Snowtrace lue | Trésorerie DAO du marché Aave V3 | 61 / 20 (13 jours actifs), toutes en transferts internes | 1 / 1 : tout vers `0x83b7…2afc` | AVAX natif seulement ; médiane 5,85 ; max 565 ; total 2 165 AVAX ; 0 sortie de jeton réelle sur 90 j | 0 | **Très calme, mais mal interprété.** Un destinataire (probablement un contrat de passerelle ou de rachat) [ÀV]. Ce n'est pas une sortie « trésorerie vers tiers ». À garder comme exemple de trésorerie de protocole sans sorties humaines. |
| 10 | `0xffa8DB7B38579e6A2D14f9B347a9acE4d044cD54` | « Bitget: 35 », Snowtrace (hildobby) ; repris de la piste P4 [P] | Wallet de retrait Bitget (cas d'étude) | 29 / 12 (22 jours actifs) | 3 / 3 : 27 vers `0x0639…d206`, 1 vers `0x770b…63Ee` (attaquant), 1 vers `0xed9a…8771` (rotation) | 27 sorties rondes sur 29 ; max 821 012 (vol du 24 sept.) | 2 | **Calme jusqu'à l'incident.** À n'utiliser en « légitime » que sur [25 août, 24 sept. 19:16] ; les 90 j contiennent le vol. |
| 11 | `0x1d48963DD8FAdA6aB5C2C7b92Eba81ECC5030270` | « Robinhood: Cold Wallet », https://snowtrace.io/accounts [P] | Cold wallet courtier (23 transactions au total) | 0 réelle | 0 | Seul « mouvement » : 200 000 jetons nommés « AVAX » le 25 sept. vers `0x841e…3a34`, contrat de jeton `0x7782f1dc…` : **faux jeton** (empoisonnement) | 1 | **Dormant.** Aucun trafic légitime à mesurer. Cas utile pour tester le filtre anti-faux jetons. |
| 12 | `0x43684D03D81d3a4C70da68feBDd61029d426F042` | « Binance: 117 », https://snowtrace.io/accounts [P] | Cold wallet Binance (8 transactions au total) | 0 | 0 | Aucune transaction sur 90 j | 0 | **Dormant.** Toute sortie future serait un événement rare. |
| 13 | `0x3Eb93b23A2dD4cEd46e964F035Ecea9bFb55bc73` | « Coinbase: Cold Wallet », https://snowtrace.io/accounts [P] | Cold wallet Coinbase | 0 | 0 | Aucune transaction sur 90 j | 0 | **Dormant.** |
| 14 | `0x8834431CB2b1A1BA216Dfc540EB475476d51f4e3` | « Coinbase: Cold Wallet », https://snowtrace.io/accounts [P] | Cold wallet Coinbase | 0 | 0 | Aucune transaction sur 90 j | 0 | **Dormant.** |
| 15 | `0xeEc5d35E12E5d78CF724350978754b65AE255C33` | « NEXPACE: Contribution Rewards », https://snowtrace.io/accounts [P] | Réserve de projet (52 transactions au total) | 0 | 0 | Aucune transaction sur 90 j | 0 | **Dormant.** |
| 16 | `0x7456F440F9fd2642579d109b2731BE5fb9e133B8` | « GUNZ: Vested Supply », https://snowtrace.io/accounts [P] | Offre bloquée (vesting) de projet | 0 | 0 | Aucune transaction sur 90 j | 0 | **Dormant.** |
| 17 | `0x3C06dce358add17aAf230f2234bCCC4afd50d090` | ACL_ADMIN d'Aave V3 Avalanche, https://github.com/bgd-labs/aave-address-book [P] | Administrateur de droits du marché | 0 | 0 | Aucune transaction sur 90 j ; aucune étiquette Snowtrace lue | 0 | **Dormant.** Hors trafic ; utile pour le signal « changement de pouvoirs » seulement. |

## Lecture pour la mesure de faux positifs

- **Bons candidats « trésorerie calme »** (peu de destinataires, sorties rares) : Binance 28, Binance 81, Trade Republic MultiSig. Régulières à montants ronds avec un destinataire quasi unique : Upbit Hot Wallet 1, Bithumb Hot Wallet 12.
- **Destinataire unique mais sorties fréquentes** : BtcTurk 13 (environ 5 par jour). Test idéal de la règle « jamais vu » (zéro alerte attendue), mauvais test de « rareté ».
- **Hub bruyant** : Binance Hot Wallet 10. À utiliser comme contre-exemple : la règle « destinataire jamais vu » y tombe à environ 220 alertes par jour [calcul : 1 777 destinataires en 8 jours]. Seule la règle « plus de 50 % du solde en une transaction » reste utilisable, comme dans la piste P4 pour « Bitget: 6 ».
- **Dormants** (7 adresses) : zéro trafic réel. Elles ne fournissent pas de ligne de base, mais confirment qu'une sortie y serait une anomalie évidente.
- **Ratios R2** : sur Binance 81, des sorties de 3 à 5 M AVAX sont normales. Une règle « N fois la moyenne » donnerait des alertes en fonctionnement normal (même constat que pour Bitget : 16 à 162 fois).
- **Filtre de jetons obligatoire** : 30 à 284 faux transferts par adresse sur 6 des 17 adresses. Sans liste blanche de contrats, le nombre de sorties et de destinataires est faux.

## Non trouvé

- **Avalanche Foundation** : aucune adresse de trésorerie publiée ou étiquetée trouvée (recherches sur Snowtrace et presse). Presse sur la levée de 1 Md$ sans adresses : https://www.theblock.co/post/370279/avalanche-foundation-1-billion-raise-avax-treasury.
- **Benqi** : seuls les jetons QI `0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5` et sAVAX `0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE` (https://docs.benqi.fi/resources/contracts) et le Comptroller `0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4` (https://docs.benqi.fi/resources/contracts/core-markets) ont été lus. Aucune adresse de trésorerie ou de multisig trouvée. Les qiTokens sont des contrats de marché, pas des trésoreries : non analysés.
- **Trader Joe / Liquidity Book, GMX, Platypus** : aucune adresse de trésorerie vérifiée trouvée.
- **BUIDL sur Avalanche, Spiko** : aucune adresse de contrat ou d'émetteur trouvée (annonce : https://www.avax.network/about/blog/blackrock-launches-digital-liquidity-fund-buidl-on-avalanche-via-securitize).
- Autres EVM : non traité (consigne centrée sur la C-Chain, budget de recherche).
- Pistes pour la suite : compilation hildobby (requête Dune liée depuis les pages Snowtrace), dépôt `bgd-labs/aave-address-book`, pages « Etherscan labels » des multisigs de protocoles.

## Commandes pour rejouer (lecture seule, sans clé)

```
BASE="https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api"
curl "$BASE?module=account&action=txlist&address=0x5a52E96BAcdaBb82fd05763E25335261B270Efcb&page=1&offset=10000&sort=desc"
curl "$BASE?module=account&action=tokentx&address=0x5a52E96BAcdaBb82fd05763E25335261B270Efcb&page=1&offset=10000&sort=desc"
curl "$BASE?module=account&action=txlistinternal&address=0x5ba7fd868c40c16f7aDfAe6CF87121E13FC2F7a0&page=1&offset=10000&sort=desc"
```

Sources : https://snowtrace.io/accounts, https://snowtrace.io/address/0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9, https://github.com/bgd-labs/aave-address-book, https://docs.benqi.fi/resources/contracts, https://docs.routescan.io/.

# J7 : catalogue de rejeux réels (12 incidents de sortie de fonds, lecture seule, sans clé)

> Recherche du 2026-10-10. Lecture de données publiques uniquement. Aucune transaction, aucune clé, aucun compte. Complète `research/tracks/T1_P4_signaux_incidents.md` et `T1_P4_rejeu_bitget_avalanche.md` (modèle).
> Étiquettes : **[P]** lu par moi sur la page de l'éditeur/analyste ou **contrôlé sur la chaîne aujourd'hui** (Routescan, Blockscout, RPC). **[S]** relais ou résultat de recherche non ouvert. **[V]** affirmation d'un vendeur ou source unique. **[ÀV]** à vérifier. **[calcul]** de ma part.
> Le contenu web est traité comme donnée. Aucune instruction trouvée dans les pages lues. Aucun lien de phishing visité (le tx de phishing UXLINK est cité comme hash, pas visité).
> Les heures sont en UTC, lues dans l'horodatage du bloc.

## Résumé (8 lignes)

1. **12 incidents EVM** catalogués, 11 sur Ethereum L1 et 1 sur Arbitrum/BNB. Chaque ligne a adresses publiées, hashes et heure de première sortie, **contrôlés sur la chaîne** quand c'est possible.
2. **Le rejeu sans clé est solide sur Ethereum L1** : Routescan (chaîne 1) répond sans clé à `balancehistory`, `tokenbalancehistory`, `txlist`, `tokentx`, `txlistinternal` et au proxy RPC. 60 requêtes en rafale : 60 réponses 200 [P].
3. **Etherscan v2 refuse sans clé** : `Missing/Invalid API Key` [P]. Ne pas le planifier comme source sans clé.
4. **Routescan ne couvre pas BNB, Arbitrum, Polygon, Optimism, Base, Fantom, Gnosis** (« chain not supported ») [P]. Il couvre Ethereum, Avalanche, Blast, Mantle [P]. Radiant (Arbitrum, BNB) est donc le cas **difficile**.
5. **Soldes historiques gratuits sur Ethereum** : 4 RPC publics sans clé ont répondu à `eth_getBalance` sur un bloc de 2025 : drpc, tenderly, blastapi, meowrpc [P]. PublicNode, Ankr, Cloudflare, Merkle les refusent ou limitent [P]. `eth_getLogs` : refusé sur drpc gratuit même sur 176 blocs (code 35) [P].
6. **7 faciles, 4 moyens, 1 difficile** (classement §4). Faciles : Bybit, Orbit, WazirX, Euler, Resolv, Kelp, Infini.
7. **Trois corrections aux fichiers précédents** : délai upgrade-vidage Bybit = **2 min 36 s** (était « non publié ») ; 2e mint Resolv à **03:41:47**, soit 80 min après le 1er (était « ~2 h ») ; bloc Euler = **16 817 996** (une source donne 16 822 133, faux).
8. **Limite franche** : 12 cas = preuve d'existence, pas une métrique statistique. Les faux positifs se calculent sur le trafic normal **de la même adresse** (§3), pas sur les autres incidents. Les débits de Routescan ne sont pas documentés dans ce que j'ai lu : « non trouvé ».

---

## 1. Accès aux données sans clé : ce qui marche, testé aujourd'hui

Base Routescan : `https://api.routescan.io/v2/network/mainnet/evm/{chainId}/etherscan/api` (compatible Etherscan). Doc : https://docs.routescan.io/

| Source | Sans clé ? | Historique de soldes | Limites observées | Verdict |
|---|---|---|---|---|
| **Routescan** chaîne 1, 43114, 81457, 5000 | Oui [P] | `balancehistory` (ETH natif) et `tokenbalancehistory` (jeton) à un bloc donné : valeurs exactes confirmées (Bybit, Orbit, Poloniex) [P] | 60 requêtes en rafale, 0 refus. Débit officiel : **non trouvé**. `page × offset ≤ 10 000` (erreur « Result window is too large ») [P]. Pas de `eth_getLogs` testé | Source principale |
| **Etherscan v2** (`api.etherscan.io/v2/api?chainid=…`) | **Non** [P] : `Missing/Invalid API Key` | n/a | n/a | À écarter pour le sans clé |
| **Blockscout** `eth.blockscout.com/api/v2/…` | Oui [P] | `addresses/{a}/coin-balance-history` donne bloc, heure, delta, hash [P] (Bybit : delta −401 346,77 ETH au bloc 21895251) | En-tête `x-ratelimit-limit: 10`, reset ~834 s ; 14 requêtes de suite sans 429 [P]. Jeton temporaire possible (en-tête `bypass-429-option`) | Très bon pour les deltas |
| **Blockscout Arbitrum** | Bloqué : page de contrôle Cloudflare [P] | n/a | Je n'ai pas contourné | Ne pas compter dessus |
| **RPC Ethereum archive gratuit** | drpc `https://eth.drpc.org`, `https://mainnet.gateway.tenderly.co`, `https://eth-mainnet.public.blastapi.io`, `https://eth.meowrpc.com` : OK sur bloc 21895237 (réponse `0x54fd0d4baa6732d1f7e6` = 401 346,77 ETH) [P] | Oui, via `eth_getBalance` + tag de bloc | drpc : `eth_getLogs` refusé (code 35) ; autres limites **non mesurées** | Bon secours |
| **RPC Ethereum non archive** | PublicNode : « Archive requests require a personal token » ; Ankr : clé exigée ; Cloudflare-eth et eth.merkle.io : limite de débit [P] | Non | n/a | À écarter pour l'historique |
| **RPC Arbitrum / BNB publics** | `arb1.arbitrum.io/rpc`, `bsc-dataseed.binance.org`, `bsc-rpc.publicnode.com` : **lisent les transactions anciennes** (hash Radiant OK) [P] | **Non** : « historical state … not available », « missing trie node », « Archive requests require a personal token » [P] | n/a | Tx oui, soldes historiques non |
| **Data API Avalanche** `data-api.avax.network` | Oui | Solde courant seulement (selon le rejeu Bitget) | Non mesuré ici | Sans objet pour ce lot |

**Recette de rejeu** (identique au modèle Bitget) : `txlist`/`tokentx` sur [T0 − 30 j, T0 + 6 h], filtrer `from == wallet`, calculer `part = valeur / balancehistory(bloc − 1)`, destinataire jamais vu sur 30 j, cumul 10 min. Filtrer les jetons par **adresse de contrat**, jamais par symbole (empoisonnement d'adresse, voir le rejeu Bitget §1.2).

Exemples exécutés (lecture seule) :

```
R="https://api.routescan.io/v2/network/mainnet/evm/1/etherscan/api"
curl "$R?module=account&action=balancehistory&address=0x1Db92e2EeBC8E0c075a02BeA49a2935BcD2dFCF4&blockno=21895250"
   # attendu 401346768858404671846374
curl "$R?module=proxy&action=eth_getTransactionByHash&txhash=<hash>"
curl "$R?module=account&action=txlistinternal&txhash=<hash>"
curl "https://eth.blockscout.com/api/v2/addresses/<adresse>/coin-balance-history"
curl -X POST -H 'content-type: application/json' https://eth.drpc.org \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_getBalance","params":["<adresse>","0x14e1845"]}'
```

---

## 2. Tableau des 12 incidents

Légende de la colonne preuve : la source de **l'adresse publiée** est donnée dans la fiche (§3). « chaîne [P] » = je l'ai relue sur la chaîne aujourd'hui.

| # | Incident | Chaîne | Victime (adresse) | Attaquant / destinataire | Hash clé | Bloc, heure UTC de la 1re sortie [P chaîne] | Montant |
|---|---|---|---|---|---|---|---|
| 1 | **Bybit** (21 févr. 2025) | Ethereum | Cold wallet Safe `0x1Db92e2EeBC8E0c075a02BeA49a2935BcD2dFCF4` | `0x47666Fab8bd0Ac7003bce3f5C3585383F09486E2` (reçoit 401 346,77 ETH, vu en tx interne) | Upgrade `0x46deef0f52e3a983b67abf4714448a41dd7ffd6d32d32da69d62081c68ad7882` ; sweep ETH `0xb61413c495fdad6114a7aa863a00b2e3c28945979a10885b12b30316ea9f072c` | Upgrade bloc **21895238**, **14:13:35** ; sweep bloc 21895251, **14:16:11** | 401 346,77 ETH + jetons |
| 2 | **Radiant** (16 oct. 2024) | Arbitrum (+ BNB) | Pools Radiant (adresse du Pool Provider : **non trouvée**) | Attaquant 1 `0x0629b1048298AE9deff0F4100A31967Fb3f98962` ; 2 `0x97a05becc2e7891d07f382457cd5d57fd242e4e8` ; backdoor `0x57ba8957ed2ff2e7AE38F4935451E81Ce1eEFbf5` | Arbitrum `0x7856552db409fe51e17339ab1e0e1ce9c85d68bf0f4de4c110fc4e372ea02fb1` ; BNB `0xd97b93f633aee356d992b49193e60a571b8c466bf46aaf072368f975dc11841c` ; tentative ratée Arbitrum `0xab34055320676b35d4c6c5936dabc4101b45eda0d66b94ee02f10a96e8a1dd45` | Arbitrum bloc 264 477 049, **17:09:18** ; BNB bloc 43 172 925 (heure non lue) | ~50 M$ |
| 3 | **Orbit Bridge** (31 déc. 2023) | Ethereum | Vault `0x1bf68a9d1eaee7826b3593c20a0ca93293cb489a` (cible des appels, chaîne [P]) | Attaquant `0x9263e7873613ddc598a701709875634819176aff` ; financeur `0x70462bfb204bf3ccb0560f259072f8e3a85b3512` ; 5 destinataires (ex. `0x3a886a63c768665a9830886e608d6f9dc6b4f730` pour DAI) | 10 M DAI `0xafdc36278fcef8d54824b09ec019147cfe2afd995abf6754e52d273a2c1b07ca` ; 30 M USDT `0xd8ca42941a0a2c25669267ad8d61f7f9f4118252cb502316602fe16624b80ac8` ; financement Tornado `0x5e35f4b1886d62543cc027b5c0ef54aac3901a25c37d8ea6b1ab8861c9bd09dd` ; désactivation `0xedfcdeb97c57a106067315afd364af361b20f0cf1a10070db57241a5e11913f4` | Bloc **18908035**, **21:07:59** ; dernière 21:25:35 ; pont coupé 22:21:35 | 81 à 100+ M$ ; solde ETH du vault 10 035,7 → 535,7 ETH |
| 4 | **Harmony Horizon** (23 juin 2022) | Ethereum | Pont multisig (adresse : **non trouvée** dans CertiK ni Merkle) | H1 `0x0d043128146654c7683fbf30ac98d7b2285ded00` ; intermédiaires `0x9E91ae672E7f7330Fc6B9bAb9C259BD94Cd08715`, `0x58F4BACcb411ACef70A5f6DD174Af7854fc48Fa9` ; consolidation `0x1Ec6F83b55C3F4CeFc630442716872BA15f16430` | Aucun hash publié par CertiK/Merkle. Transactions de H1 lues en chaîne : `0xb4d60d5161b8508098d9c21834377eaded6b8668d205dfe4bfa7b6dd30f7a192` (4 570 ETH reçus de `0x58F4…`, bloc 15012856, 12:02:48) | CertiK : 1re tx d'exploit **11:06:46** (13 100 ETH, multisig id 21106). 1re tx de H1 en chaîne : 11:32:40 (bloc 15012744). **Écart non réconcilié** : l'attaquant utilisait ≥ 3 adresses | ~97 à 100 M$ |
| 5 | **Ronin Bridge** (23 mars 2022) | Ethereum | Contrat pont appelé `0x1A2a1c938CE3eC39b6D47113c7955bAa9DD454F2` (ETH détenu en WETH `0xc02aaa39…c756cc2`, sorti en 173 600 ETH par tx interne [P]) | `0x098B716B8Aaf21512996dC57EB0615e2383E2f96` | ETH `0xc28fad5e8d5e0ce6a2eaf67b6687be5d58113e16be590824d6cfa1a94467d0b7` ; USDC `0xed2c72ef1a552ddaec6dd1f5cddf0b59a8f37f82bdda5257d9c7c37db7bb9b08` | Bloc **14442835**, **13:29:09** ; USDC bloc 14442840, 13:31:04 | 173 600 ETH + 25,5 M USDC |
| 6 | **Poloniex** (10 nov. 2023) | Ethereum (+ Tron, BTC) | « Poloniex 4 » `0xa910f92acdaf488fa6ef02174fb86208ad7722ba` : 4 967,49 → 67,48 ETH | ETH `0x0a5984f86200415894821bfefc1c1de036dbf9e7` ; Tron `TKK6d1YALy8HCSoCSWWd1ZJhyC9NPPx4wa` ; BTC `bc1qnpc7u2ha7ct9c458rrqsawylz9e9j6jvkvzttt` | 1re tx ETH `0xcbf1547119ae869604585997b11d118bb423f32ae75c2fe055b7eb8d79d3ae77` (4 900 ETH) ; GLM `0xc9700e4f072878c4e4066d1c9cd160692468f2d1c4c47795d28635772abc18db` | Bloc **18540957**, **10:30:11** (CertiK : 18 M$ BTC à 10:34, sur une autre chaîne) | 114 à 132 M$ |
| 7 | **WazirX** (18 juil. 2024) | Ethereum | Safe `0x27fD43BABfbe83a81d14665b1a6fB8030A60C9b4` (cible de l'upgrade, chaîne [P]) ; multisig cité par Rekt `0x09b33e75e51ae9a30eca4b65db76e511199af664` | `0x6EeDF92Fb92Dd68a270c3205e96DCCc527728066` (déclencheur) ; drain `0x04b21735E93Fa3f8df70e2Da89e6922616891a88` ; préparation `0xC891b507A7c109179d38E2Cb4DE6CD8Dc70D2ad4`, `0xc6873ce725229099caf5ac6078f30f48ec6c7e2e` | Leurre USDT `0x8b99ae634e1e7180b3fcc66e8fe5d076351477077051a7bbf5ec626a9d0588ef` ; **upgrade** `0x48164d3adbab78c2cb9876f6e17f88e321097fcd14cadd57556866e4ef3e185d` ; test USDT 10 juil. `0xc850b252ab32d80203991c9b5359205e917c94c94d3c47d04d8b153453b1e2b2` | Leurre bloc 20331531, 06:10:47 ; upgrade bloc **20331565**, **06:17:47** ; test 10 juil. 07:49:23 (ETH `0xc6cb4c07…`) | ~230 M$ |
| 8 | **Euler Finance** (13 mars 2023) | Ethereum | Contrats Euler (adresse : **non trouvée** dans mes sources) | EOA appelante `0x5f259d0b76665c337c6104145894f4d1d2758b8c` ; contrat d'attaque `0xebc29199c817dc47ba12e3f86102564d640cbf99` ; ImmuneBytes cite aussi `0xb66cd966670d962C227B3EABA30a872DbFb995db` [S] | `0xc310a0affe2169d1f6feec1c63dbc7f7c62a887fa48795d327d4d2da2d6b111d` ; 2e tx `0x47ac3527d02e6b9631c77fad1cdee7bfa77a8a7bfd4880dccbda5146ace4088f` | Bloc **16817996**, **08:50:59** ; 2e : 16818024, 08:56:35 | ~197 M$ (rendu en grande partie ensuite) |
| 9 | **UXLINK** (22 sept. 2025) | Ethereum (+ Arbitrum pour le mint) | Multisig `0x4457d81a97ab6074468da95f4c0c452924267da5` (cible du `delegatecall`, chaîne [P]) ; un 2e `0x8676d208484899f5448ad6e8b19792d21e5dc14f` | Attaquant `0x2EF43c1D0c88C071d242B6c2D0430e1751607B87` ; 2e tour `0xb819e6ae5a6668bb0ce02d64d130deca9ff83691` ; token UXLINK Arbitrum `0x1a6b3a62391eccaaa992ade44cd4afe6bec8cff1` [S, The Block] | Prise d'admin `0xc6e91f9e07e4989a65c9842937f1a66527dd3a1cb0eaaed54dd58a966cc0775b` ; vol 2,68 M$ USDT `0x725a490ee5cd49209b08cf5b7e7513656098d1c174acdf006707b2d5589654bd` ; mint Arbitrum `0x35edac40767f65d4d1382f0f55cda2f4db321313e16fe059079f0113f9cb5696` | Prise d'admin bloc **23419254**, **14:46:35** ; vol 14:51:35 (bloc 23419279) | 11,3 M$ (Cyvers) |
| 10 | **Infini** (24 févr. 2025) | Ethereum | Vault `0x9a79f4105a4e1a050ba0b42f25351d394fa7e1dc` | Attaquants `0x3ac96134fb0e42a52d33045aee50b89790f05ed0`, `0xfcc8ad911976d752890f2140d9f4edd2c64a6e49` ; admin développeur compromis `0xc49b5e5b9da66b9126c1a62e9761e6b2147de3e1` | Exploit `0xacf84c5944f662a4fcf783806993d713a150994932008e72e4e47a58d6665f7f` ; 2e `0xecb31ff694c0e6c5e5b225c261854c0749ecf5d53c698fcda61f2d8e3db8f9fc` ; financement Tornado `0x03db8172ada9778e168fb1903d513782161d3e63a57004244d9437de89c68741` | Bloc **21913141**, **02:15:59** ; financement 00:57:47 (**78 min avant**) | ~49 M$ |
| 11 | **Resolv** (22 mars 2026) | Ethereum | Contrat « USR Counter » `0xa27a69Ae180e202fDe5D38189a3F24Fe24E55861` ; signeur SERVICE_ROLE `0x15CAd41e6BdCaDc7121ce65080489C92CF6de398` | `0x04A288a7789DD6Ade935361a4fB1Ec5db513caEd` (80 M USR) ; `0x8ED8cF0C1c531C1b20848E78f1CB32fa5B99b81C` (ETH) ; autres : `0x6Db6006c38468CDc0fD7d1c251018b1B696232Ed`, `0xb945eC1be1f42777F3AA7D683562800B4CDD3890`, `0x9FeeEAEc113E6d2DCD5ac997d5358eee41836e5f` | Demande `0x590b5c66df27b7f34cde721ca1b5f973ae047ffda370610491f694dade732c89` ; **mint** `0xfe37f25efd67d0a4da4afe48509b258df48757b97810b28ce4c649658dc33743` ; 2e demande `0xe5bae64ee813c742f06b5d045397c2eefa31532e4d6c21b7c6da129eaa17ae4b` ; 2e mint `0x41b6b9376d174165cbd54ba576c8f6675ff966f17609a7b80d27d8652db1f18f` | Demande 01:50:59 (bloc 24709879) ; mint bloc **24710031**, **02:21:35** ; 2e mint bloc 24710428, **03:41:47** | 50 M + 30 M USR mintés ; ~25 M$ extraits |
| 12 | **KelpDAO rsETH** (18 avr. 2026) | Ethereum (source Unichain) | Adaptateur OFT `0x85d456b2dff1fd8245387c0bfb64dfb700e98ef3` (émetteur du transfert, chaîne [P]) ; jeton rsETH `0xa1290d69c65a6fe4df752f95823fae25cb99e5a7` | `0x8b1b6c9a6db1304000412dd21ae6a70a82d60d3b` | `0x1ae232da212c45f35c1525f851e4c41d529bf18af862d9ce9fd40bf709db4222` ; suites : `0xe381248517921e5a576fd915e6c7b93f7ab10f3d323ea89730b28fe91d84e70a` (53 000 rsETH, 17:37:23), `0x95fa2f737aa3f22c182dc86898ac63853ce3c6ddc802ced97a635eb8474d19ed` (30 000, 17:37:59) | Bloc **24908285**, **17:35:35** (le fichier précédent disait 17:35 : confirmé) | 116 500 rsETH (~292 M$) |

---

## 3. Fiches par incident : source des adresses, accès, faisabilité, trafic normal

Chaque « Source » donne l'URL où l'adresse est publiée.

### 1. Bybit : FACILE
- **Sources** : hashes et mécanique : https://blocksec.com/blog/bybit-incident-a-web2-breach-enables-the-largest-crypto-hack-in-history [P, fichier précédent]. Le destinataire `0x4766…` complété en chaîne : la tx interne du sweep envoie 401 346,7688584047 ETH de `0x1Db9…FCF4` vers `0x47666Fab…86E2` [P chaîne]. L'adresse complète du cold wallet vient de ma connaissance préalable, **confirmée** par le champ `to` de la tx de sweep [P chaîne] ; source éditeur : non rouverte.
- **Accès** : Routescan chaîne 1 (`balancehistory` bloc 21895250 = 401346768858404671846374 ; Blockscout coin-balance-history). RPC drpc/tenderly pour `eth_getBalance`.
- **Mesure** : upgrade 14:13:35 → sweep 14:16:11 = **156 s** [calcul sur horodatages chaîne]. Un signal D7 (changement d'implémentation) précède le vidage de 2 min 36 s.
- **Trafic normal** : même Safe, entrées et sorties des 30 jours précédents (Blockscout : un dépôt de 20 000 ETH 11 h avant, bloc 21891992, 03:19:48 [P]). Faux positifs de D7 : les changements d'implémentation de Safe légitimes (très rares), plus d'autres Safe de custodians.

### 2. Radiant : DIFFICILE
- **Source** : https://rekt.news/radiant-capital-rekt2 [P] (adresses et hashes). Pool Provider : **non trouvé**. Timestamp 17:09:18 lu dans le bloc Arbitrum via RPC `arb1.arbitrum.io/rpc` [P].
- **Accès** : Routescan ne supporte pas 42161 ni 56 [P]. Blockscout Arbitrum derrière Cloudflare [P]. Les RPC publics lisent les transactions mais **pas l'état historique** [P]. Il faut donc un explorateur à clé (Arbiscan via Etherscan v2 : clé gratuite exigée) ou des tx seules.
- **Trafic normal** : le Pool Provider a peu de transactions admin ; la ligne de base serait les appels `onlyOwner` des 90 jours. Non calculable sans historique de l'explorateur.

### 3. Orbit Bridge : FACILE
- **Sources** : https://rekt.news/orbit-bridge-rekt [P] (attaquant, financeur, 7 hashes). Vault : champ `to` de la 1re tx [P chaîne].
- **Accès** : Routescan chaîne 1 ; `balancehistory` du vault : 10 035,73 ETH (bloc 18908034) → 535,73 ETH (bloc 18908123) [P]. `tokentx` du vault sur les blocs 18908035 à 18908123 : DAI 10 M, WBTC 230,879, USDC 10 M, USDT 30 M vers 4 destinataires distincts [P].
- **Mesure** : financement Tornado 29 déc. 15:49:11, soit **~2 jours avant** (signal N2) ; 5 retraits en 17 min 36 s ; alerte R1 « destinataire inconnu » dès 21:07:59.
- **Trafic normal** : retraits utilisateurs du vault (`tokentx` 30 j sur le vault). Destinataires nombreux : la règle « destinataire jamais vu » donnera des faux positifs ; utiliser « > X % du solde du jeton ».

### 4. Harmony Horizon : MOYEN
- **Sources** : https://www.merklescience.com/blog/hack-track-analysis-of-harmonys-horizon-bridge-exploit [P] (H1 à H11, **sans hash**) ; https://www.certik.com/resources/blog/harmony-incident-analysis [P] (11:06:46, 12 tx, 3 adresses, **sans adresse ni hash**). Merkle note H7 = H8 (même adresse listée deux fois : faute probable) [P].
- **Accès** : Routescan chaîne 1 pour H1 (tx de H1 lues, voir tableau). L'adresse du **pont** (victime) est **non trouvée** : à repérer via `txlistinternal`/`tokentx` entrants vers H1. Les 12 tx d'exploit sont à reconstituer.
- **Réserve** : écart de 26 min entre CertiK (11:06:46) et la 1re tx de H1 (11:32:40) : l'attaquant a utilisé d'autres adresses. [ÀV]
- **Trafic normal** : dépôts et retraits du pont (confirmations du multisig). Garder un temps de calcul pour reconstituer.

### 5. Ronin : MOYEN
- **Sources** : hashes issus d'une recherche web (résumé de moteur) puis **contrôlés en chaîne** : les deux tx existent, `from` = `0x098B…2f96`, `to` = `0x1A2a…54F2`, blocs 14442835 et 14442840 [P chaîne]. Adresse attaquant : BlockSec, https://blocksec.com/blog/tracing-the-stolen-fund-of-the-ronin-bridge [S, non ouvert].
- **Piège** : `balancehistory` du contrat `0x1A2a…` donne ~464 ETH avant et après ; le **vrai flux** passe par WETH (tx interne WETH → pont → attaquant, 173 600 ETH) [P]. Pour le solde, il faut `tokenbalancehistory` de WETH `0xc02a…` sur le pont (non lancé) ou la contrepartie ETH détenue ailleurs. [ÀV]
- **Mesure** : 2022, détection tardive de 6 jours. Rejeu utile pour « sortie ≈ 100 % de la TVL du pont ».
- **Trafic normal** : retraits du pont (signatures de 5 validateurs sur 9) ; volume élevé de petits retraits, donc seuil en pourcentage du solde.

### 6. Poloniex : MOYEN
- **Sources** : https://rekt.news/poloniex-rekt [P] (victime « Poloniex 4 », attaquants ETH/Tron/BTC, 2 hashes) ; CertiK https://www.certik.com/resources/blog/poloniex-incident-analysis [P] (heures, 681 wallets, sans adresse). Les autres hot wallets Poloniex : **non trouvés**.
- **Accès** : Routescan chaîne 1 : « Poloniex 4 » 4 967,485 ETH (bloc 18540956) → 67,484 ETH (bloc 18540957) = **98,6 % du solde en une tx** [P calcul]. Les jambes Tron et BTC sont hors de ce lot (Tronscan et mempool.space publics, non testés).
- **Trafic normal** : wallet de hot wallet d'exchange, beaucoup de destinataires ; la règle « > 50 % du solde vers adresse inconnue » est la seule robuste (comme « Bitget: 6 »). Ligne de base à calculer sur 30 j (2023, volume élevé : `offset` 10 000 par page).

### 7. WazirX : FACILE
- **Source** : https://rekt.news/wazirx-rekt [P] (4 adresses attaquantes, 15 hashes dont préparation du 8 au 10 juillet). Contrôlé en chaîne : upgrade bloc 20331565, leurre 7 min avant [P].
- **Accès** : Routescan chaîne 1 ; `tokentx` du Safe `0x27fD…` pour les jetons (SHIB, USDT, etc.). Solde ETH du Safe 15 298,16 ETH au bloc 20331565 [P]. Le drain suit la tx d'upgrade ; les hashes de drain **ne sont pas publiés** par Rekt (« non trouvé »), à lire dans `txlist` de `0x04b2…1a88`.
- **Mesure** : test du 10 juil. (3 tx de test avec le multisig), financement Tornado 8 juil. : fenêtre d'alerte de 8 jours (N1, N2). Upgrade → premier vidage : quelques minutes.
- **Trafic normal** : exécutions `execTransaction` du Safe (fréquence faible) ; le changement d'implémentation (`delegatecall` vers un contrat inconnu) est quasi unique.

### 8. Euler Finance : FACILE (mais autre nature)
- **Sources** : hash et attaquant d'après ImmuneBytes https://blog.immunebytes.com/?p=2076 [S] ; CertiK https://www.certik.com/blog/euler-finance-incident-analysis [S, cité par la recherche]. **Chaîne** : bloc 16817996 à 08:50:59 ; ImmuneBytes dit bloc 16 822 133 : **faux** [P chaîne]. L'EOA émettrice (`0x5f25…8b8c`) diffère de celle citée par ImmuneBytes (`0xb66c…95db`) : à réconcilier [ÀV].
- **Accès** : Routescan chaîne 1 (`txlistinternal`, `tokentx` sur le contrat d'attaque ; le `tokentx` filtré par `txhash` a répondu vide). Adresse du protocole Euler : non trouvée dans mes sources.
- **Nature** : exploit de logique (donateToReserves sans contrôle de liquidité), pas un détournement d'approbation. Utile pour le cas « sortie > X % du pool en une tx » plus que pour D1.
- **Trafic normal** : opérations de prêt (nombreuses), donc le test de faux positifs est exigeant : seuil sur la part du solde de jeton sortie en une tx.

### 9. UXLINK : MOYEN
- **Sources** : https://alpha.rekt.news/uxlink-rekt [P] (adresses, 11 hashes) ; https://www.theblock.co/post/371783/uxlink-multisig-hack [P] (adresse du jeton Arbitrum). Vérifié en chaîne : le `delegatecall` `0x6a761202` (execTransaction) vers `0x4457…7da5` à 14:46:35, puis vol à 14:51:35, soit **5 min** [P].
- **Accès** : Ethereum via Routescan. Le mint sur Arbitrum (hash `0x35edac40…`) demande un explorateur Arbitrum : même contrainte que Radiant. Multisig victime : adresse déduite du `to` de la tx de prise d'admin [P chaîne], **non publiée** par la source.
- **Trafic normal** : multisig de trésorerie, faible fréquence ; ligne de base facile à calculer sur 90 jours.

### 10. Infini : FACILE
- **Source** : https://www.certik.com/resources/blog/0xinfini-incident-analysis [P] (4 adresses, 6 hashes). Contrôlé : bloc 21913141, 02:15:59 ; financement Tornado 00:57:47 [P chaîne].
- **Accès** : Routescan chaîne 1 ; `tokentx` du vault `0x9a79…e1dc` (USDC). Trois tx de la fiche CertiK (`0xdb3a…`, `0xacf8…`, `0xecb3…`) sont dans le **même bloc** [P] : l'attaque tient en un bloc.
- **Signal** : première utilisation d'un rôle admin dormant (N8) ; l'auto-attribution du rôle est dans le même bloc que le drain, donc le temps de réaction est 0 s : seule une garde en amont aurait agi.
- **Trafic normal** : rachats (redeem) du vault, montants variés ; faux positif possible sur les gros rachats légitimes.

### 11. Resolv : FACILE
- **Source** : https://www.certik.com/resources/blog/resolv-protocol-incident-analysis [P] (7 adresses, 5 hashes). Contrôlé en chaîne : demande 01:50:59, mint 02:21:35, 2e demande 03:41:23, **2e mint 03:41:47** [P].
- **Correction** : l'écart entre les deux mints est de **80 min**, pas ~2 h (ancienne formule du fichier précédent) [P].
- **Accès** : Routescan chaîne 1 : `tokentx` du contrat USR (supply) et de l'attaquant ; ratio de mint 500 × la valeur déposée (100 000 USDC contre 50 M USR) [P CertiK].
- **Trafic normal** : suite des `completeSwap` des 30 jours, ratio mint/dépôt proche de 1 : faux positifs attendus très faibles. Cas idéal pour une règle de ratio.

### 12. KelpDAO rsETH : FACILE
- **Sources** : attaquant : https://www.merklescience.com/blog/hack-track-how-attackers-stole-292m-from-kelp-dao [P] (seule adresse publiée par cette page, **aucun hash**). Le hash `0x1ae232da…4222` vient du fichier précédent (préfixe) et est **complété en chaîne** par `tokentx` de l'attaquant [P chaîne] : 116 500 rsETH de `0x85d456b2…` à `0x8b1b…0d3b`, bloc 24908285, 17:35:35. Presse : https://defiprime.com/kelpdao-rseth-exploit [S].
- **Accès** : Routescan chaîne 1. Pas de rejeu côté Unichain (source) : non testé. Le signal (c) « mint sans burn côté source » exige l'explorateur de la chaîne source : **non trouvé en accès libre**.
- **Mesure** : 1 tx (100 % du lot), puis 53 000 rsETH à 17:37:23 et 30 000 à 17:37:59 (déplacements en 2 à 3 min) [P].
- **Trafic normal** : libérations `lzReceive` des 30 jours (peu nombreuses, montants variables) ; seuil sur la part de l'offre ou du solde de l'adaptateur.

---

## 4. Classement par faisabilité

| Rang | Incident | Faisabilité | Pourquoi |
|---|---|---|---|
| 1 | Bybit | **Facile** | Ethereum, hashes et adresses sûrs, soldes historiques Routescan et RPC archive gratuits, un seul wallet, 5 tx |
| 2 | Orbit | **Facile** | Ethereum, 7 hashes publiés, vault identifié, 4 jetons lisibles |
| 3 | WazirX | **Facile** | Ethereum, 15 hashes dont préparation de 8 jours (signaux N1, N2, D7) |
| 4 | Resolv | **Facile** | Ethereum, 5 hashes publiés, ratio de mint mesurable, trafic normal homogène |
| 5 | Infini | **Facile** | Ethereum, hashes complets, un bloc |
| 6 | Kelp | **Facile** | Ethereum, adresse et token sûrs ; la partie source (Unichain) manque |
| 7 | Euler | **Facile** | Ethereum, mais exploit de logique, adresse protocole manquante, deux attaquants cités |
| 8 | UXLINK | **Moyen** | Ethereum facile, mint sur Arbitrum non couvert sans clé |
| 9 | Poloniex | **Moyen** | Un wallet victime publié (Poloniex 4), les autres non ; Tron et BTC hors lot |
| 10 | Ronin | **Moyen** | Hashes sûrs, mais l'ETH passe par WETH ; le solde du contrat trompe |
| 11 | Harmony | **Moyen** | Aucun hash ni adresse du pont publiés dans les pages lues, écart d'horaire |
| 12 | Radiant | **Difficile** | Arbitrum et BNB non couverts par Routescan, Blockscout bloqué, soldes historiques indisponibles sur RPC publics |

Types de trafic normal comparable (pour les faux positifs) : (i) **hot wallet d'exchange** : Poloniex 4, modèle Bitget (beaucoup de destinataires, règle de part du solde) ; (ii) **Safe/multisig de trésorerie** : Bybit, WazirX, UXLINK, Radiant (peu de tx, D7 quasi sans faux positif) ; (iii) **vault/pont** : Orbit, Ronin, Harmony, Kelp (retraits clients ou messages cross-chain, ratio et part du solde) ; (iv) **mint/swap de stablecoin** : Resolv (ratio mint/dépôt) ; (v) **protocole de prêt** : Euler (volume très élevé, test le plus dur) ; (vi) **vault de rachat** : Infini.

## 5. Limites et à faire

- Débits Routescan : **non trouvés**. Dans mes tests : 60 requêtes sans refus ; ne pas en déduire une garantie.
- Hashes de drain WazirX, adresse du pont Harmony, Pool Provider Radiant, contrat Euler, autres hot wallets Poloniex : **non trouvés** dans les sources lues.
- Ronin (adresses) et Euler (attaquant) reposent en partie sur des résumés de moteur [S] ; les hashes eux sont contrôlés en chaîne.
- Bybit : l'adresse complète du cold wallet vient de ma connaissance préalable, confirmée par la chaîne ; je n'ai pas rouvert la page éditeur.
- Aucune ligne de base 30 jours n'a été calculée ici (hors Poloniex 4, un bloc avant/après). Prochaine étape : un script qui applique la recette §1 aux 12 victimes.
- 22 appels WebSearch/WebFetch utilisés sur 50.

## Sources web ouvertes (lecture)

- https://rekt.news/radiant-capital-rekt2 ; https://rekt.news/orbit-bridge-rekt ; https://rekt.news/wazirx-rekt ; https://rekt.news/poloniex-rekt ; https://alpha.rekt.news/uxlink-rekt
- https://www.certik.com/resources/blog/resolv-protocol-incident-analysis ; https://www.certik.com/resources/blog/0xinfini-incident-analysis ; https://www.certik.com/resources/blog/poloniex-incident-analysis ; https://www.certik.com/resources/blog/harmony-incident-analysis
- https://www.merklescience.com/blog/hack-track-analysis-of-harmonys-horizon-bridge-exploit ; https://www.merklescience.com/blog/hack-track-how-attackers-stole-292m-from-kelp-dao ; https://www.theblock.co/post/371783/uxlink-multisig-hack
- Résumés de recherche non ouverts [S] : https://blog.immunebytes.com/?p=2076 ; https://blocksec.com/blog/tracing-the-stolen-fund-of-the-ronin-bridge
- Données chaîne : https://api.routescan.io/ ; https://eth.blockscout.com/ ; https://eth.drpc.org ; https://arb1.arbitrum.io/rpc ; https://bsc-rpc.publicnode.com

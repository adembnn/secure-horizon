# K5 : cas réels rejouables en lecture seule (2024-2026)

Rédigé le 11 oct. 2026. Étiquettes : [P] primaire, [S] presse, [V] vendeur de sécurité, [C] calculé par moi sur la chaîne via RPC public (eth_getTransactionByHash, eth_getTransactionReceipt, eth_getLogs, eth_call, eth_getCode). NT = non trouvé. Aucune transaction envoyée, aucune clé. Environ 30 appels web utilisés sur 50.

## Résumé en 8 lignes
1. Objectif de 8 cas : NON atteint en pleine preuve. 6 cas ont des hashs complets vérifiés sur chaîne, 2 de plus (EIP-7702 d'août 2025) restent sans hash publié.
2. Les 11 gros cas Scam Sniffer 2025, les 78 187 $, 6,5 M$, 440 k$ et 167 k$ n'ont ni hash ni adresse dans aucune source ouverte que j'ai pu lire. Statut NT pour tous.
3. Meilleur cas : 908 551 $ USDC (2 août 2025). Approbation infinie le 30 avr. 2024, vol 458 j 16 h 37 min plus tard, 3 283 053 blocs d'écart, victime EOA, deux événements et deux hashs vérifiés [C].
4. Cas à rejeu le plus rapide : 999 999 USDT (8 juil. 2026). Approve puis vol en 48 s et 4 blocs, victime EOA [C].
5. Cas ancré sur des hashs de presse : 55 M DAI (20 août 2024), 3 hashs MetaSleuth vérifiés [C]. Ce n'est pas un Approval mais un setOwner sur un proxy de coffre Maker.
6. État historique gratuit : OUI sur Ethereum, testé par eth_call à un bloc ancien sur tenderly, drpc et blastapi (meowrpc ne supporte pas eth_call, merkle limité par taux). Base : OK sur drpc, meowrpc, blastapi, tenderly. BSC : seul blastapi a répondu, mais limite de débit (429).
7. Presque toutes les victimes étaient des EOA au moment du vol. Un compte à contrat avec règle de dépense aurait pu bloquer l'approbation ou le vol dans 5 cas sur 6.
8. Deux écarts avec la presse : AAVE (mars 2025) vol mesuré 1 708,99 AAVE le 24 mars 13:22 UTC, pas 1 999,23 AAVE à 00:35 UTC ; 55 M DAI : écart mesuré 5 h 25 puis 28 min, pas "5 h puis 20 min".

## Accès à l'état historique (test réel, 11 oct. 2026)

| RPC public | Ethereum archive | Remarque | URL |
|---|---|---|---|
| gateway.tenderly.co/public/mainnet | OUI (eth_getBalance, eth_call, eth_getLogs sur blocs 19 M à 25 M) | Le plus fiable | https://gateway.tenderly.co/public/mainnet |
| eth.drpc.org | OUI | OK en eth_call et getLogs | https://eth.drpc.org |
| eth-mainnet.public.blastapi.io | OUI | OK | https://eth-mainnet.public.blastapi.io |
| eth.meowrpc.com | OUI pour eth_getBalance, NON pour eth_call | "eth_call is not supported" | https://eth.meowrpc.com |
| eth.merkle.io | OUI pour eth_getBalance, 429 ensuite | Limite de débit | https://eth.merkle.io |
| ethereum-rpc.publicnode.com | NON | "Archive requests require a personal token" | https://ethereum-rpc.publicnode.com |
| rpc.ankr.com/eth | NON | Clé API exigée | https://rpc.ankr.com/eth |
| eth.llamarpc.com, 1rpc.io, rpc.mevblocker.io | NON | Erreur 525 ou réponse vide | |
| Base (drpc, meowrpc, blastapi, tenderly) | OUI | eth_getBalance à un bloc ancien OK | https://base.drpc.org |
| BSC | blastapi OUI (eth_getBalance bloc 0x1000000), drpc NON ("Unknown state"), binance dataseed NON ("missing trie node"), publicnode NON | blastapi renvoie 429 sur getLogs larges | https://bsc-mainnet.public.blastapi.io |
| Arbitrum | blastapi : réponse reçue, non vérifiée sur un bloc ancien ; drpc, tenderly, meowrpc NON | | |

Copier la chaîne à un bloc : un nœud local (anvil --fork-url, Hardhat) peut forker via tenderly ou drpc au bloc voulu. Les lectures de stockage lourdes seront limitées par les quotas, à surveiller. Non testé : le fork lui-même (aucun outil lancé).

## Tableau des cas

Écarts : blocs et temps mesurés par moi [C] à partir des horodatages de blocs. Hash tronqués dans le texte courant, complets dans la section "Preuves".

| # | Cas | Chaîne | Victime (type) | Pouvoir donné | Retrait | Écart | Rejeu | Sources |
|---|---|---|---|---|---|---|---|---|
| 1 | 55 M DAI, 20 août 2024 | Ethereum | 0xf2b88943...3048 (EOA, code vide) propriétaire du proxy de coffre 0x2129f8a9...83e4 | setOwner n°1 bloc 20571386 (17:40:47 UTC), setOwner n°2 bloc 20572999 (23:05:35) | Bloc 20573139 (23:33:35), 55 M DAI frappés vers 0x5d4b2a02...59d4 | 1 613 blocs et 5 h 24 min 48 s entre les deux setOwner, 140 blocs et 28 min jusqu'au vol, total 1 753 blocs et 5 h 52 min 48 s | Moyen | [V] https://metasleuth.io/blog/illicit-fund-flow-case-study-phishing ; [S] https://cryptoslate.com/crypto-trader-loses-55m-in-dai-to-phishing-attack-using-inferno-drainer-kit/ |
| 2 | AAVE 329 743 $, mars 2025 | Ethereum | 0x3e647e80...2502 (EOA) | Permit2 Permit signé et soumis le 10 fév. 2024, bloc 19194254, 00:51:47 UTC. Allowance AAVE vers Permit2 infinie héritée d'usages anciens (événements dès le bloc 18251822) | Bloc 22117035, 24 mars 2025, 13:22:35 UTC, 1 708,99 AAVE | 2 922 781 blocs, 408 j 12 h 30 min 48 s | Moyen | [S] https://www.cryptopolitan.com/victim-loses-330k-after-phishing-approval/ (hash publié = tx de la signature) ; hash du vol [C] |
| 3 | 908 551 $ USDC, août 2025 | Ethereum | 0x6c0eb6ef...d8af (EOA) | approve USDC infini vers 0xa70e5d4d...825c, bloc 19768078, 30 avr. 2024, 12:19:11 UTC | Bloc 23051131, 2 août 2025, 04:56:59 UTC, 908 551,976006 USDC vers 0x67e5ae3e...6ef | 3 283 053 blocs, 458 j 16 h 37 min 48 s | Facile | [S] https://cointelegraph.com/news/crypto-victim-loses-908k-in-sophisticated-phishing-attack ; [S] https://coinfomania.com/ja/908k-stolen-in-phishing-tied-to-458-day-old-wallet-approval/ ; hashs [C] |
| 4 | 12 083 spWETH (32,4 M$), 28 sept. 2024 | Ethereum | 0xaa158208...ee57 (EOA) | Approval émis dans la même transaction (signature hors chaîne, non datée) | Bloc 20847274, 06:15:23 UTC, appelant 0x0000db5c...0000 | 0 bloc (même tx) | Moyen | [S] https://www.theblock.co/post/318574/crypto-whale-loses-over-32-million-in-apparent-phishing-attack ; reste [C] |
| 5 | 999 999 USDT, juil. 2026 | Ethereum | 0x8c949361...0f89 (EOA) | approve USDT infini vers 0x1178a87d...0502, bloc 25489459, 8 juil. 2026, 17:51:47 UTC | Bloc 25489463, 17:52:35 UTC, 159 999,87 + 639 999,50 USDT ; 200 000 USDT déjà pris au bloc 25489460 | 4 blocs, 48 s | Facile | [S] https://www.cryptotimes.io/2026/07/09/crypto-user-loses-999999-in-usdt-to-a-single-phishing-signature/ ; [S] https://cointelegraph.com/news/trader-loses-1m-after-signing-phishing-token-approval ; approve [C] |
| 6 | 1 576 ETH d'Aave (aWETH), 21 janv. 2024 | Ethereum | 0x1749ad95...3487 (EOA au bloc 19058424, code vide). Aujourd'hui code 0xef0100... (délégation EIP-7702) | Approval vers 0x22653979...e0a1 (spender create2) dans la tx du 1er vol | Bloc 19058425, 21 janv. 2024 23:26:35 UTC : 1 419,05 + 157,67 aWETH. Second vol bloc 19061649, 22 janv. 10:21:11 : 95,19 aWETH | 3 224 blocs et 10 h 54 min 36 s entre 1er et 2e vol, allowance max restée active | Moyen | [P] https://drops.scamsniffer.io/why-revoking-approvals-is-crucial-after-falling-victim-to-phishing/ (spender et drainer cités, pas de hash) ; hashs [C], victime déduite d'un lien revoke.cash non étiqueté |

### Cas sans hash : statut NT, rejeu impossible en l'état

| Cas | Ce qui est publié | Manque | Source |
|---|---|---|---|
| 78 187 $, sept. 2025, 623 j | Montant, délai, mois | Tout le reste | [S] relais PANews du 28 sept. 2025, vu par résumé de recherche seulement |
| EIP-7702 1,54 M$, 24 août 2025 (wstETH, cbBTC, NFT) | Montant, date, type | Victime, hash, délégué | [P] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ ; [S] https://u.today/crypto-investor-loses-154-million-in-devastating-phishing-scam |
| EIP-7702 1,0 M$, août 2025 | Montant, mois, "batch déguisé en swap Uniswap" | Tout le reste | même rapport Scam Sniffer |
| 6,5 M$ Permit, 18 sept. 2025 | Montant, jour, jetons (stETH, aEthWBTC) | Tout | https://cointelegraph.com/commissioned/inside-the-6-5m-wallet-drain-how-users-can-dodge-growing-permit-signature-traps (sponsorisé, faible) |
| 440 358 $ USDC Permit, 8 déc. 2025 | Montant, date | Tout | [S] https://decrypt.co/351651/what-a-440000-hack-shows-about-the-rising-threat-of-ethereum-permit-scams |
| 167 342 $ LINK Permit2, 18 août 2025 | Montant, date d'autorisation | Tout | [S] https://phemex.com/news/article/ethereum-user-loses-167k-in-link-tokens-to-permit2-phishing-attack-98718 |
| 11 cas Scam Sniffer 2025 | Montant, mois, type, actif | Aucune adresse ni hash dans le rapport | [P] rapport Scam Sniffer 2025 ci-dessus |
| BSCex / LaunchZone, mars 2023 (hors période) | 4 contrats SwapX, victime "autorisée 700 jours plus tôt" | Hash de vol. Recherche on-chain sur BSC bloquée par un 429 | [P] https://drops.scamsniffer.io/vulnerability-in-the-early-bscex-swapx-contract-of-launchzone/ |
| UXLINK, 23 sept. 2025, Arbitrum | Hash d'un increaseAllowance 0xa70674cc...86ee (02:15 UTC) | La victime est l'attaquant de la faille UXLINK, pas un particulier. Non vérifié sur chaîne | [S] https://alpha.rekt.news/uxlink-rekt |

## Preuves (hashs complets, tous relus sur chaîne)

Cas 1, 55 M DAI [V]/[C]
- setOwner n°1 : 0xb721c8d603d5cbac826d804b04fb4662952afe91af15cf2aa603d002d3410b87 (bloc 20571386, appel du propriétaire 0xf2b889437f243396b29e829908b5d8ebe2e13048 vers le proxy 0x2129f8a9b6c3092a600da82ce859b7a9a69983e4, sélecteur 0x13af4035, nouveau propriétaire 0x0000db5c8b030ae20308ac975898e09741e70000)
- setOwner n°2 : 0x28054acca764c58157e1e5779e5e6d1c9c858a7508b189655d370a82e2a0e07b (bloc 20572999, par 0x0000db5c..., nouveau propriétaire 0x5d4b2a02c59197eb2cae95a6df9fe27af60459d4)
- Vol : 0xf70042bf3ae7c22f0680f8afa078c38989ed475dfbe5c8d8f30a50d4d2f45dc4 (bloc 20573139, événement Transfer DAI de 0x2de2fedc1da838eba48000 unités, soit 55 000 000 DAI, vers 0x5d4b...)
- Solde ETH du proxy au bloc 20571385 : 0 (état lu à l'archive). Je n'ai pas lu le solde DAI du coffre avant vol.
- Attribution des hashs à "premier" et "second" setOwner : lue sur chaîne, corrige l'inférence de K1. Le hash 0xb721c8d6... est bien le premier changement (17:40:47), 0x28054acc... le second (23:05:35).

Cas 2, AAVE [S]/[C]
- Permit2 Permit (signature soumise) : 0x8126981ca3f780682666c3f573fdd1357603b2c6bad49d68ee1465736793e623 (bloc 19194254, 10 fév. 2024 00:51:47 UTC, envoyé par 0x0000e53a54a68e047b73cffdea45f44368a60000 vers 0x67beb4dd770a9c2cbc7133ba428b9eecdcf09186 ; événement Permit2 pour le propriétaire 0x3e647e803457f812b648c5a4ee83166f05e32502, jeton AAVE 0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9, dépensier 0xd1ddd917a63c96f4a79089cc8c452a19d4060395). Cette tx a aussi retiré 1,97 + 0,34 AAVE.
- Vol : 0xfbbf226b4a596e4859d303d5548209608d2638db0382553eb64e4f012e8d1a42 (bloc 22117035, 24 mars 2025 13:22:35 UTC, mêmes appelant et contrat, deux Transfer AAVE de 1 452,64 et 256,35 vers 0x0cad61aae9c861f52fd55b0fcb06bbc73910b023, total 1 708,99 AAVE, soit tout le solde de la victime au bloc 22117034)
- Écarts avec la presse : montant 1 999,23 AAVE et heure 00:35 UTC non retrouvés. Un second vol le même jour : aucun autre Transfer AAVE de la victime entre 22105835 et 22134635. À éclaircir avant publication.

Cas 3, USDC [S]/[C]
- Approve : 0x6760936b681d81061f8bf9114b227d1e5573fba8f1cd04fde02e920c2c3ffbed (bloc 19768078, 30 avr. 2024 12:19:11 UTC, tx émise par 0x63605e53d422c4f1ac0e01390ac59aaf84c44a51 vers 0x5d775caa7a0a56cd2d56a480b0f92e3900fe9722, événement Approval USDC propriétaire 0x6c0eb6ef6409d7c7af129ae9d1b5e3e9ffb8d8af, dépensier 0xa70e5d4dc24dbaa3277bf8de4c760b8b3701825c, valeur 2^256-1). Attention : cette tx a aussi déplacé tout de suite 67 566 + 270 266 USDC (0xfbb467f21 et 0x3eed19fc83 unités).
- Vol : 0xcd14f4bee780f4c2c47bdcf40761add6312786f071395ca881161252f8e40792 (bloc 23051131, 2 août 2025 04:56:59 UTC, même appelant, 908 551,976006 USDC vers 0x67e5ae3e1ad16d4c020db518f2a9943d4f73d6ef)
- Hash des sorties : 0x815959ec9107e3bed76a735894f525ff4944ae94b2855c5ca1385358c07a8707 (bloc 23051134, vers 0x6e4141d3...0ec4 puis 0x37305b1c...7fd057).
- Solde USDC de la victime : 337 832,34 au bloc 19768077, 908 551,98 au bloc 23051130 (eth_call identique sur tenderly, drpc, blastapi).
- Remarque : USDC n'émet pas d'Approval sur transferFrom. Le vol n'a donc pas d'événement Approval propre, c'est l'événement Transfer qui le prouve.

Cas 4, spWETH [S]/[C]
- Vol : 0xf7c00f18175cdea49f8fdad6a1d45edeb318f18f3009f51ab9f4675171c1d8fb (bloc 20847274, 28 sept. 2024 06:15:23 UTC, appelant 0x0000db5c8b030ae20308ac975898e09741e70000, contrat 0xed0e416e0feea5b484ba5c95d375545ac2b60572). Victime lue dans les logs : 0xaa1582084c4f588ef9be86f5ea1a919f86a3ee57, jeton spWETH 0x59cd1c87501baa753d0b5b5ab5d8416a45cd71db, dépensier 0x33fff906795804fb77b0b11dffcf275cae08016c.
- Message de la victime : 0xcf935aa187f01afb4a125fe0310140bf7e1954bc6f3702b3be20292a276ae2dc (bloc 20847838, 08:08:23 UTC, offre de 20 % de récompense, selon The Block).
- Aucun Approval victime vers ce dépensier avant le vol (recherche de 19 000 000 à 20 847 273). Donc signature hors chaîne, utilisée dans la même tx. L'heure de la signature est inconnue.
- Solde spWETH de la victime : 0x513e... avant, 0x281c... après (eth_call blocs 20847273 et 20847274).

Cas 5, USDT [S]/[C]
- Approve : 0x295549f3dabb8c02ed1910386bee51b6bcc6f2074887dba43d54806320b4bde2 (bloc 25489459, 8 juil. 2026 17:51:47 UTC, la victime 0x8c949361b49320c48a51f4b1c6f9f83862530f89 appelle approve (0x095ea7b3) sur USDT, dépensier 0x1178a87db6dc5c010e39a325af1f73bec6470502, valeur 2^256-1)
- Premier vol : 0x19ddd4f515f71da24859992496c9b1424bb26a6a9d02075f76b7eb258270f37c (bloc 25489460, 200 000 USDT)
- Vol principal : 0x6e882fd802e96c51521869e9f433fec00aac5403d39356820d14e8a3f2e6ffb9 (bloc 25489463, 17:52:35 UTC, appelant 0x6d8c070338ec3d297f1d0eceea296bd7e13a32b9, 159 999,873783 USDT vers 0xf84c6257... et 639 999,495132 USDT vers 0xc508a8c0...)
- Tentative d'1 M$ qui a échoué : 0x21aaa9d9295d289d8e4dca7433112f151e157dc1022f4b3687a87948df1d8fe9 (bloc 25489459, seul un Transfer de 0,631085 USDT apparaît dans mes logs, à confirmer). Solde USDT de la victime avant : 999 999,368915 au bloc 25489459.
- Date selon la presse : 9 juil. 2026. Date sur chaîne : 8 juil. 2026 17:51 à 17:52 UTC (la presse date de l'alerte).

Cas 6, Aave aWETH [P]/[C]
- Premier vol : 0x93a0ce0711edaf7664c26b3654095f1052010bb7da62c135b6ef0c425c0c2f09 (bloc 19058425, 21 janv. 2024 23:26:35 UTC, appelant 0x0000db5c8b030ae20308ac975898e09741e70000, contrat 0xed0e416e0feea5b484ba5c95d375545ac2b60572, aWETH 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8, 1 419,05 vers 0x0000372b2bc916d6c904495e53533ae90740f688 et 157,67 vers 0xf672775e124e66f8cc3fb584ed739120d32bbaad, total 1 576,72, donc cohérent avec "1576 ETH")
- Second vol : 0x10b37999fc17d4d06f26073eb174cacabaa515d01f90d67bd0d47bd0aba2fdb0 (bloc 19061649, 22 janv. 2024 10:21:11 UTC, 95,19 aWETH, appelant 0x0000db5c...)
- Autres vols de résidus : 0x2925da51ffeb81b31eec2a8bc3bbdbdfe73261eec24a37ea069058af3955513e, 0x5fb3ca1d84ef0c4f17843aae043a9844f0fa952e41ff1bbe09996f40629bcceb, 0x8f196a29e3d88c28c6114f3f365587b6e71f7b4c4dcde528fc8b9b359a5c7faa, 0x3e67cd35859ba0be9e9ae4b5079eab3e7597cfdc3927b67d7d94b2a699cbc936 et d'autres.
- Révocation tardive par la victime : Approval à 0 au bloc 19066610 (0x9bd87785f78eeaa72ef7f24dbc0ba3b365689387e1461cf3738cbb1f44ae84b5).
- Lien victime / cas publié : Scam Sniffer cite le spender 0x226539793536bcee7f8992d0ff67bb37905be0a1 et un lien revoke.cash vers 0x1749ad951fb612b42dc105944da86c362a783487 sans l'appeler "victime". Mes logs montrent bien un Approval 0x1749... vers 0x2265... et 1 576,72 aWETH retirés, ce qui concorde. Reste une inférence.

## Faisabilité du rejeu par cas

Définition : "facile" = hashs complets, Approval ou approve et vol dans des tx distinctes, victime EOA, état lisible à tout bloc sur au moins 3 RPC gratuits. "Moyen" = une des conditions manque ou demande du travail (signature hors chaîne, appel interne à décoder, hashs retrouvés par moi, mécanisme hors Approval). "Difficile" = hash ou victime absent.

| Cas | Classe | Raison |
|---|---|---|
| 3 : 908 551 $ USDC | Facile | Deux tx distinctes, 458 j d'écart, EOA, état OK sur 3 RPC |
| 5 : 999 999 USDT | Facile | Approve puis vol en 4 blocs, EOA, état récent OK. Un fork 4 blocs avant suffit |
| 1 : 55 M DAI | Moyen | Trois hashs publiés, mais mécanisme setOwner sur un DSProxy, pas d'Approval. Interaction avec Maker (cdp) à reproduire |
| 2 : AAVE | Moyen | Permit2 : la signature et la soumission sont deux étapes, le hash publié est celui de la soumission. Montants de presse non retrouvés |
| 4 : spWETH | Moyen | Même tx, signature hors chaîne, donc l'écart n'est pas mesurable. Utile pour tester un blocage à la signature |
| 6 : Aave aWETH | Moyen | Hashs trouvés par moi, victime déduite. Mais beau cas "allowance qui reste après le premier vol, nouveaux vols 11 h après" |
| 78 k$, 7702 x2, 6,5 M$, 440 k$, 167 k$, 11 cas Scam Sniffer | Difficile | Aucun hash ni adresse publié |

## Victime EOA ou compte à contrat, et ce qu'un compte protégé changeait

Lu avec eth_getCode : les 6 victimes étaient des EOA (code "0x") au moment du vol. Le cas 6 porte aujourd'hui du code "0xef0100..." (délégation EIP-7702 vers 0x6eb8e2b966ef61b35c18cb46f246fe25f1328818), absent au bloc 19058424. La délégation est postérieure au vol, son origine n'est pas établie.

Effet d'un compte protégé (contrat ou 7702 avec règles) [raisonnement, pas un fait mesuré] :
- Cas 3 et 5 : une règle "plafond ou liste blanche de dépensiers pour approve" aurait bloqué l'étape approve (cas 5 : 48 s avant le vol) ou, avec délai d'attente, laissé 458 jours pour révoquer (cas 3).
- Cas 2 et 4 : la signature est hors chaîne et le vol part du contrat Permit ou du jeton. Une protection au niveau compte ne voit rien à la signature, sauf si le compte refuse la validation de signature EIP-1271 ou si le portefeuille bloque les Permit. Un compte EOA ne peut pas bloquer un transferFrom déjà autorisé.
- Cas 1 : setOwner sur un proxy. Un compte protégé contrôlant le propriétaire du proxy aurait pu mettre un délai sur setOwner (5 h 24 de plage observée entre les deux appels).
- Cas 6 : l'allowance max a permis 11 vols en 3 jours. Un plafond par période aurait limité la perte au premier plafond.

## Recommandation : meilleur cas héros

Cas 3 (908 551 $ USDC, victime 0x6c0eb6ef6409d7c7af129ae9d1b5e3e9ffb8d8af).
- Pourquoi : approve et vol bien séparés (bloc 19768078 puis 23051131, 458 j 16 h 37 min), deux hashs complets, victime EOA, la presse (Scam Sniffer, Cointelegraph) confirme montant et date, et eth_call à n'importe quel bloc sur tenderly, drpc et blastapi renvoie 337 832 USDC au bloc de l'approbation et 908 551,98 USDC avant le vol.
- Rejeu en lecture seule : fork à 23051130, exécuter l'appel du vol (selector 0x21ea0c37 vers 0x5d775caa...) pour la version sans protection. Fork à 19768077 pour montrer le compte protégé qui refuse l'approve infini.
- Limite : la tx d'approbation a aussi déplacé 338 k USDC immédiatement (victime déjà touchée au jour 0). Le "dormant" est donc la partie restante, pas la totalité.

Second choix : cas 5 (999 999 USDT), rejeu le plus court (4 blocs) mais un seul relais de presse indépendant et un vol réparti sur 3 txs.

Cas à ne pas choisir : 55 M DAI comme "héros d'approbation" car le mécanisme est setOwner, pas Approval. Excellent en second cas ("on peut aussi voler sans approbation ERC-20").

## Limites

- Le mapping adresses vers entités (par exemple "Inferno Drainer", "Pink Drainer") vient de la presse. Je n'ai pas vérifié les labels sur Arkham ou Etherscan.
- Les sélecteurs de fonction (0x21ea0c37, 0xcebc2af4, 0xcaa5c23f) n'ont pas été décodés par ABI.
- Aucun fork réel n'a été lancé. La faisabilité repose sur des lectures eth_call / eth_getLogs à des blocs anciens.
- Le trou K1 "calculer soi-même l'écart Approval vers transferFrom" est comblé pour 4 cas à écart mesurable (1, 2, 3, 5) et 1 à écart de 10 h 54 min entre vols (6).

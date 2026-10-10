# K1 : délai entre l'approbation de la victime et le retrait du drainer, 2024-2026

Rédigé le 10 oct. 2026. Étiquettes : [P] primaire (éditeur ou auteur), [S] presse, [V] vendeur de sécurité. NT = non trouvé. Budget de 45 appels web atteint. Les pertes globales sont dans W1 (non refaites ici).

## Résumé en 8 lignes
1. Objectif de 15 cas avec délai chiffré : NON atteint. Seulement 6 cas ont un délai mesurable ou déductible (n = 6). Aucune série publiée n'existe, à ma connaissance, pour ce délai.
2. Les rapports Scam Sniffer 2024 et 2025 [P] listent les gros cas (30 en 2024, 11 en 2025) avec type de signature et mois, mais sans heure de signature ni de retrait, et sans hash.
3. Seul cas à heures chiffrées : 55 M DAI, 20 août 2024, environ 5 h 20 entre la signature de la victime et le vol (MetaSleuth [V], avec 3 hashes).
4. Trois cas à délai en jours : 408 jours (AAVE, mars 2025), 458 jours (908 k$, août 2025), 623 jours (78 k$, sept. 2025). Tous issus de Scam Sniffer, relayés par la presse.
5. Deux cas EIP-7702 (août 2025, 1,54 M$ et 1,0 M$) : la signature et l'exécution du lot sont dans la même transaction par construction. Délai nul, déduit du mécanisme décrit, pas d'un hash publié.
6. Les récits "en quelques secondes" ou "en quelques minutes" existent (6,5 M$ Permit, sept. 2025 ; 999 999 USDT, juil. 2026) mais sans horodatage signature puis retrait. Ils ne sont pas comptés dans la distribution.
7. Biais fort : les délais longs sont publiés parce qu'ils sont remarquables. Les vols immédiats ne sont presque jamais horodatés. La distribution ci-dessous ne représente PAS le marché.
8. Trou à combler : calculer soi-même, sur Ethereum, l'écart entre l'événement Approval ou le Permit et le premier transferFrom du dépensier, par exemple sur les contrats de partage des gains du papier IMC 2025 (BlockSec) ou sur les 11 cas Scam Sniffer 2025.

## Tableau des cas

Définition du délai : temps entre la transaction ou la signature qui donne le pouvoir de dépenser (ou de changer le propriétaire) et le premier retrait par l'attaquant. Pour un Permit hors chaîne, la signature n'a pas de bloc : le délai est mesuré jusqu'à la transaction de retrait.

| # | Date du vol | Type de signature | Montant | Délai chiffré | Classe | Hash publié | Source |
|---|---|---|---|---|---|---|---|
| 1 | 20 août 2024 | Transaction qui change le propriétaire du coffre Maker (setOwner), kit Inferno Drainer selon la presse | ~55 M DAI | ~5 h pour le 2e changement de propriétaire, puis ~20 min pour le retrait, soit ~5 h 20. Heures exactes NT (la page ne donne que la date) | Heures | Signature victime 0xb721c8d6...410b87 ; changement de propriétaire 0x28054acc...a2e07b ; vol 0xf70042bf...4d45dc4 (l'attribution des deux premiers hashs est mon inférence) | [V] https://metasleuth.io/blog/illicit-fund-flow-case-study-phishing ; [S] https://cryptoslate.com/crypto-trader-loses-55m-in-dai-to-phishing-attack-using-inferno-drainer-kit/ |
| 2 | 24 mars 2025 | Approbation ERC-20 (AAVE) | 329 743 $ (1 999,23 AAVE) | 408 jours : approbation le 10 fév. 2024 à 00:51 UTC, vol le 24 mars 2025 à 00:35 UTC | Jours | 0x8126981c...93e623 (peut être l'approbation, pas le vol) | [S] https://www.cryptopolitan.com/victim-loses-330k-after-phishing-approval/ (relais de Scam Sniffer) |
| 3 | 2 août 2025 | Approbation (USDC), attribuée à Pink Drainer par la presse | 908 551 $ | 458 jours selon Scam Sniffer. Un relais donne approbation le 30 avril 2024 et vol le 2 août 2025, soit 459 jours en calcul simple. Écart d'un jour non expliqué | Jours | NT | [S] https://coinfomania.com/ja/908k-stolen-in-phishing-tied-to-458-day-old-wallet-approval/ ; [S] https://www.cryptopolitan.com/crypto-phishing-scam-wipes-out-3m/ |
| 4 | Sept. 2025 | Autorisation de phishing (type NT) | 78 187 $ | 623 jours | Jours | NT | [S] relais PANews de Scam Sniffer, vu via résumé de recherche, page non ouverte |
| 5 | 24 août 2025 | EIP-7702, lot signé (transferts et approbations de NFT) | ~1,54 M$ | Même transaction (délai nul), déduit du mécanisme : "signé une fois, tout le lot exécuté de façon atomique" | Même bloc | NT | [P] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ (type et mois) ; [S] https://u.today/crypto-investor-loses-154-million-in-devastating-phishing-scam |
| 6 | Août 2025 | EIP-7702, lot signé | ~1,0 M$ | Même transaction, même raisonnement | Même bloc | NT | [P] même rapport Scam Sniffer 2025 |

### Cas à signature identifiée mais délai non chiffré (exclus de la distribution)

| Date | Type | Montant | Ce que dit la source | Source |
|---|---|---|---|---|
| 22 janv. 2024 | Approbation, 1 576 ETH (Aave) | ~4 M$ | Vol "environ 12 heures" avant l'analyse. Date de l'approbation NT. Le dépensier (create2) a ensuite sorti 95 ETH, puis 158 ETH par liquidation | [P] https://drops.scamsniffer.io/why-revoking-approvals-is-crucial-after-falling-victim-to-phishing/ |
| 28 sept. 2024 | "Permit" (Scam Sniffer), Inferno Drainer (Arkham) | 12 083 spWETH, ~32,4 M$ | Signature vers 06:15 UTC (relais). Heure du retrait NT. "43 min" est l'âge du tweet, pas un délai | [S] https://www.theblock.co/post/318574/crypto-whale-loses-over-32-million-in-apparent-phishing-attack (hash malveillant 0xf7c00f18...c1d8fb) ; https://beincrypto.com/32-million-crypto-wallet-phishing-scam/ |
| 18 sept. 2025 | Permit | 6,5 M$ (stETH, aEthWBTC) | "En quelques minutes" selon un texte commandité (Web3 Antivirus). Aucun horodatage | [S] https://cointelegraph.com/commissioned/inside-the-6-5m-wallet-drain-how-users-can-dodge-growing-permit-signature-traps (faible : contenu sponsorisé) |
| 23 sept. 2025 | increaseAllowance (UXLINK) | ~542 M jetons, 43 à 50 M$ | Approbation à 02:15 UTC, hash 0xa70674cc...1986ee (Arbiscan). Heure du retrait NT | [S] https://alpha.rekt.news/uxlink-rekt |
| 9 juil. 2026 | Approbation de jeton (type NT) | 999 999 USDT | 36 secondes entre une tentative ratée d'1 M$ et le retrait exact du solde. Délai depuis la signature NT. Hash du retrait réussi 0x6e882fd8...e6ffb9 | [S] https://www.cryptotimes.io/2026/07/09/crypto-user-loses-999999-in-usdt-to-a-single-phishing-signature/ (relais de Scam Sniffer ; un moteur de recherche signale un site relais douteux, à vérifier sur Etherscan) |
| 18 août 2025 | Approbation Permit2 (LINK) | 167 342 $ | Date d'autorisation donnée. Retrait NT | [S] https://phemex.com/news/article/ethereum-user-loses-167k-in-link-tokens-to-permit2-phishing-attack-98718 |
| 8 déc. 2025 | Permit (USDC) | 440 358 $ | Délai NT | [S] https://decrypt.co/351651/what-a-440000-hack-shows-about-the-rising-threat-of-ethereum-permit-scams |

### Hors période, cités pour mémoire
Sept. 2023 (24,23 M$ stETH et rETH) : deux transactions seulement, mais hors 2024 à 2026 et mécanisme contesté (Permit ou increaseAllowance). Non compté. https://cryptoslate.com/crypto-whale-loses-over-24m-staked-ethereum-to-phishing-as-verified-x-scams-surge/

## Distribution

Définition des classes, sur le délai signature (ou transaction d'autorisation) vers premier retrait : même bloc ou même transaction ; moins d'une minute ; minutes (1 à 59) ; heures (1 à 23) ; jours (24 h et plus).

n = 6 (cas du tableau principal, 2024 à 2026, délai chiffré ou déduit du mécanisme).

| Classe | Cas | Part (sur n = 6) |
|---|---|---|
| Même bloc ou même transaction | 2 (#5, #6, déduits d'EIP-7702) | 33 % |
| Moins d'une minute | 0 | 0 % |
| Minutes | 0 | 0 % |
| Heures | 1 (#1, ~5 h 20) | 17 % |
| Jours (408, 458, 623 jours, soit 1 à 2 ans) | 3 (#2, #3, #4) | 50 % |

Lecture et limites :
- n = 6 est trop petit pour toute statistique. Les parts sont indicatives, pas des fréquences.
- Biais de sélection : Scam Sniffer et la presse publient les délais quand ils sont spectaculaires (plus d'un an). Les vols immédiats, majoritaires selon des textes de vendeurs ("secondes", "minutes"), n'ont presque jamais d'horodatage publié.
- Trois cas sur six sont des délais de plus d'un an : cela prouve qu'une approbation oubliée reste exploitable, pas que c'est le cas typique.
- Les cas EIP-7702 ont un délai nul par conception, mais aucun hash n'a été publié dans les sources lues.
- Affirmations de vendeurs non chiffrées, à ne pas citer comme des mesures : "les drains se font en secondes" (phishdestroy.io), "minutes à semaines" (Zealynx). Twinstake, cité par Decrypt, décrit deux stratégies : tout prendre tout de suite, ou prendre un Permit à échéance lointaine et vider au fil des dépôts.

## Ce qui n'a pas été trouvé
- Cyvers, Beosin, Chainalysis, Check Point, Group-IB, Rekt (hors UXLINK), Wintermute : aucun cas avec un délai signature puis retrait. Check Point sur Inferno Drainer décrit des contrats à usage unique mais ne chiffre pas le délai (lu via résumés de presse).
- Papier arXiv 2512.12174 (EIP-7702) : PDF illisible, version HTML lue à 100 000 caractères sur 123 528. Expériences simulées uniquement dans la partie lue, aucun délai réel. L'annexe B (pertes réelles) n'a pas été lue.
- Papier IMC 2025 sur le drainer-as-a-service (135 M$, 76 582 victimes) : lien https://assets.blocksec.com/pdf/1761189308551-2.pdf non ouvert faute de budget. Le résumé BlockSec ne mentionne aucun délai.
- Monkey Drainer, Angel Drainer, Pink Drainer : aucun cas horodaté en 2024 à 2026 trouvé. Les cas 3 est attribué à Pink Drainer par la presse seulement.
- Sources en 403 non lues : SlowMist "Past Permissions, Present Problems", beincrypto 999 999 USDT, cryptoslate 6 M$ et 50 M$ Inferno.
- Le cas WLFI/EIP-7702 (31 août 2025, via clé privée compromise) est un balayage de dépôts après délégation, sans horodatage publié. Cointelegraph : https://cointelegraph.com/news/wlfi-token-holders-falling-prey-classic-wallet-exploit

## Méthode recommandée pour combler le trou
1. Prendre les 11 cas de plus d'1 M$ du rapport Scam Sniffer 2025 et chercher leurs hashs dans les tweets @realScamSniffer.
2. Pour chaque cas, relever sur Etherscan l'horodatage de l'approbation (ou du Permit exécuté) et du premier transferFrom du dépensier.
3. Pour les Permit, le délai se lit dans le bloc de la transaction qui appelle permit(), car la signature n'a pas de bloc.
4. Publier une table avec n d'au moins 30 pour une vraie distribution.

# K2 : répartition des mécanismes de signature utilisés par les drainers, 2024 à 2026

Rédigé le 10 oct. 2026. Étiquettes : [P] primaire (l'éditeur lui-même), [S] presse, [V] vendeur de sécurité relayé. NT = non trouvé. Les chiffres de chaque éditeur ont un périmètre propre. Ne pas les additionner. Contexte global déjà traité dans W1 (non refait).

## Résumé en 8 lignes
1. Il n'existe aucune répartition publique par mécanisme sur 100 % des pertes. Scam Sniffer [P] ne publie la répartition que pour les gros cas (plus de 1 M$).
2. 2024, 30 gros cas, 171 M$ : Permit 56,7 %, setOwner 31,9 %, transfert 4,5 %, increaseAllowance 3,5 %, autres 3,4 %.
3. 2025, 11 gros cas, 22,98 M$ : Permit/Permit2 38 %, approve/increaseApproval 24,5 %, transfert 21 %, EIP-7702 11 %, setApprovalForAll 5 %.
4. Ces gros cas pèsent 171 M$ sur 494 M$ en 2024 (35 %) et 22,98 M$ sur 83,85 M$ en 2025 (27 %). Le reste (65 à 73 %) n'est pas ventilé par type.
5. Part des victimes par mécanisme : non trouvée chez aucun éditeur. Perte médiane par mécanisme : non trouvée. Moyennes par mécanisme : seulement sur les gros cas (calculées par moi).
6. Permit reste le mécanisme dominant cité par Scam Sniffer de 2024 à fin 2025 (cas de 6,5 M$ en sept. 2025, 3,02 M$ et 1,08 M$ en janv. 2026).
7. Au moins 38 % (2025) à 56,7 % (2024) des pertes des gros cas passent par une signature de message hors chaîne (Permit/Permit2). Un compte intelligent qui ne filtre que les transactions ne les voit pas.
8. Seaport, Blur, setApprovalForAll NFT : presque aucun chiffre. Un seul cas setApprovalForAll en 2025 (1,23 M$). Aucun chiffre Seaport ou Blur trouvé sur 2024 à 2026.

## Tableau par mécanisme

Base A = Scam Sniffer [P], gros cas 2024 (30 cas, 171 M$). Base B = Scam Sniffer [P], gros cas 2025 (11 cas, 22,98 M$). Les parts "du total annuel" sont mes calculs : part du gros cas multipliée par le total, sur 494 M$ (2024) et 83,85 M$ (2025). Ce sont des planchers, pas des parts réelles.

| Mécanisme | Part des pertes, gros cas 2024 (base A) | Part des pertes, gros cas 2025 (base B) | Part du total annuel, plancher (mon calcul) | Part des victimes | Perte moyenne ou médiane | Hors chaîne ? | Évolution 2024 à 2026 | Source |
|---|---|---|---|---|---|---|---|---|
| approve classique | NT (compris dans "autres" 3,4 %) | approve + increaseApproval : 3 cas, 5,62 M$, 24,5 % | 2025 : 6,7 % | NT | Gros cas 2025 : 1,87 M$ par cas (calculé). Médiane NT | Non, transaction | Visible en 2025 (avr., mai, juil.) | https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ |
| increaseAllowance | 3,5 % (~6,0 M$) | Fusionné avec approve (cas de 3,13 M$ en mai 2025, libellé increaseApproval) | 2024 : 1,2 %. 2025 : inclus ci-dessus | NT | NT. Janv. 2026 : 3,02 M$ combiné Permit + increaseAllowance (1 cas) [S Decrypt] | Non, transaction | Stable à faible. 2023 : 24,05 M$ pour 1 victime (top 13) | https://drops.scamsniffer.io/scam-sniffer-2024-web3-phishing-attacks-wallet-drainers-drain-494-million/ ; https://decrypt.co/357450/signature-phishing-up-200-as-january-losses-pass-6m |
| Permit EIP-2612 | 56,7 % (~97 M$) | Fusionné avec Permit2 : 38 % | 2024 : 19,6 % (97/494). 2025 : 10,4 % | NT | Gros cas 2025 : 2,91 M$ par cas, médiane 1,22 M$ (calculées sur 3 cas). Nov. 2025 : plus gros Permit 1,22 M$ ; cas à 440 358 $ [S] | Oui, message signé hors chaîne | Dominant des deux années. Janv. 2026 : cas à 3,02 M$ et 1,08 M$ | idem + https://decrypt.co/351651/what-a-440000-hack-shows-about-the-rising-threat-of-ethereum-permit-scams |
| Permit2 (Uniswap) | NT séparément. Mai 2024 : 300+ victimes, ~690 k$ [S, source Scam Sniffer] | Fusionné avec Permit : 38 % (3 cas : sept., nov., janv.) | NT séparé | Mai 2024 : 300+ victimes | ~2 300 $ par victime (690 k$ / 300, mon calcul, ordre de grandeur) | Oui, message signé hors chaîne | Pas de série. 2023 : 1 des 13 pires cas (1,28 M$) | https://academy.zealynx.io/blog/permit2-signature-phishing (relais, non vérifié) ; https://drops.scamsniffer.io/scam-sniffer-2023-crypto-phishing-scams-drain-300-million-from-320000-users/ |
| setApprovalForAll (NFT) | NT | 1 cas, 1,23 M$, 5,4 % | 2025 : 1,5 % | NT | 1,23 M$ (1 cas) | Non, transaction | Faible en gros cas. Aucune série NFT trouvée | https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ |
| Transfert direct signé par la victime | 4,5 % (~7,7 M$) | 2 cas, 4,87 M$, 21,2 % (mars, août) | 2024 : 1,6 %. 2025 : 5,8 % | NT | 2025 : 2,44 M$ par cas (calculé, 2 cas) | Non, transaction | Part en hausse dans les gros cas, base de 2 cas seulement | idem |
| setOwner (DSProxy, propriété d'un proxy) | 31,9 % (~55 M$), un seul cas de 55,48 M$ en août 2024 | 0 | 2024 : 11,1 % | 1 victime | 55,48 M$ | Ambigu : Scam Sniffer parle d'une signature, un relais parle d'un message. NT sur le canal exact | Cas unique, non répété | https://drops.scamsniffer.io/scam-sniffer-2024-web3-phishing-attacks-wallet-drainers-drain-494-million/ ; https://academy.zealynx.io/blog/permit2-signature-phishing |
| Délégation EIP-7702 | n/a (avant mai 2025) | 2 cas, 2,54 M$, 11,1 % (août) | 2025 : 3,0 % | NT | 1,27 M$ par cas (calculé, 2 cas). Wintermute [V] : plus de 97 % des délégations (30 mai 2025) pointaient vers un même code sweeper "CrimeEnjoyor", puis 94,7 % [S] | Mixte : autorisation signée, portée par une transaction de type 4 | Apparu en 2025. 2026 : NT | https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ ; https://cointelegraph.com/news/wintermute-crimeenjoyor-flags-malicious-ethereum-contracts ; https://arxiv.org/abs/2512.12174v1 |
| Seaport / Blur (ordres NFT hors chaîne) | NT | NT | NT | NT | NT | Oui par nature (ordres signés) | Aucun chiffre trouvé 2024 à 2026 | recherches faites, aucun résultat chiffré |
| Autres (ClaimRewards, inconnus) | 3,4 % (~5,8 M$) | 0 | 2024 : 1,2 % | NT | NT | NT | n/a | Scam Sniffer 2024 |

Pour mémoire, 2023 (top 13 victimes, 51,46 M$, mon calcul sur le tableau Scam Sniffer [P]) : increaseAllowance 46,7 %, approve 20,4 %, ERC20 Permit 16,8 %, increaseApproval 8,7 %, Permit2 2,5 %. Échantillon trop petit pour une tendance.

## Totaux de référence par éditeur (non additifs)

| Éditeur | Période | Pertes | Victimes | Moyenne | Source |
|---|---|---|---|---|---|
| Scam Sniffer [P] | 2024 | 494 M$ | 332 000 | ~1 488 $ | https://drops.scamsniffer.io/scam-sniffer-2024-web3-phishing-attacks-wallet-drainers-drain-494-million/ |
| Scam Sniffer [P] | 2025 | 83,85 M$ | 106 106 | 790 $ | https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ |
| Scam Sniffer [S Decrypt] | nov. 2025 | ~7,77 M$ | 6 000+ | ~1 300 $ (calculé) | https://decrypt.co/351651/what-a-440000-hack-shows-about-the-rising-threat-of-ethereum-permit-scams |
| Scam Sniffer [S Decrypt] | janv. 2026 | 6,27 M$ (+207 % vs déc.) | 4 741 | ~1 320 $ (calculé) | https://decrypt.co/357450/signature-phishing-up-200-as-january-losses-pass-6m |
| Scam Sniffer [P] | T1 2024 | 173 M$ (104 M$ janv.-fév., 71 M$ mars) | NT | mars 2024 : ~90 % des actifs volés sont des ERC-20 | https://drops.scamsniffer.io/?p=958 |
| Check Point [P] (Inferno Drainer) | sept. 2024 à mars 2025 | 9 M$ minimum | 30 000+ wallets | ~300 $ (calculé) | https://research.checkpoint.com/2025/inferno-drainer-reloaded-deep-dive-into-the-return-of-the-most-sophisticated-crypto-drainer/ |

Check Point cite approve (suivi de transferFrom) comme méthode principale d'Inferno Drainer, et permit comme signature hors chaîne, sans aucun comptage par type.

## Part qui passe par une signature OFF-chain

- 2024, gros cas (Scam Sniffer [P]) : Permit = 56,7 % des 171 M$, soit environ 97 M$. Plancher : le cas setOwner (31,9 %) pourrait aussi être une signature de message, canal non confirmé.
- 2025, gros cas (Scam Sniffer [P]) : Permit/Permit2 = 38 % des 22,98 M$, soit 8,72 M$. Rapporté au total annuel de 83,85 M$ : au moins 10,4 %. Les petits cas ne sont pas ventilés.
- Si l'on ajoute l'autorisation EIP-7702 (signée, mais portée par une transaction de type 4), on atteint 49 % des gros cas 2025 (8,72 + 2,54 sur 22,98, mon calcul). Je ne la compte pas comme message hors chaîne.
- Part sur les victimes : non trouvée.
- Lecture : l'ordre de grandeur est de 40 à 57 % des pertes des gros cas par signature de message hors chaîne. Extrapoler au total est une hypothèse, pas un fait. Un compte intelligent qui n'inspecte que les transactions ne voit ni Permit, ni Permit2, ni les ordres Seaport. Le dépôt du message par le drainer arrive ensuite, dans une transaction signée par l'attaquant.

## Limites

- Aucune ventilation par type pour 65 à 73 % des pertes. Scam Sniffer donne le détail par type seulement pour les cas supérieurs à 1 M$.
- Permit et Permit2 sont fusionnés dans le tableau 2025. Approve et increaseApproval aussi.
- Parts du total annuel, moyennes et médianes par type : mes calculs sur des échantillons de 1 à 3 cas. Non représentatifs.
- Chainalysis, CertiK, Cyvers, Wintermute (primaire) : aucune répartition par mécanisme trouvée. Wintermute lu via Cointelegraph et The Block. Check Point : aucune donnée par type.
- Scam Sniffer, février à septembre 2026 : non trouvé. Seul janvier 2026 relayé par Decrypt.
- Un relais attribue le 38 % à SlowMist, deux autres à Scam Sniffer. La page Scam Sniffer elle-même le donne. Je retiens Scam Sniffer.
- Le relais sur Permit2 en mai 2024 (300+ victimes, 690 k$) vient d'un article Zealynx daté de 2026, non vérifié contre Scam Sniffer.

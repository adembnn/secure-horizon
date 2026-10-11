# U1. Répartition des pertes des particuliers par mécanisme, 2023 à 2026 (recherche du 11/10/2026)

Contexte : Hold up (extension pour particuliers : intention, décodage de l'effet réel, friction). Lu avant : R_cas_complexes/SYNTHESE.md, R5, J_wallets_perso/SYNTHESE.md, K_delais_drainers.md. Ce rapport complète et corrige certains chiffres de ces fichiers (voir section 13).

## 0. Conventions et honnêteté
- [P] primaire lu par moi : pages Scam Sniffer (rapports 2023, 2024, 2025), pages Chainalysis (hacks/vol 2026, scams 2026), PDF FBI IC3 2024 et 2025 (téléchargés, texte extrait, tableaux relus), article arXiv 2501.16681 v3 (USENIX Security 2025), page CertiK Hack3d 2025, page SlowMist 2025.
- [S] presse, résumé ou page vendeur relayant un rapport que je n'ai pas ouvert (Decrypt, The Block, Cointelegraph, Forklog, MEXC, etc.).
- [V] chiffre ou affirmation de vendeur non vérifiable.
- [C] calculé par moi, formule donnée.
- "non trouvé" = recherché, absent.
- Aucun secret manipulé. Les PDF FBI ont été extraits localement ; aucune donnée personnelle.
- Règle : aucune addition de sources entre elles sans le dire. Les périmètres diffèrent (voir section 12).

## 1. Cadre : il n'existe pas de "total des pertes des particuliers"
Aucun éditeur ne publie une ventilation complète. Trois mondes de mesure coexistent :
1. Plaintes déclarées aux États-Unis (FBI IC3) : montants en dollars déclarés par la victime, tous modes de paiement avec "nexus crypto".
2. Recettes on-chain d'adresses d'escrocs (Chainalysis, TRM, Cyvers) : flux observés, projetés à la hausse chaque année (Chainalysis : +24 % en moyenne entre deux versions d'une même année, page scams 2026 [P]).
3. Incidents dans une base de piratages/phishing (CertiK, SlowMist, Beosin, Scam Sniffer, Immunefi) : cas visibles, surtout les gros.

Pour bâtir des parts, j'utilise une base globale de travail "B" 2025 (voir section 11) : B = escroqueries Chainalysis (≥ 14 000 M$) + vols de portefeuilles personnels Chainalysis (713 M$) + wrench (≈ 41 M$) = 14 754 M$ [C : 14 000 + 713 + 41]. C'est une construction, pas une mesure du marché, et elle est en bas de fourchette (Chainalysis projette > 17 000 M$ pour les seules escroqueries).

## 2. (a) Signatures et approbations malveillantes (permit, Permit2, approve, setApprovalForAll, EIP-7702)

### 2.1 Données Scam Sniffer [P] (chaînes EVM seulement, drainers servis par sites de phishing)
| Année | Pertes | Victimes (adresses) | Perte moyenne | Cas ≥ 1 M$ | Plus gros vol |
|---|---|---|---|---|---|
| 2023 | ≈ 295 M$ (titre : "300 M$") | ≈ 324 000 (titre : "320 000") | ≈ 910 $ [P, calculé par la page] | 13 | 24,05 M$ (IncreaseAllowance) |
| 2024 | ≈ 494 M$ (+67 %) | 332 000 (+3,7 %) | ≈ 1 488 $ [C : 494 M$ / 332 000] | 30 (171 M$ au total, soit 34,6 % [C : 171/494]) | 55,48 M$ (setOwner) |
| 2025 | 83,85 M$ (-83 %) | 106 106 (-68 %) | 790 $ [P] | 11 (22,98 M$, soit 27,4 % [C]) | 6,5 M$ (Permit, septembre) |
| 2026 | janvier seulement : 6,27 M$ | 4 741 | ≈ 1 323 $ [C : 6,27 M$ / 4 741] | non trouvé | 12,25 M$ de janvier = empoisonnement, pas signature |

- Trimestres 2025 [P] : T1 21,94 M$ (22 654 victimes, 969 $) ; T2 17,78 M$ (20 974, 848 $) ; T3 31,04 M$ (39 886, 778 $) ; T4 13,09 M$ (22 592, 580 $). Plus mauvais mois : août 12,17 M$ (15 230 victimes) ; plus faible : décembre 2,04 M$.
- 2024 par trimestre [P] : T1 187,2 M$ (175 000 victimes) ; T2+T3 257 M$ (90 000) ; T4 51 M$ (30 000). La presse donne d'autres découpages T2/T3 (167/129 M$) : non réconciliés, ne pas citer.
- Médiane : non publiée par Scam Sniffer (seule la moyenne l'est). 73 % des pertes 2025 sont hors des 11 gros cas [C : 1 - 27,4 %], donc la médiane est bien inférieure à 790 $ ; sa valeur est non trouvée.
- 2026 : seul janvier est disponible (rapport mensuel relayé [S] ; deux victimes = 65 % des pertes du mois). Aucun trimestre ni semestre 2026 trouvé sur la page des rapports Scam Sniffer (lue : dernier item 3 janvier 2026).

### 2.2 Ventilation par type de signature (gros cas ≥ 1 M$ uniquement) [P]
- 2024 (30 cas, 171 M$) : Permit 56,7 %, setOwner 31,9 %, transfert 4,5 %, increaseAllowance 3,5 %, autres 3,4 %.
- 2025 (11 cas, 22,98 M$) : Permit/Permit2 38 % (8,72 M$), approve/increaseApproval 24,5 % (5,62 M$), transfert 21 % (4,87 M$), EIP-7702 batch 11 % (2,54 M$, deux cas en août : 1,54 M$ et 1,00 M$), setApprovalForAll 5,4 % (1,23 M$, NFT Uniswap V3) [C : montant / 22,98].
- Part minimale d'EIP-7702 dans le total drainers 2025 : 3,0 % [C : 2,54 / 83,85]. Part minimale de Permit/Permit2 : 10,4 % [C : 8,72 / 83,85]. Ce sont des planchers (petits cas non ventilés par l'éditeur ; la page ne donne pas la ventilation hors gros cas).
- 2023 (13 plus grosses victimes, ≈ 51,5 M$) : IncreaseAllowance/approve ≈ 39 M$ dont 24,05 M$ en une victime ; ERC20 Permit ≈ 8,7 M$ ; Permit2 1,28 M$. Échantillon : 13 victimes sur 324 000.
- EIP-7702, au-delà de Scam Sniffer : article arXiv 2512.12174 [S, non lu en détail] : une victime a perdu plus de 3 300 ETH, plus de 5 fois la deuxième ; Wintermute : plus de 80 % des délégations 7702 observées servaient un seul script malveillant [S, The Block]. Total 2026 : non trouvé.

### 2.3 Autres sources sur le phishing, divergences
| Source | Chiffre 2025 | Périmètre |
|---|---|---|
| Scam Sniffer [P] | 83,85 M$ / 106 106 victimes | drainers EVM par site de phishing, borne basse déclarée |
| SlowMist rapport annuel 2025 [P, page lue] | reprend 83,85 M$ de Scam Sniffer ; propre base : 200 incidents, 2 935 M$ | exclut en grande partie les pertes individuelles |
| Beosin rapport 2025 [S, relayé par une recherche] | 113 incidents de phishing, ≈ 177 M$ | incidents visibles |
| CertiK Hack3d 2025 [P] | 722,9 M$ sur 248 incidents (phishing) ; total 3 353 M$, dont Bybit 1 447 M$ | la page ne définit pas "phishing" (voir ci-dessous) |
| FBI IC3 2025 [P] | "Phishing/Spoofing" avec nexus crypto : ≈ 111 M$ ; Malware ≈ 15,7 M$ ; SIM swap ≈ 4,4 M$ | plaintes US |
| Chainalysis [P] | pas de ligne "signatures". Les "crypto drainers" apparaissent comme catégorie de scams en 2024 (revenus +≈170 %, nombre de dépôts +75 % [S]) | scams on-chain |
| Cyvers, Blockaid, Web3 Antivirus, De.Fi | non trouvé (pas de chiffre sourcé exploitable ; Cyvers : voir section 12) | |
| Immunefi | rapports de piratages de protocoles, pas de pertes particuliers (janvier et février 2025 : aucun cas de fraude) [S] | hors sujet |

Attention : 722,9 M$ (CertiK, phishing large) et 713 M$ (Chainalysis, portefeuilles personnels) sont presque identiques par hasard : définitions et unités différentes (248 incidents contre 158 000 incidents). Ne jamais les confondre.

Qualité : Scam Sniffer = primaire de bon niveau mais mono-éditeur, EVM, borne basse, révisions de la base (2023 révisé de 300 M$ / 320 000 à 295 M$ / 324 000 [P]). La baisse de 83 % en 2025 est réelle dans leur périmètre mais ne dit pas que le risque a baissé : la même page note que Bybit (1,46 Md$) vaut 17 fois les pertes de phishing par signature de l'année, et les pertes d'empoisonnement et de vols de clés ne sont pas dans leur base.

### 2.4 Tendance
Pic 2024 (494 M$), effondrement 2025 (84 M$), reprise partielle début 2026 (6,27 M$ en janvier, +207 % sur décembre [S]). Les gros cas par permit restent la règle, avec en 2025 l'apparition d'EIP-7702.

## 3. (b) Empoisonnement d'adresse
Source : Tsuchiya, Dong, Soska, Christin, "Blockchain Address Poisoning", USENIX Security 2025 (arXiv v3 lu) [P]. Période : 1er juillet 2022 au 30 juin 2024, Ethereum et BSC, détection limitée aux transferts de stablecoins majeurs (borne basse selon les auteurs).
- Tentatives : 270 069 469 (Ethereum ≈ 17,3 M ; BSC ≈ 252,7 M). Adresses ciblées : ≈ 17,4 M. Adresses sosies : ≈ 50,1 M.
- Réussites : 6 633 transferts (1 738 ETH, 4 895 BSC), ≈ 5 500 victimes (1 502 ETH, 4 004 BSC). Taux de réussite par tentative : 0,0025 % [C : 6 633 / 270 069 469] ; la note de l'article donne ≈ 0,01 % sur Ethereum.
- Pertes : 83,8 M$ au total, soit 79,3 M$ sur Ethereum (médiane 2 160 $, moyenne 45 653 $, maximum 20 M$) et 4,49 M$ sur BSC (médiane 85 $, moyenne 1 164 $, maximum 279 489 $). Ce sont des sommes reçues par les attaquants, pas un profit net (profit estimé du plus grand groupe : ≈ 4 M$). Source de confusion : certains sites (BlockEden) écrivent "83,8 M$ sur Ethereum seul" : faux, c'est ETH + BSC.
- 49 groupes d'attaque représentent 97,4 % des transactions d'empoisonnement.
- Annualisation [C] : 83,8 / 2 ≈ 41,9 M$ par an ; victimes ≈ 2 750 par an [C : 5 506 / 2]. Perte moyenne par victime sur toute la période ≈ 15 220 $ [C : 83,8 M$ / 5 506 victimes] ; par transfert ≈ 12 630 $ [C].
- 2025 et 2026 : pas de total annuel trouvé (ni Scam Sniffer, ni Chainalysis). Cas isolés [S] : 763 662 $ (février 2025, adresse sosie 4 premiers/6 derniers caractères), ≈ 50 M$ en USDT (décembre 2025, victime ayant copié depuis l'historique), 4 556 ETH ≈ 12,25 M$ (janvier 2026), soit ≈ 62 M$ pour deux victimes (Scam Sniffer relayé). Hausse attribuée à la baisse des frais après Fusaka (décembre 2025) : explication de blogs, non vérifiée en primaire. Chainalysis cite l'empoisonnement parmi les catégories de scams en croissance en 2024 [S].
- Hypothèse de travail 2025 [C] : 41,9 (annualisation USENIX) à 91,9 M$ (annualisation + le seul cas de 50 M$ de décembre 2025). Aucune mesure ; c'est un ordre de grandeur. Le tournant (cas à 50 M$) montre que la moyenne est dominée par quelques victimes fortunées.
- Qualité : très bonne méthode (revue par les pairs), mais période close en juin 2024 et seulement stablecoins.

## 4. (c) Faux support / ingénierie sociale / usurpation
- Chainalysis (scams 2026) [P] : incidents d'usurpation +"plus de 1 400 %" sur un an, montant moyen volé +"plus de 600 %". La page ne donne aucun total en dollars, aucun nombre d'incidents, et ne définit pas le 1 400 % au-delà de "glissement annuel". Decrypt [S] le décrit comme "deepfakes de responsables publics" : lecture plus étroite que celle de la page ; divergence non expliquée. Un taux de croissance +1 400 % peut venir d'une base minuscule : ne pas en déduire un montant.
- FBI IC3 (plaintes avec nexus crypto) [P] :
  | Type | 2024 : pertes / plaintes | 2025 : pertes / plaintes | Perte moyenne 2025 |
  |---|---|---|---|
  | Tech/Customer Support (faux support) | 962,0 M$ / 11 129 | 1 226,3 M$ / 17 355 | ≈ 70 660 $ [C] |
  | Government Impersonation | 146,1 M$ / 3 585 | 281,2 M$ / 5 955 | ≈ 47 210 $ [C] |
  | Recovery scams (récupération de fonds) | non trouvé dans les pages lues | ≈ 1 400 M$ / 10 516 | ≈ 133 000 $ [C] ; peut inclure les pertes du vol initial (note FBI) |
  | Crypto ATM/kiosque | 246,7 M$ / 10 956 | 389 M$ / 13 460 | ≈ 28 900 $ [C] |
  Évolution 2024 à 2025 [C] : faux support +27,5 % (1 226,3 / 962,0), usurpation d'agent public +92,5 %.
- "Personal Data Breach" avec nexus crypto : 1 120,8 M$ (2024) puis 939,4 M$ (2025), 13 486 plaintes en 2025. Le rapport lu ne définit pas le contenu pour la crypto. Ne pas l'interpréter comme vols de portefeuille sans vérifier le glossaire IC3.
- Cas relayés [S] : Coinbase, plus de 65 M$ en deux mois (décembre 2024 à janvier 2025, ZachXBT) ; estimation ZachXBT "plus de 300 M$ par an" pour l'ingénierie sociale en général (date incertaine) ; 16 M$ et ≈ 100 victimes (poursuites à Brooklyn) ; 330 M$ en BTC volés en avril 2025 à une personne âgée (R5/J, dont ≈ 7 M$ gelés) ; ZachXBT : un faux agent du support Coinbase ≈ 2 M$ sur un an (décembre 2025).
- Qualité : les plaintes IC3 sont déclaratives, américaines, non vérifiées ; elles donnent la meilleure ventilation par type et par âge, mais pas un montant mondial. Chainalysis ne fournit pas de dollars pour cette catégorie.
- Remarque produit : c'est le seul mécanisme où le montant moyen déclaré (≈ 47 000 à 70 000 $) est 60 à 90 fois celui des drainers (790 $).

## 5. (d) Pig butchering / romance / investissement
### 5.1 FBI IC3 (crypto, plaintes américaines) [P]
| Indicateur | 2023 [S] | 2024 [P] | 2025 [P] |
|---|---|---|---|
| Crypto, total pertes | ≈ 5 600 M$ (≈ 69 000 plaintes) | 9 322 M$ (149 686 plaintes) | 11 366 M$ (181 565 plaintes) |
| Perte moyenne par plainte crypto | ≈ 81 000 $ [C : 5 600 M$ / 69 000, indicatif] | ≈ 62 280 $ [C : 9 322 / 149 686] | 62 604 $ [P] |
| Investissement crypto | ≈ 3 960 M$ (+53 % sur 2022) | 5 820 M$ (41 557 plaintes) | 7 278 M$ (61 559 plaintes) |
| Perte moyenne investissement | non calculé | ≈ 140 000 $ [C] | ≈ 118 230 $ [C : 7 277,9 / 61 559] |
| Part de l'investissement dans le crypto | ≈ 71 % [S] | 62,4 % [C] | 64,0 % [C] |
| Romance/Confidence | non trouvé | 237,2 M$ (3 811) | 394,8 M$ (5 925), moyenne ≈ 66 630 $ [C] |
| Total pertes IC3 tous crimes | non lu | 16 600 M$ | 20 877 M$ ; le crypto en fait 54,4 % [C] |

Note de cohérence : la page "tendances" du PDF 2025 écrit 7,228 Md$ pour l'investissement, et le tableau par type de crime écrit 7 277 868 919 $. Je retiens 7 278 M$ (tableau) en supposant une inversion de chiffres dans le titre ; la presse a repris 7,2 Md$. Écart de 50 M$ (0,7 %), non bloquant.

### 5.2 Âge des victimes (FBI, crypto, 2025) [P] ; parts calculées sur 11 366 M$ [C]
| Tranche | Plaintes | Pertes | Part |
|---|---|---|---|
| 60 ans et plus | 44 555 | 4 432 M$ | 39,0 %, moyenne ≈ 99 500 $ [C] |
| 50 à 59 | 25 453 | 2 139 M$ | 18,8 % |
| 40 à 49 | 29 749 | 1 553 M$ | 13,7 % |
| 30 à 39 | 27 598 | 862 M$ | 7,6 % |
| 20 à 29 | 18 107 | 289 M$ | 2,5 % |
| moins de 20 | 3 508 | 27 M$ | 0,2 % |
Les tranches totalisent ≈ 9 302 M$ sur 11 366 M$ : le reste est d'âge non renseigné [C]. Les correspondances plaintes/tranche viennent du graphique lu en texte ; l'attribution des nombres 27 598 / 29 749 / 25 453 / 18 107 / 3 508 aux tranches suit l'ordre d'affichage et reste à confirmer sur le PDF visuel. En 2024 : 60+ = 2 839 M$ (33 369 plaintes) = 30,5 % [C] ; moyenne ≈ 85 090 $ [C].
- Investissement crypto 2025, 60+ : 2 764 M$ (13 685 plaintes), 38,2 % du total investissement [C], moyenne ≈ 202 000 $ [C]. 2024 : 60+ = 1 600 M$ (8 043 plaintes).
- Kiosques crypto 2025 : 60+ = 257,5 M$ sur 389 M$ (66,2 % [C]), 6 188 plaintes sur 13 460. (Le chiffre 6 188 / 257,5 M$ rencontré dans la presse comme "crypto des seniors" est en réalité le sous-ensemble kiosques : erreur de lecture de la source Bitcoin Magazine.)
- Recovery scams 2025 : 60+ = 540,5 M$ sur ≈ 1 400 M$ (38,6 % [C]).

### 5.3 Chainalysis (on-chain, global)
- Scams totaux : 2024 ≥ 9 900 M$ à la première publication, réévalué à 12 000 M$ [P, page 2026] ; 2025 ≥ 14 000 M$ on-chain, projection > 17 000 M$ [P]. Paiement moyen par scam : 782 $ (2024) puis 2 764 $ (2025), +253 % [P].
- Ventilation 2024 [S, aperçu 2025 relayé] : high-yield investment scams 50,2 % (-36 % sur un an), pig butchering 33,2 % (+≈ 40 % ; dépôts +≈ 210 % ; dépôt moyen -55 %). Pas de ventilation par part pour 2025 sur la page lue. Emploi 0,3 % en 2024 [S].
- Opérateurs IA : 3,2 M$ par opération contre 719 000 $ sans lien IA (4,5 fois) [P].
- Qualité : bonne base mais montants révisés à la hausse chaque année (2024 passé de 9,9 à 12 Md$) ; ne pas comparer 2025 (≥ 14 Md$ à ce jour) à 2024 (12 Md$ révisé) comme si c'était à maturité égale.

## 6. (e) Compromissions de clés, phrase secrète, portefeuille personnel
Chainalysis (page "hacking" 2026) [P] :
- 2025 : 713 M$ volés à des particuliers, 158 000 incidents, au moins 80 000 victimes uniques ; 2024 : 1 500 M$ (sommet) ; 2022 : 54 000 incidents et 40 000 victimes.
- Part du total volé : 2025 20 % (713 / 3 410 = 20,9 % [C]), 2024 44 %, 2022 7,3 %. Hors Bybit : 37 % [P] ; vérifié [C : 713 / (3 410 - 1 500) = 37,3 %].
- Perte moyenne : ≈ 8 910 $ par victime (borne haute, puisque victimes ≥ 80 000) [C : 713 M$ / 80 000] ; ≈ 4 510 $ par incident [C : 713 M$ / 158 000].
- Réseaux : Solana ≈ 26 500 victimes (le plus de victimes) ; Ethereum et Tron ont plus de victimes par 100 000 portefeuilles que Base et Solana [P/S].
- Méthodologie : pas de définition formelle ; données on-chain plus déclarations de victimes et partenaires ; borne basse ; la page ne dit pas si les vols par drainers y figurent. Il est donc probable, sans preuve, que les 84 M$ de Scam Sniffer soient en partie un sous-ensemble des 713 M$ (je ne les additionne jamais).
- Autres chiffres : CertiK H1 2025, "wallet compromise" = 1 707 M$ sur 34 incidents (inclut Bybit) [S] ; pas de total annuel trouvé. CertiK 2024 : clés privées ≈ 855 M$ sur 65 incidents [S].
- Qualité : la meilleure estimation globale existante pour les vols de portefeuille, mais très agrégée (pas de ventilation par mécanisme).

## 7. (f) Extensions, logiciels malveillants, clippers, stealers, faux wallets
Aucun chiffre global fiable : "non trouvé" pour un montant de pertes de particuliers attribué à Atomic, Lumma ou Rhadamanthys.
- Lumma [S] : démantèlement mai 2025 (Microsoft, FBI) ; FBI : ≈ 10 millions d'infections attribuées ; 36,5 M$ de fraude à la carte en 2023 (pas crypto). Rhadamanthys : opération Endgame, novembre 2025, plus de 1 025 serveurs mis hors service (Europol) [S]. Atomic (macOS) : aucune estimation de pertes. Une estimation vendeur "1,8 Md d'identifiants volés en 2025" est sans méthode [V].
- Clippers : Kaspersky mars 2023 : ≈ 400 000 $ volés à ≈ 15 000-16 000 utilisateurs dans 52 pays (faux Tor) [S] ; MassJacker : 87 000 $ dans un seul portefeuille [S]. Le piratage npm de septembre 2025 : 18 paquets, ≈ 2 heures, impact financier faible (pas de chiffre) [S].
- Faux wallets/extensions : Trust Wallet extension v2.68 (décembre 2025) : 7 à 8,5 M$, 2 520 adresses [S] ; perte moyenne ≈ 2 780 à 3 370 $ [C : 7 M$ ou 8,5 M$ / 2 520]. Ledger Connect Kit (décembre 2023) : ≥ 600 000 $ [S]. Radiant (octobre 2024) : ≈ 50 M$, mais c'est un protocole, pas un particulier [S]. Campagne FoxyWallet : 40+ extensions Firefox (juillet 2025) [S].
- FBI IC3 : "Malware" avec nexus crypto = ≈ 15,7 M$ en 2025 (déclarations) ; sous-déclaré parce que la victime ignore la cause [C : interprétation].
- Classement : ces pertes sont comptées dans (e) par Chainalysis ; je ne les isole pas. Dans la base B, (f) ⊂ (e).

## 8. (g) Wrench attacks
| Source | 2024 | 2025 | 2026 |
|---|---|---|---|
| CertiK Skynet [S, Decrypt/Cointelegraph] | 41 attaques | 72 attaques vérifiées (+75 %), ≥ 40,9 M$ (+44 %) ; enlèvement = méthode principale ; France 19 | H1 : 52 attaques (39 en H1 2025, +33 %), exposition 124,1 M$ (10,5 M$ en H1 2025) incluant rançons demandées et fonds gelés ; France 33 sur 52 ; vérifié avant le 22 juillet 2026 |
| Autre chiffre CertiK [S] | non trouvé | 81 attaques, ≈ 52 M$ (écart non expliqué) | 4 premiers mois : 34 attaques |
| Chainalysis [S, Decrypt/The Block/Cointelegraph] | tentatives incluses : ≈ 316 M$ | succès ≈ 58 M$ (chiffre "record" cité) ; tentatives incluses ≈ 180 M$ ; taux de paiement 49 % | jusqu'à fin juin : 46 attaques, > 30 M$ volés, 12 paiements (26 %) ; avec tentatives ≈ 107 M$ |
- Perte moyenne 2025 CertiK : ≈ 568 000 $ par attaque [C : 40,9 M$ / 72], valeur élevée par attaque mais nombre minuscule.
- Divergences : 41 M$ (CertiK vérifié) contre 58 M$ (Chainalysis cité par presse) contre 52 M$ (autre décompte CertiK) ; les montants "exposition" incluent les demandes de rançon et fonds gelés, donc ne sont pas des pertes. Le nombre de cas publics est un plancher (les autorités françaises comptent 77 cas à mi-2026, contre 52 vérifiés par CertiK).
- Poids dans le total : ≈ 0,3 % de la base B [C : 41 / 14 754]. Faible en valeur, forte en gravité humaine ; hors périmètre de signature (aucun signal sur la transaction hors "destinataire neuf + vidage").

## 9. (h) Rug pulls, faux tokens, honeypots
- Pas de total fiable de pertes de particuliers. DappRadar (avril 2025) [S] : 7 rug pulls début 2025 contre 21 un an plus tôt (-66 %) ; pertes "près de 6 Md$" dont 92 % pour l'effondrement du jeton OM de Mantra, que les fondateurs nient être un rug pull : chiffre inutilisable.
- Solidus Labs (2025) [S] : 98,6 % des mémecoins lancés sur Pump.fun présentent des caractéristiques de rug pull ou pump-and-dump ; 93 % des 388 000 pools Raydium ; dommage moyen par arnaque 2 832 $, 25 % des cas à 732 $, maximum 1,9 M$. Ce sont des classements de motifs par un vendeur de conformité, pas des fraudes jugées.
- Préimpression académique 2026 [S] : au moins 151 M$ de pertes directement traçables sur des jetons Solana émis début 2025.
- Chainalysis 2021 [S] : > 2,8 Md$ de rug pulls dont ≈ 90 % pour Thodex (un seul exchange) : non transposable.
- Honeypots : aucun chiffre trouvé. Faux tokens : aucun chiffre propre.
- Dans la taxonomie Chainalysis, les rug pulls ne figurent pas comme catégorie distincte de la page 2026 lue ; leur place (scams, ou hors périmètre) reste non trouvée.

## 10. (i) Faux sites, faux airdrops, kits de drainer
Les pertes sont celles de (a) : drainers = livraison, signatures = moyen. Parts de marché des kits (Scam Sniffer) [P] :
- 2023 : Inferno 81 M$ / 134 000 victimes (27,4 % des 295,5 M$ [C], ≈ 604 $/victime) ; MS 59 M$ / 63 000 (20,0 %, ≈ 937 $) ; Venom 27 M$ / 15 000 (9,1 %, ≈ 1 800 $) ; Angel 20 M$ / 30 000 (6,8 %, ≈ 667 $) ; Pink 18 M$ / 9 000 (6,1 %, ≈ 2 000 $) ; Monkey 16 M$ / 18 000 (5,4 %, ≈ 889 $) ; Pussy 15 M$ / 4 000 (5,1 %, ≈ 3 750 $). Ces 7 kits = 236 M$, soit 79,9 % du total [C]. Frais de service 20 % (≥ 47 M$ de revenu pour les vendeurs de kits).
- 2024 [P] : part de marché de pertes : Angel 42 % puis Pink 28 % puis Inferno 22 % (T1 à T2) ; Pink se retire fin mai 2024 (≈ 85 M$ et 21 000 victimes sur sa vie, selon une source relayant le retrait) ; T3 : Inferno 43 %, Angel 25 % ; T4 : Inferno + Angel ≈ 45 %, Acedrainer 20 %, autres nouveaux 25 %. Monkey : non mentionné en 2024 (réapparaît nulle part).
- 2025 : la page Scam Sniffer ne donne ni noms ni parts ("nouveaux drainers"). Check Point (mai 2025, relayé [S]) : Inferno de retour, > 9 M$ et > 30 000 portefeuilles en six mois (septembre 2024 à mars 2025), soit ≈ 300 $ par portefeuille [C]. Group-IB [S] : Inferno ≈ 87 M$ et ≈ 137 000 victimes de novembre 2022 à novembre 2023 (Scam Sniffer : 81 M$ / 134 000 : écart de ≈ 7 % non expliqué). Un résumé en espagnol parle de plus de 250 M$ depuis l'apparition : non confirmé, ignoré.
- Qualité : les parts 2023 et 2024 sont des parts de pertes mesurées par Scam Sniffer, pas des parts de victimes. Tendance : turnover élevé (un kit ferme, un autre le remplace), donc nommer un kit n'a pas de valeur durable pour la détection.

## 11. Synthèse chiffrée

### 11.1 Tableau de synthèse 2025 : mécanisme x pertes x victimes x part x source
Base de calcul des parts : B = 14 754 M$ (voir section 1). Les fourchettes de pertes sont des bornes documentaires (source la plus basse, source centrale, source la plus haute) et non des intervalles statistiques. Les parts bas/haut = valeur / B (B fixe, pour la lisibilité).
| Mécanisme | Pertes 2025, M$ : bas / central / haut | Victimes ou plaintes | Perte moyenne | Part de B : bas / central / haut | Sources |
|---|---|---|---|---|---|
| (a) Signatures et approbations (drainers) | 84 / 84 / 177 | 106 106 victimes | 790 $ | 0,6 % / 0,6 % / 1,2 % | Scam Sniffer [P] ; haut = Beosin 177 M$ [S] (CertiK 723 M$ = phishing large, exclu) |
| dont EIP-7702 | ≥ 2,5 / 2,5 / n.d. | 2 gros cas | n.d. | 0,02 % | Scam Sniffer [P], gros cas seulement |
| (b) Empoisonnement d'adresse | 42 / 92 / 92 | ≈ 2 750 victimes par an [C] | médiane 2 160 $ (ETH), moyenne ≈ 15 200 $ [C] | 0,3 % / 0,6 % / 0,6 % | USENIX [P] annualisé ; +50 M$ cas de décembre 2025 [S] |
| (c) Faux support et usurpation | 300 / 1 507 / 2 270 | 23 310 plaintes US (17 355 + 5 955) | 47 000 à 70 000 $ | 2,0 % / 10,2 % / 15,4 % | bas = ZachXBT [S] ; central = FBI [P] ; haut = répartition [C] |
| (d) Pig butchering, romance, investissement et autres escroqueries | 7 673 / 12 317 / 13 824 | 67 484 plaintes US (61 559 + 5 925) | ≈ 118 000 $ (FBI investissement) ; 2 764 $ (Chainalysis, par paiement) | 52,0 % / 83,5 % / 93,7 % | bas = FBI (7 278 + 395) [P] ; central = résidu [C : 14 000 - 84 - 92 - 1 507] ; haut = 13 824 [C] |
| (e) Compromission de clés et portefeuilles perso | 713 / 713 / 1 500 | ≥ 80 000 victimes ; 158 000 incidents | ≤ 8 910 $ [C] | 4,8 % / 4,8 % / 10,2 % | Chainalysis [P] ; haut = valeur 2024 |
| (f) Malware, clippers, stealers, faux wallets | n.d. (⊂ e) ; incidents connus 7 à 8,5 M$ (Trust Wallet) | 2 520 adresses (Trust Wallet) | ≈ 2 780 à 3 370 $ [C] | n.d. | Presse [S] |
| (g) Wrench | 41 / 41 / 58 | 72 attaques | ≈ 568 000 $ [C] | 0,3 % / 0,3 % / 0,4 % | CertiK [S] ; haut = Chainalysis via presse [S] |
| (h) Rug pulls, faux tokens, honeypots | 151 / n.d. / n.d. (6 Md$ DappRadar inutilisable) | n.d. | 2 832 $ (Solidus, par pool) | 1,0 % (bas seul) | préimpression 2026 [S], Solidus [S] |
| (i) Faux sites, airdrops, kits | = (a) | 106 106 | 790 $ | = (a) | Scam Sniffer [P] |
Contrôle : 84 + 92 + 1 507 + 12 317 + 713 + 41 = 14 754 M$ (somme des valeurs centrales, hors (f), (h), (i), contenus dans (d), (e), (a)).

Avertissements sur ce tableau :
1. (c) central est une donnée américaine (FBI) placée dans une base mondiale ; (d) central est un résidu, donc il absorbe tout ce qui n'est pas ailleurs (HYIP, romance, rug pulls, sextortion, emploi, etc.) ; (d) est donc un majorant du pig butchering stricte. Part pig butchering stricte approximative : 33,2 % des scams 2024 selon Chainalysis [S] ; non disponible pour 2025.
2. Les parts bas et haut ne sont pas additives.
3. Sensibilité : avec escroqueries projetées à 17 000 M$ (au lieu de 14 000), B = 17 754 M$ et les parts de (a), (b), (e), (g) baissent de ≈ 17 % (relatif) : (a) 0,47 %, (e) 4,0 %, (c) central 8,5 %.
4. Les victimes ne s'additionnent pas non plus : FBI = plaintes américaines, Chainalysis = victimes uniques d'un sous-ensemble.

### 11.2 Ventilation FBI IC3 2025 (crypto, 11 366 M$), seule ventilation primaire complète [P, calcul des parts : C]
| Type de crime | Pertes (M$) | Part | 2024 : pertes (M$) / part |
|---|---|---|---|
| Investissement | 7 278 | 64,0 % | 5 820 / 62,4 % |
| Tech/Customer Support | 1 226 | 10,8 % | 962 / 10,3 % |
| Personal Data Breach | 939 | 8,3 % | 1 121 / 12,0 % |
| Romance/Confidence | 395 | 3,5 % | 237 / 2,5 % |
| Emploi | 288 | 2,5 % | 197 / 2,1 % |
| Usurpation d'agent public | 281 | 2,5 % | 146 / 1,6 % |
| Autre | 148 | 1,3 % | 64 / 0,7 % |
| Phishing/Spoofing | 111 | 1,0 % | 28,5 / 0,3 % |
| Fuite de données | 96 | 0,8 % | 168 / 1,8 % |
| BEC | 84 | 0,7 % | 64 / 0,7 % |
| Non-paiement | 76 | 0,7 % | 55 / 0,6 % |
| Frais d'avance | 68 | 0,6 % | 36 / 0,4 % |
| Extorsion | 63 | 0,6 % | 96 / 1,0 % |
Les lignes listées totalisent 11 053 M$ ; le reste (≈ 313 M$) est réparti en petites catégories. L'alignement libellé/montant a été reconstruit à partir de l'ordre décroissant des montants dans le PDF (extraction de texte désordonnée) : à confirmer visuellement avant publication.

### 11.3 Graphique de répartition en pourcentages (texte)
Base B, valeurs centrales 2025 (14 754 M$). Chaque # = 2 points de pourcentage.
```
(d) Investissement, pig butchering, romance, autres escroqueries  83,5 %  ##########################################
(c) Faux support, usurpation (FBI, US)                            10,2 %  #####
(e) Compromission clés/portefeuilles (Chainalysis)                 4,8 %  ##
(b) Empoisonnement d'adresse (annualisé + cas déc. 2025)           0,6 %  .
(a)(i) Signatures et approbations / drainers (Scam Sniffer)        0,6 %  .
(g) Wrench                                                         0,3 %  .
(f)(h) Malware, rug pulls                                    inclus ailleurs / n.d.
```
Même graphique sur la base FBI IC3 2025 (crypto, 11 366 M$), seule ventilation primaire complète, chaque # = 2 points :
```
Investissement                64,0 %  ################################
Faux support (tech)           10,8 %  #####
Personal Data Breach           8,3 %  ####
Romance                        3,5 %  ##
Emploi                         2,5 %  #
Usurpation public              2,5 %  #
Phishing/Spoofing (proxy a)    1,0 %  .
Autres                        ≈ 7,4 % [C : 100 - somme des lignes ci-dessus]
```
Lecture : les deux bases disent la même chose : la catégorie que Hold up peut couvrir via la signature (a) pèse moins de 1 % à environ 2 % des pertes mesurées ; (c) et (d) pèsent 10 % et plus de 70 %. Voir R/SYNTHESE : "~84 M$ contre ≥ 14 Md$" cohérent.

### 11.4 Par année (ordres de grandeur, pour la tendance)
| | 2023 | 2024 | 2025 | 2026 (partiel) |
|---|---|---|---|---|
| Drainers (Scam Sniffer) M$ | 295 | 494 | 84 | 6,3 en janvier |
| Particuliers vols portefeuille (Chainalysis) M$ | non trouvé | 1 500 | 713 | non trouvé |
| Escroqueries on-chain (Chainalysis) M$ | non trouvé | ≥ 9 900 (12 000 révisé) | ≥ 14 000 (> 17 000 projeté) | non trouvé |
| FBI crypto M$ | ≈ 5 600 [S] | 9 322 | 11 366 | rapport 2026 non encore publié |
| FBI investissement M$ | ≈ 3 960 [S] | 5 820 | 7 278 | idem |
| Wrench, attaques / M$ | n.d. | 41 / n.d. | 72 / ≥ 40,9 | H1 : 52 attaques (CertiK) ; > 30 M$ volés (Chainalysis, jusqu'à fin juin) |

## 12. Chiffres incomparables entre sources : avertissements
1. FBI (20 877 M$ en 2025) contre Chainalysis (≥ 14 000 M$) contre TRM (≈ 35 000 M$ "pertes" liées aux scams en 2025, selon un résumé de presse [S] ; un autre résumé donne 17 Md$ : contradictoire, la part de stablecoins de 84 % citée dans R5 n'a pas été retrouvée) contre Cyvers (15 870 M$ de valeur "frauduleuse", 4,29 M transactions, soit ≈ 3 700 $ par transaction [C], 37 % USDT / 36 % ETH / 25 % USDC [S]) : les périmètres sont différents.
   - FBI : plaintes américaines, montants déclarés par la victime, "nexus crypto" = tout crime qui touche à la crypto, y compris cas où la crypto n'est qu'un canal (kiosques, virement), pertes parfois fiat. Le total 20 877 M$ (tous crimes) n'est pas une perte crypto ; la perte crypto est 11 366 M$.
   - Chainalysis : revenus reçus par adresses d'escrocs, projections à la hausse (+24 % par version), le chiffre de l'année N est systématiquement sous-estimé et relevé l'année suivante.
   - TRM : flux envoyés vers des schémas de fraude, dont la définition n'a pas été retrouvée ; un facteur 2 à 2,5 sépare TRM de Chainalysis.
   - Cyvers : "fraude autorisée" détectée par son système, ne se compare à aucun autre.
2. Moyennes : 790 $ (Scam Sniffer, par adresse victime), 2 764 $ (Chainalysis, par paiement), ≈ 8 910 $ (Chainalysis, par victime de portefeuille), ≈ 15 200 $ (USENIX, par victime d'empoisonnement), ≈ 62 600 $ (FBI, par plainte crypto) : unités différentes (adresse, paiement, victime, plainte). Une plainte FBI regroupe souvent plusieurs transferts.
3. 713 M$ (Chainalysis, vols de portefeuilles personnels) contre 722,9 M$ (CertiK, phishing) contre 84 M$ (Scam Sniffer) : trois choses différentes, ne pas les rapprocher.
4. 83,8 M$ (USENIX) = sur 24 mois et deux chaînes, ETH + BSC, stablecoins seulement ; ne pas le présenter comme annuel ni comme "ETH seul".
5. Wrench : 41 M$ (CertiK vérifié) contre 52 M$ contre 58 M$ (Chainalysis par presse) contre 180 M$ (tentatives incluses) ; 124 M$ H1 2026 (CertiK) = exposition avec rançons demandées, pas des vols.
6. "+1 400 %" (usurpation, Chainalysis) = taux sur incidents, pas un montant ; base inconnue.
7. 2023 : les chiffres Scam Sniffer ont été révisés (300 M$ / 320 000 puis 295 M$ / 324 000). Pour FBI 2023, je n'ai que des reprises presse.
8. Pour 2026 : seulement janvier (Scam Sniffer), wrench H1 (Chainalysis, CertiK), FBI 2025 publié en avril 2026. Aucun total 2026 de signatures, d'empoisonnement, de scams ou de portefeuilles : "non trouvé".
9. Non trouvé : Cyvers (poisoning/phishing détaillé), Blockaid, Web3 Antivirus, De.Fi (aucun chiffre de pertes de particuliers par mécanisme), Immunefi (hors sujet), médianes (Scam Sniffer, Chainalysis, FBI), part de marché des kits en 2025, total clippers/stealers, total honeypots.
10. Incident non vérifié : une recherche sur un vol visant des détenteurs de Ledger en octobre 2026 n'a rien retourné. Aucun chiffre repris.

## 13. Corrections et compléments par rapport aux fichiers lus
- J/W1 écrit "empoisonnement : 6 633 pertes réelles, 83,8 M$ en deux ans, médiane 2 160 $ sur Ethereum" : exact, mais la médiane 2 160 $ est Ethereum seul (BSC : 85 $) et 83,8 M$ = ETH + BSC.
- R5 écrit "FBI 2025 : investissement ≈ 7,2 Md$" : le PDF donne 7,228 (titre) et 7,278 (tableau) ; j'ai pris 7,278.
- Les chiffres "6 188 plaintes, 257,5 M$ de crypto pour les seniors" vus dans une recherche sont les kiosques crypto, pas toute la crypto des 60+ (4 432 M$, 44 555 plaintes).
- K2 : "65 à 73 % non ventilées" reste vrai ; j'ajoute que Scam Sniffer 2023 ne ventile que 13 victimes.
- Le pourcentage de drainers dans les pertes de particuliers (≈ 0,6 % de B ; 0,7 % de la base FBI si on compare 84 à 11 366) est inférieur aux 10,4 % "hors chaîne" de K2, qui est une part de 84 M$, pas du total.

## 14. Implications pour Hold up (courtes, non décisionnelles)
- La couverture par analyse de signature (a, b) vise < 2 % des pertes mesurées en valeur, mais plusieurs centaines de milliers de victimes (106 106 drainers + ≈ 2 750 par an de poisoning, perte moyenne faible) : valeur par utilisateur faible, volume élevé.
- Les mécanismes à forte valeur (c, d, e) échappent à l'analyse de la transaction (R5). Les signaux de destinataire neuf, ratio du solde et appartenance de l'adresse (R5/B2) sont les seuls leviers : à tester.
- L'âge compte : 39 % des pertes crypto américaines viennent des 60+ (perte moyenne ≈ 99 500 $) ; segment à examiner pour l'acquisition (extension pour proches).
- Empoisonnement : cas où le signal indépendant fonctionne sans intention ; tendance haussière documentée, mesure 2025 manquante.

## 15. Résumé en 12 lignes (chiffres centraux)
1. Aucun total unique ; base de travail 2025 B = 14 754 M$ (escroqueries Chainalysis ≥ 14 000 + portefeuilles perso 713 + wrench ≈ 41), avec 17 000+ M$ de projection possible.
2. (a) Signatures/drainers : 2023 295 M$ (324 000 victimes, 910 $ de moyenne) ; 2024 494 M$ (332 000, 1 488 $) ; 2025 83,85 M$ (106 106, 790 $) ; 2026 janvier 6,27 M$ (4 741). Part de B : ≈ 0,6 % ; EIP-7702 ≥ 2,5 M$ (≥ 3 % des drainers 2025) ; Permit/Permit2 ≥ 10,4 %.
3. (b) Empoisonnement : 83,8 M$ en 24 mois, 6 633 transferts, ≈ 5 500 victimes, 270 M de tentatives, médiane 2 160 $ (ETH) ; ≈ 42 à 92 M$/an (hypothèse) ; part ≈ 0,3 à 0,6 %.
4. (c) Faux support : FBI crypto 1 226 M$ (17 355 plaintes, moyenne ≈ 70 700 $) + usurpation 281 M$ ; part ≈ 10 % (fourchette 2 à 15 %) ; Chainalysis +1 400 % d'incidents sans montant.
5. (d) Investissement/pig butchering/romance : FBI 7 278 M$ + 395 M$ (64 % + 3,5 % du crypto US) ; Chainalysis scams ≥ 14 000 M$ ; part de B ≈ 52 % à 94 %, central ≈ 84 %.
6. FBI crypto : 2024 9 322 M$ (149 686 plaintes), 2025 11 366 M$ (181 565 plaintes, moyenne 62 604 $) ; 60+ = 39 % des pertes (4 432 M$).
7. (e) Portefeuilles personnels : 713 M$ (1 500 M$ en 2024), 158 000 incidents, ≥ 80 000 victimes, ≤ 8 910 $ par victime ; part ≈ 4,8 % (37 % du volé hors Bybit).
8. (f) Malware/stealers : aucun total fiable ; faux Trust Wallet 7 à 8,5 M$ (2 520 adresses) ; contenu dans (e).
9. (g) Wrench : 72 attaques, ≥ 40,9 M$ en 2025 (CertiK) ; H1 2026 : 52 attaques, > 30 M$ volés (Chainalysis) ; part ≈ 0,3 %.
10. (h) Rug pulls : aucun total propre ; ≥ 151 M$ traçables sur Solana (préimpression) ; (i) kits : 2023 Inferno 27 %, MS 20 %, Venom 9 %, Angel 7 %, Pink 6 %, Monkey 5 % ; 2024 Angel 42 % puis Inferno 43 % au T3 ; 2025 non publié.
11. Constat : la signature analysable pèse moins de 2 % des pertes mesurées ; les montants se concentrent dans des transferts conformes à l'intention (c, d) et dans la perte de clés (e).
12. Incomparables : FBI 11,4 Md$ (US, déclaré) contre Chainalysis ≥ 14 Md$ (on-chain) contre TRM ≈ 35 Md$ (périmètre non retrouvé) contre Cyvers 15,9 Md$ ; 713 M$ n'est pas 723 M$ ; 83,8 M$ USENIX n'est pas annuel.

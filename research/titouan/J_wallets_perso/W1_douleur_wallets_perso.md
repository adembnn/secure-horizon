# W1 : la douleur des wallets personnels, 2024-2026

Rédigé le 10 oct. 2026. Étiquettes : [P] primaire (publié par l'éditeur ou l'auteur), [S] presse, [V] vendeur de sécurité. Les chiffres de chaque éditeur ont un périmètre propre. Ne pas les additionner.

## Résumé en 8 lignes
1. Chainalysis (page lue via WebFetch, relayée par The Block) : 158 000 compromissions de wallets perso en 2025, au moins 80 000 victimes, 713 M$ volés (1,5 Md$ en 2024). Plus de victimes, moins de dollars par victime.
2. Scam Sniffer [P] : les drainers ont pris 83,85 M$ à 106 106 wallets EVM en 2025, contre 494 M$ et 332 000 adresses en 2024. Perte moyenne 790 $ en 2025.
3. Les pertes se concentrent : 11 cas au-dessus d'1 M$ font 27 % du total 2025 (30 cas, 171 M$ en 2024). Le plus gros de 2025 : 6,5 M$ par signature Permit.
4. Address poisoning : étude CMU [P] sur juil. 2022 à juin 2024, 270 M de tentatives, 6 633 pertes réelles, 83,8 M$ minimum. Cas isolé de 49,99 M USDT en déc. 2025 [S].
5. Faux support et ingénierie sociale : pas de total annuel fiable. ZachXBT [S] : 65 M$ volés à des clients Coinbase en deux mois (déc. 2024 à janv. 2025) et un vol de 330 M$ en BTC contre un retraité américain en avril 2025.
6. Wrench : Chainalysis [S] 58 M$ de vols réussis en 2025 (record), plus de 30 M$ au S1 2026. Détails dans les deux documents existants, non refaits ici.
7. EIP-7702 : cas documentés de 0,15 M$ à plus de 3 M$, 2,54 M$ pour les 2 gros cas d'août 2025 (Scam Sniffer). Aucun total annuel fiable.
8. Wallets d'agents IA : seul cas récent chiffré, Grok/Bankr, 4 mai 2026, 150 à 180 k$, environ 80 % rendus selon Giskard [V]. Infostealer sur wallets perso : aucun chiffre fiable trouvé.

## Tableau par type de perte

NT = non trouvé. Les colonnes ne sont comparables qu'au sein d'une même ligne.

| Type | Éditeur et périmètre | Victimes | Pertes totales | Perte moyenne ou médiane | Plus gros cas | Part récupérée | Évolution 2024 à 2026 | Source |
|---|---|---|---|---|---|---|---|---|
| Toutes compromissions de wallets perso | Chainalysis [S], tous vecteurs | 2025 : au moins 80 000 victimes uniques, 158 000 incidents. 2024 : NT | 2025 : 713 M$ (20 % du total volé). 2024 : 1,5 Md$ (44 %) | Non publié. Dérivé par moi : ~8 900 $ par victime, ~4 500 $ par incident | NT | NT | Victimes en hausse, dollars en baisse. 2026 : NT | https://www.theblock.co/post/382477/crypto-hack-2025-chainalysis ; https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/ |
| Drainers et signatures (Permit, setOwner) | Scam Sniffer [P], phishing par site web, EVM seulement. Exclut hacks, exchanges, contrats | 2024 : 332 000 adresses. 2025 : 106 106 (-68 %) | 2024 : 494 M$ (+67 %). 2025 : 83,85 M$ (-83 %) | 2025 : 790 $ en moyenne (Q1 969, Q4 580). 2024 : ~1 490 $ (mon calcul). Médiane NT | 2024 : 55,48 M$ (août). 2025 : 6,5 M$ Permit (sept.) | NT | Chute en 2025. Janv. 2026 : 6,27 M$, 4 741 victimes, 2 victimes font 65 % [S]. Fév. à sept. 2026 : NT | https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ ; https://drops.scamsniffer.io/scam-sniffer-2024-web3-phishing-attacks-wallet-drainers-drain-494-million/ ; https://cointelegraph.com/news/crypto-phishing-losses-fell-83-percent-2025-wallet-drainers |
| Phishing, vue CertiK | CertiK [V], incidents publics, tous vecteurs de phishing | 248 incidents en 2025 | 722,9 M$ en 2025 | ~2,9 M$ par incident (mon calcul, périmètre mêlé aux gros vols) | NT | NT | 2024 : NT | https://www.certik.com/zh-CN/blog/hack3d-the-web3-security-report-2025 (lu via résumé de presse) |
| Délégation EIP-7702 | Scam Sniffer [P] (cas > 1 M$ seulement), Wintermute [V], Qi et al. [P, arXiv] | Wintermute [V] : plus de 450 000 adresses ayant délégué à des contrats malveillants (via AMBCrypto, source primaire NT). Ce sont des adresses exposées, pas des pertes. | 2 gros cas d'août 2025 : 2,54 M$. Total annuel : NT | NT | Plus de 3 M$ pour un utilisateur en août 2025 [S]. arXiv : plus de 3 300 ETH pour la plus grosse victime | NT | Apparu après Pectra (mai 2025). S1 2026 : Beosin [V] le range parmi les risques majeurs, chiffres non lus (PDF image) | https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ ; https://arxiv.org/abs/2512.12174v1 ; https://ambcrypto.com/ethereum-phishing-scams-12m-lost-in-august-as-eip-7702-exploits-surge/ ; https://beosin.com/resources/2026_H1_Global_Web3_Security_Report.pdf |
| Address poisoning | Étude CMU (Tsuchiya, Dong, Christin, Soska) [P], Ethereum et BSC, juil. 2022 à juin 2024. Cyvers [V] pour des mois de 2025 | 17,4 M d'adresses visées, 6 633 pertes réelles (Ethereum 1 738, BSC 4 895) | 83,8 M$ minimum (Ethereum 79,3 M$, BSC 4,5 M$). Cyvers : 1,8 M$ en fév. 2025, 1,2 M$ en mars 2025 | Ethereum : moyenne 45 653 $, médiane 2 160 $. BSC : moyenne 1 164 $, médiane 85 $ | Étude : 20 M$ (Ethereum). Déc. 2025 : 49,99 M USDT [S]. Début 2026 : 4 556 ETH, 12,25 M$ [S] | Non chiffré. Tether a bloqué une adresse d'attaquant en moins d'une heure (étude) | Gros cas isolés fin 2025 et début 2026. Total annuel 2025 : NT. Un chiffre de 3,4 Md$ attribué à l'address poisoning dans un relais est une erreur de lecture (c'est le total des hacks) | https://arxiv.org/html/2501.16681v3 ; https://cointelegraph.com/news/address-poisoning-scams-cost-crypto-users-1-2m-march-2025 ; https://cointelegraph.com/news/address-poisoning-copy-paste-mistake-50m-usdt-loss |
| Faux support, ingénierie sociale | ZachXBT, enquêteur indépendant [S], pas de série d'éditeur | Total : NT. Un cas : plus de 30 vols liés à une seule adresse (juin 2025) | 65 M$ en deux mois chez Coinbase (déc. 2024 à janv. 2025, estimation basse). "Plus de 300 M$ par an" pour les clients Coinbase (début 2025, fiabilité faible). 2 M$ pour un faux support canadien en 2025 | NT | 330 M$ (3 520 BTC), retraité américain, 28 avril 2025 | ~7 M$ gelés avec Binance dans le cas des 330 M$, soit ~2 % | Pas de série 2024 à 2026 | https://www.theblock.co/post/352572/zachxbt-says-330-million-bitcoin-theft-victim-is-an-elderly-person-in-us ; https://www.theblock.co/post/352987/zachxbt-says-bitcoiner-millions-stolen-crypto-frozen-binance ; https://forklog.com/en/coinbase-clients-lose-over-65-million-to-scammers-in-two-months/ ; https://cointelegraph.com/news/fake-coinbase-help-desk-scammer-allegedly-stole-2m |
| Fraude crypto, vue FBI | FBI IC3 [P via presse], victimes américaines, fraude déclarée (pas des compromissions de wallets) | 181 565 plaintes crypto en 2025 (+21 %) ; 18 589 victimes à plus de 100 k$ | 11,366 Md$ crypto en 2025 ; 7,2 Md$ en investissement ; 389 M$ en distributeurs crypto | Moyenne 62 604 $ par plainte crypto | NT | NT | 2024 : 859 532 plaintes toutes catégories, 16,6 Md$ | https://www.theblock.co/amp/post/397134/fbi-says-crypto-related-fraud-losses-hit-record-11-4-billion-in-2025-with-seniors-bearing-the-brunt |
| Seed ou appareil volé par infostealer | Aucun éditeur trouvé qui isole les wallets perso | NT | NT | NT | Trust Wallet, extension piégée (chaîne d'approvisionnement, pas un infostealer) : ~7 M$, ~2 520 à 2 596 wallets, 24 au 26 déc. 2025 [S, Halborn V] | Remboursement par Trust Wallet | Torg Grabber cible 728 wallets parmi 850 extensions (Gen Digital [V], mars 2026). SlowMist [V] T3 2025 : 317 signalements de vol de clé, 3,73 M$ gelés ou récupérés dans 10 cas | https://www.bleepingcomputer.com/news/security/trust-wallet-confirms-extension-hack-led-to-7-million-crypto-theft ; https://www.bleepingcomputer.com/news/security/new-torg-grabber-infostealer-malware-targets-728-crypto-wallets/ ; https://cryptopotato.com/private-key-leakage-remains-the-leading-cause-of-crypto-theft-in-q3-2025/ |
| Wrench (déjà traité) | Chainalysis [S] ; CertiK [V] ; Lopp [P] | 46 attaques documentées à fin juin 2026 | 58 M$ de vols réussis en 2025 ; plus de 30 M$ au S1 2026. CertiK S1 2026 : 52 incidents, 124 M$ d'exposition, périmètre différent | Non publié | Voir les deux documents | Taux de paiement 67 % (2024), 49 % (2025), 26 % (S1 2026) | Hausse forte, succès en baisse | research/docs/wrench_attacks_factcheck.md ; research/docs/kidnapper_modus_operandi.md |
| Wallets d'agents IA | Giskard [V], Valens [V], AMBCrypto [S] | 1 wallet (Grok) | 4 mai 2026 : ~3 Md de jetons DRB, 150 à 180 k$ selon les sources. AIXBT, 18 mars 2025 : ~55 ETH, 100 à 106 k$ via un accès au tableau de bord (cause disputée par l'équipe) | NT | Grok/Bankr : ~175 k$ | ~80 % rendus (Giskard) | Deux cas chiffrés, de l'ordre de 0,1 à 0,2 M$ chacun. Prompt injection par code Morse en 2026. Étude Princeton et Sentient [P, arXiv] sur l'empoisonnement de mémoire d'ElizaOS : démonstration, aucune perte chiffrée | https://vibegraveyard.ai/story/bankr-grok-morse-prompt-injection-wallet-drain/ ; https://www.theblock.co/news/regulation/2025-03-18-ai-crypto-bot-aixbt-lost-eth-hack-unauthorized-dashboard-access-346911 ; https://arxiv.org/html/2503.16248v1 |

## Classement des 5 douleurs

Les montants viennent d'éditeurs différents. Le classement est une lecture d'ordre de grandeur, pas une somme.

### Par pertes (dernier chiffre disponible)
1. Faux support et ingénierie sociale : ordre de 10^8 $ par an (330 M$ pour un seul cas en 2025 ; 65 M$ en deux mois chez Coinbase). Fiabilité faible, aucun total d'éditeur.
2. Drainers et signatures : 494 M$ (2024), 83,85 M$ (2025). Seule série annuelle régulière (Scam Sniffer).
3. Address poisoning : 83,8 M$ sur deux ans (CMU), plus des cas isolés de 50 M$ (déc. 2025) et 12,25 M$ (début 2026).
4. Wrench : 58 M$ en 2025, plus de 30 M$ au S1 2026 (Chainalysis).
5. EIP-7702 : au moins 2,54 M$ en grosses affaires d'août 2025. Sous-estimé, pas de total.
Hors classement faute de chiffre : infostealer (NT), agents IA (~0,2 M$ par cas).

### Par nombre de victimes
1. Drainers : 332 000 adresses (2024), 106 106 (2025).
2. EIP-7702 : plus de 450 000 adresses délégantes malveillantes (Wintermute [V], source primaire NT). Adresses exposées, pas victimes avec perte.
3. Address poisoning : 6 633 pertes réelles sur 2 ans (17,4 M d'adresses visées, 0,01 % de réussite sur Ethereum).
4. Wrench : 46 attaques documentées à mi-2026 (72 en 2025 selon CertiK, 86 selon le comptage Lopp).
5. Faux support : NT (quelques dizaines de cas nommés, pas de série).
Non classé : l'ensemble des compromissions, 80 000 victimes uniques en 2025 (Chainalysis), qui inclut tout ce qui précède.

## Écarts de périmètre à retenir
- Chainalysis 2025 (713 M$) couvre toutes les compromissions de wallets perso. Scam Sniffer (83,85 M$) ne couvre que les drainers sur EVM. CertiK (722,9 M$ de phishing) mêle des gros vols et d'autres publics. Ces chiffres ne se contredisent pas.
- FBI IC3 (11,4 Md$) mesure des fraudes déclarées par des Américains, surtout d'investissement. Ce n'est pas la perte de wallets.
- Immunefi et Cyvers publient surtout des pertes de protocoles et de hacks. Aucun total phishing isolé pour 2025 trouvé. Cyvers donne seulement des mois d'address poisoning.

## Limites
- Chainalysis, CertiK, Cyvers, Beosin lus via résumés de WebFetch ou presse, pas en texte intégral. Le PDF arXiv sur l'EIP-7702 n'a pas livré ses chiffres.
- Moyennes dérivées (~8 900 $, ~1 490 $, ~2,9 M$) : mes calculs, pas des chiffres d'éditeurs.
- Les chiffres Scam Sniffer de janv. 2026 (6,27 M$) et le cas de 12,25 M$ viennent de relais de presse.
- Sans source primaire : "300 M$ par an" Coinbase, 450 000 adresses Wintermute. À traiter comme indicatifs.
- Les comptes wrench CertiK (72 en 2025) et Lopp (86) viennent du document wrench déjà fait.

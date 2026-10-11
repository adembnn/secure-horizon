# Z5. Données récentes (2024 à oct. 2026) sur approbations, permis et pertes

Date de la recherche : 11 oct. 2026. Lecture seule, aucun compte.
Légende : [V] = page lue via WebFetch (résumé par un petit modèle, donc relire avant de citer mot pour mot). [NV] = vu seulement dans un résultat de recherche ou un média qui cite. P = rapport primaire. M = média qui cite.
Limites : Reddit et X non consultés (non testés, hors périmètre des outils). Aucun accès direct aux PDF complets (Chainalysis, CertiK, SlowMist). Rien de trouvé pour Hacken, Immunefi (hors Q1 2025), TRM (hors Coldcard), SlowMist, De.Fi, Cyvers sur le sujet : voir "introuvable".

## (a) Part des approbations ERC-20 illimitées

| Chiffre | Population / méthode | Date donnée | Source | V/NV |
|---|---|---|---|---|
| 60 % (15,2 M sur 25,4 M approbations) ; 60 % des utilisateurs uniques ; 22 % à haut risque | Ethereum, transactions jusqu'au 31 juil. 2021, mesure académique (RAID 2022). Référence historique, pas récente | 2021 | arxiv.org/abs/2207.01790 (P) | NV (vu en résumé) |
| 13,9 % des approbations ERC-20 "encore illimitées" | Aucune population, aucune fenêtre, aucune méthode, aucune source. Post KuCoin Square, daté seulement "il y a 4 semaines" | environ 2026, date exacte inconnue | kucoin.com/square/post/content_6aa7c48551e30d0007e12b85 (M, faible) | V |
| ~45 % | Notre échantillon, 200 blocs Ethereum | interne | repo, dossier onchain | interne |
| Étude récente (2024 à 2026) mesurant la part illimitée | introuvable | | | |

Lecture : le seul chiffre indépendant et daté est celui de 2021. Le 13,9 % n'est pas citable. Notre 45 % est la seule mesure récente documentée, avec ses limites d'échantillon.

## (b) Permit2, EIP-2612, portefeuilles, IA

| Chiffre | Détail | Date | Source | V/NV |
|---|---|---|---|---|
| 3,1 M d'adresses Ethereum ont autorisé le contrat Permit2 | Compte Dune cité par un Medium. Mesure l'adoption, pas la part des volumes | avril 2025 | medium.com/@gwrx2005/permit2-a-next-generation-token-approval-mechanism-7603d292ddfc (M) | NV |
| Permit2 : signatures limitées dans le temps (30 jours côté appli Uniswap) et optionnellement en montant | Doc éditeur | 2025/2026 | support.uniswap.org/hc/en-us/articles/39683402190733 (P éditeur) | NV |
| L'approbation initiale vers Permit2 est typiquement illimitée (master approval) | Le risque se déplace vers un contrat central | 2025/2026 | guides tiers (gate.com/learn, eco.com) (M) | NV |
| MetaMask : le cap personnalisé est proposé, Swaps reste illimité par défaut sur le mainnet, non illimité sur les L2 | Pages d'aide MetaMask, vers début 2025 | ~2025 | support.metamask.io/stay-safe/safety-in-web3/why-does-swaps-use-unlimited-token-approvals/ (P éditeur) | NV |
| Rabby : montant personnalisé depuis v0.8 (ancien) | Pas de changement de défaut en 2025 trouvé | ancien | medium.com/@rabby_io/rabby-release-v0-8-70e5d175e748 (P éditeur) | NV |
| Coinbase Wallet, Phantom, Trust, Core : défauts d'approbation | introuvable | | | |
| Part des approbations exactes vs illimitées via Permit2 / EIP-2612 | introuvable (aucune étude on-chain trouvée) | | | |
| IA / agents : aucune étude mesurant combien d'agents signent des approbations illimitées | introuvable | | | |
| Coinbase Agentic Wallets lancés le 11 fév. 2026, limites de dépense programmables, clés en TEE | Annonce relayée par un blog | fév. 2026 | autheo.com/signals/coinbase-ai-agents-future-crypto-april-2026 (M) | NV |
| Risque x402 : allowances larges et session keys longues amplifient la perte | Analyse de commentaire, pas une mesure | juin 2026 | cryptodaily.co.uk/2026/06/x402-security-ai-agent-payment-bugs (M) | NV |

## (c) Pertes récentes

| Chiffre | Population / méthode | Date | Source | V/NV |
|---|---|---|---|---|
| ScamSniffer : 83,85 M$ de pertes, 106 106 victimes en 2025 (494 M$ et 332 000 victimes en 2024 ; baisse de 83 % et 68 %) | Drainers par sites de phishing sur chaînes EVM seulement. Exclut hacks, bourses, exploits. Borne basse. Valeur USD au moment du vol | année 2025, publié 3 janv. 2026 | drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ (P) | V |
| Perte moyenne par victime 790 $ (1 488 $ en 2024) | idem | 2025 | idem | V |
| 11 cas de plus de 1 M$ en 2025 (30 en 2024) ; total des gros cas 22,98 M$ (27 % du total) | idem | 2025 | idem | V |
| Gros cas par type : Permit/Permit2 3 cas, 8,72 M$ (38 % des pertes des gros cas) ; Approve/increaseApproval 3 cas, 5,62 M$ ; Transfer 2 cas, 4,87 M$ ; EIP-7702 batch 2 cas, 2,54 M$ ; setApprovalForAll 1 cas, 1,23 M$ | Seulement les cas de plus de 1 M$. Ce n'est pas la part de toutes les pertes | 2025 | idem | V |
| Donc Permit + Approve + setApprovalForAll = 15,57 M$ sur 22,98 M$ des gros cas, soit environ 68 % (calcul maison à partir du tableau) | Calcul nôtre, à étiqueter comme tel | 2025 | calcul sur idem | V (tableau) |
| Plus gros vol : 6,5 M$, sept. 2025, signature Permit (stETH, aEthWBTC) | idem | sept. 2025 | idem | V |
| Part des pertes totales (tous montants) par approbation illimitée ou permit | introuvable (ScamSniffer ne la donne pas sur la page lue) | | | |
| Trimestres 2025 : T1 21,94 M$, T2 17,78 M$, T3 31,04 M$, T4 environ 13,09 M$ | Relais média du rapport | 2025 | coincentral.com/scam-sniffer-crypto-phishing-losses-fall-to-83m-in-2025/ (M) | NV |
| ScamSniffer janv. 2026 : 6,27 M$, 4 741 victimes, hausse de 207 % vs déc. 2025. Deux victimes = 65 % du total (dont 3,02 M$ via permit + increaseAllowance, et 1,08 M$ via permit) | Signature phishing, relais média du rapport mensuel | janv. 2026 | decrypt.co/357450/signature-phishing-up-200-as-january-losses-pass-6m ; kucoin.com/news/flash/scam-sniffer-report-4-741-victims-lost-6-27m-in-signature-phishing-attacks-in-january-2026 (M) | NV |
| ScamSniffer rapport premier semestre 2026 | introuvable (recherches ciblées, rien d'indexé). Février à octobre 2026 : introuvable | | | |
| CertiK Hack3D 2025 : 3 352 850 816 $ de pertes totales (2 446 285 251 $ en 2024) ; phishing 722 885 398 $ sur 248 incidents | Tous vecteurs, périmètre CertiK | année 2025 | certik.com/blog/hack3d-the-web3-security-report-2025 (P) | NV (chiffres vus en résumé de recherche) |
| CertiK Hack3D H1 2026 : 1 315 676 432 $, 344 incidents ; phishing 366 312 027 $ sur 63 incidents (132 incidents au S1 2025, baisse de 52,3 %, pertes en baisse de 10,8 %) ; 4 attaques d'ingénierie sociale ciblée = environ 85 % des pertes de phishing ; compromission de portefeuille 444 531 691 $ sur 33 incidents (Kelp DAO RPC 291 M$ et Drift 285 M$, avril 2026) | Pas de ventilation approbation/permit sur la page lue | S1 2026 | certik.com/skynet-report/certik-hack3d-h1-2026-report (P) | V |
| Chainalysis rapport 2026 : 17 Md$ estimés volés par arnaques et fraudes en 2025 (au moins 14 Md$ reçus on-chain) ; paiement moyen 782 $ (2024) vers 2 764 $ (2025), +253 % ; arnaques assistées par IA 4,5 fois plus rentables | Arnaques au sens large, pas les drainers. Ne mentionne ni address poisoning ni approval phishing sur la page lue | publié 13 janv. 2026, données 2025 | chainalysis.com/blog/crypto-scams-2026/ (P) | V |
| Chainalysis : approval phishing, environ 1 Md$ depuis mai 2021 puis plus de 2,7 Md$ cumulés | Chiffre cumulé ancien (articles antérieurs), dates exactes non confirmées | avant 2026 | chainalysis.com/blog/approval-phishing-cryptocurrency-scams-2023/ (P) | NV |
| Chainalysis, approval phishing, billet pédagogique : opérations Atlantic (plus de 20 000 victimes, plus de 12 M$ gelés) | Opérations policières | page du 17 juin 2026 | chainalysis.com/blog/what-is-approval-phishing/ (P) | V |
| Immunefi : T1 2025 pire trimestre, 1,64 Md$ | Hacks, pas signatures | T1 2025 | via agrégateurs | NV |
| Hacken, SlowMist, De.Fi, Cyvers, TRM (part approbation/permit) | introuvable | | | |
| Ordre de grandeur d'autres suivis : PeckShield 1,37 Md$ de pertes liées aux arnaques en 2025 | Relais Yahoo | 2025 | finance.yahoo.com/news/2025-marks-worst-record-crypto-121306375.html (M) | NV |

## (d) Nouveaux vecteurs 2025 à 2026

| Chiffre | Détail | Date | Source | V/NV |
|---|---|---|---|---|
| EIP-7702 : deux cas de plus de 1 M$ en août 2025 (1,54 M$ et 1,00 M$), total 2,54 M$ | Signatures batch après Pectra | août 2025 | drops.scamsniffer.io (rapport 2025) (P) | V |
| Wintermute : environ 1,58 M de délégations en quelques semaines, 48 % (768 275) taguées criminelles, plus de 97 % vers quelques familles de contrats sweeper | Données post-Pectra mai à juin 2025 | 2025 | relayé par cryptobull/zealynx, hoge.gg (M) ; rapport Wintermute non lu | NV |
| Étude USENIX citée : 63 % des délégations observées vers des contrats malveillants, 2,36 M$ de pertes confirmées, 10,14 M$ exposés | Étude non lue | 2025 | relais secondaire (M) | NV |
| Address poisoning (Blockaid) : plus de 65,4 M de transactions depuis janv. 2025 (environ 160 000 par jour), environ 316 000 attaques confirmées, soit environ 1 sur 200 ; 628 000 (nov. 2025) vers 3,4 M (janv. 2026), x5,5 | Comptage maison de Blockaid, méthode de classement non expliquée | janv. 2025 à janv. 2026 | blockaid.io/blog/address-poisoning-the-growing-threat-draining-millions-from-crypto-users (P, vendeur) | V |
| Address poisoning : 50 M$ USDT en déc. 2025 (copie d'adresse 26 min après un test) ; environ 12,4 M$ (4 556 ETH) le 30 janv. 2026 | Deux victimes uniques | déc. 2025, janv. 2026 | idem Blockaid (P) ; Scam Sniffer cité par crypto.news (M) | V (Blockaid) |
| Blockaid attribue la hausse à Fusaka (3 déc. 2025, frais divisés par environ 6). Thèse, pas une mesure causale | | déc. 2025 | idem | V |
| Permit2 phishing : cas 1,00 M$ "Uniswap Permit2", janv. 2025 | Dans le tableau ScamSniffer | janv. 2025 | rapport ScamSniffer 2025 (P) | V |
| Seaport : introuvable (aucune donnée récente trouvée) | | | | |
| Agents IA qui signent : introuvable en mesure. Cas isolé : un portefeuille de dev Ethereum vidé par une extension IA malveillante (titre vu, non lu) | | 2026 | tradingview.com/news/cointelegraph:9b6c4b40e094b:0 (M) | NV |
| Vague de vidages sur EVM janv. 2026, 107 000 $ et plus, comptes de moins de 2 000 $, cause racine inconnue selon ZachXBT | Sans lien établi avec les approbations (un relais dit "approbations de contrats", non confirmé) | janv. 2026 | finance.yahoo.com/news/hundreds-wallets-drained-evm-chains-131715732.html (M) | NV |

## (e) Avalanche 2025 à 2026

| Chiffre | Détail | Date | Source | V/NV |
|---|---|---|---|---|
| Blockaid intégré à Core (alertes en temps réel, simulation de transaction) | Annonce vendeur. Chiffres de Blockaid : 7,1 Md$ protégés, 1,3 M d'attaques évitées (auto-déclarés) | 5 juin 2024 | blockaid.io/blog/blockaid-bolsters-security-on-avalanche-with-core-integration (P, vendeur) | V |
| Incident drainer ou phishing propre à Core ou Avalanche en 2025 ou 2026 | introuvable (absence de résultat ne prouve pas l'absence d'incident) | | | |
| Taux de faux positifs de Blockaid sur Core | Critique rapportée par un média, pas de mesure | 2024 | cointelegraph.com/news/avalanche-core-wallet-blockaid-security-integration (M) | NV |
| Part Avalanche dans ScamSniffer ou CertiK | introuvable (CertiK H1 2026 nomme Ethereum 153 incidents / 522,8 M$ et Solana 315,1 M$, pas Avalanche ; ScamSniffer ne couvre que "EVM" sans détail par chaîne) | S1 2026 | certik.com (V) | V |

## Ce qu'on peut citer au jury

1. ScamSniffer, rapport 2025 (primaire, lu) : 83,85 M$ et 106 106 victimes en 2025, contre 494 M$ et 332 000 en 2024. Précision obligatoire : drainers par sites de phishing sur EVM, borne basse.
2. Dans les 11 cas de plus de 1 M$ de 2025, le Permit/Permit2 pèse 38 % des pertes et les signatures d'approbation (Permit, Approve, setApprovalForAll) environ 68 % (calcul maison). Dire "gros cas" et jamais "toutes les pertes".
3. Perte moyenne par victime : 790 $ en 2025. La douleur est plus fréquente que spectaculaire.
4. CertiK S1 2026 (primaire, lu) : le phishing a coûté 366 M$ sur 63 incidents, mais environ 85 % viennent de 4 attaques d'ingénierie sociale ciblée. Ce n'est pas de l'approbation de masse.
5. Blockaid (primaire vendeur, lu) : address poisoning x5,5 de nov. 2025 à janv. 2026, avec un cas à 50 M$. À citer comme "selon Blockaid".
6. Le chiffre de 60 % de 2021 est historique : le citer avec sa date et comme point de comparaison.
7. L'intégration Blockaid dans Core date de juin 2024 (annonce vendeur).
8. Notre mesure de ~45 % est la seule récente et vérifiable : à citer avec sa méthode (200 blocs, Ethereum, dates).

## À ne pas citer

1. Le 13,9 % (KuCoin Square) : aucune population, fenêtre ni source. Ne pas l'opposer au 45 %.
2. "Le Permit représente X % de toutes les pertes" : aucune source ne le donne.
3. Les chiffres d'EIP-7702 de Wintermute et d'USENIX : lus seulement par relais. Ne citer que les 2,54 M$ de ScamSniffer.
4. Le cumul Chainalysis de 2,7 Md$ pour l'approval phishing : daté et non relu.
5. Tout chiffre "H1 2026 de ScamSniffer" : il n'existe pas dans ce qu'on a trouvé.
6. Les blogs agrégateurs (CoinLaw, NFT Plazas, deepstrike, hoge.gg, cryptocompassnews) : ils recopient et se contredisent.
7. Tout chiffre sur MetaMask, Rabby, Phantom, Coinbase, Trust ou Core "qui passent à l'approbation exacte" : rien de prouvé.
8. Ne pas additionner ScamSniffer (EVM, drainers), CertiK (tous vecteurs) et Chainalysis (arnaques larges) : périmètres différents.

## Ce que ça change pour Hold up

- La douleur baisse en valeur et en nombre de victimes d'un rapport à l'autre sur le périmètre drainers EVM (494 à 84 M$, 332 000 à 106 000 victimes, 2024 vers 2025). ScamSniffer met en garde : une partie de la baisse peut venir d'attaques moins traçables. Elle n'a donc pas disparu, elle s'est déplacée et concentrée.
- Janvier 2026 montre un retour de la signature phishing (6,27 M$, +207 % sur un mois), mais porté par deux victimes (65 %). Logique "chasse aux baleines" : peu de victimes, grosses pertes.
- Où est la douleur : (1) les permis hors chaîne (Permit, Permit2), principal type de gros vol en 2025, invisibles dans un historique de transactions ; (2) l'address poisoning, en forte hausse et sans approbation du tout ; (3) EIP-7702, nouveau mais petit en montants confirmés (2,54 M$) ; (4) l'ingénierie sociale ciblée, qui domine les pertes de phishing de CertiK en 2026.
- Pour la thèse "approbation illimitée" : on n'a aucune preuve récente indépendante que la part illimitée a baissé (le 13,9 % est inutilisable). Permit2 déplace une approbation illimitée vers un contrat central et rend les autres limitées dans le temps. L'effet net sur la part exacte est introuvable.
- Conséquence produit : couvrir les signatures hors chaîne (Permit, Permit2, 7702) et l'address poisoning, pas seulement le `approve` illimité. Sur Avalanche, aucun incident Core trouvé et Blockaid y est déjà présent depuis 2024 : l'avantage différenciant est à argumenter sans chiffre local.
- À faire pour combler les trous : mesurer nous-mêmes (Dune ou RPC) la part illimitée, Permit2 et Permit sur Ethereum et Avalanche C-Chain sur 2025 et 2026 ; relire les PDF complets CertiK 2025, SlowMist, Hacken ; revérifier ScamSniffer sur son site ou X (non consultés) pour le S1 2026.

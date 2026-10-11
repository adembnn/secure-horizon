# Hold up : la douleur est-elle réelle ? Les chiffres, sourcés

Date de lecture : 2026-10-11. Toutes les URL ont été lues ce jour.

Légende de fiabilité :
- [A] source publique ou évaluée par les pairs, lue à la source (FBI IC3, USENIX, NDSS, RAID).
- [B] rapport d'un éditeur, lu à la source. Conflit d'intérêt : l'éditeur vend de la sécurité ou de l'analyse. Méthode peu ou pas décrite.
- [C] relais de presse ou page tierce. Non vérifié à la source primaire.
- [calcul] division ou addition faite par moi à partir de chiffres sourcés. Pas dans la source.

Réserve de méthode : l'outil de lecture résume les pages web. Les pages du FBI IC3 ont été lues directement en image (plus sûr). Pour le reste, relire la phrase exacte à l'URL avant de la mettre sur une slide.

## TL;DR
1. La douleur visée par Hold up existe et elle est mesurée : 83,85 M$ volés à 106 106 adresses en 2025 par signature sur un site de phishing (chaînes EVM, borne basse, Scam Sniffer). Mais elle a chuté de 83 % en un an (494 M$ en 2024).
2. Elle est petite face à la fraude crypto totale : environ 0,6 % des 14 Md$ d'arnaques mesurés par Chainalysis en 2025 [calcul, périmètres différents]. Le gros des pertes (investissement, faux support) est une fraude où la victime fait ce qu'elle voulait. Hold up ne l'adresse pas.
3. La donnée décisive n'existe pas. Aucune source lue ne mesure la part des victimes qui avaient une alerte et ont continué, ni un taux de contournement des alertes. On a seulement des cas techniques documentés de contournement (2023, 2024, 2025).
4. Aucune étude ne mesure ce que la victime croyait signer. Le meilleur indice est indirect : les fonctions piégées s'appellent « Claim » ou « SecurityUpdate » (article NDSS).
5. Avalanche : aucun chiffre par chaîne. Aucun des 30 gros vols de 2024 n'est sur Avalanche. Parts de marché des portefeuilles : non retrouvées à une source primaire.

## (a) Tableau des chiffres

### A1. Vérification des chiffres donnés en mémoire

| Chiffre en mémoire | Verdict | Chiffre exact à la source | Périmètre et méthode | Source | Fiab. |
|---|---|---|---|---|---|
| Scam Sniffer 2024 : ~494 M$, ~332 000 victimes, +67 % | Confirmé, avec une précision | « approximately $494 million », +67 %. Victimes : 332 000 adresses, +3,7 % seulement | Chaînes EVM. Drainers via sites de phishing. Pas de section méthode. Publié le 3 janv. 2025 | https://drops.scamsniffer.io/scam-sniffer-2024-web3-phishing-attacks-wallet-drainers-drain-494-million/ | B |
| Permit ~56,7 % des gros vols | Confirmé, mais périmètre étroit | Permit 56,7 %, setOwner 31,9 %, Transfer 4,5 %, increaseAllowance 3,5 %, autres 3,4 % | Part des pertes des 30 vols de plus d'1 M$ seulement (171 M$ au total). Ce n'est pas la part de toutes les pertes | même URL | B |
| Scam Sniffer 2025 : ~84 M$, ~106 000 victimes | Confirmé | 83,85 M$, 106 106 victimes. -83 % et -68 % sur un an | EVM. « Wallet drainer attacks via phishing websites only ». « Lower bound estimate ». Valeur en USD au moment du vol. Publié le 3 janv. 2026 | https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ | B |
| FBI IC3 2024 : ~9,3 Md$ crypto, dont 5,8 Md$ investissement | Confirmé | 9 322 335 911 $, 149 686 plaintes, +66 %. Investissement crypto : 41 557 plaintes, 5 819 531 069 $, +47 % | Plaintes déposées auprès de l'IC3 (surtout États-Unis). Pertes déclarées par les plaignants. Le « descripteur crypto » marque le moyen utilisé | https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf (p. 35 à 38) | A |
| Chainalysis, arnaques 2024 | Confirmé, chiffre révisé depuis | Au moins 9,9 Md$ (13 fév. 2025), « could surpass the $12 billion ». Révisé à 12 Md$ dans le rapport de janv. 2026 | Flux reçus sur la chaîne par des adresses d'arnaque identifiées. Borne basse qui monte avec le temps | https://www.chainalysis.com/blog/2024-pig-butchering-scam-revenue-grows-yoy/ ; https://www.chainalysis.com/blog/crypto-scams-2026/ | B |
| Chainalysis, arnaques 2025 | Confirmé | Au moins 14 Md$ reçus sur la chaîne. « could exceed $17 billion » : c'est une projection, pas une mesure | Même méthode. Projection fondée sur une hausse moyenne de 24 % entre deux recalculs. Publié le 13 janv. 2026 | https://www.chainalysis.com/blog/crypto-scams-2026/ | B |
| Empoisonnement d'adresse, Carnegie Mellon : ~270 M de tentatives, 83,8 M$ | Confirmé | 270 M d'attaques sur la chaîne, 17 M de victimes (adresses ciblées), 6 633 incidents, au moins 83,8 M$ | Ethereum et BNB Smart Chain, deux ans. Tsuchiya, Dong, Soska, Christin. USENIX Security 2025, p. 1243-1262 | https://www.usenix.org/conference/usenixsecurity25/presentation/tsuchiya | A |

Aucun chiffre de la liste n'est faux. Trois sont à nuancer : le 56,7 % (30 cas seulement), le « +67 % » (les victimes n'ont monté que de 3,7 %), et le « 17 Md$ » de Chainalysis (projection).

### A2. Question 1 : phishing par signature et drainers, par an

| Année | Pertes | Victimes (adresses) | Plus gros vol | Vols de plus d'1 M$ | Source | Fiab. |
|---|---|---|---|---|---|---|
| 2023 | 295 M$ (le titre dit « $300 Million ») | 324 000 (le titre dit « 320,000 ») | 24,05 M$ | 13 (environ 50 M$) | https://drops.scamsniffer.io/scam-sniffer-2023-crypto-phishing-scams-drain-300-million-from-320000-users/ | B |
| 2024 | 494 M$ | 332 000 | 55,48 M$ | 30 (171 M$) | rapport 2024 (URL ci-dessus) | B |
| 2025 | 83,85 M$ | 106 106 | 6,5 M$ (Permit, septembre) | 11 (22,98 M$, 27 % du total) | rapport 2025 (URL ci-dessus) | B |
| 2026 | Non retrouvé à la source. Aucun rapport 2026 sur le site de Scam Sniffer | — | — | — | https://drops.scamsniffer.io/ | — |

2026, relais de presse seulement : un article PANews du 8 fév. 2026 attribue à Scam Sniffer 4 741 victimes et environ 6,27 M$ pour janvier 2026 (+207 % sur décembre). Non vérifié à la source. Ne pas utiliser. [C]

Perte moyenne par victime : environ 1 488 $ en 2024 et 790 $ en 2025 [calcul]. Le rapport 2025 donne par trimestre 969 $, 848 $, 778 $, 580 $.

Répartition par type de signature (seulement pour les vols de plus d'1 M$) :

| Type | 2024 (30 cas, 171 M$) | 2025 (11 cas, 22,98 M$) |
|---|---|---|
| Permit / Permit2 | 56,7 % (Permit) | 3 cas, 8,72 M$, 38 % |
| setOwner | 31,9 % | — |
| Approve / increaseApproval / increaseAllowance | 3,5 % (increaseAllowance) | 3 cas, 5,62 M$ |
| Transfer | 4,5 % | 2 cas, 4,87 M$ |
| EIP-7702 (lot) | — | 2 cas, 2,54 M$ (août) |
| setApprovalForAll | — | 1 cas, 1,23 M$ |
| Autres | 3,4 % | — |

Répartition sur l'ensemble des pertes (pas seulement les gros vols) : non retrouvée. Les rapports mensuels de 2024 la donnent dans des images, sans chiffre dans le texte. Ils disent seulement que la majorité vient de « Permit, IncreaseAllowance, and Uniswap Permit2 » (https://drops.scamsniffer.io/71-million-stolen-due-to-phishing-in-march/).

Incohérence interne chez Scam Sniffer : le rapport mensuel de mars 2024 donne 71 M$ pour mars et 173 M$ pour le T1. Le rapport annuel donne 75,2 M$ et 187,2 M$. Les chiffres ont été révisés sans explication.

Mesure indépendante, évaluée par les pairs (Chen et al., Zhejiang University, NDSS ; année 2025 déduite du nom du fichier) :

| Catégorie | Transactions | Pertes | Part des pertes |
|---|---|---|---|
| « Ice phishing » (approbations piégées) | 47 762 | 201 880 314 $ | 59,04 % |
| Empoisonnement d'adresse | 1 050 | 64 042 825 $ | 18,73 % |
| Ordres NFT piégés | 14 999 | 57 495 168 $ | 16,81 % |
| Fonction payante piégée (« Claim », « SecurityUpdate ») | 66 826 | 18 527 500 $ | 5,42 % |
| Total | 130 637 | 341 945 807 $ | 100 % |

Périmètre : Ethereum seul, 300 jours, du 31 déc. 2022 au 27 oct. 2023. Détection par règles, validée sur 5 000 transactions. Sources : https://arxiv.org/abs/2409.02386 et https://www.ndss-symposium.org/ndss-paper/dissecting-payload-based-transaction-phishing-on-ethereum/ [A]

Autres mesures voisines :
- Chainalysis, « approval phishing » : environ 1,0 Md$ depuis mai 2021 (516,8 M$ en 2022, 374,6 M$ en 2023 jusqu'à novembre), sur un réseau de 1 013 adresses. Révisé à « over USD $2.7 billion » en juillet 2024. Attention : ce chiffre part d'adresses liées à des arnaques sentimentales. La source dit elle-même qu'une partie peut être du blanchiment. Sources : https://www.chainalysis.com/blog/approval-phishing-cryptocurrency-scams-2023/ ; https://www.chainalysis.com/blog/operation-spincaster/ [B]
- Chainalysis, compromissions de portefeuilles personnels : 158 000 incidents, au moins 80 000 victimes, 713 M$ en 2025 (20 % du total volé). Pic à 1,5 Md$ en 2024. Périmètre plus large que le phishing par signature (inclut le vol de clés). Publié le 18 déc. 2025. https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/ [B]
- FBI IC3, plaintes « Phishing/Spoofing » avec lien crypto : 3 938 plaintes et 28 546 213 $ en 2024 ; 7 164 plaintes et 111 025 191 $ en 2025. Catégorie large, pas limitée aux signatures. (rapports IC3 2024 p. 37-38 et 2025 p. 54-55) [A]

### A3. Question 2 : ce que la victime croyait faire

Constat net : aucune étude lue ne mesure ce que la victime pensait signer. Aucune enquête auprès de victimes n'a été trouvée.

Indices indirects :
- Article NDSS : dans la catégorie « fonction payante », 74,2 % des pertes viennent de leurres d'airdrop (fonctions nommées `Claim`, `ClaimReward`, `ClaimRewards`) et 25,8 % de leurres de portefeuille (`SecurityUpdate`, `ConnectWallet`). Cela porte sur 18,5 M$, soit 5,42 % du total mesuré. [A]
- Même article : sur 5 000 victimes d'ice phishing tirées au hasard, 40,38 % n'ont rien fait après le vol (ni révocation, ni déplacement des fonds). 26,32 % ont révoqué. 33,3 % ont déplacé leurs fonds. [A]
- Scam Sniffer, janv. 2024 : « Most victims were lured into phishing websites through comments on impersonated Twitter accounts ». Sans chiffre. https://drops.scamsniffer.io/scamsniffer-report-over-55-million-stolen-due-to-crypto-phishing-in-january/ [B]
- Scam Sniffer, janv. 2025 : un cas où la victime clique « Claim » et perd 143,45 ETH (environ 460 895 $). https://drops.scamsniffer.io/transaction-simulation-spoofing-a-new-threat-in-web3/ [B]

Par construction, tout vol par drainer suppose que la victime croyait faire autre chose. C'est un raisonnement, pas une mesure. Ne pas le présenter comme un chiffre.

### A4. Question 3 : ce qui passe malgré les alertes (donnée décisive)

Constat net : rien n'existe. Aucune source lue ne donne :
- un taux de contournement des alertes Blockaid ou de la simulation ;
- la part des victimes qui avaient une alerte à l'écran et ont continué ;
- le portefeuille utilisé par les victimes.

Ce qui a été cherché sans résultat : rapport Scam Sniffer 2024 et 2025 ; article MetaMask sur les alertes Blockaid ; rapport de sécurité MetaMask de juin 2026 ; site Blockaid ; site Pocket Universe ; article NDSS (il liste les outils, sans mesurer leur efficacité) ; recherches arXiv sur « wallet drainer », « Drainer-as-a-Service », « approval phishing ». Le rapport Blockaid S1 2026 (20 pages) est derrière un formulaire : non lu.

Ce qui existe à la place :

| Élément | Chiffre | Limite | Source | Fiab. |
|---|---|---|---|---|
| Contournement par CREATE2 (adresse neuve à chaque signature) | Le groupe a volé « nearly $60 million from around 99,000 victims » en six mois environ | Vol total du groupe, pas la part due au contournement. Portefeuilles non nommés | https://drops.scamsniffer.io/wallet-drainers-starts-using-create2-bypass-wallet-security-alert/ (12 nov. 2023) | B |
| Contournement par adresse numérique dans `verifyingContract` (Permit) | Aucun chiffre de pertes. Dix portefeuilles testés, dont MetaMask, Rabby, Coinbase, Trust, Phantom | Résultat par portefeuille non lisible dans le texte | https://drops.scamsniffer.io/wallet-drainer-exploits-numerical-address-bypass-security-alerts/ (4 mars 2024) | B |
| Tromperie de la simulation (état du contrat modifié après la simulation) | Un cas : 143,45 ETH. Signature environ 30 secondes après le changement d'état | Un seul cas. Portefeuille non nommé | https://drops.scamsniffer.io/transaction-simulation-spoofing-a-new-threat-in-web3/ (10 janv. 2025) | B |
| Empoisonnement d'adresse : 53 portefeuilles testés | 16 affichent les faux transferts comme légitimes ; 3 seulement avertissent avant l'envoi | Prépublication arXiv, non évaluée par les pairs. Août 2025, donc avant la détection MetaMask de juin 2026 | https://arxiv.org/abs/2508.12107 | B |
| MetaMask reconnaît la limite | La simulation peut être trompée (« red pill ») ; les alertes ne bloquent pas | Aveu qualitatif, sans chiffre | voir `RECHERCHE_metamask_couverture.md` | A |
| Chronologie | Alertes Blockaid par défaut dans MetaMask en février 2024. Les pertes par drainers ont atteint leur record cette même année (494 M$), puis ont chuté de 83 % en 2025 | Corrélation seulement. On ne sait pas quels portefeuilles utilisaient les victimes. Scam Sniffer n'attribue la baisse à aucune cause | https://metamask.io/news/metamask-security-alerts-by-blockaid-the-new-normal-for-a-safer-transaction ; rapports Scam Sniffer | B |
| Analogie hors crypto (navigateurs, 2013) | Environ un quart des alertes de phishing et de malware de Chrome étaient ignorées ; un dixième dans Firefox. Plus de 25 millions d'affichages | Navigateurs web, 2013. Pas des portefeuilles. À citer seulement comme analogie | https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/akhawe | A |

Chiffres d'éditeurs, invérifiables : Blockaid affiche 5,9 Md de transactions analysées, 527 M d'attaques empêchées, 13,1 Md$ de vols évités (https://www.blockaid.io/). Pocket Universe affiche « 200,000+ » utilisateurs et « $1b+ » d'actifs protégés (https://www.pocketuniverse.app/). Aucun ne publie ce qu'il rate.

### A5. Question 4 : approbations illimitées

| Chiffre | Périmètre et méthode | Source | Fiab. |
|---|---|---|---|
| 60 % des approbations ERC-20 sont illimitées (15,2 M sur 25,4 M) | Ethereum, transactions jusqu'au 31 juillet 2021. Wang et al., RAID 2022 | https://arxiv.org/abs/2207.01790 | A, mais donnée de 2021 |
| 22 % des utilisateurs à haut risque de vol des jetons approuvés | même étude | même URL | A, 2021 |
| 0,2 % des utilisateurs suivent la bonne pratique | même étude | même URL | A, 2021 |
| 22 dapps étudiées : toutes demandent l'illimité. 31 interfaces de 9 portefeuilles : 3 expliquent le mécanisme (10 %), 5 permettent de modifier le montant (16 %) | même étude. Dépassé : MetaMask propose aujourd'hui de modifier le plafond | même URL | A, 2021 |
| 71 exploits d'approbations listés, « Over $355M stolen since 2020 ». Plus gros : BadgerDAO 111,1 M$ (2 déc. 2021), Radiant Capital 60 M$ (16 oct. 2024), bZx 55 M$. Dernier gros : SwapNet 13,43 M$ (25 janv. 2026) | Liste tenue à la main par Revoke.cash. Il s'agit de contrats légitimes piratés ou abandonnés, qui dépensent des approbations déjà données | https://revoke.cash/exploits | B (Revoke.cash vit de la révocation) |

Part actuelle (2025-2026) des approbations illimitées : non retrouvée. Pertes dues à des approbations anciennes, en part du total : non retrouvé.

### A6. Question 5 : fraude « autorisée », que Hold up n'adresse pas

| Chiffre | Périmètre | Source | Fiab. |
|---|---|---|---|
| Fraude à l'investissement crypto, 2024 : 41 557 plaintes, 5 819 531 069 $ | Plaintes IC3 | IC3 2024, p. 36 et 38 | A |
| Fraude à l'investissement crypto, 2025 : 61 559 plaintes, 7,228 Md$ dans l'encadré (+25 %) ; 7 277 868 919 $ dans le tableau | Plaintes IC3. Les deux chiffres diffèrent dans le même rapport | https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf (p. 53 et 55) | A |
| Total des pertes avec lien crypto, 2025 : 11,366 Md$, 181 565 plaintes (+22 % et +21 %). 18 589 plaignants ont perdu plus de 100 000 $. Perte moyenne 62 604 $ | Plaintes IC3 | IC3 2025, p. 52 | A |
| Faux support technique avec lien crypto : 961 998 313 $ (2024) ; 1 226 298 080 $ (2025) | Plaintes IC3 | IC3 2024 p. 38 ; IC3 2025 p. 55 | A |
| Arnaque sentimentale avec lien crypto : 237 151 771 $ (2024) ; 394 787 515 $ (2025) | Plaintes IC3 | mêmes pages | A |
| Usurpation d'une administration avec lien crypto : 146 057 054 $ (2024) ; 281 146 737 $ (2025) | Plaintes IC3 | mêmes pages | A |
| Arnaques à la « récupération » : 10 516 plaintes, 1,4 Md$ (2025) | Plaintes IC3. Peut inclure les pertes de l'arnaque d'origine | IC3 2025, p. 53 | A |
| Distributeurs de cryptos : 246,7 M$ (2024) ; 389 M$ (2025) | Plaintes IC3 | IC3 2024 p. 36 ; IC3 2025 p. 53 | A |
| Parts des arnaques 2024 : investissement à haut rendement 50,2 %, « pig butchering » 33,2 %. Revenus du pig butchering : près de +40 % sur un an | Flux sur la chaîne | https://www.chainalysis.com/blog/2024-pig-butchering-scam-revenue-grows-yoy/ | B |
| 2025 : arnaques par usurpation « more than 1400% » ; paiement moyen de 782 $ à 2 764 $ | Flux sur la chaîne | https://www.chainalysis.com/blog/crypto-scams-2026/ | B |

Ordre de grandeur [calcul] : les 83,85 M$ de drainers de 2025 pèsent environ 0,6 % des 14 Md$ d'arnaques de Chainalysis, et environ 0,7 % des 11,366 Md$ de l'IC3. Les périmètres ne sont pas les mêmes (monde EVM, flux mondiaux, plaintes américaines). C'est un ordre de grandeur, pas un ratio à publier.

### A7. Question 6 : parts de marché des portefeuilles de navigateur

Constat net : aucune part de marché n'a été retrouvée à une source primaire. Les pages du Chrome Web Store sont derrière un écran de consentement et n'ont pas pu être lues.

| Portefeuille | Ce qui a été trouvé | Source | Fiab. |
|---|---|---|---|
| MetaMask | « 100MM+ downloads across Google Play, the App Store, and Chrome Web Store » : ce sont des téléchargements, pas des utilisateurs | https://metamask.io/ | B |
| MetaMask | Utilisateurs actifs mensuels : +55 % entre sept. 2023 et janv. 2024, sans chiffre absolu dans l'article. Le chiffre « de 19 à plus de 30 millions » vient de Blockworks (page non lisible, erreur 403) | https://metamask.io/news/metamask-security-alerts-by-blockaid-the-new-normal-for-a-safer-transaction ; https://blockworks.com/news/metamask-monthly-active-users-blockaid | B puis C |
| MetaMask, Firefox seulement | 319 878 utilisateurs quotidiens moyens, version 13.49.0.0, mise à jour du 30 sept. 2026 | https://addons.mozilla.org/api/v5/addons/addon/ether-metamask/ | A, mais Firefox est une petite part |
| Phantom | « 15 millions d'utilisateurs actifs mensuels » : cité par un tiers, non vérifié. Environ 7 millions annoncés à Breakpoint 2024 selon un compte rendu tiers | non retrouvé à la source | C |
| Rabby, Coinbase Wallet, Core, Trust Wallet | Non retrouvé | — | — |

À faire à la main si le chiffre compte : ouvrir les six fiches du Chrome Web Store dans un navigateur et noter le compteur « utilisateurs ».

### A8. Question 7 : Avalanche

- Aucun chiffre de pertes par drainer propre à Avalanche n'a été retrouvé.
- Rapport Scam Sniffer 2024 : les 30 vols de plus d'1 M$ se répartissent ainsi : Ethereum 25 (152 M$), Arbitrum 2 (3,55 M$), BNB Chain 1 (7,88 M$), Blast 1 (5,87 M$), Base 1 (1,2 M$). Aucun sur Avalanche. [B]
- Rapport Scam Sniffer de janvier 2024 : Avalanche est citée dans la liste des chaînes touchées, sans chiffre et hors des cinq premières. [B]
- Les études académiques lues portent sur Ethereum et BNB Smart Chain, pas sur Avalanche.
- Avalanche C-Chain (43114) est couverte par les alertes de MetaMask (voir `RECHERCHE_metamask_couverture.md`).

Conclusion honnête : la douleur mesurée est sur Ethereum. Un pitch « douleur sur Avalanche » n'a aucun chiffre pour s'appuyer.

## (b) Ce que Hold up adresse, et ce qu'il n'adresse pas

### La part qu'il peut adresser

Le cas visé : la victime écrit « je réclame un airdrop » ou « je connecte mon portefeuille », et la demande réelle est une approbation, un Permit ou un transfert.

- Phishing par signature via un site piégé : 83,85 M$ et 106 106 adresses en 2025 ; 494 M$ et 332 000 en 2024 (EVM, borne basse). [B]
- Dans ce lot, les Permit et Permit2 pèsent lourd dans les gros vols : 56,7 % en 2024, 38 % en 2025. Ce sont des signatures hors chaîne, sans frais, que l'utilisateur lit mal. [B]
- Fonctions piégées nommées `Claim` ou `SecurityUpdate` : 18,5 M$ en 300 jours sur Ethereum. [A]
- Les nouveaux lots EIP-7702 : 2 gros cas, 2,54 M$ en août 2025. [B] Plus de 150 000 événements et 26 000 adresses dans une prépublication (https://arxiv.org/abs/2512.12174). [B]

### La part qu'il adresse seulement en partie

- « Approval phishing » au sens de Chainalysis (plus de 2,7 Md$ depuis mai 2021). L'effet est bien une approbation, mais la victime est guidée par un escroc qui gagne sa confiance. Elle peut écrire l'intention que l'escroc lui dicte. L'écart intention contre effet existe, mais on ne sait pas dans quelle proportion.
- Empoisonnement d'adresse (au moins 83,8 M$ sur deux ans, 6 633 incidents). La victime veut bien envoyer ; c'est le destinataire qui est faux. Hold up n'aide que s'il compare l'adresse à l'historique. MetaMask le fait déjà depuis juin 2026.
- Approbation illimitée vers un contrat légitime, piraté plus tard (plus de 355 M$ depuis 2020 selon Revoke.cash). Au moment de la signature, l'intention et l'effet correspondent. Hold up peut seulement signaler « illimité alors que vous vouliez dépenser X ».

### La part qu'il n'adresse pas

- Fraude à l'investissement : 7,2 Md$ en 2025 selon l'IC3. La victime envoie exactement ce qu'elle veut envoyer, souvent depuis une plateforme d'échange et pas depuis un portefeuille de navigateur.
- Faux support (1,23 Md$), arnaque sentimentale (395 M$), usurpation d'administration (281 M$), récupération (1,4 Md$), distributeurs (389 M$). Chiffres IC3 2025.
- Vol de clés ou de phrase secrète, logiciels malveillants. Une partie des 713 M$ de compromissions de portefeuilles personnels de 2025.
- Piratages de protocoles et de plateformes.

### Ce qu'il faut dire au fondateur

1. La douleur est vraie et vécue aujourd'hui : plus de 100 000 adresses touchées en 2025.
2. Elle est en forte baisse (-83 %) et elle pèse moins de 1 % de la fraude crypto totale.
3. Rien ne prouve que les victimes restantes sont passées malgré une alerte. Rien ne prouve le contraire non plus. Cette mesure n'existe pas. C'est une lacune du domaine, et c'est aussi un angle : notre banc d'essai peut la produire à petite échelle.
4. L'objection d'un praticien, à donner nous-mêmes : « Blockaid a déjà fait tomber les pertes de 83 %, que reste-t-il ? ». Réponse honnête : cette cause n'est pas démontrée (Scam Sniffer n'en donne aucune), 106 106 adresses ont quand même été vidées, et les techniques de contournement sont documentées chaque année depuis 2023.

## (c) Trois chiffres pour une slide, avec la formulation défendable

1. « En 2025, 106 106 adresses ont perdu 83,85 millions de dollars en signant sur un site de phishing. C'est une borne basse, sur les chaînes EVM. En 2024, c'était 494 millions. » Source : Scam Sniffer, rapports annuels 2024 et 2025. Dire à l'oral que Scam Sniffer vend de l'anti-phishing et que la baisse est de 83 %.

2. « Sur les vols de plus d'un million de dollars, la signature Permit pèse 56,7 % des pertes en 2024 (30 cas) et 38 % en 2025 avec Permit2 (11 cas). » Source : Scam Sniffer. Toujours donner le nombre de cas.

3. « Sur Ethereum, en 300 jours, des chercheurs ont mesuré 341,9 millions de dollars volés par des transactions piégées. 59 % viennent d'approbations. » Source : Chen et al., NDSS, période du 31 déc. 2022 au 27 oct. 2023. C'est le seul chiffre évalué par les pairs sur notre cas exact. Dire qu'il date de 2023.

Phrase de rechange, sans chiffre mais forte : « Aucune source publique ne mesure combien de victimes avaient une alerte à l'écran et ont signé quand même. »

## (d) Chiffres à ne pas utiliser, et pourquoi

| Chiffre | Pourquoi l'éviter |
|---|---|
| 9,3 Md$ (IC3 2024) ou 11,4 Md$ (IC3 2025) comme « notre marché » | Plus de 60 % est de la fraude à l'investissement. Hold up ne l'adresse pas. Un juré le sait |
| 17 Md$ (Chainalysis 2025) | C'est une projection. Le chiffre mesuré est « au moins 14 Md$ » |
| « +67 % » seul | Vrai pour 2024, mais suivi de -83 % en 2025. Le citer seul est trompeur |
| « 300 M$ et 320 000 victimes » pour 2023 | C'est le titre. Le corps du rapport et le rapport 2025 donnent 295 M$ et 324 000 |
| 173 M$ ou 187,2 M$ pour le T1 2024 | Deux chiffres différents chez le même éditeur |
| « 56,7 % des vols sont des Permit » | Faux tel quel : c'est 56,7 % des pertes de 30 gros vols |
| 270 millions comme nombre de victimes | Ce sont des tentatives. Les incidents réussis sont 6 633. Les « 17 M de victimes » sont des adresses ciblées |
| 65,4 millions de tentatives d'empoisonnement (Blockaid) et « 1 sur 200 réussit » | Éditeur, méthode non décrite. Préférer l'étude USENIX |
| 13,1 Md$ « de vols évités », 527 M d'attaques empêchées (Blockaid) ; « 1 dapp sur 10 est malveillante » | Chiffres d'un vendeur, invérifiables |
| 60 % d'approbations illimitées, comme chiffre actuel | Données arrêtées au 31 juillet 2021. Les portefeuilles ont changé depuis. Toujours dire « en 2021 » |
| 2,7 Md$ d'« approval phishing » comme pertes par drainers | Autre périmètre (arnaques sentimentales). La source admet une part possible de blanchiment |
| 713 M$ de compromissions de portefeuilles personnels | Inclut le vol de clés. Ce n'est pas notre cas |
| 355 M$ (Revoke.cash) comme pertes « par signature piégée » | Ce sont des contrats légitimes piratés, pas du phishing |
| 6,27 M$ et 4 741 victimes en janvier 2026 | Relais de presse, non vérifié à la source |
| 46,22 % des Permit observés seraient du phishing (article NDSS : 6 414 sur 13 877) | Contexte de l'échantillon non relu. À vérifier dans l'article avant tout usage |
| MetaMask : « 100 millions d'utilisateurs » ou « 30 millions d'actifs mensuels » | Le premier est un nombre de téléchargements. Le second date de janvier 2024 et vient de la presse |
| Phantom : 15 millions d'actifs mensuels | Non vérifié à la source |
| « Un quart des utilisateurs ignorent les alertes » | Étude de 2013 sur les navigateurs web, pas sur les portefeuilles. Analogie seulement |
| « Blockaid a fait baisser les pertes de 83 % » ou « Blockaid ne sert à rien, record en 2024 » | Les deux sont des corrélations. Aucune source n'établit la cause |
| Tout chiffre de pertes sur Avalanche | Non retrouvé |

## Mapping réglementaire (rappel, inchangé par cette recherche)

- NIST CSF 2.0 : DE.CM (surveillance des demandes de signature), DE.AE (analyse de l'écart entre l'intention et l'effet), RS.MI (retenue de la demande). PR.AT pour l'effet pédagogique.
- MITRE ATT&CK : T1566 (Phishing), T1204 (User Execution), T1657 (Financial Theft). À revalider dans le référentiel avant la fiche de défense.
- MITRE D3FEND : candidat D3-UBA (User Behavior Analysis). À valider.
- OWASP Agentic : seulement si la demande vient d'un agent (ASI01, ASI02). Ne pas forcer le mapping pour un humain seul.
- MITRE ATLAS : non pertinent ici.
- Lien avec la fiche de défense : les métriques demandées (taux de détection, faux positifs, temps de détection) ne peuvent pas venir de ces sources. Elles doivent venir de notre banc d'essai.

## Sources

Sources publiques ou évaluées par les pairs :
- FBI IC3, rapport annuel 2024 : https://www.ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf (p. 35 à 38, lues en image)
- FBI IC3, rapport annuel 2025 : https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf (p. 52 à 55, lues en image)
- Tsuchiya et al., « Blockchain Address Poisoning », USENIX Security 2025 : https://www.usenix.org/conference/usenixsecurity25/presentation/tsuchiya
- Chen et al., « Dissecting Payload-based Transaction Phishing on Ethereum », NDSS : https://arxiv.org/abs/2409.02386 ; https://arxiv.org/html/2409.02386v2 ; https://www.ndss-symposium.org/ndss-paper/dissecting-payload-based-transaction-phishing-on-ethereum/
- Wang et al., « Penny Wise and Pound Foolish », RAID 2022 : https://arxiv.org/abs/2207.01790
- Akhawe et Felt, « Alice in Warningland », USENIX Security 2013 : https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/akhawe

Prépublications non évaluées :
- Guan et Li, portefeuilles et empoisonnement d'adresse : https://arxiv.org/abs/2508.12107
- Qi et al., « EIP-7702 Phishing Attack » : https://arxiv.org/abs/2512.12174

Éditeurs (conflit d'intérêt : ils vendent de la sécurité ou de l'analyse) :
- Scam Sniffer 2023 : https://drops.scamsniffer.io/scam-sniffer-2023-crypto-phishing-scams-drain-300-million-from-320000-users/
- Scam Sniffer 2024 : https://drops.scamsniffer.io/scam-sniffer-2024-web3-phishing-attacks-wallet-drainers-drain-494-million/
- Scam Sniffer 2025 : https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
- Scam Sniffer, janv. et mars 2024 : https://drops.scamsniffer.io/scamsniffer-report-over-55-million-stolen-due-to-crypto-phishing-in-january/ ; https://drops.scamsniffer.io/71-million-stolen-due-to-phishing-in-march/
- Scam Sniffer, contournements : https://drops.scamsniffer.io/wallet-drainers-starts-using-create2-bypass-wallet-security-alert/ ; https://drops.scamsniffer.io/wallet-drainer-exploits-numerical-address-bypass-security-alerts/ ; https://drops.scamsniffer.io/transaction-simulation-spoofing-a-new-threat-in-web3/
- Chainalysis : https://www.chainalysis.com/blog/2024-pig-butchering-scam-revenue-grows-yoy/ ; https://www.chainalysis.com/blog/crypto-scams-2026/ ; https://www.chainalysis.com/blog/approval-phishing-cryptocurrency-scams-2023/ ; https://www.chainalysis.com/blog/operation-spincaster/ ; https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/ ; https://www.chainalysis.com/blog/crypto-drainers/ (aucun total chiffré)
- Blockaid : https://www.blockaid.io/ ; https://www.blockaid.io/blog/address-poisoning-the-growing-threat-draining-millions-from-crypto-users ; https://www.blockaid.io/h1-report-2026 (rapport derrière formulaire, non lu)
- MetaMask : https://metamask.io/ ; https://metamask.io/news/metamask-security-alerts-by-blockaid-the-new-normal-for-a-safer-transaction ; https://metamask.io/news/crypto-security-report-june-2026
- Pocket Universe : https://www.pocketuniverse.app/
- Revoke.cash : https://revoke.cash/exploits
- Mozilla, fiche de l'extension MetaMask : https://addons.mozilla.org/api/v5/addons/addon/ether-metamask/

## Non lu ou non retrouvé
- Rapport Blockaid S1 2026 complet (formulaire).
- Compteurs d'utilisateurs du Chrome Web Store pour les six portefeuilles (écran de consentement).
- Article Blockworks sur les utilisateurs actifs de MetaMask (erreur 403).
- Tout rapport Scam Sniffer daté de 2026.
- Répartition par type de signature sur l'ensemble des pertes (seulement dans des images).
- Toute enquête auprès de victimes sur ce qu'elles pensaient signer.
- Toute mesure du taux de passage malgré une alerte de portefeuille.
- Tout chiffre de pertes propre à Avalanche.
- Texte intégral des articles USENIX 2025 et RAID 2022 (résumés seulement). Texte de l'article NDSS : lu aux trois quarts.

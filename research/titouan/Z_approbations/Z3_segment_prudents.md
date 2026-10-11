# Z3. Le segment des « prudents » : qui évite les approbations illimitées et révoque ?

Date de la recherche : 11 octobre 2026.
Légende : [V] = lu à l'URL pendant cette recherche. [NV] = non vérifié à la source (relayé par un moteur de recherche ou un tiers). « introuvable » = absent.

Limites d'accès : Reddit est bloqué pour l'outil de recherche. X non testé. Hacker News (API Algolia) accessible mais sans commentaire pertinent. Ethereum Stack Exchange bloqué au fetch. Les forums de gouvernance Uniswap et Aave n'ont rien donné.

## 1. Adoption des outils (chiffres publiés)

| Outil | Chiffre | Statut | URL |
|---|---|---|---|
| Revoke.cash | « 2M+ Total Users », « 20M+ Approvals Revoked », « $140M+ Protected from Exploits », « 80+ Networks ». Page sans date. | [V] | https://revoke.cash/ |
| Revoke.cash | « More than 100 » chaînes, 4 nouveaux réseaux, couverture de vol jusqu'à 30 000 $ (Fairside). Q1 2026. | [V] | https://revoke.cash/blog/2026/update-q1 |
| Revoke.cash | Bilan 2025 : 9 exploits d'approbation, un peu plus de 6 M$ volés en 2025, contre 80 M$ en 2024. Batch revoke à 1,50 $ par lot. Les chiffres d'usage sont dans une image, illisibles. 31 déc. 2025. | [V] | https://revoke.cash/blog/2025/year-in-review |
| Revoke.cash | Jalons : batch revoke oct. 2024, batch en une transaction via EIP-7702 mai 2025, Revoke Premium juil. 2026. | [V] | https://revoke.cash/about |
| Revoke.cash, extension | Chrome : environ 60 000 utilisateurs, 4,9 sur 31 avis (un instantané). Firefox : 448 utilisateurs. L'extension est devenue « Revoke Sidekick » (v1.0.1, avril 2026). | [NV] | https://chromewebstore.google.com/detail/nmniboccheadcclilkfkonokbcoceced |
| Revoke.cash, Avalanche | Une page « token approval checker » Avalanche existe. Aucun chiffre par chaîne publié. | [NV] introuvable pour les chiffres | https://revoke.cash/token-approval-checker/avalanche |
| Etherscan Token Approvals | Outil ERC-20/721/1155 sur Ethereum, Sepolia, Hoodi. Aucun chiffre d'usage affiché. | [V] | https://etherscan.io/tokenapprovalchecker |
| Rabby | « 4,2 M d'installations » (juillet 2026, site d'actualités sans source primaire). Autre chiffre sans source : 1,2 M MAU. Les deux sont contradictoires et non sourcés. | [NV] | https://www.bydfi.com/en/crypto-news/rabby-wallet-surpasses-4-2m-installs-challenges-metamask-29758 |
| Rabby, gestion des approbations | Fonction intégrée de révocation, y compris par lot. Décrite par des tiers. Aucun chiffre d'usage. | [NV] | introuvable côté officiel |
| Pocket Universe | Environ 200 000 utilisateurs actifs à l'acquisition par Kerberus (août 2025). | [NV] | https://www.kerberus.com/articles/pocket_universe/ |
| Kerberus (avec Pocket Universe) | « 250 000+ » utilisateurs protégés fin 2025. Couverture jusqu'à 30 000 $ par transaction. | [V] | https://www.kerberus.com/articles/kerberus-2025-year-in-review/ |
| Wallet Guard | Racheté par Consensys le 3 juil. 2024. Arrêt (« sunset ») au 31 mars 2025 selon ses notes de version. Aucun chiffre d'utilisateurs trouvé. | [NV] | https://www.theblock.co/post/303347/consensys-acquires-wallet-guard-to-help-protect-metamask-users-against-hacks-and-scams ; https://walletguard.app/category-for-blogs/release-notes |
| Harpie | Arrêt immédiat le 27 mars 2025 : « pas de modèle économique durable ». Pas de chiffre d'utilisateurs. | [V] | https://www.theblock.co/news/business/2025-03-27-coinbase-web3-security-shop-harpie-announces-shutdown-348421 |
| Web3 Antivirus | introuvable | | |
| Fire | introuvable | | |

Remarque de fond. Deux des outils de sécurité de cette liste (Harpie, Wallet Guard) ont fermé en mars 2025. Harpie cite l'absence de modèle économique. C'est un signal sur la disposition à payer de ce public.

Incohérence à noter : la page d'accueil Revoke.cash dit « 80+ » réseaux et le billet Q1 2026 dit « plus de 100 ». La page d'accueil est donc probablement en retard.

## 2. Preuves de comportement

Pas de citation directe de forum. Aucun message du type « je ne signe jamais d'illimité » n'a été trouvé sur HN, Ethereum Magicians ou GitHub. Les recherches Reddit et Stack Exchange ont échoué (accès). Ce qui existe est du comportement mesuré.

Mesures (les plus solides) :

1. Enquête auprès de près de 500 investisseurs crypto (14 entretiens, puis 493 répondants). Seulement 10,8 % vérifient et révoquent régulièrement leurs approbations contre les rug pulls, et 16,3 % contre les exploits de contrats. Parmi les victimes d'arnaque, 17,6 % le font après coup. [V] https://theconversation.com/decentralized-finance-is-booming-and-so-are-the-security-risks-my-team-surveyed-nearly-500-crypto-investors-and-uncovered-the-most-common-mistakes-251305 (8 mai 2025). Le préprint arXiv donne la méthode (14 entretiens, 493 réponses) [V pour l'abstract] https://arxiv.org/abs/2406.15709. Le tableau détaillé du PDF n'a pas pu être lu. Un moteur de recherche a rapporté des pourcentages un peu différents (8,8 % et 14,5 % pour les non-victimes) : [NV], à vérifier dans le PDF avant toute citation.
2. Étude on-chain « Penny Wise and Pound Foolish » : environ 60 % des approbations sont illimitées (15,2 M sur 25,4 M, jusqu'au 31 juil. 2021). Les 22 dApps étudiées demandent toutes l'illimité. Seulement 3 interfaces sur 31 expliquent le mécanisme et 5 sur 31 laissent changer le montant. Seulement 0,2 % des utilisateurs suivent la bonne pratique « approbation à la demande, dépense immédiate ». [V] https://arxiv.org/abs/2207.01790
3. Étude de laboratoire de 2026 (30 utilisateurs) : 40 % ont signé une dépense illimitée simulée. [NV] https://arxiv.org/pdf/2601.16751

Paraphrases fidèles issues de forums :
- Ethereum Magicians, déc. 2021 : l'auteur d'une proposition d'expiration automatique des approbations dit que les gens y pensent au moment d'approuver, puis les oublient. Description générale, pas une habitude personnelle. [V] https://ethereum-magicians.org/t/time-limited-erc-20-approvals/7749
- Ethereum Magicians, avr. 2021 : une réponse explique qu'une adresse approuvée en illimité peut dépenser « autant qu'elle veut ». Illustre le risque, pas une pratique. [V] https://ethereum-magicians.org/t/allowance-unlimited-what-can-happen/6009
- Un fil Magicians cité par un moteur de recherche recommande de n'approuver que le montant du swap. [NV], texte non retrouvé.

Coût de la révocation. Le support MetaMask indique qu'une révocation est une transaction on-chain qui coûte du gaz, et conseille un contrôle mensuel. [NV] https://support.metamask.io/more-web3/learn/how-to-revoke-smart-contract-allowances-token-approvals. Revoke.cash facture 1,50 $ par lot en 2025 [V]. Révoquer après chaque swap est donc cher et rare.

Wallet burner : seulement des guides de vendeurs. Aucun témoignage ni chiffre d'usage. [NV] https://www.dextools.io/tutorials/what-is-a-burner-wallet-in-crypto-guide-2026

## 3. Taille du segment (ordre de grandeur)

Aucun chiffre publié ne mesure directement « les gens qui évitent systématiquement l'illimité ». Je ne peux donc pas donner un nombre exact. Voici des bornes, avec la méthode.

- Borne de comportement « révoque régulièrement » : 10 à 16 % des investisseurs DeFi sondés (n = 493, échantillon de convenance, pas représentatif) [V]. C'est une enquête, pas une mesure de population.
- Borne de comportement « approuve à la demande » : 0,2 % des utilisateurs (données de 2021) [V]. Ancien, mais cohérent avec « très rare ».
- Borne d'outil : Revoke.cash cumule plus de 2 M d'utilisateurs depuis 2019 [V, non daté] et 20 M de révocations, soit environ 10 révocations par utilisateur en moyenne (calcul, pas un chiffre publié). L'extension Chrome serait autour de 60 000 [NV]. Kerberus et Pocket Universe : 250 000 [V].

Ordre de grandeur honnête : quelques dizaines de milliers à quelques centaines de milliers de personnes qui installent un outil de protection actif, et jusqu'à environ 2 M de gens qui ont déjà utilisé Revoke.cash au moins une fois, cumulés sur 7 ans. Le noyau « systématiquement prudent » est plus petit que la base de Revoke.cash, car beaucoup d'utilisateurs y vont une fois après une alerte. Pas de chiffre de MAU, ni de visiteurs mensuels, ni de ventilation par chaîne : introuvables.

Ce que ces chiffres ne disent pas : la part sur Avalanche, et la part qui paie.

## 4. Alternatives que ce public utilise déjà

- Contrôle manuel : Revoke.cash (gratuit, plus de 100 chaînes), Etherscan Token Approvals (gratuit, Ethereum seulement dans la page lue). [V]
- Portefeuilles : Rabby (révocation intégrée, simulation avant signature) [NV côté officiel] ; MetaMask permet de modifier le plafond de dépense, mais indique que son swap utilise l'illimité par défaut, avec une possibilité de modifier [NV] https://support.metamask.io/token-swaps/why-does-swaps-use-unlimited-token-approvals.
- Extensions d'alerte : Revoke Sidekick (couverture 30 000 $ avec Fairside), Pocket Universe/Kerberus (couverture 30 000 $ par transaction). [V]
- Permit2 : Uniswap recommande une approbation max vers Permit2, puis des autorisations bornées en montant et en durée par application. [NV via recherche] https://docs.uniswap.org/contracts/permit2/overview. Je n'ai pas pu confirmer quel portefeuille met l'approbation exacte par défaut : introuvable.
- Standards en préparation : ERC-7715 (permissions accordées par le portefeuille, limites de dépense par période) et ERC-7710 (délégation) sont au stade brouillon. Côté MetaMask, ils exigent un compte intelligent et la version de développement Flask. Usage grand public : aucun chiffre. [NV] https://docs.metamask.io/delegation-toolkit/experimental/erc-7715-request-permissions
- Safe : le module Allowance donne des plafonds par période à une adresse désignée. Réservé aux multisigs, hors cible grand public. Nombre de comptes : introuvable. [NV] https://docs.safe.global/smart-account-overview
- Approbation exacte côté dApp : des projets comme CoW Swap ajoutent des approbations limitées. [NV] https://github.com/cowprotocol/cowswap/pull/8280

## 5. Conclusion franche

Ce public existe mais il est petit et mal mesuré. Les prudents systématiques sont une minorité : 10 à 16 % se disent réguliers dans une enquête de 493 personnes, et 0,2 % appliquent la pratique stricte dans une étude on-chain de 2021. Leur besoin est déjà couvert en grande partie, gratuitement : Revoke.cash, Etherscan, Rabby, et le plafond manuel de MetaMask.

Ont-ils besoin de Hold up ? Seulement si Hold up fait ce que ces outils ne font pas : agir avant la signature, ou automatiser ce qu'ils font à la main (approbation exacte, expiration, révocation sans payer le gaz à chaque fois). Pour eux, c'est un confort, pas un manque vital. Ils sont aussi les moins susceptibles de payer, et les moins exposés.

Le vrai public adressable semble être l'inverse : la majorité qui signe l'illimité par défaut (environ 60 % des approbations) et ne révoque pas. Les chiffres de Revoke.cash (2 M d'utilisateurs) montrent que cette majorité se tourne vers l'outil après un incident, pas avant. Les fermetures de Harpie et de Wallet Guard en mars 2025 invitent à la prudence sur le modèle économique.

Ce qui manque comme preuve :
1. Aucun témoignage direct (Reddit et X inaccessibles).
2. Aucune mesure de la part d'utilisateurs actifs mensuels de Revoke.cash, ni par chaîne (Avalanche).
3. Le tableau détaillé de l'enquête de 493 personnes, à lire dans le PDF.
4. Les chiffres officiels de Rabby (utilisateurs, usage de la révocation).
5. Aucune donnée sur la disposition à payer des prudents.
6. Les chiffres d'usage de Web3 Antivirus et de Fire.

# Z1. Quelle part des approbations de jetons est illimitée ?

Date de la recherche : 2026-10-11. Lecture seule. Reddit et X non consultés (non nécessaires). Aucun compte créé.

Légende : [V] = page lue via WebFetch (sortie du lecteur, pas le PDF brut). [NV] = non lue, repris d'un résumé de recherche. Quand une page est un résumé généré par le lecteur, les chiffres ont été relevés tels quels.

## Réponse courte

1. Seule étude académique trouvée avec une part mesurée : 59,8 % d'approbations illimitées sur Ethereum, données jusqu'au 31 juillet 2021.
2. Un seul comptage récent trouvé : 13,9 % sur 1 heure en sept. 2026, sur 5 jetons. Source faible (média, texte assisté par IA).
3. Notre mesure (~45 %, 957 sur ~2106, 200 blocs) tombe entre les deux. Les trois chiffres ne mesurent pas la même chose.
4. Toutes les plateformes ne demandent pas l'illimité. Mais en 2021, 22 sur 22 DApps examinées proposaient l'illimité par défaut.
5. Avalanche : aucun chiffre trouvé.
6. Montant total exposé par les approbations anciennes : introuvable.

## Tableau des chiffres

| # | Valeur | Population | Date | Méthode (une ligne) | URL | Statut |
|---|---|---|---|---|---|---|
| 1 | 59,8 % illimitées (15,2 M sur 25,4 M) | Toutes les transactions `approve` Ethereum, hors ERC-721 | jusqu'au bloc 12 936 339 (31 juil. 2021) | Nœud Geth, détection de la signature `approve`; illimité = uint256 max OU offre totale du jeton | https://ar5iv.labs.arxiv.org/html/2207.01790 (arXiv 2207.01790, RAID 2022) | [V] |
| 2 | 60,3 % des 4,94 M d'adresses ont fait au moins une approbation illimitée (2,9 M) | Adresses émettrices | idem | idem | idem | [V] |
| 3 | 1,8 % de zéros (révocations), 38,4 % autres montants | idem | idem | idem | idem | [V] |
| 4 | ~23 % des approbations dépassent 2^248 sans être comptées illimitées, donc 59,8 % est « conservateur » | idem | idem | Note de bas de page 7 de l'article | idem | [V] |
| 5 | 22,4 % des utilisateurs à « risque élevé » (allowance > 0 et solde > 0). USDC 18,5 %, USDT 23,0 %, DAI 27,1 % | 734 307 (USDC), 1 058 617 (USDT), 319 913 (DAI) adresses | jusqu'au 31 juil. 2021 | RiskAmount = min(allowance, solde) | idem | [V] |
| 6 | 22 DApps sur 22 : illimité par défaut. 2 sur 22 laissent ajuster le montant. 13 sur 22 n'expliquent rien | 22 DApps testées | 2021-2022 | Inspection manuelle des interfaces | idem | [V] |
| 7 | 9 portefeuilles : MetaMask, imToken, Argent permettent de modifier le montant. L'article ne donne pas le défaut de MetaMask | 9 portefeuilles (le texte cite aussi 14 et 16, incohérent) | 2021-2022 | Inspection manuelle | idem | [V] |
| 8 | 0,2 % des comportements suivent la bonne pratique (2 475 sur 1 496 886) | Comportements détectés | jusqu'au 31 juil. 2021 | Classification en 5 modes d'usage | idem | [V] |
| 9 | 13,9 % illimitées (820 sur 5 910). 14,1 % avec 11 approbations quasi max. WETH 22,3 % (477/2140), USDT 11,0 % (130/1181), USDC 8,2 % (203/2475), DAI 7/83, LINK 3/31 | Événements Approval de 5 jetons (USDT, USDC, DAI, WETH, LINK), Ethereum L1 | 14 sept. 2026, 02:54-03:55 UTC, blocs 25 972 833 à 25 973 132 (300 blocs) | Lecture de tous les événements via nœud public. Exclut L2 et Permit2. Flux nouveau, pas le stock | https://cryptoticker.io/en/ethereum-revoke-token-approvals/ | [V] (source faible : analyse interne du média, rédigée avec assistance IA) |
| 10 | MetaMask : ne préremplit pas le montant proposé par la DApp, invite toujours à saisir un plafond. Sur mobile, options personnalisé / Max / « site suggestion » | Comportement produit | page consultée en oct. 2026 | Documentation officielle | https://support.metamask.io/configure/tokens/how-to-customize-token-approvals-with-a-spending-cap | [V] |
| 11 | MetaMask Swaps : « illimité » par défaut pour économiser du gas, modifiable avant envoi. Sur L2 : approbations non infinies par défaut (gas bas) | Comportement produit | page consultée en oct. 2026 | Documentation officielle | https://support.metamask.io/stay-safe/safety-in-web3/why-does-swaps-use-unlimited-token-approvals | [V] |
| 12 | Rabby swap intégré : montant exact (test d'un seul swap). MetaMask, Ambire, Rainbow, Zerion idem. Phantom : illimité non signalé | 1 swap test par portefeuille | date non vérifiée | Inspection du calldata par un contributeur | https://github.com/walletbeat/walletbeat/pull/1185 | [NV] (pull request tierce, non lue) |
| 13 | Permit et Permit2 = 8,72 M$ sur 3 grands cas (38 % des grandes pertes). Approve/increaseApproval = 5,62 M$ sur 3 cas. Pertes drainers 2025 : 83,85 M$ (−83 % vs 494 M$ en 2024) | Pertes phishing | 2025 | Rapport annuel ScamSniffer | titre « −83 % à 84 M$ » lu sur https://drops.scamsniffer.io/ ; détails via agrégateur mexc.com | titre [V], détails [NV] |
| 14 | Permit = ~57 % des pertes de phishing de jetons en valeur | Pertes phishing | 2024 | Analyse ScamSniffer citée par SecJuice | https://secjuice.com/token-approvals-are-the-attack-surface-nobody-revokes/ | [V] (cité, pas primaire) |
| 15 | 405 M$ volés via exploits d'approbations depuis 2020, selon Revoke.cash | Total cumulé | 2020 à ~2023 | Cité par Coinbase | https://www.coinbase.com/blog/security-ps-infinite-token-approvals | [NV] (page en 403) |
| 16 | 3,2 Md$ de « risque potentiel » pour UN portefeuille chaud Binance | 1 portefeuille | date non vérifiée | Somme des approbations de contrats | https://wublock.substack.com/p/dilation-effect-research-contract | [NV] (erreur réseau) |

## Chiffres demandés mais introuvables

| Demande | Résultat |
|---|---|
| Montant total d'actifs exposés par des approbations anciennes (stock mondial) | introuvable. Aucun agrégat public trouvé. Le papier 2021 trace RiskAmount par jeton (fig. 5) sans total en dollars dans le texte |
| Part d'illimité sur Avalanche C-Chain (Core, Trader Joe/LFJ, Pangolin, Benqi, Aave v3, GMX) | introuvable |
| Défaut de Core Wallet pour le plafond d'approbation | introuvable (aucune page support officielle trouvée) |
| Défaut officiel de Rabby pour les DApps externes | introuvable (seul le test tiers #12, non lu) |
| Dashboard Dune public sur la part d'illimité | introuvable |
| Rapports Chainalysis, Trail of Bits, Cyfrin, a16z, Paradigm avec cette part | introuvable. Cyfrin/CodeHawks : seulement des constats d'audit, pas de statistique |
| Part des utilisateurs qui révoquent | introuvable (le papier 2021 dit seulement que la plupart ne révoquent pas tout de suite) |
| Revoke.cash : nombre d'utilisateurs avec approbations illimitées | introuvable. Seule revendication : « plus de 140 M$ de pertes évitées » (auto-déclaré, [NV]) |

## Comparaison avec notre mesure

Notre mesure : ~45 % (957 sur ~2106), 200 blocs Ethereum, trafic présumé légitime.

| Source | Part | Pourquoi ça diffère |
|---|---|---|
| Papier 2021 | 59,8 % | Période 2020-2021 (DeFi summer, DApps illimité par défaut). Compte toutes les transactions `approve`, y compris l'offre totale du jeton |
| Cryptoticker 2026 | 13,9 % | 5 jetons seulement, 300 blocs, exclut Permit2. WETH 22 % mais USDC 8 % |
| Notre mesure | ~45 % | Tous les jetons ou un échantillon différent, 200 blocs. Peut inclure ou exclure les zéros |

Lecture honnête : nous sommes à mi-chemin. Le 13,9 % porte sur 5 jetons majeurs, pas sur tous les jetons. L'écart avec nos 45 % vient plausiblement de la population (long tail de jetons et de DApps) mais ce n'est pas démontré. À vérifier : notre dénominateur inclut-il les approbations à zéro ? Notre seuil « illimité » est-il uint256 max seul, ou aussi les valeurs proches ?

## Toutes les plateformes demandent-elles l'illimité ?

Non, et c'est mesuré :
- 2021 : 22 DApps sur 22 l'ont par défaut [V]. Seules 2 sur 22 laissaient ajuster.
- MetaMask n'en préremplit pas par défaut pour les DApps, mais son propre Swaps est illimité par défaut sur L1 et non infini sur L2 [V].
- Rabby, MetaMask, Ambire, Rainbow, Zerion : montant exact sur leur swap intégré dans un test tiers [NV].
- Donc : l'illimité dépend de la DApp et du portefeuille, et a pu reculer depuis 2021. Aucun chiffre récent robuste ne le quantifie sur tous les jetons.

## Ce qu'on peut citer au jury

1. « Une étude académique (RAID 2022) mesure 59,8 % d'approbations illimitées sur Ethereum, 15,2 M sur 25,4 M, jusqu'à juillet 2021 ; 60 % des adresses en ont fait au moins une. » Toujours donner la date.
2. « Dans la même étude, 22 DApps sur 22 proposaient l'illimité par défaut, et 22 % des utilisateurs avaient des jetons exposés (allowance et solde positifs). »
3. « Notre propre échantillon de 200 blocs donne ~45 % (957 sur ~2106). » Présenter comme mesure interne, trafic présumé légitime, non représentative.
4. « MetaMask documente qu'il invite toujours à saisir un plafond pour les DApps, mais son Swaps est illimité par défaut sur L1. » (doc officielle lue)
5. « Les pertes de phishing par drainers ont été de ~84 M$ en 2025 selon ScamSniffer (titre du rapport), en baisse de 83 %. » (titre lu, sourcer le rapport)

## À ne pas citer

1. Le 13,9 % de Cryptoticker comme « la part actuelle d'illimité » : 1 heure, 5 jetons, média, assistance IA, exclut Permit2. Au mieux « un comptage indicatif ».
2. Tout chiffre sur Avalanche : il n'y en a aucun. Ne rien extrapoler d'Ethereum.
3. Le 60 % présenté comme actuel : il date de 2021.
4. Le 405 M$ (Revoke.cash via Coinbase), le 3,2 Md$ (Binance) et le détail ScamSniffer (agrégateur) : [NV]. Le 3,2 Md$ est une exposition potentielle d'un seul portefeuille, pas un montant volé.
5. « Rabby/MetaMask demandent le montant exact » comme fait général : un test tiers sur un swap, non lu.
6. Les 140 M$ « évités » de Revoke.cash : auto-déclaré.
7. Tout total mondial d'actifs exposés : introuvable.

## Incohérences relevées dans le papier 2021

Le nombre de portefeuilles étudiés est cité 16, 14 puis 9 selon la section. Ne pas citer « x % des portefeuilles » sans relire le PDF. Le PDF brut n'a pas pu être décodé par l'outil, les chiffres viennent de la version HTML ar5iv.

# OA - Mesure de la détection et des faux positifs (barrière d'intention)

Date de recherche : 2026-10-11. Étiquettes : [P] primaire (papier, dépôt, page officielle de données), [S] presse/tiers, [V] vendeur (communication commerciale). "non trouvé" = absent des sources consultées. Les calculs "(calcul)" sont les miens, pas ceux des auteurs. Les cibles de la section 4 sont des PROPOSITIONS, pas des faits sourcés.

Limite de méthode : recherches via WebSearch/WebFetch (réponses résumées par un modèle). Les chiffres cités sont à re-vérifier dans la source avant de les mettre sur un slide.

---

## 1. Comment les acteurs mesurent et publient détection / faux positifs

Constat général : aucun des 8 acteurs n'a publié, dans ce que j'ai trouvé, de définition formelle de "faux positif", de jeu de test, de protocole ni de vérification indépendante. Les chiffres sont des allégations marketing.

| Acteur | Ce qui est publié | Définition / jeu / vérificateur | Étiquette |
|---|---|---|---|
| Blockaid | Page wallet-providers : "false positive rate <0.002%", "verdict latency <300ms", "Detect accurately, 99.998% of the time" (https://blockaid.io/wallet-providers) | La page n'explique ni période, ni jeu de données, ni méthode ; on ne sait pas si 99.998 % est un taux de détection ou une exactitude globale | [V] |
| Blockaid (presse) | Un article rapporte, d'après Blockaid, 0,0002 % de FP sur 165 M transactions/mois ; Blockaid dit préférer sur-signaler | Chiffre déclaratif, non vérifié ; incohérent d'un ordre de grandeur avec <0.002 % (0,0002 % est compatible comme sous-ensemble, mais non expliqué) | [S] |
| Blockaid (critiques) | Cas d'un faux positif sur protocole de confiance temporairement compromis (Balancer, doc MetaMask) ; critique d'un chercheur selon qui des drainers type Angel Drainer pourraient échapper aux simulateurs (Blockaid, Wallet Guard, Pocket Universe) | Anecdotes, aucune mesure systématique | [S] |
| Hypernative | llms.txt : 99,5 % des hacks détectés, 98 % 2+ min avant la première tx ; Transaction Guard : 99,8 % de détection, FP <0.001 % (https://hypernative.io/products/transaction-guard) | Les chiffres varient entre pages (99,5 / 99,8) ; ni jeu ni méthode ni tiers | [V] |
| Pocket Universe | Badge "99.9% Detection Rate" relayé sur une page Kerberus (pas sur un site Pocket Universe) | Aucune méthode, aucun FP | [V] (tiers) |
| Scam Sniffer | Blocklists publiques (258K+ domaines/adresses, déclaré) ; rapports annuels de pertes. Pas de taux de détection ni de FP publié ; un message de forum communautaire évoque des avertissements sur transactions légitimes sans réponse visible | Non trouvé | [V] |
| Wallet Guard | Billet Stormwatcher (3 mai 2023) : détection de drainers par contenu/structure/comportement du site, aucun chiffre. Le site indique "sunset as of March 31, 2025" | Produit arrêté ; aucun chiffre | [V] |
| Kerberus | Aucune allégation de précision/FP trouvée | non trouvé | - |
| Webacy | Aucune allégation de précision/FP trouvée (blog sur détection d'address poisoning existe) | non trouvé | - |
| GoPlus | Blog Transaction Simulation API (août 2025) : dimensions de risque (réputation d'adresse, token, autorisation, phishing URL) | Aucun taux FP/FN trouvé | [V] |

Seule exception de rigueur côté académique : PTXPHISH (voir 2). Pour un jury, la phrase défendable est : "les vendeurs revendiquent <0.001 à 0.002 % de FP sans méthode publiée ; nous publions la nôtre, rejouable".

Pourquoi ces chiffres ne sont pas comparables (raisonnement, pas sourcé) : le dénominateur change (transactions, requêtes, sites, alertes), la définition de FP change (bloqué vs. avertissement affiché vs. avertissement ignoré), et rien n'indique si le trafic est celui d'utilisateurs réels.

---

## 2. Benchmarks publics rejouables

| Jeu | Contenu / format | Taille | Licence | Rejouable sur fork Anvil ? | Étiquette |
|---|---|---|---|---|---|
| PTXPHISH (NDSS 2025, "Dissecting Payload-based Transaction Phishing on Ethereum", arXiv 2409.02386) | Vérité terrain de 5 000 tx de phishing par payload + tx bénignes ; 4 catégories / 11 sous-catégories ; détecteur à règles | Vérité terrain : 5 000 phishing (+ ~13 557 bénignes d'après le tableau de confusion) ; run à grande échelle : 210 000 blocs, 30 976 209 tx (1 mai - 1 juin 2023) ; 300 jours : 130 637 tx de phishing, >341,9 M$ de pertes | Non trouvée. Publication du jeu/code : non trouvée (l'abstract arXiv ne donne aucune URL de dépôt) | Si jeu obtenu : oui, les hashes sont rejouables (fork au bloc N-1). À demander aux auteurs (Zhejiang U.) | [P] |
| PTXPHISH - chiffres | Table IV (arXiv) : phishing vérité terrain TP 4999 / FP 2 / FN 1 ; bénin TP 13555 / FP 1 / FN 2 ; grande échelle TP 12050 / FP 84 / FN 6. Précision/rappel déduits (calcul) : ~99,96 %/99,98 % ; grande échelle ~99,31 %/99,95 %. NDSS annonce F1 >99 % et 390 ms par bloc | Les auteurs ne donnent pas P/R explicites ; la méthode d'étiquetage de la vérité terrain n'apparaît pas dans l'abstract | - | - | [P] |
| PhreshPhish (arXiv 2507.10854) | Sites web de phishing (HTML/URL), pas des transactions. Splits train/test et benchmarks "réalistes" | Carte d'un miroir HF : train 498 255 / test 168 060 | CC-BY-4.0 sur le miroir tiers ; non vérifié sur la page officielle (huggingface.co/datasets/phreshphish/phreshphish) ; mention "recherche anti-phishing" | Non applicable aux transactions. Utile seulement pour la couche "origine/URL" ou pour imiter leur méthodologie (benchmarks à ratio réaliste) | [P] (papier) / [S] (miroir) |
| Forta labelled-datasets (github.com/forta-network/labelled-datasets) | CSV : malicious_smart_contracts (chaîne 1 et 10), phishing_scams (address, is_contract, etherscan_tag, etherscan_labels), etherscan_malicious_labels. Étiquettes issues de Luabase/Etherscan (`exploit`, `heist`, `phish-hack`) | Nombre de lignes non trouvé | MIT | Ce sont des étiquettes d'ADRESSES, pas de transactions : il faut aller chercher les tx (RPC/archive) qui y touchent, puis rejouer. Étiquettes Etherscan = bruit potentiel | [P] |
| ScamSniffer scam-database (github.com/scamsniffer/scam-database) | JSON : blacklist/domains.json, blacklist/address.json (phishing) | Non indiqué (site : 258K+ entrées, déclaré) | GPL-3.0 (copyleft : attention pour réutilisation du code) | Étiquettes d'adresses/domaines ; données libres retardées de 7 jours, mises à jour 24 h ; API temps réel payante 999 $/mois. Pas de tx étiquetées | [P] |
| USENIX Sec. 2025, "Blockchain Address Poisoning" (Tsuchiya, Dong, Soska, Christin) | Étude Ethereum + BSC : 270 M tentatives, 17 M victimes, 6 633 incidents, >=83,8 M$ de pertes ; clustering d'attaquants | Voir ligne précédente | Badge "artifact evaluation available" sur la page, mais aucun lien ni description de données ; non trouvé dans la page | Pour rejouer : reconstruire des cas (adresse lookalike + tx de dust) depuis les hashes du papier si publiés ; sinon générer des cas synthétiques. À vérifier dans le PDF | [P] |
| DeFiHackLabs (github.com/SunWeb3Sec/DeFiHackLabs) | Reproductions d'incidents DeFi en tests Foundry (dossiers `src`, `past`, `script`) | Nombre d'incidents non trouvé (3 974 commits, 6,8k étoiles) | Apache-2.0 | Très adapté au fork (Foundry, `vm.createSelectFork` d'après la structure Foundry ; instructions détaillées non lues). Mais ce sont des EXPLOITS de protocoles côté attaquant, pas des tx de victime signées : peu adapté à la question "intention de l'utilisateur vs effet de sa signature" | [P] |
| Rapport ScamSniffer 2025 | Pertes par signature de drainer : 83,85 M$, 106 106 victimes (-83 % / -68 % vs 2024, base 2024 : 494 M$) ; 11 cas >1 M$ : Permit/Permit2 38 % (3 cas, 8,72 M$), Approve/increaseApproval 3 cas (5,62 M$), Transfer 2 (4,87 M$), EIP-7702 batch 2 (2,54 M$), setApprovalForAll 1 (1,23 M$) ; plafond d'un vol : 6,5 M$ via Permit (sept.) | Estimation basse ; sites de phishing de drainers seulement | Rapport public | Statistiques, pas de dataset de tx. Sert à pondérer la taxonomie d'attaques | [V]/[P] (rapport de vendeur, drops.scamsniffer.io) |
| Dataset public de tx de drainer/permit étiquetées (signatures EIP-712 incluses) | Non trouvé. Les signatures hors chaîne (Permit, Permit2) n'apparaissent dans aucune chaîne tant qu'elles ne sont pas soumises ; un jeu public d'EIP-712 malveillantes ne ressort pas de mes recherches | - | - | Il faudra fabriquer le jeu (voir 3.3) | - |

Rejouer sur Anvil (ce que j'ai pu confirmer vs non) :
- Confirmé par des guides tiers : `anvil --fork-url $RPC --fork-block-number N` (bloc juste avant la tx), `cast run <hash> --rpc-url http://127.0.0.1:8545` pour la trace, `anvil_impersonateAccount` + `cast send --unlocked` pour envoyer comme une adresse sans clé [S].
- Non confirmé par mes sources : rejeu direct d'une tx brute signée via `eth_sendRawTransaction` (en pratique cela dépend du nonce et du chain ID du fork ; à tester). Pour un PoC : impersonation + reconstruction de la tx (to, data, value) au bloc N-1 est la voie la plus sûre.
- Pour la barrière d'intention, le point critique est de rejouer la REQUÊTE de signature (eth_sendTransaction ou eth_signTypedData_v4 avec le payload permit), pas seulement la tx finalisée. Les Permit hors chaîne se simulent en appelant `permit()` puis `transferFrom` sur le fork.

---

## 3. Critères d'écart intention / effet défendables

### 3.1 Matrice (proposition de conception, cohérente avec les types observés dans le rapport ScamSniffer)

Chaque cellule est le verdict d'une règle EXPLICITE et écrite à l'avance. Intentions en mots simples (liste fermée pour le PoC) : envoyer X à A ; échanger X contre Y ; approuver un montant à un protocole ; signer pour se connecter ; réclamer un airdrop ; "je ne veux rien dépenser".

| Dimension de l'effet décodé | Écart "critical" (exemple) | Écart "warning" (exemple) | OK |
|---|---|---|---|
| Qui reçoit (bénéficiaire du transfert) | Adresse différente de celle déclarée (hors routeurs listés) ; adresse lookalike (préfixe+suffixe identiques) | Bénéficiaire inconnu mais cohérent avec le protocole nommé | Identique ou contrat de la liste blanche attendue |
| Quel montant | Sortie > déclaré x tolérance (ex. 1 + slippage) ; ou "tout le solde" | Dépassement dans la tolérance | <= déclaré |
| Quel droit | Intention "envoyer/échanger" mais effet = `approve`/`setApprovalForAll`/`Permit`/`Permit2` sans transfert correspondant ; ou intention "connexion" mais effet = autorisation de dépense | Approbation exacte nécessaire au swap déclaré | Droit = juste le transfert déclaré |
| Quelle durée | Allowance infinie (`uint256.max`) ou `deadline`/`expiration` très lointaine pour une intention ponctuelle | Durée > nécessaire mais bornée | Durée ~ immédiate / une seule opération |
| Quel spender | Spender différent du contrat du protocole déclaré, EOA, ou contrat récemment déployé non vérifié ; ou délégation EIP-7702 | Spender valide mais pas dans la liste attendue | Spender = routeur officiel attendu |
| Effet caché | Appels imbriqués/batch (multicall, EIP-7702 batch) avec sortie d'actifs non déclarée | Appel supplémentaire sans sortie d'actifs | Aucun |

Pourquoi c'est défendable : (a) c'est un test sur l'ÉCART avec ce que l'utilisateur a dit, pas sur une réputation d'adresse (ce qui évite de dépendre des blocklists, qui ratent les attaques inédites) ; (b) chaque cellule est traçable à une classe d'attaque observée : les types du rapport ScamSniffer 2025 (Permit/Permit2, Approve, Transfer, setApprovalForAll, EIP-7702) y sont tous couverts ; (c) la taxonomie de PTXPHISH (4 catégories / 11 sous-catégories) est la référence académique à citer pour la couverture, sans que j'aie lu le détail des catégories.

Limites à annoncer honnêtement : la barrière ne voit pas une intention mal déclarée par l'utilisateur ; elle est aveugle à un site qui convainc l'utilisateur de déclarer une fausse intention ; elle exige un décodage correct des calldata (proxys, multicall).

### 3.2 Méthode de mesure sans circularité

Recommandations de méthode (standard en évaluation, adaptées ici) :
1. Pré-enregistrement : committer (hash git daté) les règles, seuils, définitions de "critical/warning" et le script d'évaluation AVANT de toucher au jeu de test. Publier le hash dans le README.
2. Séparation développement / test : fixer les règles sur un jeu "dev" (ex. cas PTXPHISH/ScamSniffer connus) ; mesurer sur un jeu "test" jamais vu. Séparer par famille d'attaque (leave-one-family-out : on retire par exemple Permit2 au dev et on teste dessus) et par date (le test est postérieur au dev), comme PhreshPhish le fait avec des splits temporels réalistes (je n'ai lu que le résumé de leur méthode).
3. Attaques inédites : au moins un lot de cas écrits par un tiers (coéquipier non impliqué dans les règles) ou issus d'un incident postérieur à la date de gel.
4. Éviter la circularité d'étiquette : ne pas étiqueter "malveillant" avec l'outil testé ; les étiquettes viennent d'une source indépendante (hash d'incident publié, Etherscan/Forta/ScamSniffer) et le "bénin" vient de tx réelles. Pour chaque tx, l'intention est dérivée INDÉPENDAMMENT de l'effet (script d'intention par type de dApp, ou intention saisie par un humain), sinon l'écart est trivialement nul.
5. Trafic légitime réaliste : un échantillon aléatoire de tx d'EOA réelles (swaps Uniswap/aggregators, bridges, approvals légitimes, mints NFT, transferts, ENS), avec des cas "durs" légitimes (approve illimité volontaire, Permit2 d'un vrai swap, batch Safe). Rapporter le FP par catégorie, pas seulement globalement.
6. Métriques : TP/FP/FN/TN bruts, précision, rappel, intervalles de confiance (Wilson), temps de verdict p50/p95. Avec 0 FP sur n tx bénignes, la borne haute à 95 % est ~3/n (règle de trois, calcul) : pour affirmer <0.1 % il faut >=3 000 tx légitimes sans FP ; avec 1 000 tx on ne peut affirmer que <0,3 %.
7. Séparer deux FP : "FP critique" (blocage/écran rouge pour une tx légitime) et "FP warning" (avertissement mineur). La fatigue vient surtout des seconds (voir 4).

Référence de comparaison utile : l'échantillon bénin de PTXPHISH (13 557 tx, 1 FP, tableau de confusion arXiv) est la seule taille/échelle publiée dans mes sources qui permette d'expliciter un FP sur du bénin.

---

## 4. Objectifs chiffrés pour un PoC de 36 h (PROPOSITIONS)

Ancrages sourcés : vendeurs revendiquent FP <0.002 % (Blockaid) et <0.001 % (Hypernative) mais sans méthode [V] ; PTXPHISH : ~1 FP sur 13 557 tx bénignes et latence 390 ms/bloc [P] ; Blockaid <300 ms [V].

| Indicateur | Cible PoC proposée | Justification / réserve |
|---|---|---|
| FP "critical" par 1 000 tx légitimes | <= 1 sur 1 000 (0,1 %), idéalement 0 sur >= 1 000 avec borne haute 0,3 % annoncée | Ne pas viser les 0.001-0.002 % des vendeurs : non démontrable en 36 h (il faudrait ~100 000+ tx). Annoncer la borne statistique |
| FP "warning" par 1 000 tx | <= 20-30 (2-3 %) | Valeur de travail, non sourcée ; à mesurer puis fixer. Viser plus bas pour limiter la fatigue |
| Rappel sur attaques connues (Permit/Permit2, approve, setApprovalForAll, transfer vers lookalike) | >= 90 % sur le dev, rapporter le test séparément | Aucune base publique de rappel vendeur ; PTXPHISH rapporte ~99,9 % mais avec un détecteur à règles taillé pour son jeu |
| Rappel sur attaques inédites (famille retirée) | >= 70 %, annoncer l'écart avec le dev | Honnêteté sur la généralisation : sera très crédible face au jury |
| Latence de verdict (simulation sur fork) | p50 < 2 s, p95 < 5 s ; viser < 300 ms uniquement pour les règles sans simulation | <300 ms est la revendication de Blockaid [V], PTXPHISH 390 ms/bloc [P] ; une simulation sur fork avec RPC distant dépasse souvent ces valeurs (non sourcé, à mesurer) |
| Temps de détection (côté jury) | Montrer l'avertissement AVANT la signature, en < 1 s perçue après la demande | Argument produit : détection pré-signature, pas post-hoc |

### Études sur ignorance des avertissements

- Akhawe & Felt, "Alice in Warningland", USENIX Security 2013, >25 M impressions de télémétrie : taux de passage outre (clickthrough) de l'avertissement SSL 70,2 % sur Chrome et ~33 % sur Firefox [P] (chiffres issus d'un résumé de recherche ; un autre papier de Reeder et al. cité dit qu'après refonte jusqu'à 70 % des utilisateurs Chrome adhèrent : les deux sont de périodes/versions différentes, à vérifier).
- Étude BYU relayée par la presse : les gens ignorent les avertissements logiciels jusqu'à 90 % du temps ; 87 % ignorent une alerte pendant une saisie [S].
- NIST (security fatigue) : beaucoup de participants ignorent les avertissements reçus [S] (détail non lu).
- Crypto : aucune étude publiée mesurant le taux d'ignorance des alertes de wallet (MetaMask/Blockaid) trouvée. Seules preuves adjacentes : TxSum (arXiv 2512.06933, 20 participants) : rejet des tx malveillantes 36 % avec explorateur brut -> 88 % avec explications ; rejet fautif de bénignes 12 % -> 8 % ; identification de la menace 28 % -> 72 % [P, préprint, petit échantillon] ; Mai et al., SOUPS 2020, N=29, modèles mentaux crypto [P]. Un billet d'opinion (daily.dev, 2026) affirme une "alarm fatigue" des outils Blockaid/Hypernative [S, opinion].
- Lecture pour le pitch : citer TxSum comme appui à "expliquer l'effet en mots simples" et Akhawe/Felt comme appui à "un avertissement fréquent ou mal calibré est ignoré, donc FP critique doit être très rare".

---

## Trous à signaler au jury / à combler

- Aucun jeu public de signatures EIP-712 (Permit/Permit2) malveillantes étiquetées trouvé : à fabriquer (rejouer des cas ScamSniffer/Etherscan, générer des variantes).
- Licence/dépôt de PTXPHISH : non trouvés ; écrire aux auteurs.
- Taille des fichiers Forta et du nombre d'incidents DeFiHackLabs : non trouvés (à compter après clone).
- Détail du rejeu `eth_sendRawTransaction` sur Anvil : non confirmé.
- Une des références remontées par la recherche portait un identifiant arXiv au format incohérent (2609.xxxxx) ; je l'ai écartée.

## Sources
- https://blockaid.io/wallet-providers [V]
- https://hypernative.io/products/transaction-guard [V]
- https://www.walletguard.app/blog/stormwatcher [V]
- https://scamsniffer.io/ [V] ; https://github.com/scamsniffer/scam-database [P] ; https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ [V/P]
- https://arxiv.org/abs/2409.02386 (PTXPHISH) [P]
- https://arxiv.org/abs/2507.10854 (PhreshPhish) [P]
- https://github.com/forta-network/labelled-datasets [P]
- https://github.com/SunWeb3Sec/DeFiHackLabs [P]
- https://www.usenix.org/conference/usenixsecurity25/presentation/tsuchiya [P]
- https://research.google/pubs/alice-in-warningland-a-large-scale-field-study-of-browser-security-warning-effectiveness/ [P]
- https://arxiv.org/pdf/2512.06933 (TxSum) [P] ; https://usenix.org/conference/soups2020/presentation/mai [P]
- https://securitymagazine.com/articles/print/87353-security-alerts-are-ignored-90-of-the-time [S]
- https://book.getfoundry.sh/reference/anvil/ [P] (consulté via résultat de recherche seulement)

# L. Post-mortem de Harpie et lecture pour notre "réponse automatique" (Claude-Titouan, 11/10/2026 00h30)

Statut : synthèse des 3 agents L1 à L3 (dossier L_harpie/). Étiquettes [P] dit par l'équipe, [S] presse, [V] vendeur ou recoupé par deux sources. Beaucoup de pages n'ont pas pu être ouvertes ; les montants sont à revérifier. Réponse à MSG-023.

## 1. Ce qu'on sait de Harpie (L1)
- Fermeture annoncée le 27 mars 2025 sur X, avec effet immédiat. Seule raison dite par l'équipe [P] : elle "ne pouvait pas créer un modèle économique durable" (citation reprise par The Block, crypto.news, ForkLog). Le texte brut du fil n'a pas été retrouvé.
- Financement : seed de 4,5 M$ en septembre 2022 (Dragonfly en lead, Coinbase Ventures, OpenSea).
- Revenu : 7 % de l'actif récupéré (livre blanc), puis 0,01 ETH par actif récupéré. Donc de l'argent seulement APRÈS un vol, jamais avant.
- Montants sauvés revendiqués : environ 700 000 $ (presse, décembre 2022) contre plus de 100 000 $ (FAQ de l'équipe, lue via résumé). Écart non réconcilié.
- Limite avouée [P] : Harpie ne servait pas les mempools privés ni Flashbots Protect (page d'aide en 404 à la relecture).
- Non trouvé : utilisateurs, revenus, devenir des fondateurs, date du passage "mempool" à "pare-feu avec liste de confiance".
- Les causes souvent citées (concurrence de Blockaid, Rabby, Revoke ; retraits dans le même bloc ; friction) sont des hypothèses d'analyste : aucune source ne les relie à la fermeture.

## 2. Les sorties du même segment (L2, correction incluse)
| Produit | Fait | Date | Prix | Utilisateurs |
|---|---|---|---|---|
| Wallet Guard | racheté par Consensys (équipe intégrée à MetaMask Product Safety) | 3 juillet 2024 | non divulgué | "centaines de milliers" |
| Wallet Guard | fermeture du service (avis du 17 février 2025) | 31 mars 2025 | | |
| Fire | racheté par Kerberus | 24 sept. 2024 | non divulgué | 50 000 à 60 000 (3,5 M$ levés) [S] |
| Blowfish | racheté par Phantom, service tiers fermé | 19 nov. 2024 | non trouvé | non trouvé |
| Pocket Universe | racheté par Kerberus | 21 août 2025 | "sept chiffres" [S] | environ 200 000 (environ 350 k$ levés) |
| Harpie | fermeture sans acquéreur | 27 mars 2025 | | 4,5 M$ levés |
| Stelo | fermeture sans acquéreur | 31 oct. 2023 | | 6 M$ levés (a16z), raison non trouvée |
Correction à mes messages précédents : j'avais écrit que Wallet Guard avait été absorbé "le 31 mars 2025". C'est faux : le rachat date du 3 juillet 2024, le 31 mars 2025 est la fermeture.

## 3. Ce qui a survécu (L3, 16 produits)
- B2B2C avec traction chiffrée (chiffres des sociétés) : Blockaid (MetaMask, Coinbase Wallet, 50 M$ de série B, 83 M$ au total), Hypernative (plus de 200 clients, 40 M$), Coincover (plus de 600 entreprises, 22 M de portefeuilles protégés).
- Abonnement direct : faible. Webacy déclare 30 000 utilisateurs et 500 k$ d'ARR ; Revoke.cash Ultimate (199 $/an) date de juillet 2026 sans chiffre ; Ledger Recover (9,99 $/mois) a provoqué un rejet de la communauté.
- Exchanges : fonctions incluses sans revenu direct trouvé (Binance Withdraw Protection, mai 2026 ; Coinbase Vault avec délai de 48 h). SEAL 911 est gratuit et bénévole.
- Aucun échec net d'un produit de réponse après compromission documenté en dehors de Harpie. Les statuts d'Argent/Ready, Bitkey, SwissBorg : non trouvés.

## 4. Lecture pour notre produit (interprétation, à discuter)
- Le modèle économique de Harpie est la cause dite. Son revenu tombait seulement après un vol (7 % ou 0,01 ETH par sauvetage) : pas de revenu récurrent, un événement rare, et une course technique contre les mempools privés. Il faisait payer la victime après coup.
- Notre réponse automatique est différente sur deux points : (1) la protection est INSTALLÉE avant (limite, délai, coffre) et ne dépend pas de gagner une course dans le mempool ; (2) le revenu peut précéder l'incident (B2B2C, abonnement premium, assurance).
- Elle partage le risque de fond : si le particulier est le payeur direct, la même question se pose. Le motif des sorties du segment est clair : les petites équipes se font absorber par des portefeuilles (Consensys, Phantom, Kerberus) à des prix modestes ; les survivants sont ceux qui vendent aux portefeuilles et aux entreprises.
- Conséquence : distribution B2B2C (portefeuilles, exchanges, assureurs) dès le départ ; ne pas compter sur l'abonnement de masse ; accepter que l'issue réaliste soit une intégration par un portefeuille. Ne pas présenter le particulier comme le payeur.
- Ce que ce post-mortem ne dit pas : pourquoi les utilisateurs ne payaient pas, ni si le produit "marchait". Il manque les chiffres de Harpie (utilisateurs, revenus).

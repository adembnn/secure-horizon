# U2. Dimensionner le segment particulier crypto EVM et sa protection actuelle (Claude-Titouan, 11/10/2026)

Statut : recherche web (WebSearch, WebFetch). Étiquettes : [P] primaire (société, rapport officiel, page lue), [S] presse ou agrégateur tiers, [V] chiffre de vendeur ou de société non vérifié de façon indépendante, [C] calculé par moi avec la formule indiquée, [H] hypothèse explicite (pas un fait). "Non trouvé" = cherché, pas trouvé. Rien d'inventé.

Limites générales, à lire d'abord :
- Les pages du Chrome Web Store n'ont pas pu être ouvertes (redirection vers une page de consentement). Aucun compteur officiel d'utilisateurs d'extension n'est donc vérifié ici.
- Beaucoup de chiffres 2026 viennent d'agrégateurs (coinlaw, bydfi, mexc, sites de "templates"), de qualité faible, souvent contradictoires. Ils sont signalés [S] et fourchettés.
- Aucune source trouvée ne donne la part dApp (window.ethereum / EIP-1193) contre envoi natif, ni la part extension contre mobile pour MetaMask. Ces deux inconnues sont les plus lourdes pour le SAM : elles sont traitées par hypothèses [H] avec sensibilité (section 6).
- Les sources de contexte (J/SYNTHESE, S3) ont été lues. Leurs chiffres Scam Sniffer sont confirmés ici par lecture directe du rapport 2025.

---

## 1. Utilisateurs actifs par portefeuille (a)

| Portefeuille | Chiffre | Nature du chiffre | Étiquette | Remarque |
|---|---|---|---|---|
| **MetaMask** | "plus de 30 M" d'utilisateurs actifs mensuels (MAU) en janvier 2024, 19 M en septembre 2023 (+55 %) | MAU : charge une page de l'extension OU ouvre l'app mobile au moins une fois sur 30 jours glissants | [P] (blog Consensys du 20 février 2024) | Les sources 2026 répètent ~30 M et >100 M d'utilisateurs cumulés, sans communiqué officiel 2026 [S]. Pic précédent 30 M en 2022, creux ~20 M. Répartition extension / mobile : **non trouvée** |
| **Phantom** | ~15 M MAU (2025) ; 22 M "utilisateurs actifs" début 2026 et 320 M$ de revenus 2025 (citant Forbes, via agrégateurs) | Tous réseaux confondus (surtout Solana) | [S] | Part EVM : **non trouvée** ; EVM (Ethereum, Polygon) supporté depuis mai 2023, Base ensuite. Chiffres de l'extension seule : "plus de 11 M" [S] faible |
| **Trust Wallet** | 200 M de téléchargements cumulés (communiqué mars 2025) ; MAU : ~17 M à ~60 M selon deux agrégateurs | Téléchargements = [P] ; MAU = [S] contradictoire | [P] / [S] | Surtout mobile. Aucun MAU officiel trouvé. Ne pas citer "200 M d'utilisateurs" |
| **Rabby (DeBank)** | 4,2 M d'installations cumulées (juillet 2026, bydfi) ; 466 800 installs Chrome (coinlaw, libellé ambigu) ; 1,2 M MAU ou 3 M MAU (sites de modèles, sans source) | Installs ≠ actifs | [S] faible | Aucun chiffre officiel DeBank. Fourchette de travail MAU : 0,5 à 1,2 M [H] |
| **Coinbase Wallet / Base App** | MAU du portefeuille : **non trouvé**. Repère : 7,6 M utilisateurs transactants mensuels de Coinbase au T2 2026 (8,2 M au T1) | MTU de la plateforme entière, pas du portefeuille | [S] | Ne pas l'utiliser comme taille du portefeuille |
| **Core (Ava Labs)** | MAU / total : **non trouvé** (seul indice : +34 % d'utilisateurs hebdomadaires uniques de l'extension en 2023, sans valeur absolue) | n/a | [P] pour le 34 % | Gasless sur la plupart des transactions C-Chain depuis le 25 mars 2025 [S] |
| **Rainbow** | **Non trouvé** (seule donnée : ~2 100 portefeuilles ont swappé en un mois selon Dune, via The Defiant, ancienne) | n/a | [S] | |
| **OKX Wallet** | ~5 M actifs (estimation mi-2025), ~50 M téléchargements toutes formes, ~1 M utilisateurs de l'extension | Estimations sans source | [S] faible | |
| **Ledger** | 7 à 8 M d'appareils vendus ; 7 à 8 M de comptes Ledger Live | Cumulé | [S] | Chiffre d'actifs : ~100 Md$ "sécurisés" (déclaration du CEO) [V] |
| **Trezor** | Plus de 2 M d'appareils cumulés ou 2,4 M livrés en 2024 (deux chiffres incompatibles) ; pas d'utilisateurs actifs publiés | Cumulé | [S] | Trezor dit : 8 M d'utilisateurs de portefeuille matériel pour 420 M de détenteurs, soit ~2 % [V] ; 8/420 = 1,9 % [C] |
| **WalletConnect** | 55,5 M d'utilisateurs uniques connectés en 2025 ; 392 M de connexions cumulées (179 M fin 2024) ; 85,5 k applications ; 700+ portefeuilles. Mars 2025 : 4 M de portefeuilles actifs par mois, 42,7 M de portefeuilles uniques cumulés ; août 2025 : 15,5 M de connexions par mois | "Connexions" ≠ sessions ; tous réseaux | [P] (bilan 2025 WalletConnect, lu) + [S] pour les chiffres mensuels | Le bilan 2025 ne donne ni portefeuilles actifs mensuels ni part mobile / bureau. Le chiffre de 4 M MAW est de mars 2025 |
| **Safe** | Safe{Wallet} : plus de 4,5 M d'utilisateurs actifs mensuels (octobre 2025). Écosystème : 63 M de comptes créés (+20 % sur un an), 2,73 M de comptes actifs en juin 2026, ~130 M de transactions au T2 2026 | Comptes ≠ personnes | [S] (The Block, lu : 63 M et 2,73 M) | **Biais** : World App = 52 % du volume de transactions et Polymarket = 35,7 % au T2 2026 : très peu de particuliers classiques. Ne pas compter 2,73 M comme particuliers |

Autres repères d'ensemble :
- Détenteurs de crypto dans le monde : 562 M (Triple-A, 2024) ; 659 M (2024) et 741 M (2025) selon Crypto.com [S]. La grande majorité utilise des plateformes (hors périmètre autohébergé).
- Multi-portefeuilles : 62 % des utilisateurs actifs (n ≈ 1 000, États-Unis et Royaume-Uni, étude Reown/Nansen, contenu partiellement sponsorisé) gèrent deux portefeuilles ou plus [V]. Les MAU des portefeuilles ne s'additionnent donc pas.

---

## 2. Répartition extension / mobile / matériel et flux dApp contre envois natifs (b)

Ce qui est trouvé :
- Préférence de type de portefeuille (Reown, États-Unis et Royaume-Uni, n ≈ 1 000, 2025) : mobile = 51 % (54,8 % un an plus tôt) ; matériel ≈ 10 % (+3 points) ; la part bureau / extension n'est pas donnée dans les résumés lus [V]. Le rapport complet n'a pas été ouvert.
- Matériel : ~2 % des détenteurs (Trezor, global, [V]) ; 15 % des utilisateurs américains d'un sondage Tangem (n ≈ 3 200) [V]. Écart énorme : dépend de la population (tous détenteurs contre utilisateurs de portefeuilles autohébergés).
- Extension contre mobile pour MetaMask : **non trouvé**. Pour aucun portefeuille.
- Part des flux dApp (window.ethereum / EIP-1193) contre envois natifs dans l'interface : **non trouvé**, aucune source ni métrique publique.

Faits de structure utiles (pas des pourcentages) :
- Sur mobile, les dApps passent par le navigateur intégré du portefeuille ou par WalletConnect : une extension de navigateur n'y voit rien. Sur bureau, une dApp connectée à un portefeuille mobile par WalletConnect fait signer sur le téléphone : hors de portée d'une extension. [I]
- Un matériel (Ledger/Trezor) utilisé avec MetaMask ou Rabby sur bureau passe par window.ethereum : la requête est visible d'une extension avant le matériel. [I]
- Les approbations et signatures hors chaîne (permit) arrivent via la dApp : c'est le flux dApp qui porte les drainers. Le rapport Scam Sniffer 2025 le confirme indirectement (cas ≥ 1 M$ : Permit/Permit2 = 8,72 M$ sur 22,98 M$, soit 37,9 % [C = 8,72 / 22,98]).

Hypothèses de travail pour le calcul (explicites, à valider) [H] : extension = 40 à 60 % des MAU MetaMask (centrale 50 %) ; parmi les utilisateurs d'extension actifs dans le mois, 50 à 85 % signent au moins une requête dApp (centrale 70 %).

---

## 3. Avalanche (c)

Chiffres trouvés :

| Mesure | Valeur | Période | Étiquette |
|---|---|---|---|
| Adresses actives par jour (C-Chain) | ~621 000 en moyenne ; plages 530 k à 710 k+ | T2 2026 | [S] Nansen (lu) |
| Transactions | 235,6 M au T2 (record, 7e trimestre de hausse) ; 21,9 M au T4 2024 | T2 2026 | [S] Nansen (lu) |
| Utilisateurs Tether | 443 000 (50,2 % de part, +34 % sur le trimestre) ; USDC 131 000 | T2 2026 | [S] Nansen |
| Portefeuilles ayant déplacé 10 $ ou plus | plus de 200 000 | juin 2026 | [S] Nansen |
| Volume DEX | 8,7 Md$ ; volume de transferts de stablecoins 84,4 Md$ (médiane d'un transfert ~113 $) | T2 2026 | [S] Nansen / DefiLlama |
| Frais de protocole | 21 M$ ; frais médian 0,000014 $ | T2 2026 | [S] |
| TVL | ~626 M$ (API DefiLlama lue aujourd'hui, date de capture non précisée) ; 462 M$ au 28 juin 2026 (mexc, repris) ; "~2,1 Md$" cité par d'autres sources | 2026 | [S], **contradictoire** : à vérifier, probablement des définitions différentes. Comparaison à la même lecture : Ethereum ~51,6 Md$, Base ~6,2 Md$, BSC ~5,6 Md$, Arbitrum ~1,4 Md$, Polygon ~0,69 Md$ |
| Adresses actives mensuelles | 3,6 M en mai 2025 (record, Bitrue) ; 2,2 M de portefeuilles actifs mensuels (Token Terminal / Artemis, via presse) | 2025 | [S], contradictoire (définitions) |
| Adresses cumulées | 102 M le 6 septembre (2026 selon la presse reprise) | cumulé | [S], inclut des adresses jetables ou automatisées |
| Jeu MapleStory Universe | 18,8 M de transactions ; 30 353 adresses actives par jour en moyenne | T2 2026 | [S] Nansen |

Lecture [I] : l'essentiel de l'activité (transactions, adresses) vient de stablecoins, de jeux et de flux automatisés. Un chiffre de particulier humain "actif et détenant de la valeur" est plutôt dans l'ordre de **200 000 à 500 000 par mois** [H, ancré sur "plus de 200 000 portefeuilles > 10 $ en juin 2026" comme plancher ; le plafond est ma borne haute]. La TVL est modeste (~0,5 à 0,6 Md$) : peu de capital DeFi particulier à protéger.

Non trouvé : répartition Core / MetaMask / autres sur Avalanche ; chiffres Team1 / Avalanche Foundation 2025-2026 sur les utilisateurs ou les portefeuilles (seul trouvé : programme de subventions Team1 de la note S3, hors utilisateurs) ; adresses actives par portefeuille ; pertes par phishing sur Avalanche (le rapport Scam Sniffer 2025 ne donne pas de ventilation par chaîne).

Protection côté Avalanche : MetaMask a étendu ses alertes Blockaid à Avalanche (communiqué du 20 février 2024 [P]). Core : partenariat Blockaid annoncé le 6 juin 2024 (simulation et alerte avant signature) [S Cointelegraph, lu] ; l'activation par défaut n'est pas précisée. Part des utilisateurs Core protégés : non trouvée.

---

## 4. Niveau de protection actuel par défaut (d)

### 4.1 Par portefeuille

| Portefeuille | Protection | Depuis | Par défaut ? | Étiquette |
|---|---|---|---|---|
| **MetaMask** | Alertes de sécurité Blockaid (simulation + réputation), deux niveaux ("Warning", "Malicious"), l'utilisateur peut confirmer malgré l'alerte | Expérience avril 2023 (OpenSea, opt-in) ; alertes respectueuses de la vie privée en opt-in le 31 octobre 2023 ; **par défaut sur Ethereum Mainnet via l'extension le 29 janvier 2024** ; annonce du 20 février 2024 : activé par défaut pour "100 % des utilisateurs" extension et mobile, réseaux Linea, BNB, Polygon, Arbitrum, Optimism, Avalanche | Oui pour l'extension (Ethereum puis réseaux listés). Mobile : sources contradictoires (communiqué = défaut ; Forklog citant MetaMask = "Experimental", opt-in) ; page d'aide MetaMask non lisible | [P] (blog Consensys lu) / [S] |
| **Rabby** | Simulation avant signature intégrée, avertissement de droits illimités, révocation en lot | Non trouvé (sources faibles) | Présentée comme par défaut [S faible] | [S] |
| **Coinbase Wallet / Base App** | Intégration Blockaid fin 2023 : simulation, avertissement de dApp malveillante ; vendeur : ~800 000 connexions à des dApps malveillantes bloquées, 114 M de transactions et connexions analysées, plus de 75 M$ protégés sur cinq mois (annonce du 13 mars 2024) | Fin 2023 | Non précisé ; pas d'option documentée trouvée | [V] (chiffres société) / [S] |
| **Phantom** | Simulation de transaction sur toutes les applications Solana par défaut ; avertissement "domaine nouveau ou non examiné" ; Blowfish absorbé (date non retrouvée en source primaire). Pas de garantie, "informer, pas certifier" | v0.12.0 (date non retrouvée) ; EVM : non précisé | Oui sur Solana ; EVM : **non trouvé** | [P] (docs Phantom) |
| **Trust Wallet** | Scanner de sécurité intégré (base d'escroqueries, code de contrat, alertes couleur rouge / jaune / vert) ; fournisseur **non trouvé** | Non trouvé | Non précisé | [P] (blog Trust Wallet) |
| **Core** | Blockaid (juin 2024) | 6 juin 2024 | Non précisé | [S] |
| **Ledger** | Clear Signing (ERC-7730) et Transaction Check (Blockaid et autres, appareils Flex et Stax, EVM) | voir S3 | Transaction Check : fonction de l'appareil, activation non vérifiée ici | [P] (S3) |
| **Safe** | Safe Shield (Blockaid, Tenderly, Hypernative) ; Transaction Guard / Hypernative Guardian sur option | voir S3 | Activation Guardian non libre-service (S3) | [P] (S3) |

### 4.2 Part des utilisateurs avec une protection active

- Part des utilisateurs de bureau avec une alerte avant signature par défaut : **non mesurée** dans les sources. Estimation [C/H] : MetaMask extension (12 à 18 M, voir section 6) + Rabby + Coinbase = la grande majorité du SAM central de 19 M. Je retiens que **la part du SAM bénéficiant d'une alerte par défaut de type simulation ou réputation est élevée, de l'ordre de 80 à 90 %** [H, non vérifiable : borne basse = ce qui échappe à MetaMask, Rabby et Coinbase]. Conséquence : l'argument "le particulier n'est pas protégé du tout" est faux pour l'alerte ; il est vrai pour l'intention, la retenue et la réponse après coup.
- Extensions de sécurité dédiées (comptes d'installation) :
  - Pocket Universe : 100 000 utilisateurs affichés (Chrome Web Store, relayé par des trackers, date de capture inconnue) [S] ; "plus de 150 k, 180 k, 200 k+" dans le texte de la fiche ; Kerberus parle de 200 000 utilisateurs lors du rachat (21 août 2025) [V]. Migration vers Sentinel3 annoncée.
  - Wallet Guard : "plus de 100 000 clients" selon une source qui cite le site de la société [V] ; service fermé le 31 mars 2025 (S3) : n'est plus une protection active.
  - Fire : absorbé par Kerberus en septembre 2024 (S3) ; chiffre d'utilisateurs : non trouvé.
  - Scam Sniffer (extension) : non trouvé.
  - Base active dédiée estimée : **0,1 à 0,2 M** [H : Pocket Universe seul, borne basse Chrome Store, haute annoncée]. Part du SAM central de 19 M : 0,1/19 = 0,53 % à 0,2/19 = 1,05 % [C]. Part du MAU MetaMask : 0,2/30 = 0,7 % [C].
- Revoke.cash : environ 2 M d'utilisateurs cumulés, plus de 20 M d'approbations révoquées, plus de 140 M$ "protégés" (page d'accueil, date non précisée) [V]. Cumulé sur la vie du produit : 2/53 (TAM central) ≈ 3,8 % [C, indicatif]. Offre payante : Premium 99 $/an, Ultimate 199 $/an (S3).

### 4.3 Ce que ces protections ne font pas

À partir des sources lues et de S3 (absence de preuve, pas preuve d'absence) :
1. **Elles ne demandent pas ce que l'utilisateur voulait faire** : simulation et réputation décrivent l'effet, pas l'écart avec l'intention. Aucun concurrent trouvé ne compare intention déclarée et effet.
2. **Elles laissent confirmer** : MetaMask affiche l'alerte et laisse signer (documentation Blockaid / MetaMask lue par résumé) ; Phantom : "pas de garantie".
3. **Pas de retenue graduée** (délai, case à cocher, question) au particulier.
4. **Pas de journal local** destiné à l'utilisateur.
5. **Elles sont contournables ou incomplètes** : simulation falsifiable entre aperçu et exécution (S3) ; faux positifs reprochés à Blockaid ; permit hors chaîne et familles inédites non couvertes par réputation seule.
6. **Observation de marché** : malgré les alertes par défaut depuis janvier 2024, Scam Sniffer a compté 106 106 victimes et 83,85 M$ en 2025. La répartition des victimes par portefeuille n'est pas publiée : on ne peut pas dire combien étaient "protégés par Blockaid". [I] : l'alerte seule n'élimine pas le phénomène.

---

## 5. Segmentation du particulier "peu protégé" (e)

Base : TAM central 53 M (section 6). Les parts sont des **hypothèses [H]** quand aucune source n'existe ; les ancrages sourcés sont indiqués.

| Sous-segment | Taille (fourchette) | Ancrage / méthode | Étiquette | Observation |
|---|---|---|---|---|
| **Débutants** (moins de 12 mois d'usage, première approbation) | 6 à 14 M (≈ 12 à 25 % du TAM) | Aucune source directe ; part de nouveaux entrants dérivée de la croissance des MAU : MetaMask +55 % en 4 mois fin 2023 montre un renouvellement élevé, mais pas mesuré en 2026 | [H] | Perte moyenne par victime de drainer : 790 $ [C = 83,85 M$ / 106 106 = 790,2 $], faible disposition à payer. Souvent mobile (Trust) donc hors extension |
| **Utilisateurs DeFi occasionnels** | 5 à 14 M (≈ 10 à 25 % du TAM) | Plancher : 4 M de portefeuilles actifs par mois sur WalletConnect (mars 2025) [P/S] ; Safe 4,5 M MAU (mais biaisé) ; Rabby 0,5 à 1,2 M | [H] ancré [S] | Cœur de cible plausible d'une extension de bureau (signature, swap, approbation) |
| **Détenteurs de NFT / traders de NFT** | 2 à 8 M de détenteurs ; traders actifs : 2,14 M de portefeuilles par trimestre (T3 2025) | DappRadar T3 2025 via agrégateur (traders) ; détenteurs : [H] | [S] / [H] | `setApprovalForAll` : 1 cas ≥ 1 M$ sur 11 en 2025 (1,23 M$). Part en baisse des pertes totales |
| **Utilisateurs de L2 / L1 secondaires (Avalanche)** | Avalanche : 0,2 à 0,5 M par mois (humains, valeur déplacée) ; Base, Arbitrum, Polygon, BNB : non quantifiés | Plancher sourcé (>200 000 portefeuilles > 10 $ en juin 2026) ; plafond [H] | [S] / [H] | Capital faible (TVL ~0,5 à 0,6 Md$). Protection MetaMask étendue à Avalanche depuis février 2024. Core : Blockaid depuis juin 2024 |
| **Seniors / victimes de pig butchering** | Hors du SAM autohébergé : FBI 2025, plus de 60 ans = 4,4 Md$ de pertes crypto pour 44 555 plaintes (≈ 98 750 $ par plainte [C = 4,4 Md$ / 44 555]) ; fraude crypto totale 11,4 Md$ ; guichets de crypto (ATM) : 6 188 incidents, 257,5 M$ | The Block / Decrypt / AARP (lus par résumé) | [S] | Pertes par tête **125 fois** supérieures au drainer moyen [C = 98 750 / 790]. Mais flux = virements depuis des plateformes, bornes de crypto, faux plateformes de trading : une extension EVM ne les voit pas. Le canal de distribution est différent (famille, banque, plateforme) |

Rappel d'échelle [C] : drainers de signature (EVM) 83,85 M$ ≈ 0,74 % de la fraude crypto rapportée au FBI (11,4 Md$) [C = 83,85 / 11 400]. Périmètres différents (États-Unis, toutes méthodes, plaintes déposées contre EVM global détecté par Scam Sniffer) : comparaison d'ordre de grandeur seulement. La cible "particulier autohébergé EVM" est la plus petite poche de perte par catégorie, mais celle où une extension peut agir.

---

## 6. TAM, SAM, SOM (f)

### 6.1 Formules et hypothèses

**TAM : particuliers autohébergés EVM actifs par mois** (personnes, pas comptes).
- Somme brute basse : MetaMask 30 + Trust 17 + OKX 5 + Safe 4,5 + Rabby 1,2 = 57,7 M [S/P] ; haute : 30 + 60 + 5 + 4,5 + 3 = 102,5 M.
- Décote pour recouvrement et non-EVM / inactifs : -40 % (basse), -30 % (haute) [H, ancrée sur "62 % gèrent 2 portefeuilles ou plus"].
- TAM bas = 57,7 × 0,6 = **34,6 M** ; TAM haut = 102,5 × 0,7 = **71,8 M** ; TAM central = moyenne = **53,2 M** [C].
- Réserve : les MAU de MetaMask incluent des comptes automatisés / peu actifs ; Phantom, Coinbase Wallet / Base App et Rainbow ne sont pas ajoutés faute de part EVM sourcée (sous-estime le TAM).

**SAM : extension de bureau avec flux dApp** (périmètre de Hold up : navigateur de bureau Chrome-compatible, requêtes via window.ethereum).
- MetaMask extension = 30 M × part extension (40 / 50 / 60 %) = 12 / 15 / 18 M [C, part = H].
- Autres extensions EVM actives (Rabby, Phantom EVM, OKX, Coinbase, Trust, Core) = 2,5 / 4 / 6 M [H : somme de Rabby 0,5 à 1,2 ; OKX ~1 ; Phantom EVM, Coinbase, Trust, Core de 0,5 à 1,5 chacun].
- SAM extensions = 14,5 / 19 / 24 M [C].
- Part du mois avec au moins une requête dApp signée : 50 / 70 / 85 % [H].
- SAM dApp = 14,5 × 0,50 = **7,3 M** (bas) ; 19 × 0,70 = **13,3 M** (central) ; 24 × 0,85 = **20,4 M** (haut) [C].
- Hors SAM : WalletConnect vers téléphone, mobile, navigateurs non supportés, matériel utilisé seul.

**Exposition annuelle de pertes** (formules de base sur Scam Sniffer 2025 : 83,85 M$, 106 106 victimes) :
- Perte moyenne par victime = 83 850 000 / 106 106 = **790 $** [C].
- Taux de victimes sur TAM central = 106 106 / 53,2 M = **0,20 % par an** [C]. Pertes par utilisateur TAM = 83,85 M$ / 53,2 M = **1,58 $ par utilisateur et par an** [C].
- Taux de victimes sur SAM dApp central = 106 106 / 13,3 M = **0,80 % par an** [C]. Pertes par utilisateur SAM = 83,85 M$ / 13,3 M = **6,30 $ par utilisateur et par an** [C].
- Choix : les victimes de drainers passent par des flux dApp, donc l'attribution au SAM dApp est plus pertinente que celle au TAM. Hypothèse de travail : la totalité des 106 106 victimes appartient au SAM (borne haute du taux, car certains viennent de mobile / WalletConnect).
- Pertes totales exposées du segment : TAM = 83,85 M$ ; SAM = même montant (hypothèse ci-dessus). Pour mémoire 2024 : 494 M$, 332 000 victimes, 1 488 $ de moyenne ; baisse 2025 = 1 - 83,85 / 494 = **83 %** [C].
- Attention : Scam Sniffer compte les pertes qu'il a détectées par signature (EVM), pas la totalité ; il ne couvre ni l'empoisonnement d'adresse, ni les faux supports, ni les attaques physiques.

### 6.2 SOM première année (installations d'utilisateurs)

SOM = SAM dApp central (13,3 M) × taux de pénétration en 12 mois.

| Scénario | Pénétration 12 mois [H] | Utilisateurs (SOM) | Victimes attendues dans la cohorte = SOM × 0,80 % | Pertes exposées dans la cohorte = victimes × 790 $ |
|---|---|---|---|---|
| Bas | 0,05 % | **6 650** | 53 | **≈ 42 k$** |
| Central | 0,15 % | **~19 950 (≈ 20 000)** | 159 | **≈ 126 k$** |
| Haut | 0,50 % | **66 500** | 531 | **≈ 419 k$** |

[C pour chaque cellule ; pénétration = H.] Ancrage de plausibilité : Pocket Universe, extension dédiée, affiche 100 000 utilisateurs (Chrome Web Store) et revendique 200 000 : le scénario haut (66 500 en un an pour un nouvel entrant) équivaut à ~2/3 du stock de ce concurrent établi ; le scénario central (20 000) en est 10 à 20 %. Date de lancement de Pocket Universe non vérifiée ici. Aucune donnée de conversion ou de coût d'acquisition trouvée.

### 6.3 Sensibilité

- **Part extension de MetaMask** (40 / 50 / 60 %) : SAM extensions 14,5 / 19 / 24 M ; effet sur le SOM central = ±25 % environ [C].
- **Part dApp du mois** (50 / 70 / 85 %) : effet sur SAM dApp ×0,71 à ×1,21 [C = 0,50/0,70 ; 0,85/0,70].
- **Pénétration** : ×0,33 à ×3,3 autour du central : domine tout le reste.
- **Taux de perte par utilisateur** : si les installeurs sont plus prudents que la moyenne (auto-sélection) ou si Scam Sniffer sous-compte (multiplicateur ×0,5 à ×2), les pertes de cohorte varient d'autant : de ~21 k$ à ~252 k$ autour du cas central de 126 k$ [C].
- **Ordre de grandeur utile** : même dans le scénario haut, les pertes exposées de la cohorte (~0,4 M$) sont inférieures à 1 % de 83,85 M$ de perte annuelle du segment, et l'effet évité réel dépend du taux de succès (non mesuré). Cela ne finance pas à lui seul un produit payé par le particulier.

### 6.4 Lien avec la thèse (S3)

- Coût d'une victime évitée en valeur : 790 $ par victime moyenne ; avec une probabilité annuelle de 0,80 % dans le SAM, la valeur attendue de protection par utilisateur est 6,30 $/an avant efficacité [C]. Un prix de 99 à 199 $/an (Revoke.cash) est 16 à 32 fois supérieur à cette valeur moyenne [C = 99/6,30 ; 199/6,30], donc le particulier moyen ne paie pas sur la seule perte attendue. Cela confirme l'analyse S3 (particulier = utilisateur, pas payeur) et suggère que la valeur se concentre sur la queue (grosses pertes : 11 cas ≥ 1 M$ = 22,98 M$ = 27 % des pertes 2025 [P]).
- La cible "particulier peu protégé" est à nuancer : l'alerte par défaut couvre déjà l'essentiel du SAM (section 4.2) ; ce qui manque est l'intention, la retenue et la réponse après coup.

---

## 7. Non trouvé / à vérifier avant tout affichage

- MAU officiel 2026 de MetaMask ; part extension / mobile ; part dApp / envois natifs (aucune source pour aucun portefeuille).
- MAU officiels de Trust Wallet, Rabby, Rainbow, Core, Coinbase Wallet / Base App, OKX Wallet, Phantom (part EVM).
- Compteurs d'utilisateurs du Chrome Web Store (MetaMask, Rabby, Phantom, Core, Trust) : pages inaccessibles.
- Répartition Core / MetaMask / autres sur Avalanche ; chiffres Team1 / Avalanche Foundation 2025-2026 sur les utilisateurs ; TVL Avalanche (626 M$ contre 462 M$ contre ~2,1 Md$ : à trancher sur DefiLlama).
- Répartition des victimes de drainers par portefeuille ou par chaîne (Scam Sniffer ne la publie pas dans le rapport 2025) ; part des victimes ayant l'alerte Blockaid active.
- Activation par défaut de MetaMask sur mobile (sources contradictoires) ; date et défaut exacts des alertes Rabby, Trust (fournisseur), Core, Coinbase.
- Nombre d'utilisateurs de Fire, Scam Sniffer extension ; date de lancement de Pocket Universe.
- Taille des sous-segments débutants, DeFi occasionnels, détenteurs de NFT : hypothèses seulement.

## Sources principales
- MetaMask MAU et alertes par défaut : https://consensys.com/blog/metamask-reveals-55-surge-in-users-introduces-default-security-alerts-to ; https://www.businesswire.com/news/home/20231031189171/en ; https://forklog.com/en/news/metamask-expands-security-alerts-across-multiple-networks
- Scam Sniffer 2025 : https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
- WalletConnect bilan 2025 : https://walletconnect.com/blog/walletconnect-2025-year-in-review ; Nansen : https://research.nansen.ai/articles/the-wallet-connect-ecosystem-in-2025-scaling-connectivity-for-the-financial-internet
- Safe T2 2026 : https://theblock.co/news/defi/2026-07-29-safe-smart-accounts-process-nearly-130-million-transactions-in-record-quarter-410023
- Avalanche T2 2026 : https://nansen.ai/post/avalanche-q2-2026-report ; TVL : https://api.llama.fi/v2/chains
- Core x Blockaid : https://cointelegraph.com/news/avalanche-core-wallet-blockaid-security-integration
- Coinbase Wallet x Blockaid : https://www.theblock.co/post/282230/coinbase-wallet-blockaid-75-million-usd
- Pocket Universe / Kerberus : https://www.kerberus.com/articles/pocket_universe/ ; https://www.theblock.co/post/367826/crypto-security-firm-kerberus-acquires-power-universe-anti-fraud-browser-extension-ethereum-solana-wallets
- Phantom : https://docs.phantom.com/developer-powertools/domain-and-transaction-warnings
- Trust Wallet : https://trustwallet.com/blog/security/4-critical-tools-to-enhance-the-security-of-your-trust-wallet ; téléchargements : https://hackernoon.com/trust-wallet-reaches-200-million-downloads-milestone
- Reown étude : https://reown.com/onchainux-report ; https://www.benzinga.com/content/45099893/active-crypto-users-in-us-uk-manage-more-than-two-mobile-wallets-study
- Trezor 2 % : https://www.thebigwhale.io/article/matej-k-trezor-we-can-t-accept-that-only-2-of-crypto-holders-have-a-hardware-wallet
- FBI IC3 2025 : https://www.theblock.co/post/397134/fbi-says-crypto-related-fraud-losses-hit-record-11-4-billion-in-2025-with-seniors-bearing-the-brunt ; https://www.aarp.org/money/scams-fraud/fbi-ftc-report-2025-losses
- Revoke.cash : https://revoke.cash/ ; https://revoke.cash/premium
- Détenteurs de crypto : https://www.solcard.cc/uk/blog/how-many-people-own-crypto
- NFT : https://dappradar.com/reports

---

## Tableau de synthèse chiffré

| Rubrique | Valeur centrale | Fourchette | Étiquette |
|---|---|---|---|
| MetaMask MAU | 30 M | 30 M (officiel jan. 2024) | [P] |
| Phantom MAU (tous réseaux) | 15 à 22 M | part EVM non trouvée | [S] |
| Trust Wallet MAU | non officiel | 17 à 60 M ; 200 M téléchargements | [S] / [P] |
| Rabby | 0,5 à 1,2 M MAU ; 4,2 M installs | non officiel | [S] faible |
| Safe{Wallet} / comptes actifs | 4,5 M MAU ; 2,73 M comptes (juin 2026) | biaisé World App 52 %, Polymarket 35,7 % | [S] |
| WalletConnect | 55,5 M utilisateurs uniques 2025 ; 4 M portefeuilles actifs / mois (mars 2025) | | [P]/[S] |
| Matériel | Ledger 7 à 8 M appareils ; ~2 % des détenteurs (Trezor) | 2 à 15 % selon population | [S]/[V] |
| Avalanche (T2 2026) | ~621 k adresses actives / jour ; 200 k+ portefeuilles > 10 $ ; TVL 0,46 à 0,63 Md$ | humains actifs 0,2 à 0,5 M | [S] / [H] |
| Protection par défaut | MetaMask Blockaid extension : 29 janv. 2024 | part du SAM alertée : 80 à 90 % | [P] / [H] |
| Extensions de sécurité dédiées | 0,1 à 0,2 M actifs = 0,5 à 1,1 % du SAM | | [S]/[V] / [C] |
| TAM (autohébergés EVM actifs) | 53 M | 35 à 72 M | [C] |
| SAM dApp (extension bureau, flux dApp) | 13,3 M | 7,3 à 20,4 M | [C] |
| SOM an 1 (utilisateurs) | ~20 000 | 6 650 à 66 500 | [C] / [H] |
| Pertes annuelles exposées du segment | 83,85 M$ (106 106 victimes, 790 $ en moyenne) | 0,20 % (TAM) à 0,80 % (SAM) de victimes par an | [P] / [C] |
| Pertes exposées dans la cohorte SOM | ~126 k$ | 42 k$ à 419 k$ | [C] |
| Valeur attendue par utilisateur SAM | 6,30 $ / an | 1,58 $ (TAM) | [C] |
| Seniors / pig butchering (FBI 2025, États-Unis) | 4,4 Md$ ; ~98 750 $ par plainte | hors SAM | [S] / [C] |

## Résumé en 12 lignes
1. MetaMask, seul chiffre officiel : plus de 30 M d'actifs mensuels (janv. 2024) ; aucune source ne donne extension contre mobile, ni dApp contre envois natifs : ce sont les deux inconnues majeures du SAM.
2. Les autres MAU (Trust 17 à 60 M, Phantom 15 à 22 M tous réseaux, Rabby ~1 M, OKX ~5 M) sont des chiffres d'agrégateurs contradictoires ; les pages du Chrome Web Store étaient inaccessibles.
3. TAM calculé (autohébergés EVM actifs, après décote de recouvrement) : 53 M, fourchette 35 à 72 M ; SAM dApp (extension de bureau avec flux dApp) : 13,3 M, fourchette 7,3 à 20,4 M.
4. Avalanche : ~621 k adresses actives par jour au T2 2026, mais surtout stablecoins, jeux et automatismes ; humains actifs 0,2 à 0,5 M, TVL ~0,5 à 0,6 Md$ (sources contradictoires, jusqu'à 2,1 Md$ cité).
5. Répartition Core / MetaMask sur Avalanche et chiffres Team1 / Foundation sur les utilisateurs : non trouvés.
6. L'alerte avant signature est déjà par défaut : MetaMask (Blockaid) sur Ethereum via l'extension depuis le 29 janvier 2024, étendue à Avalanche en février 2024 ; Coinbase Wallet fin 2023 ; Core juin 2024 ; Rabby et Phantom avec simulation.
7. Seulement 0,5 à 1,1 % du SAM utilise une extension de sécurité dédiée (Pocket Universe 100 à 200 k) ; Wallet Guard est fermé ; Revoke.cash ~2 M d'utilisateurs cumulés.
8. Ce que ces protections ne font pas : comparer à l'intention, retenir avec friction graduée, tenir un journal local, agir après compromission ; MetaMask laisse confirmer malgré l'alerte.
9. Pertes Scam Sniffer 2025 : 83,85 M$, 106 106 victimes, 790 $ en moyenne ; soit 0,20 % des utilisateurs du TAM ou 0,80 % du SAM par an, et 6,30 $ de perte attendue par utilisateur du SAM.
10. SOM première année : ~20 000 utilisateurs (6 650 à 66 500), soit ~160 victimes attendues et ~126 k$ de pertes exposées dans la cohorte (42 k$ à 419 k$).
11. Seniors et pig butchering pèsent beaucoup plus (FBI : 4,4 Md$, ~98 750 $ par plainte) mais passent par plateformes et bornes de crypto, hors de portée d'une extension EVM.
12. Conclusion : segment large (dizaines de millions) mais valeur de perte par tête faible (6 $/an) ; le particulier n'est pas un payeur crédible ; la thèse tient surtout par la queue de grosses pertes et un canal B2B2C, à confirmer.

# Synthèse de la recherche massive : quels problèmes sont RÉELS, coûteux, mal résolus (Claude-Titouan, 10/10/2026 soir)

Statut : synthèse des 16 rapports d'agents (fichiers A à E dans ce dossier, J1 à J11 dans research/titouan/J_recherche/). Les faits sont ceux des agents, avec leurs étiquettes [P] primaire, [S] presse, [V] vendeur. Plusieurs chiffres viennent de résumés de recherche non rouverts : à rouvrir avant d'afficher. Aucune opinion de ma part dans les chiffres ; mon interprétation est isolée à la fin.

## 1. Ce que les faits disent en bref
- Les pertes sont concentrées dans peu d'événements très gros où le circuit d'approbation est détourné : clés et signataires piégés, serveur de retrait compromis, interface de signature falsifiée, prestataire tiers.
- Le problème dépasse la crypto : fraude au virement et faux ordres en finance traditionnelle, 2,77 Md$ aux États-Unis en 2024 et environ 3 Md$ en 2025 (FBI IC3 [S]).
- Après un vol, la récupération est faible et la réaction lente : part gelée ou récupérée d'environ 5 à 6 % (médiane, 9 cas crypto chiffrés), première réaction publique à environ 73 minutes (médiane, 11 cas), fenêtre de sortie médiane d'environ 119 minutes sur 5 cas seulement (D [S]).
- Aucun concurrent lu ne combine une limite de sortie indépendante du backend et un rapport DORA lié à des preuves on-chain (J3, 19 acteurs).

## 2. Les cinq problèmes, classés
Critères : réalité (cas datés), coût (pertes sourcées), mal résolu (produits existants), acheteur.

### 1. Clés et signataires piégés (ingénierie sociale, malware, accès d'équipe)
- Chiffres : clés privées = 43,8 % de 2,2 Md$ volés en 2024 (Chainalysis [S]) ; infrastructure, clés et signature = environ 76 % des pertes du premier semestre 2026 pour environ 15 % des incidents (TRM [S]). Cas : Drift environ 285 M$ (multisig 2 sur 5, sans délai), WazirX environ 230 M$, Radiant environ 50 M$ (3 signataires sur 11).
- Résolu par un produit ? Partiellement : Safe, MPC, simulation. Dans les cas documentés l'attaquant retire souvent le plafond avec la même clé (Drift, Wasabi, Humanity). Le seul usage public trouvé de plafonds indépendants (Zodiac Roles v2) est ENS, encore en débat (J2).
- Qui paierait : trésoreries de DAO et de protocoles, prestataires de garde, exchanges.

### 2. Backend ou serveur de retrait compromis, et prestataire tiers
- Chiffres : Bitget 351,6 à 387,5 M$ (selon la date des sources), sorties sur environ 3 heures ; part des incidents majeurs d'origine tierce : environ un tiers dans l'UE (ESAs), plus de 80 % en France (AMF, périmètre surtout sociétés de gestion).
- Résolu ? Fireblocks, BitGo et Cobo ont un point de refus avant signature (callback ou politique), mais il fait confiance aux données du backend ; aucun cas client du callback n'a été trouvé (J4).
- Qui paierait : prestataires crypto agréés et exchanges (Fireblocks plus de 2 400 clients, BitGo plus de 4 900).

### 3. Interface de signature falsifiée (signature à l'aveugle)
- Chiffres : Bybit environ 1,46 à 1,5 Md$, soit environ 44 % du total 2025 (Chainalysis [S]). Le délai de retrait de 8 heures de mETH a sauvé environ 43 M$ (D [S]).
- Résolu ? Simulation côté utilisateur (Blockaid, Hypernative Transaction Guard), pas de vérification hors bande généralisée.
- Qui paierait : exchanges, trésoreries multisig.

### 4. Fraude au virement et faux ordres (finance traditionnelle)
- Chiffres : BEC 2,77 Md$ (2024) et environ 3,05 Md$ (2025) (FBI IC3) ; virements en zone euro 2,2 Md€ en 2024 dont environ 85 % supportés par les utilisateurs (BCE/ABE, rapporté par l'agent C) ; cas : Arup (deepfake), Fideuram environ 95 M€ dont environ 53 M récupérés, Bangladesh Bank 81 M$, deux cas brésiliens en 2025.
- Résolu ? Partiellement : vérification du bénéficiaire obligatoire depuis le 9 oct. 2025 (sans rejet imposé), authentification forte, remboursement APP au Royaume-Uni. Manques : plafond de sortie sur comptes de réserve et de règlement, vérification hors bande des ordres urgents.
- Qui paierait : banques, trésoreries d'entreprises. Marché différent de la crypto.

### 5. La déclaration d'incident DORA, lente et sujette à erreurs
- Chiffres : 3 383 incidents majeurs déclarés dans l'UE en 2025 (ESAs [S]) ; l'ACPR et l'AMF constatent que les délais sont "rarement respectés" et que les champs sont souvent faux ou incomplets [S]. Aucun coût chiffré par déclaration ni sanction DORA confirmée.
- Résolu ? Classification et brouillon existent (ServiceNow DRIR, Incident Oracle, D3 Security) mais sans entrée on-chain ; aucun concurrent ne relie un événement on-chain à un champ du formulaire avec preuve (J3).
- Qui paierait : prestataires crypto agréés (362 au 7 oct. 2026 selon un agrégateur de la liste ESMA [S]) et autres entités DORA. Douleur certaine, non monétisée en euros.

Famille voisine non classée : vérificateur ou pont à point unique de défaillance (KelpDAO environ 292 M$, AFX 24 M$, Verus 19 M$, environ 333 M$ en 2026) ; aucun produit trouvé qui lit la configuration d'un vérificateur (E). C'est un autre produit.

## 3. Ce que les agents n'ont PAS trouvé (à ne pas oublier)
- Aucun vol de fonds d'un fonds tokenisé de type BUIDL, Ondo ou Centrifuge (B, J1).
- Aucun vol de fonds par un insider en 2023-2026 (E) : les cas insiders concernent des données.
- Le rachat d'un fonds tokenisé est rarement une signature on-chain : il passe surtout par l'agent de transfert avec règlement bancaire hors chaîne (J1).
- Aucun prix public de produit de prévention (hors Forta 399 $/mois en 2023 et Fireblocks Essentials 999 $/mois qui inclut le moteur de politique).
- Aucun cas documenté montrant l'effet chiffré d'un plafond de sortie (D).
- Aucun jury, grille ni durée de pitch publiés pour l'édition précédente (J6).

## 4. Ce que cela change pour les décisions en cours (mon interprétation, à discuter)
1. La douleur "circuit d'approbation détourné" est réelle, chiffrée et récurrente : D-004 tient.
2. Il y a deux audiences qui ne se recouvrent presque pas. (a) Trésoreries de DAO, protocoles et entreprises tenues par des multisigs, où un plafond hors de portée de la clé qui approuve a une valeur claire mais où DORA ne s'applique pas. (b) Prestataires crypto agréés, où DORA s'applique et où le dossier de déclaration a une valeur, mais dont les fonds sont chez un custodian MPC (chemin d'adoption le plus court : callback Fireblocks, avec un contrat DORA art. 30(3) probable). Le produit actuel mélange les deux : c'est l'"acheteur qui flotte".
3. La cible "fonds tokenisé" est la plus fragile : rachats hors chaîne pour la plupart, DORA vise les gestionnaires, aucun vol documenté.
4. Le rejeu non circulaire est faisable : 12 incidents EVM avec adresses et hashes (7 faciles), 17 adresses Avalanche de trafic de référence dont des "trésoreries calmes" et un hub bruyant qui confirme que la règle "destinataire jamais vu" ne vaut pas pour les hubs clients (J7, J8). Aucune base 30 jours n'a encore été calculée.
5. Côté build : Hardhat 3.19 sait faire des tests d'invariants nativement, ce qui évite Foundry sous Windows ; le limiteur de Chainlink est sous licence restrictive (BUSL) ; il faut coder soi-même le seuil "2 sur 3" au-dessus du contrôleur de délai d'OpenZeppelin (J11).
6. Pistes de pilote nommées : Bitstack, Deblock, Iceblock, Aplo, Coinhouse (agréés AMF), et côté Avalanche EURC de Circle, BENJI de Franklin Templeton, Securitize Europe (J10).

## 5. Fiabilité
Seules quelques pages primaires ont été ouvertes par les agents ; les autres viennent de résumés. Les textes officiels DORA ont été lus à la source (J5) et ont corrigé la spec. Les chiffres de pertes diffèrent selon l'éditeur (Chainalysis, CertiK, SlowMist, TRM, Immunefi) et ne doivent jamais être additionnés.

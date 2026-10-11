# S3. Concurrence, défendabilité et thèse pour demain (Claude-Titouan, 11/10/2026)

Statut : recherche web (WebSearch, quelques pages lues via résumé). Étiquettes : [P] dit par la société ou page officielle (docs, aide, blog de la société), [S] presse ou tiers, [V] chiffre ou affirmation de vendeur non vérifié de façon indépendante, [I] mon interprétation (à discuter). "Non trouvé" = cherché, pas trouvé. Rien d'inventé. Les prix et chiffres peuvent avoir changé : revérifier avant tout slide. Contexte interne lu : L_harpie_postmortem, R_cas_complexes/SYNTHESE, O_barriere_intention, bench/RAPPORT_banc_reel_v0.

Limite générale : beaucoup de pages n'ont pas pu être ouvertes (recherche par résumé). Plusieurs résultats venaient de sites miroirs ou de faible qualité (ignorés). Les points "non trouvé" sont nombreux ; ils sont listés, pas comblés.

---

## 1. Cartographie : concurrents directs et voisins

### 1.1 Tableau synthétique

| Acteur | Particulier | B2B / intégrations | Prix public | Financement / sortie | Statut des faits |
|---|---|---|---|---|---|
| **Blockaid** | Indirect : alertes dans MetaMask (opt-in nov. 2023, par défaut janvier 2024 sur Ethereum, puis Linea, BNB, Polygon, Arbitrum, Optimism, Avalanche), Coinbase Wallet, Ledger Transaction Check (Flex, Stax, EVM) ; Safe Wallet scanne via Blockaid ; D'CENT | API vendue aux plateformes (portefeuilles, exchanges, marketplaces, protocoles). Clients cités : MetaMask, OpenSea, Rainbow, Zerion (2023), Coinbase, Uniswap, Stellar, OKX (profil secondaire) | Non trouvé | Série B 50 M$ en février 2025 (Ribbit, GV, Variant, Cyberstarts), 83 M$ au total ; série A citée entre 27 M$ et 33 M$ selon sources | [S] sauf Ledger/Safe [P] |
| **MetaMask (Consensys)** | Alertes Blockaid par défaut ; simulation sur l'appareil (confidentialité : seule la chaîne est appelée) ; deux niveaux, "Warning" et "Malicious", l'utilisateur peut quand même confirmer | Snaps (extensions de l'écosystème) | Gratuit | Racheté Wallet Guard le 3 juillet 2024, équipe dans "Product Safety" | [P]/[S] |
| **Rabby (DeBank)** | Simulation intégrée, signalement de droit illimité, révocation en lot | Peu de B2B trouvé | Gratuit | Non trouvé | [S] faible qualité, à revérifier |
| **Pocket Universe / Kerberus** | Extension : simulation et alertes avant signature | Non trouvé de B2B | Non trouvé (une licence "Sentinel3 à vie" circule en NFT à ~249 $ en marché secondaire, ce n'est pas un prix de vente) | Pocket Universe racheté par Kerberus le 21 août 2025, "sept chiffres" ; Kerberus avait racheté Fire en sept. 2024 ; projet de fusion dans Sentinel3, positionné "antivirus crypto" | [S] |
| **Wallet Guard** | Extension | Intégré à MetaMask | Gratuit | Racheté 3 juillet 2024, prix non divulgué ; service fermé le 31 mars 2025 (via L2) | [S] |
| **Fire** | Extension | n/a | n/a | Racheté par Kerberus (L2) | [S] |
| **Blowfish / Phantom** | Simulation et avertissements dans Phantom (message "This dApp could be malicious" quand la sortie ne peut pas être prédite) | Phantom l'a absorbé selon une source secondaire ; annonce primaire de rachat non retrouvée dans cette recherche (L2 le donne comme fait, 19 nov. 2024) | n/a | Prix non trouvé | [P] pour l'avertissement Phantom, [S] pour le rachat |
| **Scam Sniffer** | Extension, rapports annuels, base d'adresses | Service de filtrage d'adresses et liste noire, du gratuit open source à l'entreprise (selon fiche Alchemy) | Non trouvé | Financement non trouvé | Rapport 2025 : 83,85 M$ de pertes par hameçonnage de signature, 106 106 victimes, EVM seulement, baisse de 83 % [P] |
| **Revoke.cash** | Gratuit ; Premium 99 $/an (10 portefeuilles) ; Ultimate 199 $/an (surveillance continue, révocation automatique) | Non trouvé | 99 / 199 $ par an (page vue par résumé) | Non trouvé | [P] |
| **Hypernative** | Via Safe (Guardian) | Plus de 200 clients (chaînes, portefeuilles, protocoles, exchanges, gestionnaires, émetteurs de stablecoins), plus de 100 Md$ protégés (chiffre société) ; Transaction Guard | Non trouvé | Série B 40 M$ (juin 2025, Ten Eleven et Ballistic) ; 65 M$ au total | [S]/[V] |
| **Hexagate / Chainalysis** | n/a | Détection on-chain, 20 salariés au rachat | Non trouvé | Racheté par Chainalysis en décembre 2024, prix non divulgué ; estimation de presse ~60 M$ (l'autre chiffre, 8,6 M$, est son seed) | [S] |
| **Webacy** | Abonnement : gratuit, ~10 $/mois, API sur devis (annuaire tiers, pas page officielle) | API de score de risque (Unstoppable Domains, Mintify) | voir à gauche | Seed 4 M$ en 2023, total ~5 M$ ; pas de tour plus récent trouvé | [S] ; 30 000 utilisateurs et 500 k$ d'ARR vus dans L3 |
| **GoPlus** | Extension et pare-feu on-chain | API et SDK pour intégrateurs | Paiement de l'API en jeton GPS selon CoinDesk ; barème non trouvé | ~25 M$ levés selon DefiLlama (3+8+4+10) ; sources divergentes (14 M$ selon une autre) ; revenu de protocole en chute : ~1,84 M$ au T2 2024 à ~35 k$ au dernier trimestre listé | [S] |
| **Coinbase Wallet** | Utilise la technologie Blockaid (détail et date non trouvés) ; page d'aide sur la révocation des droits | Spend permissions, mandats | Gratuit | n/a | [S] |
| **Ledger** | Clear Signing (ERC-7730, affichage lisible sur l'écran sécurisé, métadonnées par dApp ; hors Ledger Wallet dépend du développeur) ; Transaction Check (Blockaid et d'autres fournisseurs, rapport signé vérifié par l'appareil, Flex et Stax, EVM) ; Web3 Checks repris dans l'écosystème. "Ledger Enjoy" : non trouvé | Ledger Enterprise (vérification d'adresse destinataire) | Non trouvé | n/a | [P] |
| **Trezor** | Rien de pertinent trouvé sur une fonction de vérification de transaction (résultats = arnaques d'hameçonnage) | n/a | n/a | n/a | Non trouvé |
| **Safe** | Safe Shield (dans l'interface : signaux Blockaid, Tenderly, Hypernative, simulation, contexte du destinataire, niveaux de gravité ; article d'avril 2026) ; **Transaction Guard** (contrat qui vérifie avant et après exécution) | Hypernative Guardian : score selon politiques du client, bas risque exécuté, suspect signalé, haut risque bloqué ; retrait du Guard demande une transaction signée et un délai de 24 h ; activation non libre-service | Non trouvé | n/a | [P] |
| **Fireblocks** | n/a | Policy Engine : règle bloque, approuve ou exige des signataires en plus ; partenaires de conformité intégrés au moteur (filtrage d'adresses) ; Coincover en option dans les offres | Essentials ~699 $/mois (autre version de la page : 999 $), dépassement ~0,175 à 0,20 % par transaction ; sources en conflit | n/a | [S]/[V] |
| **Coincover** | Protection via partenaires ; garantie de dépôt jusqu'à 1 M$ (selon une source), sauvegarde de clés | Clients cités : BitGo, Curv, Fireblocks ; assurance garantie par Lloyd's ; "plus de 600 entreprises, 22 M de portefeuilles" (L3, chiffres société) | Non trouvé | 9,2 M$ série A (2021), 30 M$ (février 2023, Foundation Capital) | [S] |

### 1.2 Ce que les voisins font réellement, en une ligne
- Simulation de solde + réputation d'adresse/domaine : Blockaid, Rabby, Pocket Universe, Fire, Blowfish, Wallet Guard. C'est le noyau commun [I]. Les limites sont admises même par Phantom ("pas de garantie") et démontrées par la recherche sur l'usurpation de simulation (écart entre prévision et exécution, Scam Sniffer, BleepingComputer).
- Politiques d'entreprise (blocage, délai, co-signature) : Safe Guard + Hypernative, Fireblocks. Ils appliquent les règles DU CLIENT, ils ne les comparent pas à une intention exprimée par l'utilisateur au moment de signer.
- Affichage lisible matériel : Ledger Clear Signing, Transaction Check. Montre ce que la transaction fait ; ne demande pas ce que l'utilisateur voulait faire.
- Révocation : Revoke.cash, Rabby, Coinbase (aide). Après coup.
- Assurance : Coincover. Indemnise ou protège en B2B2C, ne produit pas de mesure d'intention.

### 1.3 Ce qu'aucun ne fait, d'après ce que j'ai trouvé
Cette liste est une absence de preuve dans les sources consultées, pas une preuve d'absence. Les pages produit détaillées n'ont pas toutes été lues.
1. **Comparaison intention déclarée / effet réel, mesurée.** Rien trouvé chez les 20 acteurs. Plus proche : prototype étudiant IntentGuard (Institut Teknologi Bandung, 2026), signature EIP-712 d'une intention structurée avec tests de falsification, petit jeu de tests ; et dans nos notes O1 : presign-guard (agents IA, côté serveur), TetraHelix Guard. Aucun n'est un produit grand public avec jeu de test public.
2. **Retenue avec friction graduée** (délai, case à cocher, question) : MetaMask montre un avertissement et laisse confirmer ; Safe/Hypernative bloque côté client entreprise avec politiques ; aucun trouvé qui impose une friction proportionnée par risque au particulier.
3. **Journal d'audit local** destiné à l'utilisateur : non trouvé.
4. **API de contrôle avant retrait pour exchange** fondée sur l'effet décodé et l'intention : Blockaid vend déjà à OKX et Coinbase (profil secondaire) une API de scan ; Fireblocks fournit des politiques et du filtrage d'adresses. Mais l'angle "retrait demandé par un client, vérifié contre sa raison déclarée" : non trouvé.
5. **Publication de définition de faux positif et de jeu de test** : déjà constaté dans O (OA) : aucun concurrent n'en publie ; chiffres vendeur seulement. La recherche web n'a pas contredit cela. Seule source adjacente : Blockaid dit avoir déployé par étapes "pour éviter les faux positifs" sans mesure publiée (Decrypt 2023) [S].

### 1.4 Ce qui est déjà couvert et qu'on ne peut donc pas vendre comme nouveau
Décodage des approbations, simulation de solde, réputation d'adresse, avertissement avant signature, révocation, délai d'annulation de Safe (24 h pour retirer un Guard), écran sécurisé matériel. Le décodage seul est une commodité.

---

## 2. Où est le fossé défendable (moat)

| Candidat | Défendable ? | Pourquoi (honnête) |
|---|---|---|
| Décodage et simulation seuls | **Non** | Fournis par Blockaid, Tenderly, Rabby, Ledger ; les modèles Clef/Jev sont publics (accessibles à tous) ; ERC-7730 standardise l'affichage ouvert. Commodité. |
| Réputation d'adresses | **Non** | Scam Sniffer publie une base ouverte (GPL-3.0, celle que nous utilisons) ; GoPlus, Webacy, Hypernative la vendent. |
| Intention (concept) | **Faible** | Copiable par MetaMask/Blockaid en un trimestre [I] ; aucune barrière brevet trouvée (non cherché). |
| **Jeux d'attaques étiquetés ET mesurés** | **Moyen à fort si on les construit** | Les vendeurs ne publient pas de jeu ni de définition de FP (OA). Notre banc a déjà des résultats négatifs publiés (âge de contrat, nonce), ce qu'un vendeur ne fait pas. Mais : le jeu ScamSniffer est public et biaisé ; la valeur est dans les jeux fabriqués (permit, Permit2 signé, multicall, familles inédites), absents de toute source ouverte (banc réel : "aucune source ouverte"). |
| **Méthode d'évaluation publique et rejouable** (graine, blocs épinglés, règles hachées avant, split par famille, n publié) | **Moyen, et c'est notre différenciateur le plus crédible** | Coût d'imitation faible mais coût d'adoption élevé pour un vendeur qui a intérêt à ne pas être mesuré. Devient une marque de confiance si un tiers (assureur, exchange, jury) la rejoue. Risque : un concurrent peut dire "on fait pareil" sans le faire ; seule la publication vérifiable protège. |
| Intégration (extension + Snap + API) | **Faible seule** | Les portefeuilles contrôlent la distribution ; seule une extension peut bloquer (O). |
| Marque de confiance | **Fort mais lent** | Se construit par rapports publics répétés, incidents évités et mesures honnêtes. Harpie, Stelo, Wallet Guard ont fermé : la marque seule n'a pas suffi à survivre. |
| Relations exchanges / assureurs | **Fort si obtenues** | Hypernative (200 clients), Coincover (Lloyd's) montrent que la valeur est B2B. Les assureurs ont besoin de données de risque (Coincover s'est décrit comme "pont entre client et assureur fournissant des données de risque", [S]). Un jeu mesuré et rejouable est exactement ce qu'un souscripteur peut utiliser. |
| Vitesse de mise à jour des règles | **Moyen** | Avantage réel contre un grand acteur lent, nul contre Blockaid/Hypernative qui ont des équipes de recherche dédiées (série B de 50 M$ et 40 M$). |
| Données de journal d'audit | **Faible à moyen** | Local par conception (vie privée) : on n'accumule pas de données centralisées. C'est une valeur pour l'utilisateur et l'audit, pas un fossé de données. |

**Lecture [I]** : le seul fossé plausible est la **combinaison** (a) méthode de mesure publique + jeux fabriqués, (b) crédibilité "avertit et ralentit, n'affirme pas protéger", (c) accord avec un exchange ou un assureur qui utilise ces chiffres. Aucun des trois n'est acquis. À dire tel quel au jury : on a un banc et un début de méthode, pas encore un fossé.

---

## 3. Risques de la thèse

| Risque | Gravité | Ce qu'on sait / ce qu'on fait |
|---|---|---|
| **Absorption par un portefeuille** (MetaMask/Blockaid copie "intention en un trimestre") | Haute | Le motif de L2 est net : Wallet Guard (juillet 2024), Fire (sept. 2024), Blowfish, Pocket Universe (août 2025) ont été absorbés, prix souvent modestes ou non divulgués. Réponse : le produit doit valoir même absorbé (méthode et jeu mesurés réutilisables) ; ne pas bâtir l'entreprise sur "nous seuls faisons l'intention". Accepter que l'issue réaliste soit une intégration (L3). |
| **Faux sentiment de sécurité** | Haute | Vocabulaire : "avertit et ralentit", jamais "protège". Aveux dans O : fraude "conforme" invisible, pas de blocage dur. Le banc montre que seul R3 tient ; R1 inutile en critique. Simulation = "informed preview, not a guarantee" (Phantom [P]). |
| **Responsabilité en cas de faux négatif** | Haute | Conditions d'utilisation sans promesse de résultat ; journal local pour prouver ce qui a été affiché ; pas de revenu indexé sur "montants sauvés". Avis juridique : à demander (non trouvé en recherche web ; je n'ai pas qualifié la responsabilité en droit français). |
| **Réglementation, MiCA** | Moyenne | Une source danoise (régulateur) : les portefeuilles non dépositaires ne sont pas soumis à MiCA, la ligne est le contrôle des clés [S]. Notre extension ne garde pas de clés : hors MiCA directement. Les **clients** exchanges sont des PSCA régulés, donc l'API avant retrait doit leur être utile pour leurs obligations ; ça ne nous soumet pas automatiquement, à confirmer par un avocat. Nuance : une règle de la publicité Google (avril 2025) exigerait une licence PSCA pour les annonces de portefeuilles logiciels dans l'UE (source de commentaire, non vérifiée à la source) ; touche la publicité, pas le produit. |
| **DORA** | Moyenne (B2B) | DORA vise les entités financières, dont les PSCA agréés ; le statut d'un fournisseur de logiciel non agréé est "largement indéfini" (Dfns, [S]). Si un exchange nous intègre, il devra nous traiter comme fournisseur TIC (gestion des tiers, audit). Cela favorise le journal d'audit et la reproductibilité ; coût de conformité pour une petite équipe : non trouvé. |
| **RGPD** | Moyenne | Conception : local par défaut, aucune donnée envoyée hors appareil, pas d'adresse en dur ; la phrase d'intention peut contenir des données personnelles ; si Clef/Jev traitent la phrase côté serveur, c'est un transfert à documenter (point à vérifier avec l'équipe). Dossier non trouvé en recherche. |
| **AI Act** | Faible à moyenne | Rien trouvé sur son application à un logiciel de portefeuille. Seule la source qui parle des PSCA qui utilisent l'IA mentionne des obligations pour systèmes à haut risque à partir du 2 août 2026. Notre usage du modèle est limité (aggrave ou escalade seulement, jamais débloque) : bon argument de classement faible risque, mais à faire valider. Obligation de transparence (informer qu'on parle à une IA) : à vérifier. |
| **PSR / PSD3 et responsabilité de fraude** | Opportunité et risque | Texte convenu : les PSP devront rembourser les victimes d'usurpation d'identité et de fraude "autorisée" si la prévention est insuffisante ; application ~21 mois après publication (H2 2027 à début 2028) ; les transferts depuis un portefeuille auto-hébergé sans intermédiaire restent hors champ [S, juin 2026]. Un exchange qui rembourse a un intérêt financier à acheter du ralentissement mesurable : c'est la meilleure hypothèse de demande B2B ; non validée par un exchange. |
| **Mauvaise perception des pop-ups / fatigue** | Haute | Clic-through 70 % (Chrome) contre 33 % (Firefox) selon le design (O) ; MetaMask laisse déjà confirmer malgré l'alerte. Conception : friction seulement sur risque (mesure OBIE 2021 : -18 points avec ciblage) ; la FP est la première métrique ; la FP du filet naïf est 31/1000 sur Ethereum, donc l'intention doit la réduire, ce qui n'est PAS encore mesuré. |
| **Faux positif sur dApps légitimes** | Moyenne | Blockaid a un processus de signalement ("Report an issue") ; on n'en a pas. À prévoir. |
| **Survie économique (Harpie)** | Haute | Harpie : seed 4,5 M$ (Dragonfly), fermée mars 2025, "pas de modèle économique durable" [P]. Les survivants vendent aux portefeuilles et entreprises. Ne pas faire du particulier le payeur. |
| **L'outil lui-même** | Moyenne | Faux Snaps de sécurité, extension compromise (R famille 12) : build reproductible, version épinglée. |

---

## 4. Ce qu'un jury attend d'une thèse business

Je n'ai pas trouvé de grille publique des trois jurys cités. Faits trouvés :
- **KPMG** (concours Global Tech Innovator, pas spécifique crypto, 2025) : six critères pondérés à égalité : disruption/innovation, potentiel de marché, adoption client, traction/marketing, potentiel long terme, qualité du pitch [S, page KPMG lue par résumé]. À prendre comme proxy.
- **Team1 (Avalanche)** : programme communautaire, pas d'accélérateur à jury ; Builder Grants Mini jusqu'à 10 000 $, Accélérateur jusqu'à 30 000 $, comité de vote (membres Avalanche et communauté), lancé 1er juillet 2026 [S]. Critères de sélection : intégrité, initiative, soutien à l'écosystème (côté candidats). Attendu probable [I] : lien avec Avalanche, livraison.
- **Kryptosphère** : association étudiante française ; Pitchathon à EthCC : repérer un vrai problème, une solution nette, convaincre une fondation de livrer sur testnet en 30 jours [S]. Composition du jury et barème : non trouvés.
- Conseils généraux de VC crypto (DWF Labs/Hivemind, 2024) : l'essentiel du projet dans les deux premières minutes, expertise technique [S].

### 4.1 Squelette proposé : Problème → Client → Valeur chiffrée → Revenu → Canaux → Pourquoi nous → Risques

| Bloc | Contenu défendable aujourd'hui | Ce qui manque |
|---|---|---|
| **Problème** | Les victimes déclarent sincèrement une intention banale (O2). Signatures malveillantes : 83,85 M$ de pertes en 2025, 106 106 victimes (Scam Sniffer, EVM) = environ 790 $ de perte moyenne par victime (calcul de ma part, moyenne seulement). Mais c'est la plus petite des grandes catégories (R : 713 M$ portefeuilles compromis, ≥14 Md$ arnaques par transferts conformes) : à dire. | Source primaire pour les 713 M$ et 14 Md$ |
| **Client** | (1) Exchange ou fintech qui rembourse (PSR) : API avant retrait. (2) Portefeuille ou assureur qui veut une mesure. (3) Particulier prudent : utilisateur, pas payeur. | Aucun entretien client réalisé à ma connaissance |
| **Valeur chiffrée** | Banc réel : R3 rappel 80,4 % des approbations d'attaque (Ethereum, n=1 354, 170 spenders), 0,23 % de FP sur 43 075 tx présumées légitimes. Le filet complet : 81,9 % de rappel, 3,15 % de FP. Négatifs publiés (âge de contrat 1,2 %, nonce 44 % FP). | Gain de l'intention (non mesuré), permit hors chaîne (non mesuré), perte évitée en euros (non estimable) |
| **Revenu** | B2B2C par API ou licence (Blockaid, Hypernative, Coincover montrent que le B2B existe). Particuliers : faible (Webacy ~30 000 utilisateurs et 500 k$ d'ARR ; Revoke.cash 199 $/an sans chiffre). Prix publics de référence : Fireblocks ~699 $/mois + 0,175 à 0,20 % par transaction (sources en conflit). | Aucun prix testé avec un client |
| **Canaux** | Portefeuilles, exchanges, assureurs, Snap MetaMask, store d'extension. | Aucune relation établie |
| **Pourquoi nous** | Méthode de mesure ouverte, honnêteté (négatifs publiés), friction ciblée, journal d'audit. | Équipe, avantage de vitesse réel à démontrer |
| **Risques** | §3. | |

### 4.2 Dix questions pièges et la meilleure réponse honnête

1. **"MetaMask fait déjà ça avec Blockaid."** Il fait simulation et réputation. Il ne compare pas à ce que l'utilisateur voulait faire, et ne publie pas de mesure. Vrai aujourd'hui [non trouvé chez eux], et ils peuvent le copier vite. Notre valeur n'est pas le concept mais la mesure publique.
2. **"Pourquoi Harpie a fermé et pas vous ?"** Harpie était payée après le vol et dans une course de mempool. Nous installons avant et visons un revenu avant incident. Mais nous partageons le risque si le particulier est le payeur : nous ne le comptons pas comme payeur.
3. **"Quel est votre taux de faux positifs ?"** Aujourd'hui : filet naïf 3,15 % sur Ethereum, 0,28 % sur la C-Chain ; R3 seul 0,23 %. Objectif ≤1/1000 critique : pas atteint. Avec intention : pas encore mesuré. On publie n et intervalle de confiance.
4. **"Combien d'arnaques arrêtez-vous ?"** On n'arrête rien : on avertit et ralentit. Rappel de R3 80 % sur des approbations directes d'un jeu public étiqueté par un tiers, biais d'étiquetage et circularité possibles ; pas de rappel sur permit hors chaîne ni drainer neuf.
5. **"Vos tests sont circulaires."** Partiellement oui : la liste ScamSniffer peut favoriser les comptes externes. On le dit. Le correctif prévu : jeux fabriqués et signés en local, étiquettes humaines indépendantes (2 lecteurs, 200 transactions).
6. **"Si un utilisateur perd de l'argent malgré votre outil, qui paie ?"** Personne par défaut : conditions sans garantie, journal de ce qui a été affiché. Une couverture par assureur serait une piste, pas un fait. Avis d'avocat à obtenir.
7. **"Les pop-ups ne servent à rien, les gens cliquent."** Vrai pour un design uniforme (clic-through jusqu'à 70 %). On ne montre rien sans risque, la friction est graduée, la sortie "Annuler" visible. La mesure de l'effet en contexte réel n'est pas faite ; données de labo seulement.
8. **"Un fraudeur dit simplement une intention banale."** Oui, les victimes aussi, sincèrement. L'intention n'est utile que pour confronter le droit demandé (un swap n'a pas besoin de droit illimité vers un compte externe) ; le plancher objectif ne descend jamais sous le filet. Le faux conseiller (guidage par un tiers) reste le point faible.
9. **"Êtes-vous soumis à MiCA / DORA ?"** Extension non dépositaire : pas de MiCA direct selon la lecture des régulateurs cités. Un exchange client sera soumis à DORA et nous traitera comme tiers. Non vérifié juridiquement.
10. **"Quelle sortie pour les investisseurs ?"** Les sorties comparables : rachat modeste ou non divulgué (Wallet Guard, Fire, Pocket Universe "sept chiffres"), exception Hexagate ~60 M$ estimé. Probabilité d'une sortie élevée : faible. Pas de promesse de licorne.

---

## 5. Trois formulations de thèse

### 5.1 Prudente : "mesure"
> **« Nous publions un banc rejouable qui mesure combien d'approbations dangereuses un filet simple signale, à quel coût en faux positifs. »**
- À prouver : méthode reproductible, intervalles de confiance, étiquetage indépendant, résultats négatifs inclus.
- Déjà prouvé : R3 rappel 80,4 % des 1 354 transactions d'attaque Ethereum pour 0,23 % de FP sur 43 075 tx (76 % des 170 spenders) ; filet complet 81,9 % / 3,15 % ; négatifs publiés (âge de contrat 1,2 %, nonce 44 % FP). Graine, blocs épinglés. Limites déclarées (circularité, présumé légitime, approbations directes seulement).
- Manque : ancrage de la valeur commerciale ; personne ne paie pour un rapport.

### 5.2 Intermédiaire : "ralentir avec l'intention"
> **« Avant signature, nous comparons ce que l'utilisateur voulait faire à ce que l'opération accorde, et nous ralentissons seulement quand l'écart est dangereux. »**
- À prouver : le gain de l'intention (baisse des FP à rappel égal) sur un jeu étiqueté par humains ; effet de la friction sur le comportement ; latence p50 <2 s ; couverture de permit/Permit2/multicall.
- Déjà prouvé : le filet sans intention (base de comparaison) ; R1 "droit illimité" est inutile en critique (1 % des attaques, 2,3 % du trafic légitime), donc l'intention doit rendre ce signal utile. Signal de preuve sociale : prometteur mais biaisé (d'après l'équipe, ce résultat n'est pas dans les quatre fichiers lus ; je ne le chiffre pas). Âge du contrat : négatif.
- Manque : mesure à 3 bras pas faite, jeu permit absent, gain de l'intention non mesuré.

### 5.3 Ambitieuse : "contrôle de confiance B2B"
> **« Nous devenons la couche de contrôle avant retrait des exchanges et fintechs : une API qui compare la demande à l'effet décodé, retient avec friction, journalise pour l'audit, et dont les performances sont publiées et vérifiables. »**
- À prouver : valeur pour un exchange (fraudes évitées, remboursements réduits, conformité DORA et PSR), intégration, un client pilote, un tiers qui rejoue la méthode, capacité à tenir face à Blockaid/Hypernative.
- Déjà prouvé : rien de commercial. Technique : décodage et filet de base ; l'API avant retrait est dans le périmètre (O) mais je n'ai pas vu de mesure.
- Manque : client, prix, comparaison face au pipeline de scan de Blockaid, test sur transactions d'exchange (retraits de comptes internes, pas des signatures de portefeuille : le banc actuel ne couvre pas ce cas).

**Recommandation [I]** : présenter 5.1 comme base solide, 5.2 comme thèse du projet, 5.3 comme direction. Dire clairement ce qui est prouvé (mesures du banc) et ce qui ne l'est pas.

---

## 6. Non trouvé / à vérifier avant le jury
- Prix publics de Blockaid, Pocket Universe, Scam Sniffer, GoPlus (en dollars), Ledger Transaction Check, Hypernative ; financement de Scam Sniffer, Rabby, Kerberus (montant de levée récent) ; source primaire du rachat de Blowfish.
- Existence de "Ledger Enjoy" ; fonction équivalente chez Trezor.
- Grilles des jurys Team1, Kryptosphère ; éventuel brevet sur "intention vs effet".
- Cadrage juridique (responsabilité, MiCA, DORA, RGPD, AI Act) : aucune source primaire lue ; uniquement résumés de commentateurs.
- Détails d'intégration Coinbase Wallet / Blockaid.
- Preuve que Blockaid/MetaMask n'a pas déjà une fonction d'intention : absence de preuve seulement.

## Sources principales
- Blockaid série B : https://www.theblock.co/news/regulation/2025-02-18-blockaid-closes-50-million-series-b-machine-learning-security-341601
- MetaMask x Blockaid : https://decrypt.co/203803/metamask-launches-new-security-alerts-feature-blockaid ; https://support.metamask.io/configure/wallet/how-to-turn-on-security-alerts
- Blockaid / Ledger Transaction Check : https://blockaid.io/blog/how-blockaid-helps-ledgers-transaction-check-mitigate-blind-signing-risks ; https://www.ledger.com/academy/glossary/transaction-check
- Ledger Clear Signing : https://developers.ledger.com/docs/clear-signing/overview.md
- Safe Shield / Hypernative Guardian : https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative ; https://help.safe.global/articles/3902870017-safe-wallet-security-with-tenderly-blockaid
- Hypernative série B : https://pulse2.com/hypernative-40-million-series-b-raised-for-threat-prevention-platform/amp/
- Hexagate : https://calcalistech.com/ctechnews/article/skfy4vehye ; https://cointelegraph.com/news/chainalysis-acquires-web3-security-firm-hexagate
- Wallet Guard : https://consensys.io/blog/consensys-acquires-wallet-guard-to-enhance-metamask-security
- Pocket Universe / Kerberus : https://www.msspalert.com/brief/kerberus-moves-into-crypto-antivirus-with-pocket-universe-deal
- Scam Sniffer 2025 : https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
- Revoke.cash : https://revoke.cash/premium
- Webacy : https://cryptoslate.com/press-releases/crypto-wallet-security-layer-webacy-raises-4m/
- GoPlus : https://defillama.com/token/gps
- Coincover : https://www.theblock.co/news/deals/2023-02-09-crypto-protection-startup-coincover-raises-30-million-210061
- Fireblocks : https://www.fireblocks.com/platforms/governance-and-policy-engine/
- Phantom : https://docs.phantom.com/developer-powertools/domain-and-transaction-warnings
- MiCA non dépositaire : https://cointelegraph.com/news/denmark-no-ban-self-custody-wallets ; https://www.dfns.co/article/custodial-or-non-custodial-under-micar
- PSR : https://ecovis.lt/regrally-insights-consumer-protection-regulation-june-2026/
- Team1 : https://www.avax.network/about/blog/avalanche-team1-applications-are-now-open
- KPMG Global Tech Innovator : https://kpmg.com/tr/en/home/insights/2025/03/global-tech-innovator-2025.html
- Intention vs simulation : https://blockaid.io/blog/transaction-verification-a-solution-to-blind-signing-in-hardware-wallets

---

## Résumé en 10 lignes
1. Le segment est dominé par Blockaid (83 M$ levés, intégré à MetaMask, Coinbase Wallet, Ledger, Safe) et Hypernative (65 M$, plus de 200 clients) ; les petits outils grand public ont été absorbés (Wallet Guard, Fire, Blowfish, Pocket Universe) ou fermés (Harpie).
2. Aucun acteur trouvé ne compare intention déclarée et effet réel avec mesure publiée ; aucun ne publie de définition de FP ni de jeu de test. Absence de preuve, pas preuve d'absence.
3. Aucun ne propose au particulier une retenue graduée, un journal d'audit local ni une API avant retrait fondée sur l'intention ; Safe/Hypernative et Fireblocks font des politiques d'entreprise, pas de l'intention.
4. Le décodage, la simulation et la réputation d'adresse sont des commodités ; le concept d'intention est copiable par MetaMask/Blockaid vite.
5. Le fossé plausible est la combinaison : méthode de mesure publique et rejouable, jeux d'attaques fabriqués, et accord avec un exchange ou un assureur. Rien de cela n'est acquis.
6. Risques majeurs : absorption, faux sentiment de sécurité, responsabilité sur faux négatif, fatigue des pop-ups, et économie (Harpie). Le non dépositaire est hors MiCA selon un régulateur cité ; DORA/RGPD/AI Act à valider par un juriste.
7. Opportunité réglementaire : le PSR convenu (application vers H2 2027 à début 2028) rend les PSP responsables de remboursements ; un exchange a un motif financier d'acheter du ralentissement mesurable.
8. Jury : pas de grille publique trouvée pour Team1 et Kryptosphère ; proxy KPMG en six critères ; le squelette Problème, Client, Valeur, Revenu, Canaux, Pourquoi nous, Risques et dix questions pièges sont dans le fichier.
9. Trois thèses : mesure (prouvable aujourd'hui : R3 80,4 % de rappel pour 0,23 % de FP, négatifs publiés), ralentir avec l'intention (gain de l'intention non mesuré), contrôle B2B avant retrait (aucune preuve commerciale).
10. Recommandation : thèse 2 comme cap, thèse 1 comme socle prouvé, thèse 3 comme direction ; dire noir sur blanc les limites : circularité des étiquettes, permit non mesuré, particulier non payeur.

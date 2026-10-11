# S1. Payeurs et canaux : pistes de modèle économique pour Sentinelle (recherche du 11/10/2026)

Étiquettes : [P] primaire (éditeur, régulateur, document officiel), [S] presse ou agrégateur, [V] vendeur (déclaration commerciale de la société concernée). "non trouvé" = absent des recherches. Les calculs marqués (calcul) sont les miens, à partir des chiffres cités. Les hypothèses sont signalées "HYP". Rien n'est inventé : quand un prix n'est pas public, c'est écrit.
Point de départ lu : L_harpie_postmortem.md et L1 à L3 (Harpie fermé faute de modèle, revenu seulement après vol ; Wallet Guard, Fire, Pocket Universe, Blowfish absorbés à prix non divulgués ; Blockaid, Hypernative, Coincover survivent en B2B2C).

## 0. Trois faits qui changent la discussion (nouveaux par rapport à L1-L3)

1. Core (le portefeuille d'Avalanche) a déjà intégré Blockaid : annonce du 5 juin 2024, alertes temps réel avant signature [P] https://blockaid.io/blog/blockaid-bolsters-security-on-avalanche-with-core-integration. Aucune condition commerciale publiée (non trouvé). Conséquence : on ne vend pas "un scanner de plus" à Core ; il faut vendre ce que Blockaid ne fait pas (l'écart entre l'intention dite et l'effet réel, la friction graduée, les pièces de plainte).
2. Les produits grand public qui gagnent de l'argent le font surtout par une commission sur les swaps, pas par un abonnement : Revoke Sidekick Standard est financé par 0,8 % de frais sur certains swaps DEX, avec une couverture vol de 30 000 $ fournie par Fairside [P] https://revoke.cash/blog/2026/revoke-extension-update ; Kerberus Sentinel3 passe l'utilisateur en "Pro" par défaut avec "une petite commission sur certains swaps" (taux non trouvé) [P] https://docs.kerberus.com/kerberus/frequently-asked-questions/software-faq/is-there-a-cost-to-use-sentinel3 ; Rabby prend 0,25 % et MetaMask 0,875 % sur les swaps [S] (ethereum.org, support.metamask.io). Sentinelle n'intermédie aucun swap : ce flux de revenu lui est fermé, sauf à s'adosser à un portefeuille.
3. La douleur chiffrée côté particulier : vols sur portefeuilles personnels 713 M$ en 2025 (20 % du total, 44 % en 2024), 158 000 incidents, au moins 80 000 victimes distinctes, "plus de victimes, montants plus petits" [S] Chainalysis via https://www.theblock.co/post/382477/crypto-hack-2025-chainalysis. Soit environ 8 900 $ par victime (calcul 713 M$ / 80 000). Scam Sniffer, périmètre plus étroit (drainers EVM par sites de phishing) : 83,85 M$ et 106 106 victimes en 2025, contre 494 M$ et plus de 332 000 portefeuilles en 2024 [S] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ ; soit environ 790 $ par victime (calcul). Les deux séries ne mesurent pas la même chose ; ne jamais les additionner. Dans les deux cas, la perte moyenne par particulier est trop basse pour justifier un abonnement élevé.

## 1. Qui paie réellement : fiche par payeur

"HYP" = ordre de grandeur de ma part, non sourcé.

### 1.1 Portefeuilles (MetaMask, Rabby, Core, Coinbase Wallet, Phantom EVM)
- Douleur : MetaMask a racheté Wallet Guard (3 juil. 2024, prix non divulgué) pour renforcer sa détection [P] https://consensys.com/blog/consensys-acquires-wallet-guard-to-enhance-metamask-security ; Phantom a racheté Blowfish (19 nov. 2024) et fermé le service tiers [P] https://phantom.com/learn/blog/phantom-acquires-blowfish. Coinbase Wallet : 75 M$ "économisés en 5 mois" avec Blockaid (chiffre Coinbase, cité dans L3) [S]. Ils ont la douleur et le budget, mais deux d'entre eux ont choisi de racheter plutôt que d'acheter en continu.
- Budget plausible : non trouvé. Indice : Blockaid a levé environ 83 M$ au total (50 M$ de série B, 18 fév. 2025, Ribbit en lead) et dit avoir dépassé ses objectifs de revenu sans publier de chiffre [S] https://www.theblock.co/news/regulation/2025-02-18-blockaid-closes-50-million-series-b-machine-learning-security-341601.
- Cycle de vente : non trouvé publiquement. HYP : 6 à 18 mois.
- Achèterait : API de scan (déjà couverte par Blockaid, Hypernative, GoPlus, Webacy) ; un module "intention contre effet" ou "friction graduée" est un complément, pas un remplacement.
- Prix publics : aucun prix Blockaid public (un annuaire tiers le dit, estimation de tiers) [S] https://komo.ai/directory/blockaid. MetaMask : 0,875 % de frais de swap [S].
- Verdict : acheteur réel mais saturé ; fort risque de rachat plutôt que de contrat récurrent (voir L2).

### 1.2 Exchanges et courtiers ("retrait protégé")
- Douleur : Coinbase a estimé 180 à 400 M$ de coûts (remédiation et remboursements volontaires) après la fuite de données de mai 2025 qui a nourri des escroqueries par ingénierie sociale [S] https://www.esecurityplanet.com/news/coinbase-rejects-ransom-data-leak/ (qui cite le dépôt 8-K de Coinbase). C'est la plus forte douleur chiffrée trouvée côté plateforme.
- Réponses déjà en place, gratuites pour le client : Binance Withdraw Protection (mai 2026, verrou de 1 à 7 jours, 48 h par défaut) [S] ; Coinbase Vault (retrait différé 48 h) [P] (cités dans L3). Aucun revenu direct trouvé : ce sont des coûts de produit.
- Budget plausible : non trouvé. L'achat se compare au coût de remboursement évité, pas à un prix de logiciel.
- Cycle de vente : HYP 6 à 12 mois (sécurité, conformité, fraude).
- Achèterait : API de contrôle avant retrait (risque de la destination, cohérence avec l'historique du client, friction graduée), journal d'audit, dossier pour la police. C'est l'offre la plus proche de notre moteur exposé en API.
- Prix publics : voir les repères en 1.9.
- Verdict : meilleur couple douleur / adéquation produit, mais cycle long et concurrence de la solution interne.

### 1.3 Fintechs, néobanques crypto, PSP
- Douleur (forte et réglementée, côté fiat) : au Royaume-Uni, remboursement obligatoire des fraudes par virement autorisé (APP) depuis octobre 2024, plafond 85 000 £ par réclamation, coût partagé 50/50 entre banque émettrice et banque réceptrice ; 173 M£ remboursés la première année (oct. 2024 à sept. 2025) sur 269 000 réclamations déclarées dont 188 000 éligibles, 88 % remboursées [S] https://bratby.law/app-fraud-reimbursement-evaluation/ ; la PSR cite 215 M£ sur l'année civile 2025 (autre période, non comparable) [P] https://www.psr.org.uk/information-for-consumers/app-scams-reimbursement-dashboard/. Dans l'UE, accord politique provisoire sur le règlement PSR du 27 nov. 2025 : remboursement de la fraude par usurpation limité au cas où le fraudeur se fait passer pour la banque du payeur ; un prestataire sans mécanismes antifraude adaptés, ou qui ne bloque pas malgré un soupçon objectif, peut être tenu responsable [S] https://www.taylorwessing.com/en/insights-and-events/insights/2025/11/eu-lawmakers-strike-a-deal-on-payments-reforms. Adoption finale et application aux crypto-actifs : non trouvé.
- Budget plausible : le coût de remboursement. Coûts nets pour les PSP du régime britannique estimés à 44-56 M£ par an (évaluation Frontier pour la PSR, via Bratby) [S] : échelle sectorielle, pas un budget d'achat.
- Cycle de vente : HYP 6 à 12 mois, achat tiré par la conformité.
- Achèterait : API de contrôle avant paiement et avant retrait, journal d'audit opposable, preuve de diligence ("l'établissement a ralenti ou bloqué sur soupçon objectif").
- Prix publics : non trouvé pour les fournisseurs antifraude bancaires.
- Limite : ces textes visent le fiat. Leur transposition aux retraits crypto est un argument par analogie, pas un fait.

### 1.4 Assureurs cyber et assureurs de dépositaires
- Douleur : l'assureur couvre surtout le détenteur des clés ; Aon décrit une capacité d'environ 700 M$ pour des dépositaires qui gardent des dizaines de milliards [S] https://aon.com/getmedia/35d28039-65cb-49f1-97ba-3076072167be/The-Crypto-Capacity_Whitepaper_v3.aspx (date non indiquée). Willis Towers Watson 2025 : la capacité revient, avec des baisses de prime possibles pour qui démontre sa résilience opérationnelle et sa gouvernance du risque [S]. Les estimations de taille de marché divergent d'un facteur 30 (0,31 Md$ selon Mordor, 9,49 Md$ selon Grand View cité par Spark) : définitions différentes, ne pas citer de chiffre unique.
- Budget plausible : non trouvé. L'assureur n'achète pas un logiciel ; il récompense (prime plus basse) ou impose (exigence de contrôle) un contrôle prouvable.
- Cycle de vente : HYP 12 mois et plus, via courtier.
- Reconnaîtrait : preuve d'audit (journal des contrôles avant signature). Modèle réel : Coincover, garantie adossée à des assureurs, vend aux plateformes (plus de 600 entreprises, 22 M de portefeuilles, chiffres société) [V] ; protection de dépôt jusqu'à 1 M$, couverture Lloyd's [S] https://www.theblock.co/post/110691/welsh-crypto-insurer-coincover-lands-9-2-million-series-a-fundraise.
- Prix publics : aucun trouvé pour Coincover. Fairside (partage de coûts, pas assureur) : environ 1,95 % par an du montant couvert, 1 à 100 ETH, source agrégateur non confirmée [S] https://startup-seeker.com/company/fairside~io.
- Commission d'apporteur : aucun taux public trouvé.
- Verdict : levier de crédibilité et de distribution plutôt que premier payeur.

### 1.5 Gestionnaires de patrimoine et family offices
- Douleur chiffrée : non trouvé. Repère de prix : Casa (multisig, récupération, héritage, gros détenteurs) Standard 250 $/an, Premium 2 100 $/an (agrégateur, à confirmer) [S] (cité dans L3). Un gros détenteur accepte donc quelques centaines à quelques milliers de dollars par an quand le produit est perçu comme un coffre.
- Budget, cycle : non trouvé. HYP : cycle court (décision d'une personne) mais volume très faible.
- Achèterait : module premium (alerte à un proche, double validation, journal). Niche, pas un marché de masse.

### 1.6 Employeurs, institutions, trésoreries DAO
- Douleur : plus de deux tiers des fonds volés en 2025 viennent de trois piratages, dont Bybit ; 3,4 Md$ volés au total en 2025 [S] Chainalysis via The Block.
- Offre existante : Safe Shield, lancé le 19 nov. 2025, moteur Hypernative (auto-approbation, signalement ou blocage selon politiques) [P] https://safe.global/blog/safe-launches-shield-to-protect-ethereum-s-trilliondollar-economy ; prix non trouvé.
- Hypernative : plus de 200 clients, plus de 100 Md$ "protégés", 40 M$ en série B (juin 2025), environ 65 M$ au total [S] https://www.theblock.co/amp/post/357627/crypto-security-startup-hypernative-series-b ; SaaS par abonnement ; ARR et tarifs non trouvés.
- Sur ce segment, la brique "intention" est moins différenciée de Safe Shield que pour le particulier. Hors périmètre du hackathon (particuliers).

### 1.7 Protocoles et écosystème Avalanche (subventions)
- Retro9000 : programme de 40 M$ lancé avec Avalanche9000 [S] https://thedefiant.io/news/blockchains/avalanche-announces-usd40m-grant-program-ahead-of-avalanche9000-upgrade. Le tour C-Chain 2026 distribue jusqu'à 40 M$ de récompenses rétroactives, classées sur l'AVAX brûlé par l'activité on-chain (bonus 1,5x pour les nouveaux) : ce critère favorise les applications à fort volume, pas un outil de sécurité [S] https://egamers.io/avalanche-foundation-launches-fourth-retro9000-cohort-for-c/. Cohorte antérieure : plus de 160 000 $ à six projets [S] (même source). Réserve : lecture de la presse ; lire le règlement officiel.
- infraBUIDL() : subventions directes ou rétroactives, par jalons, pour l'infrastructure (rampes, portefeuilles, oracles, ponts, RPC, indexeurs), montants au cas par cas [P] https://avax.network/blog/avalanche-foundation-announces-the-infrabuidl-program. Montants types : non trouvé. Aucune ligne dédiée à la sécurité trouvée.
- Blizzard : fonds de plus de 200 M$, décrit aujourd'hui comme financement de type capital-risque pour projets générateurs de revenus [P] https://docs.avax.network/grants ; modalités et statut 2026 : non vérifiés.
- Verdict : amorçage et crédibilité, pas un modèle récurrent. Risque politique : la demande de Webacy de 812 600 ARB a été contestée sur le forum Arbitrum [S] (cité dans L3).

### 1.8 Fournisseurs de RPC et d'infrastructure
- Douleur, clients, prix : non trouvé. Harpie fonctionnait comme un RPC dédié et a dû demander de le retirer à sa fermeture (L1) ; la friction d'un RPC dédié est connue. Piste de distribution à traiter comme hypothèse, pas comme payeur.

### 1.9 Repères de prix publics (ce qui existe réellement)

| Acteur | Ce qui est public | Modèle |
|---|---|---|
| GoPlus Security API | Gratuit 150 k unités de calcul (CU) par mois ; Test 199 $/mois (6 M CU) ; Beginner 399 $ (16 M) ; Growth 799 $ (37,5 M, SLA 99,5 %) ; Pro 1 899 $ (150 M, SLA 99,9 %) ; Ultra 3 499 $ (375 M, SLA 99,95 %) ; Enterprise sur devis (SLA 99,99 %) [V] https://gopluslabs.io/security-api (lu le 11/10/2026) | Abonnement par paliers de CU. Coût en CU par appel : non trouvé, donc prix par appel non calculable. Calcul : 199 $ pour 6 M CU soit environ 0,033 $ pour 1 000 CU ; 3 499 $ pour 375 M soit environ 0,009 $ |
| GoPlus revenus | Estimations divergentes : 4,7 M$ (CoinDesk cité par Crypto Briefing), environ 4,3 M$ cumulés mars 2024 à juil. 2026 et 164,5 k$ en 2026 (Tokenomics), baisse de 63,9 % sur 90 jours [S] https://app.tokenomics.com/tokenomics/goplus/revenue | Revenus liés au jeton GPS ; fiabilité faible |
| Webacy | Pro 10 $/mois (7 jours d'essai) ; API sur devis [S] https://softwarefinder.com/cybersecurity/webacy ; la page officielle décrit des paliers par CU sans prix, derrière un compte [P] https://docs.webacy.com/pricing ; 30 k utilisateurs et 500 k$ d'ARR déclarés [S] | Abonnement + API par CU |
| Blockaid | Aucun prix public ; clients cités : Coinbase, MetaMask, Stellar, Uniswap, World App ; plus de 101 Md$ d'actifs sécurisés, plus de 71 M d'attaques bloquées (cumulés, société) [V] | API vendue aux entreprises |
| Hypernative | Aucun prix public ; plus de 200 clients [S] | SaaS |
| Chainalysis Hexagate | Rachat par Chainalysis (déc. 2024), prix non communiqué ; environ 60 M$ selon des estimations rapportées par Calcalist [S] https://ynetnews.com/business/article/s1yadtlhkx ; financement antérieur 8,6 M$ ; clients cités : exchanges et fournisseurs de portefeuilles, dont Coinbase et Consensys [S] ; aucun tarif public | Vente entreprise |
| Kerberus | Sentinel3 gratuit ou "Pro" avec commission sur swaps ; couverture 30 000 USDC fournie par Fairside ; API pour portefeuilles : prix et partage de revenu non trouvés [P][S] | Commission swap + API |
| Coincover | Aucun tarif trouvé ; 41,6 M$ levés jusqu'en 2023 ; plus de 600 entreprises [V][S] | B2B, garantie adossée à des assureurs |
| Revoke | Premium 99 $/an, Ultimate 199 $/an (juil. 2026) ; Standard financé par 0,8 % de frais swap ; extension fermée (code non public) [P] | Abonnement + commission |
| MetaMask Transaction Shield | 9,99 $/mois ou 99 $/an, remboursement jusqu'à 10 000 $/mois et 100 transactions, extension navigateur seulement, exclut les portefeuilles compromis ; adoption non trouvée [P] https://support.metamask.io/manage-crypto/transactions/transaction-shield/ | Abonnement du portefeuille lui-même |

Prix par appel d'API en dollars par requête : non trouvé pour tous ces acteurs. Le marché affiche des paliers mensuels (GoPlus) ou des devis, jamais un tarif unitaire public.

## 2. Modèles à comparer et leurs trois points de rupture

### M1. Gratuit pour le particulier + B2B2C payant au palier ou à l'appel
- Principe : l'extension gratuite alimente le moteur ; exchanges, fintechs, portefeuilles paient l'API (repère GoPlus : 199 à 3 499 $/mois, ou devis).
- Rupture 1 : le client a déjà un scanner (Blockaid, Hypernative, GoPlus gratuit jusqu'à 150 k CU). Pourquoi payer pour le nôtre ? Réponse possible : l'intention et l'écart, pas la réputation d'adresse.
- Rupture 2 : cycle long et un client dominant (concentration du revenu).
- Rupture 3 : le moteur sert deux publics (particulier avec intention libre, exchange sans intention exprimée) ; pour l'exchange, l'intention doit venir de son flux : risque de deux produits en un.

### M2. Freemium avec module premium (alerte à un proche, coffre, journal exportable)
- Principe : abonnement type Revoke (99 à 199 $/an) ou Webacy Pro (10 $/mois).
- Rupture 1 : les volumes payants publiés sont faibles : Webacy 500 k$ d'ARR pour 30 k utilisateurs (environ 17 $ par utilisateur, calcul) ; Revoke Ultimate trop récent pour tout chiffre.
- Rupture 2 : perte moyenne par victime de 790 à 8 900 $ selon la source ; un abonnement de 100 à 200 $/an n'est rationnel qu'après un vol, donc le piège Harpie (acheter après).
- Rupture 3 : Ledger Recover (9,99 $/mois) a provoqué un rejet communautaire au lancement [S] ; l'abonnement de masse sans confiance préalable est rejeté.

### M3. Licence SDK / marque blanche pour portefeuille
- Principe : le portefeuille embarque le moteur et paie une licence.
- Rupture 1 : internalisation (Consensys, Phantom ont racheté) ; l'équipe devient la sortie, pas un fournisseur durable.
- Rupture 2 : exigences d'intégration (audit, latence, faux positifs, section 4) et Blockaid déjà en place dans Core.
- Rupture 3 : aucune licence marque blanche avec prix public trouvée ; valorisation impossible à ancrer.

### M4. Commission d'assurance
- Principe : apporter des clients à un assureur ou à un mutualisme (Fairside, Coincover, Evertas) et toucher une commission, ou obtenir une prime réduite pour le client.
- Rupture 1 : capacité limitée et centrée sur les dépositaires [S] ; l'autocustody du particulier est mal couvert (MetaMask Shield exclut les portefeuilles compromis).
- Rupture 2 : taux de commission non public ; l'assureur impose ses contrôles et ses délais de sinistre.
- Rupture 3 : encadrement de l'intermédiation d'assurance (agrément) non vérifié ici, à qualifier avec KPMG.

### M5. "Protection incluse" par l'exchange
- Principe : l'exchange offre le contrôle comme fonction et paie un forfait ou un volume.
- Rupture 1 : l'exchange le construit seul (Binance, Coinbase l'ont fait) ; aucun revenu direct publié pour ces fonctions.
- Rupture 2 : la valeur est la fraude évitée, difficile à prouver sans les données du client.
- Rupture 3 : cycle long, pilotes non payés.

### M6. Subvention d'écosystème (Avalanche)
- Principe : infraBUIDL(), Retro9000, Blizzard financent le développement.
- Rupture 1 : critères orientés activité on-chain (Retro9000 C-Chain) ou projets à revenus (Blizzard) ; ligne sécurité pour particuliers : non trouvée.
- Rupture 2 : non récurrent ; dépendance au calendrier de la fondation.
- Rupture 3 : tension de neutralité (outil de l'écosystème) et critique publique de subventions à des acteurs sécurité (cas Webacy / Arbitrum).

### M7. Don ou bounty
- Principe : SEAL 911 vit de dons et de sponsors (Chainalysis, MetaMask, Uniswap Labs, Ethereum Foundation) ; Safe Harbor : prime de 10 % plafonnée à 1 M$ [S] (cité dans L3).
- Rupture 1 : revenu imprévisible. Rupture 2 : image bénévole, inadaptée à une vente entreprise. Rupture 3 : les primes ne financent que la récupération après coup (piège Harpie).

## 3. Le piège Harpie : revenu après vol ou avant

- Harpie : 7 % de l'actif récupéré (livre blanc), puis 0,01 ETH par actif récupéré ; équipe : n'a "pas pu créer un modèle économique durable" ; montants sauvés non réconciliés (700 000 $ presse 2022 contre plus de 100 000 $ FAQ) ; utilisateurs et revenus non trouvés (L1). Le revenu n'existait que lors d'un événement rare, et seulement si la course était gagnée.
- Revenu avant l'incident chez ce qui survit : abonnement du portefeuille (MetaMask Shield), commission sur swaps (Revoke, Kerberus, Rabby, MetaMask), contrats entreprise (Blockaid, Hypernative, Coincover, GoPlus par paliers). Revenu après l'incident : bounty et Safe Harbor (SEAL), frais de récupération (Harpie).
- Règle à présenter au jury : toute ligne de revenu qui se déclenche seulement sur un vol évité ou récupéré hérite du même défaut. Les lignes défendables sont facturées pour un service rendu en continu (appels, abonnement de plateforme, preuve d'audit).
- Réserve : "vendre avant l'incident" ne règle pas la question du pourquoi acheter. Un exchange achète parce qu'un remboursement coûte plus cher ; un particulier achète souvent seulement après un vol.

## 4. Distribution réaliste

- Pourquoi un portefeuille adopterait un module externe : seulement s'il est plus rapide qu'un développement interne et déjà prouvé ; les sorties de L2 montrent qu'il préfère racheter. Argument à tester : le module apporte le "pourquoi" (l'intention), absent des scanners.
- Ce qu'il faut pour être intégré :
  - audit de sécurité externe (HYP) ;
  - attestation de type SOC 2 : première année de 30 000 à 110 000 $ tout compris selon des éditeurs de conformité (Drata, Vanta, Thoropass, qui vendent le service, donc source à biais) [V] https://blog.getagency.com/articles/soc-2-audit-cost-for-startups ; Type 2 = observation de 3 à 12 mois ;
  - engagement de latence et de disponibilité : GoPlus affiche des SLA de 99,5 à 99,99 % selon le palier [V] ; exigences des portefeuilles : non trouvé ;
  - taux de faux positifs : la critique existe sur Core/Blockaid (Cointelegraph, "trop de faux positifs") [S] ; risque produit à prévoir.
- MetaMask Snaps : liste blanche manuelle avec deux approbations ; depuis 2024, un audit n'est exigé que pour les Snaps qui utilisent les API de gestion de clés (source de 2024, à revérifier) [P] https://docs.metamask.io/snaps/how-to/get-allowlisted. Un Snap d'analyse de transaction n'aurait donc pas forcément besoin d'audit pour être listé, mais ne touche que les utilisateurs de MetaMask.
- Chrome Web Store : distribution directe sans intermédiaire ; la place est abîmée par des extensions piégées (49 fausses extensions de portefeuilles retirées en 2020 ; 19 extensions légitimes devenues malveillantes) [S] ; politique actuelle pour les extensions crypto et limites de Manifest V3 pour intercepter une signature : non trouvées, à vérifier techniquement avant la démo.
- Core : Blockaid en place depuis juin 2024. Voie : pilote complémentaire proposé à Ava Labs ; qu'une seconde API tierce y soit acceptée n'est pas documenté.
- Précédent d'extension indépendante : Kerberus (Sentinel3) a racheté Fire (2024) et Pocket Universe (2025, "sept chiffres" selon la presse) [S] ; revenus non publiés.

## 5. Trois scénarios classés par défendabilité devant un jury

Les chiffres sont des ordres de grandeur construits sur des repères publics, pas des prévisions.

### Scénario 1 (le plus défendable) : API de "contrôle avant retrait" pour exchanges et fintechs, extension gratuite en vitrine
- Logique : payeur motivé par une perte chiffrée (Coinbase 180 à 400 M$ ; remboursements APP britanniques de 173 M£ la première année ; PSR de l'UE en cours) ; produit déjà prévu (API, journal d'audit, pièces de plainte) ; facturation continue, donc hors piège Harpie.
- Prix d'ancrage : paliers GoPlus de 199 à 3 499 $/mois ; Enterprise sur devis.
- Ordre de grandeur (HYP, calcul) : 10 clients à 800 $/mois = 96 k$/an ; 10 clients à 3 500 $/mois = 420 k$/an. Prix d'un contrat d'exchange sur devis : inconnu.
- Limites : aucun prix par appel public ; aucune preuve qu'un exchange paie pour de l'intention ; cycle long ; la douleur réglementaire est surtout fiat.
- Pourquoi défendable : un jury avec KPMG lit "responsabilité, preuve d'audit, diligence" ; le chiffre de perte vient d'un régulateur ou d'un dépôt boursier, pas d'un vendeur.

### Scénario 2 : intégration dans l'écosystème Avalanche (Core, protocoles), amorcée par infraBUIDL(), avec option licence SDK
- Logique : la fondation a un programme infrastructure qui nomme les portefeuilles ; le jury compte Team1 Avalanche ; Core ouvre la distribution.
- Ordre de grandeur : une cohorte Retro9000 observée à 160 000 $ pour six projets, environ 27 k$ par projet (calcul) ; montants infraBUIDL non trouvés.
- Limites : Core a déjà Blockaid ; Retro9000 C-Chain récompense l'activité on-chain ; Blizzard vise des projets à revenus ; aucun programme sécurité trouvé ; non récurrent. Utile pour l'amorçage et comme porte d'entrée.
- Défendabilité : forte devant Avalanche, moyenne devant KPMG (pas un modèle durable en soi).

### Scénario 3 (le moins défendable) : freemium avec modules premium et partenaire d'assurance
- Logique : alerte à un proche, coffre, journal, couverture partenaire (modèles Revoke Standard avec Fairside, Kerberus avec Fairside, MetaMask Shield).
- Ordre de grandeur : abonnements de 99 à 199 $/an (Revoke), 99 $/an (MetaMask), 120 $/an (Webacy Pro à 10 $/mois, calcul) ; Webacy déclare 500 k$ d'ARR pour 30 k utilisateurs ; 1 000 abonnés à 100 $/an = 100 k$/an (calcul HYP).
- Limites : revenu déclenché par la peur après un vol (piège Harpie sous une autre forme) ; Ledger Recover rejeté ; taux de conversion publics : non trouvés ; les produits grand public rentables utilisent une commission sur swaps que Sentinelle n'a pas.
- Défendabilité : faible comme modèle principal, acceptable comme extension future.

### Ce que le jury attaquera
1. "Qui paie ?" Réponse : l'exchange et la fintech, pas le particulier ; chiffre de douleur en appui.
2. "Pourquoi pas Blockaid ?" Réponse : Blockaid évalue adresses et contrats ; nous comparons ce que la personne a dit à ce que l'opération fait.
3. "Qui vous rachète ?" Réponse honnête : l'issue de L2 existe ; le contrat B2B la repousse ou la valorise.
4. "Aucun client." Réponse : le dire, et montrer le plan de pilote.

## 6. Ce qui reste non trouvé ou fragile
- Tarifs de Blockaid, Hypernative, Coincover, Hexagate, Safe Shield, Kerberus API ; prix par appel public pour tous ; taux de commission d'assurance.
- Douleur chiffrée des family offices, des employeurs, des fournisseurs de RPC ; durées de cycle de vente de tous les payeurs (les miennes sont HYP).
- Montants infraBUIDL, règlement officiel Retro9000 2026, statut 2026 du fonds Blizzard.
- Statut final du règlement PSR de l'UE et application aux crypto-actifs.
- Politique actuelle du Chrome Web Store pour les extensions crypto.
- Revenus et nombre d'abonnés de MetaMask Shield, Revoke Ultimate, Ledger Recover.
- Prix de rachat de Wallet Guard, Fire, Blowfish : non divulgués ; Pocket Universe "sept chiffres" [S] ; Hexagate environ 60 M$ [S] estimation.

## Résumé en 10 lignes
1. Le particulier ne peut pas être le payeur : perte moyenne par victime d'environ 790 $ (Scam Sniffer 2025) à 8 900 $ (Chainalysis 2025), et l'abonnement de masse est faible (Webacy 500 k$ d'ARR pour 30 k utilisateurs, Ledger Recover rejeté).
2. Les produits grand public qui gagnent de l'argent monétisent un swap (Revoke 0,8 %, Kerberus, Rabby 0,25 %, MetaMask 0,875 %) ; Sentinelle n'intermédie pas de swap et ne peut pas copier ce flux.
3. Les payeurs les plus motivés par une perte chiffrée sont les exchanges (Coinbase : 180 à 400 M$ de coûts en 2025) et les fintechs soumises au remboursement (Royaume-Uni : 173 M£ la première année ; UE : accord provisoire sur le PSR, texte final non vérifié).
4. Les portefeuilles ont le budget mais rachètent (Wallet Guard, Blowfish), et Core a déjà Blockaid depuis juin 2024.
5. Prix publics : seul GoPlus publie des paliers (199 à 3 499 $/mois, gratuit jusqu'à 150 k CU) ; Blockaid, Hypernative, Coincover, Hexagate, Kerberus API : non trouvés ; aucun prix par appel public.
6. Piège Harpie : tout revenu déclenché par un vol est fragile ; garder des lignes facturées en continu (API, preuve d'audit).
7. Subventions Avalanche : amorçage non récurrent ; Retro9000 C-Chain classé sur l'activité on-chain, aucune ligne sécurité trouvée, montants infraBUIDL non trouvés.
8. Distribution : Snap MetaMask (audit exigé seulement pour la gestion de clés, source 2024), Chrome Web Store, ou pilote avec un exchange ; SOC 2 d'environ 30 à 110 k$ la première année (sources de vendeurs).
9. Classement de défendabilité : (1) API de contrôle avant retrait pour exchanges et fintechs, (2) intégration Avalanche amorcée par subvention, (3) freemium avec assurance partenaire.
10. À assumer devant le jury : aucun client signé, durées de vente en hypothèse, analogie fiat vers crypto, issue de rachat plausible.

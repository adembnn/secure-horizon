# Protections pour particuliers hors MetaMask natif, et contre-exemples à l'originalité de Hold up

Date de lecture : 2026-10-11. Complète `RECHERCHE_metamask_couverture.md` (MetaMask n'est pas refait ici).

Légende :
- [V] lu ce jour sur une source officielle (site, doc, dépôt, annonce de l'éditeur).
- [P] lu ce jour dans la presse spécialisée ou une source tierce. À confirmer à la source avant une slide.
- [NV] non vérifié ou non trouvé.
- Réserve de méthode : l'outil de lecture résume les pages. Les citations sont courtes et à relire à la source avant d'être projetées. Aucun produit n'a été installé ni testé.
- Trois formules distinctes sont utilisées : « fait », « ne fait pas d'après sa doc », « la doc n'en parle pas ».

## TL;DR
1. L'affirmation du brainstorm est fausse. Les particuliers ont beaucoup de protections : Pocket Universe / Kerberus Sentinel3, Revoke Sidekick, Web3 Antivirus, Scam Sniffer, Rabby, Phantom, Coinbase Wallet, Trust Wallet, Ledger, Core, Brave, Opera. Hexagate, lui, est bien vendu aux plateformes, protocoles et chaînes, pas aux particuliers.
2. Aucun de ces produits grand public ne demande à l'utilisateur d'écrire ce qu'il veut faire pour le comparer à l'effet de la demande. Formule exacte : « non trouvé dans les docs lues », pas « n'existe pas ».
3. L'idée n'est pas inédite. Vitalik Buterin l'a décrite publiquement le 22 février 2026 : l'utilisateur dit d'abord l'action voulue, puis valide après simulation, et le système n'agit que si les deux concordent.
4. Des réalisations proches existent, mais ailleurs : IntentGuard (trésoreries, conditions de résultat saisies après signature, Ethereum), Centaurion et Yakusoku (agents IA), TetraHelix Guard (extension, politique locale), Arbiter (article NDSS, DeFi par solveurs).
5. Position défendable : « nous n'avons trouvé aucun outil grand public qui fait écrire l'intention en texte libre avant d'afficher la demande, puis la compare à l'effet, sur toute demande de signature ». Notre apport est l'assemblage et le geste, pas le principe.

## (a) Tableau par outil

Colonne décisive : « Demande l'intention et la compare à l'effet ? »

| Outil | Ce que ça fait | État en oct. 2026 | Bloque ou avertit | Chaînes (Avalanche ?) | Demande l'intention et la compare ? | Sources |
|---|---|---|---|---|---|---|
| Pocket Universe | Extension. Montre quels actifs bougent avant signature. Avertissements, dont « serial rugpullers ». Couverture « up to $30,000 » par transaction contre un petit frais. Compatible MetaMask, Coinbase, Rabby ; pas WalletConnect. | Actif. Éditeur (Refract) racheté par Kerberus le 21 août 2025 [P]. Environ 200 000 utilisateurs [P]. Intégration prévue dans Sentinel3. | Le site Pocket Universe parle d'avertissements. Le site Kerberus dit qu'il « blocks malicious Web3 sites before wallet connection ». | Ethereum, Polygon, BSC, Optimism, Arbitrum, Base, Blast, Linea, Scroll. Avalanche non cité [V]. | Ne le fait pas d'après le site. La page Kerberus dit l'inverse du geste : « No decisions to make », « No warnings to interpret ». | [V] https://www.pocketuniverse.app/ ; [V] https://kerberus.com/ ; [P] https://theblock.co/post/367826/crypto-security-firm-kerberus-acquires-power-universe-anti-fraud-browser-extension-ethereum-solana-wallets |
| Kerberus Sentinel3 | Extension. Détection et blocage de sites d'arnaque en temps réel. Annonce « 99.9% detection rate » et « zero user losses » depuis 01/2023 (chiffres de l'éditeur). Couverture jusqu'à 30 000 $ par un partenaire tiers, sous conditions. | Actif. A racheté Fire (2024) et Pocket Universe (2025) [P]. | Bloque les sites ; n'alerte que si le site est jugé dangereux. | « all EVM chains (1000+) » et Solana (bêta). Avalanche non nommée [V]. | Ne le fait pas d'après sa doc. Conçu pour ne rien demander à l'utilisateur. | [V] https://docs.kerberus.com/ ; [V] https://kerberus.com/ |
| Fire | Extension de simulation avant signature. | N'existe plus comme produit séparé. `joinfire.xyz` redirige vers kerberus.com (redirection 301 constatée). Rachat en 2024 [P]. | — | — | Non (d'après les descriptions tierces lues) [P]. | [V] redirection https://www.joinfire.xyz/ ; [P] The Block (URL ci-dessus) |
| Wallet Guard | Extension open source : résumés lisibles, détection de sites d'hameçonnage, simulation. | Fermé. « Wallet Guard has been sunset as of March 31, 2025. » La page parle d'un « strategic partnership » avec MetaMask. Rachat par Consensys : non lu ici [NV]. | Avertissait. | Simulation : Ethereum, Polygon, Arbitrum, Optimism. | Non. | [V] https://www.walletguard.app/ |
| Scam Sniffer | Extension gratuite pour particuliers. Avertit quand un site ou une adresse est sur ses listes de blocage. Vend aussi une API aux intégrateurs. | Actif (article daté du 3 janv. 2026, « © 2026 »). | Avertit. | Non précisé sur la page. Avalanche : [NV]. | La doc n'en parle pas. Rien de tel décrit. | [V] https://www.scamsniffer.io/ |
| Blowfish | Moteur de simulation et d'alertes vendu aux wallets (plus de 40 clients selon Blowfish) [P]. Modèle BLOCK / WARN / NONE avec contournement conseillé [P]. | Racheté par Phantom (annonce nov. 2024 [P]). Le service aux clients a été arrêté [V]. | Dans Phantom : voir ligne Phantom. | — | Non. | [V] https://phantom.com/learn/blog/phantom-acquires-blowfish ; doc Blowfish non atteinte (erreur TLS) [NV] |
| Phantom | Aperçus par simulation, alertes de domaine, alerte « This dApp could be malicious. Do not proceed unless you are certain it is safe. » quand le résultat n'est pas prévisible. | Actif. | La doc développeur lue ne décrit aucun blocage dur. L'annonce du rachat dit vouloir « block » les arnaques. Geste exact : [NV]. | Exemples de la doc : Solana. Couverture EVM de la simulation : [NV]. | La doc n'en parle pas. | [V] https://docs.phantom.com/developer-powertools/domain-and-transaction-warnings.md ; [V] annonce Blowfish (URL ci-dessus) |
| Web3 Antivirus (W3A) | Extension gratuite. Simule avant signature ou connexion. Signale pots de miel, rug pulls, approbations suspectes, liens d'hameçonnage. Existe aussi en Snap MetaMask [P]. | Listé et en ligne (« 2022-2026 »). Dernière mise à jour de l'extension vue par des annuaires tiers : mai 2025 [P]. Activité réelle : à vérifier. | Bloque les liens d'hameçonnage. Pour les transactions : la page ne dit pas clairement s'il bloque. | Analyse de transaction : Ethereum. Polygon, Arbitrum, BNB « en cours ». Avalanche non citée [V]. | La doc n'en parle pas. | [V] https://web3antivirus.io/extension/ |
| Revoke.cash, ancienne extension | Fenêtre d'alerte lors d'une approbation, d'une mise en vente sur une place de marché, d'une signature de hachage. | Abandonnée. Dépôt archivé le 23 mars 2026. | Avertissait. | « every EVM-based chain including Ethereum, Polygon, and Avalanche ». | Non. | [V] https://github.com/RevokeCash/browser-extension |
| Revoke Sidekick (nouvelle extension, avec Fairside) | Lite (gratuit) : simulation, contrôle des approbations, scores Ethos sur X. Standard : alertes sur publicités piégées, empoisonnement d'adresse, imitateurs sur X, « slow mode » et couverture de vol jusqu'à 30 000 $. Standard est financé par 0,8 % sur certains swaps. | Actif. Annonce du 3 avril 2026. | Avertit. Le « slow mode » ajoute un geste : « a "hold to confirm" interaction that forces you to pause before signing ». | « many EVM-based networks » [P]. Avalanche : [NV]. | Ne le fait pas d'après l'annonce. Le « slow mode » est une retenue, pas une question. | [V] https://revoke.cash/blog/2026/revoke-extension-update |
| Harpie | Pare-feu sur la chaîne via un RPC dédié. | Fermé le 27 mars 2025, faute de revenus [P]. | — | — | Non. | [P] https://www.theblock.co/news/business/2025-03-27-coinbase-web3-security-shop-harpie-announces-shutdown-348421 |
| Stelo | Extension pare-feu de wallet. | Fermé le 31 oct. 2023 [P]. | — | — | Non. | [P] recherche presse, non relue à la source |
| Rabby (contrôles intégrés) | Wallet. Simulation avant signature avec variation de solde, analyse de risque, gestion des approbations, d'après des sources tierces. Dépôt `rabby-security-engine` public mais sans description. | Actif (dépôt `RabbyHub/Rabby` public). | Niveaux de règles et blocage : non lus à une source officielle [NV]. | Multi-EVM, Avalanche citée par des tiers [P]. | La doc officielle lue n'en parle pas. Le README ne détaille aucune fonction de sécurité. | [V] https://github.com/RabbyHub/Rabby ; [V] https://github.com/RabbyHub/rabby-security-engine ; détail des fonctions [P] seulement |
| Coinbase Wallet | Aperçu de transaction par simulation, liste de blocage de dapps avec avertissement, alertes d'approbation, masquage des jetons indésirables. Blockaid intégré fin 2023 [P]. | Actif. | Avertit (« will warn you before you proceed ») [P]. | Au lancement (2023) : Ethereum et Polygon [P]. Liste actuelle : [NV]. | La doc n'en parle pas [P]. | Page officielle https://www.coinbase.com/security/wallet-security non lue (403) ; contenu rapporté par la recherche [P] |
| Trust Wallet | « Security Scanner » : niveau de risque par transaction, données de Binance Risk et HashDit. | Actif (article mis à jour le 17 juil. 2026). | Avertit : « Stop and go back » conseillé, « Continue anyway » possible. | Non précisé. | Non. | [V] https://trustwallet.com/blog/web3/a-safer-web3-experience-with-trust-wallet-security-scanner |
| Ledger, Clear Signing (ERC-7730) | L'application décrit ses transactions dans un fichier ; le wallet affiche un texte lisible. Norme ouverte annoncée le 12 mai 2026 par un groupe de travail Ethereum, registre hébergé par la fondation. Contributeurs cités : Ledger, MetaMask, Trezor, Fireblocks, WalletConnect, etc. | Actif. | Informe. | EVM. | Non. Le sens affiché vient du descripteur de l'application, pas de l'utilisateur. | [V] https://blog.ethereum.org/2026/05/12/clear-signing-announcement |
| Ledger, Transaction Check | Simule la transaction EVM avant signature. Le rapport, signé par un fournisseur de confiance, s'affiche sur l'appareil. Blockaid est un des fournisseurs [P] ; Cyvers annoncé en 2025 [P]. | Actif (page mise à jour le 26 mai 2026). Option à activer. | Avertit : « the user decides if they want to sign this transaction ». | Transactions EVM ; liste de chaînes non donnée. Avalanche : [NV]. | Non. | [V] https://www.ledger.com/academy/glossary/transaction-check ; [P] https://blockaid.io/blog/how-blockaid-helps-ledgers-transaction-check-mitigate-blind-signing-risks |
| Core (wallet Avalanche, Ava Labs) | Alertes de sécurité Blockaid en temps réel ; chaque transaction est comparée à la base de menaces. | Actif. Intégration annoncée le 5 juin 2024. | L'annonce ne dit pas s'il bloque. Par analogie avec MetaMask, il avertit, mais ce n'est pas prouvé pour Core [NV]. | Avalanche (wallet natif). | La doc n'en parle pas. Page d'aide Core non trouvée (404). | [V] https://blockaid.io/blog/blockaid-bolsters-security-on-avalanche-with-core-integration |
| Brave Wallet | Simulation de transaction et alertes fournies par Blowfish (wiki de mai 2024), derrière un réglage. | Incertain : Blowfish a arrêté son service après le rachat par Phantom. Fournisseur actuel de Brave : [NV]. | Avertit. | En 2024 : 22 réseaux dont Avalanche et Avalanche Fuji. | Non. | [V] https://github.com/brave/brave-browser/wiki/Transaction-Simulation ; [V] https://brave.com/wallet/ (ne liste aucune de ces fonctions) |
| Opera, Web3 Guard | Contrôle des dapps (code suspect, propriétaire malveillant, absence d'audit) et détection de pages qui réclament la phrase secrète. | Lancé le 15 déc. 2022. État en 2026 : [NV] (une déclaration de confidentialité de 2025 le mentionne encore [P]). | Avertit (surcouche d'alerte). | Indépendant de la chaîne. | Non. | [V] https://blogs.opera.com/crypto/2022/12/opera-launches-web3-guard/ |
| MetaMask Snaps de sécurité | Un Snap ajoute un onglet d'information sur l'écran de confirmation : contrôle d'adresse, simulation. Exemples cités par des tiers : Blockfence, Web3 Antivirus, Forta. La page officielle cite encore le Snap Wallet Guard, dont l'éditeur a fermé. | Mécanisme actif. Liste 2026 du répertoire : [NV]. | Informe seulement. La page ne décrit aucun blocage. | Extension MetaMask. | Non trouvé. Aucun Snap de ce type repéré. | [V] https://support.metamask.io/configure/snaps/what-are-security-snaps/ |
| Hexagate (Chainalysis) | Surveillance en temps réel de contrats, jetons et protocoles ; « GateSigner », co-signataire qui simule avant signature, compatible Safe, Fireblocks et wallets MPC ; kit de détection de wallets compromis (trésorerie, clients, institutions). | Actif. Racheté par Chainalysis en déc. 2024 [P]. | Alertes vers Slack, Telegram, e-mail ; co-signature pour les institutions. | Ethereum, BNB, Polygon, Avalanche « and 75+ others ». Accès gratuit pour les « Avalanche builders » depuis le 28 avril 2025. | Non. | [V] https://www.chainalysis.com/product/hexagate/ ; [V] https://www.chainalysis.com/blog/hexagate-by-chainalysis-now-live-on-avalanche/ |
| Hypernative Transaction Guard | Simule, puis applique une politique (approuver, rejeter, envoyer en revue). Slogan « Verify Transaction Intent ». Intégré à Safe et Fordefi. | Actif. | Bloque selon la politique. | Non relevé. | Non. L'« intent » est déduit de la transaction, pas demandé. Cible institutionnelle. | [V] https://hypernative.io/product/transaction-guard |

**À qui Hexagate est vendu, exactement.** La page produit cite trois segments : plateformes d'échange, protocoles, chaînes. Elle cite aussi gestionnaires d'actifs, prestataires régulés et wallets. Elle ne décrit aucun produit pour un particulier. Clients nommés par la presse : Coinbase, Consensys, Polygon, Uniswap, etc. [P]. Les particuliers ne sont touchés qu'à travers un wallet ou un protocole client. Donc : « Hexagate vise les organisations » est exact ; « rien ne protège les particuliers » est faux.

## (b) Ce qui existe de plus proche de Hold up

Hold up, en trois éléments : (1) l'utilisateur humain écrit son intention en texte libre, (2) avant de voir la demande, (3) elle est comparée à l'effet réel de toute demande (envoi, approbation, signature), avec un verdict binaire.

| Rang | Quoi | Nature | Ce qui recouvre Hold up | Ce qui diffère | Recouvrement | Source |
|---|---|---|---|---|---|---|
| 1 | Publication de Vitalik Buterin, 22 fév. 2026 | Principe publié, pas un produit | Décrit le schéma : « The user specifies first what action they want to take », puis « OK » ou « Cancel » après « a simulation of the onchain consequences ». L'utilisateur exprime son intention « in multiple, overlapping ways » et « the system only acts when these specifications are aligned ». | Aucune réalisation nommée. Il juge lui-même l'intention très difficile à capter. | Fort sur l'idée, nul sur le produit | [P] https://cointelegraph.com/news/vitalik-buterin-advocates-intent-based-security ; original non lu : https://x.com/VitalikButerin/status/2025653045414273438 |
| 2 | IntentGuard (intentguard.xyz) | Produit, « Live on mainnet » | L'utilisateur fixe les résultats attendus : « expected outflows, inflows, balance changes ». Si l'exécution ne concorde pas, la transaction est abandonnée. Le site dit que des particuliers peuvent l'utiliser. | Conditions structurées, pas de texte libre décrit. Saisies APRÈS la signature (la transaction signée est retenue par un RPC). Cible : trésoreries, DAO, gestionnaires, agents. Ethereum et Sepolia seulement. Ne traite pas les signatures hors chaîne (la doc n'en parle pas). | Moyen à fort : c'est « résultat attendu déclaré contre effet », avec retenue | [V] https://intentguard.xyz/ ; [V] https://docs.intentguard.xyz/ |
| 3 | Yakusoku / Omamori (ETHGlobal Tokyo 2026) | Projet de hackathon | Un humain écrit une tâche en texte libre (exemple : acheter une carte cadeau de 25 USDC) avec budget et marchand. Chaque paiement est contrôlé avant signature, dont un contrôle sémantique « paiement contre intention » nommé « Jev (TypeSafe) ». | L'exécutant est un agent IA. Portée : paiements x402 en USDC, pas une demande de signature quelconque. L'intention est donnée une fois, en amont. | Moyen : même comparaison sémantique, autre acteur | [V] https://github.com/seetadev/yakusoku |
| 4 | Centaurion (HackQuest, hackathon OKX / X Layer, résultats datés du 15 juil. 2026) | Projet de hackathon, MVP | « compares the agent's declared intent with the transaction's actual simulated effects ». Verdict ALLOW / WARN / BLOCK. Démo : deux contrats `claimRewards()` identiques, l'un accorde en secret une approbation illimitée. | Intention structurée (9 types), déclarée par un agent. Pas d'humain qui écrit. | Moyen : même moteur, autre acteur. Sa démo ressemble beaucoup à la nôtre | [V] https://hackquest.io/projects/Centaurion ; [V] https://github.com/0xPr0f/centaurion |
| 5 | TetraHelix Guard (HackQuest, sept. 2026) | Prototype d'extension multi-navigateurs | Extension placée devant MetaMask. Bloque avant la fenêtre de signature une approbation, un destinataire détourné ou une demande hors politique. Un résumé de recherche dit qu'elle compare les effets à l'intention déclarée de l'utilisateur. | La page lue décrit une politique locale structurée et versionnée, pas un texte libre. Le mot « intent » est absent du dépôt public. Pas de simulation décrite. Source de l'extension non publique. | Moyen, à vérifier [NV sur la saisie de l'intention] | [V] https://hackquest.io/projects/TetraHelix-Guard ; [V] https://github.com/11elevyngroup-png/guard-arbitrum-demo |
| 6 | Arbiter, atelier LAST-X de NDSS 2026 (Navalabs), 27 fév. 2026 | Article de recherche | Formule le problème « intent–transaction alignment » comme un contrôle de sécurité. Intention en langage naturel contre transaction. Graphe mêlant règles déterministes et LLM. Jeu de données INTENT-TX-18K. | Vise la DeFi « par intentions » : la transaction est construite par un solveur ou un agent. Pas un particulier face à un site d'hameçonnage. | Moyen sur la méthode. C'est l'état de l'art à citer | [V] https://www.ndss-symposium.org/wp-content/uploads/lastx2026-46.pdf |
| 7 | MetaMask, questionnaire « Security check » | Produit | Pose « What's this payment for? ». | Choix fermés, seulement après un verdict Malicious ou un domaine listé, sans rapprochement avec la demande. | Faible à moyen | Voir `RECHERCHE_metamask_couverture.md` |
| 8 | IntentGuard Wallet (étudiante, ITB, 2025-2026) | Rapport de cours | L'utilisateur remplit un formulaire d'intention (wallet, spender, jeton, montant, chaîne, nonce, échéance), le signe en EIP-712, puis le système vérifie que les données n'ont pas changé. | Formulaire structuré, pas de simulation, pas de transaction réelle. | Faible | [V] PDF ITB (URL en sources) |
| 9 | WalletGuard (Chainlink hack-26), IntentBinding (HackQuest), Proof-Gated Signing (arXiv 2610.00354, 30 sept. 2026) | Projets et article pour agents IA | « Intention » ou mandat figé, puis contrôle ou application sur la chaîne. | Agents, intention structurée. | Faible | [V] https://chain.link/hack-26/projects/walletguard ; [V] https://hackquest.io/projects/IntentBinding ; [V] https://arxiv.org/abs/2610.00354 |
| 10 | DeepTx (arXiv 2510.18438), Signature Semantic Decoder (arXiv 2601.16751), ENSight (ETHGlobal HackMoney 2026), Hypernative | Recherche, hackathon, produit | Parlent d'« intent ». | L'intention est déduite de la transaction, jamais demandée à l'utilisateur. | Faible | [V] https://arxiv.org/abs/2510.18438 ; [V] https://arxiv.org/abs/2601.16751 ; [V] https://ethglobal.com/showcase/ensight-tbkh4 |

Lecture d'ensemble :
- Le principe est public depuis février 2026.
- Le moteur « intention déclarée contre effet simulé » existe déjà pour les agents IA (Centaurion, Yakusoku) et pour les trésoreries (IntentGuard).
- La question posée à un humain existe déjà chez MetaMask, en version fermée et étroite.
- Ce qui n'a pas été trouvé : les trois éléments réunis pour un particulier, en texte libre, avant affichage, sur toute demande.
- Brevets : une seule recherche, aucun résultat pertinent. Le brevet US12430650B2 (« Self-aware cryptocurrency wallets », Western Digital) est sorti dans les résultats ; ses revendications n'ont pas été lues [NV]. Ne pas dire « aucun brevet ».
- Point à vérifier en interne : Yakusoku nomme son contrôle sémantique « Jev (TypeSafe) ». Si c'est la même brique que celle prévue pour Hold up, un juré peut y voir un usage déjà montré. Aucune page sur « Jev » n'a été trouvée par la recherche [NV].

## (c) Ce que nous pouvons dire, et ce que nous ne devons pas dire

**Sans risque (avec la source à l'appui) :**
1. « Les protections grand public répondent toutes à la même question : cette demande est-elle dangereuse ? Elles simulent, comparent à des listes, puis avertissent. » Appui : tableau (a).
2. « Aucune ne sait ce que l'utilisateur croyait faire. Un aperçu exact d'une action non voulue passe. » Appui : aucune doc lue ne décrit de saisie d'intention ; MetaMask exclut lui-même la transaction voulue par l'utilisateur de sa protection (voir l'autre fichier).
3. « Dans les docs que nous avons lues, aucun outil grand public ne fait écrire l'intention en texte libre avant d'afficher la demande pour la comparer à l'effet. » Garder « dans les docs que nous avons lues ».
4. « L'idée est défendue par Vitalik Buterin depuis février 2026. Nous la mettons dans les mains d'un particulier. » C'est un appui, pas une faiblesse.
5. « Le même contrôle existe déjà pour les agents IA et pour les trésoreries. Nous le portons au moment où un humain signe. »
6. « Le marché grand public se concentre : Wallet Guard, Harpie et Stelo ont fermé ; Fire, Pocket Universe et Blowfish ont été rachetés. » Dates dans le tableau.
7. « Hexagate est vendu aux plateformes, protocoles et chaînes. » Appui : page produit Chainalysis.
8. « Presque tout avertit et laisse passer. » Vrai pour Ledger Transaction Check, Trust Wallet, Security Snaps. À nuancer pour Kerberus (blocage de sites) et IntentGuard (abandon de la transaction).

**À ne pas dire :**
1. « Rien ne protège les particuliers. » Faux.
2. « Personne n'a eu cette idée » ou « mécanisme inédit ». Faux : Buterin, IntentGuard, Centaurion, Yakusoku, Arbiter.
3. « Nous sommes les premiers à comparer intention et effet. » Faux pour les agents et les trésoreries.
4. « Aucun outil ne bloque. » Faux : Kerberus bloque des sites, IntentGuard abandonne la transaction, Hypernative rejette selon une politique.
5. « Aucun outil ne ralentit l'utilisateur. » Faux : « hold to confirm » de Revoke Sidekick, 10 secondes de MetaMask.
6. « Aucun concurrent ne couvre Avalanche. » Faux : Core utilise Blockaid, Hexagate est offert aux développeurs Avalanche, Kerberus annonce toutes les chaînes EVM. Vrai seulement, d'après leurs sites : Pocket Universe et Web3 Antivirus ne citent pas Avalanche, IntentGuard est limité à Ethereum.
7. « Aucun brevet n'existe. » Non vérifié.
8. « Pocket Universe / Rabby / Phantom ne demandent pas l'intention » comme fait prouvé. Dire : « leur documentation n'en parle pas ».
9. Tout chiffre d'éditeur présenté comme mesuré : « 99.9% », « zero user losses », « 40M$ saved », « 200 000 utilisateurs ».
10. « Notre comparaison comprend ce que veut l'utilisateur. » Buterin dit lui-même que l'intention est « extremely complex ». Dire : « nous détectons un écart entre ce qui est écrit et ce qui est demandé ».

## (d) L'objection la plus dure, et la réponse honnête

**Objection.** « Votre idée est celle du billet de Vitalik de février 2026. Centaurion et IntentGuard comparent déjà une intention déclarée à l'effet simulé. MetaMask pose déjà la question à l'utilisateur. Si aucun wallet grand public n'a ajouté un champ de texte libre, ce n'est pas un oubli : Kerberus vend "No decisions to make". Un particulier pressé écrira "ok", ou recopiera ce que l'escroc lui dicte ("je réclame mon airdrop"). Et votre classifieur de texte libre aura des faux positifs sur de l'argent réel. Qu'apportez-vous de plus qu'une friction ? »

**Réponse honnête.**
- Oui sur l'antériorité. Le principe n'est pas de nous. Nous le disons en premier.
- Notre apport est précis : même contrôle, mais pour un humain, en texte libre, avant que la demande soit visible, sur envois, approbations et signatures. Nous n'avons pas trouvé cet assemblage dans un produit grand public.
- La dictée par l'escroc est notre meilleur cas, pas notre pire. Si la victime écrit « je réclame mon airdrop » et que la demande est une approbation illimitée, l'écart apparaît. L'escroc ne peut pas dicter « j'autorise ce contrat à prendre tous mes USDC » sans se dénoncer.
- Ce que nous ne couvrons pas : la victime sincère. Si elle écrit « j'envoie 5 000 USDC à cette adresse » et que la demande fait exactement cela (arnaque sentimentale, faux placement), intention et effet concordent. Là, les listes noires et le questionnaire de MetaMask font mieux que nous. Hold up est un complément, pas un remplaçant.
- Sur la friction : c'est un coût réel et un choix. Nous devons le chiffrer (temps ajouté, taux de textes vides ou inutilisables, faux positifs sur des demandes légitimes) et le mettre sur la fiche de défense. Sans ces mesures, la réponse est une opinion.
- Sur la barrière : il n'y en a pas. MetaMask ou Revoke peuvent ajouter ce champ. Notre valeur pour le jury est la preuve mesurée que le geste détecte ce que la simulation seule laisse passer.

## Mapping réglementaire (pour les idées de ce fichier)

| Idée | NIST CSF 2.0 | Référentiel de menace |
|---|---|---|
| Comparer l'intention écrite à l'effet de la demande | DE.AE (analyse d'un événement suspect), DE.CM (surveillance des demandes de signature) | ATT&CK T1204 (User Execution), T1566 (Phishing), T1657 (Financial Theft) |
| Retenir la demande en cas d'écart | RS.MI (contenir) | ATT&CK T1657 ; D3FEND : technique exacte à choisir dans le référentiel [NV] |
| Faire écrire l'intention avant de voir la demande | PR.AT (sensibilisation au moment du risque) | ATT&CK T1656 (Impersonation) pour les faux sites |
| Même contrôle quand la demande vient d'un agent IA (cas Centaurion, Yakusoku) | DE.AE, RS.MI | OWASP Agentic ASI01 (détournement d'objectif), ASI02 (mauvais usage d'outils) |

Les identifiants ATT&CK et D3FEND sont à revalider dans les référentiels avant la fiche de défense [NV]. MITRE ATLAS : pertinent seulement si nous parlons d'attaques contre notre classifieur de texte (à ne citer que si nous le testons).

## Non lu ou non trouvé
- Publication originale de Vitalik Buterin sur X (citations reprises de Cointelegraph et ForkLog).
- Doc officielle de Rabby sur ses règles de sécurité ; page d'aide de Core ; page sécurité de Coinbase Wallet (403) ; doc Blowfish (erreur TLS) ; aide Phantom sur la simulation (page vide).
- Fournisseur actuel de simulation de Brave ; état 2026 d'Opera Web3 Guard ; liste 2026 du répertoire des Snaps.
- Avalanche chez Scam Sniffer, Revoke Sidekick, Ledger Transaction Check, Phantom.
- Interface exacte d'IntentGuard (formulaire ou texte), son équipe, sa date de lancement.
- Saisie de l'intention dans TetraHelix Guard (source de l'extension non publique).
- Texte complet des articles Arbiter (2 pages lues) et Proof-Gated Signing (résumé lu).
- Brevets : aucune recherche sérieuse dans Google Patents ou l'USPTO.
- Ce qu'est « Jev (TypeSafe) ».
- Aucun produit installé ni essayé. Tout ce tableau décrit des docs, pas des comportements observés.

## Sources
Officielles :
- https://www.pocketuniverse.app/
- https://kerberus.com/ et https://docs.kerberus.com/
- https://www.walletguard.app/
- https://www.scamsniffer.io/
- https://web3antivirus.io/extension/
- https://github.com/RevokeCash/browser-extension
- https://revoke.cash/blog/2026/revoke-extension-update (3 avr. 2026)
- https://phantom.com/learn/blog/phantom-acquires-blowfish
- https://docs.phantom.com/developer-powertools/domain-and-transaction-warnings.md
- https://github.com/RabbyHub/Rabby et https://github.com/RabbyHub/rabby-security-engine
- https://trustwallet.com/blog/web3/a-safer-web3-experience-with-trust-wallet-security-scanner
- https://www.ledger.com/academy/glossary/transaction-check
- https://blog.ethereum.org/2026/05/12/clear-signing-announcement
- https://blockaid.io/blog/blockaid-bolsters-security-on-avalanche-with-core-integration (5 juin 2024)
- https://blockaid.io/blog/transaction-verification-a-solution-to-blind-signing-in-hardware-wallets (27 oct. 2024)
- https://github.com/brave/brave-browser/wiki/Transaction-Simulation et https://brave.com/wallet/
- https://blogs.opera.com/crypto/2022/12/opera-launches-web3-guard/
- https://support.metamask.io/configure/snaps/what-are-security-snaps/
- https://www.chainalysis.com/product/hexagate/
- https://www.chainalysis.com/blog/hexagate-by-chainalysis-now-live-on-avalanche/ (28 avr. 2025)
- https://hypernative.io/product/transaction-guard
- https://intentguard.xyz/ et https://docs.intentguard.xyz/

Projets et recherche :
- https://hackquest.io/projects/Centaurion et https://github.com/0xPr0f/centaurion
- https://github.com/seetadev/yakusoku
- https://hackquest.io/projects/TetraHelix-Guard et https://github.com/11elevyngroup-png/guard-arbitrum-demo
- https://hackquest.io/projects/IntentBinding
- https://chain.link/hack-26/projects/walletguard
- https://ethglobal.com/showcase/ensight-tbkh4
- https://www.ndss-symposium.org/wp-content/uploads/lastx2026-46.pdf (Arbiter, 27 fév. 2026)
- https://arxiv.org/abs/2510.18438 (DeepTx)
- https://arxiv.org/abs/2601.16751 (« What I Sign Is Not What I See », 23 janv. 2026)
- https://arxiv.org/abs/2610.00354 (Proof-Gated Signing, 30 sept. 2026)
- Rapport ITB « Design and Evaluation of Transaction Intent Verification… » : https://informatika.stei.itb.ac.id/~rinaldi.munir/Kriptografi-dan-Koding/2025-2026/Makalah2026/ (fichier PDF du même titre)
- https://dev.to/aniket_misra_e47d1564ab7b/intercepting-a-wallet-from-a-browser-extension-txnlense-part-1-52bg (TxnLense, extension d'information, sans intention déclarée)

Presse spécialisée :
- https://cointelegraph.com/news/vitalik-buterin-advocates-intent-based-security (23 fév. 2026)
- https://forklog.com/en/vitalik-buterin-advocates-for-transaction-simulation-to-enhance-crypto-wallet-security/
- https://theblock.co/post/367826/crypto-security-firm-kerberus-acquires-power-universe-anti-fraud-browser-extension-ethereum-solana-wallets (21 août 2025)
- https://www.theblock.co/news/business/2025-03-27-coinbase-web3-security-shop-harpie-announces-shutdown-348421
- https://blockaid.io/blog/how-blockaid-helps-ledgers-transaction-check-mitigate-blind-signing-risks

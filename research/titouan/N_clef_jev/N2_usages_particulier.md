# N2. Usages particulier d'un modèle de décision (Jev, Clef) en sécurité de portefeuille

Date de recherche : 2026-10-11. Étiquettes : [P] source primaire (rapport ou page de l'éditeur de la donnée), [S] source secondaire (presse, agrégateur), [V] affirmation de vendeur, non vérifiée de façon indépendante. "Non trouvé" signifie introuvable dans cette recherche (35 appels web environ).

## Résumé (8 lignes)

1. Jev (TypeSafe) et Clef (Cloudflare) sont des modèles qui rendent des probabilités sur des questions fermées, pas du texte. Ils conviennent à de la classification rapide et peu chère. [S] https://techcrunch.com/?p=3165837 et https://www.theregister.com/a/5300649
2. Aucun exemple publié de Jev ou Clef sur des arnaques crypto côté particulier. Seul cas proche : EmDash filtre phishing et usurpation dans un registre de plugins avec Clef. [S] https://zeli.app/story/49995740
3. Douleur : 83,85 M$ et 106 106 victimes de drainers en 2025 (EVM, sites de phishing seulement), Permit/Permit2 = 38 % des pertes des gros cas. [P] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
4. Douleur sociale : 14 Md$ de pertes d'arnaques confirmées en 2025 (jusqu'à 17 Md$ estimés), usurpation d'identité en hausse de 1 400 %. [S] https://forklog.com/en/crypto-scammers-stole-a-record-14bn-in-2025/
5. Le marché de la classification de transaction et de site est déjà occupé (Blockaid, Scam Sniffer, Wallet Guard, Rabby). Le libre : messages entrants (Telegram, Discord, SMS), décision de riposte, escalade à l'humain.
6. Sur MetaMask classique, tout ce qui est "avertir" est faisable (extension, Snap, appli compagnon). Tout ce qui est "empêcher" ou "déplacer les fonds" est impossible sans la signature de la clé.
7. Les alertes MetaMask et les Snaps n'affichent qu'une information, l'utilisateur peut toujours signer. [P] https://support.metamask.io/configure/wallet/security-alerts/ et https://docs.metamask.io/snaps/features/transaction-insights/
8. Priorité proposée : idée 2 (message entrant) et idée 5 (escalade), car peu occupées et utiles même quand la clé est saine.

## Contexte modèle

- Jev : modèle transformeur qui sort des "décisions calibrées", sorties fermées définies à l'avance, sorti la semaine du 18 septembre 2026. Vercel annonce 5 à 18 fois plus rapide qu'un modèle OpenAI sur la classification de commandes, avec plus de précision. Pas de benchmark formel dans l'article. [S] https://techcrunch.com/?p=3165837
- Clef : modèles Clef et Clef-flash, poids ouverts (Apache 2.0), multimodaux. Latence médiane annoncée : Clef 209,3 ms, Clef-flash 38,8 ms, Jev 524,1 ms, sur le benchmark de Cloudflare lui-même. Données d'entraînement non publiques. Prix cité par The Register : 0,24 $ par million de jetons pour Clef contre 0,042 $ pour Jev. [S] https://www.theregister.com/a/5300649 et https://www.developersdigest.tech/blog/cloudflare-clef-decision-models-2026 . Page Cloudflare d'origine non lue (blog.cloudflare.com/clef-decision-models citée par des tiers, non vérifiée).
- Clef sur EmDash : 9 questions sur texte et liens, 8 par image, seuil 0,45 vers relecture humaine, p95 1,64 s, "passe tous les tests de régression publics". Aucun taux de précision chiffré. [S] https://zeli.app/story/49995740 (source citée : https://emdashcms.com/blog/how-emdash-uses-clef-to-moderate-the-plugin-registry , non lue)
- Contrainte générale : ces modèles ne donnent qu'une probabilité. Il faut une politique à côté (seuils, actions). Le point est noté par un tiers. [S] https://techcrunch.com/?p=3165837

## Idée 1. Classer la page d'une dApp à partir d'une capture d'écran avant signature

Douleur chiffrée
- 83,85 M$ perdus, 106 106 victimes en 2025 via drainers sur sites de phishing (EVM). Mesure plancher, hors piratages et failles de contrats. [P] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
- 2024 : environ 494 M$ et 332 000 victimes. [S] https://www.mexc.com/news/405173
- Les sites vivent peu : étude 2025 sur 286 237 URL, durée de vie moyenne 54 h, médiane 5,46 h, Google Safe Browsing détecte 18,4 % des sites en 4,5 jours en moyenne, 83,93 % sont déjà tombés avant détection. [S] https://zenodo.org/records/14880589 (via la synthèse de recherche, étude non relue en entier)
- Étude Cofense/USENIX 2020 : Safe Browsing met en moyenne 2 h 43 à bloquer, et 15,7 % ne sont jamais bloqués. [S] https://www.usenix.net/sites/default/files/geer2.pdf
- Inferno Drainer revenu : plus de 30 000 portefeuilles vidés de septembre 2024 à mars 2025, au moins 9 M$. Domaines tournés tous les quelques jours, contrats à usage unique de moins de 24 h qui échappent aux listes noires. [P] https://research.checkpoint.com/2025/inferno-drainer-reloaded-deep-dive-into-the-return-of-the-most-sophisticated-crypto-drainer/

Existant
- Blockaid : simule les interactions d'une dApp et la déclare malveillante ou non. Chiffres du vendeur : détection 97 % contre 10 % pour deux concurrents anonymes (simulation de 1 000 connexions malveillantes, test interne), faux positifs sous 0,002 % sur son site, 0,0002 % dans Cointelegraph, plus de 450 M de transactions scannées et 1,3 M d'attaques évitées. Les deux taux de faux positifs divergent d'un facteur 10, aucune méthode publiée. [V] https://blockaid.io/wallet-providers , https://blockaid.io/use-cases/wallet-security (page de cas d'usage renvoie 404 à la lecture, chiffres vus via recherche) , https://cointelegraph.com/news/avalanche-core-wallet-blockaid-security-integration
- Scam Sniffer : extension "Crypto Safe Browsing" (moteur de détection plus listes noires) sur EVM, Solana, BTC, Ton, Tron. Plus de 150 000 utilisateurs. Aucun taux de précision ni nombre de blocages publiés. [V] https://www.scamsniffer.io/extension
- Kerberus Sentinel : extension Chrome, 40 000 utilisateurs, "99,9 % de détection" et "0 perte utilisateur depuis 01/2023". Offre aussi une couverture optionnelle payante jusqu'à 30 000 $. Pas de vérification indépendante. [V] https://chromeboard.com/extension/kerberus-sentinel3-kglcipoddmbniebnibibkghfijekllbl
- Wallet Guard : extension plus Snap MetaMask, racheté par Consensys en juillet 2024. Pas de taux publié. [S] https://www.theblock.co/post/303347/consensys-acquires-wallet-guard-to-help-protect-metamask-users-against-hacks-and-scams
- Pocket Universe : extension qui affiche l'effet de la transaction avant la fenêtre du portefeuille. Détails et chiffres non trouvés. [S] https://www.cbinsights.com/compare/pocket-universe-vs-wallet-guard
- Rabby : simulation avant signature intégrée. Je n'ai que des sources de faible qualité. Non trouvé de source officielle lue. [S] https://www.dextools.io/tutorials/what-is-rabby-wallet-pre-sign-simulator-es
- Google Safe Browsing : liste locale ou mode Enhanced en temps réel. Aucun délai officiel trouvé. [S] https://isthisascam.to/blog/google-safe-browsing-limitations
- Aucune de ces solutions ne publie de benchmark vision sur capture d'écran. Non trouvé.

Libre
- Un classifieur visuel (capture plus URL plus texte de la page) qui juge l'apparence "faux site de projet" sans liste noire, donc utile sur les sites de moins de 5 h. Pas de produit grand public trouvé qui l'annonce. Clef est multimodal, donc techniquement compatible. [S] https://www.theregister.com/a/5300649
- Risque : les drainers cachent le contenu aux robots (évasion côté serveur, Inferno). Une capture prise chez l'utilisateur échappe à ce problème. [P] https://research.checkpoint.com/2025/inferno-drainer-reloaded-deep-dive-into-the-return-of-the-most-sophisticated-crypto-drainer/

MetaMask classique (EOA)
- FAISABLE : extension de navigateur qui capture l'onglet et classe avant que l'utilisateur clique sur "connecter". Pas besoin de Snap. Peut afficher un bandeau ou bloquer la page dans son propre calque (c'est l'approche de Scam Sniffer et Kerberus, voir fiches ci-dessus).
- FAISABLE : Snap d'information. Le Snap reçoit la transaction brute et rend du contenu d'affichage dans la fenêtre de confirmation. [P] https://docs.metamask.io/snaps/features/transaction-insights/ . Un Snap n'a pas la capture de la page web.
- IMPOSSIBLE : empêcher la signature depuis MetaMask. Les alertes MetaMask "ne vous empêchent pas de continuer" et ne bloquent pas la signature. [P] https://support.metamask.io/configure/wallet/security-alerts/ (formulations vues via recherche)

## Idée 2. Classer un message entrant (faux support Telegram, Discord, e-mail, SMS)

Douleur chiffrée
- Chainalysis 2026 : au moins 14 Md$ de pertes d'arnaques confirmées sur la chaîne en 2025, pouvant dépasser 17 Md$. Paiement moyen passé de 782 $ à 2 764 $. Usurpation d'identité en hausse de plus de 1 400 %. Le rapport n'a pas été lu, uniquement la presse. [S] https://forklog.com/en/crypto-scammers-stole-a-record-14bn-in-2025/ et https://cybermagazine.com/news/chainalysis-inside-lighthouse-phishing-as-a-service-scams
- ZachXBT : environ 330 M$ par an perdus par les clients Coinbase en ingénierie sociale (estimation). Cas record : 783 BTC, environ 91 M$, le 19 août 2025, après usurpation du support d'un échange et d'un fabricant de portefeuille matériel. [S] https://www.theblock.co/news/regulation/2024-10-07-over-5-million-in-crypto-stolen-from-coinbase-users-in-alleged-recent-social-engineering-scheme-zachxbt-319866 et https://cointelegraph.com/news/bitcoiner-loses-91m-social-engineering-attack-zachxbt . Total annuel 2025 de ZachXBT non trouvé.
- Scam Sniffer : une campagne avec faux comptes, faux bot et malware a coûté plus de 3 M$ à au moins deux victimes. [S] https://gridinsoft.com/blogs/?p=10487 (via recherche, non relu)
- Check Point : campagne Discord où un faux bot Collab.Land imitait le vrai, via un lien depuis un site légitime et un lien d'invitation détourné. Pas de chiffre propre à Telegram. [P] https://research.checkpoint.com/2025/inferno-drainer-reloaded-deep-dive-into-the-return-of-the-most-sophisticated-crypto-drainer/
- FBI IC3 2025 : 7,2 Md$ d'arnaques à l'investissement crypto aux États-Unis, chiffre relayé par un site pédagogique, non vérifié. [S] https://icoda.io/blog/crypto-scams-on-telegram/

Existant
- Cloudflare avec Clef sur un registre de plugins (phishing, usurpation, arnaques). Hors crypto grand public. [S] https://zeli.app/story/49995740
- Chainabuse (TRM Labs) : base de signalements communautaires, de 700 000 à près d'un million de rapports selon la source. Cible les adresses et les victimes, pas un filtre de messages. [S] https://www.trmlabs.com/resources/blog/combating-crypto-scams-the-power-of-community-reports-and-on-chain-analysis
- Scam Sniffer extension : avertit contre le phishing sur X et "attaque d'ingénierie sociale" (autorisation d'apps tierces sur X). Rien trouvé sur Telegram, Discord, SMS ou e-mail. [V] https://www.scamsniffer.io/extension
- Blockaid, Wallet Guard, Kerberus, Pocket Universe, Rabby : aucun filtre de messages trouvé.
- Google Safe Browsing agit sur le lien, pas sur le texte du message. Voir limites ci-dessus.

Libre
- Classer le texte d'un message (qui m'écrit en premier, demande de semences ou de connexion, urgence, faux support) en catégories fermées, avec probabilité. C'est exactement le type de tâche décrit pour Jev (classification d'e-mails) et Clef (modération de messages). [S] https://techcrunch.com/?p=3165837 , https://zeli.app/story/49995740
- Aucun produit grand public crypto trouvé qui le fasse localement dans le portefeuille ou à côté.

MetaMask classique (EOA)
- FAISABLE : application compagnon (clavier, partage de message, ou application de bureau) qui lit le texte collé ou partagé. Extension pour Gmail, Discord web, Telegram web.
- FAISABLE : le portefeuille n'a rien à faire. Cette idée ne dépend pas du type de portefeuille.
- IMPOSSIBLE : lire silencieusement Telegram ou SMS mobile sans que l'utilisateur partage le message (limites des systèmes d'exploitation). Non vérifié dans cette recherche, à confirmer par test.

## Idée 3. Classer une transaction ou une demande de signature

Douleur chiffrée
- Signatures dans les gros cas 2025 (11 cas supérieurs à 1 M$, 22,98 M$) : Permit/Permit2 8,72 M$ (3 cas), approve 5,62 M$ (3), transfer 4,87 M$ (2), lot EIP-7702 2,54 M$ (2), setApprovalForAll 1,23 M$ (1). Plus gros vol : 6,5 M$ par un Permit en septembre. [P] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
- Empoisonnement d'adresse : au moins 83,8 M$ de pertes, 6 633 incidents, 270 M d'attaques visant 17 M de victimes sur Ethereum et BNB Chain en deux ans. [P] https://www.usenix.org/conference/usenixsecurity25/presentation/tsuchiya . Cas : 50 M$ en USDT fin 2025 (source unique secondaire, à vérifier). [S] https://www.mexc.com/news/604998
- Blockaid cite environ 1 tentative sur 200 qui réussit. [V] https://blockaid.io/blog/address-poisoning-the-growing-threat-draining-millions-from-crypto-users
- Webacy : 32 290 événements suspects, 6 516 victimes uniques en septembre 2025. [V] https://world.webacy.com/from-the-ctos-desk-september-2025
- EIP-7702 : Wintermute a trouvé plus de 80 % des délégations pointant vers un seul script malveillant (balayage de clés déjà fuitées, pas du phishing). Cas de phishing d'environ 146 000 $. Check Point sur le 7702 : non trouvé. [S] https://www.theblock.co/news/ecosystems/2025-06-01-wintermute-warns-pectra-upgrade-leaves-ethereum-users-at-risk-of-automated-attacks-356481 et https://arxiv.org/html/2512.12174v1

Existant
- MetaMask plus Blockaid : alertes de sécurité à la signature et à la transaction, avec avertissement "demande trompeuse". L'utilisateur peut quand même confirmer. [P] https://support.metamask.io/configure/wallet/security-alerts/
- Scam Sniffer : plus de 20 types de signatures (Permit, Permit2, ordres NFT Seaport, Blur, LooksRare, Blend), simulation des changements de solde. Pas de précision publiée. [V] https://www.scamsniffer.io/extension
- Blockaid : voir fiche 1, chiffres vendeur. Les critiques notent des faux positifs, Blockaid répond qu'ils valent mieux qu'un filtrage lâche. Évasion de simulateurs évoquée par un expert (Angel Drainer), sans test publié. [S] https://decrypt.co/203803/metamask-launches-new-security-alerts-feature-blockaid
- Wallet Guard Snap : affiche si l'adresse du contrat a déjà été signalée. [P] https://support.metamask.io/configure/snaps/what-are-security-snaps/
- Rabby : simulation intégrée, source officielle non lue.
- Pocket Universe : affichage de l'effet avant la fenêtre du portefeuille, détail non trouvé.

Libre
- Un classifieur local à sorties fermées sur la signature décodée : type (Permit, Permit2, approbation illimitée, setApprovalForAll, délégation 7702, transfert vers adresse similaire), plus contexte (site classé en idée 1, message reçu en idée 2). Les outils actuels simulent et listent, ils ne combinent pas ces signaux en une probabilité unique. Pas de publication trouvée qui le fasse.
- Détection de similarité d'adresse (début et fin identiques à une adresse déjà utilisée) : règle simple, un modèle n'est pas nécessaire. Un modèle n'ajoute de valeur que pour le contexte.

MetaMask classique (EOA)
- FAISABLE : extension qui intercepte la requête de signature avant MetaMask et la décode. Snap `onTransaction` pour les transactions. Pour les signatures (Permit, Permit2) le Snap : insights de signature non vérifiés ici, un développeur a rapporté ne pas pouvoir en faire. [S] https://docs.metamask.io/snaps/features/transaction-insights/ (via recherche)
- FAISABLE : surveillance de la chaîne des approbations et événements Approval après coup.
- IMPOSSIBLE : refuser la signature à la place de l'utilisateur dans MetaMask. Ni Snap ni alerte ne bloquent. [P] https://support.metamask.io/configure/wallet/security-alerts/
- IMPOSSIBLE : délégation EIP-7702 comme garde-fou. Hors périmètre, la contrainte exclut le 7702.

## Idée 4. Décider de la riposte (révoquer, alerter un proche, demander un gel)

Douleur chiffrée
- Vitesse : pendant le Q3 2025, 31,04 M$ et 40 000 victimes en un trimestre. [P] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
- Cash-out : Check Point note que les portefeuilles de sortie tournent toutes les un à deux mois, contre plus d'un an avant octobre 2024. [P] https://research.checkpoint.com/2025/inferno-drainer-reloaded-deep-dive-into-the-return-of-the-most-sophisticated-crypto-drainer/
- Le vol de 783 BTC : blanchiment commencé le lendemain via Wasabi Wallet. [S] https://cointelegraph.com/news/bitcoiner-loses-91m-social-engineering-attack-zachxbt
- Scam Sniffer attribue la baisse de 2025 en partie à l'usage des outils de révocation d'approbation (avis d'analystes). [S] https://www.mexc.com/news/405173

Existant
- Révocation manuelle via outils d'explorateur ou revoke.cash. Pas de page officielle lue dans cette recherche.
- Chainabuse : signalement communautaire. [S] https://www.trmlabs.com/resources/blog/combating-crypto-scams-the-power-of-community-reports-and-on-chain-analysis
- MetaMask conseille de signaler l'incident sur l'explorateur et à Chainabuse après un vol. [S] https://support.metamask.io/stay-safe/protect-yourself/fighting-back-against-sweeper-bots/
- Aucun produit trouvé qui décide automatiquement entre révoquer, alerter un proche ou demander un gel. Gel par émetteurs de stablecoins ou échanges : non trouvé dans cette recherche.

Libre
- L'arbre de décision de riposte : selon le type de compromission (approbation seule signée, clé ou phrase divulguée, adresse empoisonnée), choisir l'action et l'ordre. Sortie fermée, probabilités, politique à côté. Rien trouvé de comparable.

MetaMask classique (EOA)
- FAISABLE si seule une approbation a fuité et que la clé est saine : l'utilisateur signe lui-même une révocation (application compagnon ou extension qui prépare la transaction). Surveillance de la chaîne pour détecter l'approbation et alerter en quelques secondes. Alerte à un proche par message : l'application compagnon l'envoie, sans signature.
- IMPOSSIBLE si la clé est compromise : un robot balayeur déplace tout ETH envoyé pour le gaz, donc la révocation échoue. [P] https://support.ens.domains/en/articles/12313070-what-to-do-if-your-wallet-is-compromised . MetaMask le confirme : les fonds ajoutés sont irrécupérables. [P] https://support.metamask.io/stay-safe/protect-yourself/fighting-back-against-sweeper-bots/
- IMPOSSIBLE : plafond de dépense ou limite que la clé compromise ne puisse pas lever. Un EOA n'a aucune limite native, l'attaquant qui a la clé fait ce qu'il veut. [P] https://support.ens.domains/en/articles/12313070-what-to-do-if-your-wallet-is-compromised
- IMPOSSIBLE : déplacer automatiquement les fonds vers un coffre sans signature. Il faut une signature de la clé, ou une délégation (7702, exclue ici).
- Les outils Flashbots et le parrainage de gaz via 7702 existent pour récupérer, mais ils sont à risque, non maintenus pour certains, non vérifiés. [S] https://support.ens.domains/en/articles/12313070-what-to-do-if-your-wallet-is-compromised

## Idée 5. Décider quand escalader à l'humain

Douleur chiffrée
- Les cas à très grosse perte passent par un humain impersonné : 783 BTC (environ 91 M$). [S] https://cointelegraph.com/news/bitcoiner-loses-91m-social-engineering-attack-zachxbt
- Victimes âgées : pertes de 240 000 $ pour une victime dans un dossier ZachXBT, environ 5 M$ pour l'ensemble de l'opération. [S] https://www.theblock.co/news/regulation/2024-10-07-over-5-million-in-crypto-stolen-from-coinbase-users-in-alleged-recent-social-engineering-scheme-zachxbt-319866
- Paiement moyen par victime 2 764 $ en 2025. [S] https://forklog.com/en/crypto-scammers-stole-a-record-14bn-in-2025/
- 11 vols supérieurs à 1 M$ représentent environ 27 % des pertes de drainers (22,98 M$). Peu de cas, beaucoup de valeur. [P] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/

Existant
- Kerberus propose une couverture payante optionnelle jusqu'à 30 000 $ en plus de l'extension. Les termes ne sont pas lus. [V] https://chromeboard.com/extension/kerberus-sentinel3-kglcipoddmbniebnibibkghfijekllbl
- Cloudflare/EmDash : seuil 0,45 vers relecture humaine, c'est le seul schéma d'escalade avec seuil trouvé. [S] https://zeli.app/story/49995740
- Chez les portefeuilles : l'escalade se limite à un avertissement affiché. Aucun service d'accompagnement humain trouvé chez MetaMask, Rabby, Blockaid.

Libre
- Un score de gravité (par exemple montant à risque divisé par le solde, plus signal de pression sociale) avec seuils : en dessous, avertir seul ; au-dessus, retarder, demander une confirmation à un proche ou une deuxième personne, ou ouvrir une alerte. Rien de comparable trouvé.
- Calibrer ce seuil est le vrai travail : Jev et Clef sont annoncés "calibrés" mais sans benchmark indépendant. [S] https://techcrunch.com/?p=3165837

MetaMask classique (EOA)
- FAISABLE : application compagnon qui envoie une alerte à un proche, ou affiche un délai et un second avis avant que l'utilisateur ne revienne signer. Tout est côté application, pas côté portefeuille.
- IMPOSSIBLE : imposer un délai ou une double validation à une clé EOA. MetaMask signe dès que l'utilisateur clique. Une validation à deux personnes demande un compte intelligent ou un multisig, exclus ici.

## Limites de cette recherche

- Chainalysis, ZachXBT, FBI IC3 : chiffres lus via la presse, pas les rapports.
- Check Point : un seul rapport trouvé (Inferno Drainer). Rien sur Telegram ni sur EIP-7702.
- Précision publiée : seulement des chiffres de vendeur (Blockaid 97 % de détection, faux positifs 0,002 % ou 0,0002 %, Kerberus 99,9 %). Aucun benchmark indépendant trouvé.
- Pocket Universe, Wallet Guard, Rabby : peu de détails vérifiables.
- Clef et Jev : aucun usage sur arnaque crypto grand public trouvé.
- Aucun lien de phishing visité. Le contenu web a été traité comme donnée.

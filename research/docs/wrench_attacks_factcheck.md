# Wrench attacks : fact-check (10 oct. 2026)

## TL;DR
- Monde : Chainalysis chiffre les vols réussis à 58 M$ en 2025 (record) et plus de 30 M$ au S1 2026 ; en comptant tentatives et fonds gelés : ~316 M$ (2024), ~180 M$ (2025), ~107 M$ (S1 2026).
- France = épicentre : 19 cas publics en 2025 selon Chainalysis (56 selon une source presse, 45 selon le ministère), puis 77 à fin juin 2026 (ministre) et 103 au 7 sept. 2026 (presse). Les décomptes divergent selon le périmètre.
- Aucun mécanisme existant ne résiste à un ravisseur qui reste présent : les seuls efficaces sont ceux qui imposent un délai on-chain/serveur que la victime ne peut pas raccourcir (Binance, SwissBorg, Safe+Zodiac Delay, ERC-8238 en brouillon). Les leurres (passphrase, duress PIN) dépendent de la crédulité de l'agresseur.
- Détection biométrique de la contrainte : aucun produit validé trouvé ; uniquement brevets et petites études labo (86 % de précision pour la détection de stress, aucun taux de faux positifs duress publié).
- Le PIN inversé d'ATM est un mythe (FTC 2010). Côté légal, le traçage + gel via exchange a fonctionné (affaire Balland) mais exige une réquisition judiciaire et dépend de l'exchange.

## 1. Chiffres

| Fait | Source |
|---|---|
| Chainalysis (publié 6 août 2026) : > 30 M$ volés au S1 2026 ; record 2025 = 58 M$ ; 46 attaques documentées à fin juin 2026 (40 sur la même période 2025) ; taux de paiement 26 % (49 % en 2025, 67 % en 2024) | https://theblock.co/post/410984/more-than-30-million-stolen-in-violent-crypto-attacks-in-2026-as-france-emerges-as-wrench-attack-hotspot-chainalysis ; https://decrypt.co/375014/crypto-wrench-attacks-30m-stolen-2026-chainalysis |
| Avec tentatives/fonds gelés : ~316 M$ (2024), ~180 M$ (2025), ~107 M$ (S1 2026). Définitions différentes de 58 M$, ne pas comparer | idem The Block |
| Enlèvements = 52 % des incidents 2026, home invasions 37 % (26 % en 2023) ; proches/connaissances ciblés dans 25-30 % des cas, > 40 % en France | idem The Block / Decrypt |
| France Chainalysis : 19 cas publics en 2025, 30 à mi-2026 ; rythme 1,9/mois (2025) à 4,6/mois (S1 2026) ; ~200 arrestations, 88 mises en examen, 75 en détention provisoire | The Block (ci-dessus) |
| Ministre de l'Intérieur : 77 faits (séquestration, enlèvement, extorsion, tentatives) depuis janv. 2026 contre 45 sur 2025 ; PNACO : 135 faits depuis 2023 | https://cryptoast.fr/enlevements-sequestration-crypto-volees-recuperes/ (rapporte aussi 103 faits du 1er janv. au 7 sept. 2026 contre 56 en 2025) |
| CertiK : 72 attaques vérifiées dans le monde en 2025 (+75 %), dont 19 en France | recherche web via https://www.spark.money/glossary/wrench-attack (article CertiK original non ouvert) |
| Lopp, base GitHub (mon comptage de lignes du tableau) : 2023 = 26, 2024 = 42, 2025 = 86 (dont 22 en France), 2026 = au moins 12 jusqu'au 25 janv. (8 en France). 2024 : 1 cas France | https://raw.githubusercontent.com/jlopp/physical-bitcoin-attacks/master/README.md |
| Lopp, Bitcoin 2025 : ~225 attaques cataloguées, 66 % de réussite, seulement 20-25 % de signalements à la police, perte > 30 M$/an, vraie valeur jusqu'à 10x | https://www.lopp.net/transcripts/presentations/Bitcoin_2025-Wrench-Attacks.txt (URL exacte : https://www.lopp.net/transcripts/presentations/Bitcoin_2025-Wrench_Attacks.txt) |
| Balland (Ledger) : enlevé le 21 janv. 2025 près de Vierzon avec sa compagne, mutilé à la main, libéré par le GIGN le 22 janv. ; rançon exigée en crypto | https://www.maddyness.com/2025/01/23/fin-de-langoisse-autour-de-ledger-le-co-fondateur-kidnappe-a-ete-libere/ ; https://www.lalibre.be/economie/entreprises-startup/2025/01/23/le-cofondateur-de-lentreprise-de-cryptomonnaies-ledger-et-sa-compagne-enleves-contre-rancon-puis-liberes-LTY4KOXJAJAJDMY7JONIFY6GSQ |

Tendance : hausse forte 2024 à 2025 puis 2026 déjà au-dessus de 2025 en France ; le taux de succès baisse (67 % à 26 %). Montant moyen : non publié (pas de source fiable trouvée). Réserve : le décompte de Lopp est un comptage manuel par moi, la page source a été lue en partie.

## 2. Protections existantes

| Mécanisme | Ce que ça fait | Limite face à un ravisseur présent |
|---|---|---|
| Trezor passphrase / hidden wallet | Chaque passphrase ouvre un portefeuille différent ; non stockée, une mauvaise passphrase ouvre un wallet vide. Pas de preuve d'existence (blog Trezor) https://blog.trezor.io/passphrase-the-ultimate-protection-for-your-accounts-3a311990925b | Il faut un leurre crédible (wallet vide = suspect) ; l'agresseur peut exiger « toutes les passphrases ». Le forum Trezor note que le Labeling de Suite peut mémoriser le wallet caché https://forum.trezor.io/t/improve-wrench-attack-protection/27159 |
| Coldcard Trick PINs | Duress wallet (BIP-85 ou legacy, sans effet visible), Brick Self (irréversible), Countdown & Brick (1 h puis brick), Wipe seed silencieux ; brick auto après 13 essais https://coldcard.com/docs/settings/ | Détruit ou vide l'appareil ; ne retient pas un ravisseur qui sait ; risque de représailles si le leurre est découvert |
| Samourai duress | Non trouvé : aucune source ne décrit une fonction duress dans Samourai ; je ne l'affirme pas. Samourai a de plus été poursuivi par le DOJ en avril 2024 (https://en.wikipedia.org/wiki/Samourai_Wallet) | n/a |
| Casa / Unchained | Multisig collaboratif 2-of-3 : le client détient 2 clés, le prestataire 1 (https://www.unchained.com/compare/unchained-vs-casa). Détails timelock Casa non vérifiés sur doc officielle | Les clés du client sont souvent dans le même foyer ; le ravisseur peut forcer la victime à signer avec ses 2 clés |
| Safe + Zodiac Delay | Un module met en file une tx, exécutable seulement après cooldown (expiration optionnelle), la Safe peut l'invalider par saut de nonce ; n'importe qui exécute après délai https://github.com/gnosisguild/zodiac-modifier-delay. Safe Guards = vérifications avant/après tx https://docs.safe.global/safe-smart-account/guards | Délai on-chain que la victime ne peut pas raccourcir : le seul vrai « repli silencieux », mais le ravisseur peut attendre le délai ou forcer l'annulation s'il tient les signataires |
| Argent guardians | Guardians co-signent ; période d'escape d'environ une semaine selon audit 2023 https://diligence.security/audits/2023/06/argent-account-multisig-for-starknet/ (autre source : « quelques jours », non tranché) | Conçu pour la récupération, pas la contrainte |
| Ledger Recover | Sauvegarde optionnelle payante, seed en 3 fragments chez 3 prestataires, 2 requis ; vérification d'identité https://www.ledger.com/academy/what-is-ledger-recover | Pas anti-contrainte ; peut ajouter un vecteur (ravisseur forçant la restauration, cas non documenté) |
| Coinbase Vault | Retrait avec attente 48 h annulable, approbateurs multiples possibles https://help.coinbase.com/en-au/coinbase/getting-started/other/vaults-faq (doc historique de 2014, produit renommé depuis) | Délai de 48 h utile seulement si la victime est libérée avant la fin |
| Kraken Global Settings Lock | Bloque les changements de compte (ajout d'adresse/banque, mot de passe, 2FA, API) ; déverrouillage sans Master Key : 24 h à 30 jours https://support.kraken.com/hc/en-us/articles/201396877-What-is-the-Global-Settings-Lock-GSL- | Ne dit pas explicitement bloquer les retraits vers des adresses déjà enregistrées |
| Binance Withdraw Protection | Gèle tous les retraits on-chain de 1 à 7 jours ; mode strict sans annulation anticipée ; le support ne peut pas lever ; conçu contre la contrainte en personne https://coinmarketcap.com/academy/article/bbinance-withdrawal-lock-wrench-attacks | Ne bloque pas la police ; il faut l'activer avant l'agression |
| SwissBorg Withdrawal Protection | Time-lock de 1 à 90 jours sur les retraits externes, non contournable par le support, annoncé le 10 fév. 2026 (communiqué) https://www.theblock.co/post/389265/swissborg-introduces-withdrawal-protection-to-safeguard-against-physical-attacks | Même limite : à activer en amont |
| Whitelist d'adresses + 24 h (Binance) | Non vérifié : aucune page officielle Binance trouvée confirmant 24 h | n/a |
| Bitcoin OP_VAULT (BIP-345) | Covenant de délai avec chemin de recovery ; non activé, BIP retiré par l'auteur en mai 2025, remplacé par BIP-443 https://bips.dev/345/ | Non utilisable aujourd'hui |
| Deus Wallet « Duress Mode » | PIN secondaire ouvrant un faux compte ; communiqué payant déc. 2024, pas d'évaluation indépendante https://decrypt.co/297742/deus-wallet-introduces-duress-mode-the-revolutionary-solution-for-cryptocurrency-security | Mêmes limites que les leurres |
| Efficacité des leurres | Lopp : « peu de données » ; un cas rapporté où le leurre a échoué, un autre où la victime a été torturée malgré sa coopération (via Cointelegraph, article « Can panic wallets stop a wrench ») https://ru.tradingview.com/news/cointelegraph%3A34098a1ae094b%3A0-can-panic-wallets-stop-a-wrench-why-crypto-s-next-security-debate-is-physical | Pas de métrique publiée |

Banque et PIN de contrainte : le PIN inversé n'a jamais été déployé sur aucun distributeur ; le rapport FTC (2010) l'indique, Snopes a démenti la rumeur (https://snopes.com/business/bank/pinalert.asp ; https://www.kaspersky.com/blog/fact-or-fiction-inverted-pin-code/10559/). Un brevet existe (US10198924, https://patents.google.com/patent/US10198924) mais pas de déploiement bancaire prouvé. Les codes duress à alarme silencieuse existent seulement dans les alarmes domestiques (Ring, Frontpoint). Je n'ai trouvé aucune banque proposant un code de contrainte dans son app.

## 3. Détection biométrique de la contrainte
- Aucun produit ou startup validé trouvé pour autoriser un paiement via détection de contrainte.
- Littérature : brevets listant voix, réponse galvanique, pupille, rythme cardiaque. Étude insider-threat (ECG/EEG) : 86 % de précision de détection du stress, matériel spécialisé requis https://arxiv.org/pdf/2005.02862. Étude driver authentication : le stress dégrade la fiabilité de l'authentification https://acikkaynak.bilecik.edu.tr/items/c8a60808-bccd-4e10-a44f-35ea4b581b1f.
- Aucun taux de faux positifs duress publié. Raisonnement (mon inférence) : effort physique, urgence ou émotion légitime ressemblent à la contrainte, et la prévalence de la contrainte est très faible, donc beaucoup de fausses alertes à l'échelle.
- Spoofing : un GAN trompe > 50 % de vérificateurs en 10 essais ou moins (recherche web, source primaire non ouverte).

## 4. Avalanche : primitives
- C-Chain est EVM : Safe + Zodiac Delay, Guards et ERC-4337 s'y appliquent en principe ; un bundler Avalanche est listé chez Alchemy (https://www.alchemy.com/dapps/list-of/account-abstraction-erc-4337-bundlers-on-avalanche). Déploiement officiel d'EntryPoint/Safe sur Avalanche : non confirmé ici.
- ERC-8238 « Coercion-Resistant Vault » : brouillon (posté le 2 avril 2026, PR #1703 le 23 avril 2026), compte ERC-4337 avec solde chaud plafonné par époque, coffre froid timelock 24-72 h, bypass 2-of-3 guardians, retraits annulables, pause d'urgence ; implémentation de référence auto-déclarée (71/71 tests, Sepolia) https://ethereum-magicians.org/t/erc-8238-coercion-resistant-vault/28130. C'est le module le plus proche d'un « panic » sur EVM.
- Session keys ERC-4337 : clés temporaires à limites (plafond, allowlist, expiration) appliquées on-chain par le compte smart https://www.spark.money/glossary/session-key.
- L1 Avalanche : le précompile Transaction AllowList (adresse 0x0200000000000000000000000000000000000002, rôles Admin/Manager/Enabled) restreint qui peut envoyer des tx https://docs.avax.network/docs/avalanche-l1s/precompiles/transaction-allowlist.
- Teleporter / ICM : messagerie cross-L1 avec protection anti-rejeu et retries ; contrat non modifiable une fois déployé https://docs.avax.network/docs/cross-chain/teleporter/overview. Utilité pour un repli (alerte ou gel coordonné entre chaînes) : idée de conception, non documentée comme telle.
- Argent « escape » est la seule notion Argent trouvée (voir ci-dessus). Pas de module duress livré sur Safe trouvé.

## 5. Cadre légal et gels
- Affaire Balland : rançon estimée à 10 M€, dont une partie payée en crypto ; les enquêteurs ont tracé, gelé et saisi la quasi-totalité des fonds transférés (cryptoast ci-dessus ; Fortune 24 janv. 2025 https://fortune.com/europe/2025/01/24/french-military-police-rescue-co-founder-13bn-crypto-startup-ledger-bungled-paris-kidnapping-goes-wrong).
- Procédure en France : traçage (RAID Square), réquisition à la plateforme, saisie décidée par l'autorité judiciaire ; un exchange centralisé peut geler et transmettre les données du compte dans le cadre judiciaire. Obstacles : bridges, DEX, coopération internationale lente, enquêteurs surchargés (Slate : « 300 dossiers en attente par enquêteur ») https://www.slate.fr/societe/enlevements-lies-cryptomonnaies-chaque-enqueteur-cyber-300-dossiers-attente-traitement-bureau-cryptorapts-cybercriminalite-police-ofac-uncyber-justice-pnaco-france.
- JUNALCO (Paris) pilote les dossiers ; ~200 arrestations / 88 mises en examen (The Block).
- Autres gels : streamer TeufeurS (2023), fonds tracés et gelés avec Binance selon ZachXBT (via https://ambcrypto.com/800k-in-crypto-ransom-frozen-as-france-sees-rise-in-violent-extortion-cases/) ; Malaisie : 2,46 M USDT gelés par la police (même source, année non précisée).
- Tether : peut geler des adresses USDT ; stablecoins Tether+Circle ont blacklisté ~5 700 wallets / ~2,5 Md$ fin 2025 (Elliptic, via recherche web). Je n'ai trouvé aucun cas où Tether gèle des fonds d'un enlèvement confirmé ; un litige existe sur un gel sans mandat (42,4 M$, Thaïlande, oct. 2025). Philippines (Anson Que) : gel de ~79 800 USDT demandé, résultat non confirmé.
- Non traité faute de source primaire : texte de loi exact (Code pénal art. 224-1 ss., contrainte/violence, pas de nullité automatique d'un transfert signé sous contrainte), responsabilité des banques ; à ne pas affirmer sans vérification.

## Mapping (pour la fonction envisagée : délai/repli silencieux)
- NIST CSF 2.0 : DE.CM (surveillance), DE.AE (analyse d'événements), RS.MA (gestion d'incident), RS.MI (atténuation), PR.AA (contrôle d'accès).
- OWASP Agentic : sans objet direct ; ASI03 (abus d'identité et de privilèges) si un agent déclenche le repli.
- MITRE ATT&CK : T1657 (Financial Theft), T1078 (Valid Accounts, transferts avec identifiants légitimes sous contrainte). ATLAS : sans objet.
- D3FEND : D3-UAP (User Account Permissions) et D3-ACH (Application Configuration Hardening), correspondances à confirmer sur d3fend.mitre.org avant usage.

## Limites de ce document
- Les pages ont été lues via WebFetch/WebSearch résumés ; les chiffres Lopp sont mon comptage ; Casa timelock, Binance whitelist 24 h, droit pénal français précis et Avalanche EntryPoint restent non vérifiés (indiqués comme tels).

# Wrench attacks : mode opératoire réel des ravisseurs (cas 2024-2026) et points de renversement

Rédigé le 10 oct. 2026. Hackathon blue team Track 1 (règlement : `context/notion_guide.md`). Document défensif : il décrit ce que la presse, les parquets et les dossiers judiciaires ont rendu public, pas un mode d'emploi.

## TL;DR
- Deux familles d'attaque. (a) Home invasion / enlèvement de la victime : le ravisseur veut un accès (codes, app, mot de passe wallet) puis un virement vers son adresse, en quelques heures. (b) Enlèvement d'un proche pour rançon : preuve de vie (vidéo, doigt coupé), demande à un tiers (associé, fils), ultimatum, baisse négociée.
- Les exécutants sont des « petites mains » (16-23 ans, recrutés sur Snapchat/Telegram pour quelques centaines à milliers d'euros, via des logisticiens), pilotés par des commanditaires à distance (Maroc, prison). Ils paniquent, se trompent de cible et se font prendre. Ils ne sont pas des experts blockchain.
- Ce qu'ils vérifient, d'après les cas documentés : le solde ou le compte à l'écran (Juvisy, Voiron, Chicago), l'ouverture des téléphones et des apps. Aucune source primaire lue ne décrit un explorateur de blocs ni l'attente de confirmations : c'est un trou de la documentation publique, pas un fait établi.
- Les tentatives échouent surtout par erreur de ciblage, résistance, voisins/alarmes, renseignement policier, et fonds absents (Chainalysis : 12 paiements sur 46 tentatives fin juin 2026 = 26 %, contre 67 % en 2024). Aucune source n'attribue l'échec à un timelock.
- Les cas qui se terminent bien le doivent à un tiers qui prévient la police pendant l'événement (fils de Voiron, fils de Saint-Genis, père de Chicago, voisins, gardienne), et le gel n'a marché que quand les fonds sont arrivés sur un exchange centralisé (Balland, TeufeurS).

## 0. Limites de ce que j'ai pu lire
- Bloqués (403 / domaine refusé) : Le Monde, Le Parisien, Chicago Tribune, Slate, gendarmerie.interieur.gouv.fr. Les faits attribués à ces médias sont repris via des relais cités (Cryptoast, Europe 1, Brut, Maddyness, Yahoo/AFP, Lopp). Je ne les ai pas relus à la source.
- Je n'ai lu aucun jugement ni affidavit en texte intégral. Les « preuves vérifiées » ci-dessous sont celles que la presse rapporte.
- Cas demandés non retrouvés : « Vierzon / Mehdi » (Vierzon = Balland, aucun « Mehdi » trouvé) ; « Coinhouse » (aucune attaque visant Coinhouse trouvée ; Coinhouse est cofondée par Éric Larchevêque, associé de Balland, rien de plus) ; « Nantucket » (introuvable, absent de la base de Lopp lue) ; « Maine-et-Loire » : seulement Saint-Léger-sous-Cholet (9 janv. 2026, 43 ans, enlevé pour ses cryptos, aucun détail public) et Angers (10 juill. 2024, 10 000 € au couteau ; en mars 2026, interpellations à Angers dans l'affaire de l'Ain). « Michael Valentino » = Michael Valentino Teofrasto Carturan = la victime du cas Woeltz/Duplessie (voir 1.4) ; aucun cas italien distinct 2024-2025 dans la base de Lopp lue.
- Chiffres macro : Chainalysis lu via The Block, Decrypt, CoinMarketCap (le billet Chainalysis lui-même n'a pas été ouvert ; l'URL chainalysis.com testée renvoie 404).

## 1. Cas, un par un

### 1.1 France

**A. Balland / Ledger, Vierzon-Méreau (Cher), 21-22 janv. 2025**
- Cible : cofondateur de Ledger. Le lien avec la fuite de données Ledger 2020 n'est pas établi par une source judiciaire lue. Commanditaire présumé : un jeune de 26 ans déjà détenu pour une autre affaire de rançon (il conteste), arrêté ensuite ; un dernier suspect arrêté en Espagne en mars 2026 ; un autre arrêté à Tanger.
- Déroulé : enlèvement au petit matin du 21 janv. au domicile ; les deux victimes sont séparées. Balland est emmené dans une maison louée près de Châteauroux ; sa compagne est ligotée dans un véhicule à Étampes (Essonne). Les ravisseurs envoient à Éric Larchevêque (associé) une vidéo du doigt coupé et exigent une rançon en cryptomonnaie (10 M€ selon une source ; le parquet ne donne pas de montant), à verser sur un portefeuille. Séquestration : environ 1 jour pour Balland (libéré par le GIGN le 22 janv. dans l'après-midi), compagne retrouvée dans la nuit du 22 au 23.
- Demande exacte : paiement par un tiers (l'associé) en crypto vers une adresse. Pas de seed ni de PIN demandés à la victime.
- Fin : la procureure de Paris indique qu'une partie de la rançon a été versée « dans le cadre de la négociation » avec les forces de l'ordre et que la majorité des cryptos a été saisie et gelée. Alerte : Larchevêque a prévenu après réception de la vidéo.
- Sources : https://www.europe1.fr/node/252764 (relais) ; https://www.lalibre.be/economie/entreprises-startup/2025/01/23/le-cofondateur-de-lentreprise-de-cryptomonnaies-ledger-et-sa-compagne-enleves-contre-rancon-puis-liberes-LTY4KOXJAJAJDMY7JONIFY6GSQ ; https://www.brut.media/fr/articles/enlevement-du-cofondateur-de-ledger-le-commanditaire-presume-mis-en-examen-a-paris ; https://cryptoast.fr/enlevements-sequestration-crypto-volees-recuperes/ ; https://www.theblock.co/post/394688/authorities-arrest-missing-suspect-ledger-co-founder-david-ballands-kidnapping

**B. Père d'un entrepreneur crypto, Paris 14e, 1er mai 2025**
- Quatre hommes cagoulés l'enlèvent en plein jour. Rançon de 5 à 7 M€ en crypto (selon Le Parisien, relayé par Cryptoast). Faute de paiement dans les délais, un doigt est sectionné. Libéré par la police (article France 24 daté du 4 mai 2025, soit au plus tard 3 jours après).
- Les mêmes juges ont réuni cette affaire avec celles de Paymium et Couëron : « même façon d'opérer, même type de cibles, organisation pyramidale », exécutants recrutés séparément, logisticiens et commanditaires en retrait (jonction du 27 mars 2026, 45 mis en examen).
- Sources : https://cryptoast.fr/enlevements-cryptos-seule-organisation-criminelle-organisee-tentatives/ ; https://www.france24.com/en/live-news/20250504-kidnapped-dad-of-crypto-firm-boss-released-in-french-police-raid

**C. Paymium, Paris 11e, 13 mai 2025**
- Cible : fille et petit-fils (18 mois) du PDG Pierre Noizat, avec son compagnon. Trois ou quatre hommes cagoulés tentent de la pousser dans une camionnette Chronopost. Repoussés par le compagnon et des passants ; victimes légèrement blessées. Le parquet indique qu'une tentative la veille avait été interrompue pour « problèmes matériels ».
- Enquête : 25 mis en examen dont 6 mineurs (16-23 ans), « très jeunes, hameçonnés par de l'argent ». Commanditaire présumé arrêté à Rabat ; les commanditaires sont soupçonnés d'être à l'étranger.
- Sources : https://www.maddyness.com/2025/05/13/crypto-tentative-denlevement-de-deux-proches-dun-pdg-dune-plateforme-dachat/ ; https://cryptoast.fr/enlevements-crypto-25-suspects-6-mineurs-mis-examen-france/ ; https://www.theblock.co/post/356980/alleged-mastermind-behind-french-crypto-kidnapping-spree-arrested-in-morocco-report

**D. Juvisy-sur-Orge (Essonne), nuit du 13-14 juin 2025**
- Cible : trader TikTok de 26 ans, ~40 000 abonnés, train de vie affiché. Quatre hommes l'embarquent vers 1h30 dans une Clio volée. Exigence : 50 000 € en crypto. Détenu un peu plus d'une heure selon 75secondes ; libéré parce que les ravisseurs ont consulté son compte et constaté qu'il n'avait pas les fonds. Il a pu porter plainte (6 jours d'ITT).
- C'est le seul cas lu où l'on voit explicitement la vérification du solde puis l'abandon.
- Sources : https://cointelegraph.com/news/kidnappers-release-crypto-trader-because-insufficient-funds ; https://www.75secondes.fr/?p=161914

**E. Valence (Drôme), 28-31 août 2025**
- Cible : Suisse de 23 ans, possible confusion d'identité. Séquestré 4 jours, torturé. La gendarmerie n'est informée que le samedi 30 août (jour 3 ; qui a alerté : non précisé). Assaut le 31 août vers 5h (150 militaires, GIGN et UNPJ), victime retrouvée ligotée l'après-midi ; 7 gardes à vue ; 12 interpellations supplémentaires le 2 mars 2026. Rançon en crypto réclamée, payeur non précisé.
- Source : https://www.rts.ch/info/monde/2025/article/un-jeune-suisse-enleve-en-france-libere-par-un-commando-du-gign-28988735.html

**F. Saint-Genis-Pouilly (Ain), 31 déc. 2024 - 2 janv. 2025**
- Cible : le père d'un influenceur installé à Dubaï. Le couple est séquestré ; la femme et la fille ligotées. Les ravisseurs contactent le fils et demandent une rançon ; le fils prévient aussitôt la police. Faute de paiement, le père est frappé, aspergé d'essence et mis dans le coffre. Une BAC repère deux cagoulés près du Mans, ils fuient, des appels à l'aide sortent du coffre : retrouvé à ~700 km. Aucun paiement. Arrestations en juin 2025 (17-22 ans) puis mars 2026 (5 suspects de 16 à 42 ans, dont Angers) : 10 incarcérés.
- Sources : https://www.brut.media/fr/articles/enlevement-du-pere-dun-influenceur-cinq-arrestations-pour-un-rapt-contre-rancon ; https://cryptoast.fr/pere-influenceur-crypto-sequestre-soir-nouvel-an/

**G. Voiron (Isère), 25 janv. 2026**
- Cible : le fils (supposé riche en crypto). Adresse trouvée sur internet (témoignage du fils : il se retrouve dans deux fuites de clients Ledger, sans avoir de crypto). Trois hommes cagoulés entrent vers 6h, ne trouvent pas le fils, prennent le père (74 ans). Trois heures de route, cache à Valence, ~16 h de tortures filmées (doigts, marteau).
- Demandes : 3 M€/$ ou 1 000 ETH, preuve par une soixantaine d'images/vidéos, menace de le tuer « pour l'exemple », puis baisse à 300 000 € pendant la négociation. Le fils a temporisé et alerté la police. Issue : sources divergentes. Cryptoast/Journal du Coin : assaut de la BRI de Lyon près de Loriol le soir du 25 janv., 3 arrestations en flagrant délit. DL News (selon les autorités) : le gang a relâché la victime à 23 h après avoir appris que le fils était développeur web sans fortune crypto.
- Les ravisseurs sont décrits par le fils comme des « petites mains » recrutées sur Snapchat, instables, qui paniquent.
- Sources : https://cryptoast.fr/on-a-ton-pere-cest-pour-la-crypto-le-fils-dun-otage-sequestre-en-isere-temoigne-exclusivite/ ; https://www.dlnews.com/articles/people-culture/men-tortured-74-year-old-in-botched-crypto-kidnap-attempt

**H. Ploudalmézeau (Finistère), 20 avril 2026**
- Deux individus cagoulés et armés séquestrent une famille plus de 3 heures, en plein journée ; ligotée et bâillonnée, elle transfère 700 000 € en crypto (liste Cryptoast) ; le père, détenteur, est absent. Autre version : ils repartent avec le portefeuille numérique après extorsion d'un mot de passe ou d'une clé. Les voisins découvrent la scène et préviennent la gendarmerie après le départ des agresseurs. Aucune arrestation à la date des articles.
- Sources : https://cryptoast.fr/liste-enlevements-agressions-lies-cryptomonnaies-france/ ; https://www.generation-nt.com/actualites/famille-sequestree-finistere-crypto-2074495

**I. Péchabou (Haute-Garonne), 23 mars 2026**
- Cinq faux livreurs (17-22 ans, recrutés sur les réseaux pour quelques centaines d'euros) séquestrent une femme de 57 ans. Ils lui annoncent qu'ils savent qu'elle possède des cryptos ; sous la menace elle donne les codes de son portefeuille (1,12 BTC, ~68-70 k€). Ils sont retrouvés grâce au véhicule volé abandonné ; un suspect dit avoir été recruté par un réseau plus large (lien non établi officiellement).
- Source : https://coinacademy.fr/actu/toulouse-bitcoin-voles-lors-sequestration-domicile/ ; https://cryptoast.fr/sequestration-femme-57-ans-domicile-voler-cryptomonnaies/

**J. Gignac-la-Nerthe / Marseille 13e / Gardanne, nuit du 12-13 juin 2026**
- Fichier acheté sur le darkweb (fuites type Ledger/Waltio évoquées par Cryptoast). À Marseille, la famille se barricade et appelle la police, les agresseurs fuient (plaque relevée). À Gignac, deux femmes sont séquestrées ; quatre hommes interpellés en flagrant délit. Cryptoast dit « en pleine transaction crypto » ; CryptoActu parle de barrages improvisés par les proches : les versions divergent.
- Sources : https://cryptoast.fr/agression-crypto-4-hommes-arretes-pres-marseille-sequestraient-2-femmes-pour-cryptomonnaies/ ; https://cryptoactu.com/marseille-4-arrestations-apres-sequestration/

**K. Autres cas France utiles (liste Cryptoast, https://cryptoast.fr/liste-enlevements-agressions-lies-cryptomonnaies-france/)**
- Bourgogne, 13 avril 2026 : mère et fils de 10 ans enlevés pour faire pression sur le père (entrepreneur crypto, centaines de milliers d'euros). Véhicule tracé, retrouvés dans un hôtel du Val-de-Marne, libérés par le GIGN après 20 h, aucune rançon payée.
- Saint-Martin-le-Vinoux, 5 fév. 2026 : femme et mère séquestrées 30 h, cible = mari absent ; aucune rançon.
- Strasbourg, 31 mars 2026 : femme de 25 ans enlevée par de faux livreurs, rançon de 600 000 € exigée d'un proche à Dubaï ; un témoin aide la police à la libérer.
- Mulhouse/Thann, 22 mai 2026 : séquestrée ~11 h, menacée de mutilation, 14 000 € virés.
- Dompierre-sur-Mer, 18 déc. 2025 : couple séquestré, homme frappé ~2 h, transferts crypto d'environ 8 M€ selon le parquet (~10 M$ selon la presse) ; données issues de fuites selon les assaillants.
- Revelles (Somme), 31 oct. 2025 : famille ligotée, tentative d'extorsion de 200 000 € ; le virement n'a pas abouti (via synthèse Lopp, cause non expliquée dans ce que j'ai lu) ; condamnations à 9 et 5 ans le 23 fév. 2026 à Amiens.
- Erreurs de cible : Grivesnes (Somme, 3 équipes différentes avec le même fichier, une victime ligotée et frappée en direct sur Snapchat), Bondy, Vaires-sur-Marne, Saint-Mandé et Vaucresson (mauvais appartement, PDG de Binance France visé).
- Préventions policières : Normandie mai 2025 (traceur GPS, contre-surveillance, 5 arrestations avant passage à l'acte), Nantes/Couëron 26 mai 2025 (10 interpellations), Paris 19 janv. 2026 (gardienne donne l'alerte).

### 1.2 États-Unis, Canada

**L. Chicago (Lincoln Park), 27 oct. - 1er nov. 2024 (affidavit FBI de 44 pages, relayé par la presse)**
- Un faux réparateur frappe (« j'ai abîmé votre porte de garage »), des hommes armés entrent ; le fils est pris sortant de la douche, avec sa femme, leur bébé et la nounou. Camionnette puis Airbnb à Forest Park, une nuit, puis autre maison. Environ 5 jours.
- Ordre des demandes : transactions crypto immédiates faites par le fils (il est conduit en voiture pour en faire plusieurs), puis les ravisseurs transigent eux-mêmes après avoir obtenu l'accès à ses comptes. ~15 M$ transférés au total.
- Alerte : appel WeChat du fils à son père vers 13 h le 27 oct. ; le père prévient les autorités. Relâchés le 1er nov. devant un pressing. Fonds : environ 9 M$ non retrouvés selon l'affidavit (Yahoo) ; un autre relais parle de ~6 M$ récupérés. Six hommes inculpés ; un arrêté à la frontière (Otay Mesa) le 17 janv. 2025, d'autres partis en Chine via Tijuana.
- Sources : https://www.yahoo.com/news/6-men-accused-kidnapping-family-230600583.html ; https://cryptonews.com/news/six-men-charged-in-15m-crypto-kidnapping-case/

**M. Manhattan, 6-~23 mai 2025 (Woeltz / Duplessie, victime : Michael Valentino Teofrasto Carturan, 28 ans, Italien)**
- Cible choisie par des connaissances de longue date après un litige d'affaires ; attiré à New York sous menace contre sa famille. À l'arrivée : électronique et passeport confisqués, mains liées, coups, chocs électriques, scie, suspendu au-dessus d'une cage d'escalier. Durée ~17 jours (NYPD).
- Demande exacte : le mot de passe de son portefeuille bitcoin (la presse dit « password » dans la plainte, certains médias écrivent « seed phrase »). Fin : il dit qu'il donnera le mot de passe stocké sur son portable ; quand Woeltz va chercher l'ordinateur, il s'enfuit et alerte un agent de la circulation. Woeltz libéré sous 1 M$ de caution en juillet 2025.
- Sources : https://abc13.com/post/what-know-nyc-crypto-kidnapping-torture-case/16588859/ ; https://decrypt.co/322356/third-arrest-made-kidnapping-bitcoin-investor-new-york

**N. Danbury (Connecticut), 25 août 2024**
- Les parents des auteurs d'un vol de 243 M$ sont embarqués après un carjacking (Lamborghini) par des hommes recrutés en Floride ; organisateurs condamnés ensuite (Iza 15 ans). Cible choisie parce que le fils était censé avoir accès à des fonds. Police arrive pendant la fuite de la camionnette (accident).
- Source : https://krebsonsecurity.com/2024/10/lamborghini-carjackers-lured-by-243m-cyberheist/

**O. Los Angeles (Koreatown), 2024 ; Halem, ex-policier, condamné.** Faux policiers, menottes, menace d'arme, exigence du disque dur contenant les clés (~350 000 $ en BTC) et transferts depuis le compte. Source : https://decrypt.co/359818/ex-lapd-officer-found-guilty-350k-wrench-attack-bitcoin

**P. Colombie-Britannique, 27-28 avril 2024.** Faux livreurs Canada Post, famille ligotée, 200 BTC puis 100 BTC exigés, environ 1,6 M$ pris ; la fille s'enfuit et appelle le 911. Source : https://decrypt.co/349901/bitcoin-heist-family-members-waterboarded-sexually-assaulted-steal-1-6-million

### 1.3 Italie
- Aucun cas italien distinct 2024-2026 retrouvé. Le cas « Italie » de votre brief correspond à la victime italienne de Manhattan (M ci-dessus). Le seul cas italien de la base de Lopp (Manerba) date de 2022.

## 2. Synthèse par question

### 2.1 Choix de la cible
- Fichiers de fuite et revente : Voiron (fils retrouvé dans deux fuites Ledger, selon lui), Gignac (fichier darkweb), Grivesnes (même fichier utilisé par trois équipes), Dompierre-sur-Mer (fuites selon les assaillants), Chainalysis relie la vague française à un vol de dossiers fiscaux de détenteurs et à la fuite Waltio de janv. 2026 (~50 000 utilisateurs d'après la presse ; lien de causalité non établi par les autorités). Aucune source ne rattache la revente à un agent de l'administration fiscale précis.
- Réseaux sociaux et étalage (Juvisy, Amouranth/Houston), annonces OTC et forums (Lopp), connaissance directe (~10 % des attaques selon Lopp ; Manhattan), proches de dirigeants (Paymium, Balland, Binance France).
- Part des proches ciblés : 25-30 % des cas, plus de 40 % en France (Chainalysis). Victimes locales : 93 % en France, donc repérage préalable.
- Source : https://coinmarketcap.com/academy/article/crypto-wrench-attacks-chainalysis-france-2026 ; https://www.lopp.net/transcripts/presentations/Bitcoin_2025-Wrench_Attacks.txt

### 2.2 Qui sont les ravisseurs
- Structure pyramidale : commanditaire, logisticiens, exécutants (jonction de procédure du 27 mars 2026). Exécutants recrutés sur Snapchat/Telegram, pour quelques centaines à quelques milliers d'euros (gendarmerie via relais), 6 mineurs sur les 25 premiers mis en examen, 88 mis en examen et 75 en détention à mi-2026 (The Block), 256 interpellations et 141 détentions au 7 sept. 2026 (Cryptoast). Commanditaire présumé de Balland déjà détenu ; un autre arrêté à Rabat ; trois commanditaires présumés interpellés en septembre 2026 « depuis leur lieu de détention ».
- Compétence technique : faible pour les exécutants (il leur faut la victime ou un accès) ; Chainalysis décrit trois niveaux de blanchiment : directement vers un exchange centralisé, DEX/ponts/MEV, et réseaux criminels (un cas passant par un échangeur instantané lié à des réseaux de cartels). Les commanditaires, eux, savent que « les exchanges centralisés sont des goulots d'étranglement ».
- Sources : https://cryptoast.fr/enlevements-crypto-25-suspects-6-mineurs-mis-examen-france/ ; https://decrypt.co/375014/crypto-wrench-attacks-30m-stolen-2026-chainalysis

### 2.3 Ce qu'ils demandent, dans quel ordre
- Home invasion ou enlèvement de la victime : (1) entrer (faux livreur, faux policier, ruse) et neutraliser, (2) confisquer les téléphones et le matériel (Manhattan, Voiron, Bondy), (3) exiger l'accès : code de téléphone, déverrouillage biométrique de force (NBC : visage d'un homme aux yeux bandés), app d'exchange, mot de passe wallet ou disque dur avec clés (Manhattan, Halem, Péchabou), (4) faire virer vers leur adresse, ou virer eux-mêmes une fois dans le compte (Chicago), (5) repartir avec les appareils (Ploudalmézeau, Halem).
- Enlèvement d'un proche : (1) preuve de vie (vidéo, photos : une soixantaine à Voiron ; doigt coupé à Vierzon), (2) demande à un tiers, (3) ultimatum puis violence (doigt coupé quand le paiement tarde, 1er mai 2025), (4) baisse du montant en négociation (3 M → 300 k€ à Voiron).
- Formes de paiement observées : adresse portefeuille (Balland), 1 000 ETH ou dollars (Voiron), BTC ou ETH (Chicago). Aucun cas lu ne cite une demande de conversion en Monero. Seed phrase explicite : une seule mention (Decrypt sur Manhattan), contredite par le terme « password » dans la plainte rapportée.

### 2.4 Ce qu'ils vérifient
- Documenté : consultation du compte ou du solde par les ravisseurs (Juvisy), abandon quand le fils n'est pas riche (Voiron, version DL News), abandon quand le portefeuille est vide (Londres 2023, hors période : 9 $ trouvés, demande abaissée à 2 700 $ prélevés sur un compte bancaire, https://decrypt.co/331264/london-kidnapping-barber-bitcoin-billionaire-he-wasnt), accès réel aux comptes puis transactions autonomes (Chicago), prise de l'appareil entier (Ploudalmézeau, Halem).
- Non trouvé dans les sources lues : explorateur de blocs, attente de N confirmations, test de la seed sur leur appareil, durée d'attente après transfert. Je ne l'affirme ni ne l'exclus. Lopp précise dans sa conférence qu'il ne décrit pas la vérification des fonds.
- Détail utile : l'acceptation d'un paiement partiel tracé « dans le cadre de la négociation » dans l'affaire Balland montre qu'un ravisseur a accepté une adresse et un paiement coordonnés avec la gendarmerie.

### 2.5 Fins de cycle (comment la police arrive)
- Alerte par un tiers pendant l'événement : fils (Saint-Genis, Voiron), père (Chicago), voisins après coup (Ploudalmézeau), filles (Nancy), gardienne (Paris janv. 2026), témoin (Strasbourg), famille qui appelle (Marseille).
- Localisation : véhicule tracé (Bourgogne, Péchabou), BAC par hasard (Saint-Genis), enquête cyber/gendarmerie (Balland : de la section de recherches de Bourges à l'unité cyber), contre-surveillance GPS (Normandie).
- Évasion : Manhattan (prétexte pour récupérer l'ordinateur), Colombie-Britannique (fille).
- Libération sans paiement : Voiron, Saint-Genis, Juvisy, Bourgogne.

### 2.6 Pourquoi ça échoue de plus en plus
- Chainalysis : 12 paiements sur 46 tentatives fin juin 2026 (26 %), 49 % en 2025, 67 % en 2024. Explication donnée : vague française plus indiscriminée et à fort volume, qui remplace des opérations ciblées. Preuves publiques à l'appui : erreurs de cible (Grivesnes, Bondy, Vaires, Saint-Mandé, Vaucresson, Voiron, Juvisy), échecs en cours d'exécution (porte, chiens, alarme, voisins), prévention policière.
- Ce que les sources ne disent pas : rôle des timelocks (aucun cas lu), rôle de la victime sans accès (Saint-Martin-le-Vinoux : cible absente), délai exchange. Binance Withdraw Protection et SwissBorg Withdrawal Protection (10 fév. 2026) existent, mais je n'ai trouvé aucun cas où un verrou de retrait a fait échouer un enlèvement.
- Définition : le taux est une part de tentatives publiquement connues (biais de sous-déclaration : Lopp, 20-25 % de signalements à la police).

### 2.7 Fenêtres de temps (ce qui est documenté)
| Fenêtre | Valeurs observées | Cas |
|---|---|---|
| Début de l'agression → première demande | quelques minutes (home invasion) ; quelques heures pour les rançons (vidéo avant midi à Voiron, appel à 7 h) | Voiron, Chicago (appel WeChat vers 13 h) |
| Durée de séquestration | ~1 h (Juvisy) ; 2-3 h (Dompierre, Ploudalmézeau) ; 11 h (Mulhouse) ; 16 h (Voiron) ; 20 h (Bourgogne) ; 30 h (Saint-Martin) ; 1 à 2 jours (Balland, Saint-Genis) ; 4 j (Valence) ; ~5 j (Chicago) ; ~17 j (Manhattan) | cités ci-dessus |
| Transaction demandée → libération | non documenté (aucune source lue ne mesure l'attente après transfert) | |
| Libération → plainte | Juvisy : plainte déposée après libération ; Lopp : 20-25 % de victimes signalent | Juvisy ; conférence Lopp |
| Plainte/événement → gel | Balland : « majorité gelée » annoncée par la procureure dans les jours suivants (presse du 24 janv. 2025) ; TeufeurS (2023) : ~800 000 $ gelés avec Binance, délai non indiqué, révélé par ZachXBT en avril 2026 ; Karachi : suspects arrêtés dans les 3 jours suivant la plainte (NBC) ; T3 FCU (Tether, Tron, TRM) : « sous 24 h dans les cas urgents » selon ForkLog, affirmation générale ; Chicago : ~9 M$ non retrouvés | ambcrypto, NBC, ForkLog |
- Sources : https://ambcrypto.com/800k-in-crypto-ransom-frozen-as-france-sees-rise-in-violent-extortion-cases/ ; https://www.nbcnews.com/tech/rcna215047 ; https://forklog.com/en/news/tether-tron-and-trm-labs-alliance-freezes-450-million-in-crypto-assets

## 3. Tableau : étape du ravisseur → croyance → vérification → renversement

| Étape | Ce qu'il croit | Ce qu'il vérifie (documenté) | Point de renversement pour un défenseur |
|---|---|---|---|
| 1. Ciblage | La cible détient de la crypto à cette adresse | Rien de vérifié : erreurs fréquentes (Grivesnes, Bondy, Voiron) | Réduire l'exposition dans les fuites ; leurres traçables dans les fichiers (idée, non éprouvée) |
| 2. Approche (faux livreur, faux policier) | Effet de surprise, pas d'alerte | Repérage préalable, parfois traceur GPS (Normandie) | Alerte de proximité (voisins, gardien, alarme) : a fait échouer Paris janv. 2026, Marseille, Nancy |
| 3. Contrôle des lieux et des appareils | Plus personne ne peut appeler | Il prend les téléphones (Voiron, Manhattan, Bondy) | Signal qui ne dépend pas du téléphone de la victime : absence de « check-in », alerte côté serveur |
| 4. Demande d'accès (codes, app, mot de passe) | Ce qui s'ouvre est le vrai portefeuille | Il regarde l'écran, le solde (Juvisy, Chicago) ; déverrouillage biométrique forcé (NBC) | Ce que l'écran montre : solde réduit ou compte « sas » plausible |
| 5. Virement | Il est irréversible et immédiat ; le montant reçu = le montant promis | Non documenté (aucun cas d'explorateur ou de confirmations) | Délai imposé côté serveur ou contrat ; adresse de destination surveillée |
| 6. Rançon via un tiers | Le proche paie vite sous la vidéo et l'ultimatum | Preuves de vie, réponses du tiers ; baisse du montant | Tiers qui prévient la police et temporise (Voiron, Saint-Genis) ; paiement tracé coordonné (Balland) |
| 7. Blanchiment et sortie | Les fonds quittent la chaîne avant tout gel | Chainalysis : vers exchange, DEX, ponts | Surveillance des adresses de destination et gel rapide via exchange ou émetteur de stablecoin |

## 4. Les 5 hypothèses les plus solides

Règle de sécurité commune : ne rien faire qui change visiblement la réponse que le ravisseur a exigée, sinon le risque de représailles augmente (doigt coupé quand le paiement tarde, 1er mai 2025 ; tortures qui continuent à Voiron et Manhattan). Ces hypothèses sont des propositions, pas des faits.

**H1. Solde visible réduit (compte « sas » plausible) : solidité forte pour les agressions courtes.**
- Cas qui la justifie : Juvisy (libéré après consultation du compte), Voiron (relâché dès que la richesse supposée est démentie, version DL News).
- Cas qui la casse : Manhattan (le ravisseur connaît la victime depuis des années, réclame un mot de passe précis, 17 jours), Chicago (accès autonome aux comptes, sait ce qu'il cherche), Ploudalmézeau et Péchabou (ils emportent le portefeuille ou exigent des codes précis pour un montant qu'ils connaissent déjà par le fichier de fuite).
- Risque : si le leurre est découvert, représailles ; Lopp : « peu de données » sur l'efficacité des leurres.

**H2. Délai invisible côté serveur ou contrat sur les gros retraits : solidité moyenne.**
- Cas qui la justifie : les enlèvements à rançon par tiers (Balland, Voiron, Saint-Genis), où le délai laisse du temps à la police ; durées courtes (Juvisy 1 h, Ploudalmézeau 3 h, Dompierre 2 h) où l'on peut tenir moins longtemps que l'agresseur ne l'attend.
- Cas qui la casse : séquestrations longues (Valence 4 j, Chicago 5 j, Manhattan 17 j) qui dépassent un délai de 24-72 h ; échéances de mutilation (1er mai 2025, Balland) ; aucun cas où un verrou existant ait déjà fait échouer une attaque.
- Condition : le délai doit ressembler à un transfert normal « en cours » sinon l'ultimatum bascule en violence. Aucun cas lu ne dit comment le ravisseur réagit à un virement en attente.

**H3. Transaction qui semble confirmée (adresse surveillée, preuve apparente de paiement) : solidité faible à moyenne, aucune base documentée.**
- Cas qui la justifie : Balland, où un paiement partiel coordonné avec la gendarmerie a été accepté et les fonds tracés puis gelés ; exécutants peu compétents (profil Voiron, Péchabou).
- Cas qui la casse : commanditaires distants qui suivent leurs propres portefeuilles (Chainalysis : mid-tier utilise DEX, ponts) ; Chicago, où les ravisseurs opèrent eux-mêmes sur les comptes ; absence de toute donnée sur ce que le ravisseur regarde. À traiter comme une expérience, pas comme une promesse.

**H4. Alerte silencieuse à des tiers (proches, centre de réponse, police) : solidité forte pour les cas à plusieurs victimes ou avec un tiers au courant.**
- Cas qui la justifie : fils de Saint-Genis et de Voiron (appel immédiat à la police, BRI sur place), père de Chicago (alerte vers 13 h), filles à Nancy, gardienne à Paris, témoin à Strasbourg, Houston (mari au téléphone selon Lopp).
- Cas qui la casse : Ploudalmézeau (alerte seulement après le départ), Péchabou et Bondy (téléphones et ordinateurs emportés), Manhattan (électronique confisquée), Voiron (téléphones des trois jeunes saisis). Le déclencheur ne doit pas dépendre de l'appareil de la victime ni d'une action visible.

**H5. Préparer la preuve pour un gel rapide (adresses, contacts exchange/émetteur, dossier prêt) : solidité forte sur l'objectif de récupération, nulle sur la protection du corps.**
- Cas qui la justifie : Balland (majorité des fonds saisis et gelés), TeufeurS (~800 000 $ gelés avec Binance), Karachi (arrestations en 3 jours).
- Cas qui la casse : Chicago (~9 M$ non retrouvés, ponts et sorties vers l'étranger), Chainalysis sur les circuits DEX/ponts/échangeurs instantanés, Slate : environ 300 dossiers en attente par enquêteur cyber (cité dans `research/docs/wrench_attacks_factcheck.md`), 20-25 % seulement des victimes signalent (Lopp).

Priorité de test pour la démo : H4 (déclencheur hors appareil) + H5 (paquet de preuve), puis H1 (compte sas). H2 et H3 : prototypes à valider séparément.

## 5. Mapping réglementaire (proposition de l'équipe, non vérifié ligne à ligne sur les sites officiels)
| Hypothèse | NIST CSF 2.0 | MITRE ATT&CK | D3FEND | OWASP Agentic / ATLAS |
|---|---|---|---|---|
| H1 solde réduit | PR.AA, DE.CM | T1657 Financial Theft | D3-UAP, D3-ACH | Sans objet (ASI03 si un agent pilote le compte) |
| H2 délai serveur | PR.AA, PR.PS, RS.MI | T1657 | D3-UAP | ASI03 si agent ; ATLAS sans objet |
| H3 confirmation apparente | DE.AE, RS.MI | T1657 | D3-UBA (analyse de comportement) | Sans objet |
| H4 alerte silencieuse | DE.CM, DE.AE, RS.MA, RS.CO | T1078 Valid Accounts (virements légitimes sous contrainte) | D3-UBA | ASI03 si agent ; ATLAS sans objet |
| H5 preuve + gel | RS.AN, RS.MA, RS.CO | T1657 | D3-NTA (analyse de trafic, par analogie) | Sans objet |
Les trois référentiels OWASP Agentic et ATLAS ne couvrent pas directement une violence physique : l'ancrage se fait surtout par NIST CSF 2.0 (Detect, Respond) et ATT&CK. À confirmer par l'équipe avant le rapport, puisque les identifiants D3FEND n'ont pas été rouverts ici.

## 6. Sources principales (lues)
- Base Lopp : https://github.com/jlopp/physical-bitcoin-attacks (36 incidents 2024-2025 lus, page tronquée au 29 nov. 2025) ; https://raw.githubusercontent.com/jlopp/physical-bitcoin-attacks/master/README.md (entrées 2026 jusqu'au 25 janv.) ; conférence : https://www.lopp.net/transcripts/presentations/Bitcoin_2025-Wrench_Attacks.txt
- Chainalysis via The Block, Decrypt, CoinMarketCap : https://theblock.co/post/410984/more-than-30-million-stolen-in-violent-crypto-attacks-in-2026-as-france-emerges-as-wrench-attack-hotspot-chainalysis ; https://decrypt.co/375014/crypto-wrench-attacks-30m-stolen-2026-chainalysis ; https://coinmarketcap.com/academy/article/crypto-wrench-attacks-chainalysis-france-2026
- Cryptoast (liste et dossiers 2026) : https://cryptoast.fr/liste-enlevements-agressions-lies-cryptomonnaies-france/ ; https://cryptoast.fr/enlevements-cryptos-seule-organisation-criminelle-organisee-tentatives/ ; https://cryptoast.fr/enlevements-sequestration-crypto-volees-recuperes/
- Autres : Europe 1, Brut, La Libre, RTS, Maddyness, DL News, Decrypt, Yahoo/AFP, NBC, ABC13, Krebs, ForkLog, AmbCrypto (URLs dans le texte).
- Voir aussi `research/docs/wrench_attacks_factcheck.md` pour les protections existantes (Binance, SwissBorg, Coldcard, Safe+Zodiac, ERC-8238).

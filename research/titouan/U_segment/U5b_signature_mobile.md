# U5b - Signature sur mobile : où Sentinelle peut s'interposer

Date de la recherche : 2026-10-11. Méthode : WebSearch/WebFetch uniquement, rien téléchargé ni installé.

Légende des étiquettes (choix de l'agent, la consigne ne les définissait pas) :
- [P] = source primaire (documentation ou page officielle de l'éditeur/projet, lue ou résumée par l'outil de recherche).
- [S] = source secondaire (presse, blog, agrégateur, page marketing, chiffre auto-déclaré par un acteur).
- [V] = inférence ou hypothèse de l'auteur, NON vérifiée par une source : à tester avant de l'affirmer.
"Non trouvé" = la recherche n'a rien donné. Limite : l'outil de recherche renvoie des synthèses, pas toujours le texte brut ; plusieurs pages officielles n'étaient pas datées.

---

## 1. Cartographie des flux de signature mobile et points d'interposition

Deux flux dominants (comme dans la consigne) :
(a) dApp dans le navigateur intégré du portefeuille : la page JS parle à un fournisseur injecté (équivalent de window.ethereum) géré par l'application.
(b) dApp dans un navigateur ordinaire (Safari/Chrome) ou une app : connexion par WalletConnect/Reown, la requête voyage via un relais jusqu'à l'application du portefeuille, qui affiche l'écran de signature.

Dans les deux cas, l'écran de confirmation est dans l'application du portefeuille, un processus que nous ne contrôlons pas. C'est le fait structurant : sur mobile, il n'y a pas d'équivalent du "script de contenu qui se glisse entre la page et le portefeuille" de l'extension de bureau, sauf dans le cas (a)/(Safari) limité décrit plus bas.

### 1.1 Navigateur intégré du portefeuille
- Les navigateurs de dApps intégrés n'acceptent pas d'extensions. [V] (aucune source trouvée affirmant le contraire ; non trouvé pour MetaMask/Trust/Phantom).
- Seul le fournisseur du portefeuille peut y interposer une couche : c'est le cas de Blockaid (alertes) dans MetaMask Mobile et Coinbase Wallet (voir section 3).

### 1.2 WalletConnect v2 / Reown : relais, sessions, requêtes
- Le relais transporte des messages chiffrés de bout en bout ; la clé symétrique est dans l'URI de couplage (topic + clé + protocole + expiration, ~5 min). [S] (synthèses non officielles, pages marketing ; le principe est largement connu mais je n'ai pas pu lire la spécification elle-même).
  - Conséquence : un intergiciel "au niveau du relais" est impossible sans la clé, donc impossible pour un tiers. [V]
  - Quiconque voit l'URI (lien profond intercepté par une autre app, clipboard) peut déchiffrer la session. [V] (inférence propre de l'agent de recherche, signalée comme telle dans la source consultée).
- Où un intergiciel est possible : (i) côté dApp, en enveloppant le SDK AppKit/SignClient (le développeur de la dApp doit le vouloir, ce n'est pas notre utilisateur final) ; (ii) côté portefeuille, en tant que module du SDK WalletKit (le portefeuille doit l'intégrer) : le portefeuille reçoit la requête en clair (méthode + paramètres + verifyContext) avant de l'afficher. [V] pour la forme exacte des données ; la page Reown consultée sur ce point (wallet-usage) a renvoyé 404.
- Liens profonds : la doc WalletConnect recommande les deep links plutôt que les universal links (ceux-ci peuvent rediriger vers un navigateur) ; le retour automatique vers un dApp navigateur n'est pas possible depuis iOS 17. [S] (synthèse d'une page docs.walletconnect.network). "Link Mode" transporte les requêtes via Universal Links sans WebSocket au relais. [S]
- Autre standard : EIP-7946 "UWULink" (dApp demande une action à un portefeuille par lien universel). [S] (titre repéré seulement, contenu non lu).

### 1.3 WalletConnect Verify API (vérification de domaine)
[P] (docs.reown.com/appkit/domain-verification, lue en entier) :
- Fonctionne seulement si la dApp utilise AppKit et le portefeuille WalletKit.
- États : VALID (Domain Match), UNKNOWN (Cannot Verify), INVALID (Domain Mismatch), isScam (Security Risk, signalé par Hexagate, ChainPatrol ou Hypernative).
- Limites officielles : "pas à toute épreuve" ; les apps React Native et Swift affichent toujours "Cannot Verify" ; un seul domaine vérifiable ; la validation d'origine suppose un contexte navigateur ; MetaMask et Trust Wallet utilisent leurs propres méthodes ("External App") et la page signale un problème connu côté MetaMask Mobile en août 2026.
- Utilité pour Sentinelle : l'origine de la requête est une donnée que le portefeuille possède (verifyContext) mais qu'un outil extérieur ne voit pas. C'est un signal à consommer côté portefeuille/SDK, pas un point d'interposition.

### 1.4 Presse-papiers et clippers
- Les clippers (logiciels malveillants qui remplacent une adresse copiée) sont réels : alerte Binance du 13 sept. 2024 ; premier cas Android sur Google Play identifié par ESET en 2019 (se faisait passer pour MetaMask). [S] (The Hacker News, Threatpost, Immunefi).
- Android 10 : lecture du presse-papiers interdite en arrière-plan sauf clavier par défaut ; Android 12 : message à l'écran à chaque lecture ; drapeau EXTRA_IS_SENSITIVE. Le message est une aide à la détection, pas un blocage. [S]
- iOS : notification d'accès depuis iOS 14 [S] ; invite de collage iOS 16 : non vérifiée dans cette recherche [V].
- Contre-mesures possibles pour nous : (i) vérifier l'adresse collée contre un historique/ liste de confiance dans l'appli compagnon ; (ii) afficher l'adresse complète en groupes ; (iii) marquer nos propres copies comme sensibles. Un clavier tiers verrait le texte tapé : à éviter (surface de risque et refus de confiance des utilisateurs) [V].
- Les clippers concernent surtout les envois d'adresse ; moins la signature de messages/permissions, qui est notre cœur de cible [V].

### 1.5 Service d'accessibilité Android (superposition)
- Google Play restreint l'API d'accessibilité aux outils destinés aux personnes handicapées, avec déclaration dans la Play Console ; usage d'automatisation générale interdit. [S] (le texte de la politique Google n'a pas pu être récupéré). Un outil de sécurité qui lit l'écran d'autres apps via ce service sera très probablement refusé ou retiré. [V]
- Android 13 : "paramètres restreints" pour les applis installées hors Play Store (accessibilité, administrateur d'appareil) ; contournement rapporté par ThreatFabric via l'installation par session. [S]
- Android 17 bêta : activation de l'accessibilité bloquée si le Programme de protection avancée est actif (un article heise) ; stade bêta. [S]
- Une couche qui se superpose à l'écran de signature d'une autre app ressemble techniquement à un malware bancaire ("overlay attack") ; risque de rejet, de défiance, et notre propre composant devient une cible. [V]
- Verdict : voie à éviter pour tout ce qui doit passer un magasin d'applications.

### 1.6 VPN / proxy local
- Un VpnService local voit les paquets mais les applis ciblant Android 7+ (API 24+) ne font pas confiance aux autorités de certification installées par l'utilisateur ; l'épinglage de certificat bloque aussi. [S] (Hurricane Labs, OWASP MASTG, NCC Group).
- Et le trafic WalletConnect est chiffré de bout en bout au-dessus du TLS. [S] Donc même avec un VPN qui déchiffre le TLS, le contenu de la requête resterait chiffré. [V]
- Verdict : non viable pour lire une requête de signature ; au mieux, filtrage de domaines (DNS) pour bloquer des sites de hameçonnage.

### 1.7 Extensions de navigateur mobile
- Firefox pour Android : extensions ouvertes depuis fin 2023 ; il faut que l'éditeur déclare une compatibilité Android (centaines d'extensions) ; stable. [S] (androidcentral, ghacks, clubic ; 2023).
- Chrome pour Android : pas d'extensions sur téléphone ; seul un build expérimental "Desktop Android" (Chromebook/PC) les accepte ; aucun lancement grand public annoncé trouvé. [S]
- Safari iOS : accepte des extensions web ; je n'ai trouvé aucun produit de sécurité crypto publié sur Safari iOS. Pocket Universe a eu une bêta iOS via TestFlight (iOS 15+, Coinbase Wallet non pris en charge) ; aucune fiche App Store officielle trouvée. [S] Statut actuel non trouvé.
- Portée : une extension Safari/Firefox ne voit que les dApps ouvertes dans ce navigateur et qui utilisent le fournisseur injecté. Elle ne voit rien dans le navigateur intégré d'un portefeuille et, avec WalletConnect, la requête ne passe pas par la page (sauf à crocheter le SDK AppKit de la page). [V]

### 1.8 SDK intégré dans le portefeuille (B2B2C)
- C'est la voie utilisée par les produits existants : Blockaid (MetaMask, Coinbase Wallet, OpenSea, Zerion, Rainbow cités), Hypernative (pitch "retail wallets", API ; intégration Safe{Wallet} en nov. 2025), Blowfish (racheté par Phantom), Portal (SDK qui expose Hypernative et Blockaid en Flutter/React Native). [S] pour la plupart ; la page Hypernative sur Safe est une annonce de l'éditeur.
- Ce que le SDK voit : tout (payload brut, typed data, origine, simulation) car il tourne dans le processus du portefeuille. Possibilité de RETENIR : oui, avec écran de blocage (Blowfish recommande de proposer un contournement à cause des faux positifs). [P] (docs.blowfish.xyz, résumé).
- Frein : il faut convaincre chaque portefeuille ; cycles de plusieurs mois ; un concurrent déjà installé (Blockaid) ; la défense (Blockaid) est déjà activée par défaut dans MetaMask. [S]

### 1.9 Snaps MetaMask sur mobile
- FAQ de support MetaMask : "Snaps are only available in the MetaMask browser extension v11.0 and up." Page non datée. [P] (lue directement).
- Discussion GitHub de mai 2023 : "no timeline" pour les Snaps sur mobile ; but de parité d'API. [P/S]
- Dépôt metamask-mobile (mise à jour récente, versions 8.10 à 8.13, sept. 2026) : des Snaps natifs (Stellar ajouté en 8.10.0 ; solana 7.0.0, tron 4.0.0, bitcoin 3.1.0 dans une demande de fusion) sont embarqués côté mobile. Aucune mention de Snaps tiers, de transaction insights ou de liste d'autorisation. [P] (page GitHub des versions).
- Conclusion : les Snaps existent dans le code mobile pour les chaînes non-EVM de MetaMask, mais je n'ai trouvé aucune preuve qu'un développeur tiers puisse y publier des "transaction insights" pour les utilisateurs de MetaMask Mobile. À TRAITER COMME NON DISPONIBLE tant qu'on n'a pas testé sur un appareil. [V]
- Sur extension, l'API "transaction insights" (onTransaction) existe et peut afficher une alerte de gravité "critical" qui bloque derrière un modal. [P]. Donc un Snap Sentinelle sur l'extension MetaMask est une piste bureau, pas mobile.

### 1.10 Comptes intelligents (ERC-4337 / ERC-7579)
- ERC-7579 : modules de type validateur, exécuteur, hook, fallback ; interopérabilité entre implémentations. Rhinestone fournit ModuleKit et un registre de modules audités ; adaptateur Safe7579 (28 constats d'audit sur une version antérieure). [S]
- Un module "hook" ou "validator" fait de la politique indépendante de l'application : il s'applique quelle que soit l'appli (mobile ou bureau) qui produit la signature. [V]
- Limites : l'utilisateur doit utiliser un compte intelligent (minorité de particuliers [V]) ; un module on-chain ne voit que l'appel final, pas l'intention déclarée en langage naturel ni l'origine web ; il faut du gaz et un audit [V]. Safe + Hypernative "Guardian" est un exemple concret de politique pré-exécution. [S]
- Possibilité de RETENIR : oui, réellement (revert on-chain) ; c'est la seule voie "dure" indépendante de l'application. [V]

### 1.11 API de simulation des portefeuilles
- Offres de simulation : Blockaid, Tenderly, Hypernative, Blowfish, Rabby (moteur propre), Dynamic (Blockaid). [S]
- Une API de simulation appelée par notre appli compagnon (l'utilisateur colle le payload) est la voie la plus simple de démontrer (voir 5).

---

## 2. Synthèse par point d'interception

Colonnes : faisabilité technique / ce que l'outil voit / RETENIR la requête / distribution / démo en 36 h / risques.

| Point | Faisabilité | Voit | Retenir | Distribution | Démo 36 h | Risques |
|---|---|---|---|---|---|---|
| SDK dans le portefeuille (MetaMask/Coinbase/Rabby, etc.) | Élevée techniquement, mais dépend d'un partenaire | Tout : payload, typed data, origine, simulation [V] | Oui | Partenariat B2B | Non pour un vrai partenaire ; oui comme maquette d'un module "WalletKit" avec un faux portefeuille [V] | Cycle commercial long ; concurrence Blockaid/Hypernative |
| Module WalletKit/Reown (côté portefeuille) | Moyenne | Méthode + paramètres + verifyContext [V] | Oui, si le portefeuille le choisit | Même que ci-dessus | Maquette avec dépôt d'exemple Reown (non téléchargé ici) | Dépendance au SDK Reown |
| Intergiciel côté dApp (AppKit) | Faible : l'attaquant est la dApp | Demande vue par la dApp | Non (l'adversaire contrôle le site) | Pas pertinent | Non | Ne protège pas contre un site malveillant [V] |
| Relais WalletConnect | Impossible (chiffré) [S] | Rien | Non | - | Non | - |
| Navigateur intégré d'un portefeuille | Impossible sans le portefeuille | - | - | - | Non | - |
| Extension Safari iOS / Firefox Android | Moyenne : extension existante portable (WebExtensions) | Requêtes du fournisseur injecté dans les pages de CE navigateur ; pas WalletConnect [V] | Oui côté page (si le fournisseur est enveloppé) | App Store (Safari, via une appli hôte) ; Mozilla Add-ons (Firefox Android) | Possible : charger l'extension actuelle dans Firefox Android (pas de magasin à franchir) [V] | Couverture faible (peu d'utilisateurs de dApps dans Safari/Firefox mobile [V]) |
| Appli compagnon (collage manuel) | Élevée | Ce que l'utilisateur colle (calldata, typed data, lien WC non, texte) | Non (l'utilisateur doit s'arrêter lui-même) | App Store/Play ou PWA | Oui, c'est l'option la plus faisable [V] | Friction ; risque de collage d'une mauvaise donnée ; ne protège pas les utilisateurs pressés |
| Service d'accessibilité Android | Techniquement possible | Texte affiché à l'écran | Superposition possible | Refus probable sur Play ; installation hors magasin soumise aux paramètres restreints | Non conseillé | Ressemble à un malware ; surface d'attaque ; Android 17 bêta durcit |
| VPN/proxy local | Faible | Domaines (DNS) ; pas le contenu | Bloquer un domaine seulement | Play avec déclaration VpnService | Filtrage DNS en démo possible mais hors sujet | Confiance, TLS, pinning |
| Presse-papiers/clavier | Moyenne pour adresse | Texte copié | Alerte seulement | - | Détection de différence d'adresse en démo [V] | Clavier tiers = sensible |
| Snap MetaMask (extension) | Élevée sur extension | Transaction + origine (API officielle) [P] | Alerte "critical" avec modal [P] | Annuaire des Snaps, liste d'autorisation | Possible sur extension, pas mobile | Mobile : non disponible (non trouvé) |
| Module ERC-7579 | Moyenne | Appel final on-chain | Oui, dur (revert) | Registre Rhinestone, audit | Contrat d'exemple sur testnet en 36 h : faisable mais serré [V] | Audit, gaz, comptes intelligents minoritaires |
| API de simulation (via l'appli compagnon) | Élevée | Selon ce qu'on envoie | Non | - | Oui | Tarification, limites de débit |

---

## 3. Comment font les produits existants sur mobile

- MetaMask Mobile : alertes de sécurité Blockaid, activées par défaut sur extension et mobile ; réseaux : Ethereum, BNB, Polygon, Arbitrum, Optimism, Avalanche, Linea, Base, opBNB, zkSync, Scroll, Berachain, etc. L'alerte est consultative : l'utilisateur peut confirmer malgré tout. Une page de support indique que, selon la version, les transactions et demandes de signature sont envoyées à un serveur MetaMask (EVM) ou Blockaid (non-EVM) ; une ancienne version disait simulation locale. [P/S]
- Coinbase Wallet : intégration Blockaid fin 2023 ; annonce de mars 2024 : "plus de 75 millions de dollars" économisés en cinq mois, près de 800 000 connexions bloquées vers des dApps malveillantes, 114 millions de transactions et connexions analysées, simulation en général sous 300 ms. [S] (The Block, Blockaid ; chiffres auto-déclarés, non vérifiés indépendamment).
- Phantom : a racheté Blowfish ; liste de blocage Phantom en cours d'abandon au profit d'avertissements de domaine et de transaction ; avertissement si la simulation échoue. [S/P (docs.phantom.com)]. Comment cela s'affiche dans le navigateur intégré mobile : non trouvé.
- Trust Wallet : "Security Scanner" intégré (App Store, Play Store) ; données de partenaires dont Binance Risk et Hashdit ; au lancement il évalue le risque d'une adresse d'envoi, pas une simulation complète. Blockaid/Hypernative chez Trust : non trouvé. [S/P]
- Rabby : moteur de pré-vérification et simulation ; client mobile (bêta selon AlternativeTo) ; l'App Store a contenu une fausse application en 2024 (MacMagazine). État actuel non vérifié. [S]
- Pocket Universe : extension de bureau ; bêta iOS TestFlight (Safari), aucune fiche App Store trouvée ; racheté par Kerberus (août 2025 selon une page d'agrégateur, non vérifié ailleurs). [S]
- Wallet Guard : extension de bureau, racheté par Consensys (juillet 2024 selon CB Insights) ; pas d'application mobile (le "Wallet Guard" de l'App Store est un autre produit). [S]
- Kerberus Sentinel3 : extension de bureau et API ; pas d'application mobile trouvée ; couverture jusqu'à 30 000 dollars ou 100 ETH. [S]
- Tendance observée : sur mobile, la protection passe par le portefeuille (B2B2C), pas par des produits tiers grand public. Les acteurs tiers de bureau (Wallet Guard, Pocket Universe, Kerberus) se sont fait absorber par des portefeuilles ou fournisseurs. [S, d'après des agrégateurs ; à recouper]

---

## 4. Parts d'usage

- WalletConnect / Reown : environ 20 millions de connexions par mois pour plus de 5 millions d'utilisateurs mensuels (annonce de série B, janvier 2025). Janvier 2025 : plus de 4,6 millions de portefeuilles uniques mensuels (+77 % sur un an). Août 2025 (Nansen, reprenant WalletConnect) : environ 352,8 millions de connexions cumulées, environ 51,7 millions de portefeuilles uniques, 57 980 applis intégrées ; moyenne >15 millions de connexions par mois, pic de 23,4 millions en décembre 2024. [S] (chiffres auto-déclarés ; définitions variables entre communiqués).
- MetaMask : plus de 100 millions d'utilisateurs début 2026 (déclaré) ; utilisateurs actifs mensuels comptés ensemble pour extension et mobile ; ventilation mobile/extension : non trouvée. Une ancienne indication : extension plus de 21 millions d'actifs mensuels en novembre 2021 (Bloomberg). [S]
- Part mobile vs bureau des signatures de particuliers : non trouvée de source crédible. Des sites faibles donnent "12 % d'usage pour les extensions" (coinlaw.io) ou "50 M mobile contre 10 M extension" (BloFin), sans méthode. À NE PAS CITER devant un jury sauf comme "ordre de grandeur non vérifié". [S, faible]
- Part WalletConnect vs navigateur intégré : non trouvée.
- Piste pour obtenir un vrai chiffre : tableaux Dune des applications de portefeuille ; rapports Chainalysis (non consultés).

---

## 5. PROPOSITION : trois architectures mobiles réalistes

Classement par faisabilité en 36 h, puis par portée réelle.

### Option A - Application compagnon de vérification manuelle (faisabilité 36 h : élevée ; portée : faible à moyenne)
- Principe : l'utilisateur colle (ou partage depuis l'appli du portefeuille via la feuille de partage) le payload/typed data/calldata ou l'URL ; Sentinelle décode, simule via une API, compare à l'intention déclarée ("je veux échanger X contre Y") et rend un verdict.
- Voit : exactement ce qui est collé ; pas l'origine réelle sauf si l'utilisateur la donne. RETENIR : non, avertissement avant que l'utilisateur ne revienne signer.
- Faisable en 36 h : réutiliser le moteur d'analyse de l'extension dans une application web adaptative (PWA) ou une appli simple ; pas de dépendance à un magasin, donc pas de risque de refus. [V]
- Risques : friction ; l'utilisateur ne sait pas toujours copier le bon objet ; un faux verdict "sûr" est dangereux ; notre composant doit être minimal en permissions (aucune).

### Option B - SDK/module pour portefeuilles (faisabilité 36 h : moyenne comme maquette, nulle comme déploiement ; portée : la plus grande à terme)
- Principe : bibliothèque embarquée (WalletKit/Reown ou fournisseur intégré) qui reçoit la requête avant l'écran de signature, la compare à l'intention déclarée, et peut RETENIR (écran de blocage avec contournement, comme recommande Blowfish).
- Voit : tout. C'est la voie des produits existants (Blockaid, Hypernative).
- En 36 h : démo avec un portefeuille d'exemple open source (par ex. exemple Reown, à examiner sans l'installer pour l'instant) montrant une requête WalletConnect interceptée et jugée. Marqué [V] : non essayé.
- Risques : concurrence, partenariat nécessaire, intégration dans la surface de signature = notre composant est de confiance critique.

### Option C - Couche de politique par compte intelligent (faisabilité 36 h : faible à moyenne ; portée : étroite mais "dure")
- Principe : module ERC-7579 (validateur ou hook) qui refuse on-chain les appels contraires à une politique choisie (liste de destinataires, plafond, interdiction d'approbations illimitées) quel que soit le téléphone ou l'application.
- Voit : l'appel final seulement ; pas l'intention en langage naturel ni l'origine web. RETENIR : oui, par revert.
- En 36 h : contrat d'exemple sur un testnet avec 2-3 règles ; tests unitaires. Pas d'audit possible. [V]
- Risques : comptes intelligents minoritaires ; sécurité de contrat ; gaz.

Hors classement : extension Safari iOS/Firefox Android = option de repli à faible portée (voir tableau) ; Firefox Android permet de charger l'extension existante sans magasin [V, à tester]. Accessibilité, VPN, clavier : à écarter.

Classement faisabilité 36 h : A > B (maquette) > C. Classement portée réelle : B > C ≈ A (A dépend de la discipline de l'utilisateur ; C est limité aux comptes intelligents).

### Ce qu'on peut dire honnêtement au jury sur le mobile
1. Sentinelle est aujourd'hui une extension de bureau ; sur mobile, la signature se fait dans l'appli du portefeuille, que nous ne contrôlons pas.
2. Sur mobile, le bon point d'ancrage est le portefeuille lui-même (SDK/partenariat) : c'est ce qu'ont fait MetaMask et Coinbase avec Blockaid, et nous le présentons comme feuille de route B2B, pas comme livré.
3. Ce que nous démontrons : le moteur de vérification (intention contre effet) sur un payload fourni, via une application compagnon ; pas une interception transparente de bout en bout.
4. Nous écartons volontairement l'accessibilité Android, les VPN et les claviers, parce que ce sont les techniques des logiciels malveillants et qu'ils sont restreints par Google.
5. Nous ne donnons pas de part de marché mobile/bureau précise : aucune source fiable trouvée. Nous citons seulement les ordres de grandeur WalletConnect auto-déclarés (plus de 4,6 millions de portefeuilles uniques mensuels en janvier 2025).
6. Les Snaps MetaMask ne sont pas, à notre connaissance, ouverts aux tiers sur MetaMask Mobile ; nous ne promettons pas cette voie.

---

## 6. Points non trouvés ou à vérifier avant le jury
- Disponibilité de Snaps tiers (transaction insights) sur MetaMask Mobile aujourd'hui : non trouvée.
- Spécification officielle WalletConnect (chiffrement, contenu des requêtes) : page wallet-usage en 404, seules des synthèses lues.
- Statut actuel de Pocket Universe iOS, de Rabby mobile sur l'App Store : non vérifié.
- Texte de la politique Google Play sur l'accessibilité : non récupéré.
- Part mobile/bureau et WalletConnect/navigateur intégré : non trouvée de source fiable.
- Ce que montre Phantom/Trust dans leur navigateur intégré mobile : non trouvé.

---

## Résumé en 12 lignes
1. Sur mobile, la signature s'affiche dans l'appli du portefeuille : aucun outil tiers ne peut s'y glisser comme une extension de bureau.
2. WalletConnect : relais chiffré de bout en bout, donc intergiciel impossible au relais ; possible seulement dans le SDK du portefeuille (WalletKit) ou de la dApp.
3. La Verify API (Reown) donne un état de domaine (VALID/UNKNOWN/INVALID/scam) mais ne marche qu'avec AppKit+WalletKit et pas pour les applis natives.
4. Snaps MetaMask : documentés extension seulement ; le code mobile embarque des Snaps non-EVM mais pas de preuve de Snaps tiers/insights sur mobile.
5. Accessibilité Android, VPN local, clavier : restreints par Google/Android, techniques de malware, TLS et WalletConnect restent opaques ; à écarter.
6. Extensions mobiles : Firefox Android oui, Safari iOS oui, Chrome Android non ; couverture faible (ni navigateur intégré, ni WalletConnect).
7. Produits existants : protection via le portefeuille (Blockaid dans MetaMask/Coinbase, Blowfish chez Phantom, scanner Trust) ; les extensions tierces (Wallet Guard, Pocket Universe) sont de bureau et rachetées.
8. Chiffres : Coinbase+Blockaid "75 M$ économisés" (auto-déclaré) ; WalletConnect >4,6 M portefeuilles uniques/mois (janv. 2025).
9. Part mobile vs bureau et WalletConnect vs navigateur intégré : non trouvées de source fiable.
10. Trois architectures : A appli compagnon manuelle (36 h oui) ; B SDK portefeuille (maquette 36 h, portée max) ; C module ERC-7579 (dur mais étroit).
11. Au jury : dire que le mobile passe par les portefeuilles, démontrer le moteur sur payload collé, ne pas promettre d'interception transparente.
12. Tout [V] ci-dessus est à tester sur appareil avant d'être affirmé.

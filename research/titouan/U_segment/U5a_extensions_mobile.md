# U5a - Extensions de navigateur sur mobile en 2026 : Sentinelle peut-elle exister sur téléphone ?

Date de la recherche : 11 octobre 2026. Auteur : agent de recherche (sans téléchargement ni installation).

Étiquettes : [P] documentation officielle ou source primaire lue (y compris les API publiques de addons.mozilla.org et les données MDN browser-compat-data, lues directement) ; [S] presse ; [V] vendeur ; "non trouvé" quand rien de fiable. Les estimations personnelles sont signalées "ESTIMATION" et ne sont pas des faits sourcés.

Limites honnêtes : certaines pages officielles (Apple Developer, Android Authority, MetaMask support) ont été renvoyées vides ou en 403/404 ; dans ce cas je le dis. Aucune donnée sourcée n'existe sur la part des utilisateurs crypto qui utilisent une extension sur un navigateur mobile ordinaire (voir section 5).

---

## 1. État des navigateurs mobiles et des extensions (octobre 2026)

### 1.1 Tableau synthétique

| Navigateur | Extensions ? | Statut / source |
|---|---|---|
| Chrome Android (stable, téléphone) | NON | [S] Plusieurs guides 2026 : toujours pas d'extensions au 18 août 2026 ; le bouton du Chrome Web Store sur mobile dit "Add to Desktop" (installe sur le Chrome de bureau). [S] Android Authority / Android Central : un build expérimental "desktop" de Chrome pour Android lance des extensions, destiné aux PC Android, à sideloader, nommé "Chromium" ; Google n'a pas prévu de l'amener aux téléphones (formulation rapportée par la presse, pas lue sur une source Google). Aucune annonce officielle Google/Chromium trouvée. La seule source "officielle" que j'ai ouverte (groupe chromium-extensions) date de 2012 : inutilisable. |
| Chrome iOS | NON | [S] Apple impose WebKit à tous les navigateurs (sauf UE depuis iOS 17.4, sous entitlement, non utilisé par Chrome à ma connaissance : aucune source trouvée affirmant une version Blink de Chrome avec extensions). [P] Apple guideline 2.5.6 : les apps qui naviguent sur le web doivent utiliser WebKit. |
| Firefox Android | OUI, ouvert | [P] Mozilla, 14 décembre 2023 : toutes les extensions marquées compatibles Android sur AMO sont installables ; 450+ extensions au lancement (blog Mozilla lu). Le développeur doit cocher la compatibilité Android. |
| Edge Android | PARTIEL | [S] Mars 2025 : boutique web "bêta" avec 22 extensions (WindowsLatest, lu) ; MetaMask et aucun portefeuille crypto dans la liste. [S] Installation d'une extension quelconque par ID via flag + options développeur (Canary, puis stable selon un article ; non confirmé en 2026). Pas de source 2026 trouvée. |
| Brave Android | NON | [S] PiunikaWeb 29 juillet 2026 (lu) : pas d'extensions ; le compte officiel répond "TBD" ; avant : "no work currently planned". Travail de développement rapporté (non confirmé par Brave). |
| Samsung Internet | TRÈS LIMITÉ | [P] Guide développeur Samsung (lu) : add-ons distribués par le Galaxy Store, "closed beta", "only permitted developers". Pas de MetaMask/portefeuille connu. |
| Opera Android | NON trouvé | Seuls des articles de 2010-2012 et des demandes de forum. "Non trouvé" pour 2025-2026. |
| Kiwi Browser | ARRÊTÉ | [S] Archivé, plus de mises à jour après janvier 2025, retiré du Play Store ; son code d'extensions a été intégré à Edge Canary (Reclaim The Net, lu). |
| Yandex Browser Android | OUI | [P] Documentation d'aide Yandex (via recherche) : extensions du catalogue Yandex, Chrome Web Store ou Opera. Navigateur russe : confiance et conformité à évaluer, pas une cible réaliste pour un public occidental. |
| Vivaldi Android | OUI, nouveau | [S] Vivaldi 8.2 (10 septembre 2026, AlternativeTo + PiunikaWeb + Thurrott, lus) : installation depuis le Chrome Web Store ("Add to Vivaldi"), activé sur tous les sites par défaut ; "toutes les extensions de bureau ne marchent pas sur mobile". Pas de précision sur Manifest V3 (un utilisateur de forum dit MV3 seulement : non vérifié). Vivaldi iOS : pas d'extensions. |
| Quetta (Chromium Android) | OUI (revendiqué) | [V] Billet du blog de Quetta lui-même (lu) : "supports many Chromium-style extensions". Source partiale. |
| DuckDuckGo (Android/iOS) | NON trouvé | Aucune documentation d'extensions sur le navigateur mobile trouvée. Considérer NON. |
| Safari iOS / iPadOS | OUI (Safari Web Extensions) | Voir 1.3. |
| Safari macOS | OUI | Hors sujet mobile. |
| Orion (Kagi) iOS | PRÉLIMINAIRE | [P] Doc Kagi (lue) : support bêta d'extensions Chrome/Firefox sur iOS, "small number is better than zero", limité par les API autorisées par Apple ; les extensions Safari ne tournent PAS dans Orion (API propriétaires fermées). |

### 1.2 Firefox pour Android (le seul vrai écosystème ouvert, hors nouveautés)

- [P] Ouverture à tous les modules compatibles depuis le 14 décembre 2023 (blog Mozilla lu).
- [P] Documentation extensionworkshop "Differences between desktop and Android" (lue) : non pris en charge sur Android : menus contextuels, commands, omnibox, sidebar, bookmarks/history/sessions/windows, devtools, `runtime.connectNative`/`sendNativeMessage`, managed storage. Recommandation : event pages, car Android peut tuer le processus de l'extension.
- [P] Doc "Developing extensions for Firefox for Android" (lue) : Firefox Android n'a pas la parité complète ; il est "recommandé d'utiliser Manifest V2" ; **les service workers d'arrière-plan ne sont pas pris en charge** (Firefox n'a que `background.scripts`/event pages). Donc un manifeste MV3 Chrome avec `background.service_worker` doit être adapté.
- [P] MDN browser-compat-data (lu) : `content_scripts.world` ("MAIN") : Firefox 128, Firefox Android = idem ; `scripting.registerContentScripts` 102 ; `ExecutionWorld.MAIN` 128 ; manifest_version 3 : Firefox/Android 109 ; `run_at` document_start : Firefox 48 (Android idem). Note MDN : pas d'injection dans les iframes vides à document_start.
- [P] Test : `web-ext run -t firefox-android` avec adb et un téléphone Android en mode débogage USB (doc lue). Un bogue connu : popup non inspectable dans Fenix.
- [P] Publication AMO : compte gratuit semble implicite (aucun frais mentionné), délai de revue "non trouvé" dans la doc. Choix de la compatibilité Android au téléversement.

### 1.3 Safari iOS (Safari Web Extensions)

- Distribution [P, lu : guidelines Apple 4.4, Apple Developer Program] : l'extension est empaquetée dans une app iOS/macOS, soumise via App Store Connect, revue par Apple. Programme développeur Apple : 99 USD/an (page officielle lue) ; les comptes gratuits ne permettent que des tests sur appareil limités (3 appareils, profils de 7 jours).
- Conversion [P via recherche de la doc Apple] : l'outil s'appelle désormais `xcrun safari-web-extension-packager` (ancien `safari-web-extension-converter`) ; génère un projet Xcode iOS + macOS. **Nécessite un Mac avec Xcode** (Titouan est sous Windows 11 : obstacle majeur, voir section 4). Fait connu, non retrouvé dans une page lue ici.
- Règles de revue [P] : 4.4 (extension accompagnée d'une app avec une vraie fonction, pas de pub/IAP), 4.4.2 (ne pas réclamer plus de sites que nécessaire, pas de contenu trompeur), 3.1.5 (portefeuilles crypto : développeur enrôlé en tant qu'organisation ; une extension de sécurité qui ne stocke pas de monnaie n'est a priori pas un portefeuille mais le risque de classement existe : non vérifié).
- APIs [P, MDN BCD lu] : manifest v3 : Safari/iOS 15.4 ; `host_permissions` 15.4 ; `background.scripts` iOS 15 ; `service_worker` Safari 15.4 (mirror iOS) ; `registerContentScripts` 16.4 ; `scripting.executeScript` `world: MAIN` 15.4 ; **`content_scripts[].world` dans le manifeste : Safari 18 / iOS 18**. Donc l'injection en monde MAIN à `document_start` par le manifeste exige iOS 18 minimum ; sur iOS 15.4-17 il faut passer par `registerContentScripts` (16.4+). Note MDN : sur iOS, les scripts de contenu ne sont pas appliqués tant que l'utilisateur n'a pas accordé la permission via l'alerte d'accès (donc "Autoriser sur ce site" à chaque site, ou "Toujours autoriser").
- [P] Forum Apple (fil 728849, avril 2023, lu) : un ingénieur Apple confirme MAIN pour `registerContentScripts` en Safari 16.4 ; le fil ne tranche pas le manifeste ni un écart iOS.
- Page officielle Apple "Safari web extensions" renvoyée vide (non lue) ; la page "Converting a web extension" n'a pas pu être lue en détail (contenu reçu = titre seulement). Les informations de ce paragraphe viennent donc de MDN BCD, des guidelines et de la recherche.
- Limites par rapport à Chrome (synthèse) : sous-ensemble d'APIs WebExtensions ; arrière-plan non persistant obligatoire sur iOS (note WWDC21 via notes tierces) ; activation manuelle dans Réglages > Safari > Extensions ; permission par site ; une seule moteur (WebKit) ; pas de DevTools de l'extension sur appareil sans Mac. Distribution uniquement par App Store (hors UE/DMA, hors sujet).
- Safari seulement : les extensions Safari ne fonctionnent pas dans Chrome iOS, Firefox iOS, Orion, etc. [P Kagi, lu].

---

## 2. Injection avant la page, enveloppement de window.ethereum, et portefeuilles injectés

### 2.1 Capacité technique d'injecter avant les autres scripts

| Navigateur | Injection monde MAIN à document_start | Remarque |
|---|---|---|
| Firefox Android (128+) | OUI [P] | `world: MAIN` dans le manifeste, `run_at: document_start`. Pas dans les iframes vides à document_start. |
| Safari iOS 18+ | OUI [P, BCD] | Manifeste `world: MAIN`. iOS 16.4-17 : `registerContentScripts` seulement. Demande de permission par site. |
| Safari iOS < 15.4 | NON | Hors cible. |
| Vivaldi / Edge / Yandex / Quetta Android (Chromium) | OUI en principe (Chromium 111+) | `world: MAIN` Chrome 111 [P BCD]. Mais les builds mobiles sont jeunes ou expérimentaux : à tester, non vérifié. |
| Chrome Android, Chrome iOS, Brave Android, DuckDuckGo | NON | Pas d'extensions. |

Conclusion partielle : la mécanique de Sentinelle (script MAIN à document_start qui enveloppe `window.ethereum` et écoute EIP-6963) est techniquement possible sur Firefox Android et Safari iOS 18, et probablement sur les Chromium Android récents.

### 2.2 Mais y a-t-il un fournisseur à envelopper ?

C'est le point bloquant. Un wrapper n'a de sens que si un portefeuille injecte `window.ethereum` ou annonce via EIP-6963 dans la même page.

- MetaMask : [P] AMO API (lue) : version 13.49.0.0, compatibilité `firefox` min 128, **aucune entrée `android`** ; 319 878 utilisateurs quotidiens (page AMO lue). Donc l'extension MetaMask n'est pas proposée sur Firefox Android. MetaMask lui-même dit (via recherche, page support non lue car vide) que MetaMask Extension n'est pas disponible dans Safari ; sur mobile, c'est l'application séparée avec son navigateur intégré [S/V].
- Rabby : [P] la page AMO Firefox "rabby" a renvoyé 404/401 à ma lecture ; la recherche AMO Android pour "rabby" ne renvoie que des homonymes ("Rab💎", 16 utilisateurs, auteur anonyme : à traiter comme un faux/inconnu). Aucune preuve de Rabby sur Firefox Android. Rabby Mobile existe en application (source faible, PDF d'archive non officiel) ; navigateur intégré ou WalletConnect : non trouvé.
- Pocket Universe, Revoke.cash : [P] AMO API : aucune entrée `android` (Pocket Universe : min 58.0 seulement ; Revoke.cash 0.7.4 : min 58.0 seulement ; 906 et 404 utilisateurs quotidiens).
- Catalogue Firefox Android (recherches AMO API, app=android, lues) : portefeuilles crypto trouvés : Alby (Bitcoin Lightning, 1 540 utilisateurs), Bearby Wallet (327 utilisateurs, listing incohérent), "MWA Injector" (Solana Mobile Wallet Adapter), Rainbow wallet colors (plage Android 48-68, c'est une extension de thème, pas Rainbow Wallet), TRIO (plage 48-68). **Aucun MetaMask, Rabby, Phantom, Coinbase, Rainbow officiels.** Donc sur Firefox Android, il n'y a quasiment pas de fournisseur EVM grand public à envelopper.
- Alerte : une fiche AMO "Meta Flask: (ETH, BSC, SOL)" (créée le 6 octobre 2026, 0 utilisateur, non signée par Mozilla, fichier nommé "crossposterl-1.5.2.xpi", langue par défaut fr, compat Android 142+) se présente comme une distribution "canary" de MetaMask. Elle ne correspond pas au profil d'un produit MetaMask officiel (nom de fichier incohérent, non signée). Ne pas l'installer ; signaler comme risque d'usurpation (non vérifié davantage). Une autre fiche "Approval Scanner PermitDecoder" (Android 142+, 0 utilisateur, créée en mai 2026) décode les signatures EIP-712 : concurrent potentiel de niche, aucune traction.
- Safari iOS : [S] des portefeuilles-extensions Safari existent : Dawn (portefeuille Ethereum iOS avec extension Safari, [V]), Tokenary/Big Wallet de lil.org ("connect like metamask in safari", iOS/macOS/visionOS, [P] dépôt GitHub lu ; l'App Store n'a pas pu être lu), projets expérimentaux (Safari Wallet de Balance, JankyMask, [S/P README]). Phantom : pas d'extension Safari ([S], mars 2026) ; Rainbow : Chrome, Brave, Edge, Firefox, Arc seulement ([S]) ; Coinbase : non trouvé. Ces portefeuilles Safari, pour l'essentiel, sont des produits de niche.
- Portefeuilles avec navigateur intégré : le grand public mobile passe par l'app du portefeuille. Trust Wallet a retiré son navigateur dApp d'iOS (règle 4.7 d'Apple) ; Android non affecté ([V] forum communautaire Trust Wallet, en 2020) ; Coinbase Wallet avait annoncé retirer le dApp browser d'iOS fin 2019 ([S] The Block). Ces deux informations sont anciennes ; l'état 2026 n'est pas confirmé. Dans un navigateur intégré, aucune extension tierce ne peut s'exécuter : le code de la page est lancé dans la WebView de l'application.
- WalletConnect : le portefeuille est dans une autre app ; la page ne reçoit pas `window.ethereum`. Sentinelle (qui enveloppe EIP-1193) ne voit pas ces requêtes. [V] Pocket Universe l'écrit lui-même : "doesn't work with WalletConnect".

Donc : sur mobile, la combinaison "extension de navigateur + portefeuille extension qui injecte window.ethereum" n'existe pratiquement que sur Safari iOS avec des portefeuilles de niche (Dawn, Tokenary) et, à la marge, sur Vivaldi/Edge Android si l'utilisateur y installe MetaMask depuis le Chrome Web Store (non testé, non confirmé : l'extension MetaMask mobile-Chromium n'a pas de source).

---

## 3. Produits de sécurité crypto sur mobile via extension

| Produit | Mobile via extension ? | Preuve |
|---|---|---|
| Pocket Universe | NON (iOS "en bêta", pas de Safari annoncé) | [V] Site officiel (lu) : "Not yet! We're in beta testing for iOS." Chrome et Firefox seulement ; revendique 200 000+ utilisateurs et 3 M+ transactions analysées par semaine ; incompatible WalletConnect. [S] Racheté en août 2025 par Kerberus (Cointelegraph via CB Insights/bitbank) ; Kerberus veut l'intégrer à Sentinel3. [P] AMO : 906 utilisateurs quotidiens Firefox, v0.6.7 du 13 mai 2025, pas d'Android. Page "iOS bêta" non datée : statut réel de la bêta "non trouvé". |
| Wallet Guard | NON, et FERMÉ | [P] Page officielle : "sunset as of March 31, 2025" ; racheté par Consensys en juillet 2024, fonctions migrées dans MetaMask. Avant : 100K+ portefeuilles, Chrome seulement. L'app iOS "Wallet Guard" de l'App Store est un autre produit (homonyme). |
| Kerberus (Sentinel3) | NON | [V] Site : bouton "Add to Chrome" uniquement ; 250 000+ utilisateurs revendiqués ; rien sur mobile. |
| Fire | Non trouvé | Cité comme racheté par Kerberus selon une source de profil ; pas de page mobile. |
| Scam Sniffer | NON | [S] Annuaires : Chrome seulement, 50K+ utilisateurs (non vérifié). |
| Revoke.cash | NON (extension Firefox desktop, pas d'Android) | [P] AMO API lue : pas de compat Android ; 404 utilisateurs quotidiens. Site web responsive utilisable dans un navigateur mobile (hors extension). |
| Blockaid | Pas d'extension grand public mobile ; B2B intégré dans les portefeuilles | [V] Site (lu) : End User Protection intégré à Coinbase Wallet, MetaMask, Zerion, Backpack, Core ; logos Rainbow et Ledger. [S] MetaMask Alertes de sécurité activées par défaut sur extension et mobile (Blockaid). C'est LE canal de sécurité mobile réel : à l'intérieur du portefeuille, pas dans le navigateur. |

Retour d'usage et nombre d'utilisateurs mobiles de ces extensions : non trouvé (aucun produit n'a de version mobile publique d'extension). Enseignement : les 6 acteurs crypto-sécurité identifiés (Pocket Universe, Wallet Guard, Kerberus, Fire, Scam Sniffer, Revoke.cash) ont tous commencé et restent sur extension de bureau ; le seul qui annonce du mobile (Pocket Universe) le fait en "bêta iOS" depuis une date non précisée, sans produit livré visible. La sécurité mobile passe par l'intégration chez les portefeuilles (Blockaid) et non par des extensions de navigateur.

---

## 4. Coûts, obstacles et délais de portage

### 4.1 Firefox Android
- Coût : AMO gratuit (aucun frais mentionné dans la doc de soumission lue, ni de délai de revue), compte Mozilla.
- Travail : (a) manifest compatible Firefox : `background.scripts` en event page au lieu de `service_worker` ; `browser_specific_settings.gecko` et `gecko_android` ; (b) `web-ext lint` ; (c) interface responsive (popup/options) ; (d) test sur téléphone via `web-ext run -t firefox-android` ; (e) choisir la compatibilité Android au téléversement.
- Obstacle majeur non technique : il n'y a quasiment pas de portefeuille EVM grand public sur Firefox Android (section 2.2). Sentinelle serait un wrapper sans objet à envelopper, sauf si l'utilisateur injecte un portefeuille tiers peu fiable. Le seul bénéfice serait la détection de sites/dApps qui utilisent des fournisseurs injectés par page.
- Délai réaliste : ESTIMATION 2 à 5 jours pour un build fonctionnel sur un Android de test, +revue AMO (délai non trouvé). Usage réel visé : quasi nul.

### 4.2 Safari iOS
- Coût : 99 USD/an (page officielle lue) ; un Mac avec Xcode est indispensable (Titouan est sous Windows 11) ; un iPhone de test ; revue Apple (délai non trouvé ; ESTIMATION quelques jours).
- Travail : converter/packager Xcode, application conteneur avec écran d'aide/réglages (guideline 4.4), adaptation de la communication (messagerie content script <-> background non persistant), permissions par site, UX d'avertissement sur petit écran, manifeste MAIN world iOS 18 (ou `registerContentScripts`).
- Risques de revue : 4.4.2 (accès à tous les sites avec `<all_urls>` : doit être justifié, "ne pas réclamer plus de sites que nécessaire"), 3.1.5 si perçu comme un portefeuille, politique sur les conseils financiers (non vérifié).
- Obstacle utilisateur : activer l'extension dans Réglages, accorder l'accès site par site, et avoir un portefeuille qui injecte dans Safari (Dawn, Tokenary) ; les portefeuilles majeurs ne le font pas.
- Délai réaliste : ESTIMATION 3 à 6 semaines pour une v1 prête App Store (apprentissage Xcode compris), 1 à 2 semaines pour un prototype sur simulateur/appareil si un Mac est disponible.

### 4.3 Chromium Android (Vivaldi, Edge, Yandex, Quetta)
- L'extension actuelle (MV3) pourrait marcher telle quelle ou presque ; compatibilité non vérifiée. Vivaldi 8.2 (10 septembre 2026) est la voie la plus simple : Chrome Web Store, "Add to Vivaldi". Le Chrome Web Store n'a rien à changer côté Sentinelle.
- Mais ces navigateurs sont marginaux, et sans portefeuille injecté pertinent (MetaMask depuis le Chrome Web Store ? non vérifié sur Vivaldi/Edge Android ; popup et UI desktop mal adaptés au tactile : "Not all desktop extensions work on mobile").

### 4.4 Ce qu'on peut tester en 36 h (honnêtement)
Sans Mac (le cas de Titouan) :
1. Sur un téléphone Android (si disponible) : installer Vivaldi 8.2 ou Firefox Android et charger Sentinelle (Vivaldi : via Chrome Web Store ou chargement non empaqueté si l'option existe : non vérifié ; Firefox : `web-ext run -t firefox-android` après adaptation MV3 -> event page). Vérifier trois choses : (a) le script MAIN s'exécute à document_start, (b) `window.ethereum` est vu/enveloppé quand un portefeuille est présent, (c) l'UI d'avertissement est lisible à 375 px.
2. Test réel de la question centrale : sur ce même téléphone, essayer d'installer un portefeuille EVM dans le navigateur. Sur Firefox Android, s'attendre à ne pas en trouver ; sur Vivaldi, essayer MetaMask du Chrome Web Store (résultat inconnu).
3. Mesure d'audience : combien de testeurs/amis crypto utilisent déjà une extension sur navigateur mobile ? (probablement zéro).
Avec un Mac : prototype Safari iOS sur simulateur en 1 à 2 jours (avec Dawn ou Tokenary comme portefeuille Safari de test).
Livrable réaliste à 36 h : un rapport de compatibilité (oui/non par navigateur) avec captures, et décision GO/NO-GO. Pas un produit.

---

## 5. Part des utilisateurs concernés

Aucune source primaire trouvée qui chiffre la part des utilisateurs crypto utilisant (a) un navigateur mobile ordinaire avec extension, (b) l'application d'un portefeuille avec navigateur intégré, (c) WalletConnect. "Non trouvé".

Éléments disponibles, de faible fiabilité :
- [S] MetaMask : plus de 30 millions d'utilisateurs actifs mensuels (annonce Consensys de février 2024 relayée par Blockworks/Consensys) ; le chiffre agrège extension et mobile, sans ventilation publiée. Les chiffres 2025-2026 de sites d'agrégation sont des reprises.
- [V] WalletConnect (bilan 2025) : 392 M de connexions cumulées, 55,5 M de wallets uniques connectés en 2025, 85,5K applications ; top wallets par connexions début 2025 : Trust Wallet, MetaMask, Bitget Wallet, OKX Wallet, Binance Wallet (écosystème WalletConnect). Pas de ventilation mobile/extension. Ce sont surtout des wallets mobiles, ce qui confirme que le canal mobile est WalletConnect + application.
- [S, faible] CoinLaw (agrégateur, source non citée) : extensions ~12 % de l'usage des wallets, mobile ~78 % des utilisateurs de hot wallets en 2025. Chiffres non sourcés, à ne pas citer comme faits.
- [S] Reown (rapport 2025 State of Onchain UX, cité par Benzinga) : 62 % de 1 000 utilisateurs actifs US/UK gèrent plus de deux portefeuilles mobiles. Sondage sur échantillon restreint, cité en seconde main.

ESTIMATION (non sourcée, à valider) : la part des utilisateurs crypto mobiles qui utilisent un navigateur mobile ordinaire AVEC une extension portefeuille injecté est très probablement inférieure à 1-2 % de l'ensemble des utilisateurs mobiles, car (1) Chrome/Safari/Brave n'ont pas (Chrome, Brave) ou presque pas (Safari) de portefeuilles majeurs en extension sur mobile, (2) Firefox Android n'a pas MetaMask/Rabby, (3) les portefeuilles majeurs fournissent un navigateur intégré ou WalletConnect. Le gros du trafic mobile passe par l'application du portefeuille, où Sentinelle ne peut pas s'exécuter.

---

## 6. Conclusion franche

**Notre extension telle quelle est-elle compatible mobile ? EN PARTIE, et pour presque personne.**

- Chrome Android, Chrome iOS, Brave Android, DuckDuckGo, Samsung Internet (accès réservé), Opera : NON.
- Firefox Android : technique OUI après adaptation (MV3 -> event page, manifeste Firefox, UI responsive) ; mais aucun grand portefeuille EVM n'y est proposé, donc le wrapper aurait peu de choses à envelopper.
- Safari iOS : technique OUI après portage complet (app conteneur, Xcode sur Mac, 99 USD/an, revue Apple, iOS 18 pour `world: MAIN` via manifeste), mais seuls des portefeuilles de niche injectent dans Safari (Dawn, Tokenary/Big Wallet, expériences).
- Vivaldi Android 8.2 (septembre 2026), Yandex, Quetta, Edge (par ID) : plausiblement OUI avec le même paquet Chromium, non testé ; audience marginale et UX tactile non pensée.
- Portefeuilles à navigateur intégré (MetaMask Mobile, Trust, Coinbase, Rabby Mobile) et WalletConnect : NON, aucune extension ne peut s'y exécuter ; c'est là que se trouve l'essentiel des particuliers mobiles. Le seul levier pertinent y est une intégration chez le portefeuille (modèle Blockaid), pas une extension.

Part des particuliers mobiles réellement touchée par une version mobile d'extension : probablement quelques pour cent au maximum, plus vraisemblablement bien en dessous de 2 % (ESTIMATION). Recommandation : ne pas lancer de portage mobile pour la démo ; consacrer au plus une demi-journée à un test de compatibilité (Firefox Android + Vivaldi) pour pouvoir répondre "testé, voici le résultat" ; traiter le mobile via un partenariat/intégration portefeuille ou un service d'API (comme Blockaid), conformément à l'orientation business model déjà notée en mémoire.

---

## Sources principales lues (liens)
- [P] Mozilla, nouvelles extensions Firefox Android : https://blog.mozilla.org/en/mozilla/new-extensions-youll-love-now-available-on-firefox-for-android/
- [P] Mozilla, différences bureau/Android : https://extensionworkshop.com/documentation/develop/differences-between-desktop-and-android-extensions/
- [P] Mozilla, développer pour Firefox Android : https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/
- [P] Mozilla, soumettre un add-on : https://extensionworkshop.com/documentation/publish/submitting-an-add-on/
- [P] API AMO (compatibilité Android, utilisateurs) : https://addons.mozilla.org/api/v5/addons/addon/ether-metamask/ ; /pocketuniverse/ ; /revoke-cash/ ; /meta-flask-eth-bsc/ ; /approval-scanner-permitdecoder/ ; recherches app=android
- [P] MDN browser-compat-data : https://raw.githubusercontent.com/mdn/browser-compat-data/main/webextensions/manifest/content_scripts.json ; .../api/scripting.json ; .../manifest/background.json ; .../manifest/manifest_version.json ; .../manifest/host_permissions.json
- [P] Apple App Store Review Guidelines : https://developer.apple.com/app-store/review/guidelines/ ; Programme développeur : https://developer.apple.com/programs/ ; fil forum MAIN : https://developer.apple.com/forums/thread/728849
- [P] Samsung, guide extensions : https://developer.samsung.com/internet/android/extension-guide.html
- [P] Kagi Orion iOS : https://help.kagi.com/orion/browser-extensions/ios-ipados-extensions.html
- [P] Wallet Guard sunset : https://walletguard.app/blog/wallet-guard-sunset-notice
- [V] Pocket Universe : https://www.pocketuniverse.app/ ; Kerberus : https://www.kerberus.com/ ; Blockaid : https://www.blockaid.io
- [S] Brave : https://piunikaweb.com/2026/07/29/brave-says-android-extension-support-tbd/ ; Vivaldi 8.2 : https://alternativeto.net/news/2026/9/vivaldi-8-2-lands-on-mobile-bringing-extensions-to-android-and-an-address-bar-calculator/ ; Edge : https://windowslatest.com/2025/03/14/microsoft-edge-beats-google-chrome-gets-extensions-store-web-on-android/amp ; Kiwi : https://reclaimthenet.org/kiwi-browser-shutdown-mobile-extension-support-moves-to-edge ; Chrome Android build desktop : https://www.androidcentral.com/apps-software/chrome-for-android-is-getting-extensions-but-not-like-youd-expect (contenu non lu, titre seulement)
- [P/V] Tokenary/Big Wallet : https://github.com/lil-org/tokenary ; Safari Wallet : https://github.com/balance-io/safari-wallet/blob/main/README.md
- [V] WalletConnect 2025 : https://walletconnect.com/blog/walletconnect-2025-year-in-review (obtenu via recherche, page non ouverte)

---

## Résumé en 12 lignes

1. Chrome Android (téléphone) n'a toujours pas d'extensions en octobre 2026 ; seul un build "desktop" expérimental pour PC Android existe, sans plan annoncé pour les téléphones.
2. Chrome iOS : pas d'extensions (WebKit imposé par Apple, sauf UE sous entitlement, non utilisé).
3. Firefox Android est ouvert à tous les modules depuis le 14 décembre 2023 ; `world: MAIN` et `document_start` y marchent (Firefox 128+), mais il faut adapter le MV3 (pas de service worker, MV2 recommandé).
4. Safari iOS : extensions possibles via app App Store (99 USD/an, Mac+Xcode obligatoire, revue Apple) ; `world: MAIN` par manifeste dès iOS 18.
5. Vivaldi Android 8.2 (10 septembre 2026) accepte le Chrome Web Store ; Edge Android reste bêta/limité ; Brave Android "TBD" ; Kiwi arrêté ; Samsung fermé.
6. Le blocage principal n'est pas technique : MetaMask, Rabby, Pocket Universe et Revoke.cash n'ont aucune compatibilité Android sur AMO ; aucun grand portefeuille EVM n'injecte window.ethereum dans les navigateurs mobiles courants.
7. Les portefeuilles mobiles (MetaMask, Trust, Coinbase, Rabby) utilisent un navigateur intégré ou WalletConnect : aucune extension ne peut s'y exécuter.
8. Aucun produit de sécurité crypto n'a d'extension mobile : Pocket Universe annonce une "bêta iOS" sans produit, Wallet Guard fermé le 31 mars 2025, Kerberus/Scam Sniffer/Revoke.cash sont desktop ; Blockaid agit à l'intérieur des portefeuilles.
9. Aucune statistique fiable sur la part des utilisateurs mobiles avec extension ("non trouvé") ; estimation : bien moins de 2 %.
10. Portage : Firefox Android 2 à 5 jours, Safari iOS 3 à 6 semaines pour une v1 (1 à 2 semaines pour un prototype avec un Mac) ; Titouan est sous Windows donc Safari iOS exige un Mac.
11. En 36 h : tester Sentinelle sur Android (Firefox via web-ext, Vivaldi) pour documenter la compatibilité, sans produit.
12. Verdict : compatible EN PARTIE (Firefox Android, Safari iOS, Chromium Android récents), mais touche presque aucun particulier mobile ; mieux vaut passer par une intégration portefeuille/API que par une extension mobile.

# Surfaces d'interception alternatives pour Hold up (Avalanche)

Date : 2026-10-11. Légende : [V] vérifié par fetch d'une source primaire (URL), [NV] non vérifié (connaissance générale ou page inaccessible). Plusieurs pages de doc ont renvoyé 404 ou un contenu partiel : beaucoup de points restent [NV] et sont signalés comme tels. Contenu web traité comme donnée.

## TL;DR
- Un RPC protecteur est la seule surface qui couvre à la fois envoi in-wallet, mobile et (probablement) WalletConnect, mais seulement après signature, et jamais les signatures hors chaîne (Permit). [V partiel / NV]
- MetaMask permet de saisir un RPC custom sur extension ET mobile, sans avertissement de sécurité (seul avertissement : perte des Smart Transactions sur certains réseaux, pas Avalanche). [V]
- EIP-7702 : ACP-209 est "Proposed", aucune date d'activation trouvée sur Avalanche. Ne pas bâtir dessus. [V pour le statut]
- Safe est déployé en "canonical" sur 43114 et 43113. [V]
- CEX : aucun hook tiers ; seules les protections internes (whitelist, délai) existent. [NV]

## 1. RPC protecteur existant
- Flashbots Protect : envoie `eth_sendRawTransaction` à `rpc.flashbots.net/fast`, mempool privé, inclusion seulement si pas de revert ; objectif anti-MEV, pas anti-scam. Avalanche non mentionné. Post-signature. Pas de prix indiqué (remboursements MEV). [V] https://docs.flashbots.net/flashbots-protect/overview . Page "Cancellations" non lue [NV].
- MEV Blocker (CoW) : la page cow.fi indique "acquired" et redirige vers docs.mevblocker.io ; détails non lus. [V pour la redirection : https://docs.cow.fi/mevblocker] ; fonctionnement (anti-sandwich, gratuit, Ethereum) [NV].
- GoPlus : la doc docs.gopluslabs.io ne mentionne ni SecWareX, ni Secure RPC, ni Security RPC (liste : Transaction Simulation API, etc.). [V : https://docs.gopluslabs.io/] Le produit RPC existe peut-être, [NV].
- Blocksec (Phalcon / MetaSleuth, Blocksec RPC), Kerberus, Blowfish (racheté par Phantom, [NV]), Wallet Guard : non vérifiés dans cette session, tout [NV]. Connaissance générale [NV] : la plupart sont des extensions ou API de simulation (pré-signature, dans la page), pas des RPC bloquants ; Kerberus propose une extension et un RPC "Sentinel" [NV].
- Avalanche spécifique : rien trouvé [NV].
- Qui demande l'intention déclarée ou retarde plutôt que bloque : aucun identifié. [NV] Les protections trouvées simulent et bloquent/avertissent. Le créneau "retard + intention déclarée" semble libre, à confirmer par recherche supplémentaire.
- Limites communes : un RPC ne voit que des transactions déjà signées ; les signatures hors chaîne (Permit EIP-2612, Permit2, Seaport) ne passent jamais par lui. Raisonnement structurel, [V logiquement], pas sourcé.

## 2. Comportement des wallets
- Affichage verbatim d'une erreur JSON-RPC custom, retries/rebroadcast auto par MetaMask, Core, Rabby, Trust : non vérifié, [NV]. À tester en local (RPC bidon renvoyant -32000 avec message) : 30 min, à faire avant la démo.
- Chemin RPC custom MetaMask extension : menu en haut à droite > Networks > menu trois points du réseau > modifier > Default RPC URL > Add RPC URL > URL + nom > Save. Mobile : liste de réseaux en haut de l'onglet Tokens > trois points > Edit > RPC URL > Add RPC URL > Save. [V] https://support.metamask.io/configure/networks/how-to-add-a-custom-network-rpc/
- Avertissements MetaMask : seulement que l'ajout d'un RPC custom sur Ethereum, Linea, Base, Arbitrum, BNB désactive les Smart Transactions ; Avalanche n'est pas listé, donc pas de contournement documenté ici. Les réseaux ajoutés ne se synchronisent pas entre appareils. [V même URL]
- Core extension/mobile, Rabby, Trust : chemins non vérifiés (pages 404). [NV] Core permet l'ajout de réseau custom (Settings > Networks), [NV].

## 3. WalletConnect : quel RPC diffuse ?
- Page Reown consultée en 404. [NV] Principe du protocole : le dapp envoie la requête `eth_sendTransaction` via le relay, le wallet signe et diffuse avec SON RPC ; `eth_sendRawTransaction` côté dapp n'est utilisé que si le wallet renvoie la tx signée (`eth_signTransaction`). Donc, si le wallet utilise notre RPC, WalletConnect est couvert. À re-vérifier sur https://docs.reown.com (section WalletKit) avant d'affirmer.

## 4. Niveau compte
- EIP-7702 sur Avalanche : ACP-209 "eip7702-style-account-abstraction" est au statut "Proposed" ; le texte dit qu'un "network upgrade" doit être planifié ; aucune date. [V] https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/209-eip7702-style-account-abstraction . Activation sur C-Chain/Fuji : [NV], la page des upgrades Avalanche a renvoyé 404. Support 7702 par Core/MetaMask sur Avalanche : [NV].
- Safe : `safe.json` v1.4.1 liste 43114 et 43113 en "canonical". [V] https://raw.githubusercontent.com/safe-global/safe-deployments/main/src/assets/v1.4.1/safe.json . Page d'adresses : [NV] (non lue).
- Guards qui ralentissent : Safe Transaction Guard (checkTransaction avant exécution), Zodiac Delay module, hooks ERC-7579, validation ERC-4337 avec time-lock : existence connue [NV], non fetchés ici.
- Permit EIP-2612 : par construction, un permit est une signature hors chaîne valide pour le token, qui appelle `permit()` sur le token ; le guard du compte ne voit pas la signature. EOA : aucun guard possible. EOA 7702 délégué : le code délégué n'est exécuté que pour les appels vers le compte ; la signature ECDSA de l'EOA reste valide pour le token, donc non bloqué (raisonnement, [NV]). Compte contrat ERC-1271 : le token (selon implémentation, OpenZeppelin ERC20Permit supporte ERC-1271 via SignatureChecker) appelle `isValidSignature` du compte, qui peut refuser ou appliquer un délai : seul cas où le permit est contrôlable. [NV, à tester sur le token ciblé]

## 5. MetaMask Snaps
- `onTransaction` : "when a user submits a transaction using the MetaMask extension" ; la doc ne précise pas Send screen vs dapp. [V pour le texte] https://docs.metamask.io/snaps/reference/entry-points/ et https://docs.metamask.io/snaps/features/transaction-insights/ . En pratique, MetaMask appelle les insights pour toute confirmation, y compris Send [NV : à tester en Flask].
- `onSignature` : appelé pour toute méthode de signature (`personal_sign`, `eth_signTypedData_v4`), contenu affiché après clic sur Sign, uniquement si severity Critical. [V même URL]
- Mobile : la doc consultée ne mentionne que l'extension / Flask. [V pour l'absence] Les Snaps ne sont pas disponibles sur mobile selon ma connaissance [NV].
- Bloquer : affichage seulement ; severity `critical` (Flask uniquement) affiche une modale d'alerte, pas de refus. [V mêmes URL]

## 6. Retraits CEX
- Whitelist et délai à Binance : la page support visée n'existe plus (404). [NV] Connaissance générale [NV] : whitelist d'adresses, délai de 24 h sur nouvelles adresses chez certains (Coinbase, Kraken), confirmation par e-mail / 2FA. Aucun hook tiers connu : le retrait n'est pas on-chain tant que la CEX ne l'a pas diffusé. Surface possible : e-mail de confirmation (lecture de la boîte, mais exige accès à la messagerie : sensible) ou "coller l'adresse de destination" pour vérification préalable (paste-and-check). [NV]

## 7. Android / iOS
- Android : un AccessibilityService doit rester un outil d'accessibilité général ; la doc dev le décrit comme "a specialized tool, not a standard way to make your app accessible". [V] https://developer.android.com/guide/topics/ui/accessibility/service . La politique Google Play restreint son usage à l'assistance aux personnes handicapées avec déclaration, donc très risqué pour un outil de sécurité grand public [NV, politique Play non lue].
- Proxy VPN local : possible via VpnService, mais le trafic RPC est en TLS ; sans MITM (CA utilisateur ignorée par la plupart des apps Android récentes) on ne voit que le SNI. [NV] iOS : NetworkExtension équivalent, même limite TLS ; pas d'interposition sur une autre app. [NV]
- Presse-papiers / share sheet : on ne voit que des adresses copiées, utile pour paste-and-check. [NV]
- Réaliste : rien d'interposable proprement sur wallet mobile tiers sans RPC custom.

## Matrice de couverture
Oui / Partiel / Non. Source ou [NV].

| Cas | Extension navigateur | RPC protecteur | Snap | Garde compte intelligent | Page paste-and-check |
|---|---|---|---|---|---|
| Signature initiée par un site | Oui (injecté, notre code actuel) | Non (jamais au RPC) | Partiel (onSignature, affichage, extension seulement) [V] | Non | Partiel (l'utilisateur colle le message) |
| Transaction initiée par un site | Oui | Oui, post-signature [NV test] | Partiel (affichage) [V] | Oui si compte Safe/7579 (Safe canonical sur 43114/43113 [V]) | Partiel |
| Envoi dans le wallet | Non | Oui [NV test wallet] | Partiel (probable, [NV]) | Oui si compte Safe | Partiel (adresse collée) |
| Wallet mobile | Non | Partiel (RPC custom possible sur MetaMask mobile [V], autres [NV]) | Non [NV] | Oui si Safe | Partiel |
| WalletConnect | Non | Oui si wallet utilise notre RPC [NV] | Non | Oui si Safe | Partiel |
| Retrait CEX | Non | Non (diffusion par la CEX) | Non | Non | Partiel (vérif adresse avant de valider) [NV] |
| Permit hors chaîne | Oui (interception de la requête signature côté page) | Non | Partiel (onSignature, affichage) [V] | Non pour EOA et 7702 ; oui seulement ERC-1271 [NV] | Partiel |

## Recommandation honnête pour 2 ingénieurs en 6 h
1. Garder l'extension (déjà faite) pour signatures, permits, transactions de site : seule surface qui voit les permits.
2. Ajouter un RPC protecteur minimal pour Fuji/C-Chain : proxy JSON-RPC qui reçoit `eth_sendRawTransaction`, décode la tx (to, value, calldata approve/transfer), applique les détecteurs existants, puis retient N minutes (réponse d'erreur explicite ou attente) et laisse passer après confirmation sur une page de validation. Les autres méthodes sont relayées telles quelles. Environ 3 h. Couvre envoi in-wallet, mobile et WalletConnect si le wallet l'adopte.
3. Page paste-and-check (adresse / calldata collés) pour CEX et cas non couverts : 1 h, gratuite.
4. Réserver 1 h au test réel du message d'erreur dans MetaMask (extension et mobile) sur Fuji : c'est le point inconnu qui décide si "délai" ou "refus" est affichable.
Hors périmètre : Snaps (extension seulement, affichage), 7702 (pas actif), apps mobiles (politiques de stores).

## Première objection d'un praticien et réponse
Objection : "Le RPC voit la transaction après signature ; un Permit ou un drain par signature hors chaîne ne passe jamais par là, et l'utilisateur peut remettre le RPC par défaut en 10 secondes."
Réponse : exact, c'est pourquoi le RPC ne remplace pas l'extension mais la complète sur les cas que celle-ci ne voit pas (envoi in-wallet, mobile). Le contournement est un choix volontaire de l'utilisateur, comme désactiver un antivirus ; on le dit dans les limites connues. Les permits restent couverts par l'extension, et on ne prétend pas couvrir les retraits CEX.

## Sources consultées
- https://docs.flashbots.net/flashbots-protect/overview
- https://docs.cow.fi/mevblocker
- https://docs.gopluslabs.io/
- https://support.metamask.io/configure/networks/how-to-add-a-custom-network-rpc/
- https://docs.metamask.io/snaps/reference/entry-points/
- https://docs.metamask.io/snaps/features/transaction-insights/
- https://docs.metamask.io/snaps/
- https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/209-eip7702-style-account-abstraction
- https://raw.githubusercontent.com/safe-global/safe-deployments/main/src/assets/v1.4.1/safe.json
- https://developer.android.com/guide/topics/ui/accessibility/service
- Pages en 404 (non exploitables) : doc Reown wallet usage et walletkit, support Core, Binance whitelist, doc upgrades Avalanche, MetaMask smart transactions.

## Mapping réglementaire (par idée)
- RPC protecteur retardateur : NIST CSF 2.0 DE.CM, RS.MI ; ATT&CK T1657 (Financial Theft), D3-OAM (Outbound Traffic Filtering), D3-NTF (Network Traffic Filtering) [NV, à valider dans les référentiels] ; OWASP Agentic : ASI-xx à choisir selon l'angle agent ; ATLAS non pertinent.
- Paste-and-check : DE.AE, ID.RA ; D3-UBA (User Behavior Analysis) [NV].
- Garde Safe : PR.AA, RS.MI ; D3-ACH (Application Configuration Hardening) [NV].

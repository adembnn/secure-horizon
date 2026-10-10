# R3 - Exécution indirecte et évasion : ce qui trompe un décodeur et une simulation

Date : 2026-10-11. Périmètre : outil qui, avant signature, décode + simule (fork Anvil + trace) ce que fait réellement l'opération.

## Légende des étiquettes et limites

- [P] = source primaire ou spécification/document officiel (EIP, rapport d'incident officiel). Dans cette recherche, peu de sources [P] ont été ouvertes directement : la plupart des faits viennent de recherches web renvoyant des articles secondaires.
- [S] = source secondaire (presse, blog sécurité, éditeur), recoupée dans les résultats de recherche.
- [V] = à vérifier : connaissance générale de l'EVM / déduction d'ingénierie, non confirmée par une source ouverte ici.
- "non trouvé" = rien d'établi dans la recherche. Aucun hash de transaction n'a été trouvé pour aucun incident : tous les hashs sont "non trouvé" et à récupérer sur Etherscan / rapports d'incident avant publication.
- Les chiffres de pertes varient selon les sources ; je donne des ordres de grandeur avec la divergence signalée.

## Principe directeur (synthèse)

Un décodeur de premier niveau lit le calldata (sélecteur + arguments). Une simulation avec trace exécute la tx sur un état et un contexte de bloc donnés. Les évasions se classent en quatre familles :

1. Opacité de format : le calldata encode des actions dans des octets (commandes, bytes imbriqués) : un décodeur naïf s'arrête au premier niveau. Réponse : décodage récursif + trace.
2. Divergence de contexte : le contrat détecte qu'il est simulé (coinbase, timestamp, etc.) ou que l'état change entre simulation et inclusion. Réponse : contexte réaliste, double simulation, assertions d'état.
3. Effet différé : la signature ne cause aucun dommage maintenant (permit, approbation, délégation 7702). La simulation de la tx est "propre" ; le dommage vient plus tard. Réponse : analyser la capacité accordée, pas seulement l'effet immédiat.
4. Sabotage du simulateur lui-même : boucles, gaz, retours volumineux. Réponse : limites, timeouts, politique "échec de simulation = refus/avertissement fort" (jamais "silence = OK").

Règle d'or de conception : une simulation prouve ce qui se passe SI le monde reste identique ; elle ne prouve jamais ce qui se passera. Il faut donc (a) simuler le plus fidèlement possible, (b) montrer le différentiel d'état (balances, approbations, propriétaires, slots d'admin), (c) afficher l'incertitude.

---

## 1. Multicall / aggregate (Multicall3, routeurs, 1inch, 0x, Safe MultiSend)

- Mécanisme : une seule tx contient N appels. Multicall3 `aggregate3` prend des structs (cible, allowFailure, callData) [S]. Le Universal Router d'Uniswap prend `execute(commands, inputs)` : chaque octet de `commands` est une action, chaque élément de `inputs` est le calldata ABI-encodé correspondant ; les identifiants de commande changent selon la version du routeur [S]. Safe MultiSend empaquette (opération, adresse, valeur, longueur, données) dans un tableau d'octets et s'exécute par delegatecall depuis le Safe, avec une variante MultiSendCallOnly sans delegatecall [S].
- Exemple réel : le braquage Bybit a utilisé une transaction Safe où l'opération était fixée à 1 (delegatecall) vers un contrat malveillant, alors que l'UI montrait un transfert banal [S] (voir §2). Hash : non trouvé.
- Décodeur de premier niveau : voit "aggregate3(...)" ou "execute(bytes,bytes[])" avec des blobs hexadécimaux ; sans ABI par commande, il affiche "swap/inconnu". Il peut manquer qu'une commande est un `PERMIT2_PERMIT`, un `SWEEP` ou un `TRANSFER` vers un tiers. Avec `allowFailure=true`, un appel dangereux peut échouer en simulation et réussir en vrai (ou inversement) sans faire échouer le tout [V sur la sémantique exacte d'allowFailure ; le résultat de recherche ne l'a pas confirmée].
- Simulation + trace (callTracer) : voit tous les sous-appels, leurs cibles, valeurs et réussites. C'est la bonne couche. L'état avant/après (prestateTracer en mode diff) donne les balances et slots modifiés.
- Invisible : ce qui dépend d'un contexte différent ; l'intention (un "sweep" légitime vs un drain) ; sous-appels que l'attaquant fait volontairement échouer en simulation.
- Contre-mesures : décodage récursif avec registre d'ABI par version de routeur ; si une commande/cible est inconnue, la marquer "non décodée" (jamais l'omettre) ; afficher le résultat net par adresse (qui gagne/perd quoi) ; alerte si destinataire ≠ signataire ; alerte sur `allowFailure=true` + appels sensibles ; refuser delegatecall dans un MultiSend sauf allowlist (MultiSendCallOnly).
- Gravité : élevée (support de presque toutes les attaques). Phrase grand public : "Une seule signature peut cacher dix actions ; nous les listons toutes, y compris celles qui envoient de l'argent à quelqu'un d'autre."

## 2. delegatecall, proxys, appels imbriqués

- Mécanisme : delegatecall exécute le code d'une autre adresse dans le stockage et l'identité de l'appelant : le contrat cible peut réécrire le propriétaire / l'implémentation du wallet. Un proxy transmet les appels à une implémentation modifiable (upgrade) : l'adresse affichée n'est pas le code qui s'exécute.
- Exemples réels :
  - Bybit (février 2025) : JavaScript malveillant injecté dans l'interface Safe{Wallet} ; l'UI montrait un transfert normal alors que les données envoyées au matériel signaient un delegatecall vers un contrat créé 3 jours avant et non vérifié, qui a remplacé la logique du wallet froid [S : NCC Group, Cyfrin, Ocorian, Zealynx]. Perte ~1,5 milliard USD (~401 000 ETH selon une source) [S]. Attribution Lazarus/TraderTraitor selon les sources [S]. Divergence sur le point d'entrée initial (machine de développeur vs identifiants AWS/S3) [S]. Hash : non trouvé.
  - Parity multisig (novembre 2017) : la bibliothèque partagée appelée en delegatecall a été initialisée par un tiers puis détruite (selfdestruct) ; les wallets-stubs ont perdu leur logique, ~513 743 ETH gelés (chiffres variables selon sources) [S]. Hash : non trouvé.
- Décodeur de premier niveau : voit "execTransaction(to, value, data, operation=1...)" ; si l'outil ignore le champ `operation`, il montre juste "to = contrat X". Il ne sait pas que X modifie le stockage du wallet.
- Simulation + trace : callTracer montre le DELEGATECALL et la cible ; prestate diff montre que le slot 0 (singleton/masterCopy d'un Safe) ou le propriétaire change. C'est exactement ce qui aurait révélé Bybit si l'outil indépendant de l'UI avait simulé le calldata brut.
- Invisible : l'intention ; si la cible est un contrat qui se comporte bien aujourd'hui et change demain (proxy upgradable) ; l'UI compromise elle-même (si l'outil dépend de l'UI, il est trompé : il doit décoder le payload réellement envoyé au signataire).
- Contre-mesures : alerte rouge systématique sur delegatecall vers une adresse non allowlistée ; alerte sur toute modification de slots d'administration (EIP-1967 : implémentation/admin, singleton Safe, owners/threshold) ; détecter les proxys (lire les slots EIP-1967) et signaler "le code peut changer" ; contrat de cible non vérifié / jeune = avertissement ; comparer ce que l'UI affiche et ce que le calldata contient (indépendance de l'outil par rapport à l'UI).
- Gravité : critique. Phrase grand public : "L'écran vous montre un virement, mais la transaction remet en réalité les clés de votre coffre à quelqu'un d'autre."

## 3. Contrats "claim / mint / airdrop" multi-actions

- Mécanisme : une fonction au nom anodin (`claim()`, `mint()`, `Claim`, `SecurityUpdate`) fait en interne : appel à `approve`/`setApprovalForAll`, transferts, ou envoi de la valeur ETH reçue à l'attaquant. Les kits de drainers (as-a-service) automatisent cela ; le site demande "Connect/Claim", la tx contient parfois de l'ETH à envoyer.
- Exemple : Inferno Drainer, transaction batchée avec perte ~150 000 USD citée par Scam Sniffer [S] ; chiffre annuel des drainers 2024 ~494 M USD [S, secondaire de Scam Sniffer]. Hash : non trouvé.
- Décodeur de premier niveau : voit `claim()` sans arguments : rien de dangereux, "fonction inconnue".
- Simulation + trace : voit les sous-appels internes (approve, transferFrom, transfert d'ETH vers un tiers) : c'est le cas où la trace gagne largement sur le décodage. Le diff de balances/approbations montre la perte.
- Invisible : si le contrat ne déclenche l'action nuisible que dans certaines conditions (voir §10) ou plus tard (§12).
- Contre-mesures : afficher en tête "ce que vous perdez / ce que vous accordez" calculé par la trace ; tout événement `Approval`/`ApprovalForAll` et tout changement d'allowance dans la trace est promu au rang d'alerte ; "claim" qui n'apporte aucun actif entrant = signal ; contrat non vérifié / récent.
- Gravité : élevée (volume). Phrase : "Le bouton dit 'réclamer un cadeau', mais la transaction vous demande en fait de donner accès à vos jetons."

## 4. CREATE2, adresse précalculée, selfdestruct, contrats métamorphiques

- Mécanisme : CREATE2 rend l'adresse prévisible avant déploiement. Un attaquant peut faire approuver ou allowlister une adresse "vide" ou inoffensive, puis y déployer le code malveillant. Avec selfdestruct + CREATE2 (via une fabrique elle-même créée par CREATE2), on pouvait remplacer le code à la même adresse (contrat métamorphique).
- Exemple : gouvernance Tornado Cash (mai 2023) : proposition similaire à une précédente, contenant une fonction `emergencyStop` qui exécute selfdestruct ; après le vote, le contrat a été détruit et un code différent redéployé à la même adresse, donnant le contrôle de la gouvernance (~1,2 M votes contre ~700 k légitimes) [S : REKT, Halborn, Coinbase blog, arXiv SoK]. Perte estimée 430 ETH (~750 k USD) selon REKT, ~2,17 M USD selon Halborn ; date 20 mai (SoK) vs 13 mai (HackerNoon) [S]. Hash : non trouvé.
- EIP-6780 (Dencun) : selfdestruct ne supprime plus code/stockage sauf s'il survient dans la même transaction que la création ; cela a mis fin au schéma métamorphique pour les contrats déjà déployés [S/P : EIP-6780]. Subsiste : contrats créés et détruits dans la même tx ; adresses précalculées déployées après approbation (pas besoin de selfdestruct).
- Décodeur de premier niveau : voit une adresse. Si le code est vide à ce moment, il peut conclure "EOA / inoffensif".
- Simulation + trace : voit le code présent au bloc simulé. Si l'adresse est encore vide, la simulation est propre. Déploiement postérieur = invisible.
- Contre-mesures : traiter "adresse sans code" comme "inconnue", pas "sûre" ; alerter si l'adresse est dérivable par CREATE2 d'une fabrique connue ; ne jamais faire confiance à un permis/approbation accordé à une adresse vide ; vérifier l'existence de selfdestruct/delegatecall dans le bytecode cible ; hash de code (extcodehash) comparé à une liste connue.
- Gravité : élevée (moyenne depuis EIP-6780 pour le métamorphique pur ; élevée pour approbations à adresse vide). Phrase : "L'adresse paraît vide aujourd'hui, mais un piège peut y être installé juste après votre signature."

## 5. Tokens à hooks (ERC-777, ERC-1363, callbacks, NFT safeTransfer)

- Mécanisme : ERC-777 appelle des hooks chez l'expéditeur/destinataire avant ou après la mise à jour des soldes ; un contrat qui lit son solde pendant ce hook est réentrant. ERC-721/1155 `onReceived` donnent aussi la main au destinataire.
- Exemple : avril 2020, reentrance Uniswap v1 avec imBTC (ERC-777), perte ~300 k à 1,1 M USD ; puis Lendf.me/dForce, au moins 25 M USD cumulés [S]. Le risque avait été signalé avant le lancement (audit Consensys Diligence ; PoC OpenZeppelin) [S]. Hash : non trouvé.
- Décodeur de premier niveau : voit "swap" ou "transfer" ; ne sait pas qu'un hook s'exécute.
- Simulation + trace : voit le callback et les appels réentrants dans l'arbre d'appels : c'est visible ; le diff de balances montre l'anomalie. Un décodeur-only ne la voit pas.
- Invisible : ce qui dépend d'un état global modifié par un autre acteur ; la vulnérabilité du protocole cible n'est pas celle de l'utilisateur (l'utilisateur est plutôt la victime de la pool, pas du hook).
- Contre-mesures : trace complète avec profondeur d'appels affichée ; alerte si un jeton à hooks est impliqué (détection ERC-1820 registry / `tokensReceived`) ; alerte quand le profil d'appels revient dans le même contrat (réentrance) ; borne sur la profondeur.
- Gravité : moyenne (pour le signataire final) / élevée (pour le protocole). Phrase : "Certains jetons peuvent déclencher du code caché au moment où vous les recevez ou les envoyez."

## 6. Flash loans

- Mécanisme : prêt sans garantie remboursé dans la même transaction ; sert à manipuler un oracle de prix/pool, voter une gouvernance, etc., sur un état temporaire.
- Exemples : Beanstalk (avril 2022, flash loan pour obtenir la majorité de gouvernance) [V : non vérifié dans cette recherche ; hash non trouvé]. Autres : non cherché.
- Pour un signataire ordinaire : le flash loan n'est pas un risque pour lui directement, mais il signale (a) une transaction complexe et (b) que l'état intermédiaire est différent de l'état de départ et d'arrivée.
- Décodeur : voit "flashLoan(...)" ; peut ne pas voir la suite.
- Simulation + trace : la trace montre l'emprunt, les opérations, le remboursement ; le diff net montre le profit. Une simulation à l'état actuel est fidèle pour un flash loan atomique, SAUF si l'oracle manipulé est lu au bloc d'inclusion (§11).
- Contre-mesures : résumé net (gain/perte de l'utilisateur) en tête ; détecter les motifs flash loan connus (Aave, Balancer, Uniswap flash swap) ; avertir si la tx utilise un prêt flash alors que l'utilisateur n'en a pas demandé.
- Gravité : faible à moyenne pour le signataire. Phrase : "Cette opération emprunte des millions pour une fraction de seconde : c'est inhabituel pour un simple échange."

## 7. ERC-4337 (UserOperations, bundlers, paymasters)

- Mécanisme : l'utilisateur signe une UserOperation (pas une tx) ; un bundler la soumet à l'EntryPoint ; le compte (smart wallet) exécute des appels arbitraires, un paymaster peut payer le gaz. Les règles de validation (ERC-7562) bannissent des opcodes dépendant du bloc (TIMESTAMP, NUMBER, COINBASE, PREVRANDAO, BLOCKHASH, GASPRICE, BASEFEE, BLOBHASH) pendant la validation, pour que la simulation du bundler reste valable à l'inclusion ; liste exacte variable selon sources, à vérifier dans la spec [S]. Le bundler trace avec `debug_traceCall` et rejette les violations (codes d'erreur de l'EIP-7769) [S]. Réputation pour les paymasters (opsSeen / opsIncluded) [S].
- Exemple réel d'exploit paymaster/bundler : non trouvé dans les résultats.
- Pour un outil de pré-signature : le calldata signé est un `UserOperation` dont `callData` est le vrai payload, souvent `execute`/`executeBatch` du compte ; `initCode` peut déployer un compte ; `paymasterAndData` peut cacher des conditions. Le décodeur de premier niveau voit une struct opaque.
- Simulation + trace : on peut simuler `handleOps` sur fork ; la validation et l'exécution sont séparées : le résultat de validation (compte accepte) ne dit rien de l'exécution. Hors-chaîne, le bundler peut réordonner ou différer.
- Invisible : le comportement du compte (code de wallet upgradable) ; la décision du bundler/paymaster ; la signature peut être valide pour plusieurs chaînes si chainId absent du hash [V].
- Contre-mesures : décoder `callData` récursivement (execute/batch/delegatecall) ; afficher `initCode`, `paymaster`, limites de gaz ; avertir si le compte est un proxy upgradable ; vérifier la liaison à la chaîne et à l'EntryPoint dans la signature.
- Gravité : moyenne à élevée selon le wallet. Phrase : "Vous ne signez plus une transaction mais un 'ordre' qu'un intermédiaire exécutera pour vous ; nous lisons cet ordre en détail."

## 8. EIP-7702 (délégation d'un compte EOA à du code)

- Mécanisme : une EOA signe une "authorization" qui lui fait pointer du code d'un contrat ; ce code s'exécute avec l'identité de l'EOA. Légitime : batch, gaz sponsorisé. Abus : déléguer à un "sweeper" qui transfère tout actif entrant.
- Faits : après Pectra, Wintermute a relevé que plus de 80 % des délégations (97 % dans une autre version, fenêtre différente) pointaient vers des copies du même contrat de balayage ("CrimeEnjoyor") [S]. Cas : perte ~1,54 M USD en août 2025 (wstETH, cbBTC, NFT) selon un rapport [S] ; victimes du lancement WLFI dont la clé privée avait fuité [S]. Hashes : non trouvés. Les chercheurs insistent : ce n'est pas un bug du protocole, la cause est la clé compromise ou la signature trompée [S].
- Décodeur de premier niveau : une authorization est un champ spécial de la tx (type 0x04) ; un décodeur qui ne gère que `to/data/value` ne la voit pas. Une signature hors-chaîne pour délégation ressemble à un blob.
- Simulation + trace : la simulation de la tx peut être propre (aucun transfert immédiat). Le dommage vient à la prochaine réception d'actifs. Sur fork, il faut appliquer l'authorization et tracer le code délégué.
- Invisible : le comportement futur du code délégué ; la mise à jour du code à l'adresse cible (si c'est un proxy).
- Contre-mesures : alerte rouge maximale sur toute authorization 7702 vers un contrat non allowlisté ; afficher la cible et son comportement (contient-il un transfert générique/sweeper ?) ; allowlist des implémentations de wallets connues ; rappeler la révocation (délégation à l'adresse zéro) ; signature avec chainId=0 (valable multi-chaînes) = alerte [V].
- Gravité : élevée. Phrase : "Cette signature donne à un programme étranger le droit d'agir à votre place pour toujours, jusqu'à ce que vous la retiriez."

## 9. Bridges et messages cross-chain

- Mécanisme : une action sur la chaîne A n'a d'effet qu'à l'arrivée du message sur la chaîne B, validé par un relayeur/oracle/preuve. La simulation locale ne voit que le côté A (le dépôt).
- Exemples : Nomad (août 2022) : racine de confiance initialisée à 0x00, ce qui rendait tous les messages "prouvés", la tx exploit était copiable par n'importe qui ; ~190 M USD (CertiK) [S]. Wormhole (février 2022) : contournement de vérification de signature sur Solana via un compte sysvar falsifié, 120 000 wETH mintés, ~320-338 M USD selon le cours [S]. Hashes : non trouvés. Ces cas sont des bugs de protocole, pas de la tromperie du signataire ; ils sont ici pour illustrer que la simulation d'un côté ne garantit rien de l'autre.
- Décodeur de premier niveau : voit `send/bridge/depositFor` avec une destination encodée (chain id, adresse en bytes32) ; la destination est l'élément critique.
- Simulation + trace : voit l'émission de l'événement/message et le verrouillage des fonds ; ne voit pas l'exécution à l'arrivée ni le destinataire réel si encodé dans un `bytes`.
- Invisible : l'exécution sur la chaîne de destination (appel arbitraire possible dans le message), le délai, l'échec de livraison.
- Contre-mesures : décoder chaîne et destinataire de destination et les comparer à l'adresse du signataire ; allowlist des bridges officiels ; avertir "effet sur une autre chaîne non simulé" ; si l'API le permet, simuler aussi le côté destination.
- Gravité : moyenne à élevée. Phrase : "Votre argent quitte cette chaîne ; ce qui arrive à l'arrivée n'est pas vérifiable d'ici."

## 10. Détection de simulation ("red pill") : le contrat se comporte bien à l'essai et mal en vrai

- Mécanisme : le contrat lit des valeurs d'environnement qui diffèrent entre simulation et production et ramifie (branche).
- Preuves : ZenGo a montré que certains simulateurs fixaient COINBASE à l'adresse zéro ; un contrat pouvait alors rendre des fonds en simulation et les prendre en production (le coinbase réel est non nul) ; signalé à Coinbase et d'autres, corrigé ; "aucune preuve d'exploitation dans la nature" au moment du rapport, un témoignage ultérieur évoque un cas [S : TechTarget, Tenderly, BleepingComputer]. Une étude (CryptoSlate) rapporte ~4 200 contrats malveillants ayant trompé ~5 700 victimes, avec des branches différant entre simulation et exécution (changement d'état après la prévisualisation, dépendance au timestamp) ; un cas : 143,35 ETH perdus pour une signature 30 secondes après un changement d'état [S, chiffres à confirmer à la source]. Hash : non trouvé.
- Signaux exploitables (liste de conception) : `block.coinbase` (0 en simulation), `block.timestamp` / `block.number` (valeurs de simulation, bloc "pending" vs bloc futur), `block.basefee`, `gasprice`, `gasleft()` (budget différent), `chainid` (fork avec autre chaînid), `tx.origin` vs `msg.sender` (certaines simulations utilisent un `from` bizarre), `blockhash`, `prevrandao`, balance de coinbase, existence de code à des adresses précompilées/connues, états de stockage (drapeau mis à jour par l'attaquant), délai (timelock), nonce du compte. [V : liste de conception ; seul coinbase, timestamp et état post-prévisualisation sont soutenus par les sources ci-dessus ; tx.origin n'a pas été trouvé dans les résultats.]
- Décodeur de premier niveau : aveugle (il ne regarde pas le code).
- Simulation + trace : la trace montre les opcodes exécutés dans CE contexte ; elle expose les lectures d'opcodes d'environnement (COINBASE, TIMESTAMP, NUMBER, GASPRICE, CHAINID, ORIGIN, BALANCE sur coinbase) : c'est un indicateur direct. Mais le résultat montre le chemin "gentil".
- Invisible : le chemin "méchant" jamais exécuté.
- Contre-mesures :
  1. Remplir le contexte de façon réaliste : coinbase = adresse non nulle réelle, timestamp/number du prochain bloc, basefee et gasprice réalistes, chainid correct, `from` = vrai signataire.
  2. Détecter les lectures d'opcodes d'environnement dans la trace (structLogger ou tracer JS) ; si le contrat cible les lit ET fait un appel d'envoi/transfert conditionnel, alerter fort ("ce contrat adapte son comportement à l'environnement").
  3. Double (voire triple) simulation avec contextes différents (coinbase A/B, timestamp +12 s / +1 h, différents numéros de bloc, gas) ; toute divergence des diffs d'état = alerte rouge.
  4. Scan statique des opcodes COINBASE/TIMESTAMP/ORIGIN/GASPRICE/SELFBALANCE dans le bytecode.
  5. Pas de simulation avec "from" fantaisiste.
- Gravité : élevée. Phrase : "Le programme peut faire semblant d'être honnête quand on le teste, puis voler le vrai jour."

## 11. Écart entre simulation et inclusion (MEV, front-running, remplacement, oracles)

- Mécanisme : entre la simulation et l'inclusion (secondes à minutes), l'état change : un attaquant peut (a) modifier l'état du contrat cible (blacklist, taxe, drapeau), (b) manipuler un pool/oracle (sandwich), (c) front-runner, (d) remplacer la tx (même nonce, gaz plus haut) ou la différer.
- Exemple : cas cité d'un changement d'état après la prévisualisation avec une perte de 143,35 ETH [S, voir §10]. Sandwich/MEV : phénomène bien connu [V], pas de hash retenu.
- Décodeur : n'a pas de notion de temps.
- Simulation + trace : exacte pour le bloc simulé ; fausse pour le bloc d'inclusion si l'état change. Les tx très sensibles au slippage dépendent directement de l'état de pool.
- Invisible : tout ce qui se passe dans le mempool/builder après la signature.
- Contre-mesures : re-simuler juste avant l'envoi (au dernier bloc connu) ET comparer au résultat affiché à l'utilisateur ; imposer des bornes on-chain (amountOutMin, deadline) vérifiées dans le décodage ; recommander l'envoi par relais privé (protection MEV) ; expiration de la simulation (ex. 30-60 s) avec re-simulation obligatoire ; avertir si le résultat dépend d'une lecture d'oracle ou de réserves de pool ; alerter si des variables d'état du contrat cible ont changé depuis la première simulation (surveillance de slots clés jusqu'à l'inclusion).
- Gravité : moyenne à élevée. Phrase : "La situation peut changer entre le moment où nous vérifions et celui où la transaction passe, c'est pourquoi nous revérifions juste avant."

## 12. Approbations et permis différés (permit aujourd'hui, drain plus tard)

- Mécanisme : une signature hors-chaîne (EIP-2612 permit, Permit2) ou un `approve` ne déplace rien maintenant ; l'attaquant l'utilise quand il veut avant l'échéance (`deadline`), sans nouvelle action de la victime. Permit2 peut autoriser le solde entier par défaut si l'utilisateur ne limite pas [S]. Une échéance lointaine (ou illimitée) permet un drain "400 jours après" ; une approbation ERC-20 `approve(max)` n'a pas d'échéance du tout.
- Faits : les attaques par signature de permit représentent 38 % des pertes des incidents > 1 M USD dans les données 2025 de Scam Sniffer [S, secondaire] ; cas PEPE/MSTR/APU où les actifs sont partis ~1 h après la signature [S, Decrypt/Scam Sniffer]. Exemple de drain à >1 an : non trouvé. Hash : non trouvé.
- Décodeur de premier niveau : voit "signTypedData Permit(...)" ; peut ne pas afficher spender, montant, deadline en clair ; un permit n'est pas une transaction : "aucune simulation à faire" est l'erreur classique.
- Simulation + trace : de la tx, rien (pas d'effet immédiat). Pour un permit, la simulation doit porter sur la CAPACITÉ créée : "après cette signature, qui peut prendre quoi, combien, jusqu'à quand".
- Invisible : le moment et la manière de l'usage futur ; la réputation future du spender ; qu'un contrat spender change de logique.
- Contre-mesures : traiter toute signature typée comme une action sensible ; afficher spender, token, montant (surtout si ≥ solde ou "illimité"), deadline (alerte si > quelques jours), nonce ; alerter si spender est un EOA ou une adresse sans code ou récente ; comparer à une allowlist de spenders connus (Permit2 officiel, routeurs) ; scanner l'état existant d'allowances du portefeuille (révocation) ; "délai de refroidissement" : exiger un deuxième clic temporisé pour les approbations illimitées.
- Gravité : élevée. Phrase : "Cette signature ne vous coûte rien aujourd'hui, mais elle laisse à quelqu'un la clé de vos jetons jusqu'à une date lointaine."

## 13. Bombes de gaz, boucles, retours volumineux : faire échouer ou tromper le simulateur

- Mécanisme : boucles longues ou récursion pour épuiser le temps/gaz de l'outil ; "returndata bomb" : un appelé retourne un énorme payload dont la copie en mémoire consomme tout le gaz de l'appelant ; règle des 63/64 : l'appelant garde 1/64 du gaz, trop peu pour finir [S]. Gas griefing : fournir juste assez de gaz pour que l'appel externe réussisse mais l'appel interne échoue silencieusement [S].
- Exemples : constatés dans des audits (Codehawks / TimelockController ; Immunefi / copie coûteuse pour un multisig) [S] ; un exploit réel ciblant un simulateur de wallet : non trouvé.
- Décodeur : sans objet (ou le calldata gigantesque le fait planter).
- Simulation + trace : la trace elle-même devient énorme (mémoire, temps) ; un timeout de l'outil peut être interprété à tort comme "pas de problème" ou ignoré.
- Invisible : tout ce qui n'a pas été atteint avant l'arrêt de la simulation ; un chemin qui échoue avec le plafond de gaz de l'outil mais réussit avec celui de la vraie tx.
- Contre-mesures : plafond de gaz de simulation réaliste (= gas limit proposé par la tx) ; timeout dur + règle "timeout/erreur du simulateur = résultat INCONNU, avertissement fort, jamais vert" ; limite de profondeur d'appels et de taille de trace (troncature explicite et signalée) ; limite de taille de calldata/returndata ; tracer avec un tracer agrégé (callTracer) plutôt que structLogs pour économiser ; analyser séparément les gros retours ; isolement (sandbox, CPU/mémoire limités) pour que le simulateur ne soit pas un vecteur de déni de service.
- Gravité : moyenne. Phrase : "Si notre vérification n'arrive pas à finir, nous vous le disons clairement au lieu de vous laisser croire que tout va bien."

## 14. Honeypots et tokens non vendables

- Mécanisme : l'achat est possible, la vente est bloquée ou taxée à ~100 % (blacklist cachée, `require` conditionnel, reset de solde, taxe modifiable, pause du transfert, restriction selon `tx.origin`/adresse du routeur).
- Preuves : deux études académiques (arXiv 2309.04700 sur les "trapdoor tokens" Uniswap et arXiv 2309.13501 sur les pièges DEX) ; limites de la simulation : un piège retardé ne se déclenche que si son interrupteur est activé ; certains pièges exigent une victime précédente ; les tokens légitimes (USDC) ont des fonctions de blacklist, donc un détecteur peut produire faux positifs et faux négatifs [S]. L'analyse statique (GoPlus) lève des indicateurs de risque (is_blacklisted, transfer_pausable, tax_modifiable) [S]. Un scan est un instantané : le déployeur peut basculer après coup (activer trading, modifier la blacklist, augmenter la taxe) [S]. Hash : non trouvé.
- Décodeur de premier niveau : voit "swapExactETHForTokens" : rien d'anormal.
- Simulation + trace : simuler achat PUIS vente (aller-retour) sur fork avec la vraie adresse de l'utilisateur et un montant réaliste est la meilleure détection ; elle révèle taxes réelles et reverts. Mais : un honeypot peut distinguer l'adresse simulée, le montant, ou n'agir qu'après N jours ou N acheteurs.
- Invisible : interrupteurs retardés, conditions liées à la victime, blacklist ajoutée après l'achat, retrait de liquidité (rug pull) même si le jeton est vendable.
- Contre-mesures : aller-retour achat/vente sur fork + calcul de la taxe effective ; analyse statique du bytecode (fonctions de pause, blacklist, setTax, owner non renoncé) ; propriétaire (owner) et pouvoirs actifs ; liquidité et verrouillage ; double simulation à deux timestamps ; re-simuler juste avant ; croiser plusieurs sources ; "délai de refroidissement" (attente avant gros achat d'un jeton très récent).
- Gravité : moyenne à élevée (pertes individuelles nombreuses). Phrase : "Vous pouvez acheter ce jeton, mais il est peut-être impossible de le revendre."

## 15. Dépendance au temps, au nonce, aux timelocks (bombe à retardement)

- Mécanisme : le contrat n'agit mal qu'après une date (`block.timestamp > T`), un numéro de bloc, un compteur d'utilisateurs, ou l'expiration d'un timelock. La simulation aujourd'hui est propre ; l'état "armé" arrive plus tard. Variante : contrat upgradable dont l'admin change l'implémentation après la fin d'un délai.
- Exemples : permits à deadline lointaine (§12) ; honeypots à interrupteur retardé (§14) [S]. Cas nommé précis de bombe à retardement dans un incident : non trouvé.
- Décodeur : aveugle.
- Simulation + trace : correcte pour la date simulée. Il faut simuler en avançant le temps (Anvil `evm_setNextBlockTimestamp` / `anvil_mine`) pour tester des dates futures.
- Invisible : conditions dépendant de décisions humaines futures (admin) ; événements externes.
- Contre-mesures : simulation multi-horizons (maintenant, +1 jour, +30 jours, +1 an, +400 jours) et comparaison des diffs ; alerte sur toute comparaison de `TIMESTAMP`/`NUMBER` avec une constante lointaine dans le bytecode atteint ; signaler contrats upgradables avec admin non timelocké ; signaler timelock court ; surveillance continue après signature (révocation proposée).
- Gravité : moyenne à élevée. Phrase : "Un piège peut dormir des mois ; nous testons aussi ce qui se passerait plus tard."

---

## Tableau de synthèse

| # | Cas | Décodeur 1er niveau | Simulation + trace | Reste invisible | Gravité |
|---|-----|---------------------|--------------------|-----------------|---------|
| 1 | Multicall/routeurs | blobs opaques | tout visible | contexte, intention | élevée |
| 2 | delegatecall/proxy | cible seule | delegatecall + diff de slots | upgrade futur, UI compromise | critique |
| 3 | claim/airdrop | fonction anodine | sous-appels, approvals | déclenchement conditionnel | élevée |
| 4 | CREATE2/selfdestruct | adresse "vide" | code actuel seulement | déploiement postérieur | élevée |
| 5 | Hooks 777/1363 | transfer | callbacks visibles | état externe | moyenne |
| 6 | Flash loan | flashLoan | atomique fidèle | oracle au bloc suivant | faible-moyenne |
| 7 | ERC-4337 | struct opaque | validation + exécution séparées | bundler/paymaster | moyenne-élevée |
| 8 | EIP-7702 | auth non lue | propre à l'instant | code délégué futur | élevée |
| 9 | Bridges | destination en bytes | côté source seulement | côté arrivée | moyenne-élevée |
| 10 | Détection de simulation | aveugle | chemin gentil seul | chemin méchant | élevée |
| 11 | Écart simu/inclusion | pas de temps | exact au bloc simulé | mempool, MEV | moyenne-élevée |
| 12 | Permit différé | peut ne pas afficher | rien à simuler | usage futur | élevée |
| 13 | Bombes de gaz | planté | timeout/trace énorme | chemins non atteints | moyenne |
| 14 | Honeypot | swap normal | aller-retour utile | interrupteurs retardés | moyenne-élevée |
| 15 | Bombe à retardement | aveugle | date simulée seule | décisions futures | moyenne-élevée |

## Architecture de contre-mesures recommandée (par ordre de rendement)

1. Décodage récursif complet + registre d'ABI/commandes (Universal Router, Multicall3, MultiSend, Safe `execTransaction`, EntryPoint) ; élément non décodable = marqué "inconnu", jamais ignoré.
2. Trace complète (callTracer + prestateTracer diff) et résumé NET par adresse : balances, allowances, ApprovalForAll, owners/threshold, slots EIP-1967.
3. Règles d'alerte dures : delegatecall non allowlisté ; changement de slots d'administration ; approbation illimitée ou à adresse sans code/nouvelle ; authorization 7702 ; permit avec deadline lointaine ; destinataire ≠ signataire ; fonctions de balayage/sweep dans la cible.
4. Simulation multi-contextes : coinbase/timestamp/number/gas/basefee différents, plus horizons temporels ; toute divergence = alerte rouge ; détection de lecture d'opcodes d'environnement dans la trace.
5. Re-simulation au dernier moment + expiration de la simulation + bornes on-chain visibles (min out, deadline).
6. Résistance du simulateur : plafonds de gaz/temps/mémoire/trace ; timeout = INCONNU, jamais vert.
7. Indépendance vis-à-vis de l'UI : décoder le payload réellement envoyé au signataire (leçon Bybit).
8. Honnêteté : afficher ce qui n'est pas couvert (effets sur autre chaîne, futur, MEV).

## Sources consultées (via recherche web, secondaires sauf mention)

- Bybit / Safe : NCC Group (nccgroup.com/research/in-depth-technical-analysis-of-the-bybit-hack), Cyfrin, Hacken, Zealynx, Cobo, Ocorian.
- EIP-7702 : The Block (Wintermute, 2025-06-01), Cointelegraph (WLFI), Token.im rapport mensuel, article CrimeEnjoyor (blag.nullteilerfrei.de).
- Tornado Cash : REKT, Halborn, Coinbase blog (metamorphic proposals), arXiv 2406.15071 (SoK DAOs), forum OpenZeppelin.
- ERC-777 : Infosecurity Magazine, Hackread, SiliconAngle, Substack Kerman Kohli.
- Permit/Permit2 : SecureWorld, Decrypt (PEPE Permit2), Elliptic, Zealynx.
- Red pill : Tenderly, TechTarget (ZenGo), BleepingComputer, CryptoSlate (4 200 contrats).
- ERC-4337 : eco.com (ERC-7562), OpenZeppelin audit incrémental, EIP-7769, Pimlico docs.
- Honeypots : arXiv 2309.04700, arXiv 2309.13501, Dedaub Tokin, GoPlus Medium.
- Bridges : Immunefi, CertiK, Halborn, Kudelski (Nomad, Wormhole).
- Multicall/Router/MultiSend : docs Multicall3 (cosmos/eos), PyPI uniswap-universal-router-decoder, docs Safe, Ledger multisig.
- Parity : Coin Bureau, Threatpost, TechCrunch, evmresearch.io.
- EIP-6780, gas griefing : eips.ethereum.org/EIPS/eip-6780 (listé), Dedaub, Codehawks, Immunefi.

## Résumé en 8 lignes

1. Le décodage de premier niveau échoue sur tout ce qui est encapsulé (multicall, commandes de routeur, MultiSend, UserOp) : il faut un décodage récursif et une trace complète (callTracer + diff d'état).
2. Cas le plus grave documenté : delegatecall masqué par une UI compromise (Bybit, ~1,5 Md USD) ; contre-mesure : décoder le payload réel, alerte rouge sur delegatecall et sur tout changement de slots d'admin.
3. Les attaques par signature (permit/Permit2, 7702) ne montrent aucun effet à la simulation : il faut simuler la capacité accordée (qui, combien, jusqu'à quand) et alerter sur échéances lointaines.
4. Les "red pills" (coinbase=0, timestamp, état modifié après prévisualisation) sont réels ; contre-mesure : contexte réaliste, double simulation à contextes/horizons différents, détection de lecture d'opcodes d'environnement.
5. CREATE2 + selfdestruct métamorphique est largement neutralisé par EIP-6780, mais "adresse sans code aujourd'hui" reste un piège : ne jamais la juger sûre.
6. Bombes de gaz et gros retours visent le simulateur : plafonds, timeout, et règle "échec de simulation = INCONNU, jamais vert".
7. Honeypots et bombes à retardement échappent à la simulation instantanée : aller-retour achat/vente, analyse statique, simulation à plusieurs dates, re-simulation juste avant envoi.
8. Limites de cette recherche : aucun hash de transaction trouvé, sources surtout secondaires, Beanstalk et tx.origin non confirmés (étiquette [V]) ; à vérifier avant publication.

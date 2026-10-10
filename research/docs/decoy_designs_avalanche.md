# Conceptions de leurre (deception) anti wrench attack sur Avalanche : l'ensemble des possibles

Date : 10 oct. 2026. Contexte factuel : `research/docs/wrench_attacks_factcheck.md`. Règlement : `context/notion_guide.md` (Track 1, critères : détection 30 %, réponse 20 %, faisabilité 20 %, conformité 15 %, pitch 15 %).

Légende : **[DOC]** = documenté, URL fournie et lue ce jour. **[IDÉE]** = idée de conception, non documentée comme telle. **[À VÉRIFIER]** = non confirmé. Les notes (/5) et estimations d'heures sont **mon jugement**, pas des faits.

## TL;DR

- Un explorateur public montre tout : aucun leurre ne cache un solde réel lié à une adresse connue. Les leurres qui tiennent sont des **appâts réellement financés** (plafonnés) et des **coffres non liés** ; le reste est du mensonge d'interface, démasquable en 1 clic.
- Le mécanisme le plus solide et le plus démontrable en 24 h n'est pas de « faire croire », mais de **détecter la sortie des fonds du leurre** (wallet canari = honeytoken) puis **répondre à l'arrivée** : flag cosigné + gel via un ERC-20 que nous déployons sur Fuji + dossier horodaté par un agent. La détection a une latence mesurable, ce qui sert le critère à 30 %.
- Variante « seed exigée » : seed de contrainte = mêmes 11 premiers mots, 12e mot différent (BIP-39) ouvrant un wallet canari financé. Aucune alerte n'existe chez Coldcard/Trezor/Binance (d'après le fact-check) : c'est notre différenciation.
- Recommandation : « Canari + Gel + Dossier » (R1 ci-dessous), avec appât plafonné/coffre à timelock en complément (R2) et un benchmark synthétique (latence de détection, % de fonds gelés, faux positifs).
- Risques majeurs à assumer : sécurité physique (un leurre découvert peut provoquer des représailles), faux flags (abus du registre), et **aucun tiers réel (Circle, Tether, exchanges) ne lit notre registre** : à présenter comme PoC d'intégration, pas comme acquis.

---

## 0. Cadre : modèle de ravisseur et invariants

Trois niveaux de ravisseur (hypothèse de conception) :
- **N1** : regarde l'écran de la victime, exige un virement ou une seed. Ne vérifie rien.
- **N2** : vérifie sur un explorateur que l'adresse destinataire a bien reçu et le montant. Peut importer une seed dans son propre wallet.
- **N3** : commanditaire expert (traçage, comparaison avec l'historique on-chain de la victime, adresses doxxées). Aucun leurre ne le trompe durablement ; l'objectif est d'acheter du temps.

Invariants (conception) :
1. La sécurité physique prime : donner quelque chose de **réel et immédiat** (tribut plafonné) réduit le risque ; un leurre à zéro valeur l'augmente.
2. Aucune réponse visible pour le ravisseur tant qu'il est présent (pas de notification sur l'écran de la victime, pas de popup).
3. L'adresse publique déjà connue (ENS, réseaux sociaux, fuite) **est** l'appât : y mettre un solde plafonné crédible, les fonds froids vivent ailleurs sans lien on-chain.
4. Tout flag/gel doit être proportionné, expirant, cosigné (conformité).
5. Démo uniquement sur nos propres contrats Fuji, données synthétiques, aucune action contre un système réel (règlement du hackathon).

Alignement Track 1 : le guide cite des pistes « réponse graduée (authentification renforcée, mise en attente, gel, alerte client) » et « playbook (pause du contrat, alertes, traçage des fonds) » avec Fuji en exemple (`context/notion_guide.md`, lignes 54-58). Le projet se cadre comme **SOC anti-fraude / DeFi pour la coercition**, pas comme gadget grand public.

## 1. Primitives Avalanche : ce qui est documenté

| Primitive | Fait documenté | URL |
|---|---|---|
| Fuji C-Chain | Chain ID 43113 ; RPC `https://api.avax-test.network/ext/bc/C/rpc` ; explorateur `https://explorer-test.avax.network/c-chain` | https://build.avax.network/docs/quick-start/networks/fuji-testnet |
| Précompiles L1 par défaut | Deployer AllowList, Transaction AllowList, Native Minter, Fee Manager, Reward Manager, Warp Messenger ; adresses fixes, activées dans `genesis.json` | https://build.avax.network/docs/avalanche-l1s/evm-configuration/evm-l1-customization |
| Transaction AllowList | `0x0200000000000000000000000000000000000002`, rôles admin/manager/enabled/none, événements `RoleSet`. La page **ne dit pas** ce que voit l'expéditeur refusé | https://build.avax.network/docs/avalanche-l1s/precompiles/transaction-allowlist |
| Contract Deployer AllowList | `0x0200000000000000000000000000000000000000`, seules les adresses `enabled` déploient | https://build.avax.network/docs/avalanche-l1s/precompiles/deployer-allowlist |
| Fee Manager | `0x0200000000000000000000000000000000000003`, `setFeeConfig` (gas limit, base fee…), événement `FeeConfigChanged` | https://build.avax.network/docs/avalanche-l1s/precompiles/fee-manager |
| Native Minter | `0x0200000000000000000000000000000000000001`, `mintNativeCoin(addr, amount)` | https://build.avax.network/docs/avalanche-l1s/precompiles/native-minter |
| Warp | `0x0200000000000000000000000000000000000005`, `sendWarpMessage`, `getVerifiedWarpMessage` ; non gaté par AllowList ; **le payload est public dans l'événement `SendWarpMessage`** | https://build.avax.network/docs/avalanche-l1s/precompiles/warp-messenger |
| ICM / Warp : signatures | Les validateurs signent en BLS, un relayer agrège, le quorum par défaut est 67 % (33-100) | https://build.avax.network/docs/cross-chain/avalanche-warp-messaging/overview |
| Teleporter | `TeleporterMessenger` `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf` sur « toutes chaînes, tous réseaux » (inclut Fuji selon la page) ; protection anti-rejeu ; `retryMessageExecution` ; liste de relayers autorisés | https://build.avax.network/docs/cross-chain/teleporter/overview |
| ICTT | TokenHome (verrouille) / TokenRemote (mint-burn), ERC20 ou natif, `sendAndCall` | https://build.avax.network/docs/cross-chain/interchain-token-transfer/overview |
| Data API (= Glacier) | Balances, transactions, transferts, internal tx, >100 L1 mainnet+testnet. **Fuji, webhooks, clé API, limites : non mentionnés sur cette page** | https://developers.avacloud.io/data-api/overview |
| eERC (EncryptedERC, Ava Labs) | ERC-20 chiffré zk-SNARK, modes standalone/converter, auditeur rotatif ; **Fuji non mentionné, déploiement local uniquement dans le README** ; licence « Ecosystem License » | https://github.com/ava-labs/EncryptedERC |
| ERC-4337 EntryPoint v0.8 | `0x4337084d9e255ff0702461cf8895ce9e3b5ff108` ; déployé sur « la plupart des réseaux EVM » (présence sur Fuji **non vérifiée**) | https://github.com/eth-infinitism/account-abstraction |
| Zodiac Delay | File d'attente avec cooldown, expiration optionnelle, saut de nonce par le propriétaire, exécution par n'importe qui | https://raw.githubusercontent.com/gnosisguild/zodiac-modifier-delay/master/README.md |
| OpenZeppelin ERC20Pausable | Override de `_update` avec `whenNotPaused` ; pas de fonctions pause publiques (à ajouter avec contrôle d'accès). Pause **globale** : un blocklist par adresse est à écrire | https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/token/ERC20/extensions/ERC20Pausable.sol |
| USDC Fuji (Circle) | Adresse testnet `0x5425890298aed601595a70AB815c96711a31Bc65` (contrôlée par Circle : on ne peut pas la geler nous-mêmes) | https://developers.circle.com/stablecoins/usdc-contract-addresses |
| Hexagate | Monitoring temps réel, détection (retraits anormaux, flux suspects, blacklists), réponse automatisée (pause de contrat, blocage), Avalanche supporté. Produit Chainalysis, accès commercial : **à vérifier** | https://www.chainalysis.com/product/hexagate |

**À vérifier / non confirmé** : Safe (singleton/factory) sur Avalanche et Fuji (la page Safe consultée ne tranche pas) ; EntryPoint et bundler sur Fuji ; webhooks Data API ; création d'un L1 Fuji en 24 h (nœud validateur ou service hébergé) ; apparence de Snowtrace Fuji (seul l'explorateur ci-dessus est documenté) ; rejet d'une tx non autorisée par l'AllowList (erreur vue par l'expéditeur).

## 2. Les familles et leurs variantes

Format : mécanisme, primitives, écran ravisseur, explorateur, démasquage, coût 24 h (heures-personne, estimation), notes jury /5 (D=détection, R=réponse, F=faisabilité, C=conformité, P=pitch).

### Famille A : leurre de solde

**A1. Wallet caché par passphrase ou dérivation [documenté ailleurs, hors Avalanche].** Passphrase BIP-39 = autre wallet (Trezor, cf. fact-check). *Mécanisme* : le wallet de contrainte est financé de façon crédible. *Avalanche* : aucune primitive propre ; adresse EVM dérivée. *Écran* : solde plausible. *Explorateur* : adresse leurre réelle, tx réelles. *Démasquage* : l'agresseur exige « toutes les passphrases » ; wallet vide = suspect ; adresse connue d'avance ≠ adresse du leurre. *Coût* : 2 h (script). *Jury* : D1 R1 F5 C2 P2 (art antérieur, pas de détection).

**A2. Solde chaud plafonné + coffre froid timelock (patron ERC-8238) [brouillon documenté ailleurs].** Brouillon ERC-8238 : compte 4337, chaud plafonné par époque, froid 24-72 h, bypass 2-sur-3 gardiens (https://ethereum-magicians.org/t/erc-8238-coercion-resistant-vault/28130). *Avalanche* : contrat EVM déployé sur Fuji (C-Chain) ; 4337 optionnel [À VÉRIFIER sur Fuji], recommandation : contrat maison minimal (un `DuressVault`) plutôt que Safe+Zodiac pour éviter la dépendance non vérifiée. *Écran* : l'app affiche « solde disponible » = plafond. *Explorateur* : l'adresse du compte montre le solde chaud ; le froid est dans un contrat qui s'affiche s'il est lié. *Démasquage* : appel `balance` du contrat, lecture du code vérifié, lien de funding. *Coût* : 6-8 h (contrat + tests). *Jury* : D2 R3 F4 C4 P3. Fort pour la sécurité, faible en inédit.

**A3. Coffre non lié (unlinked vault) [IDÉE].** Fonds froids sur une adresse jamais en relation avec l'adresse publique (financement via une chaîne de transferts à l'avance, ou via ICTT depuis un L1 intermédiaire). *Avalanche* : ICTT TokenHome/TokenRemote [DOC] peut déplacer l'actif sur un L1 que l'agresseur n'examine pas ; mais le verrouillage côté home est visible. *Démasquage* : analyse de graphe de financement ; une seule tx de lien suffit. *Coût* : 3 h. *Jury* : D1 R1 F3 C2 P3. Utile seulement combiné à A2.

**A4. Soldes chiffrés (eERC) ou L1 privé [DOC partiel + IDÉE].** eERC chiffre les montants, mode converter possible pour envelopper un ERC-20 existant (https://github.com/ava-labs/EncryptedERC). Les adresses et l'existence des transferts restent visibles ; les montants non. Un L1 custom n'est pas documenté comme privé (la page de personnalisation ne traite pas la confidentialité). *Écran* : « solde chiffré » (suspect en soi). *Démasquage* : un wallet qui utilise eERC signale un coffre ; le déchiffrement exige la clé. *Coût* : 12-20 h, circuits ZK, Fuji non documenté : **hors périmètre 24 h**. *Jury* : D2 R2 F1 C3 P4 (« wow » mais risqué).

**A5. Explorateur ou UI mensonger [IDÉE, déconseillé].** Afficher un faux solde dans notre propre app. Démasqué dès que l'agresseur ouvre un explorateur. Écarté.

### Famille B : transaction « fantôme »

**B1. Tribut plafonné réel et immédiat [IDÉE].** La victime envoie réellement une somme plafonnée depuis le compte chaud (ce que le ravisseur voit sur l'explorateur est vrai). Pas de tromperie à maintenir ; la tromperie porte sur « il n'y a rien de plus ». *Écran* : tx envoyée. *Explorateur* : transfert réel. *Démasquage* : exigence de « tout » ; l'agresseur peut deviner la présence d'un plafond si l'app est connue. *Coût* : inclus dans A2. Combiné à un traçage de l'adresse destinataire (famille D/F), c'est la base la plus sûre physiquement. *Jury* : D3 R4 F5 C4 P4.

**B2. Token miroir gelable [IDÉE, démontrable sur Fuji].** Le compte de contrainte détient un ERC-20 maison au symbole « USDC » (testnet) avec blocklist. L'envoi crée un vrai `Transfer` visible sur l'explorateur. *Démasquage* : l'adresse du token diffère de l'USDC Circle (documentée plus haut) ; échec de swap/retrait. Sur mainnet : usurpation de symbole, zone juridique grise ; risque physique élevé si découvert. *Coût* : 4 h. *Jury* : D2 R2 F4 C1 P3. Acceptable seulement comme démo du gel, pas comme stratégie.

**B3. Escrow imitant l'adresse du ravisseur (vanity/proxy) : écarté.** C'est le ravisseur qui fournit l'adresse ; en substituer une autre ne trompe personne dès qu'il consulte l'explorateur sur sa propre adresse (rien reçu). À citer au jury comme piège évité.

**B4. Tx « bloquée » (nonce/gas) : écarté.** Sur Fuji la finalité est rapide, une tx qui n'apparaît jamais est suspecte. Je n'ai pas de source sur les délais exacts de finalité : [À VÉRIFIER] avant de l'affirmer.

### Famille C : délai invisible

**C1. Zodiac Delay sur Safe [DOC, mais Safe sur Avalanche À VÉRIFIER].** Tx en file avec cooldown, annulable par saut de nonce (https://raw.githubusercontent.com/gnosisguild/zodiac-modifier-delay/master/README.md). *Explorateur* : la mise en file est une tx visible vers le module : le délai **ne peut pas être masqué** à un agresseur qui regarde l'adresse de la victime. *Coût* : 5 h si Safe disponible, sinon réécrire. *Jury* : D2 R3 F3 C4 P3.

**C2. Délai hors chaîne (relayer/bundler qui retient l'opération) [IDÉE].** La victime signe une intention, notre relayer la retient ; rien n'apparaît sur l'explorateur pendant le délai. *Démasquage* : « aucune tx » pendant des minutes ; crédible seulement quelques minutes, avec un récit (« la signature est en cours »). *Coût* : 4 h. *Jury* : D2 R3 F4 C3 P3.

**C3. Récit de plausibilité : « limite quotidienne » [IDÉE].** Dans le monde réel, les limites de retrait sont connues du public ; le récit « ma limite est de X par jour » couvre un plafond sans mentir sur l'explorateur. Combiné à B1 + C1/C2. Aucun coût technique supplémentaire.

**C4. Délai via bridge simulé (ICTT) : écarté.** L'adresse du ravisseur serait sur la chaîne d'origine ; un retard de livraison sur un L1 distant ne la concerne pas.

**C5. Fin de délai = redirection, pas annulation [IDÉE].** À l'expiration, le montant va à une adresse de quarantaine plutôt que de revenir : utile pour la preuve, mais ajoute de la complexité. Priorité basse.

### Famille D : gel à l'arrivée

**D1. Registre de contrainte + ERC-20 avec blocklist (démo Fuji) [IDÉE, faisable en 24 h].** Contrats : `DuressRegistry` (flag(adresse, hash_dossier, expiry, mode) validé par quorum de gardiens, plus un rôle « bot » à effet provisoire court) ; `FreezableToken` (`_update` consulte le registre ; revert si `from` ou `to` est flaggé et actif, modèle ERC20Pausable [DOC] mais par adresse). *Ce que voit le ravisseur* : l'argent arrive (solde visible) puis tout transfert sortant revert. *Explorateur* : événement `AddressFlagged` public (tip-off possible) ; option : ne pas émettre d'adresse dans l'événement (l'état reste lisible par `eth_call`, le calldata reste visible). *Démasquage* : tenter un transfert sortant. *Paramètre clé* : `effectiveAt` (gel à effet différé) et mode MONITOR (suivre sans geler) vs FREEZE, pour laisser la police se positionner. *Coût* : 5-6 h. *Jury* : D4 R5 F4 C4 P5.

**D2. Registre consommé par des tiers (exchanges, émetteurs) [IDÉE, non existant].** Aucun tiers réel ne lit ce registre ; la valeur est un format d'intégration (webhook, appel `isFlagged`). Hexagate peut déclencher des réponses automatisées (pause, blocage) [DOC], mais l'accès est commercial [À VÉRIFIER]. *Démasquage* : n/a. *Coût* : 3 h (simulateur d'exchange `ExchangeSim` qui refuse le dépôt). *Jury* : D3 R4 F4 C5 P4 (angle KPMG : AML/CFT).

**D3. Propagation cross-L1 par Warp/Teleporter [DOC + IDÉE].** Un flag émis sur C-Chain est répliqué vers un L1 (par ex. L1 fintech) via Teleporter, avec protection anti-rejeu [DOC]. Le payload est public [DOC]. *Coût* : 10-14 h, car un second L1 Fuji est nécessaire [À VÉRIFIER pour 24 h]. *Jury* : D3 R4 F2 C4 P5 (très « Avalanche »). Risque d'échec en démo élevé.

**D4. Suivi des fonds en aval (cascade de flags) [IDÉE].** L'agent suit les sorties de l'adresse flaggée (Data API ou RPC) et propose l'extension du flag aux adresses suivantes avec expiration courte. Limites documentées : bridges, DEX, coopération internationale lente (fact-check, Slate).

### Famille E : signal silencieux

**E1. Credential de contrainte dans l'app (PIN/passphrase alternatif, 4 derniers chiffres) [IDÉE].** Le PIN de contrainte ouvre le wallet leurre ET envoie une intention signée à un relayer par HTTPS en arrière-plan ; le relayer publie `DuressSignal(hash_dossier)` ou appelle directement la file des gardiens. Rien dans l'historique de la victime. *Limites* : pas de réseau (téléphone en mode avion/cage de Faraday) → échec ; matériel « nu » (Ledger/Trezor) sans app → inutilisable. *Coût* : 6 h. *Jury* : D3 R4 F3 C3 P4.

**E2. Wallet canari financé (honeytoken sortant) [IDÉE ; à ma connaissance sans équivalent dans les produits du fact-check, À VÉRIFIER].** Le wallet leurre est pré-enregistré dans le contrat des gardiens (`registerCanary(adresse)`). N'importe quelle **sortie signée par cette clé** déclenche l'alerte, même depuis un matériel tiers : l'agresseur qui importe la seed dans son propre wallet et balaie les fonds appuie lui-même sur la sonnette. *Détection* : surveillance de blocs sur Fuji (RPC documenté), latence de quelques secondes à confirmer par mesure. *Écran* : rien. *Explorateur* : transfert normal. *Démasquage* : l'agresseur sait que le leurre existe (article de presse sur notre produit) et ne fait rien ; ou il déplace via un mixeur. *Faux positifs* : usage accidentel par le propriétaire (confirmation par code), poisoning par dust entrant (ne pas alerter sur les entrées). *Coût* : 4 h. *Jury* : D5 R4 F5 C4 P4. **Coeur recommandé.**

**E3. Absence de check-in (dead-man) [IDÉE].** Contrat `Heartbeat` : alerte aux gardiens si aucun check-in sous N heures. Faux positifs forts (batterie, sommeil) → alerte humaine seulement, pas de gel automatique. Fact-check : pas de détection biométrique validée, donc le déclencheur reste volontaire ou temporel. *Coût* : 3 h. *Jury* : D2 R3 F5 C3 P3.

**E4. Événement anodin on-chain (transfert de valeur 0 vers un gardien) [IDÉE].** Visible dans l'historique de la victime (donc vu par un agresseur N2). À réserver si le relayer E1 est indisponible. Jury : D1 R2 F5 C2 P2.

**E5. Warp vers un L1 « cellule de crise » [DOC + IDÉE].** Un L1 permissionné via Transaction AllowList et Deployer AllowList [DOC] où seuls les gardiens et le relayer écrivent ; Warp/Teleporter authentifie le signal par les validateurs [DOC] ; Native Minter peut alimenter en gas les wallets d'urgence [DOC pour la fonction, IDÉE pour l'usage] ; Fee Manager pour des frais minimaux [DOC]. *Mais* le payload Warp est public [DOC] : y mettre un hash, pas de données. *Coût* : 12-16 h, risque de montage de L1 sur Fuji. *Jury* : D3 R4 F2 C4 P5.

**E6. Stéganographie de calldata ou de gas price : écarté.** Gain faible, visible en clair sur l'explorateur, effort élevé.

**E7. Déclencheur biométrique / montre : écarté.** Le fact-check ne trouve aucun produit validé, uniquement des études de labo ; faux positifs non publiés. On garde un geste volontaire.

### Famille F : réponse automatisée

**F1. Agent LangGraph sur Bedrock [IDÉE, stack du projet].** Graphe : (1) ingestion du signal et vérification de signature/quorum ; (2) collecte des faits on-chain (tx de la victime, adresse de destination, graphe de sortie) ; (3) calcul du hash du dossier et ancrage (`CaseAnchored(hash, timestamp)`) ; (4) notification des gardiens (SNS/Telegram) ; (5) brouillons : demande de gel à l'exchange, plainte, éléments pour le 17 ; (6) proposition de flag (jamais d'action irréversible sans gardien). **Humain décide** : appel aux forces de l'ordre, extension d'un flag au-delà de 24 h, toute déclaration officielle. *Risque agentique* : l'agent lit des données contrôlées par l'attaquant (nom de token, memo, calldata) → injection de prompt (ASI01, AML.T0051). Mitigation : l'agent ne reçoit que des champs typés et hashés, un juge déterministe valide les actions. *Coût* : 8-10 h. *Jury* : D3 R5 F3 C5 P4.

**F2. Playbook humain** (qui décide quoi) : gardien 1 (confirme la contrainte par canal hors bande), gardien 2 (valide le flag), conformité (valide la déclaration), personne d'autre n'a de droit d'action. Matrice RACI à mettre dans la fiche de défense. *Coût* : 1 h.

### Famille G : seed ou PIN exigé

**G1. Passphrase 25e mot.** Voir A1. Dépend de la crédulité.

**G2. Seed de contrainte distincte ouvrant un wallet faible ET canari (E2) [IDÉE].** La seed donnée au ravisseur est une seed séparée ; le canari alerte lors de la première sortie.

**G3. Dernier mot altéré [calcul à vérifier sur BIP-39].** Pour 12 mots BIP-39, les 11 premiers mots fixent 121 bits ; le 12e mot porte 7 bits d'entropie + 4 bits de checksum, donc plusieurs 12e mots sont valides et donnent des seeds **différentes**. La victime récite la phrase avec un 12e mot alternatif valide : l'agresseur importe, voit un wallet réel (le canari) financé. Aucun outil ne signale une « mauvaise » phrase puisqu'elle est valide. Source : https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki [À VÉRIFIER : calcul des 128 complétions et usage pratique]. *Démasquage* : l'agresseur compare l'adresse de la seed à l'adresse publique connue ; d'où la règle « l'adresse du canari doit être celle que l'agresseur attend » (adresse publique/doxxée = canari). *Coût* : 2 h. *Jury* : D4 R4 F5 C3 P5.

**G4. PIN/dérivation alternative dans le wallet maison (Coldcard-like)** : le fact-check documente Coldcard (duress wallet BIP-85 sans effet visible) mais sans alerte on-chain. Notre ajout : l'alerte E1/E2.

### Familles ajoutées

**H. Côté fintech/custodian : step-up « duress-aware » [IDÉE].** Le prestataire (exchange, wallet custodial) reçoit un signal ; règle : bénéficiaire nouveau + montant élevé + drapeau contrainte → mise en attente 24 h, motif codé, journal d'audit, brouillon de déclaration (angle KPMG : AML/CFT, DORA). *Coût* : 5 h (`ExchangeSim` + règles). *Jury* : D3 R4 F4 C5 P4.

**I. Dossier probant et ancrage [IDÉE].** Hash de dossier ancré on-chain (horodatage) + signature des gardiens : valeur de preuve et traçabilité de décision (critère conformité). *Coût* : inclus dans F1.

**J. Benchmark synthétique [IDÉE].** Générateur de N scénarios (légitime vs contrainte : canari balayé, dead-man déclenché, utilisateur légitime distrait) avec métriques : latence de détection (secondes, blocs), taux de fonds gelés avant sortie, faux positifs. Indispensable pour le critère 30 % (« des chiffres même synthétiques », guide ligne 71).

## 3. Ce que voit le ravisseur : tableau comparatif

| Idée | Écran victime | Explorateur public | Cause de démasquage principale |
|---|---|---|---|
| B1 + A2 (tribut plafonné) | tx réussie | transfert réel | exigence de « tout » |
| E2 + G3 (canari) | wallet financé | solde réel du canari | adresse ≠ adresse connue |
| D1 (gel) | solde reçu puis revert | `AddressFlagged` (si émis), revert en sortie | tentative de retrait |
| C1 (Delay) | « en attente » | tx vers le module visible | délai visible |
| C2 (relayer) | « en cours » | rien | absence de tx |
| E1 (signal relayer) | rien | rien chez la victime | téléphone coupé |
| E5 (Warp) | rien | payload public sur le L1 | lecture du L1 |

## 4. Mapping NIST CSF 2.0 / OWASP / ATLAS / ATT&CK / D3FEND

Sous-catégories NIST à vérifier sur csrc.nist.gov avant de les écrire dans les frontmatters ; les catégories (DE.CM, DE.AE, RS.MA, RS.AN, RS.CO, RS.MI, PR.AA) sont reprises du fact-check ou standard NIST (GV.RR : à vérifier).

| Idée | NIST CSF 2.0 | OWASP Agentic | ATLAS | ATT&CK | D3FEND |
|---|---|---|---|---|---|
| E2 canari | DE.CM, DE.AE | n/a | n/a | T1657 (Financial Theft, tactique Impact : vérifié https://attack.mitre.org/techniques/T1657/), T1078 | D3-DUC (Decoy User Credential), D3-DO (Decoy Object) : vérifiés https://d3fend.mitre.org/technique/d3f:DecoyObject/ |
| D1 gel | RS.MI, PR.AA | n/a | n/a | T1657 | D3-DNR (Decoy Network Resource, vérifié même page) ; contrôle d'accès : D3-UAP à confirmer |
| F1 agent | RS.MA, RS.AN, RS.CO | ASI01, ASI02, ASI03 (noms dans `context/notion_guide.md`) | AML.T0051 prompt injection (page ATLAS non ouverte : 404 ; repris de `research/vaccin/V3_etat_art_concurrence.md`) [À VÉRIFIER] | T1657 | D3-ACH à confirmer |
| E1/E3 signal | DE.AE, RS.CO | n/a | n/a | T1078 | D3-DUC |
| A2/B1/C | PR.AA, RS.MI | n/a | n/a | T1657 | D3-DO |
| H custodian | DE.AE, RS.MA, GV.RR (rôles) | ASI03 si agent | n/a | T1078, T1657 | D3-UAP à confirmer |

Remarque : ATT&CK ne couvre pas la contrainte physique ; le mapping porte sur l'objectif de l'adversaire (vol financier, usage de comptes valides). Le jury doit entendre cette limite de la bouche de l'équipe.

## 5. Classement des 10 meilleures combinaisons

Notes /5 (mon jugement) : a = sécurité physique de la victime ; b = crédibilité face à un agresseur qui regarde un explorateur ; c = faisabilité 24 h sur Fuji ; d = score jury probable ; e = caractère inédit vs Coldcard/Trezor/Binance/ERC-8238. Total = 2a + b + c + 2d + e, sur 35.

| Rang | Combinaison | a | b | c | d | e | Total |
|---|---|---|---|---|---|---|---|
| 1 | **R1** Canari (E2) + seed au dernier mot altéré (G3) + balayage → flag cosigné → gel Fuji (D1) + dossier agent (F1) | 4 | 3.5 | 4 | 4.5 | 4 | 28.5 |
| 2 | **R2** Appât plafonné (B1) + coffre non lié timelock (A2+A3) + canari (E2) | 5 | 4 | 3 | 4 | 2 | 27 |
| 3 | **R3** Credential de contrainte (E1) + relayer + quorum gardiens + agent (F1) | 4 | 4 | 3 | 3.5 | 3 | 25 |
| 4 | **R4** Step-up côté custodian (H) + registre (D1/D2) + dossier | 3 | 3 | 4 | 4.5 | 3 | 25 |
| 5 | **R5** Dead-man (E3) + quorum gardiens + agent | 3 | 4 | 5 | 3 | 2 | 23 |
| 6 | **R6** Registre + propagation Warp/Teleporter vers L1 fintech (D1+D3) | 3 | 3 | 2 | 4 | 4 | 23 |
| 7 | **R7** Zodiac Delay (C1) + récit « limite quotidienne » (C3) + B1 | 4 | 3 | 3 | 3 | 1 | 21 |
| 8 | **R8** Coffre eERC / L1 chiffré (A4) + canari | 3 | 3 | 1 | 3.5 | 4 | 21 |
| 9 | **R9** Token miroir gelable (B2) | 2 | 2 | 4 | 2.5 | 3 | 18 |
| 10 | **R10** Événement anodin / stéganographie (E4/E6) | 2 | 2 | 4 | 2 | 3 | 17 |

Ex aequo (R3/R4, R5/R6, R7/R8) départagés par la faisabilité 24 h. Écartés : B3 (escrow imitant le ravisseur), B4 (tx bloquée), E7 (biométrie), A5 (UI mensongère).

## 6. Notes jury probables pour R1 (estimation)

| Critère | Poids | Note /5 | Justification |
|---|---|---|---|
| Détection | 30 % | 4 | latence mesurable sur le balayage du canari ; faux positifs maîtrisés (alerte sur sortie signée seulement) ; limite : dépend de l'action de l'agresseur |
| Réponse | 20 % | 4 | gel cosigné, dossier ancré, playbook humain ; limite : gel sur un token que nous contrôlons |
| Faisabilité | 20 % | 3.5 | contrats simples + watcher + agent ; risque : intégration tiers fictive |
| Conformité | 15 % | 4 | expiration, quorum, journal, mode MONITOR ; risque : GDPR, faux flags |
| Pitch | 15 % | 4.5 | histoire claire : « le ravisseur appuie lui-même sur la sonnette » |

Estimation : (4x30 + 4x20 + 3.5x20 + 4x15 + 4.5x15) / 5 = 79,5 / 100.

## 7. Recommandation

Construire **R1** en cœur, avec la partie « tribut plafonné » de R2 comme option de démo. Argument : (1) mesurable (critère 30 %), (2) 100 % sur nos contrats Fuji, sans dépendre d'un Safe ou d'un EntryPoint non vérifiés, (3) répond à la variante la plus dangereuse (seed exigée), (4) l'agent apporte la réponse documentée, (5) le récit KPMG (AML, traçabilité, preuve) est naturel. Garder D3/E5 (Warp) comme « extension » dans le deck, pas dans le chemin critique.

Plan 24 h (estimation) : contrats (`CanaryRegistry`, `DuressRegistry`, `FreezableToken`, `CaseAnchor`) 8 h ; watcher + règles 4 h ; agent LangGraph/Bedrock 6 h ; simulateur d'attaque + benchmark 4 h ; README, fiche de défense, deck, vidéo 6 h. Rien de tout cela ne se code avant samedi 11h30 (règlement).

Sécurité physique : le flag n'est jamais visible par la victime ; `effectiveAt` retardé et mode MONITOR laissent la police décider ; le système ne notifie jamais le ravisseur.

## 8. Les 3 questions pièges du jury Avalanche / KPMG

1. **« Qui a le droit de flagger une adresse, et que se passe-t-il si c'est faux ? »** (KPMG, conformité) : réponse attendue : quorum de gardiens, expiration courte, rôle bot à effet provisoire, appel, journal horodaté, mode MONITOR, mention AML/tipping-off et GDPR (adresse = donnée possiblement personnelle) ; reconnaître que la base légale reste à valider avec un juriste.
2. **« Qui lit votre registre ? Circle, Tether et les exchanges ne le consulteront pas. Qu'est-ce qui est réel ? »** (Avalanche, faisabilité) : réponse : PoC d'intégration sur nos contrats ; formats `isFlagged` et webhook ; aucun partenariat revendiqué ; la partie réelle aujourd'hui est la détection du balayage et le dossier.
3. **« Votre leurre met-il la victime en danger s'il est découvert, et quel taux de détection mesurez-vous, sur quelles données ? »** (sécurité physique, métriques) : réponse : tribut réel plafonné, silence total côté écran, benchmark synthétique (N scénarios, latence, % gelé), faux positifs listés ; pas de chiffres d'efficacité réelle des leurres (le fact-check : « peu de données »).

Question bonus (Avalanche) : « Pourquoi Avalanche et pas n'importe quel EVM ? » : réponse honnête : Fuji est le terrain de test demandé ; la valeur propre d'Avalanche est le L1 permissionné (AllowList) et Warp/Teleporter pour propager un flag, qui restent en extension.

## 9. Limites de ce document

- Plusieurs pages Avalanche ne répondent pas aux questions décisives (Fuji pour Data API, comportement des rejets AllowList, webhooks, privacy des L1) : marqué [À VÉRIFIER].
- Safe, bundler et EntryPoint sur Fuji non confirmés.
- Les notes /5 et heures sont des estimations.
- Le calcul BIP-39 (dernier mot) est à confirmer par un test sur une bibliothèque avant la démo.
- Les pages OWASP/ATLAS n'ont pas livré les noms ASI/AML ; les noms ASI01/02/03 viennent du règlement local.

## Sources

- Fuji : https://build.avax.network/docs/quick-start/networks/fuji-testnet
- Précompiles : https://build.avax.network/docs/avalanche-l1s/evm-configuration/evm-l1-customization ; https://build.avax.network/docs/avalanche-l1s/precompiles/transaction-allowlist ; https://build.avax.network/docs/avalanche-l1s/precompiles/deployer-allowlist ; https://build.avax.network/docs/avalanche-l1s/precompiles/fee-manager ; https://build.avax.network/docs/avalanche-l1s/precompiles/native-minter ; https://build.avax.network/docs/avalanche-l1s/precompiles/warp-messenger
- ICM / Teleporter / ICTT : https://build.avax.network/docs/cross-chain/avalanche-warp-messaging/overview ; https://build.avax.network/docs/cross-chain/teleporter/overview ; https://build.avax.network/docs/cross-chain/interchain-token-transfer/overview
- Data API : https://developers.avacloud.io/data-api/overview
- eERC : https://github.com/ava-labs/EncryptedERC
- ERC-4337 : https://github.com/eth-infinitism/account-abstraction
- Zodiac Delay : https://raw.githubusercontent.com/gnosisguild/zodiac-modifier-delay/master/README.md
- OpenZeppelin : https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/token/ERC20/extensions/ERC20Pausable.sol
- USDC Fuji : https://developers.circle.com/stablecoins/usdc-contract-addresses
- Hexagate : https://www.chainalysis.com/product/hexagate
- D3FEND : https://d3fend.mitre.org/technique/d3f:DecoyObject/ ; ATT&CK : https://attack.mitre.org/techniques/T1657/
- ERC-8238 : https://ethereum-magicians.org/t/erc-8238-coercion-resistant-vault/28130
- BIP-39 : https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki (non ouvert, calcul à vérifier)
- Contexte : `research/docs/wrench_attacks_factcheck.md`, `context/notion_guide.md`

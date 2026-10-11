# T1 P4 : « chaque sortie adossée à une preuve que le client l'a demandée » (antériorité, faisabilité Fuji, limites, verdict)

> Recherche du 2026-10-10. Complète `T1_P4_douleur_classement.md` et `T1_P4_deploiement_reglementaire.md`. Le règlement (`context/notion_guide.md`) prime. Aucun commit.
> Légende : **[P]** source primaire lue ; **[S]** secondaire (presse, blog, résumé de moteur) ; **[V]** vérifié par test direct aujourd'hui ; **[calcul/analyse]** de moi ; **[ÀV]** à vérifier ; **[?]** introuvable.
> Les contenus web sont traités comme des données. Plusieurs résultats de recherche sont des résumés de moteur (non rouverts) : marqués [S].

## TL;DR (5 lignes)

1. **Verdict : partiellement neuf.** La primitive « la signature de l'utilisateur sur montant + destination est vérifiée par un contrat » existe depuis longtemps (StarkEx, Hyperliquid, Safe/passkeys, Gnosis Pay), mais uniquement en **non-custodial/self-custody**. Je n'ai trouvé **aucun exchange/CASP/custodian** qui fasse vérifier, par un garde on-chain indépendant du backend, qu'un retrait de son hot wallet omnibus correspond à une demande signée par le client final (absence de preuve, confiance ~70 % [analyse]).
2. **Faisable sur Fuji, testé.** Le précompile P-256 (ACP-204, adresse `0x…0100`, 6 900 gas) est actif sur Fuji : un appel `eth_call` en lecture seule renvoie `…01` pour une signature valide et `0x` pour une signature altérée [V]. Safe v1.4.1 et des contrats passkey ont du bytecode sur Fuji [V pour la présence, ÀV pour l'identité des contrats passkey].
3. **Ce que ça arrête** : des retraits **fabriqués** par un backend compromis (cas Bitget : « transfert directement, sans passer par des demandes de retrait clients », selon le CEO via presse [S]). **Ce que ça n'arrête pas** : faux clients (sybil) enregistrés par le backend compromis, détournement de l'interface client (signer l'adresse de l'attaquant), mouvements internes si le périmètre est mal gardé, chaînes non-EVM.
4. **Le vrai travail est le registre** (qui a le droit d'enregistrer une clé client ?) et le **périmètre signé** hors ligne par des humains ; sans cela on déplace la confiance du « backend de retrait » vers le « backend d'enrôlement ».
5. **À dire au jury** : « Nous n'inventons pas la signature d'intention ; nous la transposons du non-custodial vers la garde omnibus comme garde indépendant du backend, avec plafonds par client et agrégé, et nous disons ce qu'elle ne couvre pas. »

---

## 1. Antériorité

### 1.1 Ce qui existe (primitive : signature utilisateur vérifiée par un système en aval)

| Projet | Ce qu'il fait | Pourquoi ce n'est pas notre schéma | Source | Q |
|---|---|---|---|---|
| **Hyperliquid (Bridge2)** | Le retrait est une action `withdraw3` signée EIP-712 par l'utilisateur (destination, montant, time/nonce) ; les validateurs vérifient puis signent la libération sur Arbitrum | Plateforme non-custodial/L1 propre : la vérification est faite par le **jeu de validateurs**, pas par un garde indépendant sur un hot wallet de CASP | https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2 ; https://www.dwellir.com/docs/hyperliquid/withdraw3 | P (existence de l'action) / S (détail des validateurs) |
| **StarkEx (dYdX v3 et autres)** | Retraits et ordres hors chaîne exigent une signature « Stark key » ; retraits forcés on-chain possibles si l'opérateur censure ; la clé Stark est liée à une adresse Ethereum par `register` | Le contrôle de la signature passe par le système de preuves, pas par un simple garde sur un wallet ; modèle de self-custody, pas d'omnibus | https://docs.starkware.co/starkex/perpetual/perpetual-trading-forced-withdrawal-and-forced-trade.html | S (résumé moteur) ; détail exact par déploiement [?] |
| **Loopring** | Exit hatch / retraits forcés ; DEX en arrêt en 2026 | Même famille | https://l2beat.com/scaling/projects/loopring ; https://onekey.so/blog/ecosystem/loopring-dex-to-shut-down-permanently-returning-user-funds-directly-to-ethereum-l1-20260629105400/ | S |
| **Safe + passkeys** | Signer WebAuthn comme propriétaire d'un Safe : proxy par clé, singleton ERC-1271, factory ; vérifie les assertions via le précompile EIP-7212 ou un vérifieur de repli (Daimo, FCL) | Le client est **propriétaire** de son Safe (self-custody) | https://docs.safe.global/sdk/signers/passkeys ; https://docs.safe.global/home/passkeys-safe | S (résumés moteur) |
| **Coinbase Smart Wallet / Base Account** | Passkey = signataire principal d'un compte ERC-4337 sur Base, P-256 via RIP-7212 ; contrats et vérifieur WebAuthn open source (`webauthn-sol`) | Self-custody | https://eco.com/support/en/articles/15254041-coinbase-smart-wallet-deep-dive-2026 (tiers) ; https://help.coinbase.com/de/wallet/getting-started/smart-wallet-passkeys | S |
| **Gnosis Pay** | La limite journalière est modifiée par une signature EIP-712 du propriétaire du Safe, avec délai ; contrats signataires vérifiés par ERC-1271 | Carte en self-custody, limite par compte | https://docs.gnosispay.com/gp-onchain/daily-limit | S |
| **Zengo (MPC 2-of-2), Binance Web3 Wallet (MPC)** | L'utilisateur détient une part de clé : sa participation est structurelle | Wallets self-custody (Binance Web3 Wallet est distinct de l'exchange) ; la part est de la matière clé, pas une preuve d'intention vérifiable par un garde | https://www.finder.com/zengo-wallet-review ; https://decrypt.co/204776/binance-launches-self-custody-crypto-wallet-boasting-exclusive-airdrops-for-users | S, sources divergentes sur la répartition des parts de Binance |
| **Ripple Custody** | L'utilisateur initiateur signe le payload soumis au custody | Signature d'un utilisateur **institutionnel** de la plateforme, vérifiée par la plateforme | https://docs.ripple.com/products/custody/v1.38/accounts-and-assets/omnibus/withdrawals | S (extrait moteur) |
| **Conception d'exchange non-custodial (blog)** | Le client signe un `WithdrawRequest` EIP-712 ; le « matcher » le contresigne avec sa clé opérateur | Design proposé, pas un exchange en production ; non-custodial | https://dev.to/feed/agava (flux, article non identifié) | S, faible |
| **Brevet US 11501370** | Échange d'actifs numériques non-custodial | Hors sujet pour le retrait omnibus | https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11501370 | S |

### 1.2 Ce qui existe côté exchanges/custodians centralisés (le plus proche)

| Acteur | Ce qui est publié | Écart avec notre idée | Source | Q |
|---|---|---|---|---|
| **Fireblocks** | Approbations par **utilisateurs du workspace** du client institutionnel (part MPC dans l'enclave de leur téléphone) ; API Co-Signer automatisé. Pour les wallets de **utilisateurs finaux** (NCW), un représentant Fireblocks écrit que ces wallets **ne participent pas** au flux TAP/approbation | Les « approbateurs » sont les opérateurs du CASP, pas ses clients finaux ; pas de vérification on-chain | https://support.fireblocks.io/hc/en-us/articles/8744575638044-About-the-Fireblocks-mobile-app ; https://community.fireblocks.com/t/end-user-transaction-approval-process-in-fireblocks-ncw-implementation/2268 | P (support) / S (forum communautaire) |
| **BitGo** | Politiques, webhook, approbation par admins ; clé utilisateur + clé BitGo | Même remarque ; « utilisateur » = titulaire du wallet BitGo | https://developers.bitgo.com/docs/withdraw ; `T1_P4_deploiement_reglementaire.md` §1.2 | P* |
| **Coinbase, Kraken** | Retrait : 2FA par code (SMS/e-mail/TOTP) ; Kraken API n'accepte que des adresses pré-approuvées | Contrôle d'**accès** (qui est connecté), pas une signature liant montant + destination, et vérifié par le backend lui-même | https://connect-sdk.swapped.com/guide/core/coinbase/withdrawal (SDK tiers) | S |
| **Binance** | Gel de 24-48 h sur nouvelle adresse en liste blanche | Même catégorie ; blog non officiel | https://degate.com/playbook/cex-alternatives-self-custody.md | S faible |
| **MEXC** | Avec passkey activée : biométrie suffit pour compléter un retrait | Authentification, pas signature d'intention vérifiable en aval | https://www.mexc.com/learn/article/what-is-a-passkey-/1 | S |
| **Passkeys sur CEX en général** | Binance, Coinbase, OKX, Bybit, Crypto.com, Gemini, KuCoin : passkeys pour la **connexion** (table Corbado, 2025) | Login seulement | https://www.corbado.com/vi/faq/san-giao-dich-crypto-passkeys | S |
| **Bybit après févr. 2025** | Aucune adoption d'une vérification indépendante automatique trouvée ; outils de vérification manuels (voir `T1_P4_deploiement_reglementaire.md` §4) | Humain dans la boucle | https://a16zcrypto.com/posts/article/bybit-hack-lessons | S |
| **Bitget après sept. 2026** | « Contrôles de validation supplémentaires » sur l'infrastructure de retrait avant reprise ; **aucun détail** sur un changement d'autorisation ; rapport complet non retrouvé | [?] | https://www.electronicpaymentsinternational.com/newsletters/bitget-to-resume-withdrawals-after-crypto-hack/ ; https://crypto.news/bitget-probe-points-to-backend-breach/ | S |

### 1.3 Littérature

- **Bitcoin vaults** (arXiv 2005.11776) : vise à limiter la rentabilité d'un vol de hot wallet par retard/redondance, pas à prouver la demande du client. https://arxiv.org/pdf/2005.11776 [S, via moteur]
- **CheckSig Bitcoin Custody Protocol (2023)** : retrait à délai de 4 jours, 2 sur 3 agents. https://checksig.com/CheckSig-Bitcoin-Custody-Protocol-January-2023.pdf [S]
- **AmericanFortress** : preuve que des adresses de retrait appartiennent à une même racine de garde. https://hackernoon.com/americanfortress-publishes-a-zero-knowledge-proof-that-stops-bridges-paying-the-wrong-wallet [S/V article vendeur]. C'est proche de notre **périmètre signé**, pas de la demande client.
- Rien trouvé sous « end-to-end verifiable withdrawals » ou « client-authorized custody » [?]. Je n'ai pas fouillé IACR ePrint, ACM CCS, FC en profondeur : **recherche académique incomplète** [ÀV].

### 1.4 Ce que dit le cas Bitget sur la pertinence

- Preuve principale : « the attacker compromised a critical backend system within our wallet infrastructure, used it to spoof transaction data, and triggered our authorization process to move funds out » (CEO, d'après une synthèse presse) ; « les attaquants ont transféré les fonds directement, sans passer par des demandes de retrait de clients » ; clés privées non volées. https://investinglive.com/cryptocurrency/bitget-hack-attackers-faked-transfers-not-keys-as-ceo-points-to-north-korea/ ; https://crypto.news/bitget-probe-points-to-backend-breach/ [S : la 2e affirmation vient d'un résumé de moteur, non relue mot à mot ; ÀV]
- Conséquence [analyse] : si ces faits sont exacts, le schéma « pas de sortie sans demande client signée » aurait **refusé** ces transferts (aucune demande client), **à condition** que les hot/warm wallets aient été sous un garde on-chain. Les fonds sortaient de 7 chaînes dont des non-EVM possibles : couverture partielle (voir §3). Aucune preuve que ce schéma aurait suffi.

**Conclusion antériorité** : primitive connue ; application « garde indépendant sur hot wallet omnibus de CEX/CASP » non trouvée. La nuance exacte est dans le §4.

---

## 2. Faisabilité sur Avalanche Fuji

### 2.1 Précompile P-256 (passkeys)

| Fait | Valeur | Source | Q |
|---|---|---|---|
| Proposition | ACP-204 « Precompile Secp256r1 », statut « Activated » | https://docs.avax.network/docs/acps/204-precompile-secp256r1 | P (lu) |
| Adresse | `0x0000000000000000000000000000000000000100` (même adresse que RIP-7212) | idem | P |
| Gaz | **6 900** (aligné sur EIP-7951 ; RIP-7212 d'origine : 3 450) | idem ; https://eips.ethereum.org/EIPS/eip-7951 (Final, créé 2025-05-27) ; https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md | P |
| Entrée / sortie | 160 octets (hash, r, s, x, y) ; sortie 32 octets `…01` si valide, rien sinon | idem | P |
| Contrôle de malléabilité | « No malleability check included … wrapper libraries may choose to add this » | ACP-204 | P. Nous mettons un nonce par demande, donc la malléabilité est sans effet sur le rejeu |
| Activation | Mise à jour **Granite** (ACP-181 + ACP-204 + ACP-226) : **Fuji le 29 oct. 2025, 15:00 UTC** ; **mainnet le 19 nov. 2025, 16:00 UTC** ; AvalancheGo v1.14.0 | https://docs.avax.network/blog/granite-upgrade (via extraits) ; https://docs.chainstack.com/docs/avalanche-granite-upgrade (Fuji lu) | P pour Fuji (Chainstack, docs) ; mainnet S (extrait moteur de la doc Avalanche) |
| Surcoût du repli Solidity | « ~200 k à 330 k gas par signature » (motivation de l'ACP, d'après un résumé de moteur) | ACP-204 | S : non relu mot à mot |

### 2.2 Test direct (lecture seule, sans clé, sans transaction) [V]

- Contrainte : mes outils ne permettent que des requêtes **GET** ; l'endpoint demandé `https://api.avax-test.network/ext/bc/C/rpc` renvoie **405** à un GET (il faut un POST JSON-RPC). J'ai donc utilisé l'API Etherscan-compatible de Routescan sur le réseau 43113, qui relaie `eth_call` : `https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api?module=proxy&action=eth_call&to=0x…0100&data=…&tag=latest`. **Ce n'est pas le RPC officiel Avalanche** ; à rejouer en POST (voir commande ci-dessous).
- Entrée : premier vecteur de `https://eips.ethereum.org/assets/eip-7951/test-vectors.json` lu par la page (Wycheproof « EcdsaP1363Verify SHA-256 #1 : signature malleability », 160 octets).
  - **Vecteur intact** → `"result":"0x0000…0001"` (**signature valide acceptée**).
  - **Même vecteur avec un chiffre du hash modifié** → `"result":"0x"` (**rejet**).
  - `eth_getCode(0x…0100)` → `0x` (normal pour un précompile).
- Conclusion [V] : **le précompile P-256 est actif sur Fuji** et se comporte comme EIP-7951/RIP-7212.
- À rejouer côté équipe, une ligne (POST, sans clé) :
  `curl -s -X POST https://api.avax-test.network/ext/bc/C/rpc -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x0000000000000000000000000000000000000100","data":"0x<320 hex>"},"latest"]}'`
- Non mesuré : le gaz réel consommé sur Fuji (`eth_estimateGas`), le coût total d'une assertion WebAuthn complète.

### 2.3 Contrats existants sur Fuji

| Élément | Constat | Q |
|---|---|---|
| Safe v1.4.1 singleton `0x41675C099F32341bf84BFc5382aF534df5C7461a` | Bytecode présent sur Fuji (`0x608060405236…`) ; cohérent avec le constat antérieur de `T1_P4_deploiement_reglementaire.md` | V |
| Safe `SafeWebAuthnSignerFactory` `0x1d31F259eE307358a26dFb23EB365939E8641195` et `DaimoP256Verifier` `0xc2b78104907F722DABAc4C69f826a522B2754De4` | Bytecode **présent** sur Fuji. Ces adresses viennent de ma mémoire de la doc Safe, non recoupées avec la table officielle ; la page « Supported Networks » de Safe (lue) **ne liste ni Fuji ni Avalanche** pour les passkeys | V pour présence ; **ÀV** pour l'identité exacte et la version (v0.2.0 ou v0.2.1) |
| `FCLP256Verifier` `0xA86e0054C51E4894D88762a017ECc5E5235f5DBA` | Bytecode présent ; même réserve | V / ÀV |
| Table officielle Safe passkeys (docs.safe.global) | Réseaux listés dans l'extrait : Arbitrum, Arbitrum Sepolia, Base, Base Sepolia, Ethereum | S |

Lecture [analyse] : on peut **déployer nous-mêmes** (CREATE2 déterministe) ou utiliser OpenZeppelin ; on ne dépend pas d'une liste officielle.

### 2.4 Bibliothèques

| Lib | Ce qu'elle fait | Source | Q |
|---|---|---|---|
| **OpenZeppelin Contracts 5.x `P256`** (disponible depuis **v5.1**) | `verify` : précompile RIP-7212 avec **repli Solidity** (plus de bytecode) ; `verifyNative` : précompile seul (revert si absent) ; `verifySolidity` | https://docs.openzeppelin.com/contracts/5.x/api/utils/cryptography | P (lu) |
| **OpenZeppelin `WebAuthn`** | Vérifie type `webauthn.get`, challenge, signature, présence utilisateur, UV optionnel, bits BE/BS. **Omet par conception** : origin, `rpIdHash`, compteur de signature, extensions, attestation | idem | P (lu) |
| Safe passkey module, Coinbase `webauthn-sol`, Daimo, FreshCryptoLib | Alternatives | liens §1.1 | S |

Conséquence [analyse] : si on veut lier la signature à **notre domaine** (anti-hameçonnage), il faut contrôler `rpIdHash`/origin nous-mêmes (hors lib OZ).

### 2.5 Architecture minimale démontrable [analyse]

1. `IntentGuard` (Safe Guard ou smart account avec hook) : accepte une sortie si (a) elle correspond à un **intent** `{client, token, montant, destination, nonce, deadline, chainId, verifyingContract}` signé par la clé enregistrée du client (EIP-712 ECDSA **ou** WebAuthn P-256 via le précompile), (b) nonce non utilisé et deadline valide, (c) montant dans le plafond du client **et** dans le plafond agrégé de la fenêtre.
2. `ClientRegistry` : clé publique par client, **avec délai (timelock) et quota d'enrôlements**, administré par quorum d'humains hors ligne (pas par le backend).
3. `Perimeter` : racine Merkle d'adresses internes (cold, warm, sweeps) signée par un quorum d'admins ; plafond séparé ; toute destination hors périmètre ET hors intent = revert.
4. Hold up : lit les `revert`/événements du garde, alerte, enregistre (DE.AE-02), abaisse les plafonds (RS.MI).
5. Lots : un retrait client = un intent ; pour des batches, le backend soumet un lot d'intents (ou une racine) ; la vérification est par feuille.
6. Sur Fuji uniquement, comptes de test, clients synthétiques (règle « aucune donnée réelle »).

Effort pour le hackathon [estimation de moi, non mesurée] : contrat de base + tests ~1 jour-worker ; l'interface de signature navigateur WebAuthn et le rejeu d'attaque ~0,5 jour. **Rappel du règlement** : le cœur du code s'écrit entre samedi 11h30 et dimanche 12h00 ; avant, seulement recherche et préparation.

---

## 3. Limites réelles

| # | Limite | Détail [analyse sauf mention] | Ce qui reste couvert |
|---|---|---|---|
| 1 | **Modèle omnibus** | Les fonds clients sont mélangés dans un hot wallet ; le garde ne voit pas les soldes internes du livre. Une signature prouve « une clé enregistrée demande X vers Y », **pas** que le client a le solde ni que la clé appartient à un vrai client KYC | Plafond par client et agrégé ; réconciliation avec le livre hors chaîne |
| 2 | **Enrôlement = nouveau point faible** | Un backend compromis peut enregistrer N **faux clients** avec leurs propres clés et signer N retraits. Perte maximale ≈ N × plafond | Timelock + quota d'enrôlement + plafond agrégé + alerte Hold up sur la croissance du registre ; registre administré par quorum humain |
| 3 | **Interface client compromise** (schéma Bybit au niveau client) | Une clé passkey signe un challenge ; WebAuthn **n'affiche rien** de ce que l'on signe (le texte vient de la page web). Si l'attaquant contrôle le front servi (pas seulement le backend), il fait signer une adresse de destination à lui | Liste d'adresses de retrait enregistrée par signature + délai de refroidissement ; appli native à affichage de confiance ; sinon limite non résolue. L'extension WebAuthn « transaction confirmation » existe sur le papier mais je ne l'ai pas vérifiée **[ÀV]** |
| 4 | **Compte client compromis** | Passkeys synchronisées (iCloud/Google) = phishing/vol de session possible. Le plafond par client borne le dommage unitaire ; un botnet de comptes volés le multiplie | Plafond agrégé, vélocité, détection comportementale |
| 5 | **Clients institutionnels via API** | Pas de téléphone : ils signent avec leur propre HSM/clé de service (EIP-712) enregistrée dans le registre ; compatible, plus simple, mais la clé API de l'institution reste une cible | Plafond par client institutionnel plus élevé, allow-list de destinations |
| 6 | **UX/latence** | Chaque retrait exige un geste de l'utilisateur sur son appareil ; retraits « en un clic » impossibles ; retraits différés (cold→hot) à rejouer ; clients à fort volume (bots de trading) exclus ou mis en mode plafond-seul | Mode « plafond seul » pour les flux automatisés |
| 7 | **Couverture technique** | Garde EVM seulement : BTC, SOL, TRON, etc. non couverts. Un Safe Guard **ne voit pas** les transactions de module (Module Guard à partir de Safe v1.5.0) ; un hot wallet MPC/EOA ne se laisse pas gardiennner on-chain. Il faut déplacer les fonds dans un compte intelligent (changement d'architecture lourd pour un CASP) | Moniteur + sas de repli sur les chaînes non-EVM |
| 8 | **Mouvements internes** | Cold→hot et sweeps : le périmètre est signé par des humains ; si l'attaquant pousse une adresse dans le périmètre (compromet l'enrôlement du périmètre), le plafond séparé borne la perte | Plafond interne distinct, délai de modification du périmètre |
| 9 | **Coût** | Précompile : 6 900 gas la vérification P-256 [P]. Le parsing WebAuthn et le hachage ajoutent du gaz non mesuré par moi ; le repli Solidity coûte beaucoup plus. Vérifier **chaque** retrait on-chain est coûteux à grande échelle ; alternative : vérifier un lot via une racine | Mesurer sur Fuji avant d'annoncer un chiffre |
| 10 | **Confidentialité / RGPD** | Publier clé client + montant + destination on-chain relie un pseudonyme à des flux ; la clé publique par client peut être une donnée personnelle selon le contexte (approche relative, arrêt SRB, `T1_P4_deploiement_reglementaire.md` §3) | Publier des engagements (hash/Merkle), garder les intents hors chaîne chez l'auditeur |
| 11 | **Travel Rule** | Le intent peut transporter un **hash** de la charge Travel Rule (identité, VASP destinataire) pour la lier à la signature, sans la mettre on-chain. Exigence réglementaire non couverte en soi [ÀV : pas lu le texte] | Processus Travel Rule existant |
| 12 | **Gouvernance / responsabilité** | Le garde et le registre font partie de la politique de garde du CASP (MiCA art. 75(3)) et du registre DORA art. 28(3) ; si le garde bloque à tort, c'est une indisponibilité du CASP. Fail-closed vs fail-open à décider | Mode de panne écrit |
| 13 | **Pas de preuve de sauvetage** | Aucun chiffre ne prouve que ce schéma aurait empêché Bitget ; il faudra un rejeu synthétique | À mesurer |

**Ce que le plafond seul couvre déjà** (D-004) : la perte maximale par fenêtre pour tous les scénarios ci-dessus. L'ajout de la preuve de demande apporte : (i) refus **dès la première** sortie fabriquée sous le plafond ; (ii) un signal net pour Hold up (« sortie sans intent »), au lieu d'un seuil statistique ; (iii) réduction du plafond utile (chaque client = son plafond, non un plafond global).

---

## 4. Verdict et formulation pour le jury

**Verdict : partiellement neuf.**

- *Déjà fait* : signature d'intention utilisateur vérifiée par un système en aval (Hyperliquid, StarkEx, Gnosis Pay, Safe/passkeys, Coinbase Smart Wallet) ; vérification P-256 on-chain (Safe, OpenZeppelin, précompile) ; plafonds journaliers on-chain (Gnosis Pay, Safe Allowance).
- *Non trouvé* : application à un **CEX/CASP omnibus** comme **garde indépendant du backend**, avec registre de clés clients, périmètre interne signé par quorum humain et plafonds client + agrégé. Confiance dans l'absence ~70 % ; je n'ai pas exploré les documents internes d'acteurs fermés (Anchorage, Coinbase Prime, Kraken Custody), ni la recherche académique en profondeur.
- *Pas neuf du tout* : l'idée de fond « vérifier l'intention en aval » (c'est le principe du clear signing et des intents).

**Formulation honnête (à répéter à l'oral)** :

> « Les exchanges font déjà signer leurs utilisateurs quand ils sont non-custodial, et Safe ou Coinbase vérifient des passkeys on-chain. Ce que nous n'avons pas trouvé, c'est un exchange ou un custodian dont le hot wallet refuse de payer sans une demande signée par le client final, vérifiée par un contrat que le backend ne contrôle pas. Nous transposons ce schéma du non-custodial vers la garde omnibus. Il n'arrête pas les faux clients enregistrés par un backend compromis, ni un front compromis, ni les chaînes non-EVM : c'est pour cela qu'il s'ajoute à un plafond agrégé et à Hold up, il ne les remplace pas. »

À éviter : « nouveau », « inédit », « inviolable », « aurait empêché Bitget ».

**Pourquoi c'est tout de même défendable** : le principe de D-004 (« limite de sortie indépendante du circuit d'approbation compromis ») est renforcé en passant d'une limite statistique à une **preuve d'origine** ; c'est lisible en 30 s ; et c'est démontrable sur Fuji (précompile actif [V]).

**Risque stratégique** [analyse] : la partie chère est le registre et le périmètre, pas la signature. Si le temps manque, il vaut mieux démontrer : (1) un backend simulé compromis qui envoie 100 retraits fabriqués → 100 reverts ; (2) un retrait légitime signé passkey → passe ; (3) l'attaque sybil → bornée par le quota + plafond agrégé, montrée honnêtement comme limite.

## 5. Mapping (règlement : NIST CSF 2.0 + au moins un référentiel)

IDs à recontrôler sur les sites officiels ; non revérifiés aujourd'hui.

| Fonction du produit | NIST CSF 2.0 | MITRE ATT&CK | MITRE D3FEND | OWASP Agentic / ATLAS |
|---|---|---|---|---|
| Garde on-chain : sortie refusée sans intent signé | **PR.AA-03** (authentification des utilisateurs/services), **PR.AA-05** (permissions, moindre privilège), PR.DS-06 (intégrité) | T1565.002 (manipulation de données transmises), T1657 (vol financier), T1078 (comptes valides) [ÀV] | D3-AZET (seuil d'autorisation) et D3-MFA [déjà notés dans le fichier d'intégration, ÀV] | Non applicable (aucun agent IA) |
| Alerte sur revert / sortie sans intent | **DE.AE-02** (analyse des événements), **DE.CM-01** (surveillance) | T1657 | D3-UBA / D3-OTF [ÀV] | n/a |
| Abaisser les plafonds, retenir | **RS.MI-01/02** (confinement), RS.MA-01 | T1657 | D3-AZET | n/a |
| Registre et périmètre : gouvernance par quorum | GV.RR (rôles), PR.AA-05 | T1199 / T1195 (accès via tiers / chaîne d'approvisionnement) [ÀV] | n/a | n/a |

Note : cette idée est surtout **Protect** ; pour viser Detect/Respond comme le règlement le demande, c'est Hold up qui lit les rejets du garde et réagit. À écrire ainsi dans le frontmatter de la tâche, pas l'inverse.

## 6. À vérifier

1. Rejouer l'`eth_call` en POST sur le RPC officiel Fuji ; mesurer `eth_estimateGas` d'un `P256.verify` et d'une assertion WebAuthn complète.
2. Identité exacte et version des contrats passkey de Safe (les adresses de §2.3 viennent de ma mémoire de la doc, bytecode présent seulement).
3. Citation exacte du CEO Bitget (« sans passer par des demandes de retrait clients ») : source presse résumée.
4. Date d'activation mainnet de Granite (extrait de la doc Avalanche, pas rouverte) ; le champ « Activated » de l'ACP.
5. Recherche académique (IACR ePrint, FC, CCS) et documents d'Anchorage/Coinbase Prime/Kraken Custody : non faits.
6. Extension WebAuthn de confirmation de transaction : support réel en 2026.
7. IDs NIST/ATT&CK/D3FEND (§5).
8. Contenu du flux dev.to cité en §1.1 : article non identifié, valeur faible.

## Sources principales

- ACP-204 : https://docs.avax.network/docs/acps/204-precompile-secp256r1
- Granite : https://docs.avax.network/blog/granite-upgrade ; https://docs.chainstack.com/docs/avalanche-granite-upgrade
- EIP-7951 : https://eips.ethereum.org/EIPS/eip-7951 ; vecteurs : https://eips.ethereum.org/assets/eip-7951/test-vectors.json
- RIP-7212 : https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md
- OpenZeppelin P256/WebAuthn : https://docs.openzeppelin.com/contracts/5.x/api/utils/cryptography
- Safe passkeys : https://docs.safe.global/sdk/signers/passkeys ; https://docs.safe.global/home/passkeys-safe ; https://docs.safe.global/home/passkeys-supported-networks
- Test Fuji : API Routescan 43113 (`api.routescan.io/v2/network/testnet/evm/43113/etherscan/api?module=proxy…`)
- Hyperliquid : https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2
- StarkEx : https://docs.starkware.co/starkex/perpetual/perpetual-trading-forced-withdrawal-and-forced-trade.html
- Gnosis Pay : https://docs.gnosispay.com/gp-onchain/daily-limit
- Fireblocks : https://support.fireblocks.io/hc/en-us/articles/8744575638044-About-the-Fireblocks-mobile-app ; https://community.fireblocks.com/t/end-user-transaction-approval-process-in-fireblocks-ncw-implementation/2268
- Bitget : https://investinglive.com/cryptocurrency/bitget-hack-attackers-faked-transfers-not-keys-as-ceo-points-to-north-korea/ ; https://crypto.news/bitget-probe-points-to-backend-breach/ ; https://www.electronicpaymentsinternational.com/newsletters/bitget-to-resume-withdrawals-after-crypto-hack/
- Bybit : https://a16zcrypto.com/posts/article/bybit-hack-lessons
- Vaults : https://arxiv.org/pdf/2005.11776 ; https://checksig.com/CheckSig-Bitcoin-Custody-Protocol-January-2023.pdf

# Exchanges et CASP : peut-on adopter un contrôle des sorties indépendant SANS migrer les fonds ? (10 oct. 2026)

Périmètre : question décisive de Hold up. Lu avant : `research/tracks/T1_P4_connecteurs_implementes.md`, `research/tracks/T1_P4_deploiement_reglementaire.md`, `research/cap/jury_aveugle_2315.md`. Règlement : `context/notion_guide.md` (prime).

Légende : **[P]** page éditeur/officielle ouverte et lue aujourd'hui ; **[S]** secondaire (presse, blog, agrégat) ; **[V]** vérifié par test direct (aucun dans ce fichier : je n'ai exécuté aucun appel) ; **[ÀV]** à vérifier ; **[?]** introuvable, ne pas affirmer ; **[analyse]** mon raisonnement, pas un fait sourcé. Les sorties de moteur de recherche sont des extraits : les pages marquées [P] ont été ouvertes avec WebFetch, les autres sont [S] ou [ÀV].

---

## 0. TL;DR

1. **Oui, techniquement, sans migrer un euro : par le callback du custodian** (Fireblocks API Co-Signer, BitGo règle webhook). Le client héberge un serveur HTTPS, le custodian l'appelle avant de signer, refus = pas de signature [P]. Cela couvre BTC, XRP, TRX, ZEC, SOL, EVM, Cosmos, TON… côté données de transaction brutes (`rawTx`, option à activer via le support, **non fournie dans l'environnement cloud UE de Fireblocks** [P]).
2. **Mais le segment « exchange qui garde en interne » n'est pas adressable à court terme** : Bitget (hot/warm sur 11 chaînes), DMM, CoinDCX, Phemex, BingX n'ont, dans les sources trouvées, **aucun custodian tiers nommé sur leur chemin de retrait** ; Bybit et WazirX étaient des Safe EVM (pas de callback de type Fireblocks). Seuls ceux qui passent par Fireblocks/BitGo ont un point d'insertion.
3. **Aucun partenariat existant « logique tierce dans le callback » n'est documenté.** Hypernative cite Fireblocks sur sa page produit sans détail [P]. Blockaid–Fireblocks = dApp Protection (2024) et propositions de transactions (mai 2026), qui ne bloquent pas [P]. Chainalysis/Elliptic/TRM sont natifs (un seul fournisseur par espace de travail) [P]. Le callback est un trou de conception ouvert, pas une place de marché.
4. **Nombre de clients qui utilisent le callback : non publié [?]**. Fireblocks annonce « plus de 2 400 institutions » [S], le callback n'en est qu'une option.
5. **Verdict** : voie réaliste = un serveur de politique « compatible callback Fireblocks/BitGo », vendu à des CASP/fonds déjà chez ces custodians, avec le mode Watch multi-chaînes comme porte d'entrée. Pas « sauver Bitget ». Poids du segment exchanges en garde interne : énorme en valeur (225,4 Md$ de réserves sur 12 exchanges [S]) mais **fermé** ; les trésoreries on-chain (~25 Md$ DAO, ~24 à 31 Md$ RWA [S]) sont dix fois plus petites mais **ouvertes**.

---

## 1. Qui utilise quoi

### 1.1 Les 7 incidents cités : garde au moment du vol

| Plateforme | Date, perte | Infrastructure de garde au moment du vol | Point d'insertion custodian ? | Fiabilité |
|---|---|---|---|---|
| **Bitget** | 24-25 sept. 2026, 387,5 M$ (première estimation 351,6 M$) | **Aucun custodian tiers nommé.** BleepingComputer : « the article does not name a custody provider ». Mandiant : accès aux « appliances de sécurité tierces » A et B, web shell sur B, rebond vers le « production wallet job server » où des paquets malveillants sont déployés. SlowMist : outil de retrait sur mesure qui « forge risk-control parameters, builds withdrawal requests, triggers the withdrawal process ». Clés privées et cold wallets déclarés non compromis. Partenariats Bitget connus mais **hors chemin de retrait** : Cobo SuperLoop (règlement hors exchange, sept. 2023) et Copper ClearLoop (liste de 2024). | Rien de prouvé. Hot/warm manifestement opérés par Bitget (système « wallet job server » maison) [analyse]. | [S] https://bleepingcomputer.com/news/security/hackers-steal-3516-million-in-bitget-crypto-exchange-hack ; [S] https://www.rescana.com/post/bitget-cryptocurrency-exchange-breach-387-5m-stolen-via-zero-day-exploit-in-third-party-security-products ; [S] https://cointelegraph.com/news/bitget-hack-zero-day-slowmist-investigation ; [S] https://news.cobo.com/bitget-and-cobo-join-forces-to-elevate-crypto-asset-security-and-efficiency/ ; [S] https://www.theblock.co/post/301426/crypto-exchange-kraken-adds-support-for-coppers-clearloop |
| **Bybit** | 21 févr. 2025, ~401 347 ETH (~1,4 Md$) | **Cold wallet = Safe{Wallet} multisig Ethereum**, interface web compromise (JS injecté dans un bucket S3). Réseau de partenaires de garde annoncé en 2025 : Fireblocks, Copper, Cactus, Sygnum (Bybit, sept. 2025) mais **pas sur ce cold wallet**. | Aucun callback de type Fireblocks sur un Safe. Analogue = Guard Safe. Cobo (vendeur) affirme qu'un co-signataire « aurait pu arrêter » le vol : affirmation commerciale non vérifiée. | [S] https://www.nccgroup.com/research/in-depth-technical-analysis-of-the-bybit-hack/ ; [S] https://certora.com/blog/bybit-hack-multisig-wallet-security ; [S] https://www.cobo.com/post/the-bybit-breach-why-multi-sig-alone-isn-t-enough ; [S] https://copper.co/insights/company-news/bybit-strengthens-custodial-services-for-institutional-investors |
| **WazirX** | 18 juil. 2024, ~230 M$ | **Safe multisig 6 signataires** (5 WazirX + 1 Liminal ; 4 sur 6 selon une source), **créé avant** l'arrivée chez Liminal puis « importé » dans la plateforme Liminal. Liminal affirme : wallet « self-custody », il ne peut jamais initier une transaction. Rapport forensique tiers (Grant Thornton cité) : pas de faille Liminal ; Mandiant : pas de compromission des 3 portables. Attaque = mise à jour du contrat vers une version malveillante via signatures obtenues sur une transaction d'apparence normale (analyse Mudit Gupta citée par Rekt : [S], non confirmé). WazirX a rompu avec Liminal (14 août 2024), puis Zodia Custody (mars 2025). | Liminal a une couche « Firewall » (règles avant diffusion) [S] ; mais un contrôle de politique sur « transfert » ne voit pas une montée de version si le calldata n'est pas décodé [analyse]. | [S] https://the-web3-telegraph-newsletter.beehiiv.com/p/wazirx-exploit-dissecting-breach-blame ; [S] https://rekt.news/wazirx-rekt ; [S] https://cryptoslate.com/liminal-cleared-by-independent-security-audit-after-wazirx-breach-no-vulnerabilities-found/ ; [S] https://www.business-standard.com/markets/news/wazirx-partners-with-zodia-custody-as-custodian-ahead-of-creditor-voting-125031700981_1.html |
| **DMM Bitcoin** | mai 2024, 4 502,9 BTC (~308 M$) | **Ginco** (éditeur de logiciel de portefeuille japonais) : FBI/NPA/DC3 (24 déc. 2024) : session d'un employé Ginco détournée, « likely used this access to manipulate a legitimate transaction request by a DMM employee ». TraderTraitor/Lazarus. | La demande de transaction légitime a été altérée **chez le fournisseur de logiciel de garde**. Un contrôle indépendant sur destination/montant aurait vu le changement [analyse]. | [S] https://www.bleepingcomputer.com/news/security/fbi-links-north-korean-hackers-to-308-million-crypto-heist ; [S] https://thehackernews.com/2024/12/north-korean-hackers-pull-off-308m.html |
| **CoinDCX** | 18-19 juil. 2025, ~44 M$ | Compte « opérationnel » interne servant à la liquidité sur un exchange partenaire, compromis par une « attaque sophistiquée sur le serveur » ; wallet « non tagué » hors preuve de réserves selon une source. Clés privées : une source secondaire le suggère, **non confirmé officiellement**. Custodian : **[?]**. | Inconnu. | [S] https://forklog.com/en/coindcx-exchange-suffers-44-million-hack/ ; [S] https://www.crowdfundinsider.com/?p=246185 |
| **BingX** | 20 sept. 2024, 26,7 à 52 M$ selon l'estimateur | Hot wallet sur plusieurs chaînes, « tiered asset management ». Custodian : **[?]** (aucune source ne le dit). Halborn : pattern général de hot wallets à clé unique, **pas un constat BingX**. | Inconnu. | [S] https://forklog.com/en/bingx-cryptocurrency-exchange-hacked-losses-exceed-43-million/ ; [S] https://halborn.com/blog/post/explained-the-bingx-hack-september-2024 |
| **Phemex** | 23 janv. 2025, ~70 M$ (jusqu'à 85 M$ selon source) | Hot wallets sur 16 chaînes selon un tracker ; vecteur non publié ; Halborn infère des clés compromises (inférence). Custodian : **[?]**. | Inconnu. | [S] https://forklog.com/en/phemex-exchange-hack-losses-exceed-70-million-north-korean-hackers-suspected/ ; [S] https://www.halborn.com/blog/post/explained-the-phemex-hack-january-2025 |

**Lecture [analyse]** : sur 7 incidents, **2 étaient des Safe EVM** (Bybit, WazirX), **1 chez un éditeur de logiciel de garde** (DMM/Ginco), **1 hot wallet maison documenté en partie** (Bitget), **3 sans information de garde** (CoinDCX, BingX, Phemex). Aucun n'est documenté comme client Fireblocks-avec-callback ou BitGo-avec-webhook. Le fait que les jurys aient dit « les grosses plateformes ont déjà Fireblocks » n'est **pas étayé** par ces incidents.

### 1.2 Exchanges et CASP : ce qui est établi (liste partielle, pas un top 30 complet)

Je n'ai **pas** établi la garde des 30 premiers exchanges ; ne pas présenter ce tableau comme exhaustif.

| Acteur | Ce qui est établi | Fiabilité |
|---|---|---|
| **Bitvavo** (NL, MiCA) | Utilise Fireblocks pour la gestion de clés et les outils de transaction (dépôts/retraits clients) et les flux de trésorerie, avec « authorization policies » ; « Bitvavo remains responsible for safeguarding customer assets ». Page datée du 28 sept. 2026. **Le moteur de politique n'est pas nommé comme utilisé**, encore moins le callback. | [P] https://www.fireblocks.com/customers/bitvavo ; [S] https://bitvavo.com/en/news/bitvavo-joins-fireblocks-network |
| **Binance.US** | Intègre Fireblocks (dépôts, retraits, staking) ; mais cf. dispute Ceffu/Binance Holdings. Binance global : custody maison/Ceffu (ancien « Binance Custody », entité séparée en restructuration, 2023) : non résolu. | [S] https://blog.binance.us/fireblocks-announcement/ ; [S] https://www.ceffu.com/blog/clarifications-to-recent-statements-concerning-ceffu-custody-services |
| **Crypto.com, Coinbase International, Revolut** | Cités comme utilisateurs de Fireblocks par un seul rapport 2026 : **[ÀV]**, pas de confirmation primaire. Coinbase Custody (trust NY) a sa propre infrastructure de cold storage. | [S] (rapport cité par la recherche, URL non conservée) ; [S] sec.gov 424B3 Bitwise 10 (2026) |
| **Kraken** | Custody « in-house », MPC et HSM pour clés et application de politiques selon un responsable institutionnel (propos rapportés) ; ClearLoop de Copper pris en charge (MTF). | [S] https://cointelegraph.com/news/kraken-custody-expands-uk-australia ; [S] https://www.theblock.co/post/301426/crypto-exchange-kraken-adds-support-for-coppers-clearloop |
| **Bitpanda** (AT/UE) | Custody **maison** (Trustology acquis, rebaptisé Bitpanda Custody). Aucun lien Fireblocks trouvé. | [S] https://www.fintechfutures.com/?p=15246476 |
| **OKX, Deribit, Bybit, Bitget, Gate, Bitfinex…** | Intégrations **Copper ClearLoop** (règlement hors exchange, soldes miroirs) : ce n'est **pas** la garde du hot wallet de retrait de l'exchange. | [S] https://copper.co/insights/company-news/copper-partners-with-okx-and-expands-clearloop-integrations-to-bolster |
| **Bitstamp, Gate, HTX, KuCoin…** | Partenaires « Go Network » de BitGo (règlement hors exchange, cycle ~24 h) : même remarque. | [S] https://www.bitgo.com/newsroom/press-releases/leading-exchanges-join-bitgos-go-network-to-create-a-safer-and-more |
| **Deribit, eToro** | Fireblocks cité (anciens articles) ; Deribit pour Off Exchange (nov. 2023). | [S] https://www.unlock-bc.com/en/fireblocks-crypto-custodian-raises-550-million-usd |

### 1.3 Parts de marché des custodians (chiffres)

| Custodian | Chiffre | Fiabilité |
|---|---|---|
| Fireblocks | « plus de 2 400 institutions », « plus de 10 000 Md$ » transférés (janv./avr. 2026) ; 150 blockchains (annonce du 3 févr. 2026, +46 en 2025). Une autre source donne 14 000 Md$ : divergence. | [S] https://cryptoactu.com/entreprise/fireblocks/ ; [S] https://blockchain.news/news/fireblocks-150-blockchain-integrations-2025-expansion |
| BitGo | 186 des 250 premiers actifs (T1 2026) ; S-1 : ~90,3 Md$ au 30 juin 2025, plus de 4 600 entités ; une source de janv. 2026 : 104 Md$ et plus de 1 500 clients institutionnels (comptes non comparables). | [S] https://cointelegraph.com/news/bitgo-us-ipo-crypto-custody-90b-assets ; [S] https://www.bitgo.com/resources/blog/unmatched-asset-coverage-across-the-top-250/ |
| Fordefi | Acquis par Paxos (25 nov. 2025, >100 M$ rapporté) ; « 90+ chaînes » (texte Paxos). | [S] https://www.theblock.co/post/380375/stablecoin-issuer-paxos-acquires-fordefi-crypto-custody-wallet |
| Cobo, Copper, Ledger Enterprise, Liminal | Pas de nombre de clients exploitable trouvé. | [?] |
| CASP agréés MiCA | 321 sur le registre ESMA au 31 juil. 2026 (rapport de presse, vérifier le registre) ; pas de décompte « avec garde ». | [S] https://cointelegraph.com/news/mica-register-expands-third-post-deadline-update |

---

## 2. Points d'insertion réels

| Custodian | Mécanisme | Ce que le tiers voit | Latence / panne | Source |
|---|---|---|---|---|
| **Fireblocks API Co-Signer, Callback Handler** | Serveur HTTPS du client (cloud ou sur site), `POST /v2/tx_sign_request`, JWT RS256 entrant (clé du co-signer) et JWT signé sortant (clé RSA 2048 du handler). Réponses : `APPROVE`, `REJECT`, `RETRY`, `IGNORE` (approbations seulement). Champs : `txId`, `operation`, `asset`, `amount`, `fee`, `destAddress`, `destinations[]`, `signerId`, `players`, `note`, `extraParameters`. | `rawTx` (payload brut) à l'étape de signature, **opt-in via le support**, **absent en cloud UE**. | **30 s sans réponse = échec de la demande** (fail-closed). `RETRY` : la page d'architecture dit « fails », l'ancienne note de l'équipe parlait de 20 × 3 min : **le comportement reste [ÀV]**, la page de référence `automated-signer-callback` renvoie 404. **Sans callback configuré, le co-signer signe tout** pour cet utilisateur API. **Aucune mesure de latence publiée [?].** | [P] https://developers.fireblocks.com/docs/cosigner-architecture-overview ; [P] https://developers.fireblocks.com/reference/approve-transactions ; [S] https://developers.fireblocks.com/reference/response-object |
| **BitGo, règle webhook** | POST vers l'URL du client à chaque retrait ; 200 = continue ; autre code = action de la règle (refus, ou attente d'approbation d'un utilisateur désigné). Corps : wallet, montant, sorties. Politique appliquée à toutes les pièces si le champ coin est omis. | Montant, sorties, wallet. | Pas de délai chiffré : « timely response », BitGo peut réessayer (idempotence nécessaire) ; cas d'un endpoint injoignable non décrit. Les transactions de récupération (clé utilisateur + clé de secours) **contournent** toutes les politiques. | [P] https://developers.bitgo.com/docs/policies-webhook ; [P] https://developers.bitgo.com/docs/policies-overview |
| **Copper** | Aucune doc de callback trouvée. | | | [?] |
| **Cobo (Argus, co-signer)** | Cobo propose un **service de co-signature Safe** (une clé de signataire, listes blanches/noires, contrôle des appels de contrat, restrictions de paramètres) et Argus (couche de gestion de risque DeFi sur Safe). Contenu = marketing du vendeur. | | | [S] https://www.cobo.com/post/the-bybit-breach-why-multi-sig-alone-isn-t-enough |
| **Liminal** | Couche « Firewall » (règles avant diffusion) ; point d'insertion tiers **non documenté [?]**. | | | [S] https://solanacompass.com/projects/liminal |
| **Fordefi** | Policy engine propre, intégration avec Hypernative annoncée (17 sept. 2024) et propositions de transactions Blockaid (mai 2026). API du moteur de politique : non lue. | | | [S] https://hypernative.io/blog/fordefi-and-hypernative-partner-on-an-integrated-wallet-and-real-time-security-offering ; [P] https://blockaid.io/blog/blockaid-adds-automated-transaction-proposals-to-onchain-monitoring-for-fireblocks-and-fordefi |
| **Turnkey** | Moteur de politique dans une enclave AWS Nitro, JSON déterministe, pour **Ethereum, Solana et TRON** (article du 20 nov. 2025, modifié le 24 sept. 2026) ; recommande de concevoir en fail-closed. **Pas de webhook de veto par un tiers** documenté : les politiques sont écrites par le développeur. Bitcoin : pas de support de politique trouvé. | | | [P] https://www.turnkey.com/blog/turnkey-policy-engine-guardrails-web3-transactions |
| **Safe (Guard)** | `checkTransaction` / `checkAfterExecution` ; Module Guard en v1.5.0. | | | `research/tracks/T1_P4_deploiement_reglementaire.md` §1.3 |

**Un tiers peut-il fournir la logique du callback ? Partenariats existants :**

| Partenariat | Ce que j'ai trouvé | Verdict |
|---|---|---|
| **Fireblocks + Chainalysis / Elliptic / TRM** | Intégrations **natives** (Chainalysis : testnet+mainnet ; Elliptic : mainnet ; TRM : accès anticipé). **Un seul fournisseur AML/KYT par espace de travail**, changement via le support. | [P] https://developers.fireblocks.com/docs/integrating-third-party-aml-providers |
| **Fireblocks + Blockaid** | dApp Protection (24 avr. 2024) : alerte sur phishing et dApps compromises, **pas un veto sur retrait**. Mai 2026 : Blockaid propose des transactions dans le flux TAP quand un moniteur se déclenche, « only proposes ». | [P] https://fireblocks.com/blog/fireblocks-expands-defi-security-capabilities-to-protect-institutions-from-ever-evolving-threats/ ; [P] https://blockaid.io/blog/blockaid-adds-automated-transaction-proposals-to-onchain-monitoring-for-fireblocks-and-fordefi |
| **Fireblocks + Hypernative** | Seule trace : la page produit d'Hypernative liste Fireblocks parmi les infrastructures connectables, **sans détail**. Pas d'annonce Fireblocks, pas de doc. L'ancien fichier de l'équipe disait « par API ». | [P] https://hypernative.io/hypernative-difference : **« partenariat » non établi** |
| **Callback Handler + fournisseur AML tiers** | La doc Fireblocks décrit le pattern « Callback Handler reçoit la transaction, interroge votre fournisseur, vous écrivez la logique accept/reject ». | [S] extrait de recherche de https://developers.fireblocks.com/docs/integrating-third-party-aml-providers (non retrouvé à l'ouverture) : **[ÀV]** |
| **Marketplace Fireblocks pour logique de callback** | Aucune trouvée. | [?] |
| **Forta, Venn, Hexagate** | Aucun lien Fireblocks trouvé. Hexagate racheté par Chainalysis (annonce 18 déc. 2025, selon une recherche : **[ÀV]**). | |

Conclusion : **il n'existe pas de précédent publié d'un tiers sécurité qui vend la logique du callback.** Deux lectures : espace libre, ou aucun client n'en veut. Sans client pilote, on ne sait pas laquelle.

---

## 3. Couverture multi-chaînes

- **Fireblocks, `rawTx` dans le callback [P]** (https://developers.fireblocks.com/reference/approve-transactions) : ADA, BTC, DASH, DOGE, LTC, BSV, BCH, XEC, **ZEC**, chaînes EVM, toutes les chaînes Cosmos, **SOL**, XLM, XTZ, **TRX**, NEAR, **XRP**, TON. Donc BTC, XRP, TRX, ZEC, SOL : **oui**. Non listés : Algorand, Celestia (basée sur Cosmos SDK : inférence [ÀV]), ainsi que les chaînes récentes. Pour celles-ci, le callback reçoit au moins l'actif, le montant, l'adresse de destination (champs génériques ; pas de preuve du contraire, pas de preuve que tous les champs sont toujours remplis).
- **Calldata** : `contractCallData` pour `CONTRACT_CALL` (ABI Ethereum) ; validation de `rawTx` documentée seulement pour **ETH** (page « Validate ETH raw transactions ») [P]. La règle sémantique « refuse delegatecall/upgrade » est donc EVM-seulement [analyse].
- **Politique native Fireblocks (TAP)** : « s'applique à toutes les transactions créées depuis la console ou l'API » ; pas de liste par chaîne trouvée [S/ÀV].
- **Nombre de chaînes** : Fireblocks 150 (annonce 3 févr. 2026) [S] ; Fordefi 90+ [S] ; BitGo 186 des top-250 actifs, 1 400+ actifs au S-1 [S] ; Turnkey politique sur 3 familles (EVM, Solana, TRON) [P].
- **BitGo** : la page webhook ne liste pas de pièces (règle applicable à toutes si le champ est omis) [P] : **couverture réelle des chaînes non documentée**.
- **Contraste avec le prototype** : notre coffre est Avalanche seulement. Le callback, lui, est agnostique de la chaîne **pour destination et montant**. C'est l'atout principal contre le défaut « une seule chaîne » des jurés.

---

## 4. Le cas Bitget (et Bybit, WazirX) : un callback aurait-il vu les retraits ?

**Bitget** [analyse sur faits sourcés] :
1. Le vol a utilisé « high-level internal credentials » et un outil qui **forge les paramètres de contrôle de risque et déclenche le processus de retrait** (SlowMist). La chaîne est : appliances de sécurité → serveur « wallet job » → logique de retrait. Les clés n'ont pas été volées selon Bitget : **un signataire a signé**. Quelque chose d'automatique a donc approuvé et signé.
2. **Si** le signataire de ces hot/warm wallets était un co-signer Fireblocks avec callback, le callback aurait reçu chaque transfert (destination, montant, actif) pendant les ~2 h 52 sur 11 chaînes [S, SlowMist/Mandiant] ; une règle « destination hors liste connue + plafond cumulé » les aurait refusés dès le premier gros transfert. **Condition** : le callback doit avoir un état et une liste que l'attaquant ne peut pas modifier depuis le même réseau. Un attaquant avec accès au serveur de job pourrait aussi atteindre le serveur callback s'ils partagent identifiants ou réseau [analyse].
3. **Mais rien ne prouve que Bitget avait un custodian tiers** : le document source ne nomme aucun fournisseur de garde [S]. Cobo SuperLoop et Copper ClearLoop sont des offres de règlement hors exchange, pas le hot wallet de retraits. **Réponse honnête : on ne sait pas, et l'indice (système wallet maison) va plutôt vers « non ».**
4. Les chaînes touchées : 11, dont XRP Ledger (la plus grosse perte), Zcash, TRON. Le callback Fireblocks couvre XRP, ZEC, TRX avec `rawTx` [P] ; un coffre Avalanche ne couvre rien de cela.

**Bybit** : cold wallet Safe, signataires humains avec appareil matériel, interface falsifiée. Un callback Fireblocks n'existe pas dans ce montage. Un Guard Safe qui refuse un `delegatecall` vers une adresse non listée aurait bloqué l'exécution (cf. §4.3 de `T1_P4_deploiement_reglementaire.md`, **à tester**, non prouvé) [analyse]. Cobo affirme la même chose pour son co-signer : source vendeur.

**WazirX** : Safe 6 signataires dont un co-signer Liminal. La transaction malveillante était une **mise à jour du contrat** présentée comme un transfert USDT. Le co-signer a signé (Rekt, [S] non confirmé). Un contrôle indépendant du **type d'opération** (upgrade/delegatecall) était nécessaire ; un contrôle « montant + destination » ne suffit pas [analyse].

**Enseignement** : sur 3 cas, le contrôle utile est **sémantique et indépendant de l'interface de l'opérateur** : destination/montant pour Bitget, nature de l'opération pour Bybit et WazirX. Le callback le permet seulement là où il existe.

---

## 5. Signature client : qui le fait ?

| Plateforme | Ce qui existe | Fiabilité |
|---|---|---|
| **Crypto.com** | Passkey utilisable pour valider les retraits (sinon 2FA + OTP SMS) ; liste blanche obligatoire pour toute nouvelle adresse ; verrou de 24 h sur les nouvelles adresses (recommandé). | [P] https://help.crypto.com/en/articles/2500695-crypto-withdrawals-general-information |
| **Binance** | Réglage « vérifier par passkey pour les opérations importantes » dont les retraits (blog tiers). | [S] https://www.corbado.com/blog/binance-passkeys.md : **[ÀV]** |
| **MEXC** | Retrait validé par biométrie du passkey, sans autre 2FA. | [S] https://www.mexc.com/learn/article/what-is-a-passkey-/1 |
| **OKX** | Si un passkey est actif, au moins un doit rester ; réinitialisation par autre moyen = suspension des retraits 24 h. | [S] Corbado FAQ, https://www.corbado.com/faq/crypto-passkeys |
| **Bybit, Coinbase, Kraken** | Passkeys pour connexion/2FA ; rôle dans le retrait non établi. | [ÀV] |
| **Gemini, Bitpanda** | Preuve de propriété d'adresse (petit dépôt de test, signature de message) pour portefeuilles auto-hébergés (Travel Rule, Bitpanda au-dessus de 1 000 €). C'est la signature d'**adresse**, pas d'un retrait. | [S] https://support.gemini.com/hc/en-us/articles/35431838814747 ; https://support.bitpanda.com/hc/articles/27325159274012 |
| **Hyperliquid, Orderly, Derive** | Retrait signé en EIP-712 par l'utilisateur : modèle **de bourses décentralisées/hybrides**. | [S] https://docs.blockpi.io/build/api-reference/hyperliquid/exchange/withdraw |

**Aucun exchange centralisé trouvé qui fasse signer cryptographiquement le contenu de la demande de retrait (adresse + montant) par le client.** Le passkey de Crypto.com/MEXC authentifie la personne ; l'article ne dit pas qu'il lie la signature aux champs du retrait. **[ÀV]**.

Ce qui l'empêcherait [analyse, non sourcé] : (1) le retrait d'un CEX est une écriture de registre interne, pas une transaction signée par le client ; (2) retraits fiat, par lot, programmatiques par API ; (3) friction de produit ; (4) si le backend est compromis, il affiche à l'utilisateur ce qu'il veut (blind signing, comme Bybit) ; (5) l'enrôlement de la clé du client est le point faible : un backend compromis peut enrôler la sienne. Ces points rejoignent les défauts relevés par 7 des 8 juges aveugles (`research/cap/jury_aveugle_2315.md`). Pour un CASP, c'est un projet de refonte de produit, pas une brique.

---

## 6. Verdict honnête

### 6.1 Les exchanges sont-ils une cible à court terme ?

**Réponse courte : non pour les exchanges à garde interne ; oui, étroitement, pour les CASP déjà chez un custodian à callback ; et pas dans les 36 h.**

| Chemin | Faisabilité | Ce qui manque |
|---|---|---|
| **A. Serveur de politique compatible Fireblocks/BitGo, hébergé par le client** | Réaliste : prototypes déjà prouvés « compatibles avec le format documenté » (Fireblocks 13 contrôles, BitGo 5 cas, 0,5 j chacun) mais **jamais appelés par un vrai Fireblocks/BitGo** (`T1_P4_connecteurs_implementes.md`). | Un client avec un espace de travail ; la confirmation du `RETRY` ; rawTx absent en cloud UE ; qualification DORA du prestataire. |
| **B. Mode Watch multi-chaînes (lecture seule sur adresses déclarées)** | Immédiat, aucune migration, aucun contrat. Alerte, dossier DORA. | Ne bloque rien. |
| **C. Coffre + signature client chez l'exchange** | Irréaliste (§5). | Refonte du modèle de retrait. |
| **D. Partenariat avec un custodian pour devenir « moteur de politique » du callback** | Aucun précédent trouvé. Hypernative cite Fireblocks sans détail ; la porte est ouverte mais personne ne l'a franchie publiquement. | Un partenaire côté Fireblocks/BitGo/Fordefi ; temps long. |

Limites à dire tel quel :
1. **Le callback ne protège que ce qui passe par le co-signer.** BitGo : les transactions de récupération contournent les politiques ; Fireblocks : sans callback configuré, tout est signé.
2. **Notre serveur devient un point de panne.** 30 s sans réponse = échec du retrait côté Fireblocks : notre panne = panne de retrait du CASP (fail-closed). Il faut un mode de panne écrit (cf. réglementaire §1.3).
3. **Pas de preuve de demande** (nous ne sommes pas sûrs qu'un client en veuille) : 0 client pilote, 0 appel d'un vrai custodian.
4. **Le cas Bitget n'est pas prouvé relevant** : aucun custodian nommé. L'honnêteté impose : « un callback aurait vu les retraits **s'il avait été en place** », pas « aurait protégé Bitget ».
5. **Détection hors EVM** : règle destination+montant oui ; règle « upgrade/delegatecall » EVM seulement [P pour ETH].

### 6.2 Poids du segment

| Segment | Valeur | Nombre | Accès | Source |
|---|---|---|---|---|
| Réserves des 12 premiers exchanges (CoinGecko, fin févr. 2026) | **225,4 Md$** (Binance 93,4 Md$ dans cette base ; autre méthode : Binance ~155,6 Md$, OKX 31,3 Md$) | 12 | **Fermé** : garde interne ou custodian, pas de chemin de callback établi | [S] https://www.coingecko.com/research/publications/spot-centralized-exchanges-report-2026 ; https://tangem.com/en/news/markets/13350-binance-leads-crypto-market-with-155b-reserves-2-1t-volume/ |
| Clients Fireblocks | « 10 000 Md$ transférés » (flux, pas stock) | 2 400+ institutions | Callback ouvert, **usage inconnu** | [S] |
| Clients BitGo | ~90 à 104 Md$ en garde | 1 500 à 4 600 | Webhook ouvert, usage inconnu | [S] |
| Trésoreries DAO | ~24,8 à 26 Md$ (T1 2026, dont >70 % en jeton natif : valeur fragile) | ~11 347 DAO | **Ouvert** : Safe, Guard, adresse publique | [S] https://cryptobriefing.com/daos-native-token-treasury-concentration-risk/ |
| Actifs tokenisés (RWA) | 23,6 Md$ (DefiLlama, ~mi-2026) ; 31,2 Md$ « distribués » (RWA.xyz, 7 mai 2026) dont 15,2 Md$ de bons du Trésor tokenisés | 76 actifs « Treasuries » | **Ouvert**, cible évoquée par plusieurs jurés | [S] https://cointelegraph.com/news/tokenized-rwas-rise-66-percent-2026-defillama |
| CASP agréés MiCA | n/a | 321 (31 juil. 2026) | Cible réglementaire du dossier DORA | [S] |

Lecture [analyse] : les exchanges pèsent **~9 fois** les trésoreries DAO et ~7 à 10 fois les RWA en valeur (225,4 contre 25 et 24 à 31 Md$, bases différentes, ratio indicatif), mais le chemin d'accès est fermé ou invérifié. Le segment ouvert est plus petit et plus adressable ; la valeur vendable à court terme est le **dossier DORA** (plusieurs juges), pas la protection des hot wallets d'exchanges.

**Perte récente pour calibrer** : TRM (H1 2026) ~76 % des pertes liées à l'infrastructure/clés pour ~15 % des incidents (972 M$, 207 incidents) : confirmé par la presse seulement, rapport primaire non lu [S].

---

## 7. Mapping règlement (pour chaque idée)

Les ID D3FEND et ATT&CK reprennent ceux de `research/tracks/T1_P4_deploiement_reglementaire.md` §5.1 (D3FEND vérifiés dans le fichier D4, **non rouverts aujourd'hui**; ATT&CK T1195.002 et T1565.002 **[ÀV]**). OWASP Agentic/ATLAS : non applicable (aucun agent IA dans le chemin ; ASI03 par analogie seulement, **[ÀV]**).

| Idée | NIST CSF 2.0 | ATT&CK | D3FEND | OWASP Agentic / ATLAS |
|---|---|---|---|---|
| Serveur de politique pour callback Fireblocks/BitGo (veto seul) | DE.CM-01, DE.AE-02, RS.MI-02, PR.AA-05, GV.SC-04 | T1657, T1565.002 [ÀV], T1195.002 [ÀV] | D3-AZET, D3-MFA | n/a |
| Mode Watch multi-chaînes | DE.CM-01, DE.CM-06, DE.AE-02, RS.CO-02 | T1657, T1078 | D3-IRA | n/a |
| Règle sémantique upgrade/delegatecall (Safe Guard, EVM) | PR.AA-05, DE.AE-02, RS.MI-02 | T1195.002 [ÀV], T1565.002 [ÀV] | D3-AZET | n/a |
| Signature client par retrait | PR.AA-03, PR.AA-05 (non vérifiés ici) | T1078, T1657 | D3-MFA | n/a |

---

## 8. À vérifier avant toute affirmation publique

1. Comportement exact de `RETRY` Fireblocks (page de référence 404).
2. Existence d'un partenariat Fireblocks–Hypernative (seule trace : page marketing Hypernative).
3. Usage réel du callback par des clients : demander à Fireblocks, ou chercher un cas d'usage publié (aucun trouvé).
4. Custody de Bitget, BingX, Phemex, CoinDCX : aucune source ; ne rien affirmer.
5. Crypto.com / Coinbase International / Revolut chez Fireblocks : un rapport unique.
6. Binance global : relation avec Ceffu (récits contradictoires).
7. Les passkeys d'exchanges lient-ils la signature au contenu du retrait ? Non établi.
8. `rawTx` en « EU cloud » : la phrase de la page porte sur le `CallbackResponse` ; relire la formulation exacte avec le support avant de s'y fier.
9. Chiffres CoinGecko (225,4 Md$) : base de données propre, méthode différente de CoinMarketCap.
10. Aucun appel réel à un Fireblocks/BitGo n'a été fait par nous ; les PoC ne valent que pour « compatible avec le format documenté ».

## Sources (ouvertes en [P] aujourd'hui)

- https://developers.fireblocks.com/docs/cosigner-architecture-overview
- https://developers.fireblocks.com/reference/approve-transactions
- https://developers.fireblocks.com/reference/validate-eth-raw-transactions
- https://developers.fireblocks.com/docs/integrating-third-party-aml-providers
- https://fireblocks.com/blog/fireblocks-expands-defi-security-capabilities-to-protect-institutions-from-ever-evolving-threats/
- https://www.fireblocks.com/customers/bitvavo
- https://developers.bitgo.com/docs/policies-overview ; https://developers.bitgo.com/docs/policies-webhook ; https://developers.bitgo.com/cookbooks/policies-webhook
- https://blockaid.io/blog/blockaid-adds-automated-transaction-proposals-to-onchain-monitoring-for-fireblocks-and-fordefi
- https://hypernative.io/hypernative-difference
- https://www.turnkey.com/blog/turnkey-policy-engine-guardrails-web3-transactions
- https://help.crypto.com/en/articles/2500695-crypto-withdrawals-general-information
- https://bleepingcomputer.com/news/security/hackers-steal-3516-million-in-bitget-crypto-exchange-hack
- https://www.rescana.com/post/bitget-cryptocurrency-exchange-breach-387-5m-stolen-via-zero-day-exploit-in-third-party-security-products
- https://cointelegraph.com/news/bitget-hack-zero-day-slowmist-investigation
- https://www.cobo.com/post/the-bybit-breach-why-multi-sig-alone-isn-t-enough

# T1 P4 : déploiement réel chez un CASP, produits existants, cadre réglementaire, cas Bybit (10 oct. 2026)

Périmètre : Track 1, sous-track 4. Répond à la question « comment cet outil entre-t-il réellement chez un prestataire crypto régulé, et avec quel statut ? ». Règlement de référence : `context/notion_guide.md`. Architecture : `docs/architecture.md` (v1). Complète `research/tracks/T1_P4_integration_ecosysteme.md` et `research/tracks/T1_P4_etat_de_l_art.md` (je ne répète pas leurs tableaux).

Légende de fiabilité :
- **[P]** source primaire (page éditeur, doc officielle, texte de loi) **ouverte et lue** aujourd'hui.
- **[P*]** source primaire repérée, mais seulement vue via un extrait de moteur de recherche (page non ouverte, ou 404 à l'ouverture). À rouvrir avant slide.
- **[S]** secondaire (presse, cabinet d'avocats, blog tiers, site non officiel qui reproduit un texte de loi).
- **[V]** vérifié par un test direct aujourd'hui (précisé à chaque fois).
- **[ÀV]** à vérifier. **[?]** introuvable : ne pas affirmer.
- Mes analyses (juridiques ou de conception) sont marquées **[analyse]**. Aucune n'est un avis juridique.

---

## 0. TL;DR

1. **Le point d'insertion le plus crédible chez un CASP n'est pas la lecture seule ni la clé : c'est le veto dans le circuit d'approbation.** Fireblocks (callback de l'API Co-Signer), BitGo (règle webhook) et Safe (Guard) offrent tous un point où un tiers répond approuver/refuser avant la signature [P, P*]. Un outil qui ne peut que refuser (jamais signer, jamais libérer) reste un prestataire TIC, pas un dépositaire [analyse].
2. **Les produits concurrents suivent ce schéma** : Hypernative est un Guard Safe installé par une transaction Safe (suppression : transaction + 24 h) et une API pour Fireblocks/Copper [P]. Les extensions de signature sont fragiles : Wallet Guard fermé le 31 mars 2025, Blowfish absorbé par Phantom en nov. 2024 [P*]. Ne pas bâtir l'offre sur une extension Chrome.
3. **Réglementaire** : le CASP reste seul responsable (DORA art. 28(1), MiCA art. 73 et 75(8)) ; l'éditeur entre dans son registre d'information (art. 28(3)) et, s'il touche au circuit de garde, sous les exigences renforcées de l'art. 30(3) [S texte non officiel, EUR-Lex à rouvrir]. Un droit de veto n'est licite que s'il est écrit dans la politique de garde du CASP et son contrat : jamais un droit propre de l'éditeur.
4. **Bybit (21 févr. 2025)** : la vérification indépendante existe (safe-tx-hashes-util, safe-utils, Lido, Tenderly) mais elle est **manuelle, optionnelle, et dépend de l'API Safe** ; ERC-7730 + ERC-8176 (mai 2026) n'a pas d'adoption Safe confirmée [S]. Ce qui manque : une règle sémantique automatique dans le chemin de signature (ex. refuser `delegatecall` vers une adresse hors liste).
5. **Recommandation : modèle 2 « Gardien à veto seul »** (Safe Guard à resserrement seul + callback de politique documenté), avec le modèle 1 (Watch) comme porte d'entrée gratuite. Sur Fuji, les contrats Safe canoniques existent [V], donc on peut démontrer un vrai Safe sur lequel notre Guard bloque un drain, sans prétendre protéger un coffre tiers fermé. Le modèle 3 (co-signataire, module à droit d'exécution) reste en feuille de route : risque de qualification en garde de crypto-actifs.

---

## 1. Comment un CASP détient et déplace ses fonds en 2026

### 1.1 Les couches (ce qui est général)

| Couche | Ce que c'est | Qui signe | Fiabilité |
|---|---|---|---|
| **Cold** | Stockage hors ligne ou HSM/MPC avec approbations lourdes et lentes. | Plusieurs approbateurs humains + quorum. | Les exchanges grand public annoncent 95 à 98 % en cold (Coinbase ~98 %, Kraken et Gemini ~95 % selon un comparateur) ; chiffres non audités [S] https://www.spark.money/tools/crypto-exchange-security-comparison. Seul split audité retrouvé : Bitbuy 97,16 % chez BitGo Trust / 2,84 % hot wallet, **en 2022** [S] https://benzinga.com/z/29709239. |
| **Warm** | Portefeuille de réapprovisionnement entre cold et hot. | Approbation humaine plus légère ou règle automatique avec plafond. | [C], pas de source chiffrée retrouvée. |
| **Hot** | Retraits clients et opérations. Signature automatisée sous plafond. | Co-signer API (machine) + règles de politique. | [P*] voir ci-dessous. |

Deux modèles organisationnels coexistent [analyse] : (a) le CASP **opère sa propre infrastructure de clés** (MPC ou multisig) avec un fournisseur de technologie ; (b) le CASP **délègue la garde à un autre CASP agréé** (BitGo Trust, Copper, etc.). MiCA art. 75(9) impose dans ce cas de n'utiliser que des CASP agréés (art. 59) [P, extrait EUR-Lex via lecteur] https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023R1114. Ce second cas est celui où l'outil tiers a le moins de prise : la politique est chez le dépositaire.

### 1.2 Fournisseurs de clés et moteurs de politique

| Fournisseur | Modèle de clés | Moteur d'approbation (ce qu'on peut en dire) | Point d'insertion tiers | Fiabilité |
|---|---|---|---|---|
| **Fireblocks** | MPC-CMP : parts de clé réparties entre appareils de signataires, co-signers cloud Fireblocks et **API Co-Signer** (machine). En « Hosted MPC », le client héberge 3 parts (co-signer primaire + 2 guard co-signers), toutes nécessaires. | **Transaction Authorization Policy (TAP)** : règles évaluées dans l'ordre, actions `ALLOW`/`BLOCK`/`2-TIER`, montants en USD/EUR/natif, fenêtres cumulées horaire à mensuelle, destinations (liste blanche, adresse à usage unique), initiateur, signataires désignés. Modifier la politique passe par un **quorum d'admins** (clé de configuration sur mobile). Publication par API directe ou par brouillon. | **Callback Handler** de l'API Co-Signer (voir 1.3). Nouveautés juin 2026 : Policy Inspector, Policy Export, rôle Security Admin qui peut **geler l'espace de travail** sans accès aux flux. | [P] https://developers.fireblocks.com/docs/cosigner-architecture-overview ; [P] https://www.fireblocks.com/blog/new-in-fireblocks-security-summer-2026 ; [P*] https://developers.fireblocks.com/reference/configure-transaction-authorization-policy ; [P*] https://support.fireblocks.io/hc/en-us/articles/29184395887772-About-Policies |
| **BitGo** | Portefeuilles multi-signature avec clé BitGo [C]. | Politiques : initiateur, % du solde, seuil, **limite de vélocité**, **règle webhook** ; actions : refus automatique, approbation par admins, approbation par un groupe. Politiques applicables à tous les portefeuilles, à un seul ou à un groupe. Les transactions de récupération par clé utilisateur + clé de secours **contournent** les politiques. | **Règle webhook** : BitGo envoie un POST avec portefeuille, règle, montant, nombre d'approbations, transaction semi-signée, sorties ; toute réponse autre que HTTP 200 **bloque** la transaction (variante : passe en attente d'approbation). | [P*] https://developers.bitgo.com/cookbooks/policies-webhook ; [P*] https://developers.bitgo.com/docs/policies-overview |
| **Ledger Enterprise** | HSM de Ledger ; approbations par appareils d'admins et d'opérateurs. | Règles par compte : jusqu'à 4 règles, groupe créateur, tranche de montant, liste blanche de destinataires, jusqu'à 3 tours d'approbation ; première règle qui correspond. Les règles approuvées par le quorum d'admins sont **appliquées par le HSM**. | API Ledger Enterprise / TRADELINK (gouvernance 2 sur 3 asset manager / dépositaire / fournisseur de liquidité). Pas de point de veto tiers trouvé [?]. | [P*] https://help.vault.ledger.com/help-center/core/workspace-administration/accounts/create-an-account ; [P*] https://www.ledger.com/blog-merkle-tree-hsm-scaling-ledger-enterprise-security ; [P*] https://help.enterprise.ledger.com/tradelink/best-practices |
| **Cobo** | MPC, et **Argus** : couche de gestion de risque DeFi bâtie sur **Safe** (contrôles par fonction et par adresse). | Contrôles de risque propres à Cobo. | Non documenté techniquement côté tiers ; sources = marketing du fournisseur. | [S] https://news.cobo.com/cobo-argus-fact-sheet/ |
| **Copper** | Dépositaire ; ClearLoop = règlement hors exchange avec soldes virtuels. | Politique de retrait non retrouvée dans les pages lues. | [?] | [S] https://developer.copper.co/guides/clearloop/introduction |
| **Safe (multisig n sur m)** | Smart account : n signatures sur m propriétaires. | **Guard** (vérifie avant/après chaque transaction signée par les propriétaires) et **Module** (peut exécuter sans signatures). Guard disponible depuis les contrats v1.3.0. | Voir 1.3. | [P] https://docs.safe.global/smart-account-guards |
| **HSM propre** (banques, grands exchanges) | Clés dans des HSM maison. | Procédures internes. | Aucun point d'API standard ; seul le mode « lecture seule » est possible [analyse]. | [analyse] |

### 1.3 Où un outil tiers peut s'insérer (7 points)

| # | Point d'insertion | Ce que le tiers voit/peut faire | Si le tiers tombe | Statut éditeur probable [analyse] | Preuve |
|---|---|---|---|---|---|
| 1 | **Lecture seule on-chain** (adresses déclarées) | Voit tout, ne peut rien faire. | Rien ne se passe. | Prestataire TIC, risque faible. | Notre mode Watch. |
| 2 | **Callback de politique du co-signer (Fireblocks)** | Reçoit chaque demande de signature/approbation, répond `approved` ou `rejected`. | **Sans callback configuré, le co-signer signe tout** pour cet utilisateur API. Avec callback : pas de réponse en 30 s ⇒ la demande **échoue** (fail-closed). | Prestataire TIC sur le chemin de signature : probablement « fonction critique ou importante » côté CASP. | [P] https://developers.fireblocks.com/docs/cosigner-architecture-overview |
| 3 | **Règle webhook (BitGo)** | Voit la transaction semi-signée et répond HTTP 200 ou non. | Non-200 ⇒ blocage (fail-closed). | Idem. | [P*] https://developers.bitgo.com/cookbooks/policies-webhook |
| 4 | **Safe Guard** (contrat installé sur le Safe) | `checkTransaction` avant, `checkAfterExecution` après, sur toute transaction signée par les propriétaires ; ne couvre pas les transactions de module (d'où le Module Guard de la v1.5.0). | Un Guard cassé **peut bloquer le Safe** (« denial of service ») : à auditer, prévoir une sortie. Chez Hypernative, retirer le Guard exige une transaction + 24 h. | Prestataire TIC ; le contrat appartient au Safe du client. | [P] https://docs.safe.global/smart-account-guards ; [P] https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative ; [P*] https://safefoundation.org/blog/introducing-safe-v1-5-0-module-guards-enhanced-smart-account-features |
| 5 | **Module Safe** | Peut **exécuter** sans seuil de signatures. Un module peut contourner les Guards avant la v1.5.0. | Dépend du module. | **Risque de qualification en garde** (contrôle des moyens d'accès) : à éviter pour un tiers [analyse]. | [P*] https://help.safe.global/articles/5490514177-what-is-a-module |
| 6 | **Extension de navigateur du signataire** | Voit ce que l'interface affiche, simule, avertit. Ne bloque pas la signature d'un appareil. | Rien. | Fournisseur logiciel poste de travail. | Voir §2 et §4. |
| 7 | **SDK dans l'appli du CASP** | Scan avant signature dans l'appli maison (ex. Blockaid via Privy ou Portal). Ajoute de la latence à chaque signature. | Selon l'intégrateur. | Prestataire TIC. | [P*] https://blockaid.io/blog/privy-integrates-blockaid-to-bring-transaction-security-into-global-wallets ; [S] https://docs.portalhq.io/integrations/Security/blockaid |

Conséquences de conception [analyse] :
- **Fail-closed contre fail-open** est la décision de produit la plus lourde : un veto en fail-closed transforme **notre panne en panne du CASP** (indisponibilité client, entrée dans la classification DORA). Il faut proposer au client un mode « fail-open après N secondes » ou un plafond conservateur plutôt qu'un blocage total, aligné sur notre principe actuel « jamais de gel total ».
- **Contradiction de documentation Fireblocks** : la page d'architecture dit « pas de réponse en 30 s, ou `retry` : la demande échoue » [P], alors que la référence de l'API Co-Signer, vue par extrait, décrit `RETRY` avec 20 tentatives toutes les 3 minutes (soit 60 min) et `IGNORE` pour les approbations de configuration [P*] https://developers.fireblocks.com/reference/automated-signer-callback (404 à l'ouverture directe). **[ÀV] avant d'afficher un comportement de `RETRY`.** Notre stub `POST /policy/decision` répondant `RETENIR` ne doit pas être présenté comme équivalent à `RETRY`.
- Fireblocks n'ouvre pas son écran AML à n'importe quel tiers : **un seul fournisseur d'AML actif par espace de travail**, changement via le support [P] https://developers.fireblocks.com/docs/integrating-third-party-aml-providers. Le callback du co-signer, lui, est ouvert à un serveur HTTPS du client.

---

## 2. Facteurs de forme des produits existants

| Produit | Forme | Comment il est déployé | Statut/risque 2026 | Source |
|---|---|---|---|---|
| **Hypernative Guardian** | SaaS + **Guard Safe on-chain** + API | Dans Safe : demande d'activation via Paramètres > Sécurité, **une transaction Safe installe le Guard**, politiques gérées dans le tableau de bord Hypernative, alertes Slack/Telegram/Discord/API. Verdict : approuver, signaler, bloquer. Intégration « native » avec Safe et Fordefi, **par API** avec Fireblocks, Utila, Copper. Latence « sous la seconde », white-label possible. Le mécanisme exact d'application côté Fireblocks n'est pas détaillé. | Support d'Avalanche non retrouvé dans les pages 2026 lues [?]. | [P] https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative ; [P] https://www.hypernative.io/products/hypernative-guardian |
| **Blockaid** | **API** (scan de transaction, JSON-RPC, adresses, URL) + intégrations | Intégré dans l'interface Safe (annonce du 16 sept. 2024), dans les SDK de Privy et Portal (scan avant génération de la signature). Auth par clé API (en-tête, d'après un annuaire d'API tiers). | Dans les pages lues : aucune offre « custodian » Blockaid + Fireblocks retrouvée. | [P*] https://safe.global/blog/safe-wallet-gets-even-safer-introducing-blockaid-integration ; [P*] https://blockaid.io/blog/privy-integrates-blockaid-to-bring-transaction-security-into-global-wallets ; [S] https://apis.apievangelist.com/store/blockaid-evm-api/ |
| **Hexagate (Chainalysis)** | SaaS de surveillance | Gratuit pour les builders Avalanche, 5 moniteurs personnalisés (cf. fichier état de l'art). Racheté par Chainalysis. | Incident d'alertes juin 2026 [S]. | `research/tracks/T1_P4_etat_de_l_art.md` §2.1 |
| **Rabby** | **Portefeuille** (extension) avec simulation avant signature intégrée | Le moteur de simulation est maison, selon des articles non fiables ; c'est un portefeuille, pas un module que l'on ajoute à un autre. | Pertinent pour traders individuels, pas pour un CASP qui signe par MPC/HSM. | [S] https://dextools.io/news/what-is-rabby-wallet-pre-sign-simulator (article de faible qualité, à confirmer sur le dépôt Rabby) |
| **Pocket Universe** | **Extension** de prévisualisation | Aperçu avant le portefeuille. Statut actuel non retrouvé. | [?] | [S] https://www.alchemy.com/dapps/pocketuniverse |
| **Wallet Guard** | Extension + Snap MetaMask | **Fermé : arrêt prévu au 31 mars 2025** (extension, tableau de bord, Snap). | Preuve que ce facteur de forme est fragile. | [P*] https://walletguard.app/blog/wallet-guard-sunset-notice |
| **Blowfish** | API de scan pour portefeuilles | Racheté par Phantom (19 nov. 2024), service autonome arrêté. | Idem. | [P*] https://phantom.com/learn/blog/phantom-acquires-blowfish |
| **Safe{Wallet} : simulation et décodage** | Fonction de l'interface | Tenderly (simulation étape par étape) et Blockaid (scan, empoisonnement d'adresse) intégrés dans l'interface web. Dépend donc de l'interface Safe. | C'est précisément la surface compromise à Bybit. | [P*] https://help.safe.global/en/articles/259531-safe-wallet-security-with-tenderly-blockaid |
| **Tenderly** | API REST + alertes + Virtual TestNets | Appel d'API de simulation par un portefeuille ou une dapp ; comparaison de hash de transactions Safe. | Aucune doc retrouvée pour un usage en « porte » obligatoire de signature. | [P*] https://docs.tenderly.co/simulations/overview |
| **Forta Firewall** | **Contrat** (attestation on-chain) / filtre de rollup | Pour un protocole : les transactions listées doivent porter une attestation de contrôles réussis, sinon revert. Pour un rollup : filtre avant le séquenceur. Dit ne pas couvrir les compromissions de clé. Chiffres de rappel et de faux positifs = vendeur. | Aucune annonce 2026 retrouvée (voir fichier état de l'art). | [P*] https://docs.forta.network/en/latest/what-is-forta-firewall/ |
| **Venn (Ironblocks)** | Réseau d'opérateurs + pare-feu on-chain | Politiques branchées au contrat. | Dernier contenu daté : 2024. | [S] https://www.businesswire.com/news/home/20240925419323/en |
| **Hold up** | Service + Guard/contrat à resserrement seul | Voir §5. | | |

Lecture [analyse] :
- **Trois familles** : SDK/API (Blockaid, Tenderly), extension (Pocket Universe, Wallet Guard, Rabby), **point d'application dans le chemin de signature** (Hypernative via Safe Guard ou API, Forta/Venn via contrat).
- **Trustee (gagnant 2025) = extension grand public**. Ce que le jury a aimé : un **score de risque avec explication lisible**. Cela se transpose sans changer de client : chaque verdict de Hold up doit sortir en une phrase (déjà prévu : « Argent parti vers des inconnus : X % du solde en 10 min ») avec une pastille de risque. Mais l'extension comme produit n'est pas défendable face à un CASP (voir Wallet Guard, Blowfish).

---

## 3. Autorisations et limites réglementaires

### 3.1 Textes lus

| Sujet | Ce que dit le texte | Source |
|---|---|---|
| **MiCA art. 3(1) point 17** : définition de la garde | « safekeeping or controlling … of crypto-assets or of the means of access to such crypto-assets, where applicable in the form of private cryptographic keys ». | [P] https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023R1114 |
| **MiCA art. 70(1)** | Les CASP qui détiennent des crypto-actifs de clients **ou les moyens d'accès** doivent protéger les droits de propriété. | idem [P] |
| **MiCA art. 73** (externalisation) | Le CASP prend toutes mesures raisonnables pour éviter un risque opérationnel supplémentaire, **reste pleinement responsable**, l'externalisation n'entraîne pas de délégation de responsabilité, droit de résiliation. | idem [P, via extrait ; numérotation des alinéas à re-lire] |
| **MiCA art. 75** | (1) contrat client ; (2) registre des positions ; (3) **politique de garde** avec règles internes « to ensure the safekeeping or the control » ; (6) restitution ; (7) ségrégation, y compris sur le registre distribué ; (8) **responsabilité pour la perte de crypto-actifs ou des moyens d'accès** plafonnée à la valeur de marché au moment de la perte ; hors du champ : événement indépendant du service, par exemple « a problem inherent in the operation of the distributed ledger » ; (9) recours à d'autres CASP **agréés** seulement. | idem [P, via extrait] |
| **DORA art. 28** | (1) l'entité financière reste **pleinement responsable** ; (3) **registre d'information** de tous les accords TIC, avec distinction fonctions critiques ou importantes ; (4) évaluation avant contrat dont « covers a critical or important function » et risque de concentration ; (8) **stratégies de sortie** testées pour les fonctions critiques. | [S] https://www.digital-operational-resilience-act.com/Article_28.html (reproduction non officielle) |
| **DORA art. 30** | (2) description des services, lieux de traitement, disponibilité/intégrité des données, **assistance en cas d'incident**, coopération avec les autorités, résiliation ; (3) pour fonctions critiques : SLA chiffrés, tests de continuité, **TLPT**, **droits d'audit**, stratégie de sortie avec transition. | [S] https://www.digital-operational-resilience-act.com/Article_30.html |
| **DORA art. 2(1)(f), art. 3(19)** | Les CASP agréés MiCA sont des **entités financières** couvertes. Un prestataire tiers de services TIC = « an undertaking providing ICT services » ; service TIC = « digital and data services provided through ICT systems … on an ongoing basis » (point 21 dans la numérotation lue). | [S] https://www.digital-operational-resilience-act.com/Article_2.html et `Article_3.html` |
| **RTS 2025/532** (sous-traitance TIC) | Règles de due diligence et d'évaluation pour la sous-traitance de services soutenant des fonctions critiques ; publié au JO le 2 juil. 2025. | [S] https://finreg.aoshearman.com/eu-rts-on-subcontracting-ict-services-supporting- ; https://www.jonesday.com/en/insights/2025/07/uniform-standards-for-ict-subcontracting-in-eu-financial-sector-new-obligations |
| **ESMA, exercice de supervision commune sur la garde des CASP** | Garde = service prioritaire ; thèmes : gouvernance, gestion des clés, **contrôles des transactions, détection et réponse aux incidents**, smart contracts, **dépendance aux tiers** ; réalisation S2 2026 à S1 2027, rapport S2 2027. | [S] https://www.williamfry.com/knowledge/esma-targets-casp-custody-resilience/ (15 sept. 2026) |
| **AI Act** | Définition d'un système d'IA (art. 3(1)) : « machine-based system … designed to operate with varying levels of autonomy ». Le considérant 12 exclut les systèmes fondés sur des règles « defined solely by natural persons to automatically execute operations ». Annexe III 5(b) (solvabilité) : exclusion de « AI systems used for the purpose of detecting financial fraud ». Annexe III 2 : composants de sécurité d'infrastructures numériques critiques. | [S] https://artificialintelligenceact.eu/annex/3/ ; https://artificialintelligenceact.eu/recital/12/ ; https://artificialintelligenceact.eu/article/3/ (EUR-Lex 32024/1689 à rouvrir) |
| **RGPD** | Pseudonymisation : relative. CJEU, EDPS c. SRB (C-413/23 P, 4 sept. 2025) : des données pseudonymisées peuvent être personnelles pour celui qui détient les moyens de réidentifier et ne pas l'être pour un destinataire qui ne le peut pas. EDPB, lignes directrices 02/2025 sur la blockchain : version finale adoptée le **7 juil. 2026** ; déconseille d'écrire des données personnelles on-chain sans nécessité ; cite chiffrement, hachage, engagements. **Position finale sur les adresses : non lue.** | [S] https://cm.twobirds.com/en/insights/2025/eu-the-srb-decision-a-new-era-for-personal-data-and-data-processing-agreements ; [S] https://streamlex.eu/law-resources/edpb-guidelines-02-2025-blockchain-v2/ ; [P*] https://www.edpb.europa.eu/system/files/2026-07/edpbreport_publicconsultaton_guidelines_blockchain_202502_en.pdf (PDF image, illisible) |

### 3.2 Questions posées, avec réponse [analyse]

**Un éditeur tiers peut-il avoir un droit de pause ou de plafond sur les fonds d'un CASP ?**
Oui à titre d'agent contractuel du CASP, non à titre de droit propre. Conditions :
1. **Le droit naît de la politique de garde du CASP** (MiCA art. 75(3)) et d'un contrat art. 30 DORA ; la direction du CASP signe la charte, ce que l'architecture prévoit déjà (§7).
2. **Resserrer seulement** : refuser, retenir, abaisser un plafond. Jamais initier un transfert, jamais lever une restriction. Cela garde l'éditeur du côté « fournisseur de logiciel de sécurité » et hors de la définition de garde (art. 3(1) point 17 : « safekeeping or controlling … the means of access »).
3. **Pas de part de clé, pas de module à droit d'exécution.** Détenir une part MPC ou administrer un module capable de déplacer des fonds se rapproche de « controlling … means of access ». **[ÀV] par un juriste ou par l'AMF** : je n'ai pas trouvé de position officielle sur le veto seul.
4. **Sortie de secours du CASP** (break-glass) : le CASP doit pouvoir retirer le Guard/le callback sans notre accord (art. 30(3)(f) : stratégie de sortie et période de transition).
5. **Mode de panne écrit** (fail-closed ou fail-open après délai) et accepté par le CASP, car la panne devient un incident du CASP.

**Statut de l'éditeur** : prestataire de services TIC (DORA art. 3(19)) ; **pas un CASP** tant qu'il ne garde ni ne contrôle de crypto-actifs ni de moyens d'accès, ne fournit aucun service MiCA listé aux clients. Il n'est pas lui-même « entité financière » (art. 2(1)(f) vise les CASP agréés). Il n'est pas « prestataire critique » au sens de l'art. 31 sauf désignation des AES [S].

**Responsabilité** : MiCA art. 75(8) place la responsabilité envers les clients sur le CASP pour la perte de crypto-actifs ou des moyens d'accès, plafonnée à la valeur de marché au moment de la perte [P, extrait]. Une retenue erronée de notre part est un incident du CASP ; le recours contre nous passe par le contrat (clause de limitation de responsabilité à négocier). Notre réponse « le CASP, par sa direction » (architecture §7) est cohérente avec les art. 28(1) DORA et 73 MiCA.

**DORA : ce qui change pour nous comme fournisseur** [analyse] :
- Entrée au **registre d'information** du CASP (art. 28(3)) avec LEI et fonction supportée ; la décision « critique ou importante » appartient au CASP (art. 28(4)). Un veto dans le chemin de signature de la garde sera probablement classé critique ⇒ art. 30(3) : SLA chiffrés, droits d'audit, participation aux tests (TLPT), plan de sortie, assistance en cas d'incident.
- **Sous-traitance** : nos propres tiers (Bedrock, RPC, hébergeur) tombent dans la chaîne de sous-traitance du CASP (RTS 2025/532) ; c'est ce que porte notre inventaire des tiers.
- Une défaillance de Hold up qui rend les retraits indisponibles compte dans la classification d'incident du CASP (moteur DORA, « auto-incident »).

**RGPD** [analyse] : les adresses de clients, rapprochées d'un fichier client du CASP, sont des données personnelles **pour le CASP** ; l'éditeur qui les traite est **sous-traitant** (art. 28 RGPD, avec accord de traitement) dès qu'il reçoit le rapprochement ; en mode Watch pur sur adresses publiques sans rapprochement, la qualification est contextuelle (approche relative, arrêt SRB). Notre choix « rien de lisible on-chain, journal HMAC » reste le bon réflexe. Position finale de l'EDPB sur les adresses : **[ÀV]**.

**AI Act** [analyse] : notre cœur de détection et de réponse est un jeu de règles déterministes fixées par des personnes ⇒ probablement hors définition d'« AI system » (considérant 12). L'exception « fraude » de l'annexe III 5(b) ne vise que l'évaluation de solvabilité de personnes physiques, elle ne nous aide pas pour le point 2 (infrastructures critiques), mais nos règles ne sont pas un composant de sécurité d'infrastructure critique au sens de l'AI Act sans analyse supplémentaire **[ÀV]**. Le texte libre généré par LLM reste à part (supervision humaine, étiquette). Formulation prudente conservée.

### 3.3 Démo sur Fuji contre production

| | **Démo sur Fuji (hackathon)** | **Production chez un CASP** |
|---|---|---|
| Cible | Testnet 43113, **nos propres contrats** et comptes jetables (`assertTargetAllowed()`) | Adresses réelles du CASP, déclarées par lui |
| Données | Synthétiques, `synthetic:true`, bandeau permanent | Données clients réelles = RGPD, accord de traitement |
| Droits | Aucun : pas de CASP réel, pas de client, donc pas d'obligation MiCA/DORA qui s'applique à la démo | Contrat art. 30 DORA, politique de garde amendée (MiCA 75(3)), entrée au registre (28(3)) |
| Attaques | Simulées sur nos contrats uniquement (règlement du hackathon : aucune action contre un système réel) | Aucun test offensif sans accord écrit et périmètre (TLPT encadré par le CASP) |
| Clés | Jetables, `.env.local` gitignoré | KMS/HSM du CASP, rôle de Hold up limité au resserrement |
| Fournisseur tiers cité | Mock étiqueté SIMULATION (jamais « Fireblocks » à l'oral) | Intégration contractuelle |
| Ce qu'on peut dire | « Voici un veto à resserrement seul sur un Safe de test. » | « Votre direction signe la charte ; nous exécutons. » |

---

## 4. Le cas Bybit : signature à l'aveugle, interface Safe compromise

### 4.1 Faits [S sauf mention]
- **21 févr. 2025** : vol d'environ 401 347 ETH (1,4 à 1,5 Md$ selon les sources) depuis le cold wallet multisig Safe de Bybit. Attribution à Lazarus (Corée du Nord). https://www.bleepingcomputer.com/news/security/lazarus-hacked-bybit-via-a-breached-safe-wallet-developer-machine/ ; https://blocksec.com/blog/bybit-incident-a-web2-breach-enables-the-largest-crypto-hack-in-history
- **Chaîne d'attaque** : poste d'un développeur Safe compromis le 4 févr. (projet Docker piégé) ; jetons de session AWS détournés (contournant la MFA) ; JavaScript malveillant déposé dans le bucket S3 qui héberge l'interface Safe{Wallet}, **ciblant les transactions de Bybit seulement**. Les signataires voyaient une transaction légitime dans l'interface, tandis que l'appareil Ledger recevait une transaction qui **remplaçait l'implémentation du Safe** par un contrat malveillant. https://www.nccgroup.com/research/in-depth-technical-analysis-of-the-bybit-hack/ ; https://www.elastic.co/security-labs/threat-command/bit-bybit
- **Le multisig n'a pas été « cassé »** : Safe déclare qu'aucune vulnérabilité des contrats ni du code front n'a été relevée et que l'attaque est passée par une machine de développeur compromise ; des analystes tiers contestent le cadrage. Chronologie : des divergences de dates entre sources (injection 2 jours ou 2 semaines avant) **[ÀV]**. https://safe.global/blog/safe-ecosystem-foundation-statement
- **Réponses de Safe** : reconstruction de l'infrastructure, rotation des identifiants, validations supplémentaires du hash, des données et des signatures à la passerelle, retrait temporaire de l'intégration Ledger native, surveillance renforcée ; « Safe Utils » et interface IPFS annoncés (selon des sources secondaires) **[ÀV]**.

### 4.2 Outils de vérification indépendante 2025-2026

| Outil | Ce qu'il fait | Limite | Source |
|---|---|---|---|
| **safe-tx-hashes-util** (pcaversaccio) | Script bash : recalcule hash de domaine et de message d'une transaction Safe hors de l'interface, à comparer à l'écran du matériel. | Manuel, réseau requis, récupère les données auprès du service de transactions Safe. | [S] via https://operatorportal.lido.fi/public/relay-maintenance-committee/how-to-review-a-safe-tx-rmc-edition |
| **safe-tx-hashes** (Cyfrin, fork) | CLI, hash et calldata attendus sur l'appareil. | L'installation par `curl | bash` est elle-même un risque (Cyfrin le dit). | [S] https://www.cyfrin.io/blog/hardware-wallet-security-what-your-device-must-show-you |
| **safe-utils** (BootNode) | Interface web du même contrôle ; **mode de saisie manuelle** sans API Safe. | Humain dans la boucle. | [S] https://github.com/BootNodeDev/safe-utils |
| **safe-tx-hashes-ui** (Lido) | Calculateur web, consigne : ne pas signer en cas de doute. | Idem. | [S] Lido, lien ci-dessus |
| **Guide Safe « vérifier trustlessly sur matériel »** | Procédure officielle de comparaison de hash ; si l'appareil gère EIP-712, vérifier les données typées. | 404 à l'ouverture directe : lu par extrait. | [P*] https://help.safe.global/en/articles/276344-how-to-verify-safe-txs-trustlessly-on-a-hardware-wallet |
| **Tenderly** | Simulation et comparaison de hash de transactions Safe. | Pas de rôle de porte obligatoire dans le flux de signature trouvé. | [P*] https://tenderly.co/blog/changelog/comparing-safe-transaction-hashes-on-tenderly/ |
| **ERC-7730 + ERC-8176 (« Clear Signing »)** | Descripteurs JSON pour afficher une intention lisible sur l'appareil ; ERC-8176 apporte l'attestation par des relecteurs indépendants ; registre hébergé par l'initiative « Trillion Dollar Security » de l'EF (clearsigning.org). Lancement autour du 12-13 mai 2026. Contributeurs : Ledger, Trezor, MetaMask, WalletConnect, Fireblocks, Cyfrin, Sourcify… | **Safe n'est pas mentionné** dans l'article lu ; l'inclusion au registre n'est pas un gage de sûreté ; l'article ne donne pas de calendrier d'adoption sauf Trezor (début T2 2026). | [S] https://unchainedcrypto.com/ethereum-foundation-launches-clear-signing-standard-to-end-blind-signing-exploits/ ; [S] https://docs.sourcify.dev/blog/intro-to-erc7730/ |
| **Simulation avant signature dans les portefeuilles** | Avertit sur l'effet. | Étude (WalletProbe) : les dix extensions testées sont vulnérables à une dépendance entre transactions du même bloc (V1), dont Rabby et MetaMask aussi à V2. | [S] https://arxiv.org/pdf/2504.11735 |

### 4.3 Ce qui manque encore [analyse]
1. **Aucune vérification automatique et indépendante dans le chemin de signature d'un CASP.** Toutes les procédures ci-dessus demandent qu'un humain recalcule un hash, et elles sont facultatives.
2. **Dépendance à la même source de données** : la plupart recalculent à partir du service de transactions Safe ou de l'interface web, celle que l'attaquant contrôlait. Seul le mode manuel de BootNode évite ce piège.
3. **Le matériel affiche un hash** pour une transaction Safe (selon Safe et Candide, un vendeur concurrent : à prendre comme point de vue) ; le clear signing de bout en bout pour Safe n'est **pas confirmé** **[ÀV]**.
4. **Pas de règle sémantique** du type « une transaction Safe dont l'opération est un `delegatecall` ou qui modifie l'implémentation du proxy est refusée sans liste d'adresses approuvées ». C'est exactement ce qu'un **Guard à resserrement seul** peut faire côté contrat, sans dépendre de l'interface [analyse, à tester sur Fuji]. Notre détecteur D7 (changement de pouvoir : `Upgraded`, rôles, owner) est le seul signal précoce avant la sortie ; **le délai réel entre l'écrasement de l'implémentation et le premier transfert à Bybit n'est pas établi dans mes sources** : ne pas citer de durée.
5. **Le cas Bybit n'est pas notre périmètre « prévention complète »** : ni Hold up (lecture de blocs, post-signature) ni un Guard n'empêchent un signataire de signer si l'appareil l'y autorise ; le Guard refuse à l'exécution on-chain, ce qui est le dernier point où une règle peut encore tenir.

Mapping de cette section : NIST CSF 2.0 **PR.AA-05** (privilèges minimaux), **DE.CM-01**, **DE.AE-02**, **RS.MI-02** ; ATT&CK **T1195.002** (compromission de la chaîne logicielle) et **T1565.002** (manipulation de données transmises) **[ÀV]**, **T1657** ; D3FEND **D3-AZET** (seuil d'autorisation, vérifié dans le fichier D4) ; OWASP ASI / ATLAS : non applicable (pas d'agent IA dans le chemin).

---

## 5. Synthèse : trois modèles de déploiement

### 5.1 Tableau comparatif

| | **Modèle 1 : Observateur** (Watch) | **Modèle 2 : Gardien à veto seul** | **Modèle 3 : Co-signataire / module** |
|---|---|---|---|
| **Ce que c'est** | Lecture seule sur adresses déclarées ; alerte, dossier DORA, pack de gel, preuve ancrée | Un point de décision dans le circuit d'approbation, qui ne peut que refuser, retenir ou abaisser un plafond : Guard Safe, callback de co-signer (Fireblocks), règle webhook (BitGo), ou coffre à plafond | Détient une part de clé MPC ou un module Safe avec droit d'exécution ; peut « mettre à l'abri » en déplaçant les fonds |
| **Ce qu'il permet** | Détecter, alerter, déclarer, prouver | Borner la perte (plafond agrégé), retenir une sortie inconnue, refuser un `delegatecall` hors liste | Réponse la plus rapide, y compris active (balayage vers adresse sûre) |
| **Ce qu'il interdit (à écrire dans le contrat)** | Rien d'actif | Jamais signer, jamais lever une restriction, jamais ajouter un rôle ; sortie de secours du CASP ; mode de panne écrit | Aucune interdiction naturelle : c'est le problème |
| **Effort d'adoption pour le client** | Quasi nul : une liste d'adresses et un canal d'alerte | Moyen : installer un Guard (une transaction Safe + audit du Guard) ou publier une URL de callback et la régler dans la politique ; amender la politique de garde ; contrat art. 30 | Élevé : cérémonie de clés, revue de risque, accord du régulateur probable |
| **Statut réglementaire de l'éditeur** | Prestataire TIC ; probablement non critique | Prestataire TIC sur le chemin de signature ⇒ probablement fonction critique du CASP ⇒ art. 30(3) DORA ; **pas CASP** si aucun pouvoir de disposer [analyse, ÀV juriste] | Risque réel de qualification en garde (MiCA art. 3(1)17 : contrôle des moyens d'accès) ; agrément ou partenariat avec un CASP agréé [analyse, ÀV] |
| **Démo sur Fuji** | Coller une adresse Fuji arbitraire ; attaque simulée ; alerte + dossier + ancre | Safe réel (contrats canoniques déployés sur Fuji [V]) avec notre `SentinelGuard` à resserrement seul ; ou `GuardedVault` + stub `POST /policy/decision` | Maquette uniquement, étiquetée « non construit » |
| **Mapping NIST CSF 2.0** | DE.CM-01, DE.CM-06, DE.AE-02, DE.AE-03, RS.CO-02 | + RS.MA-01, RS.MI-01, RS.MI-02, PR.AA-05, GV.SC-04 | + PR.AA-05 (risque inverse : concentration de privilège), GV.SC-05 |
| **ATT&CK** | T1657, T1078 | + T1565.002, T1195.002 [ÀV] | T1078 (la clé de l'éditeur devient une cible) |
| **D3FEND** | D3-IRA (réputation d'identifiant, vérifié D4) | + D3-AZET (seuil d'autorisation, vérifié D4), D3-MFA (multi-signature, vérifié D4) | D3-MFA |
| **OWASP Agentic / ATLAS** | Non applicable | Non applicable pour le cœur déterministe. ASI03 (abus de privilège) par analogie pour le principe « le rôle est limité » **[ÀV]** | ASI03 par analogie [ÀV] |

(Les ID D3FEND reprennent ceux déjà vérifiés dans `research/docs/D4_apis_protocoles_referentiels.md`, d'après `T1_P4_integration_ecosysteme.md`. Je n'ai pas rouvert d3fend.mitre.org aujourd'hui. L'architecture demande de ne rien afficher tant que ce n'est pas revérifié.)

### 5.2 Recommandation

**Modèle 2, accompagné du modèle 1 comme porte d'entrée.** Raisons :
1. **C'est là que sont les concurrents crédibles et l'argent** : Hypernative a choisi exactement cette forme (Guard Safe + API vers MPC) [P], et l'ESMA examine justement « contrôles des transactions, détection et réponse aux incidents, dépendance aux tiers » pour la garde en 2026-2027 [S]. L'argument de vente au RSSI d'un CASP est calé sur un exercice de supervision réel.
2. **C'est défendable juridiquement** : un veto à resserrement seul, voulu et écrit par le CASP, s'insère dans l'art. 75(3) (politique de garde) et dans un contrat art. 30 sans nous faire dépositaire [analyse].
3. **Ça répond à la critique de l'architecture v1** (« ne protège pas un coffre tiers fermé ») : sur Fuji, on montre un **Safe standard** qui reçoit notre Guard, pas notre propre coffre. Les contrats Safe v1.4.1 ont une adresse canonique sur Fuji (43113) [V : lecture de `safe-deployments/src/assets/v1.4.1/safe.json`, https://github.com/safe-global/safe-deployments]. Le service de transactions Safe n'y est pas listé (voir fichier intégration), donc le montage se fait sans passer par lui.
4. **Ça se bâtit vite** [estimation à valider, 3 à 4 h-worker] : un contrat Guard (~60 lignes : `checkTransaction` lisant plafond cumulé et état, `checkAfterExecution`, compatibilité ERC-165), un rôle `SENTINEL` qui ne peut que resserrer, la reprise par les gardiens. Le plafond et le mode RESTREINT existent déjà dans `GuardedVault` ; l'`ExecutionAdapter { tighten, restrict, release }` de l'architecture est l'interface qui permet d'avoir deux implémentations.
5. **Le modèle 3 ajoute un risque juridique et un risque de sécurité** (notre clé devient une cible, cf. Drift/Bybit dans l'architecture) pour un gain de vitesse que le plafond agrégé rend inutile à notre échelle.

**Pas recommandé comme produit : l'extension navigateur** (Wallet Guard et Blowfish ont fermé ; ne couvre pas un co-signer machine ; l'interface était justement la surface compromise à Bybit).

### 5.3 Comment le démontrer sur Fuji (scénario de 3 minutes, sans nommer d'éditeur)

1. **Watch** : on colle l'adresse d'un Safe de test ; Hold up affiche le solde, les sorties, la fraîcheur. (Mode 1, déjà prévu.)
2. **Installer le veto** : transaction Safe qui active `SentinelGuard` sur le Safe de test. Écran : « Ce que ce gardien peut faire : resserrer. Ce qu'il ne peut pas : signer, libérer, changer un rôle » (matrice générée depuis les rôles on-chain).
3. **Attaque simulée** : signataires de test compromis, sorties vers adresses neuves ; D1/D2/D3 montent, L2 puis L3 ; le Guard refuse la transaction suivante (`revert` visible sur Snowtrace) ; la voie rapide d'un client déjà en liste blanche continue.
4. **Cas Bybit en miniature** : une transaction Safe `delegatecall` vers un contrat de test qui remplace l'implémentation du proxy est **refusée par règle** (liste d'adresses approuvées) ; D7 émet l'alerte. Étiqueter : « inspiré d'un schéma d'attaque public, sur contrats de test ».
5. **Callback documenté** : le stub `POST /policy/decision` répond APPROUVER/REFUSER à un mock étiqueté « SIMULATION d'un co-signer ». **Ne pas nommer Fireblocks ni afficher `RETRY`** tant que le point de contradiction (§1.3) n'est pas levé.
6. **Dossier** : brouillon DORA + preuve ancrée + phrase « qui a décidé » (charte signée par la direction).

Limites à dire : un Guard ne couvre que les transactions signées par les propriétaires (le Module Guard v1.5.0 couvre les modules) ; un Guard défectueux peut bloquer un Safe ; Fuji est un démonstrateur.

---

## 6. Corrections et ajouts proposés pour `docs/architecture.md` (non appliqués)

1. **§2 tableau des modes** : renommer « Callback de politique (stub testé) » en deux lignes, **Safe Guard à resserrement seul** (construit si le temps le permet, sinon « conception ») et **callback de co-signer** (stub). Ajouter la colonne « mode de panne » (fail-closed ou fail-open après délai).
2. **§7 / §13 MiCA** : l'art. 75(8) est maintenant lu sur EUR-Lex (via extrait) : responsabilité envers les clients pour la perte de crypto-actifs ou des moyens d'accès, plafonnée à la valeur de marché au moment de la perte, avec exclusion des événements indépendants du service. Le mot « à confirmer » peut devenir « lu, alinéas à citer depuis le texte final ». Ajouter 75(3) (politique de garde) comme **point d'accroche juridique** du droit de veto.
3. **§6** : ajouter la ligne « droit de retrait du gardien par le CASP sans notre accord » (sortie de secours) comme exigence de contrat.
4. **§13 / limites** : ajouter l'ESMA CSA garde 2026-2027 comme preuve de besoin marché (source secondaire, à rouvrir sur esma.europa.eu).
5. **§21 Intégration** : remplacer « Safe non branché » par « Safe Guard : conception ou construit selon l'état à 06h30 ; modules non utilisés par choix (risque de qualification en garde) ».
6. **Éviter à l'oral** : toute affirmation sur `RETRY` de Fireblocks, sur Avalanche chez Hypernative, sur l'adoption d'ERC-7730 par Safe.

---

## 7. À vérifier avant toute affichage (liste courte)

1. **Fireblocks `RETRY`/`IGNORE`** : deux pages se contredisent (échec vs 20 tentatives × 3 min). Rouvrir `developers.fireblocks.com/reference/automated-signer-callback` (404 à l'ouverture directe aujourd'hui).
2. **Qualification du veto seul** au regard de MiCA art. 3(1) point 17 : demander à un juriste ou chercher une Q&R ESMA/AMF. Je n'en ai pas trouvé.
3. **Numérotation DORA** (art. 3(19), (21), (22), art. 2(1)(f)) : relue sur un site non officiel. Re-vérifier sur EUR-Lex 32022R2554.
4. **MiCA art. 73** alinéas exacts et **art. 143** (fin de la période transitoire des CASP) : non lus.
5. **Position finale de l'EDPB** sur les adresses de portefeuille (PDF illisible).
6. **Safe / ERC-7730** : adoption par Safe et par Ledger pour les transactions Safe non confirmée.
7. **Bybit** : délai entre l'écrasement de l'implémentation et le premier transfert ; dates d'injection ; existence de « Safe Utils » officiel.
8. **BitGo** : verrouillage de 48 h de la liste blanche (affirmé par une page tiers).
9. **Hypernative sur Avalanche** et intégration technique Fireblocks.
10. **Pocket Universe** : statut 2026.
11. **Mapping ATT&CK** T1195.002 et T1565.002 : non vérifiés sur attack.mitre.org.
12. **Estimation 3 à 4 h-worker du `SentinelGuard`** : de moi, non mesurée.

---

## Sources principales (ouvertes ou repérées le 10 oct. 2026)

- Fireblocks : https://developers.fireblocks.com/docs/cosigner-architecture-overview ; https://developers.fireblocks.com/docs/set-transaction-authorization-policy ; https://developers.fireblocks.com/docs/integrating-third-party-aml-providers ; https://www.fireblocks.com/blog/new-in-fireblocks-security-summer-2026 ; https://developers.fireblocks.com/reference/configure-transaction-authorization-policy ; https://support.fireblocks.io/hc/en-us/articles/29184395887772-About-Policies
- BitGo : https://developers.bitgo.com/cookbooks/policies-webhook ; https://developers.bitgo.com/docs/policies-overview
- Ledger Enterprise : https://help.vault.ledger.com/help-center/core/workspace-administration/accounts/create-an-account ; https://www.ledger.com/blog-merkle-tree-hsm-scaling-ledger-enterprise-security
- Cobo : https://news.cobo.com/cobo-argus-fact-sheet/ ; Copper : https://developer.copper.co/guides/clearloop/introduction
- Safe : https://docs.safe.global/smart-account-guards ; https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative ; https://help.safe.global/articles/5490514177-what-is-a-module ; https://safefoundation.org/blog/introducing-safe-v1-5-0-module-guards-enhanced-smart-account-features ; https://github.com/safe-global/safe-deployments ; https://safe.global/blog/safe-ecosystem-foundation-statement
- Hypernative : https://www.hypernative.io/products/hypernative-guardian
- Blockaid / Privy / Portal : https://blockaid.io/blog/privy-integrates-blockaid-to-bring-transaction-security-into-global-wallets ; https://docs.portalhq.io/integrations/Security/blockaid ; https://safe.global/blog/safe-wallet-gets-even-safer-introducing-blockaid-integration
- Extensions : https://walletguard.app/blog/wallet-guard-sunset-notice ; https://phantom.com/learn/blog/phantom-acquires-blowfish ; https://www.alchemy.com/dapps/pocketuniverse ; https://arxiv.org/pdf/2504.11735
- Forta / Venn : https://docs.forta.network/en/latest/what-is-forta-firewall/ ; https://www.businesswire.com/news/home/20240925419323/en
- Tenderly : https://docs.tenderly.co/simulations/overview ; https://tenderly.co/blog/changelog/comparing-safe-transaction-hashes-on-tenderly/
- Bybit : https://www.bleepingcomputer.com/news/security/lazarus-hacked-bybit-via-a-breached-safe-wallet-developer-machine/ ; https://blocksec.com/blog/bybit-incident-a-web2-breach-enables-the-largest-crypto-hack-in-history ; https://www.nccgroup.com/research/in-depth-technical-analysis-of-the-bybit-hack/ ; https://www.elastic.co/security-labs/threat-command/bit-bybit
- Vérification de transactions : https://github.com/BootNodeDev/safe-utils ; https://operatorportal.lido.fi/public/relay-maintenance-committee/how-to-review-a-safe-tx-rmc-edition ; https://www.cyfrin.io/blog/hardware-wallet-security-what-your-device-must-show-you ; https://help.safe.global/en/articles/276344-how-to-verify-safe-txs-trustlessly-on-a-hardware-wallet
- Clear signing : https://unchainedcrypto.com/ethereum-foundation-launches-clear-signing-standard-to-end-blind-signing-exploits/ ; https://docs.sourcify.dev/blog/intro-to-erc7730/
- MiCA : https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023R1114
- DORA : https://www.digital-operational-resilience-act.com/Article_2.html ; /Article_3.html ; /Article_28.html ; /Article_30.html ; RTS 2025/532 : https://finreg.aoshearman.com/eu-rts-on-subcontracting-ict-services-supporting- ; https://www.jonesday.com/en/insights/2025/07/uniform-standards-for-ict-subcontracting-in-eu-financial-sector-new-obligations
- ESMA CSA : https://www.williamfry.com/knowledge/esma-targets-casp-custody-resilience/
- AI Act : https://artificialintelligenceact.eu/annex/3/ ; https://artificialintelligenceact.eu/recital/12/ ; https://artificialintelligenceact.eu/article/3/
- RGPD : https://cm.twobirds.com/en/insights/2025/eu-the-srb-decision-a-new-era-for-personal-data-and-data-processing-agreements ; https://streamlex.eu/law-resources/edpb-guidelines-02-2025-blockchain-v2/ ; https://www.edpb.europa.eu/system/files/2026-07/edpbreport_publicconsultaton_guidelines_blockchain_202502_en.pdf
- Répartition hot/cold : https://www.spark.money/tools/crypto-exchange-security-comparison ; https://benzinga.com/z/29709239

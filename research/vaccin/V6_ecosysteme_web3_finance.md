# V6 — Écosystème de veille menaces Web3 et finance : ce qu'on peut brancher

> Recherche du 2026-10-10 (avant 11h30, autorisée). Objectif : identifier les flux qu'**Antibody consomme** (on ne détecte pas tout nous-mêmes) pour les transformer en vaccins testés dans l'arène, puis prouvés sur Avalanche.
> Légende vérification : **[testé]** = appel réel fait aujourd'hui depuis la machine d'Adem ; **[doc]** = lu dans la doc officielle ; **[presse]** = source secondaire, à confirmer.
> Rappel règlement : on ne fait que **lire** ces flux. Aucune action contre un système réel ; les IoC mainnet sont rejoués sur **notre** arène Fuji.

## 1. Tableau complet

| Source | Ce qu'elle publie | Format / accès | Coût / licence | Fraîcheur | Avalanche / C-Chain | Vérif. |
|---|---|---|---|---|---|---|
| **Chainabuse (TRM Labs)** | Signalements communautaires d'arnaques : adresses, domaines, catégorie, date, description, score de confiance, pertes déclarées | REST `https://api.chainabuse.com/v0/reports` (Basic auth, clé = user+password), filtres `address`, `chain`, `category`, `trusted`, `since` ; endpoint POST pour signaler | Clé gratuite **10 appels/mois** (50 rapports/appel) ; partenaires 5 000/h sur demande. « Proprietary API » : réutilisation commerciale = accord partenaire | Temps réel (crowdsourcing) | Oui : `ChainKind` inclut `AVALANCHE` | [doc] |
| **TRM Sanctions API (gratuite)** | Booléen `isSanctioned` par adresse (listes de sanctions, dont OFAC) | `POST https://api.trmlabs.com/public/v1/sanctions/screening`, JSON `[{address}]` | **Sans clé** : 1 req/s, 100 req/jour ; clé gratuite sur demande pour plus | Suivi des désignations | Adresses EVM → valable C-Chain | **[testé]** : exploiteur Ronin `0x098B…2f96` → `true` |
| **ScamSniffer `scam-database`** | `blacklist/domains.json` (~357 000 domaines) et `blacklist/address.json` (~2 530 adresses de drainers/phishing) | Dépôt GitHub, JSON brut | Gratuit, **GPL-3.0** (copyleft : OK si on consomme la donnée sans redistribuer de code dérivé ; à valider). Données **retardées de 7 jours** ; temps réel = 999 $/mois | Commit quotidien (dernier push : 2026-10-10 04:01 UTC) | Adresses EVM, non étiquetées par chaîne | **[testé]** |
| **MetaMask `eth-phishing-detect`** | Listes `blacklist` (~105 600 domaines), `whitelist`, `fuzzylist` (algorithme de typosquat, `tolerance: 1`) | GitHub `src/config.json` + API `https://phishing-detection.api.cx.metamask.io/v1/stalelist` (~2,4 Mo) ; détecteur déplacé dans `MetaMask/core` (`phishing-controller`) | Gratuit, licence **DBAD 1.2** (permissive, réutilisation commerciale possible avec attribution, sans se présenter comme MetaMask) | Plusieurs fois par jour (dernier push : 2026-10-10 10:58 UTC) | Domaines (agnostique chaîne) | **[testé]** |
| **OFAC SDN (crypto)** | Adresses « Digital Currency Address » de la liste SDN | Officiel : XML/CSV OFAC (Sanctions List Service). Extraction prête : GitHub `0xB10C/ofac-sanctioned-digital-currency-addresses`, branche `lists`, fichiers `sanctioned_addresses_ETH.txt/json` (120 adresses), + USDT, USDC, ARB, BSC… | Domaine public (US Gov) ; extracteur **MIT** | Nightly (dernier push : 2026-10-01) | Pas de fichier AVAX dédié, mais les adresses ETH/USDT/USDC EVM s'appliquent telles quelles sur C-Chain | **[testé]** |
| **Chainalysis free sanctions** | API gratuite `isSanctioned` + oracle on-chain | API `public.chainalysis.com/api/v1/address/{addr}` header `X-API-Key` (clé via formulaire) ; oracle `0x40C57923924B5c5c5455c48D93317139ADDaC8fb` sur Avalanche | Gratuit avec clé. **Oracle déclaré « no longer supported or maintained »**, déconseillé pour nouvelles intégrations (MAJ page 18/03/2026) | — | Oracle déployé sur Avalanche mais en fin de vie | **[testé]** 403 sans clé ; [doc] |
| **DeFiHackLabs (SunWeb3Sec)** | **888 incidents DeFi reproduits** en tests Foundry (`src/test/AAAA-MM/<Nom>_exp.sol`), avec perte, cause racine, tx d'attaque | GitHub, `forge test --contracts src/test/2025-07/AvaxBIFKNPair_exp.sol -vvv` (fork d'un RPC archive) | Gratuit, **Apache-2.0** (commercial OK) | Plusieurs ajouts/semaine (incidents d'oct. 2026 déjà présents) | Oui, quelques cas : **Platypus** (2023-02, 2023-07, 2023-10), **DeltaPrime** (2024-11), **AvaxBIFKNPair** (2025-07, ~7 000 WAVAX) ; nécessite un RPC **archive** Avalanche | **[testé]** README |
| **SlowMist Hacked** | Base de 2 307 incidents (~39,07 Md$) : date, cible, description, perte, méthode d'attaque, lien source | Site web paginé, filtre « Avalanche » ; **pas d'API ni d'export** | « All Rights Reserved » : citer, ne pas aspirer massivement | Continu | Filtre Avalanche dédié | [doc] |
| **rekt.news** | Post-mortems éditoriaux + leaderboard (328 entrées : nom, auditeur, montant, date) | Site web, pas d'API/RSS documenté | « All rights reserved » : citation seulement | Hebdomadaire environ (dernier : 30/09/2026) | Pas d'entrée Avalanche dans le top leaderboard | [doc] |
| **GoPlus Security API** | Sécurité d'adresse (sanctioned, stealing_attack, phishing, mixer… sources SlowMist/BlockSec), token (honeypot, taxes, holders), approvals, site de phishing, dApp, décodage de signature, simulation de tx | REST `https://api.gopluslabs.io/api/v1/...` ; **fonctionne sans clé** (quota limité) ; clé/CU payés, achat de CU via **x402** | Gratuit en usage léger ; CGU à relire pour usage commercial | Temps réel | **Oui, `chain_id=43114`** dans la liste officielle (Fuji non listé) | **[testé]** |
| **Forta Network** | Alertes de bots de détection (Attack Detector), Forta Firewall (attestation pré-chaîne) | GraphQL `https://api.forta.network/graphql` : **plan payant** requis ; dataset `forta-network/labelled-datasets` (MIT) figé depuis janv. 2023 | Payant / dataset gratuit mais périmé | Alertes temps réel ; pas d'actualité 2025-2026 trouvée | Historiquement supporté ; statut 2026 non confirmé | [doc] |
| **Blockaid** | Scan de transaction (simulation pré-signature), d'adresse, de dApp, de token, monitoring on-chain | REST (`/v0/evm/transaction/scan`, header `X-API-Key`) ; docs derrière login | Commercial, clé via commerciaux | Temps réel | Oui : **moteur de sécurité du wallet Core d'Ava Labs** depuis juin 2024 | [presse]/[doc partielle] |
| **Hypernative** | Détection pré-exploit (200-300 types de risques), Guardian (simulation + politique avant signature), réponses automatisées | Plateforme SaaS, API/SDK pour clients | Entreprise, sur devis | Temps réel | Avalanche dans les chaînes supportées (70+) | [presse] |
| **Web3 Antivirus (W3A)** | Extension navigateur gratuite et open source : simulation de tx, drainers, honeypots, poisoning, approvals ; Snap MetaMask | Pas d'API publique trouvée | Gratuit (utilisateur final) | — | Analyse tx surtout Ethereum ; phishing agnostique | [presse] |
| **SEAL 911** | Hotline d'urgence (bot Telegram `@seal_911_bot`), ~30 membres vérifiés ; journal public `ACTIVITY.md` des incidents résolus | GitHub, aucun flux de données | Gratuit, bénévole | Journal mis à jour (dernier push 2026-10-04) | N/A | **[testé]** |
| **SEAL-ISAC** | Partage de renseignement crypto sur **OpenCTI** (adresses, entités, relations), flux automatiques curatés, alertes, playbooks | OpenCTI (export STIX 2.1 natif) ; adhésion sur dossier | Gratuit, réservé aux membres (EF, Polygon, Uniswap, Chainalysis, MetaMask…) | Continu | Agnostique chaîne | [presse] |
| **Immunefi** | 232 programmes de bug bounty actifs : actifs en scope, impacts, barème par sévérité, PoC exigés | `https://immunefi.com/public-api/bounties.json` (non documenté, sans auth) | Données publiques, pas de licence explicite | Continu | **28 programmes** mentionnent Avalanche | **[testé]** |
| **Etherscan labels** | Name tags et labels (exchange, exploiter, phish-hack…) | API V2 `module=nametag&action=getaddresstag` : **Pro Plus uniquement**, 2 appels/s ; export CSV = Enterprise | Payant ; alternatives open data : `dawsbot/eth-labels` (MIT, actif), `brianleect/etherscan-labels` (MIT, figé 2023) | — | Couverture C-Chain via V2 multichain à vérifier | [doc] |
| **Snowtrace / Routescan** | Explorateur officiel C-Chain ; API compatible Etherscan ; API Nametags | `https://api.routescan.io/v2/network/{mainnet\|testnet}/evm/{43114\|43113}/etherscan/api?...` **sans clé** | Gratuit (quota non publié) | Temps réel | **Natif, mainnet et Fuji** | **[testé]** (balance mainnet, bloc Fuji) |
| **ERC-8259** « AI Agent Identity & Threat Registry » | Brouillon : `IAgentIdentity`, `IAgentReputation` (nœuds de sécurité qui montent/baissent un score), `IThreatRegistry` (oracle de signaux) | Post Ethereum Magicians du 08/05/2026 (auteur « ibonon »), **PR ethereum/ERCs #1730 encore ouverte** | Standard ouvert | Aucune réponse, aucune implémentation de référence ni déploiement trouvés | — | [doc] |
| **FS-ISAC** | Renseignement cyber secteur financier, alertes, playbooks | Flux **STIX/TAXII et MISP**, licence par jeu d'identifiants ; app, chat CONNECT | Adhésion payante (barème par actifs/CA), flux en option pour petits tiers ; fintechs et paiements éligibles | Continu | N/A (non crypto-spécifique) | [doc] |
| **Cifas (UK)** | National Fraud Database (~800 membres) ; rapports Fraudscape (2025 : 444 000 cas ; S1 2026 : 220 000, SIM swap +402 %, mules +69 %) | Base réservée membres ; rapports PDF publics | Adhésion payante ; rapports gratuits | Semestriel | N/A | [presse] |
| **Europol IOCTA 2026** (28/04/2026) | Typologies : fraude à l'investissement crypto, BEC, crime-as-a-service, IA générative, « velocity gap » | PDF | Public | Annuel | N/A | [presse]/[doc] |
| **GAFI / FATF** | Rapport ciblé stablecoins et wallets non hébergés (mars 2026) ; 7e mise à jour VA/VASP (juillet 2026) : Travel Rule 83 % des juridictions, stablecoins, scam centres, DPRK, fraude IA | PDF | Public | Annuel + rapports ciblés | Stablecoins multi-chaînes | [presse] |
| **Banque de France — OSMP** | Rapport 2025 (publié 07/09/2026) : fraude 1,241 Md€ (+3,8 %), **virement 484,7 M€ (+36,7 %, 39 % des pertes)**, dont +98 M€ sur l'instantané ; fraude par manipulation (faux conseiller, substitution d'IBAN) +34 % | PDF + site observatoire-paiements.fr | Public | Annuel | N/A (paiements fiat) | [presse] + PDF officiel |

## 2. TOP 5 à brancher dans la démo

Critères : gratuit, appel simple, utile pour Avalanche, et **montrable en 10 secondes** (« le signal vient de l'écosystème, Antibody le transforme en vaccin testé »).

### 1. GoPlus Security API — le meilleur rapport valeur/effort
Seule source testée qui répond **sans clé** et **avec `chain_id=43114`**. Couvre adresse, token, approval, phishing.
```bash
# Adresse : sanctioned, stealing_attack, phishing_activities, mixer… (sources SlowMist, BlockSec)
curl "https://api.gopluslabs.io/api/v1/address_security/0x098B716B8Aaf21512996dC57EB0615e2383E2f96?chain_id=43114"
# → "sanctioned":"1","stealing_attack":"1","data_source":"SlowMist,BlockSec"
# Domaine
curl "https://api.gopluslabs.io/api/v1/phishing_site?url=adidas-metaverse.io"   # → "phishing_site":1
# Token (honeypot, taxes, propriétaires) sur C-Chain
curl "https://api.gopluslabs.io/api/v1/token_security/43114?contract_addresses=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"
```
Usage Antibody : enrichissement de la contrepartie dans la passerelle (règle déterministe `counterparty.risk_flags ∩ {sanctioned, stealing_attack, phishing_activities} ≠ ∅ → block`). Mettre en cache, prévoir un mode hors ligne.

### 2. TRM free Sanctions API — sanctions en un appel, sans clé
```bash
curl -X POST https://api.trmlabs.com/public/v1/sanctions/screening \
  -H "Content-Type: application/json" \
  -d '[{"address":"0x098B716B8Aaf21512996dC57EB0615e2383E2f96"}]'
# → [{"address":"0x098B…","isSanctioned":true}]
```
100 req/jour sans clé : assez pour la démo si on met en cache. Doublon volontaire avec #4 (liste OFAC locale) pour montrer la **corroboration multi-sources**.

### 3. ScamSniffer + MetaMask : listes de phishing et drainers en local
```bash
curl -s https://raw.githubusercontent.com/scamsniffer/scam-database/main/blacklist/address.json   # ~2 530 adresses drainers
curl -s https://raw.githubusercontent.com/scamsniffer/scam-database/main/blacklist/domains.json   # ~357 000 domaines
curl -s https://phishing-detection.api.cx.metamask.io/v1/stalelist                                # blocklist + allowlist + fuzzylist
```
Usage : vaccin sur la **provenance de l'instruction** (la facture piégée d'ALBA contient un lien ou un domaine de paiement → match blocklist ou typosquat fuzzylist → refus). Aucune clé, chargement au démarrage, hash du snapshot ancré avec le vaccin (preuve de la version de veille utilisée). Attention : ScamSniffer gratuit = **7 jours de retard**, GPL-3.0.

### 4. Liste OFAC SDN extraite (0xB10C) — liste officielle, versionnable
```bash
curl -s https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists/sanctioned_addresses_ETH.txt
curl -s https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists/sanctioned_addresses_USDT.txt
```
Source primaire (gouvernement US), MIT, mise à jour nightly. Les adresses EVM sont valides sur C-Chain. Parle directement à KPMG (filtrage sanctions = obligation réglementaire, pas un « nice to have »).

### 5. DeFiHackLabs — le corpus d'attaques réelles de l'arène
```bash
git clone https://github.com/SunWeb3Sec/DeFiHackLabs && cd DeFiHackLabs
git submodule update --init --recursive
forge test --contracts src/test/2025-07/AvaxBIFKNPair_exp.sol -vvv   # incident Avalanche, ~7 000 WAVAX
```
Usage : source des **scénarios de l'essai clinique** (Platypus, DeltaPrime, AvaxBIFKNPair = incidents Avalanche réels). Apache-2.0. Limite : un fork mainnet Avalanche exige un **RPC archive** (le RPC public n'en est pas un) ; pour la démo, on s'inspire du schéma d'attaque et on le rejoue sur nos contrats Fuji plutôt que de forker le mainnet.

**Remplaçant / bonus** : Routescan (API Snowtrace) sans clé, mainnet **et Fuji**, pour lire nos propres tx de démo (`/v2/network/testnet/evm/43113/etherscan/api`). Chainabuse est pertinent (Avalanche supporté) mais **10 appels/mois** en gratuit : à garder pour un seul appel « live » pendant le pitch, pas pour la boucle.

**Câblage proposé** : un module `intel/` qui charge les listes au démarrage (#3, #4), interroge #1 et #2 à la demande avec cache SQLite, et produit des **IoC normalisés** `{type, value, source, confidence, fetched_at, snapshot_hash}`. Chaque vaccin cite les IoC et le hash du snapshot qui l'ont déclenché : c'est ce hash qu'on ancre sur Fuji.

## 3. Ce que chaque acteur NE fait PAS (notre place)

| Acteur | Ce qu'il fait | Ce qu'il ne fait pas |
|---|---|---|
| Chainabuse, ScamSniffer, MetaMask, OFAC, TRM/Chainalysis sanctions | **Listes d'IoC** (adresses, domaines) | Ne transforment pas un IoC en **règle sur l'action financière** (montant, vélocité, changement de bénéficiaire, fractionnement) ; ne testent pas la règle contre des **faux positifs** sur des paiements légitimes ; ne voient pas une attaque nouvelle sans IoC connu |
| GoPlus, Blockaid, W3A, Hypernative Guardian | **Score de risque / simulation** d'une tx ou d'une adresse, avant signature | Pas de **boucle d'apprentissage incident → règle** ; pas de preuve publiable d'efficacité de la règle ; pensés pour un humain qui signe, pas pour un **agent IA** dont l'instruction vient d'une facture empoisonnée ; Blockaid/Hypernative sont fermés et sur devis |
| Forta, Hypernative (monitoring) | **Détection** d'exploits de protocole en temps réel | Côté protocole, pas côté **trésorerie d'une entreprise** ou agent payeur ; alertes, pas de vaccin réutilisable par un tiers ; Forta GraphQL payant, statut 2026 incertain |
| DeFiHackLabs, SlowMist Hacked, rekt.news | **Mémoire** des incidents (PoC, post-mortems) | Ne produisent aucune défense déployable ; rien ne mesure si une défense **bloquerait** la prochaine variante |
| SEAL 911, SEAL-ISAC, FS-ISAC, Cifas | **Partage humain** entre membres (OpenCTI, STIX/TAXII, MISP) | Partagent du renseignement, pas des **défenses exécutables testées** ; aucune preuve vérifiable par un auditeur que la défense a été appliquée ; accès réservé aux membres |
| Immunefi | **Primes** pour failles de code avant exploitation | Code des smart contracts, pas comportement d'un agent ni fraude par manipulation |
| ERC-8259 | **Brouillon** de registre identité + réputation + signaux de menace pour agents | Pas d'implémentation, pas de déploiement, pas de mesure d'efficacité : c'est un **réceptacle** pour nos attestations, pas un concurrent ; on peut s'aligner sur `IThreatRegistry` |
| Europol, GAFI, Banque de France OSMP | **Typologies** et chiffres | Pas d'IoC exploitables machine ; servent à **justifier les scénarios** (substitution d'IBAN +34 %, virement instantané +98 M€, stablecoins) et à parler le langage du jury KPMG |

**Phrase de pitch** : « La veille existe déjà, en abondance. Ce qui manque, c'est le chaînon entre un signal et une défense prouvée : Antibody consomme GoPlus, OFAC, ScamSniffer, DeFiHackLabs, en fait des vaccins sur l'action de paiement, les teste contre des variantes et des paiements légitimes, et publie la preuve sur Avalanche. »

**Mapping cadre** : NIST CSF 2.0 **ID.RA-02** (renseignement sur les menaces reçu de sources externes), **DE.AE-07** (CTI intégrée à l'analyse), **RS.MI** (atténuation) ; MITRE D3FEND (filtrage par réputation de domaine et d'adresse, à vérifier : famille `D3-…` « Reputation analysis ») ; ATT&CK **T1566** (phishing), **T1657** (Financial Theft) ; OWASP Agentic **ASI** (manipulation d'objectif / mauvais usage d'outil, IDs à vérifier).

## 4. Points d'attention
- **Licences** : ScamSniffer GPL-3.0 (consommer la donnée, ne pas embarquer de code dérivé), SlowMist et rekt.news « all rights reserved » (citer, ne pas aspirer), Chainabuse propriétaire. Apache/MIT/DBAD/domaine public : OK.
- **Clés** : aucune clé n'est nécessaire pour le TOP 5. Si on en prend une (Chainabuse, Chainalysis), elle va dans `.env` (gitignoré), jamais dans le repo.
- **Mainnet vs Fuji** : tous les IoC visent le mainnet. Dans l'arène, on **déploie des adresses de test** qui jouent le rôle d'un IoC (ou on injecte l'IoC réel dans la facture piégée) : on n'envoie jamais de fonds réels à une adresse réelle.
- **Données personnelles** : les adresses publiques d'exploiteurs sont des données publiques ; ne jamais stocker les champs de victimes (Chainabuse ne les renvoie pas de toute façon).
- **À vérifier avant slides** : CGU GoPlus pour usage commercial, statut Forta 2026, couverture Avalanche d'Etherscan V2, IDs D3FEND/ASI exacts.

## Sources
- GoPlus : https://docs.gopluslabs.io/llms.txt ; appels `api.gopluslabs.io` testés le 10/10/2026
- TRM Chainabuse : https://docs.trmlabs.com/guides/chainabuse/getting-started-2-1.md ; https://docs.trmlabs.com/api/chainabuse/reports/get-reports.md ; TRM Sanctions : https://docs.trmlabs.com/llms.txt
- ScamSniffer : https://github.com/scamsniffer/scam-database ; https://www.scamsniffer.io
- MetaMask : https://github.com/MetaMask/eth-phishing-detect
- OFAC : https://github.com/0xB10C/ofac-sanctioned-digital-currency-addresses
- Chainalysis oracle : https://go.chainalysis.com/chainalysis-oracle-docs.html
- DeFiHackLabs : https://github.com/SunWeb3Sec/DeFiHackLabs
- SlowMist : https://hacked.slowmist.io/ ; rekt : https://rekt.news/leaderboard
- Forta : https://docs.forta.network/en/latest/api/ ; https://www.forta.org/blog/forta-firewall-is-live-ushering-in-a-new-era-of-onchain-security-and-compliance
- Blockaid : https://partners.circle.com/partner/blockaid ; https://www.blockaid.io/
- Hypernative : https://hypernative.io/products/hypernative-platform
- Web3 Antivirus : https://web3antivirus.io
- SEAL : https://github.com/security-alliance/seal-911 ; https://www.businesswire.com/news/home/20240417493276/en/Security-Alliance-SEAL-Launches-Free-Crypto-Native-ISAC
- Immunefi : https://immunefi.com/public-api/bounties.json
- Etherscan : https://docs.etherscan.io/api-reference/endpoint/getaddresstag ; Routescan : https://build.avax.network/integrations/routescan
- ERC-8259 : https://ethereum-magicians.org/t/erc-8259-ai-agent-identity-threat-registry/28473 ; https://github.com/ethereum/ERCs/pull/1730
- FS-ISAC : https://www.fsisac.com/operating-rules ; https://fsisac.com/membership
- Cifas : https://www.cifas.org.uk/newsroom/fraudscape-2026-6-month-update
- Europol : https://www.europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf
- GAFI : https://www.regulationtomorrow.com/2026/03/fatf-targeted-report-on-stablecoins-and-unhosted-wallets/ ; https://comsuregroup.com/news/fatf-publishes-seventh-targeted-update-on-virtual-assets-and-vasps
- Banque de France OSMP : https://www.banque-france.fr/system/files/2026-09/Rapport_2025_de_l_OSMP.pdf ; https://www.banque-france.fr/system/files/2026-09/CP-OSMP-2026_20260907.pdf

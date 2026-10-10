# V10 — Ce que Blockaid (et les autres) ne font PAS : l'option « on assume de ne pas être les premiers » tient-elle ?

*Recherche du 2026-10-10. Règle appliquée : chaque affirmation renvoie à une URL lue aujourd'hui ; sinon « non trouvé ». « Non trouvé » veut dire « absent des pages publiques lues », pas « n'existe pas ». La doc développeur de Blockaid (docs.blockaid.io) exige une connexion (redirection 307 vers docs-login.blockaid.io) : certaines fonctions peuvent donc exister sans être publiques.*

## TL;DR

1. **Mauvaise nouvelle (à intégrer au pitch)** : Blockaid a déjà lancé en juillet 2026 une boucle très proche de nos « principes » : **Recommended Policies pour Cosigner**, où l'IA propose, des contrôles déterministes vérifient, un humain approuve, et la politique **ne peut que restreindre**. On y trouve aussi « Test Policies » (rejeu sur l'historique et trace par politique) [B6]. Hypernative a une page produit **« Agentic Payment Security »** (simulation, politique, « intent verification » pour agents, plus de 70 chaînes) [H1]. **Nos principes « le LLM propose, une règle décide » et « un vaccin ne peut que restreindre » ne sont donc PAS différenciants.**
2. **Avalanche n'est pas une niche vide** : Blockaid (Core wallet, chaînes `avalanche` et `avalanche-fuji` dans l'API) [B2][B3], GoPlus (chain id 43114) [G4], Hexagate/Chainalysis (en service sur Avalanche depuis avril 2025) [O3], Forta [O1], Cyvers [O5] et l'Agent Wallet de MetaMask (scan Blockaid sur Avalanche) [B4] y sont tous présents. **Ne plus dire « aucun concurrent sur Avalanche ».**
3. **Ce que personne ne montre publiquement** : (a) une **preuve d'efficacité d'une règle vérifiable par un tiers**, avec corpus d'attaque, corpus légitime, taux de faux positifs et version, ancrée et rejouable ; (b) la **chaîne d'autorité / provenance de l'instruction** de l'agent (qui a demandé quoi, via quel document) comme entrée de la décision de blocage ; (c) un **dossier de preuves orienté DORA art. 24-25 / AI Act art. 12-15**, produit à partir de tests adverses sur l'agent lui-même. C'est exactement ce que demande la grille de la Track 1 (« décisions traçables et défendables devant un régulateur ou un auditeur », « chaîne d'autorité ») [R0].
4. **Verdict** : l'option « on assume » **tient**, à condition de pivoter du discours « on invente le vaccin » vers « **on rend la défense des agents financiers prouvable et auditable** ». Les trois différenciations défendables sont en §6. **L'originalité ne figure pas dans la grille du jury** (détection 30 %, réponse 20 %, faisabilité 20 %, conformité et explicabilité 15 %, pitch 15 %) [R0].

---

## 1. Blockaid

| Question | Réponse documentée | Source |
|---|---|---|
| Avalanche C-Chain ? | **Oui.** Partenariat avec Core, le wallet d'Avalanche (juin 2024). L'enum `AddressReportSupportedChains` de l'API contient `avalanche` et `avalanche-fuji`. **Mais** l'enum `RiskExposureSupportedChains` (produit compliance de mai 2026) **ne contient pas Avalanche** (ethereum, base, bsc, arbitrum, optimism, aster, polygon, hyperevm, hyperliquid, lighter, tron, bitcoin, solana, polymarket). | [B2] [B3] |
| Offre pour agents : statut | (1) « AI agent tools » (scan de transaction, LangChain, serveur MCP, function calling, guides Eliza/G.A.M.E) annoncés en **bêta privée** en janvier 2025. (2) Intégration à **Bankr** (agent de trading IA, nov. 2025). (3) **MetaMask Agent Wallet** (8 juin 2026) : simulation, scan Blockaid et protection MEV sur Ethereum, Linea, Arbitrum, **Avalanche**, Optimism, Base, Polygon, BSC et Sei ; Guard Mode (plafonds journaliers, liste blanche de protocoles, 2FA) ; **Early Access limité à 200 places**, lancement public annoncé pour l'été 2026. | [B5] [B7] [B4] [B4b] |
| Offre pour agents : prix et accès | Aucun prix public. Vente par « Request a Demo », contrat SaaS sur bon de commande, évaluation gratuite de 30 jours. Doc développeur derrière une connexion. | [B8] [B9] |
| Métriques de faux positifs vérifiables ? | **Déclaratives uniquement.** « < 0,0002 % » de faux positifs sur les requêtes MetaMask (tweet d'avril 2024, rapporté par Cointelegraph et Coinlive) ; « au moins 99,99 % de précision » (communiqué de mai 2026) ; « 97 % de taux d'accord avec les chercheurs » et 180 k transactions revues par mois (page AI Exploit Detection) ; « near-zero false positive rate » (étude de cas DEX Screener). **Ni méthodologie, ni jeu de test, ni audit indépendant trouvés.** | [B10] [B11] [B12] [B13] |
| Preuves auditables par un tiers ? | Le produit Risk Exposure promet des « structured, audit-ready evidence » (catégories, montants USD, verdicts) pour les audits, déclarations de soupçon et échanges avec le régulateur. Cosigner « Test Policies » donne une trace d'évaluation par politique, mais **la page ne dit pas que ces résultats sont exportés, signés, ancrés ou vérifiables par un tiers**. Une « Audit Logs API » apparaît dans le catalogue apis.io (contenu non lu). **Ancrage cryptographique ou preuve rejouable : non trouvé.** | [B14] [B6] [B15] |
| Règles partagées ou ouvertes ? | **Le renseignement est partagé, les règles ne le sont pas.** « Identifier une adresse malveillante protège automatiquement tous les clients » (Customer Data Network, effet réseau revendiqué à « +25 % de précision »). Les Recommended Policies sont générées **par wallet**, à partir de ses 90 derniers jours ; le partage des politiques entre clients n'est pas mentionné. Règles ouvertes ou open source : non trouvé. | [B6] [B16] |
| Boucle de réentraînement | Oui : un modèle temps réel tourne sur 30+ chaînes, les cas à risque partent vers des agents enquêteurs, et « When the signal was wrong, that correction goes back into the real-time model ». | [B12] |
| Finance non crypto (IBAN, virement SEPA) ? | **Non trouvé.** « Crypto Fraud Prevention » cible les CEX, banques et fintechs, mais sur la fraude **crypto** (pig butchering, mules). Rien sur les rails fiat. | [B17] |
| Provenance des instructions d'un agent (prompt injection, chaîne d'autorité) ? | **Non trouvé.** Le billet de 2025 cite Freysa et dit que « prompt-based protections are not enough », mais la réponse de Blockaid porte sur la **transaction** (simulation, adresse, token), pas sur l'origine de l'instruction. Le billet Recommended Policies ne mentionne ni agents ni prompt injection. | [B5] [B6] |

**Point clé** : Blockaid juge **la transaction** (est-elle malveillante pour l'écosystème ?). Il ne juge pas **la décision de l'agent** (pourquoi l'agent veut-il payer ce fournisseur, sur l'ordre de qui, à partir de quel document ?). Une facture piégée qui redirige un paiement vers une adresse **neuve et propre**, dans les plafonds, n'est a priori pas un signal Blockaid. Nous n'avons trouvé aucune page qui dise le contraire, mais aucune qui le confirme non plus : **à formuler comme une hypothèse, pas comme un fait**.

## 2. GoPlus AgentGuard

| Question | Réponse documentée | Source |
|---|---|---|
| Nature | Outil open source (MIT) lancé le 6 février 2026 : « runtime interception + on-demand deep scanning », d'abord pour OpenClaw. Hooks qui bloquent les commandes destructrices, les écritures dans `.env` ou `.ssh`, et l'exfiltration par webhook ; scan statique des skills ; trust registry par skill ; patrouille quotidienne. | [G1] [G2] |
| Maturité | **458 étoiles, 66 forks**, 13 issues ouvertes, repo créé le 2 février 2026 ; contributions concentrées sur un développeur (218). Dernière release **v1.2.1** (29 septembre). **2 389 téléchargements npm** de `@goplus/agentguard` entre le 9 septembre et le 8 octobre 2026. Nombre d'utilisateurs : non trouvé. | [G1] [G3] [G5] |
| Web3 | Les règles web3 (WALLET_DRAINING, UNLIMITED_APPROVAL, HIDDEN_TRANSFER, PROXY_UPGRADE, SIGNATURE_REPLAY…) sont des règles de **scan statique de code de skill**. La README ne décrit **pas** d'évaluation web3 au runtime ni de simulation de transaction. L'API GoPlus est une option. | [G1] |
| Avalanche | L'API GoPlus et goplus-mcp listent Avalanche (chain id 43114). AgentGuard lui-même ne mentionne aucune chaîne. | [G4] |
| Faux positifs | **Aucune métrique.** Une allowlist de commandes sûres est censée les réduire. Le dossier `benchmarks/dsh` contient des tests fonctionnels, pas des mesures de précision. | [G1] |
| Preuves auditables | Journal local `~/.agentguard/audit.jsonl`, synchronisation cloud « redacted » en option. **Signature, inviolabilité ou ancrage : non trouvés.** | [G1] |
| Règles partagées | `agentguard subscribe` récupère les avis publiés par AgentGuard Cloud (flux de renseignement descendant). Registre fédéré entre plateformes : **feuille de route v2.0**. | [G1] |
| Finance non crypto | **Non trouvé.** | [G1] |
| Provenance | Trace **quelle skill** a lancé une action. Sur Claude Code, cette attribution est **heuristique** (la README dit « not 100% precise »). La provenance d'une instruction injectée par un **document** (facture, email) n'est pas décrite. | [G1] |

**Point clé** : AgentGuard protège **l'hôte de l'agent de code** (terminal, fichiers, secrets, skills). Ce n'est pas un contrôle des **décisions financières** d'un agent métier. Il est jeune, sans métriques et sans preuve.

## 3. Autres acteurs : présence sur Avalanche et offre agents

| Acteur | Avalanche | Offre agents IA | Source |
|---|---|---|---|
| **Hypernative** | Probable mais pas confirmé par une page Hypernative : « 70+/75+ chains », et Chainstack dit servir les nœuds Avalanche de Hypernative. | **Oui** : page « Agentic Payment Security » (Transaction Risk Assessment API APPROVE/DENY, « Organizational Web3 Policy » qui restreint destinations, sources et fonctions, Screener avec 37+ indicateurs, « intent verification »). Aucun prix (demande de démo). **Aucun taux de faux positifs, aucune attestation on-chain, aucune mention de prompt injection, de piste d'audit ou de DORA/MiCA.** Le bloc « Proven in Public. Verified Onchain. » de la page contient du texte de remplissage (lorem ipsum). Également : ION (IA qui propose, l'humain décide, août 2026) et Agent Studio (moniteurs créés en langage naturel, sept. 2026). | [H1] [H2] [H3] [H4] [H5] [H6] |
| **Forta** | **Oui** (Avalanche fait partie des 7 chaînes scannées). | Non trouvé (bots de détection on-chain pour les contrats). | [O1] |
| **Hexagate (Chainalysis)** | **Oui**, en service sur Avalanche depuis le 28 avril 2025 ; Ava Labs est client. | Non trouvé. | [O2] [O3] |
| **Cyvers** | **Oui** (fiche Circle Alliance : Arbitrum, Avalanche, Base, Ethereum, Linea). | « AI security agents » **côté défenseur** (triage, réponse automatique). Protection des agents des clients : non trouvée. SOC 2 Type II. | [O4] [O5] |
| **Webacy** | Avalanche seulement pour les outils vault (`avax`) ; pas dans la liste des chaînes de l'API adresses. | **Oui** : MCP pour agents (juin 2026), paiement par requête en x402, consigne « fail closed ». Score de risque d'adresse ou de token, pas de contrôle de décision. | [O6] [O7] |
| **Wallet Guard** | — | Racheté par Consensys en juillet 2024 pour renforcer MetaMask ; plus d'offre autonome trouvée. | [O8] |
| **Pocket Universe / Kerberus** | « all EVM chains » (Avalanche non nommé). | Grand public (extension navigateur, 200 000 utilisateurs). Offre agents : non trouvée. | [O9] [O10] |

**Constat transversal** : tous ces acteurs (Blockaid, Hypernative, Webacy, GoPlus, Cyvers) jugent **l'objet on-chain** : adresse, token, contrat, transaction simulée. **Aucun** ne publie : (i) de métrique de faux positifs vérifiable avec sa méthode ; (ii) de preuve d'efficacité rejouable par un tiers ; (iii) de contrôle fondé sur la **chaîne d'autorité** de l'instruction (agent de recherche → agent payeur, ASI03/ASI07) ; (iv) de couverture des rails fiat (IBAN, SEPA). Aucun ne se présente non plus comme outil de **test adverse de l'agent lui-même** (red teaming de son raisonnement).

## 4. Exigences réglementaires non couvertes explicitement par ces outils

| Texte | Exigence (lue) | Ce que les outils publient | Écart exploitable |
|---|---|---|---|
| **DORA art. 24** | Programme de tests de résilience « sound and comprehensive » ; tests menés par des **parties indépendantes** (§4) ; procédures pour classer et corriger les problèmes et **méthodes internes de validation** qui s'assurent que les faiblesses sont « fully addressed » (§5) ; tests au moins annuels des systèmes qui supportent des fonctions critiques (§6). [R1] | Détection et blocage en production. **Aucun ne se positionne comme programme de test DORA de l'agent IA**, ni ne produit de preuve qu'une faiblesse corrigée l'est vraiment (§5). | Notre « essai clinique » (rejeu, non-régression, preuve) correspond **mot pour mot** à l'art. 24 §5. |
| **DORA art. 25** | Tests appropriés : « scenario-based tests », « end-to-end testing », « penetration testing »… [R2] | Non trouvé chez ces acteurs, pour des agents. | Les scénarios d'arène sur l'agent = tests fondés sur des scénarios, de bout en bout. |
| **AI Act art. 15** | Niveau de robustesse « throughout their lifecycle » ; métriques de précision **déclarées** (§3) ; boucles de rétroaction des systèmes qui continuent d'apprendre à maîtriser (§4) ; mesures pour « prevent, detect, respond to » les exemples adverses et l'évasion de modèle (§5). **S'applique à partir du 2 décembre 2027** (haut risque, annexe III) selon la version consolidée lue. [R3] | Blockaid réentraîne son modèle à partir des corrections (boucle de rétroaction) sans publier de garde-fou ni de métrique. | Robustesse **mesurée en continu** et métriques déclarées. **Attention** : un agent comptes fournisseurs n'est **pas** forcément « haut risque » au sens de l'annexe III. À présenter comme bonne pratique ou anticipation, pas comme obligation. |
| **AI Act art. 12** | Journalisation automatique des événements sur toute la vie du système, pour la traçabilité. [R4] | Journaux propriétaires (Blockaid), JSONL local non signé (AgentGuard). | Journal inviolable (empreintes ancrées) des décisions de l'agent **et** du garde-fou. |
| **MiCA art. 68** | Les CASP doivent avoir des systèmes TIC « resilient and secure » **au sens de DORA** (§7), contrôler et évaluer régulièrement l'**efficacité** de leurs dispositifs, et conserver les enregistrements de toutes les opérations pendant 5 ans (jusqu'à 7). [R5] [R6] | Verdicts « audit-ready » de Blockaid pour la conformité AML, pas pour la résilience de l'agent. | « Évaluer régulièrement l'efficacité » = réexécuter les essais à chaque nouvelle souche (calendrier vaccinal). |
| **RTS MiCA (autorisation)** | Le dossier de notification doit décrire les audits et tests externes (tests d'intrusion en boîte noire, grise et blanche, revue du code des smart contracts). [R7] | — | Le dossier de preuves généré par Antibody peut alimenter ce dossier. |

**Ce que nous ne devons PAS prétendre** : remplacer un TLPT (DORA art. 26), être un « tiers indépendant » au sens de l'art. 24 §4 (on peut seulement **faciliter** la vérification par un tiers), ou rendre une entité conforme. La responsabilité reste à l'entité financière (déjà noté dans V_SYNTHESE).

## 5. Ce qu'un jury Avalanche / KPMG valoriserait même si l'idée n'est pas inédite

D'après la grille officielle de la Track 1 [R0] :
- **Efficacité de détection (30 %)** : précision, **taux de faux positifs** et temps de détection sur un scénario réaliste. → Montrer nos chiffres (n, intervalle de confiance) **là où Blockaid et Hypernative n'en publient aucun de vérifiable**. C'est notre meilleur levier.
- **Conformité et explicabilité (15 %)** : « décisions traçables et défendables devant un régulateur ou un auditeur ». Livrable demandé : une slide « comment un auditeur vérifie les décisions ». → Preuve rejouable plus journal ancré.
- **Piste 3 de la Track 1** (texte officiel) : journal de chaque action d'agent **avec sa chaîne d'autorité**, détection hors périmètre, tokens courts et révocables, kill switch, validation humaine. → **Personne parmi les acteurs lus ne documente la chaîne d'autorité** : c'est la case vide **que le jury lui-même a dessinée**.
- **Piste 4** : monitoring sur **Fuji**, pause, alertes, classification DORA, pré-déclaration.
- Conseil explicite du guide : « un seul scénario traité parfaitement » et préparer « si votre modèle se trompe, qui est responsable ? ».
- **Avalanche** : Fuji et ERC-8004 utilisés pour une vraie fonction (vérification par un tiers, multi-organisations), pas pour décorer. Hexagate, Blockaid et Forta sont sur Avalanche pour la sécurité **des contrats et des transactions** ; nous apportons la couche **agents**, qui complète la leur.
- **Recommandation de posture** : citer nous-mêmes Blockaid (Agent Wallet MetaMask, Cosigner Recommended Policies) et Hypernative (Agentic Payment Security), et nous **brancher dessus** (le scan Blockaid ou Hypernative peut devenir un des signaux en entrée de notre passerelle). « On ne remplace pas Blockaid ; on prouve que la défense de votre agent tient, et on le prouve à votre auditeur. »

## 6. VERDICT

**L'option « on assume de ne pas être les premiers » tient**, avec trois différenciations défendables et documentées. Il faut abandonner deux arguments : « personne sur Avalanche » et « le LLM propose, la règle décide / restriction seulement » comme nouveauté.

### D1 — La preuve d'efficacité vérifiable par un tiers (et pas une affirmation)
- **Chez eux** : faux positifs déclarés sans méthode (« < 0,0002 % », « 99,99 % », « 97 % d'accord ») [B10][B11][B12]. Test Policies de Blockaid = rejeu **privé** sur l'historique du client, sans export, signature ni ancrage mentionnés [B6]. Hypernative : aucune métrique, et un bloc « Verified Onchain » vide [H1]. AgentGuard : aucune métrique, journal non signé [G1].
- **Chez nous** : chaque règle est publiée avec empreinte du corpus d'attaque, empreinte du corpus légitime, taux de blocage, taux de faux positifs (n, IC), versions, signature de l'approbateur, ancrés sur Fuji et **rejouables par l'auditeur**. Cela correspond à DORA art. 24 §5 (« internal validation methodologies ») [R1] et à AI Act art. 15 §3 (métriques déclarées) [R3].
- **Nuance honnête** : la différence ne vient pas du rejeu (Blockaid rejoue aussi), mais de son **caractère adverse** (variantes d'attaque, pas seulement l'historique) et **vérifiable de l'extérieur**.

### D2 — La décision de l'agent, pas seulement la transaction : chaîne d'autorité et provenance de l'instruction
- **Chez eux** : verdict sur adresse, token, contrat et simulation [B1][H1][O6]. Provenance : Blockaid non trouvé ; AgentGuard trace la **skill** qui agit, de façon heuristique [G1] ; Hypernative parle d'« intent verification » sans la définir [H1].
- **Chez nous** : la règle porte sur (montant, contrepartie nouvelle, vélocité) **et** (l'ordre vient-il d'un contenu non authentifié ou d'un agent à faible privilège ?). C'est l'enjeu ASI03/ASI07 et la piste 3 écrits dans le guide [R0]. Cas d'école : la facture piégée vers une adresse **neuve et propre**, dans les plafonds, est le cas où un scan de réputation n'a, par construction, rien à signaler (hypothèse à démontrer en démo, pas un fait sourcé sur Blockaid).
- Extension possible et inexplorée par tous : le même contrôle s'applique à un virement **IBAN** (aucun des acteurs ne couvre le fiat : non trouvé partout).

### D3 — Le test adverse de l'agent lui-même, transformé en dossier de preuves réglementaire et partageable
- **Chez eux** : Blockaid réentraîne **son propre** modèle à partir des verdicts de ses agents enquêteurs [B12] ; Hypernative ION ou Agent Studio et Blockaid Recommended Policies génèrent des règles à partir de **l'historique on-chain** du client [H5][H6][B6]. Aucun ne lance d'attaques contre **l'agent du client** pour en tirer une règle, et aucun ne livre de dossier DORA, AI Act ou MiCA. Le partage porte sur le **renseignement** (adresses), pas sur les **règles prouvées** [B16].
- **Chez nous** : arène → autopsie mappée ATLAS/ASI → règle → essai → dossier de preuves (DORA art. 24-25, AI Act art. 12/15, MiCA art. 68) → règle partageable avec sa preuve (BORA protégé sans avoir été attaqué).

### Ce qui n'est PLUS différenciant (retirer du pitch ou citer comme « état de l'art »)
- « Le LLM propose, une règle déterministe décide ; humain dans la boucle ; règle seulement restrictive » → **Blockaid Cosigner Recommended Policies, juillet 2026** [B6] et **Hypernative ION** [H5].
- « Pré-transaction pour agents, simulation, plafonds, listes blanches » → MetaMask Agent Wallet + Blockaid [B4], Hypernative [H1].
- « Premier sur Avalanche » → Blockaid, Hexagate, Forta, Cyvers, GoPlus y sont [B2][O1][O3][O4][G4].

---

## Sources (toutes lues le 2026-10-10)

**Blockaid**
- [B1] https://www.blockaid.io/blog (liste des billets 2026)
- [B2] https://www.blockaid.io/blog/blockaid-bolsters-security-on-avalanche-with-core-integration
- [B3] https://raw.githubusercontent.com/api-evangelist/blockaid/refs/heads/main/openapi/blockaid-chain-agnostic-api-openapi.yml (enums des chaînes, miroir OpenAPI tiers)
- [B4] https://forklog.com/en/news/metamask-unveils-wallet-for-the-era-of-ai-agents · [B4b] https://www.techflowpost.com/en-US/newsletter/124837
- [B5] https://www.blockaid.io/blog/how-to-build-smarter-safer-onchain-ai-agents-with-blockaid
- [B6] https://www.blockaid.io/blog/introducing-recommended-policies-for-cosigner-onchain-operational-security-powered-by-ai
- [B7] https://blockaid.io/blog/blockaid-expands-protection-to-the-bankr-experience
- [B8] https://www.blockaid.io/demo · contrat SaaS : https://www.blockaid.io/api/legal-docs/file/Blockaid%20SaaS%20Agreement%20Template%20-%20%20Jan%202026%20(Current)
- [B9] https://docs.blockaid.io/docs/introduction (redirection vers une page de connexion)
- [B10] https://cointelegraph.com/news/blockaid-caused-crypto-drainer-shut-down-defends-against-claims-false-positives · https://www.coinlive.com/news/blockaid-refutes-accusations-of-false-positives-in-crypto-drainer-shutdown
- [B11] https://www.prnewswire.com/apac/news-releases/blockaid-launches-real-time-risk-infrastructure-to-help-institutions-enforce-compliance-at-defi-speed-302771339.html
- [B12] https://blockaid.io/ai-exploit-detection
- [B13] https://www.blockaid.io/case-studies/dex-screener
- [B14] https://www.blockaid.io/blog/compliance-cant-wait-a-minute-introducing-blockaid-risk-exposure
- [B15] https://apis.io/apis/blockaid/blockaid-evm-api/
- [B16] https://blockaid.io/end-user-protection · https://blockaid.io/blog/left-of-boom-how-blockaid-prevents-pig-butchering-crypto-fraud-scams
- [B17] https://www.blockaid.io/crypto-fraud-prevention · https://www.blockaid.io/cosigner
- Monitoring et agents enquêteurs : https://www.prnewswire.com/news-releases/blockaid-expands-onchain-monitoring-as-infrastructure-failures-drive-74-of-crypto-losses-302874819.html

**GoPlus**
- [G1] https://github.com/GoPlusSecurity/agentguard (README, étoiles, règles)
- [G2] https://www.kucoin.com/news/flash/goplus-launches-agentguard-to-secure-ai-agent-execution · https://www.gate.com/news/detail/18618112
- [G3] https://github.com/GoPlusSecurity/agentguard/releases
- [G4] https://github.com/GoPlusSecurity/goplus-mcp · https://docs.gopluslabs.io/reference/approvalcontractusingget
- [G5] https://api.npmjs.org/downloads/point/last-month/@goplus/agentguard

**Hypernative**
- [H1] https://www.hypernative.io/use-cases/agentic-payment-security
- [H2] https://www.hypernative.io/industry/payment-providers
- [H3] https://www.hypernative.io/solutions/chain-integrations · https://www.hypernative.io/insights/blog/hypernative-brings-real-time-security-to-robinhood-chain
- [H4] https://chainstack.com/hypernative-mitigating-web3-risks-chainstack-infrastructure/amp/
- [H5] https://www.hypernative.io/insights/blog/introducing-hypernative-ion-the-ai-orchestrator-that-maps-deploys-adapts-your-onchain-defense
- [H6] https://www.hypernative.io/insights/blog/introducing-hypernative-agent-studio-build-custom-onchain-security-agents-in-plain-language · https://www.hypernative.io/product/transaction-guard

**Autres**
- [O1] https://docs.forta.network/en/latest/FAQs/
- [O2] https://www.chainalysis.com/blog/chainalysis-hexagate-announcement/
- [O3] https://www.chainalysis.com/blog/hexagate-by-chainalysis-now-live-on-avalanche/
- [O4] https://partners.circle.com/partner/cyvers
- [O5] https://cyvers.ai/
- [O6] https://docs.webacy.com/integrations/agent-reference · https://docs.webacy.com/integrations/mcp-server
- [O7] https://www.webacy.com/blog/ai-agents-need-risk-intelligence-introducing-the-webacy-mcp-for-claude-cursor-and-agentic-finance
- [O8] https://consensys.com/blog/consensys-acquires-wallet-guard-to-enhance-metamask-security
- [O9] https://www.kerberus.com/articles/pocket_universe/
- [O10] https://www.theblock.co/news/deals/2025-08-21-crypto-security-firm-kerberus-acquires-power-universe-anti-fraud-browser-extension-ethereum-solana-wallets-367826

**Réglementation et règlement**
- [R0] `context/notion_guide.md` (Track 1 : enjeux, piste 3, grille d'évaluation)
- [R1] https://www.digital-operational-resilience-act.com/Article_24.html
- [R2] https://www.digital-operational-resilience-act.com/Article_25.html
- [R3] https://artificialintelligenceact.eu/article/15/
- [R4] https://artificialintelligenceact.eu/article/12/
- [R5] https://www.springlex.eu/en/packages/mica/mica-regulation/article-68/
- [R6] https://data.consilium.europa.eu/doc/document/ST-15166-2024-INIT/en/pdf
- [R7] https://webgate.ec.europa.eu/regdel/web/delegatedActs/2453/documents/latest?lang=en

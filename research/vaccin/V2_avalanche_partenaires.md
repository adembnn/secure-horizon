# V2 — Ancrer le « système immunitaire pour agents IA financiers » dans Avalanche + partenaires

> Recherche du 2026-10-10 (Track 1 « Guardians of Value »). Jury : Team1 Avalanche, KPMG, Kryptosphère, Utopia, AWS.
> Toutes les adresses et API ci-dessous sont **à revérifier sur Snowtrace / dans la doc** avant intégration. Aucune action contre un système réel : tout tourne sur Fuji (testnet) et dans notre arène.
> Rappel règlement (`context/notion_guide.md`, l. 58) : la piste 4 de la Track 1 cite explicitement « monitoring on-chain d'un contrat déployé (ex. testnet Avalanche Fuji), playbook (pause du contrat, alertes, traçage des fonds) ». Le guide (l. 70) précise : « Team1 Avalanche (monitoring on-chain, réponse aux incidents DeFi), KPMG (fraude, AML/CFT, DORA), Kryptosphère (crypto appliquée, DeFi), AWS (crédits) ».

## 0. TL;DR (la recommandation)

**Socle démo (faisable en 24 h, Fuji C-Chain + Hardhat déjà présent dans `blockchain/`) :**
1. `VaccineRegistry.sol` (notre contrat) : chaque vaccin = hash de la règle + métadonnées (ID de technique ATLAS/ASI, sévérité, auteur) → événements `VaccinePublished` / `VaccineRevoked`.
2. **ERC-8004 déjà déployé sur Fuji** : chaque agent financier = une identité (NFT ERC-721) ; chaque passage dans l'arène = `validationRequest` / `validationResponse` (score 0–100 = « couverture immunitaire ») ; incident → `giveFeedback`. **Zéro contrat à écrire**, et c'est le standard « agents trustless » que Team1 reconnaîtra.
3. `GuardedVault.sol` (ou module de smart account) : le portefeuille de l'agent refuse toute transaction qui matche un vaccin actif (liste de sélecteurs / destinataires / plafonds) et expose `pause()` → **Respond** visible sur Snowtrace (tx revert « blocked by vaccine V-007 »).
4. Bus d'alerte : Data API / Webhooks Avalanche (`address_activity` sur Fuji) ou simple listener viem → dashboard + autopsie Bedrock.

**Bonus « wow » si le socle tient avant samedi 22 h :** propagation d'un vaccin de la C-Chain Fuji vers un L1 de test via **ICM (Teleporter)**, avec relayer hébergé par le Builder Console → « un vaccin né sur une chaîne protège les agents d'une autre chaîne ».

**À ne PAS faire en 24 h :** lancer un vrai L1 dédié (inutile pour la démo), eERC (hors sujet, 947k gas/transfert), x402 réel avec facilitateur (seulement en storytelling / un endpoint mock).

---

## 1. Briques Avalanche : rôle, effort, doc

| # | Brique | Rôle concret dans le produit | Effort 24 h | Verdict |
|---|---|---|---|---|
| 1 | **Fuji C-Chain** (chainId 43113) | Déploiement de `VaccineRegistry`, `GuardedVault`, token de test ; tout est visible sur Snowtrace testnet | Faible : Hardhat configuré (`blockchain/hardhat.config.js`, réseau `fuji`) | **Indispensable** |
| 2 | **ERC-8004 (Trustless Agents)** — Identity / Reputation / Validation | Identité de chaque agent (NFT), « carnet de vaccination » = Validation Registry (score 0–100 par campagne d'attaque), incidents = Reputation feedback (tag1=`incident`, tag2=`AML.T0051`…) | Faible à moyen : contrats déjà déployés sur Fuji, il suffit d'appeler l'ABI | **Indispensable** (différenciant n°1) |
| 3 | **Smart account / garde de politique** (ERC-4337 ou contrat-vault maison) | Le vaccin est *appliqué* on-chain : la tx de l'agent passe par un vault/guard qui consulte `VaccineRegistry` | Moyen avec vault maison (2–3 h) ; élevé avec ERC-4337 complet (bundler, paymaster) | Vault maison pour la démo ; citer 4337/7702 comme roadmap |
| 4 | **Data API / Webhooks (ex-Glacier, AvaCloud)** | Détection : webhook `address_activity` sur les adresses des agents → notre backend → corrélation avec l'arène | Faible (clé API à mettre dans `.env`, jamais commitée) ; fallback : `watchContractEvent` viem | Recommandé (montre l'outillage Avalanche) |
| 5 | **ICM / Teleporter (ICM Contracts)** | Propagation inter-chaînes : `VaccineBroadcaster` (C-Chain) → `sendCrossChainMessage` → `VaccineReceiver` (`receiveTeleporterMessage`) sur un L1 de test | Moyen à élevé : L1 Fuji + Teleporter + relayer (Builder Console, relayer hébergé 3 jours) | Bonus si temps ; sinon slide d'architecture |
| 6 | **Avalanche L1 (ex-subnets) / Avalanche9000 (Etna, ACP-77)** | Vision : un « Immune L1 » permissionné pour un consortium bancaire (validateurs = banques/régulateur), frais ~1,33 AVAX/mois/validateur | Élevé pour un vrai L1 ; nul en storytelling | Pitch / roadmap |
| 7 | **x402 sur Avalanche** | Modèle économique : un agent paie en USDC (micropaiement HTTP 402) pour télécharger le dernier pack de vaccins ou pour un passage dans l'arène ; facilitateurs Fuji : Thirdweb, PayAI, Ultravioleta DAO | Moyen (facilitateur + USDC Fuji) | Storytelling biz ; éventuellement endpoint mock |
| 8 | **eERC (Encrypted ERC)** | Hors cœur : pourrait chiffrer des montants de primes de bug bounty, ou les montants d'un agent tout en gardant une clé d'auditeur (KPMG) | Élevé | Mentionner seulement pour la question « confidentialité » |
| 9 | **Agent kits / écosystème IA Avalanche** (Kite AI, Agent Hub SDK) | Positionnement : Kite apporte identité + paiements d'agents sur Avalanche ; nous apportons la **couche immunitaire** que ces agents consomment | Nul | Slide « écosystème » |
| 10 | **Financement : Team1 Builder Grants, Retro9000, Codebase** | Suite après hackathon (voir §6) | — | Slide « next steps » |

### Liens doc officiels
- Fuji / C-Chain, Builder Console (faucet, création L1, ICM) : https://build.avax.network/tools · https://build.avax.network/console/layer-1/create · https://build.avax.network/console/icm/setup
- Compte builder (nœuds et relayers testnet gratuits) : https://build.avax.network/academy/avalanche-fundamentals/04-creating-an-l1/01a-create-builder-account
- Avalanche-CLI marqué *deprecated* : https://docs.avax.network/docs/tooling/avalanche-cli
- ERC-8004 spec : https://eips.ethereum.org/EIPS/eip-8004 · adresses déployées : https://erc-8004.quicknode.com/docs/contracts · ABIs : https://github.com/erc-8004/erc-8004-contracts
- ICM / Teleporter : https://docs.avax.network/docs/cross-chain/teleporter/overview · envoi d'un message : https://docs.avax.network/academy/avalanche-l1/interchain-messaging/03-icm-protocol/03-sending-a-message · SDK TS (alpha) : https://docs.avax.network/docs/tooling/avalanche-sdk/interchain/icm
- Infra ICM (relayer) : https://docs.avax.network/academy/avalanche-l1/interchain-messaging/04-icm-setup/01-overview
- Webhooks API : https://docs.avax.network/docs/api-reference/webhook-api · création : https://docs.avax.network/docs/api-reference/webhook-api/webhooks/createWebhook · ajout d'adresses : https://docs.avax.network/docs/api-reference/webhook-api/webhooks/addAddressesToWebhook · ancienne doc : https://developers.avacloud.io/webhooks-api
- Etna / L1 souverains : https://avax.network/blog/etna-enhancing-the-sovereignty-of-avalanche-l1-networks · https://developers.avacloud.io/data-api/etna
- x402 sur Avalanche (cours officiel) : https://build.avax.network/academy/blockchain/x402-payment-infrastructure · facilitateurs : https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/03-facilitators
- eERC : https://docs.avax.network/integrations/encrypted-erc · https://kit.avacloud.io/docs/components/eerc
- Bundler 4337/7702 listant Avalanche C-Chain (Candide) : https://docs.candide.dev/wallet/bundler/rpc-endpoints
- Kite AI sur Avalanche : https://www.avax.network/about/blog/kite-ai-to-launch-the-first-avalanche-l1-artificial-intelligence-platform · https://www.avax.network/about/blog/1-9-billion-interactions-later-it-goes-live
- Agent Hub SDK (communautaire, non vérifié) : https://dev.to/agenthubavax/why-avalanche-needs-an-agent-sdk-and-why-we-built-one-58f0

### Détails ERC-8004 utiles pour coder

Adresses Fuji relevées sur la page QuickNode (dernière mise à jour avril 2026), **à confirmer sur testnet.snowtrace.io avant usage** :

| Registre | Fuji (43113) |
|---|---|
| Identity | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| Reputation | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| Validation | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` |

Signatures (EIP-8004) :
```solidity
// Identity (ERC-721) : un agentId par agent
function register(string agentURI) external returns (uint256 agentId);
// Reputation : incident ou bonne conduite
function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals,
  string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash) external;
// Validation : « carnet de vaccination »
function validationRequest(address validatorAddress, uint256 agentId, string requestURI, bytes32 requestHash) external;
function validationResponse(bytes32 requestHash, uint8 response /*0..100*/, string responseURI, bytes32 responseHash, string tag) external;
```
- `response` vaut 0–100 : 0 = échec, 100 = succès, valeurs intermédiaires autorisées. Seul le `validatorAddress` désigné peut répondre, et il peut mettre à jour la réponse plusieurs fois → parfait pour un **score de couverture immunitaire** recalculé à chaque nouveau vaccin.
- Mapping proposé : `validatorAddress` = notre wallet « Arena » ; `requestURI` = JSON de la campagne (liste de scénarios ATLAS/ASI) ; `response` = % de scénarios bloqués ; `tag` = `vaccine-pack-v12`.
- Selon QuickNode, le Validation Registry est encore « mainnet-pending » ailleurs (flux TEE en finalisation), mais une adresse Avalanche mainnet est listée. Pour nous, Fuji suffit.

### Détails ICM (si bonus)
- Côté émetteur : appel `TeleporterMessenger.sendCrossChainMessage(TeleporterMessageInput{destinationBlockchainID, destinationAddress, feeInfo, requiredGasLimit, allowedRelayerAddresses, message})`. L'ID de destination est le **blockchain ID P-Chain**, pas le chainId EVM.
- Côté récepteur : implémenter `ITeleporterReceiver.receiveTeleporterMessage(...)`.
- TeleporterMessenger est **déjà déployé sur Fuji C-Chain**. Sur le L1, il faut le déployer avec le registre. Relayer hébergé via Builder Console : il s'arrête au bout de 3 jours, ce qui suffit pour le hackathon. Sans relayer, les messages restent bloqués : c'est le risque principal.

### Détails Webhooks
- `POST /v1/webhooks` avec `eventType: "address_activity"`, `chainId: "43113"`, `includeLogs: true` (traces internes disponibles sur 43113/43114). Pour ajouter les adresses de nouveaux agents : `PATCH /v1/webhooks/{id}/addresses`.
- L'API est en bêta et deux domaines coexistent (`glacier-api.avax.network` / `data-api.avax.network`) : prévoir un **fallback listener viem**. Il faut vérifier la signature des webhooks (secret partagé dans `.env`).
- Il faut exposer le backend en HTTPS public (ngrok, ou API Gateway/Lambda AWS → bon point pour AWS).

---

## 2. Où est le vaccin, concrètement ? (cycle de vie)

1. **Exposition** (arène, off-chain, AWS) : agents financiers Bedrock contre red-team simulée (prompt injection via memo de tx, empoisonnement d'outil, adresse de destination substituée, contournement de plafond).
2. **Détection** : garde-fou runtime + listener on-chain (webhook) → incident.
3. **Autopsie** (Bedrock) : classification ATLAS/ASI/ATT&CK, cause racine, proposition de règle.
4. **Vaccin** : règle déterministe (JSON → Cedar et/ou paramètres on-chain : `blockedSelector`, `blockedRecipient`, `maxAmount`, `regexMemo`) validée en rejouant l'attaque dans l'arène (taux de blocage, faux positifs sur du trafic légitime synthétique).
5. **Publication** : `VaccineRegistry.publish(ruleHash, uri, techniqueId, severity)` → event.
6. **Diffusion / application** : (a) tous les agents récupèrent les vaccins actifs et rechargent leurs politiques (AgentCore Policy / garde-fou local) ; (b) `GuardedVault` applique les règles on-chain ; (c) option ICM vers d'autres chaînes.
7. **Preuve** : `validationResponse(score)` dans ERC-8004 pour chaque agent re-testé, ce qui donne une couverture immunitaire publique.

---

## 3. AWS : comment il s'intègre (et ce que le juré AWS veut voir)

| Service | Rôle | Remarque |
|---|---|---|
| **Amazon Bedrock** (Claude) | Agents financiers simulés, red-team générateur de scénarios, **autopsie** d'incident → proposition de vaccin | Crédits AWS fournis par le hackathon (guide l. 41) |
| **Bedrock AgentCore Runtime** | Héberger les agents de l'arène (sessions isolées) | GA depuis le 13 oct. 2025 |
| **AgentCore Gateway + Policy (Cedar)** | Le vaccin devient une **politique Cedar** appliquée à la passerelle : chaque appel d'outil (`transfer`, `swap`, `approve`) est intercepté et évalué de façon déterministe avant exécution. Par exemple, `transfer` est refusé si `amount > X` ou si le destinataire figure dans la liste des vaccins. | Idéal : « l'IA propose, Cedar dispose ». Mode ENFORCE requis. Cedar n'accepte pas de wildcard sur les actions, il faut regrouper les outils par Gateway Target. |
| **AgentCore Observability** (CloudWatch) | Traces des attaques et des blocages, et métriques MTTD/MTTR pour la fiche de défense | |
| Lambda / API Gateway | Endpoint HTTPS pour le webhook Avalanche | Évite ngrok |

Message pour AWS : nous faisons de la **défense en profondeur à deux couches**, une couche off-chain (AgentCore Policy) et une couche on-chain (GuardedVault), alimentées par la même source de vérité (VaccineRegistry). Le partenariat Ava Labs × AWS existe depuis janv. 2023 (nœuds en un clic sur AWS Marketplace, GovCloud), ce qui permet d'évoquer en roadmap un hébergement des validateurs d'un « Immune L1 » sur AWS.
Docs : https://aws.amazon.com/blogs/aws/introducing-amazon-bedrock-agentcore-securely-deploy-and-operate-ai-agents-at-any-scale · https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-getting-started.html · https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-scope.html · https://www.avax.network/blog/ava-labs-and-aws-bring-scalable-blockchain-solutions-to-enterprises-and-governments

**Aucun lien natif AgentCore ↔ Avalanche n'a été trouvé** : c'est à nous de le construire (outil Gateway `avax_send_tx` via viem dans une Lambda).

## 4. KPMG et Kryptosphère dans la démo

**KPMG (fraude, AML/CFT, DORA)**
- Scénarios de l'arène inspirés de typologies AML : structuration (smurfing) sous plafond, envoi vers une adresse sanctionnée *synthétique*, layering via swaps. Le vaccin correspondant est une règle de type AML.
- **Classification DORA automatique** de chaque incident (incident TIC majeur ou non, selon les critères : clients touchés, durée, impact financier, propagation) + **pré-rapport** généré par Bedrock. Le registre on-chain sert de piste d'audit immuable pour l'auditeur.
- Le score ERC-8004 sert de **preuve de contrôle** pour un audit (« AI Trust ») : l'auditeur lit la couverture de chaque agent sur Snowtrace.
- Phrase pitch : « Un auditeur KPMG peut vérifier, sans nous faire confiance, quels contrôles chaque agent avait au moment d'un incident. »

**Kryptosphère (crypto appliquée, DeFi)**
- Les cibles de la démo sont DeFi : un agent de trésorerie qui fait `approve` / `swap` / `transfer` sur un token et un pool de test que nous déployons sur Fuji.
- Attaques DeFi classiques transposées aux agents : approval illimité vers un spender malveillant, empoisonnement d'adresse, slippage manipulé.
- Démo ouverte : le jury peut lire le contrat vérifié sur Snowtrace et voir le revert.

**Team1 Avalanche** (monitoring on-chain, réponse aux incidents DeFi) : la démo coche exactement la piste 4 de la Track 1 (monitoring Fuji, pause, alertes, traçage), et y ajoute ERC-8004, standard agents récent sur Avalanche.

**Utopia** (mentors IA) : boucle « autopsie LLM → règle déterministe » et évaluation (taux de blocage et faux positifs).

## 5. Paysage existant (pour se différencier)

| Projet | Ce qu'il fait | Notre différence |
|---|---|---|
| **Forta** (Network, Attack Detector 2.0, Firewall) | Bots de détection communautaires, flux de threat intel, firewall pré-exécution des tx (score de risque 0–1) pour rollups EVM. Aucune preuve trouvée d'un déploiement Avalanche. | Forta protège des **contrats** ; nous protégeons des **agents IA** (prompt injection, outils) et nous produisons des **règles validées en arène**, pas seulement des alertes. |
| **Kite AI** (mainnet sur Avalanche, avril 2026 ; Agent Passport = identité + garde-fous ; Series A de 18 M$ menée par PayPal Ventures) | Infra d'identité et de paiement pour agents | Complémentaire : nous sommes la couche **immunité/test** que Kite ou n'importe quel agent ERC-8004 peut consommer. |
| **GoPlus** (SafuSkill, Axora, rapport H1 2026) | Sécurité Web3 étendue aux agents autonomes (contrôles runtime) | Centralisé, sans arène ni vaccins partagés vérifiables. |
| **0G Sentinel** (0G), **Aegivex** (OKX/x402) | Score de risque d'agent attesté on-chain / moteur pré-exécution | Autres chaînes ; pas de boucle attaque simulée → vaccin → propagation. |
| **Agent Hub SDK** (communautaire, Avalanche) | SDK pour agents sur Avalanche | Outillage, pas de sécurité. |

Positionnement en une phrase : **« Forta pour les agents IA, avec immunité acquise : chaque attaque simulée produit une règle validée, publiée sur Avalanche et vérifiable via ERC-8004. »**
Sources : https://www.theblock.co/news/regulation/2024-11-19-a16z-forta-firewall-smart-contract-exploits-327244 · https://forta.org/?p=717 · https://www.coindesk.com/research/goplus-security-h1-2026 · https://hackquest.io/projects/0G-Sentinel-emg7Ge · https://www.hackquest.io/projects/Aegivex-AI-Security

## 6. Financement et suite (slide « next steps » pour Team1)
- **Team1 Builder Grants** : Mini Grants jusqu'à 10 k$, Accelerator Grants jusqu'à 30 k$ (comité de vote) ; voir team1.network/grants. Source : https://www.kucoin.com/news/flash/avalanche-s-team1-launches-builder-grants-program-with-up-to-30-000-per-project (source secondaire, à confirmer).
- **Retro9000** : enveloppe rétroactive de 40 M$, cohortes L1 & Infra Tooling (4e cohorte en fév. 2026) et round C-Chain (janv. 2026, mesuré à l'AVAX brûlé). Un registre de vaccins utilisé par de nombreux agents = activité C-Chain. https://www.avax.network/about/blog/retro9000-everything-you-need-to-know · https://avax.network/about/blog/the-avalanche-foundation-announces-fourth-cohort-for-retro9000-l1-and
- **Codebase** (incubateur, 50 k$ non dilutifs, saison suivante non confirmée) : https://build.avax.network/codebase · https://www.avax.network/blog/build-for-impact-on-avalanche-codebase-season-4-applications-are-open

## 7. Architecture on-chain minimale mais crédible

```
           (off-chain, AWS)                                   (on-chain, Fuji C-Chain 43113)
 ┌───────────────────────────────┐   publish()      ┌──────────────────────────────┐
 │ Arène : agents Bedrock vs     │ ───────────────► │ VaccineRegistry               │
 │ red-team simulée              │                  │  - publish / revoke           │
 │ Autopsie Bedrock → règle      │                  │  - isBlocked(to, sel, amount) │
 │ Validation par rejeu          │                  └───────────┬──────────────────┘
 └──────┬──────────────┬─────────┘                              │ lecture
        │ Cedar        │ validationResponse(score)              ▼
        ▼              ▼                               ┌──────────────────────────────┐
 AgentCore Policy   ERC-8004 Identity / Reputation /   │ GuardedVault (par agent)     │
 (bloque l'outil)   Validation (déjà sur Fuji)         │  - execute(to,data,value)    │
                                                       │    revert si vaccin actif    │
 Webhook Data API ◄─── events ────────────────────────│  - pause() par le Guardian   │
 (address_activity)                                    └──────────────────────────────┘
        │                                    (option) VaccineBroadcaster ──ICM──► L1 test : VaccineReceiver
        ▼
 Dashboard : MTTD / MTTR, couverture immunitaire
```

### Contrats (≈ 150 lignes Solidity au total)
```solidity
// VaccineRegistry.sol
struct Vaccine { bytes32 ruleHash; string uri; string technique; uint8 severity;
                 bytes4 selector; address target; uint256 maxAmount; bool active; }
event VaccinePublished(uint256 indexed id, bytes32 ruleHash, string technique, uint8 severity, string uri);
event VaccineRevoked(uint256 indexed id, string reason);
function publish(...) external onlyCurator returns (uint256 id);
function revoke(uint256 id, string calldata reason) external onlyCurator;
function check(address to, bytes4 sel, uint256 amount) external view returns (bool blocked, uint256 vaccineId);

// GuardedVault.sol (portefeuille d'un agent)
event TxExecuted(address indexed agent, address to, uint256 value);
event TxBlocked(address indexed agent, uint256 indexed vaccineId, address to, bytes4 selector);
event Paused(address by, string reason);
function execute(address to, uint256 value, bytes calldata data) external onlyAgent whenNotPaused;
function pause(string calldata reason) external onlyGuardian;
```
Remarque : pour que `TxBlocked` apparaisse sur Snowtrace, `execute` **émet l'événement et retourne sans revert** (un revert efface les events). On peut aussi faire les deux : un appel `tryExecute` qui logue, et un `execute` qui revert avec un message clair.

### Ce que voit le jury sur Snowtrace (testnet.snowtrace.io)
1. Contrats **vérifiés** (`npx hardhat verify --network fuji`), code lisible.
2. Onglet Events de `VaccineRegistry` : `VaccinePublished #7 technique=AML.T0051 severity=4`, horodaté quelques secondes après l'attaque, ce qui prouve le MTTR.
3. Tx de l'agent compromis : `TxBlocked(vaccineId=7)` au lieu d'un transfert, avec le même payload rejoué.
4. ERC-8004 : NFT d'identité de l'agent ; `ValidationResponse(score=92, tag=vaccine-pack-v7)` qui augmente après chaque vaccin.
5. (Bonus) Tx ICM : message source sur la C-Chain → réception sur le L1, avec un vaccin identique des deux côtés.

### Script de démo on-chain (≈ 60 s du film)
1. L'agent de trésorerie exécute un transfert légitime → `TxExecuted`.
2. Une injection via memo pousse l'agent à vider le vault vers une adresse synthétique → l'agent A (non vacciné) se fait avoir : la tx passe, montant faible et fonds de test.
3. Détection (webhook) → autopsie Bedrock → vaccin validé par rejeu → `VaccinePublished`.
4. La même attaque sur l'agent B → `TxBlocked` on-chain **et** refus Cedar côté AgentCore.
5. Le score ERC-8004 de B passe à 100 sur ce scénario ; affichage MTTD/MTTR.

### Plan d'effort (lane tech)
| Bloc | Effort |
|---|---|
| VaccineRegistry + GuardedVault + tests Hardhat + deploy/verify Fuji | 3–4 h |
| Client viem (publish, listener events, ERC-8004 calls) | 2–3 h |
| Enregistrement des agents ERC-8004 + validation | 1–2 h |
| Webhook Data API (ou fallback listener) | 1 h |
| ICM bonus (L1 Fuji via Builder Console + relayer + 2 contrats) | 4–6 h, risqué |

### Mapping cadres (pour le frontmatter des tâches)
- NIST CSF 2.0 : **DE.CM** (monitoring continu on-chain et runtime), **DE.AE** (analyse d'incident / autopsie), **RS.MI** (pause / blocage), **RS.AN**, **ID.IM** (amélioration via vaccins).
- OWASP Agentic : ASI01 (goal hijack / prompt injection), ASI02 (tool misuse), ASI03 (identity & privilege abuse) — vérifier les intitulés exacts dans la version publiée.
- MITRE ATLAS : AML.T0051 (LLM Prompt Injection), AML.T0053 (LLM Plugin Compromise / abus d'outil) — à vérifier sur atlas.mitre.org.
- D3FEND : D3-EAL (Executable Allowlisting, appliqué par analogie aux sélecteurs autorisés), D3-OAM (Operational Activity Mapping) — à vérifier.

## 8. Risques et points à vérifier
- Adresses ERC-8004 Fuji : à confirmer sur Snowtrace (source QuickNode, tierce). En cas de doute, déployer nos propres copies de l'implémentation de référence (repo `erc-8004/erc-8004-contracts`).
- Faucet Fuji : il faut un compte Builder pour réclamer de l'AVAX testnet. **Clé privée uniquement dans `blockchain/.env` (gitignoré)**, et un wallet dédié au hackathon.
- Support EIP-7702/Pectra sur la C-Chain : non confirmé par une source officielle, donc ne pas dépendre de 7702.
- L'API Webhooks est en bêta et deux domaines coexistent : garder le fallback viem.
- Relayer ICM hébergé : durée de vie de 3 jours, et ICM ne doit pas être sur le chemin critique de la démo.
- Les chiffres marketing (Forta 99 %, Agent Hub, Kite) ne doivent pas être cités comme des faits sans source primaire.

# Hold up : est-ce innovant ? Verdict de nouveauté N1 à N4 (10 oct. 2026)

Statut : recherche, aucun autre fichier du projet modifié. Méthode : balayage de ~100 fiches (éditeurs, Safe, GitHub, hackathons, académique, regtech) puis 3 contre-experts par revendication, chargés de **réfuter**. Résultat : **les 4 revendications sont réfutées 3 sur 3 comme « invention »**. Aucune ne survit comme « première mondiale ». Ce qui survit, c'est un **assemblage** précis, défendable si on le dit honnêtement.

Limite générale : « non trouvé » n'est pas « n'existe pas ». Plusieurs docs sont fermées (Hypernative, Fireblocks, BitGo, annonce BitGo du 30 avr. 2026 non lue) et certaines fiches viennent d'extraits de recherche. Les points à vérifier sont en section 6.

Vocabulaire : le **Guard** est un petit programme installé sur le coffre (le Safe) qui peut refuser une sortie. Le **vigile** = notre Guard. La **caméra** = la surveillance de la chaîne. Le **circuit d'approbation** = tout ce qui décide qu'une sortie est légitime (backend, signataires, serveurs).

---

## 1. Verdict par revendication

### N1 : recouper l'intention annoncée par le backend avec ce que montre la chaîne
**Verdict : déjà fait (pour le mécanisme). Faible, et logiquement fragile.**
- Concurrent le plus proche : **Coinbase IVy (2020)** enregistre la demande de retrait, puis compare la transaction signée à cette intention avant diffusion. **Blockdaemon** (MPC) fait de même. Fireblocks et BitGo offrent le crochet (callback/webhook) pour que le client le code lui-même. Ripple Custody et Taurus l'imposent dans leur plateforme.
- Faille logique, confirmée par le cas Bitget : si le pirate contrôle le backend, **l'intention « annoncée » est celle du pirate**. Le recoupement ne détecte rien. Blockdaemon l'admet lui-même (intention et fabrication de la transaction sont dans la même application). IVy a le même défaut.
- Nouveauté résiduelle exacte : un **service tiers, hébergé hors de l'infrastructure du client, qui compare chaque sortie à une intention venant d'une source que le backend compromis ne peut pas écrire** (demande signée par le client final, registre en lecture seule, approbation humaine sur mobile), pour un prestataire qui n'est pas sur Coinbase/Ripple/Taurus.
- Phrase jury : *« À notre connaissance, aucun service tiers ne compare les sorties d'un prestataire à une intention signée par son client, que le serveur du prestataire ne peut pas falsifier ; le recoupement lui-même existe depuis 2020 chez Coinbase. »*
- Conséquence : **N1 ne doit pas être le cœur du pitch.** Ne jamais affirmer qu'il aurait arrêté Bitget (le contournement exact n'est pas publié).

### N2 : garde on-chain qui ne peut que resserrer, plafonds absolus gravés, reprise 2 humains sur 3
**Verdict : le principe est déjà fait ; l'assemblage est partiellement neuf.**
- Concurrents les plus proches, par morceau :
  - « rôle qui ne peut que resserrer, relâcher est lent » : **Morpho Vault V2 Sentinel**, **IPOR Fusion Guardian** (« resserrer vite, desserrer lentement »), Optimism Deputy Pause, Lido GateSeal/CircuitBreaker.
  - « circuit d'approbation supposé compromis, plafonds en contrat bornent la perte, rôle qui ne peut que couper » : **Spark ALM Controller** (audité Cantina, ChainSecurity, Certora).
  - « 2 gardiens sur 3, pause qui expire seule, plafond par période » : **ERC-8238** (brouillon, avril 2026, CC0, 71 tests).
  - « Guard Safe qui bloque avant exécution » : **Hypernative Safe Shield** (commercial, en production), Safenet (beta, avril 2026), Optimism Timelock Guard (audité Spearbit), Safe Research Guardrail, Cobo, Ackee/ScopeGuard.
- Ce que **personne** n'a (dans ce qu'on a lu) sur un Safe de prestataire : des plafonds **sans aucune fonction de hausse** (ni signataires, ni détecteur ne peuvent les lever), un **retrait du Guard protégé contre des signataires compromis**, une **sentinelle externe limitée à plafond réduit ou file d'attente (jamais de pause globale)**, et une **reprise 2 sur 3** testée. Morpho, ERC-8238, CCIP, Zodiac laissent tous relever les plafonds après délai.
- Nouveauté résiduelle exacte : l'**application à la trésorerie d'un prestataire crypto régulé DORA** de ce patron, avec plafonds non relevables par le circuit compromis et retrait du Guard protégé.
- Phrase jury : *« Le principe "on ne peut que resserrer" existe (Morpho, Spark, Lido). À notre connaissance, nous le posons pour la première fois sur le Safe d'un prestataire crypto régulé, avec des plafonds qu'aucun signataire ne peut relever et une preuve DORA en sortie. »*
- Avertissements : le « plafond non relevable » crée un risque de **brique** (Turnkey garde un contournement pour cette raison) ; piège de **liveness de Lido** (pauseur expiré = plus de protection) ; le bug **Gnosis Pay (1er juin 2026, ERC-1271 dans Zodiac Delay/Roles)** prouve qu'un module de file retardée peut être contourné : notre propre code doit être testé contre ce scénario.
- C'est **le vrai levier** : un plafond tient même quand l'intention est falsifiée (Bitget).

### N3 : chaîne automatique incident on-chain, classification DORA (RTS 2024/1772), notification initiale ITS 2025/302 pré-remplie, preuve on-chain par champ
**Verdict : partiellement neuf (seulement le morceau « preuve par champ »), le reste est déjà fait.**
- Concurrents les plus proches : **Incident Oracle (ToolOracle)**, serveur MCP qui classe sur les 6 critères du RTS 2024/1772 et génère notifications initiale, intermédiaire, finale (ITS 2025/302) avec suivi d'échéances. **QENEX Pulse DORA** (16 mai 2026) : reclassement automatique, brouillons, chaîne de preuve SHA-256/Ed25519/RFC 3161/OpenTimestamps. Aussi ServiceNow DRIR, D3 Morpheus, Copla, Protofire BP-18 (patron de réponse auto cartographié DORA).
- Aucun d'eux n'a, d'après les pages lues, une **entrée on-chain** ni un **lien champ par champ vers une transaction/un bloc**. Absence de mention, pas preuve d'absence (code d'Incident Oracle non lu).
- Nouveauté résiduelle exacte : un brouillon de notification dont **chaque champ factuel pointe vers l'objet on-chain qui le prouve** (tx, bloc, événement du Guard, règle@version), vérifiable par un tiers sans croire l'éditeur, et dont la classe se recalcule quand le Guard agit.
- Phrase jury : *« À notre connaissance, aucun outil ne relie chaque champ d'une notification DORA à la transaction on-chain qui le prouve ; la classification et le brouillon automatiques existent déjà (Incident Oracle, QENEX). »*
- Rappels : pas de dépôt automatique (canaux nationaux, instructions ESAs du 16/09/2026) ; sortir un JSON canonique ; afficher le taux de sur-déclaration (alerte AFME).

### N4 : règles hachées et scellées on-chain avant l'incident, chaque décision cite règle@version, rejouable par un auditeur
**Verdict : déjà fait comme mécanisme ; assemblage partiellement neuf.**
- Concurrents les plus proches : **ERC-8196** (hash de politique enregistré on-chain, cité dans chaque action, journal chaîné ; cible les agents IA ; statut « Final » à revérifier). **QENEX alert_rules** : hash des règles de détection ancré, pour prouver la logique en vigueur lors d'un incident DORA. **OPA** : chaque décision porte la révision des règles, rejouable. Cubist : attestation du code de politique en TEE. Chainlink ACE : politiques on-chain (bêta privée). Le RTS 2024/1774 (art. 12, 23) exige déjà règles prédéfinies et journaux inviolables ; l'article arXiv 2602.12260 recommande de publier les critères avant l'incident.
- Nouveauté résiduelle exacte : l'assemblage **règle@version lisible + contenu (pas commit) scellé sur chaîne publique + décision du Guard qui cite la version + racine Merkle des décisions + rejeu par un tiers sans clé de l'éditeur + lien au dossier DORA**, pour un coffre de prestataire. ERC-8196 n'a pas de champ de version ni de rejeu.
- Phrase jury : *« Sceller ses règles et les citer à chaque décision est une pratique connue (OPA, ERC-8196, QENEX) ; à notre connaissance, nous la rendons vérifiable par un auditeur tiers sur le veto d'un coffre de prestataire. »*
- Rappels : un hash sur Fuji est un **contrôle d'intégrité**, pas un horodatage qualifié eIDAS ; hacher la règle prouve son existence, pas qu'une décision a été prise avant le résultat (engager aussi les décisions au fil de l'eau) ; le changement d'urgence d'une règle doit respecter l'art. 17.

### Réponse à la question d'Adem (caméra / vigile / gardien)
- Le triptyque **caméra + vigile, sans clé détenue** est le bon modèle, c'est aussi celui du marché (Hypernative, Blockaid, Cobo) : **état de l'art, pas innovation**. Le « vigile sur le coffre » existe en produit (Hypernative Safe Shield sur Safe depuis nov. 2025).
- **Innovant ?** Pas par le mécanisme. Par l'**assemblage** (N2 durci + N3 prouvé par champ + N4 rejouable) et par la **cible** (prestataire crypto sous DORA).
- Alerte concurrence immédiate : **Tripwire** (ETHGlobal Tokyo, 25-27 sept. 2026) fait déjà « détection + clé qui ne peut que pauser + approbation humaine ». Un jury qui l'a vu jugera cette partie banale.

---

## 2. Tableau de l'état de l'art

Proximité : TP = très proche, P = partiel, V = voisin. Dates = lecture ou publication. « (extrait) » = non ouvert en entier.

### 2.1 Garde / veto avant sortie (N1, N2)
| Nom | Type | Ce qu'il fait | Couvre | Prox. | Réutilisable | URL |
|---|---|---|---|---|---|---|
| Hypernative Transaction Guard / Safe Shield | SaaS + Guard Safe | Évalue chaque tx contre des politiques, approuve/signale/bloque ; retrait du Guard = tx + 24 h ; journal approbations/refus (aide Safe 2026-05-05) | N1 N2 N4 | TP | Patron seulement (payant) | https://hypernative.io/products/transaction-guard ; https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative |
| Blockaid Cosigner | SaaS | Simule et valide entre approbation et signature, rejet possible après approbations multisig (2026-05-13 ; Utila 2026-10-08) | N1 N2 | P | Non | https://blockaid.io/cosigner |
| Safenet (Safe Foundation) | Réseau de validateurs + Guard | Validateurs attestent, Guard vérifie l'attestation on-chain ; dérogation par un propriétaire après délai (beta, 2026-04-02) | N2 | TP | Idée de dérogation retardée | https://safefoundation.org/blog/safe-launches-safenet-beta |
| Cobo Safe Guard / Argus / Co-Signer | Open source + SaaS | Guard anti-delegatecall (fév. 2025, non audité), autorisateurs par rôle, co-signataire lisant la chaîne (mars 2025) | N1 N2 | TP | Code (licence à vérifier ; dépôt cité en 404) | https://www.cobo.com/post/from-threat-to-resilience-how-cobo-strengthens-safe-wallet-security |
| Safe Research Guardrail | Guard Safe | Delegatecall en liste blanche ; ajout retardé, retrait immédiat ; retrait du guard retardé (2025-08-07 ; « may contain serious security holes ») | N2 | P | Base Solidity (licence à vérifier) | https://github.com/safe-research/guardrail |
| Optimism Timelock Guard / SaferSafes / Deputy Pause | Guard Safe audité | Planifier puis attendre, annulation par seuil (Spearbit, 2026-02-19) ; Deputy ne peut que pauser | N2 | TP | Code public, signature EIP-712 à nonce | https://specs.optimism.io/protocol/safer-safes.html ; https://specs.optimism.io/protocol/deputy-pause-module.html |
| Zodiac Delay / Roles v2 / ScopeGuard | Modules Safe | File avec cooldown, permissions et allowances, liste blanche | N2 | P | Oui (LGPL ; attention au bug de juin 2026) | https://github.com/gnosis/SafeDelay ; https://github.com/gnosis/ScopeGuard |
| Gnosis Pay, exploit du 1er juin 2026 | Incident | Bug ERC-1271 dans Delay/Roles : ~1,5 M$ extraits, alerte 06:17 UTC, cause 08:06 | N2 | V | Scénario de test | https://gnosispay.com/blog/post-mortem-gnosis-pay-vulnerability-exploit |
| Safe Allowance Module | Module Safe | Budget par délégué et jeton, récurrent | N2 | P | Oui | https://docs.candide.dev/wallet/plugins/allowance/ |
| Rhinestone ColdStorageHook (ERC-7579) | Module | Owner fixé à l'installation, sortie vers lui seulement après timelock ; audit Ackee avec problèmes sévères | N2 | P | Idée (owner fixe) | https://github.com/rhinestonewtf/core-modules |
| Morpho Vault V2 Sentinel | Protocole DeFi | Ne peut que baisser les plafonds ou révoquer ; hausses sous timelock | N2 | TP | Modèle de rôles | https://docs.morpho.org/curate/concepts/roles/ |
| IPOR Fusion Guardian | Protocole DeFi | Annule et pause, ne planifie pas ; « resserrer vite, desserrer lentement » | N2 | TP | Modèle de délais | https://docs.ipor.io/build-on-fusion/atomists/vault-configuration-step-by-step/timelocks-and-execution-delays |
| Spark ALM Controller | Contrat audité | Relayer supposé compromis, RateLimits, freezer qui ne peut que retirer le relayer (AGPL-3.0) | N2 | TP | Lire, ne pas copier | https://github.com/sparkdotfi/spark-alm-controller |
| ERC-8238 Coercion-Resistant Vault | Brouillon ERC (CC0) | Plafond par époque, resserrer immédiat, relâcher retardé, pause 24 h auto-expirante, 2 gardiens sur 3 (avr. 2026) | N2 | TP | Spéc et 71 tests Foundry | https://ethereum-magicians.org/t/erc-8238-coercion-resistant-vault/28130 |
| Lido GateSeal / CircuitBreaker | Contrats audités | Pause à pouvoir borné, usage unique, expirante ; piège de liveness relevé par Cyfrin (2026-04-08) | N2 | TP | Rapport d'audit comme liste de pièges | https://docs.lido.fi/contracts/circuit-breaker |
| Compound pauseGuardian, Aera, CCIP RMN, CCIP/LayerZero rate limits | Patrons DeFi | Pause seule ; limites token-bucket levables par un rôle | N2 | P/V | Token bucket (contre-exemple « levable ») | https://docs.chain.link/ccip/concepts/rate-limit-management/prerequisites-and-permissions |
| ERC-7265 Circuit Breaker | Proposition dormante | Plafond de sortie par fenêtre, CC0 | N2 | V | Code CC0 | https://ethereum-magicians.org/t/eip-7265-circuit-breaker-standard/14909 |
| Phoenix (arXiv 2106.01240) / BIP-345 | Académique | Coffre à retrait retardé, annulation, récupération (2021) | N2 | V | Citation | https://arxiv.org/abs/2106.01240 |
| SEAL Secure Multisig Best Practices | Norme communautaire | Prescrit délai, urgence « pause seule », whitelist, plafonds | N1 N2 | TP | Mapping de conformité | https://frameworks.securityalliance.org/wallet-security/secure-multisig-best-practices |
| arXiv 2602.12260 (Legitimate Overrides) | Académique | 705 exploits ; pouvoirs bornés/expirants, critères publiés avant incident ; succès 39 % côté signataires | N2 N4 | P | Chiffres | https://arxiv.org/html/2602.12260v1 |

### 2.2 Plateformes de custody
| Nom | Type | Ce qu'il fait | Couvre | Prox. | Réutilisable | URL |
|---|---|---|---|---|---|---|
| Fireblocks Co-Signer Callback | Crochet API | Callback HTTPS, JWT, 30 s, échec fermé ; le client y met sa logique | N1 | P | Contrat d'interface public | https://developers.fireblocks.com/docs/cosigner-architecture-overview |
| Fireblocks Security Admin / Policy Inspector / Agentic Policy Analyzer | Produit | Rôle qui ne peut que geler (gel total), export de politique, analyse par agents (été 2026) | N2 N4 | P | Patron de rôle minimal | https://www.fireblocks.com/blog/new-in-fireblocks-security-summer-2026 |
| Fireblocks pack COR (DORA) | Contrat | Addendum art. 30, rapports, alertes sur incidents du fournisseur (mars 2025) | N3 | V | Citation | https://support.fireblocks.io/hc/en-us/articles/19581715268764-Cyber-and-Operational-Resilience-Compliance-Package |
| BitGo webhook de politique | Crochet API | POST à chaque tx ; 200 = passe ; JWT anti-rejeu ; annonce du 30 avr. 2026 non lue | N1 N2 | P | Contrat webhook public | https://developers.bitgo.com/docs/policies-webhook |
| Fordefi / Utila | MPC | Simulation par défaut, approbateur API ; Utila intègre Hypernative et Blockaid | N1 | V | Point d'insertion (non testé) | https://docs.fordefi.com/developers/simulate-transactions |
| Cubist CubeSigner | MPC/TEE | Politique en code attestée dans un TEE, verrouillée par gouvernance | N1 N2 N4 | P | Citation d'attestation | https://cubist.dev/products/programmable-policy-engine |
| Turnkey | Enclave | Moteur de politique, mais le root quorum le contourne | N2 | V | Argument de contraste | https://docs.turnkey.com/features/users/root-quorum |
| Ripple Custody, Taurus-PROTECT, Anchorage | Custody haut de gamme | Intents signées, règles appliquées par le HSM, quorum mobile par retrait | N1 N2 | P/V | Patron | https://docs.ripple.com/products/custody/overview/governance-model |
| Cyvers + Liminal ; Phalcon ; Forta ; Hexagate | Détection | Blocage ou alertes IA, pare-feu on-chain ; statut 2026 incertain pour certains | N2 | V | Alertes entrantes (webhook) | https://www.chainalysis.com/blog/hexagate-by-chainalysis-now-live-on-avalanche/ |
| Chainlink ACE | Moteur de politiques on-chain (bêta privée, BSL) | Limites, listes, événement par exécution ; versionnage non documenté | N2 N4 | V | Non | https://docs.chain.link/ace/concepts/architecture |

### 2.3 Intention contre transaction (N1)
| Nom | Type | Ce qu'il fait | Couvre | Prox. | Réutilisable | URL |
|---|---|---|---|---|---|---|
| Coinbase IVy (2020) | Interne | Intention enregistrée puis comparée à la tx signée | N1 | identique | Argument de crédibilité | https://www.coinbase.com/blog/enforcing-invariants-in-a-complex-system |
| Blockdaemon Secure Intents | Billet MPC | Les nœuds valident la tx contre l'intention ; admet le défaut « même application » (URL en 404, extrait) | N1 | TP | Citation | https://www.blockdaemon.com/blog/secure-intents-and-transaction-validation |
| Cyfrin clearsig, ERC-8213/7730/8176, safe-tx-hashes-util, SEAL signing | Outils de signataire | Recalcul indépendant du hash, décodage lisible | N1 | P/V | Oui (décodage, digest) | https://www.cyfrin.io/blog/blind-signing-solved ; https://github.com/pcaversaccio/safe-tx-hashes-util |
| Safe OpenSig (Candide) | Appli mobile | Simulation locale, consensus multi-RPC | N1 | V | Idée multi-RPC pour la caméra | https://www.candide.dev/opensig |
| AID-Guard (arXiv 2608.21159) | Préprint | Revérifie l'intention au commit, proposeur compromis | N1 N4 | V | Citation du modèle de menace | https://arxiv.org/abs/2608.21159 |
| Meigi, Izanagi (ETHGlobal Tokyo 2026) | Hackathon | Bénéficiaire annoncé contre adresse réelle ; contresignature d'oracle | N1 N2 | V | Patrons | https://ethglobal.com/showcase/meigi-mingyi-qzc2i |
| Trail of Bits Rekt Test, Kiln | Doctrine | Contrôles indépendants du contenu des transactions | N1 | V | Citation | https://blog.trailofbits.com/2025/05/29/the-custodial-stablecoin-rekt-test/ |
| Incident Bitget (24-25 sept. 2026) | Incident | 387,5 M$, backend compromis, clés intactes, détail du contournement non publié | N1 N2 | V | Scénario de rejeu | https://www.bleepingcomputer.com/news/security/bitget-hacked-via-zero-day-in-third-party-security-products/ |

### 2.4 Hackathons récents (alerte jury)
| Nom | Ce qu'il fait | Prox. | URL |
|---|---|---|---|
| Tripwire (ETHGlobal Tokyo, sept. 2026) | Règles à chaque bloc, clé qui ne peut que pauser, approbation humaine ou auto | P (alerte) | https://ethglobal.com/showcase/tripwire-7bqxn |
| DSAP Protocol (Tokyo 2026) | Limites d'agents IA, resserrer vite, relâcher avec signature | P | https://ethglobal.com/showcase/dsap-protocol-87152 |
| SentinelCRE (Chainlink Convergence 2026, 1er CRE & AI) | Disjoncteurs avant l'action malveillante, MIT, 90 tests | P | https://chain.link/blog/convergence-hackathon-winners |
| HoneyPause (ETHDenver 2024), SafeGuard (ETHIndia 2022) | « Composant qui ne peut que geler », Guards Safe | P | https://github.com/merklejerk/honeypause |

### 2.5 DORA, classification et preuve (N3, N4)
| Nom | Type | Ce qu'il fait | Couvre | Prox. | Réutilisable | URL |
|---|---|---|---|---|---|---|
| Incident Oracle (ToolOracle) | MCP | Classe sur RTS 2024/1772, génère ITS 2025/302 initial/intermédiaire/final, échéances (licence non indiquée, 7 commits) | N3 | TP | Schéma de champs, sans copier | https://github.com/tooloracle/incidentoracle |
| QENEX Pulse DORA + alert_rules | Produit payant (16 mai 2026) | Reclassement auto, brouillons, SHA-256/Ed25519/RFC 3161/OpenTimestamps ; hash des règles ancré | N3 N4 | TP | Argument de positionnement | https://qenex.ai/dora/ ; https://qenex.ai/anchor/alert_rules/ |
| ServiceNow DRIR, D3 Morpheus, Copla | GRC/SOAR | Classification, rapport initial sous 24 h, validation humaine, piste d'audit ; entrée = ticket, pas de chaîne | N3 N4 | P | Logique de déclencheurs, métrique | https://www.servicenow.com/docs/r/Z61H6JNUJXKe8NNPQzK7MQ/0aNomnluaUVHloO2rB49Dg |
| Protofire BP-18 | Patron publié (août 2026) | Matrice signaux-réponses écrite à l'avance, fournisseur sans autorité, mapping DORA | N2 N3 N4 | TP | Cadrage juridique | https://protofire.io/blueprints/risk-monitoring/ |
| Hypernative billet DORA (9 juin 2026) | Argumentaire | Pas de classification ni de gabarit ; risque de rattrapage | N3 | P | Non | https://www.hypernative.io/blog/dora-doesnt-ask-whether-you-had-a-security-incident-it-asks-whether-you-knew-in-time |
| cyr-ius/dora-report | Open source MIT | Formulaire de saisie EBA, manuel | N3 | P | Structure de formulaire (champs non vérifiés) | https://github.com/cyr-ius/dora-report |
| ERC-8196 | ERC (statut « Final » à revérifier) | policyHash on-chain cité par chaque action, journal chaîné | N4 | TP | Interface registerPolicy | https://eips.ethereum.org/EIPS/eip-8196 |
| EAS / ERC-8176, ERC-7817, ethresear.ch | Plomberie | Attestations de hash ; Fuji non vérifié | N4 | V | EAS | https://eips.ethereum.org/EIPS/eip-8176 |
| OPA decision logs, Cedar | Pratique hors chaîne | Décision + révision des règles, rejeu | N4 | P | Format de log, moteur déterministe | https://www.openpolicyagent.org/docs/management-decision-logs |
| OriginStamp | Produit | Ancrage de hash pour CASP (2026-06-11) | N3 N4 | V | Patron | https://originstamp.com/en/blog/reader/mica-july-2026-deadline-evidence-integrity |
| RTS 2024/1774, ESAs 16/09/2026, rapport ESAs 3 juin 2026, AFME, Omnibus, eIDAS 2025/2531 | Réglementation | Règles prédéfinies, canaux nationaux, 3 383 incidents en 2025 (~10 % cyber), faux majeurs, guichet unique à venir, registre qualifié | N3 N4 | V | Citations | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R1774 |
| CCSS v9.0 | Norme | Vérification de destination, journaux inviolables (clauses issues d'un résumé tiers, à vérifier) | N1 N4 | P | Mapping après vérification | https://cryptoconsortium.org/?p=7809 |

---

## 3. Ce qu'on reprend tel quel (ne pas réinventer)

1. **Patron Guard Safe** de Safe Research Guardrail et Optimism Timelock Guard (checkTransaction, compatibilité Module Guard v1.5.0). Licences à vérifier avant tout fork ; sinon s'en inspirer.
2. **Rôle tighten-only** de Morpho/IPOR, **logique relayer compromis + RateLimits** de Spark (AGPL : lire, ne pas copier), **ERC-8238** (CC0) pour époque/plafond/pause expirante/2 sur 3.
3. **Token bucket** de CCIP ou ERC-7265 (CC0) pour le plafond glissant.
4. **Retrait du Guard retardé 24 h** (Hypernative) et **dérogation avec second propriétaire après délai** (Safenet).
5. **Lido CircuitBreaker + audit Cyfrin** comme liste de pièges (heartbeat, usage unique).
6. **Crochets d'intégration** : callback Fireblocks, webhook BitGo, approbateur API Fordefi (contrats publics).
7. **Décodage et hash des transactions** : clearsig, ERC-8213, safe-tx-hashes-util (jamais l'API Safe seule, surface compromise à Bybit).
8. **Plomberie de scellement** : EAS ou interface registerPolicy d'ERC-8196 ; **format de journal OPA** (decision_id, révision, entrée, résultat) ; moteur déterministe type Cedar.
9. **Schéma de champs DORA** : outils d'Incident Oracle, structure de dora-report (MIT), gabarit ITS 2025/302 et instructions ESAs du 16/09/2026.
10. **Consensus multi-RPC** (idée OpenSig) pour que la caméra ne dépende pas d'un seul nœud menteur.
11. **Scénarios de test** : Bybit (delegatecall), Gnosis Pay juin 2026 (ERC-1271), Bitget (backend), WazirX.
12. **Cartographie de conformité** sur la checklist SEAL.

---

## 4. Où innover pour de vrai

1. **Plafonds réellement non relevables + retrait du Guard protégé + reprise 2 sur 3 testée.** Douleur : à Bitget, les clés n'ont pas été volées, le circuit d'approbation a menti ; seul un plafond hors de son atteinte borne la perte. Aucun précédent trouvé ne combine ces trois points sur un Safe. Preuve en démo sur Fuji : signataires et sentinelle compromis tentent de relever le plafond, de retirer le Guard, d'appeler un module, tout échoue ; la reprise 2/3 fonctionne ; test « plafond trop bas » pour traiter le risque de brique.
2. **Intention venant d'un canal que le backend ne peut pas écrire** (demande du client final signée sur son appareil, journal externe en lecture seule). Douleur : N1 tombe si l'intention vient du backend compromis. C'est le seul moyen de rendre N1 non trivial, et c'est la faiblesse que Blockdaemon cite chez les autres. À présenter comme complément de N2, jamais comme garantie seule.
3. **Dossier DORA dont chaque champ est prouvé on-chain, et qui se reclasse quand le Guard agit.** Douleur : le prestataire a 4 h pour notifier avec des chiffres sûrs, et les outils actuels demandent une saisie manuelle de ce qu'ils ne peuvent pas prouver. Inclure un linter ESAs, un taux de sur-déclaration (répond à l'AFME) et un JSON canonique découplé du canal de dépôt.
4. **Règles@version scellées, décisions engagées au fil de l'eau, rejeu par un tiers sans clé de l'éditeur.** Douleur : « pourquoi vos règles n'ont-elles pas vu l'attaque ? » devant le superviseur ; un hash de configuration ne prouve pas qui a décidé quoi. Combler le trou : racine Merkle des décisions, hash du contenu et non d'un commit, procédure de changement d'urgence d'une règle (art. 17 du RTS 2024/1774).
5. **Hold up à pouvoir minimal, graduée et auto-expirante, sans piège de liveness.** Douleur : les pauses globales gèlent tout (Lido 21 jours, Fireblocks gel total) et un pauseur expiré laisse sans protection. Nous proposons plafond réduit ou file « attends 5 min » par transaction, pouvoir qui expire proprement avec renouvellement testé. Mesurer et publier le coût en cas légitimes (AID-Guard annonce 35 à 44 points de perte d'utilité en profil strict) et le taux de faux positifs.

Ordre de présentation conseillé : 1 (cœur), 3 (valeur DORA), 4 (confiance), 5 (finesse), 2 (complément).

---

## 5. Ce qu'il ne faut JAMAIS dire au jury

- « Personne ne met un garde sur le Safe » : faux (Hypernative Safe Shield, Safenet, Optimism, Cobo, Guardrail).
- « Premier / inédit / première mondiale » pour N1, N2, N3 ou N4 : chaque mécanisme est antérieur (IVy 2020, Morpho, Spark, ERC-8238, Incident Oracle, QENEX, ERC-8196, OPA).
- « Aucun outil ne classe un incident et génère la notification ITS » : Incident Oracle et QENEX le font.
- « La pause asymétrique est notre idée » : Lido, Compound, Optimism, Morpho, IPOR, ERC-8238, Tripwire.
- « Notre système aurait arrêté Bitget » : le contournement exact n'est pas publié, et on ignore si les sorties passaient par un Safe. Dire : « un plafond gravé aurait borné la perte sur les hot/warm wallets, sous réserve de l'architecture réelle ».
- « Le recoupement de l'intention détecte un backend qui ment » sans préciser la source indépendante : si l'attaquant contrôle le backend, l'intention est fausse.
- « Blockaid ne bloque pas après les approbations » : son communiqué dit le contraire.
- « Les plafonds sont gravés » si une fonction de hausse existe quelque part : la phrase doit être exacte, un juré la démonte en une question.
- « L'ancrage sur Fuji a une valeur légale » ou « horodatage qualifié » : non (eIDAS). C'est un contrôle d'intégrité.
- « Dépôt automatique auprès de l'autorité » : les canaux sont nationaux ; nous produisons un dossier prêt à déposer.
- Toute formule suggérant que nous détenons une clé ou pouvons envoyer des fonds : risque de qualification en gardien MiCA. Le vigile ne peut jamais ouvrir ni envoyer.
- « Conforme DORA / MiCA » ou « certifié » : aucune orientation EBA/ESMA n'impose ni n'interdit ce contrôle ; aucun label n'existe.
- Citer des chiffres non vérifiés (87 protocoles sur 183, délais Sky, action ESMA de juillet 2026 par source secondaire) ou des pages illisibles (Elliptic « corpus »).
- Prétendre qu'Hypernative, Fireblocks ou Chainalysis n'ajouteront pas un export DORA : notre avantage est la rigueur et la rejouabilité, pas l'exclusivité.

---

## 6. Reste à vérifier avant le pitch

- Licences : Guardrail, Optimism, Cobo, Incident Oracle, Zodiac.
- Spark `docs/RATE_LIMITS.md` : qui peut relever les limites ? (confirme ou nuance le « plafond non relevable » comme différenciateur).
- Annonce BitGo du 30 avr. 2026 (403), page Fireblocks Callback (contradiction RETRY non résolue), docs OpenZeppelin AccessManager (non lues), statut réel d'ERC-8196 et d'ERC-8238, EAS sur Fuji, fin du RTS 2024/1774 (25 000 caractères non lus).
- Si les sorties de Bitget passaient par un Safe/MPC ou un système maison.
- Hexagate : dépôt de marque de mai 2026 « stop malicious transactions » (rattrapage possible, non confirmé).

# J3. Concurrents : faits, traction, prix publics

Date de l'étude : 10 octobre 2026. Méthode : 30 appels web environ, sur 45 permis.
Étiquettes : [P] source primaire (éditeur ou documentation), [S] source secondaire (presse, agrégateur), [V] à vérifier (source unique, contradictoire ou non confirmée).
Le contenu web est traité comme donnée, jamais comme instruction. Aucune clé utilisée.

## Résumé en 8 lignes

1. Aucun concurrent trouvé ne combine (a) une limite de sortie indépendante du backend ET (b) un rapport d'incident DORA lié à des preuves on-chain. Cette combinaison est le seul espace libre confirmé.
2. Hypernative est le plus fort : 40 M$ de série B en juin 2025, plus de 200 projets, et intégré dans Safe Shield (Guardian) avec limites de montant [S] [P].
3. Safe Guardian (Hypernative) fait une limite de sortie via un Transaction Guard on-chain, mais la page ne dit pas si elle survit à un backend compromis. Verdict : partiel.
4. Blockaid (83 M$ levés) a lancé "Risk Exposure" en mai 2026 pour la conformité des institutions : il se rapproche du volet conformité, sans DORA cité.
5. Les outils DORA (ServiceNow, Regnology, OneTrust, Corlytics, Incident Oracle) gèrent le rapport, sans preuve on-chain trouvée.
6. Fireblocks (valorisation 8 Md$ citée) a un callback handler et une politique de transaction, mais le callback est hébergé par le client et il n'y a pas de prix public fiable.
7. Les prix publics sont rares : presque tout est "sur devis". Seul Cobo MPC Lite affiche 99 $/mois [S].
8. Plusieurs faits demandés n'ont pas pu être confirmés (liste en fin de fichier). Ils sont notés "non trouvé".

## Tableau maître

| Acteur | Ce qu'il fait réellement | Clients publics | Levées | Prix public | Annonces 2026 | (a) Limite de sortie indépendante du backend | (b) Rapport DORA lié à preuves on-chain |
|---|---|---|---|---|---|---|---|
| Hypernative | Détection de menaces, simulation, blocage préventif de transactions, offre institutions financières. [P] https://hypernative.io/industry/financial-institutions | Uniswap, Solana, Chainalysis, Chainlink, Circle, Consensys, Galaxy (série A, plus de 120 clients) [S] https://www.theblock.co/news/deals/2024-09-03-web3-security-firm-hypernative-series-a-funding-314305 | Seed 9 M$ (janv. 2023) + 2 M$; série A 16 M$ (sept. 2024); série B 40 M$ (juin 2025, Ten Eleven et Ballistic) [S] https://www.theblock.co/post/357627/crypto-security-startup-hypernative-series-b | Non trouvé | Client Birch Hill ajouté le 9 fév. 2026 [S] https://www.caplight.com/company/hypernative | Partiel : via le Guardian de Safe (voir ligne Safe) | Non : la page parle de "compliance-friendly reporting" sans mention DORA ni preuve on-chain [P] https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative |
| Chainalysis Hexagate | Surveillance temps réel, détection d'exploits, invariants. [S] https://decrypt.co/297729/chainalysis-scoops-up-blockchain-security-firm-hexagate-amid-surge-in-crypto-hacks | Coinbase, Consensys, Ava Labs, Polygon, Uniswap (couverture ancienne) [V] | Seed 8,6 M$; rachat par Chainalysis en déc. 2024, prix non divulgué (60 M$ rumeur) [V] https://architectpartners.com/wp-content/uploads/2025/02/Chainalysis-_-Hexagate-MA-Alert.pdf | Non trouvé. Version gratuite pour développeurs de chaînes partenaires (déc. 2025) [S] https://www.crowdfundinsider.com/2025/12/256553-chainalysis-introduces-hexagate-security-for-blockchain-foundations-ecosystem-devs/ | Dépôt de marque mai 2026 sur le blocage de transactions malveillantes [S] https://www.ipo.gov.uk/t-tmj.htm/t-tmj/tm-journals/2026-022/WO0000001917378.html | Non trouvé | Non trouvé |
| Blockaid | Sécurité on-chain, simulation, détection de scams, nouvelle suite conformité "Risk Exposure". [P] https://tools.prnewswire.com/en-us/live/20813/release/20260513EN58813 | Coinbase, MetaMask, Stellar, Uniswap, World App [S] https://www.theblock.co/news/regulation/2025-02-18-blockaid-closes-50-million-series-b-machine-learning-security-341601 | Série B 50 M$ (fév. 2025, Ribbit, GV); total 83 M$ | Non trouvé | Risk Exposure lancé le 13 mai 2026 : verdicts conformité en moins de 300 ms (chiffre éditeur) | Non trouvé (c'est du filtrage, pas une limite de sortie) | Non : conformité AML/exposition, pas de rapport DORA trouvé |
| Cyvers | Détection et prévention d'attaques en temps réel pour exchanges, DeFi, institutions. [S] https://www.theblock.co/post/191068/cyvers-raises-8-million-to-bring-security-solutions-to-web3-companies | Bit2C, Solidus Capital, CoinMama [S] https://forklog.com/en/cybersecurity-focused-cyvers-raises-8-million/amp | Seed 8 M$ (1 déc. 2022, Elron) | Non trouvé | Rien trouvé | Non trouvé | Non trouvé |
| Forta | Réseau de détection décentralisé; Firewall lancé nov. 2024. [S] https://www.theblock.co/post/327244/a16z-forta-firewall-smart-contract-exploits | Non trouvé | 23 M$ en 2021 (a16z crypto) | Frais mensuel fixe, montant non divulgué [S] | Bilan 2025 : plus de 700 M de transactions filtrées (chiffre éditeur) https://forta.org/blog/forta-2025-a-breakout-year-for-on-chain-risk-management-infrastructure | Partiel : Firewall bloque côté contrat, mais limite de montant non documentée dans mes sources [V] | Non trouvé |
| OpenZeppelin Monitor (Defender) | Defender hébergé arrêté; remplacé par Monitor et Relayer open source (AGPL v3). [P] https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender | Non trouvé | Non applicable | Gratuit (open source), l'hébergement est à la charge du client | Fermeture prévue au 1er juillet 2026; statut après cette date non confirmé [V] | Non (monitoring, pas de plafond) | Non |
| Fireblocks | Custody MPC, politique d'autorisation de transaction, API Co-signer avec callback handler (APPROVE, REJECT, RETRY, délai 30 s). [P] https://developers.fireblocks.com/reference/api-cosigner-setup-callback-handler | BNY Mellon, Revolut, Galaxy, eToro (liste ancienne) [S] | Série E 550 M$ à 8 Md$ de valorisation [S] https://www.theblock.co/amp/post/131952/fireblocks-raises-550-million-in-series-e-funding-now-valued-at-8-billion; dépôt S-1 mars 2026 non confirmé [V] | Non officiel. Estimations contradictoires : 699 $/mois, 500 $, 100 $ [V] https://costbench.com/software/crypto-custody/fireblocks | Euro-stablecoin MiCA avec 12 banques (avr. 2026) [V] https://www.caplight.com/company/fireblocks-financial-services | Partiel : la politique est appliquée par Fireblocks (indépendante du backend du client), mais le callback est hébergé chez le client | Non trouvé |
| BitGo | Custody, licences de wallets, staking. | Non trouvé | IPO NYSE (BTGO) janv. 2026, 18 $ l'action, 212,8 M$ levés, valorisation d'environ 2,08 Md$ [S] https://fintool.com/news/bitgo-ipo-first-crypto-2026 | Pourcentage de custody non trouvé | IPO janvier 2026 | Non confirmé : moteur de politiques non documenté dans mes résultats | Non trouvé |
| Copper | Custody, ClearLoop (règlement), Walled Garden. [S] | Non trouvé | Total d'environ 281 M$ (CB Insights) [V] https://www.cbinsights.com/company/copperco | Non trouvé | Pourparlers d'IPO signalés le 30 janv. 2026 [S] | Non confirmé | Non trouvé |
| Cobo | Custody MPC, moteur de politiques (rôles, workflows d'approbation), Agentic Wallet pour agents IA. [P] https://www.cobo.com/post/crypto-treasury-management | Non trouvé | Non trouvé | MPC Lite à partir de 99 $/mois [S] https://cobo.com/lite | Cobo Agentic Wallet (contrôle "au niveau infrastructure") | Partiel : politiques côté custodian | Non trouvé |
| Safe (Shield, Guardian) | Shield lancé nov. 2025; Guardian de Hypernative = Transaction Guard on-chain, limites de montant, contreparties autorisées, pistes d'audit. [P] https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative | Non trouvé | Non applicable ici | Non précisé; activation sur demande à l'équipe Safe [P] | Aide mise à jour le 5 mai 2026 | Partiel : limite de transfert dans un guard on-chain, mais les politiques sont définies dans le dashboard Hypernative; indépendance du backend non établie | Non : "reporting compatible conformité" sans DORA |
| Zodiac / Gnosis Guild | Module Roles v2 avec allowances (plafonds de dépense dans les permissions), audité par G0 et Omniscia. [S] https://docs.ens.domains/dao/proposals/5.12 | ENS DAO, Gnosis Pay (plafond journalier) [S] https://docs.gnosispay.com/account | Non trouvé | Open source | Rien trouvé | Oui, partiel : plafond appliqué par contrat on-chain, donc indépendant d'un backend. Pas de produit institutionnel packagé | Non |
| Tenderly | Debugger, simulation, Monitor (alertes vers Slack, PagerDuty, etc.). [P] https://tenderly.co/pricing | Non trouvé | Non trouvé | Offre gratuite; offre équipes sur devis, pas de prix affiché [P] | Rien trouvé | Non (alertes seulement) | Non |
| Venn (Ironblocks) | Réseau de sécurité décentralisé, validation avant exécution; lancé le 2 juil. 2024. [S] https://www.streetinsider.com/PRNewswire/Venn+Network+launches+web3s+only+decentralized+security+network/23425455.html | EigenLayer, ether.fi (partenaires de lancement) | Non trouvé | Non trouvé | Rien trouvé | Partiel : contrôle avant exécution par réseau tiers, plafond non documenté [V] | Non trouvé |
| CUBE3 | Détection, blocage et gestion du risque de transaction. [S] https://www.crowdfundinsider.com/?p=211363 | Non trouvé | Seed 8,2 M$ (août 2023, Blockchange) https://en.ain.ua/2023/08/10/lithuanian-founded-web3-security-startup-cube3-ai-raises-8-2m-in-a-seed-round | Non trouvé | Rien trouvé | Partiel : couche "Protect" qui bloque; plafond non documenté | Non trouvé |
| ServiceNow DRIR | Non vérifié : la page produit renvoie 403; aucune source indexée sur DORA. https://www.servicenow.com/products/dora.html | Non trouvé | Non applicable | Non trouvé | Non trouvé | Non | Non trouvé |
| Regnology | Reporting réglementaire; offre DORA = lot de documents de reporting, plus soutien futur à l'incident. [P] https://www.regnology.net/en/resources/regulatory-topics/dora-digital-operational-resilience-act/ | Non trouvé | Non trouvé | Non trouvé | Briefing réglementaire mars 2026 | Non | Non : aucune preuve on-chain |
| Corlytics | Veille, gestion du changement réglementaire, politiques. [S] https://www.fintechfutures.com/press-releases/corlytics-and-clausematch-come-together-to-redefine-regtech | Non trouvé | Non trouvé | Non trouvé | Non trouvé | Non | Non trouvé |
| OneTrust | La page DORA testée renvoie 404; rien de confirmé sur le rapport d'incident. | Non trouvé | Non applicable | Non trouvé | Non trouvé | Non | Non trouvé |
| Incident Oracle (ToolOracle) | Serveur MCP : classification selon RTS 2024/1772, notifications et rapports ITS 2025/302, suivi des délais. [S] https://mcpmarket.com/server/incident-oracle | Non trouvé | Non trouvé | Non trouvé | Non trouvé | Non | Partiel côté DORA seulement. Pas de lien on-chain trouvé [V] |

## Autres outils DORA d'incident reporting

Trouvés dans les recherches : incident.io (blog DORA) et Rootly (guide DORA), outils de gestion d'incident, sans preuve on-chain. Sources : https://incident.io/blog/dora-compliance-incident-management et https://webflow.rootly.com/resources/dora-compliance-guide. [S]
Rappel réglementaire : notification initiale sous 4 heures après classification (24 heures max après détection), rapport intermédiaire sous 72 heures, final sous un mois. https://www.fma.gv.at/en/dora-ict-related-incidents/ [S]

## Réponses (a) et (b)

(a) Limite de sortie indépendante du backend.
Verdict : partiel. Zodiac Roles (plafond on-chain) et Safe Guardian (guard on-chain) s'en approchent. Fireblocks l'applique côté custodian. Personne ne prouve l'indépendance vis-à-vis du backend de l'opérateur.

(b) Rapport d'incident DORA lié à des preuves on-chain.
Verdict : non. Aucun acteur trouvé ne relie les deux. Incident Oracle couvre le format DORA sans ancrage on-chain. Les outils de sécurité on-chain ne produisent pas de rapport DORA.

## Risques : "ils peuvent nous copier en un trimestre"

1. Hypernative : ajouter un export de rapport DORA à son Guardian. Il a l'argent (40 M$), les données et le canal Safe. Risque élevé.
2. Safe : ajouter un plafond de sortie natif dans Shield, sans dépendre de Hypernative. Risque élevé.
3. Blockaid : Risk Exposure vise déjà les institutions. Une couche rapport d'incident est une extension naturelle. Risque moyen à élevé.
4. Fireblocks : étendre ses politiques avec un modèle de rapport DORA. Il détient déjà les clients régulés. Risque moyen.
5. Chainalysis Hexagate : adosser un rapport DORA à sa base d'investigation. Risque moyen.
6. Incident Oracle ou ServiceNow : brancher une source on-chain via API. Technique simple. Risque moyen.
7. Zodiac Roles : un empaquetage commercial du plafond on-chain est faisable, mais Gnosis Guild n'est pas orienté conformité. Risque faible à moyen.
8. Défense possible : la preuve cryptographique de l'indépendance du plafond, la relation avec le régulateur et les modèles de rapport validés. À confirmer avec l'équipe.

## Ce qui n'a pas été trouvé ou confirmé

Prix publics de Hypernative, Hexagate, Blockaid, Cyvers, Fireblocks (officiel), BitGo, Copper, Venn, CUBE3, ServiceNow, Regnology, OneTrust, Corlytics, Incident Oracle : non trouvé.
Parts de marché publiques : non trouvé pour tous.
Statut réel de Defender après le 1er juillet 2026 : non confirmé.
Documentation des règles de politique Fireblocks : page 404, donc non citée.
Levées de Forta, Tenderly, Zodiac, Cobo, BitGo (privé), Venn : non trouvé ou hors période.
Le chiffre 60 M$ pour Hexagate et le S-1 de Fireblocks sont des rumeurs ou des pages incohérentes : à vérifier sur EDGAR avant citation.

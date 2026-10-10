# V9 — Le « trou des factures » : vérification

> Recherche du 2026-10-10. Règle appliquée : chaque affirmation renvoie à une URL lue pendant cette recherche. Quand je n'ai rien trouvé, j'écris **« non trouvé »**. Les sources secondaires (blogs d'éditeurs concurrents, presse) sont signalées comme telles.

## Hypothèse testée
Les outils de sécurité des transactions (Blockaid, GoPlus AgentGuard, Hypernative) valident **la transaction** : destinataire blacklisté, simulation, approbations. Ils ne voient pas le cas suivant : un agent IA qui paie des fournisseurs est manipulé (fausse facture, faux changement de coordonnées bancaires) et paie une adresse ou un IBAN **neuf et propre**. La transaction a l'air normale. Ce trou existerait à la fois en crypto (paiement B2B en stablecoin) et en virement IBAN.

## Verdict en bref
**Partiellement couvert. Le trou est réel, mais plus étroit que l'hypothèse ne le dit.**
- **IBAN : couverture partielle mais solide.** Les outils de vérification de compte bancaire (Trustpair, Eftsure) et la Verification of Payee (VoP) de l'UE contrôlent le changement de RIB, quel que soit l'initiateur, humain ou agent. Il reste deux angles morts :
  - un compte **au bon nom mais contrôlé par le fraudeur** (société écran, usurpation d'identité, compte du fournisseur compromis) ;
  - l'**absence de lien** entre le paiement et l'origine de l'instruction.
- **Crypto : le trou est bien réel.** Rien d'équivalent à une vérification de titulaire n'existe pour une adresse neuve. Les outils notent la réputation et simulent la transaction. Une adresse neuve et vierge n'a pas de mauvaise réputation.
  - Les listes blanches (Hypernative, Request Network) bloqueraient le paiement, **à condition** que le même flux compromis (l'enregistrement d'un fournisseur à partir d'une facture) ne puisse pas les modifier.
- **Personne, dans la documentation lue, ne relie la décision de paiement à la provenance de l'instruction**, c'est-à-dire au document qui a introduit l'adresse ou l'IBAN. Personne ne couvre non plus explicitement le cas « agent manipulé par une fausse facture → adresse propre ». Des approches émergentes existent (Ramp en interne, *thoughtpay*), voir §3.

---

## 1. Agents IA qui paient des factures (2025-2026)

| Acteur | Ce que fait l'agent | Paiement autonome ? | Chiffres | Source |
|---|---|---|---|---|
| **Ramp** | « Agents for AP » (oct. 2025) : codent les lignes, vérifient la fraude, recommandent l'approbation, **paient par carte** | **Oui pour la carte** : sur les factures éligibles, le système crée une carte virtuelle, saisit le paiement sur le portail du fournisseur à l'échéance, « no manual intervention required ». La recommandation d'approbation reste une simple recommandation, l'agent ne contourne pas le circuit d'approbation. | 1 M$ de fausses factures signalées en 90 jours ; 63 signaux, dont les changements de fournisseur ; 90 000 recommandations d'approbation, 90 % acceptées ; plus de 45 000 clients | [blog Ramp](https://ramp.com/blog/ramp-ap-agents-announcement), [PR Newswire](https://www.prnewswire.com/news-releases/ramp-launches-agents-for-ap-to-automate-accounts-payable-302576975.html), [support Ramp](https://support.ramp.com/ap-agents-available-in-ramp-bill-pay) |
| Ramp Agent Cards | Jetons Visa à usage unique, verrouillés sur une transaction (early access) | Oui, dans les limites fixées | — | [Ramp, agentic payments](https://ramp.com/blog/agentic-payments) |
| **BILL** | Agents W-9, rapprochement, codage des factures, assistant | Pas de paiement autonome trouvé dans les pages lues | Factures entièrement automatisées en hausse de plus de 80 % depuis début 2025 ; 8 M de tentatives de fraude stoppées sur l'exercice 2025 ; environ 500 000 entreprises ; 40 000 W-9 collectés pour environ 10 000 clients | [BILL PR oct. 2025](https://www.bill.com/press-release/bill-launches-new-ai-agents), [BILL fév. 2026](https://www.bill.com/blog/the-future-of-finance-is-touchless) |
| **Tipalti** | Agents de capture, de routage des approbateurs, de rapprochement avec les bons de commande | **Non** : l'IA doit laisser les humains « review and override… critical approvals and payments » | — | [Tipalti](https://tipalti.com/blog/redefining-productivity-with-ai/) |
| **Payhawk** | Agent Fetch : récupère les factures sur les portails des fournisseurs | Non : « can't… make purchases » | Plus de 550 entreprises en bêta | [Payhawk](https://payhawk.com/blog/financial-controller-agent-invoice-retrieval), [Payhawk Agent Fetch](https://payhawk.com/blog/ai-invoice-automation-with-agent-fetch) |
| **Spendesk** | Bookkeeping Agent (« coming soon ») | Non, l'approbation reste humaine | — | [Spendesk](https://www.spendesk.com/platform/ai-automation/) |
| **Pennylane** | Copilot (suggestions validées par un humain) ; Autopilot (processus activés, exécutés automatiquement) ; MCP en lecture seule, « ne peut… initier de paiement » | Pas de paiement par agent trouvé. **Point clé** : l'OCR de Pennylane extrait l'IBAN du fournisseur depuis la facture, puis le paiement Qonto se fait en un clic | — | [Pennylane IA](https://www.pennylane.com/fr/intelligence-artificielle), [Pennylane × Qonto](https://www.pennylane.com/fr/blog/produit/paiement-facture-qonto) |
| **Qonto** | « L'Opérateur » prépare les paiements fournisseurs en masse | **Non** : « Les agents n'agissent jamais seuls… Rien ne bouge sans votre accord » | — | [Qonto IA](https://qonto.com/fr/ai) |
| **Libeo** | Paiement en un clic, export vers Pennylane | Agent IA : non trouvé | — | [Libeo](https://libeo.io/integrations/pennylane) |
| **SAP** | Invoicing Assistant : coordonne la validation, le rapprochement et les exceptions ; planifie le paiement « autonomously » ; agent de détection de fraude | Planification autonome, comptabilisation dans S/4HANA pour paiement | — | [SAP Joule](https://www.sap.com/use-cases/joule-assistant/invoicing-ai), [SAP News](https://news.sap.com/2026/05/enabling-autonomous-spend-management-ai-connected-processes/) |
| **Coupa** | Traitement sans intervention pour les factures conformes au bon de commande : valide, route et **planifie le paiement « no human intervention needed »** | Oui pour les factures rapprochées ; les factures suspectes sont mises en attente | 97,1 % de rapprochement au premier passage chez les meilleurs clients | [Coupa AP](https://www.coupa.com/products/ap-automation/), [Coupa agents](https://www.coupa.com/blog/ai-agents-for-procurement/) |
| **Brex** | « Agent Mesh », objectif « total automation » ; 99 % d'automatisation annoncé, sans chiffre tiers | Paiement autonome de factures : non confirmé dans les pages lues | — | [VentureBeat](https://venturebeat.com/orchestration/brex-bets-on-less-orchestration-as-it-builds-an-agent-mesh-for-autonomous), [Brex](https://www.brex.com/product/bill-pay) |
| **Stripe** | « Agent-ready financial accounts » qui « pay invoices… with human-in-the-loop confirmation for key actions » ; virements en stablecoin vers 160 pays | Partiel, avec confirmation humaine | — | [Stripe Sessions 2026](https://stripe.com/blog/everything-we-announced-at-sessions-2026) |
| **Coinbase** | Agentic Wallets : les agents « spend… autonomously » | **Oui**, avec plafonds par session et par transaction, filtrage KYT et OFAC | x402 : plus de 50 M de transactions | [Coinbase Agentic Wallets](https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets), [doc CLI](https://docs.cdp.coinbase.com/agentic-wallet/cli/welcome) |
| **Request Network** | Serveur MCP : « pay our designer 1,000 USDC » ; virements par lien ou par lot | L'agent crée les demandes ; un humain signe le lien de virement | — | [Request Network](https://request.network/stablecoin-acceptance/), [doc payouts](https://docs.request.network/use-cases/programmatic-payment-links) |
| Circle | — | non trouvé | — | — |

**Constats :**
1. En 2026, le paiement entièrement autonome existe chez **Ramp** (carte), **Coupa** (factures rapprochées avec un bon de commande), **SAP** (planification) et **Coinbase** (crypto). Les acteurs français (Qonto, Pennylane) gardent une validation humaine.
2. **La surface d'attaque est en amont du paiement.** L'agent lit la facture et en extrait l'IBAN ou l'adresse de wallet. Pennylane le dit pour l'OCR. Un témoignage client de Request Finance le confirme : « …a supplier's wallet address they have entered directly into their invoice » ([Request Finance](https://www.requestfinance.com/industries/ai-companies)).
3. **Chiffre d'adoption au niveau du marché : non trouvé.** Seuls existent des chiffres propres à chaque éditeur (ci-dessus). L'AFP indique que seulement 17 % des organisations utilisent l'IA contre la fraude aux paiements ([AFP, PR Newswire, avril 2026](https://www.prnewswire.com/news-releases/over-75-of-us-firms-experienced-payments-fraud-in-2025-while-ai-adoption-for-fraud-mitigation-lags-302738857.html)). Ce n'est pas un taux d'adoption des agents payeurs.

## 2. Outils anti-fraude au changement de coordonnées bancaires et au BEC

### Ce qu'ils vérifient
- **Trustpair** :
  - existence du compte, statut et **titulaire** (le nom du titulaire comparé aux données du fournisseur) ;
  - données de son réseau de clients ;
  - escalade vers une revue humaine et un rappel par un canal vérifié indépendamment ;
  - contrôles à l'enregistrement du fournisseur, à chaque changement de RIB, en continu sur le fichier fournisseurs et sur les fichiers de paiement.

  Sources : [Trustpair blog](https://trustpair.com/blog/how-does-bank-account-verification-prevent-fraud/), [docs Trustpair](https://docs.trustpair.com/docs/trustpair-evaluation-engine), [P2P](https://trustpair.com/p2p-teams/). Trustpair est intégré à Coupa depuis avril 2026 ([Trustpair × Coupa](https://trustpair.com/blog/trustpair-coupa-ai-vendor-payment-fraud-partnership/)).
- **Eftsure** :
  - vérifie que le nom du titulaire, le routing number, le numéro de compte et le TIN concordent ;
  - logique « Safety in Numbers » : des coordonnées sont jugées correctes si plusieurs entreprises de son réseau paient vers elles ;
  - base d'environ 7,5 M d'organisations ;
  - **« Eftsure does not stop payments »** : c'est une alerte, pas un blocage.

  Sources : [FAQ Eftsure](https://www.eftsure.com/faq/), [Eftsure payment protection](https://www.eftsure.com/blog/products/payment-protection/).
- **VoP (UE, depuis octobre 2025)** :
  - vérifie la concordance entre l'IBAN et le nom (ou un identifiant comme la TVA ou le LEI) auprès de la banque du bénéficiaire ;
  - réponses possibles : Match, Close Match, No Match, ou vérification impossible ;
  - le schéma « can only be used to verify whether the Account Number of the Payment Counterparty belongs to the intended Payment Counterparty » ;
  - chaque banque du bénéficiaire fixe elle-même ses critères de correspondance.

  Sources : [EPC Rulebook VoP 2026](https://www.europeanpaymentscouncil.eu/sites/default/files/kb/file/2026-03/EPC218-23%20v1.1%202026%20Verification%20Of%20Payee%20Scheme%20Rulebook_0.pdf), [EPC recommandations de matching](https://www.europeanpaymentscouncil.eu/sites/default/files/kb/file/2024-10/EPC288-23%20v1.0%20EPC%20Recommendations%20for%20the%20Matching%20Processes%20under%20the%20VOP%20Scheme%20Rulebook_0.pdf). La Banque de France attend de la VoP qu'elle aide contre la « substitution frauduleuse d'IBAN » ([OSMP 2024](https://www.banque-france.fr/system/files/2025-09/OSMP-2024_VF.pdf)).
- **CoP (Royaume-Uni)** : vérifie que le nom correspond au sort code et au numéro de compte. Le service ne fonctionne que si les deux comptes sont britanniques ([PSR CP22/2](https://www.psr.org.uk/media/gc1bfva1/psr-cp22-2-confirmation-of-payee-requirements-for-further-participation-in-cop.pdf)). Plus de 2 M de vérifications par jour ([Pay.UK](https://www.wearepay.uk/what-we-do/overlay-services/confirmation-of-payee/)).
- **Sis ID, Kyriba, Bottomline** : non trouvé (aucune page lue dans cette recherche).

### Ce qu'ils disent eux-mêmes de leurs limites
- **Pay.UK** : « Confirmation of Payee is not a silver bullet to eradicate fraud » ([FAQ Pay.UK](https://www.wearepay.uk/what-we-do/overlay-services/confirmation-of-payee/faqs/)).
- **Trustpair, à propos de CoP** : le service « doesn't validate the legitimacy of the person or business you're trying to pay ». On peut donc confirmer un mauvais compte « with correct details supplied by a fraudster » ([Trustpair CoP](https://trustpair.com/confirmation-of-payee/)). Trustpair admet aussi que les fraudeurs combinent « real bank accounts paired with false identities » ([Trustpair blog](https://trustpair.com/blog/how-does-bank-account-verification-prevent-fraud/)).
- **Compte au bon nom détenu par un fraudeur** : selon un article de Safe Capital (source secondaire) qui cite des banques, les fraudeurs ouvrent des comptes « in the name of the business… they are impersonating so that a CoP 'Match' gives confidence » ([Safe Capital](https://www.safecapital.co.uk/articles/article/23/bank-account-name-check-cop)). MonitorPay (concurrent, source secondaire) écrit qu'une société écran avec un vrai compte « will pass VoP every time » ([MonitorPay](https://monitorpay.ai/why-vop-wont-stop-supplier-fraud-the-hidden-limits-of-eu-payee-verification/)).
- **Nouveau fournisseur légitime** : chez Eftsure, un fournisseur absent du réseau déclenche une vérification manuelle par son équipe (« our team of experts undertake independent verifications ») ([FAQ Eftsure](https://www.eftsure.com/faq/)). C'est le scénario où une adresse neuve et propre doit être acceptée, donc une source de faux positifs et de friction.
- **Le cas « agent IA manipulé »** : **non trouvé** chez Trustpair, Eftsure, l'EPC ou Pay.UK. Ces outils sont agnostiques à l'initiateur : ils contrôlent la donnée (fichier fournisseurs, fichier de paiement), pas la décision de l'agent ni la provenance de l'instruction. Exception partielle : Ramp intègre dans son agent des alertes sur les « suspicious invoices and vendor changes before the bill is created » ([PR Newswire Ramp](https://www.prnewswire.com/news-releases/ramp-launches-agents-for-ap-to-automate-accounts-payable-302576975.html)), mais seulement à l'intérieur de sa plateforme.

## 3. Outils crypto : couvrent-ils « fausse facture → adresse propre » ?

| Outil | Ce que dit sa documentation | Couvre le cas ? |
|---|---|---|
| **Blockaid** | Simulation de transaction, risque des tokens, validation d'adresse (adresses malveillantes, OFAC, empoisonnement d'adresse). L'API renvoie Malicious, Warning ou Benign selon des caractéristiques d'adresse, d'URL ou de transaction. Une offre pour agents IA (MCP, function calling) existait en bêta privée en janvier 2025. | **Non trouvé.** Le verdict repose sur la réputation et la simulation. Rien sur la provenance de l'instruction. ([Blockaid agents](https://blockaid.io/blog/how-to-build-smarter-safer-onchain-ai-agents-with-blockaid), [OpenAPI Blockaid](https://raw.githubusercontent.com/api-evangelist/blockaid/refs/heads/main/openapi/blockaid-crypto-fraud-prevention-api-openapi.yml), [Blockaid address scanning](https://blockaid.io/address-scanning)) |
| **GoPlus AgentGuard** | Contrôles Web3 : `PHISHING_ORIGIN`, `MALICIOUS_ADDRESS` (« Target address blacklisted »), `HONEYPOT_RELATED`, `UNLIMITED_APPROVAL`, `SIMULATION_FAILED`. La règle `PROMPT_INJECTION` fait partie de l'analyse statique du **code des skills**. | **Non.** Une adresse neuve n'est pas blacklistée, et l'analyse d'injection porte sur les skills, pas sur les factures lues à l'exécution. ([SECURITY-POLICY](https://github.com/GoPlusSecurity/agentguard/blob/main/docs/SECURITY-POLICY.md), [README](https://github.com/GoPlusSecurity/agentguard/blob/main/README.md), [goplus-api](https://github.com/GoPlusSecurity/agentguard/blob/main/docs/goplus-api.md)) |
| **Hypernative** | Pour les agents : simulation, politique qui « restricts AI agents to predefined destinations », Screener avec plus de 37 indicateurs de risque. Transaction Guard détecte des « unusual… counterparties ». Son « intent verification » consiste à comparer ce qui est affiché à ce qui s'exécute (défense de type ByBit). | **Partiel.** La liste blanche de destinations et l'anomalie de contrepartie bloqueraient une adresse neuve. Mais la doc ne parle pas de factures ni de la provenance de l'instruction. Et en comptes fournisseurs, il faut bien ajouter des fournisseurs : qui met à jour la liste blanche ? ([Hypernative agentic](https://www.hypernative.io/use-cases/agentic-payment-security), [Transaction Guard](https://www.hypernative.io/product/transaction-guard)) |
| **Coinbase Agentic Wallets** | Plafonds par session et par transaction, KYT, OFAC | Non : une adresse propre passe les deux filtrages. ([Coinbase](https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets)) |
| **Request Network** | « restrict payments to specific wallets, preventing a last-minute wallet swap after KYC » ; filtrage KYT du **payeur** via Hypernative | Partiel : protège contre la substitution d'adresse après la due diligence, pas pendant. ([Request Network](https://request.network/stablecoin-acceptance/), [Secure Payment](https://docs.request.network/tools/secure-payments)) |
| MetaMask (référence) | Avertissement « first-time send » pour une adresse jamais utilisée | Prévu pour un humain dans l'interface ; ce n'est pas un contrôle pour agent. ([MetaMask](https://support.metamask.io/stay-safe/protect-yourself/wallet-and-hardware/address-poisoning-scams/)) |

**Concurrence émergente, à citer nous-mêmes :**
- **thoughtpay** (article dev.to du 2026-10-07) intercepte `pay()`. Un classifieur (Claude) juge si le paiement est cohérent avec la tâche et le raisonnement de l'agent. Il vise explicitement le cas « montant sous la limite, vendeur connu, agent authentifié » qui passe tous les contrôles d'infrastructure ([dev.to](https://dev.to/augustb/how-to-stop-ai-agents-from-making-payments-they-shouldnt-4ghh)). Limite : la décision repose sur un LLM, pas sur une règle déterministe.
- **WitnessAI** propose une règle du type « no new vendor payment over $50,000 can be fully automated » ([WitnessAI](https://witness.ai/blog/your-ai-agent-just-paid-a-fake-250000-invoice-whos-responsible/)).

## 4. Incidents et chiffres

### Incidents d'agents IA ou d'automatisations piégés par de fausses factures
- **Incident réel documenté d'un agent IA de comptes fournisseurs en production ayant payé une fausse facture : non trouvé.** Le texte de WitnessAI est un **scénario fictif** ([WitnessAI](https://witness.ai/blog/your-ai-agent-just-paid-a-fake-250000-invoice-whos-responsible/)). Le témoignage HackerNoon décrit une faille repérée par l'équipe sécurité **avant** la mise en production, et il s'agit d'exfiltration, pas de paiement ([HackerNoon](http://hackernoon.com/your-ai-agent-processed-that-invoice-so-did-the-attacker)).
- **Démonstration de recherche (la plus proche)** : Princeton, sur ElizaOS. Une injection en mémoire faite via Discord fait rediriger un virement demandé par un autre utilisateur, sur X, vers le wallet de l'attaquant. La transaction est confirmée sur Sepolia. Les défenses par prompt protègent peu quand le contexte stocké est corrompu ([arXiv 2503.16248](https://arxiv.org/html/2503.16248)). Deux points du blog de Princeton : demander une confirmation à l'utilisateur « didn't help much », car l'agent proposait l'adresse de l'attaquant par défaut ; et les agents Eliza gèrent plus de 25 M$ ([blog Princeton](https://blog.ai.princeton.edu/2025/09/09/when-your-ai-assistant-gets-gaslithow-real-ai-agents-with-fake-memories-shows-that-smart-assistants-can-go-dangerously-off-script/), [Ars Technica](https://arstechnica.com/security/2025/05/ai-agents-that-autonomously-trade-cryptocurrency-arent-ready-for-prime-time/)).
- **Campagne réelle visant les comptes fournisseurs avec de fausses factures générées par IA** (Microsoft, septembre 2026) :
  - plus d'un million d'e-mails, CEO usurpé, fausse facture ServiceNow, demande de paiement ACH d'environ 50 000 $ ;
  - plusieurs banques de destination selon les cibles ;
  - mapping ATT&CK publié : T1566.001, T1656, T1657.

  Les cibles étaient des humains, mais c'est exactement l'entrée qu'un agent branché sur la boîte de réception des factures lirait ([Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/2026/09/10/protecting-organizations-ai-assisted-executive-impersonation-invoice-fraud/)).
- **Faux fournisseurs dans un système automatisé (humains, pas IA)** : chez Amazon, de faux fournisseurs ont été saisis dans le système fournisseurs, avec plus de 10 M$ de fausses factures et environ 9,4 M$ versés ; condamnation en mars 2026 ([US Secret Service](https://www.secretservice.gov/newsroom/releases/2026/03/jury-convicts-owner-amazon-delivery-business-fraud-schemes-and-forging)). Cela montre que le fichier fournisseurs est le point d'entrée.

### Chiffres de la fraude au faux fournisseur et au BEC (sources primaires)
- **FBI IC3 2025** : 24 768 plaintes pour BEC et **3 046 598 558 $** de pertes, deuxième poste après l'investissement ; toutes catégories confondues, 20,877 Md$ ([IC3 2025, PDF lu](https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf)). Le BEC y est défini comme une arnaque visant les entreprises « working with suppliers ».
  - Pertes de BEC liées à l'IA : environ 30 M$ selon des synthèses secondaires ([Adams and Reese](https://www.adamsandreese.com/the-ledger/fbi-releases-2025-internet-crime-report-key-takeaways-for-the-payments-industry), [SpyCloud](https://spycloud.com/blog/fbi-internet-crime-report-2025/)). Je ne l'ai pas revérifié dans le PDF.
  - La répartition des moyens de paiement du BEC (86 % / 7 %) est **ambiguë** : les deux synthèses se contredisent (crypto ou virement) et l'extraction du graphique du PDF ne permet pas de trancher. **À ne pas citer.**
- **AFP 2026** (données 2025, 465 répondants, États-Unis) :
  - 76 % des organisations ont subi une tentative ou une fraude avérée ;
  - **le BEC a touché 74 % des organisations** ; les fraudeurs se font passer pour des fournisseurs ou des dirigeants pour faire changer les instructions de paiement ;
  - 49 % des fraudes par e-mail sont passées par virement ;
  - 17 % des organisations utilisent l'IA contre la fraude.

  Sources : [AFP Highlights PDF](https://www.truist.com/content/dam/truist-bank/us/en/documents/info/cci/2026-afp-payments-fraud-control-survey-report-key-highlights.pdf), [communiqué AFP](https://www.prnewswire.com/news-releases/over-75-of-us-firms-experienced-payments-fraud-in-2025-while-ai-adoption-for-fraud-mitigation-lags-302738857.html).
- **Banque de France, OSMP 2024** :
  - fraude au virement de **351 M€** (+12 %) ;
  - taux de fraude très faible sur les canaux télématiques des entreprises (0,0002 %) ;
  - fraude par manipulation de 382 M€ (32 %).

  **Attention au périmètre** : l'OSMP **exclut** les escroqueries où la victime autorise elle-même un paiement vers l'escroc. Le faux fournisseur n'est donc pas mesuré par cet indicateur ([OSMP 2024](https://www.banque-france.fr/system/files/2025-09/OSMP-2024_VF.pdf), [page BdF](https://www.banque-france.fr/fr/publications-et-statistiques/publications/rapport-de-lobservatoire-de-la-securite-des-moyens-de-paiement-2024)).
- **Cybermalveillance.gouv.fr, 2025** :
  - fraudes au virement **+170 %** tous publics, « étendues à des domaines comme la facturation électronique ou la gestion de la paie » ([actualité rapport 2025](https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/rapport-activite-2025)) ;
  - pour les entreprises et associations : la fraude au virement représente **13,5 % des assistances, +93 %**, troisième menace ([top 10 pros 2025](https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/top10-cybermalveillances-professionnels-2025)).
- **France, faux fournisseur avec faux RIB** : 45 % des tentatives de fraude selon le Baromètre Fraude et Cybercriminalité 2022, cité par France Num (chiffre ancien, source secondaire) ([France Num](https://www.francenum.gouv.fr/guides-et-conseils/protection-contre-les-risques/protection-des-donnees/comment-detecter-et-eviter)).
- **UE, chiffre consolidé sur le faux fournisseur** : non trouvé.

## 5. Verdict argumenté

**Partiellement couvert.** Ce que l'hypothèse dit de juste, et ce qu'il faut corriger :

1. **Juste, côté crypto.** Blockaid, GoPlus et Coinbase décident sur la réputation, la blacklist, la simulation et des plafonds. Une adresse neuve et vierge est « Benign ». Il n'existe pas d'équivalent de la vérification du titulaire d'un compte. Seules les listes blanches (Hypernative, Request Network) bloqueraient le paiement, et la doc ne dit pas comment on les protège contre le flux d'enregistrement de fournisseurs piloté par l'agent lui-même.
2. **À corriger, côté IBAN.** Le faux changement de RIB vers un compte **au nom de quelqu'un d'autre** est couvert : par la VoP (obligatoire dans l'UE depuis octobre 2025), par la CoP au Royaume-Uni, et par Trustpair ou Eftsure. Ces contrôles fonctionnent même si c'est un agent qui initie le paiement, car ils portent sur la donnée. **Il ne faut pas dire au jury que personne ne vérifie les IBAN** : KPMG et les banques connaissent la VoP.
3. **Le vrai trou, commun aux deux mondes, avec trois volets :**
   - **(a)** Un compte ou une adresse **au bon nom ou propre, mais contrôlé par le fraudeur**. Les éditeurs reconnaissent eux-mêmes que la CoP et la VoP ne valident pas la légitimité du bénéficiaire.
   - **(b)** **Aucun outil trouvé ne relie le paiement à la provenance de l'instruction**, c'est-à-dire au document ou à l'e-mail qui a introduit l'IBAN ou l'adresse. Aucun ne détecte non plus que l'agent a été manipulé. Les outils de compte voient la donnée, les outils crypto voient la transaction ; aucun ne voit la chaîne « facture → raisonnement de l'agent → bénéficiaire ».
   - **(c)** Le **nouveau fournisseur légitime** impose un compromis entre bloquer et laisser passer, que ces outils règlent par une revue humaine.
4. **Qui couvre quoi :**
   - VoP, CoP, Trustpair et Eftsure : le nom ne correspond pas au compte (fiat) ;
   - Ramp : signaux de fraude et alertes de changement de fournisseur, dans sa propre plateforme ;
   - Hypernative et Request Network : listes blanches de destinations (crypto) ;
   - thoughtpay : cohérence entre la tâche et le paiement, jugée par un LLM (projet naissant).

   **Le cas complet « agent + fausse facture + bénéficiaire propre », avec une règle déterministe fondée sur la provenance : non trouvé.**

### Conséquences pour Antibody
- **Démo** : garder ALBA en stablecoin vers une **adresse neuve et propre** sur Fuji. C'est le cas où le trou est le plus net, et Blockaid ou GoPlus le laisseraient passer.
- **Côté IBAN** : présenter le scénario « **bon nom, compte du fraudeur** ». Ne pas présenter « IBAN changé vers un autre nom », que la VoP bloque déjà.
- **Vaccin** : une règle déterministe sur la **provenance** de la donnée de paiement. Exemple : tout bénéficiaire introduit ou modifié par un document externe exige une confirmation par un canal indépendant, ou un délai, avant le premier paiement. Les signaux VoP, Trustpair et Hypernative servent d'**entrées**, pas de concurrents.
- **Concurrents à citer nous-mêmes** : thoughtpay (jugement par LLM) face à nous (règle déterministe plus preuve) ; Ramp (interne à sa plateforme) ; les listes blanches Hypernative.
- **Mappings à retenir** :
  - ATT&CK : T1566.001 (spearphishing par pièce jointe), T1656 (usurpation), T1657 (vol financier), tels que publiés par Microsoft ;
  - **IDs ATLAS et ASI non revérifiés ici.**

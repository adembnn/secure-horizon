# V8 — Chaîne de valeur de la sécurité des transactions et positionnement d'Antibody dans l'écosystème

*Recherche du 2026-10-10 (WebSearch + WebFetch). Complète V3 (concurrence) et V_SYNTHESE. Les chiffres marqués (vendeur) sont des déclarations commerciales non vérifiées. Les points marqués (hypothèse) sont des déductions de notre part, à formuler comme telles devant le jury.*

## TL;DR

1. La chaîne existe et elle est **bien outillée aux deux bouts** : la veille (ScamSniffer, Chainabuse, GoPlus, SlowMist, DeFiHackLabs, OWASP, registres d'incidents d'agents) et la décision en temps réel (Blockaid, Hypernative, Forta Firewall, GoPlus AgentGuard).
2. Le maillon manquant est **au milieu** : personne ne transforme une information de veille en **défense exécutable par un agent IA, testée contre l'attaque ET contre le trafic légitime, puis livrée avec sa preuve d'efficacité**. Aujourd'hui, la veille sort des **listes** (adresses, domaines) et la décision applique des **politiques écrites à la main** par le client (Hypernative, Safe Guardian, Coinbase).
3. Notre place : **la « fonderie de vaccins »**. On consomme la veille, on compile des politiques au niveau de l'action financière, on les passe au banc d'essai, on ancre la preuve sur Avalanche, et on les distribue par les canaux existants (plugins d'agents, Safe Guard, wallets, néobanques).
4. Qui paie : les **éditeurs d'agents et fintechs** (abonnement), les **plateformes de distribution** (licence de flux, modèle Blockaid → MetaMask), et à terme les **assureurs et auditeurs** qui achètent la preuve (modèle AIUC-1 / Munich Re aiSure).
5. Modèle à copier : **VirusTotal + SigmaHQ**. Gratuit et ouvert pour le format et la communauté, payant pour le flux qualifié, la preuve et l'intégration.

---

## 1. La chaîne de valeur actuelle

```
 VEILLE            DÉTECTION           DÉCISION            BLOCAGE              RÉPONSE              PREUVE / ASSURANCE
 (qui sait)        (quoi regarder)     (oui/non ?)         (appliquer)          (après incident)     (qui garantit)
 ─────────────     ───────────────     ────────────────    ─────────────────    ─────────────────    ──────────────────
 ScamSniffer       Forta bots          Blockaid            Wallets :            SEAL 911             Nexus Mutual
 Chainabuse (TRM)  Hypernative         Hypernative         MetaMask, Core,      Chainalysis / TRM    Evertas, Coincover
 GoPlus, SlowMist  Blockaid ML         Guardian / Policy   Safe (Guard),        (traçage)            AIUC-1 (+ Beazley)
 DeFiHackLabs      GoPlus              Forta Firewall      Coinbase Agentic     Immunefi (bounty)    Munich Re aiSure
 OWASP GenAI       Darktrace (agents)  GoPlus AgentGuard   Wallets, Fireblocks  Auditeurs (post-     Auditeurs (KPMG,
 AIR (Enkrypt),    Red teaming        Coinbase limites     Rails : x402,        mortem)              Big 4), DORA
 AIID, arXiv       (Gray Swan, Lakera) statiques           Stripe, Visa TAP
          │                                    ▲
          └──── listes d'IoC ──────────────────┘   politiques écrites à la main par le client
                                   ▲
                      ICI : rien ne compile la veille en défense testée,
                      exécutable par un agent et accompagnée d'une preuve
```

### Détail par maillon

| Maillon | Acteurs réels | Ce qu'ils produisent | Format de sortie |
|---|---|---|---|
| **Veille** | **ScamSniffer** : listes de domaines, drainers et adresses (258 K+ entrées, vendeur), vérification auto puis humaine, export de blocklists aux partenaires. **Chainabuse (TRM Labs)** : signalements communautaires multi-chaînes, API Reports et « Get Report Screening ». **GoPlus** : API token, adresse, approval, simulation (34-40 M appels/jour, vendeur). **SlowMist** : bibliothèque d'adresses malveillantes (10 k$ à 25 k$/an). **DeFiHackLabs** (SunWeb3Sec) : centaines de reproductions d'exploits en Foundry rejouables sur un fork. **OWASP GenAI** : exploit round-ups trimestriels (Q1 2026) et Top 10 agentique. **AIR (Enkrypt AI)** : registre d'incidents d'agents mappé OWASP ASI et ATLAS. **AIID**. | Listes, rapports, reproductions | IoC (adresse, URL), scripts de test, fiches texte |
| **Détection** | **Forta** (bots communautaires, Avalanche couvert), **Hypernative** (monitoring 70+ chaînes, vendeur), **Blockaid** (modèle ML sur chaque transaction, 30+ chaînes, vendeur), **Darktrace** (comportement d'agents en entreprise), plateformes de red teaming (Gray Swan, Lakera, Mindgard) | Alertes | Score, alerte |
| **Décision** | **Blockaid** (simulation + verdict), **Hypernative Transaction Guard / Guardian** (politiques auto-approve / flag / block), **Forta Firewall** (score pré-séquenceur), **GoPlus AgentGuard** (politiques runtime d'agents), **Coinbase Agentic Wallets** (plafonds, KYT, OFAC) | Verdict par transaction | allow / warn / block |
| **Blocage** | **MetaMask** et **Core (Avalanche)** via Blockaid, **Safe** via Safe Shield + Guard Hypernative, **Fireblocks / Fordefi** via API, rails de paiement d'agents (Coinbase x402, Stripe ACP, Visa TAP, Mastercard Agent Pay, Skyfire, Payman, Catena) | Exécution du verdict | Alerte UI, Transaction Guard, refus de signature |
| **Réponse** | **SEAL 911**, Chainalysis / TRM (traçage), Immunefi, cabinets d'audit (post-mortems) | Gel, traçage, post-mortem | Rapport humain |
| **Preuve / assurance** | **Nexus Mutual** (13 000+ couvertures, 6,9 Md$ protégés, forum DAO), **Evertas**, **Coincover**, **AIUC** (standard AIUC-1 + assurance jusqu'à 50 M$, capacité Beazley, 40 M$ levés), **Munich Re aiSure** (garantie de performance d'un modèle sur métrique convenue) ; auditeurs (KPMG) pour DORA | Couverture, certification, opinion d'audit | Police, rapport de ~100 pages (AIUC-1), opinion |

---

## 2. Le maillon manquant, preuves à l'appui

Le trou est entre la **veille** (qui produit des listes) et la **décision** (qui applique des politiques écrites par le client). Personne ne fait le travail de **compilation + essai + preuve** pour des **agents IA qui paient**. Ce que chaque acteur dit lui-même :

| Acteur | Ce qu'il dit faire | Ce qu'il ne fait pas (d'après ses propres pages) |
|---|---|---|
| **Blockaid** (agents IA) | Simulation, risque token, validation d'adresses, outils LangChain / MCP / Eliza, intégration Bankr ; « private beta » | Sa page agents IA cite Freysa et dit que les garde-fous codés en dur ne suffisent pas, mais **ne propose ni défense contre l'injection, ni politiques, ni preuve, ni partage** (rien de tout ça n'est mentionné). La défense porte sur l'**adresse ou le contrat**, pas sur le **pourquoi** de la transaction. |
| **MetaMask / Core (via Blockaid)** | Alertes avant signature | MetaMask écrit que la fonction ne peut pas empêcher de signer une transaction qui ferait perdre des fonds : **alerte consultative**, l'humain clique. Un agent IA n'a pas d'humain pour lire l'alerte. |
| **Safe Shield** | Analyse avant transaction (Blockaid, Tenderly) | Safe indique que le moteur de scan **n'agit pas à la place de l'utilisateur** ; l'application passe par le Guard Hypernative, **activé sur demande**. |
| **Hypernative Transaction Guard / Guardian** | Politiques auto-approve / reject / review | Les politiques sont **définies par le client** (exemple : auto-approve < 10 000 $ vers liste blanche). Aucun mécanisme documenté qui transforme une attaque observée chez un client en politique testée chez les autres. Cible : multisigs et trésoreries humaines. |
| **Chainabuse** | API de criblage d'adresses et d'URL, seuil de confiance, block ou warn | Livre des **signalements**, pas des règles ; le partenaire décide seul de bloquer ou d'avertir. |
| **ScamSniffer / SlowMist / GoPlus (listes)** | Blocklists d'adresses et de domaines | Un attaquant change d'adresse en une seconde. Une injection de prompt qui fait payer un **fournisseur légitime avec un IBAN modifié** ou qui **fractionne** un paiement n'a pas d'IoC d'adresse. |
| **DeFiHackLabs** | Reproductions d'exploits rejouables | Ce sont des **tests d'attaque**, pas des défenses ; personne ne les convertit en garde-fous distribués. |
| **OWASP / AIR / AIID** | Taxonomies et fiches d'incident | Données descriptives, non exécutables. |
| **Coinbase Agentic Wallets / AgentKit** | Plafonds par session et par transaction, KYT, OFAC, clés en enclave | Règles **statiques** fixées par l'opérateur ; rien n'apprend des attaques (V3). |
| **GoPlus AgentGuard** | Protection runtime d'agents, scan de skills / MCP / injections (200+ agents protégés, vendeur) | Le plus proche. Mais boîte noire propriétaire, **pas de preuve d'efficacité publique** (pas de taux de faux positifs publié par règle), pas d'ancrage vérifiable. |
| **Nexus Mutual** | Couverture smart contract, custody, depeg | Son CEO dit que les agents IA sont sa priorité de long terme, mais **aucun produit agent** annoncé : il lui manque une **donnée de risque mesurable** pour tarifer. |
| **AIUC-1 / Munich Re aiSure** | Certification par audit (5 000+ simulations adverses, vendeur) ; garantie sur une métrique convenue | Audit **ponctuel** (4 à 8 semaines). Munich Re tarifie sur la **stabilité d'une métrique** : il leur faut une **mesure continue**, que personne ne produit pour les agents qui paient. |

**Conclusion** : la veille dit « cette adresse est mauvaise » et la décision dit « bloque ce que le client a écrit ». Il manque l'étape qui dit : **« voici une règle sur l'action financière, prouvée à 95 % de blocage sur les variantes et 0 faux positif sur la paie légitime, signée, versionnée, révocable, prête à brancher sur votre agent »**. C'est notre maillon. Et sa sortie (la preuve mesurée en continu) est exactement l'**entrée** dont les assureurs ont besoin.

---

## 3. Partenaires concrets

### 3.1 En amont : sources de veille (on consomme, on cite, on reverse)

| Partenaire | Ce qu'on prend | Pourquoi ils ont intérêt | Comment |
|---|---|---|---|
| **Chainabuse (TRM Labs)** | Signalements d'arnaques (adresses, URL, type d'arnaque) comme « antigènes » | Leurs signalements deviennent **exécutables** chez des agents, et on leur renvoie de nouveaux signalements vérifiés (attaques bloquées). TRM vend du criblage : un nouveau canal agents IA | API Reports v0 (lecture + POST Report) |
| **ScamSniffer** | Blocklists drainers et domaines | Diffusion vers une nouvelle catégorie de clients (agents) | API sur clé (email), export de blocklists partenaires ; base open source pour le prototype |
| **GoPlus / SlowMist** | Risque token et adresse, approvals | Idem ; GoPlus vise déjà les agents (complémentaire : eux l'IoC, nous la règle comportementale prouvée) | API REST |
| **DeFiHackLabs** | Exploits reproductibles en Foundry = corpus d'attaque pour le banc d'essai DeFi | Leurs reproductions gagnent une utilité défensive ; attribution | Repo GitHub, `forge test` sur fork |
| **OWASP GenAI, AIR (Enkrypt), AIID, arXiv** (AgentDojo, InjecAgent) | Incidents et scénarios d'agents mappés ASI / ATLAS | Visibilité, « de la taxonomie à la défense » | Lecture, citation, contribution de fiches |
| **Forta** | Alertes de bots (Avalanche couvert) comme déclencheurs | Un consommateur de plus pour les bots (modèle d'abonnement aux alertes) | SDK JS/TS/Python, abonnement aux alertes |

### 3.2 En aval : distribution (on livre le vaccin là où l'agent agit déjà)

Principe : **un seul objet** (vaccin = politique JSON signée + certificat d'essai), **plusieurs adaptateurs**.

| Canal | Pourquoi ils ont intérêt | Comment | Statut |
|---|---|---|---|
| **Coinbase AgentKit** | Ses garde-fous sont statiques ; un fournisseur de politiques vivantes réduit le risque de réputation sans charge pour Coinbase | **ActionProvider** wrapper (sous-classe d'`ActionProvider`) qui interpose `check()` avant chaque transfert ; des wrappers tiers existent déjà (Sentinel) | AgentKit vise « tout réseau EVM » mais le wallet CDP par défaut ne liste pas Avalanche : passer par un wallet provider viem sur Fuji (hypothèse à tester) |
| **ElizaOS / LangChain / MCP** | Écosystème d'agents crypto où les plugins de garde-fous pullulent (AESP, AgentShield, ScoutScore, GoPlus) mais sans preuve | Plugin Eliza, outil LangChain, **serveur MCP** `antibody.check_payment` | Le plus rapide à démontrer |
| **Avalanche Core wallet** | Core intègre déjà Blockaid (juin 2024) pour les humains ; les agents sont l'étape suivante, et Ava Labs veut des usages sur la C-Chain | Flux de politiques consommé par le module de sécurité, ou via Blockaid (partenariat flux) | Hypothèse : discussion avec Team1 au hackathon |
| **Safe (Transaction Guard) / Hypernative** | Hypernative applique des politiques écrites par le client ; nos vaccins sont des **politiques prêtes à l'emploi, prouvées** à importer | Export du vaccin dans le format de politique Hypernative (montant, contrepartie, liste blanche), ou `Guard` Safe direct pour notre `GuardedVault` | Format d'export à prototyper |
| **Blockaid** | Sa page agents ne couvre ni politiques ni preuve ; nos vaccins comportementaux complètent son verdict d'adresse | Licence de flux (modèle « Blockaid fournit MetaMask ») | Partenaire **ou** concurrent : à dire franchement |
| **Rails de paiement d'agents** : x402 (PayAI sur Avalanche), Skyfire, Payman, Catena | Ils contrôlent *qui* et *combien*, pas *pourquoi* ; nos vaccins s'ajoutent au moteur de politiques | Hook avant facilitateur x402, ou politique importée | Hypothèse |
| **Néobanques / fintechs UE sous DORA** (clients finaux) | DORA art. 24-25 (tests), art. 5 et 28 (responsabilité) : il leur faut des tests documentés et une piste d'audit | SDK + passerelle (même code en arène et en prod), rapport de preuves | Cible commerciale principale |

### 3.3 Acheteurs de la preuve

| Acheteur | Ce qu'il achète | Pourquoi | Comment |
|---|---|---|---|
| **AIUC (AIUC-1) et son porteur de risque (Beazley)** | Preuve **continue** entre deux audits (taux de blocage, faux positifs, vaccins actifs) | AIUC-1 est un audit ponctuel ; une mesure continue réduit l'incertitude de souscription | Export du « passeport immunitaire » mappé sur les contrôles AIUC-1 sécurité (injection de prompt) |
| **Munich Re aiSure** (et iTOO) | Série temporelle d'une métrique convenue (ex. taux de paiements frauduleux bloqués) | Leur prime dépend de la **stabilité de la métrique** ; on la produit et on l'horodate | Attestations on-chain + corpus rejouable |
| **Nexus Mutual** | Donnée de risque pour un futur produit de couverture d'agents | Le CEO présente les agents comme priorité, aucun produit annoncé : il faut un signal tarifable | Cover Router API côté achat ; côté souscription, une proposition au forum DAO (Product & Risk). Lecture on-chain du `VaccineRegistry` |
| **Evertas / Coincover** | Contrôles de sécurité vérifiables pour des wallets gérés par agents | Rien de publié sur l'assurance des wallets d'agents : terrain vierge | Questionnaire de souscription alimenté par le passeport |
| **Auditeurs (KPMG, Big 4)** et superviseurs | Dossier de preuves DORA (tests, incidents, mesures correctives) | Preuve **rejouable** et horodatée, au lieu de captures d'écran | Rapport + vérification on-chain ; on **prépare** les TLPT sans les remplacer |

---

## 4. Modèles analogues et leçons pour notre modèle économique

| Modèle | Ce qui a marché | Leçon pour Antibody |
|---|---|---|
| **VirusTotal** (Hispasec 2004, Google) | Gratuit pour l'usage non commercial, chaque soumission enrichit le corpus ; payant (Intelligence, Hunting, API privée) sur devis ; l'offre entreprise est passée chez Google Threat Intelligence (oct. 2025) | **Le gratuit alimente le corpus.** Vérification d'un vaccin et soumission d'attaques gratuites ; flux qualifié, API privée et rapports payants |
| **SigmaHQ + SOC Prime** | Format ouvert de règles convertible vers Splunk, Elastic, Sentinel ; licence DRL 1.1 sur les règles, MIT sur le code ; SOC Prime monétise par abonnement une marketplace construite sur ces règles (palier gratuit = règles SigmaHQ) | **Le format doit être ouvert et indépendant du fournisseur** (« le Sigma des paiements d'agents »), avec des adaptateurs AgentKit, Eliza, MCP et Safe. La valeur payante est dans la curation, l'essai et l'intégration |
| **CrowdStrike / Recorded Future (threat intel)** | Le renseignement vendu comme **module** d'une plateforme de détection, pas seul | Vendre le flux de vaccins comme **module** chez Blockaid, Hypernative ou un wallet, pas uniquement en direct |
| **Blockaid → MetaMask, Core, Safe, OpenSea** | B2B2C : un moteur invisible branché **par défaut** dans les wallets ; ~90 % des grands wallets (source tierce) ; 82 M$ levés | **La distribution par défaut gagne.** Viser l'intégration par défaut dans un SDK d'agents plutôt que la vente à chaque agent |
| **Forta** | Bots communautaires, abonnements aux alertes, puis Firewall (blocage pré-séquenceur) | Une communauté de contributeurs de règles peut être rémunérée ; mais le **blocage** est ce qui se vend |
| **AIUC-1** | Standard + audit + assurance : la certification ouvre l'assurance, qui ouvre la vente aux entreprises | **La preuve est un produit.** Le passeport immunitaire est notre équivalent continu |
| **Munich Re aiSure** | Garantie de performance sur une métrique convenue (ex. 98 % de fraudes détectées) | Publier nos métriques **par vaccin** les rend assurables |

**Modèle économique déduit (hypothèse)** :
1. **Gratuit / ouvert** : format de vaccin, vérificateur de preuves, registre public sur Avalanche, soumission d'attaques.
2. **Abonnement fintech / éditeur d'agents** : flux de vaccins prouvés + passerelle + arène privée (500 à 2 000 €/agent/mois, V_SYNTHESE).
3. **Licence de flux B2B2C** : wallets, SDK d'agents et moteurs de décision (Blockaid, Hypernative, Core) qui redistribuent.
4. **Preuve pour tiers** : rapport DORA pour l'auditeur, données de souscription pour l'assureur (par agent certifié ou part de prime).
5. **Reversement aux sources** : part des revenus ou attribution pour les contributeurs dont l'attaque a produit un vaccin adopté (logique Immunity / Forta, sans token obligatoire).

---

## 5. Slide « Écosystème » (prête à copier)

**Titre** : On ne remplace personne. On transforme leur veille en immunité prouvée.

```
   SOURCES (ils savent)              ANTIBODY (on prouve)                 DISTRIBUTION (ils protègent)
 ┌──────────────────────┐      ┌────────────────────────────────┐      ┌───────────────────────────┐
 │ Chainabuse · TRM     │      │ 1. Compile : veille → règle sur │      │ Agents : Coinbase AgentKit │
 │ ScamSniffer · GoPlus │ ───▶ │    l'ACTION (montant, contre-   │ ───▶ │ ElizaOS · LangChain · MCP  │
 │ DeFiHackLabs         │      │    partie, vélocité, provenance)│      │ Wallets : Core · Safe Guard│
 │ OWASP ASI · AIR      │      │ 2. Essai : variantes bloquées + │      │ Rails : x402 (Avalanche)   │
 │ Forta (alertes)      │      │    0 faux positif sur le légitime│     │ Néobanques UE (DORA)       │
 └──────────────────────┘      │ 3. Preuve ancrée sur Avalanche  │      └───────────────────────────┘
                               │ 4. Rappel des vaccins obsolètes │
                               └───────────────┬────────────────┘
                                               ▼
                                 ACHETEURS DE LA PREUVE
                         Assureurs : AIUC-1 · Munich Re aiSure · Nexus Mutual
                         Auditeurs : dossier DORA rejouable (KPMG)
```

**Bandeau bas « Qui paie »** : fintechs et éditeurs d'agents (abonnement) · wallets et SDK (licence de flux) · assureurs et auditeurs (preuve). Gratuit : format ouvert, vérification, signalements.

**Phrase orale (10 s)** : « Blockaid dit à MetaMask qu'une adresse est dangereuse. Hypernative applique les règles que vous écrivez. Personne ne transforme une attaque d'hier en règle testée, prouvée et branchée demain sur tous les agents qui paient. C'est ce qu'on fait, sur Avalanche. »

**Mapping à rappeler sous la slide** : NIST CSF 2.0 ID.IM, DE.AE, RS.MI · OWASP ASI01, ASI02, ASI06 · ATLAS AML.T0051 · D3FEND (contre-mesures de filtrage et de politique de transaction, ID à vérifier).

---

## Points à vérifier avant le pitch
- Support d'Avalanche dans AgentKit (config réseau du repo `coinbase/agentkit`) : non confirmé.
- Forta Firewall sur Avalanche : non confirmé (seuls les bots sont documentés).
- Partenariat Hypernative et Avalanche : non trouvé.
- Format exact d'import de politiques Hypernative : non public.
- Chiffres vendeurs (Blockaid, GoPlus, ScamSniffer, AIUC) à présenter comme tels.
- Blockaid est à la fois partenaire potentiel et concurrent (offre agents en beta privée) : l'assumer à l'oral.

## Sources

**Veille**
- ScamSniffer : https://scamsniffer.io/ · https://scamsniffer.notion.site/Scam-Sniffer-API-9d55d9056d094c27899768491d5d1fad · https://www.alchemy.com/dapps/scamsniffer
- Chainabuse / TRM : https://docs.trmlabs.com/guides/chainabuse/protecting-users · https://docs.trmlabs.com/guides/chainabuse/law-enforcement-partners · https://apis.apievangelist.com/store/trm-labs-reports-api/ · https://www.trmlabs.com/resources/blog/announcing-the-launch-of-chainabuse-the-multi-chain-scam-reporting-tool-that-empowers-crypto-users-against-fraud
- SlowMist : https://aml.slowmist.com/malicious-address-library.html · Tatum : https://docs.tatum.io/reference/malicious-address
- GoPlus : https://whitepaper.gopluslabs.io/goplus-network/resources/api-and-sdk-integration-guide · https://www.coindesk.com/research/goplus-security-h2-2025 · https://blog.gopluslabs.io/2025/01/04/financing/GoPlus%20Security%20Plugin%20Empowering%20Eliza%20AI%20Agents%20with%20Security%20Intelligence/
- DeFiHackLabs : https://gittrend.io/repo/SunWeb3Sec/DeFiHackLabs · https://starlog.is/articles/ai-dev-tools/sunweb3sec-defihacklabs · https://xrex.io/blog/?p=2340
- OWASP GenAI round-up Q1 2026 : https://verifywise.ai/ai-governance-library/agentic-risks/owasp-genai-exploit-roundup-q1-2026 · https://securityboulevard.com/2025/12/owasp-project-publishes-list-of-top-ten-ai-agent-threats/
- AIR (Enkrypt AI) : https://air.enkryptai.com/about/ · AIID : https://incidentdatabase.ai/cite/1469

**Détection / décision / blocage**
- Blockaid : https://blockaid.io/blog/how-to-build-smarter-safer-onchain-ai-agents-with-blockaid · https://blockaid.io/blog/blockaid-expands-protection-to-the-bankr-experience · https://blockaid.io/ai-exploit-detection · https://www.securityweek.com/blockaid-raises-50-million-to-secure-blockchain-applications/amp/
- MetaMask x Blockaid : https://support.metamask.io/stay-safe/safety-in-web3/using-transaction-security-providers-to-protect-yourself-from-scams · https://theblock.co/post/278156/metamask-blockaid-security-alerts · https://forkast.news/metamask-boosts-security-with-blockaids-privacy-module/
- Core x Blockaid : https://cointelegraph.com/news/avalanche-core-wallet-blockaid-security-integration · https://blockaid.io/blog/blockaid-bolsters-security-on-avalanche-with-core-integration
- Hypernative : https://www.hypernative.io/products/hypernative-guardian · https://www.hypernative.io/blog/safe-and-hypernative-partner-to-bring-enterprise-grade-security-to-multisig · https://chainstack.com/hypernative-mitigating-web3-risks-chainstack-infrastructure/
- Safe Shield : https://help.safe.global/articles/7610775969-understanding-safe-shield-guardian-by-hypernative · https://help.safe.global/articles/6434169802-understanding-safe-shield-copilot · https://www.safe.global/blog/safe-partners-with-hypernative-to-launch-enterprise-security-integration
- Forta : https://docs.forta.network/en/0.1/network-overview/ · https://docs.forta.network/en/latest/getting-started/
- Coinbase AgentKit : https://docs.cdp.coinbase.com/agent-kit/core-concepts/agents-actions · https://docs.cdp.coinbase.com/agentkit/docs/FAQ · https://huggingface.co/datasets/sentinelseed/alignment-seeds/blob/main/integrations/coinbase/agentkit/__init__.py
- Plugins Eliza : https://socket.dev/npm/package/@yault/elizaos-plugin-aesp · https://socket.dev/npm/package/@eigenart/agentshield · https://socket.dev/npm/package/@scoutscore/plugin-eliza

**Assurance / preuve**
- Nexus Mutual : https://nexusmutual.io/blog/nexus-mutual-team-talks-hugh · https://forum.nexusmutual.io/t/rfc-dao-teams-budget-request-proposal-august-2026-to-july-2027/1841 · https://providers.apievangelist.com/providers/nexus-mutual/
- AIUC-1 : https://runtimewire.com/article/aiuc-raises-40m-ai-agent-certification-insurance · https://mindgard.ai/blog/aiuc-1-explained · https://elevenlabs.io/blog/aiuc-announcement · https://fourweekmba.com/ai-aiuc-ai-agent-audit-certification-insurance/
- Munich Re aiSure : https://www.munichre.com/en/solutions/for-industry-clients/insure-ai/faq.item-d43dc5cf1cd9ded89ae685f224086976.html · https://www.cover.co.za/news/itoo-special-risks-launches-africas-first-ai-performance-insurance-in-partnership-with-munich-re · https://www.moonstone.co.za/when-ai-becomes-the-risk-who-will-insure-it/
- Evertas / Coincover : https://www.spark.money/tools/crypto-insurance-provider-comparison

**Modèles analogues**
- VirusTotal : https://docs.virustotal.com/docs · https://blog.virustotal.com/2025/10/simpler-access-for-stronger-virustotal.html
- SigmaHQ / SOC Prime : https://github.com/sigmahq/sigma · https://www.noze.it/en/insights/sigma-detection-rules/ · https://us.fitgap.com/products/soc-prime-platform · https://socprime.com/why-socprime/
- Avalanche Retro9000 : https://www.avax.network/about/blog/retro9000-everything-you-need-to-know · https://nansen.ai/post/avalanche-q1-2026-report

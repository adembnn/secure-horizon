# Track 1, piste 4 : détection et réponse aux incidents DeFi + DORA

> Recherche du 2026-10-10 pour Secure Horizons (ESSEC). Équipe de 2 personnes (Adem tech, Titouan business), environ 24 h de dev, AWS Bedrock (Claude), Hardhat déjà configuré pour Fuji (`blockchain/hardhat.config.js`, chainId 43113, aucun contrat déployé pour l'instant).
> Je pars des acquis de `02_track1_finance.md`, `F3_frontiere_finance.md` et `00_DOSSIER_FRONTIERE.md` sans les répéter. Ce document va plus loin sur la piste 4.
> Légende : **[V]** = vérifié sur la source citée. **[Vendeur]** = affirmation commerciale. **[ÀV]** = à vérifier avant de le mettre sur une slide. **[Interp.]** = notre interprétation juridique, à faire valider (par KPMG, idéalement pendant le mentorat).

---

## 0. TL;DR

1. **La détection on-chain est un marché mûr** (Hypernative, Hexagate/Chainalysis, BlockSec Phalcon, Forta, Cyvers, Venn, Phylax). Le dernier cas d'école date de mai 2026 : Hypernative a repéré le contrat d'attaque contre Parallel **au moment de son déploiement** et a mis le protocole en pause « en quelques blocs », sans aucune validation humaine. **Refaire « un détecteur + une pause » ne différencie pas.**
2. **Le chaînon que personne n'outille relie l'incident on-chain à l'obligation DORA**. Concrètement, il faut appliquer les critères du RTS 2024/1772, remplir les champs de l'ITS 2025/302 et tenir les délais 4 h / 24 h / 72 h / 1 mois. Les ESAs ont publié leurs **instructions opérationnelles le 16 septembre 2026** (champs 2.5, 2.6, 2.8 « origine tiers », 4.12…). Elles ont moins d'un mois : c'est une source fraîche et précise qu'on peut citer devant KPMG.
3. **Deuxième trou : les dépendances tierces cachées** (RPC, oracles, relayers, signataires, KMS). Elles ont causé **plus de 630 M$ de pertes sur les 7 premiers mois de 2026** (KelpDAO avec ses RPC empoisonnés, Ostium et Bonzo avec leurs oracles). Le champ **2.8 de l'ITS 2025/302** et le **registre d'informations** (ITS 2024/2956) imposent justement de les connaître.
4. **Notre angle « smart » : le leurre on-chain.** Une fausse vulnérabilité que personne de légitime n'appelle donne une détection **sans faux positif par construction**, et elle se déclenche **avant l'exploit** (dès le déploiement du contrat d'attaque). C'est particulièrement pertinent contre les agents IA exploiteurs : SCONE-bench d'Anthropic montre que leurs revenus d'exploit doublent tous les 1,3 mois.
5. **Recommandation : « HoneyVault + DORA Autopilot »**, avec une version légère du module Dependency X-ray. Sur la grille, ça donne **87/100**. Détail en §5.

---

## 1. État de l'art

### 1.1 Monitoring on-chain et réponse automatisée

| Acteur | Mécanisme | Ce qu'il prouve (sources) | Limites pour nous |
|---|---|---|---|
| **Hypernative** | Détection pré-exploit (déploiement de contrat d'attaque, accumulation anormale, changement de signataires), avec pause automatique pilotée par un keeper. | **Parallel (7 mai 2026)** : contrat d'attaque repéré au déploiement et pause cross-chain « en quelques secondes / quelques blocs ». Le rôle de pause est donné **directement** à une adresse contrôlée par Hypernative, sans passer par un multisig, pour gagner des heures. Seuils par paliers (légère déviation = alerte, déviation grave = pause). Les watchlists incluent **Avalanche** [V]. **Accountable (mars 2026)** : PauseModule branché sur un Safe qui met tous les vaults en pause en une seule transaction [V]. Taux de détection de 99,8 % et faux positifs < 0,001 % [Vendeur]. | Fermé et cher. **Aucune sortie réglementaire** : pas de classification DORA, pas de rapport. |
| **Hexagate → Chainalysis** (rachat annoncé en décembre 2024) | Machine learning pré-exploit, réponse automatisée. Clients : Coinbase, Uniswap. | « >98 % des hacks connus détectés avant » [Vendeur]. Chainalysis passe de l'enquête à la prévention [V]. | Intégré dans une suite d'enquête, avec des licences chères. |
| **BlockSec Phalcon** | Scan du mempool et des transactions, avec 3 niveaux de risque (Attack, Suspicious, Regular). Règles déclencheur → action : **pause automatique ou front-running de sauvetage** par enchère de gas. | >20 attaques bloquées, >20 M$ sauvés [Vendeur]. BlockSec admet avoir vu beaucoup d'autres attaques **sans pouvoir agir** faute de contact avec l'équipe du protocole et à cause du **risque juridique** [V]. | Le front-running de sauvetage est juridiquement gris et ne fonctionne pas avec des relais privés. Sur invitation. |
| **Forta** (Attack Detector 2.0, Firewall/FORTRESS) | Bots communautaires et ML. Le Firewall simule la transaction et lui donne un score de risque de 0 à 1 **avant exécution**, au niveau du rollup. | 75 % des attaques détectées, dont 42 % avant le vol (octobre 2023). 83 % des protocoles attaqués n'avaient eu **aucun faux positif** sur les 60 jours précédents [Vendeur]. Ne couvre pas la compromission de clés [V]. | Dépend de l'adoption par les rollups. Le Firewall n'est pas présent sur le C-Chain d'Avalanche [ÀV]. |
| **OpenZeppelin Defender** | Monitor, Relayer, Actions. | **Service hébergé arrêté le 1er juillet 2026**. Restent Monitor et Relayer **open source, auto-hébergés** (Docker), configurables sur **n'importe quelle chaîne EVM** [V]. | Pour nous, c'est une brique gratuite et utilisable sur Fuji, pas un concurrent. Les clés KMS ne sont pas exportables, donc une migration impose de nouvelles adresses [ÀV, source concurrente]. |
| **Tenderly** | Alerts (événements, appels, soldes) et Web3 Actions en TypeScript déclenchées par une alerte, avec 5 tentatives en cas d'échec [V]. | Le pattern « alerte → action on-chain » est standard. | Monitor réservé aux plans payants [V]. |
| **Cyvers** | Anomalies par ML, alerte et mitigation en temps réel. Cible CASP et custodians. | 99,9 % de précision [Vendeur, non vérifié]. | Fermé. |
| **Venn Network (Ironblocks)** | Réseau d'opérateurs qui filtre les transactions **avant** inclusion, via un RPC protégé, en 100 à 200 ms [Vendeur]. | Le modèle « pare-feu Web2 » adapté à la blockchain. | Peu d'informations 2025-2026. Il faut que les utilisateurs passent par le RPC protégé. |
| **Phylax Credible Layer** | **Assertions** écrites en Solidity (déclencheurs sur un appel de fonction, en fin de transaction, sur un changement de solde ERC-20, sur des flux cumulés entrants ou sortants), exécutées dans un PhEVM par un **sidecar du séquenceur** ou par le **block builder**. Une transaction qui viole une assertion **n'est pas incluse**. | **Linea** l'a intégré (5 applications au lancement) [V, date à confirmer]. Proposition Flashbots « Credible Blocks » [V]. | Il faut contrôler le séquenceur ou le builder. **Impossible sur le C-Chain public d'Avalanche**, mais possible sur une **L1 Avalanche souveraine** (piste de feuille de route pour Team1). |
| **ERC-7265** (circuit breaker) | Coupe-circuit sur les **sorties de tokens** au-delà d'un pourcentage par fenêtre. Au choix : retour arrière ou règlement différé. États *Operational*, *Rate Limited*, *Grace Period* [V]. | Proposé en juillet 2023. | Statut final inconnu, probablement toujours en brouillon [ÀV]. C'est un **pattern** qu'on peut réimplémenter en 60 lignes. |
| **SEAL 911 / Safe Harbor** | Accord qui pré-autorise des whitehats à rescuer des fonds vers une adresse de récupération, avec prime et décharge juridique [V]. | Adopté par Uniswap Foundation, Balancer, Pendle, zkSync, etc. [V, liste non datée]. | C'est la réponse juridique au problème du front-running de sauvetage (cf. BlockSec). |

### 1.2 Invariants, tests et vérification
- **Chimera / Recon** : on écrit une propriété une fois et on la fait tourner sous Echidna, Medusa, Foundry, Halmos et Kontrol. Ça génère aussi un reproducteur Foundry quand une propriété casse [V]. Pour nous : **les mêmes invariants servent en test hors ligne et en monitoring à l'exécution**. C'est un argument d'ingénierie qu'on peut avancer.
- **Certora** (vérification formelle, Prover) : référence pour les invariants, mais non vérifiée dans cette recherche [ÀV].
- **Phylax** (voir plus haut) applique des invariants **au moment de l'inclusion d'un bloc**. Leur thèse : un hack, c'est un « état interdit » que le protocole peut déclarer.

### 1.3 Recherche académique 2024-2026 (détection et IA)
| Travail | Idée | Chiffres |
|---|---|---|
| **Skyeye** (ASE 2024) | Détecter les **contrats adverses dès leur déploiement**, avant la transaction d'attaque, puis localiser la victime. | 174 contrats adverses, 159 incidents, ~1,36 Md$ [V]. |
| **BlockWatchdog** (ICSE 2024) | Repérer le contrat attaquant (réentrance). | Un cas : contrat déployé ~30 min avant l'attaque, identifié en **64 s** [V]. |
| **LookAhead** (2024) | Contrats adverses, parce que **56,3 % de 142 attaques passent par des mempools privés** [V]. | Conséquence : la surveillance du mempool seule ne suffit pas. |
| **FlashGuard** (2025) | Surveille le mempool contre les flash loans « non-prix » et perturbe l'attaque en modifiant l'état de la victime via un relais privé [V]. | |
| **Alhaidari et al.** (arXiv 2510.16024) | Inférence ML **dans le contrat**, sur 298 exploits de 2020 à 2025. | >97 % de précision, F1 de 82 % [V]. |
| **DeFiScope** (arXiv 2502.11521) | LLM appliqué à la manipulation de prix. | Rappel 80 %, précision 96 %, zéro fausse alerte sur du trafic bénin [V]. |
| **GenDetect** (arXiv 2604.26094, avril 2026) | Détection réactive des **copycats**. | **>69 % des attaques DeFi ressemblent fortement à un incident antérieur**, souvent en quelques heures ou quelques jours [V]. |
| **SCONE-bench** (Anthropic, déc. 2025) | Agents exploiteurs sur 405 contrats réels (DefiHackLabs). | 207/405 exploités (51 %, 550 M$ simulés). Après la date de coupure : 4,6 M$. **Revenus d'exploit ×2 tous les 1,3 mois**. 1,22 $ par exécution d'agent. Coût par exploit −70 % en 4 générations de Claude. Deux zero-days trouvés sur 2 849 contrats récents [V]. |
| **A1**, **CyberChainBench** (541 incidents, 9 chaînes EVM), **POCEvaluator** (92 % de reproduction sur 120 incidents) | Agents d'exploit et benchmarks [V]. | |

**Ce que la recherche ne fait pas encore** : aucun papier de 2026 ne combine des invariants appris et appliqués en temps réel. Aucun ne produit de sortie réglementaire. Aucun n'utilise de **leurre on-chain contre les agents exploiteurs**.

### 1.4 Spécificités Avalanche (C-Chain et Fuji)
- **Bloc ~1 s** depuis janvier 2025 (avant : ~2 s). L'upgrade **Granite** (Fuji le 29/10/2025, mainnet le 19/11/2025) introduit un **délai de bloc minimum dynamique**, qui permet des blocs sous la seconde. **Finalité quasi immédiate** [V]. Conséquence : on mesure le MTTD **en blocs ET en secondes** à partir des timestamps réels. Il n'y a pas de réorganisation à gérer.
- **AvaCloud Webhooks** : événement `address_activity` avec `includeLogs` et `includeInternalTxs` (traces internes **uniquement sur le C-Chain**), signature HMAC, **Fuji 43113 supporté**. Aucune garantie de latence publiée [V]. Plan B : interroger nous-mêmes le RPC (`eth_getBlockByNumber` + reçus) ou utiliser OZ Monitor auto-hébergé.
- **ICM/Teleporter** : signature BLS agrégée par une **fraction du stake** des validateurs de la L1 source, **seuil fixé par la chaîne de destination**. Les relayers sont off-chain et doivent tourner pour que les messages passent. L'audit OZ relève qu'un message destiné à la chaîne B peut être traité par une chaîne C si le receveur ne vérifie pas la source [V]. → Ce sont des **dépendances tierces** typiques (relayer, validator set PoA).
- **Hypernative surveille déjà Avalanche** (cas Parallel) [V]. Selon Blockaid, Avalanche fait partie des 3 chaînes les plus attaquées en nombre au H1 2026 [acquis 02_track1].
- Le **RPC public Fuji** (`api.avax-test.network`) est opéré par Ava Labs. Le support de `debug_trace*` y est **incertain** [ÀV, à tester en H0]. C'est déjà une dépendance tierce de notre propre PoC, à afficher dans le Dependency X-ray (cohérence de la démo).

### 1.5 DORA : ce qui compte pour l'outil (textes primaires)

**Champ d'application** : DORA (Règl. 2022/2554) s'applique depuis le 17/01/2025, y compris aux **CASP agréés MiCA** et aux émetteurs d'ART. Pour un CASP, l'autorité destinataire est celle désignée sous MiCA (en France, l'**AMF**). Elle transmet ensuite à l'ESA concernée [V, sources secondaires]. **Le protocole DeFi n'est pas lui-même une entité DORA** [Interp.]. Notre défenseur est donc **l'entité régulée qui opère ou utilise le contrat** : par exemple un CASP qui propose un vault de rendement sur Avalanche, un émetteur de fonds tokenisé, ou une banque avec un dépôt tokenisé.

**Classification (RTS 2024/1772, texte EUR-Lex) [V]** :
- **Art. 8(1)** : un incident est **majeur** s'il touche des **services critiques (art. 6)** ET si l'une de ces deux conditions est remplie :
  - (a) le seuil de l'**art. 9(5)(b)** est atteint, c'est-à-dire un **accès non autorisé, malveillant et réussi** aux systèmes, susceptible d'entraîner des pertes de données ;
  - (b) **au moins 2** des autres seuils de l'art. 9 sont atteints.
- **Art. 6** (services critiques) : (a) services TIC qui supportent des fonctions critiques ou importantes ; (b) services financiers agréés ou supervisés ; (c) **tout accès malveillant non autorisé réussi**.
- **Art. 9, seuils** :
  - clients touchés > **10 %** ou > **100 000** ; contreparties > **30 %** ; transactions > **10 %** du nombre quotidien moyen ou > **10 %** de la valeur quotidienne moyenne ; clients « pertinents » touchés ;
  - **réputation** : couverture médiatique, plaintes répétées, non-conformité réglementaire, perte probable de clients ;
  - **durée > 24 h** ou **indisponibilité > 2 h** d'un service critique ;
  - **≥ 2 États membres** touchés ;
  - **perte de données** (disponibilité, authenticité, intégrité, confidentialité) ;
  - **impact économique > 100 000 €**, coûts directs et indirects, **sans déduire les sommes récupérées** (art. 7).
- **Art. 8(2), incidents récurrents** : au moins 2 incidents en **6 mois**, même cause apparente, qui atteignent ensemble les critères → ils comptent comme **un incident majeur**. L'évaluation se fait **chaque mois**.
- **Art. 10, cybermenace importante** (notification **volontaire**) : impact potentiel sur des fonctions critiques + **probabilité élevée** + capacité à atteindre les seuils d'un incident majeur [V]. → **Un exploit détecté et bloqué avant toute perte relève de ce cadre.**
- **[Interp.] L'effet pervers de la pause** : mettre en pause le service critique pendant plus de 2 h **remplit à lui seul le critère « indisponibilité »**. La réponse fait donc partie de la classification. Notre outil doit l'afficher (« pause prolongée au-delà de 2 h → +1 critère »). C'est un point fort à montrer à KPMG.
- **[Interp.] Exploit de smart contract = « accès non autorisé malveillant réussi » ?** Pour une clé admin compromise, oui sans ambiguïté. Pour un exploit de logique, c'est discutable. L'outil doit présenter **les deux raisonnements**, choisir par défaut l'option conservatrice (majeur), et laisser trancher l'humain.

**Délais (RTS 2025/301, art. 5) [V]** :
- **Notification initiale** : 4 h après la classification en majeur, et au plus tard **24 h après la prise de connaissance**.
- **Rapport intermédiaire** : 72 h après la notification initiale, puis une mise à jour à la reprise de l'activité normale.
- **Rapport final** : 1 mois après le dernier rapport intermédiaire.
- Les ESAs attendent **au moins un rapport intermédiaire par mois** jusqu'au final [V, instructions ESAs du 16/09/2026].

**Gabarit (ITS 2025/302) et instructions des ESAs du 16/09/2026 [V]** :
- Champs **1.3a/1.3b/2.1** (identifiants) : **inchangés** du début à la fin.
- **2.5** (critères) : doit toujours inclure « services critiques touchés ».
- **2.6** (géographie) : **sans le pays d'origine**.
- **2.8** (incident venant d'un **prestataire tiers**) : format standardisé `NOM LÉGAL;CODE;LEI|EUID;info`.
- **3.11 / 4.13 / 4.14** : montants **en milliers**.
- **3.15 / 3.16 / 3.17** : durée et indisponibilité, réelles ou estimées.
- **3.25** : menaces et techniques de l'acteur.
- **4.12** : seuil d'impact économique, obligatoire dans le rapport final si ce critère est retenu.
- Les autorités nationales transmettent aux ESAs **en anglais**.

**Tiers** : le **registre d'informations** (ITS 2024/2956, en vigueur depuis le 22/12/2024, format xBRL-CSV) a servi à désigner les **premiers CTPP le 18/11/2025**. La liste comprend notamment AWS EMEA, Google Cloud, Microsoft, Oracle, SAP et LSEG [V pour l'existence de la liste, ÀV pour les noms exacts]. Un nœud RPC hébergé chez AWS fait donc remonter une concentration sur un CTPP.

### 1.6 Incidents 2026 qui montrent le problème des tiers
- **KelpDAO** (avril, 292 M$) : RPC du DVN empoisonnés, nœuds sains mis hors service par DDoS, configuration 1-of-1.
- **Ostium** (juillet, 18 à 24 M$) : **clé de signataire d'oracle compromise**, rapports de prix datés dans le futur. « **Aucune vulnérabilité de smart contract** » (Blockaid).
- **Bonzo Lend** (juillet, 9 M$, Hedera) : oracle tiers compromis, prix gonflé d'environ ×10¹².
- Cumul « infrastructure tierce » : **plus de 630 M$ sur 7 mois** [V, sources secondaires].

---

## 2. Gaps (ce qu'aucun outil ne fait)

1. **On-chain → DORA, automatiquement.** Les outils de détection s'arrêtent à l'alerte et à la pause. Les outils DORA (GRC, ServiceNow, OneTrust…) partent d'un ticket saisi à la main. **Personne ne traduit un événement on-chain en critères du RTS 2024/1772, en champs ITS 2025/302 et en délais qui courent**, avec une preuve rattachée à chaque champ.
2. **L'effet de la réponse sur la classification** : pause → indisponibilité → critère art. 9(3)(b). Aucun outil ne fait cette boucle de rétroaction.
3. **La menace bloquée = notification volontaire art. 10.** Les cas « sauvés » (Parallel) ne produisent aucun artefact réglementaire. C'est pourtant de l'information utile au superviseur.
4. **Les dépendances cachées** : RPC, signataires d'oracle, relayers ICM, détenteurs de rôles, KMS, DNS du front. Elles n'apparaissent ni dans les audits ni dans le registre d'informations. **Aucun outil ne génère le champ 2.8 ni les lignes du registre à partir de l'état on-chain.** Et aucun ne vérifie que **les RPC disent la même chose** (la leçon KelpDAO).
5. **Une détection sans faux positif par construction.** Tous les outils sont probabilistes (des seuils et du ML), donc sujets aux faux positifs. Une **pause sur faux positif** est un incident en soi. Aucun outil commercial n'utilise de **leurre on-chain**.
6. **Les copycats** : selon GenDetect, 69 % des attaques ressemblent à une attaque antérieure. Personne ne **rejoue automatiquement l'exploit d'un autre protocole sur un fork de son propre contrat** pour se mettre en pause *avant* d'être visé.
7. **Avalanche** : pas d'assertions au niveau du séquenceur sur le C-Chain, pas de monitoring dédié ICM/L1 (déjà noté dans 02_track1).

---

## 3. Les 4 idées

Scénario de démo commun : un **vault de rendement** (« SH Vault ») déployé sur Fuji par un **CASP fictif agréé MiCA**. On y dépose de l'AVAX de test et un ERC-20 mock. Le vault a un oracle mock, des rôles (admin, guardian) et un coupe-circuit sur les sorties. Un script génère **du trafic normal simulé** (20 wallets, environ 1 000 transactions de dépôt et de retrait avec rafales et baleines) et **5 scénarios d'attaque**. Toutes les attaques visent **uniquement nos propres contrats**, comme l'exige l'éthique du Notion.

### Idée 1 : **HoneyVault**, une fausse vulnérabilité qui démasque l'attaquant avant l'exploit

- **Problème et défenseur** : *l'analyste « on-chain risk » ou le RSSI d'un CASP qui opère un vault sur Avalanche.* Les détecteurs probabilistes l'obligent à choisir entre manquer un exploit et mettre le service en pause sur un faux positif, ce qui est aussi un incident DORA (art. 9(3)(b)). Les agents IA exploiteurs (SCONE-bench, ×2 tous les 1,3 mois) cherchent **la vulnérabilité la moins chère**.
- **Mécanisme (la nouveauté)** : on plante dans le contrat une **« honey-vuln »**. C'est une fonction qui *ressemble* à un bug classique, par exemple `migrateLegacyBalance(address,uint256)` sans `onlyOwner` apparent, ou un `initialize()` qu'on semble pouvoir rappeler (OWASP SC01:2025, contrôle d'accès). Elle est absente de l'UI et de la documentation publique. **Aucun usage légitime ne l'appelle, donc toute interaction est hostile.** Trois fils de détection, du plus précoce au plus tardif :
  1. **Au déploiement (pré-exploit, à la Skyeye)** : à chaque création de contrat sur Fuji, on scanne le bytecode à la recherche de `PUSH4 <sélecteur leurre>` combiné à `PUSH20 <adresse du vault>`. Si on trouve les deux, c'est un contrat d'attaque préparé, et on met en pause **avant la première transaction d'attaque** (ATT&CK : *Resource Development*, T1587.004 développement d'exploits, T1608 mise en place de capacités).
  2. **Dans la transaction (quarantaine silencieuse)** : la fonction leurre **ne revert pas**. Elle bascule le vault en mode `quarantined`, enregistre `tx.origin` et l'appelant, puis verse un petit appât (par exemple 0,1 AVAX pris dans un pot séparé). En mode quarantaine, les fonctions de sortie **renvoient 0 sans transférer** au lieu de revert. La transaction réussit, donc **l'état de quarantaine persiste**. Et si le contrat attaquant revert de lui-même (contrôle de profit, flash loan non remboursé), l'attaque a échoué et rien n'est perdu.
  3. **Après coup (filet de sécurité)** : une transaction échouée vers une adresse inconnue qui interagit avec le vault, ou l'événement `Tripwire` → pause par le guardian dans le bloc suivant.
  
  Ces leurres s'ajoutent à **des invariants déterministes**, réutilisés depuis les propriétés Chimera :
  - `totalAssets ≥ Σ parts` ;
  - sorties ≤ X % du TVL par fenêtre de N blocs, à la manière d'ERC-7265 ;
  - écart de l'oracle mock < Y %.
  
  Ces invariants couvrent les attaques qui ne touchent pas le leurre. Le LLM (Claude via Bedrock) n'intervient **qu'après** la décision : il explique la trace, mappe sur ATT&CK et OWASP SC, et attribue la cause probable. **Il ne décide jamais de la pause.**
- **Démo de 3 min sur Fuji** :
  - (0:00) Tableau de bord, trafic normal qui défile, 0 alerte.
  - (0:30) « L'attaquant », un agent ou un script, déploie son contrat d'exploit → le bandeau rouge « contrat adverse ciblant SH Vault, sélecteur leurre trouvé dans le bytecode » apparaît au bloc N+1, et la pause est minée au bloc N+2, avec le lien Snowtrace.
  - (1:15) Variante : l'attaquant appelle directement → quarantaine. Il repart avec 0,1 AVAX au lieu de 100.
  - (1:45) Attaque n° 3, sans leurre (drain par vélocité) → l'invariant ERC-7265 la limite.
  - (2:15) Fiche DORA pré-remplie (idée 2) et métriques.
- **Métriques** :
  - MTTD en blocs et en secondes, du déploiement à l'alerte, puis de l'alerte au minage de la pause (cible : ≤ 2 blocs, ≤ 3 s) ;
  - **faux positifs du leurre : 0 sur ~1 000 transactions normales**, par construction, et on donne le dénominateur ;
  - faux positifs des invariants, mesurés sur le même jeu ;
  - **fonds sauvés = 1 − perdus/TVL** sur les 5 scénarios ;
  - couverture : quels scénarios déclenchent quel fil de détection, et la liste de **ce qu'on ne détecte pas** (attaquant qui lit notre source et évite le leurre, clé admin légitime volée qui agit « dans les règles » sous les seuils).
- **Mapping** :
  - NIST CSF : DE.CM-01, DE.AE-02, DE.AE-08, RS.MI-01 (confinement), RS.MA-03.
  - ATT&CK : T1587.004, T1608, T1190, T1657 (vol financier).
  - D3FEND : tactique *Deceive* (objet leurre) et *Isolate*.
  - OWASP SC Top 10 2025 : SC01, SC02, SC05, SC07.
- **Conformité** :
  - DORA art. 10 (détection précoce et mécanismes de détection d'activités anormales) et art. 11 (réponse et rétablissement) ;
  - RTS 2024/1772 art. 10 (le blocage pré-exploit permet une notification volontaire de cybermenace importante) ;
  - le rôle guardian ne peut **que** mettre en pause, et la reprise exige le multisig (séparation des pouvoirs, à mettre en face de DORA art. 5 sur la responsabilité de l'organe de direction).
- **Build en 24 h, réel ou mock** :
  - Réel : contrat Solidity (vault + leurre + quarantaine + ERC-7265 léger + Pausable/AccessControl d'OZ), environ 4 h. Scanner de bytecode et watcher par polling RPC Fuji en Python ou TypeScript, environ 4 h. Keeper guardian, environ 1 h. Scripts d'attaque et de trafic, environ 3 h. Explication Bedrock, environ 2 h.
  - Mock : aucun, sauf l'agent attaquant LLM, remplacé par un script pré-écrit (on assume).
- **Risques** :
  - « Sécurité par l'obscurité » : réponse, c'est **une couche en plus**, comme un honeytoken, et les invariants restent en place.
  - Un attaquant qui lit le source vérifié peut repérer le leurre : réponse, on varie les leurres et on ne vérifie que l'ABI publique [ÀV sur Snowtrace].
  - Les bots MEV généralistes qui copient des transactions déclenchent le leurre : ce sont aussi des acteurs hostiles, et c'est documenté.
  - Le pot d'appât est perdu : c'est voulu, coût négligeable.
  - Responsabilité juridique : pas de « piège » offensif, on ne fait que retenir nos propres fonds.
- **Note sur la grille** : Détection 9 · Réponse 8 · Faisabilité 8 · Conformité 7 · Pitch 9 → **0,3×9 + 0,2×8 + 0,2×8 + 0,15×7 + 0,15×9 = 8,30 → 83/100**

### Idée 2 : **DORA Autopilot**, de l'incident on-chain à la déclaration ITS 2025/302

- **Problème et défenseur** : *le responsable conformité ou risque TIC d'un CASP MiCA (et l'auditeur KPMG qui le contrôle).* En DeFi, l'exploit se joue en quelques minutes, et le compteur DORA démarre dès qu'on en prend connaissance (24 h au plus tard). La classification en début d'incident est le point qui coince, selon F3. Les instructions des ESAs du 16/09/2026 pointent des erreurs récurrentes de remplissage (2.5, 2.6, 2.8, montants).
- **Mécanisme (la nouveauté)** :
  1. Un **moteur de classification déterministe**, qui code les articles 6, 8, 9 et 10 du RTS 2024/1772 sous forme de règles versionnées. Chaque critère est alimenté par **une mesure on-chain prouvée** :
     - clients touchés = adresses distinctes qui ont un solde dans le vault au bloc de pause, rapportées au total des déposants ;
     - transactions touchées = retraits bloqués pendant la pause, rapportés à la moyenne quotidienne sur 7 jours ;
     - indisponibilité = horodatage du bloc de reprise moins celui du bloc de pause, avec un **compte à rebours vers les 2 h** ;
     - impact économique = fonds sortis × prix (sans déduire les récupérations, art. 7) + coûts saisis ;
     - géographie = juridiction des clients, tirée du **registre KYC simulé** du CASP (données synthétiques).
  2. Un **horloge réglementaire** : T_connaissance (bloc de détection), T_classification, puis échéances calculées (4 h, 24 h, 72 h, 1 mois, un rapport intermédiaire par mois). Plus le **suivi de récurrence art. 8(2)** : hash de la cause racine, fenêtre de 6 mois, réévaluation mensuelle.
  3. Le **pré-remplissage des champs ITS 2025/302** (1.3a, 2.1, 2.5, 2.6, 2.8, 3.11, 3.15 à 3.17, 3.25, 4.12) avec les règles des ESAs : montants en milliers, pays d'origine exclu de 2.6, format 2.8 avec point-virgule.
  4. Le **LLM rédige uniquement les champs en texte libre**. Chaque phrase **cite son artefact** (hash de transaction, bloc, événement). Un **« sceptique »** (second appel avec un prompt isolé) essaie de réfuter chaque affirmation à partir des preuves, et toute phrase sans preuve est retirée.
  5. Un **journal de preuves infalsifiable** : chaque version du rapport est hachée, et le hash est **ancré sur Fuji** (un événement `EvidenceAnchored`). L'auditeur peut ainsi vérifier que le rapport n'a pas été réécrit après coup.
  6. **Deux sorties** :
     - incident avec pertes → déclaration d'incident majeur ;
     - menace bloquée avant perte (idée 1) → **brouillon de notification volontaire de cybermenace importante (art. 10)**.
  7. La boucle de rétroaction pause → classification est affichée : « si la pause dure plus de 2 h, le critère indisponibilité est atteint ».
- **Démo de 3 min** : on part de l'exploit de l'idée 1 (ou d'un exploit qui réussit partiellement) → l'écran « Classification » montre les critères cochés ou non, chacun avec sa preuve cliquable et son article → le chronomètre 4 h / 24 h → le JSON et le PDF ITS pré-remplis → le hash ancré sur Snowtrace → le bouton « valider et soumettre », qui reste **humain**.
- **Métriques** :
  - temps entre l'alerte et le brouillon complet (cible < 60 s, contre des heures à la main) ;
  - % de champs obligatoires de la notification initiale remplis automatiquement ;
  - % d'affirmations du texte libre qui ont une preuve (cible 100 %) ;
  - exactitude de la classification sur une batterie de **12 cas synthétiques** construits avec la grille du RTS (et à faire valider par KPMG si possible).
- **Mapping** :
  - NIST CSF : RS.MA-02, RS.MA-03, RS.AN-03, RS.CO-02, RS.CO-03, DE.AE-04 (estimation de l'impact), GV.OC-03 (exigences légales).
  - DORA : art. 17 (processus de gestion des incidents), art. 18 (classification), art. 19 (notification), art. 19(2) (notification volontaire) ; RTS 2024/1772 ; RTS 2025/301 ; ITS 2025/302.
- **Build en 24 h** :
  - Réel : moteur de règles (Python, environ 4 h), horloge et récurrence (environ 2 h), gabarit JSON/PDF (environ 3 h), Bedrock rédacteur + sceptique (environ 3 h), ancrage on-chain (environ 1 h).
  - Mock : clients et KYC synthétiques, prix fixes, coûts indirects saisis à la main. **Le xBRL-CSV de soumission n'est pas produit** : on sort du JSON et du PDF, et c'est dit honnêtement.
- **Risques** :
  - Les interprétations juridiques (exploit = accès non autorisé ? DeFi = service critique ?) : réponse, l'outil **montre les deux raisonnements** et applique l'option conservatrice par défaut.
  - Effet « wow » plus faible si on le présente seul.
  - Le LLM qui invente un fait : neutralisé par le sceptique et l'obligation de preuve.
- **Note** : Détection 6 · Réponse 7 · Faisabilité 9 · Conformité 10 · Pitch 7 → **1,8 + 1,4 + 1,8 + 1,5 + 1,05 = 7,55 → 76/100** (seul) ; c'est **le multiplicateur de conformité** des idées 1, 3 et 4.

### Idée 3 : **Dependency X-ray**, la cartographie vivante des tiers cachés et le quorum de RPC

- **Problème et défenseur** : *le responsable « ICT third-party risk » d'un CASP, qui doit tenir le registre d'informations (ITS 2024/2956) et remplir le champ 2.8.* Le registre liste des contrats commerciaux, mais **le risque réel est dans des dépendances techniques invisibles** : signataires d'oracle (Ostium), RPC (KelpDAO), vérificateur 1-of-1, relayer ICM, KMS (Resolv), DNS du front (CoW Swap). Plus de 630 M$ de pertes en 2026.
- **Mécanisme (la nouveauté)** :
  1. **Découverte automatique depuis l'état on-chain** :
     - lecture des slots EIP-1967 (admin et implémentation du proxy) ;
     - événements `RoleGranted`/`RoleRevoked`, pour savoir qui détient quel rôle, si c'est une EOA ou un multisig, avec quel seuil Safe ;
     - adresses d'oracle (aggregator, `latestRoundData`, heartbeat) ;
     - registre Teleporter et relayers autorisés, seuil de stake côté destination, validator set PoA.
     
     On y ajoute un fichier de configuration off-chain : endpoints RPC, hébergeur du front, DNS, KMS.
  2. **Un graphe de dépendances** avec détection des **points uniques de défaillance** : rôle critique détenu par 1 seule EOA, multisig 1-of-1, un seul fournisseur d'oracle, un seul RPC, et une **concentration sur un CTPP désigné** (RPC → AWS).
  3. **Une surveillance continue des dépendances** :
     - **un quorum de RPC**, c'est-à-dire 3 endpoints Fuji interrogés à chaque bloc sur le hash du bloc, le solde du vault et le prix de l'oracle. Une divergence déclenche l'alerte « RPC empoisonné ou désynchronisé suspecté » (leçon KelpDAO) ;
     - **un oracle obsolète ou qui dévie** d'une seconde source ;
     - **des rapports d'oracle datés dans le futur** (leçon Ostium) ;
     - **un changement de détenteur de rôle ou de seuil de multisig**.
  4. **Les sorties DORA** :
     - lignes du registre d'informations (gabarits B_05 « prestataires TIC » et chaîne de sous-traitance, B_06 « fonctions », dont la numérotation est [ÀV] dans l'ITS) ;
     - **le champ 2.8 pré-rempli** au bon format quand l'incident vient d'un tiers.
- **Démo** :
  - (1) Scan du SH Vault → graphe : « Guardian = 1 EOA, oracle = 1 signataire, RPC = 1 fournisseur sur un CTPP ».
  - (2) On simule un RPC empoisonné (proxy local qui ment sur le prix de l'oracle) → divergence de quorum détectée en 1 bloc → pause.
  - (3) Le champ 2.8 et les lignes du registre sont générés.
- **Métriques** :
  - dépendances découvertes contre une vérité terrain construite à la main (rappel) ;
  - temps de détection d'une divergence RPC (en blocs) ;
  - faux positifs du quorum sur 1 h de trafic normal, puisque des RPC légèrement en retard produisent des écarts de ±1 bloc qu'il faut tolérer.
- **Mapping** :
  - NIST CSF : **GV.SC-04, GV.SC-07**, ID.AM-02, DE.CM-06 (activité des prestataires surveillée), DE.AE-02.
  - ATT&CK : T1195 (supply chain), T1565 (manipulation de données), T1498 (DoS, KelpDAO), T1078 (comptes valides, clé de signataire).
  - DORA : art. 28 (risque de tiers, registre art. 28(3)), art. 29 (concentration), art. 31 (CTPP) ; ITS 2024/2956 ; champ 2.8 de l'ITS 2025/302.
- **Build en 24 h** :
  - Réel : lecture des slots, rôles et oracle (environ 3 h), quorum RPC (environ 2 h), graphe D3 ou Mermaid (environ 3 h), export du registre en CSV (environ 2 h).
  - Mock : le RPC malveillant (proxy local), la configuration off-chain déclarative, et une partie d'ICM (pas de L1 de test, sauf s'il reste du temps avec Avalanche-CLI).
- **Risques** :
  - « Quel rapport avec un exploit en cours ? » : la détection est moins spectaculaire.
  - Le registre xBRL complet est hors de portée.
  - Le quorum ne détecte pas un empoisonnement qui touche **tous** nos endpoints.
- **Note** : Détection 7 · Réponse 6 · Faisabilité 7 · Conformité 9 · Pitch 7 → **2,1 + 1,2 + 1,4 + 1,35 + 1,05 = 7,10 → 71/100**

### Idée 4 : **Copycat Shield**, s'immuniser contre l'exploit d'un autre protocole avant d'être visé

- **Problème et défenseur** : *l'équipe sécurité d'un CASP ou d'un protocole qui a forké un code populaire.* Selon GenDetect, plus de 69 % des attaques DeFi copient une attaque antérieure **en quelques heures ou quelques jours**. Quand le protocole X se fait exploiter, tous ses forks ont une fenêtre de quelques heures. Aujourd'hui, ils suivent X/Twitter à la main.
- **Mécanisme (la nouveauté)** : on prend une alerte d'exploit externe (flux DefiHackLabs ou rekt, simulé pendant la démo) qui contient la transaction d'attaque. Puis :
  - (1) on extrait la trace et un **motif sémantique** de l'attaque : séquence d'appels, fonctions touchées, invariant violé ;
  - (2) on la **rejoue sur un fork Anvil de Fuji** contre NOTRE contrat. D'abord avec un adaptateur déterministe (on mappe les sélecteurs et les adresses), puis, en cas d'échec, avec un **agent Claude** dans l'esprit de SCONE-bench, utilisé **en défense sur notre propre fork seulement** et avec un budget plafonné ;
  - (3) si le rejeu réussit, on déclenche une **pause préventive** (ou une baisse du plafond ERC-7265), une **notification volontaire de cybermenace importante (art. 10)** via DORA Autopilot, et une proposition de correctif avec un test Foundry de non-régression ;
  - (4) si le rejeu échoue, on garde la preuve de non-exposition (utile à l'auditeur).
- **Démo** : on montre un « protocole Y » (un clone de notre vault déployé par nous) qui se fait exploiter sur Fuji → 40 s plus tard, Copycat Shield annonce « SH Vault vulnérable au même motif (rejeu réussi sur fork, 100 % du TVL exposé) » → pause préventive → brouillon art. 10. Ensuite, l'attaquant tente le même exploit sur le SH Vault et tombe sur un contrat en pause.
- **Métriques** :
  - temps entre l'alerte externe et le verdict d'exposition ;
  - taux de rejeux réussis sur un mini-jeu de 5 à 10 variantes ;
  - faux positifs (rejeu « réussi » qui n'est pas une vraie exposition) ;
  - coût en tokens Bedrock par analyse.
- **Mapping** :
  - NIST CSF : **ID.RA-01, ID.RA-02 (CTI)**, DE.AE-07 (CTI intégrée), RS.MI-01, ID.IM.
  - ATT&CK : T1190, T1657.
  - ATLAS : sans objet, car le LLM est un outil de défense. Il faut quand même un garde-fou OWASP ASI02 (mauvais usage d'outils) : bac à sable sur le fork, aucune clé réelle.
  - DORA : art. 13 (apprentissage et évolution), art. 45 (partage d'informations sur les cybermenaces), RTS 2024/1772 art. 10.
- **Build en 24 h** :
  - Réel : fork Anvil + rejeu déterministe (environ 5 h), clone et exploit (environ 3 h), pipeline de pause et de notification (réutilisé de l'idée 2).
  - Mock : le flux d'exploits externe. L'agent LLM d'adaptation est **risqué en live**, donc on le précalcule et on montre le replay.
- **Risques** :
  - La génération d'exploit par LLM est non déterministe et lente.
  - Question éthique, « vous générez des exploits » : réponse, uniquement sur notre propre fork, comme le recommande Anthropic.
  - Le rejeu peut échouer pour des raisons d'état (prix, liquidité), d'où des faux négatifs.
- **Note** : Détection 8 · Réponse 7 · Faisabilité 5 · Conformité 8 · Pitch 8 → **2,4 + 1,4 + 1,0 + 1,2 + 1,2 = 7,20 → 72/100**

---

## 4. Classement

| Rang | Idée | Dét. 30 | Rép. 20 | Faisa. 20 | Conf. 15 | Pitch 15 | **/100** |
|---|---|---|---|---|---|---|---|
| 1 | **HoneyVault** | 9 | 8 | 8 | 7 | 9 | **83** |
| 2 | **DORA Autopilot** (seul) | 6 | 7 | 9 | 10 | 7 | **76** |
| 3 | **Copycat Shield** | 8 | 7 | 5 | 8 | 8 | **72** |
| 4 | **Dependency X-ray** | 7 | 6 | 7 | 9 | 7 | **71** |
| ★ | **Combo recommandé** : HoneyVault + invariants + DORA Autopilot + X-ray léger (quorum RPC + champ 2.8) | 9 | 9 | 7 | 10 | 9 | **87,5** |

## 5. Recommandation : « Sentinelle Fuji » (nom de travail)

**Phrase pour le pitch** : *« Hypernative met votre protocole en pause. Nous, on le met en pause **sans faux positif**, et en moins d'une minute on vous donne la déclaration DORA que KPMG devra auditer. »*

**Pourquoi ce combo gagne la grille** :
- **Détection (30 %)** : le leurre donne 0 faux positif **démontrable**, et il détecte **avant l'exploit**, au déploiement. Les invariants ERC-7265 couvrent le reste. On montre honnêtement ce qu'on ne détecte pas.
- **Réponse (20 %)** : la réponse est graduée : quarantaine dans la transaction → pause par le guardian (rôle limité) → plafond de sortie → reprise par le multisig humain. Chaque étape est journalisée et réversible.
- **Faisabilité (20 %)** : tout tourne sur Fuji avec Hardhat (déjà en place), un polling RPC et Bedrock. Pas de dépendance à un outil payant.
- **Conformité (15 %)** : critères du RTS 2024/1772 article par article, champs ITS 2025/302 conformes aux instructions des ESAs du 16/09/2026, horloge 4 h / 24 h / 72 h / 1 mois, art. 10 pour les menaces bloquées, champ 2.8 sur les tiers, preuves ancrées on-chain.
- **Pitch (15 %)** : une démo en 3 actes (piège → pause → déclaration), avec des liens Snowtrace en direct, et un message calibré pour chaque juré (Team1 : outil open source natif Avalanche, éligible Retro9000 et Team1 Grants ; KPMG : DORA au champ près ; Kryptosphère : mécanique on-chain).

**Réponse à « si votre modèle se trompe, qui est responsable ? »** : le LLM ne décide rien. La pause vient de **règles déterministes** (leurre, invariants), validées à l'avance par la gouvernance du CASP. Le guardian ne peut que mettre en pause. La soumission DORA reste **humaine** (organe de direction, DORA art. 5). Toutes les décisions sont hachées et ancrées.

**Plan sur 24 h (Adem = tech, Titouan = business)** :
- **H0-H2** : tester le RPC Fuji (latence, `debug_trace*`, webhooks AvaCloud) ; wallets de test via `scripts/new-wallet.js` et le faucet. Titouan : persona du CASP, chiffres (Parallel, KelpDAO, Ostium, SCONE-bench), et rendez-vous avec le mentor KPMG pour valider les 2 interprétations.
- **H2-H7** : `SHVault.sol` (Pausable, AccessControl, leurre et quarantaine, plafond de sortie), plus `AttackDeployer` et les exploits ; déploiement sur Fuji ; renseigner `DEPLOYMENTS.md`.
- **H7-H11** : watcher (scan des créations et du bytecode, invariants, quorum de 3 RPC) et keeper guardian ; script de trafic normal (1 000 transactions) ; harnais de mesure (MTTD, faux positifs, fonds sauvés).
- **H11-H16** : moteur RTS 2024/1772, horloge, gabarit ITS 2025/302 en JSON/PDF ; Bedrock rédacteur + sceptique ; ancrage du hash.
- **H16-H20** : tableau de bord (timeline des blocs, alertes, graphe des dépendances, écran DORA).
- **H20-H22** : mesures finales, vidéo de secours, README, fiche de défense, **scan des secrets** (`.env` hors du repo : le jury vérifie).
- **H22-H24** : répétitions du pitch, Q&R.

**Ce qu'on coupe si on est en retard** : d'abord le graphe X-ray (on garde le quorum RPC et le champ 2.8), puis le sceptique (on garde l'obligation de preuve), puis l'ancrage on-chain.

**Questions pièges à préparer** :
1. « Une pause, c'est de la centralisation. » → Rôle limité à la pause, reprise par multisig, durée maximale codée en dur, ce qui est aussi le compromis de Parallel et d'Accountable.
2. « L'attaquant lira votre source. » → Leurres multiples et rotatifs, ABI non vérifiée, et le leurre n'est qu'une couche.
3. « Mempool privé ? » → On ne dépend pas du mempool : détection au déploiement et dans la transaction (LookAhead : 56 % des attaques passent en privé).
4. « Un protocole DeFi n'est pas soumis à DORA. » → Exact, c'est le CASP qui l'opère ou l'utilise qui l'est.
5. « Votre classification est-elle juste ? » → Les 12 cas de test et l'article cité pour chaque critère.

---

## Sources

**Détection et réponse on-chain**
- Hypernative, Parallel (mai 2026) : https://www.hypernative.io/blog/how-an-automated-pause-prevented-a-1-52m-exploit-on-parallel
- Hypernative, Accountable (mars 2026) : https://www.hypernative.io/blog/how-accountable-secured-a-multi-chain-vault-protocol-with-real-time-automated-defense
- Hypernative, Shift DeFi : https://www.hypernative.io/insights/blog/shift-defi-adopts-hypernative-to-protect-capital-deployed-across-defi
- Hypernative, plateforme : https://hypernative.io/products/hypernative-platform · profil : https://thegrid.id/profiles/hypernative
- BlockSec Phalcon : https://blocksec.com/blog/what-is-block-sec-phalcon-how-does-phalcon-accurately-identify-and-rapidly-block-hacker-attacks · https://blocksec.com/blog/how-can-block-sec-phalcon-prevent-hacker-attacks-on-de-fi-protocols-by-using-front-running-techniques · https://blocksec.com/blog/ten-most-frequently-asked-questions-about-phalcon-block
- Forta : https://forta.org/blog/how-fortas-predictive-ml-models-detect-attacks-before-exploitation · https://www.theblock.co/post/327244/a16z-forta-firewall-smart-contract-exploits
- OpenZeppelin, fin de Defender : https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender · https://www.openzeppelin.com/news/defender-sunset-faq · https://docs.keeperhub.com/guides/defender-migration
- Tenderly : https://docs.tenderly.co/monitoring/alerts/destinations/web3-action · https://docs.tenderly.co/faq/alerts
- Chainalysis/Hexagate : https://decrypt.co/297729/chainalysis-scoops-up-blockchain-security-firm-hexagate-amid-surge-in-crypto-hacks
- Cyvers : https://www.theblock.co/amp/post/191068/cyvers-raises-8-million-to-bring-security-solutions-to-web3-companies
- Venn : https://malaysia.news.yahoo.com/ironblocks-venn-network-aims-keep-141807474.html · https://www.silicon.co.uk/press-release/glue-launches-proactive-fraud-defense-with-ironblocks-venn-security-network
- Phylax : https://docs.linea.build/network/how-to/write-and-deploy-assertions · https://www.theblock.co/post/386915/consensys-backed-linea-integrates-phylaxs-credible-layer-to-proactive-prevent-smart-contract-exploits · https://collective.flashbots.net/t/credible-blocks-security-guarantees-in-block-building/4089 · https://partners.circle.com/partner/phylax-systems
- ERC-7265 : https://blog.quillaudits.com/trending/defusing-defi-hacks-erc-7265/ · https://www.coindesk.com/learn/what-is-the-erc-7265-token-standard
- SEAL Safe Harbor : https://alchemixfi.substack.com/p/governance-update-52 · https://cointelegraph.com/magazine/seal-911-team-white-hat-forms-fight-crypto-hacks-real-time/
- Chimera/Recon : https://book.getrecon.xyz/writing_invariant_tests/chimera_framework.html
- OWASP Smart Contract Top 10 : https://scs.owasp.org/sctop10/archive/2025/Top10:2025/ · https://owasp.org/www-project-smart-contract-top-10/

**Recherche**
- Anthropic SCONE-bench : https://www.anthropic.com/research/smart-contracts
- Skyeye : https://conf.researchr.org/details/ase-2024/ase-2024-research/126/Skyeye-Detecting-Imminent-Attacks-via-Analyzing-Adversarial-Smart-Contracts
- BlockWatchdog : https://arxiv.org/html/2403.19112v1
- LookAhead : https://arxiv.org/pdf/2401.07261
- FlashGuard : https://arxiv.org/pdf/2503.01944
- ML on-chain (Alhaidari et al.) : https://arxiv.org/html/2510.16024v1
- DeFiScope : https://arxiv.org/pdf/2502.11521v2
- GenDetect : https://www.emergentmind.com/papers/2604.26094
- A1 : https://arxiv.org/html/2507.05558v3 · CyberChainBench : https://papers.cool/arxiv/2606.26216 · POCEvaluator : https://arxiv.org/pdf/2602.01317v2
- DeFiTail : https://arxiv.org/html/2511.00408v1

**Avalanche**
- Webhooks AvaCloud : https://developers.avacloud.io/webhooks-api · https://developers.avacloud.io/data-api/webhooks/create-a-webhook
- Granite : https://docs.avax.network/blog/granite-upgrade · Octane : https://www.avax.network/about/blog/octane-optimizing-c-chain-gas-fees · gas target : https://docs.avax.network/blog/gas-target-increase
- ICM : https://docs.avax.network/docs/cross-chain/avalanche-warp-messaging/deep-dive · audit Warp OZ : https://www.openzeppelin.com/news/ava-warp-messaging-audit · audit Teleporter : https://www.openzeppelin.com/news/ava-teleporter-audit

**DORA / MiCA**
- RTS 2024/1772 (classification) : https://eur-lex.europa.eu/eli/reg_del/2024/1772/oj/eng · art. 10 : https://www.springlex.eu/en/packages/dora/rts-ic-regulation/article-10/
- FMA (Autriche), lecture du test : https://www.fma.gv.at/en/dora-ict-related-incidents/
- RTS 2025/301 (délais) : https://advisera.com/cdr-2025-301/time-limits-for-the-initial-notification-and-for-the-intermediate-and-final-reports/
- ITS 2025/302 (gabarits) : https://eur-lex.europa.eu/eli/reg_impl/2025/302/oj/eng
- **ESAs, *DORA Incident Reporting – Operational Instructions*, 16/09/2026** : https://www.esma.europa.eu/sites/default/files/2026-09/DORA_Incident_reporting_-_Operational_instructions.pdf
- EBA Q&A 2025_7613 (phishing côté client ≠ incident TIC) : https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2025_7613
- Registre d'informations ITS 2024/2956 : https://www.regulationtomorrow.com/2024/12/published-in-oj-dora-implementing-regulation-on-standard-templates-for-the-register-of-information/
- CTPP (18/11/2025) : https://www.eiopa.europa.eu/european-supervisory-authorities-designate-critical-ict-third-party-providers-under-digital-2025-11-18_it · https://finreg.aoshearman.com/esas-publish-official-list-of-designated-critical-ctpps-under-dora · https://fintech.global/2026/05/05/dora-ctpps-explained-rules-risks-and-obligations/
- DORA et CASP : https://cryptoslate.com/crypto-laws/eu-digital-operational-resilience-act-dora/ · https://www.legiscope.com/blog/dora-incident-reporting.html

**Incidents liés à des tiers en 2026**
- Ostium : https://cointelegraph.com/news/ostium-pauses-trading-as-security-firms-report-multimillion-dollar-oracle-exploit · https://decrypt.co/373566
- Bonzo Lend : https://forklog.com/en/bonzo-lend-loses-9m-in-oracle-price-attack/
- 630 M$ d'infrastructure tierce : https://crypto-economy.com/?p=324881 · https://pluang.com/en/news-feed/defi-kehilangan-630juta-akibat-serangan-infrastruktur-pihak-ketiga
- Pertes DeFi 2026 : https://whale-alert.io/stories/8ce301a395d3ea/DeFi-losses-hit-13-billion-in-2026-as-hacks-shift-to-compromised-keys-social-engineering-and-bridge-failures

> **À vérifier avant toute slide** :
> - statut final d'ERC-7265 ;
> - noms exacts des 19 CTPP ;
> - numérotation des gabarits B_05/B_06 de l'ITS 2024/2956 ;
> - support de `debug_trace*` sur le RPC public Fuji ;
> - date exacte de l'intégration Linea/Phylax ;
> - chiffres « vendeur » (Hypernative, Hexagate, Cyvers, BlockSec) ;
> - les deux interprétations juridiques, à faire valider par KPMG.

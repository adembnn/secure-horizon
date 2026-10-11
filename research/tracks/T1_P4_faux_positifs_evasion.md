# T1 / P4 : faux positifs (opérations légitimes) et évasion (attaquant qui connaît nos règles)

Date : 10 oct. 2026. Auteur : worker de recherche. Statut : non commité.
Cadre : Hold up, cœur D-004 (signaux a destinataires inédits, b cumul multi-fenêtres, c écart backend/chaîne, d changement de pouvoirs, e contexte). La machine ne fait que ralentir (plafond, voie lente) ; reprise par 2 gardiens sur 3. Lu : `docs/architecture.md` (v1), `research/titouan/loop/round1_synthese.md`, `research/titouan/challenge_archi_v0.md`.
Légende : **[P]** source primaire consultée ; **[S]** source secondaire (presse, éditeur de solution) ; **[V]** à vérifier / hypothèse de banc, jamais à afficher comme fait. Le règlement `context/notion_guide.md` prime (non relu ici, aucune règle n'est tirée de ce fichier).

## TL;DR
1. La quasi-totalité du trafic légitime d'un prestataire est **interne** (sweeps, hot/warm/cold). Premier remède : une **frontière de périmètre** déclarée (adresses propres) ; un transfert interne n'est pas une sortie. Sans elle, D1 et D3 crient en continu.
2. Les vraies opérations dangereuses à cause de leur ressemblance : migration/rotation de clés (50 à 100 % d'un wallet vers des adresses neuves), règlement OTC/MM, gros retrait institutionnel, bank run. On les distingue par un **calendrier d'opérations déclarées signé, lié à (destination, plafond, fenêtre)**, jamais par une exemption générale.
3. Leçon Bybit (21 fév. 2025) : l'attaque **était** un « transfert de routine cold → hot » signé par les humains. Une exemption « opération déclarée = pas de contrôle » est exactement le trou. Une opération déclarée change de **voie** (délai, plafond propre), elle n'est jamais exemptée.
4. Évasion : les parades tiennent par le **plafond agrégé en dur** (hors apprentissage) et par la confiance **graduée** (un destinataire « connu » donne un droit plafonné, pas un laissez-passer). Limites assumées : adversaire patient sous le plafond, backend ET chaîne falsifiés de façon cohérente (signal c aveugle), une seule transaction (hors Watch), multisig humain compromis.
5. Banc : 10 000 tx légitimes synthétiques (composition chiffrée §5) + rejeu de données publiques, 3 familles d'évasion en boîte blanche, config scellée avant, FP rapportés en « pour 10 000 tx » avec Clopper-Pearson, coût d'un FP = capital immobilisé (négligeable) + minutes d'analyste (dominant).

---

## 1. Ce qu'on sait, avec sources (base factuelle)

| Fait | Source | Tag |
|---|---|---|
| Les plateformes sont en couches : adresses de dépôt, wallets de collecte, hot, warm, cold. Cycle : dépôt → sweep vers hot → consolidation vers warm/cold → retour vers hot pour la liquidité. Une grande part des « flux d'exchange » est opérationnelle, pas client. | Elliptic (corpus sweep/netflow) via recherche : https://www.elliptic.co/corpus/gen-3569/cash-flow-statement/exchange-deposit-and-withdrawal-flows.html ; https://www.elliptic.co/corpus/gen-2810/les-3/on-chain-clustering-heuristics-for-identifying-exchange-deposit-addresses-and-hot-wallets.html | [S] éditeur analytics |
| Piège d'analyse : les transferts internes vers des cold wallets pas encore attribués sont classés à tort en sorties. | Elliptic, même corpus (la page « Netflow to Exchanges » a renvoyé 404 au fetch direct : résumé par l'outil de recherche) | [S] / [V] |
| Dune identifie les adresses de dépôt par heuristique (reçoit d'externe puis passe à un hot wallet connu) ; table de flux dépendante de la qualité de la liste d'adresses source. Pas de taux d'erreur publié. | https://docs.dune.com/data-catalog/curated/cex-flows/overview ; https://docs.dune.com/data-catalog/curated/cex-flows/deposit_addresses | [P] doc éditeur |
| Les solutions de sweep des custodians consolident les dépôts vers un wallet central. | https://safeheron.com/blog/crypto-exchange-wallet-sweeping-solution/ | [S] éditeur |
| FTX, nov. 2022 : environ 6 Md$ de retraits nets en 72 h avant le 8 nov. ; « en moyenne, des dizaines de millions de dollars de flux nets par jour » (message du CEO à ses équipes). Ratio de stress d'environ 50 à 100 fois la normale [calcul dérivé, [V]]. | https://investing.com/news/economy/crypto-exchange-ftx-saw-6-billion-in-withdrawals-in-72-hours--ceo-message-to-staff-2936560 ; https://www.malaymail.com/news/money/2022/11/09/crypto-exchange-ftx-saw-us6b-in-withdrawals-in-72-hours-says-ceo-message-to-staff/38402 | [S] (Reuters relayé) |
| FTX 11-12 nov. 2022 : environ 662 M$ sortis après le dépôt de bilan (mouvements non autorisés), mesurés par Nansen. Exemple d'attaque **pendant** un chaos opérationnel. | https://fortune.com/2022/11/12/ftx-investigating-662-million-worth-of-unauthorized-transactions-24-hour-period-after-bankruptcy/amp | [S] |
| Binance, déc. 2022 : environ 1,9 Md$ de retraits nets sur 24 h (Nansen), 1,4 Md$ de retraits traités sur 24 h (CZ), environ 6 Md$ du lundi au mercredi (Binance) ; un retard de traitement USDC attribué aux heures d'ouverture bancaires a alimenté la panique. Le « 6 Md$ en moins de 24 h » d'une source est contredit : ne pas l'utiliser. | https://www.fxstreet.com/cryptocurrencies/news/binance-ceo-changpeng-zhao-fights-crypto-jitters-exchange-processes-14-billion-in-withdrawals-in-24-hours-202212140751 ; https://michiganpublic.org/2022-12-16/binance-was-once-ftxs-rival-and-possible-savior-now-its-trying-not-to-be-its-sequel | [S] |
| Mazars (procédure convenue, pas un audit) a suspendu ses preuves de réserves pour le secteur crypto. Les proof of reserves ne donnent donc **pas** de données de flux fiables pour calibrer. | https://www.crowdfundinsider.com/2022/12/200016-audit-firm-mazars-bails-on-binance-proof-of-reserves-statement/ ; https://nysscpa.org/news/1051227-mazars-pauses-work-on-crypto-clients-2022-12-16 | [S] |
| Bybit, 21 fév. 2025 : environ 1,46 Md$ ; l'interface Safe, compromise via le poste d'un développeur, a présenté une transaction malveillante comme un « transfert de routine du cold wallet Ethereum vers un hot wallet », signée par les humains. Dispersion en 50 wallets d'environ 10 000 ETH en 2 h, vidés sur 9 jours. | https://www.chainalysis.com/blog/bybit-exchange-hack-february-2025-crypto-security-dprk/ ; https://www.elliptic.co/blog/bybit-hack-largest-in-history | [S] |
| Ronin, mars 2022 : 173 600 ETH + 25,5 M USDC en **deux transactions** de retrait forgées (5 validateurs sur 9 requis) ; perte annoncée le 29 mars pour une attaque survenue « mercredi dernier ». Exemple de vol lent à détecter (non détecté pendant des jours) et d'attaque en 2 tx. | https://www.coindesk.com/tech/2022/03/29/axie-infinitys-ronin-network-suffers-625m-exploit (le fetch du blog officiel Ronin a échoué : durée exacte de non-détection non confirmée, [V]) | [S] |
| Address poisoning : 270 M tentatives, 17 M de victimes, 6 633 incidents avec perte, au moins 83,8 M$ (Ethereum + BSC, juil. 2022 à juin 2024). Les attaquants génèrent des adresses sosies de contreparties connues et « empoisonnent » l'historique. | https://arxiv.org/abs/2501.16681 | [P] arXiv |
| Safe Guards : s'ajoutent au schéma n-sur-m, contrôlent avant et après exécution ; un Guard défaillant peut bloquer le Safe (DoS). Les modules exécutent des transactions arbitraires sans signature propriétaire par transaction ; un module malveillant peut prendre le Safe. Si un module contourne un Guard : **non confirmé par la page** [V]. | https://docs.safe.global/advanced/smart-account-guards ; https://docs.safe.global/advanced/smart-account-modules | [P] |
| ATT&CK T1657 « Financial Theft » (inclut l'exploitation de crypto) ; D3FEND D3-UBA (analyse du comportement utilisateur, fraude financière), D3-OAM (cartographie des activités opérationnelles), D3-RAPA (analyse des schémas d'accès aux ressources). IDs confirmés sur les pages. | https://attack.mitre.org/techniques/T1657/ ; https://d3fend.mitre.org/technique/d3f:UserBehaviorAnalysis/ ; https://d3fend.mitre.org/technique/d3f:OperationalActivityMapping/ ; https://d3fend.mitre.org/technique/d3f:ResourceAccessPatternAnalysis/ | [P] |

**Trou de recherche assumé** : je n'ai trouvé aucun jeu public donnant des taux d'opérations légitimes par type (nombre de sweeps par jour, de refills par mois) pour un prestataire réel, ni de taux de faux positifs indépendant d'un outil. Les fréquences du §2 sont des **ordres de grandeur de banc [V]**, à recaler sur les tables Dune `cex` (publiques) si l'accès est confirmé. Arkham/Nansen : données sous licence, non consultées ; Dune est préférable (publiques, citables).

---

## 2. Opérations légitimes qui ressemblent à une attaque

Principe : une opération est un faux positif **si elle déclenche un palier restrictif (L2/L3)**. L1 (alerte non paginée) est tolérable. Les volumes/fréquences ci-dessous sont des hypothèses de banc [V], sauf mention. « Réserve » = valeur totale des adresses surveillées.

| # | Opération légitime | Signal déclenché à tort | Volume / fréquence typiques [V] | Distinction |
|---|---|---|---|---|
| 1 | Sweep adresses de dépôt → hot | (a) destinataire « inconnu » si le hot est nouveau ; (b) cumul énorme en nombre de tx ; (c) écart backend si le sweep n'est pas dans le flux annoncé | Des milliers de petites tx/jour, valeur unitaire faible (une dépôt) ; la plus grosse part des tx on-chain d'un exchange | **Périmètre** : adresses de dépôt et hot sont dans l'ensemble surveillé ; un transfert interne n'est pas une sortie (inspiré de la distinction interne/externe d'Elliptic). Le registre du périmètre ne change que par le circuit déclaré (timelock). Piège : un faux « dépôt » ajouté au périmètre par l'attaquant : ajout au périmètre = changement de pouvoir (signal d) |
| 2 | Réappro hot ← warm ← cold | (a) si warm/cold jamais vus ; (b) (d) sauts de montants de 1 à 5 % de la réserve ; (e) heure inhabituelle | Hot : réappro plusieurs fois par semaine ; cold → warm : trimestriel ou à la demande | Warm/cold dans le périmètre (interne). Montant hors habitude : **ticket de réappro** (hash signé par 2 humains : source, destination, plafond, fenêtre) rapproché de la chaîne. **Bybit** : le transfert cold → hot était l'attaque ; donc le rapprochement porte sur la **destination effectivement exécutée** (calldata décodé), pas sur l'étiquette « réappro » |
| 3 | Hot → warm (excédent) | Rien d'anormal en sortie nette ; D3 si pas annoncé | Quotidien, plusieurs % de la réserve | Interne, idem |
| 4 | Rééquilibrage entre chaînes / bridges | (a) adresse de bridge jamais vue ; (b) montant ; destination côté autre chaîne invisible | Hebdo à mensuel, 0,5 à 5 % de la réserve [V] | Contrats de bridge dans une **liste de routes déclarées** avec plafond propre ; la destination distante doit être une adresse du périmètre sur l'autre chaîne (si non surveillée : voie lente + alerte, limite) |
| 5 | Règlement MM / OTC | (a) contrepartie rare ; (b) gros montant ; (e) hors horaires | Journalier à hebdo ; 0,5 à 3 % de la réserve par règlement [V] | Contreparties de la liste blanche **à ancienneté** (>= N jours, plafond par adresse issu de l'historique) ; nouveau MM = événement déclaré (calendrier) |
| 6 | Paiements fournisseurs, salaires crypto, frais | (a) un par adresse neuve ; récurrents ensuite | Mensuel, mêmes adresses | Après 1 à 2 cycles, adresse « connue » à droit plafonné ; premier paiement en voie lente (c'est le coût accepté, voir métrique FP) |
| 7 | Migration de wallet ou de contrat ; rotation de clés ; changement de signataires planifié | (a) 50 à 100 % d'un wallet vers des adresses neuves ; (d) `Upgraded`, `RoleGranted`, owner. Le plus gros faux positif possible | Rare (1 à 4 par an) ; mais il est exactement le pattern d'un drain | **Plan de migration signé** : (adresses cibles, montant max, fenêtre, signataires), hashé et publié avec activation différée (timelock 24 h cible). Déroulé en tranches avec le plafond de la migration, pas en bloc. Non déclaré = L3 sans exception. Voir évasion E5 |
| 8 | Gros retrait d'un client institutionnel | (a) nouvelle adresse (b) 5 à 20 % du hot | Quelques-uns par semaine, 0,3 % du trafic [V] | Voie lente, mais **pré-notification client** (le client institutionnel est dans un cadre contractuel : liste d'adresses pré-enregistrée, délai d'activation). Rare cas de coût FP réel : minutes de retard sur un gros ticket |
| 9 | Bank run (FTX, Binance) | (b) cumul x50 à x100 de la normale [P-dérivé, §1] ; plafond agrégé atteint | Binance déc. 2022 : jusqu'à 1,9 Md$ net/24 h ; FTX : 6 Md$/72 h | **Tension de fond** : le plafond qui borne un drain borne aussi une ruée, et un retard de traitement a aggravé la panique de Binance (§1). Distinction : une ruée = **beaucoup** de destinataires anciens, whitelisted, petits tickets ; un drain = peu de destinataires neufs, gros tickets. Mesure : concentration (part des 5 premiers destinataires), âge médian, entropie. Ruée → voie rapide pour les comptes éligibles (snapshot), **plafond dimensionné au stress** (>= p99 du pire historique, pas à la normale) et décision humaine déclarée « mode crise ». Limite : un attaquant qui se cache dans une ruée (cf. FTX 662 M$) ne se voit qu'avec le signal (c) et la concentration |
| 10 | Listing d'un nouveau token | (b)(d) nouveau contrat ; (a) inventaire MM ; approbations | Quelques par mois | Calendrier d'opérations : listing déclaré = contrat + plafond d'approbation + fenêtre. Approbation illimitée (allowance infinie) à un contrat non déclaré = signal |
| 11 | Maintenance, consolidation de poussière, tx de test | (a) petits montants vers adresses neuves | Rare, faible valeur | Seuil de valeur plancher ; test-tx déclaré ; sinon L1 seulement |
| 12 | Opérations pendant un incident légitime (maintenance planifiée, gel de la plateforme) | Toute la fenêtre est sensible | Quelques heures par trimestre | Fenêtre déclarée = **restrictions plus serrées**, pas plus lâches (voir E6) |

Règles de conception qui découlent de ce tableau :
- **Périmètre d'abord** : seules les sorties vers l'extérieur du périmètre sont des sorties. Le périmètre est un artefact signé ; en modifier le contenu est un événement D7.
- **Opération déclarée = changement de voie, jamais exemption** : elle donne un plafond propre, une fenêtre, un destinataire exact. Hors de ces trois paramètres, c'est une sortie ordinaire. L'écart entre la déclaration et la chaîne est lui-même le signal (c).
- **Confiance graduée** : une adresse « connue » donne un droit plafonné par son historique (par exemple <= 2 fois la plus grosse tx passée vers elle, bornée par un % de la réserve), pas un statut binaire.
- **Deux humains pour déclarer** (le calendrier est une surface d'attaque : voir E6).
- **Mesure séparée** : les FP sont comptés par palier (L1 / L2 / L3). Seuls L2+ mesurent un coût client.

---

## 3. Évasion : l'attaquant connaît nos règles (Kerckhoffs)

Hypothèse du banc : boîte **blanche** (config gelée publique). Pour chaque cas : parade et limite assumée.

| # | Évasion | Parade concrète | Limite assumée |
|---|---|---|---|
| E1 | **Drain lent sous les seuils** | Fenêtres emboîtées (10 blocs, 100, 1 000, 24 h, + 7 jours), plafond agrégé en valeur absolue **dans le contrat**, hors tout apprentissage. Calcul affiché : temps pour vider à cadence plafond. | L'adversaire patient sous le plafond normal n'est pas arrêté, il est ralenti. Ronin a duré des jours sans détection ([S]) : seule la fenêtre longue + le signal (c) le voient. Ce que fait la défense : transformer un vol en vidange de N semaines et donner à l'humain le temps de voir |
| E2 | **Fractionnement Sybil** (40 adresses) | D1 agrège toutes les adresses « non connues » dans un seul seau, pondéré par le % du solde, pas par le nombre d'adresses | Si l'attaquant a 40 adresses **déjà connues** (E3), le seau n'est pas atteint : défense = confiance graduée |
| E3 | **Empoisonnement de l'historique** : faire passer ses adresses pour « connues » (poussière entrante, ou faux dépôts clients répétés) | « Connu » exige : valeur cumulée minimale **ET** ancienneté >= N blocs **ET** >= k jours distincts **ET** direction **sortante** légitime (nous avons payé cette adresse) ; une poussière entrante ne qualifie jamais un destinataire de sortie. Droit plafonné par l'historique. Test dédié : l'attaquant dépose des montants croissants pendant des semaines | (i) l'attaquant qui ouvre un vrai compte client et retire ce qu'il a déposé est un client : borné par son solde. (ii) Address poisoning ([P] arXiv 2501.16681) vise surtout les utilisateurs qui copient une adresse ; ici le risque est l'**opérateur humain** qui copie depuis l'historique pour déclarer une opération : le calendrier doit faire saisir l'adresse depuis le registre signé, pas depuis l'historique on-chain |
| E4 | **Passage par une adresse whitelistée compromise** | Voie rapide **plafonnée** (individuelle + agrégée) ; toute modification de whitelist = L1 visible et activation différée (24 h cible). Alerte si une adresse whitelistée change de comportement (nouveau contrat, EOA devenue contrat via EIP-7702 [V]) | Un client whitelisté et compromis vide son propre compte plafonné : écrit dans `limits.md`. Un partenaire MM compromis reçoit son plafond |
| E5 | **Attaque pendant une opération légitime annoncée** (migration, réappro, bank run, maintenance) | Une déclaration fixe (destination, plafond, fenêtre) ; l'écart chaîne vs déclaration est le signal (c) ; pendant une fenêtre déclarée, les plafonds **hors** déclaration sont resserrés ; la migration se fait par tranches avec rapprochement après chaque tranche. Bybit : la déclaration « cold → hot » correspondait à une destination différente de celle signée : rapprocher le calldata décodé, pas le libellé | Si l'attaquant détourne la **déclaration** (il contrôle le registre des opérations ou convainc 2 humains), il passe ; borné alors par le plafond de l'opération. La déclaration doit elle-même passer par un timelock pour toute opération > X % de la réserve |
| E6 | **Falsification cohérente du backend ET de la chaîne** (le backend annonce la sortie vers B alors que la chaîne montre A, ou le backend est réécrit pour concorder) | Le signal (c) n'a de valeur que si le flux backend est **signé hors du domaine de confiance de l'exécuteur** (HSM séparé, écrit-seulement) ; sinon on retombe sur a, b, d, e qui ne dépendent que de la chaîne | **C'est la limite dure** : si l'attaquant contrôle à la fois l'exécution et l'attestation backend (cas Bybit où l'UI a trompé les signataires), seul le plafond en dur et les signaux chaîne-seule agissent. Le dire à l'oral |
| E7 | **Ajout de signataire légitime, vol plus tard** (précurseur Drift : nonces visibles 23 mars, vol 1er avril, d'après le dépôt [V]) | D7 : tout `RoleGranted`/owner/seuil/module = L3 + activation différée ; **période de probation** du nouveau signataire (plafond réduit N jours) ; alerte « signataire dormant qui se réveille » | Si 2 humains valident l'ajout (ingénierie sociale), il passe ; la probation retarde de N jours seulement. Les modules Safe exécutent sans signature par tx et un module malveillant peut prendre le Safe ([P] docs Safe) : tout ajout de module est L3. Le contournement des Guards par les modules n'est **pas confirmé** [V] |
| E8 | **Attaque en une transaction** (Ronin: 2 tx ; prix oracle ; delegatecall) | Hors détection par construction (lecture de blocs = après coup). En mode Guard : invariants et plafond dans le contrat (revert). En mode Watch : aucune parade | Mesurée à part en colonne « prévention » ; jamais comptée dans la détection (déjà dit dans l'architecture) |
| E9 | **Attaque cross-chain** (sortie vers un pont, puis disparition sur une chaîne non surveillée) | Un dépôt vers un contrat de bridge compte comme sortie vers un destinataire à destination inconnue (voie lente, plafond de bridge) ; routes déclarées | Au-delà du pont, rien n'est visible sans ChainSource multi-chaînes (hors périmètre ; rappelé : Bybit a utilisé DEX, ponts et swap sans KYC, [S] Chainalysis) |
| E10 | **Déni de service par la défense** : provoquer des faux positifs pour que l'équipe désactive l'outil | (1) Un signal ne compte que sur de la **valeur sortante** ou un changement de pouvoir ; les événements gratuits (poussière entrante, spam d'approbations vers l'extérieur) ne déclenchent pas. (2) L1 est dédupliqué et plafonné (budget d'alertes par jour et par astreinte) ; seul L3 appelle quelqu'un. (3) La voie lente ne touche que les clients concernés. (4) Budget de restriction déjà prévu : épuisement = plafond statique, pas désarmement. (5) Désarmer exige 2 gardiens sur 3 ; un seul gardien ne peut que resserrer. (6) Mode « fenêtre de silence » interdit de réduire la détection (il ne fait que différer l'alerte) | Un attaquant qui fabrique de vrais retraits (comptes avec KYC) peut user l'attention humaine : fatigue d'alerte (métrique alertes/jour/personne). Une Guard défaillante peut elle-même bloquer le Safe ([P] docs Safe) : cas « Hold up = DoS contre nous » traité par le plafond statique et la reprise 2 sur 3 |
| E11 | **Épuisement du budget de resserrage puis vrai drain** (round1_synthese) | Le budget épuisé ne retire jamais le plafond dur ; retour à plafond statique ; escalade L3 | Le plafond statique sert aussi aux clients légitimes : coût FP assumé |
| E12 | **Empoisonnement de la ligne de base** (hausse patiente des retraits « normaux ») | Pas de seuil appris : base fenêtrée gelée et signée, dérive maximale par période (round1_synthese), plafonds absolus dans le contrat | Un attaquant qui fait croître réellement l'activité (vrais clients) élève le plafond de politique au prochain renouvellement signé : décision humaine |
| E13 | **Compromission de Hold up ou du RPC** (fausse vue de la chaîne) | Hold up ne peut que resserrer ; RPC en quorum (P3) ; divergence = L1 | RPC unique en démo : limite écrite |

Mapping pour les évasions : T1657 (le vol), T1078 (comptes valides, signataire/clé), T1562.001 « Disable or Modify Tools » [S, ID non confirmé à la page : à vérifier sur attack.mitre.org] pour E10/E11 (faire désactiver l'outil), T1565.002 « Transmitted Data Manipulation » [S, à vérifier] pour E6 (écart backend/chaîne), D3-UBA / D3-RAPA / D3-OAM [P] pour les signaux a, b, e et le calendrier d'opérations.

---

## 4. Mapping réglementaire par idée (règle projet : NIST CSF 2.0 + au moins un référentiel)

IDs NIST CSF 2.0 écrits de mémoire, à valider contre le texte officiel par le worker de `regulatory/mapping.yaml` : **[V]**. ATT&CK T1657 et D3FEND D3-UBA/D3-OAM/D3-RAPA : [P]. OWASP Agentic et ATLAS : le cœur est déterministe, **aucun ASIxx/AML.Txxxx n'est revendiqué** pour ces idées. Pour l'empoisonnement de base, ATLAS AML.T0020 (« Poison Training Data ») n'est qu'une **analogie** car il n'y a pas de modèle appris : ne pas le citer. Pour le texte généré par LLM du dossier, voir `docs/architecture.md` §13 (ASI01/AML.T0051 à confirmer).

| Idée | NIST CSF 2.0 [V] | ATT&CK | D3FEND |
|---|---|---|---|
| Périmètre signé + sweeps internes | ID.AM (inventaire des actifs), DE.CM-01 | T1657 | D3-OAM |
| Calendrier d'opérations déclarées lié à (dest, plafond, fenêtre) | GV.PO-01, PR.AA-05 (séparation des tâches), DE.AE-03 (corrélation de sources) | T1657, T1078 | D3-OAM, D3-UBA |
| Confiance graduée / « connu » strict (E2, E3) | DE.AE-02 | T1657 | D3-UBA, D3-RAPA |
| Plafond dur + fenêtres emboîtées (E1, E11, E12) | PR.PS (configuration), RS.MI-01 (confinement) | T1657 | D3-UBA |
| Rapprochement déclaration / calldata / backend (E5, E6) | DE.AE-03, DE.AE-02 | T1565.002 [S/V], T1657 | D3-OAM |
| Probation de signataire, D7 (E7) | PR.AA-05, DE.CM-03 | T1078 | D3-UBA |
| Budget d'alertes, anti-DoS-défense (E10) | DE.AE-06, RS.MA-02/03 | T1562.001 [S/V] | non vérifié |
| Banc d'essai scellé | ID.IM-02, GV.OC (si applicable) | n/a | n/a |

---

## 5. Protocole de banc d'essai

Objectif : prouver, avec des intervalles, que (1) le trafic légitime réaliste ne déclenche pas L2+ plus souvent que le critère, (2) les évasions de boîte blanche sont bornées par la formule du plafond, (3) les ratés sont publiés.

### 5.1 Trafic légitime : modèle « CASP Nord-Custody » (synthétique, `synthetic:true`)

Hypothèses de profil [V] : réserve 200 M€ ; répartition hot 3 % / warm 7 % / cold 90 % (ordre de grandeur courant, à justifier avant affichage) ; 30 jours ; une fenêtre = 10 000 événements de valeur sortant d'une adresse surveillée, dont le périmètre interne.

| Classe (pour 10 000 événements) | Nb | Distribution des montants [V] | Destinataires |
|---|---|---|---|
| Retrait client vers adresse whitelistée ancienne | 6 200 | log-normale, médiane 800 €, sigma 1,5 ; queue p99 150 k€ | 4 000 adresses, 90 % > 30 jours d'âge |
| Retrait client vers adresse nouvelle | 1 300 | idem, médiane 600 € | neuves |
| Sweeps dépôt → hot (interne) | 1 600 | médiane 400 € | périmètre |
| Gas top-ups opérateurs | 300 | < 50 € | périmètre |
| Règlements MM/OTC | 120 | 0,5 à 3 % de la réserve | 6 contreparties à ancienneté |
| Paiements fournisseurs/salaires | 150 | 5 k€ à 80 k€, mensuels | 40 adresses récurrentes |
| Rééquilibrage bridge | 60 | 0,5 à 5 % de la réserve | 3 routes déclarées |
| Réappro warm → hot / hot → warm | 80 | 1 à 5 % de la réserve | périmètre |
| Retraits institutionnels | 30 | 5 à 20 % du hot | 30 % vers adresse nouvelle |
| Listing / MM inventory | 10 | 0,5 à 2 % | contrat déclaré |
| Maintenance, tx de test, divers | 144 | < 200 € | divers |
| Cold → warm | 4 | 2 à 8 % de la réserve | périmètre |
| Événements « mégas » : 1 rotation de clés + 1 migration de contrat | 2 | 50 à 100 % d'un wallet | adresses neuves **déclarées** |

Total 10 000. Chaque classe porte une étiquette de vérité-terrain (`legit:true`, `declared:true/false`).

Variantes de stress obligatoires (rapportées à part) :
- **Ruée** : multiplicateur x50 à x100 du flux de retrait sur 72 h (ancrage FTX [P-dérivé]), 70 % vers adresses anciennes, plusieurs milliers de destinataires.
- **Décalage de distribution** : même générateur avec une graine différente et paramètres perturbés de +/- 30 % (évite de calibrer et tester sur le même générateur).
- **Mégas non déclarés** : la même migration sans plan signé doit déclencher L3 (vrai positif attendu), et avec plan signé ne pas dépasser L1/L2 sur la voie lente.
- **Rejeu de données publiques** (si l'étape 0 de l'architecture passe) : fenêtres de transferts de contrats d'infrastructure, EOA pseudonymisées ; tables Dune `cex` en priorité [P doc]. Aucune donnée personnelle réelle ; aucune action contre un système réel.

Limite à écrire : un jeu synthétique prouve la plomberie, pas le taux de FP réel du terrain.

### 5.2 Jeu d'attaques et variantes d'évasion

Chaque attaque est un fichier `attack_specs/*.json` (format partagé avec les workers held-out).
- **Base** (déjà dans l'architecture) : F1 drain rapide/lent vers inconnus ; F2 signataire compromis ; F3 changement de pouvoir puis retrait ; F6 sortie sans événement `Withdraw`.
- **Évasion** (nouveau, boîte blanche : l'auteur reçoit la config gelée) : E1 (3 cadences : 0,9 / 0,5 / 0,1 du plafond, sur 1 h / 24 h / 7 j), E2 (10, 40, 200 adresses), E3 (poussière entrante puis sortie ; faux dépôts sur 3 semaines), E4, E5 (pendant migration déclarée, pendant ruée, pendant maintenance), E6 (backend simulé falsifié de façon cohérente : résultat attendu **raté** sur c, détecté seulement par a/b/d), E7 (ajout de signataire puis retrait à J+1, J+7, J+30), E8 (1 tx : colonne prévention), E9 (via pont), E10 (déclencheurs de FP à coût nul : poussière, spam d'approbations ; et à coût > 0 : vrais comptes), E11.
- **Lot adaptatif** : recherche aléatoire de 200 essais sur répartition adresses / montants / cadence, boîte blanche, courbe « perte trouvée vs borne théorique » publiée telle quelle.
- **Boîte noire** : un second jeu de 12 attaques sans accès à la config, écrit par workers isolés, pour comparer à la boîte blanche.

### 5.3 Métriques

| Métrique | Définition | Remarque |
|---|---|---|
| Détection par famille | Part d'attaques arrêtées (palier restrictif posé) avant X % de perte, avec IC de Clopper-Pearson | Rapportée par jeu, jamais agrégée |
| **FP pour 10 000 tx**, par palier | Nb d'événements légitimes classés L1 / L2 / L3 par fenêtre de 10 000, avec IC | Règle des trois : 0 FP sur 10 000 donne une borne haute à 95 % de 3/10 000, soit 3 pour 10 000 |
| Alertes par jour et par humain | L1 dédupliquées + L2/L3 | Mesure la fatigue (E10) |
| Délai de détection en blocs | Bloc de la sortie initiale -> bloc d'inclusion du resserrage | Grandeur portable ; secondes seulement sur Fuji |
| Fonds sauvés | Perte contrefactuelle sans Hold up moins perte avec ; courbe vs vitesse d'attaque (128 s à 41 min, déjà au plan) | Distinguer prévention (contrat) et détection |
| Perte réalisée / borne théorique | Pour E1, E11, adaptatif | Doit rester <= borne ; sinon bug |
| **Coût d'un FP** | Capital immobilisé + coût opérateur (ci-dessous) | |
| Taux de rapprochement déclaré / chaîne | Part des opérations déclarées dont la chaîne coïncide exactement (dest, montant <= plafond, fenêtre) | Valide E5 |

Coût d'un FP (modèle à fixer avant les tests) :
`coût_FP = Σ_i valeur_i × minutes_retard_i × r / 525 600  +  minutes_analyste × coût_horaire / 60`.
Exemple chiffré avec r = 5 % annuel (hypothèse [V]) : 1 M€ retenu 5 min coûte environ 0,48 € en capital (1e6 × 5 × 0,05 / 525 600). Le coût **capital est négligeable** ; ce qui pèse est (i) l'analyste (15 min à 60 €/h ≈ 15 €), (ii) le risque de SLA/réputation d'un retrait client retardé, (iii) dans une ruée, l'effet panique d'un retard (cas Binance USDC, §1). Donc on rapporte aussi la **médiane et le p95 du retard par retrait touché** et la part des clients touchés, pas seulement les €.

### 5.4 Sceller les règles avant les tests

1. Gel : `freeze.ts` écrit `config.frozen.json` (seuils, fenêtres, âge minimal « connu », plafonds, **registre du périmètre**, politique de calendrier) ; **seuls les paramètres, pas les attaques**.
2. Ancre B1 sur Fuji : hash de la config + hash du jeu held-out + **critères d'échec** (par exemple : détection < 2/3 avant 50 % de perte sur held-out, ou plus de N FP L2+ pour 10 000 tx, ou perte adaptative > borne) ; `evaluate.ts` refuse de tourner si le hash diffère, enregistre B2 > B1.
3. Critères d'échec écrits avant ; valeurs numériques à fixer par l'équipe (je ne les tranche pas ici).
4. Séparation : les workers qui écrivent les évasions ne modifient pas les détecteurs ; le générateur de trafic légitime est écrit par un troisième ; le dossier held-out vit hors de l'arbre de travail, seul son hash est commité.
5. Calibrer sur la graine A, tester sur graine B et variante +/- 30 % (§5.1). Toute modification de règle après lecture du test produit une nouvelle version, un nouveau B1, et le résultat précédent reste publié.
6. Publier les ratés (E6 attendu en échec sur le signal c ; E1 patient ; E8 hors détection) avec la même visibilité que les réussites.
7. Baseline naïve réglée au mieux sur la calibration, mêmes jeux ; afficher aussi où elle bat Hold up (par exemple sur le coût FP en voie rapide).
8. Garde-fou : cible = `deployments/fuji.json` ou local ; données synthétiques ou publiques ; aucun secret.

---

## 6. Risques et décisions à trancher

- **Décision Adem** : le périmètre signé et le calendrier d'opérations sont-ils dans le MVP ? Sans eux, les FP #1, #2, #7 sont inévitables. Coût estimé : 3 à 4 h-worker [V].
- **Tension plafond vs ruée** : à documenter dans `limits.md` ; le plafond dimensionné au stress réduit la protection contre le drain lent. Aucune solution gratuite.
- **E6 est une limite dure**, à dire avant qu'on nous la pose.
- **Ne pas afficher** : tout taux de FP « industriel », tout chiffre de volume §2 (hypothèses), la durée de non-détection de Ronin (non confirmée), le contournement des Guards par les modules.
- **Prochaines vérifications** : IDs NIST CSF 2.0 (texte officiel), T1562.001 et T1565.002 sur attack.mitre.org, accès aux tables Dune `cex`, blog Ronin officiel.

## Sources (récap)
- https://www.elliptic.co/corpus/gen-3569/cash-flow-statement/exchange-deposit-and-withdrawal-flows.html [S]
- https://www.elliptic.co/corpus/gen-2810/les-3/on-chain-clustering-heuristics-for-identifying-exchange-deposit-addresses-and-hot-wallets.html [S]
- https://docs.dune.com/data-catalog/curated/cex-flows/overview [P]
- https://docs.dune.com/data-catalog/curated/cex-flows/deposit_addresses [P]
- https://safeheron.com/blog/crypto-exchange-wallet-sweeping-solution/ [S]
- https://investing.com/news/economy/crypto-exchange-ftx-saw-6-billion-in-withdrawals-in-72-hours--ceo-message-to-staff-2936560 [S]
- https://www.malaymail.com/news/money/2022/11/09/crypto-exchange-ftx-saw-us6b-in-withdrawals-in-72-hours-says-ceo-message-to-staff/38402 [S]
- https://fortune.com/2022/11/12/ftx-investigating-662-million-worth-of-unauthorized-transactions-24-hour-period-after-bankruptcy/amp [S]
- https://www.fxstreet.com/cryptocurrencies/news/binance-ceo-changpeng-zhao-fights-crypto-jitters-exchange-processes-14-billion-in-withdrawals-in-24-hours-202212140751 [S]
- https://michiganpublic.org/2022-12-16/binance-was-once-ftxs-rival-and-possible-savior-now-its-trying-not-to-be-its-sequel [S]
- https://www.crowdfundinsider.com/2022/12/200016-audit-firm-mazars-bails-on-binance-proof-of-reserves-statement/ [S]
- https://nysscpa.org/news/1051227-mazars-pauses-work-on-crypto-clients-2022-12-16 [S]
- https://www.chainalysis.com/blog/bybit-exchange-hack-february-2025-crypto-security-dprk/ [S]
- https://www.elliptic.co/blog/bybit-hack-largest-in-history [S]
- https://www.coindesk.com/tech/2022/03/29/axie-infinitys-ronin-network-suffers-625m-exploit [S]
- https://arxiv.org/abs/2501.16681 [P]
- https://docs.safe.global/advanced/smart-account-guards [P]
- https://docs.safe.global/advanced/smart-account-modules [P]
- https://attack.mitre.org/techniques/T1657/ [P]
- https://d3fend.mitre.org/technique/d3f:UserBehaviorAnalysis/ , .../d3f:OperationalActivityMapping/ , .../d3f:ResourceAccessPatternAnalysis/ [P]

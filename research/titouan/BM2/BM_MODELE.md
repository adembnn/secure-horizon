# BM_MODELE. Le modèle économique de Hold up

Date : 11 octobre 2026. Auteur : agent de recherche (Claude), pour Titouan.
Fichiers lus : S1 à S6, Z1, Z3, Z4 (dans `onchain/`), Z5, `RECHERCHE_concurrents_particuliers.md`, `RECHERCHE_chiffres_douleur.md`, `RECHERCHE_these_moindre_privilege.md`, `RECHERCHE_metamask_couverture.md` (extraits), `livrables/CHIFFRES.md`, `PRODUCT.md`, `context/notion_guide.md`, la mémoire « gratuit puis partenaires ». Fichier voisin en cours d'écriture par un autre agent : `BM_MARCHE.md` (faits de marché).

## Légende

- **[V]** : lu à l'URL. Soit par moi pendant cette session (indiqué « lu ce jour »), soit marqué lu à la source dans le fichier du dépôt cité.
- **[NV]** : non relu à la source. Repris d'un résumé de recherche, d'un relais de presse ou d'un fichier du dépôt qui le marque ainsi.
- **[C]** : calcul fait ici. La formule est donnée.
- **[H]** : hypothèse de travail. Aucun chiffre public ne la soutient. À tester.
- **PROSPECTIF** : bloc qui décrit ce qui n'existe pas encore. Rien dans ces blocs n'est fait.

Règle tenue : aucun chiffre inventé. Quand un prix de marché manque, c'est écrit, et la fourchette retenue est marquée [H].

---

## 0. Ce que le règlement demande vraiment (à savoir avant le reste)

- Le pitch deck doit contenir un « business model » : problème, cible, solution, démo, business model, équipe (`context/notion_guide.md`, livrables communs).
- La grille Track 1 **ne note pas** le modèle économique comme critère propre. Les cinq critères sont : efficacité de détection 30 %, qualité de la réponse 20 %, faisabilité et intégration 20 %, conformité et explicabilité 15 %, pitch et démo 15 %.
- Le modèle économique pèse donc par deux portes. (1) « Faisabilité et intégration » demande : « S'intègre-t-il aux outils d'une banque, d'une fintech ou d'un protocole ? ». Un modèle B2B2C (portefeuille, exchange, fintech) répond directement à cette question. (2) La question conseillée « si votre modèle se trompe, qui est responsable ? » touche le contrat et l'assurance.
- Conséquence : le modèle doit être **court au pitch** (une diapo, 20 secondes) et **solide en questions**. La « viabilité business » à 20 % est un critère de la Track 3, pas de la nôtre.

---

## 1. La promesse

### En une phrase

> **Ne donne que ce que tu as dit.**

Variante longue, pour la diapo : « Chaque droit que tu donnes en trop est une porte ouverte. Hold up ne laisse passer que ce que tu as écrit vouloir faire. »

### En un paragraphe

Quand on signe, on donne souvent plus que nécessaire : un droit de dépense illimité pour un échange de 50 USDC, une signature qu'on ne sait pas lire. Ce surplus ne coûte rien le jour où on le donne. Il coûte tout le jour où le site, le contrat ou l'agent qui le détient est compromis. Hold up pose une seule question avant chaque demande : « Que veux-tu faire ? ». Puis il compare la réponse à ce que la demande fait vraiment, et retient tout ce qui dépasse. C'est le principe du moindre privilège, appliqué à partir de l'intention de la personne et non d'un réglage. Aujourd'hui pour un humain devant son portefeuille. Demain pour un client qui retire de l'argent d'une plateforme, et pour un agent IA qui dépense au nom de quelqu'un.

Appuis factuels de la promesse :
- Sur Ethereum, 47,6 % [46,9 ; 48,3] des droits de dépense non nuls sont illimités ; 34,2 % sur Avalanche C-Chain. Mesure interne, échantillon de blocs, des événements et non des personnes [V] (`livrables/CHIFFRES.md` B1).
- LI.FI, 16 juillet 2024 : 11,6 M$ pris à 153 portefeuilles en approbation illimitée, rien aux approbations finies, selon le rapport de LI.FI [V] (CHIFFRES B7 ; https://li.fi/knowledge-hub/incident-report-16th-july/).
- ethereum.org : « We recommend you never allow projects unlimited access to your tokens » [V] (https://ethereum.org/en/guides/how-to-revoke-token-access/, cité dans `RECHERCHE_these_moindre_privilege.md`).

Ce que la promesse ne dit pas : « protège », « bloque », « sécurisé ». Hold up retient et explique ; la personne décide (`PRODUCT.md`, principes ; CHIFFRES, phrases à ne pas dire).

---

## 2. Décision antérieure : ce qu'on garde, ce qu'on challenge

Décision du 11/10 (mémoire) : gratuit pour les particuliers au départ, partenaires une fois très utilisé, pas d'abonnement, pas de publicité faite par nous.

**On garde, et on le grave dans la promesse :**
- Gratuit pour le particulier. Raison chiffrée : la perte moyenne par victime de drainer est de 790 $ en 2025 [V] (ScamSniffer, CHIFFRES B3), et l'abonnement de masse rapporte peu (Webacy : 500 k$ d'ARR déclarés pour environ 30 000 utilisateurs, soit 16,7 $ par utilisateur et par an [NV] [C], S1 et S2).
- Pas de publicité, pas de revente de données. C'est cohérent avec le produit : le journal reste dans l'extension (`PRODUCT.md`). C'est aussi un argument de confiance.

**On challenge, explicitement :**
1. « Partenaires *une fois très utilisé* » est le chemin de Pocket Universe : environ 200 000 utilisateurs, puis rachat à « sept chiffres » [NV] (Z3, S3). Le seuil de 8 000 utilisateurs de la mémoire est un seuil de **coût** (quotas gratuits), pas un seuil de **revenu**. Proposition : le particulier reste gratuit pour toujours, mais les pilotes B2B2C démarrent **tout de suite**, en parallèle. La base d'utilisateurs sert de preuve, pas de source de revenu.
2. « Partenaires » est trop vague pour un jury. On nomme trois payeurs et un levier : exchanges et fintechs (API), portefeuilles et plateformes (licence), plateformes d'agents IA (mandats), assureurs (levier, pas payeur).
3. « Conseiller ou orienter des partenaires » (apport d'affaires) n'est pas retenu comme revenu principal : taux de commission introuvable, et l'intermédiation d'assurance peut exiger un agrément (non vérifié, S1 M4).

Mémoire à mettre à jour si Titouan valide ce point.

---

## 3. Segments clients, priorisés

Ordre : du payeur le plus motivé par une perte chiffrée au moins motivé. Le particulier est l'utilisateur, pas le payeur.

| Rang | Segment | Problème | Valeur de Hold up | Disposition à payer |
|---|---|---|---|---|
| 1 | **Exchanges, néobanques crypto, fintechs** (retraits et paiements sortants) | Ils remboursent ou paient la fraude. Royaume-Uni : 249,6 M£ remboursés du 1er avril 2025 au 31 mars 2026, plafond 85 000 £ par réclamation, 88 % de la valeur perdue remboursée sur 18 mois [V, lu ce jour] (https://www.psr.org.uk/information-for-consumers/app-scams-reimbursement-dashboard/). Ce régime vise le fiat. UE : règlement PSR convenu, application vers fin 2027 ou début 2028, les transferts depuis un portefeuille auto-hébergé restent hors champ [NV] (S3). Coinbase a estimé 180 à 400 M$ de coûts après sa fuite de mai 2025 [NV] (S1) | Avant un retrait, le client écrit le motif (« je paie mon loyer à mon propriétaire »). Le code compare au montant, à la destination et à l'historique. Friction graduée. Journal daté : preuve que l'établissement a ralenti sur soupçon | **Élevée mais non prouvée.** Payeur clair (le coût évité est un remboursement). Aucun prix de marché par appel trouvé (S1, S2). Cycle de vente long [H] 6 à 12 mois. Analogie fiat vers crypto : argument, pas un fait |
| 2 | **Portefeuilles et plateformes** (MetaMask, Rabby, Core, Phantom, dApps) | Ils portent la confiance de l'utilisateur. Ils ont déjà Blockaid pour la réputation (Core depuis le 5 juin 2024 [V], S1). Ils n'ont pas de comparaison intention contre effet sur toute demande (non trouvé dans les docs lues, `RECHERCHE_concurrents_particuliers.md`) | Le module « Que veux-tu faire ? » en SDK, posé devant leur écran de confirmation. Il complète un scanner, il ne le remplace pas | **Moyenne.** Budget réel, mais habitude de racheter plutôt que de louer : Wallet Guard (MetaMask, 2024), Blowfish (Phantom, 2024), Fire et Pocket Universe (Kerberus) [V/NV] (S1, S3). Aucune licence avec prix public trouvée |
| 3 | **Développeurs d'agents IA qui dépensent** (PROSPECTIF) | Un agent qui détient un droit de dépense peut être détourné (OWASP Agentic ASI01, ASI03 ; piste 3 de la Track 1 : « chaîne d'autorité », « tokens très courts et révocables », « kill switch », `notion_guide.md`). Les infrastructures existent : Coinbase Agentic Wallets lancés le 11 février 2026 avec plafonds de dépense programmables [NV] (Decrypt, The Block via recherche ce jour) ; MetaMask Advanced Permissions (ERC-7715) lancées le 6 avril 2026, plafonds par période, expiration, révocation [V, lu ce jour] (https://metamask.io/news/introducing-advanced-permissions) | L'humain écrit un mandat en clair (« achète pour 25 USDC de cartes cadeaux chez ce marchand cette semaine »). Hold up le traduit en plafonds concrets, puis compare chaque action de l'agent à ce mandat. Journal avec la chaîne d'autorité | **Inconnue.** Marché naissant, aucun prix trouvé. Des projets de hackathon font déjà « intention déclarée contre effet » pour agents (Centaurion, Yakusoku) [V] (`RECHERCHE_concurrents_particuliers.md`) : la demande existe chez les développeurs, la disposition à payer n'est pas mesurée |
| 4 | **Assureurs et mutuelles de couverture** | Ils paient des sinistres qu'ils ne savent pas trier. MetaMask Transaction Shield exclut les transactions signalées malveillantes, les clés compromises et le pair à pair [V, lu ce jour] (https://support.metamask.io/manage-crypto/transactions/transaction-shield/). Coincover se décrit comme un pont qui fournit des données de risque à l'assureur [NV] (S3) | Un journal de ce que la personne a écrit et de ce qui lui a été montré, avant la signature. C'est une pièce de sinistre et un signal de souscription. Un utilisateur qui ne donne que ce qu'il a dit expose moins | **Levier, pas payeur.** L'assureur ne paie pas un logiciel ; il récompense un contrôle prouvé (S1 1.4). Aucune réaction d'assureur trouvée (S2 4.3) |
| 5 | **Particulier** | Il voit des octets, pas des conséquences (`PRODUCT.md`) | Gratuit, local, sans compte | **Faible.** Perte moyenne 790 $ en 2025 [V] ; les produits grand public qui gagnent de l'argent prennent une commission sur des swaps (Revoke Sidekick Standard : 0,8 % sur certains swaps [V, lu ce jour], https://revoke.cash/blog/2026/revoke-extension-update), flux que Hold up n'a pas. Seul sous-segment payant plausible : les gros détenteurs (Casa : 250 $/an en Standard [NV], S1) |

---

## 4. Modèles de revenu comparés

Quatre modèles, plus un levier et un modèle écarté. Les prix sont des hypothèses [H] ancrées sur des repères publics, faute de prix de marché comparables.

| | M1. API « verdict avant retrait » | M2. Licence SDK portefeuilles et plateformes | M3. Mandats pour agents IA (PROSPECTIF) | M4. Partenariat assurance (levier) |
|---|---|---|---|---|
| **Qui paie** | Exchange, fintech, néobanque | Portefeuille, dApp, plateforme | Plateforme d'agents, éditeur d'agent | L'assureur paie le sinistre ; Hold up fournit la preuve |
| **Ce qui est vendu** | Un verdict (correspond, ne correspond pas, invérifiable) par retrait ou paiement sortant, avec le journal | Le module intention, intégré à leur écran | La traduction d'un mandat écrit en plafonds, et la vérification de chaque action | Un journal d'intention exportable, et une population d'utilisateurs « au plus juste » |
| **Prix envisagé** | 0,005 à 0,02 $ par vérification [H] (S2 §3.2), avec un forfait minimum mensuel. Repère : GoPlus Security API de 199 $ à 3 499 $ par mois selon le volume [V, lu ce jour] (https://gopluslabs.io/security-api). Repère hors crypto : 0,15 à 1 $ par contrôle LCB-FT chez ComplyAdvantage [NV] (S2) | 25 à 250 k$ par an selon la taille [H] (S2 §3.4). Aucun prix concurrent public (Blockaid, Hypernative, Coincover introuvables) | Par vérification d'action, même ordre que M1 [H]. Aucun prix de marché | Commission ou remise de prime : taux introuvable. Repères de couverture : MetaMask Shield 99 $/an pour jusqu'à 10 000 $/mois [V, lu ce jour] ; Revoke Sidekick 30 000 $ de couverture Fairside, financée par 0,8 % sur certains swaps [V, lu ce jour] |
| **Avantages** | Payeur qui chiffre sa perte. Facturé en continu, donc hors du « piège Harpie » (revenu seulement après un vol, S1 §3). Répond au critère « s'intègre aux outils d'une fintech » | Même produit que l'extension. Distribution massive d'un coup. Pilote naturel dans l'écosystème Avalanche (Core, jury Team1) | Nouveau marché sans acteur dominant trouvé. Colle à la piste 3 de la Track 1. Le texte libre d'un humain est l'entrée naturelle d'un mandat | Rend la promesse tangible pour le particulier (« protégé et couvert »). Crédibilité devant KPMG et un assureur |
| **Risques** | Le produit actuel ne couvre pas les retraits d'exchange : à adapter (S3 §5.3). Cycle long. Solution interne possible (Binance Withdraw Protection, Coinbase Vault [NV], S1). Douleur réglementaire surtout fiat | Rachat plutôt que licence. Exigences : audit, SOC 2 de 30 à 110 k$ la première année selon des vendeurs de conformité [NV] (S1). Fausses alertes (CHIFFRES A4 : 13,9 % de rouges sur des honnêtes) | Le marché peut ne pas payer un tiers : Coinbase et MetaMask fournissent déjà les plafonds. Aucune mesure de Hold up sur des actions d'agents | Pas de revenu propre. Agrément d'intermédiaire possible. Responsabilité si un faux négatif est indemnisé |
| **Priorité** | **1** (premier revenu visé) | **2** (premier pilote, peut-être non payé) | **3** (pari à 2 ans) | **Levier** dès qu'un pilote produit des données |

**Écarté pour l'instant : abonnement premium particulier.** Repères : MetaMask Shield 9,99 $/mois [V], Revoke Premium 99 $/an et Ultimate 199 $/an [V] (S1), Webacy Pro 10 $/mois [NV]. Avec une structure de 3 personnes (290 k$ par an [H], S2), il faudrait environ 2 500 payeurs à 10 $/mois, soit environ 125 000 utilisateurs à 2 % de conversion [C] (S2 §3.3). C'est la taille de Pocket Universe, racheté à « sept chiffres ». Et c'est contraire à la décision de Titouan. À rouvrir seulement pour une offre « gros détenteurs » (alerte à un proche, double validation), jamais pour le grand public.

**Pourquoi M1 avant M2, alors que M2 est plus proche du produit.** M2 est le meilleur pilote (même code, distribution) mais le pire revenu (le portefeuille rachète). M1 est le meilleur revenu (le payeur rembourse déjà) mais demande d'adapter le produit. Plan : pilote M2 pour prouver, vente M1 pour vivre.

---

## 5. Économie unitaire

### 5.1 Coût d'une vérification

Deux versions du produit, deux coûts.

**Version autonome (celle du hackathon).** Elle tourne dans le navigateur, sans serveur ni réseau ; la phrase est lue par mots-clés (`PRODUCT.md`). Coût serveur marginal : **0 $** par vérification. Coût réel : maintenance, support, audits (fixes).

**Version serveur (B2B et extension enrichie).** Calcul de S2, revérifié ce jour sur les prix publics :

| Poste | Prix public | Statut |
|---|---|---|
| RPC Alchemy, paiement à l'usage | 0,525 $ par million de CU ; gratuit 30 M CU par mois | [V, lu ce jour] https://www.alchemy.com/pricing |
| Coût par méthode | eth_call 26 CU ; eth_getLogs 60 ; trace_call 40 ; eth_getCode, eth_getBalance, eth_estimateGas 20 ; alchemy_simulateAssetChanges 2 500 | [V, lu ce jour] https://www.alchemy.com/docs/reference/compute-unit-costs |
| Modèle Clef-flash (Cloudflare Workers AI) | 0,038 $ par million de tokens d'entrée ; Clef 0,240 $ ; sortie gratuite ; 10 000 Neurons gratuits par jour ; 0,011 $ pour 1 000 Neurons au-delà | [V, lu ce jour] https://developers.cloudflare.com/workers-ai/platform/pricing/ |
| Stockage du journal (R2) | 0,015 $ par Go-mois, sortie gratuite | [V via S2] https://developers.cloudflare.com/r2/pricing/ |

Calculs [C], avec les hypothèses de S2 sur le nombre d'appels (non instrumentées, facteur 2 à 3 possible) :
- Envoi simple : 232 CU x 0,525 $/M = **0,000122 $**.
- Approbation : 490 CU x 0,525 $/M = **0,000257 $**.
- Signature typée complexe : 750 CU x 0,525 $/M = **0,000394 $**.
- Appel au modèle Clef-flash : 1 800 tokens [H] x 0,038 $/M = **0,0000684 $** par appel. Si 30 % des vérifications l'appellent [H] : 0,0000205 $ par vérification.
- **Coût central par vérification : environ 0,00021 $** (mélange 60 % envois, 30 % approbations, 10 % signatures [H]). Fourchette : 0,00009 $ (RPC moins cher) à 0,00107 $ (haut de toutes les hypothèses) [C] (S2 §1.5).
- Une simulation managée seule (2 500 CU) coûte 0,0013 $ [C] : à éviter par défaut.

Ce que coûte Clef par appel est donc **connu** : 0,068 millième de dollar pour 1 800 tokens. Le modèle pèse environ 10 % du coût ; le RPC environ 90 % [C].

### 5.2 Coût par utilisateur et seuil des gratuités

- 10 vérifications par mois [H] x 0,00021 $ = **0,0021 $ par utilisateur et par mois** [C]. 100 000 utilisateurs : environ 210 $ par mois. 1 million : environ 2 100 $ par mois [C] (S2 §2).
- Quota Alchemy gratuit : 30 M CU / 361 CU moyens = environ 83 000 vérifications par mois, soit environ 8 300 utilisateurs à 10 opérations [C]. C'est l'origine du « 8 000 utilisateurs » de la mémoire.
- Quota Clef gratuit : 10 000 Neurons par jour / (1 800 x 3 455 / 1 000 000 = 6,2 Neurons par appel) = environ 1 600 appels par jour [C].

### 5.3 Prix de vente et marge

- À 0,005 $ par vérification, marge brute = (0,005 moins 0,0003) / 0,005 = **94 %** [C], avec 0,0003 $ de coût variable arrondi vers le haut (redondance RPC, journal) (S2 §3.2).
- Le calcul n'est jamais le problème. Le problème est le fixe et le temps de vente.

### 5.4 Ce que vaut un verdict pour l'acheteur (côté valeur)

- Exchange ou fintech : au Royaume-Uni, la première année du régime, 173 M£ ont été remboursés sur 188 000 réclamations éligibles [NV] (S1, via bratby.law). Soit environ 920 £ par réclamation éligible [C sur chiffres NV]. En prenant 1 £ au moins égal à 1 $, un seul remboursement évité paie plus de 90 000 vérifications à 0,01 $ [C].
- Particulier : 790 $ de perte moyenne par victime de drainer en 2025 [V]. Moyenne tirée par quelques gros vols ; médiane introuvable.

### 5.5 Seuils de rentabilité (structures de coût [H], S2 §3.1)

| Structure | Coût fixe annuel [H] | API seule à 0,005 $ | API seule à 0,01 $ | Licences seules à 100 k$ |
|---|---|---|---|---|
| Légère (2 fondateurs non payés, audit, assurance, juridique) | environ 35 k$ | 0,62 M vérifications par mois | 0,30 M | 1 licence (à 35 k$) |
| Base (3 personnes) | environ 290 k$ | 5,1 M par mois | 2,5 M | 3 licences |
| Moyenne (6 à 7 personnes) | environ 600 k$ | 10,6 M par mois | 5,2 M | 6 licences |

Formule [C] : volume mensuel = (fixe / 12) / (prix moins 0,0003 $).

### 5.6 Deux scénarios à 24 mois (PROSPECTIF, tout est [H])

| | Prudent (structure Base, 290 k$) | Central (structure Moyenne, 600 k$) |
|---|---|---|
| M2 licences | 2 x 40 k$ = 80 k$ | 4 x 60 k$ = 240 k$ |
| M1 API | 2 M vérif./mois x 0,005 $ x 12 = 120 k$ | 6 M x 0,008 $ x 12 = 576 k$ |
| M3 agents | 0 | 1 M x 0,005 $ x 12 = 60 k$ |
| Revenu | 200 k$ | 876 k$ |
| Coût variable (0,0003 $ par vérification) | 2 M x 12 x 0,0003 = 7 k$ | 7 M x 12 x 0,0003 = 25 k$ |
| Résultat | 200 moins 7 moins 290 = **environ moins 97 k$** | 876 moins 25 moins 600 = **environ plus 251 k$** |

Hors acquisition, hors impôts, hors abonnement particulier. Ce qui sépare les deux cas : le nombre de licences et le volume d'API, pas le coût de calcul [C].

---

## 6. Avantage défendable (moat), honnêtement

Aujourd'hui, Hold up n'a **pas** de fossé. Il a une avance et un début de méthode.

### Ce que MetaMask peut copier vite

| Élément | Pourquoi c'est copiable |
|---|---|
| Le champ « Que veux-tu faire ? » | MetaMask a déjà l'écran, les questions et le délai : son « Security check » demande « What's this payment for? » et impose 10 secondes avant « Continue anyway », mais seulement après un verdict Malicious ou un domaine listé, avec des choix fermés [V] (`RECHERCHE_metamask_couverture.md`). Élargir le déclencheur est « un changement de drapeau et de quelques lignes » |
| Le décodage, la simulation, la réputation d'adresse | Commodités (Blockaid, Rabby, Ledger, Tenderly) (S3 §2) |
| Le plancher de règles (illimité vers inconnu, appel délégué, changement de contrôle) | Règles connues, publiques |
| Le principe | Public depuis le billet de Vitalik Buterin du 22 février 2026 [NV] (Cointelegraph, `RECHERCHE_concurrents_particuliers.md`) |

### Ce qui est plus difficile à copier

| Élément | Pourquoi | Solidité |
|---|---|---|
| **La neutralité** | Une couche indépendante, devant n'importe quel portefeuille, et demain devant un retrait d'exchange ou un agent. MetaMask ne servira pas les utilisateurs de Rabby, ni le flux de retrait d'un exchange concurrent | Moyenne : Blockaid est aussi multi-portefeuilles, mais ne fait pas l'intention |
| **La mesure publique et rejouable** | Jeux scellés avec sha256 publié, une seule mesure, résultats négatifs publiés (CHIFFRES A6, A11, A12). Les vendeurs ne publient ni jeu ni définition de faux positif (S3 §1.3). Un vendeur a intérêt à ne pas être mesuré | Moyenne, et c'est le différenciateur le plus crédible. Copiable techniquement ; coûteux à adopter pour qui n'aime pas être mesuré |
| **Le corpus « phrase écrite contre demande réelle »** | Grille de 2 170 paires et 410 cas de décalage déjà construits (CHIFFRES A5, A11). Chaque pilote enrichit la façon dont les gens écrivent leur intention, sans stocker leurs données si le journal reste local et que seuls des cas consentis sont partagés | Faible aujourd'hui (mêmes auteurs que les règles), fort si un pilote apporte des phrases réelles consenties |
| **La traduction intention vers mandat** | Passer d'une phrase humaine à des plafonds ERC-7715 ou à une politique d'agent. Personne trouvé ne le fait pour un humain en texte libre | Pari, rien de prouvé |
| **La marque « rare pour être cru »** | Ne jamais rassurer à tort, jamais de vert (`PRODUCT.md`) | Fort mais lent ; Harpie et Wallet Guard ont fermé malgré une marque |
| **Les contrats B2B et le journal accepté par un auditeur ou un assureur** | Un exchange qui intègre un fournisseur le traite comme tiers critique (DORA [NV], S3) : coût de changement élevé | Fort si obtenu ; zéro aujourd'hui |

Lecture honnête : l'issue la plus probable d'une petite équipe de ce segment est une intégration ou un rachat (S1, S3 : Wallet Guard, Fire, Blowfish, Pocket Universe). Le modèle doit valoir même dans ce cas : une méthode mesurée et des contrats en cours valorisent le rachat. Ne pas promettre de licorne.

---

## 7. Feuille de route en trois horizons

### Maintenant (hackathon, 11 octobre 2026)

| Statut | Élément | Preuve |
|---|---|---|
| **FAIT** | Extension Chrome ou Edge, Manifest V3, autonome, sans serveur | `PRODUCT.md` |
| **FAIT** | Fenêtre « Que veux-tu faire sur ce site ? » avant la demande ; comparaison par code ; trois verdicts, jamais de vert ; règles de base indépendantes de la phrase ; journal local de 500 lignes | `PRODUCT.md` |
| **FAIT** | Grille de 2 170 paires, contrôle scellé : code seul, 86,6 % des décalages attrapés, 7,7 % de fausses alertes ; avec Clef-flash qui classe le type, 86,6 % et 1,3 % | CHIFFRES A11, A12 |
| **FAIT** | Mesure en chaîne des droits illimités : 47,6 % Ethereum, 34,2 % C-Chain | CHIFFRES B1 |
| **PROTOTYPÉ** | Relais Clef (hors version autonome) ; journal chaîné par hachage (version serveur seulement) ; pipeline strict où la couche ne peut qu'aggraver | `PRODUCT.md`, CHIFFRES A12, A15 |
| **LIMITES** | Jamais essayé avec un vrai portefeuille. 13,9 % de rouges sur des opérations honnêtes en conditions produit synthétiques. Jeu aveugle d'un autre auteur non passé. Contournements trouvés en revue interne, dont un critique. Aucun client, aucun test avec des personnes | `PRODUCT.md`, CHIFFRES A4, A6 |

### 6 mois (avril 2027) : PRÉVU

- Passer le jeu aveugle (A6) une fois, publier le résultat quel qu'il soit.
- Corriger les contournements, faire un audit externe court de l'extension (repère : audits Cure53 d'extensions de 6 à 12 jours [NV], S2).
- Publier sur le Chrome Web Store, gratuit, sans compte, avec mesure d'usage anonyme et volontaire.
- Un pilote portefeuille ou dApp (M2), viser l'écosystème Avalanche. Financement d'amorçage possible : infraBUIDL() nomme les portefeuilles dans son périmètre [V] (S1 1.7) ; Team1 Builder Grants jusqu'à 10 000 $ [NV] (S3).
- 15 entretiens exchanges et fintechs pour M1, avec une maquette « motif du retrait ».
- Prototype M3 : un mandat écrit traduit en permission ERC-7715 sur un réseau de test.

### 2 ans (octobre 2028) : PROSPECTIF

- M1 en production chez 2 à 4 plateformes ; M2 dans 2 à 4 portefeuilles ou dApps ; M3 en pilote chez une plateforme d'agents.
- Un partenaire de couverture qui accepte le journal comme pièce de sinistre (M4).
- Rapport public annuel : la mesure rejouée par un tiers.
- Fenêtre réglementaire : application du PSR européen vers fin 2027 ou début 2028 [NV] (S3) ; AI Act haut risque reporté à décembre 2027 (`notion_guide.md`).

---

## 8. Risques et réponses

| Risque | Gravité | Réponse |
|---|---|---|
| **MetaMask élargit son questionnaire** à toutes les demandes, en texte libre | Haute | C'est probable et c'est une validation. Réponses : (1) rester neutre et multi-surfaces (autres portefeuilles, retraits, agents) ; (2) vendre la mesure, pas le champ ; (3) viser le B2B où MetaMask n'est pas fournisseur ; (4) accepter l'issue « intégration » et la préparer |
| **Fausses alertes** | Haute | Aujourd'hui 13,9 % de rouges sur des honnêtes en conditions produit synthétiques (CHIFFRES A4) : c'est la limite principale. Avec Clef-flash, 1,3 % sur le contrôle scellé de la grille (A12). Règles : une intention ne baisse jamais un verdict (A7) ; métrique numéro un de chaque pilote ; seuil de sortie en section 9 |
| **Conformité** | Moyenne | Extension non dépositaire : hors MiCA directe selon un régulateur cité [NV] (S3). Client exchange soumis à DORA : nous serons tiers TIC, donc journal, audit, reproductibilité. RGPD : local par défaut ; la phrase peut contenir des données personnelles si le relais Clef est branché, à documenter (S2 §5). AI Act : le modèle ne fait qu'aggraver, jamais débloquer, argument de faible risque à valider. Tout est à faire valider par un juriste |
| **Responsabilité** (faux négatif suivi d'une perte) | Haute | Conditions sans promesse de résultat ; vocabulaire « retient et explique » ; journal de ce qui a été montré ; pas de revenu indexé sur les montants « sauvés ». En B2B : clause de limitation et assurance RC pro (2,5 à 7,5 k$ pour 1 M$ de limite sous 5 M$ de CA [NV], S2) |
| **Confiance** (extension de sécurité malveillante, faux Hold up) | Moyenne | Build reproductible, permissions minimales, code publié, version épinglée (S2 §5, famille 12). Pas de compte, pas de données collectées par défaut |
| **Fatigue et abandon** (un geste de plus à chaque demande) | Haute | La fenêtre ne s'ouvre que pour ce qui déplace de la valeur ou accorde un droit (`PRODUCT.md`). Le coût d'une approbation finie est inférieur à un centime [C] (CHIFFRES B9) : le vrai coût est le clic. À mesurer : taux de phrases vides ou « ok » |
| **Le payeur ne paie pas** (cycle long, pilotes gratuits) | Haute | Forfait minimum, pilote limité dans le temps avec critère de conversion écrit à l'avance, structure légère tant qu'aucun contrat n'est signé |
| **Dépendance à un fournisseur** (RPC, modèle) | Faible | Le modèle pèse 10 % du coût et n'est pas dans la version autonome ; RPC multi-fournisseurs |

---

## 9. Indicateurs de succès et expériences à mener

Les seuils ci-dessous sont des **objectifs que nous fixons** [H], pas des mesures. Chaque expérience a un seuil de poursuite et un seuil d'arrêt écrits avant de commencer.

| # | Expérience | Indicateur | Poursuivre si | Arrêter ou pivoter si | Délai |
|---|---|---|---|---|---|
| E1 | Entretiens payeurs M1 (exchanges, néobanques, fintechs) | Nombre d'entretiens ; lettres d'intention pour un pilote | 15 entretiens, au moins 3 lettres d'intention | Moins de 1 lettre sur 15 | 8 semaines |
| E2 | Pré-vente d'un pilote payant M1 ou M2 | Montant signé | Au moins 1 pilote payé (forfait de quelques milliers d'euros [H]) | Aucun pilote payé après 6 mois : revenir au modèle « subvention puis rachat » | 6 mois |
| E3 | Jeu aveugle A6, une seule ouverture | Rappel rouge et fausses alertes rouges | Rappel rouge au moins 80 % avec fausses alertes rouges au plus 5 % [H] | Fausses alertes rouges au-dessus de 10 % : ne pas vendre M1 ni M2 avant correction | Avant tout pilote |
| E4 | Publication sur le Chrome Web Store | Installations ; rétention à 4 semaines | 2 000 installations en 3 mois ; 30 % encore actifs à 4 semaines | Moins de 500 installations : la vitrine ne sert pas, tout miser sur M2 | 3 mois |
| E5 | Mesure d'usage volontaire et anonyme | Part de phrases vides ou « ok » ; part d'annulations après « Ça ne correspond pas » ; part de « Continuer quand même » | Phrases inutilisables au plus 20 % ; au moins 1 annulation sur 3 après un écart | Phrases inutilisables au-dessus de 40 % : revoir le geste (choix guidés plus texte) | 3 mois |
| E6 | Fausses alertes en usage réel (honnêtes, opt-in) | Rouges sur opérations honnêtes | Au plus 2 % | Au-dessus de 5 % | 3 mois |
| E7 | Prototype M3 (mandat vers ERC-7715) | Une plateforme d'agents qui teste | 1 test externe | Aucun intérêt après 10 contacts | 6 mois |
| E8 | Contact assureur ou mutuelle (M4) | Lettre d'intérêt pour lire le journal | 1 lettre | Aucune réponse : garder M4 hors du pitch | 12 mois |

Indicateur unique à suivre chaque mois : **nombre de demandes retenues qui dépassaient ce que la personne avait écrit**, avec le taux de fausses alertes de la même période. Jamais l'un sans l'autre (règle de CHIFFRES).

---

## 10. Ce qu'on dit au jury

### Script de 45 secondes (environ 120 mots)

> « Il faut cesser de donner plus que nécessaire. Sur Ethereum, près d'un droit de dépense sur deux est illimité, d'après notre mesure sur la chaîne. Le jour où le site qui le détient est compromis, la personne perd ce qu'elle a laissé prendre. Chez LI.FI en 2024, les approbations illimitées ont perdu 11,6 millions ; les approbations finies, rien.
>
> Hold up demande "Que veux-tu faire ?" avant chaque demande, et retient tout ce qui dépasse.
>
> Le particulier ne paie pas : c'est gratuit et local. Ceux qui paient sont ceux qui remboursent la fraude : exchanges et fintechs, avec une API de verdict avant retrait, et les portefeuilles, avec une licence. Demain, le même mandat écrit bornera les agents IA qui dépensent pour nous. »

À l'oral, si on demande la source : 47,6 % sur Ethereum, échantillon interne (CHIFFRES B1) ; LI.FI selon son rapport (B7). Ne pas dire « la norme ».

### Six réponses aux questions probables

1. **« Qui paie, concrètement ? »**
   Pas le particulier. Ceux qui portent la perte : les plateformes qui remboursent. Au Royaume-Uni, 249,6 millions de livres ont été remboursés en un an pour la fraude par virement autorisé. C'est du fiat, l'analogie avec la crypto reste à prouver. Notre premier client visé est un exchange ou une fintech ; notre premier pilote, un portefeuille.

2. **« MetaMask peut ajouter votre champ demain. »**
   Oui. Il pose déjà une question, mais seulement quand la menace est déjà connue, en choix fermés, sans la comparer à la demande. S'il l'élargit, il valide l'idée. Notre valeur est ailleurs : une couche neutre devant tout portefeuille, un retrait ou un agent, et une mesure publique que nous rejouons devant vous.

3. **« Combien coûte une vérification ? »**
   Zéro dans la version autonome : tout tourne dans le navigateur. En version serveur, environ deux dixièmes de millième de dollar, d'après les prix publics d'Alchemy et de Cloudflare. À un demi-cent de prix de vente, la marge brute dépasse 90 %. Le calcul n'est pas le problème ; le temps de vente l'est.

4. **« Vos fausses alertes vont tuer l'usage. »**
   C'est notre limite principale et nous la publions : 13,9 % de rouges sur des opérations honnêtes en conditions synthétiques. Avec le modèle qui classe le type d'intention, 1,3 % sur notre contrôle scellé. Le seuil d'un pilote est écrit à l'avance : au-delà de 5 % en usage réel, on ne vend pas.

5. **« Si votre outil se trompe, qui est responsable ? »**
   Hold up ne signe rien et ne garde aucune clé. Il retient et explique ; la personne décide. Chaque décision laisse une ligne datée de ce qui a été montré. En B2B, contrat sans promesse de résultat et assurance responsabilité. Pas de revenu indexé sur des montants « sauvés ».

6. **« Pourquoi ne pas finir comme Harpie ? »**
   Harpie était payée après le vol. Nous facturons un service continu, avant la signature, à des plateformes. Et nous assumons l'issue probable du secteur : intégration ou rachat. Une méthode mesurée et des contrats en cours rendent cette issue meilleure.

---

## Sources

Lues ce jour (WebFetch) :
- https://www.psr.org.uk/information-for-consumers/app-scams-reimbursement-dashboard/
- https://support.metamask.io/manage-crypto/transactions/transaction-shield/
- https://metamask.io/news/introducing-advanced-permissions
- https://revoke.cash/blog/2026/revoke-extension-update
- https://gopluslabs.io/security-api
- https://www.alchemy.com/pricing
- https://www.alchemy.com/docs/reference/compute-unit-costs
- https://developers.cloudflare.com/workers-ai/platform/pricing/

Vues en résultat de recherche ce jour, non relues [NV] :
- https://decrypt.co/357862/morning-minute-coinbase-gives-ai-agents-their-own-wallets
- https://www.theblock.co/post/389524/coinbase-rolls-out-ai-tool-to-give-any-agent-a-wallet
- https://www.paymentsjournal.com/coinbase-unveils-agentic-wallets-to-power-autonomous-ai-spending-and-investing

Reprises des fichiers du dépôt (statut du fichier d'origine) :
- ScamSniffer 2025 : https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ [V] (CHIFFRES B3)
- LI.FI : https://li.fi/knowledge-hub/incident-report-16th-july/ [V] (CHIFFRES B7)
- ethereum.org : https://ethereum.org/en/guides/how-to-revoke-token-access/ [V]
- Blockaid et Core : https://blockaid.io/blog/blockaid-bolsters-security-on-avalanche-with-core-integration [V] (S1)
- Blockaid série B : https://www.theblock.co/news/regulation/2025-02-18-blockaid-closes-50-million-series-b-machine-learning-security-341601 [V/NV] (S1, BM_MARCHE)
- Wallet Guard : https://consensys.com/blog/consensys-acquires-wallet-guard-to-enhance-metamask-security (S1)
- Phantom et Blowfish : https://phantom.com/learn/blog/phantom-acquires-blowfish (S1)
- Pocket Universe et Kerberus : https://www.msspalert.com/brief/kerberus-moves-into-crypto-antivirus-with-pocket-universe-deal [NV] (S3)
- Harpie : https://www.theblock.co/news/business/2025-03-27-coinbase-web3-security-shop-harpie-announces-shutdown-348421 [V] (Z3)
- Remboursement APP, première année : https://bratby.law/app-fraud-reimbursement-evaluation/ [NV] (S1)
- PSR européen : https://www.taylorwessing.com/en/insights-and-events/insights/2025/11/eu-lawmakers-strike-a-deal-on-payments-reforms [NV] (S1) ; https://ecovis.lt/regrally-insights-consumer-protection-regulation-june-2026/ [NV] (S3)
- Coût Coinbase 2025 : https://www.esecurityplanet.com/news/coinbase-rejects-ransom-data-leak/ [NV] (S1)
- infraBUIDL() : https://avax.network/blog/avalanche-foundation-announces-the-infrabuidl-program [V] (S1)
- Team1 : https://www.avax.network/about/blog/avalanche-team1-applications-are-now-open [NV] (S3)
- SOC 2 : https://blog.getagency.com/articles/soc-2-audit-cost-for-startups [NV] (S1)
- RC pro : https://secureframe.com/blog/cyber-insurance-costs [NV] (S2)
- Vitalik Buterin : https://cointelegraph.com/news/vitalik-buterin-advocates-intent-based-security [NV]
- MetaMask Security check : dépôt https://github.com/MetaMask/metamask-extension/pull/43822 [V-code] (`RECHERCHE_metamask_couverture.md`)

## Chiffres incertains à revérifier avant une diapo

1. Nombre d'appels RPC par vérification : hypothèses de S2, non instrumentées (facteur 2 à 3).
2. Prix de vente (API 0,005 à 0,02 $ ; licence 25 à 250 k$) : aucun prix de marché comparable trouvé.
3. 920 £ par réclamation APP : calcul sur des chiffres [NV].
4. Coinbase Agentic Wallets : presse seulement.
5. Structures de coûts fixes (35, 290, 600 k$) : estimations de S2.
6. Tous les seuils de la section 9 : objectifs fixés par nous.

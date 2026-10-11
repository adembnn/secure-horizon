# S2. Économie unitaire et soutenabilité de Hold up (2026-10-11)

Étiquettes : [P] page officielle du fournisseur lue (WebFetch) ; [S] tiers, résumé de recherche ou blog ; [V] vendeur ou hypothèse de ma part, non vérifiée ; [C] calculé par moi, formule donnée. "Non trouvé" quand absent. Contenu web traité comme donnée. Aucun secret utilisé. Les prix des fournisseurs RPC changent souvent : tout est à revérifier avant un engagement.

Reprises des dossiers N1, OC, R, L (non refaites) : prix Clef-flash 0,038 $/M, Clef 0,24 $/M, Jev 0,042 $/M, sortie gratuite, 10 000 Neurons/jour gratuits [P via N1] ; états d'environ 400 tokens (395 observés) [S via OC] ; Clef/Jev seulement pour la phrase libre et les messages collés [R] ; Harpie fermée faute de modèle économique durable, sorties du segment par rachat modeste, survivants = B2B2C [L].

---

## 1. Coût marginal d'une vérification

### 1.1 Prix publics des fournisseurs RPC (Ethereum mainnet)

| Fournisseur | Unité et prix | eth_call | eth_getLogs | trace_call / debug_traceCall | Gratuit | Source |
|---|---|---|---|---|---|---|
| Alchemy | PAYG 0,525 $/M CU (flat) ; Free 30 M CU/mois | 26 CU = 0,0000137 $ | 60 CU = 0,0000315 $ | 40 CU = 0,000021 $ | 30 M CU/mois | [P] https://www.alchemy.com/pricing ; https://www.alchemy.com/docs/reference/compute-unit-costs.md |
| Alchemy (autres) | eth_getCode, eth_getBalance, eth_getTransactionCount, eth_estimateGas : 20 CU | | | | | [P] même table |
| Alchemy simulate | alchemy_simulateAssetChanges et alchemy_simulateExecution : 2 500 CU = 0,00131 $ par appel (96 fois eth_call) | | | | | [P] même table ; [C] 2500 x 0,525e-6 |
| QuickNode | Build 49 $/mois (80 M crédits, surcoût 0,62 $/M) ; Accelerate 249 $ (450 M, 0,56 $/M) ; Scale 499 $ (950 M, 0,53 $/M) ; Business 999 $ (2 Md, 0,50 $/M) ; essai 10 M | 20 crédits = 0,0000112 $ (à 0,56 $/M) | 20 crédits | 40 crédits (trace_call : inféré, la page ne le nomme pas) | essai 10 M | [P] https://www.quicknode.com/pricing ; https://www.quicknode.com/api-credits |
| dRPC | tarif plat depuis le 2 juin 2025 : 20 CU par requête, toute méthode, 0,30 $/M CU, donc 6 $ par million de requêtes = 0,000006 $ | 0,000006 $ | 0,000006 $ | 0,000006 $ | non trouvé | [S] résumé de recherche de https://blog.drpc.org/announcing-flat-pricing-simple-transparent-fair/ ; une page de doc affiche encore l'ancienne grille |
| Infura (MetaMask) | crédits : eth_call 80, eth_getLogs 255, trace_call 300 ; gratuit 3 M crédits/jour (500 crédits/s) ; Developer 15 M/jour ; Team 75 M/jour. Prix en dollars : non trouvé sur les pages officielles ; un tiers donne 50 $/mois (Developer) et 225 $/mois (Team) | 80 | 255 | 300 | 3 M crédits/jour = environ 37 500 eth_call/jour [C 3e6/80] | [S] https://docs.infura.io/get-started/pricing/ (via résumé) ; prix [S faible] |
| Chainstack | unités de requête (RU) : 1 RU par appel récent, 2 RU pour debug/trace et appels sur état ancien ; Pro 199 $/mois pour 80 M RU (+25 M offerts selon un tiers) ; Developer gratuit 3 M RU/mois | 1 RU = 0,0000019 à 0,0000025 $ [C 199/105e6 ; 199/80e6] | 1 RU | 2 RU = 0,0000038 à 0,000005 $ | 3 M RU/mois | [S] https://docs.chainstack.com/docs/request-units.md ; tarif Pro d'un article comparatif Chainstack (concurrent, à prendre avec prudence) |
| Ankr | PAYG 0,10 $ pour 1 M crédits ; EVM : 200 crédits par requête = 0,00002 $ ; dépôt minimum 10 $ | 0,00002 $ | 0,00002 $ | 0,00002 $ (supposé identique, non confirmé) | non trouvé pour Premium | [S] https://www.ankr.com/docs/rpc-service/pricing/ (via résumé) |
| PublicNode | gratuit, sans clé, limites par IP non publiées ; conditions d'usage commercial : non trouvé ; recommandé pour tests, pas pour production, pas pour trace/archive | 0 $ | 0 $ | probablement indisponible | tout | [S] https://ethereum.org/tr/developers/tools/publicnode-allnodes/ ; OnFinality (concurrent) |
| Tenderly | l'ancienne grille donnait Free 120 000 simulations/mois, Starter 160 000 (environ 42-50 $/mois), Pro 300 000 (réintroduit en mai 2024). La page actuelle (lue) ne montre plus de prix : Free sans API, offre "Console" sur devis | 160 000 simulations pour environ 50 $ = 0,0003 $ par simulation si le quota est consommé [C 50/160000] | | | Free : sans API | [P] https://tenderly.co/pricing (lue) ; [S] ancien tarif, non reconfirmé |

Ruptures et incohérences à retenir. (a) Alchemy : un tracker tiers annonce 0,525 $/M, la page officielle le confirme (les articles de support annonçaient encore 0,45 puis 0,40 $/M). (b) dRPC : la grille ancienne coexiste avec le tarif plat. (c) Chainstack : un tableau d'un article annonce un multiplicateur 40 pour debug_traceCall, contredit par la doc (2 RU) ; j'ai retenu la doc. (d) Infura : le prix en dollars manque, donc aucun coût en dollars Infura n'est calculé ci-dessous.

### 1.2 Simulation par fork
- Anvil (Foundry) en mode fork : logiciel libre, coût de licence nul. Le coût marginal est celui des appels RPC amont que le fork fait paresseusement (un eth_getStorageAt ou eth_getCode par emplacement non encore mis en cache). Le nombre d'appels amont par simulation n'est pas documenté : non trouvé. Hypothèse [V] : 30 à 150 appels froids pour une transaction de routeur, 300 pour un chemin complexe ; cache chaud sur les contrats populaires.
- Coût amont [C] : 60 appels x 20 CU = 1 200 CU = 0,00063 $ (fourchette 300 à 3 000 CU : 0,00016 à 0,0016 $). Un fork froid peut donc coûter plus qu'un alchemy_simulateAssetChanges (0,00131 $) s'il ne profite pas du cache. Avec dRPC à 0,000006 $/appel : 60 appels = 0,00036 $.
- Nœud propre : un nœud complet Ethereum fait disparaître le coût par appel. Loyer hébergé : 600 $/mois [V, hypothèse, non cherché]. Point d'équilibre contre Alchemy [C 600 / 0,00019 par vérification] : environ 3,2 M vérifications/mois ; contre dRPC [C 600 / 0,00009] : environ 6,7 M/mois. Par chaîne supplémentaire, multiplier. Donc pas de nœud propre avant plusieurs millions de vérifications par mois et par chaîne, sauf besoin de confidentialité (ne pas envoyer les adresses à un tiers).

### 1.3 Modèle de décision (Clef / Jev)
Hypothèses explicites [V] :
- état + 5 à 6 questions : 900 tokens par passe ; deux passes en ordre permuté (OC §2) : 1 800 tokens par appel au modèle ;
- seulement 30 % des vérifications passent par le modèle (phrase libre ou message collé ; le reste est du code) ;
- fourchette : 500 à 6 000 tokens ; message collé long ou captures : plus (image jusqu'à 1 024 tokens chacune [P via N1]).

Coût par appel au modèle [C = tokens x prix/M] : Clef-flash 1 800 x 0,038e-6 = 0,0000684 $ ; Jev 1 800 x 0,042e-6 = 0,0000756 $ ; Clef 1 800 x 0,24e-6 = 0,000432 $. Pondéré à 30 % : 0,0000205 $ (flash), 0,0000227 $ (Jev), 0,00013 $ (Clef). Le modèle pèse donc un dixième du coût RPC avec flash, de l'ordre du coût RPC avec Clef 27B.

Quota gratuit : 1 800 tokens x 3 455 Neurons/M = 6,2 Neurons par appel flash [C] ; 10 000 Neurons/jour / 6,2 = environ 1 600 appels modèle par jour (soit 48 000 par mois) gratuits. Avec Clef, 1 800 x 21 818/M = 39 Neurons, soit 255 appels par jour.

### 1.4 Journal, bande passante, calcul
- Journal côté serveur (offre B2B uniquement) : 2 Ko par entrée [V] ; R2 à 0,015 $/Go-mois, opération d'écriture (classe A) 4,50 $/M, sortie gratuite [P] https://developers.cloudflare.com/r2/pricing/. Une écriture par vérification non regroupée : 0,0000045 $ [C 4,5e-6] ; regroupée par lots de 100 : environ 0,00000005 $. Stockage : 1 M vérifications/mois x 2 Ko = 2 Go/mois ; 12 mois = 24 Go = 0,36 $/mois [C]. Négligeable.
- Côté particulier : le journal local reste dans l'extension (coût 0 et bon pour le RGPD).
- Workers : 5 $/mois, 10 M requêtes incluses, 0,30 $/M au-delà, 30 M ms de CPU incluses puis 0,02 $/M ms [P] https://developers.cloudflare.com/workers/platform/pricing/. Une requête de 10 ms de CPU = 0,0000003 + 0,0000002 = environ 0,0000005 $ [C].
- Bande passante : pas de frais de sortie sur R2/Workers [P] ; les octets RPC sont inclus dans le prix du fournisseur. Je retiens 0,000001 $ de "divers" par vérification (hypothèse [V], arrondi).

### 1.5 Trois profils : appels supposés [V] et coût [C]

Appels supposés (hypothèses de ma part, à mesurer sur l'extension réelle) :
- A, simple envoi : 1 trace_call (40 CU) + 2 eth_call (52) + 3 appels légers getCode/getBalance/getTransactionCount (60) + 1 eth_getLogs (60, recherche de poussière/empoisonnement d'adresse) + 1 estimateGas (20) = 232 CU ; 8 appels.
- B, approbation : 2 trace_call (80) + 5 eth_call (130) + 4 légers (80) + 3 eth_getLogs (180) + 1 estimateGas (20) = 490 CU ; 15 appels.
- C, typed data complexe (Permit2, Seaport) : 5 simulations en contextes et horizons différents (R §2 famille 5) = 5 trace_call (200) + 8 eth_call (208) + 5 légers (100) + 4 eth_getLogs (240) = 748, arrondi 750 CU ; 22 appels.
Fourchettes CU : A 100 à 400 ; B 250 à 900 ; C 400 à 1 500.

Coût RPC par vérification [C], fournisseur par fournisseur (formule : somme des appels x prix unitaire) :

| Profil | Alchemy PAYG | QuickNode (0,56 $/M) | dRPC plat | Chainstack Pro | Ankr PAYG |
|---|---|---|---|---|---|
| A (232 CU ; 8 appels) | 0,000122 $ | 0,000101 $ (180 crédits) | 0,000048 $ | 0,000017 à 0,000022 $ (9 RU) | 0,000160 $ |
| B (490 CU ; 15 appels) | 0,000257 $ | 0,000190 $ (340 crédits) | 0,000090 $ | 0,000032 à 0,000042 $ (17 RU) | 0,000300 $ |
| C (750 CU ; 22 appels) | 0,000394 $ | 0,000302 $ (540 crédits) | 0,000132 $ | 0,000051 à 0,000067 $ (27 RU) | 0,000440 $ |

Chainstack n'est avantageux que dans la limite du quota prépayé (199 $ pour 80 à 105 M RU) ; au-delà, un tiers cite 12,5 $/M RU, non confirmé. Les valeurs Chainstack/dRPC ne tiennent pas compte de la qualité des traces ni de la disponibilité sur trace_call, à tester.

Coût total par vérification (RPC Alchemy + modèle Clef-flash à 30 % + 0,000001 divers, journal regroupé) [C] :

| Profil | Total central (Alchemy + flash) | Variante bon marché (dRPC + flash) | Variante Alchemy + Clef 27B | Variante simulateAssetChanges seul |
|---|---|---|---|---|
| A simple envoi | 0,000143 $ | 0,000070 $ | 0,000252 $ | 0,00131 $ + modèle ≈ 0,0013 $ |
| B approbation | 0,000279 $ | 0,000112 $ | 0,000388 $ | idem |
| C typed data complexe | 0,000415 $ | 0,000154 $ | 0,000524 $ | idem |

Fourchette globale pondérée (mélange 60 % A / 30 % B / 10 % C, hypothèse [V]) :
- bas (dRPC + flash) : 0,6 x 0,000070 + 0,3 x 0,000112 + 0,1 x 0,000154 = 0,00009 $ ;
- central (Alchemy + flash) : 0,6 x 0,000143 + 0,3 x 0,000279 + 0,1 x 0,000415 = 0,00021 $ ;
- haut (CU en haut de fourchette = 0,6x400 + 0,3x900 + 0,1x1 500 = 660 CU = 0,000347 $ ; modèle Clef à 50 % x 6 000 tokens = 0,00072 $ ; journal non regroupé 0,0000055 $) : environ 0,00107 $.
Conclusion : une vérification coûte entre 0,01 et 0,11 cent, centre 0,02 cent (0,21 millième de dollar).

---

## 2. Coût par utilisateur actif et par mois

Formule [C] : coût/utilisateur/mois = x opérations x coût par vérification. Hypothèse centrale x = 10 opérations vérifiées par mois [V, aucun chiffre trouvé sur l'usage moyen d'un particulier ; un utilisateur DeFi actif en fait plus]. Sensibilité x = 3, 10, 30.

| Coût par vérification | x = 3 | x = 10 | x = 30 | Total mensuel à 1 000 util. (x=10) | à 100 000 (x=10) | à 1 000 000 (x=10) |
|---|---|---|---|---|---|---|
| Bas 0,00009 $ | 0,0003 $ | 0,0009 $ | 0,0027 $ | 0,9 $ | 91 $ | 905 $ |
| Central 0,00021 $ | 0,0006 $ | 0,0021 $ | 0,0063 $ | 2,1 $ | 211 $ | 2 112 $ |
| Haut 0,00107 $ | 0,0032 $ | 0,0107 $ | 0,0322 $ | 10,7 $ | 1 072 $ | 10 720 $ |

Totaux pour x = 3 et x = 30 au centre : 1 000 util. = 0,6 $ et 6,3 $ ; 100 000 = 63 $ et 633 $ ; 1 M = 633 $ et 6 334 $ par mois. Haut x = 30 : 1 M d'utilisateurs = 32 160 $/mois.

Détail du cas 1 M d'utilisateurs, x = 10, central [C] : 10 M vérifications/mois ; RPC = 10 M x 361 CU moyens x 0,525e-6 = 1 896 $ ; modèle flash = 3 M appels x 1 800 tokens x 0,038e-6 = 205 $ (Clef 27B : 1 296 $) ; journal/divers = 10 $ ; total environ 2 110 $/mois. Le coût de calcul ne dépasse pas deux mille dollars par mois pour un million d'utilisateurs.

Franchissement des gratuités [C] :
- Alchemy gratuit : 30 M CU / 361 CU moyens = environ 83 000 vérifications/mois. À x = 10, soit environ 8 300 utilisateurs sans payer le RPC.
- Cloudflare gratuit : 48 000 appels modèle/mois (flash, 1 800 tokens) = 160 000 vérifications à 30 %. Donc à 1 000 utilisateurs (10 000 vérifications/mois) la facture variable est nulle ; à 100 000 utilisateurs on la paie intégralement.
- Les 10 000 Neurons/jour gratuits sont par compte : ils ne soutiennent pas une montée en charge, mais couvrent tout le pilote.

Remarque : ces chiffres ne comptent ni la surveillance en arrière-plan (suivi des soldes, des approbations ouvertes) ni les envois d'alertes, qui peuvent multiplier le nombre d'appels. Non chiffré.

---

## 3. Seuil de rentabilité par modèle de revenu

### 3.1 Structure de coûts fixes (hypothèses [V], à valider)
| Structure | Contenu | Coût annuel |
|---|---|---|
| Léger | deux fondateurs non rémunérés, audit annuel 15 k$, assurance 6 k$, juridique/RGPD 8 k$, infra et outils 6 k$ | environ 35 k$ |
| Base | 3 personnes (2 ingénieurs + 1 analyste règles) à 65 k$ chargé = 195 k$, audit 30 k$, assurance 12 k$, juridique/RGPD 15 k$, SOC 2 25 k$, infra 13 k$ | environ 290 k$ |
| Moyen | 6 à 7 personnes, avec vente et support | environ 600 k$ |
Détail des postes en §5.

### 3.2 Gratuit + B2B2C par appel
Volume d'équilibre mensuel [C] : V = F/12 / (p - c), avec c = 0,0003 $ (coût variable arrondi vers le haut, y compris redondance de fournisseur RPC et journal d'audit exigé par un exchange).

| Prix par vérification p | Léger (35 k$) | Base (290 k$) | Moyen (600 k$) |
|---|---|---|---|
| 0,001 $ | 4,2 M/mois | 34,5 M/mois | 71 M/mois |
| 0,002 $ | 1,7 M | 14,2 M | 29,4 M |
| 0,005 $ | 0,62 M | 5,1 M | 10,6 M |
| 0,01 $ | 0,30 M | 2,5 M | 5,2 M |
| 0,02 $ | 0,15 M | 1,2 M | 2,5 M |
| 0,05 $ | 0,06 M | 0,49 M | 1,0 M |

Marge brute à p = 0,005 $ : (0,005 - 0,0003)/0,005 = 94 %. Le calcul n'est jamais le problème ; le seuil dépend du volume et du temps de vente.

Quel prix ? Repères de marché trouvés : GoPlus affiche 199 $/mois pour 6 M "CU" (grille chinoise, non reconfirmée en anglais, le nombre de CU par appel d'API de sécurité : non trouvé) [S] https://gopluslabs.io/zh/security-api ; Chainalysis propose un contrôle de sanctions gratuit et réserve le contrôle d'adresse complet aux contrats d'entreprise sur devis [S] ; Blockaid : prix non publics [S] ; un blog tiers cite 0,15 à 1 $ par contrôle LCB-FT chez ComplyAdvantage [S, hors crypto, ordre de grandeur]. Aucun tarif par appel pour un contrôle avant retrait n'a été trouvé. Ma recommandation [V] : fourchette 0,005 à 0,02 $ par vérification (0,5 à 2 cents), soit 5 à 20 $ pour mille retraits, ancrée sur la valeur évitée (un retrait contesté coûte un dossier de support de l'ordre de plusieurs dollars chez un exchange [V, non sourcé]) et non sur notre coût. À 1 000 retraits/jour (30 000/mois), l'exchange paierait 150 à 600 $/mois : trop peu pour nous porter. Il faut donc des volumes de plusieurs millions par mois ou un forfait minimum (licence, §3.4).

### 3.3 Abonnement premium particulier
Repères de prix [S sauf mention] : Ledger Recover 9,99 $/mois (rejet de la communauté, selon L) ; Revoke.cash Ultimate 199 $/an, 10 portefeuilles, surveillance et révocation automatique, paiement unique d'un an [P/S] https://revoke.cash/premium ; Webacy Pro 10 $/mois selon sa page de prix, un annuaire donne 100 $/an de départ [S] https://webacy.com/pricing ; Casa : Standard 250 $/an, Premium 2 100 $/an, Private Client 7 500 $/an [P] https://casa.io/pricing ; Unchained : prix non trouvés. Webacy : 500 k$ d'ARR auto-déclarés [S, soumission au Stellar Community Fund] ; le chiffre de 30 000 utilisateurs vient du dossier L et je ne l'ai pas retrouvé ici, donc non reconfirmé ; s'il était exact, l'ARR par utilisateur serait de 16,7 $ par an [C 500 000/30 000], très en dessous du prix catalogue, donc seule une minorité paie.

Payeurs nécessaires [C] : N = F / marge annuelle par payeur, marge = prix - (2,9 % x prix + 0,30 $ de frais de paiement [V, tarif Stripe générique]) - 0,04 $ de calcul - 0,60 $ de support [V].

| Prix annuel | Marge/payeur | Léger : payeurs (util. à 2 %) | Base : payeurs (util. à 1 % / 2 % / 4 %) | Moyen : payeurs (util. à 2 %) |
|---|---|---|---|---|
| 39 $ | 36,9 $ | 948 (47 k) | 7 853 (785 k / 393 k / 196 k) | 16 247 (812 k) |
| 60 $ | 57,4 $ | 611 (31 k) | 5 059 (506 k / 253 k / 126 k) | 10 468 (523 k) |
| 120 $ (10 $/mois) | 115,6 $ | 303 (15 k) | 2 509 (251 k / 125 k / 63 k) | 5 191 (260 k) |
| 199 $ | 192,5 $ | 182 (9 k) | 1 508 (151 k / 75 k / 38 k) | 3 120 (156 k) |

Lecture : la conversion gratuit vers payant de 1 à 4 % est une hypothèse [V] ; aucune donnée de conversion du segment n'a été trouvée. Pour comparaison : Pocket Universe a atteint environ 200 000 utilisateurs, Fire 50 000 à 60 000 [S via L]. Avec la structure Base, il faut près de 125 000 utilisateurs à 10 $/mois avec 2 % de conversion : c'est le niveau de Pocket Universe, racheté à "sept chiffres" seulement. L'abonnement seul tient dans la structure Légère, pas dans la structure Base. Le coût d'un utilisateur gratuit étant d'environ 0,025 $/an (0,0021 x 12), la gratuité n'est pas ce qui coûte ; ce qui coûte, ce sont le fixe et l'acquisition (non chiffrée ici).

### 3.4 Licence SDK
Aucun prix de licence concurrent trouvé (Blockaid, Hypernative, Coincover : non publics). Hypothèse [V] : 25 à 250 k$/an selon le volume de la plateforme (un portefeuille ou fintech de taille moyenne). Équilibre [C] : Léger 35 k$ = 1 licence à 35 k$ ; Base 290 k$ = 3 licences à 100 k$ (ou 2 à 145 k$) ; Moyen 600 k$ = 6 licences à 100 k$. Les licences se vendent lentement (cycles de six mois ou plus [V]) et L montre que les petites équipes finissent absorbées par un portefeuille : le scénario réaliste est une licence puis un rachat.

### 3.5 Revenu par utilisateur actif du partenaire
Si le partenaire paie par MAU : équilibre Base = 290 000 / 12 / 0,02 $ par MAU et par mois = 1,2 M MAU à 0,02 $ ; 242 000 MAU à 0,10 $ [C]. Prix de marché par MAU : non trouvé.

---

## 4. Pertes évitées contre coût

### 4.1 Les chiffres du pitch
- Scam Sniffer 2025 : 83,85 M$ perdus, 106 106 victimes, baisse de 83 % et 68 % par rapport à 2024 [S] https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/ (via résumé ; le même rapport est relayé par plusieurs sites). Chiffres issus des seuls drains EVM observés, donc plancher.
- Perte moyenne : 83 850 000 / 106 106 = 790,2 $ par victime [C]. Calcul de ma part, pas du rapport. Une moyenne tirée vers le haut par quelques gros vols (11 cas supérieurs à 1 M$ [S]) : la médiane est plus basse, non trouvée. Le pitch "790 $" est donc au mieux une moyenne, à ne pas présenter comme le cas typique.
- R §3 : l'utilité maximale de l'outil porte sur les signatures malveillantes analysables (environ 84 M$), plus petite catégorie en valeur face aux portefeuilles compromis (713 M$) et aux escroqueries par transferts conformes (≥ 14 Md$) [P/S via R]. Le potentiel de pertes évitables est donc borné par ce plafond.

### 4.2 Combien de pertes éviter pour rentabiliser
Principe : si le payeur (assureur, portefeuille, exchange) rétribue une part s de la perte évitée, il faut éviter L = F / s de pertes, soit L / 790,2 victimes [C]. Harpie prenait 7 % [P via L], valeur utilisée comme repère bas de s.

| Structure | s = 100 % | s = 20 % | s = 10 % | s = 7 % |
|---|---|---|---|---|
| Léger (35 k$) | 44 victimes (35 k$) | 221 (175 k$) | 443 (350 k$) | 633 (500 k$) |
| Base (290 k$) | 367 (290 k$) | 1 835 (1,45 M$) | 3 670 (2,9 M$) | 5 243 (4,14 M$) |
| Moyen (600 k$) | 759 (0,6 M$) | 3 797 (3,0 M$) | 7 593 (6,0 M$) | 10 847 (8,6 M$) |

En part des 106 106 victimes de 2025 : Base à 10 % = 3,5 % ; Base à 7 % = 4,9 % ; Moyen à 7 % = 10,2 %.
Pénétration implicite [C] : victimes évitées = 106 106 x pénétration x rappel x taux d'annulation après friction. Avec rappel 0,8 (mesuré sur les approbations Ethereum seulement, R3 [P via R]) et annulation 0,5 [V] : facteur 0,4. Base à 10 % exige 3 670 / (106 106 x 0,4) = 8,6 % de pénétration de la population exposée aux drainers ; à 7 % : 12,4 %. Léger à 10 % : 1,0 %. Ces taux d'annulation et le rappel sur les typed data sont non mesurés [R : "NON"]. Le chiffre de 80 % ne vaut que pour les approbations Ethereum.

Le coût variable n'est jamais le goulot. Perte évitée par vérification = P(attaque) x 0,4 x 790 $. Seuil : c / (0,4 x 790,2) = 0,00021 / 316 = 6,6e-7. Tant que plus d'une opération sur 1,5 million est un drain, le coût marginal est inférieur à la perte évitée. À P = 1e-4, une perte évitée coûte 0,00021 / (1e-4 x 0,4) = 5,3 $ de calcul pour 790 $ évités (rapport 150). P réel : non trouvé.
Le goulot est le fixe, la distribution, et le fait que le particulier non protégé ne paie pas (L).

### 4.3 Prouver la perte évitée à un assureur
Ce qu'un assureur demandera [V, aucun cahier des charges d'assureur trouvé] : fréquence et gravité avant/après. Preuves à construire :
1. Mode ombre : journaliser les verdicts sans friction pendant N semaines (journal horodaté et signé, hors ligne si possible), puis croiser avec les incidents étiquetés indépendamment (Scam Sniffer, SEAL 911, drains observés dans les 24 h sur chaîne).
2. Taille d'échantillon [C, formule n = z²p(1-p)/e², z = 1,96] : rappel de 80 % à ± 10 points : 62 positifs ; à ± 5 points : 246 positifs. Faux positifs à 0,23 % (R3) estimés à ± 0,1 point : 8 815 négatifs. R indique 300 à 400 positifs comme cible de preuve : cohérent.
3. Effet de la friction : essai à bras multiples (R8, petit n) mesurant l'annulation après avertissement ; effet causal difficile sans groupe témoin, d'où l'intérêt d'un déploiement échelonné chez un partenaire (moitié des utilisateurs avec friction, moitié en mode ombre) [V].
4. Rapport d'audit externe de l'extension, comme ExpressVPN (audit Cure53 de six jours, rendu public) [S].
5. Exclusions écrites : famille 10 (hors transaction), 11 (parcours conformes), signatures non décodées = "inconnu" (R §3).
Ce qu'un assureur donne en retour : remise de prime ou couverture dédiée : non trouvé ; hypothèse non vérifiée.

---

## 5. Coûts cachés

| Poste | Fourchette annuelle | Base de l'estimation |
|---|---|---|
| Audit de sécurité de l'extension et du backend | 10 à 70 k$ (central 25-30 k$), à répéter à chaque changement majeur | durées des audits Cure53 d'extensions : 6 à 12 jours, équipes de 1 à 5 [S] ; tarif de référence 6 000 $ par auditeur-semaine (Zealynx, audit de contrats, hors périmètre exact) [S] ; Cure53/Trail of Bits : tarifs non trouvés. Le chiffre est une extrapolation [V] |
| Maintenance des règles (suivi des nouvelles familles d'attaques, sélecteurs, types EIP-712, mises à jour des fournisseurs) | 0,5 ETP d'analyste = environ 30 à 50 k$ ; coût réel proportionnel au nombre de familles (12 dans R) | R : "régénérer sélecteurs et types depuis les dépôts officiels avant codage" ; ETP à 65 k$ chargé [V] |
| Support | 0,01 à 0,05 $ par utilisateur et par mois [V] ; avec 100 000 utilisateurs gratuits : 12 à 60 k$/an | hypothèse ; chaque faux positif bloquant est un ticket |
| Responsabilité (un faux négatif suivi d'une perte) | non chiffrable ; clauses de limitation de responsabilité, conditions générales, devoir de conseil | à valider par un juriste |
| Assurance RC pro / cyber | 2,5 à 7,5 k$ pour 1 M$ de limite sous 5 M$ de CA ; 5 à 20 k$ pour une fintech ; une citation d'assureur (article non daté) donne 30 à 100 k$ pour 1 M$ en fintech ; garanties "fraude par virement" souvent sous-plafonnées | [S] https://secureframe.com/blog/cyber-insurance-costs ; https://www.businessinsurance.com/insuring-fintech-firms-presents-challenges/ ; une assurance E&O pour un contrôle de retrait d'exchange (plafonds 2 à 5 M$) serait au haut de la fourchette [V] |
| Conformité RGPD | DPIA initiale 5 à 15 k$, conseil/DPO externe 5 à 20 k$/an [V] | adresses de portefeuille, IP, phrases libres et messages collés : données personnelles (une adresse publique associée à une personne est une donnée à caractère personnel, point à confirmer par un juriste) ; message collé peut contenir des numéros de compte ou des noms. Minimisation : traitement local par défaut, aucun journal serveur pour le particulier, effacement du message collé, minimisation des champs envoyés à Cloudflare (sous-traitant, accord de traitement à signer, localisation des données : non trouvé) |
| Conformité client B2B | SOC 2 Type II 20 à 60 k$ [V], questionnaires de sécurité, sous-traitance | exigée par les exchanges/fintechs ; cadre DORA/LCB-FT pour les clients : non étudié |
| Fournisseur unique de modèle | risque : changement de prix ou de modèle (Clef lancé le 1er octobre 2026, première semaine de latences instables [S via N1]) | N1 |
| Sécurité de l'outil lui-même (famille 12) | build reproductible, signature, revue des dépendances | R : un faux Snap ou une extension compromise est un risque propre |

Ordre de grandeur cumulé hors salaires : 60 à 200 k$/an dès la structure Base [C somme des fourchettes centrales : audit 28 + assurance 12 + juridique/RGPD 15 + SOC 2 25 + support 12 + outils 13 = 105 k$]. C'est plusieurs centaines de fois le coût variable de calcul de la structure Base (par exemple 100 000 utilisateurs x 10 x 0,00021 x 12 = 2,5 k$/an).

---

## 6. Trois hypothèses de marge et sensibilité

Tous les chiffres sont des scénarios [V] fondés sur les hypothèses ci-dessus, pas des prévisions.

| | Prudente (structure Base, fixe 290 k$) | Centrale (structure Moyen, fixe 600 k$) | Optimiste (fixe 1,8 M$) |
|---|---|---|---|
| Licences SDK | 2 x 40 k$ = 80 k$ | 4 x 60 k$ = 240 k$ | 8 x 100 k$ = 800 k$ |
| B2B2C par appel | 2 M/mois x 0,005 $ x 12 = 120 k$ | 6 M/mois x 0,008 $ x 12 = 576 k$ | 20 M/mois x 0,01 $ x 12 = 2,4 M$ |
| Abonnement | 600 payeurs x 60 $ = 36 k$ | 3 000 payeurs x 80 $ = 240 k$ | 15 000 payeurs x 100 $ = 1,5 M$ |
| Revenu | 236 k$ | 1 056 k$ | 4,70 M$ |
| Coût variable (calcul à 0,0003 $, frais de paiement, utilisateurs gratuits) | 9 k$ | 35 k$ | 154 k$ |
| Marge brute | 96 % | 97 % | 97 % |
| Résultat net | environ -63 k$ (-27 %) | environ +421 k$ (+40 %) | environ +2,75 M$ (+58 %) |

Calculs : prudente 236 - 9 - 290 = -63 ; centrale 1 056 - 35 - 600 = 421 ; optimiste 4 700 - 154 - 1 800 = 2 746 (k$) [C]. Hors acquisition d'utilisateurs, hors vente, hors impôts. La marge brute élevée est structurelle (calcul négligeable) ; ce qui sépare les trois cas, ce sont les ventes de licences et le volume B2B.

Sensibilité du scénario central (résultat net en k$ ; abonnement et licences inchangés, 480 k$ ; coût 0,0003 $ par appel ; 12 k$ d'autres variables ; fixe 600 k$) [C] :

| Volume B2B (millions/mois) | p = 0,004 $ | p = 0,008 $ | p = 0,012 $ |
|---|---|---|---|
| 3 M | +1 k$ | +145 k$ | +289 k$ |
| 6 M | +134 k$ | +422 k$ | +710 k$ |
| 12 M | +401 k$ | +977 k$ | +1 553 k$ |

Formule : net = 480 + 12 V (p - 0,0003) - 12 - 600 en k$ avec V en millions/mois. Autre sensibilité : si le coût variable passe du central au haut (0,00107 $ par vérification, §1.5), le net central baisse de 72 M x (0,00107 - 0,0003) = 55 k$ (5 points) : le prix de revient n'est pas la variable sensible ; la sensibilité principale est le nombre de licences et le prix par appel.

Sensibilité à la structure de coût (abonnement seul, 10 $/mois) : fixe 35 k$ → 303 payeurs ; 290 k$ → 2 509 ; 600 k$ → 5 191 (voir §3.3).

---

## 7. Chiffres dont je ne suis pas sûr
1. Alchemy 0,525 $/M CU : lu sur la page officielle ; deux pages de support indiquaient encore 0,45/0,40 $/M ; l'impact est ± 15 % sur le RPC.
2. dRPC à 20 CU plat : issu d'un résumé de recherche, page officielle non lue ; la page technique ancienne affiche toujours l'ancienne grille.
3. Infura : prix en dollars non trouvé ; Chainstack Pro 199 $ vient d'un article d'un concurrent ; Ankr trace/getLogs supposés au même prix.
4. Nombre d'appels par profil (A 8, B 15, C 22) : mes hypothèses, à instrumenter sur l'extension. C'est la plus forte incertitude du §1 (facteur 2 à 3 plausible).
5. Nombre d'appels amont d'un fork Anvil : non documenté.
6. Hypothèses d'usage : 10 opérations/mois, mélange 60/30/10, 30 % de passage par le modèle, 1 800 tokens : toutes à mesurer. Le modèle n'est décisif sur le coût que si on utilise Clef 27B sur de longs messages ou des images.
7. Prix de revient du nœud propre (600 $/mois) : non sourcé.
8. Coûts fixes (salaires, audit, SOC 2, DPO) et prix de licence : estimations de ma part ; aucun tarif Cure53/Trail of Bits, Blockaid, Hypernative ou Coincover trouvé.
9. Conversion gratuit vers payant (1-4 %), taux d'annulation après friction (50 %), part de la perte évitée payée (7-20 %) : hypothèses, non mesurées.
10. Webacy : 30 000 utilisateurs non reconfirmé ; ARR auto-déclaré. Ledger Recover 9,99 $ repris de L sans nouvelle lecture. Prix Unchained : non trouvé.
11. Une assurance RC pro adaptée à un contrôle avant retrait (API pour exchanges) : devis réel non trouvé ; la fourchette 30-100 k$ vient d'un article non daté.
12. Les données de pertes (Scam Sniffer) sont un plancher d'observation ; la moyenne de 790 $ est calculée par moi.

---

## Résumé en 10 lignes
1. Coût d'une vérification : 0,00009 $ (dRPC + Clef-flash) à 0,00107 $ (haut), centre 0,00021 $ ; A simple envoi 0,00014 $, B approbation 0,00028 $, C typed data 0,00042 $ (Alchemy + flash) [C, hypothèses sur le nombre d'appels].
2. Le RPC pèse environ 90 % du coût ; le modèle (Clef-flash, 1 800 tokens, 30 % des cas) environ 10 % ; journal, Workers, bande passante sont négligeables ; Clef 27B rapproche le modèle du coût RPC.
3. Les appels les plus chers sont les simulations managées : alchemy_simulateAssetChanges coûte 2 500 CU (0,0013 $), 96 fois un eth_call ; un fork froid d'Anvil peut coûter autant sans cache ; nœud propre rentable seulement au-delà de 3 à 7 M vérifications/mois.
4. Par utilisateur actif : 0,002 $/mois à 10 opérations (0,0006 à 0,0063 $ pour 3 à 30) ; total 2 $ à 1 000 utilisateurs, 211 $ à 100 000, 2 112 $ à 1 M (haut : 10 720 $) ; sous 8 000 utilisateurs, les quotas gratuits couvrent tout.
5. Le calcul n'est donc pas le problème ; le fixe l'est : environ 35 k$ (fondateurs seuls), 290 k$ (3 personnes) ou 600 k$ (6-7) par an, dont 60 à 200 k$ hors salaires (audit, assurance, RGPD, SOC 2, support).
6. B2B2C par appel : à 0,005-0,02 $ la vérification, équilibre à 5,1 à 1,2 M vérifications/mois en structure Base ; aucun prix de marché par appel trouvé.
7. Abonnement : à 10 $/mois et 2 % de conversion, structure Base = 2 509 payeurs soit 125 000 utilisateurs (niveau de Pocket Universe, racheté pour "sept chiffres") ; tient en structure légère, pas au-delà ; cohérent avec Harpie et L.
8. Pertes évitées : 790 $ de moyenne [C] ; à 10 % de la valeur évitée captée, il faut éviter 3,5 % des victimes de 2025 (3 670), soit 8,6 % de pénétration avec rappel 0,8 x annulation 0,5 ; le coût de calcul est négligeable devant la perte évitée dès que P(drain) dépasse 7e-7.
9. Preuve à un assureur : mode ombre, 62 positifs pour un rappel ± 10 points, 8 800 négatifs pour mesurer les FP, audit externe, exclusions écrites ; réaction de l'assureur : non trouvée.
10. Marges : prudente -27 % (-63 k$), centrale +40 % (+421 k$), optimiste +58 % ; marge brute 96-97 % ; sensibilité dominante : licences et volume B2B, pas le coût de calcul. 12 chiffres incertains listés au §7.

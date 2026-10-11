# U3 - Efficacité mesurée des interventions (avertissement, friction, délai) et part des pertes évitable par Sentinelle

Date : 2026-10-11. Méthode : WebSearch/WebFetch, plus lecture locale (pdftotext) de trois PDF primaires : OBIE février 2021, CeDEx Nottingham 2023-08, Guan et al. USENIX Security 2026. Fichiers internes lus d'abord : OB_snaps_et_avertissements.md, R8_grilling_intention_et_friction.md, REGLES_avertissements.md. Aucun secret lu ou écrit.

Étiquettes : **[P]** source primaire que j'ai lue moi-même dans cette session (article, PDF, page officielle, billet de la banque) ; **[S]** secondaire (presse, blog, résumé de moteur, chiffre repris d'un fichier interne non relu) ; **[V]** déclaration d'un vendeur ou d'une entreprise sur son propre produit, non auditée ; **[C]** calculé avec la formule indiquée ; **[H]** hypothèse de ma part, non prouvée. "Non trouvé" = absent des sources consultées. Rien n'est inventé : tout chiffre sans étiquette [P]/[S]/[V] est [C] ou [H].

Limite : WebFetch/WebSearch passent par un petit modèle. Les chiffres [P] ci-dessous viennent de PDF que j'ai extraits en texte brut, donc fiables ; les autres sont des paraphrases. Une page (ePrint 2026/1310) contenait, d'après le moteur de recherche, du texte déguisé en consigne système ; il a été ignoré, le contenu scientifique était cohérent avec la page USENIX.

---

## 0. Lecture rapide (5 constats)

1. **L'effet comportemental existe et est grand quand la victime n'est pas coachée** : annulation d'un phishing d'approbation en simulation wallet 1,3 % (témoin) contre 19,7 % (avertissement passif), 32,9 % (délai de 5 s) et 48,6 % (avertissement actif sur le spender) [P]. En banque simulée, l'ajout d'un geste d'annulation fait passer la fraude de 22 % à 4 % (-81 % relatif) [P].
2. **Sur le terrain, les effets sont plus modestes** : Monzo mesure 23 à 30 % de paiements risqués stoppés par un écran d'avertissement, puis 60 à 70 % d'efficacité pour un blocage avec appel à l'action (1 client sur 6 le contourne) [P, billet de la banque]. NAB : 12 % de paiements abandonnés sur alerte, quatre premiers mois [P/S].
3. **Aucun effet mesuré en conditions réelles pour les alertes crypto (Blockaid, Pocket Universe, Wallet Guard, Revoke, Rabby)** : seulement des totaux "protégés" de vendeurs, sans dénominateur ni taux de contournement [V].
4. **Le plafond est la détection, pas le comportement** : avec les rappels du banc (80 % sur approbations directes, 82 % filet complet, ~0 sur fraude conforme) et la répartition des pertes, la part de pertes évitable est **~1 % (0,2 à 5 %) du périmètre global** et **~38 % (13 à 72 %) du périmètre "natif wallet" signatures + adresses empoisonnées** (section 6).
5. **Le plus gros gisement (pig butchering, faux support) est la fraude conforme** : la transaction est valide, l'intention déclarée est vraie ("j'investis"). Seul le refroidissement ou l'intervention humaine y agit ; aucune de ces mesures n'est évaluée proprement en crypto.

---

## (a) Avertissements navigateur et wallet

### a.1 Navigateur : Akhawe & Felt (USENIX Security 2013)
- 25 405 944 impressions de télémétrie. Outrepassement ("clic-through") SSL : **Chrome 70,2 %, Firefox 33,0 %** ; phishing : Chrome 18,0 %, Firefox 9,1 % ; malware : Chrome 23,2 %, Firefox 7,2 % [P, via REGLES_avertissements (relu à la source) et page USENIX confirmée par recherche]. Stop = 1 - clic-through : SSL 30 % / 67 %, phishing 82 % / 91 %, malware 77 % / 93 %.
- Le nombre de clics n'explique pas l'écart (Firefox SSL en demande 3, Chrome 1) ; 47 % des outrepassements se font en moins de 1,5 s [P via REGLES]. L'écart relève du design et de la population (jusqu'à 15 points sur 37 dus à la population selon REGLES).
- Egelman 2008 : phishing réussi 0 % avec avertissement actif Firefox 2, 45 % IE7 actif, 90 % IE7 passif [P via Akhawe, repris par REGLES]. Le "79 %" de OB n'est pas vérifié : ne pas le citer.
- Les études de labo surestiment l'outrepassement (55 à 95 % en labo contre 33 % terrain, Akhawe § 7.2 [P via REGLES]).

### a.2 Wallet : la seule expérience contrôlée trouvée (Guan et al., USENIX Security 2026)
Titre : "Designing Wallet-Based User Intervention for Approval Phishing Mitigation". n = 364 (Prolific, entre-sujets, 5 conditions) + 23 entretiens ; 6 tâches DeFi dont une approbation de phishing vers un spender contrôlé par l'attaquant ; les auteurs **ne mesurent pas la détection** (ils supposent un détecteur) [P, PDF lu].

| Condition | Annulation phishing | Annulation tâche bénigne (faux positif) |
|---|---|---|
| Témoin | **1,32 %** | 0,00 % |
| Suggestion de plafond (cap) | 0,00 % (mais 31,25 % posent un plafond contre 1,97 % témoin) | 0,00 % |
| Avertissement spender passif | 19,72 % (non significatif après correction) | 2,46 % |
| Délai de confirmation (5 s) | **32,88 %** (significatif) | 2,05 % |
| Avertissement spender actif | **48,61 %** (significatif) | 3,82 % |

Lectures : (i) l'avertissement actif ajoute +47,3 points (48,61 - 1,32) ; (ii) le délai de 5 s seul ajoute +31,6 points, pas de différence significative avec l'actif ; (iii) peu de participants identifient réellement le spender comme suspect (11,3 % en actif) : une partie annule par prudence générale ; (iv) 59,7 % de ceux qui voient la suggestion de plafond n'en posent pas quand même. Coût : 2 à 4 % d'annulations de tâches bénignes. Limite : tâches de labo, participants informés qu'ils font des tâches wallet, pas de coach au téléphone ; moitié sans expérience Web3.

### a.3 Wallet : explication en langage clair (TxSum / MATEX, arXiv 2512.06933)
Résumé de l'abstract [S/P abstract] : sur 187 transactions Ethereum complexes, l'explication structurée au niveau des flux de jetons fait passer la compréhension de 52,9 % à 76,5 % et le **rejet de transactions malveillantes de 36,0 % à 88,0 %** par rapport à la meilleure référence, avec faible rejet à tort. Protocole utilisateur, taille d'échantillon et nature de la référence : non lus (PDF non relu). C'est un effet de **détection par la victime** (comprendre), proche de notre "Tu as dit / En réalité".

### a.4 Audits de wallets (existence des alertes, pas leur effet)
- Adresse empoisonnée, 53 wallets Ethereum : seuls 3 (Bybit, Ctrl, OKX) affichent un avertissement explicite pour une adresse signalée ; 4 demandent une confirmation pour destinataire inconnu (OneKey, Phantom, Rabby, Uniswap) ; 4 un rappel ; 42 rien ; 16 affichent des transferts de faux jetons [P, arXiv 2508.12107 lu via résumé de page].
- SlowMist eth_sign : 4 extensions sur 20 donnent un avertissement [S].
- MetaMask documente lui-même que ses alertes n'empêchent pas de perdre ses fonds et qu'on peut confirmer malgré l'alerte [P, support.metamask.io via recherche].
- **Taux d'ignorance des alertes de wallet en conditions réelles : non trouvé.** Aucune étude publique de proceed-rate de MetaMask/Blockaid/Rabby/Pocket Universe.

### a.5 Personnalisation et friction (effets isolés)
- Personnalisation "reprendre les mots de l'utilisateur" : effet isolé **non trouvé** (même conclusion que OB, R8, REGLES). Preuve indirecte : Monzo, itération 3 (éducation personnalisée à l'historique de dépenses) a stoppé **moins** (23 %) que l'itération 2 générique (30 %) [P, billet Monzo], ce qui rappelle que "personnalisé" ne garantit pas "plus efficace".
- Friction par délai : +31,6 points (5 s, wallet simulé) [P] ; autres délais (Singapour, Australie) sans évaluation isolée (voir b.4).
- Habituation : activité visuelle en forte baisse dès la 2e exposition (Anderson/Vance [S]) ; CeDEx : l'efficacité des avertissements comportementaux s'estompe avec l'exposition répétée, pas celle du geste d'annulation [P, voir b.2].

---

## (b) Banque

### b.1 OBIE février 2021 (expériences randomisées, UK) [P, PDF lu]
n = 8 606 analysés sur ~10 000 visés (nationalement représentatif, argent incité mais fictif), 3 paiements dont 1 frauduleux (facture de cuisine, ordinateur Facebook Marketplace, impôts HMRC). **Témoin : 22 % font le paiement frauduleux, 57 % des paiements légitimes réalisés.**

| Bras | Δ fraude (points) | Fraude finale | Fraude évitée en relatif [C = Δ/22] | Δ paiements légitimes (points) |
|---|---|---|---|---|
| Comportemental seul | -4 | 18 % | -18 % | -6 |
| Appels à l'action (CTA : annuler, mettre de côté, appeler la banque) | -12 | 10 % | -55 % | -14 |
| CTA + comportemental | -14 | 8 % | -64 % | -20 |
| Basé sur le risque seul | +1 (n.s.) | 23 % | 0 % | +8 |
| Risque + CTA | **-18** | **4 %** | **-82 %** | -7 |
| Risque + comportemental + CTA | -16 | 6 % | -73 % | -8 |

Scénario ordinateur (témoin 32 %) : risque + CTA -26 points. Effet par rang d'exposition : les traitements comportementaux marchent moins si la fraude arrive en 3e scénario ; seuls les CTA tiennent. Expérience 2 (CoP côté PISP) : variante 2 +6 points de fraude (n.s. selon sous-échantillon ~1 500).
Les auteurs notent : labo, les effets réels peuvent différer ; la perte de paiements légitimes est peut-être surestimée.

### b.2 CeDEx Nottingham 2023-08 (Åkesson, Gathergood, Quispe-Torreblanca) [P, PDF lu]
Échantillon recruté 15 888, 8 958 analysés (même plan que OBIE). Résultats chiffrés trouvés dans le texte :
- Risque + CTA : fraude **22 % -> 4 %** ; "81 % moins probable de tomber" [P]. Par scénario : réduction relative 81,25 %, 84,85 %, 82,35 % (cuisine, ordinateur, impôts) [P].
- Avertissements comportementaux : **-18 %** relatif, mais l'effet "décroît avec l'exposition répétée à la fraude" [P].
- **Le "-94 %" est confirmé, avec son contexte** : quand la fraude arrive au 3e scénario, risque + CTA baisse la fraude de 94 % (18 % -> 1 %) ; quand elle arrive au 1er scénario, -81 % (27 % -> 5 %) [P]. Ce n'est PAS un effet moyen : c'est le meilleur sous-groupe d'un bras.
- Paiements légitimes : 57 % -> 50 % pour risque + CTA (le pire bras CTA perd ~36 % relatif) [P].
- Participants de 55 ans et plus : CTA -16 points de fraude, plus sensibles aux CTA que les jeunes [P].

### b.3 Résultats réels de banques et régulateurs
| Source | Chiffre | Nature | Étiquette |
|---|---|---|---|
| **Monzo, billet "purchase scams"** | Itération 1 (urgence/vol) : 25 % des paiements "risqués" stoppés ; itération 2 (éducation générique) : **30 %** ; itération 3 (personnalisée) : ~23 % ; itération 4 = **blocage du paiement** (remplace les écrans) : "1 client sur 6 contacte quand même la banque pour payer", blocage "60 à 70 % efficace contre la fraude" ; >1 M£ de transactions empêchées depuis ; Monzo dit que les écrans génériques sont devenus insensibles | A/B réels, la banque ; "risqué" = scoré, inclut des légitimes ; dénominateur et méthode de l'efficacité "60-70 %" non publiés | [P] billet lu, chiffres [V] au sens "auto-déclarés" |
| Monzo, billet APP (1er août 2024) | 4,7 M£ de fraude stoppés en 2023 ; +55 % de fraude empêchée en 2024 vs 2023 ; valeur des fraudes déclarées -24 % (PSR 2023), usurpation -48 % ; **aucun chiffre sur les appels d'intervention humaine ni sur le nombre d'avertissements** | Auto-déclaré | [P]/[V] |
| Monzo, arnaque à l'emploi (presse) | -41 % de clients touchés, -63 % de pertes depuis septembre | Presse, pas un essai contrôlé | [S] |
| **NAB (Australie)** | **12 % des paiements abandonnés** sur alerte en temps réel (4 premiers mois, 2023) ; >100 M AUD abandonnés cumulés à juillet 2024 ; 48,5 M AUD en 2 mois (janvier 2025) ; dénominateur non publié | Communiqués de la banque | [S]/[V] |
| Revolut | "nous avons stoppé près de deux fois plus de clients" (phrase tronquée) ; détection des paiements par carte d'arnaques à l'investissement : **-30 % de pertes** | Réponse à la BBC, auto-déclaré | [S]/[V] |
| Westpac (2022) | >11 000 paiements bloqués, 1,2 M AUD ; "99 % de ces paiements n'ont pas lieu" | Essai interne, blocage dur | [S]/[V] |
| UK Banking Protocol (intervention humaine : personnel d'agence + police) | **55,5 M£ en 2022, 60,7 M£ en 2021, 258,2 M£ cumulés depuis 2016** ; dernière valeur nationale trouvée = 2022 | UK Finance, "fraude empêchée" ; nombre de cas et taux d'arrêt par appel : non trouvés | [S] |
| PSR / régime APP depuis 7 oct. 2024 | pertes APP **-21 % (-73 M£) la 1re année** ; 88 % de remboursement ; refus pour "négligence grave" ~3 % | Évaluation PSR via commentaire Pay.UK / Plenitude ; effet des avertissements non isolé | [S] |
| Confirmation of Payee | -2 % de fraude totale, -1 % APP (S1 2023), attribués à l'ensemble ; ~8 % des adultes continueraient malgré un "no match" (enquête commanditée Lloyds) ; Lloyds : paiements vers entreprises sans CoP jusqu'à 100 fois plus signalés frauduleux | Pay.UK/Lloyds | [S] (via OB) |
| Hong Kong FPS | 20 à 30 % des utilisateurs poursuivent malgré l'alerte | Repris de OB | [S] |
| Australie, revue ASIC | les banques détectaient et stoppaient ~13 % des paiements d'arnaque de leurs clients avant l'accord | Rapport parlementaire | [S] |
| Avertissements et refus de remboursement | Which? : 49 % des clients ne savaient pas que les banques avaient introduit de nouveaux avertissements ; Tunic Pay/Opinium : 33 % disent lire les avertissements | Enquêtes déclaratives | [S] |

**Questions de finalité du paiement** : taux de contournement et part de faux motifs : **non trouvés** (confirme OB et R8). Les décisions d'ombudsman montrent des victimes coachées qui trompent la banque sur le motif et des avertissements jugés trop génériques ; Barclays, Starling, Monzo ne publient pas de proceed-rate. Interventions "bank intervention calls" (appels humains) : **aucun taux d'arrêt publié par Monzo, Starling ou Barclays** ; seuls les cas individuels d'ombudsman (victime convaincue que le banquier est le fraudeur).
**Intervention humaine tierce (FBI Operation Level Up)** : 4 323 victimes d'investissement crypto notifiées ; **76 %** ne savaient pas qu'elles étaient victimes ; économie estimée ~285 M$ (jan. 2024 - jan. 2025) ; des victimes disent avoir renoncé à liquider leur retraite ou à vendre leur maison [S/V, communiqué FBI relayé par presse ; 77 % cité par erreur dans la demande : la presse dit 76 %]. Pas de taux d'arrêt calculable (nombre de victimes qui continuaient : non trouvé).

### b.4 Délais de refroidissement
- Singapour : nouveau bénéficiaire 12 h (DBS et autres) ; depuis le 15 oct. 2025, 24 h de rétention ou rejet si solde >= 50 000 S$ et plus de la moitié sort ; les mesures cumulées auraient évité 78 M S$ en 7 mois ; cas d'arnaque -26 % au S1 2025 ; Money Lock 5,4 Md S$ verrouillés [S]. **Aucun avant/après isolé du délai.**
- Australie : accord Scam-Safe (CoP, avertissements, délais) ; pertes -26 % sur 2024 (-700 M AUD), crypto -74 % sur le T4 2023, pas attribuables au seul délai [S]. Choice : victimes déclarent que la moitié des arnaques auraient été évitées par un délai de 24 h [S, déclaratif].
- Pays-Bas : baisse "de près de moitié" des pertes d'usurpation après limites par défaut + délai, selon un blog de vendeur sans données [V].
- Opinion : 75 % jugent un retard jusqu'à 72 h inefficace (Tunic Pay) [S via OB].
- Wallet : délai de 5 s : +31,6 points d'annulation en simulation [P, a.2].

### b.5 Dark patterns et friction éthique
Aucune étude chiffrée de l'effet des dark patterns sur ces interventions : non trouvé. OBIE donne le seul coût mesuré de la friction : -6 à -20 points de paiements légitimes complétés selon le bras ; le risque seul **augmente** de 8 points les légitimes [P]. Wallet : 2 à 4 % d'annulations bénignes [P].

---

## (c) Crypto : effets rapportés par les outils (tous [V], sauf mention)

| Outil | Chiffre rapporté | Verdict de preuve |
|---|---|---|
| **Blockaid** (page "end user protection") | "431 Md$+ protégés", "585 M+ attaques stoppées", "14,7 Md$+ de pertes évitées" ; "améliore la précision de détection de 25 %+" sans base ; taux de FP : non mentionné ; ancienne page : 5,3 Md$+ de fonds protégés, 71 M+ attaques, 20 M+ utilisateurs | [V] page lue ; définition de "protégé" et dénominateur absents ; chiffres incohérents entre deux versions de la page |
| **MetaMask + Blockaid** (communiqué 2023) | adoption moyenne 4 % de l'ancienne option ; "vol d'actifs de 500 M$ évité" ; cas Ledger Connect Kit : ~1,15 M$ protégés ; un DApp détecté 24 h avant le hack, 100 000 $ sauvés | [V], estimations de projections |
| **Pocket Universe** | "0 perte utilisateur depuis janvier 2023" ; couverture jusqu'à 30 000 $ par transaction via Fairside ; détection "99,9 %" ; racheté par Kerberus en août 2025 | [V], non audité |
| **Wallet Guard** | aucun chiffre de fonds protégés trouvé ; racheté par Consensys en juillet 2024 | non trouvé |
| **Revoke.cash** | accueil : "140 M$+ protégés des exploits", "20 M+ approbations révoquées", "2 M+ utilisateurs" ; bilan 2025 : 9 exploits d'approbation pour ~6 M$ volés contre ~80 M$ en 2024, **mais Revoke écrit qu'il ignore si la baisse vient des bonnes pratiques ou d'autres facteurs**, et n'affiche aucun résultat sur son propre impact | [V] ; non attribuable |
| **Binance** | 2024 : >2,4 Md$ de pertes potentielles évitées (jan-juil.), dont ~1,1 Md$ (45 %) liés à des soupçons d'arnaque au retrait ; exercice 2025 : 6,69 Md$ de fraude stoppée, 36 000 adresses en liste noire, >9 600 avertissements temps réel par jour (relayé par OneKey, source secondaire de Binance Research) ; "Withdraw Protection"/liste blanche : taux d'arrêt non trouvé | [V]/[S] |
| **Coinbase Vault** | délai de 48 h pour retrait annulable (2014) ; Coinbase donne 24 h dans son aide ; efficacité mesurée : non trouvée. Cas Twitter 2020 : blocage dur de ~1 100 clients, 30,4 BTC (~278 000 $) évités ; 14 clients avaient déjà envoyé ~3 000 $ avant | [V] ; blocage dur, pas une alerte |
| **Singapour avec exchanges (avril-mai 2026)** | 145+ victimes potentielles identifiées, 4,2 M$ empêchés (police + 7 exchanges) | [S] |

Point commun : aucun vendeur ne publie (i) le dénominateur "alertes montrées", (ii) le taux de passage outre, (iii) le taux de faux positifs. Les chiffres "pertes évitées" sont des valeurs d'actifs exposées à des attaques bloquées ou signalées, pas des pertes qui auraient réellement eu lieu. Ne pas les utiliser comme taux d'arrêt.

---

## (d) Ce qu'on peut attendre : pertes évitées par catégorie

### d.1 Part des pertes par catégorie : périmètre et sources

**Avertissement de périmètre.** Il n'existe pas de dénominateur unique. Je construis un périmètre "pertes de particuliers qui signent ou envoient de la crypto", en juxtaposant des sources hétérogènes (global et États-Unis). Les parts sont donc **[C] indicatives** ; la catégorie D (investissement) est surtout américaine (IC3) et ne dit pas quelle part est envoyée depuis un wallet-extension plutôt qu'un exchange, un distributeur de crypto ou une appli bancaire (tous hors de portée de Sentinelle).

| Cat. | Chiffre 2025 retenu (M$) | Source | Étiquette |
|---|---|---|---|
| A. Signatures malveillantes (drainers EVM) | **84** (83,85) ; fourchette 84-110 | Scam Sniffer : 83,85 M$, 106 106 victimes, EVM seulement, borne inférieure ; Permit/Permit2 = 38 % des pertes des cas >1 M$, approve/increaseApproval 24 %, transfer 21 %, EIP-7702 11 %, setApprovalForAll 5 % ; 11 cas >1 M$ = 22,98 M$ (27 % du total) | [P] page lue |
| B. Adresse empoisonnée | **62** ; fourchette 42-100 | Étude USENIX Security 2025 : 270 M de tentatives, 17 M de cibles, 6 633 transferts, **83,8 M$ en deux ans (juil. 2022 - juin 2024)** = ~42 M$/an ; 2025 : deux cas isolés de 50 M$ (déc.) et 12,25 M$ (janv. 2026) = 62 M$. Total annuel 2025 : non trouvé | [S] (via recherche) ; [C] pour 42 et 62 |
| C. Faux support / usurpation | **1 150** ; fourchette 360-2 135 | IC3 2025 : fraude "tech support / support client" **2,135 Md$** (tous moyens de paiement) dont ~359,7 M$ de prise de compte via faux support bancaire [S] ; part payée en crypto : non trouvée ; je l'estime avec le ratio crypto/total IC3 = 11,366/20,877 = 54,4 % [C, hypothèse proportionnelle, H] ; Chainalysis : l'usurpation a augmenté de 1 400 %, montant non trouvé | [S]/[C]/[H] |
| D. Pig butchering / investissement | **7 200** ; fourchette 5 800-8 649 | IC3 2025 : fraude à l'investissement 8,649 Md$ (tous moyens) ; crypto investissement 7,2 Md$ [S, un seul résumé] ; 2024 : 5,8 Md$ crypto. Chainalysis : arnaques on-chain >=14 Md$ en 2025 (projection 17 Md$) | [S] |
| E. Compromission de clé personnelle | **713** | Chainalysis 2026 : 158 000 incidents, ~80 000 victimes, 713 M$ (contre 1,5 Md$ en 2024), ~20 % de la valeur volée 2025 ; vols totaux >3,4 Md$ dont Bybit ~1,5 Md$ (centralisé, hors périmètre) | [S] |

Pool central **[C] = 84 + 62 + 1 150 + 7 200 + 713 = 9 209 M$**. Parts : A 0,9 %, B 0,7 %, C 12,5 %, D 78,2 %, E 7,7 %.

### d.2 Séparer détection (rappel) et comportement (arrêt)

**Rappel de détection (banc)** : R3 "spender compte externe" = 80,4 % de rappel des 1 354 approbations d'attaque Ethereum pour 0,23 % de FP sur 43 075 tx présumées légitimes ; filet complet = 81,9 % pour 3,15 % de FP [P, RAPPORT_banc_reel_v0 et S3, sources internes]. **Limites déclarées du banc** : approbations directes seulement (approve, setApprovalForAll) ; permit hors chaîne, adresse empoisonnée, 7702, faux support, pig butchering : non mesurés. Dans les cas >1 M$ de Scam Sniffer, les approbations directes valent (5,62 + 1,23)/22,98 = 29,8 % de la valeur [C] ; Permit/Permit2, transfer et 7702 le reste.

| Cat. | Rappel bas | central | haut | Hypothèse |
|---|---|---|---|---|
| A | **0,24** | **0,59** | **0,82** | bas = 29,8 % de la valeur en approbations directes x 0,80 [C] (le reste non détecté) ; central = 29,8 % x 0,80 + 70,2 % x 0,50 [H, 0,50 supposé pour permit/transfer/7702 décodés] ; haut = filet complet du banc 0,82 |
| B | 0,50 | 0,75 | 0,90 | [H] : aucun rappel mesuré sur sosies ; règle déterministe "destinataire nouveau et ressemblant à une adresse de l'historique" ; baisse si l'adresse vraie n'est pas dans l'historique local |
| C | 0,00 | 0,05 | 0,15 | "fraude conforme : rappel proche de 0" ; le haut suppose que l'intention "on m'a demandé" + grilling (R8) attrape une partie (gain de l'intention : non mesuré) |
| D | 0,00 | 0,03 | 0,10 | idem ; la victime déclare honnêtement "j'investis" ; les envois passent surtout par exchange ou ATM, hors périmètre |
| E | 0,00 | 0,00 | 0,05 | clé volée : l'attaquant signe hors du wallet ; seul le cas résiduel de signature depuis le wallet |

**Taux d'arrêt après avertissement (incrémental sur le témoin)** : gains de la littérature en 5 repères :

| Repère | Valeur | Étiquette |
|---|---|---|
| Wallet simulé (non coaché), passif / délai 5 s / actif | +18,4 / +31,6 / +47,3 points | [P] |
| OBIE-CeDEx banque simulée, CTA seul / risque + CTA | -55 % / -82 % de fraude relatif (-81 % CeDEx ; -94 % sous-groupe 3e scénario) | [P] |
| Monzo terrain, écran d'avertissement / blocage + CTA | 23-30 % stoppés / 60-70 % d'efficacité (1/6 contourne) | [P/V] |
| NAB terrain, alerte | 12 % abandonnés | [S] |
| Navigateur terrain, phishing/malware | 77-93 % stoppés (non coaché, avertissement très clair) | [P] |
| Proceed-rate déclaré CoP no-match / Hong Kong | ~8 % / 20-30 % (donc stop 70-92 %) | [S] |

Hypothèses de transposition par catégorie [H] :

| Cat. | Arrêt bas | central | haut | Justification |
|---|---|---|---|---|
| A. Signatures | 0,18 | **0,47** | 0,80 | victime seule, non coachée, avertissement actif spécifique ; bas = passif wallet ; central = actif wallet ; haut = risque + CTA OBIE/CeDEx 82 % ou TxSum 88 % |
| B. Adresse empoisonnée | 0,50 | **0,70** | 0,90 | fait objectif ("cette adresse ressemble à X mais n'est pas X"), non coaché ; entre navigateur (77-93 %), CoP/HK (70-92 %) et wallet actif |
| C. Faux support | 0,05 | **0,20** | 0,45 | victime coachée au téléphone, "mode chaud" (PSR 2025), fraudeurs qui dictent les réponses (ombudsman, Which?) ; centre proche de Monzo écran (23-30 %) abaissé pour coaching |
| D. Pig butchering | 0,05 | **0,15** | 0,40 | victime engagée émotionnellement et financièrement depuis des semaines ("pain of paying" PSR) ; seul repère : 76 % ignorent être victimes (FBI) |
| E. Clé compromise | 0 | **0** | 0,30 | pas de décision humaine à interrompre |

### d.3 Tableau : perte évitée = part × rappel × taux d'arrêt  **[C]**

Formule appliquée à chaque colonne (bas = bas x bas, etc.) ; "évité cat." = rappel x arrêt ; contribution = part x évité cat. Les parts sont fixées au pool central ; les fourchettes ne portent que sur rappel et arrêt.

| Cat. | Part du pool | Évité cat. (bas / central / haut) | Contribution au pool (points) | Équivalent M$/an (pool central) |
|---|---|---|---|---|
| A Signatures | 0,9 % | 4,3 % / **27,7 %** / 65,6 % | 0,04 / 0,25 / 0,60 | 3,6 / 23,3 / 55,1 |
| B Adresse empoisonnée | 0,7 % | 25,0 % / **52,5 %** / 81,0 % | 0,17 / 0,35 / 0,55 | 15,5 / 32,5 / 50,2 |
| C Faux support | 12,5 % | 0,0 % / **1,0 %** / 6,8 % | 0,00 / 0,12 / 0,84 | 0,0 / 11,5 / 77,6 |
| D Pig butchering | 78,2 % | 0,0 % / **0,4 %** / 4,0 % | 0,00 / 0,35 / 3,13 | 0,0 / 32,4 / 288,0 |
| E Clé compromise | 7,7 % | 0,0 % / **0,0 %** / 1,5 % | 0,00 / 0,00 / 0,12 | 0,0 / 0,0 / 10,7 |
| **Total pool global (9 209 M$)** | 100 % | | **0,21 % / 1,08 % / 5,23 %** | 19 / 100 / 482 |

Alternatives de dénominateur **[C]** (mêmes taux par catégorie) :

| Périmètre | Bas | Central | Haut |
|---|---|---|---|
| Global (A à E) | 0,2 % | **1,1 %** | 5,2 % |
| "Natif wallet" A + B + E (859 M$) | 2,2 % | **6,5 %** | 13,5 % |
| Signatures + adresse empoisonnée A + B (146 M$) | 13,1 % | **38,2 %** | 72,1 % |

Exemple de calcul A central : 0,59 x 0,47 = 27,7 % ; contribution = 0,9 % x 27,7 % = 0,25 point ; 84 M$ x 27,7 % = 23,3 M$.
Sanity check avec la filière la mieux mesurée : A haut = 0,82 x 0,80 = 65,6 % ; ordre de grandeur voisin de OBIE risque + CTA (82 %) ramené à la détection du banc.

### d.4 Ce que le tableau ne dit pas (à ne pas oublier au pitch)

1. **Couverture** : tout est calculé en supposant que 100 % des victimes de la catégorie utilisent Sentinelle. Avec une part de marché c, multiplier par c. Pour D (investissement) et C (faux support), une grande part des envois part d'exchanges, de distributeurs de crypto ou d'applis bancaires, hors d'une extension de wallet ; non quantifiée (non trouvé).
2. **Pertes incrémentales** : on applique les arrêts incrémentaux (net du témoin), mais une victime évitée peut être re-ciblée ; effet de substitution non mesuré.
3. **Biais du labo** : les 3 plus grands effets (wallet 48,6 %, OBIE 82 %, CeDEx 94 %) viennent de labos avec argent fictif et sans coach ; Akhawe montre que le labo biaise (dans le sens inverse selon le cas). Le terrain Monzo (23-30 %, 60-70 % avec blocage) est plus bas pour un écran seul.
4. **Faux positifs** : le coût est de -6 à -20 points de paiements légitimes (OBIE, bras CTA) et 2-4 % d'annulations bénignes (wallet) ; notre banc donne 0,23 % de FP en R3 seul et 3,15 % pour le filet complet. Le gain "R3 + friction forte" (0,23 % de FP) est donc le plus défendable ; le filet complet à 3,15 % doit rester sur une friction légère (jaune) pour éviter l'habituation.
5. **Attaquant adaptatif** : le rappel du banc est mesuré sur des attaques publiques étiquetées (risque de circularité avec ScamSniffer, noté par S3) ; il baisse si les drainers contournent la règle "spender compte externe".
6. **Petites parts, grand effet** : A et B pèsent 1,6 % du pool mais représentent la partie où Sentinelle a le plus de prise (38 % évitable). Le pitch honnête : **forte efficacité sur 146 M$ de pertes natives wallet, quasi nulle sur 7,2 Md$ de fraude conforme** ; chiffrer à ~1 % du global.

### d.5 Pistes pour monter D et C (hors rappel du banc)

- La seule piste mesurée qui touche la fraude conforme est la **réduction de l'urgence par un délai ou un blocage avec appel à l'action** (Monzo : blocage 60-70 % ; CeDEx : CTA -81 % ; Westpac blocage dur : 99 % des paiements bloqués n'ont pas lieu) [P/S/V]. Toutes ces mesures sont soit centralisées (la banque bloque), soit simulées. Un Snap ne peut pas bloquer (OB) : le verrou réel exige une page compagnon ou une extension.
- Intervention humaine tierce (Banking Protocol 55,5 M£ en 2022 ; Level Up 285 M$) : efficaces mais non transposables à une extension sans tiers de confiance.
- Mesure à faire sur notre banc : rappel de la règle "nouveau destinataire + intention 'on m'a demandé'", sur des scénarios simulés O2, pour remplacer l'hypothèse [H] des lignes C et D.

---

## Non trouvé (liste)
- Proceed-rate réel des alertes de wallet (MetaMask/Blockaid/Rabby/Pocket Universe/Wallet Guard).
- Taux d'arrêt des "bank intervention calls" (Monzo, Starling, Barclays) ; questions de finalité (contournement, faux motifs).
- Effet isolé de la personnalisation par les mots de l'utilisateur.
- Effet isolé des délais de refroidissement (Singapour, Australie) : seulement des résultats groupés.
- Total 2025 d'adresse empoisonnée ; part crypto de la fraude "faux support" ; split Permit vs Permit2 sur l'ensemble des pertes.
- Dénominateur et taux de FP de Blockaid/Pocket Universe/Revoke/Binance.
- Egelman "79 %" ; tailles d'échantillon TxSum ; version publiée du CeDEx dans une revue.

## Sources
- Akhawe & Felt 2013 : https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/akhawe
- OBIE 2021 : https://www.openbanking.org.uk/wp-content/uploads/2021/04/Preliminary-Analysis-Effective-Warning-20210201.pdf
- CeDEx 2023-08 : https://www.nottingham.ac.uk/cedex/documents/papers/cedex-discussion-paper-2023-08.pdf
- Guan et al. USENIX Security 2026 : https://www.usenix.org/conference/usenixsecurity26/presentation/guan et https://www.usenix.org/system/files/usenixsecurity26-guan.pdf
- TxSum : https://arxiv.org/abs/2512.06933
- Address poisoning (wallets) : https://arxiv.org/html/2508.12107v1 ; mesure : https://arxiv.org/html/2501.16681v3
- Monzo purchase scams : https://community.monzo.com/t/an-update-on-our-work-to-prevent-purchase-scams/166103 ; APP : https://community.monzo.com/t/an-update-on-our-work-to-prevent-authorised-push-payment-fraud/166724
- NAB : https://news.nab.com.au/news/nab-payment-alerts-latest
- Scam Sniffer 2025 : https://drops.scamsniffer.io/scam-sniffer-2025-crypto-phishing-losses-fall-83-to-84-million/
- Chainalysis via presse : https://www.theblock.co/post/382477 ; https://forklog.com/en/crypto-scammers-stole-a-record-14bn-in-2025/
- FBI IC3 2025 via presse : https://www.hstoday.us/subject-matter-areas/cybersecurity/cryptocurrency-and-ai-scams-cost-u-s-almost-21-billion-in-2025-according-to-new-fbi-internet-crime-report/ ; https://www.nextgov.com/cybersecurity/2026/04/government-official-impersonation-scam-complaints-doubled-2025-fbi-report-shows/412656/
- Banking Protocol : https://www.ukfinance.org.uk/news-and-insight/press-release/over-ps55-million-fraud-prevented-in-2022-rapid-response-scheme
- PSR : https://www.psr.org.uk/app-fraud-data ; Pay.UK CoP : https://newseventsinsights.wearepay.uk/media-centre/press-releases/confirmation-of-payee-reaches-two-billion-checks-helping-protect-uk-consumers-against-fraud/
- Singapour ABS : https://abs.org.sg/docs/library/banks-to-launch-enhanced-safeguards-from-15-oct-2025-to-better-protect-accounts_.pdf ; Australie ABA : https://www.ausbanking.org.au/early-signs-of-success-in-war-against-scammers
- Blockaid : https://blockaid.io/end-user-protection ; Revoke.cash : https://revoke.cash/blog/2025/year-in-review ; Pocket Universe, Wallet Guard, Binance, Coinbase : via recherche (voir section c)
- FBI Level Up : https://www.nbcmiami.com/responds/nbc6-responds-takes-you-inside-fbis-crypto-scam-stopping-operation/3574913
- Internes : RAPPORT_banc_reel_v0.md (research/titouan/bench), S3_concurrence_defendabilite_these.md, R6_notation_contrepartie.md

---

## Résumé en 12 lignes
1. Meilleure preuve crypto : Guan et al. (USENIX 2026, n = 364, labo) : annulation d'un phishing d'approbation 1,3 % (témoin), 19,7 % (passif), 32,9 % (délai 5 s), 48,6 % (actif) [P] ; 2-4 % d'annulations bénignes.
2. Banque simulée (OBIE 2021, CeDEx 2023) : fraude 22 % -> 4 % avec risque + geste d'annulation (-82 %), -94 % seulement dans le sous-groupe "fraude au 3e scénario" ; coût : -7 à -20 points de paiements légitimes [P].
3. Terrain bancaire : Monzo 23-30 % stoppés par écran, 60-70 % d'efficacité avec blocage (1/6 contourne) ; NAB 12 % d'abandons ; Browser Akhawe : SSL 70,2 %/33 % de clic-through, phishing 9-23 % [P/S].
4. Aucun taux d'arrêt publié pour les appels d'intervention humaine (Monzo, Starling, Barclays), les questions de finalité, les délais SG/AU (effets groupés), ni la personnalisation isolée [non trouvé].
5. Outils crypto (Blockaid 14,7 Md$ "évités", Pocket Universe "0 perte", Revoke 140 M$, Binance 6,69 Md$) : chiffres de vendeurs sans dénominateur ni FP ; Revoke admet ne pas savoir si la baisse 2025 lui est due [V].
6. Parts de pertes (périmètre mixte, [C]) : pig butchering ~78 %, faux support ~12,5 %, clé compromise ~7,7 %, signatures 0,9 %, adresse empoisonnée 0,7 % (pool 9,2 Md$).
7. Rappel du banc : R3 80 % / 0,23 % FP, filet 82 % / 3,15 % FP, mais approbations directes seulement (~30 % de la valeur des gros cas) ; fraude conforme ~0.
8. Taux d'arrêt retenus (incrémentaux) : signatures 18-47-80 %, sosie 50-70-90 %, faux support 5-20-45 %, pig butchering 5-15-40 %, clé 0 %.
9. Perte évitée = part x rappel x arrêt : signatures 4/28/66 %, sosie 25/53/81 %, faux support 0/1/7 %, pig butchering 0/0,4/4 %, clé 0/0/1,5 % de leur catégorie.
10. Sur le pool global : 0,2 % / 1,1 % / 5,2 % des pertes évitées (19 / 100 / 482 M$/an) ; sur le périmètre natif wallet : 2 / 6,5 / 13,5 % ; sur signatures + sosie : 13 / 38 / 72 %.
11. Message honnête : forte prise sur les attaques techniques (146 M$), quasi nulle sur la fraude conforme (8,4 Md$) ; la détection plafonne l'effet, le comportement ajoute un facteur 0,2 à 0,8 selon le coaching.
12. Limites : hypothèses [H] sur rappel hors banc et arrêts coachés, couverture 100 % supposée, labos à argent fictif, pertes agrégées US/globales, chiffres IC3/Chainalysis lus via presse ; à mesurer sur notre banc avant tout chiffre en pitch.

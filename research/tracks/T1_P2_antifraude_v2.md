# T1 · Piste 2 (v2) — SOC anti-fraude à l'ère de l'IA générative : ATO, voix clonée, faux KYC, réponse graduée

> Recherche du 2026-10-10 pour Secure Horizons (Track 1 « Guardians of Value »). Complète et **corrige** `research/tracks/T1_P2_antifraude.md` (v1) et `research/02_track1_finance.md` §2. Ne répète pas v1 (pause Google 30 s, ASVspoof 5, données BAF/FCA, idées A à D) sauf pour les corriger ou les situer.
> Légende : **[V]** source primaire lue ou fait confirmé par au moins deux sources indépendantes · **[S]** presse, cabinet ou analyse secondaire · **[Vendeur]** chiffre d'un éditeur intéressé · **[Inf]** inférence de l'auteur (à défendre comme telle) · **[À vérifier]** non confirmé, ne pas mettre sur une slide sans relecture.
> Barème des notes : 0,30·Détection + 0,20·Réponse + 0,20·Faisabilité + 0,15·Conformité + 0,15·Pitch (sous-notes /100, estimations [Inf]).
> Règle d'Adem appliquée : périmètre large (ATO, APP, faux conseiller, BEC, deepfake, mules), aucune restriction de scope pour simplifier.

---

## TL;DR (5 lignes)

1. **Ce qui change depuis v1 (et invalide une phrase de v1)** : « aucun équivalent UE du score bénéficiaire » n'est **plus vrai**. Le **FNC-RF** (fichier national des IBAN suspects, Banque de France) est **en production depuis le 7 mai 2026** [V], l'**EPC prépare FRIDA** (partage d'IBAN suspects, plateforme type MISP) [S], et **Visa A2A Protect** (1ᵉʳ sept. 2026) ajoute un score unifié Featurespace plus un partage de renseignement réseau en option [V vendeur]. La jonction payeur × bénéficiaire n'est donc plus un angle vide : il faut la défendre par **ce qui manque encore** (pré-signalement, fusion contextuelle, explication, **vitesse de gel**, responsabilité).
2. **Ce qui manque encore, vérifié** : le FNC-RF est **post-signalement** (un compte n'y entre qu'après qu'un PSP l'a signalé) et **binaire** (aucun motif, aucune confiance, un listing « n'interdit pas automatiquement » le compte) [S]. Les cas réels montrent que la **récupération se joue en heures** (Singapour : 499 k$ retenus en 2 jours ; Fideuram : environ 53 à 59 M€ récupérés sur 95 M€ grâce à la coopération entre trois pays, 36 à 40 M€ perdus) [V/S].
3. **Recommandation : « DOUBLE REGARD v2 » = fusion contexte de session × bande bénéficiaire (v1) + « Golden Hour » (chaîne de gel automatisée avec dossier prêt à envoyer) + « dossier de responsabilité PSR »** (notre réponse à la question piège). Note composite estimée **85/100** (détail §3 et §4).
4. **Le pays réel du problème est la France** : fraude par manipulation **516 M€ en 2025 (+34 %)**, faux conseiller **376 M€**, virements instantanés frauduleux **182 568** contre 86 570 virements classiques [V/S]. Mais au Royaume-Uni l'usurpation de banque **recule** (−12 % de pertes) : le faux conseiller est une menace en croissance en France, en décroissance là où la responsabilité du PSP est déjà imposée [S]. Argument pitch : « l'Europe rejoue l'histoire UK, 2 ans plus tard ».
5. **Deepfake vocal/visio** : la défense qui tient est procédurale/cryptographique, pas la détection (humains : 58 % des voix clonées jugées humaines ; détecteurs live : aucun benchmark indépendant) [S]. Mais **« mandat signé / contre-appel »** est proche de ce qu'Adem a rejeté : à ne présenter que comme **module déclenché automatiquement**, jamais comme idée centrale.

---

## 0. Corrections et mises à jour par rapport à v1

| # | Point v1 | Correction (source) | Statut |
|---|---|---|---|
| C1 | « Aucun équivalent UE d'un score bénéficiaire ; Mastercard CFR UK seulement » | **FNC-RF** (IBAN suspects, partagé entre PSP, tenu par la Banque de France, lancé le **7/05/2026**, aucune donnée nominative, durée limitée, s'intégrera au dispositif européen du futur PSR) : https://www.banque-france.fr/system/files/2026-05/CP_Lancement_FNC_RF.pdf [V, PDF lu]. Détails d'usage (consultation en temps réel possible, un listing n'impose ni blocage ni clôture, correction possible d'un signalement erroné, contrôle CNIL) : https://www.moneyvox.fr/banque/actualites/108588/nouveau-fichier-des-iban-frauduleux-quest-ce-que-ca-change-pour-la-lutte-contre-la-fraude [S] | V |
| C2 | Partage de données de fraude « en attente » | **EPC FRIDA** : cadre inter-PSP de partage d'informations de fraude, premier cas d'usage = **IBAN suspects**, approche « fédérée » avec plateforme basée sur **MISP**, RFI plateforme du 28/01 au 20/02/2026, consultation publique sur un rulebook v0.1. Lié aux art. 83/83a du PSR (application attendue début 2028). https://fintech.global/?p=229956 · https://www.europeanpaymentscouncil.eu/node/28126 [S, EPC cité par la presse] | S |
| C3 | « Les solutions sont des boîtes noires vendues aux grandes banques » | **Visa A2A Protect** amélioré (1-2 sept. 2026) : score unifié (1ʳᵉ intégration Featurespace), explication en langage clair à chaque alerte, API unique, partage réseau **opt-in** (points chauds d'arnaques, fraude coordonnée). Chiffres Visa : +75 % de détection en 6 mois ; un client bancaire européen anonyme : +50 % de fraude évitée et −40 % d'alertes inutiles. https://www.mynewsdesk.com/uk/visa/pressreleases/visa-launches-enhanced-a2a-protect-innovations-to-help-financial-institutions-stop-fraud-before-money-leaves-accounts-3464262 [Vendeur] | Vendeur |
| C4 | Mastercard CFR « UK seulement » | Confirmé pour le déploiement ; Mastercard a en plus lancé **A2A Protect** au Royaume-Uni (juillet 2025 : CFR + cadre de règlement des litiges) et annonce une extension mondiale sans date UE trouvée. Chiffre « −20 % APP » non vérifié. https://fstech.co.uk/fst/Mastercard_Launches_A2A_Protect_To_Boost_Safety_In_UK_Account_To_Account_Payments.php [Vendeur] | À vérifier |
| C5 | « PSR 2027 » (prompt de la mission) | Il faut distinguer le **PSR britannique** (Payment Systems Regulator, remboursement APP obligatoire depuis oct. 2024) et le **PSR européen** (règlement sur les services de paiement) : accord politique nov. 2025, vote ECON le 5 mai 2026, **publication au JOUE attendue au S2 2026**, application environ **21 mois après** (S2 2027 à début 2028 selon les cabinets) ; VoP étendu à 27 mois. https://www.soprasteria.com/insights/details/payment-services-regulation-psr-in-2026--the-state-of-play-for-banks · https://www.pwc.com/cz/cs/blog/rizeni-rizik/psd-3-the-psr-payments-reform.html [S] | À vérifier (numérotation des articles) |
| C6 | AI Act « haut risque » | Accord provisoire du **7 mai 2026** (Omnibus numérique) : obligations Annexe III reportées au **2 décembre 2027** (systèmes autonomes), 2 août 2028 (produits). Adoption formelle à confirmer au JOUE. https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines/ [S] | À vérifier |
| C7 | ATLAS AML.T0052.001 | Dans les données ATLAS lues : **AML.T0052** Phishing, **AML.T0052.000** « Spearphishing via Social Engineering LLM », **AML.T0073 Impersonation**, **AML.T0088 Generate Deepfakes**, AML.T0015 Evade AI Model, AML.T0051 LLM Prompt Injection, AML.T0053 AI Agent Tool Invocation. Les sous-ID varient selon la version : citer le parent **AML.T0052** par défaut. https://github.com/mitre-atlas/atlas-data [S, version marquée « deprecated » par l'outil de lecture] | À vérifier |
| C8 | D3FEND « D3-AZET » | ID correct : **D3-ANET** (Authentication Event Thresholding). Autres IDs lus dans l'API D3FEND : D3-UBA, D3-DUC, D3-DO, D3-DE, D3-MFA, D3-AL, D3-ANCI, D3-SDA (Session Duration Analysis), D3-ST (Session Termination), D3-BAN (Biometric Authentication), D3-CBAN, D3-UGLPA, D3-WSAA, D3-CE, D3-OTP, **D3-MAN (Message Authentication)**, D3-APCA, **D3-RTSD (Remote Terminal Session Detection)**, D3-NTCD, D3-RAPA. https://d3fend.mitre.org/api/technique/all.json [S, lecture par outil] | À revérifier sur chaque page |
| C9 | ATT&CK | Confirmés dans la matrice entreprise : T1566.004 et T1598.004 (**Spearphishing Voice**, deux tactiques), **T1219 Remote Access Tools**, T1539 Steal Web Session Cookie, T1621 MFA Request Generation, T1111 MFA Interception, T1556 Modify Authentication Process, T1657 Financial Theft, T1078, T1585/T1586, T1650 Acquire Access, T1534. Mobile : T1451 SIM Card Swap, T1453 Abuse Accessibility Features, T1417 Input Capture, T1660 Phishing, T1663 Remote Access Software. https://attack.mitre.org/techniques/enterprise/ · https://attack.mitre.org/techniques/mobile/ [V]. T1656 Impersonation : déjà vérifié en v1. | V |
| C10 | OWASP Agentic | ASI01 Agent Goal Hijack, ASI02 Tool Misuse, ASI03 Identity & Privilege Abuse, ASI04 Supply Chain, ASI05 Unexpected Code Execution, ASI06 Memory & Context Poisoning, ASI07 Insecure Inter-Agent Comm., ASI08 Cascading Failures, ASI09 Human-Agent Trust Exploitation, ASI10 Rogue Agents (publié 9 déc. 2025). https://cycode.com/blog/owasp-top-10-agentic-applications/ [S, titres à relire sur genai.owasp.org] | À vérifier |
| C11 | NIST CSF 2.0 | Titres relus : DE.AE-02 (événements analysés), **DE.AE-03 (information corrélée de sources multiples)**, DE.AE-04 (impact et portée estimés), DE.AE-06 (information fournie aux personnes et outils autorisés), DE.AE-07 (CTI et contexte intégrés), DE.AE-08 (incident déclaré selon critères) ; DE.CM-01/-03/-06/-09. https://csf.tools/reference/nist-cybersecurity-framework/v2-0/de/de-ae/ [V]. Catégories RS : RS.MA, RS.AN, RS.CO, RS.MI [V]. Les numéros fins RS.MA-0x, RS.AN-0x, RS.CO-0x, RS.MI-0x et PR.AA-0x ci-dessous sont **de mémoire** : relire le PDF NIST CSWP 29 avant la fiche de défense. | Partiel |

---

## 1. La douleur réelle aujourd'hui

### 1.1 Chiffres par type de fraude

| Type | Chiffre | Source | Statut |
|---|---|---|---|
| **EEE, tous paiements** | 4,2 Md€ de fraude 2024 ; virements 2,2 Md€ ; manipulation du payeur > 50 % de la valeur des virements frauduleux ; **85 % des pertes sur virements supportées par les clients** | EBA-ECB déc. 2025, https://www.ecb.europa.eu/press/intro/publications/pdf/ecb.ebaecb202512.en.pdf | V (via v1) |
| **France, fraude par manipulation** | 516 M€ en 2025 contre 384 M€ en 2024 (**+34 %**), > 40 % de la fraude totale (1,24 Md€) ; virement en ligne = **3/4** de la fraude par manipulation ; fraude sur virement en ligne **+182 %** alors que l'usage n'augmente que de 13 % ; **1 457 € de fraude moyenne par cas** de virement contre 60 € pour la carte en ligne | OSMP 2025 via https://www.moneyvox.fr/banque/actualites/110566/faux-conseillers-bancaires-les-chiffres-chocs-de-explosion-de-la-fraude-par-manipulation | S (rapport primaire : https://www.banque-france.fr/system/files/2026-09/Rapport_2025_de_l_OSMP.pdf, non relu) |
| **France, faux conseiller** | 376 M€ (v1) ; virements instantanés frauduleux 2025 : **182 568** contre 86 570 virements classiques | v1 + MoneyVox ci-dessus | S |
| **France, mix des moyens (H1 2025)** | Virement = 37 % des fonds détournés, devant la carte (34 %) et le chèque (20 %) | OSMP via https://www.moneyvox.fr/banque/actualites/108588/nouveau-fichier-des-iban-frauduleux-quest-ce-que-ca-change-pour-la-lutte-contre-la-fraude | S |
| **Royaume-Uni, APP 2025** | 576,4 M£ (+19 %), 248 070 cas ; investissement 221,5 M£ (+40 %) ; achat = 71 % des cas (118,1 M£) ; romance 39,2 M£ (+23 %) ; **usurpation : pertes −12 %, cas −11 %** ; 66 % des cas démarrent en ligne, **17 % par les télécoms (pertes unitaires plus élevées)** ; remboursé 354,3 M£ (~61 % des pertes) | UK Finance 2026, https://www.ukfinance.org.uk/system/files/2026-06/UK%20Finance%20Fraud%20Report%202026.pdf ; synthèse https://www.crowdfundinsider.com/2026/06/285657-fraudulent-activities-and-sophisticated-scams-continue-to-pose-serious-threat-to-uk-security-as-losses-approach-1-3b/ | S sur le détail. Le « 88 % remboursés » de v1 mesure autre chose (montants des cas éligibles PSR, oct. 2024-sept. 2025) : ne pas mélanger les deux sur une slide |
| **BEC / fraude au président (USA)** | FBI IC3 2025 : BEC ≈ **3,05 Md$** pour 24 768 plaintes (≈ 123 k$ par plainte) ; total cybercriminalité 20,9 Md$ (+26 %) ; investissement 8,65 Md$ ; plaintes mentionnant l'IA : 22 364, ≈ 893 M$ | https://www.mcdonaldhopkins.com/insights/news/the-sobering-truth-of-the-fbis-2025-internet-crime-complaint-center-report · https://www.insurancebusinessmag.com/us/news/cyber/business-email-fraud-drives-bulk-of-us-cybercrime-losses-analysis-590687.aspx | S (le rapport ic3.gov est un PDF illisible par l'outil : **À vérifier** avant slide) |
| **Fraude au président / faux ordres de virement (France)** | 2024 : +29 % en volume, ≈ 45 M€/an pour les seules PME ; fraude au virement = 13,5 % des demandes d'assistance des professionnels (Cybermalveillance 2025, +93 %) ; faux fournisseur = 45 % des cas (baromètre Allianz) | https://clubic.com//dossier-610123-l-arnaque-au-faux-fournisseur-une-fraude-qui-cible-les-pme-et-detourne-les-virements.html | S, **non sourcé dans l'article** : À vérifier. Ancien mais primaire : DGCCRF, > 3 000 cas depuis 2010, ≈ 750 M€ (2020) https://www.economie.gouv.fr/node/3229131 |
| **Faux fournisseur (étude)** | 58 % des 1 700 fraudes confirmées 2020-2023 étaient du faux fournisseur | Sis ID (racheté par Eftsure), https://sis-id.com/en/about/ · https://finyear.com/eftsure-rachete-sis-id-et-donne-naissance-a-un-acteur-international-de-la-securisation-des-paiements-inter-entreprises | Vendeur |
| **Deepfake vocal : Fideuram (Intesa Sanpaolo)** | **Février 2026** ; fausse messagerie WhatsApp « signée » du PDG Messina + appel d'un faux avocat à la voix clonée (reportage) vers le président de Fideuram ; ≈ **95 M€** virés vers Chine/Hong Kong ; récupération : ≈ 53 M€ (Reuters) à 59 M€ selon les sources ; **≈ 36 à 39,5 M€ non récupérés** (les chiffres divergent) ; fonds convertis en crypto ; le président a démissionné en mars 2026 ; affaire révélée par la presse en sept./oct. 2026 | https://oecd.ai/en/incidents/2026-09-25-b291 · https://gulfnews.com/world/europe/ai-voice-cloning-scam-hits-italian-bank-fake-executives-trigger-95m-overseas-transfers-1.500688692 · https://letsdatascience.com/news/fideuram-transfers-eur95-million-after-voice-cloning-fraud-6189ecda | S (sources anonymes ; le clonage vocal n'est pas confirmé officiellement) |
| **Deepfake visio : Arup** | 15 virements, ≈ 25,6 M$, visio avec faux DAF et collègues, police de Hong Kong | https://frankonfraud.com/?p=22425 (secondaire ; primaire attendu : police HK via CNN) | S, **À vérifier** (nombre de virements variable selon les sources) |
| **Deepfake visio : Singapour (mars 2025)** | Directeur financier : WhatsApp du « DAF » puis Zoom avec faux PDG ; 499 k$ virés le 26/03 ; **retenus dès le 28/03** par l'Anti-Scam Centre et le HK Anti-Deception Coordination Centre ; la fraude est découverte quand l'escroc réclame 1,4 M$ de plus | https://www.police.gov.sg/media-room/news/20250407_singapore_and_hong_kong_police_force_recover_over_$670000_in_a_scam | V (police) |
| **Voix d'un ministre (Italie, 2025)** | ≈ 1 M€ viré, fonds gelés | v1, https://www.aljazeera.com/news/2025/10/6/ai-now-sounds-more-like-us-should-we-be-concerned | S |
| **Humains face aux voix clonées** | PLOS ONE 2025 : 58 % des voix clonées jugées humaines ; voix réelles reconnues 62 % ; « pas de sensibilité significative » | https://www.theregister.com/2025/10/09/voice_clone_detection_study/ | S |
| **ATO** | > 1 M de comptes bancaires en ligne des 100 premières banques compromis par infostealers en 2025 (Espagne parmi les pays les plus touchés) ; ATO +37 % en 2025 (vendeur) ; pertes ATO > 15 Md$ (USA, Javelin) | https://www.malaysianwireless.com/2026/04/kaspersky-rise-banking-credential-theft/ · https://flare.io/prevent-customer-account-takeover · https://microblink.com/?p=42037 | Vendeur ; **aucun chiffre européen fiable de pertes ATO trouvé** (à signaler au jury plutôt qu'inventer) |
| **ATO, vecteur humain** | Hotline/Helpdesk : reset MFA par ingénierie sociale (Caesars, MGM, M&S, Co-op) ; modèle Scattered Spider | https://www.bleepingcomputer.com/news/security/3-key-takeaways-from-the-scattered-spider-attacks-on-insurance-firms/ | S |
| **Europol** | IOCTA 2025 (« Steal, deal, and repeat », 11 juil. 2025) : le commerce de données volées alimente l'ingénierie sociale, amplifiée par les LLM | https://eucrim.eu/news/iocta-2025/ | V |
| **Faux KYC / identités synthétiques** | Tentatives « sophistiquées » 10 % → 28 % (Sumsub) ; caméras virtuelles +2 665 % (iProov) ; pertes UK d'identités synthétiques > 300 M£ en 2024 et +60 % de cas (Experian) ; Juniper : 23 Md$ → 58 Md$ en 2030 (prévision) | v1 ; https://www.bankinfosecurity.com/ai-tools-synthetic-ids-are-fracturing-kyc-programs-a-a-30401 · https://www.transunion.co.uk/content/dam/transunion/gb/business/documents/H1-2026-Fraud-Trends-Report.pdf | Vendeur/S |
| **Usurpation téléphonique** | Signalements Arcep : 531 (2023) → 8 500 (2024) → > 19 000 (2025) ; depuis le 1/01/2026 un numéro français non authentifié s'affiche masqué ; Arcep enquête sur l'efficacité du MAN ; une décision de justice aurait retenu une responsabilité partielle d'un opérateur dans un cas de faux conseiller (non vérifiée) | https://siecledigital.fr/2026/02/02/appels-frauduleux-larcep-met-les-operateurs-sous-pression/ | S ; décision : À vérifier |
| **Fraude agentique** | Google : +32 % de pages avec injection de prompt malveillante entre nov. 2025 et fév. 2026, dont des instructions de paiement PayPal cachées ; Zscaler : fausse doc d'API qui fait payer un agent | https://securityaffairs.com/194822/ai/hidden-web-prompts-trick-ai-agents-into-sending-money.html | S |

### 1.2 Qui souffre exactement

| Victime | Douleur vécue | Ce qui la rend aveugle aujourd'hui |
|---|---|---|
| **DAF/comptable de PME-ETI** | Reçoit un « changement de RIB » ou un ordre « urgent et confidentiel » ; paie à un faux fournisseur ; perte directe (la PME n'est pas un consommateur : pas de remboursement PSR) | Les outils (Trustpair, Eftsure/Sis ID) vérifient le RIB, pas la **manipulation**. Aucune banque ne voit la demande qui arrive hors workflow. |
| **Trésorier d'ETI / groupe** | Visio avec « le DAF groupe » (Arup, Singapour) ou appel du « président » (Fideuram) | Contrôle de séparation des tâches souvent contourné par l'urgence ; **pas de lien** entre la réunion et l'ordre de paiement. |
| **Client de banque de détail (faux conseiller)** | Authentifié (SCA), il valide lui-même ; 85 % des pertes restent à sa charge dans l'EEE aujourd'hui | La SCA authentifie la bonne personne qui paie au mauvais endroit. |
| **Banque en ligne / néobanque** | Premier rang des virements frauduleux (76 % de la valeur au S1 2025 [S, 02_track1_finance]) ; héberge aussi les **mules** | Chaque établissement voit une moitié du crime. |
| **PSP / banque du bénéficiaire** | Reçoit les fonds de la mule ; devra **geler** (PSR art. 83) et répondre de l'échec | FNC-RF seulement après signalement ; fonds sortis en quelques minutes (crypto, comptes tiers). |
| **Analyste fraude / LCB-FT** | Piles d'alertes « montant atypique », dossiers à reconstituer, délai de 15 jours ouvrés pour rembourser ou motiver un refus (PSR, impersonation) | Outils génériques de case management ; pas de dossier de responsabilité pré-construit. |
| **Fintech B2B / PSP de paiement fournisseur** | Ses clients paient de faux fournisseurs ; elle porte le risque réputationnel et les pertes de réseau | Un seul signal par fournisseur, jamais de contexte de demande. |
| **Responsable conformité (KPMG-type)** | Doit prouver qui a décidé quoi, sur quelles données, avec quel modèle | Boîtes noires, pas de journal rejouable. |

---

## 2. Cartographie des concurrents

Colonnes : Nom · Ce qu'ils font · Clients/traction · Levées/propriétaire · **Ce qu'ils ne font PAS**. Les lignes marquées `n.v.` ne sont pas vérifiées dans cette session (connaissance générale) ; ne pas citer de montant sans relecture.

### 2.1 Moteurs fraude/risque transactionnel et comportemental

| Nom | Ce qu'ils font | Clients / traction | Levées / propriétaire | Ne font PAS |
|---|---|---|---|---|
| **BioCatch** | Biométrie comportementale en session ; **Scams360** (appel actif, partage d'écran, RAT, saisie lente) ; mule defense | > 350 banques, 21 pays, 1,8 Md d'appareils, 760 M d'utilisateurs [Vendeur] https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.22626.html | **Visa rachète pour 2,4 Md$ en cash, annoncé le 3 août 2026**, clôture attendue fin T1 2027, BioCatch resterait indépendant dans Visa VAS | Voit le payeur seulement ; ne gèle pas côté bénéficiaire ; boîte noire ; devient captif de Visa |
| **Featurespace (ARIC)** | Analyse comportementale adaptative des transactions | Banques, PSP | **Visa, rachat finalisé 19 déc. 2024** (prix non public) https://www.businesswire.com/news/home/20241218857122/en/Visa-Completes-Acquisition-of-Featurespace | Peu de contexte de session ou d'appel ; propriétaire d'un réseau de cartes |
| **Visa A2A Protect** | Score unifié A2A, explication en langage clair, partage réseau opt-in | 1 banque européenne citée | Visa (voir C3) | Le payeur-contexte (appel, RAT) est dans BioCatch, pas encore fusionné publiquement ; aucune réponse de gel |
| **Mastercard CFR / A2A Protect** | Score de **compte bénéficiaire** par flux multi-banques ; cadre de litiges ; « inbound risk » (+60 % de repérage de mules en test hors ligne [Vendeur]) | 11 banques UK | Mastercard | UE non déployé ; pas de contexte de session |
| **Feedzai** | RiskOps, ScamPrevent, BAF (dataset), contrat cadre BCE pour l'euro numérique | Grandes banques | **75 M$ à > 2 Md$ de valorisation (oct. 2025)**, ≈ 350 M$ levés au total (sources divergentes) https://www.feedzai.com/inthenews/feedzai-raises-75m-at-2b-valuation-secures-key-role-in-digital-euro-fraud-prevention/ ; a racheté Revelock/Buguroo (août 2021) https://thepaypers.com/payments/news/buguroo-changes-name-to-revelock-launches-the-revelock-fraud-detection-and-response-platform | Peu de publications sur l'explicabilité régulateur ; pas de gel interbancaire |
| **NICE Actimize** | Fraude (carte, banque, paiements), AML, case management ; reconnu Leader Forrester APAC T4 2025 et Celent Luminary | Très grandes banques | Filiale de NICE (coté) | Lourd, long à intégrer ; pas de logique « bande bénéficiaire inter-PSP » publique |
| **SAS** | Fraude et AML sur plateforme analytique | Banques, assureurs | Privé (n.v.) | Idem ; pas d'angle scam/coercition spécifique (n.v.) |
| **Sardine** | Appareil, comportement, paiements ; agents IA pour opérations | > 300 entreprises (FIS, Deel, GoDaddy…) | **70 M$ série C (fév. 2025)**, 145 M$ au total https://www.fintechfutures.com/venture-capital-funding/fraud-prevention-platform-sardine-secures-70m-series-c-invests-in-agentic-ai | Orienté fintech US ; peu sur le rail SEPA/VoP |
| **Sift** | Empreinte, règles/ML, e-commerce et paiements | n.v. | n.v. | Faible sur l'APP |
| **SEON** | Enrichissement (e-mail, téléphone, réseaux), règles, appareil | n.v. | **80 M$ série C (sept. 2025)**, ≈ 187 M$ au total https://startupintros.com/news/2025-09-01-seon-series-c | Idem Sift |
| **Forter** | Fraude e-commerce, identité | Grands e-commerçants | 300 M$ à 3 Md$ (mai 2021) https://glenbrook.com/?p=32200 | Pas de virement/APP |
| **Arkose Labs** | Anti-bot, défi/réponse pour inscription et login | n.v. | 70 M$ série C (2021), ≈ 114 M$ https://finovate.com/online-fraud-prevention-specialist-arkose-labs-secures-70-million/ | Pas de paiement authentifié ni de coercition |
| **DataVisor** | Détection non supervisée de réseaux de comptes frauduleux | n.v. | 40 M$ (déc. 2022) https://www.businesswire.com/news/home/20221214005330/en ; totaux divergents | Pas de réponse de gel |
| **Darwinium** | Empreinte et journey continu, « customer protection » | n.v. | Levées de 7 à 18 M$ selon bases (non réconcilié) | Peu de présence UE |
| **Callsign** | Identité et authentification adaptative | Banques UK | Séries anciennes (35 M$ en 2017 ; 32,5 M$ en 2022 selon CB Insights, non réconcilié) | Pas de contexte d'appel |
| **ThreatMark** | Comportement + détection de scams, Europe centrale | Banques CEE | **23 M$ (janv. 2025)** https://en.ain.ua/2025/01/07/czech-company-threatmark-raises-23m-in-a-fresh-investment | Pas de gel bénéficiaire |
| **Cleafy** | Détection de malwares/fraude en ligne, **Italie** | Banques italiennes | **12 M€ série B (mars 2026)**, 22 M€ au total https://fintech.global/2026/03/13/cleafy-raises-e12m-to-fight-banking-fraud-in-europe/ | Pas de score bénéficiaire |
| **Group-IB (Fraud Protection)** | Renseignement + détection côté client, AWS Marketplace (2025) | Banques Asie/MENA | Privé | Pas de réponse inter-PSP |
| **Bleckwen** | Fraude/scam FR (Ercom, 10 M$ en 2019 ; racheté par Feedzai selon connaissance générale) | Banques FR | À vérifier https://tech.eu/2019/06/26/french-fraud-detection-startup-bleckwen-secures-10-million/ | n.v. |
| **Lynx** | Fraude paiements, **Espagne**, Santander et PagoNxt | 300 M de clients protégés, 9 pays [Vendeur] https://thefintechtimes.com/em-conversa-fighting-ai-fraud-with-ai-with-lynx-tech/ | Privé | Peu de scams/contexte d'appel |
| **Hawk (Hawk AI)** | AML et fraude explicables, **Allemagne** | > 80 clients | **56 M$ série C (avr. 2025)** https://fintech.global/2025/04/08/hawks-ai-solutions-attract-56m-for-global-aml-efforts/ | Pas de session côté payeur |
| **Marble** | **Open source** (cœur) : règles fraude/AML, déploiement auto-hébergé, > 100 institutions annoncées | PME bancaires | **6,5 M€ série A** (Smartfin), 9 M€ au total https://thenextweb.com/news/marble-raises-6-5m-series-a-smartfin-aml | Pas de ML de coercition ni de partage inter-PSP |
| **Banques « dynamic risk engines »** | Moteurs internes (règles + ML) ; Monzo « call status », Revolut anti-scam carte (−30 % de pertes arnaque investissement, auto-déclaré), Nationwide call checker, **Starling Scam Intelligence (agent IA, mars-juin 2026)**, Metro Bank/Ask Silver | Millions de clients | — | Chaque signal est isolé ; aucun n'est fusionné avec un score bénéficiaire ni exporté en preuve |

### 2.2 Identité, KYC et liveness

| Nom | Ce qu'ils font | Clients / traction | Levées / propriétaire | Ne font PAS |
|---|---|---|---|---|
| **Alloy** | Orchestration d'identité et de décision | Banques/fintechs US | 100 M$ à 1,35 Md$ (2021) https://techcrunch.com/2021/09/30/alloy-raises-100m-at-a-1-35b-valuation-to-help-banks-and-fintechs-fight-fraud-with-its-api-based-platform/ | Pas de paiements en cours |
| **Socure** | Graphe d'identité, synthétiques | US | n.v. | UE peu couverte |
| **Onfido / Entrust** | Vérification de documents + selfie | Banques | Onfido racheté (fév. 2024), ≈ 215 M$ levés [S] https://www.cbinsights.com/company/onfido/financials | Chaque éditeur ne voit que ses clients |
| **Jumio** | KYC, Netverify | n.v. | dernière levée 150 M$ (2021, agrégateur) | idem |
| **Veriff** | KYC, 1,5 Md$ de valorisation (2022), ARR estimé 110 M$ (2025, Sacra) https://sacra.com/c/veriff/ | n.v. | idem | idem |
| **Sumsub** | Orchestration KYC/KYB ; +28 % sophistiqué (rapport) | n.v. | ≈ 37 M$ (CB Insights) | idem |
| **Persona** | Identité modulaire | n.v. | **200 M$ série D (30 avr. 2025), ≈ 2 Md$** https://www.cbinsights.com/company/persona-1/financials | idem |
| **iProov** | Liveness (Flashmark), iSOC | Gouvernements | n.v. | Pas de graphe inter-établissements |
| **ID R&D** | Liveness | n.v. | Racheté par Mitek (2021, connaissance générale, À vérifier) | n.v. |
| **Daon** | Biométrie et identité | n.v. | n.v. | n.v. |

### 2.3 Voix, appels et deepfakes

| Nom | Ce qu'ils font | Clients / traction | Levées / propriétaire | Ne font PAS |
|---|---|---|---|---|
| **Pindrop** | Voix pour centres d'appels (authentification, deepfake Pulse) ; VISR 2025 | Grandes banques US | 100 M$ de dette Hercules (juil. 2024), ≈ 220-235 M$ de capital https://www.pindrop.com/press-release/pindrop-secures-one-hundred-million/ | Protège l'appel entrant vers la banque, pas celui du fraudeur vers la victime |
| **Nuance Gatekeeper** | Biométrie vocale call center | Banques | Microsoft (racheté en 2022, connaissance générale) | Même limite |
| **Reality Defender** | API voix/vidéo, plugin Teams/Zoom (RealMeeting) | Banques, médias | **33 M$ série A étendue (oct. 2024)** https://dcvc.com/press-releases/reality-defender-expands-series-a-to-33-million-to-enhance-ai-detection-capabilities | Pas de lien avec l'ordre de paiement ; aucun benchmark indépendant live |
| **Resemble AI (Detect)** | Détecteur + TTS ; Chatterbox (open source) ; DETECT-3B Omni (98 % revendiqué) | n.v. | **13 M$ (déc. 2025)**, ≈ 25 M$ au total https://siliconangle.com/2025/12/08/resemble-ai-hauls-13m-different-approach-deepfake-detection/ | idem |
| **GetReal (Security)** | Détection d'usurpation de dirigeants, service humain « Respond » (co-fondé par H. Farid) | n.v. | **17,5 M$ série A (mars 2025)** https://www.securityweek.com/getreal-security-raises-17-5-million-to-tackle-gen-ai-threats/ | idem |
| **Hiya** | Appel de marque (Branded Call) au niveau réseau ; Vodafone UK (mars 2026), O2 Telefónica DE (fév. 2026) | Opérateurs | Privé | Pas de France ; sens sortant uniquement |
| **Truecaller** | Identification d'appelant, badge « banque vérifiée » via revendeurs | Mondial | Coté (Stockholm) | Efficacité bancaire non documentée par l'éditeur |
| **STIR/SHAKEN (USA) ; MAN (France, loi Naegelen 2020)** | Authentification des numéros | Opérateurs | Réglementaire | Les **mobiles** restent contournés ; Arcep enquête ; masquage depuis le 1/01/2026 |
| **Google (protection pendant l'appel)** | Pause de 30 s sur Android | Banques partenaires | Google | Android, partenaires ; pas d'efficacité indépendante |
| **Adaptive Security / Hoxhunt** | **Simulation de deepfake** (voix, visio, SMS) pour former les employés | Adaptive : > 100 entreprises ; 43 M$ puis 55 M$ série A (OpenAI, a16z) https://www.securityweek.com/serial-entrepreneurs-raise-43m-to-counter-ai-deepfakes-social-engineering/ ; Hoxhunt : voix, Teams, visio (oct. 2025) | Privés | Ne protègent pas le **paiement** : ils forment les gens |

### 2.4 Fraude B2B / paiements fournisseurs

| Nom | Ce qu'ils font | Clients / traction | Levées / propriétaire | Ne font PAS |
|---|---|---|---|---|
| **Trustpair** | Vérification des coordonnées fournisseurs | > 500 grands comptes (déc. 2025) | Série B ≈ 20 M€ (oct. 2022), ≈ 25 M$ total https://www.cbinsights.com/company/trustpair/financials | RIB seulement (rejeté par Adem comme « basique ») |
| **Sis ID / Eftsure** | Réseau collaboratif de vérification de RIB | 30 pays | Sis ID racheté par **Eftsure** | idem |
| **Nsknox** | Contrôle de paiements d'entreprise en temps réel | n.v. | 15 M$ série A (2019, M12, Viola) https://venturebeat.com/ai/m12-backed-nsknox-raises-15-million-for-real-time-payment-fraud-detection | Pas de contexte de demande |
| **Trustmi** | IA comportementale contre la fraude B2B (impersonation, phishing) | n.v. | 17 M$ série A (2023), ≈ 21 M$ https://fintech.global/2023/07/27/cybersecurity-firm-trustmi-bolsters-payment-security-with-17m-funding/ | Pas de voix ni de visio ; pas de signature d'intention |
| **Medius / Paymerang / Tipalti** | Automatisation des comptes fournisseurs avec contrôles intégrés | Grandes bases clients | Tipalti : 270 M$ série F à 8,3 Md$ (2021) ; 200 M$ de dette (sept. 2025) https://thepaypers.com/payments/news/tipalti-raises-usd-270-mln ; Medius/Paymerang : n.v. | Les contrôles sont dans le workflow ; l'attaque passe **hors workflow** |

### 2.5 Réseaux, schémas et régulateurs

| Nom | Ce qu'ils font | Statut |
|---|---|---|
| **Pay.UK EDEx** | Standard d'échange de données de fraude avant paiement (UK) | En conception ; https://www.wearepay.uk/enhanced-data-exchange-edex/ [V via v1] |
| **FNC-RF (Banque de France)** | Fichier d'**IBAN signalés** partagé entre PSP, loi du 6 nov. 2025 | **Live le 7/05/2026** [V] |
| **EPC FRIDA** | Rulebook + plateforme de partage d'IBAN suspects, MISP | RFI janv. 2026, rulebook v0.1 [S] |
| **VoP (Règlement 2024/886)** | Nom/IBAN avant virement | Obligatoire depuis le 9/10/2025 [V via v1] |
| **TMNL (Pays-Bas)** | 5 banques mutualisent la surveillance AML ; fragilisé juridiquement en 2024 | Précédent à citer : **le partage inter-banques exige une base légale** (art. 83a) https://riskandcompliance.freshfields.com/post/102h551/dutch-banks-combine-forces-to-combat-money-laundering-and-terrorist-financing [S] |

### 2.6 Open source et jeux de données utiles
- **Marble** (règles, auto-hébergé), **MISP** (format d'échange pressenti pour FRIDA), **LightGBM/XGBoost**, **BAF** (Feedzai, https://github.com/feedzai/bank-account-fraud ; licence **contradictoire selon les papiers : CC BY-NC-ND 4.0 ou CC BY-NC-SA 4.0**, donc non commercial et prudence sur la redistribution de variantes modifiées : le vérifier sur Kaggle), **IBM AMLworld** (générateur d'agents, arXiv 2306.16424, licence à vérifier), **RBA, ASVspoof 5, MLAAD, SIDTD** (v1).
- Voix de démo : **Chatterbox** (Resemble, MIT annoncé, **filigrane PerTh intégré** : bonne propriété pour une démo éthique, licence à vérifier sur le dépôt) ; **XTTS-v2 : licence CPML non commerciale, éditeur disparu** (éviter) ; **F5-TTS : poids CC-BY-NC** ; Kokoro (Apache 2.0, pas de clonage). https://aivideosensei.com/compare/kokoro-vs-chatterbox-vs-xtts [S]

### 2.7 Lecture d'ensemble (ce que la carte prouve)
1. **Trois consolidations en 2 ans** (Featurespace, BioCatch chez Visa ; Onfido chez Entrust ; Revelock chez Feedzai) : les PME/ETI et les banques moyennes n'ont plus de fournisseur indépendant. [Inf]
2. **Personne ne couvre la chaîne complète** payeur-contexte → bénéficiaire → gel → dossier de responsabilité. Visa s'en approche (Featurespace + BioCatch + partage réseau) mais **ne propose ni gel côté bénéficiaire, ni dossier de responsabilité PSR**. [Inf, à confirmer lors de la clôture T1 2027]
3. **Le B2B hors workflow** (appel, visio, WhatsApp) est couvert uniquement par la **formation** (Adaptive, Hoxhunt) et la **vérification de RIB** (Trustpair, Eftsure) : aucun ne lie un **ordre ni une réunion** à un **paiement**. [Inf]
4. **Le partage inter-PSP se standardise en Europe** (FNC-RF, FRIDA) : y brancher son produit est un **argument d'intégration (20 %)**, pas un risque.

---

## 3. Sous-possibilités (17)

Chaque fiche : problème · mécanisme · existant · neuf · données de démo (légales) · métriques · mapping · difficulté · note. NIST : IDs fins de mémoire sauf DE.AE (cf. C11). « Adem-rejeté » signale la proximité avec une idée déjà écartée.

### S1 · DOUBLE REGARD v2 : contexte de session du payeur × bande de risque du bénéficiaire
- **Problème** : faux conseiller (376 M€ en France) ; la banque du payeur voit la coercition, celle de la mule voit la mule.
- **Mécanisme** : fiche v1 idée A, inchangée sur le fond (score de **faits de session**, jamais d'émotion ; bande 0-3 + codes motifs ; matrice déterministe d'abord, GBM ensuite, LLM jamais décideur ; R0-R4).
- **Existant** : BioCatch Scams360 (payeur), Mastercard CFR et Visa A2A Protect (bénéficiaire/réseau), FNC-RF (liste binaire). **Aucun n'est publiquement fusionné** [Inf].
- **Neuf** : la fusion **avec ablation publiée** (payeur seul / bénéficiaire seul / les deux), des **codes motifs échangeables** (pas seulement « listé / non listé ») et **l'AI Act-safe by design**. Ne pas dire « personne ne partage » ; dire « FNC-RF partage un oui/non, nous partageons un pourquoi ».
- **Données** : simulateur à base d'agents (5 000 clients, 60 jours) avec confondants publiés ; bande bénéficiaire calibrée sur BAF (usage non commercial) ; aucune donnée personnelle.
- **Métriques** : ROC par ablation, taux d'intervention sur légitimes < 0,5 % (R2+), MTTD p95 < 300 ms hors LLM, € sauvés, FP par sous-population.
- **Mapping** : NIST DE.AE-02/-03/-06, DE.CM-03, RS.MA-02, RS.MI-01, RS.CO-03 · ATT&CK T1656, T1657, T1566.004, T1219 · ATLAS AML.T0073, AML.T0088 si voix clonée · D3FEND D3-UBA, D3-RTSD, D3-RAPA · ASI : sans objet (pas d'agent).
- **Difficulté** : moyenne (24 h pour un PoC). **Note : 82** (D80 R88 F78 C85 P82).

### S2 · Capteur de contexte de session (appel actif, accès distant, collage d'IBAN, coercition)
- **Problème** : repérer qu'un client authentifié est **guidé** (BioCatch le fait ; Google pause 30 s).
- **Mécanisme** : variables lisibles : appel actif (CXCallObserver/TelephonyManager), partage d'écran ou service d'accessibilité, **outil d'accès distant** (T1219/T1663), IBAN **collé** vs tapé, trajet direct vers « ajouter un bénéficiaire », plafond relevé dans la session, ratio montant/solde. Score par somme pondérée + monotonie (aucune variable ne peut réduire le risque d'un cas déjà rouge).
- **Existant** : BioCatch (propriétaire, boîte noire), Google (Android), Monzo « call status ».
- **Neuf** : **spécification ouverte des « faits de session »** (liste, source, pourquoi c'est AI Act-compatible) plus **mesure des confondants** (aidant familial en AnyDesk, accessibilité) : on publie le taux de FP **par sous-population** (aucun éditeur ne le fait, v1).
- **Données** : sessions simulées ; **télémétrie web-mobile mockée** (bouton « appel actif ») ; pas de vrais appareils.
- **Métriques** : rappel/précision par confondant, FP accessibilité (cible < 1 %), latence.
- **Mapping** : NIST DE.CM-03, DE.AE-02 · ATT&CK T1219, T1663, T1453, T1417 · D3FEND D3-RTSD, D3-UBA, D3-SDA.
- **Difficulté** : faible. **Note : 76** (D75 R70 F85 C80 P70).

### S3 · « Mule Radar » : pré-signalement côté bénéficiaire, export FNC-RF / FRIDA
- **Problème** : le FNC-RF n'intègre un IBAN qu'**après signalement** ; la première victime d'une mule neuve n'est pas protégée.
- **Mécanisme** : la banque **du bénéficiaire** voit ses propres flux entrants : âge du compte, **fan-in** (émetteurs distincts sur 48 h), **pass-through** (sorties/entrées sur 24 h), score d'onboarding (BAF), appareil partagé. Elle émet une **bande 0-3 + motifs** (`NEW_ACCT`, `FANIN_SPIKE`, `PASS_THROUGH`), un **TTL** et un **canal de contestation**. Export vers un **objet MISP** (format FRIDA) et vers l'API FNC-RF.
- **Existant** : Mastercard CFR (UK), Visa A2A (réseau), Feedzai BAF (dataset), Marble (règles), FNC-RF (post-signalement).
- **Neuf** : **détection avant tout signalement**, avec motifs, confiance, TTL et **droit de contestation** (FNC-RF prévoit la correction d'un signalement erroné [S]) : c'est ce qu'un auditeur demandera.
- **Données** : BAF pour l'onboarding, simulateur pour les flux ; **ne pas redistribuer BAF modifié** (licence ND possible).
- **Métriques** : rappel à 5 % de FP (BAF), délai entre ouverture et détection, % de fonds gelés avant sortie, écart de FP par groupe.
- **Mapping** : NIST DE.AE-03, DE.AE-07, RS.CO-03, ID.RA-02 · ATT&CK T1585/T1586, T1657 · D3FEND D3-NTCD, D3-RAPA · ATLAS : sans objet.
- **Difficulté** : moyenne. **Note : 80** (D78 R80 F80 C88 P75).

### S4 · Mandat signé (ordres vocaux et visio, B2B) : on ne détecte pas le faux, on fait signer le vrai
- **Problème** : Fideuram, Arup, Singapour : l'ordre vient d'une voix/visio/WhatsApp. Humains à 58 % de crédulité, détecteurs live sans benchmark indépendant.
- **Mécanisme** : v1 idée C. Extracteur LLM isolé → JSON strict ; déclencheur **sans friction** (canal hors workflow ET nouvel IBAN/montant/VoP no match) ; défi **WebAuthn/passkey** vers l'appareil enrôlé du demandeur revendiqué, lié au hash IBAN‖montant‖bénéficiaire‖nonce (**W3C Secure Payment Confirmation** existe : signature des détails de transaction par l'authentificateur FIDO, Chrome/Edge ; https://lists.w3.org/Archives/Public/w3c-news/2023AprJun/0002.html) ; sans signature : lot retenu.
- **Existant** : SPC/dynamic linking pour les paiements retail ; Trustpair/Eftsure (RIB) ; Trustmi (comportement) ; **le « contre-appel attesté » écarté par Adem est très proche**.
- **Neuf** : **l'extraction automatique du mandat depuis un canal non structuré** (note vocale, Teams, WhatsApp) et la **signature par le demandeur revendiqué**, pas par le payeur. Reste : **risque fort d'être jugé « Adem-rejeté »** ; à ne pas porter comme idée centrale.
- **Données** : 200 demandes légitimes + 200 frauduleuses générées par LLM (dont injections) ; **voix = membre de l'équipe, consentement écrit, Chatterbox filigrané, mention « synthétique » à l'écran** (AI Act art. 50 : transparence des contenus synthétiques ; l'art. 226-8 du Code pénal sur les montages sans consentement est à vérifier).
- **Métriques** : couverture du déclencheur, robustesse aux injections, % de défis sur légitimes < 2 %, temps de signature.
- **Mapping** : NIST PR.AA-03, PR.AA-04, DE.AE-02, RS.MI-01 · ATT&CK T1656, T1566.004, T1657 · ATLAS AML.T0088, AML.T0051 (injection sur l'extracteur) · D3FEND **D3-MAN, D3-MFA, D3-CBAN** · OWASP LLM01 ; ASI03/ASI07 si un agent relaie.
- **Difficulté** : moyenne. **Note : 80** (D70 R85 F80 C85 P88), **à pondérer −5 pour proximité avec l'idée rejetée**.

### S5 · Confirmation d'intention retail avec « affichage de confiance » (contradiction ancrée dans la fenêtre de signature)
- **Problème** : le client signe ce que le fraudeur lui a dit ; la SCA est une formalité.
- **Mécanisme** : la fenêtre de signature (SPC ou appli) affiche non pas « Valider ? » mais **les faits de la banque** : âge du compte bénéficiaire, fan-in, VoP, « aucun conseiller ne vous appelle ». Signature passkey liée au montant+IBAN+bande.
- **Existant** : Revolut/Starling messages, Visa A2A « explication en langage clair ».
- **Neuf** : l'explication est **signée avec le paiement** (preuve de ce que le client a vu) : essentiel en cas de litige PSR (négligence ou non).
- **Données** : parcours web simulé ; **LLM client simulé** pour tester la compréhension.
- **Métriques** : taux d'abandon des fraudes simulées (cible > 70 % en R2) vs légitimes (< 2 %), preuve archivable.
- **Mapping** : NIST PR.AA-03, DE.AE-06, RS.CO-02 · ATT&CK T1656, T1657 · D3FEND D3-MFA, D3-MAN.
- **Difficulté** : faible-moyenne. **Note : 74** (D65 R80 F78 C85 P70).

### S6 · Détection de scripts de manipulation dans les conversations (modèle Trustee)
- **Problème** : le fraudeur suit un **script** (urgence, autorité, secret, « dites que c'est pour des travaux »).
- **Mécanisme** : LLM + RAG sur une **taxonomie de scripts** (faux conseiller, investissement, romance, faux fournisseur) appliquée aux canaux **que la banque possède** : chat, motif de virement, déclaration au centre d'appels, formulaire « pourquoi ce virement ? ». Sortie : script identifié + extraits + **faits à opposer** (contradiction ancrée), jamais un verdict seul.
- **Existant** : **Trustee** (ESSEC 2025, même organisateurs : Utopia + Kryptosphère ; extension Chrome, score de risque + explication + réponses plus sûres ; a gagné la track Cybersécurité et le prix global) https://www.tse-fr.eu/anais-boughanem-d3s-masters-student-wins-first-prize-ai-hackathon [V] ; Starling Scam Intelligence ; Metro Bank/Ask Silver ; Westpac (assistant d'appel pour conseillers) ; recherches CHI 2025, PoPETs 2026 (v1).
- **Neuf** : **lien avec la décision de paiement** (le script devient une variable de S1) et **confrontation aux faits** (le client coaché ment, v1). Attention : la **transcription bat l'audio brut** (v1) ; l'audio de l'appel du fraudeur est **inaccessible** à la banque.
- **Données** : conversations **générées par LLM** (S9), aucune vraie conversation ; TeleAntiFraud-28k (chinois) hors scope.
- **Métriques** : F1 par typologie, taux d'injection réussie, FP sur conversations légitimes (confondants : conversation avec le conseiller réel).
- **Mapping** : NIST DE.AE-02, DE.AE-03 · ATT&CK T1656, T1566.004, T1598.004 · ATLAS AML.T0052, AML.T0051 · OWASP LLM01 · D3FEND : **non couvert** (indiquer D3-UBA par défaut).
- **Difficulté** : faible. **Note : 75** (D72 R70 F80 C70 P85).

### S7 · Réponse graduée R0-R4 + **budget de friction** (friction adaptative mesurée)
- **Problème** : trop de friction = clients furieux (et bloqués), pas assez = perte ; personne ne publie son coût de friction.
- **Mécanisme** : chaque niveau a un **coût de friction** (secondes, abandon estimé) et un **gain** (€ évités). Le moteur choisit l'action de coût minimal sous contrainte de risque et applique un **plafond de friction par client/30 jours**. Réversibilité obligatoire à partir de R2 ; humain à R3+.
- **Existant** : step-up et risk-based auth partout ; pas de **budget** publié.
- **Neuf** : **métrique « friction par fraude évitée »** et courbe « perte évitée vs friction » (évaluation hors politique sur le simulateur). Répond à « proportionnée, actionnable » (grille 20 %).
- **Données** : simulateur ; coûts de friction paramétrés (hypothèses déclarées).
- **Métriques** : € évités par minute de friction ; % de légitimes touchés ; temps moyen de libération.
- **Mapping** : NIST RS.MA-02/-03, RS.MI-01, DE.AE-04 · ATT&CK T1657 · D3FEND D3-AL, D3-ST, D3-MFA.
- **Difficulté** : faible. **Note : 79** (D68 R92 F82 C85 P75).

### S8 · « GOLDEN HOUR » : chaîne de gel automatisée avec dossier prêt à envoyer
- **Problème** : un virement instantané est définitif en 10 s ; les fonds quittent la mule en minutes. **Les récupérations réelles se jouent en heures** (Singapour : retenus en 2 jours ; Fideuram : > 50 % récupéré grâce à trois pays, mais 36-40 M€ perdus).
- **Mécanisme** : dès R3/R4, le moteur émet (1) une **alerte de retenue** à la banque du bénéficiaire avec bande et motifs (le message de S1/S3) ; (2) un **traçage multi-sauts** des fonds sur les flux visibles (1 à 2 sauts) ; (3) un **paquet de gel prêt à envoyer** (preuves, horodatage, IBAN, référence FNC-RF) à chaque établissement suivant ; (4) un **chronomètre de récupérabilité** (€ encore récupérables en fonction du délai). Humain valide à R4.
- **Existant** : gel manuel via centres anti-escroquerie (Singapour ASC/ADCC), rappel de fonds SEPA/SWIFT (lent), FNC-RF (listing sans blocage automatique [S]), Mastercard A2A Protect (cadre de litiges UK). **Je n'ai trouvé aucun produit qui automatise paquet de gel + traçage multi-sauts en fiat instantané** [Inf, absence de preuve, pas preuve d'absence].
- **Neuf** : **la vitesse mesurée** et le paquet de gel auditable. Côté légal : en France, la banque du bénéficiaire retient aujourd'hui à sa discrétion (contrat, LCB-FT) ; le PSR art. 83 en fera une obligation [S].
- **Données** : simulateur avec **3 banques fictives** et une mule qui **fractionne** les sorties ; aucune banque réelle contactée.
- **Métriques** : **temps de détection → gel (p50/p95)**, % de fonds retenus par minute, nombre de sauts tracés, faux gels (comptes de victimes-mules) par 1 000.
- **Mapping** : NIST **RS.MA-01/-04, RS.AN-03, RS.CO-02/-03, RS.MI-01**, DE.AE-03 · ATT&CK T1657, T1656 · D3FEND D3-AL (verrouillage), D3-NTCD · ATLAS : sans objet.
- **Difficulté** : moyenne-élevée (traçage multi-sauts). **Note : 80** (D70 R95 F70 C85 P90). **Dans le composite avec S1 et S12 : 85.**

### S9 · « Scam Gym » : un LLM qui joue l'arnaqueur (auto-jeu adversarial) + benchmark ouvert
- **Problème** : pas de jeu public avec coercition ; le jeu FCA est fermé ; les GAN détruisent les signaux comportementaux (v1).
- **Mécanisme** : un **agent arnaqueur** (LLM) conduit des scénarios (faux conseiller, faux fournisseur, investissement) contre des **clients simulés** (LLM) et **notre défense** ; il adapte ses tactiques aux frictions rencontrées. Résultat : conversations, sessions et flux **étiquetés**, plus une **courbe de contournement** (combien de tentatives avant de passer R2).
- **Existant** : académique (TeleAntiFraud-28k, RAG+LLM 97,98 % sur synthétique [S]), « baiting » d'arnaqueurs par IA (opérateurs) ; **aucun benchmark ouvert d'APP en français** [Inf].
- **Neuf** : l'**auto-jeu avec courbe de contournement** comme métrique de robustesse, et un **jeu de données FR publiable** (confondants inclus). Répond à « vos données sont synthétiques » en faisant du synthétique un **atout méthodologique**.
- **Données** : 100 % synthétiques, aucun appel réel ; guardrails (pas de contenu opérationnel réutilisable : scripts déjà publics).
- **Métriques** : taux de contournement par niveau, nombre moyen de tentatives, diversité des tactiques.
- **Mapping** : NIST ID.RA-05 (risque évalué), DE.AE-02 · ATT&CK T1656, T1598.004 · ATLAS **AML.T0015 Evade AI Model, AML.T0043 Craft Adversarial Data**, AML.T0051 · OWASP LLM01 · D3FEND D3-DE (environnement leurre) à titre d'analogie.
- **Difficulté** : faible-moyenne. **Note : 75** (D75 R60 F82 C70 P88). C'est un **accélérateur de crédibilité** pour S1/S8 plus qu'une idée autonome.

### S10 · Canaris et honeypots (« hameçon inversé ») alimentant FNC-RF/FRIDA
- **Problème** : l'ATO arrive avec de vrais identifiants ; le fraudeur ressemble à un client « un peu inhabituel ».
- **Mécanisme** : v1 idée B : clients synthétiques injectés là où les fraudeurs récoltent (kits de phishing, journaux d'infostealers) ; toute connexion canari = fraude par construction ; l'IBAN de mule saisi alimente S3 avec confiance maximale ; rétro-chasse d'empreinte sur de vrais clients.
- **Existant** : Thinkst Canarytokens et leurres génériques (D3-DUC/D3-DO/D3-DE) ; **aucun usage banque** documenté publiquement [Inf].
- **Neuf** : **le canari livre l'IBAN de la mule**, entrée la plus fiable possible pour une liste partagée. Limite : couverture seulement des campagnes touchées ; **aveugle à l'APP** (premier poste de pertes). Risque légal : injection dans de vrais kits (hors périmètre hackathon).
- **Données** : kit de phishing **local**, canaris synthétiques ; fond légitime RBA (33 M de connexions).
- **Métriques** : précision de la graine (100 % par construction), délai récolte → détection, mules par campagne.
- **Mapping** : NIST DE.AE-07, ID.RA-02, RS.AN-03 · ATT&CK T1078, T1566, T1539, T1657 · D3FEND **D3-DUC, D3-DO, D3-DE**.
- **Difficulté** : faible-moyenne. **Note : 77** (D75 R72 F85 C75 P82).

### S11 · Faux KYC : preuve de capture + graphe de réutilisation de visages/appareils
- **Problème** : caméras virtuelles et face swap (iProov : +2 665 %) ; fermes d'identités synthétiques qui alimentent les **comptes mules**.
- **Mécanisme** : v1 idée D (attestation matérielle des trames, graphe FAISS, classifieur de documents, contexte d'appareil BAF).
- **Existant** : iProov, Onfido/Entrust, Veriff, Sumsub, Persona, Sardine, ThreatMetrix.
- **Neuf** : réutilisation **inter-établissements** (non couverte), mais **RGPD art. 9 et AI Act annexe III 1(a) (1:N)** en font le sujet le plus risqué.
- **Données** : SIDTD/IDNet/MIDV-2020, visages **générés** ; **jamais** de vraies pièces.
- **Métriques** : détection d'injection, précision/rappel du clustering, AUC SIDTD, 2ᵉ capture chez légitimes.
- **Mapping** : NIST PR.AA-02/-03, DE.AE-02 · ATLAS **AML.T0088, AML.T0015, AML.CS0033/CS0034** · ATT&CK T1656, T1585 · D3FEND D3-BAN, D3-CBAN.
- **Difficulté** : élevée (attestation mockée). **Note : 67** (D72 R65 F55 C62 P72).

### S12 · Triage « authorised vs unauthorised » avec **dossier de responsabilité PSR**
- **Problème** : demain (PSR UE) le PSP doit **rembourser** l'usurpation de banque si le client signale et dépose plainte, **sous 15 jours ouvrés (remboursement ou refus motivé)**, la SCA ne prouvant plus la négligence ; la charge de la preuve pèse sur le PSP [S, cabinets, À vérifier]. Aujourd'hui, 85 % des pertes restent aux clients (EEE).
- **Mécanisme** : à chaque alerte, le moteur classe le cas (non autorisé / autorisé par manipulation / autorisé légitime), identifie **le régime applicable** (usurpation du PSP, négligence grave, autre) et **assemble les pièces** : télémétrie de session, signaux de l'appel, bande bénéficiaire, **ce que le client a vu et signé (S5)**, historique de décision. Sortie : dossier d'analyste et **export pour le régulateur/l'auditeur** (journal rejouable).
- **Existant** : case management générique (NICE, Hawk) ; dossier de litiges de Mastercard A2A Protect (UK) ; **aucun outil public qui calcule le régime de responsabilité PSR** [Inf].
- **Neuf** : relier **détection → responsabilité** ; répond directement à la question piège et au jury KPMG (traçabilité/défendabilité).
- **Données** : cas simulés étiquetés par régime (hypothèses juridiques déclarées, relues par Titouan).
- **Métriques** : temps de constitution d'un dossier (minutes), complétude (% de pièces), accord avec étiquette juridique, rejouabilité (100 %).
- **Mapping** : NIST GV.OC-03 (exigences légales), GV.RR-02 (rôles), RS.AN-06/-07 (actions et données conservées), RS.CO-02, DE.AE-08 · ATT&CK T1656 (contexte) · D3FEND D3-MAN (intégrité des messages).
- **Difficulté** : faible-moyenne. **Note : 78** (D60 R85 F85 C95 P80).

### S13 · Paiements agentiques : l'arnaqueur social-engineere l'**agent** qui paie
- **Problème** : des agents achètent (Mastercard Agent Pay, Visa Intelligent Commerce, AP2 donné à la FIDO Alliance en 2026) ; des pages piégées leur injectent des instructions de paiement (+32 % de cas Google, nov. 2025-fév. 2026 ; PayPal et faux API cités).
- **Mécanisme** : **« provenance de l'intention »** : un paiement d'agent n'est exécutable que s'il se rattache à un **mandat signé** (AP2) dont le bénéficiaire/plafond correspondent ; sinon R2+ (confirmation humaine). Détection d'écarts bénéficiaire-mandat et de pages-sources suspectes.
- **Existant** : jetons agentiques Mastercard, mandats AP2, Trusted Agent (Visa) ; **la fraude agentique n'a pas de règles de responsabilité dédiées** [S] https://risingwave.com/blog/mastercard-agent-pay-vs-visa-vs-stripe-agentic-commerce/ · https://paymentsnext.com/?p=16475.
- **Neuf** : un **contrôle côté PSP** de cohérence mandat-paiement, avec réponse graduée. **Chevauche probablement une autre piste (agents) : coordonner avec celle de la piste 3.**
- **Données** : agent de démonstration (LangGraph) + pages piégées **locales** ; aucune vraie boutique.
- **Métriques** : taux de paiements d'agent hors mandat bloqués, FP sur agents légitimes, latence.
- **Mapping** : NIST DE.AE-02, PR.AA-05, RS.MI-01 · ATT&CK T1657 · ATLAS **AML.T0051, AML.T0053, AML.T0108** · OWASP **ASI01, ASI02, ASI03, ASI09** · D3FEND D3-MAN, D3-APCA.
- **Difficulté** : moyenne. **Note : 70** (D65 R70 F65 C70 P85).

### S14 · Red-team deepfake de sa propre entreprise (« fire drill »)
- **Problème** : personne ne mesure le temps de réaction d'une équipe face à une voix clonée de son dirigeant.
- **Mécanisme** : appel simulé (voix clonée **consentie**) à des employés, mesure du **taux de passage à l'acte** et du **délai de signalement**.
- **Existant** : **Adaptive Security** (43 puis 55 M$, OpenAI/a16z), **Hoxhunt** (voix, Teams, visio) : **marché déjà occupé**.
- **Neuf** : peu ; seulement si le drill est **branché sur le moteur de paiement** (le « faux » ordre est réellement retenu).
- **Données** : voix d'équipe consentie, Chatterbox filigrané.
- **Métriques** : taux de passage à l'acte, délai de signalement.
- **Mapping** : NIST PR.AT-01 (sensibilisation), ID.RA-05 · ATT&CK T1656, T1566.004 · ATLAS AML.T0088 · D3FEND : sans objet.
- **Difficulté** : faible. **Note : 60** (D45 R50 F85 C60 P70). À citer comme **concurrence** plus que comme projet.

### S15 · ATO « chaîne complète » : cookie volé, SIM swap, reset helpdesk
- **Problème** : infostealers (> 1 M de comptes bancaires de grandes banques en 2025), reset MFA par ingénierie sociale (Scattered Spider), SIM swap.
- **Mécanisme** : détection de **dérive post-login** (changement d'empreinte/ASN dans la session, première action sensible), **porte de reset helpdesk** exigeant une preuve cryptographique (passkey ou attestation d'appareil), blocage des nouveaux bénéficiaires 24 h après tout changement d'authentifiant, révocation de sessions.
- **Existant** : BioCatch, ThreatMetrix, SEON, Callsign ; Chrome **DBSC** (liaison de session à l'appareil) [À vérifier].
- **Neuf** : la **porte de reset helpdesk** liée au contexte de paiement (peu documentée) ; sinon dense en concurrents.
- **Données** : RBA (33 M de connexions), traces d'attaques simulées (navigateur anti-détection).
- **Métriques** : précision/rappel de la dérive, délai de détection, taux de resets légitimes bloqués.
- **Mapping** : NIST PR.AA-03, DE.CM-03, DE.AE-02, RS.MI-01 · ATT&CK **T1078, T1539, T1621, T1111, T1556, T1451, T1650** · D3FEND **D3-ANET, D3-ANCI, D3-UGLPA, D3-WSAA, D3-CE, D3-AL**.
- **Difficulté** : moyenne. **Note : 73** (D72 R75 F75 C75 P65).

### S16 · Lien « réunion → paiement » : le score de confiance d'une visio conditionne la libération du paiement
- **Problème** : Arup/Singapour : la visio « prouve » l'ordre ; **aucun outil ne relie la réunion à l'ordre de paiement**.
- **Mécanisme** : un agent en réunion (plugin type Reality Defender/Resemble, ou **défi-réponse** type **PITCH/GOTCHA** : demander un geste ou un son inattendu ; PITCH : AUROC 88,7 % machine ; GOTCHA : 80-88 % AUC) produit un **score de confiance** ; tout ordre de paiement issu d'un participant dont le score est « suspect » est retenu et suit S4. https://arxiv.org/html/2402.18085v4 · https://arxiv.org/html/2210.06186v4 [V, académique]
- **Existant** : détecteurs live (prototype Fraunhofer août 2026, article Brno AUC 0,9935 non relu par les pairs) ; **aucun benchmark indépendant sur Teams/Zoom en 2026** [S].
- **Neuf** : le **couplage score de réunion → blocage de paiement**. Détection faible : à présenter comme **signal d'appoint**, jamais décideur.
- **Données** : visio **entre membres de l'équipe**, face swap open source **consenti**, étiquette « synthétique ».
- **Métriques** : AUC du défi-réponse sur nos enregistrements, délai de décision, consentement/RGPD.
- **Mapping** : NIST DE.AE-02, DE.AE-03, RS.MI-01 · ATT&CK T1656, T1566.004 · ATLAS AML.T0088, AML.T0015 · D3FEND D3-MAN, D3-BAN.
- **Difficulté** : moyenne-élevée. **Note : 74** (D70 R78 F65 C70 P90).

### S17 · Statut d'appel de la banque / anti-usurpation de numéro (proche d'une idée rejetée)
- **Problème** : le numéro affiché ne prouve rien (> 19 000 signalements Arcep en 2025).
- **Mécanisme** : l'appli affiche si la banque **appelle réellement** le client ; sinon alerte.
- **Existant** : **Monzo « call status »**, **Hiya Branded Call** (Vodafone UK, O2 DE), Truecaller, MAN, Google.
- **Neuf** : peu ; **assimilé au « contre-appel attesté » rejeté par Adem** : n'en faire qu'un **signal d'entrée** de S1 (variable `BANK_CALL_ACTIVE`).
- **Données** : bouton simulé.
- **Métriques** : effet marginal dans l'ablation S1.
- **Mapping** : NIST DE.AE-02 · ATT&CK T1656, T1566.004 · D3FEND D3-MAN.
- **Difficulté** : faible. **Note : 66** (D60 R70 F70 C75 P60).

**Synthèse des notes** : S1 82 · S8 80 · S3 80 · S4 80* · S7 79 · S12 78 · S10 77 · S2 76 · S9 75 · S6 75 · S5 74 · S16 74 · S15 73 · S13 70 · S11 67 · S17 66 · S14 60. (*à pondérer −5 : proximité avec idée rejetée.)

---

## 4. Angles d'innovation qui plairont au jury (classés)

Contexte jury : Avalanche (intégration, preuve), KPMG (fraude, AML/CFT, DORA, auditabilité), Kryptosphère (vainqueur 2025 : Trustee). Ce qui a gagné : **Trustee (ESSEC 2025)** : produit grand public lisible, score + **explication** + action plus sûre, prix de la track et prix général [V, https://www.tse-fr.eu/anais-boughanem-d3s-masters-student-wins-first-prize-ai-hackathon]. Autres sprints : PSBS Hackathon Inde 2026 (cas : mules inter-canaux, fraude réseau ; lauréat : équipe CodeX de VIT Chennai) [S, https://www.psuconnect.in/bank-news/indian-bank-vit-chennai-conclude-psbs-hackathon-series-2026-on-fraud-prevention] ; FCA/PSR APP TechSprint 2022 (3 cas : prévention en temps réel, partage de données, détection à la source) [V, https://www.fca.org.uk/techsprints/authorised-push-payment-fraud] ; Money20/20 Europe 2026 : Aviel Intelligence (comptes de scam et paiements sortants) [S]. **Aucun sprint ACPR, Banque de France ou Europol 2025-2026 trouvé** (les mentionner sans source serait de l'invention). Leçon [Inf] : le jury récompense **un problème vécu, une explication claire, un chiffre mesuré et un contre-exemple**.

| Rang | Angle | Pourquoi ça marque | Moment « wow » de démo | Risques |
|---|---|---|---|---|
| **1** | **GOLDEN HOUR : chronomètre de récupérabilité + paquet de gel** (S8, avec S1/S12) | Transforme la **vitesse de réponse** en métrique visible ; colle à Fideuram (95 M€ dont 36-40 perdus) et à Singapour (2 jours) ; vise **Respond (20 %)** là où les concurrents n'ont rien de public | Écran partagé : virement coercé à T0 ; à T+9 s retenue chez la banque B ; à T+40 s paquet de gel envoyé à la banque C ; **jauge « € encore récupérables »** qui décroît seconde par seconde, puis contre-exemple Paul (aucune friction) | Banques simulées ; base légale du gel ; faux gels de victimes-mules ; traçage multi-sauts à tenir en 24 h |
| **2** | **DOUBLE REGARD avec ablation** (S1) | Chiffre unique et défendable : « chaque moitié seule : X % de FP ; les deux : Y % » ; positionne notre produit **contre Visa A2A + FNC-RF** en montrant ce qu'ils ne fusionnent pas | La courbe ROC à trois lignes projetée pendant que les décisions défilent | Visa peut déjà fusionner en interne (BioCatch + Featurespace) ; le simulateur doit rester crédible |
| **3** | **Mule Radar branché FRIDA/FNC-RF** (S3) | **Intégration réelle à une infrastructure en construction** (fichier FNC-RF live, RFI EPC) = score « faisabilité/intégration » ; motifs + TTL + contestation = score « conformité » | Un objet **MISP** généré en direct et « poussé » vers un faux FNC-RF avec son motif et son bouton de contestation | FRIDA/FNC-RF évoluent ; accès aux vraies API impossible (mock) |
| **4** | **Dossier de responsabilité PSR** (S12) | Répond à « qui est responsable ? » **avec un artefact**, pas une phrase : dossier prêt pour l'auditeur et délai de 15 jours | Bouton « exporter pour le régulateur » : PDF + journal rejouable qui **redonne la même décision** devant le jury | Interprétation juridique (PSR non publié) ; risque de paraître « papier » |
| **5** | **Scam Gym : courbe de contournement** (S9) | Rend la détection **falsifiable** : « notre arnaqueur-IA a besoin de N tentatives pour passer R2 » ; répond à « données synthétiques » | L'agent arnaqueur apprend à contourner une friction, puis la défense se met à jour : la courbe se redresse | Peut sembler gadget ; risque de contenus sensibles (scripts déjà publics) |
| **6** | **Budget de friction** (S7) | Montre la **proportionnalité** (« 0,3 s de friction par fraude évitée ») ; parle aux banques (taux d'abandon) | Curseur de friction en direct sur le tableau de bord | Hypothèses de coût discutables |
| **7** | **Lien réunion → paiement** (S16) | Visuel fort (visio avec face swap consenti) ; touche Arup/Singapour | Visio en direct : le « DAF » est un clone ; le **paiement est retenu** | Détection live faible (aucun benchmark indépendant) ; consentement/RGPD |
| **8** | **Agent Payment Firewall (S13)** | Thème 2026, aligné OWASP Agentic | Un agent d'achat est détourné par une page piégée ; le paiement hors mandat est bloqué | Chevauche la piste agents ; scope |
| **9** | **Mandat signé** (S4) | Démo très lisible (« on ne détecte pas, on prouve ») | Passkey qui s'affiche sur le téléphone du « PDG » avec le montant et l'IBAN | **Proche d'une idée rejetée** |
| **10** | **Canaris/honeypots → IBAN de mule** (S10) | Récit mémorable (« le fraudeur nous livre ses IBAN ») | Le fraudeur tombe sur un faux compte et saisit son IBAN | Couverture limitée ; zone grise légale en réel |

**Composition recommandée (sans restreindre le scope, Adem)** :
- **Cœur du PoC (1 scénario, faux conseiller)** : S1 + S8 + S12, avec S7 (graduation) comme moteur de réponse.
- **Couverture large annoncée** : le même moteur couvre le **B2B** (virement important vers nouveau bénéficiaire, voix clonée, BEC) parce que le déclencheur est « contexte de demande + bande bénéficiaire », **indépendant** du canal de manipulation ; S4/S16 sont des modules d'entrée.
- **Ce qui fait la différence (1 phrase)** : « Visa et Mastercard vendent un score ; nous mesurons **la minute où l'argent est encore récupérable** et nous remettons à l'auditeur **le dossier qui dit qui est responsable**. »

---

## 5. Comment la blockchain (Avalanche, eERC, preuve immuable, attestations) peut servir sans être artificielle

Principe : **aucune donnée personnelle on-chain** (RGPD, droit à l'effacement) ; on n'ancre que des **engagements (hash)**. Une blockchain n'a de sens que lorsqu'il y a **plusieurs parties qui ne se font pas confiance** (banque A, banque B, client, assureur, régulateur). Pour un journal interne d'une seule banque, un hash chaîné signé suffit : le dire explicitement.

| # | Usage | Crédibilité | Mécanisme | Limite honnête |
|---|---|---|---|---|
| **B1** | **Ancrage du journal de décisions** (racine de Merkle toutes les N minutes sur Avalanche C-Chain ou un L1 de consortium) | **Élevée** si plusieurs établissements ou un client contestent | Chaque décision (entrées, version règles/modèle, humain validateur) est hachée ; l'auditeur vérifie qu'**aucune décision n'a été antidatée** et rejoue le calcul | Un horodatage RFC 3161 fait presque pareil pour une seule banque ; la valeur vient de la **non-répudiation multi-parties** |
| **B2** | **Journal d'événements du registre d'IBAN suspects** (ajout, contestation, retrait, TTL) | **Moyenne-élevée** | FRIDA/FNC-RF restent la source (MISP/Banque de France) ; on ancre les **événements** pour prouver **qui a listé quoi et quand** (responsabilité en cas de signalement erroné) ; engagements HMAC par IBAN (un hash simple d'IBAN est énumérable) | Ne remplace pas FNC-RF ; l'effacement RGPD impose que les données restent hors chaîne |
| **B3** | **Accusés de gel horodatés (S8)** | **Élevée** | Chaque paquet de gel et chaque accusé de réception sont signés puis ancrés : preuve **incontestable** de qui a agi à quelle minute entre trois établissements | Les établissements doivent adhérer (consortium) |
| **B4** | **Mandat signé ancré** (S4/S5) | **Moyenne** | La signature passkey du mandat (montant, IBAN, demandeur) est ancrée : preuve pour **assureur, auditeur, client** | Surdimensionné pour un seul acteur ; utile dans un litige à trois |
| **B5** | **Mise en attente programmable (rails on-chain)** | **Moyenne, seulement pour fintechs/PSP qui paient en stablecoin** | Séquestre avec **timelock** et libération à **deux clés** (client + analyste) ; **eERC** chiffre les **montants** et soldes, **expéditeur et destinataire restent publics**, avec une **clé d'auditeur** rotative pour le régulateur [V, https://docs.avax.network/integrations/encrypted-erc] | **Ne couvre pas SEPA** : à ne pas présenter comme solution du faux conseiller bancaire |
| **B6** | **Registre de responsabilité du modèle** | **Moyenne-élevée** | Empreinte du modèle, des règles et du seuil, plus signature du validateur humain, ancrées à chaque changement : on démontre **quelle version a décidé** | Gouvernance interne suffit en mono-établissement |

- **Pas de place** : la **détection** elle-même (latence 10 s, données personnelles), le scoring d'onboarding, le LLM. Dire que la blockchain n'intervient que sur **la preuve et la coordination**.
- **Cas d'attestation** : je n'ai **pas** trouvé de déploiement EAS (Ethereum Attestation Service) confirmé sur Avalanche [S] ; en cas d'usage, déployer un contrat d'attestation minimal (ou utiliser EAS si une instance existe, À vérifier).
- **Positionnement jury Avalanche** : B1 + B3 donnent un **PoC testable en quelques heures** (contrat d'ancrage de racines + vérificateur côté auditeur).

---

## 6. Réponse à « si votre modèle se trompe, qui est responsable ? »

**Réponse courte (20 secondes)** : « **Le PSP reste responsable**, la loi le dit (PSR : remboursement de l'usurpation de banque, délai de 15 jours ouvrés, charge de la preuve sur la banque). Notre rôle est de **réduire la probabilité de l'erreur, de la rendre réversible, et de prouver ce qui s'est passé**. Le modèle conseille ; **une matrice déterministe, versionnée, décide** ; **un humain valide à partir de R3**. »

**Les trois cas d'erreur** (adaptés à cette piste) :

| Erreur | Qui est responsable | Ce qui la limite | Preuve fournie |
|---|---|---|---|
| **Faux négatif** (fraude non détectée) | **Le PSP** (UK : 61 % des pertes APP remboursées en 2025 selon UK Finance, 88 % des montants éligibles remboursés selon le PSR ; UE : le PSR rendra l'usurpation de banque remboursable) | Détection à deux regards ; **Golden Hour** (récupération) | Dossier de responsabilité (S12) ; journal rejouable |
| **Faux positif** (client légitime bloqué) | **Le PSP** (contrat, RGPD art. 22 : recours humain pour une décision automatisée à effet significatif) | Friction graduée (R0-R4) ; **réversibilité en un clic** ; budget de friction | Message client avec faits ; horodatage de la libération |
| **Faux gel côté bénéficiaire** (le « bénéficiaire » est une victime-mule) | **La banque qui gèle** ; correction du signalement possible (FNC-RF prévoit le retrait d'un signalement erroné [S]) | Bande avec **motifs, TTL, contestation** ; humain + LCB-FT à R4 | Journal d'événements (B2), pas de donnée personnelle partagée |

**Chaîne de responsabilité (à afficher sur la slide conformité)** :
1. **Décideur** : règle déterministe signée (version, hash), pas un modèle opaque ; le **LLM n'agit jamais** (il rédige la fiche, cherche une explication légitime, passe sceptique).
2. **Humain** : validation à R3/R4 (nom, horodatage) ; **astreinte** et SLA (par ex. 30 min).
3. **Gouvernance** : *shadow mode* avant mise en service, seuils changés par **double validation**, **kill-switch**, suivi de dérive, revue trimestrielle des FP par sous-population (biais).
4. **Fournisseur** : DORA art. 28-30 (tiers TIC) si SaaS ; incident majeur (art. 17-19) en cas de vague d'ATO ; **clause de répartition** contractuelle modèle/banque.
5. **AI Act** : l'exception de l'annexe III 5(b) sort le scoring de **fraude financière** du haut risque (lecture stricte, À vérifier) ; **aucune reconnaissance d'émotions** (annexe III 1(c) évitée) ; obligations haut risque **reportées au 2 déc. 2027** si l'Omnibus est adopté [S] ; art. 4 (maîtrise de l'IA) et art. 50 (transparence deepfake, pour nos voix de démo) restent applicables.
6. **Comparaison** : Singapour impose un **partage de responsabilité par cascade** (banques, opérateurs) mais **exclut l'APP** (SRF, v1) ; la jurisprudence française a, selon une source non vérifiée, retenu une responsabilité partielle d'un opérateur dans un cas de faux conseiller (À vérifier).

**Comment un auditeur vérifie en 3 gestes** : (a) il tire une décision au hasard dans le journal ; (b) il la **rejoue** avec la version de règles et de modèle indiquée et obtient **le même résultat** ; (c) il vérifie que la racine Merkle correspondante est **ancrée** (B1) à l'heure annoncée.

---

## 7. Sources (liens)

**Chiffres et incidents**
- EBA-ECB : https://www.ecb.europa.eu/press/intro/publications/pdf/ecb.ebaecb202512.en.pdf
- OSMP 2025 (rapport) : https://www.banque-france.fr/system/files/2026-09/Rapport_2025_de_l_OSMP.pdf · synthèse : https://www.moneyvox.fr/banque/actualites/110566/faux-conseillers-bancaires-les-chiffres-chocs-de-explosion-de-la-fraude-par-manipulation
- FNC-RF (Banque de France, 7 mai 2026) : https://www.banque-france.fr/system/files/2026-05/CP_Lancement_FNC_RF.pdf · détails : https://www.moneyvox.fr/banque/actualites/108588/nouveau-fichier-des-iban-frauduleux-quest-ce-que-ca-change-pour-la-lutte-contre-la-fraude
- EPC FRIDA : https://fintech.global/?p=229956 · https://www.europeanpaymentscouncil.eu/node/28126
- UK Finance 2026 : https://www.ukfinance.org.uk/system/files/2026-06/UK%20Finance%20Fraud%20Report%202026.pdf · https://www.crowdfundinsider.com/2026/06/285657-fraudulent-activities-and-sophisticated-scams-continue-to-pose-serious-threat-to-uk-security-as-losses-approach-1-3b/
- FBI IC3 2025 (secondaire) : https://www.mcdonaldhopkins.com/insights/news/the-sobering-truth-of-the-fbis-2025-internet-crime-complaint-center-report · https://www.insurancebusinessmag.com/us/news/cyber/business-email-fraud-drives-bulk-of-us-cybercrime-losses-analysis-590687.aspx · https://cyberscoop.com/fbi-internet-crime-complaint-center-annual-cybercrime-report/
- Fraude au virement France : https://clubic.com//dossier-610123-l-arnaque-au-faux-fournisseur-une-fraude-qui-cible-les-pme-et-detourne-les-virements.html · https://www.economie.gouv.fr/node/3229131 · https://sis-id.com/en/about/
- Fideuram : https://oecd.ai/en/incidents/2026-09-25-b291 · https://gulfnews.com/world/europe/ai-voice-cloning-scam-hits-italian-bank-fake-executives-trigger-95m-overseas-transfers-1.500688692 · https://letsdatascience.com/news/fideuram-transfers-eur95-million-after-voice-cloning-fraud-6189ecda
- Singapour : https://www.police.gov.sg/media-room/news/20250407_singapore_and_hong_kong_police_force_recover_over_$670000_in_a_scam · Arup : https://frankonfraud.com/?p=22425
- Humains et voix clonées : https://www.theregister.com/2025/10/09/voice_clone_detection_study/ · Fraunhofer : https://www.fraunhofer.de/en/press/research-news/2026/august-2026/a-real-time-warning-system-for-fake-videoconferences.html · PITCH : https://arxiv.org/html/2402.18085v4 · GOTCHA : https://arxiv.org/html/2210.06186v4
- ATO : https://www.malaysianwireless.com/2026/04/kaspersky-rise-banking-credential-theft/ · https://flare.io/prevent-customer-account-takeover · https://microblink.com/?p=42037 · Europol IOCTA : https://eucrim.eu/news/iocta-2025/ · Scattered Spider : https://www.bleepingcomputer.com/news/security/3-key-takeaways-from-the-scattered-spider-attacks-on-insurance-firms/
- KYC synthétique : https://www.transunion.co.uk/content/dam/transunion/gb/business/documents/H1-2026-Fraud-Trends-Report.pdf · https://www.bankinfosecurity.com/ai-tools-synthetic-ids-are-fracturing-kyc-programs-a-a-30401
- Arcep/MAN : https://siecledigital.fr/2026/02/02/appels-frauduleux-larcep-met-les-operateurs-sous-pression/
- Agentique : https://securityaffairs.com/194822/ai/hidden-web-prompts-trick-ai-agents-into-sending-money.html · https://www.securityweek.com/prompt-injection-attacks-trick-ai-agents-into-making-crypto-payments/ · https://risingwave.com/blog/mastercard-agent-pay-vs-visa-vs-stripe-agentic-commerce/ · https://paymentsnext.com/?p=16475

**Concurrents**
- Visa/BioCatch : https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.22626.html · Visa/Featurespace : https://www.businesswire.com/news/home/20241218857122/en/Visa-Completes-Acquisition-of-Featurespace · Visa A2A Protect : https://www.mynewsdesk.com/uk/visa/pressreleases/visa-launches-enhanced-a2a-protect-innovations-to-help-financial-institutions-stop-fraud-before-money-leaves-accounts-3464262
- Mastercard A2A Protect (UK) : https://fstech.co.uk/fst/Mastercard_Launches_A2A_Protect_To_Boost_Safety_In_UK_Account_To_Account_Payments.php
- Feedzai : https://www.feedzai.com/inthenews/feedzai-raises-75m-at-2b-valuation-secures-key-role-in-digital-euro-fraud-prevention/ · Revelock : https://thepaypers.com/payments/news/buguroo-changes-name-to-revelock-launches-the-revelock-fraud-detection-and-response-platform
- Sardine : https://www.fintechfutures.com/venture-capital-funding/fraud-prevention-platform-sardine-secures-70m-series-c-invests-in-agentic-ai · SEON : https://startupintros.com/news/2025-09-01-seon-series-c · Forter : https://glenbrook.com/?p=32200 · Arkose : https://finovate.com/online-fraud-prevention-specialist-arkose-labs-secures-70-million/ · DataVisor : https://www.businesswire.com/news/home/20221214005330/en · ThreatMark : https://en.ain.ua/2025/01/07/czech-company-threatmark-raises-23m-in-a-fresh-investment · Cleafy : https://fintech.global/2026/03/13/cleafy-raises-e12m-to-fight-banking-fraud-in-europe/ · Hawk : https://fintech.global/2025/04/08/hawks-ai-solutions-attract-56m-for-global-aml-efforts/ · Marble : https://thenextweb.com/news/marble-raises-6-5m-series-a-smartfin-aml · Lynx : https://thefintechtimes.com/em-conversa-fighting-ai-fraud-with-ai-with-lynx-tech/ · Alloy : https://techcrunch.com/2021/09/30/alloy-raises-100m-at-a-1-35b-valuation-to-help-banks-and-fintechs-fight-fraud-with-its-api-based-platform/ · Persona/Onfido : https://www.cbinsights.com/company/persona-1/financials · https://www.cbinsights.com/company/onfido/financials · Veriff : https://sacra.com/c/veriff/ · Group-IB : https://www.group-ib.com/media-center/press-releases/gib-secure-bank/
- Pindrop : https://www.pindrop.com/press-release/pindrop-secures-one-hundred-million/ · Reality Defender : https://dcvc.com/press-releases/reality-defender-expands-series-a-to-33-million-to-enhance-ai-detection-capabilities · Resemble : https://siliconangle.com/2025/12/08/resemble-ai-hauls-13m-different-approach-deepfake-detection/ · GetReal : https://www.securityweek.com/getreal-security-raises-17-5-million-to-tackle-gen-ai-threats/ · Adaptive Security : https://www.securityweek.com/serial-entrepreneurs-raise-43m-to-counter-ai-deepfakes-social-engineering/ · Hiya : https://blog.hiya.com/hiya-and-vodafone-bring-branded-calling-to-nearly-100-of-uk · https://www.telefonica.de/news/press-releases-telefonica-germany/2026/02/o2-telefonica-launches-hiyas-branded-call-solution-verified-calls-protect-millions-of-customers-from-spam.html
- Trustpair : https://www.cbinsights.com/company/trustpair/financials · Trustmi : https://fintech.global/2023/07/27/cybersecurity-firm-trustmi-bolsters-payment-security-with-17m-funding/ · Nsknox : https://venturebeat.com/ai/m12-backed-nsknox-raises-15-million-for-real-time-payment-fraud-detection · Tipalti : https://thepaypers.com/payments/news/tipalti-raises-usd-270-mln · Eftsure/Sis ID : https://finyear.com/eftsure-rachete-sis-id-et-donne-naissance-a-un-acteur-international-de-la-securisation-des-paiements-inter-entreprises
- Banques : https://uktech.news/fintech/starling-bank-launches-romance-scam-detection-feature-20260624 · https://www.finextra.com/newsarticle/45780/metro-bank-launches-ai-scam-detection-tool · https://thefintechtimes.com/revolut-card-fraud-dropped-by-30-since-scam-detection-feature-launch

**Réglementation et cadres**
- PSR UE : https://www.soprasteria.com/insights/details/payment-services-regulation-psr-in-2026--the-state-of-play-for-banks · https://www.pwc.com/cz/cs/blog/rizeni-rizik/psd-3-the-psr-payments-reform.html · AI Act Omnibus : https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines/
- TMNL : https://riskandcompliance.freshfields.com/post/102h551/dutch-banks-combine-forces-to-combat-money-laundering-and-terrorist-financing
- NIST CSF 2.0 : https://csf.tools/reference/nist-cybersecurity-framework/v2-0/de/de-ae/ · ATT&CK : https://attack.mitre.org/techniques/enterprise/ · https://attack.mitre.org/techniques/mobile/ · D3FEND : https://d3fend.mitre.org/api/technique/all.json · ATLAS : https://github.com/mitre-atlas/atlas-data · OWASP Agentic : https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/ · https://cycode.com/blog/owasp-top-10-agentic-applications/
- WebAuthn/SPC : https://lists.w3.org/Archives/Public/w3c-news/2023AprJun/0002.html · https://www.corbado.com/blog/dynamic-linking-passkeys-spc
- Avalanche eERC : https://docs.avax.network/integrations/encrypted-erc · https://docs.avax.network/academy/blockchain/encrypted-erc/04-usability-eerc/02-use-cases

**Hackathons et données**
- Trustee/ESSEC 2025 : https://www.tse-fr.eu/anais-boughanem-d3s-masters-student-wins-first-prize-ai-hackathon · PSBS 2026 : https://www.psuconnect.in/bank-news/indian-bank-vit-chennai-conclude-psbs-hackathon-series-2026-on-fraud-prevention · FCA TechSprint : https://www.fca.org.uk/techsprints/authorised-push-payment-fraud
- BAF : https://github.com/feedzai/bank-account-fraud · AMLworld : https://arxiv.org/pdf/2306.16424 · TTS (licences) : https://aivideosensei.com/compare/kokoro-vs-chatterbox-vs-xtts

**À vérifier avant toute slide (récapitulatif)** : rapport ic3.gov 2025 (PDF illisible par l'outil) ; chiffres Clubic/Allianz sur le faux fournisseur ; nombre de virements Arup ; répartition 53/59 M€ récupérés à Fideuram ; numérotation finale PSR ; adoption de l'Omnibus AI Act ; sous-IDs ATLAS/D3FEND et numéros fins NIST (RS, PR) ; licences BAF, Chatterbox et AMLworld ; décision française sur la responsabilité d'un opérateur ; statut de Bleckwen, ID R&D et Medius/Paymerang ; existence d'un déploiement EAS sur Avalanche.

# T1 · Piste 2 — SOC anti-fraude à l'ère de l'IA générative

> Recherche du 2026-10-10 pour Secure Horizons (Track 1). Ce document part du principe que `00_DOSSIER_FRONTIERE.md` et `F6_couche_humaine.md` sont lus : il ne répète pas leur contenu (pause Google de 30 s, CoP, Ferrari, échec des avertissements génériques) et va plus loin sur ce qu'il faut **construire**.
> Légende : [V] source primaire lue ou citée par la source primaire · [S] presse ou analyse secondaire · [Vendeur] chiffre d'un éditeur intéressé · [Inf] inférence de l'auteur, à défendre comme telle.

---

## TL;DR (à lire en 60 s)

1. **Le problème a changé de nature.** Dans l'EEE, la manipulation du payeur représente **plus de la moitié de la valeur** des virements frauduleux, et **85 %** des pertes sur virements restent à la charge des clients. L'authentification forte (SCA) fonctionne contre la fraude qu'elle visait, pas contre celle-ci (EBA-ECB, déc. 2025) [V]. En France, la fraude par manipulation atteint **516 M€ en 2025 (+34 %)**, soit 41,6 % de la fraude totale, dont **376 M€ au faux conseiller** (OSMP 2025) [V/S].
2. **Le marché est en train de se consolider chez Visa** (Featurespace racheté en déc. 2024, BioCatch pour 2,4 Md$ annoncé en août 2026) [V]. Les solutions sont des boîtes noires vendues aux grandes banques. Les néobanques, les banques moyennes et les PSP européens n'ont **ni l'équivalent du Consumer Fraud Risk de Mastercard (score du compte bénéficiaire, Royaume-Uni) ni celui d'EDEx de Pay.UK**.
3. **Trois faits techniques changent la conception.**
   - La détection de voix synthétique ne généralise pas après compression par un codec, ce qui est exactement le cas du téléphone (ASVspoof 5) [V].
   - Les attaques par caméra virtuelle explosent (+2 665 % selon iProov) [Vendeur].
   - Inférer le « stress » d'un client à partir de ses frappes peut tomber sous la reconnaissance des émotions, classée **haut risque par l'AI Act** (annexe III, 1(c)) [Inf].
   → Il faut **prouver le vrai** (preuve de présence, attestation de capture, signature d'intention) au lieu de détecter le faux, et inférer le **contexte de la session**, pas l'émotion.
4. **La réglementation crée l'infrastructure qui manque.** Depuis le 9 oct. 2025, la vérification du bénéficiaire (VoP) impose un aller-retour entre la banque du payeur et celle du bénéficiaire avant **chaque** virement SEPA [V]. Le PSR (accord politique du 27 nov. 2025) prévoit une surveillance des deux côtés, l'obligation pour le PSP du bénéficiaire de geler les fonds suspects, un partage de données de fraude et le remboursement de la fraude à l'usurpation de la banque [S].
5. **Recommandation : l'idée A « DOUBLE REGARD » (83/100).** On fusionne en temps réel le **contexte de session du payeur**, que seule sa banque voit, et le **profil du compte bénéficiaire** (mule ?), que seule la banque destinataire voit. Les deux scores sont échangés sous forme de bandes de risque sans donnée personnelle, sur le canal VoP. La réponse est graduée et le client légitime ne voit rien dans plus de 99,5 % des cas. Le scénario de démo est le **faux conseiller**, première fraude par manipulation en France.

---

## 1. État de l'art 2025-2026

### 1.1 Ampleur mesurée (chiffres utilisables sur une slide)

| Indicateur | Valeur | Source |
|---|---|---|
| Fraude aux paiements, EEE, 2024 | 4,2 Md€ (3,5 en 2023) ; virements 2,2 Md€ de pertes (+16 %) | EBA-ECB, rapport conjoint, déc. 2025 [V] https://www.eba.europa.eu/publications-and-media/press-releases/joint-eba-ecb-report-payment-fraud-strong-authentication-remains-effective-fraudsters-are-adapting |
| Part de la manipulation du payeur dans la valeur des virements frauduleux | > 50 %, en forte hausse entre 2023 et 2024 ; **85 % des pertes sur virements supportées par les clients** | idem [V], PDF : https://www.ecb.europa.eu/press/intro/publications/pdf/ecb.ebaecb202512.en.pdf |
| France 2025 : fraude totale / manipulation / faux conseiller | 1,24 Md€ / **516 M€ (+34 %, 41,6 %)** / **376 M€** ; fraude au virement 484,7 M€ (+36,7 %), dont 98 M€ de hausse sur le virement instantané | OSMP, rapport 2025 (sept. 2026) https://www.banque-france.fr/system/files/2026-09/Rapport_2025_de_l_OSMP.pdf [V via presse : https://www.lafinancepourtous.com/2026/09/14/moyens-de-paiement-les-fraudes-par-manipulation-en-forte-hausse/] |
| Royaume-Uni 2025 | APP 576,4 M£ (+19 %), non autorisée 703,4 M£ (−5 %) | UK Finance, Annual Fraud Report 2026 https://www.ukfinance.org.uk/system/files/2026-06/UK%20Finance%20Fraud%20Report%202026.pdf [V] |
| Effet du remboursement obligatoire au Royaume-Uni (PSR) | Pertes APP **−21 % (≈ −73 M£/an)** à date de survenance ; 88 % des montants remboursés (oct. 2024-sept. 2025) ; 85 % des dossiers traités en 5 jours | Frontier Economics pour le PSR, juil. 2026 ; tableau de bord PSR [S] https://www.regulationtomorrow.com/2026/07/payment-fraud-falls-by-73m-following-psr-reimbursement-scheme/ · https://bratby.law/app-fraud-reimbursement-evaluation/ |
| Usurpation de numéro, France | Signalements « J'alerte l'Arcep » : 531 (2023) → 8 500 (2024) → **> 19 000 (2025)**, malgré le MAN obligatoire depuis le 1er oct. 2024 (contourné sur les mobiles) | Arcep via presse [S] https://siecledigital.fr/2026/02/16/appels-frauduleux-larcep-alerte-sur-une-explosion-des-signalements/ |
| Arnaques mondiales | Tentatives +35 % sur 12 mois, **90 % sur mobile** (plus de 370 institutions) | BioCatch, Global Scams 2026 [Vendeur] https://www.biocatch.com/press-release/global-banking-scams-increase-by-35 |
| Fraude d'identité | Les tentatives « sophistiquées » (deepfake, identité synthétique, appareil trafiqué) passent de 10 % à **28 %** des cas (+180 %) alors que le taux global baisse (2,6 → 2,2 %) | Sumsub, Identity Fraud Report 2025-26 [Vendeur] https://www.infosecurity-magazine.com/news/ai-deepfake-fraud-skyrockets/ |
| Injection au KYC | Caméras virtuelles **+2 665 %**, face swap +300 % ; 127 outils de face swap, 91 caméras virtuelles, environ 24 000 vendeurs d'outils | iProov Threat Intelligence Report 2025 [Vendeur] https://www.iproov.com/press/annual-identity-verification-threat-intelligence-report |
| Centres d'appels | Deepfakes vocaux : de 1 par mois à 7 par jour par client (2024) ; +149 % dans les banques | Pindrop VISR 2025 (1,2 Md d'appels) [Vendeur] https://www.pindrop.com/wp-content/uploads/2025/07/Voice-Intelligence-and-Security-Report-Report-June-2025.pdf |
| Voix clonée d'un ministre (Italie, févr. 2025) | Voix de Crosetto clonée, environ 1 M€ viré par un entrepreneur (Moratti), fonds gelés selon la police | Al Jazeera, oct. 2025 [S] https://www.aljazeera.com/news/2025/10/6/ai-now-sounds-more-like-us-should-we-be-concerned |

À ne pas citer : les « +1 300 % / +680 % » de Pindrop (deux mesures incompatibles dans le même rapport) et les « +3 000 % » génériques.

### 1.2 Les leaders : ce qu'ils font vraiment, et leurs limites

| Acteur | Ce qu'il fait réellement | Limites (pour notre angle) |
|---|---|---|
| **BioCatch** (Visa, 2,4 Md$, closing prévu au T2 de l'exercice fiscal 2027) | Biométrie comportementale en session. **Scams360** (juil. 2025) : appel actif pendant la session, « temps mort », signes de partage d'écran ou d'outil d'accès à distance, durée anormale de saisie d'un paiement, façon d'ajouter un bénéficiaire. Le modèle RAT distingue le partage d'écran passif de la prise de contrôle (navigation guidée, copier-coller, changement de résolution). Plus de 350 institutions, 19 Md de sessions par mois [Vendeur] https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.22626.html · https://www.biocatch.com/use-case/customer-protection/remote-access-attacks | Ne voit **que le côté payeur**. Les chiffres publiés sont des cas clients (81 % de détection et 0,05 % de faux positifs, sur de l'ATO, pas de l'arnaque). Faux positifs probables chez les utilisateurs lents ou sous outils d'accessibilité. Boîte noire. Bientôt captif de Visa. |
| **Featurespace** (Visa depuis déc. 2024) | ARIC : analyse comportementale adaptative par client, scores transactionnels en temps réel [V] https://www.crowdfundinsider.com/?p=234490 | Très centré sur la transaction ; peu de contexte de session ou d'appel. |
| **Feedzai** | RiskOps. **ScamPrevent** (2023) : modèles anti-arnaque, biométrie, signaux non transactionnels avant le paiement. Auteur du jeu **BAF** (NeurIPS 2022). Un agent GenAI « ScamAlert » est cité en 2026 sans annonce trouvée [S] https://finovate.com/feedzai-leverages-ai-to-launch-new-tool-that-stops-scams/ | Peu de chose publique sur l'explicabilité de la décision face au régulateur. |
| **Sardine** | Appareil, comportement, paiements. Alertes « caméra usurpée / émulateur / proxy résidentiel » à l'inscription. Laboratoire de recherche IA (oct. 2026) [S] https://research.contrary.com/company/sardine | Orienté fintech US et onboarding. |
| **Sift / SEON** | Empreinte d'appareil, enrichissement par l'empreinte numérique (e-mail, téléphone, réseaux sociaux), règles et ML. Forts en e-commerce et onboarding [Inf, documentation publique] | Faibles sur l'APP : le payeur est le vrai client sur son vrai appareil. |
| **LexisNexis ThreatMetrix** | Digital Identity Network : graphe d'appareils et d'identités partagé entre organisations [Inf, documentation publique] | Excellent pour l'ATO et les appareils connus ; aveugle à la coercition d'un client légitime. |
| **Mastercard Consumer Fraud Risk** | **Score du compte bénéficiaire** en temps réel, à partir des flux de paiements de plusieurs banques, envoyé à la banque du payeur, puis aussi à la banque destinataire. 11 banques britanniques en 2024 [V] https://www.mastercard.com/gb/en/news-and-trends/press/2024/september/mastercard-expands-first-of-its-kind-ai-technology-to-help-banks-protect-more-consumers-from-scams-in-real-time.html | **Royaume-Uni seulement**, aucun déploiement UE trouvé. Ne voit pas la session du payeur. |
| **Pay.UK EFD → EDEx** | Standard de données de fraude échangées entre PSP **avant** le paiement (API pair-à-pair, deux PoC UK Finance), défini en 2025-26 [V] https://www.wearepay.uk/enhanced-data-exchange-edex/ | Royaume-Uni, encore en conception. Aucun équivalent sur le rail VoP européen. |
| **Pindrop** | Voix dans le **centre d'appels de la banque** : authentification vocale, détection de voix synthétique (Pulse), score de risque d'appel [Vendeur] | Protège l'appel entrant vers la banque, **pas** l'appel du fraudeur vers la victime. Soumis à la limite des codecs (§1.3). |
| **Reality Defender** | API voix temps réel pour centres d'appels ; **RealMeeting** (plugin Teams) qui renvoie Trust / Suspicious / Manipulated [Vendeur] https://www.realitydefender.com/product/realmeeting | Pas de benchmark indépendant (le « 96,5 % » circule sans méthode). Une analyse 2026 juge la vérification par processus (rappel, question hors contexte) plus fiable que tout outil temps réel [S]. |
| **iProov / Onfido (Entrust) / Sumsub** | Liveness, détection d'injection. iProov : Flashmark (illumination d'écran aléatoire) et un SOC de veille (iSOC). Sumsub : orchestration KYC et KYB [Vendeur] | Course aux armements avec les caméras virtuelles. Chaque éditeur ne voit que ses propres clients : aucun graphe de réutilisation de visages entre établissements. |
| **Socure** | Graphe d'identité, détection d'identité synthétique, onboarding US [S] | Centré sur les États-Unis et sur l'ouverture de compte. |
| **Google** | Protection anti-arnaque pendant les appels : appli financière + partage d'écran + appelant hors contacts → pause de 30 s. Royaume-Uni, Brésil, Inde, puis appli fintech US (Cash App, JPMorgan) ; Android 11+ [S] https://cyberinsider.com/android-expands-in-call-scam-protections-to-us-fintech-and-banking-apps/ | Android seulement, banques partenaires, aucune donnée d'efficacité indépendante. |
| **Banques** | Monzo : « call status » (la banque vous appelle-t-elle vraiment ?). Revolut : « we are not talking to you » + IA anti-arnaque sur carte (−30 % de pertes sur les arnaques à l'investissement, auto-déclaré). Nationwide : call checker [S] https://www.which.co.uk/news/article/new-nationwide-call-checker-tool-how-is-your-bank-fighting-fraud-aMLGG7M1ASS7 · https://tech.eu/2024/02/15/revolut-launches-ai-scam-features-to-break-scammers-spell/ | Signaux isolés : le « call status » n'est pas fusionné avec le score du bénéficiaire ni avec le contexte de session. |
| **Singapour** | Kill switch client (2022), **Money Lock** (2023 : une partie des fonds ne peut pas sortir numériquement), SRF (déc. 2024). Le SRF **exclut** l'APP, alors que 78,8 % des pertes du S1 2025 sont des virements faits par la victime [S] https://www.aoshearman.com/en/insights/ao-shearman-on-fintech-and-digital-assets/combatting-payment-account-fraud-singapores-shared-responsibility-framework · https://mustsharenews.com/total-scam-cases-2025/ | Fort sur les outils de « gel par le client », faible sur la détection. |

**Lecture d'ensemble.** Chaque acteur voit **une moitié** du crime : la session du payeur (BioCatch), le compte destinataire (Mastercard CFR), l'appel (Pindrop, Google) ou l'onboarding (iProov, Sumsub). La fraude par manipulation se joue précisément **à la jonction** entre une victime coachée et un compte mule. En UE, cette jonction n'a pas d'outil, alors que le PSR l'exige désormais.

### 1.3 Recherche récente : ce qui marche, ce qui casse

**Voix synthétique.**
- ASVspoof 5 (53 équipes, IEEE TASLP avril 2026) : de bonnes performances en conditions de test, mais une **dégradation sous attaques adverses et sous compression neuronale ou codec**. Les solutions « peinent systématiquement à généraliser » [V] https://arxiv.org/html/2601.03944v1
- arXiv 2507.01750 : l'erreur venait surtout de la **vraie voix compressée** (faux positifs). Avec des augmentations (bruit, réponses impulsionnelles de salle, RawBoost), l'EER tombe à 3,57 % sur ASVspoof 5, et à 2,61 % d'EER moyen en transfert multi-corpus [V] https://arxiv.org/html/2507.01750v1
- ML-ITW (2026) : 14 langues, 180 personnalités, forte dégradation selon la langue et les conditions acoustiques [V] https://arxiv.org/html/2603.05852v1

→ **Conséquence de conception** : sur un canal téléphonique, un détecteur de deepfake est un **signal faible**. Il ne doit jamais décider seul ; il sert de preuve d'appoint dans le dossier.

**Détection d'arnaque en conversation.**
- « It Warned Me Just at the Right Moment » (CHI 2025 LBW) : détection temps réel par LLM sur des transcriptions [V] https://arxiv.org/html/2502.03964v1
- TeleAntiFraud-28k : 28 511 paires audio-texte annotées avec raisonnement [S]
- RAG + LLM : 97,98 % de précision, mais sur du synthétique [S] https://alphaxiv.org/overview/2501.15290v1
- AI-in-the-Loop (PoPETs 2026) : détection et perturbation des conversations, avec préservation de la vie privée [S] https://www.petsymposium.org/popets/2026/popets-2026-0006.pdf
- Étude turque 2026 : la **transcription bat l'audio brut** [S]

→ Une banque n'a pas accès à l'appel du fraudeur. Ces travaux ne s'appliquent qu'**on-device** (le modèle de Google) ou dans **les canaux de la banque** (chat, centre d'appels).

**Biométrie comportementale et coercition.**
- Jeux publics : HMOG (100 utilisateurs, capteurs + frappe), **BB-MAS** (117 personnes, 3,5 M de frappes, IEEE DataPort, DOI 10.21227/rpaz-0h66), Mobile-Stress (20 personnes, neutre vs stress, sur demande) [V] https://arxiv.org/pdf/1912.02736
- **Aucun jeu public n'est étiqueté « sous contrainte » ou « coaché ».** Les seules étiquettes de coercition existent chez les éditeurs.
- L'abstract Nationwide / Credit Research Centre d'Édimbourg (nov. 2025) décrit un ensemble ML contre l'APP qui remplace les règles [S] https://crc.business-school.ed.ac.uk/sites/crc/files/2025-11/Machine-learning-modelling-for-enhanced-APP-scam-prevention-abstract.pdf

**Injection et faux documents.**
- ATLAS documente deux cas : **AML.CS0033** (face swap en direct injecté pour passer un KYC mobile) et **AML.CS0034** (ProKYC : faux document et selfie deepfake au même visage) [S] https://d3fend.mitre.org/offensive-technique/attack/AML.T0088/
- arXiv 2601.00829 se demande si les modèles génératifs savent vraiment forger des documents d'identité réalistes [V]

**Données synthétiques.**
- arXiv 2604.13125 : CTGAN, TVAE, GaussianCopula et TabularARGN **détruisent les signaux comportementaux** (vélocité, temporalité, multi-comptes), avec une dégradation de 24× à 99,7× [V] https://arxiv.org/pdf/2604.13125
- → Pour la démo, il faut un **simulateur à base d'agents par scénario** (comme celui de la FCA), pas un GAN tabulaire. Cet argument de méthode est défendable devant le jury.

### 1.4 Réglementation (ce qui crée l'obligation, donc le client)

- **Règlement Virement instantané (UE 2024/886)** : VoP obligatoire depuis le **9 oct. 2025** (correspondance IBAN/nom ; réponses match / close match / no match / impossible) ; exécution en 10 s ; règlement VOP de l'EPC en vigueur au 5 oct. 2025 [V] https://legal.pwc.de/en/news/articles/verification-of-payee-requirements-vop-under-the-eus-instant-payments-regulation-ipr. **Aucun bilan post-lancement trouvé** : c'est un vide à signaler.
- **PSR / PSD3** (accord politique du 27 nov. 2025 ; numérotation de la proposition, à vérifier dans le texte final) [S] https://www.williamfry.com/knowledge/psr-psd3-eu-payment-services-legislation-is-agreed/ · https://iapp.org/news/a/new-eu-payment-rules-could-expand-fraud-monitoring
  - **Art. 50** : vérification IBAN/nom étendue à tous les virements.
  - **Art. 59** : remboursement intégral si le fraudeur **usurpe le PSP** du payeur (plainte et signalement requis ; délai de 15 jours ouvrés évoqué).
  - **Art. 83** : surveillance des transactions comme **obligation autonome**, côté payeur **avant** exécution et côté bénéficiaire **avant mise à disposition** ; responsabilité en cas d'échec (« failure to block »).
  - **Art. 83(3)/83a** : **partage de données de fraude** entre PSP (un identifiant partageable après au moins deux signalements confirmés, selon une lecture de la proposition).
  - Le PSP du bénéficiaire **gèle** les opérations suspectes. Les plateformes en ligne deviennent responsables envers les PSP si elles ne retirent pas un contenu frauduleux signalé.
- **AI Act** :
  - Annexe III 5(b) : l'exception « détection de fraude financière » sort le scoring antifraude du haut risque, **à interpréter strictement** (la finalité principale doit être la fraude ; elle ne couvre pas la LCB-FT) [S] https://www.mccannfitzgerald.com/knowledge/technology-and-innovation/essential-services-spotlight-eu-ai-act-draft-guidelines-on-high-risk-ai-classification
  - **Annexe III 1(c)** : la reconnaissance d'émotions (inférer des émotions ou intentions à partir de données biométriques, comportementales comprises) est **haut risque** [V] https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3. Un module qui dit « ce client est stressé » s'expose à ce classement [Inf] ; un module qui dit « un appel est actif et l'IBAN a été collé » ne s'y expose pas.
  - **Art. 50** : transparence sur les deepfakes et la reconnaissance d'émotions.
  - La vérification biométrique 1:1 (KYC) est exclue de l'identification à distance (annexe III 1(a)).
- **DORA** : art. 17-19 (gestion, classification et notification des incidents liés aux TIC ; une vague d'ATO peut devenir un incident majeur selon le nombre de clients touchés et l'impact économique) ; art. 28-30 (fournisseur TIC tiers, si la solution est en SaaS).
- **RGPD** : art. 6(1)(f) et considérant 47 (prévention de la fraude) ; **art. 22** (une mise en attente ou un gel automatique produit un effet significatif, donc il faut un recours humain) ; art. 9 (biométrie au KYC).
- **LCB-FT** : le gel côté bénéficiaire déclenche l'analyse de soupçon et, le cas échéant, une déclaration à **Tracfin** (CMF L.561-15).

### 1.5 Données disponibles (pour 24 h)

| Jeu | Contenu | Usage pour nous | Accès |
|---|---|---|---|
| **BAF — Bank Account Fraud (NeurIPS 2022)** | 6 variantes d'environ 1 M de demandes d'ouverture de compte, synthétiques mais générées à partir de données réelles ; environ 1 % de fraude ; variables d'appareil et de session (`device_os`, `session_length_in_minutes`, `keep_alive_session`, `foreign_request`, `device_distinct_emails_8w`, `email_is_free`, `source`…) ; biais contrôlés pour tester l'équité [V, colonnes d'après le datasheet, à revérifier] | **Score « compte mule à l'ouverture »** côté bénéficiaire ; audit d'équité (art. 10 AI Act, bonne pratique) | https://github.com/feedzai/bank-account-fraud · Kaggle `sgpjesus/bank-account-fraud-dataset-neurips-2022` |
| **PaySim** | Mobile money simulé (6,3 M de lignes) | Graphe de flux et pass-through des mules. **Attention aux fuites** : colonnes de solde inutilisables, `isFlaggedFraud` incohérent [V] | Kaggle `ealaxi/paysim1` |
| **IEEE-CIS** | 590 540 transactions carte e-commerce réelles anonymisées (identité et appareil) | Hors sujet APP ; seulement pour la baseline ATO carte | Kaggle |
| **FCA APP synthetic data** | 37 jeux, environ 15 M de transactions, environ 61 000 fraudes, **7 typologies dont l'usurpation de banque**, **métadonnées d'appels et SMS** de 2 opérateurs, 4 banques, 20 000 individus sur 2 ans [V] | Idéal (appels + virements) | **Candidature au FCA Digital Sandbox, pas de téléchargement libre** : irréaliste en 24 h → on s'inspire de son schéma pour notre générateur https://www.fca.org.uk/firms/digital-sandbox/authorised-push-payment-synthetic-data |
| **RBA login dataset (Wiefling et al., 2022)** | Plus de 33 M de connexions, 3,3 M d'utilisateurs (IP, ASN, UA, RTT, pays), avec des attaques étiquetées [V] | Fond légitime pour l'ATO (idée B) | Zenodo 10.5281/zenodo.6782156 https://zenodo.org/record/6782156 |
| **ASVspoof 5** | Parole bona fide et usurpée, crowdsourcée, codecs inclus | Calibrer le signal « voix synthétique » (idée C) | Zenodo (lien dans https://arxiv.org/html/2601.03944v1) |
| **MLAAD v11 / In-the-Wild / ML-ITW** | Plus de 1 150 h, 205 TTS, plus de 50 langues (MLAAD) ; voix réelles de personnalités (ITW) | Généralisation multilingue (français inclus) | Hugging Face https://arxiv.org/html/2401.09512v9 |
| **SIDTD / IDNet / MIDV-2020** | Documents d'identité synthétiques ; falsifications crop & replace et inpainting (SIDTD, CC BY-SA) ; 837 k images avec morphing et substitution de portrait (IDNet) [V] | Faux KYC (idée D) | https://arxiv.org/pdf/2401.01858 |
| **BB-MAS / HMOG** | Frappes, swipes et capteurs | Baseline comportementale d'un utilisateur (pas d'étiquette de coercition) | IEEE DataPort |
| **TeleAntiFraud-28k** | Appels d'arnaque audio et texte (chinois) | Seulement si un module de transcription est démontré | arXiv 2503.24115 |

**Générateur à écrire (2 h, indispensable)** : simulateur à base d'agents, inspiré du schéma FCA.
- **Population** : environ 5 000 clients sur 60 jours.
- **Sessions légitimes** :
  - avec **confondants délibérés** : en appel avec un proche pendant un virement, nouveau bailleur, utilisateur d'outil d'accessibilité (frappe lente), vrai support informatique avec AnyDesk, IBAN collé depuis un e-mail de facture ;
  - les confondants sont là pour mesurer honnêtement les faux positifs.
- **Sessions d'arnaque** (faux conseiller, investissement, fausse facture) :
  - appel actif, accès distant ou partage d'écran, plafond relevé, collage de l'IBAN, trajet direct vers « ajouter un bénéficiaire » ;
  - vidage du compte (ratio montant / solde) vers un **compte mule** dont le profil est tiré des fraudes de BAF.

---

## 2. Gaps non résolus et pain points mesurés

1. **L'authentification forte est hors sujet.** Elle authentifie la bonne personne, qui envoie l'argent au mauvais endroit (EBA-ECB). La défense doit porter sur le **contexte** et le **destinataire**, pas sur l'identité.
2. **Les deux moitiés du crime ne se parlent pas en UE.** Le payeur voit la coercition, le bénéficiaire voit la mule. Le Royaume-Uni a CFR et EDEx ; l'UE a un rail VoP tout neuf qui ne transporte qu'un résultat de nom. Or le PSR (art. 83) **impose la surveillance des deux côtés** et met la responsabilité sur celui qui « n'a pas bloqué ».
3. **L'humain coaché ment à sa banque.** Le fraudeur dicte les réponses (« dites que c'est pour des travaux »). Les questionnaires dynamiques ne valent que s'ils portent sur des **faits vérifiables par la banque** (est-ce que nous vous appelons ? depuis quand existe ce compte ?), pas sur la déclaration du client [Inf, cohérent avec F6 et CoP].
4. **Le budget de latence est de 10 s.** Le virement instantané interdit l'enquête humaine avant exécution : la décision doit être automatique, explicable et réversible (conversion en virement standard, gel côté bénéficiaire).
5. **La détection de deepfake ne tient pas au téléphone** (codecs, ASVspoof 5). Les éditeurs vendent des pourcentages sans protocole public. Le « prouver le vrai » (signature d'intention, attestation de capture) n'est pas outillé pour les PME et ETI.
6. **Le KYC est en course aux armements** (caméras virtuelles), et la réutilisation d'un même visage synthétique pour plusieurs identités n'est visible que si l'on regroupe les demandes, ce qu'aucun éditeur ne fait entre clients.
7. **Faux positifs et biais.** Les signaux comportementaux pénalisent les utilisateurs lents, âgés ou sous outils d'accessibilité ; aucun éditeur ne publie de taux par sous-population. BAF permet justement de le mesurer.
8. **Risque AI Act sous-estimé.** La « détection de stress » est de la reconnaissance d'émotions (haut risque, annexe III 1(c)). Le marketing « nous détectons la détresse cognitive » est un passif réglementaire [Inf].
9. **Données.** Pas de jeu public sur la coercition ; le jeu FCA est fermé ; les GAN tabulaires détruisent les signaux. Celui qui publie un **simulateur de scénarios honnête, avec confondants**, a un argument de méthode.
10. **Usurpation téléphonique non résolue** (Arcep : plus de 19 000 signalements en 2025, mobiles non couverts) : le numéro affiché ne prouve rien. La banque, elle, **sait si elle appelle**.

---

## 3. Quatre idées différenciantes

Barème : note = 0,30·Détection + 0,20·Réponse + 0,20·Faisabilité + 0,15·Conformité + 0,15·Pitch (chaque sous-note sur 100).

---

### Idée A — **DOUBLE REGARD** : la coercition du payeur × la mule du bénéficiaire, échangées sur le rail VoP

**Problème en une phrase.** Pendant un faux appel de conseiller, un client authentifié vide son compte vers une mule ouverte six jours plus tôt. La banque du client voit la coercition sans voir la mule, la banque de la mule voit la mule sans voir la coercition, et chacune laisse passer.
**Défenseur nommé.** L'**analyste fraude d'une néobanque ou banque en ligne française**. Il reçoit aujourd'hui des milliers d'alertes « montant atypique » et rate les vrais faux conseillers. Second défenseur : le responsable LCB-FT de la banque destinataire, désormais tenu de geler les fonds (PSR).

**Mécanisme (ce qui est neuf).**
1. **Score de contexte de session côté payeur** (et non score d'émotion, cf. AI Act 1(c)). Les variables sont des **faits de session** :
   - appel téléphonique actif (Android `TelephonyManager`, iOS `CXCallObserver`) et ce qu'on sait de l'appelant (hors contacts : Android uniquement) ;
   - partage d'écran ou service d'accessibilité actif, outil d'accès distant installé ;
   - mode de saisie de l'IBAN (tapé, collé, QR), plafond relevé dans la session, trajet de navigation direct vers « ajouter un bénéficiaire » ;
   - ratio montant / solde, premier virement instantané, nouveau bénéficiaire, heure.
   Chaque variable est **lisible par un auditeur**.
2. **Bande de risque du bénéficiaire, calculée par la banque destinataire et renvoyée dans la réponse VoP.**
   - Entrées : âge du compte ; **fan-in** (nombre d'émetteurs distincts sur 48 h) ; ratio de **pass-through** (sorties / entrées sur 24 h) ; score d'onboarding (modèle BAF) ; signalements confirmés (au moins 2, logique de l'art. 83(3)).
   - Sortie : **une bande de 0 à 3 et des codes motifs** (`NEW_ACCT_LT_30D`, `FANIN_SPIKE`, `PASS_THROUGH`), **aucune donnée personnelle**. Proposition : une extension du message VoP, ou de l'API EDEx au Royaume-Uni. En attendant, cela marche immédiatement **intra-groupe ou entre membres d'un même réseau** (par ex. une banque et ses filiales, ou un consortium de néobanques).
3. **Fusion avant autorisation, dans le budget de 10 s.**
   - D'abord une matrice déterministe, qui l'emporte toujours (garde-fou TCAS).
   - Ensuite un modèle GBM calibré pour les cas intermédiaires.
   - La conjonction « coercition élevée ET mule probable » est le cœur : chaque moitié seule produit beaucoup de faux positifs, leur **produit** très peu. C'est la thèse que la démo mesure par **ablation**.
4. **Une intervention qui oppose des faits vérifiables** (« contradiction ancrée ») au lieu d'un avertissement générique. Exemple : « Aucun conseiller [Banque] ne vous appelle en ce moment. Le compte destinataire a été ouvert il y a 6 jours et a reçu 14 virements de 14 personnes depuis hier. » Le client ne peut pas être coaché pour contredire un fait connu de la banque.
5. **LLM via Bedrock (Claude), jamais décideur.**
   - (a) Il rédige la **fiche de cas** de l'analyste à partir des codes motifs et la relie à la typologie (faux conseiller, investissement, fausse facture).
   - (b) Il rédige le message client en langage clair.
   - (c) **Passe sceptique** : il cherche une explication légitime à partir des preuves (bénéficiaire déjà payé par le foyer, IBAN présent dans une facture reçue). Il ne peut que **proposer** un déclassement, validé par une règle.
   - Chaque alerte porte sa preuve : les variables, leur valeur, leur source.

**Réponse graduée (playbook).**

| Niveau | Condition (exemple) | Action automatique | Humain | Annulable |
|---|---|---|---|---|
| R0 | Score faible (plus de 99 % des virements) | Rien | — | — |
| R1 | Un seul côté élevé | **Information concrète** dans l'écran (âge du compte, VoP), sans clic supplémentaire | — | — |
| R2 | Coercition élevée + bénéficiaire en bande ≥ 2 | Pause de 30 s, **contradiction ancrée**, bouton « appeler ma vraie banque » (appel sortant dans l'appli) | — | oui |
| R3 | R2 + montant ≥ 50 % du solde ou plafond relevé pendant l'appel | **Mise en attente** : le virement instantané est converti en virement standard, appel sortant de la banque, alerte au « tiers de confiance » si le client l'a choisi à l'avance | analyste sous 30 min | libération en un clic |
| R4 | R3 + bénéficiaire en bande 3 ou signalé | Message de **gel côté bénéficiaire** (PSR) ; ouverture d'un dossier LCB-FT (Tracfin) ; blocage des nouveaux bénéficiaires du payeur pendant 24 h | analyste + responsable LCB-FT | oui, journalisé |

Tout est journalisé dans un journal chaîné par hachage. Chaque décision enregistre ses entrées, la version des règles et du modèle, et l'humain qui l'a validée.

**Données.** BAF (variante Base pour l'entraînement, variantes II à V pour la robustesse et l'équité) pour le score d'onboarding du bénéficiaire. Simulateur à base d'agents avec confondants (§1.5) pour les sessions et les flux. PaySim seulement pour les motifs de graphe de mules.

**Démo de 3 minutes.**
1. (0:00) Écran de Marie, 34 ans : appel du « 01 xx » de sa banque, usurpé.
2. (0:30) Le faux conseiller lui fait ajouter un IBAN « compte sécurisé » collé depuis un SMS. Sur la console : session à 0,91, VoP renvoie *match* (le nom de la mule est cohérent) **mais** la bande bénéficiaire vaut 3 (`NEW_ACCT_6D`, `FANIN_14`).
3. (1:00) R3 s'affiche chez Marie : « Aucun conseiller ne vous appelle. » Le virement passe en attente.
4. (1:30) La console de l'analyste montre la fiche Claude avec preuves et un sceptique qui ne trouve aucune explication légitime ; l'analyste clique « confirmer » et le gel est émis côté bénéficiaire.
5. (2:15) **Contre-exemple en direct** : Paul paie son nouveau bailleur au téléphone avec sa femme. La session est élevée mais le bénéficiaire est en bande 0, donc R1 (information) ou R0 : **aucune friction**.
6. (2:40) Slide de métriques (ablation).

**Métriques à produire** (sur le jeu simulé : environ 5 000 clients, environ 300 arnaques, environ 200 confondants) :
- rappel et précision par niveau ;
- **taux d'intervention sur les virements légitimes** (cible < 0,5 % pour R2 et plus) ;
- **ablation** payeur seul / bénéficiaire seul / les deux (la courbe ROC est la slide clé) ;
- MTTD en millisecondes (cible p95 < 300 ms hors LLM, la fiche LLM étant asynchrone) ;
- euros sauvés ;
- **taux de faux positifs par sous-population** (utilisateurs « accessibilité », plus de 65 ans simulés) ;
- côté bénéficiaire, sur BAF : rappel à 5 % de faux positifs (la métrique du papier) et écart de taux entre groupes.

**Mapping.**
- NIST CSF 2.0 : DE.CM-01 et -09, **DE.AE-02, DE.AE-03 (corrélation de sources multiples)**, DE.AE-06, RS.AN-03, **RS.MI-01 (confinement : attente et gel)**, RS.CO-02 et -03, GV.SC (partage entre PSP).
- ATT&CK : **T1656 Impersonation**, **T1657 Financial Theft**, T1566.004 (Spearphishing Voice), T1219 (Remote Access Tools) ; mobile : partage d'écran et abus d'accessibilité.
- ATLAS : AML.T0052.001 (phishing assisté par deepfake) si la voix est clonée.
- D3FEND : D3-UBA (User Behavior Analysis).
- OWASP LLM01 sur la passe LLM : elle ne reçoit que des champs structurés, jamais de texte libre venant du client ou du fraudeur.

**Conformité.**
- PSR art. 83 (surveillance des deux côtés, responsabilité « failure to block »), art. 83(3)/83a (partage de données), art. 59 (usurpation de la banque : chaque faux conseiller stoppé est un remboursement évité), art. 50 et IPR (VoP).
- AI Act : exception de l'annexe III 5(b) (finalité fraude) ; **choix explicite d'éviter l'annexe III 1(c)** (aucune inférence d'émotion) ; art. 50 non concerné.
- RGPD : art. 22 (recours humain prévu dès R3), art. 6(1)(f) ; minimisation (une bande sans donnée personnelle sur le rail interbancaire).
- DORA : art. 17-19 pour classifier une vague coordonnée de faux conseillers comme incident.
- LCB-FT : gel et déclaration de soupçon.
- Slide « comment l'auditeur vérifie » : rejouer une décision depuis le journal chaîné donne le même résultat (déterminisme et version du modèle).

**Build en 24 h vs mock.**
- **Construit** :
  - générateur à base d'agents (Python) ;
  - modèle BAF (LightGBM) ;
  - moteur de fusion (FastAPI), règles en YAML versionnées, journal chaîné ;
  - fiche et passe sceptique via Bedrock ;
  - console analyste (React ou Streamlit) ;
  - application bancaire **web mobile simulée** qui émet la télémétrie de session.
- **Mocké** : le signal « appel actif » (bouton de simulation, l'API native étant décrite dans le README), le rail VoP (deux microservices « Banque A » et « Banque B » qui s'appellent en JSON au format de l'EPC enrichi).
- Hébergement AWS : Lambda/ECS + DynamoDB + Bedrock.

**Risque principal.**
- « BioCatch le fait déjà » → réponse : BioCatch ne voit qu'un côté, et le score bénéficiaire n'existe en UE chez personne. Notre apport est la **jonction** sur un rail obligatoire, et l'ablation le prouve.
- Second risque : le réalisme du simulateur → publier les confondants et la liste de ce qu'on ne détecte pas (arnaque à l'investissement lente sans appel actif, mule ancienne « dormante réactivée »).

**Note.**
- Détection 82 : jonction mesurée, ablation, faux positifs avec dénominateur. Limite : le simulateur.
- Réponse 88 : cinq niveaux proportionnés, contradiction ancrée, gel côté bénéficiaire, humain à R3.
- Faisabilité 80 : tout se code en 24 h ; intégration crédible (VoP, API du PSP, Tracfin).
- Conformité 85 : PSR, AI Act (1(c) évité), RGPD art. 22, journal rejouable.
- Pitch 82 : faux conseiller (376 M€), démo avec contre-exemple.
- Calcul : 0,30·82 + 0,20·88 + 0,20·80 + 0,15·85 + 0,15·82 = 24,6 + 17,6 + 16,0 + 12,75 + 12,3 = **83,3 → 83/100**

---

### Idée B — **HAMEÇON INVERSÉ** : des comptes-canaris qui font livrer au fraudeur son empreinte et ses IBAN de mules

**Problème en une phrase.** La prise de contrôle de compte (ATO) arrive avec de vrais identifiants volés (phishing, infostealer). Les moteurs de risque comparent chaque connexion à l'historique du client, si bien que le fraudeur ressemble à un client « un peu inhabituel » et l'analyste se noie dans les faux positifs.
**Défenseur nommé.** L'**analyste du SOC fraude** d'une banque de détail, chargé de l'ATO et du cyber-renseignement sur le phishing.

**Mécanisme (ce qui est neuf).**
1. **Canaris d'identifiants.** La banque génère des clients synthétiques plausibles (identifiants, solde crédible, IBAN canari) et les **injecte** là où les fraudeurs récoltent. En production, ce sont les kits de phishing signalés et les journaux d'infostealers revendus, via un prestataire et dans un cadre légal. **En hackathon, le kit de phishing est simulé localement.** Toute connexion avec un canari est **frauduleuse par construction** (zéro faux positif sur la graine).
2. **Environnement de leurre.** Le fraudeur connecté reçoit une session réaliste (faux solde, faux historique). On capture son empreinte complète :
   - appareil (navigateur anti-détection, émulateur) ;
   - réseau (ASN, proxy résidentiel, empreinte TLS de type JA4) ;
   - **rythme de frappe et de navigation**, outillage.
3. **Il nous livre ses mules.** Quand il tente un virement depuis le canari, il saisit l'**IBAN de sa mule**. Celui-ci part dans la liste de partage art. 83a, avec une confiance maximale, et alimente la bande bénéficiaire de l'idée A.
4. **Rétro-chasse.** On recherche l'empreinte de l'attaquant (au moins 2 composantes indépendantes, pour éviter les faux positifs de NAT) dans les **sessions des vrais clients** des N derniers jours. On trouve ainsi les comptes **déjà compromis** avant qu'ils ne soient vidés.
5. **LLM via Bedrock.** Il produit le rapport de campagne (kit → canaris touchés → empreintes → comptes réels touchés → mules), mappé ATT&CK, avec un sceptique qui conteste chaque rapprochement fondé sur une seule composante.

**Réponse graduée.**
- Canari touché : aucune action côté client ; enrichissement du renseignement.
- Compte réel qui partage 2 composantes : **step-up passkey** à la prochaine action sensible, invisible tant que le client ne fait rien de sensible.
- 3 composantes, ou ajout d'un bénéficiaire : gel des nouveaux bénéficiaires, révocation des sessions, appel sortant.
- IBAN mule confirmé : gel côté bénéficiaire si la banque est la même, partage interbancaire sinon.

**Données.**
- Fond légitime : jeu RBA de Wiefling (33 M de connexions).
- Attaquants : traces générées (navigateurs anti-détection, ASN de proxys résidentiels, frappe « copier-coller » des identifiants).
- Mules : comptes tirés des fraudes de BAF.

**Démo de 3 minutes.**
1. Un faux site de phishing (local) récolte des identifiants dont 3 canaris.
2. L'attaquant (Adem, navigateur anti-détection) se connecte sur un canari, et l'alerte arrive sans aucun faux positif.
3. Il tente un virement : l'IBAN de la mule est capturé.
4. La rétro-chasse fait apparaître 2 vrais comptes déjà connectés depuis la même empreinte.
5. Step-up et gel, puis le rapport de campagne.

**Métriques.**
- Précision de la graine = 100 % par construction (le dire honnêtement : la couverture est limitée aux campagnes touchées).
- Précision et rappel de la rétro-chasse sur le jeu RBA avec injections.
- Délai entre la récolte et la détection.
- Nombre de mules extraites par campagne.

**Mapping.**
- NIST CSF : DE.CM, DE.AE-07 (renseignement sur la menace intégré), RS.AN, RS.MI, ID.RA-02.
- ATT&CK : T1078 Valid Accounts, T1566 Phishing, T1555/T1539 (vol d'identifiants ou de cookie par infostealer), T1657.
- D3FEND : **D3-DUC Decoy User Credential**, D3-UBA.
- ATLAS : non concerné (sauf kit assisté par IA).

**Conformité.**
- PSR art. 83a (partage des IBAN mules : précision maximale, fondement de « soupçon objectivement justifié »).
- RGPD : les canaris ne sont pas des personnes ; la rétro-chasse sur clients réels repose sur l'intérêt légitime (fraude).
- **Éthique et légalité de l'injection dans de vrais kits** : à cadrer avec la police ou un prestataire ; en hackathon, tout est simulé (règle « aucune action contre un système réel »).
- DORA art. 17-19 (une campagne d'ATO est un incident lié aux TIC).

**Build en 24 h vs mock.** Construit : application bancaire leurre, injecteur de canaris, capture d'empreinte (FingerprintJS open source, collecte JS de frappe), rétro-chasse sur un échantillon de 1 à 2 M de lignes RBA (DuckDB), rapport Bedrock. Mocké : la diffusion dans les vrais kits et les infostealers.

**Risque principal.**
- Couverture partielle : seulement les campagnes dans lesquelles on a injecté des canaris. Aveugle au SIM swap, au détournement de session et surtout **à l'APP**, où il n'y a pas d'ATO alors que c'est le premier poste de pertes.
- Le jury Track 1 peut juger que ça « ne traite pas l'IA générative ».

**Note.**
- Détection 78 : précision parfaite sur la graine, mais couverture étroite.
- Réponse 75.
- Faisabilité 85.
- Conformité 78 (zone grise de l'injection réelle).
- Pitch 82 (« le fraudeur nous donne lui-même ses IBAN »).
- Calcul : 0,30·78 + 0,20·75 + 0,20·85 + 0,15·78 + 0,15·82 = 23,4 + 15,0 + 17,0 + 11,7 + 12,3 = **79,4 → 79/100**

---

### Idée C — **MANDAT SIGNÉ** : contre la fraude au président par voix clonée, on ne détecte pas le faux, on fait signer le vrai

**Problème en une phrase.** Un trésorier reçoit par téléphone ou en visio la voix, voire le visage, de son PDG qui exige un virement urgent et confidentiel. Les détecteurs de deepfake ne tiennent pas sur un canal compressé, et la seule défense qui ait marché (Ferrari) est une vérification hors bande que personne n'automatise.
**Défenseur nommé.** Le **trésorier ou DAF d'une ETI** (et le conseiller entreprises de sa banque, qui vend le service).

**Mécanisme (ce qui est neuf).**
1. **Extraction du mandat.** Toute demande de paiement hors workflow (e-mail, Teams, note vocale, transcription d'appel) passe par un **extracteur LLM isolé** (Claude via Bedrock). Il sort un JSON strict : bénéficiaire, IBAN, montant, échéance, demandeur revendiqué, marqueurs d'urgence et de secret. Le juge qui décide ne voit que ce JSON, jamais le texte brut (principe CaMeL / juge isolé, cf. dossier).
2. **Déclencheurs sans friction.** Seulement si **canal hors workflow ET** (nouvel IBAN, ou IBAN modifié, ou montant > seuil, ou VoP *no match / close match*). Un virement fournisseur habituel passe sans changement.
3. **Clé d'intention.** On calcule H = hash(IBAN ‖ montant ‖ bénéficiaire ‖ nonce). Un **défi WebAuthn/passkey** est envoyé à l'**appareil enrôlé du demandeur revendiqué** (le vrai PDG), qui affiche en clair « Virer 480 000 € à HK-XXXX ? ». Sa signature lie **ce paiement-là** à **cette personne-là** : on signe ce qu'on voit (leçon de Bybit). La voix ne sert plus à rien au fraudeur.
4. **Signal deepfake en appoint.** Un modèle AASIST ou wav2vec2-AASIST entraîné sur ASVspoof 5 et MLAAD, avec augmentation codec, donne un score versé **au dossier, jamais comme décision**, avec un affichage honnête de son taux d'erreur (EER) sur données compressées.
5. **Blocage dans l'outil de paiement.** Sans signature dans le délai T, le paiement est **retenu** dans le lot de paiements (export EBICS ou pain.001 mis en quarantaine). Signature refusée : gel, alerte à la banque (rappel de fonds) et rapport.

**Réponse graduée.** Information au trésorier (« demande hors workflow détectée ») → défi au demandeur revendiqué → attente du lot → refus explicite : gel, alerte de la banque teneuse de compte et demande de rappel de fonds → rapport d'incident pré-rempli.

**Données.**
- Demandes synthétiques générées par LLM : 200 légitimes, 200 frauduleuses, dont des **injections** dans les e-mails pour tester l'extracteur.
- ASVspoof 5, MLAAD (français), In-the-Wild pour le score vocal.
- Voix clonée **consentie** d'un membre de l'équipe (TTS open source) pour la démo.

**Démo de 3 minutes.**
1. Titouan clone sa propre voix et appelle Adem, « trésorier » : « 480 k€ pour l'acquisition à Hong Kong, confidentiel ».
2. La transcription donne un mandat extrait ; déclenchement ; le défi passkey part sur le « vrai » téléphone du PDG.
3. Le PDG refuse : lot en quarantaine, alerte banque.
4. Score vocal : 0,71, « suspect », affiché comme non décisif.
5. Contre-exemple : virement fournisseur récurrent, aucun défi.

**Métriques.**
- Taux de mandats frauduleux retenus (déterministe si le déclencheur est bon : mesurer la **couverture du déclencheur**).
- Robustesse de l'extracteur aux injections (en %).
- Taux de défis sur les paiements légitimes (cible < 2 %).
- EER du détecteur vocal propre vs compressé (montrer la dégradation : c'est un argument de pitch).
- Temps de signature médian.

**Mapping.**
- NIST CSF : PR.AA-03 et -05, DE.AE-02, RS.MI-01, RS.CO-02.
- ATT&CK : **T1656**, T1657, T1566.004.
- **ATLAS AML.T0088 Generate Deepfakes**, AML.T0052.001.
- OWASP : LLM01 sur l'extracteur ; **ASI03 et ASI07** si la demande transite par un agent (pont vers la piste 3).
- D3FEND : D3-MFA.

**Conformité.**
- Côté banque : PSR art. 50 (VoP) et art. 83.
- Côté entreprise : contrôle interne (séparation des tâches) ; preuve pour l'**assureur cyber ou fraude** (le jury cite les exclusions d'IA non contrôlée).
- AI Act : art. 50 (deepfakes) ; détecteur vocal hors haut risque ; le LLM d'extraction relève des obligations de déployeur, art. 4 (maîtrise de l'IA).
- RGPD : la voix n'est pas utilisée pour identifier, seulement pour scorer l'authenticité.

**Build en 24 h vs mock.** Construit : extracteur Bedrock, moteur de déclenchement, WebAuthn (bibliothèque py_webauthn + page mobile), quarantaine d'un fichier pain.001, détecteur AASIST préentraîné (sans réentraînement : on mesure seulement l'EER sur un sous-échantillon). Mocké : la connexion à l'ERP et à EBICS, et la téléphonie (enregistrement puis transcription par Whisper ou Amazon Transcribe).

**Risque principal.**
- « C'est juste de l'authentification forte appliquée au demandeur » : il faut insister sur le **déclenchement contextuel sans friction** et la **liaison cryptographique au paramètre exact**.
- La détection pure (30 %) repose sur un déclencheur à règles ; le jury peut la juger moins « détection ».
- Marché PME : la banque est-elle l'acheteur ?

**Note.**
- Détection 74.
- Réponse 85.
- Faisabilité 80.
- Conformité 85.
- Pitch 90 (voix clonée en direct, Ferrari, Crosetto).
- Calcul : 0,30·74 + 0,20·85 + 0,20·80 + 0,15·85 + 0,15·90 = 22,2 + 17,0 + 16,0 + 12,75 + 13,5 = **81,45 → 81/100**

---

### Idée D — **PREUVE DE CAPTURE** : contre l'injection au KYC, l'attestation matérielle et le graphe de réutilisation de visages

**Problème en une phrase.** Les caméras virtuelles et les face swaps passent la détection du vivant (liveness), et les fermes d'identités synthétiques réutilisent le même visage généré pour ouvrir des dizaines de comptes mules. Chaque contrôle KYC est jugé isolément.
**Défenseur nommé.** L'**analyste onboarding et KYC** d'une néobanque ou d'un PSAN (prestataire de services sur actifs numériques, MiCA).

**Mécanisme (ce qui est neuf).**
1. **Attestation de capture.**
   - Le SDK KYC signe chaque lot de trames (hash + nonce serveur) avec une **clé attestée par le matériel** (Android Key Attestation / Play Integrity, iOS App Attest). Le nonce est aussi rendu **visuellement** (séquence de couleurs à l'écran, dont on vérifie le reflet sur le visage).
   - Une caméra virtuelle ou un émulateur ne peut pas produire de trames signées par un appareil intègre.
   - Si l'image porte des **Content Credentials C2PA** (Pixel 10), c'est un bonus, pas une exigence.
2. **Graphe de réutilisation.** Les embeddings du selfie **et** du portrait de la pièce d'identité sont indexés (FAISS). Un même visage avec des identités différentes signale une ferme (cas ATLAS AML.CS0034 ProKYC). Une même pièce avec des selfies différents signale un vol d'identité.
3. **Expertise documentaire.** Un classifieur crop & replace / inpainting entraîné sur SIDTD ; contrôle de cohérence MRZ/VIZ (les deux zones de lecture de la pièce).
4. **Contexte d'appareil.** Variables façon BAF : `device_distinct_emails_8w`, session, requête étrangère.
5. **LLM via Bedrock.** Il produit le dossier de revue humaine avec les preuves (paires de visages, régions falsifiées, échec d'attestation).

**Réponse graduée.** Accepté → nouvelle capture imposée par la caméra native attestée → revue humaine → refus, avec signalement au registre partagé et au réseau (et Tracfin si nécessaire).

**Données.** SIDTD / MIDV-2020 (documents), IDNet (portraits substitués), visages générés (StyleGAN) réutilisés entre identités synthétiques, BAF (contexte d'appareil).

**Démo de 3 minutes.**
1. OBS Virtual Camera injecte une vidéo face swap : échec d'attestation.
2. Le même visage généré réapparaît sur 3 demandes : cluster détecté.
3. Une pièce falsifiée par inpainting est repérée, avec la carte de chaleur.
4. Contre-exemple : un vrai utilisateur passe en 1 capture.

**Métriques.** Taux de détection des injections (100 % si l'attestation est obligatoire, avec pour vraie limite les appareils rootés), précision et rappel du clustering, AUC sur SIDTD, taux de deuxième capture chez les légitimes.

**Mapping.**
- NIST CSF : PR.AA-02 (identités vérifiées), DE.AE-02, RS.AN.
- ATLAS : **AML.T0088**, **AML.T0015 Evade AI Model**, AML.CS0033 et CS0034.
- ATT&CK : T1656.

**Conformité.**
- LCB-FT (KYC, Ordonnance 2020-1544 et CMF) ; eIDAS 2 et portefeuille EUDI (alternative future).
- RGPD art. 9 (données biométriques, consentement explicite ou intérêt public substantiel) : **l'indexation des visages entre demandeurs est le point le plus sensible**.
- AI Act annexe III 1(a) (vérification 1:1 exclue, mais la recherche 1:N dans l'index de visages se rapproche de l'identification, ce qui demande une analyse).

**Build en 24 h vs mock.** Construit : clustering de visages (insightface + FAISS), classifieur SIDTD (fine-tuning léger), vérification de signature d'un lot de trames, dossier Bedrock. Mocké : la vraie attestation matérielle, simulée par une clé locale (une vraie attestation Android demande une application native signée, irréaliste en 24 h).

**Risque principal.**
- Faisabilité et RGPD : la base de visages 1:N est un aimant à critiques.
- Le cœur (l'attestation) est mocké.
- iProov, Sardine et d'autres sont déjà sur l'injection.

**Note.**
- Détection 72.
- Réponse 68.
- Faisabilité 58.
- Conformité 66.
- Pitch 75.
- Calcul : 0,30·72 + 0,20·68 + 0,20·58 + 0,15·66 + 0,15·75 = 21,6 + 13,6 + 11,6 + 9,9 + 11,25 = **67,95 → 68/100**

---

## 4. Classement et recommandation

| Rang | Idée | Détection (30) | Réponse (20) | Faisabilité (20) | Conformité (15) | Pitch (15) | **Total** |
|---|---|---|---|---|---|---|---|
| 1 | **A — DOUBLE REGARD** | 82 | 88 | 80 | 85 | 82 | **83** |
| 2 | C — MANDAT SIGNÉ | 74 | 85 | 80 | 85 | 90 | **81** |
| 3 | B — HAMEÇON INVERSÉ | 78 | 75 | 85 | 78 | 82 | **79** |
| 4 | D — PREUVE DE CAPTURE | 72 | 68 | 58 | 66 | 75 | **68** |

**Recommandation : A, sur un seul scénario traité parfaitement, le faux conseiller bancaire.**

**Pourquoi A gagne sur cette grille.**
1. La **détection (30 %)** se démontre par une ablation chiffrée : un seul côté contre les deux, avec des faux positifs ramenés à un dénominateur et des confondants publiés.
2. La **réponse (20 %)** comporte cinq niveaux proportionnés, dont le **gel côté bénéficiaire** que personne ne montre.
3. La **conformité (15 %)** colle mot pour mot aux obligations du PSR (art. 83, 83a, 59) et au rail VoP déjà en production. C'est la question que KPMG posera.
4. Le message est clair : « Chaque banque voit la moitié du crime ; nous recollons les deux moitiés sans échanger une seule donnée personnelle. »

**Ce qu'on peut emprunter sans diluer le projet.**
- **De B** : une liste « IBAN mules confirmés », injectée dans la bande bénéficiaire. Une ligne de pitch suffit (« demain, nos canaris l'alimentent »).
- **De C** : la phrase « on ne détecte pas la voix, on vérifie les faits ». En Q&R, si on nous demande « et les deepfakes vocaux ? », la réponse est : notre décision ne dépend pas de la voix ; le faux conseiller peut être un humain ou un clone, le contexte de session et le bénéficiaire restent les mêmes.

**Réponses préparées aux questions du jury.**
- **« Si votre modèle se trompe, qui est responsable ? »** La matrice déterministe, versionnée et signée, décide. Le ML n'agit que dans les cas intermédiaires et le LLM n'agit jamais. Tout gel est réversible en un clic et validé par un humain dès R3 (RGPD art. 22). La responsabilité reste celle du PSP, conformément au PSR, qui la lui attribue de toute façon (« failure to block »).
- **« BioCatch, Mastercard ? »** Ils voient chacun une moitié du crime, et l'outil de Mastercard est britannique. Notre apport est la jonction sur le rail européen obligatoire, et elle est mesurée.
- **« Vos données sont synthétiques. »** Oui, comme le reconnaît la FCA avec son propre jeu. Les GAN détruisent les signaux comportementaux (arXiv 2604.13125), c'est pourquoi on a choisi un simulateur à base d'agents, avec confondants publiés et la liste de ce qu'on ne détecte pas.

**Planning indicatif (2 personnes, environ 24 h).**
- **Adem** :
  - H0-3 : générateur ;
  - H3-6 : modèle BAF et bande bénéficiaire ;
  - H6-10 : moteur de fusion, règles, journal chaîné ;
  - H10-14 : application web simulée et télémétrie ;
  - H14-17 : Bedrock (fiche et sceptique) ;
  - H17-20 : métriques et ablation ;
  - H20-22 : déploiement AWS et vidéo.
- **Titouan** : en parallèle, playbook, slide conformité (PSR, AI Act, RGPD, DORA), fiche de défense, pitch, script de démo avec contre-exemple, business model (licence par PSP + réseau de bandes de risque entre banques membres).

**Ce qu'on dira ne pas détecter.**
- Les arnaques lentes sans appel actif (investissement, romance sur plusieurs semaines) : il faudrait un module de dérive longitudinale.
- Les mules anciennes réactivées.
- La victime qui se déplace en agence.
- Un fraudeur qui guide la victime **depuis un autre appareil, sans appel ni partage d'écran** : il ne reste alors que le côté bénéficiaire.

---

## Sources principales (consultées le 2026-10-10)
- EBA-ECB, rapport conjoint sur la fraude aux paiements, déc. 2025 : https://www.ecb.europa.eu/press/intro/publications/pdf/ecb.ebaecb202512.en.pdf · https://www.eba.europa.eu/publications-and-media/press-releases/joint-eba-ecb-report-payment-fraud-strong-authentication-remains-effective-fraudsters-are-adapting
- OSMP, rapport 2025 : https://www.banque-france.fr/system/files/2026-09/Rapport_2025_de_l_OSMP.pdf · https://www.moneyvox.fr/banque/actualites/110566/faux-conseillers-bancaires-les-chiffres-chocs-de-explosion-de-la-fraude-par-manipulation
- UK Finance, Fraud Report 2026 : https://www.ukfinance.org.uk/system/files/2026-06/UK%20Finance%20Fraud%20Report%202026.pdf
- Évaluation du remboursement APP par le PSR : https://www.regulationtomorrow.com/2026/07/payment-fraud-falls-by-73m-following-psr-reimbursement-scheme/ · https://www.plenitudeconsulting.com/news-insights/psr-publishes-latest-app-scams-reimbursement-dashboard
- Accord PSR/PSD3 : https://www.williamfry.com/knowledge/psr-psd3-eu-payment-services-legislation-is-agreed/ · https://www.biocatch.com/blog/psd3-at-year-end-the-deal-is-done · https://finologee.com/psr-what-the-provisional-political-agreement-signals-for-psps/ · https://iapp.org/news/a/new-eu-payment-rules-could-expand-fraud-monitoring
- VoP : https://legal.pwc.de/en/news/articles/verification-of-payee-requirements-vop-under-the-eus-instant-payments-regulation-ipr · https://www.europeanpaymentscouncil.eu/node/27686
- Visa et BioCatch : https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.22626.html ; détection RAT par BioCatch : https://www.biocatch.com/use-case/customer-protection/remote-access-attacks ; scams 2026 : https://www.biocatch.com/press-release/global-banking-scams-increase-by-35
- Mastercard CFR : https://www.mastercard.com/gb/en/news-and-trends/press/2024/september/mastercard-expands-first-of-its-kind-ai-technology-to-help-banks-protect-more-consumers-from-scams-in-real-time.html
- Pay.UK EDEx : https://www.wearepay.uk/enhanced-data-exchange-edex/ · https://obconnect.io/cop-2-0-enhanced-fraud-data-edex/
- Pindrop VISR 2025 : https://www.pindrop.com/wp-content/uploads/2025/07/Voice-Intelligence-and-Security-Report-Report-June-2025.pdf
- Reality Defender RealMeeting : https://www.realitydefender.com/product/realmeeting
- iProov, rapport 2025 : https://www.iproov.com/press/annual-identity-verification-threat-intelligence-report
- Sumsub 2025-26 : https://www.infosecurity-magazine.com/news/ai-deepfake-fraud-skyrockets/
- Google, protection pendant les appels : https://cyberinsider.com/android-expands-in-call-scam-protections-to-us-fintech-and-banking-apps/
- Monzo, Revolut, Nationwide : https://www.which.co.uk/news/article/new-nationwide-call-checker-tool-how-is-your-bank-fighting-fraud-aMLGG7M1ASS7 · https://tech.eu/2024/02/15/revolut-launches-ai-scam-features-to-break-scammers-spell/
- Arcep, usurpation de numéros : https://siecledigital.fr/2026/02/16/appels-frauduleux-larcep-alerte-sur-une-explosion-des-signalements/
- Singapour SRF : https://www.aoshearman.com/en/insights/ao-shearman-on-fintech-and-digital-assets/combatting-payment-account-fraud-singapores-shared-responsibility-framework
- Affaire Crosetto : https://www.aljazeera.com/news/2025/10/6/ai-now-sounds-more-like-us-should-we-be-concerned
- ASVspoof 5 : https://arxiv.org/html/2601.03944v1 ; généralisation : https://arxiv.org/html/2507.01750v1 ; MLAAD : https://arxiv.org/html/2401.09512v9 ; ML-ITW : https://arxiv.org/html/2603.05852v1
- Détection d'arnaque téléphonique par LLM : https://arxiv.org/html/2502.03964v1 · PoPETs 2026 : https://www.petsymposium.org/popets/2026/popets-2026-0006.pdf
- BAF : https://github.com/feedzai/bank-account-fraud · https://arxiv.org/abs/2211.13358
- Jeu APP de la FCA : https://www.fca.org.uk/firms/digital-sandbox/authorised-push-payment-synthetic-data
- RBA login dataset : https://zenodo.org/record/6782156
- Fidélité comportementale des générateurs synthétiques : https://arxiv.org/pdf/2604.13125
- SIDTD : https://arxiv.org/pdf/2401.01858 ; BB-MAS : https://arxiv.org/pdf/1912.02736
- AI Act, annexe III : https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3 ; exception fraude : https://www.mccannfitzgerald.com/knowledge/technology-and-innovation/essential-services-spotlight-eu-ai-act-draft-guidelines-on-high-risk-ai-classification ; reconnaissance d'émotions : https://sota.io/blog/eu-ai-act-annex-iii-point-1-biometric-identification-categorisation-emotion-recognition-prohibited-high-risk-developer-guide-2026
- ATLAS AML.T0088 et cas d'étude : https://d3fend.mitre.org/offensive-technique/attack/AML.T0088/ · ATT&CK T1656 : https://attack.mitre.org/techniques/T1656/

**Points à vérifier avant toute slide** : la numérotation finale des articles du PSR (texte au JOUE) ; les noms exacts des colonnes BAF (datasheet) ; un éventuel bilan VoP post-octobre 2025 (aucun trouvé) ; le statut final des lignes directrices de la Commission sur l'annexe III 1(c) appliquée aux signaux comportementaux.

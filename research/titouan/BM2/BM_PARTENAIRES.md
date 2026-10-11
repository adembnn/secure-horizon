# BM_PARTENAIRES. Distribution et partenariats pour Hold up (recherche du 11/10/2026)

Promesse rappelée : cesser de donner plus que nécessaire, car on s'expose. L'utilisateur écrit ce qu'il veut faire ; le moteur compare à l'effet réel de l'opération.

Étiquettes :
- [V] : lu à l'URL citée pendant cette recherche.
- [NV] : vu dans un résultat de recherche, un article tiers ou un fichier antérieur du repo, sans relecture de la page source.
- "introuvable" : cherché, rien trouvé.
- HYP : hypothèse ou ordre de grandeur de ma part.

Point de départ : `research/titouan/S_business_model/S1_payeurs_et_canaux.md` (payeurs, prix publics) et `J_recherche/J9_dora_prestataire_tic.md` (DORA). Ce fichier ne refait pas ce travail ; il le complète sur la distribution, les partenaires, le financement et la conformité.

## 0. Cinq faits qui changent le plan

1. Les permissions `endowment:transaction-insight` et `endowment:signature-insight` sont aujourd'hui dans la liste des permissions "ouvertes" de MetaMask : un Snap qui ne fait que de l'analyse de transaction ou de signature s'installe sans allowlist [V] https://docs.metamask.io/snaps/how-to/get-allowlisted/. Notre fichier OB disait l'inverse ; il est à corriger.
2. Mais l'avertissement bloquant (`severity: "critical"`, fenêtre modale avant confirmation) reste expérimental et réservé à MetaMask Flask [V] https://docs.metamask.io/snaps/features/transaction-insights/. Sur MetaMask stable, un Snap informe ; il ne bloque pas.
3. Chrome Web Store : la revue prend "quelques jours" en général et "jusqu'à quelques semaines" ; elle est plus longue pour les extensions qui demandent des permissions d'hôte larges, pour les nouveaux développeurs et les nouvelles extensions [V] https://developer.chrome.com/docs/webstore/review-process. Hold up coche ces trois cases.
4. MiCA exclut explicitement les fournisseurs de portefeuilles non dépositaires (considérant 83) [V] https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023R1114. Hold up n'est même pas un portefeuille. Le risque réglementaire principal est donc le RGPD (la phrase envoyée au modèle), pas MiCA.
5. Les subventions Avalanche ouvertes et accessibles à une équipe étudiante sont petites : Team1 Mini Grants jusqu'à 10 000 $ [V] https://team1.network/grants. Retro9000 récompense des L1 et de l'outillage pour L1, ou (tour C-Chain 2026) l'AVAX brûlé : mauvaise adéquation pour un outil de sécurité grand public.

## 1. Voies d'intégration techniques et leur coût

### 1.1 Extension navigateur (Chrome Web Store)
- Revue : "For most extensions, review is completed within a few days, but it can take up to a few weeks." Contacter le support après trois semaines [V] https://developer.chrome.com/docs/webstore/review-process.
- Facteurs qui allongent : permissions d'hôte larges ("extensive access to the user's web activity"), capacités puissantes, volume de code, nouveau développeur, nouvelle extension, gros changement [V] même URL.
- Code obfusqué interdit ; minification tolérée ; chaque mise à jour repasse la même revue [V] même URL.
- Manifest V3 : pas de code distant. Interdit d'exécuter une chaîne récupérée sur un serveur (`eval`), interdit un `<script>` hors du paquet. Autorisé : récupérer des données, et une configuration distante si toute la logique est dans le paquet [V] https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements. Conséquence : la réponse du modèle hébergé doit rester une donnée (verdict, champs), jamais du code. Les règles du moteur doivent être embarquées.
- Données : collecte limitée à "l'objectif unique" déclaré ; l'activité de navigation n'est permise que pour une fonction visible et décrite ; transfert à un tiers permis s'il sert l'objectif unique ou la protection contre la fraude ; déclaration publique de conformité "Limited Use" obligatoire sur le site [V] https://developer.chrome.com/docs/webstore/program-policies/limited-use. Envoyer la phrase à un modèle hébergé est compatible si c'est déclaré et nécessaire.
- Environnement : de fausses extensions de portefeuilles continuent de passer (cas imToken publié le 2 février 2026) [NV] https://www.esecurityplanet.com/threats/malicious-chrome-extension-targets-imtoken-wallet-users/. Une extension de sécurité inconnue part avec un déficit de confiance.
- Coût : temps de revue ; frais d'inscription développeur non vérifiés ici. HYP : prévoir deux à trois semaines pour la première publication, et publier d'abord en "non répertorié" pour les testeurs.

### 1.2 MetaMask Snaps
- Permissions ouvertes : `endowment:transaction-insight`, `endowment:signature-insight`, `snap_dialog`, `snap_notify`, `snap_manageState`, `endowment:cronjob`, etc. Toute autre permission est protégée et exige l'allowlist [V] https://docs.metamask.io/snaps/how-to/get-allowlisted/.
- Attention : `endowment:network-access` n'est pas dans la liste ouverte [V] même URL. Or un Snap qui appelle notre modèle hébergé en a besoin. Donc : allowlist nécessaire dès qu'on appelle un serveur. Prérequis : code public, publication npm, scan Snapper, formulaire Snaps Directory, au moins deux approbations, re-soumission à chaque version [V] même URL.
- Audit tiers exigé seulement pour les méthodes d'entropie et de gestion de comptes [V] même URL. Pas notre cas.
- Délai de revue : non publié (introuvable).
- Limite produit : sur stable, pas d'alerte bloquante (Flask seulement) [V] https://docs.metamask.io/snaps/features/transaction-insights/. Le Snap affiche un onglet ; il n'arrête rien.
- Verdict : bon canal de crédibilité et de démo ; mauvais canal pour la friction graduée qui est au cœur du produit.

### 1.3 Standards d'intégration de portefeuille
- EIP-6963 (Final, mai 2023) : plusieurs portefeuilles en extension s'annoncent à la dapp par événements, au lieu de se battre pour `window.ethereum` [V] https://eips.ethereum.org/EIPS/eip-6963. Pour Hold up : utile pour détecter quel portefeuille est utilisé ; se présenter soi-même comme fournisseur intermédiaire (proxy) serait techniquement possible mais très risqué en revue Chrome et en confiance (HYP).
- Wallet Standard : équivalent côté Solana et Sui, découverte par événements `register-wallet` / `app-ready` [NV] https://docs.phantom.com/developer-powertools/wallet-standard. Hors périmètre EVM du hackathon.
- ERC-7715 (Draft, 24 mai 2024) : la dapp demande au portefeuille des permissions typées, avec expiration ; le texte dit que les dapps "should only request the permissions they need, with a reasonable expiration time" [V] https://eips.ethereum.org/EIPS/eip-7715. C'est exactement notre promesse. Récit possible : demain, Hold up traduit la phrase de l'utilisateur en permission minimale. Statut brouillon : ne pas le présenter comme acquis.

### 1.4 SDK mobile
- Sur mobile, une extension ne peut pas s'interposer entre la dapp et le portefeuille. Seule voie : être embarqué par le portefeuille (SDK ou API). Aucun programme public d'intégration tierce trouvé chez Rabby, Phantom, Trust ou Coinbase (voir 2.1). Introuvable.
- Modèle existant : Kerberus propose une API aux portefeuilles, "zero-cost", rémunérée par partage de revenu sur les swaps DEX ; deux entrées : données de transaction et origine du site [V] https://www.kerberus.com/api/. C'est la référence à battre si l'on vend un SDK.

### 1.5 RPC protecteur
- Précédent : Harpie fonctionnait comme RPC dédié et a dû demander aux utilisateurs de le retirer à sa fermeture [NV, repo L1_harpie_postmortem.md]. Friction d'installation et point unique de défaillance.
- Programme de partenariat RPC : introuvable. Verdict : à écarter pour les 90 jours.

### 1.6 Safe (modules et guards)
- Un Guard ajoute des restrictions au-dessus du schéma n sur m : `checkTransaction` avant exécution, `checkAfterExecution` après ; un Guard défectueux peut bloquer le Safe (déni de service), d'où audit et plan de secours [V] https://docs.safe.global/advanced/smart-account-guards.
- Zodiac Roles Modifier : permissions fines par rôle, plafonds de dépense en v2, audité [NV] https://github.com/gnosisguild/zodiac-modifier-roles.
- Safe Shield (novembre 2025) s'appuie déjà sur Hypernative [NV, S1].
- Verdict : c'est le chemin "on-chain" de la promesse (ne pas donner plus que nécessaire), mais c'est un produit trésorerie, hors cible particuliers. À garder pour une version 2.

### 1.7 Tableau de synthèse des voies

| Voie | Coût d'entrée | Délai | Bloque ? | Source | V/NV |
|---|---|---|---|---|---|
| Extension Chrome | Revue, déclaration Limited Use, pas de code distant | Quelques jours à quelques semaines | Oui (notre UI) | developer.chrome.com/docs/webstore/review-process | V |
| Snap MetaMask sans réseau | Permissions ouvertes, pas d'allowlist | Immédiat | Non sur stable | docs.metamask.io/snaps/how-to/get-allowlisted | V |
| Snap MetaMask avec modèle hébergé | Allowlist, npm, Snapper, deux approbations | Introuvable | Non sur stable | même URL | V |
| EIP-6963 | Lecture seule pour détecter le portefeuille | Faible | Sans objet | eips.ethereum.org/EIPS/eip-6963 | V |
| ERC-7715 | Brouillon | Incertain | Sans objet | eips.ethereum.org/EIPS/eip-7715 | V |
| SDK mobile | Accord avec un portefeuille | HYP 6 à 18 mois | Selon portefeuille | introuvable | NV |
| RPC protecteur | Infra et confiance | Long | Oui | repo L1 | NV |
| Safe Guard | Audit, risque de blocage | Long | Oui | docs.safe.global | V |

## 2. Partenaires potentiels par catégorie

### 2.1 Portefeuilles
- Core (Avalanche) : Blockaid intégré depuis le 5 juin 2024, alertes temps réel avant signature [V] https://blockaid.io/blog/blockaid-bolsters-security-on-avalanche-with-core-integration. On ne vend pas un scanner de plus ; on propose le contrôle intention contre effet en complément.
- Rabby : moteur de sécurité interne (simulation sur fourche) ; aucun fournisseur tiers nommé ; audits Least Authority et SlowMist [NV] https://iq.wiki/wiki/rabby-wallet.md. Programme partenaire : introuvable.
- Phantom : a racheté Blowfish (19 novembre 2024) et fermé le service tiers [NV, S1] https://phantom.com/learn/blog/phantom-acquires-blowfish. Préférence pour l'interne.
- Coinbase Wallet : Blockaid depuis mars 2024 environ [NV] https://blockaid.io/end-user-protection.
- Trust Wallet : scanner avec simulation et listes noires ; fournisseur non nommé ; la page admet que la simulation "ne peut pas juger si une opération d'apparence légitime est une bonne décision" [NV] https://trustwallet.com/blog/security/how-trust-wallet-security-scanner-works. C'est précisément notre angle (l'intention), mais aucun point d'entrée public.
- MetaMask : Blockaid intégré (2023) [NV] https://www.theblock.co/post/260176 ; Snaps comme porte ouverte (1.2).

### 2.2 Exchanges et fintechs
- Contrôles avant retrait déjà construits en interne : Binance Withdraw Protection, Coinbase Vault [NV, S1]. Programme API pour fournisseurs de contrôle tiers : introuvable.
- Douleur chiffrée : Coinbase 180 à 400 M$ de coûts après la fuite de mai 2025 [NV, S1].
- Point d'entrée réaliste : PSAN ou CASP français de taille moyenne, via réseau ESSEC (HYP). Liste blanche AMF sur protectepargne.amf-france.org [NV].

### 2.3 Assureurs et protection
- Coincover : partenaires listés BitGo, Fireblocks, Cobo, Utila, Fordefi, Copper ; intégration par API partenaire, cérémonie de clés hors ligne ou sauvegarde en libre-service ; "supports every non-custodial platform" et invite à le contacter [V] https://developer.coincover.com/partner-guides/overview. Cible institutionnelle (clés MPC), pas une extension étudiante.
- Nexus Mutual : la V2 est conçue pour vendre de la couverture dans l'interface de tiers ; l'intégrateur fixe une commission sur chaque achat [V] https://nexusmutual.io/blog/nexus-mutual-v2-live-on-ethereum-mainnet (annonce du 15 mars 2023). Couvre surtout le risque protocole, pas le vol d'un particulier [NV].
- Fairside : fournit la couverture vol jusqu'à 30 000 $ de Revoke Sidekick Standard ; l'extension Revoke est désormais "développée et opérée avec Fairside" ; Standard financé par 0,8 % sur certains swaps [V] https://revoke.cash/blog/2026/revoke-extension-update (3 avril 2026). Tarif direct d'environ 1,95 % par an [NV].
- Réserve : toucher une commission d'assurance peut relever de l'intermédiation (immatriculation ORIAS). Non vérifié ; à poser à un juriste avant toute promesse.

### 2.4 Éditeurs de sécurité : intégration ou concurrence
- Blockaid : API Shield pour dapps, portefeuilles, exchanges ; dit être dans plus de 90 % des grands portefeuilles (chiffre société) [NV] https://blockaid.io/end-user-protection. Concurrent direct sur la réputation ; programme partenaire introuvable.
- GoPlus : API et SDK modulaires (simulation, adresses malveillantes, approbations) ; palier gratuit de 150 000 unités de calcul par mois [NV, S1] https://gopluslabs.io/security-api. Meilleur candidat comme source de données dans notre moteur : on consomme leur réputation, on apporte l'intention.
- Hypernative : partenariats Fordefi (septembre 2024) et marketplace Alchemy ; programme "Ecosystem" pour les chaînes [NV] https://hypernative.io/solutions/chain-integrations. Cible institutionnelle. Concurrence faible sur le particulier.
- Kerberus : API gratuite pour portefeuilles, partage de revenu sur swaps [V] https://www.kerberus.com/api/. Concurrent sur le modèle économique.

### 2.5 Écosystème Avalanche
- Builder Hub, page subventions : appel à propositions de recherche jusqu'à 50 000 $ (économie des crypto-actifs) ; Blizzard Fund (investissement, plus de 200 M$) ; Team1 Builder Grants ; bug bounty jusqu'à 100 000 $ via Immunefi [V] https://build.avax.network/grants.
- Team1 : Mini Grants jusqu'à 10 000 $, ouverts aux nouveaux projets ; Accelerator Grants jusqu'à 30 000 $, sans candidature ouverte, proposés et votés par un comité ; "high volume of applications... does not guarantee funding" [V] https://team1.network/grants.
- Codebase : saison 4 annoncée le 7 mai 2025, clôture le 6 juin 2025 ; environ 1,5 M$ d'investissements et 1 M$ de subventions non dilutives cumulés ; exige une démo fonctionnelle, de construire nativement sur Avalanche et deux fondateurs présents à la Welcome Week [V] https://www.avalanche.com/blog/build-for-impact-on-avalanche-codebase-season-4-applications-are-open. Saison 2 : 50 000 $ non dilutifs par équipe [NV]. Cohorte 2026 : introuvable.
- Retro9000 : deuxième cohorte du 27 août 2025, 8 lauréats, plus de 250 000 $, réserve de 40 M$ ; catégories L1 et outillage pour L1 (open source, documenté) ; KYB et KYC obligatoires [V] https://www.avalanche.com/about/blog/the-avalanche-foundation-announces-second-cohort-for-retro9000. Tour C-Chain 2026 classé sur l'AVAX brûlé, plafond de 200 000 $ par projet [NV] https://egamers.io/avalanche-foundation-launches-fourth-retro9000-cohort-for-c/. Faible adéquation.
- ICM (Interchain Messaging, ex-Teleporter) : messagerie entre L1 Avalanche, `sendCrossChainMessage` [NV] https://build.avax.network/docs/cross-chain/teleporter/overview. Pas un partenaire ; une catégorie d'opérations que le moteur devra décoder pour dire l'effet réel d'un transfert inter-chaînes (HYP).

### 2.6 ESSEC
- ESSEC Ventures : incubateur étudiant, plus de 150 projets par an, ouvert aux étudiants en formation initiale ou continue ; contact entrepreneurs@essec.edu [V] https://essec.edu/fr/pages/entreprendre-a-l-essec/. Candidature toute l'année, gratuit jusqu'au diplôme, sans sélection formelle [NV] https://www.mondedesgrandesecoles.fr/essec-ventures-incubateur/.
- ESSEC Incubator à Station F : pour startups de diplômés, avec MVP et premiers clients [V] même URL. Pas encore pour nous.
- ESSEC Founders Day : concours avec ESSEC Alumni ; en 2022, deux prix de 10 000 € [NV] https://www.essec.edu/fr/actualites/essec-founders-day-2022-decouvrez-les-six-finalistes/. Édition 2026 : introuvable.
- Chaire blockchain à l'ESSEC : introuvable.

### 2.7 Tableau partenaires

| Partenaire | Ce qu'il gagne | Ce qu'on gagne | Point d'entrée | Délai plausible (HYP) | Source | V/NV |
|---|---|---|---|---|---|---|
| ESSEC Ventures | Un projet de plus, visibilité | Statut, locaux, mentors, accès Bourse French Tech | entrepreneurs@essec.edu | 2 à 4 semaines | essec.edu/fr/pages/entreprendre-a-l-essec | V |
| Team1 Avalanche (Mini Grant) | Un outil de sécurité sur Avalanche | Jusqu'à 10 000 $, visibilité jury | go.team1.network/mini-grants | 1 à 3 mois | team1.network/grants | V |
| Codebase | Projet natif Avalanche | Subvention, mentorat | Prochain appel (introuvable) | Calendrier annuel | avalanche.com/blog (S4) | V |
| Core / Ava Labs | Complément à Blockaid sur l'intention | Distribution Avalanche | Via Team1 ou Codebase | 6 à 18 mois | blockaid.io/blog (Core) | V |
| MetaMask Snaps | Snap de plus dans le Directory | Crédibilité, millions d'utilisateurs potentiels | Formulaire Snaps Directory | Introuvable | docs.metamask.io | V |
| GoPlus | Consommation de son API | Réputation d'adresses gratuite au départ | API publique | Immédiat | gopluslabs.io/security-api | NV |
| Revoke.cash | Contenu éducatif, trafic | Audience "approbations" | GitHub ou contact du site | 1 à 3 mois | revoke.cash/blog/2026/revoke-extension-update | V (partenariat Fairside) |
| Fairside | Distribution de couverture | Offre "protégé + couvert" | Équipe commerciale (introuvable) | 3 à 6 mois | même URL | V |
| Nexus Mutual | Ventes via notre UI | Commission d'intégrateur | Contrat distributeur | 3 à 6 mois, après avis juridique | nexusmutual.io/blog (V2) | V |
| Coincover | Rien à court terme | Rien à court terme | Formulaire contact | Hors 90 jours | developer.coincover.com | V |
| Kryptosphère | Contenu et ateliers | Testeurs étudiants | Antenne d'école (antenne ESSEC non vérifiée) | 2 à 4 semaines | cryptoast.fr (Krypto-Tour) | NV |
| Fintech ou CASP français | Preuve de diligence avant retrait | Premier pilote payant possible | Réseau ESSEC | 6 à 12 mois | S1 | NV |
| Blockaid | Rien (concurrent) | Rien | Sans objet | Sans objet | blockaid.io/end-user-protection | NV |
| Safe / Zodiac | Garde-fou par intention | Cible trésoreries | Forum Safe | Version 2 | docs.safe.global | V |

## 3. Financement non dilutif et concours

| Programme | Montant publié | Conditions clés | Date | Adéquation | Source | V/NV |
|---|---|---|---|---|---|---|
| Team1 Mini Grants | Jusqu'à 10 000 $ | Nouveaux projets acceptés | Continu | Bonne | team1.network/grants | V |
| Team1 Accelerator | Jusqu'à 30 000 $ | Sur proposition du comité | Pas de candidature | Après un Mini Grant | même URL | V |
| Avalanche research proposals | Jusqu'à 50 000 $ | Recherche académique, économie des crypto-actifs | Non indiquée | Moyenne, via un enseignant-chercheur | build.avax.network/grants | V |
| Codebase | 50 000 $ par équipe (saison 2) | Démo, natif Avalanche, présence physique | Saison 4 close le 6 juin 2025 ; 2026 introuvable | Bonne si appel ouvert | avalanche.com/blog (S4) ; S2 en NV | V / NV |
| Retro9000 | Plus de 250 000 $ pour 8 projets (cohorte 2) | L1 ou outillage L1 ; ou AVAX brûlé (2026) | 2025 ; tour 2026 mensuel | Faible | avalanche.com/about/blog | V |
| Ethereum Foundation ESP | Selon le périmètre | Open source, non commercial ; ne finance généralement pas ce qui vise l'utilisateur final | Rounds non affichés | Faible pour l'extension ; possible pour un banc de test ouvert | esp.ethereum.foundation/applicants | V |
| EF Trillion Dollar Security | Pool d'audits de 1 M$ (avril 2026) ; partenariat SEAL contre les drainers | Programme de subvention portefeuille : non confirmé | 2026 | À surveiller | blockeden.xyz (blog tiers) ; theblock.co/post/367694 | NV |
| Gitcoin GG24 | Plus de 1,8 M$ sur six domaines | Domaines thématiques | Octobre et novembre 2025 ; 2026 introuvable | Moyenne | gitcoin.co/case-studies/gg24-first-funding-round-of-gitcoin-3-0 | NV |
| Bourse French Tech | 30 000 € max, jusqu'à 70 % des dépenses | Société de moins d'un an, moins de 50 salariés, 30 % d'apport propre, aucune dépense antérieure au dépôt | Continu | Bonne après immatriculation | bpifrance.fr/catalogue-offres/bourse-french-tech (403 à la lecture) | NV |
| French Tech Tremplin | 22 900 € + 12 mois d'incubation | Critères de diversité sociale (50 % du capital) | Appel 2026 clos (22 janv. au 1er mars 2026) | Selon profil des fondateurs | bpifrance-creation.fr (événement 2026) | NV |
| Station F Founders | Payant (bureau) | En pause | Introuvable | Faible | faq.stationf.co | NV |
| Plug and Play Paris (BNP Paribas) | Gratuit, sans prise de capital (données 2017) | Cohortes de 10 | Actualité introuvable | À vérifier | techcrunch.com/2017/04/28 | NV |
| ESSEC Founders Day | 10 000 € par lauréat (2022) | Étudiants et alumni | 2026 introuvable | Bonne | essec.edu/fr/actualites | NV |

Lecture : à 90 jours, seuls Team1 Mini Grant et l'entrée ESSEC Ventures sont certains d'être ouverts. La Bourse French Tech suppose une société immatriculée.

## 4. Conformité d'entreprise

### 4.1 MiCA, PSAN, CASP
- Considérant 83 : "Hardware or software providers of non-custodial wallets should not fall within the scope of this Regulation." [V] EUR-Lex 2023/1114.
- Garde (art. 3(1)(17)) : "safekeeping or controlling, on behalf of clients, of crypto-assets or of the means of access... private cryptographic keys" [V]. Hold up ne détient ni fonds ni clés.
- Transfert (art. 3(1)(26)) : transférer des crypto-actifs pour le compte d'une personne [V]. Hold up n'exécute aucun transfert ; il commente une opération que l'utilisateur signe lui-même.
- Ce qui reste incertain : le conseil (art. 3(1)(24)) se définit comme "personalised recommendations to a client... in respect of one or more transactions relating to crypto-assets" [V]. Un avertissement de sécurité sur une transaction n'est pas un conseil en investissement selon notre lecture, mais aucune position AMF, ACPR ou ESMA sur les outils d'alerte n'a été trouvée (introuvable). Règle produit : ne jamais dire "achetez", "vendez", "bon placement" ; parler d'écart entre la phrase et l'effet.
- Fin de la période transitoire PSAN au 1er juillet 2026 [NV] https://www.actu-juridique.fr/affaires/droit-financier/coup-denvoi-pour-les-depots-de-demande-dagrement-de-casp-en-france/. Sans effet pour un éditeur qui ne fournit aucun service de l'article 3(1)(16).
- Changements qui rouvriraient la question : prendre une commission sur des swaps (modèle Revoke ou Kerberus), toucher une commission d'assurance (ORIAS), conserver des clés pour le mode "alerte de quelqu'un de confiance". À faire valider par un juriste avant tout lancement.

### 4.2 RGPD (la phrase envoyée au modèle hébergé)
- La phrase peut contenir des données personnelles (montant, nom du destinataire, adresse de portefeuille). Statut d'une adresse de portefeuille comme donnée personnelle : probable car pseudonyme, non vérifié auprès d'une source officielle.
- Rôles : Hold up responsable de traitement ; fournisseur du modèle sous-traitant, contrat article 28 [NV] synthèse Bird & Bird du guide CNIL 2024 https://www.twobirds.com/en/insights/2024/france/transferts-de-donnees-hors-union-europeenne-la-cnil-pubie-un-guide-pratique.
- Transfert hors UE : décision d'adéquation ou garanties appropriées, dont les clauses contractuelles types mises à jour le 4 juin 2021, sans autorisation CNIL [V] https://www.cnil.fr/fr/transferts-hors-ue-quelles-formalites. Statut actuel du Data Privacy Framework UE États-Unis : non vérifié ici.
- Mesures à prendre (HYP, cohérentes avec Limited Use de Chrome) : minimiser (remplacer les adresses par des jetons avant envoi), ne pas conserver la phrase par défaut, interdire l'entraînement par le fournisseur, publier une politique de confidentialité et la déclaration Limited Use.

### 4.3 DORA si le client est une banque
- Le fournisseur devient prestataire tiers de services TIC ; contrat inscrit au registre d'informations ; clauses de l'article 30(2) pour tout contrat ; clauses renforcées de l'article 30(3) (audit, sortie, tests, continuité) seulement si le service soutient une fonction critique ou importante [NV ici ; lu dans repo J9_dora_prestataire_tic.md].
- Désignation comme prestataire critique (art. 31) : improbable pour un éditeur de niche [NV, J9].
- Conséquence : un pilote banque se prépare avec une annexe 30(2) prête et une annexe 30(3) en option.

## 5. Croissance auprès des particuliers sans budget
- Kryptosphère : 22 antennes et plus de 800 membres selon l'article sur le Krypto-Tour [NV] https://cryptoast.fr/krypto-tour-debarque-lyon-pour-edition-inedite-dediee-web3-finance/. Antenne ESSEC : non vérifiée. Format : atelier "vos approbations ouvertes en 10 minutes".
- Éducation sur les approbations : Revoke.cash est open source sur GitHub, avec des issues "good first issue", et intègre déjà des partenaires (ScamSniffer en mars 2024, Webacy, Ledger Live, Candide, Fairside) [NV] https://revoke.cash/blog/2024/year-in-review. Contribution open source plutôt que demande de partenariat : moins de friction.
- Etherscan : formulaire de signalement d'adresse de phishing, avec preuve obligatoire, qui mène à un label public [NV] https://info.etherscan.com/report-address. Usage : chaque escroquerie vue par nos testeurs est signalée ; c'est un geste de communauté, pas un partenariat.
- Farcaster : les Mini Apps exposent un fournisseur EIP-1193 au portefeuille de l'utilisateur [NV] https://miniapps.farcaster.xyz/llms.txt. Canal de démonstration ("écris ce que tu veux faire") plutôt que de protection.
- Mode "alerte de quelqu'un de confiance" : levier viral naturel (chaque utilisateur invite un proche). Contrainte : ne jamais partager de clé ni pouvoir de signature, sinon la question de la garde (4.1) revient. Antériorité produit : non recherchée ici.

## 6. Plan d'exécution sur 90 jours

### J0 à J30
- Publier l'extension Chrome en "non répertorié" avec déclaration Limited Use et politique de confidentialité.
- Publier un Snap MetaMask sans accès réseau (règles embarquées, permissions ouvertes) pour la démo ; préparer le dossier d'allowlist pour la version avec modèle.
- Entrer à ESSEC Ventures (entrepreneurs@essec.edu).
- Déposer la demande Team1 Mini Grant.
- Brancher GoPlus (palier gratuit) comme source de réputation.

### J30 à J60
- Ateliers approbations avec deux antennes Kryptosphère.
- Contribution open source à Revoke.cash (par exemple un cas d'exploit d'approbation documenté).
- Avis juridique écrit sur 4.1 et 4.2 (clinique juridique ou réseau ESSEC, HYP).

### J60 à J90
- Soumettre l'extension en public ; soumettre le Snap à l'allowlist.
- Rencontre exploratoire avec une fintech ou un CASP français sur le contrôle avant retrait.
- Préparer le dossier Bourse French Tech si la société est immatriculée.

### Trois pilotes mesurables

| Pilote | Qui | Quoi | Critère de réussite à J90 |
|---|---|---|---|
| P1 Testeurs étudiants | ESSEC et deux antennes Kryptosphère | Extension non répertoriée, 50 testeurs, journal anonyme des verdicts | 30 testeurs actifs à J30 ; au moins 500 phrases analysées ; taux d'alertes jugées injustifiées par les testeurs inférieur à 10 % ; au moins 5 cas réels où l'écart phrase contre effet a été signalé |
| P2 Avalanche | Team1, puis Core via Team1 | Mini Grant et démo sur Fuji et C-Chain | Dossier déposé avant J30 ; réponse reçue avant J90 ; une démo présentée à un membre d'Ava Labs ou de Team1 |
| P3 Contrôle avant retrait | Une fintech ou un CASP français (réseau ESSEC) | Rejouer 20 retraits anonymisés ou publics dans le moteur ; mode API | Un entretien tenu ; une lettre d'intention non engageante ou un refus motivé écrit (le refus est une donnée) |

## Ce qu'on peut affirmer au jury
1. Un Snap MetaMask d'analyse de transaction s'installe sans allowlist tant qu'il n'appelle pas de serveur (source MetaMask).
2. Sur MetaMask stable, un Snap n'affiche qu'un avertissement ; le blocage modal est réservé à Flask. C'est pourquoi l'extension reste notre canal principal.
3. La revue Chrome prend de quelques jours à quelques semaines, plus pour les extensions à permissions larges ; nous l'avons intégré au calendrier.
4. MiCA exclut les fournisseurs de portefeuilles non dépositaires ; Hold up ne détient ni fonds ni clés et n'exécute aucun transfert.
5. La phrase de l'utilisateur relève du RGPD ; nous la minimisons et l'encadrons par contrat de sous-traitance et clauses types.
6. Core utilise Blockaid depuis juin 2024 ; nous sommes complémentaires (intention contre effet), pas substituables.
7. ERC-7715 (brouillon) formalise la même idée que nous : ne demander que les permissions nécessaires, avec expiration.
8. Le financement amorçable tout de suite est petit et identifié : Team1 Mini Grant (10 000 $ max), puis Bourse French Tech (30 000 € max, après immatriculation).

## À ne pas affirmer
1. "Nous sommes en discussion avec Core, MetaMask, Fairside ou une banque." Aucun contact n'a eu lieu.
2. "Nous sommes hors de toute réglementation." Le conseil (art. 3(1)(24)), l'intermédiation d'assurance et toute commission sur swaps restent à qualifier.
3. "Retro9000 ou Codebase va nous financer." Retro9000 vise L1 et activité on-chain ; aucune cohorte Codebase 2026 trouvée.
4. "Notre Snap bloque les transactions dangereuses dans MetaMask." Faux sur la version stable.
5. "L'ESSEC a une chaire blockchain qui nous soutient." Introuvable.
6. Un délai précis de revue MetaMask ou un tarif Blockaid : non publiés.
7. "Les adresses de portefeuille ne sont pas des données personnelles." Non vérifié ; traiter comme personnelles.
8. Un montant de Bourse French Tech supérieur à 30 000 € pour notre cas : la variante deeptech (45 000 ou 90 000 € selon les pages) est contradictoire et peu probable pour nous.

## Limites de cette recherche
- Page Bourse French Tech de Bpifrance inaccessible (403) ; montants pris dans des pages Bpifrance vues en recherche et chez des tiers.
- Page de candidature ESSEC Ventures derrière une connexion Google ; non lue.
- Aucune page officielle AMF, ACPR ou ESMA sur le statut des outils d'alerte de sécurité trouvée.
- Délais de revue MetaMask, programmes partenaires de Rabby, Phantom, Trust, Blockaid : introuvables.
- Actualité 2026 de Plug and Play Paris, Station F Fighters, Gitcoin, Codebase : introuvable.

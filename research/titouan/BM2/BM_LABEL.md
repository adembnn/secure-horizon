# BM_LABEL. Faire financer Hold up par les plateformes qui demandent juste

Date : 11 octobre 2026. Auteur : agent de recherche (Claude), pour Titouan.
Lu avant d'écrire : `BM_SYNTHESE.md`, `BM_MODELE.md`, `BM_PARTENAIRES.md`, `BM_DIAPO.md`, et les passages utiles de `BM_MARCHE.md` et `BM_VISION.md`.

## Légende

- **[V]** : lu à l'URL pendant cette session.
- **[NV]** : vu en résultat de recherche, chez un revendeur, un blog ou un fichier du dépôt, sans relecture de la source primaire.
- **[M]** : notre mesure, faite ce jour, méthode donnée.
- **[C]** : calcul, formule donnée.
- **[H]** : hypothèse. Aucun chiffre public ne la soutient.

Règle tenue : aucun prix inventé. Rien ici n'est un avis juridique.

---

## 0. L'idée, et le verdict en cinq lignes

**L'idée de Titouan.** Le particulier ne paie jamais. Plus tard, les plateformes qui ne demandent que ce qu'il faut (montant exact, expiration, droits bornés) financent Hold up, parce que Hold up les met en valeur auprès des utilisateurs : « cette plateforme ne te demande que ce dont elle a besoin ».

**Verdict.**
1. L'intuition est bonne : elle transforme Hold up de bâton (on retient) en carotte (on montre ceux qui font bien). C'est un vrai levier de distribution et de crédibilité.
2. Mais **vendre la mise en valeur** (badge payant, place payante) est le chemin le plus risqué : conflit d'intérêts de type « émetteur payeur », règles publicitaires, et en France le mot « certification » est réservé à des organismes accrédités.
3. La forme défendable : **la mesure est gratuite, publique, la même pour tous, et ne s'achète pas.** Les plateformes paient des **outils** (rapport détaillé, suivi, SDK pour corriger), jamais la note ni la place.
4. Ce modèle n'est **pas** un moteur de revenu avant une audience réelle. Il vient **après** l'API « verdict avant retrait » et la licence SDK. Il peut être **testé dès maintenant** à coût presque nul, sous forme de tableau public, parce qu'on sait déjà mesurer la chaîne (47,6 % sur Ethereum, 34,2 % sur C-Chain, CHIFFRES B1 [M]).
5. Au jury : ne jamais dire « on fait de la pub pour eux ». Dire « on publie ce que chaque plateforme demande vraiment, et ça ne s'achète pas ».

---

## 1. Ce que les rapports BM2 ont déjà écarté, et pourquoi c'est lié

| Piste déjà écartée | Raison donnée | Source dans le dépôt | Lien avec le label |
|---|---|---|---|
| Apport d'affaires, orienter vers des partenaires contre commission | Taux introuvable ; intermédiation d'assurance possiblement soumise à ORIAS | BM_MODELE §2, BM_PARTENAIRES §2.3 et §4.1 | Un label payant affiché **pendant** une transaction ressemble à de l'orientation commerciale. Même risque, sous un autre nom |
| Commission sur swaps (modèle Kerberus, Revoke) | Rouvre la question MiCA (conseil, art. 3(1)(24)) ; Hold up n'a pas ce flux | BM_PARTENAIRES §4.1 ; BM_MARCHE (Kerberus [V]) | Le label ne touche à aucune transaction. C'est son avantage, **à condition** de ne pas le transformer en « va plutôt chez X » |
| Publicité faite par nous | Décision de Titouan (mémoire) ; argument de confiance | BM_MODELE §2, BM_SYNTHESE §4 | Le « placement payant » (variante c) est exactement de la publicité. Il contredit une décision déjà prise |

Conséquence : seules les variantes où **l'argent n'achète ni la note, ni la place, ni l'orientation** restent compatibles avec ces décisions.

---

## 2. Les quatre variantes, de la plus sûre à la plus risquée

Ordre retenu après analyse (il diffère légèrement de l'ordre proposé) : **(b) tableau public gratuit + outils payants**, puis **(d) SDK**, puis **(a) label payant**, puis **(c) placement payant**.

### 2.1 Variante (b) : tableau public gratuit + analytique payante. La plus sûre

**Ce que c'est.** Un tableau public « droits demandés par plateforme » : pour chaque DEX, place de marché NFT ou protocole DeFi, la part de demandes à montant exact, avec expiration, via Permit2, illimitées, etc. Gratuit, pour tous, mesuré automatiquement. Les plateformes paient des **outils** : rapport détaillé par contrat et par écran, alerte si leur comportement change, comparaison avec leurs pairs, données exportables.

**Pourquoi c'est la plus sûre.**
- Elle prolonge ce qu'on sait déjà faire et publier : une mesure en chaîne rejouable (CHIFFRES B1 [M]). BM_MODELE §6 nomme la « mesure publique et rejouable » comme le différenciateur le plus crédible.
- La note n'est pas à vendre. Le revenu vient d'un service, comme GoPlus vend son API (199 à 3 499 $/mois [V], BM_MODELE §4).
- Précédent proche : L2BEAT publie des critères « Stages » publics, mis à jour plusieurs fois depuis juin 2023 [V] https://l2beat.com/stages.

**Deux pièges, à dire honnêtement.**
1. **« Comment leurs utilisateurs réagissent » et « taux d'abandon » exigent des données d'usage.** Or Hold up promet : local, sans compte, sans revente de données (BM_SYNTHESE §4). Vendre des réactions d'utilisateurs, même agrégées, toucherait cette promesse et le RGPD (BM_PARTENAIRES §4.2). Version compatible : (i) d'abord **seulement des données publiques de la chaîne** (droits accordés, droits jamais révoqués, montant encore exposé) ; (ii) plus tard, des statistiques d'usage **opt-in, agrégées, avec un seuil minimal de personnes par case** [H], annoncées dans la politique de confidentialité et la déclaration Limited Use de Chrome (BM_PARTENAIRES §1.1).
2. **Une plateforme qui paie un rapport peut croire qu'elle achète une meilleure note.** D'où les règles de la section 5.

### 2.2 Variante (d) : SDK pour demander juste dès l'origine. Sûre, mais peu de valeur seule

**Ce que c'est.** Une bibliothèque côté plateforme qui fabrique des demandes bornées : Permit2 avec montant exact et expiration, ou permission ERC-7715 avec plafond et durée.

**Faits.**
- Permit2 porte déjà un montant (`amount`, « the maximum amount allowed to spend ») et une expiration (`expiration`) par droit [V] https://developers.uniswap.org/llms.mdx/docs/protocols/permit2/concepts/allowance-transfer.
- ERC-7715 est en « Draft » et dit : « DApps should only request the permissions they need, with a reasonable expiration time » [V] https://eips.ethereum.org/EIPS/eip-7715.

**Lecture sans complaisance.**
- C'est la variante la plus alignée avec la promesse : on vend **le moyen de passer le test**, pas le résultat. Comme un laboratoire MASA qui teste une appli Android, payé par le développeur, avant un badge dans Google Play (section 3.1).
- Mais Permit2 est libre et gratuit. Un SDK qui ne fait qu'emballer Permit2 vaut peu. Sa valeur viendrait de la **traduction intention vers droit** (phrase de l'utilisateur vers plafond), qui est déjà le pari M3 de BM_MODELE (PROSPECTIF).
- Conflit à gérer : vendre le SDK **et** noter les plateformes. Réponse : la note mesure le comportement réel en chaîne, pas l'usage de notre SDK. Une plateforme qui borne ses demandes sans nous obtient la même note.
- C'est en fait une **déclinaison de M2 (licence SDK)**, pas un modèle à part.

### 2.3 Variante (a) : label payant. Risquée telle quelle, acceptable si on la retourne

**La version proposée** (la plateforme paie pour obtenir un badge, audit automatique) a trois problèmes.

1. **Le mot « certification » est réglementé en France.** Le code de la consommation définit la certification comme l'attestation, par un organisme distinct du prestataire, qu'un service respecte un référentiel (art. L433-3), et réserve la certification de produits ou de services aux organismes accrédités : « Peuvent seuls procéder à la certification de produits ou de services » (art. L433-4) [V] https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032222811/. L'accréditation française est celle du Cofrac [NV] https://tools.cofrac.fr/documentation/CERT-INF-04. Incertain : une mesure automatique du comportement d'un contrat entre-t-elle dans ce régime ? **Question pour un juriste.** En attendant : ne jamais écrire « certifié », « certification ».
2. **Afficher un label sans l'autorisation nécessaire, ou laisser croire à un agrément, est une pratique déloyale « en toutes circonstances »** (directive 2005/29/CE, annexe I, points 2 et 4) [V] https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:02005L0029-20220528. Ce risque pèse surtout sur la plateforme qui affiche le badge, mais il rejaillit sur l'émetteur si les conditions du badge sont floues.
3. **Le conflit « émetteur payeur ».** Si la plateforme notée paie, l'émetteur a intérêt à garder le client. C'est la critique adressée à DeFiSafety (section 3.2) et le cœur des affaires S&P et Moody's (section 3.3).

**La version retournée, défendable.** Le badge est **gratuit et automatique** pour toute plateforme qui remplit des critères publics. Il s'affiche pour celles qui ne paient rien. Il disparaît pour celles qui paient si elles cessent de remplir les critères. Ce qui est payant : le kit d'intégration du badge sur leur site, le suivi, le rapport. C'est le modèle MetaMask pour ses badges « Verified » : critères automatiques, pas de procédure payante décrite, et « MetaMask does not manually apply the verified token badge on an individual basis » [V] https://support.metamask.io/configure/wallet/security-alerts/.

Nom suggéré : **« Demande juste »** ou **« Mesuré par Hold up »**, avec la date de mesure. Pas « certifié », pas « sûr », pas « vérifié ». Cohérent avec les phrases à ne pas dire de `PRODUCT.md` (jamais de vert, jamais rassurer à tort).

### 2.4 Variante (c) : placement payant. À écarter

**Ce que c'est.** Une plateforme paie pour être mise en avant dans l'extension ou le tableau.

**Pourquoi c'est intenable pour un outil de sécurité.**
- **Neutralité.** La neutralité est l'un des deux avantages « plus durs à copier » de Hold up (BM_SYNTHESE §6). Une place payante la détruit le jour où elle est découverte, et un concurrent aura intérêt à la faire découvrir.
- **Effet sur la sécurité.** Recommander une plateforme **au moment de signer**, c'est orienter un flux de fonds. Cela ressemble à de l'apport d'affaires (déjà écarté) et rapproche de la notion de recommandation au sens de MiCA, art. 3(1)(24) (BM_PARTENAIRES §4.1, [V]). Incertain, à faire qualifier.
- **Règles publicitaires.** Légal à condition d'être étiqueté (section 4), mais un outil de sécurité qui affiche « Publicité » à côté d'un avertissement perd sa crédibilité.
- **Décision antérieure.** « Pas de publicité faite par nous » (BM_MODELE §2).

**Verdict : non.** Ni enchères, ni « mis en avant », ni « partenaire recommandé » dans l'extension.

### 2.5 Tableau de synthèse

| Variante | Qui paie quoi | Conflit d'intérêts | Risque juridique | Revenu possible | Verdict |
|---|---|---|---|---|---|
| (b) Tableau public + outils | Plateforme : rapport, suivi, export | Faible si règles §5 | Faible ; transparence du classement (L111-7) | Faible à moyen | **Retenue, à tester d'abord** |
| (d) SDK demandes bornées | Plateforme : licence | Moyen (on vend le moyen de réussir la note) | Faible | Moyen, mais c'est M2 | **Retenue, fondue dans M2** |
| (a) Label payant | Plateforme : le badge | Élevé | « Certification » réglementée ; labels (UCPD annexe I pts 2 et 4) | Moyen | **Seulement retournée : badge gratuit, outils payants** |
| (c) Placement payant | Plateforme : la place | Maximal | Pub à étiqueter ; proche de l'orientation commerciale | Variable | **Écartée** |

---

## 3. Précédents sourcés

### 3.1 Badges de sécurité et de confiance

| Précédent | Qui paie | Ce que ça montre | Source | Statut |
|---|---|---|---|---|
| **MetaMask « Verified »** | Personne, selon la page | Critères automatiques (jetons : présence sur des plateformes reconnues, activité de marché). Données de Blockaid et d'autres. Avertit que ce n'est ni « endorsement, approval, or a guarantee of safety ». Aucune procédure payante décrite | https://support.metamask.io/configure/wallet/security-alerts/ | [V] |
| **Blockaid (côté dapp)** | Les portefeuilles paient Blockaid, pas les dapps | Le seul recours public trouvé est le signalement de faux positif par l'utilisateur, revu par l'équipe Blockaid. Aucune liste « trusted » payante trouvée | https://support.metamask.io/configure/wallet/how-to-turn-on-security-alerts | [NV] |
| **Kerberus** | Portefeuilles : gratuit ; revenu par partage sur les échanges DEX | « Deploy enterprise security at zero cost », « Revenue sharing on DEX trades ». Liste « trusted » : introuvable | https://www.kerberus.com/api/ | [V] |
| **Google Play, badge « Independent security review » (MASA)** | Le développeur paie le laboratoire | Le développeur « work[s] directly with the lab to finalize funding arrangements ». 2 à 3 semaines jusqu'au badge. Prix non publié. Accueil de nouveaux labos en pause (migration vers la Linux Foundation) [NV] | https://appdefensealliance.dev/masa/masa-al2 ; https://appdefensealliance.dev/masa | [V] / [NV] |
| **Chrome, indicateur EV (certificats à validation étendue, payants)** | Le site payait un certificat plus cher | Chrome 77 (2019) retire l'indicateur de la barre d'adresse : « the EV UI does not protect users as intended ». Les gens ne changeaient pas de comportement quand il disparaissait | https://www.theregister.com/2019/08/12/google_chrome_extended_validation_certificates/ | [V] |
| **Let's Encrypt** | Personne pour le certificat ; ISRG, à but non lucratif, avec dons et sponsors | Certificats « at zero cost ». Le signal de base est devenu gratuit et universel | https://letsencrypt.org/about/ | [V] |
| **McAfee SECURE, devenu TrustedSite** | Le marchand | Badge affiché seulement après un scan quotidien réussi. Repris par TrustedSite, rebaptisé en 2021. Prix 2012 : environ 700 $/an pour un petit marchand. Aujourd'hui de gratuit à 29 $/mois et plus | https://www.trustsignals.com/blog/trustedsite-trust-badges-move-on-from-mcafee-secure ; https://apps.shift4shop.com/McAfee-SECURE.html | [NV] |
| **Norton Secured Seal (DigiCert)** | Le site, en lot avec un certificat payant | Vendu avec DigiCert Secure Site ; revendeur : 495 $ pour un an. Retrait du sceau signalé sur un forum | https://www.thesslstore.com/symantec/norton-secured-seal.aspx ; https://tuthost.ua/en/certificates/digicert-secure-site-ssl | [NV] |
| **Trusted Shops** | Le marchand, selon le volume | Fourchettes contradictoires : environ 20 à 300 €/mois selon un comparateur, à partir de 99 €/mois chez un intégrateur, à partir de 119 €/mois sur Shopify | https://apps.shopify.com/trusted-shops-easy-integration ; https://services.wizishop.com/service/trusted-shops | [NV] |
| **Trustpilot** | Les entreprises paient des outils ; les avis restent publics | Le modèle « public gratuit, outils payants ». Critiques sur les faux avis (enquête Which?) ; Trustpilot dit avoir retiré plus de 2 millions de faux avis en 2020 | https://www.retail-systems.com/rs/Facebook_Google_And_Trustpilot_Failing_To_Filter_Out_Fake_Reviews.php | [NV] |
| **Norton Safe Web** | Non vérifié dans cette session | À ne pas citer | Introuvable | Introuvable |

**Lecture.**
- Les badges qui comptent pour la sécurité (MetaMask, Google Play) sont **décidés par le canal** selon des critères, pas achetés auprès du noté. Dans le cas MASA, le noté paie un **test**, pas un **résultat**, et un tiers (Google) affiche le badge.
- Les sceaux payants affichés par le marchand lui-même (McAfee, Norton, Trusted Shops) vivent d'un argument de conversion qui vient surtout des vendeurs. La seule mesure forte trouvée va dans l'autre sens : l'indicateur EV n'a pas changé le comportement des gens.

### 3.2 Sécurité Web3 : notes, audits et indépendance

| Précédent | Financement | Ce qui s'est passé | Source | Statut |
|---|---|---|---|---|
| **DeFiSafety** | Notes publiques gratuites ; certificats payants vendus aux protocoles notés | « We do not accept payment to create or modify in any way the ratings » (page À propos). Proposition à Aave du 6 février 2023 : **15 000 $ par an** pour un certificat et un badge, redemandé le 12 mars 2024. Un participant objecte dès le 7 février : payer une certification crée une incitation à gonfler les notes au-dessus du seuil de 70 %. Réponse : tous les rapports sont publics, la transparence décourage la manipulation, le revenu fait vivre l'équipe | https://defisafety.com/about/ ; https://governance.aave.com/t/defisafety-quality-certificates/11593 | [V] |
| **L2BEAT** | « Financed in the open by the community ». Liste publique des financeurs par paliers (plus de 500 000 $, 100 000 à 500 000 $, moins de 100 000 $). Un « Partnership Fund » où « projects contribute financially to L2BEAT's operations », au palier le plus haut | La page ne dit **pas** si les partenaires sont traités autrement dans les « Stages ». Aucune politique de conflit d'intérêts trouvée. Critères des Stages publics et mis à jour ; aucune procédure d'appel décrite | https://l2beat.com/donate ; https://l2beat.com/stages | [V] |
| **CertiK Skynet** | Audits payants ; offres de visibilité | 26 juin 2024 : deux développeurs se plaignent que CertiK ajoute des projets à Skynet sans leur accord et favorise ceux qui ont payé ses audits. Aucune réponse de CertiK dans l'article | https://www.gncrypto.news/news/crypto-developers-slam-certiks-agressive-marketing-approach/ | [V] (article lu ; les faits allégués restent des allégations) |
| CertiK, offre « Skynet Boost » | Le projet | Un développeur raconte un lot à 10 500 $ incluant score public, mise en avant dans les classements et bannière | https://habr.com/ru/articles/976262/ | [NV], témoignage unique |
| Prix d'audit de contrats | Le projet | Fourchettes publiées par des vendeurs d'audit : environ 3 000 à 250 000 $ selon la taille ; CertiK annoncé de 10 000 à plus de 150 000 $ par un comparateur | https://sherlock.xyz/post/smart-contract-audit-cost ; https://www.spark.money/tools/smart-contract-audit-firm-comparison | [NV], sources intéressées |

**Lecture.** L2BEAT et DeFiSafety montrent qu'on peut faire vivre une mesure publique avec l'argent des notés, **mais** les deux restent exposés à la même question, et aucun des deux n'a publié une séparation formelle entre mesure et vente. Hold up peut faire mieux sur ce point précis (section 5). CertiK montre ce qui coûte la confiance : l'impression que payer améliore le classement.

### 3.3 Conflits d'intérêts : ce que ça a coûté

| Affaire | Coût | Mécanisme | Source | Statut |
|---|---|---|---|---|
| **S&P**, 3 février 2015 | 1,375 Md$ (687,5 M$ au Département de la Justice, autant à 19 États et D.C.) ; 125 M$ de plus avec CalPERS. Pas d'aveu d'illégalité | Les banques émettrices payaient les notes. Le gouvernement a dit que S&P favorisait les émetteurs plutôt que les investisseurs | https://www.abajournal.com/news/article/ratings_agency_to_pay_nearly_1.4b_to_resolve_allegations_it_inflated_rating ; https://www.justice.gov/opa/speech/remarks-attorney-general-eric-holder-press-conference-announcing-settlement-sp | [NV] (page DOJ vide à la lecture) |
| **Moody's**, janvier 2017 | Environ 864 M$ (437,5 M$ au DOJ, 426,3 M$ aux États) | Moody's reconnaît avoir dévié de ses méthodes sans le dire ; conflits d'intérêts signalés à partir de 2001 (valeur des clients récurrents) | https://www.justice.gov/usao-nj/pr/justice-department-and-state-partners-secure-864-million-settlement-moody-s-arising ; https://nationalmortgageprofessional.com/news/61736/moodypays-864m-settle-rmbs-ratings-charges | [NV] (page DOJ vide à la lecture) |
| **FTC et moteurs de recherche**, juin 2013 | Pas d'amende ; rappel à l'ordre de Google, Bing, Yahoo et 17 sites verticaux | Publicités trop peu distinguées des résultats. Enquête de 2012 citée : près de la moitié des internautes ne reconnaissaient pas les annonces du haut | https://www.crowell.com/en/insights/client-alerts/ftc-updates-guidance-to-search-engine-industry-on-the-need-to-distinguish-between-advertisements-and-search-results | [NV] |

**La leçon pour Hold up.** Le danger n'est pas qu'un noté paie. C'est (1) que la méthode puisse bouger sans le dire, (2) que l'émetteur dépende de quelques gros clients, (3) que le public ne puisse pas vérifier. Les trois ont une parade technique dans notre cas, parce que la mesure se refait à partir de la chaîne.

---

## 4. Règles applicables en France et dans l'UE à un classement ou une recommandation payante

Sources officielles seulement. **Un avis juridique écrit est nécessaire** avant toute offre payante.

| Règle | Ce qu'elle dit | Application à Hold up | Source | Statut |
|---|---|---|---|---|
| **Directive 2005/29/CE (pratiques commerciales déloyales), annexe I, point 11 bis** | Interdit de fournir des résultats de recherche sans informer clairement de toute publicité payante ou paiement pour un meilleur classement | Ne s'applique qu'aux résultats de recherche à une requête. Le tableau public avec filtre pourrait en relever. Ne pas vendre de rang règle la question | https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:02005L0029-20220528 | [V] |
| **Même directive, art. 7 § 4 bis** | Informations substantielles : « les principaux paramètres qui déterminent le classement » et leur ordre d'importance | Publier les critères et leur poids. Déjà prévu par la section 5 | même URL | [V] |
| **Même directive, annexe I, points 2 et 4** | Afficher un label de qualité sans l'autorisation nécessaire ; prétendre être agréé ou approuvé alors que ce n'est pas le cas | Règles d'usage écrites pour le badge ; badge retiré automatiquement si critère perdu ; jamais « approuvé par » | même URL | [V] |
| **Orientations de la Commission sur la directive (2021/C 526/01), § 4.2.3** | La directive n'interdit pas le classement payant, elle impose qu'il soit « mis clairement et visiblement en évidence en tant que tel ». Exemple cité : Booking.com et Expedia passent de « sponsorisé » à « pub » ou « publicité » | Si un jour un élément payant apparaît : le mot « Publicité », pas « Partenaire » | https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:52021XC1229(05) | [V] |
| **Loi pour la confiance dans l'économie numérique (LCEN), art. 20** | « Toute publicité [...] doit pouvoir être clairement identifiée comme telle », ainsi que la personne pour le compte de laquelle elle est faite. Version en vigueur depuis 2008 | Vaut pour l'extension et le site, quelle que soit la taille de Hold up | https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000018048180 | [V] |
| **Code de la consommation, art. L111-7** | Un opérateur de plateforme en ligne (classement de services de tiers par algorithme, rémunéré ou non) doit une information loyale sur les critères de classement, et signaler toute relation contractuelle ou rémunération qui influence le classement. Décret n° 2017-1434 | Un tableau qui classe des plateformes peut entrer dans cette définition française. Conséquence : rubrique « comment nous classons », et mention si un client payant apparaît, même si le paiement n'influence pas le rang | Synthèses : https://www.inc-conso.fr/content/informations-par-les-plateformes-en-ligne-ce-qui-change-au-1er-janvier-2018 | [NV] (texte Légifrance non relu ; version en vigueur à vérifier) |
| **Code de la consommation, art. L433-3 et L433-4** | Certification d'un service par un organisme distinct ; seuls les organismes accrédités peuvent certifier | Ne pas utiliser « certification ». Savoir si une mesure automatique en relève : **incertain** | https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032222811/ | [V] |
| **DSA, règlement (UE) 2022/2065, art. 26 et 27** | Plateformes en ligne : chaque publicité doit montrer en temps réel qu'elle est une publicité, pour qui, et qui a payé (art. 26) ; expliquer les principaux paramètres des systèmes de recommandation (art. 27) | Probablement **non applicable** : une « plateforme en ligne » est un hébergeur qui « stocke et diffuse au public des informations » à la demande d'un utilisateur (art. 3 i)), ce que Hold up ne fait pas ; et l'art. 19 exclut les micro et petites entreprises de cette section. Mais l'esprit de l'art. 26 est la bonne pratique à suivre | https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32022R2065 | [V] |

**Ce qui reste incertain, à poser au juriste.**
1. Le tableau public fait-il de Hold up un « opérateur de plateforme en ligne » au sens de L111-7 ?
2. Un badge fondé sur une mesure automatique est-il une « certification » au sens de L433-3 ?
3. Une phrase affichée pendant la signature, du type « cette plateforme ne demande que le nécessaire », est-elle une recommandation au sens de MiCA art. 3(1)(24), ou une simple information de sécurité ?
4. Qui porte la responsabilité si un badge « Demande juste » est affiché et que la plateforme est ensuite piratée ? (Réponse produit : le badge décrit les droits demandés, jamais la sûreté du contrat.)

---

## 5. Mécanisme anti-conflit

Règles à publier **avant** le premier euro. Chaque règle répond à une leçon de la section 3.

| # | Règle | Répond à |
|---|---|---|
| 1 | **Critères publics et versionnés** : grille datée, numéro de version, journal des changements, annonce d'un changement au moins 30 jours avant [H sur le délai] | Moody's : méthode modifiée sans le dire |
| 2 | **Mesure automatique et rejouable** : à partir des données de la chaîne, script publié, jeu de blocs et sha256 publiés, comme pour B1 | Le public ne peut pas vérifier |
| 3 | **Même barème pour tous** : aucune donnée de paiement dans le calcul. Le code de mesure n'a pas accès à la liste des clients | DeFiSafety : incitation à gonfler |
| 4 | **Pas d'enchères, pas de place payante, pas de « partenaire recommandé »** | CertiK, FTC 2013 |
| 5 | **Toutes les plateformes mesurées, payantes ou non**. Une note basse d'un client reste publiée | Biais de sélection |
| 6 | **Statut de paiement affiché** à côté de la note (« client de Hold up pour : rapport ») | L111-7, LCEN art. 20, transparence |
| 7 | **Droit de réponse** : la plateforme peut publier une réponse à côté de sa note et demander une nouvelle mesure. Délai de nouvelle mesure identique pour tous, gratuit | L2BEAT : aucune procédure d'appel décrite |
| 8 | **Séparation entre mesure et vente** : la personne qui vend ne touche pas aux critères. Tant que l'équipe est de deux, la règle 2 (rejouable par n'importe qui) remplace la séparation de personnes | Agences de notation |
| 9 | **Plafond de dépendance** : aucun client au-delà d'une part fixée du revenu, publiée chaque année [H, par exemple 20 %] | Dépendance aux gros clients |
| 10 | **Liste publique des financeurs**, par paliers, comme L2BEAT | L2BEAT le fait déjà [V] |
| 11 | **Le badge dit ce qui est mesuré, et rien d'autre** : « demandes à montant exact : 96 % sur 30 jours ». Jamais « sûr », « vérifié », « certifié » | UCPD annexe I pts 2 et 4 ; L433-4 ; EV |

---

## 6. Économie

### 6.1 Prix plausibles, par comparaison

Aucun prix comparable exact n'existe pour « rapport de droits demandés ». Repères :

| Repère | Prix | Statut |
|---|---|---|
| DeFiSafety, certificat annuel proposé à Aave | 15 000 $/an (2023, redemandé en 2024) | [V] |
| GoPlus Security API | 199 à 3 499 $/mois | [V] (BM_MODELE §4) |
| Trusted Shops | environ 20 à plus de 119 €/mois selon les sources | [NV] |
| TrustedSite (ex-McAfee SECURE) | gratuit à 29 $/mois et plus ; 700 $/an environ en 2012 | [NV] |
| DigiCert Secure Site avec sceau | 495 $ pour un an chez un revendeur | [NV] |
| Audit de contrat | 3 000 à plus de 250 000 $ par audit, sources intéressées | [NV] |
| Laboratoire MASA (Google Play) | non publié | [V] |

**Fourchette retenue, [H] :** rapport et suivi pour une plateforme, **de 2 000 à 15 000 $ par an**. Bas : niveau des sceaux marchands. Haut : niveau DeFiSafety, l'acheteur le plus proche (protocole DeFi, budget sécurité). Le badge lui-même : **0 $**.

### 6.2 Combien de plateformes cibles

Notre mesure, faite ce jour sur l'API publique de DefiLlama (https://api.llama.fi/protocols), [M] :

| Périmètre | Ethereum | Avalanche |
|---|---|---|
| Protocoles listés présents sur la chaîne, toutes catégories | 1 878 | 561 |
| dont catégorie « Dexs » | 195 | 101 |
| Hors exchanges centralisés, avec au moins 1 M$ déposés sur cette chaîne | 459 | 56 |
| Hors exchanges centralisés, avec au moins 10 M$ déposés sur cette chaîne | 259 | 16 |

Limites : DefiLlama ne liste pas toutes les places de marché NFT ni tous les sites ; le montant déposé n'est pas le nombre d'utilisateurs ; filtrage par catégorie fait par nous.

**Calcul [C] sur [H].** Cible réaliste à deux ans : les plateformes avec au moins 10 M$ déposés, Ethereum et Avalanche, soit environ 275 (259 plus 16, avec des doublons possibles). Si 5 % paient 10 000 $ par an : 14 x 10 000 = **environ 140 000 $ par an**. Si 2 % paient 5 000 $ : 6 x 5 000 = **environ 30 000 $ par an**.
Comparaison : structure légère environ 35 k$/an, structure de 3 personnes environ 290 k$/an [H] (BM_SYNTHESE §5). **Le label peut couvrir une structure légère dans le cas favorable. Il ne fait pas vivre une équipe.**

Sur Avalanche seule (16 plateformes au-dessus de 10 M$), le marché payant est quasi nul. Avalanche est un bon **terrain de démonstration**, pas un marché.

### 6.3 Cycle de vente

- Aucune donnée publique sur le cycle d'achat d'un rapport de ce type. [H] : 1 à 3 mois pour un protocole DeFi qui a un budget sécurité ; plus long si décision par vote de gouvernance (les propositions DeFiSafety passaient par les forums de gouvernance d'Aave, PoolTogether, Curve, Lido [V/NV]).
- Avantage : pas de DORA, pas de prestataire TIC, contrairement à l'API pour une banque (BM_PARTENAIRES §4.3).

### 6.4 Ce qu'il faut pour que ça marche : l'audience

Une plateforme paie si elle y gagne des utilisateurs ou évite d'en perdre. Il faut donc une audience que la plateforme **voit**.

- **Aucun seuil public** n'a été trouvé. Les repères vont dans le sens de la prudence : Revoke.cash dit que son revenu « has been very low in 2025 » malgré son audience [V] https://revoke.cash/blog/2025/year-in-review ; Pocket Universe a été racheté à « sept chiffres » (BM_MARCHE [V]).
- **Seuils proposés [H], à valider en entretien :**
  - Moins de 10 000 utilisateurs actifs par semaine : le badge n'apporte rien de visible à une plateforme. Ne rien vendre. Le tableau sert de vitrine et de preuve de méthode.
  - 10 000 à 100 000 : vendre le **rapport** (la plateforme apprend quelque chose sur ses propres demandes, indépendamment de notre audience).
  - Au-delà de 100 000, ou un badge repris par un portefeuille ou un agrégateur : la **visibilité** commence à valoir quelque chose.
- **Raccourci possible :** l'audience peut venir d'un tiers. Si un portefeuille (via la licence M2) ou un agrégateur reprend le signal « demande juste », c'est son audience qui compte. Le label devient alors un sous-produit du SDK.
- **Contre-argument à prendre au sérieux :** la mesure forte sur les indicateurs positifs (EV dans Chrome) dit que les gens les remarquent peu [V]. Un badge vert de plus ne déplace peut-être personne. C'est une raison de vendre **le rapport** (valeur pour la plateforme) plutôt que **la visibilité** (valeur incertaine).

---

## 7. Verdict

### 7.1 Où le label se place

| Modèle | Rang | Pourquoi |
|---|---|---|
| M1. API « verdict avant retrait » | 1, revenu | Le payeur rembourse déjà la fraude (BM_SYNTHESE §4) |
| M2. Licence SDK portefeuilles et plateformes | 2, pilote et distribution | Même code ; la variante (d) s'y intègre |
| **Label et tableau public (b + a retournée)** | **3, levier de crédibilité et d'acquisition ; revenu d'appoint** | Coût presque nul, renforce la « mesure publique » ; revenu plafonné par le nombre de plateformes (section 6.2) et conditionné à l'audience (6.4) |
| M3. Mandats agents | 4, pari | PROSPECTIF |
| (c) Placement payant | Écarté | Neutralité, publicité, décision antérieure |

Le label a une vertu que M1 et M2 n'ont pas : il **récompense** au lieu de seulement retenir. Il donne aux plateformes une raison de **changer leur comportement**, ce qui sert directement la promesse « cesser de donner plus que nécessaire ».

### 7.2 Quand le tester

| Étape | Quand | Contenu | Réussite si [H] | Sinon |
|---|---|---|---|---|
| L1 | Maintenant, 2 semaines | Tableau public sur les 20 premières plateformes d'Avalanche et d'Ethereum, à partir du code de mesure B1 : part de demandes exactes, illimitées, avec expiration, via Permit2. Critères v1 publiés | Mesure rejouée par une personne extérieure | Revoir la méthode avant de montrer |
| L2 | J30 à J60 | Envoyer à chaque plateforme mesurée sa fiche, avec droit de réponse. Aucune offre commerciale | Au moins 3 plateformes sur 20 répondent ; au moins 1 corrige une demande | Aucune réponse : le levier « carotte » ne marche pas sans audience |
| L3 | Après audience de 10 000 actifs par semaine | Proposer un rapport détaillé payant à 10 plateformes | Au moins 2 acceptent un prix dans la fourchette | Garder le tableau gratuit comme vitrine, ne pas insister |
| L4 | Avant toute facture | Avis juridique écrit sur les 4 questions de la section 4 | Avis reçu | Pas de vente |

### 7.3 La formulation à dire au jury

**À ne pas dire :** « Les plateformes nous paieront pour qu'on les mette en avant. » « On fera de la pub pour les bonnes plateformes. » « Label certifié Hold up. »

**Formulation proposée (environ 20 secondes) :**

> « Hold up mesure, pour chaque plateforme, ce qu'elle demande vraiment : un montant exact ou un droit illimité, une expiration ou pas. Cette mesure est publique, gratuite, la même pour tous, et elle ne s'achète pas. Les plateformes qui demandent juste y gagnent une preuve visible. Celles qui veulent comprendre et corriger leurs demandes paient des outils : rapport, suivi, SDK. On ne vend jamais une note, ni une place. »

**Si le jury demande « ce n'est pas un conflit d'intérêts ? » :**

> « C'est le risque de toutes les agences de notation, et c'est pour ça qu'on l'a réglé avant de vendre : critères publics et datés, mesure refaite à partir de la chaîne par n'importe qui, les clients notés comme les autres, et le statut de client affiché à côté de la note. »

**Si le jury demande « combien ça rapporte ? » :**

> « Peu au début, et on le dit. Il y a environ 275 plateformes avec plus de 10 millions déposés sur Ethereum et Avalanche, d'après DefiLlama. Même dans un bon cas, c'est un revenu d'appoint. Notre revenu principal vient de l'API avant retrait et de la licence. Le tableau, lui, nous rend crédibles et pousse les plateformes à demander moins. »

---

## Sources

Lues pendant cette session [V] :
- https://l2beat.com/donate
- https://l2beat.com/stages
- https://defisafety.com/about/
- https://governance.aave.com/t/defisafety-quality-certificates/11593
- https://support.metamask.io/configure/wallet/security-alerts/
- https://www.kerberus.com/api/
- https://appdefensealliance.dev/masa/masa-al2
- https://www.theregister.com/2019/08/12/google_chrome_extended_validation_certificates/
- https://letsencrypt.org/about/
- https://www.gncrypto.news/news/crypto-developers-slam-certiks-agressive-marketing-approach/
- https://revoke.cash/blog/2025/year-in-review
- https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:02005L0029-20220528
- https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:52021XC1229(05)
- https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32022R2065
- https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000018048180
- https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032222811/
- https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000039382265 (L433-8, exclusions)
- https://eips.ethereum.org/EIPS/eip-7715
- https://developers.uniswap.org/llms.mdx/docs/protocols/permit2/concepts/allowance-transfer
- https://api.llama.fi/protocols (données brutes, comptage [M])

Vues en résultat de recherche, non relues à la source primaire [NV] :
- https://appdefensealliance.dev/masa
- https://support.metamask.io/configure/wallet/how-to-turn-on-security-alerts
- https://habr.com/ru/articles/976262/
- https://www.trustsignals.com/blog/trustedsite-trust-badges-move-on-from-mcafee-secure
- https://apps.shift4shop.com/McAfee-SECURE.html
- https://www.thesslstore.com/symantec/norton-secured-seal.aspx
- https://tuthost.ua/en/certificates/digicert-secure-site-ssl
- https://apps.shopify.com/trusted-shops-easy-integration
- https://services.wizishop.com/service/trusted-shops
- https://www.retail-systems.com/rs/Facebook_Google_And_Trustpilot_Failing_To_Filter_Out_Fake_Reviews.php
- https://www.abajournal.com/news/article/ratings_agency_to_pay_nearly_1.4b_to_resolve_allegations_it_inflated_rating
- https://www.justice.gov/opa/speech/remarks-attorney-general-eric-holder-press-conference-announcing-settlement-sp (page vide à la lecture)
- https://www.justice.gov/usao-nj/pr/justice-department-and-state-partners-secure-864-million-settlement-moody-s-arising (page vide à la lecture)
- https://nationalmortgageprofessional.com/news/61736/moodypays-864m-settle-rmbs-ratings-charges
- https://www.crowell.com/en/insights/client-alerts/ftc-updates-guidance-to-search-engine-industry-on-the-need-to-distinguish-between-advertisements-and-search-results
- https://www.inc-conso.fr/content/informations-par-les-plateformes-en-ligne-ce-qui-change-au-1er-janvier-2018
- https://tools.cofrac.fr/documentation/CERT-INF-04
- https://sherlock.xyz/post/smart-contract-audit-cost
- https://www.spark.money/tools/smart-contract-audit-firm-comparison

## Ce qui n'a pas été trouvé

- Norton Safe Web : modèle et critères non vérifiés dans cette session. Ne pas citer.
- Une liste « trusted » payante chez Blockaid ou Kerberus : introuvable.
- La politique de conflit d'intérêts de L2BEAT, et l'effet du Partnership Fund sur les Stages : non publiés sur les pages lues.
- Le prix d'un laboratoire MASA : non publié.
- Une étude indépendante qui montre qu'un badge de sécurité fait gagner des utilisateurs à une plateforme crypto : introuvable. La seule mesure solide trouvée (EV dans Chrome) va dans le sens contraire.
- Le texte en vigueur de l'article L111-7 sur Légifrance : non relu.

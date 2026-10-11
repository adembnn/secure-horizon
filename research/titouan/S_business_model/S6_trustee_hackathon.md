# S6. Trustee au hackathon ESSEC 2025 : ce qui a été fait, montré, et pourquoi ça a gagné

Date : 11 oct. 2026. Agent de recherche S6 (Claude). Aucun secret, aucune inscription, aucune donnée privée. Complète S4 (non refait) : S4 = comparateur et positionnement ; S6 = reconstitution du produit démontré, de la pile réelle (code public lu), du jury et de la recette.

Étiquettes : **[P]** fait lu par moi dans une page ou un fichier publics cités. **[S]** fait repris d'un résumé de moteur de recherche (page non relue par moi : bloquée, 403 ou 999). **[V]** jugement, déduction ou hypothèse, pas un fait. "Non trouvé" = cherché sans résultat. Rien n'est inventé.

## 0. Ce que cette recherche apporte de neuf par rapport à S4

1. **Le dépôt GitHub public de Trustee existe** (dépôt Hackathon-From-LLM-To-Agentic-AI, 62 commits, premier commit le 5 avr. 2025). S4 ne l'avait pas lu. J'ai lu le code backend, la base de connaissances et le barème. Conséquence majeure : **la pile réelle diffère du README** (voir §3).
2. **Critères Devpost** : Pitch, Innovation, Technical Implementation, MVP [S]. C'est la seule grille 2025 qui ressort, et elle contredit la remarque S4 "grille 2025 inconnue".
3. **Dotation Devpost** : 900 € au premier de chaque track, 450 € au second, 3 gagnants par palier, total 4 050 € [S]. Chiffre ESSEC : 10 000 € de dotation globale, cash + accès à des conférences + formations + jetons Mistral [P].
4. **Dates** : la page Luma indique une soirée d'ouverture "BeforeHack" le 4 avril, puis 36 h les 5-6 avril [P] ; Devpost et agrégateur disent 5-6 avril [S] ; ESSEC et TSE disent 4-5 avril [P]. Les commits GitHub datent des 5 et 6 avril [P], donc le calendrier est : soirée le 4, hackathon le 5-6 [V].
5. **Une application iOS "Trustee - IA Anti Scam"** existe (App Store, éditeur Trustee, Inc. / Usetrustee) : v1.0 le 30 janv., 1.1 le 23 févr., 1.1.1 le 12 avr. (année non indiquée sur la page, probablement 2026 vu l'interview du 28 janv. 2026 [V]) [P].
6. Un projet tiers (scamlens) dérivé de Trustee publie une **évaluation chiffrée honnête** (n=65 et n=28) : un repère de ce qu'un jury sérieux pourrait attendre de nous (§6).

## 1. Sources : ce qui existe, ce qui n'existe pas

| Support | Trouvé ? | Contenu utile |
|---|---|---|
| TSE (article 8 avr. 2025, FR et EN, version alumni) | Oui [P] | Équipe, produit, rôle d'Anaïs, "premier prix général + gagnant du track Cybersécurité + meilleur projet des 3 tracks", pitch Google annoncé. Rien sur jury, montant, démo détaillée |
| ESSEC (article FR du 1er juil. 2025, version EN) | Oui [P] | Dates, 100 étudiants sélectionnés sur plus de 200 candidatures, 40 établissements, 35 organisateurs, 10 000 € de dotations, soirée d'ouverture chez Ledger. **Ni gagnants, ni jury, ni tracks nommés** |
| Utopia, Kryptosphère (sites, posts) | Non trouvé | Aucun palmarès officiel retrouvé. Un post Kryptosphère récupéré concerne Hackin'Dau (autre événement, 2023), pas ESSEC |
| METALAB | Cité dans ESSEC (soutien France 2030, citation du directeur) [P] ; aucune page de résultats trouvée |
| Devpost (from-llm-to-agentic-ai.devpost.com) | Page existante mais **403 pour moi** : galerie, règles et jury non lus. Critères et prix repris d'un résumé de recherche [S] |
| Luma (luma.com/shun5uky) | Oui [P] | Format, sélection, hôtes, sponsors. Pas de jury, pas de critères |
| allhackathons | Oui [P] | 5-6 avr., 4 050 €, "track de votre choix". Pas de jury |
| GitHub, dépôt du projet | Oui [P] | Code, KB, barème, historique (§2-3) |
| GitHub Pages (page projet) | Oui [P] | Texte marketing identique au README. Ni capture ni vidéo de démo |
| YouTube | **Une seule vidéo trouvée**, liée par le README : "INSTALLATION VIDEO - HACKATHON 2025 ESSEC" (id 6heiHBouHkk). Titre lu [P] ; durée, chaîne et contenu non lus. Aucune vidéo de pitch ni de démo jury trouvée |
| LinkedIn | Un repost du post d'Anaïs Boughanem trouvé via la page de Mohand Boughanem (LinkedIn bloque : 999). Contenu repris d'un résumé [S] : analyse d'annonces et de vendeurs eBay en temps réel (texte, prix, images), signaux suspects, Trust Score, red flags, réponses recommandées ; remerciements aux partenaires dont l'API Mistral, NVIDIA NeMo et AWS ; "3 tracks, nous avons choisi la cybersécurité". **Posts d'Imane, Jad, Jordan, Clément : non trouvés** (un profil "Clément Destouesse" apparaît dans une recherche, rien ne prouve que ce soit le Clément de l'équipe : non retenu) |
| X, Medium | Non trouvé |
| Pépites Tech (interview USETRUSTEE, 28 janv. 2026) | Oui [P] | Voir S4 ; ajoute : 5 participants qui ne se connaissaient pas, prototype en moins de 36 h, présenté "à un jury", la victoire décrite comme un tournant |
| ESSEC Entrepreneurship & Innovation | Mention "incubés" dans un résumé de recherche [S], non vérifiée à la source |
| Site usetrustee.com | **Inaccessible** (erreur DNS depuis mon poste) ; non vérifié. Fiche App Store lue [P] |
| Chrome Web Store | Aucune fiche Trustee trouvée (une extension concurrente "AntiScam Detector" existe, autre produit) |

## 2. Ce que Trustee a fait pendant les 36 h (reconstitué depuis l'historique public)

- 5 avr. 2025 : "Initial commit" ; ajouts "[ADD] RAG agent", "[ADD] Image agent" ; "[ADD] - Finally finishing trustee listing page and scoring gauge component" ; "[FIX] - errors", "[TO BE TESTED]" [P].
- 6 avr. 2025 : "[working version]", "[LETS GOOO]", "fix: images were not displayed", "ci: Update nextjs.yml" (déploiement de la page GitHub Pages) [P].
- 3 sept. 2025 : ajout de photos d'équipe [P]. Deux auteurs visibles par pseudonyme public : le propriétaire du dépôt (majorité des commits) et un second membre (CI, README, liens) [P].
- Lecture [V] : un MVP monté en moins de deux jours, avec un front d'extension (Vite/React/TypeScript), un back FastAPI, un agent RAG et un agent image, et une page vitrine publiée le dernier jour. C'est un schéma classique de hackathon : tout bout-en-bout, peu de profondeur.

## 3. Le produit tel qu'il est dans le code (état du dépôt, qui peut différer de la démo du 6 avril)

Avertissement : le dépôt a été modifié jusqu'en sept. 2025. Ce que j'ai lu est l'état final, pas forcément ce que le jury a vu [V].

### 3.1 Parcours utilisateur et écrans
- **Extension Chrome** (manifest v1.0) : permissions tabs, activeTab, scripting, sidePanel ; hôtes `<all_urls>` ; content script sur **toutes** les pages [P]. Le code ne cible pas eBay spécifiquement ; un extracteur eBay existe côté backend (appel `ebay_analysis(html)`) [P].
- Le content script injecte dans la page un **widget de score** (composant React "Scoring", une jauge) ; un clic ouvre le **side panel**, qui n'est qu'un iframe vers l'application front servie en `localhost:5173` [P]. Un bouton vert fixe "Send Page to API" envoie le HTML complet de la page au backend (`POST /api/page-source`) [P]. L'interface de test expose `window.updateTrusteeScore(75)`, score 0-100 [P].
- Le message d'erreur du side panel dit "Error loading Trustee. Please make sure your frontend is running on localhost:5173" [P] : **la démo supposait un front local lancé à la main**, donc probablement un parcours piloté (démo préparée) [V].
- Contenu exact du panneau de résultats (jauge, liste de signaux, bouton de réponse) : le code du front (`frontend/src/components`) n'a pas été lu en détail (non trouvé). Je ne décris donc pas l'écran final, seulement les données qu'il reçoit (§3.2).

### 3.2 Données renvoyées (sortie du modèle) [P]
`score` (0 à 100), `red_flags` (liste), `verdict` ("Likely Scam" / "Possibly Scam" / "Likely Safe"), `scammer_objective` (ce que viserait l'escroc), `reasoning` (explication), `suggested_reply` (**"réponse sûre"** pour l'acheteur), plus `image_analysis` et la conversation d'origine ajoutées par le code.

### 3.3 Barème (fichier `kb/scoring.md`) [P]
Échelle 0-100, **plus haut = moins risqué** ; 0-30 Likely Scam, 31-60 Possibly Scam, 61-100 Likely Safe. Déductions : titre vague -5, détails manquants -10, ton urgent -15, majuscules/emojis -5 ; prix 40 % ou plus sous le marché -25, 20-39 % -15 ; comportement en conversation -10 chacun (refus de rencontre, pression, paiement non protégé Zelle/CashApp/crypto, refus de PayPal Biens et Services, refus de photos, envoi d'un lien de paiement) ; image trouvée ailleurs -20, réutilisation scam connue -25, doublon exact -50 ; pas de preuve d'achat -10, vente en expédition seule sans retour -10.
**Faiblesses du barème** : pas de point de départ défini ; somme des déductions max (~190) supérieure à l'échelle ; deux exemples du fichier contredisent les bandes (MacBook "Total 70 → Likely Safe", Switch "0 → Likely Scam" sans signal) [P]. Aucun seuil dans le code : **le verdict est choisi par le modèle, pas par du code** [P].

### 3.4 Agents "spécialisés" : ce que contient vraiment le dépôt [P]
- `listing_agent.py` : un seul appel à **mistral-small** (streaming), prompt "fraud detection assistant", injecte le barème et des exemples récupérés par RAG, l'annonce, la conversation (lignes étiquetées "Buyer said" si le mot "buyer" y figure, sinon "Seller said") et le JSON d'analyse d'image. "Return JSON only". En cas de JSON invalide : erreur "Invalid JSON format from Mistral".
- `image_agent.py` : ResNet50 pré-entraîné (PyTorch) comme extracteur de caractéristiques, similarité cosinus, seuil 0,8, appliqué aux résultats d'une **recherche d'image inversée SerpAPI** (jusqu'à 20 correspondances).
- `rag_engine.py` : **embeddings mistral-embed**, base vectorielle **Chroma en mémoire**, reconstruite à chaque appel, découpage 500/50, tous les fichiers `.md` du dossier `kb`. Aucun LLM dans ce module.
- Base de connaissances : `scam_patterns.md` (6 signaux : prix trop bas, paiement Paylib/Zelle/PayPal amis, expédition seule, urgence, vendeur évasif, mauvaise grammaire, **sans source citée**), `scoring.md`, `ebay_scam_notice.md`, `example.md` (**15 exemples** : 6 sûrs, 5 probables arnaques, 3 possibles, 1 "certain" ; prix en dollars, articles type iPhone, Rolex, MacBook à 100 $) [P].
- Fichier de test : une annonce à 299 $, "pay via Zelle urgently", "shipping only" [P] : c'est vraisemblablement le type de cas montré [V].
- Dépendances : fastapi, uvicorn, transformers, torch, torchvision, mistralai, langchain_community, langchain_mistralai, langchain, unstructured, bs4 [P].
- **Écarts avec le discours** [P] : le README et la page parlent de "Node.js" en back ; le code lu est **Python/FastAPI** (un Node n'a pas été trouvé dans ce que j'ai ouvert). "NVIDIA" et "AWS" sont cités comme sponsors/hébergement ; je n'ai trouvé aucun code ni configuration NVIDIA ou AWS (NeMo est cité dans le post LinkedIn comme outil fourni [S]). Plusieurs récupérations RAG sont calculées mais pas injectées dans le prompt (analyse annonce, vérification conversation). Aucune mesure ni jeu de test d'évaluation dans le dépôt (le dossier `test_data` existe, contenu non lu). Mention "photos d'authenticité" et "computer vision" = reverse image + ResNet.
- Les "agents spécialisés" du discours actuel (annonces, images, conversations, URL) ressemblent à une extension ultérieure ; en avril 2025 il y avait **deux agents** (annonce+RAG, image) [P/V].

### 3.5 Démo : durée, scénario, cas montrés
**Non trouvé.** Aucune vidéo de pitch, aucune durée de démo, aucun format de pitch (Luma/Devpost/ESSEC ne le donnent pas). Ce qu'on peut dire [V] : une annonce piège (type fichier de test), score qui apparaît dans une jauge sur la page, panneau avec red flags, verdict, raisonnement, réponse suggérée ; comparaison avec une annonce saine ; pitch de quelques minutes (durée inconnue).

## 4. Prix et suites

- **Premier prix général, victoire du track Cybersécurité, "meilleur projet des 3 tracks"** [P TSE]. Montant propre à ce prix : **non trouvé**. Devpost : 900 € cash au premier de chaque track [S] ; l'ESSEC parle de cash, d'accès à des conférences, de formations et de tokens Mistral [P] ; on ne sait pas ce que Trustee a reçu en particulier.
- Pitch chez Google annoncé [P TSE] ; **aucune confirmation que cela a eu lieu** (non trouvé).
- Suite : société Trustee, Inc. / USETRUSTEE, extension + application iOS + outil B2B (S4, Pépites) ; incubation ESSEC E&I [S] ; 3 cofondateurs [P].
- Faiblesses de crédibilité visibles aujourd'hui [P] : politique de confidentialité de l'app hébergée sur pastebin, page App Store sans assez d'avis pour afficher une note, site usetrustee.com non joignable depuis mon poste (non vérifié), aucune traction publique (S4).

## 5. Jury 2025 et ce qu'il a dit

- **Composition du jury** : non trouvée (ni ESSEC, ni TSE, ni Luma, ni Devpost lu). Les orateurs de la soirée d'ouverture (NVIDIA, Google, Ledger, Microsoft, Mistral AI) sont cités par ESSEC sans qu'on sache qu'ils ont jugé [P].
- **Citations de jurés** : non trouvées.
- **Critères** (Devpost, via résumé) : **Pitch** (qualité de la présentation, de l'équipe et de la motivation), **Innovation** (originalité), **Implémentation technique** (l'idée devenue MVP concret), **MVP** (fonctionne-t-il) [S]. Pondération : non trouvée. Hackathon "ouvert à un track au choix", thème Machine learning [P allhackathons].
- Citations d'organisateurs : "dynamique de confiance et de collaboration" (directeur du Metalab Institute) ; origine d'Utopia : "pourquoi pas d'association dédiée à l'IA à l'ESSEC" [P ESSEC]. Rien sur le vote.

## 6. Les autres équipes primées et les éditions précédentes

- **Autres gagnants 2025 (Consumer, Finance & Industry, seconds de track)** : **non trouvés**. La galerie Devpost aurait pu les donner mais est en 403 pour moi. Chaque track avait 3 lauréats premiers et 3 seconds [S] (la formule "3 gagnants" est ambiguë dans le résumé : peut vouloir dire 3 équipes par palier toutes tracks confondues, ce qui colle avec 3 tracks).
- **Édition précédente de ce hackathon** : non trouvée (rien avant avril 2025 ; Utopia est une association récente d'après la citation de son cofondateur [P]).
- **Hackin'Dau 2024** (autre jury, autre événement, S4) : à ne pas extrapoler.
- **Conséquence** : le profil "ce que ce jury récompense" repose sur **un seul point de données** et sur quatre critères Devpost. Ce qui suit est une déduction [V].

### Déduction [V] : ce que la grille Pitch / Innovation / Technique / MVP récompense
1. **Un MVP qui tourne de bout en bout** : critère explicite ("MVP", "implémentation technique"). Trustee avait une extension, un back, une jauge, un RAG, un agent image, une page publique, tout en 36 h.
2. **Un pitch lisible** : qualité du pitch, de l'équipe et de la motivation = un orateur clair, un problème évident (se faire arnaquer sur eBay), une démo courte.
3. **Un utilisateur final évident et un thème "agents IA grand public"** : l'événement affichait un focus B2C et un thème agents ; le track Cyber de Trustee tenait sur un acheteur particulier.
4. **De l'IA visible** (mistral-small, RAG, reverse image) alignée sur le thème "LLM to Agentic AI" et sur les partenaires (Mistral, NVIDIA, AWS, Google Cloud).
5. **Pas de critère de rigueur mesurée** dans la grille Devpost : rien sur le taux d'erreur, la reproductibilité, la conformité. Trustee a donc pu gagner sans mesure (aucune mesure trouvée dans le dépôt).

## 7. Forces et faiblesses de la démo de Trustee du point de vue d'un jury [V sauf mention]

**Forces**
- Problème universel et émotionnel (arnaque eBay) : compris en 5 secondes.
- Surface tangible : un score dans la page, une jauge, un verdict, des red flags, un message à envoyer.
- Une réponse actionnable ("réponse sûre") au-delà de l'alerte.
- Équipe pluridisciplinaire de 5 qui ne se connaissaient pas (histoire de pitch).
- Thème parfaitement aligné (LLM vers agents, Mistral).
- Un artefact public livré (page, dépôt, vidéo d'installation) : preuve d'exécution.

**Faiblesses (visibles dans le dépôt) [P]**
- Verdict et score décidés par le modèle, pas de seuil dans le code ; barème contradictoire ; aucune calibration ni évaluation ; 15 exemples et 6 signaux en base ; base de signaux sans source.
- Content script sur toutes les pages, envoi du HTML complet de la page au backend, permission `<all_urls>` : posture vie privée et sécurité fragile pour un produit de **sécurité** ; front dépendant de `localhost:5173`.
- README qui ne correspond pas au code (Node vs FastAPI) ; sponsors cités comme pile (AWS, NVIDIA) sans trace dans le code lu.
- Fraudes qui évoluent, contournement du reverse image, faux positifs inconnus.

**Ce qui a probablement pesé le plus** [V] : clarté du problème, MVP fonctionnel, thème IA, équipe. La rigueur technique n'a vraisemblablement pas été le facteur décisif (rien de mesuré), mais je n'ai pas vu la notation du jury.

## 8. Ce qu'un jury qui connaît Trustee attendra d'un projet "extension + avertissement" [V]

1. **Un test de nouveauté** : "en quoi est-ce différent de Trustee ?" posé dans les 2 minutes de questions. Organisateurs communs (Utopia, Kryptosphère) donc réflexe probable.
2. **Une extension qui marche réellement** (pas un front en localhost) : Trustee a été jugé sur un MVP qui tourne, le niveau de base est donc "ça marche en direct".
3. **Un score et un verdict lisibles**, par comparaison avec ce que Trustee montre : jauge, signaux, réponse suggérée.
4. **Un cran de plus sur la rigueur** : Trustee n'a rien publié de mesuré ; un jury sensibilisé par la grille Track 1 (détection mesurée, réponse, explicabilité, faisabilité, d'après S4) attendra un chiffre. Un repère public : le projet dérivé scamlens affiche n=65 (jeu de développement, optimiste), n=28 (jeu hors développement, une seule exécution), exactitude 0,82, rappel 0,71, fausses alarmes 0,07, et dit lui-même que la contribution du LLM n'est pas mesurée et que l'incertitude est large [P]. Un jury qui a lu ce style de rapport trouvera un "88 % de précision" sans n très faible.
5. **Une posture de sécurité propre** : permissions minimales, pas d'envoi de page entière, journal des décisions (Trustee fait exactement l'inverse sur les permissions).

## 9. Recommandations

### À réutiliser
- **Démo courte et scénarisée** : un seul scénario, un cas piège puis un cas sain. Trustee montre que cela suffit à gagner quand l'utilisateur est évident.
- **Verdict visible dans la page** (jauge/badge) avec 3 ou 4 niveaux, comme le "Likely Scam / Possibly Scam / Likely Safe" de Trustee, mais déterminés par du code (pas par le modèle).
- **Utilisateur nommé** et émotion simple ("on m'a vidé mon portefeuille").
- **Livrer des artefacts publics** (dépôt, page, vidéo d'installation) : cela a servi Trustee comme preuve.
- **Réponse suggérée** : idée forte de Trustee ; équivalent chez nous = la phrase à retaper ou l'action alternative.

### À éviter
- Copier la surface : jauge de score + liste de red flags + "réponse sûre" dans un side panel. C'est le visuel que le jury connaît.
- Un score numérique arbitraire décidé par un LLM, un barème sans point de départ, des sponsors affichés comme pile.
- La permission `<all_urls>` et l'envoi du HTML complet : à ne pas reproduire dans un produit de sécurité.
- Une démo qui dépend de `localhost` ou d'un back lancé à la main.
- Citer Trustee comme exemple dans le pitch, ou dire "Trustee ne mesure rien" (non trouvé n'est pas absent).

### À montrer pour que la différence saute aux yeux
1. **Le décodage de l'effet exécutable** : "tu as dit X ; la signature fait Y" sur un cas qu'une jauge de texte ne voit pas (permit sans montant, droit illimité). Montrer la ligne décodée, pas un score.
2. **Une mesure chiffrée avec n et les échecs** : faux positifs, rappel, n affiché, et une ligne "ce qui a échoué" ; préciser que ce sont ceux du filet (S4) et ce qui reste à prouver. C'est le contraste le plus net avec une absence de mesure publique côté Trustee.
3. **Un journal d'audit rejouable** : même verdict, mêmes règles, exportable. Trustee n'a rien d'équivalent dans le dépôt.
4. **Un déterminisme explicite** : le code décide, l'IA ne peut qu'aggraver ; contraste avec le "verdict choisi par le modèle" de Trustee.
5. **Le temps** : conserver une démo de 60 secondes comme Trustee, mais avec ces trois éléments (effet décodé, chiffre, journal).

## 10. Limites
- Devpost (galerie, jury, règles), LinkedIn et YouTube (contenu) non lus directement ; critères et prix Devpost via résumé de moteur de recherche [S].
- Le dépôt GitHub reflète l'état de sept. 2025, pas nécessairement la démo du 6 avril 2025. Je n'ai pas lu le code front (panneau de résultats) ni le dossier `test_data`.
- Jury, pondération, durée de la démo, autres gagnants, montant exact du prix : non trouvés.
- Les jugements sur ce que le jury récompense sont des déductions à partir d'un seul gagnant et de quatre critères.

## Sources
- https://www.tse-fr.eu/anais-boughanem-d3s-masters-student-wins-first-prize-ai-hackathon et https://alumni.tse-fr.eu/en/article/a-d3s-master-s-student-wins-first-prize-at-an-ai-hackathon/08/04/2025/1287 [P]
- https://www.essec.edu/fr/actualites/etudiants-essec-assaut-intelligence-artificielle/ et https://www.essec.edu/en/news/essec-students-tackling-artificial-intelligence/ [P]
- https://luma.com/shun5uky [P] ; https://fr.allhackathons.com/hackathon/from-llm-to-agentic-ai-utopia-x-kryptoshpere/ [P]
- https://from-llm-to-agentic-ai.devpost.com/ (403, critères et prix via résumé) [S]
- https://github.com/jaddevvv/Hackathon-From-LLM-To-Agentic-AI (README, backend/main.py, backend/agents/*, backend/rag/rag_engine.py, backend/kb/*, extension/manifest.json, extension/src/*, historique des commits) [P]
- https://jaddevvv.github.io/Hackathon-From-LLM-To-Agentic-AI/ [P]
- https://www.youtube.com/watch?v=6heiHBouHkk (titre seulement) [P]
- https://www.linkedin.com/in/mohand-boughanem-1361996/ (repost, via résumé) [S]
- https://lespepitestech.com/blog/2026/01/28/364-interview-des-pepites-usetrustee [P]
- https://apps.apple.com/us/app/trustee-ia-anti-scam/id6757202153 [P]
- https://github.com/SHAHID1100HACK/scamlens (projet dérivé et évaluation) [P]
- https://chromewebstore.google.com/detail/antiscam-detector/adjihnafafdihomkkfjanjoccdohhlfb (concurrent, via résumé) [S]
- Fichier interne : S4_trustee_comparateur.md

## Résumé en 12 lignes
1. Hackathon "LLM to Agentic AI" (ESSEC, soirée le 4, 36 h les 5-6 avril 2025 selon Luma et les commits), 100 étudiants, 20 équipes, 3 tracks ; Trustee = premier prix général + track Cyber.
2. Critères Devpost (via résumé) : Pitch, Innovation, Technique, MVP ; prix 900 € au premier de track, total Devpost 4 050 €, ESSEC annonce 10 000 € de dotations.
3. Jury, citations, autres gagnants, montant du prix de Trustee, durée de la démo : non trouvés ; Devpost bloqué (403), LinkedIn bloqué.
4. Le dépôt public existe et a été lu : back Python/FastAPI (pas Node comme le README), un seul appel à mistral-small, RAG avec mistral-embed + Chroma en mémoire, agent image ResNet50 + SerpAPI.
5. Barème 0-100 (plus haut = plus sûr ; 0-30 / 31-60 / 61-100), 6 signaux en base, 15 exemples ; barème incohérent ; verdict choisi par le modèle, sans seuil dans le code.
6. Sortie : score, red_flags, verdict, scammer_objective, reasoning, suggested_reply ; jauge dans la page, side panel iframe sur localhost:5173.
7. Faiblesses : aucune évaluation chiffrée, `<all_urls>` et envoi du HTML complet, écarts README/code, sponsors AWS et NVIDIA sans trace dans le code lu.
8. Pourquoi il a probablement gagné : problème universel, MVP bout-en-bout, thème IA/Mistral, équipe, artefacts publics ; la rigueur n'était pas dans la grille [V].
9. Un seul gagnant connu : "ce que ce jury récompense" reste une déduction ; la grille privilégie MVP et pitch plutôt que mesure.
10. Un jury qui connaît Trustee attendra : un MVP réel (pas en localhost), un verdict lisible, une nouveauté expliquée, et un chiffre, car Trustee n'en a publié aucun.
11. Réutiliser : démo courte et scénarisée, verdict visible à 3-4 niveaux décidé par du code, utilisateur nommé, artefacts publics, phrase d'action. Éviter : copier jauge + red flags + side panel, score LLM arbitraire, permissions larges.
12. Pour la différence : décodage "tu as dit / la signature fait", mesure avec n et échecs, journal d'audit rejouable, déterminisme explicite, en 60 secondes.

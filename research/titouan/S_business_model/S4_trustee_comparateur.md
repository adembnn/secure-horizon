# S4. Trustee contre Hold up : comparateur, risque d'assimilation, extension comme support

Date : 11 oct. 2026. Auteur : agent de recherche S4 (Claude). Aucun secret, aucune donnée personnelle.

Étiquettes (mon usage) : **[P]** fait lu par moi dans une page publique citée (URL). **[S]** fait repris d'un résumé de moteur de recherche ou d'un fichier interne du projet, non relu en entier. **[V]** jugement, estimation ou hypothèse à vérifier, qui n'est pas un fait. "Non trouvé" = cherché sans résultat. Rien n'est inventé.

## 0. Trois corrections de contexte à connaître avant le pitch

1. **L'édition 2025 ne s'appelait pas "Secure Horizons".** Les sources publiques parlent du hackathon **"LLM to Agentic AI"**, organisé par Utopia et KRYPTOSPHERE à l'ESSEC, avec le soutien du METALAB (France 2030), les 4 et 5 avril 2025, 36 h, une centaine de participants, 20 équipes, **trois tracks : Cybersécurité, Consumer, Finance & Industry** [P] (https://www.tse-fr.eu/anais-boughanem-d3s-masters-student-wins-first-prize-ai-hackathon ; https://www.essec.edu/fr/actualites/etudiants-essec-assaut-intelligence-artificielle/). Je n'ai trouvé aucune page citant "Secure Horizons" (non trouvé). Donc "Secure Horizons 2026" est vraisemblablement une nouvelle marque, ou non indexée. Conséquence : le jury 2026 n'a pas de "mémoire de gagnants" propre à cette marque, mais Utopia et Kryptosphère, organisateurs des deux éditions, connaissent Trustee [V].
2. **Trustee n'est plus un projet de hackathon : c'est une startup, USETRUSTEE.** Interview du 28 janv. 2026 [P] (https://lespepitestech.com/blog/2026/01/28/364-interview-des-pepites-usetrustee). Elle vend déjà une extension Chrome ET une application mobile, plus un outil B2B pour plateformes et équipes Trust & Safety. Trustee lui-même présente donc l'extension comme un canal. C'est notre meilleur argument à la fois de lecture et de défense.
3. **Le gagnant 2025 a gagné dans une édition avec un jury et une grille que nous ne connaissons pas.** Aucune source publique ne liste le jury 2025 ni ses critères (non trouvé). Tout ce qui est dit sur "ce que le jury récompense" est donc une déduction [V], pas un fait.

## 1. Ce qui est public sur Trustee

### 1.1 Équipe [P]
Cinq étudiants qui ne se connaissaient pas avant l'événement [P Pépites] : Anaïs Boughanem (Master 2 D3S, TSE ; conception du modèle IA, pipeline RAG et raisonnement LLM), Imane (Skema, aujourd'hui Imane Ourdane), Jad (L'Albert School), Jordan (IMT Atlantique ; cité comme cofondateur Jordan Baumard), Clément (ESSEC et ENSAE). Trois cofondateurs de la startup nommés : Boughanem, Baumard, Ourdane (Pépites). Source : TSE (lien ci-dessus) et Pépites.

### 1.2 Produit et démonstration
- Extension Chrome qui protège les acheteurs sur des places de marché comme eBay : analyse des annonces et des conversations acheteur-vendeur, **score de risque**, signaux d'alerte surlignés, **réponses sûres suggérées** [P TSE].
- Page du projet (dépôt GitHub Pages d'un membre) : analyse des annonces (titre, description, prix, authenticité des photos), surveillance des conversations en temps réel, score de confiance par vendeur avec explications et historique [P] (https://jaddevvv.github.io/Hackathon-From-LLM-To-Agentic-AI/). La page ne contient ni vidéo ni lien de démo (non trouvé : aucune vidéo de démo publique).
- Aujourd'hui : des agents IA spécialisés (annonces, images, conversations, URL et pages web) dont les signaux sont croisés pour produire un score et une explication ; l'**explicabilité** est le "pilier central" [P Pépites].

### 1.3 Pile technique [P, page projet]
React.js (extension), Node.js (API), **Mistral AI** (langage et décision), **AWS** (hébergement), NVIDIA (accélération). Un projet dérivé cite explicitement Trustee comme inspiration : "Chrome extension that scored fraud risk on listings and chats with RAG + LLM reasoning" [P] (https://github.com/SHAHID1100HACK/scamlens). Le détail du RAG (quelles données, quelle base) : non trouvé.

### 1.4 Prix et suites
- Premier prix général, plus victoire du track Cybersécurité [P TSE]. Mention : "sera bientôt présenté à de grands acteurs tech, dont une session de pitch chez Google" [P TSE]. Montant du prix individuel : non trouvé.
- Startup : freemium (5 requêtes gratuites), premium **2,99 € par mois** requêtes illimitées ; B2B : preuves de concept puis abonnements au volume ; cibles : plateformes C2C et partenaires publics ; objectifs à un an : communauté d'utilisateurs, clients B2B, partenariats publics [P Pépites]. **Aucun client nommé, aucune traction chiffrée, aucune levée communiquée** (non trouvé). Je n'ai pas trouvé le site officiel ni la fiche Chrome Web Store (non vérifié).

### 1.5 Ce que les jurés ont dit
**Non trouvé.** Aucune citation de juré, aucune grille 2025, aucune liste de jury 2025 dans les sources publiques. Partenaires 2025 cités : Ledger, Mistral AI, Bpifrance, Kima Ventures, Google Cloud, Microsoft, NVIDIA [P ESSEC] ; sponsors listés sur la page projet : METALAB, AWS, NVIDIA, Mistral, Kima, Bpifrance, Entrepreneurs First, Morpho Labs [P]. Pas de lien établi entre ces partenaires et le vote.

### 1.6 Critères de victoire (reconstitués, donc [V])
Le brief interne (ctx_ideas) dit : besoin réel, utilisateur final évident, démo de 10 secondes, score visible, IA. Je n'ai trouvé AUCUNE source publique qui l'établisse : c'est une lecture de l'équipe. Ce que les sources publiques confirment seulement : thème "agents IA", cas d'usage B2C, 3 tracks, dotation de 10 000 € [P ESSEC]. Le guide 2026 dit en revanche noir sur blanc que Trustee "a montré qu'un projet grand public peut devenir une startup" (kickoff_slides, notion_guide) : c'est la seule "parole d'organisateur" que nous ayons, et elle porte sur la **viabilité de startup**, pas sur la recette de démo.

## 2. Gagnants des éditions précédentes
- Édition 2025 : seul Trustee est nommé. Les gagnants des deux autres tracks (Consumer, Finance & Industry) : **non trouvé**.
- Édition 2024 de ce hackathon à l'ESSEC : **non trouvé** (je n'ai trouvé aucune trace d'une édition antérieure). Résultat négatif, ne pas supposer qu'elle n'a pas existé.
- Hors ESSEC, pour la culture Kryptosphère : Hackin'Dau (Dauphine, Chaire Fintech + Kryptosphère) 2024, gagnants Yielo (Blockchain x Finance) et Kaution (Blockchain x Général), jury Cédric Lion, Thomas de Phuoc (Kiln), Talam Diop [S, résumé de recherche] (https://dauphine.psl.eu/dauphine/media-et-communication/article/hackindau-2024-bravo-aux-equipes-gagnantes). Ce n'est pas le même jury : à ne pas extrapoler.
- Ce que je peux dire honnêtement : **un seul point de données** (Trustee) sur ce jury. "Ce que le jury récompense" ne se déduit pas d'un seul gagnant [V].

## 3. Comparateur détaillé Trustee contre Hold up

Légende : colonne Trustee = public (sauf mention [V]) ; colonne Hold up = documents du projet (intent-barrier.md, O, R, banc v0).

| Dimension | Trustee | Hold up | Lecture honnête |
|---|---|---|---|
| Problème et douleur | Acheter un objet à un faux vendeur sur une place de marché entre particuliers ; perte d'argent et de confiance [P] | Signer ou envoyer une opération crypto qui fait autre chose que ce qu'on croit (droit de dépense, drainer, sosie d'adresse, faux support) ; perte irréversible [doc projet] | Même famille émotionnelle ("on m'a arnaqué"), terrain différent. La douleur crypto est plus brutale (irréversible, pas de rétrofacturation) [V] |
| Utilisateur | Acheteur C2C sur eBay et équivalents [P] ; ensuite plateformes et équipes Trust & Safety [P] | Particulier qui utilise un portefeuille ; en second, exchange/fintech via une API avant retrait [doc projet] | Les deux sont des particuliers "peu protégés". Trustee a un marché de masse (acheteurs), nous une niche moins large mais sans protection comparable [V] |
| Support technique | Extension Chrome + application mobile + outil B2B [P Pépites] | Aujourd'hui : Snap MetaMask ; extension possible ; API exchange [doc projet] | Les deux sont multi-canaux. L'extension n'est le produit ni chez eux ni chez nous |
| Moment d'intervention | Avant l'achat/paiement, pendant la lecture d'annonce et de la conversation [P] | Au moment exact de la signature ou de l'envoi, avant exécution [doc projet] | Les deux sont "avant". Chez nous c'est un point de contrôle unique et précis (la signature), chez eux un accompagnement diffus du parcours |
| Ce qui est analysé | Texte d'annonce, prix, photos, messages du vendeur, URL [P] : du **contenu déclaratif** | L'**effet exécutable** décodé de la transaction ou du typed data (droits, destinataire, contrôle), comparé à l'intention déclarée [doc projet] | Différence structurelle la plus forte : eux lisent ce que l'escroc dit, nous calculons ce que l'opération fait |
| Nature du signal | Probabiliste et sémantique (RAG + LLM + agents) [P, partiel] | Déterministe et vérifiable pour le noyau (décodage, règles) ; l'IA ne peut qu'aggraver, jamais débloquer [O, R] | Vrai pour le noyau. Mais ne pas exagérer : l'**intention** reste déclarative et le filet isolé a 31/1000 de FP sur Ethereum [banc v0] |
| Vérité terrain et mesure | **Aucune mesure publique** trouvée (ni FP, ni rappel, ni jeu de test) | Banc chiffré : filet v0 FP 0,28 % (C-Chain, n=6 325) et 3,15 % (Ethereum, n=43 075), rappel 81,9 % sur 1 354 approbations d'attaque réelles ; résultats négatifs publiés [banc v0] | Notre avantage réel, mais attention : ces chiffres sont ceux du **filet sans intention**, pas de l'outil complet ; le jeu permit n'existe pas ; étiquetage ScamSniffer possiblement circulaire. Absence de mesure publique chez Trustee ne prouve pas qu'ils n'en ont pas (non trouvé) |
| Réponse | Score de risque + signaux + réponses suggérées [P] ; ne bloque pas | Verdict gradué (OK, Attention, Danger, Manipulation) avec friction (phrase à retaper, retenue), journal d'audit [REGLES_avertissements, O] | Nous répondons plus fort, mais la friction n'est **pas prouvée** (aucune étude isolant nos mécanismes ; l'extension seule permet de vraiment bloquer, le Snap non [O]) |
| Place de l'IA | Centrale et visible : Mistral, RAG, agents spécialisés [P] | Secondaire et bornée : classe un message collé, résume l'intention libre ; le comparateur final est du code ; gain de l'IA à prouver face à une régression logistique [R] | Sur la grille 2026 (fiabilité et contrôle de l'IA), c'est un atout ; sur un jury qui aime "voir de l'IA", c'est un risque de perception [V] |
| Démo de 10 secondes | Mettre une annonce eBay, le score monte, les signaux s'allument (non filmée publiquement : [V]) | Un site piégé demande de signer ; le Snap affiche "tu as dit : payer Paul ; en réalité : donner droit illimité à un inconnu" | Nous avons une démo aussi courte et plus dramatique si le moment est bien joué ; mais la compréhension "effet exécutable" demande 1 phrase de plus que "score d'arnaque" [V] |
| Nouveauté | Pas de brique nouvelle (LLM + RAG sur du texte) ; nouveauté d'usage et d'exécution en 36 h [V] | Comparaison intention déclarée / effet décodé : aucun projet identique trouvé, mais proches (presign-guard pour agents, IntentGuard, MetaMask/Blockaid pour la simulation) [O1] ; ne pas dire "premier" | Les deux sont des assemblages. Notre nouveauté tient au **croisement** intention x effet, pas à une technologie |
| Potentiel de startup | Démontré (société créée, freemium 2,99 €/mois, B2B plateformes) ; traction non communiquée [P] | Non démontré. Pistes : API de contrôle avant retrait pour exchanges/fintech, SDK portefeuille, abonnement particulier ; niche étroite et monétisation B2C crypto difficile [V] | Trustee est en avance de 18 mois sur la voie startup. Notre voie B2B (exchange/portefeuille) est plus crédible pour un jury Track 1 que le B2C |
| Risques | Dépendance LLM, hallucinations, faux positifs inconnus, fraudes qui changent de plateforme, pas de blocage [V] | Faux positifs (objectif ≤1/1000 non atteint par le filet naïf), fraude "conforme" invisible (pig butchering), dépendance au Snap/MetaMask, intention mensongère ou vague, jeu permit absent [R, O, banc] | Risques différents, tous assumables si dits d'abord |

## 4. Le jury peut-il nous assimiler à Trustee ? Estimation

### 4.1 Pourquoi le risque existe
- Surface commune visible en 10 secondes : "extension, avertit avant un acte risqué, protège un particulier". Un juré généraliste (KPMG, AWS) retient la forme avant le fond [V].
- Notre propre brief écartait au départ "une extension et une copie de Trustee" : la crainte est donc cohérente avec ce que l'équipe sentait.
- Organisateurs communs : Utopia et Kryptosphère ont organisé 2025 et sont au jury 2026 [P] : ils connaissent Trustee mieux que les autres jurés.

### 4.2 Pourquoi il est borné
- **Le track est différent** : Track 1 Fintech Security, grille 30/20/20/15/15 avec détection mesurée, réponse, **conformité et explicabilité**, faisabilité (notion_guide). Trustee a gagné avec une grille inconnue. Un jury qui note "détection mesurée sur scénario réaliste" ne peut pas simplement dire "même recette" si nous montrons des chiffres et eux n'en montrent pas.
- **Jury partiellement différent** : Team1 Avalanche, KPMG, AWS n'apparaissent pas dans les sources 2025 que j'ai pu lire (jury 2025 non trouvé : [V]). Kryptosphère et Utopia sont communs.
- **Le guide 2026 cite Trustee comme exemple de startup**, pas comme modèle technique : cela peut jouer dans les deux sens (bon pour nous si nous avons une voie startup crédible, mauvais si le jury cherche "le prochain Trustee" et que nous avons un angle trop étroit) [V].
- **Le Track 1 ne dit pas "pas d'extension"** ; l'extension n'est pas pénalisée par la grille.

### 4.3 Scénarios
1. **Assimilation négative ("c'est Trustee pour la crypto", donc pas nouveau)** : un juré résume le projet comme "une extension qui score les arnaques, version crypto". Déclencheurs : démo centrée sur un pop-up, pitch qui commence par "extension", mot "score" prononcé, IA présentée comme le cœur. Effet : note "originalité" sous-estimée, mais Track 1 ne note pas l'originalité explicitement ; le risque se reporte sur "faisabilité et intégration" (perçu comme gadget grand public) et le pitch. Probabilité [V] : moyenne si on ne dit rien, faible si on cadre dans les 20 premières secondes.
2. **Assimilation positive ("même recette gagnante")** : le jury voit une démo courte, un utilisateur clair, un verdict visible, et reconnaît un schéma qui plaît. C'est un biais favorable, pas une pénalité. Probabilité [V] : moyenne. À ne pas chercher à provoquer en citant Trustee nous-mêmes comme modèle : se comparer au gagnant est risqué dans les deux sens.
3. **Différenciation claire** : le jury retient "il calcule ce que la signature fait" et "banc chiffré". Probabilité [V] : élevée si le moment "tu as dit X / en réalité Y" est rejoué sur un cas où un score d'annonce serait impuissant (un permit sans montant), et si les chiffres sont montrés avec leurs limites.

## 5. Les 8 questions pièges les plus probables et la meilleure réponse honnête

1. **"C'est Trustee pour la crypto, non ?"** Réponse : "Même famille émotionnelle, pas même mécanisme. Trustee lit ce que dit l'escroc : une annonce, un message. Nous ne lisons pas l'escroc : nous calculons ce que l'opération fait et nous le comparons à ce que l'utilisateur dit vouloir. Et ce que Trustee a montré, c'est qu'un projet de protection des consommateurs peut devenir une startup : c'est ce que nous visons aussi." (Honnête : ne pas dire "rien à voir".)
2. **"Quelle différence si je prends Trustee et que je l'applique aux sites crypto ?"** "Trustee ne pourrait pas voir un permit signé sans montant, ni un droit illimité caché dans un typed data : l'arnaque n'est pas dans le texte, elle est dans les données signées. Un score sur la page ne les voit pas." (Montrer le cas.) Aveu : une partie de ce que nous faisons (sites piégés, faux support) peut être aidé par du texte, et nous le faisons aussi sur le message collé.
3. **"Pourquoi une extension ? Ce n'est qu'un pop-up."** "L'extension, ou le Snap, ou une API, est un support. Le produit, c'est le moteur qui décode l'effet et le compare à l'intention, et la réponse graduée avec journal. Même moteur, trois canaux." Aveu : seule l'extension peut vraiment retenir la requête ; le Snap ne bloque pas [O].
4. **"MetaMask, Blockaid ou Rabby font déjà ça."** Honnête : "Ils simulent l'effet et ont de la réputation de contrats. Aucun n'utilise ce que l'utilisateur voulait faire comme point de comparaison, à ma connaissance (je n'ai pas trouvé de produit identique, mais je ne peux pas l'exclure)." Ne pas affirmer "personne".
5. **"Vos chiffres, c'est quoi exactement ?"** "Ce sont ceux du filet de base, sans intention : 0,28 % de faux positifs sur 6 325 transactions Avalanche, 3,15 % sur Ethereum, 82 % de rappel sur 1 354 approbations malveillantes publiques. L'objectif 1/1000 n'est pas atteint par le filet naïf. L'intention doit apporter la réduction, et nous publions ce qui a échoué." (Ne jamais présenter ce chiffre comme celui de l'outil complet.)
6. **"Qui est responsable si vous vous trompez ?"** (question officielle du track.) "L'outil ne bloque pas seul : il informe et ralentit ; la décision reste à l'utilisateur ; chaque verdict est journalisé avec ses règles pour qu'un auditeur le rejoue. Le modèle ne peut qu'aggraver, jamais débloquer."
7. **"Le marché crypto particulier est-il assez grand pour une startup ?"** Aveu : "Seul, non prouvé. D'où l'API avant retrait pour exchanges/fintech et le SDK pour portefeuilles : le particulier est l'utilisateur, la fintech est le client." Donner un chiffre seulement s'il est sourcé (les chiffres de pertes du dossier R sont des sources secondaires, à revérifier avant slide).
8. **"Et si l'utilisateur ment ou répond n'importe quoi à la question d'intention ?"** "Intention vague = attentes les plus strictes ; l'intention ne peut que monter le niveau, jamais passer sous le plancher objectif du moteur ; c'est compté comme faux positif de design. Il y a aussi des cas qu'on ne voit pas : la fraude conforme (pig butchering) ; nous le disons."

## 6. Ce qu'il faut montrer en démo pour que la différence saute aux yeux (sans exagérer)

1. **Ouverture (10 s)** : un site d'airdrop piégé demande une signature qui paraît banale. L'utilisateur a dit "me connecter". Écran : "Tu as dit : te connecter. En réalité : donner à une adresse inconnue le droit de dépenser tous tes USDC." Montrer le décodage, pas un score.
2. **Le contraste (15 s)** : à côté, un "score de page" fictif (clairement étiqueté comme simulation de ce que ferait un outil de type texte) reste vert parce que le site est propre. Ne pas mentionner Trustee pour ne pas lui faire dire ce qu'il ne dit pas : dire "un outil qui lit la page".
3. **Un cas légitime (10 s)** : un vrai swap sur routeur connu passe sans friction : montre la sélectivité.
4. **Les chiffres (15 s)** : FP et rappel du banc avec n affiché, et une ligne "ce qui a échoué" (nonce, contrat jeune). C'est le contraste le plus net : une mesure publiée contre aucune mesure publique côté Trustee, sans l'attaquer.
5. **Le journal et la retenue (10 s)** : un verdict rejouable par un auditeur (critère conformité 15 %).
6. **Les trois canaux (5 s)** : la même décision via extension, Snap et API exchange.
- À ne pas faire : dire "Trustee ne mesure rien" (non vérifié : c'est seulement non trouvé), dire "premier", promettre le blocage dur avec le Snap, présenter les chiffres du filet comme ceux de l'outil.

## 7. L'extension comme simple support

### 7.1 Ce qui change vraiment avec une extension
- **Elle peut retenir la requête** avant qu'elle atteigne le portefeuille (le Snap ne bloque jamais durement : friction seulement [O, O1]).
- **Elle voit la page** : origine du site, ce qui est affiché contre ce qui est exécuté (le "miroir" des cas Bybit/Radiant), et peut capter le message du faux conseiller.
- **Elle couvre les portefeuilles qui ne supportent pas les Snaps** (tout ce qui n'est pas MetaMask).
- Contre : surface d'attaque (extensions piégées, famille 12 du dossier R), installation, MV3, angle mort sur mobile et sur les envois lancés depuis l'interface du portefeuille.

### 7.2 Comment la présenter
- Phrase : "Hold up est un moteur de décision avant signature. Il se branche à trois endroits : le portefeuille (Snap), le navigateur (extension, la seule à pouvoir retenir) et l'exchange (API avant retrait). C'est le même contrat d'interface Intent/Effects/Verdict pour les trois." Cela correspond à l'architecture déjà documentée (intent-barrier.md : API locale + moteur + comparateur).
- Slide : un schéma à une ligne "un moteur, trois canaux", avec l'extension en seconde position, pas en titre.
- Argument d'appui : **Trustee fait lui-même ce pas** (extension + appli mobile + B2B plateformes [P Pépites]). Dire "comme les meilleurs produits de protection, le canal n'est pas le produit" est cohérent et factuel.
- Piège à éviter : si la démo live n'est qu'un pop-up d'extension, le jury retient "extension". Montrer au moins deux canaux dans la démo, même si l'un est une capture.

## 8. Ce qu'on peut réutiliser de la recette gagnante sans copier

| Élément | Comment le reprendre chez nous | À ne pas faire |
|---|---|---|
| Démo courte | Un seul scénario, 10 s : faux airdrop ou faux support | Empiler trois scénarios |
| Score visible | Un verdict à quatre niveaux, unique et lisible (OK/Attention/Danger/Manipulation), pas un nombre inventé | Afficher un "score de confiance" arbitraire à 87 % sans calibration (aucune calibration publiée pour Clef/Jev [O]) |
| Utilisateur évident | Une personne nommée : le particulier qui ouvre un site d'airdrop ou reçoit un appel de "support" | Parler de "l'écosystème Web3" |
| IA | Visible mais bornée : classer un message collé, résumer l'intention ; le code décide | Faire de l'IA le cœur de la détection (le jury Track 1 veut de l'explicabilité et de la responsabilité) |
| Explicabilité | Pilier chez Trustee ET dans la grille Track 1 (15 %) : chaque verdict avec ses règles et le "tu as dit / en réalité" | Explication générée librement par un modèle |
| Startup | Une phrase client claire : B2B exchange/portefeuille d'abord, particulier ensuite | Prétendre un marché B2C crypto prouvé |

## 9. Verdict franc

**Probabilité subjective que l'assimilation à Trustee nous pénalise : moyenne si on laisse le jury faire sa propre lecture, faible si on cadre dès les 20 premières secondes** [V, jugement, non mesuré]. Raisons : le mécanisme (effet exécutable contre texte) et la mesure (banc chiffré) sont réellement différents ; le track évalue la détection mesurée, la réponse et l'explicabilité, ce que Trustee n'a pas publié ; mais la surface (extension, avertit, particulier) est identique et le jury commun (Utopia, Kryptosphère) connaît Trustee. Le risque est surtout une perte sur la perception d'originalité et de viabilité, pas une disqualification.

**Les 3 actions qui la réduisent le plus**
1. **Ouvrir sur le mécanisme, pas sur le support** : première phrase = "Avant de signer, tu dis ce que tu veux faire ; on calcule ce que la signature fait vraiment." Ne pas dire "extension" avant la 30e seconde ; titre de slide = "barrière d'intention", pas "extension".
2. **Montrer un cas qu'un score de texte ne peut pas voir** (permit sans montant, droit illimité caché dans un typed data) à côté d'un cas légitime qui passe, puis les chiffres du banc avec n et les échecs. C'est la différence qui "saute aux yeux".
3. **Présenter trois canaux et une voie client B2B** (extension, Snap, API avant retrait pour exchanges/fintech), avec le journal d'audit pour l'auditeur : cela répond à "support, pas produit" (Titouan) et à "viabilité" sans copier Trustee.

## 10. Limites de cette recherche
- Pas de page officielle de Trustee/USETRUSTEE lue (site et Chrome Web Store non trouvés) ; produit actuel connu par une interview du 28 janv. 2026 (déclaratif).
- Jury, grille et déroulé 2025 : non trouvés. Aucune citation de juré.
- Aucune trace de "Secure Horizons" avant 2026 ; aucun gagnant des autres tracks 2025.
- "Mistral" et "RAG" confirmés par la page projet et le résumé TSE ; le détail du RAG non trouvé.
- Nos chiffres de banc sont ceux du filet sans intention (rapport v0, à relire avant de les mettre en slide).
- Les jugements de probabilité sont qualitatifs et subjectifs.

## Sources
- https://www.tse-fr.eu/anais-boughanem-d3s-masters-student-wins-first-prize-ai-hackathon (article TSE, 8 avril 2025) [P]
- https://www.essec.edu/fr/actualites/etudiants-essec-assaut-intelligence-artificielle/ (ESSEC, dates et partenaires 2025) [P]
- https://jaddevvv.github.io/Hackathon-From-LLM-To-Agentic-AI/ (page projet : pile technique) [P]
- https://lespepitestech.com/blog/2026/01/28/364-interview-des-pepites-usetrustee (interview USETRUSTEE, janv. 2026) [P]
- https://github.com/SHAHID1100HACK/scamlens (mention de Trustee comme inspiration) [P]
- https://dauphine.psl.eu/dauphine/media-et-communication/article/hackindau-2024-bravo-aux-equipes-gagnantes (Hackin'Dau 2024) [S]
- Fichiers internes : ctx_ideas.txt, kickoff_slides.md, notion_guide.md, intent-barrier.md, O_barriere_intention.md, R_cas_complexes/SYNTHESE.md, bench/RAPPORT_banc_reel_v0.md, design/REGLES_avertissements.md

## Résumé en 10 lignes
1. Le hackathon 2025 s'appelait "LLM to Agentic AI" (ESSEC, 4-5 avril 2025, 3 tracks) ; "Secure Horizons" n'apparaît dans aucune source publique.
2. Trustee : 5 étudiants, extension Chrome pour eBay, score de risque, signaux, réponses sûres ; pile React, Node, Mistral, AWS, NVIDIA ; premier prix général et track Cyber.
3. Trustee est devenu la startup USETRUSTEE : extension + appli mobile + outil B2B Trust & Safety, freemium (5 requêtes gratuites, 2,99 €/mois) ; aucun client ni traction publiés.
4. Jury 2025, grille 2025, citations de jurés, gagnants des autres tracks : non trouvés ; "la recette gagnante" reste une lecture de l'équipe, pas un fait.
5. Différences structurelles : texte d'annonce contre effet exécutable décodé ; signal probabiliste contre noyau déterministe ; aucune mesure publique de Trustee contre un banc chiffré (limité : c'est le filet sans intention).
6. Trustee présente lui-même l'extension comme un canal parmi d'autres : notre meilleur argument pour "support, pas produit".
7. Risque d'assimilation : surface identique (extension, particulier, avertissement) et organisateurs communs (Utopia, Kryptosphère) ; mais grille Track 1 centrée détection mesurée, réponse, explicabilité.
8. Verdict : probabilité de pénalité moyenne si non cadrée, faible si cadrée dès les 20 premières secondes (jugement subjectif).
9. Trois actions : ouvrir sur le mécanisme "tu as dit / en réalité" pas sur "extension" ; montrer un cas qu'un score de texte ne voit pas puis les chiffres avec échecs ; présenter trois canaux et une voie B2B exchange/portefeuille avec journal d'audit.
10. À ne pas dire : "premier", "Trustee ne mesure rien" (non vérifié), "le Snap bloque", ni attribuer à l'outil complet les chiffres du filet v0.

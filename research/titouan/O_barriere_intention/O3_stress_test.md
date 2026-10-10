# O3 - Stress test de la "barrière d'intention avant l'envoi"

Statut : critique interne, rien construit, aucune recherche web (connaissances MetaMask Snaps / EIP / NIST à vérifier avant le pitch, voir section 8).
Convention : toutes les notes sont des **estimations de juré fictif sur 100 par critère** (pas des points du barème). Conversion en points barème = note/100 x poids. Aucun chiffre de performance n'est inventé : tout chiffre mesuré devra sortir du banc de test de la section 5.

Rappel de l'idée : Snap MetaMask, l'utilisateur déclare une intention parmi 5 (je paie quelqu'un / j'envoie vers mon compte Coinbase / j'achète une crypto / je me connecte à un site / on m'a demandé de le faire), fork Anvil de Fuji + décodage viem simulent "qui reçoit quoi, qui obtient quel droit", alerte si écart avec l'intention. Modèles Clef-flash/Jev (Workers AI) pour l'intention libre.

---

## 0. Verdict global (avant le détail)

Forces réelles : angle original (la simulation classique est aveugle aux droits, pas aux soldes), cadrage "droit accordé" plutôt que "solde changé", démo percutante (drainer neuf non listé).

Failles structurelles, par ordre de gravité :
1. **L'intention est une entrée non fiable fournie par la victime, souvent sous dictée de l'attaquant.** Le contrôle ne vaut que si l'écart intention/effet est détectable ET si l'utilisateur ne peut pas être amené à choisir la bonne case pour la mauvaise raison.
2. **Les 5 intentions ne sont pas du même type.** Les 4 premières contraignent l'effet attendu (testable). "On m'a demandé de le faire" ne contraint rien : c'est le cas d'usage de l'escroc, et c'est paradoxalement l'intention la plus précieuse pour la détection (voir 1.4).
3. **La partie "décodage de ce que la tx fait" est déjà faite par d'autres** (Blockaid, Wallet Guard, Pocket Universe, Rabby, MetaMask natif approve/permit avec "spending cap", Tenderly). La nouveauté est uniquement la comparaison à l'intention déclarée.
4. **Faisabilité technique de l'insertion UX dans MetaMask classique** : à confirmer (section 8).

---

## 1. Juré 1 - Technique crypto

**Question la plus dure** : "Une signature `Permit2`/`permit` EIP-712 ne produit aucune transaction : sur quoi tournent ton fork Anvil ? Et pour une vraie tx, comment distingues-tu un `approve` à un spender légitime (routeur Uniswap) d'un `approve` à un drainer neuf, sans liste noire ?"

**Réponse honnête** :
- Pour une signature hors chaîne, **il n'y a rien à simuler au moment de signer**. Le fork Anvil ne sert qu'à deux choses : (a) vérifier l'état avant (nonce permit, allowance existante, solde, ce qui est exposé), (b) rejouer a posteriori ce qu'un tiers *pourrait* faire avec la signature (appeler `permit` puis `transferFrom` depuis une adresse arbitraire, en forkant l'état). C'est une **simulation contrefactuelle du pire cas**, pas une simulation de l'effet. Il faut l'assumer : "ce que cette signature permet à n'importe qui qui la détient", pas "ce qui va se passer".
- Pour le décodage typed data (EIP-712), il faut un décodeur par schéma connu (`Permit`, `PermitSingle`, `PermitBatch`, `Seaport`, `Order` CoW/1inch, `DaiPermit`) et une règle de repli : domaine/primaryType inconnu => "signature opaque, droit inconnu" (ce n'est pas un échec, c'est un signal fort si l'intention n'est pas "je me connecte" ou "j'achète").
- Spender inconnu : sans liste noire, les signaux disponibles sont : âge du contrat (premier bloc, fonction `eth_getCode`/ explorateur), absence de code source vérifié, bytecode ressemblant à un forwarder/proxy minimal, adresse du spender == bénéficiaire de la tx suivante, EOA vs contrat, pas d'historique d'interactions avec d'autres comptes. Chaque signal est faible ; **le score combiné est une heuristique, pas une preuve**. Le drainer neuf de la démo est précisément le cas où l'âge nul + non vérifié + intention "je paie quelqu'un" qui ne devrait donner aucun droit sur les tokens futurs ressort bien.

**Ce que la barrière ne voit pas** (cas durs, à lister dans le pitch, ça rassure) :
- **Permit hors chaîne** (EIP-2612, Permit2) : voir ci-dessus, l'attaque se produit plus tard, sur un autre canal.
- **Signature aveugle** (`eth_sign`, `personal_sign` d'un hash, ou typed data avec champs opaques bytes/hash) : pas de sémantique. Seule réponse : refus par défaut ou alerte maximale si l'intention n'est pas "je me connecte".
- **Contrat légitime multi-actions** (multicall de routeur, Safe `execTransaction`, bridge, aggregator) : effet = plusieurs transferts + approbations en une tx. L'écart intention/effet doit être calculé sur l'**ensemble** des effets (balance diffs + approbations + changements d'opérateur + delegatecall), pas sur le premier événement.
- **Effets différés/conditionnels** : contrat qui se comporte bien dans le fork, mal en production (dépendance à `block.timestamp`, `tx.origin`, `block.number`, `COINBASE`, ou à l'état modifié par une tx front-run). Un attaquant qui connaît la simulation peut détecter le fork (différence de chain ID, de `blockhash`, de solde de `address(this)`, d'un oracle) et se comporter différemment. C'est un **vecteur d'évasion connu de toutes les simulations**. À avouer.
- **Upgradeable proxies** : le contrat simulé aujourd'hui peut être upgradé après la simulation (ou entre simulation et inclusion).
- **EIP-7702 (délégation de compte EOA)** : une signature d'autorisation de délégation est un blanc-seing d'exécution de code. Si Avalanche C-Chain l'a adopté (à vérifier, Avalanche a suivi Pectra via Octane/Etna ? incertain), c'est le nouveau "permit" de l'année et il faut le décoder.
- **Approvals `setApprovalForAll` NFT**, `increaseAllowance`, Permit2 allowance `approve(token, spender, amount, expiration)` : à couvrir explicitement.
- **Phishing de tx sur un autre domaine que l'intention** : "je me connecte à un site" ne dit pas quel site est légitime, donc la barrière ne détecte pas un faux site qui demande une signature de connexion inoffensive (SIWE) puis une tx classique.

**Notes estimées (sur 100 par critère)** :
| Critère | Note | Pourquoi |
|---|---|---|
| Détection | 55 | Bon sur approve/permit en tx, trou sur off-chain et évasion de fork |
| Réponse | 50 | Alerte seulement, pas de remédiation sauf "révoquer" |
| Faisabilité | 45 | Anvil côté serveur, décodage viem OK, mais Snap + latence |
| NIST | 55 | Mapping propre possible |
| Pitch | 60 | Angle "droit, pas solde" est fort |

**Ce qui ferait monter** : (a) taxonomie explicite "ce qu'on voit / ce qu'on ne voit pas" en une slide (honnêteté = crédibilité), (b) simulation contrefactuelle de permit (pire cas) démontrée, (c) règle "signature opaque => alerte max sauf intention connexion", (d) test de détection d'évasion de fork (au moins mentionner), (e) couverture explicite Permit2/setApprovalForAll/EIP-7702.

---

## 2. Juré 2 - Produit / UX

**Question la plus dure** : "Tu demandes à un utilisateur de cliquer une intention avant chaque transaction. Au bout de 3 jours il clique toujours la même. Quelle est la valeur ajoutée du clic, et que se passe-t-il quand l'escroc au téléphone lui dit quoi cliquer ?"

**Réponse honnête** :
- **L'habituation est le risque numéro un du produit**, plus que la précision du modèle. La littérature de sécurité utilisable (alertes de navigateur, UAC, Safe Browsing) montre que les avertissements répétés sont ignorés ; je n'ai pas de chiffre sourcé ici et je n'en invente pas. À citer : travaux d'Akhawe & Felt sur les avertissements SSL (à vérifier avant citation).
- Le clic d'intention est **un coût fixe appliqué à 100% des transactions pour protéger les 0,x% malveillantes**. Il faut donc le rendre **conditionnel** : pas de question si la tx est d'un type "boring" (transfert simple vers un contact déjà connu, swap sur routeur connu, montant faible). La question n'apparaît que sur un déclencheur de risque (nouveau destinataire, approve/permit, contrat jamais vu, montant au-dessus d'un seuil personnel, signature opaque). Mesure obligatoire : **fraction de transactions qui déclenchent la barrière** sur le jeu de test (section 5).
- Variante meilleure que "choisir parmi 5" : **pré-remplir l'intention par inférence** (le décodage dit "c'est un swap") et demander "c'est bien ce que tu veux faire ?" uniquement si divergence. Mais alors on perd l'indépendance de l'intention déclarée (l'utilisateur confirme ce qu'on lui suggère, biais d'acquiescement). Compromis : question ouverte + 2 options **non pré-cochées**.
- **Friction par design** : casser l'habituation par un choix actif (pas un bouton "OK"), un message spécifique au risque ("ce contrat pourra dépenser tous tes USDC, pour toujours"), et une variation du wording. Pas de gain prouvé sans test ; l'annoncer comme hypothèse.
- Taux de faux positifs : sur Fuji testnet il n'y a presque pas de trafic réel, donc **tout taux de faux positifs mesuré sera sur un jeu synthétique**. À dire clairement. Ne jamais affirmer "x% de faux positifs en production".

**Notes estimées** :
| Critère | Note | Pourquoi |
|---|---|---|
| Détection | 50 | Dépend de l'honnêteté de l'intention |
| Réponse | 55 | Friction bien pensée possible |
| Faisabilité | 50 | UX dans Snap limitée (voir 8) |
| NIST | 50 | Hors sujet pour lui |
| Pitch | 65 | Narratif clair pour grand public |

**Ce qui ferait monter** : déclenchement conditionnel chiffré sur le jeu de test (% de tx qui interrompent), maquette d'une alerte spécifique (pas générique), test d'habituation même minimal (5 testeurs, 20 tx, mesurer si l'alerte rare est mieux lue qu'une alerte fréquente, et dire que n=5 est anecdotique), mode "apprentissage" qui construit la liste des contrats habituels de l'utilisateur.

---

## 3. Juré 3 - Conformité / risque

**Question la plus dure** : "Où est la preuve que ton contrôle fonctionne, qui en est responsable, et que fais-tu des données (intentions + transactions envoyées à un serveur Anvil + des prompts envoyés à Cloudflare) ? Ton outil a-t-il un mode d'échec sûr : si le serveur tombe, la tx passe ou est bloquée ?"

**Réponse honnête** :
- **Fail-open vs fail-closed** : décision à documenter. Pour un wallet grand public, fail-open avec avertissement visible "vérification indisponible" (sinon on bloque l'accès aux fonds, un risque de disponibilité). Cela réduit la sécurité mais est justifiable ; l'écrire.
- **Données** : l'adresse du wallet, le calldata, l'intention en texte libre partent vers un backend. C'est de la donnée personnelle (adresse publique liée à un utilisateur = donnée personnelle au sens RGPD selon les lignes directrices EDPB sur blockchain, à vérifier). Minimisation : n'envoyer que calldata + to + chainId (déjà public à terme), jamais l'intention en texte libre sans consentement, pas de journal persistant d'intentions. Le texte libre vers Workers AI est le point sensible ; proposer **intention par boutons par défaut, texte libre en option** et expliquer.
- **Explicabilité** : une alerte doit citer l'écart ("tu as dit : je paie quelqu'un ; cette signature donne à 0xabc le droit de dépenser tous tes USDC"). C'est bon pour l'auditabilité.
- **Gouvernance du modèle** : un LLM qui interprète l'intention est une surface de **prompt injection** (le texte libre de l'utilisateur ou, pire, des données de la tx/du site : nom de token, `description` d'un message signé, memo) pouvant détourner le classifieur. Règle : le LLM ne prend **jamais de décision de sécurité** ; il normalise l'intention en une catégorie parmi un ensemble fermé, la décision est faite par règles déterministes sur l'effet décodé. Sortie du LLM validée contre un schéma, aucun contenu de la tx dans le prompt.
- **Responsabilité** : un faux négatif (le drainer passe) engage l'image du produit ; ne pas promettre de garantie. Formulation honnête : "réduit le risque, ne l'élimine pas".

**Notes estimées** :
| Critère | Note | Pourquoi |
|---|---|---|
| Détection | 50 | Mesure à produire |
| Réponse | 55 | Explicabilité bonne |
| Faisabilité | 50 | |
| NIST | 60 | Mapping crédible, preuves à fournir |
| Pitch | 55 | |

**Ce qui ferait monter** : tableau fail-open/fail-closed assumé, schéma de flux de données avec ce qui sort du navigateur, LLM cantonné à une classification fermée (anti prompt-injection), journal local seulement, une page "limites et non-garanties", registre de risques résiduels.

---

## 4. Juré 4 - Investisseur

**Question la plus dure** : "Blockaid est dans MetaMask (via Security Alerts), Wallet Guard, Pocket Universe, Rabby font déjà de la simulation et du blocage de signatures. Pourquoi une équipe de 36h battrait ça, et comment ça devient un business ?"

**Réponse honnête** :
- Ne **pas** prétendre battre Blockaid sur la détection. Différenciation défendable : (1) **détection sans liste noire** (zero-day, drainer neuf : c'est la démo) ; (2) **intention comme second canal indépendant du contrat** (même un contrat inconnu est jugé sur l'écart, pas sur sa réputation) ; (3) cible : l'utilisateur non-expert, ciblé par ingénierie sociale, que les alertes techniques ne protègent pas.
- Soyons clairs : MetaMask a déjà des alertes de sécurité transactionnelles et des plafonds de dépense sur approve (à vérifier version actuelle), donc la barrière n'est pas une nouveauté absolue côté "approve" ; l'élément nouveau est l'**intention**.
- Modèle économique : B2B2C (intégration wallets, exchanges, banques crypto, assureurs qui veulent baisser les sinistres), pas un abonnement grand public d'extension. Le Snap est la vitrine, le moteur (intention vs effet) est l'actif. Aucun chiffre de marché cité ici.
- Moat faible : le concept est copiable en semaines. Défendable seulement par le jeu de données (paires intention/effet/issue) et la distribution.

**Notes estimées** :
| Critère | Note | Pourquoi |
|---|---|---|
| Détection | 55 | |
| Réponse | 50 | |
| Faisabilité | 45 | Hackathon, pas de pilote |
| NIST | 40 | Peu sensible |
| Pitch | 60 | Bonne histoire, concurrence à adresser |

**Ce qui ferait monter** : slide concurrentielle honnête avec ce que la concurrence fait et ne fait pas (sans prétendre à des fonctions non vérifiées), un chiffre mesuré de démo (drainer neuf détecté vs outil de réputation seule), un chemin de distribution (Snap + SDK).

---

## 5. Juré 5 - "C'est juste un pop-up"

**Question la plus dure** : "Une fenêtre qui demande 'qu'est-ce que tu fais ?' puis qui s'affiche en rouge. C'est ce que les gens ferment sans lire depuis 20 ans. Qu'y a-t-il de plus qu'un pop-up ?"

**Réponse honnête** : si la valeur se réduit à l'affichage, il a raison. Ce qui n'est pas un pop-up :
1. **Le calcul** : traduction calldata/typed data en "droit accordé" lisible + contre-simulation du pire cas (qui peut prendre quoi, jusqu'à quand, quel montant). Un pop-up natif dit "autoriser la dépense", pas "ce contrat inconnu créé il y a 0 bloc pourra vider tes USDC sans limite".
2. **Le moteur de décision** : écart intention/effet = règle, pas un texte générique.
3. **La graduation de la réponse** : message d'info, avertissement avec action requise (retaper un mot, délai de quelques secondes, seconde confirmation différente), et pour les cas les plus graves **blocage avec contournement coûteux** (ex. délai + re-saisie du montant). La friction proportionnée est la partie "réponse" du barème.
4. **Le comportement sous pression** : voir 6.1.

Mais il faut assumer : **si on ne mesure pas que les gens changent de comportement, c'est un pop-up**. Seule parade : mesurer (même en petit) l'effet de l'alerte sur la décision de testeurs.

**Notes estimées** : Détection 45, Réponse 40, Faisabilité 55, NIST 40, Pitch 45 (le juré sceptique ne note pas haut ; il sert à calibrer).
**Ce qui ferait monter** : une démo où l'alerte change l'issue chez un testeur piégé par un faux support (même 3-5 personnes, présenté comme illustratif), et une alerte qui n'est pas qu'un texte (délai, re-saisie, révocation en un clic).

---

# 6. Les quatre axes de stress demandés

## 6.1 Intention fausse ou dictée par l'escroc

Scénarios :
- **A. Faux support dicte la case** : "clique 'je me connecte à un site' et signe". La barrière compare : effet = permit de dépense de tokens, intention = connexion => alerte forte. **Ça marche car l'escroc dicte une intention mensongère mais ne contrôle pas l'effet.** L'écart reste détectable. C'est le bon argument.
- **B. L'escroc dicte une intention vraie mais l'effet frauduleux est conforme** : "envoie tes fonds vers ce 'compte sécurisé'" => intention "je paie quelqu'un" / "j'envoie vers mon compte Coinbase", effet = transfert vers une adresse. Aucun écart. **La barrière ne voit rien**, car la tx fait exactement ce que la victime croit faire. Cas typique de la fraude au faux conseiller. Limite fondamentale, à avouer.
- **C. Adresse empoisonnée** : intention "j'envoie vers mon compte Coinbase" mais adresse copiée dans l'historique = similaire (préfixe/suffixe) à une adresse connue. Détectable : comparaison à l'historique du compte (dernières destinations, similarité début/fin de l'adresse sans être égale), alerte "cette adresse ressemble à X mais n'est pas X". Fonctionne **sans** que l'intention soit fausse.
- **D. "On m'a demandé de le faire"** : c'est le signal d'ingénierie sociale auto-déclaré. Traiter cette case comme **l'intention à plus haut niveau de suspicion**, pas comme une intention neutre : active un mode "pause" (délai, questions de qualification : *qui t'a demandé ? l'as-tu contacté toi-même ? on t'a dit de ne pas en parler ou d'aller vite ?*), et durcit tous les seuils. Un escroc qui coache la victime lui dira de **ne pas** cocher cette case : la victime doit être préparée en amont ("si on te dicte quoi cliquer, c'est le signal"), ce qui est de l'éducation, pas de la détection.

**Comment s'en sortir (principes)** :
1. **Ne pas faire reposer la détection sur l'honnêteté de l'intention** : l'intention sert à sélectionner des *attentes* sur l'effet, l'alerte déclenche sur ce qui dépasse **toute** intention raisonnable (droit illimité, spender neuf, destinataire inconnu + montant élevé). Une partie de la détection est donc indépendante de l'intention (filet de sécurité).
2. **Intention comme contrainte qui se resserre** : la même tx, déclarée "je paie quelqu'un", ne doit jamais accorder un droit persistant. Donc "paiement" => zéro approve/permit toléré. Les intentions les plus larges ("j'achète une crypto" => swap, approve du routeur plafonné au montant) tolèrent plus.
3. **Question-piège contextuelle** à l'utilisateur : poser une question *dont la réponse ne peut pas être soufflée par l'escroc à coup sûr* est difficile ; mais on peut poser des questions de qualification ("as-tu déjà envoyé à cette adresse ?", "cette personne te l'a-t-elle donnée par téléphone/chat ?"). Réponse "oui par téléphone" + adresse inconnue + montant élevé => pause.
4. **Délai de refroidissement** (cooling-off) sur nouvelle adresse + gros montant : défense la plus efficace contre l'urgence artificielle de l'escroc, indépendante de l'intention. Option : contact de confiance (second signataire / notification à un proche), à mentionner comme extension.
5. **Mesurer le scénario B comme limite** : le dire dans le pitch avec le jeu de test (il sera "non détecté" : c'est honnête et crédibilise).

## 6.2 Fatigue d'alerte, faux positifs, friction

- Définir deux métriques **mesurables sur le jeu de test** : (i) taux d'interruption = tx qui déclenchent la barrière / tx totales ; (ii) taux de faux positifs = alertes sur tx bénignes / tx bénignes. Dénominateurs explicites. Pas de chiffre publié avant mesure.
- **Clic d'intention uniquement sur déclencheur de risque** (voir juré 2). Le reste : silencieux.
- **Alertes graduées** : info (ligne grise), attention (jaune, action requise), blocage (rouge, contournement coûteux). Limiter le rouge à une classe étroite (permit/approve illimité vers contrat inconnu et neuf ; signature opaque).
- **Mémoire de confiance locale** : après qu'un contrat/adresse a été confirmé N fois sans incident, il ne déclenche plus (attention : cela ouvre l'attaque "contrat devenu malveillant après upgrade" ; lier la confiance au bytecode/implémentation, pas seulement à l'adresse).
- **Alerte "dernière chance" rare** pour qu'elle garde du poids.
- Coût en friction à mesurer : nombre de clics ajoutés et temps ajouté par tx de chaque catégorie (mesure triviale, chiffrable en démo).
- Ne pas confondre "faux positif" (alerte inutile sur tx bénigne) et "écart légitime" (l'utilisateur a mal déclaré son intention par flemme : c'est un faux positif *causé par le design* ; le comptabiliser séparément, c'est la métrique qui montre le coût du clic d'intention).

## 6.3 Ce que la barrière ne peut pas voir (synthèse)

| Zone aveugle | Pourquoi | Atténuation possible |
|---|---|---|
| Permit/Permit2 hors chaîne | Pas de tx à simuler | Décodage typed data + simulation contrefactuelle du pire cas |
| EIP-712 aveugle / opaque, `eth_sign` | Pas de sémantique | Alerte par défaut, refus sauf connexion déclarée |
| Contrat légitime multi-effets | Effets agrégés dans un multicall | Écart calculé sur l'ensemble des effets (diffs + droits) |
| Contrat qui détecte le fork | Évasion de simulation | Reconnaître la limite ; durcir le fork (chainId réel, blockhash, valeurs réalistes) |
| Upgrade après simulation | Proxy modifiable | Marquer "proxy upgradeable" comme risque, lier la confiance au bytecode |
| Fraude "conforme" (B ci-dessus) | Effet = intention | Cooling-off, nouvelle adresse + montant, qualification |
| Faux site + signature inoffensive puis tx | Hors périmètre de la tx courante | Contexte d'origine (domaine) et historique de session |
| Compromission du Snap ou du backend | Supply chain | Voir NIST GV.SC |
| Attaque sur autre chaîne que Fuji | Périmètre démo | Dire que la démo est Fuji, l'architecture est chain-agnostic sous réserve |

## 6.4 Prouver la détection en 36h, de façon mesurable (sans chiffre inventé)

**Principe** : tout chiffre vient d'un jeu de test construit, versionné, et publié avec ses limites. La note Détection monte si le juré voit **un protocole**, pas un score impressionnant.

**Jeu de test (à constituer, sans rien présumer de sa taille réelle)** :
- *Malveillants (positifs)* : (1) `approve` illimité vers contrat neuf ; (2) `increaseAllowance` ; (3) `setApprovalForAll` ; (4) `permit` EIP-2612 hors chaîne ; (5) Permit2 `PermitSingle`/`PermitBatch` ; (6) transfert vers adresse empoisonnée (vanity qui imite préfixe/suffixe) ; (7) multicall mêlant un swap normal et un approve caché ; (8) signature opaque ; (9) drainer neuf déployé sur Fuji (variantes de bytecode pour éviter toute dépendance à une signature connue) ; (10) variante "évasion de fork" (contrat testant `chainid`/`blockhash`) : attendu = **raté**, à rapporter tel quel.
- *Bénins (négatifs)* : transfert simple vers contact connu, swap via routeur connu avec approve plafonné, connexion SIWE, mint NFT, bridge, Safe `execTransaction` légitime, approve légitime vers protocole connu, signature de commande (CoW/Seaport) légitime.
- *Scénario d'intention* : chaque cas étiqueté avec (intention honnête, intention mensongère dictée, intention absente) pour séparer "détection par écart" de "détection indépendante de l'intention".

**Métriques (définitions, valeurs à mesurer)** :
1. Rappel par classe d'attaque (détectés / total de la classe), avec dénominateur affiché (un 4/5 vaut mieux qu'un "80%" cachant n=5).
2. Taux de faux positifs sur les bénins (idem, dénominateur affiché).
3. **Détection indépendante de l'intention** vs **dépendante de l'intention** : montre la valeur ajoutée du clic. Comparer 3 bras : (a) règles seules sans intention, (b) règles + intention honnête, (c) règles + intention mensongère. Si (c) ≈ (a), l'intention n'apporte rien contre l'escroc ; si (b) > (a) sur des classes précises, on prouve l'apport. **Résultat honnête possible : l'apport de l'intention est faible, ce qui est une trouvaille à publier.**
4. Comparaison à une base de référence : simulation "solde seulement" (voir si le permit passe) et, si accessible, une liste noire (le drainer neuf n'y est pas). Ne pas affirmer de performance d'un tiers sans l'avoir exécuté.
5. Latence de bout en bout (p50/p95 sur N exécutions mesurées) : pertinent car la tx attend la simulation.
6. Taux d'interruption (section 6.2) et clics/temps ajoutés.
7. Reproductibilité : un script unique qui rejoue le jeu de test et sort un tableau ; seed fixée ; commit figé du fork Fuji (block number épinglé).

**Ce qui remonte Faisabilité (bloquée à 10/20 = 50/100)** :
- Retirer les trois risques techniques majeurs par un **prototype minimal de bout en bout sur UN cas** (hors périmètre de ce document de ne rien construire, mais c'est la recommandation) : Snap affichant une insight sur une vraie tx Fuji -> appel backend -> Anvil -> décodage viem -> alerte. Un seul chemin qui marche vaut mieux que 5 intentions à moitié.
- **Trancher tôt le point Snap** (8) : si l'API insight ne permet pas la question d'intention *avant* l'écran de confirmation, replier sur "l'intention se choisit dans l'insight de la tx, avec re-rendu de l'alerte sur sélection" ; ou sur un dApp compagnon. Un plan B documenté compte pour la faisabilité.
- Budget latence/hébergement chiffré à partir de mesures (un fork Anvil par requête vs un fork persistant avec snapshots `evm_snapshot`/`evm_revert` : décision à documenter).
- Périmètre réduit explicite : 3 intentions au lieu de 5 si besoin, 4 classes d'attaque, Fuji seulement. Réduire le périmètre **augmente** la note de faisabilité et diminue peu la détection si la démo est nette.
- Dégradation gracieuse (backend indisponible => avertissement).

**Ce qui remonte Détection (18/30 = 60/100)** :
- Couvrir la **classe permit hors chaîne** (c'est l'argument central : sans elle, l'idée ne diffère pas d'un simulateur classique).
- Le tableau à 3 bras (3. ci-dessus) : preuve que la détection ne repose pas sur la liste noire ni sur l'honnêteté.
- Montrer un échec assumé (évasion de fork, fraude conforme) : un jury technique note mieux une limite connue qu'une couverture prétendue complète.
- Détection d'adresse empoisonnée via l'historique : peu coûteuse, très démonstrative.
- Signaux de contrat neuf combinés (âge, source non vérifiée, forwarder/proxy minimal) plutôt qu'un seul.

---

# 7. Angle NIST CSF 2.0 et ATT&CK / D3FEND

**Honnêteté préalable** : NIST CSF 2.0 vise des organisations, pas un produit grand public. L'angle crédible est : "le produit est un contrôle qui aide un *déployeur* (wallet, exchange, entreprise détenant des actifs numériques, ou l'utilisateur en tant que sa propre organisation) à satisfaire des résultats CSF". Mapper sans forcer. Identifiants à vérifier dans le document officiel avant le pitch ; je cite de mémoire.

| Fonction | Catégorie (de mémoire, à vérifier) | Lien concret |
|---|---|---|
| **PROTECT (PR)** | PR.AA Identity Management, Authentication, Access Control | La signature est un acte d'autorisation ; la barrière contrôle que l'autorisation accordée correspond à l'intention (moindre privilège sur les approvals) |
| PR | PR.AT Awareness and Training | Message contextuel au moment de la décision ; le signal "on m'a demandé" sert d'éducation in situ |
| PR | PR.PS Platform Security | Durcissement du wallet par un contrôle supplémentaire (Snap) |
| PR | PR.DS Data Security | Minimisation des données envoyées au backend, confidentialité de l'intention |
| **DETECT (DE)** | DE.CM Continuous Monitoring | Surveillance de chaque demande de signature/tx en continu |
| DE | DE.AE Adverse Event Analysis | Analyse de l'écart intention/effet, corrélation de signaux (âge du contrat, similarité d'adresse) |
| **RESPOND (RS)** | RS.MA Incident Management / RS.MI Incident Mitigation | Blocage, délai, remédiation proposée (révoquer l'approval) |
| **RECOVER (RC)** | RC (limité) | Révocation d'approvals existants : à ne revendiquer que si implémenté |
| **GOVERN (GV)** | GV.RM Risk Management Strategy ; GV.SC Cybersecurity Supply Chain Risk Management ; GV.PO Policy | Documenter le risque résiduel, fail-open/closed, dépendances (Cloudflare, RPC, viem, Anvil), politique de données |
| **IDENTIFY (ID)** | ID.RA Risk Assessment | Modèle de menace des signatures piège, jeu de test = évaluation de risque documentée |

Conseil : insister sur **PR.AA + DE.AE + DE.CM** et cantonner GV/ID à "ce que nous avons documenté". Annoncer ce qu'on **ne** couvre pas (Recover quasi nul). Un mapping modeste et vrai note mieux qu'une couverture totale douteuse. Note conformité probable après ajustements : voir tableau final.

**ATT&CK (techniques plausibles, à vérifier les IDs)** : le référentiel Enterprise couvre mal le crypto ; mapper par analogie et le dire.
- T1566 Phishing (leurre menant à la signature) ; T1204 User Execution (l'utilisateur exécute l'action malveillante en signant) ; T1656 Impersonation (faux support) ; T1598 Phishing for Information (si collecte de seed, hors périmètre) ; T1534 Internal Spearphishing non pertinent.
- Impact/exfil : T1657 Financial Theft (existe dans ATT&CK Enterprise récent, à confirmer).
- Il n'y a **pas** de technique ATT&CK propre à "token approval abuse" : le signaler ; proposer un libellé propre au projet plutôt que forcer un ID.

**D3FEND (contre-mesures plausibles, à vérifier les noms)** : User Behavior Analysis / Operational Activity Mapping (comparer comportement à intention), Message Analysis / Content Validation (validation du contenu signé), Execution Isolation / Sandboxing (analogue : exécution dans un fork isolé, c'est bien la logique d'une détonation en bac à sable), Identifier Analysis (analyse d'adresses/contrats), Authentication Event Thresholding hors sujet. Mapper "fork Anvil = bac à sable de détonation de la transaction avant exécution réelle" est l'image la plus parlante ; elle reste une analogie.

---

# 8. Points à vérifier avant le pitch (je n'ai pas fait de recherche web)

1. **API Snap MetaMask** : existence et limites de `onTransaction` (insight), `onSignature` (insight pour signatures), UI interactive (inputs, boutons, `snap_dialog`) *dans* l'insight, niveau de sévérité `critical`, capacité à demander l'intention **avant** l'écran de confirmation vs dans l'écran. Un Snap **ne peut pas bloquer** une tx ; il affiche. Vérifier aussi les permissions `endowment:network-access`, et la politique de listing/audit MetaMask pour Snaps (sideload possible en démo).
2. Compatibilité Fuji (chaîne personnalisée) : les insights fonctionnent-ils sur réseau custom ? Support EIP-7702 sur Avalanche.
3. Fonctions actuelles de MetaMask : alertes de sécurité natives (Blockaid), plafonds d'approbation, affichage des permit/typed data. Ne pas affirmer qu'ils n'ont rien.
4. Références académiques sur l'habituation aux alertes : citer seulement après lecture.
5. Identifiants NIST CSF 2.0, ATT&CK, D3FEND : confirmer.
6. Disponibilité et conditions de Clef-flash/Jev sur Workers AI (latence, coût, limite de sortie) ; le LLM ne doit rien décider, seulement classer.

---

# 9. Tableau final de notes estimées (moyenne des jurés, sur 100 par critère) et conversion barème

Notes **actuelles** (estimation moyenne des 5 jurés, avec les faiblesses non traitées) puis **cibles réalistes** si les recommandations sont appliquées. Ces notes sont des jugements, pas des mesures.

| Critère (poids) | Actuel /100 | Cible réaliste /100 | Levier principal |
|---|---|---|---|
| Détection (30) | 60 (=18/30) | 70-75 | Permit hors chaîne + tableau 3 bras + échecs assumés |
| Réponse (20) | 50 | 65 | Alertes graduées, friction proportionnée, révocation 1 clic, mode "on m'a demandé" |
| Faisabilité (20) | 50 (=10/20) | 65-70 | Prototype 1 chemin bout en bout, périmètre réduit, plan B Snap, latence mesurée |
| NIST CSF 2.0 (15) | 55 | 65-70 | Mapping modeste PR.AA/DE.AE/DE.CM + GV, limites dites |
| Pitch (15) | 60 | 70 | Démo drainer neuf, slide "ce qu'on voit / ne voit pas", comparaison honnête |

---

## Résumé en 8 lignes

1. Le cœur de valeur est "droit accordé vs intention", pas la simulation de solde ; il faut le répéter et ne pas prétendre battre Blockaid sur la réputation.
2. Faille majeure : l'intention est déclarée par la victime, souvent sous dictée ; l'écart reste détectable si l'escroc ment (cas A) mais la fraude "conforme" (cas B) est invisible : à avouer.
3. Garder un filet de détection indépendant de l'intention (spender neuf, droit illimité, signature opaque) et traiter "on m'a demandé de le faire" comme le signal de plus haut risque, avec cooling-off.
4. Fatigue d'alerte : question conditionnelle (déclencheurs de risque), alertes graduées, mesure du taux d'interruption et des faux positifs avec dénominateurs ; aucun taux de production annoncé sur testnet.
5. Angles morts à afficher : permit hors chaîne (traiter par simulation contrefactuelle du pire cas), EIP-712 opaque, multicall, évasion de fork, proxies upgradeables, EIP-7702.
6. Preuve en 36h : jeu de test étiqueté (malveillants/bénins/évasions), 3 bras (sans intention, intention honnête, intention mensongère), rappel par classe avec n affiché, script de rejeu, bloc Fuji épinglé.
7. Faisabilité (10/20) : un seul chemin bout en bout avant d'élargir, périmètre réduit, plan B si l'API Snap n'autorise pas la question avant confirmation ; Détection (18/30) : couvrir permit hors chaîne et publier les échecs.
8. NIST CSF 2.0 : PR.AA, DE.AE, DE.CM en cœur, GV en soutien ; ATT&CK T1566/T1204/T1656 par analogie, D3FEND "bac à sable de détonation" ; IDs à vérifier, aucune recherche web faite ici.

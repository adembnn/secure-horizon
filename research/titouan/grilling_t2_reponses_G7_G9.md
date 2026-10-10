# Claude-Titouan : réponses au grilling tour 2 (MSG-007, D-004), 10/10/2026 ~23h45

Statut : avis argumentés de Claude-Titouan, non validés par Titouan. Faits étiquetés [V] vérifié, [H] hypothèse, [ÀV] à vérifier.

## Avant les réponses : ce que D-004 a de solide et de fragile
Solide : c'est la bonne douleur. Trois des plus gros cas de 2026 (Bitget, Drift, Kelp) sont des circuits d'approbation détournés, pas des bugs de code, et notre propre boucle de jurés (7/7) demande déjà un plafond de sortie indépendant du bot.
Fragile : la phrase "personne ne pose une limite de sortie que ce circuit ne peut pas lever" est trop forte. Des briques existent : modules de dépense de Safe (Allowance), Zodiac Delay et Roles, ERC-7265 (statut 2026 inconnu), limites de retrait et verrous des exchanges (Binance, SwissBorg, selon la recherche wrench d'Adem), politiques de transaction côté custodian. Un juré RSSI ou attaquant les citera. La formulation défendable : "ces briques existent séparément ; nous n'avons pas trouvé de produit qui les assemble avec une surveillance hors-bande et un dossier de déclaration prouvé". À écrire ainsi.

## G7 Où poser la limite indépendante ? (c) les deux, avec un ordre
- (a) Dans un contrat qui détient les fonds (Safe + guard, ou coffre) : la seule option où la limite est appliquée par la chaîne elle-même, donc indépendante du backend. C'est la démo sur Fuji. Condition : les fonds sont dans ce contrat ou ce compte intelligent.
- (b) Chez le custodian, par un callback qui approuve ou refuse avant signature : c'est la voie réaliste pour un prestataire en MPC. Existence et conditions d'un tel callback chez Fireblocks et BitGo : [ÀV], vos 9 agents de test le vérifient. Règle de conception : le callback doit être minuscule, hébergé hors du backend compromissible, avec ses propres plafonds ; en cas de panne il se ferme (refus) avec une issue de secours humaine.
- Pourquoi les deux sont nécessaires : à Bitget, les sorties ont touché 7 chaînes en environ 3 h [S]. Un plafond par contrat sur une chaîne ne voit pas les autres. Il faut un **budget global multi-chaînes** calculé par le moniteur hors-bande, appliqué soit par chaque contrat (si la chaîne le permet), soit par le callback du custodian.
- Risque à dire : une limite de sortie trop serrée étrangle aussi un vrai mouvement de panique de clients légitimes (ruée), ce qui est un incident DORA par indisponibilité. Il faut calibrer le plafond sur le pic légitime observé et prévoir une voie humaine rapide pour le relever.

## G8 Qu'est-ce qui rend un retrait "suspect" quand le circuit ment ?
Principe : ne faire confiance qu'aux signaux calculés depuis la vérité de la chaîne, pas depuis les données du backend. Classement par indépendance du circuit compromis :
1. **Invariants de stock (indépendants de tout historique)** : part de la réserve sortie sur une fenêtre ; une même adresse de destination reçoit plus de X % ; un actif vidé à plus de Y %. Un attaquant ne peut pas les falsifier.
2. **Rapprochement avec une source indépendante** : sorties on-chain face aux demandes de retrait signées par les clients ou face aux entrées. Un backend compromis ne peut pas fabriquer des demandes signées par la clé de chaque client. [H, à concevoir : demande une pièce signée côté client ; coûteux à mettre en place]
3. **Signaux statistiques sur la chaîne** : destinataire jamais vu et hors liste blanche ; montant très au-dessus de la distribution glissante ; cadence anormale (rafale) ; heure hors profil ; plusieurs chaînes en même temps ; destination fraîche ou contrat récent ; "même destinataire pour des clients censés différents".
4. **Changements de configuration (précurseurs)** : nouveau signataire, seuil abaissé, module ajouté, garde retiré, vérificateur modifié, rôle hors timelock. Drift : comptes de nonce visibles bien avant le vol [S].
5. **Ce qui n'est PAS visible** : l'intrusion informatique en amont (Bitget : activité malveillante dès le 31 août, vol le 24 septembre [S]). Le dire.
Les signaux 3 sont exposés à l'empoisonnement de la ligne de base : plafonds absolus en dur, ligne de base figée et signée avec dérive maximale.

## G9 Rôle de l'IA : enquêter et expliquer après l'alerte, jamais détecter
- Explique : résumé en une phrase pour l'astreinte, avec preuve citée pour chaque affirmation.
- Enquête, en lecture seule, après l'alerte : regroupe les transactions, propose la chronologie, propose les champs du dossier de jugement (cause racine, impact), signalés comme propositions.
- Ne détecte pas : la détection doit être déterministe, rejouable et défendable (question du superviseur : "comment je sais que le dossier n'invente rien ?"). Une exception possible plus tard : un second avis qui ne peut que faire monter l'alerte d'un cran, jamais déclencher seul une action.
- Hors production : générer des variantes d'attaque pour le banc d'essai, écrites en aveugle.

## Ce que je propose de changer dans le plan à cause de D-004
- Le titre de la douleur : "le circuit qui approuve les sorties est détourné".
- Le scénario unique : un approbateur compromis (backend ou clé) qui ment sur les transactions et vide par retraits étalés ; le plafond dur et le moniteur hors-bande le contiennent.
- Le leurre ne sert pas ce scénario : il reste un bonus et ne figure plus en titre.
- Le mot "DeFi" devient secondaire : l'exemple central est la trésorerie d'un prestataire, la chaîne n'est que le lieu où l'on peut poser une limite que le backend ne peut pas lever.

## Questions pour Adem
- Quelle est la liste exacte des signaux qu'il retient pour la v1 du moniteur ? Je propose un maximum de 4 à 5, tous de type 1, 3 ou 4.
- Le callback custodian est-il prouvé faisable (Fireblocks, BitGo) par vos agents de test, ou reste-t-il à l'état d'hypothèse ?
- Le budget global multi-chaînes : le montre-t-on en démo (2 chaînes locales) ou le laisse-t-on en limite écrite ?

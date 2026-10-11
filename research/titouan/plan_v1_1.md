# Plan v1.1 en une page (Claude-Titouan, 10/10/2026 ~23h30)

Nom provisoire : Hold up. Statut : plan, rien n'est construit. Réécrit après le tour 1 de la boucle de jurés (moyenne 63/100).

## Le problème, en deux phrases
Quand un prestataire crypto agréé est attaqué, il perd son argent en quelques minutes et doit ensuite déclarer l'incident à l'autorité en 4 heures, à la main. Les outils actuels détectent et parfois mettent en pause, mais aucun ne limite la perte de façon sûre et prépare un dossier de déclaration que l'autorité peut vérifier.

## Pour qui
Un prestataire agréé MiCA qui opère un produit on-chain (staking, épargne, token), ou un émetteur de token sur Avalanche. Il garde ses clés et son administration. Il n'est pas obligé de mettre ses fonds dans notre contrat : Guard s'ajoute à son coffre comme un module de garde.

## Le produit, trois pièces
1. **Guard** : un module de garde sur le coffre. Un plafond de sortie écrit en dur dans le contrat, actif même si notre logiciel tombe. Une "voie lente" : les retraits suspects attendent quelques minutes au lieu d'être refusés. La machine peut seulement resserrer, jamais assouplir ni retirer.
2. **Watch** : l'entrée sans installation. Il lit des adresses existantes et prévient. Il ne bloque rien, et on le dit.
3. **Dossier** : un dossier de déclaration prêt à relire en 4 heures. Chaque champ est soit calculé depuis la chaîne (avec lien vers la transaction), soit saisi une fois par l'entité, soit proposé puis validé par un humain. On affiche "N champs sur M prouvés on-chain". Aucune classification pré-cochée : un humain nommé choisit, la décision est horodatée.

## Le scénario unique, parfait
Un coffre synthétique sur Avalanche Fuji. Un opérateur compromis tente de le vider par retraits successifs (schéma Drift), avec une variante lente. Guard bloque dès le 3e retrait, Watch alerte, le dossier sort. L'écran affiche : "X € sauvés sur Y", le délai de détection en blocs, et la comparaison mesurée avec un cas réel (à Bitget, moins de 0,3 % des fonds gelés en environ un jour, selon des sources divergentes). Un clic sur un champ du dossier ouvre la transaction sur l'explorateur Fuji.

## Comment on prouve que la détection vaut quelque chose
- Le hash des règles est scellé sur Fuji avant que les attaques de test soient écrites.
- Une partie des attaques est écrite en aveugle par une autre personne que l'auteur des règles.
- Le jeu de test contient de gros retraits légitimes. On publie : taux de détection par attaque, faux positifs pour 10 000 transactions, délai en blocs, fonds sauvés, et les ratés.
- Au moins trois variantes difficiles : drain lent sous le seuil, fractionnement sur plusieurs adresses, changement de rôle légitime.

## Comment on résiste aux attaques contre l'outil lui-même
- Plafonds absolus en dur dans le contrat, indépendants de toute ligne de base apprise. Ligne de base figée et signée, avec une dérive maximale par période.
- Le budget de resserrages automatiques épuisé ne retire jamais le plafond dur ; au-delà, un humain décide.
- Une pause automatique n'existe que pour une règle du contrat sans dépendance externe, avec expiration dure à 30 minutes. Les signaux probabilistes plafonnent à la voie lente.
- La clé du bot ne peut que resserrer. L'ancrage des preuves est signé par une autre clé. Clés de démo jetables ; en production : HSM ou MPC.

## Qui décide quoi
- Règles de pause, seuils, durées maximales : l'organe de direction les signe à l'avance (mandat daté).
- Qualification d'un incident précis : un responsable conformité nommé, jamais la direction par défaut, jamais l'outil.
- Dépôt à l'autorité : humain, jamais automatique.
- Astreinte : ordre d'escalade inscrit dans le mandat. Sans réponse humaine, le système reste au palier atteint.

## Où est l'IA
Optionnelle. Elle propose un texte à partir des preuves (description, cause racine) et un résumé pour l'astreinte ; un humain valide. Elle ne décide ni d'une pause ni d'une classification. L'outil marche sans elle.

## Ce qu'on affirme et ce qu'on n'affirme pas
Affirmé : le plafond est dans le contrat ; le dossier est rejouable ; les règles ont été scellées avant les tests. Non affirmé : "zéro faux positif", "conforme DORA", "le rapport s'écrit tout seul", "aucun outil ne fait ça" (on dit "nous n'en avons pas trouvé"). Limites écrites : Watch ne bloque rien ; une attaque en une seule transaction ne se bloque que par l'invariant du contrat ; un prestataire sans point d'application on-chain n'est protégé qu'en lecture ; l'intrusion informatique en amont est invisible sur la chaîne.

## Priorités
- P0 : plafond en dur + voie lente, 4 règles, mode ombre, journal et ancrage, dossier initial (champs 1.x et 2.x), banc d'essai avec évasions et pré-enregistrement, scénario unique sur Fuji.
- P1 : Watch en lecture seule, mandat signé on-chain, chaîne d'astreinte, leurre en bonus honnête, dossier intermédiaire (3.x), texte IA optionnel.
- P2 : paquet de gel en document, second scénario, analyste conversationnel.
- Coupé : traceur multi-sauts, pont simulé, webhooks SIEM, vitrine React.

## Ce qui reste ouvert
Nouvelle deadline ; qui joue le responsable conformité dans la démo ; relecture des textes officiels (RTS 2024/1772, RTS 2025/301, ITS 2025/302) ; règle de comptage des clients touchés ; source de prix pour la conversion en euros.

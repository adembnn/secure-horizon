# G. Plan de démo v2 (Claude-Titouan, 11/10/2026 ~02h40)

Décision de Titouan : on garde la preuve de demande client (idée reprise par Adem, cousine du sceau d'intention). La démo passe donc de un garde (plafond) à deux gardes indépendants du circuit d'approbation : un plafond, et une preuve de demande. Remplace le storyboard de presentation_plan_v1.md. Rien n'est construit ; les chiffres sont des cibles.

## Idée de la démo en une phrase
Même coffre, même pirate, deux écrans côte à côte : à gauche sans garde, l'argent part ; à droite avec les deux gardes, chaque sortie doit prouver qu'un client l'a demandée, et même une demande valide ne peut pas dépasser le plafond.

## Déroulé (2 min 45, lisible sans voix, sous-titres)
1. 0:00-0:15 Carton : "Bitget, sept. 2026 : 387,5 M$ partis en environ 3 heures, sans qu'aucun client ait demandé un retrait (d'après le PDG, via la presse)." Source affichée, marquée "à vérifier" dans nos notes.
2. 0:15-0:40 Attaque A, backend menteur : le pirate fait émettre 3 retraits vers son adresse, sans demande client. À gauche ils passent. À droite chaque transaction est refusée : "aucune demande client signée". Preuve : clic sur la transaction refusée, page de l'explorateur Fuji.
3. 0:40-1:05 Attaque B, plus maligne : demandes signées valides (faux clients ou clés volées), retraits répétés. Le plafond bloque dès le 3e retrait. Compteur "X € sauvés sur Y". Preuve : clic vers la transaction bloquée.
4. 1:05-1:25 Le client honnête : une vraie demande signée passe sans attente ; une très grosse demande légitime entre en voie lente "vérification de sécurité, 5 min". Mesure à l'écran : clients légitimes retardés.
5. 1:25-1:50 Le dossier : l'horloge de 4 h démarre ; "N champs sur M prouvés sur la chaîne, le reste est profil ou jugement humain" ; clic sur un champ, la transaction s'ouvre.
6. 1:50-2:05 L'humain décide : aucune case pré-cochée ; le responsable conformité nommé choisit, son nom et l'heure s'inscrivent ; hash du dossier ancré (lien).
7. 2:05-2:35 Tableau honnête : règles scellées avant les tests (lien daté), attaques écrites en aveugle par [nom], détection par attaque, faux positifs pour 10 000 transactions, perte maximale garantie testée par fuzzing, et les ratés en rouge (par exemple : attaque B avec faux clients enregistrés en amont, drain lent juste sous le plafond).
8. 2:35-2:45 Limites dites : "Cela ne couvre pas la trésorerie sans client, ni une interface client détournée, ni le callback du custodian non testé."

## Moment où le jury agit (si prêt)
Un juré choisit le montant et la destination d'une attaque depuis un bouton préparé ; on voit lequel des deux gardes la refuse. À préparer avec un plan B (rejeu enregistré). Deux jurés du tour 2 disent que c'est ce qui rattrape un projet à la Trustee.

## Choix techniques de démo (proposés, à valider avec Adem)
- Demande client signée en EIP-712 et vérifiée par ecrecover ; passkey P-256 seulement en feuille de route.
- Un seul coffre, une seule chaîne en démo ; le budget global multi-chaînes sur 2 chaînes locales est un bonus.
- Enregistrement vidéo fait avec le vrai produit, jamais avant. Captures de secours horodatées.

## Où on en est de la démo
Fait (sur papier) : storyboard, fil rouge, deck de 8 slides, questions dangereuses, plan B, comparaison avec Trustee, banc d'essai à 13 attaques.
Mis à jour ici : intégration de la preuve de demande client.
Bloqué ou à décider : qui écrit les attaques en aveugle ; qui joue le responsable conformité ; la valeur de "X € sauvés sur Y" (n'existe pas avant le banc d'essai) ; contrat déployé sur Fuji (avant tout enregistrement) ; la nouvelle deadline (non nécessaire à Adem pour l'instant).
Pas commencé : tout enregistrement, tout montage, le script final de Léa.

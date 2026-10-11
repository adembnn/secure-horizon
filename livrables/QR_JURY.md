# Les 15 questions les plus dures, réponses vraies en deux phrases

Sources : `research/titouan/W_livrables/RESULTATS_A_JOUR.md` (RAJ), `research/titouan/T_banc_e2e/redteam/angles_morts/03_chiffres_et_methode.md` (AM03), `pitch/JURY_ATTAQUES.md` (JA), `research/demo_reelle/RECHERCHE_surfaces.md` (RS) et `RECHERCHE_demos.md` (RD). Les mentions « à mesurer » sont volontaires : si un chiffre arrive avant 12h00, le reprendre tel quel, bon ou mauvais.

**1. Si votre modèle se trompe, qui est responsable ?**
Le verdict sort de règles écrites et versionnées, aucun modèle de langage n'est appelé dans la version actuelle (AM03 F1), et la personne garde la décision avec Annuler toujours visible. La répartition de responsabilité avec un wallet partenaire n'est pas rédigée.

**2. Vos fausses alertes ?**
Trop hautes : 23,1 % de fausses alertes critiques (18/78) sur le jeu TEST ouvert une fois avant les correctifs, 17,9 % (22/123) sur des opérations honnêtes Avalanche (RAJ B, AM03 D1). Le Lab les affiche, et le chiffre du jeu aveugle est à mesurer.

**3. Que ne voit pas la porte extension ?**
Les envois tapés dans l'interface du wallet, le mobile et les retraits de plateforme. Elle ne peut rien non plus contre une victime qui veut vraiment envoyer : 3 fraudes sur 24 passent sans alerte sur DEV (JA).

**4. Que ne voit pas la porte RPC ?**
Les signatures hors chaîne comme un Permit : elles ne passent jamais par le RPC (RS section 1). Elle ne voit que des transactions déjà signées, et seulement si le wallet les envoie par notre RPC.

**5. Le RPC voit la transaction quand elle est déjà signée. À quoi ça sert ?**
Une transaction signée n'est pas encore diffusée : on peut la retenir et la montrer avant qu'elle soit minée. Si le wallet réessaie par un autre RPC, ça ne tient pas, et le comportement des wallets face à notre refus reste à tester (RS section 2).

**6. Le service worker MV3 peut s'arrêter. Votre retenue de 10 minutes tient ?**
Pas démontré : la retenue a été testée avec 2 secondes seulement (RAJ C). Une version persistante est en cours de réécriture, nous ne l'affirmons pas avant de l'avoir mesurée.

**7. Un site peut imiter votre fenêtre dans la page.**
Oui, c'est une limite reconnue de l'interface dans la page (JA). Une fenêtre séparée est en cours de réécriture, non mesurée à cette heure.

**8. Pourquoi une blockchain dans un produit anti-arnaque ?**
Le moteur n'en a pas besoin. La chaîne sert à ancrer la racine du journal pour qu'on ne puisse pas réécrire un verdict, et cet ancrage n'est pas déployé sur Fuji (`blockchain/DEPLOYMENTS.md` est vide) ; la démo tourne sur une copie locale d'Avalanche.

**9. MetaMask, Blockaid, Pocket Universe, Rabby, ScamSniffer font déjà ça.**
Ils décodent, simulent ou jugent la réputation, et Pocket Universe affiche déjà un aperçu avant le wallet (RD) ; MetaMask bloque déjà le sosie d'adresse 4+4 (`pitch/DEMO_SCENES.md`). Nous ajoutons l'intention déclarée et le ralentissement, mais nous n'avons mesuré aucun de ces outils sur notre banc.

**10. Et Drain't, le projet de hackathon ?**
Drain't (HackQuest) propose un Snap MetaMask qui avertit avant signature et un classifieur IA (RD, page projet lue, projet non testé par nous). Notre écart : deux portes et une vérité de chaîne dans le Lab ; nous n'avons pas comparé les deux sur un même jeu.

**11. 94,5 % de rappel, c'est sérieux ?**
C'est le jeu TEST écrit par nous, ouvert une fois avant les correctifs (104/110) : pas un jeu indépendant. Les 252/252 du jeu DEV sont un réglage, pas une mesure.

**12. Quel est votre temps de détection ?**
Le moteur juge une requête avant la signature : 30 à 50 ms en local sur 8 requêtes types, sans réseau (AM03 E1). Un temps de détection d'incident n'existe pas ici, et aucune mesure de bout en bout sur Fuji ou avec des personnes n'existe.

**13. Un RPC voit toutes mes transactions. Et ma vie privée ?**
Oui : adresse, transactions et IP passent par lui. Le prototype tourne en local sur la machine ; un service hébergé demanderait minimisation et durée de conservation, que nous n'avons pas rédigées.

**14. Votre modèle économique ?**
Gratuit pour les personnes, intégration payante pour les wallets et plateformes (D-005, D-007). Pas de prix, pas de client, pas de taille de marché sourcée ; qui paie côté particulier reste une question ouverte.

**15. La vérité terrain du Lab, c'est vous qui l'écrivez.**
Les contrats sont les nôtres, mais la vérité est l'exécution sur la chaîne locale puis le retour en arrière, pas une étiquette. Les scénarios restent écrits par nous : c'est pour cela que le jury peut construire le sien.

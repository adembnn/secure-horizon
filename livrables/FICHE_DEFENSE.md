# Fiche de défense : Hold up

**Pour toute personne qui veut garder la main sur ce qu'elle autorise sur la blockchain.** Avalanche.

## Problème

Camille veut échanger 50 USDC. Le site est compromis. Il lui demande une autorisation illimitée, ou une signature de « connexion » qui accorde en fait un droit.

34 % des autorisations de dépense lues sur Avalanche sont illimitées, une sur trois. Statut : notre mesure, sur un échantillon de blocs (7 103 sur 20 753), des événements et non des personnes.

## Solution

Hold up est une extension Chrome placée devant le portefeuille. Elle n'a ni clé ni signature. Camille écrit ce qu'elle veut faire. Le code lit montant, jeton et adresse de la demande, puis répond : « Ça correspond », « Ça ne correspond pas à ce que tu as écrit » ou « Je n'ai pas pu vérifier ».

**Automatique.** Si ça correspond, le portefeuille s'ouvre seul. Sinon, une alerte affiche une ligne : ce qui est écrit, ce que la demande donne. Annuler reste visible. Si le droit demandé dépasse le montant écrit, la ligne propose de le ramener à 50 USDC. Le bouton « Retirer l'autorisation » défait un droit déjà donné.

**Humain.** Camille décide : Annuler, Continuer ou limiter. Rien ne part sans son clic. Qui est alerté : elle seule sur le moment. Ensuite, l'équipe fraude de la plateforme qui intègre Hold up lit le journal. Pour un particulier, c'est lui-même.

**Documenté.** Chaque décision entre dans un journal chaîné. Il s'exporte et se vérifie hors ligne : une ligne modifiée, retirée ou déplacée au milieu est détectée. Une fiche de traçabilité dit qui a agi, d'où vient la demande, quand.

**Modèle économique (hypothèse, aucun revenu aujourd'hui).** Gratuit pour les personnes. Plus tard, une plateforme qui demande l'autorisation exacte (50 USDC pour un échange de 50, pas « tout, pour toujours ») pourra afficher « Vérifié par Hold up ». C'est elle qui paie. Critères publics, mesurés sur ses vraies demandes, pas de classement payé.

## Tests et résultats

Un jeu aveugle de 250 cas : 150 arnaques, 100 demandes honnêtes jumelles. Auteur différent de celui des règles. Ouvert une seule fois. Mesuré sur notre moteur de comparaison, pas sur l'extension.

- **87 %** des demandes dangereuses sont signalées (131 sur 150). Statut : jeu aveugle synthétique, écrit par une IA de la même famille que la nôtre.
- **65 %** sans la phrase de Camille (97 sur 150). Statut : même mesure. La phrase ajoute 34 arnaques signalées.
- **15 %** de fausses alertes rouges sur les demandes honnêtes. Statut : même mesure. Notre objectif était 10 % au plus : non atteint.

Preuve rejouable, portefeuille simulé, chaîne locale : sans Hold up, un site piraté vide le compte de test (100 vers 0). Avec le droit limité à 50, le pirate prend 0.

## Limites connues

- Pas d'essai réel avec un vrai MetaMask. Le bouton « Retirer l'autorisation » est testé hors navigateur, jamais dans un vrai Chrome.
- Pas d'ancrage du journal sur une blockchain (décision D-017). Une réécriture complète du fichier ne se voit pas.
- Fraude consentie non couverte : si la personne veut vraiment envoyer, Hold up ne l'arrête pas.
- Le modèle de langage peut dégrader certains résultats. Dans l'extension, les ratés montent de 2,7 % à 3,7 %.
- 15 % de fausses alertes rouges, au-dessus de notre objectif.
- Ni le sens d'un échange, ni la durée, ni le destinataire d'un droit.

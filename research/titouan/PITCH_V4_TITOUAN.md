# Pitch Hold up V4 (11/10/2026) : issu du round 1 des jurés (Team1 57, AWS 57, Utopia 56, KPMG 56, Kryptosphère 63, moyenne 57,8)

Corrections appliquées : jargon traduit ; "38 %" remplacé par "3 des 11 vols de plus d'un million" ; "18 ms" remplacé par "moins de 50 ms" ; 0,30 % toujours cité avec 77 % d'avertissements ; "ne laisse passer" supprimé ; 48 % Ethereum toujours cité avec 34 % Avalanche ; données envoyées, panne, injection, responsabilité, conformité et intégration ajoutées ; fausses alertes avec leur meilleur cas mesuré.
Cible : environ 650 mots dits (5 minutes).

## 0:00 à 0:30. L'accroche (scène jouée)
« Je veux échanger 50 USDC. Le site me demande de lui laisser dépenser tout mon USDC, pour toujours. Pas 50. Tout.
D'après le code public de MetaMask, il affiche ce plafond sans alerte propre à ce montant. Il ne sait pas que j'ai voulu 50. Et si le droit va à une adresse neuve, que personne n'a signalée, il n'a aucune raison de s'alarmer. »

## 0:30 à 1:15. La douleur et le constat
« En 2025, les arnaques par signature ont coûté 84 millions de dollars à plus de 100 000 victimes. Trois des onze vols de plus d'un million de dollars sont passés par une signature qui donne le droit de dépenser.
Tout service peut être compromis un jour : un contrat exploité, une interface détournée comme chez Bybit, environ 1,5 milliard. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre.
Dans nos mesures, 48 % des droits accordés sur Ethereum sont illimités, 34 % sur Avalanche. Échantillons non représentatifs. C'est donner un double de toutes les clés de la maison au plombier. Le principe de sécurité, c'est de ne laisser que la clé dont il a besoin, pour le temps qu'il lui faut. »

## 1:15 à 2:00. La solution
« Hold up est une extension de navigateur, posée devant le portefeuille que vous avez déjà : MetaMask, Core, Rabby. Elle ne tient pas vos clés.
Un : vous écrivez ce que vous voulez faire. Du code lit ce que la demande fait vraiment, montant, jeton, adresse, droit accordé, et compare. Si ça correspond, le portefeuille s'ouvre. Sinon, une alerte d'une ligne, Annuler reste visible.
Deux : indépendamment de votre phrase, des règles de base. Un droit illimité vers une adresse inconnue. Un programme étranger qui prend les commandes d'un coffre. Une signature qu'on ne sait pas lire. Même si l'escroc vous fait écrire la bonne phrase, ces règles restent. »

## 2:00 à 3:10. La démo
« Scène un, en direct, sur une chaîne locale. J'écris : échanger 50 USDC. Le site demande un droit illimité. Hold up : ça ne correspond pas. Tu as écrit 50, la demande donne tout. Vers un routeur connu, c'est un avertissement léger. Vers une adresse neuve, c'est rouge.
Scène deux, synthétique, adresses factices, inspirée de Bybit. Un coffre à plusieurs signataires affiche un virement de 20 USDC. La charge est un programme étranger qui prend le contrôle du coffre. Danger, même sans phrase.
Scène trois : je veux me connecter, la page réclame une signature qui donne le droit de dépenser. Ça ne correspond pas. »

## 3:10 à 4:00. Ce qu'on a mesuré
« Le statut de chaque chiffre. Sur une grille de 1 079 paires phrase et demande, écrites par nous, contrôle scellé et ouvert une fois : on attrape 86,6 % des divergences, avec 1,3 % de fausses alertes quand un modèle classe la phrase. Sur 410 cas construits, 228 sur 228 avec l'intention détaillée : un test de couverture, pas un test indépendant. Un jeu aveugle de 250 cas est scellé et sera ouvert une fois.
Notre point faible : dans les conditions du produit, 54 % des opérations honnêtes reçoivent au moins un avertissement. Avec une liste de protocoles connus, le meilleur cas mesuré tombe à 17 %. C'est notre travail principal.
Sur 6 325 transactions réelles d'Avalanche, 0,30 % d'alertes rouges, mais 77 % d'avertissements, presque tous des appels qu'on ne sait pas lire. Verdict local en moins de 50 millisecondes. »

## 4:00 à 4:45. Données, responsabilité, conformité
« Ce qui sort de la machine : dans la version livrée, rien. Un relais optionnel envoie la phrase seule, jamais les montants ni les adresses, à un modèle hébergé. S'il tombe, un repli local prend le relais, et sinon l'écran dit : je n'ai pas pu vérifier. Jamais de vert.
La phrase est une donnée, jamais une instruction : le modèle répond par des questions fermées, et sur 19 paires de test avec consigne injectée, une seule dérive.
Si le modèle se trompe : il ne lit que le sens de la phrase. Les montants et adresses sont lus par du code. La personne garde le dernier geste. Chaque décision est écrite dans un journal chaîné par hachage : une ligne modifiée ou retirée se détecte, mais le rejeu est partiel.
Nous couvrons Detect et Respond du NIST CSF 2.0. Nous ne revendiquons ni DORA ni MiCA : ces cadres relèvent de l'organisation qui déploie. Le même moteur pourrait servir de contrôle avant retrait pour une plateforme : non construit. »

## 4:45 à 5:00. Limites et conclusion
« Nous ne couvrons pas la fraude que vous voulez vraiment faire, ni un Ledger branché directement. Essai réel avec MetaMask : à faire. MetaMask vous prévient de ce qu'il reconnaît. Hold up vérifie ce que vous vouliez faire. »

## Questions probables
- Qui est responsable si le modèle comprend mal ma phrase ? « Il ne décide pas du montant ni de l'adresse. Si le sens est mal compris, la comparaison peut manquer une alerte : le plancher reste, et la personne garde le dernier geste. Le journal dit ce qui lui a été montré. »
- Avec 54 % d'honnêtes avertis, qui lit encore les alertes ? « C'est notre point faible principal. Nous publions le chiffre, nous le baissons, et nous ne prétendons pas qu'il est bon. »
- L'escroc coache la victime ? « Si la phrase est exacte, la comparaison ne voit rien. Le plancher voit encore un droit illimité vers une adresse inconnue ou un programme étranger. Un envoi consenti vers une adresse neuve n'est pas couvert. »
- C'est un MetaMask avec des fonctions en plus ? « Non. Pas de clés, pas de portefeuille. Une couche indépendante qui ajoute ce qu'un portefeuille ne peut pas avoir : votre intention, et des règles qui ne dépendent pas de ce que vous écrivez. »
- Et si MetaMask élargit son questionnaire ? « Il a déjà l'écran. Notre avance, aujourd'hui : toute demande, texte libre, comparaison à l'effet. Ce n'est pas une barrière durable. »

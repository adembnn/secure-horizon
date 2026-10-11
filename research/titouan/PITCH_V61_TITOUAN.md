# Pitch Hold up V6.1 (11/10/2026) : V6 + jeu aveugle + après l'alerte + business model

> **ARCHIVE, ne pas dire (11 oct., MSG-080).** Les chiffres d'autres chaînes ont été remplacés dans cette version : nous adressons Avalanche seulement (34 %, une autorisation sur trois, notre mesure sur un échantillon de blocs). Version à dire : `livrables/PITCH_5MIN.md`, `livrables/PITCH_3MIN.md`. Chiffres : `METRIQUES.md`.

## 0:00 à 0:25. L'accroche (scène jouée)
« Je veux échanger 50 USDC. Le site me demande de lui laisser dépenser tout mon USDC, pour toujours. Pas 50. Tout.
D'après le code public de MetaMask, il affiche ce plafond sans alerte propre à ce montant. Si le droit va à une adresse neuve que personne n'a signalée, il n'a aucune raison de s'alarmer. Il ne sait pas ce que j'ai voulu faire. »

## 0:25 à 1:00. La douleur et le constat
« En 2025, les signatures piégées ont coûté 84 millions de dollars à plus de 100 000 victimes. Tout service peut être compromis un jour, comme l'interface de Bybit, environ 1,5 milliard. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre.
Or 34 % des autorisations lues sur Avalanche sont illimitées, une sur trois : notre mesure, sur un échantillon de blocs. C'est donner un double de toutes les clés de la maison au plombier. Notre promesse : cesser de donner plus que nécessaire, car on s'expose en le faisant. »

## 1:00 à 1:40. La solution
« Hold up est une extension Chrome, posée devant le portefeuille que vous avez déjà : MetaMask, Core, Rabby. Elle lit la demande avant qu'elle n'arrive au portefeuille. Elle ne tient pas vos clés.
Vous écrivez ce que vous voulez faire. Du code lit ce que la demande fait vraiment, et compare. Si ça correspond, le portefeuille s'ouvre. Sinon, une alerte d'une ligne, et Annuler reste visible.
Et des règles de base, indépendantes de votre phrase : droit illimité vers une adresse inconnue, programme étranger qui prend les commandes d'un coffre. Si un faux conseiller vous dicte la bonne phrase, ces règles restent. »

## 1:40 à 2:50. La démo
« Scène un, en direct, chaîne locale. J'écris : échanger 50 USDC. Hold up : ça ne correspond pas, tu as écrit 50, la demande donne tout. Routeur connu : avertissement léger. Adresse neuve : rouge.
Scène deux, synthétique, inspirée de Bybit : un coffre affiche un virement de 20 USDC, la charge réelle donne son contrôle à un programme étranger. Danger, même sans phrase.
Et après l'alerte : j'avais continué par erreur. Je clique sur Révoquer ce droit. Hold up prépare la demande de retrait, c'est le portefeuille qui signe, et une fiche d'incident garde la trace. »

## 2:50 à 3:30. Ce qu'on a mesuré
« Un jeu de 250 cas, écrit par un agent qui n'avait pas vu nos règles, scellé et ouvert une seule fois : 87 % des demandes dangereuses sont signalées. Mais 15 % des demandes honnêtes reçoivent une alerte rouge. Notre objectif était 10 %. Il n'est pas atteint, et nous publions le résultat tel quel.
Sans la phrase de l'utilisateur, on signale 65 %. La phrase apporte donc plus de trente cas sur cent cinquante. »

## 3:30 à 4:15. Données, responsabilité, traçabilité
« Dans la démo, rien ne sort de la machine : la phrase est lue en local par mots-clés. Un modèle hébergé est optionnel : il reçoit la phrase seule, jamais les montants ni les adresses. S'il ne répond pas en deux secondes, les règles locales décident.
Si le modèle se trompe : il ne lit que le sens de la phrase, le code lit les montants et les adresses, et il ne peut pas baisser une alerte du code. La personne garde le dernier geste.
Chaque décision est notée dans un cahier numéroté : une page changée ou arrachée au milieu se voit. Le rejeu est partiel. »

## 4:15 à 4:40. Le modèle économique
« Gratuit pour les particuliers. Les revenus viendront de ceux qui ont intérêt à ce que leurs clients ne donnent pas trop : une vérification avant retrait pour les plateformes d'échange, quelques millièmes de dollar l'appel, et une licence pour les portefeuilles. Plus tard, des mandats pour les agents IA. Ces prix sont des hypothèses à valider avec des pilotes. »

## 4:40 à 5:00. Limites et conclusion
« Nous ne couvrons ni la fraude que vous voulez vraiment faire, ni un Ledger branché en direct. Le test avec un vrai MetaMask n'est pas fini : nous ne montrons pas ce que nous n'avons pas vu.
MetaMask vous prévient de ce qu'il reconnaît. Hold up vérifie que la demande est bien celle que vous avez écrite. »

# Pitch Hold up V6 (11/10/2026) : issu du round 3 sur V5 (Team1 68, AWS 71, KPMG 75, Kryptosphère 77, Utopia 79, moyenne 74,0)

Progression de la moyenne : 57,8 (V3) puis 68,4 (V4) puis 74,0 (V5). Le texte seul s'essouffle : les points qui restent demandent des preuves (essai réel MetaMask, jeu aveugle, révocation en un clic, démo sur Avalanche).
Corrections V6 : « tout va bien » reformulé ; journal expliqué en mots simples ; bloc de chiffres réduit ; extension MV3 nommée ; chemin montré en démo précisé ; précision du modèle avouée ; AI Act ; objectif sous 10 % posé comme objectif, pas comme résultat.

## 0:00 à 0:25. L'accroche (scène jouée)
« Je veux échanger 50 USDC. Le site me demande de lui laisser dépenser tout mon USDC, pour toujours. Pas 50. Tout.
D'après le code public de MetaMask, il affiche ce plafond sans alerte propre à ce montant. Si le droit va à une adresse neuve que personne n'a signalée, il n'a aucune raison de s'alarmer. Il ne sait pas ce que j'ai voulu faire. »

## 0:25 à 1:00. La douleur et le constat
« En 2025, les signatures piégées ont coûté 84 millions de dollars à plus de 100 000 victimes. Tout service peut être compromis un jour, comme l'interface de Bybit, environ 1,5 milliard. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre.
Or 48 % des droits que nous avons mesurés sur Ethereum, 34 % sur Avalanche, sont illimités. C'est donner un double de toutes les clés de la maison au plombier. »

## 1:00 à 1:45. La solution
« Hold up est une extension Chrome, posée devant le portefeuille que vous avez déjà : MetaMask, Core, Rabby. Elle lit la demande de signature avant qu'elle n'arrive au portefeuille. Elle ne tient pas vos clés.
Vous écrivez ce que vous voulez faire. Du code lit ce que la demande fait vraiment, et compare. Si ça correspond, le portefeuille s'ouvre. Sinon, une alerte d'une ligne, et Annuler reste visible.
Et des règles de base, indépendantes de votre phrase : droit illimité vers une adresse inconnue, programme étranger qui prend les commandes d'un coffre. Si un faux conseiller vous dicte la bonne phrase, ces règles restent. »

## 1:45 à 2:45. La démo
« Scène un, en direct, chaîne locale, lecture de la phrase en local. J'écris : échanger 50 USDC. Hold up : ça ne correspond pas, tu as écrit 50, la demande donne tout. Routeur connu : avertissement léger. Adresse neuve : rouge.
Scène deux, synthétique, inspirée de Bybit : un coffre affiche un virement de 20 USDC, la charge réelle donne son contrôle à un programme étranger. Danger, même sans phrase.
Scène trois : je veux me connecter, la page réclame un droit de dépense. Ça ne correspond pas. »

## 2:45 à 3:30. Ce qu'on a mesuré
« Sur 1 079 paires phrase et demande écrites par nous, contrôle scellé : 86,6 % des divergences attrapées, 1,3 % de fausses alertes. Un jeu aveugle de 250 cas, écrit sans voir nos règles, sera la vraie preuve.
Notre point faible : 54 % des opérations honnêtes reçoivent un avertissement. L'objectif est sous 10 %. Il n'est pas atteint.
Sur 6 325 transactions réelles d'Avalanche : 0,30 % de rouges, mais 77 % d'avertissements, surtout des appels illisibles. »

## 3:30 à 4:25. Données, responsabilité, traçabilité
« Dans la démo, rien ne sort de la machine : la phrase est lue en local par mots-clés. Cette lecture ne comprend que 38 % des tournures neuves. C'est le rôle d'un modèle, optionnel et désactivé par défaut : il reçoit la phrase seule, jamais les montants ni les adresses. Base légale et durée de conservation restent à rédiger. Après deux secondes sans réponse, les règles locales décident.
Si le modèle se trompe : il ne lit que le sens de la phrase, le code lit les montants et les adresses, et il ne peut pas baisser une alerte du code. Zéro violation sur 1 079 paires de contrôle. La personne garde le dernier geste.
Chaque décision est notée dans un cahier numéroté : une page changée ou arrachée se voit. Le rejeu est partiel et le cahier n'est pas encore signé. »

## 4:25 à 4:55. Limites et conclusion
« Nous ne couvrons ni la fraude que vous voulez vraiment faire, ni un Ledger branché en direct. Le test avec un vrai MetaMask n'est pas fini : nous ne vous montrons pas ce que nous n'avons pas vu.
MetaMask vous prévient de ce qu'il reconnaît. Hold up vérifie que la demande est bien celle que vous avez écrite. »

## Questions probables
- Qui est responsable si le modèle comprend mal ? « Il ne décide ni du montant ni de l'adresse. Une erreur de sens peut manquer une alerte de comparaison, jamais effacer une alerte du code. La personne garde le dernier geste, le cahier dit ce qui lui a été montré. Pour l'AI Act : une décision, une ligne rejouable, l'humain tranche. DORA et MiCA incombent à l'organisation qui déploie. »
- Qui lit encore les alertes avec 54 % d'honnêtes avertis ? « C'est notre point faible. Nous publions le chiffre, nous visons moins de 10 %, nous ne disons pas qu'il est bon. »
- L'escroc coache la victime ? « Si la phrase est exacte, la comparaison ne voit rien. Les règles de base voient encore un droit illimité vers une adresse inconnue. Un envoi consenti vers une adresse neuve n'est pas couvert. »
- C'est un MetaMask avec des fonctions en plus ? « Non. Pas de clés, pas de portefeuille. Une couche qui ajoute votre intention et des règles qui ne dépendent pas de ce que vous écrivez. »
- Et si MetaMask élargit son questionnaire ? « Il a déjà l'écran. Notre avance aujourd'hui : toute demande, texte libre, comparaison à l'effet. Ce n'est pas une barrière durable. »
- Et pour une banque ou un exchange ? « Le même moteur pourrait répondre avant un retrait, via une API de verdict sans état. Non construit. Aujourd'hui, c'est une extension pour particuliers. »
- Pourquoi ce n'est pas encore une réponse complète ? « Après l'alerte, la personne annule ou continue. La révocation d'un droit en un clic et la preuve ancrée existent en prototype chez nous, pas dans la démo. »

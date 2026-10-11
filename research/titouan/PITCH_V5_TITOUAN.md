# Pitch Hold up V5 (11/10/2026) : issu du round 2 (Kryptosphère 73, AWS 66, Team1 66, KPMG 67 ; Utopia en attente)

Corrections : texte coupé à environ 560 mots dits ; faux conseiller dans la solution ; relais désactivé par défaut et base légale à rédiger ; délai de 2 s puis règles locales ; responsabilité avec la mesure de monotonie ; phrase d'intégration ; NIST remplacé par « qui est alerté » ; « jamais de vert » remplacé par « aucun écran ne dit tout va bien » ; conclusion alignée sur la limite de la fraude consentie.

## 0:00 à 0:25. L'accroche (scène jouée)
« Je veux échanger 50 USDC. Le site me demande de lui laisser dépenser tout mon USDC, pour toujours. Pas 50. Tout.
D'après le code public de MetaMask, il affiche ce plafond sans alerte propre à ce montant. Si le droit va à une adresse neuve que personne n'a signalée, il n'a aucune raison de s'alarmer. Il ne sait pas ce que j'ai voulu faire. »

## 0:25 à 1:00. La douleur et le constat
« En 2025, les signatures piégées ont coûté 84 millions de dollars à plus de 100 000 victimes. Tout service peut être compromis un jour, comme l'interface de Bybit, environ 1,5 milliard. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre.
Or 48 % des droits que nous avons mesurés sur Ethereum, 34 % sur Avalanche, sont illimités. C'est donner un double de toutes les clés de la maison au plombier. »

## 1:00 à 1:40. La solution
« Hold up est une extension posée devant le portefeuille que vous avez déjà : MetaMask, Core, Rabby. Elle ne tient pas vos clés.
Vous écrivez ce que vous voulez faire. Du code lit ce que la demande fait vraiment, et compare. Si ça correspond, le portefeuille s'ouvre. Sinon, une alerte d'une ligne, et Annuler reste visible.
Et des règles de base, indépendantes de votre phrase : droit illimité vers une adresse inconnue, programme étranger qui prend les commandes d'un coffre. Si un faux conseiller vous dicte la bonne phrase, ces règles restent. »

## 1:40 à 2:40. La démo
« Scène un, en direct, chaîne locale. J'écris : échanger 50 USDC. Hold up : ça ne correspond pas, tu as écrit 50, la demande donne tout. Routeur connu : avertissement léger. Adresse neuve : rouge.
Scène deux, synthétique, inspirée de Bybit : un coffre affiche un virement de 20 USDC, la charge réelle donne son contrôle à un programme étranger. Danger, même sans phrase.
Scène trois : je veux me connecter, la page réclame un droit de dépense. Ça ne correspond pas. »

## 2:40 à 3:35. Ce qu'on a mesuré
« Sur 1 079 paires phrase et demande écrites par nous, contrôle scellé ouvert une fois : 86,6 % des divergences attrapées, 1,3 % de fausses alertes. Un jeu aveugle de 250 cas est scellé.
Notre point faible : 54 % des opérations honnêtes reçoivent un avertissement, 17 % dans le meilleur cas mesuré. Sur 6 325 transactions réelles d'Avalanche, 0,30 % de rouges, mais 77 % d'avertissements, surtout des appels illisibles. Verdict local en moins de 50 millisecondes. »

## 3:35 à 4:25. Données, responsabilité, intégration
« La version livrée n'envoie rien. Un relais optionnel, désactivé par défaut, envoie la phrase seule à un modèle hébergé. Base légale et durée de conservation restent à rédiger. Au bout de deux secondes sans réponse, les règles locales décident, et aucun écran ne dit tout va bien.
Si le modèle se trompe : il ne lit que le sens de la phrase, le code lit les montants et les adresses, et il ne peut pas baisser une alerte du code. Zéro violation sur 1 079 paires. La personne garde le dernier geste.
Chaque décision laisse une ligne dans un journal chaîné : une ligne modifiée se détecte, le rejeu est partiel. Aujourd'hui une extension. Le même moteur pourrait répondre avant un retrait pour une plateforme : non construit. »

## 4:25 à 4:50. Limites et conclusion
« Nous ne couvrons ni la fraude que vous voulez vraiment faire, ni un Ledger branché en direct. L'essai avec un vrai MetaMask est en cours.
MetaMask vous prévient de ce qu'il reconnaît. Hold up vérifie que la demande est bien celle que vous avez écrite. »

## Questions probables
- Qui est responsable si le modèle comprend mal ? « Il ne décide ni du montant ni de l'adresse. Une erreur de sens peut manquer une alerte de comparaison, mais jamais effacer une alerte du code. La personne garde le dernier geste, le journal dit ce qui lui a été montré. »
- Qui lit encore les alertes avec 54 % d'honnêtes avertis ? « C'est notre point faible. Nous publions le chiffre, nous le baissons, nous ne disons pas qu'il est bon. »
- L'escroc coache la victime ? « Si la phrase est exacte, la comparaison ne voit rien. Les règles de base voient encore un droit illimité vers une adresse inconnue. Un envoi consenti vers une adresse neuve n'est pas couvert. »
- C'est un MetaMask avec des fonctions en plus ? « Non. Pas de clés, pas de portefeuille. Une couche qui ajoute votre intention et des règles qui ne dépendent pas de ce que vous écrivez. »
- Et si MetaMask élargit son questionnaire ? « Il a déjà l'écran. Notre avance aujourd'hui : toute demande, texte libre, comparaison à l'effet. Ce n'est pas une barrière durable. »
- Qui est alerté ? « La personne, à l'écran. Il n'y a pas d'alerte humaine automatique à ce stade. »

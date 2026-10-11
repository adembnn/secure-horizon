# Pitch Hold up, version 1 (Claude-Titouan, 11/10/2026), 5 min + 2 min de questions

Principe : une seule idée, une seule scène jouée en direct, des chiffres avec leur statut, une diapo honnête sur les limites.

## 0:00 à 0:30. L'accroche (scène jouée, sans slide)
[Écran : un site d'échange. L'utilisateur tape : « Échanger 50 USDC contre de l'AVAX ». MetaMask s'ouvre.]
« Je veux échanger 50 dollars. Regardez ce que MetaMask me demande : un droit de dépense sur tout mon USDC, pour toujours. Pas 50. Tout. MetaMask l'affiche. Il ne dit rien d'alarmant, parce que ce site n'est pas sur une liste noire. Il ne sait pas que j'ai dit 50. »

## 0:30 à 1:15. Le problème
« Signer sans comprendre est la faille que les filtres ne ferment pas. Les portefeuilles préviennent de ce qu'ils reconnaissent : sites listés, drainers connus, adresses sosies. C'est utile et ça marche.
Mais une demande peut être légitime pour tous les détecteurs et quand même ne pas être ce que vous vouliez. Sur Ethereum, nous avons mesuré que 47 % des droits de dépense accordés sont illimités. Ce n'est pas un détail : c'est la norme.
Et quand le piège est dans l'interface elle-même, comme chez Bybit en 2025, les signataires approuvent un virement affiché alors que la charge signée est un delegatecall. 1,5 milliard de dollars. Aucun filtre de portefeuille n'avait de raison de s'allumer. »

## 1:15 à 2:00. La solution
« Hold up est une extension qui pose une seule question avant de signer : Qu'est-ce que tu veux faire ?
Vous l'écrivez, avec vos mots. Hold up décode ce que la demande fait vraiment. Puis il compare.
Si ça correspond : rien, le portefeuille s'ouvre. Si ça ne correspond pas : une alerte d'une ligne, et un bouton Annuler toujours visible. On ne bloque pas. On ralentit et on explique. L'utilisateur décide. »

## 2:00 à 3:15. La démo
[Reprise de la scène d'ouverture, avec Hold up.]
« J'écris : échanger 50 USDC. Hold up répond : Ça ne correspond pas. Tu voulais 50, la demande donne un droit sur tout ton solde. Il propose de limiter le droit à 50, et je continue.
Deuxième scène : le coffre à signatures multiples. L'écran montre un virement de 20 USDC. La charge est un delegatecall vers un contrat inconnu. Hold up : critical, un programme étranger prend les commandes du compte. Même sans phrase écrite, parce que c'est un plancher, pas une comparaison.
Troisième : un site me demande de me connecter. La signature réclamée est un Permit, un droit de dépense. Je voulais me connecter. Ça ne correspond pas. »

## 3:15 à 4:10. Ce qu'on a mesuré (avec le statut de chaque chiffre)
« Nous avons construit 410 cas où la demande semble banale mais ne correspond pas à l'intention. Sans intention, notre moteur en attrape 54 %. Avec l'intention détaillée, 100 %. Attention : ces cas sont écrits par nous. C'est un chiffre de réglage, pas un test indépendant. Un jeu de 250 cas écrit par un agent qui n'a pas vu nos règles est scellé, et nous l'ouvrirons une seule fois.
Sur le trafic réel d'Avalanche, la règle sans intention donne 0,30 % d'alertes critiques. Dans les conditions du produit par défaut, le rappel est de 83,8 % et les fausses alertes critiques de 13,9 %. Nous publions les deux, parce que le second chiffre est le moins flatteur.
Le verdict sort en 18 millisecondes en médiane, hors ligne, rien ne quitte la machine. »

## 4:10 à 4:40. Réponse et traçabilité
« Chaque verdict est écrit dans un journal chaîné par hachage : on peut rejouer la décision et prouver qu'elle n'a pas été modifiée. L'ancrage de la racine sur la blockchain est prévu pour la version suivante. La réponse est graduée : information, attention, danger, manipulation. Jamais de vert qui dit tout va bien. »

## 4:40 à 5:00. Ce qu'on ne fait pas (et la conclusion)
« Hold up ne voit pas une fraude consentie : si vous voulez vraiment faire ce paiement, il n'y a rien à comparer. Il ne remplace pas MetaMask : il complète ce que MetaMask ne peut pas savoir, c'est-à-dire ce que vous vouliez.
MetaMask vous prévient de ce qu'il reconnaît. Hold up vérifie ce que vous vouliez faire. »

## Questions probables (réponses courtes)
- Et si MetaMask élargit son questionnaire ? « C'est possible, il a déjà l'écran. Notre avance tient à trois points vérifiables : toute demande et pas seulement les envois signalés, texte libre, comparaison de la réponse à l'effet réel. »
- Qui est responsable si le modèle se trompe ? « Le comparateur final est du code. Le modèle ne fait que comprendre la phrase. L'utilisateur garde la décision, l'alerte est écrite en clair, le journal permet de rejouer. »
- Pourquoi pas un RPC ou un Snap ? « Une extension voit aussi les signatures hors chaîne, que ni un RPC ni les envois du portefeuille ne montrent. »
- Quelle part des cas réels ? « Nous ne savons pas à quelle fréquence une demande bénigne diverge de l'intention. Nous mesurons les cas construits, nous ne prétendons pas une fréquence. »

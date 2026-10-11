# Pitch Hold up V3 (11/10/2026) : douleur chiffrée, constat, moindre privilège, couche indépendante

> **Texte d'origine, non corrigé.** Les versions à dire sont `livrables/PITCH_5MIN.md`, `PITCH_3MIN.md` et `VIDEO_SCRIPT.md`, qui reprennent ce pitch avec les chiffres de `livrables/CHIFFRES.md`. Écarts relevés (détail dans `livrables/RAPPORT_MISE_A_JOUR_2.md`) : « 48 % » devient 47,6 % Ethereum et 34,2 % Avalanche ; « 38 % des pertes » devient 38 % du montant des 11 vols de plus d'un million (non repris à l'oral) ; « ce qu'ils ne peuvent pas savoir » est retiré ; « il n'a aucune raison de s'alarmer » devient « au mieux il signale une adresse sans historique » ; « 18 millisecondes » devient « médiane sous 50 ms » ; « la phrase est lue par un modèle hébergé » devient « seulement si le relais Clef est branché » ; « nous couvrons Detect et Respond » devient « se rattache à » ; le journal chaîné par hachage n'existe que dans la version serveur ; le 0,30 % d'Avalanche ne se dit qu'avec les 76,84 % d'avertissements ; ajout du contrôle scellé de la grille (86,6 % / 7,7 % / 1,3 %) et de l'aveu de la revue de sécurité.

Base : PITCH_V2 (audit) + phrase d'Adem (coord/HANDOFF_ADEM_SESSION_2.md) + tournure de Titouan sur le moindre privilège. 5 minutes, environ 650 mots.
Interdits respectés : pas de « à l'ère de l'IA », pas de « tendance en hausse », pas de « MetaMask ne le voit pas », pas de « bloque », pas de « rien ne quitte la machine ».

## 0:00 à 0:30. L'accroche (scène jouée)
« Je veux échanger 50 USDC. Le site me demande un droit de dépense sur tout mon USDC, sans date de fin. Pas 50. Tout. D'après le code public de MetaMask, il affiche le plafond, illimité, sans alerte propre à ce montant. Il ne sait pas que j'ai voulu 50.
Deuxième temps : même demande, vers une adresse neuve que personne n'a listée. Il n'a aucune raison de s'alarmer, et il ne sait ni combien je voulais donner, ni à qui. »

## 0:30 à 1:20. La douleur et le constat
« En 2025, les arnaques par signature ont coûté 84 millions de dollars à plus de 100 000 victimes (ScamSniffer). La perte moyenne est de 790 dollars : des gens ordinaires. Dans les plus gros cas, les signatures de droits de dépense pèsent 38 % des pertes.
Le constat est simple. Tout service peut être compromis un jour : un contrat exploité, une interface détournée comme chez Bybit en 2025, environ 1,5 milliard de dollars. Ce jour-là, on perd ce qu'on lui a laissé le droit de prendre.
Or sur Ethereum, dans nos mesures, 48 % des droits de dépense sont illimités. On laisse tout le portefeuille. C'est le contraire du principe de base de la sécurité : le moindre privilège. Nous ne prédisons pas que ça empire. Nous constatons que c'est possible, et que la parade est connue : ne laisser que ce qu'il faut. »

## 1:20 à 2:10. La solution et sa place
« Hold up n'est pas un autre portefeuille. C'est une couche indépendante, posée devant celui que vous utilisez déjà : MetaMask, Core, Rabby. Elle fait deux choses.
Un : vous écrivez ce que vous voulez faire. Du code lit ce que la demande fait vraiment, et compare. Si ça correspond, le portefeuille s'ouvre. Sinon, une alerte d'une ligne, et Annuler reste visible.
Deux : indépendamment de votre phrase, un plancher de règles. Droit illimité vers une adresse inconnue, appel délégué, changement de contrôle du compte, signature qu'on ne sait pas lire. C'est tout le reste.
Les portefeuilles font déjà une partie de cela, et nous gardons leurs signaux. Ce qu'ils ne peuvent pas savoir, c'est ce que vous vouliez. Hold up lui ne laisse passer que ce que vous avez écrit vouloir faire. Si on ne peut pas vérifier, on le dit. La personne décide. »

## 2:10 à 3:20. La démo
« Scène un, en direct, chaîne locale. J'écris : échanger 50 USDC. Le site demande un droit illimité. Hold up : ça ne correspond pas. Tu as écrit 50, la demande donne tout ton USDC. Il propose de limiter le droit à 50. Même phrase sur un site honnête : ça correspond, le portefeuille s'ouvre seul.
Scène deux, synthétique, adresses factices, inspirée de Bybit. Un coffre à signatures multiples affiche un virement de 20 USDC. La charge est un appel délégué vers un contrat inconnu. Danger, même sans phrase : c'est le plancher.
Scène trois : je veux me connecter. La page réclame un Permit, un droit de dépense. Ça ne correspond pas. »

## 3:20 à 4:10. Ce qu'on a mesuré
« Le statut de chaque chiffre. Cas écrits par nous : 410, dont 228 écarts. Sans intention, 54 % signalés ; avec l'intention détaillée, 228 sur 228, zéro fausse alerte rouge sur les 166 jumeaux honnêtes. C'est un test de couverture, pas un test indépendant. Un jeu aveugle de 250 cas, hash publié, sera ouvert une seule fois.
Conditions du produit, banc synthétique : rappel rouge 71,3 %, fausses alertes rouges 13,9 %, et 54,2 % des opérations honnêtes reçoivent un avertissement. C'est notre point faible. Sur 6 325 transactions réelles d'Avalanche, 0,30 % d'alertes rouges.
Verdict local en 18 millisecondes. La phrase, elle, est lue par un modèle hébergé. »

## 4:10 à 4:45. Réponse et traçabilité
« Réponse graduée : information, attention, danger, manipulation. Jamais de vert. Chaque décision laisse une ligne dans un journal chaîné par hachage : une ligne modifiée ou retirée se détecte, un auditeur rejoue la décision. Nous couvrons les fonctions Detect et Respond du NIST CSF 2.0. Si le modèle se trompe : montants et adresses sont lus par du code, la personne garde le dernier geste. »

## 4:45 à 5:00. Limites et conclusion
« Nous ne couvrons pas la fraude que vous voulez vraiment faire, ni un Ledger branché directement. Jamais essayé avec un vrai MetaMask, rien sur Fuji.
MetaMask vous prévient de ce qu'il reconnaît. Hold up ne vous laisse que ce que vous avez écrit vouloir faire. »

## Si on vous dit « c'est un MetaMask avec des fonctions en plus »
« Non. Hold up ne remplace pas le portefeuille et ne tient pas vos clés. C'est une couche qui marche avec le portefeuille que vous avez déjà. Elle ajoute ce qu'un portefeuille ne peut pas avoir : votre intention. Et un plancher de règles qui ne dépend pas de ce que vous écrivez. »

# Pitch Hold up V2 (corrigé par audit, avec la tournure du moindre privilège), 11/10/2026

Source: PITCH_AUDIT.md section (e). Ajout de Titouan: la ligne « moindre privilège » dans Le problème.

### 0:00 à 0:30. L'accroche (scène jouée, sans slide)
[Écran : le site d'échange sur la chaîne locale. Deux temps : droit illimité vers le routeur connu, puis vers une adresse neuve. Taper : « Échanger 50 USDC contre de l'AVAX ». La demande apparaît, avec « illimité ». Ne pas montrer MetaMask comme preuve.]
« Je veux échanger 50 USDC. Le site me demande un droit de dépense sur tout mon USDC, sans date de fin. Pas 50. Tout. D'après le code public de MetaMask, lu le 11 octobre, il affiche le plafond, illimité, sans alerte propre à ce montant. Il ne sait pas que j'ai voulu 50.
Deuxième temps : même demande, mais le droit va à une adresse neuve, que personne n'a listée comme malveillante. Au mieux, MetaMask signale une adresse sans historique. Il n'a aucune raison de s'alarmer si l'adresse n'est pas listée, et il ne sait ni combien je voulais donner, ni à qui. Hold up compare à ma phrase et à sa liste de protocoles connus : routeur connu, orange léger ; adresse inconnue, rouge. »
[Réserve à ne pas dire à voix haute mais à savoir : ce que MetaMask affiche pour une adresse neuve n'a pas encore été vu en vrai. Source : code et doc publics (`RECHERCHE_metamask_couverture.md`, lignes « Contrat jamais vu » et ajout du 11 oct.). À vérifier sur Sepolia avant de l'affirmer comme observé. Si le jury demande : « d'après son code et sa doc, pas observé à l'écran ». Jamais « MetaMask ne le voit pas ». Cohérent avec F31 : bénéficiaire connu = orange, sinon rouge (`attacks_decalage/RAPPORT.md`).]

### 0:30 à 1:15. Le problème
« Les portefeuilles préviennent de ce qu'ils reconnaissent : sites listés, drainers connus. Mais une demande peut être légitime pour tous les détecteurs et ne pas être ce que vous vouliez. Dans un échantillon de blocs que nous avons lus, 48 % des droits de dépense non nuls sont illimités sur Ethereum, 34 % sur Avalanche. Mesure interne, échantillon non représentatif. Donner un droit illimité, c'est le contraire du principe de base de la sécurité : le moindre privilège. On ne laisse à un service que ce dont il a besoin pour ce que l'on fait. Le jour où ce service est compromis, on perd ce qu'on lui a laissé le droit de prendre : 50, ou tout. Chez Bybit en février 2025, l'interface affichait un virement, les signataires ont signé un delegatecall : environ 1,5 milliard de dollars. »

### 1:15 à 2:00. La solution
« Hold up est une extension de navigateur. Avant que vous voyiez la demande, elle pose une question : qu'est-ce que tu veux faire ? Vous l'écrivez avec vos mots. Du code lit dans la demande le montant, le jeton, l'adresse et le droit accordé, puis compare. Si ça correspond, le portefeuille s'ouvre seul après une seconde. Sinon, une alerte d'une ligne, et Annuler reste visible. Si on ne peut pas vérifier, on le dit. La personne décide. »

### 2:00 à 3:15. La démo
[Scène 1 en direct, mode piège puis mode honnête. Scène 2 : slide, rejeu du moteur. Scène 3 : site Glacier Rewards. Si la scène 1 diffère de « ne correspond pas » en piège ou de « correspond » en honnête, le dire et passer à la vidéo.]
« Scène un, en direct, sur une chaîne locale. J'écris : échanger 50 USDC. Le site demande un droit illimité. Hold up : ça ne correspond pas. Tu as écrit 50, la demande donne tout ton USDC. Même phrase, site honnête : ça correspond, le portefeuille s'ouvre seul.
Scène deux, synthétique, adresses factices, rejeu de notre moteur, inspirée de Bybit. Un coffre à signatures multiples affiche un virement de 20 USDC. La charge est un delegatecall vers un contrat inconnu. Danger, même sans phrase écrite : c'est un plancher, pas une comparaison.
Scène trois : je veux me connecter. La page réclame un Permit, un droit de dépense. Ça ne correspond pas. »

### 3:15 à 4:10. Ce qu'on a mesuré
[Slide : un tableau, une colonne « jeu », une colonne « statut ».]
« Le statut de chaque chiffre. Cas écrits par nous : 410, dont 228 écarts et 166 jumeaux honnêtes. Sans intention, 54 % des écarts sont signalés. Avec l'intention détaillée : 228 sur 228, zéro fausse alerte rouge sur les jumeaux. C'est un test de couverture, pas un test indépendant. Le jeu aveugle de 250 cas, hash publié, sera ouvert une seule fois.
Conditions du produit, banc synthétique : rappel rouge 71,3 %, fausses alertes rouges 13,9 %, et 54,2 % des opérations honnêtes reçoivent au moins un avertissement. C'est notre point faible. Sur 6 325 transactions réelles d'Avalanche, 0,30 % d'alertes rouges.
Verdict local en 18 millisecondes. La phrase, elle, est lue par un modèle hébergé. »

### 4:10 à 4:40. Réponse et traçabilité
« Réponse graduée : information, attention, danger, manipulation. Jamais de vert. Chaque décision laisse une ligne dans un journal chaîné par hachage : une ligne modifiée ou retirée se détecte, un auditeur rejoue la décision. L'ancrage sur la chaîne est fait en local, pas sur Fuji. Fonctions NIST CSF 2.0 : Detect et Respond. Si le modèle se trompe : montants et adresses sont lus par du code, la personne garde le dernier geste. Nous ne revendiquons aucune conformité DORA. »

### 4:40 à 5:00. Ce qu'on ne fait pas (et la conclusion)
« Nous ne couvrons pas : la fraude que vous voulez vraiment faire, une phrase dictée et exacte, un contrat qui change à l'exécution, un Ledger branché directement. Jamais essayé avec un vrai MetaMask, rien sur Fuji. Deux ingénieurs ; gratuit pour les personnes, des partenaires ensuite. MetaMask a déjà l'écran ; Hold up interroge avant, en texte libre, sur toute demande, et compare à l'effet. Écrivez votre phrase, attaquez-nous. »

### Questions probables (réponses courtes)
- **Et si MetaMask élargit son questionnaire ?** « Il a déjà l'écran, trois questions fermées et dix secondes de retenue. Aujourd'hui, ce questionnaire s'ouvre seulement si l'envoi est déjà classé malveillant ou le site listé, les réponses sont fermées et jamais rapprochées du montant. Élargir le déclencheur est un réglage, nous le disons. Notre avance, vérifiable aujourd'hui : toute demande, texte libre, comparaison à l'effet. Pas une barrière durable. »
- **Qui est responsable si le modèle se trompe ?** « Le comparateur et la lecture des montants sont du code. Le modèle ne lit que la phrase, et sa précision n'est pas mesurée par nous : type juste 72,8 % sur le jeu de réglage, 38,0 % sur tournures jamais vues. Une fausse alerte coûte un clic. Une alerte manquée laisse la personne où elle serait sans nous. Elle garde le dernier geste ; le journal dit ce qui lui a été montré. »
- **Pourquoi pas un RPC ou un Snap ?** « Un Snap voit la demande une fois dans le portefeuille ; il ne peut pas poser la question avant, et ne marche que dans MetaMask. Le RPC n'est plus une porte de notre produit. » (À dire seulement si le jury insiste ; ne pas revendiquer plus.)
- **Vous avez essayé avec un vrai MetaMask ?** « Non. Chaîne locale, que l'API d'alertes de MetaMask ne sert pas : son silence là ne prouve rien. Notre affirmation vient de son code public, lu le 11 octobre. Un essai sur Sepolia reste à faire. »
- **Où va ma phrase ?** « À un modèle hébergé. Minimisation et durée de conservation ne sont pas rédigées. Montants, jetons et adresses sont lus en local. À traiter avant tout service hébergé. »
- **Les fausses alertes ?** « Trop hautes : 13,9 % de rouges, 54,2 % d'avertissements sur nos honnêtes synthétiques. C'est la limite principale. Le mode honnête de la démo montre un cas qui ne sonne pas. »
- **L'escroc dicte la phrase ?** « Si elle est exacte, rien ne l'arrête : limite assumée. Si elle est vague, on dit que nous n'avons pas pu vérifier. »
- **Quelle part des cas réels ?** « Nous ne savons pas à quelle fréquence une demande bénigne diverge de l'intention. Nous mesurons des cas construits, nous ne prétendons pas une fréquence. »

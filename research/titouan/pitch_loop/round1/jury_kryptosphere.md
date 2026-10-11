# Jury Kryptosphère, round 1

## 1. Note
- Détection : 19/30
- Réponse : 13/20
- Faisabilité : 11/20
- Conformité : 11/15
- Pitch : 9/15
- TOTAL : 63/100

## 2. Ce qui me convainc
- L'idée d'ancrer la vérification sur ce que la personne voulait faire. Aucun portefeuille ne l'a.
- L'honnêteté sur les limites et sur le statut des chiffres (test de couverture, jeu aveugle à venir). Rare en hackathon.
- L'ouverture : couche posée devant MetaMask, Core, Rabby, pas un énième portefeuille. Les vraies victimes ne changeront pas d'outil.

## 3. Ce qui m'a fait décrocher
- « 54,2 % des opérations honnêtes reçoivent un avertissement. C'est notre point faible. » Un particulier qui voit une alerte une fois sur deux l'ignore au bout d'une semaine. Le pitch l'avoue puis passe à autre chose.
- « Appel délégué », « Permit », « moindre privilège », « chaîne par hachage ». Un particulier ne comprend pas. Chez nous, on perd la salle.
- « Vous écrivez ce que vous voulez faire. » Dans la vraie vie, la victime de pig butchering ne tape rien : elle est guidée par un faux conseiller. Qui écrira sa phrase ?
- « Rappel rouge 71,3 % » : 3 attaques sur 10 passent. Non commenté.
- « Jamais essayé avec un vrai MetaMask » : la faisabilité tombe.

## 4. Questions pièges
1. Un escroc coache la victime : elle écrit elle-même « échanger 50 USDC » sur le faux site. Que fait Hold up ?
2. Mon texte part chez un modèle hébergé. Qui le voit, est-il conservé, que dit le RGPD ?
3. 54 % d'avertissements sur des opérations honnêtes : combien d'alertes par semaine pour un utilisateur normal, et quand arrête-t-il de lire ?

## 5. Changements précis

1. Remplacer : « Droit illimité vers une adresse inconnue, appel délégué, changement de contrôle du compte »
   Par : « Autoriser un site à vider tout votre portefeuille, envoyer vers une adresse jamais vue, ou donner les clés de votre compte à un tiers. »
   Gain : +2 pitch, +1 réponse.

2. Remplacer : « Or sur Ethereum, dans nos mesures, 48 % des droits de dépense sont illimités. On laisse tout le portefeuille. C'est le contraire du principe de base de la sécurité : le moindre privilège. »
   Par : « Presque une autorisation sur deux donne accès à tout votre solde. Comme laisser vos clés de maison à chaque livreur. »
   Gain : +2 pitch.

3. Remplacer : « 54,2 % des opérations honnêtes reçoivent un avertissement. C'est notre point faible. »
   Par : « Aujourd'hui trop d'avertissements. Notre cible : moins d'un par semaine. Un avertissement n'est montré que si la phrase et la demande divergent, ou si le plancher se déclenche. Mesure refaite sur le jeu aveugle. »
   Gain : +3 détection, +1 réponse. Il faut que ce chiffre baisse réellement avant la démo.

4. Remplacer : « Verdict local en 18 millisecondes. La phrase, elle, est lue par un modèle hébergé. »
   Par : « Le verdict part en 18 ms, en local. Seule votre phrase est envoyée au modèle, sans adresse ni clé, rien n'est conservé. » (à n'écrire que si c'est vrai)
   Gain : +2 conformité, +1 faisabilité.

5. Ajouter après la scène trois : « Sans écrire de phrase, le plancher seul attrape la scène deux, sans rien taper. Le cas coaché par un escroc est couvert par le plancher, pas par l'intention. » Et nommer une cible : le faux conseiller du pig butchering.
   Gain : +3 détection, +2 pitch.

Bonus : une phrase DORA/MiCA et « qui est responsable si le modèle se trompe ». Gain +1 conformité. Tester sur un vrai MetaMask avant 17h : +3 faisabilité.

## 6. Verdict
Bonne idée, message trop technique et trop d'alertes sur les honnêtes : à corriger, puis je défends ce projet.

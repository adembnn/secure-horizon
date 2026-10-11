# Jury AWS, round 2

## 1. Note
- Détection : 18/30
- Réponse : 13/20
- Faisabilité et intégration : 12/20
- Conformité et explicabilité : 12/15
- Pitch et démo : 11/15
- TOTAL : 66/100. Écart : +9 (57 au round 1).

## 2. Défauts du round 1
- Pas de vrai MetaMask, rien sur Fuji : non. « Essai réel avec MetaMask : à faire. » Honnête, mais toujours une hypothèse.
- 54 % d'avertissements : partiellement. « Avec une liste de protocoles connus, le meilleur cas mesuré tombe à 17 %. » Mieux qu'un aveu, mais toujours pas de cible chiffrée.
- Données qui partent : résolu. « Un relais optionnel envoie la phrase seule... jamais les montants ni les adresses. »
- Panne du service : résolu. « S'il tombe, un repli local prend le relais, sinon... Jamais de vert. » Le fail-closed est dit. Pas de délai d'attente.
- Latence de bout en bout : partiellement. « Moins de 50 millisecondes » reste local. Rien sur le chemin avec le relais.
- Point d'insertion (extension, snap, proxy) : partiellement. « Extension de navigateur, posée devant le portefeuille. » Quelles méthodes interceptées ? Si le site contourne ?
- Intégration banque ou exchange : non. Rien sur API de verdict ni SIEM.
- Journal et audit : partiellement. « Journal chaîné par hachage. » Pas de version du modèle ni de rejeu.

## 3. Nouveaux défauts
- Les chiffres de détection restent faibles : 54 % d'honnêtes avertis, 77 % sur chaîne réelle. Les citer ensemble est honnête, mais ça tue l'usage.
- Le repli local n'est pas décrit : quelle précision sans modèle ?
- « Rien ne sort dans la version livrée » puis un relais optionnel : laquelle démontre-t-on ?
- Démo sur chaîne locale seulement.
- Pitch trop dense : quatre blocs de chiffres en 50 secondes.

## 4. Temps de parole
Environ 810 mots dits, soit 6 min 15 s à 130 mots par minute. L'en-tête annonce 650 : faux. Dépassement d'environ 1 min 15 s, donc 160 à 200 mots à couper. Les sections 3:10 et 4:00 débordent le plus.

## 5. Cinq derniers changements
1. Remplacer : « Essai réel avec MetaMask : à faire. »
   Par : « Extension MV3 qui intercepte eth_sendTransaction et eth_signTypedData. Testée chaîne locale, essai MetaMask réel sur Fuji ce soir. » Gain : +2 faisabilité.
2. Ajouter à 1:15 : « Une extension, une API de verdict sans état. Chez une banque ou un exchange, la même API sert de contrôle avant signature, journal exportable vers un SIEM. » Gain : +2 faisabilité.
3. Remplacer : « C'est notre travail principal. »
   Par : « Cible : moins de 10 %, en taisant les opérations de routine déjà connues de l'utilisateur. » Gain : +2 détection.
4. Remplacer : « sinon l'écran dit : je n'ai pas pu vérifier. »
   Par : « Au-delà de 2 secondes, le plancher de règles décide seul et l'écran le dit. Délai total mesuré avec relais : à publier. » Gain : +1 faisabilité, +1 réponse.
5. Couper 180 mots : la scène trois de la démo, la phrase sur le plombier, le détail des 410 cas de réglage. Remplacer « Nous couvrons Detect et Respond du NIST CSF 2.0 » par « Chaque ligne du journal garde règle, version du modèle, hash de la demande : un auditeur rejoue. » Gain : +2 pitch, +1 conformité.

## 6. Verdict
Fail-closed et données sont réglés, mais l'intégration réelle n'est toujours pas prouvée et le pitch dépasse de plus d'une minute : prometteur, pas encore déployable.

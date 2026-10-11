# Jury AWS (architecte solutions sécurité), round 1

## 1. Note
- Détection : 15/30
- Réponse : 12/20
- Faisabilité et intégration : 9/20
- Conformité et explicabilité : 10/15
- Pitch et démo : 11/15
- TOTAL : 57/100

## 2. Ce qui me convainc
1. L'honnêteté sur les chiffres. Statut de chaque mesure, jeu aveugle avec hash publié. Rare.
2. Le principe : moindre privilège, plancher de règles indépendant de la phrase. Le plancher marche même si le modèle échoue.
3. Le journal chaîné par hachage et le verdict local en 18 ms. Bon réflexe d'architecte.

## 3. Ce qui m'a fait décrocher
« Jamais essayé avec un vrai MetaMask, rien sur Fuji. »
Votre promesse est une couche posée devant le portefeuille. Si l'intégration n'a jamais tourné sur un vrai portefeuille, la faisabilité est une hypothèse. Et la piste 4 de la track cite Fuji.
Deuxième décrochage : « 54,2 % des opérations honnêtes reçoivent un avertissement. » Un utilisateur qui voit un avertissement une fois sur deux clique Continuer. Le produit s'annule.
Troisième : « La phrase, elle, est lue par un modèle hébergé. » Rien sur ce qui part, vers qui, ni ce qui se passe quand il tombe.

## 4. Les 3 questions pièges
1. Le service hébergé est en panne ou lent. Fail-open ou fail-closed ? Quelle latence de bout en bout, pas 18 ms locales ?
2. Quelles données quittent la machine (phrase, adresse, solde) ? Qui les voit, combien de temps, dans quelle région ?
3. Comment vous placez-vous techniquement entre le site et MetaMask (extension, snap, RPC proxy) ? Que se passe-t-il si MetaMask change son API ou si le site contourne le proxy ?

## 5. Les 5 changements

1. Remplacer : « La phrase, elle, est lue par un modèle hébergé. »
   Par : « La phrase est lue par un modèle hébergé. Seuls le texte et le type de demande partent, jamais les clés ni le solde. Si le service ne répond pas en 2 secondes, le plancher de règles décide seul et l'écran le dit. » Gain : +3 faisabilité, +1 conformité.

2. Remplacer : « Jamais essayé avec un vrai MetaMask, rien sur Fuji. »
   Par : une démo réelle, même minimale, sur Fuji avec un vrai MetaMask, ou au minimum : « Intégration prévue en extension qui intercepte eth_sendTransaction et eth_signTypedData. Testée sur chaîne locale, non testée sur MetaMask réel. » Gain : +4 faisabilité.

3. Remplacer : « 54,2 % des opérations honnêtes reçoivent un avertissement. C'est notre point faible. »
   Par : « 54,2 % d'avertissements sur le banc synthétique. Notre cible : moins de 10 %, en supprimant l'avertissement sur les opérations de routine déjà connues de l'utilisateur. » Il faut un plan chiffré, pas un aveu. Gain : +3 détection.

4. Ajouter dans 1:20 à 2:10 : « Intégration : une extension, une API de verdict sans état, déployable chez une banque ou un exchange comme contrôle pré-signature. Journal exportable vers un SIEM. » Gain : +3 faisabilité.

5. Remplacer : « Nous couvrons les fonctions Detect et Respond du NIST CSF 2.0. »
   Par : « Chaque décision journalise : règle déclenchée, version du modèle, hash de la demande. Un auditeur rejoue la décision. Lien DORA : cette ligne est la preuve de contrôle. » Gain : +2 conformité, +1 pitch.

## 6. Verdict
Idée juste et chiffres honnêtes, mais architecture non prouvée, pannes non traitées et trop d'avertissements : pas encore déployable.

# Jury Utopia, round 2, PITCH V4

## 1. Note
- Détection : 21/30 (+4)
- Réponse : 13/20 (+2)
- Faisabilité : 15/20 (+4)
- Conformité : 10/15 (+4)
- Pitch : 11/15 (0)
- TOTAL : 70/100 (round 1 : 56, écart +14)

## 2. Défauts du round 1
- 228/228 circulaire : résolu. V4 : « 1 079 paires, contrôle scellé, 86,6 % », 410 cas = « test de couverture ».
- Modèle boîte noire : partiellement. « Le modèle répond par des questions fermées. » Mais la précision de lecture (72,8 % / 38 %) reste absente. Le 1,3 % de fausses alertes « quand un modèle classe la phrase » ne dit pas quel chemin tourne.
- Injection : partiellement. « La phrase est une donnée, jamais une instruction. » Je ne vois toujours pas ce que le site peut écrire dans la transaction et si cela atteint le modèle.
- Conformité : partiellement. « Nous ne revendiquons ni DORA ni MiCA. » Honnête, mais l'AI Act n'est pas cité. Le journal chaîné est un vrai point.
- 71,3 % de rappel présenté comme victoire : partiellement. 86,6 % annoncé sans dire que 13 % passent.
- Point faible 54 % : partiellement. « Le meilleur cas mesuré tombe à 17 %. » Bien, mais aucun objectif daté sur le jeu aveugle.

## 3. Nouveaux défauts
- 86,6 % et 1,3 % : grille écrite par nous. « Scellé » ne prouve pas l indépendance. Le meilleur cas à 17 % est choisi après coup. 50 ms : avec ou sans modèle hébergé ?

## 4. Temps de parole
Environ 830 mots, soit 6 min 20 à 130 mots par minute. L'entête vise 650 mots. Dépassement d'environ 1 min 20. Pénalité réelle en salle.

## 5. Cinq derniers changements
1. Remplacer « La phrase est une donnée, jamais une instruction : le modèle répond par des questions fermées. » par « Le modèle ne voit jamais la transaction, seulement votre phrase, et ne peut que durcir un verdict. Un site qui écrit des ordres dans la transaction n'atteint pas le modèle. » Gain +3 (faisabilité, détection).
2. Remplacer « avec 1,3 % de fausses alertes quand un modèle classe la phrase » par « avec 1,3 % de fausses alertes. Le modèle lit juste le type de phrase dans 73 % des cas sur nos phrases, 38 % sur des tournures neuves : en dessous, nous demandons confirmation. » Gain +3 (détection).
3. Remplacer « Nous couvrons Detect et Respond du NIST CSF 2.0. Nous ne revendiquons ni DORA ni MiCA » par « AI Act : une décision, une ligne rejouable, version du modèle inscrite, l'humain tranche. DORA, MiCA : au déployeur. » Gain +2 (conformité).
4. Remplacer « C'est notre travail principal. » par « Objectif avant la finale : sous 30 %, mesuré une seule fois sur le jeu aveugle de 250 cas. » Gain +2 (réponse, détection).
5. Supprimer le paragraphe Bybit de la scène deux et « 48 % Ethereum, 34 % Avalanche », plus une phrase du bloc données : revenir à 650 mots. Gain +2 (pitch).

## 6. Verdict
Honnête et nettement mieux tenu, mais la précision du modèle et l'injection restent à dire en chiffres, et 6 min 20 ne passent pas : 70/100.

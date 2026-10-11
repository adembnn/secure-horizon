# Autocritique du pitch V7

Relecture faite deux fois : en juré de sécurité qui cherche la faille, puis en juré qui ne connaît pas la crypto. Une seule passe de correction, appliquée dans les fichiers.

## Juré sceptique de sécurité

Ce qu'il accorde :
- L'accroche dit d'emblée que Hold up ne reconnaît pas le site piraté. Il n'a pas à nous le faire avouer.
- Le chiffre de détection vient d'un jeu ouvert une seule fois, avec le critère manqué dit à voix haute.
- Les limites arrivent avant les questions, y compris « jamais devant un vrai portefeuille ».

Ce qu'il attaque :
1. **« Cent, zéro » ne vient pas du navigateur.** C'est un script qui lit la chaîne sur un autre compte de test. Si on ne le dit pas, il le verra et doutera du reste.
2. **Le droit de 50 part chez le pirate.** La scène montre une perte bornée. Le « zéro perte » est porté par LI.FI, pas par nous. Il demandera pourquoi nous ne refusons pas un droit vers une adresse inconnue.
3. **87,3 % compte les simples avertissements.** En rouge seul, c'est 76,0 %. Et sur la scène montrée, 18 sur 19 sont signalés mais 5 sur 19 seulement en rouge.
4. **18 paires contrôlées sur 58.** Un échange de 5 000 passe sous une phrase qui dit 50, tant que le droit est bon. La phrase « pas encore le sens d'un échange » le dit vite.
5. **Portefeuille simulé.** Tout l'argument d'intégration repose sur un portefeuille qui n'existe pas chez les gens.
6. **Limiter un droit, c'est Protect** dans le NIST CSF, pas Respond. Le carton à 4:40 force un peu.

## Juré qui n'y connaît rien

Ce qu'il retient : deux sites pareils, une phrase, une main qui se lève, un compte vidé d'un côté et pas de l'autre. La phrase de fin.

Ce qui le perd :
1. « Droit », « USDC », « contrat du pirate » arrivent sans explication.
2. Le bloc de 2:45 à 4:15 aligne huit nombres en 90 secondes. Il n'en gardera qu'un ou deux.
3. « Detect » et « Respond » ne lui disent rien.
4. « Le portefeuille s'ouvre seul » alors qu'aucun portefeuille ne s'ouvre à l'écran.

## Note sur la grille

Note du texte tel qu'il serait joué aujourd'hui, avec le portefeuille simulé et la scène prouvée par l'audit. Pour comparaison, les cinq jurés simulés donnaient 74,0 de moyenne à la V5.

| Critère | Poids | Note | Pourquoi |
|---|---|---|---|
| Efficacité de détection | 30 | 20 | Un jeu aveugle ouvert une fois, avec intervalle et critère : c'est ce qui manquait aux versions d'avant. Mais 15 % de fausses alertes rouges, objectif manqué, 250 cas fabriqués, et une couverture de 18 paires sur 58 |
| Qualité de la réponse | 20 | 15 | Retenir, expliquer en une ligne, ramener le droit à 50 : proportionné et prouvé dans un Chromium. Pas de révocation, rien à offrir sur une signature, attente inversée sur installation neuve |
| Faisabilité et intégration | 20 | 11 | Vrai navigateur, mais portefeuille simulé, chaîne locale, rien sur Fuji, jetons à déclarer à la main, contournements non corrigés à l'écran |
| Conformité et explicabilité | 15 | 10 | Verdict en une phrase lisible, code pour les montants, humain au dernier geste. Journal inexact sur deux points, conservation de la phrase non rédigée, mapping en une ligne |
| Pitch et démo | 15 | 13 | Une idée, une scène, une phrase. Risque : la scène en direct n'est pas prouvée à la main |
| **Total** | 100 | **69** | |

Après la correction ci-dessous, je monte à **71** : un point en pitch (le jargon et la phrase fausse sur le portefeuille sont partis), un point en conformité (la légende du terminal dit ce qu'on montre). Ce qui ferait gagner le plus est hors du texte : un essai devant un vrai portefeuille (faisabilité, jusqu'à 4 points) et la scène tapée à la main deux fois de suite sans casse.

## Ce qui est faible et que le texte ne peut pas réparer

- La thèse du fondateur (« le pirate ne prend rien ») n'est pas ce que la scène montre. Le pitch dit « ne peut prendre que ce que j'avais écrit ». C'est moins fort et c'est vrai. La scène forte demande trois pièces qui n'existent pas (`DEMO_DEROULE.md`).
- L'effet « évident après coup » tient au gant et aux deux fenêtres. Si la scène passe en vidéo, il baisse.
- Le modèle économique tient en une demi-phrase. Un juré de finance notera qu'il n'y en a pas.

## La correction, faite une fois

| Défaut | Avant | Après | Fichiers |
|---|---|---|---|
| Phrase fausse à l'écran : aucun portefeuille ne s'ouvre avec un portefeuille simulé | « Le portefeuille s'ouvre seul » | « La demande part seule vers le portefeuille » | `PITCH_5MIN.md`, `PITCH_3MIN.md` |
| « Droit » jamais expliqué | « un droit de 50 USDC » | « le droit de prendre 50 USDC dans mon compte » | les deux |
| « Cent, zéro » présenté comme la fenêtre du navigateur | terminal sans mention | légende visible : « lecture de la chaîne, compte de test, chaîne locale » | les deux |

Corrigés pendant l'écriture, avant cette relecture :
- « Votre portefeuille non plus » retiré de l'accroche : trop proche d'une phrase qu'on s'interdit sur les portefeuilles. Remplacé par « Alors on a arrêté de deviner ».
- « Le pirate ne prend rien » remplacé par « ne peut prendre que ce que j'avais écrit ».
- Le coût de 1,22 dollar par exécution sorti du pitch : il vient d'un autre essai que les 207 sur 405. Il reste en question.
- L'invitation « écrivez votre phrase » retirée du pitch : avec 18 paires contrôlées sur 58, c'est offrir la panne.

Non corrigé, à décider par vous :
- 87,3 % contre 76,0 % en rouge seul. Le texte dit « signale », ce qui est exact. Si un juré demande « en rouge ? », la réponse est 76,0 %, et 5 sur 19 sur la scène.
- Le bloc des preuves reste dense. Coupe possible sans perte : la phrase sur Avalanche à 34,2 %, sauf si Team1 Avalanche est dans la salle.
- Le carton NIST CSF : garder « Detect » pour l'écart, et dire « Respond et Protect » pour la limitation si le juré KPMG est pointilleux.

## Passe d'écriture (skill `avoid-ai-writing`, annexe française)

Mode : relecture par moi, sans le détecteur. Le script du skill n'a pas tourné : je n'ai pas de terminal dans cette session, et le skill prévient que son détecteur est calibré pour l'anglais.

Ce que j'ai cherché et retiré dans les sept fichiers : tirets d'incise, tournures « non pas X mais Y », séries de trois par réflexe, connecteurs en tête de phrases successives, adjectifs gonflés, conclusions en maxime en fin de paragraphe.

Ce qui reste, et pourquoi :
- La liste de quatre contrôles à 4:15 est une liste de faits, reprise de `EXHAUSTIVITE_INTENTION.md`. Je ne l'ai pas réduite pour le rythme.
- « Même adresse, même bouton » et « Cent USDC. Zéro. » sont des fragments voulus : c'est un texte à dire, et ils tombent sur un geste.
- « Notre apport est cet assemblage, pas le principe » (`QR.md`, question 8) oppose deux thèses réelles : un juré soutiendra que nous revendiquons le principe.
- La phrase de fin est une maxime. C'est la commande.

Une passe d'édition. Arrêt : plus de modification justifiée trouvée à la relecture.

# Consignes du fondateur pour la refonte (11 oct. 2026)

Ces consignes priment sur DIRECTION.md quand elles le contredisent.

## Ses mots

- « À partir de 45 secondes, t'es parti en couille sur les animations. C'est devenu n'importe quoi. T'as fait aucun effort. »
- « La vidéo doit être beaucoup plus dynamique. »
- « Une vidéo très animée qui montre avant de dire. »
- « Fais du motion design, donne-toi à fond. » « L'animation doit aller beaucoup plus loin et être beaucoup plus fluide. »
- Rejeté auparavant : tout ce qui ressemble à des cartes ou à des slides (« AI slop »), une extension « trop bruyante », une barre qui se vide, une police fantaisie.

## Ce que ça veut dire, concrètement

1. **Montrer avant de dire.** L'image montre la chose au moment où la voix la nomme, ou juste avant. Jamais un texte qui explique à la place d'une image. Pas de liste à puces animée, sauf le playbook en quatre lignes de la fin, qui doit lui aussi être mis en scène.
2. **Pas de zoom inutile sur les captures.** La prise réelle de l'extension est montrée grande et lisible. La caméra ne bouge sur elle que pour montrer quelque chose : la phrase qui se tape, la ligne « Compris par Clef en … s », le verdict, le bouton. Pas de va-et-vient décoratif. Le mouvement vient d'abord de ce qui se passe autour et à travers l'écran (traits d'encre, cordes, mains, mots qui sortent de la phrase), pas d'une caméra qui s'agite.
3. **Mettre en avant la classification et la décision rapide.** On doit VOIR Clef ranger la phrase (quoi : échanger ; combien : 50 DUSDC ; contre quoi : AVAX), voir le temps mesuré (la prise réelle affiche « Compris par Clef en 0,9 s » ; latences mesurées dans `docs/design/system/captures_reelles/RESULTATS.json`), puis voir la comparaison et le verdict tomber vite. Uniquement des temps mesurés, jamais un chronomètre inventé.
4. **Chaque attendu du Track 1 visible à l'image** (tableau « Plan, durée, attendu de la Track 1 » dans `video/STORYBOARD.md`, et `research/titouan/CONFORMITE/ADEQUATION_TRACK1.md`) :
   - (a) détection : temps mesuré, 87 % / 65 % / 15 % d'alertes à tort pour un objectif de 10 %, dits « moteur de comparaison » ;
   - (b) réponse graduée : l'écart signalé, le droit ramené à 50 d'un geste de la personne (bouton « Limiter à 50 DUSDC et envoyer »), « Annuler » toujours visible, retirer une autorisation après coup ;
   - (c) de bout en bout : vrai navigateur, vraie extension, copie locale d'Avalanche ; le piratage sans / avec ;
   - (d) traçabilité : le journal, une ligne par décision ;
   - (e) le playbook : qui est alerté, ce qui est automatique, ce qui reste humain, comment c'est documenté ;
   - (f) NIST CSF Détecter et Répondre ;
   - (g) l'enjeu : la personne qui a signé plus qu'elle ne voulait ; la validation humaine.
5. **La limitation n'est pas automatique.** Hold up lève le gant et PROPOSE ; c'est la personne qui clique « Limiter à 50 DUSDC et envoyer ». Ne jamais montrer ni écrire le contraire.
6. **Durée** : le film reste entre 2 et 3 minutes. La voix (2 min 12) est figée.
7. **Le sommet du film** est « TOUT » puis le gant sur « Ça ne correspond pas ». Tout le reste monte vers ce moment ou en descend.

## Cahier de défauts

Si le fichier `CAHIER_DEFAUTS.md` existe à côté de celui-ci, lis-le : c'est un diagnostic indépendant de la version précédente, scène par scène. Chaque défaut qui concerne ta scène doit avoir disparu.

## Comment lire le cahier de défauts (ajout de 12h16)

- `CAHIER_DEFAUTS.md` est complet depuis 12h15 (73 défauts confirmés sur image, dont 24 de gravité 3, et une mise en scène temps par temps par scène). Il est long : lis l'en-tête (comment lire, règles de montage communes, temps morts), puis UNIQUEMENT la section de ta scène. Si tu l'as lu avant 12h15, relis ta section : elle n'existait pas encore.
- Ses temps sont ceux de la version précédente (132,4 s). Repère-toi par ligne de voix (h7, k2…), pas par seconde. Les temps qui font foi sont dans `BORNES.md`.
- Découpage : la scène `s3b` d'ici (lignes h6 à h11) correspond à DEUX sections du cahier, « s3b » et « s3c ». Les autres scènes portent le même nom.
- Le diagnostic en une ligne : après l'ouverture, le film changeait de genre et devenait « capture à gauche, mots à droite, deux colonnes titrées », en cadre fixe, sans aucun objet du dessin de l'ouverture, et plusieurs phrases clés n'avaient pas d'image du tout.

## Règles de montage communes (du même diagnostic)

- Aucune image identique plus de 1,5 s. Chaque pause de voix de plus de 1,2 s contient un événement daté.
- L'image précède le mot de 0,3 à 0,8 s, pas de 6 s.
- Changer de valeur de cadre au moins toutes les 4 s, sans zoomer DANS la capture.
- Pas de fondu ni de voile gris entre scènes : raccord par un objet du dessin.
- Un temps fort par phrase, deux temps forts majeurs par scène.
- Aucun état d'attente (« Je compare… ») tenu plus de 0,5 s : le film doit montrer que la décision est rapide.
- Jamais plus d'une ligne de texte incrustée hors sous-titre, jamais de liste : chaque attendu du Track 1 est accroché à un objet qui bouge.
- Durée : ne plus rien resserrer (plancher 122 s, le film est à 124,3 s).

## Relectures indépendantes de la v5

Si le fichier `RELECTURES.md` existe à côté de celui-ci, lis la section de ta scène : ce sont des relectures indépendantes des extraits de CETTE version, faites par des agents qui n'ont pas vu ton travail. Chaque défaut qu'elles relèvent sur ta scène doit avoir disparu avant que tu rendes la main.

## Arbitrages entre scènes (ajout de 12h22) : OBLIGATOIRE pour les raccords

`CAHIER_DEFAUTS.md` a été remplacé à 12h19 par une version arbitrée (1 011 lignes). Lis sa section « Arbitrages entre scènes » en entier : sept agents construisent en parallèle sans se voir, ces règles sont ce qui fait tenir les raccords. Si ta scène a été construite autrement, la règle prime sur tes coordonnées. Résumé :

1. Une seule poche héroïne du plan 3 au plan 5 : la poche de la personne. Elle ne remonte pas du bas en s3b, elle sort de derrière la fenêtre.
2. Un seul décor pour la zone droite du plan 3 et pour le plan 4 : même guichet, même poche. La coupe plan 3 / plan 4 est un simple recul de caméra.
3. Clic réel et verdict : la prise joue à vitesse réelle (0,96 s) et le verdict tombe sur l'image de l'impact du gant. La fenêtre ne reste pas sur « Je compare… ».
4. Pas de barre d'étapes ni de corde à nœuds : la chaîne phrase, Clef, comparaison, verdict est portée par des objets (le champ, une clef dessinée, un fil à 50, le gant).
5. « 0,9 s » : seulement à l'écran du verdict, avec « sur cette prise ». Aucun compteur avant.
6. « TOUT » : 120 px au plus, entier dans le cadre, à droite de la poche ; « 50 DUSDC » à gauche.
7. L'échange (la poignée de 50) est montré à la fin du plan 3, pas en prélude du plan 4.
8. Raccords s4/s5, s5/s6, s6/s7 : la poche héroïne reste à l'écran, les autres la rejoignent. Pas de sortie « le monde part vers le haut », pas de main qui revient dans la poche juste après la révocation ; le bras rayé a quitté le cadre avant la coupe vers s7.
9. Mentions de bas d'écran : courtes, sans chemin de fichier.

Les « recalages » du cahier sont calculés pour 123,4 s : cale-toi sur `L.<id>.debut`, pas sur ses secondes.

Preuve réelle du piratage (plan 4) : elle n'a PAS pu être recapturée à 12h20 (la copie locale d'Avalanche répond « 429 Too Many Requests » côté réseau public). Le plan 4 reste donc dessiné, avec la mention courte « soldes mesurés sur une copie locale d'Avalanche ». N'invente aucune sortie de terminal.

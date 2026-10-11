# Cahier de défauts et de mise en scène : vidéo « Hold up », version v3

> **VERSION ARBITRÉE (12h19). Elle remplace la version brute de 12h15.** Les défauts confirmés sont les mêmes (73, dont 24 de gravité 3). Ce qui est nouveau et que chaque agent de scène doit lire : « Arbitrages entre scènes » (douze décisions : une seule poche héroïne du plan 3 au plan 5, un seul décor pour la zone droite du plan 3 et pour le plan 4, les raccords s3c/s4, s4/s5, s5/s6, s6/s7), puis dans sa section « Raccords », « À ne pas refaire » et « Infaisable ».
>
> **Comment lire dans la v5.** (1) Tous les temps sont ceux de la v3 (132,4 s) : repère-toi par LIGNE DE VOIX (`L.<id>.debut`), les bornes de la v5 sont dans `video/v5/BORNES.md`. (2) Les paragraphes « Recalage sur le nouveau minutage » sont calculés sur les pauses proposées par le monteur (123,4 s), pas sur celles de la v5 (124,27 s) : ne recopie aucun temps absolu. (3) La v5 n’a pas de scène s3c : les sections « s3b » et « s3c » sont toutes deux pour l’agent s3b. (4) Les arbitrages sont des décisions de papier, aucune n’a été rendue : si ta scène est déjà construite autrement, c’est la règle qui compte (même poche, même guichet, raccord par un objet du dessin, pas de noir ni de fondu), pas les coordonnées.


Destinataires : les agents qui refont le film scène par scène, en parallèle. Chaque section de scène se suffit à elle-même : elle répète les repères, les arbitrages et les raccords qui la concernent.

Matière de revue : `scratchpad/revue_v3b/<scène>/planche_NN.jpg` (2 images par seconde), `plein_NN.jpg` (1 image toutes les 3 s), `ref/` (ouverture validée), `film/lignes.json`, `film/silences.txt`. Les horodatages viennent des planches de scène, qui concordent avec `lignes.json`. Les images pleines sont en avance d'environ 1 à 1,5 s sur leur étiquette : elles ne servent qu'à juger la lisibilité.

Convention de temps. Tous les temps de ce cahier sont des **temps v3** (le film actuel, 132,4 s). Le minutage change (voir « Minutage ») : aucun événement ne se code en temps absolu. Chaque événement se code en décalage par rapport au début de la phrase qui le suit (`L.<id>.debut`) ou, pour une retombée, à la fin de la phrase qui le précède. Les sections de scène donnent les décalages à appliquer dans les pauses raccourcies.

Statut. Rien de ce qui est proposé ici n'a été rendu. Les positions en pixels (canevas 1920 x 1080) sont indicatives et se recalent sur image rendue. Les contraintes fermes sont dites « ferme ».

---

## En une page

Les cinq problèmes qui expliquent « à partir de 45 secondes, c'est devenu n'importe quoi », par ordre de gravité.

**1. Après 40 s, l'image s'arrête pendant que la voix avance.**
L'ouverture change de cadre toutes les 2 à 4 s. Ensuite la même composition tient 35 s (fenêtre en haut à gauche, 0:40 à 1:15), puis 16 s (guichet et deux poches, 1:16 à 1:32), puis 13 s (grille, 1:48 à 2:00). Il y a 31,1 s sans voix après 40 s, dont la moitié sans même un impact sonore, et ces pauses ne portent aucun événement. Exemple : de 1:07,5 à 1:12,0, dix vignettes identiques sous la phrase centrale « Tu as écrit cinquante. La demande donne tout. » (s3c/planche_01 et 02).

**2. Le film quitte le monde dessiné et devient une suite de slides.**
Capture posée à gauche, mot géant ou colonnes titrées à droite ; grille de pictogrammes ; liste de quatre lignes. C'est la forme déjà rejetée. Exemples : 0:40,5 à 0:49,5, 19 vignettes avec la fenêtre vide et un mot à droite, sans un trait d'encre (s3a/planche_01 et 02) ; 2:04,0 à 2:08,0, quatre phrases alignées à gauche sur le réseau grisé (s7/planche_01, plein_02).

**3. La voix dit des actes que l'image ne montre pas, ou montre l'effet sans la cause.**
Le pirate n'est jamais dessiné pendant tout le climax (1:16,3 à 1:33, aucune vignette de s4 ne montre le bras rayé). Le « geste » est un avant et un après (1:12,0 puis 1:12,5, s3c/planche_02). « Devant ton portefeuille » et « Ton portefeuille la signe » n'ont ni portefeuille ni signature. Au plan 5, la main quitte la poche à 1:39,0 et le clic n'arrive que vers 1:42,5.

**4. La classification et la rapidité de décision, les deux axes demandés, sont invisibles ou démenties.**
« Clef » n'existe qu'en légende grise (0:53,0, s3a/planche_03) et la voix ne le nomme jamais. La fenêtre réelle reste sur « Je compare… » de 0:58,0 à 1:04,5 (14 vignettes, s3b) alors qu'elle affiche « 0,9 s ». Ce « 0,9 s » n'a pas de trace dans `METRIQUES.md`.

**5. Le texte incrusté est illisible, rogné, ou dit autre chose que la voix et les documents.**
« TOUT » géant coupé par le bord droit et posé sur « 50 DUSDC » (1:01,0 à 1:04,5, s3b/planche_02) ; second « 50 DUSD » rogné (1:12,5 à 1:16,0) ; légendes grises de 13 à 17 px ; nombres posés sur les poches qu'ils comptent (plan 6) ; ligne NIST / ATT&CK / OWASP en gris de 14 px (2:05,5 à 2:08,0). La voix dit « dollars », l'écran écrit « DUSDC ». Le 87 % et le 15 % ne sont pas au même seuil d'alerte.

---

## Règles communes à toutes les scènes

Dix règles, chacune vérifiable sur une planche à 4 images par seconde.

1. **Aucune image identique plus de 1 s.** Toute pause de voix de plus de 1 s contient au moins un événement daté (entrée, impact, vidage, coupe), placé dans la pause et non sur la phrase suivante.
2. **L'image précède le mot de 0,2 à 0,8 s.** Pas plus (l'image attend et le plan meurt), pas moins (la voix commente au lieu de confirmer).
3. **Tout changement d'état a une cause visible dans la demi-seconde qui précède.** Une poche ne se vide pas sans main, un panneau ne change pas sans clic montré, un chiffre ne change pas sans geste.
4. **Tout se joue avec les objets de l'ouverture.** Poche = le portefeuille de la personne. Main creuse au bout d'une corde = l'autorisation donnée à un site. Guichet = le site. Bras rayé = le pirate, et lui seul (il n'entre qu'au plan 4). Gant blanc plein = Hold up. Aucune main n'est donnée à l'utilisateur.
5. **Aucun texte posé à côté d'une capture, aucune liste, aucune colonne titrée.** Hors sous-titre, un seul texte vif à la fois, accroché à un objet qui bouge au moment où il s'inscrit.
6. **Texte incrusté : blanc, 40 px canevas au minimum (27 px en 1280), 80 px de marge au bord, jamais sur un contour ni sur ce qu'il compte.** Un mot ne recouvre jamais l'autre terme d'une comparaison. Un chiffre se construit à l'écran (décompte), il n'apparaît pas tout fait.
7. **La fenêtre réelle est entière, nette, à échelle constante, jamais zoomée ni étirée dans le temps.** Elle peut se déplacer comme un objet. On la désigne à l'encre par-dessus (trait, cerne, anneau). Un état d'attente (« Je compare… ») ne reste que sa durée réelle.
8. **Pas de noir, de fondu ni de voile gris entre scènes.** Raccord par un objet du dessin (poche, corde, guichet, gant) qui passe d'un plan au suivant, à la même place et à la même échelle. À vérifier par différence d'images de part et d'autre de la coupe.
9. **Un seul libellé pour l'argent.** « 50 DUSDC » uniquement à côté d'une prise réelle qui l'écrit (plan 3, plan 5) et dans l'étiquette de la phrase (plan 6), avec la mention « DUSDC = dollar de démonstration » montrée une fois à 0:50,6. Partout ailleurs dans le dessin : « 50 ». Sous-titres coupés sur la ponctuation de la voix, jamais après « à », « la », « ton », « tous ».
10. **Aucun chiffre sans source.** « 0,9 s » ne s'affiche qu'au verdict, sorti du panneau réel, libellé « sur cette prise ». Jamais « décision en 0,9 s ». Les chiffres du plan 6 sont ceux du moteur de comparaison, pas de l'extension livrée. La mention « rythme ajusté à la voix » disparaît partout.

---

## Minutage

Les pauses sont raccourcies, mais le dynamisme vient surtout de l'animation dans les pauses qui restent : 41,7 s sans voix après 40 s, dont 9,0 s seulement sont retirées.

| Pause après | Intervalle v3 (s) | Actuelle | Proposée | Gain | Raison |
|---|---|---|---|---|---|
| h4 | 48,23 à 49,83 | 1,6 | 1,2 | 0,4 | Fenêtre vide et fixe de 0:48,0 à 0:49,5 ; la frappe démarre dans la pause |
| h5 | 52,50 à 54,80 | 2,3 | 1,5 | 0,8 | Image fixe de 0:53,0 à 0:54,5 ; 1,5 s suffisent au classement |
| h7 | 58,97 à 61,37 | 2,4 | 1,2 | 1,2 | Blocs figés de 0:58,5 à 1:00,5 |
| h8 | 63,10 à 65,50 | 2,4 | 1,3 | 1,1 | Images identiques avant le verdict ; le clic réel et le verdict tiennent en 1 s |
| h11 | 74,24 à 77,04 | 2,8 | 1,8 | 1,0 | Deux écrans puis un voile gris |
| k1 | 79,04 à 80,94 | 1,9 | 1,3 | 0,6 | Plan fixe de 1:19,0 à 1:20,0 |
| k2 | 83,26 à 85,26 | 2,0 | 1,2 | 0,8 | Cinq vignettes identiques de 1:23,0 à 1:25,0 |
| k4 | 91,25 à 93,65 | 2,4 | 1,6 | 0,8 | Même plan depuis 1:22 |
| r4 | 105,70 à 108,70 | 3,0 | 2,0 | 1,0 | Fin de plan figée de 1:45,5 à 1:47,5 |
| m2 | 115,00 à 116,70 | 1,7 | 1,2 | 0,5 | « 87 % » fixe de 1:55,0 à 1:56,5 |
| m3 | 119,30 à 122,70 | 3,4 | **3,0** | 0,4 | Arbitrage : le monteur proposait 2,4. Le 15 % d'alertes à tort n'est porté que par l'image ; à 2,4 s il ne tiendrait que 0,75 s à l'écran |
| f3 (fin) | 129,57 à 132,40 | 2,8 | 2,4 | 0,4 | Logo identique de 2:09 à 2:12 |

**Durée résultante : 132,4 - 9,0 = 123,4 s** (plancher : 122 s, marge 1,4 s). La durée se vérifie sur le fichier rendu, pas sur ce calcul. Ne plus toucher aux pauses ensuite.

Débuts de phrase après réglage (temps v3 entre parenthèses) : h5 49,43 (49,83) ; h6 53,60 (54,80) ; h7 56,92 (58,12) ; h8 58,97 (61,37) ; h9 62,00 (65,50) ; h10 63,90 (67,40) ; h11 68,06 (71,56) ; k1 72,54 (77,04) ; k2 75,84 (80,94) ; k3 79,36 (85,26) ; k4 84,13 (90,03) ; r1 86,95 (93,65) ; r2 89,59 (96,29) ; r3 92,63 (99,33) ; r4 95,80 (102,50) ; m1 101,00 (108,70) ; m2 104,41 (112,11) ; m3 108,50 (116,70) ; f1 114,10 (122,70) ; f2 115,93 (124,53) ; f3 120,38 (128,98) ; fin 123,37.

**Frontières de scène (fermes), exprimées sur la voix :**

| Frontière | Instant | État commun aux deux scènes |
|---|---|---|
| ouverture / s3a | 40,15 (inchangé) | Rangée de neuf poches de la fin du plan 2b |
| s3a / s3b | `h6.debut - 0,70` | Fenêtre à gauche, phrase classée ; « 50 DUSDC » libre ; guichet en haut à droite |
| s3b / s3c | impact du gant = `h9.debut - 0,23` | Gant refermé sur la corde, main stoppée, fenêtre sur le verdict |
| s3c / s4 | `k1.debut - 0,80` | Poche héroïne nouée, niveau 0,55, étiquette « droit : 0 » |
| s4 / s5 | `r1.debut - 0,80` | Poche héroïne seule, nouée, plan large |
| s5 / s6 | `m1.debut - 0,70` | Poche libérée seule, sans main ni corde, panneau sorti |
| s6 / s7 | `f1.debut - 0,60` | Poches et guichet aux positions du champ `F7` à z = 0,40 |

---

## Arbitrages entre scènes

Les sept propositions ont été écrites séparément. Là où elles se contredisent, voici ce qui est tranché. Chaque section de scène reprend ce qui la concerne.

1. **Une seule poche héroïne du plan 3 au plan 5.** C'est la poche de la personne. Graine 72 (celle de la poche « avec Hold up » du plan 4). En s3a elle vient de la rangée du plan 2b (graine 302) ; le changement de graine se fait pendant qu'elle est cachée derrière la fenêtre (42,78 à `h6 - 0,70`). s3b ne fait pas monter une poche neuve du bas : la poche sort de derrière le bord droit de la fenêtre.
2. **Une seule disposition pour la zone droite du plan 3 et pour le plan 4.** Le plan 4 est refait avec le décor de la proposition s4 : guichet entier (`by` vers 332, échelle 1,25), poche héroïne monde (1320, 610, échelle 2,0), poche de gauche (600, 610, 2,0). La zone droite du plan 3 est ce même décor vu à travers une pose fixe de caméra (zoom 1,125) qui place la poche héroïne à l'écran en (1400, 470), échelle apparente 2,25, et le guichet vers (995, 157). Le guichet du plan 3 est donc celui du plan 4, et la coupe s3c / s4 est un simple recul de caméra. Les coordonnées (1100, 450) de la proposition s3b et (1610, 230) pour son guichet sont abandonnées. Si le toit du guichet sort du cadre dans le plan 3, descendre la pose de 40 px.
3. **Le clic réel et le verdict.** Deux propositions : verdict à 65,10 puis gant à 65,27 (s3b), ou verdict sur l'image de l'impact (s3c). Tranché : la prise joue à vitesse réelle (24 images à 25 i/s, soit 0,96 s) et le clic est placé à `impact - 0,96`, pour que le verdict tombe sur l'image de l'impact. La règle du monteur « verdict moins de 1,5 s après "Et elle compare" » est remplacée par : la fenêtre reste dans son état d'avant clic pendant que le dessin explique, puis clic et verdict en 0,96 s réelle.
4. **État de la main à l'impact.** s3b finit avec la main qui tient tout au bord de la poche ; s3c demandait une main posée qui plonge à 64,90. Tranché : on garde la fin de s3b, et à l'impact la main lâche, les pièces retombent (niveau 0 vers 1 en 0,3 s) et la main reste pendue à mi-poche. L'anticipation et la plongée de s3c à 64,75 et 64,90 sont supprimées.
5. **Pas de corde à quatre nœuds.** Le repère d'étapes de s3b ressemble à un indicateur de progression et tombe sur le guichet et sur Clef. La chaîne est portée par les objets : champ de saisie, clef dessinée « Clef », fil à 50 contre la main, gant. Clef, réduite, s'accroche au départ du fil à 50 et y reste jusqu'au verdict. Le filet de temps du clic est une perle qui court de l'anneau du bouton jusqu'au point où le gant frappe.
6. **« 0,9 s ».** Aucun compteur en s3a (dans la prise, les cases se remplissent en 0,2 s et la ligne « Compris par Clef en 0,9 s » n'existe qu'à l'écran du verdict). Aucun chiffre en s3b. Le chiffre sort du panneau en s3c, avec « sur cette prise ».
7. **« TOUT » et les jauges.** « 50 DUSDC » se place à gauche de la poche, « TOUT » à droite au pied de la jauge, 120 px au plus, entier dans le cadre. La jauge de droite est tracée en s3b et reste ; s3c ne la retrace pas, il la fait battre. « TOUT » claque une fois, en s3b ; en s3c il bat sur le mot « tout ».
8. **L'échange est montré à la fin de s3c, pas dans un prélude de s4.** La proposition s4 prenait 1,0 s sur la fin du plan 3 pour montrer la poignée de l'échange. Elle est jouée dans le cadre de s3c, sous l'écran réel « Ça correspond », et remplace l'essai unique de la main prévu par s3c. s4 commence à `k1 - 0,80` par le recul.
9. **Raccord s4 / s5 dans l'image.** La sortie de s4 « le monde part vers le haut » est abandonnée, comme l'entrée de s5 par le bas. La poche héroïne reste à l'écran et les autres poches la rejoignent.
10. **Raccord s5 / s6.** Le panneau réel sort à la fin de s5. s6 commence sur la poche seule. La main qui revenait dans la poche à 108,05 (proposition s6) est supprimée : elle contredisait la révocation vue une seconde plus tôt. Les mains arrivent sur les 250 poches en même temps.
11. **Raccord s6 / s7.** s6 amène poches et guichet aux positions du champ `F7`. Les cordes sont dessinées par s7 (elles jaillissent à la coupe). Le bras rayé a quitté le cadre avant la coupe et retombe en s7.
12. **Mentions de bas d'écran.** « Rythme ajusté à la voix » disparaît. s3a : « prise réelle de l'extension · copie locale, argent fictif » de 42,9 à 45,5, puis « frappe ralentie pour la voix · argent fictif » pendant la frappe. s3b : aucune. s3c : « clic montré au dessin · copie locale, argent fictif » de 70,5 à 73,0. s4 : légende courte sans chemin de fichier. s5 : un crédit de 98,9 à 101,4.

---

## Scène s3a : plan 3 (début), 40,2 à 54 s

Hold up se présente, la question, la phrase tapée, le classement par Clef. Voix : h1 40,71 ; h2 41,56 à 44,57 ; h3 45,17 à 47,07 ; h4 47,47 à 48,23 ; h5 49,83 à 52,50. Fin de scène : `h6.debut - 0,70`.

### Défauts confirmés

| Gr. | Temps | Défaut | Preuve |
|---|---|---|---|
| 3 | 40,5 à 49,8 | Neuf secondes de capture immobile à gauche et d'un mot à droite. Aucun trait d'encre, aucun changement de cadre sur 19 vignettes. Trou de voix 48,23 à 49,83 sans rien. | planche_01, planche_02 ; plein_02 à 04 |
| 3 | 41,5 à 47,4 | « Posée devant ton portefeuille », « Avant de signer » : ni portefeuille, ni site, ni signature à l'image. | planche_01 (41,5 à 45,5), planche_02 (46,0 à 47,0) |
| 3 | 51,0 à 54,0 | Le classement : trois mots empilés qui doublent la fenêtre, sous l'étiquette fausse « ta phrase », sans objet pour Clef, puis image figée (53,0 et 53,5 identiques). Le vrai remplissage des cases de la fenêtre, à 51,0, passe sans marque. | planche_02 (51,0, 51,5), planche_03 (52,0 à 53,5) |
| 2 | 50,5 à 54,0 | « 0,9 s » en petit gris, après coup, sous un pied d'image « rythme ajusté à la voix ». À l'écran le classement paraît tomber en moins de 0,5 s. | planche_02 (50,5, 51,0), planche_03 (53,0) ; `METRIQUES.md` l. 69 et 72 |
| 2 | 49,8 à 53,5 | La voix dit « cinquante dollars », l'écran écrit « 50 DUSDC contre AVAX ». | planche_02, planche_03 ; plein_05 |
| 2 | 40,5 à 51,5 | Mêmes mots en double ou triple : « Hold up » en grand et en sous-titre ; « Que veux-tu faire ? » en grand (dès 45,0), dans la fenêtre et en sous-titre. | planche_01, planche_02 |
| 2 | 49,5 à 52,0 | Phrase tapée en une seconde (19 caractères entre 50,0 et 50,5), sans cause visible, puis fixe. | planche_02 (49,5 à 51,5) |
| 2 | 40,0 à 41,0 | Entrée par un noir avec le seul pied d'image, hors du monde dessiné. | planche_01 (40,0, 40,5) ; plein_01 |
| 2 | 40,5 à 54,0 | Fenêtre assombrie et molle pendant 8 s (nette à 49,0 seulement) ; pied d'image long et permanent. | plein_02 à 05 ; planche_02 (48,5 contre 49,0) |
| 1 | 43,0 à 52,5 | Sous-titres coupés au milieu d'un groupe (« Posée devant ton / portefeuille. »). | planche_01, planche_02, planche_03 |
| 1 | 52,0 à 52,5 | Traînée en barre de bruit à gauche de « échanger » ; fantôme sur « contre AVAX ». Voulu ou non : à vérifier en vidéo. | planche_03 (52,0) ; plein_05 |

Vu en plus : le bouton « Vérifier » passe en blanc à 50,0 et n'est jamais actionné dans la scène.

Rejetés au contrôle : « l'échange honnête n'est pas montré » (écart au storyboard, pas un défaut visible) ; « légende de 9 px » (elle fait environ 17 px en 1280) ; « entrée sans anticipation » (invérifiable sur une image).

### L'idée

Ma poche est ouverte à la main du site. Hold up tombe entre les deux, la main bute dessus, et la fenêtre ne demande qu'une phrase, que Clef range aussitôt en trois cases (quoi, combien, à qui).

### Constats sur la matière qui changent la commande

- Dans `video/src/img/reel/`, la phrase est complète à f031 et les cases pleines à f036 : 0,2 s. La ligne « Compris par Clef en 0,9 s » n'apparaît qu'au verdict. **Donc aucun compteur dans cette scène.**
- Aucune prise du portefeuille ni du site n'existe. « Devant ton portefeuille » se dessine avec la poche.
- La fenêtre est éteinte de 40,5 à 48,5 alors que `docs/design/system/captures_reelles/a_honnete_1_question.png` est nette. Cause probable, non vérifiée : l'image f002 est prise dans le fondu d'ouverture.
- Pas de main pour l'utilisateur : la frappe vient d'un clavier dessiné.

### Repères

- Fenêtre : `WX=70, WY=52, WS=1.6` (bord droit x = 774, bas y = 884), échelle constante. Ferme.
- Ma poche : `pk(422, 330, 2.4, …)`. Le guichet du site : `drawBooth(FB)` vers (1500, 250), échelle 1,3. Corde : `cubic()` du guichet à la poche. Ordre de dessin : corde, poche, main, fenêtre par-dessus.
- Temps de mots à caler sur `L.h2.mots` et `L.h5.mots`.

### Mise en scène, temps par temps (temps v3)

| t | Événement |
|---|---|
| 40,15 | Pas de noir. La rangée de neuf poches de la fin du plan 2b, redessinée à l'identique (graines `300+i`, y = 470, échelle 1,62). Aucun pied d'image. |
| 40,20 | Huit poches sont arrachées vers le haut par leur corde, décalées de 0,03 s. La poche i = 2 glisse vers (422, 330) et grossit à 2,4 en 20 images, sa main dedans. |
| 40,30 | Le guichet entre par la droite en 16 images, s'écrase de 10 % et se redresse. La corde bascule vers lui et se tend. |
| 40,45 | Anticipation : la fenêtre descend du haut, pendue à une corde, sur la moitié droite, inclinée de 0,06 rad. |
| 40,62 | Impact : arrêt net, secousse 14, éclair 0,35. « Hold up » claque (150 px) sous la poche. La fenêtre se balance en pendule amorti jusqu'à 41,30. |
| 41,30 | « Hold up » rétrécit à 30 px et se noue en étiquette sur la corde de la fenêtre. Il y reste toute la scène. |
| 41,45 | La main du site prend une poignée dans ma poche. Le niveau descend d'un cran. |
| 42,10 | Deuxième poignée. Une bosse remonte la corde, le guichet tressaute. |
| 42,50 | Anticipation : la fenêtre se redresse et recule de 30 px. |
| 42,58 à 42,78 | Avant « Posée » : la fenêtre file à gauche jusqu'à `WX=70`. Le guichet glisse en contre-mouvement. |
| 42,78 | Impact : la fenêtre se pose devant la poche et la recouvre. Secousse 18. La corde du site s'arrête net au bord droit de la fenêtre. La main est éjectée de 120 px, ses pièces retombent derrière le bord. |
| 42,90 | La corde de la fenêtre remonte hors cadre, l'étiquette « Hold up » reste au coin. Pied court jusqu'à 45,5 : « prise réelle de l'extension · copie locale, argent fictif ». |
| 43,40 | La main du site pend et se balance. |
| 43,75 | Avant « portefeuille » : un trait d'encre se trace sous le mot « portefeuille » de la ligne réelle « Ce site veut utiliser ton portefeuille ». Il s'efface à 44,30. |
| 44,75 | Avant « Avant de signer » : premier assaut. La main file le long de la corde et bute sur le bord de la fenêtre, qui encaisse 6 px. |
| 45,45 | Deuxième assaut, plus fort. La corde s'arque. |
| 46,10 | Troisième assaut, secousse 9. La main retombe molle. |
| 46,30 | Avant « question » : un trait d'encre se tire sous le titre réel « Que veux-tu faire ? ». |
| 46,90 | Le guichet et sa main glissent vers le coin haut droit (1700, 150), échelle 0,9, opacité 0,45. La droite se vide. |
| 47,20 | Avant « Que veux-tu faire ? » : le trait devient un cerne autour du titre. |
| 47,90 | Le cerne se défait. Un cerne rectangulaire se trace autour du champ vide. |
| 48,30 | Trou de voix : un clavier dessiné monte du bas à droite (trois rangées de touches, x 900 à 1500, y 640 à 850), touches en cascade. |
| 48,65 | Une corde fine se tire du clavier au champ. |
| 48,90 à 49,75 | Frappe de « échanger », une touche enfoncée par lettre. Bosse sur la corde à la fin du mot. |
| 49,90 à 50,55 | Frappe de « 50 DUSDC ». Bosse. |
| 50,60 | Mention de 30 px tirée du montant, à droite du champ, jusqu'à 52,3 : « DUSDC = dollar de démonstration ». |
| 50,75 à 51,35 | Frappe de « contre AVAX » jusqu'à f031. Bosse. |
| 51,40 à 51,60 | f031 à f036 à vitesse réelle : les trois cases de la fenêtre réelle se remplissent. |
| 51,60 | Impact : une accolade d'encre sous la ligne réelle « échanger / 50 DUSDC / contre AVAX ». Le clavier tombe hors cadre. |
| 51,75 | Clef entre : une clef dessinée tombe à (960, 170), tourne et se cale. Son nom « Clef », 64 px, à côté de l'anneau. |
| 51,95 | Trois cases dessinées s'ouvrent sous elle (x = 1080 ; y = 300, 420, 540 ; 440 x 96), libellées « quoi », « combien », « à qui ». |
| 52,15 à 52,45 | « échanger » se détache du texte tapé dans le champ, suit une corde jusqu'à Clef, Clef fait un quart de tour, le mot tombe dans « quoi », le couvercle claque. |
| 52,60 à 52,75 | Même trajet pour « 50 DUSDC » dans « combien ». |
| 52,90 à 53,05 | Même trajet pour « contre AVAX » dans « à qui ». Impact le plus fort, secousse 8. |
| 53,25 à 54,00 | Retombée : Clef rapetisse ; la case « combien » avance et s'épaissit, les deux autres baissent à 0,6 ; le guichet reprend son opacité et tressaute. |

Sous-titres, coupes forcées : « Posée devant / ton portefeuille. » ; « Avant de signer, / une question. » ; « échanger / cinquante dollars. ».

Textes supprimés : le grand « Que veux-tu faire ? », l'étiquette « ta phrase », la colonne de mots nus, la légende « classée par Clef en 0,9 s », « rythme ajusté à la voix ».

### Recalage sur le nouveau minutage

- Pause h4 (1,6 vers 1,2) : clavier à `fin h4 + 0,05`, corde à `+ 0,30`, première lettre à `h5 - 0,60`. Les lettres « écha » sont à l'écran avant « Tu écris ».
- Pause h5 (2,3 vers 1,5) : le classement finit à `fin h5 + 0,55` (impact « contre AVAX »). La retombée 53,25 à 54,00 se comprime en 0,25 s. La scène rend la main à `h6 - 0,70`.

### Les prises réelles

Une seule fenêtre, entière, à l'échelle 1,6. Nette dès l'entrée : dessiner `a_honnete_1_question.png` jusqu'à la frappe, pas f002. Elle a une corde, une étiquette, un poids, et elle encaisse les trois coups. Elle est pointée à l'encre à quatre endroits : « portefeuille », le titre, le champ, la ligne « Ce que j'ai compris ». La vitesse du classement est montrée par la prise elle-même (f031 à f036 non étirées).

### Raccords

- **Entrée (40,15).** Première image = dernière image du plan 2b (ref/planche_04, 39 s). Le silence 39,27 à 40,38 sert à l'arrachage des huit poches.
- **Sortie (`h6 - 0,70`).** État à livrer à s3b : fenêtre à `WX=70` sur f036 à f043 (phrase tapée, cases pleines, bouton « Vérifier » blanc) ; étiquette « Hold up » au coin ; trois cases dessinées, « combien » en avant avec « 50 DUSDC » ; Clef réduite vers (880, 150) ; guichet du site en haut à droite, pleine opacité, sa corde et sa main arrêtées au bord de la fenêtre ; la poche toujours cachée derrière la fenêtre. La graine de la poche passe à 72 pendant qu'elle est cachée.

### À ne pas refaire

1. La capture immobile à côté d'un mot géant (40,5 à 49,5).
2. Dire ce que l'image ne montre pas : « devant ton portefeuille », « avant de signer », « cinquante dollars » sous « 50 DUSDC », « 0,9 s » collé à un remplissage de 0,2 s.
3. Doubler la fenêtre au lieu de la désigner : la colonne « ta phrase » répétait ce que la ligne réelle affichait depuis 51,0.

### Infaisable ou à vérifier pour cette scène

Le portefeuille et le site réels (aucune prise). Un compteur honnête (il faudrait savoir ce qui remplit les cases à f035, et ce que mesure « 0,9 s »). L'écart « dollars » / « DUSDC » est atténué, pas supprimé. Les coordonnées des tracés sur la capture sont estimées à l'œil ; le décalage `107 * WS` du code paraît trop haut, à mesurer sur f031. La clef et le clavier sont deux dessins neufs (`jit`, `trace`).

Fichiers : `C:/Users/Adem/Secure Horizon/video/src/acts.js`, `C:/Users/Adem/Secure Horizon/video/src/film.js`, `C:/Users/Adem/Secure Horizon/video/src/img/reel/`.

---

## Scène s3b : plan 3 (milieu), 54 à 65 s

Ce que la demande fait vraiment, la comparaison, « le site demande tout ». Voix : h6 54,80 à 56,72 ; h7 58,12 à 58,97 ; h8 61,37 à 63,10. Début : `h6.debut - 0,70`. Fin : impact du gant, `h9.debut - 0,23`.

### Défauts confirmés

| Gr. | Temps | Défaut | Preuve |
|---|---|---|---|
| 3 | 58,0 à 61,0 | « Et elle compare » : un seul heurt à 58,0 (les deux mots se chevauchent, « 50 DUSD:TOUT »), puis cinq vignettes identiques sur le silence. | planche_01 (57,5 à 59,5), planche_02 (60,0, 60,5) |
| 3 | 61,0 à 65,0 | « TOUT » géant : rogné à droite, collé à la fenêtre, pose sur « 50 DUSDC » (on lit « 5( USDC »), huit vignettes identiques. | planche_02 (61,0 à 64,5) ; plein_03, plein_04 |
| 3 | 58,0 à 65,0 | La fenêtre réelle reste au moins 6,5 s sur « Je compare… », sans verdict en fin de scène. Le film contredit la rapidité. | planche_01 (58,0 à 59,5), planche_02 |
| 3 | 54,0 à 58,0 | « Elle lit ce que la demande fait vraiment » n'est pas montré. « TOUT » apparaît tout fait à 55,5, après le début de la voix, et donne la chute 5,9 s avant la phrase qui la dit. | planche_01 (54,0 à 57,5) |
| 3 | 54,0 à 65,0 | Capture à gauche, deux colonnes titrées, un mot géant ; aucun objet de l'ouverture ; cadre fixe 11 s. | planche_01, planche_02 |
| 2 | 54,5 à 55,5 | Bande de code étirée qui passe sur « échanger », illisible. | planche_01 (54,5 à 55,5) ; plein_01 |
| 2 | 54,0 à 65,0 | Clef réduit à une légende grise ; aucun repère de la chaîne ; la voix ne dit jamais « Clef ». | planche_01 (54,0 à 58,0) |
| 2 | 55,5 à 65,0 | « TOUT » sans attribution après 58,0 ; la fenêtre affiche un autre « tout » de sens opposé (« tout revient sur ton compte ») ; l'écran ne dit jamais « dollars ». | planche_01 ; plein_01, plein_02 |
| 2 | 54,0 à 57,5 | « 0,9 s » affiché sans trace dans `METRIQUES.md`. | planche_01 ; `METRIQUES.md` l. 69 et 72 |
| 1 | 54,0 à 65,0 | Petits textes gris de 13 à 16 px en 720. | plein_01 à 04 |
| 1 | 55,0 à 63,0 | Sous-titres coupés (« Elle lit ce que la / demande fait vraiment. »). | planche_01, planche_02 |

Vu en plus : la demande du site est écrite dans la même police et le même blanc que la phrase de la personne ; de 63,5 à 64,5, ni sous-titre, ni mouvement, ni verdict.

Rejetés au contrôle : « rien ne réagit au changement d'état de 58,0 » (faux : heurt et grisage à 58,0) ; « "tous tes dollars" est un raccourci inexact » (jugement sur la voix, pas sur l'image).

### L'idée

Un fil tendu à « 50 DUSDC » en travers de la poche, et la main du site qui le dépasse trois fois jusqu'au fond, là où s'écrit « TOUT ». Puis la vraie fenêtre passe du clic au verdict en une seconde.

### Repères (après arbitrage, positions indicatives)

- Fenêtre réelle : `WX=70, WY=52, WS=1.6`, immobile, échelle constante. Ferme.
- **Zone droite = le décor du plan 4 vu à travers une pose fixe** (zoom 1,125). Poche héroïne à l'écran en (1400, 470), échelle apparente 2,25, graine 72 : ourlet y = 470, surface des pièces vers y = 565, pointe vers y = 750. Guichet du site vers (995, 157). Les coordonnées (1100, 450) et (1610, 230) de la proposition d'origine sont abandonnées.
- Corde du site : du socle du guichet, par (1130, 290), jusqu'à la main dans la poche. Sans nœud.
- Main du site : la main noire à contour blanc de l'ouverture. Pas le bras rayé.
- Fil à 50 : trait d'encre horizontal vers y = 585, du bord de la fenêtre (x = 774) jusqu'en travers de la poche. Clef, réduite, est accrochée à son départ (vers x = 810).
- « 50 DUSDC » : 64 à 84 px, aligné à droite sur x = 1205, sur le fil. « tout » puis « TOUT » : à droite de la poche, au pied de la jauge (x = 1580), centré vers (1700, 700), 120 px au plus, bord droit à x = 1840 au plus. Ferme : les deux mots ne se recouvrent jamais.
- Jauge : trait vertical à x = 1580, de l'ourlet jusqu'au fond. Elle reste pour s3c.
- Aucun en-tête de colonne, aucune légende grise, pas de corde à quatre nœuds. Tout texte dessiné fait 40 px ou plus.

### Mise en scène, temps par temps (temps v3)

*Lecture de la demande*

| t | Événement |
|---|---|
| 54,00 | « échanger » et « contre AVAX » repartent en arc vers la ligne « Ce que j'ai compris » de la fenêtre et s'y éteignent. Les cases dessinées se referment et tombent. « 50 DUSDC » reste seul et glisse à sa place. Clef descend s'accrocher vers (810, 585). |
| 54,15 | La poche sort de derrière le bord droit de la fenêtre et glisse jusqu'à (1400, 470), pleine, se tasse et se pose à 54,60. |
| 54,30 | Le guichet, resté en haut à droite, vient se placer vers (995, 157). Écrasement puis redressement. |
| 54,50 | Sa corde, arrêtée au bord de la fenêtre depuis s3a, repart vers la poche. La main arrive sur l'ourlet à 54,75, la poche encaisse. |
| 54,55 | La vraie ligne de la demande s'écrit dans un couloir à elle (au-dessus de la poche, à droite du guichet), 44 px, sans étirement : « approve( app.neve.exchange, 115792089… ». Seul le nombre défile, 0,9 s. Elle ne croise aucun mot. |
| 54,80 | Voix « Elle lit ce que la demande fait vraiment. » |
| 54,90 | La main se ramasse puis plonge. Elle traverse la surface vers 55,20. |
| 55,40 | Elle touche le fond. Impact : secousse 6. |
| 55,50 | « tout » s'écrit petit (40 px) au pied de la poche, côté droit, relié à la pointe par un trait fin. |
| 55,70 | Le nombre file hors du couloir. À sa place claque « sans limite » (44 px). |
| 56,00 | Dans la fenêtre réelle, un anneau d'encre autour du « 50 DUSDC » de « Ce que j'ai compris » (vers (422, 547), à mesurer). |
| 56,15 | Le fil à 50 part du bord de la fenêtre, passe par Clef, traverse la poche sous la surface, tendu à 56,45. Il vibre 0,4 s. L'anneau et le mot battent ensemble. « tu as écrit » (40 px) au-dessus du mot. |
| 56,90 | La main, au fond, s'ouvre et remonte de 10 px. |

*Comparaison*

| t | Événement |
|---|---|
| 57,30 | Déplacement de cadre : le calque dessiné pousse de 1 à 1,18 autour de la poche en 30 images. La fenêtre ne bouge pas. |
| 57,70 | Butée 1 : la main monte au fil, s'y arrête 6 images, passe au travers jusqu'au tiers de la poche. Le fil ploie, claque, vibre. La jauge se trace de l'ourlet jusqu'à la main. |
| 58,12 | Voix « Et elle compare. » |
| 58,50 | Butée 2 : amplitude x 1,5, jusqu'aux deux tiers. La jauge s'allonge. |
| 59,30 | Butée 3 : amplitude x 2,1, jusqu'au fond. Secousse 9. La jauge touche « tout ». |

*« Tous tes dollars »*

| t | Événement |
|---|---|
| 60,80 | Anticipation : « tout » se contracte, la main s'ouvre grand. |
| 60,95 | « TOUT » claque sur place à 120 px, secousse 9, éclair 0,25. La main se referme sur le tas. « sans limite » descend sous « TOUT » et devient « ton DUSDC, sans limite » (40 px). |
| 61,37 | Voix « Le site demande tous tes dollars. » |
| 61,45 | Poignée 1 : la main soulève le tas, niveau 1 vers 0,66. |
| 62,05 | Poignée 2 : niveau 0,34. |
| 62,65 | Poignée 3 : niveau 0. La main tient tout au bord de l'ourlet, poing fermé, et **ne quitte pas la poche** (rien n'est signé ; la poche vidée est l'image du plan 4). Le calque revient à l'échelle 1 pendant la retombée. |

*Clic et verdict à vitesse réelle*

| t | Événement |
|---|---|
| `impact - 0,96` | Le clic : un anneau d'encre se resserre sur le vrai bouton « Vérifier » (vers (628, 811)). La prise repart à l'image 44, à 25 i/s, sans étirement. Une perle blanche quitte l'anneau et court sur un trait d'encre vers le point de la corde où le gant frappera (vers (1130, 290)). |
| `impact - 0,50` | Une traction : la corde se tend, la poche est soulevée de 16 px, les pièces tenues tremblent. |
| impact (`h9 - 0,23`) | La fenêtre affiche le verdict (image 68). La perle arrive. Le gant se referme sur la corde. s3c prend la main. |

Sous-titres forcés : « Elle lit » / « ce que la demande » / « fait vraiment. » ; « Et elle compare. » ; « Le site demande » / « tous tes dollars. ».

### Recalage sur le nouveau minutage

- Pause h5 raccourcie : la scène commence à `h6 - 0,70`. Les événements 54,00 à 54,75 gardent leur décalage par rapport à h6, diminué de 0,10 s.
- Pause h7 (2,4 vers 1,2) : butée 3 à `fin h7 + 0,25`. L'événement de 60,00 de la proposition d'origine (« 50 DUSDC » qui descend buter contre « tout ») est supprimé. Anticipation à `h8 - 0,55`, « TOUT » à `h8 - 0,40`.
- Pause h8 (2,4 vers 1,3) : les tractions de 63,30 et 63,90 sont supprimées. Le clic tombe à `fin h8 + 0,11` environ, une traction à mi-course, verdict et gant à `h9 - 0,23`.

### Les prises réelles

De 54,00 au clic, la fenêtre reste sur l'image 43 : phrase tapée, « Ce que j'ai compris », bouton « Vérifier » blanc. C'est l'état vrai d'avant le clic ; le dessin explique au ralenti ce que l'extension fera. Au clic, 24 images à 25 i/s : « Je compare… » ne reste que sa durée réelle. Dans `reelFrame`, `tCmp` devient `impact - 0,96` et la borne `Math.min(60, …)` passe à 68. La fenêtre est touchée trois fois : anneau sur « 50 DUSDC », fil qui sort de son bord, anneau du clic. Aucune mention de bas d'écran dans cette scène.

### Raccords

- **Entrée (`h6 - 0,70`).** État reçu de s3a : fenêtre sur f036 à f043 ; trois cases dessinées avec « combien » en avant ; Clef réduite vers (880, 150) ; guichet en haut à droite avec sa corde arrêtée au bord de la fenêtre ; poche cachée derrière la fenêtre (graine 72).
- **Sortie (impact, `h9 - 0,23`).** État livré à s3c : poche en (1400, 470) ; main au bord de l'ourlet tenant tout (niveau 0), corde tendue ; « 50 DUSDC » à gauche sur le fil, « TOUT » à droite au pied de la jauge, tous deux entiers ; jauge de droite tracée ; fenêtre sur le verdict depuis une image ; calque à l'échelle 1.

### À ne pas refaire

1. Étirer la prise réelle pour suivre la voix (« Je compare… » de 58,0 à 64,5).
2. Faire d'un mot l'événement (« TOUT » gonflé, rogné, posé sur l'autre terme).
3. Tenir une image fixe sur un silence et écrire en petit gris.

### Infaisable ou à vérifier pour cette scène

La durée du clic au verdict a été lue sur huit images (0,8 à 1,1 s) et n'est pas dans `METRIQUES.md` : le filet court sans chiffre. La ligne `approve( app.neve.exchange, 2^256-1 )` vient de `acts.js` (l. 89 et 128) ; vérifier que c'est la demande exacte de la prise avant de la montrer nette. « tout revient sur ton compte » reste dans la fenêtre jusqu'au clic. La profondeur du fil à 50 est symbolique. `pk()` n'a ni taille de prise variable ni rotation : prévoir `lootR` et un `X.rotate` autour de l'ourlet. Demander une planche de contrôle à 4 images par seconde sur 54,0 à 65,5.

---

## Scène s3c : plan 3 (fin), 65 à 76,3 s

Le verdict « Ça ne correspond pas », le gant, le geste qui ramène le droit à 50, l'échange. Voix : h9 65,50 à 66,50 ; h10 67,40 à 70,16 ; h11 71,56 à 74,24. Début : impact du gant, `h9.debut - 0,23`. Fin : `k1.debut - 0,80`.

### Défauts confirmés

| Gr. | Temps | Défaut | Preuve |
|---|---|---|---|
| 3 | 71,0 à 72,5 | « Un geste. » : le geste n'est pas montré. Panneau et dessin identiques à 67,5 jusqu'à 72,0 ; à 72,5 tout a déjà changé. Ni curseur, ni bouton enfoncé, ni corde nouée. | planche_02 (1:11,0 à 1:12,5) |
| 3 | 67,5 à 72,0 | Quatre secondes et demie, dix vignettes identiques sous la phrase centrale, en rangée typographique « 50 DUSDC / gant / TOUT ». | planche_01 (1:07,5 à 1:10,5), planche_02 (1:11,0 à 1:12,0) |
| 3 | 72,5 à 76,0 | Retour à cinquante : second « 50 DUSD » rogné par le bord, deux chiffres identiques sans étiquette, sens porté par une légende grise de 17 px que le gant recouvre à 73,0. Moitié droite figée de 73,5 à 76,0. | planche_02 (1:12,5 à 1:16,0) ; plein_03 |
| 2 | 74,5 à 76,3 | « Ça correspond » ne tient qu'une seconde (74,5 et 75,0), sans voix ni accent, puis le panneau se vide (« C'est parti… » seul à 75,5 et 76,0). | planche_02 ; silences.txt 74,30 à 76,42 |
| 2 | 65,0 à 67,5 | Entrée du verdict : le verdict est déjà posé à 65,0 ; gant géant figé trois vignettes sur « TOU » rogné, « 50 DUSDC » masqué pendant « Ça ne correspond pas. ». | planche_01 (1:05,0 à 1:07,5) |
| 2 | 65,0 à 72,0 | Rapidité et classification : « Compris par Clef en 0,9 s » en gris de 14 px, jamais mis en avant. | plein_01, plein_02 |
| 2 | 67,5 à 72,5 | Étiquettes « tu as écrit » / « la demande donne » petites, grises, simultanées, puis retirées à 72,5. | planche_01 (1:07,0, 1:07,5), planche_02 (1:12,5) |
| 1 | 65,0 à 76,3 | Mention de bas d'écran en 13 px, seul endroit qui explique « DUSDC ». | plein_01 à 03 |

Vu en plus : à 72,5 le gant est à la même place alors que « TOUT » est déjà devenu « 50 » : le personnage qui incarne le produit est spectateur du seul acte du produit. Les lignes « Rien d'autre ne partira sans vérification. » et « Autorisation limitée à 50 DUSDC » restent en texte courant de 14 px. Le panneau laisse plus de la moitié de son cadre vide de 72,5 à 76,0.

Rejetés au contrôle : « "Un geste." affiché dès 71,0 » (faux, il apparaît à 71,5) ; « dernier T de TOUT rogné de 66,5 à 72,0 » (exagéré, la lettre se lit en entier).

### L'idée

Le gant plein attrape la corde. Un clic sur le vrai bouton fait nouer la corde par le gant, et la main ne descend plus que jusqu'au trait « 50 ». L'œil a vu deux longueurs inégales devenir égales, et il a vu que c'est Hold up qui a serré.

### Repères (après arbitrage, positions indicatives)

- Fenêtre réelle : `fenetre(t)` à `WX=70, WY=52, WS=1.6` (x 70 à 774, y 52 à 884). Aucun zoom. Ferme.
- Poche héroïne à l'écran en (1400, 470), échelle apparente 2,25, graine 72. C'est la poche « avec Hold up » du plan 4 vue à travers la pose de caméra du plan 3 (zoom 1,125). La dessiner hors `cam` ou égaliser `cam` à 1,0 aux deux frontières.
- Corde : de la main, en arc vers la gauche, par (1130, 290), jusqu'au socle du guichet (vers (1060, 280)).
- Gant plein : `gloveRise(t, tG, 1130, 430, 280, 1100)`. Il monte entre la fenêtre et la poche et se referme sur la corde à (1130, 290). Il ne couvre ni la fenêtre ni la poche.
- Jauges à l'encre : à gauche de la poche (x = 1225), de l'ourlet au trait 50 (environ 55 px) ; à droite (x = 1580), de l'ourlet au fond (environ 300 px). La jauge de droite existe déjà en entrée.
- Étiquettes : Montserrat blanc, 30 px au minimum, accrochées aux jauges ; rien à moins de 80 px du bord droit.

### Mise en scène, temps par temps (temps v3)

| t | Événement |
|---|---|
| 65,00 | `T_GANT`. Le gant jaillit du bas avec sa traînée de doigts (acquis à garder). |
| 65,27 | **Impact**, 0,23 s avant « Ça ne correspond pas. ». Le gant se referme sur la corde. La main lâche : les pièces retombent (niveau 0 vers 1 en 0,3 s), la main reste pendue à mi-poche. La corde se tend, la poche sursaute. Secousse 22, éclair 0,6. Sur la même image la fenêtre est au verdict (`tN = tImp` dans `reelFrame`). |
| 65,45 | Retombée : la main oscille, un seul tassement du gant. |
| 65,50 | Voix « Ça ne correspond pas. » Rien ne masque rien : pas de gros plan, pas de « TOU » géant. |
| 65,95 | Le fil à 50 bat une fois ; son départ se rattache à la ligne du panneau « Tu as écrit 50 DUSDC. » (y vers 510). Trait de soulignement sur cette ligne, en 0,2 s. |
| 66,25 | Un second fil part de « La demande donne accès à tout ton DUSDC. » (y vers 552) jusqu'à la main arrêtée. Soulignement de la ligne. |
| 66,60 | Trait sous « Compris par Clef en 0,9 s » (y vers 617). Le chiffre s'en détache : « 0,9 s » monte de 21 à 64 px et se pose vers (930, 770). Dessous, 28 px : « Clef a compris ta phrase (sur cette prise) ». Clef, accrochée au fil, bat en même temps. |
| 67,00 | Avant « Tu as écrit cinquante. » : la jauge de gauche se trace, butée à 50. « 50 DUSDC » passe à 64 px, aligné sur x = 1205. Dessous : « tu as écrit », 30 px. |
| 67,40 | Voix. |
| 67,90 | Sous le gant, la main tire un petit coup. La corde vibre, le gant ne bouge pas. |
| 68,55 | Avant « La demande donne tout. » : une main fantôme (alpha 0,45, corde en tirets) se détache de la main retenue et glisse jusqu'au fond en 0,35 s. Les pièces du fond se soulèvent. |
| 68,75 | La jauge de droite bat et s'épaissit en suivant la main fantôme. Étiquette « la demande donne », 30 px. |
| 69,45 | Sur « tout » : « TOUT », déjà en place, bat (1,15 puis 1), secousse 9. Les deux jauges, 55 contre 300 px, battent ensemble. |
| 70,00 | Retombée : la main fantôme racle le fond, la poche oscille. |
| 70,30 | « 0,9 s » et sa légende s'effacent. Le second fil aussi. |
| 70,55 | Une flèche de pointeur dessinée à l'encre entre par le bas de la fenêtre et glisse vers le bouton « Limiter à 50 DUSDC et envoyer » (x 326 à 732, y 788 à 855), 0,7 s. Mention de bas d'écran de 70,5 à 73,0 : « clic montré au dessin · copie locale, argent fictif ». |
| 70,90 | La main retenue tire un deuxième coup, plus fort. Le gant encaisse. |
| 71,25 | La flèche se pose. Un anneau d'encre autour du bouton. |
| 71,45 | Anticipation : la flèche recule de 6 px, le gant pivote de -0,12 rad. |
| 71,56 | **Le geste**, sur « Un geste. ». Quatre choses sur la même image : (a) l'anneau se contracte et une image de blanc couvre le bouton ; `reelFrame` démarre la séquence 93 à 108 (`tPress = L.h11.debut`) ; (b) le gant tourne de +0,25 rad et le nœud apparaît (`knot: true`), secousse 10 ; (c) la main est rappelée d'un coup à `wy = -8`, la main fantôme remonte se fondre dans elle ; (d) la jauge de droite se rétracte de 300 à 55 px en 0,3 s, « TOUT » s'écrase et renaît en « 50 DUSDC » (l'écrasement `sq` déjà codé à `tFix`, avancé ici). |
| 71,90 | Le nœud se serre d'un cran. Les deux jauges, égales, battent ensemble. Étiquette droite : « la demande donne maintenant ». |
| 72,16 | La fenêtre est sur « C'est parti vers ton portefeuille. Autorisation limitée à 50 DUSDC. » (image 108 tenue). Trait sous « Autorisation limitée à 50 DUSDC » ; un fil part de cette ligne jusqu'au nœud. |
| 72,45 | Voix « Le droit revient à cinquante. » L'image est en place depuis 0,3 s. |
| 72,90 | Sur le nœud, une étiquette « droit : 50 », 30 px. La légende « le droit est ramené à ce que tu as écrit » est supprimée. |
| 73,40 | Le gant lâche et sort vers le bas en 0,4 s ; un petit gant (environ 120 px) reste pincé sur le nœud. Rien n'est écrit sous sa trajectoire. |
| 73,85 | Trait sous « Rien d'autre ne partira sans vérification. » (y vers 537). La flèche a glissé hors champ. |

*Queue : l'échange, sous l'écran « Ça correspond »* (E = fin de h11, 74,24 en v3)

| t | Événement |
|---|---|
| E + 0,05 | La fenêtre passe à « Ça correspond à ce que tu as écrit. » et s'y tient jusqu'à sa sortie. `reelFrame` plafonne sur une image de cet état (autour de 113 à 130, à repérer). Ne jamais jouer la suite : l'image 150 est un cadre presque vide. Un trait file sous la phrase en 0,3 s. |
| E + 0,35 | Anticipation : la main se ferme, la poche se pince. |
| E + 0,50 | L'échange : une poignée part le long de la corde vers le guichet (0,45 s). Le niveau passe de 1 à 0,55. L'étiquette du nœud défile de « droit : 50 » à « droit : 0 ». La poche rebondit. |
| E + 0,95 | La poignée entre dans le guichet. Le nœud glisse jusqu'à l'ourlet et se serre, le petit gant s'écrase et se redresse. « droit : 0 » se pose. |
| E + 1,00 | Frontière avec s4 (`k1 - 0,80`). La fenêtre glisse hors champ à gauche en 0,3 s ; jauges et étiquettes de droite s'effacent, sauf « droit : 0 ». |

L'essai unique de la main (74,90) et son renoncement (75,40) de la proposition d'origine sont supprimés : les butées sont le temps fort du plan 4.

Total : un événement toutes les 0,4 s environ, plus long écart 0,55 s. Ajouter au `blur` du plan 3 les fenêtres 68,55 à 68,9 et 71,56 à 71,8.

### Recalage sur le nouveau minutage

- Pause h8 raccourcie : sans effet ici, la scène commence à l'impact.
- Pause h11 (2,8 vers 1,8) : la queue tient en 1,0 s (table ci-dessus), les 0,8 s restantes sont à s4.

### Les prises réelles

Cadre 704 x 832, jamais recadré, agrandi ni déformé. L'appui se montre en surimpression (anneau, éclat) : la prise ne contient aucun état « bouton enfoncé ». Le verdict apparaît sur l'image de l'impact ; le clic déclenche le nœud sur la même image. Six traits de soulignement à l'encre, un par ligne utile. Le chiffre « 0,9 s » sort de sa ligne grise et vit 3,7 s en 64 px. Le panneau n'est jamais dans un état vide.

### Raccords

- **Entrée (impact, `h9 - 0,23`).** État reçu de s3b : poche en (1400, 470) ; main au bord de l'ourlet tenant tout ; « 50 DUSDC » à gauche sur le fil, « TOUT » à droite, entiers ; jauge de droite tracée ; fenêtre au verdict ; calque à l'échelle 1.
- **Sortie (`k1 - 0,80`).** État livré à s4 : poche héroïne nouée, niveau 0,55, main à `wy = -8`, petit gant sur le nœud, étiquette « droit : 0 » ; guichet visible en haut ; fenêtre en train de sortir à gauche. s4 commence par un recul de caméra du zoom 1,125 au zoom 1,0 : aucun objet ne saute.

### À ne pas refaire

1. Dire un acte sans le montrer : le « geste » était un avant et un après, et le gant regardait « TOUT » changer.
2. Des mots posés à côté d'une capture : la comparaison passe par la poche, la corde, la main, le nœud et deux longueurs.
3. Le sens confié à du petit gris, du texte rogné ou une fin vide.

### Infaisable ou à vérifier pour cette scène

Le clic réel n'existe pas dans la prise (flèche et anneau sont du dessin, dit par la mention). Aucune image du portefeuille ne montre le montant ramené à 50 : la preuve reste la ligne « Autorisation limitée à 50 DUSDC ». « 0,9 s » est la valeur affichée par cette prise ; la seule mesure citable est « verdict avec appel réel à Clef : p50 387 ms, p95 1 436 ms (n = 2 101) ». « DWAVAX » n'est pas vérifié : ne pas le souligner. Seules f096 et f150 ont été ouvertes : l'image à tenir pour « Ça correspond » et la continuité de 93 à 108 sont à vérifier. `film_correspond.webm` n'a pas été ouvert. Si `hand()` remplit en noir sans option, la main fantôme se contente de l'alpha.

Fichiers : `C:/Users/Adem/Secure Horizon/video/src/acts.js` (plan 3 : l. 87 à 147 ; `reelFrame` l. 91 à 98 ; sons l. 273), `C:/Users/Adem/Secure Horizon/video/src/film.js`.

---

## Scène s4 : plan 4, 76,3 à 93 s (le seul climax du film)

On pirate le site : sans Hold up le compte tombe à zéro, avec Hold up il ne reste rien à prendre. Voix : k1 77,04 à 79,04 ; k2 80,94 à 83,26 ; k3 85,26 à 88,83 ; k4 90,03 à 91,25. Début : `k1.debut - 0,80`. Fin : `r1.debut - 0,80`.

### Défauts confirmés

| Gr. | Temps | Défaut | Preuve |
|---|---|---|---|
| 3 | 76,3 à 93 | Le pirate n'est jamais dessiné. Aucun bras rayé, aucun coup sur le guichet, sur 33 vignettes et 6 images pleines. | planche_01 à 03 ; plein_02 à 06 ; ref/planche_01 (5,0 et 6,0) |
| 3 | 76,3 à 93 | Aucune prise réelle. La preuve de bout en bout se réduit à un dessin et à un chemin de fichier en 14 px. L'attendu (c) du Track 1 n'est pas montré. | plein_02 à 06 ; `STORYBOARD.md` l. 19 et 31 ; `METRIQUES.md` l. 86 |
| 3 | 76,3 à 93 | Deux colonnes étiquetées, cadre unique pendant 16 s : un schéma comparatif. | planche_01 à 03 |
| 3 | 80,0 à 82,0 | La poche gauche se vide en trois images, sans élan, sans pièces visibles qui partent ; « 0 » remplace le chiffre d'un coup. (À garder : l'image précède le mot « zéro ».) | planche_01 (80,0 à 81,5) ; plein_03 |
| 3 | 84,5 à 90,0 | Côté « avec Hold up » : une seule plongée de main à 85,5. Ni l'échange, ni la limite, ni la tentative du pirate. Le résultat est un texte gris de 18 à 20 px, « le pirate prend 0 ». Le même « 50 DUSDC » sert d'étiquette à tout. | planche_02 (85,0 à 87,0), planche_03 ; plein_05, plein_06 |
| 2 | 77,0 à 80,5 | Sept vignettes identiques pendant « Maintenant, on pirate ce site ». | planche_01 (77,0 à 80,0) |
| 2 | 81,5 à 85,0 | Huit vignettes identiques entre les deux moitiés, sans raccord. | planche_01 (81,5, 82,0), planche_02 (82,5 à 85,0) |
| 2 | 89,5 à 93 | « Il ne reste rien à prendre » sur une poche pleine, puis fin immobile de 90,5 à 92,5. | planche_03 ; plein_06 |
| 2 | 77,0 à 92,5 | « 50 DUSDC » mordu par le contour des poches, toit du guichet coupé, résultat du produit plus petit que la perte. | plein_02, 04, 05, 06 |
| 1 | 76,0 à 77,0 | Entrée : image grise isolée à 1:16,0 (film/planche_02), étiquettes qui surgissent ensemble à 77,0. | film/planche_02 ; planche_01 (76,5, 77,0) ; plein_01 |
| 1 | 81,5 à 91,5 | Sous-titres coupés après « à » (« le compte tombe à / zéro. »). | planche_01 à 03 |
| 1 | 77,0 à 92,5 | « 50 DUSDC » à l'écran quand la voix dit « cinquante ». | plein_02, plein_05 |

Vu en plus : après 81,0 la corde gauche et le gant disparaissent, on ne voit jamais où vont les pièces ; le plus gros élément de l'écran de 81,5 à 92,5 est le « 0 » de la perte ; le gant blanc plein n'apparaît dans aucune vignette, rien n'attribue la protection au produit.

Rejetés au contrôle : « "le pirate prend 0" en 13 px » (il fait 18 à 20 px) ; « la scène ne dit pas ce qui est rejoué » (la légende dit « rejouée » ; il manque que c'est un script qui rejoue le geste de l'extension).

### Constats tirés du code

- Le bras rayé est déjà codé mais caché (`acts.js` l. 165 à 167) : sa pointe s'arrête vers y = 132 et il est rogné au-dessus de y = 130, alors que le toit du guichet à l'échelle 1,5 monte vers y = 8. Il faut descendre le guichet, pas redessiner le bras.
- L'image grise isolée à 1:16,0 est très probablement le `flash(t, tSlam, .5)` de 76,89 : l'éclair d'un coup invisible. Déduit du code, à vérifier image par image.
- Les trois butées existent (`tries`, l. 55) mais avec 5 à 13 unités d'amplitude.

### L'idée

Le même bras rayé frappe le même guichet et tire sur deux cordes. À gauche il remonte trois poignées et la poche finit vide. À droite il bute trois fois sur un nœud tenu par le gant blanc et repart la main ouverte.

### Repères

- Guichet entier : `FB.by` vers 332, échelle 1,25 (toit vers y = 165, socle vers y = 440). Le bras est visible au-dessus. Ferme.
- Poches : ourlet y = 610, échelle 2,0. Poche de gauche x = 600. **Poche héroïne x = 1320, graine 72** : c'est celle du plan 3.
- Chiffres côté extérieur des poches, à 40 px au moins du contour : alignés à droite sur x = 450, à gauche sur x = 1470.
- Caméra propre au plan (`pose()`), flou 4 sur chaque déplacement rapide. Plus de dérive lente.
- Dans le dessin on écrit « 50 », jamais « DUSDC ». Chaque chiffre porte son nom : « il te reste », « droit », « le pirate prend ».
- Chiffres de `preuve_piratage.mjs` : solde de départ 100, l'échange en prend 50 des deux côtés. Sans Hold up le droit reste illimité et le compte passe de 50 à 0. Avec, le droit de 50 est consommé (reste 0) et le compte reste à 50.

### Mise en scène, temps par temps (temps v3)

L'échange (la poignée de droite, le droit qui défile de 50 à 0) a été joué à la fin de s3c. Le prélude de 75,30 à 76,45 de la proposition d'origine est supprimé.

*Entrée et k1, « Maintenant, on pirate ce site. » (77,04)*

| t | Événement |
|---|---|
| `k1 - 0,80` | Recul fouetté du zoom 1,125 (pose du plan 3) au plan large. On découvre le guichet entier, allumé, et la poche jumelle de gauche qui entre par la gauche au même niveau (0,55), main posée, corde libre. |
| `k1 - 0,60` | « droit : tout » glisse sur la corde gauche. « sans Hold up » puis « avec Hold up » sortent de leur ourlet en 6 images, décalés. « il te reste 50 » des deux côtés. « le site d'échange (fictif) » en 30 px. |
| `k1 - 0,55` | La pointe rayée entre par le haut à droite, s'arrête 120 px au-dessus du toit, recule de 30 px. |
| `k1 - 0,14` | Impact. La main traverse le toit, le guichet s'écrase, quatre fêlures, le rideau tombe en 0,1 s, éclair 0,5, secousse 18. Une onde court sur les deux cordes. |
| 77,05 et 77,10 | Poche gauche puis droite encaissent, les pièces tremblent. |
| 77,25 | Le guichet se redresse avec dépassement, les rayures défilent. Poussée vers le guichet (1,0 vers 1,18) jusqu'à 78,3. |
| 77,60 | La main rayée ressort sous le socle et empoigne la racine de la corde gauche. La corde se tend, la poche gauche est tirée de 10 px. |
| 78,05 | Vers « pirate » : même prise à droite. Le nœud tient, le petit gant s'écrase et revient. |
| 78,50 à 79,20 | La caméra suit l'onde de tension le long de la corde gauche jusqu'au gros plan de la poche (centre 560, 680 ; échelle 1,75). |
| 79,25 | Les doigts s'ouvrent grand. « droit : tout » dévale la corde et tape l'ourlet : rien ne l'arrête. |

*k2, « Sans Hold up : le compte tombe à zéro. » (80,94)*

| t | Événement |
|---|---|
| 79,75 à 80,05 | Anticipation puis première plongée. La poignée file sur la corde et sort par le haut. Niveau 0,55 vers 0,36 ; compte 50 vers 33. |
| 80,40 à 80,55 | Deuxième plongée, plus forte. Niveau 0,18 ; compte 16. |
| 80,85 | Troisième plongée, jusqu'au fond. |
| 81,05 | La main part avec la dernière poignée. Niveau 0. Le compte défile vers 0 sans se poser. La poche remonte et montre ses coutures. |
| 81,10 à 81,50 | Fouetté le long de la corde jusqu'au guichet (échelle 1,2). Les trois poignées traversent le guichet et montent en bosses dans le bras rayé. Sous le socle, côté gauche, « le pirate prend » compte 17, 33, 50 (96 px). |
| 81,90 | Fouetté retour, cadre moyen guichet et poche gauche. La corde vide pend, reliée au guichet. Elle ne disparaît plus. |
| 82,15 | Avant « zéro » : « 0 » frappe à 150 px sous « il te reste ». Secousse 12, éclair 0,35. |
| 82,40 | La corde vide se balance. |
| 82,70 | La main rayée ressort sous le socle, ouverte, et se tourne vers la droite. |
| 83,00 | Travelling latéral vers la droite. La poche vide et son « 0 » restent en bord gauche. |

*k3, « Avec Hold up : le droit de cinquante a servi à l'échange. » (85,26)*. Amplitudes de `tries` multipliées par 3.

| t | Événement |
|---|---|
| 83,30 | La main rayée empoigne la corde droite, tension sèche. |
| 83,70 à 84,30 | La caméra suit l'onde jusqu'au gros plan de la poche droite (centre 1360, 680 ; échelle 1,75). |
| 84,40 | Le gant se resserre sur le nœud. « droit : 0 » et « il te reste 50 » dans le cadre. |
| 84,85 | Première traction. La main s'arrête 30 px au-dessus des pièces, la corde s'arque, le gant s'écrase. « le pirate prend 0 » apparaît sous le socle droit (96 px) et tressaute. |
| 85,45 | Deuxième, plus forte. L'écart avec les pièces reste visible. |
| 86,05 | Troisième. Poche soulevée de 20 px, corde droite comme une tige. Secousse 10. |
| 86,45 | La corde se détend, la main remonte et balance. Le niveau n'a pas bougé. |
| 86,90 | La caméra glisse au nœud (centre 1340, 560 ; échelle 1,6). |
| 87,05 | Rappel de l'échange, juste avant « a servi à l'échange » : le gant tape deux fois l'étiquette, qui revient à « droit : 50 ». Une poignée en pointillé, marquée « l'échange », refait le trajet (0,4 s) et l'étiquette redéfile de 50 à 0. |
| 87,50 | « 0 » se pose, le nœud se serre encore. |
| 87,90 | Recul en cadre moyen droit, poche vide en bord gauche. |
| 88,30 | « 0 » du pirate frappe à 150 px, même corps que le « 0 » de gauche. Secousse 12. |
| 88,75 | Petite quatrième traction, la corde bouge à peine. |

*k4, « Il ne reste rien à prendre. » (90,03)*

| t | Événement |
|---|---|
| 89,00 à 90,20 | Recul vers le plan large. |
| 89,20 | La main rayée lâche la corde, s'ouvre à plat, vide, se secoue deux fois. |
| 89,60 à 89,80 | Le bras se ramasse puis file hors champ en haut à droite. Fêlures et rideau restent. |
| 89,90 à 90,30 | Tout le côté gauche passe à 35 %. La corde droite se relâche et balance avec son nœud ; le gant donne une dernière pression. |
| fin k4 + 0,05 à + 0,80 | Sortie (voir raccords). |

Sous-titres : « le compte tombe » / « à zéro. » ; « Il ne reste rien » / « à prendre. ».

Légende en 28 px : « Rejoué par script (le geste de l'extension, pas l'extension) sur une copie locale d'Avalanche. Argent fictif. » Plus de chemin de fichier.

Sons à recaler (types existants, non écoutés) : boum à l'impact du bras, à 82,15 et à 88,30 ; toc à 77,60, 78,05 et 83,30 ; poignée à 80,05, 80,55 et 81,05 ; bute à 84,85, 85,45 et 86,05 ; retire à 89,80.

### Recalage sur le nouveau minutage

- Pause h11 raccourcie : la scène dispose de 0,8 s avant k1 (table ci-dessus).
- Pause k1 (1,9 vers 1,3) : caméra posée sur la poche gauche à `fin k1 + 0,15`, « droit : tout » à `+ 0,20`, plongées à `k2 - 0,75`, `k2 - 0,40` et `k2 - 0,09`.
- Pause k2 (2,0 vers 1,2) : le travelling part à `fin k2 - 0,26`, prise de la corde droite à `fin k2 + 0,05`, gros plan posé à `+ 0,65`, gant resserré à `+ 0,70`, première traction à `k3 - 0,40`.
- Pause k4 (2,4 vers 1,6) : la scène garde 0,8 s après la voix. Le recul lent final (1,0 vers 0,92) de la proposition d'origine est supprimé.

### Les prises réelles

Il n'y en a aucune : la régie du piratage n'a pas été filmée. Le plan reste dessiné et la légende le dit. Ne pas réutiliser une capture de l'extension ici, elle ne prouverait pas le piratage. Si un terminal du script est capturé avant le gel, il entre dans les 0,8 s finales, entier, à l'échelle native, et le gant souligne la ligne du résultat « sans », puis « avec ».

### Raccords

- **Entrée (`k1 - 0,80`).** État reçu de s3c : poche héroïne nouée, niveau 0,55, main à `wy = -8`, petit gant sur le nœud, étiquette « droit : 0 », vue au zoom 1,125 (à l'écran en (1400, 470), échelle apparente 2,25). La fenêtre réelle finit de sortir à gauche. La première image de s4 est identique : même pose de caméra, puis recul.
- **Sortie (`r1 - 0,80`).** De `fin k4 + 0,05` à `+ 0,80` : le côté gauche, déjà à 35 %, s'efface avec sa corde ; le guichet s'efface ; les étiquettes « avec Hold up », « il te reste 50 », « le pirate prend 0 » et la légende s'éteignent sur 0,3 s. État livré à s5 : poche héroïne seule en (1320, 610), échelle 2,0, nouée, pleine à 0,55, main posée, petit gant sur le nœud, plan large au zoom 1,0. Pas de mouvement du monde vers le haut.

### À ne pas refaire

1. Un effet sans cause : aucune poche, aucun chiffre, aucun éclair ne bouge sans que la main rayée ou le gant l'ait provoqué dans la demi-seconde précédente. Vérifier sur image que le bras est visible.
2. Un cadre fixe à deux colonnes : le plan large ne sert que trois fois (entrée, impact, fin de k4). Jamais plus de 1,2 s sans changement d'état.
3. Le résultat du produit en petit texte gris : le « 0 » du pirate a le corps du « 0 » de gauche. Aucun texte ne touche un contour.

### Infaisable ou à vérifier pour cette scène

La régie côte à côte du storyboard, avec le solde réel de 50 à 0, n'existe pas ; la seule preuve réelle accessible est la sortie de `node scripts/demo.mjs --fork` puis `preuve_piratage.mjs` (13 contrôles), non lancée pour cette revue. Le rideau qui tombe : `drawBooth` ne le fait que pour `F.hacked` à `T_HIT` ; prévoir un paramètre d'instant ou un rideau redessiné dans `acts.js`. La main rayée qui empoigne une corde sous le socle est un petit dessin à écrire. Le calage sur « pirate », « zéro », « a servi » se règle à l'oreille.

Fichiers : `C:/Users/Adem/Secure Horizon/video/src/acts.js` (plan 4 : l. 149 à 183 ; sons l. 274 et 275), `C:/Users/Adem/Secure Horizon/video/src/film.js` (`drawBooth` l. 347, `stripedArm` l. 370, `lump` l. 307, `hand` l. 223), `C:/Users/Adem/Secure Horizon/research/demo_reelle/site_echange/test/preuve_piratage.mjs`.

---

## Scène s5 : plan 5, 93 à 108 s

Retirer une autorisation déjà donnée, le journal. Voix : r1 93,65 à 95,59 ; r2 96,29 à 98,93 ; r3 99,33 à 101,10 ; r4 102,50 à 105,70. Début : `r1.debut - 0,80`. Fin : `m1.debut - 0,70`.

### Défauts confirmés

| Gr. | Temps | Défaut | Preuve |
|---|---|---|---|
| 3 | 93,0 à 98,5 | Cinq secondes et demie, douze vignettes, sur une seule poche pendue immobile. « Révoquer n'est pas annuler » n'a aucune image. | planche_01 ; plein_01, plein_02 |
| 3 | 102,0 à 105,7 | Ni clic, ni portefeuille, ni signature : le panneau change d'état tout seul. « Retirée » tombe à 1:45,0, avant le mot « signe ». « Ton portefeuille te demandera de confirmer. » reste affiché sous « Retirée ». | planche_02 (1:41,5 à 1:44,5), planche_03 ; plein_04, plein_05 |
| 2 | 98,5 à 99,6 | Le seul geste dessiné (la main quitte la poche) tient en une seconde et ne laisse aucune trace : le zéro n'est porté que par une légende grise. (À garder : il arrive avant « C'est reprendre ».) | planche_01 (1:38,5), planche_02 (1:39,0, 1:39,5) |
| 2 | 99,5 à 102,0 | Cinq vignettes d'une poche seule, sans corde, qui flotte, puis se décale sans cause. | planche_02 ; plein_03, plein_04 |
| 2 | 102,5 à 108 | La ligne du journal « Retrait d'une autorisation : envoyé à ton portefeuille. » arrive entre 1:42,5 et 1:43,0 sans aucune marque, dans un texte de 12 px ; la légende « retirée : une ligne de plus au journal » l'annonce 2 s plus tard, quand rien ne s'ajoute. | planche_02 (1:42,0 à 1:43,5), planche_03 |
| 2 | 105,0 à 108 | Fin figée : cinq vignettes identiques de 1:45,5 à 1:47,5, sans raccord. | planche_03 ; silences.txt 105,77 à 108,09 |
| 2 | 93,0 à 108 | Jusqu'à quatre textes à la fois ; le crédit « Prise réelle » est affiché 9 s avant la prise. | planche_01 à 03 |
| 2 | 103,0 à 105,5 | Le sous-titre chevauche la légende placée sous le panneau (1:43,0, 1:44,5, 1:45,0). | planche_02, planche_03 |
| 2 | 102,0 à 108 | Poche petite, panneau collé au bord droit, texte de 12 px, dernière ligne du journal coupée, zoom lent mesurable sur la capture. | plein_03 à 05 |
| 1 | 93,0 à 108 | Le plan sort du vocabulaire de l'ouverture : un objet dessiné et un rectangle blanc. | planche_01 à 03 |
| 1 | 101,5 à 108 | « DUSDC » et « 127.0.0.1:8793 » sans explication. | plein_04, plein_05 |

Vu en plus : de 1:42,0 à 1:44,5 la légende dit « le droit est remis à zéro » à côté d'un panneau qui affiche « peut dépenser 50 DUSDC ». Le geste dessiné (1:39,0) et le geste réel (clic vers 1:42,5) racontent deux fois la même action, effet puis cause. Le lien « Retirer l'autorisation » n'est à l'écran que sur deux vignettes.

Rejetés au contrôle : « la ligne "Retrait…" est déjà en tête du journal à 1:42,0 » (faux : la première ligne est alors « Ça correspondait. ») ; « la poche devrait se vider » (révoquer retire le droit, pas les pièces : une poche pleine est juste).

### L'idée

Une main du site est restée dans ta poche. Le coup déjà parti ne se rattrape pas, mais cette main se retire. Le gant montre où cliquer, la poche (ton portefeuille) signe, et c'est seulement à la signature que la main est arrachée, que le panneau passe à « Retirée » et que la ligne est au journal.

Principe d'ordre : une seule révocation, racontée cause puis effet. La main dessinée ne quitte la poche qu'à l'instant où la prise réelle affiche « Retirée ».

### Mise en scène, temps par temps (temps v3)

**A. « Tu as déjà donné un droit trop large ? » (r1, 93,65)**

| t | Événement |
|---|---|
| 93,00 | Raccord sur la poche héroïne nouée du plan 4, même place et même échelle : (1320, 610), 2,0, graine 72. Six autres poches entrent par la gauche, une toutes les 0,05 s, avec le tassement de 9 px du plan 2b. L'échelle descend à 1,62 et la rangée se centre. |
| 93,30 | Les poches nouées butent une fois sur leur nœud, en vague. Celle du centre (x 960) n'a pas de nœud : sa main est enfoncée dans les pièces. |
| 93,55 | La main libre remue les doigts. Le niveau ne bouge pas : rien n'est encore volé. |
| 94,05 | Avant « droit trop large » : poussée sur cette poche, 1,62 vers 2,7 en 0,45 s ; les voisines sortent par les bords. Retombée à 94,60. |
| 94,90 | La main s'enfonce de 12 px, la corde se cintre puis revient. |

**B. « Révoquer, ce n'est pas annuler la transaction. » (r2, 96,29)**

| t | Événement |
|---|---|
| 95,30 | Anticipation : la main se ferme. |
| 95,45 | Une pièce quitte la poche et file le long de la corde, sortie par le haut à 95,95. Niveau 1 vers 0,86. C'est la transaction déjà faite. |
| 95,75 | Le gant (taille 190) surgit du bas droit et monte après la pièce. |
| 96,00 | Avant « Révoquer » : il s'arrête net sous le bord haut. La pièce est partie ; trois tirets d'encre marquent sa sortie. |
| 96,45 à 96,75 | Le gant pivote, redescend le long de la corde et s'arrête à hauteur de la main du site. Un anneau d'encre se trace autour d'elle. |
| 97,35 | Avant « annuler » : la caméra remonte de 140 px vers la trace de la pièce. |
| 97,60 | Un trait d'encre oblique barre la trace. |
| 98,00 | La caméra redescend. |
| 98,30 | L'anneau autour de la main bat une fois. À l'écran jusqu'à « transaction » : le coup parti, barré ; la main, cerclée. |

**C. « C'est reprendre l'autorisation. » (r3, 99,33)**

| t | Événement |
|---|---|
| 98,55 | La caméra panote : la poche glisse de x 960 à x 520. Ce mouvement amène le panneau par la droite (tassement 6 px). |
| 98,75 à 99,10 | Le gant traverse en arc et s'arrête sous le lien « Retirer l'autorisation ». |
| 98,90 | Le crédit entre en bas à gauche, jusqu'à 101,40. |
| 99,15 | Avant « C'est reprendre » : un trait d'encre souligne le vrai lien. Il reste à l'écran 2,3 s, contre 1 s aujourd'hui. |
| 99,70 | Avant « l'autorisation » : un fil d'encre part du lien et rejoint l'anneau autour de la main. |
| 100,20 | Le fil touche. L'anneau éclaire, la main tressaille, la corde vibre. |
| 100,90 | Anticipation du clic : le gant recule de 40 px et se tasse. |
| 101,35 | Le gant frappe le lien. Anneau de clic, le panneau encaisse 4 px. |
| 101,50 | Le panneau passe à `retrait.png` (« En cours… »). Au même instant le fil se tend et la main du site remonte au bord de la poche et y tremble. |
| 101,60 à 101,90 | Un cadre d'encre fin autour de la nouvelle première ligne du journal, à l'instant réel de son arrivée. Tenu 1,0 s. Aucune légende. |

**D. « Hold up prépare la transaction. Ton portefeuille la signe. » (r4, 102,50)**

| t | Événement |
|---|---|
| 102,05 | Avant « Hold up prépare » : le gant tire du panneau une ligne de texte, `approve( 127.0.0.1:8793, 0 )`, 40 px, née de la ligne « En cours… ». C'est la grammaire du plan 3, avec zéro cette fois. |
| 102,60 à 103,30 | Le gant pousse la ligne le long du fil jusqu'à la poche. Elle se pose sur le rabat, la poche encaisse. |
| 103,70 | Avant « Ton portefeuille » : la poche répond, son contour bat, elle se soulève de 10 px et retombe. |
| 103,80 à 104,20 | Le gant recule vers le bord gauche, à moitié hors cadre. Ce n'est pas lui qui signe. |
| 104,30 | La main du site tire plus fort contre le bord. |
| 104,75 à 105,30 | Un paraphe d'encre se trace sur le devant de la poche (deux boucles). |
| 105,35 | Avant « signe » : point final frappé, secousse 6. |
| 105,55 | Anticipation : la main du site s'enfonce de 6 px, doigts ouverts. |
| 105,70 | Fin de la voix, impact : la main est arrachée en 0,25 s, la corde fouette, main et corde sortent par le haut. Éclair 0,35, secousse 14. |
| 105,75 | Le panneau passe à `apres.png`. |
| 105,80 à 106,10 | Cadre d'encre autour de « ne peut plus rien dépenser. / Retirée ». Le fil casse et se rétracte ; la ligne `approve` et le paraphe s'effacent. |

**E. Queue sans voix** (F = fin de r4)

| t | Événement |
|---|---|
| F + 0,45 | La poche, pleine, sans corde ni nœud ni main, finit de se rétablir. Le gant sort par le bord gauche. |
| F + 0,90 à + 1,25 | Le panneau repart par la droite, entier et net, par l'inverse de son entrée. |
| F + 1,30 | Frontière avec s6 (`m1 - 0,70`). |

L'aller-retour de caméra vers le guichet (106,15 à 106,90) et le recul vers la grille (107,25 à 107,95) de la proposition d'origine sont supprimés : le premier ne tient plus dans la pause raccourcie, le second est fait par s6.

### Recalage sur le nouveau minutage

- Pause k4 raccourcie : la scène dispose de 0,8 s avant r1. Entrée des six poches à `r1 - 0,65`, vague à `r1 - 0,35`, doigts à `r1 - 0,10`.
- Pause r4 (3,0 vers 2,0) : la queue tient en 1,3 s (table E).

### Les prises réelles

Trois images du panneau, enchaînées : `panneau.png`, `retrait.png`, `apres.png`. Boîte fixe, échelle constante 2,3 : x 1040 à 1868, y 24 à 820, hors `cam()`. Recadrage sur le haut (source y 0 à 346) : en-tête, état du droit, premières lignes du journal ; texte d'environ 20 px en 1280. Tout ce qui les anime est de l'encre posée par-dessus : soulignement du lien, fil vers la main, frappe du gant, cadre sur la ligne qui arrive, ligne `approve` qui en sort, cadre sur « Retirée ». Un seul texte en plus du sous-titre : le crédit « Trois prises réelles du panneau, enchaînées. Copie locale, argent fictif. ». Les trois légendes grises actuelles disparaissent. Rien d'autre sous y = 900 au centre.

### Raccords

- **Entrée (`r1 - 0,80`).** État reçu de s4 : poche héroïne seule en (1320, 610), échelle 2,0, nouée, main posée, petit gant sur le nœud, zoom 1,0 ; les étiquettes du plan 4 sont éteintes. Pas d'entrée par le bas.
- **Sortie (`m1 - 0,70`).** État livré à s6 : la poche libérée seule, sans main, sans corde, sans nœud, vers (520, 430), échelle 2,7 (à lire dans la transformation de `A5` à k = 1) ; panneau sorti ; aucun texte.

### À ne pas refaire

1. Tenir un dessin immobile pendant que la voix avance (5,5 s, puis 2,5 s, puis 2,5 s).
2. Montrer l'effet avant la cause, et dire avec une légende ce que l'image ne montre pas.
3. Poser la capture comme un rectangle à côté du dessin : texte de 12 px, lien visible 1 s, aucun clic, aucune signature.

### Infaisable ou à vérifier pour cette scène

Aucune prise de la fenêtre de signature du portefeuille : la signature est dessinée (paraphe) et le crédit ne la présente pas comme réelle. Les trois PNG font 360 x 680 : agrandis 2,3 fois ils seront mous ; une recapture en densité 3 règle le problème, sinon repli à l'échelle 2,0. « Ton portefeuille te demandera de confirmer. » reste sous « Retirée » dans `apres.png` : c'est l'écran réel, on ne le repeint pas. Le journal dit « envoyé à ton portefeuille », pas « retirée » : on marque la ligne au clic et on n'annonce rien à la signature. `approve( site, 0 )` est vérifié dans `research/demo_reelle/public_release/dist/hold-up-public/revoke.js` l. 98 pour un jeton ERC-20. La coupe du recadrage à y = 346 est à vérifier sur `retrait.png`.

---

## Scène s6 : plan 6, 108 à 121,9 s

La mesure : 250 cas, 87 %, 65 % sans la phrase, 15 % d'alertes à tort. Voix : m1 108,70 à 111,31 ; m2 112,11 à 115,00 ; m3 116,70 à 119,30. Début : `m1.debut - 0,70`. Fin : `f1.debut - 0,60`.

### Défauts confirmés

| Gr. | Temps | Défaut | Preuve |
|---|---|---|---|
| 3 | 108,5 à 121,9 | La scène est un graphique à pictogrammes : deux grilles de silhouettes plates, sans main, sans corde, sans gant, sans changement de cadre sur 13,5 s. | planche_01 à 03 ; plein_01 à 05 |
| 3 | 109 à 121,9 | Trois plages figées (1:49,0 à 1:51,0 ; 1:52,5 à 1:56,0 ; 2:00,0 à 2:01,5), environ 8 s sur 13,5. Grille de droite inerte pendant 9,5 s. | planche_01 à 03 |
| 3 | 116 à 118,5 | Le passage de 87 à 65 est un remplacement sous un lavis gris plein cadre (1:57,5) : les deux nombres ne sont jamais ensemble. La phrase écrite et son retrait ne sont jamais dessinés. | planche_02 (1:56,0 à 1:58,0) |
| 2 | 118,5 à 121,9 | Le 15 % d'alertes à tort et l'objectif manqué : jamais dits par la voix, plus petits que le 65, posés sur les poches, et les premières hachures arrivent pendant « soixante-cinq ». | planche_02 (1:58,5 à 1:59,5), planche_03 ; plein_05 |
| 2 | 112 à 121,9 | Nombres et légendes posés sur les poches à compter ; ligne de source minuscule au ras du cadre. | plein_02 à 05 |
| 2 | 111,5 à 121,9 | Code blanc, contour, hachures sans légende ; le blanc change de sens d'une grille à l'autre. | planche_01, planche_02 ; plein_03, plein_05 |
| 2 | 119 à 121,9 | Le 87 % et le 15 % ne sont pas au même seuil : 87 % = avertissement ou rouge (131/150) ; 15 % = rouge seul (15/100). Au même seuil que le 87, c'est 30/100. La légende ne dit pas « rouges ». | plein_05 ; `METRIQUES.md` l. 15 à 17, 31, 33, 35 |
| 2 | 108,5 à 111,5 | « Écrits sans voir nos règles » n'a pas d'image ; le 250 n'est écrit qu'en ligne de source. | planche_01 ; plein_01 |
| 2 | 112 à 118 | Les chiffres arrivent par un lavis gris plein cadre, sans réaction de la grille. | planche_01 (1:52,0), planche_02 (1:57,5) |
| 1 | 108 à 112,5 | Entrée sur un noir avec la seule ligne de source ; le 87 arrive avec le mot. | planche_01 (1:48,0 à 1:52,0) |
| 1 | 108,5 à 121,9 | Dérive lente d'échelle sans fonction (environ 4 % sur la scène). | plein_01 à 05 |

Vu en plus : bande noire vide d'environ 90 px entre les grilles et le sous-titre pendant que les nombres sont entassés sur les poches ; les 15 poches hachurées ne se comptent pas sous le texte.

Rejetés au contrôle : « le 65 posé avant la fin de la phrase » (ce n'est pas un défaut, c'est la consigne) ; « le storyboard promettait 131 mains qui butent » (citation non retrouvée dans `STORYBOARD.md`).

### L'idée

250 poches pendues à leurs cordes. Le gant Hold up se lève sur 131 des 150 poches attaquées, en lâche 34 dès qu'on lui arrache la phrase, et se lève à tort sur 15 des 100 poches honnêtes, cinq de trop par rapport à l'objectif. L'œil a compté les trois chiffres sur des objets du film et a vu l'aveu.

### Code visuel, identique dans les deux blocs

| Signe | Sens |
|---|---|
| Petit gant blanc levé sur la poche | demande signalée |
| Pas de gant, la main plonge, la poche passe en contour, un point remonte la corde | demande ratée |
| Gant levé sur une poche honnête | alerte à tort |
| Étiquette tenue par le grand gant | la phrase écrite |

Le gant veut dire « signalé », jamais « bloqué » : la mesure compte des alertes affichées. Donc aucun nœud dans cette scène.

### Disposition du plan large (zoom 1)

- Bloc gauche : 150 poches, 15 x 10, x = 150 + c·58, haut de poche y = 320 + r·54, échelle 0,36.
- Bloc droit : 100 poches, 10 x 10, x = 1230 + c·58, mêmes y.
- Colonne centrale (x 985 à 1207) : grand gant `glove(1096, 760, 200)`, étiquette de la phrase au-dessus.
- Bandeau haut sur fond noir : nombres en 180 px, ligne de base y = 225, centrés x = 610 et x = 1500. Légendes en 30 px.
- Poing du bras rayé vers (110, 215) : les 150 cordes y convergent. Guichet honnête vers (1830, 170) : les 100 cordes y convergent.
- Ligne de source : 26 px, vers (150, 895). Plus rien au ras du cadre.
- Bande basse droite : rangée de décompte du 15.

### Mise en scène, temps par temps (temps v3)

*Entrée et 250*

| t | Événement |
|---|---|
| 108,00 | Image identique à la dernière de s5 : la poche libérée seule, vers (520, 430), échelle 2,7. Aucun noir, aucun texte. |
| 108,05 à 108,95 | La caméra recule d'un trait (échelle de poche 2,7 vers 0,36, flou 4). La poche devient la case c7 r4 du bloc gauche. Pendant le recul, les 249 autres tombent du haut au bout de leur corde, avec leur main, en vague diagonale depuis cette case ; la poche héroïne reçoit sa corde et sa main dans la même vague, pas avant. Un compteur en haut au centre (110 px) monte de 1 à 250. |
| 109,00 | « 250 » se tasse. Toutes les poches font un rebond de 4 px. |
| 109,10 à 109,35 | Le bloc droit glisse de 222 px à droite. « 250 » se fend en « 150 demandes dangereuses » et « 100 demandes honnêtes ». |
| 109,15 à 109,60 | Dans la colonne, le grand gant monte. |
| 109,30 à 109,50 | Le bras rayé descend du haut à gauche et empoigne le faisceau. Les 150 cordes se tendent, les poches tressautent en onde. |
| 109,45 à 109,62 | Le guichet honnête se pose en haut à droite, les 100 cordes s'y accrochent. La ligne de source arrive en fondu, seulement maintenant. |

*« Écrits sans voir nos règles »*

| t | Événement |
|---|---|
| 109,70 | Un rideau de guichet tombe devant le grand gant sur toute la colonne. Écrit dessus : « nos règles », 30 px. |
| 110,00 à 110,70 | Rideau baissé, les 250 cas s'écrivent : une petite étiquette blanche se clipse sur chaque corde, en vague. |
| 110,75 et 110,92 | Le rideau se bombe deux fois (le gant pousse derrière). |
| 111,10 | Le rideau remonte sec en 4 images (« ouvert une seule fois »). Le gant apparaît, tassé, et se détend. |

*Le 87*

| t | Événement |
|---|---|
| 111,15 à 111,40 | Une étiquette quitte la case c7 r4, grossit en arc et se pose au-dessus du gant, qui la saisit. Elle se lit « échanger / 50 DUSDC », avec « la phrase écrite » en 22 px au-dessus. |
| 111,30 à 111,95 | Vague des gants, partie du grand gant : un petit gant (30 px) se lève sur 131 poches. Les 19 autres restent nues. Compteur « 0 / 150 » à « 131 / 150 ». À droite, les mains tapotent. |
| 112,00 | « 87 % » frappe à sa place, de 130 % à 100 % en 0,12 s. Secousse 10. Aucun lavis. Une onde part du nombre dans les poches. |
| 112,20 puis 112,35 | Légende sur fond noir : « 131 sur 150 signalées » puis « avec la phrase ». |

*Gros plan 1 : ce que « signalée » et « ratée » veulent dire*

| t | Événement |
|---|---|
| 112,55 à 112,80 | La caméra plonge sur la rangée r4 (zoom 1 vers 3,2, flou 6). Sous le flou, bascule sur un insert de trois poches `pk` (c6, c7, c8). c6 porte un gant debout sur son rebord. c7 porte un gant pendu à son étiquette. c8 n'a pas de gant. |
| 112,75 à 113,50 | La main de c8 plonge, ses pièces descendent à zéro, elle file par le haut avec son butin. Les mains de c6 (112,95) et c7 (113,15) s'arrêtent net sous leur gant et se replient. |
| 113,55 | L'étiquette de c7 et la ficelle qui tient son gant vibrent ensemble. |
| 113,90 à 114,15 | Retour au plan large. |
| 114,10 à 114,50 | Avant « signalées. » : les 19 poches sans gant passent en contour, 19 points remontent les cordes vers le poing rayé. |
| 114,45 | Les 131 gants battent une fois. Le poing rayé encaisse à 114,90. |

*On retire la phrase, gros plan 2*

| t | Événement |
|---|---|
| 115,45 à 115,70 | Un crochet au bout d'une corde descend et accroche l'étiquette du grand gant. |
| 115,85 | L'étiquette est arrachée vers le haut. Le grand gant s'affaisse. Un contour en pointillés reste à sa place. « avec la phrase » est barrée à 116,00. |
| 116,05 à 116,30 | Plongée sur les mêmes trois poches. |
| 116,30 à 116,45 | Les étiquettes de c6 et c7 se déchirent et tombent. Le gant de c7, pendu à son étiquette, tombe avec elle. Celui de c6 reste. |
| 116,60 à 117,10 | La main de c7 plonge, vide la poche (la voix dit « Sans la phrase »), file avec son butin. La main de c6 retente et se replie. |
| 117,20 à 117,45 | Retour au plan large. Rien ne bouge à droite jusqu'à la fin de la voix. |

*Le 65*

| t | Événement |
|---|---|
| 117,35 à 118,25 | 34 gants tombent un à un en accélérant. Chaque poche passe en contour, un point remonte sa corde. Le nombre descend sur place, 87, 86… 65. Un « 87 » fantôme (contour, alpha 0,35) reste décalé en haut à gauche du nombre. |
| 118,30 | « 65 % » frappe (même frappe, même onde). |
| 118,45 | Légende : « 97 sur 150 signalées / sans la phrase ». |
| 118,75 à 119,05 | Un arc se trace du 87 fantôme au 65, avec « 34 de moins » (26 px). |
| 119,10 | Le poing rayé encaisse. Les 53 poches vides se balancent. |

*Le 15 et l'aveu* (G = fin de m3, 119,30 en v3 ; rien ne bouge à droite avant G)

| t | Événement |
|---|---|
| G + 0,05 à + 0,30 | Le bloc gauche et son bandeau passent à 32 % d'opacité. La caméra glisse de 80 px à droite et pousse de 8 %. Le grand gant pivote vers la droite. Un trait vertical se trace dans la bande basse, avec « objectif : 10 » en 24 px. |
| G + 0,30 à + 0,90 | Dix gants se lèvent à tort, un par un, sur des poches honnêtes pleines dont la main recule. À chaque gant, un jumeau tombe s'aligner dans la rangée basse. Le compteur du bandeau droit monte de « 0 % » à « 10 % ». |
| G + 0,90 à + 1,00 | La rangée touche le trait. Le compteur bloque 3 images sur « 10 % », le trait tremble. |
| G + 1,00 à + 1,25 | Cinq gants de plus. Leurs jumeaux s'alignent au-delà du trait. |
| G + 1,30 | « 15 % » frappe, même corps que le 65 (180 px), même onde dans le bloc droit. |
| G + 1,50 | « alertes rouges à tort », 30 px, sur fond noir sous la rangée. |
| G + 1,70 | « manqué » claque (64 px) sous les cinq gants de trop. |
| G + 1,90 à + 2,40 | Sortie (voir raccords). Le 15 % est resté lisible 0,6 s après sa frappe, et se construit depuis G + 0,30. |

### Recalage sur le nouveau minutage

- Pause r4 raccourcie : la scène commence à `m1 - 0,70`. L'événement de 108,05 de la proposition d'origine (une corde et une main qui reviennent dans la poche avant le recul) est supprimé.
- Pause m2 (1,7 vers 1,2) : le tapotement de 115,20 est supprimé. Crochet à `m3 - 1,00`, étiquette arrachée à `m3 - 0,85`, le reste garde son décalage par rapport à m3.
- Pause m3 (3,4 vers 3,0, arbitrage) : la scène garde 2,4 s après la voix (table ci-dessus), les 0,6 s restantes sont à s7.

### Les prises réelles

Aucune dans cette scène, par honnêteté : les trois chiffres sont ceux du moteur de comparaison lancé en Node, « pas l'extension livrée » (`METRIQUES.md` l. 7 et 19). Poser la fenêtre de l'extension à côté du 87 ferait croire que le produit livré fait 87. La phrase est donc dessinée (l'étiquette « échanger / 50 DUSDC »).

### Raccords

- **Entrée (`m1 - 0,70`).** État reçu de s5 : la poche libérée seule, sans main ni corde, vers (520, 430), échelle 2,7, même transformation caméra que `A5` à k = 1 ; panneau déjà sorti ; aucun texte. À vérifier par différence d'images de part et d'autre de la coupe.
- **Sortie (`f1 - 0,60`).** De G + 1,90 à G + 2,40, flou 6 : nombres, légendes, rangée et petits gants s'éteignent en 0,15 s ; le bras rayé lâche le faisceau et remonte hors cadre ; le grand gant sort par le bas ; les cordes s'effacent ; le guichet glisse vers l'endroit exact où `A7` dessine son guichet ; chaque poche vole de sa case vers la position écran d'une poche de `F7.ps` (transformation de `A7` à z = 0,40), grossit et se remplit sous le flou ; les poches en trop sortent en rayon. État livré à s7 : poches pleines et guichet aux positions de `F7`, sans cordes, sans bras, sans texte.

### À ne pas refaire

1. Un graphique à la place d'un plan : aucune poche sans corde, aucun sens porté par un code de remplissage que rien n'explique.
2. Un nombre posé sur ce qu'il compte, et remplacé au lieu d'être construit.
3. L'image qui attend la voix ; et à l'inverse, un événement à droite pendant « soixante-cinq ».

### Infaisable, à trancher ou à vérifier pour cette scène

- Le 15 % et l'objectif manqué ne sont dits par aucune voix. Une ligne de voix demande un nouvel enregistrement : à trancher par Adem.
- 87 et 15 ne sont pas au même seuil. Ce cahier écrit « alertes rouges à tort ». Si Adem préfère la paire 87 et 30, la rangée du bas passe à 30 gants et le trait d'objectif n'a plus de sens.
- Le 15 vaut 15 sur 100 avec et sans la phrase (`RESULTAT.md` l. 29 et 31) : l'étiquette peut rester arrachée pendant le 15.
- Le 87 est le bras « code seul » (avec Clef : 88,7 %) : ne pas dessiner Clef en train de classer pour ce chiffre.
- Le rang des poches est un tirage (`RANK_A`, `RANK_B`) : forcer c6, c7, c8 de la rangée r4 dans les trois catégories (rang 53 ou plus ; rang 19 à 52 ; rang inférieur à 19).
- Lisibilité des 131 petits gants en 1280 de large : à contrôler sur une image pleine ; s'ils se confondent avec les poches, les passer à 38 px. Le rideau « nos règles » est une image neuve, lisibilité en 1,4 s non garantie.
- Pièces à coder : poche de plan large avec corde, étiquette, gant et point de butin ; caméra à clés ; rideau ; crochet ; rangée de décompte.

Fichiers : `C:/Users/Adem/Secure Horizon/video/src/acts.js` (plan 6 : l. 206 à 230), `C:/Users/Adem/Secure Horizon/METRIQUES.md`, `C:/Users/Adem/Secure Horizon/research/titouan/T_banc_e2e/blind_decalage/run/RESULTAT.md`.

---

## Scène s7 : plan 7, 121,9 à 132,4 s

La fin : le playbook, le cadre NIST, le gant, le nom. Voix : f1 122,70 à 123,63 ; f2 124,53 à 126,58 ; f3 128,98 à 129,57. Début : `f1.debut - 0,60`. Fin : `fin f3 + 2,40`.

### Défauts confirmés

| Gr. | Temps | Défaut | Preuve |
|---|---|---|---|
| 3 | 124,0 à 128,3 | Le playbook est une slide de texte posée sur le réseau éteint : quatre phrases alignées à gauche, la troisième en travers du guichet. | planche_01 (2:04,0 à 2:07,5), planche_02 (2:08,0) ; plein_02 |
| 3 | 124,0 à 126,6 | Pendant la phrase clé, cinq textes arrivent en 1,5 s et « c'est toi qui le décides » n'a pas d'image : à 2:06,0 rien n'arrive. | planche_01 (2:04,0 à 2:06,5) |
| 3 | 129,0 à 132,4 | Trois secondes de logo quasi immobile pour finir (grossissement de 1 à 2 % en 3 s). | planche_02 (2:09,0 à 2:12,0) ; plein_03 |
| 2 | 125,5 à 128,3 | Texte sans événement net pendant 2,5 s, dont tout le silence après la voix. | planche_01, planche_02 ; silences.txt 126,66 à 128,82 |
| 2 | 125,5 à 128,3 | La ligne NIST / ATT&CK / OWASP, attendu du Track 1, est illisible : gris moyen, 14 à 15 px en 720, en travers des poches. | plein_02 |
| 2 | 122,0 à 124,0 | « Tout site peut tomber » : le plan large revient, mais rien ne s'y joue. Aucune corde tendue, aucun nœud lisible, aucun impact. | planche_01 (2:02,0 à 2:04,0) |
| 2 | 128,0 à 129,0 | Passage au logo : noir complet à 2:08,5, puis logo déjà entier à 2:09,0, sans geste visible. | planche_02 |
| 1 | 129,0 à 129,6 | « Hold up » écrit deux fois (logo et sous-titre) ; logo décentré d'environ 40 px à droite. | planche_02 ; plein_03 |
| 1 | 124,5 à 128,3 | Le texte écran dit plus que les documents : « Automatique » perd la condition du playbook (« prouvé en Node, pas dans un vrai Chrome ») ; « une ligne de journal » alors qu'il y en a deux (verdict, décision) ; ASI01 « par analogie » et RS.MI-01 « au sens large » affichés sans réserve. | plein_02 ; `livrables/PLAYBOOK_REPONSE.md` l. 14 et 17 ; `livrables/MAPPING_REFERENTIELS.md` l. 13, 14, 21, 23 |

Vu en plus : le guichet central est anonyme alors que l'ouverture le nomme ; aucune poche ne porte un gant plein avant le logo, qui n'est donc relié à rien de ce qu'on vient de voir ; le logo est composé dans une autre police que les sous-titres (linéale étroite contre Montserrat Bold).

Rejetés au contrôle : « "Automatique" contredit le geste de la scène 3 » (le playbook dit lui-même que Hold up remplace le droit seul, sous conditions) ; « fond identique » (une poussée lente continue).

### L'idée

Le site tombe sous nos yeux, toutes les cordes se tendent et aucune poche ne se vide, parce qu'un gant blanc tient chaque corde à la marque « 50 ». Ce gant, c'est ta main, et c'est lui qui reste seul à l'écran avec le nom.

### Mise en scène, temps par temps (temps v3)

Tout se code dans la section PLAN 7 de `acts.js`. Les mots « toi » et « décides » sont estimés d'après les cartons de sous-titres : `tToi` vers 125,50 et `tDec` vers 126,00, à lire dans `TL.voix[..].mots[i].t`.

**Temps A : « Tout site peut tomber. », plan large puis plongée**

| t | Événement |
|---|---|
| 121,90 | Coupe franche raccord : le champ `F7` s'ouvre à z = 0,40, poches et guichet là où s6 les a laissés. Les cordes jaillissent du guichet vers les bords en 9 images. |
| 122,00 | Le bras rayé tombe du haut en 6 images. |
| 122,25 | Anticipation : le bras remonte de 35 et se ramasse. La caméra pousse de 0,40 à 0,50. |
| 122,45 | Impact sur le toit, 0,25 s avant « Tout ». Le guichet s'écrase et se redresse, secousse 16, éclair 0,5. |
| 122,45 à 123,00 | Une onde part du guichet. À son passage chaque corde se tend, chaque poche saute de 26 unités (les 9 actuelles donnent 4 px, invisibles), et l'anneau de nœud de chaque poche devient un disque blanc plein. Toutes les poches restent blanches : l'inverse exact de l'ouverture. |
| 122,85 | Plongée : la caméra suit une corde jusqu'à la poche c = 12, r = 5. Zoom 0,50 vers 2,5 en 9 images, flou 6, retour à 2,4 à 123,20. |
| 123,20 | La poche héroïne, dessinée par `pk()` : à gauche du centre (x vers 700, haut vers y = 520), pleine, la main noire posée sur les pièces. Sur la corde, vers y = 400, un trait d'encre court avec « 50 » (34 px) et le nœud. Le gant blanc plein (taille 260, venu de la droite) tient déjà le nœud. |
| 123,30 | Sur « tomber » : premier essai. La main plonge, le nœud bute contre le gant, qui s'écrase de 6 % et revient. Secousse 10, les voisines sautent en écho. |
| 123,80 | Deuxième essai, plus fort. La corde vibre, le gant ne bouge pas. |

**Temps B : « Ce qu'il emporte, c'est toi qui le décides. », même cadre**

| t | Événement |
|---|---|
| 124,00 | Avant « Ce qu'il » : un anneau d'encre éclate au point de contact nœud et gant. « Détecter » claque à droite (84 px), seul mot à l'écran. |
| 124,30 | Troisième essai, le plus fort, et il ne relâche pas. La corde glisse dans le gant, le nœud descend de 70 px sous le trait « 50 ». Les doigts noirs touchent les pièces. Le gant tremble. |
| 124,53 à 125,20 | La tension est tenue mais vivante : le nœud rampe, la corde vibre, deux pièces se soulèvent. Aucun nouveau texte. |
| `tToi - 0,25` | Anticipation : le gant cède 12 px vers le bas. |
| `tToi - 0,10` à `tToi` | Le gant remonte le nœud d'un trait jusqu'au « 50 », dépasse de 10 px, se pose. La main noire est arrachée des pièces, qui retombent. Secousse 12, éclair 0,3 sur « toi ». |
| `tToi + 0,10` | « Répondre » claque (84 px). « Détecter » passe à 35 % : un seul mot vif à la fois. |
| `tDec` | Verrouillage : le bras rayé lâche, la corde au-dessus du gant tombe molle, la main noire pend et balance. La poche est pleine. |
| 126,30 | Dernier balancement ; le trait « 50 » reçoit un petit coup de blanc. |

**Temps C : le journal, puis le cadre, dans le silence**

| t | Événement |
|---|---|
| 126,55 | Du nœud part un trait d'encre horizontal vers la droite : la ligne de verdict. |
| 126,75 | Un second trait dessous : la ligne de décision. Un maillon les accroche à 126,90. Mot « journal » (44 px) au bout. |
| 126,95 | Le second trait file à droite. La caméra le suit en panoramique sec. La poche sort par la gauche ; fond noir plein ; le trait traverse l'écran à y = 600 comme une corde tendue. |
| 127,10 puis 127,30 | « Détecter » puis « Répondre » tombent sur la corde et s'y accrochent (84 px, blanc franc). La corde fléchit sous chaque arrivée. |
| 127,55 | « NIST CSF 2.0 » s'écrit au bout gauche de la corde (44 px). |
| 127,85 | « ATT&CK T1657 » s'accroche à droite (44 px). Rien d'autre : ni codes de sous-catégories, ni ASI01, ni RS.MI-01. |
| 128,15 | La corde est pincée, les quatre mots tressautent. |
| 128,45 | Coupe franche au noir. Le cadre a tenu 1,35 s en blanc sur noir. |

**Temps D : le gant, le nom**

| t | Événement |
|---|---|
| 128,45 à 128,55 | Noir, 3 images : la seule respiration du film, rompue par un mouvement. |
| 128,50 | Une corde blanche tombe du haut de l'écran et fouette. |
| 128,55 | Le gant monte du bas (taille 420) et attrape le bout de la corde à 128,81 : corde tendue net, secousse 20, éclair 0,5. |
| 128,98 | Voix « Hold up. ». Le nom claque à droite du gant, en Montserrat 700 de 150 px. Le bloc gant et nom est centré sur x = 960 par `measureText`. Pas de sous-titre sur f3. |
| 129,70 à 130,00 | Le bras rayé entre par le haut à droite, se ramasse, frappe la paume et s'arrête net. Le gant s'écrase et revient, anneau d'encre au contact, secousse 14. |
| 130,40 | Deuxième coup, plus faible. Le gant ne bouge plus ; c'est le bras qui ondule. |
| 130,75 à 131,10 | Le bras pend, puis repart vers le haut. |
| 131,05 | Derrière, le réseau `F7` reparaît à 25 % de luminosité, poches pleines, sauf à moins de 60 px du bloc gant et nom. |
| 131,45 à 131,95 | Une dernière onde part du gant : les disques de nœud s'allument l'un après l'autre jusqu'aux bords. Fin du film sur cette onde. |

Sons à recaler (non écoutés) : boum à 122,45, à `tToi` et à 128,81 ; bute à 123,34, 123,84, 124,34, 130,00 et 130,40 ; tic à 124,00, 126,90 et 128,15 ; retire à `tDec` et à 130,75.

### Recalage sur le nouveau minutage

- Pause m3 : la scène dispose de 0,6 s avant f1. Coupe à `f1 - 0,60`, bras à `f1 - 0,50`, anticipation à `f1 - 0,35`, impact à `f1 - 0,20`.
- Fin (2,8 vers 2,4) : la tenue finale de 132,00 à 132,37 est supprimée. Le film finit à `fin f3 + 2,40`, sur la dernière onde.

### Les prises réelles

Aucune, et c'est voulu : les captures qui porteraient le playbook sont déjà jouées aux plans 3 et 5 ; les reposer ici referait « capture et texte ». Le réel entre par trois raccords : le gant est celui de la vraie fenêtre (même tracé `G_PAUME`) ; la marque sur la corde est le montant écrit ; les traits du journal sont deux, comme le playbook.

### Raccords

- **Entrée (`f1 - 0,60`).** État reçu de s6 : poches pleines et guichet aux positions du champ `F7` à z = 0,40, sans cordes, sans bras, sans texte. s7 dessine les cordes (elles jaillissent à la coupe) et fait retomber le bras. Supprimer tout glissement latéral d'entrée.
- **Sortie.** Dernière image : gant plein et « Hold up » centrés, réseau gris derrière, tous les nœuds allumés. Pas de fondu : coupe à la fin du fichier.

### À ne pas refaire

1. Éteindre le dessin pour poser du texte : jamais plus d'un mot vif à l'écran avec le sous-titre, et chaque mot est accroché à un geste.
2. Faire arriver l'image avec le mot, ou après : ici le gant tient la corde 2,3 s avant « toi » et monte 0,43 s avant « Hold ».
3. Tenir un plan qui ne change pas : six vignettes identiques de 2:05,5 à 2:08,0, sept de 2:09,0 à 2:12,0.

### Infaisable ou à vérifier pour cette scène

La main qui choisit parmi trois : l'écran réel n'a que deux boutons, et « Retirer l'autorisation » est dans un autre panneau ; la ligne « Humain » est portée par le gant et la voix. Les quatre lignes du playbook ne sont plus écrites : restent quatre gestes et trois mots (Détecter, Répondre, journal) ; les phrases et les codes restent dans la fiche de défense. `glove()` est un tracé fixe, paume ouverte : un poing fermé demanderait un nouveau dessin. L'alphabet d'encre `GLY` ne contient que L, I, F et le point : le guichet reste anonyme, ce qui va avec « tout site ». Le cadre NIST tient 1,35 s, pas 1,5 s. La lisibilité du nom sur le réseau gris à 131,05 est à juger sur une image rendue ; repli : fond noir et fin sur le bras qui repart.

---

## Ce qui reste infaisable sans nouvelle matière

1. **Le portefeuille réel et le site réel.** Aucune prise du portefeuille (bouton de confirmation, demande de signature, montant ramené à 50) ni du site d'échange. « Devant ton portefeuille », « avant de signer », « ton portefeuille la signe » restent dessinés (poche, paraphe).
2. **La preuve réelle du piratage.** La régie côte à côte du storyboard n'a pas été filmée. Seule matière accessible : la sortie de `node scripts/demo.mjs --fork` puis `preuve_piratage.mjs`, à capturer en image avant le gel. Sans elle, l'attendu (c) du Track 1 est montré par un dessin et une légende.
3. **Un temps de décision mesuré.** `METRIQUES.md` note « demande du site vers verdict affiché » comme non mesuré de façon reproductible. Le film ne peut montrer que « 0,9 s, sur cette prise » et la vitesse réelle de la prise (clic vers verdict en 0,96 s environ, lue sur huit images). La seule mesure citable est p50 387 ms, p95 1 436 ms (n = 2 101) pour le verdict avec appel à Clef.
4. **« Dollars » contre « DUSDC ».** La voix ne change pas et les prises écrivent DUSDC. La mention « DUSDC = dollar de démonstration » atténue l'écart sans le supprimer. Le supprimer demande une nouvelle prise ou une nouvelle ligne de voix.
5. **« Clef » dans la voix.** Elle ne le dit jamais. Le nom n'existe qu'à l'image (la clef dessinée, 64 px, à 51,75 ; la ligne du panneau soulignée à 66,60).
6. **Le 15 % et l'objectif manqué dans la voix.** Portés par l'image seule. Une ligne de voix demande un nouvel enregistrement.
7. **La netteté du panneau du plan 5.** PNG de 360 x 680 agrandis 2,3 fois : une recapture en densité 3 est nécessaire pour un texte net de 20 px.
8. **L'écran `apres.png`** garde « Ton portefeuille te demandera de confirmer. » sous « Retirée ». La correction est dans le produit, puis recapture.
9. **Dessins neufs à écrire** (aucune image nouvelle requise) : clef, clavier, cases, flèche de pointeur, main rayée qui empoigne une corde, rideau animé, crochet, poche de plan large avec corde et gant, paraphe.

Décisions à demander à Adem : la paire de chiffres du plan 6 (87 avec « 15 rouges à tort », ou 87 avec 30) ; une ligne de voix pour le 15 % ; la cohérence « fil à 50 » (plan 3) contre « il te reste 50 » (plan 4).

## Ce que ce diagnostic ne couvre pas

- **Le son n'a pas été écouté.** Les silences viennent de `silences.txt` et de `lignes.json`. La présence, la force et le calage des impacts ne sont pas jugés. Tous les repères sonores cités sont des propositions tirées du code.
- **Deux images par seconde seulement.** Tout mouvement de moins de 0,5 s entre deux vignettes peut avoir échappé : anticipations, rebonds, flous, fondus courts, clignotements. « Fixe » veut dire « images échantillonnées identiques ».
- **Les images pleines sont décalées** d'environ 1 à 1,5 s par rapport à leur étiquette. Elles n'ont servi qu'à la lisibilité.
- **L'ouverture (0 à 40 s) n'a pas été revue.** Elle sert de référence. Deux observations en passant : écran noir avec le seul sous-titre à 0:32 et 0:33 (ref/planche_03), et sous-titres coupés au milieu d'un groupe comme dans le reste du film.
- **Rien de ce qui est proposé n'a été rendu.** Les durées en images, les positions et la lisibilité des petits objets (131 gants, rideau, étiquettes) demandent une planche de contrôle à 4 images par seconde par scène.
- **Les arbitrages entre scènes sont des décisions de papier.** La disposition commune du plan 3 et du plan 4 (pose à zoom 1,125) et les trois raccords par position (s3c / s4, s5 / s6, s6 / s7) sont à vérifier par différence d'images. Si la pose commune ne tient pas à l'image, garder la règle (même poche, même guichet, recul de caméra) et recaler les valeurs.
- **Le code n'a été lu que par endroits** : `acts.js` en entier pour certaines scènes, `film.js` par index de fonctions. Les numéros d'images de la prise (`img/reel/`) n'ont été ouverts que par échantillon.
- **La durée finale de 123,4 s est un calcul.** Elle se vérifie sur le fichier rendu ; le plancher est 122 s.

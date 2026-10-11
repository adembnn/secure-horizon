# Hold up : le mouvement

11 oct. 2026. Feuille : `motion.css`. Démonstration : `motion.html` (un bouton « Rejouer » par animation, « Tout rejouer », bascule « Mouvement réduit »). Version publiable : `motion_planche.html`. Mesure : `outil/mesurer.mjs`.

## Parti pris

L'extension n'avait aucune animation : tout changeait par coupe sèche, et la fenêtre claquait en se fermant. Le fondateur veut des animations fluides et sans bug, puis a demandé de la sobriété. Donc :

- **Un seul moment dessiné** : le gant qui se lève sur « Ça ne correspond pas ». Net, bref, une fois.
- **Partout ailleurs**, le mouvement dit seulement ce qui vient de changer : un fondu, un déplacement de 4 à 8 px, 200 ms au plus.
- **Aucun indicateur de progression.** Le trait qui se vidait sous « Ça part vers ton portefeuille. » a été retiré à la demande du fondateur. La phrase reste une seconde, la fenêtre se ferme.
- **Aucune boucle**, aucune pulsation, rien qui joue sans cause.

## Règles

1. Deux propriétés seulement : `transform` et `opacity`. Jamais largeur, hauteur, marges, position, couleur, ombre.
2. État de repos visible : sans `motion.css`, ou sans état posé, tout est à sa place et lisible. Une animation ne cache jamais un contenu que le script devrait ensuite révéler.
3. La sortie est plus courte que l'entrée (80 ms contre 200).
4. Une réponse reste au moins 400 ms. L'état « Je compare… » n'apparaît que si la vérification dure plus de 150 ms.
5. `will-change` n'est posé que sur le gant, et seulement pendant qu'il bouge.
6. Chaque animation a sa version `prefers-reduced-motion` : plus de déplacement, un fondu court à la place.

Durées : `--hu-d-1` 80 ms, `--hu-d-2` 120 ms, `--hu-d-3` 160 ms, `--hu-d-4` 200 ms, `--hu-d-glove` 340 ms. Courbes : standard `cubic-bezier(0.2, 0, 0, 1)`, arrivée `cubic-bezier(0.16, 1, 0.3, 1)`, sortie `cubic-bezier(0.4, 0, 1, 1)`.

## États à poser sur le conteneur

Les quatre premiers existent déjà dans `ui/screen.js` (l'agent du code les a préparés) ; `motion.css` les utilise tels quels. Les quatre suivants sont à ajouter (`INTEGRATION.md`, étape 3).

| État | Où | Posé quand | Retiré quand |
|---|---|---|---|
| `.is-entering` | `.hu-win` | un moment vient d'être dessiné (déjà fait par `draw()`) | au dessin suivant |
| `.is-leaving` | `.hu-win` | 80 ms avant le remplacement (déjà fait par `schedule()`) | au dessin suivant |
| `data-state="checking"` | `.hu-win` | la vérification dure depuis 150 ms (déjà fait par `loading()`) | à la réponse |
| `data-outcome` | `.hu-win` | `match`, `mismatch`, `unverifiable` (déjà fait) | au dessin suivant |
| `.is-opening` | `.hu-win`, `.hu-pop`, `.hu-panel` | au premier dessin de la surface | après 140 ms, ou jamais (sans effet ensuite) |
| `.is-next` | `.hu-win`, avec `.is-entering` | la réponse dessinée est la demande suivante de la même opération (`step > 1`) | au dessin suivant |
| `.is-ready` | `.hu-win` | la retenue vient de finir | au dessin suivant |
| `.is-closing` | `.hu-win` | 120 ms avant `window.close()` | jamais |

`.is-verdict-change` et `data-from-outcome`, que le code pose aussi, n'ont pas d'animation propre : une réponse qui en remplace une autre sort et entre comme toute réponse. C'est voulu : le changement de réponse ne doit pas être un spectacle.

Dans un écran, les éléments qui bougent portent `.hu-m`. `--hu-i` (0, 1 ou 2) les décale de 40 ms. Trois groupes au plus : la question ou la réponse, ce qui l'explique, le reste. Le bas (`.hu-dock`) ne se déplace jamais : il fond.

Sur un élément : `.is-filled` sur `.hu-slot` (une valeur est arrivée), `.is-arriving` sur la ligne neuve du journal, `.is-pushed` avec `--hu-dy` sur les lignes qu'elle pousse.

## Chaque transition

| Transition | Ce qui bouge | Propriété | Durée | Courbe | Délai | Repos | Mouvement réduit |
|---|---|---|---|---|---|---|---|
| Ouverture de la fenêtre | le contenu (`.hu-stage`). Le fond est noir dès la première image : `html { background: #000 }` dans la feuille chargée en tête, `color-scheme: dark` | `opacity` 0 → 1 | 140 ms | standard | 0 | contenu visible | identique |
| Apparition de la question | deux groupes : le site et la question ; le champ, « Ce que j'ai compris », les suppositions | `opacity` 0 → 1, `translateY` 6 px → 0 | 200 ms | arrivée | 0 et 40 ms | visibles | fondu 120 ms, sans délai |
| Une valeur arrive dans « Ce que j'ai compris » | le mot gris s'efface, la valeur monte à sa place. Les trois places sont fixes | `opacity` ; `translateY` 4 px → 0 | 80 ms (sortie du mot), 160 ms (valeur) | sortie, puis arrivée | 0 | mot gris visible, ou valeur visible | fondu 120 ms |
| Entrée → « Je compare… » | la ligne des suppositions cède sa place à « Je compare ta phrase à la demande. », au même endroit. Le bouton passe au trait, sans changer de largeur | `opacity` (fondu croisé) | 120 ms | standard | l'état n'est posé qu'après 150 ms d'attente, et dure 400 ms au moins | suppositions visibles | identique |
| Question → réponse, sortie | tous les `.hu-m`, le gant, le bas | `opacity` 1 → 0 | 80 ms | sortie | 0 | | identique |
| Question → réponse, entrée | la réponse, puis sa ou ses lignes ; le bas fond | `opacity`, `translateY` 6 px → 0 ; bas : `opacity` | 200 ms ; bas 120 ms | arrivée ; standard | 0, 40, 80 ms | visibles | fondu 120 ms |
| **Le gant se lève** | le gant, origine en bas au centre. Il se ramasse : 2 px plus bas, écrasé à 0,95 en hauteur (41 ms). Il monte d'un trait jusqu'à 4 px au-dessus de sa place, étiré à 1,04 (146 ms). Il s'arrête net avec un seul tassement, 1 px sous sa place (78 ms), puis se pose (75 ms). Pas de rebond, pas de boucle | `transform` (`translateY`, `scale`), `opacity` 0 → 1 pendant les 41 premières ms | 340 ms | une courbe par segment, dans `@keyframes hu-glove` | 0 ; la phrase part en même temps, les lignes 40 ms après | gant visible, posé | fondu 120 ms, aucun déplacement |
| « Ça correspond », puis départ | rien pendant une seconde : la phrase reste, « Ça part vers ton portefeuille. » est écrit en bas à droite. Puis le contenu monte et s'efface, et la fenêtre se ferme | `opacity` 1 → 0, `translateY` 0 → −6 px | 120 ms | sortie | 1000 ms après l'entrée (`AUTO_MS`) | réponse visible | fondu 120 ms |
| Demande suivante, même fenêtre | la réponse et sa ligne arrivent par la droite ; la fenêtre ne se ferme pas entre les deux | `opacity`, `translateX` 8 px → 0 | 200 ms | arrivée | 0, 40 ms | visibles | fondu 120 ms |
| Compte à rebours | le chiffre est remplacé, sans mouvement. Chasse fixe, largeur réservée de deux chiffres : rien ne bouge autour | aucune | | | | | identique |
| Fin de la retenue | « dans 0 s » s'efface ; le mot « Envoyer quand même » se souligne (changement d'état, pas une animation) | `opacity` 1 → 0 | 160 ms | standard | 0 | compte visible | identique |
| Relance | comme question → réponse : 80 ms pour sortir, 200 ms pour entrer. La phrase déjà écrite est rappelée en tête | `opacity`, `translateY` | 80 + 200 ms | sortie, arrivée | 0, 40 ms | visibles | fondu |
| « Ne rien envoyer », puis fermeture | l'écran s'efface ; « Demande annulée. Rien n'a été envoyé. » arrive, reste 700 ms (`END_MS`) ; le contenu monte et s'efface ; la fenêtre se ferme | `opacity`, `translateY` | 80, 200, 120 ms | sortie, arrivée, sortie | | | fondus |
| Survol du bouton plein | un voile de la couleur du fond, à 16 % | `opacity` (du voile) | 120 ms | standard | 0 | sans voile | identique |
| Appui du bouton plein | le bouton descend de 1 px, le voile passe à 28 % | `transform`, `opacity` | 80 ms | standard | 0 | | pas de déplacement |
| Interrupteur | le rond glisse de 16 px ; le rond plein fond par-dessus le rond vide. Le mot à côté change d'un coup, et le rond ne bouge pas quand le mot change de longueur | `transform`, `opacity` | 160 ms | standard | 0 | état lisible par le mot | fondu seul, le rond saute |
| Ligne du journal | la ligne neuve arrive en tête ; les suivantes, déjà déplacées par la mise en page, repartent de leur ancienne place par `transform` (technique FLIP) | `opacity` + `translateY` 6 px → 0 ; `translateY(--hu-dy)` → 0 | 200 ms | arrivée ; standard | 0 | visibles | la ligne fond, les autres ne bougent pas |
| Ouverture du popup | le contenu | `opacity` 0 → 1 | 140 ms | standard | 0 | visible | identique |
| Ouverture du panneau | le contenu | `opacity` 0 → 1 | 140 ms | standard | 0 | visible | identique |
| Erreur du champ | la phrase d'erreur prend la place de la ligne grise | aucune (annoncée par `role="alert"`) | | | | | |

Budget : aucune réponse à un geste au-delà de 300 ms, sauf le gant (340 ms, et la phrase est lisible dès 200 ms). Saut de mise en page : 0.

## Mesures

`node docs/design/system/outil/mesurer.mjs 5` : Chromium 1243 de Playwright, sans fenêtre, écran à 144 Hz (une image toutes les 6,9 ms), cinq passes par animation. Une image est comptée perdue quand son intervalle dépasse 1,5 fois la médiane. Résultats bruts : `captures/mesures_fluidite.json`.

| Animation | Images | Perdues | Pour 1000 | Au-delà de 16,7 ms | Plus longue | Saut de mise en page |
|---|---|---|---|---|---|---|
| (machine au repos, 3 s, rien ne bouge) | 2130 | 33 | 15,5 | 1 | 18,6 ms | 0 |
| Le gant | 330 | 1 | 3,0 | 0 | 14,0 ms | 0 |
| Ouverture de la fenêtre | 158 | 4 | 25,3 | 0 | 14,0 ms | 0 |
| Apparition de la question | 230 | 1 | 4,3 | 1 | 19,9 ms | 0 |
| Valeurs dans « Ce que j'ai compris » | 1465 | 21 | 14,3 | 1 | 17,8 ms | 0 |
| Question → réponse | 1077 | 8 | 7,4 | 0 | 13,8 ms | 0 |
| Ça correspond, puis départ | 1319 | 7 | 5,3 | 0 | 14,0 ms | 0 |
| Relance | 715 | 6 | 8,4 | 1 | 21,4 ms | 0 |
| Compte à rebours | 3839 | 69 | 18,0 | 0 | 14,0 ms | 0 |
| Demande suivante | 1000 | 14 | 14,0 | 2 | 21,4 ms | 0 |
| Ne rien envoyer, fermeture | 1642 | 28 | 17,1 | 0 | 14,0 ms | 0 |
| Bouton plein | 1037 | 13 | 12,5 | 1 | 17,1 ms | 0 |
| Interrupteur | 1038 | 10 | 9,6 | 0 | 14,0 ms | 0 |
| Popup | 160 | 0 | 0 | 0 | 8,4 ms | 0 |
| Panneau | 163 | 0 | 0 | 0 | 7,4 ms | 0 |
| Ligne du journal | 695 | 4 | 5,8 | 1 | 20,1 ms | 0 |

Lecture honnête de ce tableau :

- **Je ne peux pas écrire « zéro image perdue ».** La machine de mesure, au repos, sans rien animer, saute déjà 8 à 16 rafraîchissements sur 1000 selon la passe (d'autres agents y travaillent en même temps). Aucune animation ne fait nettement pire que ce bruit de fond. Les « pertes » sont presque toutes un seul rafraîchissement sauté à 144 Hz (13,9 ms), invisible à 60 Hz.
- Les quelques images de 17 à 21 ms tombent au moment où un écran est remplacé dans la page (les nœuds neufs sont mis en page), pas pendant un mouvement. Le même coût existera dans l'extension, qui reconstruit elle aussi l'écran.
- Deux défauts réels ont été trouvés par la mesure et corrigés : le gant passait par un masque SVG (remplacé par un trait de la couleur du fond) ; l'interrupteur se déplaçait de quelques pixels quand son mot changeait de longueur (le mot est maintenant à gauche du rond).
- **À refaire sur une machine au calme**, et dans la vraie fenêtre de l'extension une fois le code branché : `coord/reports/eval_design_1/mesures/flow.mjs` le fait déjà sur le flux réel.

## Ce qui n'est pas animé, et pourquoi

- Le compte à rebours : un chiffre qui bouge chaque seconde fatigue et pousse à la hâte.
- La phrase d'erreur du champ : elle doit être lue tout de suite.
- Le changement de thème, le survol d'un mot souligné, le focus : immédiats.
- La fenêtre du système elle-même (ouverture, fermeture) : elle appartient au système. Le produit ne maîtrise que son contenu, d'où le fond noir dès la première image et le fondu de sortie avant `window.close()`.

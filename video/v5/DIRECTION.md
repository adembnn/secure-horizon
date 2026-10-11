# DIRECTION v5 : refaire tout ce qui suit l'ouverture, une scène par personne

Le fondateur : « À partir de 45 secondes, t'es parti en couille sur les animations. T'as fait aucun effort. » « La vidéo doit être beaucoup plus dynamique. » La référence est l'ouverture (`src/film.js`). Tu écris UNIQUEMENT ton fichier `src/actes/<id>.js` ; tu lis tout le reste. Aucun git, aucun téléchargement, aucune clé. La voix est figée : ne lance jamais `voix.py`, `voix.sh`, `voix_gradium.mjs` ni `tts.mjs` (ils réécriraient `timeline.js`).

## 1. Pourquoi l'ouverture marche (lu dans film.js et sur `out/planches/ouverture_*.jpg`)
- **Un seul monde, une caméra qui s'y déplace.** 15 clés de caméra en 29 s (une toutes les 2 s), échelle de 4,6 à 0,25 (×18) : très gros plan sur une poche, recul sur 168 poches, recul sur cinq guichets, plongée dans MA poche. Zoom interpolé en logarithme, position qui suit le zoom, moyenne gaussienne sur ±0,28 s : la vitesse ne tombe jamais à zéro entre deux mouvements. Roulis de ±0,045 rad.
- **Plein cadre.** Le sujet occupe l'image ; les cordes rayonnent jusqu'aux bords. Rien n'est une vignette posée sur du noir.
- **Flou de mouvement vrai** : 4 ou 6 sous-images moyennées sur une demi-image (obturateur 180°), dès que la caméra dépasse 2,5 puis 14 pixels par image.
- **La vague** : 153 poches se vident du centre vers les bords (retard = distance^0,85 + un aléa de 0,09 s) ; chaque poche encaisse (+3, −5, +1,2 px), les pièces suivent la main avec retard.
- **Les cordes vivent** : la tension se propage (retard = distance/5200), le mou respire, la corde s'arque sous l'effort, les bosses remontent le bras rayé.
- **Le geste avant le mot** : le coup tombe 0,5 s avant « Piratée. ». Anticipation (0,3 s), frappe (0,1 s), écrasement du guichet (+10 % / −13 %), rebond. Trois essais de force croissante (×1, ×1,5, ×2,1).
- **Courbes** : `E.arrive` (part vite, se pose), `E.pars` (se ramasse, accélère), `E.glisse` (caméra), `E.sec`, `E.doux`, `E.derive`. Jamais de linéaire. Le trait tremble 4,5 fois par seconde (`wob`).
- **Chaque événement a son son**, au même temps que l'image ; silence, puis frappe.

## 2. La mesure (outil `mouvement.mjs`, zone y < 890, 30 i/s, différence absolue moyenne 0 à 255)
| Passage | médiane | 1er quartile | minimum |
|---|---|---|---|
| **Référence demandée, 0 à 45 s** (`out/reference_mouvement.json`) | **4,047** | **1,392** | **0** |
| Ouverture seule, 0 à 29 s (film.js) | 6,661 | 3,877 | 1,392 |

Médianes de départ (`out/verif/mouvement_depart_*.txt`) : s2b 0,506 · s3a 0,035 · s3b 0,539 · s4 0,212 · s5 0,120 · s6 0,665 · s7 1,502. Attention : film.js s'arrête à 29,0 s. De 29 à 45 s, l'image est déjà celle des anciennes s2b et s3a (médiane 0,389, une seconde entièrement figée à 33 s) ; elles tirent la référence « 0 à 45 » vers le bas. Cible : médiane ≥ 3,238 et aucune seconde sous 1,392 ; viser les chiffres de l'ouverture seule (≥ 5,329, rien sous 3,877).

## 3. Scènes : bornes figées (`BORNES` dans commun.js), un fichier chacune
| id | fichier | a | b | lignes de voix (début) |
|---|---|---|---|---|
| s2b | `src/actes/s2b.js` | 29,004 | 40,164 | p1 29,504 · p2 32,244 · p3 35,014 · p4 38,404 |
| s3a | `src/actes/s3a.js` | 40,164 | 54,204 | h1 40,714 · h2 41,564 · h3 45,174 · h4 47,474 · h5 49,834 |
| s3b | `src/actes/s3b.js` | 54,204 | 76,336 | h6 54,804 · h7 58,124 · h8 61,374 · h9 65,504 · h10 67,404 · h11 71,556 |
| s4 | `src/actes/s4.js` | 76,336 | 92,996 | k1 77,036 · k2 80,936 · k3 85,256 · k4 90,026 |
| s5 | `src/actes/s5.js` | 92,996 | 107,996 | r1 93,646 · r2 96,286 · r3 99,326 · r4 102,496 |
| s6 | `src/actes/s6.js` | 107,996 | 121,896 | m1 108,696 · m2 112,106 · m3 116,696 |
| s7 | `src/actes/s7.js` | 121,896 | 132,368 | f1 122,696 · f2 124,528 · f3 128,978 |

## 4. Convention d'une scène (voir n'importe quel `src/actes/s*.js`)
```js
'use strict'; (() => {                     // tout est local : aucun nom ne fuit vers les autres fichiers
  const im = charge('img/captures/ne_correspond_pas.png');      // image attendue avant window.ready
  acte({ id: 's3b', draw(t) { X.save(); /* ... */ X.restore(); }, blur: t => 1 });   // a et b viennent de BORNES, blur rend 1, 4, 6 ou 8 sous-images
  cue(L.h9.debut - .23, 'impact', { g: 1.3 });                  // repères sonores de la scène
  cle('gant', T_GANT + .5);                                     // images clés : node render.mjs --stills=cles
})();
```
`draw(t)` reçoit le temps du film, part d'une image noire, transform identité ; il rend `X` comme il l'a trouvé (save/restore, `globalAlpha` à 1, pas de clip ni de pointillé laissés). Aucun hasard libre : `hash(a, b, c)`. Ne touche ni commun.js, ni index.js, ni film.js, ni index.html, ni le fichier d'un autre ; un besoin commun se note dans ton rapport.
**Raccords** (convenus, pour que deux scènes faites en parallèle se rejoignent par le mouvement) : la scène sortante accélère pendant `RACC` = 0,3 s avant sa borne, l'entrante arrive de l'opposé. Sens de défilement de l'image (`RACCORDS`) : T2 gauche, T3 haut, T3B gauche, T4 gauche, T5 haut, T6 droite, T7 bas. `fouetOut(t, b, dir)` et `fouetIn(t, a, dir)` rendent `[dx, dy]` à translater ; `enFouet(t, a, b)` dit quand rendre `blur` ≥ 6. s3a et s3b partagent la même prise réelle : s3b la reprend à l'image `reelFrame(T3B)` = 43.

## 5. Outils à réutiliser
**film.js** : `X` (contexte), `W, H, FPS, DUR, INK, BLK`, `L.<id>.debut / .fin / .mots[i].t`, `clamp(x, a, b)`, `lerp(a, b, k)`, `seg(t, a, b)`, `hash(a, b, c)`, `sh(a, b, c)`, `bez(x1, y1, x2, y2)`, `E.{arrive, pars, glisse, doux, derive, sec}`, `pose(t, [[t, v, courbe], ...])`, `wob(a, b)`, `jit(pts, seed, amp)`, `smooth(pts, closed)`, `trace(pts, closed)`, `cubic(a, b, c, d, n)`, `along(pts, u)` → `{x, y, a}`, `cutTo(pts, u)`, `tube(pts, w, seed)`, `hand(x, y, s, {curl, strain, rot}, seed)` (main creuse de la plateforme), `pocketPath(inset)`, `coins({seed}, lv)`, `surfY(lv)`, `LW()`, `Z` (échelle courante, à régler), `stripedArm(tip, scale, t, flow, seed)`, `drawBooth(F, t)`, `makeField(ox, oy, id, hacked)`, `drawArms(F, t, view)`, `drawPocket(F, p, t)`.
**commun.js** : `T2, T3, T3B, T4, T5, T6, T7, T_GANT, BORNES, ZONE` · `acte(o)`, `cue(t, sorte, o)`, `cle(nom, t)`, `menace(a, b)`, `charge(src)` · `mkCam(keys, roll)` → `{at(t), speed(t), apply(t, dx, dy), blur(t)}` : la caméra de l'ouverture, clés `[t, x, y, zoom, courbe]` · `flou(pxParImage)` · `tMot(id, i)` · `tx(str, x, y, px, o)` et `T(...)` (o : `a, al, w, ui, stroke, c, base`) · `slam(str, x, y, px, t, t0, o)` · `frappe(str, x, y, px, t, t0, o)` (tombe gros, s'écrase, rebondit, sans fondu) · `shake(t, t0, amp)` → `[dx, dy]` · `flash(t, t0, a)` · `glove(cx, by, size, sx, sy)`, `gloveRise(t, t0, cx, by, size, from)` · `pk(x, y, sc, {seed, lv, wy, curl, strain, rot, jolt, bow, knot, hand, loot, cordTo, a})` · `tries(t, [t1, t2, t3], f0)` · `reel(n)`, `reelFrame(t)`, `prise(n)` (prise réelle, 184 images de 440 × 540) · `mention(str, a)` (corps 34, coin bas gauche) · `UI` (Segoe UI). `cam()` et `legend()` sont les anciens outils (poussée molle, corps 21) : ne plus s'en servir.

## 6. Sons : sortes connues de `son.py`
`coup`, `boum {g}` (coup grave) · `riser {d}` · `souffle {d}` · `toc {g}` · `tic {g}` · `touche {g}` · `defile {d}` · `bute {g}` · `poignee {n, g}` · `prise {g, pan}` · `retire`, `renonce` · `arrive`, `etire {d}` · `rideau` · `tap` · `tension {d}` · `guette {n}` · `plonge {d}` · `silence {d}` (coupe tout le fond) · `menace(a, b)` (tenue grave). Nouvelles, à poser dès maintenant (l'agent du son les ajoute ; d'ici là elles sont ignorées sans erreur) : **`whoosh {d}`** (passage, transition) et **`impact {g}`** (coup sec, plus net que `boum`). Pas de whoosh sur chaque texte.

## 7. Commandes (Git Bash, depuis `video/v5/src`). Chaque appel écrit le seul fichier nommé : huit agents peuvent tourner ensemble.
```bash
bash apercu.sh 54.204 76.336 s3b_v1                       # -> ../out/scenes/s3b_v1.mp4, 30 i/s, 1280x720, muet, sans grain
node mouvement.mjs ../out/scenes/s3b_v1.mp4               # tableau par seconde, verdict, et ../out/scenes/s3b_v1.mouvement.json
node render.mjs --strip=54.2:76.3 --dt=0.25 --cols=8 --w=480 --out=../out/planches/s3b_v1.jpg     # planche dense, une image par 0,25 s
node render.mjs --strip=65:65.6 --step=1 --cols=6 --out=../out/planches/s3b_gant.jpg             # toutes les images (60 i/s)
node render.mjs --stills=61.97,65.5 --out=../out/cles/s3b                                         # PNG 1920x1080
node render.mjs --cues --out=../out/cues.json             # repères sonores, clés, bornes
PY="C:/Users/Adem/Video AI/atelier/.venv/Scripts/python.exe"
node render.mjs --cues --out=../out/cues.json && "$PY" -X utf8 -I son.py && node render.mjs --clip --out=../out/image.mp4 && bash assemble.sh film_v5_a.mp4     # rendu complet, 60 i/s
```
`render.mjs` finit par « 0 erreur de page » ; sinon code de sortie 2. Avant de lancer, donne un nom à toi à chaque sortie (`<id>_v<n>`).

## 8. Exigences de mouvement (mesurées, pas déclarées)
- Aucune seconde « morte » : à tout instant quelque chose de signifiant bouge (pas seulement une dérive lente). Dans ta scène, l'énergie de mouvement par seconde (outil mouvement) doit avoir une médiane au moins égale à 80 % de la médiane de l'ouverture, et aucune seconde sous le 1er quartile de l'ouverture, sauf le silence volontaire d'une demi-seconde avant un impact.
- Caméra jamais immobile et jamais gratuite : poussées franches, travellings le long d'un geste, changements d'échelle nets (très gros plan sur un mot, une pièce, un bouton ; puis plan large), transitions PAR le mouvement (l'objet d'un plan devient celui du suivant ; fouetté ; traversée), pas de fondu mou.
- Typographie cinétique : les mots clés arrivent sur le mot de la voix (repères `L.<id>.debut`), avec masse (arrivée, écrasement, rebond court), pas d'apparition en fondu. Très gros quand c'est le sujet du plan.
- Les chiffres claquent : montée, impact, secousse de caméra brève, flash d'une image ; puis ils vivent (le décor réagit).
- Les prises réelles ne sont jamais une vignette : l'écran occupe l'image, la caméra va chercher la zone qui compte (la phrase tapée, la ligne « Compris par Clef », le verdict, le bouton), en perspective légère si utile, avec des traits d'encre qui pointent ou encadrent, et des coupes au rythme de la voix.
- Courbes franches (jamais linéaire), flou de mouvement cohérent avec l'ouverture, 60 i/s en rendu final.
- Rythme : coupe ou événement fort au moins toutes les 2 à 3 s ; plus serré dans la menace ; un vrai ralenti et un silence avant le verdict et avant chaque révélation.
- Lisibilité : aucun texte utile sous 34 px en 1080p, rien hors cadre, rien qui chevauche les sous-titres.

## 9. Vérité et style (non négociables)
- Prises réelles (`img/reel/`, `img/panneau.png`, `retrait.png`, `apres.png`, `img/captures/*.png`) : contenu jamais retouché. Permis : recadrage, zoom, perspective, arrêt sur image, ordre conservé. Mention « Prise réelle de l'extension » ; un écran dessiné qui imite le produit porte « maquette de l'écran ». Aucun « emplacement réservé ». Les captures font 424 × 501 (fenêtre) et 360 × 680 (panneau, fond clair) : un très gros plan agrandit ×4 à ×6, prendre alors le PNG sans perte de `img/captures/`. `img/journal.png` et `img/c-limite.png` disent « USDC » : ne pas s'en servir.
- Texte animé : « 50 DUSDC », jamais « USDC ». Chiffres : ceux de la voix et de `METRIQUES.md` seulement. 34,2 % = Avalanche seulement. 87 / 65 / 15 % = « moteur de comparaison, jeu aveugle de 250 cas, ouvert une seule fois », pas l'extension. Interdits : « MetaMask ne le voit pas », « personne ne protège les particuliers », « rien ne quitte la machine », « déployé sur Fuji », toute mention d'Ethereum.
- Encre blanche sur noir, aucune couleur, aucun dégradé décoratif, aucune carte, aucun look « slide », aucune barre de progression décorative, texte centré, Montserrat Bold pour le film, Segoe UI pour l'écran du produit. Le gant blanc plein n'apparaît qu'au verdict « Ça ne correspond pas » (s3b) et sur le logo final (s7).
- Sous-titres : gérés par film.js (ligne de base y = 988, corps 68), on n'y touche pas. Rien de signifiant sous y = 890 (`ZONE`), sauf `mention()` en coin bas gauche. Rapporte ce que tu as mesuré et vu, rien d'autre ; si quelque chose ne marche pas, dis-le.

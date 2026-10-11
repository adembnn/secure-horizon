# Critique de la piste 3 « Le gant » et deux reprises

11 oct. 2026. Cible : `pistes/piste_3.html` et ses deux captures. Reprises : `pistes/piste_3b.html`, `pistes/piste_3c.html`.

## Méthode

Skill `impeccable`, commande `critique`, en deux évaluations séparées comme elle l'exige.

- Évaluation A (revue de design) : confiée à un sous-agent isolé, qui n'a vu ni le détecteur ni mon avis. Il a lu `reference/critique.md`, `reference/craft-floor.md` et la skill `frontend-design`.
- Évaluation B (détecteur) : `node .claude/skills/impeccable/scripts/detect.mjs --json pistes/piste_3.html`. Résultat : 0 constat, mais en mode dégradé (les modules `htmlparser2`, `css-select`, `css-tree` manquent, le détecteur retombe sur des expressions régulières et le dit lui-même : « findings are an undercount »). Ce zéro ne prouve rien. Même résultat sur 3b et 3c.
- `context.mjs` a été lancé : il charge `PRODUCT.md`. Il n'existe pas de `DESIGN.md` à la racine.
- `concept-seed.mjs --scope direction --mode operate` a été lancé avant d'écrire (clé `4b4b1912`). Il impose de construire le candidat n° 3 de ma liste, pas mon préféré. Voir « D'où viennent B et C ».
- Lus aussi : `animate`, `polish`, `typeset`, `layout`, `clarify`, `quieter`, `bolder`, `delight`, `colorize`, `distill`, `audit`, `new-work`, `operate`, plus `frontend-design` (plugin officiel, seul plugin de design trouvé sous `C:\Users\Adem\.claude\`) et `avoid-ai-writing` avec son annexe française. Non lus, parce qu'ils ne concernent pas ce travail : `live`, `live-setup`, `hooks`, `doctor`, `init`, `document`, `extract`, `visualize`, `adapt`, `optimize`, `harden`, `onboard`, `shape`, `overdrive`, et les fiches iOS et Android.

Ce qui n'a pas été fait : l'inspection dans un navigateur avec surimpression du détecteur (étape facultative de l'évaluation B), et l'enregistrement de la critique dans `.impeccable/critique/` (hors de `docs/design/system/`).

## Verdict

La piste 3 n'est pas propre à Hold up. Sans le gant et sans les trois phrases, elle servirait telle quelle à un gestionnaire de mots de passe ou à un pare-feu. Le gant y est un logo posé sur une interface standard : il ne structure rien. Et le logo lui-même est tout en rondeurs (doigts, pouce, revers arrondi) alors que la piste a pris d'une autre marque la règle « aucun rayon ». L'interface contredit son personnage.

Note de Nielsen (sous-agent) : 25 sur 40. Points bas : cohérence 2, minimalisme 2, récupération d'erreur 2, aide 2, souplesse 2.

## Les traits « générés par IA », un par un

Les numéros de ligne renvoient à `pistes/piste_3.html`.

### Palette

1. **Noir pur et un seul rouge vif.** Ligne 9 et 10, `--signal:#c4221a` et `#ff6b5e`, utilisé par `.verdict[data-o=mismatch]` (l. 25) et `.neg` (l. 53). C'est mot pour mot un des looks par défaut listés par `frontend-design` et par `new-work.md`.
2. **Gris neutres en cascade.** `--ink-2`, `--soft`, `--wash`, sans autre idée que « secondaire ».
3. **Le thème sombre efface la seule idée de composition.** L. 23 et 87 : en sombre, la bande noire et la coupe de la page de bienvenue ne sont plus qu'un filet.

### Typographie

4. **Police du système en voix de titre.** L. 11, Segoe UI Variable. `craft-floor.md` le range dans les refus : une police de plateforme ne porte pas le caractère d'un monde.
5. **Gras partout.** 700 sur `.q`, `.verdict`, `.btn`, `h3`, `.state-t`, `.s`, `.neg`, `.err`, `.explain span+span`. Rien ne ressort.
6. **Titres serrés et rééquilibrés.** L. 24 et 88, `letter-spacing:-.02em` avec `text-wrap:balance` : le réglage réflexe de tout titre généré.
7. **Dix tailles de texte.** 12, 13, 14, 15, 17, 18, 20, 22, 30, 44 px, sans échelle.
8. **Les trois verdicts ont la même taille et le même poids.** L. 24. Seul le rouge distingue le refus.

### Composition

9. **Deux boutons jumeaux partout.** `1fr 1fr` sur `.actions` (l. 58), `.pop-foot` (l. 68), `.panel-foot` (l. 81). Annuler et Continuer pèsent pareil, quel que soit l'enjeu.
10. **Deux colonnes jumelles sur la bienvenue.** `.cols` (l. 90), « Ce qu'il ne fait pas » et « Pour l'essayer », chacune titre plus filet plus liste.
11. **Page de bienvenue en héros coupé en deux.** L. 83 : grand objet à gauche, titre, chapeau, deux colonnes, deux boutons.
12. **Bande de marque identique sur chaque surface.** `.bar` (l. 19) : pictogramme, nom en gras, domaine en gris à droite. C'est l'en-tête de n'importe quel produit.
13. **Pied fixe et vide mort.** `.win` en colonne : sur « ça correspond » et « pas pu vérifier », environ 100 px de noir vide entre le texte et les boutons.
14. **Grille de composants en cellules égales.** `.kit` (l. 97), trois colonnes, cellules noires et blanches alternées, étiquette grise de 12 px en tête de chacune.
15. **Aucun rayon, alors que le gant est rond.** `border-radius:0` sur le champ, les boutons, l'interrupteur.

### Légendes, filets, listes

16. **Ligne d'aide sous chaque pied.** `.hint` (l. 59) : « Entrée vérifie. Échap annule. », « Entrée continue. », « Échap annule. ».
17. **Note sous le champ qui redit le titre.** L. 151 : « Écris-le avec tes mots. Hold up compare ta phrase à la demande du site. »
18. **Rappel « Ta phrase : … » en petit gris.** `.phrase` (l. 32), présent sur deux écrans, absent du seul où il servirait (le refus).
19. **Titre, filet, liste, filet.** `h3` souligné de 2 px (l. 72, 91), lignes séparées de 1 px (l. 73, 77), `.last` ouvert par un filet (l. 65).
20. **Fil d'activité de tableau de bord.** `.log` (l. 73) : domaine en gras, heure grise à droite, état dessous.
21. **Interrupteur carré inventé.** `.sw` (l. 48) : ni un interrupteur connu, ni une forme du monde du gant.
22. **Bloc d'autocritique en tête.** L. 142 à 146, « Fiche d'origine / Parti pris / Ce qu'on y perd » : un gabarit de présentation.

### Textes

23. **Anaphore à trois temps.** L. 164 : « Il ne dit jamais… », « Il ne signe rien… », « Il ne remplace pas… ».
24. **Chapeau à trois temps.** L. 164 : « Tu écris… Hold up compare… puis te dit… ».
25. **Trois étapes numérotées.** L. 164, « Épingle… Ouvre… Écris… » : la numérotation n'apporte rien, la deuxième étape contient déjà la troisième.
26. **Ton de notice.** « Chaque demande de signature de app.neve.exchange passe par Hold up. » (l. 160), « Révoquer ouvre ton portefeuille : c'est lui qui signe. » (l. 163).
27. **Deux voix.** « Je n'ai pas pu vérifier » (l. 157) à côté de « Hold up compare ta phrase » (l. 151).
28. **Mots de l'intérieur.** « Le moteur de vérification » (l. 158), « l'opération » (l. 159), « Droits accordés » (l. 163).
29. **Journal télégraphique.** « Ne correspondait pas. Annulée. », « Non vérifiée. Annulée. » (l. 162).
30. **Titre de confirmation standard.** « Hold up est installé. » (l. 164).
31. **Faute.** « de app.neve.exchange » (l. 160 et 161).

### Usage

32. **« Pas pu vérifier » n'a pas de sortie.** Le texte dit d'annuler puis de relancer sur le site : l'effort est renvoyé à la personne.
33. **Compte à rebours annoncé chaque seconde.** `role="status"` sur la ligne d'attente (l. 156) : un lecteur d'écran répéterait la phrase 24 fois.
34. **Double cadre au focus du champ.** L. 37 : bord de 2 px plus contour décalé.

## Ce qui est juste dans la piste 3 et que les reprises gardent

- Le gant ne paraît qu'une fois, sur le refus.
- Sur le refus, Annuler devient le geste plein et Continuer attend.
- Les explications sont concrètes : « La demande donne accès à tout ton USDC. »
- La fenêtre de vérification est le carré noir du logo.

## D'où viennent B et C

`new-work.md` demande sept mondes concrets tirés de l'univers du sujet, puis un tirage. Les sept, pour un gant de dessin animé des années 1930 :

1. le carton-titre peint d'un dessin animé ;
2. l'intertitre d'un film muet ;
3. le celluloïd et son trait d'encre ;
4. l'affiche en caractères de bois ;
5. la lettre peinte d'enseigne ;
6. la bulle de bande dessinée ;
7. le gant blanc de l'agent de circulation.

Le tirage a imposé le n° 3. B en vient : un seul trait d'encre rond, des formes prises au gant, la phrase dans une bulle (n° 6). C part du n° 4 et du n° 2 : des aplats, un caractère d'affiche, et la coupe du film muet pour dire le refus.

Les six mondes de défi proposés par le tirage ont été écartés (console de développeur, mur de streaming, carte d'embarquement, carte d'orientation, planche botanique, champ de données) : aucun ne sert mieux une personne pressée devant une signature. Un seul apport retenu, pris au dernier : l'inversion complète de l'image en une seule fois. C'est la coupe de C.

## Les deux reprises

| | B, « le carton » | C, « l'affiche » |
|---|---|---|
| Comment se dit le refus | Le gant entre en grand par le bas et occupe la place où serait « Continuer » | La fenêtre noire devient blanche, le gant paraît en noir |
| Couleur | Aucune | Aucune |
| Titres | Caprasimo | Bowlby One |
| Texte | Libre Franklin 400, 500, 700 | Atkinson Hyperlegible 400, 700 |
| Forme | Un trait de 3 px, bouts ronds, rayons pris au revers du gant | Aucun trait, aucun cadre : des aplats |
| Où tu écris | Une bulle | Un papier blanc plein bord, la moitié basse de la fenêtre |
| Geste conseillé | Le revers du gant (bouton blanc arrondi), en bas à droite | Un bloc, en bas à droite |
| Autre geste | Un mot souligné | Un mot souligné |
| Rappel du refus dans le journal | Une petite main à droite de la ligne, texte en gras | La ligne inversée en bande pleine |
| Interrupteur | Piste ronde, bouton rond, le mot à côté | Deux mots côte à côte, celui en cours en aplat |
| Bienvenue | Le texte à gauche, le refus montré une fois à droite | Une affiche : une phrase en grand, le gant |

Traité dans les deux : plus de rouge (traits 1, 8), plus de police système en titre ni de gras partout (4, 5), plus de boutons ni de colonnes jumelles (9, 10, 11), plus de bande de marque (12), plus de lignes d'aide ni de note sous le champ (16, 17, 18), plus de filets (19), une seule voix, « je » (27), textes réécrits (23 à 31), verdicts de tailles différentes (8), compte à rebours qui n'est plus une zone annoncée en entier (33).

### Trois appariements de polices (toutes sous licence OFL, sur Google Fonts)

1. **Caprasimo + Libre Franklin** (dans B). Caprasimo descend de Cooper Black, la lettre des cartons-titres et des réclames des années 1920 et 1930. Libre Franklin reprend Franklin Gothic (1902), le texte des imprimés américains de l'époque.
2. **Bowlby One + Atkinson Hyperlegible** (dans C). Bowlby One est un caractère d'affiche très gras. Atkinson Hyperlegible sépare le 0 du O et le l du I : utile quand on affiche une adresse.
3. **Limelight + Libre Franklin** (non montré). Limelight est la lettre des marquises de cinéma. Plus décoratif, moins lisible sur une phrase de huit mots : à garder pour un mot seul, pas pour un verdict.

Écartés après essai à l'écran (28 caractères rendus côte à côte) : Chango et Poller One (trop larges, le verdict prend trois lignes), Oleo Script et Shrikhand (pinceau, lecture lente), League Gothic et Big Shoulders (étroits, sans lien avec le gant), Sorts Mill Goudy et Gloock (retombent dans le look « serif éditorial »).

Aucun fichier de police n'est dans le dépôt. Les deux pages chargent Google Fonts par un `<link>`, avec une pile de repli.

## Trois tours de regard sur les reprises

À chaque tour, la question : « sans contexte, dirais-je qu'une IA l'a fait, et à cause de quoi ? »

1. **Tour 1.** B : le gant, placé à droite, se collait au bouton Annuler et formait une tache blanche illisible ; le pouce était coupé. C : la phrase « Ce que j'ai compris, à mesure que tu écris. » en gris à côté du bouton était une légende inventée pour remplir. Corrigé : gant de B passé à gauche, entier, seul le revers sort du cadre ; légende de C supprimée, remplacée par un vrai titre au-dessus des trois places.
2. **Tour 2.** B : Annuler changeait de côté d'un écran à l'autre. C : « Annuler » en haut à droite cassait la ligne du site sur deux lignes. Corrigé : dans les deux, le geste conseillé est toujours en bas à droite, l'autre toujours en bas à gauche. Dans C, la cédille du titre touchait la ligne du dessous : interligne passé de 32 à 35.
3. **Tour 3.** Thème sombre regardé pour les deux. Le petit gant du journal de B utilisait le dessin détaillé à 36 px : remplacé par le dessin simplifié à 32 px, comme le demande `LOGO.md`.

Contrôles mécaniques sur les deux pages : polices chargées (vérifié par `document.fonts`), aucun débordement vertical des fenêtres de 501 px sauf le gant de B qui sort volontairement par le bas, aucun défilement horizontal de la page à 400 px de large.

## Ce qui reste faible, franchement

**B.** La bulle, le bouton arrondi et l'interrupteur en pilule font penser à une application de messagerie. C'est le risque de cette piste : plus chaleureuse, plus proche du gant, mais plus près d'un gabarit « application sympathique ». Le tableau « Ce que j'ai compris » reste un petit tableau gris. Le panneau latéral reste une liste d'activité, même sans filets.

**C.** C'est la plus tranchée et la plus lisible, mais le noir et blanc en caractère très gras est aussi une mode d'affiche actuelle. Bowlby One est large : le verdict du refus prend deux lignes pleines, et un nom de site long dans un titre casserait. Dans le journal, deux refus de suite font deux bandes noires : sur une longue liste, ça peut peser. La fenêtre blanche du refus éblouit dans une pièce sombre.

**Les deux.**
- Le gant de B sort du cadre par le bas et celui de la bienvenue aussi. `LOGO.md` interdit de rogner le logo. Ici c'est le personnage, pas le logo, mais c'est au fondateur de dire si la règle s'applique.
- Les petites tailles (14 px gris au-dessus de chaque place de « Ce que j'ai compris ») sont encore des légendes grises. Je n'ai pas trouvé mieux sans perdre l'alignement des trois places.
- « Révoquer » est gardé parce que la commande le nomme. « Retirer ce droit » serait plus simple.
- Rien n'a été montré à une vraie personne. Le jugement « ça ne sent plus l'IA » est le mien et celui d'un sous-agent, tous deux des modèles.

## Ce que le code ne sait pas encore faire (à garder pour INTEGRATION.md)

- La ligne « Ce que j'ai compris » : l'extraction existe (`extension/intent_text.js`, `extractFields` ; `written_check.js` ; `keyword_intent.js`), elle n'est appelée qu'au moment de vérifier, pas pendant la frappe.
- La relance ciblée « Combien ? », « À quelle adresse ? », « Quel jeton ? » : le code a quatre textes (`written_check.js`, `ASK`), dont « Combien, et à qui ? ». Il faut les scinder.
- Le rappel « Tu as écrit … » : `answerOf` (`outcome.js`) ne transmet pas la phrase à l'écran de réponse.
- Le journal n'enregistre pas la réponse affichée (`match`, `mismatch`, `unverifiable`), seulement le niveau interne. La ligne « Ça ne correspondait pas » ne peut pas être dessinée sans cet ajout.
- Le popup, la pause par site, la liste des droits (`revoke.js` est une spécification, non branchée) et la page de bienvenue n'existent pas. Un popup déclaré dans le manifeste désactive l'ouverture du panneau au clic sur l'icône (`background.js`, `openPanelOnActionClick`).
- Les polices : l'extension ne charge rien du réseau (CSP). Elles devront être embarquées en fichiers une fois le choix fait.

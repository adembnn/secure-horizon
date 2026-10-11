# Hold up : système de design

11 oct. 2026. Extension de navigateur, ordinateur uniquement. Fichiers : `tokens.css`, `components.css`, `motion.css`, les écrans (`ecran_*.html`, `popup.html`, `panneau_lateral.html`, `options.html`, `bienvenue.html`, `repli_dans_la_page.html`), `components.html`, `planche.html`. Mouvement : `MOTION.md`. Application au code : `INTEGRATION.md`.

Ce document remplace la direction « le carton » (piste 3B). Le fondateur l'a calmée par trois retours : « trop bruyante, il faut que ce soit sobre », « la police est trop AI slop », « fais attention à bien centrer le texte ». Puis un quatrième, sur le trait qui se vidait sous « Ça part vers ton portefeuille. » : retiré. Ce qui suit en tient compte.

## 1. Principes

1. **Une phrase, puis une réponse.** Chaque écran de la fenêtre porte une seule chose à lire et un seul geste conseillé. Le reste est gris ou absent.
2. **Sobre.** Noir, blanc, deux gris. Une police, deux graisses. Aucune couleur, aucun aplat inversé, aucun filet, aucune ombre, aucun indicateur de progression.
3. **Le gant paraît une fois.** Petit (88 px), centré au-dessus de « Ça ne correspond pas à ce que tu as écrit. ». Nulle part ailleurs dans le produit, ni dans le journal, ni sur la page de bienvenue.
4. **Rien ne bouge sous les yeux.** Une valeur, une erreur, un compte à rebours arrivent à une place déjà réservée. La mise en page ne saute jamais.
5. **Je parle, tu décides.** Hold up dit « je », s'adresse à « tu », nomme le geste par ce qu'il fait (« Ne rien envoyer », « Envoyer quand même »). Le geste qui ne coûte rien est toujours le plus visible.

## 2. Jetons de couleur

Deux surfaces. La **page** (popup, panneau, réglages, bienvenue) suit le thème du système. La **fenêtre de vérification** est toujours noire : poser `.hu-k` sur son conteneur rebranche les mêmes noms sur le noir.

| Jeton | Clair | Sombre et fenêtre | Usage |
|---|---|---|---|
| `--hu-page` | `#ffffff` | `#000000` | fond |
| `--hu-ink` | `#000000` | `#ffffff` | texte, bouton plein, focus |
| `--hu-ink-2` | `#555555` | `#b3b3b3` | texte secondaire : site, heure, exemple, ce qui n'est pas encore dit |
| `--hu-ink-3` | `#767676` | `#808080` | bord d'un champ, bouton pas encore possible. Jamais du texte |
| `--hu-wash` | `#ececec` | `#222222` | fond d'un champ désactivé |

Contrastes calculés par `node docs/design/system/outil/contrastes.mjs` (le script sort en erreur sous le seuil) :

| Surface | Paire | Couleurs | Rapport | Seuil | Verdict |
|---|---|---|---|---|---|
| page claire | Texte | `#000000` sur `#ffffff` | 21,00 | 4,5 | AAA |
| page claire | Texte secondaire | `#555555` sur `#ffffff` | 7,46 | 4,5 | AAA |
| page claire | Texte secondaire sur champ désactivé | `#555555` sur `#ececec` | 6,31 | 4,5 | AA |
| page claire | Bord de champ, bouton pas encore possible | `#767676` sur `#ffffff` | 4,54 | 3 | passe |
| page sombre, fenêtre | Texte | `#ffffff` sur `#000000` | 21,00 | 4,5 | AAA |
| page sombre, fenêtre | Texte secondaire | `#b3b3b3` sur `#000000` | 10,02 | 4,5 | AAA |
| page sombre, fenêtre | Texte secondaire sur champ désactivé | `#b3b3b3` sur `#222222` | 7,59 | 4,5 | AAA |
| page sombre, fenêtre | Bord de champ, bouton pas encore possible | `#808080` sur `#000000` | 5,32 | 3 | passe |

Le texte du bouton plein et le focus clavier sont à 21,00 partout. Aucune information n'est portée par la couleur seule : l'erreur a sa phrase, l'écart a sa graisse, l'état de l'interrupteur a son mot.

## 3. Typographie

Une famille, celle du système : `"Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Roboto, sans-serif`. Rien à télécharger, rien à embarquer. Deux graisses : 400 et 600.

| Jeton | Taille / interligne | Graisse | Rôle |
|---|---|---|---|
| `--hu-t-xl` | 28 / 36 | 600 | la phrase de la page de bienvenue, une fois |
| `--hu-t-l` | 22 / 28 | 600 | la question, les relances, les trois réponses, titre de page |
| `--hu-t-m` | 18 / 24 | 600 | état du popup, état vide du panneau |
| `--hu-b-l` | 16 / 24 | 400 (600 pour la phrase qui porte l'écart) | ta phrase, la ligne d'explication, « Ce que j'ai compris » |
| `--hu-b-m` | 14 / 20 | 400 (600 pour un bouton, un titre de section) | texte courant, site, heure |

Cinq tailles. Pas de capitales, pas d'approche modifiée, pas d'italique. Les chiffres qui changent (compte à rebours, heure, adresse) sont à chasse fixe : `font-variant-numeric: tabular-nums`. Une adresse n'a pas de police à part : chaque caractère a une case de 9 px, ce qui aligne les deux adresses rang par rang.

Texte **centré** dans la fenêtre de vérification (question, phrase écrite, « Ce que j'ai compris », réponse, explication) et sur la page de bienvenue. Texte **à gauche** dans les listes : journal, autorisations, réglages.

## 4. Trait, rayons, formes

- Un seul trait : 1 px, `--hu-ink-3`. Il borde un champ et dessine le bouton qui n'est pas encore possible. Il passe à `--hu-ink` au survol et double (2 px) au focus du champ ou en erreur.
- Un seul rayon : 6 px (bouton, champ, cadre du repli). L'interrupteur et son rond sont ronds.
- Plein = le geste est possible. Au trait = pas encore. Cette règle vaut pour le bouton plein et pour le rond de l'interrupteur.
- Le focus clavier est le même partout : 2 px d'encre à 2 px du bord. Exception : le champ de la phrase, toujours actif à l'ouverture, épaissit son bord au lieu de porter un second cadre.

## 5. Espacements et tailles

Grille de 4 px : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 (`--hu-1` à `--hu-16`). Marge de la fenêtre : 24. Entre le titre et le champ : 20. Entre deux blocs d'un même groupe : 12 ou 16. Entre deux sections d'une liste : 24.

Bouton plein : 40 px de haut, 128 de large au moins. Champ de réglage : 36. Zone cliquable d'un mot souligné : 36 de haut (la marge est dans le bouton). Gant : 88.

## 6. Durées

Six durées, trois courbes, dans `tokens.css`. Tout est décrit dans `MOTION.md`. À retenir ici : rien ne dépasse 340 ms, seules `transform` et `opacity` bougent, et une réponse reste au moins 400 ms à l'écran.

## 7. Rédaction

- Hold up dit « je ». Il s'adresse à « tu ». Jamais « nous », jamais « Hold up fait… » dans l'interface.
- Une phrase a un verbe et un point. Douze mots au plus quand c'est possible.
- Un geste porte le nom de ce qu'il fait, et garde ce nom jusqu'au journal : « Ne rien envoyer » donne « Tu n'as rien envoyé. ».
- Les trois réponses ne changent jamais, au mot près : « Ça correspond à ce que tu as écrit. », « Ça ne correspond pas à ce que tu as écrit. », « Je n'ai pas pu vérifier cette demande. ».
- « Je n'ai pas pu vérifier » n'est jamais suivi d'une phrase rassurante. Il est suivi de la raison, de « Le plus prudent est de ne rien envoyer. » et d'un geste pour sortir (« Réessayer », « Écrire autrement »).
- Un écart se dit en deux lignes : ce que tu as écrit, puis ce que fait la demande, en 600. Les treize phrases d'écart sont dans `preuves/exhaustivite/EXHAUSTIVITE_INTENTION.md`, section (d) ; les passer au lexique ci-dessous avant de les brancher.
- Aucun nom de niveau (« danger », « attention »), aucun nom de modèle, aucun mot de développeur.

### Lexique de l'interface

Tiré des mots qu'une testeuse non technique n'a pas compris (`coord/reports/testeurs/3_prudente_clavier.md`).

| Mot | Ce qu'on écrit | Ce qu'on n'écrit jamais |
|---|---|---|
| jeton | le nom de la monnaie (« 50 USDC ») ; à défaut « monnaie » : « Quelle monnaie ? » | jeton, token, actif, WAVAX sans l'avoir dit, un nombre brut (« 50000000 ») |
| droit | « autorisation » : « J'ai limité l'autorisation à 50 USDC. », « Retirer l'autorisation » ; ou la conséquence : « app.neve.exchange peut dépenser 50 USDC. » | droit, approbation, approve, allowance, permit |
| plafond | « limiter à 50 USDC » | plafond, limite de dépense, cap |
| signature | « {site} veut utiliser ton portefeuille. » ; pour un droit donné par signature : « Si tu continues, ce site pourra prendre tout ton USDC. » | signature, signer, transaction, EIP-712 |
| Continuer (après un écart) | « Envoyer quand même » | Continuer, Confirmer, OK, Valider |
| Annuler (devant une réponse) | « Ne rien envoyer ». « Annuler » reste sur la question, où rien n'est encore prêt à partir | Refuser, Rejeter, Fermer pour dire annuler |
| révoquer | « Retirer l'autorisation » | Révoquer |
| intention, classée par Clef | rien : cette ligne ne s'affiche pas | intention, modèle, Clef, Jev, moteur, simulation, relais |
| compte | « depuis ton compte 0x71c4…9a3f » | adresse du signataire, wallet, EOA |
| réseau | son nom courant (« Avalanche ») | chainId, un numéro |
| attendre | « Envoyer quand même dans 24 s » | « Continuer sera possible dans… », délai, friction |
| fin | « Demande annulée. Rien n'a été envoyé. », « Demande expirée. Rien n'a été envoyé. » | Opération annulée, timeout |

**À trancher par le fondateur.** Il avait demandé « Retirer ce droit » à la place de « Révoquer ». La testeuse ne comprend pas « droit ». Les écrans portent « Retirer l'autorisation ». Revenir à « Retirer ce droit » se fait dans `outil/src/ecrans.html`, puis `node docs/design/system/outil/construire.mjs`.

**Tutoiement.** La testeuse, 60 ans, aurait préféré « vous ». Le tutoiement reste, décision du fondateur ; il est noté ici comme une réserve mesurée, pas tranchée.

## 8. Clavier et souris

Fenêtre de vérification :
- À l'ouverture, le curseur est dans le champ. Sur une réponse, le focus est sur « Ne rien envoyer » ; sur « Ça correspond », sur la phrase (rien à presser par erreur).
- Tabulation : champ, « Annuler », « Vérifier ». Sur une réponse : le geste dans le texte s'il y en a un (« Réessayer »), « Envoyer quand même », « Ne rien envoyer ». L'ordre du document suit l'ordre visuel ; quand le bas s'empile (zoom), l'ordre de tabulation ne change pas.
- Entrée dans le champ : vérifie. Maj+Entrée : va à la ligne. Entrée sur un champ vide : la phrase « Écris d'abord ce que tu veux faire. » prend la place de la ligne grise, annoncée (`role="alert"`).
- Échap : « Ne rien envoyer », sur tout écran. Sur l'écran d'attente de la suite et sur « Demande expirée » : ferme.
- Un geste pas encore possible reste atteignable au clavier, porte `aria-disabled="true"`, et se voit : bouton au trait, mot sans soulignement.
- Le compte à rebours n'est pas une zone annoncée. Seule sa fin l'est, une fois.

Popup, panneau, réglages : ordre du document. L'interrupteur est une case `role="switch"` : Espace bascule. Le journal est une région défilante atteignable au clavier (`tabindex="0"`, nommée). « Effacer le journal » demande un second appui (« Effacer pour de bon ? »).

Souris : survol du bouton plein par un voile de 16 %, appui par 1 px vers le bas ; le mot souligné épaissit son soulignement. Curseur main sur les gestes, texte dans le champ. Aucune action au seul survol, aucune info-bulle nécessaire.

## 9. Codes d'une application de bureau

| Surface | Taille | Notes |
|---|---|---|
| Fenêtre de vérification | créée en 440 × 540, soit 424 × 501 utiles (422 × 493 mesurés sur une autre machine : les écrans tiennent dans les deux) | toujours noire, fond noir dès la première image, titre de fenêtre « Hold up : {site} » |
| Popup | 320 de large, hauteur du contenu | suit le thème |
| Panneau latéral | 360 de large au moins, hauteur de la fenêtre du navigateur | l'en-tête et le pied sont fixes, le journal défile entre les deux |
| Réglages, bienvenue | onglet entier, colonne de 600 (520 pour la bienvenue) centrée | |
| Repli dans la page | boîte de 424 × 380 centrée sur un voile noir à 60 % | même feuille, même question |

Pas de mise en page mobile. Le zoom du navigateur, lui, existe : il rétrécit la fenêtre utile. Paliers, par requête de conteneur sur la hauteur de `.hu-win` :

| Zoom | Fenêtre utile | Ce qui change |
|---|---|---|
| 100 % | 424 × 501 | référence |
| 125 % | 339 × 401 | marges 16, titres 20 / 26, gant 64, les deux gestes d'une réponse s'empilent (le conseillé au-dessus) |
| 150 % | 283 × 334 | marges 12, titres 18 / 24, texte 14 / 20, gant 44, la ligne des suppositions disparaît |
| 200 % | 211 × 246 | marges 8, réponse 15 / 20, ligne 13 / 17, le site et le gant disparaissent (le site est dans la barre de titre) ; la réponse, sa ligne et les deux gestes restent lisibles |

`node docs/design/system/outil/capturer.mjs 1.25 1.5 2` rejoue ces paliers et contrôle que rien ne défile ni ne sort du cadre. Résultat : aucun défaut à 100, 125 et 150 %. À 200 %, seule la page de réglages défile (640 × 400 utiles pour 472 de contenu) : c'est une liste, c'est admis.

Autres codes : sélection de texte, curseur de saisie et barres de défilement prennent les jetons (`::selection`, `caret-color`, `scrollbar-color`). Aucune barre de défilement dans la fenêtre de vérification, sauf dans le champ quand la phrase dépasse quatre lignes.

## 10. Composants

Tous les états sont dans `components.html`. Classes, préfixe `hu-` :

| Composant | Classes | États |
|---|---|---|
| Là où tu écris | `hu-field`, `hu-field--short` (relance) | vide, survol, focus, erreur (`aria-invalid`), en cours (`readonly`), désactivé |
| Ce que j'ai compris | `hu-got`, `hu-got-say`, `hu-slot` (`hu-slot-q` le mot gris, `hu-slot-v` la valeur), `hu-got-from` (le compte) | `is-filled`, `is-missing` (ce que la relance demande), `is-off` (place inutile, invisible mais gardée) |
| Sous le champ, une seule place | `hu-under` avec `hu-assume`, `hu-busy`, `hu-error` ou `hu-count` | suppositions, « Je compare… », erreur, « Il reste 40 signes. » |
| Bouton plein | `hu-cuff` | repos, survol, appui, focus, `aria-disabled` (au trait), en cours (au trait, « Je compare… ») |
| Mot souligné | `hu-word` | repos, survol, appui, focus, `aria-disabled` (gris, sans soulignement) |
| Réponse | `hu-verdict`, `hu-glove`, `data-outcome` sur `hu-win` | trois |
| Ligne d'explication | `hu-line`, `hu-line--strong` | |
| Autorisation limitée | `hu-fix` (`b` puis `span`) | |
| Retenue | `hu-wait`, `hu-wait-count`, `hu-num` ; `is-ready` sur `hu-win` | compte, fini |
| Deux adresses | `hu-addr`, `hu-addr-label`, `hu-addr-grid` | caractère identique gris, caractère différent blanc en 600 |
| Suite d'une opération | `hu-head` (« …, demande 1 sur 2 »), `hu-next` | |
| Fin | `hu-end` ; écran « Demande expirée » avec `hu-dock--end` | |
| Interrupteur | `hu-switch`, `hu-switch-on`, `hu-switch-off` | actif, en pause, survol, focus, indisponible |
| Champ de réglage | `hu-input`, `hu-select` dans `hu-pick`, `hu-set`, `hu-saved`, `hu-error` | repos, survol, focus, erreur, désactivé |
| Journal | `hu-entry`, `hu-entry-site`, `hu-entry-what` | arrêtée (`strong`), passée, non vérifiée |
| Autorisation ouverte | `hu-right`, `hu-right-note` | à retirer, `is-busy`, `is-done` |
| État vide | `hu-state` + `hu-empty` | |
| Icône de barre d'outils | pastille du navigateur, fond `#ffffff`, texte `#000000` | actif : aucune pastille ; en pause : « II » ; arrêté : « × » et icône à 40 % |

Place des gestes : le geste conseillé est toujours en bas à droite, l'autre en bas à gauche. Sur la question, « Vérifier » est conseillé. Sur un écart ou un doute, « Ne rien envoyer » l'est.

## 11. Interdits

- Toute couleur, y compris le rouge et le vert. Tout dégradé, toute ombre, tout flou.
- Une deuxième police, une graisse autre que 400 et 600, des capitales, un texte de moins de 14 px à 100 %.
- Un aplat inversé (bande noire sur page blanche, fenêtre blanche), un filet de séparation, une carte, une tuile de chiffres.
- Le gant ailleurs que sur « Ça ne correspond pas », ou plus grand que 88 px, ou animé en boucle.
- Un indicateur de progression décoratif : barre, trait qui se vide, anneau, points qui dansent, pulsation.
- Un bouclier, un cadenas, un pictogramme d'alerte, une émoticône.
- Deux boutons de même poids côte à côte. Une ligne d'aide sous chaque écran. Une étiquette en petites capitales au-dessus d'un titre.
- Une phrase rassurante sous « Je n'ai pas pu vérifier ». Le mot « sûr ».
- Les mots de la colonne de droite du lexique.

## 12. Note sur le logo

À lire avec `logo/LOGO.md`, que ce document ne modifie pas.

- La règle 4 de `LOGO.md` (« ne pas rogner ») vaut pour le logo. Le fondateur a dit que le gant-personnage pouvait sortir du cadre. Ce système n'en a plus besoin : depuis le retour « trop bruyante », le gant reste petit et entier. La permission reste acquise pour une affiche ou une vidéo, pas pour l'interface.
- La règle 8 parle d'un logotype en graisse 700. Dans l'interface, le nom « Hold up » s'écrit en 600, comme tout titre.
- La règle 10 réserve le rouge à « Ça ne correspond pas ». Il n'y a plus de rouge dans l'interface : cette phrase est périmée.
- Dans la fenêtre, le pli du pouce est tracé de la couleur du fond plutôt que percé par un masque : même dessin, moins cher à peindre pendant l'animation.

## 13. Ce qui a été appliqué, et ce qui ne l'a pas été

- `impeccable` : `context.mjs` lancé ; lus `craft-floor`, `operate`, `animate`, `polish`, `typeset`, `layout`, `delight` et le début de `critique`. Surface en mode « operate ». Détecteur `detect.mjs` lancé sur `planche.html`, `motion.html`, `components.html` : 0 constat, mais en mode dégradé (modules d'analyse absents), donc sans valeur de preuve. La critique à deux sous-agents isolés n'a pas été rejouée sur ce système.
- `frontend-design` : lu ; son plan en deux passes a servi pour la direction « carton », abandonnée ensuite sur retour du fondateur.
- `avoid-ai-writing` et son annexe française : appliqués à la main aux textes d'interface et à ces documents. Le détecteur de la skill est calibré pour l'anglais, il n'a pas été lancé.
- `tour-de-design` : `planche.html` et `motion_planche.html` sont prêtes à publier. La publication revient à la session principale. Le choix entre des options revient au fondateur : ici il avait déjà choisi, puis corrigé.
- Regards sur les captures : gabarit et « IA » (bouton invisible, marges perdues, trait qui ressemblait à un lien, légendes inégales), alignements (interrupteur qui bougeait quand son mot changeait), zoom 125, 150 et 200 %.

## 14. Ce qui reste faible

- Sans le gant, la fenêtre est une fenêtre noire propre parmi d'autres. C'est le prix de la sobriété demandée.
- « Ce que j'ai compris » et la ligne des suppositions font deux lignes grises l'une sous l'autre.
- Le panneau latéral est mieux ordonné (ce qui se retire d'abord, le journal ensuite) mais reste une liste.
- La page de réglages ne dessine pas encore le carnet d'adresses, « Mes adresses » ni « Contrats que j'utilise », apparus dans le code pendant ce travail (voir `INTEGRATION.md`).
- Personne n'a vu ces écrans. Les retours de la testeuse portent sur l'ancienne interface.

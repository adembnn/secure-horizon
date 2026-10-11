# Direction B : « Le chèque » (contrat, new-work §5)

Même contrat que le commentaire HTML placé en premier enfant du `body` de chacune des quatre pages.

- **THESIS** : un chèque ne vaut rien si le montant en lettres contredit celui en chiffres. Ici « Tu as dit » et « En réalité » sont les deux lignes qui doivent concorder ; l'écart est cerclé à la main. Refuse la carte d'alerte rouge, le bouclier, le néon.
- **OWN-WORLD** : papier de sécurité #F7F8F6 (nuit #0F1829), encre bleu-noir #1C2B4A, acier #5B6B7A, rouge #B42318 réservé à l'écart. Guillochage SVG en bandeau, lignes de saisie, cases à croix, talon pointillé. Source Sans 3, B612 Mono, Caveat. Angles droits, aucune carte.
- **STORY** : la personne lit deux lignes, voit l'écart cerclé, comprend que le site ne fait pas ce qu'elle a dit, annule. Continuer exige de recopier à la main puis d'attendre.
- **FIRST VIEWPORT** : fenêtre 400 px : bandeau guilloché (nom, niveau), titre, « Tu as dit » sur « En réalité » avec l'écart cerclé, « Annuler » pleine largeur en encre. Sous le talon pointillé : ligne « lu et compris » et « Continuer quand même », isolé.
- **FORM** : chèque français, direction imposée par Adem (rang 1, tirage non joué), clé d445df83.
- **FINISH** : unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Choix typographiques
- **Source Sans 3** (400/600/700) : texte, titres, boutons. Sans humaniste de formulaire administratif ancien, lisible gros à 16-17 px, sans effet de style. Mode Operate : une seule famille d'interface.
- **B612 Mono** : adresses et données uniquement. Dessinée pour la lisibilité des écrans de cockpit (0/O, 1/l distincts), proche de l'esprit OCR de la ligne de chiffres d'un chèque. Largeur fixe, donc cases fixes réelles pour la comparaison.
- **Caveat** (500/700) : seulement la mention manuscrite « lu et compris » et ce que la personne recopie. Aucune police de la liste interdite.

## Écarts et notes
- Détecteur (une passe, mode dégradé : parseurs HTML absents) : 1 alerte « side-tab » sur le soulignement des caractères différents (faux positif : trait sous un caractère, pas une bordure de carte). Corrigé quand même en remplaçant l'ombre interne par un `text-decoration`. Le mode dégradé ne vérifie ni variables CSS ni contraste calculé : sous-estimation possible.
- Texte non fourni par CONTENU.md et ajouté par moi : la barrière de l'écran adresse (« recopie : 1d88 », premier bloc différent de l'adresse collée) ; le libellé « Pour continuer quand même, recopie : » partout ; les repères A et B des deux adresses ; « puis 30 s ». À remplacer si la barrière réelle diffère.
- Les sites sosies derrière la fenêtre sont des blocs flous fictifs (aucune vraie marque).
- Fenêtre plus haute que la zone du cadre sur l'écran adresse (environ 960 px) : elle défile en interne, le talon « Continuer quand même » est sous le pli, ce qui est voulu.
- Non fait : revue par le finish reviewer et DESIGN.md (hors périmètre de cette maquette). Pas de capture sauvegardée dans `.impeccable/review/`. Vérification visuelle faite à 1280, 380 et 360 px, claire et sombre, sans avoir comparé à un comp (aucun comp généré).
- Les polices viennent d'un `@import` Google Fonts dans `style.css` ; hors ligne, repli sur Segoe UI, Cascadia Mono, Segoe Print.

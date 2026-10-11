> **PÉRIMÉ le 11/10/2026 : voir livrables\**

# Hold up : maquettes de la fenêtre d'extension

Six écrans HTML/CSS autonomes (un fichier chacun, aucune dépendance, aucune police externe), largeur 400 px, clair et sombre automatiques (`prefers-color-scheme`). Le bouton « Aperçu » en haut sert seulement à basculer le thème pendant la revue. Données, sites et monnaie sont fictifs : sites en `.example`, monnaie « USDX », adresses inventées.

| Fichier | Écran | Niveau |
|---|---|---|
| `1-question-intention.html` | Question d'intention | avant verdict |
| `2-danger-signature.html` | Signature piégée, « Tu as dit / En réalité » | Danger |
| `3-danger-adresse.html` | Adresse sosie, caractères différents surlignés | Danger |
| `4-manipulation.html` | Pause de 10 min, « appeler un proche » | Manipulation |
| `5-attention.html` | Un point à vérifier, 1 clic | Attention |
| `6-verification-impossible.html` | Analyse indisponible | ni vert ni rouge |

Les interactions de base fonctionnent (choix qui active « Continuer », phrase à retaper puis 30 s, compte à rebours de 10 min). La page n'envoie rien : les boutons ne sont pas branchés au wallet.

## Principes communs

1. **Annuler est toujours au même endroit.** Dernier bouton, pleine largeur, même libellé : « Annuler, rien ne sera envoyé ». Une personne qui l'a trouvé une fois le retrouve sur tous les écrans. Sur les écrans rouges il est plein et de couleur forte (c'est la réponse recommandée) ; sur la question et sur Attention il est en contour. Il reçoit le focus clavier initial sur les écrans rouges, pour qu'un Entrée réflexe annule au lieu de valider. Sous le bouton : « Annuler ne coûte rien et tu peux recommencer plus tard », pour que choisir la prudence ne donne jamais l'impression d'une faute.
2. **Continuer est discret quand c'est dangereux.** Sur un écran rouge, « Continuer malgré le danger » est un bouton en contour, grisé et en pointillés tant que la barrière n'est pas franchie. Le gros bouton plein est celui qui protège.
3. **Le niveau ne dépend jamais de la couleur seule.** Chaque niveau a un mot (Danger, Pause, Attention, Non vérifié), une forme d'icône différente (octogone, main levée, triangle, cercle en pointillés) et un traitement de bandeau propre. Utile pour le daltonisme et pour un écran mal réglé.
4. **Zéro jargon.** Pas de « permit », « approve », « allowance », « contrat », « signature de message ». On dit « le droit de prendre ton argent », « une adresse qui ressemble à celle de Paul ». Les mots de l'utilisateur sont repris tels quels dans « Tu as dit ».
5. **Lisible par un retraité.** Texte de base 18 px, titres 24 px, montants 26 px en gras avec chiffres tabulaires, interligne 1,5, cibles tactiles et clavier d'au moins 48 px (le minimum WCAG 2.2 est 24 px), une seule colonne, une seule idée par bloc, phrases courtes à l'indicatif. Aucune animation nécessaire ; `prefers-reduced-motion` est respecté.
6. **Accessible.** Rôle `alertdialog` avec titre et description liés. Contrastes calculés pour viser au moins 4,5:1 pour le texte et 3:1 pour les bordures des champs, dans les deux thèmes (à valider avec un outil avant publication, voir « À vérifier »). Anneau de focus de 4 px visible, ordre de tabulation logique, `role="timer"` pour le compte à rebours, zone `aria-live` séparée qui n'annonce que chaque minute (le lecteur d'écran ne lit pas chaque seconde). États de la barrière annoncés (« Phrase correcte. Attends 30 secondes. »).
7. **Clair et sombre.** Deux jeux de jetons complets, pas une inversion : en sombre, les rouges sont éclaircis pour garder le contraste sur fond sombre et le surlignage des caractères reste jaune avec du texte noir dans les deux thèmes.

## Choix écran par écran

### 1. Question d'intention
- **4 choix** (le brief en autorise 2 à 4). Ils sont adaptés à une signature qui donne un droit : « Je reçois de l'argent ou un cadeau », « Je paie ou j'achète », « Je me connecte à ce site », « Quelqu'un m'a demandé de le faire ». Pour une sortie de fonds, la liste serait contextuelle (« Je paie quelqu'un », « J'envoie vers mon propre compte », etc.) avec le même gabarit. L'option « Quelqu'un m'a demandé » reste toujours présente : c'est le signal le plus fort.
- **Aucun choix n'est coché par défaut** et « Continuer » reste désactivé tant qu'aucun n'est choisi. Un choix pré-coché serait validé par réflexe et fausserait la comparaison.
- **Le champ « Colle le message reçu » est facultatif**, visible sans clic, en mots simples.
- **La phrase « ta réponse peut seulement rendre la vérification plus stricte »** est là pour une raison de confiance : l'utilisateur n'a aucun intérêt à mentir pour « passer » (un escroc qui le coache ne gagne rien à lui faire choisir « je paie »). Elle est vraie par construction de la grille.
- Le bandeau est ambre, pas rouge : la question n'est pas une alerte. L'écran ne révèle pas le verdict avant la réponse, pour ne pas la biaiser.

### 2. Danger : signature piégée
- **Deux colonnes « Tu as dit » / « En réalité »** à largeur égale, la seconde teintée et bordée de rouge. Elles se replient en une colonne sous 340 px.
- **Le montant est lisible** : « 50 USDX » face à « 2 480 USDX », en gros, avec la formule « tout ton solde, sans limite de temps. Tu ne reçois rien. » La simulation montre « 0 changement » (voir le brief) : on traduit donc le droit en montant que la personne peut perdre aujourd'hui.
- **Trois raisons courtes** en liste, pas un paragraphe. La troisième (« un vrai remboursement ne demande jamais de signer ») réutilise l'argument de la manipulation.
- **Barrière** : recopier une phrase qui décrit l'effet réel (« je donne à ce site le droit de prendre mon argent »), puis 30 s. La phrase force à lire l'effet, pas seulement à cliquer. La comparaison ignore les accents, la casse et la ponctuation, pour ne pas bloquer quelqu'un qui tape mal. Le compte à 30 s redémarre si la phrase change.
- Copier-coller de la phrase : la phrase est en `user-select: none` pour obliger à la retaper, mais le champ accepte le collage (on n'empêche pas l'assistance technique).

### 3. Danger : adresse piégée
- Mêmes deux colonnes, avec la **comparaison des deux adresses l'une sous l'autre**, sur le même gabarit de lignes, en police à chasse fixe et par blocs de 4 caractères. Les blocs identiques permettent de lire en vertical.
- **Chaque caractère différent est surligné en jaune, en gras et souligné** (jamais la couleur seule). Une légende donne le compte : « 26 caractères sur 40 sont différents » et dit que le début et la fin sont identiques « pour te tromper », ce qui explique pourquoi un coup d'œil ne suffit pas.
- L'adresse connue est étiquetée « déjà utilisée par toi », l'adresse de la demande est teintée de rouge.
- Même barrière que l'écran 2, avec une phrase qui nomme le fait : « je sais que ce n'est pas l'adresse de Paul ».

### 4. Manipulation
- **Le titre ne dit pas « tu es victime »** mais « Fais une pause. On te met la pression. » Une victime sous emprise rejette une accusation ; elle accepte plus facilement une pause.
- **L'argument central est en gras en première ligne** : « Aucun vrai support ne demande ça. » Il vient avant tout détail technique.
- **Le message collé est cité**, avec la phrase suspecte surlignée. L'utilisateur voit ce que le système a vu, donc il peut contester.
- **Compte à rebours de 10 min** en 48 px, avec barre qui se vide. Il est annoncé aux lecteurs d'écran chaque minute. À zéro, « Je continue quand même » se débloque ; Annuler reste disponible pendant toute la durée.
- **« Appeler un proche »** est le premier bouton d'action, avec le contact choisi à l'avance (« Claire (ma fille) »). Le lien `tel:` est un confort : il peut ne rien faire sur un ordinateur, donc le nom et le numéro sont affichés en texte. Le contact se règle dans les réglages, avant tout incident (décision produit à confirmer, voir le brief § 11).
- Écran rouge comme demandé, mais avec une icône « pause » (main levée) et le mot « Pause » pour le distinguer de « Danger » : le ton est protecteur, pas répressif.

### 5. Attention
- **Un bandeau et un clic.** Le bouton principal reprend l'action (« Oui, c'est bien ça, envoyer »), pour que le clic soit une confirmation consciente et non un « OK » machinal. Annuler est en contour.
- **Un seul fait** à vérifier, formulé comme une aide (« si c'est la première fois que tu paies Paul, c'est normal »). C'est un faux positif probable : le ton ne doit pas crier.
- Ambre foncé sur texte clair (et inverse en sombre) pour garder 4,5:1, pas de jaune pâle sur blanc.

### 6. Vérification impossible
- **Jamais vert, jamais rouge.** Gris-bleu neutre avec bordures en pointillés, icône « ? » en cercle pointillé : on lit « pas validé » sans lire « sûr ». Pas de coche, pas de bouclier plein.
- **Première phrase : « Ce n'est pas une confirmation. »** Le risque est qu'une absence d'alerte soit lue comme un feu vert.
- Trois actions : Réessayer, Annuler (le bouton fort), et « Continuer sans vérification, à mes risques » en discret, avec la mention explicite du risque.
- Sur les grosses sommes, le conseil « attends puis réessaie » s'affiche ; le seuil réel est à fixer côté moteur.

## Références sur les avertissements (de mémoire, à vérifier avant de les citer au jury)

Je n'ai pas de connexion pour les rouvrir. Je ne cite que des travaux dont je suis sûr de l'existence, sans reprendre de chiffres.

- Egelman, Cranor, Hong, « You've Been Warned : An Empirical Study of the Effectiveness of Web Browser Phishing Warnings », CHI 2008 : les avertissements qui bloquent l'action protègent mieux que les bandeaux passifs. Appui pour la rétention de la demande et pour le verdict plein écran.
- Akhawe, Felt, « Alice in Warningland : A Large-Scale Field Study of Browser Security Warning Effectiveness », USENIX Security 2013 : les taux de clic passant outre varient beaucoup selon le design de l'alerte. Appui pour un seul message, une action recommandée et le contournement difficile.
- Sunshine, Egelman, Almuhimedi, Atri, Cranor, « Crying Wolf : An Empirical Study of SSL Warning Effectiveness », USENIX Security 2009 : trop d'alertes et du jargon poussent à ignorer. Appui pour la grille à quatre niveaux, « OK = rien », et pour le zéro jargon.
- Felt et al., « Improving SSL Warnings : Comprehension and Adherence », CHI 2015 : une action recommandée claire et un contraste visuel entre le choix sûr et le choix risqué augmentent l'adhésion. Appui pour le bouton Annuler plein et Continuer discret.
- Anderson, Vance, Kirwan, Eargle, Jenkins, « How Users Perceive and Respond to Security Messages : A NeuroIS Research Agenda and Empirical Study » et les travaux associés sur l'habituation (fMRI), 2014-2016 : la réponse du cerveau aux alertes répétées baisse vite. Appui pour limiter le rouge aux cas graves et suivre le taux de fatigue du banc d'essai.
- Normes d'accessibilité : WCAG 2.2, critères 1.4.3 (contraste du texte, 4,5:1), 1.4.11 (contraste des composants, 3:1), 2.4.7 (focus visible), 2.5.8 (taille de cible).

Aucune référence ne porte sur les wallets crypto : l'efficacité de ce design sur cette arnaque précise n'est pas démontrée et doit être mesurée par un test utilisateur.

## À vérifier avant de montrer

- **Contrastes** : calculés à la main sur les paires principales, à passer dans un outil (Lighthouse, axe) sur chaque thème.
- **Test à 5 personnes de plus de 60 ans** : comprennent-elles « Tu as dit / En réalité » sans explication ? Le bouton Annuler est-il trouvé en moins de 3 s ?
- **Limites de MetaMask Snap** : les écrans montrent l'idéal. Un Snap n'affiche que des composants limités et ne peut pas désactiver le bouton de signature (voir `docs/BRIEF_direction.md` § 6). La barrière de 30 s et la pause de 10 min supposent donc la fenêtre de l'extension Hold up qui s'interpose avant le wallet.
- **Barrière de 30 s sur le faux positif** : à mesurer sur le banc d'essai (fatigue). Si elle s'applique à des opérations honnêtes, l'utilisateur apprendra à contourner.
- **Après la pause de 10 min**, que se passe-t-il ? Ici, « Je continue quand même » se débloque. À décider avec Titouan (le brief § 11 pose la question du contact de confiance).

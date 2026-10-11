# Hiérarchie de l'information : v1 (passe expert UX, corrige la v0)

Règle d'Adem : l'interface ne montre QUE ce qui compte pour la personne. Test appliqué à chaque élément : « sans lui, la personne décide-t-elle mal en 3 secondes ? » Si non, il part (ou il va derrière « Pourquoi ? »).

## Principes (resserrés)
1. Premier regard, trois choses maximum : **l'écart ou la consigne**, **Annuler**, rien d'autre. Le verdict tient en une ligne.
2. Tout le reste est derrière « Pourquoi ? » (dépliable, fermé par défaut).
3. Zéro texte sur Sentinelle, zéro icône sans information, zéro compteur.
4. Un seul accent de couleur, posé sur l'écart. L'accent n'est jamais seul : gras + soulignement ou symbole aussi (daltoniens).
5. Les plus grandes données : montants et adresses. Sur Manipulation, la consigne « raccroche » est plus grande que le verdict.
6. Le focus clavier et lecteur d'écran démarre sur **Annuler**. Entrée ne déclenche jamais « Continuer quand même ».

## Écran Danger, signature piégée
Ordre de lecture et taille :
1. (moyen) **Ce n'est pas ce que tu as demandé.**
2. (le plus grand) l'écart :
   - Tu crois : **recevoir 50 USDC**
   - En réalité : **ce site pourra prendre tes 2 480 USDC**
3. (grand, plein, pleine largeur) **Annuler**
4. (petit mais lisible, cible 44 px) Pourquoi ? : « Il pourra les prendre maintenant et plus tard, sans te redemander. Ce contrat a 3 minutes d'existence. »
5. (dernier, texte seul, jamais en gras) Continuer quand même → barrière : recopier une phrase variable, puis 30 s.

Changements de texte : « donner l'accès à » devient « ce site pourra prendre » (« accès » ne dit pas la perte). « En vrai » devient « En réalité ». « Pourquoi » raccourci, sans conditionnel.

## Écran Danger, adresse sosie
Ordre de lecture et taille :
1. (moyen) **Cette adresse n'est pas la tienne.**
2. (le plus grand) deux adresses l'une sous l'autre, en chasse fixe, par groupes de 4 :
   - Ton adresse : `0x7a3F 9c21 B04e 5D8a 1f6C 2E90 aB47 33dE 8c15 E2b9`
   - Collée : `0x7a3F 1d88 Ce02 77aF 0b3D 9a41 F6c2 0e5B 4d19 E2b9`
   - Les groupes qui diffèrent sont soulignés et en gras (accent en plus, pas seul).
3. (grand, plein) **Utiliser mon adresse**
4. (secondaire, même taille de cible) Annuler
5. Pourquoi ? : « Elle ressemble à la tienne. Quelqu'un t'a envoyé 0 USDC pour qu'elle apparaisse dans ton historique. »
6. (dernier) Continuer quand même.

Changements : plus de « Coinbase » (on ne le sait pas toujours, et c'est du bruit). Plus de « 26 caractères différents » (chiffre qui ne dit rien à la personne). « Envoyer à mon adresse habituelle » devient « Utiliser mon adresse ».

## Écran Manipulation
Ordre de lecture et taille :
1. (moyen) **Personne de sérieux ne te demande de déplacer ton argent.**
2. (le plus grand) **Quelqu'un te dicte quoi faire ? Raccroche, ou ferme la discussion.**
3. (moyen) Rien n'est parti. Ta demande attend.
4. (grand, plein) **Annuler la demande**
5. (secondaire, même taille) Appeler un proche
6. Pourquoi ? : le message collé, classé « faux support ». Minuteur ici, avec « Elle reste en attente 10 minutes ».
- Aucun bouton « continuer » pendant le délai.

Changements : « Si tu es au téléphone, raccroche » devient une consigne qui couvre aussi le chat. Le minuteur 9:41 sort du premier regard (il stresse et ne sert pas à décider) ; il est remplacé par « Rien n'est parti » qui rassure sur l'essentiel.

## Écran Question d'intention
Ordre de lecture et taille :
1. (le plus grand) **Qu'essaies-tu de faire ?**
2. 5 choix, une ligne chacun, cibles larges, ordre fixe :
   - Recevoir de l'argent
   - Payer quelqu'un
   - Échanger une crypto
   - Me connecter
   - On me l'a demandé
3. (grand, plein) **Vérifier** (grisé tant que rien n'est choisi, état annoncé)
4. Annuler (texte, cible 44 px)

Changements : le lien « Coller le message reçu » disparaît de l'écran. Le champ apparaît seulement si la personne choisit « On me l'a demandé ». Rien sur Sentinelle ni sur la rigueur de la vérification (aide).

## Pièges à traiter en conception
| Piège | Où | Réponse |
|---|---|---|
| L'escroc dicte « clique sur Continuer quand même » ou « tape cette phrase » | Danger | La phrase est variable ; ajouter un fragment que l'escroc ne connaît pas à l'avance (4 derniers caractères de l'adresse affichée). « Continuer » reste en bas, sans couleur ni gras. |
| L'escroc dicte « choisis Payer quelqu'un » | Intention | Inévitable. Le niveau ne baisse jamais à cause d'une réponse ; la détection se fait sur les faits de la transaction, pas sur la réponse. Ne jamais présenter la question comme une protection. |
| L'escroc dit « c'est juste un délai de sécurité, reste en ligne 10 min » | Manipulation | « Raccroche » est la ligne la plus grande. Pas d'écran de décompte qui invite à attendre au téléphone. |
| Personne âgée | Tous | Corps de texte 20 px minimum, verdict 24 px, écart 28 px et plus. Cibles 48 px. Phrases courtes. Aucun mot technique. Pas d'accusation (« arnaque », « victime »). Vouvoiement ou tutoiement : décision à prendre avec Adem, appliquer partout. |
| Daltonien | Danger | L'écart se lit sans la couleur : gras, soulignement, libellés « Tu crois / En réalité ». Contraste AA minimum. Pas de rouge/vert comme seule différence. |
| Lecteur d'écran | Tous | `alertdialog`, nom = verdict, description = l'écart. Adresses : annoncer « les 4 premiers et les 4 derniers caractères sont identiques ; le milieu diffère » puis proposer de lire groupe par groupe (jamais 40 caractères d'un coup). Minuteur : annoncer à l'ouverture et toutes les minutes, jamais chaque seconde. « Pourquoi ? » = bouton avec `aria-expanded`. |
| Lecture des adresses | Sosie | Police qui distingue 0/O et 1/l, regroupement par 4. |
| Personne figée par le stress | Danger / Manipulation | Annuler est toujours actif, jamais grisé, jamais précédé d'un délai. |

À décider hors design : ce qui se passe au bout des 10 min (PRODUCT.md, non tranché). Ne rien écrire à l'écran qui promette une issue tant que ce n'est pas décidé.

## Ce que j'ai coupé et pourquoi
- **Danger, signature : « Le contrat a été créé il y a 3 minutes » sorti du premier regard** (gardé dans Pourquoi). Preuve forte pour un technicien, mais l'écart « 50 / 2 480 » suffit à décider.
- **Danger, signature : « Ce site pourrait prendre... »** : le conditionnel affaiblit. Remplacé par un fait au futur.
- **Sosie : « Coinbase »**, **« 26 caractères différents »** : bruit. Le soulignement des groupes qui diffèrent montre déjà l'écart.
- **Sosie : « Ton adresse habituelle »** raccourci en « Ton adresse » / « Collée » (le libellé n'a pas besoin d'être une phrase).
- **Manipulation : minuteur 9:41 au premier plan.** Il ne sert pas la décision, il fait regarder l'écran, et un escroc peut dire « attends la fin du compte à rebours ». Déplacé dans Pourquoi.
- **Manipulation : « Si tu es au téléphone »** : conditionnel, exclut le chat. Remplacé par une consigne qui couvre les deux.
- **Manipulation : phrase « Ta demande attend 10 minutes »** en gros : remplacée par « Rien n'est parti », plus rassurant et plus utile.
- **Intention : lien « Coller le message reçu »** : n'apparaît que si la personne dit « On me l'a demandé ». Un lien de plus sur un écran à 5 choix coûte du temps de lecture à tout le monde.
- **Intention : « On m'a demandé de le faire »** raccourci en « On me l'a demandé ».
- **Partout : Continuer quand même** n'est plus un élément du premier regard. Il reste visible (règles 2 et 15, sortie sans honte) mais en dernier, sans accent, ce qui limite un clic dicté.
- **Gardé volontairement** : « Appeler un proche » sur Manipulation seulement (règle 7 en demande trois gestes ; sur Danger, deux boutons plus un lien suffisent, un troisième dilue). À arbitrer si vous voulez le même geste partout.

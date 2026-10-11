---
name: tour-de-design
description: Publie un canevas Design (artefact, planches .dc.html) dès qu'une décision visuelle ou de design produit apparaît, y compris une couleur, une disposition, une typographie, un composant, un écran, une maquette, une figure, une carte ou une palette. Se déclenche même pour un arbitrage mineur que la session compte trancher seule. À utiliser aussi pour lire les commentaires d'Adem sur un canevas déjà publié et republier les planches corrigées.
user-invocable: true
---

# Tour de design

Décision d'Adem du 2026-09-23 : **toute décision visuelle ou de design produit un artefact**, sans
exception pour une décision mineure. Ne jamais décrire un choix visuel en mots, ni le trancher sans
planche, même pour le renverser ensuite.

Décision d'Adem du 2026-09-24 : **le choix entre les options revient à Adem, toujours.** La session
publie le canevas, renvoie Adem vers son lien, et attend son choix ; aucune option ne se code avant.
Une recommandation se dit (une phrase, avec sa raison), elle ne se livre pas. Précédent : la suite
du parcours guidé a choisi seule, codé et fusionné six écrans ; Adem a répondu « tu prends pas les
décisions à ma place sur ce genre de chose », a renversé l'accueil et la séance, et a fait
redessiner le profil.

## Publier le canevas

**Adem, 2026-10-02, sur la refonte UI/UX : « fais-moi des pages html plutôt ».** Pour un écran
entier, les options se montrent désormais en vraies pages HTML qu'on parcourt (un artefact à
plusieurs fichiers : une page d'index qui présente les options, une page par écran et par option,
responsive, thème clair et sombre), contrôlées par
`.scratch/mate-beta/design/refonte-2026-10/outil/verifier-pages.mjs`. Le canevas Design reste pour
un composant ou un détail. Tout le reste de cette skill tient : 3 à 4 options vraiment différentes,
Adem choisit, rien ne se code avant.

1. `Artifact`, action `quickstart`, intention `design` : ça donne le canevas Design et le lien des
   systèmes de composants existants. Créer depuis le type « Design », jamais une page HTML simple
   (sauf pour un écran entier, voir ci-dessus).
2. Préparer une planche par option, en fichier `.dc.html`, dans
   `.scratch/mate-beta/design/<nom-du-sujet>/project/`, une planche par écran et par option, nommée
   `<Écran>-<Option>.dc.html` (exemple réel : `.scratch/mate-beta/design/harnais-concours/project/`, avec
   `Fourchette-A.dc.html` à `Fourchette-D.dc.html`). Un CSS ou des
   tokens partagés vont dans ce même dossier `project/`, pas recopiés dans chaque planche.
3. **3 à 4 options vraiment différentes**, jamais des variantes de couleur d'une même idée : chaque
   option part d'une référence concrète différente (un vrai produit, une vraie composition), pas
   d'une variation verbale sur la même. Une rangée par écran ou par composant quand plusieurs sont
   en jeu.
4. Avant de publier, vérifier ce que dit `DESIGN.md` : pas de noir en aplat sur un élément
   interactif (`--ink` jamais en fond de bouton, d'état actif ou de tooltip, l'accent d'action à la
   place) ; pas de dégradé, de glow, de bordure colorée décorative, de ligne de règle horizontale,
   d'emoji ; contraste ≥ 4,5:1, zones cliquables ≥ 24×24px ; l'écran tient à 1440×900 et 1280×720
   sans scroll (`scrollHeight <= innerHeight`), une liste longue se range plutôt que défiler sur
   l'aperçu. Sur le rendu publié, vérifier que la police de l'app (Lexend) se charge bien, et pas
   une police système à sa place ; le contrôle
   `node .scratch/mate-beta/design/refonte-ds/rendre.mjs <dossier-planches> <dossier-sortie> <nom-planche>`
   fait cette vérification mécaniquement et sort en erreur si la police ne charge pas, si la planche
   déborde de 900px ou si une ligne de lecture dépasse 78 caractères.
4 bis. **Une capture de l'app locale peut entrer dans une planche** (accord d'Adem du 2026-09-23) :
   un avant et après se montre mieux par deux captures que par un écran redessiné. Elle part comme
   asset du canevas, qui reste privé (`Artifact`, `asset: true`, puis l'url rendue dans un `<img>`).
   Une capture ne montre que les élèves fictifs de la base locale, jamais un vrai élève. Si le mode
   auto refuse quand même l'envoi, la planche se redessine en balisage et le refus se note dans
   `frictions.md`. **Chaque capture se regarde (outil Read) avant de partir** : le 2026-09-24, la
   planche « livré » de la séance a montré à Adem une page d'erreur (« Cette notion n'existe pas
   dans le référentiel »), capturée avec une mauvaise adresse et publiée sans être vue.
5. La session principale publie l'artefact. Un sous-agent peut préparer les fichiers `.dc.html`,
   jamais publier à sa place.
6. Le lien va dans le fil de conversation **et** dans `.scratch/mate-beta/map.md` : en attente, il
   figure dans « Chantiers ouverts et questions en attente d'Adem » ; une fois Adem décidé, la ligne
   sort de cette section et la décision s'écrit dans la section du domaine (ou l'ADR) avec le lien du
   canevas. Une planche sans la décision qui va avec ne sert à rien à qui relit `map.md` plus tard.

4 ter. **La session s'évalue elle-même avant de montrer quoi que ce soit** (Adem, 2026-09-24 :
   « il faut que tu aies cette capacité à voir qu'il y a un problème si l'ergonomie, l'expérience
   utilisateur ne sont pas comme on l'a convenu, que tu relances la machine, que tu fasses des
   modifications, que tu prennes des initiatives pour me rendre un produit fini »). L'outil de rendu
   des planches porte un contrôle d'ergonomie mécanique (modèle :
   `.scratch/mate-beta/design/feuille-unique/rendre.mjs`) ; une planche KO repart à son agent avec le
   relevé exact, sans passer par Adem. La session relit ensuite chaque PNG elle-même : ce que le
   contrôle ne mesure pas (sens, lisibilité, vide) se juge à l'œil avant publication. Adem ne doit
   jamais être le premier à voir un défaut déjà convenu.

## Itérer avec Adem

7. Un seul changement à la fois : montrer, attendre sa réaction, corriger ce point précis, puis
   seulement passer au suivant. Ne jamais enchaîner plusieurs modifications non montrées.
8. Ne jamais remplacer une planche par une question posée en mots (type `AskUserQuestion`), même
   pour un choix qui semble mineur, même si une planche proche existe déjà : renvoyer vers le lien
   existant plutôt que reposer le choix en texte.
9. Une décision fondatrice (système de design, palette, typographie, motif de composant réutilisé
   partout) se construit avec Adem option par option, jamais rédigée seule puis présentée comme
   acquise, sauf délégation explicite et datée de sa part · et même déléguée, elle garde sa planche.

## Lire les commentaires

10. Lire les commentaires d'Adem sur le canevas avec `ArtifactComments`, élément par élément.
11. Corriger à la source : le moteur de rendu ou la règle qui a produit le défaut, pas la planche
    seule (précédent du 2026-09-22 : 52 gabarits de figures commentés un par un, correction posée
    dans la règle de placement, pas planche par planche).
12. Republier seulement les planches modifiées, jamais tout le canevas.
13. Répondre sur chaque fil de commentaire, puis le résoudre.

## Une décision tranchée seule

14. Un arbitrage visuel mineur, réversible, tranché seul selon `CLAUDE.md`, produit quand même sa
    planche. Le lien va dans la synthèse finale remise à Adem, avec la raison du choix, pour qu'il
    puisse la renverser. Mineur veut dire un détail à l'intérieur d'une option déjà choisie par
    Adem (un espacement, un libellé de bouton, un état que la planche n'a pas dessiné) ; choisir
    entre les options d'un écran ne l'est jamais (décision du 2026-09-24, en tête de cette skill).

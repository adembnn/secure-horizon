# Évaluation de design n° 1 : Hold up, extension de bureau

11 oct. 2026. Évaluateur : agent de design (lecture seule sur le produit, aucun commit).

## Note globale : 50 / 100

Le produit fonctionne et ne plante pas. Il n'est pas encore une application finie. Trois raisons :

1. Il n'y a aucune animation dessinée. Tout change par coupe sèche.
2. Quatre surfaces ont quatre designs différents, dont une qui est exactement ce que le fondateur a rejeté.
3. Il manque les pièces qui font une application : icônes, popup de barre d'outils, écran de bienvenue.

Moyenne des onze critères : 31,5 / 55, soit 57 / 100. J'enlève 7 points pour les surfaces absentes.

| # | Critère | Note / 5 | Preuve principale |
|---|---|---|---|
| 1 | Hiérarchie, lecture en une seconde | 3 | La phrase de réponse se lit tout de suite. La ligne « Droit limité à 50 USDC » contredit le titre rouge. |
| 2 | Sobriété | 2,5 | Fenêtre sobre mais sans caractère. Le repli dans la page est un gabarit rouge à cartes. |
| 3 | Typographie, espacements, alignements | 3 | Échelle propre. Nom de site coupé au milieu d'un mot, bouton Annuler seul sur une demi-largeur, 190 px de vide. |
| 4 | Contraste | 4 | Tous les textes passent AA. Bords des contrôles inactifs à 1,09 et 1,26. Page de réglages livrée sans thème sombre. |
| 5 | Clavier | 4 | Ordre, Entrée, Maj+Entrée, Échap, focus visible : corrects. Erreur sans message, aucun rappel des touches. |
| 6 | États | 2,5 | Chargement visible 20 ms. Erreur portée par la couleur seule. Messages de fin jamais affichés. |
| 7 | Textes | 2,5 | « intention classée sans modèle », « tools/verify_journal.mjs », erreur JSON en anglais, « Je » puis « Nous ». |
| 8 | Cohérence entre surfaces | 2 | Fenêtre v5, panneau v5 approximatif, réglages livrés en ancien style, repli en style v4. |
| 9 | Codes d'une application de bureau | 3,5 | Fenêtre fixe 440 × 540, bien placée. Pas d'icône, barres de défilement natives, casse à 150 %. |
| 10 | Animations | 1,5 | Fluide (0 image perdue hors ouverture) parce qu'il n'y a rien à animer. |
| 11 | Bugs | 3 | Aucun plantage, aucune erreur de console. Défilement à 100 % sur l'écran des deux adresses, double barre, débordements à 150 %. |

## Méthode

- Navigateur : Chromium 1243 de Playwright, `--headless=new`, extension chargée par `--load-extension`. Écran de mesure à 144 Hz (intervalle médian 6,9 ms).
- Extension évaluée : une copie hors dépôt de `extension_standalone/extension/`, mise à jour avec les sources actuelles de `extension/`. **Le dossier construit dans le dépôt est en retard** sur trois fichiers (`gatekeeper.js`, `outcome.js`, `ui/screen.js`) : il faut le reconstruire avant de livrer.
- Flux réel : site Neve (8793), chaîne locale (8545), portefeuille simulé. Scènes jouées : honnête, piège, permit, relance, fermeture par la croix, rechargement du site, clics répétés, deux onglets, fin de délai, annuler puis réessayer.
- États fixes : les 15 états de la fenêtre dessinés par le vrai `ui/screen.js` dans la vraie page `chrome-extension://<id>/window.html`, en clair et en sombre, à 100 % (422 × 493) et à 150 % (281 × 329 CSS, densité 1,5).
- Limites : pas de mesure de l'animation d'ouverture de fenêtre du système (headless). La vidéo démarre après le premier rendu : l'instant vide de l'ouverture est mesuré par les événements de peinture, pas filmé. Le panneau latéral est évalué par sa page ouverte directement, pas dans le vrai volet de Chrome. Le cas « deux onglets en même temps » n'a montré qu'une fenêtre : je n'ai pas vérifié ce que devient la seconde demande.
- Jetons de test déclarés dans le contexte (USDC, WAVAX de la chaîne locale). Sans cela, la scène honnête répond « Je n'ai pas pu vérifier ».

Grille appliquée :
- `impeccable` : audit en cinq dimensions (accessibilité, performance, thèmes, adaptation, intégrité). Seuil de qualité (`craft-floor.md`) : contraste 4,5:1, états survol / inactif / chargement / erreur / vide, « un moment de mouvement dessiné, pas des effets épars », surfaces du navigateur thémées (sélection, curseur, barres de défilement), pas de tuile « grand chiffre + petite étiquette », pas d'eyebrow, pas de bordure colorée sur un côté. `animate.md` : 100 à 150 ms pour un retour immédiat, 150 à 300 ms pour un changement d'état, sortie plus rapide que l'entrée, pas d'animation de largeur, hauteur, marges, top/left, et « mouvement réduit = moins de mouvement, pas zéro retour ».
- `avoid-ai-writing` : pas de jargon, pas de formule creuse, phrases qui nomment l'action.
- `frontend-design` : une direction assumée, pas un gabarit.
- `docs/design/v5/DESIGN.md` : six jetons, un seul rouge une fois par écran, aucun nom de niveau montré.
- `docs/design/system/pistes/piste_3.html` (« Le gant », direction choisie) : voir la section dédiée.

## Défauts

Gravité : **bloquant** (empêche de livrer comme une vraie application), **gênant**, **finition**.

### Fenêtre de vérification

| # | Gravité | Capture | Description | Fichier et ligne | Correction |
|---|---|---|---|---|---|
| F1 | bloquant | `unitaires/fenetre_ne_correspond_pas_droit_limite_clair_100.png` | Titre rouge « Ça ne correspond pas », puis ligne grise « Droit limité à 50 USDC », sans verbe ni point. Continuer est actif tout de suite. La personne ne sait pas si c'est grave ou réparé, ni qui a limité quoi. | `ui/screen.js:79`, `written_check.js:353`, `outcome.js:96` | Phrase complète en encre, pas en gris : « Hold up a limité le droit à 50 USDC. Le site demandait un accès sans limite. » Si le droit est corrigé, le titre ne doit plus être rouge (la piste 3 le range sous « Ça correspond »). |
| F2 | bloquant | `unitaires/fenetre_ne_correspond_pas_adresses_clair_100.png` | L'écran des deux adresses déborde à 100 % : contenu 413 px pour 385. Barre de défilement native grise, note du bas cachée. C'est l'écran le plus important (adresse sosie). | `ui/screen.css:45`, `:74-79` | Marge haute 24 px sur cet état, `.hu-addr{margin-top:16px}`, `.hu-addr+.hu-addr{margin-top:12px}`, retirer la note de modèle. Vérifier `scrollHeight <= clientHeight`. |
| F3 | bloquant | `planche_fenetre_clair_150.png` | À 150 % de zoom, 7 états sur 15 défilent. « Droit limité » et la fin de l'explication sont cachés. Le délai passe sur deux lignes. | `ui/screen.css:45`, `:104-108` | Requête de conteneur sur la hauteur à 360 px : titre 20/24, texte 14/20, marge haute 16, zone basse 8/16/16. Ou fenêtre créée plus haute (`gatekeeper.js:62`, 440 × 600) et taille minimale imposée. |
| F4 | bloquant | `film_verdict_sombre.png`, mesures | Les messages de fin ne s'affichent jamais. Après Annuler la fenêtre disparaît en 43 à 48 ms, après Continuer en 29 ms. Le texte « Demande annulée. Rien n'a été envoyé. » et les 900 ms de `window.js` sont du code mort. La fenêtre claque. | `gatekeeper.js:437` (et `:424`), `window.js:21-24`, `:48-50` | Laisser la page se fermer elle-même : le service worker attend 700 ms avant `chrome.windows.remove`. La page affiche le message 600 ms puis se ferme. |
| F5 | gênant | `mesures/honnete_clair.json` | L'état « Vérification… / Je compare ta phrase à la demande. » reste 20 à 22 ms à l'écran. C'est un clignotement : champ grisé, bouton grisé, puis tout change. | `ui/screen.js:55`, `:60` | Ne montrer l'état d'attente que si la réponse tarde plus de 150 ms. Une fois montré, le garder 300 ms au minimum. |
| F6 | gênant | `mesures/honnete_clair.json` | Scène honnête : la fenêtre 1 se ferme, une fenêtre 2 s'ouvre 1 s pour redire « Ça correspond », puis se ferme. Deux fenêtres qui apparaissent et disparaissent pour une seule intention. | `gatekeeper.js:395-412` | Garder la même fenêtre pour les demandes d'une même intention : remplacer le contenu au lieu de fermer et rouvrir. |
| F7 | gênant | `unitaires/fenetre_texte_tres_long_clair_100.png` | Deux barres de défilement côte à côte (la colonne et le document : 517 px pour 493). Les textes cachés pour lecteur d'écran sont en `position:absolute` sans parent positionné. | `ui/screen.css:83`, `:45`, `window.css:2` | `.hu-main{position:relative}` et `html,body{overflow:hidden}`. |
| F8 | gênant | `unitaires/fenetre_question_vide_entree_clair_100.png` | Entrée sur un champ vide : le bord devient rouge, aucun message. L'erreur est portée par la couleur seule. Le rouge est aussi réservé au verdict. | `ui/screen.js:59` | Ligne sous le champ, `role="alert"` : « Écris d'abord ce que tu veux faire. » En encre et en gras, bord épaissi (piste 3), pas de rouge. |
| F9 | gênant | `unitaires/fenetre_question_site_long_clair_100.png` | Un nom de site long est coupé au milieu d'un mot (« verificati / on ») et le titre prend 4 lignes. | `ui/screen.css:49` | `overflow-wrap:break-word`, et mettre le site sur sa propre ligne en taille texte avec `<wbr>` après chaque point. La piste 3 le place dans la bande du haut, avec ellipse au milieu. |
| F10 | gênant | `planche_flux_reel.png` | Après le délai, la ligne « Continuer sera possible dans 1 s. » disparaît. Rien de visible ne dit que c'est possible : « Tu peux continuer. » n'existe que pour le lecteur d'écran. | `ui/screen.js:102-103` | Écrire « Tu peux continuer. » dans `.hu-wait`, en encre. |
| F11 | gênant | `unitaires/fenetre_correspond_auto_clair_100.png` | « Ça correspond » : un seul bouton Annuler collé à gauche sur une demi-largeur. Rien ne dit que la demande part seule dans une seconde. | `ui/screen.js:88-95`, `ui/screen.css:88` | Garder Continuer plein à droite (Entrée continue), ou écrire « La demande part vers ton portefeuille. » dans la ligne basse. |
| F12 | gênant | toutes | « intention classée sans modèle » (ou « par Clef », « par Jev ») sur chaque réponse. C'est un message de développeur. | `ui/screen.js:11`, `:84-85` | Le retirer de la fenêtre. Le garder dans le journal. |
| F13 | gênant | `planche_flux_reel.png` (relance) | « Je n'ai pas pu vérifier cette demande. » suivi de « Nous n'avons trouvé aucun signal dangereux dans cette demande. » Deux voix (je, nous) et deux messages contraires. | texte du moteur (`U_textes_utilisateur.json`), `outcome.js:76-80` | Quand l'état est « pas pu vérifier », ne jamais reprendre une ligne rassurante du moteur. Dire pourquoi : « Je n'ai pas compris ta phrase. » |
| F14 | finition | `planche_fenetre_clair_100.png` | Barres de défilement, poignée et flèches natives dans le champ et la colonne. | `ui/screen.css:45`, `:61` | `scrollbar-width:thin; scrollbar-color:var(--hu-edge) transparent`. |
| F15 | finition | `planche_etats.png` | Bord du bouton inactif à 1,09 (plein) et 1,26 (discret). Le bouton Continuer en attente n'a presque plus de forme. | `ui/screen.css:100-101` | Bord inactif `#d6d6d6` en clair, `#3a3a3a` en sombre (valeurs de la piste 3). |
| F16 | finition | `planche_fenetre_clair_100.png` | 190 px de vide entre le champ et les boutons. Aucune aide : ni ce que fait Hold up, ni les touches. | `ui/screen.js:45-52` | Note sous le champ et rappel « Entrée vérifie. Échap annule. » sous les boutons (piste 3). |
| F17 | finition | `mesures/etats_contrastes_clavier.json` | Pendant la vérification, le focus reste sur le bouton inactif « Vérification… ». | `ui/screen.js:55` | Remettre le focus sur le champ en lecture seule ou sur Annuler. |
| F18 | finition | `mesures/piege_clair.json` | Le titre de la fenêtre est « Hold up » sans le site. La barre de titre du système montre l'identifiant de l'extension. | `window.html:6`, `window.js:10` | `document.title = 'Hold up : ' + site`. |

### Repli dans la page (réglage « fenêtre séparée » décoché, ou fenêtre impossible à créer)

| # | Gravité | Capture | Description | Fichier et ligne | Correction |
|---|---|---|---|---|---|
| R1 | bloquant | `planche_repli.png` | C'est le design rejeté : bandeau rouge « DANGER / Stop. Ne signe pas. », bouclier, pictogramme, deux cartes « TU AS DIT / EN RÉALITÉ » en capitales, bouton bleu, bouton en pointillés rouges, ombre, rayons de 10 à 14 px. Il ne pose pas la question et affiche une phrase que la personne n'a pas écrite (« Je signe un simple message »). | `bridge.js:116-152` | Le remplacer par le même écran que la fenêtre (`ui/screen.css` + `ui/screen.js` dans le shadow DOM), ou supprimer le réglage et refuser la demande si la fenêtre ne s'ouvre pas. |

### Panneau latéral

| # | Gravité | Capture | Description | Fichier et ligne | Correction |
|---|---|---|---|---|---|
| P1 | gênant | `unitaires/panneau_rempli_clair_100.png` | Noms de niveau montrés (« Danger », « Manipulation », « Attention »). DESIGN v5 § 7 l'interdit. La fenêtre dit « correspond / ne correspond pas », le panneau parle une autre langue. | `ui/sidepanel.js:8`, `:83` | « Ne correspondait pas. Annulée. », « Correspondait. Continuée. », « Non vérifiée. Annulée. » |
| P2 | gênant | idem | Le rouge couvre des lignes entières, plusieurs fois par écran. La règle est une fois, sur la phrase du verdict. | `ui/sidepanel.css:20`, `:29` | Rouge sur les seuls mots « Ne correspondait pas. », en gras. Reste en encre-2. |
| P3 | gênant | idem | Message de développeur : « se voit avec tools/verify_journal.mjs », « Exporter le journal (JSON) », « le fournisseur du portefeuille n'a pas pu être entouré ». | `ui/sidepanel.js:71`, `:95`, `:101` | « Le journal garde la trace de chaque décision. Il ne contient ni ta phrase ni d'adresse. » Bouton « Exporter le journal ». « Sur {site}, Hold up n'a pas pu se placer devant le portefeuille. Des demandes peuvent passer sans vérification. » |
| P4 | gênant | idem | « Effacer l'historique » efface tout de suite, sans confirmation ni retour en arrière. Il efface aussi le journal chaîné. | `ui/sidepanel.js:93-94` | Deuxième clic de confirmation dans le bouton (« Effacer pour de bon ? » pendant 4 s). |
| P5 | gênant | idem | Tuiles de chiffres « 9 demandes vérifiées / 4 annulées » : gabarit de tableau de bord. `127.0.0.1:8793` affiché brut alors que la fenêtre dit « ce site ». | `ui/sidepanel.css:14-15`, `ui/sidepanel.js:22-33`, `:74` | Supprimer les compteurs. Utiliser `siteName()` de `outcome.js`. |
| P6 | finition | `planche_panneau.png` | Chaque changement du journal vide et redessine tout le panneau (perte du défilement et du focus). Liste à puces de trois lignes « Comment ça marche » à chaque ouverture. | `ui/sidepanel.js:57-66`, `:113` | Insérer la nouvelle ligne en tête. Déplacer « Comment ça marche » dans l'écran de bienvenue. |
| P7 | finition | idem | À 150 %, le bouton « Exporter le journal (JSON) » passe sur deux lignes. | `ui/sidepanel.css:25` | Libellé court, `white-space:nowrap`. |

### Page de réglages

| # | Gravité | Capture | Description | Fichier et ligne | Correction |
|---|---|---|---|---|---|
| O1 | bloquant | `planche_reglages.png` | La version livrée (autonome) a une autre page que la version v5 : boutons en pilule de 50 px, noir pur, `system-ui`, **aucun thème sombre** (page blanche en sombre). La case « Limiter le droit » n'y est pas. | `extension_standalone/src/options.html:3` | Une seule page pour les deux versions. Supprimer la copie de `src/` et construire depuis `extension/options.html`. |
| O2 | bloquant | idem | La page dit « Le seul appel réseau possible va vers le relais local 127.0.0.1:8789 ». Le manifeste dit `connect-src 'none'` et le panneau dit « Aucune connexion réseau ». Deux affirmations contraires dans le produit. | `extension_standalone/src/options.html:5`, `:13` | « Hold up fonctionne sans connexion. Ta phrase ne quitte pas ton ordinateur. » |
| O3 | gênant | `unitaires/reglages_erreur_clair.png` | Erreur en anglais sortie du moteur JavaScript : « Contexte JSON invalide : Expected property name or '}' in JSON at position 1 ». | `options.js:39` | « Le carnet d'adresses n'est pas lisible. Rien n'a été enregistré. » |
| O4 | gênant | `planche_reglages.png` | Une personne doit écrire du JSON à la main pour son carnet d'adresses. Le journal est affiché en JSON brut. « Durées de démo » est un bouton de développeur. | `src/options.html:19`, `:25-28`, `options.js:30` | Liste de contacts (nom, adresse, bouton Ajouter). Journal lisible, le même que le panneau. Retirer les boutons de démo du produit livré. |
| O5 | finition | `planche_reglages_serveur.png` | Version v5 : « Limiter moi-même le droit au montant que tu as écrit ». Deux personnes dans la même phrase. Aucune confirmation durable après Enregistrer. Une valeur hors bornes est corrigée sans le dire. | `extension/options.html:57`, `options.js:5`, `:38` | « Limiter le droit au montant que j'ai écrit ». Enregistrer à chaque changement, ligne « Enregistré » 2 s. |

### Ensemble

| # | Gravité | Description | Fichier et ligne | Correction |
|---|---|---|---|---|
| E1 | bloquant | Aucune icône. La barre d'outils montre la lettre grise par défaut de Chrome. | `extension_standalone/src/manifest.json:12` (pas de clé `icons`) | Brancher `docs/design/system/logo/icon16/32/48/128.png` dans `icons` et `action.default_icon`. |
| E2 | bloquant | Nom et description livrés : « Hold up (autonome) », « retient les demandes sensibles et explique en clair. Moteur embarque. Aucun acces reseau. » Sans accents, avec du jargon. | `extension_standalone/src/manifest.json:3-5` | « Hold up » ; « Écris ce que tu veux faire. Hold up te dit si la demande de signature correspond. » |
| E3 | gênant | Sans réglage, un jeton inconnu donne « Je ne connais pas ce jeton » et 30 s d'attente, même sur une opération honnête. | `written_check.js:156-167` | Liste de jetons livrée plus large, et lecture du symbole sur la chaîne quand c'est possible. |

Ce qui marche bien, à garder : aucun plantage, aucune erreur de console sur les pages ni le service worker (seul le favicon du site de démo répond 404, hors extension). Fermer par la croix annule. Recharger le site ferme la fenêtre. Les clics répétés n'ouvrent pas de deuxième fenêtre. Continuer inactif refuse le clic et Entrée. Le focus arrive au bon endroit (champ, puis Annuler). Les contrastes de texte sont bons. Le compte à rebours ne fait pas bouger la mise en page.

## Contraste (WCAG 2.x, calculé sur les couleurs rendues)

| Paire | Clair | Sombre | Verdict |
|---|---|---|---|
| Encre sur fond | 17,93 | 15,87 | AAA |
| Encre-2 sur fond (exemple, note 13 px, délai 14 px) | 6,69 | 7,37 | AA |
| Signal sur fond (titre 24 px, lignes 13 px du panneau) | 5,52 | 6,85 | AA |
| Texte du bouton plein | 17,93 | 15,87 | AAA |
| Texte du bouton plein inactif sur gris | 6,13 | 6,53 | AA |
| Bord d'un bouton discret actif | 3,36 | 4,33 | 3:1 respecté |
| Bord d'erreur du champ | 5,52 | 6,85 | passe, mais couleur seule |
| Bord du bouton plein inactif | 1,09 | 1,13 | forme perdue (F15) |
| Bord du bouton discret inactif, champ en lecture seule | 1,26 | 1,31 | forme perdue (F15) |
| Réglages livrés : bord des champs `#767676` sur blanc | 4,54 | page blanche | thème sombre absent (O1) |

## Clavier

| Vérification | Résultat |
|---|---|
| Focus à l'ouverture | Sur le champ. |
| Tab, question | Champ, Annuler, Vérifier (inactif, atteignable), puis retour au champ. Maj+Tab inverse. |
| Entrée, champ rempli | Envoie. Maj+Entrée va à la ligne. |
| Entrée, champ vide | Bord rouge, pas de message (F8). |
| Espace sur Vérifier | Envoie. |
| Échap | Annule à chaque écran. |
| Focus sur la réponse | « Correspond » avec bouton : Continuer. Sinon : Annuler. |
| Entrée sur Continuer inactif | Refusé. |
| Focus visible | Contour encre 2 px, décalage 2 px, sur tous les boutons, y compris inactifs. |
| Piège de focus | Le focus reste dans la fenêtre (un passage par le document). |
| Rappel des touches à l'écran | Absent (F16). |
| Panneau | Exporter, Réglages, Effacer : trois arrêts, ordre logique. Aucun arrêt sur les lignes du journal. |
| Réglages | Ordre du document, correct. |

## Animations

### Inventaire complet

| Fichier et ligne | Élément | Propriété | Durée | Courbe |
|---|---|---|---|---|
| `ui/screen.css:64` | champ | `border-color`, `box-shadow` | 120 ms | ease-out |
| `ui/screen.css:92` | bouton | `background-color`, `border-color`, `color` | 120 ms | ease-out |
| `ui/sidepanel.css:25` | bouton du panneau | `background-color`, `border-color` | 120 ms | ease-out |
| `extension/options.html:15`, `:26` | champs et boutons (version v5 seulement) | `border-color`, `background-color` | 120 ms | ease-out |
| `extension_standalone/src/options.html` | page livrée | aucune | | |
| `ui/screen.js:107` | compte à rebours | texte remplacé (minuteur de 250 ms) | coupe | |
| `ui/screen.js:91` | envoi automatique après « correspond » | minuteur de 1000 ms | coupe | |
| `window.js:23` | fermeture après message | minuteur de 900 ms, jamais atteint (F4) | coupe | |

Aucun `@keyframes`, aucune `animation`, aucun `transform`, aucun `opacity` animé. Aucune propriété de mise en page animée (ni largeur, ni hauteur, ni marges, ni top/left). Seul point coûteux : `box-shadow` animé sur le champ (`screen.css:64`), sans effet mesurable. `prefers-reduced-motion` : les transitions passent bien à 0 s (`screen.css:113`, mesuré). Il n'y a pas d'alternative pensée, parce qu'il n'y a pas de mouvement.

### Mesures

Compteur `requestAnimationFrame` et observateurs de performance dans la page de la fenêtre. Écran à 144 Hz. Une image perdue est un intervalle supérieur à 1,5 fois la médiane (6,9 ms).

| Transition | Durée réelle | Images perdues | Plus longue image | Saut de mise en page | Constat |
|---|---|---|---|---|---|
| Ouverture de la fenêtre (1re) | première peinture à 88-148 ms, contenu à 144-176 ms | 6 à 8 sur la première seconde | 48,5 à 62,5 ms | 0 | Fenêtre vide pendant 16 à 84 ms, puis le contenu apparaît d'un coup. Une tâche longue de 60 ms (chargement). |
| Ouverture de la 2e fenêtre | contenu à 58-68 ms | 0 | 7,1 ms | 0 | Coupe sèche. |
| Entrée → « Vérification… » | 3 à 4 ms | 0 | 7,7 ms | 0 | Immédiat, bien. |
| « Vérification… » → verdict | 20 à 22 ms après Entrée | 0 | 7,2 à 7,7 ms | 0 | Trop court pour être lu : clignotement (F5). Aucune transition. |
| Apparition de la ligne d'explication | même image que le titre | 0 | | 0 | Aucune transition, aucune hiérarchie dans le temps. |
| Compte à rebours (3,2 s observées) | une mise à jour toutes les 1000 ms ± 6 | 0 sur 461 | 7,3 à 7,9 ms | 0 | Stable. Chiffres tabulaires, largeur fixe. |
| Fin du délai (Continuer s'active) | 1 image | 0 sur 86 | 7,5 ms | 0 | La ligne disparaît, rien ne la remplace (F10). |
| Fermeture automatique (« correspond ») | 1036 ms après Entrée | 0 | 7,5 ms | | La fenêtre disparaît avec le verdict encore affiché. Message de fin jamais vu. |
| Fermeture après Annuler / Échap | 43 à 48 ms | | | | Claquement (F4). |
| Fermeture après Continuer | 29 ms | | | | Claquement (F4). |
| Survol et appui des boutons | 120 ms | 0 | | 0 | Correct. |

Films : `film_ouverture_sombre.png`, `film_verdict_sombre.png`, `film_fenetre2_sombre.png` (images extraites de l'enregistrement à 25 images par seconde). On y voit : pas de flash blanc en sombre, aucune image intermédiaire entre deux écrans, dernière image avant fermeture = le verdict.

**État réel en une phrase : rien ne saccade, parce que rien ne bouge.** Le seul défaut de fluidité mesuré est à l'ouverture (jusqu'à 62,5 ms pour une image, 6 à 8 images perdues).

### Spécification cible

À rapprocher de `docs/design/system/MOTION.md` quand il existera. Courbe d'arrivée : `cubic-bezier(0.16, 1, 0.3, 1)`. Courbe standard : `cubic-bezier(0.2, 0, 0, 1)`. Seulement `opacity` et `transform`. La direction « Le gant » est faite de coupes franches : peu de mouvement, court, un seul moment dessiné.

| Transition | Propriété | Durée | Courbe | Délai | Mouvement réduit |
|---|---|---|---|---|---|
| Ouverture | Contenu prêt dès la première peinture (la question arrive dans l'URL de la fenêtre, pas par un aller-retour). `opacity` 0 → 1 sur la colonne. | 140 ms | standard | 0 | aucune animation |
| Bande d'en-tête | fixe, jamais animée | | | | |
| Entrée → attente | Libellé du bouton changé sans changer sa largeur. État montré seulement après 150 ms, gardé 300 ms au minimum. | | | 150 ms | identique |
| Question → verdict, sortie | `opacity` 1 → 0 de la colonne | 80 ms | ease-in | 0 | coupe |
| Question → verdict, entrée du titre | `opacity` 0 → 1, `translateY(6px)` → 0 | 200 ms | arrivée | 0 | `opacity` seule, 120 ms |
| Ligne d'explication | `opacity` 0 → 1, `translateY(4px)` → 0 | 180 ms | arrivée | 60 ms | `opacity` seule |
| Ligne « droit limité », phrase écrite | idem | 180 ms | arrivée | 120 ms (plafond) | `opacity` seule |
| **Le gant sur « ne correspond pas » (moment unique)** | `opacity` 0 → 1 et `scale(0.9)` → 1, origine en bas | 240 ms | arrivée | 0, le titre suit à 80 ms | `opacity` seule, 120 ms |
| Compte à rebours | chiffre remplacé sans mouvement | | | | identique |
| Fin du délai | ligne basse : fondu croisé vers « Tu peux continuer. » ; bouton : `color`, `border-color` | 160 ms | standard | 0 | coupe |
| Boutons survol | `background-color` | 120 ms | standard | 0 | 0 ms |
| Boutons appui | `transform: scale(0.98)` | 80 ms | standard | 0 | aucun |
| Champ, focus | `outline-offset` 0 → 3 px | 100 ms | standard | 0 | 0 ms |
| Fermeture | message de fin affiché 600 ms, puis `opacity` 1 → 0 | 100 ms | ease-in | 600 ms | message 600 ms, coupe |
| Interrupteur (popup) | `transform: translateX(18px)` | 160 ms | standard | 0 | 0 ms |
| Panneau, nouvelle ligne | `opacity` 0 → 1 sur la ligne insérée | 160 ms | standard | 0 | coupe |

Budget : aucune réponse à une action au-delà de 300 ms, aucune image au-delà de 16,7 ms pendant une transition, saut de mise en page à 0.

## Écart avec la direction choisie (« Le gant », `pistes/piste_3.html`)

Le coordinateur a indiqué en cours d'évaluation que le fondateur a retenu la piste 3. Au moment de la lecture, `docs/design/system/` contenait `tokens.css`, `components.css`, le logo et les trois pistes ; `DESIGN.md` et `MOTION.md` n'existaient pas encore. **Attention : `tokens.css` (rayon 6 px, bord 1 px, graisse 600 au plus) ne correspond pas encore à la piste 3 (rayon 0, bord 2 px, graisse 700).** À réconcilier avant que les autres agents ne s'en servent.

| Sujet | Livré aujourd'hui | Direction « Le gant » | Fichiers à changer |
|---|---|---|---|
| Fond de la fenêtre | blanc en clair, `#131313` en sombre | toujours noir `#000`, texte blanc, quel que soit le thème | `ui/screen.css:9-32`, `window.css:3-4`, `window.html:5` |
| Autres surfaces | mêmes gris que la fenêtre | blanches (noires en sombre) sous une bande noire | `ui/sidepanel.css`, `options.html` |
| Couleurs | encre `#171717`, gris `#5c5c5c`, `#8c8c8c`, `#e5e5e5`, signal `#c9281c` / `#ff7061` | noir `#000`, blanc, gris `#555` / `#b0b0b0`, filet doux `#d6d6d6` / `#3a3a3a`, signal `#c4221a` / `#ff6b5e` | jetons de `ui/screen.css:9-16`, `ui/sidepanel.css:3-5` |
| Bande d'en-tête | aucune (v5 interdisait la marque dans la fenêtre) | 48 px, noire, gant + « Hold up » en 700, site à droite en 13 px avec ellipse | `ui/screen.js:37-42` (à ajouter), `ui/sidepanel.js:67`, réglages |
| Titre | 24/30, graisse 400, centré | 30/34, graisse 700, approche -0,02em, aligné à gauche | `ui/screen.css:45-50` |
| Texte | 16/24 centré, notes 13 px | 17/24 à gauche, deuxième phrase en gras, notes 14/20 | `ui/screen.css:53-56` |
| Champ | bord 1 px, rayon 8, 96 px, focus par double bord | bord 2 px, rayon 0, 108 px, 18/26, focus par contour 2 px décalé de 3 px, erreur par bord 4 px + phrase en gras | `ui/screen.css:60-71`, `ui/screen.js:59` |
| Boutons | bord 1 px gris, rayon 8, graisse 500 | bord 2 px encre, rayon 0, graisse 700, 40 px | `ui/screen.css:89-101`, `ui/sidepanel.css:25` |
| Rayons | 8 px | 0 partout | tous les CSS |
| Filets | aucun dans la fenêtre, 1 px gris dans le panneau | filet 2 px encre sous chaque titre de section, 1 px doux entre les lignes | `ui/sidepanel.css:16-17`, réglages |
| Moment du gant | absent | le gant se lève une seule fois, au-dessus du titre rouge de « ne correspond pas » ; nulle part ailleurs | `ui/screen.js:73-78`, `ui/screen.css`, logo `logo_mono_blanc.svg` |
| Phrase écrite rappelée | absente | « Ta phrase : « échanger 50 USDC contre AVAX » » sous l'explication | `ui/screen.js:answer`, `gatekeeper.js` (passer le texte à l'écran) |
| Droit limité | ligne grise sous un titre rouge | sous « Ça correspond », phrase complète en gris | F1 |
| Aide clavier | absente | « Entrée vérifie. Échap annule. » en 12 px sous les boutons | `ui/screen.js` |
| « Correspond » | Annuler seul, envoi automatique après 1 s | Annuler + Continuer, « Entrée continue. » À trancher : l'envoi automatique reste-t-il ? | `ui/screen.js:88-95`, `gatekeeper.js:63`, `:396` |
| Panneau | titre, version, compteurs, journal avec niveaux, puces, trois boutons empilés | bande, « Dernières vérifications » (site en gras, heure à droite, verdict en mots), « Droits accordés » avec Révoquer, deux boutons côte à côte | `ui/sidepanel.js`, `ui/sidepanel.css`, `revoke.js` à brancher |
| Réglages | formulaire, JSON brut | pas encore dessinés dans la piste 3 : à demander à l'agent du système | `options.html`, `src/options.html` |
| Popup de barre d'outils | n'existe pas | 320 px, interrupteur « Actif sur ce site », dernière vérification, deux boutons | à créer, `manifest.json` (`action.default_popup`) |
| Bienvenue | n'existe pas | coupe franche, gant sur noir à gauche (400 px), titre 44/46 en 700, « Ce qu'il ne fait pas », « Pour l'essayer » | à créer, `background.js` (`chrome.runtime.onInstalled`) |
| Icônes | aucune | main gantée blanche sur noir, 16 / 32 / 48 / 128 | `manifest.json` |
| Repli dans la page | style v4 rouge | même écran que la fenêtre, ou supprimé | `bridge.js:116-152` |

Risque à surveiller sur cette direction, déjà noté dans la piste : le gras partout pèse dans un panneau ouvert tous les jours, et la fenêtre noire en thème clair doit rester lisible à côté d'un site blanc (bord de fenêtre du système). Le contraste gris `#b0b0b0` sur noir est de 9,7:1, le signal `#ff6b5e` sur noir de 7,5:1 : correct.

## Ce qui manque pour une vraie application

N'existe pas du tout (vérifié dans le manifeste et par ouverture directe des adresses) :
1. Icônes de l'extension (`icons`, `action.default_icon`). Le logo est prêt dans `docs/design/system/logo/`, il n'est pas branché.
2. Popup de barre d'outils (`action.default_popup`). Le clic ouvre le panneau latéral.
3. Écran de bienvenue à l'installation (`chrome.runtime.onInstalled` absent).
4. Pastille sur l'icône (demande en attente, dernier verdict). Les couleurs sont prévues dans `tokens.css`, rien ne les utilise.
5. Pause par site, pause générale.
6. Révocation depuis le panneau (`revoke.js` existe dans la démo web, pas dans le panneau).
7. Raccourci clavier pour ouvrir le panneau (`commands`).
8. Page « à propos » : version, confidentialité, contact.

Existe mais n'est pas au niveau :
9. Une seule page de réglages, sans JSON, avec thème sombre.
10. Un état « Hold up ne peut pas agir sur cette page » (pages internes du navigateur, autre profil).
11. Un repli propre si la fenêtre ne s'ouvre pas.
12. Les messages de fin, visibles.
13. Le mouvement (section précédente).
14. Le nom, la description et le paquet (`extension_standalone/extension/` à reconstruire).
15. Un essai sans risque depuis l'écran de bienvenue (« Ouvrir la page d'essai »).
16. Textes prêts pour une autre langue (`default_locale` absent, tout est en dur dans le JS).

## Liste de contrôle pour la prochaine évaluation

Outils rejouables : `coord/reports/eval_design_1/mesures/` (`flow.mjs`, `static.mjs`, `bugs.mjs`, `overlay.mjs`, `sheet.mjs`, `lib.mjs`). Chemins à adapter en tête de `lib.mjs`.

Avant de mesurer
- [ ] Le dossier construit est identique aux sources (`BUILD_INFO.json` à jour).
- [ ] `DESIGN.md`, `tokens.css`, `components.css`, `MOTION.md` disent la même chose que la piste 3 (rayon 0, bord 2 px, graisse 700, fenêtre noire).

Direction « Le gant »
- [ ] Fenêtre noire en thème clair et en thème sombre.
- [ ] Bande de 48 px avec le gant, « Hold up » et le site, sur chaque surface.
- [ ] Rayon 0 partout. Bords de 2 px sur champs et boutons. Filets de 2 px sous les titres de section.
- [ ] Titres en 700, alignés à gauche. Aucun texte centré.
- [ ] Le gant levé apparaît une fois : sur « ne correspond pas ». Nulle part ailleurs dans la fenêtre.
- [ ] Le rouge apparaît une fois par écran, sur les mots du verdict négatif.
- [ ] Aucun vert, aucun bouclier, aucun cadenas, aucun pictogramme d'alerte, aucun nom de niveau.

Hiérarchie et textes
- [ ] Verdict lu en une seconde à 1 m de l'écran.
- [ ] Chaque ligne est une phrase avec un verbe et un point.
- [ ] Aucun mot de développeur : modèle, JSON, .mjs, fournisseur, adresse IP, message d'erreur en anglais.
- [ ] Une seule voix (« je » pour Hold up, « tu » pour la personne).
- [ ] « Pas pu vérifier » n'est jamais suivi d'une phrase rassurante.
- [ ] Le droit limité est dit en une phrase complète, sous le bon titre.
- [ ] Nom, description et titres de fenêtre avec accents.

Mise en page (à 100 % puis à 150 %, clair puis sombre)
- [ ] Aucun des 15 états ne défile (`scrollHeight <= clientHeight`), y compris les deux adresses.
- [ ] Aucune barre de défilement native, aucune double barre.
- [ ] Nom de site de 80 caractères : pas de coupure au milieu d'un mot.
- [ ] Phrase de 500 caractères dans le champ : lisible, barre thémée.
- [ ] Boutons sur une ligne à 150 %.

Contraste
- [ ] Tout texte à 4,5:1 au moins. Bords de contrôle actifs à 3:1 au moins.
- [ ] Un bouton inactif garde une forme visible.
- [ ] Chaque surface a son thème sombre.

Clavier
- [ ] Focus sur le champ à l'ouverture, sur Annuler après un verdict négatif.
- [ ] Tab et Maj+Tab restent dans la fenêtre. Entrée, Maj+Entrée, Espace, Échap.
- [ ] Champ vide : message écrit, annoncé, sans rouge.
- [ ] Rappel des touches visible.
- [ ] Contour de focus de 2 px visible sur fond noir et sur fond blanc.

États
- [ ] Survol, appui, focus, inactif pour chaque contrôle.
- [ ] Attente : absente sous 150 ms, sinon visible 300 ms au moins.
- [ ] Fin de délai : « Tu peux continuer. » visible.
- [ ] Messages de fin visibles 600 ms.
- [ ] Panneau vide, panneau plein (20 lignes), site long, interception partielle.
- [ ] Effacer demande une confirmation.

Animations (mesurer, ne pas estimer)
- [ ] Inventaire : seulement `opacity` et `transform`.
- [ ] Ouverture : contenu à la première peinture, aucune image de plus de 16,7 ms, 0 image perdue.
- [ ] Question → verdict : entre 150 et 300 ms au total, 0 image perdue, saut de mise en page à 0.
- [ ] Le gant : 240 ms, une fois, pas de rebond.
- [ ] Fermeture : message puis fondu, jamais de claquement sous 100 ms.
- [ ] `prefers-reduced-motion` : plus de déplacement, les fondus courts restent.
- [ ] Film de chaque transition, images extraites et regardées.

Bugs
- [ ] Une seule fenêtre par intention (scène honnête : une fenêtre, pas deux).
- [ ] Croix, Échap, Annuler, rechargement du site, clics répétés, deux onglets : état du site cohérent.
- [ ] Continuer refusé avant la fin du délai, à la souris et au clavier.
- [ ] Console vide sur chaque page et sur le service worker.

Surfaces présentes
- [ ] Icônes 16 / 32 / 48 / 128 visibles dans la barre d'outils et la page des extensions.
- [ ] Popup, bienvenue, panneau, réglages, fenêtre : même bande, mêmes jetons, mêmes mots.
- [ ] Le repli dans la page est conforme ou supprimé.

## Captures

Dossier `coord/reports/eval_design_1/`.

- `planche_fenetre_clair_100.png`, `planche_fenetre_sombre_100.png`, `planche_fenetre_clair_150.png`, `planche_fenetre_sombre_150.png` : les 15 états de la fenêtre.
- `planche_flux_reel.png` : captures du flux réel (question, saisie, piège, permit, relance, pas pu vérifier, correspond, délai terminé).
- `planche_etats.png` : survol, appui, focus, inactif.
- `planche_panneau.png` : panneau vide, plein, sombre, 150 %, focus.
- `planche_reglages.png` (version livrée), `planche_reglages_serveur.png` (version v5).
- `planche_repli.png` : repli dans la page.
- `film_ouverture_sombre.png`, `film_verdict_sombre.png`, `film_fenetre2_sombre.png` : images extraites des films.
- `unitaires/` : captures citées dans les tableaux.
- `mesures/` : journaux JSON de chaque scène et scripts.

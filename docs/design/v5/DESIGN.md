# Hold up : système de design v5

Version 5, 11 oct. 2026. Remplace v4. Surface concernée : la fenêtre de l'extension (`research/titouan/T_banc_e2e/extension/ui/screen.css`, `screen.js`). Les planches de `boards/` sont ce code, dessiné avec des données fixes.

## 1. Ce que fait l'interface

Deux moments, rien d'autre à l'écran.

1. Une question, un champ libre : la personne écrit ce qu'elle veut faire.
2. Une réponse : la demande correspond à sa phrase, ou non, ou n'a pas pu être vérifiée. Une ligne dit ce que la demande fait vraiment. Annuler ou Continuer.

Public : une personne pressée, parfois au téléphone avec un escroc. Elle lit une phrase, pas un tableau de bord.

## 2. Sources

Lues le 11 oct. 2026 sur styles.refero.design (fiches Vercel, Figma, Notion, Wise, Mercury). Trois sont retenues, Mercury (sombre) et Notion (cartes colorées) sont écartées.

| Source | Ce qu'on prend | Ce qu'on laisse |
|---|---|---|
| Figma | Mur blanc, un seul accent une fois par vue, grand titre en graisse légère, hiérarchie par l'espace et l'échelle | Pilule 50 px, indigo, couleurs d'illustration |
| Vercel | Encre `#171717` au lieu du noir pur, gris limités à deux, aucune ombre portée, graisses de 400 à 500, coins nets | Eyebrows en mono capitales, dégradé spectre, vert |
| Wise | Champ : bord 1 px, rayon proche de 10 px, bord encre au focus ; un bouton plein à côté d'un bouton discret, jamais deux pleins | Vert forêt, lime, titres en 900 |

Points communs gardés : peu de couleurs, un accent utilisé une fois, pas d'ombre, pas d'ornement, bords fins.

## 3. Couleurs

Six jetons. Un seul est chromatique.

| Jeton | Clair | Sombre | Rôle |
|---|---|---|---|
| `--hu-bg` | `#ffffff` | `#131313` | Fond de la fenêtre |
| `--hu-ink` | `#171717` | `#ededed` | Texte, bouton plein, bord au focus |
| `--hu-ink-2` | `#5c5c5c` | `#a3a3a3` | Ligne de délai, note, exemple du champ, caractères identiques d'une adresse |
| `--hu-line` | `#e5e5e5` | `#2b2b2b` | Bord d'un contrôle inactif |
| `--hu-edge` | `#8c8c8c` | `#7a7a7a` | Bord d'un contrôle actif (3,4:1 au minimum) |
| `--hu-signal` | `#c9281c` | `#ff7061` | La phrase « Ça ne correspond pas à ce que tu as écrit. », et rien d'autre |

Règles :
- Le signal apparaît une fois par écran, sur la phrase de réponse. Jamais sur un bouton, un bord ou un fond.
- « Ça correspond » s'écrit en encre. Jamais de vert, jamais le mot « sûr ».
- « Je n'ai pas pu vérifier » s'écrit en encre aussi : ce sont les mots qui portent l'état.
- Contrastes : encre 17,9:1, encre-2 6,7:1, signal 5,6:1 (clair) ; 15,6:1, 7,3:1, 7,1:1 (sombre).

## 4. Typographie

Aucune police téléchargée : l'extension fonctionne hors ligne et ne charge rien.

- Texte : `"Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Roboto, sans-serif`
- Titre : même pile, `"Segoe UI Variable Display"` en tête (dessin optique grand corps sous Windows 11 ; San Francisco fait le même travail sous macOS).
- Adresses : `"Cascadia Mono", "SF Mono", ui-monospace, Consolas, "Roboto Mono", monospace`, chiffres tabulaires, zéro barré. Le mono sert aux adresses, à rien d'autre.

| Rôle | Taille / interligne | Graisse | Détail |
|---|---|---|---|
| Titre (question, réponse) | 27 / 1,22 (24 sous 400 px) | 400 | approche -0,015em, `text-wrap: balance` |
| Ligne de preuve, champ | 17 / 1,5 | 400 | `text-wrap: pretty` |
| Bouton | 16 / 1,2 | 500 | |
| Ligne discrète (délai, état) | 15 / 1,45 | 400 | encre-2, chiffres tabulaires |
| Note, libellé d'adresse | 13 / 1,4 | 400 | encre-2 |
| Adresse | 16 / 1,5 mono | 400, 700 pour ce qui diffère | |

Quatre tailles de texte et un titre. Pas de capitales, pas d'italique.

## 5. Espacement, rayons, fenêtre

- Échelle : 4, 8, 12, 16, 24, 32, 48.
- Fenêtre : 440 × 540 (intérieur environ 424 × 501). Colonne de 360 px au plus, centrée. Marge haute 48, côtés 32 (20 sous 400 px).
- Rayons : 8 px pour le champ et les boutons. Rien d'autre n'est arrondi.
- Aucune ombre, aucun dégradé, aucun filet de séparation.

## 6. Composants

Il y en a six.

1. **Fenêtre.** Fond uni. Le contenu en haut, les actions en bas.
2. **Champ de la question.** Zone de texte de trois lignes, bord 1 px `--hu-edge`, encre au survol, bord encre doublé au focus. Entrée valide, Maj+Entrée va à la ligne. L'exemple (« Par exemple : échanger 50 USDC contre AVAX ») est un exemple, le titre est le libellé.
3. **Bouton plein.** Fond encre, 48 px de haut. Un seul par écran.
4. **Bouton discret.** Bord 1 px, fond transparent. Inactif : texte encre-2, bord `--hu-line`.
5. **Ligne de preuve.** Une phrase, tirée des textes du moteur, corrigée à l'affichage (`outcome.js`, `cleanLine`).
6. **Comparaison de deux adresses.** Seulement quand deux adresses se confondent. Chaque adresse sur 2 rangées de 5 groupes de 4 caractères. Ce qui diffère est en encre et en gras ; ce qui est identique (ce que copie une adresse sosie) reste en encre-2.

Place des boutons : Annuler toujours à gauche, l'action qui avance toujours à droite. Seul le poids change : Vérifier et Continuer sont pleins quand la suite est attendue, Annuler devient plein dès que la réponse est « ne correspond pas » ou « pas pu vérifier ».

## 7. Mots

| État | Texte exact |
|---|---|
| Question | « Que veux-tu faire sur {site} ? » (« sur ce site » pour une adresse locale) |
| Vérification | « Je compare ta phrase à la demande. », bouton « Vérification… » |
| Correspond | « Ça correspond à ce que tu as écrit. » |
| Ne correspond pas | « Ça ne correspond pas à ce que tu as écrit. » |
| Pas pu vérifier | « Je n'ai pas pu vérifier cette demande. » |
| Délai | « Continuer sera possible dans 24 s. » |
| Sans modèle | « intention classée sans modèle » |
| Boutons | « Annuler », « Vérifier », « Continuer » |

Tutoiement. Aucun mot de la blockchain. Aucun nom de niveau montré à la personne.

## 8. Mouvement

Presque aucun : 120 ms sur le bord du champ et le fond des boutons. Le délai est une ligne de texte qui change chaque seconde, sans cadran ni barre. `prefers-reduced-motion` coupe les transitions.

## 9. Accessibilité

Focus visible (contour encre 2 px), Échap annule, focus posé sur le champ puis sur Annuler (sur Continuer seulement quand la réponse est « correspond »). Le bouton en attente reste atteignable (`aria-disabled`), la fin du délai est annoncée une fois. L'état n'est jamais porté par la couleur seule : la phrase le dit, et le bouton plein change de côté.

## 10. Ce que nous ne faisons pas

- Dégradés, verre dépoli, lueurs, ombres.
- Cartes, cartes dans des cartes, bordure colorée sur un côté.
- Icônes dans un rond, pictogrammes d'alerte, emoji, bouclier, cadenas.
- Pastilles, étiquettes de niveau (« Danger », « Attention »), eyebrow au-dessus d'un titre.
- Tuiles de chiffres, compteurs mis en scène, minuteur en grand, barre de progression.
- Vert pour rassurer, orange pour avertir, deuxième couleur d'accent.
- Explications empilées, « Pourquoi ? » dépliable, liste de raisons.
- Phrase à retaper, questions en série, choix multiples.
- Titre de marque dans la fenêtre, texte qui parle de Hold up.
- Rayons de pilule, tout arrondi, tout centré dans une carte.
- Police téléchargée, CDN, image.

## 11. Révision du 11/10 (bureau seulement)

Cible : fenêtre d'extension de navigateur de bureau, 440 × 540 fixe, clavier d'abord. Aucune mise en page mobile. Aucun changement de texte ni de classe : seuls `ui/screen.css`, `window.html`, `window.css`, `options.html` bougent.

Ce qui change :
- Tailles de bureau : texte 16 (au lieu de 17), titre 24 / 1,25 (27), bouton 15 et 40 px de haut (48), ligne de délai 14, adresse 15. Marge haute 40.
- Requête de conteneur sur la largeur retirée (plus de variante étroite). Celle sur la hauteur reste.
- Bouton inactif : ni survol ni appui. Appui actif ajouté. Mode contraste forcé géré.
- Erreur du champ : `aria-invalid="true"` ou `.is-error` met le bord en signal. Le JS ne la pose pas encore (champ vide : le focus revient au champ). À brancher par l'autre agent si on veut la montrer.
- `window.html` : méta `color-scheme` à la place du viewport mobile, pas de flash blanc en sombre.
- Page options : mêmes jetons, clair et sombre, boutons à 8 px (plus de pilule), champs à bord 1 px, focus encre, erreur `:user-invalid`, journal en mono discret, indications reliées par `aria-describedby`. Aucun identifiant changé.

Contrastes calculés (WCAG 2.x) :

| Paire | Clair | Sombre |
|---|---|---|
| Encre sur fond | 17,93 | 15,87 |
| Encre-2 sur fond (exemple, délai, note) | 6,69 | 7,37 |
| Encre-2 sur survol (bouton plein inactif) | 6,13 | 6,53 |
| Signal sur fond (phrase, bord d'erreur) | 5,52 | 6,85 |
| Bord de contrôle sur fond | 3,36 | 4,33 |
| Texte du bouton plein sur encre | 17,93 | 15,87 |
| Bord inactif sur fond (exempté, non porteur) | 1,26 | 1,31 |

Les quatre états : question (champ libre, exemple en encre-2), correspond (phrase en encre, seul Annuler, ouverture du portefeuille après 1 s), ne correspond pas (phrase en signal, Annuler plein, Continuer discret et inactif jusqu'à la fin du délai), pas pu vérifier (phrase en encre, Annuler plein, Continuer discret).

Captures du 11/10 dans `captures/` (préfixe `2026-10-11_`), rendues par `ui/screen.js` avec des données fixes dans le navigateur intégré.

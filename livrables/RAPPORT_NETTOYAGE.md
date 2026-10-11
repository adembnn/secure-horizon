# Rapport de nettoyage documentaire (11 oct. 2026)

Aucun code touché, aucun commit, aucun `.env`. Le dossier `docs/design/v5/` n'a pas été touché.

## 1. PRODUCT.md réécrit
Une page pour le produit figé : problème, produit, ce qu'il fait et ne fait pas, positionnement par rapport à MetaMask (D-009), modèle (gratuit puis partenaires, mis en parenthèse), limites, principes, historique des décisions court. Retirés : démo sur Fuji, Snap comme chemin critique, barrière d'intention à choix, attente de 10 min et de 30 s, carnet d'adresses. Le journal chaîné par hachage est dit « version serveur seulement ». Fuji : « chaîne locale pour la démo, Fuji à décider ». Le marqueur `impeccable:product-schema` est conservé, mais les titres de section sont maintenant en français (l'ancien fichier utilisait des titres anglais : à vérifier si un outil les lit).

## 2. coord/DECISIONS.md
Quatre lignes ajoutées en fin de fichier, auteur `titouan`, date `2026-10-11T09:30+02:00` : D-010 (pitch V6 et règles d'honnêteté des chiffres), D-011 (couche indépendante, moindre privilège), D-012 (jeu aveugle de 250 cas, une seule ouverture sur ordre de Titouan), D-013 (cible Fuji reportée, non tranchée). Les lignes existantes n'ont pas été modifiées. L'heure 09:30 est une heure de rangement, pas une heure mesurée.

## 3. Bandeaux « PÉRIMÉ le 11/10/2026 : voir livrables\ »
Posés en tête de 43 fichiers et par ajout visible dans 3 pages HTML sans balise body (`docs/comprendre.html`, `docs/explainer.html`, `docs/dashboard/index.html` : commentaire en tête et bandeau fixe en haut de l'écran). Fichiers concernés : `docs/design/modal/`, `page/`, `v2/`, `v3/`, `v4/` (pages HTML et notes), `docs/design/REGLES_avertissements.md`, `docs/demo/banc/index.html` et `README.md`, `pitch/comprendre_piste4.md`, `pitch/JURY_ATTAQUES.md` (qui portait déjà un bandeau « OBSOLÈTE » : il en a maintenant deux, sans conflit). Déjà bandeautés, laissés tels quels : `docs/architecture.md`, `docs/BRIEF_direction.md`, `docs/intent-barrier.md`, `pitch/track1_4_pitches.md`, `pitch/track1_chiffres_sources.md`. Le reste du contenu n'a pas été modifié.

Non bandeautés (pas de forme possible ou hors règle) : `docs/design/page/sentinelle.css`, `docs/design/v3/A-notice/style.css`, `docs/design/v3/B-cheque/style.css`, `docs/design/v4/R3-figma/style.css` (feuilles de style, l'occurrence de « nonce » ou de nom est dans le code) et `docs/demo/banc/data.json` (données). `docs/design/v3/C-terminal/style.css` et les autres fichiers sans l'ancien nom ni chiffre retiré n'ont pas été touchés. Le critère était la présence de « Sentinelle », « 80,4 », « 81,9 », « 99 % », « nonce » ou « R3 ». Ce critère attrape aussi des faux positifs possibles (« R3 » comme nom de maquette, « nonce » dans du code) : le bandeau y est inoffensif, les maquettes sont de toute façon d'avant le produit figé.

`pitch/DEMO_SCENES.md` a été réaligné sur `research/titouan/PITCH_V6_TITOUAN.md` : trois scènes (50 USDC, signataire aveugle d'après Bybit, « me connecter »), section « Après l'alerte », section « Limites », « chaîne locale pour la démo, Fuji à décider ». À refaire si la V7 change la démo.

## 4. Cohérence README.md et livrables/INSTALLATION.md
Les deux disaient déjà la même chose sur le dossier (`research/titouan/T_banc_e2e/extension_standalone/extension`) et le zip (`research/titouan/T_banc_e2e/dist/hold-up-standalone.zip`). Aucun des deux ne parlait du panneau latéral. Ajouté dans les deux, avec le même texte : un clic sur l'icône de Hold up ouvre le panneau latéral (journal des décisions), les alertes de signature restent dans une fenêtre séparée. Vérifié dans le code : le manifeste autonome déclare `sidePanel`, et `background.js` règle `openPanelOnActionClick: true`. Ajouté aussi la formule Fuji (D-013) dans les deux. Mots interdits retirés au passage (« première limite », « premier plan », « première fois »).

## 5. docs/INDEX.md
Créé : parcours conseillé en huit étapes (README, CHIFFRES, fiche, pitch, démo web, scènes, questions, rapports de mesure), tableau des rapports de mesure avec la ligne de CHIFFRES.md correspondante, liste des documents périmés.

## À vérifier par Titouan
- `livrables/PITCH_5MIN.md`, `PITCH_3MIN.md`, `VIDEO_SCRIPT.md` et `deck/DECK.md` citent encore « pitch V3 corrigé » comme base. Ils sont propres sur le nom et les chiffres, mais pas réalignés sur la V6 ou la V7. Je ne les ai pas touchés (hors consigne).
- Les trois vidéos de `livrables/video/` montrent l'ancien produit. `livrables/VIDEO_SCRIPT.md` le dit déjà.
- `livrables/INSTALLATION.md` section 5 et README : le journal de l'extension autonome reste « non chaîné ». Quand l'agent aura ajouté le journal chaîné au build autonome, mettre à jour ces deux fichiers, PRODUCT.md et `pitch/DEMO_SCENES.md`.
- Le nom Hold up n'est pas vérifié (domaine, magasin d'extensions, marques).
- Les chiffres de tests de README (83 sur 83, 39 sur 39, etc.) viennent d'un relevé antérieur : relancer avant de les citer.

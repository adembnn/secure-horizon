# Rapport MSG-080 et MSG-079 : textes alignés avant le gel

Fait le 11 oct. 2026, vers 11h10 à 11h55. Aucun commit. Aucun processus node lancé. Le deck d'Adem (`livrables/deck/`) et `livrables/pitch_v7/` ne sont pas touchés. `git pull` : déjà à jour.

## Vérifications faites

- `result_avax.json` : 7 103 illimitées sur 20 753 autorisations non nulles, soit 34,23 %, Wilson [33,6 ; 34,9]. Conforme à `METRIQUES.md`.
- Démo web : le bouton garde le libellé « Révoquer ce droit » (`research/titouan/T_banc_e2e/webdemo/js/revoke.js`, ligne 304). Les textes le citent seulement pour la démo web, en secours.
- Extension : dans le code poussé, le panneau dit encore « Révoquer » (`extension_standalone/extension/ui/sidepanel.js`). « Retirer l'autorisation » vient du système de design (`docs/design/system/INTEGRATION.md`). L'habillage d'Adem est en cours. À contrôler avant la scène.
- CHIFFRES.md, lignes A11 et A12 : déjà requalifiées en « chaîne de banc, jeu de réglage ». Elles portent maintenant aussi « RETIRÉ du discours et des livrables ».

## Fichiers changés

- `livrables/PITCH_5MIN.md` : 34 % sur Avalanche à la place de 48 %. Annonce de la slide « La phrase, le code, le cahier » retirée. Repères de temps refaits (fin vers 4:45, Adem jusqu'à 2:35). Cartons renvoyés aux slides 1, 4, 5, 6, 7 et 8 du deck. Écran du piège : « Ça ne correspond pas à ce que tu as écrit. », le gant, « Annuler » et « Limiter à 50 USDC et envoyer ». Scène d'après l'alerte : panneau, « Retirer l'autorisation », slide 4 en secours. « Jamais les montants ni les adresses » corrigé. « Le modèle ne peut pas baisser une alerte » retiré.
- `livrables/PITCH_3MIN.md` : mêmes corrections, plus la cible et le modèle économique de Titouan.
- `livrables/QR_JURY.md` : source METRIQUES.md. Nouvelle question 5 bis sur le 34 %. Question 6 : 49,4 % du contrôle scellé à la place du 38,2 %. Question 9 : nouveaux boutons. Question 26 : temps de METRIQUES.md (2 ms, 387 ms). « Premier » retiré. Où va la phrase et rôle du modèle corrigés.
- `livrables/FICHE_DEFENSE.md` : les 9 corrections de `FICHE_DEFENSE_CORRECTIONS.md` appliquées, plus les nouveaux boutons.
- `livrables/CHIFFRES.md` : METRIQUES.md fait foi. Avalanche seul chiffre dit. B1, B2, B5, B9, B12 marqués « annexe technique, jamais dite ». A11 et A12 marqués retirés. A16, A17, A18, A21 requalifiés. Mesure 1.2 de l'extension (49,4 %) ajoutée. « Premier » retiré.
- `livrables/VIDEO_SCRIPT.md` : écran clé, clic sur « Limiter à 50 USDC et envoyer », panneau « Retirer l'autorisation ». La fiche d'incident est remplacée par le journal. Le 15 % accompagne désormais le 87 %. « Gradient » corrigé en « Gradium ».
- `pitch/DEMO_SCENES.md` : réaligné sur le pitch V7, l'écran clé, D-015 et D-016, et le panneau.
- `README.md`, `PRODUCT.md` : écran clé, boutons, « Retirer l'autorisation », METRIQUES.md comme référence. PRODUCT : mesure de l'extension ajoutée, D-015 et D-016 à jour.
- `livrables/EXPLICABILITE.md` : 38,2 % remplacé par 49,4 % (METRIQUES 1.2).
- `livrables/SLIDE_CONFORMITE.md` : phrase sur le modèle corrigée.
- `livrables/REPETITION_DEMO.md`, `livrables/INSTALLATION.md` : boutons et panneau.
- `livrables/VIDEO_SCRIPT_V8.md`, `VIDEO_SCRIPT_V9.md` : bandeau d'archive, Ethereum retiré.
- `research/titouan/PITCH_V7_TITOUAN.md` : 34 %, boutons, panneau, phrase sur le modèle, bandeau.
- `research/titouan/PITCH_V1` à `V62` : bandeau d'archive, chiffres Ethereum remplacés par le 34 % Avalanche.

Ethereum restant, volontairement : `window.ethereum` et noms d'API (technique). Les lignes d'annexe de `CHIFFRES.md`. Les rapports d'historique (`RAPPORT_MISE_A_JOUR_2.md`). `pitch/JURY_ATTAQUES.md`, déjà marqué obsolète.

## Écarts avec METRIQUES.md

1. Important. « La phrase seule part, jamais les montants ni les adresses » était faux : la phrase contient ce que la personne y écrit. Corrigé partout dans mon périmètre.
2. Important. « Le modèle ne peut pas baisser une alerte du code » est faux pour l'extension (ratés de 2,7 % à 3,7 % avec Clef). Retiré du pitch, requalifié ailleurs.
3. Important. Les textes citaient l'extension à 38,2 % (grille rejouée). METRIQUES.md ne garde que le 49,4 % du contrôle scellé, sur un build en panne. Remplacé.
4. Latence : « médiane sous 50 ms » et « p50 369 ms » venaient du serveur et d'un autre classifieur. Remplacés par 2,0 ms et 387 ms (extension sous Node).
5. Démo : METRIQUES.md parle de « 50 vers 0 » (`preuve_piratage.mjs`). Le pitch dit « Cent, zéro », qui vient de `preuve.mjs` (autre scène, prouvée par DEMO_DEROULE). Gardé, avec le bon script cité dans la fiche.
6. Le temps dans un vrai navigateur (325 à 400 ms) n'est « pas mesuré de façon reproductible » selon METRIQUES.md. Requalifié dans CHIFFRES A21.
7. A5 (157 sur 244) et le tableau grille rejouée ne figurent pas dans METRIQUES.md. Laissés en réponse seulement.

## Comptage des mots dits

Script : texte entre guillemets de la colonne « Texte dit », lignes à repère de temps.

| Fichier | Coupure aux espaces | Apostrophe = coupure | Durée à 130 mots par minute |
|---|---|---|---|
| PITCH_5MIN.md | 551 | 578 | 4 min 14 s à 4 min 27 s, plus environ 30 s de gestes |
| PITCH_3MIN.md | 320 | 333 | 2 min 28 s à 2 min 34 s, plus environ 40 s de gestes |
| VIDEO_SCRIPT.md (voix) | 114 | | environ 53 s sur 180 s |

Les deux comptages du 5 minutes restent sous 580. L'ancien chiffre de 568 utilisait la coupure aux espaces. Le 3 minutes reste juste (environ 3:10 avec les gestes) : coupes prévues dans le fichier.

## Ajout de Titouan (cible et modèle économique)

- Cible, une phrase : « toute personne qui veut garder la main sur ce qu'elle autorise sur la blockchain ». Dite à 0:40 (5 min) et 0:13 (3 min), à la présentation de Hold up. Écrite en tête de la fiche, du README et de PRODUCT.md.
- Modèle économique : la phrase de Titouan, telle quelle, remplace l'ancien (API de verdict, licences, mandats) dans les deux pitchs, la fiche, le README, PRODUCT.md et la question 25 de QR_JURY. Toujours dit comme une hypothèse à valider avec des pilotes. Pas de slide équipe.
- Pour tenir les plafonds sans toucher 34, 87, 65, 15. Coupé dans le 5 minutes : « Même adresse, même bouton », « Hold up lève la main » (le gant reste à l'écran), « ni le téléphone », « écrits par ». Coupé dans le 3 minutes : la phrase sur MetaMask, le plombier, la promesse, le Ledger et la copie locale (gardés en question).

## À trancher par Titouan

- Le 3 minutes dépasse sans doute de 5 à 10 secondes avec les gestes. Coupe suivante prévue : « Critères publics, pas de classement payé », puis la phrase sur le panneau.
- La scène « Continuer » sur l'honnête suppose la nouvelle règle (plus de départ automatique). Si le build ouvre encore le portefeuille seul après une seconde, ne pas le commenter. C'est écrit dans le pitch et dans la répétition.
- Vérifier que le build montré porte bien « Limiter à 50 USDC et envoyer » et « Retirer l'autorisation ». Sinon, montrer la slide 4.

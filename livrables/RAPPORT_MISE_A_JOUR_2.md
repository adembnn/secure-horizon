# Rapport de mise à jour des livrables, passe 2 (11 oct. 2026)

Base : pitch V3 de Titouan (`research/titouan/PITCH_V3_TITOUAN.md`), audit `PITCH_AUDIT.md`, nouvelles mesures (grille, pipeline strict, trafic réel, Z4), produit figé (extension autonome). Aucun code touché, aucun commit, aucun `.env`, aucun paquet installé.

## 1. Fichiers changés

- `livrables/CHIFFRES.md` : un seul tableau (colonnes synthétique, contrôle scellé « mêmes auteurs phrases et règles », données réelles ; source et date par ligne). Ajouts : grille (A11 à A14), pipeline strict avant/après (A15), trafic réel Avalanche et Ethereum (B11, B12), Bybit (B13), 47,6 % et 34,2 % (B1), perte moyenne 790 $ (B3). Retirés ou remplacés : 47,7 % et 34,2 % [33,5 ; 34,8], 0,28 % et 24 sur 33 (ancien filet), 18,39 ms, « grille en cours », 83,8 % apparié à 13,9 %. Une liste « phrases à ne pas dire » ajoutée.
- `livrables/PITCH_5MIN.md` (606 mots dits, compté par script), `PITCH_3MIN.md` (320 mots), `VIDEO_SCRIPT.md` (un seul fichier, 2 min 40).
- `livrables/FICHE_DEFENSE.md` : une page, 555 mots hors barres de tableau (même volume que la version précédente, 9 à 10,5 pt).
- `livrables/QR_JURY.md` : 21 questions. Les cinq demandées sont en tête (« c'est un MetaMask avec des fonctions en plus ? », « et si tout est compromis demain ? », « pourquoi une extension et pas un portefeuille ? », « où va la phrase ? », « les fausses alertes ? »), plus une question sur la modification de la transaction (Q17).
- `livrables/SLIDE_CONFORMITE.md`, `PLAYBOOK_REPONSE.md`, `EXPLICABILITE.md`, `MAPPING_REFERENTIELS.md`, `ARCHITECTURE.md` (une ligne) : latence, journal, rôle du modèle, mesure de la grille.
- Deck : `livrables/deck/build_deck.js`, `DECK.md`, `holdup.pptx` régénéré (9 slides) avec `NODE_PATH=C:\Users\detot\Documents\Ghg_tracker\node_modules` (pptxgenjs déjà présent là, rien installé). Rendu image non vérifié (aucun LibreOffice) : ouvrir dans PowerPoint, surtout slides 2 et 5.
- `livrables/INSTALLATION.md` et `README.md` racine : réécrits pour l'extension autonome sans serveur (mode développeur, « Charger l'extension non empaquetée »), avec une section « Ce qui sort de la machine ».
- `research/titouan/PITCH_V3_TITOUAN.md` : un bandeau en tête (texte d'origine non corrigé, liste des écarts). Le corps n'est pas modifié.

## 2. Où V3 diffère de CHIFFRES.md ou de l'audit, et ce qui a été corrigé

1. « 48 % des droits sont illimités sur Ethereum » : devient 47,6 % [46,9 ; 48,3] Ethereum et 34,2 % Avalanche, « échantillon de blocs, mesure interne, non représentative ». Jamais « la norme ».
2. « Dans les plus gros cas, les signatures de droits de dépense pèsent 38 % des pertes » : faux tel quel (38 % du montant des 11 vols de plus d'un million, Permit et Permit2 seulement). Retiré de l'oral, gardé en B4.
3. « 84 millions à plus de 100 000 victimes » : devient 83,85 millions et 106 106 victimes (ScamSniffer, EVM, borne basse). « La perte moyenne est de 790 dollars » : gardé en table et en fiche, retiré de l'oral du 5 min pour tenir le temps.
4. « Ce qu'ils ne peuvent pas savoir, c'est ce que vous vouliez » : retiré (audit n° 41, formule proche de « MetaMask ne le voit pas »). Remplacé par « d'après leur code public, ils n'interrogent pas sur une demande qu'ils jugent normale ».
5. « Il n'a aucune raison de s'alarmer » (adresse neuve) : devient « au mieux, il signale une adresse sans historique » (audit, scène d'ouverture). Non observé à l'écran : formule « d'après le code public ».
6. « Posée devant MetaMask, Core, Rabby » : devient « pensée pour se poser devant », avec l'aveu qu'aucun vrai portefeuille n'a été essayé.
7. « Du code lit [...] Ça correspond : le portefeuille s'ouvre » conservé ; « Il propose de limiter le droit à 50 » (mauvais verbe, audit n° 19) devient « Il ramène le droit à 50 USDC, ou dit qu'il ne peut pas le limiter quand c'est une signature » (Q17, prouvé en Node seulement : contrôle ajouté à la liste « avant d'entrer »).
8. « Verdict local en 18 millisecondes » : le fichier actuel donne médiane 32,31 ms, p95 47,33 ms. Devient « médiane sous 50 millisecondes, sans l'appel au modèle ».
9. « La phrase, elle, est lue par un modèle hébergé » : vrai seulement avec le relais Clef. Le build autonome n'a aucun réseau (CSP `connect-src 'none'`, client du relais remplacé par un module vide). Dit dans les deux sens.
10. « Nous couvrons les fonctions Detect et Respond » : devient « se rattache à Detect et Respond, sans prétendre à aucune conformité » (cohérent avec la fiche).
11. 0,30 % d'alertes rouges sur 6 325 transactions d'Avalanche : ne se dit plus sans 76,84 % d'avertissements (audit n° 29) et sans « légitime présumé ».
12. Ajouts : contrôle scellé de la grille (86,6 % et 7,7 % ; 86,6 % et 1,3 % ; modèle seul 64,4 %), avec ses limites (même auteur, un seul modèle). Cela lève l'interdit « Clef classe l'intention sans mesure » : la mesure est citée à chaque fois. Aveu de la revue de sécurité dans les limites orales.
13. La phrase d'Adem est gardée en fil conducteur. Sa dernière phrase est présentée comme « notre principe » : ce n'est pas une garantie (une signature ne se limite pas, Hold up alerte et la personne décide ; la revue de sécurité a trouvé des contournements).

## 3. Découvertes à connaître avant de parler

1. **Le journal chaîné par hachage n'existe pas dans le build autonome.** `extension_standalone/extension/gatekeeper.js` (`journalNow`) garde un tableau de 500 lignes dans `chrome.storage.local`, sans chaîne ni hachage. La chaîne, le vérificateur `verify_decision.mjs` et le rejeu sont ceux de la version serveur (`server.mjs`). V3 dit « chaque décision laisse une ligne dans un journal chaîné par hachage ; un auditeur rejoue » : corrigé partout (pitchs, fiche, deck, QR, slide de conformité, playbook, README) en « chaîné dans la version serveur, pas encore dans l'autonome ». À trancher : coder la chaîne dans l'autonome, ou assumer la formulation.
2. **47,6 % ou 47,7 %.** `result_eth.json` donne 10 420 sur 21 866 = 47,65 % [47,0 ; 48,3] ; Z4 écrit 47,6 % [46,9 ; 48,3]. J'ai suivi la consigne (47,6 % [46,9 ; 48,3], source Z4) et noté l'arrondi dans CHIFFRES B1. L'ancien comptage (10 427) est retiré.
3. **Deux paquets zip.** `dist/hold-up-standalone.zip` (reconstruit à 08h14, SHA-256 `811d58177e5a…`) et `hold-up-standalone-3fab41e8.zip` (plus ancien, SHA-256 `f31bccd73f05…`, celui cité par `extension/RAPPORT_CORRECTIFS.md`). L'installation pointe vers le premier. Le SHA-256 est à recalculer après tout nouveau paquet.
4. **La somme des cas du pipeline strict ne tombe pas juste** : 10 437 cas, dont 6 515 arnaques et 2 855 bénins (soit 9 370). Le rapport ne dit pas ce que sont les 1 067 autres. Cité tel quel en A15.
5. **ScamSniffer compte des « victimes »** (Z5, [V]) ; l'ancien CHIFFRES disait « adresses ». J'ai écrit « victimes » partout (README, pitch, deck, QR). À relire à l'URL avant de projeter.
6. La cause des 23 fausses alertes du code seul (grille) est un défaut identifié du produit (`extension/intent_text.js` lit « donner à X le droit » comme un paiement). Le build autonome a ce défaut tant qu'il n'est pas corrigé : le 7,7 % est le chiffre du produit figé, le 1,3 % celui de la version avec Clef.
7. La revue de sécurité n° 2 (`security_review2/REVUE.md`) liste S1 critique, S2 à S4 hautes, plus des hypothèses ; les corrections sont faites par un autre agent. Aucun livrable ne dit « sécurisé ». La section « ce qui sort de la machine » signale deux points de la revue : stockage local lisible par les scripts de contenu (S16) et relais non épinglé à l'identifiant de l'extension (S17).

## 4. Écarts restants (cohérence entre fichiers)

Vérifié par grep sur `livrables/`, `README.md`, `pitch/DEMO_SCENES.md` : un seul jeu de valeurs (47,6 / 34,2 / 83,85 / 106 106 / 71,3 / 13,9 / 54,2 / 228 / 166 / 86,6 / 7,7 / 1,3 / 64,4 / 76,84 / 0,30 / 32,31 / 47,33). Les mots interdits n'apparaissent que dans les listes d'interdits et dans des phrases qui les nient. Aucun tiret long. Les chiffres retirés ne figurent que dans la liste « retirés » de CHIFFRES.md. Écarts qui subsistent :

1. Fichiers périmés hors de ce qui est réécrit (bandeaux déjà posés ou à poser) : `docs/architecture.md`, `docs/BRIEF_direction.md`, `docs/intent-barrier.md`, `docs/comprendre.html`, `docs/explainer.html`, `docs/dashboard/index.html`, `docs/demo/banc/*`, `docs/design/*` (hors v5) contiennent « Sentinelle » et des anciens chiffres (18,39 ms, 45 %, 83,8, 0,28). Non réécrits.
2. `pitch/JURY_ATTAQUES.md`, `pitch/comprendre_piste4.md`, `pitch/track1_chiffres_sources.md`, `pitch/track1_4_pitches.md` : anciens (déjà bannerisés) ; `JURY_ATTAQUES.md` dit « 100 % sur DEV » et « 24/33 ».
3. `research/titouan/W_livrables/*` (cinq brouillons) : « Sentinelle », 0,28 %, « Clef classe l'intention » ; bandeau déjà posé, non réécrits.
4. `PRODUCT.md` (hors périmètre) cite encore Sentinelle et « Démo sur Avalanche Fuji ». `coord/DECISIONS.md` D-007 et D-008 parlent de Fuji.
5. `pitch/DEMO_SCENES.md` : non réécrit dans cette passe (pas de plancher de règles dans la scène 2, pas de contrôle scellé). Rien de faux, mais à aligner.
6. Nombres de tests : README = moteur 288/290, serveur 33/33, extension 83/83, autonome 39/39, contrats 30 ; aucun relancé. Les tests r01 à r04 de la revue échouaient à leur rédaction.
7. Les trois clips de `livrables/video/` montrent l'ancien produit. La vidéo unique n'est pas enregistrée.
8. Disparité CHIFFRES A16 (médiane 32,31 ms) et FICHE (même valeur) contre l'ancien chiffre encore présent dans `research/titouan/W_livrables/FICHE_DEFENSE_DRAFT.md` (30,5 ms) : brouillon périmé.
9. `INSTALL_STANDALONE_FR.md` (dossier de Titouan, hors de mon périmètre) décrit encore des fenêtres « danger » sans la question d'intention ; `INSTALLATION.md` suit `ESSAI_HUMAIN.md`.

## 5. Ce qui manque

1. Un essai avec un vrai portefeuille et un vrai Chrome (aucun résultat consigné) ; vérifier à l'écran la ligne « Droit limité à 50 USDC » de Q17 et la phrase sur MetaMask.
2. Jeu aveugle de 250 cas (autre auteur) ; contrôle de la grille par un autre auteur ; correction du défaut « donner à X le droit ».
3. Corrections de la revue de sécurité, puis rejeu de ses tests. Chaîne de hachage dans le journal de l'autonome, ou formulation assumée.
4. Vidéo unique à enregistrer à la main (script prêt).
5. Rendu du pptx vérifié dans PowerPoint ; fiche d'une page imprimée pour vérifier la mise en page.
6. Textes de loi de la slide de conformité non relus (reprise de la session précédente).
7. Nommage « Hold up » : disponibilité non vérifiée (mémoire du projet).

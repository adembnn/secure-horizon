# Critère 5, Pitch et démo (15 %) : boucle de relecture en juré

Livrables : `livrables/deck/DECK.md`, `livrables/deck/holdup.pptx` (généré par `build_deck.js`), `livrables/PITCH_5MIN.md`, `livrables/PITCH_3MIN.md`, `livrables/VIDEO_SCRIPT.md`, `livrables/QR_JURY.md`.
Notation sur 100, en cinq parties : douleur claire en 30 s (20), preuve par la démo (30), honnêteté des chiffres (20), tenue du format et du temps (15), livrables complets et utilisables (15).

## Passe 1 : premier jet
Score 65. Douleur 17, démo 14, chiffres 15, temps 11, complétude 8.
Preuves : `curl :8800/api/health` ne répond pas, `lab/server/scenarios/` est vide, donc la pièce centrale n'est pas jouable ; aucun rendu visuel du pptx possible (pas de LibreOffice sur la machine, `validate.py` passe) ; slide de conformité en cadre marqué faute de `livrables/SLIDE_CONFORMITE.md` ; question 10 affirmait un écart non vérifié avec Drain't ; la porte RPC n'avait pas de scène.
Corrections : voir passe 2.

## Passe 2
Score 77. Douleur 17, démo 20, chiffres 17, temps 12, complétude 11.
Preuves : `livrables/video/` contient trois films (relevé ffprobe 1280x720 : 30 s, 72 s, 35 s). Le film 1 est le vol réel sur le leurre (2 480 USDC de test), le film 3 la porte RPC avec adresse sosie : intégrés au script vidéo et au pitch. Le film 2 est la démo autonome au portefeuille simulé, que le propriétaire a écartée : marqué « ne pas jouer ». Phrase sur Drain't corrigée, question 4 reformulée.
Reste : le Lab, la slide de conformité, le rendu visuel.

## Passe 3
Score 82. Douleur 18, démo 21, chiffres 18, temps 13, complétude 12.
Preuves : débit de parole mesuré par ligne (moins de 18 mots par 10 s, plafond 25), somme des plans vidéo 2 min 45, aucun tiret long ni formule creuse relevés par grep, plus aucune affirmation « 30 scénarios, la moitié honnêtes » au présent sans vérification de `/api/scenarios`.
Écarts qui empêchent de monter : Lab non lancé à l'heure de la relecture ; plan 4 (extension sur le leurre) non enregistré ; slide 6 en attente du fichier de conformité ; aucun rendu image des slides (à ouvrir dans PowerPoint avant 12h00).

## Chiffres encore « à mesurer »
Résultat du jeu aveugle V1 et V2 ; passage du pipeline produit réel (`RESULTATS_INTEGRATION.md`, `PRODUIT_VS_BANC.md` absents à la relecture) ; run « tout jouer » du Lab ; p95 sur la vraie chaîne ; temps de décision de personnes réelles.

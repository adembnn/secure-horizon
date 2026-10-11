# Passation Titouan vers Adem, n°2 (11/10/2026, ~09h25)
À lire avec A_LIRE_ADEM_EN_PREMIER.md (racine). Aucun agent de Titouan ne tourne quand ce fichier est écrit. Racine de travail : research/titouan/T_banc_e2e/

## État (tout poussé, dernier gel du moteur : commit 74203da)
- Moteur figé (patches de la boucle P01-P05 appliqués). Tests : engine par fichiers verts ; server 33/33 ; presentation 39/39 ; run/check_nohardcode OK.
- JEU AVEUGLE OUVERT UNE FOIS (blind_decalage/run/RESULTAT.md, ne JAMAIS rouvrir) : (a) code seul rappel 87,3 % [81,1 ; 91,7], faux rouges 15,0 % [9,3 ; 23,3] ; (b) Clef+code rappel 88,7 %, faux rouges 16,0 % ; (c) plancher rappel 64,7 %. Critère publié : rappel >= 80 % atteint, faux rouges <= 10 % NON atteint. Point faible par famille : achat NFT à prix quasi nul (11 faux rouges sur 12 bénins), jeton différent (63 % de rappel), chaîne/domaine différent (67 %, tout en invérifiable).
- Pitch : V6 (research/titouan/PITCH_V6_TITOUAN.md). Jurés simulés : V3 57,8 -> V4 68,4 -> V5 74,0. À faire : V7 avec les chiffres du jeu aveugle.
- Extension : journal chaîné dans le build autonome, S1-S19 en grande partie traités, panneau latéral, Q16/Q17. Voir extension/RAPPORT_SECURITE_CORRECTIFS.md.
- Démo web : 13 scènes + « Après l'alerte » (révoquer en un clic, fiche d'incident). webdemo/RAPPORT_REVOQUER.md.

## À FAIRE EN PRIORITÉ (par ordre)
1. extension_standalone : l'équivalence serveur/autonome échoue (32/39 contrôles) car engine/src et run/policy.mjs ont changé après la dernière copie de sentinelle_core.js. Lancer `node server/sync_presentation.mjs --write` (déjà fait une fois), vérifier que sentinelle_core.js reprend les retouches d'evaluate(), puis `node extension_standalone/build_standalone.mjs`, `node extension_standalone/tests/run_tests.mjs`, `powershell -File extension_standalone/package_standalone.ps1`. Même chose pour webdemo : `node webdemo/build_webdemo.mjs` puis `node webdemo/tests/run_webdemo_tests.mjs`.
2. Brancher extension/revoke.js (spec extension/REVOKE_BRANCHEMENT.md) dans l'extension : bouton « Révoquer ce droit » après une alerte.
3. Corriger les familles faibles du jeu aveugle SANS lire blind_decalage/CASES.jsonl : écrire un NOUVEAU jeu de réglage pour « achat NFT / prix quasi nul », « jeton différent », « chaîne/domaine différent » ; corriger sur ce jeu ; mesurer sur un second jeu neuf. Le résultat aveugle publié ne change pas.
4. Pitch V7 + deck + fiche + Q&R avec les chiffres du jeu aveugle (livrables/CHIFFRES.md est la source unique).
5. Essai réel MetaMask : essai_reel/PROTOCOLE_V2.md (Titouan le joue).
6. Ce qui demande ta clé ou ta machine : ancrage Fuji, vidéo unique, contrats de démo, relais Clef (voir A_LIRE_ADEM_EN_PREMIER.md).

## Règles à garder
Jamais de .env dans le dépôt. Jeux scellés fermés : blind_decalage/CASES.jsonl (déjà ouvert une fois), blind_adem/v2/V2_TEST.jsonl (fermé), attacks/TEST.jsonl (contaminé). Le produit ne baisse jamais un verdict, jamais de vert. Pas de « MetaMask ne le voit pas » sans preuve. Pas de « rien ne quitte la machine ». La clé Cloudflare de Titouan est dans son .env local : ne pas la lire ni la copier.
